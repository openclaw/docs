---
read_when:
    - Quieres usar modelos Grok en OpenClaw
    - Estás configurando la autenticación de xAI o los ID de modelo
summary: Usa modelos Grok de xAI en OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-23T05:20:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a9fd184bab6f7ab363487332752141212a89c7380f6f91a659c78bcc470c9b
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw incluye un Plugin de proveedor `xai` para modelos Grok.

## Primeros pasos

<Steps>
  <Step title="Crear una clave API">
    Crea una clave API en la [consola de xAI](https://console.x.ai/).
  </Step>
  <Step title="Configurar tu clave API">
    Establece `XAI_API_KEY`, o ejecuta:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Elegir un modelo">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw usa la API de Responses de xAI como transporte incluido de xAI. La misma
`XAI_API_KEY` también puede usar `web_search` con respaldo de Grok, `x_search` de primera clase
y `code_execution` remoto.
Si almacenas una clave de xAI en `plugins.entries.xai.config.webSearch.apiKey`,
el proveedor de modelos incluido de xAI también reutiliza esa clave como respaldo.
El ajuste de `code_execution` se encuentra en `plugins.entries.xai.config.codeExecution`.
</Note>

## Catálogo de modelos incluido

OpenClaw incluye estas familias de modelos de xAI listas para usar:

| Family         | Model ids                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

El Plugin también resuelve hacia delante IDs más nuevos de `grok-4*` y `grok-code-fast*` cuando
siguen la misma forma de API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` y las variantes `grok-4.20-beta-*` son las
refs actuales de Grok con capacidad de imagen en el catálogo incluido.
</Tip>

## Cobertura de funciones de OpenClaw

El Plugin incluido asigna la superficie actual de la API pública de xAI a los contratos compartidos
de proveedor y herramientas de OpenClaw cuando el comportamiento encaja limpiamente.

| xAI capability             | OpenClaw surface                          | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | proveedor de modelos `xai/<model>`        | Sí                                                                  |
| Búsqueda web del lado del servidor | proveedor `web_search` `grok`      | Sí                                                                  |
| Búsqueda X del lado del servidor | herramienta `x_search`              | Sí                                                                  |
| Ejecución de código del lado del servidor | herramienta `code_execution` | Sí                                                                  |
| Imágenes                   | `image_generate`                          | Sí                                                                  |
| Videos                     | `video_generate`                          | Sí                                                                  |
| Texto a voz por lotes      | `messages.tts.provider: "xai"` / `tts`    | Sí                                                                  |
| TTS en streaming           | —                                         | No expuesto; el contrato de TTS de OpenClaw devuelve búferes de audio completos |
| Voz a texto por lotes      | `tools.media.audio` / comprensión multimedia | Sí                                                                |
| Voz a texto en streaming   | Voice Call `streaming.provider: "xai"`    | Sí                                                                  |
| Voz en tiempo real         | —                                         | Aún no expuesto; contrato diferente de sesión/WebSocket             |
| Archivos / lotes           | Solo compatibilidad genérica de API de modelos | No es una herramienta de OpenClaw de primera clase              |

<Note>
OpenClaw usa las API REST de xAI para imagen/video/TTS/STT para generación multimedia,
voz y transcripción por lotes, el WebSocket de STT en streaming de xAI para
transcripción en vivo de llamadas de voz, y la API de Responses para modelos, búsqueda y
herramientas de ejecución de código. Las funciones que necesitan contratos distintos de OpenClaw, como
las sesiones de voz Realtime, se documentan aquí como capacidades ascendentes en lugar de
comportamiento oculto del Plugin.
</Note>

### Asignaciones de modo rápido

`/fast on` o `agents.defaults.models["xai/<model>"].params.fastMode: true`
reescriben las solicitudes nativas de xAI de la siguiente manera:

| Source model  | Fast-mode target   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Alias heredados de compatibilidad

Los alias heredados siguen normalizándose a los IDs canónicos incluidos:

| Legacy alias              | Canonical id                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funciones

<AccordionGroup>
  <Accordion title="Búsqueda web">
    El proveedor incluido de búsqueda web `grok` también usa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generación de video">
    El Plugin incluido `xai` registra generación de video mediante la
    herramienta compartida `video_generate`.

    - Modelo de video predeterminado: `xai/grok-imagine-video`
    - Modos: texto a video, imagen a video, edición remota de video y extensión
      remota de video
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluciones: `480P`, `720P`
    - Duración: 1-15 segundos para generación/imagen a video, 2-10 segundos para
      extensión

    <Warning>
    No se aceptan búferes locales de video. Usa URL remotas `http(s)` para
    entradas de edición/extensión de video. Imagen a video acepta búferes locales de imagen porque
    OpenClaw puede codificarlos como URL de datos para xAI.
    </Warning>

    Para usar xAI como proveedor de video predeterminado:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Consulta [Generación de video](/es/tools/video-generation) para conocer los parámetros compartidos de la herramienta,
    la selección de proveedor y el comportamiento de failover.
    </Note>

  </Accordion>

  <Accordion title="Generación de imágenes">
    El Plugin incluido `xai` registra la generación de imágenes mediante la herramienta compartida
    `image_generate`.

    - Modelo de imagen predeterminado: `xai/grok-imagine-image`
    - Modelo adicional: `xai/grok-imagine-image-pro`
    - Modos: texto a imagen y edición de imagen de referencia
    - Entradas de referencia: una `image` o hasta cinco `images`
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluciones: `1K`, `2K`
    - Cantidad: hasta 4 imágenes

    OpenClaw solicita a xAI respuestas de imagen `b64_json` para que el multimedia generado pueda
    almacenarse y entregarse a través de la ruta normal de adjuntos del canal. Las
    imágenes de referencia locales se convierten en URL de datos; las referencias remotas `http(s)` se
    transfieren directamente.

    Para usar xAI como proveedor de imágenes predeterminado:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI también documenta `quality`, `mask`, `user` y relaciones nativas adicionales
    como `1:2`, `2:1`, `9:20` y `20:9`. Hoy OpenClaw solo reenvía los
    controles de imagen compartidos entre proveedores; las opciones nativas no compatibles
    se omiten intencionalmente de `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Texto a voz">
    El Plugin incluido `xai` registra texto a voz mediante la superficie compartida del proveedor `tts`.

    - Voces: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voz predeterminada: `eve`
    - Formatos: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Idioma: código BCP-47 o `auto`
    - Velocidad: reemplazo de velocidad nativo del proveedor
    - No se admite el formato nativo de nota de voz Opus

    Para usar xAI como proveedor TTS predeterminado:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw usa el endpoint por lotes `/v1/tts` de xAI. xAI también ofrece TTS en streaming
    mediante WebSocket, pero el contrato actual del proveedor de voz de OpenClaw espera
    un búfer de audio completo antes de entregar la respuesta.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El Plugin incluido `xai` también registra voz a texto por lotes mediante la superficie
    de transcripción de comprensión multimedia de OpenClaw.

    - Modelo predeterminado: `grok-stt`
    - Endpoint: REST de xAI `/v1/stt`
    - Ruta de entrada: carga multipart de archivo de audio
    - Compatible con OpenClaw en cualquier lugar donde la transcripción de audio entrante use
      `tools.media.audio`, incluidos segmentos de canales de voz de Discord y
      adjuntos de audio de canales

    Para forzar xAI para la transcripción de audio entrante:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    El idioma puede proporcionarse mediante la configuración compartida de multimedia de audio o por solicitud
    de transcripción individual. Las sugerencias de prompt se aceptan mediante la superficie compartida de OpenClaw,
    pero la integración REST STT de xAI solo reenvía archivo, modelo e
    idioma porque esos campos se corresponden limpiamente con el endpoint público actual de xAI.

  </Accordion>

  <Accordion title="Voz a texto en streaming">
    El Plugin incluido `xai` también registra un proveedor de transcripción en tiempo real
    para audio de llamadas de voz en vivo.

    - Endpoint: WebSocket de xAI `wss://api.x.ai/v1/stt`
    - Codificación predeterminada: `mulaw`
    - Frecuencia de muestreo predeterminada: `8000`
    - Delimitación predeterminada del final del audio: `800ms`
    - Transcripciones intermedias: habilitadas de forma predeterminada

    El flujo multimedia de Twilio de Voice Call envía frames de audio G.711 µ-law, por lo que el
    proveedor de xAI puede reenviar esos frames directamente sin transcodificación:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    La configuración propiedad del proveedor se encuentra en
    `plugins.entries.voice-call.config.streaming.providers.xai`. Las claves
    compatibles son `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` o
    `alaw`), `interimResults`, `endpointingMs` y `language`.

    <Note>
    Este proveedor de streaming es para la ruta de transcripción en tiempo real de Voice Call.
    La voz de Discord actualmente graba segmentos cortos y usa en su lugar la ruta de transcripción por lotes
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuración de x_search">
    El Plugin incluido de xAI expone `x_search` como una herramienta de OpenClaw para buscar
    contenido de X (antes Twitter) mediante Grok.

    Ruta de configuración: `plugins.entries.xai.config.xSearch`

    | Key                | Type    | Default            | Description                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Habilita o deshabilita `x_search`    |
    | `model`            | string  | `grok-4-1-fast`    | Modelo usado para solicitudes de `x_search` |
    | `inlineCitations`  | boolean | —                  | Incluir citas en línea en los resultados |
    | `maxTurns`         | number  | —                  | Número máximo de turnos de conversación |
    | `timeoutSeconds`   | number  | —                  | Tiempo de espera de la solicitud en segundos |
    | `cacheTtlMinutes`  | number  | —                  | Tiempo de vida de la caché en minutos |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuración de ejecución de código">
    El Plugin incluido de xAI expone `code_execution` como una herramienta de OpenClaw para
    ejecución remota de código en el entorno sandbox de xAI.

    Ruta de configuración: `plugins.entries.xai.config.codeExecution`

    | Key               | Type    | Default            | Description                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (si hay una clave disponible) | Habilita o deshabilita la ejecución de código |
    | `model`           | string  | `grok-4-1-fast`    | Modelo usado para solicitudes de ejecución de código |
    | `maxTurns`        | number  | —                  | Número máximo de turnos de conversación |
    | `timeoutSeconds`  | number  | —                  | Tiempo de espera de la solicitud en segundos |

    <Note>
    Esta es ejecución remota en el sandbox de xAI, no [`exec`](/es/tools/exec) local.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Límites conocidos">
    - La autenticación hoy es solo mediante clave API. OpenClaw todavía no tiene flujo OAuth ni de código de dispositivo para xAI.
    - `grok-4.20-multi-agent-experimental-beta-0304` no es compatible en la
      ruta normal del proveedor xAI porque requiere una superficie de API ascendente
      distinta al transporte estándar de OpenClaw para xAI.
    - La voz Realtime de xAI todavía no está registrada como proveedor de OpenClaw. 
      Necesita un contrato distinto de sesión de voz bidireccional al de STT por lotes o
      transcripción en streaming.
    - `quality` de imagen de xAI, `mask` de imagen y relaciones de aspecto adicionales exclusivas nativas no
      se exponen hasta que la herramienta compartida `image_generate` tenga controles
      correspondientes entre proveedores.
  </Accordion>

  <Accordion title="Notas avanzadas">
    - OpenClaw aplica automáticamente correcciones de compatibilidad específicas de xAI para esquemas de herramientas y llamadas de herramientas
      en la ruta compartida del ejecutor.
    - Las solicitudes nativas de xAI usan `tool_stream: true` de forma predeterminada. Establece
      `agents.defaults.models["xai/<model>"].params.tool_stream` en `false` para
      deshabilitarlo.
    - El envoltorio incluido de xAI elimina indicadores estrictos no compatibles de esquema de herramientas y
      claves de carga útil de razonamiento antes de enviar solicitudes nativas de xAI.
    - `web_search`, `x_search` y `code_execution` se exponen como herramientas de OpenClaw.
      OpenClaw habilita la utilidad integrada específica de xAI que necesita dentro de cada
      solicitud de herramienta en lugar de adjuntar todas las herramientas nativas a cada turno de chat.
    - `x_search` y `code_execution` son propiedad del Plugin incluido de xAI en lugar
      de estar codificados de forma rígida en el tiempo de ejecución del modelo principal.
    - `code_execution` es ejecución remota en el sandbox de xAI, no
      [`exec`](/es/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Pruebas en vivo

Las rutas multimedia de xAI están cubiertas por pruebas unitarias y suites en vivo opcionales. Los
comandos en vivo cargan secretos desde tu shell de inicio de sesión, incluido `~/.profile`, antes de
comprobar `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

El archivo en vivo específico del proveedor sintetiza TTS normal, TTS PCM
compatible con telefonía, transcribe audio mediante STT por lotes de xAI, transmite ese mismo PCM mediante STT
en tiempo real de xAI, genera una salida de texto a imagen y edita una imagen de referencia. El
archivo en vivo compartido de imágenes verifica el mismo proveedor xAI mediante la
selección en tiempo de ejecución, failover, normalización y la ruta de adjuntos multimedia de OpenClaw.

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs de modelos y comportamiento de failover.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Todos los proveedores" href="/es/providers/index" icon="grid-2">
    La visión general más amplia de proveedores.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y correcciones.
  </Card>
</CardGroup>
