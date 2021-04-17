-- Vakioarvot ja tyypit

CREATE TYPE sukupuoli AS ENUM ('Male', 'Female', '-');

CREATE DOMAIN puid AS VARCHAR(40) CHECK (LENGTH(VALUE) >= 32);

CREATE DOMAIN raha AS NUMERIC(8,2) CHECK (VALUE >= 0);

CREATE DOMAIN sahkoposti AS VARCHAR(200) NOT NULL CHECK (VALUE LIKE '%@%');

-- Taulut

-- Käyttäjät

-- Salasana-asioille ei tehdä hash-laskua tai mitään vertailua tietokannassa,
-- backendin vastuulla tallentaa kantaan oikean muotoista tietoa.
CREATE TABLE Henkilokunta (
  Tunnus VARCHAR(100) PRIMARY KEY,
  Etunimi VARCHAR(100) NOT NULL,
  Sukunimi VARCHAR(100) NOT NULL,
  Sahkoposti sahkoposti,
  SalasanaHash VARCHAR(100) NOT NULL -- bcrypt-hash
);

CREATE TABLE Mainosmyyja (
  Tunnus VARCHAR(100) PRIMARY KEY REFERENCES Henkilokunta(Tunnus)
         ON UPDATE RESTRICT
         ON DELETE CASCADE
);

CREATE TABLE Taloussihteeri (
  Tunnus VARCHAR(100) PRIMARY KEY REFERENCES Henkilokunta(Tunnus)
         ON UPDATE RESTRICT
         ON DELETE CASCADE
);

-- Mainostajat

CREATE TABLE Toimipaikka (
  ToimipaikkaId INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  Postinumero VARCHAR(20) NOT NULL,
  Postitoimipaikka VARCHAR(100) NOT NULL
);

CREATE TABLE Laskutusosoite (
  OsoiteId INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  Maa VARCHAR(100) NOT NULL, 
  Katuosoite VARCHAR(200) NOT NULL,
  ToimipaikkaId INTEGER NOT NULL REFERENCES Toimipaikka(ToimipaikkaId)
                ON UPDATE RESTRICT
                ON DELETE RESTRICT -- Poisto triggerillä
);

CREATE TABLE Mainostaja (
  MainostajaId INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  VATtunnus VARCHAR(15) NOT NULL UNIQUE CHECK (LENGTH(VATtunnus) >= 4), -- https://en.wikipedia.org/wiki/VAT_identification_number
  YrityksenNimi VARCHAR(100) NOT NULL,
  OsoiteId INTEGER NOT NULL REFERENCES Laskutusosoite(OsoiteId)
           ON UPDATE RESTRICT
           ON DELETE RESTRICT -- Poisto triggerillä
);

CREATE TABLE Yhteyshenkilo (
  HloId INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  Etunimi VARCHAR(100) NOT NULL, 
  Sukunimi VARCHAR(100) NOT NULL,
  Puhelinnro VARCHAR(20) NOT NULL CHECK (Puhelinnro LIKE '+%'),
  Sahkoposti sahkoposti,
  MainostajaId INTEGER NOT NULL REFERENCES Mainostaja(MainostajaId)
               ON UPDATE RESTRICT
               ON DELETE CASCADE -- Mainostajaa poistettaessa poistetaan yhteyshenkilö
);

-- I-Flacin yritystiedot

CREATE TABLE YrityksenTiedot (
  Nimi VARCHAR(200) NOT NULL,
  Tilinro CHAR(18) NOT NULL CHECK (Tilinro LIKE 'FI________________'),
  Maa VARCHAR(100) NOT NULL, 
  Katuosoite VARCHAR(200) NOT NULL,
  ToimipaikkaId INTEGER NOT NULL REFERENCES Toimipaikka(ToimipaikkaId)
                ON UPDATE RESTRICT
                ON DELETE RESTRICT
);

-- Profiili

CREATE TABLE Profiili (
  ProfiiliId INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  IkaMin INTEGER DEFAULT 0 CHECK (IkaMin >= 0),
  IkaMax INTEGER CHECK (IkaMax >= IkaMin),
  Sukupuoli sukupuoli
);

CREATE TABLE Aikaslotti (
  SlottiId INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- Useilla profiileilla voi olla sama slotti
  Alkuaika TIME WITHOUT TIME ZONE NOT NULL,
  Loppuaika TIME WITHOUT TIME ZONE NOT NULL CHECK (Loppuaika >= Alkuaika)
);

CREATE TABLE Maa (
  Nimi VARCHAR(100) NOT NULL PRIMARY KEY
);

CREATE TABLE Paikkakunta (
  PaikkakuntaId INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  Nimi VARCHAR(100) NOT NULL,
  MaaNimi VARCHAR(100) NOT NULL REFERENCES Maa(Nimi)
          ON UPDATE CASCADE
          ON DELETE CASCADE
);

CREATE TABLE Kuuntelija (
  KuuntelijaId INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  Sukupuoli sukupuoli NOT NULL,
  Ika INTEGER NOT NULL CHECK (Ika >= 0),
  PaikkakuntaId INTEGER NOT NULL REFERENCES Paikkakunta(PaikkakuntaId)
                ON UPDATE RESTRICT
                ON DELETE RESTRICT
);

-- Musiikki

CREATE TABLE Musiikintekija (
  TekijaId INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  Nimi VARCHAR(50)
);

CREATE TABLE Musiikkikappale (
  KappaleId INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  Nimi VARCHAR(100)
);

CREATE TABLE Genre (
  Nimi VARCHAR(50) NOT NULL PRIMARY KEY
);

-- Mainoskampanja

CREATE TABLE Mainoskampanja(
  KampanjaId INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  Nimi VARCHAR(100) NOT NULL, 
  Maararaha raha NOT NULL,
  Sekuntihinta raha NOT NULL,
  MainontaKaynnissa BOOLEAN NOT NULL DEFAULT FALSE, -- Käynnissä/Pysäytetty
  LaskuLahetetty BOOLEAN NOT NULL DEFAULT FALSE, -- Kun lasku on lähetetty, Mainostajan tiedot voidaan poistaa
  Alkupvm DATE NOT NULL,
  Loppupvm DATE NOT NULL CHECK (Loppupvm >= Alkupvm),
  MainostajaId INTEGER NOT NULL REFERENCES Mainostaja(MainostajaId)
               ON UPDATE RESTRICT
               ON DELETE CASCADE, -- Mainostajaa poistettaessa poistetaan myös kampanjat ja niihin liittyvä tieto
  ProfiiliId INTEGER REFERENCES Profiili(ProfiiliId)
             ON UPDATE RESTRICT
             ON DELETE SET NULL
);

CREATE TABLE Aanitiedosto (
  PUID puid PRIMARY KEY,
  Tiedosto BYTEA NOT NULL,
  Kesto INTERVAL MINUTE TO SECOND NOT NULL
);

CREATE TABLE Mainos (
  MainosId INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  Nimi VARCHAR(100),
  Kuvaus VARCHAR(500),
  KampanjaId INTEGER REFERENCES Mainoskampanja(KampanjaId)
             ON UPDATE RESTRICT
             ON DELETE CASCADE, -- Mainostajaa poistettaessa poistetaan kaikki mainoskampanjaan liittyvä tieto
  ProfiiliId INTEGER REFERENCES Profiili(ProfiiliId)
             ON UPDATE RESTRICT
             ON DELETE SET NULL,
  AanitiedostoId puid REFERENCES Aanitiedosto(PUID)
                 ON UPDATE RESTRICT
                 ON DELETE SET NULL
);

CREATE TABLE Mainosesitys (
  EsitysId INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  Alkuajankohta TIMESTAMP WITH TIME ZONE,
  Esitysaika INTERVAL MINUTE TO SECOND,
  MainosId INTEGER NOT NULL REFERENCES Mainos(MainosId)
           ON UPDATE RESTRICT
           ON DELETE CASCADE, -- Mainostajaa poistettaessa poistetaan kaikki mainoskampanjaan liittyvä tieto
  KuuntelijaId INTEGER REFERENCES Kuuntelija(KuuntelijaId) -- Ei saa olla null luodessa
               ON UPDATE RESTRICT
               ON DELETE SET NULL,
  KappaleId INTEGER REFERENCES Musiikkikappale(KappaleId) -- Ei saa olla null luodessa
            ON UPDATE RESTRICT
            ON DELETE SET NULL
);

CREATE TABLE Lasku (
  LaskunNumero INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  Erapvm DATE,
  Viitenro INTEGER,
  KampanjaId INTEGER NOT NULL REFERENCES Mainoskampanja(KampanjaId)
             ON UPDATE RESTRICT
             ON DELETE CASCADE -- Mainostajaa poistettaessa poistetaan kaikki mainoskampanjaan liittyvä tieto
);

CREATE TABLE Karhulasku (
  KarhulaskunNumero INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  Viivastymismaksu raha,
  Erapvm DATE,
  Viitenro INTEGER,
  LaskunNumero INTEGER NOT NULL REFERENCES Lasku(LaskunNumero)
               ON UPDATE RESTRICT
               ON DELETE CASCADE -- Mainostajaa poistettaessa poistetaan kaikki mainoskampanjaan liittyvä tieto
);

-- Suhdetaulut
-- Melkein kaikki poistopolitiikat CASCADE, jotta kantaan ei jää roikkuvia suhteita.
-- Suhdetaulut: Mainosmyyjä

CREATE TABLE MainosmyyjanKampanjat (
  KampanjaId INTEGER NOT NULL REFERENCES Mainoskampanja(KampanjaId)
             ON UPDATE RESTRICT
             ON DELETE CASCADE, -- Mainostajaa poistettaessa poistetaan kaikki mainoskampanjaan liittyvä tieto
  Tunnus VARCHAR(100) NOT NULL REFERENCES Mainosmyyja(Tunnus)
             ON UPDATE RESTRICT
             ON DELETE CASCADE,
  PRIMARY KEY (KampanjaId, Tunnus)
);

-- Suhdetaulut: Musiikki

CREATE TABLE KappaleenMusiikintekija (
  TekijaId INTEGER NOT NULL REFERENCES Musiikintekija(TekijaId)
           ON UPDATE RESTRICT
           ON DELETE CASCADE,
  KappaleId INTEGER NOT NULL REFERENCES Musiikkikappale(KappaleId)
            ON UPDATE RESTRICT
            ON DELETE CASCADE,
  PRIMARY KEY (TekijaId, KappaleId)
);

CREATE TABLE KappaleenGenre (
  KappaleId INTEGER NOT NULL REFERENCES Musiikkikappale(KappaleId)
         ON UPDATE RESTRICT
         ON DELETE CASCADE,
  GenrenNimi VARCHAR(50) NOT NULL REFERENCES Genre(Nimi)
             ON UPDATE CASCADE -- Genren nimi voi vaihtua, säilytetään suhde
             ON DELETE CASCADE,
  PRIMARY KEY (KappaleId, GenrenNimi)
);

-- Suhdetaulut: Profiili

CREATE TABLE ProfiilinSijainti (
  ProfiiliId INTEGER NOT NULL REFERENCES Profiili(ProfiiliId)
             ON UPDATE RESTRICT
             ON DELETE CASCADE,
  MaaNimi VARCHAR(100) NOT NULL REFERENCES Maa(Nimi)
          ON UPDATE CASCADE
          ON DELETE CASCADE,
  PaikkakuntaId INTEGER REFERENCES Paikkakunta(PaikkakuntaId)
          ON UPDATE RESTRICT
          ON DELETE CASCADE, -- Kun profiilille lisätään paikkakunta, haetaan myös maa
  PRIMARY KEY (ProfiiliId, MaaNimi, PaikkakuntaId)
);

CREATE TABLE ProfiilinAikaslotti (
  ProfiiliId INTEGER NOT NULL REFERENCES Profiili(ProfiiliId)
             ON UPDATE RESTRICT
             ON DELETE CASCADE,
  SlottiId INTEGER NOT NULL REFERENCES Aikaslotti(SlottiId)
           ON UPDATE RESTRICT
           ON DELETE RESTRICT, -- Useilla profiileilla voi olla sama aikaslotti, poisto triggerillä
  PRIMARY KEY (ProfiiliId, SlottiId)
);

CREATE TABLE ProfiilinMusiikintekija (
  ProfiiliId INTEGER NOT NULL REFERENCES Profiili(ProfiiliId)
             ON UPDATE RESTRICT
             ON DELETE CASCADE,
  TekijaId INTEGER NOT NULL REFERENCES Musiikintekija(TekijaId)
           ON UPDATE RESTRICT
           ON DELETE CASCADE,
  PRIMARY KEY (ProfiiliId, TekijaId)
);

CREATE TABLE ProfiilinKappale (
  ProfiiliId INTEGER NOT NULL REFERENCES Profiili(ProfiiliId)
             ON UPDATE RESTRICT
             ON DELETE CASCADE,
  KappaleId INTEGER NOT NULL REFERENCES Musiikkikappale(KappaleId)
         ON UPDATE RESTRICT
         ON DELETE CASCADE,
  PRIMARY KEY (ProfiiliId, KappaleId)
);

CREATE TABLE ProfiilinGenre (
  ProfiiliId INTEGER NOT NULL REFERENCES Profiili(ProfiiliId)
             ON UPDATE RESTRICT
             ON DELETE CASCADE,
  GenrenNimi VARCHAR(50) NOT NULL REFERENCES Genre(Nimi)
             ON UPDATE CASCADE -- Genren nimi voi vaihtua, säilytetään suhde
             ON DELETE CASCADE,
  PRIMARY KEY (ProfiiliId, GenrenNimi)
);