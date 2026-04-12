---
read_when:
    - Você quer acesso a modelos hospedados no OpenCode
    - Você quer escolher entre os catálogos Zen e Go
summary: Usar catálogos OpenCode Zen e Go com o OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-12T23:32:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a68444d8c403c3caba4a18ea47f078c7a4c163f874560e1fad0e818afb6e0e60
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

O OpenCode expõe dois catálogos hospedados no OpenClaw:

| Catalog | Prefix            | Runtime provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Ambos os catálogos usam a mesma chave de API do OpenCode. O OpenClaw mantém os ids de provedor de runtime
separados para que o roteamento upstream por modelo permaneça correto, mas o onboarding e a documentação os tratam
como uma única configuração do OpenCode.

## Introdução

<Tabs>
  <Tab title="Catálogo Zen">
    **Ideal para:** o proxy multimodelo selecionado do OpenCode (Claude, GPT, Gemini).

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
    **Ideal para:** a linha hospedada pelo OpenCode de Kimi, GLM e MiniMax.

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
</Tabs>

## Exemplo de config

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Catálogos

### Zen

| Property         | Value                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Provedor de runtime | `opencode`                                                           |
| Modelos de exemplo | `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro` |

### Go

| Property         | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Provedor de runtime | `opencode-go`                                                         |
| Modelos de exemplo | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Observações avançadas

<AccordionGroup>
  <Accordion title="Aliases de chave de API">
    `OPENCODE_ZEN_API_KEY` também é compatível como alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Credenciais compartilhadas">
    Informar uma chave OpenCode durante a configuração armazena credenciais para ambos os provedores de runtime.
    Você não precisa fazer onboarding de cada catálogo separadamente.
  </Accordion>

  <Accordion title="Cobrança e painel">
    Você faz login no OpenCode, adiciona os detalhes de cobrança e copia sua chave de API. A cobrança
    e a disponibilidade de catálogos são gerenciadas pelo painel do OpenCode.
  </Accordion>

  <Accordion title="Comportamento de replay do Gemini">
    As refs OpenCode com suporte do Gemini permanecem no caminho proxy-Gemini, então o OpenClaw mantém
    a sanitização de thought-signature do Gemini ali sem habilitar validação nativa de replay do Gemini
    nem reescritas de bootstrap.
  </Accordion>

  <Accordion title="Comportamento de replay não-Gemini">
    As refs OpenCode não-Gemini mantêm a política mínima de replay compatível com OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Informar uma chave OpenCode durante a configuração armazena credenciais tanto para os provedores de runtime Zen quanto
Go, então você só precisa fazer onboarding uma vez.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolhendo provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
