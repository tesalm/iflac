const env = require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');

const postgresApi = require('./postgresApi');
const auth = require('./auth');
const { verifyAuth, verifyMyyja, verifySihteeri } = require('./auth');
const { isNull, sumReducer } = require('./utils');

// Vakioarvot
const port = process.env.port || 3001
const apiString = '/api/v1/';

// Sovellus

const app = express();
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'build')));

// Basic version of calling postgresApi functions, always returns 200 (OK) if the query succeeds.
// Returns 500 (Internal server error) otherwise
async function callPostgres(callable, res) {
  try {
    result = await callable;
    console.log(result);
    res.status(200).send(result);
  }
  catch(e) {
    console.error(e.stack);
    res.status(500).send(e.message);
  }
}

// URL-polut

// Kirjautuminen
app.post(apiString + 'auth', async (req, res) => {
  console.log(req.body);

  if (!req.body.username || !req.body.password) {
    return res.status(401).send({ 'message': 'Missing username or password.' });
  }

  try {
    result = await postgresApi.getUser(req.body.username);
    console.log(result);

    if (!result) {
      return res.status(401).send({ 'message': 'Väärä käyttäjätunnus tai salasana.' });
    }

    if(!auth.comparePassword(req.body.password, result.salasanahash)) {
      return res.status(401).send({ 'message': 'Väärä käyttäjätunnus tai salasana.' });
    }

    const token = auth.generateToken(result.tunnus);
    return res.status(200).send({ token });
  }
  catch(e) {
    console.error(e.stack);
    res.status(500).send(e.message);
  }
});

// Henkilökunnan käyttötapaukset

// Kampanjoiden listaus
app.get(apiString + 'campaigns', verifyAuth, (req, res) => {
  console.log('campaigns');
  callPostgres(postgresApi.campaignList(), res);
});

// Taloussihteerin käyttötapaukset

// 1.5 Laskutus - lista laskuista valitun rajauksen perusteella
app.get(apiString + 'billing', verifyAuth, verifySihteeri, (req, res) => {
  console.log('billing');
  callPostgres(postgresApi.invoiceListing(), res);
});

// 1.5 Laskutus - valitun laskun tiedot näytetään (oletuksena 1. listassa)
app.get(apiString + 'billing/info/:id', verifyAuth, verifySihteeri, async (req, res) => {
  console.log('billing/info');

  try {
    result = await postgresApi.invoiceInfo(req.params.id);

    if (result === undefined) {
      res.status(404).send(`laskunumerolla ${req.params.id} ei löydy yhtään laskua.`);
    }

    result.mainokset.forEach((mainos, index) => {
      result.mainokset[index].kokonaishinta = (isNull(mainos.pituus) ? 0 : mainos.pituus) * mainos.toistokerrat * result.sekuntihinta;
    });

    result.kokonaissumma = result.mainokset.map(mainos => {
      return mainos.kokonaishinta;
    }).reduce(sumReducer);

    console.log(result);
    res.status(200).send(result);
  }
  catch(e) {
    console.error(e.stack);
    res.status(500).send(e.message);
  }
});

// 1.5.1 Laskun lisääminen ("lisää lasku" valittu)
app.get(apiString + 'billing/newinvoice', verifyAuth, verifySihteeri, (req, res) => {
  console.log('noinvoicelist');
  callPostgres(postgresApi.noInvoiceList(), res);
});

// 1.5.1 Laskun lisääminen kampanjalle
// body: advertiser, duedate, reference, accountno, campaign
app.post(apiString + 'billing/newinvoice/create', verifyAuth, verifySihteeri, async (req, res) => {
  console.log('createinvoice');
  try {
    result = await postgresApi.createInvoice(req.body.campaignid, req.body.duedate, req.body.reference);
    console.log(result);

    res.status(201).send({ laskunnumero: result[0].lisaalasku });
  }
  catch(e) {
    console.error(e.stack);
    res.status(500).send(e.message);
  }
});

// 1.5.2 Laskun muokkaaminen - lasku tiedot -alueella muokattu kentän tietoja
// body: field, content
app.put(apiString + 'billing/modify/:id', verifyAuth, verifySihteeri, (req, res) => {
  console.log('modifyinvoice');
  console.log(req.body);
  console.log(req.params.id);
  callPostgres(postgresApi.modifyInvoice(req.params.id,
               req.body.duedate, req.body.reference), res);
});

// 1.5.3 Laskun lähettäminen ("lähetä lasku" valittu) -> näytetään lasku
app.get(apiString + 'billing/invoice/:id', verifyAuth, verifySihteeri, (req, res) => {
  console.log('invoiceinfo');
  callPostgres(postgresApi.invoiceInfo(req.params.id), res);
});

// 1.5.3 Laskun lähettäminen (lasku näytetty ja "lähetä" valittu)
app.put(apiString + 'billing/invoice/send/:campaignid', verifyAuth, verifySihteeri, async (req, res) => {
  console.log('sendinvoice');
  try {
    result = await postgresApi.sendInvoice(req.params.campaignid);

    if (result === 404) {
      res.status(404).send(`Kampanjaa id:llä ${req.params.campaignid} ei löydy.`);
    }
    else if (result === 403) {
      res.status(403).send(`Kampanja id:llä ${req.params.campaignid} on ` +
                          `vielä käynnissä. Laskua ei voida lähettää.`);
    }
    else {
      res.status(200).send('Lasku lähetetty!');
    }

  } catch (e) {
    console.error(e.stack);
    res.status(500).send(e.message);
  }
});

// 1.5.4 Laskun poistaminen ("poista lasku" valittu)
app.delete(apiString + 'billing/delete/:id', verifyAuth, verifySihteeri, async (req, res) => {
  console.log('deleteInvoice');
  try {
    result = await postgresApi.deleteInvoice(req.params.id);

    if (result === 403) {
      res.status(403).send(`Laskuun numerolla ${req.params.id} liittyy karhulasku. Laskua ei voi poistaa.`);
    } else 
    {
      res.status(200).send('Lasku poistettu.');
    }

  } catch (e) {
    console.error(e.stack);
    res.status(500).send(e.message);
  }
});

// 1.5.5 Karhulaskun lisääminen ("lisää karhulasku" valittu)
// Body: total, duedate, reference
app.post(apiString + 'billing/invoice/:id/reminder', verifyAuth, verifySihteeri, async (req, res) => {
  console.log('createreminderinvoice');
  try {
    result = await postgresApi.createReminderInvoice(req.params.id, req.body.total, 
      req.body.duedate, req.body.reference);
    console.log(result);

    res.status(201).send({ karhulaskunnumero: result[0].lisaakarhulasku });
  }
  catch(e) {
    console.error(e.stack);
    res.status(500).send(e.message);
  }
});

app.put(apiString + 'billing/invoice/reminder/:id', verifyAuth, verifySihteeri, (req, res) => {
  console.log('modifyreminderinvoice');
  console.log(req.body);
  callPostgres(postgresApi.modifyReminderInvoice(req.params.id,
    req.body.remindercost, req.body.duedate, req.body.reference), res);
});

app.delete(apiString + 'billing/invoice/reminder/delete/:id', verifyAuth, verifySihteeri, (req, res) => {
  console.log('deleteinvoice');
  callPostgres(postgresApi.deleteReminderInvoice(req.params.id), res);
})

// 1.6 Kuukausiraportin lähettäminen (listaus mainostajista)
app.get(apiString + "advertisers", verifyAuth, (req, res) => {
  callPostgres(postgresApi.advertiserListing(), res);
});

// Poikkeukset: Mainostajalla ei ole esitettyjä mainoksia hakuehtona annetun kuukauden aikana:
// Järjestelmä palaa tilaan, jossa se oli ennen lähetystoiminnon valintaa.
// 1.6 Kuukausiraportin lähettäminen (mainostaja valittu + kuukausi, vuosi)
// Body: advertiser, year, month
app.get(apiString + 'monthly-report/:advertiser/:year/:month', verifyAuth, async (req, res) => {
  try {
    result = await postgresApi.monthlyReport(req.params.advertiser, req.params.year, req.params.month);

    if (result === 404) {
      res.status(404).send('Mainostajalla ei ole esitettyjä mainoksia hakuehtona annetun kuukauden aikana.');
    }

    console.log(result);
    res.status(200).send(result);
  }
  catch(e) {
    console.error(e.stack);
    res.status(500).send(e.message);
  }
});

// 1.6 Kuukausiraportin lähettäminen ("lähetä raportti" valittu)
app.get(apiString + 'send-monthly-report', verifyAuth, (req, res) => {
  res.status(200).send('Kuukausiraportti lähetetty!');
});

// 1.7 Listataan mainokset, joilla mainosesityksiä
app.get(apiString + 'advertisements', verifyAuth, (req, res) => {
  callPostgres(postgresApi.advertisementListing(), res);
});

// 1.7 Mainosesitysraportin lähettäminen: näytä raportti (mainosid)
app.get(apiString + 'replay-report/:id', verifyAuth, async (req, res) => {
  console.log('advertisementReport');
  callPostgres(postgresApi.advertisementReport(req.params.id), res);
});

// 1.7. Mainosesitysraportin lähettäminen
app.get(apiString + 'send-replay-report', verifyAuth, (req, res) => {
  res.status(200).send('Mainosesitysraportti lähetetty!');
});

app.get(apiString + '*', (req, res) => {
  console.log('404')
  res.sendStatus(404);
});

// Kaikki muut React-fronttiin
app.get('*', function(req, res) {
  console.log('Frontend');
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => console.log(`App listening on port ${port}`));
