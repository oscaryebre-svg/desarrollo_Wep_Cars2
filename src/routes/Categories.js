const express = require("express");
const connection = require("../db");
const {
  siguienteId,
  camposFaltantes,
  idDelCuerpo,
  errorServidor,
} = require("../helpers");

const router = express.Router();

// Rutas para la tabla GAME_CATEGORIES (categorias de los juegos).
// El borrado es logico: Deleted-at guarda la fecha de baja (NULL = activo).
// El id de la categoria NUNCA va en la URL: viaja en el body de la peticion.

// Campos que pide la tabla al crear o actualizar.
const CAMPOS_OBLIGATORIOS = ["Name"];

// Columna que hace de llave primaria. El id se recibe en el body con ese nombre.
const LLAVE = "Categori-id";

// Lista las categorias activas.
router.get("/", async (req, res) => {
  try {
    const [filas] = await connection.query(
      "SELECT * FROM GAME_CATEGORIES WHERE `Deleted-at` IS NULL",
    );

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al consultar las categorias", error);
  }
});

// Lista todas las categorias, incluso las eliminadas.
router.get("/todos", async (req, res) => {
  try {
    const [filas] = await connection.query("SELECT * FROM GAME_CATEGORIES");

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al consultar las categorias", error);
  }
});

// Busca categorias por nombre con el dato en el body.
router.post("/buscar", async (req, res) => {
  // El dato puede no venir en el body: se normaliza antes de validar.
  const nombre = String((req.body ?? {}).nombre ?? "").trim();

  if (!nombre) {
    return res.status(400).json({
      mensaje: "Nombre es obligatorio para buscar categorias",
    });
  }

  try {
    const [filas] = await connection.execute(
      "SELECT * FROM GAME_CATEGORIES WHERE `Name` LIKE ? AND `Deleted-at` IS NULL",
      [`%${nombre}%`],
    );

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al buscar categorias por nombre", error);
  }
});

// Obtiene una categoria por su id (el id va en el body).
//   POST /api/categories/buscarPorId   body: { "Categori-id": 1 }
router.post("/buscarPorId", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para buscar la categoria`,
    });
  }

  try {
    const [filas] = await connection.execute(
      "SELECT * FROM GAME_CATEGORIES WHERE `Categori-id` = ?",
      [id],
    );

    if (filas.length === 0) {
      return res.status(404).json({ mensaje: "Categoria no encontrada" });
    }

    res.json(filas[0]);
  } catch (error) {
    errorServidor(res, "Error al consultar la categoria", error);
  }
});

// Crea una categoria.
router.post("/", async (req, res) => {
  let conexion;

  try {
    const cuerpo = req.body ?? {};

    const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

    if (faltantes.length > 0) {
      return res.status(400).json({
        mensaje: `Faltan campos obligatorios de la categoria: ${faltantes.join(", ")}`,
      });
    }

    conexion = await connection.getConnection();
    await conexion.beginTransaction();

    const idCategoria = await siguienteId(
      conexion,
      "GAME_CATEGORIES",
      "Categori-id",
    );

    await conexion.execute(
      "INSERT INTO GAME_CATEGORIES (`Categori-id`, `Name`) VALUES (?, ?)",
      [idCategoria, cuerpo.Name],
    );

    await conexion.commit();

    res.status(201).json({
      "Categori-id": idCategoria,
      mensaje: "Categoria creada",
    });
  } catch (error) {
    if (conexion) {
      await conexion.rollback();
    }

    errorServidor(res, "Error al crear la categoria", error);
  } finally {
    if (conexion) {
      conexion.release();
    }
  }
});

// Actualiza una categoria (el id va en el body).
//   PUT /api/categories   body: { "Categori-id": 1, "Name": "..." }
router.put("/", async (req, res) => {
  try {
    const cuerpo = req.body ?? {};
    const id = idDelCuerpo(cuerpo, LLAVE);

    if (id === null) {
      return res.status(400).json({
        mensaje: `${LLAVE} es obligatorio en el body para actualizar la categoria`,
      });
    }

    const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

    if (faltantes.length > 0) {
      return res.status(400).json({
        mensaje: `Faltan campos obligatorios de la categoria: ${faltantes.join(", ")}`,
      });
    }

    const [resultado] = await connection.execute(
      "UPDATE GAME_CATEGORIES SET `Name` = ? WHERE `Categori-id` = ?",
      [cuerpo.Name, id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Categoria no encontrada" });
    }

    res.json({
      "Categori-id": id,
      mensaje: "Categoria actualizada",
    });
  } catch (error) {
    errorServidor(res, "Error al actualizar la categoria", error);
  }
});

// Borrado logico de una categoria (el id va en el body).
//   DELETE /api/categories   body: { "Categori-id": 1 }
router.delete("/", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para eliminar la categoria`,
    });
  }

  try {
    const [resultado] = await connection.execute(
      "UPDATE GAME_CATEGORIES SET `Deleted-at` = NOW() WHERE `Categori-id` = ? AND `Deleted-at` IS NULL",
      [id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "Categoria no encontrada o eliminada antes",
      });
    }

    res.json({
      "Categori-id": id,
      mensaje: "Categoria eliminada logicamente",
    });
  } catch (error) {
    errorServidor(res, "Error al eliminar la categoria", error);
  }
});

// Restaura una categoria eliminada (el id va en el body).
//   PATCH /api/categories/restaurar   body: { "Categori-id": 1 }
router.patch("/restaurar", async (req, res) => {
  const id = idDelCuerpo(req.body, LLAVE);

  if (id === null) {
    return res.status(400).json({
      mensaje: `${LLAVE} es obligatorio en el body para restaurar la categoria`,
    });
  }

  try {
    const [resultado] = await connection.execute(
      "UPDATE GAME_CATEGORIES SET `Deleted-at` = NULL WHERE `Categori-id` = ? AND `Deleted-at` IS NOT NULL",
      [id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "Categoria no encontrada o ya estaba activa",
      });
    }

    res.json({
      "Categori-id": id,
      mensaje: "Categoria restaurada",
    });
  } catch (error) {
    errorServidor(res, "Error al restaurar la categoria", error);
  }
});

module.exports = router;
