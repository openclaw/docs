---
read_when:
    - Perplexity'yi bir web search sağlayıcısı olarak yapılandırmak istiyorsunuz
    - Perplexity API anahtarına veya OpenRouter proxy kurulumuna ihtiyacınız var
summary: Perplexity web search sağlayıcısı kurulumu (API anahtarı, arama modları, filtreleme)
title: Perplexity (Sağlayıcı)
x-i18n:
    generated_at: "2026-04-05T14:04:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9082d15d6a36a096e21efe8cee78e4b8643252225520f5b96a0b99cf5a7a4b
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (Web Search Sağlayıcısı)

Perplexity eklentisi, Perplexity
Search API veya OpenRouter üzerinden Perplexity Sonar aracılığıyla web search yetenekleri sağlar.

<Note>
Bu sayfa Perplexity **sağlayıcı** kurulumunu kapsar. Perplexity
**aracı** için (ajanın bunu nasıl kullandığı), bkz. [Perplexity aracı](/tools/perplexity-search).
</Note>

- Tür: web search sağlayıcısı (model sağlayıcısı değil)
- Kimlik doğrulama: `PERPLEXITY_API_KEY` (doğrudan) veya `OPENROUTER_API_KEY` (OpenRouter üzerinden)
- Config yolu: `plugins.entries.perplexity.config.webSearch.apiKey`

## Hızlı başlangıç

1. API anahtarını ayarlayın:

```bash
openclaw configure --section web
```

Veya doğrudan ayarlayın:

```bash
openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
```

2. Yapılandırıldığında ajan web aramaları için Perplexity'yi otomatik olarak kullanır.

## Arama modları

Eklenti, API anahtarı önekine göre taşımayı otomatik olarak seçer:

| Anahtar öneki | Taşıma                         | Özellikler                                       |
| ------------- | ------------------------------ | ------------------------------------------------ |
| `pplx-`       | Yerel Perplexity Search API    | Yapılandırılmış sonuçlar, alan/dil/tarih filtreleri |
| `sk-or-`      | OpenRouter (Sonar)             | Atıflarla AI tarafından sentezlenmiş yanıtlar    |

## Yerel API filtreleme

Yerel Perplexity API (`pplx-` anahtarı) kullanılırken aramalar şunları destekler:

- **Ülke**: 2 harfli ülke kodu
- **Dil**: ISO 639-1 dil kodu
- **Tarih aralığı**: gün, hafta, ay, yıl
- **Alan filtreleri**: allowlist/denylist (en fazla 20 alan)
- **İçerik bütçesi**: `max_tokens`, `max_tokens_per_page`

## Ortam notu

Gateway bir daemon olarak çalışıyorsa (`launchd`/`systemd`), `PERPLEXITY_API_KEY`
değerinin bu süreç için kullanılabilir olduğundan emin olun (örneğin
`~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
