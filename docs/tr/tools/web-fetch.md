---
read_when:
    - Bir URL'yi getirip okunabilir içeriği ayıklamak istiyorsunuz
    - web_fetch veya onun Firecrawl yedeğini yapılandırmanız gerekir
    - web_fetch sınırlarını ve önbelleğe almayı anlamak istiyorsunuz
sidebarTitle: Web Fetch
summary: web_fetch aracı -- okunabilir içerik çıkarma ile HTTP getirme
title: Web'den getirme
x-i18n:
    generated_at: "2026-05-06T18:01:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 337174898861db217bf0db052d8e8749989c295e89c73d9d5a6911f6335ba03d
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` aracı düz bir HTTP GET isteği yapar ve okunabilir içeriği çıkarır
(HTML'i markdown veya metne dönüştürür). JavaScript **çalıştırmaz**.

JS ağırlıklı siteler veya oturum açma korumalı sayfalar için bunun yerine
[Web Tarayıcısı](/tr/tools/browser) kullanın.

## Hızlı başlangıç

`web_fetch` **varsayılan olarak etkindir** -- yapılandırma gerekmez. Agent bunu
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

## Nasıl çalışır?

<Steps>
  <Step title="Fetch">
    Chrome benzeri bir User-Agent ve `Accept-Language` başlığıyla bir HTTP GET
    gönderir. Özel/iç ana makine adlarını engeller ve yönlendirmeleri yeniden denetler.
  </Step>
  <Step title="Extract">
    HTML yanıtı üzerinde Readability (ana içerik çıkarma) çalıştırır.
  </Step>
  <Step title="Fallback (optional)">
    Readability başarısız olursa ve Firecrawl yapılandırılmışsa, bot atlatma
    moduyla Firecrawl API üzerinden yeniden dener.
  </Step>
  <Step title="Cache">
    Aynı URL'nin tekrar tekrar getirilmesini azaltmak için sonuçlar 15 dakika
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

## Firecrawl geri dönüşü

Readability çıkarımı başarısız olursa, `web_fetch` bot atlatma ve daha iyi
çıkarım için [Firecrawl](/tr/tools/firecrawl) ile geri dönüş yapabilir:

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

`plugins.entries.firecrawl.config.webFetch.apiKey` SecretRef nesnelerini destekler.
Eski `tools.web.fetch.firecrawl.*` yapılandırması `openclaw doctor --fix` tarafından otomatik olarak geçirilir.

<Note>
  Firecrawl etkinse ve SecretRef'i çözülmemişse, ayrıca `FIRECRAWL_API_KEY`
  env geri dönüşü yoksa Gateway başlangıcı hızlı şekilde başarısız olur.
</Note>

<Note>
  Firecrawl `baseUrl` geçersiz kılmaları sıkı şekilde sınırlandırılmıştır:
  barındırılan trafik `https://api.firecrawl.dev` kullanır; kendi barındırılan
  geçersiz kılmalar özel veya iç uç noktaları hedeflemelidir ve `http://`
  yalnızca bu özel hedefler için kabul edilir.
</Note>

Geçerli çalışma zamanı davranışı:

- `tools.web.fetch.provider`, getirme geri dönüş sağlayıcısını açıkça seçer.
- `provider` atlanırsa OpenClaw, kullanılabilir kimlik bilgilerinden hazır ilk
  web-getirme sağlayıcısını otomatik olarak algılar. Sandbox dışında çalışan
  `web_fetch`, `contracts.webFetchProviders` bildiren ve çalışma zamanında eşleşen
  bir sağlayıcı kaydeden kurulu plugin'leri kullanabilir. Bugün paketle gelen
  sağlayıcı Firecrawl'dır.
- Sandbox içindeki `web_fetch` çağrıları paketle gelen sağlayıcılarla sınırlı kalır.
- Readability devre dışıysa `web_fetch` doğrudan seçili sağlayıcı geri dönüşüne
  geçer. Kullanılabilir sağlayıcı yoksa kapalı şekilde başarısız olur.

## Güvenilen env proxy

Dağıtımınız `web_fetch` aracının güvenilen bir dışa giden HTTP(S) proxy üzerinden
gitmesini gerektiriyorsa `tools.web.fetch.useTrustedEnvProxy: true` ayarlayın.

Bu modda OpenClaw, isteği göndermeden önce ana makine adına dayalı SSRF
denetimlerini yine uygular; ancak yerel DNS sabitlemesi yapmak yerine proxy'nin
DNS çözmesine izin verir. Bunu yalnızca proxy operatör denetimindeyse ve DNS
çözümlemesinden sonra dışa giden politikayı uyguluyorsa etkinleştirin.

<Note>
  Hiçbir HTTP(S) proxy env değişkeni yapılandırılmamışsa veya hedef ana makine
  `NO_PROXY` tarafından hariç tutulmuşsa, `web_fetch` yerel DNS sabitlemesiyle
  normal katı yola geri döner.
</Note>

## Sınırlar ve güvenlik

- `maxChars`, `tools.web.fetch.maxCharsCap` değerine sabitlenir
- Yanıt gövdesi ayrıştırmadan önce `maxResponseBytes` ile sınırlandırılır; aşırı
  büyük yanıtlar bir uyarıyla kırpılır
- Özel/iç ana makine adları engellenir
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` ve
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`, güvenilen sahte IP
  proxy yığınları için dar kapsamlı açık katılımlardır; proxy'niz bu sentetik
  aralıklara sahip değilse ve kendi hedef politikasını uygulamıyorsa bunları
  ayarsız bırakın
- Yönlendirmeler denetlenir ve `maxRedirects` ile sınırlandırılır
- `useTrustedEnvProxy` açık bir katılımdır ve yalnızca DNS çözümlemesinden sonra
  dışa giden politikayı uygulamaya devam eden operatör denetimli proxy'ler için
  etkinleştirilmelidir
- `web_fetch` en iyi çaba esaslıdır -- bazı siteler [Web Tarayıcısı](/tr/tools/browser) gerektirir

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

- [Web Arama](/tr/tools/web) -- web'i birden çok sağlayıcıyla arayın
- [Web Tarayıcısı](/tr/tools/browser) -- JS ağırlıklı siteler için tam tarayıcı otomasyonu
- [Firecrawl](/tr/tools/firecrawl) -- Firecrawl arama ve kazıma araçları
