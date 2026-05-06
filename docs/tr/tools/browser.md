---
read_when:
    - Ajan kontrollü tarayıcı otomasyonu ekleme
    - openclaw'ın kendi Chrome'unuza neden müdahale ettiğini hata ayıklama
    - macOS uygulamasında tarayıcı ayarlarını ve yaşam döngüsünü uygulama
summary: Entegre tarayıcı denetim hizmeti + eylem komutları
title: Tarayıcı (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-05-06T18:00:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c9f79b4f8b9921724130b4793584facf1bfbe2de5fb21faa54274a4294dedd0
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw, aracının denetlediği **özel bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir.
Kişisel tarayıcınızdan yalıtılmıştır ve Gateway içindeki küçük bir yerel
denetim hizmeti üzerinden yönetilir (yalnızca loopback).

Başlangıç düzeyi görünüm:

- Bunu **ayrı, yalnızca aracıya ait bir tarayıcı** olarak düşünün.
- `openclaw` profili kişisel tarayıcı profilinize **dokunmaz**.
- Aracı güvenli bir hatta **sekme açabilir, sayfaları okuyabilir, tıklayabilir ve yazabilir**.
- Yerleşik `user` profili, Chrome MCP üzerinden gerçek oturum açılmış Chrome oturumunuza bağlanır.

## Ne elde edersiniz

- **openclaw** adlı ayrı bir tarayıcı profili (varsayılan olarak turuncu vurgu).
- Belirlenimci sekme denetimi (listele/aç/odakla/kapat).
- Aracı eylemleri (tıklama/yazma/sürükleme/seçme), anlık görüntüler, ekran görüntüleri, PDF'ler.
- Tarayıcı Plugin etkinleştirildiğinde aracılara anlık görüntü,
  kararlı sekme, eski ref ve manuel engelleyici kurtarma döngüsünü öğreten paketlenmiş bir `browser-automation` skill.
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

"Browser disabled" alırsanız yapılandırmada etkinleştirin (aşağıya bakın) ve
Gateway'i yeniden başlatın.

`openclaw browser` tamamen yoksa veya aracı tarayıcı aracının
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

Varsayılanlar için hem `plugins.entries.browser.enabled` **hem de** `browser.enabled=true` gerekir. Yalnızca Plugin'i devre dışı bırakmak `openclaw browser` CLI'ını, `browser.request` gateway yöntemini, aracı aracını ve denetim hizmetini tek bir birim olarak kaldırır; `browser.*` yapılandırmanız bir yedek için olduğu gibi kalır.

Tarayıcı yapılandırması değişiklikleri, Plugin'in hizmetini yeniden kaydedebilmesi için Gateway'in yeniden başlatılmasını gerektirir.

## Aracı kılavuzu

Araç profili notu: `tools.profile: "coding"` `web_search` ve
`web_fetch` içerir, ancak tam `browser` aracını içermez. Aracı veya
başlatılmış bir alt aracı tarayıcı otomasyonu kullanacaksa profil
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
`tools.subagents.tools.allow: ["browser"]` tek başına yeterli değildir çünkü alt aracı
ilkesi profil filtrelemesinden sonra uygulanır.

Tarayıcı Plugin'i iki düzeyde aracı kılavuzu sunar:

- `browser` araç açıklaması, kısa ve her zaman açık sözleşmeyi taşır: doğru profili seç,
  ref'leri aynı sekmede tut, sekme hedefleme için `tabId`/etiketleri kullan
  ve çok adımlı işler için tarayıcı skill'ini yükle.
- Paketlenmiş `browser-automation` skill'i daha uzun işletim döngüsünü taşır:
  önce durum/sekme kontrolü yap, görev sekmelerini etiketle, eylemden önce anlık görüntü al, kullanıcı arayüzü
  değişikliklerinden sonra yeniden anlık görüntü al, eski ref'leri bir kez kurtar ve oturum açma/2FA/captcha ya da
  kamera/mikrofon engelleyicilerini tahmin etmek yerine manuel eylem olarak bildir.

Plugin ile paketlenmiş skills, Plugin etkinleştirildiğinde aracının kullanılabilir skills listesinde görünür.
Tam skill talimatları istek üzerine yüklenir, bu nedenle rutin
turlar tam token maliyetini ödemez.

## Eksik tarayıcı komutu veya aracı

Bir yükseltmeden sonra `openclaw browser` bilinmiyorsa, `browser.request` eksikse veya aracı tarayıcı aracını kullanılamaz olarak bildiriyorsa olağan neden, `browser` öğesini atlayan bir `plugins.allow` listesi ve kök `browser` yapılandırma bloğunun bulunmamasıdır. Ekleyin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Açık bir kök `browser` bloğu, örneğin `browser.enabled=true` veya `browser.profiles.<name>`, kısıtlayıcı bir `plugins.allow` altında bile paketlenmiş tarayıcı Plugin'ini etkinleştirir ve kanal yapılandırması davranışıyla eşleşir. `plugins.entries.browser.enabled=true` ve `tools.alsoAllow: ["browser"]` kendi başlarına izin listesi üyeliğinin yerini tutmaz. `plugins.allow` öğesini tamamen kaldırmak da varsayılanı geri yükler.

## Profiller: `openclaw` ve `user`

- `openclaw`: yönetilen, yalıtılmış tarayıcı (uzantı gerekmez).
- `user`: **gerçek oturum açılmış Chrome**
  oturumunuz için yerleşik Chrome MCP bağlanma profili.

Aracı tarayıcı aracı çağrıları için:

- Varsayılan: yalıtılmış `openclaw` tarayıcısını kullanın.
- Mevcut oturum açılmış oturumlar önemli olduğunda ve kullanıcı
  herhangi bir bağlanma istemini tıklamak/onaylamak için bilgisayar başındaysa `profile="user"` tercih edin.
- Belirli bir tarayıcı modu istediğinizde açık geçersiz kılma `profile` değeridir.

Varsayılan olarak yönetilen modu istiyorsanız `browser.defaultProfile: "openclaw"` ayarlayın.

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

- Denetim hizmeti, `gateway.port` değerinden türetilen bir bağlantı noktasında loopback'e bağlanır (varsayılan `18791` = gateway + 2). `gateway.port` veya `OPENCLAW_GATEWAY_PORT` geçersiz kılındığında türetilen bağlantı noktaları aynı aile içinde kayar.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar; bunları yalnızca uzak CDP için ayarlayın. `cdpUrl` ayarlanmamışsa varsayılan olarak yönetilen yerel CDP bağlantı noktasını kullanır.
- `remoteCdpTimeoutMs`, uzak ve `attachOnly` CDP HTTP erişilebilirlik
  denetimlerine ve sekme açma HTTP isteklerine uygulanır; `remoteCdpHandshakeTimeoutMs`
  bunların CDP WebSocket el sıkışmalarına uygulanır.
- `localLaunchTimeoutMs`, yerel olarak başlatılan yönetilen bir Chrome
  sürecinin CDP HTTP uç noktasını sunması için bütçedir. `localCdpReadyTimeoutMs`,
  süreç keşfedildikten sonra CDP websocket hazırlığı için takip
  bütçesidir. Chromium'un yavaş başladığı Raspberry Pi, düşük seviye VPS veya eski donanımlarda
  bunları artırın. Değerler `120000` ms'ye kadar pozitif tamsayı olmalıdır; geçersiz
  yapılandırma değerleri reddedilir.
- Tekrarlanan yönetilen Chrome başlatma/hazırlık hataları profil başına devre kesiciye alınır.
  Art arda birkaç hatadan sonra OpenClaw, her tarayıcı aracı çağrısında Chromium başlatmak yerine
  yeni başlatma denemelerini kısa süreliğine duraklatır. Başlangıç sorununu düzeltin,
  gerekli değilse tarayıcıyı devre dışı bırakın veya onarımdan sonra
  Gateway'i yeniden başlatın.
- `actionTimeoutMs`, çağıran `timeoutMs` geçmediğinde tarayıcı `act` istekleri için varsayılan bütçedir. İstemci aktarımı küçük bir pay penceresi ekler, böylece uzun beklemeler HTTP sınırında zaman aşımına uğramak yerine tamamlanabilir.
- `tabCleanup`, birincil aracı tarayıcı oturumları tarafından açılan sekmeler için en iyi çaba temizliğidir. Alt aracı, Cron ve ACP yaşam döngüsü temizliği, oturum sonunda açıkça izlenen sekmelerini yine de kapatır; birincil oturumlar etkin sekmeleri yeniden kullanılabilir tutar, ardından arka planda boşta veya fazla izlenen sekmeleri kapatır.

</Accordion>

<Accordion title="SSRF policy">

- Tarayıcı gezinmesi ve sekme açma, gezinmeden önce SSRF korumasından geçirilir ve son `http(s)` URL'sinde sonrasında en iyi çabayla yeniden denetlenir.
- Katı SSRF modunda, uzak CDP uç noktası keşfi ve `/json/version` yoklamaları (`cdpUrl`) da denetlenir.
- Gateway/sağlayıcı `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve `NO_PROXY` ortam değişkenleri, OpenClaw tarafından yönetilen tarayıcıyı otomatik olarak proxy'den geçirmez. Yönetilen Chrome varsayılan olarak doğrudan başlatılır; böylece sağlayıcı proxy ayarları tarayıcı SSRF denetimlerini zayıflatmaz.
- Yönetilen tarayıcının kendisini proxy'den geçirmek için `browser.extraArgs` üzerinden `--proxy-server=...` veya `--proxy-pac-url=...` gibi açık Chrome proxy bayrakları geçirin. Katı SSRF modu, özel ağ tarayıcı erişimi kasıtlı olarak etkinleştirilmediği sürece açık tarayıcı proxy yönlendirmesini engeller.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak kapalıdır; yalnızca özel ağ tarayıcı erişimine kasıtlı olarak güvenildiğinde etkinleştirin.
- `browser.ssrfPolicy.allowPrivateNetwork` eski bir takma ad olarak desteklenmeye devam eder.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true`, yerel bir tarayıcıyı asla başlatma; yalnızca zaten çalışıyorsa ona bağlan anlamına gelir.
- `headless`, global olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.headless` değerini geçersiz kılar; böylece yerel olarak başlatılan bir profil headless kalırken başka bir profil görünür kalabilir.
- `POST /start?headless=true` ve `openclaw browser start --headless`, yerel yönetilen profiller için
  `browser.headless` veya profil yapılandırmasını yeniden yazmadan tek seferlik
  bir headless başlatma ister. Mevcut oturum, yalnızca bağlanma ve
  uzak CDP profilleri bu geçersiz kılmayı reddeder; çünkü OpenClaw bu
  tarayıcı süreçlerini başlatmaz.
- `DISPLAY` veya `WAYLAND_DISPLAY` olmayan Linux ana makinelerinde, ne ortam ne de profil/global
  yapılandırma açıkça pencereli modu seçmediğinde yerel yönetilen profiller
  otomatik olarak varsayılan şekilde headless olur. `openclaw browser status --json`
  `headlessSource` değerini `env`, `profile`, `config`,
  `request`, `linux-display-fallback` veya `default` olarak bildirir.
- `OPENCLAW_BROWSER_HEADLESS=1`, geçerli süreç için yerel yönetilen başlatmaları
  headless olmaya zorlar. `OPENCLAW_BROWSER_HEADLESS=0`, olağan
  başlatmalar için pencereli modu zorlar ve görüntü sunucusu olmayan Linux ana makinelerinde
  işlem yapılabilir bir hata döndürür; açık bir `start --headless` isteği yine de
  o tek başlatma için önceliklidir.
- `executablePath`, global olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.executablePath` değerini geçersiz kılar; böylece farklı yönetilen profiller farklı Chromium tabanlı tarayıcılar başlatabilir. Her iki biçim de işletim sistemi ana dizininiz için `~` kabul eder.
- `color` (üst düzey ve profil başına), hangi profilin etkin olduğunu görebilmeniz için tarayıcı kullanıcı arayüzünü renklendirir.
- Varsayılan profil `openclaw` (yönetilen bağımsız) profilidir. Oturum açılmış kullanıcı tarayıcısını seçmek için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: Chromium tabanlıysa sistem varsayılan tarayıcısı; aksi halde Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır. Bu driver için `cdpUrl` ayarlamayın.
- Mevcut oturum profili varsayılan olmayan bir Chromium kullanıcı profiline (Brave, Edge vb.) bağlanacaksa `browser.profiles.<name>.userDataDir` değerini ayarlayın. Bu yol da işletim sistemi ana dizininiz için `~` kabul eder.

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
yönetilen profilleri etkiler. `existing-session` profilleri bunun yerine
zaten çalışan bir tarayıcıya bağlanır ve uzak CDP profilleri `cdpUrl` arkasındaki
tarayıcıyı kullanır.

## Yerel ve uzak kontrol

- **Yerel kontrol (varsayılan):** Gateway, local loopback kontrol hizmetini başlatır ve yerel bir tarayıcı başlatabilir.
- **Uzak kontrol (Node ana makinesi):** tarayıcının bulunduğu makinede bir Node ana makinesi çalıştırın; Gateway tarayıcı eylemlerini ona proxy'ler.
- **Uzak CDP:** uzak bir Chromium tabanlı tarayıcıya bağlanmak için
  `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`) ayarlayın. Bu durumda OpenClaw yerel bir tarayıcı başlatmaz.
- local loopback üzerinde harici olarak yönetilen CDP hizmetleri için (örneğin
  Docker içinde `127.0.0.1` üzerinde yayımlanan Browserless), ayrıca `attachOnly: true` ayarlayın. `attachOnly` olmadan local loopback CDP,
  yerel OpenClaw tarafından yönetilen bir tarayıcı profili olarak değerlendirilir.
- `headless` yalnızca OpenClaw tarafından başlatılan yerel yönetilen profilleri etkiler. Mevcut oturum veya uzak CDP tarayıcılarını yeniden başlatmaz ya da değiştirmez.
- `executablePath` aynı yerel yönetilen profil kuralını izler. Çalışan bir
  yerel yönetilen profilde bunu değiştirmek, sonraki başlatmanın yeni ikili dosyayı
  kullanması için o profili yeniden başlatma/uzlaştırma olarak işaretler.

Durdurma davranışı profil moduna göre değişir:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw'ın başlattığı
  tarayıcı sürecini durdurur
- yalnızca bağlanma ve uzak CDP profilleri: `openclaw browser stop`, etkin
  kontrol oturumunu kapatır ve Playwright/CDP öykünme geçersiz kılmalarını
  (viewport, renk şeması, yerel ayar, saat dilimi, çevrimdışı mod ve benzer durum)
  serbest bırakır; OpenClaw tarafından hiçbir tarayıcı süreci başlatılmamış
  olsa bile

Uzak CDP URL'leri kimlik doğrulama içerebilir:

- Sorgu token'ları (örn. `https://provider.example?token=<token>`)
- HTTP Basic auth (örn. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktalarını çağırırken ve CDP WebSocket'e bağlanırken
kimlik doğrulamayı korur. Token'ları yapılandırma dosyalarına commit etmek yerine
ortam değişkenlerini veya secrets yöneticilerini tercih edin.

## Node tarayıcı proxy'si (sıfır yapılandırmalı varsayılan)

Tarayıcınızın bulunduğu makinede bir **Node ana makinesi** çalıştırırsanız, OpenClaw
ek tarayıcı yapılandırması olmadan tarayıcı aracı çağrılarını otomatik olarak
o Node'a yönlendirebilir. Bu, uzak Gateway'ler için varsayılan yoldur.

Notlar:

- Node ana makinesi, yerel tarayıcı kontrol sunucusunu bir **proxy komutu** üzerinden sunar.
- Profiller, Node'un kendi `browser.profiles` yapılandırmasından gelir (yerelle aynı).
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için boş bırakın: profil oluşturma/silme rotaları dahil tüm yapılandırılmış profillere proxy üzerinden erişilebilir kalır.
- `nodeHost.browserProxy.allowProfiles` ayarlarsanız, OpenClaw bunu en az yetki sınırı olarak değerlendirir: yalnızca izin listesine alınmış profiller hedeflenebilir ve kalıcı profil oluşturma/silme rotaları proxy yüzeyinde engellenir.
- İstemiyorsanız devre dışı bırakın:
  - Node üzerinde: `nodeHost.browserProxy.enabled=false`
  - Gateway üzerinde: `gateway.nodes.browser.mode="off"`

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), CDP bağlantı URL'lerini HTTPS ve WebSocket
üzerinden sunan barındırılan bir Chromium hizmetidir. OpenClaw iki biçimi de kullanabilir, ancak
uzak tarayıcı profili için en basit seçenek Browserless'ın bağlantı belgelerindeki
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
- Browserless size bir HTTPS temel URL'si verirse, bunu doğrudan CDP bağlantısı için
  `wss://` biçimine dönüştürebilir veya HTTPS URL'sini koruyup OpenClaw'ın
  `/json/version` keşfetmesine izin verebilirsiniz.

### Aynı ana makinede Browserless Docker

Browserless Docker içinde self-hosted çalıştırıldığında ve OpenClaw ana makinede çalıştığında,
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
erişilebilmelidir. Browserless ayrıca eşleşen erişilebilir bir uç nokta ilan etmelidir;
Browserless `EXTERNAL` değerini aynı OpenClaw'a açık WebSocket tabanına ayarlayın; örneğin
`ws://127.0.0.1:3000`, `ws://browserless:3000` veya kararlı bir özel Docker
ağ adresi. `/json/version`, OpenClaw'ın erişemediği bir adrese işaret eden
`webSocketDebuggerUrl` döndürürse, CDP HTTP sağlıklı görünebilirken WebSocket
bağlanması yine de başarısız olur.

local loopback Browserless profili için `attachOnly` değerini ayarlanmamış bırakmayın.
`attachOnly` olmadan OpenClaw, local loopback portunu yerel yönetilen tarayıcı
profili olarak değerlendirir ve portun kullanımda olduğunu ancak OpenClaw'a ait olmadığını
bildirebilir.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılan tarayıcı hizmetleri, standart HTTP tabanlı CDP keşfi
(`/json/version`) yerine bir **doğrudan WebSocket** uç noktası sunar. OpenClaw üç
CDP URL biçimini kabul eder ve doğru bağlantı stratejisini otomatik olarak seçer:

- **HTTP(S) keşfi** - `http://host[:port]` veya `https://host[:port]`.
  OpenClaw, WebSocket hata ayıklayıcı URL'sini keşfetmek için `/json/version` çağırır, ardından
  bağlanır. WebSocket fallback yoktur.
- **Doğrudan WebSocket uç noktaları** - `ws://host[:port]/devtools/<kind>/<id>` veya
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>` yoluna sahip
  `wss://...`. OpenClaw doğrudan bir WebSocket el sıkışması üzerinden bağlanır ve
  `/json/version` adımını tamamen atlar.
- **Çıplak WebSocket kökleri** - `/devtools/...` yolu olmayan
  `ws://host[:port]` veya `wss://host[:port]` (örn. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw önce HTTP
  `/json/version` keşfini dener (şemayı `http`/`https` olarak normalleştirerek);
  keşif bir `webSocketDebuggerUrl` döndürürse bu kullanılır, aksi halde OpenClaw
  çıplak kökte doğrudan WebSocket el sıkışmasına geri döner. İlan edilen
  WebSocket uç noktası CDP el sıkışmasını reddeder ancak yapılandırılmış çıplak kök
  bunu kabul ederse, OpenClaw o köke de geri döner. Bu, yerel Chrome'a işaret eden çıplak bir `ws://`
  adresinin yine de bağlanmasını sağlar; çünkü Chrome yalnızca `/json/version` tarafından verilen
  hedefe özgü belirli yolda WebSocket yükseltmelerini kabul ederken, barındırılan
  sağlayıcılar keşif uç noktaları Playwright CDP için uygun olmayan kısa ömürlü
  bir URL ilan ettiğinde kök WebSocket uç noktalarını kullanmaya devam edebilir.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözme, stealth modu ve konut
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

- [Kaydolun](https://www.browserbase.com/sign-up) ve **API Anahtarınızı**
  [Overview kontrol panelinden](https://www.browserbase.com/overview) kopyalayın.
- `<BROWSERBASE_API_KEY>` değerini gerçek Browserbase API anahtarınızla değiştirin.
- Browserbase, WebSocket bağlantısında otomatik olarak bir tarayıcı oturumu oluşturur; bu nedenle
  manuel oturum oluşturma adımı gerekmez.
- Ücretsiz katman, bir eşzamanlı oturuma ve ayda bir tarayıcı saatine izin verir.
  Ücretli plan sınırları için [fiyatlandırmaya](https://www.browserbase.com/pricing) bakın.
- Tam API başvurusu, SDK kılavuzları ve entegrasyon örnekleri için
  [Browserbase belgelerine](https://docs.browserbase.com) bakın.

## Güvenlik

Temel fikirler:

- Tarayıcı kontrolü yalnızca loopback içindir; erişim Gateway'in kimlik doğrulaması veya Node eşleştirmesi üzerinden akar.
- Bağımsız loopback tarayıcı HTTP API'si **yalnızca paylaşılan-gizli anahtar kimlik doğrulaması** kullanır:
  gateway token bearer kimlik doğrulaması, `x-openclaw-password` veya
  yapılandırılmış gateway parolasıyla HTTP Basic kimlik doğrulaması.
- Tailscale Serve kimlik başlıkları ve `gateway.auth.mode: "trusted-proxy"` bu
  bağımsız loopback tarayıcı API'sinin kimliğini **doğrulamaz**.
- Tarayıcı kontrolü etkinse ve paylaşılan-gizli anahtar kimlik doğrulaması yapılandırılmamışsa OpenClaw,
  o başlatma için yalnızca çalışma zamanına ait bir gateway token'ı oluşturur. İstemcilerin yeniden
  başlatmalar arasında kararlı bir gizli anahtara ihtiyacı varsa
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` veya
  `OPENCLAW_GATEWAY_PASSWORD` değerini açıkça yapılandırın.
- `gateway.auth.mode` zaten `password`, `none` veya `trusted-proxy` olduğunda
  OpenClaw bu token'ı otomatik olarak oluşturmaz.
- Gateway'i ve tüm Node ana makinelerini özel bir ağda (Tailscale) tutun; herkese açık erişimden kaçının.
- Uzak CDP URL'lerini/token'larını gizli bilgi olarak ele alın; ortam değişkenlerini veya bir gizli bilgi yöneticisini tercih edin.

Uzak CDP ipuçları:

- Mümkün olduğunda şifrelenmiş uç noktaları (HTTPS veya WSS) ve kısa ömürlü token'ları tercih edin.
- Uzun ömürlü token'ları doğrudan yapılandırma dosyalarına gömmekten kaçının.

## Profiller (çok tarayıcılı)

OpenClaw birden çok adlandırılmış profili (yönlendirme yapılandırmaları) destekler. Profiller şunlar olabilir:

- **openclaw-managed**: kendi kullanıcı veri dizini + CDP portu olan ayrılmış Chromium tabanlı tarayıcı örneği
- **uzak**: açık bir CDP URL'si (başka bir yerde çalışan Chromium tabanlı tarayıcı)
- **mevcut oturum**: Chrome DevTools MCP otomatik bağlanma üzerinden mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili eksikse otomatik oluşturulur.
- `user` profili, Chrome MCP mevcut oturum ekleme için yerleşik olarak gelir.
- Mevcut oturum profilleri `user` dışında isteğe bağlıdır; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP portları varsayılan olarak **18800-18899** aralığından ayrılır.
- Bir profili silmek, yerel veri dizinini Çöp Kutusu'na taşır.

Tüm kontrol uç noktaları `?profile=<name>` kabul eder; CLI `--browser-profile` kullanır.

## Chrome DevTools MCP üzerinden mevcut oturum

OpenClaw, resmi Chrome DevTools MCP sunucusu üzerinden çalışan bir Chromium tabanlı
tarayıcı profiline de eklenebilir. Bu, o tarayıcı profilinde zaten açık olan
sekmeleri ve oturum açma durumunu yeniden kullanır.

Resmi arka plan ve kurulum başvuruları:

- [Geliştiriciler için Chrome: Tarayıcı oturumunuzla Chrome DevTools MCP kullanın](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil:

- `user`

İsteğe bağlı: farklı bir ad, renk veya tarayıcı veri dizini istiyorsanız
kendi özel mevcut oturum profilinizi oluşturun.

Varsayılan davranış:

- Yerleşik `user` profili, varsayılan yerel Google Chrome profilini hedefleyen
  Chrome MCP otomatik bağlanmayı kullanır.

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

1. Uzak hata ayıklama için o tarayıcının inceleme sayfasını açın.
2. Uzak hata ayıklamayı etkinleştirin.
3. Tarayıcıyı çalışır durumda tutun ve OpenClaw eklendiğinde bağlantı istemini onaylayın.

Yaygın inceleme sayfaları:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Canlı eklenme duman testi:

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
- `snapshot`, seçilen canlı sekmeden ref'ler döndürür

Eklenme çalışmazsa kontrol edilecekler:

- hedef Chromium tabanlı tarayıcı `144+` sürümündedir
- uzak hata ayıklama, o tarayıcının inceleme sayfasında etkindir
- tarayıcı eklenme izin istemini gösterdi ve siz kabul ettiniz
- `openclaw doctor` eski eklenti tabanlı tarayıcı yapılandırmasını taşır ve
  varsayılan otomatik bağlanma profilleri için Chrome'un yerelde yüklü olduğunu denetler, ancak
  tarayıcı tarafındaki uzak hata ayıklamayı sizin için etkinleştiremez

Ajan kullanımı:

- Kullanıcının oturum açmış tarayıcı durumuna ihtiyacınız olduğunda `profile="user"` kullanın.
- Özel bir mevcut oturum profili kullanıyorsanız o açık profil adını geçirin.
- Bu modu yalnızca kullanıcı eklenme istemini onaylamak üzere bilgisayar başındayken seçin.
- Gateway veya Node ana makinesi `npx chrome-devtools-mcp@latest --autoConnect` başlatabilir

Notlar:

- Bu yol, oturum açmış tarayıcı oturumunuzun içinde işlem yapabileceği için
  yalıtılmış `openclaw` profilinden daha yüksek risklidir.
- OpenClaw bu sürücü için tarayıcıyı başlatmaz; yalnızca eklenir.
- OpenClaw burada resmi Chrome DevTools MCP `--autoConnect` akışını kullanır.
  `userDataDir` ayarlanmışsa, o kullanıcı veri dizinini hedeflemek için iletilir.
- Mevcut oturum, seçilen ana makinede veya bağlı bir tarayıcı Node'u üzerinden eklenebilir.
  Chrome başka bir yerdeyse ve bağlı tarayıcı Node'u yoksa bunun yerine
  uzak CDP veya bir Node ana makinesi kullanın.

### Özel Chrome MCP başlatma

Varsayılan `npx chrome-devtools-mcp@latest` akışı istediğiniz şey olmadığında
(çevrimdışı ana makineler, sabitlenmiş sürümler, vendored ikililer) başlatılan Chrome DevTools MCP sunucusunu profil bazında geçersiz kılın:

| Alan         | Ne yapar                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` yerine başlatılacak çalıştırılabilir dosya. Olduğu gibi çözümlenir; mutlak yollar dikkate alınır.                    |
| `mcpArgs`    | `mcpCommand` öğesine aynen geçirilen bağımsız değişken dizisi. Varsayılan `chrome-devtools-mcp@latest --autoConnect` bağımsız değişkenlerinin yerini alır. |

Mevcut oturum profilinde `cdpUrl` ayarlandığında OpenClaw
`--autoConnect` öğesini atlar ve uç noktayı otomatik olarak Chrome MCP'ye iletir:

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP keşif uç noktası).
- `ws(s)://...` → `--wsEndpoint <url>` (doğrudan CDP WebSocket).

Uç nokta bayrakları ve `userDataDir` birleştirilemez: `cdpUrl` ayarlandığında
Chrome MCP başlatması için `userDataDir` yok sayılır, çünkü Chrome MCP bir profil
dizini açmak yerine uç noktanın arkasındaki çalışan tarayıcıya eklenir.

<Accordion title="Mevcut oturum özellik sınırlamaları">

Yönetilen `openclaw` profiliyle karşılaştırıldığında mevcut oturum sürücüleri daha sınırlıdır:

- **Ekran görüntüleri** - sayfa yakalamaları ve `--ref` öğe yakalamaları çalışır; CSS `--element` seçicileri çalışmaz. `--full-page`, `--ref` veya `--element` ile birleştirilemez. Sayfa veya ref tabanlı öğe ekran görüntüleri için Playwright gerekli değildir.
- **Eylemler** - `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select` snapshot ref'leri gerektirir (CSS seçicileri yoktur). `click-coords`, görünür viewport koordinatlarına tıklar ve snapshot ref'i gerektirmez. `click` yalnızca sol düğmedir. `type`, `slowly=true` desteklemez; `fill` veya `press` kullanın. `press`, `delayMs` desteklemez. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` ve `evaluate` çağrı başına zaman aşımlarını desteklemez. `select` tek bir değer kabul eder.
- **Bekleme / yükleme / iletişim kutusu** - `wait --url` tam, alt dize ve glob kalıplarını destekler; `wait --load networkidle` desteklenmez. Yükleme hook'ları `ref` veya `inputRef` gerektirir, tek seferde bir dosya kullanır, CSS `element` yoktur. İletişim kutusu hook'ları zaman aşımı geçersiz kılmalarını desteklemez.
- **Yalnızca yönetilen özellikler** - toplu eylemler, PDF dışa aktarma, indirme yakalama ve `responsebody` hâlâ yönetilen tarayıcı yolunu gerektirir.

</Accordion>

## Yalıtım garantileri

- **Ayrılmış kullanıcı veri dizini**: kişisel tarayıcı profilinize asla dokunmaz.
- **Ayrılmış portlar**: geliştirme iş akışlarıyla çakışmaları önlemek için `9222` kullanmaz.
- **Belirleyici sekme kontrolü**: `tabs` önce `suggestedTargetId` döndürür, ardından
  `t1` gibi kararlı `tabId` tutamaçları, isteğe bağlı etiketler ve ham `targetId` gelir.
  Ajanlar `suggestedTargetId` değerini yeniden kullanmalıdır; ham kimlikler
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

- macOS: `/Applications` ve `~/Applications` dizinlerini denetler.
- Linux: `/usr/bin`, `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` ve
  `/usr/lib/chromium-browser` altındaki yaygın Chrome/Brave/Edge/Chromium konumlarını denetler.
- Windows: yaygın kurulum konumlarını denetler.

## Kontrol API'si (isteğe bağlı)

Betikleme ve hata ayıklama için Gateway, küçük bir **yalnızca loopback HTTP
kontrol API'si** ve buna karşılık gelen bir `openclaw browser` CLI'si sunar (snapshot'lar, ref'ler, bekleme
güçlendirmeleri, JSON çıktısı, hata ayıklama iş akışları). Tam başvuru için
[Tarayıcı kontrol API'si](/tr/tools/browser-control) sayfasına bakın.

## Sorun giderme

Linux'a özgü sorunlar (özellikle snap Chromium) için
[Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting) sayfasına bakın.

WSL2 Gateway + Windows Chrome bölünmüş ana makine kurulumları için
[WSL2 + Windows + uzak Chrome CDP sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting) sayfasına bakın.

### CDP başlatma hatası ile gezinme SSRF engeli arasındaki fark

Bunlar farklı hata sınıflarıdır ve farklı kod yollarını işaret eder.

- **CDP başlatma veya hazır olma hatası**, OpenClaw'un tarayıcı kontrol düzleminin sağlıklı olduğunu doğrulayamadığı anlamına gelir.
- **Gezinme SSRF engeli**, tarayıcı kontrol düzleminin sağlıklı olduğu, ancak bir sayfa gezinme hedefinin ilke tarafından reddedildiği anlamına gelir.

Yaygın örnekler:

- CDP başlatma veya hazır olma hatası:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - Loopback harici CDP hizmeti `attachOnly: true` olmadan yapılandırıldığında
    `Port <port> is in use for profile "<name>" but not by openclaw`
- Gezinme SSRF engeli:
  - `start` ve `tabs` hâlâ çalışırken `open`, `navigate`, snapshot veya sekme açma akışları bir tarayıcı/ağ ilkesi hatasıyla başarısız olur

İkisini ayırmak için bu en küçük sırayı kullanın:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Sonuçları okuma:

- `start`, `not reachable after start` ile başarısız olursa önce CDP hazır olma durumunu sorun giderin.
- `start` başarılı olur ancak `tabs` başarısız olursa kontrol düzlemi hâlâ sağlıksızdır. Bunu sayfa gezinme sorunu değil, CDP erişilebilirlik sorunu olarak ele alın.
- `start` ve `tabs` başarılı olur ancak `open` veya `navigate` başarısız olursa tarayıcı kontrol düzlemi ayaktadır ve hata gezinme ilkesinde veya hedef sayfadadır.
- `start`, `tabs` ve `open` hepsi başarılı olursa temel yönetilen tarayıcı kontrol yolu sağlıklıdır.

Önemli davranış ayrıntıları:

- `browser.ssrfPolicy` yapılandırmasanız bile tarayıcı yapılandırması varsayılan olarak hata kapalı SSRF ilkesi nesnesine ayarlanır.
- Yerel loopback `openclaw` yönetilen profili için CDP sağlık denetimleri, OpenClaw'un kendi yerel kontrol düzlemi için tarayıcı SSRF erişilebilirlik zorlamasını kasıtlı olarak atlar.
- Gezinme koruması ayrıdır. Başarılı bir `start` veya `tabs` sonucu, daha sonraki bir `open` veya `navigate` hedefinin izinli olduğu anlamına gelmez.

Güvenlik rehberi:

- Tarayıcı SSRF ilkesini varsayılan olarak **gevşetmeyin**.
- Geniş özel ağ erişimi yerine `hostnameAllowlist` veya `allowedHostnames` gibi dar ana makine istisnalarını tercih edin.
- `dangerouslyAllowPrivateNetwork: true` yalnızca özel ağ tarayıcı erişiminin gerekli olduğu ve gözden geçirildiği, bilerek güvenilen ortamlarda kullanın.

## Ajan araçları + kontrolün çalışma şekli

Ajan, tarayıcı otomasyonu için **tek bir araç** alır:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Nasıl eşlenir:

- `browser snapshot`, kararlı bir kullanıcı arayüzü ağacı (AI veya ARIA) döndürür.
- `browser act`, tıklamak/yazmak/sürüklemek/seçmek için anlık görüntü `ref` kimliklerini kullanır.
- `browser screenshot`, pikselleri yakalar (tam sayfa, öğe veya etiketli başvurular).
- `browser doctor`, Gateway, Plugin, profil, tarayıcı ve sekme hazır olma durumunu denetler.
- `browser` şunları kabul eder:
  - adlandırılmış bir tarayıcı profili seçmek için `profile` (openclaw, chrome veya uzak CDP).
  - tarayıcının nerede bulunduğunu seçmek için `target` (`sandbox` | `host` | `node`).
  - Sandbox içindeki oturumlarda `target: "host"` için `agents.defaults.sandbox.browser.allowHostControl=true` gerekir.
  - `target` atlanırsa: sandbox içindeki oturumlar varsayılan olarak `sandbox`, sandbox dışı oturumlar varsayılan olarak `host` kullanır.
  - Tarayıcı yeteneğine sahip bir node bağlıysa, `target="host"` veya `target="node"` sabitlemediğiniz sürece araç ona otomatik yönlendirme yapabilir.

Bu, ajanı deterministik tutar ve kırılgan seçicilerden kaçınır.

## İlgili

- [Araçlara Genel Bakış](/tr/tools) - kullanılabilir tüm ajan araçları
- [Sandboxing](/tr/gateway/sandboxing) - sandbox içindeki ortamlarda tarayıcı denetimi
- [Güvenlik](/tr/gateway/security) - tarayıcı denetimi riskleri ve sağlamlaştırma
