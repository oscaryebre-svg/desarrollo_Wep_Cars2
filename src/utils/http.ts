import type { Response } from "express";
import type { EntityManager } from "typeorm";

// Las tablas de Car_2 no usan AUTO_INCREMENT: la llave se calcula con
// MAX(columna) + 1 dentro de la misma transacción que hace el INSERT.
export async function siguienteId(
  manager: EntityManager,
  tabla: string,
  columna: string,
): Promise<number> {
  const filas: Array<{ siguiente: string | number }> = await manager.query(
    `SELECT COALESCE(MAX(\`${columna}\`), 0) + 1 AS siguiente FROM \`${tabla}\``,
  );

  return Number(filas[0].siguiente);
}

// Devuelve los campos obligatorios que no llegaron en el body.
export function camposFaltantes(
  cuerpo: Record<string, unknown> | undefined,
  obligatorios: string[],
): string[] {
  const datos = cuerpo ?? {};

  return obligatorios.filter((campo) => {
    const valor = datos[campo];

    return (
      valor === undefined ||
      valor === null ||
      (typeof valor === "string" && valor.trim() === "")
    );
  });
}

// Responde un 500 con el mismo formato para todas las rutas. El detalle
// técnico queda en la consola del servidor, no en la respuesta al cliente.
export function errorServidor(
  res: Response,
  mensaje: string,
  error: unknown,
): void {
  console.error(`${mensaje}:`, error);

  const codigo = (error as { code?: string } | null)?.code;

  res.status(500).json({ mensaje, codigo });
}

// Valida un id numérico (positivo) que llega por la URL.
export function idValido(valor: string): number | null {
  const id = Number(valor);

  return Number.isInteger(id) && id > 0 ? id : null;
}
