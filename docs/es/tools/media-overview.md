---
read_when:
    - ¿Buscas una descripción general de las capacidades multimedia de OpenClaw?
    - Decidir qué proveedor de medios configurar
    - Cómo funciona la generación asíncrona de contenido multimedia
sidebarTitle: Media overview
summary: Resumen de las capacidades de imagen, vídeo, música, voz y comprensión multimedia
title: Descripción general de medios
x-i18n:
    generated_at: "2026-07-11T23:35:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genera imágenes, vídeos y música, comprende contenido multimedia entrante
(imágenes, audio y vídeo) y reproduce las respuestas en voz alta mediante síntesis de voz. Todas
las capacidades multimedia se controlan mediante herramientas: el agente decide cuándo utilizarlas
en función de la conversación, y cada herramienta solo aparece cuando hay al menos un
proveedor subyacente configurado.

La voz en directo utiliza el contrato de sesión de Talk en lugar de la ruta de la herramienta multimedia
de ejecución única. Talk tiene tres modos: `realtime` nativo del proveedor, `stt-tts`
local o por streaming y `transcription` para la captura de voz de solo observación. Estos modos
comparten catálogos de proveedores, envoltorios de eventos y semántica de cancelación con
telefonía, reuniones, funciones en tiempo real del navegador y clientes nativos de pulsar para hablar.

## Capacidades

<CardGroup cols={2}>
  <Card title="Image generation" href="/es/tools/image-generation" icon="image">
    Crea y edita imágenes a partir de instrucciones de texto o imágenes de referencia mediante
    `image_generate`. Asíncrona en sesiones de chat: se ejecuta en segundo plano y
    publica el resultado cuando está listo.
  </Card>
  <Card title="Video generation" href="/es/tools/video-generation" icon="video">
    Conversión de texto a vídeo, de imagen a vídeo y de vídeo a vídeo mediante `video_generate`.
    Asíncrona: se ejecuta en segundo plano y publica el resultado cuando está listo.
  </Card>
  <Card title="Music generation" href="/es/tools/music-generation" icon="music">
    Genera música o pistas de audio mediante `music_generate`. Asíncrona en sesiones de chat
    dentro del ciclo de vida compartido de tareas de generación multimedia.
  </Card>
  <Card title="Text-to-speech" href="/es/tools/tts" icon="microphone">
    Convierte las respuestas salientes en audio hablado mediante la herramienta `tts` y la
    configuración `messages.tts`. Síncrona.
  </Card>
  <Card title="Media understanding" href="/es/nodes/media-understanding" icon="eye">
    Resume imágenes, audio y vídeo entrantes mediante proveedores de modelos
    con capacidades de visión y plugins específicos de comprensión multimedia.
  </Card>
  <Card title="Speech-to-text" href="/es/nodes/audio" icon="ear-listen">
    Transcribe mensajes de voz entrantes mediante proveedores de STT por lotes o de
    STT por streaming para Llamada de voz.
  </Card>
</CardGroup>

## Matriz de capacidades de los proveedores

<Note>
Esta tabla abarca los plugins específicos de generación multimedia, TTS y STT. Muchos
proveedores de modelos de chat (Anthropic, Google, OpenAI y otros) también comprenden
contenido multimedia entrante mediante su modelo de respuesta; consulta la lista completa de proveedores en
[Comprensión multimedia](/es/nodes/media-understanding#provider-support-matrix).
</Note>

| Proveedor         | Imagen | Vídeo | Música | TTS | STT | Voz en tiempo real | Comprensión multimedia |
| ----------------- | :----: | :---: | :----: | :-: | :-: | :----------------: | :--------------------: |
| Alibaba           |        |   ✓   |        |     |     |                    |                        |
| Azure Speech      |        |       |        |  ✓  |     |                    |                        |
| BytePlus          |        |   ✓   |        |     |     |                    |                        |
| ComfyUI           |   ✓    |   ✓   |   ✓    |     |     |                    |                        |
| Deepgram          |        |       |        |     |  ✓  |                    |                        |
| DeepInfra         |   ✓    |   ✓   |        |  ✓  |  ✓  |                    |           ✓            |
| ElevenLabs        |        |       |        |  ✓  |  ✓  |                    |                        |
| fal               |   ✓    |   ✓   |   ✓    |     |     |                    |                        |
| Google            |   ✓    |   ✓   |   ✓    |  ✓  |  ✓  |         ✓          |           ✓            |
| Gradium           |        |       |        |  ✓  |     |                    |                        |
| Inworld           |        |       |        |  ✓  |     |                    |                        |
| LiteLLM           |   ✓    |       |        |     |     |                    |                        |
| CLI local         |        |       |        |  ✓  |     |                    |                        |
| Microsoft         |        |       |        |  ✓  |     |                    |                        |
| Microsoft Foundry |   ✓    |       |        |     |     |                    |                        |
| MiniMax           |   ✓    |   ✓   |   ✓    |  ✓  |     |                    |                        |
| Mistral           |        |       |        |     |  ✓  |                    |                        |
| OpenAI            |   ✓    |   ✓   |        |  ✓  |  ✓  |         ✓          |           ✓            |
| OpenRouter        |   ✓    |   ✓   |   ✓    |  ✓  |  ✓  |                    |           ✓            |
| PixVerse          |        |   ✓   |        |     |     |                    |                        |
| Qwen              |        |   ✓   |        |     |     |                    |           ✓            |
| Runway            |        |   ✓   |        |     |     |                    |                        |
| SenseAudio        |        |       |        |     |  ✓  |                    |                        |
| Together          |        |   ✓   |        |     |     |                    |                        |
| Volcengine        |        |       |        |  ✓  |     |                    |                        |
| Vydra             |   ✓    |   ✓   |        |  ✓  |     |                    |                        |
| xAI               |   ✓    |   ✓   |        |  ✓  |  ✓  |                    |           ✓            |
| Xiaomi MiMo       |        |       |        |  ✓  |     |                    |                        |

<Note>
Aquí, **voz en tiempo real** significa comunicación bidireccional en tiempo real nativa del proveedor (modo
`realtime` de Talk, por ejemplo, Gemini Live o la API Realtime de OpenAI); actualmente solo Google
y OpenAI la registran. Deepgram, ElevenLabs, Mistral, OpenAI y xAI
registran por separado STT por streaming para Llamada de voz (audio a texto unidireccional); consulta
[Conversión de voz a texto y Llamada de voz](#speech-to-text-and-voice-call) más adelante.
La voz en tiempo real de xAI es una capacidad del proveedor subyacente, pero no se registra en
OpenClaw hasta que el contrato compartido de voz en tiempo real pueda representarla.
</Note>

## Asíncrono frente a síncrono

| Capacidad         | Modo      | Motivo                                                                                                         |
| ----------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| Imagen            | Asíncrono | El procesamiento del proveedor puede durar más que un turno de chat; los archivos adjuntos generados utilizan la ruta compartida de finalización. |
| Síntesis de voz   | Síncrono  | Las respuestas del proveedor llegan en segundos y se adjuntan al audio de la respuesta.                        |
| Vídeo             | Asíncrono | El procesamiento del proveedor tarda entre 30 s y varios minutos; las colas lentas pueden ejecutarse hasta alcanzar el tiempo de espera configurado. |
| Música            | Asíncrono | Presenta las mismas características de procesamiento del proveedor que el vídeo.                              |

Para las herramientas asíncronas, OpenClaw envía la solicitud al proveedor, devuelve inmediatamente un
identificador de tarea y realiza el seguimiento del trabajo en el registro de tareas. El agente continúa
respondiendo a otros mensajes mientras se ejecuta el trabajo. Cuando el proveedor termina,
OpenClaw reactiva al agente con las rutas de los archivos multimedia generados para que pueda informar al
usuario mediante el modo normal de respuesta visible de la sesión: entrega automática de la respuesta final
cuando está configurada, o `message(action="send")` cuando la sesión requiere
la herramienta de mensajes. Si la sesión solicitante está inactiva o falla su reactivación
activa, y aún falta algún contenido multimedia generado en la respuesta de finalización,
OpenClaw envía una alternativa directa e idempotente que contiene únicamente el contenido multimedia faltante. El contenido multimedia
ya entregado mediante la respuesta de finalización no vuelve a publicarse.

## Conversión de voz a texto y Llamada de voz

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio y xAI pueden transcribir audio entrante mediante la ruta por lotes
`tools.media.audio` cuando están configurados. Los plugins de canal que verifican previamente una
nota de voz para controlar las menciones o analizar comandos marcan el archivo adjunto transcrito
en el contexto entrante, de modo que la fase compartida de comprensión multimedia
reutiliza esa transcripción en lugar de realizar una segunda llamada de STT para el mismo
audio.

Deepgram, ElevenLabs, Mistral, OpenAI y xAI también registran proveedores de
STT por streaming para Llamada de voz, de modo que el audio telefónico en directo puede reenviarse al proveedor
seleccionado sin esperar a que se complete una grabación.

Para conversaciones en directo con usuarios, utiliza preferentemente el [modo Talk](/es/nodes/talk). Los archivos adjuntos de audio
por lotes permanecen en la ruta multimedia; las funciones en tiempo real del navegador, las funciones nativas de pulsar para hablar,
la telefonía y el audio de reuniones deben utilizar los eventos de Talk y los catálogos
asociados a la sesión que devuelve el Gateway.

## Asignaciones de proveedores (cómo se distribuyen entre las superficies)

<AccordionGroup>
  <Accordion title="Google">
    Superficies de imagen, vídeo, música, TTS por lotes, STT por lotes, voz en tiempo real
    del backend y comprensión multimedia.
  </Accordion>
  <Accordion title="OpenAI">
    Superficies de imagen, vídeo, TTS por lotes, STT por lotes, STT por streaming para Llamada de voz,
    voz en tiempo real del backend y vectores de memoria.
  </Accordion>
  <Accordion title="DeepInfra">
    Superficies de enrutamiento de chats/modelos, generación y edición de imágenes, conversión de texto a vídeo,
    TTS por lotes, STT por lotes, comprensión multimedia de imágenes y vectores de memoria.
    DeepInfra también ofrece reclasificación, clasificación, detección de objetos y
    otros tipos de modelos nativos; OpenClaw todavía no dispone de un contrato de proveedor para esas
    categorías, por lo que este plugin no las registra.
  </Accordion>
  <Accordion title="xAI">
    Imagen, vídeo, búsqueda, ejecución de código, TTS por lotes, STT por lotes y STT por
    streaming para Llamada de voz. La voz en tiempo real de xAI es una capacidad del proveedor subyacente, pero
    no se registra en OpenClaw hasta que el contrato compartido de voz en tiempo real pueda
    representarla.
  </Accordion>
</AccordionGroup>

## Temas relacionados

- [Generación de imágenes](/es/tools/image-generation)
- [Generación de vídeos](/es/tools/video-generation)
- [Generación de música](/es/tools/music-generation)
- [Síntesis de voz](/es/tools/tts)
- [Comprensión multimedia](/es/nodes/media-understanding)
- [Nodos de audio](/es/nodes/audio)
- [Modo Talk](/es/nodes/talk)
