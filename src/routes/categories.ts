import express from "express";
import { IsNull, Like, Not } from "typeorm";

import { AppDataSource } from "../data-source";
import { Category } from "../entities/Category";
import {
  camposFaltantes,
  errorServidor,
  idValido,
  siguienteId,
} from "../utils/http";

const router = express.Router();

const CAMPOS_OBLIGATORIOS = ["Name"];

function repositorio() {
  return AppDataSource.getRepository(Category);
}

// Lista las categorías activas.
router.get("/", async (_req, res) => {
  try {
    const categorias = await repositorio().find({
      where: { "Deleted-at": IsNull() },
    });

    res.json(categorias);
  } catch (error) {
    errorServidor(res, "Error al consultar las categorias", error);
  }
});

// Lista todas las categorías, incluidas las eliminadas.
router.get("/todos", async (_req, res) => {
  try {
    res.json(await repositorio().find());
  } catch (error) {
    errorServidor(res, "Error al consultar las categorias", error);
  }
});

// Busca categorías activas por nombre.
router.get("/buscar/nombre", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();

    if (!q) {
      return res.status(400).json({
        mensaje: "El parametro 'q' es obligatorio para buscar por nombre",
      });
    }

    const categorias = await repositorio().find({
      where: { Name: Like(`%${q}%`), "Deleted-at": IsNull() },
    });

    res.json(categorias);
  } catch (error) {
    errorServidor(res, "Error al buscar categorias por nombre", error);
  }
});

// Obtiene una categoría por su id.
router.get("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const categoria = await repositorio().findOneBy({ "Categori-id": id });

    if (!categoria) {
      return res.status(404).json({ mensaje: "Categoria no encontrada" });
    }

    res.json(categoria);
  } catch (error) {
    errorServidor(res, "Error al consultar la categoria", error);
  }
});

// Crea una categoría.
router.post("/", async (req, res) => {
  const cuerpo = req.body ?? {};
  const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

  if (faltantes.length > 0) {
    return res.status(400).json({
      mensaje: `Faltan campos obligatorios de la categoria: ${faltantes.join(", ")}`,
    });
  }

  try {
    const id = await AppDataSource.transaction(async (manager) => {
      const idCategoria = await siguienteId(
        manager,
        "GAME_CATEGORIES",
        "Categori-id",
      );

      await manager.save(
        manager.create(Category, {
          "Categori-id": idCategoria,
          Name: String(cuerpo.Name).trim(),
        }),
      );

      return idCategoria;
    });

    res.status(201).json({
      "Categori-id": id,
      mensaje: "Categoria creada",
    });
  } catch (error) {
    errorServidor(res, "Error al crear la categoria", error);
  }
});

// Actualiza una categoría.
router.put("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  const cuerpo = req.body ?? {};
  const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

  if (faltantes.length > 0) {
    return res.status(400).json({
      mensaje: `Faltan campos obligatorios de la categoria: ${faltantes.join(", ")}`,
    });
  }

  try {
    const categoria = await repositorio().findOneBy({ "Categori-id": id });

    if (!categoria) {
      return res.status(404).json({ mensaje: "Categoria no encontrada" });
    }

    await repositorio().update(id, { Name: String(cuerpo.Name).trim() });

    res.json({ "Categori-id": id, mensaje: "Categoria actualizada" });
  } catch (error) {
    errorServidor(res, "Error al actualizar la categoria", error);
  }
});

// Borrado lógico de una categoría.
router.delete("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const resultado = await repositorio().update(
      { "Categori-id": id, "Deleted-at": IsNull() },
      { "Deleted-at": new Date() },
    );

    if (resultado.affected === 0) {
      return res.status(404).json({
        mensaje: "Categoria no encontrada o eliminada antes",
      });
    }

    res.json({ "Categori-id": id, mensaje: "Categoria eliminada logicamente" });
  } catch (error) {
    errorServidor(res, "Error al eliminar la categoria", error);
  }
});

// Restaura una categoría eliminada.
router.patch("/:id/restaurar", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const resultado = await repositorio().update(
      { "Categori-id": id, "Deleted-at": Not(IsNull()) },
      { "Deleted-at": null },
    );

    if (resultado.affected === 0) {
      return res.status(404).json({
        mensaje: "Categoria no encontrada o ya estaba activa",
      });
    }

    res.json({ "Categori-id": id, mensaje: "Categoria restaurada" });
  } catch (error) {
    errorServidor(res, "Error al restaurar la categoria", error);
  }
});

export default router;
