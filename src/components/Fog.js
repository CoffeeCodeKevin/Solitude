import React from 'react';
import {Group} from 'react-konva';

import FogTile from './FogTile'

const Fog = ({cvHeight, cvWidth, floorPlan, fog}) => {
  const tileHeight = (1 / floorPlan.length) * cvHeight;
  const tileWidth = (1 / floorPlan.length) * cvWidth;

  const tileLayer = floorPlan.map((row, i) => {
    const tiles = row.map((tile, j) => {

      return (
        <FogTile
          key={i + 'fog' + j}
          tile={tile}
          fog={fog}
          tileHeight={tileHeight}
          tileWidth={tileWidth} />
      );
    });
    return tiles;
  });

  return (
    <Group>
      {tileLayer}
    </Group>
  )
}

export default Fog;
