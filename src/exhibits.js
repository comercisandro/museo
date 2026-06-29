import * as THREE from 'three'
import { CELL_SIZE, TRIM_COLOR } from './constants.js'
import { getCellWorldPosition } from './maze.js'

const ROOM_REGIONS = {
  room1: { top: 1, left: 1, height: 3, width: 3, accent: 0x8de7ee },
  room2: { top: 1, left: 7, height: 3, width: 3, accent: 0xf0a9d7 },
  room3: { top: 5, left: 1, height: 3, width: 3, accent: 0xb5d46b },
  room4: { top: 5, left: 7, height: 3, width: 3, accent: 0xaab6ff },
}


function getWallSlots(roomId) {
  const slots = {
    room1: {
      primaryImage: { wall: 'north', colOffset: 1, size: { width: 2.55, height: 1.7 }, y: 1.56 },
      secondaryImage: null,
      video: null,
      texts: [
        { wall: 'west', rowOffset: 1, size: { width: 1.55, height: 1.12 }, y: 1.38 },
        { wall: 'south', colOffset: 0, size: { width: 1.35, height: 1.0 }, y: 1.34 },
      ],
      relief: {
        wall: 'north',
        colOffset: 0,
        size: { width: 1.35, height: 0.36, depth: 0.08 },
        y: 2.18,
        variant: 'algorithmic-grid',
      },
    },
    room2: {
      primaryImage: { wall: 'north', colOffset: 1, size: { width: 2.55, height: 1.7 }, y: 1.56 },
      secondaryImage: null,
      video: { wall: 'east', rowOffset: 1, size: { width: 1.82, height: 1.28 }, y: 1.5 },
      texts: [
        { wall: 'west', rowOffset: 0, size: { width: 1.32, height: 0.98 }, y: 1.34 },
        { wall: 'south', colOffset: 0, size: { width: 1.35, height: 1.0 }, y: 1.34 },
        { wall: 'south', colOffset: 2, size: { width: 1.35, height: 1.0 }, y: 1.34 },
      ],
      relief: {
        wall: 'east',
        rowOffset: 0,
        size: { width: 1.25, height: 0.36, depth: 0.08 },
        y: 2.18,
        variant: 'pedagogic-modules',
      },
    },
    room3: {
      primaryImage: { wall: 'south', colOffset: 1, size: { width: 2.5, height: 1.7 }, y: 1.54 },
      secondaryImage: { wall: 'north', colOffset: 2, size: { width: 1.45, height: 1.05 }, y: 1.38 },
      video: null,
      texts: [
        { wall: 'west', rowOffset: 0, size: { width: 1.35, height: 0.98 }, y: 1.34 },
        { wall: 'west', rowOffset: 2, size: { width: 1.35, height: 0.98 }, y: 1.34 },
      ],
      relief: {
        wall: 'east',
        rowOffset: 0,
        size: { width: 1.2, height: 0.34, depth: 0.08 },
        y: 2.16,
        variant: 'learning-map',
      },
    },
    room4: {
      primaryImage: { wall: 'south', colOffset: 1, size: { width: 2.4, height: 1.62 }, y: 1.54 },
      secondaryImage: null,
      video: { wall: 'east', rowOffset: 1, size: { width: 1.82, height: 1.28 }, y: 1.5 },
      texts: [
        { wall: 'north', colOffset: 0, size: { width: 1.32, height: 0.98 }, y: 1.34 },
        { wall: 'north', colOffset: 2, size: { width: 1.32, height: 0.98 }, y: 1.34 },
      ],
      relief: {
        wall: 'east',
        rowOffset: 0,
        size: { width: 1.2, height: 0.34, depth: 0.08 },
        y: 2.16,
        variant: 'open-ecology',
      },
    },
  }

  return slots[roomId]
}

function getRoomTypography(roomId) {
  const typography = {
    room1: {
      heading: "bold 52px Georgia",
      body: "31px Georgia",
    },
    room2: {
      heading: "700 50px 'Trebuchet MS'",
      body: "30px 'Trebuchet MS'",
    },
    room3: {
      heading: "bold 52px 'Palatino Linotype'",
      body: "30px 'Palatino Linotype'",
    },
    room4: {
      heading: "700 50px 'Gill Sans', 'Segoe UI', sans-serif",
      body: "30px 'Gill Sans', 'Segoe UI', sans-serif",
    },
  }

  return typography[roomId] || typography.room1
}

function makeCanvasTexture(title, body, accent, typography, width = 1024, height = 768) {
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
  ctx.font = typography.heading
  ctx.fillText(title, 50, 88)

  ctx.fillStyle = '#f5efe4'
  ctx.font = typography.body

  const words = body.split(/\s+/)
  const lines = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > width - 100) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }

  if (line) lines.push(line)

  lines.slice(0, 14).forEach((content, index) => {
    ctx.fillText(content, 50, 160 + index * 38)
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeLinkCanvasTexture(title, url, accent, width = 1024, height = 768) {
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
  ctx.font = "700 58px 'Gill Sans', 'Segoe UI', sans-serif"
  ctx.fillText(title, 56, 96)

  ctx.fillStyle = '#f5efe4'
  ctx.font = "32px 'Gill Sans', 'Segoe UI', sans-serif"
  ctx.fillText('Recurso web sugerido:', 56, 178)

  ctx.fillStyle = `#${new THREE.Color(accent).getHexString()}`
  ctx.font = "bold 36px 'Courier New', monospace"

  const words = url.split(/\s+/)
  const lines = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > width - 112) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }

  if (line) lines.push(line)

  lines.forEach((content, index) => {
    ctx.fillText(content, 56, 260 + index * 48)
  })

  ctx.fillStyle = '#f5efe4'
  ctx.font = "28px 'Gill Sans', 'Segoe UI', sans-serif"
  ctx.fillText('Disponible en la zona de salida del recorrido.', 56, height - 72)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeCorridorInfoTexture(title, body, accent, width = 900, height = 760) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#171018'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = `#${new THREE.Color(accent).getHexString()}`
  ctx.lineWidth = 12
  ctx.strokeRect(18, 18, width - 36, height - 36)

  ctx.fillStyle = '#d9b36a'
  ctx.font = "700 48px 'Gill Sans', 'Segoe UI', sans-serif"
  ctx.fillText(title, 48, 92)

  ctx.fillStyle = '#f5efe4'
  ctx.font = "29px 'Gill Sans', 'Segoe UI', sans-serif"

  const words = body.split(/\s+/)
  const lines = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > width - 96) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }

  if (line) lines.push(line)

  lines.slice(0, 11).forEach((content, index) => {
    ctx.fillText(content, 48, 170 + index * 42)
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createFrame({ width, height, texture }) {
  const group = new THREE.Group()
  const frameMaterial = new THREE.MeshLambertMaterial({ color: TRIM_COLOR })
  const art = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture }))
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

function markInteractive(root, url) {
  root.userData.url = url
  root.traverse((child) => {
    child.userData.url = url
  })
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

function placeOnWall(mesh, region, slot) {
  if (!slot) return

  if (slot.wall === 'north') {
    placeOnNorthWall(mesh, region.left + (slot.colOffset ?? 1), region.top, 0.12, slot.y)
  } else if (slot.wall === 'south') {
    placeOnSouthWall(mesh, region.left + (slot.colOffset ?? 1), region.top + region.height - 1, 0.12, slot.y)
  } else if (slot.wall === 'west') {
    placeOnWestWall(mesh, region.left, region.top + (slot.rowOffset ?? 1), 0.12, slot.y)
  } else if (slot.wall === 'east') {
    placeOnEastWall(mesh, region.left + region.width - 1, region.top + (slot.rowOffset ?? 1), 0.12, slot.y)
  }
}

async function loadTexture(path) {
  const loader = new THREE.TextureLoader()
  return new Promise((resolve, reject) => {
    loader.load(path, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      resolve(texture)
    }, undefined, reject)
  })
}

function createFallbackTexture(title, accent) {
  return makeCanvasTexture(title, 'Recurso no disponible o en preparacion.', accent, getRoomTypography('room1'), 900, 640)
}

function createVideoTexture(path) {
  const video = document.createElement('video')
  video.src = path
  video.crossOrigin = 'anonymous'
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.preload = 'metadata'
  video.autoplay = true
  const texture = new THREE.VideoTexture(video)
  texture.colorSpace = THREE.SRGBColorSpace
  video.play().catch(() => {})
  return texture
}

function createReliefPanel(roomId, region, slot) {
  const relief = new THREE.Group()
  const accent = ROOM_REGIONS[roomId].accent
  const baseMaterial = new THREE.MeshLambertMaterial({ color: accent })
  const shadowMaterial = new THREE.MeshLambertMaterial({ color: new THREE.Color(accent).lerp(new THREE.Color(0x000000), 0.35) })

  if (slot.variant === 'algorithmic-grid') {
    ;[-0.55, 0, 0.55].forEach((xOffset, index) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28 + index * 0.04, slot.size.depth), baseMaterial)
      bar.position.set(xOffset, 0, 0)
      relief.add(bar)
    })
    ;[-0.45, 0.45].forEach((xOffset) => {
      const node = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, slot.size.depth, 10), shadowMaterial)
      node.rotation.x = Math.PI / 2
      node.position.set(xOffset, 0.18, 0)
      relief.add(node)
    })
  } else if (slot.variant === 'pedagogic-modules') {
    ;[-0.6, 0, 0.6].forEach((xOffset, index) => {
      const module = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18 + index * 0.07, slot.size.depth), baseMaterial)
      module.position.set(xOffset, -0.06 + index * 0.05, 0)
      relief.add(module)
    })
  } else if (slot.variant === 'learning-map') {
    const points = [
      [-0.65, -0.08],
      [-0.1, 0.18],
      [0.45, -0.02],
    ]
    points.forEach(([x, y]) => {
      const node = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, slot.size.depth, 10), baseMaterial)
      node.rotation.x = Math.PI / 2
      node.position.set(x, y, 0)
      relief.add(node)
    })
    const line = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.05, slot.size.depth), shadowMaterial)
    line.position.set(-0.05, 0.02, 0)
    line.rotation.z = -0.18
    relief.add(line)
  } else if (slot.variant === 'open-ecology') {
    ;[-0.55, 0, 0.55].forEach((xOffset, index) => {
      const wave = new THREE.Mesh(new THREE.SphereGeometry(0.16 + index * 0.03, 12, 10), baseMaterial)
      wave.scale.set(1.2, 0.45, 0.3)
      wave.position.set(xOffset, 0.03 * (index - 1), 0)
      relief.add(wave)
    })
    const connector = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, slot.size.depth), shadowMaterial)
    connector.position.set(0, 0, 0)
    relief.add(connector)
  }

  placeOnWall(relief, region, slot)
  return relief
}

function createTextExhibits(content, region, slots) {
  const group = new THREE.Group()
  const sections = content.textSections.slice(0, slots.texts.length)
  const typography = getRoomTypography(content.id)

  sections.forEach((section, index) => {
    const slot = slots.texts[index]
    if (!slot) return
    const texture = makeCanvasTexture(section.title, section.body, region.accent, typography)
    const exhibit = createFrame({ width: slot.size.width, height: slot.size.height, texture })
    placeOnWall(exhibit, region, slot)
    group.add(exhibit)
  })

  return group
}

async function createImageExhibit(content, region, slots) {
  const group = new THREE.Group()
  const sources = []
  const typography = getRoomTypography(content.id)
  if (content.image?.path) sources.push({ slot: slots.primaryImage, path: content.image.path, title: 'Imagen' })
  if (content.images?.length && slots.secondaryImage) sources.push({ slot: slots.secondaryImage, path: content.images[0].path, title: 'Imagen secundaria' })
  if (!sources.length) return null

  for (const source of sources) {
    let texture
    try {
      texture = await loadTexture(source.path)
    } catch {
      texture = makeCanvasTexture(source.title, 'Recurso no disponible o en preparacion.', region.accent, typography, 900, 640)
    }
    const frame = createFrame({ width: source.slot.size.width, height: source.slot.size.height, texture })
    placeOnWall(frame, region, source.slot)
    group.add(frame)
  }

  return group
}

function createVideoExhibit(content, region, slots) {
  if (!content.video?.path || !slots.video) return null
  const texture = createVideoTexture(content.video.path)
  const frame = createFrame({ width: slots.video.size.width, height: slots.video.size.height, texture })
  placeOnWall(frame, region, slots.video)
  return frame
}

async function buildRoomExhibit(content, roomId) {
  const region = ROOM_REGIONS[roomId]
  const slots = getWallSlots(roomId)
  const group = new THREE.Group()

  group.add(createReliefPanel(roomId, region, slots.relief))

  const images = await createImageExhibit(content, region, slots)
  if (images) group.add(images)

  const video = createVideoExhibit(content, region, slots)
  if (video) group.add(video)

  group.add(createTextExhibits(content, region, slots))

  return group
}

export function buildRoom1Exhibit(content) {
  return buildRoomExhibit(content, 'room1')
}

export function buildRoom2Exhibit(content) {
  return buildRoomExhibit(content, 'room2')
}

export function buildRoom3Exhibit(content) {
  return buildRoomExhibit(content, 'room3')
}

export function buildRoom4Exhibit(content) {
  return buildRoomExhibit(content, 'room4')
}

export async function buildCorridorNorthLinkExhibit() {
  const url = 'https://capsula-de-aprendizaje.free.nf/'
  let texture

  try {
    texture = await loadTexture(new URL('data/salida/imagenes/capsula%201.png', window.location.href).toString())
  } catch {
    texture = makeLinkCanvasTexture('Capsula de aprendizaje', url, 0x7b5031, 1280, 840)
  }

  const frame = createFrame({ width: 2.7, height: 1.78, texture })
  placeOnNorthWall(frame, 5, 1, 0.12, 1.56)
  markInteractive(frame, url)
  return frame
}

export async function buildCorridorSouthLinkExhibit() {
  const url = 'https://docs.google.com/presentation/d/1oSXM_9z2S2yyi5KRNtGhktzd8EWdX4Ih/edit?usp=sharing&ouid=109710567010921936577&rtpof=true&sd=true'
  let texture

  try {
    texture = await loadTexture(new URL('data/salida/imagenes/capsula%202.png', window.location.href).toString())
  } catch {
    texture = makeLinkCanvasTexture(
      'Capsula de aprendizaje 2',
      'Presentacion interactiva sobre la reconfiguracion del aprendizaje.',
      0x7b5031,
      1280,
      840,
    )
  }

  const frame = createFrame({ width: 2.7, height: 1.78, texture })
  placeOnSouthWall(frame, 5, 7, 0.12, 1.56)
  markInteractive(frame, url)
  return frame
}

export function buildCorridorNorthInfoExhibits() {
  const group = new THREE.Group()

  const rizomaTexture = makeCorridorInfoTexture(
    'Rizoma',
    'El rizoma propone pensar el aprendizaje como una red abierta de conexiones multiples, sin un centro unico ni un recorrido obligatorio. En lugar de avanzar en linea recta, se aprende enlazando ideas, recursos, personas y experiencias desde distintos puntos de entrada.',
    0x7b5031,
  )
  const rizomaFrame = createFrame({ width: 1.55, height: 1.3, texture: rizomaTexture })
  placeOnWestWall(rizomaFrame, 5, 2, 0.12, 1.46)
  group.add(rizomaFrame)

  const capsulaTexture = makeCorridorInfoTexture(
    'Capsula',
    'Esta pieza forma parte de una capsula de aprendizaje: un recurso breve que organiza texto, imagen, audio, video e interaccion alrededor de una idea central. Funciona como una entrada flexible para explorar el tema y seguir nuevas conexiones.',
    0x7b5031,
  )
  const capsulaFrame = createFrame({ width: 1.55, height: 1.3, texture: capsulaTexture })
  placeOnEastWall(capsulaFrame, 5, 2, 0.12, 1.46)
  group.add(capsulaFrame)

  return group
}

export function buildCorridorSouthInfoExhibits() {
  const group = new THREE.Group()

  const rizomaTexture = makeCorridorInfoTexture(
    'Rizoma',
    'Como rizoma, esta capsula no impone un recorrido unico. Permite entrar por distintas capas del tema, conectar materiales y construir una lectura propia a partir de enlaces, medios y preguntas abiertas.',
    0x7b5031,
  )
  const rizomaFrame = createFrame({ width: 1.55, height: 1.3, texture: rizomaTexture })
  placeOnWestWall(rizomaFrame, 5, 6, 0.12, 1.46)
  group.add(rizomaFrame)

  const capsulaTexture = makeCorridorInfoTexture(
    'Capsula',
    'Esta capsula organiza una experiencia breve de exploracion con imagen, presentacion y recorrido conceptual. Funciona como una entrada puntual al tema y como un nodo que puede abrir nuevas trayectorias dentro del museo.',
    0x7b5031,
  )
  const capsulaFrame = createFrame({ width: 1.55, height: 1.3, texture: capsulaTexture })
  placeOnEastWall(capsulaFrame, 5, 6, 0.12, 1.46)
  group.add(capsulaFrame)

  return group
}
