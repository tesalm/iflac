import React, { Component } from 'react';
import { ListGroup } from 'react-bootstrap';

export default class CampaignList extends Component {
  render() {
    const { campaigns, campaignClicked } = this.props;
    return (
      <ListGroup>
        {campaigns.map((cam, index) => 
          <ListGroup.Item
            action
            onClick={ () => campaignClicked(cam.kampanjaid) }
            key={ index }
          >
            <p>Yritys: {cam.yrityksennimi}</p>
            <p>Kampanja: {cam.nimi}</p>
          </ListGroup.Item>
        )}
      </ListGroup>
    );
  }
}