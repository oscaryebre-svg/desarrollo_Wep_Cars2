const express = require("express");

const { errorServidor } = require("./helpers");
const gamesRoutes = require("./routes/Car2");
const tracksRoutes = require("./routes/Tracks");
const featuresRoutes = require("./routes/Features");
const carsRoutes = require("./routes/Cars");
const categoriesRoutes = require("./routes/Categories");
const estanteRoutes = require("./routes/Estante");

const app = express();

// Permite recibir JSON en el body. El limite es grande porque los juegos
// pueden traer imagenes (portada, fondo, contenido).
app.use(express.json({ limit: "25mb" }));

// Monta las rutas de cada recurso.
app.use("/api/games", gamesRoutes);
app.use("/api/tracks", tracksRoutes);
app.use("/api/features", featuresRoutes);
app.use("/api/cars", carsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/estante", estanteRoutes);

// Si la ruta no existe, responde un 404 en JSON.
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// Manejador de errores global, siempre al final. Express lo usa para los errores
// que SI puede atrapar (los sincronos y los que llegan con next(error)).
// Ojo: NO atrapa las promesas rechazadas de un handler async (Express 4 no las
// espera), por eso cada ruta async sigue usando su propio try/catch.
app.use((error, req, res, next) => {
  errorServidor(res, "Error interno del servidor", error);
});

app.listen(3000, () => {
  console.log("Servidor ejecutandose en http://localhost:3000");
});
