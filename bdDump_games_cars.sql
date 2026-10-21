-- ============================================================================
--  bdDump.sql  ·  Base de datos "games_cars"
--  Proyecto: Desarrollo Web (games-cars)  ·  Node.js + Express + MySQL/MariaDB
-- ----------------------------------------------------------------------------
--  Este archivo crea la base de datos completa y la deja POBLADA con datos de
--  prueba. Se puede levantar de una sola pasada y sin errores con:
--
--      mysql -u <usuario> -p < bdDump.sql
--
--  Incluye:
--    · Tablas de catálogo: categories, tracks, features, car_2
--    · Tabla intermedia N:M "estante" (car_2 <-> features)
--    · Vista "vista_estante" (JOIN de la relación N:M)
--    · Borrado lógico mediante la columna "activo" (1 = visible, 0 = eliminado)
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS games_cars;
CREATE DATABASE games_cars
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE games_cars;

-- ----------------------------------------------------------------------------
-- Tabla: categories  (catálogo con CRUD completo y borrado lógico)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(100)  NOT NULL,
    descripcion    VARCHAR(255)  DEFAULT NULL,
    activo         TINYINT(1)    NOT NULL DEFAULT 1,
    creado_en      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categories_nombre (nombre),
    INDEX idx_categories_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categories (id, nombre, descripcion, activo) VALUES
    (1, 'Deportivos',    'Autos de alto rendimiento y velocidad',            1),
    (2, 'Todoterreno',   'Vehículos 4x4 para caminos difíciles',             1),
    (3, 'Eléctricos',    'Autos con motorización 100% eléctrica',            1),
    (4, 'Clásicos',      'Modelos históricos restaurados de colección',      1),
    (5, 'Compactos',     'Autos urbanos pequeños y económicos',              1),
    (6, 'Descontinuados','Categoría retirada del catálogo comercial',        0);

-- ----------------------------------------------------------------------------
-- Tabla: tracks  (pistas de carrera)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS tracks;
CREATE TABLE tracks (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(100)  NOT NULL,
    descripcion    VARCHAR(255)  DEFAULT NULL,
    categoria_id   INT           DEFAULT NULL,
    dificultad     ENUM('facil','media','dificil') NOT NULL DEFAULT 'media',
    longitud_km    DECIMAL(6,2)  DEFAULT NULL,
    activo         TINYINT(1)    NOT NULL DEFAULT 1,
    creado_en      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tracks_nombre (nombre),
    INDEX idx_tracks_activo (activo),
    CONSTRAINT fk_tracks_categoria
        FOREIGN KEY (categoria_id) REFERENCES categories(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tracks (id, nombre, descripcion, categoria_id, dificultad, longitud_km, activo) VALUES
    (1, 'Circuito Costero',   'Pista rápida junto al mar con curvas amplias', 1, 'facil',   4.20, 1),
    (2, 'Sierra Nevada',      'Trazado de montaña con desniveles pronunciados',2, 'dificil', 6.80, 1),
    (3, 'Anillo Eléctrico',   'Circuito urbano pensado para autos eléctricos', 3, 'media',   3.10, 1),
    (4, 'Óvalo Histórico',    'Óvalo clásico usado en exhibiciones',           4, 'facil',   2.50, 1),
    (5, 'Laberinto Urbano',   'Calles estrechas y muchas curvas cerradas',     5, 'dificil', 2.90, 1),
    (6, 'Recta del Desierto', 'Trazado recto y largo de alta velocidad',       1, 'media',   7.40, 1),
    (7, 'Bosque Norte',       'Pista sinuosa entre árboles y tierra',          2, 'media',   5.60, 1),
    (8, 'Circuito Retirado',  'Pista dada de baja del calendario oficial',     6, 'facil',   1.80, 0);

-- ----------------------------------------------------------------------------
-- Tabla: features  (características / accesorios)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS features;
CREATE TABLE features (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(100)  NOT NULL,
    descripcion    VARCHAR(255)  DEFAULT NULL,
    activo         TINYINT(1)    NOT NULL DEFAULT 1,
    creado_en      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_features_nombre (nombre),
    INDEX idx_features_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO features (id, nombre, descripcion, activo) VALUES
    (1, 'Turbo',            'Sistema de sobrealimentación del motor',     1),
    (2, 'Tracción 4x4',     'Tracción en las cuatro ruedas',              1),
    (3, 'Frenos ABS',       'Sistema antibloqueo de frenos',              1),
    (4, 'GPS',              'Navegación satelital integrada',             1),
    (5, 'Techo solar',      'Techo corredizo eléctrico',                  1),
    (6, 'Suspensión sport', 'Suspensión deportiva ajustable',             1),
    (7, 'Modo eco',         'Conducción de bajo consumo',                 1),
    (8, 'Piloto retirado',  'Función descartada en la última versión',    0);

-- ----------------------------------------------------------------------------
-- Tabla: car_2  (entidad principal del catálogo)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS car_2;
CREATE TABLE car_2 (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(100)  NOT NULL,
    descripcion    VARCHAR(255)  DEFAULT NULL,
    categoria_id   INT           DEFAULT NULL,
    precio         DECIMAL(10,2) DEFAULT NULL,
    anio           INT           DEFAULT NULL,
    activo         TINYINT(1)    NOT NULL DEFAULT 1,
    creado_en      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_car_2_nombre (nombre),
    INDEX idx_car_2_activo (activo),
    CONSTRAINT fk_car_2_categoria
        FOREIGN KEY (categoria_id) REFERENCES categories(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO car_2 (id, nombre, descripcion, categoria_id, precio, anio, activo) VALUES
    (1, 'Veloz GT',      'Deportivo biplaza con motor V8 biturbo',        1, 85000.00, 2024, 1),
    (2, 'Montaña 4x4',   'Todoterreno robusto para terracería',           2, 42000.00, 2023, 1),
    (3, 'Electro City',  'Compacto eléctrico de uso urbano',              3, 28000.00, 2025, 1),
    (4, 'Clásico 1965',  'Cupé clásico completamente restaurado',         4, 65000.00, 1965, 1),
    (5, 'Mini Urban',    'Compacto económico ideal para la ciudad',       5, 15000.00, 2022, 1),
    (6, 'Relámpago R',   'Superdeportivo de edición limitada',            1, 129000.00, 2025, 1),
    (7, 'Ruta 4x4 Pro',  'Camioneta 4x4 con suspensión reforzada',        2, 51000.00, 2024, 1),
    (8, 'Eco Wave',      'Sedán eléctrico de largo alcance',              3, 39000.00, 2025, 1),
    (9, 'Veterano 300',  'Clásico en proceso de restauración',            4, 22000.00, 1970, 1),
    (10, 'Ciudad Mini',  'Compacto de bajo consumo retirado del catálogo',5, 12000.00, 2021, 0),
    (11, 'Fantasma GT',  'Deportivo cancelado antes de su lanzamiento',   6, 99000.00, 2026, 0);

-- ----------------------------------------------------------------------------
-- Tabla intermedia N:M: estante  (car_2  <->  features)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS estante;
CREATE TABLE estante (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    car_2_id   INT NOT NULL,
    feature_id INT NOT NULL,
    creado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_estante (car_2_id, feature_id),
    CONSTRAINT fk_estante_car_2
        FOREIGN KEY (car_2_id) REFERENCES car_2(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_estante_feature
        FOREIGN KEY (feature_id) REFERENCES features(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO estante (id, car_2_id, feature_id) VALUES
    (1,  1, 1), (2,  1, 3), (3,  1, 6),
    (4,  2, 2), (5,  2, 3), (6,  2, 4),
    (7,  3, 4), (8,  3, 7),
    (9,  4, 5), (10, 4, 6),
    (11, 5, 3), (12, 5, 7),
    (13, 6, 1), (14, 6, 3), (15, 6, 6),
    (16, 7, 2), (17, 7, 4),
    (18, 8, 4), (19, 8, 7);

-- ----------------------------------------------------------------------------
-- Vista JOIN de la relación N:M
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS vista_estante;
CREATE VIEW vista_estante AS
SELECT
    e.id                    AS estante_id,
    c.id                    AS car_2_id,
    c.nombre                AS carro,
    c.descripcion           AS carro_descripcion,
    f.id                    AS feature_id,
    f.nombre                AS caracteristica,
    f.descripcion           AS feature_descripcion,
    c.activo                AS carro_activo
FROM estante e
JOIN car_2   c ON c.id = e.car_2_id
JOIN features f ON f.id = e.feature_id;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
--  Fin del volcado. La base queda creada y poblada.
-- ============================================================================
