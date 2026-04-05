---
read_when:
    - Web araması için Perplexity Search kullanmak istiyorsunuz
    - '`PERPLEXITY_API_KEY` veya `OPENROUTER_API_KEY` kurulumuna ihtiyacınız var'
summary: '`web_search` için Perplexity Search API ve Sonar/OpenRouter uyumluluğu'
title: Perplexity Search
x-i18n:
    generated_at: "2026-04-05T14:12:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d97498e26e5570364e1486cb75584ed53b40a0091bf0210e1ea62f62d562ea
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Perplexity Search API

OpenClaw, `web_search` sağlayıcısı olarak Perplexity Search API'yi destekler.
`title`, `url` ve `snippet` alanlarına sahip yapılandırılmış sonuçlar döndürür.

Uyumluluk için OpenClaw, eski Perplexity Sonar/OpenRouter kurulumlarını da destekler.
`OPENROUTER_API_KEY` kullanırsanız, `plugins.entries.perplexity.config.webSearch.apiKey` içinde bir `sk-or-...` anahtarı kullanırsanız veya `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` ayarlarsanız, sağlayıcı chat-completions yoluna geçer ve yapılandırılmış Search API sonuçları yerine alıntılar içeren yapay zeka tarafından sentezlenmiş yanıtlar döndürür.

## Perplexity API anahtarı alma

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) adresinde bir Perplexity hesabı oluşturun
2. Panoda bir API anahtarı oluşturun
3. Anahtarı config içinde saklayın veya Gateway ortamında `PERPLEXITY_API_KEY` ayarlayın.

## OpenRouter uyumluluğu

Perplexity Sonar için zaten OpenRouter kullanıyorsanız, `provider: "perplexity"` değerini koruyun ve Gateway ortamında `OPENROUTER_API_KEY` ayarlayın veya `plugins.entries.perplexity.config.webSearch.apiKey` içine bir `sk-or-...` anahtarı kaydedin.

İsteğe bağlı uyumluluk denetimleri:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Config örnekleri

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

## Anahtarın ayarlanacağı yer

**Config üzerinden:** `openclaw configure --section web` komutunu çalıştırın. Anahtarı
`~/.openclaw/openclaw.json` içinde `plugins.entries.perplexity.config.webSearch.apiKey`
altında saklar.
Bu alan SecretRef nesnelerini de kabul eder.

**Ortam üzerinden:** Gateway süreç ortamında `PERPLEXITY_API_KEY` veya `OPENROUTER_API_KEY`
ayarlayın. Bir gateway kurulumu için bunu
`~/.openclaw/.env` içine (veya hizmet ortamınıza) koyun. Bkz. [Ortam değişkenleri](/help/faq#env-vars-and-env-loading).

`provider: "perplexity"` yapılandırılmışsa ve Perplexity anahtarı SecretRef çözülmemiş durumdaysa, ayrıca env yedeği de yoksa, başlatma/yeniden yükleme hızlı şekilde başarısız olur.

## Araç parametreleri

Bu parametreler yerel Perplexity Search API yoluna uygulanır.

| Parametre             | Açıklama                                             |
| --------------------- | ---------------------------------------------------- |
| `query`               | Arama sorgusu (zorunlu)                              |
| `count`               | Döndürülecek sonuç sayısı (1-10, varsayılan: 5)      |
| `country`             | 2 harfli ISO ülke kodu (örn. `"US"`, `"DE"`)         |
| `language`            | ISO 639-1 dil kodu (örn. `"en"`, `"de"`, `"fr"`)     |
| `freshness`           | Zaman filtresi: `day` (24 saat), `week`, `month` veya `year` |
| `date_after`          | Yalnızca bu tarihten sonra yayımlanan sonuçlar (YYYY-MM-DD) |
| `date_before`         | Yalnızca bu tarihten önce yayımlanan sonuçlar (YYYY-MM-DD) |
| `domain_filter`       | Alan adı izin listesi/engelleme listesi dizisi (en fazla 20) |
| `max_tokens`          | Toplam içerik bütçesi (varsayılan: 25000, en fazla: 1000000) |
| `max_tokens_per_page` | Sayfa başına token sınırı (varsayılan: 2048)         |

Eski Sonar/OpenRouter uyumluluk yolu için:

- `query`, `count` ve `freshness` kabul edilir
- `count` burada yalnızca uyumluluk içindir; yanıt yine de N sonuçlu bir liste yerine alıntılar içeren tek bir sentezlenmiş yanıt olur
- `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` ve `max_tokens_per_page`
  gibi yalnızca Search API'ye özgü filtreler açık hata döndürür

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

// Alan adı filtreleme (engelleme listesi - başına - ekleyin)
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

### Alan adı filtresi kuralları

- Filtre başına en fazla 20 alan adı
- Aynı istekte izin listesi ve engelleme listesi birlikte kullanılamaz
- Engelleme listesi girdileri için `-` önekini kullanın (örn. `["-reddit.com"]`)

## Notlar

- Perplexity Search API, yapılandırılmış web arama sonuçları (`title`, `url`, `snippet`) döndürür
- OpenRouter veya açıkça belirtilmiş `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, uyumluluk için Perplexity'yi yeniden Sonar chat completions moduna geçirir
- Sonar/OpenRouter uyumluluğu, yapılandırılmış sonuç satırları değil, alıntılar içeren tek bir sentezlenmiş yanıt döndürür
- Sonuçlar varsayılan olarak 15 dakika boyunca önbelleğe alınır (`cacheTtlMinutes` ile yapılandırılabilir)

## İlgili

- [Web Search genel bakış](/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart) -- resmi Perplexity belgeleri
- [Brave Search](/tr/tools/brave-search) -- ülke/dil filtrelerine sahip yapılandırılmış sonuçlar
- [Exa Search](/tr/tools/exa-search) -- içerik çıkarımıyla nöral arama
