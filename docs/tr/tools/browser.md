---
read_when:
    - Ajan tarafından kontrol edilen tarayıcı otomasyonu ekleme
    - OpenClaw'ın kendi Chrome'unuza neden müdahale ettiğini hata ayıklamayla bulma
    - macOS uygulamasında tarayıcı ayarlarını ve yaşam döngüsünü uygulama
summary: Entegre tarayıcı kontrol hizmeti + eylem komutları
title: Tarayıcı (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-05-06T09:32:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3588ee1205d34df7604f1c660829c5f373b0fa76080d36c460f4ed4a08777a39
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw, aracının denetlediği **özel bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir.
Kişisel tarayıcınızdan yalıtılmıştır ve Gateway içindeki küçük bir yerel
denetim hizmeti üzerinden yönetilir (yalnızca loopback).

Başlangıç düzeyi görünüm:

- Bunu **ayrı, yalnızca aracıya özel bir tarayıcı** olarak düşünün.
- `openclaw` profili kişisel tarayıcı profilinize **dokunmaz**.
- Aracı güvenli bir hatta **sekmeler açabilir, sayfaları okuyabilir, tıklayabilir ve yazabilir**.
- Yerleşik `user` profili, Chrome MCP üzerinden gerçek oturum açılmış Chrome oturumunuza bağlanır.

## Ne elde edersiniz

- **openclaw** adlı ayrı bir tarayıcı profili (varsayılan olarak turuncu vurgu).
- Deterministik sekme denetimi (listele/aç/odaklan/kapat).
- Aracı eylemleri (tıkla/yaz/sürükle/seç), anlık görüntüler, ekran görüntüleri, PDF'ler.
- Tarayıcı Plugin etkinleştirildiğinde aracılara anlık görüntü,
  kararlı sekme, eski referans ve manuel engelleyici kurtarma döngüsünü öğreten paketlenmiş bir `browser-automation` skill'i.
- İsteğe bağlı çoklu profil desteği (`openclaw`, `work`, `remote`, ...).

Bu tarayıcı **günlük kullandığınız tarayıcı değildir**. Aracı otomasyonu ve
doğrulaması için güvenli, yalıtılmış bir yüzeydir.

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

`openclaw browser` tamamen eksikse veya aracı tarayıcı aracının
kullanılamadığını söylüyorsa [Eksik tarayıcı komutu veya aracı](/tr/tools/browser#missing-browser-command-or-tool) bölümüne geçin.

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

Varsayılanlar hem `plugins.entries.browser.enabled` **hem de** `browser.enabled=true` gerektirir. Yalnızca Plugin'i devre dışı bırakmak, `openclaw browser` CLI'sini, `browser.request` Gateway yöntemini, aracı aracını ve denetim hizmetini tek bir birim olarak kaldırır; `browser.*` yapılandırmanız bir yedek için olduğu gibi kalır.

Tarayıcı yapılandırma değişiklikleri, Plugin'in hizmetini yeniden kaydedebilmesi için Gateway'in yeniden başlatılmasını gerektirir.

## Aracı kılavuzu

Araç profili notu: `tools.profile: "coding"` `web_search` ve
`web_fetch` içerir, ancak tam `browser` aracını içermez. Aracı veya oluşturulmuş
bir alt aracı tarayıcı otomasyonu kullanmalıysa, profil aşamasında tarayıcıyı ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Tek bir aracı için `agents.list[].tools.alsoAllow: ["browser"]` kullanın.
`tools.subagents.tools.allow: ["browser"]` tek başına yeterli değildir, çünkü alt aracı
ilkesi profil filtrelemesinden sonra uygulanır.

Tarayıcı Plugin'i iki düzeyde aracı kılavuzu gönderir:

- `browser` araç açıklaması, her zaman açık olan kompakt sözleşmeyi taşır: doğru
  profili seçin, referansları aynı sekmede tutun, sekme hedefleme için
  `tabId`/etiketleri kullanın ve çok adımlı işler için tarayıcı skill'ini yükleyin.
- Paketlenmiş `browser-automation` skill'i daha uzun çalışma döngüsünü taşır:
  önce durumu/sekmeleri kontrol edin, görev sekmelerini etiketleyin, işlemden önce anlık görüntü alın, kullanıcı arayüzü değişikliklerinden sonra yeniden anlık görüntü alın, eski referansları bir kez kurtarın ve oturum açma/2FA/captcha veya
  kamera/mikrofon engelleyicilerini tahmin etmek yerine manuel eylem olarak bildirin.

Plugin ile paketlenmiş skill'ler, Plugin etkinleştirildiğinde aracının kullanılabilir Skills listesinde gösterilir. Tam skill yönergeleri talep üzerine yüklenir, bu nedenle rutin
turlar tam token maliyetini ödemez.

## Eksik tarayıcı komutu veya aracı

Yükseltmeden sonra `openclaw browser` bilinmiyorsa, `browser.request` eksikse veya aracı tarayıcı aracını kullanılamaz olarak bildiriyorsa, olağan neden `browser` içermeyen bir `plugins.allow` listesi ve kökte `browser` yapılandırma bloğunun olmamasıdır. Ekleyin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Örneğin `browser.enabled=true` veya `browser.profiles.<name>` gibi açık bir kök `browser` bloğu, kısıtlayıcı bir `plugins.allow` altında bile paketlenmiş tarayıcı Plugin'ini etkinleştirir ve kanal yapılandırma davranışıyla eşleşir. `plugins.entries.browser.enabled=true` ve `tools.alsoAllow: ["browser"]` kendi başlarına allowlist üyeliğinin yerine geçmez. `plugins.allow` öğesini tamamen kaldırmak da varsayılanı geri yükler.

## Profiller: `openclaw` ve `user`

- `openclaw`: yönetilen, yalıtılmış tarayıcı (uzantı gerekmez).
- `user`: **gerçek oturum açılmış Chrome** oturumunuz için yerleşik Chrome MCP bağlanma profili.

Aracı tarayıcı araç çağrıları için:

- Varsayılan: yalıtılmış `openclaw` tarayıcısını kullanın.
- Mevcut oturum açılmış oturumlar önemli olduğunda ve kullanıcı herhangi bir bağlanma istemini tıklamak/onaylamak için bilgisayar başındaysa `profile="user"` tercih edin.
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

- Denetim hizmeti, `gateway.port` değerinden türetilen bir bağlantı noktasında loopback'e bağlanır (varsayılan `18791` = gateway + 2). `gateway.port` veya `OPENCLAW_GATEWAY_PORT` değerinin geçersiz kılınması, türetilmiş bağlantı noktalarını aynı aile içinde kaydırır.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar; bunları yalnızca uzak CDP için ayarlayın. `cdpUrl`, ayarlanmadığında yönetilen yerel CDP bağlantı noktasına varsayılanlanır.
- `remoteCdpTimeoutMs`, uzak ve `attachOnly` CDP HTTP erişilebilirlik
  kontrollerine ve sekme açan HTTP isteklerine uygulanır; `remoteCdpHandshakeTimeoutMs` ise
  bunların CDP WebSocket el sıkışmalarına uygulanır.
- `localLaunchTimeoutMs`, yerel olarak başlatılmış yönetilen bir Chrome
  sürecinin CDP HTTP uç noktasını açığa çıkarması için ayrılan bütçedir. `localCdpReadyTimeoutMs`,
  süreç keşfedildikten sonra CDP WebSocket hazır olma durumu için takip bütçesidir.
  Chromium'un yavaş başladığı Raspberry Pi, düşük özellikli VPS veya eski donanımlarda
  bunları artırın. Değerler `120000` ms'ye kadar pozitif tam sayılar olmalıdır; geçersiz
  yapılandırma değerleri reddedilir.
- Tekrarlanan yönetilen Chrome başlatma/hazır olma hataları profil başına devre kesiciye alınır.
  Art arda birkaç hatadan sonra OpenClaw, her tarayıcı araç çağrısında Chromium başlatmak yerine yeni başlatma
  denemelerini kısa süre duraklatır. Başlatma sorununu düzeltin, gerekmiyorsa tarayıcıyı devre dışı bırakın veya onarımdan sonra
  Gateway'i yeniden başlatın.
- `actionTimeoutMs`, çağıran `timeoutMs` geçmediğinde tarayıcı `act` istekleri için varsayılan bütçedir. İstemci aktarımı küçük bir esneklik penceresi ekler, böylece uzun beklemeler HTTP sınırında zaman aşımına uğramak yerine tamamlanabilir.
- `tabCleanup`, birincil aracı tarayıcı oturumları tarafından açılan sekmeler için en iyi çaba temizliğidir. Alt aracı, cron ve ACP yaşam döngüsü temizliği yine de oturum sonunda açıkça izlenen sekmelerini kapatır; birincil oturumlar etkin sekmeleri yeniden kullanılabilir tutar, ardından arka planda boşta veya fazla izlenen sekmeleri kapatır.

</Accordion>

<Accordion title="SSRF policy">

- Tarayıcı gezintisi ve sekme açma, gezinti öncesinde SSRF korumalıdır ve son `http(s)` URL üzerinde sonrasında en iyi çabayla yeniden kontrol edilir.
- Katı SSRF modunda, uzak CDP uç nokta keşfi ve `/json/version` yoklamaları (`cdpUrl`) da kontrol edilir.
- Gateway/sağlayıcı `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve `NO_PROXY` ortam değişkenleri, OpenClaw tarafından yönetilen tarayıcıyı otomatik olarak proxy üzerinden geçirmez. Yönetilen Chrome varsayılan olarak doğrudan başlatılır, böylece sağlayıcı proxy ayarları tarayıcı SSRF kontrollerini zayıflatmaz.
- Yönetilen tarayıcının kendisini proxy üzerinden geçirmek için `browser.extraArgs` aracılığıyla `--proxy-server=...` veya `--proxy-pac-url=...` gibi açık Chrome proxy bayrakları geçirin. Katı SSRF modu, özel ağ tarayıcı erişimi kasıtlı olarak etkinleştirilmedikçe açık tarayıcı proxy yönlendirmesini engeller.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak kapalıdır; yalnızca özel ağ tarayıcı erişimi kasıtlı olarak güvenilir olduğunda etkinleştirin.
- `browser.ssrfPolicy.allowPrivateNetwork` eski uyumluluk takma adı olarak desteklenmeye devam eder.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true`, yerel bir tarayıcıyı asla başlatma; yalnızca zaten çalışıyorsa bağlan anlamına gelir.
- `headless` genel olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.headless` değerini geçersiz kılar; böylece yerel olarak başlatılan bir profil headless kalırken başka bir profil görünür kalabilir.
- `POST /start?headless=true` ve `openclaw browser start --headless`, `browser.headless` veya profil yapılandırmasını yeniden yazmadan yerel yönetilen profiller için
  tek seferlik bir headless başlatma ister. Mevcut oturum, yalnızca bağlanma ve
  uzak CDP profilleri bu geçersiz kılmayı reddeder; çünkü OpenClaw bu
  tarayıcı süreçlerini başlatmaz.
- `DISPLAY` veya `WAYLAND_DISPLAY` bulunmayan Linux ana makinelerinde, ortam ya da profil/genel
  yapılandırma headed modu açıkça seçmediğinde yerel yönetilen profiller
  otomatik olarak varsayılan şekilde headless olur. `openclaw browser status --json`
  `headlessSource` değerini `env`, `profile`, `config`,
  `request`, `linux-display-fallback` veya `default` olarak bildirir.
- `OPENCLAW_BROWSER_HEADLESS=1`, geçerli süreç için yerel yönetilen başlatmaları headless olmaya zorlar.
  `OPENCLAW_BROWSER_HEADLESS=0`, sıradan başlatmalar için headed modu zorlar
  ve görüntü sunucusu olmayan Linux ana makinelerinde işlem yapılabilir bir hata döndürür;
  açık bir `start --headless` isteği yine de o tek başlatma için önceliklidir.
- `executablePath` genel olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.executablePath` değerini geçersiz kılar; böylece farklı yönetilen profiller farklı Chromium tabanlı tarayıcılar başlatabilir. Her iki biçim de işletim sistemi ana dizininiz için `~` kabul eder.
- `color` (üst düzey ve profil başına), hangi profilin etkin olduğunu görebilmeniz için tarayıcı arayüzünü renklendirir.
- Varsayılan profil `openclaw`dır (yönetilen bağımsız). Oturum açmış kullanıcı tarayıcısını kullanmak için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: Chromium tabanlıysa sistem varsayılan tarayıcısı; aksi halde Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır. Bu sürücü için `cdpUrl` ayarlamayın.
- Mevcut oturum profili varsayılan olmayan bir Chromium kullanıcı profiline (Brave, Edge vb.) bağlanmalıysa `browser.profiles.<name>.userDataDir` ayarlayın. Bu yol da işletim sistemi ana dizininiz için `~` kabul eder.

</Accordion>

</AccordionGroup>

## Brave veya başka bir Chromium tabanlı tarayıcı kullanma

**Sistem varsayılan** tarayıcınız Chromium tabanlıysa (Chrome/Brave/Edge/vb.),
OpenClaw bunu otomatik olarak kullanır. Otomatik algılamayı geçersiz kılmak için
`browser.executablePath` ayarlayın. Üst düzey ve profil başına `executablePath`
değerleri, işletim sistemi ana dizininiz için `~` kabul eder:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Ya da bunu yapılandırmada, platform başına ayarlayın:

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

Profil başına `executablePath` yalnızca OpenClaw tarafından başlatılan yerel yönetilen profilleri
etkiler. `existing-session` profilleri bunun yerine zaten çalışan bir tarayıcıya
bağlanır ve uzak CDP profilleri `cdpUrl` arkasındaki tarayıcıyı kullanır.

## Yerel ve uzak denetim

- **Yerel denetim (varsayılan):** Gateway, local loopback denetim hizmetini başlatır ve yerel bir tarayıcı başlatabilir.
- **Uzak denetim (node ana makinesi):** tarayıcının bulunduğu makinede bir node ana makinesi çalıştırın; Gateway tarayıcı eylemlerini ona proxy eder.
- **Uzak CDP:** uzak bir Chromium tabanlı tarayıcıya
  bağlanmak için `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`) ayarlayın. Bu durumda OpenClaw yerel bir tarayıcı başlatmaz.
- local loopback üzerindeki harici olarak yönetilen CDP hizmetleri için (örneğin
  Docker içinde `127.0.0.1` adresine yayımlanan Browserless), ayrıca `attachOnly: true` ayarlayın. `attachOnly` olmadan local loopback CDP,
  yerel OpenClaw tarafından yönetilen bir tarayıcı profili olarak ele alınır.
- `headless` yalnızca OpenClaw tarafından başlatılan yerel yönetilen profilleri etkiler. Mevcut oturum veya uzak CDP tarayıcılarını yeniden başlatmaz ya da değiştirmez.
- `executablePath` aynı yerel yönetilen profil kuralını izler. Çalışan bir
  yerel yönetilen profilde bunu değiştirmek, sonraki başlatmanın yeni ikiliyi
  kullanması için o profili yeniden başlatma/uzlaştırma amacıyla işaretler.

Durdurma davranışı profil moduna göre değişir:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw tarafından
  başlatılan tarayıcı sürecini durdurur
- yalnızca bağlanma ve uzak CDP profilleri: `openclaw browser stop`, etkin
  denetim oturumunu kapatır ve Playwright/CDP öykünme geçersiz kılmalarını (görüntü alanı,
  renk şeması, yerel ayar, saat dilimi, çevrimdışı mod ve benzer durum) serbest bırakır;
  OpenClaw tarafından hiçbir tarayıcı süreci başlatılmamış olsa bile

Uzak CDP URL'leri kimlik doğrulama içerebilir:

- Sorgu belirteçleri (örn. `https://provider.example?token=<token>`)
- HTTP Basic auth (örn. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktalarını çağırırken ve CDP WebSocket'e bağlanırken
kimlik doğrulamayı korur. Belirteçleri yapılandırma dosyalarına commit etmek yerine
ortam değişkenlerini veya gizli bilgi yöneticilerini tercih edin.

## Node tarayıcı proxy'si (sıfır yapılandırmalı varsayılan)

Tarayıcınızın bulunduğu makinede bir **node ana makinesi** çalıştırıyorsanız, OpenClaw
ek tarayıcı yapılandırması olmadan tarayıcı araç çağrılarını otomatik olarak o node'a
yönlendirebilir. Bu, uzak Gateway'ler için varsayılan yoldur.

Notlar:

- Node ana makinesi, yerel tarayıcı denetim sunucusunu bir **proxy komutu** üzerinden sunar.
- Profiller, node'un kendi `browser.profiles` yapılandırmasından gelir (yerel ile aynı).
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için boş bırakın: profil oluşturma/silme rotaları dahil tüm yapılandırılmış profiller proxy üzerinden erişilebilir kalır.
- `nodeHost.browserProxy.allowProfiles` ayarlarsanız, OpenClaw bunu en az ayrıcalık sınırı olarak ele alır: yalnızca izin verilen listedeki profiller hedeflenebilir ve kalıcı profil oluşturma/silme rotaları proxy yüzeyinde engellenir.
- İstemiyorsanız devre dışı bırakın:
  - Node üzerinde: `nodeHost.browserProxy.enabled=false`
  - Gateway üzerinde: `gateway.nodes.browser.mode="off"`

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), HTTPS ve WebSocket üzerinden
CDP bağlantı URL'leri sunan barındırılan bir Chromium hizmetidir. OpenClaw her iki biçimi de kullanabilir, ancak
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

- `<BROWSERLESS_API_KEY>` yerine gerçek Browserless belirtecinizi koyun.
- Browserless hesabınızla eşleşen bölge uç noktasını seçin (belgelerine bakın).
- Browserless size bir HTTPS temel URL'si verirse, bunu doğrudan CDP bağlantısı için
  `wss://` biçimine dönüştürebilir veya HTTPS URL'sini koruyup OpenClaw'ın
  `/json/version` keşfetmesine izin verebilirsiniz.

### Aynı ana makinede Browserless Docker

Browserless Docker içinde kendi kendine barındırılıyorsa ve OpenClaw ana makinede çalışıyorsa,
Browserless'ı harici olarak yönetilen bir CDP hizmeti olarak ele alın:

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

`browser.profiles.browserless.cdpUrl` içindeki adres, OpenClaw sürecinden erişilebilir olmalıdır.
Browserless ayrıca eşleşen, erişilebilir bir uç nokta ilan etmelidir;
Browserless `EXTERNAL` değerini aynı herkese açık-OpenClaw WebSocket tabanına ayarlayın, örneğin
`ws://127.0.0.1:3000`, `ws://browserless:3000` veya kararlı bir özel Docker
ağ adresi. `/json/version`, OpenClaw'ın erişemediği bir adrese işaret eden
`webSocketDebuggerUrl` döndürürse, CDP HTTP sağlıklı görünebilirken WebSocket
bağlantısı yine de başarısız olur.

local loopback Browserless profili için `attachOnly` değerini ayarlanmamış bırakmayın.
`attachOnly` olmadan OpenClaw, local loopback bağlantı noktasını yerel yönetilen bir tarayıcı
profili olarak ele alır ve bağlantı noktasının kullanımda olduğunu ancak OpenClaw'a ait olmadığını bildirebilir.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılan tarayıcı hizmetleri, standart HTTP tabanlı CDP keşfi (`/json/version`) yerine
**doğrudan WebSocket** uç noktası sunar. OpenClaw üç
CDP URL biçimini kabul eder ve doğru bağlantı stratejisini otomatik olarak seçer:

- **HTTP(S) keşfi** - `http://host[:port]` veya `https://host[:port]`.
  OpenClaw, WebSocket hata ayıklayıcı URL'sini keşfetmek için `/json/version` çağırır, ardından
  bağlanır. WebSocket yedeği yoktur.
- **Doğrudan WebSocket uç noktaları** - `ws://host[:port]/devtools/<kind>/<id>` veya
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  yoluna sahip `wss://...`. OpenClaw doğrudan WebSocket el sıkışması üzerinden bağlanır ve
  `/json/version` tamamen atlar.
- **Çıplak WebSocket kökleri** - `/devtools/...` yolu olmayan
  `ws://host[:port]` veya `wss://host[:port]` (örn. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw önce HTTP
  `/json/version` keşfini dener (şemayı `http`/`https` olarak normalleştirerek);
  keşif bir `webSocketDebuggerUrl` döndürürse bu kullanılır, aksi halde OpenClaw
  çıplak kökte doğrudan WebSocket el sıkışmasına geri döner. İlan edilen
  WebSocket uç noktası CDP el sıkışmasını reddeder ancak yapılandırılmış çıplak kök
  bunu kabul ederse, OpenClaw o köke de geri döner. Bu, yerel Chrome'a işaret eden çıplak bir `ws://`
  adresinin yine de bağlanmasını sağlar; çünkü Chrome WebSocket yükseltmelerini yalnızca
  `/json/version` üzerinden gelen belirli hedef başına yolda kabul eder, barındırılan
  sağlayıcılar ise keşif uç noktaları Playwright CDP için uygun olmayan kısa ömürlü bir URL
  ilan ettiğinde kök WebSocket uç noktalarını kullanmaya devam edebilir.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözme, gizli mod ve konut
proxy'leriyle headless tarayıcılar çalıştırmaya yönelik bir bulut platformudur.

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

- [Kaydolun](https://www.browserbase.com/sign-up) ve **API Key** değerini
  [Overview dashboard](https://www.browserbase.com/overview) üzerinden kopyalayın.
- `<BROWSERBASE_API_KEY>` yerine gerçek Browserbase API anahtarınızı koyun.
- Browserbase, WebSocket bağlantısında otomatik olarak bir tarayıcı oturumu oluşturur; bu nedenle
  manuel oturum oluşturma adımı gerekmez.
- Ücretsiz katman, ayda bir eşzamanlı oturuma ve bir tarayıcı saatine izin verir.
  Ücretli plan sınırları için [pricing](https://www.browserbase.com/pricing) bölümüne bakın.
- Tam API referansı, SDK kılavuzları ve entegrasyon örnekleri için
  [Browserbase docs](https://docs.browserbase.com) bölümüne bakın.

## Güvenlik

Temel fikirler:

- Tarayıcı denetimi yalnızca loopback içindir; erişim Gateway'in kimlik doğrulaması veya node eşleştirmesi üzerinden akar.
- Bağımsız loopback tarayıcı HTTP API'si **yalnızca paylaşılan sır kimlik doğrulaması** kullanır:
  gateway token bearer auth, `x-openclaw-password` veya yapılandırılmış gateway parolasıyla HTTP Basic auth.
- Tailscale Serve kimlik başlıkları ve `gateway.auth.mode: "trusted-proxy"` bu bağımsız loopback tarayıcı API'sinde **kimlik doğrulaması yapmaz**.
- Tarayıcı denetimi etkinse ve paylaşılan sır kimlik doğrulaması yapılandırılmamışsa, OpenClaw başlangıçta `gateway.auth.token` değerini otomatik oluşturur ve yapılandırmaya kalıcı olarak kaydeder.
- OpenClaw, `gateway.auth.mode` zaten `password`, `none` veya `trusted-proxy` olduğunda bu token'ı otomatik oluşturmaz.
- Gateway'i ve tüm node ana makinelerini özel bir ağda (Tailscale) tutun; herkese açık maruziyetten kaçının.
- Uzak CDP URL'lerini/token'larını gizli bilgi olarak ele alın; env vars veya bir gizli bilgi yöneticisini tercih edin.

Uzak CDP ipuçları:

- Mümkün olduğunda şifreli uç noktaları (HTTPS veya WSS) ve kısa ömürlü token'ları tercih edin.
- Uzun ömürlü token'ları doğrudan yapılandırma dosyalarına gömmekten kaçının.

## Profiller (çoklu tarayıcı)

OpenClaw birden çok adlandırılmış profili (yönlendirme yapılandırmaları) destekler. Profiller şunlar olabilir:

- **openclaw-managed**: kendi kullanıcı veri dizinine + CDP portuna sahip ayrılmış Chromium tabanlı bir tarayıcı örneği
- **remote**: açık bir CDP URL'si (başka bir yerde çalışan Chromium tabanlı tarayıcı)
- **existing session**: Chrome DevTools MCP otomatik bağlanması üzerinden mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili eksikse otomatik oluşturulur.
- `user` profili, Chrome MCP mevcut oturum eklemesi için yerleşiktir.
- Mevcut oturum profilleri `user` dışında isteğe bağlıdır; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP portları varsayılan olarak **18800-18899** aralığından ayrılır.
- Bir profili silmek, yerel veri dizinini Çöp Kutusu'na taşır.

Tüm denetim uç noktaları `?profile=<name>` kabul eder; CLI `--browser-profile` kullanır.

## Chrome DevTools MCP üzerinden mevcut oturum

OpenClaw ayrıca resmi Chrome DevTools MCP sunucusu üzerinden çalışan Chromium tabanlı bir tarayıcı profiline eklenebilir. Bu, o tarayıcı profilinde zaten açık olan sekmeleri ve oturum açma durumunu yeniden kullanır.

Resmi arka plan ve kurulum başvuruları:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil:

- `user`

İsteğe bağlı: farklı bir ad, renk veya tarayıcı veri dizini istiyorsanız kendi özel mevcut oturum profilinizi oluşturun.

Varsayılan davranış:

- Yerleşik `user` profili, varsayılan yerel Google Chrome profilini hedefleyen Chrome MCP otomatik bağlanmasını kullanır.

Brave, Edge, Chromium veya varsayılan olmayan bir Chrome profili için `userDataDir` kullanın.
`~`, OS ana dizininize genişler:

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

1. Bu tarayıcının uzaktan hata ayıklama için inceleme sayfasını açın.
2. Uzaktan hata ayıklamayı etkinleştirin.
3. Tarayıcıyı çalışır durumda tutun ve OpenClaw eklendiğinde bağlantı istemini onaylayın.

Yaygın inceleme sayfaları:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Canlı ekleme duman testi:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Başarı şöyle görünür:

- `status`, `driver: existing-session` gösterir
- `status`, `transport: chrome-mcp` gösterir
- `status`, `running: true` gösterir
- `tabs`, zaten açık olan tarayıcı sekmelerinizi listeler
- `snapshot`, seçili canlı sekmeden ref'ler döndürür

Ekleme çalışmazsa kontrol edilecekler:

- hedef Chromium tabanlı tarayıcı sürümü `144+`
- uzaktan hata ayıklama, bu tarayıcının inceleme sayfasında etkin
- tarayıcı ekleme onay istemini gösterdi ve siz kabul ettiniz
- `openclaw doctor`, eski extension tabanlı tarayıcı yapılandırmasını taşır ve varsayılan otomatik bağlanma profilleri için Chrome'un yerel olarak kurulu olduğunu kontrol eder, ancak tarayıcı tarafında uzaktan hata ayıklamayı sizin için etkinleştiremez

Agent kullanımı:

- Kullanıcının oturum açmış tarayıcı durumuna ihtiyaç duyduğunuzda `profile="user"` kullanın.
- Özel bir mevcut oturum profili kullanıyorsanız, o açık profil adını iletin.
- Bu modu yalnızca kullanıcı ekleme istemini onaylamak için bilgisayar başındayken seçin.
- Gateway veya node ana makinesi `npx chrome-devtools-mcp@latest --autoConnect` başlatabilir

Notlar:

- Bu yol, oturum açmış tarayıcı oturumunuz içinde işlem yapabildiği için yalıtılmış `openclaw` profilinden daha yüksek risklidir.
- OpenClaw bu sürücü için tarayıcıyı başlatmaz; yalnızca eklenir.
- OpenClaw burada resmi Chrome DevTools MCP `--autoConnect` akışını kullanır. `userDataDir` ayarlanmışsa, bu kullanıcı veri dizinini hedeflemek için olduğu gibi iletilir.
- Mevcut oturum, seçili ana makinede veya bağlı bir tarayıcı node'u üzerinden eklenebilir. Chrome başka bir yerde bulunuyorsa ve bağlı tarayıcı node'u yoksa bunun yerine uzak CDP veya bir node ana makinesi kullanın.

### Özel Chrome MCP başlatma

Varsayılan `npx chrome-devtools-mcp@latest` akışı istediğiniz şey değilse (çevrimdışı ana makineler, sabitlenmiş sürümler, vendored ikililer) başlatılan Chrome DevTools MCP sunucusunu profil başına geçersiz kılın:

| Alan         | Ne yapar                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` yerine başlatılacak yürütülebilir dosya. Olduğu gibi çözümlenir; mutlak yollar dikkate alınır.                      |
| `mcpArgs`    | `mcpCommand` değerine aynen iletilen argüman dizisi. Varsayılan `chrome-devtools-mcp@latest --autoConnect` argümanlarının yerini alır. |

Mevcut oturum profilinde `cdpUrl` ayarlandığında, OpenClaw `--autoConnect` öğesini atlar ve uç noktayı otomatik olarak Chrome MCP'ye iletir:

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP keşif uç noktası).
- `ws(s)://...` → `--wsEndpoint <url>` (doğrudan CDP WebSocket).

Uç nokta bayrakları ve `userDataDir` birleştirilemez: `cdpUrl` ayarlandığında, Chrome MCP başlatması için `userDataDir` yok sayılır; çünkü Chrome MCP bir profil dizini açmak yerine uç noktanın arkasındaki çalışan tarayıcıya eklenir.

<Accordion title="Mevcut oturum özellik sınırlamaları">

Yönetilen `openclaw` profiline kıyasla, mevcut oturum sürücüleri daha sınırlıdır:

- **Ekran görüntüleri** - sayfa yakalamaları ve `--ref` öğe yakalamaları çalışır; CSS `--element` seçicileri çalışmaz. `--full-page`, `--ref` veya `--element` ile birleştirilemez. Sayfa veya ref tabanlı öğe ekran görüntüleri için Playwright gerekli değildir.
- **Eylemler** - `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select` snapshot ref'leri gerektirir (CSS seçicileri yoktur). `click-coords`, görünür viewport koordinatlarına tıklar ve snapshot ref'i gerektirmez. `click` yalnızca sol düğmedir. `type`, `slowly=true` desteklemez; `fill` veya `press` kullanın. `press`, `delayMs` desteklemez. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` ve `evaluate` çağrı başına zaman aşımı desteklemez. `select` tek bir değer kabul eder.
- **Bekleme / yükleme / dialog** - `wait --url` tam eşleşme, alt dize ve glob kalıplarını destekler; `wait --load networkidle` desteklenmez. Yükleme hook'ları `ref` veya `inputRef` gerektirir, tek seferde bir dosya, CSS `element` yoktur. Dialog hook'ları zaman aşımı geçersiz kılmalarını desteklemez.
- **Yalnızca yönetilen özellikler** - toplu eylemler, PDF dışa aktarma, indirme yakalama ve `responsebody` hâlâ yönetilen tarayıcı yolunu gerektirir.

</Accordion>

## Yalıtım garantileri

- **Ayrılmış kullanıcı veri dizini**: kişisel tarayıcı profilinize asla dokunmaz.
- **Ayrılmış portlar**: geliştirme iş akışlarıyla çakışmaları önlemek için `9222` kullanmaz.
- **Belirleyici sekme denetimi**: `tabs` önce `suggestedTargetId` döndürür, ardından `t1` gibi kararlı `tabId` tutamaçlarını, isteğe bağlı etiketleri ve ham `targetId` değerini döndürür. Agent'lar `suggestedTargetId` değerini yeniden kullanmalıdır; ham id'ler hata ayıklama ve uyumluluk için kullanılabilir kalır.

## Tarayıcı seçimi

Yerel olarak başlatırken, OpenClaw ilk kullanılabilir olanı seçer:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` ile geçersiz kılabilirsiniz.

Platformlar:

- macOS: `/Applications` ve `~/Applications` konumlarını kontrol eder.
- Linux: `/usr/bin`, `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` ve `/usr/lib/chromium-browser` altındaki yaygın Chrome/Brave/Edge/Chromium konumlarını kontrol eder.
- Windows: yaygın kurulum konumlarını kontrol eder.

## Denetim API'si (isteğe bağlı)

Betik oluşturma ve hata ayıklama için Gateway, küçük bir **yalnızca loopback HTTP denetim API'si** ve buna karşılık gelen `openclaw browser` CLI'sini (snapshot'lar, ref'ler, bekleme güçlendirmeleri, JSON çıktısı, hata ayıklama iş akışları) sunar. Tam başvuru için [Tarayıcı denetim API'si](/tr/tools/browser-control) bölümüne bakın.

## Sorun giderme

Linux'a özgü sorunlar (özellikle snap Chromium) için [Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting) bölümüne bakın.

WSL2 Gateway + Windows Chrome bölünmüş ana makine kurulumları için [WSL2 + Windows + uzak Chrome CDP sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting) bölümüne bakın.

### CDP başlangıç hatası ile gezinme SSRF engeli

Bunlar farklı hata sınıflarıdır ve farklı kod yollarını işaret eder.

- **CDP başlangıç veya hazır olma hatası**, OpenClaw'ın tarayıcı denetim düzleminin sağlıklı olduğunu doğrulayamadığı anlamına gelir.
- **Gezinme SSRF engeli**, tarayıcı denetim düzleminin sağlıklı olduğu, ancak bir sayfa gezinme hedefinin ilke tarafından reddedildiği anlamına gelir.

Yaygın örnekler:

- CDP başlangıç veya hazır olma hatası:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - loopback harici CDP hizmeti `attachOnly: true` olmadan yapılandırıldığında `Port <port> is in use for profile "<name>" but not by openclaw`
- Gezinme SSRF engeli:
  - `open`, `navigate`, snapshot veya sekme açma akışları, `start` ve `tabs` hâlâ çalışırken bir tarayıcı/ağ ilkesi hatasıyla başarısız olur

İkisini ayırmak için şu en küçük diziyi kullanın:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Sonuçlar nasıl okunur:

- `start`, `not reachable after start` ile başarısız olursa önce CDP hazır olma durumunu sorun giderin.
- `start` başarılı olur ama `tabs` başarısız olursa denetim düzlemi hâlâ sağlıksızdır. Bunu bir sayfa gezinme sorunu değil, CDP erişilebilirliği sorunu olarak ele alın.
- `start` ve `tabs` başarılı olur ama `open` veya `navigate` başarısız olursa tarayıcı denetim düzlemi çalışır durumdadır ve hata gezinme ilkesinde veya hedef sayfadadır.
- `start`, `tabs` ve `open` tümü başarılı olursa temel yönetilen tarayıcı denetim yolu sağlıklıdır.

Önemli davranış ayrıntıları:

- Tarayıcı yapılandırması, `browser.ssrfPolicy` yapılandırmasanız bile varsayılan olarak hata durumunda kapalı bir SSRF ilke nesnesine ayarlanır.
- Yerel loopback `openclaw` yönetilen profili için CDP sağlık denetimleri, OpenClaw'ın kendi yerel denetim düzlemi için tarayıcı SSRF erişilebilirliği zorlamasını kasıtlı olarak atlar.
- Gezinme koruması ayrıdır. Başarılı bir `start` veya `tabs` sonucu, daha sonraki bir `open` veya `navigate` hedefinin izinli olduğu anlamına gelmez.

Güvenlik rehberi:

- Tarayıcı SSRF ilkesini varsayılan olarak **gevşetmeyin**.
- Geniş özel ağ erişimi yerine `hostnameAllowlist` veya `allowedHostnames` gibi dar ana makine istisnalarını tercih edin.
- `dangerouslyAllowPrivateNetwork: true` seçeneğini yalnızca özel ağ tarayıcı erişiminin gerekli olduğu ve incelendiği, kasıtlı olarak güvenilen ortamlarda kullanın.

## Agent araçları + denetimin çalışma şekli

Agent, tarayıcı otomasyonu için **tek araç** alır:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Nasıl eşlenir:

- `browser snapshot` kararlı bir UI ağacı döndürür (AI veya ARIA).
- `browser act`, tıklamak/yazmak/sürüklemek/seçmek için anlık görüntüdeki `ref` kimliklerini kullanır.
- `browser screenshot` pikselleri yakalar (tam sayfa, öğe veya etiketli ref’ler).
- `browser doctor` Gateway, Plugin, profil, tarayıcı ve sekme hazır olma durumunu denetler.
- `browser` şunları kabul eder:
  - Adlandırılmış bir tarayıcı profili (openclaw, chrome veya uzak CDP) seçmek için `profile`.
  - Tarayıcının nerede bulunduğunu seçmek için `target` (`sandbox` | `host` | `node`).
  - Korumalı alan oturumlarında, `target: "host"` için `agents.defaults.sandbox.browser.allowHostControl=true` gerekir.
  - `target` atlanırsa: korumalı alan oturumları varsayılan olarak `sandbox`, korumalı alan olmayan oturumlar varsayılan olarak `host` kullanır.
  - Tarayıcı özellikli bir node bağlıysa, `target="host"` veya `target="node"` ile sabitlemediğiniz sürece araç ona otomatik olarak yönlendirme yapabilir.

Bu, agent’ı deterministik tutar ve kırılgan seçicilerden kaçınır.

## İlgili

- [Araçlara Genel Bakış](/tr/tools) - mevcut tüm agent araçları
- [Korumalı Alan](/tr/gateway/sandboxing) - korumalı alan ortamlarında tarayıcı kontrolü
- [Güvenlik](/tr/gateway/security) - tarayıcı kontrolü riskleri ve sağlamlaştırma
