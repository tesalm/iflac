-- https://www.postgresql.org/docs/10/rules-triggers.html
--CREATE RULE MainosPoisto AS ON DELETE TO Mainos
--  DO DELETE FROM Aanitiedosto WHERE PUID = OLD.AanitiedostoId

CREATE FUNCTION PoistaAanitiedosto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM Aanitiedosto WHERE PUID = OLD.AanitiedostoId;
  RETURN NULL;
END;
$$;

CREATE TRIGGER MainosPoisto BEFORE DELETE ON Mainos
  EXECUTE PROCEDURE PoistaAanitiedosto();


-- Poista aikaslotti, jos yksikään profiili ei viittaa siihen.
CREATE FUNCTION PoistaAikaslotti()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT SlottiId FROM ProfiilinAikaslotti 
                 WHERE SlottiId = OLD.SlottiId) THEN
    DELETE FROM Aikaslotti WHERE SlottiId = OLD.SlottiId;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER AikaslottiPoisto
  AFTER DELETE ON ProfiilinAikaslotti
  FOR EACH ROW
  EXECUTE PROCEDURE PoistaAikaslotti();


-- Poista osoitetiedot, jos niihin ei ole viittauksia.
CREATE FUNCTION PoistaOsoite()
RETURNS trigger AS $$
DECLARE
  tpaikka_ID INTEGER;
BEGIN
  -- Poista laskutusosoite, jos siihen ei liity yhtään mainostajaa.
  IF NOT EXISTS (SELECT OsoiteId FROM Mainostaja 
                 WHERE OsoiteId = OLD.OsoiteId) THEN
    DELETE FROM Laskutusosoite WHERE OsoiteId = OLD.OsoiteId 
      RETURNING ToimipaikkaId INTO tpaikka_ID;
    -- Poista myös laskutusosoitteen toimipaikka, jos siihen ei liity 
    -- toisten mainostajien osoitteita.
    IF NOT EXISTS (SELECT ToimipaikkaId FROM Laskutusosoite 
                   WHERE ToimipaikkaId = tpaikka_ID) THEN
      DELETE FROM Toimipaikka WHERE ToimipaikkaId = tpaikka_ID;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER OsoitePoisto
  AFTER DELETE ON Mainostaja
  FOR EACH ROW
  EXECUTE PROCEDURE PoistaOsoite();
