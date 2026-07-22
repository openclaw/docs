---
read_when:
    - Modificación del pipeline de contenidos multimedia o de los archivos adjuntos
summary: Reglas de gestión de imágenes y contenido multimedia para envíos, el Gateway y las respuestas del agente
title: Compatibilidad con imágenes y contenido multimedia
x-i18n:
    generated_at: "2026-07-22T10:40:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aae23eb4afb408b168d169703c931303fbc2de17909166e73b23ef194aa22617
    source_path: nodes/images.md
    workflow: 16
---

El canal de WhatsApp funciona con Baileys Web. Esta página abarca las reglas de gestión de contenido multimedia para los envíos, el Gateway y las respuestas del agente.

## Objetivos

- Enviar contenido multimedia con un pie de foto opcional mediante `openclaw message send --media`.
- Permitir que las respuestas automáticas de la bandeja de entrada web incluyan contenido multimedia junto con texto.
- Mantener límites razonables y predecibles para cada tipo.

## Interfaz de la CLI

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — adjunta contenido multimedia (imagen/audio/vídeo/documento); acepta rutas locales o URL. Es opcional; el pie de foto puede estar vacío para envíos que solo contengan contenido multimedia.
- `--gif-playback` — trata el contenido de vídeo como una reproducción GIF (solo WhatsApp).
- `--force-document` — envía el contenido multimedia como documento para evitar la compresión del canal (Telegram, WhatsApp); se aplica a imágenes, GIF y vídeos.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — opciones de entrega e hilos compartidas con los envíos que solo contienen texto.
- `--dry-run` — muestra la carga útil resuelta y omite el envío.
- `--json` — muestra el resultado como JSON: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` contiene el resultado de envío específico del canal, incluida cualquier referencia al contenido multimedia).

## Comportamiento del canal web de WhatsApp

- Entrada: ruta de archivo local **o** URL HTTP(S).
- Flujo: se carga en un búfer, se detecta el tipo de contenido multimedia y, a continuación, se crea la carga útil saliente según el tipo:
  - **Imágenes:** se optimizan para mantenerse por debajo de `channels.whatsapp.mediaMaxMb` (valor predeterminado: 50MB). Las imágenes opacas se vuelven a comprimir como JPEG (la escala predeterminada de lados comienza en 2048px y desciende cuando se incumple repetidamente el límite de tamaño); las imágenes con transparencia se conservan como PNG. Si el origen ya es un JPEG/PNG/WebP aceptable dentro de los límites de tamaño y longitud de lado, los bytes originales se conservan sin cambios en lugar de volver a comprimirse. Los GIF animados nunca se vuelven a codificar; solo se comprueba su tamaño.
  - **Audio/voz:** a menos que ya sea audio de voz nativo (`.ogg`/`.opus` o `audio/ogg`/`audio/opus`), el audio saliente se transcodifica mediante `ffmpeg` a Opus/OGG (48kHz mono, 64kbps, con un máximo de 20 minutos) antes de enviarse como nota de voz (`ptt: true`).
  - **Vídeo:** se transmite sin cambios hasta 16MB.
  - **Documentos:** cualquier otro contenido, hasta 100MB, conservando el nombre de archivo cuando esté disponible.
- Reproducción al estilo GIF de WhatsApp: se envía un MP4 con `gifPlayback: true` (CLI: `--gif-playback`) para que los clientes móviles lo reproduzcan en bucle en línea.
- La detección de MIME da prioridad a los bytes mágicos identificados, después a la extensión del archivo y, por último, a los encabezados de respuesta; un contenedor genérico identificado (`application/octet-stream`, `zip`) nunca sustituye una asignación de extensión más específica (por ejemplo, XLSX frente a ZIP).
- El pie de foto procede de `--message` o `reply.text`; se permite que esté vacío.
- Registro: sin el modo detallado, muestra `↩️`/`✅`; con el modo detallado, incluye el tamaño y la ruta o URL de origen.

<Note>
Las cifras anteriores de 16MB para audio/vídeo y 100MB para documentos son los valores predeterminados compartidos por tipo de contenido multimedia que se utilizan cuando no se proporciona un límite explícito de bytes. Los envíos de WhatsApp establecen un límite explícito a partir de `channels.whatsapp.mediaMaxMb` (valor predeterminado: 50MB), que se aplica uniformemente a todos los tipos de esa cuenta.
</Note>

## Pipeline de respuesta automática

- `getReplyFromConfig` devuelve una carga útil de respuesta (o una matriz de cargas útiles) con `text?`, `mediaUrl?` y `mediaUrls?`, entre otros campos.
- Cuando hay contenido multimedia, el remitente web resuelve las rutas locales o las URL mediante el mismo pipeline que `openclaw message send`.
- Si se proporcionan varias entradas de contenido multimedia, se envían secuencialmente.

## Contenido multimedia entrante para comandos

- Cuando los mensajes web entrantes incluyen contenido multimedia, OpenClaw lo descarga en un archivo temporal y expone variables de plantilla:
  - `{{MediaUrl}}` — pseudo-URL del contenido multimedia entrante.
  - `{{MediaPath}}` — ruta temporal local escrita antes de ejecutar el comando.
- Cuando se habilita un entorno aislado de Docker por sesión, el contenido multimedia entrante se copia en el espacio de trabajo del entorno aislado y `MediaPath`/`MediaUrl` se reescriben con una ruta relativa al entorno aislado, como `media/inbound/<filename>`.
- La interpretación de contenido multimedia (configurada mediante `tools.media.*` o el `tools.media.models` compartido) se ejecuta antes de aplicar las plantillas y puede insertar bloques `[Image]`, `[Audio]` y `[Video]` en `Body`.
  - El audio establece `{{Transcript}}` y utiliza la transcripción para analizar los comandos, de modo que los comandos con barra sigan funcionando.
  - Las descripciones de vídeos e imágenes conservan el texto del pie de foto para el análisis de comandos.
  - Si el modelo principal activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y, en su lugar, pasa la imagen original al modelo.
- De forma predeterminada, solo se procesa el primer archivo adjunto coincidente de imagen/audio/vídeo; utilice `tools.media.<capability>.attachments` para seleccionar varios archivos adjuntos.

## Límites y errores

**Límites de envío saliente (envío web de WhatsApp)**

- Imágenes: hasta `channels.whatsapp.mediaMaxMb` (valor predeterminado: 50MB) después de la optimización.
- Audio/vídeo: límite de 16MB (valor predeterminado compartido; se sustituye por `mediaMaxMb` al enviar mediante WhatsApp).
- Documentos: límite de 100MB (valor predeterminado compartido; se sustituye por `mediaMaxMb` al enviar mediante WhatsApp).
- El contenido multimedia demasiado grande o ilegible genera un error claro en los registros y se omite la respuesta.

**Límites de interpretación de contenido multimedia (transcripción/descripción)**

- Valor predeterminado para imágenes: 10MB (se puede sustituir con `tools.media.image.maxBytes` o, por cada
  entrada `tools.media.models[]`, con `maxBytes`).
- Valor predeterminado para audio: 20MB (se puede sustituir con `tools.media.audio.maxBytes` o por cada entrada).
- Valor predeterminado para vídeo: 50MB (se puede sustituir con `tools.media.video.maxBytes` o por cada entrada).
- Si el contenido multimedia supera el límite, se omite su interpretación, pero la respuesta sigue procesándose con el cuerpo original.

## Notas para las pruebas

- Cubrir los flujos de envío y respuesta para los casos de imagen/audio/documento.
- Validar los límites de tamaño después de optimizar las imágenes y el indicador de nota de voz para el audio.
- Asegurarse de que las respuestas con varios elementos multimedia se distribuyan como envíos secuenciales.

## Contenido relacionado

- [Captura con cámara](/es/nodes/camera)
- [Interpretación de contenido multimedia](/es/nodes/media-understanding)
- [Audio y notas de voz](/es/nodes/audio)
