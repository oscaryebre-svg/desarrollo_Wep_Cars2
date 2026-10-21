const express = require("express");
const connection = require("../db");
const {
  camposFaltantes,
  idDelCuerpo,
  normalizarParametros,
  errorServidor,
} = require("../helpers");

const router = express.Router();

// Rutas para la tabla intermedia GAME-CARS (relacion juegos <-> coches).
// Cada fila es un coche dentro de un juego, con sus estadisticas
// (max-speed, Aceleration, handling, Rarity, Unlockable).
// El borrado es logico: Deleted-at guarda la fecha de baja (NULL = activo).
// El id del vinculo NUNCA va en la URL: viaja en el body de la peticion.

// Campos que pide la tabla al crear o actualizar.
const CAMPOS_OBLIGATORIOS = ["id-game-car", "Car-id"];

// Columna que hace de llave primaria. El id se recibe en el body con ese nombre.
const LLAVE = "Game-car-id";

// Lista los vinculos activos.
router.get("/", async (req, res) => {
  try {
    const [filas] = await connection.query(
      "SELECT * FROM `GAME-CARS` WHERE `Deleted-at` IS NULL",
    );

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al consultar los coches del juego", error);
  }
});

// Lista todos los vinculos, incluso los eliminados.
router.get("/todos", async (req, res) => {
  try {
    const [filas] = await connection.query("SELECT * FROM `GAME-CARS`");

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al consultar los coches del juego", error);
  }
});

// Obtiene un vinculo por su id (el id va en el body).
//   POST /api/cars/buscarPorId   body: { "Game-car-id": 1 }
router.post("/buscarPorId", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para buscar el vinculo`,
    });
  }

  try {
    const [filas] = await connection.execute(
      "SELECT * FROM `GAME-CARS` WHERE `Game-car-id` = ?",
      [id],
    );

    if (filas.length === 0) {
      return res.status(404).json({ mensaje: "Vinculo no encontrado" });
    }

    res.json(filas[0]);
  } catch (error) {
    errorServidor(res, "Error al consultar el vinculo", error);
  }
});

// Crea un vinculo (un coche dentro de un juego).
// El id lo genera MySQL: Game-car-id es AUTO_INCREMENT.
router.post("/", async (req, res) => {
  try {
    const cuerpo = req.body ?? {};

    const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

    if (faltantes.length > 0) {
      return res.status(400).json({
        mensaje: `Faltan campos obligatorios del vinculo: ${faltantes.join(", ")}`,
      });
    }

    const [resultado] = await connection.execute(
      "INSERT INTO `GAME-CARS` (`id-game-car`, `Car-id`, `max-speed`, `Aceleration`, `handling`, `Rarity`, `Unlockable`) VALUES (?, ?, ?, ?, ?, ?, ?)",
      normalizarParametros([
        cuerpo["id-game-car"],
        cuerpo["Car-id"],
        cuerpo["max-speed"],
        cuerpo.Aceleration,
        cuerpo.handling,
        cuerpo.Rarity,
        cuerpo.Unlockable,
      ]),
    );

    res.status(201).json({
      "Game-car-id": resultado.insertId,
      mensaje: "Coche agregado al juego",
    });
  } catch (error) {
    errorServidor(res, "Error al agregar el coche al juego", error);
  }
});

// Actualiza un vinculo (el id va en el body).
//   PUT /api/cars   body: { "Game-car-id": 1, "id-game-car": 1, "Car-id": 2, ... }
router.put("/", async (req, res) => {
  try {
    const cuerpo = req.body ?? {};
    const id = idDelCuerpo(cuerpo, LLAVE);

    if (id === null) {
      return res.status(400).json({
        mensaje: `${LLAVE} es obligatorio en el body para actualizar el vinculo`,
      });
    }

    const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

    if (faltantes.length > 0) {
      return res.status(400).json({
        mensaje: `Faltan campos obligatorios del vinculo: ${faltantes.join(", ")}`,
      });
    }

    const [resultado] = await connection.execute(
      "UPDATE `GAME-CARS` SET `id-game-car` = ?, `Car-id` = ?, `max-speed` = ?, `Aceleration` = ?, `handling` = ?, `Rarity` = ?, `Unlockable` = ? WHERE `Game-car-id` = ?",
      normalizarParametros([
        cuerpo["id-game-car"],
        cuerpo["Car-id"],
        cuerpo["max-speed"],
        cuerpo.Aceleration,
        cuerpo.handling,
        cuerpo.Rarity,
        cuerpo.Unlockable,
        id,
      ]),
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Vinculo no encontrado" });
    }

    res.json({ "Game-car-id": id, mensaje: "Vinculo actualizado" });
  } catch (error) {
    errorServidor(res, "Error al actualizar el vinculo", error);
  }
});

// Borrado logico de un vinculo (el id va en el body).
//   DELETE /api/cars   body: { "Game-car-id": 1 }
router.delete("/", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para eliminar el vinculo`,
    });
  }

  try {
    const [resultado] = await connection.execute(
      "UPDATE `GAME-CARS` SET `Deleted-at` = NOW() WHERE `Game-car-id` = ? AND `Deleted-at` IS NULL",
      [id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "Vinculo no encontrado o eliminado antes",
      });
    }

    res.json({
      "Game-car-id": id,
      mensaje: "Vinculo eliminado logicamente",
    });
  } catch (error) {
    errorServidor(res, "Error al eliminar el vinculo", error);
  }
});

// Restaura un vinculo eliminado (el id va en el body).
//   PATCH /api/cars/restaurar   body: { "Game-car-id": 1 }
router.patch("/restaurar", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para restaurar el vinculo`,
    });
  }

  try {
    const [resultado] = await connection.execute(
      "UPDATE `GAME-CARS` SET `Deleted-at` = NULL WHERE `Game-car-id` = ? AND `Deleted-at` IS NOT NULL",
      [id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "Vinculo no encontrado o ya estaba activo",
      });
    }

    res.json({ "Game-car-id": id, mensaje: "Vinculo restaurado" });
  } catch (error) {
    errorServidor(res, "Error al restaurar el vinculo", error);
  }
});

module.exports = router;
