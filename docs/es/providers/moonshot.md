---
read_when:
    - Quieres configurar Moonshot K2 (Moonshot Open Platform) frente a Kimi Coding
    - Debes comprender endpoints, claves y referencias de modelo separados
    - Quieres una configuración para copiar y pegar para cualquiera de los proveedores
summary: Configurar Moonshot K2 frente a Kimi Coding (proveedores y claves separados)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-05T11:40:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot proporciona la API de Kimi con endpoints compatibles con OpenAI. Establece el
modelo predeterminado en `moonshot/kimi-k2.6` para Moonshot Open Platform, o
`kimi/kimi-for-coding` para Kimi Coding.

<Warning>
Moonshot y Kimi Coding son **proveedores separados**, cada uno distribuido como un plugin externo independiente. Las claves no son intercambiables, los endpoints difieren y las referencias de modelo difieren (`moonshot/...` frente a `kimi/...`).
</Warning>

## Catálogo de modelos integrado

[//]: # "moonshot-kimi-k2-ids:start"

| Referencia de modelo              | Nombre                 | Razonamiento  | Entrada     | Contexto | Salida máxima |
| --------------------------------- | ---------------------- | ------------- | ----------- | -------- | ------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | No            | text, image | 262,144  | 262,144       |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Siempre activo | text, image | 262,144  | 262,144       |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | No            | text, image | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Sí            | text        | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Sí            | text        | 262,144  | 262,144       |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | No            | text        | 256,000  | 16,384        |

[//]: # "moonshot-kimi-k2-ids:end"

Las estimaciones de coste del catálogo usan las tarifas publicadas de pago por uso de Moonshot: Kimi
K2.7 Code cuesta 0,19 $/MTok con acierto de caché, 0,95 $/MTok de entrada, 4,00 $/MTok de salida; Kimi
K2.6 cuesta 0,16 $/MTok con acierto de caché, 0,95 $/MTok de entrada, 4,00 $/MTok de salida; Kimi K2.5
cuesta 0,10 $/MTok con acierto de caché, 0,60 $/MTok de entrada, 3,00 $/MTok de salida. Las demás
entradas del catálogo conservan marcadores de coste cero salvo que los sobrescribas en la configuración.

Kimi K2.7 Code siempre usa pensamiento nativo. OpenClaw expone solo el estado de pensamiento `on`
para este modelo y omite los campos salientes `thinking` y
`reasoning_effort`, según requiere Moonshot. También omite anulaciones de muestreo
(`temperature`, `top_p`, `n`, `presence_penalty`,
`frequency_penalty`), que K2.7 fija a los valores predeterminados del proveedor. Kimi K2.6 sigue siendo
el valor predeterminado de incorporación.

## Primeros pasos

Tanto Moonshot como Kimi Coding son plugins externos: instala uno antes de la
incorporación.

<Tabs>
  <Tab title="Moonshot API">
    **Ideal para:** modelos Kimi K2 mediante Moonshot Open Platform.

    <Steps>
      <Step title="Instalar el plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Elegir la región del endpoint">
        | Opción de autenticación | Endpoint                     | Región        |
        | ----------------------- | ---------------------------- | ------------- |
        | `moonshot-api-key`      | `https://api.moonshot.ai/v1` | Internacional |
        | `moonshot-api-key-cn`   | `https://api.moonshot.cn/v1` | China         |
      </Step>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        O para el endpoint de China:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Establecer un modelo predeterminado">
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
      <Step title="Verificar que los modelos estén disponibles">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Ejecutar una prueba rápida en vivo">
        Usa un directorio de estado aislado cuando quieras verificar el acceso al modelo y el seguimiento
        de costes sin tocar tus sesiones normales:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        La respuesta JSON debería informar `provider: "moonshot"` y
        `model: "kimi-k2.6"`. La entrada de la transcripción del asistente almacena el uso de
        tokens normalizado más el coste estimado en `usage.cost` cuando Moonshot devuelve
        metadatos de uso.
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
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
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
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
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
    **Ideal para:** tareas centradas en código mediante el endpoint de Kimi Coding.

    <Note>
    Kimi Coding usa una clave de API y un prefijo de proveedor diferentes (`kimi/...`) a los de Moonshot (`moonshot/...`). La referencia de modelo estable es `kimi/kimi-for-coding`; las referencias heredadas `kimi/kimi-code` y `kimi/k2p5` siguen aceptándose y se normalizan a ese ID de modelo.
    </Note>

    <Steps>
      <Step title="Instalar el plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Establecer un modelo predeterminado">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verificar que el modelo esté disponible">
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
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Búsqueda web de Kimi

El plugin de Moonshot también registra **Kimi** como proveedor de `web_search`, respaldado por la búsqueda web de Moonshot.

<Steps>
  <Step title="Ejecutar la configuración interactiva de búsqueda web">
    ```bash
    openclaw configure --section web
    ```

    Elige **Kimi** en la sección de búsqueda web para almacenar
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configurar la región y el modelo de búsqueda web">
    La configuración interactiva solicita:

    | Ajuste              | Opciones                                                             |
    | ------------------- | -------------------------------------------------------------------- |
    | Región de API       | `https://api.moonshot.ai/v1` (internacional) o `https://api.moonshot.cn/v1` (China) |
    | Modelo de búsqueda web | Predeterminado en `kimi-k2.6`                                     |

  </Step>
</Steps>

La configuración se encuentra en `plugins.entries.moonshot.config.webSearch`:

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

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo de pensamiento nativo">
    Kimi K2.7 Code siempre usa pensamiento nativo. Moonshot requiere que los clientes
    omitan el campo `thinking` para este modelo, por lo que OpenClaw expone solo `on` e
    ignora ajustes obsoletos de `off`. K2.7 también fija `temperature`, `top_p`, `n`,
    `presence_penalty` y `frequency_penalty`; OpenClaw omite las anulaciones configuradas
    para esos campos.

    Otros modelos Kimi de Moonshot admiten pensamiento nativo binario:

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

    OpenClaw asigna niveles de `/think` en tiempo de ejecución para esos modelos:

    | Nivel de `/think`   | Comportamiento de Moonshot |
    | ------------------- | -------------------------- |
    | `/think off`        | `thinking.type=disabled`   |
    | Cualquier nivel distinto de off | `thinking.type=enabled` |

    <Warning>
    Cuando el pensamiento de Moonshot está activado, `tool_choice` debe ser `auto` o `none`. Una selección de herramienta fijada (`type: "tool"` o `type: "function"`) fuerza en su lugar el pensamiento de vuelta a `disabled`, de modo que la herramienta solicitada siga ejecutándose; `tool_choice: "required"` se normaliza a `auto` en su lugar. Esto se aplica a todos los modelos de Moonshot excepto Kimi K2.7 Code, cuyo modo de pensamiento no se puede desactivar: su `tool_choice` se normaliza a `auto` cuando es incompatible.
    </Warning>

    Kimi K2.6 también acepta un campo opcional `thinking.keep` que controla
    la retención multi-turn de `reasoning_content`. Establécelo en `"all"` para conservar el razonamiento
    completo entre turnos; omítelo (o déjalo en `null`) para usar la estrategia
    predeterminada del servidor. OpenClaw solo reenvía `thinking.keep` para
    `moonshot/kimi-k2.6` y lo elimina de otros modelos. Kimi K2.7 Code
    conserva el historial completo de razonamiento de forma predeterminada mientras OpenClaw omite todo
    el campo `thinking`.

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

  <Accordion title="Saneamiento de id de llamadas a herramientas">
    Moonshot Kimi sirve ids `tool_call` nativos con forma de `functions.<name>:<index>`. OpenClaw conserva la primera aparición de cada id nativo de Kimi y reescribe los duplicados posteriores como ids deterministas de estilo OpenAI `call_*`. Los resultados de herramientas coincidentes se reasignan con el mismo id para que la reproducción siga siendo única sin eliminar el primer id nativo de Kimi. Este comportamiento está integrado en el proveedor Moonshot incluido y no es una opción configurable por el usuario.
  </Accordion>

  <Accordion title="Compatibilidad de uso en streaming">
    Los endpoints nativos de Moonshot (`https://api.moonshot.ai/v1` y
    `https://api.moonshot.cn/v1`) anuncian compatibilidad de uso en streaming.
    OpenClaw basa esto en el host del endpoint, no en el id del proveedor, por lo que un id
    de proveedor personalizado apuntado al mismo host nativo de Moonshot hereda el mismo
    comportamiento de uso en streaming.

    Con los precios de K2.6 del catálogo, el uso transmitido que incluye tokens de entrada,
    salida y lectura de caché también se convierte en un costo estimado local en USD para
    `/status`, `/usage full`, `/usage cost` y la contabilidad de sesiones respaldada por
    transcripciones.

  </Accordion>

  <Accordion title="Referencia de endpoint y referencia de modelo">
    | Proveedor  | Prefijo de referencia de modelo | Endpoint                       | Variable de entorno de autenticación |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Endpoint de Kimi Coding        | `KIMI_API_KEY`      |
    | Búsqueda web | N/A              | Igual que la región de la API de Moonshot | `KIMI_API_KEY` o `MOONSHOT_API_KEY` |

    - La búsqueda web de Kimi usa `KIMI_API_KEY` o `MOONSHOT_API_KEY`, y usa de forma predeterminada `https://api.moonshot.ai/v1` con el modelo `kimi-k2.6`.
    - Sobrescribe los precios y los metadatos de contexto en `models.providers` si es necesario.
    - Si Moonshot publica límites de contexto distintos para un modelo, ajusta `contextWindow` en consecuencia.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Búsqueda web" href="/es/tools/web" icon="magnifying-glass">
    Configurar proveedores de búsqueda web, incluido Kimi.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo para proveedores, modelos y plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gestión de claves de API y documentación de Moonshot.
  </Card>
</CardGroup>
