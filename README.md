# Ryhmä Hau

Ryhmä: Mika, Teemu

Virtuaalikoneen osoite: tkannat14.cs.tut.fi

## TODO

- näkymät
- triggerit
  - ~~aikaslotin poisto (profiililla on aikaslotti, usealla profiililla sama. Profiilin poisto —> onko kyseinen aikaslotti muualla vielä käytössä vai ei)~~
  - ~~Mainostajan poisto —> poista Toimipaikka ja Laskutusosoite~~
- indeksit
- ~~mainoskampanjoilla on sekuntihinta eikä mainoksilla~~
- ~~funktio PUIDin lisäämiselle~~

## Editori

Sisennykset välilyönteinä, sisennyksen koko 2.

## Testiympäristö

### Postgres

Asenna Postgres 10: https://www.postgresql.org/download/

Varmista että pääkäyttäjä on nimellä postgres, kaikki komennot ja muut menee helpoiten.

Käynnistä Postgres, käyttöjärjestelmästä riippuen tapa vaihtelee.

Kantaa voi käpistellä esim. komennolla `psql -d tikasu -U <tunnus>`, joka avaa terminaaliin interaktiivisen postgres-komentoikkunan. Tiedoston ajaminen kantaan: `psql -d tikasu -U <tunnus> -f <tiedostopolku>`. Postgres pyytää käyttäjän salasanaa komentoa ajettaessa.

Eli esim. taulujen luonti:
```shell
psql -d tikasu -U postgres -f db/taulut.sql
```

`dropall.sql` ja `drop-and-repop.sql` ovat vaarallisia tiedostoja, joten älä aja niitä tuotantoympäristössä. `dropall` jyrää `psql` -komennolle annetun kannan täysin sileäksi ja poistaa luodut käyttäjät. `drop-and-repop` Jyrää kannan käyttäen `dropall`:ia, ja ajaa sen jälkeen muut luontitiedostot ja populoi kannan. Tiedostosta voi kommentoida pois rivejä sen mukaan, mitä luontitiedostoja haluaa ajaa. Tiedostot voidaan tietysti ajaa myös yksi kerrallaan `psql`-komennolla, mutta 6 tiedostoa ajettaessa on kivaa kirjoittaa salasana vain kerran.

### NodeJS

Asenna NodeJS 10.8.0: https://nodejs.org/en/download/releases/

```
cd backend
npm install
```

Luo backend kansioon .env -tiedosto ja lisää sinne oman ympäristösi tiedot muodossa:

```
connectionString=postgres://user:password@localhost:port/dbname
authUser=tunnus
authPassword=salasana
secret=jokumerkkijono
port=3000
```

Backendin saa käyntiin ajamalla komennon `npm start` backend-kansiossa (komento löytyy package.jsonista). Kehitysversion backendistä saa käyttöön ajamalla `npm run dev`, jolloin backend ei pyydä autentikointia jne. Näin ollen rajapinnan testaaminen helpottuu.

### React-frontend

Frontti on tehty Reactilla Create-React-App -kirjastolla.

```
cd frontend
npm install
npm start
```

Frontti löytyy osoitteesta http://localhost:3000 ja API-kutsut ohjataan http://localhost:3001 kehitysversiossa `package.json`:sta löytyvän proxy-asetuksen mukaan. Käliä siis testataan 3000-portin osoitteesta.

Tuotantoversiossa React-frontista buildataan valmis paketti, jonka Node tarjoilee itsekseen. Siellä ei siis käynnistetä Reactin kehityspalvelinta.

## Tuotantoympäristö

Varmista, että omaat käyttöoikeudet linux-koneiden etäyhteyteen (SSH): https://www.tut.fi/omatunnus

Etäyhteyden ottaminen tkannat-virtuaalikoneeseen terminaalista tapahtuu avaamalla ensin SSH-yhteys koulun linux-ympäristöön ja avaamalla linux-ympäristöstä SSH-yhteys tkannat-ympäristöön.

```shell
ssh intratunnus@linux-ssh.cc.tut.fi
ssh tkannatX.cs.tut.fi
```

### Postgres

Vaihtoehdot postgres-leikkeihin:

1. Käynnistä postgres interaktiivisessa tilassa (Postgresin logit näkyy, mutta tarvitset toisen terminaali-ikkunan muihin komentoihin koska postgres valtaa ekan ikkunan itselleen)

- Käynnistys: `postgres -D /home/kuitunem/tikasu`
- Uudessa ikkunassa voit ottaa yhteyden kantaan: `psql -d tikasu -U <tunnus>`
- Postgres pysähtyy kun alkuperäisessä ikkunassa painetaan ctrl+C

2. Kaynnistä postgres taustalle (samassa ikkunassa voi jatkaa hommia)

- Käynnistys: `pg_ctl start -D /home/kuitunem/tikasu -U <tunnus>`
- Interaktiivinen termis taas `psql -d tikasu -U <tunnus>`
- Pysäytys: `pg_ctl stop -D /home/kuitunem/tikasu -m fast`

Kantaa voi käpistellä esim. komennolla `psql -d tikasu -U <tunnus>`, joka avaa terminaaliin interaktiivisen postgres-komentoikkunan. Tiedoston ajaminen kantaan: `psql -d tikasu -U <tunnus> -f <tiedostopolku>`


### Node asennus

Tämä osio on jo tehty, mutta dokumentoitu tänne.

```
wget https://nodejs.org/dist/v10.8.0/node-v10.8.0-linux-x64.tar.xz
tar -xvf node-v10.8.0-linux-x64.tar.xz
nano .bash_profile
```

Lisää .bash_profileen rivi ennen export PATH -komentoa, kaikkien muiden PATH=... -rivien jälkeen:

```
PATH=$HOME/node-v10.8.0-linux-x64/bin:$PATH
```

### React-frontend

```
cd frontend
npm install
npm run build
```

### Node-backend

Noden portti oltava 8888

Hyödylliset komennot: Node-backendin käynnistäminen taustalle, pysäyttäminen taustalta, uusien muutoksien lataaminen:

```
pm2 start app.js -i max
pm2 stop app.js
pm2 reload app.js
```

## Huomioita

Foreign keyt ja indeksit: "Since a DELETE of a row from the referenced table or an UPDATE of a referenced column will require a scan of the referencing table for rows matching the old value, it is often a good idea to index the referencing columns. Because this is not always needed, and there are many choices available on how to index, declaration of a foreign key constraint does not automatically create an index on the referencing columns."
https://www.postgresql.org/docs/9.2/ddl-constraints.html

Primary keyt: https://blog.2ndquadrant.com/postgresql-10-identity-columns/
Käytännössä siis automaattisesti luotavaan pääavaimeen aina `Id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, suomennos: generoidaan automaattisesti joka riville, ellei käyttäjä erikseen yliaja generointia, ja käytetään pääavaimena.

`Aikaslotti`: Useilla profiileilla voi olla vierasavain samaan aikaslottiin. Tästä johtuen `ProfiilinAikaslotti`-taulussa vierasavaimen poistopolitiikka `RESTRICT` ja poisto pitää käsitellä bäkkärissä niin, että haetaan profiili ja siihen liittyvät aikaslotit, poistetaan profiili ja yritetään poistaa aikaslotit. Saattaa olla fiksua muuttaa vielä

`Mainostaja`, `Laskutusosoite`, `Toimipaikka`: Riippuvaisia ketjussa, joten poistopolitiikka `RESTRICT`. Poistettaessa ensin Mainostaja, sit Laskutusosoite, sit yritetään poistaa toimipaikka.

## Linkkejä

- https://haacked.com/archive/2007/08/21/i-knew-how-to-validate-an-email-address-until-i.aspx/
- Omat datatyypit: http://www.postgresqltutorial.com/postgresql-user-defined-data-types/
- Node ja pm2: https://www.terlici.com/2015/06/20/running-node-forever.html
