---
read_when:
    - web_search için Brave Search kullanmak istiyorsunuz
    - BRAVE_API_KEY veya plan ayrıntıları gerekir
summary: web_search için Brave Search API kurulumu
title: Brave araması
x-i18n:
    generated_at: "2026-05-06T09:32:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2bff7589ddb54d002853898c6fc37e613fd32b0fa69cb0d712d5955973efb39
    source_path: tools/brave-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw, Brave Search API'yi bir `web_search` sağlayıcısı olarak destekler.

## API anahtarı alın

1. [https://brave.com/search/api/](https://brave.com/search/api/) adresinde bir Brave Search API hesabı oluşturun
2. Kontrol panelinde **Search** planını seçin ve bir API anahtarı oluşturun.
3. Anahtarı yapılandırmada saklayın veya Gateway ortamında `BRAVE_API_KEY` değerini ayarlayın.

## Yapılandırma örneği

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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
Eski `tools.web.search.apiKey` uyumluluk katmanı üzerinden hâlâ yüklenir, ancak artık kanonik yapılandırma yolu değildir.

`webSearch.mode`, Brave aktarımını kontrol eder:

- `web` (varsayılan): başlıklar, URL'ler ve parçacıklarla normal Brave web araması
- `llm-context`: önceden çıkarılmış metin parçaları ve temellendirme için kaynaklarla Brave LLM Context API

`webSearch.baseUrl`, Brave isteklerini güvenilir Brave uyumlu bir proxy'ye
veya gateway'e yönlendirebilir. OpenClaw, yapılandırılan temel URL'ye `/res/v1/web/search` veya `/res/v1/llm/context` ekler ve temel URL'yi önbellek anahtarında tutar. Genel
uç noktalar `https://` kullanmalıdır; `http://` yalnızca güvenilir local loopback
veya özel ağ proxy ana makineleri için kabul edilir.

## Araç parametreleri

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
Arama sonuçları için ISO 639-1 dil kodu (örn. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Brave arama dili kodu (örn. `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
UI öğeleri için ISO dil kodu.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Zaman filtresi — `day` 24 saattir.
</ParamField>

<ParamField path="date_after" type="string">
Yalnızca bu tarihten sonra yayımlanan sonuçlar (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Yalnızca bu tarihten önce yayımlanan sonuçlar (`YYYY-MM-DD`).
</ParamField>

**Örnekler:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Notlar

- OpenClaw, Brave **Search** planını kullanır. Eski bir aboneliğiniz varsa (örn. ayda 2.000 sorgu içeren özgün Ücretsiz plan), geçerli kalır ancak LLM Context veya daha yüksek hız sınırları gibi daha yeni özellikleri içermez.
- Her Brave planı **aylık \$5 ücretsiz kredi** (yenilenen) içerir. Search planı 1.000 istek başına \$5 tutarındadır, bu nedenle kredi ayda 1.000 sorguyu kapsar. Beklenmeyen ücretlerden kaçınmak için kullanım limitinizi Brave kontrol panelinde ayarlayın. Güncel planlar için [Brave API portalına](https://brave.com/search/api/) bakın.
- Search planı, LLM Context uç noktasını ve AI çıkarım haklarını içerir. Modelleri eğitmek veya ince ayar yapmak için sonuçları saklamak, açık saklama hakları olan bir plan gerektirir. Brave [Hizmet Şartları](https://api-dashboard.search.brave.com/terms-of-service) sayfasına bakın.
- `llm-context` modu, normal web araması parçacık biçimi yerine temellendirilmiş kaynak girdileri döndürür.
- `llm-context` modu `freshness` ve sınırlandırılmış `date_after` + `date_before` aralıklarını destekler. `ui_lang` değerini desteklemez; `date_after` olmadan `date_before` reddedilir çünkü Brave, özel güncellik aralıklarının hem başlangıç hem de bitiş tarihlerini içermesini gerektirir.
- `ui_lang`, `en-US` gibi bir bölge alt etiketi içermelidir.
- Sonuçlar varsayılan olarak 15 dakika önbelleğe alınır (`cacheTtlMinutes` ile yapılandırılabilir).
- Özel `webSearch.baseUrl` değerleri Brave önbellek kimliğine dahil edilir, bu nedenle
  proxy'ye özgü yanıtlar çakışmaz.
- Sorun giderirken Brave istek URL'lerini/sorgu parametrelerini, yanıt durumunu/zamanlamasını ve arama önbelleği isabet/ıskalama/yazma olaylarını günlüğe kaydetmek için `brave.http` tanılama bayrağını etkinleştirin. Bayrak API anahtarını veya yanıt gövdelerini asla günlüğe kaydetmez, ancak arama sorguları hassas olabilir.

## İlgili

- [Web Araması genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Perplexity Search](/tr/tools/perplexity-search) -- alan filtrelemeli yapılandırılmış sonuçlar
- [Exa Search](/tr/tools/exa-search) -- içerik çıkarımlı sinirsel arama
