---
read_when:
    - Modificar la canalización de medios o los archivos adjuntos
summary: Reglas de manejo de imágenes y medios para el envío, Gateway y las respuestas de agentes
title: Compatibilidad con imágenes y medios
x-i18n:
    generated_at: "2026-05-06T17:58:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 069140a3ad3bade166d4576ead604b4675006a01e546672872379ce83291471c
    source_path: nodes/images.md
    workflow: 16
---

El canal de WhatsApp se ejecuta mediante **Baileys Web**. Este documento recoge las reglas actuales de manejo de medios para envíos, Gateway y respuestas de agentes.

## Objetivos

- Enviar medios con subtítulos opcionales mediante `openclaw message send --media`.
- Permitir que las respuestas automáticas desde la bandeja de entrada web incluyan medios junto con texto.
- Mantener límites por tipo sensatos y predecibles.

## Superficie de la CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` es opcional; el subtítulo puede estar vacío para envíos solo con medios.
  - `--dry-run` imprime la carga útil resuelta; `--json` emite `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamiento del canal de WhatsApp Web

- Entrada: ruta de archivo local **o** URL HTTP(S).
- Flujo: cargar en un Buffer, detectar el tipo de medio y construir la carga útil correcta:
  - **Imágenes:** redimensionar y recomprimir a JPEG (lado máximo de 2048 px) apuntando a `channels.whatsapp.mediaMaxMb` (predeterminado: 50 MB).
  - **Audio/Voz/Video:** paso directo hasta 16 MB; el audio se envía como nota de voz (`ptt: true`).
  - **Documentos:** cualquier otra cosa, hasta 100 MB, conservando el nombre de archivo cuando esté disponible.
- Reproducción estilo GIF de WhatsApp: enviar un MP4 con `gifPlayback: true` (CLI: `--gif-playback`) para que los clientes móviles lo reproduzcan en bucle en línea.
- La detección MIME prefiere bytes mágicos, luego encabezados y luego la extensión del archivo.
- El subtítulo proviene de `--message` o `reply.text`; se permite un subtítulo vacío.
- Registro: el modo no detallado muestra `↩️`/`✅`; el modo detallado incluye tamaño y ruta/URL de origen.

## Pipeline de respuesta automática

- `getReplyFromConfig` devuelve `{ text?, mediaUrl?, mediaUrls? }`.
- Cuando hay medios presentes, el remitente web resuelve rutas locales o URL usando el mismo pipeline que `openclaw message send`.
- Si se proporcionan varias entradas de medios, se envían secuencialmente.

## Medios entrantes para comandos (Pi)

- Cuando los mensajes web entrantes incluyen medios, OpenClaw los descarga a un archivo temporal y expone variables de plantillas:
  - `{{MediaUrl}}` pseudo-URL para el medio entrante.
  - `{{MediaPath}}` ruta temporal local escrita antes de ejecutar el comando.
- Cuando se habilita un sandbox Docker por sesión, los medios entrantes se copian en el espacio de trabajo del sandbox y `MediaPath`/`MediaUrl` se reescriben a una ruta relativa como `media/inbound/<filename>`.
- La comprensión de medios (si está configurada mediante `tools.media.*` o `tools.media.models` compartidos) se ejecuta antes de las plantillas y puede insertar bloques `[Image]`, `[Audio]` y `[Video]` en `Body`.
  - El audio establece `{{Transcript}}` y usa la transcripción para el análisis de comandos, de modo que los comandos con barra diagonal sigan funcionando.
  - Las descripciones de video e imagen conservan cualquier texto de subtítulo para el análisis de comandos.
  - Si el modelo principal de imagen activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y pasa la imagen original al modelo en su lugar.
- De forma predeterminada, solo se procesa el primer adjunto coincidente de imagen/audio/video; establece `tools.media.<cap>.attachments` para procesar varios adjuntos.

## Límites y errores

**Límites de envío saliente (envío web de WhatsApp)**

- Imágenes: hasta `channels.whatsapp.mediaMaxMb` (predeterminado: 50 MB) después de la recompressión.
- Audio/voz/video: límite de 16 MB; documentos: límite de 100 MB.
- Medio demasiado grande o ilegible → error claro en los registros y se omite la respuesta.

**Límites de comprensión de medios (transcripción/descripción)**

- Imagen predeterminada: 10 MB (`tools.media.image.maxBytes`).
- Audio predeterminado: 20 MB (`tools.media.audio.maxBytes`).
- Video predeterminado: 50 MB (`tools.media.video.maxBytes`).
- Los medios demasiado grandes omiten la comprensión, pero las respuestas siguen enviándose con el cuerpo original.

## Notas para las pruebas

- Cubrir los flujos de envío y respuesta para casos de imagen/audio/documento.
- Validar la recompressión de imágenes (límite de tamaño) y el indicador de nota de voz para audio.
- Asegurarse de que las respuestas con varios medios se desplieguen como envíos secuenciales.

## Relacionado

- [Captura de cámara](/es/nodes/camera)
- [Comprensión de medios](/es/nodes/media-understanding)
- [Audio y notas de voz](/es/nodes/audio)
