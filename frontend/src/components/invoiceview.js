import React, { Component, Fragment } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import DatePicker from 'react-date-picker';
import PropTypes from 'prop-types';

import { isNull } from '../utils';

export default class InvoiceView extends Component {
  static propTypes = {
    invoice: PropTypes.object,
    reminderId: PropTypes.number,
    dueDate: PropTypes.object,
    refNumber: PropTypes.number,
    reminderCost: PropTypes.number,
    handleDateChange: PropTypes.func.isRequired,
    handleRefnumberChange: PropTypes.func.isRequired,
    handleReminderCostChange: PropTypes.func.isRequired,
    submit: PropTypes.func.isRequired
  };

  submit(e) {
    e.preventDefault();
    this.props.submit();
  }

  renderInfoRow(name, value, index) {
    return (
      <Row key={index}>
        <Col className="d-flex justify-content-end"><p><b>{name}</b></p></Col>
        <Col className="d-flex justify-content-start"><p>{value}</p></Col>
      </Row>
    );
  }

  renderInvoiceRowsHeader() {
    return (
      <Row>
        <Col><p><b>Mainos</b></p></Col>
        <Col><p><b>Pituus</b></p></Col>
        <Col><p><b>Esityskerrat</b></p></Col>
        <Col><p><b>Kokonaishinta</b></p></Col>
      </Row>
    )
  }

  renderInvoiceRow(row, index) {
    return (
      <Row key={index}>
        <Col><p>{row.mainos}</p></Col>
        <Col><p>{isNull(row.pituus) ? 0 : row.pituus}s</p></Col>
        <Col><p>{row.toistokerrat}</p></Col>
        <Col><p>{row.kokonaishinta.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })}</p></Col>
      </Row>
    );
  }

  render() {
    const {
      invoice,
      reminderId,
      dueDate,
      refNumber,
      reminderCost,
      handleDateChange,
      handleRefnumberChange,
      handleReminderCostChange
    } = this.props;
    
    if (invoice === undefined) {
      return <Form/>;
    }

    const customerInfo = {
      'Yritys': invoice.t_yritys,
      'Yhteyshenkilö': `${invoice.t_etunimi} ${invoice.t_sukunimi}`,
      'Katuosoite': invoice.t_katuosoite,
      'Postitoimipaikka': `${invoice.t_postinro} ${invoice.t_postitoimipaikka}`,
      'Maa': invoice.t_maa,
      'Kampanja': invoice.kampanja,
      'Sekuntihinta': `${(invoice.sekuntihinta).toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })}`
    };

    const sellerInfo = {
      'Yritys': invoice.m_yritys,
      'Yhteyshenkilö': `${invoice.m_etunimi} ${invoice.m_sukunimi}`,
      'Katuosoite': invoice.m_katuosoite,
      'Postitoimipaikka': `${invoice.m_postinro} ${invoice.m_postitoimipaikka}`,
      'Maa': invoice.m_maa
    };

    const invoiceInfo = {
      'Laskun numero': invoice.laskunnumero,
      'Tilinumero': invoice.tilinro,
      'Kokonaissumma': invoice.kokonaissumma.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })
    };

    let reminder = undefined;
    if (reminderId !== undefined) {
      reminder = invoice.karhulaskut.find(rem => rem.karhulaskunnumero === reminderId);
    }

    return (
      <Form>
        <Row style={{ paddingBottom: 50 }}>
          <Col>
            <h4 className="d-flex justify-content-start" style={{ paddingBottom: 20 }}>Tilaaja</h4>
            {
              Object.keys(customerInfo).map((key, index) => {
                return this.renderInfoRow(key, customerInfo[key], index);
              })
            }
          </Col>
          <Col>
            <h4 className="d-flex justify-content-start" style={{ paddingBottom: 20 }}>Myyjä</h4>
            {
              Object.keys(sellerInfo).map((key, index) => {
                return this.renderInfoRow(key, sellerInfo[key], index);
              })
            }
          </Col>
        </Row>

        {this.renderInvoiceRowsHeader()}

        {
          invoice.mainokset.map((row, index) => {
            return this.renderInvoiceRow(row, index);
          })
        }

        <Row style={{ paddingTop: 50 }}>
          <Col>
            <h4 className="d-flex justify-content-start" style={{ paddingBottom: 20 }}>Laskun tiedot</h4>
            {
              Object.keys(invoiceInfo).map((key, index) => {
                return this.renderInfoRow(key, invoiceInfo[key], index);
              })
            }

            {reminder === undefined &&
              <Fragment>
                <Form.Group as={Row} className="d-flex justify-content-center">
                  <Form.Label column sm="4" className="d-flex justify-content-end"><b>Eräpäivä</b></Form.Label>
                  <Col sm="4" className="d-flex justify-content-start">
                    <DatePicker
                      onChange={(date) => handleDateChange(date)}
                      value={dueDate}
                      locale="fi-FI"
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} className="d-flex justify-content-center">
                  <Form.Label column sm="4" className="d-flex justify-content-end"><b>Viitenumero</b></Form.Label>
                  <Col sm="4" className="d-flex justify-content-start">
                    <Form.Control
                      type="text"
                      placeholder="Esim. 10001"
                      onChange={(e) => handleRefnumberChange(e.target.value)}
                      value={refNumber || ''}
                    />
                  </Col>
                </Form.Group>
              </Fragment>
            }
          </Col>

          {reminder !== undefined &&
            <Col>
              <h4 className="d-flex justify-content-start" style={{ paddingBottom: 20 }}>Karhulaskun tiedot</h4>
              
              <Row>
                <Col className="d-flex justify-content-end"><p><b>Karhulaskun numero</b></p></Col>
                <Col className="d-flex justify-content-start"><p>{reminder.karhulaskunnumero}</p></Col>
              </Row>
              
              <Form.Group as={Row} className="d-flex justify-content-center">
                <Form.Label column sm="4" className="d-flex justify-content-end"><b>Viivästymismaksu</b></Form.Label>
                <Col sm="4" className="d-flex justify-content-start">
                  <Form.Control
                    type="text"
                    onChange={(e) => handleReminderCostChange(e.target.value)}
                    value={reminderCost || ''}
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="d-flex justify-content-center">
                <Form.Label column sm="4" className="d-flex justify-content-end"><b>Eräpäivä</b></Form.Label>
                <Col sm="4" className="d-flex justify-content-start">
                  <DatePicker
                    onChange={(date) => handleDateChange(date)}
                    value={dueDate}
                    locale="fi-FI"
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="d-flex justify-content-center">
                <Form.Label column sm="4" className="d-flex justify-content-end"><b>Viitenumero</b></Form.Label>
                <Col sm="4" className="d-flex justify-content-start">
                  <Form.Control
                    type="text"
                    placeholder="Esim. 10001"
                    onChange={(e) => handleRefnumberChange(e.target.value)}
                    value={refNumber || ''}
                  />
                </Col>
              </Form.Group>
            </Col>
          }
        </Row>

        <Button
          variant="primary"
          type="submit"
          onClick={(e) => this.submit(e)}
        >
          Tallenna
        </Button>
      </Form>
    );
  }
}