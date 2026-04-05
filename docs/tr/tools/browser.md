---
read_when:
    - Aracı tarafından kontrol edilen tarayıcı otomasyonu ekleme
    - openclaw'ın kendi Chrome'unuza neden müdahale ettiğini hata ayıklama
    - macOS uygulamasında tarayıcı ayarlarını + yaşam döngüsünü uygulama
summary: Entegre tarayıcı kontrol hizmeti + eylem komutları
title: Tarayıcı (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-04-05T14:14:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: a41162efd397ea918469e16aa67e554bcbb517b3112df1d3e7927539b6a0926a
    source_path: tools/browser.md
    workflow: 15
---

# Tarayıcı (openclaw tarafından yönetilen)

OpenClaw, aracının kontrol ettiği **özel bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir.
Bu profil kişisel tarayıcınızdan izole edilir ve Gateway içindeki küçük bir yerel
kontrol hizmeti üzerinden yönetilir (yalnızca loopback).

Başlangıç düzeyi görünüm:

- Bunu **ayrı, yalnızca aracıya özel bir tarayıcı** olarak düşünün.
- `openclaw` profili kişisel tarayıcı profilinize **dokunmaz**.
- Aracı güvenli bir alanda **sekme açabilir, sayfaları okuyabilir, tıklayabilir ve yazı yazabilir**.
- Yerleşik `user` profili, Chrome MCP aracılığıyla gerçek oturum açılmış Chrome oturumunuza bağlanır.

## Elde ettikleriniz

- **openclaw** adlı ayrı bir tarayıcı profili (varsayılan olarak turuncu vurgu).
- Deterministik sekme kontrolü (listele/aç/odaklan/kapat).
- Aracı eylemleri (tıkla/yaz/sürükle/seç), snapshot'lar, ekran görüntüleri, PDF'ler.
- İsteğe bağlı çoklu profil desteği (`openclaw`, `work`, `remote`, ...).

Bu tarayıcı günlük kullandığınız ana tarayıcı **değildir**. Bu, aracı otomasyonu
ve doğrulaması için güvenli, izole bir yüzeydir.

## Hızlı başlangıç

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled” alırsanız, yapılandırmada etkinleştirin (aşağıya bakın) ve
Gateway'i yeniden başlatın.

`openclaw browser` tamamen yoksa veya aracı tarayıcı aracının
kullanılamadığını söylüyorsa, [Eksik browser komutu veya aracı](/tools/browser#missing-browser-command-or-tool)
bölümüne gidin.

## Plugin kontrolü

Varsayılan `browser` aracı artık varsayılan olarak etkin gelen paketlenmiş bir
plugin'dir. Bu, OpenClaw'ın geri kalan plugin sistemini kaldırmadan onu devre
dışı bırakabileceğiniz veya değiştirebileceğiniz anlamına gelir:

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

Aynı `browser` araç adını sağlayan başka bir plugin yüklemeden önce paketlenmiş
plugin'i devre dışı bırakın. Varsayılan tarayıcı deneyimi için her ikisi de gerekir:

- `plugins.entries.browser.enabled` devre dışı bırakılmamış olmalı
- `browser.enabled=true`

Yalnızca plugin'i kapatırsanız, paketlenmiş tarayıcı CLI'si (`openclaw browser`),
gateway yöntemi (`browser.request`), aracı aracı ve varsayılan tarayıcı kontrol
hizmeti birlikte kaybolur. `browser.*` yapılandırmanız ise yedek bir plugin'in
yeniden kullanabilmesi için olduğu gibi kalır.

Paketlenmiş tarayıcı plugin'i artık tarayıcı çalışma zamanı uygulamasının da
sahibidir. Çekirdek tarafta yalnızca paylaşılan Plugin SDK yardımcıları ve eski
dahili içe aktarma yolları için uyumluluk yeniden dışa aktarımları kalır.
Pratikte, tarayıcı plugin paketini kaldırmak veya değiştirmek, geride çekirdeğe
ait ikinci bir çalışma zamanı bırakmak yerine tarayıcı özellik kümesini kaldırır.

Tarayıcı yapılandırma değişiklikleri yine de Gateway yeniden başlatması
gerektirir; böylece paketlenmiş plugin yeni ayarlarla tarayıcı hizmetini yeniden
kaydedebilir.

## Eksik browser komutu veya aracı

Bir yükseltmeden sonra `openclaw browser` aniden bilinmeyen bir komut haline
gelirse veya aracı tarayıcı aracının eksik olduğunu bildirirse, en yaygın neden
`browser` içermeyen kısıtlayıcı bir `plugins.allow` listesidir.

Bozuk yapılandırma örneği:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Bunu, plugin izin listesine `browser` ekleyerek düzeltin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Önemli notlar:

- `plugins.allow` ayarlıysa tek başına `browser.enabled=true` yeterli değildir.
- `plugins.allow` ayarlıysa tek başına `plugins.entries.browser.enabled=true` de yeterli değildir.
- `tools.alsoAllow: ["browser"]` paketlenmiş tarayıcı plugin'ini **yüklemez**. Yalnızca plugin zaten yüklendikten sonra araç ilkesini ayarlar.
- Kısıtlayıcı bir plugin izin listesine ihtiyacınız yoksa, `plugins.allow` kaldırmak da varsayılan paketlenmiş tarayıcı davranışını geri getirir.

Tipik belirtiler:

- `openclaw browser` bilinmeyen bir komuttur.
- `browser.request` eksiktir.
- Aracı, tarayıcı aracının kullanılamadığını veya eksik olduğunu bildirir.

## Profiller: `openclaw` ve `user`

- `openclaw`: yönetilen, izole tarayıcı (uzantı gerekmez).
- `user`: gerçek **oturum açılmış Chrome** oturumunuz için yerleşik Chrome MCP bağlanma profili.

Aracı tarayıcı aracı çağrıları için:

- Varsayılan: izole `openclaw` tarayıcısını kullanın.
- Mevcut oturum açılmış oturumlar önemliyse ve kullanıcı bilgisayar başındaysa,
  herhangi bir bağlanma istemine tıklayıp onaylayabilmesi için `profile="user"` tercih edin.
- Belirli bir tarayıcı modu istediğinizde açık geçersiz kılma `profile` olur.

Varsayılan olarak yönetilen modu istiyorsanız `browser.defaultProfile: "openclaw"` ayarlayın.

## Yapılandırma

Tarayıcı ayarları `~/.openclaw/openclaw.json` içinde bulunur.

```json5
{
  browser: {
    enabled: true, // varsayılan: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // varsayılan güvenilir ağ modu
      // allowPrivateNetwork: true, // eski takma ad
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // eski tek profil geçersiz kılması
    remoteCdpTimeoutMs: 1500, // uzak CDP HTTP zaman aşımı (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // uzak CDP WebSocket el sıkışma zaman aşımı (ms)
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

Notlar:

- Tarayıcı kontrol hizmeti, `gateway.port` değerinden türetilen bir portta loopback'e bağlanır
  (varsayılan: `18791`, yani gateway + 2).
- Gateway portunu geçersiz kılarsanız (`gateway.port` veya `OPENCLAW_GATEWAY_PORT`),
  türetilen tarayıcı portları aynı “ailede” kalacak şekilde kayar.
- `cdpUrl`, ayarlanmadığında yönetilen yerel CDP portuna varsayılan olur.
- `remoteCdpTimeoutMs`, uzak (loopback olmayan) CDP erişilebilirlik kontrollerine uygulanır.
- `remoteCdpHandshakeTimeoutMs`, uzak CDP WebSocket erişilebilirlik kontrollerine uygulanır.
- Tarayıcı gezinmesi/sekme açma, gezinmeden önce SSRF korumasından geçer ve gezinmeden sonra son `http(s)` URL'si üzerinde en iyi çabayla yeniden kontrol edilir.
- Katı SSRF modunda, uzak CDP uç noktası keşfi/probları (`cdpUrl`, `/json/version` aramaları dahil) da kontrol edilir.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak `true` olur (güvenilir ağ modeli). Katı yalnızca herkese açık gezinti için bunu `false` yapın.
- `browser.ssrfPolicy.allowPrivateNetwork`, uyumluluk için eski bir takma ad olarak desteklenmeye devam eder.
- `attachOnly: true`, “asla yerel bir tarayıcı başlatma; yalnızca zaten çalışıyorsa bağlan” anlamına gelir.
- `color` + profil başına `color`, hangi profilin etkin olduğunu görebilmeniz için tarayıcı arayüzünü renklendirir.
- Varsayılan profil `openclaw` olur (OpenClaw tarafından yönetilen bağımsız tarayıcı). Oturum açılmış kullanıcı tarayıcısına geçmek için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: sistem varsayılan tarayıcısı Chromium tabanlıysa o; değilse Chrome → Brave → Edge → Chromium → Chrome Canary.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar — bunları yalnızca uzak CDP için ayarlayın.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır. Bu
  sürücü için `cdpUrl` ayarlamayın.
- Mevcut bir oturum profili, Brave veya Edge gibi varsayılan olmayan bir Chromium kullanıcı profiline
  bağlanacaksa `browser.profiles.<name>.userDataDir` ayarlayın.

## Brave kullanın (veya başka bir Chromium tabanlı tarayıcı)

**Sistem varsayılanı** tarayıcınız Chromium tabanlıysa (Chrome/Brave/Edge/vb.),
OpenClaw bunu otomatik olarak kullanır. Otomatik algılamayı geçersiz kılmak için
`browser.executablePath` ayarlayın:

CLI örneği:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Yerel ve uzak kontrol

- **Yerel kontrol (varsayılan):** Gateway, loopback kontrol hizmetini başlatır ve yerel bir tarayıcı başlatabilir.
- **Uzak kontrol (düğüm ana makinesi):** Tarayıcının bulunduğu makinede bir düğüm ana makinesi çalıştırın; Gateway tarayıcı eylemlerini ona proxy'ler.
- **Uzak CDP:** Uzak bir Chromium tabanlı tarayıcıya bağlanmak için `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`) ayarlayın.
  Bu durumda OpenClaw yerel bir tarayıcı başlatmaz.

Durdurma davranışı profil moduna göre farklıdır:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw'ın başlattığı tarayıcı işlemini durdurur
- yalnızca bağlanma ve uzak CDP profilleri: `openclaw browser stop`, etkin
  kontrol oturumunu kapatır ve Playwright/CDP öykünme geçersiz kılmalarını
  (görünüm alanı, renk şeması, yerel ayar, saat dilimi, çevrimdışı mod ve benzer durumlar)
  serbest bırakır; OpenClaw tarafından herhangi bir tarayıcı işlemi başlatılmamış olsa bile

Uzak CDP URL'leri kimlik doğrulama içerebilir:

- Sorgu belirteçleri (ör. `https://provider.example?token=<token>`)
- HTTP Basic auth (ör. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktalarını çağırırken ve CDP WebSocket'ine bağlanırken
kimlik doğrulamayı korur. Belirteçleri yapılandırma dosyalarına commit etmek
yerine ortam değişkenlerini veya gizli bilgi yöneticilerini tercih edin.

## Düğüm tarayıcı proxy'si (varsayılan sıfır yapılandırma)

Tarayıcınızın bulunduğu makinede bir **düğüm ana makinesi** çalıştırırsanız,
OpenClaw herhangi bir ek tarayıcı yapılandırması olmadan tarayıcı aracı
çağrılarını bu düğüme otomatik yönlendirebilir. Bu, uzak gateway'ler için
varsayılan yoldur.

Notlar:

- Düğüm ana makinesi, yerel tarayıcı kontrol sunucusunu bir **proxy komutu** üzerinden açığa çıkarır.
- Profiller, düğümün kendi `browser.profiles` yapılandırmasından gelir (yerel ile aynı).
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için boş bırakın: yapılandırılmış tüm profillere, profil oluşturma/silme rotaları dahil, proxy üzerinden erişilebilir olmaya devam eder.
- `nodeHost.browserProxy.allowProfiles` ayarlarsanız, OpenClaw bunu en az ayrıcalık sınırı olarak ele alır: yalnızca izin verilen profiller hedeflenebilir ve kalıcı profil oluşturma/silme rotaları proxy yüzeyinde engellenir.
- İstemiyorsanız devre dışı bırakın:
  - Düğümde: `nodeHost.browserProxy.enabled=false`
  - Gateway'de: `gateway.nodes.browser.mode="off"`

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), HTTPS ve WebSocket üzerinden
CDP bağlantı URL'leri sunan, barındırılan bir Chromium hizmetidir. OpenClaw
her iki biçimi de kullanabilir, ancak uzak tarayıcı profili için en basit
seçenek Browserless'ın bağlantı belgelerindeki doğrudan WebSocket URL'sidir.

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

- `<BROWSERLESS_API_KEY>` yerine gerçek Browserless belirtecinizi yazın.
- Browserless hesabınıza uyan bölge uç noktasını seçin (belgelerine bakın).
- Browserless size bir HTTPS temel URL'si verirse, doğrudan CDP bağlantısı için
  bunu `wss://` biçimine dönüştürebilir veya HTTPS URL'sini koruyup OpenClaw'ın
  `/json/version` keşfi yapmasına izin verebilirsiniz.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılan tarayıcı hizmetleri, standart HTTP tabanlı CDP keşfi
(` /json/version`) yerine **doğrudan WebSocket** uç noktası sunar. OpenClaw her ikisini de destekler:

- **HTTP(S) uç noktaları** — OpenClaw WebSocket hata ayıklayıcı URL'sini
  keşfetmek için `/json/version` çağırır, ardından bağlanır.
- **WebSocket uç noktaları** (`ws://` / `wss://`) — OpenClaw doğrudan bağlanır,
  `/json/version` adımını atlar. Bunu
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com) veya size bir
  WebSocket URL'si veren herhangi bir sağlayıcı için kullanın.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözme, gizlilik modu ve konut tipi
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

- [Kaydolun](https://www.browserbase.com/sign-up) ve **API Anahtarınızı**
  [Overview dashboard](https://www.browserbase.com/overview) üzerinden kopyalayın.
- `<BROWSERBASE_API_KEY>` yerine gerçek Browserbase API anahtarınızı yazın.
- Browserbase, WebSocket bağlantısında otomatik olarak bir tarayıcı oturumu oluşturur; bu nedenle
  elle oturum oluşturma adımı gerekmez.
- Ücretsiz katman, aynı anda bir oturum ve ayda bir tarayıcı saati sağlar.
  Ücretli plan sınırları için [pricing](https://www.browserbase.com/pricing) sayfasına bakın.
- Tam API başvurusu,
  SDK kılavuzları ve entegrasyon örnekleri için [Browserbase docs](https://docs.browserbase.com) bölümüne bakın.

## Güvenlik

Temel fikirler:

- Tarayıcı kontrolü yalnızca loopback'tir; erişim Gateway'in auth mekanizması veya düğüm eşleştirmesi üzerinden akar.
- Bağımsız loopback tarayıcı HTTP API'si **yalnızca paylaşılan gizli anahtar auth** kullanır:
  gateway bearer token auth, `x-openclaw-password` veya yapılandırılmış gateway parolasıyla HTTP Basic auth.
- Tailscale Serve kimlik başlıkları ve `gateway.auth.mode: "trusted-proxy"`,
  bu bağımsız loopback tarayıcı API'sinin kimliğini **doğrulamaz**.
- Tarayıcı kontrolü etkinse ve yapılandırılmış paylaşılan gizli anahtar auth yoksa, OpenClaw
  başlangıçta otomatik olarak `gateway.auth.token` üretir ve bunu yapılandırmaya kalıcı olarak yazar.
- `gateway.auth.mode` zaten
  `password`, `none` veya `trusted-proxy` ise OpenClaw bu belirteci otomatik oluşturmaz.
- Gateway'i ve tüm düğüm ana makinelerini özel bir ağda (Tailscale) tutun; herkese açık erişimden kaçının.
- Uzak CDP URL'lerini/belirteçlerini gizli bilgi olarak değerlendirin; ortam değişkenlerini veya bir gizli bilgi yöneticisini tercih edin.

Uzak CDP ipuçları:

- Mümkün olduğunda şifrelenmiş uç noktaları (HTTPS veya WSS) ve kısa ömürlü belirteçleri tercih edin.
- Uzun ömürlü belirteçleri doğrudan yapılandırma dosyalarına gömmekten kaçının.

## Profiller (çoklu tarayıcı)

OpenClaw birden çok adlandırılmış profili (yönlendirme yapılandırmaları) destekler. Profiller şunlar olabilir:

- **openclaw-managed**: kendi kullanıcı veri dizini + CDP portu olan özel bir Chromium tabanlı tarayıcı örneği
- **remote**: açık bir CDP URL'si (başka yerde çalışan Chromium tabanlı tarayıcı)
- **existing session**: Chrome DevTools MCP otomatik bağlanma üzerinden mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili eksikse otomatik oluşturulur.
- `user` profili, Chrome MCP mevcut-oturum bağlanması için yerleşiktir.
- Mevcut-oturum profilleri `user` dışında isteğe bağlıdır; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP portları varsayılan olarak **18800–18899** aralığından ayrılır.
- Bir profil silindiğinde yerel veri dizini Çöp Kutusu'na taşınır.

Tüm kontrol uç noktaları `?profile=<name>` kabul eder; CLI ise `--browser-profile` kullanır.

## Chrome DevTools MCP üzerinden existing-session

OpenClaw ayrıca resmi Chrome DevTools MCP sunucusu üzerinden çalışan bir
Chromium tabanlı tarayıcı profiline bağlanabilir. Bu, o tarayıcı profilinde
zaten açık olan sekmeleri ve oturum bilgilerini yeniden kullanır.

Resmi arka plan ve kurulum başvuruları:

- [Chrome for Developers: Tarayıcı oturumunuzla Chrome DevTools MCP kullanın](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil:

- `user`

İsteğe bağlı: farklı bir ad, renk veya tarayıcı veri dizini istiyorsanız kendi özel
existing-session profilinizi oluşturun.

Varsayılan davranış:

- Yerleşik `user` profili Chrome MCP otomatik bağlanma kullanır; bu da
  varsayılan yerel Google Chrome profilini hedefler.

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

Başarılı durumda görünmesi gerekenler:

- `status`, `driver: existing-session` gösterir
- `status`, `transport: chrome-mcp` gösterir
- `status`, `running: true` gösterir
- `tabs`, zaten açık olan tarayıcı sekmelerinizi listeler
- `snapshot`, seçilen canlı sekmeden ref'ler döndürür

Bağlanma çalışmıyorsa kontrol edilecekler:

- hedef Chromium tabanlı tarayıcı sürümü `144+` olmalı
- o tarayıcının inspect sayfasında uzak hata ayıklama etkin olmalı
- tarayıcı bağlanma onay istemini göstermiş olmalı ve siz de kabul etmiş olmalısınız
- `openclaw doctor`, eski uzantı tabanlı tarayıcı yapılandırmasını taşır ve
  varsayılan otomatik bağlanma profilleri için Chrome'un yerel olarak yüklü
  olduğunu denetler, ancak tarayıcı tarafında uzak hata ayıklamayı sizin yerinize
  etkinleştiremez

Aracı kullanımı:

- Kullanıcının oturum açmış tarayıcı durumuna ihtiyaç duyduğunuzda `profile="user"` kullanın.
- Özel bir existing-session profili kullanıyorsanız, o açık profil adını geçin.
- Bu modu yalnızca kullanıcı bağlanma istemini onaylamak için bilgisayarın başındaysa seçin.
- Gateway veya düğüm ana makinesi `npx chrome-devtools-mcp@latest --autoConnect` çalıştırabilir

Notlar:

- Bu yol, oturum açılmış tarayıcı oturumunuz içinde işlem yapabildiği için izole `openclaw` profiline göre daha yüksek risklidir.
- OpenClaw bu sürücü için tarayıcı başlatmaz; yalnızca mevcut bir oturuma bağlanır.
- OpenClaw burada resmi Chrome DevTools MCP `--autoConnect` akışını kullanır. `userDataDir`
  ayarlıysa, bunu o açık Chromium kullanıcı veri dizinini hedeflemek için iletir.
- Existing-session ekran görüntüleri, sayfa yakalamalarını ve snapshot'lardan
  `--ref` öğe yakalamalarını destekler, ancak CSS `--element` seçicilerini desteklemez.
- Existing-session sayfa ekran görüntüleri, Playwright olmadan Chrome MCP
  üzerinden çalışır. Ref tabanlı öğe ekran görüntüleri (`--ref`) de burada çalışır,
  ancak `--full-page`, `--ref` veya `--element` ile birlikte kullanılamaz.
- Existing-session eylemleri, yönetilen tarayıcı yoluna göre hâlâ daha sınırlıdır:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select`, CSS seçicileri yerine
    snapshot ref'leri gerektirir
  - `click` yalnızca sol düğme içindir (düğme geçersiz kılmaları veya değiştiriciler yok)
  - `type`, `slowly=true` desteklemez; `fill` veya `press` kullanın
  - `press`, `delayMs` desteklemez
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` ve `evaluate`, çağrı başına zaman aşımı geçersiz kılmalarını desteklemez
  - `select` şu anda yalnızca tek bir değeri destekler
- Existing-session `wait --url`, diğer tarayıcı sürücüleri gibi tam eşleşme, alt dize ve glob desenlerini destekler.
  `wait --load networkidle` henüz desteklenmiyor.
- Existing-session yükleme hook'ları `ref` veya `inputRef` gerektirir, aynı anda tek dosyayı destekler
  ve CSS `element` hedeflemeyi desteklemez.
- Existing-session iletişim kutusu hook'ları zaman aşımı geçersiz kılmalarını desteklemez.
- Toplu eylemler, PDF dışa aktarma, indirme yakalama ve `responsebody`
  gibi bazı özellikler hâlâ yönetilen tarayıcı yolunu gerektirir.
- Existing-session ana makineye özeldir. Chrome başka bir makinede veya
  başka bir ağ ad alanında bulunuyorsa, bunun yerine uzak CDP veya düğüm ana makinesi kullanın.

## İzolasyon garantileri

- **Ayrılmış kullanıcı veri dizini**: kişisel tarayıcı profilinize asla dokunmaz.
- **Ayrılmış portlar**: geliştirme iş akışlarıyla çakışmaları önlemek için `9222` kullanmaz.
- **Deterministik sekme kontrolü**: sekmeleri “son sekme” yerine `targetId` ile hedefler.

## Tarayıcı seçimi

Yerel olarak başlatırken OpenClaw mevcut olan ilk tarayıcıyı seçer:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Bunu `browser.executablePath` ile geçersiz kılabilirsiniz.

Platformlar:

- macOS: `/Applications` ve `~/Applications` dizinlerini kontrol eder.
- Linux: `google-chrome`, `brave`, `microsoft-edge`, `chromium` vb. arar.
- Windows: yaygın kurulum konumlarını kontrol eder.

## Kontrol API'si (isteğe bağlı)

Yalnızca yerel entegrasyonlar için Gateway küçük bir loopback HTTP API'si açığa çıkarır:

- Durum/başlat/durdur: `GET /`, `POST /start`, `POST /stop`
- Sekmeler: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/ekran görüntüsü: `GET /snapshot`, `POST /screenshot`
- Eylemler: `POST /navigate`, `POST /act`
- Hook'lar: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- İndirmeler: `POST /download`, `POST /wait/download`
- Hata ayıklama: `GET /console`, `POST /pdf`
- Hata ayıklama: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Ağ: `POST /response/body`
- Durum: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Durum: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ayarlar: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tüm uç noktalar `?profile=<name>` kabul eder.

Paylaşılan gizli anahtar gateway auth yapılandırılmışsa, tarayıcı HTTP rotaları da auth gerektirir:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` veya bu parolayla HTTP Basic auth

Notlar:

- Bu bağımsız loopback tarayıcı API'si `trusted-proxy` veya
  Tailscale Serve kimlik başlıklarını **kullanmaz**.
- `gateway.auth.mode` değeri `none` veya `trusted-proxy` ise, bu loopback tarayıcı
  rotaları bu kimlik taşıyan modları devralmaz; bunları yalnızca loopback'te tutun.

### Playwright gereksinimi

Bazı özellikler (navigate/act/AI snapshot/role snapshot, öğe ekran görüntüleri,
PDF) Playwright gerektirir. Playwright yüklü değilse, bu uç noktalar açık bir
501 hatası döndürür.

Playwright olmadan hâlâ çalışanlar:

- ARIA snapshot'ları
- Sekme başına CDP WebSocket mevcut olduğunda yönetilen `openclaw` tarayıcısı için sayfa ekran görüntüleri
- `existing-session` / Chrome MCP profilleri için sayfa ekran görüntüleri
- Snapshot çıktısından `existing-session` ref tabanlı ekran görüntüleri (`--ref`)

Hâlâ Playwright gerektirenler:

- `navigate`
- `act`
- AI snapshot'ları / role snapshot'ları
- CSS seçicili öğe ekran görüntüleri (`--element`)
- tam tarayıcı PDF dışa aktarma

Öğe ekran görüntüleri `--full-page` seçeneğini de reddeder; rota `fullPage is
not supported for element screenshots` döndürür.

`Playwright is not available in this gateway build` görürseniz, tam
Playwright paketini (`playwright-core` değil) yükleyip gateway'i yeniden
başlatın veya OpenClaw'ı tarayıcı desteğiyle yeniden kurun.

#### Docker Playwright kurulumu

Gateway'iniz Docker içinde çalışıyorsa `npx playwright` kullanmaktan kaçının
(npm override çakışmaları). Bunun yerine paketlenmiş CLI'yi kullanın:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Tarayıcı indirmelerini kalıcı kılmak için `PLAYWRIGHT_BROWSERS_PATH` ayarlayın (örneğin,
`/home/node/.cache/ms-playwright`) ve `/home/node` yolunun
`OPENCLAW_HOME_VOLUME` veya bir bind mount ile kalıcı olduğundan emin olun.
Bkz. [Docker](/tr/install/docker).

## Nasıl çalışır (dahili)

Yüksek düzey akış:

- Küçük bir **kontrol sunucusu** HTTP isteklerini kabul eder.
- Chromium tabanlı tarayıcılara (Chrome/Brave/Edge/Chromium) **CDP** üzerinden bağlanır.
- Gelişmiş eylemler için (tıkla/yaz/snapshot/PDF), CDP üzerinde **Playwright** kullanır.
- Playwright eksik olduğunda yalnızca Playwright gerektirmeyen işlemler kullanılabilir.

Bu tasarım, aracıyı kararlı ve deterministik bir arayüz üzerinde tutarken
yerel/uzak tarayıcıları ve profilleri değiştirmenize olanak tanır.

## CLI hızlı başvuru

Tüm komutlar belirli bir profili hedeflemek için `--browser-profile <name>` kabul eder.
Tüm komutlar ayrıca makine tarafından okunabilir çıktı için `--json` kabul eder (kararlı payload'lar).

Temeller:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

İnceleme:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Yaşam döngüsü notu:

- Yalnızca bağlanma ve uzak CDP profilleri için `openclaw browser stop`,
  testlerden sonra hâlâ doğru temizleme komutudur. Alt taraftaki
  tarayıcıyı öldürmek yerine etkin kontrol oturumunu kapatır ve geçici
  öykünme geçersiz kılmalarını temizler.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Eylemler:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Durum:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Notlar:

- `upload` ve `dialog` **hazırlama** çağrılarıdır; dosya seçiciyi/iletişim kutusunu
  tetikleyen tıklama/basma işleminden önce bunları çalıştırın.
- İndirme ve trace çıktı yolları OpenClaw geçici kökleriyle sınırlıdır:
  - trace'ler: `/tmp/openclaw` (yedek: `${os.tmpdir()}/openclaw`)
  - indirmeler: `/tmp/openclaw/downloads` (yedek: `${os.tmpdir()}/openclaw/downloads`)
- Yükleme yolları bir OpenClaw geçici uploads köküyle sınırlıdır:
  - uploads: `/tmp/openclaw/uploads` (yedek: `${os.tmpdir()}/openclaw/uploads`)
- `upload`, `--input-ref` veya `--element` ile dosya girişlerini doğrudan da ayarlayabilir.
- `snapshot`:
  - `--format ai` (Playwright kuruluysa varsayılan): sayısal ref'ler (`aria-ref="<n>"`) içeren bir AI snapshot döndürür.
  - `--format aria`: erişilebilirlik ağacını döndürür (ref yoktur; yalnızca inceleme içindir).
  - `--efficient` (veya `--mode efficient`): kompakt role snapshot ön ayarıdır (interactive + compact + depth + daha düşük maxChars).
  - Yapılandırma varsayılanı (yalnızca araç/CLI): çağıran taraf bir mod geçmezse verimli snapshot'ları kullanmak için `browser.snapshotDefaults.mode: "efficient"` ayarlayın (bkz. [Gateway configuration](/tr/gateway/configuration-reference#browser)).
  - Role snapshot seçenekleri (`--interactive`, `--compact`, `--depth`, `--selector`), `ref=e12` gibi ref'lerle rol tabanlı bir snapshot'ı zorlar.
  - `--frame "<iframe selector>"`, role snapshot'ları bir iframe'e sınırlar (`e12` gibi role ref'lerle eşleşir).
  - `--interactive`, etkileşimli öğelerin düz ve kolay seçilebilir bir listesini verir (eylem yönlendirmek için en iyisi).
  - `--labels`, üstüne ref etiketleri bindirilmiş yalnızca görünüm alanına ait bir ekran görüntüsü ekler (`MEDIA:<path>` yazdırır).
- `click`/`type`/vb. `snapshot` içinden bir `ref` gerektirir (sayısal `12` veya role ref `e12`).
  CSS seçicileri eylemler için bilinçli olarak desteklenmez.

## Snapshot'lar ve ref'ler

OpenClaw iki “snapshot” stilini destekler:

- **AI snapshot (sayısal ref'ler)**: `openclaw browser snapshot` (varsayılan; `--format ai`)
  - Çıktı: sayısal ref'ler içeren bir metin snapshot'ı.
  - Eylemler: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Dahili olarak ref, Playwright'ın `aria-ref` mekanizmasıyla çözülür.

- **Role snapshot (`e12` gibi role ref'ler)**: `openclaw browser snapshot --interactive` (veya `--compact`, `--depth`, `--selector`, `--frame`)
  - Çıktı: `[ref=e12]` içeren rol tabanlı bir liste/ağaç (ve isteğe bağlı `[nth=1]`).
  - Eylemler: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Dahili olarak ref, `getByRole(...)` üzerinden çözülür (artı çoğaltmalar için `nth()`).
  - Üstüne bindirilmiş `e12` etiketleri içeren bir görünüm alanı ekran görüntüsü eklemek için `--labels` ekleyin.

Ref davranışı:

- Ref'ler gezintiler arasında **kararlı değildir**; bir şey başarısız olursa `snapshot` yeniden çalıştırın ve yeni bir ref kullanın.
- Role snapshot `--frame` ile alındıysa, role ref'ler bir sonraki role snapshot'a kadar o iframe kapsamındadır.

## Wait güçlendirmeleri

Yalnızca süre/metin değil, daha fazlasını bekleyebilirsiniz:

- URL bekleme (Playwright tarafından glob desteklenir):
  - `openclaw browser wait --url "**/dash"`
- Yükleme durumunu bekleme:
  - `openclaw browser wait --load networkidle`
- JS predicate bekleme:
  - `openclaw browser wait --fn "window.ready===true"`
- Bir seçicinin görünür olmasını bekleme:
  - `openclaw browser wait "#main"`

Bunlar birleştirilebilir:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Hata ayıklama iş akışları

Bir eylem başarısız olduğunda (ör. “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` kullanın (interactive modda role ref'leri tercih edin)
3. Hâlâ başarısız olursa: Playwright'ın neyi hedeflediğini görmek için `openclaw browser highlight <ref>`
4. Sayfa garip davranıyorsa:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Derin hata ayıklama için bir trace kaydedin:
   - `openclaw browser trace start`
   - sorunu yeniden üretin
   - `openclaw browser trace stop` (`TRACE:<path>` yazdırır)

## JSON çıktısı

`--json`, betik yazımı ve yapılandırılmış araçlar içindir.

Örnekler:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON içindeki role snapshot'lar, araçların payload boyutunu ve yoğunluğunu
değerlendirebilmesi için `refs` ve küçük bir `stats` bloğu (satır/karakter/ref/interactive) içerir.

## Durum ve ortam düğmeleri

Bunlar “siteyi X gibi davranmaya zorla” iş akışları için kullanışlıdır:

- Çerezler: `cookies`, `cookies set`, `cookies clear`
- Depolama: `storage local|session get|set|clear`
- Çevrimdışı: `set offline on|off`
- Başlıklar: `set headers --headers-json '{"X-Debug":"1"}'` (eski `set headers --json '{"X-Debug":"1"}'` hâlâ desteklenir)
- HTTP basic auth: `set credentials user pass` (veya `--clear`)
- Coğrafi konum: `set geo <lat> <lon> --origin "https://example.com"` (veya `--clear`)
- Medya: `set media dark|light|no-preference|none`
- Saat dilimi / yerel ayar: `set timezone ...`, `set locale ...`
- Cihaz / görünüm alanı:
  - `set device "iPhone 14"` (Playwright cihaz ön ayarları)
  - `set viewport 1280 720`

## Güvenlik ve gizlilik

- openclaw tarayıcı profili oturum açılmış oturumlar içerebilir; bunu hassas kabul edin.
- `browser act kind=evaluate` / `openclaw browser evaluate` ve `wait --fn`,
  sayfa bağlamında rastgele JavaScript çalıştırır. Prompt injection bunu
  yönlendirebilir. Buna ihtiyacınız yoksa `browser.evaluateEnabled=false` ile devre dışı bırakın.
- Girişler ve anti-bot notları (X/Twitter vb.) için [Browser login + X/Twitter posting](/tr/tools/browser-login) bölümüne bakın.
- Gateway/düğüm ana makinesini özel tutun (yalnızca loopback veya tailnet).
- Uzak CDP uç noktaları güçlüdür; tünelleyin ve koruyun.

Katı mod örneği (varsayılan olarak özel/dahili hedefleri engelle):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // isteğe bağlı tam izin
    },
  },
}
```

## Sorun giderme

Linux'e özgü sorunlar (özellikle snap Chromium) için
[Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting) bölümüne bakın.

WSL2 Gateway + Windows Chrome bölünmüş ana makine kurulumları için
[WSL2 + Windows + uzak Chrome CDP sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
bölümüne bakın.

## Aracı araçları + kontrolün nasıl çalıştığı

Aracı, tarayıcı otomasyonu için **tek bir araç** alır:

- `browser` — durum/başlat/durdur/sekmeler/aç/odaklan/kapat/snapshot/ekran görüntüsü/navigate/act

Nasıl eşlenir:

- `browser snapshot`, kararlı bir UI ağacı döndürür (AI veya ARIA).
- `browser act`, tıklama/yazma/sürükleme/seçme için snapshot `ref` kimliklerini kullanır.
- `browser screenshot`, pikselleri yakalar (tam sayfa veya öğe).
- `browser` şunları kabul eder:
  - adlandırılmış bir tarayıcı profili seçmek için `profile` (openclaw, chrome veya uzak CDP).
  - tarayıcının nerede bulunduğunu seçmek için `target` (`sandbox` | `host` | `node`).
  - Sandbox'lı oturumlarda `target: "host"` için `agents.defaults.sandbox.browser.allowHostControl=true` gerekir.
  - `target` atlanırsa: sandbox'lı oturumlar varsayılan olarak `sandbox`, sandbox'sız oturumlar varsayılan olarak `host` olur.
  - Tarayıcı özellikli bir düğüm bağlıysa, `target="host"` veya `target="node"` ile sabitlemediğiniz sürece araç otomatik olarak ona yönlenebilir.

Bu, aracıyı deterministik tutar ve kırılgan seçicilerden kaçınır.

## İlgili

- [Araçlara Genel Bakış](/tr/tools) — mevcut tüm aracı araçları
- [Sandboxing](/tr/gateway/sandboxing) — sandbox'lı ortamlarda tarayıcı kontrolü
- [Güvenlik](/tr/gateway/security) — tarayıcı kontrolü riskleri ve sıkılaştırma
