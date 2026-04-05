---
read_when:
    - '`web_search` için Brave Search kullanmak istiyorsunuz'
    - Bir `BRAVE_API_KEY` veya plan ayrıntılarına ihtiyacınız var
summary: '`web_search` için Brave Search API kurulumu'
title: Brave Search (eski yol)
x-i18n:
    generated_at: "2026-04-05T13:42:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7788e4cee7dc460819e55095c87df8cea29ba3a8bd3cef4c0e98ac601b45b651
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw, Brave Search API'yi bir `web_search` sağlayıcısı olarak destekler.

## Bir API anahtarı alın

1. [https://brave.com/search/api/](https://brave.com/search/api/) adresinde bir Brave Search API hesabı oluşturun
2. Panoda **Search** planını seçin ve bir API anahtarı oluşturun.
3. Anahtarı config içinde saklayın veya Gateway ortamında `BRAVE_API_KEY` ayarlayın.

## Config örneği

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // veya "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Sağlayıcıya özgü Brave arama ayarları artık `plugins.entries.brave.config.webSearch.*` altında bulunur.
Eski `tools.web.search.apiKey` hâlâ uyumluluk shim'i üzerinden yüklenir, ancak artık kanonik config yolu değildir.

`webSearch.mode`, Brave taşımasını kontrol eder:

- `web` (varsayılan): başlıklar, URL'ler ve özetlerle normal Brave web araması
- `llm-context`: temellendirme için önceden çıkarılmış metin parçaları ve kaynaklar içeren Brave LLM Context API

## Araç parametreleri

| Parametre     | Açıklama                                                            |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Arama sorgusu (zorunlu)                                             |
| `count`       | Döndürülecek sonuç sayısı (1-10, varsayılan: 5)                     |
| `country`     | 2 harfli ISO ülke kodu (örn. "US", "DE")                            |
| `language`    | Arama sonuçları için ISO 639-1 dil kodu (örn. "en", "de", "fr")     |
| `search_lang` | Brave arama dili kodu (örn. `en`, `en-gb`, `zh-hans`)               |
| `ui_lang`     | UI öğeleri için ISO dil kodu                                        |
| `freshness`   | Zaman filtresi: `day` (24 sa), `week`, `month` veya `year`          |
| `date_after`  | Yalnızca bu tarihten sonra yayımlanan sonuçlar (YYYY-MM-DD)         |
| `date_before` | Yalnızca bu tarihten önce yayımlanan sonuçlar (YYYY-MM-DD)          |

**Örnekler:**

```javascript
// Ülke ve dile özgü arama
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
```

## Notlar

- OpenClaw, Brave **Search** planını kullanır. Eski bir aboneliğiniz varsa (ör. ayda 2.000 sorgu içeren özgün Free planı), bu abonelik geçerliliğini korur ancak LLM Context veya daha yüksek oran sınırları gibi daha yeni özellikleri içermez.
- Her Brave planı, yenilenen **aylık \$5 ücretsiz kredi** içerir. Search planı 1.000 istek başına \$5 tutarındadır; dolayısıyla kredi ayda 1.000 sorguyu kapsar. Beklenmedik ücretlerden kaçınmak için kullanım sınırınızı Brave panosunda ayarlayın. Güncel planlar için [Brave API portalı](https://brave.com/search/api/) sayfasına bakın.
- Search planı, LLM Context uç noktasını ve AI çıkarım haklarını içerir. Sonuçları modelleri eğitmek veya ince ayar yapmak için depolamak, açık depolama hakları içeren bir plan gerektirir. Brave [Terms of Service](https://api-dashboard.search.brave.com/terms-of-service) belgesine bakın.
- `llm-context` modu, normal web araması özet biçimi yerine temellendirilmiş kaynak girdileri döndürür.
- `llm-context` modu `ui_lang`, `freshness`, `date_after` veya `date_before` desteklemez.
- `ui_lang`, `en-US` gibi bir bölge alt etiketi içermelidir.
- Sonuçlar varsayılan olarak 15 dakika önbelleğe alınır (`cacheTtlMinutes` ile yapılandırılabilir).

Tam `web_search` yapılandırması için [Web araçları](/tools/web) bölümüne bakın.
