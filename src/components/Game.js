import 'babel-polyfill';
import React from 'react';
import {Stage, Layer} from 'react-konva';

import Floor from './Floor';
import Player from './Player';

class Game extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cvHeight: 700,
      cvWidth: 700,
      cvOffsetX: 0,
      cvOffsetY: 0,
      mapSize: 50,
      floorPlan: [],
      interactables: {
        player: {
          stats: {
            hp: 100,
            atk: 10,
            def: 0
          },
          x: 0,
          y: 0
        },
        creatures: [],
        treasure: []
      },
      names: {
        weapons: {
          types: ['Axe', 'Sword', 'Daggers', 'Rod', 'Hammer'],
          qualities: ['Rusted ', 'Dulled ', 'Used ', 'Average ', 'Well-sharpened ', 'Pristine ', 'Magnificent ']
        },
        armor: {
          types: ['Leather', 'Chainmail', 'Cloth', 'Plate'],
          qualities: ['Rusted ', 'Chipped ', 'Used ', 'Average ', 'Polished ', 'Durable ', 'Nigh-unbreakable ']
        }
      }
    };

    this.initRatio = this.initRatio.bind(this);
    this.handleKeypress = this.handleKeypress.bind(this);
  }

  async componentWillMount() {
    await this.initRatio();
    this.renderMap();
  }

  componentDidMount() {
    document.addEventListener('keyup', this.handleKeypress);
    window.addEventListener('resize', this.initRatio);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.handleKeypress);
    window.removeEventListener('resize', this.initRatio);
  }

  // MOVEMENT AND OBJECT COLLISION DETECTION

  // Detects keypresses on the canvas, allowing the user to move,
  // and may be used for hotkeys, like potions in the future.
  handleKeypress(e) {
    if (e.key == 'ArrowUp' || e.key == 'w') {
      this.tickBoard('up');
    }
    else if (e.key == 'ArrowRight' || e.key == 'd') {
      this.tickBoard('right');
    }
    else if (e.key == 'ArrowLeft' || e.key == 'a') {
      this.tickBoard('left');
    }
    else if (e.key == 'ArrowDown' || e.key == 's') {
      this.tickBoard('down');
    }
  }

  // Causes movement and other events to occur when the player moves.
  // Also allows player to move.
  async tickBoard(p_direction) {
    let newObj = JSON.parse(JSON.stringify(this.state.interactables));
    let updatedMap = JSON.parse(JSON.stringify(this.state.floorPlan));
    const size = this.state.mapSize;

    newObj.player = this.detectObjectCollision(newObj.player, p_direction, size);
    updatedMap = this.lightTiles(updatedMap, newObj.player);

    await this.setState({
      interactables: newObj,
      floorPlan: updatedMap
    });
  }

  detectObjectCollision(obj, direction, mapSize) {
    if (direction == 'up') {
      if (obj.y > 0 && obj.y < mapSize) {
        obj.y--;
      }
    } else if (direction == 'down') {
      if (obj.y > -1 && obj.y < mapSize - 1) {
        obj.y++;
      }
    } else if (direction == 'left') {
      if (obj.x > 0 && obj.x < mapSize) {
        obj.x--;
      }
    } else if (direction == 'right') {
      if (obj.x > -1 && obj.x < mapSize - 1) {
        obj.x++;
      }
    }

    return obj;
  }

  // This keeps the constant 1:1 ratio of the game possible.
  initRatio() {
    const maxWidth = window.innerWidth - 1;
    const maxHeight = window.innerHeight - 1;
    maxWidth > maxHeight ?
    this.setState({
      cvOffsetX: -(maxWidth - maxHeight) / 2,
      cvOffsetY: 0,
      cvWidth: maxHeight,
      cvHeight: maxHeight}) :
    this.setState({
      cvOffsetX: 0,
      cvOffsetY: -(maxHeight - maxWidth) / 2,
      cvWidth: maxWidth,
      cvHeight: maxWidth});
  }

  // HELPER FUNCTIONS

  // A simple helper function to get a random integer between two given ints.
  getRandInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // MAP GENERATION AND FILLING

  // Creates the initial map, then uses a series of functions
  // to generate rooms and then populate the map.
  renderMap() {
    let newFloor = [];
    const size = this.state.mapSize;

    for (let i=0; i < size; i++) {
      newFloor.push([]);
      for(let j=0; j < size; j++) {
        newFloor[i].push({
          x: j,
          y: i,
          seen: false,
          solid: false,
          type: 'empty',
          fill: 'black'
        });
      }
    }

    newFloor = this.fillMap(newFloor);
    newFloor = this.lightTiles(newFloor, this.state.interactables.player);
    this.setState({floorPlan: newFloor});
  }

  // Generates the map for the user, creating a new dungeon each time to explore.
  fillMap(grid) {
    const width = this.state.mapSize;
    const height = this.state.mapSize;
    const roomsToGen = this.getRandInt(8, 12);
    const enemiesToGen = this.getRandInt(10, 20);
    const treasureToGen = this.getRandInt(3, 8);
    const maxRoomSize = 9;
    const minRoomSize = 6;
    let rmCenter = [];
    let rooms = [];
    let map = [];

    // Simply generate a room with a set width, height, x-coord and y-coord,
    // given the set parameters.
    const generateRoom = (() => {
      return {
        w: this.getRandInt(minRoomSize, maxRoomSize),
        h: this.getRandInt(minRoomSize, maxRoomSize),
        x: this.getRandInt(1, width - maxRoomSize - 1),
        y: this.getRandInt(1, height - maxRoomSize - 1)
      };
    });

    // Simple algorithms to check two rooms to see if they collide.
    const detectCollision = (toCheck) => {
      for (let k = 0; k < rmCenter.length; k++) {
        if (!((toCheck.x + toCheck.w < rmCenter[k].x) || (toCheck.x > rmCenter[k].x + rmCenter[k].w) ||
        (toCheck.y + toCheck.h < rmCenter[k].y) || (toCheck.y > rmCenter[k].y + rmCenter[k].h))) {
          return true;
        }
        return false;
      }
    };

    // Generate the first room.
    rmCenter.push(generateRoom());

    // Create rooms up to the set number of rooms.
    for (let i = 1; i < roomsToGen; i++) {
      let newRoom = generateRoom();
      // Detect collision of rooms and continue to generate
      // room until no collisions.
      while (detectCollision(newRoom)) {
        newRoom = generateRoom();
      }
      // Add the room once collisions are no longer detected.
      rmCenter.push(newRoom);
    }

    rmCenter.map((room) => {
      const x = room.x;
      const y = room.y;
      let startX;
      let startY;
      let endX;
      let endY;
      let tmpRoom = [];

      if (room.w % 2 === 0) {
         startX = room.x - ((room.w / 2) - 1);
         endX = room.x + (room.w / 2);
      } else if (room.w % 2 !== 0) {
         startX = room.x - ((room.w / 2) - 0.5);
         endX = room.x + ((room.w / 2) - 0.5);
      }
      if (room.h % 2 === 0 ) {
         startY = room.y - ((room.h /2) - 1);
         endY = room.y + (room.h / 2);
      } else if (room.h % 2 !== 0) {
         startY = room.y - ((room.h / 2) - 0.5);
         endY = room.y + ((room.h / 2) - 0.5);
      }

      startX = startX > 0 ? startX : 0;
      endX = endX < grid.length ? endX : 0;
      startY = startY > 0 ? startY : 0;
      endY = endY < grid.length ? endX : 0;

      for (let i = startY; i < endY; i++) {
        tmpRoom.push(grid[i].slice(startX, endX));
      }
      rooms.push(tmpRoom);

    });

    rooms.map((room) => {
      const testFill = window.Konva.Util.getRandomColor();
      room.map((row) => {
        row.map((tile) => {
          const x = tile.x;
          const y = tile.y;
          grid[y][x].contains = 'floor';
          grid[y][x].fill = testFill;
        })
      })
    })

    // REMOVE ON COMPLETION
    let newObj = JSON.parse(JSON.stringify(this.state.interactables));
    newObj.player.x = 3;
    newObj.player.y = 4;
    this.setState({interactables: newObj});
    return grid;
    // REMOVE ON COMPLETION
  }

  // Given a grid to work with, causes the player to
  // reveal dungeon tiles in a 5x5 grid with them as the center.
  lightTiles(grid, player) {
    const size = this.state.mapSize;
    const x = player.x;
    const y = player.y;
    const startX = (x - 2 < 0 ? 0 : x - 2);
    const startY = (y - 2 < 0 ? 0 : y - 2);
    const endX = (x + 2 > size ? size : x + 3);
    const endY = (y + 2 > size - 1 ? size : y + 3);
    let litArea = [];

    for (let i = startY; i < endY; i++) {
      litArea.push(grid[i].slice(startX, endX));
    }

    litArea.map((row) => {
      row.map((tile) => {
        const x = tile.x;
        const y = tile.y;
        grid[y][x].seen = true;
      });
    });

    return grid;
  }

  // LOOT DROPS

  // Used to determine what a random drop is for the player.
  randomDrop() {
    Math.random() > 0.33 ? (Math.random() > 0.66 ? this.healDrop() : this.armorDrop()) : this.weaponDrop();
  }

  // A drop that instantly heals the player for a random amount.
  healDrop() {
    const hp = this.state.interactables.player.stats.hp;
    const healingFactor = this.getRandInt(hp/10, hp/2);

    console.log('You healed ' + healingFactor + ' health points!');
  }

  // A drop that gives the player a new set of armor.
  armorDrop() {
    const names = this.state.names.armor;
    const type = names.types[this.getRandInt(0, names.types.length - 1)];
    const quality = names.qualities[this.getRandInt(0, names.qualities.length - 1)];

    console.log('You have acquired a set of ' + quality + type + ' Armor!');
  }

  // A drop that gives the user a new weapon to use.
  weaponDrop() {
    const names = this.state.names.weapons;
    const type = names.types[this.getRandInt(0, weaponTypes.length-1)];
    const quality = names.qualities[this.getRandInt(0, weaponQualities.length-1)];

    console.log('Acquired ' + quality + type + '!');
  }

  // Stage scaleX and scaleY so that it is 11x11 around player, once dungeon
  // generation works. Center scale on player using offset.
  render() {
    return (
      <Stage
        style={{background: '#191919'}}
        offsetX={this.state.cvOffsetX}
        offsetY={this.state.cvOffsetY}
        width={window.innerWidth}
        height={window.innerHeight}>
        <Layer>
          <Floor
            cvHeight={this.state.cvHeight}
            cvWidth={this.state.cvWidth}
            floorPlan={this.state.floorPlan} />
        </Layer>
        <Layer>
          <Player
            mapSize={this.state.mapSize}
            interactables={this.state.interactables}
            cvHeight={this.state.cvHeight}
            cvWidth={this.state.cvWidth} />
        </Layer>
      </Stage>
    )
  }
}

export default Game;
