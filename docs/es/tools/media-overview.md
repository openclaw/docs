---
read_when:
    - Buscando un resumen de las capacidades multimedia
    - Decidiendo qué proveedor multimedia configurar
    - Entender cómo funciona la generación multimedia asíncrona
summary: Página de inicio unificada para capacidades de generación multimedia, comprensión multimedia y voz
title: Resumen de multimedia
x-i18n:
    generated_at: "2026-04-23T05:21:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 999ed1c58a6d80c4bd6deef6e2dbf55b253c0dee3eb974ed212ca2fa91ec445e
    source_path: tools/media-overview.md
    workflow: 15
---

# Generación y comprensión multimedia

OpenClaw genera imágenes, videos y música, comprende multimedia entrante (imágenes, audio, video) y reproduce respuestas en voz alta con texto a voz. Todas las capacidades multimedia están controladas por herramientas: el agente decide cuándo usarlas según la conversación, y cada herramienta solo aparece cuando hay al menos un proveedor de respaldo configurado.

## Capacidades de un vistazo

| Capability           | Tool             | Providers                                                                                    | What it does                                            |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Generación de imágenes | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Crea o edita imágenes a partir de prompts de texto o referencias |
| Generación de video  | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Crea videos a partir de texto, imágenes o videos existentes |
| Generación de música | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Crea música o pistas de audio a partir de prompts de texto |
| Texto a voz (TTS)    | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                  | Convierte respuestas salientes en audio hablado         |
| Comprensión multimedia | (automática)   | Cualquier proveedor de modelos con capacidad de visión/audio, además de respaldos de CLI     | Resume imágenes, audio y video entrantes                |

## Matriz de capacidades de proveedores

Esta tabla muestra qué proveedores admiten qué capacidades multimedia en toda la plataforma.

| Provider   | Image | Video | Music | TTS | STT / Transcription | Media Understanding |
| ---------- | ----- | ----- | ----- | --- | ------------------- | ------------------- |
| Alibaba    |       | Sí    |       |     |                     |                     |
| BytePlus   |       | Sí    |       |     |                     |                     |
| ComfyUI    | Sí    | Sí    | Sí    |     |                     |                     |
| Deepgram   |       |       |       |     | Sí                  |                     |
| ElevenLabs |       |       |       | Sí  | Sí                  |                     |
| fal        | Sí    | Sí    |       |     |                     |                     |
| Google     | Sí    | Sí    | Sí    |     |                     | Sí                  |
| Microsoft  |       |       |       | Sí  |                     |                     |
| MiniMax    | Sí    | Sí    | Sí    | Sí  |                     |                     |
| Mistral    |       |       |       |     | Sí                  |                     |
| OpenAI     | Sí    | Sí    |       | Sí  | Sí                  | Sí                  |
| Qwen       |       | Sí    |       |     |                     |                     |
| Runway     |       | Sí    |       |     |                     |                     |
| Together   |       | Sí    |       |     |                     |                     |
| Vydra      | Sí    | Sí    |       |     |                     |                     |
| xAI        | Sí    | Sí    |       | Sí  | Sí                  | Sí                  |

<Note>
La comprensión multimedia usa cualquier modelo con capacidad de visión o audio registrado en la configuración de tu proveedor. La tabla anterior destaca los proveedores con compatibilidad dedicada para comprensión multimedia; la mayoría de los proveedores de LLM con modelos multimodales (Anthropic, Google, OpenAI, etc.) también pueden comprender multimedia entrante cuando se configuran como el modelo de respuesta activo.
</Note>

## Cómo funciona la generación asíncrona

La generación de video y música se ejecuta como tareas en segundo plano porque el procesamiento del proveedor normalmente tarda de 30 segundos a varios minutos. Cuando el agente llama a `video_generate` o `music_generate`, OpenClaw envía la solicitud al proveedor, devuelve un ID de tarea de inmediato y rastrea el trabajo en el registro de tareas. El agente sigue respondiendo a otros mensajes mientras el trabajo se ejecuta. Cuando el proveedor termina, OpenClaw reactiva al agente para que pueda publicar el multimedia terminado en el canal original. La generación de imágenes y el TTS son síncronos y se completan en línea con la respuesta.

Deepgram, ElevenLabs, Mistral, OpenAI y xAI pueden transcribir audio entrante
mediante la ruta por lotes `tools.media.audio` cuando están configurados. Deepgram,
ElevenLabs, Mistral, OpenAI y xAI también registran proveedores de STT en streaming para Voice Call,
por lo que el audio telefónico en vivo puede reenviarse al proveedor seleccionado
sin esperar a que se complete una grabación.

OpenAI se asigna a las superficies de OpenClaw de imagen, video, TTS por lotes, STT por lotes, Voice Call
STT en streaming, voz en tiempo real y embeddings de memoria. xAI actualmente
se asigna a las superficies de OpenClaw de imagen, video, búsqueda, ejecución de código, TTS por lotes, STT por lotes
y STT en streaming de Voice Call. La voz Realtime de xAI es actualmente una
capacidad ascendente, pero no está registrada en OpenClaw hasta que el contrato compartido de voz en tiempo real
pueda representarla.

## Enlaces rápidos

- [Generación de imágenes](/es/tools/image-generation) -- generación y edición de imágenes
- [Generación de video](/es/tools/video-generation) -- texto a video, imagen a video y video a video
- [Generación de música](/es/tools/music-generation) -- creación de música y pistas de audio
- [Texto a voz](/es/tools/tts) -- conversión de respuestas en audio hablado
- [Comprensión multimedia](/es/nodes/media-understanding) -- comprensión de imágenes, audio y video entrantes
