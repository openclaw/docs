---
read_when:
    - Agent tarafından denetlenen tarayıcı otomasyonu ekleme
    - OpenClaw'ın kendi Chrome'unuza neden müdahale ettiğini hata ayıklama
    - macOS uygulamasında tarayıcı ayarlarını + yaşam döngüsünü uygulama
summary: Tümleşik tarayıcı denetim servisi + eylem komutları
title: Tarayıcı (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-04-24T09:33:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80805676213ef5195093163874a848955b3c25364b20045a8d759d03ac088e14
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw, agent'in denetlediği **özel bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir.
Bu profil kişisel tarayıcınızdan yalıtılmıştır ve
Gateway içindeki küçük bir yerel denetim servisi üzerinden yönetilir (yalnızca local loopback).

Başlangıç dostu bakış:

- Bunu **ayrı, yalnızca agent'e ait bir tarayıcı** gibi düşünün.
- `openclaw` profili kişisel tarayıcı profilinize **dokunmaz**.
- Agent, güvenli bir hatta **sekme açabilir, sayfaları okuyabilir, tıklayabilir ve yazabilir**.
- Yerleşik `user` profili, Chrome MCP üzerinden gerçek oturum açılmış Chrome oturumunuza bağlanır.

## Elde ettikleriniz

- Varsayılan olarak turuncu vurguya sahip, **openclaw** adlı ayrı bir tarayıcı profili.
- Deterministik sekme denetimi (listele/aç/odakla/kapat).
- Agent eylemleri (tıklama/yazma/sürükleme/seçme), anlık görüntüler, ekran görüntüleri, PDF'ler.
- İsteğe bağlı çoklu profil desteği (`openclaw`, `work`, `remote`, ...).

Bu tarayıcı günlük ana tarayıcınız **değildir**. Agent otomasyonu ve doğrulama için
güvenli, yalıtılmış bir yüzeydir.

## Hızlı başlangıç

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled” hatası alırsanız bunu yapılandırmada etkinleştirin (aşağıya bakın) ve
Gateway'i yeniden başlatın.

`openclaw browser` tamamen yoksa veya agent tarayıcı aracının
kullanılamadığını söylüyorsa [Missing browser command or tool](/tr/tools/browser#missing-browser-command-or-tool) bölümüne gidin.

## Plugin denetimi

Varsayılan `browser` aracı paketli bir plugin'dir. Aynı `browser` araç adını kaydeden başka bir plugin ile değiştirmek için bunu devre dışı bırakın:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Varsayılanların çalışması için hem `plugins.entries.browser.enabled` **hem de** `browser.enabled=true` gerekir. Yalnızca plugin'i devre dışı bırakmak, `openclaw browser` CLI'yi, `browser.request` Gateway yöntemini, agent aracını ve denetim servisini tek birim halinde kaldırır; `browser.*` yapılandırmanız yerine geçecek çözüm için olduğu gibi kalır.

Tarayıcı yapılandırma değişiklikleri, plugin'in servisini yeniden kaydedebilmesi için Gateway yeniden başlatması gerektirir.

## Eksik tarayıcı komutu veya aracı

Yükseltmeden sonra `openclaw browser` bilinmiyorsa, `browser.request` eksikse veya agent tarayıcı aracının kullanılamadığını bildiriyorsa olağan neden `browser` değerini içermeyen bir `plugins.allow` listesidir. Bunu ekleyin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` ve `tools.alsoAllow: ["browser"]` allowlist üyeliğinin yerini tutmaz — allowlist plugin yüklemeyi kapılar ve araç ilkesi ancak yüklemeden sonra çalışır. `plugins.allow` alanını tamamen kaldırmak da varsayılanı geri getirir.

## Profiller: `openclaw` ile `user`

- `openclaw`: yönetilen, yalıtılmış tarayıcı (extension gerekmez).
- `user`: gerçek **oturum açılmış Chrome**
  oturumunuz için yerleşik Chrome MCP bağlanma profili.

Agent tarayıcı araç çağrıları için:

- Varsayılan: yalıtılmış `openclaw` tarayıcısını kullanın.
- Mevcut oturum açılmış oturumlar önemliyse ve kullanıcı
  attach istemine tıklamak/onaylamak için bilgisayar başındaysa `profile="user"` tercih edin.
- Belirli bir tarayıcı modu istediğinizde `profile` açık geçersiz kılmadır.

Yönetilen modu varsayılan yapmak istiyorsanız `browser.defaultProfile: "openclaw"` ayarlayın.

## Yapılandırma

Tarayıcı ayarları `~/.openclaw/openclaw.json` içinde bulunur.

```json5
{
  browser: {
    enabled: true, // varsayılan: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // yalnızca güvenilir özel ağ erişimi için opt in
      // allowPrivateNetwork: true, // eski takma ad
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // eski tek profil geçersiz kılması
    remoteCdpTimeoutMs: 1500, // uzak CDP HTTP zaman aşımı (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // uzak CDP WebSocket handshake zaman aşımı (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Portlar ve erişilebilirlik">

- Denetim servisi, `gateway.port` değerinden türetilen bir portta local loopback'e bağlanır (varsayılan `18791` = gateway + 2). `gateway.port` veya `OPENCLAW_GATEWAY_PORT` değerini geçersiz kılmak, türetilmiş portları aynı aile içinde kaydırır.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar; bunları yalnızca uzak CDP için ayarlayın. `cdpUrl`, ayarlanmadığında yönetilen yerel CDP portuna varsayılan olur.
- `remoteCdpTimeoutMs`, uzak (local loopback olmayan) CDP HTTP erişilebilirlik denetimlerine uygulanır; `remoteCdpHandshakeTimeoutMs`, uzak CDP WebSocket handshake'lerine uygulanır.

</Accordion>

<Accordion title="SSRF ilkesi">

- Tarayıcı gezintisi ve sekme açma, gezinti öncesinde SSRF korumasından geçer ve ardından son `http(s)` URL üzerinde best-effort olarak yeniden kontrol edilir.
- Katı SSRF modunda uzak CDP uç noktası keşfi ve `/json/version` probe'ları (`cdpUrl`) da kontrol edilir.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak kapalıdır; yalnızca özel ağ tarayıcı erişimine bilerek güvenildiğinde etkinleştirin.
- `browser.ssrfPolicy.allowPrivateNetwork`, eski takma ad olarak desteklenmeye devam eder.

</Accordion>

<Accordion title="Profil davranışı">

- `attachOnly: true`, asla yerel tarayıcı başlatma anlamına gelir; yalnızca zaten çalışıyorsa bağlanır.
- `color` (üst düzey ve profil başına), hangi profilin etkin olduğunu görebilmeniz için tarayıcı arayüzünü renklendirir.
- Varsayılan profil `openclaw`'dır (yönetilen bağımsız). Oturum açılmış kullanıcı tarayıcısına dahil olmak için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: Chromium tabanlıysa sistem varsayılan tarayıcısı; aksi halde Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır. Bu sürücü için `cdpUrl` ayarlamayın.
- Mevcut bir oturum profili varsayılan olmayan bir Chromium kullanıcı profiline (Brave, Edge vb.) bağlanacaksa `browser.profiles.<name>.userDataDir` ayarlayın.

</Accordion>

</AccordionGroup>

## Brave kullanın (veya başka bir Chromium tabanlı tarayıcı)

**Sistem varsayılanı** tarayıcınız Chromium tabanlıysa (Chrome/Brave/Edge/vb.),
OpenClaw bunu otomatik olarak kullanır. Otomatik algılamayı geçersiz kılmak için `browser.executablePath` ayarlayın:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

Veya bunu platforma göre yapılandırmada ayarlayın:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

## Yerel ve uzak denetim

- **Yerel denetim (varsayılan):** Gateway local loopback denetim servisini başlatır ve yerel bir tarayıcı başlatabilir.
- **Uzak denetim (Node sunucusu):** Tarayıcının bulunduğu makinede bir Node sunucusu çalıştırın; Gateway tarayıcı eylemlerini ona proxy eder.
- **Uzak CDP:** Uzak Chromium tabanlı bir tarayıcıya bağlanmak için `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`) ayarlayın.
  Bu durumda OpenClaw yerel tarayıcı başlatmaz.

Durdurma davranışı profil moduna göre farklılık gösterir:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw'ın başlattığı tarayıcı sürecini durdurur
- attach-only ve uzak CDP profilleri: `openclaw browser stop`, aktif
  denetim oturumunu kapatır ve Playwright/CDP benzetim geçersiz kılmalarını (viewport,
  color scheme, locale, timezone, offline mode ve benzeri durumları) serbest bırakır;
  OpenClaw tarafından herhangi bir tarayıcı süreci başlatılmamış olsa bile

Uzak CDP URL'leri auth içerebilir:

- Sorgu token'ları (ör. `https://provider.example?token=<token>`)
- HTTP Basic auth (ör. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktalarını çağırırken ve
CDP WebSocket'e bağlanırken auth'u korur. Token'ları yapılandırma dosyalarına
commit etmek yerine ortam değişkenlerini veya secret yöneticilerini tercih edin.

## Node tarayıcı proxy'si (sıfır yapılandırmalı varsayılan)

Tarayıcınızın bulunduğu makinede bir **Node sunucusu** çalıştırıyorsanız OpenClaw,
ek tarayıcı yapılandırması olmadan tarayıcı araç çağrılarını otomatik olarak o Node'a yönlendirebilir.
Bu, uzak Gateway'ler için varsayılan yoldur.

Notlar:

- Node sunucusu, yerel tarayıcı denetim sunucusunu bir **proxy komutu** üzerinden açığa çıkarır.
- Profiller, Node'un kendi `browser.profiles` yapılandırmasından gelir (yerelle aynı).
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için boş bırakın: yapılandırılmış tüm profiller, profil oluşturma/silme rotaları dahil proxy üzerinden erişilebilir kalır.
- `nodeHost.browserProxy.allowProfiles` ayarlarsanız OpenClaw bunu en az ayrıcalık sınırı olarak ele alır: yalnızca allowlist'e alınmış profiller hedeflenebilir ve kalıcı profil oluşturma/silme rotaları proxy yüzeyinde engellenir.
- İstemiyorsanız devre dışı bırakın:
  - Node üzerinde: `nodeHost.browserProxy.enabled=false`
  - Gateway üzerinde: `gateway.nodes.browser.mode="off"`

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), HTTPS ve WebSocket üzerinden
CDP bağlantı URL'leri açığa çıkaran barındırılmış bir Chromium servisidir. OpenClaw her iki biçimi de kullanabilir, ancak
uzak bir tarayıcı profili için en basit seçenek Browserless'ın bağlantı belgelerindeki doğrudan WebSocket URL'sidir.

Örnek:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Notlar:

- `<BROWSERLESS_API_KEY>` yerine gerçek Browserless token'ınızı yazın.
- Browserless hesabınıza uyan bölge uç noktasını seçin (belgelerine bakın).
- Browserless size bir HTTPS temel URL verirse, doğrudan CDP bağlantısı için bunu `wss://` biçimine dönüştürebilir veya
  HTTPS URL'yi koruyup OpenClaw'ın `/json/version` keşfi yapmasına izin verebilirsiniz.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılmış tarayıcı servisleri, standart HTTP tabanlı CDP keşfi (`/json/version`) yerine
**doğrudan bir WebSocket** uç noktası açığa çıkarır. OpenClaw üç
CDP URL şeklini kabul eder ve doğru bağlantı stratejisini otomatik olarak seçer:

- **HTTP(S) keşfi** — `http://host[:port]` veya `https://host[:port]`.
  OpenClaw, WebSocket hata ayıklayıcı URL'sini keşfetmek için `/json/version` çağırır, ardından
  bağlanır. WebSocket fallback'i yoktur.
- **Doğrudan WebSocket uç noktaları** — `ws://host[:port]/devtools/<kind>/<id>` veya
  `wss://...` ile `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  yolu. OpenClaw doğrudan WebSocket handshake ile bağlanır ve
  `/json/version` aşamasını tamamen atlar.
- **Çıplak WebSocket kökleri** — `ws://host[:port]` veya `wss://host[:port]`, `/devtools/...` yolu olmadan
  (ör. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw önce HTTP
  `/json/version` keşfini dener (`http`/`https` şemasına normalize ederek);
  keşif bir `webSocketDebuggerUrl` döndürürse onu kullanır, aksi halde OpenClaw
  çıplak kökte doğrudan WebSocket handshake'e geri düşer. Bu, yerel bir Chrome'a yöneltilmiş çıplak `ws://` bağlantısının da
  bağlanmasını sağlar; çünkü Chrome yalnızca `/json/version`
  çıktısındaki hedefe özgü yolda WebSocket yükseltmelerini kabul eder.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözme, gizlilik modu ve residential
proxy'lerle headless tarayıcı çalıştırmak için bulut tabanlı bir platformdur.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Notlar:

- [Kaydolun](https://www.browserbase.com/sign-up) ve [Overview dashboard](https://www.browserbase.com/overview) üzerinden **API Key**'inizi kopyalayın.
- `<BROWSERBASE_API_KEY>` yerine gerçek Browserbase API anahtarınızı yazın.
- Browserbase, WebSocket bağlantısında tarayıcı oturumunu otomatik oluşturur; bu nedenle
  elle oturum oluşturma adımı gerekmez.
- Ücretsiz katman, aynı anda bir oturuma ve ayda bir tarayıcı saatine izin verir.
  Ücretli plan sınırları için [pricing](https://www.browserbase.com/pricing) sayfasına bakın.
- Tam API
  başvurusu, SDK kılavuzları ve entegrasyon örnekleri için [Browserbase docs](https://docs.browserbase.com) sayfasına bakın.

## Güvenlik

Temel fikirler:

- Tarayıcı denetimi yalnızca local loopback'tir; erişim Gateway auth veya Node eşleştirmesi üzerinden akar.
- Bağımsız local loopback tarayıcı HTTP API'si yalnızca **paylaşılan gizli anahtar auth** kullanır:
  Gateway token bearer auth, `x-openclaw-password` veya
  yapılandırılmış Gateway password ile HTTP Basic auth.
- Tailscale Serve kimlik başlıkları ve `gateway.auth.mode: "trusted-proxy"`,
  bu bağımsız local loopback tarayıcı API'sini kimlik doğrulamaz.
- Tarayıcı denetimi etkinse ve paylaşılan gizli anahtar auth yapılandırılmamışsa OpenClaw,
  başlangıçta `gateway.auth.token` değerini otomatik üretir ve bunu yapılandırmaya kalıcı yazar.
- `gateway.auth.mode`
  zaten `password`, `none` veya `trusted-proxy` olduğunda OpenClaw bu token'ı otomatik üretmez.
- Gateway'i ve tüm Node sunucularını özel ağda (Tailscale) tutun; genel açığa çıkarmadan kaçının.
- Uzak CDP URL'lerini/token'larını secret gibi değerlendirin; env değişkenlerini veya bir secret yöneticisini tercih edin.

Uzak CDP ipuçları:

- Mümkün olduğunda şifrelenmiş uç noktaları (HTTPS veya WSS) ve kısa ömürlü token'ları tercih edin.
- Uzun ömürlü token'ları doğrudan yapılandırma dosyalarına gömmekten kaçının.

## Profiller (çoklu tarayıcı)

OpenClaw, birden fazla adlandırılmış profili (yönlendirme yapılandırmaları) destekler. Profiller şunlar olabilir:

- **openclaw-managed**: kendi kullanıcı verisi dizini + CDP portuna sahip, özel bir Chromium tabanlı tarayıcı örneği
- **remote**: açık bir CDP URL'si (başka yerde çalışan Chromium tabanlı tarayıcı)
- **existing session**: Chrome DevTools MCP otomatik bağlanma üzerinden mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili eksikse otomatik oluşturulur.
- `user` profili, Chrome MCP existing-session attach için yerleşiktir.
- `user` dışındaki existing-session profilleri opt-in'dir; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP portları varsayılan olarak **18800–18899** aralığından ayrılır.
- Bir profil silindiğinde yerel veri dizini Çöp Kutusu'na taşınır.

Tüm denetim uç noktaları `?profile=<name>` kabul eder; CLI ise `--browser-profile` kullanır.

## Chrome DevTools MCP üzerinden existing-session

OpenClaw, resmi Chrome DevTools MCP sunucusu aracılığıyla çalışan bir Chromium tabanlı tarayıcı profiline de bağlanabilir. Bu, o tarayıcı profilinde zaten açık olan sekmeleri ve giriş durumunu yeniden kullanır.

Resmi arka plan ve kurulum başvuruları:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil:

- `user`

İsteğe bağlı: farklı bir ad, renk veya tarayıcı veri dizini istiyorsanız
kendi özel existing-session profilinizi oluşturun.

Varsayılan davranış:

- Yerleşik `user` profili, varsayılan yerel Google Chrome profilini hedefleyen Chrome MCP auto-connect kullanır.

Brave, Edge, Chromium veya varsayılan olmayan bir Chrome profili için `userDataDir` kullanın:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Ardından eşleşen tarayıcıda:

1. O tarayıcının uzaktan hata ayıklama inspect sayfasını açın.
2. Uzaktan hata ayıklamayı etkinleştirin.
3. Tarayıcıyı açık tutun ve OpenClaw bağlandığında bağlantı istemini onaylayın.

Yaygın inspect sayfaları:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Canlı attach smoke testi:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Başarının görünümü:

- `status`, `driver: existing-session` gösterir
- `status`, `transport: chrome-mcp` gösterir
- `status`, `running: true` gösterir
- `tabs`, zaten açık tarayıcı sekmelerinizi listeler
- `snapshot`, seçili canlı sekmeden ref'ler döndürür

Attach çalışmıyorsa kontrol edilecekler:

- hedef Chromium tabanlı tarayıcı sürümü `144+` mü
- uzaktan hata ayıklama o tarayıcının inspect sayfasında etkin mi
- tarayıcı attach onay istemini gösterdi mi ve siz kabul ettiniz mi
- `openclaw doctor`, eski extension tabanlı tarayıcı yapılandırmasını taşır ve
  varsayılan otomatik bağlanma profilleri için Chrome'un yerelde kurulu olduğunu denetler, ancak sizin yerinize tarayıcı tarafı uzaktan hata ayıklamayı etkinleştiremez

Agent kullanımı:

- Kullanıcının giriş yapmış tarayıcı durumuna ihtiyacınız olduğunda `profile="user"` kullanın.
- Özel bir existing-session profili kullanıyorsanız o açık profil adını geçin.
- Bu modu yalnızca kullanıcı attach
  istemini onaylamak için bilgisayar başındayken seçin.
- Gateway veya Node sunucusu `npx chrome-devtools-mcp@latest --autoConnect` çalıştırabilir

Notlar:

- Bu yol, giriş yapılmış tarayıcı oturumunuz içinde
  eylem yapabildiği için yalıtılmış `openclaw` profiline göre daha yüksek risklidir.
- OpenClaw bu sürücü için tarayıcıyı başlatmaz; yalnızca bağlanır.
- OpenClaw burada resmi Chrome DevTools MCP `--autoConnect` akışını kullanır. `userDataDir`
  ayarlıysa hedef kullanıcı veri dizinini seçmek için iletilir.
- Existing-session, seçilen host üzerinde veya bağlı bir
  tarayıcı Node'u üzerinden bağlanabilir. Chrome başka yerde yaşıyorsa ve tarayıcı Node'u bağlı değilse
  bunun yerine uzak CDP veya bir Node sunucusu kullanın.

<Accordion title="Existing-session özellik sınırlamaları">

Yönetilen `openclaw` profiline kıyasla existing-session sürücüleri daha kısıtlıdır:

- **Ekran görüntüleri** — sayfa yakalamaları ve `--ref` öğe yakalamaları çalışır; CSS `--element` seçicileri çalışmaz. `--full-page`, `--ref` veya `--element` ile birleştirilemez. Sayfa veya ref tabanlı öğe ekran görüntüleri için Playwright gerekmez.
- **Eylemler** — `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select`, snapshot ref'leri gerektirir (CSS seçicileri yok). `click` yalnızca sol düğme içindir. `type`, `slowly=true` desteklemez; `fill` veya `press` kullanın. `press`, `delayMs` desteklemez. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` ve `evaluate`, çağrı başına zaman aşımı desteklemez. `select` tek bir değer kabul eder.
- **Wait / upload / dialog** — `wait --url`, tam, alt dize ve glob desenlerini destekler; `wait --load networkidle` desteklenmez. Upload hook'ları `ref` veya `inputRef` gerektirir, her seferinde bir dosya, CSS `element` yoktur. Dialog hook'ları zaman aşımı geçersiz kılmaları desteklemez.
- **Yalnızca yönetilen özellikler** — toplu eylemler, PDF dışa aktarma, indirme yakalama ve `responsebody` yine yönetilen tarayıcı yolunu gerektirir.

</Accordion>

## Yalıtım garantileri

- **Özel kullanıcı veri dizini**: kişisel tarayıcı profilinize asla dokunmaz.
- **Özel portlar**: geliştirme iş akışlarıyla çakışmayı önlemek için `9222` kullanılmaz.
- **Deterministik sekme denetimi**: hedef sekmeler `targetId` ile seçilir, “son sekme” ile değil.

## Tarayıcı seçimi

Yerelde başlatırken OpenClaw ilk bulunanı seçer:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Bunu `browser.executablePath` ile geçersiz kılabilirsiniz.

Platformlar:

- macOS: `/Applications` ve `~/Applications` denetlenir.
- Linux: `google-chrome`, `brave`, `microsoft-edge`, `chromium` vb. aranır.
- Windows: yaygın kurulum konumları denetlenir.

## Denetim API'si (isteğe bağlı)

Betik yazımı ve hata ayıklama için Gateway, küçük bir **yalnızca local loopback HTTP
denetim API'si** ile eşleşen bir `openclaw browser` CLI açığa çıkarır (anlık görüntüler, ref'ler, wait
güçlendirmeleri, JSON çıktısı, hata ayıklama iş akışları). Tam başvuru için
bkz. [Browser control API](/tr/tools/browser-control).

## Sorun giderme

Linux'a özgü sorunlar için (özellikle snap Chromium) bkz.
[Browser troubleshooting](/tr/tools/browser-linux-troubleshooting).

WSL2 Gateway + Windows Chrome bölünmüş host kurulumları için bkz.
[WSL2 + Windows + remote Chrome CDP troubleshooting](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP başlangıç hatası ile gezinme SSRF engeli

Bunlar farklı hata sınıflarıdır ve farklı kod yollarına işaret ederler.

- **CDP başlangıç veya hazırlık hatası**, OpenClaw'ın tarayıcı denetim düzleminin sağlıklı olduğunu doğrulayamadığı anlamına gelir.
- **Gezinme SSRF engeli**, tarayıcı denetim düzleminin sağlıklı olduğu ancak bir sayfa gezinme hedefinin ilke tarafından reddedildiği anlamına gelir.

Yaygın örnekler:

- CDP başlangıç veya hazırlık hatası:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Gezinme SSRF engeli:
  - `open`, `navigate`, snapshot veya sekme açma akışları, `start` ve `tabs` hâlâ çalışırken tarayıcı/ağ ilkesi hatasıyla başarısız olur

Bu ikisini ayırmak için şu asgari sıralamayı kullanın:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Sonuçlar nasıl okunur:

- `start`, `not reachable after start` ile başarısız olursa önce CDP hazırlığını giderin.
- `start` başarılı ama `tabs` başarısızsa denetim düzlemi hâlâ sağlıksızdır. Bunu sayfa-gezinme sorunu değil, CDP erişilebilirlik sorunu olarak değerlendirin.
- `start` ve `tabs` başarılı ama `open` veya `navigate` başarısızsa tarayıcı denetim düzlemi ayaktadır ve hata gezinme ilkesi veya hedef sayfadadır.
- `start`, `tabs` ve `open` başarılıysa temel yönetilen tarayıcı denetim yolu sağlıklıdır.

Önemli davranış ayrıntıları:

- Tarayıcı yapılandırması, `browser.ssrfPolicy` ayarlamasanız bile varsayılan olarak kapalı başarısız SSRF ilke nesnesine sahiptir.
- Yerel local loopback `openclaw` yönetilen profili için CDP sağlık denetimleri, OpenClaw'ın kendi yerel denetim düzlemi için tarayıcı SSRF erişilebilirlik uygulamasını bilerek atlar.
- Gezinme koruması ayrıdır. Başarılı `start` veya `tabs` sonucu, daha sonraki `open` veya `navigate` hedefinin izinli olduğu anlamına gelmez.

Güvenlik yönergeleri:

- Varsayılan olarak tarayıcı SSRF ilkesini gevşetmeyin.
- Geniş özel ağ erişimi yerine `hostnameAllowlist` veya `allowedHostnames` gibi dar host istisnalarını tercih edin.
- `dangerouslyAllowPrivateNetwork: true` ayarını yalnızca özel ağ tarayıcı erişiminin gerekli ve gözden geçirilmiş olduğu bilerek güvenilen ortamlarda kullanın.

## Agent araçları + denetimin nasıl çalıştığı

Agent tarayıcı otomasyonu için **tek bir araç** alır:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Nasıl eşlenir:

- `browser snapshot`, kararlı bir UI ağacı döndürür (AI veya ARIA).
- `browser act`, tıklamak/yazmak/sürüklemek/seçmek için snapshot `ref` kimliklerini kullanır.
- `browser screenshot`, piksel yakalar (tam sayfa veya öğe).
- `browser` şunları kabul eder:
  - adlandırılmış bir tarayıcı profili seçmek için `profile` (`openclaw`, `chrome` veya uzak CDP).
  - tarayıcının nerede yaşadığını seçmek için `target` (`sandbox` | `host` | `node`).
  - Sandbox'lı oturumlarda `target: "host"` için `agents.defaults.sandbox.browser.allowHostControl=true` gerekir.
  - `target` atlanırsa: sandbox'lı oturumlar varsayılan olarak `sandbox`, sandbox'sız oturumlar varsayılan olarak `host` kullanır.
  - Tarayıcı yetenekli bir Node bağlıysa, `target="host"` veya `target="node"` ile sabitlemediğiniz sürece araç buna otomatik yönlenebilir.

Bu, agent'i deterministik tutar ve kırılgan seçicilerden kaçınır.

## İlgili

- [Tools Overview](/tr/tools) — kullanılabilir tüm agent araçları
- [Sandboxing](/tr/gateway/sandboxing) — sandbox'lı ortamlarda tarayıcı denetimi
- [Security](/tr/gateway/security) — tarayıcı denetimi riskleri ve sağlamlaştırma
