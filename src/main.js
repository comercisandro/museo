import './style.css'
import * as THREE from 'three'
import {
  BACKGROUND_COLOR,
  CAMERA_HEIGHT,
  FOG_FAR,
  FOG_NEAR,
  FOV,
} from './constants.js'
import { RetroController } from './controller.js'
import { buildMaze, getCellWorldPosition, getSpawnState, isWalkable } from './maze.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="viewport">
    <div class="hud">
      <h1>Laberinto Retro</h1>
      <p>W/S o flechas: avanzar y retroceder</p>
      <p>A/D o flechas: girar 90 grados</p>
    </div>
  </div>
`

const viewport = document.querySelector('.viewport')

const scene = new THREE.Scene()
scene.background = new THREE.Color(BACKGROUND_COLOR)
scene.fog = new THREE.Fog(BACKGROUND_COLOR, FOG_NEAR, FOG_FAR)

const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 100)

const renderer = new THREE.WebGLRenderer({ antialias: false })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.setSize(window.innerWidth, window.innerHeight)
viewport.appendChild(renderer.domElement)

scene.add(new THREE.AmbientLight(0xc8d0d8, 1.8))

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
directionalLight.position.set(6, 9, 2)
scene.add(directionalLight)

scene.add(buildMaze())

const spawn = getSpawnState()
const startPosition = getCellWorldPosition(spawn.col, spawn.row)
camera.position.set(startPosition.x, CAMERA_HEIGHT, startPosition.z)
camera.rotation.order = 'YXZ'
camera.rotation.y = -spawn.direction * (Math.PI / 2)

const controller = new RetroController({ camera, isWalkable, state: spawn })

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
