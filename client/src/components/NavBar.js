import React from 'react'
import {
    Nav,
    NavLink,
    Bars,
    NavMenu,
  } from './NavbarElements';
  

function NavBar() {
  return (
    <div>
        <Nav>
            <NavLink to='/'>
                Logo
            </NavLink>
            <Bars />

            <NavMenu>
            <NavLink to='/home' activeStyle>
                Home
            </NavLink>
            <NavLink to='/viewer' activeStyle>
                Viewer
            </NavLink>
            <NavLink to='/report' activeStyle>
                Report
            </NavLink>
            </NavMenu>

        
          </Nav>
    </div>
  )
}

export default NavBar