import React, { Component } from 'react';
import { Button, FormGroup, FormControl, FormLabel } from 'react-bootstrap';

import waxios from '../waxios';

export default class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      message: ''
    };
  }

  validateForm() {
    return this.state.username.length > 0 && this.state.password.length > 0;
  }

  handleSubmit = async event => {
    event.preventDefault();

    try{
      const response = await waxios.post('/api/v1/auth', {
        username: this.state.username,
        password: this.state.password
      });

      console.log(response);
      localStorage.setItem('access_token', response.data.token);
      this.setState({
        username: '',
        password: '',
        message: 'Sisäänkirjautuminen onnistui.'
      });
    }
    catch(e) {
      console.log(e);
      this.setState({
        password: '',
        message: e.message
      });
    }
  }

  render() {
    const { username, password, message } = this.state

    return (
      <div className="login">
        {message ? <p>{message}</p> : <br/>}

        <form onSubmit={ this.handleSubmit }>
          <FormGroup controlId="username">
            <FormLabel>Käyttäjätunnus</FormLabel>
            <FormControl
              autoFocus
              type="text"
              value={ username }
              onChange={ event => this.setState({ username: event.target.value })}
            />
          </FormGroup>

          <FormGroup controlId="password">
            <FormLabel>Salasana</FormLabel>
            <FormControl
              value={ password }
              onChange={ event => this.setState({ password: event.target.value })}
              type="password"
            />
          </FormGroup>

          <Button
            block
            disabled={ !this.validateForm() }
            type="submit"
          >
            Kirjaudu
          </Button>
        </form>
      </div>
    );
  }
}