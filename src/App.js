import Amplify from 'aws-amplify'
import awsconfig from './aws-exports'
import React from 'react'
import './App.css'
import {
  BrowserRouter as Router,
  Route,
  Switch
} from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import Install from './components/Install'
import Load from './components/Load'
import Dashboard from './components/Dashboard'

Amplify.configure(awsconfig)



const lang =
{
  en: require('./lang/en.json')
}

function App() {
  return <Router>
    <Switch>
      <Route path="/install" render={(props) =>
        <Install message={lang.en.tos_agreement} {...props} />
      } />
      <Route path="/load" render={(props) =>
        <Load {...props} />}
      />
      <PrivateRoute path="/dashboard" component={() =>
        <Dashboard />
      } />
    </Switch>
  </Router>
}

export default App
