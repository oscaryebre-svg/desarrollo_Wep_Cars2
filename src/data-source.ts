import "reflect-metadata";
import { DataSource } from "typeorm";
import { Category } from "./entities/Categories";

// Punto único de configuración de la conexión para TypeORM.
// Convive con src/db.js (mysql2) mientras se migran las rutas poco a poco.
export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "",
  database: "Car_2",
  entities: [Category],
  // La BD manda: no dejamos que TypeORM cree o altere tablas.
  synchronize: false,
  logging: true,//modo developer
});
