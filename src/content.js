const roomContentCache = new Map()

function resolveAssetPath(path) {
  if (!path) {
    return path
  }

  const normalized = path.startsWith('/') ? path.slice(1) : path
  return new URL(normalized, window.location.href).toString()
}

async function loadText(path) {
  const response = await fetch(resolveAssetPath(path))

  if (!response.ok) {
    throw new Error(`No se pudo cargar el texto: ${path}`)
  }

  return response.text()
}

async function loadTextSections(sections = []) {
  const loadedSections = await Promise.all(
    sections.map(async (section) => ({
      title: section.title,
      body: await loadText(section.path),
    })),
  )

  return loadedSections.filter((section) => section.body.trim())
}

async function loadRoomContent(roomNumber) {
  const manifestPath = resolveAssetPath(`data/habitacion-${roomNumber}/manifest.json`)
  const response = await fetch(manifestPath)

  if (!response.ok) {
    throw new Error(`No se pudo cargar manifest.json de la habitacion ${roomNumber}`)
  }

  const manifest = await response.json()
  const textSections = manifest.texts?.length
    ? await loadTextSections(manifest.texts)
    : manifest.text?.path
      ? [
          {
            title: manifest.text.title || 'Texto',
            body: await loadText(manifest.text.path),
          },
        ]
      : []

  return {
    id: `room${roomNumber}`,
    title: manifest.title || `Habitacion ${roomNumber}`,
    description: manifest.description || '',
    textSections,
    image: manifest.image
      ? {
          ...manifest.image,
          path: resolveAssetPath(manifest.image.path),
        }
      : null,
    audio: manifest.audio
      ? {
          ...manifest.audio,
          path: resolveAssetPath(manifest.audio.path),
        }
      : null,
    video: manifest.video
      ? {
          ...manifest.video,
          path: resolveAssetPath(manifest.video.path),
        }
      : null,
    images: Array.isArray(manifest.images)
      ? manifest.images.map((image) => ({
          ...image,
          path: resolveAssetPath(image.path),
        }))
      : [],
  }
}

export function getRoomContent(roomNumber) {
  if (!roomContentCache.has(roomNumber)) {
    roomContentCache.set(
      roomNumber,
      loadRoomContent(roomNumber).catch((error) => ({
        id: `room${roomNumber}`,
        title: `Habitacion ${roomNumber}`,
        description: 'No se pudieron cargar los recursos multimedia de la sala.',
        textSections: [{ title: 'Error', body: error.message }],
        image: null,
        audio: null,
        video: null,
        images: [],
      })),
    )
  }

  return roomContentCache.get(roomNumber)
}
