---
read_when:
    - Bedrock Mantle üzerinde barındırılan OSS modellerini OpenClaw ile kullanmak istiyorsunuz
    - GPT-OSS, Qwen, Kimi veya GLM için Mantle OpenAI uyumlu endpoint'ine ihtiyacınız var
summary: Amazon Bedrock Mantle (OpenAI uyumlu) modellerini OpenClaw ile kullanın
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-05T14:03:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2efe61261fbb430f63be9f5025c0654c44b191dbe96b3eb081d7ccbe78458907
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw, Mantle OpenAI uyumlu endpoint'ine bağlanan paketli bir **Amazon Bedrock Mantle** sağlayıcısı içerir. Mantle, Bedrock altyapısı tarafından desteklenen standart bir
`/v1/chat/completions` yüzeyi üzerinden açık kaynaklı ve
üçüncü taraf modelleri (GPT-OSS, Qwen, Kimi, GLM ve benzerleri) barındırır.

## OpenClaw'ın destekledikleri

- Sağlayıcı: `amazon-bedrock-mantle`
- API: `openai-completions` (OpenAI uyumlu)
- Kimlik doğrulama: `AWS_BEARER_TOKEN_BEDROCK` üzerinden bearer token
- Bölge: `AWS_REGION` veya `AWS_DEFAULT_REGION` (varsayılan: `us-east-1`)

## Otomatik model keşfi

`AWS_BEARER_TOKEN_BEDROCK` ayarlandığında, OpenClaw
bölgenin `/v1/models` endpoint'ini sorgulayarak kullanılabilir Mantle modellerini otomatik olarak keşfeder.
Keşif sonuçları 1 saat boyunca önbelleğe alınır.

Desteklenen bölgeler: `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Onboarding

1. Bearer token'ı **gateway host** üzerinde ayarlayın:

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# İsteğe bağlıdır (varsayılan olarak us-east-1 kullanılır):
export AWS_REGION="us-west-2"
```

2. Modellerin keşfedildiğini doğrulayın:

```bash
openclaw models list
```

Keşfedilen modeller `amazon-bedrock-mantle` sağlayıcısı altında görünür. Varsayılanları geçersiz kılmak istemediğiniz sürece
ek yapılandırma gerekmez.

## El ile yapılandırma

Otomatik keşif yerine açık yapılandırmayı tercih ediyorsanız:

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

## Notlar

- Mantle şu anda bearer token gerektirir. Düz IAM kimlik bilgileri (instance role'leri,
  SSO, erişim anahtarları) token olmadan yeterli değildir.
- Bearer token, standart
  [Amazon Bedrock](/providers/bedrock) sağlayıcısı tarafından da kullanılan aynı `AWS_BEARER_TOKEN_BEDROCK` değeridir.
- Reasoning desteği, model kimliklerinde
  `thinking`, `reasoner` veya `gpt-oss-120b` gibi kalıplar bulunmasına göre çıkarılır.
- Mantle endpoint'i kullanılamıyorsa veya hiç model döndürmüyorsa, sağlayıcı
  sessizce atlanır.
