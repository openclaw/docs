---
read_when:
    - Alan düzeyinde kesin yapılandırma semantiğine veya varsayılan değerlere ihtiyacınız var
    - Kanal, model, Gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Çekirdek OpenClaw anahtarları, varsayılanları ve ayrılmış alt sistem başvurularına bağlantılar için Gateway yapılandırma başvurusu
title: Yapılandırma referansı
x-i18n:
    generated_at: "2026-05-10T19:35:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71a9b9ba64b334086a3e32fd9255eb45f9089818a1798a4d542d39d586d53fd9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Çekirdek yapılandırma başvurusu: `~/.openclaw/openclaw.json`. Görev odaklı bir genel bakış için bkz. [Yapılandırma](/tr/gateway/configuration).

Ana OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendi daha derin başvurusu olduğunda bağlantı verir. Kanal ve Plugin sahibi komut katalogları ile derin bellek/QMD ayarları bu sayfa yerine kendi sayfalarında bulunur.

Kod doğrusu:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema'yı yazdırır; mevcut olduğunda paketlenmiş/Plugin/kanal metadata'sı birleştirilir
- `config.schema.lookup`, ayrıntılı inceleme araçları için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, yapılandırma belgeleri temel hash'ini geçerli şema yüzeyine karşı doğrular

Agent arama yolu: düzenlemelerden önce tam alan düzeyi belgeler ve kısıtlamalar için `gateway` araç eylemi `config.schema.lookup` kullanın. Görev odaklı rehberlik için [Yapılandırma](/tr/gateway/configuration), daha geniş alan haritası, varsayılanlar ve alt sistem başvurularına bağlantılar için bu sayfayı kullanın.

Özel derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki dreaming yapılandırması için [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
- Geçerli yerleşik + paketlenmiş komut kataloğu için [Slash komutları](/tr/tools/slash-commands)
- Kanala özgü komut yüzeyleri için sahip kanal/Plugin sayfaları

Yapılandırma biçimi **JSON5**'tir (yorumlara + sonda virgüllere izin verilir). Tüm alanlar isteğe bağlıdır - atlandığında OpenClaw güvenli varsayılanları kullanır.

---

## Kanallar

Kanal başına yapılandırma anahtarları özel bir sayfaya taşındı - Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve diğer paketlenmiş kanallar (kimlik doğrulama, erişim kontrolü, çoklu hesap, mention gating) dahil `channels.*` için bkz. [Yapılandırma - kanallar](/tr/gateway/config-channels).

## Agent varsayılanları, çoklu agent, oturumlar ve mesajlar

Özel bir sayfaya taşındı - şunlar için bkz. [Yapılandırma - agent'lar](/tr/gateway/config-agents):

- `agents.defaults.*` (çalışma alanı, model, düşünme, heartbeat, bellek, medya, Skills, sandbox)
- `multiAgent.*` (çoklu agent yönlendirme ve bağlamalar)
- `session.*` (oturum yaşam döngüsü, Compaction, budama)
- `messages.*` (mesaj teslimi, TTS, markdown işleme)
- `talk.*` (Talk modu)
  - `talk.consultThinkingLevel`: Control UI Talk gerçek zamanlı danışmalarının arkasındaki tam OpenClaw agent çalışması için düşünme düzeyi geçersiz kılması
  - `talk.consultFastMode`: Control UI Talk gerçek zamanlı danışmaları için tek seferlik hızlı mod geçersiz kılması
  - `talk.speechLocale`: iOS/macOS üzerinde Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği
  - `talk.silenceTimeoutMs`: ayarlanmadığında Talk, dökümü göndermeden önce platformun varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`)

## Araçlar ve özel sağlayıcılar

Araç politikası, deneysel anahtarlar, sağlayıcı destekli araç yapılandırması ve özel sağlayıcı / base-URL kurulumu özel bir sayfaya taşındı - bkz. [Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## Modeller

Sağlayıcı tanımları, model izin listeleri ve özel sağlayıcı kurulumu [Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) içinde bulunur. `models` kökü ayrıca genel model kataloğu davranışını da sahiplenir.

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
- `models.providers.*.localService`: yerel model sunucuları için isteğe bağlı isteğe bağlı süreç yöneticisi. OpenClaw yapılandırılmış sağlık uç noktasını yoklar, gerektiğinde mutlak `command` değerini başlatır, hazır olmayı bekler ve ardından model isteğini gönderir. Bkz. [Yerel model servisleri](/tr/gateway/local-model-services).
- `models.pricing.enabled`: sidecar'lar ve kanallar Gateway hazır yoluna ulaştıktan sonra başlayan arka plan fiyatlandırma önyüklemesini kontrol eder. `false` olduğunda Gateway, OpenRouter ve LiteLLM fiyatlandırma kataloğu getirmelerini atlar; yapılandırılmış `models.providers.*.models[].cost` değerleri yerel maliyet tahminleri için çalışmaya devam eder.

## MCP

OpenClaw tarafından yönetilen MCP sunucu tanımları `mcp.servers` altında bulunur ve gömülü Pi ile diğer çalışma zamanı bağdaştırıcıları tarafından tüketilir. `openclaw mcp list`, `show`, `set` ve `unset` komutları, yapılandırma düzenlemeleri sırasında hedef sunucuya bağlanmadan bu bloğu yönetir.

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

- `mcp.servers`: yapılandırılmış MCP araçlarını açığa çıkaran çalışma zamanları için adlandırılmış stdio veya uzak MCP sunucu tanımları. Uzak girdiler `transport: "streamable-http"` veya `transport: "sse"` kullanır; `type: "http"`, `openclaw mcp set` ve `openclaw doctor --fix` tarafından kanonik `transport` alanına normalleştirilen CLI yerel bir takma addır.
- `mcp.sessionIdleTtlMs`: oturum kapsamlı paketlenmiş MCP çalışma zamanları için boşta TTL. Tek seferlik gömülü çalışmalar, çalışma sonu temizliği ister; bu TTL uzun ömürlü oturumlar ve gelecekteki çağıranlar için geri emniyettir.
- `mcp.*` altındaki değişiklikler, önbelleğe alınmış oturum MCP çalışma zamanlarını elden çıkararak sıcak uygulanır. Sonraki araç keşfi/kullanımı bunları yeni yapılandırmadan yeniden oluşturur, bu nedenle kaldırılan `mcp.servers` girdileri boşta TTL beklenmeden hemen temizlenir.

Çalışma zamanı davranışı için bkz. [MCP](/tr/cli/mcp#openclaw-as-an-mcp-client-registry) ve [CLI arka uçları](/tr/gateway/cli-backends#bundle-mcp-overlays).

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

- `allowBundled`: yalnızca paketlenmiş Skills için isteğe bağlı izin listesi (yönetilen/çalışma alanı Skills etkilenmez).
- `load.extraDirs`: ek paylaşılan skill kökleri (en düşük öncelik).
- `load.allowSymlinkTargets`: bağlantı yapılandırılmış kaynak kökünün dışında bulunduğunda skill sembolik bağlantılarının çözümlenebileceği güvenilir gerçek hedef kökler.
- `install.preferBrew`: true olduğunda, diğer yükleyici türlerine geri dönmeden önce `brew` mevcutsa Homebrew yükleyicilerini tercih eder.
- `install.nodeManager`: `metadata.openclaw.install` özellikleri için node yükleyici tercihi (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: güvenilir `operator.admin` Gateway istemcilerinin `skills.upload.*` üzerinden hazırlanan özel zip arşivlerini yüklemesine izin verir (varsayılan: false). Bu yalnızca yüklenen arşiv yolunu etkinleştirir; normal ClawHub yüklemeleri bunu gerektirmez.
- `entries.<skillKey>.enabled: false`, paketlenmiş/yüklenmiş olsa bile bir skill'i devre dışı bırakır.
- `entries.<skillKey>.apiKey`: birincil env var bildiren skills için kolaylık (düz metin dize veya SecretRef nesnesi).

---

## Plugins

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

- `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` ve `plugins.load.paths` içinden yüklenir.
- Keşif, yerel OpenClaw Plugins ile uyumlu Codex paketlerini ve Claude paketlerini, manifest içermeyen Claude varsayılan yerleşim paketleri dahil kabul eder.
- **Yapılandırma değişiklikleri gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen Plugins yüklenir). `deny` kazanır.
- `bundledDiscovery`: yeni yapılandırmalar için varsayılan olarak `"allowlist"` olur, bu nedenle boş olmayan bir `plugins.allow`, web arama çalışma zamanı sağlayıcıları dahil paketlenmiş sağlayıcı Plugins için de kapı görevi görür. Doctor, siz katılana kadar mevcut paketlenmiş sağlayıcı davranışını korumak için taşınmış eski izin listesi yapılandırmalarına `"compat"` yazar.
- `plugins.entries.<id>.apiKey`: Plugin düzeyi API anahtarı kolaylık alanı (Plugin tarafından desteklendiğinde).
- `plugins.entries.<id>.env`: Plugin kapsamlı env var haritası.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda core `before_prompt_build` öğesini engeller ve eski `before_agent_start` içinden prompt değiştiren alanları yok sayar; eski `modelOverride` ve `providerOverride` korunur. Yerel Plugin hook'ları ve desteklenen paket tarafından sağlanan hook dizinleri için geçerlidir.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` olduğunda, güvenilir paketlenmemiş Plugins `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` ve `agent_end` gibi türlendirilmiş hook'lardan ham konuşma içeriğini okuyabilir.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu Plugin'e arka plan subagent çalışmaları için çalışma başına `provider` ve `model` geçersiz kılmaları istemesi için açıkça güvenin.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilir subagent geçersiz kılmaları için kanonik `provider/model` hedeflerinin isteğe bağlı izin listesi. `"*"` değerini yalnızca herhangi bir modele izin vermek istediğinizde kullanın.
- `plugins.entries.<id>.llm.allowModelOverride`: bu Plugin'e `api.runtime.llm.complete` için model geçersiz kılmaları istemesi için açıkça güvenin.
- `plugins.entries.<id>.llm.allowedModels`: güvenilir Plugin LLM tamamlama geçersiz kılmaları için kanonik `provider/model` hedeflerinin isteğe bağlı izin listesi. `"*"` değerini yalnızca herhangi bir modele izin vermek istediğinizde kullanın.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: bu Plugin'e `api.runtime.llm.complete` öğesini varsayılan olmayan bir agent kimliğine karşı çalıştırması için açıkça güvenin.
- `plugins.entries.<id>.config`: Plugin tarafından tanımlanan yapılandırma nesnesi (mevcut olduğunda yerel OpenClaw Plugin şeması tarafından doğrulanır).
- Kanal Plugin hesap/çalışma zamanı ayarları `channels.<id>` altında bulunur ve merkezi bir OpenClaw seçenek kayıt defteri tarafından değil, sahip Plugin'in manifest `channelConfigs` metadata'sı tarafından açıklanmalıdır.

### Codex harness Plugin yapılandırması

Paketlenmiş `codex` Plugin, `plugins.entries.codex.config` altında yerel Codex app-server harness ayarlarını sahiplenir. Tam yapılandırma yüzeyi için bkz. [Codex harness başvurusu](/tr/plugins/codex-harness-reference), çalışma zamanı modeli için bkz. [Codex harness](/tr/plugins/codex-harness).

`codexPlugins` yalnızca yerel Codex harness seçen oturumlara uygulanır. Pi, normal OpenAI sağlayıcı çalışmaları, ACP konuşma bağlamaları veya Codex dışı herhangi bir harness için Codex Plugins öğelerini etkinleştirmez.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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
  taşınmış plugin uygulama çağrıları için varsayılan yıkıcı eylem ilkesi.
  Varsayılan: `false`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: genel
  `codexPlugins.enabled` de true olduğunda taşınmış bir plugin girdisini etkinleştirir.
  Varsayılan: açık girdiler için `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  kararlı marketplace kimliği. V1 yalnızca `"openai-curated"` destekler.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: taşımadan gelen kararlı
  Codex plugin kimliği, örneğin `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  plugin başına yıkıcı eylem geçersiz kılması. Atlandığında genel
  `allow_destructive_actions` değeri kullanılır.

`codexPlugins.enabled` genel etkinleştirme yönergesidir. Taşıma tarafından yazılan açık plugin
girdileri, kalıcı kurulum ve onarım uygunluk kümesidir.
`plugins["*"]` desteklenmez, `install` anahtarı yoktur ve yerel
`marketplacePath` değerleri, ana makineye özgü oldukları için bilinçli olarak yapılandırma alanı değildir.

`app/list` hazır olma denetimleri bir saat boyunca önbelleğe alınır ve eski olduğunda
zamanuyumsuz olarak yenilenir. Codex iş parçacığı uygulama yapılandırması, her turda değil Codex harness
oturumu kurulurken hesaplanır; yerel plugin yapılandırmasını değiştirdikten sonra `/new`, `/reset` veya Gateway
yeniden başlatma kullanın.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch sağlayıcı ayarları.
  - `apiKey`: Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` env var değerine geri döner.
  - `baseUrl`: Firecrawl API temel URL'si (varsayılan: `https://api.firecrawl.dev`; kendi barındırılan geçersiz kılmalar özel/dahili uç noktaları hedeflemelidir).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkar (varsayılan: `true`).
  - `maxAgeMs`: milisaniye cinsinden en yüksek önbellek yaşı (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: saniye cinsinden scrape isteği zaman aşımı (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web search) ayarları.
  - `enabled`: X Search sağlayıcısını etkinleştir.
  - `model`: arama için kullanılacak Grok modeli (ör. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: bellek dreaming ayarları. Aşamalar ve eşikler için [Dreaming](/tr/concepts/dreaming) bölümüne bakın.
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam dreaming taraması için cron temposu (varsayılan olarak `"0 3 * * *"`).
  - `model`: isteğe bağlı Dream Diary alt ajan modeli geçersiz kılması. `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir; hedefleri kısıtlamak için `allowedModels` ile eşleştirin. Model-kullanılamıyor hataları oturum varsayılan modeliyle bir kez yeniden denenir; güven veya izin listesi hatalarında sessizce geri dönülmez.
  - aşama ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya dönük yapılandırma anahtarları değildir).
- Tam bellek yapılandırması [Bellek yapılandırma başvurusu](/tr/reference/memory-config) içinde yer alır:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude paket plugin'leri `settings.json` üzerinden gömülü Pi varsayılanları da sağlayabilir; OpenClaw bunları ham OpenClaw yapılandırma yamaları olarak değil, arındırılmış ajan ayarları olarak uygular.
- `plugins.slots.memory`: etkin bellek plugin kimliğini seçin veya bellek plugin'lerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: etkin bağlam motoru plugin kimliğini seçin; başka bir motor kurup seçmediğiniz sürece varsayılan `"legacy"` olur.

Bkz. [Plugin'ler](/tr/tools/plugin).

---

## Taahhütler

`commitments`, çıkarımsanan takip belleğini denetler: OpenClaw konuşma turlarından check-in'leri algılayabilir ve bunları heartbeat çalışmaları üzerinden iletebilir.

- `commitments.enabled`: çıkarımsanan takip taahhütleri için gizli LLM çıkarımı, depolama ve heartbeat iletimini etkinleştir. Varsayılan: `false`.
- `commitments.maxPerDay`: kayan bir gün içinde ajan oturumu başına iletilen en yüksek çıkarımsanan takip taahhüdü sayısı. Varsayılan: `3`.

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

- `evaluateEnabled: false`, `act:evaluate` ve `wait --fn` seçeneklerini devre dışı bırakır.
- `tabCleanup`, izlenen birincil ajan sekmelerini boşta kalma süresinden sonra veya bir
  oturum sınırını aştığında geri alır. Bu tekil temizleme kiplerini devre dışı bırakmak için
  `idleMinutes: 0` veya `maxTabsPerSession: 0` ayarlayın.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ayarlanmamışsa devre dışıdır, bu nedenle tarayıcı gezinmesi varsayılan olarak katı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezinmesine bilerek güvendiğinizde ayarlayın.
- Katı kipte, uzak CDP profil uç noktaları (`profiles.*.cdpUrl`) erişilebilirlik/keşif denetimleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork` eski takma ad olarak desteklenmeye devam eder.
- Katı kipte, açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca bağlanma kipindedir (başlatma/durdurma/sıfırlama devre dışı).
- `profiles.*.cdpUrl` `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw'ın `/json/version` keşfi yapmasını istediğinizde HTTP(S) kullanın; sağlayıcınız size doğrudan DevTools WebSocket URL'si verdiğinde
  WS(S) kullanın.
- `remoteCdpTimeoutMs` ve `remoteCdpHandshakeTimeoutMs`, uzak ve
  `attachOnly` CDP erişilebilirliğine ve sekme açma isteklerine uygulanır. Yönetilen loopback
  profilleri yerel CDP varsayılanlarını korur.
- Harici olarak yönetilen bir CDP servisine loopback üzerinden erişilebiliyorsa, o
  profilin `attachOnly: true` değerini ayarlayın; aksi halde OpenClaw loopback portunu
  yerel yönetilen tarayıcı profili olarak ele alır ve yerel port sahipliği hataları bildirebilir.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve seçilen ana makinede
  veya bağlı bir tarayıcı düğümü üzerinden bağlanabilir.
- `existing-session` profilleri, Brave veya Edge gibi belirli bir
  Chromium tabanlı tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri mevcut Chrome MCP rota sınırlarını korur:
  CSS seçici hedefleme yerine snapshot/ref odaklı eylemler, tek dosya yükleme
  kancaları, iletişim penceresi zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve
  `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; `cdpUrl` değerini yalnızca
  uzak CDP için açıkça ayarlayın.
- Yerel yönetilen profiller, o profil için genel
  `browser.executablePath` değerini geçersiz kılmak üzere `executablePath` ayarlayabilir. Bunu bir profili
  Chrome'da ve başka birini Brave'de çalıştırmak için kullanın.
- Yerel yönetilen profiller, süreç başladıktan sonra Chrome CDP HTTP
  keşfi için `browser.localLaunchTimeoutMs` ve başlatma sonrası CDP websocket hazır olma durumu için
  `browser.localCdpReadyTimeoutMs` kullanır. Chrome'un başarıyla başladığı ancak
  hazır olma denetimlerinin başlangıçla yarıştığı daha yavaş ana makinelerde bunları artırın. Her iki değer de
  `120000` ms değerine kadar pozitif tamsayı olmalıdır; geçersiz yapılandırma değerleri reddedilir.
- Otomatik algılama sırası: Chromium tabanlıysa varsayılan tarayıcı → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` ve `browser.profiles.<name>.executablePath`, Chromium başlatılmadan önce işletim sistemi ev dizininiz için
  hem `~` hem de `~/...` kabul eder.
  `existing-session` profillerindeki profil başına `userDataDir` de tilde genişletmesine tabi tutulur.
- Denetim servisi: yalnızca loopback (port `gateway.port` değerinden türetilir, varsayılan `18791`).
- `extraArgs`, yerel Chromium başlangıcına ek başlatma bayrakları ekler (örneğin
  `--disable-gpu`, pencere boyutlandırma veya debug bayrakları).

---

## Kullanıcı Arabirimi

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
- `assistant`: Denetim UI kimliği geçersiz kılması. Etkin ajan kimliğine geri döner.

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

- `mode`: `local` (Gateway'i çalıştır) veya `remote` (uzak Gateway'e bağlan). Gateway, `local` olmadığı sürece başlatmayı reddeder.
- `port`: WS + HTTP için tek çoklanan bağlantı noktası. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP'si) veya `custom`.
- **Eski bind takma adları**: `gateway.bind` içinde host takma adlarını (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind'i, kapsayıcı içinde `127.0.0.1` üzerinde dinler. Docker bridge ağıyla (`-p 18789:18789`) trafik `eth0` üzerinden gelir, bu nedenle Gateway'e ulaşılamaz. Tüm arayüzlerde dinlemek için `--network host` kullanın veya `bind: "lan"` (ya da `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Kimlik doğrulama**: varsayılan olarak gereklidir. local loopback dışı bind'ler Gateway kimlik doğrulaması gerektirir. Pratikte bu, paylaşılan bir token/parola veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkındalığı olan bir ters proxy anlamına gelir. İlk kurulum sihirbazı varsayılan olarak bir token oluşturur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. İkisi de yapılandırılmış ve mode ayarlanmamışsa başlatma ve servis kurulum/onarım akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık no-auth modu. Yalnızca güvenilir local loopback kurulumları için kullanın; bu, kasıtlı olarak ilk kurulum istemlerinde sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: tarayıcı/kullanıcı kimlik doğrulamasını kimlik farkındalığı olan bir ters proxy'ye devredin ve `gateway.trustedProxies` içinden gelen kimlik üstbilgilerine güvenin (bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)). Bu mod varsayılan olarak **local loopback olmayan** bir proxy kaynağı bekler; aynı host üzerindeki local loopback ters proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir. Dahili aynı host çağıranları yerel doğrudan yedek olarak `gateway.auth.password` kullanabilir; `gateway.auth.token`, trusted-proxy modu ile karşılıklı olarak dışlayıcı kalır.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik üstbilgileri Control UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` üzerinden doğrulanır). HTTP API uç noktaları bu Tailscale üstbilgi kimlik doğrulamasını **kullanmaz**; bunun yerine Gateway'in normal HTTP kimlik doğrulama modunu izler. Bu tokensız akış, Gateway host'unun güvenilir olduğunu varsayar. `tailscale.mode = "serve"` olduğunda varsayılan değer `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP'si ve kimlik doğrulama kapsamı başına uygulanır (shared-secret ve device-token bağımsız olarak izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Asenkron Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler hata yazılmadan önce seri hale getirilir. Bu yüzden aynı istemciden gelen eşzamanlı kötü denemeler, ikisi de düz uyuşmazlık olarak yarışıp geçmek yerine, ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` olur; localhost trafiğinin de hız sınırlamasına tabi olmasını özellikle istediğinizde (test kurulumları veya katı proxy dağıtımları için) `false` ayarlayın.
- Tarayıcı origin'li WS kimlik doğrulama denemeleri her zaman local loopback muafiyeti devre dışı bırakılarak kısıtlanır (tarayıcı tabanlı localhost kaba kuvvet saldırılarına karşı defense-in-depth).
- local loopback üzerinde, bu tarayıcı origin'li kilitlemeler normalleştirilmiş `Origin`
  değeri başına yalıtılır; bu nedenle bir localhost origin'inden tekrarlanan hatalar farklı bir origin'i otomatik olarak
  kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, local loopback bind) veya `funnel` (genel, kimlik doğrulama gerektirir).
- `tailscale.preserveFunnel`: `true` olduğunda ve `tailscale.mode = "serve"` iken OpenClaw,
  başlangıçta Serve'ü yeniden uygulamadan önce `tailscale funnel status` denetler ve
  harici olarak yapılandırılmış bir Funnel rotası Gateway bağlantı noktasını zaten kapsıyorsa bunu atlar.
  Varsayılan `false`.
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı origin izin listesi. Tarayıcı istemcilerinin local loopback dışı origin'lerden gelmesi bekleniyorsa gereklidir.
- `controlUi.chatMessageMaxWidth`: gruplanmış Control UI sohbet iletileri için isteğe bağlı en büyük genişlik. `960px`, `82%`, `min(1280px, 82%)` ve `calc(100% - 2rem)` gibi sınırlandırılmış CSS genişlik değerlerini kabul eder.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host üstbilgisi origin ilkesine kasıtlı olarak dayanan dağıtımlar için Host üstbilgisi origin yedeğini etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için `remote.url`, `ws://` veya `wss://` olmalıdır.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: trusted özel ağ
  IP'lerine düz metin `ws://` kullanılmasına izin veren istemci tarafı işlem ortamı
  acil durum geçersiz kılmasıdır; düz metin için varsayılan yalnızca local loopback olarak kalır. Bunun `openclaw.json`
  eşdeğeri yoktur ve
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` gibi tarayıcı özel ağ yapılandırmaları Gateway
  WebSocket istemcilerini etkilemez.
- `gateway.remote.token` / `.password` uzak istemci kimlik bilgisi alanlarıdır. Tek başlarına Gateway kimlik doğrulamasını yapılandırmazlar.
- `gateway.push.apns.relay.baseUrl`: resmi/TestFlight iOS derlemeleri relay destekli kayıtları Gateway'e yayımladıktan sonra kullandıkları harici APNs relay'i için temel HTTPS URL'si. Bu URL, iOS derlemesine derlenmiş relay URL'siyle eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: milisaniye cinsinden Gateway'den relay'e gönderim zaman aşımı. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir Gateway kimliğine devredilir. Eşleştirilmiş iOS uygulaması `gateway.identity.get` alır, bu kimliği relay kaydına dahil eder ve kayıt kapsamlı bir gönderme yetkisini Gateway'e iletir. Başka bir Gateway bu saklanan kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici ortam geçersiz kılmaları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: local loopback HTTP relay URL'leri için yalnızca geliştirme amaçlı kaçış yolu. Üretim relay URL'leri HTTPS üzerinde kalmalıdır.
- `gateway.handshakeTimeoutMs`: milisaniye cinsinden kimlik doğrulama öncesi Gateway WebSocket handshake zaman aşımı. Varsayılan: `15000`. Ayarlandığında `OPENCLAW_HANDSHAKE_TIMEOUT_MS` önceliklidir. Yerel istemcilerin, başlangıç ısınması hâlâ otururken bağlanabildiği yüklü veya düşük güçlü host'larda bunu artırın.
- `gateway.channelHealthCheckMinutes`: dakika cinsinden kanal sağlık izleyici aralığı. Sağlık izleyici yeniden başlatmalarını küresel olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: dakika cinsinden eski soket eşiği. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına en fazla sağlık izleyici yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: küresel izleyici etkin kalırken sağlık izleyici yeniden başlatmaları için kanal başına çıkış seçeneği.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap başına geçersiz kılma. Ayarlandığında kanal düzeyi geçersiz kılmaya göre önceliklidir.
- Yerel Gateway çağrı yolları, `gateway.auth.*` ayarlanmamışsa yalnızca yedek olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenmemişse, çözümleme kapalı başarısız olur (uzak yedekle maskeleme olmaz).
- `trustedProxies`: TLS sonlandıran veya iletilmiş istemci üstbilgileri enjekte eden ters proxy IP'leri. Yalnızca denetlediğiniz proxy'leri listeleyin. local loopback girdileri aynı host proxy/yerel algılama kurulumları için hâlâ geçerlidir (örneğin Tailscale Serve veya yerel ters proxy), ancak local loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hale **getirmezler**.
- `allowRealIpFallback`: `true` olduğunda Gateway, `X-Forwarded-For` eksikse `X-Real-IP` değerini kabul eder. Kapalı başarısız davranış için varsayılan `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: istenen kapsam olmadan ilk kez node cihaz eşleştirmesini otomatik onaylamak için isteğe bağlı CIDR/IP izin listesi. Ayarlanmamışsa devre dışıdır. Bu, operatör/tarayıcı/Control UI/WebChat eşleştirmesini otomatik onaylamaz ve rol, kapsam, metadata veya public-key yükseltmelerini otomatik onaylamaz.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: eşleştirme ve platform izin listesi değerlendirmesinden sonra beyan edilen node komutları için küresel izin/verme biçimlendirmesi. `camera.snap`, `camera.clip` ve `screen.record` gibi tehlikeli node komutlarına özellikle izin vermek için `allowCommands` kullanın; `denyCommands`, bir platform varsayılanı veya açık izin aksi halde onu dahil edecek olsa bile bir komutu kaldırır. Bir node beyan ettiği komut listesini değiştirdikten sonra, Gateway'in güncel komut anlık görüntüsünü saklaması için o cihaz eşleştirmesini reddedip yeniden onaylayın.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek araç adları (varsayılan engelleme listesini genişletir).
- `gateway.tools.allow`: varsayılan HTTP engelleme listesinden araç adlarını kaldırır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdisi sıkılaştırması:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarlanmamış sayılır; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt sıkılaştırma üstbilgisi:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca denetlediğiniz HTTPS origin'leri için ayarlayın; bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çoklu instance yalıtımı

Tek bir host üzerinde benzersiz bağlantı noktaları ve durum dizinleriyle birden çok Gateway çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Kolaylık bayrakları: `--dev` (`~/.openclaw-dev` + bağlantı noktası `19001` kullanır), `--profile <name>` (`~/.openclaw-<name>` kullanır).

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

- `enabled`: Gateway dinleyicisinde TLS sonlandırmasını (HTTPS/WSS) etkinleştirir (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel kendinden imzalı bir sertifika/anahtar çifti otomatik oluşturur; yalnızca yerel/geliştirme kullanımı için.
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

- `mode`: yapılandırma düzenlemelerinin çalışma zamanında nasıl uygulandığını denetler.
  - `"off"`: canlı düzenlemeleri yoksay; değişiklikler açık bir yeniden başlatma gerektirir.
  - `"restart"`: yapılandırma değişikliğinde Gateway işlemini her zaman yeniden başlat.
  - `"hot"`: değişiklikleri yeniden başlatmadan işlem içinde uygula.
  - `"hybrid"` (varsayılan): önce hot reload dene; gerekirse yeniden başlatmaya geri dön.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tam sayı).
- `deferralTimeoutMs`: yeniden başlatmayı veya kanal hot reload'unu zorlamadan önce uçuşta olan işlemleri beklemek için ms cinsinden isteğe bağlı en uzun süre. Varsayılan sınırlı beklemeyi (`300000`) kullanmak için bunu atlayın; süresiz beklemek ve dönemsel hâlâ-beklemede uyarıları günlüğe yazmak için `0` ayarlayın.

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
Sorgu dizisi hook token'ları reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, `gateway.auth.token` değerinden **farklı** olmalıdır; Gateway token'ının yeniden kullanılması reddedilir.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini sınırlandırın (örneğin `["hook:"]`).
- Bir eşleme veya hazır ayar, şablonlu bir `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` ve `hooks.allowRequestSessionKey=true` değerlerini ayarlayın. Statik eşleme anahtarları bu katılımı gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükündeki `sessionKey` yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` üzerinden çözümlenir
  - Şablonla işlenen eşleme `sessionKey` değerleri dışarıdan sağlanmış kabul edilir ve ayrıca `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Eşleme ayrıntıları">

- `match.path`, `/hooks` sonrasındaki alt yolla eşleşir (örn. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanıyla eşleşir.
- `{{messages[0].subject}}` gibi şablonlar yükten okur.
- `transform`, bir hook eylemi döndüren bir JS/TS modülünü gösterebilir.
  - `transform.module` göreli bir yol olmalı ve `hooks.transformsDir` içinde kalmalıdır (mutlak yollar ve dizin dışına geçiş reddedilir).
  - `hooks.transformsDir` değerini `~/.openclaw/hooks/transforms` altında tutun; çalışma alanı Skills dizinleri reddedilir. `openclaw doctor` bu yolu geçersiz olarak bildirirse dönüştürme modülünü hooks dönüştürme dizinine taşıyın veya `hooks.transformsDir` değerini kaldırın.
- `agentId`, belirli bir ajana yönlendirir; bilinmeyen kimlikler varsayılana geri döner.
- `allowedAgentIds`: açık yönlendirmeyi sınırlar (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan yapılan hook ajan çalıştırmaları için isteğe bağlı sabit oturum anahtarıdır.
- `allowRequestSessionKey`: `/hooks/agent` çağıranlarının ve şablon odaklı eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin verin (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri için isteğe bağlı ön ek izin listesi (istek + eşleme), örn. `["hook:"]`. Herhangi bir eşleme veya hazır ayar şablonlu bir `sessionKey` kullandığında zorunlu olur.
- `deliver: true`, son yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` olur.
- `model`, bu hook çalıştırması için LLM'yi geçersiz kılar (model kataloğu ayarlanmışsa izin verilmiş olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail hazır ayarı `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- Bu ileti başına yönlendirmeyi korursanız `hooks.allowRequestSessionKey: true` ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanıyla eşleşecek şekilde sınırlandırın, örneğin `["hook:", "hook:gmail:"]`.
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

- Gateway, yapılandırıldığında açılışta `gog gmail watch serve` komutunu otomatik başlatır. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.
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
- local loopback dışı bağlamalar: canvas rotaları, diğer Gateway HTTP yüzeyleriyle aynı şekilde Gateway kimlik doğrulaması (token/parola/güvenilir proxy) gerektirir.
- Node WebView'leri genellikle kimlik doğrulama üst bilgileri göndermez; bir Node eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için Node kapsamlı yetenek URL'lerini duyurur.
- Yetenek URL'leri etkin Node WS oturumuna bağlıdır ve hızla sona erer. IP tabanlı geri dönüş kullanılmaz.
- Sunulan HTML'ye canlı yeniden yükleme istemcisini enjekte eder.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- Ayrıca A2UI'yi `/__openclaw__/a2ui/` konumunda sunar.
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

- `minimal` (yerleşik `bonjour` Plugin'i etkin olduğunda varsayılan): TXT kayıtlarından `cliPath` + `sshPort` değerlerini çıkarır.
- `full`: `cliPath` + `sshPort` değerlerini dahil eder; LAN çok noktaya yayın reklamı yine de yerleşik `bonjour` Plugin'inin etkin olmasını gerektirir.
- `off`: Plugin etkinleştirmesini değiştirmeden LAN çok noktaya yayın reklamını bastırır.
- Yerleşik `bonjour` Plugin'i macOS ana makinelerinde otomatik başlar; Linux, Windows ve kapsayıcılaştırılmış Gateway dağıtımlarında isteğe bağlıdır.
- Ana makine adı, geçerli bir DNS etiketi olduğunda varsayılan olarak sistem ana makine adıdır; aksi durumda `openclaw` değerine geri döner. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

### Geniş alan (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` altında tek noktaya yayın DNS-SD bölgesi yazar. Ağlar arası keşif için bir DNS sunucusuyla (CoreDNS önerilir) + Tailscale bölünmüş DNS ile eşleştirin.

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
- Tam öncelik sırası için bkz. [Ortam](/tr/help/environment).

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
- Eksik/boş değişkenler yapılandırma yüklenirken hata verir.
- Değişmez `${VAR}` için `$${VAR}` ile kaçış yapın.
- `$include` ile çalışır.

---

## Sırlar

Gizli başvuruları eklemelidir: düz metin değerler çalışmaya devam eder.

### `SecretRef`

Tek bir nesne biçimi kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Doğrulama:

- `provider` deseni: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id deseni: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: mutlak JSON işaretçisi (örneğin `"/providers/openai/apiKey"`)
- `source: "exec"` id deseni: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` id’leri, eğik çizgiyle ayrılmış `.` veya `..` yol segmentleri içermemelidir (örneğin `a/../b` reddedilir)

### Desteklenen kimlik bilgisi yüzeyi

- Standart matris: [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)
- `secrets apply`, desteklenen `openclaw.json` kimlik bilgisi yollarını hedefler.
- `auth-profiles.json` başvuruları çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.

### Gizli sağlayıcı yapılandırması

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

- `file` sağlayıcısı `mode: "json"` ve `mode: "singleValue"` destekler (`singleValue` modunda `id`, `"value"` olmalıdır).
- Windows ACL doğrulaması kullanılamadığında dosya ve exec sağlayıcı yolları kapalı hata verir. `allowInsecurePath: true` değerini yalnızca doğrulanamayan güvenilir yollar için ayarlayın.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yüklerini kullanır.
- Varsayılan olarak sembolik bağlantı komut yolları reddedilir. Çözümlenen hedef yolu doğrularken sembolik bağlantı yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın.
- `trustedDirs` yapılandırılmışsa güvenilir dizin denetimi çözümlenen hedef yola uygulanır.
- `exec` alt ortamı varsayılan olarak en az düzeydedir; gerekli değişkenleri `passEnv` ile açıkça geçirin.
- Gizli başvuruları etkinleştirme zamanında bellek içi bir anlık görüntüye çözümlenir, ardından istek yolları yalnızca anlık görüntüyü okur.
- Etkin yüzey filtrelemesi etkinleştirme sırasında uygulanır: etkin yüzeylerdeki çözümlenmemiş başvurular başlatmayı/yeniden yüklemeyi başarısız kılar, etkin olmayan yüzeyler ise tanılamalarla atlanır.

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
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyinde başvuruları (`api_key` için `keyRef`, `token` için `tokenRef`) destekler.
- `{ "provider": { "apiKey": "..." } }` gibi eski düz `auth-profiles.json` eşlemeleri bir çalışma zamanı biçimi değildir; `openclaw doctor --fix` bunları `.legacy-flat.*.bak` yedeğiyle standart `provider:default` API anahtarı profillerine yeniden yazar.
- OAuth modu profilleri (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli auth-profile kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri bellek içi çözümlenmiş anlık görüntülerden gelir; eski statik `auth.json` girdileri keşfedildiğinde temizlenir.
- Eski OAuth içe aktarmaları `~/.openclaw/credentials/oauth.json` konumundan yapılır.
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

- `billingBackoffHours`: bir profil gerçek faturalandırma/yetersiz kredi hataları nedeniyle başarısız olduğunda saat cinsinden temel geri çekilme (varsayılan: `5`). Açık faturalandırma metni, `401`/`403` yanıtlarında bile hâlâ buraya düşebilir, ancak sağlayıcıya özgü metin eşleştiricileri bunlara sahip olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya kuruluş/çalışma alanı harcama sınırı iletileri bunun yerine `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalandırma geri çekilme saatleri için sağlayıcı başına isteğe bağlı geçersiz kılmalar.
- `billingMaxHours`: faturalandırma geri çekilmesinin üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenli `auth_permanent` başarısızlıkları için dakika cinsinden temel geri çekilme (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan saat cinsinden kayan pencere (varsayılan: `24`).
- `overloadedProfileRotations`: model yedeğine geçmeden önce aşırı yük hataları için aynı sağlayıcıdaki maksimum kimlik doğrulama profili rotasyonları (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı meşgul biçimleri buraya düşer.
- `overloadedBackoffMs`: aşırı yüklenmiş bir sağlayıcı/profil rotasyonunu yeniden denemeden önceki sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model yedeğine geçmeden önce hız sınırı hataları için aynı sağlayıcıdaki maksimum kimlik doğrulama profili rotasyonları (varsayılan: `1`). Bu hız sınırı kovası `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

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
- Kararlı bir yol için `logging.file` ayarını belirleyin.
- `--verbose` kullanıldığında `consoleLevel` `debug` değerine yükselir.
- `maxFileBytes`: döndürmeden önce etkin günlük dosyasının bayt cinsinden maksimum boyutu (pozitif tamsayı; varsayılan: `104857600` = 100 MB). OpenClaw, etkin dosyanın yanında en fazla beş numaralı arşiv tutar.
- `redactSensitive` / `redactPatterns`: konsol çıktısı, dosya günlükleri, OTLP günlük kayıtları ve kalıcı oturum transkripti metni için en iyi çabayla maskeleme. `redactSensitive: "off"` yalnızca bu genel günlük/transkript ilkesini devre dışı bırakır; UI/araç/tanı güvenliği yüzeyleri yayımlamadan önce gizli bilgileri hâlâ redakte eder.

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

- `enabled`: enstrümantasyon çıktısı için ana geçiş anahtarı (varsayılan: `true`).
- `flags`: hedefli günlük çıktısını etkinleştiren bayrak dizeleri dizisi (`"telegram.*"` veya `"*"` gibi joker karakterleri destekler).
- `stuckSessionWarnMs`: uzun süren işleme oturumlarını `session.long_running`, `session.stalled` veya `session.stuck` olarak sınıflandırmak için ms cinsinden ilerleme yok yaşı eşiği. Yanıt, araç, durum, blok ve ACP ilerlemesi zamanlayıcıyı sıfırlar; yinelenen `session.stuck` tanılamaları değişiklik olmadığında geri çekilir.
- `stuckSessionAbortMs`: uygun durumda takılmış etkin işin kurtarma için abort-drain işlemine alınmasından önce ms cinsinden ilerleme yok yaşı eşiği. Ayarlanmadığında OpenClaw, en az 10 dakika ve `stuckSessionWarnMs` değerinin 5 katı olan daha güvenli genişletilmiş gömülü çalıştırma penceresini kullanır.
- `otel.enabled`: OpenTelemetry dışa aktarma hattını etkinleştirir (varsayılan: `false`). Tam yapılandırma, sinyal kataloğu ve gizlilik modeli için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).
- `otel.endpoint`: OTel dışa aktarma için toplayıcı URL'si.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: isteğe bağlı sinyale özgü OTLP uç noktaları. Ayarlandığında yalnızca o sinyal için `otel.endpoint` değerini geçersiz kılar.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC meta veri başlıkları.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarımını etkinleştirir.
- `otel.sampleRate`: iz örnekleme oranı `0`-`1`.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri boşaltma aralığı.
- `otel.captureContent`: OTEL span öznitelikleri için isteğe bağlı ham içerik yakalama. Varsayılan olarak kapalıdır. Boolean `true`, sistem dışı ileti/araç içeriğini yakalar; nesne biçimi `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` ve `systemPrompt` değerlerini açıkça etkinleştirmenize olanak tanır.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: en yeni deneysel GenAI span sağlayıcı öznitelikleri için ortam geçiş anahtarı. Varsayılan olarak span'ler uyumluluk için eski `gen_ai.system` özniteliğini korur; GenAI metrikleri sınırlı semantik öznitelikler kullanır.
- `OPENCLAW_OTEL_PRELOADED=1`: zaten global bir OpenTelemetry SDK kaydetmiş ana makineler için ortam geçiş anahtarı. OpenClaw bu durumda tanılama dinleyicilerini etkin tutarken Plugin'e ait SDK başlatma/kapatma işlemini atlar.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` ve `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: eşleşen yapılandırma anahtarı ayarlanmamışsa kullanılan sinyale özgü uç nokta ortam değişkenleri.
- `cacheTrace.enabled`: gömülü çalıştırmalar için önbellek izi anlık görüntülerini günlüğe kaydet (varsayılan: `false`).
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
- `auto.stableDelayHours`: stable kanalı otomatik uygulamasından önce saat cinsinden minimum gecikme (varsayılan: `6`; maks: `168`).
- `auto.stableJitterHours`: saat cinsinden ek stable kanalı yayılım penceresi (varsayılan: `12`; maks: `168`).
- `auto.betaCheckIntervalHours`: beta kanalı denetimlerinin saat cinsinden çalışma sıklığı (varsayılan: `1`; maks: `24`).

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

- `enabled`: global ACP özellik kapısı (varsayılan: `true`; ACP dispatch ve spawn olanaklarını gizlemek için `false` olarak ayarlayın).
- `dispatch.enabled`: ACP oturum turu dispatch işlemi için bağımsız kapı (varsayılan: `true`). ACP komutlarını kullanılabilir tutarken yürütmeyi engellemek için `false` olarak ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı arka uç kimliği (kayıtlı bir ACP çalışma zamanı Plugin'iyle eşleşmelidir).
  Önce arka uç Plugin'ini kurun ve `plugins.allow` ayarlanmışsa arka uç Plugin kimliğini dahil edin (örneğin `acpx`); aksi halde ACP arka ucu yüklenmez.
- `defaultAgent`: spawn işlemleri açık bir hedef belirtmediğinde yedek ACP hedef agent kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen agent kimliklerinin izin listesi; boş olması ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: aynı anda etkin olabilecek maksimum ACP oturumu sayısı.
- `stream.coalesceIdleMs`: akışlı metin için ms cinsinden boşta flush penceresi.
- `stream.maxChunkChars`: akışlı blok projeksiyonunu bölmeden önceki maksimum parça boyutu.
- `stream.repeatSuppression`: tur başına yinelenen durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı olarak akış yapar; `"final_only"` tur sonlandırıcı olaylarına kadar arabelleğe alır.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önceki ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP turu başına projelendirilen maksimum asistan çıktı karakteri.
- `stream.maxSessionUpdateChars`: projelendirilen ACP durum/güncelleme satırları için maksimum karakter sayısı.
- `stream.tagVisibility`: akışlı olaylar için etiket adlarından boolean görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum worker'ları için uygun temizlemeden önce dakika cinsinden boşta TTL.
- `runtime.installCommand`: bir ACP çalışma zamanı ortamını bootstrap ederken çalıştırılacak isteğe bağlı kurulum komutu.

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
  - `"random"` (varsayılan): dönen komik/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yok (banner başlığı/sürümü yine gösterilir).
- Tüm banner'ı gizlemek için (yalnızca sloganları değil), `OPENCLAW_HIDE_BANNER=1` ortamını ayarlayın.

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

[Agent varsayılanları](/tr/gateway/config-agents#agent-defaults) altında `agents.list` kimlik alanlarına bakın.

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

- `sessionRetention`: tamamlanmış izole cron çalıştırma oturumlarının `sessions.json` dosyasından budanmadan önce ne kadar süre tutulacağını belirler. Ayrıca arşivlenmiş silinmiş cron dökümlerinin temizlenmesini de denetler. Varsayılan: `24h`; devre dışı bırakmak için `false` olarak ayarlayın.
- `runLog.maxBytes`: budama yapılmadan önce çalıştırma günlüğü dosyası (`cron/runs/<jobId>.jsonl`) başına maksimum boyut. Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: çalıştırma günlüğü budaması tetiklendiğinde korunan en yeni satırlar. Varsayılan: `2000`.
- `webhookToken`: cron Webhook POST teslimi (`delivery.mode = "webhook"`) için kullanılan bearer token; atlanırsa kimlik doğrulama üst bilgisi gönderilmez.
- `webhook`: yalnızca hâlâ `notify: true` içeren kayıtlı işler için kullanılan, kullanımdan kaldırılmış eski yedek Webhook URL’si (http/https).

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

- `maxAttempts`: geçici hatalarda tek seferlik işler için maksimum yeniden deneme sayısı (varsayılan: `3`; aralık: `0`-`10`).
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
- `cooldownMs`: aynı iş için yinelenen uyarılar arasındaki minimum milisaniye (negatif olmayan tam sayı).
- `includeSkipped`: ardışık atlanan çalıştırmaları uyarı eşiğine dahil eder (varsayılan: `false`). Atlanan çalıştırmalar ayrı izlenir ve yürütme hatası geri çekilmesini etkilemez.
- `mode`: teslim modu - `"announce"` bir kanal iletisiyle gönderir; `"webhook"` yapılandırılmış Webhook’a gönderi yapar.
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
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi olduğunda varsayılan `"announce"` olur.
- `channel`: duyuru teslimi için kanal geçersiz kılması. `"last"` bilinen son teslim kanalını yeniden kullanır.
- `to`: açık duyuru hedefi veya Webhook URL’si. Webhook modu için gereklidir.
- `accountId`: teslim için isteğe bağlı hesap geçersiz kılması.
- İş başına `delivery.failureDestination`, bu genel varsayılanı geçersiz kılar.
- Genel veya iş başına hata hedefi ayarlanmadığında, zaten `announce` üzerinden teslim yapan işler hata durumunda o birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, işin birincil `delivery.mode` değeri `"webhook"` olmadığı sürece yalnızca `sessionTarget="isolated"` işleri için desteklenir.

Bkz. [Cron İşleri](/tr/automation/cron-jobs). İzole cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya modeli şablon değişkenleri

`tools.media.models[].args` içinde genişletilen şablon yer tutucuları:

| Değişken           | Açıklama                                           |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Tam gelen ileti gövdesi                            |
| `{{RawBody}}`      | Ham gövde (geçmiş/gönderen sarmalayıcıları olmadan) |
| `{{BodyStripped}}` | Grup bahsetmeleri çıkarılmış gövde                 |
| `{{From}}`         | Gönderen tanımlayıcısı                             |
| `{{To}}`           | Hedef tanımlayıcısı                                |
| `{{MessageSid}}`   | Kanal ileti kimliği                                |
| `{{SessionId}}`    | Geçerli oturum UUID’si                             |
| `{{IsNewSession}}` | Yeni oturum oluşturulduğunda `"true"`              |
| `{{MediaUrl}}`     | Gelen medya sözde URL’si                           |
| `{{MediaPath}}`    | Yerel medya yolu                                   |
| `{{MediaType}}`    | Medya türü (görüntü/ses/belge/…)                   |
| `{{Transcript}}`   | Ses dökümü                                         |
| `{{Prompt}}`       | CLI girişleri için çözümlenmiş medya istemi        |
| `{{MaxChars}}`     | CLI girişleri için çözümlenmiş maksimum çıktı karakterleri |
| `{{ChatType}}`     | `"direct"` veya `"group"`                          |
| `{{GroupSubject}}` | Grup konusu (en iyi çaba)                          |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (en iyi çaba)              |
| `{{SenderName}}`   | Gönderen görünen adı (en iyi çaba)                 |
| `{{SenderE164}}`   | Gönderen telefon numarası (en iyi çaba)            |
| `{{Provider}}`     | Sağlayıcı ipucu (whatsapp, telegram, discord vb.)  |

---

## Yapılandırma dahil etmeleri (`$include`)

Yapılandırmayı birden çok dosyaya ayırın:

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
- Yollar: dahil eden dosyaya göre çözümlenir, ancak en üst düzey yapılandırma dizini (`openclaw.json` dosyasının `dirname` değeri) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca hâlâ bu sınır içinde çözümlendiklerinde izin verilir.
- OpenClaw’a ait olup tek dosyalı dahil etmeyle desteklenen yalnızca bir en üst düzey bölümü değiştiren yazmalar, o dahil edilen dosyaya yazılır. Örneğin, `plugins install`, `plugins.json5` içindeki `plugins: { $include: "./plugins.json5" }` değerini günceller ve `openclaw.json` dosyasını olduğu gibi bırakır.
- Kök dahil etmeler, dahil etme dizileri ve kardeş geçersiz kılmaları olan dahil etmeler, OpenClaw’a ait yazmalar için salt okunurdur; bu yazmalar yapılandırmayı düzleştirmek yerine kapalı şekilde başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları ve döngüsel dahil etmeler için açık iletiler.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
