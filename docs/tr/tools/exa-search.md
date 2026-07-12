---
read_when:
    - web_search için Exa kullanmak istiyorsunuz
    - Bir EXA_API_KEY'e ihtiyacınız var
    - Sinirsel arama veya içerik çıkarma istiyorsunuz
summary: Exa AI araması -- içerik çıkarımıyla sinir ağı ve anahtar kelime araması
title: Exa araması
x-i18n:
    generated_at: "2026-07-12T12:17:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/), sinir ağı tabanlı, anahtar kelime ve hibrit arama modlarının yanı sıra yerleşik içerik çıkarma (öne çıkan bölümler, metin, özetler) özelliklerine sahip bir `web_search` sağlayıcısıdır.

## Plugini yükleme

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## API anahtarı alma

<Steps>
  <Step title="Hesap oluşturma">
    [exa.ai](https://exa.ai/) adresinden kaydolun ve kontrol panelinizden bir API anahtarı oluşturun.
  </Step>
  <Step title="Anahtarı saklama">
    Gateway ortamında `EXA_API_KEY` ayarlayın veya şu komutla yapılandırın:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Yapılandırma

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // EXA_API_KEY ayarlanmışsa isteğe bağlıdır
            baseUrl: "https://api.exa.ai", // isteğe bağlıdır; OpenClaw /search ekler
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Ortam değişkeni alternatifi:** Gateway ortamında `EXA_API_KEY` ayarlayın. Bir Gateway kurulumunda bunu `~/.openclaw/.env` dosyasına ekleyin. Bkz. [Ortam değişkenleri](/tr/help/faq#env-vars-and-env-loading).

## Temel URL'yi geçersiz kılma

Exa arama isteklerini uyumlu bir proxy veya alternatif uç nokta üzerinden yönlendirmek için `plugins.entries.exa.config.webSearch.baseUrl` değerini ayarlayın. OpenClaw, yalın ana bilgisayar adlarının başına `https://` ekleyerek bunları normalleştirir ve yol zaten `/search` ile bitmiyorsa sonuna `/search` ekler. Çözümlenen uç nokta, arama önbelleği anahtarının bir parçasıdır; bu nedenle farklı uç noktalardan gelen sonuçlar hiçbir zaman paylaşılmaz.

## Araç parametreleri

<ParamField path="query" type="string" required>
Arama sorgusu.
</ParamField>

<ParamField path="count" type="number" default="5">
Döndürülecek sonuçlar (1-100; Exa arama türü sınırlarına tabidir).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Arama modu.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Zaman filtresi. `date_after`/`date_before` ile birlikte kullanılamaz.
</ParamField>

<ParamField path="date_after" type="string">
Bu tarihten sonraki sonuçlar (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Bu tarihten önceki sonuçlar (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
İçerik çıkarma seçenekleri (aşağıya bakın).
</ParamField>

### İçerik çıkarma

Sonuçlarda çıkarılan içeriği denetlemek için bir `contents` nesnesi iletin:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // tam sayfa metni
    highlights: { numSentences: 3 }, // önemli cümleler
    summary: true, // yapay zekâ özeti
  },
});
```

| İçerik seçeneği | Tür                                                                   | Açıklama                 |
| --------------- | --------------------------------------------------------------------- | ------------------------ |
| `text`          | `boolean \| { maxCharacters }`                                        | Tam sayfa metnini çıkarır |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Önemli cümleleri çıkarır |
| `summary`       | `boolean \| { query }`                                                | Yapay zekâ tarafından oluşturulan özet |

`contents` belirtilmezse Exa varsayılan olarak `{ highlights: true }` kullanır; böylece sonuçlar önemli cümlelerden alıntılar içerir. Sonuç açıklamaları önce öne çıkan bölümlerden, ardından özetten, sonra tam metinden alınır; bunlardan hangisi ilk olarak kullanılabiliyorsa o seçilir. Sonuçlar ayrıca mevcut olduğunda Exa API yanıtındaki ham `highlightScores` ve `summary` alanlarını da korur.

### Arama modları

| Mod              | Açıklama                               |
| ---------------- | -------------------------------------- |
| `auto`           | Exa en iyi modu seçer (varsayılan)     |
| `neural`         | Anlama dayalı anlamsal arama           |
| `fast`           | Hızlı anahtar kelime araması           |
| `deep`           | Kapsamlı derin arama                   |
| `deep-reasoning` | Akıl yürütmeli derin arama             |
| `instant`        | En hızlı sonuçlar                      |

## Notlar

- `count`, Exa arama türü sınırlarına tabi olarak en fazla 100 değerini kabul eder.
- Sonuçlar varsayılan olarak 15 dakika boyunca önbelleğe alınır. Exa dâhil tüm `web_search` sağlayıcılarının önbelleğe alma ve istek zaman aşımı ayarlarını değiştirmek için paylaşılan `tools.web.search.cacheTtlMinutes` (dakika) ve `tools.web.search.timeoutSeconds` (varsayılan 30 sn.) değerlerini yapılandırın.

## İlgili konular

- [Web Aramasına genel bakış](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tr/tools/brave-search) -- ülke/dil filtreleriyle yapılandırılmış sonuçlar
- [Perplexity Search](/tr/tools/perplexity-search) -- alan adı filtrelemeli yapılandırılmış sonuçlar
