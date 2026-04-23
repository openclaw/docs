---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres autenticación de suscripción a Codex en lugar de claves API
    - Necesitas un comportamiento de ejecución de agente más estricto para GPT-5
summary: Usar OpenAI mediante claves API o suscripción a Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T14:07:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac42660234e1971440f6de3b04adb1d3a1fddca20219fb68936c36e4c2f95265
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI proporciona API para desarrolladores para modelos GPT. OpenClaw admite dos rutas de autenticación:

  - **Clave API**: acceso directo a OpenAI Platform con facturación por uso (modelos `openai/*`)
  - **Suscripción a Codex**: inicio de sesión de ChatGPT/Codex con acceso por suscripción (modelos `openai-codex/*`)

  OpenAI admite explícitamente el uso de OAuth de suscripción en herramientas y flujos de trabajo externos como OpenClaw.

  ## Cobertura de funciones de OpenClaw

  | Capacidad de OpenAI        | Superficie de OpenClaw                     | Estado                                                 |
  | -------------------------- | ----------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses           | proveedor de modelos `openai/<model>`     | Sí                                                     |
  | Modelos de suscripción a Codex | proveedor de modelos `openai-codex/<model>` | Sí                                                  |
  | Búsqueda web del lado del servidor | herramienta nativa de OpenAI Responses | Sí, cuando la búsqueda web está habilitada y no hay un proveedor fijado |
  | Imágenes                   | `image_generate`                          | Sí                                                     |
  | Videos                     | `video_generate`                          | Sí                                                     |
  | Texto a voz                | `messages.tts.provider: "openai"` / `tts` | Sí                                                     |
  | Voz a texto por lotes      | `tools.media.audio` / comprensión de medios | Sí                                                   |
  | Voz a texto en streaming   | Voice Call `streaming.provider: "openai"` | Sí                                                     |
  | Voz en tiempo real         | Voice Call `realtime.provider: "openai"`  | Sí                                                     |
  | Embeddings                 | proveedor de embeddings de memoria        | Sí                                                     |

  ## Primeros pasos

  Elige tu método de autenticación preferido y sigue los pasos de configuración.

  <Tabs>
  <Tab title="Clave API (OpenAI Platform)">
    **Ideal para:** acceso directo a la API y facturación por uso.

    <Steps>
      <Step title="Obtén tu clave API">
        Crea o copia una clave API desde el [panel de OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumen de rutas

    | Referencia de modelo | Ruta | Autenticación |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | API directa de OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    El inicio de sesión de ChatGPT/Codex se enruta mediante `openai-codex/*`, no `openai/*`.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **no** expone `openai/gpt-5.3-codex-spark` en la ruta directa de API. Las solicitudes activas a la API de OpenAI rechazan ese modelo. Spark es solo para Codex.
    </Warning>

  </Tab>

  <Tab title="Suscripción a Codex">
    **Ideal para:** usar tu suscripción de ChatGPT/Codex en lugar de una clave API independiente. Codex cloud requiere inicio de sesión en ChatGPT.

    <Steps>
      <Step title="Ejecuta Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        O ejecuta OAuth directamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configuraciones sin encabezado o incompatibles con callbacks, añade `--device-code` para iniciar sesión con un flujo de código de dispositivo de ChatGPT en lugar del callback del navegador localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Establece el modelo predeterminado">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Resumen de rutas

    | Referencia de modelo | Ruta | Autenticación |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | OAuth de ChatGPT/Codex | inicio de sesión en Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth de ChatGPT/Codex | inicio de sesión en Codex (depende de derechos) |

    <Note>
    Esta ruta está intencionadamente separada de `openai/gpt-5.4`. Usa `openai/*` con una clave API para acceso directo a Platform, y `openai-codex/*` para acceso mediante suscripción a Codex.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    La incorporación ya no importa material OAuth desde `~/.codex`. Inicia sesión con OAuth en el navegador (predeterminado) o con el flujo de código de dispositivo anterior: OpenClaw gestiona las credenciales resultantes en su propio almacén de autenticación del agente.
    </Note>

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto en tiempo de ejecución como valores separados.

    Para `openai-codex/gpt-5.4`:

    - `contextWindow` nativo: `1050000`
    - Límite predeterminado de `contextTokens` en tiempo de ejecución: `272000`

    El límite predeterminado más pequeño tiene en la práctica mejores características de latencia y calidad. Anúlalo con `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Usa `contextWindow` para declarar metadatos nativos del modelo. Usa `contextTokens` para limitar el presupuesto de contexto en tiempo de ejecución.
    </Note>

  </Tab>
</Tabs>

## Generación de imágenes

El Plugin agrupado `openai` registra generación de imágenes mediante la herramienta `image_generate`.

| Capacidad                | Valor                              |
| ------------------------ | ---------------------------------- |
| Modelo predeterminado    | `openai/gpt-image-2`               |
| Máx. de imágenes por solicitud | 4                            |
| Modo de edición          | Habilitado (hasta 5 imágenes de referencia) |
| Anulaciones de tamaño    | Compatibles, incluidos tamaños 2K/4K |
| Relación de aspecto / resolución | No se envía a la API de OpenAI Images |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consulta [Image Generation](/es/tools/image-generation) para los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.
</Note>

`gpt-image-2` es el valor predeterminado tanto para la generación de texto a imagen de OpenAI como para la
edición de imágenes. `gpt-image-1` sigue siendo utilizable como anulación explícita de modelo, pero los nuevos
flujos de trabajo de imágenes de OpenAI deberían usar `openai/gpt-image-2`.

Generar:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generación de video

El Plugin agrupado `openai` registra generación de video mediante la herramienta `video_generate`.

| Capacidad       | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo predeterminado | `openai/sora-2`                                                              |
| Modos            | Texto a video, imagen a video, edición de un solo video                           |
| Entradas de referencia | 1 imagen o 1 video                                                           |
| Anulaciones de tamaño | Compatibles                                                                   |
| Otras anulaciones | `aspectRatio`, `resolution`, `audio`, `watermark` se ignoran con una advertencia de la herramienta |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consulta [Video Generation](/es/tools/video-generation) para los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.
</Note>

## Contribución de prompt de GPT-5

OpenClaw añade una contribución compartida de prompt de GPT-5 para ejecuciones de la familia GPT-5 entre proveedores. Se aplica por id de modelo, por lo que `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` y otras referencias compatibles con GPT-5 reciben la misma superposición. Los modelos más antiguos GPT-4.x no la reciben.

El proveedor agrupado de arnés nativo Codex (`codex/*`) usa el mismo comportamiento de GPT-5 y la misma superposición de Heartbeat mediante instrucciones de desarrollador del servidor de aplicaciones Codex, por lo que las sesiones `codex/gpt-5.x` mantienen la misma guía de seguimiento y de Heartbeat proactivo aunque Codex gestione el resto del prompt del arnés.

La contribución de GPT-5 añade un contrato de comportamiento etiquetado para persistencia de personalidad, seguridad de ejecución, disciplina de herramientas, forma de salida, comprobaciones de finalización y verificación. El comportamiento específico del canal para respuestas y mensajes silenciosos permanece en el prompt compartido del sistema de OpenClaw y en la política de entrega saliente. La guía de GPT-5 siempre está habilitada para los modelos coincidentes. La capa de estilo de interacción amigable es independiente y configurable.

| Valor                  | Efecto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Habilita la capa de estilo de interacción amigable |
| `"on"`                 | Alias de `"friendly"`                       |
| `"off"`                | Deshabilita solo la capa de estilo amigable |

<Tabs>
  <Tab title="Configuración">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Los valores no distinguen entre mayúsculas y minúsculas en tiempo de ejecución, por lo que `"Off"` y `"off"` deshabilitan ambas la capa de estilo amigable.
</Tip>

<Note>
El valor heredado `plugins.entries.openai.config.personality` sigue leyéndose como fallback de compatibilidad cuando no está establecido el ajuste compartido `agents.defaults.promptOverlays.gpt5.personality`.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El Plugin agrupado `openai` registra síntesis de voz para la superficie `messages.tts`.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|----------------------|----------------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidad | `messages.tts.providers.openai.speed` | (sin establecer) |
    | Instrucciones | `messages.tts.providers.openai.instructions` | (sin establecer, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para archivos |
    | Clave API | `messages.tts.providers.openai.apiKey` | Recurre a `OPENAI_API_KEY` |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modelos disponibles: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voces disponibles: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Establece `OPENAI_TTS_BASE_URL` para anular la URL base de TTS sin afectar el endpoint de la API de chat.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El Plugin agrupado `openai` registra voz a texto por lotes mediante
    la superficie de transcripción de comprensión de medios de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Endpoint: REST de OpenAI `/v1/audio/transcriptions`
    - Ruta de entrada: carga multipart de archivo de audio
    - Compatible con OpenClaw dondequiera que la transcripción de audio entrante use
      `tools.media.audio`, incluidos segmentos de canal de voz de Discord y
      archivos de audio adjuntos de canales

    Para forzar OpenAI para la transcripción de audio entrante:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Las sugerencias de idioma y de prompt se envían a OpenAI cuando se proporcionan desde la
    configuración compartida de medios de audio o desde la solicitud de transcripción por llamada.

  </Accordion>

  <Accordion title="Transcripción en tiempo real">
    El Plugin agrupado `openai` registra transcripción en tiempo real para el Plugin Voice Call.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|----------------------|----------------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (sin establecer) |
    | Prompt | `...openai.prompt` | (sin establecer) |
    | Duración del silencio | `...openai.silenceDurationMs` | `800` |
    | Umbral VAD | `...openai.vadThreshold` | `0.5` |
    | Clave API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Usa una conexión WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Este proveedor de streaming es para la ruta de transcripción en tiempo real de Voice Call; actualmente la voz de Discord graba segmentos cortos y usa en su lugar la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz en tiempo real">
    El Plugin agrupado `openai` registra voz en tiempo real para el Plugin Voice Call.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|----------------------|----------------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Umbral VAD | `...openai.vadThreshold` | `0.5` |
    | Duración del silencio | `...openai.silenceDurationMs` | `500` |
    | Clave API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Admite Azure OpenAI mediante las claves de configuración `azureEndpoint` y `azureDeployment`. Admite llamadas de herramientas bidireccionales. Usa formato de audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints de Azure OpenAI

El proveedor agrupado `openai` puede apuntar a un recurso de Azure OpenAI para
generación de imágenes anulando la URL base. En la ruta de generación de imágenes, OpenClaw
detecta nombres de host de Azure en `models.providers.openai.baseUrl` y cambia
automáticamente a la forma de solicitud de Azure.

<Note>
La voz en tiempo real usa una ruta de configuración independiente
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulta el acordeón **Voz en tiempo
real** en [Voz y habla](#voice-and-speech) para su configuración de Azure.
</Note>

Usa Azure OpenAI cuando:

- Ya tienes una suscripción, cuota o acuerdo empresarial de Azure OpenAI
- Necesitas residencia de datos regional o controles de cumplimiento que proporciona Azure
- Quieres mantener el tráfico dentro de una tenencia existente de Azure

### Configuración

Para la generación de imágenes de Azure mediante el proveedor agrupado `openai`, apunta
`models.providers.openai.baseUrl` a tu recurso de Azure y establece `apiKey` en
la clave de Azure OpenAI (no una clave de OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw reconoce estos sufijos de host de Azure para la ruta de generación de imágenes de Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para solicitudes de generación de imágenes en un host de Azure reconocido, OpenClaw:

- Envía el encabezado `api-key` en lugar de `Authorization: Bearer`
- Usa rutas con alcance de implementación (`/openai/deployments/{deployment}/...`)
- Añade `?api-version=...` a cada solicitud

Otras URL base (OpenAI pública, proxies compatibles con OpenAI) mantienen la forma estándar
de solicitud de imágenes de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor `openai` requiere
OpenClaw 2026.4.22 o posterior. Las versiones anteriores tratan cualquier
`openai.baseUrl` personalizada como el endpoint público de OpenAI y fallarán con implementaciones
de imágenes de Azure.
</Note>

### Versión de API

Establece `AZURE_OPENAI_API_VERSION` para fijar una versión específica preview o GA de Azure
para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está establecida.

### Los nombres de modelo son nombres de implementación

Azure OpenAI vincula modelos a implementaciones. Para solicitudes de generación de imágenes de Azure
enrutadas mediante el proveedor agrupado `openai`, el campo `model` en OpenClaw
debe ser el **nombre de implementación de Azure** que configuraste en el portal de Azure, no
el id público del modelo OpenAI.

Si creas una implementación llamada `gpt-image-2-prod` que sirve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La misma regla de nombre de implementación se aplica a las llamadas de generación de imágenes enrutadas mediante
el proveedor agrupado `openai`.

### Disponibilidad regional

La generación de imágenes de Azure está disponible actualmente solo en un subconjunto de regiones
(por ejemplo, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulta la lista actual de regiones de Microsoft antes de crear una
implementación y confirma que el modelo específico se ofrece en tu región.

### Diferencias de parámetros

Azure OpenAI y OpenAI pública no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones que OpenAI pública sí permite (por ejemplo ciertos
valores de `background` en `gpt-image-2`) o exponerlas solo en versiones específicas del modelo.
Estas diferencias provienen de Azure y del modelo subyacente, no de
OpenClaw. Si una solicitud de Azure falla con un error de validación, comprueba el
conjunto de parámetros compatible con tu implementación específica y versión de API en el
portal de Azure.

<Note>
Azure OpenAI usa transporte nativo y comportamiento compatible, pero no recibe
los encabezados ocultos de atribución de OpenClaw. Consulta el acordeón **Rutas nativas frente a compatibles con OpenAI**
en [Configuración avanzada](#advanced-configuration)
para más detalles.
</Note>

<Tip>
Para un proveedor independiente de Azure OpenAI Responses (distinto del proveedor `openai`), consulta las referencias de modelo `azure-openai-responses/*` en el
acordeón [Compaction del lado del servidor](#server-side-compaction-responses-api).
</Tip>

<Note>
El tráfico de chat y Responses de Azure necesita configuración específica de proveedor/API de Azure además de una anulación de URL base. Si quieres llamadas de modelos de Azure más allá de la generación de imágenes, usa el flujo de incorporación o una configuración de proveedor que establezca la forma adecuada de API/autenticación de Azure en lugar de asumir que `openai.baseUrl` por sí solo es suficiente.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket frente a SSE)">
    OpenClaw usa primero WebSocket con fallback a SSE (`"auto"`) para `openai/*` y `openai-codex/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket antes de recurrir a SSE
    - Después de un fallo, marca WebSocket como degradado durante ~60 segundos y usa SSE durante el enfriamiento
    - Adjunta encabezados estables de identidad de sesión y turno para reintentos y reconexiones
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamiento |
    |-------|----------------|
    | `"auto"` (predeterminado) | Primero WebSocket, fallback a SSE |
    | `"sse"` | Fuerza solo SSE |
    | `"websocket"` | Fuerza solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentación relacionada de OpenAI:
    - [Realtime API con WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respuestas API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Calentamiento de WebSocket">
    OpenClaw habilita el calentamiento de WebSocket de forma predeterminada para `openai/*` para reducir la latencia del primer turno.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

<a id="openai-fast-mode"></a>

  <Accordion title="Modo rápido">
    OpenClaw expone una alternancia compartida de modo rápido para `openai/*` y `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuración:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Cuando está habilitado, OpenClaw asigna el modo rápido al procesamiento prioritario de OpenAI (`service_tier = "priority"`). Los valores existentes de `service_tier` se conservan y el modo rápido no reescribe `reasoning` ni `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Las anulaciones de sesión tienen prioridad sobre la configuración. Borrar la anulación de sesión en la UI de Sessions devuelve la sesión al valor predeterminado configurado.
    </Note>

  </Accordion>

  <Accordion title="Procesamiento prioritario (service_tier)">
    La API de OpenAI expone procesamiento prioritario mediante `service_tier`. Establécelo por modelo en OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores compatibles: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` solo se envía a endpoints nativos de OpenAI (`api.openai.com`) y endpoints nativos de Codex (`chatgpt.com/backend-api`). Si enrutas cualquiera de los dos proveedores mediante un proxy, OpenClaw deja `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (Responses API)">
    Para modelos directos OpenAI Responses (`openai/*` en `api.openai.com`), OpenClaw habilita automáticamente Compaction del lado del servidor:

    - Fuerza `store: true` (a menos que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: 70 % de `contextWindow` (o `80000` cuando no está disponible)

    <Tabs>
      <Tab title="Habilitar explícitamente">
        Útil para endpoints compatibles como Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Umbral personalizado">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Deshabilitar">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` solo controla la inyección de `context_management`. Los modelos directos OpenAI Responses siguen forzando `store: true` a menos que la compatibilidad establezca `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agéntico estricto">
    Para ejecuciones de la familia GPT-5 en `openai/*` y `openai-codex/*`, OpenClaw puede usar un contrato de ejecución integrado más estricto:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Con `strict-agentic`, OpenClaw:
    - Ya no trata un turno de solo planificación como progreso exitoso cuando hay disponible una acción de herramienta
    - Reintenta el turno con una orientación de actuar ahora
    - Habilita automáticamente `update_plan` para trabajo sustancial
    - Muestra un estado explícito de bloqueo si el modelo sigue planificando sin actuar

    <Note>
    Limitado solo a ejecuciones de la familia GPT-5 de OpenAI y Codex. Otros proveedores y familias de modelos más antiguas mantienen el comportamiento predeterminado.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas frente a compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI de forma diferente a los proxies genéricos compatibles con OpenAI `/v1`:

    **Rutas nativas** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Mantienen `reasoning: { effort: "none" }` solo para modelos que admiten el esfuerzo OpenAI `none`
    - Omiten el razonamiento deshabilitado para modelos o proxies que rechazan `reasoning.effort: "none"`
    - Usan como valor predeterminado esquemas de herramientas en modo estricto
    - Adjuntan encabezados ocultos de atribución solo en hosts nativos verificados
    - Mantienen la adaptación de solicitudes exclusiva de OpenAI (`service_tier`, `store`, compatibilidad de razonamiento, sugerencias de caché de prompts)

    **Rutas proxy/compatibles:**
    - Usan un comportamiento compatible más flexible
    - No fuerzan esquemas estrictos de herramientas ni encabezados exclusivos nativos

    Azure OpenAI usa transporte nativo y comportamiento compatible, pero no recibe los encabezados ocultos de atribución.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
