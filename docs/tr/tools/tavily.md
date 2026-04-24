---
read_when:
    - Tavily destekli web arama istiyorsunuz
    - Bir Tavily API anahtarına ihtiyacınız var
    - '`web_search` sağlayıcısı olarak Tavily istiyorsunuz'
    - URL'lerden içerik çıkarımı istiyorsunuz
summary: Tavily arama ve çıkarım araçları
title: Tavily
x-i18n:
    generated_at: "2026-04-24T09:37:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af858cd8507e3ebe6614f0695f568ce589798c816c8475685526422a048ef1a
    source_path: tools/tavily.md
    workflow: 15
---

OpenClaw, **Tavily**'yi iki şekilde kullanabilir:

- `web_search` sağlayıcısı olarak
- açık Plugin araçları olarak: `tavily_search` ve `tavily_extract`

Tavily, AI uygulamaları için tasarlanmış bir arama API'sidir ve
LLM tüketimi için optimize edilmiş yapılandırılmış sonuçlar döndürür. Yapılandırılabilir arama derinliği, konu
filtreleme, alan adı filtreleri, AI tarafından üretilen yanıt özetleri ve
URL'lerden içerik çıkarımı (JavaScript ile oluşturulmuş sayfalar dahil) destekler.

## API anahtarı alın

1. [tavily.com](https://tavily.com/) adresinde bir Tavily hesabı oluşturun.
2. Panoda bir API anahtarı üretin.
3. Bunu yapılandırmada saklayın veya gateway ortamında `TAVILY_API_KEY` ayarlayın.

## Tavily aramasını yapılandırın

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // TAVILY_API_KEY ayarlıysa isteğe bağlı
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

Notlar:

- İlk katılımda veya `openclaw configure --section web` içinde Tavily seçmek,
  paketlenmiş Tavily Plugin'ini otomatik olarak etkinleştirir.
- Tavily yapılandırmasını `plugins.entries.tavily.config.webSearch.*` altında saklayın.
- Tavily ile `web_search`, `query` ve `count` destekler (en fazla 20 sonuç).
- `search_depth`, `topic`, `include_answer`
  veya alan adı filtreleri gibi Tavily'ye özgü denetimler için `tavily_search` kullanın.

## Tavily Plugin araçları

### `tavily_search`

Genel
`web_search` yerine Tavily'ye özgü arama denetimlerini istediğinizde bunu kullanın.

| Parametre         | Açıklama                                                                |
| ----------------- | ----------------------------------------------------------------------- |
| `query`           | Arama sorgu dizesi (400 karakter altında tutun)                         |
| `search_depth`    | `basic` (varsayılan, dengeli) veya `advanced` (en yüksek alaka, daha yavaş) |
| `topic`           | `general` (varsayılan), `news` (gerçek zamanlı güncellemeler) veya `finance` |
| `max_results`     | Sonuç sayısı, 1-20 (varsayılan: 5)                                      |
| `include_answer`  | AI tarafından üretilen yanıt özetini dahil et (varsayılan: false)      |
| `time_range`      | Yeniliğe göre filtrele: `day`, `week`, `month` veya `year`              |
| `include_domains` | Sonuçları kısıtlamak için alan adı dizisi                               |
| `exclude_domains` | Sonuçlardan hariç tutulacak alan adı dizisi                             |

**Arama derinliği:**

| Derinlik    | Hız    | Alaka       | En uygun olduğu kullanım                |
| ----------- | ------ | ----------- | --------------------------------------- |
| `basic`     | Daha hızlı | Yüksek   | Genel amaçlı sorgular (varsayılan)      |
| `advanced`  | Daha yavaş | En yüksek | Kesinlik, belirli gerçekler, araştırma |

### `tavily_extract`

Bir veya daha fazla URL'den temiz içerik çıkarmak için bunu kullanın. JavaScript ile oluşturulmuş sayfaları işler ve hedefli
çıkarım için sorgu odaklı parçalara ayırmayı destekler.

| Parametre           | Açıklama                                                         |
| ------------------- | ---------------------------------------------------------------- |
| `urls`              | Çıkarılacak URL dizisi (istek başına 1-20)                       |
| `query`             | Çıkarılan parçaları bu sorguya göre alaka açısından yeniden sırala |
| `extract_depth`     | `basic` (varsayılan, hızlı) veya `advanced` (JS ağırlıklı sayfalar için) |
| `chunks_per_source` | URL başına parça, 1-5 (`query` gerektirir)                       |
| `include_images`    | Sonuçlara görüntü URL'lerini dahil et (varsayılan: false)        |

**Çıkarım derinliği:**

| Derinlik    | Ne zaman kullanılmalı                         |
| ----------- | --------------------------------------------- |
| `basic`     | Basit sayfalar - önce bunu deneyin            |
| `advanced`  | JS ile oluşturulmuş SPA'lar, dinamik içerik, tablolar |

İpuçları:

- İstek başına en fazla 20 URL. Daha büyük listeleri birden fazla çağrıya bölün.
- Tüm sayfalar yerine yalnızca ilgili içeriği almak için `query` + `chunks_per_source` kullanın.
- Önce `basic` deneyin; içerik eksikse veya tam değilse `advanced`'a geri dönün.

## Doğru aracı seçme

| İhtiyaç                               | Araç             |
| ------------------------------------- | ---------------- |
| Hızlı web araması, özel seçenek yok   | `web_search`     |
| Derinlik, konu, AI yanıtları ile arama | `tavily_search` |
| Belirli URL'lerden içerik çıkarma     | `tavily_extract` |

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Firecrawl](/tr/tools/firecrawl) -- içerik çıkarımlı arama + scraping
- [Exa Search](/tr/tools/exa-search) -- içerik çıkarımlı nöral arama
