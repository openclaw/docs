---
read_when:
    - Modificar la canalización de medios o los adjuntos
summary: Reglas de manejo de imágenes y medios para envío, Gateway y respuestas del agente
title: Compatibilidad con imágenes y medios
x-i18n:
    generated_at: "2026-04-24T05:36:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26fa460f7dcdac9f15c9d79c3c3370adbce526da5cfa9a6825a8ed20b41e0a29
    source_path: nodes/images.md
    workflow: 15
---

# Compatibilidad con imágenes y medios (2025-12-05)

El canal de WhatsApp se ejecuta mediante **Baileys Web**. Este documento recoge las reglas actuales de manejo de medios para envío, Gateway y respuestas del agente.

## Objetivos

- Enviar medios con subtítulos opcionales mediante `openclaw message send --media`.
- Permitir que las respuestas automáticas desde la bandeja web incluyan medios junto con texto.
- Mantener límites por tipo razonables y predecibles.

## Superficie de la CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` es opcional; el subtítulo puede estar vacío para envíos solo de medios.
  - `--dry-run` imprime la carga útil resuelta; `--json` emite `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamiento del canal web de WhatsApp

- Entrada: ruta de archivo local **o** URL HTTP(S).
- Flujo: cargar en un Buffer, detectar el tipo de medio y construir la carga correcta:
  - **Imágenes:** redimensionar y recomprimir a JPEG (lado máximo 2048 px) apuntando a `channels.whatsapp.mediaMaxMb` (predeterminado: 50 MB).
  - **Audio/voz/video:** paso directo hasta 16 MB; el audio se envía como nota de voz (`ptt: true`).
  - **Documentos:** cualquier otra cosa, hasta 100 MB, conservando el nombre del archivo cuando esté disponible.
- Reproducción estilo GIF en WhatsApp: envía un MP4 con `gifPlayback: true` (CLI: `--gif-playback`) para que los clientes móviles lo reproduzcan en bucle en línea.
- La detección de MIME prefiere magic bytes, luego encabezados y después la extensión del archivo.
- El subtítulo proviene de `--message` o `reply.text`; se permite un subtítulo vacío.
- Registro: el modo no detallado muestra `↩️`/`✅`; el modo detallado incluye tamaño y ruta/URL de origen.

## Canalización de respuesta automática

- `getReplyFromConfig` devuelve `{ text?, mediaUrl?, mediaUrls? }`.
- Cuando hay medios presentes, el emisor web resuelve rutas locales o URL usando la misma canalización que `openclaw message send`.
- Si se proporcionan varias entradas de medios, se envían secuencialmente.

## Medios entrantes a comandos (Pi)

- Cuando los mensajes web entrantes incluyen medios, OpenClaw los descarga a un archivo temporal y expone variables de plantilla:
  - `{{MediaUrl}}` pseudo-URL para el medio entrante.
  - `{{MediaPath}}` ruta temporal local escrita antes de ejecutar el comando.
- Cuando está habilitado un sandbox Docker por sesión, el medio entrante se copia al espacio de trabajo del sandbox y `MediaPath`/`MediaUrl` se reescriben a una ruta relativa como `media/inbound/<filename>`.
- La comprensión de medios (si está configurada mediante `tools.media.*` o `tools.media.models` compartido) se ejecuta antes del templating y puede insertar bloques `[Image]`, `[Audio]` y `[Video]` en `Body`.
  - El audio establece `{{Transcript}}` y usa la transcripción para el análisis de comandos, de modo que los comandos slash sigan funcionando.
  - Las descripciones de video e imagen conservan cualquier texto de subtítulo para el análisis de comandos.
  - Si el modelo principal de imágenes activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y en su lugar pasa la imagen original al modelo.
- De forma predeterminada, solo se procesa el primer adjunto coincidente de imagen/audio/video; establece `tools.media.<cap>.attachments` para procesar varios adjuntos.

## Límites y errores

**Límites de envío saliente (envío web de WhatsApp)**

- Imágenes: hasta `channels.whatsapp.mediaMaxMb` (predeterminado: 50 MB) después de la recompresión.
- Audio/voz/video: límite de 16 MB; documentos: 100 MB.
- Medios demasiado grandes o ilegibles → error claro en los registros y la respuesta se omite.

**Límites de comprensión de medios (transcripción/descripción)**

- Imagen predeterminada: 10 MB (`tools.media.image.maxBytes`).
- Audio predeterminado: 20 MB (`tools.media.audio.maxBytes`).
- Video predeterminado: 50 MB (`tools.media.video.maxBytes`).
- Los medios demasiado grandes omiten la comprensión, pero las respuestas siguen adelante con el cuerpo original.

## Notas para pruebas

- Cubre flujos de envío + respuesta para casos de imagen/audio/documento.
- Valida la recompresión de imágenes (límite de tamaño) y la flag de nota de voz para audio.
- Asegúrate de que las respuestas con varios medios se distribuyan como envíos secuenciales.

## Relacionado

- [Captura de cámara](/es/nodes/camera)
- [Comprensión de medios](/es/nodes/media-understanding)
- [Audio y notas de voz](/es/nodes/audio)
