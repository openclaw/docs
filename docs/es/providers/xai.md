---
read_when:
    - Quieres usar modelos Grok en OpenClaw
    - Estás configurando la autenticación de xAI o los ids de modelo
summary: Usar modelos Grok de xAI en OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-24T05:47:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw incluye un Plugin de proveedor `xai` integrado para los modelos Grok.

## Primeros pasos

<Steps>
  <Step title="Crear una clave de API">
    Crea una clave de API en la [consola de xAI](https://console.x.ai/).
  </Step>
  <Step title="Establecer tu clave de API">
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
OpenClaw usa la API Responses de xAI como transporte integrado de xAI. La misma
`XAI_API_KEY` también puede alimentar `web_search` respaldado por Grok, `x_search`
como herramienta de primera clase y `code_execution` remoto.
Si guardas una clave de xAI en `plugins.entries.xai.config.webSearch.apiKey`,
el proveedor de modelos integrado de xAI también reutiliza esa clave como alternativa.
La configuración de `code_execution` se encuentra en `plugins.entries.xai.config.codeExecution`.
</Note>

## Catálogo integrado

OpenClaw incluye estas familias de modelos de xAI listas para usar:

| Familia        | Ids de modelo                                                             |
| -------------- | ------------------------------------------------------------------------- |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                   |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                                |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                            |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`  |
| Grok Code      | `grok-code-fast-1`                                                        |

El Plugin también resuelve por adelantado ids más recientes `grok-4*` y `grok-code-fast*` cuando
siguen la misma forma de API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` y las variantes `grok-4.20-beta-*` son las
referencias Grok con capacidad de imagen actuales en el catálogo integrado.
</Tip>

## Cobertura de funciones de OpenClaw

El Plugin integrado asigna la superficie actual de la API pública de xAI a los
contratos compartidos de proveedor y herramienta de OpenClaw. Las capacidades que no encajan en el contrato compartido
(por ejemplo TTS en streaming y voz en tiempo real) no se exponen; consulta la tabla
siguiente.

| Capacidad de xAI            | Superficie de OpenClaw                    | Estado                                                              |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses            | Proveedor de modelos `xai/<model>`        | Sí                                                                  |
| Búsqueda web del lado del servidor | Proveedor `web_search` `grok`      | Sí                                                                  |
| Búsqueda X del lado del servidor | Herramienta `x_search`               | Sí                                                                  |
| Ejecución de código del lado del servidor | Herramienta `code_execution` | Sí                                                                  |
| Imágenes                    | `image_generate`                          | Sí                                                                  |
| Vídeos                      | `video_generate`                          | Sí                                                                  |
| Texto a voz por lotes       | `messages.tts.provider: "xai"` / `tts`    | Sí                                                                  |
| TTS en streaming            | —                                         | No expuesto; el contrato de TTS de OpenClaw devuelve búferes de audio completos |
| Voz a texto por lotes       | `tools.media.audio` / comprensión de archivos multimedia | Sí                                              |
| Voz a texto en streaming    | Voice Call `streaming.provider: "xai"`    | Sí                                                                  |
| Voz en tiempo real          | —                                         | Aún no expuesto; contrato distinto de sesión/WebSocket              |
| Archivos / lotes            | Solo compatibilidad genérica con la API de modelos | No es una herramienta de primera clase de OpenClaw                 |

  <Note>
  OpenClaw usa las API REST de imagen/vídeo/TTS/STT de xAI para generación de archivos multimedia,
  voz y transcripción por lotes, el WebSocket STT en streaming de xAI para la
  transcripción en vivo de Voice Call, y la API Responses para herramientas de
  modelo, búsqueda y ejecución de código. Las funciones que requieren contratos distintos de OpenClaw, como
  las sesiones de voz en tiempo real, se documentan aquí como capacidades de origen
  en lugar de como comportamiento oculto del Plugin.
  </Note>

  ### Asignaciones del modo rápido

  `/fast on` o `agents.defaults.models["xai/<model>"].params.fastMode: true`
  reescriben las solicitudes nativas de xAI del siguiente modo:

  | Modelo de origen | Objetivo de modo rápido |
  | ---------------- | ----------------------- |
  | `grok-3`         | `grok-3-fast`          |
  | `grok-3-mini`    | `grok-3-mini-fast`     |
  | `grok-4`         | `grok-4-fast`          |
  | `grok-4-0709`    | `grok-4-fast`          |

  ### Alias heredados de compatibilidad

  Los alias heredados siguen normalizándose a los ids canónicos incluidos:

  | Alias heredado             | Id canónico                           |
  | -------------------------- | ------------------------------------- |
  | `grok-4-fast-reasoning`    | `grok-4-fast`                         |
  | `grok-4-1-fast-reasoning`  | `grok-4-1-fast`                       |
  | `grok-4.20-reasoning`      | `grok-4.20-beta-latest-reasoning`     |
  | `grok-4.20-non-reasoning`  | `grok-4.20-beta-latest-non-reasoning` |

  ## Funciones

  <AccordionGroup>
  <Accordion title="Búsqueda web">
    El proveedor integrado de búsqueda web `grok` también usa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generación de vídeo">
    El Plugin integrado `xai` registra la generación de vídeo mediante la herramienta compartida
    `video_generate`.

    - Modelo de vídeo predeterminado: `xai/grok-imagine-video`
    - Modos: texto a vídeo, imagen a vídeo, edición remota de vídeo y extensión remota de vídeo
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluciones: `480P`, `720P`
    - Duración: 1-15 segundos para generación/imagen a vídeo, 2-10 segundos para
      extensión

    <Warning>
    No se aceptan búferes de vídeo locales. Usa URL remotas `http(s)` para
    las entradas de edición/extensión de vídeo. La conversión de imagen a vídeo sí acepta búferes locales de imagen porque
    OpenClaw puede codificarlos como URL de datos para xAI.
    </Warning>

    Para usar xAI como proveedor de vídeo predeterminado:

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
    Consulta [Generación de vídeo](/es/tools/video-generation) para ver parámetros compartidos de la herramienta,
    selección de proveedor y comportamiento de conmutación por error.
    </Note>

  </Accordion>

  <Accordion title="Generación de imágenes">
    El Plugin integrado `xai` registra la generación de imágenes mediante la herramienta compartida
    `image_generate`.

    - Modelo de imagen predeterminado: `xai/grok-imagine-image`
    - Modelo adicional: `xai/grok-imagine-image-pro`
    - Modos: texto a imagen y edición con imagen de referencia
    - Entradas de referencia: una `image` o hasta cinco `images`
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluciones: `1K`, `2K`
    - Cantidad: hasta 4 imágenes

    OpenClaw solicita a xAI respuestas de imagen `b64_json` para que los archivos multimedia generados puedan
    almacenarse y entregarse mediante la ruta normal de archivos adjuntos del canal. Las
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
    xAI también documenta `quality`, `mask`, `user` y relaciones nativas
    adicionales como `1:2`, `2:1`, `9:20` y `20:9`. OpenClaw reenvía hoy solo los
    controles compartidos de imagen entre proveedores; las opciones no compatibles exclusivas del proveedor
    se mantienen intencionadamente fuera de `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Texto a voz">
    El Plugin integrado `xai` registra texto a voz mediante la superficie compartida del proveedor `tts`.

    - Voces: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voz predeterminada: `eve`
    - Formatos: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Idioma: código BCP-47 o `auto`
    - Velocidad: anulación nativa de velocidad del proveedor
    - El formato nativo Opus para notas de voz no es compatible

    Para usar xAI como proveedor de TTS predeterminado:

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
    por WebSocket, pero el contrato actual del proveedor de voz de OpenClaw espera
    un búfer de audio completo antes de la entrega de la respuesta.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El Plugin integrado `xai` registra voz a texto por lotes mediante la
    superficie de transcripción de comprensión de archivos multimedia de OpenClaw.

    - Modelo predeterminado: `grok-stt`
    - Endpoint: REST `/v1/stt` de xAI
    - Ruta de entrada: carga multipart de archivo de audio
    - Compatible en OpenClaw donde la transcripción de audio entrante usa
      `tools.media.audio`, incluidos segmentos de canales de voz de Discord y
      archivos adjuntos de audio de canales

    Para forzar xAI en la transcripción de audio entrante:

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

    El idioma puede proporcionarse mediante la configuración compartida de audio multimedia o por solicitud de
    transcripción. Se aceptan indicaciones de prompt mediante la superficie compartida de OpenClaw,
    pero la integración REST STT de xAI solo reenvía archivo, modelo e
    idioma porque son los que se corresponden claramente con el endpoint público actual de xAI.

  </Accordion>

  <Accordion title="Voz a texto en streaming">
    El Plugin integrado `xai` también registra un proveedor de transcripción en tiempo real
    para audio de Voice Call en vivo.

    - Endpoint: WebSocket de xAI `wss://api.x.ai/v1/stt`
    - Codificación predeterminada: `mulaw`
    - Tasa de muestreo predeterminada: `8000`
    - Endpointing predeterminado: `800ms`
    - Transcripciones provisionales: habilitadas de forma predeterminada

    El flujo multimedia de Twilio de Voice Call envía tramas de audio G.711 µ-law, por lo que el
    proveedor de xAI puede reenviar esas tramas directamente sin transcodificación:

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
    `plugins.entries.voice-call.config.streaming.providers.xai`. Las
    claves compatibles son `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` o
    `alaw`), `interimResults`, `endpointingMs` y `language`.

    <Note>
    Este proveedor de streaming es para la ruta de transcripción en tiempo real de Voice Call.
    El canal de voz de Discord actualmente graba segmentos cortos y usa en su lugar la ruta
    de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuración de x_search">
    El Plugin integrado de xAI expone `x_search` como herramienta de OpenClaw para buscar
    contenido en X (antes Twitter) mediante Grok.

    Ruta de configuración: `plugins.entries.xai.config.xSearch`

    | Clave             | Tipo    | Predeterminado      | Descripción                           |
    | ----------------- | ------- | ------------------- | ------------------------------------- |
    | `enabled`         | boolean | —                   | Activar o desactivar `x_search`       |
    | `model`           | string  | `grok-4-1-fast`     | Modelo usado para solicitudes de `x_search` |
    | `inlineCitations` | boolean | —                   | Incluir citas en línea en los resultados |
    | `maxTurns`        | number  | —                   | Máximo de turnos de conversación      |
    | `timeoutSeconds`  | number  | —                   | Tiempo de espera de la solicitud en segundos |
    | `cacheTtlMinutes` | number  | —                   | Tiempo de vida de caché en minutos    |

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
    El Plugin integrado de xAI expone `code_execution` como herramienta de OpenClaw para
    ejecución remota de código en el entorno sandbox de xAI.

    Ruta de configuración: `plugins.entries.xai.config.codeExecution`

    | Clave             | Tipo    | Predeterminado               | Descripción                                   |
    | ----------------- | ------- | ---------------------------- | --------------------------------------------- |
    | `enabled`         | boolean | `true` (si hay clave disponible) | Activar o desactivar la ejecución de código |
    | `model`           | string  | `grok-4-1-fast`             | Modelo usado para solicitudes de ejecución de código |
    | `maxTurns`        | number  | —                            | Máximo de turnos de conversación              |
    | `timeoutSeconds`  | number  | —                            | Tiempo de espera de la solicitud en segundos  |

    <Note>
    Se trata de ejecución remota en el sandbox de xAI, no del [`exec`](/es/tools/exec) local.
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
    - La autenticación es solo por clave de API por ahora. OpenClaw todavía no tiene flujo OAuth ni de código de dispositivo para xAI.
    - `grok-4.20-multi-agent-experimental-beta-0304` no es compatible en la
      ruta normal del proveedor xAI porque requiere una superficie de API
      ascendente diferente del transporte estándar xAI de OpenClaw.
    - La voz Realtime de xAI todavía no está registrada como proveedor de OpenClaw. Requiere un contrato distinto de sesión de voz bidireccional al de STT por lotes o transcripción en streaming.
    - `quality` de imagen de xAI, `mask` de imagen y relaciones de aspecto adicionales exclusivas nativas no se
      exponen hasta que la herramienta compartida `image_generate` disponga de controles
      correspondientes entre proveedores.
  </Accordion>

  <Accordion title="Notas avanzadas">
    - OpenClaw aplica automáticamente correcciones de compatibilidad específicas de xAI para esquemas de herramientas y llamadas a herramientas
      en la ruta compartida del runner.
    - Las solicitudes nativas de xAI usan por defecto `tool_stream: true`. Establece
      `agents.defaults.models["xai/<model>"].params.tool_stream` en `false` para
      desactivarlo.
    - El envoltorio integrado de xAI elimina marcas estrictas no compatibles de esquemas de herramientas y
      claves de carga útil de razonamiento antes de enviar solicitudes nativas de xAI.
    - `web_search`, `x_search` y `code_execution` se exponen como herramientas de OpenClaw. OpenClaw habilita la función integrada específica de xAI que necesita dentro de cada
      solicitud de herramienta en lugar de adjuntar todas las herramientas nativas a cada turno de chat.
    - `x_search` y `code_execution` son propiedad del Plugin integrado de xAI y no están codificados de forma rígida en el runtime central del modelo.
    - `code_execution` es ejecución remota en el sandbox de xAI, no
      [`exec`](/es/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Pruebas en vivo

Las rutas multimedia de xAI están cubiertas por pruebas unitarias y por conjuntos de pruebas en vivo de activación explícita. Los comandos en vivo cargan secretos desde tu shell de inicio de sesión, incluido `~/.profile`, antes de
sondear `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

El archivo específico del proveedor en vivo sintetiza TTS normal, TTS PCM apto para telefonía,
transcribe audio mediante STT por lotes de xAI, transmite el mismo PCM mediante STT
en tiempo real de xAI, genera salida de texto a imagen y edita una imagen de referencia. El
archivo compartido de imagen en vivo verifica el mismo proveedor xAI a través de la
selección de runtime, conmutación por error, normalización y ruta de adjuntos multimedia de OpenClaw.

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de alternativas.
  </Card>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de vídeo y selección de proveedor.
  </Card>
  <Card title="Todos los proveedores" href="/es/providers/index" icon="grid-2">
    El resumen más amplio de proveedores.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y soluciones.
  </Card>
</CardGroup>
