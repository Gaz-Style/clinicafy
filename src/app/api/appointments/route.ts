import { NextRequest, NextResponse } from 'next/server';
import { getAppointments, createAppointment } from '@/lib/db/appointments';
import { ImedEngine } from '@/services/imed-engine';
import { AutomationEngine } from '@/services/automation-service';
import { persistAuditLog } from '@/lib/db/audit';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

const DEFAULT_TENANT = process.env.DEFAULT_TENANT_ID ?? 'tenant-andino-01';

/**
 * GET /api/appointments — Lista citas con filtros opcionales
 * POST /api/appointments — Crea una nueva cita con cálculo de bono I-Med
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const practitionerId = searchParams.get('practitionerId') ?? undefined;
  const patientId = searchParams.get('patientId') ?? undefined;
  const dateFrom = searchParams.get('dateFrom') ?? undefined;
  const dateTo = searchParams.get('dateTo') ?? undefined;
  const status = searchParams.get('status') ?? undefined;

  try {
    const appointments = await getAppointments(DEFAULT_TENANT, {
      practitionerId, patientId, dateFrom, dateTo, status,
    });
    return NextResponse.json({ appointments });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      branchId,
      patientId,
      practitionerId,
      patientRut,
      patientName,
      patientEmail,
      patientPhone,
      healthInsurance,
      scheduledAt,
      durationMinutes = 50,
      modality = 'telemedicine',
      specialty,
      reasonForVisit,
      allergiesDeclared,
      medicationsDeclared,
      totalAmount = 45000,
      prestacionCode = '0901001',
      doctorName,
      appointmentDateFormatted,
    } = body;

    // 1. Calculate I-Med bono
    const bonoResult = await ImedEngine.calculateAndAuthorizeBono({
      patientRut: patientRut ?? '',
      healthInsurance: healthInsurance ?? 'Particular',
      prestacionCode,
      totalPrice: totalAmount,
    });

    // 2. Create appointment in DB
    const appointment = await createAppointment(DEFAULT_TENANT, {
      branchId: branchId ?? 'default-branch',
      patientId,
      practitionerId,
      scheduledAt,
      durationMinutes,
      modality,
      specialty,
      reasonForVisit,
      allergiesDeclared,
      medicationsDeclared,
      totalAmount,
      copayAmount: bonoResult.copayAmount,
      insuranceName: bonoResult.insuranceName,
      insuranceContribution: bonoResult.insuranceContribution,
    });

    // 3. Send WhatsApp confirmation (fire-and-forget)
    if (patientPhone && patientName) {
      AutomationEngine.dispatchWhatsAppReminder({
        patientPhone,
        patientName,
        doctorName: doctorName ?? 'Su médico tratante',
        appointmentDate: appointmentDateFormatted ?? scheduledAt,
        telemedicineLink: modality === 'telemedicine'
          ? `https://tele.clinicafy.com/room/${appointment.id}`
          : undefined,
      }).catch(() => {}); // Non-blocking
    }

    // 4. Send email confirmation (fire-and-forget)
    if (patientEmail && patientName) {
      AutomationEngine.sendAppointmentConfirmationEmail({
        patientEmail,
        patientName,
        doctorName: doctorName ?? 'Su médico tratante',
        appointmentDate: appointmentDateFormatted ?? scheduledAt,
        appointmentId: appointment.id,
        telemedicineLink: modality === 'telemedicine'
          ? `https://tele.clinicafy.com/room/${appointment.id}`
          : undefined,
        copayAmount: bonoResult.copayAmount,
      }).catch(() => {});
    }

    // 5. Audit log
    await persistAuditLog({
      tenantId: DEFAULT_TENANT,
      userEmail: 'sistema@clinicafy.com',
      actionType: 'CREATE_ENCOUNTER',
      resourceType: 'Appointment',
      resourceId: appointment.id,
      patientId,
      metadata: {
        scheduledAt,
        modality,
        specialty,
        bonoNumber: bonoResult.bonoNumber,
        copayAmount: bonoResult.copayAmount,
      },
    });

    return NextResponse.json({
      success: true,
      appointment,
      bono: bonoResult,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
