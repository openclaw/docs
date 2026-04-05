---
read_when:
    - Bir URL'yi getirmek ve okunabilir içerik çıkarmak istiyorsunuz
    - web_fetch veya onun Firecrawl geri dönüşünü yapılandırmanız gerekiyor
    - web_fetch sınırlarını ve önbelleğini anlamak istiyorsunuz
sidebarTitle: Web Fetch
summary: web_fetch aracı -- okunabilir içerik çıkarma ile HTTP fetch
title: Web Fetch
x-i18n:
    generated_at: "2026-04-05T14:13:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60c933a25d0f4511dc1683985988e115b836244c5eac4c6667b67c8eb15401e0
    source_path: tools/web-fetch.md
    workflow: 15
---

# Web Fetch

`web_fetch` aracı düz bir HTTP GET isteği yapar ve okunabilir içerik çıkarır
(HTML'den markdown'a veya metne). JavaScript **çalıştırmaz**.

JS ağırlıklı siteler veya oturum açma korumalı sayfalar için bunun yerine
[Web Browser](/tools/browser) kullanın.

## Hızlı başlangıç

`web_fetch` **varsayılan olarak etkindir** -- yapılandırma gerekmez. Ajan bunu
hemen çağırabilir:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Araç parametreleri

| Parametre    | Tür      | Açıklama                                      |
| ------------ | -------- | --------------------------------------------- |
| `url`        | `string` | Getirilecek URL (zorunlu, yalnızca http/https) |
| `extractMode`| `string` | `"markdown"` (varsayılan) veya `"text"`       |
| `maxChars`   | `number` | Çıktıyı bu karakter sayısında kes             |

## Nasıl çalışır

<Steps>
  <Step title="Getir">
    Chrome benzeri bir User-Agent ve `Accept-Language`
    üstbilgisiyle bir HTTP GET isteği gönderir. Özel/dahili ana makine adlarını engeller ve yönlendirmeleri yeniden denetler.
  </Step>
  <Step title="Çıkar">
    HTML yanıtı üzerinde Readability'yi (ana içerik çıkarma) çalıştırır.
  </Step>
  <Step title="Geri dönüş (isteğe bağlı)">
    Readability başarısız olursa ve Firecrawl yapılandırılmışsa, bunu
    bot aşma moduyla Firecrawl API üzerinden yeniden dener.
  </Step>
  <Step title="Önbellek">
    Sonuçlar, aynı URL'nin tekrar tekrar
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
        provider: "firecrawl", // isteğe bağlı; otomatik algılama için belirtmeyin
        maxChars: 50000, // en fazla çıktı karakteri
        maxCharsCap: 50000, // maxChars parametresi için sabit üst sınır
        maxResponseBytes: 2000000, // kesmeden önce en fazla indirme boyutu
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // Readability çıkarımını kullan
        userAgent: "Mozilla/5.0 ...", // User-Agent'ı geçersiz kıl
      },
    },
  },
}
```

## Firecrawl geri dönüşü

Readability çıkarımı başarısız olursa, `web_fetch` bot aşma ve daha iyi çıkarım için
[Firecrawl](/tr/tools/firecrawl) seçeneğine geri dönebilir:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // isteğe bağlı; mevcut kimlik bilgilerinden otomatik algılama için belirtmeyin
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // FIRECRAWL_API_KEY ayarlanmışsa isteğe bağlı
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
Eski `tools.web.fetch.firecrawl.*` yapılandırması `openclaw doctor --fix` tarafından otomatik olarak taşınır.

<Note>
  Firecrawl etkinse ve SecretRef çözümlenmemişse, ayrıca
  `FIRECRAWL_API_KEY` env geri dönüşü de yoksa, gateway başlangıcı hızlıca başarısız olur.
</Note>

<Note>
  Firecrawl `baseUrl` geçersiz kılmaları kilitlidir: `https://` kullanmalı ve
  resmi Firecrawl ana makinesini (`api.firecrawl.dev`) hedeflemelidir.
</Note>

Geçerli çalışma zamanı davranışı:

- `tools.web.fetch.provider`, fetch geri dönüş sağlayıcısını açıkça seçer.
- `provider` belirtilmezse, OpenClaw mevcut kimlik bilgilerinden ilk hazır web-fetch
  sağlayıcısını otomatik algılar. Bugün paketlenmiş sağlayıcı Firecrawl'dur.
- Readability devre dışı bırakılırsa, `web_fetch` doğrudan seçili
  sağlayıcı geri dönüşüne geçer. Hiç sağlayıcı yoksa, kapalı şekilde başarısız olur.

## Sınırlar ve güvenlik

- `maxChars`, `tools.web.fetch.maxCharsCap` değerine sabitlenir
- Yanıt gövdesi, ayrıştırmadan önce `maxResponseBytes` ile sınırlandırılır; çok büyük
  yanıtlar bir uyarıyla kesilir
- Özel/dahili ana makine adları engellenir
- Yönlendirmeler denetlenir ve `maxRedirects` ile sınırlandırılır
- `web_fetch` best-effort çalışır -- bazı siteler [Web Browser](/tools/browser) gerektirir

## Araç profilleri

Araç profilleri veya allowlist kullanıyorsanız, `web_fetch` veya `group:web` ekleyin:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // veya: allow: ["group:web"]  (web_fetch, web_search ve x_search içerir)
  },
}
```

## İlgili

- [Web Search](/tools/web) -- birden çok sağlayıcıyla web'de arama yapın
- [Web Browser](/tools/browser) -- JS ağırlıklı siteler için tam tarayıcı otomasyonu
- [Firecrawl](/tr/tools/firecrawl) -- Firecrawl arama ve scrape araçları
