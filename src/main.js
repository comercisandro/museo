import './style.css'
import * as THREE from 'three'
import {
  BACKGROUND_COLOR,
  CAMERA_HEIGHT,
  FOG_FAR,
  FOG_NEAR,
  FOV,
} from './constants.js'
import { getRoom1Content } from './content.js'
import { RetroController } from './controller.js'
import { buildRoom1Exhibit } from './exhibits.js'
import { buildMaze, getAreaInfo, getCellWorldPosition, getSpawnState, isWalkable } from './maze.js'

const DIRECTION_LABELS = ['Norte', 'Este', 'Sur', 'Oeste']

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="viewport">
    <div class="hud">
      <p class="hud-label">Museo surrealista multiagente</p>
      <h1 class="hud-title">Hall Principal</h1>
      <p class="hud-subtitle">Ingreso</p>
      <p class="hud-copy">Explora el corredor central y las 7 salas tematicas del museo.</p>
      <p class="hud-direction">Mirando hacia: Norte</p>
      <div class="hud-controls">
        <span>W/S: avanzar</span>
        <span>A/D: girar</span>
      </div>
    </div>
    <div class="audio-dock is-hidden">
      <p class="audio-dock-label">Audio de la sala 1</p>
      <audio class="room-audio" controls preload="metadata"></audio>
    </div>
  </div>
`

const viewport = document.querySelector('.viewport')
const hudTitle = document.querySelector('.hud-title')
const hudSubtitle = document.querySelector('.hud-subtitle')
const hudCopy = document.querySelector('.hud-copy')
const hudDirection = document.querySelector('.hud-direction')
const audioDock = document.querySelector('.audio-dock')
const roomAudio = document.querySelector('.room-audio')

const scene = new THREE.Scene()
scene.background = new THREE.Color(BACKGROUND_COLOR)
scene.fog = new THREE.Fog(BACKGROUND_COLOR, FOG_NEAR, FOG_FAR)

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

const spawn = getSpawnState()
const startPosition = getCellWorldPosition(spawn.col, spawn.row)
camera.position.set(startPosition.x, CAMERA_HEIGHT, startPosition.z)
camera.rotation.order = 'YXZ'
camera.rotation.y = -spawn.direction * (Math.PI / 2)

let room1Content = null
let room1AudioAutoplayFailed = false

async function ensureRoom1Content() {
  if (room1Content) {
    return room1Content
  }

  room1Content = await getRoom1Content()

  if (room1Content.audio?.path) {
    roomAudio.src = room1Content.audio.path
  }

  return room1Content
}

async function mountRoom1Exhibit() {
  const content = await ensureRoom1Content()
  const exhibit = await buildRoom1Exhibit(content)
  scene.add(exhibit)
}

mountRoom1Exhibit()

async function updateHud(state) {
  const area = getAreaInfo(state.row, state.col)
  hudTitle.textContent = area.title
  hudSubtitle.textContent = area.label
  hudCopy.textContent = area.description
  hudDirection.textContent = `Mirando hacia: ${DIRECTION_LABELS[state.direction]}`

  if (area.id === 'room1') {
    await ensureRoom1Content()
    audioDock.classList.remove('is-hidden')

    if (roomAudio.src && roomAudio.paused) {
      roomAudio.play().catch(() => {
        room1AudioAutoplayFailed = true
      })
    }
  } else {
    roomAudio.pause()
    roomAudio.currentTime = 0
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

function animate() {
  requestAnimationFrame(animate)
  controller.update(clock.getDelta())
  renderer.render(scene, camera)
}

animate()
