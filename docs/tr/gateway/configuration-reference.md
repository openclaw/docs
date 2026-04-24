---
read_when:
    - Tam alan düzeyi yapılandırma semantiğine veya varsayılanlara ihtiyacınız var
    - Kanal, model, gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Temel OpenClaw anahtarları, varsayılanlar ve ayrılmış alt sistem başvurularına bağlantılar için Gateway yapılandırma başvurusu
title: Yapılandırma başvurusu
x-i18n:
    generated_at: "2026-04-24T09:08:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc0d9feea2f2707f267d50ec83aa664ef503db8f9132762345cc80305f8bef73
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json` için temel yapılandırma başvurusu. Görev odaklı genel bakış için bkz. [Yapılandırma](/tr/gateway/configuration).

Bu sayfa, ana OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendi daha derin başvurusu olduğunda dış bağlantı verir. Her kanal/Plugin sahipli komut kataloğunu veya her derin bellek/QMD düğmesini tek sayfada satır içine almaya **çalışmaz**.

Kod doğruluğu:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema'yı yazdırır; kullanılabilir olduğunda paketle gelen/Plugin/kanal metadata'sı bununla birleştirilir
- `config.schema.lookup`, ayrıntı inceleme araçları için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, yapılandırma belge temel karma değerini geçerli şema yüzeyine karşı doğrular

Ayrılmış derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki Dreaming yapılandırması için [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
- Geçerli yerleşik + paketle gelen komut kataloğu için [Slash Komutları](/tr/tools/slash-commands)
- Kanala özgü komut yüzeyleri için ilgili kanal/Plugin sayfaları

Yapılandırma biçimi **JSON5**'tir (yorumlara + sondaki virgüllere izin verilir). Tüm alanlar isteğe bağlıdır — atlandığında OpenClaw güvenli varsayılanları kullanır.

---

## Kanallar

Kanal başına yapılandırma anahtarları ayrı bir sayfaya taşındı — `channels.*`
için [Yapılandırma — kanallar](/tr/gateway/config-channels) sayfasına bakın;
Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve diğer
paketle gelen kanallar (auth, erişim denetimi, çok hesap, bahsetme kapısı) dahildir.

## Aracı varsayılanları, çok aracılı, oturumlar ve mesajlar

Ayrı bir sayfaya taşındı — şunlar için
[Yapılandırma — aracılar](/tr/gateway/config-agents) sayfasına bakın:

- `agents.defaults.*` (çalışma alanı, model, düşünme, Heartbeat, bellek, medya, Skills, sandbox)
- `multiAgent.*` (çok aracılı yönlendirme ve bağlamalar)
- `session.*` (oturum yaşam döngüsü, Compaction, budama)
- `messages.*` (mesaj teslimi, TTS, Markdown işleme)
- `talk.*` (Talk modu)
  - `talk.silenceTimeoutMs`: ayarlanmadığında Talk, transcript'i göndermeden önce platform varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`)

## Araçlar ve özel sağlayıcılar

Araç ilkesi, deneysel geçişler, sağlayıcı destekli araç yapılandırması ve özel
sağlayıcı / base URL kurulumu ayrı bir sayfaya taşındı — bkz.
[Yapılandırma — araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // veya düz metin dize
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: yalnızca paketle gelen Skills için isteğe bağlı izin listesi (yönetilen/çalışma alanı Skills etkilenmez).
- `load.extraDirs`: ek paylaşılan skill kökleri (en düşük öncelik).
- `install.preferBrew`: `true` olduğunda ve `brew` kullanılabilir olduğunda,
  diğer kurucu türlerine dönmeden önce Homebrew kurucularını tercih eder.
- `install.nodeManager`: `metadata.openclaw.install`
  özellikleri için Node kurucu tercihi (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false`, bir skill'i paketle gelmiş/kurulmuş olsa bile devre dışı bırakır.
- `entries.<skillKey>.apiKey`: birincil env değişkeni bildiren Skills için kolaylık alanı (düz metin dize veya SecretRef nesnesi).

---

## Plugin'ler

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` ve `plugins.load.paths` konumlarından yüklenir.
- Keşif; yerel OpenClaw Plugin'lerini ve manifest içermeyen Claude varsayılan düzen paketleri dahil uyumlu Codex paketlerini ve Claude paketlerini kabul eder.
- **Yapılandırma değişiklikleri gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen Plugin'ler yüklenir). `deny` kazanır.
- `plugins.entries.<id>.apiKey`: Plugin düzeyinde API anahtarı kolaylık alanı (Plugin destekliyorsa).
- `plugins.entries.<id>.env`: Plugin kapsamlı env değişkeni eşlemesi.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda çekirdek `before_prompt_build` kancasını engeller ve eski `before_agent_start` içindeki istem değiştiren alanları yok sayar; eski `modelOverride` ve `providerOverride` alanlarını korur. Yerel Plugin kancalarına ve desteklenen paketlerin sağladığı kanca dizinlerine uygulanır.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu Plugin'e arka plan alt aracı çalıştırmalarında çalışma başına `provider` ve `model` geçersiz kılmaları istemesi için açıkça güvenin.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilen alt aracı geçersiz kılmaları için standart `provider/model` hedeflerinden oluşan isteğe bağlı izin listesi. Yalnızca herhangi bir modele kasıtlı olarak izin vermek istediğinizde `"*"` kullanın.
- `plugins.entries.<id>.config`: Plugin tarafından tanımlanan yapılandırma nesnesi (kullanılabilir olduğunda yerel OpenClaw Plugin şemasıyla doğrulanır).
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch sağlayıcı ayarları.
  - `apiKey`: Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` env değişkenine geri döner.
  - `baseUrl`: Firecrawl API base URL (varsayılan: `https://api.firecrawl.dev`).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği ayıkla (varsayılan: `true`).
  - `maxAgeMs`: milisaniye cinsinden en yüksek önbellek yaşı (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: scrape isteği zaman aşımı saniyesi (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web search) ayarları.
  - `enabled`: X Search sağlayıcısını etkinleştirir.
  - `model`: arama için kullanılacak Grok modeli (ör. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: bellek Dreaming ayarları. Aşamalar ve eşikler için bkz. [Dreaming](/tr/concepts/dreaming).
  - `enabled`: ana Dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam Dreaming taraması için Cron sıklığı (varsayılan olarak `"0 3 * * *"`).
  - faz ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya dönük yapılandırma anahtarları değildir).
- Tam bellek yapılandırması [Bellek yapılandırma başvurusu](/tr/reference/memory-config) içindedir:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude paket Plugin'leri ayrıca `settings.json` üzerinden gömülü Pi varsayılanları da sağlayabilir; OpenClaw bunları ham OpenClaw yapılandırma yamaları olarak değil, temizlenmiş aracı ayarları olarak uygular.
- `plugins.slots.memory`: etkin bellek Plugin kimliğini seçin veya bellek Plugin'lerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: etkin bağlam motoru Plugin kimliğini seçin; başka bir motor kurup seçmediğiniz sürece varsayılan `"legacy"`'dir.
- `plugins.installs`: `openclaw plugins update` tarafından kullanılan CLI yönetimli kurulum metadata'sı.
  - `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt` içerir.
  - `plugins.installs.*` alanlarını yönetilen durum olarak ele alın; manuel düzenlemeler yerine CLI komutlarını tercih edin.

Bkz. [Plugins](/tr/tools/plugin).

---

## Tarayıcı

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // yalnızca güvenilen özel ağ erişimi için katılım gösterin
      // allowPrivateNetwork: true, // eski takma ad
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false`, `act:evaluate` ve `wait --fn` komutlarını devre dışı bırakır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`, ayarlanmadığında devre dışıdır; böylece tarayıcı gezintisi varsayılan olarak sıkı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezintisine bilinçli olarak güvendiğinizde ayarlayın.
- Sıkı modda uzak CDP profil uç noktaları (`profiles.*.cdpUrl`) da erişilebilirlik/keşif denetimleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski bir takma ad olarak desteklenmeye devam eder.
- Sıkı modda açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca ekleme içindir (başlat/durdur/sıfırla devre dışıdır).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw'ın `/json/version` keşfetmesini istediğinizde HTTP(S) kullanın; sağlayıcınız doğrudan bir DevTools WebSocket URL'si veriyorsa WS(S)
  kullanın.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve
  seçili host üzerinde veya bağlı bir tarayıcı Node üzerinden eklenebilir.
- `existing-session` profilleri, Brave veya Edge gibi belirli bir
  Chromium tabanlı tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri mevcut Chrome MCP rota sınırlarını korur:
  CSS seçici hedefleme yerine snapshot/ref odaklı eylemler, tek dosya yükleme
  kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok,
  ayrıca `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; yalnızca uzak CDP için
  `cdpUrl` değerini açıkça ayarlayın.
- Otomatik algılama sırası: varsayılan tarayıcı Chromium tabanlıysa → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Control service: yalnızca loopback (port `gateway.port` değerinden türetilir, varsayılan `18791`).
- `extraArgs`, yerel Chromium başlatmasına ek başlatma bayrakları ekler (örneğin
  `--disable-gpu`, pencere boyutlandırma veya hata ayıklama bayrakları).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, kısa metin, görsel URL'si veya data URI
    },
  },
}
```

- `seamColor`: yerel uygulama UI chrome vurgu rengi (Talk Mode konuşma balonu tonu vb.).
- `assistant`: Control UI kimlik geçersiz kılması. Etkin aracı kimliğine geri döner.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // veya OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy için; bkz. /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // tehlikeli: mutlak harici http(s) embed URL'lerine izin ver
      // allowedOrigins: ["https://control.example.com"], // loopback olmayan Control UI için gereklidir
      // dangerouslyAllowHostHeaderOriginFallback: false, // tehlikeli Host-header origin geri dönüş modu
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // İsteğe bağlı. Varsayılan false.
    allowRealIpFallback: false,
    tools: {
      // Ek /tools/invoke HTTP engellemeleri
      deny: ["browser"],
      // Varsayılan HTTP engelleme listesinden araçları kaldır
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway alan ayrıntıları">

- `mode`: `local` (gateway'i çalıştır) veya `remote` (uzak gateway'e bağlan). Gateway, `local` olmadıkça başlatmayı reddeder.
- `port`: WS + HTTP için tek çoklanmış port. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP) veya `custom`.
- **Eski bind takma adları**: `gateway.bind` içinde host takma adları (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bind modu değerleri (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind, kapsayıcı içinde `127.0.0.1` üzerinde dinler. Docker bridge ağıyla (`-p 18789:18789`) trafik `eth0` üzerinden gelir, bu yüzden gateway'e ulaşılamaz. `--network host` kullanın veya tüm arayüzlerde dinlemek için `bind: "lan"` (veya `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Auth**: varsayılan olarak gereklidir. Loopback olmayan bind'ler gateway auth gerektirir. Uygulamada bu, paylaşılan bir token/parola veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkındalıklı bir ters proxy anlamına gelir. İlk kurulum sihirbazı varsayılan olarak bir token üretir.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. Her ikisi de yapılandırılmış ve mod ayarlı değilse başlatma ve service kurulum/onarma akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık kimlik doğrulamasız mod. Bunu yalnızca güvenilen yerel local loopback kurulumları için kullanın; bu seçenek ilk kurulum istemlerinde bilerek sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: kimlik doğrulamayı kimlik farkındalıklı bir ters proxy'ye devredin ve `gateway.trustedProxies` içinden gelen kimlik üst bilgilerine güvenin (bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)). Bu mod bir **loopback olmayan** proxy kaynağı bekler; aynı host üzerindeki loopback ters proxy'ler trusted-proxy auth gereksinimini karşılamaz.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik üst bilgileri Control UI/WebSocket auth gereksinimini karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale üst bilgi auth yöntemini **kullanmaz**; bunun yerine gateway'in normal HTTP auth modunu izler. Bu tokensız akış gateway host'unun güvenilir olduğunu varsayar. `tailscale.mode = "serve"` olduğunda varsayılan `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız auth sınırlayıcısı. İstemci IP'si ve auth kapsamı başına uygulanır (paylaşılan gizli anahtar ve cihaz token'ı bağımsız olarak izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Eşzamansız Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler başarısızlık yazımından önce serileştirilir. Bu nedenle aynı istemciden gelen eşzamanlı kötü denemeler, ikisi de düz uyumsuzluk olarak geçmek yerine ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true`'dur; localhost trafiğinin de hız sınırlamasına tabi olmasını kasıtlı olarak istiyorsanız (test kurulumları veya katı proxy dağıtımları için) `false` ayarlayın.
- Tarayıcı origin'li WS auth denemeleri, loopback muafiyeti devre dışı bırakılmış şekilde her zaman sınırlandırılır (tarayıcı tabanlı localhost brute force saldırılarına karşı ek savunma).
- Loopback üzerinde bu tarayıcı origin'li kilitlemeler, normalize edilmiş `Origin`
  değeri başına yalıtılır; bu nedenle bir localhost origin'inden gelen tekrarlı başarısızlıklar
  farklı bir origin'i otomatik olarak kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, loopback bind) veya `funnel` (genel, auth gerekir).
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı origin izin listesi. Tarayıcı istemcilerinin loopback olmayan origin'lerden gelmesi beklendiğinde gereklidir.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host-header origin ilkesine kasıtlı olarak dayanan dağıtımlar için Host-header origin geri dönüşünü etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için `remote.url`, `ws://` veya `wss://` olmalıdır.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: istemci tarafı süreç ortamı
  acil durum geçersiz kılmasıdır; güvenilen özel ağ IP'lerine düz metin `ws://`
  kullanımına izin verir; varsayılan olarak düz metin için yalnızca loopback izinlidir. Bunun `openclaw.json`
  eşdeğeri yoktur ve
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` gibi tarayıcı özel ağ yapılandırmaları Gateway
  WebSocket istemcilerini etkilemez.
- `gateway.remote.token` / `.password`, uzak istemci kimlik bilgisi alanlarıdır. Kendi başlarına gateway auth yapılandırmazlar.
- `gateway.push.apns.relay.baseUrl`: resmi/TestFlight iOS yapıları relay destekli kayıtları gateway'e yayımladıktan sonra kullanılan harici APNs relay için base HTTPS URL'si. Bu URL, iOS yapısına derlenmiş relay URL'siyle eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: milisaniye cinsinden gateway'den relay'e gönderim zaman aşımı. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir gateway kimliğine devredilir. Eşleştirilmiş iOS uygulaması `gateway.identity.get` çağırır, bu kimliği relay kaydına dahil eder ve kayıt kapsamlı bir gönderim yetkisini gateway'e iletir. Başka bir gateway bu saklanan kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici env geçersiz kılmaları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL'leri için yalnızca geliştirme amaçlı kaçış seçeneği. Üretim relay URL'leri HTTPS üzerinde kalmalıdır.
- `gateway.channelHealthCheckMinutes`: dakika cinsinden kanal sağlık izleme aralığı. Sağlık izleyici yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: dakika cinsinden eski soket eşiği. Bu değeri `gateway.channelHealthCheckMinutes` değerine eşit veya ondan büyük tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına en fazla sağlık izleme yeniden başlatma sayısı. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izleyiciyi etkin tutarken sağlık izleme yeniden başlatmalarından kanal başına çıkış seçeneği.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap başına geçersiz kılma. Ayarlandığında kanal düzeyi geçersiz kılmanın önüne geçer.
- Yerel gateway çağrı yolları, yalnızca `gateway.auth.*` ayarlı değilse geri dönüş olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef ile açıkça yapılandırılmış ve çözümlenmemişse çözümleme kapalı varsayımla başarısız olur (uzak geri dönüşün bunu maskelemesi yoktur).
- `trustedProxies`: TLS sonlandıran veya iletilen istemci üst bilgilerini enjekte eden ters proxy IP'leri. Yalnızca sizin denetlediğiniz proxy'leri listeleyin. Loopback girdileri, aynı host proxy/yerel algılama kurulumları için hâlâ geçerlidir (örneğin Tailscale Serve veya yerel ters proxy), ancak loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hâle **getirmezler**.
- `allowRealIpFallback`: `true` olduğunda, `X-Forwarded-For` eksikse gateway `X-Real-IP` kabul eder. Kapalı varsayımla başarısız davranış için varsayılan `false`.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek araç adlarıdır (varsayılan engelleme listesini genişletir).
- `gateway.tools.allow`: araç adlarını varsayılan HTTP engelleme listesinden kaldırır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL giriş sertleştirmesi:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarlanmamış kabul edilir; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt sertleştirme üst bilgisi:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca denetlediğiniz HTTPS origin'leri için ayarlayın; bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çok örnekli yalıtım

Tek bir host üzerinde benzersiz portlar ve durum dizinleriyle birden çok gateway çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Kolaylık bayrakları: `--dev` (`~/.openclaw-dev` + `19001` portunu kullanır), `--profile <name>` (`~/.openclaw-<name>` kullanır).

Bkz. [Çoklu Gateway'ler](/tr/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: gateway dinleyicisinde TLS sonlandırmayı etkinleştirir (HTTPS/WSS) (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel kendinden imzalı bir sertifika/anahtar çifti otomatik üretir; yalnızca yerel/geliştirme kullanımı içindir.
- `certPath`: TLS sertifika dosyasının dosya sistemi yolu.
- `keyPath`: TLS özel anahtar dosyasının dosya sistemi yolu; izinleri kısıtlı tutun.
- `caPath`: istemci doğrulaması veya özel güven zincirleri için isteğe bağlı CA paketi yolu.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: yapılandırma düzenlemelerinin çalışma zamanında nasıl uygulanacağını denetler.
  - `"off"`: canlı düzenlemeleri yok sayar; değişiklikler açık bir yeniden başlatma gerektirir.
  - `"restart"`: yapılandırma değişikliğinde gateway sürecini her zaman yeniden başlatır.
  - `"hot"`: değişiklikleri yeniden başlatmadan süreç içinde uygular.
  - `"hybrid"` (varsayılan): önce hot reload dener; gerekirse yeniden başlatmaya döner.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tamsayı).
- `deferralTimeoutMs`: yeniden başlatmayı zorlamadan önce devam eden işlemleri beklemek için ms cinsinden en uzun süre (varsayılan: `300000` = 5 dakika).

---

## Kancalar

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "Kimden: {{messages[0].from}}\nKonu: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` veya `x-openclaw-token: <token>`.
Sorgu dizgesi hook token'ları reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, `gateway.auth.token` değerinden **farklı** olmalıdır; Gateway token'ını yeniden kullanmak reddedilir.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini sınırlayın (örneğin `["hook:"]`).
- Bir eşleme veya preset şablonlu bir `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` ve `hooks.allowRequestSessionKey=true` ayarlayın. Statik eşleme anahtarları bu katılımı gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükündeki `sessionKey`, yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` üzerinden çözülür
  - Şablonla işlenen eşleme `sessionKey` değerleri harici olarak sağlanmış kabul edilir ve ayrıca `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Eşleme ayrıntıları">

- `match.path`, `/hooks` sonrasındaki alt yolu eşleştirir (ör. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanını eşleştirir.
- `{{messages[0].subject}}` gibi şablonlar yükten okur.
- `transform`, bir hook eylemi döndüren JS/TS modülüne işaret edebilir.
  - `transform.module`, göreli bir yol olmalıdır ve `hooks.transformsDir` içinde kalır (mutlak yollar ve dizin geçişi reddedilir).
- `agentId`, belirli bir aracıya yönlendirir; bilinmeyen kimlikler varsayılana geri döner.
- `allowedAgentIds`: açık yönlendirmeyi sınırlar (`*` veya atlanmış = tümüne izin ver, `[]` = hepsini reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan yapılan hook aracı çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranlarının ve şablon güdümlü eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin verir (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri için (istek + eşleme) isteğe bağlı önek izin listesi, ör. `["hook:"]`. Herhangi bir eşleme veya preset şablonlu `sessionKey` kullandığında gerekli hâle gelir.
- `deliver: true`, nihai yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` olur.
- `model`, bu hook çalıştırması için LLM'i geçersiz kılar (model kataloğu ayarlıysa izin verilmiş olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail preset'i `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- Bu ileti başına yönlendirmeyi koruyorsanız `hooks.allowRequestSessionKey: true` ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanıyla eşleşecek şekilde sınırlayın; örneğin `["hook:", "hook:gmail:"]`.
- `hooks.allowRequestSessionKey: false` gereksiniminiz varsa preset'i, şablonlu varsayılan yerine statik bir `sessionKey` ile geçersiz kılın.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway, yapılandırıldığında açılışta `gog gmail watch serve` komutunu otomatik başlatır. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.
- Gateway ile birlikte ayrı bir `gog gmail watch serve` çalıştırmayın.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // veya OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Aracı tarafından düzenlenebilir HTML/CSS/JS ve A2UI'yi Gateway portu altında HTTP üzerinden sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` (varsayılan) olarak tutun.
- Loopback olmayan bind'ler: canvas rotaları, diğer Gateway HTTP yüzeyleriyle aynı şekilde Gateway auth (token/password/trusted-proxy) gerektirir.
- Node WebView'ları genellikle auth üst bilgisi göndermez; bir Node eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için Node kapsamlı capability URL'leri ilan eder.
- Capability URL'leri etkin Node WS oturumuna bağlıdır ve kısa sürede sona erer. IP tabanlı geri dönüş kullanılmaz.
- Sunulan HTML içine live-reload istemcisi enjekte eder.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- A2UI'yi ayrıca `/__openclaw__/a2ui/` adresinde sunar.
- Değişiklikler gateway yeniden başlatması gerektirir.
- Büyük dizinlerde veya `EMFILE` hatalarında live reload'u devre dışı bırakın.

---

## Keşif

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (varsayılan): TXT kayıtlarından `cliPath` + `sshPort` alanlarını çıkarır.
- `full`: `cliPath` + `sshPort` alanlarını içerir.
- Hostname varsayılan olarak `openclaw` olur. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

### Geniş alan (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` altında tekil bir DNS-SD bölgesi yazar. Ağlar arası keşif için bunu DNS sunucusuyla (CoreDNS önerilir) + Tailscale split DNS ile eşleştirin.

Kurulum: `openclaw dns setup --apply`.

---

## Ortam

### `env` (satır içi env değişkenleri)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Satır içi env değişkenleri yalnızca süreç env içinde anahtar eksikse uygulanır.
- `.env` dosyaları: CWD `.env` + `~/.openclaw/.env` (hiçbiri mevcut değişkenleri geçersiz kılmaz).
- `shellEnv`: beklenen eksik anahtarları oturum açma kabuğu profilinizden içe aktarır.
- Tam öncelik sırası için bkz. [Ortam](/tr/help/environment).

### Env değişkeni yerine koyma

Herhangi bir yapılandırma dizesinde env değişkenlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Yalnızca şu eşleşen büyük harfli adlar: `[A-Z_][A-Z0-9_]*`.
- Eksik/boş değişkenler yapılandırma yüklemesinde hata üretir.
- Düz `${VAR}` için `$${VAR}` ile kaçış yapın.
- `$include` ile çalışır.

---

## Secrets

Secret ref'ler eklemelidir: düz metin değerler hâlâ çalışır.

### `SecretRef`

Tek nesne biçimi kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Doğrulama:

- `provider` deseni: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` kimlik deseni: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` kimliği: mutlak JSON işaretçisi (örneğin `"/providers/openai/apiKey"`)
- `source: "exec"` kimlik deseni: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` kimlikleri `.` veya `..` eğik çizgiyle ayrılmış yol segmentleri içermemelidir (örneğin `a/../b` reddedilir)

### Desteklenen kimlik bilgisi yüzeyi

- Standart matris: [SecretRef Credential Surface](/tr/reference/secretref-credential-surface)
- `secrets apply`, desteklenen `openclaw.json` kimlik bilgisi yollarını hedefler.
- `auth-profiles.json` ref'leri çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.

### Secret providers yapılandırması

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // isteğe bağlı açık env sağlayıcısı
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Notlar:

- `file` sağlayıcısı `mode: "json"` ve `mode: "singleValue"` destekler (`singleValue` modunda `id`, `"value"` olmalıdır).
- Dosya ve exec sağlayıcı yolları, Windows ACL doğrulaması kullanılamadığında kapalı varsayımla başarısız olur. Yalnızca doğrulanamayan güvenilen yollar için `allowInsecurePath: true` ayarlayın.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yükleri kullanır.
- Varsayılan olarak sembolik bağlantılı komut yolları reddedilir. Çözülmüş hedef yolu doğrularken sembolik bağlantı yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın.
- `trustedDirs` yapılandırılmışsa güvenilen dizin denetimi çözülmüş hedef yoluna uygulanır.
- `exec` alt süreç ortamı varsayılan olarak minimaldir; gerekli değişkenleri `passEnv` ile açıkça geçirin.
- Secret ref'ler etkinleştirme sırasında bellekteki bir anlık görüntüye çözülür; ardından istek yolları yalnızca bu anlık görüntüyü okur.
- Etkin yüzey filtreleme etkinleştirme sırasında uygulanır: etkin yüzeylerdeki çözümlenmemiş ref'ler başlatma/yeniden yüklemeyi başarısız kılar, etkin olmayan yüzeyler ise tanılama ile atlanır.

---

## Auth depolama

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Aracı başına profile'lar `<agentDir>/auth-profiles.json` konumunda saklanır.
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyinde ref'leri (`api_key` için `keyRef`, `token` için `tokenRef`) destekler.
- OAuth modundaki profile'lar (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli auth-profile kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri, bellekte çözülmüş anlık görüntülerden gelir; eski statik `auth.json` girdileri bulunduğunda temizlenir.
- Eski OAuth içe aktarımları `~/.openclaw/credentials/oauth.json` dosyasından yapılır.
- Bkz. [OAuth](/tr/concepts/oauth).
- Secrets çalışma zamanı davranışı ve `audit/configure/apply` araçları: [Secrets Management](/tr/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: bir profil gerçek
  faturalama/yetersiz kredi hataları nedeniyle başarısız olduğunda temel geri çekilme süresi saat cinsinden
  (varsayılan: `5`). Açık faturalama metni
  `401`/`403` yanıtlarında bile buraya düşebilir, ancak sağlayıcıya özgü metin
  eşleştiriciler bunlara sahip olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter
  `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya
  kuruluş/çalışma alanı harcama sınırı mesajları bunun yerine `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalama geri çekilme süresi için sağlayıcı başına isteğe bağlı saat geçersiz kılmaları.
- `billingMaxHours`: faturalama geri çekilme üstel artışı için üst sınır saat cinsinden (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenilirlikli `auth_permanent` hataları için temel geri çekilme süresi dakika cinsinden (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme artışı için üst sınır dakika cinsinden (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan kayan pencere saat cinsinden (varsayılan: `24`).
- `overloadedProfileRotations`: model geri dönüşüne geçmeden önce aşırı yük hataları için aynı sağlayıcı auth-profile döndürmelerinin en yüksek sayısı (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı-meşgul şekilleri buraya düşer.
- `overloadedBackoffMs`: aşırı yüklü bir sağlayıcı/profil döndürmesini yeniden denemeden önce sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model geri dönüşüne geçmeden önce hız sınırı hataları için aynı sağlayıcı auth-profile döndürmelerinin en yüksek sayısı (varsayılan: `1`). Bu hız sınırı kovası `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

---

## Günlükleme

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Varsayılan günlük dosyası: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Kararlı bir yol için `logging.file` ayarlayın.
- `consoleLevel`, `--verbose` olduğunda `debug` düzeyine yükselir.
- `maxFileBytes`: yazımlar bastırılmadan önce en yüksek günlük dosyası boyutu bayt cinsinden (pozitif tamsayı; varsayılan: `524288000` = 500 MB). Üretim dağıtımları için harici günlük döndürme kullanın.

---

## Tanılama

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: araçsal çıktı için ana anahtar (varsayılan: `true`).
- `flags`: hedeflenmiş günlük çıktısını etkinleştiren bayrak dizeleri dizisi (`"telegram.*"` veya `"*"` gibi joker karakterleri destekler).
- `stuckSessionWarnMs`: bir oturum işleniyor durumunda kalırken takılı oturum uyarıları yaymak için yaş eşiği ms cinsinden.
- `otel.enabled`: OpenTelemetry dışa aktarma işlem hattını etkinleştirir (varsayılan: `false`).
- `otel.endpoint`: OTel dışa aktarımı için toplayıcı URL'si.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC metadata üst bilgileri.
- `otel.serviceName`: kaynak öznitelikleri için service adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarımını etkinleştirir.
- `otel.sampleRate`: `0`–`1` arası iz örnekleme oranı.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri boşaltma aralığı.
- `cacheTrace.enabled`: gömülü çalıştırmalar için önbellek izleme anlık görüntülerini günlüğe kaydeder (varsayılan: `false`).
- `cacheTrace.filePath`: önbellek izleme JSONL çıktısı yolu (varsayılan: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: önbellek izleme çıktısına nelerin dahil edileceğini denetler (hepsi varsayılan: `true`).

---

## Güncelleme

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: npm/git kurulumları için sürüm kanalı — `"stable"`, `"beta"` veya `"dev"`.
- `checkOnStart`: gateway başlatıldığında npm güncellemelerini denetler (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka plan otomatik güncellemeyi etkinleştirir (varsayılan: `false`).
- `auto.stableDelayHours`: stable kanalında otomatik uygulama öncesi en düşük gecikme saat cinsinden (varsayılan: `6`; en fazla: `168`).
- `auto.stableJitterHours`: stable kanalında ek yayılım penceresi saat cinsinden (varsayılan: `12`; en fazla: `168`).
- `auto.betaCheckIntervalHours`: beta kanal denetimlerinin saat cinsinden ne sıklıkla çalışacağı (varsayılan: `1`; en fazla: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: genel ACP özellik kapısı (varsayılan: `false`).
- `dispatch.enabled`: ACP oturum dönüşü dağıtımı için bağımsız kapı (varsayılan: `true`). ACP komutlarını kullanılabilir tutarken yürütmeyi engellemek için `false` ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı arka uç kimliği (kayıtlı ACP çalışma zamanı Plugin'iyle eşleşmelidir).
- `defaultAgent`: başlatmalar açık hedef belirtmediğinde geri dönüş ACP hedef aracı kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen aracı kimliklerinin izin listesi; boşsa ek kısıtlama yoktur.
- `maxConcurrentSessions`: aynı anda etkin ACP oturumlarının en yüksek sayısı.
- `stream.coalesceIdleMs`: akıtılan metin için boşta kalma boşaltma penceresi ms cinsinden.
- `stream.maxChunkChars`: akıtılan blok projeksiyonunu bölmeden önce en yüksek parça boyutu.
- `stream.repeatSuppression`: dönüş başına yinelenen durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı akış yapar; `"final_only"` dönüş son olaylarına kadar arabelleğe alır.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önce ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP dönüşü başına yansıtılan en yüksek asistan çıktı karakteri.
- `stream.maxSessionUpdateChars`: yansıtılan ACP durum/güncelleme satırları için en yüksek karakter sayısı.
- `stream.tagVisibility`: akıtılan olaylar için etiket adlarından boolean görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum çalışanları için temizliğe uygun olmadan önce boşta kalma TTL süresi dakika cinsinden.
- `runtime.installCommand`: ACP çalışma zamanı ortamı bootstrap yapılırken çalıştırılacak isteğe bağlı kurulum komutu.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode`, başlık sloganı stilini denetler:
  - `"random"` (varsayılan): dönen komik/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yoktur (başlık başlığı/sürüm yine gösterilir).
- Tüm başlığı gizlemek için (yalnızca sloganları değil), env `OPENCLAW_HIDE_BANNER=1` ayarlayın.

---

## Wizard

CLI yönlendirmeli kurulum akışları (`onboard`, `configure`, `doctor`) tarafından yazılan metadata:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Kimlik

[Aracı varsayılanları](/tr/gateway/config-agents#agent-defaults) altındaki `agents.list` kimlik alanlarına bakın.

---

## Bridge (eski, kaldırıldı)

Güncel yapılar artık TCP bridge içermez. Node'lar Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları temizleyebilir).

<Accordion title="Eski bridge yapılandırması (tarihsel başvuru)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // notify:true olan saklı işler için kullanımdan kaldırılmış geri dönüş
    webhookToken: "replace-with-dedicated-token", // giden Webhook auth için isteğe bağlı bearer token
    sessionRetention: "24h", // süre dizesi veya false
    runLog: {
      maxBytes: "2mb", // varsayılan 2_000_000 bayt
      keepLines: 2000, // varsayılan 2000
    },
  },
}
```

- `sessionRetention`: tamamlanmış yalıtılmış Cron çalıştırma oturumlarını `sessions.json` dosyasından budamadan önce ne kadar süre saklayacağını belirler. Ayrıca arşivlenmiş silinmiş Cron transcript'lerinin temizliğini de denetler. Varsayılan: `24h`; devre dışı bırakmak için `false` ayarlayın.
- `runLog.maxBytes`: budamadan önce çalıştırma günlük dosyası başına en yüksek boyut (`cron/runs/<jobId>.jsonl`). Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: çalıştırma günlüğü budaması tetiklendiğinde tutulacak en yeni satırlar. Varsayılan: `2000`.
- `webhookToken`: Cron Webhook `POST` teslimi için kullanılan bearer token (`delivery.mode = "webhook"`); atlanırsa auth üst bilgisi gönderilmez.
- `webhook`: yalnızca hâlâ `notify: true` olan saklı işler için kullanılan, kullanımdan kaldırılmış eski geri dönüş Webhook URL'si (http/https).

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: geçici hatalarda tek seferlik işler için en yüksek yeniden deneme sayısı (varsayılan: `3`; aralık: `0`–`10`).
- `backoffMs`: her yeniden deneme girişimi için ms cinsinden geri çekilme gecikmeleri dizisi (varsayılan: `[30000, 60000, 300000]`; 1–10 girdi).
- `retryOn`: yeniden denemeleri tetikleyen hata türleri — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Tüm geçici türleri yeniden denemek için atlayın.

Yalnızca tek seferlik Cron işlerine uygulanır. Yinelenen işler ayrı hata işleme kullanır.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: Cron işleri için hata uyarılarını etkinleştirir (varsayılan: `false`).
- `after`: uyarı tetiklenmeden önceki ardışık hata sayısı (pozitif tamsayı, min: `1`).
- `cooldownMs`: aynı iş için yinelenen uyarılar arasındaki en düşük milisaniye süresi (negatif olmayan tamsayı).
- `mode`: teslim modu — `"announce"` kanal mesajı üzerinden gönderir; `"webhook"` yapılandırılmış Webhook'a `POST` gönderir.
- `accountId`: uyarı teslimini kapsamlamak için isteğe bağlı hesap veya kanal kimliği.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Tüm işler genelinde Cron hata bildirimleri için varsayılan hedef.
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi mevcutsa varsayılan `"announce"` olur.
- `channel`: announce teslimi için kanal geçersiz kılması. `"last"`, bilinen son teslim kanalını yeniden kullanır.
- `to`: açık announce hedefi veya Webhook URL'si. Webhook modu için gereklidir.
- `accountId`: teslim için isteğe bağlı hesap geçersiz kılması.
- İş başına `delivery.failureDestination`, bu genel varsayılanı geçersiz kılar.
- Ne genel ne de iş başına hata hedefi ayarlanmışsa zaten `announce` üzerinden teslim yapan işler, hata durumunda o birincil announce hedefine geri döner.
- `delivery.failureDestination`, yalnızca `sessionTarget="isolated"` işler için desteklenir; işin birincil `delivery.mode` değeri `"webhook"` ise bu sınırlama yoktur.

Bkz. [Cron Jobs](/tr/automation/cron-jobs). Yalıtılmış Cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya model şablon değişkenleri

`tools.media.models[].args` içinde genişletilen şablon yer tutucuları:

| Değişken         | Açıklama                                        |
| ---------------- | ----------------------------------------------- |
| `{{Body}}`       | Tam gelen mesaj gövdesi                         |
| `{{RawBody}}`    | Ham gövde (geçmiş/gönderen sarmalayıcıları yok) |
| `{{BodyStripped}}` | Grup bahsetmeleri çıkarılmış gövde           |
| `{{From}}`       | Gönderen tanımlayıcısı                          |
| `{{To}}`         | Hedef tanımlayıcısı                             |
| `{{MessageSid}}` | Kanal mesaj kimliği                             |
| `{{SessionId}}`  | Geçerli oturum UUID'si                          |
| `{{IsNewSession}}` | Yeni oturum oluşturulduğunda `"true"`         |
| `{{MediaUrl}}`   | Gelen medya pseudo-URL'si                       |
| `{{MediaPath}}`  | Yerel medya yolu                                |
| `{{MediaType}}`  | Medya türü (görsel/ses/belge/…)                 |
| `{{Transcript}}` | Ses transcript'i                                |
| `{{Prompt}}`     | CLI girdileri için çözümlenmiş medya istemi     |
| `{{MaxChars}}`   | CLI girdileri için çözümlenmiş en yüksek çıktı karakteri |
| `{{ChatType}}`   | `"direct"` veya `"group"`                       |
| `{{GroupSubject}}` | Grup konusu (en iyi çaba)                     |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (en iyi çaba)         |
| `{{SenderName}}` | Gönderen görünen adı (en iyi çaba)              |
| `{{SenderE164}}` | Gönderen telefon numarası (en iyi çaba)         |
| `{{Provider}}`   | Sağlayıcı ipucu (whatsapp, telegram, discord vb.) |

---

## Yapılandırma include'ları (`$include`)

Yapılandırmayı birden çok dosyaya bölün:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Birleştirme davranışı:**

- Tek dosya: kapsayan nesnenin yerini alır.
- Dosya dizisi: sırayla derin birleştirilir (sonraki öncekini geçersiz kılar).
- Kardeş anahtarlar: include'lardan sonra birleştirilir (include edilen değerleri geçersiz kılar).
- İç içe include'lar: en fazla 10 seviye derinlik.
- Yollar: include eden dosyaya göre çözülür, ancak üst düzey yapılandırma dizini (`openclaw.json` dosyasının `dirname` değeri) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca bu sınır içinde çözülmeye devam ediyorlarsa izin verilir.
- Yalnızca tek bir üst düzey bölümü değiştiren ve tek dosyalı include ile desteklenen OpenClaw sahipli yazımlar, o include edilen dosyaya yazılır. Örneğin `plugins install`, `plugins: { $include: "./plugins.json5" }` için `plugins.json5` dosyasını günceller ve `openclaw.json` dosyasını olduğu gibi bırakır.
- Kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar OpenClaw sahipli yazımlar için salt okunurdur; bu yazımlar yapılandırmayı düzleştirmek yerine kapalı varsayımla başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için açık mesajlar.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
