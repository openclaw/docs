---
read_when:
    - Quieres ejecutar OpenClaw con modelos en la nube o locales mediante Ollama
    - Necesita orientación para instalar y configurar Ollama
    - Se desean modelos de visión de Ollama para comprender imágenes
summary: Ejecutar OpenClaw con Ollama (modelos en la nube y locales)
title: Ollama
x-i18n:
    generated_at: "2026-07-22T10:45:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80ae833d006ce307406fac11fe3457809165035a38b7e0a970777baf126cc9cb
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw se comunica con la API nativa de Ollama (`/api/chat`), no con el endpoint
`/v1` compatible con OpenAI. Se admiten tres modos:

| Modo          | Qué utiliza                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| Nube + local | Un host de Ollama accesible que sirve modelos locales y, si se ha iniciado sesión, modelos `:cloud` |
| Solo nube    | `https://ollama.com` directamente, sin daemon local                                   |
| Solo local    | Un host de Ollama accesible, solo modelos locales                                       |

Para configurar únicamente la nube con el id de proveedor dedicado `ollama-cloud`, consulte
[Ollama Cloud](/es/providers/ollama-cloud). Utilice referencias `ollama-cloud/<model>` cuando
quiera mantener el enrutamiento en la nube separado de un proveedor local `ollama`.

<Warning>
No utilice la URL `/v1` compatible con OpenAI (`http://host:11434/v1`). Esto impide las llamadas a herramientas y los modelos pueden emitir el JSON sin procesar de las llamadas a herramientas como texto sin formato. Utilice la URL nativa: `baseUrl: "http://host:11434"` (sin `/v1`).
</Warning>

La clave de configuración canónica es `baseUrl`. También se acepta `baseURL` para
ejemplos con el estilo del SDK de OpenAI, pero las configuraciones nuevas deben utilizar `baseUrl`.

## Reglas de autenticación

<AccordionGroup>
  <Accordion title="Hosts locales y de LAN">
    Las URL de Ollama de bucle invertido, red privada, `.local` y nombre de host simple no necesitan un token de portador real. OpenClaw utiliza el marcador `ollama-local` para ellas.
  </Accordion>
  <Accordion title="Hosts remotos y de Ollama Cloud">
    Los hosts remotos públicos y `https://ollama.com` requieren una credencial real: `OLLAMA_API_KEY`, un perfil de autenticación o el `apiKey` del proveedor. Para el uso alojado directo, se recomienda el proveedor `ollama-cloud`.
  </Accordion>
  <Accordion title="Ids de proveedor personalizados">
    Un proveedor personalizado con `api: "ollama"` sigue las mismas reglas. Por ejemplo, un proveedor `ollama-remote` que apunte a un host de LAN privada puede utilizar `apiKey: "ollama-local"`; los subagentes resuelven ese marcador mediante el hook del proveedor de Ollama en lugar de tratarlo como una credencial ausente. `memory.search.provider` también puede apuntar a un id de proveedor personalizado para que las incrustaciones utilicen ese endpoint de Ollama.
  </Accordion>
  <Accordion title="Perfiles de autenticación">
    `auth-profiles.json` almacena la credencial de un id de proveedor; coloque la configuración del endpoint (`baseUrl`, `api`, modelos, encabezados y tiempos de espera) en `models.providers.<id>`. Los archivos planos antiguos, como `{ "ollama-windows": { "apiKey": "ollama-local" } }`, no son un formato de tiempo de ejecución; `openclaw doctor --fix` los reescribe como un perfil canónico de clave de API `ollama-windows:default` con una copia de seguridad. Un valor `baseUrl` en ese archivo heredado es irrelevante y debe trasladarse a la configuración del proveedor.
  </Accordion>
  <Accordion title="Ámbito de las incrustaciones de memoria">
    La autenticación de portador para las incrustaciones de memoria de Ollama se limita al host para el que se declaró:

    - Una clave del proveedor solo se envía al host de ese proveedor.
    - `memory.search.remote.apiKey` y las anulaciones por agente solo se envían a su host remoto de incrustaciones.
    - Un valor de entorno `OLLAMA_API_KEY` puro se trata como la convención de Ollama Cloud y, de forma predeterminada, no se envía a hosts locales o autoalojados.

  </Accordion>
</AccordionGroup>

## Primeros pasos

<Tabs>
  <Tab title="Incorporación (recomendado)">
    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard
        ```

        Seleccione **Ollama** y, a continuación, elija un modo: **Nube + local**, **Solo nube** o **Solo local**.

        En una configuración guiada nueva, OpenClaw comprueba primero el host
        de Ollama predeterminado o configurado. Solo se ofrece automáticamente
        un modelo instalado cuando `/api/show` confirma la compatibilidad
        con herramientas y una ventana de contexto de al menos 16K; si faltan
        los metadatos de contexto o indican un tamaño inferior, se mantiene la
        ruta de configuración manual. La secuencia compartida de configuración
        de la CLI/macOS también verifica la ruta seleccionada con una finalización
        real antes de guardarla. Esta comprobación automática nunca descarga un
        modelo; si no existe ningún modelo instalado adecuado, la incorporación
        continúa con el selector normal de Ollama.
      </Step>
      <Step title="Seleccionar un modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` y sugiere valores predeterminados alojados en la nube. `Cloud + Local` y `Local only` solicitan una URL base de Ollama, detectan los modelos disponibles y descargan automáticamente el modelo local seleccionado si falta. Una etiqueta `:latest` instalada, como `gemma4:latest`, se muestra una sola vez en lugar de duplicar `gemma4`. `Cloud + Local` también comprueba si se ha iniciado sesión en el host para acceder a la nube.
      </Step>
      <Step title="Verificar">
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
      <Step title="Instalar e iniciar Ollama">
        Obténgalo en [ollama.com/download](https://ollama.com/download) y, a continuación, descargue un modelo:

        ```bash
        ollama pull gemma4
        ```

        Para el acceso híbrido a la nube, ejecute `ollama signin` en el mismo host.
      </Step>
      <Step title="Establecer una credencial">
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

`Cloud + Local` enruta tanto los modelos locales como los modelos `:cloud` mediante un único host
de Ollama accesible; este es el flujo híbrido de Ollama y el modo que se debe elegir durante la configuración
cuando se necesitan ambos.

OpenClaw solicita la URL base, detecta los modelos locales y comprueba el
estado de `ollama signin`. Cuando se ha iniciado sesión, sugiere valores predeterminados alojados
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Si
no se ha iniciado sesión, la configuración permanece solo en modo local hasta que se ejecuta `ollama signin`.

Para acceder únicamente a la nube sin un daemon local, utilice `openclaw onboard --auth-choice ollama-cloud` y consulte [Ollama Cloud](/es/providers/ollama-cloud); esa ruta no necesita `ollama signin` ni un servidor en ejecución:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

La lista de modelos en la nube que se muestra durante `openclaw onboard` se obtiene en tiempo real de
`https://ollama.com/api/tags` y está limitada a 500 entradas, por lo que el selector refleja
el catálogo alojado actual. Si `ollama.com` no está disponible o no devuelve
modelos durante la configuración, OpenClaw recurre a su lista codificada de sugerencias para que
la incorporación pueda completarse.

## Detección de modelos (proveedor implícito)

Cuando se establece `OLLAMA_API_KEY` (o un perfil de autenticación) y no se ha definido
ni `models.providers.ollama` ni otro proveedor personalizado con `api: "ollama"`,
OpenClaw detecta los modelos de `http://127.0.0.1:11434`:

| Comportamiento       | Detalle                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta del catálogo | `/api/tags`                                                                                                                                                                                                                                                                                   |
| Detección de capacidades | La lectura de mejor esfuerzo de `/api/show` utiliza `contextWindow`, los parámetros de Modelfile `num_ctx` y las capacidades (visión/herramientas/razonamiento)                                                                                                                                                                       |
| Modelos de visión    | Una capacidad `vision` de `/api/show` marca el modelo como compatible con imágenes (`input: ["text", "image"]`)                                                                                                                                                                                             |
| Detección de razonamiento | Utiliza la capacidad `thinking` de `/api/show` cuando está disponible; si Ollama omite las capacidades, recurre a una heurística basada en el nombre (`r1`, `reason`, `reasoning`, `think`). `glm-5.2:cloud` y `deepseek-v4-flash\|pro:cloud` siempre se tratan como modelos de razonamiento, independientemente de las capacidades notificadas. |
| Límites de tokens    | `maxTokens` utiliza de forma predeterminada el límite máximo de tokens de Ollama de OpenClaw                                                                                                                                                                                                                                       |
| Costes               | Todos los costes son `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

Establecer `models.providers.ollama` con una matriz `models` explícita, o un
proveedor personalizado con `api: "ollama"` y un `baseUrl` que no sea de bucle invertido, desactiva
la detección automática; en ese caso, los modelos deben definirse manualmente (consulte
[Configuración](#configuration)). Una entrada `models.providers.ollama` que apunte al
`https://ollama.com` alojado también omite la detección, ya que los modelos de Ollama Cloud
los administra el proveedor. Los proveedores personalizados de bucle invertido, como
`http://127.0.0.2:11434`, se siguen considerando locales y conservan la detección automática.

Se puede utilizar una referencia completa, como `ollama/<pulled-model>:latest`, sin una
entrada `models.json` escrita manualmente; OpenClaw la resuelve en tiempo real. Para los hosts
con sesión iniciada, al seleccionar una referencia `ollama/<model>:cloud` que no aparece en la lista,
se valida ese modelo exacto con `/api/show` y se añade al catálogo de tiempo de ejecución solo si Ollama
confirma los metadatos; los errores tipográficos siguen produciendo un error de modelo desconocido.

### Pruebas de humo

Para una prueba de texto limitada que omite toda la superficie de herramientas del agente:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Añada `--file` con una imagen para realizar una prueba ligera de un modelo de visión (acepta PNG/JPEG/WebP;
los archivos que no son imágenes se rechazan antes de llamar a Ollama; utilice
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
mientras que las respuestas normales del agente fallan, probablemente el problema sea la capacidad
del modelo para usar herramientas o actuar como agente, no el endpoint.

Seleccionar un modelo con `/model ollama/<model>` es una elección exacta del usuario: si no se puede acceder al
`baseUrl` configurado, la siguiente respuesta falla con el error del proveedor
en lugar de recurrir silenciosamente a otro modelo configurado.

Los trabajos Cron aislados añaden una comprobación de seguridad local antes de iniciar el turno del agente:
si el modelo seleccionado se resuelve en un proveedor Ollama de red local/privada/`.local`
y no se puede acceder a `/api/tags`, OpenClaw registra esa ejecución como
`skipped` con el modelo en el texto del error. Esta comprobación del endpoint se almacena en caché durante
5 minutos por host, de modo que los trabajos Cron repetidos contra un daemon detenido no
inicien todos solicitudes que fallarán.

Verificación en vivo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para Ollama Cloud, dirija la misma prueba en vivo al endpoint alojado (omite
los embeddings de forma predeterminada; fuércelos con `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, ya que una
clave de la nube puede no autorizar `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para añadir un modelo, descárguelo y se descubrirá automáticamente:

```bash
ollama pull mistral
```

## Inferencia local del Node

Los agentes pueden delegar una tarea breve a un modelo de Ollama en un equipo de escritorio
o Node de servidor emparejado. El prompt y la respuesta atraviesan la conexión
autenticada existente entre el Gateway y el Node; la solicitud se ejecuta en el endpoint de bucle invertido
de Ollama del propio Node (`http://127.0.0.1:11434`).

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

    Apruebe el dispositivo y sus comandos del Node en el host del Gateway y, a continuación, verifique:

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
    El Plugin de Ollama incluido expone la herramienta `node_inference`. Los agentes llaman
    primero a `action: "discover"` y después a `action: "run"` con un Node y un modelo de
    ese resultado (`run` puede omitir el Node cuando hay exactamente un Node compatible
    conectado). Por ejemplo: «Descubre los modelos de Ollama en mis Nodes y después utiliza
    el modelo cargado más rápido para resumir este texto».
  </Step>
</Steps>

El descubrimiento lee `/api/tags`, comprueba las capacidades de `/api/show` y utiliza
`/api/ps` cuando está disponible para clasificar primero los modelos ya cargados. Solo devuelve
los modelos locales que Ollama indica como compatibles con chat (capacidad `completion`);
se excluyen las filas de Ollama Cloud y los modelos exclusivos para embeddings. Cada ejecución desactiva
el razonamiento del modelo y limita de forma predeterminada la salida a 512 tokens (límite estricto de 8192), salvo que la
llamada a la herramienta solicite un `maxTokens` diferente; algunos modelos (por ejemplo, GPT-OSS)
no permiten desactivar el razonamiento y aún pueden emitir tokens de razonamiento.

Para mantener Ollama en ejecución en un Node sin exponerlo a los agentes:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Reinicie el Node (`openclaw node restart`, o detenga y vuelva a ejecutar `openclaw node run`
para una sesión en primer plano). El Node deja de anunciar `ollama.models` y
`ollama.chat`; Ollama y el proveedor de Ollama del Gateway no se ven afectados.
Vuelva a establecer el valor en `true` y reinicie para volver a habilitarlo; una superficie de comandos
modificada puede requerir de nuevo la aprobación de `openclaw nodes pending` después de volver a conectarse.

Verifique directamente los comandos del Node, sin un turno del agente:

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

`--invoke-timeout` limita el tiempo que tiene el Node para ejecutar el comando;
`--timeout` limita la llamada general del Gateway y debe ser mayor.

La inferencia local del Node siempre utiliza el endpoint de bucle invertido del propio Node; no
reutiliza un `models.providers.ollama.baseUrl` remoto o en la nube configurado. Los
comandos del Node están disponibles de forma predeterminada en hosts de Node macOS, Linux y Windows
y siguen sujetos a la política normal de emparejamiento y comandos del Node.

## Visión y descripción de imágenes

El Plugin de Ollama incluido registra Ollama como proveedor de
comprensión multimedia compatible con imágenes, por lo que OpenClaw puede dirigir las solicitudes explícitas
de descripción de imágenes y los valores predeterminados configurados del modelo de imágenes a través de modelos de visión
de Ollama locales o alojados.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` debe ser una referencia `<provider/model>` completa; cuando se establece, `infer image
describe` prueba primero ese modelo en lugar de omitir la descripción para los modelos
que ya admiten visión nativa. Si la llamada falla, OpenClaw puede continuar
mediante `agents.defaults.imageModel.fallbacks`; los errores de preparación de archivos/URL
fallan antes de que se intente la alternativa. Utilice `infer image describe` para el
flujo de comprensión de imágenes de OpenClaw y el `imageModel` configurado; utilice `infer model run
--file` para una prueba multimodal directa con un prompt personalizado.

Para convertir Ollama en el proveedor predeterminado de comprensión de imágenes para los medios entrantes:

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

Prefiera la referencia `ollama/<model>` completa. Una referencia `imageModel` simple, como
`qwen2.5vl:7b`, se normaliza a `ollama/qwen2.5vl:7b` solo cuando ese modelo exacto
aparece en `models.providers.ollama.models` con
`input: ["text", "image"]` y ningún otro proveedor de imágenes configurado expone el
mismo identificador simple; de lo contrario, utilice explícitamente el prefijo del proveedor.

Los modelos de visión locales lentos pueden necesitar un tiempo de espera de comprensión de imágenes mayor que
los modelos en la nube y pueden bloquearse en hardware con recursos limitados si Ollama intenta
asignar todo el contexto de visión anunciado del modelo. Establezca un tiempo de espera de
capacidad y limite `num_ctx`:

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
protección de la solicitud HTTP subyacente de Ollama para las llamadas normales al modelo.

Verificación en vivo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Si define `models.providers.ollama.models` manualmente, marque los modelos de visión
de forma explícita:

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
como compatibles con imágenes. Con el descubrimiento implícito, esto procede de la capacidad de visión
de `/api/show`.

## Configuración

<Tabs>
  <Tab title="Básica (descubrimiento implícito)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si se establece `OLLAMA_API_KEY`, puede omitir `apiKey` en la entrada del proveedor; OpenClaw lo completa para las comprobaciones de disponibilidad.
    </Tip>

  </Tab>

  <Tab title="Explícita (modelos manuales)">
    Utilice una configuración explícita para una instalación alojada en la nube, un host/puerto no predeterminado, ventanas
    de contexto forzadas o listas de modelos completamente manuales:

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
    La configuración explícita desactiva el descubrimiento automático, por lo que se deben enumerar los modelos:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Sin /v1: URL de la API nativa de Ollama
            api: "ollama", // Explícito: garantiza el comportamiento nativo de llamadas a herramientas
            timeoutSeconds: 300, // Opcional: mayor margen de conexión/transmisión para modelos locales en frío
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Opcional: mantiene el modelo cargado entre turnos
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    No añada `/v1`. Esa ruta selecciona el modo compatible con OpenAI, en el que las llamadas a herramientas no son fiables.
    </Warning>

  </Tab>
</Tabs>

## Recetas comunes

Sustituya los identificadores de modelo por los nombres exactos de `ollama list` o
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

    `contextWindow` es el presupuesto de contexto de OpenClaw; `params.num_ctx` se envía a
    Ollama. Manténgalos alineados cuando el hardware no pueda ejecutar todo el
    contexto anunciado del modelo.

  </Accordion>

  <Accordion title="Solo Ollama Cloud">
    Sin daemon local, modelos alojados directamente:

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
    Use identificadores de proveedor personalizados cuando ejecute más de un servidor Ollama; cada uno tendrá su
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
    `ollama/` sin calificador) antes de llamar a Ollama, por lo que `ollama-large/qwen3.5:27b`
    llega a Ollama como `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Perfil ligero de modelo local">
    Algunos modelos locales pueden procesar instrucciones sencillas, pero tienen dificultades con toda la
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

    Use `compat.supportsTools: false` solo cuando el modelo o el servidor falle de manera
    fiable con los esquemas de herramientas, ya que sacrifica capacidad del agente a cambio de estabilidad.
    `localModelLean` elimina de la superficie directa del agente las herramientas pesadas
    de navegador, cron, mensajería, generación multimedia, voz y PDF, salvo que se requieran explícitamente,
    y coloca los catálogos más grandes detrás de Tool Search. No cambia el
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

Los identificadores de proveedor personalizados funcionan de la misma manera: para una referencia que use el prefijo
del proveedor activo, como `ollama-spark/qwen3:32b`, OpenClaw elimina ese prefijo antes de
llamar a Ollama y envía `qwen3:32b`.

Para modelos locales lentos, es preferible ajustar la configuración específica del proveedor antes de aumentar el tiempo de espera
de todo el entorno de ejecución del agente:

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
reenvía como `keep_alive` de nivel superior en las solicitudes nativas `/api/chat`; configúrelo para cada
modelo cuando el tiempo de carga del primer turno sea el cuello de botella.

### Verificación rápida

```bash
# Daemon de Ollama visible para esta máquina
curl http://127.0.0.1:11434/api/tags

# Catálogo de OpenClaw y modelo seleccionado
openclaw models list --provider ollama
openclaw models status

# Prueba rápida directa del modelo
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Responde exactamente: ok"
```

Para hosts remotos, sustituya `127.0.0.1` por el host `baseUrl`. Si `curl`
funciona, pero OpenClaw no, compruebe si el Gateway se ejecuta en otra
máquina, contenedor o cuenta de servicio.

## Búsqueda web de Ollama

OpenClaw incluye **Ollama Web Search** como proveedor `web_search`.

| Propiedad   | Detalle                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | `models.providers.ollama.baseUrl` cuando se configura; de lo contrario, `http://127.0.0.1:11434`; `https://ollama.com` usa directamente la API alojada                          |
| Autenticación | Sin clave para un host local con sesión iniciada; `OLLAMA_API_KEY` o la autenticación configurada del proveedor para la búsqueda directa de `https://ollama.com` o hosts protegidos mediante autenticación           |
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

Para realizar búsquedas alojadas directamente mediante Ollama Cloud:

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
a `https://ollama.com` siempre usan el endpoint alojado `/api/web_search`.

<Note>
Para consultar la configuración y el comportamiento completos, consulte [Búsqueda web de Ollama](/es/tools/ollama-search).
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo heredado compatible con OpenAI">
    <Warning>
    **Las llamadas a herramientas no son fiables en este modo.** Úselo solo cuando un proxy necesite el formato de OpenAI y no dependa de las llamadas nativas a herramientas.
    </Warning>

    Configure `api: "openai-completions"` explícitamente para un proxy detrás de
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

    Es posible que este modo no admita simultáneamente la transmisión y las llamadas a herramientas; puede
    necesitar `params: { streaming: false }` en el modelo.

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
    incluidos los valores `PARAMETER num_ctx` más grandes de Modelfiles
    personalizados; de lo contrario, recurre a la ventana de contexto predeterminada de Ollama en
    OpenClaw.

    Los valores `contextWindow`, `contextTokens` y `maxTokens` del proveedor establecen
    los valores predeterminados de todos los modelos de dicho proveedor y pueden sobrescribirse para cada
    modelo. `contextWindow` es el presupuesto propio de OpenClaw para instrucciones y Compaction. Las solicitudes nativas
    `/api/chat` dejan `options.num_ctx` sin configurar, salvo que se establezca
    `params.num_ctx` explícitamente, por lo que Ollama aplica el valor predeterminado de su propio modelo,
    `OLLAMA_CONTEXT_LENGTH` o basado en VRAM; se ignoran los valores `params.num_ctx`
    no válidos, cero, negativos o no finitos. Si una configuración anterior usaba
    únicamente `contextWindow`/`maxTokens` para forzar el contexto de las solicitudes nativas, ejecute
    `openclaw doctor --fix` para copiarlos en `params.num_ctx`. El
    adaptador compatible con OpenAI aún inyecta `options.num_ctx` de forma predeterminada a partir
    de los valores configurados `params.num_ctx` o `contextWindow`; desactívelo con
    `injectNumCtxForOpenAICompat: false` si el servicio ascendente rechaza `options`.

    Las entradas de modelos nativos también aceptan opciones habituales del entorno de ejecución de Ollama en
    `params`, que se reenvían como `/api/chat` `options` nativos: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` y `num_thread`.
    Algunas claves (`format`, `keep_alive`, `truncate`, `shift`) se reenvían como
    campos de solicitud de nivel superior en lugar de anidarse en `options`. OpenClaw solo
    reenvía estas claves de solicitud de Ollama, por lo que los parámetros exclusivos del entorno de ejecución, como
    `streaming`, nunca se envían a Ollama. Use `params.think` (o
    `params.thinking`) para configurar el valor de nivel superior `think`; `false` desactiva el
    razonamiento en el nivel de la API para modelos de razonamiento al estilo Qwen.

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
    funciona; la entrada explícita del modelo del proveedor prevalece si se configuran ambas.

  </Accordion>

  <Accordion title="Control del razonamiento">
    OpenClaw reenvía el razonamiento como lo espera Ollama: `think` en el nivel superior, no
    `options.think`. Los modelos detectados automáticamente cuyo `/api/show` informa de una
    capacidad `thinking` exponen `/think low`, `/think medium`, `/think high`
    y `/think max`; los modelos sin razonamiento solo exponen `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    O bien, establezca un valor predeterminado para el modelo:

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
    razonamiento de la API para un modelo específico. OpenClaw conserva esa configuración explícita
    cuando la ejecución activa solo tiene el valor predeterminado implícito `off`; un comando
    de ejecución que no sea de desactivación, como `/think medium`, sigue prevaleciendo sobre ella. Nunca
    se envía una solicitud de razonamiento verdadera a un modelo marcado explícitamente
    como `reasoning: false`; una solicitud `think: false` se envía siempre.

  </Accordion>

  <Accordion title="Modelos de razonamiento">
    Los modelos denominados `deepseek-r1`, `reasoning`, `reason` o `think` se consideran
    capaces de razonar de forma predeterminada, sin necesidad de configuración adicional:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Costes de los modelos">
    Ollama se ejecuta localmente y es gratuito, por lo que todos los costes de los modelos son `0`, tanto para
    los modelos detectados automáticamente como para los definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memoria">
    El plugin de Ollama incluido registra un proveedor de embeddings de memoria para la
    [búsqueda en memoria](/es/concepts/memory). Utiliza la URL base y la clave de API
    configuradas para Ollama, llama a `/api/embed` y agrupa varios fragmentos de memoria
    en una sola solicitud `input` cuando es posible.

    Cuando `proxy.enabled=true`, las solicitudes de embeddings al origen de bucle invertido
    local del host exacto derivado del `baseUrl` configurado utilizan la ruta directa
    protegida de OpenClaw en lugar del proxy de reenvío administrado. El nombre de host configurado
    debe ser `localhost` o un literal de IP de bucle invertido; los nombres DNS
    que solo se resuelven como bucle invertido siguen utilizando la ruta del proxy administrado. Los hosts
    de Ollama de la LAN, la red de Tailscale, redes privadas y redes públicas siempre permanecen en la
    ruta del proxy administrado, y las redirecciones a otro host/puerto no heredan
    la confianza. `proxy.loopbackMode: "proxy"` enruta de todos modos el tráfico de bucle invertido a través del
    proxy; `proxy.loopbackMode: "block"` lo rechaza antes de conectarse;
    consulte [Proxy administrado](/es/security/network-proxy#gateway-loopback-mode).

    | Propiedad | Valor |
    | --- | --- |
    | Modelo predeterminado | `nomic-embed-text` |
    | Descarga automática | Sí, si no está presente localmente |
    | Concurrencia en línea predeterminada | 1 (otros proveedores tienen un valor predeterminado mayor; auméntelo con `nonBatchConcurrency` si el host puede soportarlo) |

    Los embeddings en tiempo de consulta utilizan prefijos de recuperación para los modelos que los requieren o
    recomiendan: `nomic-embed-text`, `qwen3-embedding` y
    `mxbai-embed-large`. Los lotes de documentos permanecen sin procesar, por lo que los índices existentes no necesitan
    migración de formato.

    ```json5
    {
      memory: {
        search: {
          provider: "ollama",
          remote: {
            // Valor predeterminado para Ollama. Auméntelo en hosts más grandes si la reindexación es demasiado lenta.
            nonBatchConcurrency: 1,
          },
        },
      },
    }
    ```

    Para un host remoto de embeddings, mantenga la autenticación limitada a ese host:

    ```json5
    {
      memory: {
        search: {
          provider: "ollama",
          model: "nomic-embed-text",
          remote: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            nonBatchConcurrency: 2,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuración de transmisión">
    Ollama utiliza de forma predeterminada la **API nativa** (`/api/chat`), que admite
    simultáneamente la transmisión y las llamadas a herramientas, sin necesidad de configuración especial.

    Para las solicitudes nativas, el control del razonamiento se reenvía directamente: `/think off`
    y `openclaw agent --thinking off` envían `think: false` en el nivel superior, salvo que
    se configure un `params.think`/`params.thinking` explícito; `/think
    low|medium|high` envía la cadena de esfuerzo correspondiente; `/think max` se asigna
    al esfuerzo máximo de Ollama, `think: "high"`.

    <Tip>
    Para usar en su lugar el endpoint compatible con OpenAI, consulte «Modo heredado compatible con OpenAI» más arriba; es posible que allí la transmisión y las llamadas a herramientas no funcionen juntas.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Bucle de fallos de WSL2 (reinicios repetidos)">
    En WSL2 con NVIDIA/CUDA, el instalador oficial de Ollama para Linux crea una
    unidad systemd `ollama.service` con `Restart=always`. Si ese servicio
    se inicia automáticamente y carga un modelo respaldado por GPU durante el arranque de WSL2, Ollama puede fijar
    memoria del host durante la carga; la recuperación de memoria de Hyper-V no siempre puede recuperar
    esas páginas, por lo que Windows puede finalizar la máquina virtual de WSL2, systemd reinicia
    Ollama y el bucle se repite.

    Evidencia: reinicios/finalizaciones repetidos de WSL2, uso elevado de CPU en `app.slice` o
    `ollama.service` inmediatamente después del inicio de WSL2 y SIGTERM de systemd en lugar
    del eliminador por falta de memoria de Linux.

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

    O reduzca el tiempo de mantenimiento activo/inicie Ollama manualmente solo cuando sea necesario:

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
    ollama list  # Consulte qué está instalado
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # O bien, otro modelo
    ```

  </Accordion>

  <Accordion title="Conexión rechazada">
    ```bash
    # Compruebe si Ollama se está ejecutando
    ps aux | grep ollama

    # O reinicie Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="El host remoto funciona con curl, pero no con OpenClaw">
    Compruébelo desde la misma máquina y el mismo entorno de ejecución donde se ejecuta el Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Causas habituales:

    - `baseUrl` apunta a `localhost`, pero el Gateway se ejecuta en Docker o en otro host.
    - La URL utiliza `/v1`, lo que selecciona el comportamiento compatible con OpenAI en lugar del comportamiento nativo de Ollama.
    - El host remoto necesita cambios en el cortafuegos o en el enlace de la LAN.
    - El modelo está en el daemon del portátil, pero no en el remoto.

  </Accordion>

  <Accordion title="El modelo genera el JSON de la herramienta como texto">
    Normalmente, el proveedor está en modo compatible con OpenAI o el modelo no puede
    gestionar esquemas de herramientas. Se recomienda el modo nativo:

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
    Las respuestas alojadas de Kimi/GLM que consisten en secuencias largas de símbolos no lingüísticos se
    tratan como una llamada fallida al proveedor, no como una respuesta correcta, por lo que
    se aplican los mecanismos normales de reintento, alternativa y gestión de errores en lugar de conservar
    el texto dañado en la sesión.

    Si vuelve a ocurrir, recopile el nombre del modelo, el archivo de sesión actual y
    si la ejecución utilizó `Cloud + Local` o `Cloud only`; después, pruebe con una sesión
    nueva y un modelo alternativo:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="El modelo local en frío agota el tiempo de espera">
    Los modelos locales grandes pueden necesitar mucho tiempo para la primera carga. Limite el tiempo de espera al
    proveedor Ollama y, opcionalmente, mantenga el modelo cargado entre turnos:

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
    amplía el tiempo de espera de conexión protegido para este proveedor.

  </Accordion>

  <Accordion title="El modelo de contexto amplio es demasiado lento o se queda sin memoria">
    Muchos modelos anuncian contextos mayores de los que el hardware puede ejecutar
    con comodidad. Ollama nativo utiliza su propio valor predeterminado del entorno de ejecución, salvo que
    se configure `params.num_ctx`. Limite tanto el presupuesto de OpenClaw como el contexto de solicitud
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
    `params.num_ctx` si el contexto del entorno de ejecución de Ollama es demasiado grande para la máquina.
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
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Descripción general de todos los proveedores, las referencias de modelos y el comportamiento de conmutación por error.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Búsqueda web de Ollama" href="/es/tools/ollama-search" icon="magnifying-glass">
    Detalles completos sobre la configuración y el comportamiento de la búsqueda web con tecnología de Ollama.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
