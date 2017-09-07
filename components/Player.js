import React from 'react';
import {Circle, Group} from 'react-konva';

const Player = ({interactables, mapSize, cvHeight, cvWidth}) => {
  const tileHeight = (1 / mapSize) * cvHeight;
  const tileWidth = (1 / mapSize) * cvWidth;
  const player = (<Circle
                    width={tileWidth}
                    height={tileHeight}
                    x={(tileWidth * interactables.player.x) + (tileWidth/2)}
                    y={(tileHeight * interactables.player.y) + (tileHeight/2)}
                    fill={'blue'}/>
  );
  const creatures = interactables.creatures;
  const treasure = interactables.treasure;


  return (
    <Group>
      {player}
    </Group>
  );
};

export default Player;
