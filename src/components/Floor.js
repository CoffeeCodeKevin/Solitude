import React from 'react';
import {Group, Rect} from 'react-konva';

const Floor = ({floorPlan, cvHeight, cvWidth}) => {
  const tileHeight = (1 / floorPlan.length) * cvHeight;
  const tileWidth = (1 / floorPlan.length) * cvWidth;

  const tileLayer = floorPlan.map((row, i) => {
    const tiles = row.map((tile, j) => {
      const fill = tile.solid ? '#2b2b2b' : 'white';

      return (
        <Rect
          height={tileHeight}
          width={tileWidth}
          fill={fill}
          stroke={'black'}
          strokeWidth={0.2}
          key={i+'tile'+j}
          x={tileWidth * tile.x}
          y={tileHeight * tile.y} />
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
