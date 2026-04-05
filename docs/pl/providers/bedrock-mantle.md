---
read_when:
    - Chcesz używać hostowanych przez Bedrock Mantle modeli OSS z OpenClaw
    - Potrzebujesz zgodnego z OpenAI endpointu Mantle dla GPT-OSS, Qwen, Kimi lub GLM
summary: Używanie modeli Amazon Bedrock Mantle (zgodnych z OpenAI) z OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-05T14:02:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2efe61261fbb430f63be9f5025c0654c44b191dbe96b3eb081d7ccbe78458907
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw zawiera dołączonego providera **Amazon Bedrock Mantle**, który łączy się z
endpointem Mantle zgodnym z OpenAI. Mantle hostuje modele open source i
modele firm trzecich (GPT-OSS, Qwen, Kimi, GLM i podobne) przez standardową
powierzchnię `/v1/chat/completions` opartą na infrastrukturze Bedrock.

## Co obsługuje OpenClaw

- Provider: `amazon-bedrock-mantle`
- API: `openai-completions` (zgodne z OpenAI)
- Uwierzytelnianie: bearer token przez `AWS_BEARER_TOKEN_BEDROCK`
- Region: `AWS_REGION` lub `AWS_DEFAULT_REGION` (domyślnie: `us-east-1`)

## Automatyczne wykrywanie modeli

Gdy ustawiono `AWS_BEARER_TOKEN_BEDROCK`, OpenClaw automatycznie wykrywa
dostępne modele Mantle, odpytując endpoint `/v1/models` dla danego regionu.
Wyniki wykrywania są przechowywane w pamięci podręcznej przez 1 godzinę.

Obsługiwane regiony: `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Onboarding

1. Ustaw bearer token na **hoście gateway**:

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# Opcjonalnie (domyślnie us-east-1):
export AWS_REGION="us-west-2"
```

2. Zweryfikuj, że modele zostały wykryte:

```bash
openclaw models list
```

Wykryte modele pojawiają się pod providerem `amazon-bedrock-mantle`. Żaden
dodatkowy config nie jest wymagany, chyba że chcesz nadpisać ustawienia domyślne.

## Konfiguracja ręczna

Jeśli wolisz jawny config zamiast automatycznego wykrywania:

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

## Uwagi

- Mantle obecnie wymaga bearer tokena. Same poświadczenia IAM (role instancji,
  SSO, klucze dostępu) nie wystarczą bez tokena.
- Bearer token to ten sam `AWS_BEARER_TOKEN_BEDROCK`, którego używa standardowy
  provider [Amazon Bedrock](/providers/bedrock).
- Obsługa rozumowania jest wywnioskowana z identyfikatorów modeli zawierających wzorce takie jak
  `thinking`, `reasoner` lub `gpt-oss-120b`.
- Jeśli endpoint Mantle jest niedostępny lub nie zwraca modeli, provider jest
  po cichu pomijany.
