---
read_when:
    - Bir URL'yi getirip okunabilir içeriği çıkarmak istiyorsunuz
    - web_fetch veya Firecrawl yedek mekanizmasını yapılandırmanız gerekir
    - web_fetch sınırlarını ve önbelleğe almayı anlamak istiyorsunuz
sidebarTitle: Web Fetch
summary: web_fetch aracı -- okunabilir içerik çıkarımıyla HTTP getirme
title: Web'den getirme
x-i18n:
    generated_at: "2026-04-30T09:52:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` aracı düz bir HTTP GET yapar ve okunabilir içeriği çıkarır
(HTML'den markdown'a veya metne). JavaScript **çalıştırmaz**.

JS ağırlıklı siteler veya oturum açma korumalı sayfalar için bunun yerine
[Web Tarayıcısı](/tr/tools/browser) kullanın.

## Hızlı başlangıç

`web_fetch` **varsayılan olarak etkindir** -- yapılandırma gerekmez. Ajan bunu
hemen çağırabilir:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Araç parametreleri

<ParamField path="url" type="string" required>
Getirilecek URL. Yalnızca `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Ana içerik çıkarıldıktan sonraki çıktı biçimi.
</ParamField>

<ParamField path="maxChars" type="number">
Çıktıyı bu kadar karakterle sınırlandırır.
</ParamField>

## Nasıl çalışır

<Steps>
  <Step title="Fetch">
    Chrome benzeri bir User-Agent ve `Accept-Language` başlığıyla HTTP GET
    gönderir. Özel/dahili ana makine adlarını engeller ve yönlendirmeleri
    yeniden denetler.
  </Step>
  <Step title="Extract">
    HTML yanıtı üzerinde Readability'yi (ana içerik çıkarma) çalıştırır.
  </Step>
  <Step title="Fallback (optional)">
    Readability başarısız olursa ve Firecrawl yapılandırılmışsa, bot atlatma
    moduyla Firecrawl API üzerinden yeniden dener.
  </Step>
  <Step title="Cache">
    Aynı URL'nin yinelenen getirmelerini azaltmak için sonuçlar 15 dakika
    (yapılandırılabilir) önbelleğe alınır.
  </Step>
</Steps>

## Yapılandırma

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Firecrawl yedeği

Readability çıkarımı başarısız olursa, `web_fetch` bot atlatma ve daha iyi
çıkarım için [Firecrawl](/tr/tools/firecrawl) yedeğine geçebilir:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey`, SecretRef nesnelerini destekler.
Eski `tools.web.fetch.firecrawl.*` yapılandırması `openclaw doctor --fix` tarafından otomatik olarak taşınır.

<Note>
  Firecrawl etkinse ve SecretRef'i çözümlenmemişse ve `FIRECRAWL_API_KEY` env
  yedeği yoksa, Gateway başlatma hızlıca başarısız olur.
</Note>

<Note>
  Firecrawl `baseUrl` geçersiz kılmaları kısıtlanmıştır: `https://` ve resmi
  Firecrawl ana makinesini (`api.firecrawl.dev`) kullanmaları gerekir.
</Note>

Geçerli çalışma zamanı davranışı:

- `tools.web.fetch.provider`, getirme yedek sağlayıcısını açıkça seçer.
- `provider` atlanırsa, OpenClaw kullanılabilir kimlik bilgilerinden ilk hazır
  web getirme sağlayıcısını otomatik algılar. Bugün paketlenen sağlayıcı Firecrawl'dır.
- Readability devre dışı bırakılmışsa, `web_fetch` doğrudan seçili sağlayıcı
  yedeğine geçer. Kullanılabilir sağlayıcı yoksa güvenli biçimde başarısız olur.

## Sınırlar ve güvenlik

- `maxChars`, `tools.web.fetch.maxCharsCap` değerine sınırlandırılır
- Yanıt gövdesi ayrıştırmadan önce `maxResponseBytes` ile sınırlandırılır; aşırı büyük
  yanıtlar bir uyarıyla kesilir
- Özel/dahili ana makine adları engellenir
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` ve
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`, güvenilen sahte IP
  proxy yığınları için dar kapsamlı katılımlardır; proxy'niz bu sentetik aralıkların
  sahibi değilse ve kendi hedef politikasını uygulamıyorsa bunları ayarsız bırakın
- Yönlendirmeler denetlenir ve `maxRedirects` ile sınırlandırılır
- `web_fetch` en iyi çaba yaklaşımıyla çalışır -- bazı siteler [Web Tarayıcısı](/tr/tools/browser) gerektirir

## Araç profilleri

Araç profilleri veya izin listeleri kullanıyorsanız `web_fetch` ya da `group:web` ekleyin:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## İlgili

- [Web Arama](/tr/tools/web) -- birden fazla sağlayıcıyla web'de arama yapın
- [Web Tarayıcısı](/tr/tools/browser) -- JS ağırlıklı siteler için tam tarayıcı otomasyonu
- [Firecrawl](/tr/tools/firecrawl) -- Firecrawl arama ve kazıma araçları
