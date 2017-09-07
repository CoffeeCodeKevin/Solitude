import React from 'react';
import {Rect} from 'react-konva';

class Tile extends React.Component {
  shouldComponentUpdate(next) {
    if (next.tile.seen == this.props.tile.seen) {
      return false;
    }
    return true;
  }

  render() {
    return (
      <Rect
        height={this.props.tileHeight}
        width={this.props.tileWidth}
        fill={this.props.tile.fill}
        stroke={'black'}
        strokeWidth={0.3}
        x={this.props.tileWidth * this.props.tile.x}
        y={this.props.tileHeight * this.props.tile.y} />
    );
  }
}

export default Tile;
