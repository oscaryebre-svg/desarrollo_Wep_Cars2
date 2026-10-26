import express from "express";
import { EntityManager, IsNull, Like, Not } from "typeorm";

import { AppDataSource } from "../data-source";
import { Category } from "../entities/Category";
import { Feature } from "../entities/Feature";
import { Game } from "../entities/Game";
import { Track } from "../entities/Track";
import {
  camposFaltantes,
  errorServidor,
  idValido,
  siguienteId,
} from "../utils/http";

const router = express.Router();

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

function repositorio() {
  return AppDataSource.getRepository(Game);
}

// Une cada juego con el nombre de su categoría, igual que hacía el JOIN
// original (columna calculada `Categoria`).
async function conCategoria(juegos: Game[]) {
  const categorias = await AppDataSource.getRepository(Category).find();
  const nombres = new Map(
    categorias.map((categoria) => [categoria["Categori-id"], categoria.Name]),
  );

  return juegos.map((juego) => ({
    ...juego,
    Categoria:
      juego["Categori-id"] === null
        ? null
        : (nombres.get(juego["Categori-id"]) ?? null),
  }));
}

async function crearPistas(
  manager: EntityManager,
  idJuego: number,
  pistas: Array<Record<string, unknown>>,
) {
  for (const pista of pistas) {
    const idPista = await siguienteId(manager, "TRACKS", "Tracks-id");

    await manager.save(
      manager.create(Track, {
        "Tracks-id": idPista,
        "id-game-car": idJuego,
        "Track-name": pista["Track-name"] as string,
        Location: (pista.Location as string) ?? null,
        "Track-type": pista["Track-type"] as string,
        "Length-km": (pista["Length-km"] as string) ?? null,
        "difficulty-level": (pista["difficulty-level"] as string) ?? null,
      }),
    );
  }
}

async function crearCaracteristicas(
  manager: EntityManager,
  idJuego: number,
  caracteristicas: Array<Record<string, unknown>>,
) {
  for (const caracteristica of caracteristicas) {
    const idCaracteristica = await siguienteId(
      manager,
      "GAMES-FEATURES",
      "Features-id",
    );

    await manager.save(
      manager.create(Feature, {
        "Features-id": idCaracteristica,
        "id-game-car": idJuego,
        "Feature-name": caracteristica["Feature-name"] as string,
        "Feature-value": (caracteristica["Feature-value"] as string) ?? null,
      }),
    );
  }
}

// Lista los juegos activos con el nombre de su categoría.
router.get("/", async (_req, res) => {
  try {
    const juegos = await repositorio().find({
      where: { "Deleted-at": IsNull() },
    });

    res.json(await conCategoria(juegos));
  } catch (error) {
    errorServidor(res, "Error al consultar los juegos", error);
  }
});

// Lista todos los juegos, incluidos los eliminados.
router.get("/todos", async (_req, res) => {
  try {
    res.json(await conCategoria(await repositorio().find()));
  } catch (error) {
    errorServidor(res, "Error al consultar los juegos", error);
  }
});

// Busca juegos activos por título.
router.get("/buscar/nombre", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();

    if (!q) {
      return res.status(400).json({
        mensaje: "El parametro 'q' es obligatorio para buscar por nombre",
      });
    }

    const juegos = await repositorio().find({
      where: { Title: Like(`%${q}%`), "Deleted-at": IsNull() },
    });

    res.json(await conCategoria(juegos));
  } catch (error) {
    errorServidor(res, "Error al buscar juegos por nombre", error);
  }
});

// Busca juegos activos por descripción.
router.get("/buscar/descripcion", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();

    if (!q) {
      return res.status(400).json({
        mensaje: "El parametro 'q' es obligatorio para buscar por descripcion",
      });
    }

    const juegos = await repositorio().find({
      where: { Desc: Like(`%${q}%`), "Deleted-at": IsNull() },
    });

    res.json(await conCategoria(juegos));
  } catch (error) {
    errorServidor(res, "Error al buscar juegos por descripcion", error);
  }
});

// Obtiene un juego por su id.
router.get("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const juego = await repositorio().findOneBy({ "id-game-car": id });

    if (!juego) {
      return res.status(404).json({ mensaje: "Juego no encontrado" });
    }

    const [conNombre] = await conCategoria([juego]);

    res.json(conNombre);
  } catch (error) {
    errorServidor(res, "Error al consultar el juego", error);
  }
});

// Crea un juego. Si el body trae `tracks` o `features`, se guardan en la
// misma transacción; si algo falla, no queda nada a medias.
router.post("/", async (req, res) => {
  const cuerpo = req.body ?? {};
  const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

  if (faltantes.length > 0) {
    return res.status(400).json({
      mensaje: `Faltan campos obligatorios del juego: ${faltantes.join(", ")}`,
    });
  }

  const pistas = Array.isArray(cuerpo.tracks) ? cuerpo.tracks : [];
  const caracteristicas = Array.isArray(cuerpo.features)
    ? cuerpo.features
    : [];

  try {
    const id = await AppDataSource.transaction(async (manager) => {
      const idJuego = await siguienteId(manager, "games", "id-game-car");

      await manager.save(
        manager.create(Game, {
          "id-game-car": idJuego,
          Title: cuerpo.Title,
          Desc: cuerpo.Desc ?? null,
          Relace_date: cuerpo.Relace_date,
          Price: cuerpo.Price,
          Developer: cuerpo.Developer,
          Publisher: cuerpo.Publisher,
          Rating: cuerpo.Rating,
          Platform: cuerpo.Platform,
          Game_mode: cuerpo.Game_mode,
          "Categori-id": cuerpo["Categori-id"] ?? null,
          "Image-fondo": cuerpo["Image-fondo"] ?? null,
          "Image-portada": cuerpo["Image-portada"] ?? null,
          "Image-contenido": cuerpo["Image-contenido"] ?? null,
        }),
      );

      await crearPistas(manager, idJuego, pistas);
      await crearCaracteristicas(manager, idJuego, caracteristicas);

      return idJuego;
    });

    res.status(201).json({
      "id-game-car": id,
      mensaje: "Juego creado",
      tracks: pistas.length,
      features: caracteristicas.length,
    });
  } catch (error) {
    errorServidor(res, "Error al crear el juego", error);
  }
});

// Actualiza un juego. Si el body trae `tracks` o `features`, se dan de baja
// los anteriores y se guardan los nuevos dentro de la misma transacción.
router.put("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  const cuerpo = req.body ?? {};
  const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

  if (faltantes.length > 0) {
    return res.status(400).json({
      mensaje: `Faltan campos obligatorios del juego: ${faltantes.join(", ")}`,
    });
  }

  try {
    const juego = await repositorio().findOneBy({ "id-game-car": id });

    if (!juego) {
      return res.status(404).json({ mensaje: "Juego no encontrado" });
    }

    await AppDataSource.transaction(async (manager) => {
      await manager.update(Game, id, {
        Title: cuerpo.Title,
        Desc: cuerpo.Desc ?? null,
        Relace_date: cuerpo.Relace_date,
        Price: cuerpo.Price,
        Developer: cuerpo.Developer,
        Publisher: cuerpo.Publisher,
        Rating: cuerpo.Rating,
        Platform: cuerpo.Platform,
        Game_mode: cuerpo.Game_mode,
        "Categori-id": cuerpo["Categori-id"] ?? null,
        "Image-fondo": cuerpo["Image-fondo"] ?? null,
        "Image-portada": cuerpo["Image-portada"] ?? null,
        "Image-contenido": cuerpo["Image-contenido"] ?? null,
      });

      if (Array.isArray(cuerpo.tracks)) {
        await manager.update(
          Track,
          { "id-game-car": id, "Deleted-at": IsNull() },
          { "Deleted-at": new Date() },
        );

        await crearPistas(manager, id, cuerpo.tracks);
      }

      if (Array.isArray(cuerpo.features)) {
        await manager.update(
          Feature,
          { "id-game-car": id, "Deleted-at": IsNull() },
          { "Deleted-at": new Date() },
        );

        await crearCaracteristicas(manager, id, cuerpo.features);
      }
    });

    res.json({ "id-game-car": id, mensaje: "Juego actualizado" });
  } catch (error) {
    errorServidor(res, "Error al actualizar el juego", error);
  }
});

// Borrado lógico de un juego.
router.delete("/:id", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const resultado = await repositorio().update(
      { "id-game-car": id, "Deleted-at": IsNull() },
      { "Deleted-at": new Date() },
    );

    if (resultado.affected === 0) {
      return res.status(404).json({
        mensaje: "Juego no encontrado o eliminado antes",
      });
    }

    res.json({
      "id-game-car": id,
      mensaje: "Juego eliminado logicamente",
    });
  } catch (error) {
    errorServidor(res, "Error al eliminar el juego", error);
  }
});

// Restaura un juego eliminado.
router.patch("/:id/restaurar", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const resultado = await repositorio().update(
      { "id-game-car": id, "Deleted-at": Not(IsNull()) },
      { "Deleted-at": null },
    );

    if (resultado.affected === 0) {
      return res.status(404).json({
        mensaje: "Juego no encontrado o ya estaba activo",
      });
    }

    res.json({ "id-game-car": id, mensaje: "Juego restaurado" });
  } catch (error) {
    errorServidor(res, "Error al restaurar el juego", error);
  }
});

export default router;
