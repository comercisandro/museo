import * as THREE from 'three'
import { CELL_SIZE, TRIM_COLOR, WALL_HEIGHT } from './constants.js'
import { getCellWorldPosition } from './maze.js'

const ROOM1_REGION = {
  top: 28,
  left: 2,
  height: 3,
  width: 7,
}

function makeCanvasTexture(title, body, accent, width = 1024, height = 768) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#171018'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = `#${new THREE.Color(accent).getHexString()}`
  ctx.lineWidth = 14
  ctx.strokeRect(18, 18, width - 36, height - 36)

  ctx.fillStyle = '#d9b36a'
  ctx.font = 'bold 50px Georgia'
  ctx.fillText(title, 56, 90)

  ctx.fillStyle = '#f5efe4'
  ctx.font = '30px Georgia'

  const words = body.split(/\s+/)
  const lines = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word

    if (ctx.measureText(next).width > width - 110) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }

  if (line) {
    lines.push(line)
  }

  lines.slice(0, 14).forEach((content, index) => {
    ctx.fillText(content, 56, 170 + index * 42)
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createFrame({ width, height, texture }) {
  const group = new THREE.Group()
  const frameMaterial = new THREE.MeshLambertMaterial({ color: TRIM_COLOR })
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture }),
  )
  group.add(art)

  const border = 0.12
  const horizontalGeometry = new THREE.BoxGeometry(width + border * 2, border, border)
  const verticalGeometry = new THREE.BoxGeometry(border, height + border * 2, border)

  const top = new THREE.Mesh(horizontalGeometry, frameMaterial)
  const bottom = new THREE.Mesh(horizontalGeometry, frameMaterial)
  const left = new THREE.Mesh(verticalGeometry, frameMaterial)
  const right = new THREE.Mesh(verticalGeometry, frameMaterial)

  top.position.y = height / 2 + border / 2
  bottom.position.y = -height / 2 - border / 2
  left.position.x = -width / 2 - border / 2
  right.position.x = width / 2 + border / 2

  group.add(top, bottom, left, right)
  return group
}

function placeOnNorthWall(mesh, col, row, offset = 0.1, y = 1.55) {
  const cell = getCellWorldPosition(col, row)
  mesh.position.set(cell.x, y, cell.z - CELL_SIZE / 2 + offset)
}

function placeOnSouthWall(mesh, col, row, offset = 0.1, y = 1.55) {
  const cell = getCellWorldPosition(col, row)
  mesh.position.set(cell.x, y, cell.z + CELL_SIZE / 2 - offset)
  mesh.rotation.y = Math.PI
}

function placeOnWestWall(mesh, col, row, offset = 0.1, y = 1.55) {
  const cell = getCellWorldPosition(col, row)
  mesh.position.set(cell.x - CELL_SIZE / 2 + offset, y, cell.z)
  mesh.rotation.y = Math.PI / 2
}

function placeOnEastWall(mesh, col, row, offset = 0.1, y = 1.55) {
  const cell = getCellWorldPosition(col, row)
  mesh.position.set(cell.x + CELL_SIZE / 2 - offset, y, cell.z)
  mesh.rotation.y = -Math.PI / 2
}

async function loadTexture(path) {
  const loader = new THREE.TextureLoader()

  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        resolve(texture)
      },
      undefined,
      reject,
    )
  })
}

function createRoomLabel(content) {
  const texture = makeCanvasTexture(content.title, content.description, 0x8de7ee, 1024, 512)
  const label = createFrame({ width: 4, height: 2, texture })
  placeOnNorthWall(label, 5, ROOM1_REGION.top, 0.12, 1.75)
  return label
}

function createTextExhibits(content) {
  const group = new THREE.Group()
  const sections = content.textSections.slice(0, 4)
  const placements = [
    { fn: placeOnWestWall, col: ROOM1_REGION.left, row: ROOM1_REGION.top + 1, width: 2.2, height: 1.6 },
    { fn: placeOnEastWall, col: ROOM1_REGION.left + ROOM1_REGION.width - 1, row: ROOM1_REGION.top + 1, width: 2.2, height: 1.6 },
    { fn: placeOnSouthWall, col: ROOM1_REGION.left + 1, row: ROOM1_REGION.top + ROOM1_REGION.height - 1, width: 1.7, height: 1.3 },
    { fn: placeOnSouthWall, col: ROOM1_REGION.left + ROOM1_REGION.width - 2, row: ROOM1_REGION.top + ROOM1_REGION.height - 1, width: 1.7, height: 1.3 },
  ]

  sections.forEach((section, index) => {
    const placement = placements[index]

    if (!placement) {
      return
    }

    const texture = makeCanvasTexture(section.title, section.body, 0x8de7ee)
    const exhibit = createFrame({ width: placement.width, height: placement.height, texture })
    placement.fn(exhibit, placement.col, placement.row)
    group.add(exhibit)
  })

  return group
}

async function createImageExhibit(content) {
  if (!content.image?.path) {
    return null
  }

  const texture = await loadTexture(content.image.path)
  const image = createFrame({ width: 2.8, height: 1.9, texture })
  placeOnNorthWall(image, 7, ROOM1_REGION.top, 0.12, 1.55)
  return image
}

function createAudioPlaque(content) {
  if (!content.audio?.path) {
    return null
  }

  const plaqueTexture = makeCanvasTexture(
    'Audio de sala',
    'Activa el reproductor inferior al entrar en la habitacion 1 para escuchar la pieza sonora vinculada a esta sala.',
    0xf0a9d7,
    900,
    640,
  )
  const plaque = createFrame({ width: 1.8, height: 1.35, texture: plaqueTexture })
  placeOnNorthWall(plaque, 3, ROOM1_REGION.top, 0.12, 1.55)
  return plaque
}

export async function buildRoom1Exhibit(content) {
  const group = new THREE.Group()
  group.add(createRoomLabel(content))
  group.add(createTextExhibits(content))

  const image = await createImageExhibit(content)

  if (image) {
    group.add(image)
  }

  const audioPlaque = createAudioPlaque(content)

  if (audioPlaque) {
    group.add(audioPlaque)
  }

  return group
}

export function getRoom1Bounds() {
  return {
    top: ROOM1_REGION.top,
    bottom: ROOM1_REGION.top + ROOM1_REGION.height - 1,
    left: ROOM1_REGION.left,
    right: ROOM1_REGION.left + ROOM1_REGION.width - 1,
    ceiling: WALL_HEIGHT,
  }
}
