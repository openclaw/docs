---
read_when:
    - Vuoi usare con OpenClaw modelli OSS ospitati su Bedrock Mantle
    - Ti serve l'endpoint compatibile con OpenAI di Mantle per GPT-OSS, Qwen, Kimi o GLM
summary: Usare i modelli Amazon Bedrock Mantle (compatibili con OpenAI) con OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-05T14:00:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2efe61261fbb430f63be9f5025c0654c44b191dbe96b3eb081d7ccbe78458907
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw include un provider **Amazon Bedrock Mantle** integrato che si connette
all'endpoint Mantle compatibile con OpenAI. Mantle ospita modelli open source e
di terze parti (GPT-OSS, Qwen, Kimi, GLM e simili) tramite una superficie standard
`/v1/chat/completions` supportata dall'infrastruttura Bedrock.

## Cosa supporta OpenClaw

- Provider: `amazon-bedrock-mantle`
- API: `openai-completions` (compatibile con OpenAI)
- Autenticazione: bearer token tramite `AWS_BEARER_TOKEN_BEDROCK`
- Regione: `AWS_REGION` o `AWS_DEFAULT_REGION` (predefinita: `us-east-1`)

## Rilevamento automatico dei modelli

Quando `AWS_BEARER_TOKEN_BEDROCK` è impostato, OpenClaw rileva automaticamente
i modelli Mantle disponibili interrogando l'endpoint `/v1/models` della regione.
I risultati del rilevamento vengono memorizzati nella cache per 1 ora.

Regioni supportate: `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Onboarding

1. Imposta il bearer token sull'**host del gateway**:

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# Facoltativo (predefinito: us-east-1):
export AWS_REGION="us-west-2"
```

2. Verifica che i modelli vengano rilevati:

```bash
openclaw models list
```

I modelli rilevati compaiono sotto il provider `amazon-bedrock-mantle`. Non è
richiesta alcuna configurazione aggiuntiva a meno che tu non voglia sovrascrivere i valori predefiniti.

## Configurazione manuale

Se preferisci una configurazione esplicita invece del rilevamento automatico:

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

## Note

- Mantle oggi richiede un bearer token. Le semplici credenziali IAM (ruoli dell'istanza,
  SSO, chiavi di accesso) non sono sufficienti senza un token.
- Il bearer token è lo stesso `AWS_BEARER_TOKEN_BEDROCK` usato dal provider standard
  [Amazon Bedrock](/providers/bedrock).
- Il supporto al reasoning viene dedotto dagli ID modello che contengono pattern come
  `thinking`, `reasoner` o `gpt-oss-120b`.
- Se l'endpoint Mantle non è disponibile o non restituisce modelli, il provider viene
  saltato silenziosamente.
