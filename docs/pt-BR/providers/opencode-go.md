---
read_when:
    - Você quer o catálogo Go do OpenCode
    - Você precisa das refs de modelo de runtime para modelos hospedados em Go
summary: Use o catálogo Go do OpenCode com a configuração compartilhada do OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T18:20:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b2b5ba7f81cc101c3e9abdd79a18dc523a4f18b10242a0513b288fcbcc975e4
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go é o catálogo Go dentro do [OpenCode](/pt-BR/providers/opencode).
Ele usa a mesma `OPENCODE_API_KEY` do catálogo Zen, mas mantém o id de provedor de runtime
`opencode-go` para que o roteamento upstream por modelo permaneça correto.

| Propriedade      | Valor                           |
| ---------------- | ------------------------------- |
| Provedor de runtime | `opencode-go`                |
| Auth             | `OPENCODE_API_KEY`              |
| Configuração pai | [OpenCode](/pt-BR/providers/opencode) |

## Catálogo integrado

O OpenClaw obtém a maior parte das linhas do catálogo Go a partir do registro de modelos Pi empacotado e
complementa linhas upstream atuais enquanto o registro é atualizado. Execute
`openclaw models list --provider opencode-go` para ver a lista atual de modelos.

O provedor inclui:

| Ref de modelo                    | Nome                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (limites 3x) |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

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
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
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
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Configuração avançada

<AccordionGroup>
  <Accordion title="Comportamento de roteamento">
    O OpenClaw cuida automaticamente do roteamento por modelo quando a ref do modelo usa
    `opencode-go/...`. Nenhuma configuração adicional de provedor é necessária.
  </Accordion>

  <Accordion title="Convenção de ref de runtime">
    As refs de runtime permanecem explícitas: `opencode/...` para Zen, `opencode-go/...` para Go.
    Isso mantém correto o roteamento upstream por modelo em ambos os catálogos.
  </Accordion>

  <Accordion title="Credenciais compartilhadas">
    A mesma `OPENCODE_API_KEY` é usada pelos catálogos Zen e Go. Informar
    a chave durante a configuração armazena credenciais para ambos os provedores de runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Consulte [OpenCode](/pt-BR/providers/opencode) para a visão geral compartilhada de onboarding e a referência completa
dos catálogos Zen + Go.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenCode (pai)" href="/pt-BR/providers/opencode" icon="server">
    Onboarding compartilhado, visão geral do catálogo e observações avançadas.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, refs de modelo e comportamento de failover.
  </Card>
</CardGroup>
