---
read_when:
    - ¿Buscas una visión general de las capacidades de medios?
    - Decidir qué proveedor de medios configurar
    - Comprender cómo funciona la generación asíncrona de medios
summary: Página de destino unificada para capacidades de generación, comprensión y voz de medios
title: Resumen de medios
x-i18n:
    generated_at: "2026-04-24T09:51:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39848c6104ebd4feeb37b233b70f3312fa076b535c3b3780336729eb9fdfa4e6
    source_path: tools/media-overview.md
    workflow: 15
---

# Generación y comprensión de medios

OpenClaw genera imágenes, videos y música, comprende los medios entrantes (imágenes, audio, video) y reproduce respuestas en voz alta con conversión de texto a voz. Todas las capacidades de medios están impulsadas por herramientas: el agente decide cuándo usarlas según la conversación, y cada herramienta solo aparece cuando hay al menos un proveedor de respaldo configurado.

## Capacidades de un vistazo

| Capacidad             | Herramienta      | Proveedores                                                                                  | Qué hace                                                  |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Generación de imágenes | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Crea o edita imágenes a partir de indicaciones de texto o referencias |
| Generación de video   | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Crea videos a partir de texto, imágenes o videos existentes |
| Generación de música  | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Crea música o pistas de audio a partir de indicaciones de texto |
| Texto a voz (TTS)     | `tts`            | ElevenLabs, Google, Microsoft, MiniMax, OpenAI, xAI                                          | Convierte las respuestas salientes en audio hablado       |
| Comprensión de medios | (automática)     | Cualquier proveedor de modelos con capacidades de visión/audio, además de alternativas de la CLI | Resume imágenes, audio y video entrantes                  |

## Matriz de capacidades de proveedores

Esta tabla muestra qué proveedores admiten qué capacidades de medios en toda la plataforma.

| Proveedor  | Imagen | Video | Música | TTS | STT / Transcripción | Voz en tiempo real | Comprensión de medios |
| ---------- | ------ | ----- | ------ | --- | ------------------- | ------------------ | --------------------- |
| Alibaba    |        | Sí    |        |     |                     |                    |                       |
| BytePlus   |        | Sí    |        |     |                     |                    |                       |
| ComfyUI    | Sí     | Sí    | Sí     |     |                     |                    |                       |
| Deepgram   |        |       |        |     | Sí                  |                    |                       |
| ElevenLabs |        |       |        | Sí  | Sí                  |                    |                       |
| fal        | Sí     | Sí    |        |     |                     |                    |                       |
| Google     | Sí     | Sí    | Sí     | Sí  |                     | Sí                 | Sí                    |
| Microsoft  |        |       |        | Sí  |                     |                    |                       |
| MiniMax    | Sí     | Sí    | Sí     | Sí  |                     |                    |                       |
| Mistral    |        |       |        |     | Sí                  |                    |                       |
| OpenAI     | Sí     | Sí    |        | Sí  | Sí                  | Sí                 | Sí                    |
| Qwen       |        | Sí    |        |     |                     |                    |                       |
| Runway     |        | Sí    |        |     |                     |                    |                       |
| Together   |        | Sí    |        |     |                     |                    |                       |
| Vydra      | Sí     | Sí    |        |     |                     |                    |                       |
| xAI        | Sí     | Sí    |        | Sí  | Sí                  |                    | Sí                    |

<Note>
La comprensión de medios usa cualquier modelo con capacidad de visión o audio registrado en la configuración de tu proveedor. La tabla anterior destaca los proveedores con compatibilidad dedicada para comprensión de medios; la mayoría de los proveedores de LLM con modelos multimodales (Anthropic, Google, OpenAI, etc.) también pueden comprender medios entrantes cuando están configurados como el modelo de respuesta activo.
</Note>

## Cómo funciona la generación asíncrona

La generación de video y música se ejecuta como tareas en segundo plano porque el procesamiento del proveedor suele tardar entre 30 segundos y varios minutos. Cuando el agente llama a `video_generate` o `music_generate`, OpenClaw envía la solicitud al proveedor, devuelve un ID de tarea de inmediato y rastrea el trabajo en el registro de tareas. El agente sigue respondiendo a otros mensajes mientras el trabajo se ejecuta. Cuando el proveedor termina, OpenClaw reactiva al agente para que pueda publicar el medio terminado en el canal original. La generación de imágenes y TTS son síncronas y se completan en línea con la respuesta.

Deepgram, ElevenLabs, Mistral, OpenAI y xAI pueden transcribir audio entrante
a través de la ruta por lotes `tools.media.audio` cuando están configurados. Deepgram,
ElevenLabs, Mistral, OpenAI y xAI también registran proveedores de STT en streaming para Voice Call,
por lo que el audio telefónico en vivo puede reenviarse al proveedor seleccionado
sin esperar a que se complete una grabación.

Google se asigna a las superficies de OpenClaw de imagen, video, música, TTS por lotes, voz en tiempo real del backend
y comprensión de medios. OpenAI se asigna a las superficies de OpenClaw de imagen,
video, TTS por lotes, STT por lotes, STT en streaming para Voice Call, voz en tiempo real del backend
y embeddings de memoria. xAI actualmente se asigna a las superficies de OpenClaw de imagen, video,
búsqueda, ejecución de código, TTS por lotes, STT por lotes y STT en streaming para Voice Call.
La voz Realtime de xAI es actualmente una capacidad upstream, pero no está
registrada en OpenClaw hasta que el contrato compartido de voz en tiempo real pueda representarla.

## Enlaces rápidos

- [Generación de imágenes](/es/tools/image-generation) -- generar y editar imágenes
- [Generación de video](/es/tools/video-generation) -- texto a video, imagen a video y video a video
- [Generación de música](/es/tools/music-generation) -- crear música y pistas de audio
- [Texto a voz](/es/tools/tts) -- convertir respuestas en audio hablado
- [Comprensión de medios](/es/nodes/media-understanding) -- comprender imágenes, audio y video entrantes

## Relacionado

- [Generación de imágenes](/es/tools/image-generation)
- [Generación de video](/es/tools/video-generation)
- [Generación de música](/es/tools/music-generation)
- [Texto a voz](/es/tools/tts)
