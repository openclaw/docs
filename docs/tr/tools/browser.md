---
read_when:
    - Agent denetimli tarayıcı otomasyonu ekleme
    - OpenClaw'ın kendi Chrome'unuza neden müdahale ettiğini hata ayıklama
    - macOS uygulamasında tarayıcı ayarlarını ve yaşam döngüsünü uygulama
summary: Entegre tarayıcı kontrol hizmeti + eylem komutları
title: Tarayıcı (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-06-28T01:20:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw, ajanın kontrol ettiği **özel bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir.
Kişisel tarayıcınızdan yalıtılmıştır ve Gateway içinde küçük bir yerel
kontrol hizmetiyle yönetilir (yalnızca loopback).

Başlangıç görünümü:

- Bunu **ayrı, yalnızca ajana ait bir tarayıcı** olarak düşünün.
- `openclaw` profili kişisel tarayıcı profilinize **dokunmaz**.
- Ajan güvenli bir hatta **sekmeler açabilir, sayfaları okuyabilir, tıklayabilir ve yazabilir**.
- Yerleşik `user` profili, Chrome MCP üzerinden gerçek oturum açılmış Chrome oturumunuza bağlanır.

## Ne elde edersiniz

- **openclaw** adlı ayrı bir tarayıcı profili (varsayılan olarak turuncu vurgu).
- Deterministik sekme kontrolü (listele/aç/odakla/kapat).
- Ajan eylemleri (tıkla/yaz/sürükle/seç), anlık görüntüler, ekran görüntüleri, PDF'ler.
- Tarayıcı
  plugin etkinleştirildiğinde ajanlara anlık görüntü, kararlı sekme, bayat referans ve manuel engelleyici kurtarma döngüsünü öğreten paketlenmiş bir `browser-automation` skill'i.
- İsteğe bağlı çoklu profil desteği (`openclaw`, `work`, `remote`, ...).

Bu tarayıcı **günlük kullandığınız tarayıcı** değildir. Ajan otomasyonu ve doğrulaması için
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

"Browser disabled" hatasını alırsanız, yapılandırmada etkinleştirin (aşağıya bakın) ve
Gateway'i yeniden başlatın.

`openclaw browser` tamamen eksikse veya ajan tarayıcı aracının
kullanılamadığını söylüyorsa, [Eksik tarayıcı komutu veya aracı](/tr/tools/browser#missing-browser-command-or-tool) bölümüne geçin.

## Plugin kontrolü

Varsayılan `browser` aracı paketlenmiş bir plugin'dir. Aynı `browser` araç adını kaydeden başka bir plugin ile değiştirmek için devre dışı bırakın:

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

Varsayılanlar hem `plugins.entries.browser.enabled` **hem de** `browser.enabled=true` gerektirir. Yalnızca plugin'i devre dışı bırakmak, `openclaw browser` CLI'sini, `browser.request` gateway yöntemini, ajan aracını ve kontrol hizmetini tek bir birim olarak kaldırır; `browser.*` yapılandırmanız bir yedek için olduğu gibi kalır.

Tarayıcı yapılandırması değişiklikleri, plugin'in hizmetini yeniden kaydedebilmesi için Gateway'in yeniden başlatılmasını gerektirir.

## Ajan rehberliği

Araç profili notu: `tools.profile: "coding"` `web_search` ve
`web_fetch` içerir, ancak tam `browser` aracını içermez. Ajanın veya
başlatılan bir alt ajanın tarayıcı otomasyonu kullanması gerekiyorsa, profil
aşamasında browser ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Tek bir ajan için `agents.list[].tools.alsoAllow: ["browser"]` kullanın.
`tools.subagents.tools.allow: ["browser"]` tek başına yeterli değildir, çünkü alt ajan
politikası profil filtrelemesinden sonra uygulanır.

Tarayıcı plugin'i iki düzey ajan rehberliğiyle gelir:

- `browser` araç açıklaması kompakt ve her zaman etkin sözleşmeyi taşır: doğru
  profili seçin, referansları aynı sekmede tutun, sekme
  hedefleme için `tabId`/etiketleri kullanın ve çok adımlı işler için tarayıcı skill'ini yükleyin.
- Paketlenmiş `browser-automation` skill'i daha uzun işletim döngüsünü taşır:
  önce durum/sekmeleri kontrol edin, görev sekmelerini etiketleyin, işlemden önce anlık görüntü alın, UI değişikliklerinden sonra yeniden anlık görüntü alın, bayat referansları bir kez kurtarın ve oturum açma/2FA/captcha ya da
  kamera/mikrofon engelleyicilerini tahmin etmek yerine manuel işlem olarak bildirin.

Plugin ile paketlenmiş Skills, plugin etkinleştirildiğinde ajanın kullanılabilir Skills listesinde yer alır. Tam skill talimatları isteğe bağlı olarak yüklenir, böylece rutin
turlar tam token maliyetini ödemez.

## Eksik tarayıcı komutu veya aracı

Yükseltmeden sonra `openclaw browser` bilinmiyorsa, `browser.request` eksikse veya ajan tarayıcı aracını kullanılamaz olarak bildiriyorsa, olağan neden `browser`'ı atlayan bir `plugins.allow` listesi olması ve kök `browser` yapılandırma bloğunun bulunmamasıdır. Ekleyin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Açık bir kök `browser` bloğu, örneğin `browser.enabled=true` veya `browser.profiles.<name>`, kısıtlayıcı bir `plugins.allow` altında bile paketlenmiş tarayıcı plugin'ini etkinleştirir; bu, kanal yapılandırması davranışıyla eşleşir. `plugins.entries.browser.enabled=true` ve `tools.alsoAllow: ["browser"]` tek başlarına allowlist üyeliğinin yerine geçmez. `plugins.allow` listesini tamamen kaldırmak da varsayılanı geri yükler.

## Profiller: `openclaw` ve `user`

- `openclaw`: yönetilen, yalıtılmış tarayıcı (uzantı gerekmez).
- `user`: **gerçek oturum açılmış Chrome** oturumunuz için yerleşik Chrome MCP bağlanma profili.

Ajan tarayıcı aracı çağrıları için:

- Varsayılan: yalıtılmış `openclaw` tarayıcısını kullanın.
- Mevcut oturum açılmış oturumlar önemli olduğunda ve kullanıcı
  herhangi bir bağlanma istemine tıklamak/onaylamak için bilgisayar başındaysa `profile="user"` tercih edin.
- Belirli bir tarayıcı modu istediğinizde `profile` açık geçersiz kılmadır.

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

### Ekran görüntüsü görüsü (yalnızca metin model desteği)

Ana model yalnızca metinse (görü/multimodal desteği yoksa), tarayıcı
ekran görüntüleri modelin okuyamayacağı görüntü blokları döndürür. Tarayıcı ekran görüntüleri
mevcut görüntü anlama yapılandırmasını yeniden kullanır; böylece medya anlama için
yapılandırılmış bir görüntü modeli, tarayıcıya özel model ayarları olmadan ekran görüntülerini metin olarak açıklayabilir.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Nasıl çalışır:**

1. Ajan `browser screenshot` çağırır → görüntü her zamanki gibi diske yakalanır.
2. Tarayıcı aracı, mevcut görüntü anlama çalışma zamanına yapılandırılmış medya görüntü modellerini, paylaşılan medya
   modellerini, görüntü modeli varsayılanlarını veya kimlik doğrulama destekli bir görüntü sağlayıcısını kullanarak
   ekran görüntüsünü açıklayıp açıklayamayacağını sorar.
3. Görü modeli bir metin açıklaması döndürür; bu açıklama
   `wrapExternalContent` (prompt injection koruması) ile sarılır ve ajana
   görüntü bloğu yerine metin bloğu olarak döndürülür.
4. Görüntü anlama kullanılamıyorsa, atlandıysa veya başarısız olursa, tarayıcı
   özgün görüntü bloğunu döndürmeye geri döner.

Model
geri dönüşleri, zaman aşımları, bayt sınırları, profiller ve sağlayıcı istek ayarları için mevcut `tools.media.image` / `tools.media.models` alanlarını kullanın.

Etkin ana model zaten görüyü destekliyorsa ve açık bir görüntü
anlama modeli yapılandırılmamışsa, OpenClaw normal görüntü sonucunu korur; böylece
ana model ekran görüntüsünü doğrudan okuyabilir.

<AccordionGroup>

<Accordion title="Bağlantı noktaları ve erişilebilirlik">

- Kontrol hizmeti, `gateway.port` değerinden türetilen bir bağlantı noktasında loopback'e bağlanır (varsayılan `18791` = gateway + 2). `gateway.port` veya `OPENCLAW_GATEWAY_PORT` geçersiz kılındığında, türetilmiş bağlantı noktaları aynı aile içinde kayar.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar; bunları yalnızca
  uzak CDP profilleri veya mevcut oturum uç noktası bağlanması için ayarlayın. `cdpUrl` ayarlanmadığında
  yönetilen yerel CDP bağlantı noktasını varsayılan olarak kullanır.
- `remoteCdpTimeoutMs`, uzak ve `attachOnly` CDP HTTP erişilebilirlik
  kontrollerine ve sekme açma HTTP isteklerine uygulanır; `remoteCdpHandshakeTimeoutMs` ise
  bunların CDP WebSocket el sıkışmalarına uygulanır.
- `localLaunchTimeoutMs`, yerel olarak başlatılan yönetilen Chrome
  işleminin CDP HTTP uç noktasını açığa çıkarması için ayrılan bütçedir. `localCdpReadyTimeoutMs`, işlem keşfedildikten sonra CDP websocket hazırlığı için
  izleyen bütçedir.
  Chromium'un yavaş başladığı Raspberry Pi, düşük seviye VPS veya eski donanımlarda bunları artırın. Değerler `120000` ms'ye kadar pozitif tam sayılar olmalıdır; geçersiz
  yapılandırma değerleri reddedilir.
- Tekrarlanan yönetilen Chrome başlatma/hazırlık hataları profil başına circuit breaker'a alınır.
  Birkaç ardışık hatadan sonra OpenClaw, her tarayıcı aracı çağrısında Chromium başlatmak yerine yeni başlatma
  denemelerini kısa süreliğine duraklatır. Başlatma sorununu düzeltin, gerekmiyorsa tarayıcıyı devre dışı bırakın veya onarımdan sonra
  Gateway'i yeniden başlatın.
- `actionTimeoutMs`, çağıran `timeoutMs` geçmediğinde tarayıcı `act` istekleri için varsayılan bütçedir. İstemci taşıması, uzun beklemelerin HTTP sınırında zaman aşımına uğramak yerine tamamlanabilmesi için küçük bir ek süre penceresi ekler.
- `tabCleanup`, birincil ajan tarayıcı oturumları tarafından açılan sekmeler için en iyi çaba temizliğidir. Alt ajan, Cron ve ACP yaşam döngüsü temizliği oturum sonunda açıkça izlenen sekmelerini yine kapatır; birincil oturumlar etkin sekmeleri yeniden kullanılabilir tutar, ardından boşta veya fazla izlenen sekmeleri arka planda kapatır.

</Accordion>

<Accordion title="SSRF politikası">

- Tarayıcı gezintisi ve sekme açma, gezinmeden önce SSRF korumasından geçirilir ve son `http(s)` URL'sinde sonrasında en iyi çabayla yeniden denetlenir.
- Katı SSRF modunda, uzak CDP uç noktası keşfi ve `/json/version` yoklamaları (`cdpUrl`) da denetlenir.
- Gateway/sağlayıcı `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve `NO_PROXY` ortam değişkenleri, OpenClaw tarafından yönetilen tarayıcıyı otomatik olarak proxy üzerinden yönlendirmez. Yönetilen Chrome varsayılan olarak doğrudan başlatılır; böylece sağlayıcı proxy ayarları tarayıcı SSRF kontrollerini zayıflatmaz.
- OpenClaw tarafından yönetilen yerel CDP hazır olma yoklamaları ve DevTools WebSocket bağlantıları, tam olarak başlatılan loopback uç noktası için yönetilen ağ proxy'sini atlar; bu nedenle bir operatör proxy'si loopback çıkışını engellediğinde `openclaw browser start` yine çalışır.
- Yönetilen tarayıcının kendisini proxy üzerinden yönlendirmek için `browser.extraArgs` aracılığıyla `--proxy-server=...` veya `--proxy-pac-url=...` gibi açık Chrome proxy bayrakları geçirin. Katı SSRF modu, özel ağ tarayıcı erişimi kasıtlı olarak etkinleştirilmedikçe açık tarayıcı proxy yönlendirmesini engeller.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak kapalıdır; yalnızca özel ağ tarayıcı erişimine kasıtlı olarak güvenildiğinde etkinleştirin.
- `browser.ssrfPolicy.allowPrivateNetwork` eski takma ad olarak desteklenmeye devam eder.

</Accordion>

<Accordion title="Profil davranışı">

- `attachOnly: true`, yerel tarayıcıyı asla başlatma; yalnızca zaten çalışıyorsa bağlan anlamına gelir.
- `headless` genel olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.headless` değerini geçersiz kılar; böylece yerel olarak başlatılan bir profil headless kalırken bir diğeri görünür kalabilir.
- `POST /start?headless=true` ve `openclaw browser start --headless`, yerel yönetilen profiller için
  `browser.headless` veya profil yapılandırmasını yeniden yazmadan tek seferlik
  headless başlatma ister. Mevcut oturum, yalnızca bağlanma ve uzak CDP
  profilleri bu geçersiz kılmayı reddeder; çünkü OpenClaw bu tarayıcı
  süreçlerini başlatmaz.
- `DISPLAY` veya `WAYLAND_DISPLAY` olmayan Linux ana makinelerinde, ortam ya da
  profil/genel yapılandırma açıkça headed modu seçmediğinde yerel yönetilen profiller
  otomatik olarak varsayılan olarak headless olur. `openclaw browser status --json`
  `headlessSource` değerini `env`, `profile`, `config`,
  `request`, `linux-display-fallback` veya `default` olarak raporlar.
- `OPENCLAW_BROWSER_HEADLESS=1`, geçerli süreç için yerel yönetilen başlatmaları
  headless olmaya zorlar. `OPENCLAW_BROWSER_HEADLESS=0`, sıradan başlatmalar için headed
  modu zorlar ve görüntü sunucusu olmayan Linux ana makinelerinde uygulanabilir bir hata döndürür;
  açık bir `start --headless` isteği yine de o tek başlatma için önceliklidir.
- `executablePath` genel olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.executablePath` değerini geçersiz kılar; böylece farklı yönetilen profiller farklı Chromium tabanlı tarayıcıları başlatabilir. Her iki biçim de işletim sisteminizin ana dizini için `~` kabul eder.
- `color` (üst düzey ve profil başına), hangi profilin etkin olduğunu görebilmeniz için tarayıcı kullanıcı arayüzünü renklendirir.
- Varsayılan profil `openclaw` şeklindedir (yönetilen bağımsız). Oturum açmış kullanıcı tarayıcısına geçmek için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: Chromium tabanlıysa sistem varsayılan tarayıcısı; aksi halde Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır. Chrome MCP otomatik bağlanma üzerinden veya çalışan tarayıcı için zaten bir DevTools uç noktanız olduğunda `cdpUrl` üzerinden bağlanabilir.
- Bir existing-session profilinin varsayılan olmayan bir Chromium kullanıcı profiline (Brave, Edge vb.) bağlanması gerektiğinde `browser.profiles.<name>.userDataDir` ayarlayın. Bu yol da işletim sisteminizin ana dizini için `~` kabul eder.

</Accordion>

</AccordionGroup>

## Brave veya başka bir Chromium tabanlı tarayıcı kullanın

**Sistem varsayılan** tarayıcınız Chromium tabanlıysa (Chrome/Brave/Edge/vb.),
OpenClaw bunu otomatik olarak kullanır. Otomatik algılamayı geçersiz kılmak için
`browser.executablePath` ayarlayın. Üst düzey ve profil başına `executablePath`
değerleri işletim sisteminizin ana dizini için `~` kabul eder:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Ya da yapılandırmada platform başına ayarlayın:

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

Profil başına `executablePath` yalnızca OpenClaw'ın başlattığı yerel yönetilen
profilleri etkiler. `existing-session` profilleri bunun yerine zaten çalışan bir tarayıcıya
bağlanır ve uzak CDP profilleri `cdpUrl` arkasındaki tarayıcıyı kullanır.

## Yerel ve uzak denetim

- **Yerel denetim (varsayılan):** Gateway, loopback denetim hizmetini başlatır ve yerel bir tarayıcı başlatabilir.
- **Uzak denetim (node ana makinesi):** tarayıcının bulunduğu makinede bir node ana makinesi çalıştırın; Gateway tarayıcı eylemlerini ona proxy üzerinden iletir.
- **Uzak CDP:** uzak Chromium tabanlı tarayıcıya bağlanmak için `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`)
  ayarlayın. Bu durumda OpenClaw yerel tarayıcı başlatmaz.
- Loopback üzerindeki haricen yönetilen CDP hizmetleri için (örneğin Docker'da
  `127.0.0.1` adresine yayımlanmış Browserless), ayrıca `attachOnly: true` ayarlayın. `attachOnly`
  olmadan loopback CDP, yerel OpenClaw tarafından yönetilen tarayıcı profili olarak ele alınır.
- `headless` yalnızca OpenClaw'ın başlattığı yerel yönetilen profilleri etkiler. existing-session veya uzak CDP tarayıcılarını yeniden başlatmaz ya da değiştirmez.
- `executablePath` aynı yerel yönetilen profil kuralını izler. Çalışan bir
  yerel yönetilen profilde bunu değiştirmek, sonraki başlatmanın yeni ikili dosyayı
  kullanması için o profili yeniden başlatma/uzlaştırma olarak işaretler.

Durdurma davranışı profil moduna göre değişir:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw'ın başlattığı tarayıcı sürecini
  durdurur
- yalnızca bağlanma ve uzak CDP profilleri: `openclaw browser stop`, etkin
  denetim oturumunu kapatır ve Playwright/CDP öykünme geçersiz kılmalarını (viewport,
  renk şeması, yerel ayar, saat dilimi, çevrimdışı mod ve benzer durumlar) serbest bırakır;
  OpenClaw tarafından başlatılmış bir tarayıcı süreci olmasa bile

Uzak CDP URL'leri kimlik doğrulama içerebilir:

- Sorgu token'ları (ör. `https://provider.example?token=<token>`)
- HTTP Basic kimlik doğrulama (ör. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktalarını çağırırken ve CDP WebSocket'e bağlanırken
kimlik doğrulamayı korur. Token'ları yapılandırma dosyalarına işlemeye kıyasla
ortam değişkenlerini veya sır yöneticilerini tercih edin.

## Node tarayıcı proxy'si (yapılandırmasız varsayılan)

Tarayıcınızın bulunduğu makinede bir **node ana makinesi** çalıştırırsanız,
OpenClaw tarayıcı aracı çağrılarını ek tarayıcı yapılandırması olmadan otomatik olarak
o node'a yönlendirebilir. Bu, uzak gateway'ler için varsayılan yoldur.

Notlar:

- Node ana makinesi, yerel tarayıcı denetim sunucusunu bir **proxy komutu** aracılığıyla sunar.
- Profiller node'un kendi `browser.profiles` yapılandırmasından gelir (yerelle aynı).
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için boş bırakın: profil oluşturma/silme rotaları dahil tüm yapılandırılmış profiller proxy üzerinden erişilebilir kalır.
- `nodeHost.browserProxy.allowProfiles` ayarlarsanız, OpenClaw bunu en az ayrıcalık sınırı olarak ele alır: yalnızca izin verilen listedeki profiller hedeflenebilir ve kalıcı profil oluşturma/silme rotaları proxy yüzeyinde engellenir.
- İstemiyorsanız devre dışı bırakın:
  - Node üzerinde: `nodeHost.browserProxy.enabled=false`
  - Gateway üzerinde: `gateway.nodes.browser.mode="off"`

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), CDP bağlantı URL'lerini HTTPS ve WebSocket
üzerinden sunan barındırılan bir Chromium hizmetidir. OpenClaw iki biçimi de kullanabilir; ancak
uzak tarayıcı profili için en basit seçenek Browserless bağlantı belgelerindeki doğrudan WebSocket URL'sidir.

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
  bunu `wss://` biçimine dönüştürebilir veya HTTPS URL'sini tutup OpenClaw'ın
  `/json/version` keşfetmesine izin verebilirsiniz.

### Aynı ana makinede Browserless Docker

Browserless Docker'da kendi kendine barındırılıyorsa ve OpenClaw ana makinede çalışıyorsa,
Browserless'ı haricen yönetilen CDP hizmeti olarak ele alın:

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

`browser.profiles.browserless.cdpUrl` içindeki adresin OpenClaw sürecinden
erişilebilir olması gerekir. Browserless ayrıca eşleşen erişilebilir bir uç noktayı duyurmalıdır;
Browserless `EXTERNAL` değerini `ws://127.0.0.1:3000`, `ws://browserless:3000` veya kararlı bir özel Docker
ağ adresi gibi aynı OpenClaw'a açık WebSocket tabanına ayarlayın. `/json/version`,
OpenClaw'ın erişemediği bir adresi gösteren `webSocketDebuggerUrl` döndürürse, CDP HTTP
sağlıklı görünebilirken WebSocket bağlanması yine de başarısız olur.

Loopback Browserless profili için `attachOnly` değerini ayarsız bırakmayın. `attachOnly`
olmadan OpenClaw, loopback bağlantı noktasını yerel yönetilen tarayıcı
profili olarak ele alır ve bağlantı noktasının kullanımda olduğunu ancak OpenClaw'a ait olmadığını raporlayabilir.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılan tarayıcı hizmetleri, standart HTTP tabanlı CDP keşfi (`/json/version`)
yerine **doğrudan WebSocket** uç noktası sunar. OpenClaw üç CDP URL biçimini kabul eder
ve doğru bağlantı stratejisini otomatik olarak seçer:

- **HTTP(S) keşfi** - `http://host[:port]` veya `https://host[:port]`.
  OpenClaw, WebSocket hata ayıklayıcı URL'sini keşfetmek için `/json/version` çağırır, ardından
  bağlanır. WebSocket geri dönüşü yoktur.
- **Doğrudan WebSocket uç noktaları** - `ws://host[:port]/devtools/<kind>/<id>` veya
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>` yolu olan
  `wss://...`. OpenClaw doğrudan WebSocket el sıkışmasıyla bağlanır ve
  `/json/version` öğesini tamamen atlar.
- **Yalın WebSocket kökleri** - `/devtools/...` yolu olmayan `ws://host[:port]` veya
  `wss://host[:port]` (ör. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw önce HTTP
  `/json/version` keşfini dener (şemayı `http`/`https` olarak normalleştirerek);
  keşif bir `webSocketDebuggerUrl` döndürürse bu kullanılır, aksi halde OpenClaw
  yalın kökte doğrudan WebSocket el sıkışmasına geri döner. Duyurulan
  WebSocket uç noktası CDP el sıkışmasını reddeder ancak yapılandırılmış yalın kök
  kabul ederse, OpenClaw o köke de geri döner. Bu, yerel Chrome'a işaret eden yalın bir `ws://`
  bağlantısının yine de bağlanmasını sağlar; çünkü Chrome WebSocket yükseltmelerini yalnızca
  `/json/version` üzerinden gelen hedef başına özel yolda kabul ederken, barındırılan
  sağlayıcılar keşif uç noktaları Playwright CDP için uygun olmayan kısa ömürlü bir URL
  duyurduğunda kök WebSocket uç noktalarını yine de kullanabilir.

`openclaw browser doctor`, çalışma zamanı bağlanmasıyla aynı önce keşif, sonra WebSocket geri dönüşü
mantığını kullanır; bu nedenle başarıyla bağlanan yalın kök URL, tanılamalar tarafından
erişilemez olarak raporlanmaz.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözme, stealth mode ve konut
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

- [Kaydolun](https://www.browserbase.com/sign-up) ve **API Key** değerinizi
  [Genel bakış panosundan](https://www.browserbase.com/overview) kopyalayın.
- `<BROWSERBASE_API_KEY>` değerini gerçek Browserbase API anahtarınızla değiştirin.
- Browserbase, WebSocket bağlantısında otomatik olarak bir tarayıcı oturumu oluşturur; bu nedenle
  elle oturum oluşturma adımı gerekmez.
- Ücretsiz katman, eşzamanlı bir oturuma ve ayda bir tarayıcı saatine izin verir.
  Ücretli plan sınırları için [fiyatlandırmaya](https://www.browserbase.com/pricing) bakın.
- Tam API başvurusu, SDK kılavuzları ve entegrasyon örnekleri için
  [Browserbase belgelerine](https://docs.browserbase.com) bakın.

### Notte

[Notte](https://www.notte.cc), yerleşik gizlilik, konut proxy'leri ve CDP'ye özgü
WebSocket Gateway ile başsız tarayıcılar çalıştırmaya yönelik bir bulut platformudur.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

Notlar:

- [Kaydolun](https://console.notte.cc) ve **API Key** değerinizi
  konsol ayarları sayfasından kopyalayın.
- `<NOTTE_API_KEY>` değerini gerçek Notte API anahtarınızla değiştirin.
- Notte, WebSocket bağlantısında otomatik olarak bir tarayıcı oturumu oluşturur; bu nedenle elle
  oturum oluşturma adımı gerekmez. WebSocket bağlantısı kesildiğinde oturum yok edilir.
- Ücretsiz katman, beş eşzamanlı oturuma ve ömür boyu 100 tarayıcı saatine izin verir.
  Ücretli plan sınırları için [fiyatlandırmaya](https://www.notte.cc/#pricing) bakın.
- Tam API başvurusu, SDK kılavuzları ve entegrasyon örnekleri için
  [Notte belgelerine](https://docs.notte.cc) bakın.

## Güvenlik

Temel fikirler:

- Tarayıcı denetimi yalnızca loopback üzerindendir; erişim Gateway'in kimlik doğrulaması veya Node eşleştirmesi üzerinden akar.
- Bağımsız loopback tarayıcı HTTP API'si **yalnızca paylaşılan gizli anahtar kimlik doğrulaması** kullanır:
  gateway token bearer kimlik doğrulaması, `x-openclaw-password` veya yapılandırılmış
  gateway parolasıyla HTTP Basic kimlik doğrulaması.
- Tailscale Serve kimlik başlıkları ve `gateway.auth.mode: "trusted-proxy"` bu
  bağımsız loopback tarayıcı API'sinde kimlik doğrulaması yapmaz.
- Tarayıcı denetimi etkinse ve paylaşılan gizli anahtar kimlik doğrulaması yapılandırılmamışsa OpenClaw,
  bu başlatma için yalnızca çalışma zamanına ait bir gateway token üretir. İstemcilerin yeniden başlatmalar arasında
  kararlı bir gizli anahtara ihtiyacı varsa `gateway.auth.token`, `gateway.auth.password`,
  `OPENCLAW_GATEWAY_TOKEN` veya `OPENCLAW_GATEWAY_PASSWORD` değerini açıkça yapılandırın.
- `gateway.auth.mode` zaten `password`, `none` veya `trusted-proxy` ise OpenClaw
  bu token'ı otomatik olarak üretmez.
- Gateway'i ve tüm Node ana makinelerini özel bir ağda tutun (Tailscale); genel erişime açmaktan kaçının.
- Uzak CDP URL'lerini/token'larını gizli bilgi olarak ele alın; env var'ları veya bir gizli bilgi yöneticisini tercih edin.

Uzak CDP ipuçları:

- Mümkün olduğunda şifreli uç noktaları (HTTPS veya WSS) ve kısa ömürlü token'ları tercih edin.
- Uzun ömürlü token'ları doğrudan yapılandırma dosyalarına yerleştirmekten kaçının.

## Profiller (çoklu tarayıcı)

OpenClaw birden çok adlandırılmış profili (yönlendirme yapılandırmaları) destekler. Profiller şunlar olabilir:

- **openclaw-managed**: kendi kullanıcı verisi dizinine + CDP portuna sahip özel bir Chromium tabanlı tarayıcı örneği
- **uzak**: açık bir CDP URL'si (başka bir yerde çalışan Chromium tabanlı tarayıcı)
- **mevcut oturum**: Chrome DevTools MCP otomatik bağlantısı üzerinden mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili eksikse otomatik oluşturulur.
- `user` profili, Chrome MCP mevcut oturum eklemesi için yerleşiktir.
- Mevcut oturum profilleri `user` dışında isteğe bağlıdır; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP portları varsayılan olarak **18800-18899** aralığından ayrılır.
- Bir profili silmek, yerel veri dizinini Çöp Kutusu'na taşır.

Tüm denetim uç noktaları `?profile=<name>` değerini kabul eder; CLI `--browser-profile` kullanır.

## Chrome DevTools MCP ile mevcut oturum

OpenClaw, resmi Chrome DevTools MCP sunucusu üzerinden çalışan bir Chromium tabanlı tarayıcı profiline de eklenebilir.
Bu, o tarayıcı profilinde zaten açık olan sekmeleri ve oturum açma durumunu yeniden kullanır.

Resmi arka plan ve kurulum başvuruları:

- [Geliştiriciler için Chrome: Tarayıcı oturumunuzla Chrome DevTools MCP kullanın](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil:

- `user`

İsteğe bağlı: farklı bir ad, renk veya tarayıcı verisi dizini istiyorsanız kendi özel mevcut oturum profilinizi oluşturun.

Varsayılan davranış:

- Yerleşik `user` profili, varsayılan yerel Google Chrome profilini hedefleyen Chrome MCP otomatik bağlantısını kullanır.

Brave, Edge, Chromium veya varsayılan olmayan bir Chrome profili için `userDataDir` kullanın.
`~`, işletim sistemi ana dizininize genişler:

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
- `snapshot`, seçili canlı sekmeden refs döndürür

Ekleme çalışmıyorsa denetlenecekler:

- hedef Chromium tabanlı tarayıcı sürümü `144+`
- uzak hata ayıklama, o tarayıcının inceleme sayfasında etkin
- tarayıcı ekleme onayı istemini gösterdi ve siz kabul ettiniz
- Chrome açık bir `--remote-debugging-port` ile başlatıldıysa Chrome MCP otomatik bağlantısına güvenmek yerine
  `browser.profiles.<name>.cdpUrl` değerini o DevTools uç noktasına ayarlayın
- `openclaw doctor`, eski eklenti tabanlı tarayıcı yapılandırmasını taşır ve varsayılan otomatik bağlantı profilleri için
  Chrome'un yerel olarak kurulu olduğunu denetler, ancak tarayıcı tarafındaki uzak hata ayıklamayı sizin için
  etkinleştiremez

Agent kullanımı:

- Kullanıcının oturum açmış tarayıcı durumuna ihtiyacınız olduğunda `profile="user"` kullanın.
- Özel bir mevcut oturum profili kullanıyorsanız bu açık profil adını geçirin.
- Bu modu yalnızca kullanıcı bilgisayar başında olup ekleme istemini onaylayabileceği zaman seçin.
- Gateway veya Node ana makinesi `npx chrome-devtools-mcp@latest --autoConnect` başlatabilir

Notlar:

- Bu yol, oturum açılmış tarayıcı oturumunuzun içinde işlem yapabildiği için izole `openclaw` profilinden daha yüksek risklidir.
- OpenClaw bu sürücü için tarayıcıyı başlatmaz; yalnızca eklenir.
- OpenClaw burada resmi Chrome DevTools MCP `--autoConnect` akışını kullanır. `userDataDir` ayarlanmışsa
  bu kullanıcı verisi dizinini hedeflemek için aktarılır.
- Mevcut oturum seçili ana makinede veya bağlı bir tarayıcı Node'u üzerinden eklenebilir.
  Chrome başka bir yerde bulunuyorsa ve bağlı tarayıcı Node'u yoksa bunun yerine uzak CDP veya bir Node ana makinesi kullanın.

### Özel Chrome MCP başlatma

Varsayılan `npx chrome-devtools-mcp@latest` akışı istediğiniz şey değilse (çevrimdışı ana makineler,
sabitlenmiş sürümler, vendored ikililer) profil başına başlatılan Chrome DevTools MCP sunucusunu geçersiz kılın:

| Alan         | Ne yapar                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` yerine başlatılacak yürütülebilir dosya. Olduğu gibi çözümlenir; mutlak yollar dikkate alınır.                       |
| `mcpArgs`    | `mcpCommand` değerine aynen geçirilen argüman dizisi. Varsayılan `chrome-devtools-mcp@latest --autoConnect` argümanlarının yerini alır. |

Mevcut oturum profilinde `cdpUrl` ayarlandığında OpenClaw,
`--autoConnect` değerini atlar ve uç noktayı otomatik olarak Chrome MCP'ye iletir:

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP keşif uç noktası).
- `ws(s)://...` → `--wsEndpoint <url>` (doğrudan CDP WebSocket).

Uç nokta bayrakları ve `userDataDir` birlikte kullanılamaz: `cdpUrl` ayarlandığında
`userDataDir`, Chrome MCP başlatması için yok sayılır; çünkü Chrome MCP bir profil
dizini açmak yerine uç noktanın arkasındaki çalışan tarayıcıya eklenir.

<Accordion title="Existing-session feature limitations">

Yönetilen `openclaw` profiliyle karşılaştırıldığında, mevcut oturum sürücüleri daha kısıtlıdır:

- **Ekran görüntüleri** - sayfa yakalamaları ve `--ref` öğe yakalamaları çalışır; CSS `--element` seçicileri çalışmaz. `--full-page`, `--ref` veya `--element` ile birleştirilemez. Sayfa veya ref tabanlı öğe ekran görüntüleri için Playwright gerekmez.
- **Eylemler** - `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select` snapshot refs gerektirir (CSS seçicileri yoktur). `click-coords`, görünür viewport koordinatlarına tıklar ve snapshot ref gerektirmez. `click` yalnızca sol düğmedir. `type`, `slowly=true` desteklemez; `fill` veya `press` kullanın. `press`, `delayMs` desteklemez. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` ve `evaluate` çağrı başına zaman aşımı desteklemez. `select` tek bir değer kabul eder.
- **Bekleme / yükleme / iletişim kutusu** - `wait --url` tam, alt dize ve glob desenlerini destekler; `wait --load networkidle` mevcut oturum profillerinde desteklenmez (yönetilen ve ham/uzak CDP profillerinde çalışır). Yükleme hook'ları `ref` veya `inputRef` gerektirir, tek seferde bir dosya alır, CSS `element` kullanmaz. İletişim kutusu hook'ları zaman aşımı geçersiz kılmalarını veya `dialogId` desteklemez.
- **İletişim kutusu görünürlüğü** - Yönetilen tarayıcı eylem yanıtları, bir eylem modal iletişim kutusu açtığında `blockedByDialog` ve `browserState.dialogs.pending` içerir; snapshot'lar da bekleyen iletişim kutusu durumunu içerir. Bir iletişim kutusu beklemedeyken `browser dialog --accept/--dismiss --dialog-id <id>` ile yanıt verin. OpenClaw dışında işlenen iletişim kutuları `browserState.dialogs.recent` altında görünür.
- **Yalnızca yönetilen özellikler** - toplu eylemler, PDF dışa aktarma, indirme yakalama ve `responsebody` hâlâ yönetilen tarayıcı yolunu gerektirir.

</Accordion>

## İzolasyon garantileri

- **Özel kullanıcı verisi dizini**: kişisel tarayıcı profilinize asla dokunmaz.
- **Özel portlar**: geliştirme iş akışlarıyla çakışmaları önlemek için `9222` kullanmaz.
- **Deterministik sekme denetimi**: `tabs` önce `suggestedTargetId`, ardından
  `t1` gibi kararlı `tabId` tanıtıcıları, isteğe bağlı etiketler ve ham `targetId` döndürür.
  Agent'lar `suggestedTargetId` değerini yeniden kullanmalıdır; ham id'ler hata ayıklama ve uyumluluk için
  erişilebilir kalır.

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
  `/usr/lib/chromium-browser` altındaki yaygın Chrome/Brave/Edge/Chromium konumlarını ve
  `PLAYWRIGHT_BROWSERS_PATH` veya `~/.cache/ms-playwright` altındaki Playwright tarafından yönetilen Chromium'u denetler.
- Windows: yaygın kurulum konumlarını denetler.

## Denetim API'si (isteğe bağlı)

Betik yazma ve hata ayıklama için Gateway, küçük bir **yalnızca loopback HTTP
denetim API'si** ve eşleşen bir `openclaw browser` CLI sunar (snapshot'lar, refs, bekleme
güçlendirmeleri, JSON çıktısı, hata ayıklama iş akışları). Tam başvuru için
[Tarayıcı denetim API'si](/tr/tools/browser-control) sayfasına bakın.

## Sorun giderme

Linux’a özgü sorunlar (özellikle snap Chromium) için bkz.
[Tarayıcı sorunlarını giderme](/tr/tools/browser-linux-troubleshooting).

WSL2 Gateway + Windows Chrome ayrık ana makine kurulumları için bkz.
[WSL2 + Windows + uzak Chrome CDP sorunlarını giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP başlatma hatası ve gezinme SSRF engeli

Bunlar farklı hata sınıflarıdır ve farklı kod yollarına işaret eder.

- **CDP başlatma veya hazır olma hatası**, OpenClaw’un tarayıcı kontrol düzleminin sağlıklı olduğunu doğrulayamadığı anlamına gelir.
- **Gezinme SSRF engeli**, tarayıcı kontrol düzleminin sağlıklı olduğu, ancak bir sayfa gezinme hedefinin ilke tarafından reddedildiği anlamına gelir.

Yaygın örnekler:

- CDP başlatma veya hazır olma hatası:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `attachOnly: true` olmadan bir loopback harici CDP hizmeti yapılandırıldığında
    `Port <port> is in use for profile "<name>" but not by openclaw`
- Gezinme SSRF engeli:
  - `start` ve `tabs` hâlâ çalışırken `open`, `navigate`, anlık görüntü veya sekme açma akışları bir tarayıcı/ağ ilkesi hatasıyla başarısız olur

İkisini ayırmak için bu en küçük diziyi kullanın:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Sonuçları okuma:

- `start`, `not reachable after start` ile başarısız olursa önce CDP hazır olma durumunu giderin.
- `start` başarılı olur ancak `tabs` başarısız olursa kontrol düzlemi hâlâ sağlıksızdır. Bunu sayfa gezinme sorunu değil, CDP erişilebilirlik sorunu olarak ele alın.
- `start` ve `tabs` başarılı olur ancak `open` veya `navigate` başarısız olursa tarayıcı kontrol düzlemi çalışıyordur ve hata gezinme ilkesinde veya hedef sayfadadır.
- `start`, `tabs` ve `open` hepsi başarılı olursa temel yönetilen tarayıcı kontrol yolu sağlıklıdır.

Önemli davranış ayrıntıları:

- Tarayıcı yapılandırması, `browser.ssrfPolicy` yapılandırmasanız bile varsayılan olarak hataya kapalı bir SSRF ilkesi nesnesi kullanır.
- local loopback `openclaw` yönetilen profili için CDP sağlık denetimleri, OpenClaw’un kendi yerel kontrol düzlemi için tarayıcı SSRF erişilebilirlik uygulamasını kasıtlı olarak atlar.
- Gezinme koruması ayrıdır. Başarılı bir `start` veya `tabs` sonucu, daha sonraki bir `open` veya `navigate` hedefine izin verildiği anlamına gelmez.

Güvenlik rehberi:

- Tarayıcı SSRF ilkesini varsayılan olarak **gevşetmeyin**.
- Geniş özel ağ erişimi yerine `hostnameAllowlist` veya `allowedHostnames` gibi dar ana makine istisnalarını tercih edin.
- `dangerouslyAllowPrivateNetwork: true` seçeneğini yalnızca özel ağ tarayıcı erişiminin gerekli olduğu ve incelendiği, kasıtlı olarak güvenilen ortamlarda kullanın.

## Ajan araçları + kontrolün nasıl çalıştığı

Ajan, tarayıcı otomasyonu için **tek bir araç** alır:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Nasıl eşlenir:

- `browser snapshot` kararlı bir UI ağacı (AI veya ARIA) döndürür.
- `browser act`, tıklamak/yazmak/sürüklemek/seçmek için anlık görüntü `ref` kimliklerini kullanır.
- `browser screenshot` pikselleri yakalar (tam sayfa, öğe veya etiketli ref’ler).
- `browser doctor` Gateway, Plugin, profil, tarayıcı ve sekme hazır olma durumunu denetler.
- `browser` şunları kabul eder:
  - Adlandırılmış bir tarayıcı profili (openclaw, chrome veya uzak CDP) seçmek için `profile`.
  - Tarayıcının nerede bulunduğunu seçmek için `target` (`sandbox` | `host` | `node`).
  - Korumalı alan oturumlarında `target: "host"`, `agents.defaults.sandbox.browser.allowHostControl=true` gerektirir.
  - `target` atlanırsa: korumalı alan oturumları varsayılan olarak `sandbox`, korumalı alan olmayan oturumlar varsayılan olarak `host` kullanır.
  - Tarayıcı özellikli bir düğüm bağlıysa, `target="host"` veya `target="node"` ile sabitlemediğiniz sürece araç otomatik olarak ona yönlendirilebilir.

Bu, ajanı deterministik tutar ve kırılgan seçicilerden kaçınır.

## İlgili

- [Araçlara Genel Bakış](/tr/tools) - kullanılabilir tüm ajan araçları
- [Korumalı alan](/tr/gateway/sandboxing) - korumalı alan ortamlarında tarayıcı kontrolü
- [Güvenlik](/tr/gateway/security) - tarayıcı kontrolü riskleri ve sağlamlaştırma
