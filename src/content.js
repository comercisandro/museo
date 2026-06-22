const ROOM1_MANIFEST_PATH = '/data/habitacion-1/manifest.json'

let room1ContentPromise

async function loadText(path) {
  const response = await fetch(path)

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

export function getRoom1Content() {
  if (!room1ContentPromise) {
    room1ContentPromise = fetch(ROOM1_MANIFEST_PATH)
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudo cargar manifest.json de la habitacion 1')
        }

        return response.json()
      })
      .then(async (manifest) => {
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
          title: manifest.title || 'Habitacion 1',
          description: manifest.description || '',
          textSections,
          image: manifest.image || null,
          audio: manifest.audio || null,
          video: manifest.video || null,
        }
      })
      .catch((error) => ({
        title: 'Habitacion 1',
        description: 'No se pudieron cargar los recursos multimedia de la sala.',
        textSections: [{ title: 'Error', body: error.message }],
        image: null,
        audio: null,
        video: null,
      }))
  }

  return room1ContentPromise
}
