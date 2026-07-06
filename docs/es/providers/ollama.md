---
read_when:
    - Quieres ejecutar OpenClaw con modelos en la nube o locales mediante Ollama
    - Necesitas orientación para la instalación y configuración de Ollama
    - Quieres modelos de visión de Ollama para la comprensión de imágenes
summary: Ejecutar OpenClaw con Ollama (modelos en la nube y locales)
title: Ollama
x-i18n:
    generated_at: "2026-07-06T10:50:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw se comunica con la API nativa de Ollama (`/api/chat`), no con el endpoint
`/v1` compatible con OpenAI. Se admiten tres modos:

| Modo          | Qué usa                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| Nube + local | Un host Ollama alcanzable, que sirve modelos locales y, si la sesión está iniciada, modelos `:cloud` |
| Solo nube    | `https://ollama.com` directamente, sin daemon local                                   |
| Solo local    | Un host Ollama alcanzable, solo modelos locales                                       |

Para la configuración solo en la nube con el id de proveedor dedicado `ollama-cloud`, consulta
[Ollama Cloud](/es/providers/ollama-cloud). Usa referencias `ollama-cloud/<model>` cuando
quieras mantener el enrutamiento en la nube separado de un proveedor `ollama` local.

<Warning>
No uses la URL compatible con OpenAI `/v1` (`http://host:11434/v1`). Rompe las llamadas a herramientas y los modelos pueden emitir JSON sin procesar de llamadas a herramientas como texto sin formato. Usa la URL nativa: `baseUrl: "http://host:11434"` (sin `/v1`).
</Warning>

La clave de configuración canónica es `baseUrl`. `baseURL` también se acepta para
ejemplos de estilo SDK de OpenAI, pero la configuración nueva debe usar `baseUrl`.

## Reglas de autenticación

<AccordionGroup>
  <Accordion title="Hosts locales y LAN">
    Las URL de Ollama de loopback, red privada, `.local` y hostname sin dominio no necesitan un token bearer real. OpenClaw usa el marcador `ollama-local` para estas.
  </Accordion>
  <Accordion title="Hosts remotos y Ollama Cloud">
    Los hosts remotos públicos y `https://ollama.com` requieren una credencial real: `OLLAMA_API_KEY`, un perfil de autenticación o el `apiKey` del proveedor. Para uso alojado directo, prefiere el proveedor `ollama-cloud`.
  </Accordion>
  <Accordion title="Ids de proveedor personalizados">
    Un proveedor personalizado con `api: "ollama"` sigue las mismas reglas. Por ejemplo, un proveedor `ollama-remote` que apunte a un host LAN privado puede usar `apiKey: "ollama-local"`; los subagentes resuelven ese marcador mediante el hook del proveedor Ollama en lugar de tratarlo como una credencial ausente. `agents.defaults.memorySearch.provider` también puede apuntar a un id de proveedor personalizado para que los embeddings usen ese endpoint Ollama.
  </Accordion>
  <Accordion title="Perfiles de autenticación">
    `auth-profiles.json` almacena la credencial para un id de proveedor; coloca los ajustes del endpoint (`baseUrl`, `api`, modelos, encabezados, timeouts) en `models.providers.<id>`. Los archivos planos antiguos como `{ "ollama-windows": { "apiKey": "ollama-local" } }` no son un formato de runtime; `openclaw doctor --fix` los reescribe en un perfil canónico de clave de API `ollama-windows:default` con una copia de seguridad. Un valor `baseUrl` en ese archivo heredado es ruido y debe moverse a la configuración del proveedor.
  </Accordion>
  <Accordion title="Ámbito de embeddings de memoria">
    La autenticación bearer para embeddings de memoria de Ollama se limita al host para el que se declaró:

    - Una clave a nivel de proveedor se envía solo al host de ese proveedor.
    - `agents.*.memorySearch.remote.apiKey` se envía solo a su host remoto de embeddings.
    - Un valor puro de entorno `OLLAMA_API_KEY` se trata como la convención de Ollama Cloud y no se envía a hosts locales/autohospedados de forma predeterminada.

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

        Selecciona **Ollama** y luego elige un modo: **Nube + local**, **Solo nube** o **Solo local**.
      </Step>
      <Step title="Seleccionar un modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` y sugiere valores predeterminados alojados en la nube. `Cloud + Local` y `Local only` solicitan una URL base de Ollama, descubren los modelos disponibles y descargan automáticamente el modelo local seleccionado si falta. Una etiqueta `:latest` instalada, como `gemma4:latest`, se muestra una vez en lugar de duplicar `gemma4`. `Cloud + Local` también comprueba si el host tiene sesión iniciada para acceso a la nube.
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
      <Step title="Definir una credencial">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # local/LAN host, any value works
        export OLLAMA_API_KEY="your-real-key"   # https://ollama.com only
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

`Cloud + Local` enruta tanto los modelos locales como los modelos `:cloud` mediante un único host
Ollama alcanzable; este es el flujo híbrido de Ollama y el modo que debes elegir durante la configuración
cuando quieras ambos.

OpenClaw solicita la URL base, descubre modelos locales y comprueba el estado de
`ollama signin`. Cuando la sesión está iniciada, sugiere valores predeterminados alojados
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Si
la sesión no está iniciada, la configuración permanece solo local hasta que ejecutes `ollama signin`.

Para acceso solo en la nube sin un daemon local, usa `openclaw onboard --auth-choice ollama-cloud` y consulta [Ollama Cloud](/es/providers/ollama-cloud); esa ruta no necesita `ollama signin` ni un servidor en ejecución:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

La lista de modelos en la nube que se muestra durante `openclaw onboard` se rellena en vivo desde
`https://ollama.com/api/tags`, con un límite de 500 entradas, por lo que el selector refleja
el catálogo alojado actual. Si `ollama.com` no es alcanzable o no devuelve
modelos durante la configuración, OpenClaw recurre a su lista sugerida codificada para que
el onboarding se complete de todos modos.

## Descubrimiento de modelos (proveedor implícito)

Cuando `OLLAMA_API_KEY` (o un perfil de autenticación) está definido y no se ha definido ni
`models.providers.ollama` ni otro proveedor personalizado con `api: "ollama"`,
OpenClaw descubre modelos desde `http://127.0.0.1:11434`:

| Comportamiento             | Detalle                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta del catálogo        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| Detección de capacidades | Lecturas best-effort de `/api/show` leen `contextWindow`, parámetros `num_ctx` de Modelfile y capacidades (visión/herramientas/razonamiento)                                                                                                                                                                       |
| Modelos de visión        | Una capacidad `vision` de `/api/show` marca el modelo como compatible con imágenes (`input: ["text", "image"]`)                                                                                                                                                                                             |
| Detección de razonamiento  | Usa la capacidad `thinking` de `/api/show` cuando está disponible; recurre a una heurística de nombre (`r1`, `reason`, `reasoning`, `think`) cuando Ollama omite capacidades. `glm-5.2:cloud` y `deepseek-v4-flash\|pro:cloud` siempre se tratan como razonamiento independientemente de las capacidades reportadas. |
| Límites de tokens         | `maxTokens` usa de forma predeterminada el límite máximo de tokens de Ollama de OpenClaw                                                                                                                                                                                                                                       |
| Costos                | Todos los costos son `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

Definir `models.providers.ollama` con un array `models` explícito, o un
proveedor personalizado con `api: "ollama"` y un `baseUrl` que no sea loopback, deshabilita
el descubrimiento automático; entonces los modelos deben definirse manualmente (consulta
[Configuración](#configuration)). Una entrada `models.providers.ollama` que apunte a
`https://ollama.com` alojado también omite el descubrimiento, ya que los modelos de Ollama Cloud
son gestionados por el proveedor. Los proveedores personalizados de loopback, como
`http://127.0.0.2:11434`, siguen contando como locales y mantienen el descubrimiento automático.

Puedes usar una referencia completa como `ollama/<pulled-model>:latest` sin una
entrada `models.json` escrita a mano; OpenClaw la resuelve en vivo. Para hosts con sesión iniciada,
seleccionar una referencia `ollama/<model>:cloud` no listada valida ese modelo exacto
con `/api/show` y lo añade al catálogo de runtime solo si Ollama
confirma los metadatos; los errores tipográficos siguen fallando como modelos desconocidos.

### Smoke tests

Para una prueba de texto acotada que omite toda la superficie de herramientas del agente:

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

Ninguna de las dos rutas carga herramientas de chat, memoria ni contexto de sesión. Si funciona
mientras las respuestas normales del agente fallan, es probable que el problema sea la capacidad de herramientas/agente
del modelo, no el endpoint.

Seleccionar un modelo con `/model ollama/<model>` es una elección exacta del usuario: si el
`baseUrl` configurado no es alcanzable, la siguiente respuesta falla con el error del proveedor
en lugar de recurrir silenciosamente a otro modelo configurado.

Los trabajos Cron aislados añaden una comprobación local de seguridad antes de iniciar el turno del agente:
si el modelo seleccionado se resuelve a un proveedor Ollama local/de red privada/`.local`
y `/api/tags` no es alcanzable, OpenClaw registra esa ejecución como
`skipped` con el modelo en el texto del error. Esta comprobación de endpoint se almacena en caché durante
5 minutos por host, por lo que los trabajos Cron repetidos contra un daemon detenido no
lanzan todos solicitudes fallidas.

Verificación en vivo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para Ollama Cloud, apunta la misma prueba en vivo al endpoint alojado (omite
embeddings de forma predeterminada; fuerza su uso con `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, ya que una
clave de cloud podría no autorizar `/api/embed`):

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

## Inferencia local en Node

Los agentes pueden delegar una tarea breve a un modelo de Ollama en un escritorio o
nodo de servidor emparejado. El prompt y la respuesta atraviesan la conexión
Gateway/nodo autenticada existente; la solicitud se ejecuta en el endpoint
local loopback de Ollama del propio nodo (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Iniciar Ollama en el nodo">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Conectar el host del nodo">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Aprueba el dispositivo y sus comandos de nodo en el host del Gateway, luego verifica:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Una primera conexión, o una actualización que agrega comandos de Ollama, puede activar
    la aprobación de comandos de nodo. Si el nodo se conecta sin anunciar
    `ollama.models` y `ollama.chat`, revisa `openclaw nodes pending` de nuevo.

  </Step>
  <Step title="Usarlo desde un agente">
    El Plugin de Ollama incluido expone la herramienta `node_inference`. Los agentes llaman
    primero a `action: "discover"` y luego a `action: "run"` con un nodo y un modelo de
    ese resultado (`run` puede omitir el nodo cuando exactamente un nodo compatible está
    conectado). Por ejemplo: "Descubre los modelos de Ollama en mis nodos y luego usa
    el modelo cargado más rápido para resumir este texto."
  </Step>
</Steps>

El descubrimiento lee `/api/tags`, comprueba las capacidades de `/api/show` y usa
`/api/ps` cuando está disponible para priorizar primero los modelos ya cargados. Devuelve solo
los modelos locales que Ollama informa como compatibles con chat (capacidad `completion`);
se excluyen las filas de Ollama Cloud y los modelos solo de embedding. Cada ejecución desactiva
el pensamiento del modelo y limita la salida de forma predeterminada a 512 tokens (límite estricto
de 8192), salvo que la llamada a la herramienta solicite un `maxTokens` distinto; algunos modelos
(por ejemplo GPT-OSS) no admiten desactivar el pensamiento y aun así pueden emitir tokens de razonamiento.

Para mantener Ollama ejecutándose en un nodo sin exponerlo a los agentes:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Reinicia el nodo (`openclaw node restart`, o detén y vuelve a ejecutar `openclaw node run`
para una sesión en primer plano). El nodo deja de anunciar `ollama.models` y
`ollama.chat`; Ollama en sí y el proveedor de Ollama del Gateway no se ven afectados.
Vuelve a establecer el valor en `true` y reinicia para reactivarlo; una superficie de comandos
modificada puede requerir de nuevo la aprobación de `openclaw nodes pending` tras reconectar.

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

La inferencia local en Node siempre usa el endpoint local loopback propio del nodo: no
reutiliza un `models.providers.ollama.baseUrl` remoto/cloud configurado. Los
comandos de nodo están disponibles de forma predeterminada en hosts de nodo macOS, Linux
y Windows, y siguen sujetos a la política normal de emparejamiento/comandos de nodo.

## Visión y descripción de imágenes

El Plugin de Ollama incluido registra Ollama como proveedor de comprensión de medios
compatible con imágenes, por lo que OpenClaw puede enrutar solicitudes explícitas de descripción
de imágenes y valores predeterminados configurados de modelos de imagen a través de modelos
de visión de Ollama locales o alojados.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` debe ser una referencia completa `<provider/model>`; cuando se establece,
`infer image describe` intenta primero ese modelo en lugar de omitir la descripción para modelos
que ya admiten visión nativa. Si la llamada falla, OpenClaw puede continuar
mediante `agents.defaults.imageModel.fallbacks`; los errores de preparación de archivo/URL
fallan antes de intentar la reserva. Usa `infer image describe` para el flujo de
comprensión de imágenes de OpenClaw y el `imageModel` configurado; usa `infer model run
--file` para una prueba multimodal sin procesar con un prompt personalizado.

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

Prefiere la referencia completa `ollama/<model>`. Una referencia `imageModel` simple como
`qwen2.5vl:7b` se normaliza a `ollama/qwen2.5vl:7b` solo cuando ese modelo exacto
aparece en `models.providers.ollama.models` con
`input: ["text", "image"]` y ningún otro proveedor de imágenes configurado expone el
mismo id simple; de lo contrario, usa explícitamente el prefijo del proveedor.

Los modelos de visión locales lentos pueden necesitar un timeout de comprensión de imágenes más largo que
los modelos cloud, y pueden fallar en hardware limitado si Ollama intenta
asignar todo el contexto de visión anunciado del modelo. Establece un timeout de capacidad
y limita `num_ctx`:

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

OpenClaw rechaza las solicitudes de descripción de imágenes para modelos no marcados
como compatibles con imágenes. Con el descubrimiento implícito, esto proviene de la
capacidad de visión de `/api/show`.

## Configuración

<Tabs>
  <Tab title="Básica (descubrimiento implícito)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` está configurada, puedes omitir `apiKey` en la entrada del proveedor; OpenClaw la completa para las comprobaciones de disponibilidad.
    </Tip>

  </Tab>

  <Tab title="Explícita (modelos manuales)">
    Usa configuración explícita para una configuración en la nube alojada, un host/puerto
    no predeterminado, ventanas de contexto forzadas o listas de modelos totalmente manuales:

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

  <Tab title="URL base personalizada">
    La configuración explícita desactiva el descubrimiento automático, por lo que los modelos deben listarse:

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

Reemplaza los ID de modelo con los nombres exactos de `ollama list` u
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Modelo local con descubrimiento automático">
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

  <Accordion title="Host Ollama de LAN con modelos manuales">
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
    anunciado por el modelo.

  </Accordion>

  <Accordion title="Solo Ollama Cloud">
    Sin demonio local, modelos alojados directamente:

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

    Para el ID de proveedor dedicado `ollama-cloud` en lugar de esta forma, consulta
    [Ollama Cloud](/es/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Nube más local mediante un demonio con sesión iniciada">
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

  <Accordion title="Varios hosts de Ollama">
    ID de proveedor personalizados cuando se ejecuta más de un servidor Ollama; cada uno obtiene su
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

    OpenClaw elimina el prefijo del proveedor activo (con reserva a un prefijo
    `ollama/` sin formato) antes de llamar a Ollama, por lo que `ollama-large/qwen3.5:27b`
    llega a Ollama como `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Perfil ligero de modelo local">
    Algunos modelos locales manejan prompts simples, pero tienen dificultades con toda la
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

    Usa `compat.supportsTools: false` solo cuando el modelo o servidor falla de forma fiable
    con esquemas de herramientas; intercambia capacidad del agente por estabilidad.
    `localModelLean` elimina herramientas pesadas de navegador, cron, mensajes, generación de medios,
    voz y PDF de la superficie directa del agente salvo que se requieran explícitamente,
    y coloca catálogos más grandes detrás de Tool Search. No cambia el contexto de runtime
    ni el modo de pensamiento de Ollama. Combínalo con `params.num_ctx` y
    `params.thinking: false` para modelos de pensamiento pequeños de estilo Qwen que entran en bucle o
    gastan su presupuesto en razonamiento oculto.

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

Los ID de proveedor personalizados funcionan igual: para una referencia que usa el prefijo del proveedor
activo, como `ollama-spark/qwen3:32b`, OpenClaw elimina ese prefijo antes de
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

`timeoutSeconds` cubre la solicitud HTTP del modelo: configuración de conexión, encabezados,
streaming del cuerpo y la cancelación total de fetch protegida. `params.keep_alive` se
reenvía como `keep_alive` de nivel superior en solicitudes nativas `/api/chat`; establécelo por
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

Para hosts remotos, reemplaza `127.0.0.1` por el host de `baseUrl`. Si `curl`
funciona pero OpenClaw no, comprueba si el Gateway se ejecuta en otra
máquina, contenedor o cuenta de servicio.

## Búsqueda web de Ollama

OpenClaw incluye **Búsqueda web de Ollama** como proveedor `web_search`.

| Propiedad   | Detalle                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | `models.providers.ollama.baseUrl` cuando está establecido; de lo contrario, `http://127.0.0.1:11434`; `https://ollama.com` usa directamente la API alojada |
| Autenticación | Sin clave para un host local con sesión iniciada; `OLLAMA_API_KEY` o autenticación de proveedor configurada para búsqueda directa en `https://ollama.com` o hosts protegidos por autenticación |
| Requisito   | Los hosts locales/autohospedados deben estar en ejecución y con sesión iniciada mediante `ollama signin`; la búsqueda alojada directa necesita `baseUrl: "https://ollama.com"` además de una clave de API real |

Elígela durante `openclaw onboard` o `openclaw configure --section web`, o establece:

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

Para un host autohospedado, OpenClaw primero prueba el proxy local `/api/experimental/web_search`
y luego recurre a la ruta alojada `/api/web_search` en el mismo host; un
daemon local con sesión iniciada normalmente responde mediante el proxy local. Las llamadas directas a
`https://ollama.com` siempre usan el endpoint alojado `/api/web_search`.

<Note>
Para la configuración y el comportamiento completos, consulta [Búsqueda web de Ollama](/es/tools/ollama-search).
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo heredado compatible con OpenAI">
    <Warning>
    **Las llamadas a herramientas no son fiables en este modo.** Úsalo solo cuando un proxy necesite el formato de OpenAI y no dependas de llamadas a herramientas nativas.
    </Warning>

    Establece `api: "openai-completions"` explícitamente para un proxy detrás de
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

    OpenClaw inyecta `options.num_ctx` de forma predeterminada en este modo para que Ollama no
    vuelva silenciosamente a un contexto de 4096 tokens. Si tu proxy rechaza
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

  <Accordion title="Ventanas de contexto">
    Para modelos descubiertos automáticamente, OpenClaw usa la ventana de contexto que informa
    `/api/show`, incluidos valores `PARAMETER num_ctx` más grandes de Modelfiles
    personalizados; de lo contrario, vuelve a la ventana de contexto predeterminada de Ollama de OpenClaw.

    `contextWindow`, `contextTokens` y `maxTokens` a nivel de proveedor establecen
    valores predeterminados para cada modelo bajo ese proveedor y pueden sobrescribirse por
    modelo. `contextWindow` es el propio presupuesto de prompt/Compaction de OpenClaw. Las solicitudes nativas
    `/api/chat` dejan `options.num_ctx` sin establecer salvo que configures
    `params.num_ctx` explícitamente, por lo que Ollama aplica su propio modelo,
    `OLLAMA_CONTEXT_LENGTH` o valor predeterminado basado en VRAM; los valores de `params.num_ctx`
    no válidos, cero, negativos o no finitos se ignoran. Si una configuración anterior usaba
    solo `contextWindow`/`maxTokens` para forzar el contexto de solicitud nativo, ejecuta
    `openclaw doctor --fix` para copiarlos en `params.num_ctx`. El adaptador
    compatible con OpenAI todavía inyecta `options.num_ctx` de forma predeterminada a partir del
    `params.num_ctx` o `contextWindow` configurado; desactívalo con
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
    `params.thinking`) para establecer `think` de nivel superior; `false` desactiva el
    pensamiento a nivel de API para modelos de pensamiento de estilo Qwen.

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

  <Accordion title="Control del pensamiento">
    OpenClaw reenvía el pensamiento como Ollama lo espera: `think` de nivel superior, no
    `options.think`. Los modelos descubiertos automáticamente cuyo `/api/show` informa una
    capacidad `thinking` exponen `/think low`, `/think medium`, `/think high`
    y `/think max`; los modelos sin pensamiento exponen solo `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    O establece un valor predeterminado del modelo:

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

    `params.think`/`params.thinking` por modelo puede desactivar o forzar el
    pensamiento de API para un modelo específico. OpenClaw conserva esa configuración
    explícita cuando la ejecución activa solo tiene el valor predeterminado implícito
    `off`; un comando de runtime distinto de off, como `/think medium`, aun así lo
    sobrescribe. Una solicitud de pensamiento truthy nunca se envía a un modelo marcado
    explícitamente como `reasoning: false`; una solicitud `think: false` siempre se envía
    de todos modos.

  </Accordion>

  <Accordion title="Modelos de razonamiento">
    Los modelos llamados `deepseek-r1`, `reasoning`, `reason` o `think` se tratan
    como capaces de razonamiento de forma predeterminada — no se necesita configuración
    adicional:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Costos de modelos">
    Ollama se ejecuta localmente y es gratuito, por lo que todos los costos de modelos son `0` tanto para
    modelos detectados automáticamente como definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memoria">
    El Plugin de Ollama incluido registra un proveedor de embeddings de memoria para
    [búsqueda de memoria](/es/concepts/memory). Usa la URL base de Ollama configurada
    y la clave de API, llama a `/api/embed` y agrupa varios fragmentos de memoria en
    una solicitud `input` cuando es posible.

    Cuando `proxy.enabled=true`, las solicitudes de embeddings al origen local loopback
    exacto del host derivado de la `baseUrl` configurada usan la ruta directa protegida
    de OpenClaw en lugar del proxy de reenvío administrado. El nombre de host configurado
    debe ser `localhost` o un literal de IP de loopback; los nombres DNS que simplemente
    resuelven a loopback siguen usando la ruta de proxy administrado. Los hosts Ollama de LAN,
    tailnet, red privada y públicos siempre permanecen en la ruta de proxy administrado, y las
    redirecciones a otro host/puerto no heredan la confianza. `proxy.loopbackMode: "proxy"` enruta
    el tráfico de loopback a través del proxy de todos modos; `proxy.loopbackMode: "block"` lo deniega
    antes de conectar — consulta [Proxy administrado](/es/security/network-proxy#gateway-loopback-mode).

    | Propiedad | Valor |
    | --- | --- |
    | Modelo predeterminado | `nomic-embed-text` |
    | Extracción automática | Sí, si no está presente localmente |
    | Concurrencia en línea predeterminada | 1 (otros proveedores tienen valores predeterminados más altos; auméntala con `nonBatchConcurrency` si el host puede soportarlo) |

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

    Para un host de embeddings remoto, mantén la autenticación limitada a ese host:

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

  <Accordion title="Configuración de streaming">
    Ollama usa la **API nativa** (`/api/chat`) de forma predeterminada, que admite
    streaming y llamadas a herramientas juntas — no se necesita configuración especial.

    Para solicitudes nativas, el control de pensamiento se reenvía directamente: `/think off`
    y `openclaw agent --thinking off` envían `think: false` de nivel superior, salvo que
    se configure un `params.think`/`params.thinking` explícito; `/think
    low|medium|high` envía la cadena de esfuerzo correspondiente; `/think max` se asigna
    al esfuerzo más alto de Ollama, `think: "high"`.

    <Tip>
    Para el endpoint compatible con OpenAI en su lugar, consulta "Modo compatible con OpenAI heredado" arriba — es posible que el streaming y las llamadas a herramientas no funcionen juntos allí.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Bucle de fallos de WSL2 (reinicios repetidos)">
    En WSL2 con NVIDIA/CUDA, el instalador oficial de Ollama para Linux crea una
    unidad systemd `ollama.service` con `Restart=always`. Si ese servicio
    se inicia automáticamente y carga un modelo respaldado por GPU durante el arranque de WSL2, Ollama puede fijar
    memoria del host mientras carga; la recuperación de memoria de Hyper-V no siempre puede recuperar
    esas páginas, por lo que Windows puede terminar la VM de WSL2, systemd reinicia
    Ollama, y el bucle se repite.

    Evidencia: reinicios/terminaciones repetidos de WSL2, CPU alta en `app.slice` o
    `ollama.service` justo después del inicio de WSL2, y SIGTERM de systemd en lugar
    del OOM killer de Linux.

    OpenClaw registra una advertencia de inicio cuando detecta WSL2, `ollama.service`
    habilitado con `Restart=always` y marcadores CUDA visibles.

    Mitigación:

    ```bash
    sudo systemctl disable ollama
    ```

    En el lado de Windows, agrega esto a `%USERPROFILE%\.wslconfig`, luego ejecuta
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    O acorta el keep-alive / inicia Ollama manualmente solo cuando sea necesario:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consulta [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama no detectado">
    Confirma que Ollama esté en ejecución, que `OLLAMA_API_KEY` (o un perfil de autenticación) esté configurado,
    y que `models.providers.ollama` **no** esté definido explícitamente:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No hay modelos disponibles">
    Extrae el modelo localmente, o defínelo explícitamente en
    `models.providers.ollama`:

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Conexión rechazada">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="El host remoto funciona con curl pero no con OpenClaw">
    Verifica desde la misma máquina y runtime que ejecuta el Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Causas comunes:

    - `baseUrl` apunta a `localhost`, pero el Gateway se ejecuta en Docker o en otro host.
    - La URL usa `/v1`, lo que selecciona el comportamiento compatible con OpenAI en lugar del Ollama nativo.
    - El host remoto necesita cambios de firewall o vinculación de LAN.
    - El modelo está en el daemon de tu laptop, pero no en el remoto.

  </Accordion>

  <Accordion title="El modelo emite JSON de herramienta como texto">
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

  <Accordion title="Kimi o GLM devuelve símbolos ilegibles">
    Las respuestas alojadas de Kimi/GLM que son largas secuencias de símbolos no lingüísticas se
    tratan como una llamada de proveedor fallida en lugar de una respuesta correcta, por lo que
    el manejo normal de reintento/fallback/error toma el control en lugar de persistir
    texto dañado en la sesión.

    Si se repite, captura el nombre del modelo, el archivo de sesión actual y
    si la ejecución usó `Cloud + Local` o `Cloud only`, luego prueba una sesión
    nueva y un modelo de fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="El modelo local frío agota el tiempo de espera">
    Los modelos locales grandes pueden necesitar una primera carga larga. Limita el tiempo de espera al
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

    Si el host en sí tarda en aceptar conexiones, `timeoutSeconds` también
    extiende el tiempo de espera de conexión protegida para este proveedor.

  </Accordion>

  <Accordion title="El modelo de contexto grande es demasiado lento o se queda sin memoria">
    Muchos modelos anuncian contextos más grandes de lo que tu hardware puede ejecutar
    cómodamente. Ollama nativo usa su propio valor predeterminado de runtime salvo que
    `params.num_ctx` esté establecido. Limita tanto el presupuesto de OpenClaw como el contexto
    de solicitud de Ollama para una latencia predecible del primer token:

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
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/es/providers/ollama-cloud" icon="cloud">
    Configuración solo en la nube con el proveedor dedicado `ollama-cloud`.
  </Card>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Descripción general de todos los proveedores, refs de modelos y comportamiento de failover.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Búsqueda web de Ollama" href="/es/tools/ollama-search" icon="magnifying-glass">
    Detalles completos de configuración y comportamiento para la búsqueda web impulsada por Ollama.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
