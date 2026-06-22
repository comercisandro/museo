import * as THREE from 'three'
import {
  CELL_SIZE,
  CEILING_COLOR,
  FLOOR_COLOR,
  TRIM_COLOR,
  WALL_COLOR,
  WALL_HEIGHT,
} from './constants.js'

export const MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

const SPAWN = {
  row: 1,
  col: 1,
  direction: 1,
}

const mazeHeight = MAZE.length
const mazeWidth = MAZE[0].length

function createMaterial(color) {
  return new THREE.MeshLambertMaterial({ color })
}

export function getSpawnState() {
  return { ...SPAWN }
}

export function getCellWorldPosition(col, row) {
  return {
    x: (col - mazeWidth / 2 + 0.5) * CELL_SIZE,
    z: (row - mazeHeight / 2 + 0.5) * CELL_SIZE,
  }
}

export function isWalkable(row, col) {
  if (row < 0 || col < 0 || row >= mazeHeight || col >= mazeWidth) {
    return false
  }

  return MAZE[row][col] === 0
}

export function buildMaze() {
  const group = new THREE.Group()

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(mazeWidth * CELL_SIZE, mazeHeight * CELL_SIZE),
    createMaterial(FLOOR_COLOR),
  )
  floor.rotation.x = -Math.PI / 2
  group.add(floor)

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(mazeWidth * CELL_SIZE, mazeHeight * CELL_SIZE),
    createMaterial(CEILING_COLOR),
  )
  ceiling.position.y = WALL_HEIGHT
  ceiling.rotation.x = Math.PI / 2
  group.add(ceiling)

  const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE)
  const wallMaterial = createMaterial(WALL_COLOR)
  const trimMaterial = createMaterial(TRIM_COLOR)

  for (let row = 0; row < mazeHeight; row += 1) {
    for (let col = 0; col < mazeWidth; col += 1) {
      if (MAZE[row][col] !== 1) {
        continue
      }

      const position = getCellWorldPosition(col, row)
      const wall = new THREE.Mesh(wallGeometry, [
        trimMaterial,
        trimMaterial,
        wallMaterial,
        wallMaterial,
        wallMaterial,
        wallMaterial,
      ])
      wall.position.set(position.x, WALL_HEIGHT / 2, position.z)
      group.add(wall)
    }
  }

  return group
}
