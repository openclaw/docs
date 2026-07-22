---
read_when:
    - ¿Busca una descripción general de las capacidades multimedia de OpenClaw?
    - Decidir qué proveedor multimedia configurar
    - Cómo funciona la generación asíncrona de contenido multimedia
sidebarTitle: Media overview
summary: Resumen de las capacidades de generación de imágenes, vídeo, música y voz, y de comprensión multimedia
title: Descripción general de los medios
x-i18n:
    generated_at: "2026-07-22T10:51:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18eb79e6915c5dc8d705bf5cadfcdddecaf7d21a037f102696d4f2bcd41e5bea
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genera imágenes, vídeos y música, comprende los archivos multimedia entrantes
(imágenes, audio y vídeo) y reproduce las respuestas en voz alta mediante texto a voz. Todas
las capacidades multimedia se controlan mediante herramientas: el agente decide cuándo usarlas en función
de la conversación, y cada herramienta solo aparece cuando se ha configurado al menos un
proveedor subyacente.

La voz en directo utiliza el contrato de sesión de Talk en lugar de la ruta de la herramienta multimedia
de ejecución única. Talk tiene tres modos: `realtime` nativo del proveedor, `stt-tts`
local o por streaming y `transcription` para la captura de voz solo para observación. Estos modos
comparten catálogos de proveedores, envoltorios de eventos y semántica de cancelación con
la telefonía, las reuniones, el tiempo real del navegador y los clientes nativos de pulsar para hablar.

## Capacidades

<CardGroup cols={2}>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Cree y edite imágenes a partir de indicaciones de texto o imágenes de referencia mediante
    `image_generate`. Asíncrona en las sesiones de chat: se ejecuta en segundo plano y
    publica el resultado cuando está listo.
  </Card>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Texto a vídeo, imagen a vídeo y vídeo a vídeo mediante `video_generate`.
    Asíncrona: se ejecuta en segundo plano y publica el resultado cuando está listo.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Genere música o pistas de audio mediante `music_generate`. Asíncrona en las sesiones
    de chat dentro del ciclo de vida compartido de las tareas de generación multimedia.
  </Card>
  <Card title="Texto a voz" href="/es/tools/tts" icon="microphone">
    Convierta las respuestas salientes en audio hablado mediante la herramienta `tts`
    y la configuración `tts`. Síncrona.
  </Card>
  <Card title="Comprensión multimedia" href="/es/nodes/media-understanding" icon="eye">
    Resuma imágenes, audio y vídeo entrantes mediante proveedores de modelos
    con capacidad de visión y plugins dedicados de comprensión multimedia.
  </Card>
  <Card title="Voz a texto" href="/es/nodes/audio" icon="ear-listen">
    Transcriba los mensajes de voz entrantes mediante proveedores de STT por lotes o de
    STT por streaming de Voice Call.
  </Card>
</CardGroup>

## Matriz de capacidades de los proveedores

<Note>
Esta tabla abarca los plugins dedicados de generación multimedia, TTS y STT. Muchos
proveedores de modelos de chat (Anthropic, Google, OpenAI y otros) también comprenden
archivos multimedia entrantes mediante su modelo de respuesta; consulte la lista completa de proveedores en
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
Aquí, **voz en tiempo real** significa tiempo real bidireccional nativo del proveedor (modo
`realtime` de Talk, por ejemplo, Gemini Live o la API Realtime de OpenAI); actualmente, solo Google
y OpenAI lo registran. Deepgram, ElevenLabs, Mistral, OpenAI y xAI
registran por separado STT por streaming de Voice Call (audio a texto unidireccional); consulte
[Voz a texto y Voice Call](#speech-to-text-and-voice-call) más adelante.
La voz en tiempo real de xAI es una capacidad del sistema ascendente, pero no se registra en
OpenClaw hasta que el contrato compartido de voz en tiempo real pueda representarla.
</Note>

## Asíncrono frente a síncrono

| Capacidad      | Modo       | Motivo                                                                                                     |
| -------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| Imagen         | Asíncrono  | El procesamiento del proveedor puede durar más que un turno de chat; los archivos adjuntos generados utilizan la ruta de finalización compartida. |
| Texto a voz    | Síncrono   | Las respuestas del proveedor llegan en segundos; se adjuntan al audio de la respuesta.                     |
| Vídeo          | Asíncrono  | El procesamiento del proveedor tarda de 30 s a varios minutos; las colas lentas pueden ejecutarse hasta el tiempo de espera configurado. |
| Música         | Asíncrono  | Tiene las mismas características de procesamiento del proveedor que el vídeo.                              |

Para las herramientas asíncronas, OpenClaw envía la solicitud al proveedor, devuelve inmediatamente
un id de tarea y realiza el seguimiento del trabajo en el registro de tareas. El agente continúa
respondiendo a otros mensajes mientras se ejecuta el trabajo. Cuando el proveedor termina,
OpenClaw activa al agente con las rutas de los archivos multimedia generados para que pueda informar al
usuario mediante el modo normal de respuesta visible de la sesión: entrega automática de la respuesta
final cuando está configurada, o `message(action="send")` cuando la sesión requiere
la herramienta de mensajes. Si la sesión del solicitante está inactiva o falla su activación
activa, y todavía falta algún archivo multimedia generado en la respuesta de finalización,
OpenClaw envía una alternativa directa idempotente que contiene únicamente los archivos multimedia faltantes. Los archivos multimedia
ya entregados mediante la respuesta de finalización no se vuelven a publicar.

## Voz a texto y Voice Call

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio y xAI pueden transcribir audio entrante mediante la ruta por lotes
`tools.media.audio` cuando están configurados. Los plugins de canal que comprueban previamente una
nota de voz para el filtrado de menciones o el análisis de comandos marcan el archivo adjunto
transcrito en el contexto entrante, de modo que la fase compartida de comprensión multimedia
reutiliza esa transcripción en lugar de realizar una segunda llamada STT para el mismo
audio.

Deepgram, ElevenLabs, Mistral, OpenAI y xAI también registran proveedores de
STT por streaming de Voice Call, por lo que el audio telefónico en directo puede enviarse al proveedor
seleccionado sin esperar a que se complete una grabación.

Para conversaciones en directo con usuarios, utilice preferentemente el [modo Talk](/es/nodes/talk). Los archivos adjuntos de audio
por lotes permanecen en la ruta multimedia; el tiempo real del navegador, la función nativa de pulsar para hablar,
la telefonía y el audio de reuniones deben utilizar eventos de Talk y los catálogos
del ámbito de la sesión devueltos por el Gateway.

## Asignaciones de proveedores (cómo se distribuyen entre las superficies)

<AccordionGroup>
  <Accordion title="Google">
    Superficies de imagen, vídeo, música, TTS por lotes, STT por lotes, voz en tiempo real
    del backend y comprensión multimedia.
  </Accordion>
  <Accordion title="OpenAI">
    Superficies de imagen, vídeo, TTS por lotes, STT por lotes, STT por streaming de Voice Call,
    voz en tiempo real del backend e incrustaciones de memoria.
  </Accordion>
  <Accordion title="DeepInfra">
    Enrutamiento de chat/modelos, generación y edición de imágenes, texto a vídeo, TTS por lotes,
    STT por lotes, comprensión multimedia de imágenes y superficies de incrustaciones de memoria.
    DeepInfra también ofrece reordenación, clasificación, detección de objetos y
    otros tipos de modelos nativos; OpenClaw aún no dispone de un contrato de proveedor para esas
    categorías, por lo que este plugin no las registra.
  </Accordion>
  <Accordion title="xAI">
    Imagen, vídeo, búsqueda, ejecución de código, TTS por lotes, STT por lotes y STT por
    streaming de Voice Call. La voz en tiempo real de xAI es una capacidad del sistema ascendente,
    pero no se registra en OpenClaw hasta que el contrato compartido de voz en tiempo real pueda
    representarla.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Generación de imágenes](/es/tools/image-generation)
- [Generación de vídeo](/es/tools/video-generation)
- [Generación de música](/es/tools/music-generation)
- [Texto a voz](/es/tools/tts)
- [Comprensión multimedia](/es/nodes/media-understanding)
- [Nodos de audio](/es/nodes/audio)
- [Modo Talk](/es/nodes/talk)
