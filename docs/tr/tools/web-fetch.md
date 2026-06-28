---
read_when:
    - Bir URL’yi alıp okunabilir içeriği çıkarmak istiyorsunuz
    - web_fetch'i veya Firecrawl yedek mekanizmasını yapılandırmanız gerekir
    - web_fetch sınırlarını ve önbelleğe almayı anlamak istiyorsunuz
sidebarTitle: Web Fetch
summary: web_fetch aracı -- okunabilir içerik çıkarımıyla HTTP getirme
title: Web'den getirme
x-i18n:
    generated_at: "2026-06-28T01:27:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` aracı düz bir HTTP GET yapar ve okunabilir içeriği çıkarır
(HTML'den markdown veya metne). JavaScript'i **çalıştırmaz**.

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
Ana içerik çıkarma işleminden sonraki çıktı biçimi.
</ParamField>

<ParamField path="maxChars" type="number">
Çıktıyı bu kadar karakterle sınırla.
</ParamField>

## Nasıl çalışır?

<Steps>
  <Step title="Fetch">
    Chrome benzeri bir User-Agent ve `Accept-Language` başlığıyla HTTP GET
    gönderir. Özel/dahili ana makine adlarını engeller ve yönlendirmeleri
    yeniden denetler.
  </Step>
  <Step title="Extract">
    HTML yanıtında Readability'yi (ana içerik çıkarma) çalıştırır.
  </Step>
  <Step title="Fallback (optional)">
    Readability başarısız olursa ve Firecrawl seçiliyse, bot engellerini aşma
    moduyla Firecrawl API üzerinden yeniden dener.
  </Step>
  <Step title="Cache">
    Aynı URL'nin tekrar tekrar getirilmesini azaltmak için sonuçlar 15 dakika
    boyunca önbelleğe alınır (yapılandırılabilir).
  </Step>
</Steps>

## İlerleme güncellemeleri

`web_fetch`, yalnızca getirme işlemi beş saniye sonra hâlâ beklemedeyse herkese
açık bir ilerleme satırı yayar:

```text
Fetching page content...
```

Hızlı önbellek isabetleri ve hızlı ağ yanıtları zamanlayıcı tetiklenmeden önce
tamamlanır, bu nedenle ilerleme satırı göstermezler. Çağrı iptal edilirse
zamanlayıcı temizlenir. Getirme işlemi sonunda tamamlandığında agent normal araç
sonucunu alır; ilerleme satırı yalnızca kanal UI durumudur ve hiçbir zaman
getirilen sayfa içeriğini içermez.

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

Readability çıkarma işlemi başarısız olursa `web_fetch`, bot engellerini aşma ve
daha iyi çıkarma için [Firecrawl](/tr/tools/firecrawl) kullanarak geri dönebilir:

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` isteğe bağlıdır ve SecretRef nesnelerini destekler.
Eski `tools.web.fetch.firecrawl.*` yapılandırması `openclaw doctor --fix` tarafından otomatik olarak geçirilir.

<Note>
  Bir Firecrawl API anahtarı SecretRef yapılandırırsanız ve `FIRECRAWL_API_KEY`
  env geri dönüşü olmadan çözümlenmemişse, Gateway başlatma hızlıca başarısız
  olur.
</Note>

<Note>
  Firecrawl `baseUrl` geçersiz kılmaları sıkı şekilde sınırlandırılmıştır:
  barındırılan trafik `https://api.firecrawl.dev` kullanır; self-hosted geçersiz
  kılmalar özel veya dahili uç noktaları hedeflemelidir ve `http://` yalnızca bu
  özel hedefler için kabul edilir.
</Note>

Geçerli runtime davranışı:

- `tools.web.fetch.provider`, getirme geri dönüş sağlayıcısını açıkça seçer.
- `provider` atlanırsa OpenClaw, yapılandırılmış kimlik bilgilerinden ilk hazır
  web-fetch sağlayıcısını otomatik algılar. Sandbox dışı `web_fetch`,
  `contracts.webFetchProviders` bildiren ve runtime sırasında eşleşen bir
  sağlayıcı kaydeden yüklü plugin'leri kullanabilir. Resmi Firecrawl plugin'i bu
  geri dönüşü sağlar.
- Sandbox içindeki `web_fetch` çağrıları, paketlenmiş sağlayıcılara ek olarak
  resmi npm veya ClawHub kökeni doğrulanmış yüklü sağlayıcılara izin verir.
  Bugün bu, resmi Firecrawl plugin'ine izin verir; üçüncü taraf harici getirme
  plugin'leri hariç tutulur.
- Readability devre dışıysa `web_fetch` doğrudan seçili sağlayıcı geri dönüşüne
  geçer. Kullanılabilir sağlayıcı yoksa kapalı şekilde başarısız olur.

## Güvenilen env proxy

Dağıtımınız `web_fetch` işleminin güvenilen bir giden HTTP(S) proxy üzerinden
geçmesini gerektiriyorsa `tools.web.fetch.useTrustedEnvProxy: true` ayarlayın.

Bu modda OpenClaw, isteği göndermeden önce ana makine adına dayalı SSRF
denetimlerini yine uygular, ancak yerel DNS pinning yapmak yerine proxy'nin DNS
çözümlemesine izin verir. Bunu yalnızca proxy operatör denetimindeyse ve DNS
çözümlemesinden sonra giden trafik ilkesini uyguluyorsa etkinleştirin.

<Note>
  HTTP(S) proxy env değişkeni yapılandırılmamışsa veya hedef ana makine
  `NO_PROXY` tarafından hariç tutulmuşsa `web_fetch`, yerel DNS pinning ile
  normal katı yola geri döner.
</Note>

## Sınırlar ve güvenlik

- `maxChars`, `tools.web.fetch.maxCharsCap` değerine sıkıştırılır
- Yanıt gövdesi ayrıştırmadan önce `maxResponseBytes` ile sınırlandırılır; aşırı
  büyük yanıtlar bir uyarıyla kesilir
- Özel/dahili ana makine adları engellenir
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` ve
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`, güvenilen sahte IP
  proxy yığınları için dar kapsamlı opt-in seçenekleridir; proxy'niz bu sentetik
  aralıkların sahibi değilse ve kendi hedef ilkesini uygulamıyorsa bunları
  ayarlamadan bırakın
- Yönlendirmeler denetlenir ve `maxRedirects` ile sınırlandırılır
- `useTrustedEnvProxy` açık bir opt-in seçeneğidir ve yalnızca DNS
  çözümlemesinden sonra da giden trafik ilkesini uygulayan, operatör denetimli
  proxy'ler için etkinleştirilmelidir
- `web_fetch` en iyi çaba temelinde çalışır -- bazı siteler [Web Tarayıcısı](/tr/tools/browser) gerektirir

## Araç profilleri

Araç profilleri veya izin listeleri kullanıyorsanız `web_fetch` ya da `group:web`
ekleyin:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## İlgili

- [Web Arama](/tr/tools/web) -- web'i birden fazla sağlayıcıyla arayın
- [Web Tarayıcısı](/tr/tools/browser) -- JS ağırlıklı siteler için tam tarayıcı otomasyonu
- [Firecrawl](/tr/tools/firecrawl) -- Firecrawl arama ve kazıma araçları
