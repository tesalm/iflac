import React, { Component } from 'react';
import { Col, Container, ListGroup, Row } from 'react-bootstrap';

import waxios from '../waxios';

export default class AdvertisementReport extends Component {
  constructor() {
    super();

    this.state = {
      advertisements: [],
      reportData: [],
      selectedAdvertisement: undefined,
      error: undefined
    };
  }

  async componentDidMount() {
    try {
      const response = await waxios.get('/api/v1/advertisements');
      console.log(response.data);
      this.setState({ advertisements: response.data });
    }
    catch (e) {
      console.log(e);
    }
  }

  async advertisementSelected(advertisement) {
    console.log(advertisement);
    this.setState({ selectedAdvertisement: advertisement });
    try {
      const url = '/api/v1/replay-report/' + advertisement;
      const response = await waxios.get(url);
      console.log(response.data);
      this.setState({ error: undefined, reportData: response.data });
    }
    catch (e) {
      console.log(e);
      this.setState({ error: e });
    }
  }


  render() {
    const { advertisements, selectedAdvertisement, reportData, error } = this.state;
    const today = new Date();
    const date = today.getDate() + '.' + (today.getMonth() + 1) + '.' + today.getFullYear();
    return (
      <Container style={{ paddingTop: 20, paddingBottom: 20 }}>
        <Row>
          <Col sm={2}>
            <ListGroup>
              <p style={{ textAlign: 'left' }}>Valitse mainos</p>
              {advertisements.map((adv, index) =>
                <ListGroup.Item
                  action
                  onClick={() => this.advertisementSelected(adv.mainosid)}
                  active={selectedAdvertisement === adv.mainosid}
                  key={index}
                >
                  {adv.nimi}
                </ListGroup.Item>
              )}
            </ListGroup>
          </Col>

          <Col sm={9} style={{ marginLeft: 40 }}>
            {reportData.length > 0 &&
              <div variant="flush">
                <div style={styles.headerSection}>
                  <h5 style={styles.reportTitle}>MAINOSESITYSRAPORTTI {date}</h5>
                  <p style={styles.p}>Mainostaja: {reportData[0].mainostaja}</p>
                  <p style={styles.p}>Mainoskampanja: {reportData[0].mainoskampanja}</p>
                  <p>Mainos: {reportData[0].mainos}</p>
                </div>
                <div style={{ float: 'left' }}>
                  <Row style={{ fontWeight: 'bold' }}>
                    <Col sm={2} style={styles.col}>Esityspäivä</Col>
                    <Col sm={2} style={styles.col}>Esitysaika</Col>
                    <Col sm={2} style={styles.col}>Sukupuoli</Col>
                    <Col sm={1} style={styles.col}>Ikä</Col>
                    <Col sm={2} style={styles.col}>Maa</Col>
                    <Col sm={2} style={styles.col}>Paikkakunta</Col>
                  </Row>
                  {reportData.map((x, i) => {
                    const date = new Date(x.esityspvm);
                    return (
                      <Row key={i}>
                        <Col sm={2} style={styles.col}>{date.getDate() + '.' + date.getMonth() + '.' + date.getFullYear()}</Col>
                        <Col sm={2} style={styles.col}>{x.esitysaika}</Col>
                        <Col sm={2} style={styles.col}>{x.sukupuoli}</Col>
                        <Col sm={1} style={styles.col}>{x.ika}</Col>
                        <Col sm={2} style={styles.col}>{x.maa}</Col>
                        <Col sm={2} style={styles.col}>{x.paikkakunta}</Col>
                      </Row>)
                  })}
                </div>
              </div>
            }
          </Col>
        </Row>
      </Container>
    );
  }
}

const styles = {
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
  col: {
    marginLeft: 4
  }
};