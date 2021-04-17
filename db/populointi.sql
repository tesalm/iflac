-- populoidaan yrityksen tiedot

INSERT INTO Toimipaikka (ToimipaikkaId, Postinumero, Postitoimipaikka) 
  VALUES (DEFAULT, '00140', 'Helsinki');

INSERT INTO YrityksenTiedot (Nimi, Tilinro, Maa, Katuosoite, ToimipaikkaId)
  VALUES ('I-Flac Ltd.', 'FI0952466000000045', 'Finland', 'Musiikkikatu 3', (SELECT T.ToimipaikkaId FROM Toimipaikka T LIMIT 1));

-- Käyttäjät

-- Taloussihteeri, salasana: kurkkumopo
SELECT lisaaTaloussihteeri('sihteeri', 'Testi', 'Testinen', 'testi.testinen@iflac.com', '$2b$08$o6uqiwzYwfuO7UaNuWgM1us5dWW.RiAkiH1we60r0g/wnLdBDidS6');
-- Mainosmyyjä, salasana: kurkkubiili
SELECT lisaaMainosmyyja('myyja', 'Mimmi', 'Myyja', 'mimmi.myyja@iflac.com', '$2b$08$Dex540nC.h53BAAksNwz0uHCoPM7tUit0Voyp5g48AItlCJBuMxo6');

-- 3 mainostajaa, joilla on yhteyshenkilöt ja laskutusosoitteet

SELECT lisaaMainostaja('LU64733811', 'Quelque Affair', 'Luxembourg', '1 Boulevard Emmanuel Servais', '2535', 'Luxembourg');
SELECT lisaaYhteyshenkilo('Pentti', 'Mäntynenä', '+352403814561', 'pentti.mantynena@quelque.com', 'Quelque Affair');

SELECT lisaaMainostaja('EE482700841', 'Moni Firma', 'Estonia', 'Rotermanni 2', '10111', 'Tallinn');
SELECT lisaaYhteyshenkilo('Mirja', 'Muropaketti', '+372503916224 ', 'muropakettimirja@monifirma.com', 'Moni Firma');

SELECT lisaaMainostaja('LV87290661422', 'Dazi Uznemums', 'Latvian', 'Aldaru iela 2/4, Centra rajons', 'LV-1050', 'Rīga');
SELECT lisaaYhteyshenkilo('Teemu', 'Teekkari', '+3714003850931', 'teemu/department=marketing@[IPv6:2001:db8::1]', 'Dazi Uznemums'); -- myös tämä on validi sähköposti! (lukekaa RFC5321 ja 5322)

-- 2 mainoskampanjaa, 3 mainosta per kampanja (äänitiedostoja ei tarvitse lisätä)

SELECT lisaaMainoskampanja('Muropaketti', 10000.00, 0.09, '2019-03-25', '2019-08-25', 'Moni Firma', 'myyja');
SELECT lisaaMainos('Suklaamurot', 'Rapean pehmeät ruskeat syötävät.', 'Muropaketti');
SELECT lisaaMainos('Riisimurot', 'Raksuvat terveelliset vaaleanruskeat nieltävät.', 'Muropaketti');
SELECT lisaaMainos('Myslimurot', 'Rouskuvat kovat vihreitä imeskeltävät.', 'Muropaketti');

SELECT lisaaMainoskampanja('Puukampanja', 50000.00, 0.08, '2019-04-01', '2019-11-01', 'Quelque Affair', 'myyja');
SELECT lisaaMainos('Mäntypuu', 'Haisee männyltä', 'Puukampanja');
SELECT lisaaMainos('Kuusipuu', 'Haisee koivulta', 'Puukampanja');
SELECT lisaaMainos('Koivupuu', 'Haisee myös koivulta', 'Puukampanja');

SELECT lisaaMainoskampanja('Jokukampanja', 500.00, 0.02, '2019-04-01', '2019-11-01', 'Dazi Uznemums', 'myyja');
SELECT lisaaMainos('Yksimainos', 'mainos yksi kuvaus', 'Jokukampanja');
SELECT lisaaMainos('Kaksimainos', 'mainos kaksi kuvaus', 'Jokukampanja');

SELECT lisaaMainoskampanja('Toinenkampanja', 1000.00, 0.05, '2019-02-22', '2019-05-01', 'Dazi Uznemums', 'myyja');
SELECT lisaaMainos('Kurkkumainos', 'Kurkku on hyvää', 'Toinenkampanja');
SELECT lisaaMainos('Mopomainos', 'Mopot on kivoja', 'Toinenkampanja');

UPDATE MainosKampanja SET MainontaKaynnissa = TRUE WHERE Nimi = 'Toinenkampanja';
INSERT INTO Aanitiedosto (PUID, Tiedosto, Kesto) VALUES('1234567890abcdefghij123456789012345678EE','\x7f','01:15');
SELECT asetaPUID('Suklaamurot', '1234567890abcdefghij123456789012345678EE');

-- 2 laskua, mukana myös ainakin yksi karhulasku

SELECT lisaaLasku((SELECT MK.KampanjaId FROM Mainoskampanja MK WHERE MK.Nimi = 'Muropaketti'), '2019-02-20', 10001);
SELECT lisaaLasku((SELECT MK.KampanjaId FROM Mainoskampanja MK WHERE MK.Nimi = 'Puukampanja'), '2019-02-14', 10002);
SELECT lisaaKarhulasku((SELECT L.LaskunNumero FROM Lasku L LIMIT 1), 50.0, '2019-03-20', 1000101);

INSERT INTO Maa(Nimi) VALUES ('Finland');
INSERT INTO Paikkakunta(Nimi, MaaNimi) VALUES('Turku','Finland');
INSERT INTO Kuuntelija(Sukupuoli, Ika, PaikkakuntaId) VALUES('Male', 17,(SELECT PaikkakuntaId FROM Paikkakunta WHERE Nimi = 'Turku'));
INSERT INTO Musiikkikappale(Nimi) VALUES('Ryhmä Hau - vufvuf');
INSERT INTO Mainosesitys(Alkuajankohta, Esitysaika, MainosId, KuuntelijaId, KappaleId) VALUES('2018-10-19 10:23:54+02', '1:04', (SELECT MainosId FROM Mainos WHERE Nimi = 'Suklaamurot'),1, 1);
INSERT INTO Mainosesitys(Alkuajankohta, Esitysaika, MainosId, KuuntelijaId, KappaleId) VALUES('2018-10-19 15:23:54+02', '1:04', (SELECT MainosId FROM Mainos WHERE Nimi = 'Suklaamurot'),1, 1);