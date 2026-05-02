---
read_when:
    - Quieres usar modelos de Grok en OpenClaw
    - Estás configurando la autenticación de xAI o los ID de modelos
summary: Usar modelos de xAI Grok en OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-02T05:35:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw incluye un plugin de proveedor `xai` integrado para los modelos Grok.

## Primeros pasos

<Steps>
  <Step title="Crear una clave de API">
    Crea una clave de API en la [consola de xAI](https://console.x.ai/).
  </Step>
  <Step title="Configurar tu clave de API">
    Configura `XAI_API_KEY`, o ejecuta:

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
`XAI_API_KEY` también puede impulsar `web_search` respaldado por Grok, `x_search`
de primera clase y `code_execution` remoto.
Si almacenas una clave de xAI en `plugins.entries.xai.config.webSearch.apiKey`,
el proveedor de modelos xAI integrado también reutiliza esa clave como alternativa.
Configura `plugins.entries.xai.config.webSearch.baseUrl` para enrutar `web_search`
de Grok y, de forma predeterminada, `x_search` a través de un proxy de API Responses
de xAI del operador.
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

El plugin también resuelve hacia delante ids `grok-4*` y `grok-code-fast*` más nuevos cuando
siguen la misma forma de API.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` y las variantes `grok-4.20-beta-*`
son las referencias Grok actuales con capacidad de imagen en el catálogo integrado.
</Tip>

## Cobertura de funciones de OpenClaw

El plugin integrado asigna la superficie actual de API pública de xAI a los contratos
compartidos de proveedor y herramientas de OpenClaw. Las capacidades que no encajan
en el contrato compartido (por ejemplo, TTS en streaming y voz en tiempo real) no se exponen; consulta la tabla
a continuación.

| Capacidad de xAI             | Superficie de OpenClaw                    | Estado                                                               |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| Chat / Responses             | Proveedor de modelos `xai/<model>`        | Sí                                                                   |
| Búsqueda web del servidor    | Proveedor `web_search` `grok`             | Sí                                                                   |
| Búsqueda X del servidor      | Herramienta `x_search`                    | Sí                                                                   |
| Ejecución de código del servidor | Herramienta `code_execution`          | Sí                                                                   |
| Imágenes                     | `image_generate`                          | Sí                                                                   |
| Videos                       | `video_generate`                          | Sí                                                                   |
| Texto a voz por lotes        | `messages.tts.provider: "xai"` / `tts`    | Sí                                                                   |
| TTS en streaming             | —                                         | No expuesto; el contrato TTS de OpenClaw devuelve buffers de audio completos |
| Voz a texto por lotes        | `tools.media.audio` / comprensión multimedia | Sí                                                                |
| Voz a texto en streaming     | Voice Call `streaming.provider: "xai"`    | Sí                                                                   |
| Voz en tiempo real           | —                                         | Aún no expuesto; contrato de sesión/WebSocket diferente              |
| Archivos / lotes             | Solo compatibilidad con API de modelo genérica | No es una herramienta OpenClaw de primera clase                 |

<Note>
OpenClaw usa las API REST de imagen/video/TTS/STT de xAI para generación multimedia,
voz y transcripción por lotes, el WebSocket STT en streaming de xAI para transcripción
de llamadas de voz en vivo, y la API Responses para herramientas de modelo, búsqueda y
ejecución de código. Las funciones que necesitan contratos de OpenClaw diferentes, como
sesiones de voz en tiempo real, se documentan aquí como capacidades del proveedor upstream
en lugar de comportamiento oculto del plugin.
</Note>

### Asignaciones de modo rápido

`/fast on` o `agents.defaults.models["xai/<model>"].params.fastMode: true`
reescriben las solicitudes nativas de xAI de la siguiente manera:

| Modelo de origen | Destino de modo rápido |
| ---------------- | ---------------------- |
| `grok-3`         | `grok-3-fast`          |
| `grok-3-mini`    | `grok-3-mini-fast`     |
| `grok-4`         | `grok-4-fast`          |
| `grok-4-0709`    | `grok-4-fast`          |

### Alias de compatibilidad heredada

Los alias heredados todavía se normalizan a los ids integrados canónicos:

| Alias heredado            | Id canónico                           |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funciones

<AccordionGroup>
  <Accordion title="Búsqueda web">
    El proveedor de búsqueda web `grok` integrado también usa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generación de video">
    El plugin `xai` integrado registra la generación de video mediante la herramienta compartida
    `video_generate`.

    - Modelo de video predeterminado: `xai/grok-imagine-video`
    - Modos: texto a video, imagen a video, generación con imagen de referencia, edición remota
      de video y extensión remota de video
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluciones: `480P`, `720P`
    - Duración: 1-15 segundos para generación/imagen a video, 1-10 segundos cuando
      se usan roles `reference_image`, 2-10 segundos para extensión
    - Generación con imagen de referencia: configura `imageRoles` como `reference_image` para
      cada imagen suministrada; xAI acepta hasta 7 imágenes de este tipo

    <Warning>
    No se aceptan buffers de video locales. Usa URL `http(s)` remotas para
    entradas de edición/extensión de video. Imagen a video acepta buffers de imagen locales porque
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
    Consulta [Generación de video](/es/tools/video-generation) para parámetros de herramientas compartidas,
    selección de proveedor y comportamiento de conmutación por error.
    </Note>

  </Accordion>

  <Accordion title="Generación de imágenes">
    El plugin `xai` integrado registra la generación de imágenes mediante la herramienta compartida
    `image_generate`.

    - Modelo de imagen predeterminado: `xai/grok-imagine-image`
    - Modelo adicional: `xai/grok-imagine-image-pro`
    - Modos: texto a imagen y edición con imagen de referencia
    - Entradas de referencia: una `image` o hasta cinco `images`
    - Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluciones: `1K`, `2K`
    - Cantidad: hasta 4 imágenes

    OpenClaw solicita a xAI respuestas de imagen `b64_json` para que los medios generados puedan
    almacenarse y entregarse mediante la ruta normal de adjuntos del canal. Las imágenes de
    referencia locales se convierten en URL de datos; las referencias `http(s)` remotas se
    pasan sin cambios.

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
    como `1:2`, `2:1`, `9:20` y `20:9`. OpenClaw actualmente solo reenvía los
    controles de imagen compartidos entre proveedores; los controles no compatibles exclusivos
    del proveedor nativo no se exponen intencionalmente mediante `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Texto a voz">
    El plugin `xai` integrado registra texto a voz mediante la superficie compartida de proveedor `tts`.

    - Voces: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voz predeterminada: `eve`
    - Formatos: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Idioma: código BCP-47 o `auto`
    - Velocidad: anulación de velocidad nativa del proveedor
    - El formato nativo de nota de voz Opus no es compatible

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
    por WebSocket, pero el contrato de proveedor de voz de OpenClaw actualmente espera
    un buffer de audio completo antes de entregar la respuesta.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El plugin `xai` integrado registra voz a texto por lotes mediante la superficie de transcripción
    de comprensión multimedia de OpenClaw.

    - Modelo predeterminado: `grok-stt`
    - Endpoint: REST de xAI `/v1/stt`
    - Ruta de entrada: carga de archivo de audio multipart
    - Compatible con OpenClaw en todos los lugares donde la transcripción de audio entrante usa
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

    El idioma puede suministrarse mediante la configuración compartida de medios de audio o por solicitud
    de transcripción individual. La superficie compartida de OpenClaw acepta indicaciones de prompt,
    pero la integración STT REST de xAI solo reenvía archivo, modelo e
    idioma porque se asignan limpiamente al endpoint público actual de xAI.

  </Accordion>

  <Accordion title="Voz a texto en streaming">
    El plugin `xai` integrado también registra un proveedor de transcripción en tiempo real
    para audio de llamadas de voz en vivo.

    - Endpoint: WebSocket de xAI `wss://api.x.ai/v1/stt`
    - Codificación predeterminada: `mulaw`
    - Frecuencia de muestreo predeterminada: `8000`
    - Segmentación de endpoint predeterminada: `800ms`
    - Transcripciones provisionales: activadas de forma predeterminada

    El stream multimedia de Twilio de Voice Call envía tramas de audio G.711 µ-law, por lo que el
    proveedor xAI puede reenviar esas tramas directamente sin transcodificación:

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
    de Voice Call. La voz de Discord actualmente graba segmentos cortos y usa en
    su lugar la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuración de x_search">
    El plugin xAI incluido expone `x_search` como una herramienta de OpenClaw
    para buscar contenido de X (antes Twitter) mediante Grok.

    Ruta de configuración: `plugins.entries.xai.config.xSearch`

    | Clave              | Tipo    | Valor predeterminado | Descripción                          |
    | ------------------ | ------- | -------------------- | ------------------------------------ |
    | `enabled`          | boolean | —                    | Activa o desactiva x_search          |
    | `model`            | string  | `grok-4-1-fast`      | Modelo usado para solicitudes de x_search |
    | `baseUrl`          | string  | —                    | Sobrescritura de URL base de xAI Responses |
    | `inlineCitations`  | boolean | —                    | Incluye citas en línea en los resultados |
    | `maxTurns`         | number  | —                    | Número máximo de turnos de conversación |
    | `timeoutSeconds`   | number  | —                    | Tiempo de espera de la solicitud en segundos |
    | `cacheTtlMinutes`  | number  | —                    | Tiempo de vida de la caché en minutos |

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
    El plugin xAI incluido expone `code_execution` como una herramienta de
    OpenClaw para la ejecución remota de código en el entorno de sandbox de xAI.

    Ruta de configuración: `plugins.entries.xai.config.codeExecution`

    | Clave             | Tipo    | Valor predeterminado | Descripción                          |
    | ----------------- | ------- | -------------------- | ------------------------------------ |
    | `enabled`         | boolean | `true` (si la clave está disponible) | Activa o desactiva la ejecución de código |
    | `model`           | string  | `grok-4-1-fast`      | Modelo usado para solicitudes de ejecución de código |
    | `maxTurns`        | number  | —                    | Número máximo de turnos de conversación |
    | `timeoutSeconds`  | number  | —                    | Tiempo de espera de la solicitud en segundos |

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
    - Hoy la autenticación solo usa clave de API. Todavía no hay flujo OAuth ni
      de código de dispositivo de xAI en OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` no es compatible con la
      ruta normal del proveedor xAI porque requiere una superficie de API
      ascendente distinta de la del transporte xAI estándar de OpenClaw.
    - La voz en tiempo real de xAI aún no está registrada como proveedor de
      OpenClaw. Necesita un contrato de sesión de voz bidireccional distinto al
      de STT por lotes o transcripción por streaming.
    - La `quality` de imagen de xAI, la `mask` de imagen y las relaciones de
      aspecto adicionales solo nativas no se exponen hasta que la herramienta
      compartida `image_generate` tenga controles correspondientes entre
      proveedores.
  </Accordion>

  <Accordion title="Notas avanzadas">
    - OpenClaw aplica automáticamente correcciones de compatibilidad específicas
      de xAI para esquemas de herramientas y llamadas a herramientas en la ruta
      compartida del ejecutor.
    - Las solicitudes nativas de xAI usan `tool_stream: true` de forma
      predeterminada. Configura
      `agents.defaults.models["xai/<model>"].params.tool_stream` como `false`
      para desactivarlo.
    - El wrapper xAI incluido elimina indicadores de esquema de herramienta
      estrictos no admitidos y claves de payload de razonamiento antes de enviar
      solicitudes nativas de xAI.
    - `web_search`, `x_search` y `code_execution` se exponen como herramientas
      de OpenClaw. OpenClaw habilita el componente integrado específico de xAI
      que necesita dentro de cada solicitud de herramienta, en lugar de adjuntar
      todas las herramientas nativas a cada turno de chat.
    - `web_search` de Grok lee `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` lee `plugins.entries.xai.config.xSearch.baseUrl` y luego
      recurre a la URL base de búsqueda web de Grok.
    - `x_search` y `code_execution` pertenecen al plugin xAI incluido, en lugar
      de estar codificados de forma rígida en el runtime del modelo central.
    - `code_execution` es ejecución remota en el sandbox de xAI, no
      [`exec`](/es/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Pruebas en vivo

Las rutas de medios de xAI están cubiertas por pruebas unitarias y suites en
vivo opcionales. Los comandos en vivo cargan secretos desde tu shell de inicio
de sesión, incluido `~/.profile`, antes de sondear `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

El archivo en vivo específico del proveedor sintetiza TTS normal, TTS PCM apto
para telefonía, transcribe audio mediante STT por lotes de xAI, transmite el
mismo PCM mediante STT en tiempo real de xAI, genera salida de texto a imagen y
edita una imagen de referencia. El archivo en vivo de imagen compartido verifica
el mismo proveedor xAI mediante la selección de runtime, fallback,
normalización y ruta de adjunto de medios de OpenClaw.

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación
    por error.
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
