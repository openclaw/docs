---
read_when:
    - Você quer o catálogo do OpenCode Go
    - Você precisa dos model refs de runtime para modelos hospedados pelo Go
summary: Use o catálogo do OpenCode Go com a configuração compartilhada do OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-22T04:27:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb03bc609f0dfff2981eac13b67cbcae066184f4606ce54ba24ca6a5737fdae8
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go é o catálogo Go dentro de [OpenCode](/pt-BR/providers/opencode).
Ele usa a mesma `OPENCODE_API_KEY` do catálogo Zen, mas mantém o id de provider de
runtime `opencode-go` para que o roteamento upstream por modelo permaneça correto.

| Propriedade      | Valor                           |
| ---------------- | ------------------------------- |
| Provider de runtime | `opencode-go`                |
| Autenticação     | `OPENCODE_API_KEY`              |
| Configuração pai | [OpenCode](/pt-BR/providers/opencode) |

## Modelos compatíveis

O OpenClaw obtém o catálogo Go do registro de modelos Pi incluído. Execute
`openclaw models list --provider opencode-go` para a lista atual de modelos.

No catálogo Pi incluído, o provider inclui:

| Model ref                  | Nome                  |
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
      <Step title="Executar o onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Definir um modelo Go como padrão">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Verificar se os modelos estão disponíveis">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Não interativo">
    <Steps>
      <Step title="Passar a chave diretamente">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verificar se os modelos estão disponíveis">
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
    O OpenClaw lida automaticamente com o roteamento por modelo quando o model ref usa
    `opencode-go/...`. Nenhuma configuração adicional de provider é necessária.
  </Accordion>

  <Accordion title="Convenção de ref de runtime">
    Os refs de runtime permanecem explícitos: `opencode/...` para Zen, `opencode-go/...` para Go.
    Isso mantém o roteamento upstream por modelo correto em ambos os catálogos.
  </Accordion>

  <Accordion title="Credenciais compartilhadas">
    A mesma `OPENCODE_API_KEY` é usada pelos catálogos Zen e Go. Inserir
    a chave durante a configuração armazena credenciais para ambos os providers de runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Consulte [OpenCode](/pt-BR/providers/opencode) para a visão geral compartilhada do onboarding e a referência completa
dos catálogos Zen + Go.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenCode (pai)" href="/pt-BR/providers/opencode" icon="server">
    Onboarding compartilhado, visão geral do catálogo e observações avançadas.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, model refs e comportamento de failover.
  </Card>
</CardGroup>
