import express from "express";
import { IsNull, Like, Not } from "typeorm";

import { AppDataSource } from "../data-source";
import { Car } from "../entities/Car";
import { camposFaltantes, errorServidor, idValido } from "../utils/http";

const router = express.Router();

const CAMPOS_OBLIGATORIOS = ["Car-name", "Manufacturer"];

function repositorio() {
  return AppDataSource.getRepository(Car);
}

function anioValido(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === "") {
    return null;
  }

  const anio = Number(valor);

  return Number.isInteger(anio) ? anio : NaN;
}

// Lista los autos activos.
router.get("/", async (_req, res) => {
  try {
    res.json(await repositorio().find({ where: { "Deleted-at": IsNull() } }));
  } catch (error) {
    errorServidor(res, "Error al consultar los autos", error);
  }
});

// Lista todos los autos, incluidos los eliminados.
router.get("/todos", async (_req, res) => {
  try {
    res.json(await repositorio().find());
  } catch (error) {
    errorServidor(res, "Error al consultar los autos", error);
  }
});

// Busca autos activos por nombre.
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
        where: { "Car-name": Like(`%${q}%`), "Deleted-at": IsNull() },
      }),
    );
  } catch (error) {
    errorServidor(res, "Error al buscar autos por nombre", error);
  }
});

// Busca autos activos por fabricante.
router.get("/buscar/fabricante", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();

    if (!q) {
      return res.status(400).json({
        mensaje: "El parametro 'q' es obligatorio para buscar por fabricante",
      });
    }

    res.json(
      await repositorio().find({
        where: { Manufacturer: Like(`%${q}%`), "Deleted-at": IsNull() },
      }),
    );
  } catch (error) {
    errorServidor(res, "Error al buscar autos por fabricante", error);
  }
});

// Obtiene un auto por su id.
router.get("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const auto = await repositorio().findOneBy({ "Car-id": id });

    if (!auto) {
      return res.status(404).json({ mensaje: "Auto no encontrado" });
    }

    res.json(auto);
  } catch (error) {
    errorServidor(res, "Error al consultar el auto", error);
  }
});

// Crea un auto. El id lo genera AUTO_INCREMENT.
router.post("/", async (req, res) => {
  const cuerpo = req.body ?? {};
  const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

  if (faltantes.length > 0) {
    return res.status(400).json({
      mensaje: `Faltan campos obligatorios del auto: ${faltantes.join(", ")}`,
    });
  }

  const anio = anioValido(cuerpo.Year);

  if (Number.isNaN(anio)) {
    return res
      .status(400)
      .json({ mensaje: "El anio debe ser un numero entero" });
  }

  try {
    const auto = await repositorio().save(
      repositorio().create({
        "Car-name": String(cuerpo["Car-name"]).trim(),
        Manufacturer: String(cuerpo.Manufacturer).trim(),
        Year: anio,
        "Car-class": cuerpo["Car-class"]
          ? String(cuerpo["Car-class"]).trim()
          : null,
      }),
    );

    res.status(201).json({
      "Car-id": auto["Car-id"],
      mensaje: "Auto creado",
    });
  } catch (error) {
    errorServidor(res, "Error al crear el auto", error);
  }
});

// Actualiza un auto.
router.put("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  const cuerpo = req.body ?? {};
  const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

  if (faltantes.length > 0) {
    return res.status(400).json({
      mensaje: `Faltan campos obligatorios del auto: ${faltantes.join(", ")}`,
    });
  }

  const anio = anioValido(cuerpo.Year);

  if (Number.isNaN(anio)) {
    return res
      .status(400)
      .json({ mensaje: "El anio debe ser un numero entero" });
  }

  try {
    const auto = await repositorio().findOneBy({ "Car-id": id });

    if (!auto) {
      return res.status(404).json({ mensaje: "Auto no encontrado" });
    }

    await repositorio().update(id, {
      "Car-name": String(cuerpo["Car-name"]).trim(),
      Manufacturer: String(cuerpo.Manufacturer).trim(),
      Year: anio,
      "Car-class": cuerpo["Car-class"]
        ? String(cuerpo["Car-class"]).trim()
        : null,
    });

    res.json({ "Car-id": id, mensaje: "Auto actualizado" });
  } catch (error) {
    errorServidor(res, "Error al actualizar el auto", error);
  }
});

// Borrado lógico de un auto.
router.delete("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const resultado = await repositorio().update(
      { "Car-id": id, "Deleted-at": IsNull() },
      { "Deleted-at": new Date() },
    );

    if (resultado.affected === 0) {
      return res.status(404).json({
        mensaje: "Auto no encontrado o eliminado antes",
      });
    }

    res.json({ "Car-id": id, mensaje: "Auto eliminado logicamente" });
  } catch (error) {
    errorServidor(res, "Error al eliminar el auto", error);
  }
});

// Restaura un auto eliminado.
router.patch("/:id/restaurar", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const resultado = await repositorio().update(
      { "Car-id": id, "Deleted-at": Not(IsNull()) },
      { "Deleted-at": null },
    );

    if (resultado.affected === 0) {
      return res.status(404).json({
        mensaje: "Auto no encontrado o ya estaba activo",
      });
    }

    res.json({ "Car-id": id, mensaje: "Auto restaurado" });
  } catch (error) {
    errorServidor(res, "Error al restaurar el auto", error);
  }
});

export default router;
