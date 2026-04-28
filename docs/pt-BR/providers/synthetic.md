---
read_when:
    - Você quer usar Synthetic como provedor de modelo
    - Você precisa de uma chave de API ou configuração de base URL da Synthetic
summary: Use a API compatível com Anthropic da Synthetic no OpenClaw
title: Synthetic
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T06:09:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 15
---

[Synthetic](https://synthetic.new) expõe endpoints compatíveis com Anthropic.
O OpenClaw a registra como o provedor `synthetic` e usa a API Anthropic
Messages.

| Propriedade | Valor                                  |
| ----------- | -------------------------------------- |
| Provedor    | `synthetic`                            |
| Autenticação | `SYNTHETIC_API_KEY`                   |
| API         | Anthropic Messages                     |
| Base URL    | `https://api.synthetic.new/anthropic`  |

## Primeiros passos

<Steps>
  <Step title="Obter uma chave de API">
    Obtenha uma `SYNTHETIC_API_KEY` na sua conta Synthetic ou deixe o
    assistente de onboarding solicitá-la para você.
  </Step>
  <Step title="Executar o onboarding">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Verificar o modelo padrão">
    Após o onboarding, o modelo padrão é definido como:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
O cliente Anthropic do OpenClaw acrescenta `/v1` à base URL automaticamente, então use
`https://api.synthetic.new/anthropic` (não `/anthropic/v1`). Se a Synthetic
alterar sua base URL, sobrescreva `models.providers.synthetic.baseUrl`.
</Warning>

## Exemplo de configuração

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

Todos os modelos Synthetic usam custo `0` (entrada/saída/cache).

| ID do modelo                                          | Janela de contexto | Máx. de tokens | Reasoning | Entrada       |
| ----------------------------------------------------- | ------------------ | -------------- | --------- | ------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                           | 192,000            | 65,536         | não       | text          |
| `hf:moonshotai/Kimi-K2-Thinking`                      | 256,000            | 8,192          | sim       | text          |
| `hf:zai-org/GLM-4.7`                                  | 198,000            | 128,000        | não       | text          |
| `hf:deepseek-ai/DeepSeek-R1-0528`                     | 128,000            | 8,192          | não       | text          |
| `hf:deepseek-ai/DeepSeek-V3-0324`                     | 128,000            | 8,192          | não       | text          |
| `hf:deepseek-ai/DeepSeek-V3.1`                        | 128,000            | 8,192          | não       | text          |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`               | 128,000            | 8,192          | não       | text          |
| `hf:deepseek-ai/DeepSeek-V3.2`                        | 159,000            | 8,192          | não       | text          |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                | 128,000            | 8,192          | não       | text          |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`| 524,000            | 8,192          | não       | text          |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                 | 256,000            | 8,192          | não       | text          |
| `hf:moonshotai/Kimi-K2.5`                             | 256,000            | 8,192          | sim       | text + image  |
| `hf:openai/gpt-oss-120b`                              | 128,000            | 8,192          | não       | text          |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`               | 256,000            | 8,192          | não       | text          |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`              | 256,000            | 8,192          | não       | text          |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                 | 250,000            | 8,192          | não       | text + image  |
| `hf:zai-org/GLM-4.5`                                  | 128,000            | 128,000        | não       | text          |
| `hf:zai-org/GLM-4.6`                                  | 198,000            | 128,000        | não       | text          |
| `hf:zai-org/GLM-5`                                    | 256,000            | 128,000        | sim       | text + image  |
| `hf:deepseek-ai/DeepSeek-V3`                          | 128,000            | 8,192          | não       | text          |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`               | 256,000            | 8,192          | sim       | text          |

<Tip>
Referências de modelo usam o formato `synthetic/<modelId>`. Use
`openclaw models list --provider synthetic` para ver todos os modelos disponíveis na sua
conta.
</Tip>

<AccordionGroup>
  <Accordion title="Allowlist de modelos">
    Se você habilitar uma allowlist de modelos (`agents.defaults.models`), adicione todos os
    modelos Synthetic que pretende usar. Modelos fora da allowlist ficarão ocultos
    para o agente.
  </Accordion>

  <Accordion title="Sobrescrita de base URL">
    Se a Synthetic alterar seu endpoint de API, sobrescreva a base URL na sua configuração:

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

    Lembre-se de que o OpenClaw acrescenta `/v1` automaticamente.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Regras de provedor, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Schema completo de configuração, incluindo definições de provedor.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Dashboard da Synthetic e documentação da API.
  </Card>
</CardGroup>
