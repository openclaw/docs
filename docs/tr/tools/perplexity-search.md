---
read_when:
    - Web araması için Perplexity Search kullanmak istiyorsunuz
    - '`PERPLEXITY_API_KEY` veya `OPENROUTER_API_KEY` kurulumuna ihtiyacınız var'
summary: '`web_search` için Perplexity Search API ve Sonar/OpenRouter uyumluluğu'
title: Perplexity arama
x-i18n:
    generated_at: "2026-04-24T09:36:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Perplexity Search API

OpenClaw, Perplexity Search API'yi bir `web_search` sağlayıcısı olarak destekler.
`title`, `url` ve `snippet` alanlarıyla yapılandırılmış sonuçlar döndürür.

Uyumluluk için OpenClaw, eski Perplexity Sonar/OpenRouter kurulumlarını da destekler.
`OPENROUTER_API_KEY` kullanıyorsanız, `plugins.entries.perplexity.config.webSearch.apiKey` içinde bir `sk-or-...` anahtarı kullanıyorsanız veya `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` ayarlıyorsanız, sağlayıcı sohbet tamamlamaları yoluna geçer ve yapılandırılmış Search API sonuçları yerine alıntılarla AI sentezli yanıtlar döndürür.

## Perplexity API anahtarı alma

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) adresinde bir Perplexity hesabı oluşturun
2. Panodan bir API anahtarı üretin
3. Anahtarı yapılandırmada saklayın veya Gateway ortamında `PERPLEXITY_API_KEY` ayarlayın.

## OpenRouter uyumluluğu

Perplexity Sonar için zaten OpenRouter kullanıyorsanız, `provider: "perplexity"` değerini koruyun ve Gateway ortamında `OPENROUTER_API_KEY` ayarlayın veya `plugins.entries.perplexity.config.webSearch.apiKey` içinde bir `sk-or-...` anahtarı saklayın.

İsteğe bağlı uyumluluk denetimleri:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Yapılandırma örnekleri

### Yerel Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### OpenRouter / Sonar uyumluluğu

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Anahtar nereye ayarlanır

**Yapılandırma üzerinden:** `openclaw configure --section web` çalıştırın. Anahtarı
`~/.openclaw/openclaw.json` içinde `plugins.entries.perplexity.config.webSearch.apiKey`
altında saklar. Bu alan SecretRef nesnelerini de kabul eder.

**Ortam üzerinden:** Gateway süreç ortamında `PERPLEXITY_API_KEY` veya `OPENROUTER_API_KEY`
ayarlayın. Gateway kurulumu için bunu
`~/.openclaw/.env` içine (veya hizmet ortamınıza) koyun. Bkz. [Ortam değişkenleri](/tr/help/faq#env-vars-and-env-loading).

`provider: "perplexity"` yapılandırılmışsa ve Perplexity anahtarı SecretRef'i çözümlenmemiş durumda olup ortam geri dönüşü de yoksa, başlangıç/yeniden yükleme hızlıca başarısız olur.

## Araç parametreleri

Bu parametreler yerel Perplexity Search API yoluna uygulanır.

<ParamField path="query" type="string" required>
Arama sorgusu.
</ParamField>

<ParamField path="count" type="number" default="5">
Döndürülecek sonuç sayısı (1–10).
</ParamField>

<ParamField path="country" type="string">
2 harfli ISO ülke kodu (ör. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 dil kodu (ör. `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Zaman filtresi — `day` 24 saattir.
</ParamField>

<ParamField path="date_after" type="string">
Yalnızca bu tarihten sonra yayımlanmış sonuçlar (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Yalnızca bu tarihten önce yayımlanmış sonuçlar (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Alan adı izin listesi/ret listesi dizisi (en fazla 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Toplam içerik bütçesi (en fazla 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Sayfa başına belirteç sınırı.
</ParamField>

Eski Sonar/OpenRouter uyumluluk yolu için:

- `query`, `count` ve `freshness` kabul edilir
- `count` yalnızca uyumluluk içindir; yanıt yine de N sonuç listesi yerine alıntılarla tek bir sentezlenmiş yanıt olur
- `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` ve `max_tokens_per_page`
  gibi yalnızca Search API filtreleri açık hatalar döndürür

**Örnekler:**

```javascript
// Ülke ve dile özgü arama
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Yakın tarihli sonuçlar (geçen hafta)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Tarih aralığı araması
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Alan adı filtreleme (izin listesi)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Alan adı filtreleme (ret listesi - başına - ekleyin)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Daha fazla içerik çıkarımı
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Alan adı filtre kuralları

- Filtre başına en fazla 20 alan adı
- Aynı istekte izin listesi ve ret listesi karıştırılamaz
- Ret listesi girdileri için `-` öneki kullanın (ör. `["-reddit.com"]`)

## Notlar

- Perplexity Search API yapılandırılmış web arama sonuçları (`title`, `url`, `snippet`) döndürür
- OpenRouter veya açık `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, uyumluluk için Perplexity'yi yeniden Sonar sohbet tamamlamalarına geçirir
- Sonar/OpenRouter uyumluluğu, yapılandırılmış sonuç satırları değil, alıntılarla tek bir sentezlenmiş yanıt döndürür
- Sonuçlar varsayılan olarak 15 dakika önbelleğe alınır (`cacheTtlMinutes` ile yapılandırılabilir)

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Perplexity Search API belgeleri](https://docs.perplexity.ai/docs/search/quickstart) -- resmi Perplexity belgeleri
- [Brave Search](/tr/tools/brave-search) -- ülke/dil filtreli yapılandırılmış sonuçlar
- [Exa Search](/tr/tools/exa-search) -- içerik çıkarmalı nöral arama
