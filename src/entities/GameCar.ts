import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

// Tabla intermedia N:M entre games y CAR. Además de la relación guarda
// los atributos propios de cada auto dentro de un juego (velocidad, rareza...).
@Entity("GAME-CARS")
export class GameCar {
  @PrimaryGeneratedColumn({ name: "Game-car-id", type: "int" })
  "Game-car-id": number;

  @Column({ name: "id-game-car", type: "int" })
  "id-game-car": number;

  @Column({ name: "Car-id", type: "int" })
  "Car-id": number;

  @Column({
    name: "max-speed",
    type: "decimal",
    precision: 6,
    scale: 2,
    nullable: true,
  })
  "max-speed": string | null;

  @Column({
    name: "Aceleration",
    type: "decimal",
    precision: 4,
    scale: 2,
    nullable: true,
  })
  Aceleration: string | null;

  @Column({
    name: "handling",
    type: "decimal",
    precision: 4,
    scale: 2,
    nullable: true,
  })
  handling: string | null;

  @Column({ name: "Rarity", type: "varchar", length: 50, nullable: true })
  Rarity: string | null;

  @Column({ name: "Unlockable", type: "boolean", default: false })
  Unlockable: boolean;

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
