import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("games")
export class Game {
  @PrimaryColumn({ name: "id-game-car", type: "int" })
  "id-game-car": number;

  @Column({ name: "Title", type: "varchar", length: 250 })
  Title: string;

  @Column({ name: "Desc", type: "varchar", length: 500, nullable: true })
  Desc: string | null;

  @Column({ name: "Relace_date", type: "date" })
  Relace_date: string;

  @Column({ name: "Price", type: "decimal", precision: 10, scale: 0 })
  Price: string;

  @Column({ name: "Developer", type: "varchar", length: 250 })
  Developer: string;

  @Column({ name: "Publisher", type: "varchar", length: 250 })
  Publisher: string;

  @Column({ name: "Rating", type: "varchar", length: 50 })
  Rating: string;

  @Column({ name: "Platform", type: "varchar", length: 50 })
  Platform: string;

  @Column({ name: "Game_mode", type: "varchar", length: 50 })
  Game_mode: string;

  @Column({ name: "Categori-id", type: "int", nullable: true })
  "Categori-id": number | null;

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

  @Column({ name: "Image-fondo", type: "longtext", nullable: true })
  "Image-fondo": string | null;

  @Column({ name: "Image-portada", type: "longtext", nullable: true })
  "Image-portada": string | null;

  @Column({ name: "Image-contenido", type: "longtext", nullable: true })
  "Image-contenido": string | null;
}
