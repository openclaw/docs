---
read_when:
    - Você quer acesso a modelos hospedados no OpenCode
    - Você quer escolher entre os catálogos Zen e Go
summary: Usar catálogos OpenCode Zen e Go com o OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-24T06:08:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d59c82a46988ef7dbbc98895af34441a5b378e5110ea636104df5f9c3672e3f0
    source_path: providers/opencode.md
    workflow: 15
---

O OpenCode expõe dois catálogos hospedados no OpenClaw:

| Catálogo | Prefixo           | Provedor de runtime |
| -------- | ----------------- | ------------------- |
| **Zen**  | `opencode/...`    | `opencode`          |
| **Go**   | `opencode-go/...` | `opencode-go`       |

Ambos os catálogos usam a mesma chave de API do OpenCode. O OpenClaw mantém os IDs de provedor de runtime
separados para que o roteamento upstream por modelo permaneça correto, mas onboarding e documentação tratam
isso como uma única configuração do OpenCode.

## Primeiros passos

<Tabs>
  <Tab title="Zen catalog">
    **Melhor para:** o proxy multimodelo curado do OpenCode (Claude, GPT, Gemini).

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Zen model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **Melhor para:** a linha hospedada no OpenCode de Kimi, GLM e MiniMax.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Go model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Verify models are available">
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

| Propriedade      | Valor                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Provedor de runtime | `opencode`                                                           |
| Modelos de exemplo | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Propriedade      | Valor                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Provedor de runtime | `opencode-go`                                                         |
| Modelos de exemplo | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Aliases de chave de API">
    `OPENCODE_ZEN_API_KEY` também é compatível como alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Credenciais compartilhadas">
    Informar uma única chave OpenCode durante a configuração armazena credenciais para ambos os provedores de runtime.
    Você não precisa executar onboarding separadamente para cada catálogo.
  </Accordion>

  <Accordion title="Cobrança e dashboard">
    Você faz login no OpenCode, adiciona detalhes de cobrança e copia sua chave de API. A cobrança
    e a disponibilidade do catálogo são gerenciadas no dashboard do OpenCode.
  </Accordion>

  <Accordion title="Comportamento de replay do Gemini">
    Refs de OpenCode com backend Gemini permanecem no caminho proxy-Gemini, então o OpenClaw mantém
    ali a sanitização de assinatura de pensamento do Gemini sem ativar validação nativa
    de replay do Gemini nem reescritas de bootstrap.
  </Accordion>

  <Accordion title="Comportamento de replay fora do Gemini">
    Refs de OpenCode que não são Gemini mantêm a política mínima de replay compatível com OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Informar uma única chave OpenCode durante a configuração armazena credenciais tanto para os provedores de runtime Zen quanto Go, então você só precisa executar onboarding uma vez.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de fallback.
  </Card>
  <Card title="Configuration reference" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
