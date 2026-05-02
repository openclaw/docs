---
read_when:
    - Alan düzeyindeki yapılandırma semantiğini veya varsayılan değerleri tam olarak bilmeniz gerekiyor
    - Kanal, model, Gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Temel OpenClaw anahtarları, varsayılanlar ve özel alt sistem başvurularına bağlantılar için Gateway yapılandırma başvurusu
title: Yapılandırma referansı
x-i18n:
    generated_at: "2026-05-02T20:44:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 559a52c9ea7428aa0a33b9699eaf144aa114638acf57f813217642319ce77987
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` için çekirdek yapılandırma başvurusu. Görev odaklı genel bakış için bkz. [Yapılandırma](/tr/gateway/configuration).

Ana OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendi daha derin başvurusu olduğunda bağlantı verir. Kanal ve Plugin sahipliğindeki komut katalogları ile derin bellek/QMD ayarları bu sayfa yerine kendi sayfalarında yer alır.

Kod gerçeği:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema'yı, kullanılabildiğinde paketlenmiş/Plugin/kanal meta verileri birleştirilmiş halde yazdırır
- `config.schema.lookup`, ayrıntılı inceleme araçları için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, yapılandırma belgeleri temel karma değerini geçerli şema yüzeyine göre doğrular

Ajan arama yolu: düzenlemelerden önce kesin alan düzeyi belgeler ve kısıtlamalar için
`gateway` araç eylemi `config.schema.lookup` kullanın. Görev odaklı rehberlik için
[Yapılandırma](/tr/gateway/configuration) sayfasını, daha geniş alan haritası,
varsayılanlar ve alt sistem başvurularına bağlantılar için bu sayfayı kullanın.

Ayrılmış derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki dreaming yapılandırması için [Bellek yapılandırması başvurusu](/tr/reference/memory-config)
- Geçerli yerleşik + paketlenmiş komut kataloğu için [Eğik çizgi komutları](/tr/tools/slash-commands)
- Kanala özgü komut yüzeyleri için sahip kanal/Plugin sayfaları

Yapılandırma biçimi **JSON5**'tir (yorumlara + sonda virgüllere izin verilir). Tüm alanlar isteğe bağlıdır — atlandığında OpenClaw güvenli varsayılanları kullanır.

---

## Kanallar

Kanal başına yapılandırma anahtarları ayrılmış bir sayfaya taşındı — Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage ve diğer paketlenmiş kanallar dahil olmak üzere
`channels.*` için [Yapılandırma — kanallar](/tr/gateway/config-channels) sayfasına bakın
(kimlik doğrulama, erişim denetimi, çoklu hesap, mention gating).

## Ajan varsayılanları, çoklu ajan, oturumlar ve mesajlar

Ayrılmış bir sayfaya taşındı — şunlar için
[Yapılandırma — ajanlar](/tr/gateway/config-agents) sayfasına bakın:

- `agents.defaults.*` (çalışma alanı, model, düşünme, heartbeat, bellek, medya, skills, sandbox)
- `multiAgent.*` (çoklu ajan yönlendirme ve bağlamalar)
- `session.*` (oturum yaşam döngüsü, compaction, budama)
- `messages.*` (mesaj teslimi, TTS, markdown işleme)
- `talk.*` (Talk modu)
  - `talk.speechLocale`: iOS/macOS üzerinde Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği
  - `talk.silenceTimeoutMs`: ayarlanmadığında Talk, dökümü göndermeden önce platformun varsayılan duraklama penceresini korur (`macOS ve Android üzerinde 700 ms, iOS üzerinde 900 ms`)

## Araçlar ve özel sağlayıcılar

Araç ilkesi, deneysel geçişler, sağlayıcı destekli araç yapılandırması ve özel
sağlayıcı / temel URL kurulumu ayrılmış bir sayfaya taşındı — bkz.
[Yapılandırma — araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## Modeller

Sağlayıcı tanımları, model izin listeleri ve özel sağlayıcı kurulumu
[Yapılandırma — araçlar ve özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) içinde yer alır.
`models` kökü ayrıca genel model kataloğu davranışına sahiptir.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: sağlayıcı kataloğu davranışı (`merge` veya `replace`).
- `models.providers`: sağlayıcı kimliğine göre anahtarlanmış özel sağlayıcı haritası.
- `models.pricing.enabled`: sidecar'lar ve kanallar Gateway hazır yoluna ulaştıktan sonra başlayan arka plan fiyatlandırma önyüklemesini denetler. `false` olduğunda Gateway, OpenRouter ve LiteLLM fiyatlandırma kataloğu getirmelerini atlar; yapılandırılmış `models.providers.*.models[].cost` değerleri yerel maliyet tahminleri için çalışmaya devam eder.

## MCP

OpenClaw tarafından yönetilen MCP sunucu tanımları `mcp.servers` altında yer alır ve
gömülü Pi ile diğer çalışma zamanı adaptörleri tarafından tüketilir. `openclaw mcp list`,
`show`, `set` ve `unset` komutları, yapılandırma düzenlemeleri sırasında hedef
sunucuya bağlanmadan bu bloğu yönetir.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: yapılandırılmış MCP araçlarını açığa çıkaran çalışma zamanları için adlandırılmış stdio veya uzak MCP sunucu tanımları.
  Uzak girdiler `transport: "streamable-http"` veya `transport: "sse"` kullanır;
  `type: "http"`, `openclaw mcp set` ve `openclaw doctor --fix` tarafından standart `transport` alanına normalleştirilen CLI'ye özgü bir takma addır.
- `mcp.sessionIdleTtlMs`: oturum kapsamlı paketlenmiş MCP çalışma zamanları için boşta kalma TTL'si.
  Tek seferlik gömülü çalıştırmalar, çalıştırma sonu temizliği ister; bu TTL,
  uzun ömürlü oturumlar ve gelecekteki çağıranlar için emniyet noktasıdır.
- `mcp.*` altındaki değişiklikler, önbelleğe alınmış oturum MCP çalışma zamanlarını elden çıkararak anında uygulanır.
  Bir sonraki araç keşfi/kullanımı bunları yeni yapılandırmadan yeniden oluşturur; bu nedenle kaldırılan `mcp.servers` girdileri, boşta kalma TTL'sini beklemek yerine hemen toplanır.

Çalışma zamanı davranışı için [MCP](/tr/cli/mcp#openclaw-as-an-mcp-client-registry) ve
[CLI arka uçları](/tr/gateway/cli-backends#bundle-mcp-overlays) sayfalarına bakın.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: yalnızca paketlenmiş skills için isteğe bağlı izin listesi (yönetilen/çalışma alanı skills etkilenmez).
- `load.extraDirs`: ek paylaşılan skill kökleri (en düşük öncelik).
- `install.preferBrew`: true olduğunda, `brew` kullanılabiliyorsa diğer kurucu türlerine dönmeden önce Homebrew kurucularını tercih eder.
- `install.nodeManager`: `metadata.openclaw.install` belirtimleri için node kurucu tercihi (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false`, paketlenmiş/kurulu olsa bile bir skill'i devre dışı bırakır.
- `entries.<skillKey>.apiKey`: birincil env var bildiren skills için kolaylık (düz metin dizesi veya SecretRef nesnesi).

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
- Keşif, yerel OpenClaw Plugin'leri ile uyumlu Codex paketlerini ve Claude paketlerini, manifest içermeyen Claude varsayılan düzen paketleri dahil kabul eder.
- **Yapılandırma değişiklikleri gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen Plugin'ler yüklenir). `deny` kazanır.
- `plugins.entries.<id>.apiKey`: Plugin düzeyi API anahtarı kolaylık alanı (Plugin tarafından desteklendiğinde).
- `plugins.entries.<id>.env`: Plugin kapsamlı env var haritası.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda çekirdek, `before_prompt_build` öğesini engeller ve eski `before_agent_start` içinden prompt'u değiştiren alanları yok sayar; eski `modelOverride` ve `providerOverride` korunur. Yerel Plugin hook'larına ve desteklenen paket tarafından sağlanan hook dizinlerine uygulanır.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` olduğunda, güvenilen paket dışı Plugin'ler `llm_input`, `llm_output`, `before_agent_finalize` ve `agent_end` gibi tipli hook'lardan ham konuşma içeriğini okuyabilir.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu Plugin'in arka plan alt ajan çalıştırmaları için çalıştırma başına `provider` ve `model` geçersiz kılmaları istemesine açıkça güven.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilen alt ajan geçersiz kılmaları için standart `provider/model` hedeflerinin isteğe bağlı izin listesi. `"*"` değerini yalnızca herhangi bir modele izin vermeyi özellikle istediğinizde kullanın.
- `plugins.entries.<id>.config`: Plugin tanımlı yapılandırma nesnesi (kullanılabildiğinde yerel OpenClaw Plugin şeması tarafından doğrulanır).
- Kanal Plugin hesabı/çalışma zamanı ayarları `channels.<id>` altında yer alır ve merkezi bir OpenClaw seçenek kayıt defteri tarafından değil, sahip Plugin'in manifest `channelConfigs` meta verileri tarafından açıklanmalıdır.
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web getirme sağlayıcı ayarları.
  - `apiKey`: Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` env var değerine geri döner.
  - `baseUrl`: Firecrawl API temel URL'si (varsayılan: `https://api.firecrawl.dev`; kendi barındırılan geçersiz kılmalar özel/iç uç noktaları hedeflemelidir).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkarır (varsayılan: `true`).
  - `maxAgeMs`: milisaniye cinsinden azami önbellek yaşı (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: scrape isteği zaman aşımı, saniye cinsinden (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web araması) ayarları.
  - `enabled`: X Search sağlayıcısını etkinleştirir.
  - `model`: arama için kullanılacak Grok modeli (örn. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: bellek dreaming ayarları. Aşamalar ve eşikler için [Dreaming](/tr/concepts/dreaming) sayfasına bakın.
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam dreaming taraması için cron ritmi (varsayılan olarak `"0 3 * * *"`).
  - `model`: isteğe bağlı Dream Diary alt ajan model geçersiz kılması. `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir; hedefleri kısıtlamak için `allowedModels` ile eşleştirin. Model kullanılamaz hataları oturum varsayılan modeliyle bir kez yeniden denenir; güven veya izin listesi hataları sessizce geri dönmez.
  - aşama ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya dönük yapılandırma anahtarları değildir).
- Tam bellek yapılandırması [Bellek yapılandırması başvurusu](/tr/reference/memory-config) içinde yer alır:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude paket Plugin'leri, `settings.json` içinden gömülü Pi varsayılanlarına da katkıda bulunabilir; OpenClaw bunları ham OpenClaw yapılandırma yamaları olarak değil, temizlenmiş ajan ayarları olarak uygular.
- `plugins.slots.memory`: etkin bellek Plugin kimliğini seçin veya bellek Plugin'lerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: etkin bağlam motoru Plugin kimliğini seçin; başka bir motor kurup seçmediğiniz sürece varsayılan olarak `"legacy"` kullanılır.

Bkz. [Plugin'ler](/tr/tools/plugin).

---

## Tarayıcı

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
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
- `tabCleanup`, boşta kalma süresinden sonra veya bir oturum sınırını aştığında izlenen birincil aracı sekmelerini geri alır. Bu tekil temizleme modlarını devre dışı bırakmak için `idleMinutes: 0` veya `maxTabsPerSession: 0` ayarlayın.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ayarlanmamışken devre dışıdır, bu nedenle tarayıcı gezintisi varsayılan olarak sıkı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezintisine bilerek güvendiğinizde ayarlayın.
- Sıkı modda, uzak CDP profil uç noktaları (`profiles.*.cdpUrl`) erişilebilirlik/keşif kontrolleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski takma ad olarak desteklenmeye devam eder.
- Sıkı modda, açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca eklenme modundadır (başlatma/durdurma/sıfırlama devre dışı).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw’ın `/json/version` keşfetmesini istediğinizde HTTP(S) kullanın; sağlayıcınız size doğrudan bir DevTools WebSocket URL’si verdiğinde WS(S) kullanın.
- `remoteCdpTimeoutMs` ve `remoteCdpHandshakeTimeoutMs`, uzak ve `attachOnly` CDP erişilebilirliğine, ayrıca sekme açma isteklerine uygulanır. Yönetilen loopback profilleri yerel CDP varsayılanlarını korur.
- Haricen yönetilen bir CDP hizmetine loopback üzerinden erişilebiliyorsa, ilgili profilin `attachOnly: true` değerini ayarlayın; aksi halde OpenClaw loopback bağlantı noktasını yerel yönetilen tarayıcı profili olarak değerlendirir ve yerel bağlantı noktası sahipliği hataları bildirebilir.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve seçilen ana makineye veya bağlı bir tarayıcı düğümü üzerinden eklenebilir.
- `existing-session` profilleri, Brave veya Edge gibi belirli bir Chromium tabanlı tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri geçerli Chrome MCP rota sınırlarını korur:
  CSS seçici hedefleme yerine anlık görüntü/ref odaklı eylemler, tek dosya yükleme kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; `cdpUrl` değerini yalnızca uzak CDP için açıkça ayarlayın.
- Yerel yönetilen profiller, o profil için genel `browser.executablePath` değerini geçersiz kılmak üzere `executablePath` ayarlayabilir. Bunu bir profili Chrome’da, başka bir profili Brave’de çalıştırmak için kullanın.
- Yerel yönetilen profiller, süreç başladıktan sonra Chrome CDP HTTP keşfi için `browser.localLaunchTimeoutMs`, başlatma sonrası CDP websocket hazır oluşu için `browser.localCdpReadyTimeoutMs` kullanır. Chrome’un başarıyla başladığı ancak hazır oluş kontrollerinin başlatmayla yarıştığı daha yavaş ana makinelerde bunları yükseltin. Her iki değer de `120000` ms’ye kadar pozitif tam sayı olmalıdır; geçersiz yapılandırma değerleri reddedilir.
- Otomatik algılama sırası: Chromium tabanlıysa varsayılan tarayıcı → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` ve `browser.profiles.<name>.executablePath`, Chromium başlatılmadan önce işletim sistemi ana dizininiz için `~` ve `~/...` değerlerini kabul eder.
  `existing-session` profillerindeki profil başına `userDataDir` de tilde genişletmesine tabidir.
- Denetim hizmeti: yalnızca loopback (bağlantı noktası `gateway.port` değerinden türetilir, varsayılan `18791`).
- `extraArgs`, yerel Chromium başlangıcına ek başlatma bayrakları ekler (örneğin `--disable-gpu`, pencere boyutlandırma veya hata ayıklama bayrakları).

---

## Kullanıcı Arayüzü

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: yerel uygulama kullanıcı arayüzü çerçevesi için vurgu rengi (Konuşma Modu balon tonu vb.).
- `assistant`: Denetim kullanıcı arayüzü kimlik geçersiz kılması. Etkin aracı kimliğine geri döner.

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
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
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
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
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

<Accordion title="Gateway alanı ayrıntıları">

- `mode`: `local` (Gateway’i çalıştır) veya `remote` (uzak Gateway’e bağlan). Gateway, `local` değilse başlamayı reddeder.
- `port`: WS + HTTP için tek çoklanmış bağlantı noktası. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP’si) veya `custom`.
- **Eski bind takma adları**: `gateway.bind` içinde host takma adlarını (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind, konteyner içinde `127.0.0.1` üzerinde dinler. Docker bridge ağıyla (`-p 18789:18789`) trafik `eth0` üzerinden gelir, bu nedenle Gateway’e ulaşılamaz. Tüm arayüzlerde dinlemek için `--network host` kullanın veya `bind: "lan"` ayarlayın (ya da `customBindHost: "0.0.0.0"` ile `bind: "custom"` kullanın).
- **Kimlik doğrulama**: varsayılan olarak zorunludur. local loopback dışı bind’ler Gateway kimlik doğrulaması gerektirir. Pratikte bu, paylaşılan bir token/parola veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkındalığı olan bir ters proxy anlamına gelir. Onboarding sihirbazı varsayılan olarak bir token oluşturur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef’ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. İkisi de yapılandırılmışken mode ayarlanmamışsa başlatma ve servis kurulum/onarım akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık kimlik doğrulamasız mod. Yalnızca güvenilir local loopback kurulumları için kullanın; bu seçenek bilinçli olarak onboarding istemlerinde sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: tarayıcı/kullanıcı kimlik doğrulamasını kimlik farkındalığı olan bir ters proxy’ye devreder ve `gateway.trustedProxies` üzerinden gelen kimlik başlıklarına güvenir (bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)). Bu mod varsayılan olarak **local loopback dışı** bir proxy kaynağı bekler; aynı host üzerindeki local loopback ters proxy’leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir. Dahili aynı-host çağırıcıları, yerel doğrudan yedek olarak `gateway.auth.password` kullanabilir; `gateway.auth.token`, trusted-proxy modu ile karşılıklı olarak dışlayıcı kalır.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik başlıkları Kontrol UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını **kullanmaz**; bunun yerine Gateway’in normal HTTP kimlik doğrulama modunu izler. Bu tokensız akış, Gateway host’unun güvenilir olduğunu varsayar. `tailscale.mode = "serve"` olduğunda varsayılan değer `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP’si ve kimlik doğrulama kapsamı başına uygulanır (shared-secret ve device-token ayrı izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Asenkron Tailscale Serve Kontrol UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler, hata yazımı öncesinde serileştirilir. Bu nedenle aynı istemciden gelen eşzamanlı hatalı denemeler, ikisi de düz eşleşmezlik olarak yarışıp geçmek yerine ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` olur; localhost trafiğinin de hız sınırına tabi olmasını özellikle istediğinizde (test kurulumları veya katı proxy dağıtımları için) `false` olarak ayarlayın.
- Tarayıcı-origin WS kimlik doğrulama denemeleri, local loopback muafiyeti devre dışı bırakılmış şekilde her zaman kısıtlanır (tarayıcı tabanlı localhost kaba kuvvet saldırılarına karşı derinlemesine savunma).
- local loopback üzerinde, bu tarayıcı-origin kilitlemeleri normalize edilmiş `Origin`
  değeri başına yalıtılır; bu nedenle bir localhost origin’inden tekrarlanan başarısızlıklar farklı bir origin’i otomatik olarak
  kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, local loopback bind) veya `funnel` (genel, kimlik doğrulama gerektirir).
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı-origin izin listesi. Tarayıcı istemcileri local loopback dışı origin’lerden beklendiğinde zorunludur.
- `controlUi.chatMessageMaxWidth`: gruplanmış Kontrol UI sohbet mesajları için isteğe bağlı max-width. `960px`, `82%`, `min(1280px, 82%)` ve `calc(100% - 2rem)` gibi sınırlandırılmış CSS genişlik değerlerini kabul eder.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: kasıtlı olarak Host başlığı origin ilkesine dayanan dağıtımlar için Host başlığı origin yedeğini etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için `remote.url` `ws://` veya `wss://` olmalıdır.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: düz metin `ws://` kullanımını güvenilir özel-ağ
  IP’lerine izin veren istemci tarafı süreç ortamı
  son çare geçersiz kılması; düz metin için varsayılan local loopback ile sınırlı kalır. Bunun bir `openclaw.json`
  eşdeğeri yoktur ve
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` gibi tarayıcı özel-ağ yapılandırmaları Gateway
  WebSocket istemcilerini etkilemez.
- `gateway.remote.token` / `.password` uzak-istemci kimlik bilgisi alanlarıdır. Tek başlarına Gateway kimlik doğrulamasını yapılandırmazlar.
- `gateway.push.apns.relay.baseUrl`: resmi/TestFlight iOS derlemeleri relay destekli kayıtları Gateway’e yayımladıktan sonra kullanılan harici APNs relay’i için temel HTTPS URL’si. Bu URL, iOS derlemesine derlenen relay URL’siyle eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: Gateway’den relay’e gönderim zaman aşımı, milisaniye cinsinden. Varsayılan: `10000`.
- Relay destekli kayıtlar belirli bir Gateway kimliğine devredilir. Eşleştirilmiş iOS uygulaması `gateway.identity.get` alır, bu kimliği relay kaydına dahil eder ve kayıt kapsamlı bir gönderim iznini Gateway’e iletir. Başka bir Gateway bu saklanan kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici env geçersiz kılmaları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: local loopback HTTP relay URL’leri için yalnızca geliştirme amaçlı kaçış yolu. Üretim relay URL’leri HTTPS üzerinde kalmalıdır.
- `gateway.handshakeTimeoutMs`: kimlik doğrulama öncesi Gateway WebSocket el sıkışma zaman aşımı, milisaniye cinsinden. Varsayılan: `15000`. Ayarlandığında `OPENCLAW_HANDSHAKE_TIMEOUT_MS` önceliklidir. Başlangıç ısınması hâlâ otururken yerel istemcilerin bağlanabildiği yüklü veya düşük güçlü host’larda bunu artırın.
- `gateway.channelHealthCheckMinutes`: kanal sağlık izleyicisi aralığı, dakika cinsinden. Sağlık izleyicisi yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: bayat-soket eşiği, dakika cinsinden. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına en fazla sağlık izleyicisi yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izleyici etkin kalırken sağlık izleyicisi yeniden başlatmaları için kanal başına devre dışı bırakma.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap başına geçersiz kılma. Ayarlandığında kanal düzeyi geçersiz kılmaya göre önceliklidir.
- Yerel Gateway çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa yedek olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenmemişse, çözümleme kapalı kalacak şekilde başarısız olur (uzak yedek maskelemesi yoktur).
- `trustedProxies`: TLS’yi sonlandıran veya forwarded-client başlıkları enjekte eden ters proxy IP’leri. Yalnızca kontrol ettiğiniz proxy’leri listeleyin. local loopback girdileri, aynı-host proxy/yerel algılama kurulumları için hâlâ geçerlidir (örneğin Tailscale Serve veya yerel bir ters proxy), ancak local loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hâle **getirmezler**.
- `allowRealIpFallback`: `true` olduğunda Gateway, `X-Forwarded-For` eksikse `X-Real-IP` kabul eder. Kapalı kalacak şekilde başarısız olma davranışı için varsayılan `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: istenen kapsam olmadan ilk kez Node cihaz eşleştirmesini otomatik onaylamak için isteğe bağlı CIDR/IP izin listesi. Ayarlanmamışsa devre dışıdır. Bu, operatör/tarayıcı/Kontrol UI/WebChat eşleştirmesini otomatik onaylamaz ve rol, kapsam, metadata veya public-key yükseltmelerini otomatik onaylamaz.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: eşleştirme ve platform izin listesi değerlendirmesinden sonra bildirilen Node komutları için genel izin/ret şekillendirmesi. `camera.snap`, `camera.clip` ve `screen.record` gibi tehlikeli Node komutlarını dahil etmek için `allowCommands` kullanın; `denyCommands`, bir platform varsayılanı veya açık izin normalde içerse bile komutu kaldırır. Bir Node bildirilen komut listesini değiştirdikten sonra, Gateway’in güncellenmiş komut anlık görüntüsünü saklaması için o cihaz eşleştirmesini reddedip yeniden onaylayın.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek araç adları (varsayılan ret listesini genişletir).
- `gateway.tools.allow`: araç adlarını varsayılan HTTP ret listesinden kaldırır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdisi sertleştirmesi:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarlanmamış kabul edilir; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt sertleştirme başlığı:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca kontrol ettiğiniz HTTPS origin’leri için ayarlayın; bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çoklu örnek yalıtımı

Benzersiz bağlantı noktaları ve state dizinleriyle tek host üzerinde birden fazla Gateway çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Kolaylık bayrakları: `--dev` (`~/.openclaw-dev` + bağlantı noktası `19001` kullanır), `--profile <name>` (`~/.openclaw-<name>` kullanır).

Bkz. [Birden Fazla Gateway](/tr/gateway/multiple-gateways).

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

- `enabled`: Gateway dinleyicisinde TLS sonlandırmasını (HTTPS/WSS) etkinleştirir (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel kendinden imzalı bir cert/key çifti otomatik oluşturur; yalnızca yerel/dev kullanımı içindir.
- `certPath`: TLS sertifika dosyasının dosya sistemi yolu.
- `keyPath`: TLS private key dosyasının dosya sistemi yolu; izinlerini kısıtlı tutun.
- `caPath`: istemci doğrulaması veya özel güven zincirleri için isteğe bağlı CA bundle yolu.

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
  - `"off"`: canlı düzenlemeleri yok say; değişiklikler açık bir yeniden başlatma gerektirir.
  - `"restart"`: yapılandırma değiştiğinde Gateway sürecini her zaman yeniden başlat.
  - `"hot"`: değişiklikleri yeniden başlatmadan süreç içinde uygula.
  - `"hybrid"` (varsayılan): önce hot reload dene; gerekirse yeniden başlatmaya geri dön.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tamsayı).
- `deferralTimeoutMs`: yeniden başlatmayı zorlamadan önce devam eden işlemleri beklemek için ms cinsinden isteğe bağlı azami süre. Varsayılan sınırlandırılmış beklemeyi (`300000`) kullanmak için bunu atlayın; süresiz beklemek ve periyodik hâlâ-beklemede uyarıları günlüğe yazmak için `0` ayarlayın.

---

## Hook’lar

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
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Kimlik doğrulama: `Authorization: Bearer <token>` veya `x-openclaw-token: <token>`.
Sorgu dizesi hook tokenları reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, `gateway.auth.token` değerinden **farklı** olmalıdır; Gateway tokenının yeniden kullanılması reddedilir.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini sınırlandırın (örneğin `["hook:"]`).
- Bir eşleme veya ön ayar şablonlu bir `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` değerini ayarlayın ve `hooks.allowRequestSessionKey=true` yapın. Statik eşleme anahtarları bu açık katılımı gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükündeki `sessionKey` yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` üzerinden çözümlenir
  - Şablonla işlenmiş eşleme `sessionKey` değerleri dışarıdan sağlanmış kabul edilir ve ayrıca `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Eşleme ayrıntıları">

- `match.path`, `/hooks` sonrasındaki alt yolla eşleşir (örn. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanıyla eşleşir.
- `{{messages[0].subject}}` gibi şablonlar yükten okur.
- `transform`, bir hook eylemi döndüren bir JS/TS modülünü gösterebilir.
  - `transform.module` göreli bir yol olmalı ve `hooks.transformsDir` içinde kalmalıdır (mutlak yollar ve dizin dışına çıkma reddedilir).
  - `hooks.transformsDir` değerini `~/.openclaw/hooks/transforms` altında tutun; çalışma alanı Skills dizinleri reddedilir. `openclaw doctor` bu yolu geçersiz olarak bildirirse transform modülünü hooks transform dizinine taşıyın veya `hooks.transformsDir` değerini kaldırın.
- `agentId`, belirli bir ajana yönlendirir; bilinmeyen kimlikler varsayılana geri döner.
- `allowedAgentIds`: açık yönlendirmeyi sınırlandırır (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan yapılan hook ajan çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranlarının ve şablon odaklı eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin verir (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri için isteğe bağlı ön ek izin listesi (istek + eşleme), örn. `["hook:"]`. Herhangi bir eşleme veya ön ayar şablonlu bir `sessionKey` kullandığında zorunlu hale gelir.
- `deliver: true`, son yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` olur.
- `model`, bu hook çalıştırması için LLM'yi geçersiz kılar (model kataloğu ayarlanmışsa izin verilmiş olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail ön ayarı `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- Bu ileti başına yönlendirmeyi korursanız `hooks.allowRequestSessionKey: true` ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanıyla eşleşecek şekilde sınırlandırın, örneğin `["hook:", "hook:gmail:"]`.
- `hooks.allowRequestSessionKey: false` gerekiyorsa ön ayarı şablonlu varsayılan yerine statik bir `sessionKey` ile geçersiz kılın.

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

## Canvas barındırıcısı

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Ajan tarafından düzenlenebilir HTML/CSS/JS ve A2UI'yi Gateway portu altında HTTP üzerinden sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` değerini koruyun (varsayılan).
- loopback dışı bağlamalar: canvas rotaları, diğer Gateway HTTP yüzeyleriyle aynı şekilde Gateway kimlik doğrulaması (token/parola/güvenilir proxy) gerektirir.
- Node WebView'ları genellikle kimlik doğrulama üst bilgileri göndermez; bir node eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için node kapsamlı yetenek URL'lerini duyurur.
- Yetenek URL'leri etkin node WS oturumuna bağlıdır ve hızlıca sona erer. IP tabanlı geri dönüş kullanılmaz.
- Sunulan HTML'ye canlı yeniden yükleme istemcisini enjekte eder.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- Ayrıca A2UI'yi `/__openclaw__/a2ui/` adresinde sunar.
- Değişiklikler bir gateway yeniden başlatması gerektirir.
- Büyük dizinler veya `EMFILE` hataları için canlı yeniden yüklemeyi devre dışı bırakın.

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

- `minimal` (varsayılan): TXT kayıtlarından `cliPath` + `sshPort` değerlerini çıkarır.
- `full`: `cliPath` + `sshPort` değerlerini dahil eder.
- Ana makine adı, geçerli bir DNS etiketi olduğunda varsayılan olarak sistem ana makine adını kullanır; aksi halde `openclaw` değerine geri döner. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

### Geniş alan (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` altında tek noktaya yayın DNS-SD bölgesi yazar. Ağlar arası keşif için bir DNS sunucusu (CoreDNS önerilir) + Tailscale bölünmüş DNS ile eşleyin.

Kurulum: `openclaw dns setup --apply`.

---

## Ortam

### `env` (satır içi env vars)

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

- Satır içi env vars yalnızca süreç ortamında ilgili anahtar yoksa uygulanır.
- `.env` dosyaları: CWD `.env` + `~/.openclaw/.env` (hiçbiri mevcut değişkenleri geçersiz kılmaz).
- `shellEnv`: eksik beklenen anahtarları oturum açma kabuğu profilinizden içe aktarır.
- Tam öncelik sırası için [Ortam](/tr/help/environment) bölümüne bakın.

### Env var değiştirme

Herhangi bir yapılandırma dizesinde env vars değerlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Yalnızca büyük harfli adlar eşleşir: `[A-Z_][A-Z0-9_]*`.
- Eksik/boş değişkenler yapılandırma yüklenirken hata oluşturur.
- Değişmez `${VAR}` için `$${VAR}` ile kaçış yapın.
- `$include` ile çalışır.

---

## Sırlar

Secret refs eklemelidir: düz metin değerler hâlâ çalışır.

### `SecretRef`

Tek bir nesne şekli kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Doğrulama:

- `provider` deseni: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` kimlik deseni: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` kimliği: mutlak JSON pointer (örneğin `"/providers/openai/apiKey"`)
- `source: "exec"` kimlik deseni: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` kimlikleri `.` veya `..` eğik çizgiyle ayrılmış yol segmentleri içermemelidir (örneğin `a/../b` reddedilir)

### Desteklenen kimlik bilgisi yüzeyi

- Standart matris: [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)
- `secrets apply`, desteklenen `openclaw.json` kimlik bilgisi yollarını hedefler.
- `auth-profiles.json` referansları çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.

### Gizli sağlayıcıları yapılandırması

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
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

- `file` sağlayıcısı `mode: "json"` ve `mode: "singleValue"` destekler (`id`, singleValue modunda `"value"` olmalıdır).
- Windows ACL doğrulaması kullanılamadığında dosya ve exec sağlayıcı yolları kapalı başarısız olur. `allowInsecurePath: true` değerini yalnızca doğrulanamayan güvenilir yollar için ayarlayın.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yükleri kullanır.
- Varsayılan olarak sembolik bağlantı komut yolları reddedilir. Çözümlenen hedef yolu doğrulanırken sembolik bağlantı yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın.
- `trustedDirs` yapılandırılmışsa güvenilir dizin denetimi çözümlenen hedef yola uygulanır.
- `exec` alt ortamı varsayılan olarak minimaldir; gerekli değişkenleri `passEnv` ile açıkça geçirin.
- Secret refs etkinleştirme sırasında bellek içi bir anlık görüntüye çözümlenir; ardından istek yolları yalnızca anlık görüntüyü okur.
- Etkin yüzey filtrelemesi etkinleştirme sırasında uygulanır: etkin yüzeylerde çözümlenmeyen referanslar başlatma/yeniden yüklemeyi başarısız yaparken etkin olmayan yüzeyler tanılamalarla atlanır.

---

## Kimlik doğrulama depolaması

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

- Ajan başına profiller `<agentDir>/auth-profiles.json` konumunda depolanır.
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyi referansları (`api_key` için `keyRef`, `token` için `tokenRef`) destekler.
- `{ "provider": { "apiKey": "..." } }` gibi eski düz `auth-profiles.json` eşlemeleri çalışma zamanı biçimi değildir; `openclaw doctor --fix` bunları `.legacy-flat.*.bak` yedeğiyle standart `provider:default` API anahtarı profillerine yeniden yazar.
- OAuth modu profilleri (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli auth-profile kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri bellek içi çözümlenmiş anlık görüntülerden gelir; eski statik `auth.json` girdileri keşfedildiğinde temizlenir.
- Eski OAuth içe aktarmaları `~/.openclaw/credentials/oauth.json` konumundan yapılır.
- Bkz. [OAuth](/tr/concepts/oauth).
- Secrets çalışma zamanı davranışı ve `audit/configure/apply` araçları: [Sırlar Yönetimi](/tr/gateway/secrets).

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

- `billingBackoffHours`: bir profil gerçek faturalandırma/yetersiz kredi hataları nedeniyle başarısız olduğunda saat cinsinden temel geri çekilme süresi (varsayılan: `5`). Açık faturalandırma metni, `401`/`403` yanıtlarında bile yine buraya düşebilir, ancak sağlayıcıya özgü metin eşleştiricileri onları sahibi olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya kuruluş/çalışma alanı harcama sınırı iletileri bunun yerine `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalandırma geri çekilme saatleri için isteğe bağlı sağlayıcı bazlı geçersiz kılmalar.
- `billingMaxHours`: faturalandırma geri çekilmesinin üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenli `auth_permanent` hataları için dakika cinsinden temel geri çekilme süresi (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan saat cinsinden kayan pencere (varsayılan: `24`).
- `overloadedProfileRotations`: model yedeğine geçmeden önce aşırı yük hataları için aynı sağlayıcıda en fazla auth-profile rotasyonu sayısı (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı-meşgul biçimleri buraya düşer.
- `overloadedBackoffMs`: aşırı yüklü bir sağlayıcı/profil rotasyonunu yeniden denemeden önceki sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model yedeğine geçmeden önce hız sınırı hataları için aynı sağlayıcıda en fazla auth-profile rotasyonu sayısı (varsayılan: `1`). Bu hız sınırı kovası `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

---

## Günlük Kaydı

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
- `--verbose` kullanıldığında `consoleLevel`, `debug` değerine yükselir.
- `maxFileBytes`: rotasyondan önce etkin günlük dosyasının bayt cinsinden en büyük boyutu (pozitif tam sayı; varsayılan: `104857600` = 100 MB). OpenClaw, etkin dosyanın yanında en fazla beş numaralandırılmış arşiv tutar.
- `redactSensitive` / `redactPatterns`: konsol çıktısı, dosya günlükleri, OTLP günlük kayıtları ve kalıcı oturum transkripti metni için en iyi çabayla maskeleme. `redactSensitive: "off"` yalnızca bu genel günlük/transkript ilkesini devre dışı bırakır; UI/araç/tanılama güvenlik yüzeyleri, yayından önce gizli bilgileri yine de redakte eder.

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
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
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

- `enabled`: enstrümantasyon çıktısı için ana anahtar (varsayılan: `true`).
- `flags`: hedefli günlük çıktısını etkinleştiren bayrak dizeleri dizisi (`"telegram.*"` veya `"*"` gibi joker karakterleri destekler).
- `stuckSessionWarnMs`: uzun süren işleme oturumlarını `session.long_running`, `session.stalled` veya `session.stuck` olarak sınıflandırmak için ms cinsinden ilerleme olmayan yaş eşiği. Yanıt, araç, durum, blok ve ACP ilerlemesi zamanlayıcıyı sıfırlar; tekrarlanan `session.stuck` tanılamaları değişiklik olmadıkça geri çekilir.
- `otel.enabled`: OpenTelemetry dışa aktarma hattını etkinleştirir (varsayılan: `false`). Tam yapılandırma, sinyal kataloğu ve gizlilik modeli için bkz. [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry).
- `otel.endpoint`: OTel dışa aktarımı için toplayıcı URL'si.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: isteğe bağlı sinyale özgü OTLP uç noktaları. Ayarlandıklarında yalnızca ilgili sinyal için `otel.endpoint` değerini geçersiz kılarlar.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC meta veri başlıkları.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarımını etkinleştirir.
- `otel.sampleRate`: iz örnekleme oranı `0`–`1`.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri boşaltma aralığı.
- `otel.captureContent`: OTEL span öznitelikleri için isteğe bağlı ham içerik yakalama. Varsayılan olarak kapalıdır. Boolean `true`, sistem dışı ileti/araç içeriğini yakalar; nesne biçimi `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` ve `systemPrompt` değerlerini açıkça etkinleştirmenizi sağlar.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: en yeni deneysel GenAI span sağlayıcı öznitelikleri için ortam anahtarı. Varsayılan olarak span'ler uyumluluk için eski `gen_ai.system` özniteliğini korur; GenAI metrikleri sınırlı semantik öznitelikler kullanır.
- `OPENCLAW_OTEL_PRELOADED=1`: halihazırda genel bir OpenTelemetry SDK kaydetmiş ana makineler için ortam anahtarı. OpenClaw bu durumda tanılama dinleyicilerini etkin tutarken Plugin'e ait SDK başlatma/kapatma işlemlerini atlar.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` ve `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: eşleşen yapılandırma anahtarı ayarlı olmadığında kullanılan sinyale özgü uç nokta ortam değişkenleri.
- `cacheTrace.enabled`: gömülü çalıştırmalar için önbellek izleme anlık görüntülerini günlüğe kaydet (varsayılan: `false`).
- `cacheTrace.filePath`: önbellek izleme JSONL için çıktı yolu (varsayılan: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: önbellek izleme çıktısına nelerin dahil edileceğini denetler (tümünün varsayılanı: `true`).

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

- `channel`: npm/git kurulumları için yayın kanalı — `"stable"`, `"beta"` veya `"dev"`.
- `checkOnStart`: Gateway başladığında npm güncellemelerini kontrol et (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka plan otomatik güncellemeyi etkinleştir (varsayılan: `false`).
- `auto.stableDelayHours`: kararlı kanal otomatik uygulamasından önce saat cinsinden minimum gecikme (varsayılan: `6`; en fazla: `168`).
- `auto.stableJitterHours`: saat cinsinden ek kararlı kanal yayılım penceresi (varsayılan: `12`; en fazla: `168`).
- `auto.betaCheckIntervalHours`: beta kanal kontrollerinin saat cinsinden çalışma sıklığı (varsayılan: `1`; en fazla: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
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

- `enabled`: genel ACP özellik kapısı (varsayılan: `true`; ACP gönderimini ve oluşturma olanaklarını gizlemek için `false` ayarlayın).
- `dispatch.enabled`: ACP oturum turu gönderimi için bağımsız kapı (varsayılan: `true`). ACP komutlarını kullanılabilir tutarken yürütmeyi engellemek için `false` ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı arka uç kimliği (kayıtlı bir ACP çalışma zamanı Plugin'i ile eşleşmelidir).
  Önce arka uç Plugin'ini kurun ve `plugins.allow` ayarlanmışsa arka uç Plugin kimliğini (örneğin `acpx`) ekleyin; aksi halde ACP arka ucu yüklenmez.
- `defaultAgent`: oluşturma işlemleri açık bir hedef belirtmediğinde yedek ACP hedef aracı kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen aracı kimliklerinin izin listesi; boş olması ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: aynı anda etkin olabilecek en fazla ACP oturumu sayısı.
- `stream.coalesceIdleMs`: akışla iletilen metin için ms cinsinden boşta boşaltma penceresi.
- `stream.maxChunkChars`: akışla iletilen blok projeksiyonunu bölmeden önceki en büyük parça boyutu.
- `stream.repeatSuppression`: her turda yinelenen durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı olarak akış yapar; `"final_only"` tur sonlandırıcı olaylarına kadar tamponlar.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önceki ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP turu başına yansıtılan en fazla asistan çıktı karakteri.
- `stream.maxSessionUpdateChars`: yansıtılan ACP durum/güncelleme satırları için en fazla karakter.
- `stream.tagVisibility`: akışla iletilen olaylar için etiket adlarından boolean görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum çalışanları için temizlemeye uygun hale gelmeden önce dakika cinsinden boşta TTL.
- `runtime.installCommand`: ACP çalışma zamanı ortamını önyüklerken çalıştırılacak isteğe bağlı kurulum komutu.

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

- `cli.banner.taglineMode` banner slogan stilini denetler:
  - `"random"` (varsayılan): dönüşümlü komik/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yok (banner başlığı/sürümü yine gösterilir).
- Tüm banner'ı gizlemek için (yalnızca sloganları değil), `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

---

## Sihirbaz

CLI kılavuzlu kurulum akışları (`onboard`, `configure`, `doctor`) tarafından yazılan meta veriler:

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

[Aracı varsayılanları](/tr/gateway/config-agents#agent-defaults) altında `agents.list` kimlik alanlarına bakın.

---

## Köprü (eski, kaldırıldı)

Geçerli yapılar artık TCP köprüsünü içermez. Node'lar Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları temizleyebilir).

<Accordion title="Eski köprü yapılandırması (tarihsel referans)">

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
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: tamamlanan izole cron çalıştırma oturumlarının `sessions.json` dosyasından budanmadan önce ne kadar süre tutulacağı. Ayrıca arşivlenmiş silinmiş cron transkriptlerinin temizlenmesini denetler. Varsayılan: `24h`; devre dışı bırakmak için `false` ayarlayın.
- `runLog.maxBytes`: budamadan önce çalıştırma günlük dosyası (`cron/runs/<jobId>.jsonl`) başına en büyük boyut. Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: çalıştırma günlüğü budaması tetiklendiğinde tutulan en yeni satırlar. Varsayılan: `2000`.
- `webhookToken`: cron Webhook POST teslimi (`delivery.mode = "webhook"`) için kullanılan bearer token; atlanırsa kimlik doğrulama başlığı gönderilmez.
- `webhook`: yalnızca hâlâ `notify: true` içeren depolanmış işler için kullanılan, kullanımdan kaldırılmış eski yedek Webhook URL'si (http/https).

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

- `maxAttempts`: geçici hatalarda tek seferlik işler için maksimum yeniden deneme sayısı (varsayılan: `3`; aralık: `0`–`10`).
- `backoffMs`: her yeniden deneme girişimi için ms cinsinden bekleme gecikmeleri dizisi (varsayılan: `[30000, 60000, 300000]`; 1–10 giriş).
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
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: Cron işleri için hata uyarılarını etkinleştirir (varsayılan: `false`).
- `after`: bir uyarı tetiklenmeden önceki ardışık hata sayısı (pozitif tam sayı, min: `1`).
- `cooldownMs`: aynı iş için tekrarlanan uyarılar arasındaki minimum milisaniye (negatif olmayan tam sayı).
- `includeSkipped`: ardışık atlanan çalıştırmaları uyarı eşiğine dahil eder (varsayılan: `false`). Atlanan çalıştırmalar ayrı izlenir ve yürütme hatası bekleme süresini etkilemez.
- `mode`: teslim modu — `"announce"` bir kanal mesajı üzerinden gönderir; `"webhook"` yapılandırılan Webhook'a gönderir.
- `accountId`: uyarı teslimini kapsamlandırmak için isteğe bağlı hesap veya kanal kimliği.

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
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi bulunduğunda varsayılan `"announce"` olur.
- `channel`: announce teslimi için kanal geçersiz kılması. `"last"` bilinen son teslim kanalını yeniden kullanır.
- `to`: açık announce hedefi veya Webhook URL'si. Webhook modu için gereklidir.
- `accountId`: teslim için isteğe bağlı hesap geçersiz kılması.
- İş başına `delivery.failureDestination`, bu genel varsayılanı geçersiz kılar.
- Ne genel ne de iş başına hata hedefi ayarlandığında, zaten `announce` yoluyla teslim eden işler hata durumunda bu birincil announce hedefine geri döner.
- İşin birincil `delivery.mode` değeri `"webhook"` olmadığı sürece `delivery.failureDestination` yalnızca `sessionTarget="isolated"` işleri için desteklenir.

Bkz. [Cron İşleri](/tr/automation/cron-jobs). Yalıtılmış Cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya modeli şablon değişkenleri

`tools.media.models[].args` içinde genişletilen şablon yer tutucuları:

| Değişken           | Açıklama                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Gelen iletinin tam gövdesi                        |
| `{{RawBody}}`      | Ham gövde (geçmiş/gönderen sarmalayıcıları yok)   |
| `{{BodyStripped}}` | Grup bahsetmeleri çıkarılmış gövde                |
| `{{From}}`         | Gönderen tanımlayıcısı                            |
| `{{To}}`           | Hedef tanımlayıcısı                               |
| `{{MessageSid}}`   | Kanal ileti kimliği                               |
| `{{SessionId}}`    | Geçerli oturum UUID'si                            |
| `{{IsNewSession}}` | Yeni oturum oluşturulduğunda `"true"`             |
| `{{MediaUrl}}`     | Gelen medya sözde URL'si                          |
| `{{MediaPath}}`    | Yerel medya yolu                                  |
| `{{MediaType}}`    | Medya türü (görüntü/ses/belge/…)                  |
| `{{Transcript}}`   | Ses dökümü                                        |
| `{{Prompt}}`       | CLI girişleri için çözümlenen medya istemi        |
| `{{MaxChars}}`     | CLI girişleri için çözümlenen maksimum çıktı karakteri |
| `{{ChatType}}`     | `"direct"` veya `"group"`                         |
| `{{GroupSubject}}` | Grup konusu (elinden geldiğince)                  |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (elinden geldiğince)      |
| `{{SenderName}}`   | Gönderenin görünen adı (elinden geldiğince)       |
| `{{SenderE164}}`   | Gönderenin telefon numarası (elinden geldiğince)  |
| `{{Provider}}`     | Sağlayıcı ipucu (whatsapp, telegram, discord vb.) |

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
- Dosya dizisi: sırayla derin birleştirilir (sonrakiler öncekileri geçersiz kılar).
- Kardeş anahtarlar: include'lardan sonra birleştirilir (include edilen değerleri geçersiz kılar).
- İç içe include'lar: en fazla 10 seviye derine kadar.
- Yollar: include eden dosyaya göre çözümlenir, ancak üst düzey yapılandırma dizininin (`openclaw.json` için `dirname`) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca yine bu sınırın içinde çözümlendiklerinde izin verilir.
- OpenClaw'a ait, tek dosyalı bir include tarafından desteklenen yalnızca bir üst düzey bölümü değiştiren yazmalar, doğrudan o include edilen dosyaya yazılır. Örneğin, `plugins install`, `plugins: { $include: "./plugins.json5" }` değerini `plugins.json5` içinde günceller ve `openclaw.json` dosyasını olduğu gibi bırakır.
- Kök include'ları, include dizileri ve kardeş geçersiz kılmaları olan include'lar OpenClaw'a ait yazmalar için salt okunurdur; bu yazmalar yapılandırmayı düzleştirmek yerine kapalı şekilde başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için net mesajlar.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
