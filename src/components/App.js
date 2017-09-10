import React from 'react';
import PropTypes from 'prop-types';
import { Link, IndexLink } from 'react-router';
import Game from './Game'

class App extends React.Component {
  render() {
    return (
      <div id='app-container'>
        <Game />
      </div>
    )
  }
}

App.propTypes = {};

export default App;
