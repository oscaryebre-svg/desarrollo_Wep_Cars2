import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("GAMES-FEATURES")
export class Feature {
  @PrimaryColumn({ name: "Features-id", type: "int" })
  "Features-id": number;

  @Column({ name: "id-game-car", type: "int", nullable: true })
  "id-game-car": number | null;

  @Column({ name: "Feature-name", type: "varchar", length: 100 })
  "Feature-name": string;

  @Column({ name: "Feature-value", type: "varchar", length: 250, nullable: true })
  "Feature-value": string | null;

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
