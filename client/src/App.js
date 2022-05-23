import React from 'react'
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import HomePage from './pages/HomePage';
import Member from './pages/Member';
import Viewer from './pages/Viewer';
import View from './pages/View';

function App() {

  return (
    <div>
      <h1>This is where the nav bar should go...</h1>

      <Router>
        <Switch>
          <Route path="/" exact component = {HomePage}/>
          <Route path="/member" exact component ={Member}/>
          <Route path="/viewer" exact component ={Viewer}/>
          {/* <Route path="/view" exact component ={View}/> */}
        </Switch>
      </Router>
    </div>
  )
}

export default App
