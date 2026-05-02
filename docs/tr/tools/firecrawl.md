---
read_when:
    - Firecrawl destekli web çıkarımı istiyorsunuz
    - Bir Firecrawl API anahtarına ihtiyacınız var
    - Firecrawl'ı web_search sağlayıcısı olarak istiyorsunuz
    - web_fetch için bot karşıtı ayıklama istiyorsunuz
summary: Firecrawl arama, kazıma ve web_fetch yedeği
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T09:08:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw, **Firecrawl**'ı üç şekilde kullanabilir:

- `web_search` sağlayıcısı olarak
- açık Plugin araçları olarak: `firecrawl_search` ve `firecrawl_scrape`
- `web_fetch` için yedek ayıklayıcı olarak

Bot aşma ve önbelleğe alma desteği sunan, barındırılan bir ayıklama/arama hizmetidir;
bu da JS ağırlıklı sitelerde veya düz HTTP getirmelerini engelleyen sayfalarda yardımcı olur.

## API anahtarı alın

1. Bir Firecrawl hesabı oluşturun ve bir API anahtarı üretin.
2. Bunu yapılandırmada saklayın veya Gateway ortamında `FIRECRAWL_API_KEY` ayarlayın.

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

- Onboarding sırasında veya `openclaw configure --section web` ile Firecrawl seçmek, birlikte gelen Firecrawl Plugin'ini otomatik olarak etkinleştirir.
- Firecrawl ile `web_search`, `query` ve `count` destekler.
- `sources`, `categories` veya sonuç kazıma gibi Firecrawl'a özgü denetimler için `firecrawl_search` kullanın.
- `baseUrl`, varsayılan olarak `https://api.firecrawl.dev` adresindeki barındırılan Firecrawl'a ayarlanır. Kendi kendine barındırılan geçersiz kılmalara yalnızca özel/dahili uç noktalar için izin verilir; HTTP yalnızca bu özel hedefler için kabul edilir.
- `FIRECRAWL_BASE_URL`, Firecrawl arama ve kazıma temel URL'leri için paylaşılan ortam yedeğidir.

## Firecrawl kazıma + web_fetch yedeğini yapılandırın

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

- Firecrawl yedek denemeleri yalnızca bir API anahtarı kullanılabilir olduğunda çalışır (`plugins.entries.firecrawl.config.webFetch.apiKey` veya `FIRECRAWL_API_KEY`).
- `maxAgeMs`, önbelleğe alınmış sonuçların ne kadar eski olabileceğini denetler (ms). Varsayılan değer 2 gündür.
- Eski `tools.web.fetch.firecrawl.*` yapılandırması `openclaw doctor --fix` tarafından otomatik olarak geçirilir.
- Firecrawl kazıma/temel URL geçersiz kılmaları, aramayla aynı barındırılan/özel kuralını izler: herkese açık barındırılan trafik `https://api.firecrawl.dev` kullanır; kendi kendine barındırılan geçersiz kılmalar özel/dahili uç noktalara çözümlenmelidir.
- `firecrawl_scrape`, belirgin özel, loopback, metadata ve HTTP(S) olmayan hedef URL'leri Firecrawl'a iletmeden önce reddeder; bu, açık Firecrawl kazıma çağrıları için `web_fetch` hedef güvenliği sözleşmesiyle eşleşir.

`firecrawl_scrape`, aynı `plugins.entries.firecrawl.config.webFetch.*` ayarlarını ve ortam değişkenlerini yeniden kullanır.

### Kendi kendine barındırılan Firecrawl

Firecrawl'ı kendiniz çalıştırdığınızda `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` veya `FIRECRAWL_BASE_URL`
ayarlayın. OpenClaw, `http://` öğesini yalnızca loopback,
özel ağ, `.local`, `.internal` veya `.localhost` hedefleri için kabul eder. Herkese açık özel
ana makineler reddedilir; böylece Firecrawl API anahtarları yanlışlıkla rastgele uç noktalara gönderilmez.

## Firecrawl Plugin araçları

### `firecrawl_search`

Genel `web_search` yerine Firecrawl'a özgü arama denetimleri istediğinizde bunu kullanın.

Temel parametreler:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Düz `web_fetch` zayıf kaldığında JS ağırlıklı veya bot korumalı sayfalar için bunu kullanın.

Temel parametreler:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Gizlilik / bot aşma

Firecrawl, bot aşma için bir **proxy modu** parametresi sunar (`basic`, `stealth` veya `auto`).
OpenClaw, Firecrawl istekleri için her zaman `proxy: "auto"` ve `storeInCache: true` kullanır.
Proxy atlanırsa Firecrawl varsayılan olarak `auto` kullanır. `auto`, temel deneme başarısız olursa stealth proxy'lerle yeniden dener; bu, yalnızca temel kazımaya göre daha fazla kredi kullanabilir.

## `web_fetch` Firecrawl'ı nasıl kullanır

`web_fetch` ayıklama sırası:

1. Readability (yerel)
2. Firecrawl (seçilmişse veya etkin web-fetch yedeği olarak otomatik algılandıysa)
3. Temel HTML temizliği (son yedek)

Seçim düğmesi `tools.web.fetch.provider` değeridir. Bunu atlarsanız OpenClaw,
mevcut kimlik bilgilerinden ilk hazır web-fetch sağlayıcısını otomatik algılar.
Bugün birlikte gelen sağlayıcı Firecrawl'dır.

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Web Fetch](/tr/tools/web-fetch) -- Firecrawl yedeğiyle web_fetch aracı
- [Tavily](/tr/tools/tavily) -- arama + ayıklama araçları
