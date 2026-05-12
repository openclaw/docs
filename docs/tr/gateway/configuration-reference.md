---
read_when:
    - Alan düzeyindeki yapılandırma semantiklerine veya varsayılan değerlere kesin olarak ihtiyacınız var
    - Kanal, model, Gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Temel OpenClaw anahtarları, varsayılan değerleri ve özel alt sistem referanslarına bağlantılar için Gateway yapılandırma referansı
title: Yapılandırma referansı
x-i18n:
    generated_at: "2026-05-12T00:58:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b8e31f7a6ed82faf3b5a50daa286bb6fce0c2e4452ae81a8e792a437004ad54
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Core yapılandırma başvurusu: `~/.openclaw/openclaw.json`. Görev odaklı bir genel bakış için bkz. [Yapılandırma](/tr/gateway/configuration).

Ana OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendi daha ayrıntılı başvurusu olduğunda bağlantı verir. Kanal ve Plugin sahipli komut katalogları ile derin bellek/QMD ayarları bu sayfa yerine kendi sayfalarında yer alır.

Kod gerçeği:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema çıktısını verir; mümkün olduğunda paketle gelen/Plugin/kanal meta verileri birleştirilir
- `config.schema.lookup`, ayrıntılı inceleme araçları için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, yapılandırma dokümantasyonu temel karma değerini geçerli şema yüzeyine göre doğrular

Agent arama yolu: düzenlemelerden önce tam alan düzeyi dokümanlar ve kısıtlar için
`gateway` araç eylemi `config.schema.lookup` kullanın. Görev odaklı rehberlik için
[Yapılandırma](/tr/gateway/configuration), daha geniş alan haritası, varsayılanlar ve
alt sistem başvurularına bağlantılar için bu sayfayı kullanın.

Özel derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki Dreaming yapılandırması için [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
- Geçerli yerleşik + paketle gelen komut kataloğu için [Slash komutları](/tr/tools/slash-commands)
- Kanala özgü komut yüzeyleri için ilgili kanal/Plugin sayfaları

Yapılandırma biçimi **JSON5**'tir (yorumlara + sondaki virgüllere izin verilir). Tüm alanlar isteğe bağlıdır - OpenClaw alanlar atlandığında güvenli varsayılanları kullanır.

---

## Kanallar

Kanal bazlı yapılandırma anahtarları özel bir sayfaya taşındı - Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage ve diğer paketle gelen kanallar (kimlik
doğrulama, erişim denetimi, çoklu hesap, bahsetme geçidi) dahil `channels.*`
için bkz. [Yapılandırma - kanallar](/tr/gateway/config-channels).

## Agent varsayılanları, çoklu agent, oturumlar ve mesajlar

Özel bir sayfaya taşındı - şunlar için bkz.
[Yapılandırma - agent'lar](/tr/gateway/config-agents):

- `agents.defaults.*` (çalışma alanı, model, düşünme, Heartbeat, bellek, medya, Skills, sandbox)
- `multiAgent.*` (çoklu agent yönlendirme ve bağlamalar)
- `session.*` (oturum yaşam döngüsü, Compaction, budama)
- `messages.*` (mesaj teslimi, TTS, markdown işleme)
- `talk.*` (Talk modu)
  - `talk.consultThinkingLevel`: Control UI Talk gerçek zamanlı danışmalarının arkasındaki tam OpenClaw agent çalıştırması için düşünme düzeyi geçersiz kılması
  - `talk.consultFastMode`: Control UI Talk gerçek zamanlı danışmaları için tek seferlik hızlı mod geçersiz kılması
  - `talk.speechLocale`: iOS/macOS üzerinde Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği
  - `talk.silenceTimeoutMs`: ayarlanmadığında Talk, dökümü göndermeden önce platformun varsayılan duraklama penceresini korur (`700 ms on macOS and Android, 900 ms on iOS`)

## Araçlar ve özel sağlayıcılar

Araç ilkesi, deneysel anahtarlar, sağlayıcı destekli araç yapılandırması ve özel
sağlayıcı / temel URL kurulumu özel bir sayfaya taşındı - bkz.
[Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## Modeller

Sağlayıcı tanımları, model izin listeleri ve özel sağlayıcı kurulumu
[Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls)
içinde yer alır. `models` kökü ayrıca genel model kataloğu davranışına sahiptir.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: sağlayıcı kataloğu davranışı (`merge` veya `replace`).
- `models.providers`: sağlayıcı kimliğine göre anahtarlanan özel sağlayıcı eşlemi.
- `models.providers.*.localService`: yerel model sunucuları için isteğe bağlı
  talep üzerine süreç yöneticisi. OpenClaw yapılandırılmış sağlık uç noktasını
  yoklar, gerektiğinde mutlak `command` komutunu başlatır, hazır olmasını bekler
  ve ardından model isteğini gönderir. Bkz. [Yerel model hizmetleri](/tr/gateway/local-model-services).
- `models.pricing.enabled`: sidecar'lar ve kanallar Gateway hazır yoluna ulaştıktan
  sonra başlayan arka plan fiyatlandırma önyüklemesini denetler. `false` olduğunda
  Gateway, OpenRouter ve LiteLLM fiyatlandırma kataloğu getirmelerini atlar;
  yapılandırılmış `models.providers.*.models[].cost` değerleri yerel maliyet
  tahminleri için çalışmaya devam eder.

## MCP

OpenClaw tarafından yönetilen MCP sunucu tanımları `mcp.servers` altında yer alır ve
gömülü Pi ile diğer çalışma zamanı bağdaştırıcıları tarafından tüketilir. `openclaw mcp list`,
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

- `mcp.servers`: yapılandırılmış MCP araçlarını açığa çıkaran çalışma zamanları için
  adlandırılmış stdio veya uzak MCP sunucu tanımları.
  Uzak girdiler `transport: "streamable-http"` veya `transport: "sse"` kullanır;
  `type: "http"`, `openclaw mcp set` ve `openclaw doctor --fix` tarafından
  kanonik `transport` alanına normalleştirilen CLI yerel bir takma addır.
- `mcp.sessionIdleTtlMs`: oturum kapsamlı paketle gelen MCP çalışma zamanları için
  boşta TTL. Tek seferlik gömülü çalıştırmalar, çalıştırma sonu temizliği ister;
  bu TTL uzun ömürlü oturumlar ve gelecekteki çağıranlar için güvenlik ağıdır.
- `mcp.*` altındaki değişiklikler, önbelleğe alınmış oturum MCP çalışma zamanları
  elden çıkarılarak sıcak uygulanır. Sonraki araç keşfi/kullanımı bunları yeni
  yapılandırmadan yeniden oluşturur; böylece kaldırılan `mcp.servers` girdileri
  boşta TTL beklenmeden hemen toplanır.

Çalışma zamanı davranışı için bkz.
[MCP](/tr/cli/mcp#openclaw-as-an-mcp-client-registry) ve
[CLI arka uçları](/tr/gateway/cli-backends#bundle-mcp-overlays).

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
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

- `allowBundled`: yalnızca paketle gelen Skills için isteğe bağlı izin listesi (yönetilen/çalışma alanı Skills etkilenmez).
- `load.extraDirs`: ek paylaşılan Skill kökleri (en düşük öncelik).
- `load.allowSymlinkTargets`: bağlantı yapılandırılmış kaynak kökünün dışında
  bulunduğunda Skill sembolik bağlantılarının çözümlenebileceği güvenilir gerçek hedef kökler.
- `install.preferBrew`: true olduğunda, diğer kurucu türlerine geri dönmeden önce
  `brew` kullanılabiliyorsa Homebrew kurucularını tercih eder.
- `install.nodeManager`: `metadata.openclaw.install` belirtimleri için node kurucu tercihi
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: güvenilir `operator.admin` Gateway istemcilerinin
  `skills.upload.*` üzerinden hazırlanmış özel zip arşivlerini kurmasına izin verir
  (varsayılan: false). Bu yalnızca yüklenmiş arşiv yolunu etkinleştirir; normal ClawHub
  kurulumları bunu gerektirmez.
- `entries.<skillKey>.enabled: false`, paketle gelmiş/kurulu olsa bile bir Skill'i devre dışı bırakır.
- `entries.<skillKey>.apiKey`: birincil env var bildiren Skills için kolaylık (düz metin dizesi veya SecretRef nesnesi).

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

- `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` ve `plugins.load.paths` konumlarından yüklenir.
- Keşif, yerel OpenClaw Plugin'lerini ve uyumlu Codex paketleri ile Claude paketlerini, manifest içermeyen Claude varsayılan yerleşim paketleri dahil kabul eder.
- **Yapılandırma değişiklikleri Gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen Plugin'ler yüklenir). `deny` baskın gelir.
- `bundledDiscovery`: yeni yapılandırmalarda varsayılan olarak `"allowlist"` olur; bu nedenle boş olmayan
  bir `plugins.allow`, web arama çalışma zamanı sağlayıcıları dahil paketle gelen sağlayıcı
  Plugin'lerini de geçitler. Doctor, siz açıkça kabul edene kadar mevcut paketle gelen sağlayıcı
  davranışını korumak için geçirilmiş eski izin listesi yapılandırmalarına `"compat"` yazar.
- `plugins.entries.<id>.apiKey`: Plugin düzeyi API anahtarı kolaylık alanı (Plugin tarafından desteklendiğinde).
- `plugins.entries.<id>.env`: Plugin kapsamlı env var eşlemi.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda çekirdek, `before_prompt_build` öğesini engeller ve eski `before_agent_start` içinden prompt değiştiren alanları yok sayarken eski `modelOverride` ve `providerOverride` değerlerini korur. Yerel Plugin hook'larına ve desteklenen paket tarafından sağlanan hook dizinlerine uygulanır.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` olduğunda, güvenilir paketle gelmeyen Plugin'ler `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` ve `agent_end` gibi tipli hook'lardan ham konuşma içeriğini okuyabilir.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu Plugin'e arka plan subagent çalıştırmaları için çalıştırma bazlı `provider` ve `model` geçersiz kılmaları istemesi konusunda açıkça güven.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilir subagent geçersiz kılmaları için kanonik `provider/model` hedeflerinin isteğe bağlı izin listesi. Yalnızca bilinçli olarak herhangi bir modele izin vermek istediğinizde `"*"` kullanın.
- `plugins.entries.<id>.llm.allowModelOverride`: bu Plugin'e `api.runtime.llm.complete` için model geçersiz kılmaları istemesi konusunda açıkça güven.
- `plugins.entries.<id>.llm.allowedModels`: güvenilir Plugin LLM tamamlama geçersiz kılmaları için kanonik `provider/model` hedeflerinin isteğe bağlı izin listesi. Yalnızca bilinçli olarak herhangi bir modele izin vermek istediğinizde `"*"` kullanın.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: bu Plugin'e `api.runtime.llm.complete` komutunu varsayılan olmayan bir agent kimliğine karşı çalıştırması konusunda açıkça güven.
- `plugins.entries.<id>.config`: Plugin tarafından tanımlanan yapılandırma nesnesi (mevcut olduğunda yerel OpenClaw Plugin şeması tarafından doğrulanır).
- Kanal Plugin'i hesap/çalışma zamanı ayarları `channels.<id>` altında yer alır ve merkezi bir OpenClaw seçenek kayıt defteriyle değil, sahip Plugin'in manifest `channelConfigs` meta verileriyle açıklanmalıdır.

### Codex harness Plugin yapılandırması

Paketle gelen `codex` Plugin'i, yerel Codex uygulama sunucusu harness ayarlarına
`plugins.entries.codex.config` altında sahiptir. Tam yapılandırma yüzeyi için
[Codex harness başvurusu](/tr/plugins/codex-harness-reference), çalışma zamanı modeli için
[Codex harness](/tr/plugins/codex-harness) bölümüne bakın.

`codexPlugins` yalnızca yerel Codex harness'ını seçen oturumlar için geçerlidir.
Pi, normal OpenAI sağlayıcı çalıştırmaları, ACP konuşma bağlamaları veya Codex dışı
herhangi bir harness için Codex Plugin'lerini etkinleştirmez.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: Codex harness için yerel Codex
  plugin/uygulama desteğini etkinleştirir. Varsayılan: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  taşınan plugin uygulama istemleri için varsayılan yıkıcı eylem ilkesi.
  Varsayılan: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: genel
  `codexPlugins.enabled` da true olduğunda taşınan bir plugin girdisini etkinleştirir.
  Varsayılan: açık girdiler için `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  kararlı marketplace kimliği. V1 yalnızca `"openai-curated"` destekler.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: taşıma işleminden gelen kararlı
  Codex plugin kimliği, örneğin `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  plugin başına yıkıcı eylem geçersiz kılması. Atlandığında, genel
  `allow_destructive_actions` değeri kullanılır.

`codexPlugins.enabled` genel etkinleştirme yönergesidir. Taşıma tarafından yazılan açık plugin
girdileri, kalıcı kurulum ve onarım uygunluk kümesidir.
`plugins["*"]` desteklenmez, `install` anahtarı yoktur ve yerel
`marketplacePath` değerleri konağa özgü oldukları için özellikle yapılandırma alanı değildir.

`app/list` hazır olma denetimleri bir saat önbelleğe alınır ve bayatladığında
eşzamansız olarak yenilenir. Codex iş parçacığı uygulama yapılandırması, her turda değil
Codex harness oturumu kurulurken hesaplanır; yerel plugin yapılandırmasını değiştirdikten sonra
`/new`, `/reset` veya bir gateway yeniden başlatması kullanın.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch sağlayıcı ayarları.
  - `apiKey`: Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` ortam değişkenine geri döner.
  - `baseUrl`: Firecrawl API temel URL'si (varsayılan: `https://api.firecrawl.dev`; kendi barındırılan geçersiz kılmalar özel/dahili uç noktaları hedeflemelidir).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkarır (varsayılan: `true`).
  - `maxAgeMs`: milisaniye cinsinden maksimum önbellek yaşı (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: saniye cinsinden scrape isteği zaman aşımı (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web search) ayarları.
  - `enabled`: X Search sağlayıcısını etkinleştirir.
  - `model`: arama için kullanılacak Grok modeli (örn. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: memory dreaming ayarları. Aşamalar ve eşikler için [Dreaming](/tr/concepts/dreaming) bölümüne bakın.
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam dreaming taraması için cron aralığı (varsayılan olarak `"0 3 * * *"`).
  - `model`: isteğe bağlı Dream Diary alt aracı model geçersiz kılması. `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir; hedefleri sınırlamak için `allowedModels` ile eşleştirin. Model kullanılamıyor hataları oturum varsayılan modeliyle bir kez yeniden denenir; güven veya izin listesi hataları sessizce geri dönmez.
  - aşama ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya dönük yapılandırma anahtarları değildir).
- Tam bellek yapılandırması [Bellek yapılandırma başvurusu](/tr/reference/memory-config) içinde bulunur:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude paket plugin'leri `settings.json` dosyasından gömülü Pi varsayılanları da katkıda bulunabilir; OpenClaw bunları ham OpenClaw yapılandırma yamaları olarak değil, temizlenmiş aracı ayarları olarak uygular.
- `plugins.slots.memory`: etkin bellek plugin kimliğini seçin veya bellek plugin'lerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: etkin bağlam motoru plugin kimliğini seçin; başka bir motor kurup seçmediğiniz sürece varsayılan `"legacy"` olur.

Bkz. [Plugins](/tr/tools/plugin).

---

## Taahhütler

`commitments` çıkarılan takip belleğini denetler: OpenClaw konuşma turlarından check-in'leri algılayabilir ve bunları Heartbeat çalışmaları üzerinden iletebilir.

- `commitments.enabled`: çıkarılan takip taahhütleri için gizli LLM çıkarımı, depolama ve Heartbeat teslimini etkinleştirir. Varsayılan: `false`.
- `commitments.maxPerDay`: kayan bir gün içinde aracı oturumu başına iletilen maksimum çıkarılmış takip taahhüdü. Varsayılan: `3`.

Bkz. [Çıkarılan taahhütler](/tr/concepts/commitments).

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

- `evaluateEnabled: false`, `act:evaluate` ve `wait --fn` öğelerini devre dışı bırakır.
- `tabCleanup`, boşta kalma süresinden sonra veya bir oturum sınırını aştığında izlenen birincil aracı sekmelerini geri alır. Bu tekil temizleme modlarını devre dışı bırakmak için `idleMinutes: 0` veya `maxTabsPerSession: 0` ayarlayın.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ayarlanmadığında devre dışıdır, bu nedenle tarayıcı gezintisi varsayılan olarak katı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezintisine bilinçli olarak güvendiğinizde ayarlayın.
- Katı modda, uzak CDP profil uç noktaları (`profiles.*.cdpUrl`) erişilebilirlik/keşif denetimleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork` eski takma ad olarak desteklenmeye devam eder.
- Katı modda, açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca bağlanma amaçlıdır (başlat/durdur/sıfırla devre dışıdır).
- `profiles.*.cdpUrl` `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw'ın `/json/version` keşfetmesini istediğinizde HTTP(S) kullanın; sağlayıcınız size doğrudan DevTools WebSocket URL'si verdiğinde WS(S) kullanın.
- `remoteCdpTimeoutMs` ve `remoteCdpHandshakeTimeoutMs`, uzak ve `attachOnly` CDP erişilebilirliği ile sekme açma isteklerine uygulanır. Yönetilen loopback profilleri yerel CDP varsayılanlarını korur.
- Harici olarak yönetilen bir CDP servisine loopback üzerinden erişilebiliyorsa, o profilin `attachOnly: true` değerini ayarlayın; aksi halde OpenClaw loopback bağlantı noktasını yerel yönetilen tarayıcı profili olarak değerlendirir ve yerel bağlantı noktası sahipliği hataları bildirebilir.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve seçilen konakta veya bağlı bir tarayıcı düğümü üzerinden bağlanabilir.
- `existing-session` profilleri Brave veya Edge gibi belirli bir Chromium tabanlı tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri mevcut Chrome MCP rota sınırlarını korur:
  CSS seçici hedefleme yerine snapshot/ref odaklı eylemler, tek dosya yükleme
  kancaları, dialog zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve
  `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; `cdpUrl` değerini yalnızca uzak CDP için açıkça ayarlayın.
- Yerel yönetilen profiller, o profil için genel `browser.executablePath` değerini geçersiz kılmak üzere `executablePath` ayarlayabilir. Bunu bir profili Chrome'da, diğerini Brave'de çalıştırmak için kullanın.
- Yerel yönetilen profiller süreç başlatıldıktan sonra Chrome CDP HTTP keşfi için `browser.localLaunchTimeoutMs`, başlatma sonrası CDP websocket hazır olma durumu için `browser.localCdpReadyTimeoutMs` kullanır. Chrome'un başarıyla başladığı ancak hazır olma denetimlerinin başlatmayla yarıştığı daha yavaş konaklarda bunları artırın. Her iki değer de `120000` ms'ye kadar pozitif tam sayı olmalıdır; geçersiz yapılandırma değerleri reddedilir.
- Otomatik algılama sırası: Chromium tabanlıysa varsayılan tarayıcı → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` ve `browser.profiles.<name>.executablePath` Chromium başlatılmadan önce işletim sistemi ev dizininiz için hem `~` hem de `~/...` kabul eder.
  `existing-session` profillerindeki profil başına `userDataDir` de tilde ile genişletilir.
- Denetim servisi: yalnızca loopback (bağlantı noktası `gateway.port` değerinden türetilir, varsayılan `18791`).
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

- `seamColor`: yerel uygulama UI kromu için vurgu rengi (Talk Mode balon tonu vb.).
- `assistant`: Control UI kimliği geçersiz kılması. Etkin aracı kimliğine geri döner.

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

- `mode`: `local` (Gateway'i çalıştır) veya `remote` (uzak Gateway'e bağlan). Gateway, `local` olmadığı sürece başlamayı reddeder.
- `port`: WS + HTTP için tek çoklanmış port. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP'si) veya `custom`.
- **Eski bind takma adları**: `gateway.bind` içinde ana makine takma adları (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) yerine bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind, kapsayıcı içinde `127.0.0.1` üzerinde dinler. Docker köprü ağıyla (`-p 18789:18789`) trafik `eth0` üzerinden gelir, bu nedenle Gateway erişilemez. Tüm arayüzlerde dinlemek için `--network host` kullanın ya da `bind: "lan"` (veya `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Kimlik doğrulama**: varsayılan olarak gereklidir. Loopback olmayan bind'ler Gateway kimlik doğrulaması gerektirir. Pratikte bu, paylaşılan bir token/parola ya da `gateway.auth.mode: "trusted-proxy"` ile kimlik farkındalıklı bir ters proxy anlamına gelir. Onboarding sihirbazı varsayılan olarak bir token oluşturur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. İkisi de yapılandırılmış ve mode ayarlanmamışsa başlangıç ve servis kurulum/onarım akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık kimlik doğrulamasız mode. Yalnızca güvenilir local loopback kurulumları için kullanın; bu seçenek onboarding istemlerinde özellikle sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: tarayıcı/kullanıcı kimlik doğrulamasını kimlik farkındalıklı bir ters proxy'ye devredin ve `gateway.trustedProxies` üzerinden gelen kimlik başlıklarına güvenin (bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)). Bu mode varsayılan olarak **loopback olmayan** bir proxy kaynağı bekler; aynı ana makinedeki loopback ters proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir. Dahili aynı ana makine çağırıcıları, local doğrudan yedek olarak `gateway.auth.password` kullanabilir; `gateway.auth.token`, trusted-proxy mode ile karşılıklı olarak dışlayıcı kalır.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını **kullanmaz**; bunun yerine Gateway'in normal HTTP kimlik doğrulama mode'unu izler. Bu tokensız akış, Gateway ana makinesinin güvenilir olduğunu varsayar. Varsayılan değer `tailscale.mode = "serve"` olduğunda `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP'si ve kimlik doğrulama kapsamı başına uygulanır (shared-secret ve device-token bağımsız izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Eşzamansız Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler hata yazımından önce serileştirilir. Bu nedenle aynı istemciden gelen eşzamanlı hatalı denemeler, ikisinin de düz uyuşmazlık olarak yarışıp geçmesi yerine ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` değerindedir; localhost trafiğinin de hız sınırlamasına tabi olmasını özellikle istediğinizde (test kurulumları veya sıkı proxy dağıtımları için) `false` olarak ayarlayın.
- Tarayıcı kaynaklı WS kimlik doğrulama denemeleri her zaman loopback muafiyeti devre dışı bırakılmış şekilde kısıtlanır (tarayıcı tabanlı localhost kaba kuvvet saldırısına karşı derinlemesine savunma).
- Loopback üzerinde, bu tarayıcı kaynaklı kilitlemeler normalize edilmiş `Origin`
  değeri başına yalıtılır, böylece bir localhost origin'den tekrarlanan hatalar farklı bir origin'i
  otomatik olarak kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, loopback bind) veya `funnel` (genel, kimlik doğrulama gerektirir).
- `tailscale.preserveFunnel`: `true` olduğunda ve `tailscale.mode = "serve"` ise, OpenClaw
  başlangıçta Serve'ü yeniden uygulamadan önce `tailscale funnel status` denetler ve dışarıdan yapılandırılmış bir Funnel rotası Gateway portunu zaten kapsıyorsa
  bunu atlar. Varsayılan `false`.
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı-origin izin listesi. Tarayıcı istemcilerinin loopback olmayan origin'lerden beklenmesi durumunda gereklidir.
- `controlUi.chatMessageMaxWidth`: gruplanmış Control UI sohbet iletileri için isteğe bağlı en fazla genişlik. `960px`, `82%`, `min(1280px, 82%)` ve `calc(100% - 2rem)` gibi sınırlandırılmış CSS genişlik değerlerini kabul eder.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: bilinçli olarak Host başlığı origin ilkesine dayanan dağıtımlar için Host başlığı origin yedeğini etkinleştiren tehlikeli mode.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için `remote.url`, `ws://` veya `wss://` olmalıdır.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: düz metin `ws://` bağlantılarının güvenilir özel ağ
  IP'lerine yapılmasına izin veren istemci tarafı süreç ortamı
  son çare geçersiz kılmasıdır; varsayılan, düz metin için loopback-only kalır. Bunun `openclaw.json`
  eşdeğeri yoktur ve `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` gibi
  tarayıcı özel ağ yapılandırmaları Gateway
  WebSocket istemcilerini etkilemez.
- `gateway.remote.token` / `.password` uzak istemci kimlik bilgisi alanlarıdır. Tek başlarına Gateway kimlik doğrulamasını yapılandırmazlar.
- `gateway.push.apns.relay.baseUrl`: resmi/TestFlight iOS derlemeleri relay destekli kayıtları Gateway'e yayımladıktan sonra bunlar tarafından kullanılan harici APNs relay'i için temel HTTPS URL'si. Bu URL, iOS derlemesine gömülü relay URL'siyle eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: Gateway'den relay'e gönderim zaman aşımı, milisaniye cinsinden. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir Gateway kimliğine devredilir. Eşleştirilmiş iOS uygulaması `gateway.identity.get` değerini alır, bu kimliği relay kaydına dahil eder ve kayıt kapsamlı gönderim iznini Gateway'e iletir. Başka bir Gateway bu saklanan kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici env geçersiz kılmaları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL'leri için yalnızca geliştirme amaçlı kaçış yolu. Üretim relay URL'leri HTTPS üzerinde kalmalıdır.
- `gateway.handshakeTimeoutMs`: kimlik doğrulama öncesi Gateway WebSocket el sıkışma zaman aşımı, milisaniye cinsinden. Varsayılan: `15000`. Ayarlandığında `OPENCLAW_HANDSHAKE_TIMEOUT_MS` önceliklidir. Başlangıç ısınması hâlâ otururken local istemcilerin bağlanabildiği yüklü veya düşük güçlü ana makinelerde bunu artırın.
- `gateway.channelHealthCheckMinutes`: kanal sağlık izleyici aralığı, dakika cinsinden. Sağlık izleyici yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` olarak ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: eski soket eşiği, dakika cinsinden. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına en fazla sağlık izleyici yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: global izleyiciyi etkin tutarken sağlık izleyici yeniden başlatmaları için kanal başına vazgeçme seçeneği.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap başına geçersiz kılma. Ayarlandığında kanal düzeyi geçersiz kılmaya göre önceliklidir.
- Local Gateway çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` değerlerini yedek olarak kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef aracılığıyla açıkça yapılandırılmış ve çözümlenmemişse, çözümleme kapalı şekilde başarısız olur (uzak yedek maskelemesi yoktur).
- `trustedProxies`: TLS'i sonlandıran veya forwarded-client başlıkları ekleyen ters proxy IP'leri. Yalnızca denetlediğiniz proxy'leri listeleyin. Loopback girdileri aynı ana makine proxy/local-detection kurulumları için (örneğin Tailscale Serve veya local ters proxy) hâlâ geçerlidir, ancak loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hale **getirmezler**.
- `allowRealIpFallback`: `true` olduğunda, Gateway `X-Forwarded-For` eksikse `X-Real-IP` kabul eder. Kapalı başarısız davranış için varsayılan `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: istenen kapsamlar olmadan ilk kez node cihaz eşleştirmesini otomatik onaylamak için isteğe bağlı CIDR/IP izin listesi. Ayarlanmamışsa devre dışıdır. Bu, operatör/tarayıcı/Control UI/WebChat eşleştirmesini otomatik onaylamaz ve rol, kapsam, metadata veya public-key yükseltmelerini otomatik onaylamaz.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: eşleştirme ve platform izin listesi değerlendirmesinden sonra bildirilen node komutları için global izin/red şekillendirmesi. `camera.snap`, `camera.clip` ve `screen.record` gibi tehlikeli node komutlarını dahil etmek için `allowCommands` kullanın; `denyCommands`, bir platform varsayılanı veya açık izin aksi halde içerecek olsa bile bir komutu kaldırır. Bir node bildirdiği komut listesini değiştirdikten sonra, Gateway'in güncellenmiş komut anlık görüntüsünü saklaması için bu cihaz eşleştirmesini reddedip yeniden onaylayın.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek araç adları (varsayılan red listesini genişletir).
- `gateway.tools.allow`: araç adlarını varsayılan HTTP red listesinden kaldırır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdisi güçlendirmesi:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarlanmamış kabul edilir; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt güçlendirme başlığı:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca denetlediğiniz HTTPS origin'leri için ayarlayın; bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çoklu instance yalıtımı

Tek bir ana makinede benzersiz portlar ve state dizinleriyle birden fazla Gateway çalıştırın:

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

- `enabled`: Gateway dinleyicisinde TLS sonlandırmayı (HTTPS/WSS) etkinleştirir (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında local kendinden imzalı bir cert/key çifti otomatik oluşturur; yalnızca local/dev kullanımı içindir.
- `certPath`: TLS sertifika dosyasının dosya sistemi yolu.
- `keyPath`: TLS özel anahtar dosyasının dosya sistemi yolu; izinleri kısıtlı tutun.
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
  - `"restart"`: yapılandırma değişikliğinde Gateway sürecini her zaman yeniden başlat.
  - `"hot"`: değişiklikleri yeniden başlatmadan süreç içinde uygula.
  - `"hybrid"` (varsayılan): önce hot reload dene; gerekirse yeniden başlatmaya geri dön.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tam sayı).
- `deferralTimeoutMs`: yeniden başlatmayı veya kanal hot reload'unu zorlamadan önce devam eden işlemleri beklemek için ms cinsinden isteğe bağlı en uzun süre. Varsayılan sınırlı beklemeyi (`300000`) kullanmak için bunu atlayın; süresiz beklemek ve periyodik hâlâ bekliyor uyarıları günlüğe yazmak için `0` olarak ayarlayın.

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
Sorgu dizesi hook tokenları reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, `gateway.auth.token` değerinden **farklı** olmalıdır; Gateway tokenının yeniden kullanılması reddedilir.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini kısıtlayın (örneğin `["hook:"]`).
- Bir eşleme veya hazır ayar şablonlu bir `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` değerini ayarlayın ve `hooks.allowRequestSessionKey=true` yapın. Statik eşleme anahtarları bu açık katılımı gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükündeki `sessionKey` yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` üzerinden çözümlenir
  - Şablondan işlenen eşleme `sessionKey` değerleri dışarıdan sağlanmış kabul edilir ve ayrıca `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Eşleme ayrıntıları">

- `match.path`, `/hooks` sonrasındaki alt yolla eşleşir (örn. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanıyla eşleşir.
- `{{messages[0].subject}}` gibi şablonlar yükten okur.
- `transform`, bir hook eylemi döndüren bir JS/TS modülüne işaret edebilir.
  - `transform.module` göreli bir yol olmalı ve `hooks.transformsDir` içinde kalmalıdır (mutlak yollar ve dizin dışına çıkma reddedilir).
  - `hooks.transformsDir` değerini `~/.openclaw/hooks/transforms` altında tutun; çalışma alanı skill dizinleri reddedilir. `openclaw doctor` bu yolu geçersiz olarak bildirirse transform modülünü hooks transform dizinine taşıyın veya `hooks.transformsDir` değerini kaldırın.
- `agentId`, belirli bir aracıya yönlendirir; bilinmeyen kimlikler varsayılana geri döner.
- `allowedAgentIds`: açık yönlendirmeyi kısıtlar (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan hook aracı çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranlarının ve şablon odaklı eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin ver (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri için isteğe bağlı önek izin listesi (istek + eşleme), örn. `["hook:"]`. Herhangi bir eşleme veya hazır ayar şablonlu bir `sessionKey` kullandığında zorunlu hale gelir.
- `deliver: true`, son yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` olur.
- `model`, bu hook çalıştırması için LLM değerini geçersiz kılar (model kataloğu ayarlanmışsa izin verilmiş olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail hazır ayarı `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- Bu ileti başına yönlendirmeyi korursanız `hooks.allowRequestSessionKey: true` ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanıyla eşleşecek şekilde kısıtlayın, örneğin `["hook:", "hook:gmail:"]`.
- `hooks.allowRequestSessionKey: false` gerekiyorsa hazır ayarı şablonlu varsayılan yerine statik bir `sessionKey` ile geçersiz kılın.

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

- Gateway, yapılandırıldığında önyüklemede `gog gmail watch serve` komutunu otomatik başlatır. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.
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

- Aracı tarafından düzenlenebilir HTML/CSS/JS ve A2UI’yi Gateway bağlantı noktası altında HTTP üzerinden sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` değerini koruyun (varsayılan).
- loopback olmayan bağlamalar: canvas rotaları, diğer Gateway HTTP yüzeyleriyle aynı şekilde Gateway kimlik doğrulaması gerektirir (token/parola/güvenilir proxy).
- Node WebView’ları genellikle kimlik doğrulama üst bilgileri göndermez; bir Node eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için Node kapsamlı yetenek URL’lerini duyurur.
- Yetenek URL’leri etkin Node WS oturumuna bağlıdır ve hızla sona erer. IP tabanlı geri dönüş kullanılmaz.
- Sunulan HTML’ye canlı yeniden yükleme istemcisi enjekte eder.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- Ayrıca A2UI’yi `/__openclaw__/a2ui/` konumunda sunar.
- Değişiklikler Gateway yeniden başlatması gerektirir.
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
- `full`: `cliPath` + `sshPort` değerlerini dahil eder; LAN çok noktaya yayın duyurusu yine de yerleşik `bonjour` Plugin etkin olmasını gerektirir.
- `off`: Plugin etkinliğini değiştirmeden LAN çok noktaya yayın duyurusunu bastırır.
- Yerleşik `bonjour` Plugin macOS ana makinelerinde otomatik başlar; Linux, Windows ve konteynerleştirilmiş Gateway dağıtımlarında açık katılım gerektirir.
- Ana makine adı, geçerli bir DNS etiketi olduğunda varsayılan olarak sistem ana makine adını kullanır; aksi halde `openclaw` değerine geri döner. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

### Geniş alan (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` altında bir tekil yayın DNS-SD bölgesi yazar. Ağlar arası keşif için bir DNS sunucusuyla (CoreDNS önerilir) + Tailscale bölünmüş DNS ile eşleştirin.

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

- Satır içi env değişkenleri yalnızca süreç ortamında ilgili anahtar eksikse uygulanır.
- `.env` dosyaları: CWD `.env` + `~/.openclaw/.env` (hiçbiri mevcut değişkenleri geçersiz kılmaz).
- `shellEnv`: oturum açma kabuğu profilinizden eksik beklenen anahtarları içe aktarır.
- Tam öncelik sırası için [Ortam](/tr/help/environment) bölümüne bakın.

### Env değişkeni ikamesi

Herhangi bir yapılandırma dizesinde env değişkenlerine `${VAR_NAME}` ile başvurun:

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

## Gizli Değerler

Gizli değer başvuruları eklemelidir: düz metin değerler hâlâ çalışır.

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
- `source: "exec"` id’leri `.` veya `..` eğik çizgiyle ayrılmış yol segmentleri içermemelidir (örneğin `a/../b` reddedilir)

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

- `file` sağlayıcısı `mode: "json"` ve `mode: "singleValue"` destekler (`id`, singleValue modunda `"value"` olmalıdır).
- Windows ACL doğrulaması kullanılamadığında dosya ve exec sağlayıcı yolları kapalı şekilde başarısız olur. `allowInsecurePath: true` ayarını yalnızca doğrulanamayan güvenilir yollar için belirleyin.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yükleri kullanır.
- Varsayılan olarak sembolik bağlantı komut yolları reddedilir. Çözümlenen hedef yol doğrulanırken sembolik bağlantı yollarına izin vermek için `allowSymlinkCommand: true` ayarını belirleyin.
- `trustedDirs` yapılandırılmışsa, güvenilir dizin denetimi çözümlenen hedef yola uygulanır.
- `exec` alt ortamı varsayılan olarak asgaridir; gerekli değişkenleri `passEnv` ile açıkça geçirin.
- Gizli değer başvuruları etkinleştirme zamanında bellek içi bir anlık görüntüye çözümlenir, ardından istek yolları yalnızca anlık görüntüyü okur.
- Etkin yüzey filtreleme etkinleştirme sırasında uygulanır: etkin yüzeylerdeki çözümlenemeyen başvurular başlatma/yeniden yükleme işlemini başarısız kılar, etkin olmayan yüzeyler ise tanılama ile atlanır.

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
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyinde başvuruları destekler (`api_key` için `keyRef`, `token` için `tokenRef`).
- `{ "provider": { "apiKey": "..." } }` gibi eski düz `auth-profiles.json` eşlemeleri çalışma zamanı biçimi değildir; `openclaw doctor --fix` bunları `.legacy-flat.*.bak` yedeğiyle kanonik `provider:default` API anahtarı profillerine yeniden yazar.
- OAuth modu profilleri (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli auth-profile kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri bellek içi çözümlenmiş anlık görüntülerden gelir; eski statik `auth.json` girdileri keşfedildiğinde temizlenir.
- Eski OAuth içe aktarmaları `~/.openclaw/credentials/oauth.json` konumundan yapılır.
- [OAuth](/tr/concepts/oauth) bölümüne bakın.
- Gizli değerler çalışma zamanı davranışı ve `audit/configure/apply` araçları: [Gizli Değer Yönetimi](/tr/gateway/secrets).

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

- `billingBackoffHours`: bir profil gerçek faturalandırma/yetersiz kredi hataları nedeniyle başarısız olduğunda saat cinsinden temel geri çekilme (varsayılan: `5`). Açık faturalandırma metni, `401`/`403` yanıtlarında bile yine buraya düşebilir, ancak sağlayıcıya özgü metin eşleştiriciler yalnızca onları sahiplenen sağlayıcı kapsamında kalır (örneğin OpenRouter `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya kuruluş/çalışma alanı harcama sınırı iletileri bunun yerine `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalandırma geri çekilme saatleri için sağlayıcı başına isteğe bağlı geçersiz kılmalar.
- `billingMaxHours`: faturalandırma geri çekilmesinin üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenilirlikli `auth_permanent` hataları için dakika cinsinden temel geri çekilme (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan saat cinsinden kayan pencere (varsayılan: `24`).
- `overloadedProfileRotations`: model geri dönüşüne geçmeden önce aşırı yüklü hatalar için aynı sağlayıcıdaki kimlik doğrulama profili rotasyonlarının en yüksek sayısı (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı meşgul biçimleri buraya düşer.
- `overloadedBackoffMs`: aşırı yüklü bir sağlayıcı/profil rotasyonunu yeniden denemeden önce sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model geri dönüşüne geçmeden önce hız sınırı hataları için aynı sağlayıcıdaki kimlik doğrulama profili rotasyonlarının en yüksek sayısı (varsayılan: `1`). Bu hız sınırı kovası `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

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
- `--verbose` kullanıldığında `consoleLevel`, `debug` değerine yükselir.
- `maxFileBytes`: döndürmeden önce etkin günlük dosyasının bayt cinsinden en yüksek boyutu (pozitif tam sayı; varsayılan: `104857600` = 100 MB). OpenClaw, etkin dosyanın yanında en fazla beş numaralı arşiv tutar.
- `redactSensitive` / `redactPatterns`: konsol çıktısı, dosya günlükleri, OTLP günlük kayıtları ve kalıcı oturum transkripti metni için en iyi çabayla maskeleme. `redactSensitive: "off"` yalnızca bu genel günlük/transkript politikasını devre dışı bırakır; UI/araç/tanılama güvenliği yüzeyleri yayımdan önce sırları yine de gizler.

---

## Tanılamalar

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
- `stuckSessionWarnMs`: uzun süren işleme oturumlarını `session.long_running`, `session.stalled` veya `session.stuck` olarak sınıflandırmak için ms cinsinden ilerleme olmadan yaş eşiği. Yanıt, araç, durum, blok ve ACP ilerlemesi zamanlayıcıyı sıfırlar; tekrarlanan `session.stuck` tanılamaları değişiklik olmadığında geri çekilir.
- `stuckSessionAbortMs`: uygun takılı kalmış etkin işin kurtarma için durdurulup boşaltılabilmesinden önce ms cinsinden ilerleme olmadan yaş eşiği. Ayarlanmadığında OpenClaw en az 10 dakika ve `stuckSessionWarnMs` değerinin 5 katı olan daha güvenli uzatılmış gömülü çalıştırma penceresini kullanır.
- `otel.enabled`: OpenTelemetry dışa aktarma hattını etkinleştirir (varsayılan: `false`). Tam yapılandırma, sinyal kataloğu ve gizlilik modeli için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).
- `otel.endpoint`: OTel dışa aktarma için toplayıcı URL'si.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: isteğe bağlı sinyale özgü OTLP uç noktaları. Ayarlandığında, yalnızca o sinyal için `otel.endpoint` değerini geçersiz kılarlar.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC meta veri başlıkları.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarmayı etkinleştirir.
- `otel.sampleRate`: iz örnekleme oranı `0`-`1`.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri boşaltma aralığı.
- `otel.captureContent`: OTEL span öznitelikleri için isteğe bağlı ham içerik yakalama. Varsayılan olarak kapalıdır. Boolean `true`, sistem dışı ileti/araç içeriğini yakalar; nesne biçimi `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` ve `systemPrompt` öğelerini açıkça etkinleştirmenize olanak tanır.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: en son deneysel GenAI span sağlayıcı öznitelikleri için ortam anahtarı. Varsayılan olarak span'ler uyumluluk için eski `gen_ai.system` özniteliğini korur; GenAI metrikleri sınırlı anlamsal öznitelikler kullanır.
- `OPENCLAW_OTEL_PRELOADED=1`: zaten genel bir OpenTelemetry SDK kaydetmiş ana makineler için ortam anahtarı. OpenClaw bu durumda tanılama dinleyicilerini etkin tutarken Plugin sahipli SDK başlatma/kapatma işlemini atlar.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` ve `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: eşleşen yapılandırma anahtarı ayarlanmamışsa kullanılan sinyale özgü uç nokta ortam değişkenleri.
- `cacheTrace.enabled`: gömülü çalıştırmalar için önbellek izi anlık görüntülerini günlüğe yaz (varsayılan: `false`).
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

- `channel`: npm/git kurulumları için sürüm kanalı - `"stable"`, `"beta"` veya `"dev"`.
- `checkOnStart`: Gateway başladığında npm güncellemelerini denetle (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka planda otomatik güncellemeyi etkinleştir (varsayılan: `false`).
- `auto.stableDelayHours`: kararlı kanal otomatik uygulaması öncesi saat cinsinden minimum gecikme (varsayılan: `6`; en fazla: `168`).
- `auto.stableJitterHours`: saat cinsinden ek kararlı kanal dağıtım yayılım penceresi (varsayılan: `12`; en fazla: `168`).
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

- `enabled`: genel ACP özellik kapısı (varsayılan: `true`; ACP gönderimini ve oluşturma olanaklarını gizlemek için `false` ayarlayın).
- `dispatch.enabled`: ACP oturum turu gönderimi için bağımsız kapı (varsayılan: `true`). ACP komutlarını kullanılabilir tutarken yürütmeyi engellemek için `false` ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı arka uç kimliği (kayıtlı bir ACP çalışma zamanı Plugin ile eşleşmelidir).
  Önce arka uç Plugin'i kurun ve `plugins.allow` ayarlanmışsa arka uç Plugin kimliğini (örneğin `acpx`) ekleyin; aksi halde ACP arka ucu yüklenmez.
- `defaultAgent`: oluşturma işlemleri açık bir hedef belirtmediğinde yedek ACP hedef aracı kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen aracı kimliklerinin izin listesi; boş olması ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: aynı anda etkin olabilecek en yüksek ACP oturumu sayısı.
- `stream.coalesceIdleMs`: akışlı metin için ms cinsinden boşta boşaltma penceresi.
- `stream.maxChunkChars`: akışlı blok projeksiyonunu bölmeden önceki en yüksek parça boyutu.
- `stream.repeatSuppression`: her turda yinelenen durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı akış yapar; `"final_only"` tur sonlandırma olaylarına kadar arabelleğe alır.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önceki ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP turu başına projelendirilen en yüksek asistan çıktı karakteri sayısı.
- `stream.maxSessionUpdateChars`: projelendirilen ACP durum/güncelleme satırları için en yüksek karakter sayısı.
- `stream.tagVisibility`: akışlı olaylar için etiket adlarından boolean görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum çalışanları için uygun temizleme öncesi dakika cinsinden boşta TTL.
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

- `cli.banner.taglineMode` başlık sloganı stilini denetler:
  - `"random"` (varsayılan): dönen komik/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yok (başlık/sürüm yine gösterilir).
- Tüm başlığı gizlemek için (yalnızca sloganları değil), `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

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

Geçerli derlemeler artık TCP köprüsünü içermez. Node'lar Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları kaldırabilir).

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
    maxConcurrentRuns: 2, // cron gönderimi + yalıtılmış cron aracı turu yürütmesi
    webhook: "https://example.invalid/legacy", // depolanan notify:true işleri için kullanımdan kaldırılmış yedek
    webhookToken: "replace-with-dedicated-token", // giden webhook kimlik doğrulaması için isteğe bağlı bearer token
    sessionRetention: "24h", // süre dizesi veya false
    runLog: {
      maxBytes: "2mb", // varsayılan 2_000_000 bayt
      keepLines: 2000, // varsayılan 2000
    },
  },
}
```

- `sessionRetention`: tamamlanan izole cron çalıştırma oturumlarının `sessions.json` içinden budanmadan önce ne kadar süre tutulacağı. Arşivlenmiş silinmiş cron transkriptlerinin temizlenmesini de denetler. Varsayılan: `24h`; devre dışı bırakmak için `false` olarak ayarlayın.
- `runLog.maxBytes`: budamadan önce çalıştırma günlüğü dosyası (`cron/runs/<jobId>.jsonl`) başına azami boyut. Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: çalıştırma günlüğü budaması tetiklendiğinde tutulan en yeni satırlar. Varsayılan: `2000`.
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

- `maxAttempts`: geçici hatalarda tek seferlik işler için azami yeniden deneme sayısı (varsayılan: `3`; aralık: `0`-`10`).
- `backoffMs`: her yeniden deneme girişimi için ms cinsinden geri çekilme gecikmeleri dizisi (varsayılan: `[30000, 60000, 300000]`; 1-10 girdi).
- `retryOn`: yeniden denemeleri tetikleyen hata türleri - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Tüm geçici türleri yeniden denemek için atlayın.

Yalnızca tek seferlik cron işleri için geçerlidir. Yinelenen işler ayrı hata işleme kullanır.

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
- `cooldownMs`: aynı iş için tekrarlanan uyarılar arasındaki asgari milisaniye (negatif olmayan tam sayı).
- `includeSkipped`: ardışık atlanan çalıştırmaları uyarı eşiğine dahil eder (varsayılan: `false`). Atlanan çalıştırmalar ayrı izlenir ve yürütme hatası geri çekilmesini etkilemez.
- `mode`: teslim modu - `"announce"` bir kanal mesajı aracılığıyla gönderir; `"webhook"` yapılandırılmış Webhook'a gönderi yapar.
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

- Tüm işler genelinde cron hata bildirimleri için varsayılan hedef.
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi mevcut olduğunda varsayılan olarak `"announce"` kullanılır.
- `channel`: duyuru teslimi için kanal geçersiz kılması. `"last"` bilinen son teslim kanalını yeniden kullanır.
- `to`: açık duyuru hedefi veya Webhook URL'si. Webhook modu için gereklidir.
- `accountId`: teslim için isteğe bağlı hesap geçersiz kılması.
- İş başına `delivery.failureDestination`, bu global varsayılanı geçersiz kılar.
- Ne global ne de iş başına hata hedefi ayarlandığında, zaten `announce` ile teslim yapan işler hata durumunda bu birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, işin birincil `delivery.mode` değeri `"webhook"` olmadıkça yalnızca `sessionTarget="isolated"` işleri için desteklenir.

Bkz. [Cron İşleri](/tr/automation/cron-jobs). İzole cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya modeli şablon değişkenleri

`tools.media.models[].args` içinde genişletilen şablon yer tutucuları:

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
| `{{MediaType}}`    | Medya türü (görsel/ses/belge/…)                   |
| `{{Transcript}}`   | Ses transkripti                                   |
| `{{Prompt}}`       | CLI girdileri için çözümlenmiş medya prompt'u     |
| `{{MaxChars}}`     | CLI girdileri için çözümlenmiş azami çıktı karakterleri |
| `{{ChatType}}`     | `"direct"` veya `"group"`                         |
| `{{GroupSubject}}` | Grup konusu (en iyi çaba)                         |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (en iyi çaba)             |
| `{{SenderName}}`   | Gönderen görünen adı (en iyi çaba)                |
| `{{SenderE164}}`   | Gönderen telefon numarası (en iyi çaba)           |
| `{{Provider}}`     | Sağlayıcı ipucu (whatsapp, telegram, discord, vb.) |

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

- Tek dosya: kapsayan nesnenin yerini alır.
- Dosya dizisi: sırayla derinlemesine birleştirilir (sonrakiler öncekileri geçersiz kılar).
- Kardeş anahtarlar: dahil etmelerden sonra birleştirilir (dahil edilen değerleri geçersiz kılar).
- İç içe dahil etmeler: 10 düzeye kadar.
- Yollar: dahil eden dosyaya göre çözümlenir, ancak üst düzey yapılandırma dizininin (`openclaw.json` dosyasının `dirname` değeri) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca hâlâ bu sınır içinde çözümlendiklerinde izin verilir.
- Yalnızca tek dosyalı bir dahil etme ile desteklenen tek bir üst düzey bölümü değiştiren OpenClaw sahipli yazmalar, doğrudan o dahil edilen dosyaya yazılır. Örneğin, `plugins install`, `plugins.json5` içindeki `plugins: { $include: "./plugins.json5" }` değerini günceller ve `openclaw.json` dosyasını olduğu gibi bırakır.
- Kök dahil etmeler, dahil etme dizileri ve kardeş geçersiz kılmalara sahip dahil etmeler, OpenClaw sahipli yazmalar için salt okunurdur; bu yazmalar yapılandırmayı düzleştirmek yerine kapalı şekilde başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları ve döngüsel dahil etmeler için açık mesajlar.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
