---
read_when:
    - Você quer usar o Synthetic como provedor de modelos
    - Você precisa configurar uma chave de API ou uma URL base da Synthetic
summary: Use a API compatível com Anthropic da Synthetic no OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-07-12T15:35:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) disponibiliza endpoints compatíveis com a Anthropic.
O OpenClaw o inclui como o provedor `synthetic` e usa a API de mensagens
da Anthropic.

| Propriedade | Valor                                 |
| ----------- | ------------------------------------- |
| Provedor    | `synthetic`                           |
| Autenticação | `SYNTHETIC_API_KEY`                  |
| API         | Mensagens da Anthropic                |
| URL base    | `https://api.synthetic.new/anthropic` |

## Primeiros passos

<Steps>
  <Step title="Obtenha uma chave de API">
    Obtenha uma `SYNTHETIC_API_KEY` na sua conta da Synthetic ou permita que o processo de integração
    solicite uma.
  </Step>
  <Step title="Execute o processo de integração">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Verifique o modelo padrão">
    O processo de integração define o modelo padrão como:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
O cliente Anthropic do OpenClaw acrescenta `/v1` automaticamente à URL base; portanto, use
`https://api.synthetic.new/anthropic` (não `/anthropic/v1`). Se a Synthetic
alterar a URL base, substitua `models.providers.synthetic.baseUrl`.
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

Todos os modelos da Synthetic usam custo `0` (entrada/saída/cache).

| ID do modelo                                           | Janela de contexto | Máximo de tokens | Raciocínio | Entrada       |
| ------------------------------------------------------ | ------------------ | ---------------- | --------- | ------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000            | 65,536           | não       | texto         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000            | 8,192            | sim       | texto         |
| `hf:zai-org/GLM-4.7`                                   | 198,000            | 128,000          | não       | texto         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000            | 8,192            | não       | texto         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000            | 8,192            | não       | texto         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000            | 8,192            | não       | texto         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000            | 8,192            | não       | texto         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000            | 8,192            | não       | texto         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000            | 8,192            | não       | texto         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000            | 8,192            | não       | texto         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000            | 8,192            | não       | texto         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000            | 8,192            | sim       | texto + imagem |
| `hf:openai/gpt-oss-120b`                               | 128,000            | 8,192            | não       | texto         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000            | 8,192            | não       | texto         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000            | 8,192            | não       | texto         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000            | 8,192            | não       | texto + imagem |
| `hf:zai-org/GLM-4.5`                                   | 128,000            | 128,000          | não       | texto         |
| `hf:zai-org/GLM-4.6`                                   | 198,000            | 128,000          | não       | texto         |
| `hf:zai-org/GLM-5`                                     | 256,000            | 128,000          | sim       | texto + imagem |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000            | 8,192            | não       | texto         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000            | 8,192            | sim       | texto         |

<Tip>
As referências de modelo usam o formato `synthetic/<modelId>`. Use
`openclaw models list --provider synthetic` para ver todos os modelos disponíveis na sua
conta.
</Tip>

<AccordionGroup>
  <Accordion title="Lista de modelos permitidos">
    Se você habilitar uma lista de modelos permitidos (`agents.defaults.models`), adicione todos os
    modelos da Synthetic que pretende usar. Os modelos que não estiverem na lista são ocultados
    do agente.
  </Accordion>

  <Accordion title="Substituição da URL base">
    Se a Synthetic alterar o endpoint da API, substitua a URL base:

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

    O OpenClaw ainda acrescenta `/v1` automaticamente.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Regras de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração, incluindo as configurações de provedores.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Painel da Synthetic e documentação da API.
  </Card>
</CardGroup>
