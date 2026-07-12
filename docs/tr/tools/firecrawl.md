---
read_when:
    - Firecrawl destekli web içeriği çıkarımı istiyorsunuz
    - Anahtarsız Firecrawl web_fetch istiyorsunuz
    - Arama veya daha yüksek limitler için bir Firecrawl API anahtarına ihtiyacınız var
    - Firecrawl'u bir web_search sağlayıcısı olarak kullanmak istiyorsunuz
    - web_fetch için bot karşıtı içerik çıkarma istiyorsunuz
summary: Firecrawl arama, kazıma ve web_fetch geri dönüşü
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T12:52:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw, **Firecrawl**'ı üç şekilde kullanabilir:

- `web_search` sağlayıcısı olarak
- açık Plugin araçları olarak: `firecrawl_search` ve `firecrawl_scrape`
- `web_fetch` için yedek ayıklayıcı olarak

Bot engellerini aşmayı ve önbelleğe almayı destekleyen, barındırılan bir ayıklama/arama hizmetidir; bu özellikler, yoğun JavaScript kullanan sitelerde veya doğrudan HTTP isteklerini engelleyen sayfalarda yardımcı olur.

## Plugin'i yükleme

Resmî Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Anahtarsız web_fetch ve API anahtarları

Açıkça seçilen, barındırılan Firecrawl `web_fetch` yedeği, API anahtarı olmadan başlangıç düzeyinde erişimi destekler. Daha yüksek sınırlara ihtiyaç duyduğunuzda Gateway ortamına `FIRECRAWL_API_KEY` ekleyin veya yapılandırın. Firecrawl `web_search` ve `firecrawl_scrape` için API anahtarı gerekir.

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

- İlk kurulumda veya `openclaw configure --section web` içinde Firecrawl'ı seçmek, yüklü Firecrawl Plugin'ini otomatik olarak etkinleştirir.
- Firecrawl ile `web_search`, `query` ve `count` parametrelerini destekler.
- `sources`, `categories` veya sonuç kazıma gibi Firecrawl'a özgü denetimler için `firecrawl_search` kullanın.
- `baseUrl`, varsayılan olarak `https://api.firecrawl.dev` adresindeki barındırılan Firecrawl'ı kullanır. Kendi barındırdığınız adres geçersiz kılmalarına yalnızca özel/dahili uç noktalar için izin verilir; HTTP yalnızca bu özel hedefler için kabul edilir.
- `FIRECRAWL_BASE_URL`, Firecrawl arama ve kazıma temel URL'leri için paylaşılan ortam değişkeni yedeğidir.
- Firecrawl arama isteklerinin varsayılan zaman aşımı 30 saniyedir; `firecrawl_search` aracının `timeoutSeconds` parametresi bunu her çağrı için geçersiz kılar.

## Firecrawl web_fetch yedeğini yapılandırma

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // açıkça seçilmesi anahtarsız yedeği etkinleştirir
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- Açıkça seçilen Firecrawl `web_fetch` yedeği, API anahtarı olmadan çalışır. Yapılandırıldığında OpenClaw, daha yüksek sınırlar için `plugins.entries.firecrawl.config.webFetch.apiKey` veya `FIRECRAWL_API_KEY` gönderir.
- İlk kurulum sırasında veya `openclaw configure --section web` içinde Firecrawl'ı seçmek, başka bir getirme sağlayıcısı zaten yapılandırılmamışsa Plugin'i etkinleştirir ve `web_fetch` için Firecrawl'ı seçer.
- `firecrawl_scrape` için API anahtarı gerekir.
- `maxAgeMs`, önbelleğe alınmış sonuçların ne kadar eski olabileceğini (ms) denetler. Varsayılan değer 172.800.000 ms'dir (2 gün).
- `onlyMainContent` varsayılan olarak `true`, `timeoutSeconds` ise varsayılan olarak 60'tır.
- Eski `tools.web.fetch.firecrawl.*` ve `tools.web.search.firecrawl.*` yapılandırması, `openclaw doctor --fix` tarafından otomatik olarak taşınır.
- Firecrawl kazıma/temel URL geçersiz kılmaları, aramayla aynı barındırılan/özel kuralını izler: herkese açık barındırılan trafik `https://api.firecrawl.dev` adresini kullanır; kendi barındırdığınız geçersiz kılmalar özel/dahili uç noktalara çözümlenmelidir.
- `firecrawl_scrape`, açık Firecrawl kazıma çağrıları için `web_fetch` hedef güvenliği sözleşmesine uygun şekilde, bariz özel, local loopback, meta veri ve HTTP(S) dışı hedef URL'lerini Firecrawl'a iletmeden önce reddeder.

`firecrawl_scrape`, gerekli API anahtarı dâhil olmak üzere aynı `plugins.entries.firecrawl.config.webFetch.*` ayarlarını ve ortam değişkenlerini yeniden kullanır.

### Kendi barındırdığınız Firecrawl

Firecrawl'ı kendiniz çalıştırdığınızda `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` veya `FIRECRAWL_BASE_URL` ayarlayın. OpenClaw, `http://` kullanımını yalnızca local loopback, özel ağ, `.local`, `.internal` veya `.localhost` hedefleri için kabul eder. Firecrawl API anahtarlarının yanlışlıkla herhangi bir uç noktaya gönderilmesini önlemek için herkese açık özel sunucular reddedilir.

## Firecrawl Plugin araçları

### `firecrawl_search`

Genel `web_search` yerine Firecrawl'a özgü arama denetimlerini istediğinizde bunu kullanın.

Parametreler:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Doğrudan `web_fetch` işleminin yetersiz kaldığı, yoğun JavaScript kullanan veya bot korumalı sayfalar için bunu kullanın.

Parametreler:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Gizli çalışma / bot engellerini aşma

Çağıran taraf bu parametreleri geçersiz kılmadığı sürece `firecrawl_scrape` ve `web_fetch` Firecrawl yedeği varsayılan olarak `proxy: "auto"` ile `storeInCache: true` kullanır. `firecrawl_search` ve `web_search` Firecrawl sağlayıcısında `proxy`/`storeInCache` denetimleri yoktur; gizli proxy modu yalnızca kazıma/getirme istekleri için geçerlidir.

Firecrawl'ın `proxy` modu, bot engellerinin nasıl aşılacağını denetler (`basic`, `stealth` veya `auto`). `auto`, temel deneme başarısız olursa gizli proxy'lerle yeniden dener; bu, yalnızca temel kazımaya göre daha fazla kredi kullanabilir.

## `web_fetch`, Firecrawl'ı nasıl kullanır?

`web_fetch` ayıklama sırası:

1. Okunabilirlik (yerel)
2. Firecrawl gibi yapılandırılmış getirme sağlayıcısı (seçildiğinde veya yapılandırılmış kimlik bilgilerinden otomatik olarak algılandığında)
3. Temel HTML temizleme (son yedek)

Seçim ayarı `tools.web.fetch.provider` şeklindedir. Bunu belirtmezseniz OpenClaw, mevcut kimlik bilgilerine göre hazır durumdaki ilk web getirme sağlayıcısını otomatik olarak algılar. Resmî Firecrawl Plugin'i bu yedeği sağlar.

## İlgili konular

- [Web Aramasına genel bakış](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Web Getirme](/tr/tools/web-fetch) -- Firecrawl yedeğine sahip web_fetch aracı
- [Tavily](/tr/tools/tavily) -- arama ve ayıklama araçları
