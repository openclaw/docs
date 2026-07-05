---
read_when:
    - Quieres usar modelos Grok en OpenClaw
    - Estás configurando la autenticación de xAI o los identificadores de modelo
summary: Usar modelos xAI Grok en OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-05T11:38:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9dedad8793a7c54a4f46371e72095ff70e74886fc05d7321035bd09cadbf0efd
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw incluye un plugin de proveedor `xai` integrado para los modelos Grok. La
ruta recomendada es OAuth de Grok con una suscripción SuperGrok o X Premium
elegible. Gateway, la configuración, el enrutamiento y las herramientas permanecen
locales; solo las solicitudes de Grok van a la API de xAI.

OAuth no requiere una clave de API de xAI ni la aplicación Grok Build. xAI aún
puede mostrar Grok Build en la pantalla de consentimiento porque OpenClaw usa el
cliente OAuth compartido de xAI.

## Configuración

<Steps>
  <Step title="Instalación nueva">
    Ejecuta la incorporación con instalación del daemon y luego elige OAuth de
    xAI/Grok en el paso de modelo/autenticación:

    ```bash
    openclaw onboard --install-daemon
    ```

    En un VPS o por SSH, selecciona OAuth de xAI directamente; usa verificación
    con código de dispositivo y no necesita una devolución de llamada a localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Instalación existente">
    Inicia sesión solo en xAI; no vuelvas a ejecutar toda la incorporación solo
    para conectar Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Aplica Grok como modelo predeterminado por separado:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Vuelve a ejecutar toda la incorporación solo si quieres cambiar
    intencionalmente Gateway, el daemon, el canal, el espacio de trabajo u otras
    opciones de configuración.

  </Step>
  <Step title="Ruta con clave de API">
    La configuración con clave de API sigue funcionando para las claves de xAI
    Console y para las superficies de medios que necesitan configuración de
    proveedor respaldada por clave:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
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
OpenClaw usa la API Responses de xAI como transporte xAI integrado. La misma
credencial de `openclaw models auth login --provider xai --method oauth` o
`--method api-key` también impulsa `web_search` (id de proveedor `grok`),
`x_search`, `code_execution`, voz/transcripción y generación de imágenes/videos
de xAI. Si almacenas una clave de xAI en
`plugins.entries.xai.config.webSearch.apiKey`, el proveedor de modelos xAI
integrado también la reutiliza como alternativa.
</Note>

## Solución de problemas de OAuth

- Para SSH, Docker, VPS u otras configuraciones remotas, usa
  `openclaw models auth login --provider xai --method oauth`; usa verificación
  con código de dispositivo, no una devolución de llamada a localhost.
- Si el inicio de sesión se completa correctamente pero Grok no es el modelo
  predeterminado, ejecuta `openclaw models set xai/grok-4.3`.
- Inspecciona los perfiles de autenticación de xAI guardados:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI decide qué cuentas pueden recibir tokens de API OAuth. Si una cuenta no es
  elegible, usa la ruta con clave de API o revisa la suscripción del lado de xAI.

<Tip>
Usa `xai-oauth` al iniciar sesión desde SSH, Docker o un VPS. OpenClaw imprime
una URL y un código corto; termina el inicio de sesión en cualquier navegador
local mientras el proceso remoto consulta a xAI por el intercambio de token
completado.
</Tip>

## Catálogo integrado

IDs seleccionables en los selectores de modelo. El plugin aún resuelve IDs más
antiguos de Grok 3, Grok 4, Grok 4 Fast, Grok 4.1 Fast y Grok Code para
configuraciones existentes; consulta [alias de compatibilidad heredada](#legacy-compatibility-aliases).

| Familia        | IDs de modelo                                                            |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

<Tip>
Usa `grok-4.3` para chat general y `grok-build-0.1` para cargas de trabajo
enfocadas en compilación/codificación, salvo que necesites un alias beta de
Grok 4.20.
</Tip>

## Cobertura de funciones

El plugin integrado asigna la superficie actual de la API pública de xAI a los
contratos compartidos de proveedor y herramientas de OpenClaw. Las capacidades
que no encajan en el contrato compartido, como TTS en streaming y voz en tiempo
real, no se exponen.

| Capacidad de xAI                         | Superficie de OpenClaw                  | Estado                                                                    |
| ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| Chat / Responses                         | proveedor de modelo `xai/<model>`       | Sí                                                                        |
| Búsqueda web del lado del servidor       | proveedor `web_search` `grok`           | Sí                                                                        |
| Búsqueda X del lado del servidor         | herramienta `x_search`                  | Sí                                                                        |
| Ejecución de código del lado del servidor | herramienta `code_execution`            | Sí                                                                        |
| Imágenes                                 | `image_generate`                        | Sí                                                                        |
| Videos                                   | `video_generate`                        | Sí                                                                        |
| Texto a voz por lotes                    | `messages.tts.provider: "xai"` / `tts`  | Sí                                                                        |
| TTS en streaming                         | -                                       | No expuesto; el contrato TTS de OpenClaw devuelve búferes de audio completos |
| Voz a texto por lotes                    | comprensión de medios `tools.media.audio` | Sí                                                                      |
| Voz a texto en streaming                 | Voice Call `streaming.provider: "xai"`  | Sí                                                                        |
| Voz en tiempo real                       | -                                       | Aún no expuesto; necesita un contrato de sesión/WebSocket diferente       |
| Archivos / lotes                         | Solo compatibilidad con API genérica de modelo | No es una herramienta de OpenClaw de primera clase                  |

<Note>
OpenClaw usa las API REST de imagen/video/TTS/STT de xAI para generación de
medios y transcripción por lotes, el WebSocket STT en streaming de xAI para la
transcripción de llamadas de voz en vivo, y la API Responses para chat,
búsqueda y herramientas de ejecución de código.
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

### Alias de compatibilidad heredada

Los alias heredados se normalizan a los IDs integrados canónicos:

| Alias heredado                                                               | ID canónico                           |
| ---------------------------------------------------------------------------- | ------------------------------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825`                | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`                                                      | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning`                                                    | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`, `grok-4.20-experimental-beta-0304-reasoning`          | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning`, `grok-4.20-experimental-beta-0304-non-reasoning`  | `grok-4.20-beta-latest-non-reasoning` |

## Funciones

<AccordionGroup>
  <Accordion title="Búsqueda web">
    El proveedor integrado de búsqueda web `grok` prefiere OAuth de xAI y luego
    recurre a `XAI_API_KEY` o a una clave de búsqueda web del plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generación de video">
    El plugin `xai` integrado registra la generación de video mediante la
    herramienta compartida `video_generate`.

    - Modelo de video predeterminado: `xai/grok-imagine-video`
    - Modos: texto a video, imagen a video, generación con imagen de referencia, edición
      remota de video y extensión remota de video
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluciones: `480P`, `720P`
    - Duración: 1-15 segundos para generación/imagen a video, 1-10 segundos al
      usar roles `reference_image`, 2-10 segundos para extensión
    - Generación con imagen de referencia: define `imageRoles` como
      `reference_image` para cada imagen suministrada; xAI acepta hasta 7 de esas
      imágenes
    - Tiempo de espera de operación predeterminado: 600 segundos salvo que
      `video_generate.timeoutMs` o `agents.defaults.videoGenerationModel.timeoutMs`
      esté definido

    <Warning>
    No se aceptan búferes de video locales. Usa URL remotas `http(s)` para
    entradas de edición/extensión de video. Imagen a video acepta búferes de
    imagen locales porque OpenClaw los codifica como URL de datos para xAI.
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
    Consulta [Generación de video](/es/tools/video-generation) para parámetros de
    herramientas compartidas, selección de proveedor y comportamiento de
    conmutación por error.
    </Note>

  </Accordion>

  <Accordion title="Generación de imágenes">
    El plugin `xai` integrado registra la generación de imágenes mediante la
    herramienta compartida `image_generate`.

    - Modelo de imagen predeterminado: `xai/grok-imagine-image`
    - Modelo adicional: `xai/grok-imagine-image-quality`
    - Modos: texto a imagen y edición con imagen de referencia
    - Entradas de referencia: una `image` o hasta cinco `images`
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluciones: `1K`, `2K`
    - Cantidad: hasta 4 imágenes
    - Tiempo de espera de operación predeterminado: 600 segundos salvo que
      `image_generate.timeoutMs` o `agents.defaults.imageGenerationModel.timeoutMs`
      esté definido

    OpenClaw solicita a xAI respuestas de imagen `b64_json` para que los medios
    generados puedan almacenarse y entregarse por la ruta normal de adjuntos de
    canal. Las imágenes de referencia locales se convierten en URL de datos; las
    referencias remotas `http(s)` se pasan sin cambios.

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
    adicionales como `1:2`, `2:1`, `9:20` y `20:9`. Actualmente OpenClaw solo
    reenvía los controles de imagen compartidos entre proveedores; estos ajustes
    nativos exclusivos no se exponen mediante `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Texto a voz">
    El plugin `xai` integrado registra texto a voz mediante la superficie de
    proveedor compartida `tts`.

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
    OpenClaw usa el endpoint por lotes `/v1/tts` de xAI. xAI también ofrece TTS
    en streaming por WebSocket, pero el contrato del proveedor de voz de OpenClaw
    actualmente espera un búfer de audio completo antes de entregar la respuesta.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El plugin `xai` integrado registra voz a texto por lotes mediante la
    superficie de transcripción de comprensión de medios de OpenClaw.

    - Modelo predeterminado: `grok-stt`
    - Endpoint: REST de xAI `/v1/stt`
    - Ruta de entrada: carga de archivo de audio multipart
    - Se usa dondequiera que la transcripción de audio entrante lea `tools.media.audio`,
      incluidos los segmentos de canal de voz de Discord y los adjuntos de audio de canal

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

    El idioma se puede proporcionar mediante la configuración compartida de medios de audio o por solicitud de
    transcripción por llamada. La superficie compartida de OpenClaw acepta sugerencias de prompt,
    pero la integración STT REST de xAI reenvía solo archivo, modelo e
    idioma, porque se asignan claramente al endpoint público actual de xAI.

  </Accordion>

  <Accordion title="Transmisión de voz a texto">
    El Plugin `xai` incluido también registra un proveedor de transcripción en tiempo real
    para audio de llamadas de voz en directo.

    - Endpoint: WebSocket de xAI `wss://api.x.ai/v1/stt`
    - Codificación predeterminada: `mulaw`
    - Frecuencia de muestreo predeterminada: `8000`
    - Detección de fin de segmento predeterminada: `800ms`
    - Transcripciones provisionales: habilitadas de forma predeterminada

    El flujo multimedia de Twilio de Voice Call envía tramas de audio G.711 mu-law, por lo que el
    proveedor de xAI reenvía esas tramas directamente sin transcodificación:

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

    La configuración propiedad del proveedor reside en
    `plugins.entries.voice-call.config.streaming.providers.xai`. Las claves
    compatibles son `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` o
    `alaw`), `interimResults`, `endpointingMs` y `language`.

    <Note>
    Este proveedor de streaming es para la ruta de transcripción en tiempo real de Voice Call.
    La voz de Discord graba segmentos cortos y usa en su lugar la ruta de transcripción por lotes
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuración de x_search">
    El Plugin xAI incluido expone `x_search` como una herramienta de OpenClaw para
    buscar contenido de X (anteriormente Twitter) mediante Grok.

    Ruta de configuración: `plugins.entries.xai.config.xSearch`

    | Clave             | Tipo    | Predeterminado              | Descripción                          |
    | ----------------- | ------- | ------------------------------ | ------------------------------------- |
    | `enabled`         | boolean | `true` (si la clave está disponible) | Habilitar o deshabilitar x_search           |
    | `model`           | string  | `grok-4-1-fast-non-reasoning` | Modelo usado para solicitudes de x_search     |
    | `baseUrl`         | string  | -                              | Sobrescritura de la URL base de Responses de xAI      |
    | `inlineCitations` | boolean | -                              | Incluir citas en línea en los resultados  |
    | `maxTurns`        | number  | -                              | Máximo de turnos de conversación            |
    | `timeoutSeconds`  | number  | `30`                           | Tiempo de espera de la solicitud en segundos            |
    | `cacheTtlMinutes` | number  | `15`                           | Tiempo de vida de la caché en minutos         |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast-non-reasoning",
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
    El Plugin xAI incluido expone `code_execution` como una herramienta de OpenClaw para
    la ejecución remota de código en el entorno de sandbox de xAI.

    Ruta de configuración: `plugins.entries.xai.config.codeExecution`

    | Clave            | Tipo    | Predeterminado           | Descripción                            |
    | ---------------- | ------- | -------------------------- | ---------------------------------------- |
    | `enabled`        | boolean | `true` (si la clave está disponible) | Habilitar o deshabilitar la ejecución de código        |
    | `model`          | string  | `grok-4-1-fast`           | Modelo usado para solicitudes de ejecución de código  |
    | `maxTurns`       | number  | -                           | Máximo de turnos de conversación              |
    | `timeoutSeconds` | number  | `30`                        | Tiempo de espera de la solicitud en segundos              |

    <Note>
    Esto es ejecución remota en sandbox de xAI, no [`exec`](/es/tools/exec) local.
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
    - La autenticación de xAI puede usar una clave de API, una variable de entorno, una alternativa de configuración del Plugin
      u OAuth con una cuenta de xAI elegible. OAuth usa verificación con código de dispositivo
      sin callback de localhost. xAI decide qué cuentas
      pueden recibir tokens de API de OAuth, y la página de consentimiento puede mostrar Grok Build
      aunque OpenClaw no requiera la aplicación Grok Build.
    - OpenClaw no expone actualmente la familia de modelos multiagente de xAI. xAI
      sirve estos modelos mediante la Responses API, pero no aceptan
      las herramientas del lado del cliente ni personalizadas que usa el bucle de agente compartido de OpenClaw.
      Consulta las
      [limitaciones multiagente de xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - La voz Realtime de xAI aún no está registrada como proveedor de OpenClaw. Necesita
      un contrato de sesión de voz bidireccional distinto al de STT por lotes
      o transcripción en streaming.
    - La `quality` de imagen de xAI, la `mask` de imagen y las relaciones de aspecto adicionales solo nativas
      no se exponen hasta que la herramienta compartida `image_generate` tenga
      los controles correspondientes entre proveedores.
  </Accordion>

  <Accordion title="Notas avanzadas">
    - OpenClaw aplica automáticamente correcciones de compatibilidad de esquema de herramientas y llamada a herramientas
      específicas de xAI en la ruta del ejecutor compartido.
    - Las solicitudes nativas de xAI usan `tool_stream: true` de forma predeterminada. Define
      `agents.defaults.models["xai/<model>"].params.tool_stream` como `false`
      para deshabilitarlo.
    - El wrapper xAI incluido elimina flags estrictos de esquema de herramientas no compatibles y
      claves de carga útil de *effort* de razonamiento antes de enviar solicitudes nativas de xAI. Solo
      `grok-4.3` / `grok-4.3-*` anuncian esfuerzo de razonamiento configurable; todos
      los demás modelos de xAI con capacidad de razonamiento siguen solicitando
      `include: ["reasoning.encrypted_content"]` para que el razonamiento cifrado previo
      pueda reproducirse en turnos de seguimiento.
    - `web_search`, `x_search` y `code_execution` se exponen como herramientas de OpenClaw.
      OpenClaw adjunta solo el elemento integrado específico de xAI que necesita cada herramienta
      a la solicitud de esa herramienta, en lugar de adjuntar todas las herramientas nativas a cada
      turno de chat.
    - `web_search` de Grok lee `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` lee `plugins.entries.xai.config.xSearch.baseUrl` y luego
      recurre a la URL base de búsqueda web de Grok.
    - `x_search` y `code_execution` son propiedad del Plugin xAI incluido,
      en lugar de estar codificados directamente en el runtime del modelo principal.
    - `code_execution` es ejecución remota en sandbox de xAI, no
      [`exec`](/es/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Pruebas en directo

Las rutas multimedia de xAI están cubiertas por pruebas unitarias y conjuntos en directo opcionales. Exporta
`XAI_API_KEY` en el entorno del proceso antes de ejecutar sondeos en directo.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

El archivo en directo específico del proveedor sintetiza TTS normal, PCM
TTS adecuado para telefonía, transcribe audio mediante STT por lotes de xAI, transmite el mismo PCM mediante STT
en tiempo real de xAI, genera salida de texto a imagen y edita una imagen de referencia.
El archivo en directo de imagen compartida verifica el mismo proveedor xAI mediante la
selección de runtime de OpenClaw, fallback, normalización y ruta de adjuntos multimedia.

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros de la herramienta de video compartida y selección de proveedor.
  </Card>
  <Card title="Todos los proveedores" href="/es/providers/index" icon="grid-2">
    La descripción general más amplia de proveedores.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y correcciones.
  </Card>
</CardGroup>
