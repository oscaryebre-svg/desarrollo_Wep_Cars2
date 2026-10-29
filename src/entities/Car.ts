import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

// Catálogo de autos. A diferencia de las tablas del catálogo principal,
// CAR sí usa AUTO_INCREMENT, por eso la llave la genera la base de datos.
@Entity("CAR")
export class Car {
  @PrimaryGeneratedColumn({ name: "Car-id", type: "int" })
  "Car-id": number;

  @Column({ name: "Car-name", type: "varchar", length: 255 })
  "Car-name": string;

  @Column({ name: "Manufacturer", type: "varchar", length: 255 })
  Manufacturer: string;

  @Column({ name: "Year", type: "int", nullable: true })
  Year: number | null;

  @Column({ name: "Car-class", type: "varchar", length: 50, nullable: true })
  "Car-class": string | null;

  @CreateDateColumn({ name: "Create-at", type: "timestamp" })
  "Create-at": Date;

  @UpdateDateColumn({ name: "Updated-at", type: "timestamp" })
  "Updated-at": Date;

  @Column({ name: "Deleted-at", type: "timestamp", nullable: true })
  "Deleted-at": Date | null;

  @Column({ name: "Created-by", type: "varchar", length: 250, nullable: true })
  "Created-by": string | null;

  @Column({ name: "Updated-by", type: "varchar", length: 250, nullable: true })
  "Updated-by": string | null;
}
