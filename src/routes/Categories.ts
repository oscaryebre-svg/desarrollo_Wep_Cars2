import express from "express";
import { IsNull } from "typeorm";

import { AppDataSource } from "../data-source";
import { Category } from "../entities/Categories";

const router = express.Router();

// Lista las categorías activas.
router.get("/", async (req, res) => {
  try {
    const categoriaRepository = AppDataSource.getRepository(Category);

    const categorias = await categoriaRepository.find({
      where: {
        "Deleted-at": IsNull(),
      },
    });

    res.json(categorias);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al consultar las categorias",
    });
  }
});

// Lista todas las categorías, incluidas las dadas de baja.
router.get("/todos", async (req, res) => {
  try {
    const categoriaRepository = AppDataSource.getRepository(Category);

    const categorias = await categoriaRepository.find();

    res.json(categorias);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al consultar las categorias",
    });
  }
});

export default router;
