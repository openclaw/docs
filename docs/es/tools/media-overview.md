---
read_when:
    - Buscando una descripción general de las capacidades multimedia de OpenClaw
    - Decidir qué proveedor de medios configurar
    - Comprender cómo funciona la generación multimedia asíncrona
sidebarTitle: Media overview
summary: Capacidades de imagen, video, música, voz y comprensión de medios de un vistazo
title: Descripción general de medios
x-i18n:
    generated_at: "2026-05-05T05:25:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c57781188ca8a2dbcf378ef82dcea6645c56ed5c5dbb3222c9e4b58ab1398bf1
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
    `image_generate`. Síncrono: se completa en línea con la respuesta.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Texto a video, imagen a video y video a video mediante `video_generate`.
    Asíncrono: se ejecuta en segundo plano y publica el resultado cuando está listo.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Genera música o pistas de audio mediante `music_generate`. Asíncrono en proveedores
    compartidos; la ruta de flujo de trabajo de ComfyUI se ejecuta de forma síncrona.
  </Card>
  <Card title="Texto a voz" href="/es/tools/tts" icon="microphone">
    Convierte respuestas salientes en audio hablado mediante la herramienta `tts` más
    la configuración `messages.tts`. Síncrono.
  </Card>
  <Card title="Comprensión de medios" href="/es/nodes/media-understanding" icon="eye">
    Resume imágenes, audio y video entrantes usando proveedores de modelos con capacidad
    de visión y plugins dedicados de comprensión de medios.
  </Card>
  <Card title="Voz a texto" href="/es/nodes/audio" icon="ear-listen">
    Transcribe mensajes de voz entrantes mediante STT por lotes o proveedores de STT
    de transmisión de Llamada de voz.
  </Card>
</CardGroup>

## Matriz de capacidades de proveedores

| Proveedor    | Imagen | Video | Música | TTS | STT | Voz en tiempo real | Comprensión de medios |
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
| Local CLI   |       |       |       |  ✓  |     |                |                     |
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
La comprensión de medios usa cualquier modelo con capacidad de visión o audio registrado
en la configuración de tu proveedor. La matriz anterior enumera proveedores con soporte
dedicado de comprensión de medios; la mayoría de los proveedores de LLM multimodales (Anthropic, Google,
OpenAI, etc.) también pueden entender medios entrantes cuando están configurados como el modelo
de respuesta activo.
</Note>

## Asíncrono frente a síncrono

| Capacidad      | Modo         | Motivo                                                                |
| --------------- | ------------ | ------------------------------------------------------------------ |
| Imagen           | Síncrono  | Las respuestas del proveedor vuelven en segundos; se completa en línea con la respuesta. |
| Texto a voz  | Síncrono  | Las respuestas del proveedor vuelven en segundos; se adjuntan al audio de la respuesta. |
| Video           | Asíncrono | El procesamiento del proveedor tarda entre 30 s y varios minutos.                 |
| Música (compartida)  | Asíncrono | La misma característica de procesamiento del proveedor que el video.                  |
| Música (ComfyUI) | Síncrono  | El flujo de trabajo local se ejecuta en línea contra el servidor ComfyUI configurado.  |

Para herramientas asíncronas, OpenClaw envía la solicitud al proveedor, devuelve un id de tarea
de inmediato y realiza seguimiento del trabajo en el registro de tareas. El agente continúa
respondiendo a otros mensajes mientras el trabajo se ejecuta. Cuando el proveedor termina,
OpenClaw despierta al agente con las rutas de los medios generados para que pueda avisar al
usuario y, cuando lo exige la política de entrega de origen, retransmitir el resultado mediante
la herramienta de mensajes. Para rutas de grupo/canal solo con herramienta de mensajes, OpenClaw trata
la falta de evidencia de entrega de la herramienta de mensajes como un intento de finalización fallido y envía
el respaldo de medios generado directamente al canal original.

## Voz a texto y Llamada de voz

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio y xAI pueden transcribir
audio entrante mediante la ruta por lotes `tools.media.audio` cuando están configurados.
Los plugins de canal que prevalidan una nota de voz para control de menciones o análisis
de comandos marcan el adjunto transcrito en el contexto entrante, por lo que el paso compartido
de comprensión de medios reutiliza esa transcripción en lugar de hacer una segunda llamada
STT para el mismo audio.

Deepgram, ElevenLabs, Mistral, OpenAI y xAI también registran proveedores de STT
de transmisión de Llamada de voz, por lo que el audio telefónico en vivo puede reenviarse al proveedor
seleccionado sin esperar a una grabación completada.

## Asignaciones de proveedores (cómo se dividen los proveedores entre superficies)

<AccordionGroup>
  <Accordion title="Google">
    Superficies de imagen, video, música, TTS por lotes, voz en tiempo real de backend y
    comprensión de medios.
  </Accordion>
  <Accordion title="OpenAI">
    Superficies de imagen, video, TTS por lotes, STT por lotes, STT de transmisión de Llamada de voz,
    voz en tiempo real de backend e incrustaciones de memoria.
  </Accordion>
  <Accordion title="DeepInfra">
    Superficies de enrutamiento de chat/modelos, generación/edición de imágenes, texto a video, TTS por lotes,
    STT por lotes, comprensión de medios de imagen e incrustaciones de memoria.
    Los modelos nativos de DeepInfra de rerank/clasificación/detección de objetos no se
    registran hasta que OpenClaw tenga contratos de proveedor dedicados para esas
    categorías.
  </Accordion>
  <Accordion title="xAI">
    Imagen, video, búsqueda, ejecución de código, TTS por lotes, STT por lotes y STT
    de transmisión de Llamada de voz. La voz en tiempo real de xAI es una capacidad ascendente, pero
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
