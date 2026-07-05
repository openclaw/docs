---
read_when:
    - Quieres usar Synthetic como proveedor de modelos
    - Necesitas configurar una clave de API de Synthetic o una URL base
summary: Usar la API compatible con Anthropic de Synthetic en OpenClaw
title: Sintético
x-i18n:
    generated_at: "2026-07-05T11:42:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) expone endpoints compatibles con Anthropic.
OpenClaw lo incluye como el proveedor `synthetic` y usa la API Anthropic
Messages.

| Propiedad | Valor                                 |
| --------- | ------------------------------------- |
| Proveedor | `synthetic`                           |
| Autenticación | `SYNTHETIC_API_KEY`               |
| API       | Anthropic Messages                    |
| URL base  | `https://api.synthetic.new/anthropic` |

## Primeros pasos

<Steps>
  <Step title="Get an API key">
    Obtén una `SYNTHETIC_API_KEY` desde tu cuenta de Synthetic, o deja que el onboarding
    te solicite una.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Verify the default model">
    El onboarding establece el modelo predeterminado en:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
El cliente Anthropic de OpenClaw agrega `/v1` a la URL base automáticamente, así que usa
`https://api.synthetic.new/anthropic` (no `/anthropic/v1`). Si Synthetic
cambia su URL base, sobrescribe `models.providers.synthetic.baseUrl`.
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

| ID de modelo                                           | Ventana de contexto | Tokens máx. | Razonamiento | Entrada        |
| ------------------------------------------------------ | ------------------- | ----------- | ------------ | -------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000             | 65,536      | no           | texto          |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000             | 8,192       | sí           | texto          |
| `hf:zai-org/GLM-4.7`                                   | 198,000             | 128,000     | no           | texto          |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000             | 8,192       | no           | texto          |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000             | 8,192       | no           | texto          |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000             | 8,192       | no           | texto          |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000             | 8,192       | no           | texto          |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000             | 8,192       | no           | texto          |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000             | 8,192       | no           | texto          |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000             | 8,192       | no           | texto          |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000             | 8,192       | no           | texto          |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000             | 8,192       | sí           | texto + imagen |
| `hf:openai/gpt-oss-120b`                               | 128,000             | 8,192       | no           | texto          |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000             | 8,192       | no           | texto          |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000             | 8,192       | no           | texto          |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000             | 8,192       | no           | texto + imagen |
| `hf:zai-org/GLM-4.5`                                   | 128,000             | 128,000     | no           | texto          |
| `hf:zai-org/GLM-4.6`                                   | 198,000             | 128,000     | no           | texto          |
| `hf:zai-org/GLM-5`                                     | 256,000             | 128,000     | sí           | texto + imagen |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000             | 8,192       | no           | texto          |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000             | 8,192       | sí           | texto          |

<Tip>
Las referencias de modelo usan el formato `synthetic/<modelId>`. Usa
`openclaw models list --provider synthetic` para ver todos los modelos disponibles en tu
cuenta.
</Tip>

<AccordionGroup>
  <Accordion title="Model allowlist">
    Si habilitas una lista de permitidos de modelos (`agents.defaults.models`), agrega cada
    modelo de Synthetic que planees usar. Los modelos que no estén en la lista de permitidos quedan ocultos
    para el agente.
  </Accordion>

  <Accordion title="Base URL override">
    Si Synthetic cambia su endpoint de API, sobrescribe la URL base:

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

    OpenClaw aún agrega `/v1` automáticamente.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model providers" href="/es/concepts/model-providers" icon="layers">
    Reglas de proveedor, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración, incluidos los ajustes del proveedor.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Panel de Synthetic y documentación de la API.
  </Card>
</CardGroup>
