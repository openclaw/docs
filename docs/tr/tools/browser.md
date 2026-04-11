---
read_when:
    - Ajan kontrollü tarayıcı otomasyonu ekleme
    - openclaw'ın kendi Chrome'unuza neden müdahale ettiğini ayıklama
    - macOS uygulamasında Browser ayarlarını ve yaşam döngüsünü uygulama
summary: Entegre tarayıcı kontrol hizmeti + eylem komutları
title: Browser (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-04-11T02:47:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: da6fed36a6f40a50e825f90e5616778954545bd7e52397f7e088b85251ee024f
    source_path: tools/browser.md
    workflow: 15
---

# Browser (openclaw tarafından yönetilen)

OpenClaw, ajanın kontrol ettiği **ayrılmış bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir.
Bu profil kişisel tarayıcınızdan yalıtılmıştır ve Gateway içindeki küçük bir yerel
kontrol hizmeti üzerinden yönetilir (yalnızca loopback).

Başlangıç düzeyi görünüm:

- Bunu **ayrı, yalnızca ajana ait bir tarayıcı** olarak düşünün.
- `openclaw` profili kişisel tarayıcı profilinize **dokunmaz**.
- Ajan güvenli bir şeritte **sekme açabilir, sayfaları okuyabilir, tıklayabilir ve yazabilir**.
- Yerleşik `user` profili, Chrome MCP üzerinden gerçek oturum açılmış Chrome oturumunuza bağlanır.

## Elde edecekleriniz

- **openclaw** adlı ayrı bir tarayıcı profili (varsayılan olarak turuncu vurgu).
- Deterministik sekme kontrolü (listele/aç/odakla/kapat).
- Ajan eylemleri (tıkla/yaz/sürükle/seç), anlık görüntüler, ekran görüntüleri, PDF'ler.
- İsteğe bağlı çoklu profil desteği (`openclaw`, `work`, `remote`, ...).

Bu tarayıcı günlük ana tarayıcınız **değildir**. Ajan otomasyonu ve doğrulaması için
güvenli, yalıtılmış bir yüzeydir.

## Hızlı başlangıç

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled” alırsanız, bunu yapılandırmada etkinleştirin (aşağıya bakın) ve
Gateway'i yeniden başlatın.

`openclaw browser` tamamen yoksa veya ajan tarayıcı aracının
kullanılamadığını söylüyorsa, [Eksik browser komutu veya aracı](/tr/tools/browser#missing-browser-command-or-tool) bölümüne atlayın.

## Plugin denetimi

Varsayılan `browser` aracı artık varsayılan olarak etkin gelen paketlenmiş bir plugin'dir.
Bu, OpenClaw'ın geri kalan plugin sistemini kaldırmadan onu devre dışı bırakabileceğiniz
veya değiştirebileceğiniz anlamına gelir:

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

Aynı `browser` araç adını sağlayan başka bir plugin yüklemeden önce paketlenmiş plugin'i devre dışı bırakın.
Varsayılan Browser deneyimi için ikisi de gerekir:

- `plugins.entries.browser.enabled` devre dışı bırakılmamış olmalı
- `browser.enabled=true`

Yalnızca plugin'i kapatırsanız, paketlenmiş browser CLI'si (`openclaw browser`),
gateway yöntemi (`browser.request`), ajan aracı ve varsayılan browser kontrol
hizmeti birlikte kaybolur. `browser.*` yapılandırmanız, değiştirme plugin'inin yeniden kullanması için bozulmadan kalır.

Paketlenmiş browser plugin'i artık browser çalışma zamanı uygulamasının da sahibidir.
Çekirdek yalnızca paylaşılan Plugin SDK yardımcılarını ve eski dahili içe aktarma yolları için
uyumluluk yeniden dışa aktarımlarını tutar. Pratikte bu, browser plugin paketini kaldırmanın
veya değiştirmenin, ikinci bir çekirdek sahipli çalışma zamanı bırakmak yerine browser özellik kümesini kaldırdığı anlamına gelir.

Browser yapılandırma değişiklikleri, paketlenmiş plugin'in browser hizmetini yeni ayarlarla yeniden kaydedebilmesi için
hâlâ Gateway yeniden başlatması gerektirir.

## Eksik browser komutu veya aracı

Bir yükseltmeden sonra `openclaw browser` aniden bilinmeyen komut hâline geldiyse veya
ajan browser aracının eksik olduğunu bildiriyorsa, en yaygın neden `browser` içermeyen
kısıtlayıcı bir `plugins.allow` listesidir.

Bozuk yapılandırma örneği:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Bunu, plugin allowlist'e `browser` ekleyerek düzeltin:

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
- `tools.alsoAllow: ["browser"]`, paketlenmiş browser plugin'ini yüklemez. Yalnızca plugin zaten yüklendikten sonra araç politikasını ayarlar.
- Kısıtlayıcı bir plugin allowlist gerekmiyorsa, `plugins.allow` öğesini kaldırmak varsayılan paketlenmiş browser davranışını da geri getirir.

Tipik belirtiler:

- `openclaw browser` bilinmeyen bir komuttur.
- `browser.request` eksiktir.
- Ajan browser aracını kullanılamaz veya eksik olarak bildirir.

## Profiller: `openclaw` ve `user`

- `openclaw`: yönetilen, yalıtılmış browser (eklentisiz).
- `user`: **gerçek oturum açılmış Chrome** oturumunuz için yerleşik Chrome MCP ekleme profili.

Ajan browser aracı çağrıları için:

- Varsayılan: yalıtılmış `openclaw` browser'ını kullanın.
- Mevcut oturum açılmış oturumlar önemliyse ve kullanıcı bilgisayar başında olup herhangi bir ekleme/onay istemine tıklayabilecek durumdaysa `profile="user"` tercih edin.
- Belirli bir browser modu istediğinizde açık geçersiz kılma `profile` olur.

Varsayılan olarak yönetilen modu istiyorsanız `browser.defaultProfile: "openclaw"` ayarlayın.

## Yapılandırma

Browser ayarları `~/.openclaw/openclaw.json` içinde bulunur.

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

- Browser kontrol hizmeti, `gateway.port` değerinden türetilen bir portta loopback'e bağlanır
  (varsayılan: `18791`, yani gateway + 2).
- Gateway portunu (`gateway.port` veya `OPENCLAW_GATEWAY_PORT`) geçersiz kılarsanız,
  türetilen browser portları aynı “ailede” kalacak şekilde kayar.
- `cdpUrl`, ayarlanmadığında varsayılan olarak yönetilen yerel CDP portunu kullanır.
- `remoteCdpTimeoutMs`, uzak (loopback olmayan) CDP erişilebilirlik kontrollerine uygulanır.
- `remoteCdpHandshakeTimeoutMs`, uzak CDP WebSocket erişilebilirlik kontrollerine uygulanır.
- Browser gezintisi/sekme açma, gezinmeden önce SSRF korumalıdır ve gezinmeden sonra son `http(s)` URL'sinde en iyi çabayla yeniden kontrol edilir.
- Sıkı SSRF modunda, uzak CDP uç noktası keşfi/probları (`cdpUrl`, `/json/version` aramaları dahil) da kontrol edilir.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak devre dışıdır. Yalnızca özel ağ browser erişimine bilinçli olarak güveniyorsanız `true` yapın.
- `browser.ssrfPolicy.allowPrivateNetwork`, uyumluluk için eski bir takma ad olarak desteklenmeye devam eder.
- `attachOnly: true`, “yerel browser asla başlatma; yalnızca zaten çalışıyorsa ekle” anlamına gelir.
- `color` + profil başına `color`, hangi profilin etkin olduğunu görebilmeniz için browser kullanıcı arayüzünü renklendirir.
- Varsayılan profil `openclaw`'dır (OpenClaw tarafından yönetilen bağımsız browser). Oturum açılmış kullanıcı browser'ına geçmek için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: Chromium tabanlıysa sistem varsayılan browser'ı; değilse Chrome → Brave → Edge → Chromium → Chrome Canary.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar — bunları yalnızca uzak CDP için ayarlayın.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır. Bu sürücü için `cdpUrl` ayarlamayın.
- Var olan oturum profili Brave veya Edge gibi varsayılan olmayan bir Chromium kullanıcı profiline bağlanacaksa `browser.profiles.<name>.userDataDir` ayarlayın.

## Brave kullanın (veya başka bir Chromium tabanlı browser)

**Sistem varsayılan** browser'ınız Chromium tabanlıysa (Chrome/Brave/Edge/vb),
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

- **Yerel kontrol (varsayılan):** Gateway, loopback kontrol hizmetini başlatır ve yerel bir browser açabilir.
- **Uzak kontrol (node host):** Browser'ın bulunduğu makinede bir node host çalıştırın; Gateway browser eylemlerini ona proxy eder.
- **Uzak CDP:** Uzak bir Chromium tabanlı browser'a bağlanmak için `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`) ayarlayın. Bu durumda OpenClaw yerel browser başlatmaz.

Durdurma davranışı profil moduna göre farklıdır:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw'ın başlattığı browser sürecini durdurur
- attach-only ve uzak CDP profilleri: `openclaw browser stop`, etkin kontrol oturumunu kapatır ve Playwright/CDP emülasyon geçersiz kılmalarını (viewport,
  renk şeması, yerel ayar, saat dilimi, çevrimdışı modu ve benzeri durumlar) serbest bırakır; OpenClaw tarafından hiçbir browser süreci başlatılmamış olsa bile

Uzak CDP URL'leri kimlik doğrulama içerebilir:

- Sorgu belirteçleri (ör. `https://provider.example?token=<token>`)
- HTTP Basic kimlik doğrulaması (ör. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktaları çağrılırken ve
CDP WebSocket'e bağlanırken kimlik doğrulamayı korur. Belirteçleri yapılandırma dosyalarına işlemeyi önlemek için
çevre değişkenlerini veya gizli bilgi yöneticilerini tercih edin.

## Node browser proxy (sıfır yapılandırmalı varsayılan)

Browser'ınızın bulunduğu makinede bir **node host** çalıştırırsanız, OpenClaw
ek browser yapılandırması olmadan browser aracı çağrılarını otomatik olarak o node'a yönlendirebilir.
Bu, uzak gateway'ler için varsayılan yoldur.

Notlar:

- Node host, yerel browser kontrol sunucusunu bir **proxy komutu** aracılığıyla sunar.
- Profiller, node'un kendi `browser.profiles` yapılandırmasından gelir (yerel ile aynı).
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için boş bırakın: profil oluşturma/silme yolları dahil tüm yapılandırılmış profiller proxy üzerinden erişilebilir kalır.
- `nodeHost.browserProxy.allowProfiles` ayarlarsanız, OpenClaw bunu en az ayrıcalık sınırı olarak değerlendirir: yalnızca allowlist içindeki profiller hedeflenebilir ve kalıcı profil oluşturma/silme yolları proxy yüzeyinde engellenir.
- İstemiyorsanız devre dışı bırakın:
  - Node üzerinde: `nodeHost.browserProxy.enabled=false`
  - Gateway üzerinde: `gateway.nodes.browser.mode="off"`

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), HTTPS ve WebSocket üzerinden
CDP bağlantı URL'leri sunan barındırılan bir Chromium hizmetidir. OpenClaw her iki biçimi de kullanabilir, ancak
uzak browser profili için en basit seçenek Browserless bağlantı dokümanlarındaki
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
- Browserless hesabınıza uygun bölge uç noktasını seçin (dokümanlarına bakın).
- Browserless size bir HTTPS temel URL verirse, bunu doğrudan CDP bağlantısı için `wss://` biçimine dönüştürebilir veya HTTPS URL'sini koruyup OpenClaw'ın `/json/version` keşfi yapmasına izin verebilirsiniz.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılan browser hizmetleri, standart HTTP tabanlı CDP keşfi (`/json/version`) yerine
**doğrudan bir WebSocket** uç noktası sunar. OpenClaw her ikisini de destekler:

- **HTTP(S) uç noktaları** — OpenClaw, WebSocket hata ayıklayıcı URL'sini keşfetmek için `/json/version` çağırır, ardından bağlanır.
- **WebSocket uç noktaları** (`ws://` / `wss://`) — OpenClaw doğrudan bağlanır,
  `/json/version` adımını atlar. Bunu
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com) gibi hizmetler veya size
  WebSocket URL'si veren herhangi bir sağlayıcı için kullanın.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözme, stealth modu ve residential proxy'lerle
headless browser çalıştırmak için bir bulut platformudur.

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

- [Kaydolun](https://www.browserbase.com/sign-up) ve [Overview panosundan](https://www.browserbase.com/overview)
  **API Key** değerinizi kopyalayın.
- `<BROWSERBASE_API_KEY>` yerine gerçek Browserbase API anahtarınızı koyun.
- Browserbase, WebSocket bağlantısında otomatik olarak bir browser oturumu oluşturur; bu nedenle
  elle oturum oluşturma adımı gerekmez.
- Ücretsiz katman ayda bir eşzamanlı oturuma ve bir browser saatine izin verir.
  Ücretli plan sınırları için [fiyatlandırma](https://www.browserbase.com/pricing) sayfasına bakın.
- Tam API başvurusu, SDK kılavuzları ve entegrasyon örnekleri için
  [Browserbase dokümantasyonuna](https://docs.browserbase.com) bakın.

## Güvenlik

Temel fikirler:

- Browser kontrolü yalnızca loopback üzerindedir; erişim Gateway kimlik doğrulaması veya node eşleme üzerinden akar.
- Bağımsız loopback browser HTTP API'si yalnızca **paylaşılan gizli anahtar kimlik doğrulaması** kullanır:
  gateway token bearer auth, `x-openclaw-password` veya
  yapılandırılmış gateway parolasıyla HTTP Basic auth.
- Tailscale Serve kimlik üst bilgileri ve `gateway.auth.mode: "trusted-proxy"`,
  bu bağımsız loopback browser API'sini kimlik doğrulamaz.
- Browser kontrolü etkinse ve yapılandırılmış bir paylaşılan gizli anahtar kimlik doğrulaması yoksa, OpenClaw
  açılışta `gateway.auth.token` değerini otomatik oluşturur ve yapılandırmaya kalıcı olarak kaydeder.
- `gateway.auth.mode` zaten
  `password`, `none` veya `trusted-proxy` ise OpenClaw bu belirteci otomatik oluşturmaz.
- Gateway'i ve tüm node host'ları özel bir ağda tutun (Tailscale); herkese açık ortama açmayın.
- Uzak CDP URL'lerini/belirteçlerini gizli bilgi olarak değerlendirin; ortam değişkenleri veya gizli bilgi yöneticisi kullanın.

Uzak CDP ipuçları:

- Mümkün olduğunda şifreli uç noktaları (HTTPS veya WSS) ve kısa ömürlü belirteçleri tercih edin.
- Uzun ömürlü belirteçleri doğrudan yapılandırma dosyalarına gömmekten kaçının.

## Profiller (çoklu browser)

OpenClaw birden çok adlandırılmış profili (yönlendirme yapılandırmaları) destekler. Profiller şunlar olabilir:

- **OpenClaw tarafından yönetilen**: kendi kullanıcı veri dizini + CDP portuna sahip ayrılmış bir Chromium tabanlı browser örneği
- **uzak**: açık bir CDP URL'si (başka yerde çalışan Chromium tabanlı browser)
- **mevcut oturum**: Chrome DevTools MCP otomatik bağlanma üzerinden mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili eksikse otomatik oluşturulur.
- `user` profili Chrome MCP mevcut oturum ekleme için yerleşiktir.
- Mevcut oturum profilleri `user` dışında isteğe bağlıdır; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP portları varsayılan olarak **18800–18899** aralığından ayrılır.
- Bir profil silindiğinde yerel veri dizini Çöp Kutusu'na taşınır.

Tüm kontrol uç noktaları `?profile=<name>` kabul eder; CLI ise `--browser-profile` kullanır.

## Chrome DevTools MCP üzerinden mevcut oturum

OpenClaw ayrıca resmi Chrome DevTools MCP sunucusu üzerinden çalışan bir Chromium tabanlı browser profiline bağlanabilir. Bu, o browser profilinde zaten açık olan sekmeleri ve oturum durumunu yeniden kullanır.

Resmi arka plan ve kurulum başvuruları:

- [Chrome for Developers: Tarayıcı oturumunuzla Chrome DevTools MCP kullanın](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil:

- `user`

İsteğe bağlı: farklı bir ad, renk veya browser veri dizini istiyorsanız
kendi özel mevcut oturum profilinizi oluşturun.

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

Ardından eşleşen browser'da:

1. Uzak hata ayıklama için o browser'ın inspect sayfasını açın.
2. Uzak hata ayıklamayı etkinleştirin.
3. Browser'ı çalışır halde tutun ve OpenClaw bağlandığında bağlantı istemini onaylayın.

Yaygın inspect sayfaları:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Canlı ekleme smoke testi:

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
- `tabs`, zaten açık browser sekmelerinizi listeler
- `snapshot`, seçili canlı sekmeden ref'ler döndürür

Bağlantı çalışmıyorsa kontrol edilmesi gerekenler:

- hedef Chromium tabanlı browser sürümü `144+` olmalı
- uzak hata ayıklama, o browser'ın inspect sayfasında etkinleştirilmiş olmalı
- browser bağlantı onayı istemini göstermiş ve siz kabul etmiş olmalısınız
- `openclaw doctor`, eski uzantı tabanlı browser yapılandırmasını geçirir ve
  varsayılan otomatik bağlanma profilleri için Chrome'un yerel olarak yüklü olup olmadığını kontrol eder, ancak
  browser tarafı uzak hata ayıklamayı sizin yerinize etkinleştiremez

Ajan kullanımı:

- Kullanıcının oturum açılmış browser durumuna ihtiyaç duyduğunuzda `profile="user"` kullanın.
- Özel bir mevcut oturum profili kullanıyorsanız, o açık profil adını geçin.
- Bu modu yalnızca kullanıcı bilgisayar başındaysa ve ekleme istemini onaylayabilecek durumdaysa seçin.
- Gateway veya node host, `npx chrome-devtools-mcp@latest --autoConnect` başlatabilir

Notlar:

- Bu yol, oturum açılmış browser oturumunuz içinde işlem yapabildiği için yalıtılmış `openclaw` profiline göre daha yüksek risklidir.
- OpenClaw bu sürücü için browser başlatmaz; yalnızca mevcut bir oturuma bağlanır.
- OpenClaw burada resmi Chrome DevTools MCP `--autoConnect` akışını kullanır. `userDataDir` ayarlıysa,
  OpenClaw bunu açık Chromium kullanıcı veri dizinini hedeflemek için iletir.
- Mevcut oturum ekran görüntüleri sayfa yakalamalarını ve anlık görüntülerden `--ref` öğe
  yakalamalarını destekler, ancak CSS `--element` seçicilerini desteklemez.
- Mevcut oturum sayfa ekran görüntüleri Playwright olmadan Chrome MCP üzerinden çalışır.
  Ref tabanlı öğe ekran görüntüleri (`--ref`) da burada çalışır, ancak `--full-page`
  ile `--ref` veya `--element` birlikte kullanılamaz.
- Mevcut oturum eylemleri hâlâ yönetilen browser yoluna göre daha sınırlıdır:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select`,
    CSS seçicileri yerine anlık görüntü ref'leri gerektirir
  - `click` yalnızca sol düğme içindir (düğme geçersiz kılmaları veya değiştirici tuşlar yok)
  - `type`, `slowly=true` desteklemez; `fill` veya `press` kullanın
  - `press`, `delayMs` desteklemez
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` ve `evaluate`,
    çağrı başına zaman aşımı geçersiz kılmalarını desteklemez
  - `select` şu anda yalnızca tek bir değeri destekler
- Mevcut oturum `wait --url`, diğer browser sürücüleri gibi tam, alt dize ve glob desenlerini destekler. `wait --load networkidle` henüz desteklenmiyor.
- Mevcut oturum yükleme kancaları `ref` veya `inputRef` gerektirir, aynı anda tek dosya destekler ve CSS `element` hedeflemeyi desteklemez.
- Mevcut oturum ileti kutusu kancaları zaman aşımı geçersiz kılmalarını desteklemez.
- Toplu eylemler, PDF dışa aktarma, indirme yakalama ve `responsebody` dahil bazı özellikler hâlâ yönetilen browser yolunu gerektirir.
- Mevcut oturum ana makineye özeldir. Chrome farklı bir makinede veya farklı bir ağ ad alanında bulunuyorsa,
  bunun yerine uzak CDP veya bir node host kullanın.

## Yalıtım garantileri

- **Ayrılmış kullanıcı veri dizini**: kişisel browser profilinize asla dokunmaz.
- **Ayrılmış portlar**: geliştirme iş akışlarıyla çakışmayı önlemek için `9222` kullanılmaz.
- **Deterministik sekme kontrolü**: hedef sekmeler “son sekme” ile değil, `targetId` ile belirlenir.

## Browser seçimi

Yerel başlatmada OpenClaw şu ilk uygun olanı seçer:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Bunu `browser.executablePath` ile geçersiz kılabilirsiniz.

Platformlar:

- macOS: `/Applications` ve `~/Applications` kontrol edilir.
- Linux: `google-chrome`, `brave`, `microsoft-edge`, `chromium` vb. aranır.
- Windows: yaygın kurulum konumları kontrol edilir.

## Kontrol API'si (isteğe bağlı)

Yalnızca yerel entegrasyonlar için Gateway, küçük bir loopback HTTP API sunar:

- Durum/başlat/durdur: `GET /`, `POST /start`, `POST /stop`
- Sekmeler: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Anlık görüntü/ekran görüntüsü: `GET /snapshot`, `POST /screenshot`
- Eylemler: `POST /navigate`, `POST /act`
- Kancalar: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- İndirmeler: `POST /download`, `POST /wait/download`
- Hata ayıklama: `GET /console`, `POST /pdf`
- Hata ayıklama: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Ağ: `POST /response/body`
- Durum: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Durum: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ayarlar: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tüm uç noktalar `?profile=<name>` kabul eder.

Paylaşılan gizli anahtar gateway kimlik doğrulaması yapılandırılmışsa, browser HTTP yolları da kimlik doğrulama gerektirir:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` veya bu parola ile HTTP Basic auth

Notlar:

- Bu bağımsız loopback browser API'si `trusted-proxy` veya
  Tailscale Serve kimlik üst bilgilerini kullanmaz.
- `gateway.auth.mode` değeri `none` veya `trusted-proxy` ise, bu loopback browser
  yolları bu kimlik taşıyan modları devralmaz; bunları yalnızca loopback ile sınırlı tutun.

### `/act` hata sözleşmesi

`POST /act`, yön düzeyi doğrulama ve
politika hataları için yapılandırılmış bir hata yanıtı kullanır:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Geçerli `code` değerleri:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` eksik veya tanınmıyor.
- `ACT_INVALID_REQUEST` (HTTP 400): eylem yükü normalleştirme veya doğrulamadan geçemedi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector`, desteklenmeyen bir eylem türüyle kullanıldı.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (veya `wait --fn`) yapılandırma nedeniyle devre dışı.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): üst düzey veya toplu `targetId`, istek hedefiyle çakışıyor.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): eylem, mevcut oturum profilleri için desteklenmiyor.

Diğer çalışma zamanı hataları hâlâ `code` alanı olmadan
`{ "error": "<message>" }` döndürebilir.

### Playwright gereksinimi

Bazı özellikler (navigate/act/AI snapshot/role snapshot, öğe ekran görüntüleri,
PDF) Playwright gerektirir. Playwright yüklü değilse bu uç noktalar
açık bir 501 hatası döndürür.

Playwright olmadan hâlâ çalışanlar:

- ARIA anlık görüntüleri
- Sekme başına CDP WebSocket mevcut olduğunda yönetilen `openclaw` browser'ı için sayfa ekran görüntüleri
- `existing-session` / Chrome MCP profilleri için sayfa ekran görüntüleri
- Anlık görüntü çıktısından `existing-session` ref tabanlı ekran görüntüleri (`--ref`)

Hâlâ Playwright gerektirenler:

- `navigate`
- `act`
- AI anlık görüntüleri / rol anlık görüntüleri
- CSS seçicili öğe ekran görüntüleri (`--element`)
- tam browser PDF dışa aktarma

Öğe ekran görüntüleri ayrıca `--full-page` seçeneğini reddeder; yön
`fullPage is not supported for element screenshots` döndürür.

Playwright yüklemesi için en net hata mesajı `Playwright is not available in this gateway build` ise, tam
Playwright paketini (`playwright-core` değil) yükleyin ve gateway'i yeniden başlatın ya da
OpenClaw'ı browser desteğiyle yeniden kurun.

#### Docker Playwright yüklemesi

Gateway'iniz Docker içinde çalışıyorsa `npx playwright` kullanmaktan kaçının (npm override çakışmaları).
Bunun yerine paketlenmiş CLI'yi kullanın:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Browser indirmelerini kalıcı tutmak için `PLAYWRIGHT_BROWSERS_PATH` ayarlayın (örneğin,
`/home/node/.cache/ms-playwright`) ve `/home/node` dizininin
`OPENCLAW_HOME_VOLUME` veya bir bind mount aracılığıyla kalıcı olduğundan emin olun. Bkz. [Docker](/tr/install/docker).

## Nasıl çalışır (dahili)

Yüksek düzey akış:

- Küçük bir **kontrol sunucusu** HTTP isteklerini kabul eder.
- Chromium tabanlı browser'lara (Chrome/Brave/Edge/Chromium) **CDP** üzerinden bağlanır.
- Gelişmiş eylemler (tıklama/yazma/anlık görüntü/PDF) için CDP üzerinde **Playwright** kullanır.
- Playwright eksikse yalnızca Playwright gerektirmeyen işlemler kullanılabilir.

Bu tasarım, yerel/uzak browser'lar ve profiller arasında geçiş yapmanıza olanak tanırken ajanı kararlı, deterministik bir arayüz üzerinde tutar.

## CLI hızlı başvuru

Tüm komutlar belirli bir profili hedeflemek için `--browser-profile <name>` kabul eder.
Tüm komutlar ayrıca makine tarafından okunabilir çıktı için `--json` da kabul eder (kararlı yükler).

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

- Attach-only ve uzak CDP profilleri için de testlerden sonra doğru temizleme komutu
  `openclaw browser stop` komutudur. Alttaki browser'ı öldürmek yerine etkin kontrol oturumunu kapatır ve
  geçici emülasyon geçersiz kılmalarını temizler.
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

- `upload` ve `dialog` **hazırlama** çağrılarıdır; dosya seçiciyi/ileti kutusunu
  tetikleyen tıklama/basma işleminden önce bunları çalıştırın.
- İndirme ve iz çıktı yolları OpenClaw geçici kökleriyle sınırlandırılmıştır:
  - izler: `/tmp/openclaw` (geri dönüş: `${os.tmpdir()}/openclaw`)
  - indirmeler: `/tmp/openclaw/downloads` (geri dönüş: `${os.tmpdir()}/openclaw/downloads`)
- Yükleme yolları bir OpenClaw geçici yükleme köküyle sınırlandırılmıştır:
  - yüklemeler: `/tmp/openclaw/uploads` (geri dönüş: `${os.tmpdir()}/openclaw/uploads`)
- `upload`, `--input-ref` veya `--element` ile dosya girdilerini doğrudan da ayarlayabilir.
- `snapshot`:
  - `--format ai` (Playwright yüklüyse varsayılan): sayısal ref'lere sahip bir AI anlık görüntüsü döndürür (`aria-ref="<n>"`).
  - `--format aria`: erişilebilirlik ağacını döndürür (ref yok; yalnızca inceleme).
  - `--efficient` (veya `--mode efficient`): kompakt rol anlık görüntüsü ön ayarıdır (interactive + compact + depth + daha düşük maxChars).
  - Yapılandırma varsayılanı (yalnızca araç/CLI): çağıran bir mod geçmezse verimli anlık görüntüleri kullanmak için `browser.snapshotDefaults.mode: "efficient"` ayarlayın (bkz. [Gateway configuration](/tr/gateway/configuration-reference#browser)).
  - Rol anlık görüntüsü seçenekleri (`--interactive`, `--compact`, `--depth`, `--selector`) `ref=e12` gibi ref'lerle rol tabanlı bir anlık görüntüyü zorlar.
  - `--frame "<iframe selector>"`, rol anlık görüntülerini bir iframe ile sınırlar (`e12` gibi rol ref'leriyle birlikte çalışır).
  - `--interactive`, etkileşimli öğelerin düz, seçmesi kolay bir listesini üretir (eylemleri yönlendirmek için en iyisi).
  - `--labels`, üstüne ref etiketleri bindirilmiş yalnızca viewport ekran görüntüsü ekler (`MEDIA:<path>` yazdırır).
- `click`/`type`/vb. `snapshot` içinden bir `ref` gerektirir (sayısal `12` veya rol ref'i `e12`).
  CSS seçicileri eylemler için bilerek desteklenmez.

## Anlık görüntüler ve ref'ler

OpenClaw iki “anlık görüntü” stilini destekler:

- **AI anlık görüntüsü (sayısal ref'ler)**: `openclaw browser snapshot` (varsayılan; `--format ai`)
  - Çıktı: sayısal ref'ler içeren bir metin anlık görüntüsü.
  - Eylemler: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Dahili olarak ref, Playwright'ın `aria-ref` özelliği üzerinden çözülür.

- **Rol anlık görüntüsü (`e12` gibi rol ref'leri)**: `openclaw browser snapshot --interactive` (veya `--compact`, `--depth`, `--selector`, `--frame`)
  - Çıktı: `[ref=e12]` (ve isteğe bağlı `[nth=1]`) içeren rol tabanlı liste/ağaç.
  - Eylemler: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Dahili olarak ref, `getByRole(...)` (`tekrarlarda `nth()` ile birlikte) üzerinden çözülür.
  - Üzerine bindirilmiş `e12` etiketlerine sahip bir viewport ekran görüntüsü eklemek için `--labels` ekleyin.

Ref davranışı:

- Ref'ler **gezinmeler arasında kararlı değildir**; bir şey başarısız olursa `snapshot` komutunu yeniden çalıştırın ve yeni bir ref kullanın.
- Rol anlık görüntüsü `--frame` ile alındıysa, rol ref'leri bir sonraki rol anlık görüntüsüne kadar o iframe ile sınırlıdır.

## Wait güçlendirmeleri

Yalnızca zaman/metin üzerinde beklemeniz gerekmez:

- URL bekle (Playwright tarafından desteklenen glob'lar):
  - `openclaw browser wait --url "**/dash"`
- Yük durumunu bekle:
  - `openclaw browser wait --load networkidle`
- JS predicate bekle:
  - `openclaw browser wait --fn "window.ready===true"`
- Bir seçicinin görünür olmasını bekle:
  - `openclaw browser wait "#main"`

Bunlar birleştirilebilir:
__OC_I18N_900013__
## Hata ayıklama iş akışları

Bir eylem başarısız olduğunda (ör. “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` kullanın (interactive modda rol ref'lerini tercih edin)
3. Hâlâ başarısız olursa: Playwright'ın neyi hedeflediğini görmek için `openclaw browser highlight <ref>`
4. Sayfa garip davranıyorsa:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Derin hata ayıklama için bir iz kaydedin:
   - `openclaw browser trace start`
   - sorunu yeniden üretin
   - `openclaw browser trace stop` (`TRACE:<path>` yazdırır)

## JSON çıktısı

`--json`, betik yazımı ve yapılandırılmış araçlar içindir.

Örnekler:
__OC_I18N_900014__
JSON içindeki rol anlık görüntüleri `refs` ile birlikte küçük bir `stats` bloğu da içerir (lines/chars/refs/interactive); böylece araçlar yük boyutu ve yoğunluğu hakkında çıkarım yapabilir.

## Durum ve ortam ayarları

Bunlar “siteyi X gibi davranmaya zorla” iş akışları için kullanışlıdır:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (eski `set headers --json '{"X-Debug":"1"}'` desteği sürer)
- HTTP basic auth: `set credentials user pass` (veya `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (veya `--clear`)
- Media: `set media dark|light|no-preference|none`
- Saat dilimi / yerel ayar: `set timezone ...`, `set locale ...`
- Cihaz / viewport:
  - `set device "iPhone 14"` (Playwright cihaz ön ayarları)
  - `set viewport 1280 720`

## Güvenlik ve gizlilik

- openclaw browser profili oturum açılmış oturumlar içerebilir; hassas olarak değerlendirin.
- `browser act kind=evaluate` / `openclaw browser evaluate` ve `wait --fn`,
  sayfa bağlamında rastgele JavaScript yürütür. Prompt injection bunu yönlendirebilir.
  İhtiyacınız yoksa `browser.evaluateEnabled=false` ile devre dışı bırakın.
- Girişler ve anti-bot notları (X/Twitter vb.) için [Browser login + X/Twitter posting](/tools/browser-login) bölümüne bakın.
- Gateway/node host'u özel tutun (yalnızca loopback veya tailnet).
- Uzak CDP uç noktaları güçlüdür; tünelleyin ve koruyun.

Sıkı mod örneği (özel/dahili hedefleri varsayılan olarak engelle):
__OC_I18N_900015__
## Sorun giderme

Linux'e özgü sorunlar için (özellikle snap Chromium), bkz.
[Browser sorun giderme](/tools/browser-linux-troubleshooting).

WSL2 Gateway + Windows Chrome bölünmüş ana makine kurulumları için bkz.
[WSL2 + Windows + remote Chrome CDP sorun giderme](/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Ajan araçları + denetimin nasıl çalıştığı

Ajan, browser otomasyonu için **tek bir araç** alır:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Eşlemenin nasıl yapıldığı:

- `browser snapshot`, kararlı bir UI ağacı döndürür (AI veya ARIA).
- `browser act`, tıklama/yazma/sürükleme/seçme işlemleri için anlık görüntü `ref` kimliklerini kullanır.
- `browser screenshot`, piksel yakalar (tam sayfa veya öğe).
- `browser` şunları kabul eder:
  - Adlandırılmış browser profilini seçmek için `profile` (openclaw, chrome veya uzak CDP).
  - Browser'ın nerede yaşadığını seçmek için `target` (`sandbox` | `host` | `node`).
  - Sandbox'lı oturumlarda `target: "host"` için `agents.defaults.sandbox.browser.allowHostControl=true` gerekir.
  - `target` atlanırsa: sandbox'lı oturumlar varsayılan olarak `sandbox`, sandbox'sız oturumlar varsayılan olarak `host` kullanır.
  - Browser yetenekli bir node bağlıysa, `target="host"` veya `target="node"` ile sabitlemediğiniz sürece araç otomatik olarak ona yönlenebilir.

Bu, ajanı deterministik tutar ve kırılgan seçicilerden kaçınır.

## İlgili

- [Araçlara Genel Bakış](/tr/tools) — tüm kullanılabilir ajan araçları
- [Sandboxing](/tr/gateway/sandboxing) — sandbox ortamlarında browser denetimi
- [Güvenlik](/tr/gateway/security) — browser denetimi riskleri ve sıkılaştırma
