---
read_when:
    - Quieres configurar Moonshot K2 (Moonshot Open Platform) frente a Kimi Coding
    - Necesitas entender endpoints, claves y refs de modelos separados
    - Quieres una configuración lista para copiar y pegar para cualquiera de los dos proveedores
summary: Configurar Moonshot K2 frente a Kimi Coding (proveedores y claves separados)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-21T05:18:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a04b0c45d55dbf8d56a04a1811f0850b800842ea501b212d44b53ff0680b5a2
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot proporciona la API de Kimi con endpoints compatibles con OpenAI. Configura el
proveedor y establece el modelo predeterminado en `moonshot/kimi-k2.6`, o usa
Kimi Coding con `kimi/kimi-code`.

<Warning>
Moonshot y Kimi Coding son **proveedores separados**. Las claves no son intercambiables, los endpoints son distintos y las refs de modelo son diferentes (`moonshot/...` frente a `kimi/...`).
</Warning>

## Catálogo de modelos integrado

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Nombre                 | Razonamiento | Entrada     | Contexto | Salida máxima |
| --------------------------------- | ---------------------- | ------------ | ----------- | -------- | ------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | No           | texto, imagen | 262,144 | 262,144       |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | No           | texto, imagen | 262,144 | 262,144       |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Sí           | texto       | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Sí           | texto       | 262,144  | 262,144       |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | No           | texto       | 256,000  | 16,384        |

[//]: # "moonshot-kimi-k2-ids:end"

Las estimaciones de costo integradas para los modelos K2 actuales alojados por Moonshot usan las
tarifas de pago por uso publicadas por Moonshot: Kimi K2.6 cuesta $0.16/MTok por lectura de caché,
$0.95/MTok de entrada y $4.00/MTok de salida; Kimi K2.5 cuesta $0.10/MTok por lectura de caché,
$0.60/MTok de entrada y $3.00/MTok de salida. Las demás entradas heredadas del catálogo mantienen
placeholders de costo cero, salvo que los sobrescribas en la configuración.

## Primeros pasos

Elige tu proveedor y sigue los pasos de configuración.

<Tabs>
  <Tab title="API de Moonshot">
    **Ideal para:** modelos Kimi K2 a través de Moonshot Open Platform.

    <Steps>
      <Step title="Elige tu región de endpoint">
        | Opción de autenticación | Endpoint                     | Región         |
        | ----------------------- | ---------------------------- | -------------- |
        | `moonshot-api-key`      | `https://api.moonshot.ai/v1` | Internacional  |
        | `moonshot-api-key-cn`   | `https://api.moonshot.cn/v1` | China          |
      </Step>
      <Step title="Ejecuta el onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        O para el endpoint de China:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Establece un modelo predeterminado">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica que los modelos estén disponibles">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Ejecuta una prueba smoke en vivo">
        Usa un directorio de estado aislado cuando quieras verificar el acceso al modelo y el seguimiento
        de costos sin tocar tus sesiones normales:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        La respuesta JSON debe informar `provider: "moonshot"` y
        `model: "kimi-k2.6"`. La entrada de transcripción del asistente almacena
        uso normalizado de tokens más costo estimado en `usage.cost` cuando Moonshot devuelve
        metadata de uso.
      </Step>
    </Steps>

    ### Ejemplo de configuración

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
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
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
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
    **Ideal para:** tareas centradas en código a través del endpoint de Kimi Coding.

    <Note>
    Kimi Coding usa una clave de API y un prefijo de proveedor diferentes (`kimi/...`) que Moonshot (`moonshot/...`). La ref de modelo heredada `kimi/k2p5` sigue aceptándose como ID de compatibilidad.
    </Note>

    <Steps>
      <Step title="Ejecuta el onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Establece un modelo predeterminado">
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
      <Step title="Verifica que el modelo esté disponible">
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
  <Step title="Ejecuta la configuración interactiva de búsqueda web">
    ```bash
    openclaw configure --section web
    ```

    Elige **Kimi** en la sección de búsqueda web para almacenar
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configura la región y el modelo de búsqueda web">
    La configuración interactiva pregunta por:

    | Ajuste              | Opciones                                                             |
    | ------------------- | -------------------------------------------------------------------- |
    | Región de API       | `https://api.moonshot.ai/v1` (internacional) o `https://api.moonshot.cn/v1` (China) |
    | Modelo de búsqueda web | Predeterminado: `kimi-k2.6`                                      |

  </Step>
</Steps>

La configuración vive en `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
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
  <Accordion title="Modo de razonamiento nativo">
    Moonshot Kimi admite razonamiento nativo binario:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configúralo por modelo mediante `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
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

    | Nivel de `/think`    | Comportamiento de Moonshot   |
    | -------------------- | ---------------------------- |
    | `/think off`         | `thinking.type=disabled`     |
    | Cualquier nivel distinto de off | `thinking.type=enabled` |

    <Warning>
    Cuando el razonamiento de Moonshot está habilitado, `tool_choice` debe ser `auto` o `none`. OpenClaw normaliza los valores incompatibles de `tool_choice` a `auto` por compatibilidad.
    </Warning>

    Kimi K2.6 también acepta un campo opcional `thinking.keep` que controla
    la retención en varios turnos de `reasoning_content`. Establécelo en `"all"` para conservar todo
    el razonamiento entre turnos; omítelo (o déjalo en `null`) para usar la estrategia
    predeterminada del servidor. OpenClaw solo reenvía `thinking.keep` para
    `moonshot/kimi-k2.6` y lo elimina de otros modelos.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Compatibilidad de uso en streaming">
    Los endpoints nativos de Moonshot (`https://api.moonshot.ai/v1` y
    `https://api.moonshot.cn/v1`) anuncian compatibilidad de uso en streaming en el
    transporte compartido `openai-completions`. OpenClaw lo determina en función de las
    capacidades del endpoint, por lo que los IDs compatibles de proveedores personalizados que apunten a los mismos hosts nativos de
    Moonshot heredan el mismo comportamiento de uso en streaming.

    Con los precios integrados de K2.6, el uso en streaming que incluye tokens de entrada, salida
    y lectura de caché también se convierte en costo estimado local en USD para
    `/status`, `/usage full`, `/usage cost` y la contabilidad de sesiones respaldada por transcripciones.

  </Accordion>

  <Accordion title="Referencia de endpoints y refs de modelo">
    | Proveedor      | Prefijo de ref de modelo | Endpoint                     | Variable de entorno de autenticación |
    | -------------- | ------------------------ | ---------------------------- | ------------------------------------ |
    | Moonshot       | `moonshot/`              | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`                   |
    | Moonshot CN    | `moonshot/`              | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`                   |
    | Kimi Coding    | `kimi/`                  | Endpoint de Kimi Coding      | `KIMI_API_KEY`                       |
    | Búsqueda web   | N/A                      | Igual que la región de API de Moonshot | `KIMI_API_KEY` o `MOONSHOT_API_KEY` |

    - La búsqueda web de Kimi usa `KIMI_API_KEY` o `MOONSHOT_API_KEY`, y usa por defecto `https://api.moonshot.ai/v1` con el modelo `kimi-k2.6`.
    - Sobrescribe la metadata de precios y contexto en `models.providers` si es necesario.
    - Si Moonshot publica límites de contexto diferentes para un modelo, ajusta `contextWindow` en consecuencia.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs de modelo y comportamiento de failover.
  </Card>
  <Card title="Búsqueda web" href="/tools/web-search" icon="magnifying-glass">
    Configurar proveedores de búsqueda web, incluido Kimi.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración para proveedores, modelos y plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gestión de claves de API de Moonshot y documentación.
  </Card>
</CardGroup>
