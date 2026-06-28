---
read_when:
    - Firecrawl destekli web çıkarımı istiyorsunuz
    - Anahtarsız Firecrawl web_fetch istiyorsunuz
    - Arama veya daha yüksek limitler için bir Firecrawl API anahtarına ihtiyacınız var
    - Firecrawl'ı bir web_search sağlayıcısı olarak istiyorsunuz
    - web_fetch için anti-bot çıkarımı istiyorsunuz
summary: Firecrawl arama, kazıma ve web_fetch geri dönüşü
title: Firecrawl
x-i18n:
    generated_at: "2026-06-28T01:22:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw, **Firecrawl**'ı üç şekilde kullanabilir:

- `web_search` sağlayıcısı olarak
- açık Plugin araçları olarak: `firecrawl_search` ve `firecrawl_scrape`
- `web_fetch` için geri dönüş çıkarıcısı olarak

Bot atlatma ve önbelleğe alma desteği sunan barındırılan bir çıkarma/arama hizmetidir;
bu da JS ağırlıklı sitelerde veya düz HTTP getirmelerini engelleyen sayfalarda yardımcı olur.

## Plugin'i yükleyin

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Anahtarsız web_fetch ve API anahtarları

Açıkça seçilen barındırılan Firecrawl `web_fetch` geri dönüşü, API anahtarı olmadan başlangıç
erişimini destekler. Daha yüksek limitlere ihtiyacınız olduğunda Gateway ortamına
`FIRECRAWL_API_KEY` ekleyin veya yapılandırın. Firecrawl `web_search` ve
`firecrawl_scrape` bir API anahtarı gerektirir.

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

- İlk kurulumda Firecrawl'ı seçmek veya `openclaw configure --section web` çalıştırmak, yüklü Firecrawl Plugin'ini otomatik olarak etkinleştirir.
- Firecrawl ile `web_search`, `query` ve `count` destekler.
- `sources`, `categories` veya sonuç kazıma gibi Firecrawl'a özgü denetimler için `firecrawl_search` kullanın.
- `baseUrl` varsayılan olarak `https://api.firecrawl.dev` adresindeki barındırılan Firecrawl'a ayarlanır. Kendi barındırdığınız geçersiz kılmalara yalnızca özel/dahili uç noktalar için izin verilir; HTTP yalnızca bu özel hedefler için kabul edilir.
- `FIRECRAWL_BASE_URL`, Firecrawl arama ve kazıma temel URL'leri için paylaşılan ortam geri dönüşüdür.

## Firecrawl web_fetch geri dönüşünü yapılandırın

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
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

- Açıkça seçilen Firecrawl `web_fetch` geri dönüşü API anahtarı olmadan çalışır. Yapılandırıldığında OpenClaw, daha yüksek limitler için `plugins.entries.firecrawl.config.webFetch.apiKey` veya `FIRECRAWL_API_KEY` gönderir.
- İlk kurulum sırasında Firecrawl'ı seçmek veya `openclaw configure --section web` çalıştırmak, Plugin'i etkinleştirir ve başka bir getirme sağlayıcısı zaten yapılandırılmamışsa `web_fetch` için Firecrawl'ı seçer.
- `firecrawl_scrape` bir API anahtarı gerektirir.
- `maxAgeMs`, önbelleğe alınmış sonuçların ne kadar eski olabileceğini denetler (ms). Varsayılan 2 gündür.
- Eski `tools.web.fetch.firecrawl.*` yapılandırması `openclaw doctor --fix` tarafından otomatik olarak taşınır.
- Firecrawl kazıma/temel URL geçersiz kılmaları aramayla aynı barındırılan/özel kuralını izler: herkese açık barındırılan trafik `https://api.firecrawl.dev` kullanır; kendi barındırdığınız geçersiz kılmalar özel/dahili uç noktalara çözümlenmelidir.
- `firecrawl_scrape`, açık Firecrawl kazıma çağrıları için `web_fetch` hedef güvenliği sözleşmesiyle eşleşecek şekilde, belirgin özel, loopback, metadata ve HTTP(S) dışı hedef URL'leri Firecrawl'a iletmeden önce reddeder.

`firecrawl_scrape`, gerekli API anahtarı dahil olmak üzere aynı `plugins.entries.firecrawl.config.webFetch.*` ayarlarını ve ortam değişkenlerini yeniden kullanır.

### Kendi barındırdığınız Firecrawl

Firecrawl'ı kendiniz çalıştırdığınızda `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` veya `FIRECRAWL_BASE_URL`
ayarlayın. OpenClaw, `http://` adreslerini yalnızca loopback, özel ağ,
`.local`, `.internal` veya `.localhost` hedefleri için kabul eder. Firecrawl API anahtarlarının yanlışlıkla
rastgele uç noktalara gönderilmemesi için herkese açık özel ana makineler
reddedilir.

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

Düz `web_fetch` zayıf kaldığında, JS ağırlıklı veya bot korumalı sayfalar için bunu kullanın.

Temel parametreler:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Gizlilik / bot atlatma

Firecrawl, bot atlatma için bir **proxy modu** parametresi sunar (`basic`, `stealth` veya `auto`).
OpenClaw, Firecrawl istekleri için her zaman `proxy: "auto"` ile birlikte `storeInCache: true` kullanır.
Proxy atlanırsa Firecrawl varsayılan olarak `auto` kullanır. `auto`, temel deneme başarısız olursa stealth proxy'lerle yeniden dener; bu, yalnızca basic kazımadan daha fazla kredi kullanabilir.

## `web_fetch` Firecrawl'ı nasıl kullanır

`web_fetch` çıkarma sırası:

1. Readability (yerel)
2. Firecrawl (seçildiğinde veya yapılandırılmış kimlik bilgilerinden otomatik algılandığında)
3. Temel HTML temizliği (son geri dönüş)

Seçim düğmesi `tools.web.fetch.provider` değeridir. Bunu atlarsanız OpenClaw,
mevcut kimlik bilgilerinden ilk hazır web-fetch sağlayıcısını otomatik algılar.
Resmi Firecrawl Plugin'i bu geri dönüşü sağlar.

## İlgili

- [Web Search genel bakış](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Web Fetch](/tr/tools/web-fetch) -- Firecrawl geri dönüşlü web_fetch aracı
- [Tavily](/tr/tools/tavily) -- arama + çıkarma araçları
