---
read_when:
    - Tavily destekli web search istiyorsunuz
    - Bir Tavily API anahtarına ihtiyacınız var
    - Tavily'yi bir web_search sağlayıcısı olarak istiyorsunuz
    - URL'lerden içerik çıkarmak istiyorsunuz
summary: Tavily arama ve içerik çıkarma araçları
title: Tavily
x-i18n:
    generated_at: "2026-04-05T14:13:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: db530cc101dc930611e4ca54e3d5972140f116bfe168adc939dc5752322d205e
    source_path: tools/tavily.md
    workflow: 15
---

# Tavily

OpenClaw, **Tavily**'yi iki şekilde kullanabilir:

- `web_search` sağlayıcısı olarak
- açık eklenti araçları olarak: `tavily_search` ve `tavily_extract`

Tavily, AI uygulamaları için tasarlanmış bir arama API'sidir ve
LLM tüketimi için optimize edilmiş yapılandırılmış sonuçlar döndürür. Yapılandırılabilir arama derinliği,
konu filtreleme, alan adı filtreleri, AI tarafından oluşturulmuş yanıt özetleri ve
URL'lerden içerik çıkarma (JavaScript ile oluşturulan sayfalar dahil) desteği sunar.

## API anahtarı alın

1. [tavily.com](https://tavily.com/) adresinde bir Tavily hesabı oluşturun.
2. Panodan bir API anahtarı oluşturun.
3. Bunu yapılandırmada saklayın veya ağ geçidi ortamında `TAVILY_API_KEY` ayarlayın.

## Tavily aramasını yapılandırın

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // TAVILY_API_KEY ayarlanmışsa isteğe bağlı
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

- Onboarding sırasında veya `openclaw configure --section web` içinde Tavily seçildiğinde
  paketlenmiş Tavily eklentisi otomatik olarak etkinleştirilir.
- Tavily yapılandırmasını `plugins.entries.tavily.config.webSearch.*` altında saklayın.
- Tavily ile `web_search`, `query` ve `count` destekler (en fazla 20 sonuç).
- `search_depth`, `topic`, `include_answer`
  veya alan adı filtreleri gibi Tavily'ye özgü denetimler için `tavily_search` kullanın.

## Tavily eklenti araçları

### `tavily_search`

Genel `web_search` yerine Tavily'ye özgü arama denetimleri istediğinizde bunu kullanın.

| Parametre         | Açıklama                                                              |
| ----------------- | --------------------------------------------------------------------- |
| `query`           | Arama sorgusu dizesi (400 karakterin altında tutun)                   |
| `search_depth`    | `basic` (varsayılan, dengeli) veya `advanced` (en yüksek alaka, daha yavaş) |
| `topic`           | `general` (varsayılan), `news` (gerçek zamanlı güncellemeler) veya `finance` |
| `max_results`     | Sonuç sayısı, 1-20 (varsayılan: 5)                                    |
| `include_answer`  | AI tarafından oluşturulmuş bir yanıt özetini ekle (varsayılan: false) |
| `time_range`      | Güncelliğe göre filtrele: `day`, `week`, `month` veya `year`          |
| `include_domains` | Sonuçları sınırlandırmak için alan adları dizisi                      |
| `exclude_domains` | Sonuçlardan hariç tutulacak alan adları dizisi                        |

**Arama derinliği:**

| Derinlik   | Hız    | Alaka düzeyi | En uygun olduğu kullanım                  |
| ---------- | ------ | ------------ | ----------------------------------------- |
| `basic`    | Daha hızlı | Yüksek    | Genel amaçlı sorgular (varsayılan)        |
| `advanced` | Daha yavaş | En yüksek | Hassasiyet, belirli olgular, araştırma    |

### `tavily_extract`

Bunu bir veya daha fazla URL'den temiz içerik çıkarmak için kullanın. Hedefe yönelik
çıkarma için JavaScript ile oluşturulan sayfaları işler ve sorgu odaklı parçalara ayırmayı destekler.

| Parametre           | Açıklama                                                   |
| ------------------- | ---------------------------------------------------------- |
| `urls`              | İçerik çıkarılacak URL'ler dizisi (istek başına 1-20)      |
| `query`             | Çıkarılan parçaları bu sorguya göre alaka düzeyine göre yeniden sırala |
| `extract_depth`     | `basic` (varsayılan, hızlı) veya `advanced` (JS ağırlıklı sayfalar için) |
| `chunks_per_source` | URL başına parça sayısı, 1-5 (`query` gerektirir)          |
| `include_images`    | Sonuçlara görsel URL'lerini ekle (varsayılan: false)       |

**Çıkarma derinliği:**

| Derinlik   | Ne zaman kullanılır                        |
| ---------- | ------------------------------------------ |
| `basic`    | Basit sayfalar - önce bunu deneyin         |
| `advanced` | JS ile oluşturulan SPA'lar, dinamik içerik, tablolar |

İpuçları:

- İstek başına en fazla 20 URL. Daha büyük listeleri birden çok çağrıya bölün.
- Tam sayfalar yerine yalnızca ilgili içeriği almak için `query` + `chunks_per_source` kullanın.
- Önce `basic` deneyin; içerik eksikse veya tamamlanmamışsa `advanced` seçeneğine geri dönün.

## Doğru aracı seçme

| İhtiyaç                              | Araç             |
| ------------------------------------ | ---------------- |
| Hızlı web araması, özel seçenek yok  | `web_search`     |
| Derinlik, konu, AI yanıtları ile arama | `tavily_search`  |
| Belirli URL'lerden içerik çıkarma    | `tavily_extract` |

## İlgili

- [Web Search genel bakışı](/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Firecrawl](/tr/tools/firecrawl) -- içerik çıkarma ile arama + scraping
- [Exa Search](/tr/tools/exa-search) -- içerik çıkarma ile nöral arama
