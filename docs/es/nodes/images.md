---
read_when:
    - Modificación de la canalización multimedia o de los archivos adjuntos
summary: Reglas de gestión de imágenes y contenido multimedia para envíos, el Gateway y las respuestas del agente
title: Compatibilidad con imágenes y contenido multimedia
x-i18n:
    generated_at: "2026-07-11T23:14:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

El canal de WhatsApp se ejecuta en Baileys Web. Esta página describe las reglas de gestión de contenido multimedia para los envíos, el Gateway y las respuestas del agente.

## Objetivos

- Enviar contenido multimedia con una leyenda opcional mediante `openclaw message send --media`.
- Permitir que las respuestas automáticas del buzón web incluyan contenido multimedia junto con texto.
- Mantener límites razonables y predecibles para cada tipo.

## Interfaz de la CLI

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — adjunta contenido multimedia (imagen/audio/vídeo/documento); acepta rutas locales o URL. Es opcional; la leyenda puede estar vacía para envíos que solo contengan contenido multimedia.
- `--gif-playback` — trata el contenido de vídeo como una reproducción GIF (solo WhatsApp).
- `--force-document` — envía el contenido multimedia como documento para evitar la compresión del canal (Telegram, WhatsApp); se aplica a imágenes, GIF y vídeos.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — opciones de entrega e hilos compartidas con los envíos que solo contienen texto.
- `--dry-run` — imprime la carga útil resuelta y omite el envío.
- `--json` — imprime el resultado como JSON: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` contiene el resultado de envío específico del canal, incluida cualquier referencia al contenido multimedia).

## Comportamiento del canal de WhatsApp Web

- Entrada: ruta de archivo local **o** URL HTTP(S).
- Flujo: carga el contenido en un búfer, detecta el tipo de contenido multimedia y, a continuación, crea la carga útil de salida según el tipo:
  - **Imágenes:** se optimizan para ajustarse al límite de `channels.whatsapp.mediaMaxMb` (50 MB de forma predeterminada). Las imágenes opacas se recomprimen como JPEG (la secuencia predeterminada de dimensiones comienza en 2048 px y desciende cuando se supera repetidamente el tamaño); las imágenes con transparencia se conservan como PNG. Si el origen ya es un archivo JPEG/PNG/WebP aceptable dentro de los límites de tamaño y longitud de lado, los bytes originales se conservan sin cambios en lugar de recomprimirse. Los GIF animados nunca se recodifican; solo se comprueba su tamaño.
  - **Audio/voz:** salvo que ya sea audio de voz nativo (`.ogg`/`.opus` o `audio/ogg`/`audio/opus`), el audio de salida se transcodifica mediante `ffmpeg` a Opus/OGG (48 kHz mono, 64 kbps y un máximo de 20 minutos) antes de enviarse como nota de voz (`ptt: true`).
  - **Vídeo:** se transmite sin cambios hasta 16 MB.
  - **Documentos:** cualquier otro contenido, hasta 100 MB, conservando el nombre del archivo cuando esté disponible.
- Reproducción al estilo GIF de WhatsApp: envía un MP4 con `gifPlayback: true` (CLI: `--gif-playback`) para que los clientes móviles lo reproduzcan en bucle e integrado en la conversación.
- La detección MIME prioriza los bytes mágicos detectados, después la extensión del archivo y, por último, los encabezados de respuesta; un contenedor genérico detectado (`application/octet-stream`, `zip`) nunca prevalece sobre una asignación de extensión más específica (por ejemplo, XLSX frente a ZIP).
- La leyenda procede de `--message` o `reply.text`; se permite una leyenda vacía.
- Registro: el modo no detallado muestra `↩️`/`✅`; el modo detallado incluye el tamaño y la ruta o URL de origen.

<Note>
Las cifras anteriores de 16 MB para audio/vídeo y 100 MB para documentos son los valores predeterminados compartidos por tipo de contenido multimedia que se usan cuando no se proporciona un límite de bytes explícito. Los envíos de WhatsApp establecen un límite explícito mediante `channels.whatsapp.mediaMaxMb` (50 MB de forma predeterminada), que se aplica uniformemente a todos los tipos para esa cuenta.
</Note>

## Canalización de respuestas automáticas

- `getReplyFromConfig` devuelve una carga útil de respuesta (o una matriz de cargas útiles) con `text?`, `mediaUrl?` y `mediaUrls?`, entre otros campos.
- Cuando hay contenido multimedia, el remitente web resuelve las rutas locales o URL mediante la misma canalización que `openclaw message send`.
- Si se proporcionan varias entradas de contenido multimedia, se envían secuencialmente.

## Contenido multimedia entrante para comandos

- Cuando los mensajes web entrantes incluyen contenido multimedia, OpenClaw lo descarga en un archivo temporal y expone variables de plantilla:
  - `{{MediaUrl}}` — pseudo-URL del contenido multimedia entrante.
  - `{{MediaPath}}` — ruta temporal local escrita antes de ejecutar el comando.
- Cuando se habilita un entorno aislado de Docker por sesión, el contenido multimedia entrante se copia en el espacio de trabajo del entorno aislado y `MediaPath`/`MediaUrl` se reescriben como una ruta relativa al entorno aislado, como `media/inbound/<filename>`.
- La interpretación del contenido multimedia (configurada mediante `tools.media.*` o el valor compartido `tools.media.models`) se ejecuta antes de aplicar las plantillas y puede insertar bloques `[Image]`, `[Audio]` y `[Video]` en `Body`.
  - El audio establece `{{Transcript}}` y utiliza la transcripción para analizar los comandos, de modo que los comandos con barra diagonal sigan funcionando.
  - Las descripciones de vídeo e imagen conservan cualquier texto de la leyenda para analizar los comandos.
  - Si el modelo principal activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y, en su lugar, pasa la imagen original al modelo.
- De forma predeterminada, solo se procesa el primer archivo adjunto coincidente de imagen/audio/vídeo; establece `tools.media.<capability>.attachments` para procesar varios archivos adjuntos.

## Límites y errores

**Límites de envío saliente (envío web de WhatsApp)**

- Imágenes: hasta `channels.whatsapp.mediaMaxMb` (50 MB de forma predeterminada) después de la optimización.
- Audio/vídeo: límite de 16 MB (valor predeterminado compartido; se sustituye por `mediaMaxMb` cuando se envía mediante WhatsApp).
- Documentos: límite de 100 MB (valor predeterminado compartido; se sustituye por `mediaMaxMb` cuando se envía mediante WhatsApp).
- El contenido multimedia demasiado grande o ilegible genera un error claro en los registros y se omite la respuesta.

**Límites de interpretación del contenido multimedia (transcripción/descripción)**

- Valor predeterminado para imágenes: 10 MB (`tools.media.image.maxBytes`).
- Valor predeterminado para audio: 20 MB (`tools.media.audio.maxBytes`).
- Valor predeterminado para vídeo: 50 MB (`tools.media.video.maxBytes`).
- Si el contenido multimedia es demasiado grande, se omite su interpretación, pero la respuesta se envía igualmente con el cuerpo original.

## Notas para las pruebas

- Cubrir los flujos de envío y respuesta para los casos de imagen, audio y documento.
- Validar los límites de tamaño después de optimizar las imágenes y la marca de nota de voz para el audio.
- Asegurarse de que las respuestas con varios elementos multimedia se distribuyan como envíos secuenciales.

## Relacionado

- [Captura con la cámara](/es/nodes/camera)
- [Interpretación del contenido multimedia](/es/nodes/media-understanding)
- [Audio y notas de voz](/es/nodes/audio)
