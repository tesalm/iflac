/* Kuukausiraportti-näkymä
   Esimerkkikutsu:
   SELECT * FROM Kuukausiraportti WHERE YrityksenNimi = 'Jaakon Betoni';
*/
CREATE OR REPLACE VIEW Kuukausiraportti AS
  SELECT MK.Nimi AS kampanjaNimi, M.Nimi AS mainosNimi, MST.YrityksenNimi, 
         L.Katuosoite, T.Postinumero, T.Postitoimipaikka,
         COALESCE(A.Alkuaika,'00:00') AS Alkuaika, COALESCE(A.Loppuaika,'23:59:59') AS Loppuaika,
         EXTRACT(EPOCH FROM ATIE.Kesto) AS Kesto, MK.Sekuntihinta, ME.EsitysId, ME.Alkuajankohta,
         EXTRACT(EPOCH FROM ME.Esitysaika) AS Esitysaika,
         ((EXTRACT(EPOCH FROM ME.Esitysaika)) * Sekuntihinta) AS hinta
  FROM Mainostaja MST
  INNER JOIN Mainoskampanja MK ON MST.MainostajaId = MK.MainostajaId
  INNER JOIN Laskutusosoite L ON MST.OsoiteId = L.OsoiteId
  INNER JOIN Toimipaikka T ON L.ToimipaikkaId = T.ToimipaikkaId
  INNER JOIN Mainos M ON M.KampanjaId = MK.KampanjaId
  INNER JOIN Mainosesitys ME ON ME.MainosId = M.MainosId
  INNER JOIN Aanitiedosto ATIE ON M.AanitiedostoId = ATIE.PUID
  LEFT JOIN ProfiilinAikaslotti PAS ON MK.ProfiiliId = PAS.ProfiiliId
  LEFT JOIN Aikaslotti A ON PAS.SlottiId = A.SlottiId;

-- Mainosesitysraportti-näkymä
CREATE VIEW Mainosesitysraportti AS
  SELECT        M.MainosId, MST.YrityksenNimi AS mainostaja, MK.Nimi AS
                mainoskampanja, M.Nimi AS mainos,
                Cast(ME.Alkuajankohta AS DATE) AS esityspvm,
                Cast(ME.Alkuajankohta AS TIME) AS esitysaika,
                K.Sukupuoli AS sukupuoli, K.Ika AS ika, P.MaaNimi AS maa,
                P.Nimi AS paikkakunta, KPL.Nimi AS kappale, MT.Nimi AS esittaja,
                Genre.Nimi AS genre
  FROM          Mainostaja MST
  INNER JOIN    Mainoskampanja MK ON MST.MainostajaId = MK.MainostajaId
  INNER JOIN    Mainos M ON MK.KampanjaId = M.KampanjaId
  LEFT JOIN     Mainosesitys ME ON M.MainosId = ME.MainosId
  LEFT JOIN     Kuuntelija K ON ME.KuuntelijaId = K.KuuntelijaId
  LEFT JOIN     Paikkakunta P ON K.PaikkakuntaId = P.PaikkakuntaId
  LEFT JOIN     Musiikkikappale KPL ON ME.KappaleId = KPL.KappaleId
  LEFT JOIN     KappaleenMusiikintekija KMT ON KPL.KappaleId = KMT.KappaleId
  LEFT JOIN     Musiikintekija MT ON KMT.TekijaId = MT.TekijaId
  LEFT JOIN     KappaleenGenre KG ON KPL.KappaleId = KG.KappaleId
  LEFT JOIN     Genre ON KG.GenrenNimi = Genre.Nimi
  ORDER BY      M.MainosId;

-- KampanjanMyyjaNakyma
CREATE OR REPLACE VIEW KampanjanMyyjaNakyma AS
  SELECT        MMK.KampanjaId, HK.Etunimi AS m_Etunimi,
                HK.Sukunimi AS m_Sukunimi, YT.Nimi AS yritys,
                YT.Katuosoite, TP.Postinumero, TP.Postitoimipaikka, YT.Maa
  FROM          Yrityksentiedot YT
  INNER JOIN    Toimipaikka TP ON YT.ToimipaikkaId = TP.ToimipaikkaId,
                MainosmyyjanKampanjat MMK
  INNER JOIN    Henkilokunta HK ON MMK.Tunnus = HK.Tunnus
  ORDER BY      MMK.KampanjaId;

-- KampanjanTilaajaNakyma
CREATE OR REPLACE VIEW KampanjanTilaajaNakyma AS
  SELECT        MK.KampanjaId, YH.Etunimi AS t_Etunimi,
                YH.Sukunimi AS t_Sukunimi, MST.YrityksenNimi,
                LO.Katuosoite, TP.Postinumero, TP.Postitoimipaikka, LO.Maa
  FROM          Mainoskampanja MK
  LEFT JOIN     Mainostaja MST ON MK.MainostajaId = MST.MainostajaId
  LEFT JOIN     Yhteyshenkilo YH ON YH.MainostajaId = MST.MainostajaId
  LEFT JOIN     Laskutusosoite LO ON MST.OsoiteId = LO.OsoiteId
  LEFT JOIN     Toimipaikka TP ON LO.ToimipaikkaId = TP.ToimipaikkaId
  ORDER BY      MK.KampanjaId;

-- KampanjanTiedotNakyma
CREATE OR REPLACE VIEW KampanjanTiedotNakyma AS
  SELECT        MK.KampanjaId, MK.Nimi AS kampanja, MK.Alkupvm, MK.Loppupvm,
                MK.Sekuntihinta, MK.Maararaha,
                count(Mainos.MainosId) AS mainostenMaara
  FROM          Mainoskampanja MK
  INNER JOIN    Mainos ON MK.KampanjaId = Mainos.KampanjaId
  GROUP BY      MK.KampanjaId, kampanja, MK.Alkupvm, MK.Loppupvm,
                MK.Sekuntihinta, MK.Maararaha
  ORDER BY      MK.KampanjaId;

-- KampanjanMainoksetNakyma
CREATE OR REPLACE VIEW KampanjanMainoksetNakyma AS
  SELECT        MK.KampanjaId, Mainos.Nimi AS mainos, ASL.Alkuaika AS alkuaika,
                ASL.Loppuaika AS loppuaika, EXTRACT(EPOCH FROM Aanitiedosto.Kesto) AS pituus,
                count(ME.EsitysId) AS toistokerrat
  FROM          Mainoskampanja MK
  INNER JOIN    Mainos ON MK.KampanjaId=Mainos.KampanjaId
  LEFT JOIN     ProfiilinAikaslotti PAS ON Mainos.ProfiiliId = PAS.ProfiiliId
  LEFT JOIN     Aikaslotti ASL ON PAS.SlottiId = ASL.SlottiId
  LEFT JOIN     Aanitiedosto ON Mainos.AanitiedostoId = Aanitiedosto.PUID
  LEFT JOIN     Mainosesitys ME ON Mainos.MainosId = ME.MainosId
  GROUP BY      MK.KampanjaId, mainos, ASL.Alkuaika, ASL.Loppuaika, pituus
  ORDER BY      MK.KampanjaId;

-- Laskunäkymä
/* Esimerkkikutsu:
   SELECT * FROM LaskuNakyma LN WHERE LN.LaskunNumero = 10001
*/
CREATE OR REPLACE VIEW LaskuNakyma AS
  SELECT        Lasku.LaskunNumero, Lasku.Erapvm, Lasku.Viitenro,
                Lasku.KampanjaId, YT.Tilinro, KM.m_Etunimi, KM.m_Sukunimi,
                KM.yritys AS m_Yritys, KM.Katuosoite AS m_Katuosoite,
                KM.Postinumero AS m_Postinro, KM.Postitoimipaikka AS
                m_Postitoimipaikka, KM.Maa AS m_Maa, KTL.t_Etunimi, 
                KTL.t_Sukunimi, KTL.yrityksenNimi AS t_Yritys, KTL.Katuosoite 
                AS t_Katuosoite, KTL.Postinumero AS t_Postinro, 
                KTL.Postitoimipaikka AS t_Postitoimipaikka, KTL.Maa AS t_Maa,
                KTD.Kampanja, KTD.Alkupvm, KTD.Loppupvm,
                KTD.Sekuntihinta, KTD.Maararaha, KTD.mainostenMaara
  FROM          YrityksenTiedot YT, Lasku
  LEFT JOIN     KampanjanMyyjaNakyma KM ON Lasku.KampanjaId = KM.KampanjaId
  LEFT JOIN     KampanjanTilaajaNakyma KTL ON Lasku.KampanjaId = KTL.KampanjaId
  LEFT JOIN     KampanjanTiedotNakyma KTD ON Lasku.KampanjaId = KTD.KampanjaId
  ORDER BY      Lasku.LaskunNumero;

-- Mainoksen profiili
/* Esimerkkikutsu:
   SELECT * FROM MainoksenProfiili MP WHERE MainoksenNimi = 'Riisimuro'
*/
CREATE OR REPLACE VIEW MainoksenProfiili AS
  SELECT        M.Nimi AS mainos, MK.Nimi AS Kampanja, MST.YrityksenNimi AS
                mainostaja, P.IkaMin, P.IkaMax, P.Sukupuoli, PS.MaaNimi AS Maa,
                PK.Nimi AS Paikkakunta, ASL.Alkuaika, ASL. Loppuaika,
                Musiikintekija.Nimi AS Tekija, MKPL.Nimi AS Kappale,
                PG.GenrenNimi AS Genre
  FROM          Mainos M
  INNER JOIN    Mainoskampanja MK ON M.KampanjaId = MK.KampanjaId
  INNER JOIN    Mainostaja MST ON MK.MainostajaId = MST.MainostajaId
  LEFT JOIN     Profiili P ON M.ProfiiliId = P.ProfiiliId
  LEFT JOIN     ProfiilinSijainti PS ON P.ProfiiliId = PS.ProfiiliId
  LEFT JOIN     Paikkakunta PK ON PS.PaikkakuntaId = PK.PaikkakuntaId
  LEFT JOIN     ProfiilinAikaslotti PAS ON P.ProfiiliId = PAS.ProfiiliId
  LEFT JOIN     Aikaslotti ASL ON PAS.SlottiId = ASL.SlottiId
  LEFT JOIN     ProfiilinMusiikintekija PMUS ON P.ProfiiliId = PMUS.ProfiiliId
  LEFT JOIN     Musiikintekija ON PMUS.TekijaId = Musiikintekija.TekijaId
  LEFT JOIN     ProfiilinKappale PKPL ON P.ProfiiliId = PKPL.ProfiiliId
  LEFT JOIN     Musiikkikappale MKPL ON PKPL.KappaleId = MKPL.KappaleId
  LEFT JOIN     ProfiilinGenre PG ON P.ProfiiliId = PG.ProfiiliId
  ORDER BY      M.MainosId;
