---
read_when:
    - Cloudflare AI Gateway’i OpenClaw ile kullanmak istiyorsunuz
    - Hesap kimliği, gateway kimliği veya API anahtarı ortam değişkenine ihtiyacınız var
summary: Cloudflare AI Gateway kurulumu (kimlik doğrulama + model seçimi)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-05T14:03:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: db77652c37652ca20f7c50f32382dbaeaeb50ea5bdeaf1d4fd17dc394e58950c
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway, provider API’lerinin önünde yer alır ve analiz, önbellekleme ve denetimler eklemenizi sağlar. Anthropic için OpenClaw, Anthropic Messages API’yi Gateway endpoint’iniz üzerinden kullanır.

- Provider: `cloudflare-ai-gateway`
- Temel URL: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- Varsayılan model: `cloudflare-ai-gateway/claude-sonnet-4-5`
- API anahtarı: `CLOUDFLARE_AI_GATEWAY_API_KEY` (Gateway üzerinden yapılan istekler için provider API anahtarınız)

Anthropic modelleri için Anthropic API anahtarınızı kullanın.

## Hızlı başlangıç

1. Provider API anahtarını ve Gateway ayrıntılarını ayarlayın:

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. Varsayılan bir model ayarlayın:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
    },
  },
}
```

## Etkileşimsiz örnek

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Kimlik doğrulamalı gateway’ler

Cloudflare’da Gateway kimlik doğrulamasını etkinleştirdiyseniz `cf-aig-authorization` başlığını ekleyin (bu, provider API anahtarınıza ek olarak gereklidir).

```json5
{
  models: {
    providers: {
      "cloudflare-ai-gateway": {
        headers: {
          "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
        },
      },
    },
  },
}
```

## Ortam notu

Gateway bir daemon olarak çalışıyorsa (`launchd/systemd`), `CLOUDFLARE_AI_GATEWAY_API_KEY` değişkeninin bu süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
