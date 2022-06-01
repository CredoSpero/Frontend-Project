import React from 'react'
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import Member from './pages/Member';
import View from './pages/View';
import Viewer from './pages/Viewer';

function App() {

  return (
    <div className = "background" >
        <Router>
            <NavBar/>

            <Switch>
              <Route path="/" exact component = {HomePage}/>
              <Route path="/member" exact component ={Member}/>
              <Route path="/viewer" component ={Viewer}/>
              <Route path="/view" component ={View}/>
            </Switch>
        </Router>
        </div>
  )
}

export default App