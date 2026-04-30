---
read_when:
    - Busca una descripción general de las capacidades multimedia de OpenClaw
    - Decidir qué proveedor de medios configurar
    - Comprender cómo funciona la generación asíncrona de medios
sidebarTitle: Media overview
summary: Capacidades de imagen, video, música, voz y comprensión de medios de un vistazo
title: Descripción general de medios
x-i18n:
    generated_at: "2026-04-30T06:05:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genera imágenes, videos y música, entiende medios entrantes
(imágenes, audio, video) y pronuncia las respuestas en voz alta con texto a voz. Todas
las capacidades multimedia están impulsadas por herramientas: el agente decide cuándo usarlas según
la conversación, y cada herramienta solo aparece cuando hay al menos un proveedor
de respaldo configurado.

## Capacidades

<CardGroup cols={2}>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Crea y edita imágenes a partir de indicaciones de texto o imágenes de referencia mediante
    `image_generate`. Síncrona: se completa en línea con la respuesta.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Texto a video, imagen a video y video a video mediante `video_generate`.
    Asíncrona: se ejecuta en segundo plano y publica el resultado cuando está listo.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Genera música o pistas de audio mediante `music_generate`. Asíncrona en proveedores
    compartidos; la ruta de flujo de trabajo de ComfyUI se ejecuta de forma síncrona.
  </Card>
  <Card title="Texto a voz" href="/es/tools/tts" icon="microphone">
    Convierte respuestas salientes en audio hablado mediante la herramienta `tts` más la
    configuración `messages.tts`. Síncrona.
  </Card>
  <Card title="Comprensión multimedia" href="/es/nodes/media-understanding" icon="eye">
    Resume imágenes, audio y video entrantes usando proveedores de modelos
    con capacidad de visión y plugins dedicados de comprensión multimedia.
  </Card>
  <Card title="Voz a texto" href="/es/nodes/audio" icon="ear-listen">
    Transcribe mensajes de voz entrantes mediante proveedores de STT por lotes o STT
    de transmisión de llamadas de voz.
  </Card>
</CardGroup>

## Matriz de capacidades de proveedores

| Proveedor    | Imagen | Video | Música | TTS | STT | Voz en tiempo real | Comprensión multimedia |
| ----------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba     |       |   ✓   |       |     |     |                |                     |
| BytePlus    |       |   ✓   |       |     |     |                |                     |
| ComfyUI     |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| DeepInfra   |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Deepgram    |       |       |       |     |  ✓  |       ✓        |                     |
| ElevenLabs  |       |       |       |  ✓  |  ✓  |                |                     |
| fal         |   ✓   |   ✓   |       |     |     |                |                     |
| Google      |   ✓   |   ✓   |   ✓   |  ✓  |     |       ✓        |          ✓          |
| Gradium     |       |       |       |  ✓  |     |                |                     |
| CLI local   |       |       |       |  ✓  |     |                |                     |
| Microsoft   |       |       |       |  ✓  |     |                |                     |
| MiniMax     |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral     |       |       |       |     |  ✓  |                |                     |
| OpenAI      |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter  |   ✓   |   ✓   |       |  ✓  |     |                |          ✓          |
| Qwen        |       |   ✓   |       |     |     |                |                     |
| Runway      |       |   ✓   |       |     |     |                |                     |
| SenseAudio  |       |       |       |     |  ✓  |                |                     |
| Together    |       |   ✓   |       |     |     |                |                     |
| Vydra       |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
La comprensión multimedia usa cualquier modelo con capacidad de visión o audio registrado
en tu configuración de proveedor. La matriz anterior enumera proveedores con soporte
dedicado de comprensión multimedia; la mayoría de los proveedores de LLM multimodales (Anthropic, Google,
OpenAI, etc.) también pueden entender medios entrantes cuando se configuran como el modelo
de respuesta activo.
</Note>

## Asíncrono frente a síncrono

| Capacidad      | Modo         | Por qué                                                                |
| --------------- | ------------ | ------------------------------------------------------------------ |
| Imagen           | Síncrono  | Las respuestas del proveedor llegan en segundos; se completa en línea con la respuesta. |
| Texto a voz  | Síncrono  | Las respuestas del proveedor llegan en segundos; se adjuntan al audio de la respuesta. |
| Video           | Asíncrono | El procesamiento del proveedor tarda de 30 s a varios minutos.                 |
| Música (compartida)  | Asíncrono | La misma característica de procesamiento del proveedor que el video.                  |
| Música (ComfyUI) | Síncrono  | El flujo de trabajo local se ejecuta en línea contra el servidor ComfyUI configurado.  |

Para las herramientas asíncronas, OpenClaw envía la solicitud al proveedor, devuelve un id
de tarea de inmediato y rastrea el trabajo en el libro mayor de tareas. El agente continúa
respondiendo a otros mensajes mientras se ejecuta el trabajo. Cuando el proveedor termina,
OpenClaw despierta al agente para que pueda publicar el medio terminado de vuelta en el
canal original.

## Voz a texto y llamada de voz

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio y xAI pueden transcribir
audio entrante mediante la ruta por lotes `tools.media.audio` cuando están configurados.
Los plugins de canal que comprueban previamente una nota de voz para control de menciones o análisis
de comandos marcan el adjunto transcrito en el contexto entrante, de modo que la pasada compartida
de comprensión multimedia reutiliza esa transcripción en lugar de hacer una segunda llamada
STT para el mismo audio.

Deepgram, ElevenLabs, Mistral, OpenAI y xAI también registran proveedores STT
de transmisión de llamada de voz, por lo que el audio telefónico en vivo puede reenviarse al proveedor
seleccionado sin esperar una grabación completada.

## Asignaciones de proveedores (cómo se dividen los proveedores entre superficies)

<AccordionGroup>
  <Accordion title="Google">
    Superficies de imagen, video, música, TTS por lotes, voz en tiempo real de backend y
    comprensión multimedia.
  </Accordion>
  <Accordion title="OpenAI">
    Superficies de imagen, video, TTS por lotes, STT por lotes, STT de transmisión de llamada de voz, voz
    en tiempo real de backend e incrustaciones de memoria.
  </Accordion>
  <Accordion title="DeepInfra">
    Superficies de enrutamiento de chat/modelos, generación/edición de imágenes, texto a video, TTS por lotes,
    STT por lotes, comprensión multimedia de imágenes e incrustaciones de memoria.
    Los modelos nativos de DeepInfra de reclasificación/clasificación/detección de objetos no se
    registran hasta que OpenClaw tenga contratos de proveedor dedicados para esas
    categorías.
  </Accordion>
  <Accordion title="xAI">
    Imagen, video, búsqueda, ejecución de código, TTS por lotes, STT por lotes y STT de transmisión de llamada de voz. La voz en tiempo real de xAI es una capacidad upstream, pero
    no se registra en OpenClaw hasta que el contrato compartido de voz en tiempo real pueda
    representarla.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Generación de imágenes](/es/tools/image-generation)
- [Generación de video](/es/tools/video-generation)
- [Generación de música](/es/tools/music-generation)
- [Texto a voz](/es/tools/tts)
- [Comprensión multimedia](/es/nodes/media-understanding)
- [Nodos de audio](/es/nodes/audio)
