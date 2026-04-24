---
read_when:
    - Firecrawl destekli web çıkarımı istiyorsunuz
    - Bir Firecrawl API anahtarına ihtiyacınız var
    - '`web_search` sağlayıcısı olarak Firecrawl istiyorsunuz'
    - '`web_fetch` için anti-bot çıkarımı istiyorsunuz'
summary: Firecrawl arama, scrape ve `web_fetch` geri dönüşü
title: Firecrawl
x-i18n:
    generated_at: "2026-04-24T09:35:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 15
---

OpenClaw, **Firecrawl**'ı üç şekilde kullanabilir:

- `web_search` sağlayıcısı olarak
- açık Plugin araçları olarak: `firecrawl_search` ve `firecrawl_scrape`
- `web_fetch` için geri dönüş çıkarıcısı olarak

Bu, bot aşmayı ve önbellekleme destekleyen barındırılan bir çıkarım/arama hizmetidir;
bu da JS ağırlıklı sitelerde veya düz HTTP fetch isteklerini engelleyen sayfalarda yardımcı olur.

## API anahtarı alın

1. Bir Firecrawl hesabı oluşturun ve bir API anahtarı üretin.
2. Bunu yapılandırmada saklayın veya gateway ortamında `FIRECRAWL_API_KEY` ayarlayın.

## Firecrawl aramasını yapılandırın

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Notlar:

- İlk katılımda veya `openclaw configure --section web` içinde Firecrawl seçmek, paketlenmiş Firecrawl Plugin'ini otomatik olarak etkinleştirir.
- Firecrawl ile `web_search`, `query` ve `count` destekler.
- `sources`, `categories` veya sonuç scrape etme gibi Firecrawl'a özgü denetimler için `firecrawl_search` kullanın.
- `baseUrl` geçersiz kılmaları `https://api.firecrawl.dev` üzerinde kalmalıdır.
- `FIRECRAWL_BASE_URL`, Firecrawl arama ve scrape base URL'leri için paylaşılan ortam geri dönüşüdür.

## Firecrawl scrape + `web_fetch` geri dönüşünü yapılandırın

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Notlar:

- Firecrawl geri dönüş denemeleri yalnızca bir API anahtarı mevcutsa çalışır (`plugins.entries.firecrawl.config.webFetch.apiKey` veya `FIRECRAWL_API_KEY`).
- `maxAgeMs`, önbelleğe alınmış sonuçların ne kadar eski olabileceğini kontrol eder (ms). Varsayılan 2 gündür.
- Eski `tools.web.fetch.firecrawl.*` yapılandırması `openclaw doctor --fix` tarafından otomatik taşınır.
- Firecrawl scrape/base URL geçersiz kılmaları `https://api.firecrawl.dev` ile sınırlıdır.

`firecrawl_scrape`, aynı `plugins.entries.firecrawl.config.webFetch.*` ayarlarını ve ortam değişkenlerini yeniden kullanır.

## Firecrawl Plugin araçları

### `firecrawl_search`

Genel `web_search` yerine Firecrawl'a özgü arama denetimlerini istediğinizde bunu kullanın.

Temel parametreler:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Düz `web_fetch` kullanımının zayıf kaldığı JS ağırlıklı veya bot korumalı sayfalar için bunu kullanın.

Temel parametreler:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / bot aşma

Firecrawl, bot aşma için bir **proxy mode** parametresi sunar (`basic`, `stealth` veya `auto`).
OpenClaw, Firecrawl istekleri için her zaman `proxy: "auto"` ve `storeInCache: true` kullanır.
Proxy atlanırsa Firecrawl varsayılan olarak `auto` kullanır. `auto`, temel bir deneme başarısız olursa stealth proxy'lerle yeniden dener; bu da
yalnızca basic scrape etmeye göre daha fazla kredi kullanabilir.

## `web_fetch`, Firecrawl'ı nasıl kullanır

`web_fetch` çıkarım sırası:

1. Readability (yerel)
2. Firecrawl (etkin `web-fetch` geri dönüşü olarak seçildiyse veya otomatik algılandıysa)
3. Temel HTML temizleme (son geri dönüş)

Seçim düğmesi `tools.web.fetch.provider` değeridir. Bunu atlarsanız, OpenClaw
kullanılabilir kimlik bilgilerinden hazır ilk `web-fetch` sağlayıcısını otomatik algılar.
Bugün paketlenmiş sağlayıcı Firecrawl'dır.

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Web Fetch](/tr/tools/web-fetch) -- Firecrawl geri dönüşlü `web_fetch` aracı
- [Tavily](/tr/tools/tavily) -- arama + çıkarım araçları
