---
read_when:
    - Quieres ejecutar OpenClaw con modelos en la nube o locales mediante Ollama
    - Necesita orientación para instalar y configurar Ollama
    - Quieres usar modelos de visión de Ollama para comprender imágenes
summary: Ejecutar OpenClaw con Ollama (modelos en la nube y locales)
title: Ollama
x-i18n:
    generated_at: "2026-07-21T09:01:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0c44c2ad5c0084fa7b93c78a91a4e6edfbccdba00669df218f4f33a2247ce705
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw se comunica con la API nativa de Ollama (`/api/chat`), no con el endpoint compatible con OpenAI
`/v1`. Se admiten tres modos:

| Modo          | Qué utiliza                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| Nube + local | Un host de Ollama accesible, que sirve modelos locales y, si se ha iniciado sesión, modelos `:cloud` |
| Solo nube    | `https://ollama.com` directamente, sin daemon local                                   |
| Solo local    | Un host de Ollama accesible, solo modelos locales                                       |

Para una configuración solo en la nube con el id de proveedor específico `ollama-cloud`, consulte
[Ollama Cloud](/es/providers/ollama-cloud). Use referencias `ollama-cloud/<model>` cuando
quiera mantener el enrutamiento en la nube separado de un proveedor local `ollama`.

<Warning>
No use la URL `/v1` compatible con OpenAI (`http://host:11434/v1`). Impide que las llamadas a herramientas funcionen correctamente y los modelos pueden emitir el JSON sin procesar de las llamadas a herramientas como texto sin formato. Use la URL nativa: `baseUrl: "http://host:11434"` (sin `/v1`).
</Warning>

La clave de configuración canónica es `baseUrl`. También se acepta `baseURL` para
ejemplos con el estilo del SDK de OpenAI, pero las configuraciones nuevas deben usar `baseUrl`.

## Reglas de autenticación

<AccordionGroup>
  <Accordion title="Hosts locales y de LAN">
    Las URL de Ollama de bucle invertido, red privada, `.local` y nombre de host sin dominio no necesitan un token de portador real. OpenClaw usa el marcador `ollama-local` para estas.
  </Accordion>
  <Accordion title="Hosts remotos y de Ollama Cloud">
    Los hosts remotos públicos y `https://ollama.com` requieren una credencial real: `OLLAMA_API_KEY`, un perfil de autenticación o el `apiKey` del proveedor. Para el uso alojado directo, se recomienda el proveedor `ollama-cloud`.
  </Accordion>
  <Accordion title="Identificadores de proveedor personalizados">
    Un proveedor personalizado con `api: "ollama"` sigue las mismas reglas. Por ejemplo, un proveedor `ollama-remote` que apunte a un host de LAN privada puede usar `apiKey: "ollama-local"`; los subagentes resuelven ese marcador mediante el enlace del proveedor Ollama, en lugar de tratarlo como una credencial ausente. `agents.defaults.memorySearch.provider` también puede apuntar a un identificador de proveedor personalizado para que las incrustaciones usen ese endpoint de Ollama.
  </Accordion>
  <Accordion title="Perfiles de autenticación">
    `auth-profiles.json` almacena la credencial de un identificador de proveedor; coloque la configuración del endpoint (`baseUrl`, `api`, modelos, encabezados y tiempos de espera) en `models.providers.<id>`. Los archivos planos antiguos, como `{ "ollama-windows": { "apiKey": "ollama-local" } }`, no son un formato de tiempo de ejecución; `openclaw doctor --fix` los reescribe como un perfil canónico de clave de API `ollama-windows:default` y crea una copia de seguridad. Un valor `baseUrl` en ese archivo heredado es información irrelevante y debe trasladarse a la configuración del proveedor.
  </Accordion>
  <Accordion title="Ámbito de las incrustaciones de memoria">
    La autenticación de portador para las incrustaciones de memoria de Ollama se limita al host para el que se declaró:

    - Una clave de proveedor solo se envía al host de ese proveedor.
    - `agents.*.memorySearch.remote.apiKey` solo se envía a su host remoto de incrustaciones.
    - Un valor de entorno `OLLAMA_API_KEY` puro se considera la convención de Ollama Cloud y no se envía de forma predeterminada a hosts locales o autoalojados.

  </Accordion>
</AccordionGroup>

## Primeros pasos

<Tabs>
  <Tab title="Incorporación (recomendada)">
    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard
        ```

        Seleccione **Ollama** y, a continuación, elija un modo: **Nube + local**, **Solo nube** o **Solo local**.

        En una configuración guiada nueva, OpenClaw comprueba primero el host de
        Ollama predeterminado o configurado. Solo se ofrece automáticamente un modelo
        instalado cuando `/api/show` confirma la compatibilidad con herramientas y una ventana de contexto de al menos 16K;
        si faltan los metadatos de contexto o indican un tamaño menor, se mantiene la ruta de configuración manual. La
        secuencia de configuración compartida de CLI/macOS sigue verificando la ruta seleccionada con una
        finalización real antes de guardarla. Esta comprobación automática nunca descarga un
        modelo; si no existe ningún modelo instalado adecuado, la incorporación continúa con el
        selector normal de Ollama.
      </Step>
      <Step title="Seleccionar un modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` y sugiere valores predeterminados alojados en la nube. `Cloud + Local` y `Local only` solicitan una URL base de Ollama, descubren los modelos disponibles y descargan automáticamente el modelo local seleccionado si falta. Una etiqueta `:latest` instalada, como `gemma4:latest`, se muestra una sola vez en lugar de duplicar `gemma4`. `Cloud + Local` también comprueba si se ha iniciado sesión en el host para acceder a la nube.
      </Step>
      <Step title="Verificar">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    Sin interacción:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` y `--custom-model-id` son opcionales; si se omiten, se usan el host local predeterminado y el modelo sugerido `gemma4`.

  </Tab>

  <Tab title="Configuración manual">
    <Steps>
      <Step title="Instalar e iniciar Ollama">
        Descárguelo de [ollama.com/download](https://ollama.com/download) y, a continuación, descargue un modelo:

        ```bash
        ollama pull gemma4
        ```

        Para el acceso híbrido a la nube, ejecute `ollama signin` en el mismo host.
      </Step>
      <Step title="Establecer una credencial">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # host local/LAN; cualquier valor funciona
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

`Cloud + Local` enruta tanto los modelos locales como los modelos `:cloud` mediante un único host de
Ollama accesible; este es el flujo híbrido de Ollama y el modo que se debe elegir durante la configuración
cuando se quieren ambos.

OpenClaw solicita la URL base, descubre los modelos locales y comprueba el
estado de `ollama signin`. Cuando se ha iniciado sesión, sugiere valores predeterminados alojados
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Si
no se ha iniciado sesión, la configuración permanece en modo solo local hasta que se ejecute `ollama signin`.

Para el acceso solo en la nube sin un daemon local, use `openclaw onboard --auth-choice ollama-cloud` y consulte [Ollama Cloud](/es/providers/ollama-cloud); esa ruta no necesita `ollama signin` ni un servidor en ejecución:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

La lista de modelos en la nube que se muestra durante `openclaw onboard` se obtiene en tiempo real de
`https://ollama.com/api/tags` y tiene un límite de 500 entradas, por lo que el selector refleja
el catálogo alojado actual. Si `ollama.com` no está accesible o no devuelve
modelos durante la configuración, OpenClaw recurre a su lista de sugerencias predefinida para que
la incorporación pueda completarse.

## Descubrimiento de modelos (proveedor implícito)

Cuando `OLLAMA_API_KEY` (o un perfil de autenticación) está establecido y no se ha
definido ni `models.providers.ollama` ni otro proveedor personalizado con `api: "ollama"`,
OpenClaw descubre modelos desde `http://127.0.0.1:11434`:

| Comportamiento             | Detalle                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta del catálogo        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| Detección de capacidades | `/api/show`, en la medida de lo posible, lee `contextWindow`, los parámetros Modelfile de `num_ctx` y las capacidades (visión/herramientas/razonamiento)                                                                                                                                                                       |
| Modelos de visión        | Una capacidad `vision` de `/api/show` marca el modelo como compatible con imágenes (`input: ["text", "image"]`)                                                                                                                                                                                             |
| Detección de razonamiento  | Usa la capacidad `thinking` de `/api/show` cuando está disponible; recurre a una heurística de nombre (`r1`, `reason`, `reasoning`, `think`) cuando Ollama omite las capacidades. `glm-5.2:cloud` y `deepseek-v4-flash\|pro:cloud` siempre se consideran modelos de razonamiento, independientemente de las capacidades declaradas. |
| Límites de tokens         | `maxTokens` utiliza de forma predeterminada el límite máximo de tokens de Ollama de OpenClaw                                                                                                                                                                                                                                       |
| Costes                | Todos los costes son `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

Establecer `models.providers.ollama` con una matriz `models` explícita, o un
proveedor personalizado con `api: "ollama"` y un `baseUrl` que no sea de bucle invertido, desactiva
el descubrimiento automático; en ese caso, los modelos deben definirse manualmente (consulte
[Configuración](#configuration)). Una entrada `models.providers.ollama` que apunte al
`https://ollama.com` alojado también omite el descubrimiento, ya que los modelos de Ollama Cloud
son gestionados por el proveedor. Los proveedores personalizados de bucle invertido, como
`http://127.0.0.2:11434`, siguen considerándose locales y mantienen el descubrimiento automático.

Se puede usar una referencia completa, como `ollama/<pulled-model>:latest`, sin una
entrada `models.json` escrita manualmente; OpenClaw la resuelve en tiempo real. En los hosts
con sesión iniciada, seleccionar una referencia `ollama/<model>:cloud` no incluida valida ese
modelo exacto con `/api/show` y lo añade al catálogo en tiempo de ejecución únicamente si Ollama
confirma los metadatos; los errores tipográficos siguen produciendo un error de modelo desconocido.

### Pruebas de humo

Para una prueba de texto acotada que omite toda la superficie de herramientas del agente:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Responde exactamente: pong" \
    --json
```

Añada `--file` con una imagen para una prueba ligera de un modelo de visión (acepta PNG/JPEG/WebP;
los archivos que no sean imágenes se rechazan antes de llamar a Ollama; use
`openclaw infer audio transcribe` para audio):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe esta imagen en una oración." \
    --file ./photo.jpg \
    --json
```

Ninguna de las dos rutas carga herramientas de chat, memoria ni contexto de sesión. Si funciona
mientras las respuestas normales del agente fallan, es probable que el problema sea la capacidad
del modelo para herramientas o agentes, no el endpoint.

Seleccionar un modelo con `/model ollama/<model>` es una elección exacta del usuario: si no se puede acceder al
`baseUrl` configurado, la siguiente respuesta falla con el error del proveedor
en lugar de recurrir silenciosamente a otro modelo configurado.

Los trabajos Cron aislados añaden una comprobación de seguridad local antes de iniciar el turno del agente:
si el modelo seleccionado se resuelve a un proveedor Ollama local, de red privada o
`.local` y no se puede acceder a `/api/tags`, OpenClaw registra esa ejecución como
`skipped` e incluye el modelo en el texto del error. Esta comprobación del endpoint se almacena en caché durante
5 minutos por host, para que los trabajos Cron repetidos dirigidos a un daemon detenido no
inicien todos solicitudes que fallarán.

Verificación en vivo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para Ollama Cloud, dirija la misma prueba en vivo al endpoint alojado (omite
los embeddings de forma predeterminada; fuércelos con `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, ya que una
clave de nube podría no autorizar `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para añadir un modelo, descárguelo y se detectará automáticamente:

```bash
ollama pull mistral
```

## Inferencia local en el Node

Los agentes pueden delegar una tarea breve a un modelo de Ollama en un equipo de escritorio o
Node de servidor emparejado. El prompt y la respuesta atraviesan la conexión autenticada
existente entre el Gateway y el Node; la solicitud se ejecuta en el endpoint Ollama de loopback
del propio Node (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Iniciar Ollama en el Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Conectar el host del Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Apruebe el dispositivo y sus comandos de Node en el host del Gateway y, a continuación, verifique:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Una primera conexión, o una actualización que añada comandos de Ollama, puede activar
    la aprobación de comandos del Node. Si el Node se conecta sin anunciar
    `ollama.models` y `ollama.chat`, vuelva a comprobar `openclaw nodes pending`.

  </Step>
  <Step title="Usarlo desde un agente">
    El plugin de Ollama incluido expone la herramienta `node_inference`. Los agentes llaman
    primero a `action: "discover"` y después a `action: "run"` con un Node y un modelo del
    resultado (`run` puede omitir el Node cuando hay exactamente un Node compatible
    conectado). Por ejemplo: «Detecta los modelos de Ollama en mis Nodes y usa
    el modelo cargado más rápido para resumir este texto».
  </Step>
</Steps>

La detección lee `/api/tags`, comprueba las capacidades de `/api/show` y utiliza
`/api/ps` cuando está disponible para clasificar primero los modelos ya cargados. Solo devuelve
los modelos locales que Ollama indica como compatibles con chat (capacidad `completion`) —
se excluyen las filas de Ollama Cloud y los modelos exclusivos para embeddings. Cada ejecución desactiva
el razonamiento del modelo y limita de forma predeterminada la salida a 512 tokens (límite estricto de 8192), salvo que la
llamada a la herramienta solicite un `maxTokens` diferente; algunos modelos (por ejemplo, GPT-OSS)
no permiten desactivar el razonamiento y aun así pueden emitir tokens de razonamiento.

Para mantener Ollama en ejecución en un Node sin exponerlo a los agentes:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Reinicie el Node (`openclaw node restart`, o detenga y vuelva a ejecutar `openclaw node run`
para una sesión en primer plano). El Node deja de anunciar `ollama.models` y
`ollama.chat`; Ollama y el proveedor Ollama del Gateway no se ven afectados.
Vuelva a establecer el valor en `true` y reinicie para reactivarlo; una superficie de comandos
modificada puede necesitar de nuevo la aprobación de `openclaw nodes pending` tras la reconexión.

Verifique los comandos del Node directamente, sin un turno de agente:

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

`--invoke-timeout` limita el tiempo del que dispone el Node para ejecutar el comando;
`--timeout` limita la llamada general del Gateway y debe ser mayor.

La inferencia local en el Node siempre utiliza el endpoint de loopback del propio Node; no
reutiliza un `models.providers.ollama.baseUrl` remoto o en la nube configurado. Los
comandos del Node están disponibles de forma predeterminada en hosts de Node con macOS, Linux y Windows,
y siguen sujetos a la política normal de emparejamiento y comandos del Node.

## Visión y descripción de imágenes

El plugin de Ollama incluido registra Ollama como proveedor de
comprensión multimedia compatible con imágenes, por lo que OpenClaw puede enrutar solicitudes explícitas
de descripción de imágenes y valores predeterminados configurados del modelo de imagen mediante modelos de visión
de Ollama locales o alojados.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` debe ser una referencia `<provider/model>` completa; cuando se establece, `infer image
describe` prueba primero ese modelo en lugar de omitir la descripción para los modelos
que ya admiten visión nativa. Si la llamada falla, OpenClaw puede continuar
mediante `agents.defaults.imageModel.fallbacks`; los errores de preparación de archivos o URL
fallan antes de intentar el fallback. Use `infer image describe` para el
flujo de comprensión de imágenes de OpenClaw y el `imageModel` configurado; use `infer model run
--file` para una prueba multimodal sin procesar con un prompt personalizado.

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

Se recomienda usar la referencia `ollama/<model>` completa. Una referencia `imageModel` sin prefijo, como
`qwen2.5vl:7b`, se normaliza a `ollama/qwen2.5vl:7b` solo cuando ese modelo exacto
aparece en `models.providers.ollama.models` con
`input: ["text", "image"]` y ningún otro proveedor de imágenes configurado expone el
mismo identificador sin prefijo; de lo contrario, use explícitamente el prefijo del proveedor.

Los modelos de visión locales lentos pueden necesitar un tiempo de espera de comprensión de imágenes mayor que
los modelos en la nube y pueden bloquearse en hardware con recursos limitados si Ollama intenta
asignar todo el contexto de visión anunciado por el modelo. Establezca un tiempo de espera de la capacidad
y limite `num_ctx`:

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
explícita `image`. `models.providers.ollama.timeoutSeconds` sigue controlando la
protección de solicitudes HTTP subyacente de Ollama para las llamadas normales al modelo.

Verificación en vivo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Si define `models.providers.ollama.models` manualmente, marque explícitamente los modelos
de visión:

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
como compatibles con imágenes. Con la detección implícita, esto proviene de la capacidad de visión
de `/api/show`.

## Configuración

<Tabs>
  <Tab title="Básica (detección implícita)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si se establece `OLLAMA_API_KEY`, se puede omitir `apiKey` en la entrada del proveedor; OpenClaw lo completa para las comprobaciones de disponibilidad.
    </Tip>

  </Tab>

  <Tab title="Explícita (modelos manuales)">
    Use una configuración explícita para una instalación alojada en la nube, un host o puerto no predeterminado, ventanas de
    contexto forzadas o listas de modelos completamente manuales:

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
    La configuración explícita desactiva la detección automática, por lo que se deben enumerar los modelos:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Sin /v1: URL de la API nativa de Ollama
            api: "ollama", // Explícito: garantiza el comportamiento nativo de llamadas a herramientas
            timeoutSeconds: 300, // Opcional: mayor margen de conexión/transmisión para modelos locales sin cargar
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Opcional: mantener el modelo cargado entre turnos
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    No añada `/v1`. Esa ruta selecciona el modo compatible con OpenAI, donde las llamadas a herramientas no son fiables.
    </Warning>

  </Tab>
</Tabs>

## Recetas habituales

Sustituya los identificadores de modelo por nombres exactos de `ollama list` o
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Modelo local con detección automática">
    Ollama en el mismo equipo que el Gateway, detectado automáticamente:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    No añada un bloque `models.providers.ollama` salvo que necesite modelos manuales.

  </Accordion>

  <Accordion title="Host de Ollama en la LAN con modelos manuales">
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

    `contextWindow` es el margen de contexto de OpenClaw; `params.num_ctx` se envía a
    Ollama. Manténgalos alineados cuando el hardware no pueda ejecutar todo el
    contexto anunciado por el modelo.

  </Accordion>

  <Accordion title="Solo Ollama Cloud">
    Sin daemon local, directamente con modelos alojados:

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

    Para usar el id de proveedor dedicado `ollama-cloud` en lugar de esta estructura, consulte
    [Ollama Cloud](/es/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Nube y entorno local mediante un daemon con sesión iniciada">
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

    OpenClaw elimina el prefijo del proveedor activo (y, si no está disponible, usa un prefijo
    `ollama/` simple) antes de llamar a Ollama, por lo que `ollama-large/qwen3.5:27b`
    llega a Ollama como `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Perfil ligero para modelos locales">
    Algunos modelos locales gestionan instrucciones sencillas, pero tienen dificultades con toda la
    superficie de herramientas del agente. Limite las herramientas y el contexto antes de modificar la configuración
    global del entorno de ejecución:

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

    Use `compat.supportsTools: false` únicamente cuando el modelo o el servidor falle de forma fiable
    con los esquemas de herramientas, ya que sacrifica capacidad del agente a cambio de estabilidad.
    `localModelLean` elimina de la superficie directa del agente las herramientas pesadas de navegador,
    Cron, mensajería, generación multimedia, voz y PDF, salvo que se requieran explícitamente,
    y coloca los catálogos más grandes detrás de la búsqueda de herramientas. No cambia el
    contexto de ejecución ni el modo de razonamiento de Ollama. Combínelo con `params.num_ctx` y
    `params.thinking: false` para modelos pequeños de razonamiento al estilo Qwen que entren en bucle o
    consuman su presupuesto en razonamiento oculto.

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

Los identificadores de proveedor personalizados funcionan de la misma manera: para una referencia que usa el prefijo
del proveedor activo, como `ollama-spark/qwen3:32b`, OpenClaw elimina ese prefijo antes de
llamar a Ollama y envía `qwen3:32b`.

Para modelos locales lentos, priorice los ajustes específicos del proveedor antes de aumentar el tiempo de espera de
todo el entorno de ejecución del agente:

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

`timeoutSeconds` abarca la solicitud HTTP del modelo: establecimiento de la conexión, encabezados,
transmisión del cuerpo y cancelación total de la obtención protegida. `params.keep_alive` se
reenvía como `keep_alive` de nivel superior en las solicitudes nativas `/api/chat`; configúrelo por
modelo cuando el tiempo de carga del primer turno sea el cuello de botella.

### Verificación rápida

```bash
# Daemon de Ollama visible para esta máquina
curl http://127.0.0.1:11434/api/tags

# Catálogo de OpenClaw y modelo seleccionado
openclaw models list --provider ollama
openclaw models status

# Prueba de humo directa del modelo
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Responde exactamente con: ok"
```

Para hosts remotos, sustituya `127.0.0.1` por el host `baseUrl`. Si `curl`
funciona, pero OpenClaw no, compruebe si el Gateway se ejecuta en otra
máquina, contenedor o cuenta de servicio.

## Búsqueda web de Ollama

OpenClaw incluye **Búsqueda web de Ollama** como proveedor `web_search`.

| Propiedad   | Detalle                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | `models.providers.ollama.baseUrl` cuando se establece; de lo contrario, `http://127.0.0.1:11434`; `https://ollama.com` usa directamente la API alojada                          |
| Autenticación | Sin clave para un host local con sesión iniciada; `OLLAMA_API_KEY` o la autenticación configurada del proveedor para búsquedas directas `https://ollama.com` o hosts protegidos mediante autenticación           |
| Requisito   | Los hosts locales o autoalojados deben estar en ejecución y tener una sesión iniciada con `ollama signin`; la búsqueda alojada directa necesita `baseUrl: "https://ollama.com"` y una clave de API real |

Elíjalo durante `openclaw onboard` o `openclaw configure --section web`, o establezca:

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

Para un host autoalojado, OpenClaw prueba primero el proxy local `/api/experimental/web_search`
y después recurre a la ruta alojada `/api/web_search` del mismo host; normalmente,
un daemon local con sesión iniciada responde mediante el proxy local. Las llamadas directas
`https://ollama.com` usan siempre el punto de conexión alojado `/api/web_search`.

<Note>
Para consultar la configuración y el comportamiento completos, consulte [Búsqueda web de Ollama](/es/tools/ollama-search).
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo heredado compatible con OpenAI">
    <Warning>
    **Las llamadas a herramientas no son fiables en este modo.** Úselo únicamente cuando un proxy necesite el formato de OpenAI y no dependa de las llamadas a herramientas nativas.
    </Warning>

    Establezca `api: "openai-completions"` explícitamente para un proxy situado detrás de
    `/v1/chat/completions`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // valor predeterminado: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Es posible que este modo no admita simultáneamente la transmisión y las llamadas a herramientas;
    puede que necesite `params: { streaming: false }` en el modelo.

    OpenClaw inyecta `options.num_ctx` de forma predeterminada en este modo para que Ollama
    no recurra silenciosamente a un contexto de 4096 tokens. Si el proxy rechaza
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
    Para los modelos detectados automáticamente, OpenClaw usa la ventana de contexto que indica `/api/show`,
    incluidos los valores `PARAMETER num_ctx` más grandes procedentes de
    Modelfiles personalizados; de lo contrario, recurre a la ventana de contexto predeterminada de
    Ollama en OpenClaw.

    `contextWindow`, `contextTokens` y `maxTokens` a nivel de proveedor establecen
    valores predeterminados para todos los modelos de ese proveedor y se pueden sobrescribir por
    modelo. `contextWindow` es el presupuesto propio de OpenClaw para instrucciones y Compaction. Las solicitudes
    nativas `/api/chat` dejan `options.num_ctx` sin establecer, salvo que se configure
    `params.num_ctx` explícitamente, de modo que Ollama aplica su propio valor predeterminado basado en el modelo,
    `OLLAMA_CONTEXT_LENGTH` o la VRAM; se ignoran los valores `params.num_ctx` no válidos, iguales a cero, negativos
    o no finitos. Si una configuración anterior usaba solo
    `contextWindow`/`maxTokens` para forzar el contexto de las solicitudes nativas, ejecute
    `openclaw doctor --fix` para copiarlos en `params.num_ctx`. El
    adaptador compatible con OpenAI sigue inyectando `options.num_ctx` de forma predeterminada a partir
    del valor configurado de `params.num_ctx` o `contextWindow`; desactívelo con
    `injectNumCtxForOpenAICompat: false` si el servicio ascendente rechaza `options`.

    Las entradas de modelos nativos también aceptan opciones comunes del entorno de ejecución de Ollama en
    `params`, que se reenvían como `/api/chat` `options` nativas: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` y `num_thread`.
    Algunas claves (`format`, `keep_alive`, `truncate`, `shift`) se reenvían como
    campos de solicitud de nivel superior en lugar de estar anidadas en `options`. OpenClaw solo
    reenvía estas claves de solicitud de Ollama, por lo que los parámetros exclusivos del entorno de ejecución, como
    `streaming`, nunca se envían a Ollama. Use `params.think` (o
    `params.thinking`) para establecer `think` en el nivel superior; `false` desactiva el
    razonamiento a nivel de API para los modelos de razonamiento al estilo Qwen.

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

    La configuración por modelo `agents.defaults.models["ollama/<model>"].params.num_ctx` también
    funciona; la entrada explícita del modelo del proveedor prevalece si se configuran ambas.

  </Accordion>

  <Accordion title="Control del razonamiento">
    OpenClaw reenvía el razonamiento como lo espera Ollama: `think` en el nivel superior, no
    `options.think`. Los modelos detectados automáticamente cuyo `/api/show` indica una
    capacidad `thinking` exponen `/think low`, `/think medium`, `/think high`
    y `/think max`; los modelos sin razonamiento solo exponen `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    También se puede establecer un valor predeterminado para el modelo:

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

    La configuración por modelo `params.think`/`params.thinking` puede desactivar o forzar el
    razonamiento de la API para un modelo específico. OpenClaw conserva esa configuración explícita
    cuando la ejecución activa solo tiene el valor predeterminado implícito `off`; un comando
    de ejecución que no sea de desactivación, como `/think medium`, sigue prevaleciendo sobre ella. Nunca
    se envía una solicitud de razonamiento habilitada a un modelo marcado explícitamente como
    `reasoning: false`; una solicitud `think: false` siempre se envía, independientemente de ello.

  </Accordion>

  <Accordion title="Modelos de razonamiento">
    Los modelos denominados `deepseek-r1`, `reasoning`, `reason` o `think` se consideran
    compatibles con el razonamiento de forma predeterminada, sin necesidad de configuración adicional:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Costes de los modelos">
    Ollama se ejecuta localmente y es gratuito, por lo que todos los costes de los modelos son `0`, tanto para
    los modelos detectados automáticamente como para los definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memoria">
    El Plugin de Ollama incluido registra un proveedor de embeddings de memoria para la
    [búsqueda en memoria](/es/concepts/memory). Utiliza la URL base y la clave de API
    de Ollama configuradas, llama a `/api/embed` y agrupa varios fragmentos de memoria en
    una solicitud `input` cuando es posible.

    Cuando `proxy.enabled=true`, las solicitudes de embeddings al origen de bucle invertido
    local del host exacto derivado del `baseUrl` configurado utilizan la ruta directa
    protegida de OpenClaw en lugar del proxy de reenvío administrado. El nombre de host configurado
    debe ser `localhost` o un literal de IP de bucle invertido; los nombres DNS que simplemente
    se resuelven al bucle invertido siguen utilizando la ruta del proxy administrado. Los hosts de
    Ollama de la LAN, la tailnet, la red privada y la red pública siempre permanecen en la ruta del
    proxy administrado, y las redirecciones a otro host o puerto no heredan la confianza.
    `proxy.loopbackMode: "proxy"` dirige de todos modos el tráfico de bucle invertido a través del
    proxy; `proxy.loopbackMode: "block"` lo deniega antes de conectarse;
    consulte [Proxy administrado](/es/security/network-proxy#gateway-loopback-mode).

    | Propiedad | Valor |
    | --- | --- |
    | Modelo predeterminado | `nomic-embed-text` |
    | Descarga automática | Sí, si no está presente localmente |
    | Simultaneidad en línea predeterminada | 1 (otros proveedores tienen un valor predeterminado mayor; auméntelo con `nonBatchConcurrency` si el host puede soportarlo) |

    Los embeddings durante las consultas utilizan prefijos de recuperación para los modelos que los
    requieren o recomiendan: `nomic-embed-text`, `qwen3-embedding` y
    `mxbai-embed-large`. Los lotes de documentos permanecen sin modificar, por lo que los índices existentes
    no necesitan ninguna migración de formato.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Valor predeterminado para Ollama. Auméntelo en hosts más grandes si la reindexación es demasiado lenta.
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

  <Accordion title="Configuración de transmisión">
    Ollama utiliza de forma predeterminada la **API nativa** (`/api/chat`), que admite
    conjuntamente la transmisión y las llamadas a herramientas, sin necesidad de configuración especial.

    En las solicitudes nativas, el control del razonamiento se reenvía directamente: `/think off`
    y `openclaw agent --thinking off` envían `think: false` en el nivel superior, salvo que
    se configure explícitamente `params.think`/`params.thinking`; `/think
    low|medium|high` envía la cadena de esfuerzo correspondiente; `/think max` se asigna
    al nivel máximo de esfuerzo de Ollama, `think: "high"`.

    <Tip>
    Para utilizar en su lugar el endpoint compatible con OpenAI, consulte «Modo heredado compatible con OpenAI» más arriba; es posible que la transmisión y las llamadas a herramientas no funcionen conjuntamente en ese modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Bucle de fallos de WSL2 (reinicios repetidos)">
    En WSL2 con NVIDIA/CUDA, el instalador oficial de Ollama para Linux crea una
    unidad de systemd `ollama.service` con `Restart=always`. Si ese servicio
    se inicia automáticamente y carga un modelo respaldado por GPU durante el arranque de WSL2,
    Ollama puede retener memoria del host durante la carga; la recuperación de memoria de Hyper-V
    no siempre puede recuperar esas páginas, por lo que Windows puede finalizar la máquina virtual
    WSL2, systemd reinicia Ollama y el bucle se repite.

    Indicios: reinicios o finalizaciones repetidos de WSL2, uso elevado de CPU en `app.slice` o
    `ollama.service` justo después del inicio de WSL2 y SIGTERM procedente de systemd en lugar
    del eliminador OOM de Linux.

    OpenClaw registra una advertencia de inicio cuando detecta WSL2, `ollama.service`
    habilitado con `Restart=always` y marcadores CUDA visibles.

    Mitigación:

    ```bash
    sudo systemctl disable ollama
    ```

    En Windows, añada lo siguiente a `%USERPROFILE%\.wslconfig` y, después, ejecute
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    También se puede reducir el tiempo de actividad o iniciar Ollama manualmente solo cuando sea necesario:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consulte [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama no se detecta">
    Confirme que Ollama se está ejecutando, que `OLLAMA_API_KEY` (o un perfil de autenticación) está configurado
    y que `models.providers.ollama` **no** está definido explícitamente:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No hay modelos disponibles">
    Descargue el modelo localmente o defínalo explícitamente en
    `models.providers.ollama`:

    ```bash
    ollama list  # Consultar qué está instalado
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # O bien otro modelo
    ```

  </Accordion>

  <Accordion title="Conexión rechazada">
    ```bash
    # Comprobar si Ollama se está ejecutando
    ps aux | grep ollama

    # O bien reiniciar Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="El host remoto funciona con curl, pero no con OpenClaw">
    Verifíquelo desde la misma máquina y el mismo entorno de ejecución donde se ejecuta el Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Causas habituales:

    - `baseUrl` apunta a `localhost`, pero el Gateway se ejecuta en Docker o en otro host.
    - La URL utiliza `/v1`, lo que selecciona el comportamiento compatible con OpenAI en lugar del comportamiento nativo de Ollama.
    - El host remoto necesita cambios en el firewall o en el enlace de la LAN.
    - El modelo está en el daemon del portátil, pero no en el remoto.

  </Accordion>

  <Accordion title="El modelo genera el JSON de las herramientas como texto">
    Normalmente, el proveedor está en modo compatible con OpenAI o el modelo no puede
    procesar esquemas de herramientas. Se recomienda utilizar el modo nativo:

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

    Si un modelo local pequeño sigue fallando con los esquemas de herramientas, configure
    `compat.supportsTools: false` en la entrada de ese modelo y vuelva a probar.

  </Accordion>

  <Accordion title="Kimi o GLM devuelve símbolos ilegibles">
    Las respuestas alojadas de Kimi/GLM que consisten en secuencias largas de símbolos
    no lingüísticos se tratan como una llamada fallida al proveedor, en lugar de como
    una respuesta correcta, de modo que se aplica el tratamiento normal de reintentos,
    modelos alternativos y errores, en vez de guardar texto dañado en la sesión.

    Si vuelve a ocurrir, capture el nombre del modelo, el archivo de sesión actual y
    si la ejecución utilizó `Cloud + Local` o `Cloud only`; después, pruebe una sesión
    nueva y un modelo alternativo:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Responde exactamente: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="El modelo local sin precargar agota el tiempo de espera">
    Los modelos locales grandes pueden necesitar mucho tiempo para la primera carga. Limite el tiempo de espera
    al proveedor Ollama y, opcionalmente, mantenga el modelo cargado entre turnos:

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
    amplía el tiempo de espera protegido para conectarse a este proveedor.

  </Accordion>

  <Accordion title="El modelo de contexto amplio es demasiado lento o se queda sin memoria">
    Muchos modelos anuncian contextos mayores de lo que el hardware puede ejecutar
    cómodamente. Ollama nativo utiliza su propio valor predeterminado del entorno de ejecución, salvo que
    se configure `params.num_ctx`. Limite tanto el presupuesto de OpenClaw como el contexto
    de la solicitud de Ollama para obtener una latencia predecible hasta el primer token:

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
    `params.num_ctx` si el contexto del entorno de ejecución de Ollama es demasiado grande para la máquina.
    Reduzca `maxTokens` si la generación tarda demasiado.

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/es/providers/ollama-cloud" icon="cloud">
    Configuración exclusiva para la nube con el proveedor dedicado `ollama-cloud`.
  </Card>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Descripción general de todos los proveedores, las referencias de modelos y el comportamiento de conmutación por error.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Búsqueda web de Ollama" href="/es/tools/ollama-search" icon="magnifying-glass">
    Información completa sobre la configuración y el comportamiento de la búsqueda web basada en Ollama.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de la configuración.
  </Card>
</CardGroup>
