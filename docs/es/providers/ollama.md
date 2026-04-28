---
read_when:
    - Quieres ejecutar OpenClaw con modelos en la nube o locales mediante Ollama
    - Necesitas guía de configuración y ajuste de Ollama
    - Quieres modelos de visión de Ollama para comprensión de imágenes
summary: Ejecutar OpenClaw con Ollama (modelos en la nube y locales)
title: Ollama
x-i18n:
    generated_at: "2026-04-24T05:45:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9595459cc32ff81332b09a81388f84059f48e86039170078fd7f30ccd9b4e1f5
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw se integra con la API nativa de Ollama (`/api/chat`) para modelos alojados en la nube y servidores Ollama locales/autoalojados. Puedes usar Ollama en tres modos: `Cloud + Local` a través de un host Ollama accesible, `Cloud only` contra `https://ollama.com`, o `Local only` contra un host Ollama accesible.

<Warning>
**Usuarios de Ollama remoto**: no usen la URL compatible con OpenAI `/v1` (`http://host:11434/v1`) con OpenClaw. Esto rompe las llamadas de herramientas y los modelos pueden producir JSON bruto de herramientas como texto plano. Usa en su lugar la URL nativa de la API de Ollama: `baseUrl: "http://host:11434"` (sin `/v1`).
</Warning>

## Primeros pasos

Elige tu método y modo de configuración preferidos.

<Tabs>
  <Tab title="Onboarding (recomendado)">
    **Ideal para:** el camino más rápido a una configuración funcional de Ollama en la nube o local.

    <Steps>
      <Step title="Ejecutar onboarding">
        ```bash
        openclaw onboard
        ```

        Selecciona **Ollama** en la lista de proveedores.
      </Step>
      <Step title="Elegir tu modo">
        - **Cloud + Local** — host local de Ollama más modelos en la nube enrutados a través de ese host
        - **Cloud only** — modelos alojados de Ollama mediante `https://ollama.com`
        - **Local only** — solo modelos locales

      </Step>
      <Step title="Seleccionar un modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` y sugiere valores predeterminados alojados en la nube. `Cloud + Local` y `Local only` piden una URL base de Ollama, descubren los modelos disponibles y hacen auto-pull del modelo local seleccionado si aún no está disponible. `Cloud + Local` también comprueba si ese host Ollama ha iniciado sesión para acceso a la nube.
      </Step>
      <Step title="Verificar que el modelo está disponible">
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

    Opcionalmente, especifica una URL base o modelo personalizados:

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
        - **Cloud + Local**: instala Ollama, inicia sesión con `ollama signin` y enruta solicitudes en la nube a través de ese host
        - **Cloud only**: usa `https://ollama.com` con `OLLAMA_API_KEY`
        - **Local only**: instala Ollama desde [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Hacer pull de un modelo local (solo local)">
        ```bash
        ollama pull gemma4
        # o
        ollama pull gpt-oss:20b
        # o
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Habilitar Ollama para OpenClaw">
        Para `Cloud only`, usa tu `OLLAMA_API_KEY` real. Para configuraciones respaldadas por host, cualquier valor de marcador sirve:

        ```bash
        # Nube
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Solo local
        export OLLAMA_API_KEY="ollama-local"

        # O configúralo en tu archivo de configuración
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
  <Tab title="Cloud + Local">
    `Cloud + Local` usa un host Ollama accesible como punto de control tanto para modelos locales como en la nube. Este es el flujo híbrido preferido por Ollama.

    Usa **Cloud + Local** durante la configuración. OpenClaw solicita la URL base de Ollama, descubre los modelos locales de ese host y comprueba si el host ha iniciado sesión para acceso a la nube con `ollama signin`. Cuando el host ha iniciado sesión, OpenClaw también sugiere valores predeterminados alojados en la nube como `kimi-k2.5:cloud`, `minimax-m2.7:cloud` y `glm-5.1:cloud`.

    Si el host aún no ha iniciado sesión, OpenClaw mantiene la configuración en modo solo local hasta que ejecutes `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` se ejecuta contra la API alojada de Ollama en `https://ollama.com`.

    Usa **Cloud only** durante la configuración. OpenClaw solicita `OLLAMA_API_KEY`, establece `baseUrl: "https://ollama.com"` y siembra la lista de modelos alojados en la nube. Esta ruta **no** requiere un servidor local de Ollama ni `ollama signin`.

    La lista de modelos en la nube mostrada durante `openclaw onboard` se rellena dinámicamente desde `https://ollama.com/api/tags`, limitada a 500 entradas, para que el selector refleje el catálogo alojado actual y no una lista estática. Si `ollama.com` no es accesible o no devuelve modelos en el momento de la configuración, OpenClaw recurre a las sugerencias fijas anteriores para que onboarding siga completándose.

  </Tab>

  <Tab title="Local only">
    En modo solo local, OpenClaw descubre modelos desde la instancia configurada de Ollama. Esta ruta es para servidores Ollama locales o autoalojados.

    OpenClaw actualmente sugiere `gemma4` como valor predeterminado local.

  </Tab>
</Tabs>

## Descubrimiento de modelos (proveedor implícito)

Cuando defines `OLLAMA_API_KEY` (o un perfil de autenticación) y **no** defines `models.providers.ollama`, OpenClaw descubre modelos desde la instancia local de Ollama en `http://127.0.0.1:11434`.

| Comportamiento         | Detalle                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta de catálogo   | Consulta `/api/tags`                                                                                                                                                 |
| Detección de capacidades | Usa búsquedas de `/api/show` según mejor esfuerzo para leer `contextWindow` y detectar capacidades (incluida visión)                                             |
| Modelos de visión      | Los modelos con capacidad `vision` informada por `/api/show` se marcan como compatibles con imágenes (`input: ["text", "image"]`), por lo que OpenClaw auto-inyecta imágenes en el prompt |
| Detección de razonamiento | Marca `reasoning` con una heurística de nombre de modelo (`r1`, `reasoning`, `think`)                                                                           |
| Límites de tokens      | Establece `maxTokens` en el límite máximo de tokens predeterminado de Ollama usado por OpenClaw                                                                    |
| Costes                 | Establece todos los costes en `0`                                                                                                                                   |

Esto evita entradas manuales de modelo mientras mantiene el catálogo alineado con la instancia local de Ollama.

```bash
# Ver qué modelos están disponibles
ollama list
openclaw models list
```

Para agregar un modelo nuevo, simplemente haz pull con Ollama:

```bash
ollama pull mistral
```

El nuevo modelo se descubrirá automáticamente y estará disponible para usar.

<Note>
Si defines explícitamente `models.providers.ollama`, se omite el descubrimiento automático y debes definir los modelos manualmente. Consulta la sección de configuración explícita más abajo.
</Note>

## Visión y descripción de imágenes

El plugin incluido de Ollama registra Ollama como un proveedor de comprensión de medios compatible con imágenes. Esto permite a OpenClaw enrutar solicitudes explícitas de descripción de imágenes y los valores predeterminados configurados de modelos de imagen a través de modelos de visión de Ollama locales o alojados.

Para visión local, haz pull de un modelo que admita imágenes:

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

Para hacer de Ollama el modelo predeterminado de comprensión de imágenes para medios entrantes, configura `agents.defaults.imageModel`:

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

OpenClaw rechaza solicitudes de descripción de imágenes para modelos que no estén marcados como compatibles con imágenes. Con descubrimiento implícito, OpenClaw lee esto desde Ollama cuando `/api/show` informa una capacidad de visión.

## Configuración

<Tabs>
  <Tab title="Básica (descubrimiento implícito)">
    La ruta más simple para habilitar solo localmente es mediante variable de entorno:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` está definida, puedes omitir `apiKey` en la entrada del proveedor y OpenClaw la rellenará para las comprobaciones de disponibilidad.
    </Tip>

  </Tab>

  <Tab title="Explícita (modelos manuales)">
    Usa configuración explícita cuando quieras una configuración alojada en la nube, Ollama se ejecute en otro host/puerto, quieras forzar ventanas de contexto o listas de modelos específicas, o quieras definiciones totalmente manuales de modelos.

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
    Si Ollama se está ejecutando en otro host o puerto (la configuración explícita deshabilita el descubrimiento automático, así que define los modelos manualmente):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Sin /v1 - usa la URL nativa de la API de Ollama
            api: "ollama", // Establécelo explícitamente para garantizar comportamiento nativo de llamadas de herramientas
          },
        },
      },
    }
    ```

    <Warning>
    No agregues `/v1` a la URL. La ruta `/v1` usa el modo compatible con OpenAI, donde las llamadas de herramientas no son fiables. Usa la URL base de Ollama sin sufijo de ruta.
    </Warning>

  </Tab>
</Tabs>

### Selección de modelo

Una vez configurado, todos tus modelos de Ollama están disponibles:

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

## Ollama Web Search

OpenClaw admite **Ollama Web Search** como proveedor `web_search` incluido.

| Propiedad   | Detalle                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| Host        | Usa tu host configurado de Ollama (`models.providers.ollama.baseUrl` cuando está definido, en caso contrario `http://127.0.0.1:11434`) |
| Auth        | Sin clave                                                                                                         |
| Requisito   | Ollama debe estar en ejecución y haber iniciado sesión con `ollama signin`                                        |

Elige **Ollama Web Search** durante `openclaw onboard` o `openclaw configure --section web`, o establece:

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

<Note>
Para la configuración completa y los detalles de comportamiento, consulta [Ollama Web Search](/es/tools/ollama-search).
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo heredado compatible con OpenAI">
    <Warning>
    **Las llamadas de herramientas no son fiables en el modo compatible con OpenAI.** Usa este modo solo si necesitas formato OpenAI para un proxy y no dependes del comportamiento nativo de llamadas de herramientas.
    </Warning>

    Si necesitas usar en su lugar el endpoint compatible con OpenAI (por ejemplo, detrás de un proxy que solo admite formato OpenAI), establece `api: "openai-completions"` explícitamente:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // predeterminado: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Este modo puede no admitir streaming y llamadas de herramientas simultáneamente. Puede que tengas que deshabilitar el streaming con `params: { streaming: false }` en la configuración del modelo.

    Cuando se usa `api: "openai-completions"` con Ollama, OpenClaw inyecta `options.num_ctx` por defecto para que Ollama no recurra silenciosamente a una ventana de contexto de 4096. Si tu proxy/upstream rechaza campos `options` desconocidos, deshabilita este comportamiento:

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
    Para modelos descubiertos automáticamente, OpenClaw usa la ventana de contexto informada por Ollama cuando está disponible; en caso contrario recurre a la ventana de contexto predeterminada de Ollama usada por OpenClaw.

    Puedes sobrescribir `contextWindow` y `maxTokens` en la configuración explícita del proveedor:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Modelos de razonamiento">
    OpenClaw trata por defecto como compatibles con razonamiento a modelos con nombres como `deepseek-r1`, `reasoning` o `think`.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    No se necesita configuración adicional: OpenClaw los marca automáticamente.

  </Accordion>

  <Accordion title="Costes de modelo">
    Ollama es gratuito y se ejecuta localmente, así que todos los costes de modelo se establecen en $0. Esto se aplica tanto a modelos descubiertos automáticamente como a modelos definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memoria">
    El plugin incluido de Ollama registra un proveedor de embeddings de memoria para
    [memory search](/es/concepts/memory). Usa la URL base configurada de Ollama
    y la clave API.

    | Propiedad       | Valor               |
    | --------------- | ------------------- |
    | Modelo predeterminado | `nomic-embed-text`  |
    | Auto-pull       | Sí — el modelo de embeddings se descarga automáticamente si no está presente localmente |

    Para seleccionar Ollama como proveedor de embeddings para búsqueda en memoria:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuración de streaming">
    La integración de Ollama en OpenClaw usa por defecto la **API nativa de Ollama** (`/api/chat`), que admite completamente streaming y llamadas de herramientas simultáneamente. No hace falta ninguna configuración especial.

    Para solicitudes nativas `/api/chat`, OpenClaw también reenvía el control de thinking directamente a Ollama: `/think off` y `openclaw agent --thinking off` envían `think: false` de nivel superior, mientras que los niveles de thinking distintos de `off` envían `think: true`.

    <Tip>
    Si necesitas usar el endpoint compatible con OpenAI, consulta la sección "Modo heredado compatible con OpenAI" de arriba. El streaming y las llamadas de herramientas pueden no funcionar simultáneamente en ese modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Ollama no se detecta">
    Asegúrate de que Ollama se esté ejecutando, de que hayas establecido `OLLAMA_API_KEY` (o un perfil de autenticación) y de que **no** hayas definido una entrada explícita `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifica que la API sea accesible:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No hay modelos disponibles">
    Si tu modelo no aparece, haz pull del modelo localmente o defínelo explícitamente en `models.providers.ollama`.

    ```bash
    ollama list  # Ver qué está instalado
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # O cualquier otro modelo
    ```

  </Accordion>

  <Accordion title="Connection refused">
    Comprueba que Ollama se esté ejecutando en el puerto correcto:

    ```bash
    # Comprobar si Ollama se está ejecutando
    ps aux | grep ollama

    # O reiniciar Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [FAQ](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Ollama Web Search" href="/es/tools/ollama-search" icon="magnifying-glass">
    Configuración completa y detalles de comportamiento para web search con Ollama.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
