---
read_when:
    - Você quer usar modelos OSS hospedados no Bedrock Mantle com o OpenClaw
    - Você precisa do endpoint compatível com OpenAI do Mantle para GPT-OSS, Qwen, Kimi ou GLM
summary: Use modelos Mantle do Amazon Bedrock (compatíveis com OpenAI) com o OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-12T23:29:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27e602b6f6a3ae92427de135cb9df6356e0daaea6b6fe54723a7542dd0d5d21e
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

O OpenClaw inclui um provedor agrupado **Amazon Bedrock Mantle** que se conecta ao
endpoint compatível com OpenAI do Mantle. O Mantle hospeda modelos open source e
de terceiros (GPT-OSS, Qwen, Kimi, GLM e similares) por meio de uma superfície padrão
`/v1/chat/completions` apoiada pela infraestrutura do Bedrock.

| Propriedade    | Valor                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| ID do provedor | `amazon-bedrock-mantle`                                                             |
| API            | `openai-completions` (compatível com OpenAI)                                        |
| Autenticação   | `AWS_BEARER_TOKEN_BEDROCK` explícito ou geração de bearer token pela cadeia de credenciais do IAM |
| Região padrão  | `us-east-1` (substitua com `AWS_REGION` ou `AWS_DEFAULT_REGION`)                    |

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Bearer token explícito">
    **Ideal para:** ambientes em que você já tem um bearer token do Mantle.

    <Steps>
      <Step title="Defina o bearer token no host do Gateway">
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

        Os modelos descobertos aparecem sob o provedor `amazon-bedrock-mantle`. Nenhuma
        configuração adicional é necessária, a menos que você queira substituir os padrões.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Credenciais IAM">
    **Ideal para:** usar credenciais compatíveis com AWS SDK (configuração compartilhada, SSO, identidade web, funções de instância ou de tarefa).

    <Steps>
      <Step title="Configure as credenciais da AWS no host do Gateway">
        Qualquer fonte de autenticação compatível com AWS SDK funciona:

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
    Quando `AWS_BEARER_TOKEN_BEDROCK` não está definido, o OpenClaw emite o bearer token para você a partir da cadeia de credenciais padrão da AWS, incluindo perfis compartilhados de credenciais/configuração, SSO, identidade web e funções de instância ou de tarefa.
    </Tip>

  </Tab>
</Tabs>

## Descoberta automática de modelos

Quando `AWS_BEARER_TOKEN_BEDROCK` está definido, o OpenClaw o usa diretamente. Caso contrário,
o OpenClaw tenta gerar um bearer token do Mantle a partir da cadeia de credenciais padrão da AWS.
Em seguida, ele descobre os modelos Mantle disponíveis consultando o
endpoint regional `/v1/models`.

| Comportamento         | Detalhe                   |
| --------------------- | ------------------------- |
| Cache de descoberta   | Resultados armazenados por 1 hora |
| Renovação de token IAM | A cada hora              |

<Note>
O bearer token é o mesmo `AWS_BEARER_TOKEN_BEDROCK` usado pelo provedor padrão [Amazon Bedrock](/pt-BR/providers/bedrock).
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

## Notas avançadas

<AccordionGroup>
  <Accordion title="Suporte a raciocínio">
    O suporte a raciocínio é inferido a partir de IDs de modelo que contêm padrões como
    `thinking`, `reasoner` ou `gpt-oss-120b`. O OpenClaw define `reasoning: true`
    automaticamente para modelos correspondentes durante a descoberta.
  </Accordion>

  <Accordion title="Indisponibilidade do endpoint">
    Se o endpoint do Mantle estiver indisponível ou não retornar modelos, o provedor será
    ignorado silenciosamente. O OpenClaw não gera erro; outros provedores configurados
    continuam funcionando normalmente.
  </Accordion>

  <Accordion title="Relação com o provedor Amazon Bedrock">
    O Bedrock Mantle é um provedor separado do provedor padrão
    [Amazon Bedrock](/pt-BR/providers/bedrock). O Mantle usa uma
    superfície `/v1` compatível com OpenAI, enquanto o provedor padrão do Bedrock usa
    a API nativa do Bedrock.

    Ambos os provedores compartilham a mesma credencial `AWS_BEARER_TOKEN_BEDROCK` quando
    presente.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/pt-BR/providers/bedrock" icon="cloud">
    Provedor Bedrock nativo para Anthropic Claude, Titan e outros modelos.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e como resolvê-los.
  </Card>
</CardGroup>
