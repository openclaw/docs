---
read_when:
    - Bir URL’yi getirip okunabilir içerik çıkarmak istiyorsunuz
    - '`web_fetch` veya Firecrawl geri dönüşünü yapılandırmanız gerekiyor'
    - '`web_fetch` sınırlarını ve önbelleğini anlamak istiyorsunuz'
sidebarTitle: Web Fetch
summary: '`web_fetch` aracı -- okunabilir içerik çıkarımıyla HTTP getirme'
title: Web getirme
x-i18n:
    generated_at: "2026-04-24T09:38:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

`web_fetch` aracı düz bir HTTP GET yapar ve okunabilir içerik çıkarır
(HTML’den Markdown’a veya metne). JavaScript **çalıştırmaz**.

JS ağırlıklı siteler veya giriş korumalı sayfalar için bunun yerine
[Web Browser](/tr/tools/browser) kullanın.

## Hızlı başlangıç

`web_fetch` varsayılan olarak **etkindir** -- yapılandırma gerekmez. Ajan bunu
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
Çıktıyı bu karakter sayısında kes.
</ParamField>

## Nasıl çalışır

<Steps>
  <Step title="Getir">
    Chrome benzeri bir User-Agent ve `Accept-Language`
    üstbilgisi ile HTTP GET gönderir. Özel/dahili ana makine adlarını engeller ve yönlendirmeleri yeniden denetler.
  </Step>
  <Step title="Çıkar">
    HTML yanıtında Readability (ana içerik çıkarımı) çalıştırır.
  </Step>
  <Step title="Geri dönüş (isteğe bağlı)">
    Readability başarısız olursa ve Firecrawl yapılandırılmışsa,
    bot aşma moduyla Firecrawl API üzerinden yeniden dener.
  </Step>
  <Step title="Önbellek">
    Sonuçlar, aynı URL’nin tekrar tekrar
    getirilmesini azaltmak için 15 dakika boyunca önbelleğe alınır (yapılandırılabilir).
  </Step>
</Steps>

## Yapılandırma

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // varsayılan: true
        provider: "firecrawl", // isteğe bağlı; otomatik algılama için atlayın
        maxChars: 50000, // maksimum çıktı karakteri
        maxCharsCap: 50000, // maxChars parametresi için katı üst sınır
        maxResponseBytes: 2000000, // kesmeden önce maksimum indirme boyutu
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // Readability çıkarımını kullan
        userAgent: "Mozilla/5.0 ...", // User-Agent geçersiz kılma
      },
    },
  },
}
```

## Firecrawl geri dönüşü

Readability çıkarımı başarısız olursa `web_fetch`,
bot aşma ve daha iyi çıkarım için [Firecrawl](/tr/tools/firecrawl) aracına geri dönebilir:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // isteğe bağlı; mevcut kimlik bilgilerinden otomatik algılama için atlayın
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // FIRECRAWL_API_KEY ayarlıysa isteğe bağlı
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // önbellek süresi (1 gün)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey`, SecretRef nesnelerini destekler.
Eski `tools.web.fetch.firecrawl.*` yapılandırması, `openclaw doctor --fix` tarafından otomatik taşınır.

<Note>
  Firecrawl etkinse ve SecretRef çözümlenmemişse, ayrıca
  `FIRECRAWL_API_KEY` ortam değişkeni geri dönüşü de yoksa, gateway başlangıcı hızlıca başarısız olur.
</Note>

<Note>
  Firecrawl `baseUrl` geçersiz kılmaları kilitlidir: `https://` kullanmaları ve
  resmi Firecrawl ana makinesini (`api.firecrawl.dev`) hedeflemeleri gerekir.
</Note>

Geçerli çalışma zamanı davranışı:

- `tools.web.fetch.provider`, getirme geri dönüş sağlayıcısını açıkça seçer.
- `provider` atlanırsa, OpenClaw mevcut kimlik bilgilerinden ilk hazır `web_fetch`
  sağlayıcısını otomatik algılar. Bugün paketli sağlayıcı Firecrawl’dur.
- Readability devre dışıysa `web_fetch` doğrudan seçili
  sağlayıcı geri dönüşüne geçer. Kullanılabilir sağlayıcı yoksa kapalı biçimde başarısız olur.

## Sınırlar ve güvenlik

- `maxChars`, `tools.web.fetch.maxCharsCap` değerine sıkıştırılır
- Yanıt gövdesi ayrıştırmadan önce `maxResponseBytes` ile sınırlandırılır; aşırı büyük
  yanıtlar bir uyarıyla kesilir
- Özel/dahili ana makine adları engellenir
- Yönlendirmeler denetlenir ve `maxRedirects` ile sınırlandırılır
- `web_fetch` en iyi çaba esaslıdır -- bazı siteler [Web Browser](/tr/tools/browser) gerektirir

## Araç profilleri

Araç profilleri veya izin listeleri kullanıyorsanız `web_fetch` veya `group:web` ekleyin:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // veya: allow: ["group:web"]  (web_fetch, web_search ve x_search içerir)
  },
}
```

## İlgili

- [Web Search](/tr/tools/web) -- web’de birden çok sağlayıcıyla arama yapın
- [Web Browser](/tr/tools/browser) -- JS ağırlıklı siteler için tam tarayıcı otomasyonu
- [Firecrawl](/tr/tools/firecrawl) -- Firecrawl arama ve kazıma araçları
