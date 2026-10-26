/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.20-13.0.2-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: Car_2
-- ------------------------------------------------------
-- Server version	13.0.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Current Database: `Car_2`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `Car_2` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `Car_2`;

--
-- Table structure for table `CAR`
--

DROP TABLE IF EXISTS `CAR`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `CAR` (
  `Car-id` int(11) NOT NULL AUTO_INCREMENT,
  `Car-name` varchar(255) NOT NULL,
  `Manufacturer` varchar(255) NOT NULL,
  `Year` int(11) DEFAULT NULL,
  `Car-class` varchar(50) DEFAULT NULL,
  `Create-at` timestamp NOT NULL DEFAULT current_timestamp(),
  `Updated-at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `Deleted-at` timestamp NULL DEFAULT NULL,
  `Created-by` varchar(250) DEFAULT NULL,
  `Updated-by` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`Car-id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CAR`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `CAR` WRITE;
/*!40000 ALTER TABLE `CAR` DISABLE KEYS */;
INSERT INTO `CAR` VALUES
(1,'Toyota Supra RZ','Toyota',1998,'Deportivo','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(2,'Ford Mustang GT','Ford',2021,'Muscle car','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(3,'Porsche 911 Carrera','Porsche',2020,'Deportivo','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(4,'Nissan Skyline GT-R','Nissan',1999,'Tuning','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(5,'BMW M3 Evolution II','BMW',1988,'Deportivo','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(6,'Chevrolet Camaro SS','Chevrolet',1967,'Muscle car','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(7,'Mazda RX-7 Spirit R','Mazda',2002,'Deportivo','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(8,'Honda NSX Type R','Honda',1992,'Superdeportivo','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(9,'Lamborghini Huracan','Lamborghini',2014,'Superdeportivo','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(10,'Ferrari 458 Italia','Ferrari',2009,'Superdeportivo','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(11,'Lotus Elise S1','Lotus',1996,'Deportivo ligero','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(12,'BMW M4 Coupe','BMW',2014,'Deportivo','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(13,'Lamborghini Aventador','Lamborghini',2011,'Superdeportivo','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(14,'Ford GT','Ford',2017,'Superdeportivo','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(15,'Nissan 370Z','Nissan',2009,'Deportivo','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL);
/*!40000 ALTER TABLE `CAR` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `GAME-CARS`
--

DROP TABLE IF EXISTS `GAME-CARS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `GAME-CARS` (
  `Game-car-id` int(11) NOT NULL AUTO_INCREMENT,
  `id-game-car` int(11) NOT NULL,
  `Car-id` int(11) NOT NULL,
  `max-speed` decimal(6,2) DEFAULT NULL,
  `Aceleration` decimal(4,2) DEFAULT NULL,
  `handling` decimal(4,2) DEFAULT NULL,
  `Rarity` varchar(50) DEFAULT NULL,
  `Unlockable` tinyint(1) DEFAULT 0,
  `Create-at` timestamp NOT NULL DEFAULT current_timestamp(),
  `Updated-at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `Deleted-at` timestamp NULL DEFAULT NULL,
  `Created-by` varchar(250) DEFAULT NULL,
  `Updated-by` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`Game-car-id`),
  UNIQUE KEY `id-game-car` (`id-game-car`,`Car-id`),
  KEY `fk_gamecars_car` (`Car-id`),
  CONSTRAINT `fk_gamecars_car` FOREIGN KEY (`Car-id`) REFERENCES `CAR` (`Car-id`) ON DELETE CASCADE,
  CONSTRAINT `fk_gamecars_game` FOREIGN KEY (`id-game-car`) REFERENCES `games` (`id-game-car`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `GAME-CARS`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `GAME-CARS` WRITE;
/*!40000 ALTER TABLE `GAME-CARS` DISABLE KEYS */;
INSERT INTO `GAME-CARS` VALUES
(1,1,1,280.00,8.50,8.00,'Rara',0,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(2,1,2,250.00,7.80,7.00,'Comun',0,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(3,1,3,300.00,9.00,8.80,'Epica',1,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(4,2,4,310.00,8.90,7.80,'Rara',1,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(5,2,5,270.00,7.50,7.20,'Comun',0,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(6,2,6,240.00,7.00,6.50,'Comun',0,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(7,3,7,255.00,8.00,8.70,'Rara',0,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(8,3,8,280.00,8.80,9.20,'Epica',1,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(9,3,9,325.00,9.50,8.90,'Legendaria',1,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(10,4,10,340.00,9.60,9.50,'Legendaria',0,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(11,4,11,220.00,7.20,9.80,'Rara',0,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(12,4,12,280.00,8.40,8.60,'Rara',1,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(13,5,13,350.00,9.70,8.80,'Legendaria',1,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(14,5,14,348.00,9.40,9.00,'Epica',1,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(15,5,15,250.00,8.00,8.20,'Rara',0,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL);
/*!40000 ALTER TABLE `GAME-CARS` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `GAMES-FEATURES`
--

DROP TABLE IF EXISTS `GAMES-FEATURES`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `GAMES-FEATURES` (
  `Features-id` int(11) NOT NULL,
  `id-game-car` int(11) DEFAULT NULL,
  `Feature-name` varchar(100) NOT NULL,
  `Feature-value` varchar(250) DEFAULT NULL,
  `Create-at` timestamp NOT NULL DEFAULT current_timestamp(),
  `Updated-at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `Deleted-at` timestamp NULL DEFAULT NULL,
  `Created-by` varchar(250) DEFAULT NULL,
  `Updated-by` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`Features-id`),
  KEY `GAMES_FEATURES_games_FK` (`id-game-car`),
  CONSTRAINT `GAMES_FEATURES_games_FK` FOREIGN KEY (`id-game-car`) REFERENCES `games` (`id-game-car`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `GAMES-FEATURES`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `GAMES-FEATURES` WRITE;
/*!40000 ALTER TABLE `GAMES-FEATURES` DISABLE KEYS */;
INSERT INTO `GAMES-FEATURES` VALUES
(1,1,'Mundo abierto','Sí, mapa de México','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(2,1,'Motor gráfico','ForzaTech Engine','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(3,1,'Gráficos','4K HDR','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(4,1,'Jugadores','Multijugador online','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(5,1,'Clima dinámico','Sí, 4 estaciones','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(6,2,'Modo de juego','Carreras callejeras','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(7,2,'Ciclo día/noche','Sí','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(8,2,'Personalización','Visual y de rendimiento','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(9,2,'Persecuciones','Policía activa','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(10,2,'Gráficos','4K, Frostbite Engine','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(11,3,'Simulación','Conducción realista','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(12,3,'Modo foto','Modo Scapes','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(13,3,'Multijugador','Modo Sport online','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(14,3,'Catálogo de autos','Más de 400 vehículos','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(15,3,'Realidad virtual','Soporte PlayStation VR2','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(16,4,'Simulación','Física muy realista','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(17,4,'Mods','Amplio soporte de mods','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(18,4,'Realidad virtual','Sí, compatible VR','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(19,4,'Multijugador','Servidores dedicados','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(20,4,'Telemetría','Avanzada para análisis','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(21,5,'Mundo abierto','Sí, Islas de Hawái','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(22,5,'Actividades','Pruebas de licencia','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(23,5,'Personalización','Vehículos y tuning','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(24,5,'Modos','PvP y cooperativo','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(25,5,'Mapa','Calles, tierra y mar','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL);
/*!40000 ALTER TABLE `GAMES-FEATURES` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `GAME_CATEGORIES`
--

DROP TABLE IF EXISTS `GAME_CATEGORIES`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `GAME_CATEGORIES` (
  `Categori-id` int(11) NOT NULL,
  `Name` varchar(250) NOT NULL,
  `Create-at` timestamp NOT NULL DEFAULT current_timestamp(),
  `Updated-at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `Deleted-at` timestamp NULL DEFAULT NULL,
  `Created-by` varchar(250) DEFAULT NULL,
  `Updated-by` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`Categori-id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `GAME_CATEGORIES`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `GAME_CATEGORIES` WRITE;
/*!40000 ALTER TABLE `GAME_CATEGORIES` DISABLE KEYS */;
INSERT INTO `GAME_CATEGORIES` VALUES
(1,'Juegos de carreras','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL);
/*!40000 ALTER TABLE `GAME_CATEGORIES` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `TRACKS`
--

DROP TABLE IF EXISTS `TRACKS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `TRACKS` (
  `Tracks-id` int(11) NOT NULL,
  `id-game-car` int(11) DEFAULT NULL,
  `Track-name` varchar(250) NOT NULL,
  `Location` varchar(500) DEFAULT NULL,
  `Track-type` varchar(50) NOT NULL,
  `Length-km` decimal(6,0) DEFAULT NULL,
  `difficulty-level` varchar(50) DEFAULT NULL,
  `Create-at` timestamp NOT NULL DEFAULT current_timestamp(),
  `Updated-at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `Deleted-at` timestamp NULL DEFAULT NULL,
  `Created-by` varchar(250) DEFAULT NULL,
  `Updated-by` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`Tracks-id`),
  KEY `TRACKS_games_FK` (`id-game-car`),
  CONSTRAINT `TRACKS_games_FK` FOREIGN KEY (`id-game-car`) REFERENCES `games` (`id-game-car`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TRACKS`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `TRACKS` WRITE;
/*!40000 ALTER TABLE `TRACKS` DISABLE KEYS */;
INSERT INTO `TRACKS` VALUES
(1,1,'Gran Caldera','Volcán Gran Caldera, Baja California','Rally',6,'Difícil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(2,1,'Baja Off-Road','Desierto de Baja California','Cross Country',12,'Media','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(3,1,'Horizon Festival','Playa de Torre Vieja','Circuito',3,'Fácil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(4,1,'Sierra Morena Sprint','Sierra Morena','Sprint',7,'Media','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(5,1,'Valle de Guanajuato','Guanajuato','Urbano',4,'Difícil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(6,1,'Playa Muerta','Costa de Baja California','Rally',8,'Media','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(7,2,'Circuito Palm City','Centro de Palm City','Urbano',4,'Fácil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(8,2,'Puerto de Murphy','Puerto de Murphy, Palm City','Urbano',5,'Media','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(9,2,'Autopista de la Costa','Autopista costera de Palm City','Autopista',15,'Fácil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(10,2,'Ruta de la Montaña','Montañas de Palm City','Montaña',9,'Difícil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(11,2,'Periférico Nocturno','Anillo de Palm City','Circuito',6,'Media','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(12,3,'Suzuka','Suzuka, Japón','Circuito',6,'Difícil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(13,3,'Spa-Francorchamps','Bélgica','Circuito',7,'Difícil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(14,3,'Nürburgring Nordschleife','Alemania','Circuito',21,'Muy difícil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(15,3,'Autodromo de Monza','Italia','Circuito',6,'Media','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(16,3,'Trial Mountain','Circuito ficticio','Circuito',6,'Media','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(17,3,'Deep Forest Raceway','Circuito ficticio','Circuito',4,'Fácil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(18,3,'Dragon Trail','Circuito ficticio','Circuito',7,'Difícil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(19,4,'Monza','Italia','Circuito',6,'Media','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(20,4,'Nürburgring','Alemania','Circuito',26,'Muy difícil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(21,4,'Spa-Francorchamps','Bélgica','Circuito',7,'Difícil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(22,4,'Silverstone','Gran Bretaña','Circuito',6,'Difícil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(23,4,'Barcelona-Catalunya','España','Circuito',5,'Media','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(24,4,'Brands Hatch','Gran Bretaña','Circuito',4,'Media','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(25,5,'Honolulu City','Honolulu, Oahu','Urbano',5,'Fácil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(26,5,'Diamond Head','Diamond Head, Honolulu','Sprint',4,'Media','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(27,5,'North Shore Coastal','Costa norte de Oahu','Sprint',10,'Media','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(28,5,'Haleakalā Ascent','Volcán Haleakalā, Maui','Montaña',14,'Difícil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL),
(29,5,'Kailua Beach Circuit','Kailua, Oahu','Circuito',6,'Fácil','2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL);
/*!40000 ALTER TABLE `TRACKS` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `USER`
--

DROP TABLE IF EXISTS `USER`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `USER` (
  `User-id` int(11) NOT NULL,
  `Username` varchar(100) NOT NULL,
  `Email` varchar(250) NOT NULL,
  `Password_hash` varchar(250) NOT NULL,
  `Full-name` varchar(250) NOT NULL,
  `role` varchar(50) NOT NULL,
  `Is-activate` tinyint(1) NOT NULL,
  `last-login` timestamp NULL DEFAULT NULL,
  `Create-at` timestamp NOT NULL,
  `Updated-at` timestamp NOT NULL,
  `Deleted-at` timestamp NULL DEFAULT NULL,
  `Created-by` varchar(250) DEFAULT NULL,
  `Updated-by` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`User-id`),
  UNIQUE KEY `USER_UNIQUE` (`Username`),
  UNIQUE KEY `USER_UNIQUE_1` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `USER`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `USER` WRITE;
/*!40000 ALTER TABLE `USER` DISABLE KEYS */;
/*!40000 ALTER TABLE `USER` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `USER-GAMES`
--

DROP TABLE IF EXISTS `USER-GAMES`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `USER-GAMES` (
  `User-game-id` int(11) NOT NULL AUTO_INCREMENT,
  `User-id` int(11) NOT NULL,
  `id-game-car` int(11) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Jugando',
  `completion_percentage` decimal(5,2) DEFAULT 0.00,
  `playtime_hours` decimal(8,2) DEFAULT 0.00,
  `favorite` tinyint(1) NOT NULL DEFAULT 0,
  `added_at` timestamp NULL DEFAULT current_timestamp(),
  `Updated-at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `Deleted-at` timestamp NULL DEFAULT NULL,
  `Created-by` varchar(250) DEFAULT NULL,
  `Updated-by` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`User-game-id`),
  UNIQUE KEY `uq_user_game` (`User-id`,`id-game-car`),
  KEY `fk_usergames_game` (`id-game-car`),
  CONSTRAINT `fk_usergames_game` FOREIGN KEY (`id-game-car`) REFERENCES `games` (`id-game-car`) ON DELETE CASCADE,
  CONSTRAINT `fk_usergames_user` FOREIGN KEY (`User-id`) REFERENCES `USER` (`User-id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `USER-GAMES`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `USER-GAMES` WRITE;
/*!40000 ALTER TABLE `USER-GAMES` DISABLE KEYS */;
/*!40000 ALTER TABLE `USER-GAMES` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Temporary table structure for view `estante`
--

DROP TABLE IF EXISTS `estante`;
/*!50001 DROP VIEW IF EXISTS `estante`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `estante` AS SELECT
 NULL AS `game_id`,
 NULL AS `Title`,
 NULL AS `Desc_resumen`,
 NULL AS `Categoria`,
 NULL AS `Image_portada` */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `games` (
  `id-game-car` int(11) NOT NULL,
  `Title` varchar(250) NOT NULL,
  `Desc` varchar(500) DEFAULT NULL,
  `Relace_date` date NOT NULL,
  `Price` decimal(10,0) NOT NULL,
  `Developer` varchar(250) NOT NULL,
  `Publisher` varchar(250) NOT NULL,
  `Rating` varchar(50) NOT NULL,
  `Platform` varchar(50) NOT NULL,
  `Game_mode` varchar(50) NOT NULL,
  `Categori-id` int(11) DEFAULT NULL,
  `Create-at` timestamp NOT NULL DEFAULT current_timestamp(),
  `Updated-at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `Deleted-at` timestamp NULL DEFAULT NULL,
  `Created-by` varchar(250) DEFAULT NULL,
  `Updated-by` varchar(250) DEFAULT NULL,
  `Image-fondo` longtext DEFAULT NULL,
  `Image-portada` longtext DEFAULT NULL,
  `Image-contenido` longtext DEFAULT NULL,
  PRIMARY KEY (`id-game-car`),
  KEY `games_GAME_CATEGORIES_FK` (`Categori-id`),
  CONSTRAINT `games_GAME_CATEGORIES_FK` FOREIGN KEY (`Categori-id`) REFERENCES `GAME_CATEGORIES` (`Categori-id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `games`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `games` WRITE;
/*!40000 ALTER TABLE `games` DISABLE KEYS */;
INSERT INTO `games` VALUES
(1,'Forza Horizon 5','Videojuego de carreras de mundo abierto ambientado en Mexico.','2021-11-09',1399,'Playground Games','Xbox Game Studios','E','Xbox y PC','Individual y multijugador',1,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL,NULL,NULL,NULL),
(2,'Need for Speed Heat','Juego de carreras callejeras con persecuciones policiales y personalizacion de autos.','2019-11-08',999,'Ghost Games','Electronic Arts','T','PlayStation, Xbox y PC','Individual y multijugador',1,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL,NULL,NULL,NULL),
(3,'Gran Turismo 7','Simulador de carreras con autos deportivos, circuitos y configuracion avanzada.','2022-03-04',1499,'Polyphony Digital','Sony Interactive Entertainment','E','PlayStation 4 y PlayStation 5','Individual y multijugador',1,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL,NULL,NULL,NULL),
(4,'Assetto Corsa','Simulador de conduccion enfocado en el realismo y el comportamiento de los vehiculos.','2014-12-19',599,'Kunos Simulazioni','505 Games','E','PlayStation, Xbox y PC','Individual y multijugador',1,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL,NULL,NULL,NULL),
(5,'The Crew Motorfest','Videojuego de carreras de mundo abierto con diferentes tipos de vehiculos y eventos.','2023-09-14',1299,'Ubisoft Ivory Tower','Ubisoft','T','PlayStation, Xbox y PC','Individual y multijugador',1,'2026-09-19 04:20:02','2026-09-19 04:20:02',NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `games` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Dumping routines for database 'Car_2'
--

--
-- Current Database: `Car_2`
--

USE `Car_2`;

--
-- Final view structure for view `estante`
--

/*!50001 DROP VIEW IF EXISTS `estante`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_uca1400_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `estante` AS select `g`.`id-game-car` AS `game_id`,`g`.`Title` AS `Title`,concat(left(`g`.`Desc`,50),if(char_length(`g`.`Desc`) > 50,'...','')) AS `Desc_resumen`,`c`.`Name` AS `Categoria`,`g`.`Image-portada` AS `Image_portada` from (`games` `g` left join `GAME_CATEGORIES` `c` on(`g`.`Categori-id` = `c`.`Categori-id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-09-25 21:14:30
