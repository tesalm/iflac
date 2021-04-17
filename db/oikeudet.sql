-- Millekkään käyttäjälle (paitsi superuser) ei ole asetettu salasanaa, sillä se ei lisää tietoturvaa
-- Jos hyökkääjä korkkaa bäkkärin, kantakäyttäjien salasanatkin näkyvät hyökkääjälle

-- rajalliset oikeudet
CREATE USER KirjautumatonKayttaja;
GRANT SELECT ON Henkilokunta, Mainosmyyja, Taloussihteeri TO KirjautumatonKayttaja;

-- Henkilökunta
-- Raportit (kk ja mainos)
CREATE ROLE KirjautunutKayttaja;
GRANT SELECT ON Henkilokunta, Mainosmyyja, Taloussihteeri, Kuukausiraportti, Mainosesitysraportti TO KirjautunutKayttaja;

-- Mainosmyyjä
-- Hallinnoi kampanjoita
CREATE ROLE MainosmyyjaRooli;
GRANT ALL ON Yhteyshenkilo, Mainostaja, Mainoskampanja, Toimipaikka, Laskutusosoite, Profiili, Aikaslotti, Aanitiedosto, Mainos, MainoksenProfiili TO MainosmyyjaRooli;
GRANT INSERT ON MainosmyyjanKampanjat, ProfiilinSijainti, ProfiilinAikaslotti, ProfiilinMusiikintekija, ProfiilinKappale, ProfiilinGenre TO MainosmyyjaRooli;

-- Taloussihteeri
-- Laskuttaa
CREATE ROLE TaloussihteeriRooli;
GRANT ALL ON Lasku, Karhulasku, LaskuNakyma TO TaloussihteeriRooli;
GRANT UPDATE, SELECT ON YrityksenTiedot TO TaloussihteeriRooli;
GRANT UPDATE ON Toimipaikka TO TaloussihteeriRooli;

-- Järjestelmän omat toimenpiteet ja taulut, joille ei ole spesifioitu muuta käyttäjää
CREATE USER BackendBotti;
GRANT ALL ON Mainosesitys, KappaleenMusiikintekija, KappaleenGenre, Musiikintekija, Musiikkikappale, Genre, Kuuntelija, Maa, Paikkakunta, YrityksenTiedot TO BackendBotti;

CREATE USER Mainosmyyja IN ROLE MainosmyyjaRooli, KirjautunutKayttaja;

CREATE USER Taloussihteeri IN ROLE TaloussihteeriRooli, KirjautunutKayttaja;

CREATE USER Ylijumala IN ROLE MainosmyyjaRooli, TaloussihteeriRooli, KirjautunutKayttaja;
