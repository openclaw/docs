---
read_when:
    - Buscando una descripción general de las capacidades multimedia de OpenClaw
    - Decidir qué proveedor de medios configurar
    - Comprender cómo funciona la generación asíncrona de medios
sidebarTitle: Media overview
summary: Capacidades de imagen, vídeo, música, voz y comprensión de medios de un vistazo
title: Resumen multimedia
x-i18n:
    generated_at: "2026-07-05T11:50:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genera imágenes, videos y música, comprende medios entrantes
(imágenes, audio, video) y pronuncia las respuestas en voz alta con texto a voz. Todas
las capacidades de medios están impulsadas por herramientas: el agente decide cuándo usarlas según
la conversación, y cada herramienta solo aparece cuando hay al menos un proveedor
de respaldo configurado.

La voz en vivo usa el contrato de sesión Talk en lugar de la ruta de herramienta de medios
de una sola ejecución. Talk tiene tres modos: `realtime` nativo del proveedor, `stt-tts`
local o en streaming, y `transcription` para captura de voz solo de observación. Esos modos
comparten catálogos de proveedores, sobres de eventos y semántica de cancelación con
telefonía, reuniones, tiempo real en navegador y clientes nativos de pulsar para hablar.

## Capacidades

<CardGroup cols={2}>
  <Card title="Image generation" href="/es/tools/image-generation" icon="image">
    Crea y edita imágenes a partir de prompts de texto o imágenes de referencia mediante
    `image_generate`. Asíncrono en sesiones de chat: se ejecuta en segundo plano y
    publica el resultado cuando está listo.
  </Card>
  <Card title="Video generation" href="/es/tools/video-generation" icon="video">
    Texto a video, imagen a video y video a video mediante `video_generate`.
    Asíncrono: se ejecuta en segundo plano y publica el resultado cuando está listo.
  </Card>
  <Card title="Music generation" href="/es/tools/music-generation" icon="music">
    Genera música o pistas de audio mediante `music_generate`. Asíncrono en sesiones de chat
    en el ciclo de vida compartido de tareas de generación de medios.
  </Card>
  <Card title="Text-to-speech" href="/es/tools/tts" icon="microphone">
    Convierte respuestas salientes en audio hablado mediante la herramienta `tts` y la
    configuración `messages.tts`. Síncrono.
  </Card>
  <Card title="Media understanding" href="/es/nodes/media-understanding" icon="eye">
    Resume imágenes, audio y video entrantes con proveedores de modelos con capacidades
    de visión y plugins dedicados de comprensión de medios.
  </Card>
  <Card title="Speech-to-text" href="/es/nodes/audio" icon="ear-listen">
    Transcribe mensajes de voz entrantes mediante STT por lotes o proveedores de STT
    en streaming de llamadas de voz.
  </Card>
</CardGroup>

## Matriz de capacidades de proveedores

<Note>
Esta tabla cubre los plugins dedicados de generación de medios, TTS y STT. Muchos
proveedores de modelos de chat (Anthropic, Google, OpenAI y otros) también comprenden
medios entrantes mediante su modelo de respuesta; consulta la lista completa de proveedores en
[Comprensión de medios](/es/nodes/media-understanding#provider-support-matrix).
</Note>

| Proveedor         | Imagen | Video | Música | TTS | STT | Voz en tiempo real | Comprensión de medios |
| ----------------- | :----: | :---: | :----: | :-: | :-: | :----------------: | :-------------------: |
| Alibaba           |        |   ✓   |        |     |     |                    |                       |
| Azure Speech      |        |       |        |  ✓  |     |                    |                       |
| BytePlus          |        |   ✓   |        |     |     |                    |                       |
| ComfyUI           |   ✓    |   ✓   |   ✓    |     |     |                    |                       |
| Deepgram          |        |       |        |     |  ✓  |                    |                       |
| DeepInfra         |   ✓    |   ✓   |        |  ✓  |  ✓  |                    |           ✓           |
| ElevenLabs        |        |       |        |  ✓  |  ✓  |                    |                       |
| fal               |   ✓    |   ✓   |   ✓    |     |     |                    |                       |
| Google            |   ✓    |   ✓   |   ✓    |  ✓  |  ✓  |         ✓          |           ✓           |
| Gradium           |        |       |        |  ✓  |     |                    |                       |
| Inworld           |        |       |        |  ✓  |     |                    |                       |
| LiteLLM           |   ✓    |       |        |     |     |                    |                       |
| Local CLI         |        |       |        |  ✓  |     |                    |                       |
| Microsoft         |        |       |        |  ✓  |     |                    |                       |
| Microsoft Foundry |   ✓    |       |        |     |     |                    |                       |
| MiniMax           |   ✓    |   ✓   |   ✓    |  ✓  |     |                    |                       |
| Mistral           |        |       |        |     |  ✓  |                    |                       |
| OpenAI            |   ✓    |   ✓   |        |  ✓  |  ✓  |         ✓          |           ✓           |
| OpenRouter        |   ✓    |   ✓   |   ✓    |  ✓  |  ✓  |                    |           ✓           |
| PixVerse          |        |   ✓   |        |     |     |                    |                       |
| Qwen              |        |   ✓   |        |     |     |                    |           ✓           |
| Runway            |        |   ✓   |        |     |     |                    |                       |
| SenseAudio        |        |       |        |     |  ✓  |                    |                       |
| Together          |        |   ✓   |        |     |     |                    |                       |
| Volcengine        |        |       |        |  ✓  |     |                    |                       |
| Vydra             |   ✓    |   ✓   |        |  ✓  |     |                    |                       |
| xAI               |   ✓    |   ✓   |        |  ✓  |  ✓  |                    |           ✓           |
| Xiaomi MiMo       |        |       |        |  ✓  |     |                    |                       |

<Note>
**Voz en tiempo real** aquí significa tiempo real bidireccional nativo del proveedor (modo
`realtime` de Talk, por ejemplo Gemini Live o la API Realtime de OpenAI): solo Google
y OpenAI lo registran actualmente. Deepgram, ElevenLabs, Mistral, OpenAI y xAI
registran por separado STT en streaming de llamadas de voz (audio a texto unidireccional); consulta
[Texto a voz y llamada de voz](#speech-to-text-and-voice-call) a continuación.
La voz en tiempo real de xAI es una capacidad upstream, pero no se registra en
OpenClaw hasta que el contrato compartido de voz en tiempo real pueda representarla.
</Note>

## Asíncrono frente a síncrono

| Capacidad      | Modo        | Por qué                                                                                              |
| -------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| Imagen         | Asíncrono   | El procesamiento del proveedor puede durar más que un turno de chat; los adjuntos generados usan la ruta compartida de finalización. |
| Texto a voz    | Síncrono    | Las respuestas del proveedor se devuelven en segundos; se adjuntan al audio de respuesta.            |
| Video          | Asíncrono   | El procesamiento del proveedor tarda de 30 s a varios minutos; las colas lentas pueden ejecutarse hasta el timeout configurado. |
| Música         | Asíncrono   | La misma característica de procesamiento del proveedor que el video.                                 |

Para las herramientas asíncronas, OpenClaw envía la solicitud al proveedor, devuelve un id
de tarea de inmediato y rastrea el trabajo en el registro de tareas. El agente continúa
respondiendo a otros mensajes mientras el trabajo se ejecuta. Cuando el proveedor termina,
OpenClaw despierta al agente con las rutas de los medios generados para que pueda informar al
usuario mediante el modo normal de respuesta visible de la sesión: entrega automática de la respuesta final
cuando está configurada, o `message(action="send")` cuando la sesión requiere
la herramienta de mensajes. Si la sesión solicitante está inactiva o su activación activa
falla, y aún faltan algunos medios generados en la respuesta de finalización,
OpenClaw envía una alternativa directa idempotente solo con los medios faltantes. Los medios
ya entregados por la respuesta de finalización no se publican de nuevo.

## Texto a voz y llamada de voz

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio y xAI pueden transcribir audio entrante mediante la ruta por lotes
`tools.media.audio` cuando están configurados. Los plugins de canal que realizan una comprobación previa de una
nota de voz para control de menciones o análisis de comandos marcan el adjunto
transcrito en el contexto entrante, por lo que el paso compartido de comprensión de medios
reutiliza esa transcripción en lugar de hacer una segunda llamada STT para el mismo
audio.

Deepgram, ElevenLabs, Mistral, OpenAI y xAI también registran proveedores de STT
en streaming de llamadas de voz, por lo que el audio telefónico en vivo puede reenviarse al proveedor
seleccionado sin esperar a una grabación completa.

Para conversaciones de usuario en vivo, prefiere el [modo Talk](/es/nodes/talk). Los adjuntos de audio
por lotes permanecen en la ruta de medios; el tiempo real en navegador, pulsar para hablar nativo,
telefonía y audio de reuniones deben usar eventos de Talk y los catálogos con alcance de sesión
devueltos por el Gateway.

## Asignaciones de proveedores (cómo los proveedores se dividen entre superficies)

<AccordionGroup>
  <Accordion title="Google">
    Superficies de imagen, video, música, TTS por lotes, STT por lotes, voz en tiempo real de backend y
    comprensión de medios.
  </Accordion>
  <Accordion title="OpenAI">
    Superficies de imagen, video, TTS por lotes, STT por lotes, STT en streaming de llamadas de voz, voz en tiempo real de backend
    e incrustación de memoria.
  </Accordion>
  <Accordion title="DeepInfra">
    Superficies de enrutamiento de chat/modelo, generación/edición de imágenes, texto a video, TTS por lotes,
    STT por lotes, comprensión de medios de imagen e incrustación de memoria.
    DeepInfra también expone reranking, clasificación, detección de objetos y
    otros tipos de modelos nativos; OpenClaw aún no tiene un contrato de proveedor para esas
    categorías, por lo que este plugin no las registra.
  </Accordion>
  <Accordion title="xAI">
    Imagen, video, búsqueda, ejecución de código, TTS por lotes, STT por lotes y STT
    en streaming de llamadas de voz. La voz en tiempo real de xAI es una capacidad upstream, pero
    no se registra en OpenClaw hasta que el contrato compartido de voz en tiempo real pueda
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
