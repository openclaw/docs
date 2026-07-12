---
read_when:
    - Você quer acesso a modelos hospedados pelo OpenCode
    - Você quer escolher entre os catálogos Zen e Go
summary: Use os catálogos OpenCode Zen e Go com o OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T00:18:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

O OpenCode disponibiliza dois catálogos hospedados no OpenClaw:

| Catálogo | Prefixo           | Provedor de execução |
| -------- | ----------------- | -------------------- |
| **Zen**  | `opencode/...`    | `opencode`           |
| **Go**   | `opencode-go/...` | `opencode-go`        |

Ambos os catálogos compartilham uma chave de API do OpenCode (`OPENCODE_API_KEY`, alias
`OPENCODE_ZEN_API_KEY`). O OpenClaw mantém separados os ids dos provedores de execução para
que o roteamento por modelo no upstream permaneça correto, mas a integração inicial e a documentação os tratam como
uma única configuração do OpenCode.

## Primeiros passos

<Tabs>
  <Tab title="Catálogo Zen">
    **Ideal para:** o proxy multimodelo selecionado do OpenCode (Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen).

    <Steps>
      <Step title="Execute a integração inicial">
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
    **Ideal para:** a seleção de modelos Kimi, GLM, MiniMax, Qwen e DeepSeek hospedada pelo OpenCode.

    <Steps>
      <Step title="Execute a integração inicial">
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

| Propriedade          | Valor                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Provedor de execução | `opencode`                                                                                    |
| Modelos de exemplo   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

Execute `openclaw models list --provider opencode` para obter a lista atual completa, que
também inclui opções da faixa gratuita, como `opencode/big-pickle` e
`opencode/deepseek-v4-flash-free`.

### Go

| Propriedade          | Valor                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| Provedor de execução | `opencode-go`                                                            |
| Modelos de exemplo   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

Consulte [OpenCode Go](/pt-BR/providers/opencode-go) para ver a tabela completa de modelos Go.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Aliases da chave de API">
    `OPENCODE_ZEN_API_KEY` também é aceita como alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Credenciais compartilhadas">
    Inserir uma chave do OpenCode durante a configuração armazena as credenciais para ambos os provedores de
    execução. Não é necessário realizar a integração inicial de cada catálogo separadamente.
  </Accordion>

  <Accordion title="Como obter uma chave de API">
    Crie uma conta do OpenCode e gere uma chave de API em
    [opencode.ai/auth](https://opencode.ai/auth). O faturamento e a disponibilidade dos catálogos
    são gerenciados no painel do OpenCode.
  </Accordion>

  <Accordion title="Comportamento de reprodução do Gemini">
    As referências do OpenCode baseadas no Gemini permanecem no caminho proxy-Gemini, portanto o OpenClaw mantém
    ali a higienização das assinaturas de raciocínio do Gemini sem habilitar a validação nativa de
    reprodução do Gemini nem reescritas de inicialização.
  </Accordion>

  <Accordion title="Comportamento de reprodução para modelos não Gemini">
    As referências do OpenCode que não usam Gemini mantêm a política mínima de reprodução compatível com OpenAI.
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
    Referência completa da configuração de agentes, modelos e provedores.
  </Card>
</CardGroup>
