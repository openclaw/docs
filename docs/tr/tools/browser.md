---
read_when:
    - Ajan kontrollü tarayıcı otomasyonu ekleme
    - openclaw'un kendi Chrome'unuza neden müdahale ettiğini hata ayıklama
    - macOS uygulamasında tarayıcı ayarlarını + yaşam döngüsünü uygulama
summary: Entegre tarayıcı kontrol hizmeti + eylem komutları
title: Tarayıcı (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-04-26T11:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: aba4c06f351296145b7a282bb692c2d10dba0668f90aabf1d981fb18199c3d74
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw, ajanın kontrol ettiği **ayrılmış bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir.
Bu profil kişisel tarayıcınızdan yalıtılmıştır ve Gateway içindeki küçük bir yerel
kontrol hizmeti üzerinden yönetilir (yalnızca loopback).

Başlangıç düzeyinde bakış:

- Bunu **ayrı, yalnızca ajana ait bir tarayıcı** gibi düşünün.
- `openclaw` profili kişisel tarayıcı profilinize **dokunmaz**.
- Ajan güvenli bir hatta **sekme açabilir, sayfaları okuyabilir, tıklayabilir ve yazı yazabilir**.
- Yerleşik `user` profili, Chrome MCP aracılığıyla gerçek oturum açmış Chrome oturumunuza bağlanır.

## Elde ettikleriniz

- **openclaw** adlı ayrı bir tarayıcı profili (varsayılan olarak turuncu vurgu).
- Deterministik sekme kontrolü (listele/aç/odaklan/kapat).
- Ajan eylemleri (tıkla/yaz/sürükle/seç), snapshot'lar, ekran görüntüleri, PDF'ler.
- Tarayıcı Plugin'i etkin olduğunda ajanlara snapshot,
  kararlı sekme, stale-ref ve manuel engelleyici kurtarma döngüsünü öğreten paketlenmiş bir `browser-automation` Skill.
- İsteğe bağlı çoklu profil desteği (`openclaw`, `work`, `remote`, ...).

Bu tarayıcı sizin **günlük kullandığınız tarayıcı değildir**. Bu,
ajan otomasyonu ve doğrulama için güvenli, yalıtılmış bir yüzeydir.

## Hızlı başlangıç

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled” alırsanız, bunu yapılandırmada etkinleştirin (aşağıya bakın) ve
Gateway'i yeniden başlatın.

`openclaw browser` tamamen yoksa veya ajan tarayıcı aracının
kullanılamadığını söylüyorsa, [Eksik tarayıcı komutu veya aracı](/tr/tools/browser#missing-browser-command-or-tool) bölümüne geçin.

## Plugin denetimi

Varsayılan `browser` aracı paketlenmiş bir Plugin'dir. Aynı `browser` araç adını kaydeden başka bir Plugin ile değiştirmek için bunu devre dışı bırakın:

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

Varsayılanların hem `plugins.entries.browser.enabled` hem de `browser.enabled=true` değerine ihtiyacı vardır. Yalnızca Plugin'i devre dışı bırakmak, `openclaw browser` CLI'sını, `browser.request` Gateway yöntemini, ajan aracını ve kontrol hizmetini tek bir birim olarak kaldırır; `browser.*` yapılandırmanız bir yedek için bozulmadan kalır.

Tarayıcı yapılandırma değişiklikleri, Plugin'in hizmetini yeniden kaydedebilmesi için Gateway yeniden başlatması gerektirir.

## Ajan yönlendirmesi

Araç profili notu: `tools.profile: "coding"` `web_search` ve
`web_fetch` içerir, ancak tam `browser` aracını içermez. Ajan veya
başlatılmış bir alt ajan tarayıcı otomasyonu kullanacaksa, tarayıcıyı profil
aşamasında ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Tek bir ajan için `agents.list[].tools.alsoAllow: ["browser"]` kullanın.
Yalnızca `tools.subagents.tools.allow: ["browser"]` yeterli değildir çünkü alt ajan
ilkesi profil filtrelemesinden sonra uygulanır.

Tarayıcı Plugin'i iki düzeyde ajan yönlendirmesi sağlar:

- `browser` araç açıklaması, her zaman etkin olan kısa sözleşmeyi taşır: doğru
  profili seç, ref'leri aynı sekmede tut, sekme hedefleme için `tabId`/etiketleri kullan
  ve çok adımlı işler için tarayıcı Skill'ini yükle.
- Paketlenmiş `browser-automation` Skill daha uzun işletim döngüsünü taşır:
  önce durumu/sekmeleri denetle, görev sekmelerini etiketle, eylemden önce snapshot al,
  UI değişikliklerinden sonra yeniden snapshot al, stale ref'i bir kez kurtar ve
  giriş/2FA/captcha veya kamera/mikrofon engellerini tahmin etmek yerine manuel
  eylem olarak bildir.

Plugin ile paketlenmiş Skills, Plugin etkin olduğunda ajanın kullanılabilir Skills listesinde gösterilir. Tam Skill talimatları isteğe bağlı olarak yüklenir, böylece rutin dönüşler tam token maliyetini ödemez.

## Eksik tarayıcı komutu veya aracı

Bir yükseltmeden sonra `openclaw browser` bilinmiyorsa, `browser.request` eksikse veya ajan tarayıcı aracının kullanılamadığını bildiriyorsa, olağan neden `browser` içermeyen bir `plugins.allow` listesidir. Bunu ekleyin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` ve `tools.alsoAllow: ["browser"]` allowlist üyeliğinin yerini tutmaz — allowlist Plugin yüklemeyi kapılar ve araç ilkesi yalnızca yüklemeden sonra çalışır. `plugins.allow` alanını tamamen kaldırmak da varsayılanı geri yükler.

## Profiller: `openclaw` ve `user`

- `openclaw`: yönetilen, yalıtılmış tarayıcı (uzantı gerekmez).
- `user`: **gerçek oturum açmış Chrome**
  oturumunuz için yerleşik Chrome MCP bağlanma profili.

Ajan tarayıcı araç çağrıları için:

- Varsayılan: yalıtılmış `openclaw` tarayıcısını kullanın.
- Mevcut oturum açmış oturumlar önemliyse ve kullanıcı
  herhangi bir bağlanma istemini tıklamak/onaylamak için bilgisayar başındaysa `profile="user"` tercih edin.
- Belirli bir tarayıcı modu istediğinizde `profile` açık geçersiz kılmadır.

Varsayılan olarak yönetilen modu istiyorsanız `browser.defaultProfile: "openclaw"` ayarlayın.

## Yapılandırma

Tarayıcı ayarları `~/.openclaw/openclaw.json` içinde bulunur.

```json5
{
  browser: {
    enabled: true, // varsayılan: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // yalnızca güvenilen özel ağ erişimi için etkinleştirin
      // allowPrivateNetwork: true, // eski takma ad
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // eski tek profil geçersiz kılması
    remoteCdpTimeoutMs: 1500, // uzak CDP HTTP zaman aşımı (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // uzak CDP WebSocket el sıkışma zaman aşımı (ms)
    localLaunchTimeoutMs: 15000, // yerel yönetilen Chrome keşif zaman aşımı (ms)
    localCdpReadyTimeoutMs: 8000, // yerel yönetilen başlatma sonrası CDP hazır olma zaman aşımı (ms)
    actionTimeoutMs: 60000, // varsayılan tarayıcı act zaman aşımı (ms)
    tabCleanup: {
      enabled: true, // varsayılan: true
      idleMinutes: 120, // boşta temizlemeyi devre dışı bırakmak için 0 ayarlayın
      maxTabsPerSession: 8, // oturum başına sınırı devre dışı bırakmak için 0 ayarlayın
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

<Accordion title="Bağlantı noktaları ve erişilebilirlik">

- Kontrol hizmeti, `gateway.port` değerinden türetilmiş bir bağlantı noktasında loopback'e bağlanır (varsayılan `18791` = gateway + 2). `gateway.port` veya `OPENCLAW_GATEWAY_PORT` geçersiz kılınırsa, türetilmiş bağlantı noktaları aynı aile içinde kayar.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar; bunları yalnızca uzak CDP için ayarlayın. `cdpUrl`, ayarlanmamışsa yönetilen yerel CDP bağlantı noktasına varsayılan olur.
- `remoteCdpTimeoutMs`, uzak ve `attachOnly` CDP HTTP erişilebilirlik
  denetimlerine ve sekme açma HTTP isteklerine uygulanır; `remoteCdpHandshakeTimeoutMs` ise
  bunların CDP WebSocket el sıkışmalarına uygulanır.
- `localLaunchTimeoutMs`, yerel olarak başlatılan yönetilen Chrome
  sürecinin CDP HTTP uç noktasını açığa çıkarması için ayrılan süredir. `localCdpReadyTimeoutMs`,
  süreç keşfedildikten sonra CDP websocket hazır olma için ayrılan takip süresidir.
  Chromium'un yavaş başladığı Raspberry Pi, düşük seviye VPS veya eski donanımda
  bunları artırın. Değerler `120000` ms'ye kadar pozitif tam sayılar olmalıdır; geçersiz
  yapılandırma değerleri reddedilir.
- `actionTimeoutMs`, çağıran `timeoutMs` geçmediğinde tarayıcı `act` istekleri için varsayılan süredir. İstemci taşıması küçük bir ek tolerans penceresi ekler; böylece uzun beklemeler HTTP sınırında zaman aşımına uğramak yerine tamamlanabilir.
- `tabCleanup`, birincil ajan tarayıcı oturumları tarafından açılan sekmeler için en iyi çaba ile temizliktir. Alt ajan, Cron ve ACP yaşam döngüsü temizliği, oturum sonunda açıkça izlenen sekmelerini yine kapatır; birincil oturumlar etkin sekmeleri yeniden kullanılabilir tutar, sonra boşta veya fazla izlenen sekmeleri arka planda kapatır.

</Accordion>

<Accordion title="SSRF ilkesi">

- Tarayıcı gezinmesi ve sekme açma, gezinmeden önce SSRF korumalıdır ve ardından son `http(s)` URL'sinde mümkün olan en iyi şekilde yeniden denetlenir.
- Katı SSRF modunda, uzak CDP uç nokta keşfi ve `/json/version` yoklamaları (`cdpUrl`) da denetlenir.
- Gateway/sağlayıcı `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve `NO_PROXY` ortam değişkenleri OpenClaw tarafından yönetilen tarayıcıyı otomatik olarak proxy'lemez. Yönetilen Chrome varsayılan olarak doğrudan başlatılır; böylece sağlayıcı proxy ayarları tarayıcı SSRF denetimlerini zayıflatmaz.
- Yönetilen tarayıcının kendisini proxy'lemek için `browser.extraArgs` üzerinden `--proxy-server=...` veya `--proxy-pac-url=...` gibi açık Chrome proxy bayrakları geçin. Katı SSRF modu, özel ağ tarayıcı erişimi bilerek etkinleştirilmedikçe açık tarayıcı proxy yönlendirmesini engeller.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak kapalıdır; yalnızca özel ağ tarayıcı erişimine bilinçli olarak güvenildiğinde etkinleştirin.
- `browser.ssrfPolicy.allowPrivateNetwork`, eski bir takma ad olarak desteklenmeye devam eder.

</Accordion>

<Accordion title="Profil davranışı">

- `attachOnly: true`, asla yerel bir tarayıcı başlatma anlamına gelir; yalnızca zaten çalışıyorsa bağlanır.
- `headless` genel veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.headless` değerini geçersiz kılar; böylece yerel olarak başlatılan bir profil headless kalırken diğeri görünür olabilir.
- `POST /start?headless=true` ve `openclaw browser start --headless`,
  `browser.headless` veya profil yapılandırmasını yeniden yazmadan yerel yönetilen profiller için
  tek seferlik bir headless başlatma ister. Existing-session, attach-only ve
  uzak CDP profilleri bu geçersiz kılmayı reddeder çünkü OpenClaw bu
  tarayıcı süreçlerini başlatmaz.
- `DISPLAY` veya `WAYLAND_DISPLAY` olmayan Linux ana bilgisayarlarda, ortam ya da profil/genel
  yapılandırma açıkça headed modu seçmediğinde yerel yönetilen profiller varsayılan olarak otomatik headless olur. `openclaw browser status --json`
  `headlessSource` değerini `env`, `profile`, `config`,
  `request`, `linux-display-fallback` veya `default` olarak bildirir.
- `OPENCLAW_BROWSER_HEADLESS=1`, geçerli süreç için yerel yönetilen başlatmaları headless olmaya zorlar. `OPENCLAW_BROWSER_HEADLESS=0`, sıradan başlatmalar için headed modu zorlar
  ve görüntü sunucusu olmayan Linux ana bilgisayarlarda eyleme dönüştürülebilir bir hata döndürür;
  açık bir `start --headless` isteği yine de o tek başlatma için önceliklidir.
- `executablePath` genel olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.executablePath` değerini geçersiz kılar; böylece farklı yönetilen profiller farklı Chromium tabanlı tarayıcılar başlatabilir. Her iki biçim de işletim sisteminizin ana dizini için `~` kabul eder.
- `color` (üst düzey ve profil başına) tarayıcı UI'sını renklendirir; böylece hangi profilin etkin olduğunu görebilirsiniz.
- Varsayılan profil `openclaw`'dır (yönetilen bağımsız). Oturum açmış kullanıcı tarayıcısını tercih etmek için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: Chromium tabanlıysa sistem varsayılan tarayıcısı; aksi halde Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır. Bu sürücü için `cdpUrl` ayarlamayın.
- Existing-session profilinin varsayılan olmayan bir Chromium kullanıcı profiline (Brave, Edge vb.) bağlanması gerekiyorsa `browser.profiles.<name>.userDataDir` ayarlayın. Bu yol da işletim sisteminizin ana dizini için `~` kabul eder.

</Accordion>

</AccordionGroup>

## Brave kullanın (veya başka bir Chromium tabanlı tarayıcı)

**Sistem varsayılanı** tarayıcınız Chromium tabanlıysa (Chrome/Brave/Edge/vb.),
OpenClaw bunu otomatik olarak kullanır. Otomatik algılamayı geçersiz kılmak için `browser.executablePath` ayarlayın. Üst düzey ve profil başına `executablePath` değerleri işletim sisteminizin ana dizini için `~`
kabul eder:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Veya bunu yapılandırmada, platforma göre ayarlayın:

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

Profil başına `executablePath`, yalnızca OpenClaw'ın
başlattığı yerel yönetilen profilleri etkiler. `existing-session` profilleri bunun yerine zaten çalışan bir tarayıcıya
bağlanır ve uzak CDP profilleri `cdpUrl` arkasındaki tarayıcıyı kullanır.

## Yerel ve uzak kontrol

- **Yerel kontrol (varsayılan):** Gateway loopback kontrol hizmetini başlatır ve yerel bir tarayıcı başlatabilir.
- **Uzak kontrol (Node ana bilgisayarı):** tarayıcının bulunduğu makinede bir Node ana bilgisayarı çalıştırın; Gateway tarayıcı eylemlerini ona proxy'ler.
- **Uzak CDP:** uzak bir Chromium tabanlı tarayıcıya bağlanmak için `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`) ayarlayın. Bu durumda OpenClaw yerel bir tarayıcı başlatmaz.
- Loopback üzerinde haricen yönetilen CDP hizmetleri için (örneğin
  Docker içinde yayımlanmış Browserless `127.0.0.1` üzerinde), ayrıca `attachOnly: true` ayarlayın. `attachOnly` olmadan loopback CDP, yerel OpenClaw yönetimli tarayıcı profili olarak değerlendirilir.
- `headless` yalnızca OpenClaw'ın başlattığı yerel yönetilen profilleri etkiler. Mevcut oturumları veya uzak CDP tarayıcılarını yeniden başlatmaz ya da değiştirmez.
- `executablePath` aynı yerel yönetilen profil kuralını izler. Bunu çalışan bir
  yerel yönetilen profilde değiştirmek, bir sonraki başlatmanın yeni ikiliyi kullanması için
  o profili yeniden başlatma/uyumlandırma için işaretler.

Durdurma davranışı profil moduna göre değişir:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw'ın
  başlattığı tarayıcı sürecini durdurur
- yalnızca bağlanmalı ve uzak CDP profilleri: `openclaw browser stop`, etkin
  kontrol oturumunu kapatır ve Playwright/CDP öykünme geçersiz kılmalarını (viewport,
  renk şeması, yerel ayar, saat dilimi, çevrimdışı mod ve benzer durumları) serbest bırakır;
  OpenClaw tarafından hiçbir tarayıcı süreci başlatılmamış olsa bile

Uzak CDP URL'leri auth içerebilir:

- Sorgu token'ları (ör. `https://provider.example?token=<token>`)
- HTTP Basic auth (ör. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktalarını çağırırken ve
CDP WebSocket'e bağlanırken auth'ı korur. Token'ları yapılandırma dosyalarına commit etmek yerine
ortam değişkenlerini veya gizli bilgi yöneticilerini tercih edin.

## Node tarayıcı proxy'si (sıfır yapılandırmalı varsayılan)

Tarayıcınızın bulunduğu makinede bir **Node ana bilgisayarı** çalıştırırsanız, OpenClaw
tarayıcı araç çağrılarını ek tarayıcı yapılandırması olmadan otomatik olarak bu node'a yönlendirebilir.
Bu, uzak gateway'ler için varsayılan yoldur.

Notlar:

- Node ana bilgisayarı, yerel tarayıcı kontrol sunucusunu bir **proxy komutu** aracılığıyla açığa çıkarır.
- Profiller, node'un kendi `browser.profiles` yapılandırmasından gelir (yerel ile aynı).
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için bunu boş bırakın: profil oluşturma/silme rotaları dahil olmak üzere tüm yapılandırılmış profiller proxy üzerinden erişilebilir kalır.
- `nodeHost.browserProxy.allowProfiles` ayarlarsanız, OpenClaw bunu en az ayrıcalık sınırı olarak ele alır: yalnızca allowlist'teki profiller hedeflenebilir ve kalıcı profil oluşturma/silme rotaları proxy yüzeyinde engellenir.
- İstemiyorsanız devre dışı bırakın:
  - Node üzerinde: `nodeHost.browserProxy.enabled=false`
  - Gateway üzerinde: `gateway.nodes.browser.mode="off"`

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), CDP bağlantı URL'lerini HTTPS ve WebSocket üzerinden açığa çıkaran barındırılmış bir Chromium hizmetidir. OpenClaw her iki biçimi de kullanabilir, ancak
uzak tarayıcı profili için en basit seçenek Browserless'ın bağlantı belgelerindeki doğrudan WebSocket URL'sidir.

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

- `<BROWSERLESS_API_KEY>` yerine gerçek Browserless token'ınızı koyun.
- Browserless hesabınızla eşleşen bölge uç noktasını seçin (belgelerine bakın).
- Browserless size bir HTTPS temel URL'si veriyorsa, bunu doğrudan CDP bağlantısı için
  `wss://` biçimine dönüştürebilir veya HTTPS URL'sini koruyup OpenClaw'ın
  `/json/version` değerini keşfetmesine izin verebilirsiniz.

### Aynı ana bilgisayarda Browserless Docker

Browserless Docker içinde kendi kendine barındırılıyorsa ve OpenClaw ana bilgisayarda çalışıyorsa, Browserless'ı haricen yönetilen bir CDP hizmeti olarak ele alın:

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

`browser.profiles.browserless.cdpUrl` içindeki adres,
OpenClaw sürecinden erişilebilir olmalıdır. Browserless ayrıca eşleşen erişilebilir bir uç noktayı duyurmalıdır;
Browserless `EXTERNAL` değerini OpenClaw'a açık aynı WebSocket temeline ayarlayın; örneğin
`ws://127.0.0.1:3000`, `ws://browserless:3000` veya kararlı bir özel Docker
ağ adresi. `/json/version`, `webSocketDebuggerUrl` değerini OpenClaw'ın erişemeyeceği
bir adrese işaret ederek döndürürse, CDP HTTP sağlıklı görünebilirken WebSocket
bağlanması yine başarısız olabilir.

Loopback Browserless profili için `attachOnly` değerini ayarsız bırakmayın. `attachOnly`
olmadan OpenClaw loopback bağlantı noktasını yerel yönetilen tarayıcı
profili olarak değerlendirir ve bağlantı noktasının kullanımda olduğunu ama OpenClaw'a ait olmadığını bildirebilir.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılmış tarayıcı hizmetleri, standart HTTP tabanlı CDP keşfi (`/json/version`) yerine **doğrudan WebSocket** uç noktası açığa çıkarır. OpenClaw üç
CDP URL biçimini kabul eder ve doğru bağlantı stratejisini otomatik olarak seçer:

- **HTTP(S) keşfi** — `http://host[:port]` veya `https://host[:port]`.
  OpenClaw WebSocket hata ayıklayıcı URL'sini keşfetmek için `/json/version` çağırır,
  sonra bağlanır. WebSocket geri dönüşü yoktur.
- **Doğrudan WebSocket uç noktaları** — `ws://host[:port]/devtools/<kind>/<id>` veya
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  yoluna sahip `wss://...`. OpenClaw doğrudan WebSocket el sıkışmasıyla bağlanır ve
  `/json/version` adımını tamamen atlar.
- **Çıplak WebSocket kökleri** — `ws://host[:port]` veya `wss://host[:port]`, `/devtools/...` yolu olmadan
  (ör. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw önce HTTP
  `/json/version` keşfini dener (`http`/`https` şemasına normalize ederek);
  keşif bir `webSocketDebuggerUrl` döndürürse bu kullanılır, aksi durumda OpenClaw
  çıplak kökte doğrudan WebSocket el sıkışmasına geri döner. Duyurulan
  WebSocket uç noktası CDP el sıkışmasını reddeder ama yapılandırılmış çıplak kök
  kabul ederse, OpenClaw bu köke de geri döner. Bu, yerel bir Chrome'u işaret eden çıplak bir `ws://`
  değerinin yine bağlanabilmesini sağlar; çünkü Chrome yalnızca WebSocket
  yükseltmelerini `/json/version` içindeki belirli hedef başına yolda kabul ederken,
  barındırılan sağlayıcılar keşif
  uç noktaları Playwright CDP için uygun olmayan kısa ömürlü bir URL duyurduğunda bile kök WebSocket uç noktalarını kullanabilir.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözme, gizlilik modu ve konut proxy'leriyle
headless tarayıcılar çalıştırmak için bir bulut platformudur.

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

- [Kaydolun](https://www.browserbase.com/sign-up) ve **API Key**'inizi
  [Overview dashboard](https://www.browserbase.com/overview) içinden kopyalayın.
- `<BROWSERBASE_API_KEY>` yerine gerçek Browserbase API anahtarınızı koyun.
- Browserbase, WebSocket bağlantısında otomatik olarak bir tarayıcı oturumu oluşturur, bu nedenle
  elle oturum oluşturma adımı gerekmez.
- Ücretsiz katman ayda bir eşzamanlı oturum ve bir tarayıcı saatine izin verir.
  Ücretli plan sınırları için [pricing](https://www.browserbase.com/pricing) bölümüne bakın.
- Tam API
  başvurusu, SDK kılavuzları ve entegrasyon örnekleri için [Browserbase docs](https://docs.browserbase.com) bölümüne bakın.

## Güvenlik

Temel fikirler:

- Tarayıcı denetimi yalnızca loopback'tir; erişim Gateway auth veya node eşlemesi üzerinden akar.
- Bağımsız loopback tarayıcı HTTP API'si **yalnızca paylaşılan gizli anahtar auth** kullanır:
  gateway token bearer auth, `x-openclaw-password` veya
  yapılandırılmış gateway parolasıyla HTTP Basic auth.
- Tailscale Serve kimlik üst bilgileri ve `gateway.auth.mode: "trusted-proxy"`
  bu bağımsız loopback tarayıcı API'sinde **kimlik doğrulamaz**.
- Tarayıcı denetimi etkinse ve yapılandırılmış bir paylaşılan gizli anahtar auth yoksa, OpenClaw
  başlangıçta otomatik olarak `gateway.auth.token` üretir ve bunu yapılandırmaya kaydeder.
- OpenClaw, `gateway.auth.mode`
  zaten `password`, `none` veya `trusted-proxy` olduğunda bu token'ı otomatik üretmez.
- Gateway'i ve herhangi bir node ana bilgisayarını özel bir ağda (Tailscale) tutun; herkese açık erişimden kaçının.
- Uzak CDP URL'lerini/token'larını gizli bilgi olarak değerlendirin; ortam değişkenlerini veya bir gizli bilgi yöneticisini tercih edin.

Uzak CDP ipuçları:

- Mümkün olduğunda şifreli uç noktaları (HTTPS veya WSS) ve kısa ömürlü token'ları tercih edin.
- Uzun ömürlü token'ları doğrudan yapılandırma dosyalarına gömmekten kaçının.

## Profiller (çoklu tarayıcı)

OpenClaw birden çok adlandırılmış profili (yönlendirme yapılandırmaları) destekler. Profiller şunlar olabilir:

- **OpenClaw tarafından yönetilen**: kendi kullanıcı verisi dizinine + CDP bağlantı noktasına sahip ayrılmış bir Chromium tabanlı tarayıcı örneği
- **uzak**: açık bir CDP URL'si (başka bir yerde çalışan Chromium tabanlı tarayıcı)
- **mevcut oturum**: Chrome DevTools MCP otomatik bağlanma üzerinden mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili eksikse otomatik oluşturulur.
- `user` profili, Chrome MCP existing-session bağlanması için yerleşiktir.
- Existing-session profilleri `user` dışında isteğe bağlıdır; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP bağlantı noktaları varsayılan olarak **18800–18899** aralığından atanır.
- Bir profil silindiğinde yerel veri dizini Çöp Kutusu'na taşınır.

Tüm denetim uç noktaları `?profile=<name>` kabul eder; CLI ise `--browser-profile` kullanır.

## Chrome DevTools MCP üzerinden mevcut oturum

OpenClaw ayrıca resmi Chrome DevTools MCP sunucusu üzerinden çalışan bir Chromium tabanlı tarayıcı profiline bağlanabilir. Bu, o tarayıcı profilinde
zaten açık olan sekmeleri ve giriş durumunu yeniden kullanır.

Resmî arka plan ve kurulum başvuruları:

- [Chrome for Developers: Tarayıcı oturumunuzla Chrome DevTools MCP kullanın](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil:

- `user`

İsteğe bağlı: farklı bir ad, renk veya tarayıcı veri dizini istiyorsanız kendi özel existing-session profilinizi oluşturun.

Varsayılan davranış:

- Yerleşik `user` profili Chrome MCP otomatik bağlanmasını kullanır; bu,
  varsayılan yerel Google Chrome profilini hedefler.

Brave, Edge, Chromium veya varsayılan olmayan bir Chrome profili için `userDataDir` kullanın.
`~`, işletim sisteminizin ana dizinine genişletilir:

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

1. Uzak hata ayıklama için o tarayıcının inspect sayfasını açın.
2. Uzak hata ayıklamayı etkinleştirin.
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

Başarılı durumun görünümü:

- `status`, `driver: existing-session` gösterir
- `status`, `transport: chrome-mcp` gösterir
- `status`, `running: true` gösterir
- `tabs`, zaten açık olan tarayıcı sekmelerinizi listeler
- `snapshot`, seçili canlı sekmeden ref'ler döndürür

Bağlanma çalışmıyorsa denetlenecekler:

- hedef Chromium tabanlı tarayıcı sürümü `144+` olmalı
- uzak hata ayıklama o tarayıcının inspect sayfasında etkinleştirilmiş olmalı
- tarayıcı bağlantı onay istemini göstermiş ve siz bunu kabul etmiş olmalısınız
- `openclaw doctor`, eski uzantı tabanlı tarayıcı yapılandırmasını taşır ve
  varsayılan otomatik bağlanma profilleri için Chrome'un yerel olarak kurulu olduğunu denetler, ancak tarayıcı tarafı uzak hata ayıklamayı sizin yerinize etkinleştiremez

Ajan kullanımı:

- Kullanıcının oturum açmış tarayıcı durumuna ihtiyaç duyduğunuzda `profile="user"` kullanın.
- Özel bir existing-session profili kullanıyorsanız, o açık profil adını geçin.
- Bu modu yalnızca kullanıcı bağlantı
  istemini onaylamak için bilgisayar başındaysa seçin.
- Gateway veya node ana bilgisayarı `npx chrome-devtools-mcp@latest --autoConnect` başlatabilir

Notlar:

- Bu yol, oturum açmış tarayıcı oturumunuz içinde
  eylem yapabildiği için yalıtılmış `openclaw` profilinden daha yüksek risklidir.
- OpenClaw bu sürücü için tarayıcıyı başlatmaz; yalnızca bağlanır.
- OpenClaw burada resmî Chrome DevTools MCP `--autoConnect` akışını kullanır. Eğer
  `userDataDir` ayarlanmışsa, o kullanıcı veri dizinini hedeflemek için aktarılır.
- Existing-session, seçilen ana bilgisayarda veya bağlı bir
  tarayıcı node'u üzerinden bağlanabilir. Chrome başka bir yerdeyse ve bağlı tarayıcı node'u yoksa,
  bunun yerine uzak CDP veya bir Node ana bilgisayarı kullanın.

### Özel Chrome MCP başlatma

Varsayılan
`npx chrome-devtools-mcp@latest` akışı istediğiniz şey değilse (çevrimdışı ana bilgisayarlar,
sabitlenmiş sürümler, vendored ikililer), başlatılan Chrome DevTools MCP sunucusunu profil başına geçersiz kılın:

| Alan         | İşlevi                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| `mcpCommand` | `npx` yerine başlatılacak yürütülebilir dosya. Olduğu gibi çözümlenir; mutlak yollar kabul edilir.              |
| `mcpArgs`    | `mcpCommand` komutuna aynen geçirilen argüman dizisi. Varsayılan `chrome-devtools-mcp@latest --autoConnect` argümanlarının yerini alır. |

Bir existing-session profilinde `cdpUrl` ayarlandığında, OpenClaw
`--autoConnect` adımını atlar ve uç noktayı Chrome MCP'ye otomatik olarak iletir:

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP keşif uç noktası).
- `ws(s)://...` → `--wsEndpoint <url>` (doğrudan CDP WebSocket).

Uç nokta bayrakları ve `userDataDir` birlikte kullanılamaz: `cdpUrl` ayarlandığında,
Chrome MCP başlatması için `userDataDir` yok sayılır; çünkü Chrome MCP bir profil
dizini açmak yerine uç noktanın arkasındaki çalışan tarayıcıya bağlanır.

<Accordion title="Existing-session özellik sınırlamaları">

Yönetilen `openclaw` profiline kıyasla existing-session sürücüleri daha kısıtlıdır:

- **Ekran görüntüleri** — sayfa yakalamaları ve `--ref` öğe yakalamaları çalışır; CSS `--element` seçicileri çalışmaz. `--full-page`, `--ref` veya `--element` ile birlikte kullanılamaz. Sayfa veya ref tabanlı öğe ekran görüntüleri için Playwright gerekmez.
- **Eylemler** — `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select`, snapshot ref'leri gerektirir (CSS seçicileri yok). `click-coords` görünür viewport koordinatlarına tıklar ve snapshot ref gerektirmez. `click` yalnızca sol düğme içindir. `type`, `slowly=true` desteklemez; `fill` veya `press` kullanın. `press`, `delayMs` desteklemez. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` ve `evaluate`, çağrı başına zaman aşımı desteklemez. `select` tek bir değer kabul eder.
- **Bekleme / yükleme / iletişim kutusu** — `wait --url`, tam eşleşme, alt dize ve glob desenlerini destekler; `wait --load networkidle` desteklenmez. Yükleme hook'ları `ref` veya `inputRef` gerektirir, bir seferde tek dosya, CSS `element` yoktur. İletişim kutusu hook'ları zaman aşımı geçersiz kılmalarını desteklemez.
- **Yalnızca yönetilen özellikler** — toplu eylemler, PDF dışa aktarma, indirme yakalama ve `responsebody` hâlâ yönetilen tarayıcı yolunu gerektirir.

</Accordion>

## Yalıtım garantileri

- **Ayrılmış kullanıcı veri dizini**: kişisel tarayıcı profilinize asla dokunmaz.
- **Ayrılmış bağlantı noktaları**: geliştirme iş akışlarıyla çakışmaları önlemek için `9222` kullanmaz.
- **Deterministik sekme denetimi**: `tabs` önce `suggestedTargetId`, sonra
  `t1` gibi kararlı `tabId` tanıtıcıları, isteğe bağlı etiketler ve ham `targetId` döndürür.
  Ajanlar `suggestedTargetId` değerini yeniden kullanmalıdır; ham kimlikler
  hata ayıklama ve uyumluluk için kullanılabilir olmaya devam eder.

## Tarayıcı seçimi

Yerel olarak başlatılırken OpenClaw ilk kullanılabilir olanı seçer:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Bunu `browser.executablePath` ile geçersiz kılabilirsiniz.

Platformlar:

- macOS: `/Applications` ve `~/Applications` denetler.
- Linux: `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` ve
  `/usr/lib/chromium-browser` altındaki yaygın Chrome/Brave/Edge/Chromium konumlarını denetler.
- Windows: yaygın kurulum konumlarını denetler.

## Kontrol API'si (isteğe bağlı)

Betik yazma ve hata ayıklama için Gateway, küçük bir **yalnızca loopback HTTP
kontrol API'si** ve buna karşılık gelen bir `openclaw browser` CLI açığa çıkarır (snapshot'lar, ref'ler, wait
güçlendirmeleri, JSON çıktısı, hata ayıklama iş akışları). Tam başvuru için
[Tarayıcı kontrol API'si](/tr/tools/browser-control) bölümüne bakın.

## Sorun giderme

Linux'a özgü sorunlar için (özellikle snap Chromium), bkz.
[Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting).

WSL2 Gateway + Windows Chrome ayrık ana bilgisayar kurulumları için bkz.
[WSL2 + Windows + uzak Chrome CDP sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP başlatma hatası ve gezinme SSRF engeli

Bunlar farklı hata sınıflarıdır ve farklı kod yollarına işaret ederler.

- **CDP başlatma veya hazır olma hatası**, OpenClaw'ın tarayıcı denetim düzleminin sağlıklı olduğunu doğrulayamadığı anlamına gelir.
- **Gezinme SSRF engeli**, tarayıcı denetim düzleminin sağlıklı olduğu ancak bir sayfa gezinme hedefinin ilke tarafından reddedildiği anlamına gelir.

Yaygın örnekler:

- CDP başlatma veya hazır olma hatası:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`; bu,
    `attachOnly: true` olmadan yapılandırılmış bir loopback harici CDP hizmeti olduğunda görülür
- Gezinme SSRF engeli:
  - `start` ve `tabs` hâlâ çalışırken `open`, `navigate`, snapshot veya sekme açma akışları tarayıcı/ağ ilkesi hatasıyla başarısız olur

İkisini ayırmak için şu minimal diziyi kullanın:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Sonuçları yorumlama:

- `start`, `not reachable after start` ile başarısız olursa önce CDP hazır olma durumunu sorun giderin.
- `start` başarılı ama `tabs` başarısızsa, denetim düzlemi hâlâ sağlıksızdır. Bunu bir sayfa gezinme sorunu olarak değil, CDP erişilebilirlik sorunu olarak ele alın.
- `start` ve `tabs` başarılı ama `open` veya `navigate` başarısızsa, tarayıcı denetim düzlemi çalışıyordur ve hata gezinme ilkesinde veya hedef sayfadadır.
- `start`, `tabs` ve `open` hepsi başarılıysa, temel yönetilen tarayıcı denetim yolu sağlıklıdır.

Önemli davranış ayrıntıları:

- `browser.ssrfPolicy` yapılandırmasanız bile tarayıcı yapılandırması varsayılan olarak güvenli şekilde kapanan bir SSRF ilke nesnesi kullanır.
- Yerel loopback `openclaw` yönetilen profili için CDP sağlık denetimleri, OpenClaw'ın kendi yerel denetim düzlemi için tarayıcı SSRF erişilebilirlik zorlamasını bilerek atlar.
- Gezinme koruması ayrıdır. Başarılı bir `start` veya `tabs` sonucu, daha sonra bir `open` veya `navigate` hedefinin izinli olduğu anlamına gelmez.

Güvenlik yönlendirmesi:

- Tarayıcı SSRF ilkesini varsayılan olarak **gevşetmeyin**.
- Geniş özel ağ erişimi yerine `hostnameAllowlist` veya `allowedHostnames` gibi dar ana bilgisayar istisnalarını tercih edin.
- `dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı erişiminin gerekli olduğu ve gözden geçirildiği, bilinçli olarak güvenilen ortamlarda kullanın.

## Ajan araçları + denetimin nasıl çalıştığı

Ajan, tarayıcı otomasyonu için **tek bir araç** alır:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Eşleme şu şekildedir:

- `browser snapshot`, kararlı bir UI ağacı döndürür (AI veya ARIA).
- `browser act`, tıklamak/yazmak/sürüklemek/seçmek için snapshot `ref` kimliklerini kullanır.
- `browser screenshot`, pikselleri yakalar (tam sayfa, öğe veya etiketli ref'ler).
- `browser doctor`, Gateway, Plugin, profil, tarayıcı ve sekme hazır olma durumunu denetler.
- `browser` şunları kabul eder:
  - adlandırılmış bir tarayıcı profili seçmek için `profile` (openclaw, chrome veya uzak CDP).
  - tarayıcının nerede yaşadığını seçmek için `target` (`sandbox` | `host` | `node`).
  - Sandbox içindeki oturumlarda `target: "host"` için `agents.defaults.sandbox.browser.allowHostControl=true` gerekir.
  - `target` atlanırsa: sandbox içindeki oturumlar varsayılan olarak `sandbox`, sandbox dışı oturumlar varsayılan olarak `host` kullanır.
  - tarayıcı özellikli bir node bağlıysa, `target="host"` veya `target="node"` sabitlemediğiniz sürece araç otomatik olarak ona yönlenebilir.

Bu, ajanı deterministik tutar ve kırılgan seçicilerden kaçınır.

## İlgili

- [Araçlara Genel Bakış](/tr/tools) — kullanılabilir tüm ajan araçları
- [Sandboxing](/tr/gateway/sandboxing) — sandbox ortamlarında tarayıcı denetimi
- [Güvenlik](/tr/gateway/security) — tarayıcı denetimi riskleri ve sağlamlaştırma
