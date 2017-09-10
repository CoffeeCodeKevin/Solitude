# Solitude

## Preface
Solitude is a silly little roguelike I'm making in React. I plan to add textures later, but
right now I'm really just learning as I go along. The architecture may look a bit strange,
and that is because I used a wonderful boilerplate called [React-Slingshot](https://github.com/coryhouse/react-slingshot)
to speed up my development. It is way overkill for this project, but hot reloading is nice and makes me smile. Solitude also utilizes
[React](https://facebook.github.io/react/) with [Konva](https://konvajs.github.io/) and
[React-Konva](https://github.com/lavrton/react-konva) to generate everything on the canvas.

This is both my first project in which I'm really utilizing the canvas and one of my first projects in React,
so I am sure there will be problems in the code and things I can improve on. Feel free any time to let me know what I can do to
improve, with either this project or just my code in general.

## Changelist

### 1.0.2 09/10/2017
- Changed project structure
- Improved upon room generation somewhat, looking into problems with collision detection

### 1.0.1 - 09/08/2017
- Added basic generation of rooms
- Improved upon existing rendering and structure to code
- Allowed basic functionality of conditioned filling of canvas elements based on their properties

### 1.0.0 - 09/07/2017
- Started the project at all
- Have it able to render floors / walls / empty space in a basic way
- Can allow for tiles to be lit as I walk, 'revealing' the currently empty dungeon as I go
- Have player, represented by a blue dot currently, able to move and forced within the dungeons bounds
- Set it to only update tiles when they become 'seen' by the player, massively increasing initial performance

## To do next
- Finish or get working in basic form the function to fill the dungeon tiles with rooms,
as well as connecting them
- Create some stats and names for creatues and treasure to put into the state
- Look into ways to generate these creatures, as well as treasure onto the finished map
- Look into basic AI patterns to follow player
- Implement battling of creatures in some form
