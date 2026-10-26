import express from "express";
import { IsNull, Not } from "typeorm";

import { AppDataSource } from "../data-source";
import { Feature } from "../entities/Feature";
import {
  camposFaltantes,
  errorServidor,
  idValido,
  siguienteId,
} from "../utils/http";

const router = express.Router();

const CAMPOS_OBLIGATORIOS = ["Feature-name"];

function repositorio() {
  return AppDataSource.getRepository(Feature);
}

// Lista las características activas.
router.get("/", async (_req, res) => {
  try {
    res.json(await repositorio().find({ where: { "Deleted-at": IsNull() } }));
  } catch (error) {
    errorServidor(res, "Error al consultar las caracteristicas", error);
  }
});

// Lista todas las características, incluidas las eliminadas.
router.get("/todos", async (_req, res) => {
  try {
    res.json(await repositorio().find());
  } catch (error) {
    errorServidor(res, "Error al consultar las caracteristicas", error);
  }
});

// Obtiene una característica por su id.
router.get("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const caracteristica = await repositorio().findOneBy({ "Features-id": id });

    if (!caracteristica) {
      return res.status(404).json({ mensaje: "Caracteristica no encontrada" });
    }

    res.json(caracteristica);
  } catch (error) {
    errorServidor(res, "Error al consultar la caracteristica", error);
  }
});

// Crea una característica.
router.post("/", async (req, res) => {
  const cuerpo = req.body ?? {};
  const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

  if (faltantes.length > 0) {
    return res.status(400).json({
      mensaje: `Faltan campos obligatorios de la caracteristica: ${faltantes.join(", ")}`,
    });
  }

  try {
    const id = await AppDataSource.transaction(async (manager) => {
      const idCaracteristica = await siguienteId(
        manager,
        "GAMES-FEATURES",
        "Features-id",
      );

      await manager.save(
        manager.create(Feature, {
          "Features-id": idCaracteristica,
          "id-game-car": cuerpo["id-game-car"] ?? null,
          "Feature-name": cuerpo["Feature-name"],
          "Feature-value": cuerpo["Feature-value"] ?? null,
        }),
      );

      return idCaracteristica;
    });

    res.status(201).json({
      "Features-id": id,
      mensaje: "Caracteristica creada",
    });
  } catch (error) {
    errorServidor(res, "Error al crear la caracteristica", error);
  }
});

// Actualiza una característica.
router.put("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  const cuerpo = req.body ?? {};
  const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

  if (faltantes.length > 0) {
    return res.status(400).json({
      mensaje: `Faltan campos obligatorios de la caracteristica: ${faltantes.join(", ")}`,
    });
  }

  try {
    const caracteristica = await repositorio().findOneBy({ "Features-id": id });

    if (!caracteristica) {
      return res.status(404).json({ mensaje: "Caracteristica no encontrada" });
    }

    await repositorio().update(id, {
      "id-game-car": cuerpo["id-game-car"] ?? null,
      "Feature-name": cuerpo["Feature-name"],
      "Feature-value": cuerpo["Feature-value"] ?? null,
    });

    res.json({ "Features-id": id, mensaje: "Caracteristica actualizada" });
  } catch (error) {
    errorServidor(res, "Error al actualizar la caracteristica", error);
  }
});

// Borrado lógico de una característica.
router.delete("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const resultado = await repositorio().update(
      { "Features-id": id, "Deleted-at": IsNull() },
      { "Deleted-at": new Date() },
    );

    if (resultado.affected === 0) {
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

// Restaura una característica eliminada.
router.patch("/:id/restaurar", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const resultado = await repositorio().update(
      { "Features-id": id, "Deleted-at": Not(IsNull()) },
      { "Deleted-at": null },
    );

    if (resultado.affected === 0) {
      return res.status(404).json({
        mensaje: "Caracteristica no encontrada o ya estaba activa",
      });
    }

    res.json({ "Features-id": id, mensaje: "Caracteristica restaurada" });
  } catch (error) {
    errorServidor(res, "Error al restaurar la caracteristica", error);
  }
});

export default router;
