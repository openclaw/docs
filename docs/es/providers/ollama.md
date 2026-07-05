---
read_when:
    - Quieres ejecutar OpenClaw con modelos en la nube o locales mediante Ollama
    - Necesitas orientación para la instalación y configuración de Ollama
    - Quieres modelos de visión de Ollama para comprender imágenes
summary: Ejecuta OpenClaw con Ollama (modelos en la nube y locales)
title: Ollama
x-i18n:
    generated_at: "2026-07-05T11:38:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11984ebca98d7b98f1c89e6820fd29524ec41a38ca4a403260e322dbf55a75e2
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw habla con la API nativa de Ollama (`/api/chat`), no con el endpoint
compatible con OpenAI `/v1`. Se admiten tres modos:

| Modo          | Qué usa                                                                            |
| ------------- | ---------------------------------------------------------------------------------- |
| Nube + Local  | Un host de Ollama accesible, que sirve modelos locales y (si se inició sesión) modelos `:cloud` |
| Solo nube     | `https://ollama.com` directamente, sin daemon local                                |
| Solo local    | Un host de Ollama accesible, solo modelos locales                                  |

Para configurar solo la nube con el id de proveedor dedicado `ollama-cloud`, consulta
[Ollama Cloud](/es/providers/ollama-cloud). Usa referencias `ollama-cloud/<model>` cuando
quieras mantener el enrutamiento en la nube separado de un proveedor `ollama` local.

<Warning>
No uses la URL compatible con OpenAI `/v1` (`http://host:11434/v1`). Rompe las llamadas a herramientas y los modelos pueden emitir JSON de llamadas a herramientas sin procesar como texto plano. Usa la URL nativa: `baseUrl: "http://host:11434"` (sin `/v1`).
</Warning>

La clave de configuración canónica es `baseUrl`. `baseURL` también se acepta para
ejemplos de estilo OpenAI-SDK, pero la configuración nueva debe usar `baseUrl`.

## Reglas de autenticación

<AccordionGroup>
  <Accordion title="Hosts locales y de LAN">
    Las URL de Ollama de loopback, red privada, `.local` y nombres de host simples no necesitan un token bearer real. OpenClaw usa el marcador `ollama-local` para estas.
  </Accordion>
  <Accordion title="Hosts remotos y de Ollama Cloud">
    Los hosts remotos públicos y `https://ollama.com` requieren una credencial real: `OLLAMA_API_KEY`, un perfil de autenticación o el `apiKey` del proveedor. Para uso alojado directo, prefiere el proveedor `ollama-cloud`.
  </Accordion>
  <Accordion title="Ids de proveedor personalizados">
    Un proveedor personalizado con `api: "ollama"` sigue las mismas reglas. Por ejemplo, un proveedor `ollama-remote` que apunte a un host privado de LAN puede usar `apiKey: "ollama-local"`; los subagentes resuelven ese marcador mediante el hook del proveedor Ollama en vez de tratarlo como una credencial faltante. `agents.defaults.memorySearch.provider` también puede apuntar a un id de proveedor personalizado para que los embeddings usen ese endpoint de Ollama.
  </Accordion>
  <Accordion title="Perfiles de autenticación">
    `auth-profiles.json` almacena la credencial para un id de proveedor; coloca los ajustes de endpoint (`baseUrl`, `api`, modelos, encabezados, tiempos de espera) en `models.providers.<id>`. Los archivos planos antiguos como `{ "ollama-windows": { "apiKey": "ollama-local" } }` no son un formato de runtime; `openclaw doctor --fix` los reescribe en un perfil de clave de API canónico `ollama-windows:default` con una copia de seguridad. Un valor `baseUrl` en ese archivo heredado es ruido y debe moverse a la configuración del proveedor.
  </Accordion>
  <Accordion title="Alcance de embeddings de memoria">
    La autenticación bearer para embeddings de memoria de Ollama se limita al host para el que se declaró:

    - Una clave a nivel de proveedor se envía solo al host de ese proveedor.
    - `agents.*.memorySearch.remote.apiKey` se envía solo a su host remoto de embeddings.
    - Un valor de entorno `OLLAMA_API_KEY` puro se trata como la convención de Ollama Cloud y no se envía de forma predeterminada a hosts locales/autohospedados.

  </Accordion>
</AccordionGroup>

## Primeros pasos

<Tabs>
  <Tab title="Onboarding (recomendado)">
    <Steps>
      <Step title="Ejecutar onboarding">
        ```bash
        openclaw onboard
        ```

        Selecciona **Ollama** y luego elige un modo: **Nube + Local**, **Solo nube** o **Solo local**.
      </Step>
      <Step title="Seleccionar un modelo">
        `Solo nube` solicita `OLLAMA_API_KEY` y sugiere valores predeterminados de nube alojada. `Nube + Local` y `Solo local` solicitan una URL base de Ollama, descubren los modelos disponibles y descargan automáticamente el modelo local seleccionado si falta. Una etiqueta `:latest` instalada, como `gemma4:latest`, se muestra una vez en lugar de duplicar `gemma4`. `Nube + Local` también comprueba si el host tiene sesión iniciada para acceso a la nube.
      </Step>
      <Step title="Verificar">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    No interactivo:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` y `--custom-model-id` son opcionales; omitirlos usa el host local predeterminado y el modelo sugerido `gemma4`.

  </Tab>

  <Tab title="Configuración manual">
    <Steps>
      <Step title="Instalar e iniciar Ollama">
        Obtenlo en [ollama.com/download](https://ollama.com/download) y luego descarga un modelo:

        ```bash
        ollama pull gemma4
        ```

        Para acceso híbrido a la nube, ejecuta `ollama signin` en el mismo host.
      </Step>
      <Step title="Configurar una credencial">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # host local/LAN, cualquier valor funciona
        export OLLAMA_API_KEY="your-real-key"   # solo https://ollama.com
        ```

        O en la configuración: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Seleccionar el modelo">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        O en la configuración:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Modelos en la nube mediante un host local

`Nube + Local` enruta modelos locales y `:cloud` mediante un único host de
Ollama accesible; este es el flujo híbrido de Ollama y el modo que debes elegir
durante la configuración cuando quieras ambos.

OpenClaw solicita la URL base, descubre modelos locales y comprueba el estado de
`ollama signin`. Cuando la sesión está iniciada, sugiere valores predeterminados alojados
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Si
no se inició sesión, la configuración permanece solo local hasta que ejecutes `ollama signin`.

Para acceso solo a la nube sin daemon local, usa `openclaw onboard --auth-choice ollama-cloud` y consulta [Ollama Cloud](/es/providers/ollama-cloud); esa ruta no necesita `ollama signin` ni un servidor en ejecución:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

La lista de modelos en la nube que se muestra durante `openclaw onboard` se rellena en vivo desde
`https://ollama.com/api/tags`, con un límite de 500 entradas, por lo que el selector refleja
el catálogo alojado actual. Si `ollama.com` no está disponible o no devuelve
modelos durante la configuración, OpenClaw recurre a su lista de sugerencias codificada para que
el onboarding aún se complete.

## Descubrimiento de modelos (proveedor implícito)

Cuando `OLLAMA_API_KEY` (o un perfil de autenticación) está configurado y no hay
`models.providers.ollama` ni otro proveedor personalizado con `api: "ollama"`
definido, OpenClaw descubre modelos desde `http://127.0.0.1:11434`:

| Comportamiento       | Detalle                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta de catálogo | `/api/tags`                                                                                                                                                                                                                                                                                    |
| Detección de capacidades | Lecturas de mejor esfuerzo de `/api/show` para `contextWindow`, parámetros `num_ctx` de Modelfile y capacidades (visión/herramientas/pensamiento)                                                                                                                                             |
| Modelos de visión    | Una capacidad `vision` de `/api/show` marca el modelo como compatible con imágenes (`input: ["text", "image"]`)                                                                                                                                                                                |
| Detección de razonamiento | Usa la capacidad `thinking` de `/api/show` cuando está disponible; recurre a una heurística de nombre (`r1`, `reason`, `reasoning`, `think`) cuando Ollama omite capacidades. `glm-5.2:cloud` y `deepseek-v4-flash\|pro:cloud` siempre se tratan como de razonamiento, sin importar las capacidades reportadas. |
| Límites de tokens    | `maxTokens` usa de forma predeterminada el límite máximo de tokens de Ollama de OpenClaw                                                                                                                                                                                                       |
| Costos               | Todos los costos son `0`                                                                                                                                                                                                                                                                       |

```bash
ollama list
openclaw models list
```

Configurar `models.providers.ollama` con un arreglo explícito `models`, o un
proveedor personalizado con `api: "ollama"` y un `baseUrl` que no sea de loopback, desactiva
el descubrimiento automático; entonces los modelos deben definirse manualmente (consulta
[Configuración](#configuration)). Una entrada `models.providers.ollama` que apunte a
`https://ollama.com` alojado también omite el descubrimiento, ya que los modelos de Ollama Cloud
son gestionados por el proveedor. Los proveedores personalizados de loopback como
`http://127.0.0.2:11434` siguen contando como locales y mantienen el descubrimiento automático.

Puedes usar una referencia completa como `ollama/<pulled-model>:latest` sin una
entrada `models.json` escrita a mano; OpenClaw la resuelve en vivo. Para hosts con sesión iniciada,
seleccionar una referencia `ollama/<model>:cloud` no listada valida ese modelo exacto
con `/api/show` y lo añade al catálogo de runtime solo si Ollama confirma
los metadatos; los errores tipográficos siguen fallando como modelos desconocidos.

### Pruebas de humo

Para una prueba de texto estrecha que omite toda la superficie de herramientas del agente:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Añade `--file` con una imagen para una prueba ligera de modelo de visión (acepta PNG/JPEG/WebP;
los archivos que no son imágenes se rechazan antes de llamar a Ollama; usa
`openclaw infer audio transcribe` para audio):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

Ninguna ruta carga herramientas de chat, memoria ni contexto de sesión. Si tiene éxito
mientras las respuestas normales del agente fallan, es probable que el problema sea la capacidad
de herramientas/agente del modelo, no el endpoint.

Seleccionar un modelo con `/model ollama/<model>` es una elección exacta del usuario: si el
`baseUrl` configurado no está disponible, la siguiente respuesta falla con el error del proveedor
en vez de recurrir silenciosamente a otro modelo configurado.

Los trabajos Cron aislados añaden una comprobación de seguridad local antes de iniciar el turno del agente:
si el modelo seleccionado se resuelve a un proveedor Ollama local/red privada/`.local`
y `/api/tags` no está disponible, OpenClaw registra esa ejecución como
`skipped` con el modelo en el texto de error. Esta comprobación de endpoint se almacena en caché durante
5 minutos por host, por lo que los trabajos Cron repetidos contra un daemon detenido no lanzan todos
solicitudes fallidas.

Verificación en vivo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para Ollama Cloud, apunta la misma prueba en vivo al endpoint hospedado (omite
embeddings de forma predeterminada; fuerza con `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` porque una
clave de cloud puede no autorizar `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para agregar un modelo, descárgalo y se descubrirá automáticamente:

```bash
ollama pull mistral
```

## Inferencia local de Node

Los agentes pueden delegar una tarea breve a un modelo de Ollama en un equipo de escritorio o
nodo de servidor emparejado. El prompt y la respuesta cruzan la conexión
Gateway/nodo autenticada existente; la solicitud se ejecuta en el endpoint
Ollama loopback propio del nodo (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Start Ollama on the node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Connect the node host">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Aprueba el dispositivo y sus comandos de nodo en el host del Gateway; luego verifica:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Una primera conexión, o una actualización que agregue comandos de Ollama, puede activar
    la aprobación de comandos de nodo. Si el nodo se conecta sin anunciar
    `ollama.models` y `ollama.chat`, revisa `openclaw nodes pending` otra vez.

  </Step>
  <Step title="Use it from an agent">
    El Plugin de Ollama incluido expone la herramienta `node_inference`. Los agentes llaman
    primero a `action: "discover"` y luego a `action: "run"` con un nodo y un modelo de
    ese resultado (`run` puede omitir el nodo cuando exactamente un nodo compatible está
    conectado). Por ejemplo: "Descubre los modelos de Ollama en mis nodos y luego usa
    el modelo cargado más rápido para resumir este texto."
  </Step>
</Steps>

El descubrimiento lee `/api/tags`, comprueba las capacidades de `/api/show` y usa
`/api/ps` cuando está disponible para priorizar los modelos ya cargados. Devuelve solo
modelos locales que Ollama reporta como compatibles con chat (capacidad `completion`):
se excluyen las filas de Ollama Cloud y los modelos solo de embedding. Cada ejecución desactiva
el razonamiento del modelo y usa de forma predeterminada una salida de 512 tokens (límite rígido 8192),
a menos que la llamada de herramienta solicite un `maxTokens` distinto; algunos modelos (por ejemplo GPT-OSS)
no admiten desactivar el razonamiento y aun así pueden emitir tokens de razonamiento.

Para mantener Ollama ejecutándose en un nodo sin exponerlo a los agentes:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Reinicia el nodo (`openclaw node restart`, o detén y vuelve a ejecutar `openclaw node run`
para una sesión en primer plano). El nodo deja de anunciar `ollama.models` y
`ollama.chat`; Ollama en sí y el proveedor Ollama del Gateway no se ven afectados.
Vuelve a establecer el valor en `true` y reinicia para reactivarlo; una superficie de comandos
modificada puede necesitar otra aprobación de `openclaw nodes pending` después de reconectar.

Verifica los comandos de nodo directamente, sin un turno de agente:

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout` limita cuánto tiempo tiene el nodo para ejecutar el comando;
`--timeout` limita la llamada general del Gateway y debe ser mayor.

La inferencia local de Node siempre usa el endpoint loopback propio del nodo; no
reutiliza un `models.providers.ollama.baseUrl` remoto/cloud configurado. Los
comandos de nodo están disponibles de forma predeterminada en hosts de nodo macOS, Linux y Windows,
y siguen sujetos a la política normal de emparejamiento/comandos de nodo.

## Visión y descripción de imágenes

El Plugin de Ollama incluido registra Ollama como proveedor de comprensión de medios
compatible con imágenes, por lo que OpenClaw puede enrutar solicitudes explícitas de descripción de imágenes
y valores predeterminados configurados de modelos de imagen a través de modelos de visión de Ollama locales u hospedados.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` debe ser una referencia completa `<provider/model>`; cuando se establece,
`infer image describe` prueba primero ese modelo en lugar de omitir la descripción para modelos
que ya admiten visión nativa. Si la llamada falla, OpenClaw puede continuar
mediante `agents.defaults.imageModel.fallbacks`; los errores de preparación de archivo/URL
fallan antes de intentar el fallback. Usa `infer image describe` para el flujo
de comprensión de imágenes de OpenClaw y el `imageModel` configurado; usa `infer model run
--file` para una prueba multimodal directa con un prompt personalizado.

Para convertir Ollama en el proveedor predeterminado de comprensión de imágenes para medios entrantes:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Prefiere la referencia completa `ollama/<model>`. Una referencia `imageModel` sin prefijo, como
`qwen2.5vl:7b`, se normaliza a `ollama/qwen2.5vl:7b` solo cuando ese modelo exacto
figura en `models.providers.ollama.models` con
`input: ["text", "image"]` y ningún otro proveedor de imágenes configurado expone el
mismo id sin prefijo; de lo contrario, usa explícitamente el prefijo del proveedor.

Los modelos de visión locales lentos pueden necesitar un timeout de comprensión de imágenes más largo que
los modelos cloud, y pueden fallar en hardware limitado si Ollama intenta
asignar todo el contexto de visión anunciado del modelo. Establece un timeout
de capacidad y limita `num_ctx`:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

Este timeout se aplica a la comprensión de imágenes entrantes y a la herramienta explícita
`image`. `models.providers.ollama.timeoutSeconds` sigue controlando la
protección de la solicitud HTTP subyacente de Ollama para llamadas normales de modelo.

Verificación en vivo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Si defines `models.providers.ollama.models` manualmente, marca los modelos de visión
explícitamente:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw rechaza solicitudes de descripción de imágenes para modelos no marcados como
compatibles con imágenes. Con descubrimiento implícito, esto proviene de la capacidad
de visión de `/api/show`.

## Configuración

<Tabs>
  <Tab title="Basic (implicit discovery)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` está establecido, puedes omitir `apiKey` en la entrada del proveedor; OpenClaw lo completa para las comprobaciones de disponibilidad.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Usa configuración explícita para una configuración cloud hospedada, un host/puerto no predeterminado,
    ventanas de contexto forzadas o listas de modelos totalmente manuales:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Custom base URL">
    La configuración explícita desactiva el descubrimiento automático, por lo que los modelos deben enumerarse:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - native Ollama API URL
            api: "ollama", // Explicit: guarantees native tool-calling behavior
            timeoutSeconds: 300, // Optional: longer connect/stream budget for cold local models
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    No agregues `/v1`. Esa ruta selecciona el modo compatible con OpenAI, donde las llamadas a herramientas no son fiables.
    </Warning>

  </Tab>
</Tabs>

## Recetas comunes

Reemplaza los ID de modelo por nombres exactos de `ollama list` o
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    Ollama en la misma máquina que el Gateway, descubierto automáticamente:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    No agregues un bloque `models.providers.ollama` a menos que necesites modelos manuales.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` es el presupuesto de contexto de OpenClaw; `params.num_ctx` se envía a
    Ollama. Mantenlos alineados cuando el hardware no pueda ejecutar todo el contexto
    anunciado del modelo.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    Sin daemon local, modelos hospedados directamente:

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

    Para el id de proveedor dedicado `ollama-cloud` en lugar de esta forma, consulta
    [Ollama Cloud](/es/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Cloud plus local through a signed-in daemon">
    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Multiple Ollama hosts">
    ID de proveedor personalizados al ejecutar más de un servidor Ollama; cada uno obtiene su
    propio host, modelos, autenticación y tiempo de espera.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    OpenClaw elimina el prefijo del proveedor activo (recurriendo a un prefijo
    `ollama/` sin calificar) antes de llamar a Ollama, por lo que `ollama-large/qwen3.5:27b`
    llega a Ollama como `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Lean local model profile">
    Algunos modelos locales gestionan prompts simples, pero tienen dificultades con toda la
    superficie de herramientas del agente. Limita las herramientas y el contexto antes de tocar la configuración
    global del runtime:

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    Usa `compat.supportsTools: false` solo cuando el modelo o el servidor fallan
    de forma fiable con esquemas de herramientas; intercambia capacidad del agente por estabilidad.
    `localModelLean` elimina el navegador, Cron y las herramientas de mensajes de la
    superficie directa del agente (message permanece si la ejecución necesita semántica de
    entrega directa de mensajes) y coloca catálogos más grandes detrás de la Búsqueda de herramientas, pero
    no cambia el contexto de runtime de Ollama ni el modo de razonamiento. Combínalo con
    `params.num_ctx` y `params.thinking: false` para modelos de razonamiento pequeños estilo Qwen
    que entran en bucle o gastan su presupuesto en razonamiento oculto.

  </Accordion>
</AccordionGroup>

### Selección de modelo

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

Los ID de proveedor personalizados funcionan de la misma manera: para una referencia que usa el prefijo
del proveedor activo, como `ollama-spark/qwen3:32b`, OpenClaw elimina ese prefijo antes de
llamar a Ollama y envía `qwen3:32b`.

Para modelos locales lentos, prefiere el ajuste con alcance de proveedor antes de aumentar el tiempo de espera
de todo el runtime del agente:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` cubre la solicitud HTTP del modelo: configuración de la conexión, encabezados,
streaming del cuerpo y la cancelación total de fetch protegido. `params.keep_alive` se
reenvía como `keep_alive` de nivel superior en solicitudes nativas `/api/chat`; configúralo por
modelo cuando el tiempo de carga del primer turno sea el cuello de botella.

### Verificación rápida

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Para hosts remotos, sustituye `127.0.0.1` por el host de `baseUrl`. Si `curl`
funciona pero OpenClaw no, comprueba si el Gateway se ejecuta en otra
máquina, contenedor o cuenta de servicio.

## Búsqueda web de Ollama

OpenClaw incluye **Búsqueda web de Ollama** como proveedor `web_search`.

| Propiedad   | Detalle                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | `models.providers.ollama.baseUrl` cuando está configurado; de lo contrario, `http://127.0.0.1:11434`; `https://ollama.com` usa directamente la API alojada |
| Autenticación | Sin clave para un host local con sesión iniciada; `OLLAMA_API_KEY` o autenticación de proveedor configurada para búsqueda directa en `https://ollama.com` o hosts protegidos por autenticación |
| Requisito   | Los hosts locales/autohospedados deben estar ejecutándose y tener una sesión iniciada con `ollama signin`; la búsqueda alojada directa necesita `baseUrl: "https://ollama.com"` más una clave de API real |

Elígelo durante `openclaw onboard` u `openclaw configure --section web`, o configura:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Para búsqueda alojada directa mediante Ollama Cloud:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

Para un host autohospedado, OpenClaw primero intenta el proxy local `/api/experimental/web_search`
y luego recurre a la ruta alojada `/api/web_search` en el mismo host; un daemon local
con sesión iniciada normalmente responde mediante el proxy local. Las llamadas directas a
`https://ollama.com` siempre usan el endpoint alojado `/api/web_search`.

<Note>
Para la configuración y el comportamiento completos, consulta [Búsqueda web de Ollama](/es/tools/ollama-search).
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **Las llamadas a herramientas no son fiables en este modo.** Úsalo solo cuando un proxy necesite el formato OpenAI y no dependas de las llamadas a herramientas nativas.
    </Warning>

    Configura `api: "openai-completions"` explícitamente para un proxy detrás de
    `/v1/chat/completions`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Es posible que este modo no admita streaming y llamadas a herramientas simultáneamente; puede que
    necesites `params: { streaming: false }` en el modelo.

    OpenClaw inyecta `options.num_ctx` de forma predeterminada en este modo para que Ollama
    no recurra silenciosamente a un contexto de 4096 tokens. Si tu proxy rechaza
    campos `options` desconocidos, desactívalo:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Context windows">
    Para modelos detectados automáticamente, OpenClaw usa la ventana de contexto que informa `/api/show`,
    incluidos valores `PARAMETER num_ctx` más grandes de Modelfiles personalizados; de lo contrario,
    recurre a la ventana de contexto de Ollama predeterminada de OpenClaw.

    `contextWindow`, `contextTokens` y `maxTokens` a nivel de proveedor establecen
    valores predeterminados para cada modelo bajo ese proveedor y pueden sobrescribirse por
    modelo. `contextWindow` es el presupuesto propio de prompt/Compaction de OpenClaw. Las solicitudes nativas
    `/api/chat` dejan `options.num_ctx` sin configurar a menos que configures
    `params.num_ctx` explícitamente, por lo que Ollama aplica su propio modelo,
    `OLLAMA_CONTEXT_LENGTH` o el valor predeterminado basado en VRAM; los valores `params.num_ctx`
    no válidos, cero, negativos o no finitos se ignoran. Si una configuración anterior usaba
    solo `contextWindow`/`maxTokens` para forzar el contexto de la solicitud nativa, ejecuta
    `openclaw doctor --fix` para copiarlos en `params.num_ctx`. El adaptador
    compatible con OpenAI sigue inyectando `options.num_ctx` de forma predeterminada desde
    `params.num_ctx` o `contextWindow` configurados; desactívalo con
    `injectNumCtxForOpenAICompat: false` si el upstream rechaza `options`.

    Las entradas de modelos nativos también aceptan opciones comunes de runtime de Ollama bajo
    `params`, reenviadas como `options` nativas de `/api/chat`: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` y `num_thread`.
    Algunas claves (`format`, `keep_alive`, `truncate`, `shift`) se reenvían como
    campos de solicitud de nivel superior en lugar de `options` anidadas. OpenClaw solo
    reenvía estas claves de solicitud de Ollama, por lo que los parámetros solo de runtime como
    `streaming` nunca se envían a Ollama. Usa `params.think` (o
    `params.thinking`) para configurar `think` de nivel superior; `false` desactiva el razonamiento
    a nivel de API para modelos de razonamiento estilo Qwen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    `agents.defaults.models["ollama/<model>"].params.num_ctx` por modelo también
    funciona; la entrada explícita del modelo del proveedor gana si ambas están configuradas.

  </Accordion>

  <Accordion title="Thinking control">
    OpenClaw reenvía el razonamiento como Ollama lo espera: `think` de nivel superior, no
    `options.think`. Los modelos detectados automáticamente cuyo `/api/show` informa una
    capacidad `thinking` exponen `/think low`, `/think medium`, `/think high`
    y `/think max`; los modelos sin razonamiento exponen solo `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    O configura un valor predeterminado de modelo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    `params.think`/`params.thinking` por modelo puede desactivar o forzar el pensamiento de la API
    para un modelo específico. OpenClaw conserva esa configuración explícita
    cuando la ejecución activa solo tiene el valor predeterminado implícito `off`; un comando
    de tiempo de ejecución distinto de off, como `/think medium`, aun así lo sobrescribe. Una solicitud
    de pensamiento con valor verdadero nunca se envía a un modelo marcado explícitamente
    como `reasoning: false`; una solicitud `think: false` siempre se envía igualmente.

  </Accordion>

  <Accordion title="Reasoning models">
    Los modelos llamados `deepseek-r1`, `reasoning`, `reason` o `think` se tratan
    como compatibles con razonamiento de forma predeterminada, sin configuración adicional:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Model costs">
    Ollama se ejecuta localmente y es gratuito, por lo que todos los costes de modelo son `0` tanto para
    modelos detectados automáticamente como definidos manualmente.
  </Accordion>

  <Accordion title="Memory embeddings">
    El Plugin de Ollama incluido registra un proveedor de embeddings de memoria para
    [búsqueda de memoria](/es/concepts/memory). Usa la URL base de Ollama configurada
    y la clave de API, llama a `/api/embed` y agrupa varios fragmentos de memoria en
    una solicitud `input` cuando es posible.

    Cuando `proxy.enabled=true`, las solicitudes de embeddings al origen local loopback
    exacto del host derivado del `baseUrl` configurado usan la ruta directa protegida
    de OpenClaw en lugar del proxy administrado. El nombre de host configurado
    debe ser `localhost` o un literal de IP loopback; los nombres DNS
    que simplemente resuelven a loopback siguen usando la ruta de proxy administrado. Los hosts Ollama de LAN,
    tailnet, red privada y públicos siempre permanecen en la ruta de proxy
    administrado, y las redirecciones a otro host/puerto no heredan
    confianza. `proxy.loopbackMode: "proxy"` enruta el tráfico loopback a través del
    proxy igualmente; `proxy.loopbackMode: "block"` lo deniega antes de conectar:
    consulta [Proxy administrado](/es/security/network-proxy#gateway-loopback-mode).

    | Propiedad | Valor |
    | --- | --- |
    | Modelo predeterminado | `nomic-embed-text` |
    | Auto-pull | Sí, si no está presente localmente |
    | Concurrencia inline predeterminada | 1 (otros proveedores tienen valores predeterminados más altos; auméntala con `nonBatchConcurrency` si el host puede asumirlo) |

    Los embeddings en tiempo de consulta usan prefijos de recuperación para los modelos que los requieren o
    recomiendan: `nomic-embed-text`, `qwen3-embedding` y
    `mxbai-embed-large`. Los lotes de documentos permanecen sin procesar, por lo que los índices existentes no necesitan
    migración de formato.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Para un host de embeddings remoto, limita la autenticación a ese host:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Streaming configuration">
    Ollama usa la **API nativa** (`/api/chat`) de forma predeterminada, que admite
    streaming y llamadas a herramientas juntas, sin configuración especial.

    Para solicitudes nativas, el control de pensamiento se reenvía directamente: `/think off`
    y `openclaw agent --thinking off` envían `think: false` de nivel superior salvo que
    se configure un `params.think`/`params.thinking` explícito; `/think
    low|medium|high` envía la cadena de esfuerzo correspondiente; `/think max` se asigna al
    esfuerzo más alto de Ollama, `think: "high"`.

    <Tip>
    Para usar en su lugar el endpoint compatible con OpenAI, consulta "Legacy OpenAI-compatible mode" arriba; puede que streaming y llamadas a herramientas no funcionen juntos allí.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="WSL2 crash loop (repeated reboots)">
    En WSL2 con NVIDIA/CUDA, el instalador oficial de Ollama para Linux crea una
    unidad systemd `ollama.service` con `Restart=always`. Si ese servicio
    se inicia automáticamente y carga un modelo respaldado por GPU durante el arranque de WSL2, Ollama puede fijar
    memoria del host mientras carga; la recuperación de memoria de Hyper-V no siempre puede recuperar
    esas páginas, por lo que Windows puede terminar la máquina virtual WSL2, systemd reinicia
    Ollama y el ciclo se repite.

    Evidencia: reinicios/terminaciones repetidos de WSL2, CPU alta en `app.slice` u
    `ollama.service` justo después del inicio de WSL2, y SIGTERM desde systemd en lugar
    del OOM killer de Linux.

    OpenClaw registra una advertencia de inicio cuando detecta WSL2, `ollama.service`
    habilitado con `Restart=always` y marcadores CUDA visibles.

    Mitigación:

    ```bash
    sudo systemctl disable ollama
    ```

    En el lado de Windows, añade esto a `%USERPROFILE%\.wslconfig` y luego ejecuta
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    O acorta keep-alive / inicia Ollama manualmente solo cuando sea necesario:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consulta [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama not detected">
    Confirma que Ollama está en ejecución, que `OLLAMA_API_KEY` (o un perfil de autenticación) está configurado
    y que `models.providers.ollama` **no** está definido explícitamente:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No models available">
    Descarga el modelo localmente o defínelo explícitamente en
    `models.providers.ollama`:

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connection refused">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Remote host works with curl but not OpenClaw">
    Verifica desde la misma máquina y el mismo runtime que ejecuta el Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Causas comunes:

    - `baseUrl` apunta a `localhost`, pero el Gateway se ejecuta en Docker o en otro host.
    - La URL usa `/v1`, lo que selecciona el comportamiento compatible con OpenAI en lugar de Ollama nativo.
    - El host remoto necesita cambios de firewall o de vinculación LAN.
    - El modelo está en el daemon de tu portátil, pero no en el remoto.

  </Accordion>

  <Accordion title="Model outputs tool JSON as text">
    Normalmente el proveedor está en modo compatible con OpenAI, o el modelo no puede
    manejar esquemas de herramientas. Prefiere el modo nativo:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    Si un modelo local pequeño sigue fallando con esquemas de herramientas, establece
    `compat.supportsTools: false` en esa entrada de modelo y vuelve a probar.

  </Accordion>

  <Accordion title="Kimi or GLM returns garbled symbols">
    Las respuestas alojadas de Kimi/GLM que son largas secuencias de símbolos no lingüísticos se
    tratan como una llamada de proveedor fallida en lugar de una respuesta correcta, por lo que
    el manejo normal de reintento/fallback/error toma el control en vez de persistir
    texto corrupto en la sesión.

    Si se repite, captura el nombre del modelo, el archivo de sesión actual y
    si la ejecución usó `Cloud + Local` o `Cloud only`; luego prueba una sesión
    nueva y un modelo fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Cold local model times out">
    Los modelos locales grandes pueden necesitar una primera carga larga. Limita el timeout al
    proveedor Ollama y, opcionalmente, mantén el modelo cargado entre turnos:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    Si el propio host tarda en aceptar conexiones, `timeoutSeconds` también
    extiende el timeout de conexión protegido para este proveedor.

  </Accordion>

  <Accordion title="Large-context model is too slow or runs out of memory">
    Muchos modelos anuncian contextos más grandes de lo que tu hardware puede ejecutar
    cómodamente. Ollama nativo usa su propio valor predeterminado de runtime salvo que
    se establezca `params.num_ctx`. Limita tanto el presupuesto de OpenClaw como el contexto
    de solicitud de Ollama para tener una latencia de primer token predecible:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    Reduce `contextWindow` si OpenClaw envía demasiado prompt. Reduce
    `params.num_ctx` si el contexto de runtime de Ollama es demasiado grande para la máquina.
    Reduce `maxTokens` si la generación tarda demasiado.

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [FAQ](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/es/providers/ollama-cloud" icon="cloud">
    Configuración solo en la nube con el proveedor dedicado `ollama-cloud`.
  </Card>
  <Card title="Model providers" href="/es/concepts/model-providers" icon="layers">
    Descripción general de todos los proveedores, referencias de modelo y comportamiento de failover.
  </Card>
  <Card title="Model selection" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Ollama Web Search" href="/es/tools/ollama-search" icon="magnifying-glass">
    Configuración completa y detalles de comportamiento para la búsqueda web impulsada por Ollama.
  </Card>
  <Card title="Configuration" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
