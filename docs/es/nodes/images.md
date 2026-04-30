---
read_when:
    - Modificar la canalización de medios o los archivos adjuntos
summary: Reglas de manejo de imágenes y medios para send, Gateway y las respuestas del agente
title: Compatibilidad con imágenes y contenido multimedia
x-i18n:
    generated_at: "2026-04-30T05:49:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb07bc638a755be5597e78c07041a52cfc0297b00d70c5adbfe5f3ad8c1a372
    source_path: nodes/images.md
    workflow: 16
---

# Compatibilidad con imágenes y medios (2025-12-05)

El canal de WhatsApp se ejecuta mediante **Baileys Web**. Este documento recoge las reglas actuales de manejo de medios para envíos, Gateway y respuestas del agente.

## Objetivos

- Enviar medios con subtítulos opcionales mediante `openclaw message send --media`.
- Permitir que las respuestas automáticas desde la bandeja web incluyan medios junto con texto.
- Mantener límites por tipo razonables y predecibles.

## Superficie de CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` es opcional; el subtítulo puede estar vacío para envíos solo de medios.
  - `--dry-run` imprime la carga útil resuelta; `--json` emite `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamiento del canal de WhatsApp Web

- Entrada: ruta de archivo local **o** URL HTTP(S).
- Flujo: cargar en un Buffer, detectar el tipo de medio y crear la carga útil correcta:
  - **Imágenes:** redimensionar y recomprimir a JPEG (lado máximo de 2048 px) apuntando a `channels.whatsapp.mediaMaxMb` (predeterminado: 50 MB).
  - **Audio/Voz/Video:** paso directo hasta 16 MB; el audio se envía como nota de voz (`ptt: true`).
  - **Documentos:** cualquier otra cosa, hasta 100 MB, conservando el nombre de archivo cuando esté disponible.
- Reproducción estilo GIF de WhatsApp: enviar un MP4 con `gifPlayback: true` (CLI: `--gif-playback`) para que los clientes móviles lo reproduzcan en bucle integrado.
- La detección MIME prefiere bytes mágicos, luego encabezados y luego la extensión de archivo.
- El subtítulo proviene de `--message` o `reply.text`; se permite un subtítulo vacío.
- Registro: el modo no detallado muestra `↩️`/`✅`; el modo detallado incluye tamaño y ruta/URL de origen.

## Canalización de respuestas automáticas

- `getReplyFromConfig` devuelve `{ text?, mediaUrl?, mediaUrls? }`.
- Cuando hay medios presentes, el remitente web resuelve rutas locales o URL usando la misma canalización que `openclaw message send`.
- Si se proporcionan varias entradas de medios, se envían secuencialmente.

## Medios entrantes hacia comandos (Pi)

- Cuando los mensajes web entrantes incluyen medios, OpenClaw los descarga a un archivo temporal y expone variables de plantillas:
  - `{{MediaUrl}}` pseudo-URL para el medio entrante.
  - `{{MediaPath}}` ruta temporal local escrita antes de ejecutar el comando.
- Cuando está habilitado un entorno aislado Docker por sesión, los medios entrantes se copian al espacio de trabajo del entorno aislado y `MediaPath`/`MediaUrl` se reescriben a una ruta relativa como `media/inbound/<filename>`.
- La comprensión de medios (si está configurada mediante `tools.media.*` o `tools.media.models` compartidos) se ejecuta antes de las plantillas y puede insertar bloques `[Image]`, `[Audio]` y `[Video]` en `Body`.
  - El audio establece `{{Transcript}}` y usa la transcripción para el análisis de comandos, de modo que los comandos con barra sigan funcionando.
  - Las descripciones de video e imagen conservan cualquier texto de subtítulo para el análisis de comandos.
  - Si el modelo primario de imagen activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y pasa la imagen original al modelo en su lugar.
- De forma predeterminada solo se procesa el primer adjunto de imagen/audio/video coincidente; establece `tools.media.<cap>.attachments` para procesar varios adjuntos.

## Límites y errores

**Topes de envío saliente (envío web de WhatsApp)**

- Imágenes: hasta `channels.whatsapp.mediaMaxMb` (predeterminado: 50 MB) después de la recomresión.
- Audio/voz/video: tope de 16 MB; documentos: tope de 100 MB.
- Medios demasiado grandes o ilegibles → error claro en los registros y la respuesta se omite.

**Topes de comprensión de medios (transcripción/descripción)**

- Imagen predeterminada: 10 MB (`tools.media.image.maxBytes`).
- Audio predeterminado: 20 MB (`tools.media.audio.maxBytes`).
- Video predeterminado: 50 MB (`tools.media.video.maxBytes`).
- Los medios demasiado grandes omiten la comprensión, pero las respuestas siguen enviándose con el cuerpo original.

## Notas para pruebas

- Cubrir flujos de envío y respuesta para casos de imagen/audio/documento.
- Validar la recomresión de imágenes (límite de tamaño) y la marca de nota de voz para audio.
- Asegurar que las respuestas con varios medios se distribuyan como envíos secuenciales.

## Relacionado

- [Captura de cámara](/es/nodes/camera)
- [Comprensión de medios](/es/nodes/media-understanding)
- [Audio y notas de voz](/es/nodes/audio)
