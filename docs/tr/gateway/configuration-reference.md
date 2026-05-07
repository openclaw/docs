---
read_when:
    - Alan düzeyinde kesin yapılandırma semantiğine veya varsayılan değerlere ihtiyacınız var
    - Kanal, model, Gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Çekirdek OpenClaw anahtarları, varsayılan değerleri ve özel alt sistem başvurularına bağlantılar için Gateway yapılandırma başvurusu
title: Yapılandırma referansı
x-i18n:
    generated_at: "2026-05-07T13:17:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b279c3e74fd6f7de01d63b642ab17aaaac65c39b855efc745eadc121adbf1fb
    source_path: gateway/configuration-reference.md
    workflow: 16
---

OpenClaw config yüzeyi `~/.openclaw/openclaw.json` için temel başvuru. Görev odaklı genel bakış için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

Ana OpenClaw config yüzeylerini kapsar ve bir alt sistemin kendi daha derin başvurusu olduğunda bağlantı verir. Kanal ve Plugin sahipli komut katalogları ile derin bellek/QMD ayarları bu sayfa yerine kendi sayfalarında bulunur.

Kod gerçeği:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema'yı yazdırır; mevcut olduğunda paketli/Plugin/kanal metadata'sı birleştirilir
- `config.schema.lookup`, ayrıntılandırma araçları için yol kapsamlı tek bir schema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, config-doc temel hash'ini mevcut schema yüzeyine göre doğrular

Agent arama yolu: düzenlemelerden önce tam alan düzeyi dokümanlar ve kısıtlar için
`gateway` araç eylemi `config.schema.lookup` kullanın. Görev odaklı rehberlik için
[Yapılandırma](/tr/gateway/configuration) bölümünü, daha geniş alan haritası,
varsayılanlar ve alt sistem başvurularına bağlantılar için bu sayfayı kullanın.

Özel derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki dreaming config için [Bellek yapılandırması başvurusu](/tr/reference/memory-config)
- Mevcut yerleşik + paketli komut kataloğu için [Slash komutları](/tr/tools/slash-commands)
- Kanala özgü komut yüzeyleri için sahip kanal/Plugin sayfaları

Config biçimi **JSON5**'tir (yorumlara + sonda virgüllere izin verilir). Tüm alanlar isteğe bağlıdır - OpenClaw atlandıklarında güvenli varsayılanlar kullanır.

---

## Kanallar

Kanal başına config anahtarları özel bir sayfaya taşındı - Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve diğer
paketli kanallar dahil `channels.*` için
[Yapılandırma - kanallar](/tr/gateway/config-channels) bölümüne bakın (kimlik doğrulama, erişim denetimi, çoklu hesap, bahsetme kapısı).

## Agent varsayılanları, çoklu agent, oturumlar ve iletiler

Özel bir sayfaya taşındı - şunlar için
[Yapılandırma - agent'lar](/tr/gateway/config-agents) bölümüne bakın:

- `agents.defaults.*` (çalışma alanı, model, düşünme, heartbeat, bellek, medya, skills, sandbox)
- `multiAgent.*` (çoklu agent yönlendirme ve bağlamalar)
- `session.*` (oturum yaşam döngüsü, Compaction, budama)
- `messages.*` (ileti teslimi, TTS, markdown işleme)
- `talk.*` (Talk modu)
  - `talk.speechLocale`: iOS/macOS üzerinde Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği
  - `talk.silenceTimeoutMs`: ayarlanmadığında Talk, transkripti göndermeden önce platformun varsayılan duraklama penceresini korur (`macOS ve Android üzerinde 700 ms, iOS üzerinde 900 ms`)

## Araçlar ve özel sağlayıcılar

Araç ilkesi, deneysel anahtarlar, sağlayıcı destekli araç config'i ve özel
sağlayıcı / temel URL kurulumu özel bir sayfaya taşındı - bkz.
[Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## Modeller

Sağlayıcı tanımları, model izin listeleri ve özel sağlayıcı kurulumu
[Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) içinde bulunur.
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
- `models.providers`: sağlayıcı kimliğine göre anahtarlanan özel sağlayıcı haritası.
- `models.pricing.enabled`: sidecar'lar ve kanallar Gateway hazır yoluna ulaştıktan sonra başlayan arka plan fiyatlandırma başlatmasını denetler. `false` olduğunda
  Gateway, OpenRouter ve LiteLLM fiyatlandırma kataloğu getirmelerini atlar; yapılandırılmış
  `models.providers.*.models[].cost` değerleri yerel maliyet tahminleri için çalışmaya devam eder.

## MCP

OpenClaw tarafından yönetilen MCP sunucu tanımları `mcp.servers` altında bulunur ve
yerleşik Pi ile diğer runtime bağdaştırıcıları tarafından tüketilir. `openclaw mcp list`,
`show`, `set` ve `unset` komutları, config düzenlemeleri sırasında hedef sunucuya
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

- `mcp.servers`: yapılandırılmış MCP araçlarını açığa çıkaran runtime'lar için adlandırılmış stdio veya uzak MCP sunucu tanımları.
  Uzak girdiler `transport: "streamable-http"` veya `transport: "sse"` kullanır;
  `type: "http"`, `openclaw mcp set` ve
  `openclaw doctor --fix` tarafından kanonik `transport` alanına normalize edilen CLI'ya özgü bir takma addır.
- `mcp.sessionIdleTtlMs`: oturum kapsamlı paketli MCP runtime'ları için boşta kalma TTL'si.
  Tek seferlik yerleşik çalıştırmalar, çalışma sonu temizliği ister; bu TTL,
  uzun ömürlü oturumlar ve gelecekteki çağıranlar için geri duraktır.
- `mcp.*` altındaki değişiklikler, önbelleğe alınmış oturum MCP runtime'larını dispose ederek sıcak uygulanır.
  Sonraki araç keşfi/kullanımı bunları yeni config'ten yeniden oluşturur; bu nedenle kaldırılan
  `mcp.servers` girdileri boşta kalma TTL'sini beklemek yerine hemen toplanır.

Runtime davranışı için [MCP](/tr/cli/mcp#openclaw-as-an-mcp-client-registry) ve
[CLI backend'leri](/tr/gateway/cli-backends#bundle-mcp-overlays) bölümlerine bakın.

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

- `allowBundled`: yalnızca paketli Skills için isteğe bağlı izin listesi (yönetilen/çalışma alanı Skills etkilenmez).
- `load.extraDirs`: ek paylaşılan skill kökleri (en düşük öncelik).
- `install.preferBrew`: true olduğunda, `brew` mevcutsa diğer yükleyici türlerine geri düşmeden önce Homebrew yükleyicilerini tercih eder.
- `install.nodeManager`: `metadata.openclaw.install` spec'leri için Node yükleyici tercihi
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false`, paketli/yüklü olsa bile bir skill'i devre dışı bırakır.
- `entries.<skillKey>.apiKey`: birincil env var bildiren Skills için kolaylık (düz metin string veya SecretRef nesnesi).

---

## Plugin'ler

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
- Keşif, yerel OpenClaw Plugin'lerin yanı sıra uyumlu Codex bundle'larını ve Claude bundle'larını, manifest içermeyen Claude varsayılan düzen bundle'ları dahil kabul eder.
- **Config değişiklikleri gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen Plugin'ler yüklenir). `deny` kazanır.
- `bundledDiscovery`: yeni config'ler için varsayılan olarak `"allowlist"` değerini alır; böylece boş olmayan
  `plugins.allow`, web arama runtime sağlayıcıları dahil paketli sağlayıcı Plugin'lerini de kapılar.
  Doctor, mevcut paketli sağlayıcı davranışını siz dahil olana kadar korumak için taşınmış eski izin listesi config'lerine `"compat"` yazar.
- `plugins.entries.<id>.apiKey`: Plugin düzeyinde API anahtarı kolaylık alanı (Plugin tarafından desteklendiğinde).
- `plugins.entries.<id>.env`: Plugin kapsamlı env var haritası.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda çekirdek `before_prompt_build`'i engeller ve eski `before_agent_start` içinden prompt'u değiştiren alanları yok sayarken eski `modelOverride` ve `providerOverride` değerlerini korur. Yerel Plugin hook'larına ve desteklenen bundle tarafından sağlanan hook dizinlerine uygulanır.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` olduğunda güvenilir, paketli olmayan Plugin'ler `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` ve `agent_end` gibi typed hook'lardan ham konuşma içeriğini okuyabilir.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu Plugin'in arka plan subagent çalıştırmaları için çalışma başına `provider` ve `model` override'ları istemesine açıkça güven.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilir subagent override'ları için kanonik `provider/model` hedeflerinin isteğe bağlı izin listesi. `"*"` değerini yalnızca herhangi bir modele izin vermeyi bilinçli olarak istediğinizde kullanın.
- `plugins.entries.<id>.config`: Plugin tanımlı config nesnesi (mevcut olduğunda yerel OpenClaw Plugin schema'sı tarafından doğrulanır).
- Kanal Plugin hesabı/runtime ayarları `channels.<id>` altında bulunur ve merkezi bir OpenClaw seçenek kayıt defteriyle değil, sahip Plugin'in manifest `channelConfigs` metadata'sı ile açıklanmalıdır.
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web getirme sağlayıcı ayarları.
  - `apiKey`: Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` env var'a geri düşer.
  - `baseUrl`: Firecrawl API temel URL'si (varsayılan: `https://api.firecrawl.dev`; kendi barındırılan override'lar özel/iç uç noktaları hedeflemelidir).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkar (varsayılan: `true`).
  - `maxAgeMs`: milisaniye cinsinden maksimum önbellek yaşı (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: scrape isteği zaman aşımı, saniye cinsinden (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web araması) ayarları.
  - `enabled`: X Search sağlayıcısını etkinleştir.
  - `model`: arama için kullanılacak Grok modeli (örn. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: bellek Dreaming ayarları. Aşamalar ve eşikler için [Dreaming](/tr/concepts/dreaming) bölümüne bakın.
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam dreaming taraması için cron sıklığı (varsayılan olarak `"0 3 * * *"`).
  - `model`: isteğe bağlı Dream Diary subagent model override'ı. `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir; hedefleri kısıtlamak için `allowedModels` ile eşleştirin. Model kullanılamıyor hataları oturum varsayılan modeliyle bir kez yeniden denenir; güven veya izin listesi hataları sessizce geri düşmez.
  - aşama ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya dönük config anahtarları değildir).
- Tam bellek config'i [Bellek yapılandırması başvurusu](/tr/reference/memory-config) içinde bulunur:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude bundle Plugin'leri ayrıca `settings.json` içinden yerleşik Pi varsayılanlarına katkıda bulunabilir; OpenClaw bunları ham OpenClaw config yamaları olarak değil, sanitize edilmiş agent ayarları olarak uygular.
- `plugins.slots.memory`: etkin bellek Plugin kimliğini seçin veya bellek Plugin'lerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: etkin context engine Plugin kimliğini seçin; başka bir engine yükleyip seçmediğiniz sürece varsayılan `"legacy"` değeridir.

Bkz. [Plugin'ler](/tr/tools/plugin).

---

## Taahhütler

`commitments`, çıkarımsanan takip belleğini denetler: OpenClaw konuşma turlarından check-in'leri algılayabilir ve bunları heartbeat çalıştırmaları üzerinden teslim edebilir.

- `commitments.enabled`: çıkarımsanan takip taahhütleri için gizli LLM çıkarımı, depolama ve heartbeat teslimini etkinleştir. Varsayılan: `false`.
- `commitments.maxPerDay`: kayan bir günde agent oturumu başına teslim edilen maksimum çıkarımsanan takip taahhüdü. Varsayılan: `3`.

Bkz. [Çıkarımsanan taahhütler](/tr/concepts/commitments).

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
- `tabCleanup`, boşta kalma süresinden sonra veya bir oturum sınırını aştığında izlenen birincil ajan sekmelerini geri kazanır. Bu ayrı temizleme modlarını devre dışı bırakmak için `idleMinutes: 0` veya `maxTabsPerSession: 0` ayarlayın.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`, ayarlanmadığında devre dışıdır; bu nedenle tarayıcı gezintisi varsayılan olarak katı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezintisine bilinçli olarak güvendiğinizde ayarlayın.
- Katı modda, uzak CDP profil uç noktaları (`profiles.*.cdpUrl`) erişilebilirlik/keşif kontrolleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski bir takma ad olarak desteklenmeye devam eder.
- Katı modda, açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca bağlanma içindir (başlatma/durdurma/sıfırlama devre dışıdır).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw’ın `/json/version` keşfi yapmasını istediğinizde HTTP(S) kullanın; sağlayıcınız size doğrudan DevTools WebSocket URL’si verdiğinde WS(S) kullanın.
- `remoteCdpTimeoutMs` ve `remoteCdpHandshakeTimeoutMs`, uzak ve `attachOnly` CDP erişilebilirliğine ve sekme açma isteklerine uygulanır. Yönetilen local loopback profilleri yerel CDP varsayılanlarını korur.
- Harici olarak yönetilen bir CDP hizmetine local loopback üzerinden erişilebiliyorsa, o profilin `attachOnly: true` değerini ayarlayın; aksi halde OpenClaw local loopback bağlantı noktasını yerel yönetilen bir tarayıcı profili olarak değerlendirir ve yerel bağlantı noktası sahipliği hataları bildirebilir.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve seçilen ana makinede veya bağlı bir tarayıcı node’u üzerinden bağlanabilir.
- `existing-session` profilleri, Brave veya Edge gibi belirli bir Chromium tabanlı tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri mevcut Chrome MCP rota sınırlarını korur:
  CSS seçici hedefleme yerine anlık görüntü/ref odaklı eylemler, tek dosya yükleme kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; `cdpUrl` değerini yalnızca uzak CDP için açıkça ayarlayın.
- Yerel yönetilen profiller, o profil için global `browser.executablePath` değerini geçersiz kılmak üzere `executablePath` ayarlayabilir. Bunu bir profili Chrome’da, diğerini Brave’de çalıştırmak için kullanın.
- Yerel yönetilen profiller, süreç başlatıldıktan sonra Chrome CDP HTTP keşfi için `browser.localLaunchTimeoutMs` ve başlatma sonrası CDP websocket hazırlığı için `browser.localCdpReadyTimeoutMs` kullanır. Chrome’un başarıyla başladığı ancak hazırlık kontrollerinin başlangıçla yarıştığı daha yavaş ana makinelerde bunları artırın. Her iki değer de `120000` ms’ye kadar pozitif tam sayılar olmalıdır; geçersiz yapılandırma değerleri reddedilir.
- Otomatik algılama sırası: Chromium tabanlıysa varsayılan tarayıcı → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` ve `browser.profiles.<name>.executablePath`, Chromium başlatılmadan önce işletim sistemi ana dizininiz için hem `~` hem de `~/...` kabul eder.
  `existing-session` profillerindeki profil başına `userDataDir` de tilde ile genişletilir.
- Kontrol hizmeti: yalnızca local loopback (bağlantı noktası `gateway.port` değerinden türetilir, varsayılan `18791`).
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

- `seamColor`: yerel uygulama kullanıcı arayüzü kromu için vurgu rengi (Konuşma Modu balon tonu vb.).
- `assistant`: Kontrol Kullanıcı Arayüzü kimlik geçersiz kılması. Etkin ajan kimliğine geri döner.

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

- `mode`: `local` (gateway'i çalıştırır) veya `remote` (uzak gateway'e bağlanır). Gateway, `local` olmadığı sürece başlatılmayı reddeder.
- `port`: WS + HTTP için tek çoklanmış port. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP'si) veya `custom`.
- **Eski bind takma adları**: `gateway.bind` içinde host takma adlarını (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind'i, container içinde `127.0.0.1` üzerinde dinler. Docker bridge ağıyla (`-p 18789:18789`) trafik `eth0` üzerinden gelir, bu yüzden gateway erişilemez. Tüm arayüzlerde dinlemek için `--network host` kullanın veya `bind: "lan"` (ya da `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Kimlik doğrulama**: varsayılan olarak gereklidir. Loopback dışı bind'ler gateway kimlik doğrulaması gerektirir. Pratikte bu, paylaşılan bir token/parola veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkındalıklı bir ters proxy anlamına gelir. Onboarding sihirbazı varsayılan olarak bir token oluşturur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. İkisi de yapılandırıldığında ve mod ayarlanmadığında başlatma ve servis kurulum/onarım akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık kimlik doğrulamasız mod. Yalnızca güvenilir local loopback kurulumları için kullanın; bu, onboarding istemlerinde özellikle sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: tarayıcı/kullanıcı kimlik doğrulamasını kimlik farkındalıklı bir ters proxy'ye devredin ve `gateway.trustedProxies` üzerinden gelen kimlik başlıklarına güvenin (bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)). Bu mod varsayılan olarak **loopback dışı** bir proxy kaynağı bekler; aynı host'taki loopback ters proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir. Dahili aynı host çağırıcıları yerel doğrudan yedek olarak `gateway.auth.password` kullanabilir; `gateway.auth.token`, trusted-proxy moduyla karşılıklı olarak dışlayıcı kalır.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını **kullanmaz**; bunun yerine gateway'in normal HTTP kimlik doğrulama modunu izler. Bu tokensız akış, gateway host'unun güvenilir olduğunu varsayar. Varsayılan olarak `tailscale.mode = "serve"` olduğunda `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP'si ve kimlik doğrulama kapsamı başına uygulanır (shared-secret ve device-token bağımsız izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Eşzamansız Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler hata yazımından önce sıralanır. Bu nedenle aynı istemciden gelen eşzamanlı kötü denemeler, ikisinin de düz uyuşmazlık olarak yarışıp geçmesi yerine sınırlayıcıyı ikinci istekte tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` olur; localhost trafiğinin de hız sınırına tabi olmasını özellikle istediğinizde (test kurulumları veya katı proxy dağıtımları için) `false` ayarlayın.
- Tarayıcı kaynaklı WS kimlik doğrulama denemeleri, loopback muafiyeti devre dışı bırakılarak her zaman sınırlandırılır (tarayıcı tabanlı localhost brute force'a karşı derinlemesine savunma).
- Loopback üzerinde, bu tarayıcı kaynaklı kilitlemeler normalleştirilmiş `Origin`
  değerine göre yalıtılır, bu nedenle bir localhost kaynağından tekrarlanan hatalar
  farklı bir kaynağı otomatik olarak kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, loopback bind) veya `funnel` (genel, kimlik doğrulaması gerektirir).
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı kaynağı izin listesi. Tarayıcı istemcileri loopback dışı kaynaklardan beklendiğinde gereklidir.
- `controlUi.chatMessageMaxWidth`: gruplanmış Control UI sohbet mesajları için isteğe bağlı maksimum genişlik. `960px`, `82%`, `min(1280px, 82%)` ve `calc(100% - 2rem)` gibi kısıtlı CSS genişlik değerlerini kabul eder.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host başlığı kaynak ilkesine özellikle dayanan dağıtımlar için Host başlığı kaynak yedeğini etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için `remote.url`, `ws://` veya `wss://` olmalıdır.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: düz metin `ws://` bağlantılarına güvenilir özel ağ
  IP'leri için izin veren istemci tarafı süreç ortamı
  acil durum geçersiz kılması; düz metin için varsayılan loopback-only kalır. Bunun `openclaw.json`
  eşdeğeri yoktur ve
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` gibi tarayıcı özel ağ yapılandırmaları Gateway
  WebSocket istemcilerini etkilemez.
- `gateway.remote.token` / `.password` uzak istemci kimlik bilgisi alanlarıdır. Kendi başlarına gateway kimlik doğrulamasını yapılandırmazlar.
- `gateway.push.apns.relay.baseUrl`: official/TestFlight iOS derlemeleri tarafından, relay destekli kayıtları gateway'e yayımladıktan sonra kullanılan harici APNs relay'i için temel HTTPS URL'si. Bu URL, iOS derlemesine derlenen relay URL'siyle eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: gateway'den relay'e gönderim zaman aşımı, milisaniye cinsinden. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir gateway kimliğine devredilir. Eşleştirilmiş iOS uygulaması `gateway.identity.get` alır, bu kimliği relay kaydına dahil eder ve kayıt kapsamlı bir gönderim yetkisini gateway'e iletir. Başka bir gateway, depolanan bu kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici ortam geçersiz kılmaları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL'leri için yalnızca geliştirme amaçlı kaçış yolu. Üretim relay URL'leri HTTPS üzerinde kalmalıdır.
- `gateway.handshakeTimeoutMs`: kimlik doğrulama öncesi Gateway WebSocket el sıkışma zaman aşımı, milisaniye cinsinden. Varsayılan: `15000`. Ayarlandığında `OPENCLAW_HANDSHAKE_TIMEOUT_MS` önceliklidir. Yerel istemcilerin bağlanabildiği, ancak başlangıç ısınmasının hâlâ oturduğu yüklü veya düşük güçlü host'larda bunu artırın.
- `gateway.channelHealthCheckMinutes`: kanal sağlık izleyicisi aralığı, dakika cinsinden. Sağlık izleyicisi yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: bayat socket eşiği, dakika cinsinden. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına maksimum sağlık izleyicisi yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izleyiciyi etkin tutarken sağlık izleyicisi yeniden başlatmaları için kanal başına devre dışı bırakma.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap başına geçersiz kılma. Ayarlandığında kanal düzeyi geçersiz kılmaya göre önceliklidir.
- Yerel gateway çağrı yolları, `gateway.auth.*` ayarlanmamışsa yalnızca yedek olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef aracılığıyla açıkça yapılandırılmışsa ve çözümlenememişse, çözümleme kapalı başarısız olur (uzak yedek maskelemesi yok).
- `trustedProxies`: TLS'i sonlandıran veya iletilmiş istemci başlıkları ekleyen ters proxy IP'leri. Yalnızca kontrol ettiğiniz proxy'leri listeleyin. Loopback girdileri aynı host proxy/yerel algılama kurulumları için (örneğin Tailscale Serve veya yerel ters proxy) hâlâ geçerlidir, ancak loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hale **getirmez**.
- `allowRealIpFallback`: `true` olduğunda, `X-Forwarded-For` eksikse gateway `X-Real-IP` kabul eder. Kapalı başarısız davranışı için varsayılan `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: istenen kapsam olmadan ilk kez node cihaz eşleştirmesini otomatik onaylamak için isteğe bağlı CIDR/IP izin listesi. Ayarlanmadığında devre dışıdır. Bu, operatör/tarayıcı/Control UI/WebChat eşleştirmesini otomatik onaylamaz ve rol, kapsam, metadata veya açık anahtar yükseltmelerini otomatik onaylamaz.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: eşleştirme ve platform izin listesi değerlendirmesinden sonra bildirilen node komutları için genel izin/ret şekillendirmesi. `camera.snap`, `camera.clip` ve `screen.record` gibi tehlikeli node komutlarını seçerek etkinleştirmek için `allowCommands` kullanın; `denyCommands`, bir platform varsayılanı veya açık izin aksi halde komutu içerse bile komutu kaldırır. Bir node bildirdiği komut listesini değiştirdikten sonra, gateway'in güncellenmiş komut anlık görüntüsünü saklaması için bu cihaz eşleştirmesini reddedip yeniden onaylayın.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek araç adları (varsayılan ret listesini genişletir).
- `gateway.tools.allow`: araç adlarını varsayılan HTTP ret listesinden kaldırın.

</Accordion>

### OpenAI uyumlu uç noktalar

- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdisi sıkılaştırması:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarlanmamış kabul edilir; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt sıkılaştırma başlığı:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca kontrol ettiğiniz HTTPS kaynakları için ayarlayın; bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çoklu örnek yalıtımı

Tek bir host üzerinde benzersiz portlar ve durum dizinleriyle birden fazla gateway çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Kolaylık bayrakları: `--dev` (`~/.openclaw-dev` + port `19001` kullanır), `--profile <name>` (`~/.openclaw-<name>` kullanır).

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

- `enabled`: gateway dinleyicisinde TLS sonlandırmasını (HTTPS/WSS) etkinleştirir (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel kendinden imzalı bir sertifika/anahtar çifti otomatik oluşturur; yalnızca yerel/geliştirme kullanımı içindir.
- `certPath`: TLS sertifika dosyasına dosya sistemi yolu.
- `keyPath`: TLS özel anahtar dosyasına dosya sistemi yolu; izinleri kısıtlı tutun.
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
  - `"off"`: canlı düzenlemeleri yok sayar; değişiklikler açık bir yeniden başlatma gerektirir.
  - `"restart"`: yapılandırma değişikliğinde gateway sürecini her zaman yeniden başlatır.
  - `"hot"`: değişiklikleri yeniden başlatmadan süreç içinde uygular.
  - `"hybrid"` (varsayılan): önce hot reload dener; gerekirse yeniden başlatmaya geri döner.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tam sayı).
- `deferralTimeoutMs`: yeniden başlatmayı veya kanal hot reload'unu zorlamadan önce uçuşta olan işlemleri beklemek için ms cinsinden isteğe bağlı maksimum süre. Varsayılan sınırlı beklemeyi (`300000`) kullanmak için atlayın; süresiz beklemek ve periyodik hâlâ beklemede uyarıları günlüğe yazmak için `0` ayarlayın.

---

## Hook'lar

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
Sorgu dizgesi hook tokenları reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, `gateway.auth.token` değerinden **farklı** olmalıdır; Gateway tokenının yeniden kullanılması reddedilir.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini sınırlandırın (örneğin `["hook:"]`).
- Bir eşleme veya ön ayar şablonlu bir `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` değerini ayarlayın ve `hooks.allowRequestSessionKey=true` yapın. Statik eşleme anahtarları bu açık onayı gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükünden gelen `sessionKey` yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` üzerinden çözümlenir
  - Şablonla oluşturulan eşleme `sessionKey` değerleri dışarıdan sağlanmış kabul edilir ve ayrıca `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Eşleme ayrıntıları">

- `match.path`, `/hooks` sonrasındaki alt yolla eşleşir (örn. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanıyla eşleşir.
- `{{messages[0].subject}}` gibi şablonlar yükten okur.
- `transform`, bir hook eylemi döndüren bir JS/TS modülünü işaret edebilir.
  - `transform.module` göreli bir yol olmalı ve `hooks.transformsDir` içinde kalmalıdır (mutlak yollar ve dizin dışına çıkma reddedilir).
  - `hooks.transformsDir` değerini `~/.openclaw/hooks/transforms` altında tutun; çalışma alanı skill dizinleri reddedilir. `openclaw doctor` bu yolu geçersiz olarak bildirirse dönüştürme modülünü hooks dönüşüm dizinine taşıyın veya `hooks.transformsDir` değerini kaldırın.
- `agentId`, belirli bir ajana yönlendirir; bilinmeyen kimlikler varsayılana geri döner.
- `allowedAgentIds`: açık yönlendirmeyi sınırlar (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan yapılan hook ajan çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranların ve şablonla yönlendirilen eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin verin (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri için isteğe bağlı önek izin listesi (istek + eşleme), örn. `["hook:"]`. Herhangi bir eşleme veya ön ayar şablonlu bir `sessionKey` kullandığında zorunlu hale gelir.
- `deliver: true`, son yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` olur.
- `model`, bu hook çalıştırması için LLM değerini geçersiz kılar (model kataloğu ayarlıysa izin verilmiş olmalıdır).

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

## Canvas Plugin ana makinesi

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Ajan tarafından düzenlenebilir HTML/CSS/JS ve A2UI'yi Gateway portu altında HTTP üzerinden sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` değerini koruyun (varsayılan).
- local loopback olmayan bağlamalar: canvas rotaları, diğer Gateway HTTP yüzeyleriyle aynı şekilde Gateway kimlik doğrulaması (token/password/trusted-proxy) gerektirir.
- Node WebView'ları genellikle kimlik doğrulama üstbilgileri göndermez; bir node eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için node kapsamlı yetenek URL'lerini duyurur.
- Yetenek URL'leri etkin node WS oturumuna bağlıdır ve hızlıca sona erer. IP tabanlı yedek kullanılmaz.
- Sunulan HTML'ye canlı yeniden yükleme istemcisini enjekte eder.
- Boşken başlangıç `index.html` dosyasını otomatik oluşturur.
- Ayrıca A2UI'yi `/__openclaw__/a2ui/` konumunda sunar.
- Değişiklikler gateway yeniden başlatması gerektirir.
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

- `minimal` (yerleşik `bonjour` Plugin etkin olduğunda varsayılan): TXT kayıtlarından `cliPath` + `sshPort` değerlerini çıkarır.
- `full`: `cliPath` + `sshPort` değerlerini dahil eder; LAN çok noktaya yayın duyurusu yine de yerleşik `bonjour` Plugin'in etkin olmasını gerektirir.
- `off`: Plugin etkinliğini değiştirmeden LAN çok noktaya yayın duyurusunu bastırır.
- Yerleşik `bonjour` Plugin, macOS ana makinelerinde otomatik başlar; Linux, Windows ve kapsayıcılaştırılmış Gateway dağıtımlarında isteğe bağlıdır.
- Ana makine adı, geçerli bir DNS etiketi olduğunda varsayılan olarak sistem ana makine adı olur; aksi halde `openclaw` değerine geri döner. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

### Geniş alan (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` altında bir tek noktaya yayın DNS-SD bölgesi yazar. Ağlar arası keşif için bir DNS sunucusuyla (CoreDNS önerilir) + Tailscale split DNS ile birlikte kullanın.

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
- `shellEnv`: eksik beklenen anahtarları oturum açma kabuğu profilinizden içe aktarır.
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
- Eksik/boş değişkenler yapılandırma yüklenirken hata oluşturur.
- Gerçek bir `${VAR}` için `$${VAR}` ile kaçış yapın.
- `$include` ile çalışır.

---

## Gizli değerler

Gizli değer başvuruları eklemelidir: düz metin değerler çalışmaya devam eder.

### `SecretRef`

Tek bir nesne şekli kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Doğrulama:

- `provider` deseni: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id deseni: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: mutlak JSON işaretçisi (örneğin `"/providers/openai/apiKey"`)
- `source: "exec"` id deseni: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` id’leri `.` veya `..` eğik çizgiyle sınırlandırılmış yol parçaları içermemelidir (örneğin `a/../b` reddedilir)

### Desteklenen kimlik bilgisi yüzeyi

- Kanonik matris: [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)
- `secrets apply`, desteklenen `openclaw.json` kimlik bilgisi yollarını hedefler.
- `auth-profiles.json` başvuruları çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.

### Gizli değer sağlayıcıları yapılandırması

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

- `file` sağlayıcısı `mode: "json"` ve `mode: "singleValue"` seçeneklerini destekler (`singleValue` modunda `id`, `"value"` olmalıdır).
- Dosya ve exec sağlayıcı yolları, Windows ACL doğrulaması kullanılamadığında kapalı hata verir. `allowInsecurePath: true` değerini yalnızca doğrulanamayan güvenilir yollar için ayarlayın.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yükleri kullanır.
- Varsayılan olarak, sembolik bağlantı komut yolları reddedilir. Çözümlenen hedef yolu doğrularken sembolik bağlantı yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın.
- `trustedDirs` yapılandırılmışsa, güvenilir dizin denetimi çözümlenen hedef yola uygulanır.
- `exec` alt süreci ortamı varsayılan olarak minimaldir; gerekli değişkenleri `passEnv` ile açıkça geçirin.
- Gizli değer başvuruları etkinleştirme sırasında bellek içi bir anlık görüntüye çözümlenir, ardından istek yolları yalnızca anlık görüntüyü okur.
- Etkin yüzey filtreleme etkinleştirme sırasında uygulanır: etkin yüzeylerdeki çözümlenemeyen başvurular başlatma/yeniden yüklemeyi başarısız kılar, etkin olmayan yüzeyler ise tanılamalarla atlanır.

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

- Ajan başına profiller `<agentDir>/auth-profiles.json` konumunda saklanır.
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyi başvuruları destekler (`api_key` için `keyRef`, `token` için `tokenRef`).
- `{ "provider": { "apiKey": "..." } }` gibi eski düz `auth-profiles.json` eşlemeleri çalışma zamanı biçimi değildir; `openclaw doctor --fix` bunları `.legacy-flat.*.bak` yedeğiyle kanonik `provider:default` API anahtarı profillerine yeniden yazar.
- OAuth modu profilleri (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli auth-profile kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri bellek içi çözümlenmiş anlık görüntülerden gelir; eski statik `auth.json` girdileri keşfedildiğinde temizlenir.
- Eski OAuth içe aktarmaları `~/.openclaw/credentials/oauth.json` konumundan yapılır.
- [OAuth](/tr/concepts/oauth) bölümüne bakın.
- Gizli değerlerin çalışma zamanı davranışı ve `audit/configure/apply` araçları: [Gizli Değer Yönetimi](/tr/gateway/secrets).

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

- `billingBackoffHours`: bir profil gerçek faturalandırma/yetersiz kredi hataları nedeniyle başarısız olduğunda saat cinsinden temel geri çekilme süresi (varsayılan: `5`). Açık faturalandırma metni, `401`/`403` yanıtlarında bile yine buraya düşebilir, ancak sağlayıcıya özgü metin eşleştiricileri, onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya kuruluş/çalışma alanı harcama sınırı iletileri bunun yerine `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalandırma geri çekilme saatleri için isteğe bağlı sağlayıcı başına geçersiz kılmalar.
- `billingMaxHours`: faturalandırma geri çekilmesinin üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenilirlikli `auth_permanent` başarısızlıkları için dakika cinsinden temel geri çekilme süresi (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan saat cinsinden kayan pencere (varsayılan: `24`).
- `overloadedProfileRotations`: model yedeğine geçmeden önce aşırı yük hataları için en fazla aynı sağlayıcı auth-profile rotasyonu (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı meşgul biçimleri buraya düşer.
- `overloadedBackoffMs`: aşırı yüklenmiş bir sağlayıcı/profil rotasyonunu yeniden denemeden önceki sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model yedeğine geçmeden önce hız sınırı hataları için en fazla aynı sağlayıcı auth-profile rotasyonu (varsayılan: `1`). Bu hız sınırı kovası, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

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
- Kararlı bir yol için `logging.file` ayarını yapın.
- `--verbose` kullanıldığında `consoleLevel`, `debug` seviyesine yükselir.
- `maxFileBytes`: döndürmeden önce etkin günlük dosyası için bayt cinsinden en büyük boyut (pozitif tam sayı; varsayılan: `104857600` = 100 MB). OpenClaw, etkin dosyanın yanında en fazla beş numaralı arşiv tutar.
- `redactSensitive` / `redactPatterns`: konsol çıktısı, dosya günlükleri, OTLP günlük kayıtları ve kalıcı oturum transkript metni için en iyi çabayla maskeleme. `redactSensitive: "off"` yalnızca bu genel günlük/transkript ilkesini devre dışı bırakır; UI/araç/tanılama güvenlik yüzeyleri, yaymadan önce sırları yine de redakte eder.

---

## Tanılama

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

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
- `stuckSessionWarnMs`: uzun süren işleme oturumlarını `session.long_running`, `session.stalled` veya `session.stuck` olarak sınıflandırmak için ms cinsinden ilerleme olmama yaşı eşiği. Yanıt, araç, durum, blok ve ACP ilerlemesi zamanlayıcıyı sıfırlar; yinelenen `session.stuck` tanılamaları değişmeden kaldığında geri çekilir.
- `stuckSessionAbortMs`: uygun duran etkin işlerin kurtarma için iptal edilip boşaltılabilmesinden önce ms cinsinden ilerleme olmama yaşı eşiği. Ayarlanmadığında OpenClaw, en az 10 dakika ve 5x `stuckSessionWarnMs` olan daha güvenli uzatılmış gömülü çalıştırma penceresini kullanır.
- `otel.enabled`: OpenTelemetry dışa aktarma işlem hattını etkinleştirir (varsayılan: `false`). Tam yapılandırma, sinyal kataloğu ve gizlilik modeli için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).
- `otel.endpoint`: OTel dışa aktarma için toplayıcı URL'si.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: isteğe bağlı sinyale özgü OTLP uç noktaları. Ayarlandığında, yalnızca o sinyal için `otel.endpoint` değerini geçersiz kılar.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC meta veri üstbilgileri.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarımını etkinleştirir.
- `otel.sampleRate`: iz örnekleme oranı `0`-`1`.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri boşaltma aralığı.
- `otel.captureContent`: OTEL span öznitelikleri için isteğe bağlı ham içerik yakalama. Varsayılan olarak kapalıdır. Boolean `true`, sistem dışı ileti/araç içeriğini yakalar; nesne biçimi `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` ve `systemPrompt` değerlerini açıkça etkinleştirmenizi sağlar.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: en yeni deneysel GenAI span sağlayıcı öznitelikleri için ortam anahtarı. Varsayılan olarak span'ler uyumluluk için eski `gen_ai.system` özniteliğini korur; GenAI metrikleri sınırlı semantik öznitelikler kullanır.
- `OPENCLAW_OTEL_PRELOADED=1`: zaten küresel bir OpenTelemetry SDK kaydetmiş ana makineler için ortam anahtarı. OpenClaw daha sonra tanılama dinleyicilerini etkin tutarken Plugin tarafından sahiplenilen SDK başlatma/kapatma işlemini atlar.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` ve `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: eşleşen yapılandırma anahtarı ayarlanmadığında kullanılan sinyale özgü uç nokta ortam değişkenleri.
- `cacheTrace.enabled`: gömülü çalıştırmalar için önbellek iz anlık görüntülerini günlüğe kaydet (varsayılan: `false`).
- `cacheTrace.filePath`: önbellek izi JSONL için çıktı yolu (varsayılan: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: önbellek izi çıktısına nelerin dahil edileceğini denetler (tüm varsayılanlar: `true`).

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

- `channel`: npm/git kurulumları için sürüm kanalı - `"stable"`, `"beta"` veya `"dev"`.
- `checkOnStart`: Gateway başladığında npm güncellemelerini denetle (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka plan otomatik güncellemeyi etkinleştir (varsayılan: `false`).
- `auto.stableDelayHours`: kararlı kanalın otomatik uygulanmasından önce saat cinsinden en kısa gecikme (varsayılan: `6`; en fazla: `168`).
- `auto.stableJitterHours`: kararlı kanal dağıtımı için saat cinsinden ek yayılım penceresi (varsayılan: `12`; en fazla: `168`).
- `auto.betaCheckIntervalHours`: beta kanalı denetimlerinin saat cinsinden ne sıklıkta çalışacağı (varsayılan: `1`; en fazla: `24`).

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

- `enabled`: küresel ACP özellik kapısı (varsayılan: `true`; ACP dispatch ve spawn olanaklarını gizlemek için `false` ayarlayın).
- `dispatch.enabled`: ACP oturum turu dispatch işlemi için bağımsız kapı (varsayılan: `true`). Yürütmeyi engellerken ACP komutlarını kullanılabilir tutmak için `false` ayarlayın.
- `backend`: varsayılan ACP runtime arka uç kimliği (kayıtlı bir ACP runtime Plugin ile eşleşmelidir).
  Önce arka uç Plugin'i kurun ve `plugins.allow` ayarlanmışsa arka uç Plugin kimliğini ekleyin (örneğin `acpx`); aksi takdirde ACP arka ucu yüklenmez.
- `defaultAgent`: spawn işlemleri açık bir hedef belirtmediğinde yedek ACP hedef aracı kimliği.
- `allowedAgents`: ACP runtime oturumları için izin verilen aracı kimliklerinin izin listesi; boş olması ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: aynı anda etkin olabilecek en fazla ACP oturumu.
- `stream.coalesceIdleMs`: akışlı metin için ms cinsinden boşta boşaltma penceresi.
- `stream.maxChunkChars`: akışlı blok projeksiyonu bölünmeden önceki en büyük parça boyutu.
- `stream.repeatSuppression`: tur başına yinelenen durum/araç satırlarını bastır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı olarak akış yapar; `"final_only"` tur sonlandırıcı olaylara kadar arabelleğe alır.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önceki ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP turu başına projekte edilen en fazla asistan çıktı karakteri.
- `stream.maxSessionUpdateChars`: projekte edilen ACP durum/güncelleme satırları için en fazla karakter.
- `stream.tagVisibility`: akışlı olaylar için etiket adlarından boolean görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum çalışanları için uygun temizlemeden önce dakika cinsinden boşta kalma TTL değeri.
- `runtime.installCommand`: bir ACP runtime ortamını önyüklerken çalıştırılacak isteğe bağlı kurulum komutu.

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
  - `"off"`: slogan metni yok (banner başlığı/sürümü yine gösterilir).
- Tüm banner'ı gizlemek için (yalnızca sloganları değil), `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

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

[Aracı varsayılanları](/tr/gateway/config-agents#agent-defaults) altındaki `agents.list` kimlik alanlarına bakın.

---

## Köprü (eski, kaldırıldı)

Geçerli derlemeler artık TCP köprüsünü içermez. Node'lar Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları çıkarabilir).

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

- `sessionRetention`: tamamlanmış izole cron çalıştırma oturumlarının `sessions.json` dosyasından temizlenmeden önce ne kadar süre tutulacağı. Arşivlenmiş silinmiş cron transcript'lerinin temizlenmesini de denetler. Varsayılan: `24h`; devre dışı bırakmak için `false` olarak ayarlayın.
- `runLog.maxBytes`: temizleme öncesinde çalıştırma günlük dosyası (`cron/runs/<jobId>.jsonl`) başına en büyük boyut. Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: çalıştırma günlüğü temizleme tetiklendiğinde tutulan en yeni satırlar. Varsayılan: `2000`.
- `webhookToken`: cron Webhook POST teslimi (`delivery.mode = "webhook"`) için kullanılan bearer token; atlanırsa kimlik doğrulama başlığı gönderilmez.
- `webhook`: yalnızca hâlâ `notify: true` değerine sahip kayıtlı işler için kullanılan, kullanımdan kaldırılmış eski yedek Webhook URL'si (http/https).

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

- `maxAttempts`: geçici hatalarda tek seferlik işler için en fazla yeniden deneme sayısı (varsayılan: `3`; aralık: `0`-`10`).
- `backoffMs`: her yeniden deneme girişimi için ms cinsinden geri çekilme gecikmeleri dizisi (varsayılan: `[30000, 60000, 300000]`; 1-10 giriş).
- `retryOn`: yeniden denemeleri tetikleyen hata türleri - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Tüm geçici türlerde yeniden denemek için atlayın.

Yalnızca tek seferlik cron işlerine uygulanır. Yinelenen işler ayrı hata işleme kullanır.

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

- `enabled`: cron işleri için hata uyarılarını etkinleştirir (varsayılan: `false`).
- `after`: bir uyarı tetiklenmeden önceki ardışık hata sayısı (pozitif tam sayı, min: `1`).
- `cooldownMs`: aynı iş için yinelenen uyarılar arasındaki en az milisaniye sayısı (negatif olmayan tam sayı).
- `includeSkipped`: ardışık atlanan çalıştırmaları uyarı eşiğine dahil eder (varsayılan: `false`). Atlanan çalıştırmalar ayrı izlenir ve yürütme hatası geri çekilmesini etkilemez.
- `mode`: teslim modu - `"announce"` bir kanal mesajı üzerinden gönderir; `"webhook"` yapılandırılmış Webhook'a gönderi yapar.
- `accountId`: uyarı tesliminin kapsamını belirlemek için isteğe bağlı hesap veya kanal kimliği.

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

- Tüm işler genelinde cron hata bildirimleri için varsayılan hedef.
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi olduğunda varsayılan olarak `"announce"` kullanılır.
- `channel`: announce teslimi için kanal geçersiz kılması. `"last"` bilinen son teslim kanalını yeniden kullanır.
- `to`: açık announce hedefi veya Webhook URL'si. Webhook modu için gereklidir.
- `accountId`: teslim için isteğe bağlı hesap geçersiz kılması.
- İş başına `delivery.failureDestination` bu genel varsayılanı geçersiz kılar.
- Genel veya iş başına hata hedefi ayarlanmadığında, zaten `announce` ile teslim edilen işler hata durumunda bu birincil announce hedefine geri döner.
- `delivery.failureDestination`, işin birincil `delivery.mode` değeri `"webhook"` olmadığı sürece yalnızca `sessionTarget="isolated"` işleri için desteklenir.

Bkz. [Cron İşleri](/tr/automation/cron-jobs). İzole cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya modeli şablon değişkenleri

`tools.media.models[].args` içinde genişletilen şablon yer tutucuları:

| Değişken           | Açıklama                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Gelen mesaj gövdesinin tamamı                         |
| `{{RawBody}}`      | Ham gövde (geçmiş/gönderen sarmalayıcıları yok)             |
| `{{BodyStripped}}` | Grup bahsetmeleri çıkarılmış gövde                 |
| `{{From}}`         | Gönderen tanımlayıcısı                                 |
| `{{To}}`           | Hedef tanımlayıcısı                            |
| `{{MessageSid}}`   | Kanal mesaj kimliği                                |
| `{{SessionId}}`    | Geçerli oturum UUID'si                              |
| `{{IsNewSession}}` | Yeni oturum oluşturulduğunda `"true"`                 |
| `{{MediaUrl}}`     | Gelen medya sözde URL'si                          |
| `{{MediaPath}}`    | Yerel medya yolu                                  |
| `{{MediaType}}`    | Medya türü (görüntü/ses/belge/…)               |
| `{{Transcript}}`   | Ses transcript'i                                  |
| `{{Prompt}}`       | CLI girişleri için çözümlenmiş medya istemi             |
| `{{MaxChars}}`     | CLI girişleri için çözümlenmiş en fazla çıktı karakteri         |
| `{{ChatType}}`     | `"direct"` veya `"group"`                           |
| `{{GroupSubject}}` | Grup konusu (elinden gelen en iyi şekilde)                       |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (elinden gelen en iyi şekilde)               |
| `{{SenderName}}`   | Gönderen görünen adı (elinden gelen en iyi şekilde)                 |
| `{{SenderE164}}`   | Gönderen telefon numarası (elinden gelen en iyi şekilde)                 |
| `{{Provider}}`     | Sağlayıcı ipucu (WhatsApp, Telegram, Discord vb.) |

---

## Yapılandırma dahil etmeleri (`$include`)

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

- Tek dosya: içeren nesnenin yerini alır.
- Dosya dizisi: sırayla derin birleştirilir (sonrakiler öncekileri geçersiz kılar).
- Kardeş anahtarlar: dahil etmelerden sonra birleştirilir (dahil edilen değerleri geçersiz kılar).
- İç içe dahil etmeler: 10 düzeye kadar derin.
- Yollar: dahil eden dosyaya göre çözümlenir, ancak en üst düzey yapılandırma dizininin (`openclaw.json` dosyasının `dirname` değeri) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca yine bu sınır içinde çözümlendiklerinde izin verilir.
- Yalnızca tek dosyalı bir dahil etme tarafından desteklenen bir en üst düzey bölümü değiştiren OpenClaw'a ait yazma işlemleri, o dahil edilen dosyaya yazılır. Örneğin, `plugins install`, `plugins: { $include: "./plugins.json5" }` değerini `plugins.json5` içinde günceller ve `openclaw.json` dosyasını olduğu gibi bırakır.
- Kök dahil etmeler, dahil etme dizileri ve kardeş geçersiz kılmaları olan dahil etmeler, OpenClaw'a ait yazma işlemleri için salt okunurdur; bu yazma işlemleri yapılandırmayı düzleştirmek yerine güvenli şekilde başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları ve döngüsel dahil etmeler için açık mesajlar.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
