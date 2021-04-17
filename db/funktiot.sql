
-- Mainosmyyjää ei voi lisätä ennen Käyttäjän lisäämistä (viittaus).
CREATE OR REPLACE FUNCTION lisaaMainosmyyja(tunnus VARCHAR, etunimi VARCHAR, 
  sukunimi VARCHAR, sposti VARCHAR, salasanaHash VARCHAR)
RETURNS VOID AS $$
DECLARE
  error VARCHAR(60);
BEGIN
  error := '';
  IF EXISTS (SELECT H.Tunnus 
             FROM Henkilokunta H
             WHERE H.Tunnus = $1) THEN
    error := ': Tunnus on jo olemassa.';
    RAISE EXCEPTION 'error';
  END IF;
  
  INSERT INTO Henkilokunta(Tunnus, Etunimi, Sukunimi, Sahkoposti, SalasanaHash)
    VALUES($1, $2, $3, $4, $5);

  INSERT INTO Mainosmyyja(Tunnus) VALUES($1);

  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'ERROR! Mainosmyyjää ei saatu lisättyä%', error;
END; 
$$ LANGUAGE 'plpgsql';



-- Taloussihteeriä ei voi lisätä ennen Käyttäjän lisäämistä (viittaus).
CREATE OR REPLACE FUNCTION lisaaTaloussihteeri(tunnus VARCHAR, etunimi VARCHAR, 
  sukunimi VARCHAR, sposti VARCHAR, salasanaHash VARCHAR)
RETURNS VOID AS $$
DECLARE
  error VARCHAR(60);
BEGIN
  error := '';
  IF EXISTS (SELECT H.Tunnus 
             FROM Henkilokunta H
             WHERE H.Tunnus = $1) THEN
    error := ': Tunnus on jo olemassa.';
    RAISE EXCEPTION 'error';
  END IF;
  
  INSERT INTO Henkilokunta(Tunnus, Etunimi, Sukunimi, Sahkoposti, SalasanaHash)
    VALUES($1, $2, $3, $4, $5);

  INSERT INTO Taloussihteeri(Tunnus) VALUES($1);

  EXCEPTION 
    WHEN OTHERS THEN RAISE EXCEPTION 'ERROR! Taloussihteeriä ei saatu lisättyä%', error;
END;
$$ LANGUAGE 'plpgsql';


CREATE OR REPLACE FUNCTION lisaaLasku(kampanjaId INTEGER,
  erapvm DATE DEFAULT NULL, viite INTEGER DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  error VARCHAR(60);
  kampanja_ID INTEGER;
  lasku_ID INTEGER;
BEGIN
  error := '';
  IF NOT EXISTS (SELECT MK.KampanjaId
                 FROM Mainoskampanja MK
                 WHERE MK.KampanjaId = $1) THEN
    error := ': Tuntematon kampanjan id';
    RAISE EXCEPTION 'error';
  END IF;

  INSERT INTO Lasku(KampanjaId, Erapvm, Viitenro)
    VALUES($1, $2, $3) RETURNING LaskunNumero INTO lasku_ID;

  RETURN lasku_ID;

  EXCEPTION 
    WHEN OTHERS THEN RAISE EXCEPTION 'ERROR! Laskua ei saatu lisättyä%', error;
END;
$$ LANGUAGE 'plpgsql';


CREATE OR REPLACE FUNCTION lisaaKarhulasku(laskunro INTEGER, viivastysmaksu raha, erapvm DATE, 
  viite INTEGER)
RETURNS INTEGER AS $$
DECLARE
  error VARCHAR(60);
  lasku_ID INTEGER;
BEGIN
  error := '';
  IF NOT EXISTS (SELECT L.LaskunNumero 
                 FROM Lasku L
                 WHERE L.LaskunNumero = $1) THEN
    error := ': Tuntematon laskun numero';
    RAISE EXCEPTION 'error';
  END IF;

  INSERT INTO Karhulasku(LaskunNumero, Viivastymismaksu, Erapvm, Viitenro)
    VALUES($1, $2, $3, $4) RETURNING Karhulaskunnumero INTO lasku_ID;

  RETURN lasku_ID;

  EXCEPTION 
    WHEN OTHERS THEN RAISE EXCEPTION 'ERROR! Karhulaskua ei saatu lisättyä%', error;
END;
$$ LANGUAGE 'plpgsql';



CREATE OR REPLACE FUNCTION lisaaMainosmyyjaKampanja(kampanjaNimi VARCHAR, tunnus VARCHAR)
RETURNS VOID AS $$
DECLARE
  error VARCHAR(60);
  kampanja_ID INTEGER;
BEGIN
  error := '';
  SELECT MK.KampanjaId INTO kampanja_ID FROM Mainoskampanja MK WHERE MK.Nimi = $1;
    
  IF kampanja_ID IS NULL THEN
    error := ': Annettua mainoskampanjaa ei löytynyt.';
    RAISE EXCEPTION 'error';
  END IF;
  
  IF NOT EXISTS (SELECT M.Tunnus 
                 FROM Mainosmyyja M
                 WHERE M.Tunnus = $2) THEN
    error := ': Annetulla tunnuksella ei löytynyt mainosmyyjää.';
    RAISE EXCEPTION 'error';
  END IF;

  INSERT INTO MainosmyyjanKampanjat(KampanjaId, Tunnus)
    VALUES(kampanja_ID, tunnus);

  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'ERROR! Mainosmyyjän kampanjaa ei saatu lisättyä%', error;
END;
$$ LANGUAGE 'plpgsql';



CREATE OR REPLACE FUNCTION lisaaMainoskampanja(nimi VARCHAR, maararaha raha, sekuntihinta raha, alkuPvm DATE, loppuPvm DATE, 
  mainostaja VARCHAR, mainosmyyja VARCHAR, kaynnissa BOOLEAN DEFAULT FALSE, laskutettu BOOLEAN DEFAULT FALSE)
RETURNS VOID AS $$
DECLARE
  error VARCHAR(60);
  mainostaja_ID INTEGER;
  kampanja_ID INTEGER;
BEGIN
  error := '';
  SELECT M.MainostajaId INTO mainostaja_ID FROM Mainostaja M WHERE M.YrityksenNimi = $6;
  
  IF mainostaja_ID IS NULL THEN
    error := ': Annettua mainostajaa ei löytynyt.';
    RAISE EXCEPTION 'error';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM Mainosmyyja WHERE Tunnus = $7) THEN
    error := ': Annettua mainosmyyjää ei löytynyt.';
    RAISE EXCEPTION 'error';
  END IF;
  
  INSERT INTO Mainoskampanja(KampanjaId, Nimi, Maararaha, Sekuntihinta, MainontaKaynnissa, LaskuLahetetty, Alkupvm, Loppupvm, 
    MainostajaId) VALUES(DEFAULT, $1, $2, $3, $8, $9, $4, $5, mainostaja_ID)
    RETURNING KampanjaId INTO kampanja_ID;
  
  INSERT INTO MainosmyyjanKampanjat(KampanjaId, Tunnus)
    VALUES(kampanja_ID, $7);

  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'ERROR! Mainoskampanjaa ei saatu lisättyä%', error;
END;
$$ LANGUAGE 'plpgsql';



CREATE OR REPLACE FUNCTION lisaaYhteyshenkilo(enimi VARCHAR, snimi VARCHAR, puh VARCHAR, 
  sposti VARCHAR, mainostaja VARCHAR)
RETURNS VOID AS $$
DECLARE
  error VARCHAR(60);
  mainostaja_ID INTEGER;
BEGIN
  error := '';
  SELECT M.MainostajaId INTO mainostaja_ID FROM Mainostaja M WHERE M.YrityksenNimi = $5;
  
  IF mainostaja_ID IS NULL THEN
    error := ': Annettua mainostajaa ei löytynyt.';
    RAISE EXCEPTION 'error';
  END IF;

  INSERT INTO Yhteyshenkilo(Etunimi, Sukunimi, Puhelinnro, Sahkoposti, MainostajaId)
    VALUES($1, $2, $3, $4, mainostaja_ID);

  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'ERROR! Yhteyshenkilöä ei saatu lisättyä%', error;
END;
$$ LANGUAGE 'plpgsql';



CREATE OR REPLACE FUNCTION lisaaMainostaja(vat VARCHAR, yritysNimi VARCHAR, 
  maa VARCHAR, katuos VARCHAR, postinro VARCHAR, toimipaikka VARCHAR)
RETURNS VOID AS $$
DECLARE
  osoite_ID INTEGER;
  tpaikkaID INTEGER;
BEGIN
  SELECT T.ToimipaikkaId INTO tpaikkaID FROM Toimipaikka T 
    WHERE T.Postinumero = $5 AND T.Postitoimipaikka = $6;
  SELECT L.OsoiteId INTO osoite_ID FROM Laskutusosoite L 
    WHERE L.Maa = $3 AND L.Katuosoite = $4;

  IF tpaikkaID IS NULL THEN
    INSERT INTO Toimipaikka(Postinumero, Postitoimipaikka) VALUES($5, $6)
       RETURNING ToimipaikkaId INTO tpaikkaID;
  END IF;
	
  IF osoite_ID IS NULL THEN
    INSERT INTO Laskutusosoite(Maa, Katuosoite, ToimipaikkaId)         
      VALUES($3, $4, tpaikkaID) RETURNING OsoiteId INTO osoite_ID;
  END IF;
  
  INSERT INTO Mainostaja(VATtunnus, YrityksenNimi, OsoiteId)         
    VALUES($1, $2, osoite_ID);

  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'Mainostajaa ei saatu lisättyä';
END; 
$$ LANGUAGE 'plpgsql';



CREATE OR REPLACE FUNCTION lisaaMainos(nimi VARCHAR, kuvaus VARCHAR,
  kampanjaNimi VARCHAR, pu_id puid DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  error VARCHAR(60);
  kampanja_ID INTEGER;
BEGIN
  error := '';
  SELECT MK.KampanjaId INTO kampanja_ID FROM Mainoskampanja MK WHERE MK.Nimi = $3;
  IF kampanja_ID IS NULL THEN
    error := ': Tuntematon mainoskampanja';
    RAISE EXCEPTION 'error';
  END IF;
  
  IF pu_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT A.PUID 
                   FROM Aanitiedosto A
                   WHERE A.PUID = $4) THEN
      error := ': Tuntematon PUID';
      RAISE EXCEPTION 'error';
    END IF;
  END IF;
  
  INSERT INTO Mainos(Nimi, Kuvaus, KampanjaId, AanitiedostoId) 
    VALUES($1, $2, kampanja_ID, $4);
  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'Mainosta ei saatu lisättyä%', error;
END; 
$$ LANGUAGE 'plpgsql';


-- Aseta mainokselle äänitiedosto.
-- @Parametrit: mainoksen nimi, äänitiedoston ID
CREATE OR REPLACE FUNCTION asetaPUID(mainos VARCHAR, pu_id puid)
RETURNS VOID AS $$
DECLARE
  error VARCHAR(60);
BEGIN
  error := '';
  IF NOT EXISTS (SELECT Nimi FROM Mainos
                 WHERE Nimi = $1) THEN
    error := ': Tuntematon mainos.';
    RAISE EXCEPTION 'error';
  END IF;
  IF NOT EXISTS (SELECT PUID FROM Aanitiedosto
                 WHERE PUID = $2) THEN
    error := ': Tuntematon PUID.';
    RAISE EXCEPTION 'error';
  END IF;

  UPDATE Mainos SET AanitiedostoId = $2 WHERE Nimi = $1;
  
  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'PUID lisäys ei onnistunut%', error;
END; 
$$ LANGUAGE 'plpgsql';



--- Profiili proseduurit ---

CREATE OR REPLACE FUNCTION lisaaProfiili(ikaMin INTEGER, ikaMax INTEGER, 
  sukup sukupuoli, kampanjaNimi VARCHAR)
RETURNS VOID AS $$
DECLARE
  error VARCHAR(60);
  pid INTEGER;
BEGIN
  error := '';
  IF NOT EXISTS (SELECT MK.Nimi 
                 FROM Mainoskampanja MK
                 WHERE MK.Nimi = $4) THEN
    error := ': Annettua mainoskampanjaa ei löytynyt.';
    RAISE EXCEPTION 'error';
  END IF;
  
  INSERT INTO Profiili(IkaMin, IkaMax, Sukupuoli) VALUES($1, $2, $3) 
    RETURNING ProfiiliId INTO pid;
  UPDATE Mainoskampanja SET ProfiiliId = pid WHERE Nimi = $4;
  
  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'Profiilia ei saatu lisättyä%', error;
END; 
$$ LANGUAGE 'plpgsql';



CREATE OR REPLACE FUNCTION lisaaProfiilinMusiikintekija(
  kampanjaNimi VARCHAR, musiikintekijaNimi VARCHAR)
RETURNS VOID AS $$
DECLARE
  error VARCHAR(60);
  tekija_ID INTEGER;
  profiili_ID INTEGER;
BEGIN
  error := '';
  SELECT MK.ProfiiliId INTO profiili_ID FROM Mainoskampanja MK WHERE MK.Nimi = $1;
  IF profiili_ID IS NULL THEN
    error := ': Annettulla mainoskampanjalla ei ole profiilia';
    RAISE EXCEPTION 'error';
  END IF;
  
  SELECT MT.TekijaId INTO tekija_ID FROM Musiikintekija MT WHERE MT.Nimi = $2;
  IF tekija_ID IS NULL THEN
    error := ': Annettua musiikintekijää ei löytynyt';
    RAISE EXCEPTION 'error';
  END IF;
  
  INSERT INTO ProfiilinMusiikintekija(ProfiiliId, TekijaId)
    VALUES(profiili_ID, tekija_ID);
  
  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'Profiilin musiikintekijää ei saatu lisättyä%', error;
END; 
$$ LANGUAGE 'plpgsql';



CREATE OR REPLACE FUNCTION lisaaProfiilinSijainti(kampanjaNimi VARCHAR, 
  maa VARCHAR, paikkakunta VARCHAR)
RETURNS VOID AS $$
DECLARE
  error VARCHAR(60);
  pkunta_ID INTEGER;
  profiili_ID INTEGER;
BEGIN
  error := '';
  SELECT MK.ProfiiliId INTO profiili_ID FROM Mainoskampanja MK WHERE MK.Nimi = $1;
  IF profiili_ID IS NULL THEN
    error := ': Annettulla mainoskampanjalla ei ole profiilia';
    RAISE EXCEPTION 'error';
  END IF;
  
  SELECT P.PaikkakuntaId INTO pkunta_ID FROM Paikkakunta P WHERE P.MaaNimi = $2 
    AND P.Nimi = $3;
  IF pkunta_ID IS NULL THEN -- Paikkakunnat ja maat haetaan tietokannasta
    error := ': Annettua paikkakuntaa/maata ei löytynyt';
    RAISE EXCEPTION 'error';
  END IF;
  
  INSERT INTO ProfiilinSijainti(ProfiiliId, MaaNimi, PaikkakuntaId)
    VALUES(profiili_ID, $2, pkunta_ID);
  
  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'Profiilin sijaintia ei saatu lisättyä%', error;
END; 
$$ LANGUAGE 'plpgsql';



CREATE OR REPLACE FUNCTION lisaaProfiilinAikaslotti(kampanjaNimi VARCHAR, 
  alku TIME WITHOUT TIME ZONE, loppu TIME WITHOUT TIME ZONE)
RETURNS VOID AS $$
DECLARE
  error VARCHAR(60);
  slot_ID INTEGER;
  profiili_ID INTEGER;
BEGIN
  error := '';
  SELECT MK.ProfiiliId INTO profiili_ID FROM Mainoskampanja MK WHERE MK.Nimi = $1;
  IF profiili_ID IS NULL THEN
    error := ': Annettulla mainoskampanjalla ei ole profiilia';
    RAISE EXCEPTION 'error';
  END IF;
  
  SELECT A.SlottiId INTO slot_ID FROM Aikaslotti A WHERE A.Alkuaika = $2 
    AND A.Loppuaika = $3;
  IF slot_ID IS NULL THEN
    INSERT INTO Aikaslotti(Alkuaika, Loppuaika) VALUES($2, $3) 
	  RETURNING SlottiId INTO slot_ID;
  END IF;
  
  INSERT INTO ProfiilinAikaslotti(ProfiiliId, SlottiId)
    VALUES(profiili_ID, slot_ID);
  
  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'Profiilin aikaslottia ei saatu lisättyä%', error;
END; 
$$ LANGUAGE 'plpgsql';



CREATE OR REPLACE FUNCTION lisaaProfiilinGenre(kampanjaNimi VARCHAR, genreNimi VARCHAR)
RETURNS VOID AS $$
DECLARE
  error VARCHAR(60);
  profiili_ID INTEGER;
BEGIN
  error := '';
  SELECT MK.ProfiiliId INTO profiili_ID FROM Mainoskampanja MK WHERE MK.Nimi = $1;
  IF profiili_ID IS NULL THEN
    error := ': Annettulla mainoskampanjalla ei ole profiilia';
    RAISE EXCEPTION 'error';
  END IF;
  
  IF NOT EXISTS (SELECT G.GenrenNimi 
                 FROM Genre G
                 WHERE G.GenrenNimi = $2) THEN
    error := ': Tuntematon genre';
    RAISE EXCEPTION 'error';
  END IF;
  
  INSERT INTO ProfiilinGenre(ProfiiliId, GenrenNimi) VALUES(profiili_ID, $2);
  
  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'Profiilin genreä ei saatu lisättyä%', error;
END; 
$$ LANGUAGE 'plpgsql';



CREATE OR REPLACE FUNCTION lisaaProfiilinKappale(kampanjaNimi VARCHAR, kappale VARCHAR)
RETURNS VOID AS $$
DECLARE
  error VARCHAR(60);
  profiili_ID INTEGER;
  kappale_ID INTEGER;
BEGIN
  error := '';
  SELECT MK.ProfiiliId INTO profiili_ID FROM Mainoskampanja MK WHERE MK.Nimi = $1;
  IF profiili_ID IS NULL THEN
    error := ': Annettulla mainoskampanjalla ei ole profiilia';
    RAISE EXCEPTION 'error';
  END IF;
  
  SELECT M.KappaleId INTO kappale_ID FROM Musiikkikappale M WHERE M.Nimi = $2;
  IF kappale_ID IS NULL THEN
    error := ': Tuntematon kappale';
    RAISE EXCEPTION 'error';
  END IF;
  
  INSERT INTO ProfiilinGenre(ProfiiliId, KappaleId) VALUES(profiili_ID, kappale_ID);
  
  EXCEPTION
    WHEN OTHERS THEN RAISE EXCEPTION 'Profiilin kappaletta ei saatu lisättyä%', error;
END; 
$$ LANGUAGE 'plpgsql';


