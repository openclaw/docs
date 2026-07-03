---
read_when:
    - Quieres ejecutar OpenClaw con modelos en la nube o locales mediante Ollama
    - Necesitas orientación sobre la instalación y configuración de Ollama
    - Quieres modelos de visión de Ollama para comprender imágenes
summary: Ejecutar OpenClaw con Ollama (modelos en la nube y locales)
title: Ollama
x-i18n:
    generated_at: "2026-07-03T09:23:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d91871ef96c3bdc027fe7cfceecae7e1d050913d859e3c6840725002fdf57af
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw se integra con la API nativa de Ollama (`/api/chat`) para modelos alojados en la nube y servidores Ollama locales/autohospedados. Puedes usar Ollama en tres modos: `Cloud + Local` mediante un host de Ollama accesible, `Cloud only` contra `https://ollama.com`, o `Local only` contra un host de Ollama accesible.

OpenClaw también registra `ollama-cloud` como id de proveedor alojado de primera clase para
el uso directo de Ollama Cloud. Usa referencias como `ollama-cloud/kimi-k2.5:cloud` cuando
quieras enrutamiento solo en la nube sin compartir el id del proveedor local `ollama`.

Para la página dedicada de configuración solo en la nube, consulta [Ollama Cloud](/es/providers/ollama-cloud).

<Warning>
**Usuarios de Ollama remoto**: No uses la URL compatible con OpenAI `/v1` (`http://host:11434/v1`) con OpenClaw. Esto rompe las llamadas a herramientas y los modelos pueden generar JSON de herramientas sin procesar como texto plano. Usa en su lugar la URL de la API nativa de Ollama: `baseUrl: "http://host:11434"` (sin `/v1`).
</Warning>

La configuración del proveedor de Ollama usa `baseUrl` como clave canónica. OpenClaw también acepta `baseURL` por compatibilidad con ejemplos de estilo SDK de OpenAI, pero la configuración nueva debería preferir `baseUrl`.

## Reglas de autenticación

<AccordionGroup>
  <Accordion title="Hosts locales y LAN">
    Los hosts Ollama locales y de LAN no necesitan un token portador real. OpenClaw usa el marcador local `ollama-local` solo para URLs base de Ollama de loopback, red privada, `.local` y nombres de host sin dominio.
  </Accordion>
  <Accordion title="Hosts remotos y Ollama Cloud">
    Los hosts públicos remotos y Ollama Cloud (`https://ollama.com`) requieren una credencial real mediante `OLLAMA_API_KEY`, un perfil de autenticación o el `apiKey` del proveedor. Para uso alojado directo, prefiere el proveedor `ollama-cloud`.
  </Accordion>
  <Accordion title="Ids de proveedor personalizados">
    Los ids de proveedor personalizados que establecen `api: "ollama"` siguen las mismas reglas. Por ejemplo, un proveedor `ollama-remote` que apunta a un host Ollama en una LAN privada puede usar `apiKey: "ollama-local"` y los subagentes resolverán ese marcador mediante el hook del proveedor de Ollama en lugar de tratarlo como una credencial faltante. La búsqueda de memoria también puede establecer `agents.defaults.memorySearch.provider` en ese id de proveedor personalizado para que los embeddings usen el endpoint de Ollama correspondiente.
  </Accordion>
  <Accordion title="Perfiles de autenticación">
    `auth-profiles.json` almacena la credencial para un id de proveedor. Coloca la configuración de endpoint (`baseUrl`, `api`, ids de modelo, encabezados, tiempos de espera) en `models.providers.<id>`. Los archivos antiguos de perfil de autenticación planos, como `{ "ollama-windows": { "apiKey": "ollama-local" } }`, no son un formato de runtime; ejecuta `openclaw doctor --fix` para reescribirlos al perfil de clave API canónico `ollama-windows:default` con una copia de seguridad. `baseUrl` en ese archivo es ruido de compatibilidad y debería moverse a la configuración del proveedor.
  </Accordion>
  <Accordion title="Alcance de embeddings de memoria">
    Cuando Ollama se usa para embeddings de memoria, la autenticación de portador queda limitada al host donde se declaró:

    - Una clave a nivel de proveedor se envía solo al host Ollama de ese proveedor.
    - `agents.*.memorySearch.remote.apiKey` se envía solo a su host remoto de embeddings.
    - Un valor de entorno `OLLAMA_API_KEY` puro se trata como la convención de Ollama Cloud, y no se envía de forma predeterminada a hosts locales o autohospedados.

  </Accordion>
</AccordionGroup>

## Primeros pasos

Elige tu método de configuración y modo preferidos.

<Tabs>
  <Tab title="Incorporación (recomendado)">
    **Ideal para:** la ruta más rápida hacia una configuración funcional de Ollama en la nube o local.

    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard
        ```

        Selecciona **Ollama** en la lista de proveedores.
      </Step>
      <Step title="Elegir tu modo">
        - **Nube + local** — host Ollama local más modelos en la nube enrutados a través de ese host
        - **Solo nube** — modelos Ollama alojados mediante `https://ollama.com`
        - **Solo local** — solo modelos locales

      </Step>
      <Step title="Seleccionar un modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` y sugiere valores predeterminados alojados en la nube. `Cloud + Local` y `Local only` piden una URL base de Ollama, descubren los modelos disponibles y descargan automáticamente el modelo local seleccionado si todavía no está disponible. Cuando Ollama informa una etiqueta `:latest` instalada, como `gemma4:latest`, la configuración muestra ese modelo instalado una sola vez en lugar de mostrar tanto `gemma4` como `gemma4:latest` o volver a descargar el alias sin etiqueta. `Cloud + Local` también comprueba si ese host de Ollama tiene sesión iniciada para acceso a la nube.
      </Step>
      <Step title="Verificar que el modelo esté disponible">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Modo no interactivo

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Opcionalmente, especifica una URL base o un modelo personalizados:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configuración manual">
    **Ideal para:** control total sobre la configuración en la nube o local.

    <Steps>
      <Step title="Elegir nube o local">
        - **Nube + local**: instala Ollama, inicia sesión con `ollama signin` y enruta las solicitudes en la nube a través de ese host
        - **Solo nube**: usa `https://ollama.com` con una `OLLAMA_API_KEY`
        - **Solo local**: instala Ollama desde [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Descargar un modelo local (solo local)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Habilitar Ollama para OpenClaw">
        Para `Cloud only`, usa tu `OLLAMA_API_KEY` real. Para configuraciones respaldadas por host, cualquier valor de marcador de posición funciona:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspeccionar y establecer tu modelo">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        O establece el valor predeterminado en la configuración:

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

## Modelos en la nube

<Tabs>
  <Tab title="Nube + local">
    `Cloud + Local` usa un host Ollama accesible como punto de control tanto para modelos locales como en la nube. Este es el flujo híbrido preferido de Ollama.

    Usa **Nube + local** durante la configuración. OpenClaw solicita la URL base de Ollama, descubre modelos locales desde ese host y comprueba si el host tiene sesión iniciada para acceso a la nube con `ollama signin`. Cuando el host tiene sesión iniciada, OpenClaw también sugiere valores predeterminados alojados en la nube, como `kimi-k2.5:cloud`, `minimax-m2.7:cloud` y `glm-5.1:cloud`.

    Si el host todavía no tiene sesión iniciada, OpenClaw mantiene la configuración como solo local hasta que ejecutes `ollama signin`.

  </Tab>

  <Tab title="Solo nube">
    `Cloud only` se ejecuta contra la API alojada de Ollama en `https://ollama.com`.

    Usa **Solo nube** durante la configuración. OpenClaw solicita `OLLAMA_API_KEY`, establece `baseUrl: "https://ollama.com"` y precarga la lista de modelos alojados en la nube. Esta ruta **no** requiere un servidor Ollama local ni `ollama signin`.

    La lista de modelos en la nube mostrada durante `openclaw onboard` se rellena en vivo desde `https://ollama.com/api/tags`, con un límite de 500 entradas, por lo que el selector refleja el catálogo alojado actual en lugar de una semilla estática. Si `ollama.com` no es accesible o no devuelve modelos durante la configuración, OpenClaw recurre a las sugerencias codificadas anteriores para que la incorporación siga completándose.

    También puedes configurar directamente el proveedor de nube de primera clase:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Solo local">
    En modo solo local, OpenClaw descubre modelos desde la instancia de Ollama configurada. Esta ruta es para servidores Ollama locales o autohospedados.

    OpenClaw actualmente sugiere `gemma4` como valor predeterminado local.

  </Tab>
</Tabs>

## Descubrimiento de modelos (proveedor implícito)

Cuando estableces `OLLAMA_API_KEY` (o un perfil de autenticación) y **no** defines `models.providers.ollama` ni otro proveedor remoto personalizado con `api: "ollama"`, OpenClaw descubre modelos desde la instancia local de Ollama en `http://127.0.0.1:11434`.

| Comportamiento       | Detalle                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta de catálogo | Consulta `/api/tags`                                                                                                                                                |
| Detección de capacidades | Usa búsquedas `/api/show` de mejor esfuerzo para leer `contextWindow`, parámetros Modelfile `num_ctx` expandidos y capacidades, incluida visión/herramientas      |
| Modelos de visión    | Los modelos con una capacidad `vision` informada por `/api/show` se marcan como compatibles con imágenes (`input: ["text", "image"]`), por lo que OpenClaw inyecta imágenes automáticamente en el prompt |
| Detección de razonamiento | Usa capacidades de `/api/show` cuando están disponibles, incluido `thinking`; recurre a una heurística de nombre de modelo (`r1`, `reasoning`, `think`) cuando Ollama omite capacidades |
| Límites de tokens    | Establece `maxTokens` en el límite máximo predeterminado de tokens de Ollama usado por OpenClaw                                                                      |
| Costos               | Establece todos los costos en `0`                                                                                                                                   |

Esto evita entradas manuales de modelos mientras mantiene el catálogo alineado con la instancia local de Ollama. Puedes usar una referencia completa como `ollama/<pulled-model>:latest` en `infer model run` local; OpenClaw resuelve ese modelo instalado desde el catálogo en vivo de Ollama sin requerir una entrada `models.json` escrita a mano.

Para hosts Ollama con sesión iniciada, algunos modelos `:cloud` pueden ser utilizables mediante `/api/chat`
y `/api/show` antes de que aparezcan en `/api/tags`. Cuando seleccionas explícitamente una
referencia completa `ollama/<model>:cloud`, OpenClaw valida ese modelo exacto faltante con
`/api/show` y lo agrega al catálogo de runtime solo si Ollama confirma los metadatos del
modelo. Los errores tipográficos siguen fallando como modelos desconocidos en lugar de crearse automáticamente.

```bash
# See what models are available
ollama list
openclaw models list
```

Para una prueba rápida acotada de generación de texto que evita toda la superficie de herramientas del agente,
usa `infer model run` local con una referencia completa de modelo Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Esa ruta sigue usando el proveedor, la autenticación y el transporte nativo de Ollama
configurados en OpenClaw, pero no inicia un turno de agente de chat ni carga contexto de MCP/herramientas. Si
esto funciona mientras las respuestas normales del agente fallan, diagnostica después la capacidad del modelo
para el prompt/herramientas del agente.

Para una prueba rápida acotada de modelo de visión en la misma ruta ligera, agrega uno o más
archivos de imagen a `infer model run`. Esto envía el prompt y la imagen directamente al
modelo de visión de Ollama seleccionado sin cargar herramientas de chat, memoria ni contexto de
sesión anterior:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` acepta archivos detectados como `image/*`, incluidas entradas comunes PNG,
JPEG y WebP. Los archivos que no son imágenes se rechazan antes de llamar a Ollama.
Para reconocimiento de voz, usa `openclaw infer audio transcribe` en su lugar.

Cuando cambias una conversación con `/model ollama/<model>`, OpenClaw trata
eso como una selección exacta del usuario. Si el `baseUrl` de Ollama configurado
no es alcanzable, la siguiente respuesta falla con el error del proveedor en lugar de
responder silenciosamente desde otro modelo de reserva configurado.

Los trabajos Cron aislados hacen una comprobación local de seguridad adicional antes de iniciar el turno del agente.
Si el modelo seleccionado se resuelve a un proveedor Ollama local, de red privada o `.local`
y `/api/tags` no es alcanzable, OpenClaw registra esa ejecución de Cron
como `skipped` con el `ollama/<model>` seleccionado en el texto del error. La comprobación previa del endpoint
se almacena en caché durante 5 minutos, por lo que varios trabajos Cron apuntados al mismo
daemon de Ollama detenido no lanzan todos solicitudes de modelo fallidas.

Verifica en vivo la ruta de texto local, la ruta de streaming nativa y los embeddings contra
Ollama local con:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para pruebas smoke con clave de API de Ollama Cloud, apunta la prueba en vivo a `https://ollama.com`
y elige un modelo alojado del catálogo actual:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

La prueba smoke en la nube ejecuta texto, streaming nativo y búsqueda web. Omite embeddings de forma
predeterminada para `https://ollama.com` porque las claves de API de Ollama Cloud podrían no autorizar
`/api/embed`. Establece `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` cuando quieras explícitamente
que la prueba en vivo falle si la clave de nube configurada no puede usar el endpoint de embedding.

Para agregar un modelo nuevo, simplemente descárgalo con Ollama:

```bash
ollama pull mistral
```

El nuevo modelo se detectará automáticamente y estará disponible para usarse.

<Note>
Si estableces `models.providers.ollama` explícitamente, o configuras un proveedor remoto personalizado como `models.providers.ollama-cloud` con `api: "ollama"`, se omite la detección automática y debes definir los modelos manualmente. Los proveedores personalizados de loopback como `http://127.0.0.2:11434` siguen tratándose como locales. Consulta la sección de configuración explícita a continuación.
</Note>

## Inferencia local en Node

Los agentes pueden delegar una tarea corta a un modelo de Ollama instalado en un nodo
de escritorio o servidor emparejado. El prompt y la respuesta cruzan la conexión autenticada
existente Gateway/nodo; la solicitud de modelo se ejecuta en el nodo seleccionado contra
su endpoint estándar de Ollama en local loopback (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Start Ollama on the node">
    Descarga al menos un modelo de chat y mantén Ollama en ejecución:

    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```

  </Step>
  <Step title="Connect the node host">
    En la misma máquina que Ollama, conecta un host de nodo al Gateway:

    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Aprueba el nuevo dispositivo y sus comandos de nodo declarados en el host del Gateway,
    luego verifica el nodo:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Una primera conexión y una actualización que agrega los comandos de Ollama pueden
    activar la aprobación de comandos de nodo. Si el nodo se conecta sin anunciar
    `ollama.models` y `ollama.chat`, revisa `openclaw nodes pending` de nuevo.

  </Step>
  <Step title="Ask an agent to use local inference">
    El Plugin de Ollama incluido expone la herramienta `node_inference`. Los agentes primero
    usan `action: "discover"`, luego `action: "run"` con un nodo y
    modelo devueltos. Si hay exactamente un nodo capaz conectado, `run` puede omitir el nodo.

    Por ejemplo: “Descubre los modelos de Ollama en mis nodos y luego usa el modelo cargado
    más rápido para resumir este texto.”

  </Step>
</Steps>

El descubrimiento lee `/api/tags`, comprueba las capacidades de `/api/show` y usa `/api/ps`
cuando está disponible para priorizar los modelos ya cargados. Devuelve solo modelos
locales con capacidad de chat: se excluyen las filas de Ollama Cloud y los modelos solo de embedding.
Cada ejecución pide a Ollama desactivar el pensamiento del modelo y limita la salida a 512 tokens
a menos que la llamada de herramienta solicite un valor `maxTokens` diferente. Algunos modelos, como
GPT-OSS, no admiten desactivar el pensamiento y aun así pueden usar tokens de razonamiento.

Para mantener Ollama en ejecución en un nodo sin ponerlo a disposición de los agentes, establece lo
siguiente en la configuración usada por ese host de nodo:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Si el nodo usa el comando en primer plano `openclaw node run` de la configuración
anterior, detén ese proceso y vuelve a ejecutar el comando. Si usa un servicio de nodo
instalado, ejecuta `openclaw node restart`.

El nodo deja de anunciar `ollama.models` y `ollama.chat`; Ollama en sí y
el proveedor Ollama del Gateway permanecen sin cambios. Establece el valor en `true` y
reinicia el nodo para volver a anunciar la inferencia local. Una superficie de comandos modificada
puede requerir aprobación mediante `openclaw nodes pending` después de reconectar.

Puedes verificar los mismos comandos de nodo sin un turno de agente:

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

La inferencia local en Node no reutiliza intencionalmente un
`models.providers.ollama.baseUrl` remoto o en la nube. Inicia Ollama en el endpoint
estándar de local loopback del nodo. Los comandos de nodo están disponibles de forma predeterminada en hosts de nodo
macOS, Linux y Windows, y siguen sujetos al emparejamiento de nodos y a la política
de comandos normales.

## Visión y descripción de imágenes

El Plugin de Ollama incluido registra Ollama como proveedor de comprensión de medios con capacidad de imagen. Esto permite que OpenClaw enrute solicitudes explícitas de descripción de imágenes y valores predeterminados configurados de modelos de imagen mediante modelos de visión de Ollama locales o alojados.

Para visión local, descarga un modelo que admita imágenes:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Luego verifica con la CLI de inferencia:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` debe ser una referencia completa `<provider/model>`. Cuando se establece, `openclaw infer image describe` intenta primero ese modelo en lugar de omitir la descripción porque el modelo admite visión nativa. Si la llamada al modelo falla, OpenClaw puede continuar mediante los `agents.defaults.imageModel.fallbacks` configurados; los errores de preparación de archivo o URL siguen fallando antes de los intentos de reserva.

Usa `infer image describe` cuando quieras el flujo de proveedor de comprensión de imágenes de OpenClaw, `agents.defaults.imageModel` configurado y la forma de salida de descripción de imagen. Usa `infer model run --file` cuando quieras una prueba de modelo multimodal sin procesar con un prompt personalizado y una o más imágenes.

Para convertir Ollama en el modelo predeterminado de comprensión de imágenes para medios entrantes, configura `agents.defaults.imageModel`:

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

Prefiere la referencia completa `ollama/<model>`. Si el mismo modelo aparece en `models.providers.ollama.models` con `input: ["text", "image"]` y ningún otro proveedor de imagen configurado expone ese ID de modelo sin prefijo, OpenClaw también normaliza una referencia `imageModel` sin prefijo como `qwen2.5vl:7b` a `ollama/qwen2.5vl:7b`. Si más de un proveedor de imagen configurado tiene el mismo ID sin prefijo, usa explícitamente el prefijo del proveedor.

Los modelos locales de visión lentos pueden necesitar un tiempo de espera de comprensión de imágenes más largo que los modelos en la nube. También pueden fallar o detenerse cuando Ollama intenta asignar todo el contexto de visión anunciado en hardware limitado. Establece un tiempo de espera de capacidad y limita `num_ctx` en la entrada del modelo cuando solo necesites un turno normal de descripción de imagen:

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

Este tiempo de espera se aplica a la comprensión de imágenes entrantes y a la herramienta explícita `image` que el agente puede llamar durante un turno. `models.providers.ollama.timeoutSeconds` a nivel de proveedor sigue controlando la protección de la solicitud HTTP subyacente de Ollama para llamadas normales al modelo.

Verifica en vivo la herramienta explícita de imagen contra Ollama local con:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Si defines `models.providers.ollama.models` manualmente, marca los modelos de visión con compatibilidad de entrada de imagen:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw rechaza solicitudes de descripción de imágenes para modelos que no están marcados como compatibles con imágenes. Con detección implícita, OpenClaw lee esto desde Ollama cuando `/api/show` informa una capacidad de visión.

## Configuración

<Tabs>
  <Tab title="Basic (implicit discovery)">
    La ruta de habilitación local más simple es mediante variable de entorno:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` está establecido, puedes omitir `apiKey` en la entrada del proveedor y OpenClaw lo rellenará para las comprobaciones de disponibilidad.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Usa configuración explícita cuando quieras una configuración de nube alojada, Ollama se ejecute en otro host/puerto, quieras forzar ventanas de contexto o listas de modelos específicas, o quieras definiciones de modelos completamente manuales.

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
    Si Ollama se ejecuta en un host o puerto diferente (la configuración explícita desactiva la detección automática, así que define los modelos manualmente):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
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
    No agregues `/v1` a la URL. La ruta `/v1` usa el modo compatible con OpenAI, donde las llamadas a herramientas no son fiables. Usa la URL base de Ollama sin sufijo de ruta.
    </Warning>

  </Tab>
</Tabs>

## Recetas comunes

Usa estos como puntos de partida y sustituye los ID de modelo por los nombres exactos de `ollama list` u `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Modelo local con descubrimiento automático">
    Usa esto cuando Ollama se ejecute en la misma máquina que el Gateway y quieras que OpenClaw descubra automáticamente los modelos instalados.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Esta ruta mantiene la configuración al mínimo. No agregues un bloque `models.providers.ollama` a menos que quieras definir modelos manualmente.

  </Accordion>

  <Accordion title="Host Ollama en LAN con modelos manuales">
    Usa URL nativas de Ollama para hosts LAN. No agregues `/v1`.

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

    `contextWindow` es el presupuesto de contexto del lado de OpenClaw. `params.num_ctx` se envía a Ollama para la solicitud. Mantenlos alineados cuando tu hardware no pueda ejecutar todo el contexto anunciado del modelo.

  </Accordion>

  <Accordion title="Solo Ollama Cloud">
    Usa esto cuando no ejecutes un daemon local y quieras modelos alojados de Ollama directamente.

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

  </Accordion>

  <Accordion title="Nube más local mediante un daemon con sesión iniciada">
    Usa esto cuando un daemon Ollama local o LAN haya iniciado sesión con `ollama signin` y deba servir tanto modelos locales como modelos `:cloud`.

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

  <Accordion title="Múltiples hosts Ollama">
    Usa ID de proveedor personalizados cuando tengas más de un servidor Ollama. Cada proveedor obtiene su propio host, modelos, autenticación, tiempo de espera y refs de modelo.

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

    Cuando OpenClaw envía la solicitud, se elimina el prefijo del proveedor activo, de modo que `ollama-large/qwen3.5:27b` llega a Ollama como `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Perfil de modelo local ligero">
    Algunos modelos locales pueden responder prompts simples, pero tienen dificultades con toda la superficie de herramientas del agente. Empieza limitando herramientas y contexto antes de cambiar la configuración global del runtime.

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

    Usa `compat.supportsTools: false` solo cuando el modelo o servidor falle de forma fiable con esquemas de herramientas. Cambia capacidad del agente por estabilidad.
    `localModelLean` elimina las herramientas de navegador, cron y mensajes de la superficie directa del agente, y pone de forma predeterminada los catálogos más grandes detrás de controles estructurados de búsqueda de herramientas, excepto cuando una ejecución debe conservar la semántica de entrega directa de mensajes, pero no cambia el contexto de runtime ni el modo de pensamiento de Ollama. Combínalo con `params.num_ctx` explícito y `params.thinking: false` para modelos pequeños de pensamiento estilo Qwen que entran en bucle o gastan su presupuesto de respuesta en razonamiento oculto.

  </Accordion>
</AccordionGroup>

### Selección de modelo

Una vez configurados, todos tus modelos de Ollama están disponibles:

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

También se admiten ID de proveedor Ollama personalizados. Cuando una ref de modelo usa el prefijo de proveedor activo, como `ollama-spark/qwen3:32b`, OpenClaw elimina solo ese prefijo antes de llamar a Ollama, de modo que el servidor recibe `qwen3:32b`.

Para modelos locales lentos, prefiere el ajuste de solicitudes con alcance de proveedor antes de aumentar el tiempo de espera de todo el runtime del agente:

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

`timeoutSeconds` se aplica a la solicitud HTTP del modelo, incluida la configuración de conexión, encabezados, transmisión del cuerpo y la cancelación total de la captura protegida. `params.keep_alive` se reenvía a Ollama como `keep_alive` de nivel superior en solicitudes nativas `/api/chat`; configúralo por modelo cuando el tiempo de carga del primer turno sea el cuello de botella.

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

Para hosts remotos, sustituye `127.0.0.1` por el host usado en `baseUrl`. Si `curl` funciona pero OpenClaw no, comprueba si el Gateway se ejecuta en otra máquina, contenedor o cuenta de servicio.

## Búsqueda web de Ollama

OpenClaw admite **Búsqueda web de Ollama** como proveedor `web_search` incluido.

| Propiedad   | Detalle                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | Usa tu host Ollama configurado (`models.providers.ollama.baseUrl` cuando está establecido; de lo contrario, `http://127.0.0.1:11434`); `https://ollama.com` usa directamente la API alojada |
| Autenticación | Sin clave para hosts Ollama locales con sesión iniciada; `OLLAMA_API_KEY` o autenticación de proveedor configurada para búsqueda directa en `https://ollama.com` o hosts protegidos por autenticación |
| Requisito   | Los hosts locales/autohospedados deben estar ejecutándose y con sesión iniciada mediante `ollama signin`; la búsqueda alojada directa requiere `baseUrl: "https://ollama.com"` más una clave API real de Ollama |

Elige **Búsqueda web de Ollama** durante `openclaw onboard` u `openclaw configure --section web`, o establece:

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

Para un daemon local con sesión iniciada, OpenClaw usa el proxy `/api/experimental/web_search` del daemon. Para `https://ollama.com`, llama directamente al endpoint alojado `/api/web_search`.

<Note>
Para la configuración completa y los detalles de comportamiento, consulta [Búsqueda web de Ollama](/es/tools/ollama-search).
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo heredado compatible con OpenAI">
    <Warning>
    **La llamada a herramientas no es fiable en modo compatible con OpenAI.** Usa este modo solo si necesitas el formato de OpenAI para un proxy y no dependes del comportamiento nativo de llamada a herramientas.
    </Warning>

    Si necesitas usar el endpoint compatible con OpenAI en su lugar (por ejemplo, detrás de un proxy que solo admite el formato de OpenAI), establece `api: "openai-completions"` explícitamente:

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

    Es posible que este modo no admita streaming y llamada a herramientas simultáneamente. Es posible que debas desactivar el streaming con `params: { streaming: false }` en la configuración del modelo.

    Cuando `api: "openai-completions"` se usa con Ollama, OpenClaw inyecta `options.num_ctx` de forma predeterminada para que Ollama no vuelva silenciosamente a una ventana de contexto de 4096. Si tu proxy/upstream rechaza campos `options` desconocidos, desactiva este comportamiento:

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
    Para modelos descubiertos automáticamente, OpenClaw usa la ventana de contexto reportada por Ollama cuando está disponible, incluidos valores `PARAMETER num_ctx` más grandes de Modelfiles personalizados. De lo contrario, vuelve a la ventana de contexto predeterminada de Ollama usada por OpenClaw.

    Puedes establecer valores predeterminados de nivel de proveedor para `contextWindow`, `contextTokens` y `maxTokens` para cada modelo bajo ese proveedor de Ollama, y luego sobrescribirlos por modelo cuando sea necesario. `contextWindow` es el presupuesto de prompt y Compaction de OpenClaw. Las solicitudes nativas de Ollama dejan `options.num_ctx` sin establecer a menos que configures explícitamente `params.num_ctx`, de modo que Ollama pueda aplicar su propio valor predeterminado basado en el modelo, `OLLAMA_CONTEXT_LENGTH` o la VRAM. Para limitar o forzar el contexto de ejecución por solicitud de Ollama sin reconstruir un Modelfile, establece `params.num_ctx`; los valores no válidos, cero, negativos y no finitos se ignoran. Si actualizaste una configuración antigua que usaba solo `contextWindow` o `maxTokens` para forzar un contexto de solicitud nativa de Ollama, ejecuta `openclaw doctor --fix` para copiar esos presupuestos explícitos de proveedor o modelo en `params.num_ctx`. El adaptador de Ollama compatible con OpenAI sigue inyectando `options.num_ctx` de forma predeterminada desde el `params.num_ctx` o `contextWindow` configurado; desactívalo con `injectNumCtxForOpenAICompat: false` si tu upstream rechaza `options`.

    Las entradas de modelos nativos de Ollama también aceptan las opciones comunes de ejecución de Ollama bajo `params`, incluidas `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` y `use_mmap`. OpenClaw reenvía solo claves de solicitud de Ollama, por lo que los parámetros de ejecución de OpenClaw como `streaming` no se filtran a Ollama. Usa `params.think` o `params.thinking` para enviar `think` de nivel superior de Ollama; `false` desactiva el pensamiento a nivel de API para modelos de pensamiento estilo Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` por modelo también funciona. Si ambos están configurados, la entrada explícita del modelo del proveedor tiene prioridad sobre el valor predeterminado del agente.

  </Accordion>

  <Accordion title="Control de pensamiento">
    Para modelos nativos de Ollama, OpenClaw reenvía el control de pensamiento como Ollama lo espera: `think` de nivel superior, no `options.think`. Los modelos autodetectados cuya respuesta de `/api/show` incluye la capacidad `thinking` exponen `/think low`, `/think medium`, `/think high` y `/think max`; los modelos sin pensamiento exponen solo `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    También puedes establecer un valor predeterminado del modelo:

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

    `params.think` o `params.thinking` por modelo pueden desactivar o forzar el pensamiento de la API de Ollama para un modelo configurado específico. OpenClaw conserva esos parámetros explícitos del modelo cuando la ejecución activa solo tiene el valor predeterminado implícito `off`; los comandos de ejecución distintos de off, como `/think medium`, siguen sobrescribiendo la ejecución activa.

  </Accordion>

  <Accordion title="Modelos de razonamiento">
    OpenClaw trata los modelos con nombres como `deepseek-r1`, `reasoning` o `think` como capaces de razonamiento de forma predeterminada.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    No se necesita configuración adicional. OpenClaw los marca automáticamente.

  </Accordion>

  <Accordion title="Costos de modelos">
    Ollama es gratuito y se ejecuta localmente, por lo que todos los costos de modelos se establecen en $0. Esto se aplica tanto a los modelos autodetectados como a los definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memoria">
    El Plugin de Ollama incluido registra un proveedor de embeddings de memoria para
    [búsqueda de memoria](/es/concepts/memory). Usa la URL base de Ollama configurada
    y la clave de API, llama al endpoint actual `/api/embed` de Ollama y agrupa
    varios fragmentos de memoria en una solicitud `input` cuando es posible.

    Cuando `proxy.enabled=true`, las solicitudes de embeddings de memoria de Ollama al origen
    host-local loopback exacto derivado del `baseUrl` configurado usan
    la ruta directa protegida de OpenClaw en lugar del proxy reenviado administrado. El
    nombre de host configurado debe ser `localhost` o un literal de IP de loopback;
    los nombres DNS que simplemente resuelven a loopback siguen usando la ruta del proxy administrado.
    Los hosts Ollama de LAN, tailnet, red privada y públicos también permanecen en la
    ruta del proxy administrado. Las redirecciones a otro host o puerto no heredan la confianza.
    Los operadores aún pueden establecer la configuración global `proxy.loopbackMode: "proxy"` para
    enviar tráfico de loopback a través del proxy, o `proxy.loopbackMode: "block"`
    para denegar conexiones de loopback antes de abrir una conexión; consulta
    [Proxy administrado](/es/security/network-proxy#gateway-loopback-mode) para conocer el
    efecto en todo el proceso de esta configuración.

    | Propiedad      | Valor               |
    | ------------- | ------------------- |
    | Modelo predeterminado | `nomic-embed-text`  |
    | Extracción automática     | Sí — el modelo de embedding se extrae automáticamente si no está presente localmente |

    Los embeddings en tiempo de consulta usan prefijos de recuperación para los modelos que los requieren o recomiendan, incluidos `nomic-embed-text`, `qwen3-embedding` y `mxbai-embed-large`. Los lotes de documentos de memoria permanecen sin procesar para que los índices existentes no necesiten una migración de formato.

    Para seleccionar Ollama como proveedor de embeddings de búsqueda de memoria:

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

    Para un host remoto de embeddings, mantén la autenticación limitada a ese host:

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
    La integración de Ollama de OpenClaw usa la **API nativa de Ollama** (`/api/chat`) de forma predeterminada, que admite completamente streaming y llamadas a herramientas de forma simultánea. No se necesita configuración especial.

    Para solicitudes nativas de `/api/chat`, OpenClaw también reenvía el control de pensamiento directamente a Ollama: `/think off` y `openclaw agent --thinking off` envían `think: false` de nivel superior a menos que haya un valor explícito de modelo `params.think`/`params.thinking` configurado, mientras que `/think low|medium|high` envía la cadena de esfuerzo `think` de nivel superior correspondiente. `/think max` se asigna al esfuerzo nativo más alto de Ollama, `think: "high"`.

    <Tip>
    Si necesitas usar el endpoint compatible con OpenAI, consulta la sección "Modo heredado compatible con OpenAI" anterior. Es posible que streaming y las llamadas a herramientas no funcionen simultáneamente en ese modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Bucle de fallos de WSL2 (reinicios repetidos)">
    En WSL2 con NVIDIA/CUDA, el instalador oficial de Ollama para Linux crea una unidad systemd `ollama.service` con `Restart=always`. Si ese servicio se inicia automáticamente y carga un modelo respaldado por GPU durante el arranque de WSL2, Ollama puede fijar memoria del host mientras se carga el modelo. La recuperación de memoria de Hyper-V no siempre puede recuperar esas páginas fijadas, por lo que Windows puede terminar la VM de WSL2, systemd inicia Ollama de nuevo y el bucle se repite.

    Evidencia común:

    - reinicios o terminaciones repetidas de WSL2 desde el lado de Windows
    - CPU alta en `app.slice` u `ollama.service` poco después del inicio de WSL2
    - SIGTERM de systemd en lugar de un evento del OOM-killer de Linux

    OpenClaw registra una advertencia de inicio cuando detecta WSL2, `ollama.service` habilitado con `Restart=always` y marcadores CUDA visibles.

    Mitigación:

    ```bash
    sudo systemctl disable ollama
    ```

    Agrega esto a `%USERPROFILE%\.wslconfig` en el lado de Windows y luego ejecuta `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Establece un keep-alive más corto en el entorno del servicio Ollama, o inicia Ollama manualmente solo cuando lo necesites:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consulta [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama no detectado">
    Asegúrate de que Ollama se esté ejecutando, de haber establecido `OLLAMA_API_KEY` (o un perfil de autenticación) y de que **no** hayas definido una entrada explícita `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifica que la API sea accesible:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No hay modelos disponibles">
    Si tu modelo no aparece, extrae el modelo localmente o defínelo explícitamente en `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Conexión rechazada">
    Comprueba que Ollama se esté ejecutando en el puerto correcto:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="El host remoto funciona con curl pero no con OpenClaw">
    Verifica desde la misma máquina y ejecución que ejecuta el Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Causas comunes:

    - `baseUrl` apunta a `localhost`, pero el Gateway se ejecuta en Docker o en otro host.
    - La URL usa `/v1`, lo que selecciona el comportamiento compatible con OpenAI en lugar de Ollama nativo.
    - El host remoto necesita cambios de firewall o de enlace LAN en el lado de Ollama.
    - El modelo está presente en el daemon de tu portátil, pero no en el daemon remoto.

  </Accordion>

  <Accordion title="El modelo emite JSON de herramienta como texto">
    Esto normalmente significa que el proveedor está usando el modo compatible con OpenAI o que el modelo no puede manejar esquemas de herramientas.

    Prefiere el modo nativo de Ollama:

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

    Si un modelo local pequeño sigue fallando con esquemas de herramientas, establece `compat.supportsTools: false` en esa entrada de modelo y vuelve a probar.

  </Accordion>

  <Accordion title="Kimi o GLM devuelve símbolos ilegibles">
    Las respuestas alojadas de Kimi/GLM que son largas secuencias de símbolos no lingüísticos se tratan como salida fallida del proveedor en lugar de una respuesta correcta del asistente. Eso permite que el reintento, fallback o manejo de errores normal tome el control sin persistir el texto corrupto en la sesión.

    Si ocurre repetidamente, captura el nombre bruto del modelo, el archivo de sesión actual y si la ejecución usó `Cloud + Local` o `Cloud only`; luego prueba con una sesión nueva y un modelo fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="El modelo local en frío agota el tiempo de espera">
    Los modelos locales grandes pueden necesitar una carga inicial prolongada antes de que comience el streaming. Mantén el tiempo de espera limitado al proveedor de Ollama y, opcionalmente, pide a Ollama que mantenga el modelo cargado entre turnos:

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

    Si el host en sí tarda en aceptar conexiones, `timeoutSeconds` también amplía el tiempo de espera de conexión protegido de Undici para este proveedor.

  </Accordion>

  <Accordion title="El modelo de contexto grande es demasiado lento o se queda sin memoria">
    Muchos modelos de Ollama anuncian contextos más grandes de lo que tu hardware puede ejecutar cómodamente. Ollama nativo usa el valor predeterminado de contexto del propio runtime de Ollama a menos que configures `params.num_ctx`. Limita tanto el presupuesto de OpenClaw como el contexto de solicitud de Ollama cuando quieras una latencia predecible del primer token:

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

    Reduce primero `contextWindow` si OpenClaw está enviando demasiado prompt. Reduce `params.num_ctx` si Ollama está cargando un contexto de runtime demasiado grande para la máquina. Reduce `maxTokens` si la generación se prolonga demasiado.

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Descripción general de todos los proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Búsqueda web de Ollama" href="/es/tools/ollama-search" icon="magnifying-glass">
    Configuración completa y detalles de comportamiento para la búsqueda web impulsada por Ollama.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
