// ============================================================================
// CLINICAFY — AUTH HELPERS (Supabase + Role Guard)
// ============================================================================
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ClinicalRole, ClinicalUser } from '@/types';

export async function getServerSession() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function requireAuth(allowedRoles?: ClinicalRole[]) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch clinical user profile
  const { data: clinicalUser, error } = await supabase
    .from('clinical_users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !clinicalUser) redirect('/login');
  if (!clinicalUser.is_active) redirect('/login?error=account_inactive');

  if (allowedRoles && !allowedRoles.includes(clinicalUser.role as ClinicalRole)) {
    redirect('/unauthorized');
  }

  return { user, clinicalUser: clinicalUser as ClinicalUser };
}

export const ROLE_PERMISSIONS: Record<ClinicalRole, string[]> = {
  super_admin:          ['*'],
  clinic_admin:         ['appointments.*', 'patients.*', 'reports.*', 'inventory.*', 'staff.*'],
  medical_director:     ['appointments.*', 'patients.*', 'reports.*', 'prescriptions.*'],
  psychiatrist:         ['appointments.read', 'appointments.update', 'patients.*', 'encounters.*', 'prescriptions.*'],
  psychologist:         ['appointments.read', 'appointments.update', 'patients.*', 'encounters.*'],
  general_practitioner: ['appointments.read', 'appointments.update', 'patients.*', 'encounters.*', 'prescriptions.*'],
  nurse:                ['appointments.read', 'patients.read', 'inventory.*'],
  receptionist:         ['appointments.*', 'patients.read', 'patients.create'],
};

export function hasPermission(role: ClinicalRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes('*') || perms.includes(permission) ||
    perms.includes(permission.split('.')[0] + '.*');
}
