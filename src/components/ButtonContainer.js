import React from 'react';

const ButtonContainer = ({toggleFog}) => {
  return (
    <div id='button-container'>
      <button id='button-one' onClick={toggleFog}>
        Toggle Fog
      </button>
    </div>
  )
}

export default ButtonContainer;
