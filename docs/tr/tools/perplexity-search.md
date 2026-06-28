---
read_when:
    - Web araması için Perplexity Search kullanmak istiyorsunuz
    - PERPLEXITY_API_KEY veya OPENROUTER_API_KEY yapılandırılmış olmalıdır
summary: web_search için Perplexity Search API ve Sonar/OpenRouter uyumluluğu
title: Perplexity araması
x-i18n:
    generated_at: "2026-06-28T01:24:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef003238bc38dd3d92b98654598cba05fb1c324d8ca766a683cf1defe5bd435
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw, `web_search` sağlayıcısı olarak Perplexity Search API'yi destekler.
`title`, `url` ve `snippet` alanlarıyla yapılandırılmış sonuçlar döndürür.

Uyumluluk için OpenClaw, eski Perplexity Sonar/OpenRouter kurulumlarını da destekler.
`OPENROUTER_API_KEY` kullanırsanız, `plugins.entries.perplexity.config.webSearch.apiKey` içinde `sk-or-...` anahtarı kullanırsanız veya `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` ayarlarsanız, sağlayıcı chat-completions yoluna geçer ve yapılandırılmış Search API sonuçları yerine alıntılarla AI tarafından sentezlenmiş yanıtlar döndürür.

## Plugin'i yükle

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Perplexity API anahtarı alma

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) adresinde bir Perplexity hesabı oluşturun
2. Panoda bir API anahtarı oluşturun
3. Anahtarı yapılandırmada saklayın veya Gateway ortamında `PERPLEXITY_API_KEY` ayarlayın.

## OpenRouter uyumluluğu

Perplexity Sonar için zaten OpenRouter kullanıyorsanız `provider: "perplexity"` değerini koruyun ve Gateway ortamında `OPENROUTER_API_KEY` ayarlayın ya da `plugins.entries.perplexity.config.webSearch.apiKey` içinde bir `sk-or-...` anahtarı saklayın.

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

**Yapılandırma yoluyla:** `openclaw configure --section web` komutunu çalıştırın. Anahtarı
`~/.openclaw/openclaw.json` dosyasında `plugins.entries.perplexity.config.webSearch.apiKey` altında saklar.
Bu alan SecretRef nesnelerini de kabul eder.

**Ortam yoluyla:** Gateway işlem ortamında `PERPLEXITY_API_KEY` veya `OPENROUTER_API_KEY`
ayarlayın. Bir Gateway kurulumu için bunu
`~/.openclaw/.env` içine (veya hizmet ortamınıza) koyun. Bkz. [Ortam değişkenleri](/tr/help/faq#env-vars-and-env-loading).

`provider: "perplexity"` yapılandırılmışsa ve Perplexity anahtarı SecretRef çözümlenmemişse ve env geri dönüşü yoksa, başlatma/yeniden yükleme hızla başarısız olur.

## Araç parametreleri

Bu parametreler yerel Perplexity Search API yolu için geçerlidir.

<ParamField path="query" type="string" required>
Arama sorgusu.
</ParamField>

<ParamField path="count" type="number" default="5">
Döndürülecek sonuç sayısı (1-10).
</ParamField>

<ParamField path="country" type="string">
2 harfli ISO ülke kodu (örn. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 dil kodu (örn. `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Zaman filtresi - `day` 24 saattir.
</ParamField>

<ParamField path="date_after" type="string">
Yalnızca bu tarihten sonra yayımlanan sonuçlar (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Yalnızca bu tarihten önce yayımlanan sonuçlar (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Alan adı izin listesi/engelleme listesi dizisi (en fazla 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Toplam içerik bütçesi (en fazla 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Sayfa başına token sınırı.
</ParamField>

Eski Sonar/OpenRouter uyumluluk yolu için:

- `query`, `count` ve `freshness` kabul edilir
- `count` burada yalnızca uyumluluk içindir; yanıt yine N sonuçlu bir liste yerine alıntılar içeren tek bir sentezlenmiş yanıttır
- `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` ve `max_tokens_per_page`
  gibi yalnızca Search API'ye özgü filtreler açık hatalar döndürür

**Örnekler:**

```javascript
// Ülke ve dile özel arama
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Son sonuçlar (geçen hafta)
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

// Alan adı filtreleme (engelleme listesi - önüne - koyun)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Daha fazla içerik çıkarma
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Alan adı filtresi kuralları

- Filtre başına en fazla 20 alan adı
- Aynı istekte izin listesi ve engelleme listesi karıştırılamaz
- Engelleme listesi girdileri için `-` öneki kullanın (örn. `["-reddit.com"]`)

## Notlar

- Perplexity Search API, yapılandırılmış web arama sonuçları döndürür (`title`, `url`, `snippet`)
- OpenRouter veya açık `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, uyumluluk için Perplexity'yi tekrar Sonar chat completions'a geçirir
- Sonar/OpenRouter uyumluluğu, yapılandırılmış sonuç satırları değil, alıntılar içeren tek bir sentezlenmiş yanıt döndürür
- Sonuçlar varsayılan olarak 15 dakika önbelleğe alınır (`cacheTtlMinutes` ile yapılandırılabilir)

## İlgili

<CardGroup cols={2}>
  <Card title="Web aramasına genel bakış" href="/tr/tools/web" icon="globe">
    Tüm sağlayıcılar ve otomatik algılama kuralları.
  </Card>
  <Card title="Brave search" href="/tr/tools/brave-search" icon="shield">
    Ülke ve dil filtreleriyle yapılandırılmış sonuçlar.
  </Card>
  <Card title="Exa search" href="/tr/tools/exa-search" icon="magnifying-glass">
    İçerik çıkarma ile nöral arama.
  </Card>
  <Card title="Perplexity Search API belgeleri" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Resmi Perplexity Search API hızlı başlangıcı ve başvurusu.
  </Card>
</CardGroup>
