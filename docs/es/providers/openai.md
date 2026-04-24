---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres autenticación por suscripción de Codex en lugar de claves de API
    - Necesitas un comportamiento de ejecución del agente GPT-5 más estricto
summary: Usa OpenAI mediante claves de API o suscripción de Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T09:01:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d533338fa15d866bb69584706162ce099bb4a1edc9851183fb5442730ebdd9b
    source_path: providers/openai.md
    workflow: 15
---

OpenAI proporciona API para desarrolladores para modelos GPT. OpenClaw admite tres rutas de la familia OpenAI. El prefijo del modelo selecciona la ruta:

- **Clave de API** — acceso directo a OpenAI Platform con facturación por uso (modelos `openai/*`)
- **Suscripción de Codex a través de PI** — inicio de sesión de ChatGPT/Codex con acceso por suscripción (modelos `openai-codex/*`)
- **Arnés app-server de Codex** — ejecución nativa del app-server de Codex (modelos `openai/*` más `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI admite explícitamente el uso de OAuth por suscripción en herramientas y flujos de trabajo externos como OpenClaw.

<Note>
GPT-5.5 está disponible actualmente en OpenClaw mediante rutas de suscripción/OAuth:
`openai-codex/gpt-5.5` con el ejecutor PI, o `openai/gpt-5.5` con el
arnés app-server de Codex. El acceso directo mediante clave de API para `openai/gpt-5.5`
es compatible una vez que OpenAI habilite GPT-5.5 en la API pública; hasta entonces usa un
modelo habilitado para API como `openai/gpt-5.4` para configuraciones de `OPENAI_API_KEY`.
</Note>

<Note>
Habilitar el Plugin de OpenAI, o seleccionar un modelo `openai-codex/*`, no
habilita el Plugin integrado del app-server de Codex. OpenClaw habilita ese Plugin solo
cuando seleccionas explícitamente el arnés nativo de Codex con
`embeddedHarness.runtime: "codex"` o usas una referencia heredada de modelo `codex/*`.
</Note>

## Cobertura de funciones de OpenClaw

| Capacidad de OpenAI       | Superficie de OpenClaw                                      | Estado                                                 |
| ------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | proveedor de modelos `openai/<model>`                      | Sí                                                     |
| Modelos por suscripción de Codex | `openai-codex/<model>` con OAuth `openai-codex`     | Sí                                                     |
| Arnés app-server de Codex | `openai/<model>` con `embeddedHarness.runtime: codex`       | Sí                                                     |
| Búsqueda web del lado del servidor | herramienta nativa OpenAI Responses                | Sí, cuando la búsqueda web está habilitada y no hay proveedor fijado |
| Imágenes                  | `image_generate`                                            | Sí                                                     |
| Videos                    | `video_generate`                                            | Sí                                                     |
| Texto a voz               | `messages.tts.provider: "openai"` / `tts`                   | Sí                                                     |
| Voz a texto por lotes     | `tools.media.audio` / comprensión de medios                 | Sí                                                     |
| Voz a texto en streaming  | Voice Call `streaming.provider: "openai"`                   | Sí                                                     |
| Voz en tiempo real        | Voice Call `realtime.provider: "openai"` / Talk de la interfaz de Control | Sí                                          |
| Embeddings                | proveedor de embeddings de memoria                          | Sí                                                     |

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave de API (OpenAI Platform)">
    **Lo mejor para:** acceso directo a la API y facturación por uso.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea o copia una clave de API desde el [panel de OpenAI Platform](https://platform.openai.com/api-keys).
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

    ### Resumen de la ruta

    | Model ref | Ruta | Autenticación |
    |-----------|------|---------------|
    | `openai/gpt-5.4` | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Ruta futura directa de API una vez que OpenAI habilite GPT-5.5 en la API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` es la ruta directa de OpenAI con clave de API, a menos que fuerces explícitamente
    el arnés app-server de Codex. GPT-5.5 en sí es actualmente solo de suscripción/OAuth;
    usa `openai-codex/*` para OAuth de Codex mediante el ejecutor PI predeterminado.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **no** expone `openai/gpt-5.3-codex-spark`. Las solicitudes en vivo a la API de OpenAI rechazan ese modelo, y el catálogo actual de Codex tampoco lo expone.
    </Warning>

  </Tab>

  <Tab title="Suscripción de Codex">
    **Lo mejor para:** usar tu suscripción de ChatGPT/Codex en lugar de una clave de API aparte. Codex cloud requiere iniciar sesión en ChatGPT.

    <Steps>
      <Step title="Ejecuta OAuth de Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        O ejecuta OAuth directamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configuraciones sin interfaz o incompatibles con callback, añade `--device-code` para iniciar sesión con un flujo de código de dispositivo de ChatGPT en lugar del callback del navegador en localhost:

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
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | arnés app-server de Codex | autenticación del app-server de Codex |

    <Note>
    Sigue usando el id. de proveedor `openai-codex` para los comandos de autenticación/perfil. El
    prefijo de modelo `openai-codex/*` también es la ruta PI explícita para OAuth de Codex.
    No selecciona ni habilita automáticamente el arnés integrado del app-server de Codex.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    La incorporación ya no importa material OAuth desde `~/.codex`. Inicia sesión con OAuth en el navegador (predeterminado) o con el flujo de código de dispositivo anterior: OpenClaw gestiona las credenciales resultantes en su propio almacén de autenticación del agente.
    </Note>

    ### Indicador de estado

    El chat `/status` muestra qué arnés incrustado está activo para la sesión
    actual. El arnés PI predeterminado aparece como `Runner: pi (embedded)` y no
    añade una insignia separada. Cuando se selecciona el arnés integrado del app-server de Codex,
    `/status` añade el id. del arnés no PI junto a `Fast`, por ejemplo
    `Fast · codex`. Las sesiones existentes conservan el id. de arnés registrado, así que usa
    `/new` o `/reset` después de cambiar `embeddedHarness` si quieres que `/status`
    refleje una nueva elección de PI/Codex.

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto del tiempo de ejecución como valores separados.

    Para `openai-codex/gpt-5.5` mediante OAuth de Codex:

    - `contextWindow` nativo: `1000000`
    - límite predeterminado de `contextTokens` en tiempo de ejecución: `272000`

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
    Usa `contextWindow` para declarar metadatos nativos del modelo. Usa `contextTokens` para limitar el presupuesto de contexto en tiempo de ejecución.
    </Note>

  </Tab>
</Tabs>

## Generación de imágenes

El Plugin integrado `openai` registra la generación de imágenes mediante la herramienta `image_generate`.
Admite tanto la generación de imágenes de OpenAI con clave de API como la
generación de imágenes con OAuth de Codex a través de la misma referencia de modelo `openai/gpt-image-2`.

| Capacidad                | Clave de API de OpenAI               | OAuth de Codex                        |
| ------------------------ | ------------------------------------ | ------------------------------------- |
| Referencia de modelo     | `openai/gpt-image-2`                 | `openai/gpt-image-2`                  |
| Autenticación            | `OPENAI_API_KEY`                     | inicio de sesión con OAuth de OpenAI Codex |
| Transporte               | API de imágenes de OpenAI            | backend de Codex Responses            |
| Máximo de imágenes por solicitud | 4                            | 4                                     |
| Modo edición             | Habilitado (hasta 5 imágenes de referencia) | Habilitado (hasta 5 imágenes de referencia) |
| Anulaciones de tamaño    | Compatibles, incluidos tamaños 2K/4K | Compatibles, incluidos tamaños 2K/4K  |
| Relación de aspecto / resolución | No se reenvían a la API de imágenes de OpenAI | Se mapean a un tamaño compatible cuando es seguro |

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
Consulta [Generación de imágenes](/es/tools/image-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de conmutación por error.
</Note>

`gpt-image-2` es el valor predeterminado tanto para la generación de imágenes a partir de texto de OpenAI como para la
edición de imágenes. `gpt-image-1` sigue siendo utilizable como anulación explícita de modelo, pero los
nuevos flujos de trabajo de imágenes de OpenAI deben usar `openai/gpt-image-2`.

Para instalaciones con OAuth de Codex, mantén la misma referencia `openai/gpt-image-2`. Cuando está
configurado un perfil OAuth de `openai-codex`, OpenClaw resuelve ese token de acceso OAuth almacenado
y envía las solicitudes de imagen mediante el backend de Codex Responses. No
intenta primero `OPENAI_API_KEY` ni recurre silenciosamente a una clave de API para esa
solicitud. Configura `models.providers.openai` explícitamente con una clave de API,
URL base personalizada o endpoint de Azure cuando quieras la ruta directa de la API de imágenes de OpenAI
en su lugar.
Si ese endpoint de imagen personalizado está en una LAN/dirección privada de confianza, establece también
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloqueados los endpoints de imagen privados/internos compatibles con OpenAI a menos que esta opción esté
presente.

Generar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Un póster de lanzamiento pulido para OpenClaw en macOS" size=3840x2160 count=1
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Conserva la forma del objeto, cambia el material a vidrio translúcido" image=/path/to/reference.png size=1024x1536
```

## Generación de video

El Plugin integrado `openai` registra la generación de video mediante la herramienta `video_generate`.

| Capacidad       | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo predeterminado    | `openai/sora-2`                                                        |
| Modos            | Texto a video, imagen a video, edición de un solo video                           |
| Entradas de referencia | 1 imagen o 1 video                                                           |
| Anulaciones de tamaño   | Compatibles                                                                 |
| Otras anulaciones  | `aspectRatio`, `resolution`, `audio`, `watermark` se ignoran con una advertencia de herramienta |

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
Consulta [Generación de video](/es/tools/video-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de conmutación por error.
</Note>

## Contribución de prompt de GPT-5

OpenClaw añade una contribución compartida de prompt de GPT-5 para ejecuciones de la familia GPT-5 entre proveedores. Se aplica por id. de modelo, por lo que `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` y otras referencias compatibles con GPT-5 reciben la misma superposición. Los modelos anteriores GPT-4.x no la reciben.

El arnés nativo integrado de Codex usa el mismo comportamiento de GPT-5 y la misma superposición de Heartbeat mediante instrucciones para desarrolladores del app-server de Codex, por lo que las sesiones `openai/gpt-5.x` forzadas mediante `embeddedHarness.runtime: "codex"` mantienen la misma continuidad y la misma guía proactiva de Heartbeat, aunque Codex sea propietario del resto del prompt del arnés.

La contribución de GPT-5 añade un contrato de comportamiento etiquetado para persistencia de la personalidad, seguridad de ejecución, disciplina con herramientas, forma de salida, comprobaciones de finalización y verificación. El comportamiento específico del canal para respuestas y mensajes silenciosos permanece en el prompt del sistema compartido de OpenClaw y en la política de entrega saliente. La guía de GPT-5 está siempre habilitada para los modelos coincidentes. La capa de estilo de interacción amistosa es independiente y configurable.

| Value                  | Efecto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Habilita la capa de estilo de interacción amistosa |
| `"on"`                 | Alias de `"friendly"`                       |
| `"off"`                | Desactiva solo la capa de estilo amistoso   |

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
Los valores no distinguen entre mayúsculas y minúsculas en tiempo de ejecución, por lo que tanto `"Off"` como `"off"` desactivan la capa de estilo amistoso.
</Tip>

<Note>
El valor heredado `plugins.entries.openai.config.personality` sigue leyéndose como alternativa de compatibilidad cuando no está establecido el ajuste compartido `agents.defaults.promptOverlays.gpt5.personality`.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El Plugin integrado `openai` registra síntesis de voz para la superficie `messages.tts`.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidad | `messages.tts.providers.openai.speed` | (sin establecer) |
    | Instrucciones | `messages.tts.providers.openai.instructions` | (sin establecer, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para archivos |
    | Clave de API | `messages.tts.providers.openai.apiKey` | Recurre a `OPENAI_API_KEY` |
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
    El Plugin integrado `openai` registra voz a texto por lotes mediante
    la superficie de transcripción de comprensión de medios de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Ruta de entrada: carga de archivo de audio multipart
    - Compatible en OpenClaw dondequiera que la transcripción de audio entrante use
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
    configuración compartida de medios de audio o la solicitud de transcripción por llamada.

  </Accordion>

  <Accordion title="Transcripción en tiempo real">
    El Plugin integrado `openai` registra transcripción en tiempo real para el Plugin Voice Call.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (sin establecer) |
    | Prompt | `...openai.prompt` | (sin establecer) |
    | Duración del silencio | `...openai.silenceDurationMs` | `800` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Clave de API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Usa una conexión WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Este proveedor de streaming es para la ruta de transcripción en tiempo real de Voice Call; la voz de Discord actualmente graba segmentos cortos y usa en su lugar la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz en tiempo real">
    El Plugin integrado `openai` registra voz en tiempo real para el Plugin Voice Call.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Duración del silencio | `...openai.silenceDurationMs` | `500` |
    | Clave de API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Admite Azure OpenAI mediante las claves de configuración `azureEndpoint` y `azureDeployment`. Admite llamadas bidireccionales a herramientas. Usa formato de audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints de Azure OpenAI

El proveedor integrado `openai` puede dirigirse a un recurso de Azure OpenAI para generación de imágenes
anulando la URL base. En la ruta de generación de imágenes, OpenClaw
detecta nombres de host de Azure en `models.providers.openai.baseUrl` y cambia a
la forma de solicitud de Azure automáticamente.

<Note>
La voz en tiempo real usa una ruta de configuración separada
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulta el acordeón **Voz en tiempo real**
bajo [Voz y habla](#voice-and-speech) para ver sus
ajustes de Azure.
</Note>

Usa Azure OpenAI cuando:

- Ya tengas una suscripción, cuota o acuerdo empresarial de Azure OpenAI
- Necesites residencia de datos regional o controles de cumplimiento que Azure ofrece
- Quieras mantener el tráfico dentro de una tenencia existente de Azure

### Configuración

Para la generación de imágenes con Azure mediante el proveedor integrado `openai`, apunta
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
- Usa rutas con ámbito de implementación (`/openai/deployments/{deployment}/...`)
- Añade `?api-version=...` a cada solicitud

Otras URL base (OpenAI pública, proxies compatibles con OpenAI) mantienen la forma estándar
de solicitud de imágenes de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor `openai` requiere
OpenClaw 2026.4.22 o posterior. Las versiones anteriores tratan cualquier
`openai.baseUrl` personalizada como el endpoint público de OpenAI y fallarán con implementaciones de imágenes de Azure.
</Note>

### Versión de la API

Establece `AZURE_OPENAI_API_VERSION` para fijar una versión específica preliminar o GA de Azure
para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está establecida.

### Los nombres de modelo son nombres de implementación

Azure OpenAI vincula modelos a implementaciones. Para solicitudes de generación de imágenes de Azure
enrutadas mediante el proveedor integrado `openai`, el campo `model` en OpenClaw
debe ser el **nombre de implementación de Azure** que configuraste en el portal de Azure, no
el id. público del modelo de OpenAI.

Si creas una implementación llamada `gpt-image-2-prod` que sirve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Un póster limpio" size=1024x1024 count=1
```

La misma regla de nombre de implementación se aplica a las llamadas de generación de imágenes enrutadas mediante
el proveedor integrado `openai`.

### Disponibilidad regional

La generación de imágenes de Azure está disponible actualmente solo en un subconjunto de regiones
(por ejemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulta la lista actual de regiones de Microsoft antes de crear una
implementación y confirma que el modelo específico se ofrezca en tu región.

### Diferencias de parámetros

Azure OpenAI y OpenAI pública no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones que OpenAI pública permite (por ejemplo ciertos
valores de `background` en `gpt-image-2`) o exponerlas solo en versiones específicas
del modelo. Estas diferencias provienen de Azure y del modelo subyacente, no de
OpenClaw. Si una solicitud de Azure falla con un error de validación, comprueba el
conjunto de parámetros compatible con tu implementación y versión de API específicas en el
portal de Azure.

<Note>
Azure OpenAI usa comportamiento de transporte y compatibilidad nativos, pero no recibe
los encabezados ocultos de atribución de OpenClaw; consulta el acordeón **Rutas nativas vs. compatibles con OpenAI**
bajo [Configuración avanzada](#advanced-configuration).

Para tráfico de chat o Responses en Azure (más allá de la generación de imágenes), usa el
flujo de incorporación o una configuración dedicada de proveedor de Azure; `openai.baseUrl` por sí sola
no adopta la forma de API/autenticación de Azure. Existe un proveedor separado
`azure-openai-responses/*`; consulta
el acordeón de Compaction del lado del servidor más abajo.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    OpenClaw usa WebSocket primero con alternativa a SSE (`"auto"`) tanto para `openai/*` como para `openai-codex/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta una vez un fallo inicial de WebSocket antes de recurrir a SSE
    - Tras un fallo, marca WebSocket como degradado durante ~60 segundos y usa SSE durante el enfriamiento
    - Adjunta encabezados estables de identidad de sesión y turno para reintentos y reconexiones
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Value | Comportamiento |
    |-------|----------|
    | `"auto"` (predeterminado) | WebSocket primero, alternativa a SSE |
    | `"sse"` | Fuerza solo SSE |
    | `"websocket"` | Fuerza solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
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
    // Desactivar el calentamiento
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

  <Accordion title="Modo rápido">
    OpenClaw expone un selector compartido de modo rápido para `openai/*` y `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Cuando está habilitado, OpenClaw asigna el modo rápido al procesamiento prioritario de OpenAI (`service_tier = "priority"`). Los valores existentes de `service_tier` se conservan, y el modo rápido no reescribe `reasoning` ni `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Las anulaciones de sesión tienen prioridad sobre la configuración. Borrar la anulación de sesión en la interfaz de Sessions devuelve la sesión al valor predeterminado configurado.
    </Note>

  </Accordion>

  <Accordion title="Procesamiento prioritario (service_tier)">
    La API de OpenAI expone el procesamiento prioritario mediante `service_tier`. Establécelo por modelo en OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores compatibles: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` solo se reenvía a endpoints nativos de OpenAI (`api.openai.com`) y endpoints nativos de Codex (`chatgpt.com/backend-api`). Si enrutas cualquiera de los dos proveedores a través de un proxy, OpenClaw deja `service_tier` sin modificar.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (Responses API)">
    Para modelos directos de OpenAI Responses (`openai/*` en `api.openai.com`), el envoltorio de flujo Pi-harness del Plugin de OpenAI habilita automáticamente Compaction del lado del servidor:

    - Fuerza `store: true` (a menos que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: 70 % de `contextWindow` (o `80000` cuando no está disponible)

    Esto se aplica a la ruta integrada de Pi harness y a los hooks de proveedor de OpenAI usados por ejecuciones incrustadas. El arnés nativo app-server de Codex gestiona su propio contexto mediante Codex y se configura por separado con `agents.defaults.embeddedHarness.runtime`.

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
      <Tab title="Desactivar">
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
    `responsesServerCompaction` solo controla la inyección de `context_management`. Los modelos directos de OpenAI Responses siguen forzando `store: true` a menos que la compatibilidad establezca `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agéntico estricto">
    Para ejecuciones de la familia GPT-5 en `openai/*`, OpenClaw puede usar un contrato de ejecución incrustado más estricto:

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
    - Ya no trata un turno solo de planificación como progreso satisfactorio cuando hay disponible una acción de herramienta
    - Reintenta el turno con una instrucción para actuar ahora
    - Habilita automáticamente `update_plan` para trabajo sustancial
    - Muestra un estado explícito de bloqueo si el modelo sigue planificando sin actuar

    <Note>
    Limitado solo a ejecuciones de la familia GPT-5 de OpenAI y Codex. Otros proveedores y familias de modelos más antiguas mantienen el comportamiento predeterminado.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas vs. compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI de forma distinta a los proxies genéricos compatibles con OpenAI `/v1`:

    **Rutas nativas** (`openai/*`, Azure OpenAI):
    - Conservan `reasoning: { effort: "none" }` solo para modelos que admiten el valor `none` de OpenAI
    - Omiten el razonamiento desactivado para modelos o proxies que rechazan `reasoning.effort: "none"`
    - Usan por defecto esquemas estrictos de herramientas
    - Adjuntan encabezados ocultos de atribución solo en hosts nativos verificados
    - Conservan la forma de solicitud exclusiva de OpenAI (`service_tier`, `store`, compatibilidad de razonamiento, sugerencias de caché de prompt)

    **Rutas de proxy/compatibles:**
    - Usan un comportamiento de compatibilidad más flexible
    - No fuerzan esquemas estrictos de herramientas ni encabezados exclusivos de rutas nativas

    Azure OpenAI usa comportamiento nativo de transporte y compatibilidad, pero no recibe los encabezados ocultos de atribución.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de herramientas de imágenes y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de herramientas de video y selección de proveedor.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
