import React from 'react';
import {Circle} from 'react-konva';

const Player = ({player, mapSize, cvHeight, cvWidth}) => {
  const tileHeight = (1 / mapSize) * cvHeight;
  const tileWidth = (1 / mapSize) * cvWidth;

  return (
    <Circle
      width={tileWidth}
      height={tileHeight}
      x={(tileWidth * player.x) + (tileWidth / 2)}
      y={(tileHeight * player.y) + (tileHeight / 2)}
      fill={'blue'} />
    );
};

export default Player;
