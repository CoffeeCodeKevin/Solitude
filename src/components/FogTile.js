import React from 'react';
import {Rect} from 'react-konva';

class FogTile extends React.Component {
  shouldComponentUpdate(next) {
    if(next.tile.seen !== this.props.tile.seen ||
       next.fog !== this.props.fog) {
      return true;
    }
    return false;
  }

  render() {
    let fill;

    if (this.props.fog) {
      fill = this.props.tile.seen ? 'transparent' : 'black';
    } else {
      fill = 'transparent';
    }

    let stroke;

    if(this.props.fog) {
      stroke = this.props.tile.seen ? 'transparent' : 'black'
    } else {
      stroke = 'transparent';
    }

    return (
      <Rect
        height={this.props.tileHeight}
        width={this.props.tileWidth}
        fill={fill}
        stroke={stroke}
        x={this.props.tileWidth * this.props.tile.x}
        y={this.props.tileHeight * this.props.tile.y} />
    );
  }
}

export default FogTile;
