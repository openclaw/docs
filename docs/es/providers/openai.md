---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres autenticación por suscripción de Codex en lugar de claves de API
    - Necesitas un comportamiento de ejecución agéntica más estricto para GPT-5
summary: Usa OpenAI mediante claves de API o suscripción a Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T18:20:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f099227b8c8be3a4e919ea286fcede1e4e47be60c7593eb63b4cbbe85aa8389
    source_path: providers/openai.md
    workflow: 15
---

OpenAI proporciona API para desarrolladores para modelos GPT. OpenClaw admite tres rutas de la familia OpenAI. El prefijo del modelo selecciona la ruta:

- **Clave de API** — acceso directo a OpenAI Platform con facturación por uso (modelos `openai/*`)
- **Suscripción a Codex mediante PI** — inicio de sesión de ChatGPT/Codex con acceso por suscripción (modelos `openai-codex/*`)
- **Arnés de app-server de Codex** — ejecución nativa de app-server de Codex (modelos `openai/*` más `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI admite explícitamente el uso de OAuth de suscripción en herramientas y flujos de trabajo externos como OpenClaw.

Proveedor, modelo, runtime y canal son capas independientes. Si esas etiquetas se
están mezclando, lee [Agent runtimes](/es/concepts/agent-runtimes) antes de
cambiar la config.

## Elección rápida

| Objetivo                                      | Usa                                                      | Notas                                                                        |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Facturación directa con clave de API          | `openai/gpt-5.5`                                         | Configura `OPENAI_API_KEY` o ejecuta la configuración inicial con clave de API de OpenAI. |
| GPT-5.5 con autenticación por suscripción de ChatGPT/Codex | `openai-codex/gpt-5.5`                                   | Ruta PI predeterminada para OAuth de Codex. Mejor primera opción para configuraciones con suscripción. |
| GPT-5.5 con comportamiento nativo de app-server de Codex | `openai/gpt-5.5` más `embeddedHarness.runtime: "codex"` | Fuerza el arnés de app-server de Codex para esa referencia de modelo.      |
| Generación o edición de imágenes              | `openai/gpt-image-2`                                     | Funciona con `OPENAI_API_KEY` o con OAuth de OpenAI Codex.                    |

<Note>
GPT-5.5 está disponible tanto mediante acceso directo con clave de API de OpenAI Platform como
mediante rutas de suscripción/OAuth. Usa `openai/gpt-5.5` para tráfico directo con `OPENAI_API_KEY`,
`openai-codex/gpt-5.5` para OAuth de Codex mediante PI, o
`openai/gpt-5.5` con `embeddedHarness.runtime: "codex"` para el arnés nativo
de app-server de Codex.
</Note>

<Note>
Habilitar el Plugin de OpenAI, o seleccionar un modelo `openai-codex/*`, no
habilita el Plugin integrado de app-server de Codex. OpenClaw habilita ese Plugin solo
cuando seleccionas explícitamente el arnés nativo de Codex con
`embeddedHarness.runtime: "codex"` o usas una referencia de modelo heredada `codex/*`.
</Note>

## Cobertura de funciones de OpenClaw

| Capacidad de OpenAI        | Superficie de OpenClaw                                     | Estado                                                  |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| Chat / Responses           | proveedor de modelos `openai/<model>`                     | Sí                                                      |
| Modelos con suscripción de Codex | `openai-codex/<model>` con OAuth `openai-codex`    | Sí                                                      |
| Arnés de app-server de Codex | `openai/<model>` con `embeddedHarness.runtime: codex`   | Sí                                                      |
| Búsqueda web del lado del servidor | herramienta nativa OpenAI Responses                | Sí, cuando la búsqueda web está habilitada y no hay un proveedor fijado |
| Imágenes                   | `image_generate`                                           | Sí                                                      |
| Videos                     | `video_generate`                                           | Sí                                                      |
| Texto a voz                | `messages.tts.provider: "openai"` / `tts`                  | Sí                                                      |
| Voz a texto por lotes      | `tools.media.audio` / comprensión de medios                | Sí                                                      |
| Voz a texto en streaming   | Voice Call `streaming.provider: "openai"`                  | Sí                                                      |
| Voz en tiempo real         | Voice Call `realtime.provider: "openai"` / Control UI Talk | Sí                                                      |
| Embeddings                 | proveedor de embeddings de memoria                         | Sí                                                      |

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave de API (OpenAI Platform)">
    **Ideal para:** acceso directo a la API y facturación por uso.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea o copia una clave de API desde el [panel de OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Ejecuta la configuración inicial">
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

    ### Resumen de la ruta

    | Model ref | Ruta | Autenticación |
    |-----------|------|---------------|
    | `openai/gpt-5.5` | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API directa de OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    `openai/*` es la ruta directa con clave de API de OpenAI, a menos que fuerces explícitamente
    el arnés de app-server de Codex. Usa `openai-codex/*` para OAuth de Codex mediante
    el ejecutor PI predeterminado, o usa `openai/gpt-5.5` con
    `embeddedHarness.runtime: "codex"` para ejecución nativa de app-server de Codex.
    </Note>

    ### Ejemplo de config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **no** expone `openai/gpt-5.3-codex-spark`. Las solicitudes activas a la API de OpenAI rechazan ese modelo, y el catálogo actual de Codex tampoco lo expone.
    </Warning>

  </Tab>

  <Tab title="Suscripción a Codex">
    **Ideal para:** usar tu suscripción de ChatGPT/Codex en lugar de una clave de API independiente. Codex cloud requiere inicio de sesión en ChatGPT.

    <Steps>
      <Step title="Ejecuta OAuth de Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        O ejecuta OAuth directamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configuraciones sin interfaz o hostiles a callbacks, añade `--device-code` para iniciar sesión con un flujo de código de dispositivo de ChatGPT en lugar del callback del navegador en localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Establece el modelo predeterminado">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Resumen de la ruta

    | Model ref | Ruta | Autenticación |
    |-----------|------|---------------|
    | `openai-codex/gpt-5.5` | OAuth de ChatGPT/Codex mediante PI | inicio de sesión de Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Arnés de app-server de Codex | autenticación de app-server de Codex |

    <Note>
    Sigue usando el id de proveedor `openai-codex` para comandos de autenticación/perfil. El
    prefijo de modelo `openai-codex/*` también es la ruta PI explícita para OAuth de Codex.
    No selecciona ni habilita automáticamente el arnés integrado de app-server de Codex.
    </Note>

    ### Ejemplo de config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    La configuración inicial ya no importa material OAuth desde `~/.codex`. Inicia sesión con OAuth en el navegador (predeterminado) o con el flujo de código de dispositivo anterior: OpenClaw administra las credenciales resultantes en su propio almacén de autenticación del agente.
    </Note>

    ### Indicador de estado

    El chat `/status` muestra qué runtime de modelo está activo para la sesión actual.
    El arnés PI predeterminado aparece como `Runtime: OpenClaw Pi Default`. Cuando se
    selecciona el arnés integrado de app-server de Codex, `/status` muestra
    `Runtime: OpenAI Codex`. Las sesiones existentes conservan su id de arnés registrado, así que usa
    `/new` o `/reset` después de cambiar `embeddedHarness` si quieres que `/status`
    refleje una nueva elección de PI/Codex.

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto del runtime como valores independientes.

    Para `openai-codex/gpt-5.5` mediante OAuth de Codex:

    - `contextWindow` nativo: `1000000`
    - Límite predeterminado de `contextTokens` del runtime: `272000`

    El límite predeterminado más pequeño tiene mejores características de latencia y calidad en la práctica. Anúlalo con `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Usa `contextWindow` para declarar metadatos nativos del modelo. Usa `contextTokens` para limitar el presupuesto de contexto del runtime.
    </Note>

    ### Recuperación del catálogo

    OpenClaw usa metadatos del catálogo ascendente de Codex para `gpt-5.5` cuando están
    presentes. Si el descubrimiento activo de Codex omite la fila `openai-codex/gpt-5.5` mientras
    la cuenta está autenticada, OpenClaw sintetiza esa fila de modelo OAuth para que
    las ejecuciones de Cron, subagentes y del modelo predeterminado configurado no fallen con
    `Unknown model`.

  </Tab>
</Tabs>

## Generación de imágenes

El Plugin integrado `openai` registra la generación de imágenes mediante la herramienta `image_generate`.
Admite tanto la generación de imágenes de OpenAI con clave de API como la generación de imágenes
mediante OAuth de Codex a través de la misma referencia de modelo `openai/gpt-image-2`.

| Capacidad                | Clave de API de OpenAI              | OAuth de Codex                        |
| ------------------------ | ----------------------------------- | ------------------------------------- |
| Model ref                | `openai/gpt-image-2`                | `openai/gpt-image-2`                  |
| Autenticación            | `OPENAI_API_KEY`                    | inicio de sesión con OAuth de OpenAI Codex |
| Transporte               | API de imágenes de OpenAI           | backend de Codex Responses            |
| Máx. imágenes por solicitud | 4                                | 4                                     |
| Modo edición             | Habilitado (hasta 5 imágenes de referencia) | Habilitado (hasta 5 imágenes de referencia) |
| Anulaciones de tamaño    | Compatibles, incluidos tamaños 2K/4K | Compatibles, incluidos tamaños 2K/4K |
| Relación de aspecto / resolución | No se reenvían a la API de imágenes de OpenAI | Se asignan a un tamaño compatible cuando es seguro |

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
Consulta [Generación de imágenes](/es/tools/image-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de failover.
</Note>

`gpt-image-2` es el valor predeterminado tanto para la generación de imágenes a partir de texto en OpenAI como para la
edición de imágenes. `gpt-image-1` sigue siendo utilizable como anulación explícita de modelo, pero los nuevos
flujos de trabajo de imágenes de OpenAI deben usar `openai/gpt-image-2`.

Para instalaciones con OAuth de Codex, mantén la misma referencia `openai/gpt-image-2`. Cuando se
configura un perfil OAuth de `openai-codex`, OpenClaw resuelve ese token de acceso OAuth
almacenado y envía las solicitudes de imagen a través del backend de Codex Responses. No
prueba primero `OPENAI_API_KEY` ni recurre silenciosamente a una clave de API para esa
solicitud. Configura `models.providers.openai` explícitamente con una clave de API,
una URL base personalizada o un endpoint de Azure cuando quieras usar la ruta directa de la API de imágenes de OpenAI
en su lugar.
Si ese endpoint de imágenes personalizado está en una LAN/dirección privada de confianza, también configura
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloqueados los endpoints de imágenes OpenAI-compatibles privados/internos a menos que esta opción explícita
esté presente.

Generar:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generación de video

El Plugin integrado `openai` registra la generación de video mediante la herramienta `video_generate`.

| Capacidad         | Valor                                                                             |
| ----------------- | --------------------------------------------------------------------------------- |
| Modelo predeterminado | `openai/sora-2`                                                               |
| Modos             | Texto a video, imagen a video, edición de un solo video                           |
| Entradas de referencia | 1 imagen o 1 video                                                            |
| Anulaciones de tamaño | Compatibles                                                                    |
| Otras anulaciones | `aspectRatio`, `resolution`, `audio`, `watermark` se ignoran con una advertencia de herramienta |

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
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de herramientas, la selección de proveedor y el comportamiento de failover.
</Note>

## Contribución al prompt de GPT-5

OpenClaw añade una contribución compartida al prompt de GPT-5 para ejecuciones de la familia GPT-5 entre proveedores. Se aplica por id de modelo, por lo que `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` y otras referencias compatibles de GPT-5 reciben la misma superposición. Los modelos GPT-4.x más antiguos no la reciben.

El arnés nativo integrado de Codex usa el mismo comportamiento de GPT-5 y la misma superposición de Heartbeat a través de instrucciones de desarrollador del app-server de Codex, por lo que las sesiones `openai/gpt-5.x` forzadas mediante `embeddedHarness.runtime: "codex"` mantienen la misma guía de continuidad y Heartbeat proactivo aunque Codex sea dueño del resto del prompt del arnés.

La contribución de GPT-5 añade un contrato de comportamiento etiquetado para persistencia de personalidad, seguridad de ejecución, disciplina de herramientas, forma de salida, comprobaciones de finalización y verificación. El comportamiento específico del canal para respuestas y mensajes silenciosos se mantiene en el prompt compartido del sistema de OpenClaw y en la política de entrega saliente. La guía de GPT-5 está siempre habilitada para los modelos coincidentes. La capa amistosa de estilo de interacción es independiente y configurable.

| Valor                  | Efecto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Habilitar la capa amistosa de estilo de interacción |
| `"on"`                 | Alias de `"friendly"`                       |
| `"off"`                | Deshabilitar solo la capa de estilo amistoso |

<Tabs>
  <Tab title="Config">
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
Los valores no distinguen entre mayúsculas y minúsculas en tiempo de ejecución, por lo que `"Off"` y `"off"` deshabilitan ambas la capa de estilo amistoso.
</Tip>

<Note>
El ajuste heredado `plugins.entries.openai.config.personality` sigue leyéndose como respaldo de compatibilidad cuando no está configurado el ajuste compartido `agents.defaults.promptOverlays.gpt5.personality`.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El Plugin integrado `openai` registra la síntesis de voz para la superficie `messages.tts`.

    | Ajuste | Ruta de config | Predeterminado |
    |--------|----------------|----------------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidad | `messages.tts.providers.openai.speed` | (sin definir) |
    | Instrucciones | `messages.tts.providers.openai.instructions` | (sin definir, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para archivos |
    | Clave de API | `messages.tts.providers.openai.apiKey` | Usa `OPENAI_API_KEY` como respaldo |
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
    Configura `OPENAI_TTS_BASE_URL` para anular la URL base de TTS sin afectar el endpoint de la API de chat.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El Plugin integrado `openai` registra voz a texto por lotes mediante
    la superficie de transcripción de comprensión de medios de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Endpoint: REST de OpenAI `/v1/audio/transcriptions`
    - Ruta de entrada: carga de archivo de audio multipart
    - Compatible con OpenClaw dondequiera que la transcripción de audio entrante use
      `tools.media.audio`, incluidos segmentos de canal de voz de Discord y
      adjuntos de audio del canal

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

    Las sugerencias de idioma y prompt se reenvían a OpenAI cuando las proporciona la
    config compartida de medios de audio o la solicitud de transcripción por llamada.

  </Accordion>

  <Accordion title="Transcripción en tiempo real">
    El Plugin integrado `openai` registra transcripción en tiempo real para el Plugin Voice Call.

    | Ajuste | Ruta de config | Predeterminado |
    |--------|----------------|----------------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (sin definir) |
    | Prompt | `...openai.prompt` | (sin definir) |
    | Duración del silencio | `...openai.silenceDurationMs` | `800` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Clave de API | `...openai.apiKey` | Usa `OPENAI_API_KEY` como respaldo |

    <Note>
    Usa una conexión WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Este proveedor de streaming es para la ruta de transcripción en tiempo real de Voice Call; la voz de Discord actualmente registra segmentos cortos y usa en su lugar la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz en tiempo real">
    El Plugin integrado `openai` registra voz en tiempo real para el Plugin Voice Call.

    | Ajuste | Ruta de config | Predeterminado |
    |--------|----------------|----------------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Duración del silencio | `...openai.silenceDurationMs` | `500` |
    | Clave de API | `...openai.apiKey` | Usa `OPENAI_API_KEY` como respaldo |

    <Note>
    Admite Azure OpenAI mediante las claves de config `azureEndpoint` y `azureDeployment`. Admite llamadas bidireccionales de herramientas. Usa formato de audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints de Azure OpenAI

El proveedor integrado `openai` puede apuntar a un recurso de Azure OpenAI para la generación de imágenes
anulando la URL base. En la ruta de generación de imágenes, OpenClaw
detecta nombres de host de Azure en `models.providers.openai.baseUrl` y cambia a
la forma de solicitud de Azure automáticamente.

<Note>
La voz en tiempo real usa una ruta de configuración separada
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulta el acordeón de **Voz en tiempo real**
en [Voz y habla](#voice-and-speech) para ver su configuración de Azure.
</Note>

Usa Azure OpenAI cuando:

- Ya tienes una suscripción, cuota o acuerdo empresarial de Azure OpenAI
- Necesitas residencia regional de datos o controles de cumplimiento que proporciona Azure
- Quieres mantener el tráfico dentro de una tenencia existente de Azure

### Configuración

Para la generación de imágenes con Azure a través del proveedor integrado `openai`, apunta
`models.providers.openai.baseUrl` a tu recurso de Azure y configura `apiKey` con
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

- Envía la cabecera `api-key` en lugar de `Authorization: Bearer`
- Usa rutas delimitadas por deployment (`/openai/deployments/{deployment}/...`)
- Añade `?api-version=...` a cada solicitud

Otras URL base (OpenAI público, proxies compatibles con OpenAI) conservan la forma estándar
de solicitud de imágenes de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor `openai` requiere
OpenClaw 2026.4.22 o posterior. Las versiones anteriores tratan cualquier
`openai.baseUrl` personalizada como el endpoint público de OpenAI y fallarán contra deployments
de imágenes de Azure.
</Note>

### Versión de API

Configura `AZURE_OPENAI_API_VERSION` para fijar una versión específica de Azure, ya sea preview o GA,
para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está configurada.

### Los nombres de modelo son nombres de deployment

Azure OpenAI vincula los modelos a deployments. Para solicitudes de generación de imágenes de Azure
enrutadas a través del proveedor integrado `openai`, el campo `model` en OpenClaw
debe ser el **nombre del deployment de Azure** que configuraste en el portal de Azure, no
el id público del modelo de OpenAI.

Si creas un deployment llamado `gpt-image-2-prod` que sirve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La misma regla de nombre de deployment se aplica a las llamadas de generación de imágenes enrutadas a través
del proveedor integrado `openai`.

### Disponibilidad regional

La generación de imágenes de Azure actualmente solo está disponible en un subconjunto de regiones
(por ejemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulta la lista actual de regiones de Microsoft antes de crear un
deployment, y confirma que el modelo específico se ofrece en tu región.

### Diferencias de parámetros

Azure OpenAI y OpenAI público no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones que OpenAI público sí permite (por ejemplo ciertos
valores de `background` en `gpt-image-2`) o exponerlas solo en versiones
específicas del modelo. Estas diferencias provienen de Azure y del modelo subyacente, no de
OpenClaw. Si una solicitud a Azure falla con un error de validación, comprueba el
conjunto de parámetros admitido por tu deployment y versión de API específicos en el
portal de Azure.

<Note>
Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe
las cabeceras ocultas de atribución de OpenClaw; consulta el acordeón **Rutas nativas vs compatibles con OpenAI**
en [Configuración avanzada](#advanced-configuration).

Para tráfico de chat o Responses en Azure (más allá de la generación de imágenes), usa el
flujo de configuración inicial o una config dedicada de proveedor Azure; `openai.baseUrl` por sí solo
no adopta la forma de API/autenticación de Azure. Existe un proveedor separado
`azure-openai-responses/*`; consulta
el acordeón de Compaction del lado del servidor más abajo.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    OpenClaw usa WebSocket primero con respaldo SSE (`"auto"`) tanto para `openai/*` como para `openai-codex/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket antes de recurrir a SSE
    - Después de un fallo, marca WebSocket como degradado durante ~60 segundos y usa SSE durante el enfriamiento
    - Adjunta cabeceras estables de identidad de sesión y turno para reintentos y reconexiones
    - Normaliza los contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamiento |
    |-------|----------------|
    | `"auto"` (predeterminado) | WebSocket primero, respaldo SSE |
    | `"sse"` | Forzar solo SSE |
    | `"websocket"` | Forzar solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentación relacionada de OpenAI:
    - [API Realtime con WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respuestas de API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Calentamiento de WebSocket">
    OpenClaw habilita el calentamiento de WebSocket de forma predeterminada para `openai/*` y `openai-codex/*` para reducir la latencia del primer turno.

    ```json5
    // Deshabilitar calentamiento
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo fast">
    OpenClaw expone un alternador compartido de modo fast para `openai/*` y `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Cuando está habilitado, OpenClaw asigna el modo fast al procesamiento prioritario de OpenAI (`service_tier = "priority"`). Los valores existentes de `service_tier` se conservan, y el modo fast no reescribe `reasoning` ni `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Las anulaciones de sesión tienen prioridad sobre la config. Borrar la anulación de sesión en la interfaz de Sesiones devuelve la sesión al valor predeterminado configurado.
    </Note>

  </Accordion>

  <Accordion title="Procesamiento prioritario (service_tier)">
    La API de OpenAI expone el procesamiento prioritario mediante `service_tier`. Configúralo por modelo en OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores admitidos: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` solo se reenvía a endpoints nativos de OpenAI (`api.openai.com`) y endpoints nativos de Codex (`chatgpt.com/backend-api`). Si enrutas cualquiera de los dos proveedores a través de un proxy, OpenClaw deja `service_tier` sin cambios.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (Responses API)">
    Para modelos directos de OpenAI Responses (`openai/*` en `api.openai.com`), el envoltorio de stream del arnés Pi del Plugin OpenAI habilita automáticamente la Compaction del lado del servidor:

    - Fuerza `store: true` (a menos que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: 70% de `contextWindow` (o `80000` cuando no está disponible)

    Esto se aplica a la ruta del arnés Pi integrado y a los hooks del proveedor OpenAI usados por ejecuciones integradas. El arnés nativo de app-server de Codex administra su propio contexto mediante Codex y se configura por separado con `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Habilitar explícitamente">
        Útil para endpoints compatibles como Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
    `responsesServerCompaction` solo controla la inyección de `context_management`. Los modelos directos de OpenAI Responses siguen forzando `store: true` a menos que la compatibilidad establezca `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT estrictamente agéntico">
    Para ejecuciones de la familia GPT-5 en `openai/*`, OpenClaw puede usar un contrato de ejecución integrada más estricto:

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
    - Ya no trata un turno de solo plan como progreso exitoso cuando hay disponible una acción de herramienta
    - Reintenta el turno con una indicación para actuar ahora
    - Habilita automáticamente `update_plan` para trabajo sustancial
    - Muestra un estado bloqueado explícito si el modelo sigue planificando sin actuar

    <Note>
    Limitado solo a ejecuciones de la familia GPT-5 de OpenAI y Codex. Otros proveedores y familias de modelos más antiguas conservan el comportamiento predeterminado.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas vs compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI de forma distinta a los proxies genéricos compatibles con OpenAI `/v1`:

    **Rutas nativas** (`openai/*`, Azure OpenAI):
    - Conservan `reasoning: { effort: "none" }` solo para modelos que admiten el esfuerzo `none` de OpenAI
    - Omiten el razonamiento deshabilitado para modelos o proxies que rechazan `reasoning.effort: "none"`
    - Usan por defecto esquemas de herramientas en modo estricto
    - Adjuntan cabeceras ocultas de atribución solo en hosts nativos verificados
    - Conservan la forma de solicitud exclusiva de OpenAI (`service_tier`, `store`, compatibilidad de razonamiento, sugerencias de caché de prompt)

    **Rutas proxy/compatibles:**
    - Usan un comportamiento de compatibilidad más flexible
    - Eliminan Completions `store` de cargas útiles `openai-completions` no nativas
    - Aceptan JSON de paso directo avanzado `params.extra_body`/`params.extraBody` para proxies de Completions compatibles con OpenAI
    - No fuerzan esquemas estrictos de herramientas ni cabeceras exclusivas nativas

    Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe las cabeceras ocultas de atribución.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de failover.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de herramientas de imagen y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de herramientas de video y selección de proveedor.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
