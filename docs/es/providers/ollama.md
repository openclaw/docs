---
read_when:
    - Quieres ejecutar OpenClaw con modelos en la nube o locales mediante Ollama
    - Necesitas orientación para instalar y configurar Ollama
    - Quieres usar modelos de visión de Ollama para comprender imágenes
summary: Ejecutar OpenClaw con Ollama (modelos en la nube y locales)
title: Ollama
x-i18n:
    generated_at: "2026-06-27T12:40:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 929db683f4861f117f5866bdbc4af9a70752b2848a6f09437eb2f8b32b5ff37b
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw se integra con la API nativa de Ollama (`/api/chat`) para modelos en la nube alojados y servidores Ollama locales/autohospedados. Puedes usar Ollama en tres modos: `Cloud + Local` mediante un host Ollama accesible, `Cloud only` contra `https://ollama.com`, o `Local only` contra un host Ollama accesible.

OpenClaw también registra `ollama-cloud` como id de proveedor alojado de primera clase para
uso directo de Ollama Cloud. Usa referencias como `ollama-cloud/kimi-k2.5:cloud` cuando
quieras enrutamiento solo en la nube sin compartir el id de proveedor local `ollama`.

Para la página dedicada de configuración solo en la nube, consulta [Ollama Cloud](/es/providers/ollama-cloud).

<Warning>
**Usuarios de Ollama remoto**: No uses la URL compatible con OpenAI `/v1` (`http://host:11434/v1`) con OpenClaw. Esto rompe las llamadas a herramientas y los modelos pueden generar JSON de herramientas sin procesar como texto plano. Usa en su lugar la URL de la API nativa de Ollama: `baseUrl: "http://host:11434"` (sin `/v1`).
</Warning>

La configuración del proveedor Ollama usa `baseUrl` como clave canónica. OpenClaw también acepta `baseURL` por compatibilidad con ejemplos de estilo OpenAI SDK, pero la configuración nueva debería preferir `baseUrl`.

## Reglas de autenticación

<AccordionGroup>
  <Accordion title="Hosts locales y LAN">
    Los hosts Ollama locales y de LAN no necesitan un token bearer real. OpenClaw usa el marcador local `ollama-local` solo para URL base de Ollama de loopback, red privada, `.local` y nombres de host simples.
  </Accordion>
  <Accordion title="Hosts remotos y Ollama Cloud">
    Los hosts públicos remotos y Ollama Cloud (`https://ollama.com`) requieren una credencial real mediante `OLLAMA_API_KEY`, un perfil de autenticación o el `apiKey` del proveedor. Para uso alojado directo, prefiere el proveedor `ollama-cloud`.
  </Accordion>
  <Accordion title="Ids de proveedor personalizados">
    Los ids de proveedor personalizados que configuran `api: "ollama"` siguen las mismas reglas. Por ejemplo, un proveedor `ollama-remote` que apunta a un host Ollama de una LAN privada puede usar `apiKey: "ollama-local"` y los subagentes resolverán ese marcador mediante el hook del proveedor Ollama en lugar de tratarlo como una credencial faltante. La búsqueda de memoria también puede establecer `agents.defaults.memorySearch.provider` en ese id de proveedor personalizado para que los embeddings usen el endpoint Ollama correspondiente.
  </Accordion>
  <Accordion title="Perfiles de autenticación">
    `auth-profiles.json` almacena la credencial para un id de proveedor. Coloca los ajustes de endpoint (`baseUrl`, `api`, ids de modelo, encabezados, tiempos de espera) en `models.providers.<id>`. Los archivos antiguos de perfil de autenticación planos, como `{ "ollama-windows": { "apiKey": "ollama-local" } }`, no son un formato de runtime; ejecuta `openclaw doctor --fix` para reescribirlos al perfil canónico de clave API `ollama-windows:default` con una copia de seguridad. `baseUrl` en ese archivo es ruido de compatibilidad y debería moverse a la configuración del proveedor.
  </Accordion>
  <Accordion title="Alcance de embeddings de memoria">
    Cuando Ollama se usa para embeddings de memoria, la autenticación bearer se limita al host donde se declaró:

    - Una clave a nivel de proveedor se envía solo al host Ollama de ese proveedor.
    - `agents.*.memorySearch.remote.apiKey` se envía solo a su host remoto de embeddings.
    - Un valor de entorno puro `OLLAMA_API_KEY` se trata como la convención de Ollama Cloud, y no se envía a hosts locales ni autohospedados de forma predeterminada.

  </Accordion>
</AccordionGroup>

## Primeros pasos

Elige tu método y modo de configuración preferidos.

<Tabs>
  <Tab title="Incorporación (recomendado)">
    **Ideal para:** la ruta más rápida hacia una configuración funcional de Ollama en la nube o local.

    <Steps>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard
        ```

        Selecciona **Ollama** en la lista de proveedores.
      </Step>
      <Step title="Elige tu modo">
        - **Nube + local** — host Ollama local más modelos en la nube enrutados a través de ese host
        - **Solo nube** — modelos alojados de Ollama mediante `https://ollama.com`
        - **Solo local** — solo modelos locales

      </Step>
      <Step title="Selecciona un modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` y sugiere valores predeterminados alojados en la nube. `Cloud + Local` y `Local only` piden una URL base de Ollama, descubren los modelos disponibles y descargan automáticamente el modelo local seleccionado si aún no está disponible. Cuando Ollama informa una etiqueta `:latest` instalada, como `gemma4:latest`, la configuración muestra ese modelo instalado una sola vez en lugar de mostrar tanto `gemma4` como `gemma4:latest` o volver a descargar el alias simple. `Cloud + Local` también comprueba si ese host Ollama tiene sesión iniciada para acceso a la nube.
      </Step>
      <Step title="Verifica que el modelo esté disponible">
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
      <Step title="Elige nube o local">
        - **Nube + local**: instala Ollama, inicia sesión con `ollama signin` y enruta las solicitudes a la nube a través de ese host
        - **Solo nube**: usa `https://ollama.com` con una `OLLAMA_API_KEY`
        - **Solo local**: instala Ollama desde [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Descarga un modelo local (solo local)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Habilita Ollama para OpenClaw">
        Para `Cloud only`, usa tu `OLLAMA_API_KEY` real. Para configuraciones respaldadas por host, cualquier valor de marcador funciona:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspecciona y configura tu modelo">
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
    `Cloud + Local` usa un host Ollama accesible como punto de control para modelos locales y en la nube. Este es el flujo híbrido preferido de Ollama.

    Usa **Nube + local** durante la configuración. OpenClaw solicita la URL base de Ollama, descubre modelos locales de ese host y comprueba si el host tiene sesión iniciada para acceso a la nube con `ollama signin`. Cuando el host tiene sesión iniciada, OpenClaw también sugiere valores predeterminados alojados en la nube, como `kimi-k2.5:cloud`, `minimax-m2.7:cloud` y `glm-5.1:cloud`.

    Si el host aún no tiene sesión iniciada, OpenClaw mantiene la configuración como solo local hasta que ejecutes `ollama signin`.

  </Tab>

  <Tab title="Solo nube">
    `Cloud only` se ejecuta contra la API alojada de Ollama en `https://ollama.com`.

    Usa **Solo nube** durante la configuración. OpenClaw solicita `OLLAMA_API_KEY`, establece `baseUrl: "https://ollama.com"` y siembra la lista de modelos alojados en la nube. Esta ruta **no** requiere un servidor Ollama local ni `ollama signin`.

    La lista de modelos en la nube que se muestra durante `openclaw onboard` se llena en vivo desde `https://ollama.com/api/tags`, limitada a 500 entradas, por lo que el selector refleja el catálogo alojado actual en lugar de una semilla estática. Si `ollama.com` no está accesible o no devuelve modelos durante la configuración, OpenClaw vuelve a las sugerencias codificadas anteriores para que la incorporación aún se complete.

    También puedes configurar directamente el proveedor en la nube de primera clase:

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
| Detección de capacidades | Usa consultas de mejor esfuerzo a `/api/show` para leer `contextWindow`, parámetros Modelfile `num_ctx` expandidos y capacidades, incluida visión/herramientas |
| Modelos de visión    | Los modelos con una capacidad `vision` informada por `/api/show` se marcan como compatibles con imágenes (`input: ["text", "image"]`), por lo que OpenClaw inyecta imágenes automáticamente en el prompt |
| Detección de razonamiento | Usa capacidades de `/api/show` cuando están disponibles, incluida `thinking`; recurre a una heurística de nombre de modelo (`r1`, `reasoning`, `think`) cuando Ollama omite capacidades |
| Límites de tokens    | Establece `maxTokens` en el límite máximo predeterminado de tokens de Ollama usado por OpenClaw                                                                     |
| Costos               | Establece todos los costos en `0`                                                                                                                                    |

Esto evita entradas manuales de modelos y mantiene el catálogo alineado con la instancia local de Ollama. Puedes usar una referencia completa como `ollama/<pulled-model>:latest` en `infer model run` local; OpenClaw resuelve ese modelo instalado desde el catálogo en vivo de Ollama sin requerir una entrada `models.json` escrita a mano.

Para hosts Ollama con sesión iniciada, algunos modelos `:cloud` pueden ser utilizables mediante `/api/chat`
y `/api/show` antes de aparecer en `/api/tags`. Cuando seleccionas explícitamente una
referencia completa `ollama/<model>:cloud`, OpenClaw valida ese modelo faltante exacto con
`/api/show` y lo añade al catálogo de runtime solo si Ollama confirma los
metadatos del modelo. Los errores tipográficos siguen fallando como modelos desconocidos en lugar de crearse automáticamente.

```bash
# See what models are available
ollama list
openclaw models list
```

Para una prueba rápida y acotada de generación de texto que evita toda la superficie de herramientas del agente,
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
esto funciona mientras las respuestas normales del agente fallan, investiga después la capacidad del modelo para
prompts de agente/herramientas.

Para una prueba rápida y acotada de modelo de visión en la misma ruta ligera, añade uno o más
archivos de imagen a `infer model run`. Esto envía el prompt y la imagen directamente al
modelo de visión Ollama seleccionado sin cargar herramientas de chat, memoria ni contexto de
sesión previo:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` acepta archivos detectados como `image/*`, incluidas entradas PNG,
JPEG y WebP comunes. Los archivos que no son imágenes se rechazan antes de llamar a Ollama.
Para reconocimiento de voz, usa `openclaw infer audio transcribe` en su lugar.

Cuando cambias una conversación con `/model ollama/<model>`, OpenClaw trata
eso como una selección exacta del usuario. Si el `baseUrl` de Ollama configurado
no está disponible, la siguiente respuesta falla con el error del proveedor en lugar de
responder silenciosamente desde otro modelo de respaldo configurado.

Los trabajos de cron aislados hacen una comprobación local de seguridad adicional antes de iniciar el turno
del agente. Si el modelo seleccionado se resuelve a un proveedor Ollama local, de red privada o `.local`
y `/api/tags` no está disponible, OpenClaw registra esa ejecución de cron
como `skipped` con el `ollama/<model>` seleccionado en el texto del error. La comprobación previa
del endpoint se almacena en caché durante 5 minutos, por lo que varios trabajos de cron apuntados al mismo
daemon de Ollama detenido no lanzan todos solicitudes de modelo fallidas.

Verifica en vivo la ruta de texto local, la ruta de stream nativa y los embeddings contra
Ollama local con:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para pruebas de humo con clave de API de Ollama Cloud, apunta la prueba en vivo a `https://ollama.com`
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

La prueba de humo en la nube ejecuta texto, stream nativo y búsqueda web. Omite los embeddings de forma
predeterminada para `https://ollama.com` porque las claves de API de Ollama Cloud pueden no autorizar
`/api/embed`. Define `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` cuando quieras explícitamente
que la prueba en vivo falle si la clave de nube configurada no puede usar el endpoint de embed.

Para agregar un modelo nuevo, simplemente descárgalo con Ollama:

```bash
ollama pull mistral
```

El nuevo modelo se descubrirá automáticamente y estará disponible para su uso.

<Note>
Si defines `models.providers.ollama` explícitamente, o configuras un proveedor remoto personalizado como `models.providers.ollama-cloud` con `api: "ollama"`, el descubrimiento automático se omite y debes definir los modelos manualmente. Los proveedores personalizados de loopback como `http://127.0.0.2:11434` se siguen tratando como locales. Consulta la sección de configuración explícita más abajo.
</Note>

## Visión y descripción de imágenes

El Plugin de Ollama incluido registra Ollama como un proveedor de comprensión de medios compatible con imágenes. Esto permite que OpenClaw enrute solicitudes explícitas de descripción de imágenes y valores predeterminados configurados de modelos de imagen a través de modelos de visión de Ollama locales o alojados.

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

`--model` debe ser una referencia completa `<provider/model>`. Cuando se define, `openclaw infer image describe` ejecuta ese modelo directamente en lugar de omitir la descripción porque el modelo admite visión nativa.

Usa `infer image describe` cuando quieras el flujo de proveedor de comprensión de imágenes de OpenClaw, el `agents.defaults.imageModel` configurado y la forma de salida de descripción de imagen. Usa `infer model run --file` cuando quieras una prueba multimodal sin procesar del modelo con un prompt personalizado y una o más imágenes.

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

Los modelos locales de visión lentos pueden necesitar un tiempo de espera de comprensión de imágenes más largo que los modelos en la nube. También pueden bloquearse o detenerse cuando Ollama intenta asignar todo el contexto de visión anunciado en hardware limitado. Define un tiempo de espera de capacidad y limita `num_ctx` en la entrada del modelo cuando solo necesitas un turno normal de descripción de imagen:

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

Este tiempo de espera se aplica a la comprensión de imágenes entrantes y a la herramienta explícita `image` que el agente puede llamar durante un turno. `models.providers.ollama.timeoutSeconds` a nivel de proveedor sigue controlando la protección de solicitud HTTP subyacente de Ollama para llamadas normales al modelo.

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

OpenClaw rechaza las solicitudes de descripción de imágenes para modelos que no están marcados como compatibles con imágenes. Con descubrimiento implícito, OpenClaw lee esto desde Ollama cuando `/api/show` informa una capacidad de visión.

## Configuración

<Tabs>
  <Tab title="Básica (descubrimiento implícito)">
    La ruta de habilitación local más simple es mediante una variable de entorno:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` está definida, puedes omitir `apiKey` en la entrada del proveedor y OpenClaw la completará para las comprobaciones de disponibilidad.
    </Tip>

  </Tab>

  <Tab title="Explícita (modelos manuales)">
    Usa configuración explícita cuando quieras configurar la nube alojada, Ollama se ejecute en otro host/puerto, quieras forzar ventanas de contexto o listas de modelos específicas, o quieras definiciones de modelos completamente manuales.

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
    Si Ollama se ejecuta en un host o puerto diferente (la configuración explícita desactiva el descubrimiento automático, así que define los modelos manualmente):

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

Usa esto como punto de partida y reemplaza los ID de modelo por los nombres exactos de `ollama list` u `openclaw models list --provider ollama`.

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

    Esta ruta mantiene la configuración mínima. No agregues un bloque `models.providers.ollama` a menos que quieras definir modelos manualmente.

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

    `contextWindow` es el presupuesto de contexto del lado de OpenClaw. `params.num_ctx` se envía a Ollama para la solicitud. Mantenlos alineados cuando tu hardware no pueda ejecutar el contexto completo anunciado del modelo.

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
    Usa esto cuando un daemon de Ollama local o LAN tenga la sesión iniciada con `ollama signin` y deba servir tanto modelos locales como modelos `:cloud`.

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

  <Accordion title="Varios hosts Ollama">
    Usa ID de proveedor personalizados cuando tengas más de un servidor Ollama. Cada proveedor obtiene su propio host, modelos, autenticación, tiempo de espera y referencias de modelo.

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

    Cuando OpenClaw envía la solicitud, el prefijo del proveedor activo se elimina, de modo que `ollama-large/qwen3.5:27b` llega a Ollama como `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Lean local model profile">
    Algunos modelos locales pueden responder prompts simples, pero tienen dificultades con toda la superficie de herramientas del agente. Empieza limitando las herramientas y el contexto antes de cambiar la configuración global del runtime.

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

    Usa `compat.supportsTools: false` solo cuando el modelo o el servidor falle de forma fiable con esquemas de herramientas. Cambia capacidad del agente por estabilidad.
    `localModelLean` elimina las herramientas de navegador, cron y mensajes de la superficie directa del agente, y pone de forma predeterminada catálogos más grandes detrás de controles estructurados de búsqueda de herramientas, excepto cuando una ejecución debe conservar la semántica de entrega directa de mensajes, pero no cambia el contexto de runtime ni el modo de pensamiento de Ollama. Combínalo con `params.num_ctx` explícito y `params.thinking: false` para modelos de pensamiento pequeños de estilo Qwen que entran en bucle o gastan su presupuesto de respuesta en razonamiento oculto.

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

También se admiten ids de proveedor de Ollama personalizados. Cuando una referencia de modelo usa el prefijo del
proveedor activo, como `ollama-spark/qwen3:32b`, OpenClaw elimina solo ese
prefijo antes de llamar a Ollama, de modo que el servidor recibe `qwen3:32b`.

Para modelos locales lentos, prefiere ajustar las solicitudes en el ámbito del proveedor antes de aumentar el
timeout de runtime de todo el agente:

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

`timeoutSeconds` se aplica a la solicitud HTTP del modelo, incluida la preparación de la conexión,
los encabezados, el streaming del cuerpo y la cancelación total de guarded-fetch. `params.keep_alive`
se reenvía a Ollama como `keep_alive` de nivel superior en solicitudes nativas `/api/chat`;
configúralo por modelo cuando el tiempo de carga del primer turno sea el cuello de botella.

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

Para hosts remotos, reemplaza `127.0.0.1` por el host usado en `baseUrl`. Si `curl` funciona pero OpenClaw no, comprueba si el Gateway se ejecuta en una máquina, contenedor o cuenta de servicio diferente.

## Ollama Web Search

OpenClaw admite **Ollama Web Search** como proveedor `web_search` incluido.

| Propiedad   | Detalle                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | Usa tu host de Ollama configurado (`models.providers.ollama.baseUrl` cuando esté definido; de lo contrario, `http://127.0.0.1:11434`); `https://ollama.com` usa directamente la API alojada |
| Auth        | Sin clave para hosts locales de Ollama con sesión iniciada; `OLLAMA_API_KEY` o auth de proveedor configurada para búsqueda directa en `https://ollama.com` o hosts protegidos por auth |
| Requisito   | Los hosts locales/autohospedados deben estar en ejecución y tener sesión iniciada con `ollama signin`; la búsqueda alojada directa requiere `baseUrl: "https://ollama.com"` más una clave de API real de Ollama |

Elige **Ollama Web Search** durante `openclaw onboard` u `openclaw configure --section web`, o establece:

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
  Para ver la configuración completa y los detalles de comportamiento, consulta [Ollama Web Search](/es/tools/ollama-search).
  </Note>

  ## Configuración avanzada

  <AccordionGroup>
  <Accordion title="Modo heredado compatible con OpenAI">
    <Warning>
    **Las llamadas a herramientas no son fiables en el modo compatible con OpenAI.** Usa este modo solo si necesitas el formato de OpenAI para un proxy y no dependes del comportamiento nativo de llamadas a herramientas.
    </Warning>

    Si necesitas usar en su lugar el endpoint compatible con OpenAI (por ejemplo, detrás de un proxy que solo admite el formato de OpenAI), define `api: "openai-completions"` explícitamente:

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

    Es posible que este modo no admita streaming y llamadas a herramientas simultáneamente. Puede que tengas que desactivar el streaming con `params: { streaming: false }` en la configuración del modelo.

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
    Para los modelos descubiertos automáticamente, OpenClaw usa la ventana de contexto indicada por Ollama cuando está disponible, incluidos valores `PARAMETER num_ctx` más grandes de Modelfiles personalizados. De lo contrario, recurre a la ventana de contexto predeterminada de Ollama que usa OpenClaw.

    Puedes definir valores predeterminados de `contextWindow`, `contextTokens` y `maxTokens` a nivel de proveedor para cada modelo bajo ese proveedor de Ollama, y luego sobrescribirlos por modelo cuando sea necesario. `contextWindow` es el presupuesto de prompt y Compaction de OpenClaw. Las solicitudes nativas de Ollama dejan `options.num_ctx` sin definir a menos que configures explícitamente `params.num_ctx`, para que Ollama pueda aplicar su propio valor predeterminado basado en el modelo, `OLLAMA_CONTEXT_LENGTH` o la VRAM. Para limitar o forzar el contexto de ejecución por solicitud de Ollama sin reconstruir un Modelfile, define `params.num_ctx`; los valores no válidos, cero, negativos y no finitos se ignoran. Si actualizaste una configuración antigua que usaba solo `contextWindow` o `maxTokens` para forzar un contexto de solicitud nativo de Ollama, ejecuta `openclaw doctor --fix` para copiar esos presupuestos explícitos de proveedor o modelo en `params.num_ctx`. El adaptador de Ollama compatible con OpenAI aún inyecta `options.num_ctx` de forma predeterminada desde el `params.num_ctx` o `contextWindow` configurado; desactívalo con `injectNumCtxForOpenAICompat: false` si tu upstream rechaza `options`.

    Las entradas de modelos nativos de Ollama también aceptan las opciones comunes de ejecución de Ollama bajo `params`, incluidas `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` y `use_mmap`. OpenClaw reenvía solo claves de solicitud de Ollama, por lo que los parámetros de ejecución de OpenClaw como `streaming` no se filtran a Ollama. Usa `params.think` o `params.thinking` para enviar `think` de nivel superior de Ollama; `false` desactiva el pensamiento a nivel de API para modelos de pensamiento de estilo Qwen.

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
    Para los modelos nativos de Ollama, OpenClaw reenvía el control de pensamiento como Ollama lo espera: `think` de nivel superior, no `options.think`. Los modelos descubiertos automáticamente cuya respuesta de `/api/show` incluye la capacidad `thinking` exponen `/think low`, `/think medium`, `/think high` y `/think max`; los modelos sin pensamiento exponen solo `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    También puedes definir un valor predeterminado para el modelo:

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

    `params.think` o `params.thinking` por modelo puede desactivar o forzar el pensamiento de la API de Ollama para un modelo configurado específico. OpenClaw conserva esos parámetros explícitos del modelo cuando la ejecución activa solo tiene el valor predeterminado implícito `off`; los comandos de ejecución que no son `off`, como `/think medium`, siguen sobrescribiendo la ejecución activa.

  </Accordion>

  <Accordion title="Modelos de razonamiento">
    OpenClaw trata los modelos con nombres como `deepseek-r1`, `reasoning` o `think` como capaces de razonamiento de forma predeterminada.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    No se necesita configuración adicional. OpenClaw los marca automáticamente.

  </Accordion>

  <Accordion title="Costos de modelos">
    Ollama es gratis y se ejecuta localmente, por lo que todos los costos de modelos se establecen en $0. Esto se aplica tanto a los modelos descubiertos automáticamente como a los definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memoria">
    El plugin Ollama incluido registra un proveedor de embeddings de memoria para
    [búsqueda de memoria](/es/concepts/memory). Usa la URL base de Ollama
    y la clave de API configuradas, llama al endpoint actual `/api/embed` de Ollama
    y agrupa varios fragmentos de memoria en una solicitud `input` cuando es posible.

    Cuando `proxy.enabled=true`, las solicitudes de embeddings de memoria de Ollama al origen
    host-local loopback exacto derivado de la `baseUrl` configurada usan
    la ruta directa protegida de OpenClaw en lugar del proxy reenviador administrado. El
    nombre de host configurado debe ser `localhost` o una IP literal de loopback;
    los nombres DNS que solo resuelven a loopback siguen usando la ruta del proxy administrado.
    Los hosts Ollama en LAN, tailnet, redes privadas y públicos también permanecen en la
    ruta del proxy administrado. Las redirecciones a otro host o puerto no heredan la confianza.
    Los operadores aún pueden establecer la opción global `proxy.loopbackMode: "proxy"` para
    enviar el tráfico de loopback a través del proxy, o `proxy.loopbackMode: "block"`
    para denegar conexiones de loopback antes de abrir una conexión; consulta
    [Proxy administrado](/es/security/network-proxy#gateway-loopback-mode) para ver el
    efecto de esta opción en todo el proceso.

    | Propiedad             | Valor               |
    | --------------------- | ------------------- |
    | Modelo predeterminado | `nomic-embed-text`  |
    | Autoextracción        | Sí — el modelo de embeddings se extrae automáticamente si no está presente localmente |

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
    La integración de Ollama de OpenClaw usa la **API nativa de Ollama** (`/api/chat`) de forma predeterminada, que admite por completo streaming y llamadas a herramientas simultáneamente. No se necesita configuración especial.

    Para solicitudes nativas de `/api/chat`, OpenClaw también reenvía el control de pensamiento directamente a Ollama: `/think off` y `openclaw agent --thinking off` envían `think: false` de nivel superior salvo que se configure un valor explícito de modelo `params.think`/`params.thinking`, mientras que `/think low|medium|high` envían la cadena de esfuerzo `think` de nivel superior correspondiente. `/think max` se asigna al esfuerzo nativo más alto de Ollama, `think: "high"`.

    <Tip>
    Si necesitas usar el endpoint compatible con OpenAI, consulta la sección "Modo heredado compatible con OpenAI" anterior. Es posible que streaming y las llamadas a herramientas no funcionen simultáneamente en ese modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Bucle de fallos de WSL2 (reinicios repetidos)">
    En WSL2 con NVIDIA/CUDA, el instalador oficial de Ollama para Linux crea una unidad systemd `ollama.service` con `Restart=always`. Si ese servicio se inicia automáticamente y carga un modelo respaldado por GPU durante el arranque de WSL2, Ollama puede fijar memoria del host mientras se carga el modelo. La recuperación de memoria de Hyper-V no siempre puede recuperar esas páginas fijadas, por lo que Windows puede terminar la VM de WSL2, systemd vuelve a iniciar Ollama y el bucle se repite.

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

    Configura un keep-alive más corto en el entorno del servicio Ollama, o inicia Ollama manualmente solo cuando lo necesites:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consulta [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama no detectado">
    Asegúrate de que Ollama esté en ejecución, de haber establecido `OLLAMA_API_KEY` (o un perfil de autenticación) y de que **no** hayas definido una entrada explícita `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifica que la API sea accesible:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No hay modelos disponibles">
    Si tu modelo no aparece en la lista, extrae el modelo localmente o defínelo explícitamente en `models.providers.ollama`.

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
    Verifica desde la misma máquina y runtime que ejecutan el Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Causas comunes:

    - `baseUrl` apunta a `localhost`, pero el Gateway se ejecuta en Docker o en otro host.
    - La URL usa `/v1`, lo que selecciona el comportamiento compatible con OpenAI en lugar del Ollama nativo.
    - El host remoto necesita cambios de firewall o vinculación LAN en el lado de Ollama.
    - El modelo está presente en el daemon de tu portátil, pero no en el daemon remoto.

  </Accordion>

  <Accordion title="El modelo emite JSON de herramienta como texto">
    Esto suele significar que el proveedor está usando el modo compatible con OpenAI o que el modelo no puede manejar esquemas de herramientas.

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
    Las respuestas alojadas de Kimi/GLM que son largas secuencias de símbolos no lingüísticos se tratan como salida fallida del proveedor en lugar de una respuesta exitosa del asistente. Eso permite que el reintento, fallback o manejo de errores normal tome el control sin persistir el texto corrupto en la sesión.

    Si ocurre repetidamente, captura el nombre de modelo sin procesar, el archivo de sesión actual y si la ejecución usó `Cloud + Local` o `Cloud only`; luego prueba una sesión nueva y un modelo de fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="El modelo local en frío agota el tiempo de espera">
    Los modelos locales grandes pueden necesitar una primera carga larga antes de que empiece el streaming. Mantén el tiempo de espera limitado al proveedor Ollama y, opcionalmente, pide a Ollama que mantenga el modelo cargado entre turnos:

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

    Si el propio host tarda en aceptar conexiones, `timeoutSeconds` también extiende el tiempo de espera de conexión Undici protegido para este proveedor.

  </Accordion>

  <Accordion title="El modelo de contexto grande es demasiado lento o se queda sin memoria">
    Muchos modelos Ollama anuncian contextos más grandes de lo que tu hardware puede ejecutar cómodamente. Ollama nativo usa el valor predeterminado de contexto del propio runtime de Ollama salvo que establezcas `params.num_ctx`. Limita tanto el presupuesto de OpenClaw como el contexto de solicitud de Ollama cuando quieras una latencia predecible hasta el primer token:

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

    Reduce primero `contextWindow` si OpenClaw está enviando demasiado prompt. Reduce `params.num_ctx` si Ollama está cargando un contexto de runtime demasiado grande para la máquina. Reduce `maxTokens` si la generación dura demasiado.

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [FAQ](/es/help/faq).
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
