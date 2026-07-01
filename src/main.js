import './style.css'
import * as THREE from 'three'
import {
  BACKGROUND_COLOR,
  CAMERA_HEIGHT,
  FOG_FAR,
  FOG_NEAR,
  FOV,
} from './constants.js'
import { getRoomContent } from './content.js'
import { RetroController } from './controller.js'
import {
  buildCorridorNorthLinkExhibit,
  buildCorridorNorthInfoExhibits,
  buildCorridorSouthInfoExhibits,
  buildCorridorSouthLinkExhibit,
  buildRoom1Exhibit,
  buildRoom2Exhibit,
  buildRoom3Exhibit,
  buildRoom4Exhibit,
} from './exhibits.js'
import { buildMaze, getAreaInfo, getCellWorldPosition, getSpawnState, isWalkable } from './maze.js'

const DIRECTION_LABELS = ['Norte', 'Este', 'Sur', 'Oeste']

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="viewport">
    <div class="hud">
      <p class="hud-label">Museo surrealista multiagente</p>
      <h1 class="hud-title">Corredor Central</h1>
      <p class="hud-subtitle">Circulacion libre</p>
      <p class="hud-copy">Apareces en el centro de un museo compacto con cuatro salas y dos capsulas de aprendizaje conectadas.</p>
      <p class="hud-direction">Mirando hacia: Norte</p>
      <div class="hud-controls">
        <span>W/S: avanzar</span>
        <span>A/D: girar</span>
      </div>
    </div>
    <div class="corridor-video-dock is-hidden">
      <p class="corridor-video-label">Video del pasillo central</p>
      <video class="corridor-video" controls preload="metadata" playsinline loop>
        <source src="./data/salida/videos/Presentacion.mp4" type="video/mp4" />
      </video>
      <p class="corridor-video-hint is-hidden">Haz clic en el video para activar la reproduccion si el navegador bloquea el audio automatico.</p>
    </div>
    <div class="audio-dock is-hidden">
      <p class="audio-dock-label">Audio de la sala</p>
      <audio class="room-audio" controls preload="metadata"></audio>
    </div>
  </div>
`

const viewport = document.querySelector('.viewport')
const hudTitle = document.querySelector('.hud-title')
const hudSubtitle = document.querySelector('.hud-subtitle')
const hudCopy = document.querySelector('.hud-copy')
const hudDirection = document.querySelector('.hud-direction')
const corridorVideoDock = document.querySelector('.corridor-video-dock')
const corridorVideo = document.querySelector('.corridor-video')
const corridorVideoHint = document.querySelector('.corridor-video-hint')
const audioDock = document.querySelector('.audio-dock')
const audioDockLabel = document.querySelector('.audio-dock-label')
const roomAudio = document.querySelector('.room-audio')

const scene = new THREE.Scene()
scene.background = new THREE.Color(BACKGROUND_COLOR)
scene.fog = new THREE.Fog(BACKGROUND_COLOR, FOG_NEAR, FOG_FAR)

const CENTRAL_CORRIDOR_CELLS = new Set([
  '3,4',
  '3,5',
  '3,6',
  '4,5',
  '5,4',
  '5,5',
  '5,6',
])

const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 100)

const renderer = new THREE.WebGLRenderer({ antialias: false })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.setSize(window.innerWidth, window.innerHeight)
viewport.appendChild(renderer.domElement)

scene.add(new THREE.AmbientLight(0xa48a75, 1.1))

const directionalLight = new THREE.DirectionalLight(0xffe5b8, 1.6)
directionalLight.position.set(4, 10, -3)
scene.add(directionalLight)

scene.add(buildMaze())

const interactiveExhibits = []

scene.add(buildCorridorNorthInfoExhibits())
scene.add(buildCorridorSouthInfoExhibits())

buildCorridorNorthLinkExhibit().then((exhibit) => {
  scene.add(exhibit)
  interactiveExhibits.push(exhibit)
})

buildCorridorSouthLinkExhibit().then((exhibit) => {
  scene.add(exhibit)
  interactiveExhibits.push(exhibit)
})

const spawn = getSpawnState()
const startPosition = getCellWorldPosition(spawn.col, spawn.row)
camera.position.set(startPosition.x, CAMERA_HEIGHT, startPosition.z)
camera.rotation.order = 'YXZ'
camera.rotation.y = -spawn.direction * (Math.PI / 2)

const roomContents = new Map()
let currentAreaId = null
let currentAudioRoomNumber = null

async function playCorridorVideo() {
  try {
    await corridorVideo.play()
    corridorVideoHint.classList.add('is-hidden')
  } catch {
    corridorVideoHint.classList.remove('is-hidden')
  }
}

function stopCorridorVideo() {
  corridorVideo.pause()
  corridorVideo.currentTime = 0
  corridorVideoHint.classList.add('is-hidden')
}

function isCentralCorridorCell(row, col) {
  return CENTRAL_CORRIDOR_CELLS.has(`${row},${col}`)
}

async function ensureRoomContent(roomNumber) {
  if (roomContents.has(roomNumber)) {
    return roomContents.get(roomNumber)
  }

  const content = await getRoomContent(roomNumber)

  roomContents.set(roomNumber, content)
  return content
}

async function mountRoomExhibits() {
  try {
    const room1Content = await ensureRoomContent(1)
    scene.add(await buildRoom1Exhibit(room1Content))
  } catch {
    // Keep the museum navigable even if an exhibit asset fails.
  }

  try {
    const room2Content = await ensureRoomContent(2)
    scene.add(await buildRoom2Exhibit(room2Content))
  } catch {
    // Keep the museum navigable even if an exhibit asset fails.
  }

  try {
    const room3Content = await ensureRoomContent(3)
    scene.add(await buildRoom3Exhibit(room3Content))
  } catch {
    // Keep the museum navigable even if an exhibit asset fails.
  }

  try {
    const room4Content = await ensureRoomContent(4)
    scene.add(await buildRoom4Exhibit(room4Content))
  } catch {
    // Keep the museum navigable even if an exhibit asset fails.
  }
}

mountRoomExhibits()

async function updateHud(state) {
  const area = getAreaInfo(state.row, state.col)
  hudTitle.textContent = area.title
  hudSubtitle.textContent = area.label
  hudCopy.textContent = area.description
  hudDirection.textContent = `Mirando hacia: ${DIRECTION_LABELS[state.direction]}`

  const previousAreaId = currentAreaId
  currentAreaId = area.id

  if (area.id === 'corridor' && isCentralCorridorCell(state.row, state.col)) {
    corridorVideoDock.classList.remove('is-hidden')

    if (previousAreaId !== 'corridor' || corridorVideo.paused) {
      playCorridorVideo()
    }
  } else {
    corridorVideoDock.classList.add('is-hidden')

    if (!corridorVideo.paused || corridorVideo.currentTime > 0) {
      stopCorridorVideo()
    }
  }

  if (['room1', 'room2', 'room3', 'room4'].includes(area.id)) {
    const roomNumber = Number(area.id.replace('room', ''))
    const content = await ensureRoomContent(roomNumber)
    audioDockLabel.textContent = `Audio de la sala ${roomNumber}`
    const audioSource = content.audio?.path || content.video?.path || null

    if (audioSource) {
      const currentSrc = roomAudio.getAttribute('src')

      if (currentAudioRoomNumber !== roomNumber || currentSrc !== audioSource) {
        roomAudio.src = audioSource
        roomAudio.load()
        currentAudioRoomNumber = roomNumber
      }
    } else {
      roomAudio.removeAttribute('src')
      roomAudio.load()
      currentAudioRoomNumber = null
    }

    audioDock.classList.remove('is-hidden')

    if (audioSource && (previousAreaId !== area.id || roomAudio.paused)) {
      roomAudio.play().catch(() => {})
    }
  } else {
    if (currentAudioRoomNumber !== null) {
      roomAudio.pause()
      roomAudio.currentTime = 0
      currentAudioRoomNumber = null
    }

    audioDock.classList.add('is-hidden')
  }
}

const controller = new RetroController({
  camera,
  isWalkable,
  onStateChange: updateHud,
  state: spawn,
})

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('resize', handleResize)

const clock = new THREE.Clock()
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

function getInteractiveTarget(event) {
  if (!interactiveExhibits.length) {
    return null
  }

  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(interactiveExhibits, true)

  return hits.find((hit) => hit.object.userData.url) || null
}

function handlePointerMove(event) {
  renderer.domElement.style.cursor = getInteractiveTarget(event) ? 'pointer' : 'default'
}

function handleCanvasClick(event) {
  const target = getInteractiveTarget(event)

  if (!target) {
    return
  }

  window.open(target.object.userData.url, '_blank', 'noopener,noreferrer')
}

renderer.domElement.addEventListener('pointermove', handlePointerMove)
renderer.domElement.addEventListener('click', handleCanvasClick)
corridorVideo.addEventListener('click', () => {
  if (corridorVideo.paused) {
    playCorridorVideo()
  }
})

function animate() {
  requestAnimationFrame(animate)
  controller.update(clock.getDelta())
  renderer.render(scene, camera)
}

animate()
