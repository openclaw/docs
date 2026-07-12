---
read_when:
    - Quieres ejecutar OpenClaw con modelos en la nube o locales mediante Ollama
    - Necesitas orientación para instalar y configurar Ollama
    - Quieres usar modelos de visión de Ollama para comprender imágenes
summary: Ejecutar OpenClaw con Ollama (modelos en la nube y locales)
title: Ollama
x-i18n:
    generated_at: "2026-07-11T23:27:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw se comunica con la API nativa de Ollama (`/api/chat`), no con el endpoint
`/v1` compatible con OpenAI. Se admiten tres modos:

| Modo          | Qué utiliza                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------- |
| Nube + local  | Un host de Ollama accesible, que sirve modelos locales y, si se ha iniciado sesión, modelos `:cloud` |
| Solo nube     | `https://ollama.com` directamente, sin daemon local                                                 |
| Solo local    | Un host de Ollama accesible, únicamente con modelos locales                                         |

Para configurar únicamente la nube con el id de proveedor específico `ollama-cloud`, consulta
[Ollama Cloud](/es/providers/ollama-cloud). Usa referencias `ollama-cloud/<model>` cuando
quieras mantener el enrutamiento en la nube separado de un proveedor `ollama` local.

<Warning>
No uses la URL `/v1` compatible con OpenAI (`http://host:11434/v1`). Interfiere con las llamadas a herramientas y los modelos pueden emitir el JSON sin procesar de la llamada a una herramienta como texto sin formato. Usa la URL nativa: `baseUrl: "http://host:11434"` (sin `/v1`).
</Warning>

La clave de configuración canónica es `baseUrl`. También se acepta `baseURL` para
ejemplos con el estilo del SDK de OpenAI, pero las configuraciones nuevas deben usar `baseUrl`.

## Reglas de autenticación

<AccordionGroup>
  <Accordion title="Hosts locales y de la LAN">
    Las URL de Ollama de local loopback, redes privadas, `.local` y nombres de host simples no necesitan un token de portador real. OpenClaw utiliza el marcador `ollama-local` para ellas.
  </Accordion>
  <Accordion title="Hosts remotos y de Ollama Cloud">
    Los hosts remotos públicos y `https://ollama.com` requieren una credencial real: `OLLAMA_API_KEY`, un perfil de autenticación o el valor `apiKey` del proveedor. Para el uso alojado directo, se recomienda el proveedor `ollama-cloud`.
  </Accordion>
  <Accordion title="Ids de proveedor personalizados">
    Un proveedor personalizado con `api: "ollama"` sigue las mismas reglas. Por ejemplo, un proveedor `ollama-remote` que apunte a un host de una LAN privada puede usar `apiKey: "ollama-local"`; los subagentes resuelven ese marcador mediante el hook del proveedor de Ollama en lugar de tratarlo como una credencial ausente. `agents.defaults.memorySearch.provider` también puede apuntar a un id de proveedor personalizado para que los embeddings utilicen ese endpoint de Ollama.
  </Accordion>
  <Accordion title="Perfiles de autenticación">
    `auth-profiles.json` almacena la credencial de un id de proveedor; coloca la configuración del endpoint (`baseUrl`, `api`, modelos, encabezados y tiempos de espera) en `models.providers.<id>`. Los archivos planos antiguos, como `{ "ollama-windows": { "apiKey": "ollama-local" } }`, no son un formato de ejecución; `openclaw doctor --fix` los reescribe como un perfil canónico de clave de API `ollama-windows:default` y crea una copia de seguridad. Un valor `baseUrl` en ese archivo heredado es información irrelevante y debe trasladarse a la configuración del proveedor.
  </Accordion>
  <Accordion title="Ámbito de los embeddings de memoria">
    La autenticación de portador para los embeddings de memoria de Ollama se limita al host para el que se declaró:

    - Una clave de proveedor se envía únicamente al host de ese proveedor.
    - `agents.*.memorySearch.remote.apiKey` se envía únicamente a su host remoto de embeddings.
    - Un valor de entorno `OLLAMA_API_KEY` por sí solo se considera la convención de Ollama Cloud y, de forma predeterminada, no se envía a hosts locales o autoalojados.

  </Accordion>
</AccordionGroup>

## Primeros pasos

<Tabs>
  <Tab title="Incorporación (recomendada)">
    <Steps>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard
        ```

        Selecciona **Ollama** y, a continuación, elige un modo: **Nube + local**, **Solo nube** o **Solo local**.
      </Step>
      <Step title="Selecciona un modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` y sugiere opciones predeterminadas de la nube alojada. `Cloud + Local` y `Local only` solicitan una URL base de Ollama, detectan los modelos disponibles y descargan automáticamente el modelo local seleccionado si falta. Una etiqueta `:latest` instalada, como `gemma4:latest`, se muestra una sola vez en lugar de duplicar `gemma4`. `Cloud + Local` también comprueba si se ha iniciado sesión en el host para acceder a la nube.
      </Step>
      <Step title="Verifica">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    Modo no interactivo:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` y `--custom-model-id` son opcionales; si se omiten, se utilizan el host local predeterminado y el modelo sugerido `gemma4`.

  </Tab>

  <Tab title="Configuración manual">
    <Steps>
      <Step title="Instala e inicia Ollama">
        Obtenlo en [ollama.com/download](https://ollama.com/download) y, a continuación, descarga un modelo:

        ```bash
        ollama pull gemma4
        ```

        Para el acceso híbrido a la nube, ejecuta `ollama signin` en el mismo host.
      </Step>
      <Step title="Establece una credencial">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # host local/de la LAN, cualquier valor funciona
        export OLLAMA_API_KEY="your-real-key"   # solo https://ollama.com
        ```

        O en la configuración: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Selecciona el modelo">
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
de Ollama accesible; este es el flujo híbrido de Ollama y el modo que debes elegir durante la configuración
cuando quieras utilizar ambos.

OpenClaw solicita la URL base, detecta los modelos locales y comprueba el estado de
`ollama signin`. Cuando se ha iniciado sesión, sugiere opciones predeterminadas alojadas
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Si
no se ha iniciado sesión, la configuración permanece en modo solo local hasta que ejecutes `ollama signin`.

Para acceder únicamente a la nube sin un daemon local, usa `openclaw onboard --auth-choice ollama-cloud` y consulta [Ollama Cloud](/es/providers/ollama-cloud); esa vía no necesita `ollama signin` ni un servidor en ejecución:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

La lista de modelos en la nube que se muestra durante `openclaw onboard` se obtiene en tiempo real de
`https://ollama.com/api/tags`, con un límite de 500 entradas, por lo que el selector refleja
el catálogo alojado actual. Si no se puede acceder a `ollama.com` o no devuelve
modelos durante la configuración, OpenClaw recurre a su lista de sugerencias codificada para que
la incorporación pueda completarse de todos modos.

## Detección de modelos (proveedor implícito)

Cuando se establece `OLLAMA_API_KEY` (o un perfil de autenticación) y no se ha
definido ni `models.providers.ollama` ni otro proveedor personalizado con `api: "ollama"`,
OpenClaw detecta modelos desde `http://127.0.0.1:11434`:

| Comportamiento            | Detalle                                                                                                                                                                                                                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta del catálogo     | `/api/tags`                                                                                                                                                                                                                                                                                                                                     |
| Detección de capacidades  | Las lecturas de `/api/show`, con el mejor esfuerzo posible, obtienen `contextWindow`, los parámetros `num_ctx` de Modelfile y las capacidades (visión/herramientas/razonamiento)                                                                                                                                                                   |
| Modelos de visión         | Una capacidad `vision` de `/api/show` marca el modelo como compatible con imágenes (`input: ["text", "image"]`)                                                                                                                                                                                                                                  |
| Detección de razonamiento | Utiliza la capacidad `thinking` de `/api/show` cuando está disponible; recurre a una heurística de nombres (`r1`, `reason`, `reasoning`, `think`) cuando Ollama omite las capacidades. `glm-5.2:cloud` y `deepseek-v4-flash\|pro:cloud` siempre se consideran modelos de razonamiento, independientemente de las capacidades indicadas. |
| Límites de tokens         | El valor predeterminado de `maxTokens` es el límite máximo de tokens de Ollama establecido por OpenClaw                                                                                                                                                                                                                                          |
| Costes                    | Todos los costes son `0`                                                                                                                                                                                                                                                                                                                        |

```bash
ollama list
openclaw models list
```

Configurar `models.providers.ollama` con una matriz `models` explícita, o un
proveedor personalizado con `api: "ollama"` y un valor `baseUrl` que no sea de local loopback, desactiva
la detección automática; en ese caso, los modelos deben definirse manualmente (consulta
[Configuración](#configuration)). Una entrada `models.providers.ollama` que apunte al
servicio alojado `https://ollama.com` también omite la detección, ya que los modelos de Ollama Cloud
los gestiona el proveedor. Los proveedores personalizados de local loopback, como
`http://127.0.0.2:11434`, siguen considerándose locales y mantienen la detección automática.

Puedes usar una referencia completa, como `ollama/<pulled-model>:latest`, sin una
entrada escrita manualmente en `models.json`; OpenClaw la resuelve en tiempo real. En los hosts
con una sesión iniciada, al seleccionar una referencia `ollama/<model>:cloud` no incluida en la lista,
se valida ese modelo exacto con `/api/show` y se añade al catálogo de ejecución únicamente si Ollama
confirma los metadatos; los errores tipográficos siguen produciendo un error de modelo desconocido.

### Pruebas de humo

Para una prueba de texto específica que omita toda la superficie de herramientas del agente:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Añade `--file` con una imagen para realizar una prueba ligera de un modelo de visión (acepta PNG/JPEG/WebP;
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

Ninguna de las dos vías carga herramientas de chat, memoria ni contexto de sesión. Si funciona
mientras que las respuestas normales del agente fallan, es probable que el problema sea la
capacidad del modelo para herramientas o agentes, no el endpoint.

Seleccionar un modelo con `/model ollama/<model>` es una elección exacta del usuario: si no se puede
acceder al `baseUrl` configurado, la siguiente respuesta falla con el error del proveedor
en lugar de recurrir silenciosamente a otro modelo configurado.

Los trabajos de Cron aislados añaden una comprobación de seguridad local antes de iniciar el turno del agente:
si el modelo seleccionado se resuelve en un proveedor de Ollama local, de red privada o `.local`
y no se puede acceder a `/api/tags`, OpenClaw registra esa ejecución como
`skipped` e incluye el modelo en el texto del error. Esta comprobación del endpoint se almacena en caché durante
5 minutos por host, por lo que los trabajos de Cron repetidos contra un daemon detenido no
inician todos solicitudes destinadas a fallar.

Verificación en vivo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para Ollama Cloud, dirige la misma prueba en vivo al endpoint alojado (omite
los embeddings de forma predeterminada; fuérzalos con `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, ya que una
clave de la nube podría no autorizar `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para añadir un modelo, descárgalo y se detectará automáticamente:

```bash
ollama pull mistral
```

## Inferencia local en el Node

Los agentes pueden delegar una tarea breve a un modelo de Ollama en un equipo de escritorio o
Node de servidor emparejado. El prompt y la respuesta atraviesan la conexión autenticada
existente entre el Gateway y el Node; la solicitud se ejecuta en el endpoint local loopback de Ollama
del propio Node (`http://127.0.0.1:11434`).

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

    Aprueba el dispositivo y sus comandos de Node en el host del Gateway y, a continuación, verifica:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Una primera conexión, o una actualización que añada comandos de Ollama, puede activar
    la aprobación de comandos del Node. Si el Node se conecta sin anunciar
    `ollama.models` y `ollama.chat`, vuelve a consultar `openclaw nodes pending`.

  </Step>
  <Step title="Use it from an agent">
    El Plugin de Ollama incluido expone la herramienta `node_inference`. Los agentes llaman
    primero a `action: "discover"` y después a `action: "run"` con un Node y un modelo del
    resultado (`run` puede omitir el Node cuando hay exactamente un Node compatible
    conectado). Por ejemplo: «Descubre los modelos de Ollama en mis Nodes y después usa
    el modelo cargado más rápido para resumir este texto».
  </Step>
</Steps>

La detección lee `/api/tags`, comprueba las capacidades mediante `/api/show` y usa
`/api/ps` cuando está disponible para priorizar los modelos ya cargados. Solo devuelve
los modelos locales que Ollama indica que admiten chat (capacidad `completion`);
se excluyen las filas de Ollama Cloud y los modelos exclusivos para embeddings. Cada ejecución desactiva
el razonamiento del modelo y limita de forma predeterminada la salida a 512 tokens (límite máximo estricto de 8192), salvo que
la llamada a la herramienta solicite un `maxTokens` diferente; algunos modelos (por ejemplo, GPT-OSS)
no permiten desactivar el razonamiento y pueden seguir emitiendo tokens de razonamiento.

Para mantener Ollama en ejecución en un Node sin exponerlo a los agentes:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Reinicia el Node (`openclaw node restart`, o detén y vuelve a ejecutar `openclaw node run`
para una sesión en primer plano). El Node deja de anunciar `ollama.models` y
`ollama.chat`; Ollama y el proveedor de Ollama del Gateway no se ven afectados.
Vuelve a establecer el valor en `true` y reinicia para habilitarlo de nuevo; una superficie de comandos
modificada puede requerir otra aprobación mediante `openclaw nodes pending` tras volver a conectarse.

Verifica directamente los comandos del Node, sin un turno del agente:

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

`--invoke-timeout` limita cuánto tiempo tiene el Node para ejecutar el comando;
`--timeout` limita la llamada completa al Gateway y debe ser mayor.

La inferencia local en el Node siempre utiliza el endpoint local loopback del propio Node;
no reutiliza un `models.providers.ollama.baseUrl` remoto o de nube configurado. Los
comandos del Node están disponibles de forma predeterminada en hosts de Node con macOS, Linux y Windows,
y siguen sujetos a las políticas normales de emparejamiento y comandos de los Nodes.

## Visión y descripción de imágenes

El Plugin de Ollama incluido registra Ollama como proveedor de comprensión
multimedia compatible con imágenes, por lo que OpenClaw puede dirigir las solicitudes explícitas de descripción
de imágenes y los valores predeterminados de modelos de imagen configurados a modelos de visión de Ollama
locales o alojados.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` debe ser una referencia `<provider/model>` completa; cuando se establece, `infer image
describe` prueba primero ese modelo en lugar de omitir la descripción para los modelos
que ya admiten visión nativa. Si la llamada falla, OpenClaw puede continuar
con `agents.defaults.imageModel.fallbacks`; los errores de preparación de archivos o URL
fallan antes de intentar la alternativa. Usa `infer image describe` para el flujo
de comprensión de imágenes de OpenClaw y el `imageModel` configurado; usa `infer model run
--file` para una prueba multimodal directa con un prompt personalizado.

Para convertir Ollama en el proveedor predeterminado de comprensión de imágenes para contenido multimedia entrante:

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

Es preferible usar la referencia completa `ollama/<model>`. Una referencia `imageModel` sin proveedor, como
`qwen2.5vl:7b`, se normaliza a `ollama/qwen2.5vl:7b` únicamente cuando ese modelo exacto
aparece en `models.providers.ollama.models` con
`input: ["text", "image"]` y ningún otro proveedor de imágenes configurado expone el
mismo identificador sin proveedor; de lo contrario, usa explícitamente el prefijo del proveedor.

Los modelos de visión locales lentos pueden necesitar un tiempo de espera de comprensión de imágenes mayor que
los modelos de nube y pueden bloquearse en hardware con recursos limitados si Ollama intenta
asignar todo el contexto de visión anunciado por el modelo. Establece un tiempo de espera de
capacidad y limita `num_ctx`:

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

Este tiempo de espera se aplica a la comprensión de imágenes entrantes y a la herramienta
`image` explícita. `models.providers.ollama.timeoutSeconds` sigue controlando la
protección de tiempo de espera de la solicitud HTTP subyacente de Ollama para las llamadas normales a modelos.

Verificación en vivo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Si defines manualmente `models.providers.ollama.models`, marca explícitamente
los modelos de visión:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw rechaza las solicitudes de descripción de imágenes para modelos que no estén marcados
como compatibles con imágenes. Con la detección implícita, esta información procede de la capacidad de visión
de `/api/show`.

## Configuración

<Tabs>
  <Tab title="Basic (implicit discovery)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si se establece `OLLAMA_API_KEY`, puedes omitir `apiKey` en la entrada del proveedor; OpenClaw lo completa para las comprobaciones de disponibilidad.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Usa una configuración explícita para una implementación alojada en la nube, un host o puerto no predeterminado, ventanas
    de contexto forzadas o listas de modelos totalmente manuales:

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
    La configuración explícita desactiva la detección automática, por lo que deben enumerarse los modelos:

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
    No añadas `/v1`. Esa ruta selecciona el modo compatible con OpenAI, en el que las llamadas a herramientas no son fiables.
    </Warning>

  </Tab>
</Tabs>

## Recetas habituales

Sustituye los identificadores de modelos por los nombres exactos de `ollama list` o
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    Ollama en el mismo equipo que el Gateway, detectado automáticamente:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    No añadas un bloque `models.providers.ollama` salvo que necesites modelos manuales.

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
    anunciado por el modelo.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    Sin demonio local, con modelos alojados directamente:

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

    Para usar el identificador de proveedor dedicado `ollama-cloud` en lugar de esta estructura, consulta
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

  <Accordion title="Varios hosts de Ollama">
    Use identificadores de proveedor personalizados cuando ejecute más de un servidor Ollama; cada uno obtiene su
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

    OpenClaw elimina el prefijo del proveedor activo (y recurre a un prefijo
    `ollama/` simple) antes de llamar a Ollama, por lo que `ollama-large/qwen3.5:27b`
    llega a Ollama como `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Perfil ligero para modelos locales">
    Algunos modelos locales procesan instrucciones sencillas, pero tienen dificultades con la
    superficie completa de herramientas del agente. Limite las herramientas y el contexto antes de modificar
    la configuración global del entorno de ejecución:

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

    Use `compat.supportsTools: false` solo cuando el modelo o el servidor falle de forma
    sistemática con los esquemas de herramientas, ya que sacrifica capacidad del agente a cambio de estabilidad.
    `localModelLean` elimina las herramientas pesadas de navegador, cron, mensajería, generación
    multimedia, voz y PDF de la superficie directa del agente, salvo que sean necesarias explícitamente,
    y coloca los catálogos más grandes detrás de la búsqueda de herramientas. No cambia el
    contexto de ejecución ni el modo de razonamiento de Ollama. Combínelo con `params.num_ctx` y
    `params.thinking: false` para modelos de razonamiento pequeños de estilo Qwen que entran en bucle o
    consumen su presupuesto en razonamiento oculto.

  </Accordion>
</AccordionGroup>

### Selección del modelo

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

Los identificadores de proveedor personalizados funcionan de la misma manera: para una referencia que use el prefijo
del proveedor activo, como `ollama-spark/qwen3:32b`, OpenClaw elimina ese prefijo antes de
llamar a Ollama y envía `qwen3:32b`.

Para modelos locales lentos, priorice el ajuste específico del proveedor antes de aumentar el tiempo
de espera de todo el entorno de ejecución del agente:

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

`timeoutSeconds` abarca la solicitud HTTP al modelo: establecimiento de la conexión, encabezados,
transmisión del cuerpo y cancelación total de la solicitud protegida. `params.keep_alive` se
reenvía como `keep_alive` de nivel superior en las solicitudes nativas a `/api/chat`; configúrelo por
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

Para hosts remotos, sustituya `127.0.0.1` por el host de `baseUrl`. Si `curl`
funciona, pero OpenClaw no, compruebe si el Gateway se ejecuta en otra
máquina, contenedor o cuenta de servicio.

## Búsqueda web de Ollama

OpenClaw incluye **Ollama Web Search** como proveedor de `web_search`.

| Propiedad   | Detalle                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | `models.providers.ollama.baseUrl` cuando se configura; de lo contrario, `http://127.0.0.1:11434`; `https://ollama.com` usa directamente la API alojada      |
| Autenticación | Sin clave para un host local con sesión iniciada; `OLLAMA_API_KEY` o la autenticación configurada del proveedor para búsquedas directas en `https://ollama.com` o hosts protegidos mediante autenticación |
| Requisito   | Los hosts locales o autoalojados deben estar en ejecución y tener una sesión iniciada mediante `ollama signin`; la búsqueda alojada directa requiere `baseUrl: "https://ollama.com"` y una clave de API real |

Elíjalo durante `openclaw onboard` o `openclaw configure --section web`, o configure:

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

Para realizar búsquedas alojadas directas mediante Ollama Cloud:

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

Para un host autoalojado, OpenClaw prueba primero el proxy local
`/api/experimental/web_search` y, después, recurre a la ruta alojada `/api/web_search`
en el mismo host; normalmente, un daemon local con sesión iniciada responde mediante el proxy local. Las llamadas
directas a `https://ollama.com` siempre usan el extremo alojado `/api/web_search`.

<Note>
Para consultar la configuración y el comportamiento completos, vea [Búsqueda web de Ollama](/es/tools/ollama-search).
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo heredado compatible con OpenAI">
    <Warning>
    **Las llamadas a herramientas no son fiables en este modo.** Úselo solo cuando un proxy necesite el formato de OpenAI y usted no dependa de las llamadas nativas a herramientas.
    </Warning>

    Configure `api: "openai-completions"` explícitamente para un proxy situado detrás de
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

    Es posible que este modo no admita simultáneamente la transmisión y las llamadas a herramientas; quizá
    deba configurar `params: { streaming: false }` en el modelo.

    OpenClaw inyecta `options.num_ctx` de forma predeterminada en este modo para que Ollama
    no recurra silenciosamente a un contexto de 4096 tokens. Si su proxy rechaza
    campos `options` desconocidos, desactívelo:

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
    Para los modelos detectados automáticamente, OpenClaw usa la ventana de contexto que informa
    `/api/show`, incluidos los valores mayores de `PARAMETER num_ctx` procedentes de
    Modelfiles personalizados; de lo contrario, recurre a la ventana de contexto predeterminada de Ollama
    en OpenClaw.

    `contextWindow`, `contextTokens` y `maxTokens` en el nivel del proveedor establecen
    valores predeterminados para todos los modelos de ese proveedor y se pueden sobrescribir en cada
    modelo. `contextWindow` es el presupuesto propio de OpenClaw para instrucciones y Compaction. Las solicitudes
    nativas a `/api/chat` dejan `options.num_ctx` sin configurar, salvo que establezca
    `params.num_ctx` explícitamente, por lo que Ollama aplica el valor predeterminado de su propio modelo,
    de `OLLAMA_CONTEXT_LENGTH` o basado en la VRAM; se ignoran los valores de `params.num_ctx`
    no válidos, iguales a cero, negativos o no finitos. Si una configuración anterior usaba
    únicamente `contextWindow`/`maxTokens` para forzar el contexto de las solicitudes nativas, ejecute
    `openclaw doctor --fix` para copiarlos en `params.num_ctx`. El
    adaptador compatible con OpenAI sigue inyectando `options.num_ctx` de forma predeterminada a partir de
    `params.num_ctx` o `contextWindow` configurado; desactívelo mediante
    `injectNumCtxForOpenAICompat: false` si el servicio ascendente rechaza `options`.

    Las entradas de modelos nativos también aceptan opciones habituales del entorno de ejecución de Ollama en
    `params`, que se reenvían como `options` nativas de `/api/chat`: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` y `num_thread`.
    Algunas claves (`format`, `keep_alive`, `truncate`, `shift`) se reenvían como
    campos de solicitud de nivel superior en lugar de `options` anidadas. OpenClaw solo
    reenvía estas claves de solicitud de Ollama, por lo que los parámetros exclusivos del entorno de ejecución, como
    `streaming`, nunca se envían a Ollama. Use `params.think` (o
    `params.thinking`) para configurar `think` en el nivel superior; `false` desactiva el
    razonamiento en el nivel de la API para los modelos de razonamiento de estilo Qwen.

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

    También funciona `agents.defaults.models["ollama/<model>"].params.num_ctx` por
    modelo; la entrada explícita del modelo del proveedor prevalece si se configuran ambas.

  </Accordion>

  <Accordion title="Control del razonamiento">
    OpenClaw reenvía el razonamiento como Ollama espera: `think` en el nivel superior, no
    `options.think`. Los modelos detectados automáticamente para los que `/api/show` informa de una
    capacidad `thinking` exponen `/think low`, `/think medium`, `/think high`
    y `/think max`; los modelos sin razonamiento solo exponen `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    También puede establecer un valor predeterminado para el modelo:

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

    La configuración por modelo `params.think`/`params.thinking` puede desactivar o forzar el razonamiento de la API
    para un modelo específico. OpenClaw conserva esa configuración explícita
    cuando la ejecución activa solo tiene el valor predeterminado implícito `off`; un comando
    de tiempo de ejecución distinto de `off`, como `/think medium`, sigue prevaleciendo sobre ella. Nunca se
    envía una solicitud de razonamiento verdadera a un modelo marcado explícitamente con
    `reasoning: false`; una solicitud `think: false` se envía siempre.

  </Accordion>

  <Accordion title="Reasoning models">
    Los modelos llamados `deepseek-r1`, `reasoning`, `reason` o `think` se consideran
    capaces de razonar de forma predeterminada, sin necesidad de configuración adicional:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Model costs">
    Ollama se ejecuta localmente y es gratuito, por lo que todos los costes de los modelos son `0`, tanto para
    los modelos detectados automáticamente como para los definidos manualmente.
  </Accordion>

  <Accordion title="Memory embeddings">
    El Plugin de Ollama incluido registra un proveedor de embeddings de memoria para la
    [búsqueda en memoria](/es/concepts/memory). Utiliza la URL base y la clave de API
    configuradas para Ollama, llama a `/api/embed` y agrupa varios fragmentos de memoria en
    una solicitud `input` cuando es posible.

    Cuando `proxy.enabled=true`, las solicitudes de embeddings dirigidas exactamente al origen
    local del host en local loopback derivado de la `baseUrl` configurada utilizan la ruta directa
    protegida de OpenClaw en lugar del proxy de reenvío administrado. El nombre de host configurado
    debe ser `localhost` o una dirección IP literal de loopback; los nombres DNS
    que simplemente se resuelven a loopback siguen utilizando la ruta del proxy administrado. Los hosts
    de Ollama en la LAN, la tailnet, redes privadas o redes públicas permanecen siempre en la
    ruta del proxy administrado, y las redirecciones a otro host o puerto no heredan
    la confianza. `proxy.loopbackMode: "proxy"` dirige de todos modos el tráfico de loopback a través del
    proxy; `proxy.loopbackMode: "block"` lo rechaza antes de conectarse;
    consulte [Proxy administrado](/es/security/network-proxy#gateway-loopback-mode).

    | Propiedad | Valor |
    | --- | --- |
    | Modelo predeterminado | `nomic-embed-text` |
    | Descarga automática | Sí, si no está presente localmente |
    | Concurrencia integrada predeterminada | 1 (otros proveedores tienen un valor predeterminado mayor; auméntelo con `nonBatchConcurrency` si el host puede soportarlo) |

    Los embeddings en tiempo de consulta utilizan prefijos de recuperación para los modelos que los requieren o
    recomiendan: `nomic-embed-text`, `qwen3-embedding` y
    `mxbai-embed-large`. Los lotes de documentos permanecen sin modificar, por lo que los índices existentes no
    necesitan migrar de formato.

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

    Para un host remoto de embeddings, limite la autenticación a ese host:

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
    Ollama utiliza de forma predeterminada la **API nativa** (`/api/chat`), que admite
    simultáneamente streaming y llamadas a herramientas, sin necesidad de configuración especial.

    En las solicitudes nativas, el control del razonamiento se reenvía directamente: `/think off`
    y `openclaw agent --thinking off` envían `think: false` en el nivel superior, salvo que
    se haya configurado explícitamente `params.think`/`params.thinking`; `/think
    low|medium|high` envía la cadena de esfuerzo correspondiente; `/think max` se asigna
    al nivel de esfuerzo más alto de Ollama, `think: "high"`.

    <Tip>
    Para utilizar en su lugar el endpoint compatible con OpenAI, consulte «Modo heredado compatible con OpenAI» más arriba; es posible que el streaming y las llamadas a herramientas no funcionen juntos en ese modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="WSL2 crash loop (repeated reboots)">
    En WSL2 con NVIDIA/CUDA, el instalador oficial de Ollama para Linux crea una
    unidad systemd `ollama.service` con `Restart=always`. Si ese servicio
    se inicia automáticamente y carga un modelo respaldado por GPU durante el arranque de WSL2, Ollama puede retener
    memoria del host durante la carga; la recuperación de memoria de Hyper-V no siempre puede recuperar
    esas páginas, por lo que Windows puede finalizar la máquina virtual de WSL2, systemd reinicia
    Ollama y el ciclo se repite.

    Indicios: reinicios o finalizaciones repetidos de WSL2, uso elevado de CPU en `app.slice` o
    `ollama.service` inmediatamente después de iniciar WSL2, y SIGTERM enviado por systemd en lugar
    del eliminador por falta de memoria de Linux.

    OpenClaw registra una advertencia de inicio cuando detecta WSL2, `ollama.service`
    habilitado con `Restart=always` y marcadores CUDA visibles.

    Mitigación:

    ```bash
    sudo systemctl disable ollama
    ```

    En Windows, añada lo siguiente a `%USERPROFILE%\.wslconfig` y después ejecute
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    También puede reducir el tiempo de permanencia o iniciar Ollama manualmente solo cuando sea necesario:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consulte [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama not detected">
    Confirme que Ollama esté en ejecución, que `OLLAMA_API_KEY` (o un perfil de autenticación) esté configurado
    y que `models.providers.ollama` **no** esté definido explícitamente:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No models available">
    Descargue el modelo localmente o defínalo explícitamente en
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
    Verifique desde la misma máquina y el mismo entorno de ejecución donde se ejecuta el Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Causas habituales:

    - `baseUrl` apunta a `localhost`, pero el Gateway se ejecuta en Docker o en otro host.
    - La URL utiliza `/v1`, lo que selecciona el comportamiento compatible con OpenAI en lugar del comportamiento nativo de Ollama.
    - El host remoto necesita cambios en el firewall o en la vinculación a la LAN.
    - El modelo está en el daemon de su portátil, pero no en el remoto.

  </Accordion>

  <Accordion title="Model outputs tool JSON as text">
    Normalmente, el proveedor está en modo compatible con OpenAI o el modelo no puede
    procesar esquemas de herramientas. Prefiera el modo nativo:

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

    Si un modelo local pequeño sigue fallando con los esquemas de herramientas, establezca
    `compat.supportsTools: false` en la entrada de ese modelo y vuelva a probarlo.

  </Accordion>

  <Accordion title="Kimi or GLM returns garbled symbols">
    Las respuestas alojadas de Kimi/GLM que consisten en secuencias largas de símbolos no lingüísticos se
    consideran una llamada fallida al proveedor en lugar de una respuesta correcta, de modo que
    se aplican los mecanismos normales de reintento, conmutación por error y gestión de errores, en vez de guardar
    texto dañado en la sesión.

    Si vuelve a ocurrir, recopile el nombre del modelo, el archivo de la sesión actual y
    si la ejecución utilizó `Cloud + Local` o `Cloud only`; después, pruebe una sesión
    nueva y un modelo de respaldo:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Cold local model times out">
    Los modelos locales grandes pueden necesitar mucho tiempo para la primera carga. Limite el tiempo de espera al
    proveedor de Ollama y, opcionalmente, mantenga el modelo cargado entre turnos:

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
    amplía el tiempo de espera protegido de conexión para este proveedor.

  </Accordion>

  <Accordion title="Large-context model is too slow or runs out of memory">
    Muchos modelos anuncian contextos mayores de los que su hardware puede ejecutar
    cómodamente. Ollama nativo utiliza su propio valor predeterminado de tiempo de ejecución, salvo que
    se establezca `params.num_ctx`. Limite tanto el presupuesto de OpenClaw como el contexto de la solicitud
    de Ollama para obtener una latencia predecible hasta el primer token:

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

    Reduzca `contextWindow` si OpenClaw envía demasiado contenido en el prompt. Reduzca
    `params.num_ctx` si el contexto de tiempo de ejecución de Ollama es demasiado grande para la máquina.
    Reduzca `maxTokens` si la generación tarda demasiado.

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/es/providers/ollama-cloud" icon="cloud">
    Configuración exclusiva para la nube con el proveedor dedicado `ollama-cloud`.
  </Card>
  <Card title="Model providers" href="/es/concepts/model-providers" icon="layers">
    Descripción general de todos los proveedores, las referencias de modelos y el comportamiento de conmutación por error.
  </Card>
  <Card title="Model selection" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Ollama Web Search" href="/es/tools/ollama-search" icon="magnifying-glass">
    Detalles completos de configuración y funcionamiento de la búsqueda web con Ollama.
  </Card>
  <Card title="Configuration" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
