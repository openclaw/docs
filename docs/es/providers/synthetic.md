---
read_when:
    - Quieres usar Synthetic como proveedor de modelos
    - Necesitas una configuración de clave de API o URL base de Synthetic
summary: Usar la API compatible con Anthropic de Synthetic en OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-04-24T05:46:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 15
---

[Synthetic](https://synthetic.new) expone endpoints compatibles con Anthropic.
OpenClaw lo registra como proveedor `synthetic` y usa la
API Anthropic Messages.

| Propiedad | Valor                                 |
| --------- | ------------------------------------- |
| Proveedor | `synthetic`                           |
| Autenticación | `SYNTHETIC_API_KEY`                |
| API       | Anthropic Messages                    |
| URL base  | `https://api.synthetic.new/anthropic` |

## Primeros pasos

<Steps>
  <Step title="Obtén una clave de API">
    Obtén una `SYNTHETIC_API_KEY` desde tu cuenta de Synthetic, o deja que el
    asistente de incorporación te la solicite.
  </Step>
  <Step title="Ejecuta la incorporación">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Verifica el modelo predeterminado">
    Después de la incorporación, el modelo predeterminado se establece en:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
El cliente Anthropic de OpenClaw añade `/v1` a la URL base automáticamente, así que usa
`https://api.synthetic.new/anthropic` (no `/anthropic/v1`). Si Synthetic
cambia su URL base, anula `models.providers.synthetic.baseUrl`.
</Warning>

## Ejemplo de configuración

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Catálogo integrado

Todos los modelos de Synthetic usan coste `0` (entrada/salida/caché).

| ID del modelo                                         | Ventana de contexto | Máx. tokens | Reasoning | Entrada      |
| ----------------------------------------------------- | ------------------- | ----------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                           | 192,000             | 65,536      | no        | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                      | 256,000             | 8,192       | sí        | text         |
| `hf:zai-org/GLM-4.7`                                  | 198,000             | 128,000     | no        | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                     | 128,000             | 8,192       | no        | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                     | 128,000             | 8,192       | no        | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                        | 128,000             | 8,192       | no        | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`               | 128,000             | 8,192       | no        | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                        | 159,000             | 8,192       | no        | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                | 128,000             | 8,192       | no        | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`| 524,000             | 8,192       | no        | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                 | 256,000             | 8,192       | no        | text         |
| `hf:moonshotai/Kimi-K2.5`                             | 256,000             | 8,192       | sí        | text + image |
| `hf:openai/gpt-oss-120b`                              | 128,000             | 8,192       | no        | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`               | 256,000             | 8,192       | no        | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`              | 256,000             | 8,192       | no        | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                 | 250,000             | 8,192       | no        | text + image |
| `hf:zai-org/GLM-4.5`                                  | 128,000             | 128,000     | no        | text         |
| `hf:zai-org/GLM-4.6`                                  | 198,000             | 128,000     | no        | text         |
| `hf:zai-org/GLM-5`                                    | 256,000             | 128,000     | sí        | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                          | 128,000             | 8,192       | no        | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`               | 256,000             | 8,192       | sí        | text         |

<Tip>
Las referencias de modelo usan la forma `synthetic/<modelId>`. Usa
`openclaw models list --provider synthetic` para ver todos los modelos disponibles en tu
cuenta.
</Tip>

<AccordionGroup>
  <Accordion title="Lista de permitidos de modelos">
    Si habilitas una lista de permitidos de modelos (`agents.defaults.models`), añade cada
    modelo de Synthetic que planees usar. Los modelos que no estén en la lista de permitidos quedarán ocultos
    para el agente.
  </Accordion>

  <Accordion title="Anulación de URL base">
    Si Synthetic cambia su endpoint de API, anula la URL base en tu configuración:

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    Recuerda que OpenClaw añade `/v1` automáticamente.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Reglas de proveedores, referencias de modelos y comportamiento de alternativas.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración, incluida la configuración del proveedor.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Panel de Synthetic y documentación de la API.
  </Card>
</CardGroup>
