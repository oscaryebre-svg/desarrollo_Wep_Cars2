const express = require("express");
const connection = require("../db");
const {
  siguienteId,
  camposFaltantes,
  idDelCuerpo,
  normalizarParametros,
  errorServidor,
} = require("../helpers");

const router = express.Router();

// Rutas para la tabla TRACKS (catalogo de pistas).
// Las pistas se relacionan con los juegos en la tabla puente GAME-TRACKS.
// El borrado es logico: Deleted-at guarda la fecha de baja (NULL = activo).
// El id de la pista NUNCA va en la URL: viaja en el body de la peticion.

// Campos que pide la tabla al crear o actualizar.
const CAMPOS_OBLIGATORIOS = ["Track-name", "Track-type"];

// Columna que hace de llave primaria. El id se recibe en el body con ese nombre.
const LLAVE = "Tracks-id";

// Busca pistas activas por nombre. La usa la busqueda por body.
async function buscarPistasPorNombre(nombre) {
  const [filas] = await connection.execute(
    "SELECT * FROM TRACKS WHERE `Track-name` LIKE ? AND `Deleted-at` IS NULL",
    [`%${nombre}%`],
  );

  return filas;
}

// Busca pistas activas por ubicacion. La usa la busqueda por body.
async function buscarPistasPorUbicacion(ubicacion) {
  const [filas] = await connection.execute(
    "SELECT * FROM TRACKS WHERE `Location` LIKE ? AND `Deleted-at` IS NULL",
    [`%${ubicacion}%`],
  );

  return filas;
}

// Juegos a los que pertenece una pista (JOIN con la tabla puente GAME-TRACKS).
// La usan las dos rutas de abajo: la del id en la URL y la del id en el body.
async function buscarJuegosDePista(idPista) {
  const [filas] = await connection.execute(
    `SELECT g.*
       FROM \`GAME-TRACKS\` gt
       JOIN games g ON g.\`id-game-car\` = gt.\`id-game-car\`
      WHERE gt.\`Tracks-id\` = ?
        AND gt.\`Deleted-at\` IS NULL
        AND g.\`Deleted-at\` IS NULL`,
    [idPista],
  );

  return filas;
}

// Lista las pistas activas.
router.get("/", async (req, res) => {
  try {
    const [filas] = await connection.query(
      "SELECT * FROM TRACKS WHERE `Deleted-at` IS NULL",
    );

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al consultar las pistas", error);
  }
});

// Lista todas las pistas, incluso las eliminadas.
router.get("/todos", async (req, res) => {
  try {
    const [filas] = await connection.query("SELECT * FROM TRACKS");

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al consultar las pistas", error);
  }
});

// Busca pistas por nombre con el dato en el body.
router.post("/buscarNm", async (req, res) => {
  // El dato puede no venir en el body: se normaliza antes de validar.
  const nombre = String((req.body ?? {}).nombre ?? "").trim();

  if (!nombre) {
    return res.status(400).json({
      mensaje: "Nombre es obligatorio para buscar pistas",
    });
  }

  try {
    res.json(await buscarPistasPorNombre(nombre));
  } catch (error) {
    errorServidor(res, "Error al buscar pistas por nombre", error);
  }
});

// Busca pistas por ubicacion con el dato en el body.
router.post("/buscarDesc", async (req, res) => {
  // Mismo caso que buscarNm: se normaliza antes de validar.
  const descripcion = String((req.body ?? {}).descripcion ?? "").trim();

  if (!descripcion) {
    return res.status(400).json({
      mensaje: "Descripcion es obligatoria para buscar pistas",
    });
  }

  try {
    res.json(await buscarPistasPorUbicacion(descripcion));
  } catch (error) {
    errorServidor(res, "Error al buscar pistas por descripcion", error);
  }
});

// Obtiene una pista por su id (el id va en el body).
//   POST /api/tracks/buscarPorId   body: { "Tracks-id": 1 }
router.post("/buscarPorId", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para buscar la pista`,
    });
  }

  try {
    const [filas] = await connection.execute(
      "SELECT * FROM TRACKS WHERE `Tracks-id` = ?",
      [id],
    );

    if (filas.length === 0) {
      return res.status(404).json({ mensaje: "Pista no encontrada" });
    }

    res.json(filas[0]);
  } catch (error) {
    errorServidor(res, "Error al consultar la pista", error);
  }
});

// Juegos a los que pertenece una pista (JOIN con la tabla puente GAME-TRACKS).
// Es el camino inverso de POST /api/games/buscarTracks.
// Si la pista no esta vinculada a ningun juego, devuelve un arreglo vacio.
//   POST /api/tracks/buscarJuegos   body: { "Tracks-id": 1 }
router.post("/buscarJuegos", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para buscar los juegos de la pista`,
    });
  }

  try {
    res.json(await buscarJuegosDePista(id));
  } catch (error) {
    errorServidor(res, "Error al consultar los juegos de la pista", error);
  }
});

// Crea una pista.
router.post("/", async (req, res) => {
  let conexion;

  try {
    const cuerpo = req.body ?? {};

    const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

    if (faltantes.length > 0) {
      return res.status(400).json({
        mensaje: `Faltan campos obligatorios de la pista: ${faltantes.join(", ")}`,
      });
    }

    conexion = await connection.getConnection();
    await conexion.beginTransaction();

    const idPista = await siguienteId(conexion, "TRACKS", "Tracks-id");

    await conexion.execute(
      "INSERT INTO TRACKS (`Tracks-id`, `Track-name`, `Location`, `Track-type`, `Length-km`, `difficulty-level`) VALUES (?, ?, ?, ?, ?, ?)",
      normalizarParametros([
        idPista,
        cuerpo["Track-name"],
        cuerpo.Location,
        cuerpo["Track-type"],
        cuerpo["Length-km"],
        cuerpo["difficulty-level"],
      ]),
    );

    await conexion.commit();

    res.status(201).json({ "Tracks-id": idPista, mensaje: "Pista creada" });
  } catch (error) {
    if (conexion) {
      await conexion.rollback();
    }

    errorServidor(res, "Error al crear la pista", error);
  } finally {
    if (conexion) {
      conexion.release();
    }
  }
});

// Actualiza una pista (el id va en el body).
//   PUT /api/tracks   body: { "Tracks-id": 1, "Track-name": "...", ... }
router.put("/", async (req, res) => {
  try {
    const cuerpo = req.body ?? {};
    const id = idDelCuerpo(cuerpo, LLAVE);

    if (id === null) {
      return res.status(400).json({
        mensaje: `${LLAVE} es obligatorio en el body para actualizar la pista`,
      });
    }

    const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

    if (faltantes.length > 0) {
      return res.status(400).json({
        mensaje: `Faltan campos obligatorios de la pista: ${faltantes.join(", ")}`,
      });
    }

    const [resultado] = await connection.execute(
      "UPDATE TRACKS SET `Track-name` = ?, `Location` = ?, `Track-type` = ?, `Length-km` = ?, `difficulty-level` = ? WHERE `Tracks-id` = ?",
      normalizarParametros([
        cuerpo["Track-name"],
        cuerpo.Location,
        cuerpo["Track-type"],
        cuerpo["Length-km"],
        cuerpo["difficulty-level"],
        id,
      ]),
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Pista no encontrada" });
    }

    res.json({ "Tracks-id": id, mensaje: "Pista actualizada" });
  } catch (error) {
    errorServidor(res, "Error al actualizar la pista", error);
  }
});

// Borrado logico de una pista (el id va en el body).
//   DELETE /api/tracks   body: { "Tracks-id": 1 }
router.delete("/", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para eliminar la pista`,
    });
  }

  try {
    const [resultado] = await connection.execute(
      "UPDATE TRACKS SET `Deleted-at` = NOW() WHERE `Tracks-id` = ? AND `Deleted-at` IS NULL",
      [id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "Pista no encontrada o eliminada antes",
      });
    }

    res.json({
      "Tracks-id": id,
      mensaje: "Pista eliminada logicamente",
    });
  } catch (error) {
    errorServidor(res, "Error al eliminar la pista", error);
  }
});

// Restaura una pista eliminada (el id va en el body).
//   PATCH /api/tracks/restaurar   body: { "Tracks-id": 1 }
router.patch("/restaurar", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para restaurar la pista`,
    });
  }

  try {
    const [resultado] = await connection.execute(
      "UPDATE TRACKS SET `Deleted-at` = NULL WHERE `Tracks-id` = ? AND `Deleted-at` IS NOT NULL",
      [id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "Pista no encontrada o ya estaba activa",
      });
    }

    res.json({ "Tracks-id": id, mensaje: "Pista restaurada" });
  } catch (error) {
    errorServidor(res, "Error al restaurar la pista", error);
  }
});

module.exports = router;
