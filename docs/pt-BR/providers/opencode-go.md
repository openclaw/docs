---
read_when:
    - Você quer o catálogo OpenCode Go
    - Você precisa das refs. de modelo em tempo de execução para modelos hospedados no Go
summary: Use o catálogo OpenCode Go com a configuração compartilhada do OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T13:54:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42aba47207d85cdc6d2c5d85c3726da660b456320765c83df92ee705f005d3c3
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go é o catálogo Go dentro de [OpenCode](/pt-BR/providers/opencode).
Ele usa a mesma `OPENCODE_API_KEY` do catálogo Zen, mas mantém o id do provedor de
tempo de execução `opencode-go` para que o roteamento upstream por modelo permaneça correto.

| Propriedade             | Valor                           |
| ----------------------- | ------------------------------- |
| Provedor de tempo de execução | `opencode-go`             |
| Autenticação            | `OPENCODE_API_KEY`              |
| Configuração pai        | [OpenCode](/pt-BR/providers/opencode) |

## Catálogo integrado

O OpenClaw obtém o catálogo Go do registro de modelos Pi incluído. Execute
`openclaw models list --provider opencode-go` para ver a lista atual de modelos.

No catálogo Pi incluído atualmente, o provedor inclui:

| Ref. do modelo             | Nome                  |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (limites 3x) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## Primeiros passos

<Tabs>
  <Tab title="Interativo">
    <Steps>
      <Step title="Execute a configuração inicial">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Defina um modelo Go como padrão">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
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
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Configuração avançada

<AccordionGroup>
  <Accordion title="Comportamento de roteamento">
    O OpenClaw lida com o roteamento por modelo automaticamente quando a ref. do modelo usa
    `opencode-go/...`. Nenhuma configuração adicional do provedor é necessária.
  </Accordion>

  <Accordion title="Convenção de ref. em tempo de execução">
    As refs. em tempo de execução permanecem explícitas: `opencode/...` para Zen, `opencode-go/...` para Go.
    Isso mantém correto o roteamento upstream por modelo em ambos os catálogos.
  </Accordion>

  <Accordion title="Credenciais compartilhadas">
    A mesma `OPENCODE_API_KEY` é usada pelos catálogos Zen e Go. Inserir
    a chave durante a configuração armazena credenciais para ambos os provedores de tempo de execução.
  </Accordion>
</AccordionGroup>

<Tip>
Consulte [OpenCode](/pt-BR/providers/opencode) para a visão geral da configuração compartilhada e a referência completa
dos catálogos Zen + Go.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenCode (pai)" href="/pt-BR/providers/opencode" icon="server">
    Configuração compartilhada, visão geral do catálogo e observações avançadas.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, refs. de modelo e comportamento de failover.
  </Card>
</CardGroup>
