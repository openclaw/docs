---
read_when:
    - web_search için Brave Search kullanmak istiyorsunuz
    - Bir BRAVE_API_KEY veya plan ayrıntılarına ihtiyacınız var
summary: web_search için Brave Search API kurulumu
title: Brave Search
x-i18n:
    generated_at: "2026-04-05T14:09:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc026a69addf74375a0e407805b875ff527c77eb7298b2f5bb0e165197f77c0c
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw, `web_search` sağlayıcısı olarak Brave Search API'yi destekler.

## API anahtarı alın

1. [https://brave.com/search/api/](https://brave.com/search/api/) adresinde bir Brave Search API hesabı oluşturun
2. Kontrol panelinde **Search** planını seçin ve bir API anahtarı oluşturun.
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
            mode: "web", // or "llm-context"
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
Eski `tools.web.search.apiKey` hâlâ uyumluluk shim'i üzerinden yüklenir, ancak artık kanonik yapılandırma yolu değildir.

`webSearch.mode`, Brave taşımasını denetler:

- `web` (varsayılan): başlıklar, URL'ler ve parçacıklarla normal Brave web araması
- `llm-context`: dayanak sağlamak için önceden çıkarılmış metin parçaları ve kaynaklar içeren Brave LLM Context API

## Araç parametreleri

| Parameter     | Description                                                                |
| ------------- | -------------------------------------------------------------------------- |
| `query`       | Arama sorgusu (gerekli)                                                    |
| `count`       | Döndürülecek sonuç sayısı (1-10, varsayılan: 5)                            |
| `country`     | 2 harfli ISO ülke kodu (ör. `"US"`, `"DE"`)                                |
| `language`    | Arama sonuçları için ISO 639-1 dil kodu (ör. `"en"`, `"de"`, `"fr"`)       |
| `search_lang` | Brave arama dili kodu (ör. `en`, `en-gb`, `zh-hans`)                       |
| `ui_lang`     | UI öğeleri için ISO dil kodu                                               |
| `freshness`   | Zaman filtresi: `day` (24 sa), `week`, `month` veya `year`                 |
| `date_after`  | Yalnızca bu tarihten sonra yayımlanan sonuçlar (YYYY-MM-DD)                |
| `date_before` | Yalnızca bu tarihten önce yayımlanan sonuçlar (YYYY-MM-DD)                 |

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

- OpenClaw, Brave **Search** planını kullanır. Eski bir aboneliğiniz varsa (ör. ayda 2.000 sorgu içeren özgün Free planı), bu abonelik geçerliliğini korur ancak LLM Context veya daha yüksek oran sınırları gibi daha yeni özellikleri içermez.
- Her Brave planı **ayda \$5 ücretsiz kredi** içerir (yenilenir). Search planı 1.000 istek başına \$5 maliyetlidir, bu nedenle kredi ayda 1.000 sorguyu kapsar. Beklenmedik ücretlerden kaçınmak için kullanım sınırınızı Brave kontrol panelinde ayarlayın. Güncel planlar için [Brave API portalına](https://brave.com/search/api/) bakın.
- Search planı, LLM Context uç noktasını ve AI çıkarım haklarını içerir. Sonuçları modelleri eğitmek veya ayarlamak için depolamak, açık depolama hakları içeren bir plan gerektirir. Brave [Hizmet Şartları](https://api-dashboard.search.brave.com/terms-of-service) bölümüne bakın.
- `llm-context` modu, normal web araması parçacık şekli yerine dayanaklı kaynak girdileri döndürür.
- `llm-context` modu `ui_lang`, `freshness`, `date_after` veya `date_before` desteklemez.
- `ui_lang`, `en-US` gibi bir bölge alt etiketi içermelidir.
- Sonuçlar varsayılan olarak 15 dakika önbelleğe alınır (`cacheTtlMinutes` ile yapılandırılabilir).

## İlgili

- [Web Search genel bakış](/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Perplexity Search](/tools/perplexity-search) -- alan filtreleme ile yapılandırılmış sonuçlar
- [Exa Search](/tools/exa-search) -- içerik çıkarımıyla nöral arama
