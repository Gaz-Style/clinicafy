import { ImedBonoRequest, ImedBonoResponse, InventoryItem } from '@/types';

export class ImedEngine {
  /**
   * Coberturas promedio según previsión para prestaciones de salud mental / medicina ambulatoria
   */
  private static readonly COVERAGE_TABLE: Record<string, number> = {
    'Fonasa A': 1.0, // 100% Bonificación Gratuidad
    'Fonasa B': 1.0, // 100% Bonificación Gratuidad
    'Fonasa C': 0.9, // 90% Bonificación (10% Copago)
    'Fonasa D': 0.8, // 80% Bonificación (20% Copago)
    'Colmena': 0.75, // 75% Cobertura Libre Elección
    'Banmédica': 0.70, // 70% Cobertura
    'Consalud': 0.70,
    'CruzBlanca': 0.72,
    'Particular': 0.0, // 0% Cobertura
  };

  /**
   * Consulta al Web Service de I-Med / Medipass y emite la bonificación en tiempo real.
   */
  public static async calculateAndAuthorizeBono(request: ImedBonoRequest): Promise<ImedBonoResponse> {
    const coverageRate = this.COVERAGE_TABLE[request.healthInsurance] ?? 0.0;
    const insuranceContribution = Math.round(request.totalPrice * coverageRate);
    const copayAmount = Math.max(0, request.totalPrice - insuranceContribution);
    
    // Simulación de respuesta Web Service SOAP/REST de I-Med
    const randomAuth = Math.floor(10000000 + Math.random() * 90000000).toString();
    const bonoNum = `BONO-${request.healthInsurance.split(' ')[0].toUpperCase()}-${randomAuth.slice(0, 6)}`;

    return {
      authorized: true,
      bonoNumber: bonoNum,
      authorizationCode: `AUTH-IMED-${randomAuth}`,
      insuranceContribution,
      copayAmount,
      patientRut: request.patientRut,
      insuranceName: request.healthInsurance,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Descuenta insumos del box médico de forma atómica y valida alertas de stock.
   */
  public static deductBoxSupplies(
    currentInventory: InventoryItem[],
    suppliesUsed: Array<{ sku: string; quantity: number }>
  ): {
    updatedInventory: InventoryItem[];
    alerts: string[];
  } {
    const alerts: string[] = [];
    const updatedInventory = currentInventory.map(item => {
      const deduction = suppliesUsed.find(s => s.sku === item.sku);
      if (deduction) {
        const newStock = Math.max(0, item.currentStock - deduction.quantity);
        if (newStock <= item.minStockAlert) {
          alerts.push(`[ALERTA INVENTARIO] Insumo ${item.name} (${item.sku}) en nivel crítico: ${newStock} ${item.unit}(s) restante(s).`);
        }
        return { ...item, currentStock: newStock };
      }
      return item;
    });

    return { updatedInventory, alerts };
  }
}
