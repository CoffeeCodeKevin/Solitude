import React from 'react';
import {Circle, Group} from 'react-konva';

class Monsters extends React.Component {
  shouldComponentMount(){
    if (this.props.monsterList.length < 1) {
      return false;
    }
  }

  shouldComponentUpdate(next) {
    if (this.props.monsterList.length !== next.monstersLayer) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    const tileHeight = (1 / this.props.mapSize) * this.props.cvHeight;
    const tileWidth = (1 / this.props.mapSize) * this.props.cvWidth;
    const monstersLayer = this.props.monsterList.map((monsters, i) => {
      return (
        <Circle
          width={tileWidth}
          height={tileHeight}
          key={'monsters'+i}
          x={(tileWidth * monsters.content.x) + (tileWidth / 2)}
          y={(tileHeight * monsters.content.y) + (tileHeight / 2)}
          fill={'red'} />
      )
    });

    return (
    <Group>
      {monstersLayer}
    </Group>)
  }
}

export default Monsters;
