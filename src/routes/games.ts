import express from "express";
import { EntityManager, In, IsNull, Like, Not } from "typeorm";

import { AppDataSource } from "../data-source";
import { Car } from "../entities/Car";
import { Category } from "../entities/Category";
import { Feature } from "../entities/Feature";
import { Game } from "../entities/Game";
import { GameCar } from "../entities/GameCar";
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

type EntradaCoche = Record<string, unknown>;

type CocheDelJuego = GameCar & {
  "Car-name": string | null;
  Manufacturer: string | null;
  Year: number | null;
  "Car-class": string | null;
};

function repositorio() {
  return AppDataSource.getRepository(Game);
}

function repositorioCoches() {
  return AppDataSource.getRepository(Car);
}

// Acepta tanto una lista de ids [1, 2] como una lista de objetos
// [{ "Car-id": 1, "max-speed": 280 }]. También acepta un solo elemento.
function normalizarCoches(valor: unknown): EntradaCoche[] {
  if (valor === undefined || valor === null) {
    return [];
  }

  const lista = Array.isArray(valor) ? valor : [valor];

  return lista.map((elemento) => {
    if (typeof elemento === "number" || typeof elemento === "string") {
      return { "Car-id": Number(elemento) };
    }

    return (elemento ?? {}) as EntradaCoche;
  });
}

function booleano(valor: unknown): boolean {
  return (
    valor === true ||
    valor === 1 ||
    valor === "1" ||
    valor === "true" ||
    valor === "si"
  );
}

function datosCoche(coche: EntradaCoche) {
  return {
    "max-speed": (coche["max-speed"] as string) ?? null,
    Aceleration: (coche.Aceleration as string) ?? null,
    handling: (coche.handling as string) ?? null,
    Rarity: (coche.Rarity as string) ?? null,
    Unlockable: booleano(coche.Unlockable),
  };
}

async function validarCoches(coches: EntradaCoche[]): Promise<string | null> {
  if (coches.length === 0) {
    return null;
  }

  const ids = coches.map((coche) => Number(coche["Car-id"]));

  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    return "Cada coche debe incluir un 'Car-id' entero positivo";
  }

  const unicos = [...new Set(ids)];
  const existentes = await repositorioCoches().find({
    where: { "Car-id": In(unicos), "Deleted-at": IsNull() },
  });

  if (existentes.length === unicos.length) {
    return null;
  }

  const encontrados = new Set(existentes.map((coche) => coche["Car-id"]));
  const faltantes = unicos.filter((id) => !encontrados.has(id));

  return `No existen o estan eliminados los coches: ${faltantes.join(", ")}`;
}

// Guarda las relaciones games <-> CAR. Si `reemplazar` es true, las
// relaciones activas que ya no vienen en la lista se dan de baja lógica.
// Si una relación ya existía (incluso eliminada), se reactiva y actualiza
// en lugar de insertar otra, para respetar la llave única (juego, auto).
async function guardarCoches(
  manager: EntityManager,
  idJuego: number,
  coches: EntradaCoche[],
  reemplazar: boolean,
): Promise<void> {
  const existentes = await manager.find(GameCar, {
    where: { "id-game-car": idJuego },
  });
  const porCoche = new Map(
    existentes.map((relacion) => [relacion["Car-id"], relacion]),
  );

  const unicos = new Map<number, EntradaCoche>();
  for (const coche of coches) {
    unicos.set(Number(coche["Car-id"]), coche);
  }

  if (reemplazar) {
    for (const relacion of existentes) {
      if (relacion["Deleted-at"] === null && !unicos.has(relacion["Car-id"])) {
        await manager.update(GameCar, relacion["Game-car-id"], {
          "Deleted-at": new Date(),
        });
      }
    }
  }

  for (const [idCoche, coche] of unicos) {
    const datos = {
      ...datosCoche(coche),
      "Deleted-at": null,
    };
    const existente = porCoche.get(idCoche);

    if (existente) {
      await manager.update(GameCar, existente["Game-car-id"], datos);
    } else {
      await manager.save(
        manager.create(GameCar, {
          "id-game-car": idJuego,
          "Car-id": idCoche,
          ...datos,
        }),
      );
    }
  }
}

// Une cada juego con su categoría, sus pistas, sus características y sus
// autos. Es el equivalente a las relaciones anidadas del proyecto de clase.
async function conRelaciones(juegos: Game[], incluirEliminados = false) {
  if (juegos.length === 0) {
    return [];
  }

  const ids = juegos.map((juego) => juego["id-game-car"]);
  const idsVisibles = new Set(
    juegos
      .filter((juego) => incluirEliminados || juego["Deleted-at"] === null)
      .map((juego) => juego["id-game-car"]),
  );

  const wherePistas = incluirEliminados
    ? { "id-game-car": In(ids) }
    : { "id-game-car": In(ids), "Deleted-at": IsNull() };
  const whereCaracteristicas = incluirEliminados
    ? { "id-game-car": In(ids) }
    : { "id-game-car": In(ids), "Deleted-at": IsNull() };
  const whereRelaciones = incluirEliminados
    ? { "id-game-car": In(ids) }
    : { "id-game-car": In(ids), "Deleted-at": IsNull() };

  const [categorias, pistas, caracteristicas, relaciones] = await Promise.all([
    AppDataSource.getRepository(Category).find(),
    AppDataSource.getRepository(Track).find({ where: wherePistas }),
    AppDataSource.getRepository(Feature).find({
      where: whereCaracteristicas,
    }),
    AppDataSource.getRepository(GameCar).find({ where: whereRelaciones }),
  ]);

  const idsCoches = [
    ...new Set(relaciones.map((relacion) => relacion["Car-id"])),
  ];
  const coches = idsCoches.length
    ? await repositorioCoches().find({
        where: { "Car-id": In(idsCoches) },
      })
    : [];

  const nombresCategoria = new Map(
    categorias.map((categoria) => [categoria["Categori-id"], categoria.Name]),
  );
  const cochesPorId = new Map(coches.map((coche) => [coche["Car-id"], coche]));

  const pistasPorJuego = new Map<number, Track[]>();
  for (const pista of pistas) {
    const idJuego = pista["id-game-car"];

    if (idJuego === null || !idsVisibles.has(idJuego)) {
      continue;
    }

    const lista = pistasPorJuego.get(idJuego) ?? [];
    lista.push(pista);
    pistasPorJuego.set(idJuego, lista);
  }

  const caracteristicasPorJuego = new Map<number, Feature[]>();
  for (const caracteristica of caracteristicas) {
    const idJuego = caracteristica["id-game-car"];

    if (idJuego === null || !idsVisibles.has(idJuego)) {
      continue;
    }

    const lista = caracteristicasPorJuego.get(idJuego) ?? [];
    lista.push(caracteristica);
    caracteristicasPorJuego.set(idJuego, lista);
  }

  const relacionesPorJuego = new Map<number, GameCar[]>();
  for (const relacion of relaciones) {
    const idJuego = relacion["id-game-car"];

    if (!idsVisibles.has(idJuego)) {
      continue;
    }

    const lista = relacionesPorJuego.get(idJuego) ?? [];
    lista.push(relacion);
    relacionesPorJuego.set(idJuego, lista);
  }

  return juegos.map((juego) => {
    const idJuego = juego["id-game-car"];
    const cochesDelJuego: CocheDelJuego[] = [];

    for (const relacion of relacionesPorJuego.get(idJuego) ?? []) {
      const coche = cochesPorId.get(relacion["Car-id"]);

      if (!coche) {
        continue;
      }

      if (!incluirEliminados && coche["Deleted-at"] !== null) {
        continue;
      }

      cochesDelJuego.push({
        ...relacion,
        "Car-name": coche["Car-name"],
        Manufacturer: coche.Manufacturer,
        Year: coche.Year,
        "Car-class": coche["Car-class"],
      });
    }

    return {
      ...juego,
      Categoria:
        juego["Categori-id"] === null
          ? null
          : (nombresCategoria.get(juego["Categori-id"]) ?? null),
      tracks: pistasPorJuego.get(idJuego) ?? [],
      features: caracteristicasPorJuego.get(idJuego) ?? [],
      cars: cochesDelJuego,
    };
  });
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

// Lista los juegos activos con categoría, pistas, características y autos.
router.get("/", async (_req, res) => {
  try {
    const juegos = await repositorio().find({
      where: { "Deleted-at": IsNull() },
    });

    res.json(await conRelaciones(juegos));
  } catch (error) {
    errorServidor(res, "Error al consultar los juegos", error);
  }
});

// Lista todos los juegos (incluidos los eliminados) y todas sus relaciones.
router.get("/todos", async (_req, res) => {
  try {
    res.json(await conRelaciones(await repositorio().find(), true));
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

    res.json(await conRelaciones(juegos));
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

    res.json(await conRelaciones(juegos));
  } catch (error) {
    errorServidor(res, "Error al buscar juegos por descripcion", error);
  }
});

// Pistas activas de un juego.
router.get("/:id/tracks", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const juego = await repositorio().findOneBy({ "id-game-car": id });

    if (!juego) {
      return res.status(404).json({ mensaje: "Juego no encontrado" });
    }

    const [juegoConRelaciones] = await conRelaciones([juego]);

    res.json(juegoConRelaciones.tracks);
  } catch (error) {
    errorServidor(res, "Error al consultar las pistas del juego", error);
  }
});

// Características activas de un juego.
router.get("/:id/features", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const juego = await repositorio().findOneBy({ "id-game-car": id });

    if (!juego) {
      return res.status(404).json({ mensaje: "Juego no encontrado" });
    }

    const [juegoConRelaciones] = await conRelaciones([juego]);

    res.json(juegoConRelaciones.features);
  } catch (error) {
    errorServidor(
      res,
      "Error al consultar las caracteristicas del juego",
      error,
    );
  }
});

// Autos activos de un juego, con los datos del catálogo CAR.
router.get("/:id/cars", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const juego = await repositorio().findOneBy({ "id-game-car": id });

    if (!juego) {
      return res.status(404).json({ mensaje: "Juego no encontrado" });
    }

    const [juegoConRelaciones] = await conRelaciones([juego]);

    res.json(juegoConRelaciones.cars);
  } catch (error) {
    errorServidor(res, "Error al consultar los autos del juego", error);
  }
});

// Vincula uno o varios autos a un juego sin reemplazar los existentes.
router.post("/:id/cars", async (req, res) => {
  const id = idValido(req.params.id);

  if (id === null) {
    return res.status(400).json({ mensaje: "El id debe ser un numero entero" });
  }

  try {
    const juego = await repositorio().findOneBy({
      "id-game-car": id,
      "Deleted-at": IsNull(),
    });

    if (!juego) {
      return res.status(404).json({
        mensaje: "Juego no encontrado o eliminado",
      });
    }

    const cuerpo = req.body ?? {};
    const valor = Array.isArray(cuerpo) ? cuerpo : (cuerpo.cars ?? cuerpo);
    const coches = normalizarCoches(valor);

    if (coches.length === 0) {
      return res.status(400).json({
        mensaje: "Debe indicar al menos un coche para vincular",
      });
    }

    const errorCoches = await validarCoches(coches);

    if (errorCoches) {
      return res.status(400).json({ mensaje: errorCoches });
    }

    await AppDataSource.transaction(async (manager) => {
      await guardarCoches(manager, id, coches, false);
    });

    res.status(201).json({
      "id-game-car": id,
      cars: coches.length,
      mensaje: "Coches vinculados",
    });
  } catch (error) {
    errorServidor(res, "Error al vincular los coches", error);
  }
});

// Desvincula (borrado lógico) un auto de un juego.
router.delete("/:id/cars/:carId", async (req, res) => {
  const id = idValido(req.params.id);
  const idCoche = idValido(req.params.carId);

  if (id === null || idCoche === null) {
    return res
      .status(400)
      .json({ mensaje: "Los ids deben ser numeros enteros" });
  }

  try {
    const resultado = await AppDataSource.getRepository(GameCar).update(
      {
        "id-game-car": id,
        "Car-id": idCoche,
        "Deleted-at": IsNull(),
      },
      { "Deleted-at": new Date() },
    );

    if (resultado.affected === 0) {
      return res.status(404).json({
        mensaje: "Relacion juego-auto no encontrada o ya estaba eliminada",
      });
    }

    res.json({
      "id-game-car": id,
      "Car-id": idCoche,
      mensaje: "Auto desvinculado del juego",
    });
  } catch (error) {
    errorServidor(res, "Error al desvincular el auto", error);
  }
});

// Obtiene un juego por su id, con sus relaciones activas.
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

    const [conRelacionesDelJuego] = await conRelaciones([juego]);

    res.json(conRelacionesDelJuego);
  } catch (error) {
    errorServidor(res, "Error al consultar el juego", error);
  }
});

// Crea un juego. Si el body trae `tracks`, `features` o `cars`, se guardan
// en la misma transacción; si algo falla, no queda nada a medias.
router.post("/", async (req, res) => {
  const cuerpo = req.body ?? {};
  const faltantes = camposFaltantes(cuerpo, CAMPOS_OBLIGATORIOS);

  if (faltantes.length > 0) {
    return res.status(400).json({
      mensaje: `Faltan campos obligatorios del juego: ${faltantes.join(", ")}`,
    });
  }

  const pistas = Array.isArray(cuerpo.tracks) ? cuerpo.tracks : [];
  const caracteristicas = Array.isArray(cuerpo.features) ? cuerpo.features : [];
  const coches = normalizarCoches(cuerpo.cars);

  try {
    const errorCoches = await validarCoches(coches);

    if (errorCoches) {
      return res.status(400).json({ mensaje: errorCoches });
    }

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
      await guardarCoches(manager, idJuego, coches, true);

      return idJuego;
    });

    res.status(201).json({
      "id-game-car": id,
      mensaje: "Juego creado",
      tracks: pistas.length,
      features: caracteristicas.length,
      cars: coches.length,
    });
  } catch (error) {
    errorServidor(res, "Error al crear el juego", error);
  }
});

// Actualiza un juego. Si el body trae `tracks`, `features` o `cars`, se
// reemplazan las relaciones activas dentro de la misma transacción.
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

  const coches = normalizarCoches(cuerpo.cars);

  try {
    const errorCoches = await validarCoches(coches);

    if (errorCoches) {
      return res.status(400).json({ mensaje: errorCoches });
    }

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

      if (cuerpo.cars !== undefined) {
        await guardarCoches(manager, id, coches, true);
      }
    });

    res.json({ "id-game-car": id, mensaje: "Juego actualizado" });
  } catch (error) {
    errorServidor(res, "Error al actualizar el juego", error);
  }
});

// Borrado lógico de un juego. Las pistas, características y autos quedan
// intactos; dejan de mostrarse porque el juego ya no está activo y vuelven
// a aparecer si el juego se restaura.
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

// Restaura un juego eliminado. Sus relaciones siguen intactas.
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
