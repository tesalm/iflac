const { Pool, types } = require('pg');
types.setTypeParser(1700, function(val) {
  return parseFloat(val)
})

async function getUser(username) {
  const query = 'SELECT * FROM Henkilokunta WHERE Tunnus = $1';
  const result = await dbQuery(query, [username]);
  return result[0];
}

async function getMainosmyyja(username) {
  const query = 'SELECT * FROM Mainosmyyja WHERE Tunnus = $1';
  const result = await dbQuery(query, [username]);
  return result[0];
}

async function getTaloussihteeri(username) {
  const query = 'SELECT * FROM Taloussihteeri WHERE Tunnus = $1';
  const result = await dbQuery(query, [username]);
  return result[0];
}

// campaignList - Case unknown: listing all campaigns
async function campaignList() {
  const query = 'SELECT MK.KampanjaId, MK.Nimi FROM Mainoskampanja MK';
  return await dbQuery(query, []);
}

// invoiceListing – Case 1.5
async function invoiceListing(id) {
  const query1 = 'SELECT * FROM Lasku ORDER BY Laskunnumero ASC';
  result = await dbQuery(query1, []);

  const query2 = 'SELECT * FROM Karhulasku ORDER BY Karhulaskunnumero ASC';
  reminders = await dbQuery(query2, []);

  result.forEach(inv => {
    inv.karhulaskut = [];
  })

  reminders.forEach(reminder => {
    const index = result.findIndex(invoice => {
      return invoice.laskunnumero === reminder.laskunnumero;
    });

    result[index].karhulaskut.push(reminder);
  });

  return result;
}

// Case 1.5 & Case 1.5.3
async function invoiceInfo(id) {
  const query1 = 'SELECT * FROM LaskuNakyma LN WHERE LN.LaskunNumero = $1';
  let result = await dbQuery(query1, [id]);
  result = result[0];

  if (result === undefined) {
    return undefined;
  }

  const campaignId = result.kampanjaid;
  const query2 = 'SELECT mainos, alkuaika, loppuaika, pituus, toistokerrat ' +
                 'FROM KampanjanMainoksetNakyma MN WHERE MN.KampanjaId = $1';
  const ads = await dbQuery(query2, [campaignId]);

  result.mainokset = ads;

  const query3 = 'SELECT * FROM Karhulasku WHERE Laskunnumero = $1 ORDER BY Karhulaskunnumero ASC';
  const reminders = await dbQuery(query3, [campaignId]);

  result.karhulaskut = reminders;

  return result;
}

// noInvoiceList - Case 1.5.1
async function noInvoiceList() {
  const query = 'SELECT * FROM Mainoskampanja MK ' +
                'INNER JOIN Mainostaja ON MK.MainostajaId = Mainostaja.MainostajaId ' +
                'WHERE MK.MainontaKaynnissa = FALSE AND ' +
                'MK.LaskuLahetetty = FALSE';
  return await dbQuery(query, []);
}

// createInvoice - Case 1.5.1
async function createInvoice(campaignId, dueDate, reference) {
  const query = 'SELECT lisaaLasku($1, $2, $3)';
  let values = [campaignId, null, null];

  (dueDate !== undefined) && (values[1] = dueDate);
  (reference !== undefined) && (values[2] = reference);

  return await dbQuery(query, values, false);
}

// TODO: ei toimi: "syntax error near $2 "
// modifyInvoice – Case 1.5.2
async function modifyInvoice(id, dueDate, refNumber) {
  const query = 'UPDATE Lasku SET Erapvm = $2, Viitenro = $3 WHERE LaskunNumero = $1';
  const values = [id, dueDate, refNumber];
  return await dbQuery(query, values, false);
}

// sendInvoice – Case 1.5.3
async function sendInvoice(campaignId) {
  const query1 = 'SELECT * FROM mainoskampanja WHERE kampanjaid = $1';
  let result = await dbQuery(query1,[campaignId]);
  result = result[0];

  if (result === undefined) {
    return 404;
  }
  else if (result.mainontakaynnissa === true) {
    return 403;
  }

  const query2 = 'UPDATE Mainoskampanja ' +
                'SET LaskuLahetetty = TRUE ' +
                'WHERE KampanjaId = $1';
  await dbQuery(query2, [campaignId], false); // TODO: error check

  return 200;
}

// deleteInvcoie – Case 1.5.4
async function deleteInvoice(id) {
  const query1 = 'SELECT * FROM Karhulasku WHERE LaskunNumero = $1';
  let result = await dbQuery(query1, [id]);
  result = result[0];

  if (result !== undefined) {
    return 403;
  }

  const query2 = 'DELETE FROM Lasku WHERE LaskunNumero = $1';
  return await dbQuery(query2, [id], false);
}

// createReminderInvoice – Case 1.5.5
async function createReminderInvoice(id, total, dueDate, reference) {
  const query = 'SELECT lisaaKarhulasku($1, $2, $3, $4)'
  let values = [id, undefined, undefined, undefined];

  (total !== undefined) && (values[1] = total);
  (dueDate !== undefined) && (values[2] = dueDate);
  (reference !== undefined) && (values[3] = reference);

  return await dbQuery(query, values, false);
}

async function modifyReminderInvoice(id, total, dueDate, reference) {
  const query = 'UPDATE Karhulasku SET Viivastymismaksu = $2, Erapvm = $3, Viitenro = $4 WHERE LaskunNumero = $1';
  const values = [id, total, dueDate, reference];
  return await dbQuery(query, values, false);
}

async function deleteReminderInvoice(id) {
  const query = 'DELETE FROM Karhulasku WHERE Karhulaskunnumero = $1';
  return await dbQuery(query, [id], false);
}

// advertiserListing - Case 1.6: show advertisers
async function advertiserListing() {
  var query = "SELECT yrityksennimi FROM Mainostaja;";
  return await dbQuery(query, [], false);
}

// monthlyReport - Case 1.6: show report
async function monthlyReport(advertiser, year, month) {
  const query = 
    "SELECT kampanjaNimi, mainosNimi, YrityksenNimi, Katuosoite,"+
           "Postinumero, Postitoimipaikka, (Alkuaika, Loppuaika) AS Lahetysaika, Kesto,"+
           "SUM(Esitysaika) AS Esitysaika,"+
           "COUNT(DISTINCT EsitysId) AS Vastaanotettu,"+
           "SUM(hinta) AS Mainoksen_hinta "+
    "FROM  Kuukausiraportti "+
    "WHERE YrityksenNimi = $1 AND "+
          "EXTRACT(YEAR FROM Alkuajankohta) = $2 AND "+
          "EXTRACT(MONTH FROM Alkuajankohta) = $3 "+
    "GROUP BY kampanjaNimi, mainosNimi, YrityksenNimi, Katuosoite, Postinumero,"+ 
             "Postitoimipaikka, Lahetysaika, Kesto, Sekuntihinta, Esitysaika;";
  const values = [advertiser, year, month];
  const result = await dbQuery(query,values);
  
  if (result[0] === undefined) {
    return 404;
  }
  return result;
}

// advertisementListing – Case 1.7: show advertisements with shows
async function advertisementListing() {
  const query = 'SELECT Mainos.Nimi, Mainos.MainosId ' +
                'FROM Mainos ' +
                'INNER JOIN Mainosesitys ME ON Mainos.MainosId = ME.MainosId ' +
                'GROUP BY Mainos.Nimi, Mainos.MainosId';
  return await dbQuery(query, []);
}

// advertisementReport – Case 1.7: show report
async function advertisementReport(id) {
  const query = 'SELECT mainostaja, mainoskampanja, mainos, esityspvm, ' +
                'esitysaika, sukupuoli, ika, maa, paikkakunta, kappale, ' +
                'esittaja, genre ' +
                'FROM Mainosesitysraportti WHERE MainosId = $1';
  return await dbQuery(query, [id]);
}


module.exports = {
  getUser,
  getMainosmyyja,
  getTaloussihteeri,
  campaignList,
  invoiceListing,
  invoiceInfo,
  noInvoiceList,
  createInvoice,
  modifyInvoice,
  sendInvoice,
  deleteInvoice,
  createReminderInvoice,
  modifyReminderInvoice,
  deleteReminderInvoice,
  advertisementListing,
  advertisementReport,
  advertiserListing,
  monthlyReport
};

/**
 * Run a database query
 * @param {string} queryText
 * @param {Array} values
 * @param {boolean} readonly
 * @returns {Object} Query result
 */
async function dbQuery(queryText, values, readonly=true) {
  const pool = new Pool({
    connectionString: process.env.connectionString,
  });

  // note: we don't try/catch this because if connecting throws an exception
  // we don't need to dispose of the client (it will be undefined)
  const client = await pool.connect()

  try {
    await client.query('BEGIN'); // TRANSACTION ISOLATION LEVEL READ COMMITTED is default

    if (readonly) {
      await client.query('SET TRANSACTION READ ONLY');
    }

    const result = await client.query(queryText, values);
    await client.query('COMMIT');

    return result.rows;
  }
  catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
  finally {
    client.release();
  }
  
}