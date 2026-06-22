import * as THREE from 'three'
import {
  CELL_SIZE,
  CEILING_COLOR,
  FLOOR_COLOR,
  TRIM_COLOR,
  WALL_COLOR,
  WALL_HEIGHT,
} from './constants.js'

const GRID_WIDTH = 11
const GRID_HEIGHT = 35

const AREA_DEFINITIONS = {
  hall: {
    title: 'Hall Principal',
    label: 'Ingreso',
    description: 'Vestibulo de entrada al museo. Desde aqui comienza un recorrido lineal por las siete salas tematicas.',
    accent: 0xd9b36a,
    regions: [[32, 2, 3, 7]],
    panels: [{ row: 33, col: 5, title: 'Museo Surrealista', body: 'Hall de ingreso y orientacion del recorrido.' }],
  },
  corridor: {
    title: 'Corredor de Circulacion',
    label: 'Aberturas centrales',
    description: 'Cada sala se conecta con la siguiente mediante una abertura central que mantiene el recorrido continuo.',
    accent: 0x7b5031,
    regions: [
      [3, 4, 1, 3],
      [7, 4, 1, 3],
      [11, 4, 1, 3],
      [15, 4, 1, 3],
      [19, 4, 1, 3],
      [23, 4, 1, 3],
      [27, 4, 1, 3],
      [31, 4, 1, 3],
    ],
  },
  room1: {
    title: 'Sala 1: Texto',
    label: 'Pedagogia de la sospecha',
    description: 'Lectura fragmentada para sospechar de la alucinacion algoritmica y recuperar el juicio humano.',
    accent: 0x8de7ee,
    regions: [[28, 2, 3, 7]],
    door: { row: 30, col: 5, side: 'south' },
    panels: [
      { row: 29, col: 4, title: 'Fragmento 1', body: 'El saber no puede reducirse a una salida automatica.' },
      { row: 29, col: 6, title: 'Fragmento 2', body: 'Sospechar tambien es una forma de aprender.' },
    ],
    sculpture: { row: 30, col: 3, kind: 'obelisk' },
  },
  room2: {
    title: 'Sala 2: Audio',
    label: 'Persistencia digital',
    description: 'Reflexion sonora sobre aceleracion, pereza cognitiva y tiempo educativo deformado.',
    accent: 0xf0a9d7,
    regions: [[24, 2, 3, 7]],
    door: { row: 26, col: 5, side: 'south' },
    panels: [{ row: 25, col: 4, title: 'Audio', body: 'Tiempo, atencion y escucha critica en el aula.' }],
    sculpture: { row: 26, col: 3, kind: 'speaker' },
  },
  room3: {
    title: 'Sala 3: Video',
    label: 'Ecologias ampliadas',
    description: 'Puente entre ocio, conocimiento y narrativas que escapan al aula cerrada.',
    accent: 0xb5d46b,
    regions: [[20, 2, 3, 7]],
    door: { row: 22, col: 5, side: 'south' },
    panels: [{ row: 21, col: 4, title: 'Video', body: 'El estudiante como protagonista de una ecologia ampliada.' }],
    sculpture: { row: 22, col: 3, kind: 'screen' },
  },
  room4: {
    title: 'Sala 4: Esquema Conceptual',
    label: 'Terreno en disputa',
    description: 'Mapa rizomatico sin centro sobre gobernabilidad algoritmica, sesgos, bien comun y agencia humana.',
    accent: 0xaab6ff,
    regions: [[16, 2, 3, 7]],
    door: { row: 18, col: 5, side: 'south' },
    panels: [{ row: 17, col: 4, title: 'Esquema', body: 'No hay centro: solo nodos, tensiones y decisiones.' }],
    sculpture: { row: 18, col: 3, kind: 'totem' },
  },
  room5: {
    title: 'Sala 5: Actividad',
    label: 'Curaduria epistemica',
    description: 'Friccion cognitiva para filtrar alucinaciones y sostener criterio pedagogico.',
    accent: 0xffb36b,
    regions: [[12, 2, 3, 7]],
    door: { row: 14, col: 5, side: 'south' },
    panels: [{ row: 13, col: 4, title: 'Actividad', body: 'Filtre la alucinacion: juzgar tambien es aprender.' }],
    sculpture: { row: 14, col: 3, kind: 'desk' },
  },
  room6: {
    title: 'Sala 6: Musica',
    label: 'Sociedad gaseosa',
    description: 'Ambiente sonoro para pensar el aprendizaje sin costuras y la dilucion de los muros del aula.',
    accent: 0x78c9b1,
    regions: [[8, 2, 3, 7]],
    door: { row: 10, col: 5, side: 'south' },
    panels: [{ row: 9, col: 4, title: 'Musica', body: 'Una atmosfera para oir la escuela mas alla del aula.' }],
    sculpture: { row: 10, col: 3, kind: 'speaker' },
  },
  room7: {
    title: 'Sala 7: Imagen',
    label: 'Deconstruccion de mitos',
    description: 'Anexo visual para desmontar determinismo tecnologico, negacionismo y solucionismo.',
    accent: 0xf29494,
    regions: [[4, 2, 3, 7]],
    door: { row: 6, col: 5, side: 'south' },
    panels: [
      { row: 5, col: 4, title: 'Imagen', body: 'La tecnologia no educa por si sola: educan los humanos.' },
      { row: 5, col: 6, title: 'Mitos', body: 'Determinismo, negacionismo y solucionismo.' },
    ],
    sculpture: { row: 6, col: 3, kind: 'frame' },
  },
  final: {
    title: 'Sala Final',
    label: 'Pregunta significativa',
    description: 'Cierre abierto del museo: una pregunta sobre autonomia, docencia y apropiacion critica de la IA.',
    accent: 0xf4e4a2,
    regions: [[0, 2, 3, 7]],
    door: { row: 2, col: 5, side: 'south' },
    panels: [{ row: 1, col: 5, title: 'Pregunta', body: 'Como sostener una pedagogia emancipadora frente al algoritmo?' }],
    sculpture: { row: 2, col: 3, kind: 'obelisk' },
  },
}

const SPAWN = {
  row: 33,
  col: 5,
  direction: 0,
}

function createGrid(width, height, fillValue) {
  return Array.from({ length: height }, () => Array(width).fill(fillValue))
}

const MAZE = createGrid(GRID_WIDTH, GRID_HEIGHT, 1)
const AREA_MAP = createGrid(GRID_WIDTH, GRID_HEIGHT, null)

function carveArea(areaId, top, left, height, width) {
  for (let row = top; row < top + height; row += 1) {
    for (let col = left; col < left + width; col += 1) {
      MAZE[row][col] = 0
      AREA_MAP[row][col] = areaId
    }
  }
}

Object.entries(AREA_DEFINITIONS).forEach(([areaId, area]) => {
  area.regions.forEach(([top, left, height, width]) => carveArea(areaId, top, left, height, width))
})

const mazeHeight = MAZE.length
const mazeWidth = MAZE[0].length

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

function makeTextTexture(title, body, accent) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#1a1118'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = `#${new THREE.Color(accent).getHexString()}`
  ctx.lineWidth = 8
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24)

  ctx.fillStyle = '#d9b36a'
  ctx.font = 'bold 34px Georgia'
  ctx.fillText(title, 34, 62)

  ctx.fillStyle = '#f5efe4'
  ctx.font = '24px Georgia'

  const words = body.split(' ')
  const lines = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word

    if (ctx.measureText(next).width > 430) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }

  if (line) {
    lines.push(line)
  }

  lines.slice(0, 4).forEach((content, index) => {
    ctx.fillText(content, 34, 118 + index * 34)
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function getAreaAt(row, col) {
  if (row < 0 || col < 0 || row >= mazeHeight || col >= mazeWidth) {
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

function isInsideRegion(row, col, region) {
  const [top, left, height, width] = region
  return row >= top && row < top + height && col >= left && col < left + width
}

function getRegionCenter(region) {
  const [top, left, height, width] = region
  return {
    row: top + height / 2 - 0.5,
    col: left + width / 2 - 0.5,
  }
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

export function getAreaInfo(row, col) {
  const areaId = getAreaAt(row, col)

  if (!areaId) {
    return {
      id: 'wall',
      title: 'Muro',
      label: 'Limite',
      description: 'Las paredes cierran el museo y organizan la circulacion del recorrido.',
      accent: WALL_COLOR,
    }
  }

  return {
    id: areaId,
    ...AREA_DEFINITIONS[areaId],
  }
}

function buildFloorOverlay(region, color) {
  const center = getRegionCenter(region)
  const position = getCellWorldPosition(center.col, center.row)
  const [, , height, width] = region

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width * CELL_SIZE - 0.45, height * CELL_SIZE - 0.45),
    createMaterial(adjustColor(color, -0.45)),
  )
  plane.rotation.x = -Math.PI / 2
  plane.position.set(position.x, 0.03, position.z)

  return plane
}

function buildRegionBorder(region, color) {
  const group = new THREE.Group()
  const [top, left, height, width] = region
  const borderMaterial = createMaterial(adjustColor(color, 0.08))

  for (let row = top; row < top + height; row += 1) {
    for (let col = left; col < left + width; col += 1) {
      const edge =
        row === top ||
        row === top + height - 1 ||
        col === left ||
        col === left + width - 1

      if (!edge) {
        continue
      }

      const position = getCellWorldPosition(col, row)
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE * 0.18, 0.08, CELL_SIZE * 0.18),
        borderMaterial,
      )
      tile.position.set(position.x, 0.05, position.z)
      group.add(tile)
    }
  }

  return group
}

function buildDoorFrame(area) {
  if (!area.door) {
    return null
  }

  const { row, col, side } = area.door
  const base = getCellWorldPosition(col, row)
  const group = new THREE.Group()
  const region = area.regions[0]
  const [, , regionHeight, regionWidth] = region
  const accentMaterial = createMaterial(adjustColor(area.accent, -0.58))
  const trimMaterial = createMaterial(TRIM_COLOR)
  const jambGeometry = new THREE.BoxGeometry(0.28, 2.5, 0.28)
  const lintelGeometry = new THREE.BoxGeometry(2.48, 0.28, 0.28)
  const direction = side === 'east' ? 1 : side === 'west' ? -1 : 0
  const depth = side === 'south' ? 1 : side === 'north' ? -1 : 0
  const openingWidth = 2.48
  const thresholdThickness = 0.32

  if (direction !== 0) {
    const centerX = base.x + direction * CELL_SIZE * 0.5
    const centerZ = base.z
    const leftJamb = new THREE.Mesh(jambGeometry, trimMaterial)
    const rightJamb = new THREE.Mesh(jambGeometry, trimMaterial)
    const lintel = new THREE.Mesh(lintelGeometry, trimMaterial)
    const sideWallDepth = (regionHeight * CELL_SIZE - openingWidth) / 2
    const topClosure = new THREE.Mesh(
      new THREE.BoxGeometry(thresholdThickness, WALL_HEIGHT, sideWallDepth),
      accentMaterial,
    )
    const bottomClosure = new THREE.Mesh(
      new THREE.BoxGeometry(thresholdThickness, WALL_HEIGHT, sideWallDepth),
      accentMaterial,
    )
    leftJamb.position.set(centerX, 1.25, base.z - 0.9)
    rightJamb.position.set(centerX, 1.25, base.z + 0.9)
    lintel.rotation.z = Math.PI / 2
    lintel.position.set(centerX, 2.45, base.z)
    topClosure.position.set(centerX, WALL_HEIGHT / 2, centerZ - (openingWidth + sideWallDepth) / 2)
    bottomClosure.position.set(centerX, WALL_HEIGHT / 2, centerZ + (openingWidth + sideWallDepth) / 2)
    group.add(topClosure, bottomClosure, leftJamb, rightJamb, lintel)
  } else {
    const centerZ = base.z + depth * CELL_SIZE * 0.5
    const centerX = base.x
    const leftJamb = new THREE.Mesh(jambGeometry, trimMaterial)
    const rightJamb = new THREE.Mesh(jambGeometry, trimMaterial)
    const lintel = new THREE.Mesh(lintelGeometry, trimMaterial)
    const sideWallWidth = (regionWidth * CELL_SIZE - openingWidth) / 2
    const leftClosure = new THREE.Mesh(
      new THREE.BoxGeometry(sideWallWidth, WALL_HEIGHT, thresholdThickness),
      accentMaterial,
    )
    const rightClosure = new THREE.Mesh(
      new THREE.BoxGeometry(sideWallWidth, WALL_HEIGHT, thresholdThickness),
      accentMaterial,
    )
    leftJamb.position.set(base.x - 0.9, 1.25, centerZ)
    rightJamb.position.set(base.x + 0.9, 1.25, centerZ)
    lintel.position.set(base.x, 2.45, centerZ)
    leftClosure.position.set(centerX - (openingWidth + sideWallWidth) / 2, WALL_HEIGHT / 2, centerZ)
    rightClosure.position.set(centerX + (openingWidth + sideWallWidth) / 2, WALL_HEIGHT / 2, centerZ)
    group.add(leftClosure, rightClosure, leftJamb, rightJamb, lintel)
  }

  return group
}

function buildSign(area) {
  if (!area.door) {
    return null
  }

  const { row, col, side } = area.door
  const doorPosition = getCellWorldPosition(col, row)
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 0.8),
    new THREE.MeshBasicMaterial({
      map: makeTextTexture(area.title, area.label, area.accent),
      transparent: false,
    }),
  )

  if (side === 'east') {
    sign.position.set(doorPosition.x - 1.5, 2.55, doorPosition.z)
    sign.rotation.y = -Math.PI / 2
  } else if (side === 'west') {
    sign.position.set(doorPosition.x + 1.5, 2.55, doorPosition.z)
    sign.rotation.y = Math.PI / 2
  } else if (side === 'south') {
    sign.position.set(doorPosition.x, 2.55, doorPosition.z + 2.4)
  } else {
    sign.position.set(doorPosition.x, 2.55, doorPosition.z - 2.4)
    sign.rotation.y = Math.PI
  }

  return sign
}

function buildPanel(panel, accent) {
  const position = getCellWorldPosition(panel.col, panel.row)
  const group = new THREE.Group()

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 1.3, 0.12),
    createMaterial(adjustColor(accent, -0.2)),
  )
  board.position.set(position.x, 1.1, position.z)
  group.add(board)

  const placard = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.08),
    new THREE.MeshBasicMaterial({
      map: makeTextTexture(panel.title, panel.body, accent),
    }),
  )
  placard.position.set(position.x, 1.1, position.z + 0.08)
  group.add(placard)

  return group
}

function buildSculpture(sculpture, accent) {
  const position = getCellWorldPosition(sculpture.col, sculpture.row)
  const material = createMaterial(adjustColor(accent, -0.1))
  const trim = createMaterial(TRIM_COLOR)
  const group = new THREE.Group()
  let mesh

  if (sculpture.kind === 'obelisk') {
    mesh = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2, 4), material)
    mesh.position.y = 1.2
    mesh.rotation.y = Math.PI / 4
  } else if (sculpture.kind === 'speaker') {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.9), material)
    mesh.position.y = 1
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.15, 20), trim)
    ring.rotation.x = Math.PI / 2
    ring.position.set(0, 1.05, 0.46)
    group.add(ring)
  } else if (sculpture.kind === 'screen') {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.85, 0.14), material)
    mesh.position.y = 1.25
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), trim)
    stand.position.y = 0.6
    group.add(stand)
  } else if (sculpture.kind === 'totem') {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 1.8, 6), material)
    mesh.position.y = 1.05
  } else if (sculpture.kind === 'desk') {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 0.8), material)
    mesh.position.y = 0.95
    ;[
      [-0.4, 0.45, -0.25],
      [0.4, 0.45, -0.25],
      [-0.4, 0.45, 0.25],
      [0.4, 0.45, 0.25],
    ].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), trim)
      leg.position.set(x, y, z)
      group.add(leg)
    })
  } else if (sculpture.kind === 'frame') {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.12), material)
    mesh.position.y = 1.2
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.15), trim)
    inner.position.set(0, 1.2, 0.07)
    group.add(inner)
  } else {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), material)
    mesh.position.y = 0.8
  }

  group.add(mesh)
  group.position.set(position.x, 0, position.z)
  return group
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

  Object.values(AREA_DEFINITIONS).forEach((area) => {
    area.regions.forEach((region) => {
      group.add(buildFloorOverlay(region, area.accent))

      if (area !== AREA_DEFINITIONS.corridor) {
        group.add(buildRegionBorder(region, area.accent))
      }
    })

    if (area.door) {
      group.add(buildDoorFrame(area))
      group.add(buildSign(area))
    }

    area.panels?.forEach((panel) => group.add(buildPanel(panel, area.accent)))

    if (area.sculpture) {
      group.add(buildSculpture(area.sculpture, area.accent))
    }
  })

  const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE)
  const topTrimMaterial = createMaterial(TRIM_COLOR)

  for (let row = 0; row < mazeHeight; row += 1) {
    for (let col = 0; col < mazeWidth; col += 1) {
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
