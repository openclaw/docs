---
read_when:
    - Você quer uma única chave de API para vários LLMs
    - Você quer executar modelos por meio do Kilo Gateway no OpenClaw
summary: Use a API unificada do Kilo Gateway para acessar diversos modelos no OpenClaw
title: Gateway Kilo
x-i18n:
    generated_at: "2026-07-12T15:40:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

O Kilo Gateway encaminha solicitações para vários modelos por meio de um único endpoint compatível com OpenAI e uma única chave de API.

| Propriedade | Valor                              |
| -------- | ---------------------------------- |
| Provedor | `kilocode`                         |
| Autenticação | `KILOCODE_API_KEY`                 |
| API      | Compatível com OpenAI                  |
| URL base | `https://api.kilo.ai/api/gateway/` |

## Instalar o plugin

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Configuração

<Steps>
  <Step title="Criar uma conta">
    Acesse [app.kilo.ai](https://app.kilo.ai), faça login ou crie uma conta e gere uma chave de API.
  </Step>
  <Step title="Executar a integração inicial">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Ou defina diretamente a variável de ambiente:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verificar se o modelo está disponível">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Modelo padrão e catálogo

O modelo padrão é `kilocode/kilo/auto`, um modelo de roteamento inteligente gerenciado pelo provedor. O OpenClaw não
publica um mapeamento de tarefas para modelos upstream; o roteamento por trás de `kilo/auto` é gerenciado pelo Kilo Gateway.

Na inicialização, o OpenClaw consulta `GET https://api.kilo.ai/api/gateway/models` e mescla os modelos descobertos
antes de um catálogo estático de contingência. O catálogo estático de contingência contém apenas `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`).

Qualquer modelo no gateway pode ser acessado como `kilocode/<upstream-id>` (por exemplo,
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Execute `/models kilocode` ou
`openclaw models list --provider kilocode` para ver a lista completa descoberta.

## Exemplo de configuração

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## Notas de comportamento

<AccordionGroup>
  <Accordion title="Transporte e compatibilidade">
    O Kilo Gateway é compatível com OpenRouter, portanto usa o caminho de solicitação compatível com OpenAI no estilo proxy,
    em vez da formatação nativa de solicitações da OpenAI (sem `store` e sem payload de esforço de raciocínio da OpenAI).

    - As referências do Kilo baseadas no Gemini permanecem no caminho proxy do Gemini: o OpenClaw sanitiza as assinaturas
      de pensamento do Gemini nesse caminho, mas não habilita a validação nativa de repetição do Gemini nem reescritas de bootstrap.
    - As solicitações usam um token Bearer criado a partir da sua chave de API.

  </Accordion>

  <Accordion title="Wrapper de streaming e raciocínio">
    O wrapper de streaming do Kilo adiciona um cabeçalho de solicitação `X-KILOCODE-FEATURE` (o padrão é `openclaw`,
    substituível pela variável de ambiente `KILOCODE_FEATURE`) e normaliza os payloads de esforço de raciocínio para
    os modelos que oferecem suporte a esse recurso.

    <Warning>
    As referências `kilocode/kilo/auto` e `x-ai/*` não recebem a injeção de esforço de raciocínio. Use uma referência de modelo
    específica, como `kilocode/anthropic/claude-sonnet-4`, se precisar de suporte a raciocínio.
    </Warning>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Se a descoberta de modelos falhar na inicialização, o OpenClaw usará o catálogo estático de contingência que contém `kilocode/kilo/auto`.
    - Confirme se sua chave de API é válida e se os modelos desejados estão habilitados na sua conta do Kilo.
    - Quando o Gateway for executado como daemon, verifique se `KILOCODE_API_KEY` está disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou por meio de `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelos e o comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Painel do Kilo Gateway, chaves de API e gerenciamento da conta.
  </Card>
</CardGroup>
