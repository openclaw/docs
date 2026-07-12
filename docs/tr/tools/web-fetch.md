---
read_when:
    - Bir URL'yi almak ve okunabilir içeriği ayıklamak istiyorsunuz
    - web_fetch veya onun Firecrawl geri dönüşünü yapılandırmanız gerekir
    - web_fetch sınırlarını ve önbelleğe almayı anlamak istiyorsunuz
sidebarTitle: Web Fetch
summary: web_fetch aracı -- okunabilir içerik ayıklama özellikli HTTP getirme işlemi
title: Web'den getirme
x-i18n:
    generated_at: "2026-07-12T12:55:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch`, basit bir HTTP GET isteği gerçekleştirir ve okunabilir içeriği çıkarır (HTML'yi
markdown veya metne dönüştürür). JavaScript'i **çalıştırmaz**. JS ağırlıklı siteler veya
oturum açma korumalı sayfalar için bunun yerine [Web Tarayıcısı](/tr/tools/browser) kullanın.

## Hızlı başlangıç

Varsayılan olarak etkindir, yapılandırma gerekmez:

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
Çıktıyı bu karakter sayısıyla sınırlandırır. `tools.web.fetch.maxCharsCap` değerine göre kısıtlanır.
</ParamField>

## Nasıl çalışır?

<Steps>
  <Step title="Getirme">
    Chrome benzeri bir User-Agent ve `Accept-Language` üstbilgisiyle HTTP GET
    isteği gönderir. Özel/dahili ana bilgisayar adlarını engeller ve yönlendirmeleri yeniden denetler.
  </Step>
  <Step title="Çıkarma">
    HTML yanıtında Readability'yi (ana içerik çıkarma) çalıştırır.
  </Step>
  <Step title="Geri dönüş (isteğe bağlı)">
    Readability başarısız olursa ve bir getirme sağlayıcısı kullanılabiliyorsa
    bu sağlayıcı üzerinden yeniden dener (örneğin Firecrawl'ın bot engellerini aşma modu).
  </Step>
  <Step title="Önbellek">
    Aynı URL'nin tekrar tekrar getirilmesini azaltmak için sonuçlar 15 dakika
    boyunca önbelleğe alınır (yapılandırılabilir).
  </Step>
</Steps>

## İlerleme güncellemeleri

`web_fetch`, yalnızca getirme işlemi beş saniye sonra hâlâ beklemedeyse herkese açık bir ilerleme satırı
yayınlar:

```text
Sayfa içeriği getiriliyor...
```

Hızlı önbellek isabetleri ve hızlı ağ yanıtları, zamanlayıcı tetiklenmeden önce tamamlandığından
hiçbir zaman ilerleme satırı göstermez. Çağrının iptal edilmesi zamanlayıcıyı temizler. İlerleme
satırı yalnızca kanal kullanıcı arayüzü durumudur ve getirilen sayfa içeriğini hiçbir zaman içermez.

## Yapılandırma

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // varsayılan: true
        provider: "firecrawl", // isteğe bağlı; otomatik algılama için atlayın
        maxChars: 20000, // varsayılan çıktı karakteri; maxCharsCap ile sınırlandırılır
        maxCharsCap: 20000, // maxChars parametresi için kesin üst sınır
        maxResponseBytes: 750000, // kırpmadan önceki azami indirme boyutu (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // güvenilir bir HTTP(S) ortam vekilinin DNS'i çözmesine izin ver
        readability: true, // Readability ile içerik çıkarma kullan
        userAgent: "Mozilla/5.0 ...", // User-Agent değerini geçersiz kıl
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // 198.18.0.0/15 kullanan güvenilir sahte IP vekilleri için açık onay
          allowIpv6UniqueLocalRange: true, // fc00::/7 kullanan güvenilir sahte IP vekilleri için açık onay
        },
      },
    },
  },
}
```

## Firecrawl geri dönüşü

Readability ile içerik çıkarma başarısız olursa `web_fetch`, bot engellerini aşmak ve daha iyi
içerik çıkarmak için [Firecrawl](/tr/tools/firecrawl) kullanabilir:

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
            // apiKey: "fc-...", // isteğe bağlı; anahtarsız başlangıç erişimi için atlayın
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // önbellek süresi (2 gün)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` isteğe bağlıdır ve SecretRef nesnelerini destekler.
Eski `tools.web.fetch.firecrawl.*` yapılandırması, `openclaw doctor --fix` aracılığıyla otomatik olarak
`plugins.entries.firecrawl.config.webFetch` konumuna taşınır.

<Note>
  Bir Firecrawl API anahtarı SecretRef'i yapılandırırsanız ve bu başvuru çözümlenemezse ve
  `FIRECRAWL_API_KEY` ortam değişkeni geri dönüşü de yoksa Gateway başlatma işlemi hızla başarısız olur.
</Note>

<Note>
  Firecrawl `baseUrl` geçersiz kılmaları sıkı biçimde kısıtlanır: barındırılan trafik
  `https://api.firecrawl.dev` adresini kullanır; kendi barındırdığınız geçersiz kılmalar özel veya
  dahili uç noktaları hedeflemelidir ve `http://` yalnızca bu özel hedefler için kabul edilir.
</Note>

Geçerli çalışma zamanı davranışı:

- `tools.web.fetch.provider`, getirme geri dönüşü sağlayıcısını açıkça seçer.
- `provider` belirtilmezse OpenClaw, yapılandırılmış kimlik bilgilerinden hazır olan ilk web getirme
  sağlayıcısını otomatik olarak algılar. Korumalı alanda çalışmayan `web_fetch`, `contracts.webFetchProviders`
  bildiren ve çalışma zamanında eşleşen bir sağlayıcı kaydeden yüklü Plugin'leri kullanabilir.
  Resmî Firecrawl Plugin'i şu anda bu geri dönüşü sağlar.
- Korumalı alandaki `web_fetch` çağrıları, paketle birlikte gelen sağlayıcılara ek olarak resmî npm
  veya ClawHub kökeni doğrulanmış yüklü sağlayıcılara izin verir. Şu anda bu, resmî Firecrawl
  Plugin'ine izin verir; üçüncü taraf haricî getirme Plugin'leri kapsam dışında kalır.
- Readability devre dışıysa `web_fetch`, doğrudan seçilen sağlayıcı geri dönüşüne geçer.
  Kullanılabilir sağlayıcı yoksa güvenli biçimde başarısız olur.

## Güvenilir ortam vekili

Dağıtımınız `web_fetch` işleminin güvenilir bir giden HTTP(S) vekili üzerinden yapılmasını
gerektiriyorsa `tools.web.fetch.useTrustedEnvProxy: true` değerini ayarlayın.

Bu modda OpenClaw, isteği göndermeden önce ana bilgisayar adına dayalı SSRF denetimlerini uygulamaya
devam eder ancak yerel DNS sabitlemesi yapmak yerine vekilin DNS'i çözmesine izin verir. Bunu yalnızca
vekil operatör tarafından denetleniyorsa ve DNS çözümlemesinden sonra giden trafik politikasını
uyguluyorsa etkinleştirin.

<Note>
  Herhangi bir HTTP(S) vekil ortam değişkeni yapılandırılmamışsa veya hedef ana bilgisayar
  `NO_PROXY` tarafından hariç tutuluyorsa `web_fetch`, yerel DNS sabitlemesi kullanan normal
  katı yola geri döner.
</Note>

## Sınırlar ve güvenlik

- `maxChars`, `tools.web.fetch.maxCharsCap` değerine göre kısıtlanır (varsayılan `20000`)
- Yanıt gövdesi ayrıştırılmadan önce `maxResponseBytes` ile sınırlandırılır (varsayılan `750000`,
  32000-10000000 aralığıyla kısıtlanır); aşırı büyük yanıtlar bir uyarıyla kırpılır
- Özel/dahili ana bilgisayar adları engellenir
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` ve
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`, güvenilir sahte IP vekil yığınları
  için dar kapsamlı açık onaylardır; vekiliniz bu sentetik aralıklara sahip değilse ve kendi
  hedef politikasını uygulamıyorsa bunları ayarlamayın
- Yönlendirmeler denetlenir ve `maxRedirects` ile sınırlandırılır (varsayılan `3`)
- `useTrustedEnvProxy` açık onay gerektirir ve yalnızca DNS çözümlemesinden sonra da giden trafik
  politikasını uygulayan, operatör denetimindeki vekiller için etkinleştirilmelidir
- `web_fetch` en iyi çabayı gösterir; bazı siteler [Web Tarayıcısı](/tr/tools/browser) gerektirir

## Araç profilleri

Araç profilleri veya izin listeleri kullanıyorsanız `web_fetch` ya da `group:web` ekleyin:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // veya: allow: ["group:web"]  (web_fetch, web_search ve x_search içerir)
  },
}
```

## İlgili

- [Web Araması](/tr/tools/web) -- birden çok sağlayıcıyla web'de arama yapın
- [Web Tarayıcısı](/tr/tools/browser) -- JS ağırlıklı siteler için tam tarayıcı otomasyonu
- [Firecrawl](/tr/tools/firecrawl) -- Firecrawl arama ve veri kazıma araçları
