---
read_when:
    - Você quer o catálogo do OpenCode Go
    - Você precisa das referências de modelo em tempo de execução para modelos hospedados no Go
summary: Use o catálogo OpenCode Go com a configuração compartilhada do OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T15:34:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go é o catálogo Go dentro do [OpenCode](/pt-BR/providers/opencode). Ele compartilha
a credencial `OPENCODE_API_KEY` com o catálogo Zen, mas mantém seu próprio
ID de provedor de runtime (`opencode-go`) para que o roteamento upstream por modelo
permaneça correto.

| Propriedade         | Valor                                              |
| ------------------- | -------------------------------------------------- |
| Provedor de runtime | `opencode-go`                                      |
| Autenticação        | `OPENCODE_API_KEY` (alias: `OPENCODE_ZEN_API_KEY`) |
| Configuração principal | [OpenCode](/pt-BR/providers/opencode)                 |

## Primeiros passos

<Tabs>
  <Tab title="Interativo">
    <Steps>
      <Step title="Execute a integração inicial">
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: segredo na lista de permissões
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Catálogo integrado

Execute `openclaw models list --provider opencode-go` para obter a lista atual de modelos.
Entradas incluídas:

| Referência do modelo             | Nome              | Contexto  | Saída máxima | Entrada de imagem |
| -------------------------------- | ----------------- | --------- | ------------ | ----------------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M        | 384K         | Não               |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M        | 384K         | Não               |
| `opencode-go/glm-5`             | GLM-5             | 202,752   | 32,768       | Não               |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752   | 32,768       | Não               |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M        | 131,072      | Não               |
| `opencode-go/hy3-preview`       | HY3 Preview       | 262,144   | 32,768       | Não               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144   | 65,536       | Sim               |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144   | 65,536       | Sim               |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144   | 262,144      | Sim               |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000      | Sim               |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576 | 128,000      | Não               |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800   | 65,536       | Não               |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800   | 131,072      | Não               |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800   | 131,072      | Não               |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144   | 65,536       | Sim               |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144   | 65,536       | Sim               |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M        | 65,536       | Não               |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M        | 65,536       | Sim               |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Comportamento de roteamento">
    O OpenClaw roteia automaticamente qualquer referência de modelo `opencode-go/...`. Nenhuma
    configuração adicional de provedor é necessária.
  </Accordion>

  <Accordion title="Convenção de referências de runtime">
    As referências de runtime permanecem explícitas: `opencode/...` para Zen, `opencode-go/...` para
    Go. Isso mantém correto o roteamento upstream por modelo nos dois catálogos.
  </Accordion>

  <Accordion title="Credenciais compartilhadas">
    Uma única `OPENCODE_API_KEY` atende aos catálogos Zen e Go. Inserir a
    chave durante a configuração armazena as credenciais para ambos os provedores de runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Consulte [OpenCode](/pt-BR/providers/opencode) para ver a visão geral da integração inicial compartilhada e a referência
completa dos catálogos Zen + Go.
</Tip>

## Relacionados

<CardGroup cols={2}>
  <Card title="OpenCode (principal)" href="/pt-BR/providers/opencode" icon="server">
    Integração inicial compartilhada, visão geral do catálogo e observações avançadas.
  </Card>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
</CardGroup>
