import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import AdvertisementReport from './components/advertisementReport';
import Home from './components/home';
import Invoicing from './components/invoicing';
import Login from './components/login';
import MonthlyReport from './components/monthlyReport';
import Navigation from './components/nav';
import NotFound from './components/notfound';
import NewInvoice from './components/newinvoice';

import './App.css';

export default class App extends Component {
  render() {
    return (
      <Router>
        <div className="App">
          <Navigation />

          <div className="main-content">
            <Switch>
              <Route exact path="/" component={ Home } />
              <Route exact path="/invoicing" component={ Invoicing } />
              <Route path="/invoicing/new" component={ NewInvoice } />
              <Route path="/login" component={ Login } />
              <Route path="/monthly_report" component={ MonthlyReport } />
              <Route path="/advertisement_report" component={ AdvertisementReport } />

              { /* Finally, catch all unmatched routes */ }
              <Route component={NotFound} />
            </Switch>
          </div>

        </div>
      </Router>
    );
  }
}
