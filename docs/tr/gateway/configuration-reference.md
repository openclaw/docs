---
read_when:
    - Tam alan düzeyinde yapılandırma semantiğine veya varsayılanlara ihtiyacınız var
    - Kanal, model, Gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Temel OpenClaw anahtarları, varsayılan değerler ve özel alt sistem referanslarına bağlantılar için Gateway yapılandırma referansı
title: Yapılandırma referansı
x-i18n:
    generated_at: "2026-05-02T22:19:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2963e01c73d1d3dbd218d76d0c0709f58f8b92e4b3d4606105cedd91571b5ed
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` için çekirdek yapılandırma referansı. Görev odaklı bir genel bakış için bkz. [Yapılandırma](/tr/gateway/configuration).

Ana OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendi daha derin referansı olduğunda ona bağlantı verir. Kanal ve plugin tarafından sahiplenilen komut katalogları ile derin bellek/QMD ayarları bu sayfa yerine kendi sayfalarında yer alır.

Kod doğrusu:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema'yı yazdırır; mevcut olduğunda birlikte gelen/plugin/kanal metadata'sı birleştirilir
- `config.schema.lookup`, ayrıntıya inen araçlar için yol kapsamlı tek bir schema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, yapılandırma belgeleri temel hash'ini geçerli schema yüzeyine göre doğrular

Ajan arama yolu: Düzenlemelerden önce tam alan düzeyindeki belgeler ve kısıtlamalar için `gateway` araç eylemi `config.schema.lookup` kullanın. Görev odaklı rehberlik için [Yapılandırma](/tr/gateway/configuration) sayfasını, daha geniş alan haritası, varsayılanlar ve alt sistem referanslarına bağlantılar için bu sayfayı kullanın.

Ayrılmış derin referanslar:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki dreaming yapılandırması için [Bellek yapılandırma referansı](/tr/reference/memory-config)
- Geçerli yerleşik + birlikte gelen komut kataloğu için [Slash komutları](/tr/tools/slash-commands)
- Kanala özgü komut yüzeyleri için sahip kanal/plugin sayfaları

Yapılandırma biçimi **JSON5**'tir (yorumlar + sondaki virgüller desteklenir). Tüm alanlar isteğe bağlıdır — atlandığında OpenClaw güvenli varsayılanları kullanır.

---

## Kanallar

Kanal başına yapılandırma anahtarları ayrılmış bir sayfaya taşındı — Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve diğer birlikte gelen kanallar (kimlik doğrulama, erişim denetimi, çoklu hesap, bahsetme geçidi) dahil `channels.*` için bkz. [Yapılandırma — kanallar](/tr/gateway/config-channels).

## Ajan varsayılanları, çoklu ajan, oturumlar ve mesajlar

Ayrılmış bir sayfaya taşındı — şunlar için bkz. [Yapılandırma — ajanlar](/tr/gateway/config-agents):

- `agents.defaults.*` (çalışma alanı, model, düşünme, heartbeat, bellek, medya, skills, sandbox)
- `multiAgent.*` (çoklu ajan yönlendirmesi ve bağlamaları)
- `session.*` (oturum yaşam döngüsü, compaction, budama)
- `messages.*` (mesaj teslimi, TTS, markdown işleme)
- `talk.*` (Talk modu)
  - `talk.speechLocale`: iOS/macOS üzerinde Talk konuşma tanıma için isteğe bağlı BCP 47 locale id
  - `talk.silenceTimeoutMs`: ayarlanmadığında Talk, dökümü göndermeden önce platformun varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`)

## Araçlar ve özel sağlayıcılar

Araç ilkesi, deneysel geçişler, sağlayıcı destekli araç yapılandırması ve özel sağlayıcı / base-URL kurulumu ayrılmış bir sayfaya taşındı — bkz. [Yapılandırma — araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## Modeller

Sağlayıcı tanımları, model izin listeleri ve özel sağlayıcı kurulumu [Yapılandırma — araçlar ve özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) içinde yer alır. `models` kökü ayrıca genel model katalog davranışını da sahiplenir.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: sağlayıcı katalog davranışı (`merge` veya `replace`).
- `models.providers`: sağlayıcı kimliğine göre anahtarlanmış özel sağlayıcı haritası.
- `models.pricing.enabled`: sidecar'lar ve kanallar Gateway hazır yoluna ulaştıktan sonra başlayan arka plan fiyatlandırma bootstrap'ini denetler. `false` olduğunda Gateway, OpenRouter ve LiteLLM fiyatlandırma kataloğu getirmelerini atlar; yapılandırılmış `models.providers.*.models[].cost` değerleri yerel maliyet tahminleri için çalışmaya devam eder.

## MCP

OpenClaw tarafından yönetilen MCP sunucu tanımları `mcp.servers` altında yer alır ve gömülü Pi ile diğer çalışma zamanı adaptörleri tarafından tüketilir. `openclaw mcp list`, `show`, `set` ve `unset` komutları, yapılandırma düzenlemeleri sırasında hedef sunucuya bağlanmadan bu bloğu yönetir.

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
  Uzak girdiler `transport: "streamable-http"` veya `transport: "sse"` kullanır; `type: "http"`, `openclaw mcp set` ve `openclaw doctor --fix` tarafından kanonik `transport` alanına normalize edilen CLI'ye özgü bir alias'tır.
- `mcp.sessionIdleTtlMs`: oturum kapsamlı, birlikte gelen MCP çalışma zamanları için boşta kalma TTL'si.
  Tek seferlik gömülü çalıştırmalar, çalıştırma sonu temizliği ister; bu TTL uzun ömürlü oturumlar ve gelecekteki çağıranlar için yedektir.
- `mcp.*` altındaki değişiklikler, önbelleğe alınmış oturum MCP çalışma zamanlarını elden çıkararak sıcak uygulanır.
  Bir sonraki araç keşfi/kullanımı bunları yeni yapılandırmadan yeniden oluşturur; bu nedenle kaldırılan `mcp.servers` girdileri boşta kalma TTL'sini beklemek yerine hemen toplanır.

Çalışma zamanı davranışı için bkz. [MCP](/tr/cli/mcp#openclaw-as-an-mcp-client-registry) ve [CLI arka uçları](/tr/gateway/cli-backends#bundle-mcp-overlays).

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

- `allowBundled`: yalnızca birlikte gelen skills için isteğe bağlı izin listesi (yönetilen/çalışma alanı skills etkilenmez).
- `load.extraDirs`: ek paylaşılan skill kökleri (en düşük öncelik).
- `install.preferBrew`: true olduğunda, diğer yükleyici türlerine geri dönmeden önce `brew` mevcutsa Homebrew yükleyicilerini tercih eder.
- `install.nodeManager`: `metadata.openclaw.install` spesifikasyonları için node yükleyici tercihi (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false`, birlikte gelmiş/yüklenmiş olsa bile bir skill'i devre dışı bırakır.
- `entries.<skillKey>.apiKey`: birincil env var bildiren skills için kolaylık (düz metin string veya SecretRef nesnesi).

---

## Plugins

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

- `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` ve ayrıca `plugins.load.paths` içinden yüklenir.
- Keşif, yerel OpenClaw plugin'lerini ve uyumlu Codex paketleri ile Claude paketlerini, manifest içermeyen Claude varsayılan yerleşim paketleri dahil kabul eder.
- **Yapılandırma değişiklikleri gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen plugin'ler yüklenir). `deny` baskın gelir.
- `plugins.entries.<id>.apiKey`: plugin düzeyi API anahtarı kolaylık alanı (plugin tarafından desteklendiğinde).
- `plugins.entries.<id>.env`: plugin kapsamlı env var haritası.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda çekirdek, `before_prompt_build` öğesini engeller ve legacy `before_agent_start` içindeki prompt'u değiştiren alanları yok sayarken legacy `modelOverride` ve `providerOverride` değerlerini korur. Yerel plugin hook'ları ve desteklenen paket tarafından sağlanan hook dizinleri için geçerlidir.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` olduğunda, güvenilen ve birlikte gelmeyen plugin'ler `llm_input`, `llm_output`, `before_agent_finalize` ve `agent_end` gibi typed hook'lardan ham konuşma içeriğini okuyabilir.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu plugin'e arka plan alt ajan çalıştırmaları için çalıştırma başına `provider` ve `model` override'ları istemesi konusunda açıkça güven.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilen alt ajan override'ları için kanonik `provider/model` hedeflerinin isteğe bağlı izin listesi. `"*"` değerini yalnızca herhangi bir modele izin vermek istediğinizde kullanın.
- `plugins.entries.<id>.config`: plugin tarafından tanımlanan yapılandırma nesnesi (mevcut olduğunda yerel OpenClaw plugin schema'sı tarafından doğrulanır).
- Kanal plugin hesap/çalışma zamanı ayarları `channels.<id>` altında yer alır ve merkezi bir OpenClaw seçenek kayıt defteri tarafından değil, sahip plugin'in manifest `channelConfigs` metadata'sı tarafından açıklanmalıdır.
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch sağlayıcı ayarları.
  - `apiKey`: Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` env var'a geri döner.
  - `baseUrl`: Firecrawl API base URL'i (varsayılan: `https://api.firecrawl.dev`; self-hosted override'lar private/internal endpoint'leri hedeflemelidir).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkarır (varsayılan: `true`).
  - `maxAgeMs`: milisaniye cinsinden maksimum önbellek yaşı (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: kazıma isteği zaman aşımı, saniye cinsinden (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web search) ayarları.
  - `enabled`: X Search sağlayıcısını etkinleştirir.
  - `model`: arama için kullanılacak Grok modeli (örn. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: bellek dreaming ayarları. Aşamalar ve eşikler için bkz. [Dreaming](/tr/concepts/dreaming).
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam dreaming taraması için cron periyodu (varsayılan olarak `"0 3 * * *"`).
  - `model`: isteğe bağlı Dream Diary alt ajan model override'ı. `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir; hedefleri kısıtlamak için `allowedModels` ile eşleştirin. Modelin kullanılamadığı hatalar oturum varsayılan modeliyle bir kez yeniden denenir; güven veya izin listesi hataları sessizce geri düşmez.
  - aşama ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya dönük yapılandırma anahtarları değildir).
- Tam bellek yapılandırması [Bellek yapılandırma referansı](/tr/reference/memory-config) içinde yer alır:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude paket plugin'leri `settings.json` içinden gömülü Pi varsayılanlarına da katkıda bulunabilir; OpenClaw bunları ham OpenClaw yapılandırma yamaları olarak değil, temizlenmiş ajan ayarları olarak uygular.
- `plugins.slots.memory`: etkin bellek plugin kimliğini seçin veya bellek plugin'lerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: etkin bağlam motoru plugin kimliğini seçin; başka bir motor yükleyip seçmediğiniz sürece varsayılan `"legacy"` olur.

Bkz. [Plugins](/tr/tools/plugin).

---

## Taahhütler

`commitments`, çıkarımsal takip belleğini denetler: OpenClaw, konuşma dönüşlerinden check-in'leri algılayabilir ve bunları heartbeat çalıştırmaları üzerinden teslim edebilir.

- `commitments.enabled`: çıkarımsal takip taahhütleri için gizli LLM çıkarımını, depolamayı ve heartbeat teslimini etkinleştirir. Varsayılan: `false`.
- `commitments.maxPerDay`: kayan bir gün içinde ajan oturumu başına teslim edilen maksimum çıkarımsal takip taahhüdü. Varsayılan: `3`.

Bkz. [Çıkarımsal taahhütler](/tr/concepts/commitments).

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
- `tabCleanup`, izlenen birincil aracı sekmelerini boşta kalma süresinden sonra veya bir
  oturum sınırını aştığında geri kazanır. Bu bağımsız temizleme modlarını devre dışı
  bırakmak için `idleMinutes: 0` veya `maxTabsPerSession: 0` ayarlayın.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`, ayarlanmadığında devre dışıdır; bu nedenle tarayıcı gezinmesi varsayılan olarak katı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezinmesine bilerek güvendiğinizde ayarlayın.
- Katı modda, uzak CDP profil uç noktaları (`profiles.*.cdpUrl`) erişilebilirlik/keşif kontrolleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski diğer ad olarak desteklenmeye devam eder.
- Katı modda, açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca bağlanma modundadır (başlatma/durdurma/sıfırlama devre dışıdır).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw’ın `/json/version` keşfetmesini istediğinizde HTTP(S) kullanın; sağlayıcınız
  size doğrudan bir DevTools WebSocket URL’si verdiğinde WS(S) kullanın.
- `remoteCdpTimeoutMs` ve `remoteCdpHandshakeTimeoutMs`, uzak ve `attachOnly`
  CDP erişilebilirliğine ve sekme açma isteklerine uygulanır. Yönetilen loopback
  profilleri yerel CDP varsayılanlarını korur.
- Harici olarak yönetilen bir CDP hizmetine loopback üzerinden erişilebiliyorsa, o
  profilin `attachOnly: true` değerini ayarlayın; aksi takdirde OpenClaw loopback bağlantı noktasını
  yerel yönetilen tarayıcı profili olarak ele alır ve yerel bağlantı noktası sahipliği hataları bildirebilir.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve seçili ana makinede
  veya bağlı bir tarayıcı düğümü üzerinden bağlanabilir.
- `existing-session` profilleri, Brave veya Edge gibi belirli bir Chromium tabanlı
  tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri mevcut Chrome MCP rota sınırlarını korur:
  CSS seçici hedefleme yerine anlık görüntü/ref odaklı eylemler, tek dosya yükleme
  kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve
  `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; `cdpUrl`
  değerini yalnızca uzak CDP için açıkça ayarlayın.
- Yerel yönetilen profiller, o profil için genel `browser.executablePath` değerini
  geçersiz kılmak üzere `executablePath` ayarlayabilir. Bunu bir profili
  Chrome’da, diğerini Brave’de çalıştırmak için kullanın.
- Yerel yönetilen profiller, işlem başlatıldıktan sonra Chrome CDP HTTP
  keşfi için `browser.localLaunchTimeoutMs`, başlatma sonrası CDP websocket hazır olma durumu için
  `browser.localCdpReadyTimeoutMs` kullanır. Chrome’un başarıyla başladığı ancak
  hazır olma kontrollerinin başlangıçla yarıştığı daha yavaş ana makinelerde bunları artırın. Her iki değer de
  `120000` ms’ye kadar pozitif tam sayı olmalıdır; geçersiz yapılandırma değerleri reddedilir.
- Otomatik algılama sırası: Chromium tabanlıysa varsayılan tarayıcı → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` ve `browser.profiles.<name>.executablePath`, Chromium başlatılmadan önce
  işletim sistemi ana dizininiz için hem `~` hem de `~/...` kabul eder.
  `existing-session` profillerindeki profil başına `userDataDir` de tilde ile genişletilir.
- Denetim hizmeti: yalnızca loopback (bağlantı noktası `gateway.port` değerinden türetilir, varsayılan `18791`).
- `extraArgs`, yerel Chromium başlangıcına ek başlatma bayrakları ekler (örneğin
  `--disable-gpu`, pencere boyutlandırma veya hata ayıklama bayrakları).

---

## UI

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

- `seamColor`: yerel uygulama UI chrome için vurgu rengi (Konuşma Modu balon rengi vb.).
- `assistant`: Control UI kimliği geçersiz kılma. Etkin aracı kimliğine geri döner.

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

<Accordion title="Gateway field details">

- `mode`: `local` (Gateway’i çalıştır) veya `remote` (uzak Gateway’e bağlan). Gateway, `local` değilse başlatmayı reddeder.
- `port`: WS + HTTP için tek çoğullamalı port. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP), veya `custom`.
- **Eski bind diğer adları**: `gateway.bind` içinde host diğer adlarını (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind, kapsayıcının içinde `127.0.0.1` üzerinde dinler. Docker köprü ağı (`-p 18789:18789`) ile trafik `eth0` üzerinden gelir, bu yüzden Gateway’e ulaşılamaz. Tüm arayüzlerde dinlemek için `--network host` kullanın veya `bind: "lan"` (ya da `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Kimlik doğrulama**: varsayılan olarak gereklidir. local loopback dışı bind’ler Gateway kimlik doğrulaması gerektirir. Pratikte bu, paylaşılan bir token/parola veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkında bir ters proxy anlamına gelir. İlk kurulum sihirbazı varsayılan olarak bir token üretir.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef’ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. İkisi de yapılandırılmış ve mode ayarlanmamışsa başlatma ve servis kurulum/onarım akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık kimlik doğrulamasız mod. Yalnızca güvenilir local loopback kurulumları için kullanın; bu seçenek bilinçli olarak ilk kurulum istemlerinde sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: tarayıcı/kullanıcı kimlik doğrulamasını kimlik farkında bir ters proxy’ye devreder ve `gateway.trustedProxies` üzerinden gelen kimlik başlıklarına güvenir (bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)). Bu mod varsayılan olarak **local loopback dışı** bir proxy kaynağı bekler; aynı host üzerindeki local loopback ters proxy’leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir. Aynı host içindeki dahili çağırıcılar yerel doğrudan geri dönüş olarak `gateway.auth.password` kullanabilir; `gateway.auth.token`, trusted-proxy modu ile karşılıklı olarak dışlayıcı kalır.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik başlıkları Kontrol UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını **kullanmaz**; bunun yerine Gateway’in normal HTTP kimlik doğrulama modunu izler. Bu token’sız akış, Gateway host’unun güvenilir olduğunu varsayar. `tailscale.mode = "serve"` olduğunda varsayılan olarak `true` değerindedir.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP’si ve kimlik doğrulama kapsamı başına uygulanır (shared-secret ve device-token bağımsız izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Eşzamansız Tailscale Serve Kontrol UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler hata yazımından önce sıralı hale getirilir. Bu yüzden aynı istemciden gelen eşzamanlı hatalı denemeler, ikisinin de düz uyuşmazlık olarak yarışıp geçmesi yerine sınırlayıcıyı ikinci istekte tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` değerindedir; localhost trafiğinin de hız sınırlamasına tabi olmasını özellikle istiyorsanız (test kurulumları veya katı proxy dağıtımları için) `false` olarak ayarlayın.
- Tarayıcı-origin WS kimlik doğrulama denemeleri, local loopback muafiyeti devre dışı bırakılarak her zaman kısıtlanır (tarayıcı tabanlı localhost kaba kuvvet denemelerine karşı derinlemesine savunma).
- local loopback üzerinde, bu tarayıcı-origin kilitlemeleri normalize edilmiş `Origin`
  değeri başına yalıtılır; bu yüzden bir localhost origin’den tekrarlanan hatalar farklı
  bir origin’i otomatik olarak kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, local loopback bind) veya `funnel` (genel, kimlik doğrulama gerektirir).
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı-origin izin listesi. Tarayıcı istemcilerinin local loopback dışı origin’lerden gelmesi bekleniyorsa gereklidir.
- `controlUi.chatMessageMaxWidth`: gruplanmış Kontrol UI sohbet mesajları için isteğe bağlı maksimum genişlik. `960px`, `82%`, `min(1280px, 82%)` ve `calc(100% - 2rem)` gibi kısıtlı CSS genişlik değerlerini kabul eder.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host-header origin ilkesine bilinçli olarak dayanan dağıtımlar için Host-header origin geri dönüşünü etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için `remote.url`, `ws://` veya `wss://` olmalıdır.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: güvenilir özel ağ
  IP’lerine düz metin `ws://` kullanımına izin veren istemci tarafı işlem ortamı
  acil durum geçersiz kılması; düz metin için varsayılan local loopback ile sınırlı kalır. Bunun `openclaw.json`
  eşdeğeri yoktur ve
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` gibi tarayıcı özel ağ yapılandırması Gateway
  WebSocket istemcilerini etkilemez.
- `gateway.remote.token` / `.password` uzak istemci kimlik bilgisi alanlarıdır. Tek başlarına Gateway kimlik doğrulamasını yapılandırmazlar.
- `gateway.push.apns.relay.baseUrl`: resmi/TestFlight iOS derlemeleri relay destekli kayıtları Gateway’e yayımladıktan sonra kullandıkları harici APNs relay’i için temel HTTPS URL’si. Bu URL, iOS derlemesine gömülen relay URL’siyle eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: Gateway’den relay’e gönderim zaman aşımı, milisaniye cinsinden. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir Gateway kimliğine devredilir. Eşleştirilmiş iOS uygulaması `gateway.identity.get` bilgisini alır, bu kimliği relay kaydına dahil eder ve kayıt kapsamlı bir gönderim iznini Gateway’e iletir. Başka bir Gateway bu saklanan kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici env geçersiz kılmaları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: local loopback HTTP relay URL’leri için yalnızca geliştirme amaçlı kaçış yolu. Üretim relay URL’leri HTTPS üzerinde kalmalıdır.
- `gateway.handshakeTimeoutMs`: kimlik doğrulama öncesi Gateway WebSocket el sıkışma zaman aşımı, milisaniye cinsinden. Varsayılan: `15000`. Ayarlanmışsa `OPENCLAW_HANDSHAKE_TIMEOUT_MS` önceliklidir. Başlatma ısınması hâlâ otururken yerel istemcilerin bağlanabildiği yüklü veya düşük güçlü host’larda bunu artırın.
- `gateway.channelHealthCheckMinutes`: kanal sağlık izleyici aralığı, dakika cinsinden. Sağlık izleyici yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: eski soket eşiği, dakika cinsinden. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına en fazla sağlık izleyici yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izleyici etkin kalırken sağlık izleyici yeniden başlatmaları için kanal başına çıkış seçeneği.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap başına geçersiz kılma. Ayarlandığında kanal düzeyi geçersiz kılmadan önceliklidir.
- Yerel Gateway çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` değerlerini geri dönüş olarak kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenememişse çözümleme güvenli kapalı başarısız olur (uzak geri dönüş maskelemesi yoktur).
- `trustedProxies`: TLS’yi sonlandıran veya forwarded-client başlıkları ekleyen ters proxy IP’leri. Yalnızca kontrol ettiğiniz proxy’leri listeleyin. local loopback girdileri aynı host proxy/yerel algılama kurulumları için hâlâ geçerlidir (örneğin Tailscale Serve veya yerel bir ters proxy), ancak local loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hale **getirmezler**.
- `allowRealIpFallback`: `true` olduğunda Gateway, `X-Forwarded-For` eksikse `X-Real-IP` kabul eder. Güvenli kapalı davranış için varsayılan `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: istenen kapsam olmadan ilk kez node cihaz eşleştirmesini otomatik onaylamak için isteğe bağlı CIDR/IP izin listesi. Ayarlanmamışsa devre dışıdır. Bu, operatör/tarayıcı/Kontrol UI/WebChat eşleştirmesini otomatik onaylamaz ve rol, kapsam, metadata veya public-key yükseltmelerini otomatik onaylamaz.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: eşleştirme ve platform izin listesi değerlendirmesinden sonra bildirilen node komutları için genel izin/ret şekillendirmesi. `camera.snap`, `camera.clip` ve `screen.record` gibi tehlikeli node komutlarını dahil etmek için `allowCommands` kullanın; `denyCommands`, platform varsayılanı veya açık izin aksi halde onu dahil etse bile bir komutu kaldırır. Bir node bildirdiği komut listesini değiştirdikten sonra, Gateway’in güncellenmiş komut anlık görüntüsünü saklaması için o cihaz eşleştirmesini reddedip yeniden onaylayın.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek araç adları (varsayılan ret listesini genişletir).
- `gateway.tools.allow`: araç adlarını varsayılan HTTP ret listesinden kaldırır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdisi sağlamlaştırması:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarlanmamış kabul edilir; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt sağlamlaştırma başlığı:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca kontrol ettiğiniz HTTPS origin’leri için ayarlayın; bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çoklu örnek yalıtımı

Tek bir host üzerinde benzersiz portlar ve durum dizinleriyle birden çok Gateway çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Kolaylık bayrakları: `--dev` (`~/.openclaw-dev` + port `19001` kullanır), `--profile <name>` (`~/.openclaw-<name>` kullanır).

Bkz. [Birden Çok Gateway](/tr/gateway/multiple-gateways).

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

- `enabled`: Gateway dinleyicisinde TLS sonlandırmayı etkinleştirir (HTTPS/WSS) (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel kendinden imzalı bir cert/key çifti otomatik üretir; yalnızca yerel/geliştirme kullanımı için.
- `certPath`: TLS sertifika dosyasının dosya sistemi yolu.
- `keyPath`: TLS özel anahtar dosyasının dosya sistemi yolu; izinlerini kısıtlı tutun.
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
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tam sayı).
- `deferralTimeoutMs`: yeniden başlatmayı zorlamadan önce devam eden işlemleri beklemek için ms cinsinden isteğe bağlı maksimum süre. Varsayılan sınırlı beklemeyi (`300000`) kullanmak için atlayın; süresiz beklemek ve periyodik hâlâ beklemede uyarıları günlüğe yazmak için `0` ayarlayın.

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
Sorgu dizisi hook token’ları reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, `gateway.auth.token` değerinden **farklı** olmalıdır; Gateway token’ının yeniden kullanılması reddedilir.
- `hooks.path` `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini sınırlandırın (örneğin `["hook:"]`).
- Bir eşleme veya ön ayar şablonlu bir `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` değerini ayarlayın ve `hooks.allowRequestSessionKey=true` yapın. Statik eşleme anahtarları bu açık katılımı gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükünden gelen `sessionKey` yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` aracılığıyla çözümlenir
  - Şablonla işlenen eşleme `sessionKey` değerleri dışarıdan sağlanmış kabul edilir ve ayrıca `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Mapping details">

- `match.path`, `/hooks` sonrasındaki alt yolla eşleşir (örn. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanıyla eşleşir.
- `{{messages[0].subject}}` gibi şablonlar yükten okur.
- `transform`, bir hook eylemi döndüren bir JS/TS modülünü gösterebilir.
  - `transform.module` göreli bir yol olmalıdır ve `hooks.transformsDir` içinde kalır (mutlak yollar ve dizin geçişi reddedilir).
  - `hooks.transformsDir` değerini `~/.openclaw/hooks/transforms` altında tutun; çalışma alanı Skills dizinleri reddedilir. `openclaw doctor` bu yolu geçersiz olarak bildirirse transform modülünü hooks transforms dizinine taşıyın veya `hooks.transformsDir` değerini kaldırın.
- `agentId`, belirli bir ajana yönlendirir; bilinmeyen kimlikler varsayılana geri döner.
- `allowedAgentIds`: açık yönlendirmeyi sınırlar (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan hook ajan çalıştırmaları için isteğe bağlı sabit oturum anahtarıdır.
- `allowRequestSessionKey`: `/hooks/agent` çağıranlarının ve şablon güdümlü eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin verir (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri için isteğe bağlı önek izin listesi (istek + eşleme), örn. `["hook:"]`. Herhangi bir eşleme veya ön ayar şablonlu bir `sessionKey` kullandığında zorunlu hale gelir.
- `deliver: true` son yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` olur.
- `model`, bu hook çalıştırması için LLM’yi geçersiz kılar (model kataloğu ayarlanmışsa izin verilmiş olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail ön ayarı `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- Bu ileti başına yönlendirmeyi korursanız `hooks.allowRequestSessionKey: true` ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanıyla eşleşecek şekilde sınırlandırın; örneğin `["hook:", "hook:gmail:"]`.
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

- Gateway, yapılandırıldığında başlangıçta `gog gmail watch serve` komutunu otomatik başlatır. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.
- Gateway ile birlikte ayrı bir `gog gmail watch serve` çalıştırmayın.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Ajan tarafından düzenlenebilir HTML/CSS/JS ve A2UI’yi Gateway portu altında HTTP üzerinden sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` değerini koruyun (varsayılan).
- local loopback olmayan bağlamalar: canvas rotaları, diğer Gateway HTTP yüzeyleriyle aynı şekilde Gateway kimlik doğrulaması (token/parola/güvenilir proxy) gerektirir.
- Node WebView’ları genellikle kimlik doğrulama başlıkları göndermez; bir node eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için node kapsamlı yetenek URL’lerini duyurur.
- Yetenek URL’leri etkin node WS oturumuna bağlıdır ve kısa sürede sona erer. IP tabanlı geri dönüş kullanılmaz.
- Sunulan HTML’ye canlı yeniden yükleme istemcisini enjekte eder.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- A2UI’yi ayrıca `/__openclaw__/a2ui/` konumunda sunar.
- Değişiklikler Gateway’in yeniden başlatılmasını gerektirir.
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
- Ana makine adı, geçerli bir DNS etiketi olduğunda varsayılan olarak sistem ana makine adı olur; aksi halde `openclaw` değerine geri döner. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

### Geniş alan (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` altında tek noktaya yayın DNS-SD bölgesi yazar. Ağlar arası keşif için bir DNS sunucusuyla (CoreDNS önerilir) + Tailscale split DNS ile eşleştirin.

Kurulum: `openclaw dns setup --apply`.

---

## Ortam

### `env` (satır içi ortam değişkenleri)

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

- Satır içi ortam değişkenleri yalnızca süreç ortamında anahtar yoksa uygulanır.
- `.env` dosyaları: CWD `.env` + `~/.openclaw/.env` (hiçbiri mevcut değişkenleri geçersiz kılmaz).
- `shellEnv`: oturum açma kabuğu profilinizden eksik beklenen anahtarları içe aktarır.
- Tam öncelik sırası için [Ortam](/tr/help/environment) bölümüne bakın.

### Ortam değişkeni ikamesi

Herhangi bir yapılandırma dizesinde ortam değişkenlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Yalnızca büyük harfli adlar eşleşir: `[A-Z_][A-Z0-9_]*`.
- Eksik/boş değişkenler yapılandırma yüklenirken hata fırlatır.
- Değişmez `${VAR}` için `$${VAR}` ile kaçış yapın.
- `$include` ile çalışır.

---

## Gizli bilgiler

Secret ref’leri eklemelidir: düz metin değerler hâlâ çalışır.

### `SecretRef`

Tek bir nesne şekli kullanın:

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

- Kanonik matris: [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)
- `secrets apply`, desteklenen `openclaw.json` kimlik bilgisi yollarını hedefler.
- `auth-profiles.json` ref’leri çalışma zamanı çözümlemesine ve denetim kapsamına dahil edilir.

### Secret sağlayıcı yapılandırması

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
- Windows ACL doğrulaması kullanılamadığında dosya ve exec sağlayıcı yolları kapalı şekilde başarısız olur. `allowInsecurePath: true` değerini yalnızca doğrulanamayan güvenilir yollar için ayarlayın.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yüklerini kullanır.
- Varsayılan olarak symlink komut yolları reddedilir. Çözümlenen hedef yolu doğrulanırken symlink yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın.
- `trustedDirs` yapılandırıldıysa güvenilir dizin denetimi çözümlenen hedef yola uygulanır.
- `exec` alt ortamı varsayılan olarak minimaldir; gerekli değişkenleri `passEnv` ile açıkça geçirin.
- Secret ref’leri etkinleştirme zamanında bellek içi bir anlık görüntüye çözümlenir, ardından istek yolları yalnızca anlık görüntüyü okur.
- Etkin yüzey filtreleme etkinleştirme sırasında uygulanır: etkin yüzeylerdeki çözümlenmemiş ref’ler başlangıcı/yeniden yüklemeyi başarısız kılar; etkin olmayan yüzeyler tanılarla atlanır.

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
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyinde ref’leri destekler (`api_key` için `keyRef`, `token` için `tokenRef`).
- `{ "provider": { "apiKey": "..." } }` gibi eski düz `auth-profiles.json` eşlemeleri çalışma zamanı biçimi değildir; `openclaw doctor --fix` bunları `.legacy-flat.*.bak` yedeğiyle kanonik `provider:default` API anahtarı profillerine yeniden yazar.
- OAuth modundaki profiller (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli auth-profile kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri bellek içi çözümlenmiş anlık görüntülerden gelir; eski statik `auth.json` girdileri keşfedildiğinde temizlenir.
- Eski OAuth içe aktarmaları `~/.openclaw/credentials/oauth.json` konumundan yapılır.
- [OAuth](/tr/concepts/oauth) bölümüne bakın.
- Secrets çalışma zamanı davranışı ve `audit/configure/apply` araçları: [Secrets Yönetimi](/tr/gateway/secrets).

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

- `billingBackoffHours`: bir profil gerçek faturalandırma/yetersiz kredi hataları nedeniyle başarısız olduğunda saat cinsinden temel geri çekilme (varsayılan: `5`). Açık faturalandırma metni `401`/`403` yanıtlarında bile buraya düşebilir, ancak sağlayıcıya özgü metin eşleştiricileri bunların sahibi olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya kuruluş/çalışma alanı harcama sınırı iletileri bunun yerine `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalandırma geri çekilme saatleri için isteğe bağlı sağlayıcı başına geçersiz kılmalar.
- `billingMaxHours`: faturalandırma geri çekilmesi üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenli `auth_permanent` hataları için dakika cinsinden temel geri çekilme (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan saat cinsinden kayan pencere (varsayılan: `24`).
- `overloadedProfileRotations`: model yedeğine geçmeden önce aşırı yük hataları için aynı sağlayıcıda en fazla auth-profile rotasyonu (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı-meşgul biçimleri buraya düşer.
- `overloadedBackoffMs`: aşırı yüklü bir sağlayıcı/profil rotasyonunu yeniden denemeden önce sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model yedeğine geçmeden önce hız sınırı hataları için aynı sağlayıcıda en fazla auth-profile rotasyonu (varsayılan: `1`). Bu hız sınırı kovası `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

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
- `--verbose` olduğunda `consoleLevel`, `debug` değerine yükselir.
- `maxFileBytes`: döndürmeden önce etkin günlük dosyasının bayt cinsinden en büyük boyutu (pozitif tamsayı; varsayılan: `104857600` = 100 MB). OpenClaw etkin dosyanın yanında en fazla beş numaralı arşiv tutar.
- `redactSensitive` / `redactPatterns`: konsol çıktısı, dosya günlükleri, OTLP günlük kayıtları ve kalıcı oturum transcript metni için en iyi çaba maskelemesi. `redactSensitive: "off"` yalnızca bu genel günlük/transcript politikasını devre dışı bırakır; UI/araç/tanı güvenliği yüzeyleri yayından önce sırları yine de redakte eder.

---

## Tanılar

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
- `stuckSessionWarnMs`: uzun süren işleme oturumlarını `session.long_running`, `session.stalled` veya `session.stuck` olarak sınıflandırmak için ms cinsinden ilerleme yok yaşı eşiği. Yanıt, araç, durum, blok ve ACP ilerlemesi zamanlayıcıyı sıfırlar; yinelenen `session.stuck` tanıları değişmediğinde geri çekilir.
- `otel.enabled`: OpenTelemetry dışa aktarma hattını etkinleştirir (varsayılan: `false`). Tam yapılandırma, sinyal kataloğu ve gizlilik modeli için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).
- `otel.endpoint`: OTel dışa aktarımı için toplayıcı URL'si.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: isteğe bağlı sinyale özgü OTLP uç noktaları. Ayarlandığında, yalnızca ilgili sinyal için `otel.endpoint` değerini geçersiz kılar.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC meta veri başlıkları.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarımını etkinleştirir.
- `otel.sampleRate`: iz örnekleme oranı `0`–`1`.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri boşaltma aralığı.
- `otel.captureContent`: OTEL span öznitelikleri için isteğe bağlı ham içerik yakalama. Varsayılan olarak kapalıdır. Boolean `true`, sistem dışı ileti/araç içeriğini yakalar; nesne biçimi `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` ve `systemPrompt` alanlarını açıkça etkinleştirmenizi sağlar.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: en son deneysel GenAI span sağlayıcı öznitelikleri için ortam anahtarı. Varsayılan olarak span'ler uyumluluk için eski `gen_ai.system` özniteliğini korur; GenAI metrikleri sınırlı semantik öznitelikler kullanır.
- `OPENCLAW_OTEL_PRELOADED=1`: zaten global bir OpenTelemetry SDK kaydetmiş ana makineler için ortam anahtarı. OpenClaw bu durumda tanı dinleyicilerini etkin tutarken Plugin tarafından sahip olunan SDK başlatma/kapatma işlemini atlar.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` ve `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: eşleşen yapılandırma anahtarı ayarlanmamışsa kullanılan sinyale özgü uç nokta ortam değişkenleri.
- `cacheTrace.enabled`: gömülü çalıştırmalar için önbellek izleme anlık görüntülerini günlüğe kaydet (varsayılan: `false`).
- `cacheTrace.filePath`: önbellek izi JSONL için çıktı yolu (varsayılan: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: önbellek izi çıktısına nelerin dahil edileceğini denetler (tümünün varsayılanı: `true`).

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
- `checkOnStart`: Gateway başladığında npm güncellemelerini denetle (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka planda otomatik güncellemeyi etkinleştir (varsayılan: `false`).
- `auto.stableDelayHours`: kararlı kanal otomatik uygulamasından önce saat cinsinden en düşük gecikme (varsayılan: `6`; en fazla: `168`).
- `auto.stableJitterHours`: kararlı kanal dağıtımı için saat cinsinden ek yayılım penceresi (varsayılan: `12`; en fazla: `168`).
- `auto.betaCheckIntervalHours`: beta kanal denetimlerinin saat cinsinden ne sıklıkta çalışacağı (varsayılan: `1`; en fazla: `24`).

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

- `enabled`: global ACP özellik kapısı (varsayılan: `true`; ACP gönderme ve spawn olanaklarını gizlemek için `false` ayarlayın).
- `dispatch.enabled`: ACP oturum turu gönderimi için bağımsız kapı (varsayılan: `true`). Yürütmeyi engellerken ACP komutlarını kullanılabilir tutmak için `false` ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı arka uç kimliği (kayıtlı bir ACP runtime Plugin ile eşleşmelidir).
  Önce arka uç Plugin'ini kurun ve `plugins.allow` ayarlanmışsa arka uç Plugin kimliğini ekleyin (örneğin `acpx`), aksi halde ACP arka ucu yüklenmez.
- `defaultAgent`: spawn'lar açık bir hedef belirtmediğinde yedek ACP hedef aracı kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen aracı kimliklerinin izin listesi; boş olması ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: aynı anda etkin olabilecek en fazla ACP oturumu.
- `stream.coalesceIdleMs`: akan metin için ms cinsinden boşta boşaltma penceresi.
- `stream.maxChunkChars`: akan blok projeksiyonunu bölmeden önce en büyük parça boyutu.
- `stream.repeatSuppression`: her turda yinelenen durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı olarak akıtır; `"final_only"` tur terminal olaylarına kadar arabelleğe alır.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önceki ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP turu başına yansıtılan en fazla asistan çıktı karakteri.
- `stream.maxSessionUpdateChars`: yansıtılan ACP durum/güncelleme satırları için en fazla karakter sayısı.
- `stream.tagVisibility`: akan olaylar için etiket adlarından boolean görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum çalışanları için temizlemeye uygun hale gelmeden önce dakika cinsinden boşta TTL.
- `runtime.installCommand`: bir ACP çalışma zamanı ortamını önyüklerken çalıştırılacak isteğe bağlı kurulum komutu.

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

- `cli.banner.taglineMode`, banner slogan stilini denetler:
  - `"random"` (varsayılan): dönen komik/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yok (banner başlığı/sürümü yine de gösterilir).
- Banner'ın tamamını gizlemek için (yalnızca sloganları değil), `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

---

## Sihirbaz

CLI rehberli kurulum akışları (`onboard`, `configure`, `doctor`) tarafından yazılan meta veriler:

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

Geçerli derlemeler artık TCP köprüsünü içermez. Düğümler Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları çıkarabilir).

<Accordion title="Legacy bridge config (historical reference)">

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

- `sessionRetention`: tamamlanan yalıtılmış cron çalıştırma oturumlarının `sessions.json` içinden budanmadan önce ne kadar süre tutulacağı. Arşivlenmiş silinmiş cron transcript'lerinin temizlenmesini de denetler. Varsayılan: `24h`; devre dışı bırakmak için `false` ayarlayın.
- `runLog.maxBytes`: budamadan önce çalıştırma günlük dosyası (`cron/runs/<jobId>.jsonl`) başına en büyük boyut. Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: çalıştırma günlüğü budaması tetiklendiğinde korunan en yeni satırlar. Varsayılan: `2000`.
- `webhookToken`: cron Webhook POST teslimi (`delivery.mode = "webhook"`) için kullanılan taşıyıcı token; atlanırsa auth başlığı gönderilmez.
- `webhook`: yalnızca hâlâ `notify: true` içeren kayıtlı işler için kullanılan kullanımdan kaldırılmış eski yedek Webhook URL'si (http/https).

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

- `maxAttempts`: geçici hatalarda tek seferlik işler için en fazla yeniden deneme sayısı (varsayılan: `3`; aralık: `0`–`10`).
- `backoffMs`: her yeniden deneme girişimi için ms cinsinden bekleme gecikmeleri dizisi (varsayılan: `[30000, 60000, 300000]`; 1–10 giriş).
- `retryOn`: yeniden denemeleri tetikleyen hata türleri — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Tüm geçici türlerde yeniden denemek için belirtmeyin.

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

- `enabled`: Cron işleri için başarısızlık uyarılarını etkinleştirir (varsayılan: `false`).
- `after`: bir uyarı tetiklenmeden önceki ardışık başarısızlık sayısı (pozitif tam sayı, min: `1`).
- `cooldownMs`: aynı iş için tekrarlanan uyarılar arasındaki en az milisaniye (negatif olmayan tam sayı).
- `includeSkipped`: ardışık atlanan çalıştırmaları uyarı eşiğine dahil eder (varsayılan: `false`). Atlanan çalıştırmalar ayrı izlenir ve yürütme hatası bekleme süresini etkilemez.
- `mode`: iletim modu — `"announce"` bir kanal mesajı üzerinden gönderir; `"webhook"` yapılandırılmış Webhook'a gönderir.
- `accountId`: uyarı iletimini kapsamlandırmak için isteğe bağlı hesap veya kanal kimliği.

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

- Tüm işler genelinde Cron başarısızlık bildirimleri için varsayılan hedef.
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi mevcut olduğunda varsayılan olarak `"announce"` kullanılır.
- `channel`: announce iletimi için kanal geçersiz kılması. `"last"` bilinen son iletim kanalını yeniden kullanır.
- `to`: açık announce hedefi veya Webhook URL'si. Webhook modu için gereklidir.
- `accountId`: iletim için isteğe bağlı hesap geçersiz kılması.
- İş başına `delivery.failureDestination`, bu genel varsayılanı geçersiz kılar.
- Ne genel ne de iş başına başarısızlık hedefi ayarlandığında, zaten `announce` üzerinden iletim yapan işler başarısızlık durumunda o birincil announce hedefine geri döner.
- `delivery.failureDestination`, işin birincil `delivery.mode` değeri `"webhook"` olmadığı sürece yalnızca `sessionTarget="isolated"` işleri için desteklenir.

Bkz. [Cron İşleri](/tr/automation/cron-jobs). İzole Cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya modeli şablon değişkenleri

Şablon yer tutucuları `tools.media.models[].args` içinde genişletilir:

| Değişken           | Açıklama                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Tam gelen ileti gövdesi                           |
| `{{RawBody}}`      | Ham gövde (geçmiş/gönderen sarmalayıcıları yok)  |
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
| `{{Prompt}}`       | CLI girdileri için çözümlenmiş medya istemi       |
| `{{MaxChars}}`     | CLI girdileri için çözümlenmiş maksimum çıktı karakterleri |
| `{{ChatType}}`     | `"direct"` veya `"group"`                         |
| `{{GroupSubject}}` | Grup konusu (en iyi çabayla)                      |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (en iyi çabayla)          |
| `{{SenderName}}`   | Gönderen görünen adı (en iyi çabayla)             |
| `{{SenderE164}}`   | Gönderen telefon numarası (en iyi çabayla)        |
| `{{Provider}}`     | Sağlayıcı ipucu (WhatsApp, Telegram, Discord vb.) |

---

## Yapılandırma eklemeleri (`$include`)

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

- Tek dosya: içeren nesnenin yerine geçer.
- Dosya dizisi: sırayla derinlemesine birleştirilir (sonrakiler öncekileri geçersiz kılar).
- Kardeş anahtarlar: eklemelerden sonra birleştirilir (eklenen değerleri geçersiz kılar).
- İç içe eklemeler: en fazla 10 seviye derinliğe kadar.
- Yollar: ekleyen dosyaya göre çözümlenir, ancak üst düzey yapılandırma dizininin (`openclaw.json` dosyasının `dirname` değeri) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca yine de bu sınırın içinde çözümlendiklerinde izin verilir.
- Yalnızca tek dosyalı bir ekleme tarafından desteklenen tek bir üst düzey bölümü değiştiren OpenClaw'a ait yazmalar, ilgili eklenen dosyaya yazılır. Örneğin, `plugins install`, `plugins: { $include: "./plugins.json5" }` değerini `plugins.json5` içinde günceller ve `openclaw.json` dosyasını olduğu gibi bırakır.
- Kök eklemeler, ekleme dizileri ve kardeş geçersiz kılmaları olan eklemeler, OpenClaw'a ait yazmalar için salt okunurdur; bu yazmalar yapılandırmayı düzleştirmek yerine güvenli biçimde başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları ve döngüsel eklemeler için açık iletiler.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
