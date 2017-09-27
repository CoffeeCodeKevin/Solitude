import React from 'react';
import {Group} from 'react-konva';
import Tile from './Tile';

const Floor = ({floorPlan, cvHeight, cvWidth, fog}) => {
  const tileHeight = (1 / floorPlan.length) * cvHeight;
  const tileWidth = (1 / floorPlan.length) * cvWidth;

  const tileLayer = floorPlan.map((row, i) => {
    const tiles = row.map((tile, j) => {

      return (
        <Tile
          key={i+'tile'+j}
          tile={tile}
          fog={fog}
          tileWidth={tileWidth}
          tileHeight={tileHeight} />
      );
    });
    return tiles;
  });

  return (
    <Group>
      {tileLayer}
    </Group>
  );
};

export default Floor;
