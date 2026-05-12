---
read_when:
    - Buscando una descripción general de las capacidades multimedia de OpenClaw
    - Decidir qué proveedor de medios configurar
    - Comprender cómo funciona la generación asíncrona de medios
sidebarTitle: Media overview
summary: Capacidades de imagen, video, música, voz y comprensión de medios de un vistazo
title: Resumen de medios
x-i18n:
    generated_at: "2026-05-12T08:46:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7ca89d058467968ee140cb3318fe8a1fb96d09fe7c59982efce36eb9b714591
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genera imágenes, videos y música, entiende medios entrantes
(imágenes, audio, video) y pronuncia las respuestas en voz alta con texto a voz. Todas
las capacidades de medios son impulsadas por herramientas: el agente decide cuándo usarlas según
la conversación, y cada herramienta solo aparece cuando está configurado al menos un
proveedor de respaldo.

La voz en directo usa el contrato de sesión Talk en lugar de la ruta de la herramienta de medios
de una sola ejecución. Talk tiene tres modos: `realtime` nativo del proveedor, `stt-tts`
local o en streaming, y `transcription` para captura de voz solo de observación. Esos modos
comparten catálogos de proveedores, envoltorios de eventos y semántica de cancelación con
telefonía, reuniones, tiempo real del navegador y clientes nativos de pulsar para hablar.

## Capacidades

<CardGroup cols={2}>
  <Card title="Image generation" href="/es/tools/image-generation" icon="image">
    Crea y edita imágenes a partir de indicaciones de texto o imágenes de referencia mediante
    `image_generate`. Sincrónico — se completa en línea con la respuesta.
  </Card>
  <Card title="Video generation" href="/es/tools/video-generation" icon="video">
    Texto a video, imagen a video y video a video mediante `video_generate`.
    Asíncrono — se ejecuta en segundo plano y publica el resultado cuando está listo.
  </Card>
  <Card title="Music generation" href="/es/tools/music-generation" icon="music">
    Genera música o pistas de audio mediante `music_generate`. Asíncrono en proveedores
    compartidos; la ruta de flujo de trabajo de ComfyUI se ejecuta sincrónicamente.
  </Card>
  <Card title="Text-to-speech" href="/es/tools/tts" icon="microphone">
    Convierte respuestas salientes en audio hablado mediante la herramienta `tts` más
    la configuración `messages.tts`. Sincrónico.
  </Card>
  <Card title="Media understanding" href="/es/nodes/media-understanding" icon="eye">
    Resume imágenes, audio y video entrantes usando proveedores de modelos con capacidad
    de visión y plugins dedicados de comprensión de medios.
  </Card>
  <Card title="Speech-to-text" href="/es/nodes/audio" icon="ear-listen">
    Transcribe mensajes de voz entrantes mediante STT por lotes o proveedores de STT
    en streaming de Voice Call.
  </Card>
</CardGroup>

## Matriz de capacidades de proveedores

| Proveedor   | Imagen | Video | Música | TTS | STT | Voz en tiempo real | Comprensión de medios |
| ----------- | :----: | :---: | :----: | :-: | :-: | :----------------: | :-------------------: |
| Alibaba     |        |   ✓   |        |     |     |                    |                       |
| BytePlus    |        |   ✓   |        |     |     |                    |                       |
| ComfyUI     |   ✓    |   ✓   |   ✓    |     |     |                    |                       |
| DeepInfra   |   ✓    |   ✓   |        |  ✓  |  ✓  |                    |           ✓           |
| Deepgram    |        |       |        |     |  ✓  |         ✓          |                       |
| ElevenLabs  |        |       |        |  ✓  |  ✓  |                    |                       |
| fal         |   ✓    |   ✓   |        |     |     |                    |                       |
| Google      |   ✓    |   ✓   |   ✓    |  ✓  |     |         ✓          |           ✓           |
| Gradium     |        |       |        |  ✓  |     |                    |                       |
| Local CLI   |        |       |        |  ✓  |     |                    |                       |
| Microsoft   |        |       |        |  ✓  |     |                    |                       |
| MiniMax     |   ✓    |   ✓   |   ✓    |  ✓  |     |                    |                       |
| Mistral     |        |       |        |     |  ✓  |                    |                       |
| OpenAI      |   ✓    |   ✓   |        |  ✓  |  ✓  |         ✓          |           ✓           |
| OpenRouter  |   ✓    |   ✓   |        |  ✓  |  ✓  |                    |           ✓           |
| Qwen        |        |   ✓   |        |     |     |                    |                       |
| Runway      |        |   ✓   |        |     |     |                    |                       |
| SenseAudio  |        |       |        |     |  ✓  |                    |                       |
| Together    |        |   ✓   |        |     |     |                    |                       |
| Vydra       |   ✓    |   ✓   |        |  ✓  |     |                    |                       |
| xAI         |   ✓    |   ✓   |        |  ✓  |  ✓  |                    |           ✓           |
| Xiaomi MiMo |   ✓    |       |        |  ✓  |     |                    |           ✓           |

<Note>
La comprensión de medios usa cualquier modelo con capacidad de visión o audio registrado
en la configuración de tu proveedor. La matriz anterior enumera proveedores con soporte
dedicado de comprensión de medios; la mayoría de los proveedores de LLM multimodales (Anthropic, Google,
OpenAI, etc.) también pueden entender medios entrantes cuando se configuran como el modelo
de respuesta activo.
</Note>

## Asíncrono vs. sincrónico

| Capacidad       | Modo         | Por qué                                                                                              |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Imagen          | Sincrónico   | Las respuestas del proveedor vuelven en segundos; se completa en línea con la respuesta.             |
| Texto a voz     | Sincrónico   | Las respuestas del proveedor vuelven en segundos; se adjuntan al audio de la respuesta.              |
| Video           | Asíncrono    | El procesamiento del proveedor tarda 30 s a varios minutos; las colas lentas pueden ejecutarse hasta el tiempo de espera configurado. |
| Música (compartida) | Asíncrono | La misma característica de procesamiento del proveedor que el video.                                 |
| Música (ComfyUI) | Sincrónico  | El flujo de trabajo local se ejecuta en línea contra el servidor ComfyUI configurado.                |

Para herramientas asíncronas, OpenClaw envía la solicitud al proveedor, devuelve un id
de tarea de inmediato y hace seguimiento del trabajo en el registro de tareas. El agente continúa
respondiendo a otros mensajes mientras el trabajo se ejecuta. Cuando el proveedor termina,
OpenClaw despierta al agente con las rutas de los medios generados para que pueda informar al
usuario y, cuando lo exija la política de entrega de origen, retransmitir el resultado mediante
la herramienta de mensajes. Para rutas de grupos/canales solo con herramienta de mensajes, OpenClaw trata
la falta de evidencia de entrega de la herramienta de mensajes como un intento de finalización fallido y envía
el respaldo de medios generado directamente al canal original.

## Voz a texto y Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio y xAI pueden transcribir
audio entrante mediante la ruta por lotes `tools.media.audio` cuando están configurados.
Los plugins de canal que hacen una comprobación previa de una nota de voz para compuertas de mención o análisis
de comandos marcan el adjunto transcrito en el contexto entrante, de modo que la pasada compartida
de comprensión de medios reutiliza esa transcripción en lugar de hacer una segunda llamada
STT para el mismo audio.

Deepgram, ElevenLabs, Mistral, OpenAI y xAI también registran proveedores de STT en streaming
de Voice Call, por lo que el audio telefónico en directo puede reenviarse al proveedor seleccionado
sin esperar una grabación completa.

Para conversaciones de usuario en directo, prefiere el [modo Talk](/es/nodes/talk). Los adjuntos de audio
por lotes permanecen en la ruta de medios; el tiempo real del navegador, pulsar para hablar nativo,
telefonía y audio de reuniones deben usar eventos de Talk y los catálogos con alcance de sesión
devueltos por el Gateway.

## Asignaciones de proveedores (cómo se dividen los proveedores entre superficies)

<AccordionGroup>
  <Accordion title="Google">
    Superficies de imagen, video, música, TTS por lotes, voz en tiempo real de backend y
    comprensión de medios.
  </Accordion>
  <Accordion title="OpenAI">
    Superficies de imagen, video, TTS por lotes, STT por lotes, STT en streaming de Voice Call, voz
    en tiempo real de backend e incrustaciones de memoria.
  </Accordion>
  <Accordion title="DeepInfra">
    Enrutamiento de chat/modelos, generación/edición de imágenes, texto a video, TTS por lotes,
    STT por lotes, comprensión de medios de imagen y superficies de incrustaciones de memoria.
    Los modelos nativos de DeepInfra de reranking/clasificación/detección de objetos no se
    registran hasta que OpenClaw tenga contratos de proveedor dedicados para esas
    categorías.
  </Accordion>
  <Accordion title="xAI">
    Imagen, video, búsqueda, ejecución de código, TTS por lotes, STT por lotes y STT en streaming de Voice
    Call. La voz en tiempo real de xAI es una capacidad upstream, pero no está
    registrada en OpenClaw hasta que el contrato compartido de voz en tiempo real pueda
    representarla.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Generación de imágenes](/es/tools/image-generation)
- [Generación de video](/es/tools/video-generation)
- [Generación de música](/es/tools/music-generation)
- [Texto a voz](/es/tools/tts)
- [Comprensión de medios](/es/nodes/media-understanding)
- [Nodos de audio](/es/nodes/audio)
- [Modo Talk](/es/nodes/talk)
