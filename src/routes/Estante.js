const express = require("express");
const connection = require("../db");
const { errorServidor } = require("../helpers");

const router = express.Router();

// Ruta para la vista estante (solo lectura).
// La vista es el JOIN entre games y GAME_CATEGORIES, y trae el resumen
// que se usa en las tarjetas del catalogo: game_id, Title, Desc_resumen,
// Categoria e Image_portada.

// Lista el contenido de la vista.
router.get("/", async (req, res) => {
  try {
    const [filas] = await connection.query("SELECT * FROM estante");

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al consultar la vista estante", error);
  }
});

module.exports = router;
