import React, { Component } from 'react';
import { ListGroup } from 'react-bootstrap';

export default class ReportView extends Component {
  render() {
    const { reportdata, month, year } = this.props;
    if (reportdata.length < 1) {
      return <div />;
    }

    const today = new Date();
    const date = today.getDate() + '.' + (today.getMonth() + 1) + '.' + today.getFullYear();
    const months = ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu',
      'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'];
    var campaigns = [];
    reportdata.map((i) => campaigns.push(i.kampanjanimi));
    campaigns = [...new Set(campaigns)]; // remove dublicates
    var totalDisplays = 0;
    var totalLength = 0;
    var totalPrice = 0;

    return (
      <div>
        <ListGroup variant="flush">
          <div style={styles.headerSection}>
            <h5 style={styles.reportTitle}>KUUKAUSIRAPORTTI {date}</h5>
            <p style={styles.p}>{reportdata[0].yrityksennimi}</p>
            <p style={styles.p}>{reportdata[0].katuosoite}</p>
            <p>{reportdata[0].postinumero} {reportdata[0].postitoimipaikka}</p>
          </div>

          {campaigns.map((campaign, campaignIndex) => {
            var adCount = 0;
            return <ListGroup.Item
              style={styles.lgItem}
              key={campaignIndex}>
              <p style={{ fontWeight: 'bold' }}>Mainoskampanja {campaignIndex + 1}:{' '}
                {campaign} {months[month]} {year} </p>
              {reportdata.map((re, index) => {
                if (campaign === re.kampanjanimi) {
                  totalDisplays += parseInt(re.vastaanotettu);
                  totalLength += re.esitysaika;
                  totalPrice += re.mainoksen_hinta;
                  return <div key={index} >
                    {adCount > 0 && <br/>}
                    <p style={styles.p}>Mainos {adCount += 1}: {re.mainosnimi}</p>
                    <p style={styles.p}>Lähetysaika: {re.lahetysaika.replace(',', ' - ')}</p>
                    <p style={styles.p}>Mainoksen pituus: {re.kesto} s</p>
                    <p style={styles.p}>Vastaanotettu: {re.vastaanotettu}</p>
                    <p style={styles.p}>Mainoksen hinta: {re.mainoksen_hinta.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })}</p>
                  </div>
                } else return null
              })}
            </ListGroup.Item>
          })}
          <div style={styles.summarySection}>
            <h6 style={styles.summaryTitle}>Yhteenveto</h6>
            <p style={styles.p}>Esityksiä yhteensä: {totalDisplays} kpl</p>
            <p style={styles.p}>Kokonaispituus: {totalLength} s</p>
            <p>Kokonaishinta: {totalPrice.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })}</p>
          </div>
        </ListGroup>
      </div>
    );
  }
}

const styles = {
  lgItem: {
    textAlign: 'left',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 0,
    paddingRight: 0
  },
  reportTitle: {
    fontWeight: 'bold',
    marginBottom: 18
  },
  headerSection: {
    paddingBottom: 10,
    textAlign: 'left'
  },
  p: {
    marginBottom: 2
  },
  summarySection: {
    paddingTop: 14,
    textAlign: 'left'
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 8
  }
};