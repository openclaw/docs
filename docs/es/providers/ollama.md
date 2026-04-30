---
read_when:
    - Desea ejecutar OpenClaw con modelos en la nube o locales mediante Ollama
    - Necesitas orientación sobre la instalación y configuración de Ollama
    - Quieres modelos de visión de Ollama para la comprensión de imágenes
summary: Ejecutar OpenClaw con Ollama (modelos en la nube y locales)
title: Ollama
x-i18n:
    generated_at: "2026-04-30T05:58:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eeaebc0ba72f72a0dee842f7d983a552c86cfa23271322d4740641124f57cfb
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw se integra con la API nativa de Ollama (`/api/chat`) para modelos en la nube alojados y servidores Ollama locales/autohospedados. Puedes usar Ollama en tres modos: `Cloud + Local` mediante un host de Ollama accesible, `Cloud only` contra `https://ollama.com`, o `Local only` contra un host de Ollama accesible.

<Warning>
**Usuarios de Ollama remoto**: No uses la URL compatible con OpenAI `/v1` (`http://host:11434/v1`) con OpenClaw. Esto rompe la llamada a herramientas y los modelos pueden generar JSON de herramientas sin procesar como texto plano. Usa en su lugar la URL de la API nativa de Ollama: `baseUrl: "http://host:11434"` (sin `/v1`).
</Warning>

La configuración del proveedor de Ollama usa `baseUrl` como clave canónica. OpenClaw también acepta `baseURL` para compatibilidad con ejemplos de estilo del SDK de OpenAI, pero la configuración nueva debería preferir `baseUrl`.

## Reglas de autenticación

<AccordionGroup>
  <Accordion title="Hosts locales y LAN">
    Los hosts de Ollama locales y LAN no necesitan un token bearer real. OpenClaw usa el marcador local `ollama-local` solo para URLs base de Ollama de loopback, red privada, `.local` y nombres de host simples.
  </Accordion>
  <Accordion title="Hosts remotos y de Ollama Cloud">
    Los hosts públicos remotos y Ollama Cloud (`https://ollama.com`) requieren una credencial real mediante `OLLAMA_API_KEY`, un perfil de autenticación o el `apiKey` del proveedor.
  </Accordion>
  <Accordion title="IDs de proveedor personalizados">
    Los IDs de proveedor personalizados que establecen `api: "ollama"` siguen las mismas reglas. Por ejemplo, un proveedor `ollama-remote` que apunta a un host de Ollama en una LAN privada puede usar `apiKey: "ollama-local"` y los subagentes resolverán ese marcador mediante el hook del proveedor de Ollama en lugar de tratarlo como una credencial faltante. La búsqueda de memoria también puede establecer `agents.defaults.memorySearch.provider` en ese ID de proveedor personalizado para que los embeddings usen el endpoint de Ollama correspondiente.
  </Accordion>
  <Accordion title="Perfiles de autenticación">
    `auth-profiles.json` almacena la credencial para un ID de proveedor. Pon los ajustes del endpoint (`baseUrl`, `api`, IDs de modelo, encabezados, tiempos de espera) en `models.providers.<id>`. Los archivos de perfil de autenticación planos antiguos, como `{ "ollama-windows": { "apiKey": "ollama-local" } }`, no son un formato de runtime; ejecuta `openclaw doctor --fix` para reescribirlos al perfil canónico de clave de API `ollama-windows:default` con una copia de seguridad. `baseUrl` en ese archivo es ruido de compatibilidad y debería moverse a la configuración del proveedor.
  </Accordion>
  <Accordion title="Alcance de embeddings de memoria">
    Cuando Ollama se usa para embeddings de memoria, la autenticación bearer se limita al host donde fue declarada:

    - Una clave de nivel de proveedor se envía solo al host de Ollama de ese proveedor.
    - `agents.*.memorySearch.remote.apiKey` se envía solo a su host remoto de embeddings.
    - Un valor de entorno puro `OLLAMA_API_KEY` se trata como la convención de Ollama Cloud, y no se envía de forma predeterminada a hosts locales o autohospedados.

  </Accordion>
</AccordionGroup>

## Primeros pasos

Elige tu método y modo de configuración preferidos.

<Tabs>
  <Tab title="Onboarding (recomendado)">
    **Ideal para:** la ruta más rápida hacia una configuración de Ollama en la nube o local funcional.

    <Steps>
      <Step title="Ejecuta el onboarding">
        ```bash
        openclaw onboard
        ```

        Selecciona **Ollama** en la lista de proveedores.
      </Step>
      <Step title="Elige tu modo">
        - **Nube + Local** — host local de Ollama más modelos en la nube enrutados mediante ese host
        - **Solo nube** — modelos de Ollama alojados mediante `https://ollama.com`
        - **Solo local** — solo modelos locales

      </Step>
      <Step title="Selecciona un modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` y sugiere valores predeterminados alojados en la nube. `Cloud + Local` y `Local only` piden una URL base de Ollama, descubren los modelos disponibles y descargan automáticamente el modelo local seleccionado si todavía no está disponible. Cuando Ollama informa una etiqueta `:latest` instalada, como `gemma4:latest`, la configuración muestra ese modelo instalado una sola vez en lugar de mostrar tanto `gemma4` como `gemma4:latest` o volver a descargar el alias simple. `Cloud + Local` también comprueba si ese host de Ollama tiene sesión iniciada para acceso a la nube.
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
        - **Nube + Local**: instala Ollama, inicia sesión con `ollama signin` y enruta las solicitudes en la nube mediante ese host
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
      <Step title="Inspecciona y establece tu modelo">
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
  <Tab title="Nube + Local">
    `Cloud + Local` usa un host de Ollama accesible como punto de control tanto para modelos locales como en la nube. Este es el flujo híbrido preferido de Ollama.

    Usa **Nube + Local** durante la configuración. OpenClaw solicita la URL base de Ollama, descubre modelos locales desde ese host y comprueba si el host tiene sesión iniciada para acceso a la nube con `ollama signin`. Cuando el host tiene sesión iniciada, OpenClaw también sugiere valores predeterminados alojados en la nube, como `kimi-k2.5:cloud`, `minimax-m2.7:cloud` y `glm-5.1:cloud`.

    Si el host aún no tiene sesión iniciada, OpenClaw mantiene la configuración como solo local hasta que ejecutes `ollama signin`.

  </Tab>

  <Tab title="Solo nube">
    `Cloud only` se ejecuta contra la API alojada de Ollama en `https://ollama.com`.

    Usa **Solo nube** durante la configuración. OpenClaw solicita `OLLAMA_API_KEY`, establece `baseUrl: "https://ollama.com"` y precarga la lista de modelos alojados en la nube. Esta ruta **no** requiere un servidor local de Ollama ni `ollama signin`.

    La lista de modelos en la nube que se muestra durante `openclaw onboard` se rellena en vivo desde `https://ollama.com/api/tags`, con un límite de 500 entradas, de modo que el selector refleje el catálogo alojado actual en lugar de una lista inicial estática. Si `ollama.com` no es accesible o no devuelve modelos durante la configuración, OpenClaw vuelve a las sugerencias codificadas anteriores para que el onboarding pueda completarse igualmente.

  </Tab>

  <Tab title="Solo local">
    En el modo solo local, OpenClaw descubre modelos desde la instancia de Ollama configurada. Esta ruta es para servidores Ollama locales o autohospedados.

    OpenClaw actualmente sugiere `gemma4` como valor predeterminado local.

  </Tab>
</Tabs>

## Descubrimiento de modelos (proveedor implícito)

Cuando estableces `OLLAMA_API_KEY` (o un perfil de autenticación) y **no** defines `models.providers.ollama` u otro proveedor remoto personalizado con `api: "ollama"`, OpenClaw descubre modelos desde la instancia local de Ollama en `http://127.0.0.1:11434`.

| Comportamiento       | Detalle                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta de catálogo | Consulta `/api/tags`                                                                                                                                                |
| Detección de capacidades | Usa búsquedas de mejor esfuerzo en `/api/show` para leer `contextWindow`, parámetros Modelfile `num_ctx` expandidos y capacidades, incluida visión/herramientas |
| Modelos de visión    | Los modelos con una capacidad `vision` informada por `/api/show` se marcan como compatibles con imágenes (`input: ["text", "image"]`), por lo que OpenClaw inyecta imágenes automáticamente en el prompt |
| Detección de razonamiento | Usa capacidades de `/api/show` cuando están disponibles, incluido `thinking`; recurre a una heurística de nombre de modelo (`r1`, `reasoning`, `think`) cuando Ollama omite capacidades |
| Límites de tokens    | Establece `maxTokens` en el límite predeterminado de tokens máximos de Ollama usado por OpenClaw                                                                     |
| Costos               | Establece todos los costos en `0`                                                                                                                                   |

Esto evita entradas manuales de modelos mientras mantiene el catálogo alineado con la instancia local de Ollama. Puedes usar una referencia completa como `ollama/<pulled-model>:latest` en `infer model run` local; OpenClaw resuelve ese modelo instalado desde el catálogo en vivo de Ollama sin requerir una entrada `models.json` escrita a mano.

Para hosts de Ollama con sesión iniciada, algunos modelos `:cloud` pueden ser utilizables mediante `/api/chat`
y `/api/show` antes de que aparezcan en `/api/tags`. Cuando seleccionas explícitamente una
referencia completa `ollama/<model>:cloud`, OpenClaw valida ese modelo faltante exacto con
`/api/show` y lo agrega al catálogo de runtime solo si Ollama confirma los
metadatos del modelo. Los errores tipográficos siguen fallando como modelos desconocidos en lugar de crearse automáticamente.

```bash
# See what models are available
ollama list
openclaw models list
```

Para una prueba de humo acotada de generación de texto que evita toda la superficie de herramientas del agente,
usa `infer model run` local con una referencia completa de modelo de Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Esa ruta sigue usando el proveedor configurado de OpenClaw, la autenticación y el transporte
nativo de Ollama, pero no inicia un turno de agente de chat ni carga contexto de MCP/herramientas. Si
esto funciona mientras las respuestas normales del agente fallan, diagnostica después la capacidad del modelo para
prompts de agente/herramientas.

Para una prueba de humo acotada de modelo de visión en la misma ruta ligera, agrega uno o más
archivos de imagen a `infer model run`. Esto envía el prompt y la imagen directamente al
modelo de visión de Ollama seleccionado sin cargar herramientas de chat, memoria ni contexto
de sesión previo:

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
JPEG y WebP. Los archivos que no son imagen se rechazan antes de llamar a Ollama.
Para reconocimiento de voz, usa `openclaw infer audio transcribe` en su lugar.

Cuando cambias una conversación con `/model ollama/<model>`, OpenClaw trata
eso como una selección exacta del usuario. Si el `baseUrl` de Ollama configurado no es
accesible, la siguiente respuesta falla con el error del proveedor en lugar de responder silenciosamente
desde otro modelo de respaldo configurado.

Los trabajos Cron aislados realizan una comprobación de seguridad local adicional antes de iniciar el turno del agente. Si el modelo seleccionado se resuelve a un proveedor Ollama local, de red privada o `.local` y no se puede acceder a `/api/tags`, OpenClaw registra esa ejecución de Cron como `skipped` con el `ollama/<model>` seleccionado en el texto del error. La comprobación previa del endpoint se almacena en caché durante 5 minutos, por lo que varios trabajos Cron apuntados al mismo demonio Ollama detenido no lanzan todos solicitudes de modelo fallidas.

Verifica en vivo la ruta de texto local, la ruta de stream nativa y los embeddings contra Ollama local con:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para agregar un modelo nuevo, simplemente descárgalo con Ollama:

```bash
ollama pull mistral
```

El modelo nuevo se descubrirá automáticamente y estará disponible para usarlo.

<Note>
Si configuras `models.providers.ollama` explícitamente, o configuras un proveedor remoto personalizado como `models.providers.ollama-cloud` con `api: "ollama"`, se omite el descubrimiento automático y debes definir los modelos manualmente. Los proveedores personalizados de loopback como `http://127.0.0.2:11434` se siguen tratando como locales. Consulta la sección de configuración explícita más abajo.
</Note>

## Visión y descripción de imágenes

El Plugin Ollama incluido registra Ollama como un proveedor de comprensión de medios con capacidad para imágenes. Esto permite que OpenClaw dirija solicitudes explícitas de descripción de imágenes y valores predeterminados configurados de modelos de imagen a través de modelos de visión Ollama locales o alojados.

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

`--model` debe ser una referencia completa `<provider/model>`. Cuando se establece, `openclaw infer image describe` ejecuta ese modelo directamente en lugar de omitir la descripción porque el modelo admite visión nativa.

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

Prefiere la referencia completa `ollama/<model>`. Si el mismo modelo figura en `models.providers.ollama.models` con `input: ["text", "image"]` y ningún otro proveedor de imágenes configurado expone ese ID de modelo sin prefijo, OpenClaw también normaliza una referencia `imageModel` sin prefijo como `qwen2.5vl:7b` a `ollama/qwen2.5vl:7b`. Si más de un proveedor de imágenes configurado tiene el mismo ID sin prefijo, usa el prefijo del proveedor explícitamente.

Los modelos de visión locales lentos pueden necesitar un timeout de comprensión de imágenes más largo que los modelos en la nube. También pueden fallar o detenerse cuando Ollama intenta asignar todo el contexto de visión anunciado en hardware limitado. Establece un timeout de capacidad y limita `num_ctx` en la entrada del modelo cuando solo necesites un turno normal de descripción de imagen:

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

Este timeout se aplica a la comprensión de imágenes entrantes y a la herramienta explícita `image` que el agente puede llamar durante un turno. `models.providers.ollama.timeoutSeconds` a nivel de proveedor sigue controlando la protección de la solicitud HTTP subyacente de Ollama para llamadas normales al modelo.

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

OpenClaw rechaza las solicitudes de descripción de imágenes para modelos que no están marcados como compatibles con imágenes. Con el descubrimiento implícito, OpenClaw lee esto de Ollama cuando `/api/show` informa una capacidad de visión.

## Configuración

<Tabs>
  <Tab title="Básica (descubrimiento implícito)">
    La ruta de habilitación local más sencilla es mediante variable de entorno:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` está establecida, puedes omitir `apiKey` en la entrada del proveedor y OpenClaw la completará para las comprobaciones de disponibilidad.
    </Tip>

  </Tab>

  <Tab title="Explícita (modelos manuales)">
    Usa configuración explícita cuando quieras una configuración de nube alojada, Ollama se ejecute en otro host/puerto, quieras forzar ventanas de contexto o listas de modelos específicas, o quieras definiciones de modelos totalmente manuales.

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
    Si Ollama se ejecuta en un host o puerto diferente (la configuración explícita deshabilita el descubrimiento automático, así que define los modelos manualmente):

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

Usa estas como puntos de partida y reemplaza los ID de modelo por los nombres exactos de `ollama list` o `openclaw models list --provider ollama`.

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

  <Accordion title="Host Ollama LAN con modelos manuales">
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
    Usa esto cuando no ejecutes un demonio local y quieras modelos Ollama alojados directamente.

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

  <Accordion title="Nube más local a través de un demonio con sesión iniciada">
    Usa esto cuando un demonio Ollama local o LAN haya iniciado sesión con `ollama signin` y deba servir tanto modelos locales como modelos `:cloud`.

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
    Usa ID de proveedores personalizados cuando tengas más de un servidor Ollama. Cada proveedor obtiene su propio host, modelos, autenticación, timeout y referencias de modelo.

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

    Cuando OpenClaw envía la solicitud, se elimina el prefijo del proveedor activo para que `ollama-large/qwen3.5:27b` llegue a Ollama como `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Perfil de modelo local ligero">
    Algunos modelos locales pueden responder prompts simples, pero tienen dificultades con toda la superficie de herramientas del agente. Empieza limitando las herramientas y el contexto antes de cambiar la configuración global del runtime.

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
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

    Usa `compat.supportsTools: false` solo cuando el modelo o el servidor falla de forma fiable con los esquemas de herramientas. Intercambia capacidad del agente por estabilidad.
    `localModelLean` elimina las herramientas de navegador, Cron y mensajes de la superficie del agente, pero no cambia el contexto de tiempo de ejecución ni el modo de pensamiento de Ollama. Combínalo con `params.num_ctx` explícito y `params.thinking: false` para modelos de pensamiento pequeños de estilo Qwen que entran en bucle o gastan su presupuesto de respuesta en razonamiento oculto.

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

También se admiten ids de proveedor de Ollama personalizados. Cuando una referencia de modelo usa el prefijo del proveedor activo, como `ollama-spark/qwen3:32b`, OpenClaw elimina solo ese prefijo antes de llamar a Ollama para que el servidor reciba `qwen3:32b`.

Para modelos locales lentos, prefiere el ajuste de solicitudes con ámbito de proveedor antes de aumentar el tiempo de espera de ejecución de todo el agente:

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

`timeoutSeconds` se aplica a la solicitud HTTP del modelo, incluida la configuración de la conexión, los encabezados, el streaming del cuerpo y el aborto total protegido de la obtención. `params.keep_alive` se reenvía a Ollama como `keep_alive` de nivel superior en solicitudes nativas `/api/chat`; configúralo por modelo cuando el tiempo de carga del primer turno sea el cuello de botella.

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

Para hosts remotos, reemplaza `127.0.0.1` por el host usado en `baseUrl`. Si `curl` funciona pero OpenClaw no, comprueba si el Gateway se ejecuta en otra máquina, contenedor o cuenta de servicio.

## Búsqueda web de Ollama

OpenClaw admite **Búsqueda web de Ollama** como proveedor `web_search` incluido.

| Propiedad   | Detalle                                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | Usa tu host de Ollama configurado (`models.providers.ollama.baseUrl` cuando está definido; de lo contrario, `http://127.0.0.1:11434`); `https://ollama.com` usa directamente la API alojada |
| Autenticación | Sin clave para hosts locales de Ollama con sesión iniciada; `OLLAMA_API_KEY` o autenticación de proveedor configurada para búsqueda directa en `https://ollama.com` o hosts protegidos por autenticación |
| Requisito   | Los hosts locales/autohospedados deben estar en ejecución y con sesión iniciada mediante `ollama signin`; la búsqueda alojada directa requiere `baseUrl: "https://ollama.com"` más una clave de API real de Ollama |

Elige **Búsqueda web de Ollama** durante `openclaw onboard` o `openclaw configure --section web`, o configura:

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

Para búsqueda alojada directa a través de Ollama Cloud:

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
    **La llamada a herramientas no es fiable en el modo compatible con OpenAI.** Usa este modo solo si necesitas el formato de OpenAI para un proxy y no dependes del comportamiento nativo de llamada a herramientas.
    </Warning>

    Si necesitas usar en su lugar el endpoint compatible con OpenAI (por ejemplo, detrás de un proxy que solo admite el formato de OpenAI), configura `api: "openai-completions"` explícitamente:

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

    Es posible que este modo no admita streaming y llamada a herramientas simultáneamente. Puede que tengas que desactivar el streaming con `params: { streaming: false }` en la configuración del modelo.

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
    Para modelos descubiertos automáticamente, OpenClaw usa la ventana de contexto informada por Ollama cuando está disponible, incluidos valores `PARAMETER num_ctx` mayores de Modelfiles personalizados. De lo contrario, vuelve a la ventana de contexto predeterminada de Ollama usada por OpenClaw.

    Puedes establecer valores predeterminados de `contextWindow`, `contextTokens` y `maxTokens` a nivel de proveedor para cada modelo bajo ese proveedor de Ollama, y luego sobrescribirlos por modelo cuando sea necesario. `contextWindow` es el presupuesto de prompt y Compaction de OpenClaw. Las solicitudes nativas de Ollama dejan `options.num_ctx` sin configurar a menos que configures explícitamente `params.num_ctx`, para que Ollama pueda aplicar su propio valor predeterminado basado en el modelo, `OLLAMA_CONTEXT_LENGTH` o VRAM. Para limitar o forzar el contexto de ejecución por solicitud de Ollama sin reconstruir un Modelfile, configura `params.num_ctx`; los valores no válidos, cero, negativos y no finitos se ignoran. El adaptador compatible con OpenAI para Ollama sigue inyectando `options.num_ctx` de forma predeterminada desde el `params.num_ctx` o `contextWindow` configurado; desactívalo con `injectNumCtxForOpenAICompat: false` si tu upstream rechaza `options`.

    Las entradas de modelos nativos de Ollama también aceptan las opciones comunes de ejecución de Ollama bajo `params`, incluidas `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` y `use_mmap`. OpenClaw reenvía solo claves de solicitud de Ollama, por lo que los params de ejecución de OpenClaw como `streaming` no se filtran a Ollama. Usa `params.think` o `params.thinking` para enviar `think` de nivel superior de Ollama; `false` desactiva el pensamiento a nivel de API para modelos de pensamiento de estilo Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` por modelo también funciona. Si ambos están configurados, la entrada explícita de modelo del proveedor gana sobre el valor predeterminado del agente.

  </Accordion>

  <Accordion title="Control de pensamiento">
    Para modelos nativos de Ollama, OpenClaw reenvía el control de pensamiento como Ollama lo espera: `think` de nivel superior, no `options.think`. Los modelos descubiertos automáticamente cuya respuesta `/api/show` incluye la capacidad `thinking` exponen `/think low`, `/think medium`, `/think high` y `/think max`; los modelos sin pensamiento exponen solo `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    También puedes establecer un valor predeterminado de modelo:

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

    `params.think` o `params.thinking` por modelo puede desactivar o forzar el pensamiento de la API de Ollama para un modelo configurado específico. OpenClaw conserva esos params explícitos del modelo cuando la ejecución activa solo tiene el valor predeterminado implícito `off`; los comandos de ejecución no `off` como `/think medium` siguen sobrescribiendo la ejecución activa.

  </Accordion>

  <Accordion title="Modelos de razonamiento">
    OpenClaw trata los modelos con nombres como `deepseek-r1`, `reasoning` o `think` como capaces de razonamiento de forma predeterminada.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    No se necesita configuración adicional. OpenClaw los marca automáticamente.

  </Accordion>

  <Accordion title="Costos de modelos">
    Ollama es gratuito y se ejecuta localmente, por lo que todos los costos de modelos se establecen en $0. Esto se aplica tanto a los modelos descubiertos automáticamente como a los definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memoria">
    El Plugin de Ollama incluido registra un proveedor de embeddings de memoria para
    [búsqueda de memoria](/es/concepts/memory). Usa la URL base de Ollama configurada
    y la clave de API, llama al endpoint actual `/api/embed` de Ollama y agrupa
    varios fragmentos de memoria en una solicitud `input` cuando es posible.

    | Propiedad        | Valor               |
    | ---------------- | ------------------- |
    | Modelo predeterminado | `nomic-embed-text`  |
    | Auto-pull        | Sí — el modelo de embeddings se descarga automáticamente si no está presente localmente |

    Los embeddings en tiempo de consulta usan prefijos de recuperación para modelos que los requieren o recomiendan, incluidos `nomic-embed-text`, `qwen3-embedding` y `mxbai-embed-large`. Los lotes de documentos de memoria permanecen sin procesar para que los índices existentes no necesiten una migración de formato.

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
    La integración de Ollama de OpenClaw usa la **API nativa de Ollama** (`/api/chat`) de forma predeterminada, lo que admite por completo streaming y llamadas a herramientas simultáneamente. No se necesita ninguna configuración especial.

    Para solicitudes nativas de `/api/chat`, OpenClaw también reenvía el control de razonamiento directamente a Ollama: `/think off` y `openclaw agent --thinking off` envían `think: false` en el nivel superior, salvo que se configure un valor explícito de modelo `params.think`/`params.thinking`, mientras que `/think low|medium|high` envían la cadena de esfuerzo `think` de nivel superior correspondiente. `/think max` se asigna al esfuerzo nativo más alto de Ollama, `think: "high"`.

    <Tip>
    Si necesitas usar el endpoint compatible con OpenAI, consulta la sección "Modo compatible con OpenAI heredado" anterior. Es posible que streaming y las llamadas a herramientas no funcionen simultáneamente en ese modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Bucle de bloqueo de WSL2 (reinicios repetidos)">
    En WSL2 con NVIDIA/CUDA, el instalador oficial de Ollama para Linux crea una unidad systemd `ollama.service` con `Restart=always`. Si ese servicio se inicia automáticamente y carga un modelo respaldado por GPU durante el arranque de WSL2, Ollama puede fijar memoria del host mientras se carga el modelo. La recuperación de memoria de Hyper-V no siempre puede recuperar esas páginas fijadas, por lo que Windows puede terminar la VM de WSL2, systemd vuelve a iniciar Ollama y el bucle se repite.

    Evidencia común:

    - reinicios o terminaciones repetidos de WSL2 desde el lado de Windows
    - CPU alta en `app.slice` o `ollama.service` poco después del inicio de WSL2
    - SIGTERM de systemd en lugar de un evento del OOM-killer de Linux

    OpenClaw registra una advertencia de inicio cuando detecta WSL2, `ollama.service` habilitado con `Restart=always` y marcadores CUDA visibles.

    Mitigación:

    ```bash
    sudo systemctl disable ollama
    ```

    Añade esto a `%USERPROFILE%\.wslconfig` en el lado de Windows y luego ejecuta `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Define un keep-alive más corto en el entorno del servicio Ollama, o inicia Ollama manualmente solo cuando lo necesites:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consulta [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama no detectado">
    Asegúrate de que Ollama esté en ejecución, de que hayas definido `OLLAMA_API_KEY` (o un perfil de autenticación) y de que **no** hayas definido una entrada explícita `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifica que se pueda acceder a la API:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No hay modelos disponibles">
    Si tu modelo no aparece en la lista, descarga el modelo localmente o defínelo explícitamente en `models.providers.ollama`.

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

  <Accordion title="El host remoto funciona con curl, pero no con OpenClaw">
    Verifica desde la misma máquina y runtime que ejecuta el Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Causas comunes:

    - `baseUrl` apunta a `localhost`, pero el Gateway se ejecuta en Docker o en otro host.
    - La URL usa `/v1`, lo que selecciona el comportamiento compatible con OpenAI en lugar de Ollama nativo.
    - El host remoto necesita cambios de firewall o de vinculación de LAN en el lado de Ollama.
    - El modelo está presente en el daemon de tu portátil, pero no en el daemon remoto.

  </Accordion>

  <Accordion title="El modelo genera JSON de herramientas como texto">
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

    Si un modelo local pequeño sigue fallando con esquemas de herramientas, define `compat.supportsTools: false` en esa entrada de modelo y vuelve a probar.

  </Accordion>

  <Accordion title="Kimi o GLM devuelve símbolos ilegibles">
    Las respuestas alojadas de Kimi/GLM que son largas secuencias de símbolos no lingüísticos se tratan como salida fallida del proveedor en lugar de una respuesta correcta del asistente. Eso permite que el reintento normal, la reserva o el manejo de errores tomen el control sin persistir el texto dañado en la sesión.

    Si ocurre repetidamente, captura el nombre de modelo sin procesar, el archivo de sesión actual y si la ejecución usó `Cloud + Local` o `Cloud only`; luego prueba una sesión nueva y un modelo de reserva:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="El modelo local en frío agota el tiempo de espera">
    Los modelos locales grandes pueden necesitar una primera carga larga antes de que comience el streaming. Mantén el tiempo de espera limitado al proveedor Ollama y, opcionalmente, pide a Ollama que mantenga el modelo cargado entre turnos:

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

    Si el propio host tarda en aceptar conexiones, `timeoutSeconds` también amplía el tiempo de espera de conexión protegido de Undici para este proveedor.

  </Accordion>

  <Accordion title="El modelo de contexto grande es demasiado lento o se queda sin memoria">
    Muchos modelos de Ollama anuncian contextos más grandes de lo que tu hardware puede ejecutar cómodamente. Ollama nativo usa el contexto de runtime predeterminado de Ollama, salvo que definas `params.num_ctx`. Limita tanto el presupuesto de OpenClaw como el contexto de solicitud de Ollama cuando quieras una latencia predecible hasta el primer token:

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

    Reduce primero `contextWindow` si OpenClaw está enviando demasiado prompt. Reduce `params.num_ctx` si Ollama está cargando un contexto de runtime demasiado grande para la máquina. Reduce `maxTokens` si la generación tarda demasiado.

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [FAQ](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, referencias de modelos y comportamiento de conmutación por error.
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
