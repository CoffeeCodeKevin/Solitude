import React from 'react';
import {Circle, Group} from 'react-konva';

class Treasure extends React.Component {
  shouldComponentMount(){
    if (this.props.treasureList.length < 1) {
      return false;
    }
  }

  shouldComponentUpdate(next) {
    if (this.props.treasureList.length !== next.treasureLayer) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    const tileHeight = (1 / this.props.mapSize) * this.props.cvHeight;
    const tileWidth = (1 / this.props.mapSize) * this.props.cvWidth;
    const treasureLayer = this.props.treasureList.map((treasure, i) => {
      return (
        <Circle
          width={tileWidth}
          height={tileHeight}
          key={'treasure'+i}
          x={(tileWidth * treasure.content.x) + (tileWidth / 2)}
          y={(tileHeight * treasure.content.y) + (tileHeight / 2)}
          fill={'green'} />
      )
    });

    return (
    <Group>
      {treasureLayer}
    </Group>)
  }
}

export default Treasure;
