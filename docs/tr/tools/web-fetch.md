---
read_when:
    - Bir URL'yi getirip okunabilir içeriği çıkarmak istiyorsunuz
    - web_fetch'i veya onun Firecrawl yedeğini yapılandırmanız gerekir
    - web_fetch sınırlarını ve önbelleğe almayı anlamak istiyorsunuz
sidebarTitle: Web Fetch
summary: web_fetch aracı -- okunabilir içerik çıkarımıyla HTTP getirme
title: Web'den getirme
x-i18n:
    generated_at: "2026-05-04T07:10:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8c3efbf4a640b2fd69cc9532dcb06a873a6830a2e8a85ab7510ab38207c8670
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` aracı düz bir HTTP GET yapar ve okunabilir içeriği çıkarır
(HTML'den markdown'a veya metne). JavaScript'i **çalıştırmaz**.

JS ağırlıklı siteler veya oturum açma korumalı sayfalar için bunun yerine
[Web Tarayıcı](/tr/tools/browser) kullanın.

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
Ana içerik çıkarımından sonraki çıktı biçimi.
</ParamField>

<ParamField path="maxChars" type="number">
Çıktıyı bu kadar karakterle sınırlandırır.
</ParamField>

## Nasıl çalışır?

<Steps>
  <Step title="Fetch">
    Chrome benzeri bir User-Agent ve `Accept-Language` üst bilgisiyle HTTP GET
    gönderir. Özel/dahili ana makine adlarını engeller ve yönlendirmeleri yeniden denetler.
  </Step>
  <Step title="Extract">
    HTML yanıtı üzerinde Readability (ana içerik çıkarımı) çalıştırır.
  </Step>
  <Step title="Fallback (optional)">
    Readability başarısız olursa ve Firecrawl yapılandırılmışsa, bot atlatma
    moduyla Firecrawl API üzerinden yeniden dener.
  </Step>
  <Step title="Cache">
    Aynı URL'nin tekrar tekrar getirilmesini azaltmak için sonuçlar 15 dakika
    boyunca önbelleğe alınır (yapılandırılabilir).
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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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

Readability çıkarımı başarısız olursa `web_fetch`, bot atlatma ve daha iyi
çıkarım için [Firecrawl](/tr/tools/firecrawl) kullanımına geri dönebilir:

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
  Firecrawl etkinse ve SecretRef'i çözümlenmemişse, ayrıca
  `FIRECRAWL_API_KEY` env yedeği yoksa, gateway başlangıcı hızlıca başarısız olur.
</Note>

<Note>
  Firecrawl `baseUrl` geçersiz kılmaları sıkı şekilde kısıtlanır: barındırılan trafik
  `https://api.firecrawl.dev` kullanır; self-hosted geçersiz kılmalar özel veya
  dahili uç noktaları hedeflemelidir ve `http://` yalnızca bu özel hedefler için kabul edilir.
</Note>

Geçerli çalışma zamanı davranışı:

- `tools.web.fetch.provider`, getirme yedek sağlayıcısını açıkça seçer.
- `provider` atlanırsa OpenClaw, kullanılabilir kimlik bilgilerinden ilk hazır web-fetch
  sağlayıcısını otomatik olarak algılar. Sandbox dışı `web_fetch`, `contracts.webFetchProviders`
  bildiren ve çalışma zamanında eşleşen bir sağlayıcı kaydeden yüklü plugin'leri kullanabilir.
  Bugün paketle gelen sağlayıcı Firecrawl'dır.
- Sandbox içindeki `web_fetch` çağrıları paketle gelen sağlayıcılarla sınırlı kalır.
- Readability devre dışıysa `web_fetch`, doğrudan seçili sağlayıcı
  yedeğine geçer. Kullanılabilir sağlayıcı yoksa kapalı şekilde başarısız olur.

## Güvenilir Env Proxy

Dağıtımınız `web_fetch` işleminin güvenilir bir dışa giden HTTP(S) proxy
üzerinden geçmesini gerektiriyorsa `tools.web.fetch.useTrustedEnvProxy: true` ayarlayın.

Bu modda OpenClaw, isteği göndermeden önce ana makine adına dayalı SSRF denetimlerini
uygulamaya devam eder, ancak yerel DNS sabitlemesi yapmak yerine proxy'nin DNS'i çözmesine
izin verir. Bunu yalnızca proxy operatör denetimindeyse ve DNS çözümlemesinden sonra
dışa giden politikayı uyguluyorsa etkinleştirin.

<Note>
  Hiçbir HTTP(S) proxy env değişkeni yapılandırılmamışsa veya hedef ana makine
  `NO_PROXY` tarafından hariç tutulmuşsa, `web_fetch` yerel DNS sabitlemesiyle
  normal sıkı yola geri döner.
</Note>

## Sınırlar ve güvenlik

- `maxChars`, `tools.web.fetch.maxCharsCap` değerine sınırlandırılır
- Yanıt gövdesi ayrıştırmadan önce `maxResponseBytes` ile sınırlandırılır; çok büyük
  yanıtlar bir uyarıyla kesilir
- Özel/dahili ana makine adları engellenir
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` ve
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`, güvenilir sahte IP proxy
  yığınları için dar kapsamlı opt-in seçenekleridir; proxy'niz bu sentetik aralıklara sahip
  değilse ve kendi hedef politikasını uygulamıyorsa bunları ayarlamadan bırakın
- Yönlendirmeler denetlenir ve `maxRedirects` ile sınırlandırılır
- `useTrustedEnvProxy` açık bir opt-in seçeneğidir ve yalnızca DNS çözümlemesinden sonra
  dışa giden politikayı hâlâ uygulayan operatör denetimli proxy'ler için etkinleştirilmelidir
- `web_fetch` en iyi çaba yaklaşımıyla çalışır -- bazı siteler [Web Tarayıcı](/tr/tools/browser) gerektirir

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

- [Web Arama](/tr/tools/web) -- web'de birden çok sağlayıcıyla arama yapın
- [Web Tarayıcı](/tr/tools/browser) -- JS ağırlıklı siteler için tam tarayıcı otomasyonu
- [Firecrawl](/tr/tools/firecrawl) -- Firecrawl arama ve kazıma araçları
