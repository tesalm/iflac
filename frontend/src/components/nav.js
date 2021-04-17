import React, { Component } from 'react';
import { Button, Nav, Navbar } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

export default class Navigation extends Component {
  logout() {
    localStorage.removeItem('access_token');
  }

  render() {
    return (
      <Navbar bg="light" expand="lg">
        <Navbar.Brand>
        <LinkContainer to="/">
          <Nav.Link>I-Flac</Nav.Link>
        </LinkContainer>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <LinkContainer to="/invoicing">
              <Nav.Link>Laskutus</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/monthly_report">
              <Nav.Link>Kuukausiraportti</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/advertisement_report">
              <Nav.Link>Mainosesitysraportti</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/invoicing/new">
              <Nav.Link>Uusi lasku</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/login">
              <Nav.Link>Kirjautuminen</Nav.Link>
            </LinkContainer>
            <Nav.Item>
              <Button onClick={ () => this.logout() }>
                Kirjaudu ulos
              </Button>
            </Nav.Item>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}