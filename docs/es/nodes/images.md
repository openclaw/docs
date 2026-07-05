---
read_when:
    - Modificar la canalización de medios o los archivos adjuntos
summary: Reglas de gestión de imágenes y medios para respuestas de envío, Gateway y agentes
title: Compatibilidad con imágenes y medios
x-i18n:
    generated_at: "2026-07-05T11:27:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

El canal de WhatsApp se ejecuta en Baileys Web. Esta página cubre las reglas de manejo de medios para envíos, Gateway y respuestas de agentes.

## Objetivos

- Enviar medios con un pie de foto opcional mediante `openclaw message send --media`.
- Permitir que las respuestas automáticas desde la bandeja de entrada web incluyan medios junto con texto.
- Mantener los límites por tipo sensatos y predecibles.

## Superficie de CLI

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — adjuntar medios (imagen/audio/video/documento); acepta rutas locales o URLs. Opcional; el pie de foto puede estar vacío para envíos solo con medios.
- `--gif-playback` — tratar los medios de video como reproducción GIF (solo WhatsApp).
- `--force-document` — enviar medios como documento para evitar la compresión del canal (Telegram, WhatsApp); se aplica a imágenes, GIFs y videos.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — opciones de entrega/conversación compartidas con envíos solo de texto.
- `--dry-run` — imprimir la carga útil resuelta y omitir el envío.
- `--json` — imprimir el resultado como JSON: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` lleva el resultado de envío específico del canal, incluida cualquier referencia de medios).

## Comportamiento del canal WhatsApp Web

- Entrada: ruta de archivo local **o** URL HTTP(S).
- Flujo: cargar en un búfer, detectar el tipo de medio y luego crear la carga útil saliente según el tipo:
  - **Imágenes:** optimizadas para ajustarse por debajo de `channels.whatsapp.mediaMaxMb` (predeterminado 50MB). Las imágenes opacas se recomprimen a JPEG (la escala lateral predeterminada empieza en 2048px y desciende tras fallos repetidos por tamaño); las imágenes con transparencia se mantienen como PNG. Si la fuente ya es un JPEG/PNG/WebP aceptable dentro del presupuesto de tamaño y longitud de lado, los bytes originales se conservan sin cambios en lugar de recomprimirse. Los GIFs animados nunca se recodifican, solo se comprueba su tamaño.
  - **Audio/voz:** salvo que ya sea audio de voz nativo (`.ogg`/`.opus`, o `audio/ogg`/`audio/opus`), el audio saliente se transcodifica mediante `ffmpeg` a Opus/OGG (48kHz mono, 64kbps, limitado a 20 minutos) antes de enviarlo como nota de voz (`ptt: true`).
  - **Video:** transferencia directa hasta 16MB.
  - **Documentos:** cualquier otra cosa, hasta 100MB, con el nombre de archivo conservado cuando esté disponible.
- Reproducción estilo GIF de WhatsApp: enviar un MP4 con `gifPlayback: true` (CLI: `--gif-playback`) para que los clientes móviles lo reproduzcan en bucle dentro de la conversación.
- La detección MIME prefiere los bytes mágicos detectados, luego la extensión del archivo y luego los encabezados de respuesta; un contenedor genérico detectado (`application/octet-stream`, `zip`) nunca reemplaza una asignación de extensión más específica (por ejemplo, XLSX frente a ZIP).
- El pie de foto proviene de `--message` o `reply.text`; se permite un pie de foto vacío.
- Registro: el modo no detallado muestra `↩️`/`✅`; el modo detallado incluye tamaño y ruta/URL de origen.

<Note>
Las cifras de 16MB para audio/video y 100MB para documentos anteriores son los valores predeterminados de medios compartidos por tipo que se usan cuando no se pasa un límite explícito de bytes. Los envíos de WhatsApp establecen un límite explícito desde `channels.whatsapp.mediaMaxMb` (predeterminado 50MB), que se aplica de manera uniforme a todos los tipos para esa cuenta.
</Note>

## Canalización de respuesta automática

- `getReplyFromConfig` devuelve una carga útil de respuesta (o un arreglo de cargas útiles) con `text?`, `mediaUrl?` y `mediaUrls?`, entre otros campos.
- Cuando hay medios presentes, el remitente web resuelve rutas locales o URLs usando la misma canalización que `openclaw message send`.
- Varias entradas de medios se envían secuencialmente si se proporcionan.

## Medios entrantes a comandos

- Cuando los mensajes web entrantes incluyen medios, OpenClaw los descarga a un archivo temporal y expone variables de plantillas:
  - `{{MediaUrl}}` — seudo-URL para los medios entrantes.
  - `{{MediaPath}}` — ruta temporal local escrita antes de ejecutar el comando.
- Cuando está habilitado un sandbox Docker por sesión, los medios entrantes se copian en el espacio de trabajo del sandbox y `MediaPath`/`MediaUrl` se reescriben a una ruta relativa al sandbox como `media/inbound/<filename>`.
- La comprensión de medios (configurada mediante `tools.media.*` o `tools.media.models` compartido) se ejecuta antes de las plantillas y puede insertar bloques `[Image]`, `[Audio]` y `[Video]` en `Body`.
  - El audio establece `{{Transcript}}` y usa la transcripción para el análisis de comandos, de modo que los comandos con barra sigan funcionando.
  - Las descripciones de video e imagen conservan cualquier texto de pie de foto para el análisis de comandos.
  - Si el modelo primario activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y pasa la imagen original al modelo en su lugar.
- De forma predeterminada, solo se procesa el primer adjunto de imagen/audio/video coincidente; establece `tools.media.<capability>.attachments` para procesar varios adjuntos.

## Límites y errores

**Límites de envío saliente (envío web de WhatsApp)**

- Imágenes: hasta `channels.whatsapp.mediaMaxMb` (predeterminado 50MB) después de la optimización.
- Audio/video: límite de 16MB (valor predeterminado compartido; reemplazado por `mediaMaxMb` al enviar a través de WhatsApp).
- Documentos: límite de 100MB (valor predeterminado compartido; reemplazado por `mediaMaxMb` al enviar a través de WhatsApp).
- Los medios demasiado grandes o ilegibles producen un error claro en los registros y se omite la respuesta.

**Límites de comprensión de medios (transcripción/descripción)**

- Valor predeterminado de imagen: 10MB (`tools.media.image.maxBytes`).
- Valor predeterminado de audio: 20MB (`tools.media.audio.maxBytes`).
- Valor predeterminado de video: 50MB (`tools.media.video.maxBytes`).
- Los medios demasiado grandes omiten la comprensión, pero la respuesta aun así continúa con el cuerpo original.

## Notas para pruebas

- Cubrir los flujos de envío y respuesta para casos de imagen/audio/documento.
- Validar los límites de tamaño después de la optimización de imagen y la marca de nota de voz para audio.
- Asegurar que las respuestas con múltiples medios se desplieguen como envíos secuenciales.

## Relacionado

- [Captura de cámara](/es/nodes/camera)
- [Comprensión de medios](/es/nodes/media-understanding)
- [Audio y notas de voz](/es/nodes/audio)
