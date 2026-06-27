---
read_when:
    - Modificar la canalización de medios o los archivos adjuntos
summary: Reglas de manejo de imágenes y multimedia para envíos, gateway y respuestas de agentes
title: Compatibilidad con imágenes y contenido multimedia
x-i18n:
    generated_at: "2026-06-27T11:52:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeee181cae2798b7d0f5dbe0331c6b09612755b4d796d98baaeaf6989955def5
    source_path: nodes/images.md
    workflow: 16
---

El canal de WhatsApp se ejecuta mediante **Baileys Web**. Este documento recoge las reglas actuales de gestión de medios para envíos, Gateway y respuestas de agentes.

## Objetivos

- Enviar medios con subtítulos opcionales mediante `openclaw message send --media`.
- Permitir que las respuestas automáticas desde la bandeja de entrada web incluyan medios junto con texto.
- Mantener los límites por tipo sensatos y predecibles.

## Superficie de CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` es opcional; el subtítulo puede estar vacío para envíos solo con medios.
  - `--dry-run` imprime la carga útil resuelta; `--json` emite `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamiento del canal WhatsApp Web

- Entrada: ruta de archivo local **o** URL HTTP(S).
- Flujo: cargar en un Buffer, detectar el tipo de medio y construir la carga útil correcta:
  - **Imágenes:** redimensionar y recomprimir a JPEG (lado máximo de 2048 px) apuntando a `channels.whatsapp.mediaMaxMb` (valor predeterminado: 50 MB).
  - **Audio/Voz/Video:** transferencia directa hasta 16 MB; el audio se envía como una nota de voz (`ptt: true`).
  - **Documentos:** cualquier otra cosa, hasta 100 MB, con el nombre de archivo conservado cuando esté disponible.
- Reproducción estilo GIF de WhatsApp: enviar un MP4 con `gifPlayback: true` (CLI: `--gif-playback`) para que los clientes móviles lo reproduzcan en bucle en línea.
- La detección MIME prefiere bytes mágicos, luego encabezados y luego la extensión del archivo.
- El subtítulo proviene de `--message` o `reply.text`; se permite un subtítulo vacío.
- Registro: el modo no detallado muestra `↩️`/`✅`; el modo detallado incluye el tamaño y la ruta/URL de origen.

## Canalización de respuestas automáticas

- `getReplyFromConfig` devuelve `{ text?, mediaUrl?, mediaUrls? }`.
- Cuando hay medios, el remitente web resuelve rutas locales o URL usando la misma canalización que `openclaw message send`.
- Varias entradas de medios se envían secuencialmente si se proporcionan.

## Medios entrantes a comandos

- Cuando los mensajes web entrantes incluyen medios, OpenClaw los descarga a un archivo temporal y expone variables de plantillas:
  - `{{MediaUrl}}` pseudo-URL para el medio entrante.
  - `{{MediaPath}}` ruta temporal local escrita antes de ejecutar el comando.
- Cuando se habilita un sandbox Docker por sesión, los medios entrantes se copian al espacio de trabajo del sandbox y `MediaPath`/`MediaUrl` se reescriben a una ruta relativa como `media/inbound/<filename>`.
- La comprensión de medios (si está configurada mediante `tools.media.*` o los `tools.media.models` compartidos) se ejecuta antes de las plantillas y puede insertar bloques `[Image]`, `[Audio]` y `[Video]` en `Body`.
  - El audio establece `{{Transcript}}` y usa la transcripción para el análisis de comandos, de modo que los comandos con barra diagonal sigan funcionando.
  - Las descripciones de video e imagen conservan cualquier texto de subtítulo para el análisis de comandos.
  - Si el modelo de imagen principal activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y pasa la imagen original al modelo en su lugar.
- De forma predeterminada, solo se procesa el primer adjunto de imagen/audio/video coincidente; configura `tools.media.<cap>.attachments` para procesar varios adjuntos.

## Límites y errores

**Límites de envío saliente (envío por WhatsApp web)**

- Imágenes: hasta `channels.whatsapp.mediaMaxMb` (valor predeterminado: 50 MB) después de la recompresión.
- Audio/voz/video: límite de 16 MB; documentos: límite de 100 MB.
- Medios demasiado grandes o ilegibles → error claro en los registros y se omite la respuesta.

**Límites de comprensión de medios (transcripción/descripción)**

- Imagen predeterminada: 10 MB (`tools.media.image.maxBytes`).
- Audio predeterminado: 20 MB (`tools.media.audio.maxBytes`).
- Video predeterminado: 50 MB (`tools.media.video.maxBytes`).
- Los medios demasiado grandes omiten la comprensión, pero las respuestas se siguen enviando con el cuerpo original.

## Notas para pruebas

- Cubrir flujos de envío y respuesta para casos de imagen/audio/documento.
- Validar la recompresión de imágenes (límite de tamaño) y la marca de nota de voz para audio.
- Asegurar que las respuestas con varios medios se distribuyan como envíos secuenciales.

## Relacionado

- [Captura de cámara](/es/nodes/camera)
- [Comprensión de medios](/es/nodes/media-understanding)
- [Audio y notas de voz](/es/nodes/audio)
