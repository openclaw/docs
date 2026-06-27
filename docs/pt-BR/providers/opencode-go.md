---
read_when:
    - Você quer o catálogo OpenCode Go
    - Você precisa das referências de modelo de runtime para modelos hospedados em Go
summary: Use o catálogo Go do OpenCode com a configuração compartilhada do OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T18:05:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go é o catálogo Go dentro de [OpenCode](/pt-BR/providers/opencode).
Ele usa a mesma `OPENCODE_API_KEY` que o catálogo Zen, mas mantém o id do provedor
de runtime `opencode-go` para que o roteamento upstream por modelo permaneça correto.

| Propriedade         | Valor                           |
| ------------------- | ------------------------------- |
| Provedor de runtime | `opencode-go`                   |
| Autenticação        | `OPENCODE_API_KEY`              |
| Configuração pai    | [OpenCode](/pt-BR/providers/opencode) |

## Catálogo integrado

A OpenClaw obtém a maioria das linhas do catálogo Go do registro de modelos integrado da OpenClaw e
complementa linhas upstream atuais enquanto o registro é atualizado. Execute
`openclaw models list --provider opencode-go` para a lista de modelos atual.

O provedor inclui:

| Ref. do modelo                  | Nome                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/glm-5.2`           | GLM-5.2               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (limites 3x) |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

GLM-5.2 usa uma janela de contexto de 1 milhão de tokens e oferece suporte a até 131 mil tokens de saída.

## Primeiros passos

<Tabs>
  <Tab title="Interativo">
    <Steps>
      <Step title="Executar integração">
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
    A OpenClaw lida automaticamente com o roteamento por modelo quando a ref. do modelo usa
    `opencode-go/...`. Nenhuma configuração adicional de provedor é necessária.
  </Accordion>

  <Accordion title="Convenção de ref. de runtime">
    As refs. de runtime permanecem explícitas: `opencode/...` para Zen, `opencode-go/...` para Go.
    Isso mantém o roteamento upstream por modelo correto nos dois catálogos.
  </Accordion>

  <Accordion title="Credenciais compartilhadas">
    A mesma `OPENCODE_API_KEY` é usada pelos catálogos Zen e Go. Informar
    a chave durante a configuração armazena credenciais para ambos os provedores de runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Consulte [OpenCode](/pt-BR/providers/opencode) para a visão geral da integração compartilhada e a referência completa
dos catálogos Zen + Go.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenCode (pai)" href="/pt-BR/providers/opencode" icon="server">
    Integração compartilhada, visão geral do catálogo e notas avançadas.
  </Card>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs. de modelo e comportamento de failover.
  </Card>
</CardGroup>
