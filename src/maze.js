import * as THREE from 'three'
import {
  CELL_SIZE,
  CEILING_COLOR,
  FLOOR_COLOR,
  TRIM_COLOR,
  WALL_COLOR,
  WALL_HEIGHT,
} from './constants.js'

const GRID = [
  '###########',
  '#111#c#222#',
  '#111#c#222#',
  '#111ccc222#',
  '##c##c##c##',
  '#333ccc444#',
  '#333#c#444#',
  '#333#c#444#',
  '###########',
]

const GRID_HEIGHT = GRID.length
const GRID_WIDTH = GRID[0].length

const AREA_DEFINITIONS = {
  corridor: {
    title: 'Nucleo de Circulacion',
    label: 'Cruce central',
    description: 'Espacio de cruce entre cuatro salas y dos capsulas de aprendizaje. Desde este nucleo se articulan recorridos breves, abiertos y no lineales.',
    accent: 0x7b5031,
    regions: [[1, 2, 7, 7]],
  },
  room1: {
    title: 'La Encrucijada Algoritmica',
    label: 'Soberania cognitiva',
    description: 'Una sala sobre colonialismo digital, automatizacion y defensa del juicio humano en los procesos de aprendizaje.',
    accent: 0x8de7ee,
    regions: [[1, 1, 3, 3]],
    door: { row: 3, col: 3, side: 'east' },
  },
  room2: {
    title: 'Pedagogias Emergentes',
    label: 'Alfabetizacion digital critica',
    description: 'Una sala sobre mediaciones pedagogicas, riesgos de las tecnologias emergentes y transformaciones del aprender en ecosistemas digitales.',
    accent: 0xf0a9d7,
    regions: [[1, 7, 3, 3]],
    door: { row: 3, col: 7, side: 'west' },
  },
  room3: {
    title: 'Cartografias del Aprendizaje',
    label: 'Entornos personales',
    description: 'Una sala dedicada a los PLE, la organizacion de trayectorias y la construccion de ecologias propias para aprender.',
    accent: 0xb5d46b,
    regions: [[5, 1, 3, 3]],
    door: { row: 7, col: 3, side: 'east' },
  },
  room4: {
    title: 'Ecologias del Aprendizaje Abierto',
    label: 'Educacion expandida',
    description: 'Una sala sobre aprendizaje ubicuo, educacion expandida y transicion desde TIC hacia TAC y TEP.',
    accent: 0xaab6ff,
    regions: [[5, 7, 3, 3]],
    door: { row: 7, col: 7, side: 'west' },
  },
}

const AREA_BY_CHAR = {
  c: 'corridor',
  1: 'room1',
  2: 'room2',
  3: 'room3',
  4: 'room4',
}

const SPAWN = {
  row: 4,
  col: 5,
  direction: 0,
}

const MAZE = GRID.map((row) => Array.from(row, (cell) => (cell === '#' ? 1 : 0)))
const AREA_MAP = GRID.map((row) => Array.from(row, (cell) => AREA_BY_CHAR[cell] ?? null))

function createMaterial(color) {
  return new THREE.MeshLambertMaterial({ color })
}

function adjustColor(color, amount) {
  const adjusted = new THREE.Color(color)

  if (amount >= 0) {
    adjusted.lerp(new THREE.Color(0xffffff), amount)
  } else {
    adjusted.lerp(new THREE.Color(0x000000), Math.abs(amount))
  }

  return adjusted.getHex()
}

function getAreaAt(row, col) {
  if (row < 0 || col < 0 || row >= GRID_HEIGHT || col >= GRID_WIDTH) {
    return null
  }

  return AREA_MAP[row][col]
}

function getNeighborAccent(row, col) {
  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]

  for (const [rowDelta, colDelta] of deltas) {
    const areaId = getAreaAt(row + rowDelta, col + colDelta)

    if (areaId) {
      return AREA_DEFINITIONS[areaId].accent
    }
  }

  return WALL_COLOR
}

export function getSpawnState() {
  return { ...SPAWN }
}

export function getCellWorldPosition(col, row) {
  return {
    x: (col - GRID_WIDTH / 2 + 0.5) * CELL_SIZE,
    z: (row - GRID_HEIGHT / 2 + 0.5) * CELL_SIZE,
  }
}

export function isWalkable(row, col) {
  if (row < 0 || col < 0 || row >= GRID_HEIGHT || col >= GRID_WIDTH) {
    return false
  }

  return MAZE[row][col] === 0
}

export function getAreaInfo(row, col) {
  const areaId = getAreaAt(row, col)

  if (!areaId) {
    return {
      id: 'wall',
      title: 'Muro',
      label: 'Limite',
      description: 'Las paredes organizan el recorrido compacto del museo.',
      accent: WALL_COLOR,
    }
  }

  return {
    id: areaId,
    ...AREA_DEFINITIONS[areaId],
  }
}

function buildFloorTile(row, col, color) {
  const position = getCellWorldPosition(col, row)
  const tile = new THREE.Mesh(
    new THREE.PlaneGeometry(CELL_SIZE - 0.15, CELL_SIZE - 0.15),
    createMaterial(adjustColor(color, -0.42)),
  )
  tile.rotation.x = -Math.PI / 2
  tile.position.set(position.x, 0.03, position.z)
  return tile
}

function buildDoorFrame(area) {
  if (!area.door) {
    return null
  }

  const { row, col, side } = area.door
  const base = getCellWorldPosition(col, row)
  const group = new THREE.Group()
  const trimMaterial = createMaterial(TRIM_COLOR)
  const accentMaterial = createMaterial(adjustColor(area.accent, -0.58))
  const jambGeometry = new THREE.BoxGeometry(0.28, 2.5, 0.28)
  const lintelGeometry = new THREE.BoxGeometry(2.48, 0.28, 0.28)

  if (side === 'north' || side === 'south') {
    const centerZ = base.z + (side === 'south' ? CELL_SIZE * 0.5 : -CELL_SIZE * 0.5)
    const leftJamb = new THREE.Mesh(jambGeometry, trimMaterial)
    const rightJamb = new THREE.Mesh(jambGeometry, trimMaterial)
    const lintel = new THREE.Mesh(lintelGeometry, trimMaterial)
    const leftClosure = new THREE.Mesh(new THREE.BoxGeometry(0.76, WALL_HEIGHT, 0.32), accentMaterial)
    const rightClosure = new THREE.Mesh(new THREE.BoxGeometry(0.76, WALL_HEIGHT, 0.32), accentMaterial)

    leftJamb.position.set(base.x - 0.9, 1.25, centerZ)
    rightJamb.position.set(base.x + 0.9, 1.25, centerZ)
    lintel.position.set(base.x, 2.45, centerZ)
    leftClosure.position.set(base.x - 1.62, WALL_HEIGHT / 2, centerZ)
    rightClosure.position.set(base.x + 1.62, WALL_HEIGHT / 2, centerZ)
    group.add(leftClosure, rightClosure, leftJamb, rightJamb, lintel)
  } else {
    const centerX = base.x + (side === 'east' ? CELL_SIZE * 0.5 : -CELL_SIZE * 0.5)
    const topJamb = new THREE.Mesh(jambGeometry, trimMaterial)
    const bottomJamb = new THREE.Mesh(jambGeometry, trimMaterial)
    const lintel = new THREE.Mesh(lintelGeometry, trimMaterial)
    const topClosure = new THREE.Mesh(new THREE.BoxGeometry(0.32, WALL_HEIGHT, 0.76), accentMaterial)
    const bottomClosure = new THREE.Mesh(new THREE.BoxGeometry(0.32, WALL_HEIGHT, 0.76), accentMaterial)

    topJamb.position.set(centerX, 1.25, base.z - 0.9)
    bottomJamb.position.set(centerX, 1.25, base.z + 0.9)
    lintel.rotation.z = Math.PI / 2
    lintel.position.set(centerX, 2.45, base.z)
    topClosure.position.set(centerX, WALL_HEIGHT / 2, base.z - 1.62)
    bottomClosure.position.set(centerX, WALL_HEIGHT / 2, base.z + 1.62)
    group.add(topClosure, bottomClosure, topJamb, bottomJamb, lintel)
  }

  return group
}

export function buildMaze() {
  const group = new THREE.Group()

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE),
    createMaterial(FLOOR_COLOR),
  )
  floor.rotation.x = -Math.PI / 2
  group.add(floor)

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE),
    createMaterial(CEILING_COLOR),
  )
  ceiling.position.y = WALL_HEIGHT
  ceiling.rotation.x = Math.PI / 2
  group.add(ceiling)

  for (let row = 0; row < GRID_HEIGHT; row += 1) {
    for (let col = 0; col < GRID_WIDTH; col += 1) {
      const areaId = getAreaAt(row, col)

      if (areaId) {
        group.add(buildFloorTile(row, col, AREA_DEFINITIONS[areaId].accent))
      }
    }
  }

  Object.values(AREA_DEFINITIONS).forEach((area) => {
    if (area.door) {
      group.add(buildDoorFrame(area))
    }
  })

  const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE)
  const topTrimMaterial = createMaterial(TRIM_COLOR)

  for (let row = 0; row < GRID_HEIGHT; row += 1) {
    for (let col = 0; col < GRID_WIDTH; col += 1) {
      if (MAZE[row][col] !== 1) {
        continue
      }

      const accent = getNeighborAccent(row, col)
      const wallFaceMaterial = createMaterial(adjustColor(accent, -0.58))
      const wall = new THREE.Mesh(wallGeometry, [
        topTrimMaterial,
        createMaterial(adjustColor(accent, -0.18)),
        wallFaceMaterial,
        wallFaceMaterial,
        wallFaceMaterial,
        wallFaceMaterial,
      ])
      const position = getCellWorldPosition(col, row)
      wall.position.set(position.x, WALL_HEIGHT / 2, position.z)
      group.add(wall)
    }
  }

  return group
}
