import 'babel-polyfill';
import React from 'react';
import {Stage, Layer, Group} from 'react-konva';
import {Grid, BiDijkstraFinder} from 'pathfinding';

import Floor from './Floor';
import Player from './Player';
import Treasure from './Treasure';
import Monsters from './Monsters';
import Fog from './Fog';
import ButtonContainer from './ButtonContainer';

class Game extends React.Component {
  // COMPONENT SETUP
  constructor(props) {
    super(props);

    this.state = {
      cvHeight: 700,
      cvWidth: 700,
      cvOffsetX: 0,
      cvOffsetY: 0,
      fog: true,
      mapSize: 50,
      floorPlan: [],
      floorNumber: 1,
      player: {
        stats: {
          hp: 100,
          atk: 10,
          def: 0
        },
        x: 0,
        y: 0
      },
      treasureList: [],
      monsterList: [],
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
    this.toggleFog = this.toggleFog.bind(this);
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

  // VISUAL CHANGES / DEBUG
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

  toggleFog() {
    this.setState({
      fog: !this.state.fog
    });
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
    let player = JSON.parse(JSON.stringify(this.state.player));
    let updatedFloor = JSON.parse(JSON.stringify(this.state.floorPlan));
    const size = this.state.mapSize;

    player = this.detectObjectCollision(player, updatedFloor, p_direction, size);
    updatedFloor = this.lightTiles(updatedFloor, player);

    await this.setState({
      player: player,
      floorPlan: updatedFloor
    });
  }

  // Detects collisions between player (and also later monsters) and
  // the environment / other interactable objects
  detectObjectCollision(obj, floor, direction, mapSize) {
    if (direction == 'up') {
      if (obj.y > 0 && obj.y < mapSize) {
        if(!floor[obj.y - 1][obj.x].solid && floor[obj.y - 1][obj.x].contains.type !== 'monster') {
          obj.y--;
        }
      }
    } else if (direction == 'down') {
      if (obj.y > -1 && obj.y < mapSize - 1) {
        if(!floor[obj.y + 1][obj.x].solid && floor[obj.y + 1][obj.x].contains.type !== 'monster') {
          obj.y++;
        }
      }
    } else if (direction == 'left') {
      if (obj.x > 0 && obj.x < mapSize) {
        if(!floor[obj.y][obj.x - 1].solid && floor[obj.y][obj.x - 1].contains.type !== 'monster') {
          obj.x--;
        }
      }
    } else if (direction == 'right') {
      if (obj.x > -1 && obj.x < mapSize - 1) {
        if(!floor[obj.y][obj.x + 1].solid && floor[obj.y][obj.x + 1].contains.type !== 'monster') {
          obj.x++;
        }
      }
    }

    return obj;
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
          contains: {
            type: null,
            id: null,
            content: null
          }
        });
      }
    }

    newFloor = await this.fillMap(newFloor);
    newFloor = await this.lightTiles(newFloor, this.state.player);
    this.setState({floorPlan: newFloor});
  }

  // Generates the map for the user, creating a new dungeon each time to explore.
  async fillMap(grid) {
    const width = this.state.mapSize;
    const height = this.state.mapSize;
    const roomsToGen = this.getRandInt(12, 17);
    const monstersToGen = this.getRandInt(10, 20);
    const treasureToGen = this.getRandInt(3, 8);
    const maxRoomSize = 10;
    const minRoomSize = 6;
    const hallDensity = 1;
    let rmParams = [];
    let rooms = [];

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
    rooms.map((room) => {
      room.map((row) => {
        row.map((tile) => {
          const x = tile.x;
          const y = tile.y;
          grid[y][x].solid = false;
        });
      });
    });

    // Generates treasure and places on map
    let treasureList = [];
    for (let i = 0; i < treasureToGen; i++) {
      const room = rooms[Math.floor(Math.random()*rooms.length)];
      const row = room[Math.floor(Math.random()*room.length)];
      const tile = row[Math.floor(Math.random()*row.length)]
      const treasure = this.generateTreasure(tile.x, tile.y);
      grid[tile.y][tile.x].contains = treasure;
      treasureList.push(treasure)
    }

    // Generates monsters and places on map

    let monsterList = [];
    for (let i = 0; i < monstersToGen; i++) {
      const room = rooms[Math.floor(Math.random()*rooms.length)];
      const row = room[Math.floor(Math.random()*room.length)];
      const tile = row[Math.floor(Math.random()*row.length)]
      const monster = this.generateMonster(tile.x, tile.y);
      grid[tile.y][tile.x].contains = monster;
      monsterList.push(monster)
    }

    this.setState({treasureList: treasureList, monsterList: monsterList});

    // Use Dijkstra's algorithm to connect each room to x random rooms,
    // where x is equal to the hall density that is set.

    const pfGrid = new Grid(width, height);
    const finder = new BiDijkstraFinder();

    // TODO Random offset from center to give more random
    // looking paths.
    // TODO Randomize weight across pathGrid, rather than 0 and 1. May need new library.
    rmParams.map((room1) => {
      let connectableRooms = rmParams.slice(0);
      for (let i = 0; i < hallDensity; i++) {
        const pathGrid = pfGrid.clone();
        const random = Math.floor(Math.random()*rmParams.length)
        const room2 = connectableRooms[random];
        const path = finder.findPath(room1.x, room1.y, room2.x, room2.y, pathGrid);
        connectableRooms.splice(random, 1);
        for (let k = 0; k < path.length; k++) {
          const x = path[k][0];
          const y = path[k][1];

          grid[y][x].solid = false;
        }
      }
    })

    // Starts the player in the center of a random room.
    const spawnRoom = rmParams[this.getRandInt(0, rmParams.length-1)];
    this.spawnPlayer(spawnRoom.x, spawnRoom.y);

    return grid;
  }

  spawnPlayer(x, y) {
    let player = JSON.parse(JSON.stringify(this.state.player));
    player.x = x;
    player.y = y;
    this.setState({player: player});
  }

  // Given a grid to work with, causes the player to
  // reveal dungeon tiles in a 5x5 grid with them as the center.
  lightTiles(grid, player) {
    const size = this.state.mapSize;
    const x = player.x;
    const y = player.y;
    const startX = (x - 3 < 0 ? 0 : x - 3);
    const startY = (y - 3 < 0 ? 0 : y - 3);
    const endX = (x + 3 > size ? size : x + 4);
    const endY = (y + 3 > size - 1 ? size : y + 4);
    let shapeStartX;
    let shapeEndX;
    let litArea = [];

    for (let i = startY; i < endY; i++) {
      if (i === startY || i === endY - 1) {
        shapeStartX = startX + 3;
        shapeEndX = endX - 3;
      } else if (i === startY + 1 || i === endY - 2) {
        shapeStartX = startX + 2;
        shapeEndX = endX - 2;
      } else if (i === startY + 2 || i === endY - 3)  {
        shapeStartX = startX + 1;
        shapeEndX = endX - 1;
      } else {
        shapeStartX = startX;
        shapeEndX = endX;
      }

      litArea.push(grid[i].slice(shapeStartX, shapeEndX));
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

  // OBJECT AND ID GENERATION

  generateTreasure(x, y) {
    return {
      type: 'treasure',
      id: this.generateUUID(),
      content: {
        dropCount: this.getRandInt(1, this.state.floorNumber),
        x: x,
        y: y
      }
    };
  }

  generateMonster(x, y) {
    const modifier = Math.random() * 2 * this.state.floorNumber;

    return {
      type: 'monster',
      id: this.generateUUID(),
      content: {
        stats: {
          hp: 20 * modifier,
          atk: 5 * modifier,
          def: 2 * modifier
        },
        x: x,
        y: y
      }
    }
  }

  generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

  // LOOT DROPS

  // Used to determine what a random drop is for the player.
  randomDrop() {
    Math.random() > 0.33 ? (Math.random() > 0.66 ? this.healDrop() : this.armorDrop()) : this.weaponDrop();
  }

  // A drop that instantly heals the player for a random amount.
  healDrop() {
    const hp = this.state.player.stats.hp;
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
      <div id='game'>
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
            <Group>
              <Player
                mapSize={this.state.mapSize}
                player={this.state.player}
                cvHeight={this.state.cvHeight}
                cvWidth={this.state.cvWidth} />
              <Treasure
                mapSize={this.state.mapSize}
                treasureList={this.state.treasureList}
                cvHeight={this.state.cvHeight}
                cvWidth={this.state.cvWidth} />
              <Monsters
                mapSize={this.state.mapSize}
                monsterList={this.state.monsterList}
                cvHeight={this.state.cvHeight}
                cvWidth={this.state.cvWidth} />
            </Group>
          </Layer>
          <Layer>
            <Fog
              cvHeight={this.state.cvHeight}
              cvWidth={this.state.cvWidth}
              floorPlan={this.state.floorPlan}
              fog={this.state.fog} />
          </Layer>
        </Stage>
        <ButtonContainer toggleFog={this.toggleFog} />
      </div>
    )
  }
}

export default Game;
