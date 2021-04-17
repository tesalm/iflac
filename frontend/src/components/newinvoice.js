import React, { Component } from 'react';
import { Container, Row } from 'react-bootstrap';
import PropTypes from 'prop-types';

import CampaignList from './campaignlist';

import waxios from '../waxios';

export default class NewInvoice extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired
  };

  constructor() {
    super();

    this.state = {
      campaigns: [],
      loading: false,
      error: undefined
    };
  }

  async componentDidMount() {
    this.setState({ loading: true });

    try {
      const response = await waxios.get('/api/v1/billing/newinvoice');
      console.log(response.data);

      if (response.data.length === 0) {
        this.setState({
          loading: false
        });
        return;
      }

      this.setState({
        campaigns: response.data,
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

  async campaignSelected(campaignId) {
    this.setState({ loading: true });

    try {
      const response = await waxios.post('/api/v1/billing/newinvoice/create', {
        campaignid: campaignId
      });
      console.log(response.data)
      
      this.setState({
        loading: false,
      });

      this.props.history.push('/invoicing', { selected: response.data.laskunnumero });
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
    const { campaigns, loading, error } = this.state;

    return (
      <Container className="d-flex justify-content-center">
        <Row>
          <p>{loading ? 'Ladataan...' : (error ? error.message : <br/>)}</p>
        </Row>
        <Row>
          <CampaignList
            campaigns={ campaigns }
            campaignClicked={ (campaignId) => this.campaignSelected(campaignId) }
          />
        </Row>
      </Container>
    );
  }
}