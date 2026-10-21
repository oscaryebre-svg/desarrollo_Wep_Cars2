// Archivo con funciones que usan todas las rutas.

// Saca el siguiente id de una tabla.
// Las tablas de Car_2 no son AUTO_INCREMENT, por eso se usa MAX(columna) + 1.
async function siguienteId(conexion, tabla, columnaLlave) {
  const [[fila]] = await conexion.query(
    `SELECT COALESCE(MAX(\`${columnaLlave}\`), 0) + 1 AS siguiente FROM \`${tabla}\``,
  );

  return fila.siguiente;
}

// Devuelve los campos obligatorios que faltan en el body.
function camposFaltantes(cuerpo, obligatorios) {
  return obligatorios.filter(
    (campo) =>
      cuerpo[campo] === undefined ||
      cuerpo[campo] === null ||
      (typeof cuerpo[campo] === "string" && cuerpo[campo].trim() === ""),
  );
}

// Saca el id que viene en el body. El id ya no viaja en la URL: todas las
// consultas por id lo reciben en el cuerpo. Devuelve null si no vino.
function idDelCuerpo(cuerpo, columnaLlave) {
  const valor = (cuerpo ?? {})[columnaLlave];

  if (
    valor === undefined ||
    valor === null ||
    (typeof valor === "string" && valor.trim() === "")
  ) {
    return null;
  }

  return valor;
}

// mysql2 (execute) no acepta undefined como parametro, por eso lo cambia
// por null. Asi los campos opcionales que no vengan se guardan como NULL.
function normalizarParametros(valores) {
  return valores.map((valor) => (valor === undefined ? null : valor));
}

// Manda un error 500 en formato JSON.
function errorServidor(res, mensaje, error) {
  console.error(`${mensaje}:`, error);

  res.status(500).json({
    mensaje: mensaje,
    error: error,
    codigo: error.code,
    stack: error.stack,
  });
}

module.exports = {
  siguienteId,
  camposFaltantes,
  idDelCuerpo,
  normalizarParametros,
  errorServidor,
};
