---
read_when:
    - Você quer acesso a modelos hospedados no OpenCode
    - Você quer escolher entre os catálogos Zen e Go
summary: Use catálogos OpenCode Zen e Go com o OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T13:54:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
---

O OpenCode expõe dois catálogos hospedados no OpenClaw:

| Catálogo | Prefixo           | Provedor de runtime |
| -------- | ----------------- | ------------------- |
| **Zen**  | `opencode/...`    | `opencode`          |
| **Go**   | `opencode-go/...` | `opencode-go`       |

Ambos os catálogos usam a mesma chave de API do OpenCode. O OpenClaw mantém os ids de provedor de runtime
separados para que o roteamento upstream por modelo permaneça correto, mas onboarding e documentação tratam
isso como uma única configuração do OpenCode.

## Primeiros passos

<Tabs>
  <Tab title="Catálogo Zen">
    **Ideal para:** o proxy multimodelo curado do OpenCode (Claude, GPT, Gemini).

    <Steps>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Defina um modelo Zen como padrão">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verifique se os modelos estão disponíveis">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Catálogo Go">
    **Ideal para:** a linha de modelos Kimi, GLM e MiniMax hospedada pelo OpenCode.

    <Steps>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
</Tabs>

## Exemplo de configuração

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Catálogos incluídos

### Zen

| Propriedade      | Valor                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Provedor de runtime | `opencode`                                                           |
| Modelos de exemplo | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Propriedade      | Valor                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Provedor de runtime | `opencode-go`                                                         |
| Modelos de exemplo | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Aliases de chave de API">
    `OPENCODE_ZEN_API_KEY` também é compatível como alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Credenciais compartilhadas">
    Informar uma chave OpenCode durante o setup armazena credenciais para ambos os provedores de runtime.
    Você não precisa fazer onboarding de cada catálogo separadamente.
  </Accordion>

  <Accordion title="Cobrança e painel">
    Você entra no OpenCode, adiciona detalhes de cobrança e copia sua chave de API. A cobrança
    e a disponibilidade do catálogo são gerenciadas pelo painel do OpenCode.
  </Accordion>

  <Accordion title="Comportamento de replay do Gemini">
    Refs do OpenCode com base em Gemini permanecem no caminho proxy-Gemini, então o OpenClaw mantém
    ali a sanitização de assinatura de pensamento do Gemini sem habilitar validação de
    replay nativo do Gemini nem reescritas de bootstrap.
  </Accordion>

  <Accordion title="Comportamento de replay não Gemini">
    Refs do OpenCode não Gemini mantêm a política mínima de replay compatível com OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Inserir uma chave OpenCode durante o setup armazena credenciais para ambos os provedores de runtime, Zen e
Go, então você só precisa fazer onboarding uma vez.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolhendo provedores, model refs e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
