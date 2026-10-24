// ============================================================================
// CLINICAFY — DATA ACCESS LAYER: INVENTORY
// ============================================================================
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import type { InventoryItem } from '@/types';

async function getSupabase() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

export async function getInventoryByBranch(tenantId: string, branchId: string): Promise<InventoryItem[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('branch_id', branchId)
    .order('name');
  if (error) throw new Error(`getInventoryByBranch: ${error.message}`);
  return (data ?? []).map(r => ({
    id: r.id,
    sku: r.sku,
    name: r.name,
    currentStock: r.current_stock,
    minStockAlert: r.min_stock_alert,
    unit: r.unit,
    branchId: r.branch_id,
  }));
}

export async function deductInventoryItem(
  tenantId: string,
  branchId: string,
  sku: string,
  quantity: number,
  encounterId: string,
  recordedByUserId: string
): Promise<{ newStock: number; isAlert: boolean }> {
  const supabase = await getSupabase();

  // Get current item
  const { data: item, error: fetchErr } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('branch_id', branchId)
    .eq('sku', sku)
    .single();

  if (fetchErr || !item) throw new Error(`Item ${sku} not found`);

  const newStock = Math.max(0, item.current_stock - quantity);
  const isAlert = newStock <= item.min_stock_alert;

  // Atomic update
  const { error: updateErr } = await supabase
    .from('inventory_items')
    .update({ current_stock: newStock })
    .eq('id', item.id);

  if (updateErr) throw new Error(`deductInventoryItem: ${updateErr.message}`);

  // Movement log
  await supabase.from('inventory_movements').insert({
    tenant_id: tenantId,
    item_id: item.id,
    encounter_id: encounterId || null,
    quantity_changed: -quantity,
    movement_type: 'clinical_consumption',
    recorded_by: recordedByUserId,
  });

  return { newStock, isAlert };
}

export async function getLowStockAlerts(tenantId: string, branchId: string): Promise<InventoryItem[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('branch_id', branchId)
    .filter('current_stock', 'lte', 'min_stock_alert');
  if (error) throw new Error(`getLowStockAlerts: ${error.message}`);
  return (data ?? []).map(r => ({
    id: r.id, sku: r.sku, name: r.name,
    currentStock: r.current_stock, minStockAlert: r.min_stock_alert,
    unit: r.unit, branchId: r.branch_id,
  }));
}
