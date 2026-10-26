import express from "express";

import { AppDataSource } from "../data-source";
import { errorServidor } from "../utils/http";

const router = express.Router();

// La vista `estante` es el JOIN entre games y GAME_CATEGORIES. Se consulta
// completa porque su único propósito es alimentar las tarjetas del catálogo.
router.get("/", async (_req, res) => {
  try {
    const filas = await AppDataSource.query("SELECT * FROM estante");

    res.json(filas);
  } catch (error) {
    errorServidor(res, "Error al consultar la vista estante", error);
  }
});

export default router;
