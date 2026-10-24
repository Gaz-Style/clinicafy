import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/db/appointments';

/**
 * GET /api/availability?practitionerId=&branchId=&date=YYYY-MM-DD
 * Retorna los slots disponibles de un médico para una fecha dada.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const practitionerId = searchParams.get('practitionerId');
  const branchId = searchParams.get('branchId');
  const date = searchParams.get('date');

  if (!practitionerId || !branchId || !date) {
    return NextResponse.json(
      { error: 'practitionerId, branchId y date son requeridos' },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlots(practitionerId, branchId, date);
    return NextResponse.json({ slots });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
