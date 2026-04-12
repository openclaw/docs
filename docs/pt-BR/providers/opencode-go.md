---
read_when:
    - Você quer o catálogo OpenCode Go
    - Você precisa das refs de modelo em runtime para modelos hospedados em Go
summary: Use o catálogo OpenCode Go com a configuração compartilhada do OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-12T23:32:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f0f182de81729616ccc19125d93ba0445de2349daf7067b52e8c15b9d3539c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go é o catálogo Go dentro do [OpenCode](/pt-BR/providers/opencode).
Ele usa a mesma `OPENCODE_API_KEY` que o catálogo Zen, mas mantém o ID de provider
de runtime `opencode-go` para que o roteamento upstream por modelo permaneça correto.

| Propriedade      | Valor                           |
| ---------------- | ------------------------------- |
| Provider runtime | `opencode-go`                   |
| Autenticação     | `OPENCODE_API_KEY`              |
| Setup pai        | [OpenCode](/pt-BR/providers/opencode) |

## Modelos compatíveis

| Ref do modelo              | Nome         |
| -------------------------- | ------------ |
| `opencode-go/kimi-k2.5`    | Kimi K2.5    |
| `opencode-go/glm-5`        | GLM 5        |
| `opencode-go/minimax-m2.5` | MiniMax M2.5 |

## Primeiros passos

<Tabs>
  <Tab title="Interativo">
    <Steps>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Defina um modelo Go como padrão">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Verifique se os modelos estão disponíveis">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Não interativo">
    <Steps>
      <Step title="Passe a chave diretamente">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verifique se os modelos estão disponíveis">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Exemplo de configuração

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Observações avançadas

<AccordionGroup>
  <Accordion title="Comportamento de roteamento">
    O OpenClaw lida automaticamente com o roteamento por modelo quando a ref do modelo usa
    `opencode-go/...`. Nenhuma configuração adicional do provider é necessária.
  </Accordion>

  <Accordion title="Convenção de refs de runtime">
    As refs de runtime permanecem explícitas: `opencode/...` para Zen, `opencode-go/...` para Go.
    Isso mantém correto o roteamento upstream por modelo em ambos os catálogos.
  </Accordion>

  <Accordion title="Credenciais compartilhadas">
    A mesma `OPENCODE_API_KEY` é usada pelos catálogos Zen e Go. Inserir
    a chave durante o setup armazena credenciais para ambos os providers de runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Consulte [OpenCode](/pt-BR/providers/opencode) para ver a visão geral compartilhada de onboarding e a referência completa dos catálogos Zen + Go.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenCode (pai)" href="/pt-BR/providers/opencode" icon="server">
    Onboarding compartilhado, visão geral do catálogo e observações avançadas.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher providers, refs de modelo e comportamento de failover.
  </Card>
</CardGroup>
