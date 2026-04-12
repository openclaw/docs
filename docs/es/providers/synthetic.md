---
read_when:
    - Quieres usar Synthetic como proveedor de modelos
    - Necesitas una clave de API o una configuración de URL base de Synthetic
summary: Usa la API compatible con Anthropic de Synthetic en OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-04-12T23:33:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c4d2c6635482e09acaf603a75c8a85f0782e42a4a68ef6166f423a48d184ffa
    source_path: providers/synthetic.md
    workflow: 15
---

# Synthetic

[Synthetic](https://synthetic.new) expone endpoints compatibles con Anthropic.
OpenClaw lo registra como el proveedor `synthetic` y usa la API de Anthropic
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
    Obtén una `SYNTHETIC_API_KEY` desde tu cuenta de Synthetic, o deja que el asistente de onboarding te la solicite.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Verify the default model">
    Después del onboarding, el modelo predeterminado se establece en:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
El cliente de Anthropic de OpenClaw agrega `/v1` a la URL base automáticamente, así que usa
`https://api.synthetic.new/anthropic` (no `/anthropic/v1`). Si Synthetic
cambia su URL base, sustituye `models.providers.synthetic.baseUrl`.
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

## Catálogo de modelos

Todos los modelos de Synthetic usan costo `0` (entrada/salida/caché).

| ID del modelo                                          | Ventana de contexto | Máximo de tokens | Reasoning | Entrada       |
| ------------------------------------------------------ | ------------------- | ---------------- | --------- | -------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000             | 65,536           | no        | texto          |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000             | 8,192            | sí        | texto          |
| `hf:zai-org/GLM-4.7`                                   | 198,000             | 128,000          | no        | texto          |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000             | 8,192            | no        | texto          |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000             | 8,192            | no        | texto          |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000             | 8,192            | no        | texto          |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000             | 8,192            | no        | texto          |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000             | 8,192            | no        | texto          |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000             | 8,192            | no        | texto          |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000             | 8,192            | no        | texto          |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000             | 8,192            | no        | texto          |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000             | 8,192            | sí        | texto + imagen |
| `hf:openai/gpt-oss-120b`                               | 128,000             | 8,192            | no        | texto          |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000             | 8,192            | no        | texto          |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000             | 8,192            | no        | texto          |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000             | 8,192            | no        | texto + imagen |
| `hf:zai-org/GLM-4.5`                                   | 128,000             | 128,000          | no        | texto          |
| `hf:zai-org/GLM-4.6`                                   | 198,000             | 128,000          | no        | texto          |
| `hf:zai-org/GLM-5`                                     | 256,000             | 128,000          | sí        | texto + imagen |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000             | 8,192            | no        | texto          |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000             | 8,192            | sí        | texto          |

<Tip>
Las refs de modelos usan la forma `synthetic/<modelId>`. Usa
`openclaw models list --provider synthetic` para ver todos los modelos disponibles en tu
cuenta.
</Tip>

<AccordionGroup>
  <Accordion title="Model allowlist">
    Si habilitas una allowlist de modelos (`agents.defaults.models`), agrega todos los
    modelos de Synthetic que planeas usar. Los modelos que no estén en la allowlist quedarán ocultos para el agente.
  </Accordion>

  <Accordion title="Base URL override">
    Si Synthetic cambia su endpoint de API, sustituye la URL base en tu configuración:

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

    Recuerda que OpenClaw agrega `/v1` automáticamente.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model providers" href="/es/concepts/model-providers" icon="layers">
    Reglas de proveedores, refs de modelos y comportamiento de failover.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración, incluida la configuración del proveedor.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Panel y documentación de la API de Synthetic.
  </Card>
</CardGroup>
