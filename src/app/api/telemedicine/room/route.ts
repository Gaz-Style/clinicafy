import { NextRequest, NextResponse } from 'next/server';
import { updateAppointmentStatus } from '@/lib/db/appointments';
import { persistAuditLog } from '@/lib/db/audit';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DEFAULT_TENANT = process.env.DEFAULT_TENANT_ID ?? 'tenant-andino-01';

/**
 * POST /api/telemedicine/room
 * Crea una sala de telemedicina con Daily.co y retorna URLs + tokens.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appointmentId, patientName, doctorName, expiresInMinutes = 90 } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId es requerido' }, { status: 400 });
    }

    const roomName = `clinicafy-${appointmentId.slice(0, 8)}`;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;

    if (!DAILY_API_KEY) {
      // Demo mode
      const demoUrl = `https://tele.clinicafy.com/room/${roomName}`;
      return NextResponse.json({
        success: true,
        mode: 'demo',
        roomName,
        roomUrl: demoUrl,
        patientToken: `pt_demo_${appointmentId}`,
        practitionerToken: `dt_demo_${appointmentId}`,
        expiresAt: new Date(expiresAt * 1000).toISOString(),
      });
    }

    // 1. Create Daily.co room
    const roomRes = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          exp: expiresAt,
          max_participants: 2,
          enable_recording: 'local', // Recording stored locally (HIPAA compliant)
          enable_chat: true,
          enable_screenshare: false,
          start_video_off: false,
          start_audio_off: true, // Patient starts muted
          lang: 'es',
        },
      }),
    });

    if (!roomRes.ok) {
      const err = await roomRes.json();
      throw new Error(`Daily.co room error: ${err?.error}`);
    }

    const room = await roomRes.json();

    // 2. Create meeting tokens (patient + doctor with different permissions)
    const [patientTokenRes, doctorTokenRes] = await Promise.all([
      fetch('https://api.daily.co/v1/meeting-tokens', {
        method: 'POST',
        headers: { Authorization: `Bearer ${DAILY_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            user_name: patientName ?? 'Paciente',
            exp: expiresAt,
            is_owner: false,
            enable_recording: false,
          },
        }),
      }),
      fetch('https://api.daily.co/v1/meeting-tokens', {
        method: 'POST',
        headers: { Authorization: `Bearer ${DAILY_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            user_name: doctorName ?? 'Médico',
            exp: expiresAt,
            is_owner: true, // Doctor can admit/remove participants
            enable_recording: true,
          },
        }),
      }),
    ]);

    const [patientToken, doctorToken] = await Promise.all([
      patientTokenRes.json(),
      doctorTokenRes.json(),
    ]);

    // 3. Update appointment with room info
    await updateAppointmentStatus(DEFAULT_TENANT, appointmentId, 'confirmed', {
      telemedicine_room_id: roomName,
      telemedicine_room_url: room.url,
    });

    await persistAuditLog({
      tenantId: DEFAULT_TENANT,
      userEmail: 'sistema@clinicafy.com',
      actionType: 'CREATE_ENCOUNTER',
      resourceType: 'TelemedicineRoom',
      resourceId: roomName,
      metadata: { appointmentId, expiresAt: new Date(expiresAt * 1000).toISOString() },
    });

    return NextResponse.json({
      success: true,
      roomName,
      roomUrl: room.url,
      patientToken: patientToken.token,
      practitionerToken: doctorToken.token,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
