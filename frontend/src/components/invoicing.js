import React, { Component } from 'react';
import { Container, Col, Row, Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

import InvoiceList from './invoicelist';
import InvoiceView from './invoiceview';
import waxios from '../waxios';
import { isNull, toISODateString } from '../utils';

export default class Invoicing extends Component {
  static propTypes = {
    location: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      invoices: [],
      selectedInvoice: props.location.state !== undefined ?
        props.location.state.selected :
        undefined,
      selectedReminder: undefined,
      detailedInvoice: undefined,
      detailedDuedate: undefined,
      detailedRefnumber: undefined,
      reminderCost: undefined,
      loading: false,
      error: undefined
    };
  }

  async componentDidMount() {
    this.setState({ loading: true });

    try {
      const response = await waxios.get('/api/v1/billing');
      console.log(response.data);

      if (response.data.length === 0) {
        this.setState({
          loading: false
        });
        return;
      }

      this.setState({
        invoices: response.data
      });

      const selectedInvoice = this.state.selectedInvoice !== undefined ? this.state.selectedInvoice : response.data[0].laskunnumero

      const detailResponse = await waxios.get(`/api/v1/billing/info/${selectedInvoice}`);
  
      console.log(detailResponse.data);

      this.setState({
        selectedInvoice: selectedInvoice,
        detailedInvoice: detailResponse.data,
        detailedDuedate: !isNull(detailResponse.data.erapvm) ? new Date(detailResponse.data.erapvm) : undefined,
        detailedRefnumber: !isNull(detailResponse.data.viitenro) ? detailResponse.data.viitenro : undefined,
        loading: false
      });
    }
    catch(e) {
      console.log(e);
      this.setState({
        loading: false,
        error: e
      });
    }
  }

  async invoiceSelected(invoiceId) {
    console.log(invoiceId);

    if (invoiceId === this.state.selectedInvoice) {
      const inv = this.state.invoices.find(inv => inv.laskunnumero === invoiceId);

      this.setState({
        selectedReminder: undefined,
        detailedDuedate: inv.erapvm,
        detailedRefnumber: inv.viitenro
      });
      return;
    }

    this.setState({
      selectedInvoice: invoiceId,
      selectedReminder: undefined,
      loading: true,
      error: undefined
    });

    try {
      const response = await waxios.get(`/api/v1/billing/info/${invoiceId}`);

      this.setState({
        detailedInvoice: response.data,
        detailedDuedate: !isNull(response.data.erapvm) ? new Date(response.data.erapvm) : undefined,
        detailedRefnumber: !isNull(response.data.viitenro) ? response.data.viitenro : undefined,
        loading: false
      });
    }
    catch(e) {
      console.log(e);
      this.setState({
        loading: false,
        error: e
      });
    }
  }

  async reminderSelected(invoiceId, reminderId) {
    console.log(`${invoiceId}, ${reminderId}`);

    if (invoiceId === this.state.selectedInvoice && reminderId === this.state.selectedReminder) {
      return;
    }
    else if (invoiceId === this.state.selectedInvoice) {
      const rem = this.state.invoices.find(inv => inv.laskunnumero === invoiceId)
        .karhulaskut.find(rem => rem.karhulaskunnumero === reminderId);

      this.setState({
        selectedReminder: reminderId,
        reminderCost: rem.viivastymismaksu,
        detailedDuedate: new Date(rem.erapvm),
        detailedRefnumber: rem.viitenro

      });
      return
    }
    else {
      await this.invoiceSelected(invoiceId);

      const rem = this.state.invoices.find(inv => inv.laskunnumero === invoiceId)
        .karhulaskut.find(rem => rem.karhulaskunnumero === reminderId);

      this.setState({
        selectedReminder: reminderId,
        reminderCost: rem.viivastymismaksu,
        detailedDuedate: new Date(rem.erapvm),
        detailedRefnumber: rem.viitenro
      });
    }
  }

  handleDateChange(date) {
    this.setState({
      detailedDuedate: date
    });
  }

  handleRefnumberChange(value) {
    this.setState({
      detailedRefnumber: parseInt(value)
    });
  }

  handleReminderCostChange(cost) {
    this.setState({
      reminderCost: parseFloat(cost)
    })
  }

  async submitEdit() {
    const { detailedDuedate, detailedRefnumber, reminderCost, selectedInvoice, selectedReminder } = this.state;
    const dueDate = toISODateString(detailedDuedate);

    console.log(`${dueDate}, ${detailedRefnumber}, ${reminderCost}`);

    this.setState({
      loading: true,
      error: undefined
    });

    try {
      if (selectedReminder === undefined) {
        await waxios.put(`/api/v1/billing/modify/${selectedInvoice}`,
        {
          duedate: dueDate,
          reference: detailedRefnumber
        });
      }
      else {
        await waxios.put(`/api/v1/billing/invoice/reminder/${selectedReminder}`,
        {
          duedate: dueDate,
          reference: detailedRefnumber,
          remindercost: reminderCost,
        });

        const response = await waxios.get('/api/v1/billing');
        this.setState({
          invoices: response.data
        });
      }

      this.setState({
        loading: false
      });
    }
    catch(e) {
      console.log(e);
      this.setState({
        loading: false,
        error: e
      });
    }
  }

  async deleteInvoice() {
    this.setState({
      loading: true,
      error: undefined
    });

    try {
      if (this.state.selectedReminder !== undefined) {
        await waxios.delete(`api/v1/billing/invoice/reminder/delete/${this.state.selectedReminder}`);
      }
      else {
        await waxios.delete(`api/v1/billing/delete/${this.state.selectedInvoice}`);
      }

      this.setState({
        selectedInvoice: undefined,
        selectedReminder: undefined
      });
      this.componentDidMount();
    }
    catch(e) {
      console.log(e);
      this.setState({
        loading: false,
        error: e
      });
    }
  }

  async createReminder() {
    this.setState({
      loading: true,
      error: undefined
    });

    try {
      const response = await waxios.post(`/api/v1/billing/invoice/${this.state.selectedInvoice}/reminder`, {});
      console.log(response.data)
      
      this.setState({
        selectedReminder: response.data.karhulaskunnumero
      });

      const response2 = await waxios.get('/api/v1/billing');

      this.setState({
        loading: false,
        invoices: response2.data
      });
    }
    catch(e) {
      console.log(e);
      this.setState({
        loading: false,
        error: e
      });
    }
  }

  async sendInvoice() {
    this.setState({
      loading: true,
      error: undefined
    });

    try {
      const result = await waxios.put(`/api/v1/billing/invoice/send/${this.state.detailedInvoice.kampanjaid}`);
      console.log(result);

      this.setState({
        loading: false
      });
    }
    catch(e) {
      console.log(e);
      this.setState({
        loading: false,
        error: e
      });
    }
  }

  render() {
    const {
      invoices,
      selectedInvoice,
      selectedReminder,
      detailedInvoice,
      detailedDuedate,
      detailedRefnumber,
      reminderCost,
      loading,
      error
    } = this.state;

    return (
      <Container>
        <Row>
          <p>{loading ? 'Ladataan...' : (error ? error.message : <br/>)}</p>
        </Row>
        <Row>
          <Col sm="3">
              <InvoiceList
                invoices={ invoices }
                selectedInvoice={ selectedInvoice }
                selectedReminder={ selectedReminder }
                invoiceClicked={ (invoiceId) => this.invoiceSelected(invoiceId) }
                reminderClicked={ (invoiceId, reminderId) => this.reminderSelected(invoiceId, reminderId) }
              />
          </Col>
          <Col>
            <Row className="d-flex justify-content-end">
            <Button
              onClick={ () => this.createReminder() }
            >
              Luo karhulasku
            </Button>
            <Button
              onClick={ () => this.deleteInvoice() }
            >
              Poista lasku
            </Button>
            <Button
              onClick={ () => this.sendInvoice() }
            >
              Lähetä
            </Button>
            </Row>
            <InvoiceView
              invoice={ detailedInvoice }
              reminderId={ selectedReminder }
              dueDate={ detailedDuedate }
              refNumber={ detailedRefnumber }
              reminderCost={ reminderCost }
              handleDateChange={ date => this.handleDateChange(date) }
              handleRefnumberChange={ value => this.handleRefnumberChange(value) }
              handleReminderCostChange={ cost => this.handleReminderCostChange(cost) }
              submit={ () => this.submitEdit() }
            />
          </Col>
        </Row>
      </Container>
    );
  }
}