---
read_when:
    - Buscas una descripción general de las capacidades multimedia de OpenClaw
    - Decidir qué proveedor de medios configurar
    - Comprender cómo funciona la generación asíncrona de medios
sidebarTitle: Media overview
summary: Capacidades de imagen, video, música, voz y comprensión de medios de un vistazo
title: Descripción general de los medios
x-i18n:
    generated_at: "2026-06-27T13:06:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genera imágenes, videos y música, entiende medios entrantes
(imágenes, audio, video) y lee las respuestas en voz alta con texto a voz. Todas
las capacidades multimedia se controlan mediante herramientas: el agente decide cuándo usarlas según
la conversación, y cada herramienta solo aparece cuando hay al menos un proveedor
de respaldo configurado.

La voz en vivo usa el contrato de sesión Talk en lugar de la ruta de herramienta multimedia
de una sola ejecución. Talk tiene tres modos: `realtime` nativo del proveedor, `stt-tts`
local o en streaming, y `transcription` para captura de voz solo de observación. Esos modos
comparten catálogos de proveedores, envoltorios de eventos y semántica de cancelación con
telefonía, reuniones, tiempo real del navegador y clientes nativos de pulsar para hablar.

## Capacidades

<CardGroup cols={2}>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Crea y edita imágenes a partir de prompts de texto o imágenes de referencia mediante
    `image_generate`. Asíncrono en sesiones de chat: se ejecuta en segundo plano y
    publica el resultado cuando está listo.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Texto a video, imagen a video y video a video mediante `video_generate`.
    Asíncrono: se ejecuta en segundo plano y publica el resultado cuando está listo.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Genera música o pistas de audio mediante `music_generate`. Asíncrono en sesiones de chat
    sobre el ciclo de vida compartido de tareas de generación multimedia.
  </Card>
  <Card title="Texto a voz" href="/es/tools/tts" icon="microphone">
    Convierte respuestas salientes en audio hablado mediante la herramienta `tts` más
    la configuración `messages.tts`. Síncrono.
  </Card>
  <Card title="Comprensión multimedia" href="/es/nodes/media-understanding" icon="eye">
    Resume imágenes, audio y video entrantes usando proveedores de modelos con capacidad de visión
    y plugins dedicados de comprensión multimedia.
  </Card>
  <Card title="Voz a texto" href="/es/nodes/audio" icon="ear-listen">
    Transcribe mensajes de voz entrantes mediante STT por lotes o proveedores de STT
    en streaming de llamada de voz.
  </Card>
</CardGroup>

## Matriz de capacidades de proveedores

| Proveedor          | Imagen | Video | Música | TTS | STT | Voz en tiempo real | Comprensión multimedia |
| ----------------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba           |       |   ✓   |       |     |     |                |                     |
| BytePlus          |       |   ✓   |       |     |     |                |                     |
| ComfyUI           |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| DeepInfra         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Deepgram          |       |       |       |     |  ✓  |       ✓        |                     |
| ElevenLabs        |       |       |       |  ✓  |  ✓  |                |                     |
| fal               |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Google            |   ✓   |   ✓   |   ✓   |  ✓  |     |       ✓        |          ✓          |
| Gradium           |       |       |       |  ✓  |     |                |                     |
| CLI local         |       |       |       |  ✓  |     |                |                     |
| Microsoft         |       |       |       |  ✓  |     |                |                     |
| Microsoft Foundry |   ✓   |       |       |     |     |                |                     |
| MiniMax           |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral           |       |       |       |     |  ✓  |                |                     |
| OpenAI            |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter        |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |                |          ✓          |
| Qwen              |       |   ✓   |       |     |     |                |                     |
| Runway            |       |   ✓   |       |     |     |                |                     |
| SenseAudio        |       |       |       |     |  ✓  |                |                     |
| Together          |       |   ✓   |       |     |     |                |                     |
| Vydra             |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI               |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo       |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
La comprensión multimedia usa cualquier modelo con capacidad de visión o audio registrado
en la configuración de tu proveedor. La matriz anterior enumera proveedores con soporte dedicado
de comprensión multimedia; la mayoría de los proveedores de LLM multimodales (Anthropic, Google,
OpenAI, etc.) también pueden entender medios entrantes cuando están configurados como el modelo
activo de respuesta.
</Note>

## Asíncrono frente a síncrono

| Capacidad      | Modo         | Por qué                                                                                                  |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Imagen         | Asíncrono | El procesamiento del proveedor puede durar más que un turno de chat; los adjuntos generados usan la ruta de finalización compartida.   |
| Texto a voz | Síncrono  | Las respuestas del proveedor vuelven en segundos; se adjuntan al audio de respuesta.                                   |
| Video          | Asíncrono | El procesamiento del proveedor tarda de 30 s a varios minutos; las colas lentas pueden ejecutarse hasta el tiempo de espera configurado. |
| Música         | Asíncrono | La misma característica de procesamiento de proveedor que el video.                                                    |

Para herramientas asíncronas, OpenClaw envía la solicitud al proveedor, devuelve un id de tarea
de inmediato y rastrea el trabajo en el registro de tareas. El agente continúa
respondiendo a otros mensajes mientras el trabajo se ejecuta. Cuando el proveedor termina,
OpenClaw despierta al agente con las rutas de los medios generados para que pueda decírselo al
usuario mediante el modo normal de respuesta visible de la sesión: entrega automática de la respuesta final
cuando esté configurada, o `message(action="send")` cuando la sesión requiere
la herramienta de mensajes. Si la sesión solicitante está inactiva o su activación activa
falla, y aún falta algún medio generado en la respuesta de finalización,
OpenClaw envía una reserva directa idempotente solo con los medios faltantes. Los medios
ya entregados por la respuesta de finalización no se publican de nuevo.

## Voz a texto y llamada de voz

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio y xAI pueden transcribir
audio entrante mediante la ruta por lotes `tools.media.audio` cuando están configurados.
Los plugins de canal que hacen una comprobación previa de una nota de voz para control de menciones o análisis
de comandos marcan el adjunto transcrito en el contexto entrante, de modo que el pase compartido
de comprensión multimedia reutiliza esa transcripción en lugar de hacer una segunda
llamada STT para el mismo audio.

Deepgram, ElevenLabs, Mistral, OpenAI y xAI también registran proveedores de STT
en streaming de llamada de voz, por lo que el audio telefónico en vivo puede reenviarse al proveedor
seleccionado sin esperar a una grabación completada.

Para conversaciones de usuario en vivo, prefiere el [modo Talk](/es/nodes/talk). Los adjuntos de audio
por lotes permanecen en la ruta multimedia; el tiempo real del navegador, pulsar para hablar nativo,
telefonía y audio de reuniones deben usar eventos Talk y los catálogos con alcance de sesión
devueltos por el Gateway.

## Asignaciones de proveedores (cómo los proveedores se dividen entre superficies)

<AccordionGroup>
  <Accordion title="Google">
    Superficies de imagen, video, música, TTS por lotes, voz en tiempo real de backend y
    comprensión multimedia.
  </Accordion>
  <Accordion title="OpenAI">
    Superficies de imagen, video, TTS por lotes, STT por lotes, STT en streaming de llamada de voz,
    voz en tiempo real de backend e incrustaciones de memoria.
  </Accordion>
  <Accordion title="DeepInfra">
    Superficies de enrutamiento de chat/modelo, generación/edición de imágenes, texto a video,
    TTS por lotes, STT por lotes, comprensión multimedia de imágenes e incrustaciones de memoria.
    Los modelos nativos de DeepInfra de rerank/clasificación/detección de objetos no se
    registran hasta que OpenClaw tenga contratos de proveedor dedicados para esas
    categorías.
  </Accordion>
  <Accordion title="xAI">
    Imagen, video, búsqueda, ejecución de código, TTS por lotes, STT por lotes y STT
    en streaming de llamada de voz. La voz en tiempo real de xAI es una capacidad ascendente, pero
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
- [Modo Talk](/es/nodes/talk)
