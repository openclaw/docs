---
read_when:
    - Temsilci denetimli tarayıcı otomasyonu ekleme
    - OpenClaw'un neden kendi Chrome'unuza müdahale ettiğini hata ayıklama
    - macOS uygulamasında tarayıcı ayarlarını ve yaşam döngüsünü uygulama
summary: Entegre tarayıcı kontrol hizmeti + eylem komutları
title: Tarayıcı (OpenClaw tarafından yönetilen)
x-i18n:
    generated_at: "2026-07-16T17:47:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw, aracının kontrol ettiği **özel bir Chrome/Brave/Edge/Chromium profili** çalıştırabilir. Bu profil, Gateway içindeki küçük bir yerel kontrol hizmeti (yalnızca geri döngü) üzerinden çalışır ve kişisel tarayıcınızdan yalıtılmıştır.

- Bunu **ayrı, yalnızca aracıya özel bir tarayıcı** olarak düşünün. `openclaw` profili kişisel tarayıcı profilinize asla dokunmaz.
- Aracı, bu yalıtılmış ortamda sekmeler açar, sayfaları okur, tıklar ve metin yazar.
- Yerleşik `user` profili ise Chrome DevTools MCP aracılığıyla gerçek, oturum açılmış Chrome oturumunuza bağlanır.

## Neler sunulur?

- **openclaw** adlı ayrı bir tarayıcı profili (varsayılan olarak turuncu vurgu rengiyle).
- Belirlenimci sekme denetimi (listeleme/açma/odaklama/kapatma).
- Aracı eylemleri (tıklama/yazma/sürükleme/seçme), anlık görüntüler, ekran görüntüleri, PDF'ler.
- Playwright destekli profiller, doğrudan ek gezinmelerini yönetilen indirmeler dizinine kaydeder ve nihai URL ilkesi doğrulamasından sonra `{ url, suggestedFilename, path }` meta verilerini döndürür.
- Playwright destekli aracı eylemleri, eylem bir veya daha fazla indirmeyi hemen başlattığında aynı yönetilen meta verileri içeren bir `downloads` dizisi döndürür.
- Tarayıcı plugini etkinleştirildiğinde aracılara anlık görüntü,
  kararlı sekme, eski referans ve manuel engelleyiciden kurtarma döngüsünü öğreten,
  paketle birlikte gelen bir `browser-automation` Skills.
- İsteğe bağlı çoklu profil desteği (`openclaw`, `work`, `remote`, ...).

Bu tarayıcı, günlük kullandığınız tarayıcı **değildir**. Aracı otomasyonu ve
doğrulaması için güvenli ve yalıtılmış bir yüzeydir.

macOS'te çerezleri Chrome ailesinden bir sistem profilinden ayrı bir yönetilen profile açıkça kopyalayabilirsiniz. Yönetilen tarayıcı yine kendi kullanıcı verileri dizinini kullanır; yalnızca seçilen çerezler kopyalanır, yerel depolama ve IndexedDB ise geride kalır. İçe aktarma komutları ve sınırlamalar için [Profiller](#profiles-multi-browser) veya [`openclaw browser` CLI başvurusu](/tr/cli/browser) bölümüne bakın.

## Hızlı başlangıç

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

"Tarayıcı devre dışı", pluginin veya `browser.enabled` seçeneğinin kapalı olduğu anlamına gelir;
[Yapılandırma](#configuration) ve [Plugin denetimi](#plugin-control) bölümlerine bakın.

`openclaw browser` tamamen eksikse veya aracı tarayıcı aracının
kullanılamadığını söylüyorsa [Eksik tarayıcı komutu veya aracı](#missing-browser-command-or-tool) bölümüne geçin.

## Plugin denetimi

Varsayılan `browser` aracı, paketle birlikte gelen bir plugindir. Aynı `browser` araç adını kaydeden başka bir pluginle değiştirmek için devre dışı bırakın:

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

Varsayılanlar hem `plugins.entries.browser.enabled` **hem de** `browser.enabled=true` gerektirir. Yalnızca plugini devre dışı bırakmak; `openclaw browser` CLI'ını, `browser.request` Gateway yöntemini, aracı aracını ve kontrol hizmetini tek bir birim olarak kaldırır. `browser.*` yapılandırmanız, yerine geçecek plugin için olduğu gibi kalır.

Tarayıcı yapılandırması değişiklikleri, pluginin hizmetini yeniden kaydedebilmesi için Gateway'in yeniden başlatılmasını gerektirir.

## Aracı rehberi

Araç profili notu: `tools.profile: "coding"`, `web_search` ve
`web_fetch` öğelerini içerir ancak `browser` aracının tamamını içermez. Aracının veya
oluşturulan bir alt aracının tarayıcı otomasyonunu kullanmasına izin vermek için profil
aşamasında browser ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Tek bir aracı için `agents.list[].tools.alsoAllow: ["browser"]` kullanın.
Alt aracı ilkesi profil filtrelemesinden sonra uygulandığından
`tools.subagents.tools.allow: ["browser"]` tek başına yeterli değildir.

Tarayıcı plugini, aracı rehberliğini iki düzeyde sunar:

- `browser` araç açıklaması, her zaman etkin olan kısa sözleşmeyi içerir: doğru
  profili seçin, referansları aynı sekmede tutun, sekme hedefleme için `tabId`/etiketleri
  kullanın ve çok adımlı işler için tarayıcı Skills'ini yükleyin.
- Paketle birlikte gelen `browser-automation` Skills'i daha uzun çalışma döngüsünü içerir:
  önce durumu/sekmeleri kontrol edin, görev sekmelerini etiketleyin, işlem yapmadan önce anlık görüntü alın, kullanıcı arayüzü
  değişikliklerinden sonra yeniden anlık görüntü alın, eski referansları bir kez kurtarmayı deneyin ve giriş/2FA/captcha veya
  kamera/mikrofon engelleyicilerini tahmin yürütmek yerine manuel eylem olarak bildirin.

Pluginle birlikte gelen Skills, plugin etkinleştirildiğinde aracının kullanılabilir
Skills listesinde yer alır. Tam Skills talimatları isteğe bağlı olarak yüklenir; böylece rutin
işlemler tam token maliyetine katlanmaz.

## Eksik tarayıcı komutu veya aracı

Bir yükseltmeden sonra `openclaw browser` bilinmiyorsa, `browser.request` eksikse veya aracı tarayıcı aracının kullanılamadığını bildiriyorsa bunun olağan nedeni `browser` içermeyen bir `plugins.allow` listesi ve kökte `browser` yapılandırma bloğunun bulunmamasıdır. Şunu ekleyin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Açık bir kök `browser` bloğu (`browser` altındaki herhangi bir anahtar; örneğin
`browser.enabled=true` veya `browser.profiles.<name>`), paketle birlikte gelen kanal
yapılandırması davranışıyla uyumlu biçimde, kısıtlayıcı bir `plugins.allow` altında bile paketle birlikte gelen
tarayıcı pluginini etkinleştirir. `plugins.entries.browser.enabled=true` ve
`tools.alsoAllow: ["browser"]`, tek başlarına izin listesi üyeliğinin
yerini tutmaz. `plugins.allow` öğesini tamamen kaldırmak da varsayılanı geri yükler.

## Profiller: `openclaw`, `user`, `chrome`

- `openclaw`: yönetilen, yalıtılmış tarayıcı (uzantı gerekmez).
- `user`: **gerçek, oturum açılmış Chrome** oturumunuz için yerleşik Chrome DevTools MCP bağlantı profili. OpenClaw ilk kez bağlandığında Chrome engelleyici bir "Allow remote debugging?"
  istemi gösterir; bu nedenle bilgisayarın başında birinin bulunması gerekir.
- `chrome`: **gerçek, oturum açılmış Chrome** oturumunuz için yerleşik [Chrome uzantısı](/tr/tools/chrome-extension) profili.
  Sekmeleri uzaktan hata ayıklama bağlantı noktası yerine OpenClaw tarayıcı uzantısı üzerinden yönettiğinden, masada kimse olmasa bile
  telefondan çalışır; dolayısıyla "Allow remote debugging?" istemi gösterilmez.

Aracı tarayıcı aracı çağrıları için:

- Varsayılan: yalıtılmış `openclaw` tarayıcısını kullanın.
- Mevcut oturum açma oturumları önemliyse ve kullanıcı **bilgisayardan uzaktaysa**
  (Telegram, WhatsApp vb.) `profile="chrome"` (uzantı) tercih edin.
- Mevcut oturum açma oturumları önemliyse ve kullanıcı bağlantı istemini onaylamak üzere
  **bilgisayarın başındaysa** `profile="user"` (Chrome MCP) tercih edin.
- Belirli bir tarayıcı modu istediğinizde `profile` açık geçersiz kılma seçeneğidir.

Yönetilen modun varsayılan olmasını istiyorsanız `browser.defaultProfile: "openclaw"` değerini ayarlayın.

## Yapılandırma

Tarayıcı ayarları `~/.openclaw/openclaw.json` içinde bulunur.

```json5
{
  browser: {
    enabled: true, // varsayılan: true
    evaluateEnabled: true, // varsayılan: true; false, act:evaluate'i (rastgele JS) devre dışı bırakır
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // yalnızca güvenilir özel ağ erişimi için etkinleştirin
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // eski tek profilli geçersiz kılma
    remoteCdpTimeoutMs: 1500, // uzak CDP HTTP zaman aşımı (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // uzak CDP WebSocket el sıkışma zaman aşımı (ms)
    localLaunchTimeoutMs: 15000, // yerel yönetilen Chrome keşif zaman aşımı (ms)
    localCdpReadyTimeoutMs: 8000, // yerel yönetilen, başlatma sonrası CDP hazır olma zaman aşımı (ms)
    actionTimeoutMs: 60000, // varsayılan tarayıcı eylemi zaman aşımı (ms)
    tabCleanup: {
      enabled: true, // varsayılan: true
      idleMinutes: 120, // boşta kalanları temizlemeyi devre dışı bırakmak için 0 olarak ayarlayın
      maxTabsPerSession: 8, // oturum başına sınırı devre dışı bırakmak için 0 olarak ayarlayın
      sweepMinutes: 5,
    },
    // snapshotDefaults: { mode: "efficient" }, // çağıran belirtmediğinde varsayılan anlık görüntü modu
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

`browser.snapshotDefaults.mode: "efficient"`, çağıran açık bir `snapshotFormat` veya
`mode` iletmediğinde varsayılan `snapshot`
çıkarma modunu değiştirir; çağrı başına anlık görüntü seçenekleri için [Tarayıcı denetim API'si](/tr/tools/browser-control) bölümüne bakın.

### Ekran görüntüsü görsel algısı (yalnızca metin destekli model)

Ana model yalnızca metin destekliyse (görsel algı/çok modlu destek yoksa) tarayıcı
ekran görüntüleri, modelin okuyamayacağı görüntü blokları döndürür. Tarayıcı ekran görüntüleri
mevcut görüntü anlama yapılandırmasını yeniden kullanır; böylece medya anlama için
yapılandırılmış bir görüntü modeli, tarayıcıya özgü model ayarları olmadan ekran görüntülerini
metin olarak açıklayabilir.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Yedek adaylar ekleyin; ilk başarı kazanır
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Paylaşılan medya modelleri, görüntü desteği için etiketlendiğinde de çalışır.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Mevcut görüntü modeli varsayılanları da dikkate alınır.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Nasıl çalışır:**

1. Aracı `browser screenshot` çağrısını yapar ve görüntü her zamanki gibi diske kaydedilir.
2. Tarayıcı aracı, mevcut görüntü anlama çalışma zamanına yapılandırılmış medya görüntü modellerini, paylaşılan medya
   modellerini, görüntü modeli varsayılanlarını veya kimlik doğrulama destekli bir görüntü sağlayıcısını kullanarak ekran görüntüsünü
   açıklayıp açıklayamayacağını sorar.
3. Görsel algı modeli, `wrapExternalContent` (istem enjeksiyonu koruması) ile sarmalanan ve aracıya
   görüntü bloğu yerine metin bloğu olarak döndürülen bir metin açıklaması üretir.
4. Görüntü anlama kullanılamıyorsa, atlanırsa veya başarısız olursa tarayıcı
   özgün görüntü bloğunu döndürmeye geri döner.

Ekran görüntüsü blokları özel araç sonuçlarıdır: aracı bunları inceleyebilir,
ancak OpenClaw bunları kanal yanıtlarına otomatik olarak eklemez. Bir ekran görüntüsünü
paylaşmak için aracıdan bunu mesaj aracıyla açıkça göndermesini isteyin.

Model yedekleri, zaman aşımları, bayt sınırları, profiller ve sağlayıcı isteği ayarları için
mevcut `tools.media.image` / `tools.media.models` alanlarını kullanın.

Etkin ana model zaten görsel algıyı destekliyorsa ve açık bir görüntü anlama
modeli yapılandırılmamışsa OpenClaw, ana modelin ekran görüntüsünü doğrudan okuyabilmesi için
normal görüntü sonucunu korur.

<AccordionGroup>

<Accordion title="Bağlantı noktaları ve erişilebilirlik">

- Denetim hizmeti, `gateway.port` değerinden türetilen bir bağlantı noktasında geri döngü adresine bağlanır (varsayılan `18791` = gateway + 2). `OPENCLAW_GATEWAY_PORT`, `gateway.port` değerine göre önceliklidir; ikisi de aynı ailedeki türetilmiş bağlantı noktalarını kaydırır.
- Yerel `openclaw` profilleri, denetim bağlantı noktasının 9 bağlantı noktası üstünden başlayan bir aralıktan `cdpPort`/`cdpUrl` değerlerini otomatik olarak atar (varsayılan `18800`-`18899`); bunları yalnızca
  uzak CDP profilleri veya mevcut oturum uç noktasına bağlanma için ayarlayın. `cdpUrl`, ayarlanmadığında
  yönetilen yerel CDP bağlantı noktasını varsayılan olarak kullanır.
- `remoteCdpTimeoutMs`, uzak ve `attachOnly` CDP HTTP erişilebilirlik
  denetimleri ile sekme açan HTTP istekleri için geçerlidir; `remoteCdpHandshakeTimeoutMs` ise
  bunların CDP WebSocket el sıkışmaları için geçerlidir. Kalıcı uzak Playwright sekme listeleme işlemi,
  işlem son tarihi olarak bu iki değerden büyük olanı kullanır.
- `localLaunchTimeoutMs`, yerel olarak başlatılan yönetilen bir Chrome
  işleminin CDP HTTP uç noktasını kullanıma sunması için ayrılan süredir. `localCdpReadyTimeoutMs`,
  işlem keşfedildikten sonra CDP websocket'in hazır olması için ayrılan ek süredir.
  Chromium'un yavaş başladığı Raspberry Pi, düşük seviye VPS veya eski donanımlarda
  bu değerleri artırın. Değerler `120000` ms'ye kadar pozitif tam sayılar olmalıdır; geçersiz
  yapılandırma değerleri reddedilir.
- Yönetilen Chrome'un tekrarlanan başlatma/hazır olma hataları, profil başına
  devre kesiciyle sınırlandırılır. Art arda birkaç hatadan sonra OpenClaw, her tarayıcı aracı çağrısında
  Chromium başlatmak yerine yeni başlatma denemelerini kısa süreliğine duraklatır. Başlatma
  sorununu giderin, tarayıcı gerekmiyorsa devre dışı bırakın veya onarımdan sonra
  Gateway'i yeniden başlatın.
- `actionTimeoutMs`, çağıran `timeoutMs` değerini iletmediğinde tarayıcı `act` istekleri için varsayılan süredir. İstemci aktarımı, uzun beklemelerin HTTP sınırında zaman aşımına uğramak yerine tamamlanabilmesi için küçük bir ek tolerans süresi ekler.
- `tabCleanup`, birincil ajan tarayıcı oturumlarının açtığı sekmeler için en iyi çabayla temizlik sağlar. Alt ajan, cron ve ACP yaşam döngüsü temizliği, açıkça izlenen sekmelerini oturum sonunda kapatmaya devam eder; birincil oturumlar etkin sekmeleri yeniden kullanılabilir durumda tutar, ardından boşta kalan veya fazla izlenen sekmeleri arka planda kapatır.

</Accordion>

<Accordion title="SSRF politikası">

- Tarayıcıda gezinme ve sekme açma istekleri ön denetimden geçirilir. Eylem sırasında ve eylem sonrası sınırlı ek süre boyunca korumalı Playwright etkileşimleri (tıklama, koordinata tıklama, üzerine gelme, sürükleme, kaydırma, seçme, tuşa basma, yazma, form doldurma ve değerlendirme), politika tarafından reddedilen üst düzey ve alt çerçeve belge yüklemelerini HTTP istek baytları gönderilmeden önce engeller, ardından nihai `http(s)` URL'sini en iyi çabayla yeniden denetler.
- OpenClaw tarafından yönetilen her yeni Chrome başlatmasından önce OpenClaw, ağ tahminini en iyi çabayla devre dışı bırakarak Chromium'un bu reddedilen yüklemeler için gözlemlenen spekülatif ön bağlantılarını engeller. Bu, derinlemesine savunmadır; bir politika sınırı değildir: denetim hizmeti yeniden başlatıldıktan sonra yeniden kullanılan bir tarayıcı ve diğer tarayıcı arka uçları bu sağlamlaştırmayı paylaşmayabilir. Playwright yönlendirmesi yine de bir ağ güvenlik duvarı değildir ve yönlendirme atlamalarını, açılır pencerenin ilk isteğini, Service Worker trafiğini, sınırlı koruma penceresinden sonra çalışan sayfa kodunu veya tüm arka plan/alt kaynak yollarını engellemez. Eksiksiz çıkış yalıtımı, sahip tarafında yalıtım veya politika uygulayan bir proxy gerektirir.
- Katı SSRF modunda, uzak CDP uç noktası keşfi ve `/json/version` yoklamaları (`cdpUrl`) da denetlenir.
- Gateway/sağlayıcı `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve `NO_PROXY` ortam değişkenleri, OpenClaw tarafından yönetilen tarayıcıyı otomatik olarak proxy üzerinden yönlendirmez. Sağlayıcı proxy ayarlarının tarayıcı SSRF denetimlerini zayıflatmaması için yönetilen Chrome varsayılan olarak doğrudan başlatılır.
- OpenClaw tarafından yönetilen yerel CDP hazır olma yoklamaları ve DevTools WebSocket bağlantıları, tam olarak başlatılan geri döngü uç noktası için yönetilen ağ proxy'sini atlar; böylece operatör proxy'si geri döngü çıkışını engellediğinde de `openclaw browser start` çalışır.
- Yönetilen tarayıcının kendisini proxy üzerinden yönlendirmek için `browser.extraArgs` aracılığıyla `--proxy-server=...` veya `--proxy-pac-url=...` gibi açık Chrome proxy bayrakları iletin. Katı SSRF modu, özel ağ tarayıcı erişimi bilinçli olarak etkinleştirilmediği sürece açık tarayıcı proxy yönlendirmesini engeller.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` varsayılan olarak kapalıdır; yalnızca özel ağ tarayıcı erişimine bilinçli olarak güvenildiğinde etkinleştirin.
- `browser.ssrfPolicy.allowPrivateNetwork`, eski bir diğer ad olarak desteklenmeye devam eder.

</Accordion>

<Accordion title="Profil davranışı">

- `attachOnly: true`, hiçbir zaman yerel tarayıcı başlatılmaması; yalnızca zaten çalışan bir tarayıcı varsa ona bağlanılması anlamına gelir.
- `headless`, genel olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.headless` değerini geçersiz kılar; böylece yerel olarak başlatılan bir profil başsız kalırken diğeri görünür kalabilir.
- `POST /start?headless=true` ve `openclaw browser start --headless`,
  `browser.headless` veya profil yapılandırmasını yeniden yazmadan yerel yönetilen profiller için
  tek seferlik başsız başlatma ister. Mevcut oturum, yalnızca bağlanma ve
  uzak CDP profilleri bu geçersiz kılmayı reddeder; çünkü OpenClaw bu
  tarayıcı işlemlerini başlatmaz.
- `DISPLAY` veya `WAYLAND_DISPLAY` bulunmayan Linux ana makinelerinde, ortam ya da profil/genel
  yapılandırma açıkça görünür modu seçmediğinde yerel yönetilen profiller
  otomatik olarak varsayılan başsız moda geçer. Belirsizliği olmayan tarayıcı düzeyi biçimi
  `openclaw browser --json status` kullanın; sondaki `openclaw browser status --json` da
  çalışır, çünkü `status` kendi `--json` değerini tanımlamaz. Komut,
  `headlessSource` değerini `env`, `profile`, `config`,
  `request`, `linux-display-fallback` veya `default` olarak bildirir.
- `OPENCLAW_BROWSER_HEADLESS=1`, geçerli işlem için yerel yönetilen başlatmaları
  başsız moda zorlar. `OPENCLAW_BROWSER_HEADLESS=0`, normal başlatmalar için görünür modu
  zorlar ve görüntü sunucusu bulunmayan Linux ana makinelerinde uygulanabilir bir hata döndürür;
  açık bir `start --headless` isteği, söz konusu tek başlatma için yine önceliklidir.
- Tarayıcı denetim rotası ve programatik istemci, görüntü bulunmaması hatasının
  insan tarafından okunabilir `error` değerini korur ve kararlı
  `no_display_for_headed_profile` nedenini kullanıma sunar. Bunun `details` alanları yalnızca `profile`,
  `requestedHeadless`, `headlessSource` ve `displayPresent` değerlerini içerir; böylece API istemcileri
  ileti metnini eşleştirmeden doğru çözümü seçebilir.
- Çalışan bir yerel yönetilen profil için durum ve doctor, işleyici, arka uç, cihaz/sürücü, özellik
  durumu, sürücü geçici çözümleri ve hızlandırılmış video yeteneklerini öğrenmek üzere Chrome'un
  tarayıcı düzeyi CDP uç noktasını sorgular. Sonuç, ilgili tarayıcı işlemi için
  önbelleğe alınır ve `openclaw browser --json status` tarafından eksiksiz olarak sunulur.
  Pasif bir durum çağrısı Chrome'u başlatmaz.
  Mevcut oturum, uzantı, uzak CDP ve korumalı alan tarayıcıları ayrı kalır
  ve bu yönetilen ana makine yolu üzerinden incelenmez.
- Başsız yönetilen Chrome yine de ölçülü `--disable-gpu` varsayılanını kullanır.
  Tanılama hızlandırmayı etkinleştirmez, genel bir hızlandırma ayarı eklemez
  veya korumalı alan tarayıcısına cihaz erişimi vermez.
- `executablePath`, genel olarak veya yerel yönetilen profil başına ayarlanabilir. Profil başına değerler `browser.executablePath` değerini geçersiz kılar; böylece farklı yönetilen profiller, Chromium tabanlı farklı tarayıcılar başlatabilir. Her iki biçim de işletim sistemi ana dizininiz için `~` değerini kabul eder.
- `color` (üst düzey ve profil başına), hangi profilin etkin olduğunu görebilmeniz için tarayıcı kullanıcı arayüzünü renklendirir.
- Varsayılan profil `openclaw` değeridir (yönetilen bağımsız). Oturum açılmış kullanıcı tarayıcısını tercih etmek için `defaultProfile: "user"` kullanın.
- Otomatik algılama sırası: Chromium tabanlıysa sistemin varsayılan tarayıcısı; aksi takdirde Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"`, ham CDP yerine Chrome DevTools MCP kullanır. Chrome MCP otomatik bağlantısı üzerinden veya çalışan tarayıcı için zaten bir DevTools uç noktanız varsa `cdpUrl` üzerinden bağlanabilir.
- `driver: "extension"`, oturum açtığınız Chrome'u [OpenClaw Chrome uzantısı](/tr/tools/chrome-extension) üzerinden yönetir. Aktarıcı kendi geri döngü uç noktasına sahip olduğundan bu profiller `cdpUrl` değerini kabul etmez. Bu, bilgisayarın başında kimse yokken çalışan tek oturum açılmış tarayıcı modudur.
- Mevcut oturum profilinin varsayılan olmayan bir Chromium kullanıcı profiline (Brave, Edge vb.) bağlanması gerektiğinde `browser.profiles.<name>.userDataDir` değerini ayarlayın. Bu yol, işletim sistemi ana dizininiz için `~` değerini de kabul eder.

</Accordion>

</AccordionGroup>

## Brave veya Chromium tabanlı başka bir tarayıcı kullanma

**Sistem varsayılanı** tarayıcınız Chromium tabanlıysa (Chrome/Brave/Edge/vb.),
OpenClaw bunu otomatik olarak kullanır. Otomatik algılamayı geçersiz kılmak için
`browser.executablePath` değerini ayarlayın. Üst düzey ve profil başına `executablePath` değerleri,
işletim sistemi ana dizininiz için `~` değerini kabul eder:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Alternatif olarak platforma göre yapılandırmada ayarlayın:

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

Profil başına `executablePath`, yalnızca OpenClaw'un başlattığı yerel yönetilen
profilleri etkiler. `existing-session` profilleri bunun yerine zaten çalışan bir tarayıcıya
bağlanır ve uzak CDP profilleri `cdpUrl` arkasındaki tarayıcıyı kullanır.

## Yerel ve uzak denetim

- **Yerel denetim (varsayılan):** Gateway, geri döngü denetim hizmetini başlatır ve yerel bir tarayıcı başlatabilir.
- **Uzak denetim (node ana makinesi):** tarayıcının bulunduğu makinede bir node ana makinesi çalıştırın; Gateway, tarayıcı eylemlerini ona proxy üzerinden iletir.
- **Uzak CDP:** uzak Chromium tabanlı bir tarayıcıya
  bağlanmak için `browser.profiles.<name>.cdpUrl` (veya `browser.cdpUrl`) değerini ayarlayın. Bu durumda OpenClaw yerel bir tarayıcı başlatmaz.
- Geri döngüde harici olarak yönetilen CDP hizmetleri (örneğin Docker'da
  `127.0.0.1` adresinde yayımlanan Browserless) için `attachOnly: true` değerini de ayarlayın. `attachOnly` olmadan geri döngü CDP,
  OpenClaw tarafından yönetilen yerel bir tarayıcı profili olarak değerlendirilir.
- `headless`, yalnızca OpenClaw'un başlattığı yerel yönetilen profilleri etkiler. Mevcut oturum veya uzak CDP tarayıcılarını yeniden başlatmaz ya da değiştirmez.
- `executablePath` aynı yerel yönetilen profil kuralını izler. Çalışan bir
  yerel yönetilen profilde bu değerin değiştirilmesi, profili yeniden başlatma/uzlaştırma için işaretler;
  böylece sonraki başlatma yeni ikili dosyayı kullanır.

Durdurma davranışı profil moduna göre farklılık gösterir:

- yerel yönetilen profiller: `openclaw browser stop`, OpenClaw'un
  başlattığı tarayıcı işlemini durdurur
- yalnızca bağlanma ve uzak CDP profilleri: `openclaw browser stop`, etkin
  denetim oturumunu kapatır ve OpenClaw tarafından hiçbir tarayıcı işlemi
  başlatılmamış olsa da Playwright/CDP öykünme geçersiz kılmalarını (görüntü alanı,
  renk şeması, yerel ayar, saat dilimi, çevrimdışı mod ve benzer durumlar) serbest bırakır

Uzak CDP URL'leri kimlik doğrulama bilgileri içerebilir:

- Sorgu belirteçleri (ör. `https://provider.example?token=<token>`)
- HTTP Basic kimlik doğrulaması (ör. `https://user:pass@provider.example`)

OpenClaw, `/json/*` uç noktalarını çağırırken ve CDP WebSocket'e bağlanırken
kimlik doğrulama bilgilerini korur. Belirteçleri yapılandırma dosyalarına kaydetmek yerine
ortam değişkenlerini veya gizli bilgi yöneticilerini tercih edin.

## Node tarayıcı proxy'si (sıfır yapılandırmalı varsayılan)

Tarayıcınızın bulunduğu makinede bir **node ana bilgisayarı** çalıştırırsanız OpenClaw,
tarayıcı aracı çağrılarını ek bir tarayıcı yapılandırması olmadan otomatik olarak bu node'a yönlendirebilir.
Bu, uzak gateway'ler için varsayılan yoldur.

Notlar:

- Node ana bilgisayarı, yerel tarayıcı denetim sunucusunu bir **proxy komutu** aracılığıyla kullanıma sunar.
- Profiller, node'un kendi `browser.profiles` yapılandırmasından gelir (yerel yapılandırmayla aynıdır).
- Proxy komutu, `allowProfiles` değerinden bağımsız olarak kalıcı profil değişikliklerine (`create-profile`, `delete-profile`, `reset-profile`) hiçbir zaman izin vermez; bu değişiklikleri doğrudan node üzerinde yapın.
- `nodeHost.browserProxy.allowProfiles` isteğe bağlıdır. Eski/varsayılan davranış için boş bırakın: yapılandırılmış tüm profillere proxy üzerinden erişilmeye devam edilir.
- `nodeHost.browserProxy.allowProfiles` değerini ayarlarsanız OpenClaw bunu, proxy'nin hedefleyebileceği profil adlarını sınırlayan en az ayrıcalık sınırı olarak değerlendirir.
- Kullanmak istemiyorsanız devre dışı bırakın:
  - Node üzerinde: `nodeHost.browserProxy.enabled=false`
  - Gateway üzerinde: `gateway.nodes.browser.mode="off"` (ayrıca bağlı tek bir tarayıcı node'u seçmek için `"auto"` veya açık bir node parametresini zorunlu kılmak için `"manual"` kabul eder)

## Browserless (barındırılan uzak CDP)

[Browserless](https://browserless.io), HTTPS ve WebSocket üzerinden
CDP bağlantı URL'leri sunan, barındırılan bir Chromium hizmetidir. OpenClaw her iki biçimi de kullanabilir ancak
uzak bir tarayıcı profili için en basit seçenek, Browserless bağlantı belgelerindeki
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
- Browserless size bir HTTPS temel URL'si verirse doğrudan CDP bağlantısı için bunu
  `wss://` biçimine dönüştürebilir veya HTTPS URL'sini koruyup OpenClaw'ın
  `/json/version` öğesini keşfetmesini sağlayabilirsiniz.

### Aynı ana bilgisayarda Browserless Docker

Browserless Docker'da kendi kendine barındırılıyor ve OpenClaw ana bilgisayarda çalışıyorsa
Browserless'ı haricî olarak yönetilen bir CDP hizmeti olarak değerlendirin:

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

`browser.profiles.browserless.cdpUrl` içindeki adrese
OpenClaw işlemi tarafından erişilebilmelidir. Browserless ayrıca eşleşen ve erişilebilir bir uç nokta duyurmalıdır;
Browserless `EXTERNAL` değerini `ws://127.0.0.1:3000`, `ws://browserless:3000` veya kararlı bir özel Docker
ağ adresi gibi, genel ağdan OpenClaw'a erişilebilen aynı WebSocket temel adresine ayarlayın.
`/json/version`, OpenClaw'ın erişemediği bir adresi gösteren `webSocketDebuggerUrl` döndürürse
CDP HTTP sağlıklı görünebilir ancak WebSocket
bağlantısı yine de başarısız olur.

Geri döngü Browserless profili için `attachOnly` değerini ayarlamadan bırakmayın.
`attachOnly` olmadan OpenClaw, geri döngü portunu yerel olarak yönetilen bir tarayıcı
profili olarak değerlendirir ve portun kullanımda olduğunu ancak OpenClaw'a ait olmadığını bildirebilir.

## Doğrudan WebSocket CDP sağlayıcıları

Bazı barındırılan tarayıcı hizmetleri, standart HTTP tabanlı CDP keşfi (`/json/version`) yerine
**doğrudan WebSocket** uç noktası sunar. OpenClaw üç
CDP URL biçimini kabul eder ve doğru bağlantı stratejisini otomatik olarak seçer:

- **HTTP(S) keşfi** - `http://host[:port]` veya `https://host[:port]`.
  OpenClaw, WebSocket hata ayıklayıcı URL'sini keşfetmek için `/json/version` çağrısını yapar ve ardından
  bağlanır. WebSocket geri dönüşü yoktur.
- **Doğrudan WebSocket uç noktaları** - `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  yoluna sahip `ws://host[:port]/devtools/<kind>/<id>` veya
  `wss://...`. OpenClaw doğrudan WebSocket el sıkışması aracılığıyla bağlanır ve
  `/json/version` öğesini tamamen atlar.
- **Çıplak WebSocket kökleri** - `/devtools/...` yolu olmayan
  `ws://host[:port]` veya `wss://host[:port]` (ör. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw önce HTTP
  `/json/version` keşfini dener (şemayı `http`/`https` biçimine normalleştirerek);
  keşif bir `webSocketDebuggerUrl` döndürürse bu kullanılır, aksi hâlde OpenClaw
  çıplak kökte doğrudan WebSocket el sıkışmasına geri döner. Duyurulan
  WebSocket uç noktası CDP el sıkışmasını reddeder ancak yapılandırılan çıplak kök
  kabul ederse OpenClaw yine bu köke geri döner. Böylece yerel bir Chrome'a yönlendirilen çıplak `ws://`
  bağlantı kurmaya devam edebilir; çünkü Chrome, WebSocket yükseltmelerini yalnızca
  `/json/version` tarafından sağlanan hedefe özgü yolda kabul eder. Barındırılan
  sağlayıcılar ise keşif uç noktaları Playwright CDP için uygun olmayan
  kısa ömürlü bir URL duyurduğunda kök WebSocket uç noktalarını kullanmaya devam edebilir.

`openclaw browser doctor`, çalışma zamanı bağlantısıyla aynı önce keşif, ardından WebSocket'e geri dönüş
mantığını kullanır; dolayısıyla başarıyla bağlanan çıplak kök URL'si
tanılama tarafından erişilemez olarak bildirilmez.

### Browserbase

[Browserbase](https://www.browserbase.com), yerleşik CAPTCHA çözümü, gizli mod ve konut tipi
proxy'lerle başsız tarayıcılar çalıştırmaya yönelik bir bulut platformudur.

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

- [Kaydolun](https://www.browserbase.com/sign-up) ve [Overview dashboard](https://www.browserbase.com/overview) üzerinden **API Key**
  değerinizi kopyalayın.
- `<BROWSERBASE_API_KEY>` değerini gerçek Browserbase API anahtarınızla değiştirin.
- Browserbase, WebSocket bağlantısında otomatik olarak bir tarayıcı oturumu oluşturur; bu nedenle
  elle oturum oluşturma adımı gerekmez.
- Güncel ücretsiz katman sınırları ve ücretli planlar için [fiyatlandırmaya](https://www.browserbase.com/pricing) bakın.
- Tam API
  referansı, SDK kılavuzları ve entegrasyon örnekleri için [Browserbase belgelerine](https://docs.browserbase.com) bakın.

### Notte

[Notte](https://www.notte.cc), yerleşik gizlilik özellikleri, konut tipi proxy'ler ve CDP'ye özgü
WebSocket gateway'i ile başsız
tarayıcılar çalıştırmaya yönelik bir bulut platformudur.

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

- [Kaydolun](https://console.notte.cc) ve konsol ayarları sayfasından **API Key** değerinizi
  kopyalayın.
- `<NOTTE_API_KEY>` değerini gerçek Notte API anahtarınızla değiştirin.
- Notte, WebSocket bağlantısında otomatik olarak bir tarayıcı oturumu oluşturur; bu nedenle elle
  oturum oluşturma adımı gerekmez. WebSocket bağlantısı kesildiğinde
  oturum yok edilir.
- Güncel ücretsiz katman sınırları ve ücretli planlar için [fiyatlandırmaya](https://www.notte.cc/#pricing) bakın.
- Tam API referansı, SDK
  kılavuzları ve entegrasyon örnekleri için [Notte belgelerine](https://docs.notte.cc) bakın.

## Güvenlik

Temel noktalar:

- Tarayıcı denetimi yalnızca geri döngü üzerinden kullanılabilir; erişim, Gateway kimlik doğrulaması veya node eşleştirmesi üzerinden sağlanır.
- Bağımsız geri döngü tarayıcı HTTP API'si **yalnızca paylaşılan gizli anahtar kimlik doğrulamasını** kullanır:
  gateway token bearer kimlik doğrulaması, `x-openclaw-password` veya
  yapılandırılmış gateway parolasıyla HTTP Basic kimlik doğrulaması.
- Tailscale Serve kimlik başlıkları ve `gateway.auth.mode: "trusted-proxy"`,
  bu bağımsız geri döngü tarayıcı API'sinde kimlik doğrulaması
  **sağlamaz**.
- Tarayıcı denetimi etkinse ve paylaşılan gizli anahtar kimlik doğrulaması yapılandırılmamışsa OpenClaw,
  başlangıçta otomatik olarak bir tarayıcı denetim kimlik bilgisi oluşturur ve kalıcı hâle getirir:
  `gateway.auth.mode` değeri `none` olduğunda bir token, `trusted-proxy`
  olduğunda ise bir parola (`gateway.auth.password` aracılığıyla kalıcı hâle getirilir; böylece işlem dışı
  geri döngü istemcileri bunu çözümleyebilir). İlgili mod için açık bir
  dize kimlik bilgisi zaten yapılandırılmışsa veya
  `gateway.auth.mode` değeri `password` ise otomatik oluşturma atlanır.
- Oluşturulan değer yerine denetiminizde olan kararlı bir gizli anahtar istiyorsanız
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` veya
  `OPENCLAW_GATEWAY_PASSWORD` değerini açıkça yapılandırın.

Uzak CDP ipuçları:

- Mümkün olduğunda şifreli uç noktaları (HTTPS veya WSS) ve kısa ömürlü token'ları tercih edin.
- Uzun ömürlü token'ları doğrudan yapılandırma dosyalarına yerleştirmekten kaçının.
- Gateway'i ve tüm node ana bilgisayarlarını özel bir ağda (Tailscale) tutun; genel erişime açmaktan kaçının.
- Uzak CDP URL'lerini/token'larını gizli bilgiler olarak değerlendirin; ortam değişkenlerini veya bir gizli bilgi yöneticisini tercih edin.

## Profiller (çoklu tarayıcı)

OpenClaw birden fazla adlandırılmış profili (yönlendirme yapılandırmaları) destekler. Profiller şunlar olabilir:

- **OpenClaw tarafından yönetilen**: kendi kullanıcı verileri dizinine ve CDP portuna sahip, Chromium tabanlı özel bir tarayıcı örneği
- **uzak**: açık bir CDP URL'si (başka bir yerde çalışan Chromium tabanlı tarayıcı)
- **mevcut oturum**: Chrome DevTools MCP otomatik bağlantısı aracılığıyla mevcut Chrome profiliniz

Varsayılanlar:

- `openclaw` profili yoksa otomatik olarak oluşturulur.
- `user` profili, mevcut Chrome MCP oturumuna bağlantı için yerleşik olarak sunulur.
- Mevcut oturum profilleri, `user` dışında isteğe bağlıdır; bunları `--driver existing-session` ile oluşturun.
- Yerel CDP portları varsayılan olarak **18800-18899** aralığından tahsis edilir.
- Bir profil silindiğinde yerel veri dizini Çöp Kutusu'na taşınır.

Tüm denetim uç noktaları `?profile=<name>` kabul eder; CLI, `--browser-profile` kullanır.

## Chrome DevTools MCP aracılığıyla mevcut oturum

OpenClaw, resmî Chrome DevTools MCP sunucusu üzerinden çalışmakta olan Chromium tabanlı
bir tarayıcı profiline de bağlanabilir. Bu, söz konusu tarayıcı profilinde zaten açık olan
sekmeleri ve oturum açma durumunu yeniden kullanır.

Resmî arka plan ve kurulum kaynakları:

- [Chrome for Developers: Chrome DevTools MCP'yi tarayıcı oturumunuzla kullanma](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Yerleşik profil: `user`. Farklı bir ad, renk veya tarayıcı veri dizini
istiyorsanız kendi özel mevcut oturum profilinizi oluşturun.

Varsayılan olarak yerleşik `user` profili, varsayılan yerel Google Chrome profilini
hedefleyen Chrome MCP otomatik bağlantısını kullanır. Brave, Edge, Chromium veya varsayılan olmayan bir Chrome
profili için `userDataDir` kullanın. `~`, işletim sistemi ana dizininize
genişletilir:

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

1. Uzak hata ayıklama için bu tarayıcının inceleme sayfasını açın.
2. Uzak hata ayıklamayı etkinleştirin.
3. Tarayıcıyı çalışır durumda tutun ve OpenClaw bağlandığında bağlantı istemini onaylayın.

Yaygın inceleme sayfaları:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Canlı bağlantı duman testi:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Başarılı sonuç şu şekilde görünür:

- `status`, `driver: existing-session` öğesini gösterir
- `status`, `transport: chrome-mcp` öğesini gösterir
- `status`, `running: true` öğesini gösterir
- `tabs`, zaten açık olan tarayıcı sekmelerinizi listeler
- `snapshot`, seçilen canlı sekmeden referansları döndürür

Bağlanma çalışmazsa kontrol edilecekler:

- hedef Chromium tabanlı tarayıcının sürümü `144+`
- uzaktan hata ayıklama, ilgili tarayıcının inceleme sayfasında etkinleştirilmiş
- tarayıcı, bağlanma onayı istemini gösterdi ve bu istem kabul edildi
- Chrome açık bir `--remote-debugging-port` ile başlatıldıysa Chrome MCP otomatik bağlantısına güvenmek yerine
  `browser.profiles.<name>.cdpUrl` değerini bu DevTools uç noktası olarak ayarlayın
- `openclaw doctor`, eski uzantı tabanlı tarayıcı yapılandırmasını taşır ve
  varsayılan otomatik bağlantı profilleri için Chrome'un yerel olarak kurulu olduğunu denetler; ancak
  tarayıcı tarafındaki uzaktan hata ayıklamayı sizin için etkinleştiremez

Ajan kullanımı:

- Kullanıcının oturum açmış tarayıcı durumuna ihtiyaç duyduğunuzda `profile="user"` kullanın.
- Özel bir mevcut oturum profili kullanıyorsanız bu profil adını açıkça iletin.
- Bu modu yalnızca kullanıcı, bağlanma istemini onaylamak için bilgisayarın başındayken seçin.
- Gateway veya Node ana makinesi `npx chrome-devtools-mcp@latest --autoConnect` sürecini başlatabilir.

Notlar:

- Bu yol, oturum açmış tarayıcı oturumunuzda işlem yapabildiği için yalıtılmış
  `openclaw` profilinden daha yüksek risklidir.
- OpenClaw bu sürücü için tarayıcıyı başlatmaz; yalnızca tarayıcıya bağlanır.
- OpenClaw burada resmi Chrome DevTools MCP `--autoConnect` akışını kullanır.
  `userDataDir` ayarlanmışsa bu kullanıcı verileri dizinini hedeflemek üzere aktarılır.
- Mevcut oturum, seçilen ana makinede veya bağlı bir tarayıcı Node'u üzerinden bağlanabilir.
  Chrome başka bir yerdeyse ve bağlı bir tarayıcı Node'u yoksa bunun yerine
  uzak CDP veya bir Node ana makinesi kullanın.
- Chrome MCP hedefleri ve anlık görüntü referansları tek bir MCP alt süreciyle sınırlıdır.
  Bu süreç yeniden başlatıldıktan sonra `browser tabs` komutunu yeniden çalıştırın, hedefe özgü
  çalışmadan önce yeni bir hedefi açıkça seçin ve referansları kullanmadan önce yeni bir anlık görüntü alın.
  Her referans yalnızca kendi hedefi ve en son anlık görüntü için geçerlidir. URL'si eşleşse bile eski
  takma adlar yeni sekmeye aktarılmaz.
- Chrome DevTools MCP şu anda sayfa araçlarını sürece yerel sayısal bir sayfa
  kimliğine göre yönlendirir. Süreç kapsamlı tanıtıcılar, alt süreç değişimlerinde yeniden kullanımı
  önler; ancak bitişik araç çağrıları arasında süreç içi tarayıcı bağlamının değiştirilmesi yine de
  bir eylemi başka bir hedefe yönlendirebilir. Tam atomik yönlendirme, kararlı hedef kimlikleri için
  yukarı akış sayfa aracı desteği gerektirir.

### Özel Chrome MCP başlatma

Varsayılan `npx chrome-devtools-mcp@latest` akışı istediğiniz seçenek değilse (çevrimdışı ana
makineler, sabitlenmiş sürümler, projeye dahil edilmiş ikili dosyalar), başlatılan Chrome DevTools MCP
sunucusunu profil başına geçersiz kılın:

| Alan         | İşlevi                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` yerine başlatılacak yürütülebilir dosya. Olduğu gibi çözümlenir; mutlak yollara uyulur.                         |
| `mcpArgs`    | `mcpCommand` öğesine aynen iletilen bağımsız değişken dizisi. Varsayılan `chrome-devtools-mcp@latest --autoConnect` bağımsız değişkenlerinin yerini alır. |

Bir mevcut oturum profilinde `cdpUrl` ayarlandığında OpenClaw,
`--autoConnect` işlemini atlar ve uç noktayı otomatik olarak Chrome MCP'ye iletir:

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP keşif uç noktası).
- `ws(s)://...` → `--wsEndpoint <url>` (doğrudan CDP WebSocket'i).

Uç nokta bayrakları ve `userDataDir` birlikte kullanılamaz: `cdpUrl` ayarlandığında,
Chrome MCP başlatılırken `userDataDir` yok sayılır; çünkü Chrome MCP bir profil
dizini açmak yerine uç noktanın arkasındaki çalışan tarayıcıya bağlanır.

<Accordion title="Mevcut oturum özelliğinin sınırlamaları">

Yönetilen `openclaw` profiline kıyasla mevcut oturum sürücüleri daha kısıtlıdır:

- **Ekran görüntüleri** - sayfa yakalamaları ve `--ref` öğe yakalamaları çalışır; CSS `--element` seçicileri çalışmaz. Sayfa veya referans tabanlı öğe ekran görüntüleri için Playwright gerekli değildir. (`--full-page`, yalnızca mevcut oturumda değil hiçbir profilde `--ref` veya `--element` ile birlikte kullanılamaz.)
- **Eylemler** - `click`, `type`, `hover`, `scrollIntoView`, `drag` ve `select` anlık görüntü referansları gerektirir (CSS seçicileri kullanılamaz). `click-coords`, görünür görünüm alanı koordinatlarına tıklar ve anlık görüntü referansı gerektirmez. `click` yalnızca sol düğmeyi destekler (düğme geçersiz kılmaları veya değiştiriciler yoktur). `type`, `slowly=true` desteğine sahip değildir; `fill` veya `press` kullanın. `press`, `delayMs` desteğine sahip değildir. `type`, `hover`, `scrollIntoView`, `drag`, `select` ve `fill`, çağrı başına `timeoutMs` geçersiz kılmalarını desteklemez; `evaluate` destekler. `select` tek bir değer kabul eder. `batch` desteklenmez; eylemleri ayrı ayrı gönderin.
- **Bekleme / yükleme / iletişim kutusu** - `wait --url`, tam eşleşme, alt dize ve glob desenlerini destekler (yönetilen profille aynıdır); `wait --load networkidle` mevcut oturum profillerinde desteklenmez (yönetilen ve ham/uzak CDP profillerinde çalışır). Yükleme kancaları, her seferinde tek dosya olmak üzere `ref` veya `inputRef` gerektirir; CSS `element` kullanılamaz. İletişim kutusu kancaları, zaman aşımı geçersiz kılmalarını veya `dialogId` seçeneğini desteklemez.
- **İletişim kutusu görünürlüğü** - Yönetilen tarayıcı eylemi yanıtları, bir eylem kalıcı iletişim kutusu açtığında `blockedByDialog` ve `browserState.dialogs.pending` değerlerini içerir; anlık görüntüler de bekleyen iletişim kutusu durumunu içerir. Bir iletişim kutusu beklerken `browser dialog --accept/--dismiss --dialog-id <id>` ile yanıt verin. OpenClaw dışında işlenen iletişim kutuları `browserState.dialogs.recent` altında görünür.
- **Yalnızca yönetilen profillere özgü özellikler** - PDF dışa aktarma, indirme yakalama ve `responsebody` hâlâ yönetilen tarayıcı yolunu gerektirir.

</Accordion>

## Yalıtım garantileri

- **Ayrılmış kullanıcı verileri dizini**: kişisel tarayıcı profilinize hiçbir zaman dokunmaz.
- **Ayrılmış bağlantı noktaları**: geliştirme iş akışlarıyla çakışmaları önlemek için `9222` kullanmaz.
- **Belirlenimci sekme denetimi**: `tabs`, önce `suggestedTargetId`, ardından
  `t1` gibi kararlı `tabId` tanıtıcılarını, isteğe bağlı etiketleri ve ham `targetId` değerini döndürür.
  Ajanlar `suggestedTargetId` değerini yeniden kullanmalıdır; ham kimlikler hata ayıklama
  ve uyumluluk için kullanılabilir durumda kalır.

## Tarayıcı seçimi

OpenClaw yerel olarak başlatılırken kullanılabilir ilk seçeneği belirler:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` ile geçersiz kılabilirsiniz.

Platformlar:

- macOS: `/Applications` ve `~/Applications` konumlarını denetler.
- Linux: `/usr/bin`, `/snap/bin`, `/opt/google`,
  `/opt/brave.com`, `/usr/lib/chromium` ve `/usr/lib/chromium-browser` altındaki yaygın
  Chrome/Brave/Edge/Chromium konumlarının yanı sıra `PLAYWRIGHT_BROWSERS_PATH` veya
  `~/.cache/ms-playwright` altındaki Playwright tarafından yönetilen Chromium'u denetler.
- Windows: yaygın kurulum konumlarını denetler.

## Denetim API'si (isteğe bağlı)

Gateway, betik oluşturma ve hata ayıklama için küçük bir **yalnızca geri döngü HTTP
denetim API'sinin** yanı sıra eşleşen bir `openclaw browser` CLI'ı (anlık görüntüler, referanslar,
gelişmiş bekleme özellikleri, JSON çıktısı, hata ayıklama iş akışları) sunar. Tam başvuru için
[Tarayıcı denetim API'si](/tr/tools/browser-control) bölümüne bakın.

## Sorun giderme

Linux'a özgü sorunlar (özellikle snap Chromium) için
[Tarayıcı sorunlarını giderme](/tr/tools/browser-linux-troubleshooting) bölümüne bakın.

WSL2 Gateway + Windows Chrome ayrık ana makine kurulumları için
[WSL2 + Windows + uzak Chrome CDP sorunlarını giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting) bölümüne bakın.

### CDP başlatma hatası ile gezinme SSRF engeli arasındaki fark

Bunlar farklı hata sınıflarıdır ve farklı kod yollarına işaret eder.

- **CDP başlatma veya hazır olma hatası**, OpenClaw'ın tarayıcı denetim düzleminin sağlıklı olduğunu doğrulayamadığı anlamına gelir.
- **Gezinme SSRF engeli**, tarayıcı denetim düzleminin sağlıklı olduğu ancak bir sayfa gezinme hedefinin politika tarafından reddedildiği anlamına gelir.

Yaygın örnekler:

- CDP başlatma veya hazır olma hatası:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `attachOnly: true` olmadan bir geri döngü harici CDP hizmeti yapılandırıldığında
    `Port <port> is in use for profile "<name>" but not by openclaw`
- Gezinme SSRF engeli:
  - `start` ve `tabs` çalışmaya devam ederken `open`, `navigate`, anlık görüntü veya sekme açma akışları bir tarayıcı/ağ politikası hatasıyla başarısız olur

Bu ikisini ayırmak için şu asgari sırayı kullanın:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Sonuçların yorumlanması:

- `start`, `not reachable after start` ile başarısız olursa önce CDP hazır olma durumundaki sorunları giderin.
- `start` başarılı olur ancak `tabs` başarısız olursa denetim düzlemi hâlâ sağlıksızdır. Bunu sayfa gezinme sorunu olarak değil, CDP erişilebilirlik sorunu olarak değerlendirin.
- `start` ve `tabs` başarılı olur ancak `open` veya `navigate` başarısız olursa tarayıcı denetim düzlemi çalışmaktadır ve hata gezinme politikasında ya da hedef sayfadadır.
- `start`, `tabs` ve `open` değerlerinin tümü başarılı olursa temel yönetilen tarayıcı denetim yolu sağlıklıdır.

Önemli davranış ayrıntıları:

- Tarayıcı yapılandırması, `browser.ssrfPolicy` yapılandırılmadığında bile varsayılan olarak hata durumunda kapalı bir SSRF politika nesnesi kullanır.
- Yerel geri döngü `openclaw` yönetilen profili için CDP sağlık denetimleri, OpenClaw'ın kendi yerel denetim düzleminde tarayıcı SSRF erişilebilirlik uygulamasını kasıtlı olarak atlar.
- Gezinme koruması ayrıdır. Başarılı bir `start` veya `tabs` sonucu, daha sonraki bir `open` ya da `navigate` hedefine izin verildiği anlamına gelmez.

Güvenlik yönergeleri:

- Tarayıcı SSRF politikasını varsayılan olarak **gevşetmeyin**.
- Geniş özel ağ erişimi yerine `hostnameAllowlist` veya `allowedHostnames` gibi dar kapsamlı ana makine istisnalarını tercih edin.
- `dangerouslyAllowPrivateNetwork: true` seçeneğini yalnızca özel ağ tarayıcı erişiminin gerekli olduğu ve incelendiği, kasıtlı olarak güvenilen ortamlarda kullanın.

## Ajan araçları + denetimin çalışma şekli

Ajan, tarayıcı otomasyonu için **tek bir araç** edinir:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Eşleştirme şekli:

- `browser snapshot` kararlı bir kullanıcı arayüzü ağacı (AI veya ARIA) döndürür.
- `browser act`, tıklamak/yazmak/sürüklemek/seçmek için anlık görüntüdeki `ref` kimliklerini kullanır.
- `browser screenshot` pikselleri yakalar (tam sayfa, öğe veya etiketli referanslar).
- `browser doctor`; Gateway, plugin, profil, tarayıcı ve sekmenin hazır olup olmadığını denetler.
- `browser` şunları kabul eder:
  - Adlandırılmış bir tarayıcı profili (openclaw, chrome veya uzak CDP) seçmek için `profile`.
  - Tarayıcının nerede çalıştığını seçmek için `target` (`sandbox` | `host` | `node`).
  - Korumalı alan oturumlarında `target: "host"`, `agents.defaults.sandbox.browser.allowHostControl=true` gerektirir.
  - `target` belirtilmezse korumalı alan oturumları varsayılan olarak `sandbox`, korumalı alan dışındaki oturumlar ise `host` kullanır.
  - Tarayıcı özellikli bir Node bağlıysa `target="host"` veya `target="node"` sabitlenmediği sürece araç otomatik olarak bu Node'a yönlendirme yapabilir.

Bu, agent'ı deterministik tutar ve kırılgan seçicilerden kaçınılmasını sağlar.

## İlgili

- [Araçlara Genel Bakış](/tr/tools) - kullanılabilir tüm agent araçları
- [Korumalı Alan](/tr/gateway/sandboxing) - korumalı alan ortamlarında tarayıcı denetimi
- [Güvenlik](/tr/gateway/security) - tarayıcı denetimi riskleri ve sağlamlaştırma
