---
read_when:
    - Buscas una descripción general de las capacidades de medios de OpenClaw
    - Decidir qué proveedor de medios configurar
    - Comprender cómo funciona la generación de medios asíncrona
sidebarTitle: Media overview
summary: Capacidades de imagen, video, música, voz y comprensión de medios de un vistazo
title: Resumen de medios
x-i18n:
    generated_at: "2026-04-26T11:39:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70be8062c01f57bf53ab08aad4f1561e3958adc94e478224821d722fd500e09f
    source_path: tools/media-overview.md
    workflow: 15
---

OpenClaw genera imágenes, videos y música, entiende medios entrantes
(imágenes, audio, video) y reproduce en voz alta sus respuestas con conversión de texto a voz. Todas
las capacidades de medios están impulsadas por herramientas: el agente decide cuándo usarlas según
la conversación, y cada herramienta solo aparece cuando al menos un proveedor de respaldo está configurado.

## Capacidades

<CardGroup cols={2}>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Crea y edita imágenes a partir de indicaciones de texto o imágenes de referencia mediante
    `image_generate`. Sincrónica: se completa en línea con la respuesta.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Texto a video, imagen a video y video a video mediante `video_generate`.
    Asíncrona: se ejecuta en segundo plano y publica el resultado cuando está listo.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Genera música o pistas de audio mediante `music_generate`. Asíncrona en
    proveedores compartidos; la ruta del flujo de trabajo de ComfyUI se ejecuta de forma sincrónica.
  </Card>
  <Card title="Texto a voz" href="/es/tools/tts" icon="microphone">
    Convierte respuestas salientes en audio hablado mediante la herramienta `tts` más la
    configuración `messages.tts`. Sincrónica.
  </Card>
  <Card title="Comprensión de medios" href="/es/nodes/media-understanding" icon="eye">
    Resume imágenes, audio y video entrantes usando proveedores de modelos
    con capacidad de visión y plugins dedicados de comprensión de medios.
  </Card>
  <Card title="Voz a texto" href="/es/nodes/audio" icon="ear-listen">
    Transcribe mensajes de voz entrantes mediante STT por lotes o proveedores de
    STT en streaming de Voice Call.
  </Card>
</CardGroup>

## Matriz de capacidades de proveedores

| Proveedor   | Imagen | Video | Música | TTS | STT | Voz en tiempo real | Comprensión de medios |
| ----------- | :----: | :---: | :----: | :-: | :-: | :----------------: | :-------------------: |
| Alibaba     |        |   ✓   |        |     |     |                    |                       |
| BytePlus    |        |   ✓   |        |     |     |                    |                       |
| ComfyUI     |   ✓    |   ✓   |   ✓    |     |     |                    |                       |
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
| Qwen        |        |   ✓   |        |     |     |                    |                       |
| Runway      |        |   ✓   |        |     |     |                    |                       |
| SenseAudio  |        |       |        |     |  ✓  |                    |                       |
| Together    |        |   ✓   |        |     |     |                    |                       |
| Vydra       |   ✓    |   ✓   |        |  ✓  |     |                    |                       |
| xAI         |   ✓    |   ✓   |        |  ✓  |  ✓  |                    |           ✓           |
| Xiaomi MiMo |   ✓    |       |        |  ✓  |     |                    |           ✓           |

<Note>
La comprensión de medios usa cualquier modelo con capacidad de visión o de audio registrado
en tu configuración de proveedor. La matriz anterior enumera los proveedores con soporte dedicado de
comprensión de medios; la mayoría de los proveedores de LLM multimodales (Anthropic, Google,
OpenAI, etc.) también pueden comprender medios entrantes cuando están configurados como el
modelo de respuesta activo.
</Note>

## Asíncrono vs. sincrónico

| Capacidad       | Modo         | Motivo                                                             |
| ---------------- | ------------ | ------------------------------------------------------------------ |
| Imagen           | Sincrónico   | Las respuestas del proveedor regresan en segundos; se completa en línea con la respuesta. |
| Texto a voz      | Sincrónico   | Las respuestas del proveedor regresan en segundos; se adjuntan al audio de la respuesta. |
| Video            | Asíncrono    | El procesamiento del proveedor tarda de 30 s a varios minutos.    |
| Música (compartido) | Asíncrono | Tiene la misma característica de procesamiento del proveedor que el video. |
| Música (ComfyUI) | Sincrónico   | El flujo de trabajo local se ejecuta en línea contra el servidor ComfyUI configurado. |

Para las herramientas asíncronas, OpenClaw envía la solicitud al proveedor, devuelve un
id de tarea de inmediato y sigue el trabajo en el registro de tareas. El agente continúa
respondiendo a otros mensajes mientras el trabajo se ejecuta. Cuando el proveedor termina,
OpenClaw reactiva al agente para que pueda publicar el medio terminado de vuelta en el
canal original.

## Voz a texto y Voice Call

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio y xAI pueden transcribir
audio entrante mediante la ruta por lotes `tools.media.audio` cuando están configurados.
Los plugins de canal que realizan una verificación previa de una nota de voz para el filtrado por menciones o el
análisis de comandos marcan el archivo adjunto transcrito en el contexto entrante, para que el paso compartido
de comprensión de medios reutilice esa transcripción en lugar de hacer una segunda llamada de
STT para el mismo audio.

Deepgram, ElevenLabs, Mistral, OpenAI y xAI también registran proveedores de
STT en streaming de Voice Call, por lo que el audio telefónico en vivo puede reenviarse al proveedor
seleccionado sin esperar a que se complete una grabación.

## Asignaciones de proveedores (cómo los proveedores se dividen entre superficies)

<AccordionGroup>
  <Accordion title="Google">
    Superficies de imagen, video, música, TTS por lotes, voz en tiempo real del backend y
    comprensión de medios.
  </Accordion>
  <Accordion title="OpenAI">
    Superficies de imagen, video, TTS por lotes, STT por lotes, STT en streaming de Voice Call, voz en tiempo real del backend
    y embeddings de memoria.
  </Accordion>
  <Accordion title="xAI">
    Imagen, video, búsqueda, ejecución de código, TTS por lotes, STT por lotes y STT en streaming de
    Voice Call. La voz Realtime de xAI es una capacidad upstream, pero
    no está registrada en OpenClaw hasta que el contrato compartido de voz en tiempo real pueda
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
