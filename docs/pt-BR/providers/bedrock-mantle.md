---
read_when:
    - Você quer usar modelos OSS hospedados no Bedrock Mantle com o OpenClaw
    - Você precisa do endpoint compatível com OpenAI do Mantle para GPT-OSS, Qwen, Kimi ou GLM
summary: Use modelos Amazon Bedrock Mantle (compatíveis com OpenAI) com o OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-24T06:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

O OpenClaw inclui um provider empacotado **Amazon Bedrock Mantle** que se conecta ao
endpoint compatível com OpenAI do Mantle. O Mantle hospeda modelos open-source e
de terceiros (GPT-OSS, Qwen, Kimi, GLM e semelhantes) por meio de uma superfície padrão
`/v1/chat/completions` sustentada pela infraestrutura do Bedrock.

| Propriedade    | Valor                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| ID do provider | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (compatível com OpenAI) ou `anthropic-messages` (rota Anthropic Messages) |
| Autenticação   | `AWS_BEARER_TOKEN_BEDROCK` explícito ou geração de bearer token via cadeia de credenciais IAM |
| Região padrão  | `us-east-1` (substitua com `AWS_REGION` ou `AWS_DEFAULT_REGION`)                            |

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Bearer token explícito">
    **Melhor para:** ambientes em que você já tenha um bearer token do Mantle.

    <Steps>
      <Step title="Defina o bearer token no host do gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Opcionalmente, defina uma região (o padrão é `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifique se os modelos foram descobertos">
        ```bash
        openclaw models list
        ```

        Os modelos descobertos aparecem sob o provider `amazon-bedrock-mantle`. Nenhuma
        configuração adicional é necessária, a menos que você queira substituir padrões.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Credenciais IAM">
    **Melhor para:** usar credenciais compatíveis com AWS SDK (configuração compartilhada, SSO, identidade web, funções de instância ou tarefa).

    <Steps>
      <Step title="Configure credenciais AWS no host do gateway">
        Qualquer origem de autenticação compatível com AWS SDK funciona:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifique se os modelos foram descobertos">
        ```bash
        openclaw models list
        ```

        O OpenClaw gera automaticamente um bearer token do Mantle a partir da cadeia de credenciais.
      </Step>
    </Steps>

    <Tip>
    Quando `AWS_BEARER_TOKEN_BEDROCK` não está definido, o OpenClaw emite o bearer token para você a partir da cadeia padrão de credenciais AWS, incluindo perfis compartilhados de credenciais/configuração, SSO, identidade web e funções de instância ou tarefa.
    </Tip>

  </Tab>
</Tabs>

## Descoberta automática de modelo

Quando `AWS_BEARER_TOKEN_BEDROCK` está definido, o OpenClaw o usa diretamente. Caso contrário,
o OpenClaw tenta gerar um bearer token do Mantle a partir da cadeia padrão de
credenciais AWS. Depois, ele descobre os modelos Mantle disponíveis consultando o
endpoint regional `/v1/models`.

| Comportamento       | Detalhe                     |
| ------------------- | --------------------------- |
| Cache de descoberta | Resultados em cache por 1 hora |
| Atualização do token IAM | A cada hora             |

<Note>
O bearer token é o mesmo `AWS_BEARER_TOKEN_BEDROCK` usado pelo provider padrão de [Amazon Bedrock](/pt-BR/providers/bedrock).
</Note>

### Regiões compatíveis

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Configuração manual

Se você preferir configuração explícita em vez de descoberta automática:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Configuração avançada

<AccordionGroup>
  <Accordion title="Suporte a raciocínio">
    O suporte a raciocínio é inferido a partir de IDs de modelo que contenham padrões como
    `thinking`, `reasoner` ou `gpt-oss-120b`. O OpenClaw define `reasoning: true`
    automaticamente para modelos correspondentes durante a descoberta.
  </Accordion>

  <Accordion title="Indisponibilidade do endpoint">
    Se o endpoint do Mantle estiver indisponível ou não retornar modelos, o provider será
    ignorado silenciosamente. O OpenClaw não gera erro; outros providers configurados
    continuam funcionando normalmente.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via rota Anthropic Messages">
    O Mantle também expõe uma rota Anthropic Messages que transporta modelos Claude pelo mesmo caminho de streaming autenticado por bearer. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) pode ser chamado por essa rota com streaming controlado pelo provider, então bearer tokens AWS não são tratados como chaves de API da Anthropic.

    Quando você fixa um modelo Anthropic Messages no provider Mantle, o OpenClaw usa a superfície de API `anthropic-messages` em vez de `openai-completions` para esse modelo. A autenticação ainda vem de `AWS_BEARER_TOKEN_BEDROCK` (ou do bearer token IAM emitido).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Relação com o provider Amazon Bedrock">
    Bedrock Mantle é um provider separado do provider padrão
    [Amazon Bedrock](/pt-BR/providers/bedrock). O Mantle usa uma
    superfície `/v1` compatível com OpenAI, enquanto o provider padrão do Bedrock usa
    a API nativa do Bedrock.

    Ambos os providers compartilham a mesma credencial `AWS_BEARER_TOKEN_BEDROCK` quando
    presente.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/pt-BR/providers/bedrock" icon="cloud">
    Provider nativo do Bedrock para Anthropic Claude, Titan e outros modelos.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e como resolvê-los.
  </Card>
</CardGroup>
