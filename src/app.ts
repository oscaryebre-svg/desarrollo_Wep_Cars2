import express from "express";

import { AppDataSource } from "./data-source";
import categoriesRoutes from "./routes/Categories";

// Rutas que todavía están en JavaScript (se irán migrando una por una).
// Se cargan con require para no obligar a TypeScript a compilar los .js.
const gamesRoutes = require("./routes/Car2");
const tracksRoutes = require("./routes/Tracks");
const featuresRoutes = require("./routes/Features");
const carsRoutes = require("./routes/Cars");
const estanteRoutes = require("./routes/Estante");

const app = express();

// Mismo límite que app.js: los juegos pueden traer imágenes en el body.
app.use(express.json({ limit: "25mb" }));

// Recurso ya migrado a TypeScript + TypeORM.
app.use("/api/categories", categoriesRoutes);

// Recursos pendientes de migrar (siguen usando mysql2 y SQL directo).
app.use("/api/games", gamesRoutes);
app.use("/api/tracks", tracksRoutes);
app.use("/api/features", featuresRoutes);
app.use("/api/cars", carsRoutes);
app.use("/api/estante", estanteRoutes);

// Si la ruta no existe, responde un 404 en JSON.
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// Primero se conecta TypeORM y hasta entonces se levanta el servidor.
// Así, si la BD no responde, el error se ve al arrancar y no en cada petición.
AppDataSource.initialize()
  .then(() => {
    console.log("Base de datos conectada");

    app.listen(3000, () => {
      console.log("Servidor ejecutandose en http://localhost:3000");
    });
  })
  .catch((error) => {
    console.error("Error de conexion:", error);
  });
