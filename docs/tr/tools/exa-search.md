---
read_when:
    - web_search için Exa kullanmak istiyorsunuz
    - EXA_API_KEY gerekir
    - Sinirsel arama veya içerik çıkarma istiyorsunuz
summary: Exa AI araması -- içerik çıkarma ile nöral ve anahtar kelime araması
title: Exa araması
x-i18n:
    generated_at: "2026-06-28T01:21:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw, `web_search` sağlayıcısı olarak [Exa AI](https://exa.ai/) desteği sunar. Exa
yerleşik içerik çıkarma (vurgular, metin, özetler) ile nöral, anahtar kelime
ve hibrit arama modları sunar.

## Plugin yükle

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## API anahtarı alın

<Steps>
  <Step title="Hesap oluşturun">
    [exa.ai](https://exa.ai/) adresinde kaydolun ve panonuzdan bir API anahtarı
    oluşturun.
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

Exa arama isteklerinin uyumlu bir proxy veya alternatif Exa uç noktası
üzerinden gitmesi gerektiğinde `plugins.entries.exa.config.webSearch.baseUrl`
ayarlayın. OpenClaw, çıplak ana bilgisayar adlarını başına `https://` ekleyerek
normalleştirir ve yol zaten orada bitmiyorsa `/search` ekler. Çözümlenen uç
nokta arama önbelleği anahtarına dahil edilir, bu nedenle farklı Exa uç
noktalarından gelen sonuçlar paylaşılmaz.

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
İçerik çıkarma seçenekleri (aşağıya bakın).
</ParamField>

### İçerik çıkarma

Exa, arama sonuçlarının yanında çıkarılmış içerik döndürebilir. Etkinleştirmek
için bir `contents` nesnesi geçirin:

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

| İçerik seçeneği | Tür                                                                   | Açıklama                  |
| --------------- | --------------------------------------------------------------------- | ------------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | Tam sayfa metnini çıkar   |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Ana cümleleri çıkar       |
| `summary`       | `boolean \| { query }`                                                | AI tarafından üretilen özet |

### Arama modları

| Mod              | Açıklama                                  |
| ---------------- | ----------------------------------------- |
| `auto`           | Exa en iyi modu seçer (varsayılan)        |
| `neural`         | Anlamsal/anlam tabanlı arama              |
| `fast`           | Hızlı anahtar kelime araması              |
| `deep`           | Kapsamlı derin arama                      |
| `deep-reasoning` | Akıl yürütmeli derin arama                |
| `instant`        | En hızlı sonuçlar                         |

## Notlar

- `contents` seçeneği sağlanmazsa, Exa varsayılan olarak `{ highlights: true }`
  kullanır, böylece sonuçlar ana cümle alıntıları içerir
- Sonuçlar, mevcut olduğunda Exa API yanıtındaki `highlightScores` ve `summary`
  alanlarını korur
- Sonuç açıklamaları önce vurgulardan, ardından özetten, ardından tam metinden
  çözümlenir; hangisi mevcutsa
- `freshness` ve `date_after`/`date_before` birleştirilemez; tek bir zaman
  filtresi modu kullanın
- Sorgu başına en fazla 100 sonuç döndürülebilir (Exa arama türü sınırlarına
  tabidir)
- Sonuçlar varsayılan olarak 15 dakika önbelleğe alınır (`cacheTtlMinutes`
  ile yapılandırılabilir)
- Exa, yapılandırılmış JSON yanıtları olan resmi bir API entegrasyonudur

## İlgili

- [Web Arama genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tr/tools/brave-search) -- ülke/dil filtreleriyle yapılandırılmış sonuçlar
- [Perplexity Search](/tr/tools/perplexity-search) -- alan adı filtrelemeyle yapılandırılmış sonuçlar
