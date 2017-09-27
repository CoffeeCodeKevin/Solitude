import React from 'react';
import {Rect} from 'react-konva';

class Tile extends React.Component {
  shouldComponentUpdate(next) {
    if (this.props.fog !== next.fog) {
      return true;
    }
    else if (next.tile.seen === this.props.tile.seen &&
        next.tileWidth === this.props.tileWidth &&
        next.tileHeight === this.props.tileHeight) {
      return false;
    }
    return true;
  }

  render() {
    let fill;

    if (this.props.fog) {
      fill = this.props.tile.seen ? (this.props.tile.solid ? '#2b2b2b' : 'white') : 'black';
    }
    else {
      fill = this.props.tile.solid ? '#2b2b2b' : 'white';
    }

    return (
      <Rect
        height={this.props.tileHeight}
        width={this.props.tileWidth}
        fill={fill}
        stroke={'black'}
        strokeWidth={0.3}
        x={this.props.tileWidth * this.props.tile.x}
        y={this.props.tileHeight * this.props.tile.y} />
    );
  }
}

export default Tile;
