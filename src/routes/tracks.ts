import express from "express";
import { IsNull, Like, Not } from "typeorm";

import { AppDataSource } from "../data-source";
import { Track } from "../entities/Track";
import {
  camposFaltantes,
  errorServidor,
  idValido,
  siguienteId,
} from "../utils/http";

const router = express.Router();

const CAMPOS_OBLIGATORIOS = ["Track-name", "Track-type"];

function repositorio() {
  return AppDataSource.getRepository(Track);
}

// Lista las pistas activas.
router.get("/", async (_req, res) => {
  try {
    res.json(await repositorio().find({ where: { "Deleted-at": IsNull() } }));
  } catch (error) {
    errorServidor(res, "Error al consultar las pistas", error);
  }
});

// Lista todas las pistas, incluidas las eliminadas.
router.get("/todos", async (_req, res) => {
  try {
    res.json(await repositorio().find());
  } catch (error) {
    errorServidor(res, "Error al consultar las pistas", error);
  }
});

// Busca pistas activas por nombre.
router.get("/buscar/nombre", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();

    if (!q) {
      return res.status(400).json({
        mensaje: "El parametro 'q' es obligatorio para buscar por nombre",
      });
    }

    res.json(
      await repositorio().find({
        where: { "Track-name": Like(`%${q}%`), "Deleted-at": IsNull() },
      }),
    );
  } catch (error) {
    errorServidor(res, "Error al buscar pistas por nombre", error);
  }
});

// Busca pistas activas por ubicación.
router.get("/buscar/descripcion", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();

    if (!q) {
      return res.status(400).json({
        mensaje: "El parametro 'q' es obligatorio para buscar por descripcion",
      });
    }

    res.json(
      await repositorio().find({
        where: { Location: Like(`%${q}%`), "Deleted-at": IsNull() },
      }),
    );
  } catch (error) {
    errorServidor(res, "Error al buscar pistas por descripcion", error);
  }
});

// Obtiene una pista por su id.
router.get("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const pista = await repositorio().findOneBy({ "Tracks-id": id });

    if (!pista) {
      return res.status(404).json({ mensaje: "Pista no encontrada" });
    }

    res.json(pista);
  } catch (error) {
    errorServidor(res, "Error al consultar la pista", error);
  }
});

// Crea una pista.
router.post("/", async (req, res) => {
  const cuerpo = req.body ?? {};
  const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

  if (faltantes.length > 0) {
    return res.status(400).json({
      mensaje: `Faltan campos obligatorios de la pista: ${faltantes.join(", ")}`,
    });
  }

  try {
    const id = await AppDataSource.transaction(async (manager) => {
      const idPista = await siguienteId(manager, "TRACKS", "Tracks-id");

      await manager.save(
        manager.create(Track, {
          "Tracks-id": idPista,
          "id-game-car": cuerpo["id-game-car"] ?? null,
          "Track-name": cuerpo["Track-name"],
          Location: cuerpo.Location ?? null,
          "Track-type": cuerpo["Track-type"],
          "Length-km": cuerpo["Length-km"] ?? null,
          "difficulty-level": cuerpo["difficulty-level"] ?? null,
        }),
      );

      return idPista;
    });

    res.status(201).json({ "Tracks-id": id, mensaje: "Pista creada" });
  } catch (error) {
    errorServidor(res, "Error al crear la pista", error);
  }
});

// Actualiza una pista.
router.put("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  const cuerpo = req.body ?? {};
  const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

  if (faltantes.length > 0) {
    return res.status(400).json({
      mensaje: `Faltan campos obligatorios de la pista: ${faltantes.join(", ")}`,
    });
  }

  try {
    const pista = await repositorio().findOneBy({ "Tracks-id": id });

    if (!pista) {
      return res.status(404).json({ mensaje: "Pista no encontrada" });
    }

    await repositorio().update(id, {
      "id-game-car": cuerpo["id-game-car"] ?? null,
      "Track-name": cuerpo["Track-name"],
      Location: cuerpo.Location ?? null,
      "Track-type": cuerpo["Track-type"],
      "Length-km": cuerpo["Length-km"] ?? null,
      "difficulty-level": cuerpo["difficulty-level"] ?? null,
    });

    res.json({ "Tracks-id": id, mensaje: "Pista actualizada" });
  } catch (error) {
    errorServidor(res, "Error al actualizar la pista", error);
  }
});

// Borrado lógico de una pista.
router.delete("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const resultado = await repositorio().update(
      { "Tracks-id": id, "Deleted-at": IsNull() },
      { "Deleted-at": new Date() },
    );

    if (resultado.affected === 0) {
      return res.status(404).json({
        mensaje: "Pista no encontrada o eliminada antes",
      });
    }

    res.json({ "Tracks-id": id, mensaje: "Pista eliminada logicamente" });
  } catch (error) {
    errorServidor(res, "Error al eliminar la pista", error);
  }
});

// Restaura una pista eliminada.
router.patch("/:id/restaurar", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const resultado = await repositorio().update(
      { "Tracks-id": id, "Deleted-at": Not(IsNull()) },
      { "Deleted-at": null },
    );

    if (resultado.affected === 0) {
      return res.status(404).json({
        mensaje: "Pista no encontrada o ya estaba activa",
      });
    }

    res.json({ "Tracks-id": id, mensaje: "Pista restaurada" });
  } catch (error) {
    errorServidor(res, "Error al restaurar la pista", error);
  }
});

export default router;
