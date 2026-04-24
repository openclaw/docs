---
read_when:
    - '`web_search` için Brave Search kullanmak istiyorsunuz'
    - Bir `BRAVE_API_KEY` veya plan ayrıntılarına ihtiyacınız var
summary: '`web_search` için Brave Search API kurulumu'
title: Brave arama
x-i18n:
    generated_at: "2026-04-24T09:33:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw, Brave Search API'yi bir `web_search` sağlayıcısı olarak destekler.

## API anahtarı alın

1. [https://brave.com/search/api/](https://brave.com/search/api/) adresinde bir Brave Search API hesabı oluşturun
2. Panoda **Search** planını seçin ve bir API anahtarı oluşturun.
3. Anahtarı yapılandırmada saklayın veya Gateway ortamında `BRAVE_API_KEY` ayarlayın.

## Yapılandırma örneği

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

Sağlayıcıya özgü Brave arama ayarları artık `plugins.entries.brave.config.webSearch.*` altında yaşar.
Eski `tools.web.search.apiKey` değeri uyumluluk katmanı üzerinden hâlâ yüklenir, ancak artık kanonik yapılandırma yolu değildir.

`webSearch.mode`, Brave taşımasını kontrol eder:

- `web` (varsayılan): başlıklar, URL'ler ve parçacıklarla normal Brave web araması
- `llm-context`: temellendirme için önceden çıkarılmış metin parçaları ve kaynaklarla Brave LLM Context API

## Araç parametreleri

<ParamField path="query" type="string" required>
Arama sorgusu.
</ParamField>

<ParamField path="count" type="number" default="5">
Döndürülecek sonuç sayısı (1–10).
</ParamField>

<ParamField path="country" type="string">
2 harfli ISO ülke kodu (ör. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Arama sonuçları için ISO 639-1 dil kodu (ör. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Brave arama dili kodu (ör. `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
UI öğeleri için ISO dil kodu.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Zaman filtresi — `day` 24 saattir.
</ParamField>

<ParamField path="date_after" type="string">
Yalnızca bu tarihten sonra yayımlanmış sonuçlar (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Yalnızca bu tarihten önce yayımlanmış sonuçlar (`YYYY-MM-DD`).
</ParamField>

**Örnekler:**

```javascript
// Ülke ve dile özgü arama
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Yakın tarihli sonuçlar (geçen hafta)
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

- OpenClaw, Brave **Search** planını kullanır. Eski bir aboneliğiniz varsa (ör. ayda 2.000 sorgulu orijinal Free plan), bu abonelik hâlâ geçerlidir ancak LLM Context veya daha yüksek oran sınırları gibi daha yeni özellikleri içermez.
- Her Brave planı, yenilenen **aylık 5$ ücretsiz kredi** içerir. Search planı 1.000 istek başına 5$ maliyete sahiptir; bu kredi ayda 1.000 sorguyu kapsar. Beklenmedik ücretlerden kaçınmak için kullanım sınırınızı Brave panosunda ayarlayın. Geçerli planlar için [Brave API portalına](https://brave.com/search/api/) bakın.
- Search planı, LLM Context uç noktasını ve AI çıkarım haklarını içerir. Sonuçları modelleri eğitmek veya ince ayarlamak için saklamak, açık depolama hakları olan bir plan gerektirir. Brave [Terms of Service](https://api-dashboard.search.brave.com/terms-of-service) sayfasına bakın.
- `llm-context` modu, normal web arama parçacığı şekli yerine temellendirilmiş kaynak girdileri döndürür.
- `llm-context` modu `ui_lang`, `freshness`, `date_after` veya `date_before` desteklemez.
- `ui_lang`, `en-US` gibi bir bölge alt etiketi içermelidir.
- Sonuçlar varsayılan olarak 15 dakika önbelleğe alınır (`cacheTtlMinutes` ile yapılandırılabilir).

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Perplexity Search](/tr/tools/perplexity-search) -- alan adı filtrelemeli yapılandırılmış sonuçlar
- [Exa Search](/tr/tools/exa-search) -- içerik çıkarmalı nöral arama
