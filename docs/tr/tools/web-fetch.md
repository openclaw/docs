---
read_when:
    - Bir URL'yi getirip okunabilir içeriği ayıklamak istiyorsunuz
    - web_fetch veya Firecrawl yedeğini yapılandırmanız gerekir
    - web_fetch sınırlarını ve önbelleğe almayı anlamak istiyorsunuz
sidebarTitle: Web Fetch
summary: web_fetch aracı -- okunabilir içerik çıkarma ile HTTP getirme
title: Web getirme
x-i18n:
    generated_at: "2026-05-02T09:09:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: f455da77c20049f0ed0246fa53e9f49d3cf2004e65bd64a0bf871861c6e93229
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` aracı düz bir HTTP GET isteği yapar ve okunabilir içeriği çıkarır
(HTML'den markdown'a veya metne). JavaScript **çalıştırmaz**.

JS ağırlıklı siteler veya oturum açma korumalı sayfalar için bunun yerine
[Web Browser](/tr/tools/browser) kullanın.

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
Ana içerik çıkarımından sonraki çıktı biçimi.
</ParamField>

<ParamField path="maxChars" type="number">
Çıktıyı bu kadar karakterle sınırla.
</ParamField>

## Nasıl çalışır?

<Steps>
  <Step title="Getir">
    Chrome benzeri bir User-Agent ve `Accept-Language`
    başlığıyla HTTP GET gönderir. Özel/dahili ana makine adlarını engeller ve yönlendirmeleri yeniden denetler.
  </Step>
  <Step title="Çıkar">
    HTML yanıtı üzerinde Readability (ana içerik çıkarımı) çalıştırır.
  </Step>
  <Step title="Geri dönüş (isteğe bağlı)">
    Readability başarısız olursa ve Firecrawl yapılandırılmışsa, bot engellerini aşma moduyla
    Firecrawl API üzerinden yeniden dener.
  </Step>
  <Step title="Önbellek">
    Aynı URL'nin tekrar tekrar getirilmesini azaltmak için sonuçlar 15 dakika
    (yapılandırılabilir) boyunca önbelleğe alınır.
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

## Firecrawl geri dönüşü

Readability çıkarımı başarısız olursa, `web_fetch` bot engellerini aşma ve daha iyi çıkarım için
[Firecrawl](/tr/tools/firecrawl) aracına geri dönebilir:

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
  `FIRECRAWL_API_KEY` env geri dönüşü yoksa, gateway başlangıcı hızlıca başarısız olur.
</Note>

<Note>
  Firecrawl `baseUrl` geçersiz kılmaları sıkı şekilde sınırlandırılmıştır: barındırılan trafik
  `https://api.firecrawl.dev` kullanır; self-hosted geçersiz kılmalar özel veya
  dahili uç noktalara yönelmelidir ve `http://` yalnızca bu özel hedefler için kabul edilir.
</Note>

Geçerli runtime davranışı:

- `tools.web.fetch.provider`, fetch geri dönüş sağlayıcısını açıkça seçer.
- `provider` atlanırsa OpenClaw, mevcut kimlik bilgilerinden ilk hazır web-fetch
  sağlayıcısını otomatik algılar. Sandbox dışındaki `web_fetch`, `contracts.webFetchProviders` bildiren ve runtime'da
  eşleşen bir sağlayıcı kaydeden yüklü plugins kullanabilir. Bugün paketle gelen sağlayıcı Firecrawl'dır.
- Sandbox içindeki `web_fetch` çağrıları paketle gelen sağlayıcılarla sınırlı kalır.
- Readability devre dışıysa `web_fetch` doğrudan seçili
  sağlayıcı geri dönüşüne geçer. Kullanılabilir sağlayıcı yoksa kapalı şekilde başarısız olur.

## Sınırlar ve güvenlik

- `maxChars`, `tools.web.fetch.maxCharsCap` değerine sabitlenir
- Yanıt gövdesi ayrıştırmadan önce `maxResponseBytes` ile sınırlandırılır; aşırı büyük
  yanıtlar bir uyarıyla kesilir
- Özel/dahili ana makine adları engellenir
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` ve
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`, güvenilir sahte IP proxy yığınları için dar kapsamlı isteğe bağlı etkinleştirmelerdir; proxy'niz
  bu sentetik aralıkların sahibi değilse ve kendi hedef politikasını uygulamıyorsa
  bunları ayarsız bırakın
- Yönlendirmeler denetlenir ve `maxRedirects` ile sınırlandırılır
- `web_fetch` en iyi çaba esasına göre çalışır -- bazı siteler [Web Browser](/tr/tools/browser) gerektirir

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

- [Web Search](/tr/tools/web) -- web'de birden çok sağlayıcıyla arama yapın
- [Web Browser](/tr/tools/browser) -- JS ağırlıklı siteler için tam tarayıcı otomasyonu
- [Firecrawl](/tr/tools/firecrawl) -- Firecrawl arama ve scrape araçları
