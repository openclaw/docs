---
read_when:
    - Quieres usar modelos Grok en OpenClaw
    - Estás configurando la autenticación de xAI o los ids de modelo
summary: Usar modelos xAI Grok en OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-06-27T17:10:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw incluye un plugin proveedor `xai` integrado para los modelos Grok. Para la mayoría
de los usuarios, la ruta recomendada es Grok OAuth con una suscripción elegible a SuperGrok o X Premium.
OpenClaw sigue siendo local-first: el Gateway, la configuración, el enrutamiento y las
herramientas se ejecutan en tu máquina, mientras que las solicitudes de modelos Grok se autentican mediante xAI
y se envían a la API de xAI.

OAuth no requiere una clave de API de xAI y no requiere la aplicación Grok Build.
xAI aún puede mostrar Grok Build en la pantalla de consentimiento porque OpenClaw usa
el cliente OAuth compartido de xAI.

## Elige tu ruta de configuración

Usa la ruta que coincida con el estado de instalación de OpenClaw:

<Steps>
  <Step title="Nueva instalación de OpenClaw">
    Ejecuta el onboarding con instalación del daemon cuando estés configurando un nuevo Gateway
    local, luego elige la opción xAI/Grok OAuth en el paso de modelo/autenticación:

    ```bash
    openclaw onboard --install-daemon
    ```

    En un VPS o mediante SSH, selecciona xAI OAuth directamente; OpenClaw usa verificación
    con código de dispositivo y no requiere una callback de localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth no requiere una clave de API de xAI. OpenClaw no requiere la aplicación Grok
    Build. xAI aún puede etiquetar la aplicación de consentimiento como Grok Build porque
    OpenClaw usa el cliente OAuth compartido de xAI.

  </Step>
  <Step title="Instalación existente de OpenClaw">
    Si OpenClaw ya está configurado, inicia sesión solo en xAI. No vuelvas a ejecutar el
    onboarding completo ni reinstales el daemon solo para conectar Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Para hacer que Grok sea el modelo predeterminado después de iniciar sesión, aplícalo por separado:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Vuelve a ejecutar el onboarding completo solo si quieres cambiar intencionalmente Gateway,
    daemon, canal, workspace u otras opciones de configuración.

  </Step>
  <Step title="Ruta con clave de API">
    La configuración con clave de API sigue funcionando para claves de xAI Console y para superficies multimedia que
    requieren configuración de proveedor respaldada por clave:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Elige un modelo">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw usa la API Responses de xAI como el transporte xAI integrado. La misma
credencial de `openclaw models auth login --provider xai --method oauth` o
`openclaw models auth login --provider xai --method api-key` también puede impulsar
`web_search`, `x_search`, `code_execution` remoto y la generación de imágenes/vídeos de xAI como funciones de primera clase.
El habla y la transcripción actualmente requieren `XAI_API_KEY` o configuración del proveedor.
`web_search` respaldado por Grok prefiere xAI OAuth y recurre a `XAI_API_KEY` o a la
configuración de búsqueda web del plugin.
Si almacenas una clave xAI en `plugins.entries.xai.config.webSearch.apiKey`,
el proveedor de modelos xAI integrado también reutiliza esa clave como fallback.
Configura `plugins.entries.xai.config.webSearch.baseUrl` para enrutar `web_search` de Grok
y, de forma predeterminada, `x_search` a través de un proxy de Responses de xAI del operador.
El ajuste de `code_execution` vive en `plugins.entries.xai.config.codeExecution`.
</Note>

## Solución de problemas de OAuth

- Para SSH, Docker, VPS u otras configuraciones remotas, usa
  `openclaw models auth login --provider xai --method oauth`; xAI OAuth usa
  verificación con código de dispositivo en lugar de una callback de localhost.
- Si el inicio de sesión se completa, pero Grok no es el modelo predeterminado, ejecuta
  `openclaw models set xai/grok-4.3`.
- Para inspeccionar los perfiles de autenticación xAI guardados, ejecuta:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI decide qué cuentas pueden recibir tokens de API OAuth. Si una cuenta no es
  elegible, prueba la ruta con clave de API o revisa la suscripción en xAI.

<Tip>
Usa `xai-oauth` al iniciar sesión desde SSH, Docker o un VPS. OpenClaw imprime una
URL de xAI y un código corto; termina el inicio de sesión en cualquier navegador local mientras el proceso
remoto sondea xAI para el intercambio de token completado.
</Tip>

## Catálogo integrado

OpenClaw incluye los modelos de chat xAI actuales de serie, ordenados del más nuevo
al más antiguo en los selectores de modelos:

| Familia        | Ids de modelo                                                            |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

El plugin aún resuelve hacia delante slugs antiguos de Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast y Grok Code para configuraciones existentes. Los alias oficiales de Grok Code Fast
se normalizan a `grok-build-0.1`; OpenClaw ya no muestra los otros slugs ascendentes retirados
en el catálogo seleccionable.

<Tip>
Usa `grok-4.3` para chat general y `grok-build-0.1` para cargas de trabajo centradas en build/código,
a menos que necesites explícitamente un alias beta de Grok 4.20.
</Tip>

## Cobertura de funciones de OpenClaw

El plugin integrado asigna la superficie actual de la API pública de xAI a los contratos compartidos
de proveedor y herramientas de OpenClaw. Las capacidades que no encajan en el contrato compartido
(por ejemplo, TTS en streaming y voz en tiempo real) no se exponen; consulta la tabla
siguiente.

| Capacidad de xAI          | Superficie de OpenClaw                    | Estado                                                              |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses          | proveedor de modelos `xai/<model>`        | Sí                                                                  |
| Búsqueda web del servidor | proveedor `web_search` `grok`             | Sí                                                                  |
| Búsqueda X del servidor   | herramienta `x_search`                    | Sí                                                                  |
| Ejecución de código del servidor | herramienta `code_execution`        | Sí                                                                  |
| Imágenes                  | `image_generate`                          | Sí                                                                  |
| Vídeos                    | `video_generate`                          | Sí                                                                  |
| Texto a voz por lotes     | `messages.tts.provider: "xai"` / `tts`    | Sí                                                                  |
| TTS en streaming          | -                                         | No expuesto; el contrato TTS de OpenClaw devuelve búferes de audio completos |
| Voz a texto por lotes     | `tools.media.audio` / comprensión multimedia | Sí                                                               |
| Voz a texto en streaming  | Voice Call `streaming.provider: "xai"`    | Sí                                                                  |
| Voz en tiempo real        | -                                         | Aún no expuesto; contrato de sesión/WebSocket diferente             |
| Archivos / lotes          | Solo compatibilidad genérica con la API de modelos | No es una herramienta OpenClaw de primera clase             |

<Note>
OpenClaw usa las API REST de imagen/vídeo/TTS/STT de xAI para generación multimedia,
habla y transcripción por lotes, el WebSocket STT en streaming de xAI para transcripción
de llamadas de voz en vivo y la API Responses para herramientas de modelos, búsqueda y
ejecución de código. Las funciones que necesitan contratos de OpenClaw diferentes, como
sesiones de voz en tiempo real, se documentan aquí como capacidades ascendentes en lugar
de comportamiento oculto del plugin.
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

Los alias heredados aún se normalizan a los ids integrados canónicos:

| Alias heredado            | Id canónico                           |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funciones

<AccordionGroup>
  <Accordion title="Búsqueda web">
    El proveedor integrado de búsqueda web `grok` prefiere xAI OAuth y luego recurre
    a `XAI_API_KEY` o a una clave de búsqueda web del plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generación de vídeo">
    El plugin `xai` integrado registra la generación de vídeo mediante la herramienta compartida
    `video_generate`.

    - Modelo de vídeo predeterminado: `xai/grok-imagine-video`
    - Modos: texto a vídeo, imagen a vídeo, generación con imagen de referencia, edición de vídeo
      remota y extensión de vídeo remota
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluciones: `480P`, `720P`
    - Duración: 1-15 segundos para generación/imagen a vídeo, 1-10 segundos al
      usar roles `reference_image`, 2-10 segundos para extensión
    - Generación con imagen de referencia: establece `imageRoles` en `reference_image` para
      cada imagen proporcionada; xAI acepta hasta 7 de estas imágenes
    - Tiempo de espera predeterminado de la operación: 600 segundos, a menos que se configure `video_generate.timeoutMs`
      o `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    No se aceptan búferes de vídeo locales. Usa URL remotas `http(s)` para
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
    la selección de proveedor y el comportamiento de failover.
    </Note>

  </Accordion>

  <Accordion title="Generación de imágenes">
    El plugin `xai` integrado registra la generación de imágenes mediante la herramienta compartida
    `image_generate`.

    - Modelo de imagen predeterminado: `xai/grok-imagine-image`
    - Modelo adicional: `xai/grok-imagine-image-quality`
    - Modos: texto a imagen y edición con imagen de referencia
    - Entradas de referencia: una `image` o hasta cinco `images`
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluciones: `1K`, `2K`
    - Recuento: hasta 4 imágenes
    - Tiempo de espera predeterminado de la operación: 600 segundos, a menos que se configure `image_generate.timeoutMs`
      o `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw solicita a xAI respuestas de imagen `b64_json` para que los medios generados puedan
    almacenarse y entregarse mediante la ruta normal de archivos adjuntos del canal. Las imágenes
    locales de referencia se convierten en URL de datos; las referencias remotas `http(s)` se
    pasan directamente.

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
    xAI también documenta `quality`, `mask`, `user` y relaciones de aspecto
    nativas adicionales, como `1:2`, `2:1`, `9:20` y `20:9`. Actualmente,
    OpenClaw solo reenvía los controles de imagen compartidos entre proveedores;
    los controles no compatibles exclusivos de la implementación nativa no se
    exponen intencionalmente mediante `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Texto a voz">
    El Plugin `xai` incluido registra texto a voz mediante la superficie
    compartida de proveedor `tts`.

    - Voces: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voz predeterminada: `eve`
    - Formatos: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Idioma: código BCP-47 o `auto`
    - Velocidad: anulación de velocidad nativa del proveedor
    - El formato nativo Opus para notas de voz no es compatible

    Para usar xAI como proveedor de TTS predeterminado:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw usa el endpoint por lotes `/v1/tts` de xAI. xAI también ofrece TTS
    en streaming mediante WebSocket, pero el contrato del proveedor de voz de
    OpenClaw actualmente espera un búfer de audio completo antes de entregar la
    respuesta.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El Plugin `xai` incluido registra voz a texto por lotes mediante la
    superficie de transcripción de comprensión multimedia de OpenClaw.

    - Modelo predeterminado: `grok-stt`
    - Endpoint: REST de xAI `/v1/stt`
    - Ruta de entrada: carga de archivo de audio multipart
    - Compatible con OpenClaw en cualquier lugar donde la transcripción de audio
      entrante use `tools.media.audio`, incluidos segmentos de canales de voz de
      Discord y adjuntos de audio de canales

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

    El idioma se puede proporcionar mediante la configuración multimedia de audio
    compartida o por solicitud de transcripción. La superficie compartida de
    OpenClaw acepta pistas de prompt, pero la integración REST STT de xAI solo
    reenvía archivo, modelo e idioma porque esos campos se asignan limpiamente al
    endpoint público actual de xAI.

  </Accordion>

  <Accordion title="Voz a texto en streaming">
    El Plugin `xai` incluido también registra un proveedor de transcripción en
    tiempo real para audio de llamadas de voz en directo.

    - Endpoint: WebSocket de xAI `wss://api.x.ai/v1/stt`
    - Codificación predeterminada: `mulaw`
    - Frecuencia de muestreo predeterminada: `8000`
    - Endpointing predeterminado: `800ms`
    - Transcripciones provisionales: habilitadas de forma predeterminada

    El flujo multimedia de Twilio de Voice Call envía tramas de audio G.711
    µ-law, por lo que el proveedor de xAI puede reenviar esas tramas directamente
    sin transcodificación:

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
    compatibles son `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`,
    `mulaw` o `alaw`), `interimResults`, `endpointingMs` y `language`.

    <Note>
    Este proveedor de streaming es para la ruta de transcripción en tiempo real
    de Voice Call. Actualmente, la voz de Discord graba segmentos cortos y usa
    en su lugar la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuración de x_search">
    El Plugin xAI incluido expone `x_search` como herramienta de OpenClaw para
    buscar contenido de X (anteriormente Twitter) mediante Grok.

    Ruta de configuración: `plugins.entries.xai.config.xSearch`

    | Clave              | Tipo    | Predeterminado     | Descripción                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Habilita o deshabilita x_search      |
    | `model`            | string  | `grok-4-1-fast`    | Modelo usado para solicitudes x_search |
    | `baseUrl`          | string  | -                  | Anulación de URL base de Responses de xAI |
    | `inlineCitations`  | boolean | -                  | Incluye citas en línea en los resultados |
    | `maxTurns`         | number  | -                  | Máximo de turnos de conversación     |
    | `timeoutSeconds`   | number  | -                  | Tiempo de espera de la solicitud en segundos |
    | `cacheTtlMinutes`  | number  | -                  | Tiempo de vida de caché en minutos   |

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
    El Plugin xAI incluido expone `code_execution` como herramienta de OpenClaw
    para ejecución remota de código en el entorno sandbox de xAI.

    Ruta de configuración: `plugins.entries.xai.config.codeExecution`

    | Clave             | Tipo    | Predeterminado            | Descripción                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (si la clave está disponible) | Habilita o deshabilita la ejecución de código |
    | `model`           | string  | `grok-4-1-fast`    | Modelo usado para solicitudes de ejecución de código |
    | `maxTurns`        | number  | -                  | Máximo de turnos de conversación         |
    | `timeoutSeconds`  | number  | -                  | Tiempo de espera de la solicitud en segundos |

    <Note>
    Esto es ejecución remota en el sandbox de xAI, no [`exec`](/es/tools/exec)
    local.
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
    - La autenticación de xAI puede usar una clave de API, variable de entorno,
      respaldo de configuración del Plugin u OAuth con una cuenta de xAI
      elegible. OAuth usa verificación con código de dispositivo sin callback de
      localhost. xAI decide qué cuentas pueden recibir tokens de API de OAuth, y
      la página de consentimiento puede mostrar Grok Build aunque OpenClaw no
      requiere la aplicación Grok Build.
    - Actualmente, OpenClaw no expone la familia de modelos multiagente de xAI.
      xAI sirve estos modelos mediante la API Responses, pero no aceptan las
      herramientas personalizadas o del lado del cliente usadas por el bucle
      compartido de agente de OpenClaw. Consulta las
      [limitaciones multiagente de xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - La voz Realtime de xAI todavía no está registrada como proveedor de
      OpenClaw. Necesita un contrato de sesión de voz bidireccional distinto al
      de STT por lotes o transcripción en streaming.
    - La `quality` de imagen de xAI, la `mask` de imagen y las relaciones de
      aspecto adicionales exclusivas de la implementación nativa no se exponen
      hasta que la herramienta compartida `image_generate` tenga controles
      correspondientes entre proveedores.
  </Accordion>

  <Accordion title="Notas avanzadas">
    - OpenClaw aplica automáticamente correcciones de compatibilidad específicas
      de xAI para esquemas de herramientas y llamadas a herramientas en la ruta
      del ejecutor compartido.
    - Las solicitudes nativas de xAI usan `tool_stream: true` de forma
      predeterminada. Establece
      `agents.defaults.models["xai/<model>"].params.tool_stream` en `false` para
      deshabilitarlo.
    - El wrapper xAI incluido elimina indicadores de esquema de herramienta
      estrictos no compatibles y claves de payload de *esfuerzo* de razonamiento
      antes de enviar solicitudes nativas de xAI. Solo `grok-4.3` /
      `grok-4.3-*` anuncian esfuerzo de razonamiento configurable; todos los
      demás modelos de xAI con capacidad de razonamiento siguen solicitando
      `include: ["reasoning.encrypted_content"]` para que el razonamiento
      cifrado previo pueda reproducirse en turnos posteriores.
    - `web_search`, `x_search` y `code_execution` se exponen como herramientas
      de OpenClaw. OpenClaw habilita el componente integrado específico de xAI
      que necesita dentro de cada solicitud de herramienta en lugar de adjuntar
      todas las herramientas nativas a cada turno de chat.
    - `web_search` de Grok lee `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` lee `plugins.entries.xai.config.xSearch.baseUrl` y luego
      recurre a la URL base de búsqueda web de Grok.
    - `x_search` y `code_execution` son propiedad del Plugin xAI incluido en
      lugar de estar codificados de forma rígida en el runtime del modelo del
      núcleo.
    - `code_execution` es ejecución remota en el sandbox de xAI, no
      [`exec`](/es/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Pruebas en vivo

Las rutas multimedia de xAI están cubiertas por pruebas unitarias y suites en
vivo opcionales. Exporta `XAI_API_KEY` en el entorno del proceso antes de
ejecutar sondas en vivo.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

El archivo en vivo específico del proveedor sintetiza TTS normal, TTS PCM apto
para telefonía, transcribe audio mediante STT por lotes de xAI, transmite el
mismo PCM mediante STT en tiempo real de xAI, genera salida de texto a imagen y
edita una imagen de referencia. El archivo en vivo de imagen compartido verifica
el mismo proveedor de xAI mediante la selección de runtime, respaldo,
normalización y ruta de adjuntos multimedia de OpenClaw.

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de
    conmutación por error.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Todos los proveedores" href="/es/providers/index" icon="grid-2">
    La descripción general más amplia de proveedores.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y correcciones.
  </Card>
</CardGroup>
