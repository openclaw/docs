---
read_when:
    - web_search için Exa kullanmak istiyorsunuz
    - EXA_API_KEY gereklidir.
    - Nöral arama veya içerik çıkarımı istiyorsunuz
summary: Exa AI araması -- içerik çıkarma özellikli nöral ve anahtar kelime araması
title: Exa araması
x-i18n:
    generated_at: "2026-05-02T09:07:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2ddf83c5130208eadc78eccb10aebf67af11b05690d75a817d6999f79be5fc3
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw, `web_search` sağlayıcısı olarak [Exa AI](https://exa.ai/) desteği sunar. Exa, yerleşik içerik çıkarımıyla (vurgular, metin, özetler) neural, anahtar kelime ve hibrit arama modları sunar.

## API anahtarı alma

<Steps>
  <Step title="Hesap oluşturun">
    [exa.ai](https://exa.ai/) üzerinde kaydolun ve panonuzdan bir API anahtarı
    oluşturun.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `EXA_API_KEY` ayarlayın veya şu şekilde yapılandırın:

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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
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

**Ortam alternatifi:** Gateway ortamında `EXA_API_KEY` ayarlayın.
Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.

## Temel URL geçersiz kılma

Exa arama isteklerinin uyumlu bir proxy veya alternatif Exa uç noktası üzerinden
geçmesi gerektiğinde `plugins.entries.exa.config.webSearch.baseUrl` ayarlayın.
OpenClaw, yalın ana makinelerin başına `https://` ekleyerek normalleştirir ve
yol zaten orada bitmiyorsa `/search` ekler. Çözümlenen uç nokta arama önbellek
anahtarına dahil edilir; böylece farklı Exa uç noktalarından gelen sonuçlar
paylaşılmaz.

## Araç parametreleri

<ParamField path="query" type="string" required>
Arama sorgusu.
</ParamField>

<ParamField path="count" type="number">
Döndürülecek sonuçlar (1-100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Arama modu.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Zaman filtresi.
</ParamField>

<ParamField path="date_after" type="string">
Bu tarihten sonraki sonuçlar (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Bu tarihten önceki sonuçlar (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
İçerik çıkarımı seçenekleri (aşağıya bakın).
</ParamField>

### İçerik çıkarımı

Exa, arama sonuçlarının yanında çıkarılmış içerik döndürebilir. Etkinleştirmek
için bir `contents` nesnesi iletin:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| İçerik seçeneği | Tür                                                                   | Açıklama                         |
| --------------- | --------------------------------------------------------------------- | -------------------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | Tam sayfa metnini çıkar          |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Önemli cümleleri çıkar           |
| `summary`       | `boolean \| { query }`                                                | Yapay zeka tarafından oluşturulan özet |

### Arama modları

| Mod              | Açıklama                                  |
| ---------------- | ----------------------------------------- |
| `auto`           | Exa en iyi modu seçer (varsayılan)        |
| `neural`         | Anlamsal/anlama dayalı arama              |
| `fast`           | Hızlı anahtar kelime araması              |
| `deep`           | Kapsamlı derin arama                      |
| `deep-reasoning` | Akıl yürütmeli derin arama                |
| `instant`        | En hızlı sonuçlar                         |

## Notlar

- Hiçbir `contents` seçeneği sağlanmazsa Exa varsayılan olarak `{ highlights: true }`
  kullanır; böylece sonuçlar önemli cümle alıntıları içerir
- Kullanılabilir olduğunda sonuçlar, Exa API yanıtındaki `highlightScores` ve
  `summary` alanlarını korur
- Sonuç açıklamaları önce vurgulardan, sonra özetten, sonra da tam metinden
  çözümlenir; hangisi kullanılabilirse
- `freshness` ve `date_after`/`date_before` birlikte kullanılamaz; tek bir
  zaman filtresi modu kullanın
- Sorgu başına en fazla 100 sonuç döndürülebilir (Exa arama türü sınırlarına
  tabidir)
- Sonuçlar varsayılan olarak 15 dakika önbelleğe alınır (`cacheTtlMinutes`
  ile yapılandırılabilir)
- Exa, yapılandırılmış JSON yanıtları sunan resmi bir API entegrasyonudur

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tr/tools/brave-search) -- ülke/dil filtreleriyle yapılandırılmış sonuçlar
- [Perplexity Search](/tr/tools/perplexity-search) -- alan adı filtrelemeyle yapılandırılmış sonuçlar
