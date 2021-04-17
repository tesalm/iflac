import React, { Component } from 'react';
import { ListGroup } from 'react-bootstrap';
import PropTypes from 'prop-types';

export default class InvoiceList extends Component {
  static propTypes = {
    invoices: PropTypes.array,
    selectedInvoice: PropTypes.number,
    selectedReminder: PropTypes.number,
    invoiceClicked: PropTypes.func.isRequired,
    reminderClicked: PropTypes.func.isRequired
  };

  renderRow(inv, index, selectedInvoice, invoiceClicked, rem=undefined, selectedReminder=undefined) {
    const selectedIsReminder = selectedReminder !== undefined;
    const isReminder = rem !== undefined;
    const invoiceMatches = selectedInvoice === inv.laskunnumero;
    const reminderMatches = selectedReminder !== undefined && rem !== undefined && selectedReminder === rem.karhulaskunnumero;

    const isActive = (isReminder && selectedIsReminder && reminderMatches) || (!isReminder && !selectedIsReminder && invoiceMatches);

    return (
      <ListGroup.Item
        action
        onClick={ rem === undefined ?
          () => invoiceClicked(inv.laskunnumero) :
          () => invoiceClicked(inv.laskunnumero, rem.karhulaskunnumero)
        }
        active={ isActive }
        key={ index }
      >
        <p>{rem !== undefined ? 'Karhulasku' : 'Lasku'}</p>
        <p>Yritys: {inv.laskuttavanyrityksennimi}</p>
        <p>Laskun numero: {inv.laskunnumero}</p>
        {rem !== undefined && <p>Karhulaskun numero: {rem.karhulaskunnumero}</p>}
      </ListGroup.Item>
    );
  }

  render() {
    const { invoices, invoiceClicked, reminderClicked, selectedInvoice, selectedReminder } = this.props;

    if (invoices === undefined) {
      return <ListGroup />
    }

    return (
      <ListGroup>
        {invoices.map((inv, index) => {
          const rows = []
          rows.push(this.renderRow(inv, index, selectedInvoice, invoiceClicked, undefined, selectedReminder));

          if (inv.karhulaskut.length !== 0) {
            inv.karhulaskut.forEach((rem, index2) => {
              rows.push(this.renderRow(inv, (index+1)*1000000+index2, selectedInvoice, reminderClicked, rem, selectedReminder))
            });
          }

          return rows;
        }
        )}
      </ListGroup>
    );
  }
}