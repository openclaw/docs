---
read_when:
    - Você quer acesso a modelos hospedados pelo OpenCode
    - Você quer escolher entre os catálogos Zen e Go
summary: Use os catálogos OpenCode Zen e Go com o OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T15:40:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

O OpenCode disponibiliza dois catálogos hospedados no OpenClaw:

| Catálogo | Prefixo           | Provedor de runtime |
| -------- | ----------------- | ------------------- |
| **Zen**  | `opencode/...`    | `opencode`          |
| **Go**   | `opencode-go/...` | `opencode-go`       |

Ambos os catálogos compartilham uma chave de API do OpenCode (`OPENCODE_API_KEY`, alias
`OPENCODE_ZEN_API_KEY`). O OpenClaw mantém separados os ids dos provedores de runtime para que
o roteamento por modelo no upstream permaneça correto, mas a configuração inicial e a documentação os tratam como
uma única configuração do OpenCode.

## Primeiros passos

<Tabs>
  <Tab title="Catálogo Zen">
    **Ideal para:** o proxy multimodelo selecionado do OpenCode (Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen).

    <Steps>
      <Step title="Execute a configuração inicial">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Ou informe a chave diretamente:

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
    **Ideal para:** a seleção de Kimi, GLM, MiniMax, Qwen e DeepSeek hospedada pelo OpenCode.

    <Steps>
      <Step title="Execute a configuração inicial">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Ou informe a chave diretamente:

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

## Catálogos integrados

### Zen

| Propriedade         | Valor                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Provedor de runtime | `opencode`                                                                                    |
| Modelos de exemplo  | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

Execute `openclaw models list --provider opencode` para obter a lista atual completa, que
também inclui opções do nível gratuito, como `opencode/big-pickle` e
`opencode/deepseek-v4-flash-free`.

### Go

| Propriedade         | Valor                                                                    |
| ------------------- | ------------------------------------------------------------------------ |
| Provedor de runtime | `opencode-go`                                                            |
| Modelos de exemplo  | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

Consulte [OpenCode Go](/pt-BR/providers/opencode-go) para ver a tabela completa de modelos Go.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Aliases da chave de API">
    `OPENCODE_ZEN_API_KEY` também é aceito como alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Credenciais compartilhadas">
    Inserir uma chave do OpenCode durante a configuração armazena as credenciais para ambos os provedores de
    runtime. Não é necessário configurar cada catálogo separadamente.
  </Accordion>

  <Accordion title="Como obter uma chave de API">
    Crie uma conta no OpenCode e gere uma chave de API em
    [opencode.ai/auth](https://opencode.ai/auth). O faturamento e a disponibilidade do catálogo
    são gerenciados pelo painel do OpenCode.
  </Accordion>

  <Accordion title="Comportamento de repetição do Gemini">
    As referências do OpenCode baseadas no Gemini permanecem no caminho proxy-Gemini, portanto o OpenClaw mantém
    a sanitização da assinatura de raciocínio do Gemini nesse caminho, sem habilitar a validação nativa de
    repetição do Gemini nem regravações de bootstrap.
  </Accordion>

  <Accordion title="Comportamento de repetição para modelos que não são Gemini">
    As referências do OpenCode que não são Gemini mantêm a política mínima de repetição compatível com a OpenAI.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/pt-BR/providers/opencode-go" icon="server">
    Referência completa do catálogo Go.
  </Card>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelos e o comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
