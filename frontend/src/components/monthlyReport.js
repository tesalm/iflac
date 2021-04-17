import React, { Component } from 'react';
import { Button, Col, Container, Form, ListGroup, Row } from 'react-bootstrap';

import waxios from '../waxios';
import ReportView from './reportView';

export default class MonthlyReport extends Component {
  constructor() {
    super();

    this.state = {
      advertisers: [],
      reportData: [],
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      selectedAdvertiser: undefined,
      error: undefined
    };
  }

  async componentDidMount() {
    try {
      const response = await waxios.get('/api/v1/advertisers');
      console.log(response.data);
      this.setState({ advertisers: response.data });
    }
    catch (e) {
      console.log(e);
    }
  }

  advertiserSelected(advertiser) {
    console.log(advertiser);
    this.setState({
      selectedAdvertiser: advertiser
    });
  }

  handleYearChange(e) {
    this.setState({ year: e.target.value })
  }

  handleMonthChange(e) {
    this.setState({ month: e.target.value })
  }

  async submit() {
    const { selectedAdvertiser, year, month } = this.state;
    if (selectedAdvertiser) {
      try {
        const url = '/api/v1/monthly-report/' + selectedAdvertiser + '/' + year + '/' + month;
        const response = await waxios.get(url);
        console.log(response.data);
        this.setState({ error: undefined, reportData: response.data });
      }
      catch (e) {
        console.log(e);
        this.setState({ error: e });
      }
    }
  }

  getYears() {
    const years = [];
    for (let i = 0; i < 20; i++) { years[i] = new Date().getFullYear() - i }
    return years;
  }

  render() {
    const { advertisers, selectedAdvertiser, year, month, reportData, error } = this.state;
    const years = this.getYears();
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    return (
      <Container style={{ paddingTop: 20, paddingBottom: 20 }}>
        <Row>
          <Col sm={5}>
            <Row>
              <Col sm={4}>
                <p style={{ textAlign: 'left' }}>Valitse vuosi</p>
              </Col>
              <Col sm={4}>
                <p style={{ textAlign: 'left' }}>Valitse kuukausi</p>
              </Col>
            </Row>
            <Row>
              <Col sm={4}>
                <Form.Control as="select"
                  onChange={(e) => this.handleYearChange(e)} >
                  {years.map((y, i) => <option key={i} value={y}>{y}</option>)}
                </Form.Control>
              </Col>
              <Col sm={4}>
                <Form.Control as="select"
                  defaultValue={new Date().getMonth() + 1}
                  onChange={(e) => this.handleMonthChange(e)} >
                  {months.map((m, i) => <option key={i} value={m}>{m}</option>)}
                </Form.Control>
              </Col>
              <Col sm={3} style={{ marginTop: 'auto' }}>
                <Button variant="primary"
                  onClick={() => this.submit()}
                  disabled={selectedAdvertiser ? false : true}>Submit
                </Button>
              </Col>
            </Row>

            <br />

            <ListGroup>
              <p style={{ textAlign: 'left' }}>Valitse mainostaja</p>
              {advertisers.map((adv, index) =>
                <ListGroup.Item
                  action
                  onClick={() => this.advertiserSelected(adv.yrityksennimi)}
                  active={selectedAdvertiser === adv.yrityksennimi}
                  key={index}
                >
                  {adv.yrityksennimi}
                </ListGroup.Item>
              )}
            </ListGroup>
          </Col>

          <Col sm={5} style={{ marginLeft: 'auto' }}>
            {error ? <p style={{ textAlign: 'left' }}>{error.message}</p> :
              <ReportView reportdata={reportData} year={year} month={month} />
            }
          </Col>

        </Row>
      </Container>
    );
  }
}
