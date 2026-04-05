---
read_when:
    - Anda ingin menggunakan model OSS yang di-host Bedrock Mantle dengan OpenClaw
    - Anda memerlukan endpoint Amazon Mantle yang kompatibel dengan OpenAI untuk GPT-OSS, Qwen, Kimi, atau GLM
summary: Gunakan model Amazon Bedrock Mantle (kompatibel dengan OpenAI) dengan OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-05T14:02:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2efe61261fbb430f63be9f5025c0654c44b191dbe96b3eb081d7ccbe78458907
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw menyertakan provider **Amazon Bedrock Mantle** bawaan yang terhubung ke
endpoint Mantle yang kompatibel dengan OpenAI. Mantle meng-host model open-source dan
pihak ketiga (GPT-OSS, Qwen, Kimi, GLM, dan sejenisnya) melalui permukaan standar
`/v1/chat/completions` yang didukung oleh infrastruktur Bedrock.

## Yang didukung OpenClaw

- Provider: `amazon-bedrock-mantle`
- API: `openai-completions` (kompatibel dengan OpenAI)
- Auth: token bearer melalui `AWS_BEARER_TOKEN_BEDROCK`
- Region: `AWS_REGION` atau `AWS_DEFAULT_REGION` (default: `us-east-1`)

## Penemuan model otomatis

Saat `AWS_BEARER_TOKEN_BEDROCK` disetel, OpenClaw secara otomatis menemukan
model Mantle yang tersedia dengan meminta endpoint `/v1/models` milik region tersebut.
Hasil penemuan di-cache selama 1 jam.

Region yang didukung: `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Onboarding

1. Setel token bearer pada **host gateway**:

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# Opsional (default ke us-east-1):
export AWS_REGION="us-west-2"
```

2. Verifikasi bahwa model ditemukan:

```bash
openclaw models list
```

Model yang ditemukan muncul di bawah provider `amazon-bedrock-mantle`. Tidak
diperlukan config tambahan kecuali Anda ingin mengoverride default.

## Konfigurasi manual

Jika Anda lebih memilih config eksplisit daripada penemuan otomatis:

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

## Catatan

- Mantle saat ini memerlukan token bearer. Kredensial IAM biasa (instance role,
  SSO, access key) tidak cukup tanpa token.
- Token bearer tersebut adalah `AWS_BEARER_TOKEN_BEDROCK` yang sama dengan yang digunakan oleh provider
  [Amazon Bedrock](/providers/bedrock) standar.
- Dukungan reasoning diinferensikan dari ID model yang berisi pola seperti
  `thinking`, `reasoner`, atau `gpt-oss-120b`.
- Jika endpoint Mantle tidak tersedia atau tidak mengembalikan model, provider akan
  dilewati secara diam-diam.
