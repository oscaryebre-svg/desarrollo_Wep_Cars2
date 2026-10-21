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

// Rutas para la tabla FEATURES (catalogo de caracteristicas).
// Se relacionan con los juegos en la tabla puente GAME-FEATURES.
// El borrado es logico: Deleted-at guarda la fecha de baja (NULL = activo).
// El id de la caracteristica NUNCA va en la URL: viaja en el body de la peticion.

// Campos que pide la tabla al crear o actualizar.
const CAMPOS_OBLIGATORIOS = ["Feature-name"];

// Columna que hace de llave primaria. El id se recibe en el body con ese nombre.
const LLAVE = "Features-id";

// Lista las caracteristicas activas.
router.get("/", async (req, res) => {
  try {
    const [filas] = await connection.query(
      "SELECT * FROM `FEATURES` WHERE `Deleted-at` IS NULL",
    );

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al consultar las caracteristicas", error);
  }
});

// Lista todas las caracteristicas, incluso las eliminadas.
router.get("/todos", async (req, res) => {
  try {
    const [filas] = await connection.query("SELECT * FROM `FEATURES`");

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al consultar las caracteristicas", error);
  }
});

// Obtiene una caracteristica por su id (el id va en el body).
//   POST /api/features/buscarPorId   body: { "Features-id": 1 }
router.post("/buscarPorId", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para buscar la caracteristica`,
    });
  }

  try {
    const [filas] = await connection.execute(
      "SELECT * FROM `FEATURES` WHERE `Features-id` = ?",
      [id],
    );

    if (filas.length === 0) {
      return res.status(404).json({ mensaje: "Caracteristica no encontrada" });
    }

    res.json(filas[0]);
  } catch (error) {
    errorServidor(res, "Error al consultar la caracteristica", error);
  }
});

// Crea una caracteristica.
router.post("/", async (req, res) => {
  let conexion;

  try {
    const cuerpo = req.body ?? {};

    const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

    if (faltantes.length > 0) {
      return res.status(400).json({
        mensaje: `Faltan campos obligatorios de la caracteristica: ${faltantes.join(", ")}`,
      });
    }

    conexion = await connection.getConnection();
    await conexion.beginTransaction();

    const idCaracteristica = await siguienteId(
      conexion,
      "FEATURES",
      "Features-id",
    );

    await conexion.execute(
      "INSERT INTO `FEATURES` (`Features-id`, `Feature-name`, `Feature-value`) VALUES (?, ?, ?)",
      normalizarParametros([
        idCaracteristica,
        cuerpo["Feature-name"],
        cuerpo["Feature-value"],
      ]),
    );

    await conexion.commit();

    res.status(201).json({
      "Features-id": idCaracteristica,
      mensaje: "Caracteristica creada",
    });
  } catch (error) {
    if (conexion) {
      await conexion.rollback();
    }

    errorServidor(res, "Error al crear la caracteristica", error);
  } finally {
    if (conexion) {
      conexion.release();
    }
  }
});

// Actualiza una caracteristica (el id va en el body).
//   PUT /api/features   body: { "Features-id": 1, "Feature-name": "..." }
router.put("/", async (req, res) => {
  try {
    const cuerpo = req.body ?? {};
    const id = idDelCuerpo(cuerpo, LLAVE);

    if (id === null) {
      return res.status(400).json({
        mensaje: `${LLAVE} es obligatorio en el body para actualizar la caracteristica`,
      });
    }

    const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

    if (faltantes.length > 0) {
      return res.status(400).json({
        mensaje: `Faltan campos obligatorios de la caracteristica: ${faltantes.join(", ")}`,
      });
    }

    const [resultado] = await connection.execute(
      "UPDATE `FEATURES` SET `Feature-name` = ?, `Feature-value` = ? WHERE `Features-id` = ?",
      normalizarParametros([
        cuerpo["Feature-name"],
        cuerpo["Feature-value"],
        id,
      ]),
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Caracteristica no encontrada" });
    }

    res.json({
      "Features-id": id,
      mensaje: "Caracteristica actualizada",
    });
  } catch (error) {
    errorServidor(res, "Error al actualizar la caracteristica", error);
  }
});

// Borrado logico de una caracteristica (el id va en el body).
//   DELETE /api/features   body: { "Features-id": 1 }
router.delete("/", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para eliminar la caracteristica`,
    });
  }

  try {
    const [resultado] = await connection.execute(
      "UPDATE `FEATURES` SET `Deleted-at` = NOW() WHERE `Features-id` = ? AND `Deleted-at` IS NULL",
      [id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "Caracteristica no encontrada o eliminada antes",
      });
    }

    res.json({
      "Features-id": id,
      mensaje: "Caracteristica eliminada logicamente",
    });
  } catch (error) {
    errorServidor(res, "Error al eliminar la caracteristica", error);
  }
});

// Restaura una caracteristica eliminada (el id va en el body).
//   PATCH /api/features/restaurar   body: { "Features-id": 1 }
router.patch("/restaurar", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para restaurar la caracteristica`,
    });
  }

  try {
    const [resultado] = await connection.execute(
      "UPDATE `FEATURES` SET `Deleted-at` = NULL WHERE `Features-id` = ? AND `Deleted-at` IS NOT NULL",
      [id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "Caracteristica no encontrada o ya estaba activa",
      });
    }

    res.json({
      "Features-id": id,
      mensaje: "Caracteristica restaurada",
    });
  } catch (error) {
    errorServidor(res, "Error al restaurar la caracteristica", error);
  }
});

module.exports = router;
