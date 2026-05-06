---
read_when:
    - Modificar la canalización multimedia o los archivos adjuntos
summary: Reglas de manejo de imágenes y contenido multimedia para send, Gateway y las respuestas del agente
title: Soporte para imágenes y contenido multimedia
x-i18n:
    generated_at: "2026-05-06T05:40:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: a38224fdf42f32fe206ad8cf3fcc3b06a078b1978d447adeb671fdb3ff4e4b32
    source_path: nodes/images.md
    workflow: 16
---

# Compatibilidad con imágenes y medios (2025-12-05)

El canal de WhatsApp se ejecuta mediante **Baileys Web**. Este documento recoge las reglas actuales de manejo de medios para envíos, Gateway y respuestas del agente.

## Objetivos

- Enviar medios con leyendas opcionales mediante `openclaw message send --media`.
- Permitir que las respuestas automáticas desde la bandeja de entrada web incluyan medios junto con texto.
- Mantener límites por tipo sensatos y predecibles.

## Superficie de la CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` es opcional; la leyenda puede estar vacía para envíos solo con medios.
  - `--dry-run` imprime la carga útil resuelta; `--json` emite `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamiento del canal WhatsApp Web

- Entrada: ruta de archivo local **o** URL HTTP(S).
- Flujo: cargar en un Buffer, detectar el tipo de medio y crear la carga útil correcta:
  - **Imágenes:** redimensionar y recomprimir a JPEG (lado máximo de 2048 px) apuntando a `channels.whatsapp.mediaMaxMb` (predeterminado: 50 MB).
  - **Audio/Voz/Video:** paso directo hasta 16 MB; el audio se envía como nota de voz (`ptt: true`).
  - **Documentos:** cualquier otra cosa, hasta 100 MB, conservando el nombre de archivo cuando esté disponible.
- Reproducción estilo GIF de WhatsApp: enviar un MP4 con `gifPlayback: true` (CLI: `--gif-playback`) para que los clientes móviles lo reproduzcan en bucle en línea.
- La detección MIME prefiere bytes mágicos, luego encabezados y luego la extensión de archivo.
- La leyenda viene de `--message` o `reply.text`; se permite una leyenda vacía.
- Registro: el modo no detallado muestra `↩️`/`✅`; el modo detallado incluye tamaño y ruta/URL de origen.

## Canalización de respuesta automática

- `getReplyFromConfig` devuelve `{ text?, mediaUrl?, mediaUrls? }`.
- Cuando hay medios presentes, el remitente web resuelve rutas locales o URL usando la misma canalización que `openclaw message send`.
- Si se proporcionan varias entradas de medios, se envían secuencialmente.

## Medios entrantes hacia comandos (Pi)

- Cuando los mensajes web entrantes incluyen medios, OpenClaw los descarga en un archivo temporal y expone variables de plantillas:
  - `{{MediaUrl}}` pseudo-URL para el medio entrante.
  - `{{MediaPath}}` ruta temporal local escrita antes de ejecutar el comando.
- Cuando se habilita un sandbox de Docker por sesión, los medios entrantes se copian en el espacio de trabajo del sandbox y `MediaPath`/`MediaUrl` se reescriben a una ruta relativa como `media/inbound/<filename>`.
- La comprensión de medios (si está configurada mediante `tools.media.*` o `tools.media.models` compartidos) se ejecuta antes de aplicar la plantilla y puede insertar bloques `[Image]`, `[Audio]` y `[Video]` en `Body`.
  - El audio establece `{{Transcript}}` y usa la transcripción para el análisis de comandos, de modo que los comandos slash sigan funcionando.
  - Las descripciones de video e imagen conservan cualquier texto de leyenda para el análisis de comandos.
  - Si el modelo de imagen primario activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y pasa la imagen original al modelo en su lugar.
- De forma predeterminada, solo se procesa el primer adjunto coincidente de imagen/audio/video; establece `tools.media.<cap>.attachments` para procesar varios adjuntos.

## Límites y errores

**Límites de envío saliente (envío web de WhatsApp)**

- Imágenes: hasta `channels.whatsapp.mediaMaxMb` (predeterminado: 50 MB) después de la recompresión.
- Audio/voz/video: límite de 16 MB; documentos: límite de 100 MB.
- Medios demasiado grandes o ilegibles → error claro en los registros y la respuesta se omite.

**Límites de comprensión de medios (transcripción/descripción)**

- Imagen predeterminada: 10 MB (`tools.media.image.maxBytes`).
- Audio predeterminado: 20 MB (`tools.media.audio.maxBytes`).
- Video predeterminado: 50 MB (`tools.media.video.maxBytes`).
- Los medios demasiado grandes omiten la comprensión, pero las respuestas siguen procesándose con el cuerpo original.

## Notas para pruebas

- Cubrir flujos de envío y respuesta para casos de imagen/audio/documento.
- Validar la recompresión de imágenes (límite de tamaño) y el indicador de nota de voz para audio.
- Asegurar que las respuestas con varios medios se distribuyan como envíos secuenciales.

## Relacionado

- [Captura de cámara](/es/nodes/camera)
- [Comprensión de medios](/es/nodes/media-understanding)
- [Audio y notas de voz](/es/nodes/audio)
