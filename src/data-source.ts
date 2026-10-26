import "reflect-metadata";
import { DataSource } from "typeorm";

import { Category } from "./entities/Category";
import { Feature } from "./entities/Feature";
import { Game } from "./entities/Game";
import { Track } from "./entities/Track";

// Los valores por defecto apuntan a una instalación local de MariaDB/MySQL
// con la base del dump. Se pueden cambiar con variables de entorno sin tocar
// el código (por ejemplo en otro equipo o en el servidor de la escuela).
export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "Car_2",
  entities: [Category, Game, Track, Feature],
  // El esquema lo define bdDump.sql; TypeORM solo lee y escribe datos.
  synchronize: false,
  logging: false,
});
