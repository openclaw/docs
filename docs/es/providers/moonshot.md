---
read_when:
    - Quieres configurar Moonshot K2 (Moonshot Open Platform) frente a Kimi Coding
    - Necesitas entender endpoints, claves y referencias de modelos por separado
    - Quieres una configuración lista para copiar y pegar para cualquiera de los dos proveedores
summary: Configurar Moonshot K2 frente a Kimi Coding (proveedores + claves separados)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-12T23:31:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f261f83a9b37e4fffb0cd0803e0c64f27eae8bae91b91d8a781a030663076f8
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot proporciona la API de Kimi con endpoints compatibles con OpenAI. Configura el
proveedor y establece el modelo predeterminado en `moonshot/kimi-k2.5`, o usa
Kimi Coding con `kimi/kimi-code`.

<Warning>
Moonshot y Kimi Coding son **proveedores separados**. Las claves no son intercambiables, los endpoints difieren y las referencias de modelo también (`moonshot/...` frente a `kimi/...`).
</Warning>

## Catálogo de modelos integrado

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Nombre                 | Razonamiento | Entrada     | Contexto | Salida máxima |
| --------------------------------- | ---------------------- | ------------ | ----------- | -------- | ------------- |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | No           | text, image | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Sí           | text        | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Sí           | text        | 262,144  | 262,144       |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | No           | text        | 256,000  | 16,384        |

[//]: # "moonshot-kimi-k2-ids:end"

## Primeros pasos

Elige tu proveedor y sigue los pasos de configuración.

<Tabs>
  <Tab title="Moonshot API">
    **Ideal para:** modelos Kimi K2 mediante Moonshot Open Platform.

    <Steps>
      <Step title="Choose your endpoint region">
        | Opción de autenticación | Endpoint                     | Región        |
        | ----------------------- | ---------------------------- | ------------- |
        | `moonshot-api-key`      | `https://api.moonshot.ai/v1` | Internacional |
        | `moonshot-api-key-cn`   | `https://api.moonshot.cn/v1` | China         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        O para el endpoint de China:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.5" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
    </Steps>

    ### Ejemplo de configuración

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.5" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Ideal para:** tareas centradas en código mediante el endpoint de Kimi Coding.

    <Note>
    Kimi Coding usa una clave API diferente y un prefijo de proveedor distinto (`kimi/...`) que Moonshot (`moonshot/...`). La referencia de modelo heredada `kimi/k2p5` sigue aceptándose como id de compatibilidad.
    </Note>

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Ejemplo de configuración

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Búsqueda web de Kimi

OpenClaw también incluye **Kimi** como proveedor `web_search`, respaldado por la
búsqueda web de Moonshot.

<Steps>
  <Step title="Run interactive web search setup">
    ```bash
    openclaw configure --section web
    ```

    Elige **Kimi** en la sección de búsqueda web para almacenar
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configure the web search region and model">
    La configuración interactiva solicita:

    | Configuración     | Opciones                                                             |
    | ----------------- | -------------------------------------------------------------------- |
    | Región de API     | `https://api.moonshot.ai/v1` (internacional) o `https://api.moonshot.cn/v1` (China) |
    | Modelo de búsqueda web | El valor predeterminado es `kimi-k2.5`                         |

  </Step>
</Steps>

La configuración se almacena en `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // o usa KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Avanzado

<AccordionGroup>
  <Accordion title="Native thinking mode">
    Moonshot Kimi admite thinking nativo binario:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configúralo por modelo mediante `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.5": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw también asigna niveles de `/think` en runtime para Moonshot:

    | Nivel de `/think`  | Comportamiento de Moonshot |
    | ------------------ | -------------------------- |
    | `/think off`       | `thinking.type=disabled`   |
    | Cualquier nivel distinto de off | `thinking.type=enabled`    |

    <Warning>
    Cuando el thinking de Moonshot está habilitado, `tool_choice` debe ser `auto` o `none`. OpenClaw normaliza los valores incompatibles de `tool_choice` a `auto` por compatibilidad.
    </Warning>

  </Accordion>

  <Accordion title="Streaming usage compatibility">
    Los endpoints nativos de Moonshot (`https://api.moonshot.ai/v1` y
    `https://api.moonshot.cn/v1`) anuncian compatibilidad de uso en streaming en el
    transporte compartido `openai-completions`. OpenClaw basa esto en las
    capacidades del endpoint, por lo que los ids de proveedor personalizados compatibles que apunten a los mismos hosts nativos de
    Moonshot heredan el mismo comportamiento de uso en streaming.
  </Accordion>

  <Accordion title="Endpoint and model ref reference">
    | Proveedor   | Prefijo de referencia de modelo | Endpoint                    | Variable env de autenticación |
    | ----------- | -------------------------------- | --------------------------- | ----------------------------- |
    | Moonshot    | `moonshot/`                      | `https://api.moonshot.ai/v1`| `MOONSHOT_API_KEY`            |
    | Moonshot CN | `moonshot/`                      | `https://api.moonshot.cn/v1`| `MOONSHOT_API_KEY`            |
    | Kimi Coding | `kimi/`                          | Endpoint de Kimi Coding     | `KIMI_API_KEY`                |
    | Búsqueda web| N/A                              | Igual que la región de API de Moonshot | `KIMI_API_KEY` o `MOONSHOT_API_KEY` |

    - La búsqueda web de Kimi usa `KIMI_API_KEY` o `MOONSHOT_API_KEY`, y usa por defecto `https://api.moonshot.ai/v1` con el modelo `kimi-k2.5`.
    - Anula los metadatos de precios y contexto en `models.providers` si es necesario.
    - Si Moonshot publica límites de contexto distintos para un modelo, ajusta `contextWindow` en consecuencia.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Web search" href="/tools/web-search" icon="magnifying-glass">
    Configurar proveedores de búsqueda web, incluido Kimi.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración para proveedores, modelos y plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gestión de claves API y documentación de Moonshot.
  </Card>
</CardGroup>
