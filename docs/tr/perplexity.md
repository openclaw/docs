---
read_when:
    - Web araması için Perplexity Search kullanmak istiyorsunuz
    - '`PERPLEXITY_API_KEY` veya `OPENROUTER_API_KEY` ayarına ihtiyacınız var'
summary: '`web_search` için Perplexity Search API ve Sonar/OpenRouter uyumluluğu'
title: Perplexity arama (eski yol)
x-i18n:
    generated_at: "2026-04-24T09:18:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 15
---

# Perplexity Search API

OpenClaw, `web_search` sağlayıcısı olarak Perplexity Search API desteği sunar.
`title`, `url` ve `snippet` alanlarıyla yapılandırılmış sonuçlar döndürür.

Uyumluluk için OpenClaw, eski Perplexity Sonar/OpenRouter kurulumlarını da destekler.
`OPENROUTER_API_KEY` kullanırsanız, `plugins.entries.perplexity.config.webSearch.apiKey` içinde bir `sk-or-...` anahtarı kullanırsanız veya `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` ayarlarsanız, sağlayıcı chat-completions yoluna geçer ve yapılandırılmış Search API sonuçları yerine alıntılar içeren yapay zekâ tarafından sentezlenmiş yanıtlar döndürür.

## Perplexity API anahtarı alma

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) adresinde bir Perplexity hesabı oluşturun
2. Panodan bir API anahtarı üretin
3. Anahtarı yapılandırmada saklayın veya Gateway ortamında `PERPLEXITY_API_KEY` ayarlayın.

## OpenRouter uyumluluğu

Perplexity Sonar için zaten OpenRouter kullanıyorsanız `provider: "perplexity"` değerini koruyun ve Gateway ortamında `OPENROUTER_API_KEY` ayarlayın veya `plugins.entries.perplexity.config.webSearch.apiKey` içine bir `sk-or-...` anahtarı kaydedin.

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

## Anahtar nerede ayarlanır

**Yapılandırma üzerinden:** `openclaw configure --section web` çalıştırın. Anahtarı
`~/.openclaw/openclaw.json` içinde `plugins.entries.perplexity.config.webSearch.apiKey` altında saklar.
Bu alan SecretRef nesnelerini de kabul eder.

**Ortam üzerinden:** Gateway işlem ortamında `PERPLEXITY_API_KEY` veya `OPENROUTER_API_KEY`
ayarlayın. Bir gateway kurulumu için bunu
`~/.openclaw/.env` içine koyun (veya hizmet ortamınıza ekleyin). Bkz. [Env değişkenleri](/tr/help/faq#env-vars-and-env-loading).

`provider: "perplexity"` yapılandırılmışsa ve Perplexity anahtarı SecretRef'i çözümlenmemişse, ayrıca env geri dönüşü de yoksa, başlangıç/yeniden yükleme hızlı şekilde başarısız olur.

## Araç parametreleri

Bu parametreler yerel Perplexity Search API yolu için geçerlidir.

| Parametre            | Açıklama                                                 |
| -------------------- | -------------------------------------------------------- |
| `query`              | Arama sorgusu (zorunlu)                                  |
| `count`              | Döndürülecek sonuç sayısı (1-10, varsayılan: 5)          |
| `country`            | 2 harfli ISO ülke kodu (ör. `"US"`, `"DE"`)              |
| `language`           | ISO 639-1 dil kodu (ör. `"en"`, `"de"`, `"fr"`)          |
| `freshness`          | Zaman filtresi: `day` (24s), `week`, `month` veya `year` |
| `date_after`         | Yalnızca bu tarihten sonra yayımlanan sonuçlar (YYYY-MM-DD) |
| `date_before`        | Yalnızca bu tarihten önce yayımlanan sonuçlar (YYYY-MM-DD) |
| `domain_filter`      | Etki alanı izin listesi/engelleme listesi dizisi (en fazla 20) |
| `max_tokens`         | Toplam içerik bütçesi (varsayılan: 25000, en fazla: 1000000) |
| `max_tokens_per_page` | Sayfa başına token sınırı (varsayılan: 2048)            |

Eski Sonar/OpenRouter uyumluluk yolu için:

- `query`, `count` ve `freshness` kabul edilir
- `count` burada yalnızca uyumluluk içindir; yanıt yine de N sonuçlu bir liste değil,
  alıntılar içeren tek bir sentezlenmiş yanıt olur
- `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` ve `max_tokens_per_page`
  gibi yalnızca Search API'ye özgü filtreler açık hatalar döndürür

**Örnekler:**

```javascript
// Ülke ve dil bazlı arama
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Güncel sonuçlar (geçen hafta)
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

// Etki alanı filtreleme (izin listesi)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Etki alanı filtreleme (engelleme listesi - başına - ekleyin)
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

### Etki alanı filtre kuralları

- Filtre başına en fazla 20 etki alanı
- Aynı istekte izin listesi ve engelleme listesi birlikte kullanılamaz
- Engelleme listesi girdileri için `-` öneki kullanın (ör. `["-reddit.com"]`)

## Notlar

- Perplexity Search API, yapılandırılmış web arama sonuçları (`title`, `url`, `snippet`) döndürür
- OpenRouter veya açık `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` ayarı, uyumluluk için Perplexity'yi yeniden Sonar chat completions yoluna geçirir
- Sonar/OpenRouter uyumluluğu, yapılandırılmış sonuç satırları değil, alıntılar içeren tek bir sentezlenmiş yanıt döndürür
- Sonuçlar varsayılan olarak 15 dakika önbelleğe alınır (`cacheTtlMinutes` ile yapılandırılabilir)

Tam `web_search` yapılandırması için bkz. [Web tools](/tr/tools/web).
Daha fazla ayrıntı için bkz. [Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart).

## İlgili

- [Perplexity arama](/tr/tools/perplexity-search)
- [Web arama](/tr/tools/web)
