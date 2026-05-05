---
read_when:
    - Alan düzeyindeki yapılandırma semantiklerine veya varsayılan değerlere tam olarak ihtiyacınız var
    - Kanal, model, Gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Temel OpenClaw anahtarları, varsayılan değerler ve özel alt sistem referanslarına bağlantılar için Gateway yapılandırma referansı
title: Yapılandırma referansı
x-i18n:
    generated_at: "2026-05-05T01:46:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82164a3ea7592f667573b643ee9e0ec840b9b622c9d86c382a3feaf192e75684
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Çekirdek yapılandırma başvurusu: `~/.openclaw/openclaw.json`. Görev odaklı bir genel bakış için bkz. [Yapılandırma](/tr/gateway/configuration).

Ana OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendi daha derin başvurusu olduğunda bağlantı verir. Kanal ve plugin sahipli komut katalogları ile derin bellek/QMD ayarları bu sayfa yerine kendi sayfalarında bulunur.

Kod doğrusu:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema'yı yazdırır; mevcut olduğunda bundled/plugin/channel metadata birleştirilir
- `config.schema.lookup`, ayrıntılı inceleme araçları için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, config-doc temel hash'ini geçerli şema yüzeyine göre doğrular

Ajan arama yolu: düzenlemelerden önce tam alan düzeyi dokümantasyon ve kısıtlar için
`gateway` araç eylemi `config.schema.lookup` kullanın. Görev odaklı rehberlik için
[Yapılandırma](/tr/gateway/configuration) sayfasını, daha geniş alan haritası,
varsayılanlar ve alt sistem başvuru bağlantıları için bu sayfayı kullanın.

Özel derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki dreaming yapılandırması için [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
- Geçerli yerleşik + bundled komut kataloğu için [Slash komutları](/tr/tools/slash-commands)
- Kanala özgü komut yüzeyleri için sahibi olan kanal/plugin sayfaları

Yapılandırma biçimi **JSON5**'tir (yorumlara + sondaki virgüllere izin verilir). Tüm alanlar isteğe bağlıdır — atlandığında OpenClaw güvenli varsayılanları kullanır.

---

## Kanallar

Kanal başına yapılandırma anahtarları özel bir sayfaya taşındı — Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage ve diğer bundled kanallar dahil `channels.*`
için (kimlik doğrulama, erişim denetimi, çoklu hesap, bahsetme kapısı) bkz.
[Yapılandırma — kanallar](/tr/gateway/config-channels).

## Ajan varsayılanları, çoklu ajan, oturumlar ve mesajlar

Özel bir sayfaya taşındı — şunlar için bkz.
[Yapılandırma — ajanlar](/tr/gateway/config-agents):

- `agents.defaults.*` (çalışma alanı, model, düşünme, heartbeat, bellek, medya, Skills, sandbox)
- `multiAgent.*` (çoklu ajan yönlendirmesi ve bağlamaları)
- `session.*` (oturum yaşam döngüsü, Compaction, budama)
- `messages.*` (mesaj teslimi, TTS, markdown işleme)
- `talk.*` (Talk modu)
  - `talk.speechLocale`: iOS/macOS üzerinde Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği
  - `talk.silenceTimeoutMs`: ayarlanmadığında Talk, transkripti göndermeden önce platformun varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`)

## Araçlar ve özel sağlayıcılar

Araç ilkesi, deneysel anahtarlar, sağlayıcı destekli araç yapılandırması ve özel
sağlayıcı / base-URL kurulumu özel bir sayfaya taşındı — bkz.
[Yapılandırma — araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## Modeller

Sağlayıcı tanımları, model izin listeleri ve özel sağlayıcı kurulumu
[Yapılandırma — araçlar ve özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls)
içinde bulunur. `models` kökü ayrıca genel model kataloğu davranışını da sahiplenir.

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
- `models.pricing.enabled`: sidecar'lar ve kanallar Gateway hazır yoluna ulaştıktan
  sonra başlayan arka plan fiyatlandırma önyüklemesini denetler. `false` olduğunda
  Gateway, OpenRouter ve LiteLLM fiyatlandırma kataloğu getirmelerini atlar; yapılandırılmış
  `models.providers.*.models[].cost` değerleri yerel maliyet tahminleri için çalışmaya devam eder.

## MCP

OpenClaw tarafından yönetilen MCP sunucu tanımları `mcp.servers` altında bulunur ve
gömülü Pi ile diğer çalışma zamanı bağdaştırıcıları tarafından tüketilir. `openclaw mcp list`,
`show`, `set` ve `unset` komutları, yapılandırma düzenlemeleri sırasında hedef sunucuya
bağlanmadan bu bloğu yönetir.

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

- `mcp.servers`: yapılandırılmış MCP araçlarını açığa çıkaran çalışma zamanları için
  adlandırılmış stdio veya uzak MCP sunucu tanımları.
  Uzak girdiler `transport: "streamable-http"` veya `transport: "sse"` kullanır;
  `type: "http"`, `openclaw mcp set` ve `openclaw doctor --fix` tarafından
  kanonik `transport` alanına normalize edilen CLI'ye özgü bir alias'tır.
- `mcp.sessionIdleTtlMs`: oturum kapsamlı bundled MCP çalışma zamanları için boşta kalma TTL'si.
  Tek seferlik gömülü çalıştırmalar, çalıştırma sonu temizliği ister; bu TTL,
  uzun ömürlü oturumlar ve gelecekteki çağıranlar için yedek güvencedir.
- `mcp.*` altındaki değişiklikler, önbelleğe alınmış oturum MCP çalışma zamanlarını
  elden çıkararak anında uygulanır. Sonraki araç keşfi/kullanımı bunları yeni yapılandırmadan
  yeniden oluşturur, bu nedenle kaldırılan `mcp.servers` girdileri boşta kalma TTL'sini
  beklemek yerine hemen temizlenir.

Çalışma zamanı davranışı için bkz. [MCP](/tr/cli/mcp#openclaw-as-an-mcp-client-registry) ve
[CLI arka uçları](/tr/gateway/cli-backends#bundle-mcp-overlays).

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

- `allowBundled`: yalnızca bundled Skills için isteğe bağlı izin listesi (yönetilen/çalışma alanı Skills etkilenmez).
- `load.extraDirs`: ek paylaşılan skill kökleri (en düşük öncelik).
- `install.preferBrew`: true olduğunda, diğer yükleyici türlerine geri dönmeden önce
  `brew` mevcutsa Homebrew yükleyicilerini tercih eder.
- `install.nodeManager`: `metadata.openclaw.install` özellikleri için node yükleyici tercihi
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false`, bundled/kurulu olsa bile bir skill'i devre dışı bırakır.
- `entries.<skillKey>.apiKey`: birincil env var bildiren Skills için kolaylık (düz metin string veya SecretRef nesnesi).

---

## Pluginler

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
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

- `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` ve `plugins.load.paths` üzerinden yüklenir.
- Keşif, yerel OpenClaw pluginleri ile uyumlu Codex bundle'larını ve Claude bundle'larını kabul eder; buna manifestsiz Claude varsayılan yerleşim bundle'ları dahildir.
- **Yapılandırma değişiklikleri gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen pluginler yüklenir). `deny` kazanır.
- `bundledDiscovery`: yeni yapılandırmalar için varsayılan olarak `"allowlist"` olur; bu yüzden boş olmayan
  bir `plugins.allow`, web-search çalışma zamanı sağlayıcıları dahil bundled sağlayıcı pluginlerini de kapıdan geçirir.
  Doctor, siz açıkça katılana kadar mevcut bundled sağlayıcı davranışını korumak için geçirilen eski izin listesi
  yapılandırmalarına `"compat"` yazar.
- `plugins.entries.<id>.apiKey`: plugin düzeyi API anahtarı kolaylık alanı (plugin tarafından desteklendiğinde).
- `plugins.entries.<id>.env`: plugin kapsamlı env var haritası.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda core, `before_prompt_build` öğesini engeller ve eski `before_agent_start` içinden prompt'u değiştiren alanları yok sayarken eski `modelOverride` ve `providerOverride` değerlerini korur. Yerel plugin hook'larına ve desteklenen bundle tarafından sağlanan hook dizinlerine uygulanır.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` olduğunda güvenilir, bundled olmayan pluginler `llm_input`, `llm_output`, `before_agent_finalize` ve `agent_end` gibi tipli hook'lardan ham konuşma içeriğini okuyabilir.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu pluginin arka plan alt ajan çalıştırmaları için çalıştırma başına `provider` ve `model` override'ları istemesine açıkça güven.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilir alt ajan override'ları için kanonik `provider/model` hedeflerinin isteğe bağlı izin listesi. `"*"` değerini yalnızca herhangi bir modele izin vermeyi bilerek istiyorsanız kullanın.
- `plugins.entries.<id>.config`: plugin tanımlı yapılandırma nesnesi (mevcut olduğunda yerel OpenClaw plugin şeması tarafından doğrulanır).
- Kanal plugin hesabı/çalışma zamanı ayarları `channels.<id>` altında bulunur ve merkezi bir OpenClaw seçenek kayıt defteri tarafından değil, sahibi olan pluginin manifest `channelConfigs` metadata'sı tarafından açıklanmalıdır.
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch sağlayıcı ayarları.
  - `apiKey`: Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` env var değerine geri döner.
  - `baseUrl`: Firecrawl API temel URL'si (varsayılan: `https://api.firecrawl.dev`; self-hosted override'lar özel/dahili uç noktaları hedeflemelidir).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkarır (varsayılan: `true`).
  - `maxAgeMs`: milisaniye cinsinden maksimum önbellek yaşı (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: saniye cinsinden scrape isteği zaman aşımı (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web search) ayarları.
  - `enabled`: X Search sağlayıcısını etkinleştir.
  - `model`: arama için kullanılacak Grok modeli (örn. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: bellek dreaming ayarları. Aşamalar ve eşikler için bkz. [Dreaming](/tr/concepts/dreaming).
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam dreaming taraması için cron sıklığı (varsayılan olarak `"0 3 * * *"`).
  - `model`: isteğe bağlı Dream Diary alt ajan model override'ı. `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir; hedefleri kısıtlamak için `allowedModels` ile eşleştirin. Model-mevcut-değil hataları, oturumun varsayılan modeliyle bir kez yeniden denenir; güven veya izin listesi hataları sessizce geri dönmez.
  - aşama ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya dönük yapılandırma anahtarları değildir).
- Tam bellek yapılandırması [Bellek yapılandırma başvurusu](/tr/reference/memory-config) içinde bulunur:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude bundle pluginleri `settings.json` içinden gömülü Pi varsayılanları da katkı olarak sunabilir; OpenClaw bunları ham OpenClaw yapılandırma yamaları olarak değil, temizlenmiş ajan ayarları olarak uygular.
- `plugins.slots.memory`: etkin bellek plugin kimliğini seçin veya bellek pluginlerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: etkin bağlam motoru plugin kimliğini seçin; başka bir motor kurup seçmediğiniz sürece varsayılan `"legacy"` olur.

Bkz. [Pluginler](/tr/tools/plugin).

---

## Taahhütler

`commitments`, çıkarımlanan takip belleğini denetler: OpenClaw konuşma sıralarından check-in'leri algılayabilir ve bunları heartbeat çalıştırmaları aracılığıyla teslim edebilir.

- `commitments.enabled`: çıkarımlanan takip taahhütleri için gizli LLM çıkarımını, depolamayı ve heartbeat teslimini etkinleştirir. Varsayılan: `false`.
- `commitments.maxPerDay`: kayan bir gün içinde ajan oturumu başına teslim edilen maksimum çıkarımlanan takip taahhüdü sayısı. Varsayılan: `3`.

Bkz. [Çıkarımlanan taahhütler](/tr/concepts/commitments).

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

- `evaluateEnabled: false`, `act:evaluate` ve `wait --fn` özelliklerini devre dışı bırakır.
- `tabCleanup`, izlenen birincil ajan sekmelerini boşta kalma süresinden sonra veya bir oturum sınırını aştığında geri alır. Bu bağımsız temizleme modlarını devre dışı bırakmak için `idleMinutes: 0` veya `maxTabsPerSession: 0` ayarlayın.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`, ayarlanmadığında devre dışıdır; bu nedenle tarayıcı gezintisi varsayılan olarak katı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezintisine bilinçli olarak güvendiğinizde ayarlayın.
- Katı modda, uzak CDP profil uç noktaları (`profiles.*.cdpUrl`), erişilebilirlik/keşif denetimleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski takma ad olarak desteklenmeye devam eder.
- Katı modda, açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca bağlanma modundadır (başlatma/durdurma/sıfırlama devre dışı).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw'ın `/json/version` keşfetmesini istediğinizde HTTP(S) kullanın; sağlayıcınız doğrudan DevTools WebSocket URL'si verdiğinde WS(S) kullanın.
- `remoteCdpTimeoutMs` ve `remoteCdpHandshakeTimeoutMs`, uzak ve `attachOnly` CDP erişilebilirliğine ve sekme açma isteklerine uygulanır. Yönetilen loopback profilleri yerel CDP varsayılanlarını korur.
- Dışarıdan yönetilen bir CDP hizmetine loopback üzerinden erişilebiliyorsa, o profilin `attachOnly: true` değerini ayarlayın; aksi halde OpenClaw loopback bağlantı noktasını yerel yönetilen tarayıcı profili olarak ele alır ve yerel bağlantı noktası sahipliği hataları bildirebilir.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve seçilen ana bilgisayara ya da bağlı bir tarayıcı düğümü üzerinden bağlanabilir.
- `existing-session` profilleri, Brave veya Edge gibi belirli bir Chromium tabanlı tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri mevcut Chrome MCP rota sınırlarını korur:
  CSS seçici hedefleme yerine anlık görüntü/ref tabanlı eylemler, tek dosya yükleme kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; `cdpUrl` değerini yalnızca uzak CDP için açıkça ayarlayın.
- Yerel yönetilen profiller, ilgili profil için genel `browser.executablePath` değerini geçersiz kılmak üzere `executablePath` ayarlayabilir. Bunu bir profili Chrome'da, başka bir profili Brave'de çalıştırmak için kullanın.
- Yerel yönetilen profiller, işlem başladıktan sonra Chrome CDP HTTP keşfi için `browser.localLaunchTimeoutMs` ve başlatma sonrası CDP websocket hazır olma durumu için `browser.localCdpReadyTimeoutMs` kullanır. Chrome'un başarıyla başlatıldığı ancak hazır olma denetimlerinin başlangıçla yarıştığı daha yavaş ana bilgisayarlarda bunları artırın. Her iki değer de `120000` ms'ye kadar pozitif tamsayı olmalıdır; geçersiz yapılandırma değerleri reddedilir.
- Otomatik algılama sırası: Chromium tabanlıysa varsayılan tarayıcı → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` ve `browser.profiles.<name>.executablePath`, Chromium başlatılmadan önce işletim sistemi ana dizininiz için hem `~` hem de `~/...` kabul eder.
  `existing-session` profillerindeki profil başına `userDataDir` de tilde ile genişletilir.
- Kontrol hizmeti: yalnızca loopback (bağlantı noktası `gateway.port` değerinden türetilir, varsayılan `18791`).
- `extraArgs`, yerel Chromium başlangıcına ek başlatma bayrakları ekler (örneğin `--disable-gpu`, pencere boyutlandırma veya hata ayıklama bayrakları).

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

- `seamColor`: yerel uygulama UI chrome'u için vurgu rengi (Talk Mode balon tonu vb.).
- `assistant`: Control UI kimliği geçersiz kılma. Etkin ajan kimliğine geri döner.

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

<Accordion title="Gateway alan ayrıntıları">

- `mode`: `local` (gateway'i çalıştır) veya `remote` (uzak gateway'e bağlan). Gateway, `local` olmadığı sürece başlamayı reddeder.
- `port`: WS + HTTP için tek çoğullamalı port. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP'si) veya `custom`.
- **Eski bind takma adları**: `gateway.bind` içinde host takma adlarını (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind'i, container içinde `127.0.0.1` üzerinde dinler. Docker bridge ağ kullanımıyla (`-p 18789:18789`) trafik `eth0` üzerinden gelir, bu yüzden gateway'e ulaşılamaz. Tüm arayüzlerde dinlemek için `--network host` kullanın veya `bind: "lan"` (ya da `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Kimlik doğrulama**: varsayılan olarak gereklidir. Loopback dışı bind'ler gateway kimlik doğrulaması gerektirir. Pratikte bu, paylaşılan bir token/parola veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkındalıklı bir reverse proxy anlamına gelir. Onboarding sihirbazı varsayılan olarak bir token üretir.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. İkisi de yapılandırıldığında ve mod ayarlanmadığında başlangıç ve servis kurulum/onarım akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık kimlik doğrulamasız mod. Yalnızca güvenilir local loopback kurulumları için kullanın; bu, onboarding istemlerinde bilerek sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: tarayıcı/kullanıcı kimlik doğrulamasını kimlik farkındalıklı bir reverse proxy'ye devredin ve `gateway.trustedProxies` üzerinden gelen kimlik başlıklarına güvenin (bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)). Bu mod varsayılan olarak **loopback dışı** bir proxy kaynağı bekler; aynı host üzerindeki loopback reverse proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir. Dahili aynı host çağırıcıları yerel doğrudan yedek olarak `gateway.auth.password` kullanabilir; `gateway.auth.token`, trusted-proxy moduyla karşılıklı dışlayıcı kalır.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını **kullanmaz**; bunun yerine gateway'in normal HTTP kimlik doğrulama modunu izler. Bu tokensız akış, gateway host'unun güvenilir olduğunu varsayar. `tailscale.mode = "serve"` olduğunda varsayılan olarak `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP'si ve kimlik doğrulama kapsamı başına uygulanır (shared-secret ve device-token bağımsız izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Asenkron Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler hata yazımından önce sıralanır. Bu nedenle aynı istemciden gelen eşzamanlı hatalı denemeler, ikisinin de düz uyumsuzluk olarak yarışmak yerine ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` olur; localhost trafiğinin de hız sınırlamasına tabi olmasını bilerek istediğinizde (test kurulumları veya katı proxy dağıtımları için) `false` olarak ayarlayın.
- Tarayıcı kaynaklı WS kimlik doğrulama denemeleri, loopback muafiyeti devre dışı bırakılarak her zaman sınırlandırılır (tarayıcı tabanlı localhost brute force'a karşı derinlemesine savunma).
- Loopback üzerinde, bu tarayıcı kaynaklı kilitlemeler normalize edilmiş `Origin`
  değeri başına yalıtılır; bu nedenle bir localhost origin'inden tekrarlanan hatalar
  farklı bir origin'i otomatik olarak kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, loopback bind) veya `funnel` (genel, kimlik doğrulama gerektirir).
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı origin izin listesi. Tarayıcı istemcileri loopback dışı origin'lerden bekleniyorsa gereklidir.
- `controlUi.chatMessageMaxWidth`: gruplanmış Control UI sohbet mesajları için isteğe bağlı maksimum genişlik. `960px`, `82%`, `min(1280px, 82%)` ve `calc(100% - 2rem)` gibi sınırlandırılmış CSS genişlik değerlerini kabul eder.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host-header origin ilkesine bilerek dayanan dağıtımlar için Host-header origin fallback'ini etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için `remote.url`, `ws://` veya `wss://` olmalıdır.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: düz metin `ws://` kullanımına güvenilir özel ağ
  IP'leri için izin veren istemci tarafı süreç ortamı break-glass override'ı;
  varsayılan, düz metin için loopback-only kalır. Bunun `openclaw.json`
  eşdeğeri yoktur ve `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
  gibi tarayıcı özel ağ yapılandırmaları Gateway WebSocket istemcilerini etkilemez.
- `gateway.remote.token` / `.password` uzak istemci kimlik bilgisi alanlarıdır. Tek başlarına gateway kimlik doğrulamasını yapılandırmazlar.
- `gateway.push.apns.relay.baseUrl`: resmi/TestFlight iOS build'leri relay destekli kayıtları gateway'e yayımladıktan sonra kullandıkları harici APNs relay için temel HTTPS URL'si. Bu URL, iOS build'ine derlenen relay URL'siyle eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: gateway'den relay'e gönderim zaman aşımı, milisaniye cinsinden. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir gateway kimliğine devredilir. Eşleştirilmiş iOS uygulaması `gateway.identity.get` getirir, bu kimliği relay kaydına ekler ve kayıt kapsamlı bir gönderim iznini gateway'e iletir. Başka bir gateway bu saklanan kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici env override'ları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL'leri için yalnızca geliştirme amaçlı kaçış yolu. Production relay URL'leri HTTPS üzerinde kalmalıdır.
- `gateway.handshakeTimeoutMs`: kimlik doğrulama öncesi Gateway WebSocket el sıkışma zaman aşımı, milisaniye cinsinden. Varsayılan: `15000`. Ayarlandığında `OPENCLAW_HANDSHAKE_TIMEOUT_MS` önceliklidir. Yerel istemcilerin bağlanabildiği ancak başlangıç ısınmasının hâlâ oturmakta olduğu yüklü veya düşük güçlü host'larda bunu artırın.
- `gateway.channelHealthCheckMinutes`: kanal health-monitor aralığı, dakika cinsinden. Health-monitor yeniden başlatmalarını global olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: eski soket eşiği, dakika cinsinden. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına maksimum health-monitor yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: global monitor etkin kalırken health-monitor yeniden başlatmaları için kanal başına çıkış seçeneği.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap başına override. Ayarlandığında kanal düzeyi override'a göre önceliklidir.
- Yerel gateway çağrı yolları, `gateway.remote.*` değerlerini yalnızca `gateway.auth.*` ayarlanmamışsa fallback olarak kullanabilir.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef aracılığıyla açıkça yapılandırılmış ve çözümlenememişse çözümleme kapalı biçimde başarısız olur (uzak fallback maskelemesi yoktur).
- `trustedProxies`: TLS sonlandıran veya forwarded-client başlıkları ekleyen reverse proxy IP'leri. Yalnızca kontrol ettiğiniz proxy'leri listeleyin. Loopback girdileri aynı host proxy/yerel algılama kurulumları için hâlâ geçerlidir (örneğin Tailscale Serve veya yerel reverse proxy), ancak loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hâle **getirmezler**.
- `allowRealIpFallback`: `true` olduğunda, `X-Forwarded-For` yoksa gateway `X-Real-IP` kabul eder. Fail-closed davranışı için varsayılan `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: istenen kapsam olmadan ilk kez node cihaz eşleştirmesini otomatik onaylamak için isteğe bağlı CIDR/IP izin listesi. Ayarlanmadığında devre dışıdır. Bu, operatör/tarayıcı/Control UI/WebChat eşleştirmesini otomatik onaylamaz ve rol, kapsam, meta veri veya public-key yükseltmelerini otomatik onaylamaz.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: eşleştirme ve platform izin listesi değerlendirmesinden sonra bildirilen node komutları için global izin/ret şekillendirmesi. `camera.snap`, `camera.clip` ve `screen.record` gibi tehlikeli node komutlarına katılmak için `allowCommands` kullanın; `denyCommands`, bir platform varsayılanı veya açık izin aksi hâlde onu dahil edecek olsa bile bir komutu kaldırır. Bir node bildirilen komut listesini değiştirdikten sonra, gateway'in güncellenmiş komut snapshot'ını saklaması için bu cihaz eşleştirmesini reddedin ve yeniden onaylayın.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek araç adları (varsayılan ret listesini genişletir).
- `gateway.tools.allow`: araç adlarını varsayılan HTTP ret listesinden kaldırır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdisi sıkılaştırma:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarlanmamış kabul edilir; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı response sıkılaştırma başlığı:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca kontrol ettiğiniz HTTPS origin'leri için ayarlayın; bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çoklu örnek yalıtımı

Benzersiz portlar ve durum dizinleriyle tek host üzerinde birden çok gateway çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Kolaylık flag'leri: `--dev` (`~/.openclaw-dev` + `19001` portunu kullanır), `--profile <name>` (`~/.openclaw-<name>` kullanır).

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

- `enabled`: gateway dinleyicisinde TLS sonlandırmayı (HTTPS/WSS) etkinleştirir (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel kendinden imzalı bir sertifika/anahtar çifti otomatik üretir; yalnızca yerel/geliştirme kullanımı içindir.
- `certPath`: TLS sertifika dosyasına dosya sistemi yolu.
- `keyPath`: TLS özel anahtar dosyasına dosya sistemi yolu; izinlerini kısıtlı tutun.
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

- `mode`: yapılandırma düzenlemelerinin çalışma zamanında nasıl uygulandığını denetler.
  - `"off"`: canlı düzenlemeleri yok say; değişiklikler açık bir yeniden başlatma gerektirir.
  - `"restart"`: yapılandırma değiştiğinde gateway sürecini her zaman yeniden başlat.
  - `"hot"`: değişiklikleri yeniden başlatmadan süreç içinde uygula.
  - `"hybrid"` (varsayılan): önce hot reload dene; gerekirse yeniden başlatmaya geri dön.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tam sayı).
- `deferralTimeoutMs`: yeniden başlatmayı zorlamadan önce devam eden işlemler için beklenecek isteğe bağlı maksimum süre, ms cinsinden. Varsayılan sınırlı beklemeyi (`300000`) kullanmak için bunu atlayın; süresiz beklemek ve periyodik hâlâ beklemede uyarıları kaydetmek için `0` ayarlayın.

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
Sorgu dizesi hook token'ları reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, `gateway.auth.token` değerinden **farklı** olmalıdır; Gateway token'ının yeniden kullanılması reddedilir.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini kısıtlayın (örneğin `["hook:"]`).
- Bir eşleme veya ön ayar şablonlu bir `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` değerini ayarlayın ve `hooks.allowRequestSessionKey=true` yapın. Statik eşleme anahtarları bu açık katılımı gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükünden gelen `sessionKey` yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` üzerinden çözümlenir
  - Şablonla oluşturulmuş eşleme `sessionKey` değerleri harici olarak sağlanmış kabul edilir ve ayrıca `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Eşleme ayrıntıları">

- `match.path`, `/hooks` sonrasındaki alt yolla eşleşir (örn. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanıyla eşleşir.
- `{{messages[0].subject}}` gibi şablonlar yükten okunur.
- `transform`, hook eylemi döndüren bir JS/TS modülüne işaret edebilir.
  - `transform.module` göreli bir yol olmalı ve `hooks.transformsDir` içinde kalmalıdır (mutlak yollar ve dizin dışına geçiş reddedilir).
  - `hooks.transformsDir` değerini `~/.openclaw/hooks/transforms` altında tutun; çalışma alanı skill dizinleri reddedilir. `openclaw doctor` bu yolu geçersiz olarak bildirirse transform modülünü hooks transform dizinine taşıyın veya `hooks.transformsDir` değerini kaldırın.
- `agentId`, belirli bir ajana yönlendirir; bilinmeyen kimlikler varsayılana geri döner.
- `allowedAgentIds`: açık yönlendirmeyi kısıtlar (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan hook ajan çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranlarının ve şablon güdümlü eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin verir (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri (istek + eşleme) için isteğe bağlı önek izin listesi, örn. `["hook:"]`. Herhangi bir eşleme veya ön ayar şablonlu bir `sessionKey` kullandığında zorunlu hale gelir.
- `deliver: true` son yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` değerini alır.
- `model`, bu hook çalıştırması için LLM'yi geçersiz kılar (model kataloğu ayarlanmışsa izin verilmiş olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail ön ayarı `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- Bu ileti başına yönlendirmeyi korursanız `hooks.allowRequestSessionKey: true` olarak ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanıyla eşleşecek şekilde kısıtlayın; örneğin `["hook:", "hook:gmail:"]`.
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

## Canvas ana makinesi

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Gateway portu altında HTTP üzerinden ajan tarafından düzenlenebilir HTML/CSS/JS ve A2UI sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` değerini koruyun (varsayılan).
- loopback dışı bağlamalar: canvas rotaları, diğer Gateway HTTP yüzeyleriyle aynı şekilde Gateway kimlik doğrulaması (token/parola/güvenilen proxy) gerektirir.
- Node WebView'ları genellikle kimlik doğrulama başlıkları göndermez; bir node eşlenip bağlandıktan sonra Gateway, canvas/A2UI erişimi için node kapsamlı yetenek URL'lerini duyurur.
- Yetenek URL'leri etkin node WS oturumuna bağlıdır ve hızla sona erer. IP tabanlı geri dönüş kullanılmaz.
- Sunulan HTML'ye canlı yeniden yükleme istemcisini ekler.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- Ayrıca A2UI'yi `/__openclaw__/a2ui/` adresinde sunar.
- Değişiklikler gateway'in yeniden başlatılmasını gerektirir.
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

- `minimal` (yerleşik `bonjour` Plugin'i etkinken varsayılan): TXT kayıtlarından `cliPath` + `sshPort` değerlerini çıkarır.
- `full`: `cliPath` + `sshPort` değerlerini dahil eder; LAN çok noktaya yayın duyurusu yine de yerleşik `bonjour` Plugin'inin etkin olmasını gerektirir.
- `off`: Plugin etkinliğini değiştirmeden LAN çok noktaya yayın duyurusunu bastırır.
- Yerleşik `bonjour` Plugin'i macOS ana makinelerinde otomatik başlar ve Linux, Windows ve kapsayıcılaştırılmış Gateway dağıtımlarında açık katılımlıdır.
- Ana makine adı, geçerli bir DNS etiketi olduğunda varsayılan olarak sistem ana makine adıdır; aksi halde `openclaw` değerine geri döner. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

### Geniş alan (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` altında tek noktaya yayın DNS-SD bölgesi yazar. Ağlar arası keşif için bir DNS sunucusu (CoreDNS önerilir) + Tailscale bölünmüş DNS ile eşleştirin.

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

- Satır içi ortam değişkenleri yalnızca süreç ortamında anahtar eksikse uygulanır.
- `.env` dosyaları: CWD `.env` + `~/.openclaw/.env` (hiçbiri mevcut değişkenleri geçersiz kılmaz).
- `shellEnv`: oturum açma kabuğu profilinizden eksik beklenen anahtarları içe aktarır.
- Tam öncelik sırası için [Ortam](/tr/help/environment) bölümüne bakın.

### Ortam değişkeni ikamesi

Herhangi bir yapılandırma dizesinde `${VAR_NAME}` ile ortam değişkenlerine başvurun:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Yalnızca büyük harfli adlar eşleşir: `[A-Z_][A-Z0-9_]*`.
- Eksik/boş değişkenler yapılandırma yüklenirken hata fırlatır.
- Değişmez bir `${VAR}` için `$${VAR}` ile kaçış yapın.
- `$include` ile çalışır.

---

## Gizli Bilgiler

Gizli bilgi referansları eklemelidir: düz metin değerler hâlâ çalışır.

### `SecretRef`

Tek bir nesne biçimi kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Doğrulama:

- `provider` deseni: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id deseni: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: mutlak JSON pointer (örneğin `"/providers/openai/apiKey"`)
- `source: "exec"` id deseni: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` id'leri, eğik çizgiyle ayrılmış yol segmentlerinde `.` veya `..` içermemelidir (örneğin `a/../b` reddedilir)

### Desteklenen kimlik bilgisi yüzeyi

- Kanonik matris: [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)
- `secrets apply`, desteklenen `openclaw.json` kimlik bilgisi yollarını hedefler.
- `auth-profiles.json` referansları çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.

### Gizli bilgi sağlayıcıları yapılandırması

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

- `file` sağlayıcısı `mode: "json"` ve `mode: "singleValue"` destekler (`singleValue` modunda `id` `"value"` olmalıdır).
- Windows ACL doğrulaması kullanılamadığında dosya ve exec sağlayıcı yolları güvenli biçimde başarısız olur. `allowInsecurePath: true` değerini yalnızca doğrulanamayan güvenilir yollar için ayarlayın.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yükleri kullanır.
- Varsayılan olarak sembolik bağlantı komut yolları reddedilir. Çözümlenen hedef yol doğrulanırken sembolik bağlantı yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın.
- `trustedDirs` yapılandırılmışsa, güvenilir dizin denetimi çözümlenen hedef yola uygulanır.
- `exec` alt ortamı varsayılan olarak minimaldir; gerekli değişkenleri `passEnv` ile açıkça geçirin.
- Gizli bilgi referansları etkinleştirme zamanında bellek içi bir anlık görüntüye çözümlenir, ardından istek yolları yalnızca anlık görüntüyü okur.
- Etkin yüzey filtreleme etkinleştirme sırasında uygulanır: etkin yüzeylerdeki çözümlenmemiş referanslar başlatma/yeniden yüklemeyi başarısız kılarken, etkin olmayan yüzeyler tanılamalarla atlanır.

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

- Aracı başına profiller `<agentDir>/auth-profiles.json` konumunda saklanır.
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyi referansları destekler (`api_key` için `keyRef`, `token` için `tokenRef`).
- `{ "provider": { "apiKey": "..." } }` gibi eski düz `auth-profiles.json` eşlemeleri bir çalışma zamanı biçimi değildir; `openclaw doctor --fix` bunları `.legacy-flat.*.bak` yedeğiyle kanonik `provider:default` API anahtarı profillerine yeniden yazar.
- OAuth modu profilleri (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli auth-profile kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri, bellek içinde çözümlenmiş anlık görüntülerden gelir; eski statik `auth.json` girdileri keşfedildiğinde temizlenir.
- Eski OAuth içe aktarımları `~/.openclaw/credentials/oauth.json` konumundan yapılır.
- Bkz. [OAuth](/tr/concepts/oauth).
- Gizli bilgiler çalışma zamanı davranışı ve `audit/configure/apply` araçları: [Gizli Bilgi Yönetimi](/tr/gateway/secrets).

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

- `billingBackoffHours`: bir profil gerçek faturalandırma/yetersiz-kredi hataları nedeniyle başarısız olduğunda saat cinsinden temel geri bekleme süresi (varsayılan: `5`). Açık faturalandırma metni, `401`/`403` yanıtlarında bile yine buraya düşebilir, ancak sağlayıcıya özgü metin eşleştiricileri bunların sahibi olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya kuruluş/çalışma alanı harcama sınırı iletileri bunun yerine `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalandırma geri bekleme saatleri için sağlayıcı bazında isteğe bağlı geçersiz kılmalar.
- `billingMaxHours`: faturalandırma geri bekleme üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenilirlikli `auth_permanent` hataları için dakika cinsinden temel geri bekleme süresi (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri bekleme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri bekleme sayaçları için kullanılan saat cinsinden kayan pencere (varsayılan: `24`).
- `overloadedProfileRotations`: model yedeğine geçmeden önce aşırı yükleme hataları için aynı sağlayıcıdaki maksimum kimlik doğrulama profili rotasyonu sayısı (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcının meşgul olduğunu gösteren biçimler buraya düşer.
- `overloadedBackoffMs`: aşırı yüklenmiş bir sağlayıcı/profil rotasyonunu yeniden denemeden önce sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model yedeğine geçmeden önce hız sınırı hataları için aynı sağlayıcıdaki maksimum kimlik doğrulama profili rotasyonu sayısı (varsayılan: `1`). Bu hız sınırı kovası `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

---

## Günlüğe Kaydetme

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
- `--verbose` kullanıldığında `consoleLevel` `debug` seviyesine yükselir.
- `maxFileBytes`: döndürme öncesinde etkin günlük dosyasının bayt cinsinden maksimum boyutu (pozitif tam sayı; varsayılan: `104857600` = 100 MB). OpenClaw, etkin dosyanın yanında en fazla beş numaralandırılmış arşiv tutar.
- `redactSensitive` / `redactPatterns`: konsol çıktısı, dosya günlükleri, OTLP günlük kayıtları ve kalıcı oturum konuşma metni için en iyi çabayla maskeleme. `redactSensitive: "off"` yalnızca bu genel günlük/konuşma politikasını devre dışı bırakır; UI/araç/tanı güvenliği yüzeyleri yayımlamadan önce gizli bilgileri yine de redakte eder.

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

- `enabled`: enstrümantasyon çıktısı için ana açma/kapatma anahtarı (varsayılan: `true`).
- `flags`: hedefli günlük çıktısını etkinleştiren bayrak dizeleri dizisi (`"telegram.*"` veya `"*"` gibi joker karakterleri destekler).
- `stuckSessionWarnMs`: uzun süren işleme oturumlarını `session.long_running`, `session.stalled` veya `session.stuck` olarak sınıflandırmak için ms cinsinden ilerlemesiz yaş eşiği. Yanıt, araç, durum, blok ve ACP ilerlemesi zamanlayıcıyı sıfırlar; tekrarlanan `session.stuck` tanılamaları değişiklik olmadığında geri beklemeye geçer.
- `otel.enabled`: OpenTelemetry dışa aktarma hattını etkinleştirir (varsayılan: `false`). Tam yapılandırma, sinyal kataloğu ve gizlilik modeli için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).
- `otel.endpoint`: OTel dışa aktarma için toplayıcı URL'si.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: isteğe bağlı sinyale özgü OTLP uç noktaları. Ayarlandıklarında yalnızca ilgili sinyal için `otel.endpoint` değerini geçersiz kılarlar.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC meta veri başlıkları.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarımını etkinleştirir.
- `otel.sampleRate`: iz örnekleme oranı `0`–`1`.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri boşaltma aralığı.
- `otel.captureContent`: OTEL span öznitelikleri için ham içerik yakalamaya dahil olma seçeneği. Varsayılan olarak kapalıdır. Boole `true`, sistem dışı ileti/araç içeriğini yakalar; nesne biçimi `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` ve `systemPrompt` değerlerini açıkça etkinleştirmenizi sağlar.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: en son deneysel GenAI span sağlayıcı öznitelikleri için ortam açma/kapatma anahtarı. Varsayılan olarak span'ler uyumluluk için eski `gen_ai.system` özniteliğini tutar; GenAI metrikleri sınırlı semantik öznitelikler kullanır.
- `OPENCLAW_OTEL_PRELOADED=1`: zaten genel bir OpenTelemetry SDK kaydetmiş ana bilgisayarlar için ortam açma/kapatma anahtarı. OpenClaw bu durumda tanılama dinleyicilerini etkin tutarken Plugin'e ait SDK başlatma/kapatma işlemini atlar.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` ve `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: eşleşen yapılandırma anahtarı ayarlanmamışsa kullanılan sinyale özgü uç nokta ortam değişkenleri.
- `cacheTrace.enabled`: yerleşik çalıştırmalar için önbellek izi anlık görüntülerini günlüğe kaydet (varsayılan: `false`).
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

- `channel`: npm/git kurulumları için sürüm kanalı — `"stable"`, `"beta"` veya `"dev"`.
- `checkOnStart`: Gateway başladığında npm güncellemelerini denetle (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka planda otomatik güncellemeyi etkinleştir (varsayılan: `false`).
- `auto.stableDelayHours`: kararlı kanalın otomatik uygulanmasından önce saat cinsinden minimum gecikme (varsayılan: `6`; maksimum: `168`).
- `auto.stableJitterHours`: kararlı kanal dağıtımı için saat cinsinden ek yayma penceresi (varsayılan: `12`; maksimum: `168`).
- `auto.betaCheckIntervalHours`: beta kanal denetimlerinin saat cinsinden ne sıklıkta çalışacağı (varsayılan: `1`; maksimum: `24`).

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

- `enabled`: genel ACP özellik geçidi (varsayılan: `true`; ACP gönderim ve başlatma olanaklarını gizlemek için `false` olarak ayarlayın).
- `dispatch.enabled`: ACP oturum turu gönderimi için bağımsız geçit (varsayılan: `true`). Yürütmeyi engellerken ACP komutlarını kullanılabilir tutmak için `false` olarak ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı arka uç kimliği (kayıtlı bir ACP çalışma zamanı Plugin'iyle eşleşmelidir).
  Önce arka uç Plugin'ini kurun ve `plugins.allow` ayarlanmışsa arka uç Plugin kimliğini (örneğin `acpx`) ekleyin; aksi halde ACP arka ucu yüklenmez.
- `defaultAgent`: başlatmalar açık bir hedef belirtmediğinde kullanılacak yedek ACP hedef ajan kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen ajan kimliklerinin izin listesi; boş olması ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: aynı anda etkin olabilecek maksimum ACP oturumu sayısı.
- `stream.coalesceIdleMs`: akışa alınan metin için ms cinsinden boşta boşaltma penceresi.
- `stream.maxChunkChars`: akışa alınan blok projeksiyonu bölünmeden önceki maksimum parça boyutu.
- `stream.repeatSuppression`: tur başına tekrarlanan durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı olarak akışa alır; `"final_only"` tur sonlandırma olaylarına kadar arabelleğe alır.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önceki ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP turu başına projekte edilen maksimum asistan çıktı karakteri sayısı.
- `stream.maxSessionUpdateChars`: projekte edilen ACP durum/güncelleme satırları için maksimum karakter sayısı.
- `stream.tagVisibility`: akışa alınan olaylar için etiket adlarından boole görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum çalışanlarının temizlenmeye uygun hale gelmeden önce dakika cinsinden boşta kalma TTL'si.
- `runtime.installCommand`: bir ACP çalışma zamanı ortamı önyüklenirken çalıştırılacak isteğe bağlı kurulum komutu.

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

- `cli.banner.taglineMode` afiş sloganı stilini denetler:
  - `"random"` (varsayılan): dönüşümlü komik/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yok (afiş başlığı/sürümü yine de gösterilir).
- Tüm afişi gizlemek için (yalnızca sloganları değil), `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

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

[Agent varsayılanları](/tr/gateway/config-agents#agent-defaults) altındaki `agents.list` kimlik alanlarına bakın.

---

## Köprü (eski, kaldırıldı)

Geçerli derlemeler artık TCP köprüsünü içermez. Node'lar Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları çıkarabilir).

<Accordion title="Eski köprü yapılandırması (tarihsel başvuru)">

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

- `sessionRetention`: tamamlanan yalıtılmış cron çalıştırma oturumlarının `sessions.json` içinden budanmadan önce ne kadar süre tutulacağı. Arşivlenmiş silinmiş cron konuşmalarının temizlenmesini de denetler. Varsayılan: `24h`; devre dışı bırakmak için `false` olarak ayarlayın.
- `runLog.maxBytes`: budama öncesinde çalıştırma günlüğü dosyası (`cron/runs/<jobId>.jsonl`) başına maksimum boyut. Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: çalıştırma günlüğü budaması tetiklendiğinde tutulan en yeni satırlar. Varsayılan: `2000`.
- `webhookToken`: cron Webhook POST teslimi (`delivery.mode = "webhook"`) için kullanılan bearer token; atlanırsa kimlik doğrulama başlığı gönderilmez.
- `webhook`: hâlâ `notify: true` değerine sahip depolanmış işler için yalnızca kullanılan kullanımdan kaldırılmış eski yedek Webhook URL'si (http/https).

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
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: Cron işleri için hata uyarılarını etkinleştirir (varsayılan: `false`).
- `after`: uyarı tetiklenmeden önceki ardışık hata sayısı (pozitif tam sayı, min: `1`).
- `cooldownMs`: aynı iş için yinelenen uyarılar arasındaki en az milisaniye süresi (negatif olmayan tam sayı).
- `includeSkipped`: ardışık atlanan çalıştırmaları uyarı eşiğine dahil eder (varsayılan: `false`). Atlanan çalıştırmalar ayrı izlenir ve yürütme hatası geri çekilmesini etkilemez.
- `mode`: teslim modu — `"announce"` bir kanal mesajı üzerinden gönderir; `"webhook"` yapılandırılmış Webhook'a gönderir.
- `accountId`: uyarı teslimini kapsam içine almak için isteğe bağlı hesap veya kanal kimliği.

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

- Tüm işlerde Cron hata bildirimleri için varsayılan hedef.
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi olduğunda varsayılan olarak `"announce"` kullanılır.
- `channel`: duyuru teslimi için kanal geçersiz kılma. `"last"` son bilinen teslim kanalını yeniden kullanır.
- `to`: açık duyuru hedefi veya Webhook URL'si. Webhook modu için gereklidir.
- `accountId`: teslim için isteğe bağlı hesap geçersiz kılma.
- İş bazındaki `delivery.failureDestination` bu genel varsayılanı geçersiz kılar.
- Genel veya iş bazında hata hedefi ayarlanmadığında, zaten `announce` üzerinden teslim eden işler hata durumunda bu birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, işin birincil `delivery.mode` değeri `"webhook"` olmadığı sürece yalnızca `sessionTarget="isolated"` işleri için desteklenir.

Bkz. [Cron İşleri](/tr/automation/cron-jobs). Yalıtılmış Cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya modeli şablon değişkenleri

`tools.media.models[].args` içinde genişletilen şablon yer tutucuları:

| Değişken           | Açıklama                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Tam gelen mesaj gövdesi                           |
| `{{RawBody}}`      | Ham gövde (geçmiş/gönderen sarmalayıcıları yok)   |
| `{{BodyStripped}}` | Grup bahsetmeleri çıkarılmış gövde                |
| `{{From}}`         | Gönderen tanımlayıcısı                            |
| `{{To}}`           | Hedef tanımlayıcısı                               |
| `{{MessageSid}}`   | Kanal mesaj kimliği                               |
| `{{SessionId}}`    | Geçerli oturum UUID'si                            |
| `{{IsNewSession}}` | Yeni oturum oluşturulduğunda `"true"`             |
| `{{MediaUrl}}`     | Gelen medya sözde URL'si                          |
| `{{MediaPath}}`    | Yerel medya yolu                                  |
| `{{MediaType}}`    | Medya türü (image/audio/document/…)               |
| `{{Transcript}}`   | Ses dökümü                                        |
| `{{Prompt}}`       | CLI girdileri için çözümlenmiş medya istemi       |
| `{{MaxChars}}`     | CLI girdileri için çözümlenmiş en fazla çıktı karakteri |
| `{{ChatType}}`     | `"direct"` veya `"group"`                         |
| `{{GroupSubject}}` | Grup konusu (elinden geldiğince)                  |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (elinden geldiğince)      |
| `{{SenderName}}`   | Gönderen görünen adı (elinden geldiğince)         |
| `{{SenderE164}}`   | Gönderen telefon numarası (elinden geldiğince)    |
| `{{Provider}}`     | Sağlayıcı ipucu (whatsapp, telegram, discord vb.) |

---

## Yapılandırma dahil etmeleri (`$include`)

Yapılandırmayı birden fazla dosyaya bölün:

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

- Tek dosya: içeren nesnenin yerini alır.
- Dosya dizisi: sırayla derinlemesine birleştirilir (sonrakiler öncekileri geçersiz kılar).
- Kardeş anahtarlar: dahil etmelerden sonra birleştirilir (dahil edilen değerleri geçersiz kılar).
- İç içe dahil etmeler: en fazla 10 seviye derinliğe kadar.
- Yollar: dahil eden dosyaya göre çözümlenir, ancak en üst düzey yapılandırma dizininin (`openclaw.json` için `dirname`) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca bu sınırın içinde çözümleniyorlarsa izin verilir.
- OpenClaw'a ait, tek dosyalık bir dahil etme ile desteklenen yalnızca tek bir üst düzey bölümü değiştiren yazmalar, o dahil edilen dosyaya yazılır. Örneğin, `plugins install`, `plugins: { $include: "./plugins.json5" }` öğesini `plugins.json5` içinde günceller ve `openclaw.json` dosyasını olduğu gibi bırakır.
- Kök dahil etmeleri, dahil etme dizileri ve kardeş geçersiz kılmaları olan dahil etmeler, OpenClaw'a ait yazmalar için salt okunurdur; bu yazmalar yapılandırmayı düzleştirmek yerine kapalı şekilde başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları ve döngüsel dahil etmeler için açık mesajlar.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
