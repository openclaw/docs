---
read_when:
    - web_search için Exa kullanmak istiyorsanız
    - Bir `EXA_API_KEY` anahtarına ihtiyacınız varsa
    - Nöral arama veya içerik çıkarımı istiyorsanız
summary: Exa AI araması -- içerik çıkarımıyla nöral ve anahtar kelime araması
title: Exa Arama
x-i18n:
    generated_at: "2026-04-05T14:11:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 307b727b4fb88756cac51c17ffd73468ca695c4481692e03d0b4a9969982a2a8
    source_path: tools/exa-search.md
    workflow: 15
---

# Exa Arama

OpenClaw, [Exa AI](https://exa.ai/) desteğini bir `web_search` sağlayıcısı olarak sunar. Exa,
yerleşik içerik
çıkarımıyla (öne çıkanlar, metin, özetler) nöral, anahtar kelime ve hibrit arama modları sunar.

## API anahtarı alın

<Steps>
  <Step title="Hesap oluşturun">
    [exa.ai](https://exa.ai/) üzerinden kaydolun ve pano üzerinden
    bir API anahtarı oluşturun.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `EXA_API_KEY` ayarlayın veya şununla yapılandırın:

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
            apiKey: "exa-...", // EXA_API_KEY ayarlıysa isteğe bağlıdır
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

## Araç parametreleri

| Parametre     | Açıklama                                                                     |
| ------------- | ---------------------------------------------------------------------------- |
| `query`       | Arama sorgusu (gerekli)                                                      |
| `count`       | Döndürülecek sonuç sayısı (1-100)                                            |
| `type`        | Arama modu: `auto`, `neural`, `fast`, `deep`, `deep-reasoning` veya `instant` |
| `freshness`   | Zaman filtresi: `day`, `week`, `month` veya `year`                           |
| `date_after`  | Bu tarihten sonraki sonuçlar (YYYY-MM-DD)                                    |
| `date_before` | Bu tarihten önceki sonuçlar (YYYY-MM-DD)                                     |
| `contents`    | İçerik çıkarma seçenekleri (aşağıya bakın)                                   |

### İçerik çıkarma

Exa, arama sonuçlarının yanında çıkarılmış içerik de döndürebilir. Etkinleştirmek için bir `contents`
nesnesi geçin:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // tam sayfa metni
    highlights: { numSentences: 3 }, // ana cümleler
    summary: true, // AI özeti
  },
});
```

| Contents seçeneği | Tür                                                                   | Açıklama                 |
| ----------------- | --------------------------------------------------------------------- | ------------------------ |
| `text`            | `boolean \| { maxCharacters }`                                        | Tam sayfa metnini çıkarır |
| `highlights`      | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Ana cümleleri çıkarır    |
| `summary`         | `boolean \| { query }`                                                | AI tarafından üretilen özet |

### Arama modları

| Mod              | Açıklama                           |
| ---------------- | ---------------------------------- |
| `auto`           | Exa en iyi modu seçer (varsayılan) |
| `neural`         | Anlamsal/anlam tabanlı arama       |
| `fast`           | Hızlı anahtar kelime araması       |
| `deep`           | Ayrıntılı derin arama              |
| `deep-reasoning` | Akıl yürütmeli derin arama         |
| `instant`        | En hızlı sonuçlar                  |

## Notlar

- `contents` seçeneği verilmezse Exa varsayılan olarak `{ highlights: true }` kullanır,
  böylece sonuçlar ana cümle alıntılarını içerir
- Sonuçlar, kullanılabildiğinde Exa API
  yanıtındaki `highlightScores` ve `summary` alanlarını korur
- Sonuç açıklamaları önce highlights, sonra summary, sonra
  tam metinden çözülür — hangisi varsa
- `freshness` ile `date_after`/`date_before` birlikte kullanılamaz — tek bir
  zaman filtresi modu kullanın
- Sorgu başına en fazla 100 sonuç döndürülebilir (Exa arama türü
  sınırlarına tabidir)
- Sonuçlar varsayılan olarak 15 dakika boyunca önbelleğe alınır (
  `cacheTtlMinutes` ile yapılandırılabilir)
- Exa, yapılandırılmış JSON yanıtlarına sahip resmi bir API entegrasyonudur

## İlgili

- [Web Search genel bakışı](/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tools/brave-search) -- ülke/dil filtreli yapılandırılmış sonuçlar
- [Perplexity Search](/tools/perplexity-search) -- alan adı filtrelemeli yapılandırılmış sonuçlar
