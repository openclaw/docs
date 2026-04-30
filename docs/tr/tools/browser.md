---
read_when:
    - Ajan kontrollü tarayıcı otomasyonu ekleme
    - OpenClaw’un kendi Chrome’unuza neden müdahale ettiğine dair hata ayıklama
    - macOS uygulamasında tarayıcı ayarlarını ve yaşam döngüsünü uygulama
summary: Tümleşik tarayıcı kontrol hizmeti + eylem komutları
title: Tarayıcı (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-04-30T09:47:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8f0456505f4e1711626a539a0a0c48d67ca10d4788838eb53855bc83c766d2f
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw, aracının denetlediği **özel bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir.
Kişisel tarayıcınızdan yalıtılmıştır ve Gateway içindeki küçük bir yerel
denetim hizmeti üzerinden yönetilir (yalnızca loopback).

Başlangıç görünümü:

- Bunu **ayrı, yalnızca aracıya ait bir tarayıcı** olarak düşünün.
- `openclaw` profili kişisel tarayıcı profilinize **dokunmaz**.
- Aracı güvenli bir hatta **sekmeler açabilir, sayfaları okuyabilir, tıklayabilir ve yazabilir**.
- Yerleşik `user` profili, Chrome MCP üzerinden gerçek oturum açmış Chrome oturumunuza bağlanır.

## Ne elde edersiniz

- **openclaw** adlı ayrı bir tarayıcı profili (varsayılan olarak turuncu vurgu).
- Belirleyici sekme denetimi (listele/aç/odakla/kapat).
- Aracı eylemleri (tıkla/yaz/sürükle/seç), anlık görüntüler, ekran görüntüleri, PDF'ler.
- Tarayıcı Plugin etkinleştirildiğinde aracılara anlık görüntü,
  kararlı sekme, eski ref ve manuel engelleyici kurtarma döngüsünü öğreten
  paketlenmiş bir `browser-automation` Skills.
- İsteğe bağlı çoklu profil desteği (`openclaw`, `work`, `remote`, ...).

Bu tarayıcı **günlük tarayıcınız değildir**. Aracı otomasyonu ve doğrulaması için
güvenli, yalıtılmış bir yüzeydir.

## Hızlı başlangıç

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Tarayıcı devre dışı” alırsanız, yapılandırmada etkinleştirin (aşağıya bakın) ve
Gateway'i yeniden başlatın.

`openclaw browser` tamamen eksikse veya aracı tarayıcı aracının kullanılamadığını
söylüyorsa, [Eksik tarayıcı komutu veya aracı](/tr/tools/browser#missing-browser-command-or-tool) bölümüne geçin.

## Plugin denetimi

Varsayılan `browser` aracı paketlenmiş bir Plugin'dir. Aynı `browser` aracı adını kaydeden başka bir Plugin ile değiştirmek için devre dışı bırakın:

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

Varsayılanlar hem `plugins.entries.browser.enabled` **hem de** `browser.enabled=true` gerektirir. Yalnızca Plugin'i devre dışı bırakmak, `openclaw browser` CLI'sini, `browser.request` Gateway yöntemini, aracı aracını ve denetim hizmetini tek bir birim olarak kaldırır; `browser.*` yapılandırmanız bir yedek için sağlam kalır.

Tarayıcı yapılandırma değişiklikleri, Plugin'in hizmetini yeniden kaydedebilmesi için Gateway'in yeniden başlatılmasını gerektirir.

## Aracı rehberliği

Araç profili notu: `tools.profile: "coding"`, `web_search` ve
`web_fetch` içerir, ancak tam `browser` aracını içermez. Aracı veya
oluşturulan bir alt aracı tarayıcı otomasyonunu kullanacaksa, profil
aşamasında tarayıcıyı ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Tek bir aracı için `agents.list[].tools.alsoAllow: ["browser"]` kullanın.
Alt aracı politikası profil filtrelemesinden sonra uygulandığı için
`tools.subagents.tools.allow: ["browser"]` tek başına yeterli değildir.

Tarayıcı Plugin'i iki düzey aracı rehberliğiyle gelir:

- `browser` aracı açıklaması, kısa ve her zaman etkin sözleşmeyi taşır: doğru
  profili seçin, ref'leri aynı sekmede tutun, sekme hedefleme için `tabId`/etiketleri
  kullanın ve çok adımlı işler için tarayıcı Skills'ini yükleyin.
- Paketlenmiş `browser-automation` Skills'i daha uzun çalışma döngüsünü taşır:
  önce durumu/sekmeleri denetleyin, görev sekmelerini etiketleyin, işlemden önce
  anlık görüntü alın, UI değişikliklerinden sonra yeniden anlık görüntü alın,
  eski ref'leri bir kez kurtarın ve oturum açma/2FA/captcha veya
  kamera/mikrofon engelleyicilerini tahmin etmek yerine manuel eylem olarak bildirin.

Plugin ile paketlenmiş Skills, Plugin etkinleştirildiğinde aracının kullanılabilir
Skills listesinde görünür. Tam Skills talimatları istek üzerine yüklenir, bu nedenle rutin
turlar tam token maliyetini ödemez.

## Eksik tarayıcı komutu veya aracı

Bir yükseltmeden sonra `openclaw browser` bilinmiyorsa, `browser.request` eksikse veya aracı tarayıcı aracının kullanılamadığını bildiriyorsa, olağan neden `browser` içermeyen bir `plugins.allow` listesi ve kökte `browser` yapılandırma bloğunun bulunmamasıdır. Bunu ekleyin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Açık bir kök `browser` bloğu, örneğin `browser.enabled=true` veya `browser.profiles.<name>`, kanal yapılandırma davranışıyla eşleşerek kısıtlayıcı bir `plugins.allow` altında bile paketlenmiş tarayıcı Plugin'ini etkinleştirir. `plugins.entries.browser.enabled=true` ve `tools.alsoAllow: ["browser"]` tek başlarına allowlist üyeliğinin yerine geçmez. `plugins.allow` öğesini tamamen kaldırmak da varsayılanı geri yükler.

## Profiller: `openclaw` ve `user`

- `openclaw`: yönetilen, yalıtılmış tarayıcı (uzantı gerekmez).
- `user`: **gerçek oturum açmış Chrome** oturumunuz için yerleşik Chrome MCP
  bağlanma profili.

Aracı tarayıcı aracı çağrıları için:

- Varsayılan: yalıtılmış `openclaw` tarayıcısını kullanın.
- Mevcut oturum açmış oturumlar önemli olduğunda ve kullanıcı herhangi bir
  bağlanma istemini tıklamak/onaylamak için bilgisayar başındaysa `profile="user"` tercih edin.
- Belirli bir tarayıcı modu istediğinizde açık geçersiz kılma `profile` değeridir.

Yönetilen modu varsayılan olarak istiyorsanız `browser.defaultProfile: "openclaw"` ayarlayın.

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

<Accordion title="Bağlantı noktaları ve erişilebilirlik">

- Denetim hizmeti, `gateway.port` değerinden türetilen bir bağlantı noktasında loopback'e bağlanır (varsayılan `18791` = gateway + 2). `gateway.port` veya `OPENCLAW_GATEWAY_PORT` değerini geçersiz kılmak, türetilmiş bağlantı noktalarını aynı aile içinde kaydırır.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar; bunları yalnızca uzak CDP için ayarlayın. `cdpUrl`, ayarlanmamışsa yönetilen yerel CDP bağlantı noktasını varsayar.
- `remoteCdpTimeoutMs`, uzak ve `attachOnly` CDP HTTP erişilebilirlik
  denetimlerine ve sekme açma HTTP isteklerine uygulanır; `remoteCdpHandshakeTimeoutMs` ise
  bunların CDP WebSocket el sıkışmalarına uygulanır.
- `localLaunchTimeoutMs`, yerel olarak başlatılan yönetilen bir Chrome
  sürecinin CDP HTTP uç noktasını sunması için ayrılan bütçedir. `localCdpReadyTimeoutMs`, süreç keşfedildikten sonra CDP websocket hazır oluşu için
  izleyen bütçedir.
  Chromium'un yavaş başladığı Raspberry Pi, düşük seviye VPS veya eski donanımlarda bunları artırın. Değerler `120000` ms'ye kadar pozitif tam sayılar olmalıdır; geçersiz
  yapılandırma değerleri reddedilir.
- Tekrarlanan yönetilen Chrome başlatma/hazır oluş hataları profil başına
  circuit-break uygulanır. Birkaç ardışık hatadan sonra OpenClaw, her tarayıcı aracı çağrısında Chromium oluşturmak yerine yeni başlatma
  denemelerini kısa süreliğine duraklatır. Başlatma sorununu düzeltin, tarayıcı gerekmiyorsa devre dışı bırakın veya onarımdan sonra
  Gateway'i yeniden başlatın.
- `actionTimeoutMs`, çağıran `timeoutMs` geçirmediğinde tarayıcı `act` istekleri için varsayılan bütçedir. İstemci aktarımı, uzun beklemelerin HTTP sınırında zaman aşımına uğramak yerine tamamlanabilmesi için küçük bir ek pencere ekler.
- `tabCleanup`, birincil aracı tarayıcı oturumları tarafından açılan sekmeler için en iyi çaba temizliğidir. Alt aracı, Cron ve ACP yaşam döngüsü temizliği, oturum sonunda açıkça izlenen sekmelerini yine kapatır; birincil oturumlar etkin sekmeleri yeniden kullanılabilir tutar, ardından arka planda boşta kalan veya fazla izlenen sekmeleri kapatır.

</Accordion>

<Accordion title="SSRF politikası">

- Tarayıcı gezinmesi ve sekme açma, gezinmeden önce SSRF korumalıdır ve son `http(s)` URL'sinde sonrasında en iyi çabayla yeniden denetlenir.
- Katı SSRF modunda, uzak CDP uç noktası keşfi ve `/json/version` probları (`cdpUrl`) da denetlenir.
- Gateway/sağlayıcı `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve `NO_PROXY` ortam değişkenleri, OpenClaw tarafından yönetilen tarayıcıyı otomatik olarak proxy üzerinden geçirmez. Yönetilen Chrome varsayılan olarak doğrudan başlatılır, böylece sağlayıcı proxy ayarları tarayıcı SSRF denetimlerini zayıflatmaz.
- Yönetilen tarayıcının kendisini proxy üzerinden geçirmek için `--proxy-server=...` veya `--proxy-pac-url=...` gibi açık Chrome proxy bayraklarını `browser.extraArgs` üzerinden geçirin. Katı SSRF modu, özel ağ tarayıcı erişimi bilinçli olarak etkinleştirilmedikçe açık tarayıcı proxy yönlendirmesini engeller.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak kapalıdır; yalnızca özel ağ tarayıcı erişimine bilinçli olarak güvenildiğinde etkinleştirin.
- `browser.ssrfPolicy.allowPrivateNetwork`, eski takma ad olarak desteklenmeye devam eder.

</Accordion>

<Accordion title="Profil davranışı">

- `attachOnly: true`, hiçbir zaman yerel bir tarayıcı başlatma; yalnızca zaten çalışan bir tarayıcı varsa ona bağlan anlamına gelir.
- `headless`, genel olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.headless` değerini geçersiz kılar; böylece yerel olarak başlatılan bir profil headless kalırken diğeri görünür kalabilir.
- `POST /start?headless=true` ve `openclaw browser start --headless`, yerel yönetilen profiller için
  `browser.headless` veya profil yapılandırmasını yeniden yazmadan tek seferlik
  bir headless başlatma ister. Mevcut oturum, yalnızca bağlanma ve
  uzak CDP profilleri bu geçersiz kılmayı reddeder, çünkü OpenClaw bu
  tarayıcı süreçlerini başlatmaz.
- `DISPLAY` veya `WAYLAND_DISPLAY` olmayan Linux hostlarında, ortam ya da profil/genel
  yapılandırma açıkça görünür modu seçmediğinde yerel yönetilen profiller
  otomatik olarak varsayılan biçimde headless olur. `openclaw browser status --json`
  `headlessSource` değerini `env`, `profile`, `config`,
  `request`, `linux-display-fallback` veya `default` olarak raporlar.
- `OPENCLAW_BROWSER_HEADLESS=1`, geçerli süreç için yerel yönetilen başlatmaları
  headless olmaya zorlar. `OPENCLAW_BROWSER_HEADLESS=0`, olağan
  başlatmalar için görünür modu zorlar ve görüntü sunucusu olmayan Linux hostlarında
  eyleme geçirilebilir bir hata döndürür; açık bir `start --headless` isteği yine de
  o tek başlatma için önceliklidir.
- `executablePath`, genel olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.executablePath` değerini geçersiz kılar; böylece farklı yönetilen profiller farklı Chromium tabanlı tarayıcıları başlatabilir. Her iki biçim de işletim sistemi ana dizininiz için `~` kabul eder.
- `color` (üst düzey ve profil başına), hangi profilin etkin olduğunu görebilmeniz için tarayıcı kullanıcı arayüzünü renklendirir.
- Varsayılan profil `openclaw` (yönetilen bağımsız) olur. Oturum açmış kullanıcı tarayıcısını tercih etmek için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: Chromium tabanlıysa sistem varsayılan tarayıcısı; aksi halde Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır. Bu sürücü için `cdpUrl` ayarlamayın.
- Mevcut oturum profilinin varsayılan olmayan bir Chromium kullanıcı profiline (Brave, Edge vb.) bağlanması gerekiyorsa `browser.profiles.<name>.userDataDir` değerini ayarlayın. Bu yol da işletim sistemi ana dizininiz için `~` kabul eder.

</Accordion>

</AccordionGroup>

## Brave veya başka bir Chromium tabanlı tarayıcı kullanın

**Sistem varsayılan** tarayıcınız Chromium tabanlıysa (Chrome/Brave/Edge/vb.),
OpenClaw bunu otomatik olarak kullanır. Otomatik algılamayı geçersiz kılmak için
`browser.executablePath` ayarlayın. Üst düzey ve profil başına `executablePath`
değerleri, işletim sistemi ana dizininiz için `~` kabul eder:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Veya bunu yapılandırmada platform başına ayarlayın:

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

## Yerel ve uzak denetim

- **Yerel denetim (varsayılan):** Gateway, loopback denetim hizmetini başlatır ve yerel bir tarayıcı başlatabilir.
- **Uzak denetim (Node hostu):** tarayıcının bulunduğu makinede bir Node hostu çalıştırın; Gateway tarayıcı eylemlerini ona proxy'ler.
- **Uzak CDP:** uzak bir Chromium tabanlı tarayıcıya bağlanmak için
  `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`) ayarlayın. Bu durumda OpenClaw yerel bir tarayıcı başlatmaz.
- Loopback üzerinde harici olarak yönetilen CDP hizmetleri için (örneğin
  Docker'da `127.0.0.1` adresine yayımlanan Browserless), ayrıca `attachOnly: true` ayarlayın. `attachOnly` olmadan loopback CDP,
  yerel OpenClaw tarafından yönetilen bir tarayıcı profili olarak ele alınır.
- `headless` yalnızca OpenClaw tarafından başlatılan yerel yönetilen profilleri etkiler. Mevcut oturum veya uzak CDP tarayıcılarını yeniden başlatmaz ya da değiştirmez.
- `executablePath` aynı yerel yönetilen profil kuralını izler. Çalışan bir
  yerel yönetilen profilde bunu değiştirmek, bir sonraki başlatmanın yeni ikiliyi
  kullanması için o profili yeniden başlatma/uzlaştırma işaretli yapar.

Durdurma davranışı profil moduna göre farklılık gösterir:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw tarafından
  başlatılan tarayıcı sürecini durdurur
- yalnızca bağlanma ve uzak CDP profilleri: OpenClaw tarafından hiçbir tarayıcı
  süreci başlatılmamış olsa bile `openclaw browser stop`, etkin
  denetim oturumunu kapatır ve Playwright/CDP emülasyon geçersiz kılmalarını
  (görünüm alanı, renk şeması, yerel ayar, saat dilimi, çevrimdışı mod ve
  benzer durumlar) serbest bırakır

Uzak CDP URL'leri kimlik doğrulama içerebilir:

- Sorgu token'ları (örn. `https://provider.example?token=<token>`)
- HTTP Basic kimlik doğrulaması (örn. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktalarını çağırırken ve CDP WebSocket'e bağlanırken
kimlik doğrulamayı korur. Token'ları yapılandırma dosyalarına kaydetmek yerine
ortam değişkenlerini veya secrets yöneticilerini tercih edin.

## Node tarayıcı proxy'si (sıfır yapılandırmalı varsayılan)

Tarayıcınızın bulunduğu makinede bir **Node hostu** çalıştırırsanız, OpenClaw
tarayıcı aracı çağrılarını ek tarayıcı yapılandırması olmadan otomatik olarak
o Node'a yönlendirebilir. Bu, uzak Gateway'ler için varsayılan yoldur.

Notlar:

- Node hostu, yerel tarayıcı denetim sunucusunu bir **proxy komutu** üzerinden sunar.
- Profiller, Node'un kendi `browser.profiles` yapılandırmasından gelir (yereldekiyle aynı).
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için boş bırakın: profil oluşturma/silme yolları dahil olmak üzere yapılandırılmış tüm profillere proxy üzerinden erişilebilir kalır.
- `nodeHost.browserProxy.allowProfiles` ayarlarsanız OpenClaw bunu en az ayrıcalık sınırı olarak ele alır: yalnızca izin listesine alınmış profiller hedeflenebilir ve kalıcı profil oluşturma/silme yolları proxy yüzeyinde engellenir.
- İstemiyorsanız devre dışı bırakın:
  - Node üzerinde: `nodeHost.browserProxy.enabled=false`
  - Gateway üzerinde: `gateway.nodes.browser.mode="off"`

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), HTTPS ve WebSocket üzerinden
CDP bağlantı URL'leri sunan barındırılan bir Chromium hizmetidir. OpenClaw her iki biçimi de kullanabilir, ancak
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

- `<BROWSERLESS_API_KEY>` değerini gerçek Browserless token'ınızla değiştirin.
- Browserless hesabınızla eşleşen bölge uç noktasını seçin (belgelerine bakın).
- Browserless size bir HTTPS temel URL'si verirse, doğrudan CDP bağlantısı için
  bunu `wss://` biçimine dönüştürebilir veya HTTPS URL'sini koruyup OpenClaw'ın
  `/json/version` keşfi yapmasına izin verebilirsiniz.

### Aynı host üzerinde Browserless Docker

Browserless, Docker'da kendi kendine barındırıldığında ve OpenClaw host üzerinde çalıştığında,
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

`browser.profiles.browserless.cdpUrl` içindeki adrese OpenClaw sürecinden
erişilebilmelidir. Browserless ayrıca eşleşen, erişilebilir bir uç nokta duyurmalıdır;
Browserless `EXTERNAL` değerini, OpenClaw'a açık olan aynı WebSocket tabanına ayarlayın; örneğin
`ws://127.0.0.1:3000`, `ws://browserless:3000` veya kararlı bir özel Docker
ağ adresi. `/json/version`, OpenClaw'ın erişemediği bir adresi işaret eden
`webSocketDebuggerUrl` döndürürse, CDP HTTP sağlıklı görünebilir ancak WebSocket
bağlantısı yine de başarısız olur.

Loopback Browserless profili için `attachOnly` değerini ayarlanmamış bırakmayın.
`attachOnly` olmadan OpenClaw, loopback portunu yerel yönetilen tarayıcı
profili olarak ele alır ve portun kullanımda olduğunu ancak OpenClaw'a ait olmadığını bildirebilir.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılan tarayıcı hizmetleri, standart HTTP tabanlı CDP keşfi
(`/json/version`) yerine **doğrudan WebSocket** uç noktası sunar. OpenClaw üç
CDP URL biçimini kabul eder ve doğru bağlantı stratejisini otomatik olarak seçer:

- **HTTP(S) keşfi** — `http://host[:port]` veya `https://host[:port]`.
  OpenClaw, WebSocket hata ayıklayıcı URL'sini keşfetmek için `/json/version` çağırır, sonra
  bağlanır. WebSocket yedeği yoktur.
- **Doğrudan WebSocket uç noktaları** — `ws://host[:port]/devtools/<kind>/<id>` veya
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  yoluna sahip `wss://...`. OpenClaw doğrudan WebSocket el sıkışmasıyla bağlanır ve
  `/json/version` adımını tamamen atlar.
- **Yalın WebSocket kökleri** — `ws://host[:port]` veya
  `/devtools/...` yolu olmayan `wss://host[:port]` (örn. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw önce HTTP
  `/json/version` keşfini dener (şemayı `http`/`https` olarak normalleştirerek);
  keşif bir `webSocketDebuggerUrl` döndürürse bu kullanılır, aksi halde OpenClaw
  yalın kökte doğrudan WebSocket el sıkışmasına geri döner. Duyurulan
  WebSocket uç noktası CDP el sıkışmasını reddeder ancak yapılandırılmış yalın kök
  bunu kabul ederse, OpenClaw o köke de geri döner. Bu, yerel Chrome'a yönlendirilen yalın bir `ws://`
  adresinin yine de bağlanmasına olanak tanır; çünkü Chrome WebSocket
  yükseltmelerini yalnızca `/json/version` üzerinden gelen hedefe özel yolda kabul ederken, barındırılan
  sağlayıcılar keşif uç noktaları Playwright CDP için uygun olmayan kısa ömürlü bir URL
  duyurduğunda kök WebSocket uç noktalarını kullanmaya devam edebilir.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözme, gizli mod ve konut tipi
proxy'lerle headless tarayıcılar çalıştırmak için bir bulut platformudur.

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

- [Kaydolun](https://www.browserbase.com/sign-up) ve [Genel Bakış panosundan](https://www.browserbase.com/overview) **API Key** değerinizi
  kopyalayın.
- `<BROWSERBASE_API_KEY>` değerini gerçek Browserbase API anahtarınızla değiştirin.
- Browserbase, WebSocket bağlantısında otomatik olarak bir tarayıcı oturumu oluşturur; bu nedenle
  manuel oturum oluşturma adımı gerekmez.
- Ücretsiz katman, eşzamanlı bir oturuma ve ayda bir tarayıcı saatine izin verir.
  Ücretli plan sınırları için [fiyatlandırmaya](https://www.browserbase.com/pricing) bakın.
- Tam API referansı, SDK kılavuzları ve entegrasyon örnekleri için
  [Browserbase belgelerine](https://docs.browserbase.com) bakın.

## Güvenlik

Temel fikirler:

- Tarayıcı kontrolü yalnızca loopback üzerindedir; erişim Gateway’in kimlik doğrulaması veya düğüm eşleştirmesi üzerinden gerçekleşir.
- Bağımsız loopback tarayıcı HTTP API’si **yalnızca paylaşılan gizli anahtar kimlik doğrulaması** kullanır:
  gateway token bearer kimlik doğrulaması, `x-openclaw-password` veya yapılandırılmış
  gateway parolasıyla HTTP Basic kimlik doğrulaması.
- Tailscale Serve kimlik başlıkları ve `gateway.auth.mode: "trusted-proxy"` bu
  bağımsız loopback tarayıcı API’sinde **kimlik doğrulaması yapmaz**.
- Tarayıcı kontrolü etkinse ve paylaşılan gizli anahtar kimlik doğrulaması yapılandırılmamışsa, OpenClaw
  başlangıçta `gateway.auth.token` değerini otomatik oluşturur ve yapılandırmaya kalıcı olarak kaydeder.
- `gateway.auth.mode` zaten `password`, `none` veya `trusted-proxy` ise OpenClaw
  bu token’ı otomatik oluşturmaz.
- Gateway’i ve tüm düğüm ana makinelerini özel bir ağda (Tailscale) tutun; herkese açık erişimden kaçının.
- Uzak CDP URL’lerini/token’larını gizli bilgi olarak ele alın; env değişkenlerini veya bir gizli bilgi yöneticisini tercih edin.

Uzak CDP ipuçları:

- Mümkün olduğunda şifreli uç noktaları (HTTPS veya WSS) ve kısa ömürlü token’ları tercih edin.
- Uzun ömürlü token’ları doğrudan yapılandırma dosyalarına gömmekten kaçının.

## Profiller (çoklu tarayıcı)

OpenClaw birden fazla adlandırılmış profili (yönlendirme yapılandırmaları) destekler. Profiller şunlar olabilir:

- **openclaw-managed**: kendi kullanıcı veri dizini + CDP bağlantı noktası olan, Chromium tabanlı ayrılmış bir tarayıcı örneği
- **remote**: açık bir CDP URL’si (başka yerde çalışan Chromium tabanlı tarayıcı)
- **existing session**: Chrome DevTools MCP otomatik bağlanma ile mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili eksikse otomatik oluşturulur.
- `user` profili, Chrome MCP mevcut oturum eklemesi için yerleşik olarak gelir.
- Mevcut oturum profilleri `user` dışında isteğe bağlıdır; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP bağlantı noktaları varsayılan olarak **18800–18899** aralığından ayrılır.
- Bir profilin silinmesi, yerel veri dizinini Çöp Kutusu’na taşır.

Tüm kontrol uç noktaları `?profile=<name>` kabul eder; CLI `--browser-profile` kullanır.

## Chrome DevTools MCP üzerinden mevcut oturum

OpenClaw, resmi Chrome DevTools MCP sunucusu üzerinden çalışan Chromium tabanlı
bir tarayıcı profiline de bağlanabilir. Bu, o tarayıcı profilinde zaten açık olan
sekmeleri ve oturum açma durumunu yeniden kullanır.

Resmi arka plan ve kurulum başvuruları:

- [Chrome for Developers: Chrome DevTools MCP’yi tarayıcı oturumunuzla kullanın](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil:

- `user`

İsteğe bağlı: farklı bir ad, renk veya tarayıcı veri dizini istiyorsanız kendi özel mevcut oturum profilinizi oluşturun.

Varsayılan davranış:

- Yerleşik `user` profili, varsayılan yerel Google Chrome profilini hedefleyen Chrome MCP otomatik bağlanmasını kullanır.

Brave, Edge, Chromium veya varsayılan olmayan bir Chrome profili için `userDataDir` kullanın.
`~`, işletim sisteminizin ana dizinine genişler:

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
3. Tarayıcıyı çalışır durumda tutun ve OpenClaw bağlandığında bağlantı istemini onaylayın.

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

Başarı nasıl görünür:

- `status`, `driver: existing-session` gösterir
- `status`, `transport: chrome-mcp` gösterir
- `status`, `running: true` gösterir
- `tabs`, zaten açık olan tarayıcı sekmelerinizi listeler
- `snapshot`, seçili canlı sekmeden ref’ler döndürür

Ekleme çalışmıyorsa kontrol edilecekler:

- hedef Chromium tabanlı tarayıcı `144+` sürümündedir
- uzaktan hata ayıklama, bu tarayıcının inceleme sayfasında etkindir
- tarayıcı ekleme onayı istemini gösterdi ve siz kabul ettiniz
- `openclaw doctor`, eski uzantı tabanlı tarayıcı yapılandırmasını taşır ve
  varsayılan otomatik bağlanan profiller için Chrome’un yerelde kurulu olduğunu denetler, ancak
  tarayıcı tarafı uzaktan hata ayıklamayı sizin için etkinleştiremez

Agent kullanımı:

- Kullanıcının oturum açmış tarayıcı durumuna ihtiyaç duyduğunuzda `profile="user"` kullanın.
- Özel bir mevcut oturum profili kullanıyorsanız, bu açık profil adını geçirin.
- Bu modu yalnızca kullanıcı bilgisayar başındaysa ve ekleme istemini onaylayabilecekse seçin.
- Gateway veya düğüm ana makinesi `npx chrome-devtools-mcp@latest --autoConnect` başlatabilir

Notlar:

- Bu yol, oturum açılmış tarayıcı oturumunuz içinde işlem yapabildiği için yalıtılmış `openclaw` profilinden daha yüksek risklidir.
- OpenClaw bu sürücü için tarayıcıyı başlatmaz; yalnızca bağlanır.
- OpenClaw burada resmi Chrome DevTools MCP `--autoConnect` akışını kullanır. `userDataDir` ayarlanmışsa, bu kullanıcı veri dizinini hedeflemek için olduğu gibi geçirilir.
- Mevcut oturum seçili ana makinede veya bağlı bir tarayıcı düğümü üzerinden bağlanabilir. Chrome başka yerdeyse ve bağlı tarayıcı düğümü yoksa, bunun yerine uzak CDP veya bir düğüm ana makinesi kullanın.

### Özel Chrome MCP başlatma

Varsayılan `npx chrome-devtools-mcp@latest` akışı istediğiniz şey değilse
(çevrimdışı ana makineler, sabitlenmiş sürümler, vendored ikililer), oluşturulan
Chrome DevTools MCP sunucusunu profil bazında geçersiz kılın:

| Alan         | Ne yapar                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` yerine başlatılacak çalıştırılabilir dosya. Olduğu gibi çözümlenir; mutlak yollar dikkate alınır.                    |
| `mcpArgs`    | `mcpCommand` öğesine aynen geçirilen argüman dizisi. Varsayılan `chrome-devtools-mcp@latest --autoConnect` argümanlarının yerini alır. |

Bir existing-session profilinde `cdpUrl` ayarlandığında, OpenClaw
`--autoConnect` adımını atlar ve uç noktayı otomatik olarak Chrome MCP’ye iletir:

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP keşif uç noktası).
- `ws(s)://...` → `--wsEndpoint <url>` (doğrudan CDP WebSocket).

Uç nokta bayrakları ve `userDataDir` birlikte kullanılamaz: `cdpUrl` ayarlandığında,
Chrome MCP başlatması için `userDataDir` yok sayılır; çünkü Chrome MCP bir profil
dizinini açmak yerine uç noktanın arkasındaki çalışan tarayıcıya bağlanır.

<Accordion title="Mevcut oturum özellik sınırlamaları">

Yönetilen `openclaw` profiline kıyasla existing-session sürücüleri daha kısıtlıdır:

- **Ekran görüntüleri** — sayfa yakalamaları ve `--ref` öğe yakalamaları çalışır; CSS `--element` seçicileri çalışmaz. `--full-page`, `--ref` veya `--element` ile birleştirilemez. Sayfa veya ref tabanlı öğe ekran görüntüleri için Playwright gerekli değildir.
- **Eylemler** — `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select` snapshot ref’leri gerektirir (CSS seçici yoktur). `click-coords`, görünür viewport koordinatlarına tıklar ve snapshot ref’i gerektirmez. `click` yalnızca sol düğmedir. `type`, `slowly=true` desteklemez; `fill` veya `press` kullanın. `press`, `delayMs` desteklemez. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` ve `evaluate`, çağrı başına zaman aşımlarını desteklemez. `select` tek bir değer kabul eder.
- **Bekleme / yükleme / iletişim kutusu** — `wait --url` tam, alt dize ve glob kalıplarını destekler; `wait --load networkidle` desteklenmez. Yükleme hook’ları `ref` veya `inputRef` gerektirir, tek seferde bir dosya, CSS `element` yoktur. İletişim kutusu hook’ları zaman aşımı geçersiz kılmalarını desteklemez.
- **Yalnızca yönetilen özellikler** — toplu eylemler, PDF dışa aktarma, indirme yakalama ve `responsebody` hâlâ yönetilen tarayıcı yolunu gerektirir.

</Accordion>

## Yalıtım garantileri

- **Ayrılmış kullanıcı veri dizini**: kişisel tarayıcı profilinize asla dokunmaz.
- **Ayrılmış bağlantı noktaları**: geliştirme iş akışlarıyla çakışmaları önlemek için `9222` kullanmaz.
- **Deterministik sekme kontrolü**: `tabs` önce `suggestedTargetId` döndürür, ardından
  `t1` gibi kararlı `tabId` tanıtıcıları, isteğe bağlı etiketler ve ham `targetId` gelir.
  Agent’lar `suggestedTargetId` değerini yeniden kullanmalıdır; ham kimlikler
  hata ayıklama ve uyumluluk için kullanılabilir kalır.

## Tarayıcı seçimi

Yerelde başlatırken OpenClaw ilk kullanılabilir olanı seçer:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` ile geçersiz kılabilirsiniz.

Platformlar:

- macOS: `/Applications` ve `~/Applications` konumlarını denetler.
- Linux: `/usr/bin`, `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` ve
  `/usr/lib/chromium-browser` altında yaygın Chrome/Brave/Edge/Chromium konumlarını denetler.
- Windows: yaygın kurulum konumlarını denetler.

## Kontrol API’si (isteğe bağlı)

Betik oluşturma ve hata ayıklama için Gateway, küçük bir **yalnızca loopback HTTP
kontrol API’si** ve eşleşen bir `openclaw browser` CLI’si sunar (snapshot’lar,
ref’ler, bekleme güçlendirmeleri, JSON çıktısı, hata ayıklama iş akışları). Tam
başvuru için [Tarayıcı kontrol API’si](/tr/tools/browser-control) sayfasına bakın.

## Sorun giderme

Linux’a özgü sorunlar (özellikle snap Chromium) için
[Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting) sayfasına bakın.

WSL2 Gateway + Windows Chrome ayrık ana makine kurulumları için
[WSL2 + Windows + uzak Chrome CDP sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting) sayfasına bakın.

### CDP başlangıç hatası ve gezinme SSRF engeli

Bunlar farklı hata sınıflarıdır ve farklı kod yollarını işaret eder.

- **CDP başlangıç veya hazır olma hatası**, OpenClaw’un tarayıcı kontrol düzleminin sağlıklı olduğunu doğrulayamadığı anlamına gelir.
- **Gezinme SSRF engeli**, tarayıcı kontrol düzleminin sağlıklı olduğu, ancak bir sayfa gezinme hedefinin ilke tarafından reddedildiği anlamına gelir.

Yaygın örnekler:

- CDP başlangıç veya hazır olma hatası:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - loopback harici CDP hizmeti `attachOnly: true` olmadan yapılandırıldığında
    `Port <port> is in use for profile "<name>" but not by openclaw`
- Gezinme SSRF engeli:
  - `start` ve `tabs` hâlâ çalışırken `open`, `navigate`, snapshot veya sekme açma akışları tarayıcı/ağ ilkesi hatasıyla başarısız olur

İkisini ayırmak için bu en küçük diziyi kullanın:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Sonuçlar nasıl okunur:

- `start`, `not reachable after start` ile başarısız olursa önce CDP hazır olma durumunu giderin.
- `start` başarılı olur ancak `tabs` başarısız olursa kontrol düzlemi hâlâ sağlıksızdır. Bunu sayfa gezinme sorunu değil, CDP erişilebilirliği sorunu olarak ele alın.
- `start` ve `tabs` başarılı olur ancak `open` veya `navigate` başarısız olursa tarayıcı kontrol düzlemi çalışıyordur ve hata gezinme ilkesinde veya hedef sayfadadır.
- `start`, `tabs` ve `open` hepsi başarılı olursa temel yönetilen tarayıcı kontrol yolu sağlıklıdır.

Önemli davranış ayrıntıları:

- `browser.ssrfPolicy` yapılandırmasanız bile tarayıcı yapılandırması varsayılan olarak fail-closed SSRF ilke nesnesi kullanır.
- local loopback `openclaw` yönetilen profili için CDP sağlık denetimleri, OpenClaw’un kendi yerel kontrol düzlemi için tarayıcı SSRF erişilebilirliği zorlamasını bilinçli olarak atlar.
- Gezinme koruması ayrıdır. Başarılı bir `start` veya `tabs` sonucu, daha sonraki bir `open` veya `navigate` hedefinin izinli olduğu anlamına gelmez.

Güvenlik rehberi:

- Tarayıcı SSRF ilkesini varsayılan olarak **gevşetmeyin**.
- Geniş özel ağ erişimi yerine `hostnameAllowlist` veya `allowedHostnames` gibi dar ana makine istisnalarını tercih edin.
- `dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı erişiminin gerekli olduğu ve incelendiği, bilinçli olarak güvenilen ortamlarda kullanın.

## Agent araçları + kontrolün nasıl çalıştığı

Agent, tarayıcı otomasyonu için **tek araç** alır:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Nasıl eşlenir:

- `browser snapshot`, kararlı bir UI ağacı (AI veya ARIA) döndürür.
- `browser act`, tıklamak/yazmak/sürüklemek/seçmek için anlık görüntüdeki `ref` kimliklerini kullanır.
- `browser screenshot`, pikselleri yakalar (tam sayfa, öğe veya etiketli başvurular).
- `browser doctor`, Gateway, Plugin, profil, tarayıcı ve sekme hazır olma durumunu denetler.
- `browser` şunları kabul eder:
  - Adlandırılmış bir tarayıcı profili (openclaw, chrome veya uzak CDP) seçmek için `profile`.
  - Tarayıcının nerede bulunduğunu seçmek için `target` (`sandbox` | `host` | `node`).
  - Korumalı alan oturumlarında, `target: "host"` için `agents.defaults.sandbox.browser.allowHostControl=true` gerekir.
  - `target` belirtilmezse: korumalı alan oturumları varsayılan olarak `sandbox`, korumalı alan olmayan oturumlar varsayılan olarak `host` kullanır.
  - Tarayıcı destekli bir node bağlıysa, `target="host"` veya `target="node"` ile sabitlemediğiniz sürece araç otomatik olarak ona yönlendirebilir.

Bu, ajanın deterministik kalmasını sağlar ve kırılgan seçicilerden kaçınır.

## İlgili

- [Araçlara Genel Bakış](/tr/tools) — kullanılabilir tüm ajan araçları
- [Korumalı Alan](/tr/gateway/sandboxing) — korumalı alan ortamlarında tarayıcı denetimi
- [Güvenlik](/tr/gateway/security) — tarayıcı denetimi riskleri ve sıkılaştırma
