import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("TRACKS")
export class Track {
  @PrimaryColumn({ name: "Tracks-id", type: "int" })
  "Tracks-id": number;

  @Column({ name: "id-game-car", type: "int", nullable: true })
  "id-game-car": number | null;

  @Column({ name: "Track-name", type: "varchar", length: 250 })
  "Track-name": string;

  @Column({ name: "Location", type: "varchar", length: 500, nullable: true })
  Location: string | null;

  @Column({ name: "Track-type", type: "varchar", length: 50 })
  "Track-type": string;

  @Column({ name: "Length-km", type: "decimal", precision: 6, scale: 0, nullable: true })
  "Length-km": string | null;

  @Column({ name: "difficulty-level", type: "varchar", length: 50, nullable: true })
  "difficulty-level": string | null;

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
