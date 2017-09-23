import 'babel-polyfill';
import React from 'react';
import {Stage, Layer} from 'react-konva';
import {Grid, BiDijkstraFinder} from 'pathfinding';

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
    let updatedFloor = JSON.parse(JSON.stringify(this.state.floorPlan));
    const size = this.state.mapSize;

    newObj = this.detectObjectCollision(newObj, updatedFloor, p_direction, size);
    updatedFloor = this.lightTiles(updatedFloor, newObj.player);

    await this.setState({
      interactables: newObj,
      floorPlan: updatedFloor
    });
  }

  // Detects collisions between player (and also later monsters) and
  // the environment / other interactable objects
  detectObjectCollision(obj, floor, direction, mapSize) {
    const playerObj = obj.player;
    if (direction == 'up') {
      if (playerObj.y > 0 && playerObj.y < mapSize) {
        if(!floor[playerObj.y - 1][playerObj.x].solid) {
          playerObj.y--;
        }
      }
    } else if (direction == 'down') {
      if (playerObj.y > -1 && playerObj.y < mapSize - 1) {
        if(!floor[playerObj.y + 1][playerObj.x].solid) {
          playerObj.y++;
        }
      }
    } else if (direction == 'left') {
      if (playerObj.x > 0 && playerObj.x < mapSize) {
        if(!floor[playerObj.y][playerObj.x - 1].solid) {
          playerObj.x--;
        }
      }
    } else if (direction == 'right') {
      if (playerObj.x > -1 && playerObj.x < mapSize - 1) {
        if(!floor[playerObj.y][playerObj.x + 1].solid) {
          playerObj.x++;
        }
      }
    }

    return obj;
  }

  // This keeps the constant 1:1 ratio of the game possible.
  initRatio() {
    const maxWidth = window.innerWidth - 1;
    const maxHeight = window.innerHeight - 1;
    maxWidth > maxHeight ?
    // If the max width is more than the max height:
    this.setState({
      cvOffsetX: -(maxWidth - maxHeight) / 2,
      cvOffsetY: 0,
      cvWidth: maxHeight,
      cvHeight: maxHeight}) :
    // Otherwise:
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
  async renderMap() {
    let newFloor = [];
    const size = this.state.mapSize;

    for (let i=0; i < size; i++) {
      newFloor.push([]);
      for(let j=0; j < size; j++) {
        newFloor[i].push({
          x: j,
          y: i,
          seen: false,
          solid: true,
          fill: 'black'
        });
      }
    }

    newFloor = await this.fillMap(newFloor);
    newFloor = await this.lightTiles(newFloor, this.state.interactables.player);
    this.setState({floorPlan: newFloor});
  }

  // Generates the map for the user, creating a new dungeon each time to explore.
  fillMap(grid) {
    const width = this.state.mapSize;
    const height = this.state.mapSize;
    const roomsToGen = this.getRandInt(12, 17);
    const enemiesToGen = this.getRandInt(10, 20);
    const treasureToGen = this.getRandInt(3, 8);
    const maxRoomSize = 10;
    const minRoomSize = 6;
    const hallDensity = 1;
    let rmParams = [];
    let rooms = [];
    let pathfindStarts = {};

    // Simply generate a room with a set width, height, x-coord and y-coord,
    // given the set parameters.
    const generateRoom = ((id) => {
      const h = this.getRandInt(minRoomSize, maxRoomSize);
      const w = this.getRandInt(minRoomSize, maxRoomSize);

      return {
        w: this.getRandInt(minRoomSize, maxRoomSize),
        h: this.getRandInt(minRoomSize, maxRoomSize),
        x: this.getRandInt(1 + Math.ceil(w / 2), width - Math.ceil(w / 2) - 1),
        y: this.getRandInt(1 + Math.ceil(h / 2), height - Math.ceil(h / 2) - 1)
      };
    });

    // Simple algorithm to check two rooms to see if they collide.
    const detectCollision = (room1) => {
      for (let k = 0; k < rmParams.length; k++) {
        let room2 = rmParams[k];
        if (room1.x < room2.x + room2.w + 2 &&
          room1.x + room1.w + 2 > room2.x &&
          room1.y < room2.y + room2.h + 2 &&
          room1.h + room1.y + 2 > room2.y) {
            return true;
        }
      }
      return false;
    };

    // Generate the first room.
    rmParams.push(generateRoom());

    // Create rooms up to the set number of rooms.
    for (let i = 1; i < roomsToGen; i++) {
      let newRoom = generateRoom();
      // Detect collision of rooms and continue to generate
      // room until no collisions.
      while (detectCollision(newRoom)) {
        newRoom = generateRoom();
      }
      // Add the room once collisions are no longer detected.
      rmParams.push(newRoom);
    }

    // Takes the generated room parameters and creates an actual room
    // on the grid out of them.
    rmParams.map((room) => {
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

      for (let i = startY; i < endY; i++) {
        tmpRoom.push(grid[i].slice(startX, endX));
      }

      rooms.push(tmpRoom);
    });

    // Fills the now generated rooms on the map and defines them as floor tiles.
    rooms.map((room, rmId) => {
      // Allows identification of room attached to pathfindStarts

      pathfindStarts[rmId] = { walls: [], closest: [] }

      room.map((row, i) => {
        row.map((tile, j) => {
          const x = tile.x;
          const y = tile.y;
          grid[y][x].solid = false;
          grid[y][x].fill = 'white';

          // Allows pathfinding algorithm to skip pathfindStarts of rooms
          // and to pick a random wall to path from.
          if (grid[y - 1][x] !== undefined) {
            if (i === 0) {
              grid[y - 1][x].wall = true;
              pathfindStarts[rmId].walls.push({x: x, y: y - 1});
            }
          }

          if (grid[y + 1][x] !== undefined) {
            if (i === room.length - 1) {
              grid[y + 1][x].wall = true;
              pathfindStarts[rmId].walls.push({x: x, y: y + 1})
            }
          }

          if (grid[y][x - 1] !== undefined) {
            if (j === 0) {
              grid[y][x - 1].wall = true;
              pathfindStarts[rmId].walls.push({x: x - 1, y: y})
            }
          }

          if (grid[y][x + 1] !== undefined) {
            if (j === row.length - 1) {
              grid[y][x + 1].wall = true;
              pathfindStarts[rmId].walls.push({x: x + 1, y: y})
            }
          }
        })
      })
    });

    // Take x random walls from pathfindStarts, where x is the set density and
    // remove all other walls from each room id.
    // This determines how many starting positions the pathfinder will use from
    // each room.

    for (let i = 0; i < roomsToGen; i++) {
      const shuffle = pathfindStarts[i].walls.sort(() => .5 - Math.random());
      let random = shuffle.slice(0, hallDensity);
      pathfindStarts[i].walls = random;
    }

    // Find x closest rooms to each given room, where x is the
    // hall density that is set.
    // PS: I know this is a mess, I wish I knew a better way to do this.

    for (let i = 0; i < roomsToGen; i++) {
      const startPoints = pathfindStarts[i].walls;
      for (let k = 0; k < hallDensity; k++) {
        const stPoint = startPoints[k];
        let closestPoint = null;
        let closestDistance = 1000;
        for (let j = 0; j < roomsToGen; j++) {
          const endPoint = pathfindStarts[j].walls[k];
          if (stPoint == endPoint) {
            continue;
          }

          const distance = Math.abs(stPoint.x - endPoint.x) + Math.abs(stPoint.y - endPoint.y);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = endPoint;
          }
        }
        pathfindStarts[i].closest.push(closestPoint);
      }
    }

    // Use Dijkstra's algorithm to connect each room to it's x closest rooms,
    // where x is equal to the hall density that is set.
    let matrix = [];
    grid.map((row, i) => {
      let rowMap = []
      row.map((tile, k) => {
        rowMap.push(tile.solid && !tile.wall ? 0 : 1)
      });
      matrix.push(rowMap)
    });

    const pfGrid = new Grid(matrix);
    const finder = new BiDijkstraFinder();

    // TODO This is janky / non-functional currently. Fix.
    for (let i = 0; i < roomsToGen; i++) {
      const startPoints = pathfindStarts[i].walls;
      const endPoints = pathfindStarts[i].closest;
      for (let k = 0; k < startPoints.length; k++) {
        const x1 = startPoints[k].x;
        const x2 = endPoints[k].x;
        const y1 = startPoints[k].y;
        const y2 = startPoints[k].y;
        const path = finder.findPath(x1, y1, x2, y2, pfGrid);
        for (let j = 0; j < path.length; j++) {
          const x = path[j][0];
          const y = path[j][1];

          grid[y][x].solid = true;
          pfGrid.setWalkableAt(x, y, false);
          grid[y][x].fill = 'white';
        }
      }
    }

    // Starts the player in the center of a random room.
    const spawnRoom = rmParams[this.getRandInt(0, rmParams.length-1)];
    this.spawnPlayer(spawnRoom.x, spawnRoom.y);

    return grid;
  }

  spawnPlayer(x, y) {
    let newObj = JSON.parse(JSON.stringify(this.state.interactables));
    newObj.player.x = x;
    newObj.player.y = y;
    this.setState({interactables: newObj});
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
