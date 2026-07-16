---
read_when:
    - Firecrawl destekli web içeriği ayıklama istiyorsunuz
    - Anahtarsız Firecrawl Search (Ücretsiz) veya anahtarsız web_fetch istiyorsunuz
    - Arama veya daha yüksek limitler için bir Firecrawl API anahtarına ihtiyacınız var
    - web_search sağlayıcısı olarak Firecrawl kullanmak istiyorsunuz
    - web_fetch için bot karşıtı veri çıkarma istiyorsunuz
summary: Firecrawl arama, kazıma ve web_fetch yedek mekanizması
title: Firecrawl
x-i18n:
    generated_at: "2026-07-16T17:42:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw, **Firecrawl**'ı üç şekilde kullanabilir:

- `web_search` sağlayıcısı olarak
- açıkça belirtilen plugin araçları olarak: `firecrawl_search` ve `firecrawl_scrape`
- `web_fetch` için yedek çıkarıcı olarak

Bot engellerini aşmayı ve önbelleğe almayı destekleyen, barındırılan bir çıkarma/arama hizmetidir; bu özellikler, yoğun JavaScript kullanan sitelerde veya düz HTTP getirme isteklerini engelleyen sayfalarda yardımcı olur.

## Plugin'i yükleme

Resmî plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Anahtarsız erişim ve API anahtarları

Firecrawl iki `web_search` sağlayıcısı kaydeder:

- **Firecrawl Arama** (`firecrawl`) — anahtarınızla barındırılan `/v2/search` API'sini
  kullanır; bir anahtar mevcut olduğunda otomatik olarak algılanır.
- **Firecrawl Arama (Ücretsiz)** (`firecrawl-free`) — barındırılan anahtarsız başlangıç
  katmanını kullanır; API anahtarı gerekmez. Arama sorgularınızı Firecrawl'ın ücretsiz
  katmanına gönderdiği için **yalnızca açıkça etkinleştirildiğinde** kullanılır ve hiçbir zaman otomatik olarak seçilmez.

Açıkça seçilen Firecrawl `web_fetch` yedeği de anahtarsızdır. Açıkça kullanılan
`firecrawl_search` ve `firecrawl_scrape` araçları bir API anahtarı gerektirir. Daha yüksek
sınırlar için Gateway ortamına `FIRECRAWL_API_KEY` ekleyin veya bunu yapılandırın.

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

- İlk kurulumda veya `openclaw configure --section web` içinde Firecrawl'ı seçmek, yüklü Firecrawl plugin'ini otomatik olarak etkinleştirir.
- API anahtarı olmadan anahtarsız çalışmak için ilk kurulumda **Firecrawl Arama (Ücretsiz)** seçeneğini belirleyin (veya `provider: "firecrawl-free"` ayarlayın). Anahtarlı **Firecrawl Arama** sağlayıcısı `plugins.entries.firecrawl.config.webSearch.apiKey` veya `FIRECRAWL_API_KEY` gönderir.
- Firecrawl ile `web_search`, `query` ve `count` seçeneklerini destekler.
- `sources`, `categories` veya sonuç kazıma gibi Firecrawl'a özgü denetimler için `firecrawl_search` kullanın.
- `baseUrl`, varsayılan olarak `https://api.firecrawl.dev` adresindeki barındırılan Firecrawl'ı kullanır. Kendi sunucunuzda barındırmaya yönelik geçersiz kılmalara yalnızca özel/dahili uç noktalar için izin verilir; HTTP yalnızca bu özel hedefler için kabul edilir.
- `FIRECRAWL_BASE_URL`, Firecrawl arama ve kazıma temel URL'leri için paylaşılan ortam değişkeni yedeğidir.
- Firecrawl arama isteklerinin varsayılan zaman aşımı 30 saniyedir; `firecrawl_search` aracının `timeoutSeconds` parametresi, bunu her çağrı için geçersiz kılar.

## Firecrawl web_fetch yedeğini yapılandırma

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // açık seçim anahtarsız yedeği etkinleştirir
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
- İlk kurulum sırasında veya `openclaw configure --section web` içinde Firecrawl'ı seçmek, başka bir getirme sağlayıcısı zaten yapılandırılmamışsa plugin'i etkinleştirir ve `web_fetch` için Firecrawl'ı seçer.
- `firecrawl_scrape` bir API anahtarı gerektirir.
- `maxAgeMs`, önbelleğe alınmış sonuçların en fazla ne kadar eski olabileceğini (ms) denetler. Varsayılan değer 172.800.000 ms'dir (2 gün).
- `onlyMainContent` varsayılan olarak `true` değerini; `timeoutSeconds` ise varsayılan olarak 60 değerini kullanır.
- Eski `tools.web.fetch.firecrawl.*` ve `tools.web.search.firecrawl.*` yapılandırması, `openclaw doctor --fix` tarafından otomatik olarak taşınır.
- Firecrawl kazıma/temel URL geçersiz kılmaları, aramayla aynı barındırılan/özel kuralını izler: herkese açık barındırılan trafik `https://api.firecrawl.dev` kullanır; kendi sunucunuzda barındırmaya yönelik geçersiz kılmalar özel/dahili uç noktalara çözümlenmelidir.
- `firecrawl_scrape`, açık Firecrawl kazıma çağrıları için `web_fetch` hedef güvenliği sözleşmesiyle uyumlu olarak, bariz özel, geri döngü, meta veri ve HTTP(S) dışındaki hedef URL'leri Firecrawl'a iletmeden önce reddeder.

`firecrawl_scrape`, gerekli API anahtarı dâhil olmak üzere aynı `plugins.entries.firecrawl.config.webFetch.*` ayarlarını ve ortam değişkenlerini yeniden kullanır.

### Kendi sunucunuzda barındırılan Firecrawl

Firecrawl'ı kendiniz çalıştırdığınızda `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` veya `FIRECRAWL_BASE_URL` ayarlayın. OpenClaw, `http://` değerini yalnızca geri döngü, özel ağ, `.local`, `.internal` veya `.localhost` hedefleri için kabul eder. Firecrawl API anahtarlarının yanlışlıkla rastgele uç noktalara gönderilmemesi için herkese açık özel ana makineler reddedilir.

## Firecrawl plugin araçları

### `firecrawl_search`

Genel `web_search` yerine Firecrawl'a özgü arama denetimlerini kullanmak istediğinizde bunu kullanın. Bir API anahtarı gerektirir.

Parametreler:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (yalnızca ana makine adları; birbirini dışlar)
- `tbs` (zaman filtresi; örneğin `qdr:d`, `qdr:w`, `sbd:1`)
- `location` ve `country` (coğrafi hedefleme)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Düz `web_fetch` yönteminin yetersiz kaldığı, yoğun JavaScript kullanan veya bot korumalı sayfalar için bunu kullanın.

Parametreler:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Gizli mod / bot engellerini aşma

`firecrawl_scrape` ve `web_fetch` Firecrawl yedeği, çağıran taraf bu parametreleri geçersiz kılmadığı sürece varsayılan olarak `proxy: "auto"` ile birlikte `storeInCache: true` kullanır. `firecrawl_search` ve `web_search` Firecrawl sağlayıcısında `proxy`/`storeInCache` denetimleri yoktur; gizli proxy modu yalnızca kazıma/getirme isteklerine uygulanır.

Firecrawl'ın `proxy` modu, bot engellerinin nasıl aşılacağını denetler (`basic`, `stealth` veya `auto`). `auto`, temel bir deneme başarısız olursa gizli proxy'lerle yeniden dener; bu, yalnızca temel kazımaya kıyasla daha fazla kredi kullanabilir.

## `web_fetch`, Firecrawl'ı nasıl kullanır?

`web_fetch` çıkarma sırası:

1. Readability (yerel)
2. Firecrawl gibi yapılandırılmış getirme sağlayıcısı (seçildiğinde veya yapılandırılmış kimlik bilgilerinden otomatik olarak algılandığında)
3. Temel HTML temizleme (son yedek)

Seçim ayarı `tools.web.fetch.provider` şeklindedir. Bunu belirtmezseniz OpenClaw, mevcut kimlik bilgilerinden kullanıma hazır ilk web getirme sağlayıcısını otomatik olarak algılar. Resmî Firecrawl plugin'i bu yedeği sağlar.

## İlgili kaynaklar

- [Web Aramasına genel bakış](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Web Getirme](/tr/tools/web-fetch) -- Firecrawl yedeğine sahip web_fetch aracı
- [Tavily](/tr/tools/tavily) -- arama + çıkarma araçları
