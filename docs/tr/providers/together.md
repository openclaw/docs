---
read_when:
    - OpenClaw ile Together AI kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI auth seçimine ihtiyacınız var
summary: Together AI kurulumu (kimlik doğrulama + model seçimi)
title: Together AI
x-i18n:
    generated_at: "2026-04-05T14:04:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22aacbaadf860ce8245bba921dcc5ede9da8fd6fa1bc3cc912551aecc1ba0d71
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai), birleşik bir API üzerinden Llama, DeepSeek, Kimi ve daha fazlası dahil önde gelen açık kaynak modellerine erişim sağlar.

- Sağlayıcı: `together`
- Kimlik doğrulama: `TOGETHER_API_KEY`
- API: OpenAI uyumlu
- Taban URL: `https://api.together.xyz/v1`

## Hızlı başlangıç

1. API anahtarını ayarlayın (önerilen: Gateway için saklayın):

```bash
openclaw onboard --auth-choice together-api-key
```

2. Varsayılan bir model ayarlayın:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Etkileşimsiz örnek

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Bu, `together/moonshotai/Kimi-K2.5` modelini varsayılan model olarak ayarlar.

## Ortam notu

Gateway bir daemon olarak çalışıyorsa (`launchd/systemd`), `TOGETHER_API_KEY`
değerinin bu işlem için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
`env.shellEnv` aracılığıyla).

## Yerleşik katalog

OpenClaw şu anda şu paketlenmiş Together kataloğunu gönderir:

| Model ref                                                    | Name                                   | Input       | Context    | Notes                            |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | metin, görsel | 262,144    | Varsayılan model; akıl yürütme etkin |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | metin       | 202,752    | Genel amaçlı metin modeli        |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | metin       | 131,072    | Hızlı yönerge modeli             |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | metin, görsel | 10,000,000 | Çok modlu                        |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | metin, görsel | 20,000,000 | Çok modlu                        |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | metin       | 131,072    | Genel metin modeli               |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | metin       | 131,072    | Akıl yürütme modeli              |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | metin       | 262,144    | İkincil Kimi metin modeli        |

Onboarding ön ayarı, varsayılan model olarak `together/moonshotai/Kimi-K2.5` ayarlar.
