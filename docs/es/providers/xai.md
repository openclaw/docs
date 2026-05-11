---
read_when:
    - Quieres usar modelos de Grok en OpenClaw
    - Estás configurando la autenticación de xAI o los identificadores de modelo
summary: Usar modelos Grok de xAI en OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-11T20:51:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: f11c31e7ff39e7e13465b48d819db3921a32ed624676a57dc38f97c0dbd21e46
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw incluye un Plugin de proveedor `xai` integrado para modelos Grok.

## Primeros pasos

<Steps>
  <Step title="Crear una clave de API">
    Crea una clave de API en la [consola de xAI](https://console.x.ai/).
  </Step>
  <Step title="Configurar tu clave de API">
    Configura `XAI_API_KEY` o ejecuta:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Elegir un modelo">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw usa la API Responses de xAI como el transporte xAI integrado. La misma
clave de API de `openclaw onboard --auth-choice xai-api-key` también puede alimentar
`x_search` de primera clase y `code_execution` remoto; `XAI_API_KEY` o la configuración
de búsqueda web del Plugin también pueden alimentar `web_search` respaldado por Grok.
Si almacenas una clave de xAI en `plugins.entries.xai.config.webSearch.apiKey`,
el proveedor de modelos xAI integrado también reutiliza esa clave como alternativa.
Configura `plugins.entries.xai.config.webSearch.baseUrl` para enrutar `web_search`
de Grok y, de forma predeterminada, `x_search` a través de un proxy operator xAI Responses.
El ajuste de `code_execution` reside en `plugins.entries.xai.config.codeExecution`.
</Note>

## Catálogo integrado

OpenClaw incluye estas familias de modelos xAI listas para usar:

| Familia        | Ids de modelo                                                           |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

El Plugin también resuelve hacia adelante ids `grok-4*` y `grok-code-fast*` más recientes cuando
siguen la misma forma de API.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` y las variantes `grok-4.20-beta-*`
son las referencias Grok con capacidad de imagen actuales en el catálogo integrado.
</Tip>

## Cobertura de funciones de OpenClaw

El Plugin integrado asigna la superficie pública actual de la API de xAI a los contratos
compartidos de proveedor y herramientas de OpenClaw. Las capacidades que no encajan en el contrato compartido
(por ejemplo, TTS en streaming y voz en tiempo real) no se exponen; consulta la tabla
siguiente.

| Capacidad de xAI            | Superficie de OpenClaw                    | Estado                                                              |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses            | proveedor de modelos `xai/<model>`        | Sí                                                                  |
| Búsqueda web del servidor   | proveedor `web_search` `grok`             | Sí                                                                  |
| Búsqueda X del servidor     | herramienta `x_search`                    | Sí                                                                  |
| Ejecución de código del servidor | herramienta `code_execution`          | Sí                                                                  |
| Imágenes                    | `image_generate`                          | Sí                                                                  |
| Vídeos                      | `video_generate`                          | Sí                                                                  |
| Texto a voz por lotes       | `messages.tts.provider: "xai"` / `tts`    | Sí                                                                  |
| TTS en streaming            | -                                         | No expuesto; el contrato TTS de OpenClaw devuelve búferes de audio completos |
| Voz a texto por lotes       | `tools.media.audio` / comprensión de medios | Sí                                                                |
| Voz a texto en streaming    | Voice Call `streaming.provider: "xai"`    | Sí                                                                  |
| Voz en tiempo real          | -                                         | Aún no expuesto; contrato de sesión/WebSocket diferente             |
| Archivos / lotes            | Solo compatibilidad genérica con la API de modelos | No es una herramienta OpenClaw de primera clase              |

<Note>
OpenClaw usa las API REST de imagen/vídeo/TTS/STT de xAI para generación de medios,
voz y transcripción por lotes, el WebSocket de STT en streaming de xAI para la transcripción
en vivo de llamadas de voz, y la API Responses para herramientas de modelo, búsqueda y
ejecución de código. Las funciones que necesitan contratos de OpenClaw diferentes, como
sesiones de voz en tiempo real, se documentan aquí como capacidades upstream en lugar
de comportamiento oculto del Plugin.
</Note>

### Asignaciones de modo rápido

`/fast on` o `agents.defaults.models["xai/<model>"].params.fastMode: true`
reescribe las solicitudes nativas de xAI de la siguiente manera:

| Modelo de origen | Destino de modo rápido |
| ---------------- | ---------------------- |
| `grok-3`         | `grok-3-fast`          |
| `grok-3-mini`    | `grok-3-mini-fast`     |
| `grok-4`         | `grok-4-fast`          |
| `grok-4-0709`    | `grok-4-fast`          |

### Alias de compatibilidad heredados

Los alias heredados aún se normalizan a los ids integrados canónicos:

| Alias heredado            | Id canónico                           |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funciones

<AccordionGroup>
  <Accordion title="Búsqueda web">
    El proveedor de búsqueda web `grok` integrado puede usar `XAI_API_KEY` o una clave
    de búsqueda web del Plugin:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generación de vídeo">
    El Plugin `xai` integrado registra la generación de vídeo mediante la herramienta
    compartida `video_generate`.

    - Modelo de vídeo predeterminado: `xai/grok-imagine-video`
    - Modos: texto a vídeo, imagen a vídeo, generación con imagen de referencia, edición
      de vídeo remoto y extensión de vídeo remoto
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluciones: `480P`, `720P`
    - Duración: 1-15 segundos para generación/imagen a vídeo, 1-10 segundos al
      usar roles `reference_image`, 2-10 segundos para extensión
    - Generación con imagen de referencia: configura `imageRoles` como `reference_image` para
      cada imagen proporcionada; xAI acepta hasta 7 imágenes de este tipo

    <Warning>
    No se aceptan búferes de vídeo locales. Usa URL `http(s)` remotas para
    entradas de edición/extensión de vídeo. Imagen a vídeo acepta búferes de imagen locales porque
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
    Consulta [Generación de vídeo](/es/tools/video-generation) para ver los parámetros de la herramienta compartida,
    la selección de proveedor y el comportamiento de conmutación por error.
    </Note>

  </Accordion>

  <Accordion title="Generación de imágenes">
    El Plugin `xai` integrado registra la generación de imágenes mediante la herramienta
    compartida `image_generate`.

    - Modelo de imagen predeterminado: `xai/grok-imagine-image`
    - Modelo adicional: `xai/grok-imagine-image-pro`
    - Modos: texto a imagen y edición con imagen de referencia
    - Entradas de referencia: una `image` o hasta cinco `images`
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluciones: `1K`, `2K`
    - Recuento: hasta 4 imágenes

    OpenClaw solicita a xAI respuestas de imagen `b64_json` para que los medios generados puedan
    almacenarse y entregarse mediante la ruta normal de adjuntos de canal. Las imágenes de referencia
    locales se convierten en URL de datos; las referencias `http(s)` remotas se transmiten
    sin cambios.

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
    como `1:2`, `2:1`, `9:20` y `20:9`. OpenClaw solo reenvía hoy los
    controles de imagen compartidos entre proveedores; los controles nativos no compatibles
    no se exponen intencionadamente mediante `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Texto a voz">
    El Plugin `xai` integrado registra texto a voz mediante la superficie de proveedor `tts`
    compartida.

    - Voces: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voz predeterminada: `eve`
    - Formatos: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Idioma: código BCP-47 o `auto`
    - Velocidad: anulación de velocidad nativa del proveedor
    - El formato nativo Opus de nota de voz no es compatible

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
    mediante WebSocket, pero el contrato de proveedor de voz de OpenClaw actualmente espera
    un búfer de audio completo antes de entregar la respuesta.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El Plugin `xai` integrado registra voz a texto por lotes mediante la superficie de
    transcripción de comprensión de medios de OpenClaw.

    - Modelo predeterminado: `grok-stt`
    - Endpoint: REST de xAI `/v1/stt`
    - Ruta de entrada: carga de archivo de audio multipart
    - Compatible en OpenClaw dondequiera que la transcripción de audio entrante use
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

    El idioma puede proporcionarse mediante la configuración compartida de medios de audio o por solicitud
    de transcripción individual. La superficie compartida de OpenClaw acepta indicaciones de prompt,
    pero la integración STT REST de xAI solo reenvía archivo, modelo e
    idioma porque se asignan claramente al endpoint público actual de xAI.

  </Accordion>

  <Accordion title="Voz a texto en streaming">
    El Plugin `xai` integrado también registra un proveedor de transcripción en tiempo real
    para audio de llamadas de voz en vivo.

    - Endpoint: WebSocket de xAI `wss://api.x.ai/v1/stt`
    - Codificación predeterminada: `mulaw`
    - Frecuencia de muestreo predeterminada: `8000`
    - Detección de finalización predeterminada: `800ms`
    - Transcripciones provisionales: habilitadas de forma predeterminada

    El flujo de medios de Twilio de Voice Call envía tramas de audio G.711 µ-law, por lo que el
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
    `plugins.entries.voice-call.config.streaming.providers.xai`. Las claves
    admitidas son `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` o
    `alaw`), `interimResults`, `endpointingMs` y `language`.

    <Note>
    Este proveedor de streaming es para la ruta de transcripción en tiempo real
    de Voice Call. Actualmente, la voz de Discord graba segmentos cortos y usa
    en su lugar la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuración de x_search">
    El Plugin xAI incluido expone `x_search` como una herramienta de OpenClaw
    para buscar contenido de X (antes Twitter) mediante Grok.

    Ruta de configuración: `plugins.entries.xai.config.xSearch`

    | Clave              | Tipo    | Predeterminado     | Descripción                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Habilita o deshabilita x_search      |
    | `model`            | string  | `grok-4-1-fast`    | Modelo usado para solicitudes x_search |
    | `baseUrl`          | string  | -                  | Anulación de URL base de xAI Responses |
    | `inlineCitations`  | boolean | -                  | Incluye citas en línea en los resultados |
    | `maxTurns`         | number  | -                  | Número máximo de turnos de conversación |
    | `timeoutSeconds`   | number  | -                  | Tiempo de espera de la solicitud en segundos |
    | `cacheTtlMinutes`  | number  | -                  | Tiempo de vida de la caché en minutos |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                baseUrl: "https://api.x.ai/v1",
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
    El Plugin xAI incluido expone `code_execution` como una herramienta de
    OpenClaw para la ejecución remota de código en el entorno sandbox de xAI.

    Ruta de configuración: `plugins.entries.xai.config.codeExecution`

    | Clave             | Tipo    | Predeterminado     | Descripción                          |
    | ----------------- | ------- | ------------------ | ------------------------------------ |
    | `enabled`         | boolean | `true` (si la clave está disponible) | Habilita o deshabilita la ejecución de código |
    | `model`           | string  | `grok-4-1-fast`    | Modelo usado para solicitudes de ejecución de código |
    | `maxTurns`        | number  | -                  | Número máximo de turnos de conversación |
    | `timeoutSeconds`  | number  | -                  | Tiempo de espera de la solicitud en segundos |

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
    - Actualmente, la autenticación solo admite clave de API. La clave de API se
      puede almacenar en un perfil de autenticación de xAI, una variable de entorno
      o la configuración del Plugin; todavía no hay OAuth de xAI ni flujo de código
      de dispositivo en OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` no es compatible con la ruta
      normal del proveedor xAI porque requiere una superficie de API ascendente
      distinta de la del transporte xAI estándar de OpenClaw.
    - La voz en tiempo real de xAI todavía no está registrada como proveedor de
      OpenClaw. Necesita un contrato de sesión de voz bidireccional distinto del
      STT por lotes o la transcripción por streaming.
    - La `quality` de imagen de xAI, el `mask` de imagen y las relaciones de aspecto
      adicionales solo nativas no se exponen hasta que la herramienta compartida
      `image_generate` tenga los controles correspondientes entre proveedores.
  </Accordion>

  <Accordion title="Notas avanzadas">
    - OpenClaw aplica automáticamente correcciones de compatibilidad específicas de
      xAI para esquemas de herramientas y llamadas a herramientas en la ruta del
      ejecutor compartido.
    - Las solicitudes nativas de xAI usan `tool_stream: true` de forma predeterminada.
      Define `agents.defaults.models["xai/<model>"].params.tool_stream` como `false`
      para deshabilitarlo.
    - El wrapper xAI incluido elimina marcas estrictas de esquemas de herramientas
      no admitidas y claves de payload de razonamiento antes de enviar solicitudes
      nativas de xAI.
    - `web_search`, `x_search` y `code_execution` se exponen como herramientas de
      OpenClaw. OpenClaw habilita la función integrada específica de xAI que
      necesita dentro de cada solicitud de herramienta, en lugar de adjuntar todas
      las herramientas nativas a cada turno de chat.
    - `web_search` de Grok lee `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` lee `plugins.entries.xai.config.xSearch.baseUrl` y luego recurre
      a la URL base de búsqueda web de Grok.
    - `x_search` y `code_execution` son propiedad del Plugin xAI incluido, en lugar
      de estar codificados de forma rígida en el runtime del modelo principal.
    - `code_execution` es ejecución remota en el sandbox de xAI, no
      [`exec`](/es/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Pruebas en vivo

Las rutas multimedia de xAI están cubiertas por pruebas unitarias y suites en vivo
opcionales. Los comandos en vivo cargan secretos desde tu shell de inicio de sesión,
incluido `~/.profile`, antes de sondear `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

El archivo en vivo específico del proveedor sintetiza TTS normal, TTS PCM apto
para telefonía, transcribe audio mediante STT por lotes de xAI, transmite el
mismo PCM mediante STT en tiempo real de xAI, genera salida de texto a imagen y
edita una imagen de referencia. El archivo en vivo de imagen compartida verifica
el mismo proveedor xAI mediante la selección de runtime, fallback, normalización
y ruta de adjuntos multimedia de OpenClaw.

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros de herramienta de video compartida y selección de proveedor.
  </Card>
  <Card title="Todos los proveedores" href="/es/providers/index" icon="grid-2">
    La descripción general más amplia de proveedores.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y correcciones.
  </Card>
</CardGroup>
