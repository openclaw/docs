---
read_when:
    - Quieres configurar Moonshot Kimi K3/K2 (Moonshot Open Platform) frente a Kimi Coding
    - Es necesario comprender los endpoints, las claves y las referencias de modelos por separado.
    - Quieres una configuración que puedas copiar y pegar para cualquiera de los proveedores
summary: Configurar los modelos Kimi de Moonshot frente a Kimi Coding (proveedores y claves independientes)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-22T10:47:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 213379bf88fec26b052184a920e112f0887d6485601bfb47f590cf37ef983e58
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot proporciona la API de Kimi con endpoints compatibles con OpenAI. Seleccione
`moonshot/kimi-k3` para Kimi K3, mantenga el valor predeterminado de la incorporación
`moonshot/kimi-k2.6` o use `kimi/kimi-for-coding` para Kimi Coding.

<Warning>
Moonshot y Kimi Coding son **proveedores independientes**, cada uno distribuido como un plugin externo distinto. Las claves no son intercambiables, los endpoints son diferentes y las referencias de modelos difieren (`moonshot/...` frente a `kimi/...`).
</Warning>

## Catálogo de modelos integrado

[//]: # "moonshot-kimi-k2-ids:start"

| Referencia del modelo                  | Nombre                   | Razonamiento       | Entrada       | Contexto  | Salida máxima |
| -------------------------------------- | ------------------------ | ------------------ | ------------- | --------- | ------------- |
| `moonshot/kimi-k2.6`                     | Kimi K2.6                | No                 | texto, imagen | 262,144   | 262,144       |
| `moonshot/kimi-k3`                     | Kimi K3                  | Siempre al máximo  | texto, imagen | 1,048,576 | 1,048,576     |
| `moonshot/kimi-k2.7-code`                     | Kimi K2.7 Code           | Siempre activado   | texto, imagen | 262,144   | 262,144       |
| `moonshot/kimi-k2.7-code-highspeed`                     | Kimi K2.7 Code HighSpeed | Siempre activado   | texto, imagen | 262,144   | 262,144       |
| `moonshot/kimi-k2.5`                     | Kimi K2.5                | No                 | texto, imagen | 262,144   | 262,144       |

[//]: # "moonshot-kimi-k2-ids:end"

Las estimaciones de costes del catálogo utilizan las tarifas de pago por uso publicadas por Moonshot. Consulte las
páginas actualizadas del proveedor sobre [Kimi K3](https://platform.kimi.ai/docs/pricing/chat-k3),
[Kimi K2.7 Code](https://platform.kimi.ai/docs/pricing/chat-k27-code),
[Kimi K2.6](https://platform.kimi.ai/docs/pricing/chat-k26) y
[Kimi K2.5](https://platform.kimi.ai/docs/pricing/chat-k25) antes de tomar decisiones
sobre costes.

Kimi K3 siempre razona con `reasoning_effort: "max"`. OpenClaw expone únicamente
`/think max`, omite el campo exclusivo de K2 `thinking` y elimina las anulaciones
de muestreo (`temperature`, `top_p`, `n`, `presence_penalty` y
`frequency_penalty`) que K3 fija en los valores predeterminados del proveedor. Kimi K2.7 Code también
utiliza siempre el razonamiento nativo, pero requiere omitir tanto `thinking` como
`reasoning_effort`; la variante HighSpeed utiliza el mismo contrato.
Kimi K2.6 sigue siendo el valor predeterminado de la incorporación.
Consulte la [guía de inicio rápido de Kimi K3](https://platform.kimi.ai/docs/guide/kimi-k3-quickstart) de Moonshot.

## Primeros pasos

Tanto Moonshot como Kimi Coding son plugins externos; instale uno antes de
la incorporación.

<Tabs>
  <Tab title="API de Moonshot">
    **Recomendado para:** modelos Kimi K3 y K2 mediante Moonshot Open Platform.

    <Steps>
      <Step title="Instalar el plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Elegir la región del endpoint">
        | Opción de autenticación | Endpoint                       | Región        |
        | ----------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`      | `https://api.moonshot.ai/v1`             | Internacional |
        | `moonshot-api-key-cn`      | `https://api.moonshot.cn/v1`             | China         |
      </Step>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        O bien, para el endpoint de China:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Establecer Kimi K3 como modelo predeterminado">
        La incorporación mantiene Kimi K2.6 como valor predeterminado inicial. Cambie explícitamente
        cuando desee usar Kimi K3:

        ```bash
        openclaw models set moonshot/kimi-k3
        ```
      </Step>
      <Step title="Comprobar que los modelos estén disponibles">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Ejecutar una prueba de humo en vivo">
        Utilice un directorio de estado aislado cuando quiera verificar el acceso al modelo y el seguimiento
        de costes sin modificar las sesiones habituales:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Responde exactamente: KIMI_LIVE_OK' \
          --thinking max \
          --json
        ```

        La respuesta JSON debe indicar `provider: "moonshot"` y
        `model: "kimi-k3"`. La entrada de la transcripción del asistente almacena el uso
        normalizado de tokens y el coste estimado en `usage.cost` cuando Moonshot devuelve
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
            "moonshot/kimi-k3": { alias: "Kimi K3" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.7-code-highspeed": { alias: "Kimi K2.7 Code HighSpeed" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
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
                id: "kimi-k3",
                name: "Kimi K3",
                reasoning: true,
                thinkingLevelMap: {
                  off: null,
                  minimal: null,
                  low: null,
                  medium: null,
                  high: null,
                  xhigh: "max",
                  max: "max",
                },
                input: ["text", "image"],
                cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 },
                contextWindow: 1048576,
                maxTokens: 1048576,
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
                id: "kimi-k2.7-code-highspeed",
                name: "Kimi K2.7 Code HighSpeed",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 1.9, output: 8, cacheRead: 0.38, cacheWrite: 0 },
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
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Recomendado para:** tareas centradas en código mediante el endpoint de Kimi Coding.

    <Note>
    Kimi Coding utiliza una clave de API y un prefijo de proveedor (`kimi/...`) diferentes de los de Moonshot (`moonshot/...`). Las referencias actuales son `kimi/k3` para un contexto de 256K, `kimi/k3[1m]` para el nivel de 1M, `kimi/kimi-for-coding` y `kimi/kimi-for-coding-highspeed`. Las referencias heredadas `kimi/kimi-code` y `kimi/k2p5` siguen aceptándose y se normalizan a `kimi/kimi-for-coding`.
    </Note>

    El servicio de programación admite clientes compatibles tanto con
    `https://api.kimi.com/coding/v1` de OpenAI como con
    `https://api.kimi.com/coding/` de Anthropic. Este plugin utiliza Anthropic Messages.
    Cree claves de membresía en
    [Kimi Code Console](https://www.kimi.com/code/console); los precios actuales de las membresías
    están disponibles en la [página de precios de Kimi](https://www.kimi.com/membership/pricing).

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
      <Step title="Comprobar que el modelo esté disponible">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    Kimi Code K3 utiliza de forma predeterminada el razonamiento profundo con `max`. `/think off` envía
    `thinking.type: "disabled"`; `/think max` envía la solicitud de razonamiento
    adaptativo de K3 con el esfuerzo máximo. Los niveles de razonamiento inferiores obsoletos se resuelven al
    nivel compatible `max`. El modelo de 1M requiere una membresía Kimi Allegretto o superior;
    use `kimi/k3` con Moderato.

    Consulte la [tabla oficial de modelos de Kimi Code](https://www.kimi.com/code/docs/en/kimi-code/models.html) para conocer la disponibilidad actual según el plan.

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
  <Step title="Ejecutar la configuración interactiva de la búsqueda web">
    ```bash
    openclaw configure --section web
    ```

    Elija **Kimi** en la sección de búsqueda web para almacenar
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configurar la región y el modelo de búsqueda web">
    La configuración interactiva solicita:

    | Ajuste                   | Opciones                                                              |
    | ------------------------ | --------------------------------------------------------------------- |
    | Región de la API         | `https://api.moonshot.ai/v1` (internacional) o `https://api.moonshot.cn/v1` (China)       |
    | Modelo de búsqueda web   | El valor predeterminado es `kimi-k2.6`                          |

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
  <Accordion title="Modo de razonamiento nativo">
    Kimi K3 de la API de Moonshot siempre razona con el esfuerzo máximo. OpenClaw expone únicamente
    `/think max`, envía `reasoning_effort: "max"` e ignora los ajustes inferiores obsoletos o
    `off`.

    Kimi Code K3 expone `/think off|max`. Su endpoint compatible con Anthropic
    recibe `thinking.type: "disabled"` para desactivarlo, o pensamiento adaptativo con
    `output_config.effort: "max"` para el máximo. Esto se aplica tanto a `kimi/k3` como a
    `kimi/k3[1m]`.
    La API K3 de Moonshot admite `auto`, `none`, `required` y elecciones de herramientas fijadas,
    por lo que OpenClaw conserva el `tool_choice` solicitado. Para el uso de herramientas en varios turnos,
    OpenClaw conserva el contenido de razonamiento del asistente requerido por el
    contrato de reproducción de Moonshot.

    Kimi K2.7 Code siempre utiliza pensamiento nativo. Moonshot exige que los clientes
    omitan el campo `thinking` para este modelo, por lo que OpenClaw solo expone `on` e
    ignora la configuración obsoleta de `off`. K2.7 también fija `temperature`, `top_p`, `n`,
    `presence_penalty` y `frequency_penalty`; OpenClaw omite las
    anulaciones configuradas para esos campos.

    Otros modelos Kimi de Moonshot admiten pensamiento nativo binario:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configúrelo por modelo mediante `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw asigna los niveles de `/think` en tiempo de ejecución para esos modelos:

    | Nivel de `/think`       | Comportamiento de Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Cualquier nivel distinto de desactivado    | `thinking.type=enabled`    |

    <Warning>
    Cuando el pensamiento de Moonshot K2 está habilitado, `tool_choice` debe ser `auto` o `none`. Una elección de herramienta fijada (`type: "tool"` o `type: "function"`) fuerza en su lugar que el pensamiento vuelva a `disabled`, para que la herramienta solicitada se ejecute de todos modos; `tool_choice: "required"` se normaliza en su lugar a `auto`. Kimi K2.7 Code no puede deshabilitar el pensamiento, por lo que su `tool_choice` incompatible se normaliza a `auto`. Kimi K3 utiliza su contrato independiente de esfuerzo de razonamiento y conserva las elecciones de herramientas admitidas.
    </Warning>

    Kimi K2.6 también acepta un campo opcional `thinking.keep` que controla
    la conservación de `reasoning_content` entre varios turnos. Establézcalo en `"all"` para conservar todo el
    razonamiento entre turnos; omítalo (o déjelo en `null`) para utilizar la estrategia
    predeterminada del servidor. OpenClaw solo reenvía `thinking.keep` para
    `moonshot/kimi-k2.6` y lo elimina de otros modelos. Kimi K2.7 Code
    conserva de forma predeterminada todo el historial de razonamiento, mientras que OpenClaw omite por completo
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

  <Accordion title="Saneamiento de identificadores de llamadas a herramientas">
    Moonshot Kimi proporciona identificadores nativos de tool_call con la forma `functions.<name>:<index>`. OpenClaw conserva la primera aparición de cada identificador nativo de Kimi y reescribe los duplicados posteriores como identificadores `call_*` deterministas al estilo de OpenAI. Los resultados de herramientas correspondientes se reasignan con el mismo identificador para que la reproducción siga siendo única sin eliminar el primer identificador nativo de Kimi. Este comportamiento está integrado en el proveedor Moonshot incluido y no es una opción configurable por el usuario.
  </Accordion>

  <Accordion title="Compatibilidad del uso en streaming">
    Los endpoints nativos de Moonshot (`https://api.moonshot.ai/v1` y
    `https://api.moonshot.cn/v1`) anuncian compatibilidad con el uso en streaming.
    OpenClaw determina este comportamiento mediante el host del endpoint, no mediante el identificador del proveedor, por lo que un
    identificador de proveedor personalizado que apunte al mismo host nativo de Moonshot hereda el mismo
    comportamiento de uso en streaming.

    Con los precios de K2.6 del catálogo, el uso transmitido que incluye tokens de entrada, salida
    y lectura de caché también se convierte en un coste estimado local en USD para
    `/status`, `/usage full`, `/usage cost` y la contabilización de sesiones
    respaldada por transcripciones.

  </Accordion>

  <Accordion title="Referencia de endpoints y referencias de modelos">
    | Proveedor   | Prefijo de referencia del modelo | Endpoint                      | Variable de entorno de autenticación        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Endpoint de Kimi Coding           | `KIMI_API_KEY`      |
    | Búsqueda web | N/D              | Igual que la región de la API de Moonshot    | `KIMI_API_KEY` o `MOONSHOT_API_KEY` |

    - La búsqueda web de Kimi utiliza `KIMI_API_KEY` o `MOONSHOT_API_KEY`, y el valor predeterminado es `https://api.moonshot.ai/v1` con el modelo `kimi-k2.6`.
    - Anule los precios y los metadatos de contexto en `models.providers` si es necesario.
    - Si Moonshot publica límites de contexto diferentes para un modelo, ajuste `contextWindow` en consecuencia.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Búsqueda web" href="/es/tools/web" icon="magnifying-glass">
    Configuración de proveedores de búsqueda web, incluido Kimi.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo para proveedores, modelos y plugins.
  </Card>
  <Card title="Plataforma abierta de Moonshot" href="https://platform.moonshot.ai" icon="globe">
    Gestión de claves de la API de Moonshot y documentación.
  </Card>
</CardGroup>
