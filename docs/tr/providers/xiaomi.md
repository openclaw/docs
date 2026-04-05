---
read_when:
    - OpenClaw içinde Xiaomi MiMo modellerini istiyorsunuz
    - XIAOMI_API_KEY kurulumuna ihtiyacınız var
summary: OpenClaw ile Xiaomi MiMo modellerini kullanın
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-05T14:05:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2533fa99b29070e26e0e1fbde924e1291c89b1fbc2537451bcc0eb677ea6949
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo, **MiMo** modelleri için API platformudur. OpenClaw, API anahtarı kimlik doğrulamasıyla Xiaomi'nin OpenAI uyumlu uç noktasını kullanır. API anahtarınızı [Xiaomi MiMo console](https://platform.xiaomimimo.com/#/console/api-keys) içinde oluşturun, ardından birlikte gelen `xiaomi` sağlayıcısını bu anahtarla yapılandırın.

## Yerleşik katalog

- Base URL: `https://api.xiaomimimo.com/v1`
- API: `openai-completions`
- Yetkilendirme: `Bearer $XIAOMI_API_KEY`

| Model ref              | Girdi       | Bağlam    | Maksimum çıktı | Notlar                       |
| ---------------------- | ----------- | --------- | -------------- | ---------------------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192          | Varsayılan model             |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000         | Akıl yürütme etkin           |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000         | Akıl yürütme etkin çok kipli |

## CLI kurulumu

```bash
openclaw onboard --auth-choice xiaomi-api-key
# veya etkileşimsiz
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## Yapılandırma kod parçacığı

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

## Notlar

- Varsayılan model ref: `xiaomi/mimo-v2-flash`.
- Ek yerleşik modeller: `xiaomi/mimo-v2-pro`, `xiaomi/mimo-v2-omni`.
- `XIAOMI_API_KEY` ayarlandığında (veya bir kimlik doğrulama profili mevcut olduğunda) sağlayıcı otomatik olarak eklenir.
- Sağlayıcı kuralları için [/concepts/model-providers](/tr/concepts/model-providers) bölümüne bakın.
