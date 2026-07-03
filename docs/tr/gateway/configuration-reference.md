---
read_when:
    - Alan düzeyindeki yapılandırma semantiğine veya varsayılan değerlere tam olarak ihtiyacınız var
    - Kanal, model, gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Temel OpenClaw anahtarları, varsayılanları ve ayrılmış alt sistem referanslarına bağlantılar için Gateway yapılandırma referansı
title: Yapılandırma referansı
x-i18n:
    generated_at: "2026-07-03T23:41:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1365e40b17122e9a029e294baf12db2dd974b3c2686ed1f2e9cf2a46757fa356
    source_path: gateway/configuration-reference.md
    workflow: 16
---

OpenClaw temel yapılandırma başvurusu: `~/.openclaw/openclaw.json`. Görev odaklı bir genel bakış için bkz. [Yapılandırma](/tr/gateway/configuration).

Ana OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendi daha derin başvurusu olduğunda bağlantı verir. Kanal ve Plugin sahipli komut katalogları ile derin bellek/QMD ayarları bu sayfa yerine kendi sayfalarında yer alır.

Kod gerçeği:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema'yı yazdırır; mevcut olduğunda paketle gelen/Plugin/kanal meta verileri birleştirilir
- `config.schema.lookup`, ayrıntıya inen araçlar için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, yapılandırma belgeleri temel hash'ini geçerli şema yüzeyine göre doğrular

Ajan arama yolu: düzenlemelerden önce kesin alan düzeyi belgeleri ve kısıtlar için `gateway` araç eylemi `config.schema.lookup` kullanın. Görev odaklı rehberlik için [Yapılandırma](/tr/gateway/configuration), daha geniş alan haritası, varsayılanlar ve alt sistem başvurularına bağlantılar için bu sayfayı kullanın.

Ayrılmış derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki dreaming yapılandırması için [Bellek yapılandırması başvurusu](/tr/reference/memory-config)
- Geçerli yerleşik + paketle gelen komut kataloğu için [Slash komutları](/tr/tools/slash-commands)
- Kanala özel komut yüzeyleri için sahip kanal/Plugin sayfaları

Yapılandırma biçimi **JSON5**'tir (yorumlara + sondaki virgüllere izin verilir). Tüm alanlar isteğe bağlıdır - OpenClaw atlandıklarında güvenli varsayılanları kullanır.

---

## Kanallar

Kanal başına yapılandırma anahtarları ayrılmış bir sayfaya taşındı - Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve diğer paketle gelen kanallar (kimlik doğrulama, erişim denetimi, çoklu hesap, bahsetme kapısı) dahil `channels.*` için bkz. [Yapılandırma - kanallar](/tr/gateway/config-channels).

## Ajan varsayılanları, çoklu ajan, oturumlar ve iletiler

Ayrılmış bir sayfaya taşındı - şunlar için bkz. [Yapılandırma - ajanlar](/tr/gateway/config-agents):

- `agents.defaults.*` (çalışma alanı, model, düşünme, Heartbeat, bellek, medya, Skills, sandbox)
- `multiAgent.*` (çoklu ajan yönlendirmesi ve bağlamaları)
- `session.*` (oturum yaşam döngüsü, Compaction, budama)
- `messages.*` (ileti teslimi, TTS, markdown işleme)
- `talk.*` (Talk modu)
  - `talk.consultThinkingLevel`: Control UI Talk gerçek zamanlı danışmalarının arkasındaki tam OpenClaw ajan çalıştırması için düşünme düzeyi geçersiz kılması
  - `talk.consultFastMode`: Control UI Talk gerçek zamanlı danışmaları için tek seferlik hızlı mod geçersiz kılması
  - `talk.speechLocale`: iOS/macOS üzerinde Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği
  - `talk.silenceTimeoutMs`: ayarlanmadığında Talk, dökümü göndermeden önce platformun varsayılan duraklama penceresini korur (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: `openclaw_agent_consult` öğesini atlayan kesinleşmiş gerçek zamanlı Talk dökümleri için Gateway aktarma geri dönüşü

## Araçlar ve özel sağlayıcılar

Araç politikası, deneysel anahtarlar, sağlayıcı destekli araç yapılandırması ve özel sağlayıcı / temel URL kurulumu ayrılmış bir sayfaya taşındı - bkz. [Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## Modeller

Sağlayıcı tanımları, model izin listeleri ve özel sağlayıcı kurulumu [Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) içinde yer alır. `models` kökü ayrıca global model kataloğu davranışına sahiptir.

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
- `models.providers.*.localService`: yerel model sunucuları için isteğe bağlı isteğe bağlı süreç yöneticisi. OpenClaw yapılandırılmış sağlık uç noktasını yoklar, gerektiğinde mutlak `command` öğesini başlatır, hazır olmayı bekler ve ardından model isteğini gönderir. Bkz. [Yerel model hizmetleri](/tr/gateway/local-model-services).
- `models.pricing.enabled`: sidecar'lar ve kanallar Gateway hazır yoluna ulaştıktan sonra başlayan arka plan fiyatlandırma önyüklemesini denetler. `false` olduğunda Gateway, OpenRouter ve LiteLLM fiyatlandırma kataloğu getirmelerini atlar; yapılandırılmış `models.providers.*.models[].cost` değerleri yerel maliyet tahminleri için çalışmaya devam eder.

## MCP

OpenClaw tarafından yönetilen MCP sunucu tanımları `mcp.servers` altında yer alır ve gömülü OpenClaw ile diğer çalışma zamanı bağdaştırıcıları tarafından tüketilir. `openclaw mcp list`, `show`, `set` ve `unset` komutları, yapılandırma düzenlemeleri sırasında hedef sunucuya bağlanmadan bu bloğu yönetir.

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
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: yapılandırılmış MCP araçlarını açığa çıkaran çalışma zamanları için adlandırılmış stdio veya uzak MCP sunucu tanımları. Uzak girdiler `transport: "streamable-http"` veya `transport: "sse"` kullanır; `type: "http"`, `openclaw mcp set` ve `openclaw doctor --fix` tarafından kanonik `transport` alanına normalleştirilen CLI'ye özgü bir diğer addır.
- `mcp.servers.<name>.enabled`: kaydedilmiş bir sunucu tanımını korurken onu gömülü OpenClaw MCP keşfi ve araç projeksiyonundan hariç tutmak için `false` ayarlayın.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: sunucu başına MCP istek zaman aşımı, saniye veya milisaniye cinsinden.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: sunucu başına bağlantı zaman aşımı, saniye veya milisaniye cinsinden.
- `mcp.servers.<name>.supportsParallelToolCalls`: paralel MCP araç çağrıları yapıp yapmamayı seçebilen bağdaştırıcılar için isteğe bağlı eşzamanlılık ipucu.
- `mcp.servers.<name>.auth`: OAuth gerektiren HTTP MCP sunucuları için `"oauth"` ayarlayın. Jetonları OpenClaw durumu altında saklamak için `openclaw mcp login <name>` çalıştırın.
- `mcp.servers.<name>.oauth`: isteğe bağlı OAuth kapsamı, yönlendirme URL'si ve istemci meta veri URL'si geçersiz kılmaları.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: özel uç noktalar ve karşılıklı TLS için HTTP TLS denetimleri.
- `mcp.servers.<name>.toolFilter`: isteğe bağlı sunucu başına araç seçimi. `include`, keşfedilen MCP araçlarını eşleşen adlarla sınırlar; `exclude`, eşleşen adları gizler. Girdiler tam MCP araç adları veya basit `*` glob'larıdır. Kaynakları veya istemleri olan sunucular ayrıca yardımcı araç adları (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) üretir ve bu adlar aynı filtreyi kullanır.
- `mcp.servers.<name>.codex`: isteğe bağlı Codex uygulama sunucusu projeksiyon denetimleri. Bu blok yalnızca Codex uygulama sunucusu iş parçacıkları için OpenClaw meta verisidir; ACP oturumlarını, genel Codex harness yapılandırmasını veya diğer çalışma zamanı bağdaştırıcılarını etkilemez. Boş olmayan `codex.agents`, sunucuyu listelenen OpenClaw ajan kimlikleriyle sınırlar. Boş, boşluklardan oluşan veya geçersiz kapsamlı ajan listeleri yapılandırma doğrulaması tarafından reddedilir ve global olmak yerine çalışma zamanı projeksiyon yolu tarafından atlanır. `codex.defaultToolsApprovalMode`, o sunucu için Codex'in yerel `default_tools_approval_mode` değerini yayar. OpenClaw, yerel `mcp_servers` yapılandırmasını Codex'e geçirmeden önce `codex` bloğunu çıkarır. Sunucuyu Codex'in varsayılan MCP onay davranışıyla her Codex uygulama sunucusu ajanı için projekte edilmiş tutmak üzere bloğu atlayın.
- `mcp.sessionIdleTtlMs`: oturum kapsamlı paketle gelen MCP çalışma zamanları için boşta TTL. Tek seferlik gömülü çalıştırmalar, çalıştırma sonu temizliği ister; bu TTL uzun ömürlü oturumlar ve gelecekteki çağıranlar için güvenlik ağıdır.
- `mcp.*` altındaki değişiklikler, önbelleğe alınmış oturum MCP çalışma zamanlarını elden çıkararak sıcak uygulanır. Sonraki araç keşfi/kullanımı bunları yeni yapılandırmadan yeniden oluşturur; böylece kaldırılan `mcp.servers` girdileri boşta TTL beklenmeden hemen temizlenir.
- Çalışma zamanı keşfi ayrıca o oturum için önbelleğe alınmış kataloğu düşürerek MCP araç listesi değişiklik bildirimlerine uyar. Kaynakları veya istemleri duyuran sunucular; kaynakları listeleme/okuma ve istemleri listeleme/getirme için yardımcı araçlar alır. Yinelenen araç çağrısı hataları, başka bir çağrı denenmeden önce etkilenen sunucuyu kısa süreliğine duraklatır.

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
    workshop: {
      allowSymlinkTargetWrites: false,
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
- `load.extraDirs`: ek paylaşılan skill kökleri (en düşük öncelik).
- `load.allowSymlinkTargets`: bağlantı yapılandırılmış kaynak kökünün dışında yer aldığında skill sembolik bağlantılarının çözümlenebileceği güvenilir gerçek hedef kökler.
- `workshop.allowSymlinkTargetWrites`: Skill Workshop uygulamasının zaten güvenilir sembolik bağlantı hedefleri üzerinden yazmasına izin verir (varsayılan: false).
- `install.preferBrew`: true olduğunda, `brew` mevcutsa diğer yükleyici türlerine geri düşmeden önce Homebrew yükleyicilerini tercih eder.
- `install.nodeManager`: `metadata.openclaw.install` belirtimleri için node yükleyici tercihi (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: güvenilir `operator.admin` Gateway istemcilerinin `skills.upload.*` üzerinden hazırlanmış özel zip arşivlerini yüklemesine izin ver (varsayılan: false). Bu yalnızca yüklenen arşiv yolunu etkinleştirir; normal ClawHub yüklemeleri bunu gerektirmez.
- `entries.<skillKey>.enabled: false`, paketle gelmiş/yüklenmiş olsa bile bir skill'i devre dışı bırakır.
- `entries.<skillKey>.apiKey`: birincil env var bildiren Skills için kolaylık (düz metin dizesi veya SecretRef nesnesi).

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

- `~/.openclaw/extensions` ve `<workspace>/.openclaw/extensions` altındaki paket veya bundle dizinlerinden, ayrıca `plugins.load.paths` içinde listelenen dosya ya da dizinlerden yüklenir.
- Bağımsız Plugin dosyalarını `plugins.load.paths` içine koyun; otomatik keşfedilen extension kökleri, bu köklerdeki yardımcı betiklerin başlatmayı engellememesi için üst düzey `.js`, `.mjs` ve `.ts` dosyalarını yok sayar.
- Keşif, yerel OpenClaw Plugin'lerini ve uyumlu Codex bundle'ları ile Claude bundle'larını, manifest içermeyen Claude varsayılan düzen bundle'ları dahil kabul eder.
- **Yapılandırma değişiklikleri gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen Plugin'ler yüklenir). `deny` üstün gelir.
- `plugins.entries.<id>.apiKey`: Plugin düzeyinde API anahtarı kolaylık alanı (Plugin tarafından desteklendiğinde).
- `plugins.entries.<id>.env`: Plugin kapsamlı env var haritası.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda core, `before_prompt_build` öğesini engeller ve eski `before_agent_start` içinden prompt'u değiştiren alanları yok sayarken eski `modelOverride` ve `providerOverride` değerlerini korur. Yerel Plugin hook'ları ve desteklenen bundle tarafından sağlanan hook dizinleri için geçerlidir.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` olduğunda, güvenilen ve bundle olmayan Plugin'ler `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` ve `agent_end` gibi tiplendirilmiş hook'lardan ham konuşma içeriğini okuyabilir.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu Plugin'e arka plan subagent çalıştırmaları için çalışma başına `provider` ve `model` geçersiz kılmaları istemesi konusunda açıkça güven.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilen subagent geçersiz kılmaları için kanonik `provider/model` hedeflerinin isteğe bağlı izin listesi. `"*"` değerini yalnızca bilerek herhangi bir modele izin vermek istediğinizde kullanın.
- `plugins.entries.<id>.llm.allowModelOverride`: bu Plugin'e `api.runtime.llm.complete` için model geçersiz kılmaları istemesi konusunda açıkça güven.
- `plugins.entries.<id>.llm.allowedModels`: güvenilen Plugin LLM tamamlama geçersiz kılmaları için kanonik `provider/model` hedeflerinin isteğe bağlı izin listesi. `"*"` değerini yalnızca bilerek herhangi bir modele izin vermek istediğinizde kullanın.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: bu Plugin'e `api.runtime.llm.complete` işlemini varsayılan olmayan bir agent id ile çalıştırması konusunda açıkça güven.
- `plugins.entries.<id>.config`: Plugin tarafından tanımlanan yapılandırma nesnesi (mevcut olduğunda yerel OpenClaw Plugin şeması tarafından doğrulanır).
- Channel Plugin hesap/çalışma zamanı ayarları `channels.<id>` altında bulunur ve merkezi bir OpenClaw seçenek kayıt defteriyle değil, sahibi olan Plugin'in manifest `channelConfigs` metadata'sı ile açıklanmalıdır.

### Codex harness Plugin yapılandırması

Bundle olarak gelen `codex` Plugin'i, yerel Codex app-server harness ayarlarının sahibidir ve bunlar
`plugins.entries.codex.config` altında bulunur. Tam yapılandırma
yüzeyi için [Codex harness başvurusu](/tr/plugins/codex-harness-reference) ve çalışma zamanı modeli için [Codex harness](/tr/plugins/codex-harness) sayfasına bakın.

`codexPlugins` yalnızca yerel Codex harness'ı seçen oturumlara uygulanır.
OpenClaw provider çalıştırmaları, ACP konuşma bağlamaları veya Codex dışı herhangi bir harness için Codex Plugin'lerini etkinleştirmez.

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
  Plugin/uygulama desteğini etkinleştirir. Varsayılan: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  taşınan Plugin uygulama istemleri için varsayılan yıkıcı eylem ilkesi.
  Güvenli Codex onay şemalarını sormadan kabul etmek için `true`, reddetmek için `false`,
  Codex tarafından gerekli onayları OpenClaw Plugin onayları üzerinden yönlendirmek için `"auto"` veya kalıcı onay olmadan her Plugin yazma/yıkıcı
  eylemi için sormak üzere `"ask"` kullanın. `"ask"` modu, etkilenen uygulama için kalıcı Codex
  araç başına onay geçersiz kılmalarını temizler ve Codex thread'i başlamadan önce bu uygulama için insan
  onay reviewer'ını seçer.
  Varsayılan: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: global `codexPlugins.enabled` da true olduğunda
  taşınmış bir Plugin girdisini etkinleştirir.
  Varsayılan: açık girdiler için `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  kararlı marketplace kimliği. V1 yalnızca `"openai-curated"` destekler.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: migration'dan gelen kararlı
  Codex Plugin kimliği, örneğin `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  Plugin başına yıkıcı eylem geçersiz kılması. Atlandığında global
  `allow_destructive_actions` değeri kullanılır. Plugin başına değer aynı
  `true`, `false`, `"auto"` veya `"ask"` ilkelerini kabul eder.

`"ask"` kullanan her kabul edilmiş Plugin uygulaması, o uygulamanın onay isteklerini
insan reviewer'a yönlendirir. Diğer uygulamalar ve uygulama dışı thread onayları
yapılandırılmış reviewer'larını korur; böylece karma Plugin ilkeleri `"ask"` davranışını devralmaz.

`codexPlugins.enabled` global etkinleştirme yönergesidir. Migration tarafından yazılan açık Plugin
girdileri kalıcı kurulum ve onarım uygunluk kümesidir.
`plugins["*"]` desteklenmez, `install` anahtarı yoktur ve yerel
`marketplacePath` değerleri host'a özgü oldukları için bilerek yapılandırma alanları değildir.

`app/list` hazır olma denetimleri bir saat önbelleğe alınır ve eskidiklerinde
asenkron olarak yenilenir. Codex thread uygulama yapılandırması her turda değil, Codex harness
oturumu kurulurken hesaplanır; yerel Plugin yapılandırmasını değiştirdikten sonra `/new`, `/reset` veya gateway
yeniden başlatması kullanın.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider ayarları.
  - `apiKey`: Daha yüksek limitler için isteğe bağlı Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` env var değerine geri döner.
  - `baseUrl`: Firecrawl API temel URL'si (varsayılan: `https://api.firecrawl.dev`; self-hosted geçersiz kılmalar özel/dahili uç noktaları hedeflemelidir).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkarır (varsayılan: `true`).
  - `maxAgeMs`: milisaniye cinsinden maksimum önbellek yaşı (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: scrape isteği zaman aşımı, saniye cinsinden (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web araması) ayarları.
  - `enabled`: X Search provider'ını etkinleştirir.
  - `model`: arama için kullanılacak Grok modeli (örn. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: memory dreaming ayarları. Aşamalar ve eşikler için [Dreaming](/tr/concepts/dreaming) sayfasına bakın.
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam dreaming taraması için cron ritmi (varsayılan olarak `"0 3 * * *"`).
  - `model`: isteğe bağlı Dream Diary subagent model geçersiz kılması. `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir; hedefleri sınırlamak için `allowedModels` ile eşleştirin. Model-kullanılamaz hataları, oturum varsayılan modeliyle bir kez yeniden denenir; güven veya izin listesi hataları sessizce geri dönüş yapmaz.
  - aşama ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya dönük yapılandırma anahtarları değildir).
- Tam memory yapılandırması [Memory yapılandırma başvurusu](/tr/reference/memory-config) içinde bulunur:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude bundle Plugin'leri `settings.json` içinden gömülü OpenClaw varsayılanlarına da katkıda bulunabilir; OpenClaw bunları ham OpenClaw yapılandırma yamaları olarak değil, temizlenmiş agent ayarları olarak uygular.
- `plugins.slots.memory`: etkin memory Plugin id değerini seçin veya memory Plugin'lerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: etkin context engine Plugin id değerini seçin; başka bir engine kurup seçmediğiniz sürece varsayılan `"legacy"` olur.

[Plugins](/tr/tools/plugin) sayfasına bakın.

---

## Commitments

`commitments`, çıkarımsal takip memory'sini kontrol eder: OpenClaw konuşma turlarından check-in'leri algılayabilir ve bunları heartbeat çalıştırmaları üzerinden iletebilir.

- `commitments.enabled`: çıkarımsal takip commitments için gizli LLM çıkarımı, depolama ve heartbeat teslimini etkinleştirir. Varsayılan: `false`.
- `commitments.maxPerDay`: kayan bir günde agent oturumu başına teslim edilen maksimum çıkarımsal takip commitments sayısı. Varsayılan: `3`.

[Inferred commitments](/tr/concepts/commitments) sayfasına bakın.

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
- `tabCleanup`, boşta kalma süresinden sonra veya bir oturum sınırını aştığında izlenen birincil ajan sekmelerini geri kazanır. Bu ayrı temizleme modlarını devre dışı bırakmak için `idleMinutes: 0` veya `maxTabsPerSession: 0` ayarlayın.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ayarlanmamışsa devre dışıdır, bu nedenle tarayıcı gezinmesi varsayılan olarak katı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezinmesine bilerek güvendiğinizde ayarlayın.
- Katı modda, uzak CDP profil uç noktaları (`profiles.*.cdpUrl`) erişilebilirlik/keşif kontrolleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski bir takma ad olarak desteklenmeye devam eder.
- Katı modda, açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca eklenebilir yapıdadır (başlatma/durdurma/sıfırlama devre dışıdır).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw'un `/json/version` keşfetmesini istediğinizde HTTP(S) kullanın; sağlayıcınız size doğrudan DevTools WebSocket URL'si verdiğinde WS(S) kullanın.
- `remoteCdpTimeoutMs` ve `remoteCdpHandshakeTimeoutMs`, uzak ve `attachOnly` CDP erişilebilirliğine ve sekme açma isteklerine uygulanır. Yönetilen loopback profilleri yerel CDP varsayılanlarını korur.
- Harici olarak yönetilen bir CDP hizmetine loopback üzerinden erişilebiliyorsa, o profil için `attachOnly: true` ayarlayın; aksi takdirde OpenClaw loopback bağlantı noktasını yerel yönetilen bir tarayıcı profili olarak değerlendirir ve yerel bağlantı noktası sahipliği hataları bildirebilir.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve seçilen ana makineye ya da bağlı bir tarayıcı düğümü üzerinden eklenebilir.
- `existing-session` profilleri, Brave veya Edge gibi belirli bir Chromium tabanlı tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- Chrome zaten bir DevTools HTTP(S) keşif uç noktasının veya doğrudan WS(S) uç noktasının arkasında çalışıyorsa `existing-session` profilleri `cdpUrl` ayarlayabilir. Bu modda OpenClaw, otomatik bağlanmayı kullanmak yerine uç noktayı Chrome MCP'ye geçirir; Chrome MCP başlatma bağımsız değişkenleri için `userDataDir` yok sayılır.
- `existing-session` profilleri mevcut Chrome MCP rota sınırlarını korur: CSS seçici hedefleme yerine anlık görüntü/ref odaklı eylemler, tek dosya yükleme kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; `cdpUrl` değerini yalnızca uzak CDP profilleri veya existing-session uç noktası ekleme için açıkça ayarlayın.
- Yerel yönetilen profiller, o profil için global `browser.executablePath` değerini geçersiz kılmak üzere `executablePath` ayarlayabilir. Bunu bir profili Chrome'da, diğerini Brave'de çalıştırmak için kullanın.
- Yerel yönetilen profiller, işlem başladıktan sonra Chrome CDP HTTP keşfi için `browser.localLaunchTimeoutMs` ve başlatma sonrası CDP websocket hazır oluşu için `browser.localCdpReadyTimeoutMs` kullanır. Chrome'un başarıyla başladığı ancak hazır olma kontrollerinin başlangıçla yarıştığı daha yavaş ana makinelerde bunları artırın. Her iki değer de `120000` ms'ye kadar pozitif tamsayı olmalıdır; geçersiz yapılandırma değerleri reddedilir.
- Otomatik algılama sırası: Chromium tabanlıysa varsayılan tarayıcı → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` ve `browser.profiles.<name>.executablePath`, Chromium başlatılmadan önce işletim sistemi ana dizininiz için hem `~` hem de `~/...` kabul eder.
  `existing-session` profillerindeki profil başına `userDataDir` de tilde genişletmesine tabi tutulur.
- Denetim hizmeti: yalnızca loopback (bağlantı noktası `gateway.port` değerinden türetilir, varsayılan `18791`).
- `extraArgs`, yerel Chromium başlangıcına ek başlatma bayrakları ekler (örneğin `--disable-gpu`, pencere boyutlandırma veya hata ayıklama bayrakları).

---

## Arayüz

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

- `seamColor`: yerel uygulama UI çerçevesi için vurgu rengi (Talk Mode balon tonu vb.).
- `assistant`: Control UI kimliği geçersiz kılması. Etkin ajan kimliğine geri döner.

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
      url: "ws://127.0.0.1:18789",
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
      // Remove tools from the default HTTP deny list for owner/admin callers
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

- `mode`: `local` (Gateway'i çalıştır) veya `remote` (uzak Gateway'e bağlan). Gateway, `local` olmadığı sürece başlatmayı reddeder.
- `port`: WS + HTTP için tek çoklanmış port. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP'si) veya `custom`.
- **Eski bind takma adları**: `gateway.bind` içinde host takma adlarını (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind, konteyner içinde `127.0.0.1` üzerinde dinler. Docker bridge ağıyla (`-p 18789:18789`), trafik `eth0` üzerinden gelir; bu yüzden Gateway'e erişilemez. Tüm arayüzlerde dinlemek için `--network host` kullanın ya da `bind: "lan"` (veya `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Kimlik doğrulama**: varsayılan olarak zorunludur. Loopback olmayan bind'ler Gateway kimlik doğrulaması gerektirir. Pratikte bu, paylaşılan bir token/parola veya `gateway.auth.mode: "trusted-proxy"` ile kimlik duyarlı bir reverse proxy anlamına gelir. Onboarding sihirbazı varsayılan olarak bir token üretir.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. İkisi de yapılandırılmışken mod ayarlanmamışsa başlatma ve servis kurulum/onarım akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık no-auth modu. Yalnızca güvenilir local loopback kurulumları için kullanın; bu seçenek bilinçli olarak onboarding istemlerinde sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: tarayıcı/kullanıcı kimlik doğrulamasını kimlik duyarlı bir reverse proxy'ye devredin ve `gateway.trustedProxies` üzerinden gelen kimlik başlıklarına güvenin (bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)). Bu mod varsayılan olarak **loopback olmayan** bir proxy kaynağı bekler; aynı host üzerindeki loopback reverse proxy'ler açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir. Dahili aynı host çağıranları, yerel doğrudan fallback olarak `gateway.auth.password` kullanabilir; `gateway.auth.token`, trusted-proxy moduyla karşılıklı olarak dışlayıcı kalır.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını **kullanmaz**; bunun yerine Gateway'in normal HTTP kimlik doğrulama modunu izler. Bu tokensiz akış, Gateway host'unun güvenilir olduğunu varsayar. `tailscale.mode = "serve"` olduğunda varsayılan değer `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP'si ve kimlik doğrulama kapsamı başına uygulanır (shared-secret ve device-token bağımsız izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Asenkron Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler, hata yazımı öncesinde seri hale getirilir. Bu nedenle aynı istemciden eşzamanlı kötü denemeler, ikisinin de düz uyuşmazlık olarak yarışıp geçmesi yerine ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` olur; localhost trafiğinin de bilerek rate-limit edilmesini istediğinizde (test kurulumları veya katı proxy dağıtımları için) `false` ayarlayın.
- Tarayıcı kökenli WS kimlik doğrulama denemeleri, loopback muafiyeti devre dışı bırakılarak her zaman throttled olur (tarayıcı tabanlı localhost brute force'a karşı defense-in-depth).
- Loopback üzerinde, bu tarayıcı kökenli kilitlenmeler normalize edilmiş `Origin`
  değerine göre izole edilir; böylece bir localhost origin'inden tekrarlanan başarısızlıklar farklı bir origin'i otomatik olarak
  kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, loopback bind) veya `funnel` (genel, kimlik doğrulama gerektirir).
- `tailscale.serviceName`: Serve modu için isteğe bağlı Tailscale Service adı,
  örneğin `svc:openclaw`. Ayarlandığında OpenClaw bunu `tailscale serve
--service` komutuna geçirir; böylece Control UI, cihaz host adı yerine adlandırılmış bir Service üzerinden
  dışa açılabilir. Değer Tailscale'in `svc:<dns-label>`
  Service adı biçimini kullanmalıdır; başlatma türetilen Service URL'sini raporlar.
- `tailscale.preserveFunnel`: `true` olduğunda ve `tailscale.mode = "serve"` iken OpenClaw,
  başlangıçta Serve'i yeniden uygulamadan önce `tailscale funnel status` kontrol eder ve
  harici olarak yapılandırılmış bir Funnel rotası Gateway portunu zaten kapsıyorsa bunu atlar.
  Varsayılan `false`.
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı origin allowlist'i. Genel loopback olmayan tarayıcı origin'leri için zorunludur. Loopback, RFC1918/link-local, `.local`, `.ts.net` veya Tailscale CGNAT host'larından yüklenen özel same-origin LAN/Tailnet UI'ları, Host-header fallback etkinleştirilmeden kabul edilir.
- `controlUi.chatMessageMaxWidth`: gruplanmış Control UI sohbet mesajları için isteğe bağlı max-width. `960px`, `82%`, `min(1280px, 82%)` ve `calc(100% - 2rem)` gibi kısıtlı CSS genişlik değerlerini kabul eder.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: bilinçli olarak Host-header origin ilkesine dayanan dağıtımlar için Host-header origin fallback'i etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için, genel host'larda `remote.url` `wss://` olmalıdır; düz metin `ws://` yalnızca loopback, LAN, link-local, `.local`, `.ts.net` ve Tailscale CGNAT host'ları için kabul edilir.
- `remote.remotePort`: uzak SSH host'undaki Gateway portu. Varsayılan `18789`; yerel tünel portu uzak Gateway portundan farklı olduğunda bunu kullanın.
- `remote.sshHostKeyPolicy`: macOS SSH tüneli host-key ilkesi. `strict` varsayılandır ve zaten güvenilen bir anahtar gerektirir. `openssh`, yönetilen takma adlar için etkin OpenSSH yapılandırmasına açık opt-in'dir; kullanmadan önce eşleşen kullanıcı ve sistem SSH ayarlarını gözden geçirin. macOS uygulaması ve `configure-remote`, hedefleri değiştirirken açıkça yeniden opt-in yapılmadığı sürece bu ilkeyi `strict` olarak sıfırlar.
- `gateway.remote.token` / `.password` uzak istemci kimlik bilgisi alanlarıdır. Kendi başlarına Gateway kimlik doğrulamasını yapılandırmazlar.
- `gateway.push.apns.relay.baseUrl`: relay destekli iOS build'leri kayıtları Gateway'e yayımladıktan sonra kullanılan harici APNs relay için temel HTTPS URL'si. Genel App Store build'leri barındırılan OpenClaw relay'ini kullanır. Özel relay URL'leri, relay URL'si o relay'i işaret eden bilinçli olarak ayrı bir iOS build/dağıtım yoluyla eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: Gateway'den relay'e gönderim zaman aşımı, milisaniye cinsinden. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir Gateway kimliğine devredilir. Eşleştirilmiş iOS uygulaması `gateway.identity.get` getirir, relay kaydına bu kimliği dahil eder ve kayıt kapsamlı bir gönderim iznini Gateway'e iletir. Başka bir Gateway bu saklanan kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici env override'ları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL'leri için yalnızca geliştirme amaçlı kaçış yolu. Üretim relay URL'leri HTTPS üzerinde kalmalıdır.
- `gateway.handshakeTimeoutMs`: kimlik doğrulama öncesi Gateway WebSocket handshake zaman aşımı, milisaniye cinsinden. Varsayılan: `15000`. Ayarlandığında `OPENCLAW_HANDSHAKE_TIMEOUT_MS` önceliklidir. Yerel istemcilerin bağlanabildiği ancak başlangıç warmup'ının hâlâ oturduğu yüklü veya düşük güçlü host'larda bunu artırın.
- `gateway.channelHealthCheckMinutes`: kanal health-monitor aralığı, dakika cinsinden. Health-monitor yeniden başlatmalarını global olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: stale-socket eşiği, dakika cinsinden. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına maksimum health-monitor yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: global monitor etkin kalırken health-monitor yeniden başlatmaları için kanal bazında opt-out.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap bazında override. Ayarlandığında kanal düzeyi override'a göre öncelikli olur.
- Yerel Gateway çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa fallback olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmışsa ve çözümlenemiyorsa, çözümleme kapalı biçimde başarısız olur (uzak fallback maskelemesi olmaz).
- `trustedProxies`: TLS'i sonlandıran veya forwarded-client başlıkları enjekte eden reverse proxy IP'leri. Yalnızca kontrol ettiğiniz proxy'leri listeleyin. Loopback girdileri aynı host proxy/local-detection kurulumları için hâlâ geçerlidir (örneğin Tailscale Serve veya yerel reverse proxy), ancak loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hale **getirmez**.
- `allowRealIpFallback`: `true` olduğunda Gateway, `X-Forwarded-For` eksikse `X-Real-IP` kabul eder. Fail-closed davranış için varsayılan `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: istenen kapsam olmadan ilk kez node cihaz eşleştirmesini otomatik onaylamak için isteğe bağlı CIDR/IP allowlist'i. Ayarlanmamışsa devre dışıdır. Bu, operatör/tarayıcı/Control UI/WebChat eşleştirmesini otomatik onaylamaz ve rol, kapsam, metadata veya public-key yükseltmelerini otomatik onaylamaz.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: eşleştirme ve platform allowlist değerlendirmesinden sonra bildirilen node komutları için global allow/deny şekillendirmesi. `camera.snap`, `camera.clip` ve `screen.record` gibi tehlikeli node komutlarına opt-in yapmak için `allowCommands` kullanın; `denyCommands`, bir platform varsayılanı veya açık izin aksi halde komutu dahil edecek olsa bile komutu kaldırır. Bir node bildirdiği komut listesini değiştirdikten sonra, Gateway'in güncellenmiş komut snapshot'ını saklaması için o cihaz eşleştirmesini reddedip yeniden onaylayın.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek araç adları (varsayılan deny listesini genişletir).
- `gateway.tools.allow`: owner/admin çağıranları için varsayılan HTTP deny listesinden
  araç adlarını kaldırır. Bu, kimlik taşıyan `operator.write`
  çağıranlarını owner/admin erişimine yükseltmez; `cron`, `gateway` ve `nodes`, allowlist'e alınsa bile
  owner olmayan çağıranlar için kullanılamaz kalır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Admin HTTP RPC: varsayılan olarak `admin-http-rpc` Plugin'i olarak kapalıdır. `POST /api/v1/admin/rpc` kaydetmek için Plugin'i etkinleştirin. Bkz. [Admin HTTP RPC](/tr/plugins/admin-http-rpc).
- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdisi sertleştirmesi:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş allowlist'ler ayarlanmamış kabul edilir; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt sertleştirme başlığı:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca kontrol ettiğiniz HTTPS origin'leri için ayarlayın; bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çoklu instance izolasyonu

Tek bir host üzerinde benzersiz portlar ve state dir'leriyle birden fazla Gateway çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Kolaylık flag'leri: `--dev` (`~/.openclaw-dev` + port `19001` kullanır), `--profile <name>` (`~/.openclaw-<name>` kullanır).

Bkz. [Multiple Gateways](/tr/gateway/multiple-gateways).

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

- `enabled`: Gateway listener'da TLS sonlandırmasını etkinleştirir (HTTPS/WSS) (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel self-signed cert/key çifti otomatik üretir; yalnızca yerel/dev kullanım içindir.
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

- `mode`: yapılandırma düzenlemelerinin çalışma zamanında nasıl uygulandığını denetler.
  - `"off"`: canlı düzenlemeleri yok say; değişiklikler açık bir yeniden başlatma gerektirir.
  - `"restart"`: yapılandırma değiştiğinde Gateway işlemini her zaman yeniden başlat.
  - `"hot"`: değişiklikleri yeniden başlatmadan işlem içinde uygula.
  - `"hybrid"` (varsayılan): önce sıcak yeniden yüklemeyi dene; gerekiyorsa yeniden başlatmaya geri dön.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tam sayı).
- `deferralTimeoutMs`: yeniden başlatmayı veya kanal sıcak yeniden yüklemesini zorlamadan önce devam eden işlemler için beklenecek ms cinsinden isteğe bağlı azami süre. Varsayılan sınırlı beklemeyi (`300000`) kullanmak için bunu atlayın; süresiz beklemek ve düzenli olarak hâlâ beklemede uyarıları günlüğe yazmak için `0` olarak ayarlayın.

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
Sorgu dizesi hook token'ları reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, etkin Gateway paylaşılan gizli kimlik doğrulamasından (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) farklı olmalıdır; başlangıç, yeniden kullanım algıladığında ölümcül olmayan bir güvenlik uyarısı günlüğe yazar.
- `openclaw security audit`, yalnızca denetim zamanında sağlanan Gateway parola kimlik doğrulaması (`--auth password --password <password>`) dahil olmak üzere hook/Gateway kimlik doğrulaması yeniden kullanımını kritik bulgu olarak işaretler. Kalıcı olarak saklanan yeniden kullanılmış bir `hooks.token` değerini döndürmek için `openclaw doctor --fix` çalıştırın, ardından harici hook göndericilerini yeni hook token'ını kullanacak şekilde güncelleyin.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini kısıtlayın (örneğin `["hook:"]`).
- Bir eşleme veya preset şablonlu bir `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` değerini ayarlayın ve `hooks.allowRequestSessionKey=true` yapın. Statik eşleme anahtarları bu açık katılımı gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükünden gelen `sessionKey` yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` üzerinden çözümlenir
  - Şablondan işlenen eşleme `sessionKey` değerleri harici olarak sağlanmış kabul edilir ve ayrıca `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Eşleme ayrıntıları">

- `match.path`, `/hooks` sonrasındaki alt yolla eşleşir (örn. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanıyla eşleşir.
- `{{messages[0].subject}}` gibi şablonlar yükten okur.
- `transform`, bir hook eylemi döndüren bir JS/TS modülüne işaret edebilir.
  - `transform.module` göreli bir yol olmalı ve `hooks.transformsDir` içinde kalmalıdır (mutlak yollar ve dizin aşımı reddedilir).
  - `hooks.transformsDir` değerini `~/.openclaw/hooks/transforms` altında tutun; çalışma alanı skill dizinleri reddedilir. `openclaw doctor` bu yolu geçersiz olarak bildirirse dönüştürme modülünü hooks dönüştürme dizinine taşıyın veya `hooks.transformsDir` değerini kaldırın.
- `agentId`, belirli bir ajana yönlendirir; bilinmeyen kimlikler varsayılan ajana geri döner.
- `allowedAgentIds`: `agentId` atlandığında varsayılan ajan yolu dahil olmak üzere etkin ajan yönlendirmesini kısıtlar (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan hook ajan çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranlarının ve şablon güdümlü eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin verir (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri (istek + eşleme) için isteğe bağlı önek izin listesi, örn. `["hook:"]`. Herhangi bir eşleme veya preset şablonlu `sessionKey` kullandığında zorunlu hale gelir.
- `deliver: true`, son yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` değerine ayarlanır.
- `model`, bu hook çalıştırması için LLM'yi geçersiz kılar (model kataloğu ayarlanmışsa izin verilmiş olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail preset'i `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- Bu ileti başına yönlendirmeyi korursanız `hooks.allowRequestSessionKey: true` ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanıyla eşleşecek şekilde kısıtlayın; örneğin `["hook:", "hook:gmail:"]`.
- `hooks.allowRequestSessionKey: false` gerekiyorsa preset'i şablonlu varsayılan yerine statik bir `sessionKey` ile geçersiz kılın.

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

## Canvas Plugin ana bilgisayarı

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

- Ajan tarafından düzenlenebilir HTML/CSS/JS ve A2UI'yi Gateway bağlantı noktası altında HTTP üzerinden sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` değerini koruyun (varsayılan).
- local loopback olmayan bağlamalar: canvas rotaları, diğer Gateway HTTP yüzeyleriyle aynı şekilde Gateway kimlik doğrulaması (token/parola/güvenilir proxy) gerektirir.
- Node WebView'ları genellikle kimlik doğrulama üstbilgileri göndermez; bir node eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için node kapsamlı yetenek URL'lerini duyurur.
- Yetenek URL'leri etkin node WS oturumuna bağlıdır ve hızla sona erer. IP tabanlı geri dönüş kullanılmaz.
- Sunulan HTML'ye canlı yeniden yükleme istemcisi enjekte eder.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- Ayrıca A2UI'yi `/__openclaw__/a2ui/` altında sunar.
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
- `full`: `cliPath` + `sshPort` değerlerini dahil eder; LAN çok noktaya yayın duyurusu yine de yerleşik `bonjour` Plugin'in etkin olmasını gerektirir.
- `off`: Plugin etkinliğini değiştirmeden LAN çok noktaya yayın duyurusunu bastırır.
- Yerleşik `bonjour` Plugin macOS ana bilgisayarlarında otomatik başlar; Linux, Windows ve kapsayıcılı Gateway dağıtımlarında açık katılımlıdır.
- Ana bilgisayar adı, geçerli bir DNS etiketi olduğunda varsayılan olarak sistem ana bilgisayar adına ayarlanır; aksi halde `openclaw` değerine geri döner. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

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

- Satır içi ortam değişkenleri yalnızca işlem ortamında anahtar eksikse uygulanır.
- `.env` dosyaları: CWD `.env` + `~/.openclaw/.env` (hiçbiri mevcut değişkenleri geçersiz kılmaz).
- `shellEnv`: eksik beklenen anahtarları oturum açma kabuğu profilinizden içe aktarır.
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
- Değişmez `${VAR}` için `$${VAR}` ile kaçış yapın.
- `$include` ile çalışır.

---

## Gizli bilgiler

Gizli bilgi başvuruları eklemelidir: düz metin değerler hâlâ çalışır.

### `SecretRef`

Tek bir nesne biçimi kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Doğrulama:

- `provider` deseni: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` kimlik deseni: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` kimliği: mutlak JSON işaretçisi (örneğin `"/providers/openai/apiKey"`)
- `source: "exec"` kimlik deseni: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (AWS tarzı `secret#json_key` seçicilerini destekler)
- `source: "exec"` kimlikleri `.` veya `..` eğik çizgiyle ayrılmış yol segmentleri içermemelidir (örneğin `a/../b` reddedilir)

### Desteklenen kimlik bilgisi yüzeyi

- Kanonik matris: [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)
- `secrets apply`, desteklenen `openclaw.json` kimlik bilgisi yollarını hedefler.
- `auth-profiles.json` başvuruları çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.

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

- `file` sağlayıcısı `mode: "json"` ve `mode: "singleValue"` değerlerini destekler (`id`, singleValue modunda `"value"` olmalıdır).
- Windows ACL doğrulaması kullanılamadığında dosya ve exec sağlayıcı yolları kapalı başarısız olur. `allowInsecurePath: true` değerini yalnızca doğrulanamayan güvenilir yollar için ayarlayın.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yükleri kullanır.
- Varsayılan olarak sembolik bağlantı komut yolları reddedilir. Çözümlenen hedef yolu doğrulanırken sembolik bağlantı yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın.
- `trustedDirs` yapılandırılmışsa güvenilir dizin denetimi çözümlenen hedef yola uygulanır.
- `exec` alt ortamı varsayılan olarak minimaldir; gerekli değişkenleri `passEnv` ile açıkça geçirin.
- Gizli bilgi başvuruları etkinleştirme zamanında bellek içi bir anlık görüntüye çözümlenir; ardından istek yolları yalnızca anlık görüntüyü okur.
- Etkin yüzey filtreleme etkinleştirme sırasında uygulanır: etkin yüzeylerdeki çözümlenmemiş başvurular başlangıç/yeniden yüklemeyi başarısız kılar, etkin olmayan yüzeyler ise tanılamalarla atlanır.

---

## Kimlik doğrulama depolaması

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- Ajan başına profiller `<agentDir>/auth-profiles.json` konumunda saklanır.
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyinde başvuruları (`api_key` için `keyRef`, `token` için `tokenRef`) destekler.
- `{ "provider": { "apiKey": "..." } }` gibi eski düz `auth-profiles.json` eşlemeleri çalışma zamanı biçimi değildir; `openclaw doctor --fix` bunları `.legacy-flat.*.bak` yedeğiyle kanonik `provider:default` API anahtarı profillerine yeniden yazar.
- OAuth modu profilleri (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli auth-profile kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri, bellekte çözümlenmiş anlık görüntülerden gelir; eski statik `auth.json` girdileri keşfedildiğinde temizlenir.
- Eski OAuth içe aktarmaları `~/.openclaw/credentials/oauth.json` konumundan yapılır.
- Bkz. [OAuth](/tr/concepts/oauth).
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

- `billingBackoffHours`: bir profil gerçek faturalandırma/yetersiz kredi hataları nedeniyle başarısız olduğunda saat cinsinden temel geri çekilme süresi (varsayılan: `5`). Açık faturalandırma metni, `401`/`403` yanıtlarında bile buraya düşebilir, ancak sağlayıcıya özgü metin eşleştiricileri onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya kuruluş/çalışma alanı harcama limiti iletileri bunun yerine `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalandırma geri çekilme saatleri için isteğe bağlı sağlayıcı başına geçersiz kılmalar.
- `billingMaxHours`: faturalandırma geri çekilmesinin üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenilirlikli `auth_permanent` hataları için dakika cinsinden temel geri çekilme süresi (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan saat cinsinden kayan pencere (varsayılan: `24`).
- `overloadedProfileRotations`: model geri dönüşüne geçmeden önce aşırı yüklenme hataları için aynı sağlayıcıdaki auth-profile rotasyonlarının en yüksek sayısı (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı meşgul şekilleri buraya düşer.
- `overloadedBackoffMs`: aşırı yüklenmiş bir sağlayıcı/profil rotasyonunu yeniden denemeden önceki sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model geri dönüşüne geçmeden önce hız sınırı hataları için aynı sağlayıcıdaki auth-profile rotasyonlarının en yüksek sayısı (varsayılan: `1`). Bu hız sınırı kovası `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

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
- `maxFileBytes`: döndürmeden önce etkin günlük dosyasının bayt cinsinden en büyük boyutu (pozitif tam sayı; varsayılan: `104857600` = 100 MB). OpenClaw, etkin dosyanın yanında en fazla beş numaralı arşiv tutar.
- `redactSensitive` / `redactPatterns`: konsol çıktısı, dosya günlükleri, OTLP günlük kayıtları ve kalıcı oturum dökümü metni için en iyi çaba maskeleme. `redactSensitive: "off"` yalnızca bu genel günlük/döküm politikasını devre dışı bırakır; UI/araç/tanı güvenliği yüzeyleri, yaymadan önce sırları yine de redakte eder.

---

## Tanılama

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
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
- `stuckSessionWarnMs`: uzun süren işleme oturumlarını `session.long_running`, `session.stalled` veya `session.stuck` olarak sınıflandırmak için ms cinsinden ilerleme olmaması yaşı eşiği. Yanıt, araç, durum, blok ve ACP ilerlemesi zamanlayıcıyı sıfırlar; tekrarlanan `session.stuck` tanılamaları değişiklik olmadığında geri çekilir.
- `stuckSessionAbortMs`: kurtarma için uygun durmuş etkin işlerin abort-drain uygulanmasından önce ms cinsinden ilerleme olmaması yaşı eşiği. Ayarlanmadığında OpenClaw, en az 5 dakika ve 3x `stuckSessionWarnMs` değerindeki daha güvenli genişletilmiş gömülü çalışma penceresini kullanır.
- `memoryPressureSnapshot`: bellek baskısı `critical` düzeyine ulaştığında redakte edilmiş OOM öncesi kararlılık anlık görüntüsü yakalar (varsayılan: `false`). Normal bellek baskısı olaylarını korurken kararlılık paketi dosya tarama/yazmasını eklemek için `true` olarak ayarlayın.
- `otel.enabled`: OpenTelemetry dışa aktarma işlem hattını etkinleştirir (varsayılan: `false`). Tam yapılandırma, sinyal kataloğu ve gizlilik modeli için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).
- `otel.endpoint`: OTel dışa aktarımı için toplayıcı URL’si.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: isteğe bağlı sinyale özgü OTLP uç noktaları. Ayarlandığında, yalnızca ilgili sinyal için `otel.endpoint` değerini geçersiz kılarlar.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC meta veri başlıkları.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarımını etkinleştirir.
- `otel.logsExporter`: günlük dışa aktarma hedefi: `"otlp"` (varsayılan), stdout satırı başına bir JSON nesnesi için `"stdout"` veya `"both"`.
- `otel.sampleRate`: iz örnekleme oranı `0`-`1`.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri boşaltma aralığı.
- `otel.captureContent`: OTEL span öznitelikleri için açık onaylı ham içerik yakalama. Varsayılan olarak kapalıdır. Boole `true`, sistem dışı ileti/araç içeriğini yakalar; nesne biçimi `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` ve `toolDefinitions` değerlerini açıkça etkinleştirmenizi sağlar.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: `{gen_ai.operation.name} {gen_ai.request.model}` span adları, `CLIENT` span türü ve eski `gen_ai.system` yerine `gen_ai.provider.name` dahil olmak üzere en yeni deneysel GenAI çıkarım span şekli için ortam anahtarı. Varsayılan olarak span’ler uyumluluk için `openclaw.model.call` ve `gen_ai.system` değerlerini korur; GenAI metrikleri sınırlı semantik öznitelikler kullanır.
- `OPENCLAW_OTEL_PRELOADED=1`: zaten global bir OpenTelemetry SDK kaydetmiş ana makineler için ortam anahtarı. OpenClaw, tanılama dinleyicilerini etkin tutarken Plugin sahipli SDK başlatma/kapatma adımlarını atlar.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` ve `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: eşleşen yapılandırma anahtarı ayarlanmadığında kullanılan sinyale özgü uç nokta ortam değişkenleri.
- `cacheTrace.enabled`: gömülü çalışmalar için önbellek izleme anlık görüntülerini günlüğe kaydeder (varsayılan: `false`).
- `cacheTrace.filePath`: önbellek izleme JSONL çıktısı için çıktı yolu (varsayılan: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
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

- `channel`: npm/git kurulumları için sürüm kanalı - `"stable"`, `"beta"` veya `"dev"`.
- `checkOnStart`: gateway başlatıldığında npm güncellemelerini denetler (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka planda otomatik güncellemeyi etkinleştirir (varsayılan: `false`).
- `auto.stableDelayHours`: stable kanalında otomatik uygulamadan önce saat cinsinden en düşük gecikme (varsayılan: `6`; en yüksek: `168`).
- `auto.stableJitterHours`: saat cinsinden ek stable kanal dağıtım yayılım penceresi (varsayılan: `12`; en yüksek: `168`).
- `auto.betaCheckIntervalHours`: beta kanal denetimlerinin saat cinsinden ne sıklıkta çalışacağı (varsayılan: `1`; en yüksek: `24`).

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

- `enabled`: global ACP özellik kapısı (varsayılan: `true`; ACP dispatch ve spawn olanaklarını gizlemek için `false` ayarlayın).
- `dispatch.enabled`: ACP oturum turu dispatch işlemi için bağımsız kapı (varsayılan: `true`). Yürütmeyi engellerken ACP komutlarını kullanılabilir tutmak için `false` ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı arka uç kimliği (kayıtlı bir ACP çalışma zamanı Plugin ile eşleşmelidir).
  Önce arka uç Plugin’ini kurun ve `plugins.allow` ayarlanmışsa arka uç Plugin kimliğini (örneğin `acpx`) ekleyin; aksi takdirde ACP arka ucu yüklenmez.
- `defaultAgent`: spawn işlemleri açık bir hedef belirtmediğinde yedek ACP hedef ajan kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen ajan kimliklerinin allowlist’i; boş olması ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: aynı anda etkin olabilecek en fazla ACP oturumu sayısı.
- `stream.coalesceIdleMs`: akışlı metin için ms cinsinden boşta boşaltma penceresi.
- `stream.maxChunkChars`: akışlı blok projeksiyonunu bölmeden önceki en büyük parça boyutu.
- `stream.repeatSuppression`: tur başına tekrarlanan durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı olarak akış yapar; `"final_only"` tur sonlanma olaylarına kadar tamponlar.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önceki ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP turu başına projekte edilen en fazla asistan çıktı karakteri.
- `stream.maxSessionUpdateChars`: projekte edilen ACP durum/güncelleme satırları için en fazla karakter.
- `stream.tagVisibility`: akışlı olaylar için etiket adlarından boole görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum çalışanları için uygun temizlemeden önce dakika cinsinden boşta TTL.
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

- `cli.banner.taglineMode`, banner sloganı stilini kontrol eder:
  - `"random"` (varsayılan): dönüşümlü esprili/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yoktur (banner başlığı/sürümü yine gösterilir).
- Banner'ın tamamını gizlemek için (yalnızca sloganları değil), `OPENCLAW_HIDE_BANNER=1` env değerini ayarlayın.

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
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Kimlik

[Agent varsayılanları](/tr/gateway/config-agents#agent-defaults) altında `agents.list` kimlik alanlarına bakın.

---

## Köprü (eski, kaldırıldı)

Güncel derlemeler artık TCP köprüsünü içermez. Node'lar Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları çıkarabilir).

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
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: tamamlanan yalıtılmış cron çalıştırma oturumlarının `sessions.json` içinden budanmadan önce ne kadar süre tutulacağını belirtir. Arşivlenmiş silinmiş cron transkriptlerinin temizlenmesini de kontrol eder. Varsayılan: `24h`; devre dışı bırakmak için `false` olarak ayarlayın.
- `runLog.maxBytes`: eski dosya destekli cron çalıştırma günlükleriyle uyumluluk için kabul edilir. Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: iş başına tutulan en yeni SQLite çalıştırma geçmişi satırları. Varsayılan: `2000`.
- `webhookToken`: cron Webhook POST teslimi (`delivery.mode = "webhook"`) için kullanılan bearer token; atlanırsa kimlik doğrulama başlığı gönderilmez.
- `webhook`: hâlâ `notify: true` içeren depolanmış işleri taşımak için `openclaw doctor --fix` tarafından kullanılan, kullanımdan kaldırılmış eski yedek Webhook URL'si (http/https); çalışma zamanı teslimi, iş başına `delivery.mode="webhook"` ile `delivery.to` değerini veya duyuru teslimini korurken `delivery.completionDestination` değerini kullanır.

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

- `maxAttempts`: geçici hatalarda cron işleri için en fazla yeniden deneme sayısı (varsayılan: `3`; aralık: `0`-`10`).
- `backoffMs`: her yeniden deneme girişimi için ms cinsinden geri çekilme gecikmeleri dizisi (varsayılan: `[30000, 60000, 300000]`; 1-10 giriş).
- `retryOn`: yeniden denemeleri tetikleyen hata türleri - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Tüm geçici türleri yeniden denemek için atlayın.

Tek seferlik işler, yeniden deneme girişimleri tükenene kadar etkin kalır; ardından son hata durumunu koruyarak devre dışı kalır. Yinelenen işler, bir sonraki zamanlanmış aralıklarından önce geri çekilme sonrasında yeniden çalışmak için aynı geçici yeniden deneme ilkesini kullanır; kalıcı hatalar veya tükenen geçici yeniden denemeler, hata geri çekilmesiyle normal yinelenen zamanlamaya döner.

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
- `cooldownMs`: aynı iş için yinelenen uyarılar arasındaki en az milisaniye (negatif olmayan tam sayı).
- `includeSkipped`: ardışık atlanan çalıştırmaları uyarı eşiğine dahil eder (varsayılan: `false`). Atlanan çalıştırmalar ayrı izlenir ve yürütme hatası geri çekilmesini etkilemez.
- `mode`: teslim modu - `"announce"` bir kanal mesajı üzerinden gönderir; `"webhook"` yapılandırılmış Webhook'a gönderir.
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
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi mevcut olduğunda varsayılan `"announce"` olur.
- `channel`: duyuru teslimi için kanal geçersiz kılma. `"last"` son bilinen teslim kanalını yeniden kullanır.
- `to`: açık duyuru hedefi veya Webhook URL'si. Webhook modu için gereklidir.
- `accountId`: teslim için isteğe bağlı hesap geçersiz kılması.
- İş başına `delivery.failureDestination`, bu genel varsayılanı geçersiz kılar.
- Ne genel ne de iş başına hata hedefi ayarlanmışsa, zaten `announce` üzerinden teslim eden işler hata durumunda o birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, işin birincil `delivery.mode` değeri `"webhook"` değilse yalnızca `sessionTarget="isolated"` işleri için desteklenir.

[Cron İşleri](/tr/automation/cron-jobs) bölümüne bakın. Yalıtılmış cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya modeli şablon değişkenleri

`tools.media.models[].args` içinde genişletilen şablon yer tutucuları:

| Değişken           | Açıklama                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Gelen mesaj gövdesinin tamamı                     |
| `{{RawBody}}`      | Ham gövde (geçmiş/gönderen sarmalayıcıları yok)   |
| `{{BodyStripped}}` | Grup bahsetmeleri çıkarılmış gövde                |
| `{{From}}`         | Gönderen tanımlayıcısı                            |
| `{{To}}`           | Hedef tanımlayıcısı                               |
| `{{MessageSid}}`   | Kanal mesajı kimliği                              |
| `{{SessionId}}`    | Geçerli oturum UUID'si                            |
| `{{IsNewSession}}` | Yeni oturum oluşturulduğunda `"true"`             |
| `{{MediaUrl}}`     | Gelen medya sözde URL'si                          |
| `{{MediaPath}}`    | Yerel medya yolu                                  |
| `{{MediaType}}`    | Medya türü (görüntü/ses/belge/...)                |
| `{{Transcript}}`   | Ses transkripti                                   |
| `{{Prompt}}`       | CLI girişleri için çözümlenmiş medya istemi       |
| `{{MaxChars}}`     | CLI girişleri için çözümlenmiş en fazla çıktı karakteri |
| `{{ChatType}}`     | `"direct"` veya `"group"`                         |
| `{{GroupSubject}}` | Grup konusu (en iyi çaba)                         |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (en iyi çaba)             |
| `{{SenderName}}`   | Gönderen görünen adı (en iyi çaba)                |
| `{{SenderE164}}`   | Gönderen telefon numarası (en iyi çaba)           |
| `{{Provider}}`     | Sağlayıcı ipucu (whatsapp, telegram, discord vb.) |

---

## Yapılandırma include'ları (`$include`)

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

- Tek dosya: içeren nesnenin yerine geçer.
- Dosya dizisi: sırayla derin birleştirilir (sonrakiler öncekileri geçersiz kılar).
- Kardeş anahtarlar: include'lardan sonra birleştirilir (include edilen değerleri geçersiz kılar).
- İç içe include'lar: en fazla 10 seviye derinliğe kadar.
- Yollar: include eden dosyaya göre çözümlenir, ancak üst düzey yapılandırma dizininin (`openclaw.json` dosyasının `dirname` değeri) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca bu sınır içinde çözümlendiklerinde izin verilir. Yollar null bayt içeremez ve çözümlemeden önce ve sonra kesinlikle 4096 karakterden kısa olmalıdır.
- OpenClaw'a ait, tek dosyalı bir include ile desteklenen yalnızca bir üst düzey bölümü değiştiren yazmalar, doğrudan o include edilen dosyaya yazılır. Örneğin `plugins install`, `plugins: { $include: "./plugins.json5" }` değerini `plugins.json5` içinde günceller ve `openclaw.json` dosyasını olduğu gibi bırakır.
- Kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar, OpenClaw'a ait yazmalar için salt okunurdur; bu yazmalar yapılandırmayı düzleştirmek yerine kapalı başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları, döngüsel include'lar, geçersiz yol biçimi ve aşırı uzunluk için net iletiler.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
