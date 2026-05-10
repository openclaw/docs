---
read_when:
    - Ajan kontrollü tarayıcı otomasyonu ekleme
    - OpenClaw'ın kendi Chrome'unuza neden müdahale ettiğini hata ayıklama
    - macOS uygulamasında tarayıcı ayarlarını ve yaşam döngüsünü uygulama
summary: Entegre tarayıcı denetim hizmeti + eylem komutları
title: Tarayıcı (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-05-10T19:56:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51a78cc860ef4951548aba1e60bc686dfc19c156f69b6a59cf7c671eeaa67a0a
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw, ajanın kontrol ettiği **ayrılmış bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir.
Kişisel tarayıcınızdan izoledir ve Gateway içinde küçük bir yerel
kontrol hizmeti üzerinden yönetilir (yalnızca loopback).

Başlangıç düzeyi görünüm:

- Bunu **ayrı, yalnızca ajana ait bir tarayıcı** gibi düşünün.
- `openclaw` profili kişisel tarayıcı profilinize **dokunmaz**.
- Ajan güvenli bir hatta **sekmeler açabilir, sayfaları okuyabilir, tıklayabilir ve yazı yazabilir**.
- Yerleşik `user` profili, Chrome MCP üzerinden gerçek oturum açılmış Chrome oturumunuza bağlanır.

## Ne elde edersiniz

- **openclaw** adlı ayrı bir tarayıcı profili (varsayılan olarak turuncu vurgu).
- Belirleyici sekme denetimi (listele/aç/odakla/kapat).
- Ajan eylemleri (tıkla/yaz/sürükle/seç), anlık görüntüler, ekran görüntüleri, PDF'ler.
- Tarayıcı Plugin'i etkin olduğunda ajanlara anlık görüntü,
  kararlı sekme, bayat referans ve manuel engelleyici kurtarma döngüsünü öğreten paketlenmiş bir `browser-automation` skill'i.
- İsteğe bağlı çoklu profil desteği (`openclaw`, `work`, `remote`, ...).

Bu tarayıcı **günlük kullandığınız tarayıcı değildir**. Ajan otomasyonu ve doğrulaması için
güvenli, izole bir yüzeydir.

## Hızlı başlangıç

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

"Browser disabled" alırsanız, yapılandırmada etkinleştirin (aşağıya bakın) ve
Gateway'i yeniden başlatın.

`openclaw browser` tamamen eksikse veya ajan tarayıcı aracının
kullanılamadığını söylüyorsa, [Eksik tarayıcı komutu veya aracı](/tr/tools/browser#missing-browser-command-or-tool) bölümüne geçin.

## Plugin denetimi

Varsayılan `browser` aracı paketlenmiş bir Plugin'dir. Aynı `browser` araç adını kaydeden başka bir Plugin ile değiştirmek için devre dışı bırakın:

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

Varsayılanlar hem `plugins.entries.browser.enabled` **hem de** `browser.enabled=true` gerektirir. Yalnızca Plugin'i devre dışı bırakmak, `openclaw browser` CLI'sini, `browser.request` gateway metodunu, ajan aracını ve kontrol hizmetini tek bir birim olarak kaldırır; `browser.*` yapılandırmanız bir yedek için olduğu gibi kalır.

Tarayıcı yapılandırma değişiklikleri, Plugin'in hizmetini yeniden kaydedebilmesi için Gateway'in yeniden başlatılmasını gerektirir.

## Ajan kılavuzu

Araç profili notu: `tools.profile: "coding"` `web_search` ve
`web_fetch` içerir, ancak tam `browser` aracını içermez. Ajan veya
başlatılmış bir alt ajan tarayıcı otomasyonu kullanacaksa, profil
aşamasında tarayıcıyı ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Tek bir ajan için `agents.list[].tools.alsoAllow: ["browser"]` kullanın.
`tools.subagents.tools.allow: ["browser"]` tek başına yeterli değildir çünkü alt ajan
ilkesi profil filtrelemesinden sonra uygulanır.

Tarayıcı Plugin'i iki düzeyde ajan kılavuzu ile gelir:

- `browser` araç açıklaması, kompakt ve her zaman açık sözleşmeyi taşır: doğru profili seç,
  referansları aynı sekmede tut, sekme hedefleme için `tabId`/etiketleri kullan
  ve çok adımlı işler için tarayıcı skill'ini yükle.
- Paketlenmiş `browser-automation` skill'i daha uzun çalışma döngüsünü taşır:
  önce durumu/sekmeleri kontrol et, görev sekmelerini etiketle, eylemden önce anlık görüntü al, UI değişikliklerinden sonra yeniden anlık görüntü al, bayat referansları bir kez kurtar ve giriş/2FA/captcha veya
  kamera/mikrofon engelleyicilerini tahmin etmek yerine manuel eylem olarak bildir.

Plugin ile paketlenen Skills, Plugin etkinleştirildiğinde ajanın kullanılabilir Skills listesinde yer alır. Tam skill yönergeleri isteğe bağlı olarak yüklenir, bu nedenle rutin
turlar tam token maliyetini ödemez.

## Eksik tarayıcı komutu veya aracı

Yükseltmeden sonra `openclaw browser` bilinmiyorsa, `browser.request` eksikse veya ajan tarayıcı aracının kullanılamadığını bildiriyorsa, olağan neden `browser` içermeyen bir `plugins.allow` listesi ve kök `browser` yapılandırma bloğunun olmamasıdır. Bunu ekleyin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Örneğin `browser.enabled=true` veya `browser.profiles.<name>` gibi açık bir kök `browser` bloğu, kısıtlayıcı bir `plugins.allow` altında bile paketlenmiş tarayıcı Plugin'ini etkinleştirir ve kanal yapılandırma davranışıyla eşleşir. `plugins.entries.browser.enabled=true` ve `tools.alsoAllow: ["browser"]` allowlist üyeliğinin yerini tek başlarına tutmaz. `plugins.allow` öğesini tamamen kaldırmak da varsayılanı geri yükler.

## Profiller: `openclaw` ve `user`

- `openclaw`: yönetilen, izole tarayıcı (uzantı gerekmez).
- `user`: **gerçek oturum açılmış Chrome** oturumunuz için yerleşik Chrome MCP bağlanma profili.

Ajan tarayıcı aracı çağrıları için:

- Varsayılan: izole `openclaw` tarayıcısını kullanın.
- Mevcut oturum açılmış oturumlar önemli olduğunda ve kullanıcı
  herhangi bir bağlanma istemine tıklamak/onaylamak için bilgisayar başındayken `profile="user"` tercih edin.
- Belirli bir tarayıcı modu istediğinizde açık geçersiz kılma `profile` değeridir.

Yönetilen modu varsayılan yapmak istiyorsanız `browser.defaultProfile: "openclaw"` ayarlayın.

## Yapılandırma

Tarayıcı ayarları `~/.openclaw/openclaw.json` içinde bulunur.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
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

<Accordion title="Ports and reachability">

- Kontrol hizmeti, `gateway.port` değerinden türetilen bir portta loopback'e bağlanır (varsayılan `18791` = gateway + 2). `gateway.port` veya `OPENCLAW_GATEWAY_PORT` geçersiz kılındığında, türetilen portlar aynı aile içinde kayar.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar; bunları yalnızca uzak CDP için ayarlayın. Ayarlanmamışsa `cdpUrl` varsayılan olarak yönetilen yerel CDP portuna döner.
- `remoteCdpTimeoutMs`, uzak ve `attachOnly` CDP HTTP erişilebilirlik
  kontrollerine ve sekme açma HTTP isteklerine uygulanır; `remoteCdpHandshakeTimeoutMs`
  bunların CDP WebSocket el sıkışmalarına uygulanır.
- `localLaunchTimeoutMs`, yerel olarak başlatılan yönetilen bir Chrome
  sürecinin CDP HTTP uç noktasını açığa çıkarması için ayrılan süredir. `localCdpReadyTimeoutMs`, süreç keşfedildikten sonra CDP websocket hazır oluşu için
  sonraki bütçedir.
  Chromium'un yavaş başladığı Raspberry Pi, düşük seviye VPS veya eski donanımlarda bu değerleri yükseltin. Değerler `120000` ms'ye kadar pozitif tam sayılar olmalıdır; geçersiz
  yapılandırma değerleri reddedilir.
- Tekrarlanan yönetilen Chrome başlatma/hazırlık hataları profil başına devre kesiciye alınır. Birkaç ardışık hatadan sonra OpenClaw, her tarayıcı aracı çağrısında Chromium başlatmak yerine yeni başlatma
  denemelerini kısa süreliğine duraklatır. Başlatma sorununu düzeltin, gerekmiyorsa tarayıcıyı devre dışı bırakın veya onarımdan sonra
  Gateway'i yeniden başlatın.
- `actionTimeoutMs`, çağıran `timeoutMs` geçirmediğinde tarayıcı `act` istekleri için varsayılan bütçedir. İstemci taşıması, uzun beklemelerin HTTP sınırında zaman aşımına uğramak yerine tamamlanabilmesi için küçük bir esneklik penceresi ekler.
- `tabCleanup`, birincil ajan tarayıcı oturumları tarafından açılan sekmeler için en iyi çaba temizliğidir. Alt ajan, Cron ve ACP yaşam döngüsü temizliği oturum sonunda açıkça izlenen sekmelerini yine kapatır; birincil oturumlar etkin sekmeleri yeniden kullanılabilir tutar, ardından arka planda boşta veya fazla izlenen sekmeleri kapatır.

</Accordion>

<Accordion title="SSRF policy">

- Tarayıcı gezinmesi ve sekme açma, gezinmeden önce SSRF korumasından geçirilir ve son `http(s)` URL'sinde sonradan en iyi çabayla yeniden kontrol edilir.
- Katı SSRF modunda, uzak CDP uç nokta keşfi ve `/json/version` yoklamaları (`cdpUrl`) da kontrol edilir.
- Gateway/sağlayıcı `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve `NO_PROXY` ortam değişkenleri OpenClaw tarafından yönetilen tarayıcıyı otomatik olarak proxy üzerinden geçirmez. Yönetilen Chrome varsayılan olarak doğrudan başlatılır, böylece sağlayıcı proxy ayarları tarayıcı SSRF kontrollerini zayıflatmaz.
- Yönetilen tarayıcının kendisini proxy üzerinden geçirmek için `browser.extraArgs` aracılığıyla `--proxy-server=...` veya `--proxy-pac-url=...` gibi açık Chrome proxy bayrakları geçirin. Katı SSRF modu, özel ağ tarayıcı erişimi bilerek etkinleştirilmedikçe açık tarayıcı proxy yönlendirmesini engeller.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak kapalıdır; yalnızca özel ağ tarayıcı erişimi bilerek güvenilir kabul edildiğinde etkinleştirin.
- `browser.ssrfPolicy.allowPrivateNetwork` eski alias olarak desteklenmeye devam eder.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true`, asla yerel tarayıcı başlatma; yalnızca zaten çalışıyorsa bağlan anlamına gelir.
- `headless`, genel olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.headless` değerini geçersiz kılar; böylece yerel olarak başlatılan bir profil headless kalırken bir diğeri görünür kalabilir.
- `POST /start?headless=true` ve `openclaw browser start --headless`, yerel yönetilen profiller için
  `browser.headless` veya profil yapılandırmasını yeniden yazmadan tek seferlik
  bir headless başlatma ister. Mevcut oturum, yalnızca bağlan ve
  uzak CDP profilleri bu geçersiz kılmayı reddeder; çünkü OpenClaw bu
  tarayıcı süreçlerini başlatmaz.
- `DISPLAY` veya `WAYLAND_DISPLAY` olmayan Linux ana makinelerinde, ortam veya profil/genel
  yapılandırma açıkça başlıklı modu seçmediğinde yerel yönetilen profiller
  otomatik olarak varsayılan olarak headless çalışır. `openclaw browser status --json`,
  `headlessSource` değerini `env`, `profile`, `config`,
  `request`, `linux-display-fallback` veya `default` olarak bildirir.
- `OPENCLAW_BROWSER_HEADLESS=1`, geçerli süreç için yerel yönetilen başlatmaları
  headless olmaya zorlar. `OPENCLAW_BROWSER_HEADLESS=0`, olağan
  başlatmalar için başlıklı modu zorlar ve görüntü sunucusu olmayan Linux ana makinelerinde
  uygulanabilir bir hata döndürür; açık bir `start --headless` isteği yine de
  o tek başlatma için öncelikli olur.
- `executablePath`, genel olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.executablePath` değerini geçersiz kılar; böylece farklı yönetilen profiller farklı Chromium tabanlı tarayıcıları başlatabilir. Her iki biçim de işletim sistemi ana dizininiz için `~` kabul eder.
- `color` (üst düzey ve profil başına), hangi profilin etkin olduğunu görebilmeniz için tarayıcı arayüzünü renklendirir.
- Varsayılan profil `openclaw` (yönetilen bağımsız) şeklindedir. Oturum açmış kullanıcı tarayıcısını seçmek için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: Chromium tabanlıysa sistem varsayılan tarayıcısı; aksi halde Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır. Bu sürücü için `cdpUrl` ayarlamayın.
- Bir mevcut oturum profili varsayılan olmayan bir Chromium kullanıcı profiline (Brave, Edge vb.) bağlanacaksa `browser.profiles.<name>.userDataDir` değerini ayarlayın. Bu yol da işletim sistemi ana dizininiz için `~` kabul eder.

</Accordion>

</AccordionGroup>

## Brave veya başka bir Chromium tabanlı tarayıcı kullanın

**Sistem varsayılan** tarayıcınız Chromium tabanlıysa (Chrome/Brave/Edge/vb.),
OpenClaw bunu otomatik olarak kullanır. Otomatik algılamayı geçersiz kılmak için
`browser.executablePath` değerini ayarlayın. Üst düzey ve profil başına
`executablePath` değerleri işletim sistemi ana dizininiz için `~` kabul eder:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Veya yapılandırmada, platform başına ayarlayın:

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

Profil başına `executablePath` yalnızca OpenClaw tarafından başlatılan yerel
yönetilen profilleri etkiler. `existing-session` profilleri bunun yerine zaten
çalışan bir tarayıcıya bağlanır ve uzak CDP profilleri `cdpUrl` arkasındaki
tarayıcıyı kullanır.

## Yerel ve uzak kontrol

- **Yerel kontrol (varsayılan):** Gateway, loopback kontrol hizmetini başlatır ve yerel bir tarayıcı başlatabilir.
- **Uzak kontrol (node ana makinesi):** tarayıcının bulunduğu makinede bir node ana makinesi çalıştırın; Gateway, tarayıcı eylemlerini ona proxy üzerinden iletir.
- **Uzak CDP:** uzak bir Chromium tabanlı tarayıcıya
  bağlanmak için `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`) ayarlayın. Bu durumda OpenClaw yerel bir tarayıcı başlatmaz.
- Loopback üzerindeki dışarıdan yönetilen CDP hizmetleri için (örneğin
  Docker içinde `127.0.0.1` adresine yayımlanan Browserless), ayrıca `attachOnly: true` ayarlayın. `attachOnly` olmayan loopback CDP,
  yerel OpenClaw tarafından yönetilen bir tarayıcı profili olarak değerlendirilir.
- `headless` yalnızca OpenClaw tarafından başlatılan yerel yönetilen profilleri etkiler. Mevcut oturum veya uzak CDP tarayıcılarını yeniden başlatmaz ya da değiştirmez.
- `executablePath` aynı yerel yönetilen profil kuralını izler. Çalışan bir
  yerel yönetilen profilde bunu değiştirmek, o profili yeniden başlatma/uzlaştırma için işaretler; böylece
  sonraki başlatma yeni ikili dosyayı kullanır.

Durdurma davranışı profil moduna göre farklılık gösterir:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw tarafından
  başlatılan tarayıcı sürecini durdurur
- yalnızca bağlan ve uzak CDP profilleri: `openclaw browser stop`, etkin
  kontrol oturumunu kapatır ve Playwright/CDP emülasyon geçersiz kılmalarını (görüntü alanı,
  renk şeması, yerel ayar, saat dilimi, çevrimdışı mod ve benzer durumlar) serbest bırakır; OpenClaw tarafından
  herhangi bir tarayıcı süreci başlatılmamış olsa bile

Uzak CDP URL'leri kimlik doğrulama içerebilir:

- Sorgu token'ları (ör. `https://provider.example?token=<token>`)
- HTTP Basic kimlik doğrulaması (ör. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktalarını çağırırken ve CDP WebSocket'e bağlanırken
kimlik doğrulamayı korur. Token'ları yapılandırma dosyalarına commit etmek yerine
ortam değişkenlerini veya secret yöneticilerini tercih edin.

## Node tarayıcı proxy'si (sıfır yapılandırmalı varsayılan)

Tarayıcınızın bulunduğu makinede bir **node ana makinesi** çalıştırırsanız, OpenClaw
ek tarayıcı yapılandırması olmadan tarayıcı aracı çağrılarını otomatik olarak
o node'a yönlendirebilir. Bu, uzak gateway'ler için varsayılan yoldur.

Notlar:

- Node ana makinesi, yerel tarayıcı kontrol sunucusunu bir **proxy komutu** aracılığıyla sunar.
- Profiller, node'un kendi `browser.profiles` yapılandırmasından gelir (yereldekiyle aynı).
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için boş bırakın: profil oluşturma/silme rotaları dahil tüm yapılandırılmış profiller proxy üzerinden erişilebilir kalır.
- `nodeHost.browserProxy.allowProfiles` ayarlarsanız OpenClaw bunu en düşük ayrıcalık sınırı olarak değerlendirir: yalnızca izin listesine alınmış profiller hedeflenebilir ve kalıcı profil oluşturma/silme rotaları proxy yüzeyinde engellenir.
- İstemiyorsanız devre dışı bırakın:
  - Node üzerinde: `nodeHost.browserProxy.enabled=false`
  - Gateway üzerinde: `gateway.nodes.browser.mode="off"`

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), CDP bağlantı URL'lerini HTTPS ve WebSocket
üzerinden sunan barındırılan bir Chromium hizmetidir. OpenClaw her iki biçimi de kullanabilir, ancak
uzak bir tarayıcı profili için en basit seçenek Browserless bağlantı belgelerindeki
doğrudan WebSocket URL'sidir.

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

- `<BROWSERLESS_API_KEY>` değerini gerçek Browserless token'ınızla değiştirin.
- Browserless hesabınızla eşleşen bölge uç noktasını seçin (belgelerine bakın).
- Browserless size bir HTTPS temel URL'si verirse, doğrudan CDP bağlantısı için bunu
  `wss://` biçimine dönüştürebilir veya HTTPS URL'sini koruyup OpenClaw'ın
  `/json/version` keşfi yapmasına izin verebilirsiniz.

### Aynı ana makinede Browserless Docker

Browserless Docker içinde kendi kendine barındırıldığında ve OpenClaw ana makinede çalıştığında,
Browserless'ı dışarıdan yönetilen bir CDP hizmeti olarak ele alın:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

`browser.profiles.browserless.cdpUrl` içindeki adres, OpenClaw sürecinden
erişilebilir olmalıdır. Browserless ayrıca eşleşen ve erişilebilir bir uç nokta da ilan etmelidir;
Browserless `EXTERNAL` değerini OpenClaw'a açık aynı WebSocket tabanına ayarlayın; örneğin
`ws://127.0.0.1:3000`, `ws://browserless:3000` veya kararlı bir özel Docker
ağ adresi. `/json/version`, OpenClaw'ın erişemediği bir adresi işaret eden
`webSocketDebuggerUrl` döndürürse, CDP HTTP sağlıklı görünebilir ancak WebSocket
bağlantısı yine de başarısız olur.

Loopback Browserless profili için `attachOnly` ayarını boş bırakmayın. `attachOnly`
olmadan OpenClaw, loopback bağlantı noktasını yerel yönetilen bir tarayıcı
profili olarak değerlendirir ve bağlantı noktasının kullanımda olduğunu ancak OpenClaw'a ait olmadığını bildirebilir.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılan tarayıcı hizmetleri, standart HTTP tabanlı CDP keşfi (`/json/version`) yerine
bir **doğrudan WebSocket** uç noktası sunar. OpenClaw üç
CDP URL biçimini kabul eder ve doğru bağlantı stratejisini otomatik olarak seçer:

- **HTTP(S) keşfi** - `http://host[:port]` veya `https://host[:port]`.
  OpenClaw, WebSocket hata ayıklayıcı URL'sini keşfetmek için `/json/version` çağırır, ardından
  bağlanır. WebSocket yedeği yoktur.
- **Doğrudan WebSocket uç noktaları** - `ws://host[:port]/devtools/<kind>/<id>` veya
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  yoluna sahip `wss://...`. OpenClaw doğrudan WebSocket el sıkışması üzerinden bağlanır ve
  `/json/version` adımını tamamen atlar.
- **Yalın WebSocket kökleri** - `/devtools/...` yolu olmayan
  `ws://host[:port]` veya `wss://host[:port]` (ör. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw önce HTTP
  `/json/version` keşfini dener (şemayı `http`/`https` olarak normalleştirerek);
  keşif bir `webSocketDebuggerUrl` döndürürse bu kullanılır, aksi halde OpenClaw
  yalın kökte doğrudan WebSocket el sıkışmasına geri döner. İlan edilen
  WebSocket uç noktası CDP el sıkışmasını reddeder ancak yapılandırılmış yalın kök
  bunu kabul ederse, OpenClaw o köke de geri döner. Bu, yerel Chrome'a yönlendirilmiş yalın bir `ws://`
  değerinin yine de bağlanabilmesini sağlar; çünkü Chrome yalnızca `/json/version` üzerinden gelen
  hedefe özel yolda WebSocket yükseltmelerini kabul ederken, barındırılan
  sağlayıcılar keşif uç noktaları Playwright CDP için uygun olmayan kısa ömürlü bir URL
  ilan ettiğinde yine de kök WebSocket uç noktalarını kullanabilir.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözme, gizli mod ve konut
proxy'leriyle headless tarayıcılar çalıştırmak için bir bulut platformudur.

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

- [Kaydolun](https://www.browserbase.com/sign-up) ve **API Key** değerinizı
  [Overview dashboard](https://www.browserbase.com/overview) üzerinden kopyalayın.
- `<BROWSERBASE_API_KEY>` değerini gerçek Browserbase API anahtarınızla değiştirin.
- Browserbase, WebSocket bağlantısında otomatik olarak bir tarayıcı oturumu oluşturur; bu nedenle
  manuel oturum oluşturma adımı gerekmez.
- Ücretsiz katman, ayda bir eşzamanlı oturuma ve bir tarayıcı saatine izin verir.
  Ücretli plan sınırları için [pricing](https://www.browserbase.com/pricing) sayfasına bakın.
- Tam API
  referansı, SDK kılavuzları ve entegrasyon örnekleri için [Browserbase docs](https://docs.browserbase.com) sayfasına bakın.

## Güvenlik

Temel fikirler:

- Tarayıcı denetimi yalnızca loopback'tir; erişim akışları Gateway'in kimlik doğrulamasından veya node eşleştirmesinden geçer.
- Bağımsız loopback tarayıcı HTTP API'si **yalnızca paylaşılan gizli anahtar kimlik doğrulaması** kullanır:
  gateway token bearer kimlik doğrulaması, `x-openclaw-password` veya yapılandırılmış
  gateway parolasıyla HTTP Basic kimlik doğrulaması.
- Tailscale Serve kimlik başlıkları ve `gateway.auth.mode: "trusted-proxy"` bu
  bağımsız loopback tarayıcı API'sinde kimlik doğrulaması **yapmaz**.
- Tarayıcı denetimi etkinse ve paylaşılan gizli anahtar kimlik doğrulaması yapılandırılmamışsa, OpenClaw
  o başlatma için yalnızca çalışma zamanına ait bir gateway token üretir. İstemcilerin yeniden
  başlatmalar arasında sabit bir gizli anahtara ihtiyacı varsa `gateway.auth.token`,
  `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` veya
  `OPENCLAW_GATEWAY_PASSWORD` değerlerini açıkça yapılandırın.
- `gateway.auth.mode` zaten `password`, `none` veya `trusted-proxy` olduğunda
  OpenClaw bu token'ı otomatik olarak üretmez.
- Gateway'i ve tüm node hostlarını özel bir ağda (Tailscale) tutun; herkese açık erişimden kaçının.
- Uzak CDP URL'lerini/token'larını gizli bilgi olarak ele alın; env vars veya bir gizli bilgi yöneticisini tercih edin.

Uzak CDP ipuçları:

- Mümkün olduğunda şifreli uç noktaları (HTTPS veya WSS) ve kısa ömürlü token'ları tercih edin.
- Uzun ömürlü token'ları doğrudan yapılandırma dosyalarına gömmekten kaçının.

## Profiller (çoklu tarayıcı)

OpenClaw birden fazla adlandırılmış profili (yönlendirme yapılandırmalarını) destekler. Profiller şunlar olabilir:

- **openclaw-managed**: kendi kullanıcı veri dizinine + CDP portuna sahip özel bir Chromium tabanlı tarayıcı örneği
- **uzak**: açık bir CDP URL'si (başka yerde çalışan Chromium tabanlı tarayıcı)
- **mevcut oturum**: Chrome DevTools MCP otomatik bağlantısı üzerinden mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili eksikse otomatik oluşturulur.
- `user` profili, Chrome MCP mevcut oturum eklemesi için yerleşiktir.
- Mevcut oturum profilleri `user` dışında isteğe bağlıdır; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP portları varsayılan olarak **18800-18899** aralığından ayrılır.
- Bir profili silmek, yerel veri dizinini Çöp Kutusu'na taşır.

Tüm denetim uç noktaları `?profile=<name>` kabul eder; CLI `--browser-profile` kullanır.

## Chrome DevTools MCP üzerinden mevcut oturum

OpenClaw, resmi Chrome DevTools MCP sunucusu üzerinden çalışan bir Chromium tabanlı
tarayıcı profiline de bağlanabilir. Bu, söz konusu tarayıcı profilinde zaten açık
olan sekmeleri ve oturum açma durumunu yeniden kullanır.

Resmi arka plan ve kurulum başvuruları:

- [Geliştiriciler için Chrome: Chrome DevTools MCP'yi tarayıcı oturumunuzla kullanın](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil:

- `user`

İsteğe bağlı: farklı bir ad, renk veya tarayıcı veri dizini istiyorsanız kendi
özel mevcut oturum profilinizi oluşturun.

Varsayılan davranış:

- Yerleşik `user` profili, varsayılan yerel Google Chrome profilini hedefleyen
  Chrome MCP otomatik bağlantısını kullanır.

Brave, Edge, Chromium veya varsayılan olmayan bir Chrome profili için `userDataDir` kullanın.
`~`, işletim sistemi ana dizininize genişletilir:

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

1. Bu tarayıcının uzaktan hata ayıklama için inspect sayfasını açın.
2. Uzaktan hata ayıklamayı etkinleştirin.
3. Tarayıcıyı çalışır durumda tutun ve OpenClaw bağlandığında bağlantı istemini onaylayın.

Yaygın inspect sayfaları:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Canlı bağlanma smoke testi:

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

Bağlanma çalışmıyorsa kontrol edilecekler:

- hedef Chromium tabanlı tarayıcı sürümü `144+`
- uzaktan hata ayıklama bu tarayıcının inspect sayfasında etkin
- tarayıcı bağlanma onay istemini gösterdi ve siz kabul ettiniz
- `openclaw doctor`, eski extension tabanlı tarayıcı yapılandırmasını geçirir ve
  varsayılan otomatik bağlantı profilleri için Chrome'un yerel olarak kurulu olduğunu denetler, ancak
  tarayıcı tarafı uzaktan hata ayıklamayı sizin için etkinleştiremez

Agent kullanımı:

- Kullanıcının oturum açmış tarayıcı durumuna ihtiyacınız olduğunda `profile="user"` kullanın.
- Özel bir mevcut oturum profili kullanıyorsanız bu açık profil adını geçirin.
- Bu modu yalnızca kullanıcı bağlanma istemini onaylamak için bilgisayar başındayken seçin.
- Gateway veya node hostu `npx chrome-devtools-mcp@latest --autoConnect` başlatabilir

Notlar:

- Bu yol, yalıtılmış `openclaw` profiline göre daha yüksek risklidir çünkü
  oturum açmış tarayıcı oturumunuz içinde işlem yapabilir.
- OpenClaw bu driver için tarayıcıyı başlatmaz; yalnızca bağlanır.
- OpenClaw burada resmi Chrome DevTools MCP `--autoConnect` akışını kullanır.
  `userDataDir` ayarlanmışsa, bu kullanıcı veri dizinini hedeflemek için aktarılır.
- Mevcut oturum, seçili host üzerinde veya bağlı bir tarayıcı node'u üzerinden bağlanabilir.
  Chrome başka bir yerde bulunuyorsa ve bağlı bir tarayıcı node'u yoksa bunun yerine
  uzak CDP veya bir node hostu kullanın.

### Özel Chrome MCP başlatma

Varsayılan `npx chrome-devtools-mcp@latest` akışı istediğiniz şey olmadığında
(çevrimdışı hostlar, sabitlenmiş sürümler, vendored ikili dosyalar) başlatılan
Chrome DevTools MCP sunucusunu profil bazında geçersiz kılın:

| Alan         | Ne yapar                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` yerine başlatılacak yürütülebilir dosya. Olduğu gibi çözümlenir; mutlak yollar dikkate alınır.                      |
| `mcpArgs`    | `mcpCommand` değerine olduğu gibi geçirilen argüman dizisi. Varsayılan `chrome-devtools-mcp@latest --autoConnect` argümanlarının yerini alır. |

Mevcut oturum profilinde `cdpUrl` ayarlandığında OpenClaw `--autoConnect` adımını atlar
ve uç noktayı otomatik olarak Chrome MCP'ye iletir:

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP keşif uç noktası).
- `ws(s)://...` → `--wsEndpoint <url>` (doğrudan CDP WebSocket).

Uç nokta bayrakları ve `userDataDir` birleştirilemez: `cdpUrl` ayarlandığında,
Chrome MCP başlatması için `userDataDir` yok sayılır; çünkü Chrome MCP bir profil
dizini açmak yerine uç noktanın arkasındaki çalışan tarayıcıya bağlanır.

<Accordion title="Mevcut oturum özellik sınırlamaları">

Yönetilen `openclaw` profiliyle karşılaştırıldığında mevcut oturum driver'ları daha kısıtlıdır:

- **Ekran görüntüleri** - sayfa yakalamaları ve `--ref` öğe yakalamaları çalışır; CSS `--element` seçicileri çalışmaz. `--full-page`, `--ref` veya `--element` ile birleştirilemez. Sayfa veya ref tabanlı öğe ekran görüntüleri için Playwright gerekmez.
- **Eylemler** - `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select` snapshot ref'leri gerektirir (CSS seçicileri yoktur). `click-coords`, görünür viewport koordinatlarına tıklar ve snapshot ref'i gerektirmez. `click` yalnızca sol düğmedir. `type`, `slowly=true` desteklemez; `fill` veya `press` kullanın. `press`, `delayMs` desteklemez. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` ve `evaluate` çağrı başına zaman aşımlarını desteklemez. `select` tek bir değer kabul eder.
- **Bekleme / yükleme / iletişim kutusu** - `wait --url` tam eşleşme, alt dize ve glob desenlerini destekler; `wait --load networkidle` desteklenmez. Upload hook'ları `ref` veya `inputRef` gerektirir, tek seferde bir dosya alır, CSS `element` yoktur. Dialog hook'ları zaman aşımı geçersiz kılmalarını desteklemez.
- **Yalnızca yönetilen özellikler** - toplu eylemler, PDF dışa aktarımı, indirme yakalama ve `responsebody` hâlâ yönetilen tarayıcı yolunu gerektirir.

</Accordion>

## Yalıtım garantileri

- **Özel kullanıcı veri dizini**: kişisel tarayıcı profilinize asla dokunmaz.
- **Özel portlar**: geliştirme iş akışlarıyla çakışmaları önlemek için `9222` kullanmaz.
- **Deterministik sekme denetimi**: `tabs`, önce `suggestedTargetId` değerini, ardından
  `t1` gibi kararlı `tabId` tanıtıcılarını, isteğe bağlı etiketleri ve ham `targetId` değerini döndürür.
  Agent'lar `suggestedTargetId` değerini yeniden kullanmalıdır; ham id'ler hata ayıklama ve
  uyumluluk için kullanılabilir kalır.

## Tarayıcı seçimi

Yerel olarak başlatırken OpenClaw ilk kullanılabilir olanı seçer:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` ile geçersiz kılabilirsiniz.

Platformlar:

- macOS: `/Applications` ve `~/Applications` konumlarını denetler.
- Linux: `/usr/bin`, `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` ve
  `/usr/lib/chromium-browser` altındaki yaygın Chrome/Brave/Edge/Chromium konumlarını, ayrıca
  `PLAYWRIGHT_BROWSERS_PATH` veya `~/.cache/ms-playwright` altındaki Playwright tarafından yönetilen Chromium'u denetler.
- Windows: yaygın kurulum konumlarını denetler.

## Denetim API'si (isteğe bağlı)

Betik yazımı ve hata ayıklama için Gateway, küçük bir **yalnızca loopback HTTP
denetim API'si** ve eşleşen bir `openclaw browser` CLI'si sunar (snapshot'lar,
ref'ler, wait güçlendirmeleri, JSON çıktısı, hata ayıklama iş akışları). Tam başvuru için
[Tarayıcı denetim API'si](/tr/tools/browser-control) sayfasına bakın.

## Sorun giderme

Linux'a özgü sorunlar (özellikle snap Chromium) için
[Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting) bölümüne bakın.

WSL2 Gateway + Windows Chrome ayrık host kurulumları için
[WSL2 + Windows + uzak Chrome CDP sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting) bölümüne bakın.

### CDP başlatma hatası ile gezinme SSRF engeli

Bunlar farklı hata sınıflarıdır ve farklı kod yollarına işaret eder.

- **CDP başlatma veya hazır olma hatası**, OpenClaw'ın tarayıcı denetim düzleminin sağlıklı olduğunu doğrulayamadığı anlamına gelir.
- **Gezinme SSRF engeli**, tarayıcı denetim düzleminin sağlıklı olduğu, ancak bir sayfa gezinme hedefinin politika tarafından reddedildiği anlamına gelir.

Yaygın örnekler:

- CDP başlatma veya hazır olma hatası:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - Bir loopback harici CDP hizmeti `attachOnly: true` olmadan yapılandırıldığında
    `Port <port> is in use for profile "<name>" but not by openclaw`
- Gezinme SSRF engeli:
  - `open`, `navigate`, snapshot veya sekme açma akışları, `start` ve `tabs` hâlâ çalışırken bir tarayıcı/ağ politikası hatasıyla başarısız olur

İkisini ayırmak için bu en küçük diziyi kullanın:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Sonuçları okuma:

- `start`, `not reachable after start` ile başarısız olursa önce CDP hazır olma durumunu sorun giderin.
- `start` başarılı olur ancak `tabs` başarısız olursa denetim düzlemi hâlâ sağlıksızdır. Bunu sayfa gezinme sorunu değil, CDP erişilebilirlik sorunu olarak ele alın.
- `start` ve `tabs` başarılı olur ancak `open` veya `navigate` başarısız olursa tarayıcı denetim düzlemi çalışıyordur ve hata gezinme politikasında veya hedef sayfadadır.
- `start`, `tabs` ve `open` tümü başarılı olursa temel yönetilen tarayıcı denetim yolu sağlıklıdır.

Önemli davranış ayrıntıları:

- `browser.ssrfPolicy` yapılandırmasanız bile tarayıcı yapılandırması varsayılan olarak fail-closed bir SSRF politika nesnesine sahiptir.
- Yerel loopback `openclaw` yönetilen profili için CDP sağlık denetimleri, OpenClaw'ın kendi yerel denetim düzlemi için tarayıcı SSRF erişilebilirlik zorlamasını bilinçli olarak atlar.
- Gezinme koruması ayrıdır. Başarılı bir `start` veya `tabs` sonucu, daha sonra gelen bir `open` veya `navigate` hedefine izin verildiği anlamına gelmez.

Güvenlik rehberi:

- Tarayıcı SSRF politikasını varsayılan olarak gevşetmeyin.
- Geniş kapsamlı özel ağ erişimi yerine `hostnameAllowlist` veya `allowedHostnames` gibi dar kapsamlı ana makine istisnalarını tercih edin.
- `dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı erişiminin gerekli olduğu ve incelendiği, kasıtlı olarak güvenilen ortamlarda kullanın.

## Ajan araçları + denetimin nasıl çalıştığı

Ajan, tarayıcı otomasyonu için **tek bir araç** alır:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Nasıl eşlenir:

- `browser snapshot`, kararlı bir kullanıcı arayüzü ağacı (AI veya ARIA) döndürür.
- `browser act`, tıklamak/yazmak/sürüklemek/seçmek için anlık görüntü `ref` kimliklerini kullanır.
- `browser screenshot`, pikselleri yakalar (tam sayfa, öğe veya etiketli başvurular).
- `browser doctor`, Gateway, Plugin, profil, tarayıcı ve sekme hazırlık durumunu denetler.
- `browser` şunları kabul eder:
  - `profile`, adlandırılmış bir tarayıcı profili (openclaw, chrome veya uzak CDP) seçmek için.
  - `target` (`sandbox` | `host` | `node`), tarayıcının nerede bulunduğunu seçmek için.
  - Korumalı alan oturumlarında, `target: "host"` için `agents.defaults.sandbox.browser.allowHostControl=true` gerekir.
  - `target` belirtilmezse: korumalı alan oturumları varsayılan olarak `sandbox`, korumalı alan dışı oturumlar varsayılan olarak `host` kullanır.
  - Tarayıcı özellikli bir Node bağlıysa, `target="host"` veya `target="node"` ile sabitlemediğiniz sürece araç ona otomatik olarak yönlendirebilir.

Bu, ajanı deterministik tutar ve kırılgan seçicilerden kaçınır.

## İlgili

- [Araçlara Genel Bakış](/tr/tools) - kullanılabilir tüm ajan araçları
- [Korumalı Alana Alma](/tr/gateway/sandboxing) - korumalı alan ortamlarında tarayıcı denetimi
- [Güvenlik](/tr/gateway/security) - tarayıcı denetimi riskleri ve sıkılaştırma
