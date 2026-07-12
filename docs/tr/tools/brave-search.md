---
read_when:
    - web_search için Brave Search'ü kullanmak istiyorsunuz
    - Bir BRAVE_API_KEY'e veya plan ayrıntılarına ihtiyacınız var
summary: web_search için Brave Search API kurulumu
title: Brave araması
x-i18n:
    generated_at: "2026-07-12T12:16:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw, `web_search` sağlayıcısı olarak Brave Search API'yi destekler.

## API anahtarı edinme

1. [https://brave.com/search/api/](https://brave.com/search/api/) adresinde bir Brave Search API hesabı oluşturun.
2. Kontrol panelinde **Search** planını seçin ve bir API anahtarı oluşturun.
3. Anahtarı yapılandırmada saklayın veya Gateway ortamında `BRAVE_API_KEY` değişkenini ayarlayın.

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
            baseUrl: "https://api.search.brave.com", // isteğe bağlı proxy/temel URL geçersiz kılması
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

Sağlayıcıya özgü Brave arama ayarları `plugins.entries.brave.config.webSearch.*` altında bulunur; standart yapılandırma yolu budur. Paylaşılan üst düzey `tools.web.search.apiKey` ve kapsamlı `tools.web.search.brave.*` yolları uyumluluk birleştirmesi aracılığıyla yüklenmeye devam eder, ancak yeni yapılandırmalar yukarıdaki Plugin kapsamlı yolu kullanmalıdır.

`webSearch.mode`, Brave aktarımını denetler:

- `web` (varsayılan): başlıklar, URL'ler ve parçacıklarla normal Brave web araması
- `llm-context`: temellendirme için önceden ayıklanmış metin parçaları ve kaynaklar sunan Brave LLM Context API

`webSearch.baseUrl`, Brave isteklerini güvenilir ve Brave uyumlu bir proxy'ye
veya gateway'e yönlendirebilir. OpenClaw, yapılandırılan temel URL'ye
`/res/v1/web/search` ya da `/res/v1/llm/context` ekler ve temel URL'yi önbellek
anahtarında tutar. Genel uç noktalar `https://` kullanmalıdır; `http://` yalnızca
güvenilir local loopback veya özel ağ proxy ana makineleri için kabul edilir.

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
Kullanıcı arayüzü öğeleri için ISO dil kodu.
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
// Ülkeye ve dile özgü arama
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

- OpenClaw, Brave **Search** planını kullanır. Eski bir aboneliğiniz varsa (ör. ayda 2.000 sorgu sunan ilk Free planı), abonelik geçerliliğini korur ancak LLM Context veya daha yüksek hız sınırları gibi yeni özellikleri içermez.
- Her Brave planı, her ay yenilenen **aylık \$5 ücretsiz kredi** içerir. Search planının maliyeti 1.000 istek başına \$5 olduğundan kredi, ayda 1.000 sorguyu karşılar. Beklenmeyen ücretlerden kaçınmak için Brave kontrol panelinde kullanım sınırınızı ayarlayın. Güncel planlar için [Brave API portalına](https://brave.com/search/api/) bakın.
- Search planı, LLM Context uç noktasını ve yapay zekâ çıkarım haklarını içerir. Modelleri eğitmek veya ayarlamak amacıyla sonuçları saklamak, açık depolama hakları sunan bir plan gerektirir. Brave [Hizmet Şartlarına](https://api-dashboard.search.brave.com/terms-of-service) bakın.
- `llm-context` modu, normal web araması parçacığı biçimi yerine kaynaklara dayalı girdiler döndürür.
- `llm-context` modu, `freshness` ile sınırlandırılmış `date_after` + `date_before` aralıklarını destekler. `ui_lang` desteklenmez; Brave özel güncellik aralıklarının hem başlangıç hem de bitiş tarihini içermesini gerektirdiğinden `date_after` olmadan `date_before` kullanımı reddedilir.
- `ui_lang`, `en-US` gibi bir bölge alt etiketi içermelidir.
- Sonuçlar varsayılan olarak 15 dakika boyunca önbelleğe alınır (`cacheTtlMinutes` aracılığıyla yapılandırılabilir).
- Özel `webSearch.baseUrl` değerleri Brave önbellek kimliğine dahil edilir; böylece
  proxy'ye özgü yanıtlar çakışmaz.
- Sorun giderme sırasında Brave istek URL'lerini/sorgu parametrelerini, yanıt durumunu/zamanlamasını ve arama önbelleği isabet/kaçırma/yazma olaylarını günlüğe kaydetmek için `brave.http` tanılama bayrağını etkinleştirin. Bayrak, API anahtarını veya yanıt gövdelerini hiçbir zaman günlüğe kaydetmez ancak arama sorguları hassas olabilir.

## İlgili içerikler

- [Web Aramasına genel bakış](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Perplexity Araması](/tr/tools/perplexity-search) -- alan adı filtrelemeli yapılandırılmış sonuçlar
- [Exa Araması](/tr/tools/exa-search) -- içerik ayıklamalı sinir ağı tabanlı arama
