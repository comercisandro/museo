## Estructura de contenidos del museo

Guarda aqui los archivos que quieras mostrar dentro de cada sala.

Ruta base recomendada:

`public/data/`

Vite publica todo lo que este en `public/` como archivos estaticos.
Por eso, si colocas por ejemplo un archivo en:

`public/data/habitacion-1/imagenes/cuadro-1.jpg`

Luego podras accederlo desde la web como:

`/data/habitacion-1/imagenes/cuadro-1.jpg`

Estructura sugerida:

- `hall/`
- `habitacion-1/` a `habitacion-7/`
- `salida/`

Dentro de cada una:

- `audio/`
- `imagenes/`
- `videos/`
- `texto/`

Puedes guardar por ejemplo:

- audios `.mp3`, `.wav`
- imagenes `.jpg`, `.png`, `.webp`
- videos `.mp4`, `.webm`
- textos `.txt`, `.md`, `.json`
