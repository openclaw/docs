---
read_when:
    - Você quer usar modelos OSS hospedados no Bedrock Mantle com o OpenClaw
    - Você precisa do endpoint compatível com OpenAI do Mantle para GPT-OSS, Qwen, Kimi ou GLM
summary: Use modelos Amazon Bedrock Mantle (compatíveis com OpenAI) com OpenClaw
title: Manto do Amazon Bedrock
x-i18n:
    generated_at: "2026-05-10T19:47:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 721eef5b7ff606b8c5e02234dae1b8d846b43ff9f3d7bf871f701bb3136fec0e
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw inclui um provedor **Amazon Bedrock Mantle** integrado que se conecta ao
endpoint compatível com OpenAI da Mantle. A Mantle hospeda modelos de código
aberto e de terceiros (GPT-OSS, Qwen, Kimi, GLM e similares) por meio de uma
superfície padrão `/v1/chat/completions` apoiada pela infraestrutura da Bedrock.

| Propriedade    | Valor                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| ID do provedor | `amazon-bedrock-mantle`                                                                                    |
| API            | `openai-completions` (compatível com OpenAI) ou `anthropic-messages` (rota Anthropic Messages)             |
| Autenticação   | `AWS_BEARER_TOKEN_BEDROCK` explícito ou geração de token bearer pela cadeia de credenciais do IAM          |
| Região padrão  | `us-east-1` (substitua com `AWS_REGION` ou `AWS_DEFAULT_REGION`)                                           |

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Explicit bearer token">
    **Ideal para:** ambientes em que você já tem um token bearer da Mantle.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Opcionalmente, defina uma região (o padrão é `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        Os modelos descobertos aparecem sob o provedor `amazon-bedrock-mantle`. Nenhuma
        configuração adicional é necessária, a menos que você queira substituir os padrões.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Ideal para:** usar credenciais compatíveis com o AWS SDK (configuração compartilhada, SSO, identidade web, funções de instância ou de tarefa).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        Qualquer origem de autenticação compatível com o AWS SDK funciona:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        O OpenClaw gera automaticamente um token bearer da Mantle a partir da cadeia de credenciais.
      </Step>
    </Steps>

    <Tip>
    Quando `AWS_BEARER_TOKEN_BEDROCK` não está definido, o OpenClaw emite o token bearer para você a partir da cadeia de credenciais padrão da AWS, incluindo perfis de credenciais/configuração compartilhados, SSO, identidade web e funções de instância ou de tarefa.
    </Tip>

  </Tab>
</Tabs>

## Descoberta automática de modelos

Quando `AWS_BEARER_TOKEN_BEDROCK` está definido, o OpenClaw o usa diretamente. Caso contrário,
o OpenClaw tenta gerar um token bearer da Mantle a partir da cadeia de
credenciais padrão da AWS. Em seguida, ele descobre os modelos Mantle disponíveis consultando o
endpoint `/v1/models` da região.

| Comportamento          | Detalhe                         |
| ---------------------- | ------------------------------- |
| Cache de descoberta    | Resultados em cache por 1 hora  |
| Atualização do token IAM | A cada hora                   |

Para manter o Plugin Mantle habilitado, mas suprimir a descoberta automática e a
geração de token bearer do IAM pertencentes ao Plugin, desabilite a alternância de descoberta pertencente ao Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
O token bearer é o mesmo `AWS_BEARER_TOKEN_BEDROCK` usado pelo provedor [Amazon Bedrock](/pt-BR/providers/bedrock) padrão.
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
  <Accordion title="Reasoning support">
    O suporte a raciocínio é inferido a partir de IDs de modelo que contêm padrões como
    `thinking`, `reasoner` ou `gpt-oss-120b`. O OpenClaw define `reasoning: true`
    automaticamente para modelos correspondentes durante a descoberta.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Se o endpoint Mantle estiver indisponível ou não retornar modelos, o provedor será
    ignorado silenciosamente. O OpenClaw não gera erro; outros provedores configurados
    continuam funcionando normalmente.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    A Mantle também expõe uma rota Anthropic Messages que transporta modelos Claude pelo mesmo caminho de streaming autenticado por bearer. O Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) pode ser chamado por essa rota com streaming pertencente ao provedor, portanto os tokens bearer da AWS não são tratados como chaves de API da Anthropic.

    Quando você fixa um modelo Anthropic Messages no provedor Mantle, o OpenClaw usa a superfície de API `anthropic-messages` em vez de `openai-completions` para esse modelo. A autenticação ainda vem de `AWS_BEARER_TOKEN_BEDROCK` (ou do token bearer IAM emitido).

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

  <Accordion title="Relationship to Amazon Bedrock provider">
    O Bedrock Mantle é um provedor separado do provedor
    [Amazon Bedrock](/pt-BR/providers/bedrock) padrão. A Mantle usa uma
    superfície `/v1` compatível com OpenAI, enquanto o provedor Bedrock padrão usa
    a API nativa da Bedrock.

    Ambos os provedores compartilham a mesma credencial `AWS_BEARER_TOKEN_BEDROCK` quando
    ela está presente.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/pt-BR/providers/bedrock" icon="cloud">
    Provedor Bedrock nativo para Anthropic Claude, Titan e outros modelos.
  </Card>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="OAuth and auth" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
  <Card title="Troubleshooting" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e como resolvê-los.
  </Card>
</CardGroup>
