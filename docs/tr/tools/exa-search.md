---
read_when:
    - web_search için Exa kullanmak istiyorsunuz
    - Bir `EXA_API_KEY` değerine ihtiyacınız var
    - Nöral arama veya içerik çıkarımı istiyorsunuz
summary: Exa AI araması -- içerik çıkarımı ile nöral ve anahtar kelime araması
title: Exa araması
x-i18n:
    generated_at: "2026-04-24T09:34:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClaw, [Exa AI](https://exa.ai/)'ı bir `web_search` sağlayıcısı olarak destekler. Exa,
yerleşik içerik çıkarımı (öne çıkan bölümler, metin, özetler) ile birlikte
nöral, anahtar kelime ve hibrit arama modları sunar.

## Bir API anahtarı alın

<Steps>
  <Step title="Bir hesap oluşturun">
    [exa.ai](https://exa.ai/) üzerinden kaydolun ve
    panonuzdan bir API anahtarı oluşturun.
  </Step>
  <Step title="Anahtarı saklayın">
    `EXA_API_KEY` değerini Gateway ortamında ayarlayın veya şununla yapılandırın:

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
            apiKey: "exa-...", // EXA_API_KEY ayarlıysa isteğe bağlı
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

**Ortam alternatifi:** `EXA_API_KEY` değerini Gateway ortamında ayarlayın.
Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.

## Araç parametreleri

<ParamField path="query" type="string" required>
Arama sorgusu.
</ParamField>

<ParamField path="count" type="number">
Döndürülecek sonuç sayısı (1–100).
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
İçerik çıkarma seçenekleri (aşağıya bakın).
</ParamField>

### İçerik çıkarma

Exa, arama sonuçlarının yanında çıkarılmış içerik de döndürebilir. Etkinleştirmek için bir `contents`
nesnesi geçin:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // tam sayfa metni
    highlights: { numSentences: 3 }, // önemli cümleler
    summary: true, // AI özeti
  },
});
```

| İçerik seçeneği | Tür                                                                   | Açıklama                 |
| --------------- | --------------------------------------------------------------------- | ------------------------ |
| `text`          | `boolean \| { maxCharacters }`                                        | Tam sayfa metnini çıkarır |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Önemli cümleleri çıkarır |
| `summary`       | `boolean \| { query }`                                                | AI tarafından üretilmiş özet |

### Arama modları

| Mod              | Açıklama                            |
| ---------------- | ----------------------------------- |
| `auto`           | Exa en iyi modu seçer (varsayılan)  |
| `neural`         | Anlamsal/anlam tabanlı arama        |
| `fast`           | Hızlı anahtar kelime araması        |
| `deep`           | Kapsamlı derin arama                |
| `deep-reasoning` | Akıl yürütmeli derin arama          |
| `instant`        | En hızlı sonuçlar                   |

## Notlar

- `contents` seçeneği verilmezse Exa varsayılan olarak `{ highlights: true }`
  kullanır; böylece sonuçlar önemli cümle alıntılarını içerir
- Sonuçlar, mevcut olduğunda Exa API
  yanıtındaki `highlightScores` ve `summary` alanlarını korur
- Sonuç açıklamaları önce highlights'tan, sonra summary'den, sonra
  tam metinden çözülür — hangisi mevcutsa o kullanılır
- `freshness` ile `date_after`/`date_before` birlikte kullanılamaz — bir
  zaman filtresi modu seçin
- Sorgu başına en fazla 100 sonuç döndürülebilir (Exa arama türü
  sınırlarına tabi olarak)
- Sonuçlar varsayılan olarak 15 dakika önbelleğe alınır (
  `cacheTtlMinutes` ile yapılandırılabilir)
- Exa, yapılandırılmış JSON yanıtlarıyla resmi bir API entegrasyonudur

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tr/tools/brave-search) -- ülke/dil filtreleri ile yapılandırılmış sonuçlar
- [Perplexity Search](/tr/tools/perplexity-search) -- alan adı filtreleme ile yapılandırılmış sonuçlar
