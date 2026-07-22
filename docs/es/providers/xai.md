---
read_when:
    - Quieres usar modelos de Grok en OpenClaw
    - Está configurando la autenticación o los identificadores de modelos de xAI
summary: Usar modelos Grok de xAI en OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-22T11:01:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71ae7b049649b08b6508b8331714fec3464628814629256ad23b584f0f8ca8b7
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw incluye un Plugin de proveedor `xai` integrado para los modelos Grok. La
ruta recomendada es OAuth de Grok con una suscripción SuperGrok o X Premium
válida. El Gateway, la configuración, el enrutamiento y las herramientas permanecen en local; solo las solicitudes
de Grok se envían a la API de xAI.

OAuth no requiere una clave de API de xAI ni la aplicación Grok Build. Es posible que xAI siga
mostrando Grok Build en la pantalla de consentimiento porque OpenClaw utiliza el cliente
OAuth compartido de xAI.

## Configuración

<Steps>
  <Step title="Nueva instalación">
    Ejecuta la incorporación con la instalación del daemon y, a continuación, elige OAuth de xAI/Grok en el
    paso de modelo/autenticación:

    ```bash
    openclaw onboard --install-daemon
    ```

    En un VPS o mediante SSH, selecciona OAuth de xAI directamente; utiliza la verificación
    mediante código de dispositivo y no necesita una devolución de llamada a localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Instalación existente">
    Inicia sesión únicamente en xAI; no vuelvas a ejecutar toda la incorporación solo para conectar Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Establece Grok como modelo predeterminado por separado:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Vuelve a ejecutar toda la incorporación únicamente si deseas cambiar de forma intencionada el Gateway,
    el daemon, el canal, el espacio de trabajo u otras opciones de configuración.

  </Step>
  <Step title="Ruta con clave de API">
    La configuración con clave de API sigue funcionando con las claves de xAI Console y con las superficies multimedia
    que necesitan una configuración de proveedor respaldada por una clave:

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
OpenClaw utiliza la API Responses de xAI como transporte de xAI integrado. La misma
credencial de `openclaw models auth login --provider xai --method oauth` o
`--method api-key` también proporciona acceso a `web_search` (id. de proveedor `grok`), `x_search`,
`code_execution`, voz/transcripción y generación de imágenes/vídeos de xAI. Si se
almacena una clave de xAI en `plugins.entries.xai.config.webSearch.apiKey`, el
proveedor de modelos de xAI integrado también la reutiliza como alternativa.
</Note>

## Solución de problemas de OAuth

- Para SSH, Docker, VPS u otras configuraciones remotas, utiliza
  `openclaw models auth login --provider xai --method oauth`; emplea
  la verificación mediante código de dispositivo, no una devolución de llamada a localhost.
- Si el inicio de sesión se realiza correctamente, pero Grok no es el modelo predeterminado, ejecuta
  `openclaw models set xai/grok-4.3`.
- Inspecciona los perfiles de autenticación de xAI guardados:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI decide qué cuentas pueden recibir tokens de API de OAuth. Si una cuenta
  no cumple los requisitos, utiliza la ruta con clave de API o comprueba la suscripción en xAI.

<Tip>
Utiliza `xai-oauth` al iniciar sesión desde SSH, Docker o un VPS. OpenClaw muestra una
URL y un código corto; completa el inicio de sesión en cualquier navegador local mientras el proceso
remoto consulta a xAI hasta que finalice el intercambio de tokens.
</Tip>

## Catálogo integrado

Identificadores seleccionables en los selectores de modelos. El Plugin sigue resolviendo identificadores antiguos de Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast y Grok Code para las configuraciones existentes;
consulta [compatibilidad heredada y alias cambiantes](#legacy-compatibility-and-moving-aliases).

| Familia        | Identificadores de modelo                                     |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (alias: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (alias: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Utiliza `grok-4.5` para chat general, programación y trabajo con agentes cuando esté disponible.
Grok 4.3 sigue siendo el valor predeterminado de configuración seguro para todas las regiones; `grok-build-0.1` y ambas
variantes con fecha de Grok 4.20 siguen siendo seleccionables.
</Tip>

Los metadatos de contexto del catálogo y de coste de tokens siguen las
[páginas de modelos](https://docs.x.ai/developers/models) y la
[página de precios](https://docs.x.ai/developers/pricing) activas de xAI. xAI aplica tarifas superiores
cuando una solicitud supera su umbral documentado de contexto largo; los campos de coste fijos
del catálogo de OpenClaw registran las tarifas de contexto corto. Grok Build, la CLI independiente
de agente de programación de xAI, está disponible en [x.ai/cli](https://x.ai/cli) y actualmente
utiliza Grok 4.5.

## Cobertura de funciones

El Plugin integrado asigna las API compatibles de xAI a los contratos compartidos de proveedores y
herramientas de OpenClaw. Las capacidades que no se ajustan al contrato compartido se indican
a continuación o en las limitaciones conocidas.

| Capacidad de xAI                  | Superficie de OpenClaw                      | Estado                                               |
| --------------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| Chat / Responses                  | Proveedor de modelos `xai/<model>`          | Sí                                                   |
| Búsqueda web del lado del servidor | Proveedor `web_search` `grok`         | Sí                                                   |
| Búsqueda en X del lado del servidor | Herramienta `x_search`                    | Sí                                                   |
| Ejecución de código del lado del servidor | Herramienta `code_execution`             | Sí                                                   |
| Imágenes                          | `image_generate`                          | Sí                                                   |
| Vídeos                            | `video_generate`                          | Sí                                                   |
| Texto a voz por lotes             | `tts.provider: "xai"` / `tts`           | Sí                                                   |
| TTS en streaming                  | `textToSpeechStream`                          | Sí, mediante `wss://api.x.ai/v1/tts` (no voz en tiempo real) |
| Voz a texto por lotes             | Comprensión multimedia `tools.media.audio`   | Sí                                                   |
| Voz a texto en streaming          | Voice Call `streaming.provider: "xai"`               | Sí                                                   |
| Voz en tiempo real                | Talk `talk.realtime.provider: "xai"`                     | Sí; retransmisión mediante gateway para nodos Talk nativos |
| Archivos / lotes                  | Solo compatibilidad con la API genérica de modelos | No es una herramienta de OpenClaw de primera clase |

<Note>
OpenClaw utiliza las API REST de imagen/vídeo/TTS/STT de xAI para la generación multimedia y
la transcripción por lotes, el WebSocket de STT en streaming de xAI para la transcripción
en directo de llamadas de voz, el WebSocket de Grok Voice Agent de xAI para las sesiones
Talk en tiempo real y la API Responses para el chat, la búsqueda y las herramientas de ejecución de código.
</Note>

### Compatibilidad heredada con el modo rápido

`/fast on` o `agents.defaults.models["xai/<model>"].params.fastMode: true`
siguen reescribiendo las configuraciones antiguas de xAI del siguiente modo. Estos identificadores de destino
se conservan únicamente por compatibilidad; utiliza los modelos seleccionables actuales para las
configuraciones nuevas.

| Modelo de origen | Destino del modo rápido |
| ---------------- | ----------------------- |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Compatibilidad heredada y alias cambiantes

Los alias antiguos se normalizan del siguiente modo:

| Alias heredado                                                | Id. normalizado   |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

Los identificadores 0309 con fecha son las entradas seleccionables del catálogo. OpenClaw envía literalmente todos los demás
alias actuales de Grok 4.20 para que xAI conserve el control de la semántica de los alias estables, más recientes,
beta, experimentales y con fecha. El alias global `grok-latest` también se
conserva literalmente.

xAI retiró los siguientes identificadores exactos. OpenClaw los conserva como filas de compatibilidad ocultas
para las configuraciones publicadas, con los límites y precios de sus destinos
de redirección actuales:

| Identificadores retirados                                            | Comportamiento actual             |
| -------------------------------------------------------------------- | --------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 con razonamiento `low` |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 con el razonamiento desactivado |
| `grok-code-fast-1`                                                   | Grok Build 0.1                    |
| `grok-imagine-image-pro`                                             | Calidad de imagen de Grok Imagine |

`openclaw doctor --fix` actualiza los valores predeterminados persistidos de las herramientas de servidor de xAI y el
slug retirado de imagen de calidad, elimina filas obsoletas del catálogo generado y repara
los metadatos de contexto obsoletos en las filas 4.20 activas. No fija los alias activos
`beta-latest` de 4.20 a una instantánea con fecha.

## Funciones

<Warning>
  `x_search` y `code_execution` se ejecutan en los servidores de xAI. xAI factura $5 por cada 1,000
  llamadas a herramientas, además de los tokens de entrada y salida del modelo. Cuando se omite la
  configuración `enabled` de cada herramienta, OpenClaw solo la expone para un modelo de xAI activo.
  Un proveedor de modelos conocido que no es de xAI requiere un valor `enabled: true` explícito por herramienta;
  si el proveedor falta o no se puede resolver, se produce un cierre seguro. La autenticación de xAI siempre es obligatoria,
  y `enabled: false` desactiva la herramienta para todos los proveedores.
</Warning>

<AccordionGroup>
  <Accordion title="Búsqueda web">
    El proveedor de búsqueda web `grok` integrado prefiere OAuth de xAI y, a continuación, recurre
    a `XAI_API_KEY` o a una clave de búsqueda web del Plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generación de vídeo">
    El Plugin `xai` integrado registra la generación de vídeo mediante la herramienta compartida
    `video_generate`.

    - Modelo predeterminado: `xai/grok-imagine-video`
    - Modelo adicional: `xai/grok-imagine-video-1.5`
    - Modos clásicos: texto a vídeo, imagen a vídeo, generación a partir de imágenes de referencia,
      edición remota de vídeo y extensión remota de vídeo
    - Modo Video 1.5: solo imagen a vídeo, con exactamente una imagen de primer fotograma
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      los modos clásicos y el modo de imagen a vídeo de Video 1.5 heredan la relación de la imagen de origen cuando
      se omite
    - Resoluciones: clásicas `480P`/`720P`; Video 1.5 también admite `1080P`; todos los
      modos de generación utilizan `480P` de forma predeterminada
    - Duración: 1-15 segundos para generación/imagen a vídeo, 1-10 segundos al
      utilizar roles clásicos `reference_image`, 2-10 segundos para la extensión clásica
    - Generación a partir de imágenes de referencia: establece `imageRoles` en `reference_image` para
      cada imagen proporcionada; xAI acepta hasta 7 imágenes de este tipo
    - La edición/extensión de vídeo hereda la relación de aspecto y la resolución del vídeo de entrada;
      esas operaciones no aceptan anulaciones de geometría
    - Tiempo de espera predeterminado de la operación: 600 segundos, salvo que se establezca `video_generate.timeoutMs`
      o `agents.defaults.mediaModels.video.timeoutMs`

    <Warning>
    No se aceptan búferes de vídeo locales. Utiliza URL remotas `http(s)` para las entradas de
    edición/extensión de vídeo. El modo de imagen a vídeo acepta búferes de imágenes locales porque
    OpenClaw los codifica como URL de datos para xAI.
    </Warning>

    Video 1.5 también reconoce los identificadores `grok-imagine-video-1.5-preview` y
    `grok-imagine-video-1.5-2026-05-30` de xAI. OpenClaw reenvía el
    identificador seleccionado sin modificarlo, pero aplica la misma validación exclusiva para imágenes.

    Para utilizar xAI como proveedor de vídeo predeterminado:

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
    Consulta [Generación de vídeo](/es/tools/video-generation) para conocer los parámetros
    compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
    </Note>

  </Accordion>

  <Accordion title="Generación de imágenes">
    El plugin `xai` incluido registra la generación de imágenes mediante la herramienta
    compartida `image_generate`.

    - Modelo de imagen predeterminado: `xai/grok-imagine-image`
    - Modelo adicional: `xai/grok-imagine-image-quality`
    - Modos: texto a imagen y edición de imagen de referencia
    - Entradas de referencia: una `image` o hasta tres `images`
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Resoluciones: `1K`, `2K`
    - Cantidad: hasta 4 imágenes
    - Tiempo de espera predeterminado de la operación: 600 segundos, salvo que se configure `image_generate.timeoutMs`
      o `agents.defaults.mediaModels.image.timeoutMs`

    OpenClaw solicita a xAI respuestas de imagen `b64_json` para que los archivos multimedia generados puedan
    almacenarse y entregarse mediante la ruta normal de archivos adjuntos del canal. Las imágenes
    de referencia locales se convierten en URL de datos; las referencias remotas `http(s)`
    se transfieren sin cambios.

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
    xAI también documenta `quality`, `mask`, `user` y una relación de aspecto `auto`.
    Actualmente, OpenClaw solo reenvía los controles de imagen compartidos entre proveedores;
    estas opciones exclusivas del proveedor nativo no se exponen mediante `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Texto a voz">
    El plugin `xai` incluido registra la conversión de texto a voz mediante la superficie
    compartida del proveedor `tts`.

    - Voces: catálogo activo autenticado de xAI; se puede enumerar con
      `openclaw infer tts voices --provider xai`
    - Voces alternativas sin conexión: `ara`, `eve`, `leo`, `rex`, `sal`
    - Voz predeterminada: `eve`
    - Los identificadores de voces personalizadas de la cuenta se reenvían aunque no aparezcan en la
      respuesta del catálogo integrado
    - Formatos: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Idioma: código BCP-47 o `auto`
    - Velocidad: anulación de velocidad nativa del proveedor
    - No se admite el formato nativo Opus para notas de voz

    Para usar xAI como proveedor de TTS predeterminado:

    ```json5
    {
      tts: {
        provider: "xai",
        providers: {
          xai: {
            voiceId: "eve",
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw usa el endpoint por lotes `/v1/tts` de xAI para la síntesis almacenada en búfer,
    la detección autenticada del catálogo `/v1/tts/voices` y el recurso nativo
    `wss://api.x.ai/v1/tts` para la síntesis por streaming. El streaming está restringido al
    host nativo `api.x.ai`, por lo que se rechazan los valores personalizados de `baseUrl` en esta
    ruta. Utiliza los controles existentes de idioma, voz, códec y velocidad; se aplican
    los valores predeterminados de xAI para la frecuencia de muestreo y la tasa de bits. La síntesis de archivos de audio respeta todos
    los códecs configurados. Los destinos de notas de voz usan MP3 para el streaming y la alternativa
    almacenada en búfer porque los códecs sin procesar de xAI no incluyen metadatos de códec/frecuencia. El
    flujo envía `text.delta` y después
    `text.done`, recibe `audio.delta`, `audio.done` o `error`, y aplica un
    `timeoutMs` de inactividad que se actualiza con cada fragmento de audio. Es independiente de
    las sesiones de voz en tiempo real. Consulta el contrato de la [API de TTS por streaming](https://docs.x.ai/developers/rest-api-reference/inference/voice) de xAI.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El plugin `xai` incluido registra la conversión por lotes de voz a texto mediante la
    superficie de transcripción de comprensión multimedia de OpenClaw.

    - Endpoint: REST de xAI `/v1/stt`
    - Ruta de entrada: carga de archivo de audio multipart
    - Selección del modelo: xAI elige internamente el modelo de transcripción; el
      endpoint no dispone de selector de modelo
    - Se utiliza dondequiera que la transcripción de audio entrante lea `tools.media.audio`,
      incluidos los segmentos de canales de voz de Discord y los archivos adjuntos de audio de los canales

    Para forzar el uso de xAI en la transcripción de audio entrante:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    El idioma se puede proporcionar mediante la configuración compartida de medios de audio o en cada
    solicitud de transcripción. La superficie compartida de OpenClaw acepta indicaciones de prompt,
    pero la integración REST de STT de xAI solo reenvía el archivo y el idioma
    porque son los únicos que corresponden al endpoint público actual de xAI.

  </Accordion>

  <Accordion title="Voz a texto por streaming">
    El plugin `xai` incluido también registra un proveedor de transcripción en tiempo real
    para el audio de llamadas de voz en directo.

    - Endpoint: WebSocket de xAI `wss://api.x.ai/v1/stt`
    - Codificación predeterminada: `mulaw`
    - Frecuencia de muestreo predeterminada: `8000`
    - Detección de fin de intervención predeterminada: `800ms`
    - Transcripciones provisionales: habilitadas de forma predeterminada

    El flujo multimedia de Twilio de Voice Call envía tramas de audio G.711 mu-law, por lo que el
    proveedor de xAI reenvía esas tramas directamente sin transcodificarlas:

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
    Este proveedor de streaming se usa en la ruta de transcripción en tiempo real de Voice Call.
    Discord graba segmentos cortos y utiliza en su lugar la ruta de transcripción por lotes
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz en tiempo real (Talk)">
    El plugin `xai` incluido registra sesiones en tiempo real de Grok Voice Agent para el
    modo Talk mediante el contrato compartido `registerRealtimeVoiceProvider`.

    - Endpoint: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - Modelo predeterminado: `grok-voice-latest`
    - Voz predeterminada: `eve`
    - Transporte: `gateway-relay` (rutas de retransmisión de iOS, Android y Control UI)
    - Audio: PCM16 a 24 kHz o G.711 µ-law a 8 kHz
    - Interrupción: el VAD del servidor de xAI interrumpe la respuesta; OpenClaw borra la reproducción en cola
      y trunca el historial del proveedor aún no reproducido

    Configura Talk en el Gateway:

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // Activar solo si la reproducción de sesiones por parte del proveedor es aceptable.
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    La configuración propiedad del proveedor también se resuelve desde
    `plugins.entries.voice-call.config.realtime.providers.xai` cuando Voice Call
    o los selectores compartidos de tiempo real reutilizan el mismo mapa de proveedores. Las claves compatibles son
    `apiKey`, `baseUrl`, `model`, `voice`, `vadThreshold`, `silenceDurationMs`,
    `prefixPaddingMs`, `reasoningEffort` y `sessionResumption`.
    `reasoningEffort` solo acepta `high` o `none`, de acuerdo con la API de Voice Agent de xAI.

    El VAD del servidor de xAI siempre crea respuestas y gestiona la interrupción del audio.
    Usa `consultRouting: "provider-direct"`; el enrutamiento forzado de transcripciones y la desactivación
    de la interrupción del audio de entrada no son compatibles con el protocolo Voice Agent de xAI.

    <Note>
    OAuth de xAI o `XAI_API_KEY` pueden autenticar la voz en tiempo real. WebRTC gestionado
    por el navegador aún no forma parte de esta superficie del proveedor; usa Talk mediante gateway-relay en
    nodos nativos o la ruta de retransmisión de Control UI.
    </Note>

    <Note>
    `sessionResumption` tiene como valor predeterminado `false`. Cuando se establece en `true`, OpenClaw solicita
    a xAI que conserve suficiente estado de la sesión para reanudar la misma conversación después de una
    reconexión y, a continuación, vuelve a conectarse con el identificador de conversación devuelto. Déjalo
    deshabilitado cuando la reproducción o retención por parte del proveedor no sea aceptable; en ese caso, los
    sockets interrumpidos se cierran de forma segura en lugar de iniciar silenciosamente una conversación nueva.
    </Note>

  </Accordion>

  <Accordion title="Configuración de x_search">
    El plugin de xAI incluido expone `x_search` como herramienta de OpenClaw para
    buscar contenido de X (anteriormente Twitter) mediante Grok.

    Ruta de configuración: `plugins.entries.xai.config.xSearch`

    | Clave             | Tipo    | Valor predeterminado       | Descripción                                      |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | boolean | Automático para modelos de xAI | Deshabilitar o activar para un proveedor conocido que no sea xAI |
    | `model`           | string  | `grok-4.3`                | Modelo utilizado para las solicitudes de x_search |
    | `baseUrl`         | string  | -                         | Anulación de la URL base de Responses de xAI |
    | `inlineCitations` | boolean | -                         | Incluir citas insertadas en los resultados |
    | `maxTurns`        | number  | -                         | Número máximo de turnos de conversación |
    | `timeoutSeconds`  | number  | `30`                      | Tiempo de espera de la solicitud en segundos |
    | `cacheTtlMinutes` | number  | `15`                      | Tiempo de vida de la caché en minutos |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
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
    El plugin de xAI incluido expone `code_execution` como herramienta de OpenClaw para
    ejecutar código de forma remota en el entorno aislado de xAI.

    Ruta de configuración: `plugins.entries.xai.config.codeExecution`

    | Clave              | Tipo    | Valor predeterminado                  | Descripción                                      |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | booleano | Automático para modelos de xAI | Deshabilitar o habilitar para un proveedor conocido que no sea xAI |
    | `model`          | cadena  | `grok-4.3`               | Modelo utilizado para solicitudes de ejecución de código           |
    | `maxTurns`       | número  | -                        | Número máximo de turnos de conversación                       |
    | `timeoutSeconds` | número  | `30`                     | Tiempo de espera de la solicitud en segundos                       |

    <Note>
    Esta es una ejecución remota en el entorno aislado de xAI, no una ejecución local de [`exec`](/es/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Límites conocidos">
    - La autenticación de xAI puede usar una clave de API, una variable de entorno, una configuración de respaldo del plugin
      u OAuth con una cuenta de xAI apta. OAuth usa la
      verificación mediante código de dispositivo sin una devolución de llamada a localhost. xAI decide qué cuentas
      pueden recibir tokens de API de OAuth, y la página de consentimiento puede mostrar Grok Build
      aunque OpenClaw no requiere la aplicación Grok Build.
    - OpenClaw actualmente no expone la familia de modelos multiagente de xAI. xAI
      proporciona estos modelos mediante la API Responses, pero no aceptan
      las herramientas del lado del cliente ni las herramientas personalizadas que utiliza el bucle de agente compartido de OpenClaw.
      Consulte las
      [limitaciones multiagente de xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Actualmente, la voz en tiempo real de xAI solo expone el transporte Talk mediante retransmisión del gateway.
      Las sesiones WebSocket del proveedor gestionadas por el navegador todavía no están conectadas en la interfaz de control.
    - La imagen `quality`, la imagen `mask` y las relaciones de aspecto adicionales exclusivas de la implementación nativa
      no se exponen hasta que la herramienta compartida `image_generate` disponga de los controles
      correspondientes entre proveedores.
  </Accordion>

  <Accordion title="Notas avanzadas">
    - OpenClaw aplica automáticamente correcciones específicas de xAI para la compatibilidad
      de los esquemas y las llamadas de herramientas en la ruta compartida del ejecutor.
    - Las solicitudes nativas de xAI usan `tool_stream: true` de forma predeterminada. Establezca
      `agents.defaults.models["xai/<model>"].params.tool_stream` en `false`
      para deshabilitarlo.
    - El envoltorio de xAI incluido elimina los límites de esquema no compatibles para el recuento de elementos contenidos
      y las claves de carga útil de *esfuerzo* de razonamiento no compatibles antes de enviar solicitudes nativas
      de xAI. Grok 4.5 admite esfuerzo bajo, medio y
      alto (valor predeterminado: alto). Grok 4.3 admite esfuerzo nulo, bajo, medio y alto
      (valor predeterminado: bajo). Otros modelos de xAI con capacidad de razonamiento no exponen un
      control de esfuerzo configurable, pero aun así solicitan
      `include: ["reasoning.encrypted_content"]` para que el razonamiento cifrado anterior
      pueda reproducirse en turnos posteriores.
    - `web_search`, `x_search` y `code_execution` se exponen como herramientas de OpenClaw.
      OpenClaw adjunta únicamente la función integrada específica de xAI que necesita cada herramienta
      a la solicitud de esa herramienta, en lugar de adjuntar todas las herramientas nativas a cada
      turno de chat.
    - Grok `web_search` lee `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` lee `plugins.entries.xai.config.xSearch.baseUrl` y, a continuación,
      recurre a la URL base de búsqueda web de Grok.
    - `x_search` y `code_execution` pertenecen al plugin de xAI incluido,
      en lugar de estar codificados directamente en el entorno de ejecución principal del modelo.
    - `code_execution` es una ejecución remota en el entorno aislado de xAI, no una ejecución local de
      [`exec`](/es/tools/exec).
  </Accordion>
</AccordionGroup>

## Pruebas en vivo

Las rutas multimedia de xAI están cubiertas por pruebas unitarias y conjuntos de pruebas en vivo opcionales. Exporte
`XAI_API_KEY` en el entorno del proceso antes de ejecutar las pruebas en vivo.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

El archivo de pruebas en vivo específico del proveedor sintetiza TTS normal y TTS PCM
apto para telefonía, transcribe audio mediante el STT por lotes de xAI, transmite el mismo PCM mediante el STT
en tiempo real de xAI, genera resultados de texto a imagen y edita una imagen de referencia.
El archivo compartido de pruebas en vivo de imágenes verifica el mismo proveedor de xAI mediante la
selección en tiempo de ejecución, la conmutación por error, la normalización y la ruta de adjuntos multimedia de OpenClaw. El
caso opcional de Video 1.5 envía una imagen generada para el primer fotograma a 1080P y
verifica la descarga del vídeo completado.

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Parámetros de la herramienta de vídeo compartida y selección del proveedor.
  </Card>
  <Card title="Todos los proveedores" href="/es/providers/index" icon="grid-2">
    Descripción general más amplia de los proveedores.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y soluciones.
  </Card>
</CardGroup>
