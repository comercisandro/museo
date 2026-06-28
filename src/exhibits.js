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
      primaryImage: { wall: 'north', colOffset: 1, size: { width: 1.95, height: 1.35 }, y: 1.5 },
      secondaryImage: null,
      video: null,
      texts: [
        { wall: 'west', rowOffset: 1, size: { width: 1.55, height: 1.12 }, y: 1.36 },
        { wall: 'south', colOffset: 0, size: { width: 1.18, height: 0.88 }, y: 1.32 },
      ],
      relief: {
        wall: 'north',
        colOffset: 0,
        size: { width: 2.2, height: 0.55, depth: 0.08 },
        y: 2.15,
        variant: 'algorithmic-grid',
      },
    },
    room2: {
      primaryImage: { wall: 'north', colOffset: 1, size: { width: 1.68, height: 1.12 }, y: 1.46 },
      secondaryImage: null,
      video: { wall: 'east', rowOffset: 1, size: { width: 1.82, height: 1.28 }, y: 1.5 },
      texts: [
        { wall: 'south', colOffset: 2, size: { width: 1.18, height: 0.88 }, y: 1.32 },
      ],
      relief: {
        wall: 'south',
        colOffset: 0,
        size: { width: 2.2, height: 0.55, depth: 0.08 },
        y: 2.15,
        variant: 'pedagogic-modules',
      },
    },
    room3: {
      primaryImage: { wall: 'south', colOffset: 1, size: { width: 1.95, height: 1.35 }, y: 1.5 },
      secondaryImage: { wall: 'west', rowOffset: 1, size: { width: 1.55, height: 1.12 }, y: 1.46 },
      video: null,
      texts: [
        { wall: 'north', colOffset: 0, size: { width: 1.18, height: 0.88 }, y: 1.32 },
      ],
      relief: {
        wall: 'north',
        colOffset: 0,
        size: { width: 2.2, height: 0.55, depth: 0.08 },
        y: 2.15,
        variant: 'learning-map',
      },
    },
    room4: {
      primaryImage: { wall: 'south', colOffset: 1, size: { width: 1.95, height: 1.35 }, y: 1.5 },
      secondaryImage: { wall: 'north', colOffset: 2, size: { width: 1.18, height: 0.88 }, y: 1.32 },
      video: { wall: 'east', rowOffset: 1, size: { width: 1.82, height: 1.28 }, y: 1.5 },
      texts: [
        { wall: 'north', colOffset: 0, size: { width: 1.18, height: 0.88 }, y: 1.32 },
      ],
      relief: {
        wall: 'south',
        colOffset: 0,
        size: { width: 2.2, height: 0.55, depth: 0.08 },
        y: 2.15,
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
