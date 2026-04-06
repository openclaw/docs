---
read_when:
    - Você quer usar modelos OSS hospedados no Bedrock Mantle com o OpenClaw
    - Você precisa do endpoint compatível com OpenAI do Mantle para GPT-OSS, Qwen, Kimi ou GLM
summary: Use modelos Amazon Bedrock Mantle (compatíveis com OpenAI) com o OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-06T03:10:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e5b33ede4067fb7de02a046f3e375cbd2af4bf68e7751c8dd687447f1a78c86
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

O OpenClaw inclui um provider empacotado **Amazon Bedrock Mantle** que se conecta ao
endpoint compatível com OpenAI do Mantle. O Mantle hospeda modelos de código aberto e
de terceiros (GPT-OSS, Qwen, Kimi, GLM e semelhantes) por meio de uma superfície padrão
`/v1/chat/completions` baseada na infraestrutura do Bedrock.

## O que o OpenClaw oferece suporte

- Provider: `amazon-bedrock-mantle`
- API: `openai-completions` (compatível com OpenAI)
- Auth: `AWS_BEARER_TOKEN_BEDROCK` explícito ou geração de bearer token da cadeia de credenciais IAM
- Região: `AWS_REGION` ou `AWS_DEFAULT_REGION` (padrão: `us-east-1`)

## Descoberta automática de modelo

Quando `AWS_BEARER_TOKEN_BEDROCK` está definido, o OpenClaw o usa diretamente. Caso contrário,
o OpenClaw tenta gerar um bearer token do Mantle a partir da cadeia padrão de credenciais
da AWS, incluindo perfis compartilhados de credenciais/configuração, SSO, identidade web e
funções de instância ou tarefa. Em seguida, ele descobre os modelos Mantle disponíveis
consultando o endpoint `/v1/models` da região. Os resultados da descoberta são
armazenados em cache por 1 hora, e os bearer tokens derivados de IAM são renovados a cada hora.

Regiões compatíveis: `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Onboarding

1. Escolha um caminho de auth no **host do gateway**:

Bearer token explícito:

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# Opcional (o padrão é us-east-1):
export AWS_REGION="us-west-2"
```

Credenciais IAM:

```bash
# Qualquer fonte de auth compatível com AWS SDK funciona aqui, por exemplo:
export AWS_PROFILE="default"
export AWS_REGION="us-west-2"
```

2. Verifique se os modelos foram descobertos:

```bash
openclaw models list
```

Os modelos descobertos aparecem sob o provider `amazon-bedrock-mantle`. Nenhuma
configuração adicional é necessária, a menos que você queira sobrescrever os padrões.

## Configuração manual

Se você preferir uma configuração explícita em vez da descoberta automática:

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

## Observações

- O OpenClaw pode gerar o bearer token do Mantle para você a partir de
  credenciais IAM compatíveis com AWS SDK quando `AWS_BEARER_TOKEN_BEDROCK` não está definido.
- O bearer token é o mesmo `AWS_BEARER_TOKEN_BEDROCK` usado pelo provider padrão
  [Amazon Bedrock](/pt-BR/providers/bedrock).
- O suporte a reasoning é inferido a partir de IDs de modelo que contêm padrões como
  `thinking`, `reasoner` ou `gpt-oss-120b`.
- Se o endpoint do Mantle estiver indisponível ou não retornar modelos, o provider será
  ignorado silenciosamente.
