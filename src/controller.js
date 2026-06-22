import * as THREE from 'three'
import { CAMERA_HEIGHT, MOVE_DURATION, TURN_DURATION } from './constants.js'
import { getCellWorldPosition } from './maze.js'

const DIRECTION_VECTORS = [
  { row: -1, col: 0 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
]

function directionToYaw(direction) {
  return -direction * (Math.PI / 2)
}

function ease(t) {
  return t * t * (3 - 2 * t)
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

export class RetroController {
  constructor({ camera, isWalkable, state }) {
    this.camera = camera
    this.isWalkable = isWalkable
    this.row = state.row
    this.col = state.col
    this.direction = state.direction
    this.action = null

    window.addEventListener('keydown', (event) => this.onKeyDown(event))
  }

  onKeyDown(event) {
    const key = event.key.toLowerCase()

    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      event.preventDefault()
    }

    if (this.action) {
      return
    }

    if (key === 'arrowup' || key === 'w') {
      this.startMove(1)
      return
    }

    if (key === 'arrowdown' || key === 's') {
      this.startMove(-1)
      return
    }

    if (key === 'arrowleft' || key === 'a') {
      this.startTurn(-1)
      return
    }

    if (key === 'arrowright' || key === 'd') {
      this.startTurn(1)
    }
  }

  startMove(step) {
    const directionIndex = step === 1 ? this.direction : (this.direction + 2) % 4
    const delta = DIRECTION_VECTORS[directionIndex]
    const nextRow = this.row + delta.row
    const nextCol = this.col + delta.col

    if (!this.isWalkable(nextRow, nextCol)) {
      return
    }

    const start = getCellWorldPosition(this.col, this.row)
    const end = getCellWorldPosition(nextCol, nextRow)

    this.action = {
      type: 'move',
      elapsed: 0,
      duration: MOVE_DURATION,
      startRow: this.row,
      startCol: this.col,
      endRow: nextRow,
      endCol: nextCol,
      startPosition: start,
      endPosition: end,
    }
  }

  startTurn(turnStep) {
    const nextDirection = (this.direction + turnStep + 4) % 4
    const startYaw = directionToYaw(this.direction)
    const endYaw = directionToYaw(nextDirection)

    this.action = {
      type: 'turn',
      elapsed: 0,
      duration: TURN_DURATION,
      startDirection: this.direction,
      endDirection: nextDirection,
      startYaw,
      deltaYaw: normalizeAngle(endYaw - startYaw),
    }
  }

  update(deltaSeconds) {
    if (!this.action) {
      this.applyState()
      return
    }

    this.action.elapsed = Math.min(this.action.elapsed + deltaSeconds, this.action.duration)
    const t = ease(this.action.elapsed / this.action.duration)

    if (this.action.type === 'move') {
      this.camera.position.x = THREE.MathUtils.lerp(this.action.startPosition.x, this.action.endPosition.x, t)
      this.camera.position.y = CAMERA_HEIGHT
      this.camera.position.z = THREE.MathUtils.lerp(this.action.startPosition.z, this.action.endPosition.z, t)
      this.camera.rotation.y = directionToYaw(this.direction)
    } else {
      const currentPosition = getCellWorldPosition(this.col, this.row)
      this.camera.position.set(currentPosition.x, CAMERA_HEIGHT, currentPosition.z)
      this.camera.rotation.y = this.action.startYaw + this.action.deltaYaw * t
    }

    if (this.action.elapsed >= this.action.duration) {
      if (this.action.type === 'move') {
        this.row = this.action.endRow
        this.col = this.action.endCol
      } else {
        this.direction = this.action.endDirection
      }

      this.action = null
      this.applyState()
    }
  }

  applyState() {
    const position = getCellWorldPosition(this.col, this.row)
    this.camera.position.set(position.x, CAMERA_HEIGHT, position.z)
    this.camera.rotation.x = 0
    this.camera.rotation.z = 0
    this.camera.rotation.y = directionToYaw(this.direction)
  }
}
