---
read_when:
    - Buscas una visión general de las capacidades multimedia
    - Decidir qué proveedor multimedia configurar
    - Entender cómo funciona la generación de medios asíncrona
summary: Página de destino unificada para capacidades de generación de medios, comprensión y voz
title: Resumen de medios
x-i18n:
    generated_at: "2026-04-24T05:54:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469fb173ac3853011b8cd4f89f3ab97dd7d14e12e4e1d7d87e84de05d025a593
    source_path: tools/media-overview.md
    workflow: 15
---

# Generación y comprensión de medios

OpenClaw genera imágenes, videos y música, comprende medios entrantes (imágenes, audio, video) y reproduce respuestas en voz alta con texto a voz. Todas las capacidades multimedia están impulsadas por herramientas: el agente decide cuándo usarlas en función de la conversación, y cada herramienta solo aparece cuando hay al menos un proveedor de respaldo configurado.

## Capacidades de un vistazo

| Capability           | Tool             | Providers                                                                                    | What it does                                            |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Generación de imágenes | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Crea o edita imágenes a partir de prompts de texto o referencias |
| Generación de video  | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Crea videos a partir de texto, imágenes o videos existentes |
| Generación de música | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Crea música o pistas de audio a partir de prompts de texto |
| Texto a voz (TTS)    | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                  | Convierte respuestas salientes en audio hablado         |
| Comprensión de medios | (automático)    | Cualquier proveedor de modelos con capacidad de visión/audio, además de fallbacks CLI        | Resume imágenes, audio y video entrantes                |

## Matriz de capacidades por proveedor

Esta tabla muestra qué proveedores admiten qué capacidades multimedia en toda la plataforma.

| Provider   | Image | Video | Music | TTS | STT / Transcription | Media Understanding |
| ---------- | ----- | ----- | ----- | --- | ------------------- | ------------------- |
| Alibaba    |       | Yes   |       |     |                     |                     |
| BytePlus   |       | Yes   |       |     |                     |                     |
| ComfyUI    | Yes   | Yes   | Yes   |     |                     |                     |
| Deepgram   |       |       |       |     | Yes                 |                     |
| ElevenLabs |       |       |       | Yes | Yes                 |                     |
| fal        | Yes   | Yes   |       |     |                     |                     |
| Google     | Yes   | Yes   | Yes   |     |                     | Yes                 |
| Microsoft  |       |       |       | Yes |                     |                     |
| MiniMax    | Yes   | Yes   | Yes   | Yes |                     |                     |
| Mistral    |       |       |       |     | Yes                 |                     |
| OpenAI     | Yes   | Yes   |       | Yes | Yes                 | Yes                 |
| Qwen       |       | Yes   |       |     |                     |                     |
| Runway     |       | Yes   |       |     |                     |                     |
| Together   |       | Yes   |       |     |                     |                     |
| Vydra      | Yes   | Yes   |       |     |                     |                     |
| xAI        | Yes   | Yes   |       | Yes | Yes                 | Yes                 |

<Note>
La comprensión de medios usa cualquier modelo con capacidad de visión o audio registrado en tu configuración de proveedor. La tabla anterior destaca los proveedores con soporte dedicado para comprensión de medios; la mayoría de los proveedores LLM con modelos multimodales (Anthropic, Google, OpenAI, etc.) también pueden comprender medios entrantes cuando están configurados como el modelo de respuesta activo.
</Note>

## Cómo funciona la generación asíncrona

La generación de video y música se ejecuta como tareas en segundo plano porque el procesamiento del proveedor suele tardar entre 30 segundos y varios minutos. Cuando el agente llama a `video_generate` o `music_generate`, OpenClaw envía la solicitud al proveedor, devuelve inmediatamente un id de tarea y rastrea el trabajo en el libro mayor de tareas. El agente sigue respondiendo a otros mensajes mientras el trabajo se ejecuta. Cuando el proveedor termina, OpenClaw reactiva al agente para que pueda publicar el medio terminado de vuelta en el canal original. La generación de imágenes y TTS son síncronas y se completan en línea con la respuesta.

Deepgram, ElevenLabs, Mistral, OpenAI y xAI pueden transcribir audio entrante
a través de la ruta batch `tools.media.audio` cuando están configurados. Deepgram,
ElevenLabs, Mistral, OpenAI y xAI también registran proveedores STT en streaming para Voice Call, por lo que el audio telefónico en vivo puede reenviarse al proveedor seleccionado
sin esperar a una grabación completada.

OpenAI se asigna a las superficies de imagen, video, batch TTS, batch STT, Voice Call
streaming STT, voz en tiempo real y memory embedding de OpenClaw. xAI actualmente
se asigna a las superficies de imagen, video, búsqueda, ejecución de código, batch TTS, batch STT
y Voice Call streaming STT de OpenClaw. La voz Realtime de xAI es actualmente una
capacidad upstream, pero no está registrada en OpenClaw hasta que el contrato compartido de
voz en tiempo real pueda representarla.

## Enlaces rápidos

- [Image Generation](/es/tools/image-generation) -- generar y editar imágenes
- [Video Generation](/es/tools/video-generation) -- texto a video, imagen a video y video a video
- [Music Generation](/es/tools/music-generation) -- crear música y pistas de audio
- [Text-to-Speech](/es/tools/tts) -- convertir respuestas en audio hablado
- [Media Understanding](/es/nodes/media-understanding) -- comprender imágenes, audio y video entrantes

## Relacionado

- [Generación de imágenes](/es/tools/image-generation)
- [Generación de video](/es/tools/video-generation)
- [Generación de música](/es/tools/music-generation)
- [Texto a voz](/es/tools/tts)
