---
read_when:
    - Firecrawl destekli web çıkarımı istiyorsunuz
    - Bir Firecrawl API anahtarına ihtiyacınız var
    - Firecrawl'ı bir `web_search` sağlayıcısı olarak istiyorsunuz
    - '`web_fetch` için bot karşıtı çıkarım istiyorsunuz'
summary: Firecrawl arama, kazıma ve `web_fetch` geri dönüşü
title: Firecrawl
x-i18n:
    generated_at: "2026-04-05T14:11:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f17fc4b8e81e1bfe25f510b0a64ab0d50c4cc95bcf88d6ba7c62cece26162e
    source_path: tools/firecrawl.md
    workflow: 15
---

# Firecrawl

OpenClaw, **Firecrawl**'ı üç şekilde kullanabilir:

- `web_search` sağlayıcısı olarak
- açık eklenti araçları olarak: `firecrawl_search` ve `firecrawl_scrape`
- `web_fetch` için geri dönüş çıkarıcısı olarak

Bot engellemelerini aşmayı ve önbellekleme desteğini destekleyen barındırılan bir çıkarım/arama hizmetidir;
bu da JS ağırlıklı sitelerde veya düz HTTP getirmelerini engelleyen sayfalarda yardımcı olur.

## API anahtarı alma

1. Bir Firecrawl hesabı oluşturun ve bir API anahtarı üretin.
2. Bunu yapılandırmada saklayın veya gateway ortamında `FIRECRAWL_API_KEY` ayarlayın.

## Firecrawl aramasını yapılandırma

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

- İlk kurulumda veya `openclaw configure --section web` içinde Firecrawl'ı seçmek, paketlenmiş Firecrawl eklentisini otomatik olarak etkinleştirir.
- Firecrawl ile `web_search`, `query` ve `count` destekler.
- `sources`, `categories` veya sonuç kazıma gibi Firecrawl'a özgü denetimler için `firecrawl_search` kullanın.
- `baseUrl` geçersiz kılmaları `https://api.firecrawl.dev` üzerinde kalmalıdır.
- `FIRECRAWL_BASE_URL`, Firecrawl arama ve kazıma temel URL'leri için paylaşılan ortam geri dönüşüdür.

## Firecrawl kazıma + `web_fetch` geri dönüşünü yapılandırma

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

- Firecrawl geri dönüş denemeleri yalnızca bir API anahtarı mevcut olduğunda çalışır (`plugins.entries.firecrawl.config.webFetch.apiKey` veya `FIRECRAWL_API_KEY`).
- `maxAgeMs`, önbelleğe alınmış sonuçların ne kadar eski olabileceğini kontrol eder (ms). Varsayılan 2 gündür.
- Eski `tools.web.fetch.firecrawl.*` yapılandırması `openclaw doctor --fix` tarafından otomatik olarak taşınır.
- Firecrawl kazıma/temel URL geçersiz kılmaları `https://api.firecrawl.dev` ile sınırlıdır.

`firecrawl_scrape`, aynı `plugins.entries.firecrawl.config.webFetch.*` ayarlarını ve ortam değişkenlerini yeniden kullanır.

## Firecrawl eklenti araçları

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

Düz `web_fetch`'in zayıf kaldığı JS ağırlıklı veya bot korumalı sayfalar için bunu kullanın.

Temel parametreler:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Gizlilik / bot engellemesini aşma

Firecrawl, bot engellemesini aşmak için bir **proxy mode** parametresi sunar (`basic`, `stealth` veya `auto`).
OpenClaw, Firecrawl istekleri için her zaman `proxy: "auto"` ve `storeInCache: true` kullanır.
`proxy` belirtilmezse, Firecrawl varsayılan olarak `auto` kullanır. `auto`, temel bir deneme başarısız olursa stealth proxy'lerle yeniden dener; bu da
yalnızca basic kazımaya göre daha fazla kredi kullanabilir.

## `web_fetch`, Firecrawl'ı nasıl kullanır

`web_fetch` çıkarım sırası:

1. Readability (yerel)
2. Firecrawl (etkin `web-fetch` geri dönüşü olarak seçildiyse veya otomatik algılandıysa)
3. Temel HTML temizleme (son geri dönüş)

Seçim ayarı `tools.web.fetch.provider` değeridir. Bunu belirtmezseniz, OpenClaw
mevcut kimlik bilgilerinden hazır olan ilk `web-fetch` sağlayıcısını otomatik algılar.
Bugün paketlenmiş sağlayıcı Firecrawl'dır.

## İlgili

- [Web Search genel bakışı](/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Web Fetch](/tools/web-fetch) -- Firecrawl geri dönüşlü `web_fetch` aracı
- [Tavily](/tools/tavily) -- arama + çıkarım araçları
