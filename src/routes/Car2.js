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

// Rutas para la tabla games (el catalogo principal de juegos de carreras).
// Tambien maneja los vinculos del juego con TRACKS y FEATURES (tablas puente).
// El borrado es logico: Deleted-at guarda la fecha de baja (NULL = activo).
// El id del juego NUNCA va en la URL: viaja en el body de la peticion.

// Campos que pide la tabla games al crear o actualizar.
const CAMPOS_OBLIGATORIOS = [
  "Title",
  "Relace_date",
  "Price",
  "Developer",
  "Publisher",
  "Rating",
  "Platform",
  "Game_mode",
];

// Columna que hace de llave primaria. El id se recibe en el body con ese nombre.
const LLAVE = "id-game-car";

// Revisa que el body traiga los campos obligatorios.
function validarJuego(cuerpo) {
  const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

  if (faltantes.length > 0) {
    return `Faltan campos obligatorios del juego: ${faltantes.join(", ")}`;
  }

  return null;
}

// Busca juegos activos por nombre. La usa la busqueda por body.
async function buscarJuegosPorNombre(nombre) {
  const [filas] = await connection.execute(
    `SELECT g.*, c.Name AS Categoria
       FROM games g
       LEFT JOIN GAME_CATEGORIES c
         ON g.\`Categori-id\` = c.\`Categori-id\`
      WHERE g.\`Title\` LIKE ? AND g.\`Deleted-at\` IS NULL`,
    [`%${nombre}%`],
  );

  return filas;
}

// Busca juegos activos por descripcion. La usa la busqueda por body.
async function buscarJuegosPorDescripcion(descripcion) {
  const [filas] = await connection.execute(
    `SELECT g.*, c.Name AS Categoria
       FROM games g
       LEFT JOIN GAME_CATEGORIES c
         ON g.\`Categori-id\` = c.\`Categori-id\`
      WHERE g.\`Desc\` LIKE ? AND g.\`Deleted-at\` IS NULL`,
    [`%${descripcion}%`],
  );

  return filas;
}

// Lista los juegos activos (con el nombre de la categoria).
router.get("/", async (req, res) => {
  try {
    const [filas] = await connection.query(
      `SELECT g.*, c.Name AS Categoria
         FROM games g
         LEFT JOIN GAME_CATEGORIES c
           ON g.\`Categori-id\` = c.\`Categori-id\`
        WHERE g.\`Deleted-at\` IS NULL`,
    );

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al consultar los juegos", error);
  }
});

// Lista todos los juegos, incluso los eliminados.
router.get("/todos", async (req, res) => {
  try {
    const [filas] = await connection.query(
      `SELECT g.*, c.Name AS Categoria
         FROM games g
         LEFT JOIN GAME_CATEGORIES c
           ON g.\`Categori-id\` = c.\`Categori-id\``,
    );

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al consultar los juegos", error);
  }
});

// Busca juegos por nombre con el dato en el body.
router.post("/buscarNm", async (req, res) => {
  // El dato puede no venir en el body: se convierte a texto y se recortan los
  // espacios ANTES de usarlo (antes se hacia nombre.trim() y eso tiraba el
  // proceso cuando el body venia vacio).
  const nombre = String((req.body ?? {}).nombre ?? "").trim();

  if (!nombre) {
    return res.status(400).json({
      mensaje: "Nombre es obligatorio para buscar juegos",
    });
  }

  try {
    res.json(await buscarJuegosPorNombre(nombre));
  } catch (error) {
    errorServidor(res, "Error al buscar juegos por nombre", error);
  }
});

// Busca juegos por descripcion con el dato en el body.
router.post("/buscarDesc", async (req, res) => {
  // Mismo caso que buscarNm: se normaliza antes de validar.
  const descripcion = String((req.body ?? {}).descripcion ?? "").trim();

  if (!descripcion) {
    return res.status(400).json({
      mensaje: "Descripcion es obligatoria para buscar juegos",
    });
  }

  try {
    res.json(await buscarJuegosPorDescripcion(descripcion));
  } catch (error) {
    errorServidor(res, "Error al buscar juegos por descripcion", error);
  }
});

// Obtiene un juego por su id (el id va en el body).
//   POST /api/games/buscarPorId   body: { "id-game-car": 1 }
router.post("/buscarPorId", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para buscar el juego`,
    });
  }

  try {
    const [filas] = await connection.execute(
      `SELECT g.*, c.Name AS Categoria
         FROM games g
         LEFT JOIN GAME_CATEGORIES c
           ON g.\`Categori-id\` = c.\`Categori-id\`
        WHERE g.\`id-game-car\` = ?`,
      [id],
    );

    if (filas.length === 0) {
      return res.status(404).json({ mensaje: "Juego no encontrado" });
    }

    res.json(filas[0]);
  } catch (error) {
    errorServidor(res, "Error al consultar el juego", error);
  }
});

// Pistas de un juego (JOIN con la tabla puente GAME-TRACKS).
//   POST /api/games/buscarTracks   body: { "id-game-car": 1 }
router.post("/buscarTracks", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para buscar las pistas del juego`,
    });
  }

  try {
    const [filas] = await connection.execute(
      `SELECT t.*
         FROM \`GAME-TRACKS\` gt
         JOIN TRACKS t ON t.\`Tracks-id\` = gt.\`Tracks-id\`
        WHERE gt.\`id-game-car\` = ?
          AND gt.\`Deleted-at\` IS NULL
          AND t.\`Deleted-at\` IS NULL`,
      [id],
    );

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al consultar las pistas del juego", error);
  }
});

// Caracteristicas de un juego (JOIN con la tabla puente GAME-FEATURES).
//   POST /api/games/buscarFeatures   body: { "id-game-car": 1 }
router.post("/buscarFeatures", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para buscar las caracteristicas del juego`,
    });
  }

  try {
    const [filas] = await connection.execute(
      `SELECT f.*
         FROM \`GAME-FEATURES\` gf
         JOIN FEATURES f ON f.\`Features-id\` = gf.\`Features-id\`
        WHERE gf.\`id-game-car\` = ?
          AND gf.\`Deleted-at\` IS NULL
          AND f.\`Deleted-at\` IS NULL`,
      [id],
    );

    res.json(filas);
  } catch (error) {
    errorServidor(
      res,
      "Error al consultar las caracteristicas del juego",
      error,
    );
  }
});

// Crea un juego.
// Si el body trae los arreglos tracks o features (ids del catalogo), crea los vinculos.
router.post("/", async (req, res) => {
  let conexion;

  try {
    const cuerpo = req.body ?? {};

    const mensajeValidacion = validarJuego(cuerpo);

    if (mensajeValidacion) {
      return res.status(400).json({ mensaje: mensajeValidacion });
    }

    conexion = await connection.getConnection();
    await conexion.beginTransaction();

    const idJuego = await siguienteId(conexion, "games", "id-game-car");

    await conexion.execute(
      "INSERT INTO games (`id-game-car`, `Title`, `Desc`, `Relace_date`, `Price`, `Developer`, `Publisher`, `Rating`, `Platform`, `Game_mode`, `Categori-id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      normalizarParametros([
        idJuego,
        cuerpo.Title,
        cuerpo.Desc,
        cuerpo.Relace_date,
        cuerpo.Price,
        cuerpo.Developer,
        cuerpo.Publisher,
        cuerpo.Rating,
        cuerpo.Platform,
        cuerpo.Game_mode,
        cuerpo["Categori-id"],
      ]),
    );

    // Vinculos con pistas del catalogo (opcional): "tracks": [1, 2, 3].
    const pistas = Array.isArray(cuerpo.tracks) ? cuerpo.tracks : [];

    if (pistas.length > 0) {
      const valoresPistas = pistas.map((idPista) => [idJuego, idPista]);

      await conexion.query(
        "INSERT INTO `GAME-TRACKS` (`id-game-car`, `Tracks-id`) VALUES ?",
        [valoresPistas],
      );
    }

    // Vinculos con caracteristicas del catalogo (opcional): "features": [4, 5].
    const caracteristicas = Array.isArray(cuerpo.features)
      ? cuerpo.features
      : [];

    if (caracteristicas.length > 0) {
      const valoresCaracteristicas = caracteristicas.map((idCaracteristica) => [
        idJuego,
        idCaracteristica,
      ]);

      await conexion.query(
        "INSERT INTO `GAME-FEATURES` (`id-game-car`, `Features-id`) VALUES ?",
        [valoresCaracteristicas],
      );
    }

    await conexion.commit();

    res.status(201).json({
      "id-game-car": idJuego,
      mensaje: "Juego creado",
      tracks: pistas.length,
      features: caracteristicas.length,
    });
  } catch (error) {
    if (conexion) {
      await conexion.rollback();
    }

    errorServidor(res, "Error al crear el juego", error);
  } finally {
    if (conexion) {
      conexion.release();
    }
  }
});

// Actualiza un juego (el id va en el body).
// Si el body trae tracks o features (ids del catalogo), reemplaza los vinculos.
//   PUT /api/games   body: { "id-game-car": 1, "Title": "...", ... }
router.put("/", async (req, res) => {
  let conexion;

  try {
    const cuerpo = req.body ?? {};
    const id = idDelCuerpo(cuerpo, LLAVE);

    if (id === null) {
      return res.status(400).json({
        mensaje: `${LLAVE} es obligatorio en el body para actualizar el juego`,
      });
    }

    const mensajeValidacion = validarJuego(cuerpo);

    if (mensajeValidacion) {
      return res.status(400).json({ mensaje: mensajeValidacion });
    }

    conexion = await connection.getConnection();
    await conexion.beginTransaction();

    // Revisa que el juego exista antes de actualizar.
    const [existe] = await conexion.execute(
      "SELECT `id-game-car` FROM games WHERE `id-game-car` = ?",
      [id],
    );

    if (existe.length === 0) {
      await conexion.rollback();

      return res.status(404).json({ mensaje: "Juego no encontrado" });
    }

    await conexion.execute(
      "UPDATE games SET `Title` = ?, `Desc` = ?, `Relace_date` = ?, `Price` = ?, `Developer` = ?, `Publisher` = ?, `Rating` = ?, `Platform` = ?, `Game_mode` = ?, `Categori-id` = ? WHERE `id-game-car` = ?",
      normalizarParametros([
        cuerpo.Title,
        cuerpo.Desc,
        cuerpo.Relace_date,
        cuerpo.Price,
        cuerpo.Developer,
        cuerpo.Publisher,
        cuerpo.Rating,
        cuerpo.Platform,
        cuerpo.Game_mode,
        cuerpo["Categori-id"],
        id,
      ]),
    );

    // Reemplaza los vinculos con pistas (solo si vienen en el body).
    if (Array.isArray(cuerpo.tracks)) {
      await conexion.execute(
        "DELETE FROM `GAME-TRACKS` WHERE `id-game-car` = ?",
        [id],
      );

      if (cuerpo.tracks.length > 0) {
        const valoresPistas = cuerpo.tracks.map((idPista) => [id, idPista]);

        await conexion.query(
          "INSERT INTO `GAME-TRACKS` (`id-game-car`, `Tracks-id`) VALUES ?",
          [valoresPistas],
        );
      }
    }

    // Reemplaza los vinculos con caracteristicas (solo si vienen en el body).
    if (Array.isArray(cuerpo.features)) {
      await conexion.execute(
        "DELETE FROM `GAME-FEATURES` WHERE `id-game-car` = ?",
        [id],
      );

      if (cuerpo.features.length > 0) {
        const valoresCaracteristicas = cuerpo.features.map(
          (idCaracteristica) => [id, idCaracteristica],
        );

        await conexion.query(
          "INSERT INTO `GAME-FEATURES` (`id-game-car`, `Features-id`) VALUES ?",
          [valoresCaracteristicas],
        );
      }
    }

    await conexion.commit();

    res.json({ "id-game-car": id, mensaje: "Juego actualizado" });
  } catch (error) {
    if (conexion) {
      await conexion.rollback();
    }

    errorServidor(res, "Error al actualizar el juego", error);
  } finally {
    if (conexion) {
      conexion.release();
    }
  }
});

// Borrado logico de un juego (y de sus vinculos).
//   DELETE /api/games   body: { "id-game-car": 1 }
router.delete("/", async (req, res) => {
  let conexion;

  try {
    const id = idDelCuerpo(req.body, LLAVE);

    if (id === null) {
      return res.status(400).json({
        mensaje: `${LLAVE} es obligatorio en el body para eliminar el juego`,
      });
    }

    conexion = await connection.getConnection();
    await conexion.beginTransaction();

    const [resultado] = await conexion.execute(
      "UPDATE games SET `Deleted-at` = NOW() WHERE `id-game-car` = ? AND `Deleted-at` IS NULL",
      [id],
    );

    if (resultado.affectedRows === 0) {
      await conexion.rollback();

      return res.status(404).json({
        mensaje: "Juego no encontrado o eliminado antes",
      });
    }

    // Baja logica de los vinculos con pistas y caracteristicas.
    await conexion.execute(
      "UPDATE `GAME-TRACKS` SET `Deleted-at` = NOW() WHERE `id-game-car` = ? AND `Deleted-at` IS NULL",
      [id],
    );
    await conexion.execute(
      "UPDATE `GAME-FEATURES` SET `Deleted-at` = NOW() WHERE `id-game-car` = ? AND `Deleted-at` IS NULL",
      [id],
    );

    await conexion.commit();

    res.json({
      "id-game-car": id,
      mensaje: "Juego eliminado logicamente",
    });
  } catch (error) {
    if (conexion) {
      await conexion.rollback();
    }

    errorServidor(res, "Error al eliminar el juego", error);
  } finally {
    if (conexion) {
      conexion.release();
    }
  }
});

// Restaura un juego eliminado (y sus vinculos).
//   PATCH /api/games/restaurar   body: { "id-game-car": 1 }
router.patch("/restaurar", async (req, res) => {
  let conexion;

  try {
    const id = idDelCuerpo(req.body, LLAVE);

    if (id === null) {
      return res.status(400).json({
        mensaje: `${LLAVE} es obligatorio en el body para restaurar el juego`,
      });
    }

    conexion = await connection.getConnection();
    await conexion.beginTransaction();

    const [resultado] = await conexion.execute(
      "UPDATE games SET `Deleted-at` = NULL WHERE `id-game-car` = ? AND `Deleted-at` IS NOT NULL",
      [id],
    );

    if (resultado.affectedRows === 0) {
      await conexion.rollback();

      return res.status(404).json({
        mensaje: "Juego no encontrado o ya estaba activo",
      });
    }

    // Reactiva los vinculos con pistas y caracteristicas.
    await conexion.execute(
      "UPDATE `GAME-TRACKS` SET `Deleted-at` = NULL WHERE `id-game-car` = ?",
      [id],
    );
    await conexion.execute(
      "UPDATE `GAME-FEATURES` SET `Deleted-at` = NULL WHERE `id-game-car` = ?",
      [id],
    );

    await conexion.commit();

    res.json({
      "id-game-car": id,
      mensaje: "Juego restaurado",
    });
  } catch (error) {
    if (conexion) {
      await conexion.rollback();
    }

    errorServidor(res, "Error al restaurar el juego", error);
  } finally {
    if (conexion) {
      conexion.release();
    }
  }
});

module.exports = router;
