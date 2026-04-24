---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres autenticación por suscripción de Codex en lugar de API keys
    - Necesitas un comportamiento de ejecución de agente más estricto para GPT-5
summary: Usa OpenAI mediante API keys o suscripción a Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T05:45:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8337990d0de692b32746b05ab344695fc5a54ab3855993ac7795fabf38d4d19d
    source_path: providers/openai.md
    workflow: 15
---

OpenAI ofrece API de desarrollo para modelos GPT. OpenClaw admite tres rutas de la familia OpenAI. El prefijo del modelo selecciona la ruta:

- **API key**: acceso directo a OpenAI Platform con facturación por uso (modelos `openai/*`)
- **Suscripción a Codex mediante PI**: inicio de sesión con ChatGPT/Codex y acceso por suscripción (modelos `openai-codex/*`)
- **Harness de app-server de Codex**: ejecución nativa mediante app-server de Codex (modelos `openai/*` más `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI admite explícitamente el uso de OAuth por suscripción en herramientas y flujos externos como OpenClaw.

<Note>
GPT-5.5 está disponible actualmente en OpenClaw mediante rutas de suscripción/OAuth:
`openai-codex/gpt-5.5` con el runner PI, o `openai/gpt-5.5` con el
harness de app-server de Codex. El acceso directo mediante API key para `openai/gpt-5.5` será
compatible cuando OpenAI habilite GPT-5.5 en la API pública; hasta entonces usa un
modelo habilitado por API como `openai/gpt-5.4` en configuraciones con `OPENAI_API_KEY`.
</Note>

## Cobertura de funciones de OpenClaw

| Capacidad de OpenAI      | Superficie de OpenClaw                                    | Estado                                                 |
| ------------------------ | --------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses         | proveedor de modelo `openai/<model>`                      | Sí                                                     |
| Modelos por suscripción de Codex | `openai-codex/<model>` con OAuth `openai-codex`    | Sí                                                     |
| Harness de app-server de Codex | `openai/<model>` con `embeddedHarness.runtime: codex` | Sí                                                  |
| Búsqueda web del lado del servidor | Herramienta nativa OpenAI Responses                | Sí, cuando la búsqueda web está habilitada y no hay proveedor fijado |
| Imágenes                 | `image_generate`                                          | Sí                                                     |
| Videos                   | `video_generate`                                          | Sí                                                     |
| Texto a voz              | `messages.tts.provider: "openai"` / `tts`                 | Sí                                                     |
| Voz a texto por lotes    | `tools.media.audio` / comprensión multimedia              | Sí                                                     |
| Voz a texto en streaming | Voice Call `streaming.provider: "openai"`                 | Sí                                                     |
| Voz en tiempo real       | Voice Call `realtime.provider: "openai"` / Talk de Control UI | Sí                                                  |
| Embeddings               | proveedor de embeddings de memory                         | Sí                                                     |

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Ideal para:** acceso directo a la API y facturación por uso.

    <Steps>
      <Step title="Obtén tu API key">
        Crea o copia una API key desde el [panel de OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Ejecuta onboarding">
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

    | Ref de modelo | Ruta | Autenticación |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Ruta futura directa de API una vez OpenAI habilite GPT-5.5 en la API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` es la ruta directa por API key de OpenAI salvo que fuerces explícitamente
    el harness de app-server de Codex. GPT-5.5 en sí es actualmente solo por suscripción/OAuth;
    usa `openai-codex/*` para Codex OAuth mediante el runner PI predeterminado.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **no** expone `openai/gpt-5.3-codex-spark`. Las solicitudes activas a la API de OpenAI rechazan ese modelo y el catálogo actual de Codex tampoco lo expone.
    </Warning>

  </Tab>

  <Tab title="Suscripción a Codex">
    **Ideal para:** usar tu suscripción a ChatGPT/Codex en lugar de una API key independiente. Codex en la nube requiere inicio de sesión de ChatGPT.

    <Steps>
      <Step title="Ejecuta OAuth de Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        O ejecuta OAuth directamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configuraciones headless o problemáticas para callbacks, añade `--device-code` para iniciar sesión con un flujo de código de dispositivo de ChatGPT en lugar del callback del navegador en localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Configura el modelo predeterminado">
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

    ### Resumen de rutas

    | Ref de modelo | Ruta | Autenticación |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth mediante PI | inicio de sesión de Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | harness de app-server de Codex | autenticación de app-server de Codex |

    <Note>
    Sigue usando el id de proveedor `openai-codex` para comandos de autenticación/perfil. El
    prefijo de modelo `openai-codex/*` también es la ruta explícita de PI para Codex OAuth.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding ya no importa material OAuth desde `~/.codex`. Inicia sesión con OAuth de navegador (predeterminado) o con el flujo de código de dispositivo de arriba; OpenClaw gestiona las credenciales resultantes en su propio almacén de autenticación del agente.
    </Note>

    ### Indicador de estado

    El chat `/status` muestra qué harness embebido está activo para la sesión
    actual. El harness PI predeterminado aparece como `Runner: pi (embedded)` y no
    añade una insignia aparte. Cuando se selecciona el harness incluido de app-server de Codex,
    `/status` añade el id del harness no PI junto a `Fast`, por ejemplo
    `Fast · codex`. Las sesiones existentes conservan su id de harness registrado, así que usa
    `/new` o `/reset` después de cambiar `embeddedHarness` si quieres que `/status`
    refleje una nueva elección PI/Codex.

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto del runtime como valores separados.

    Para `openai-codex/gpt-5.5` mediante Codex OAuth:

    - `contextWindow` nativo: `1000000`
    - límite predeterminado de runtime `contextTokens`: `272000`

    En la práctica, el límite predeterminado más pequeño tiene mejores características de latencia y calidad. Sobrescríbelo con `contextTokens`:

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

  </Tab>
</Tabs>

## Generación de imágenes

El Plugin integrado `openai` registra la generación de imágenes mediante la herramienta `image_generate`.
Admite tanto generación de imágenes con API key de OpenAI como generación de imágenes
mediante Codex OAuth usando la misma ref de modelo `openai/gpt-image-2`.

| Capacidad                | API key de OpenAI                  | Codex OAuth                           |
| ------------------------ | ---------------------------------- | ------------------------------------- |
| Ref de modelo            | `openai/gpt-image-2`               | `openai/gpt-image-2`                  |
| Autenticación            | `OPENAI_API_KEY`                   | inicio de sesión OpenAI Codex OAuth   |
| Transporte               | API de imágenes de OpenAI          | backend de Codex Responses            |
| Máx. imágenes por solicitud | 4                               | 4                                     |
| Modo edición             | Habilitado (hasta 5 imágenes de referencia) | Habilitado (hasta 5 imágenes de referencia) |
| Sobrescrituras de tamaño | Compatibles, incluidos tamaños 2K/4K | Compatibles, incluidos tamaños 2K/4K |
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
Consulta [Generación de imágenes](/es/tools/image-generation) para ver parámetros compartidos de la herramienta, selección de proveedor y comportamiento de failover.
</Note>

`gpt-image-2` es el valor predeterminado tanto para generación de texto a imagen de OpenAI como para edición de imágenes. `gpt-image-1` sigue siendo utilizable como sobrescritura explícita de modelo, pero los nuevos flujos de imagen de OpenAI deberían usar `openai/gpt-image-2`.

En instalaciones con Codex OAuth, mantén la misma ref `openai/gpt-image-2`. Cuando se
configura un perfil OAuth `openai-codex`, OpenClaw resuelve ese token de acceso OAuth almacenado y envía las solicitudes de imagen mediante el backend Codex Responses. No prueba primero `OPENAI_API_KEY` ni recurre silenciosamente a una API key para esa
solicitud. Configura `models.providers.openai` explícitamente con una API key,
una URL base personalizada o un endpoint de Azure cuando quieras la ruta directa de la API
de imágenes de OpenAI.
Si ese endpoint de imagen personalizado está en una dirección LAN/privada de confianza, configura también
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene bloqueados
los endpoints de imagen compatibles con OpenAI privados/internos salvo que exista esta adhesión explícita.

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

| Capacidad       | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo predeterminado | `openai/sora-2`                                                             |
| Modos            | Texto a video, imagen a video, edición de un solo video                           |
| Entradas de referencia | 1 imagen o 1 video                                                         |
| Sobrescrituras de tamaño | Compatibles                                                              |
| Otras sobrescrituras  | `aspectRatio`, `resolution`, `audio`, `watermark` se ignoran con una advertencia de la herramienta |

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
Consulta [Generación de video](/es/tools/video-generation) para ver parámetros compartidos de la herramienta, selección de proveedor y comportamiento de failover.
</Note>

## Contribución al prompt de GPT-5

OpenClaw añade una contribución compartida al prompt de GPT-5 para ejecuciones de la familia GPT-5 en todos los proveedores. Se aplica por id de modelo, así que `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` y otras refs compatibles con GPT-5 reciben la misma superposición. Los modelos GPT-4.x más antiguos no la reciben.

El harness nativo incluido de Codex usa el mismo comportamiento GPT-5 y la misma superposición de Heartbeat mediante instrucciones de desarrollador de Codex app-server, por lo que las sesiones `openai/gpt-5.x` forzadas mediante `embeddedHarness.runtime: "codex"` mantienen la misma guía de seguimiento y Heartbeat proactivo aunque Codex sea propietario del resto del prompt del harness.

La contribución GPT-5 añade un contrato de comportamiento etiquetado para persistencia de personalidad, seguridad de ejecución, disciplina de herramientas, forma de salida, comprobaciones de finalización y verificación. El comportamiento específico de canal para respuestas y mensajes silenciosos permanece en el prompt compartido del sistema de OpenClaw y en la política de entrega saliente. La guía GPT-5 siempre está habilitada para los modelos coincidentes. La capa de estilo de interacción amistosa es independiente y configurable.

| Valor                  | Efecto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Habilita la capa de estilo de interacción amistosa |
| `"on"`                 | Alias de `"friendly"`                      |
| `"off"`                | Desactiva solo la capa de estilo amistoso  |

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
Los valores no distinguen entre mayúsculas y minúsculas en runtime, así que `"Off"` y `"off"` desactivan ambas la capa de estilo amistoso.
</Tip>

<Note>
El valor heredado `plugins.entries.openai.config.personality` sigue leyéndose como respaldo de compatibilidad cuando la configuración compartida `agents.defaults.promptOverlays.gpt5.personality` no está establecida.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El Plugin integrado `openai` registra síntesis de voz para la superficie `messages.tts`.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidad | `messages.tts.providers.openai.speed` | (sin configurar) |
    | Instrucciones | `messages.tts.providers.openai.instructions` | (sin configurar, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para archivos |
    | API key | `messages.tts.providers.openai.apiKey` | Recurre a `OPENAI_API_KEY` |
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
    Configura `OPENAI_TTS_BASE_URL` para sobrescribir la URL base de TTS sin afectar el endpoint de la API de chat.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El Plugin integrado `openai` registra voz a texto por lotes mediante
    la superficie de transcripción de comprensión multimedia de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Ruta de entrada: subida de archivo de audio multipart
    - Compatible en OpenClaw allí donde la transcripción entrante de audio use
      `tools.media.audio`, incluidos segmentos de canal de voz de Discord y
      archivos adjuntos de audio de canales

    Para forzar OpenAI en la transcripción entrante de audio:

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

    Las pistas de idioma y prompt se reenvían a OpenAI cuando las proporciona la
    configuración compartida de audio multimedia o la solicitud de transcripción por llamada.

  </Accordion>

  <Accordion title="Transcripción en tiempo real">
    El Plugin integrado `openai` registra transcripción en tiempo real para el Plugin de Voice Call.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (sin configurar) |
    | Prompt | `...openai.prompt` | (sin configurar) |
    | Duración del silencio | `...openai.silenceDurationMs` | `800` |
    | Umbral VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Usa una conexión WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Este proveedor de streaming es para la ruta de transcripción en tiempo real de Voice Call; la voz de Discord actualmente graba segmentos cortos y usa en su lugar la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz en tiempo real">
    El Plugin integrado `openai` registra voz en tiempo real para el Plugin de Voice Call.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Umbral VAD | `...openai.vadThreshold` | `0.5` |
    | Duración del silencio | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Admite Azure OpenAI mediante las claves de configuración `azureEndpoint` y `azureDeployment`. Admite llamadas bidireccionales de herramientas. Usa formato de audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints de Azure OpenAI

El proveedor integrado `openai` puede apuntar a un recurso Azure OpenAI para generación de imágenes sobrescribiendo la URL base. En la ruta de generación de imágenes, OpenClaw detecta automáticamente nombres de host de Azure en `models.providers.openai.baseUrl` y cambia a la forma de solicitud de Azure.

<Note>
La voz en tiempo real usa una ruta de configuración separada
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulta el acordeón **Voz en tiempo real** bajo [Voz y habla](#voice-and-speech) para ver sus ajustes de Azure.
</Note>

Usa Azure OpenAI cuando:

- Ya tienes una suscripción, cuota o acuerdo empresarial de Azure OpenAI
- Necesitas residencia regional de datos o controles de cumplimiento que Azure proporciona
- Quieres mantener el tráfico dentro de un tenancy existente de Azure

### Configuración

Para generación de imágenes con Azure mediante el proveedor integrado `openai`, apunta
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

Para solicitudes de generación de imágenes en un host Azure reconocido, OpenClaw:

- Envía la cabecera `api-key` en lugar de `Authorization: Bearer`
- Usa rutas con ámbito de deployment (`/openai/deployments/{deployment}/...`)
- Añade `?api-version=...` a cada solicitud

Las demás URL base (OpenAI público, proxies compatibles con OpenAI) conservan la forma estándar de solicitud de imagen de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor `openai`
requiere OpenClaw 2026.4.22 o posterior. Las versiones anteriores tratan cualquier
`openai.baseUrl` personalizado como si fuera el endpoint público de OpenAI y fallarán contra despliegues de imagen de Azure.
</Note>

### Versión de API

Configura `AZURE_OPENAI_API_VERSION` para fijar una versión concreta preview o GA de Azure
para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está configurada.

### Los nombres de modelo son nombres de deployment

Azure OpenAI vincula modelos a deployments. Para solicitudes de generación de imágenes de Azure
enrutadas mediante el proveedor integrado `openai`, el campo `model` de OpenClaw
debe ser el **nombre del deployment de Azure** que configuraste en el portal de Azure, no
el id público del modelo de OpenAI.

Si creas un deployment llamado `gpt-image-2-prod` que sirve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La misma regla de nombre de deployment se aplica a llamadas de generación de imágenes enrutadas mediante
el proveedor integrado `openai`.

### Disponibilidad regional

La generación de imágenes de Azure está disponible actualmente solo en un subconjunto de regiones
(por ejemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulta la lista actual de regiones de Microsoft antes de crear un
deployment y confirma que el modelo específico se ofrece en tu región.

### Diferencias de parámetros

Azure OpenAI y OpenAI público no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones que OpenAI público sí permite (por ejemplo ciertos
valores de `background` en `gpt-image-2`) o exponerlas solo en versiones concretas
del modelo. Estas diferencias vienen de Azure y del modelo subyacente, no de
OpenClaw. Si una solicitud de Azure falla con un error de validación, comprueba el
conjunto de parámetros compatible con tu deployment y versión de API concretos en el
portal de Azure.

<Note>
Azure OpenAI usa transporte nativo y comportamiento compat, pero no recibe
las cabeceras ocultas de atribución de OpenClaw; consulta el acordeón **Rutas nativas frente a rutas compatibles con OpenAI** en [Configuración avanzada](#advanced-configuration).

Para tráfico de chat o Responses en Azure (más allá de la generación de imágenes), usa el
flujo de onboarding o una configuración de proveedor Azure dedicada; `openai.baseUrl` por sí solo no adopta la forma de API/autenticación de Azure. Existe un proveedor
separado `azure-openai-responses/*`; consulta
el acordeón de Compaction del lado del servidor más abajo.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket frente a SSE)">
    OpenClaw usa primero WebSocket con respaldo SSE (`"auto"`) tanto para `openai/*` como para `openai-codex/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket antes de recurrir a SSE
    - Después de un fallo, marca WebSocket como degradado durante ~60 segundos y usa SSE durante el enfriamiento
    - Adjunta cabeceras estables de identidad de sesión y turno para reintentos y reconexiones
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamiento |
    |-------|----------|
    | `"auto"` (predeterminado) | WebSocket primero, respaldo SSE |
    | `"sse"` | Forzar solo SSE |
    | `"websocket"` | Forzar solo WebSocket |

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
    - [Realtime API con WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming de respuestas API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Calentamiento de WebSocket">
    OpenClaw habilita el calentamiento de WebSocket de forma predeterminada para `openai/*` y `openai-codex/*` para reducir la latencia del primer turno.

    ```json5
    // Deshabilitar calentamiento
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
    OpenClaw expone un interruptor compartido de modo rápido para `openai/*` y `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuración:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Cuando está habilitado, OpenClaw asigna el modo rápido al procesamiento prioritario de OpenAI (`service_tier = "priority"`). Los valores existentes de `service_tier` se conservan y el modo rápido no reescribe `reasoning` ni `text.verbosity`.

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
    Las sobrescrituras de sesión tienen prioridad sobre la configuración. Al borrar la sobrescritura de sesión en la UI de Sessions, la sesión vuelve al valor predeterminado configurado.
    </Note>

  </Accordion>

  <Accordion title="Procesamiento prioritario (service_tier)">
    La API de OpenAI expone el procesamiento prioritario mediante `service_tier`. Configúralo por modelo en OpenClaw:

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
    `serviceTier` solo se reenvía a endpoints nativos de OpenAI (`api.openai.com`) y a endpoints nativos de Codex (`chatgpt.com/backend-api`). Si enrutas cualquiera de los dos proveedores mediante un proxy, OpenClaw deja `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (Responses API)">
    Para modelos directos de OpenAI Responses (`openai/*` en `api.openai.com`), el wrapper de stream del Pi-harness del Plugin de OpenAI habilita automáticamente Compaction del lado del servidor:

    - Fuerza `store: true` (salvo que la compat del modelo configure `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: 70% de `contextWindow` (o `80000` cuando no está disponible)

    Esto se aplica a la ruta del Pi harness integrado y a los hooks del proveedor OpenAI usados por ejecuciones embebidas. El harness nativo de app-server de Codex gestiona su propio contexto mediante Codex y se configura por separado con `agents.defaults.embeddedHarness.runtime`.

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
    `responsesServerCompaction` solo controla la inyección de `context_management`. Los modelos directos de OpenAI Responses siguen forzando `store: true` salvo que compat configure `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agéntico estricto">
    Para ejecuciones de la familia GPT-5 en `openai/*`, OpenClaw puede usar un contrato de ejecución embebida más estricto:

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
    - Ya no trata un turno solo de planificación como progreso correcto cuando hay disponible una acción de herramienta
    - Reintenta el turno con una indicación para actuar ahora
    - Habilita automáticamente `update_plan` para trabajo sustancial
    - Muestra un estado explícito de bloqueo si el modelo sigue planificando sin actuar

    <Note>
    Se limita solo a ejecuciones de la familia GPT-5 de OpenAI y Codex. Otros proveedores y familias de modelos más antiguas mantienen el comportamiento predeterminado.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas frente a rutas compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI de forma distinta a los proxies genéricos `/v1` compatibles con OpenAI:

    **Rutas nativas** (`openai/*`, Azure OpenAI):
    - Conservan `reasoning: { effort: "none" }` solo para modelos que admiten el esfuerzo `none` de OpenAI
    - Omiten el reasoning deshabilitado para modelos o proxies que rechazan `reasoning.effort: "none"`
    - Usan por defecto esquemas de herramientas en modo estricto
    - Adjuntan cabeceras ocultas de atribución solo en hosts nativos verificados
    - Mantienen la conformación de solicitudes exclusiva de OpenAI (`service_tier`, `store`, compat de reasoning, pistas de caché de prompt)

    **Rutas proxy/compatibles:**
    - Usan un comportamiento compat más flexible
    - No fuerzan esquemas estrictos de herramientas ni cabeceras exclusivas nativas

    Azure OpenAI usa transporte nativo y comportamiento compat, pero no recibe las cabeceras ocultas de atribución.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs de modelo y comportamiento de failover.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imagen y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
