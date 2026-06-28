---
read_when:
    - Você quer acesso a modelos hospedado pelo OpenCode
    - Você quer escolher entre os catálogos Zen e Go
summary: Use os catálogos OpenCode Zen e Go com o OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:44:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode expõe dois catálogos hospedados no OpenClaw:

| Catálogo | Prefixo           | Provedor de runtime |
| -------- | ----------------- | ------------------- |
| **Zen**  | `opencode/...`    | `opencode`          |
| **Go**   | `opencode-go/...` | `opencode-go`       |

Ambos os catálogos usam a mesma chave de API do OpenCode. O OpenClaw mantém os IDs dos provedores de runtime
separados para que o roteamento upstream por modelo permaneça correto, mas a integração inicial e a documentação os tratam
como uma única configuração do OpenCode.

## Primeiros passos

<Tabs>
  <Tab title="Catálogo Zen">
    **Melhor para:** o proxy multimodelo selecionado do OpenCode (Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="Executar a integração inicial">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Definir um modelo Zen como padrão">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verificar se os modelos estão disponíveis">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Catálogo Go">
    **Melhor para:** a linha Kimi, GLM e MiniMax hospedada pelo OpenCode.

    <Steps>
      <Step title="Executar a integração inicial">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
</Tabs>

## Exemplo de configuração

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Catálogos integrados

### Zen

| Propriedade         | Valor                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Provedor de runtime | `opencode`                                                                                    |
| Modelos de exemplo  | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| Propriedade         | Valor                                                                    |
| ------------------- | ------------------------------------------------------------------------ |
| Provedor de runtime | `opencode-go`                                                            |
| Modelos de exemplo  | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Aliases de chave de API">
    `OPENCODE_ZEN_API_KEY` também é compatível como um alias para `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Credenciais compartilhadas">
    Inserir uma chave do OpenCode durante a configuração armazena credenciais para ambos os provedores de runtime.
    Você não precisa configurar cada catálogo separadamente na integração inicial.
  </Accordion>

  <Accordion title="Cobrança e painel">
    Você entra no OpenCode, adiciona os detalhes de cobrança e copia sua chave de API. A cobrança
    e a disponibilidade do catálogo são gerenciadas pelo painel do OpenCode.
  </Accordion>

  <Accordion title="Comportamento de repetição do Gemini">
    As refs do OpenCode baseadas no Gemini permanecem no caminho proxy-Gemini, portanto o OpenClaw mantém
    a sanitização de assinatura de pensamento do Gemini ali sem habilitar a validação de repetição nativa do Gemini
    nem reescritas de bootstrap.
  </Accordion>

  <Accordion title="Comportamento de repetição não Gemini">
    As refs do OpenCode não Gemini mantêm a política mínima de repetição compatível com OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Inserir uma chave do OpenCode durante a configuração armazena credenciais para os provedores de runtime Zen e
Go, então você só precisa fazer a integração inicial uma vez.
</Tip>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de alternância em caso de falha.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
