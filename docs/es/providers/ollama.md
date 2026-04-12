---
read_when:
    - Quieres ejecutar OpenClaw con modelos en la nube o locales mediante Ollama
    - Necesitas orientación para la configuración y el uso de Ollama
summary: Ejecutar OpenClaw con Ollama (modelos en la nube y locales)
title: Ollama
x-i18n:
    generated_at: "2026-04-12T23:32:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec796241b884ca16ec7077df4f3f1910e2850487bb3ea94f8fdb37c77e02b219
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama es un entorno de ejecución local de LLM que facilita ejecutar modelos de código abierto en tu equipo. OpenClaw se integra con la API nativa de Ollama (`/api/chat`), admite streaming y llamadas a herramientas, y puede descubrir automáticamente modelos locales de Ollama cuando activas `OLLAMA_API_KEY` (o un perfil de autenticación) y no defines una entrada explícita `models.providers.ollama`.

<Warning>
**Usuarios de Ollama remoto**: No uses la URL compatible con OpenAI `/v1` (`http://host:11434/v1`) con OpenClaw. Esto rompe las llamadas a herramientas y los modelos pueden generar JSON de herramientas sin procesar como texto plano. Usa la URL de la API nativa de Ollama en su lugar: `baseUrl: "http://host:11434"` (sin `/v1`).
</Warning>

## Primeros pasos

Elige tu método y modo de configuración preferidos.

<Tabs>
  <Tab title="Onboarding (recomendado)">
    **Ideal para:** la forma más rápida de tener una configuración de Ollama funcional con descubrimiento automático de modelos.

    <Steps>
      <Step title="Ejecutar onboarding">
        ```bash
        openclaw onboard
        ```

        Selecciona **Ollama** en la lista de proveedores.
      </Step>
      <Step title="Elegir el modo">
        - **Nube + local** — modelos alojados en la nube y modelos locales juntos
        - **Local** — solo modelos locales

        Si eliges **Nube + local** y no has iniciado sesión en ollama.com, el onboarding abre un flujo de inicio de sesión en el navegador.
      </Step>
      <Step title="Seleccionar un modelo">
        El onboarding descubre los modelos disponibles y sugiere valores predeterminados. Descarga automáticamente el modelo seleccionado si no está disponible localmente.
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
    **Ideal para:** control total sobre la instalación, la descarga de modelos y la configuración.

    <Steps>
      <Step title="Instalar Ollama">
        Descárgalo desde [ollama.com/download](https://ollama.com/download).
      </Step>
      <Step title="Descargar un modelo local">
        ```bash
        ollama pull gemma4
        # o
        ollama pull gpt-oss:20b
        # o
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Iniciar sesión para modelos en la nube (opcional)">
        Si también quieres modelos en la nube:

        ```bash
        ollama signin
        ```
      </Step>
      <Step title="Habilitar Ollama para OpenClaw">
        Establece cualquier valor para la clave de API (Ollama no requiere una clave real):

        ```bash
        # Establecer variable de entorno
        export OLLAMA_API_KEY="ollama-local"

        # O configurar en tu archivo de configuración
        openclaw config set models.providers.ollama.apiKey "ollama-local"
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
    Los modelos en la nube te permiten ejecutar modelos alojados en la nube junto con tus modelos locales. Algunos ejemplos incluyen `kimi-k2.5:cloud`, `minimax-m2.7:cloud` y `glm-5.1:cloud`; estos **no** requieren un `ollama pull` local.

    Selecciona el modo **Nube + local** durante la configuración. El asistente verifica si has iniciado sesión y abre un flujo de inicio de sesión en el navegador cuando es necesario. Si no se puede verificar la autenticación, el asistente recurre a los valores predeterminados de modelos locales.

    También puedes iniciar sesión directamente en [ollama.com/signin](https://ollama.com/signin).

    OpenClaw actualmente sugiere estos valores predeterminados en la nube: `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`.

  </Tab>

  <Tab title="Solo local">
    En el modo solo local, OpenClaw descubre modelos desde la instancia local de Ollama. No hace falta iniciar sesión en la nube.

    OpenClaw actualmente sugiere `gemma4` como valor predeterminado local.

  </Tab>
</Tabs>

## Descubrimiento de modelos (proveedor implícito)

Cuando estableces `OLLAMA_API_KEY` (o un perfil de autenticación) y **no** defines `models.providers.ollama`, OpenClaw descubre modelos desde la instancia local de Ollama en `http://127.0.0.1:11434`.

| Behavior             | Detail                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta de catálogo | Consulta `/api/tags`                                                                                                                                                 |
| Detección de capacidades | Usa búsquedas `/api/show` con el mejor esfuerzo para leer `contextWindow` y detectar capacidades (incluida visión)                                                             |
| Modelos de visión    | Los modelos con una capacidad `vision` informada por `/api/show` se marcan como compatibles con imágenes (`input: ["text", "image"]`), por lo que OpenClaw inyecta automáticamente imágenes en el prompt |
| Detección de razonamiento | Marca `reasoning` con una heurística basada en el nombre del modelo (`r1`, `reasoning`, `think`)                                                                                          |
| Límites de tokens    | Establece `maxTokens` en el límite máximo predeterminado de tokens de Ollama usado por OpenClaw                                                                                               |
| Costos               | Establece todos los costos en `0`                                                                                                                                               |

Esto evita entradas manuales de modelos y mantiene el catálogo alineado con la instancia local de Ollama.

```bash
# Ver qué modelos están disponibles
ollama list
openclaw models list
```

Para agregar un modelo nuevo, simplemente descárgalo con Ollama:

```bash
ollama pull mistral
```

El nuevo modelo se descubrirá automáticamente y estará disponible para usarse.

<Note>
Si defines `models.providers.ollama` explícitamente, se omite el descubrimiento automático y debes definir los modelos manualmente. Consulta la sección de configuración explícita más abajo.
</Note>

## Configuración

<Tabs>
  <Tab title="Básica (descubrimiento implícito)">
    La forma más sencilla de habilitar Ollama es mediante una variable de entorno:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` está establecido, puedes omitir `apiKey` en la entrada del proveedor y OpenClaw lo completará para las comprobaciones de disponibilidad.
    </Tip>

  </Tab>

  <Tab title="Explícita (modelos manuales)">
    Usa configuración explícita cuando Ollama se ejecute en otro host/puerto, quieras forzar ventanas de contexto o listas de modelos específicas, o quieras definiciones de modelos totalmente manuales.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            apiKey: "ollama-local",
            api: "ollama",
            models: [
              {
                id: "gpt-oss:20b",
                name: "GPT-OSS 20B",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 8192,
                maxTokens: 8192 * 10
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="URL base personalizada">
    Si Ollama se ejecuta en un host o puerto diferentes (la configuración explícita desactiva el descubrimiento automático, así que define los modelos manualmente):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Sin /v1: usa la URL de la API nativa de Ollama
            api: "ollama", // Establécelo explícitamente para garantizar el comportamiento nativo de llamadas a herramientas
          },
        },
      },
    }
    ```

    <Warning>
    No agregues `/v1` a la URL. La ruta `/v1` usa el modo compatible con OpenAI, en el que las llamadas a herramientas no son fiables. Usa la URL base de Ollama sin un sufijo de ruta.
    </Warning>

  </Tab>
</Tabs>

### Selección de modelo

Una vez configurado, todos tus modelos de Ollama estarán disponibles:

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

## Búsqueda web de Ollama

OpenClaw admite **Ollama Web Search** como proveedor integrado `web_search`.

| Property    | Detail                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| Host        | Usa tu host configurado de Ollama (`models.providers.ollama.baseUrl` cuando está definido; en caso contrario `http://127.0.0.1:11434`) |
| Autenticación | No requiere clave                                                                                                          |
| Requisito   | Ollama debe estar ejecutándose y con sesión iniciada mediante `ollama signin`                                                         |

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
Para ver la configuración completa y los detalles de comportamiento, consulta [Ollama Web Search](/es/tools/ollama-search).
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo heredado compatible con OpenAI">
    <Warning>
    **Las llamadas a herramientas no son fiables en el modo compatible con OpenAI.** Usa este modo solo si necesitas el formato OpenAI para un proxy y no dependes del comportamiento nativo de llamadas a herramientas.
    </Warning>

    Si necesitas usar el endpoint compatible con OpenAI en su lugar (por ejemplo, detrás de un proxy que solo admita formato OpenAI), establece `api: "openai-completions"` explícitamente:

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

    Es posible que este modo no admita streaming y llamadas a herramientas simultáneamente. Puede que debas deshabilitar el streaming con `params: { streaming: false }` en la configuración del modelo.

    Cuando se usa `api: "openai-completions"` con Ollama, OpenClaw inyecta `options.num_ctx` de forma predeterminada para que Ollama no vuelva silenciosamente a una ventana de contexto de 4096. Si tu proxy/upstream rechaza campos `options` desconocidos, deshabilita este comportamiento:

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
    Para modelos descubiertos automáticamente, OpenClaw usa la ventana de contexto informada por Ollama cuando está disponible; en caso contrario, recurre a la ventana de contexto predeterminada de Ollama usada por OpenClaw.

    Puedes reemplazar `contextWindow` y `maxTokens` en la configuración explícita del proveedor:

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
    OpenClaw trata de forma predeterminada los modelos con nombres como `deepseek-r1`, `reasoning` o `think` como compatibles con razonamiento.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    No se necesita configuración adicional: OpenClaw los marca automáticamente.

  </Accordion>

  <Accordion title="Costos de los modelos">
    Ollama es gratuito y se ejecuta localmente, por lo que todos los costos de los modelos se establecen en $0. Esto se aplica tanto a los modelos descubiertos automáticamente como a los definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memoria">
    El Plugin integrado de Ollama registra un proveedor de embeddings de memoria para
    [búsqueda en memoria](/es/concepts/memory). Usa la URL base
    y la clave de API configuradas de Ollama.

    | Property      | Value               |
    | ------------- | ------------------- |
    | Modelo predeterminado | `nomic-embed-text`  |
    | Descarga automática | Sí — el modelo de embeddings se descarga automáticamente si no está presente localmente |

    Para seleccionar Ollama como proveedor de embeddings de búsqueda en memoria:

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
    La integración de Ollama de OpenClaw usa de forma predeterminada la **API nativa de Ollama** (`/api/chat`), que admite completamente streaming y llamadas a herramientas simultáneamente. No se necesita ninguna configuración especial.

    <Tip>
    Si necesitas usar el endpoint compatible con OpenAI, consulta la sección "Modo heredado compatible con OpenAI" anterior. Es posible que el streaming y las llamadas a herramientas no funcionen simultáneamente en ese modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="No se detecta Ollama">
    Asegúrate de que Ollama esté ejecutándose, de haber establecido `OLLAMA_API_KEY` (o un perfil de autenticación) y de **no** haber definido una entrada explícita `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifica que la API sea accesible:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No hay modelos disponibles">
    Si tu modelo no aparece en la lista, descarga el modelo localmente o defínelo explícitamente en `models.providers.ollama`.

    ```bash
    ollama list  # Ver qué está instalado
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # U otro modelo
    ```

  </Accordion>

  <Accordion title="Conexión rechazada">
    Verifica que Ollama se esté ejecutando en el puerto correcto:

    ```bash
    # Verificar si Ollama se está ejecutando
    ps aux | grep ollama

    # O reiniciar Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Descripción general de todos los proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Selección de modelo" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Ollama Web Search" href="/es/tools/ollama-search" icon="magnifying-glass">
    Configuración completa y detalles de comportamiento de la búsqueda web con Ollama.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
