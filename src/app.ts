import express from "express";
import type { NextFunction, Request, Response } from "express";

import { AppDataSource } from "./data-source";
import categoriesRoutes from "./routes/categories";
import estanteRoutes from "./routes/estante";
import featuresRoutes from "./routes/features";
import gamesRoutes from "./routes/games";
import tracksRoutes from "./routes/tracks";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json({ limit: "25mb" }));

app.get("/", (_req, res) => {
  res.json({
    proyecto: "games-cars",
    descripcion:
      "API REST de catalogo de videojuegos con Express, TypeScript y TypeORM",
    recursos: [
      "/api/games",
      "/api/categories",
      "/api/tracks",
      "/api/features",
      "/api/estante",
    ],
  });
});

app.use("/api/games", gamesRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/tracks", tracksRoutes);
app.use("/api/features", featuresRoutes);
app.use("/api/estante", estanteRoutes);

// Rutas inexistentes: 404 en JSON (no HTML de Express).
app.use((_req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// Errores que Express sí puede recibir (por ejemplo un JSON mal formado).
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if ((error as { type?: string }).type === "entity.parse.failed") {
    return res.status(400).json({ mensaje: "El body no es un JSON valido" });
  }

  console.error("Error interno:", error);

  res.status(500).json({ mensaje: "Error interno del servidor" });
});

async function iniciar(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("Base de datos conectada");

    app.listen(PORT, () => {
      console.log(`Servidor ejecutandose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("No se pudo conectar a la base de datos:", error);
    process.exitCode = 1;
  }
}

void iniciar();
