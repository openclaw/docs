---
read_when:
    - Vercel AI Gateway'i OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı env var'ına veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: Vercel AI Gateway kurulumu (kimlik doğrulama + model seçimi)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-05T14:05:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30768dc3db49708b25042d317906f7ad9a2c72b0fa03263bc04f5eefbf7a507
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway), tek bir uç nokta üzerinden yüzlerce modele erişmek için birleşik bir API sağlar.

- Sağlayıcı: `vercel-ai-gateway`
- Kimlik doğrulama: `AI_GATEWAY_API_KEY`
- API: Anthropic Messages uyumlu
- OpenClaw, Gateway `/v1/models` kataloğunu otomatik olarak keşfeder; bu nedenle `/models vercel-ai-gateway`
  çıktısında `vercel-ai-gateway/openai/gpt-5.4` gibi güncel model referansları yer alır.

## Hızlı başlangıç

1. API anahtarını ayarlayın (önerilen: bunu Gateway için saklayın):

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. Varsayılan bir model ayarlayın:

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## Etkileşimsiz örnek

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Ortam notu

Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `AI_GATEWAY_API_KEY`
değerinin bu süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
`env.shellEnv` aracılığıyla).

## Model kimliği kısa gösterimi

OpenClaw, Vercel Claude kısa model referanslarını kabul eder ve çalışma zamanında normalize eder:

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
