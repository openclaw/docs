---
read_when:
    - Tam alan düzeyinde yapılandırma semantiğine veya varsayılanlara ihtiyacınız var
    - Kanal, model, Gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Temel OpenClaw anahtarları, varsayılanlar ve ayrılmış alt sistem başvurularına bağlantılar için Gateway yapılandırma başvurusu
title: Yapılandırma başvurusu
x-i18n:
    generated_at: "2026-04-26T11:28:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c6e12c328cfc3de71e401ae48b44343769c4f6b063479c8ffa4d0e690a2433
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json` için temel yapılandırma başvurusu. Görev odaklı bir genel bakış için bkz. [Yapılandırma](/tr/gateway/configuration).

Başlıca OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendi daha derin başvurusu olduğunda dış bağlantı verir. Kanala ve Plugin'e ait komut katalogları ile derin bellek/QMD ayarları bu sayfa yerine kendi sayfalarında yer alır.

Kod gerçeği:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema'yı yazdırır; mevcut olduğunda paketli/Plugin/kanal meta verileri birleştirilmiş olarak gelir
- `config.schema.lookup`, ayrıntılı inceleme araçları için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, yapılandırma belge taban çizgisi karmasını geçerli şema yüzeyine karşı doğrular

Aracı arama yolu: düzenleme yapmadan önce tam alan düzeyinde belgeler ve kısıtlar için `gateway` araç eylemi `config.schema.lookup` kullanın. Görev odaklı rehberlik için [Yapılandırma](/tr/gateway/configuration), daha geniş alan haritası, varsayılanlar ve alt sistem başvurularına bağlantılar için bu sayfayı kullanın.

Ayrılmış derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki Dreaming yapılandırması için [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
- Geçerli yerleşik + paketli komut kataloğu için [Slash komutları](/tr/tools/slash-commands)
- Kanala özgü komut yüzeyleri için ilgili kanal/Plugin sayfaları

Yapılandırma biçimi **JSON5**'tir (yorumlar + sondaki virgüllere izin verilir). Tüm alanlar isteğe bağlıdır — OpenClaw atlandıklarında güvenli varsayılanlar kullanır.

---

## Kanallar

Kanal başına yapılandırma anahtarları ayrılmış bir sayfaya taşındı — `channels.*` için, Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve diğer paketli kanallar dahil (kimlik doğrulama, erişim denetimi, çoklu hesap, bahsetme geçidi) [Yapılandırma — kanallar](/tr/gateway/config-channels) bölümüne bakın.

## Aracı varsayılanları, çoklu aracı, oturumlar ve mesajlar

Ayrılmış bir sayfaya taşındı — şunlar için [Yapılandırma — aracılar](/tr/gateway/config-agents) bölümüne bakın:

- `agents.defaults.*` (çalışma alanı, model, düşünme, Heartbeat, bellek, medya, Skills, sandbox)
- `multiAgent.*` (çoklu aracı yönlendirmesi ve bağlamaları)
- `session.*` (oturum yaşam döngüsü, Compaction, budama)
- `messages.*` (mesaj teslimatı, TTS, markdown işleme)
- `talk.*` (Talk modu)
  - `talk.speechLocale`: iOS/macOS üzerinde Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği
  - `talk.silenceTimeoutMs`: ayarlanmadığında Talk, transcript'i göndermeden önce platformun varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`)

## Araçlar ve özel sağlayıcılar

Araç ilkesi, deneysel geçişler, sağlayıcı destekli araç yapılandırması ve özel sağlayıcı / temel URL kurulumu ayrılmış bir sayfaya taşındı — [Yapılandırma — araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) bölümüne bakın.

## MCP

OpenClaw tarafından yönetilen MCP sunucu tanımları `mcp.servers` altında bulunur ve gömülü Pi ile diğer çalışma zamanı bağdaştırıcıları tarafından tüketilir. `openclaw mcp list`, `show`, `set` ve `unset` komutları yapılandırma düzenlemeleri sırasında hedef sunucuya bağlanmadan bu bloğu yönetir.

```json5
{
  mcp: {
    // İsteğe bağlı. Varsayılan: 600000 ms (10 dakika). Boşta çıkarımı devre dışı bırakmak için 0 ayarlayın.
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
- `mcp.sessionIdleTtlMs`: oturum kapsamlı paketli MCP çalışma zamanları için boşta TTL.
  Tek seferlik gömülü çalıştırmalar, çalıştırma sonu temizliği ister; bu TTL, uzun ömürlü oturumlar ve gelecekteki çağıranlar için arka duraktır.
- `mcp.*` altındaki değişiklikler, önbelleğe alınmış oturum MCP çalışma zamanlarını kapatarak sıcak uygulanır.
  Sonraki araç keşfi/kullanımı bunları yeni yapılandırmadan yeniden oluşturur; böylece kaldırılmış
  `mcp.servers` girdileri boşta TTL'yi beklemek yerine hemen temizlenir.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // veya düz metin dize
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: yalnızca paketli Skills için isteğe bağlı allowlist (yönetilen/çalışma alanı Skills etkilenmez).
- `load.extraDirs`: ek paylaşılan skill kökleri (en düşük öncelik).
- `install.preferBrew`: `true` olduğunda ve `brew` mevcutsa, diğer kurucu türlerine geri dönmeden önce Homebrew kurucularını tercih eder.
- `install.nodeManager`: `metadata.openclaw.install` özellikleri için node kurucu tercihi
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false`, bir skill paketli/kurulu olsa bile onu devre dışı bırakır.
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

- `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` ve `plugins.load.paths` içinden yüklenir.
- Keşif, yerel OpenClaw Plugin'lerini ve uyumlu Codex bundle'larını ve Claude bundle'larını, manifestsiz Claude varsayılan düzen bundle'ları dahil, kabul eder.
- **Yapılandırma değişiklikleri bir gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı allowlist (yalnızca listelenen Plugin'ler yüklenir). `deny` baskındır.
- `plugins.entries.<id>.apiKey`: Plugin düzeyinde API anahtarı kolaylık alanı (Plugin destekliyorsa).
- `plugins.entries.<id>.env`: Plugin kapsamlı env değişkeni haritası.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda çekirdek, `before_prompt_build`'i engeller ve eski `before_agent_start` içinden gelen istem değiştiren alanları yok sayar; eski `modelOverride` ve `providerOverride` korunur. Yerel Plugin kancaları ve desteklenen bundle tarafından sağlanan kanca dizinleri için geçerlidir.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` olduğunda güvenilir paketli olmayan Plugin'ler, `llm_input`, `llm_output`, `before_agent_finalize` ve `agent_end` gibi türlendirilmiş kancalardan ham konuşma içeriğini okuyabilir.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu Plugin'e arka plan alt aracı çalıştırmaları için çalıştırma başına `provider` ve `model` geçersiz kılmaları isteme konusunda açıkça güvenin.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilir alt aracı geçersiz kılmaları için kanonik `provider/model` hedeflerinden oluşan isteğe bağlı allowlist. Yalnızca herhangi bir modele kasıtlı olarak izin vermek istediğinizde `"*"` kullanın.
- `plugins.entries.<id>.config`: Plugin tanımlı yapılandırma nesnesi (mevcutsa yerel OpenClaw Plugin şemasıyla doğrulanır).
- Kanal Plugin'i hesap/çalışma zamanı ayarları `channels.<id>` altında bulunur ve merkezi bir OpenClaw seçenek kaydıyla değil, ilgili Plugin'in manifest `channelConfigs` meta verisiyle açıklanmalıdır.
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch sağlayıcı ayarları.
  - `apiKey`: Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` env değişkenine geri döner.
  - `baseUrl`: Firecrawl API temel URL'si (varsayılan: `https://api.firecrawl.dev`).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkar (varsayılan: `true`).
  - `maxAgeMs`: milisaniye cinsinden en yüksek önbellek yaşı (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: saniye cinsinden kazıma isteği zaman aşımı (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web search) ayarları.
  - `enabled`: X Search sağlayıcısını etkinleştir.
  - `model`: arama için kullanılacak Grok modeli (ör. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: bellek Dreaming ayarları. Aşamalar ve eşikler için bkz. [Dreaming](/tr/concepts/dreaming).
  - `enabled`: ana Dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam Dreaming taraması için cron temposu (varsayılan `"0 3 * * *"`).
  - aşama ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya dönük yapılandırma anahtarları değildir).
- Tam bellek yapılandırması [Bellek yapılandırma başvurusu](/tr/reference/memory-config) içinde yer alır:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude bundle Plugin'leri, `settings.json` içinden gömülü Pi varsayılanları da sağlayabilir; OpenClaw bunları ham OpenClaw yapılandırma yamaları olarak değil, temizlenmiş aracı ayarları olarak uygular.
- `plugins.slots.memory`: etkin bellek Plugin kimliğini seçin veya bellek Plugin'lerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: etkin bağlam motoru Plugin kimliğini seçin; başka bir motor kurup seçmediğiniz sürece varsayılan `"legacy"` olur.

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
      // dangerouslyAllowPrivateNetwork: true, // yalnızca güvenilir özel ağ erişimi için etkinleştirin
      // allowPrivateNetwork: true, // eski takma ad
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

- `evaluateEnabled: false`, `act:evaluate` ve `wait --fn` işlevlerini devre dışı bırakır.
- `tabCleanup`, boşta kalma süresinden sonra veya bir oturum üst sınırını aştığında izlenen birincil aracı sekmelerini geri alır. Bu ayrı temizleme modlarını devre dışı bırakmak için `idleMinutes: 0` veya `maxTabsPerSession: 0` ayarlayın.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`, ayarlanmadığında devre dışıdır; böylece tarayıcı gezinmesi varsayılan olarak sıkı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezinmesine bilerek güveniyorsanız ayarlayın.
- Sıkı modda uzak CDP profil uç noktaları (`profiles.*.cdpUrl`), erişilebilirlik/keşif denetimleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski bir takma ad olarak desteklenmeye devam eder.
- Sıkı modda açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca bağlanma modundadır (başlatma/durdurma/sıfırlama devre dışıdır).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw'ın `/json/version` keşfetmesini istiyorsanız HTTP(S) kullanın; sağlayıcınız size doğrudan bir DevTools WebSocket URL'si veriyorsa WS(S) kullanın.
- `remoteCdpTimeoutMs` ve `remoteCdpHandshakeTimeoutMs`, uzak ve
  `attachOnly` CDP erişilebilirliğine artı sekme açma isteklerine uygulanır. Yönetilen loopback
  profilleri yerel CDP varsayılanlarını korur.
- Harici olarak yönetilen bir CDP hizmetine loopback üzerinden erişilebiliyorsa, o
  profil için `attachOnly: true` ayarlayın; aksi halde OpenClaw loopback bağlantı noktasını
  yerel yönetilen tarayıcı profili olarak değerlendirir ve yerel bağlantı noktası sahiplik hataları bildirebilir.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve
  seçilen ana makinede veya bağlı bir tarayıcı Node'u üzerinden bağlanabilir.
- `existing-session` profilleri, Brave veya Edge gibi belirli bir
  Chromium tabanlı tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri mevcut Chrome MCP yol sınırlarını korur:
  CSS seçici hedefleme yerine anlık görüntü/ref tabanlı eylemler, tek dosya yükleme
  kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve
  `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; yalnızca uzak CDP için
  `cdpUrl` değerini açıkça ayarlayın.
- Yerel yönetilen profiller, o profil için genel
  `browser.executablePath` değerini geçersiz kılmak üzere `executablePath` ayarlayabilir. Bunu bir profili
  Chrome'da, diğerini Brave'de çalıştırmak için kullanın.
- Yerel yönetilen profiller, süreç başlangıcından sonra Chrome CDP HTTP
  keşfi için `browser.localLaunchTimeoutMs` ve başlatma sonrası CDP WebSocket hazır durumu için `browser.localCdpReadyTimeoutMs` kullanır. Chrome başarıyla başlıyor ancak hazır durumu denetimleri başlangıçla yarışıyorsa daha yavaş ana makinelerde bunları yükseltin. Her iki değer de `120000` ms'ye kadar pozitif tam sayılar olmalıdır; geçersiz yapılandırma değerleri reddedilir.
- Otomatik algılama sırası: varsayılan tarayıcı Chromium tabanlıysa → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` ve `browser.profiles.<name>.executablePath` her ikisi de
  Chromium başlatılmadan önce işletim sisteminizin ev dizini için `~` ve `~/...` kabul eder.
  `existing-session` profillerindeki profil başına `userDataDir` da tilde ile genişletilir.
- Control hizmeti: yalnızca loopback (bağlantı noktası `gateway.port` değerinden türetilir, varsayılan `18791`).
- `extraArgs`, ek başlatma bayraklarını yerel Chromium başlangıcına ekler (örneğin
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

- `seamColor`: yerel uygulama UI çerçevesi için vurgu rengi (Talk Mode baloncuk tonu vb.).
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
      // allowExternalEmbedUrls: false, // tehlikeli: mutlak harici http(s) gömme URL'lerine izin ver
      // allowedOrigins: ["https://control.example.com"], // loopback olmayan Control UI için gerekli
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
    nodes: {
      pairing: {
        // İsteğe bağlı. Varsayılan ayarsız/devre dışı.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Ek /tools/invoke HTTP engellemeleri
      deny: ["browser"],
      // Araçları varsayılan HTTP engelleme listesinden kaldır
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

- `mode`: `local` (gateway çalıştır) veya `remote` (uzak gateway'e bağlan). Gateway, `local` değilse başlatılmayı reddeder.
- `port`: WS + HTTP için tek çoklamalı bağlantı noktası. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP) veya `custom`.
- **Eski bağlama takma adları**: `gateway.bind` içinde ana makine takma adları (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bağlama modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bağlama, container içinde `127.0.0.1` üzerinde dinler. Docker bridge ağı ile (`-p 18789:18789`), trafik `eth0` üzerinden gelir; bu nedenle gateway erişilemez olur. `--network host` kullanın veya tüm arayüzlerde dinlemek için `bind: "lan"` (veya `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Kimlik doğrulama**: varsayılan olarak gereklidir. Loopback olmayan bağlamalar gateway kimlik doğrulaması gerektirir. Uygulamada bu, paylaşılan bir belirteç/parola veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkında bir ters proxy anlamına gelir. Eşleştirme sihirbazı varsayılan olarak bir belirteç üretir.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. Her ikisi yapılandırılmış ve mod ayarsız olduğunda başlangıç ile hizmet kurma/onarım akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık kimlik doğrulamasız mod. Yalnızca güvenilir yerel loopback kurulumları için kullanın; bu seçenek kasıtlı olarak eşleştirme istemlerinde sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: kimlik doğrulamayı kimlik farkında bir ters proxy'ye devredin ve kimlik başlıkları için `gateway.trustedProxies` içindeki proxy'lere güvenin (bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)). Bu mod bir **loopback olmayan** proxy kaynağı bekler; aynı ana makinedeki loopback ters proxy'ler trusted-proxy kimlik doğrulamasını karşılamaz.
- `gateway.auth.allowTailscale`: `true` olduğunda Tailscale Serve kimlik başlıkları, Control UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını **kullanmaz**; bunun yerine gateway'in normal HTTP kimlik doğrulama modunu izler. Bu belirteçsiz akış, gateway ana makinesinin güvenilir olduğunu varsayar. `tailscale.mode = "serve"` olduğunda varsayılan `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP'si ve auth kapsamı başına uygulanır (paylaşılan gizli bilgi ve device-token bağımsız olarak izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Asenkron Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler başarısızlık yazımından önce serileştirilir. Bu nedenle aynı istemciden eşzamanlı kötü denemeler, ikisinin de düz uyumsuzluk olarak yarışması yerine ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` olur; localhost trafiğinin de oran sınırlamasına tabi olmasını kasıtlı olarak istiyorsanız (`test` kurulumları veya katı proxy dağıtımları için) `false` ayarlayın.
- Tarayıcı kaynaklı WS kimlik doğrulama denemeleri, loopback muafiyeti devre dışı bırakılmış şekilde her zaman sınırlanır (tarayıcı tabanlı localhost brute force saldırılarına karşı ek savunma).
- Loopback üzerinde bu tarayıcı kaynaklı kilitlemeler, normalize edilmiş `Origin`
  değeri başına yalıtılır; böylece bir localhost origin'inden gelen tekrar eden hatalar,
  farklı bir origin'i otomatik olarak kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, loopback bağlama) veya `funnel` (genel, kimlik doğrulama gerektirir).
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı-origin allowlist'i. Tarayıcı istemcileri loopback olmayan origin'lerden beklendiğinde gereklidir.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: kasıtlı olarak Host-header origin ilkesine dayanan dağıtımlar için Host-header origin geri dönüşünü etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için `remote.url`, `ws://` veya `wss://` olmalıdır.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: istemci tarafı süreç ortamı
  cam kırma geçersiz kılmasıdır; güvenilir özel ağ
  IP'lerine düz metin `ws://` kullanımına izin verir; varsayılan olarak düz metin hâlâ yalnızca loopback içindir. Bunun `openclaw.json`
  eşdeğeri yoktur ve
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` gibi tarayıcı özel ağ yapılandırmaları Gateway
  WebSocket istemcilerini etkilemez.
- `gateway.remote.token` / `.password`, uzak istemci kimlik bilgisi alanlarıdır. Bunlar kendi başlarına gateway kimlik doğrulamasını yapılandırmaz.
- `gateway.push.apns.relay.baseUrl`: resmi/TestFlight iOS derlemeleri relay destekli kayıtları gateway'e yayınladıktan sonra kullanılan harici APNs relay için temel HTTPS URL'si. Bu URL, iOS derlemesine derlenmiş relay URL'siyle eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: milisaniye cinsinden gateway'den relay'e gönderim zaman aşımı. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir gateway kimliğine devredilir. Eşleştirilmiş iOS uygulaması `gateway.identity.get` alır, bu kimliği relay kaydına dahil eder ve kayıt kapsamlı bir gönderim iznini gateway'e iletir. Başka bir gateway bu saklanan kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici env geçersiz kılmaları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL'leri için yalnızca geliştirme amaçlı kaçış kapağı. Üretim relay URL'leri HTTPS üzerinde kalmalıdır.
- `gateway.channelHealthCheckMinutes`: dakika cinsinden kanal sağlık izleyici aralığı. Sağlık izleyici yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: dakika cinsinden eski soket eşiği. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına en fazla sağlık izleyici yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izleyiciyi etkin tutarken sağlık izleyici yeniden başlatmaları için kanal başına devre dışı bırakma.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çoklu hesap kanalları için hesap başına geçersiz kılma. Ayarlandığında kanal düzeyi geçersiz kılmanın önüne geçer.
- Yerel gateway çağrı yolları, yalnızca `gateway.auth.*` ayarsız olduğunda geri dönüş olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef aracılığıyla açıkça yapılandırılmış ve çözümlenmemişse çözümleme kapalı başarısız olur (uzak geri dönüş maskelemesi yapılmaz).
- `trustedProxies`: TLS sonlandıran veya iletilen istemci başlıklarını enjekte eden ters proxy IP'leri. Yalnızca kontrol ettiğiniz proxy'leri listeleyin. Loopback girdileri aynı ana makine proxy/yerel algılama kurulumları (örneğin Tailscale Serve veya yerel bir ters proxy) için yine geçerlidir, ancak loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hâle **getirmez**.
- `allowRealIpFallback`: `true` olduğunda gateway, `X-Forwarded-For` eksikse `X-Real-IP` kabul eder. Varsayılan `false`, yani kapalı başarısız davranış.
- `gateway.nodes.pairing.autoApproveCidrs`: istenen kapsamı olmayan ilk kez Node device eşleştirmesini otomatik onaylamak için isteğe bağlı CIDR/IP allowlist'i. Ayarlanmadığında devre dışıdır. Bu, operatör/tarayıcı/Control UI/WebChat eşleştirmesini otomatik onaylamaz ve rol, kapsam, meta veri veya genel anahtar yükseltmelerini de otomatik onaylamaz.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: eşleştirme ve allowlist değerlendirmesinden sonra bildirilen Node komutları için genel izin/engelleme şekillendirmesi.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için ek araç adları engellenir (varsayılan engelleme listesini genişletir).
- `gateway.tools.allow`: araç adlarını varsayılan HTTP engelleme listesinden kaldırır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdi sıkılaştırması:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş allowlist'ler ayarsız kabul edilir; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt sıkılaştırma başlığı:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca kontrol ettiğiniz HTTPS origin'leri için ayarlayın; bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çoklu örnek yalıtımı

Benzersiz bağlantı noktaları ve durum dizinleriyle tek bir ana makinede birden çok gateway çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Kolaylık bayrakları: `--dev` (`~/.openclaw-dev` + `19001` bağlantı noktasını kullanır), `--profile <name>` (`~/.openclaw-<name>` kullanır).

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

- `enabled`: gateway dinleyicisinde TLS sonlandırmasını etkinleştirir (HTTPS/WSS) (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel, kendinden imzalı bir sertifika/anahtar çifti otomatik üretir; yalnızca yerel/geliştirme kullanımı içindir.
- `certPath`: TLS sertifika dosyasının dosya sistemi yolu.
- `keyPath`: TLS özel anahtar dosyasının dosya sistemi yolu; izinlerle kısıtlı tutun.
- `caPath`: istemci doğrulaması veya özel güven zincirleri için isteğe bağlı CA paketi yolu.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: yapılandırma düzenlemelerinin çalışma zamanında nasıl uygulanacağını denetler.
  - `"off"`: canlı düzenlemeleri yok say; değişiklikler açık bir yeniden başlatma gerektirir.
  - `"restart"`: yapılandırma değişikliğinde her zaman gateway sürecini yeniden başlat.
  - `"hot"`: değişiklikleri yeniden başlatmadan süreç içinde uygula.
  - `"hybrid"` (varsayılan): önce sıcak yeniden yüklemeyi dene; gerekirse yeniden başlatmaya geri dön.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce milisaniye cinsinden debounce penceresi (negatif olmayan tam sayı).
- `deferralTimeoutMs`: yeniden başlatmayı zorlamadan önce işlemdeki işlemlerin bitmesini beklemek için milisaniye cinsinden isteğe bağlı en yüksek süre. Süresiz beklemek ve periyodik olarak hâlâ bekleyen uyarıları günlüğe kaydetmek için bunu atlayın veya `0` ayarlayın.

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
Sorgu dizesi kanca belirteçleri reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, `gateway.auth.token` değerinden **farklı** olmalıdır; Gateway belirtecinin yeniden kullanımı reddedilir.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini kısıtlayın (örneğin `["hook:"]`).
- Bir eşleme veya ön ayar şablonlanmış `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` ayarlayın ve `hooks.allowRequestSessionKey=true` yapın. Statik eşleme anahtarları bu etkinleştirmeyi gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükünden gelen `sessionKey`, yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` aracılığıyla çözülür
  - Şablonla işlenen eşleme `sessionKey` değerleri harici olarak sağlanmış kabul edilir ve ayrıca `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Eşleme ayrıntıları">

- `match.path`, `/hooks` sonrasındaki alt yolu eşleştirir (ör. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanını eşleştirir.
- `{{messages[0].subject}}` gibi şablonlar yükten okunur.
- `transform`, bir kanca eylemi döndüren bir JS/TS modülünü işaret edebilir.
  - `transform.module` göreli bir yol olmalıdır ve `hooks.transformsDir` içinde kalır (mutlak yollar ve dizin geçişi reddedilir).
- `agentId`, belirli bir aracıya yönlendirir; bilinmeyen kimlikler varsayılana geri döner.
- `allowedAgentIds`: açık yönlendirmeyi kısıtlar (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmayan kanca aracı çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranlarının ve şablon güdümlü eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin verir (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri (istek + eşleme) için isteğe bağlı ön ek allowlist'i; ör. `["hook:"]`. Herhangi bir eşleme veya ön ayar şablonlu `sessionKey` kullandığında zorunlu hâle gelir.
- `deliver: true`, son yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` olur.
- `model`, bu kanca çalıştırması için LLM'yi geçersiz kılar (model kataloğu ayarlıysa izinli olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail ön ayarı `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- Mesaj başına bu yönlendirmeyi koruyorsanız `hooks.allowRequestSessionKey: true` ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanıyla eşleşecek şekilde sınırlandırın; örneğin `["hook:", "hook:gmail:"]`.
- `hooks.allowRequestSessionKey: false` gerekiyorsa, şablonlu varsayılan yerine sabit bir `sessionKey` kullanacak şekilde ön ayarı geçersiz kılın.

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

- Gateway, yapılandırıldığında önyüklemede `gog gmail watch serve` işlevini otomatik başlatır. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.
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

- Gateway bağlantı noktası altında HTTP üzerinden aracı tarafından düzenlenebilir HTML/CSS/JS ve A2UI sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` olarak tutun (varsayılan).
- Loopback olmayan bağlamalar: canvas yolları diğer Gateway HTTP yüzeyleriyle aynı şekilde Gateway kimlik doğrulaması (token/password/trusted-proxy) gerektirir.
- Node WebView'lar genellikle kimlik doğrulama başlıkları göndermez; bir Node eşleştirildikten ve bağlandıktan sonra Gateway, canvas/A2UI erişimi için node kapsamlı yetenek URL'leri duyurur.
- Yetenek URL'leri etkin Node WS oturumuna bağlıdır ve hızlıca sona erer. IP tabanlı geri dönüş kullanılmaz.
- Sunulan HTML içine canlı yeniden yükleme istemcisi enjekte eder.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- A2UI'yi ayrıca `/__openclaw__/a2ui/` adresinde de sunar.
- Değişiklikler bir gateway yeniden başlatması gerektirir.
- Büyük dizinlerde veya `EMFILE` hatalarında canlı yeniden yüklemeyi devre dışı bırakın.

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

- `minimal` (varsayılan): TXT kayıtlarından `cliPath` + `sshPort` atlanır.
- `full`: `cliPath` + `sshPort` dahil edilir.
- Ana makine adı varsayılan olarak `openclaw` olur. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

### Geniş alan (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` altında bir unicast DNS-SD bölgesi yazar. Ağlar arası keşif için bunu bir DNS sunucusu (CoreDNS önerilir) + Tailscale split DNS ile eşleştirin.

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
- `.env` dosyaları: CWD `.env` + `~/.openclaw/.env` (ikisi de mevcut değişkenleri geçersiz kılmaz).
- `shellEnv`: beklenen eksik anahtarları giriş kabuğu profilinizden içe aktarır.
- Tam öncelik için bkz. [Ortam](/tr/help/environment).

### Env değişkeni yerine koyma

Herhangi bir yapılandırma dizesinde env değişkenlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Yalnızca eşleşen büyük harfli adlar: `[A-Z_][A-Z0-9_]*`.
- Eksik/boş değişkenler, yapılandırma yüklenirken hata fırlatır.
- Düz `${VAR}` için `$${VAR}` ile kaçış yapın.
- `$include` ile çalışır.

---

## Gizli bilgiler

SecretRef'ler eklemelidir: düz metin değerler yine de çalışır.

### `SecretRef`

Tek bir nesne biçimi kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Doğrulama:

- `provider` kalıbı: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id kalıbı: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: mutlak JSON işaretçisi (örneğin `"/providers/openai/apiKey"`)
- `source: "exec"` id kalıbı: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` id'leri `.` veya `..` eğik çizgiyle ayrılmış yol bölümleri içermemelidir (örneğin `a/../b` reddedilir)

### Desteklenen kimlik bilgisi yüzeyi

- Kanonik matris: [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)
- `secrets apply`, desteklenen `openclaw.json` kimlik bilgisi yollarını hedefler.
- `auth-profiles.json` başvuruları çalışma zamanı çözümlemesi ve denetim kapsamına dahildir.

### Gizli sağlayıcılar yapılandırması

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
- Windows ACL doğrulaması kullanılamadığında dosya ve exec sağlayıcı yolları kapalı başarısız olur. `allowInsecurePath: true` değerini yalnızca doğrulanamayan güvenilir yollar için ayarlayın.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yükleri kullanır.
- Varsayılan olarak sembolik bağlantı komut yolları reddedilir. Çözümlenen hedef yolu doğrularken sembolik bağlantı yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın.
- `trustedDirs` yapılandırılmışsa, güvenilir dizin denetimi çözümlenen hedef yola uygulanır.
- `exec` alt süreç ortamı varsayılan olarak asgaridir; gerekli değişkenleri `passEnv` ile açıkça geçin.
- SecretRef'ler etkinleştirme sırasında bellekte bir anlık görüntüye çözülür, ardından istek yolları yalnızca bu anlık görüntüyü okur.
- Etkin yüzey filtreleme etkinleştirme sırasında uygulanır: etkin yüzeylerde çözümlenmemiş başvurular başlangıç/yeniden yüklemeyi başarısız kılar, etkin olmayan yüzeyler ise tanılama ile atlanır.

---

## Auth depolaması

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
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyinde başvuruları (`api_key` için `keyRef`, `token` için `tokenRef`) destekler.
- OAuth modu profilleri (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli auth-profili kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri, bellekte çözümlenmiş anlık görüntülerden gelir; eski statik `auth.json` girdileri bulunduğunda temizlenir.
- Eski OAuth içe aktarmaları `~/.openclaw/credentials/oauth.json` konumundan yapılır.
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

- `billingBackoffHours`: bir profil gerçek
  faturalama/yetersiz kredi hataları nedeniyle başarısız olduğunda saat cinsinden temel geri çekilme
  (varsayılan: `5`). Açık faturalama metni,
  `401`/`403` yanıtlarında bile yine burada yer alabilir, ancak sağlayıcıya özgü metin
  eşleyicileri bunlara sahip olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter
  `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya
  kuruluş/çalışma alanı harcama sınırı iletileri bunun yerine `rate_limit` yolunda
  kalır.
- `billingBackoffHoursByProvider`: saat cinsinden faturalama geri çekilmesi için isteğe bağlı sağlayıcı başına geçersiz kılmalar.
- `billingMaxHours`: faturalama geri çekilmesinin üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenilirlikli `auth_permanent` hataları için dakika cinsinden temel geri çekilme (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan saat cinsinden kayan pencere (varsayılan: `24`).
- `overloadedProfileRotations`: model geri dönüşüne geçmeden önce aşırı yük hataları için aynı sağlayıcı içinde en fazla auth-profili döndürme sayısı (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı meşgul şekilleri burada yer alır.
- `overloadedBackoffMs`: aşırı yüklü sağlayıcı/profil döndürmesini yeniden denemeden önce sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model geri dönüşüne geçmeden önce oran sınırı hataları için aynı sağlayıcı içinde en fazla auth-profili döndürme sayısı (varsayılan: `1`). Bu oran sınırı grubu `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

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
- Sabit bir yol için `logging.file` ayarlayın.
- `consoleLevel`, `--verbose` ile `debug` düzeyine yükselir.
- `maxFileBytes`: döndürmeden önce etkin günlük dosyasının bayt cinsinden en yüksek boyutu (pozitif tam sayı; varsayılan: `104857600` = 100 MB). OpenClaw, etkin dosyanın yanında numaralandırılmış en fazla beş arşiv tutar.

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

- `enabled`: araçsal çıktı için ana geçiş (varsayılan: `true`).
- `flags`: hedeflenmiş günlük çıktısını etkinleştiren bayrak dizeleri dizisi (ör. `"telegram.*"` veya `"*"` gibi joker karakterleri destekler).
- `stuckSessionWarnMs`: bir oturum işleme durumunda kalırken takılmış oturum uyarılarının yayılması için ms cinsinden yaş eşiği.
- `otel.enabled`: OpenTelemetry dışa aktarma işlem hattını etkinleştirir (varsayılan: `false`). Tam yapılandırma, sinyal kataloğu ve gizlilik modeli için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).
- `otel.endpoint`: OTel dışa aktarma için toplayıcı URL'si.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: isteğe bağlı sinyal özelinde OTLP uç noktaları. Ayarlandığında, yalnızca o sinyal için `otel.endpoint` değerini geçersiz kılarlar.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC meta veri başlıkları.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarmayı etkinleştirir.
- `otel.sampleRate`: `0`–`1` iz örnekleme oranı.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri temizleme aralığı.
- `otel.captureContent`: OTEL span öznitelikleri için isteğe bağlı ham içerik yakalama. Varsayılan olarak kapalıdır. Mantıksal `true`, sistem dışı mesaj/araç içeriğini yakalar; nesne biçimi ise `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` ve `systemPrompt` seçeneklerini açıkça etkinleştirmenizi sağlar.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: en son deneysel GenAI span sağlayıcı öznitelikleri için ortam geçişi. Varsayılan olarak span'ler uyumluluk için eski `gen_ai.system` özniteliğini korur; GenAI metrikleri sınırlı anlamsal öznitelikler kullanır.
- `OPENCLAW_OTEL_PRELOADED=1`: zaten genel bir OpenTelemetry SDK kaydetmiş ana makineler için ortam geçişi. OpenClaw daha sonra tanılama dinleyicilerini etkin tutarken Plugin'e ait SDK başlatma/kapatmayı atlar.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` ve `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: eşleşen yapılandırma anahtarı ayarsız olduğunda kullanılan sinyale özgü uç nokta env değişkenleri.
- `cacheTrace.enabled`: gömülü çalıştırmalar için önbellek izleme anlık görüntülerini günlüğe kaydet (varsayılan: `false`).
- `cacheTrace.filePath`: önbellek izleme JSONL çıktı yolu (varsayılan: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: önbellek izleme çıktısına nelerin dahil edildiğini denetler (hepsi varsayılan: `true`).

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
- `checkOnStart`: gateway başladığında npm güncellemelerini denetle (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka plan otomatik güncellemeyi etkinleştir (varsayılan: `false`).
- `auto.stableDelayHours`: kararlı kanal otomatik uygulaması öncesindeki en düşük saat cinsinden gecikme (varsayılan: `6`; en fazla: `168`).
- `auto.stableJitterHours`: saat cinsinden ek kararlı kanal yayılım penceresi (varsayılan: `12`; en fazla: `168`).
- `auto.betaCheckIntervalHours`: beta kanal denetimlerinin saat cinsinden çalışma sıklığı (varsayılan: `1`; en fazla: `24`).

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

- `enabled`: genel ACP özellik geçidi (varsayılan: `true`; ACP dispatch ve spawn olanaklarını gizlemek için `false` ayarlayın).
- `dispatch.enabled`: ACP oturum dönüşü dispatch için bağımsız geçit (varsayılan: `true`). ACP komutlarını kullanılabilir tutarken yürütmeyi engellemek için `false` ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı arka uç kimliği (kayıtlı bir ACP çalışma zamanı Plugin'iyle eşleşmelidir).
  `plugins.allow` ayarlıysa arka uç Plugin kimliğini (örneğin `acpx`) ekleyin; aksi takdirde paketli varsayılan Plugin yüklenmez.
- `defaultAgent`: spawn işlemleri açık bir hedef belirtmediğinde geri dönüş ACP hedef aracı kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen aracı kimliklerinin allowlist'i; boşsa ek kısıtlama yoktur.
- `maxConcurrentSessions`: aynı anda etkin ACP oturumlarının en yüksek sayısı.
- `stream.coalesceIdleMs`: akışlı metin için ms cinsinden boşta birleştirme temizleme penceresi.
- `stream.maxChunkChars`: akışlı blok projeksiyonunu bölmeden önceki en yüksek parça boyutu.
- `stream.repeatSuppression`: dönüş başına tekrar eden durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı akış yapar; `"final_only"` dönüş son olaylarına kadar arabelleğe alır.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önceki ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP dönüşü başına yansıtılan en yüksek yardımcı çıktısı karakter sayısı.
- `stream.maxSessionUpdateChars`: yansıtılan ACP durum/güncelleme satırları için en yüksek karakter sayısı.
- `stream.tagVisibility`: akışlı olaylar için etiket adlarından mantıksal görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum çalışanlarının temizliğe uygun hâle gelmeden önceki boşta TTL süresi (dakika).
- `runtime.installCommand`: ACP çalışma zamanı ortamı önyüklenirken çalıştırılacak isteğe bağlı kurulum komutu.

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
  - `"random"` (varsayılan): dönen eğlenceli/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yok (banner başlığı/sürüm yine gösterilir).
- Tüm banner'ı gizlemek için (yalnızca sloganları değil), `OPENCLAW_HIDE_BANNER=1` env değişkenini ayarlayın.

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

## Bridge (eski, kaldırıldı)

Geçerli derlemeler artık TCP bridge içermez. Node'lar Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları temizleyebilir).

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
    webhook: "https://example.invalid/legacy", // saklanan notify:true işler için kullanım dışı geri dönüş
    webhookToken: "replace-with-dedicated-token", // giden Webhook kimlik doğrulaması için isteğe bağlı bearer token
    sessionRetention: "24h", // süre dizesi veya false
    runLog: {
      maxBytes: "2mb", // varsayılan 2_000_000 bayt
      keepLines: 2000, // varsayılan 2000
    },
  },
}
```

- `sessionRetention`: tamamlanmış izole cron çalıştırma oturumlarının `sessions.json` dosyasından budanmadan önce ne kadar süre tutulacağı. Ayrıca arşivlenmiş silinmiş cron transcript'lerinin temizliğini de denetler. Varsayılan: `24h`; devre dışı bırakmak için `false` ayarlayın.
- `runLog.maxBytes`: budamadan önce çalıştırma günlüğü dosyası başına en yüksek boyut (`cron/runs/<jobId>.jsonl`). Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: çalıştırma günlüğü budaması tetiklendiğinde tutulacak en yeni satırlar. Varsayılan: `2000`.
- `webhookToken`: cron Webhook POST teslimatı (`delivery.mode = "webhook"`) için kullanılan bearer token; atlanırsa kimlik doğrulama başlığı gönderilmez.
- `webhook`: yalnızca hâlâ `notify: true` olan saklanmış işler için kullanılan kullanım dışı eski geri dönüş Webhook URL'si (http/https).

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
- `backoffMs`: her yeniden deneme girişimi için ms cinsinden geri çekilme gecikmeleri dizisi (varsayılan: `[30000, 60000, 300000]`; 1–10 giriş).
- `retryOn`: yeniden denemeleri tetikleyen hata türleri — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Tüm geçici türleri yeniden denemek için bunu atlayın.

Yalnızca tek seferlik cron işleri için geçerlidir. Yinelenen işler ayrı başarısızlık işleme kullanır.

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

- `enabled`: cron işleri için başarısızlık uyarılarını etkinleştirir (varsayılan: `false`).
- `after`: bir uyarı tetiklenmeden önceki ardışık başarısızlık sayısı (pozitif tam sayı, en az: `1`).
- `cooldownMs`: aynı iş için tekrar eden uyarılar arasında en az milisaniye sayısı (negatif olmayan tam sayı).
- `mode`: teslimat modu — `"announce"` bir kanal mesajı üzerinden gönderir; `"webhook"` yapılandırılmış Webhook'a gönderi yapar.
- `accountId`: uyarı teslimatını kapsamlandırmak için isteğe bağlı hesap veya kanal kimliği.

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

- Tüm işler genelinde cron başarısızlık bildirimleri için varsayılan hedef.
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi varsa varsayılan `"announce"` olur.
- `channel`: duyuru teslimatı için kanal geçersiz kılması. `"last"` son bilinen teslimat kanalını yeniden kullanır.
- `to`: açık duyuru hedefi veya Webhook URL'si. Webhook modu için gereklidir.
- `accountId`: teslimat için isteğe bağlı hesap geçersiz kılması.
- İş başına `delivery.failureDestination`, bu genel varsayılanı geçersiz kılar.
- Genel veya iş başına başarısızlık hedefi ayarlı değilse, zaten `announce` ile teslimat yapan işler başarısızlıkta o birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, işin birincil `delivery.mode` değeri `"webhook"` olmadığı sürece yalnızca `sessionTarget="isolated"` olan işler için desteklenir.

Bkz. [Cron İşleri](/tr/automation/cron-jobs). İzole cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya model şablonu değişkenleri

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
| `{{MediaUrl}}`     | Gelen medya sahte URL'si                          |
| `{{MediaPath}}`    | Yerel medya yolu                                  |
| `{{MediaType}}`    | Medya türü (image/audio/document/…)               |
| `{{Transcript}}`   | Ses transcript'i                                  |
| `{{Prompt}}`       | CLI girdileri için çözümlenmiş medya istemi       |
| `{{MaxChars}}`     | CLI girdileri için çözümlenmiş en yüksek çıktı karakteri |
| `{{ChatType}}`     | `"direct"` veya `"group"`                         |
| `{{GroupSubject}}` | Grup konusu (en iyi çaba)                         |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (en iyi çaba)             |
| `{{SenderName}}`   | Gönderen görünen adı (en iyi çaba)                |
| `{{SenderE164}}`   | Gönderen telefon numarası (en iyi çaba)          |
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
- Dosya dizisi: sırayla derin birleştirilir (sonraki öncekinin üzerine yazar).
- Kardeş anahtarlar: include'lardan sonra birleştirilir (include edilen değerlerin üzerine yazar).
- İç içe include'lar: en fazla 10 düzey derinlik.
- Yollar: include eden dosyaya göre çözülür, ancak üst düzey yapılandırma dizini (`openclaw.json` dosyasının `dirname` değeri) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca hâlâ bu sınır içinde çözülüyorlarsa izin verilir.
- Yalnızca tek dosyalı include ile desteklenen bir üst düzey bölümü değiştiren OpenClaw sahipli yazımlar, ilgili include edilmiş dosyaya yazılır. Örneğin `plugins install`, `plugins: { $include: "./plugins.json5" }` değerini `plugins.json5` içinde günceller ve `openclaw.json` dosyasını bozulmadan bırakır.
- Kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar OpenClaw sahipli yazımlar için salt okunurdur; bu yazımlar yapılandırmayı düzleştirmek yerine kapalı başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için açık iletiler.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
