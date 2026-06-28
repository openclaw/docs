---
read_when:
    - Tam alan düzeyinde yapılandırma semantiğine veya varsayılanlara ihtiyacınız var
    - Kanal, model, Gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Çekirdek OpenClaw anahtarları, varsayılanları ve özel alt sistem referanslarına bağlantılar için Gateway yapılandırma referansı
title: Yapılandırma referansı
x-i18n:
    generated_at: "2026-06-28T00:33:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb8ebf55fe7562f00dbd42eb5fd00a7bac95ac934bdb0b778d04bb6926f28102
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` için temel yapılandırma başvurusu. Görev odaklı bir genel bakış için bkz. [Yapılandırma](/tr/gateway/configuration).

Ana OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendi daha ayrıntılı başvurusu olduğunda bağlantı verir. Kanal ve plugin sahipli komut katalogları ile derin bellek/QMD ayarları bu sayfa yerine kendi sayfalarında bulunur.

Kod gerçeği:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema'yı yazdırır; varsa paketlenmiş/plugin/kanal meta verileri birleştirilir
- `config.schema.lookup`, ayrıntıya inme araçları için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, yapılandırma belgeleri temel karma değerini geçerli şema yüzeyine göre doğrular

Aracı arama yolu: düzenlemelerden önce tam alan düzeyi belgeler ve kısıtlamalar için `gateway` araç eylemi `config.schema.lookup` kullanın. Görev odaklı rehberlik için [Yapılandırma](/tr/gateway/configuration) sayfasını, daha geniş alan haritası, varsayılanlar ve alt sistem başvurularına bağlantılar için bu sayfayı kullanın.

Özel derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki dreaming yapılandırması için [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
- Geçerli yerleşik + paketlenmiş komut kataloğu için [Eğik çizgi komutları](/tr/tools/slash-commands)
- Kanala özgü komut yüzeyleri için sahip kanal/plugin sayfaları

Yapılandırma biçimi **JSON5**'tir (yorumlara + sonda virgüllere izin verilir). Tüm alanlar isteğe bağlıdır - OpenClaw, atlandıklarında güvenli varsayılanları kullanır.

---

## Kanallar

Kanal başına yapılandırma anahtarları özel bir sayfaya taşındı - Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve diğer paketlenmiş kanallar (kimlik doğrulama, erişim denetimi, çoklu hesap, mention geçitleme) dahil `channels.*` için bkz. [Yapılandırma - kanallar](/tr/gateway/config-channels).

## Aracı varsayılanları, çoklu aracı, oturumlar ve mesajlar

Özel bir sayfaya taşındı - şunlar için bkz. [Yapılandırma - aracılar](/tr/gateway/config-agents):

- `agents.defaults.*` (çalışma alanı, model, düşünme, Heartbeat, bellek, medya, Skills, sandbox)
- `multiAgent.*` (çoklu aracı yönlendirme ve bağlamalar)
- `session.*` (oturum yaşam döngüsü, Compaction, budama)
- `messages.*` (mesaj teslimi, TTS, markdown işleme)
- `talk.*` (Talk modu)
  - `talk.consultThinkingLevel`: Control UI Talk gerçek zamanlı danışmalarının arkasındaki tam OpenClaw aracı çalıştırması için düşünme düzeyi geçersiz kılması
  - `talk.consultFastMode`: Control UI Talk gerçek zamanlı danışmaları için tek seferlik hızlı mod geçersiz kılması
  - `talk.speechLocale`: iOS/macOS üzerinde Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği
  - `talk.silenceTimeoutMs`: ayarlanmadığında Talk, transkripti göndermeden önce platform varsayılan duraklama penceresini korur (`macOS ve Android üzerinde 700 ms, iOS üzerinde 900 ms`)
  - `talk.realtime.consultRouting`: `openclaw_agent_consult` öğesini atlayan sonlandırılmış gerçek zamanlı Talk transkriptleri için Gateway aktarma yedeği

## Araçlar ve özel sağlayıcılar

Araç ilkesi, deneysel geçişler, sağlayıcı destekli araç yapılandırması ve özel sağlayıcı / temel URL kurulumu özel bir sayfaya taşındı - bkz. [Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## Modeller

Sağlayıcı tanımları, model izin listeleri ve özel sağlayıcı kurulumu [Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) içinde bulunur.
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
- `models.providers`: sağlayıcı kimliğine göre anahtarlanmış özel sağlayıcı eşlemi.
- `models.providers.*.localService`: yerel model sunucuları için isteğe bağlı talep üzerine süreç yöneticisi. OpenClaw yapılandırılmış sağlık uç noktasını yoklar, gerektiğinde mutlak `command` öğesini başlatır, hazır olmayı bekler ve ardından model isteğini gönderir. Bkz. [Yerel model hizmetleri](/tr/gateway/local-model-services).
- `models.pricing.enabled`: sidecar'lar ve kanallar Gateway hazır yoluna ulaştıktan sonra başlayan arka plan fiyatlandırma başlatmasını denetler. `false` olduğunda Gateway, OpenRouter ve LiteLLM fiyatlandırma kataloğu getirmelerini atlar; yapılandırılmış `models.providers.*.models[].cost` değerleri yerel maliyet tahminleri için çalışmaya devam eder.

## MCP

OpenClaw tarafından yönetilen MCP sunucu tanımları `mcp.servers` altında bulunur ve yerleşik OpenClaw ile diğer çalışma zamanı adaptörleri tarafından tüketilir. `openclaw mcp list`, `show`, `set` ve `unset` komutları, yapılandırma düzenlemeleri sırasında hedef sunucuya bağlanmadan bu bloğu yönetir.

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

- `mcp.servers`: yapılandırılmış MCP araçlarını sunan çalışma zamanları için adlandırılmış stdio veya uzak MCP sunucu tanımları. Uzak girdiler `transport: "streamable-http"` veya `transport: "sse"` kullanır; `type: "http"`, `openclaw mcp set` ve `openclaw doctor --fix` tarafından kanonik `transport` alanına normalleştirilen CLI yerel bir takma addır.
- `mcp.servers.<name>.enabled`: kaydedilmiş bir sunucu tanımını korurken onu yerleşik OpenClaw MCP keşfi ve araç projeksiyonundan hariç tutmak için `false` olarak ayarlayın.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: sunucu başına MCP isteği zaman aşımı, saniye veya milisaniye cinsinden.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: sunucu başına bağlantı zaman aşımı, saniye veya milisaniye cinsinden.
- `mcp.servers.<name>.supportsParallelToolCalls`: paralel MCP araç çağrıları yapıp yapmamayı seçebilen adaptörler için isteğe bağlı eşzamanlılık ipucu.
- `mcp.servers.<name>.auth`: OAuth gerektiren HTTP MCP sunucuları için `"oauth"` olarak ayarlayın. Belirteçleri OpenClaw durumu altında saklamak için `openclaw mcp login <name>` çalıştırın.
- `mcp.servers.<name>.oauth`: isteğe bağlı OAuth kapsamı, yönlendirme URL'si ve istemci meta veri URL'si geçersiz kılmaları.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: özel uç noktalar ve karşılıklı TLS için HTTP TLS denetimleri.
- `mcp.servers.<name>.toolFilter`: isteğe bağlı sunucu başına araç seçimi. `include`, keşfedilen MCP araçlarını eşleşen adlarla sınırlar; `exclude`, eşleşen adları gizler. Girdiler tam MCP araç adları veya basit `*` glob'larıdır. Kaynakları veya istemleri olan sunucular ayrıca yardımcı araç adları (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) üretir ve bu adlar aynı filtreyi kullanır.
- `mcp.servers.<name>.codex`: isteğe bağlı Codex uygulama sunucusu projeksiyon denetimleri. Bu blok yalnızca Codex uygulama sunucusu iş parçacıkları için OpenClaw meta verisidir; ACP oturumlarını, genel Codex harness yapılandırmasını veya diğer çalışma zamanı adaptörlerini etkilemez. Boş olmayan `codex.agents`, sunucuyu listelenen OpenClaw aracı kimlikleriyle sınırlar. Boş, dolgu boşluklu veya geçersiz kapsamlı aracı listeleri, yapılandırma doğrulaması tarafından reddedilir ve genel hale gelmek yerine çalışma zamanı projeksiyon yolu tarafından atlanır. `codex.defaultToolsApprovalMode`, ilgili sunucu için Codex'in yerel `default_tools_approval_mode` öğesini yayar. OpenClaw, yerel `mcp_servers` yapılandırmasını Codex'e geçirmeden önce `codex` bloğunu çıkarır. Sunucuyu her Codex uygulama sunucusu aracısına Codex'in varsayılan MCP onay davranışıyla yansıtılmış tutmak için bloğu atlayın.
- `mcp.sessionIdleTtlMs`: oturum kapsamlı paketlenmiş MCP çalışma zamanları için boşta TTL. Tek seferlik yerleşik çalıştırmalar, çalıştırma sonu temizliği ister; bu TTL uzun ömürlü oturumlar ve gelecekteki çağıranlar için yedek mekanizmadır.
- `mcp.*` altındaki değişiklikler, önbelleğe alınmış oturum MCP çalışma zamanları elden çıkarılarak anında uygulanır. Sonraki araç keşfi/kullanımı bunları yeni yapılandırmadan yeniden oluşturur; böylece kaldırılan `mcp.servers` girdileri boşta TTL beklemeden hemen temizlenir.
- Çalışma zamanı keşfi, ilgili oturum için önbelleğe alınmış kataloğu bırakarak MCP araç listesi değişiklik bildirimlerini de dikkate alır. Kaynakları veya istemleri duyuran sunucular, kaynakları listeleme/okuma ve istemleri listeleme/getirme için yardımcı araçlar alır. Yinelenen araç çağrısı hataları, başka bir çağrı denenmeden önce etkilenen sunucuyu kısa süreliğine duraklatır.

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

- `allowBundled`: yalnızca paketlenmiş Skills için isteğe bağlı izin listesi (yönetilen/çalışma alanı Skills etkilenmez).
- `load.extraDirs`: ek paylaşılan Skill kökleri (en düşük öncelik).
- `load.allowSymlinkTargets`: bağlantı yapılandırılmış kaynak kökünün dışında bulunduğunda Skill symlink'lerinin çözümlenebileceği güvenilir gerçek hedef kökler.
- `workshop.allowSymlinkTargetWrites`: Skill Workshop apply işleminin zaten güvenilir symlink hedefleri üzerinden yazmasına izin verir (varsayılan: false).
- `install.preferBrew`: true olduğunda, diğer yükleyici türlerine geri dönmeden önce `brew` kullanılabiliyorsa Homebrew yükleyicilerini tercih eder.
- `install.nodeManager`: `metadata.openclaw.install` belirtimleri için node yükleyici tercihi (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: güvenilir `operator.admin` Gateway istemcilerinin `skills.upload.*` üzerinden sahnelenmiş özel zip arşivleri yüklemesine izin verir (varsayılan: false). Bu yalnızca yüklenmiş arşiv yolunu etkinleştirir; normal ClawHub yüklemeleri bunu gerektirmez.
- `entries.<skillKey>.enabled: false`, paketlenmiş/yüklenmiş olsa bile bir Skill'i devre dışı bırakır.
- `entries.<skillKey>.apiKey`: birincil env var bildiren Skills için kolaylık (düz metin dizesi veya SecretRef nesnesi).

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

- `~/.openclaw/extensions` ve `<workspace>/.openclaw/extensions` altındaki paket veya bundle dizinlerinden, ayrıca `plugins.load.paths` içinde listelenen dosya ya da dizinlerden yüklenir.
- Bağımsız plugin dosyalarını `plugins.load.paths` içine koyun; otomatik keşfedilen extension kökleri üst düzey `.js`, `.mjs` ve `.ts` dosyalarını yok sayar, böylece bu köklerdeki yardımcı betikler başlatmayı engellemez.
- Keşif, yerel OpenClaw pluginleri ile uyumlu Codex bundle'larını ve Claude bundle'larını, manifest içermeyen Claude varsayılan düzen bundle'ları dahil, kabul eder.
- **Yapılandırma değişiklikleri Gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen pluginler yüklenir). `deny` üstün gelir.
- `plugins.entries.<id>.apiKey`: plugin düzeyi API anahtarı kolaylık alanı (plugin tarafından desteklendiğinde).
- `plugins.entries.<id>.env`: plugin kapsamlı env var eşlemesi.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda çekirdek `before_prompt_build` öğesini engeller ve eski `before_agent_start` içinden prompt değiştiren alanları yok sayar; eski `modelOverride` ve `providerOverride` korunur. Yerel plugin hook'larına ve desteklenen bundle tarafından sağlanan hook dizinlerine uygulanır.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` olduğunda, güvenilen ve bundle olmayan pluginler `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` ve `agent_end` gibi tipli hook'lardan ham konuşma içeriğini okuyabilir.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu pluginin arka plan alt ajan çalıştırmaları için çalışma başına `provider` ve `model` geçersiz kılmaları istemesine açıkça güven.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilen alt ajan geçersiz kılmaları için kanonik `provider/model` hedeflerinin isteğe bağlı izin listesi. Herhangi bir modele izin vermeyi özellikle istiyorsanız yalnızca `"*"` kullanın.
- `plugins.entries.<id>.llm.allowModelOverride`: bu pluginin `api.runtime.llm.complete` için model geçersiz kılmaları istemesine açıkça güven.
- `plugins.entries.<id>.llm.allowedModels`: güvenilen plugin LLM tamamlama geçersiz kılmaları için kanonik `provider/model` hedeflerinin isteğe bağlı izin listesi. Herhangi bir modele izin vermeyi özellikle istiyorsanız yalnızca `"*"` kullanın.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: bu pluginin `api.runtime.llm.complete` işlemini varsayılan olmayan bir ajan kimliğine karşı çalıştırmasına açıkça güven.
- `plugins.entries.<id>.config`: plugin tarafından tanımlanan yapılandırma nesnesi (varsa yerel OpenClaw plugin şeması tarafından doğrulanır).
- Kanal plugini hesap/çalışma zamanı ayarları `channels.<id>` altında bulunur ve merkezi bir OpenClaw seçenek kayıt defteriyle değil, sahibi olan pluginin manifest `channelConfigs` meta verisiyle açıklanmalıdır.

### Codex harness plugini yapılandırması

Bundle olarak gelen `codex` plugini, yerel Codex uygulama sunucusu harness ayarlarını
`plugins.entries.codex.config` altında sahiplenir. Tam yapılandırma
yüzeyi için [Codex harness başvurusu](/tr/plugins/codex-harness-reference) ve çalışma zamanı modeli için
[Codex harness](/tr/plugins/codex-harness) sayfasına bakın.

`codexPlugins` yalnızca yerel Codex harness'i seçen oturumlara uygulanır.
OpenClaw sağlayıcı çalıştırmaları, ACP konuşma bağlamaları veya Codex olmayan herhangi bir harness için Codex pluginlerini etkinleştirmez.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: Codex harness'i için yerel Codex
  plugin/uygulama desteğini etkinleştirir. Varsayılan: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  taşınmış plugin uygulama istemleri için varsayılan yıkıcı eylem ilkesi.
  Güvenli Codex onay şemalarını sormadan kabul etmek için `true`, bunları
  reddetmek için `false`, Codex'in gerektirdiği onayları OpenClaw plugin
  onayları üzerinden yönlendirmek için `"auto"` veya kalıcı onay olmadan
  her plugin yazma/yıkıcı eylemi için sormak üzere `"always"` kullanın.
  `"always"` modu, iş parçacığını başlatmadan önce etkilenen uygulama için
  kalıcı Codex araç başına onay geçersiz kılmalarını temizler.
  Varsayılan: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: global
  `codexPlugins.enabled` de true olduğunda taşınmış bir plugin girdisini etkinleştirir.
  Varsayılan: açık girdiler için `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  kararlı marketplace kimliği. V1 yalnızca `"openai-curated"` destekler.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: taşımadan gelen kararlı
  Codex plugin kimliği, örneğin `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  plugin başına yıkıcı eylem geçersiz kılması. Atlandığında global
  `allow_destructive_actions` değeri kullanılır. Plugin başına değer aynı
  `true`, `false`, `"auto"` veya `"always"` ilkelerini kabul eder.

`codexPlugins.enabled` global etkinleştirme yönergesidir. Taşıma tarafından
yazılan açık plugin girdileri, kalıcı kurulum ve onarım uygunluğu kümesidir.
`plugins["*"]` desteklenmez, `install` anahtarı yoktur ve yerel
`marketplacePath` değerleri, konağa özgü oldukları için bilerek yapılandırma alanları değildir.

`app/list` hazırlık denetimleri bir saat önbelleğe alınır ve eskidiğinde
asenkron olarak yenilenir. Codex iş parçacığı uygulama yapılandırması her turda değil,
Codex harness oturumu kurulduğunda hesaplanır; yerel plugin yapılandırmasını değiştirdikten sonra
`/new`, `/reset` veya Gateway yeniden başlatması kullanın.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web getirme sağlayıcısı ayarları.
  - `apiKey`: Daha yüksek limitler için isteğe bağlı Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` env var değerine geri düşer.
  - `baseUrl`: Firecrawl API taban URL'si (varsayılan: `https://api.firecrawl.dev`; self-hosted geçersiz kılmalar özel/dahili uç noktaları hedeflemelidir).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkar (varsayılan: `true`).
  - `maxAgeMs`: milisaniye cinsinden en yüksek önbellek yaşı (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: saniye cinsinden kazıma isteği zaman aşımı (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web araması) ayarları.
  - `enabled`: X Search sağlayıcısını etkinleştir.
  - `model`: arama için kullanılacak Grok modeli (örn. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: bellek dreaming ayarları. Aşamalar ve eşikler için [Dreaming](/tr/concepts/dreaming) sayfasına bakın.
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam dreaming taraması için cron aralığı (varsayılan olarak `"0 3 * * *"`).
  - `model`: isteğe bağlı Dream Diary alt ajan modeli geçersiz kılması. `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir; hedefleri kısıtlamak için `allowedModels` ile eşleştirin. Modelin kullanılamadığı hatalar oturum varsayılan modeliyle bir kez yeniden denenir; güven veya izin listesi hataları sessizce geri düşmez.
  - aşama ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya dönük yapılandırma anahtarları değildir).
- Tam bellek yapılandırması [Bellek yapılandırması başvurusu](/tr/reference/memory-config) içindedir:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude bundle pluginleri `settings.json` içinden gömülü OpenClaw varsayılanları da katkı olarak sağlayabilir; OpenClaw bunları ham OpenClaw yapılandırma yamaları olarak değil, temizlenmiş ajan ayarları olarak uygular.
- `plugins.slots.memory`: etkin bellek plugini kimliğini seçin veya bellek pluginlerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: etkin bağlam motoru plugini kimliğini seçin; başka bir motor kurup seçmediğiniz sürece varsayılan `"legacy"` olur.

Bkz. [Pluginler](/tr/tools/plugin).

---

## Taahhütler

`commitments` çıkarımsal takip belleğini denetler: OpenClaw konuşma turlarından kontrol noktalarını algılayabilir ve bunları Heartbeat çalıştırmaları üzerinden teslim edebilir.

- `commitments.enabled`: çıkarımsal takip taahhütleri için gizli LLM çıkarımı, depolama ve Heartbeat teslimini etkinleştir. Varsayılan: `false`.
- `commitments.maxPerDay`: hareketli bir gün içinde ajan oturumu başına teslim edilen en yüksek çıkarımsal takip taahhüdü sayısı. Varsayılan: `3`.

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

- `evaluateEnabled: false`, `act:evaluate` ve `wait --fn` kullanımını devre dışı bırakır.
- `tabCleanup`, boşta kalma süresinden sonra veya bir oturum üst sınırını aştığında izlenen birincil ajan sekmelerini geri kazanır. Bu tekil temizleme modlarını devre dışı bırakmak için `idleMinutes: 0` veya `maxTabsPerSession: 0` ayarlayın.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`, ayarlanmamışsa devre dışıdır; bu nedenle tarayıcı gezinmesi varsayılan olarak katı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezinmesine bilerek güvendiğinizde ayarlayın.
- Katı modda, uzak CDP profil uç noktaları (`profiles.*.cdpUrl`) erişilebilirlik/keşif kontrolleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski takma ad olarak desteklenmeye devam eder.
- Katı modda, açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca bağlanma içindir (başlatma/durdurma/sıfırlama devre dışıdır).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw'ın `/json/version` keşfetmesini istediğinizde HTTP(S) kullanın; sağlayıcınız size doğrudan DevTools WebSocket URL'si verdiğinde WS(S) kullanın.
- `remoteCdpTimeoutMs` ve `remoteCdpHandshakeTimeoutMs`, uzak ve `attachOnly` CDP erişilebilirliğine ve sekme açma isteklerine uygulanır. Yönetilen loopback profilleri yerel CDP varsayılanlarını korur.
- Harici olarak yönetilen bir CDP hizmetine loopback üzerinden erişilebiliyorsa, o profilin `attachOnly: true` değerini ayarlayın; aksi takdirde OpenClaw loopback bağlantı noktasını yerel olarak yönetilen bir tarayıcı profili olarak ele alır ve yerel bağlantı noktası sahipliği hataları bildirebilir.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve seçilen ana makinede veya bağlı bir tarayıcı düğümü üzerinden bağlanabilir.
- `existing-session` profilleri, Brave veya Edge gibi belirli bir Chromium tabanlı tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri, Chrome zaten bir DevTools HTTP(S) keşif uç noktasının veya doğrudan WS(S) uç noktasının arkasında çalışıyorsa `cdpUrl` ayarlayabilir. Bu modda OpenClaw, otomatik bağlanma kullanmak yerine uç noktayı Chrome MCP'ye geçirir; `userDataDir`, Chrome MCP başlatma argümanları için yok sayılır.
- `existing-session` profilleri mevcut Chrome MCP rota sınırlarını korur: CSS seçici hedeflemesi yerine snapshot/ref odaklı eylemler, tek dosya yükleme kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel olarak yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; `cdpUrl` değerini yalnızca uzak CDP profilleri veya existing-session uç nokta bağlantısı için açıkça ayarlayın.
- Yerel olarak yönetilen profiller, o profil için genel `browser.executablePath` değerini geçersiz kılmak üzere `executablePath` ayarlayabilir. Bunu bir profili Chrome'da, başka bir profili Brave'de çalıştırmak için kullanın.
- Yerel olarak yönetilen profiller, işlem başladıktan sonra Chrome CDP HTTP keşfi için `browser.localLaunchTimeoutMs` ve başlatma sonrası CDP websocket hazır olma durumu için `browser.localCdpReadyTimeoutMs` kullanır. Chrome'un başarıyla başladığı ancak hazır olma kontrollerinin başlangıçla yarıştığı daha yavaş ana makinelerde bunları artırın. Her iki değer de `120000` ms'ye kadar pozitif tam sayılar olmalıdır; geçersiz yapılandırma değerleri reddedilir.
- Otomatik algılama sırası: Chromium tabanlıysa varsayılan tarayıcı → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` ve `browser.profiles.<name>.executablePath`, Chromium başlatılmadan önce işletim sistemi ana dizininiz için `~` ve `~/...` kabul eder. `existing-session` profillerindeki profil başına `userDataDir` de tilde ile genişletilir.
- Denetim hizmeti: yalnızca loopback (`gateway.port` değerinden türetilen bağlantı noktası, varsayılan `18791`).
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

- `seamColor`: yerel uygulama UI chrome'u için vurgu rengi (Talk Mode balon tonu vb.).
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

- `mode`: `local` (gateway'i çalıştır) veya `remote` (uzak gateway'e bağlan). Gateway, `local` olmadığı sürece başlamayı reddeder.
- `port`: WS + HTTP için tek çoğullanmış bağlantı noktası. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP'si) veya `custom`.
- **Eski bind takma adları**: `gateway.bind` içinde host takma adlarını (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind, kapsayıcı içinde `127.0.0.1` üzerinde dinler. Docker köprü ağıyla (`-p 18789:18789`) trafik `eth0` üzerinden gelir, bu nedenle gateway erişilemez. Tüm arayüzlerde dinlemek için `--network host` kullanın veya `bind: "lan"` (ya da `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Kimlik doğrulama**: varsayılan olarak gereklidir. loopback dışı bind'ler gateway kimlik doğrulaması gerektirir. Pratikte bu, paylaşılan bir token/parola veya `gateway.auth.mode: "trusted-proxy"` içeren kimlik farkındalıklı bir ters proxy anlamına gelir. Başlatma sihirbazı varsayılan olarak bir token oluşturur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. İkisi de yapılandırıldığında ve mod ayarlanmadığında başlatma ve hizmet kurma/onarım akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık no-auth modu. Yalnızca güvenilir local loopback kurulumları için kullanın; bu seçenek bilinçli olarak başlatma istemlerinde sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: tarayıcı/kullanıcı kimlik doğrulamasını kimlik farkındalıklı bir ters proxy'ye devredin ve `gateway.trustedProxies` üzerinden gelen kimlik başlıklarına güvenin (bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)). Bu mod varsayılan olarak **loopback dışı** bir proxy kaynağı bekler; aynı host üzerindeki loopback ters proxy'ler açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir. İç aynı-host çağırıcılar yerel doğrudan yedek olarak `gateway.auth.password` kullanabilir; `gateway.auth.token`, trusted-proxy moduyla karşılıklı olarak dışlayıcı kalır.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını **kullanmaz**; bunun yerine gateway'in normal HTTP kimlik doğrulama modunu izler. Bu tokensız akış gateway host'unun güvenilir olduğunu varsayar. `tailscale.mode = "serve"` olduğunda varsayılan `true` değeridir.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP'si ve kimlik doğrulama kapsamı başına uygulanır (shared-secret ve device-token bağımsız olarak izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Zaman uyumsuz Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler hata yazımı öncesinde seri hale getirilir. Bu nedenle aynı istemciden gelen eşzamanlı hatalı denemeler, ikisinin de düz uyumsuzluk olarak yarışıp geçmesi yerine ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` değerindedir; localhost trafiğinin de hız sınırına tabi olmasını bilerek istediğinizde (test kurulumları veya katı proxy dağıtımları için) `false` olarak ayarlayın.
- Tarayıcı-kökenli WS kimlik doğrulama denemeleri her zaman loopback muafiyeti devre dışı bırakılarak kısıtlanır (tarayıcı tabanlı localhost kaba kuvvet denemelerine karşı derinlemesine savunma).
- loopback üzerinde, bu tarayıcı-kökenli kilitlemeler normalleştirilmiş `Origin`
  değeri başına yalıtılır; böylece bir localhost origin'inden gelen tekrarlı hatalar farklı bir origin'i otomatik olarak
  kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, loopback bind) veya `funnel` (genel, kimlik doğrulama gerektirir).
- `tailscale.serviceName`: Serve modu için isteğe bağlı Tailscale Service adı, örneğin
  `svc:openclaw`. Ayarlandığında, OpenClaw bunu `tailscale serve
--service` komutuna geçirir; böylece Control UI cihaz host adı yerine adlandırılmış bir Service üzerinden
  açığa çıkarılabilir. Değer Tailscale'in `svc:<dns-label>`
  Service adı biçimini kullanmalıdır; başlatma türetilen Service URL'sini bildirir.
- `tailscale.preserveFunnel`: `true` olduğunda ve `tailscale.mode = "serve"` iken, OpenClaw
  başlangıçta Serve'ü yeniden uygulamadan önce `tailscale funnel status` kontrol eder ve
  harici olarak yapılandırılmış bir Funnel rotası gateway bağlantı noktasını zaten kapsıyorsa bunu atlar.
  Varsayılan `false`.
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı-origin izin listesi. Genel loopback dışı tarayıcı origin'leri için gereklidir. loopback, RFC1918/link-local, `.local`, `.ts.net` veya Tailscale CGNAT host'larından yüklenen özel same-origin LAN/Tailnet UI'ları, Host-header yedeği etkinleştirilmeden kabul edilir.
- `controlUi.chatMessageMaxWidth`: gruplanmış Control UI sohbet iletileri için isteğe bağlı maksimum genişlik. `960px`, `82%`, `min(1280px, 82%)` ve `calc(100% - 2rem)` gibi sınırlandırılmış CSS genişlik değerlerini kabul eder.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: bilinçli olarak Host-header origin ilkesine dayanan dağıtımlar için Host-header origin yedeğini etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için genel host'larda `remote.url` `wss://` olmalıdır; düz metin `ws://` yalnızca loopback, LAN, link-local, `.local`, `.ts.net` ve Tailscale CGNAT host'ları için kabul edilir.
- `remote.remotePort`: uzak SSH host'undaki gateway bağlantı noktası. Varsayılan `18789`; yerel tünel bağlantı noktası uzak gateway bağlantı noktasından farklı olduğunda bunu kullanın.
- `gateway.remote.token` / `.password` uzak-istemci kimlik bilgisi alanlarıdır. Tek başlarına gateway kimlik doğrulamasını yapılandırmazlar.
- `gateway.push.apns.relay.baseUrl`: relay destekli iOS derlemeleri kayıtları gateway'e yayımladıktan sonra kullanılan harici APNs relay'i için temel HTTPS URL'si. Genel App Store/TestFlight derlemeleri barındırılan OpenClaw relay'ini kullanır. Özel relay URL'leri, relay URL'si bu relay'e işaret eden bilinçli olarak ayrı bir iOS derleme/dağıtım yoluyla eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: gateway'den relay'e gönderim zaman aşımı, milisaniye cinsinden. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir gateway kimliğine devredilir. Eşlenmiş iOS uygulaması `gateway.identity.get` getirir, bu kimliği relay kaydına dahil eder ve kayıt kapsamlı bir gönderim iznini gateway'e iletir. Başka bir gateway bu saklanan kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici env geçersiz kılmaları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL'leri için yalnızca geliştirme amaçlı kaçış yolu. Üretim relay URL'leri HTTPS üzerinde kalmalıdır.
- `gateway.handshakeTimeoutMs`: kimlik doğrulama öncesi Gateway WebSocket el sıkışma zaman aşımı, milisaniye cinsinden. Varsayılan: `15000`. Ayarlandığında `OPENCLAW_HANDSHAKE_TIMEOUT_MS` önceliklidir. Yerel istemcilerin, başlangıç ısınması hâlâ otururken bağlanabildiği yüklü veya düşük güçlü host'larda bunu artırın.
- `gateway.channelHealthCheckMinutes`: kanal sağlık izleyicisi aralığı, dakika cinsinden. Sağlık izleyicisi yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: bayat soket eşiği, dakika cinsinden. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına maksimum sağlık izleyicisi yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izleyiciyi etkin tutarken sağlık izleyicisi yeniden başlatmaları için kanal başına vazgeçme.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap başına geçersiz kılma. Ayarlandığında kanal düzeyi geçersiz kılmaya göre önceliklidir.
- Yerel gateway çağrı yolları, `gateway.auth.*` ayarlanmamışsa yalnızca yedek olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef ile açıkça yapılandırılmış ve çözümlenememişse, çözümleme kapalı şekilde başarısız olur (uzak yedek maskelemesi yoktur).
- `trustedProxies`: TLS'i sonlandıran veya forwarded-client başlıkları enjekte eden ters proxy IP'leri. Yalnızca kontrol ettiğiniz proxy'leri listeleyin. loopback girdileri aynı-host proxy/yerel algılama kurulumları için hâlâ geçerlidir (örneğin Tailscale Serve veya yerel bir ters proxy), ancak loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hale **getirmezler**.
- `allowRealIpFallback`: `true` olduğunda, `X-Forwarded-For` eksikse gateway `X-Real-IP` kabul eder. Kapalı şekilde başarısız olma davranışı için varsayılan `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: istenen kapsamlar olmadan ilk kez node cihaz eşleştirmesini otomatik onaylamak için isteğe bağlı CIDR/IP izin listesi. Ayarlanmadığında devre dışıdır. Bu, operatör/tarayıcı/Control UI/WebChat eşleştirmesini otomatik onaylamaz ve rol, kapsam, metadata veya public-key yükseltmelerini otomatik onaylamaz.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: eşleştirme ve platform izin listesi değerlendirmesi sonrasında bildirilen node komutları için global izin/veri biçimlendirmesi. `camera.snap`, `camera.clip` ve `screen.record` gibi tehlikeli node komutlarına dahil olmak için `allowCommands` kullanın; `denyCommands`, bir platform varsayılanı veya açık izin aksi halde dahil edecek olsa bile bir komutu kaldırır. Bir node bildirilen komut listesini değiştirdikten sonra, gateway'in güncellenmiş komut anlık görüntüsünü saklaması için o cihaz eşleştirmesini reddedip yeniden onaylayın.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek araç adları (varsayılan engelleme listesini genişletir).
- `gateway.tools.allow`: owner/admin çağırıcıları için varsayılan HTTP engelleme listesinden
  araç adlarını kaldırır. Bu, kimlik taşıyan `operator.write`
  çağırıcılarını owner/admin erişimine yükseltmez; `cron`, `gateway` ve `nodes`, izin listesine alınmış
  olsalar bile owner olmayan çağırıcılar için kullanılamaz kalır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Admin HTTP RPC: varsayılan olarak `admin-http-rpc` Plugin'i olarak kapalıdır. `POST /api/v1/admin/rpc` kaydetmek için Plugin'i etkinleştirin. Bkz. [Admin HTTP RPC](/tr/plugins/admin-http-rpc).
- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdisi güçlendirmesi:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarlanmamış kabul edilir; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt güçlendirme başlığı:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca kontrol ettiğiniz HTTPS origin'leri için ayarlayın; bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çoklu örnek yalıtımı

Benzersiz bağlantı noktaları ve durum dizinleriyle tek host üzerinde birden fazla gateway çalıştırın:

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

- `enabled`: gateway dinleyicisinde TLS sonlandırmayı etkinleştirir (HTTPS/WSS) (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel kendinden imzalı bir sertifika/anahtar çifti otomatik oluşturur; yalnızca yerel/geliştirme kullanımı içindir.
- `certPath`: TLS sertifika dosyasının dosya sistemi yolu.
- `keyPath`: TLS özel anahtar dosyasının dosya sistemi yolu; izinlerini kısıtlı tutun.
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
  - `"off"`: canlı düzenlemeleri yok say; değişiklikler açık bir yeniden başlatma gerektirir.
  - `"restart"`: yapılandırma değiştiğinde Gateway işlemini her zaman yeniden başlat.
  - `"hot"`: değişiklikleri yeniden başlatmadan işlem içinde uygula.
  - `"hybrid"` (varsayılan): önce sıcak yeniden yüklemeyi dene; gerekirse yeniden başlatmaya geri dön.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tamsayı).
- `deferralTimeoutMs`: yeniden başlatmayı veya kanal sıcak yeniden yüklemesini zorlamadan önce devam eden işlemleri beklemek için ms cinsinden isteğe bağlı en uzun süre. Varsayılan sınırlı beklemeyi (`300000`) kullanmak için bunu atlayın; süresiz beklemek ve hâlâ beklemede uyarılarını düzenli olarak günlüğe yazmak için `0` olarak ayarlayın.

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
Sorgu dizesi kanca tokenları reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, etkin Gateway paylaşılan giz kimlik doğrulamasından (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) farklı olmalıdır; başlangıç, yeniden kullanım algıladığında ölümcül olmayan bir güvenlik uyarısını günlüğe yazar.
- `openclaw security audit`, yalnızca denetim sırasında sağlanan Gateway parola kimlik doğrulaması (`--auth password --password <password>`) dahil olmak üzere kanca/Gateway kimlik doğrulaması yeniden kullanımını kritik bulgu olarak işaretler. Kalıcı hale getirilmiş yeniden kullanılan bir `hooks.token` değerini döndürmek için `openclaw doctor --fix` çalıştırın, ardından dış kanca göndericilerini yeni kanca tokenını kullanacak şekilde güncelleyin.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini kısıtlayın (örneğin `["hook:"]`).
- Bir eşleme veya ön ayar, şablonlu bir `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` ayarlayın ve `hooks.allowRequestSessionKey=true` yapın. Statik eşleme anahtarları bu açık katılımı gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükünden gelen `sessionKey`, yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` üzerinden çözümlenir
  - Şablonla işlenen eşleme `sessionKey` değerleri dışarıdan sağlanmış kabul edilir ve ayrıca `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Mapping details">

- `match.path`, `/hooks` sonrasındaki alt yolla eşleşir (örn. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanıyla eşleşir.
- `{{messages[0].subject}}` gibi şablonlar yükten okur.
- `transform`, bir kanca eylemi döndüren bir JS/TS modülüne işaret edebilir.
  - `transform.module` göreli bir yol olmalı ve `hooks.transformsDir` içinde kalmalıdır (mutlak yollar ve dizin dışına geçiş reddedilir).
  - `hooks.transformsDir` değerini `~/.openclaw/hooks/transforms` altında tutun; çalışma alanı skill dizinleri reddedilir. `openclaw doctor` bu yolu geçersiz olarak bildirirse dönüştürme modülünü kanca dönüştürmeleri dizinine taşıyın veya `hooks.transformsDir` değerini kaldırın.
- `agentId`, belirli bir aracıya yönlendirir; bilinmeyen kimlikler varsayılan aracıya geri döner.
- `allowedAgentIds`: `agentId` atlandığında varsayılan aracı yolu dahil olmak üzere etkin aracı yönlendirmesini kısıtlar (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan yapılan kanca aracı çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranlarının ve şablon odaklı eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin ver (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri (istek + eşleme) için isteğe bağlı önek izin listesi, örn. `["hook:"]`. Herhangi bir eşleme veya ön ayar şablonlu bir `sessionKey` kullandığında zorunlu hale gelir.
- `deliver: true`, son yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` olur.
- `model`, bu kanca çalıştırması için LLM değerini geçersiz kılar (model kataloğu ayarlıysa izin verilmiş olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail ön ayarı `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- İleti başına bu yönlendirmeyi korursanız `hooks.allowRequestSessionKey: true` ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanıyla eşleşecek şekilde kısıtlayın; örneğin `["hook:", "hook:gmail:"]`.
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

- Aracı tarafından düzenlenebilir HTML/CSS/JS ve A2UI öğelerini Gateway bağlantı noktası altında HTTP üzerinden sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` (varsayılan) olarak tutun.
- local loopback olmayan bağlamalar: canvas rotaları, diğer Gateway HTTP yüzeyleriyle aynı şekilde Gateway kimlik doğrulaması (token/parola/güvenilir proxy) gerektirir.
- Node WebView'leri genellikle kimlik doğrulama üstbilgileri göndermez; bir düğüm eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için düğüm kapsamlı yetenek URL'lerini duyurur.
- Yetenek URL'leri etkin düğüm WS oturumuna bağlıdır ve kısa sürede sona erer. IP tabanlı geri dönüş kullanılmaz.
- Sunulan HTML içine canlı yeniden yükleme istemcisini enjekte eder.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- A2UI'yi ayrıca `/__openclaw__/a2ui/` konumunda sunar.
- Değişiklikler bir Gateway yeniden başlatması gerektirir.
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
- `full`: `cliPath` + `sshPort` değerlerini dahil eder; LAN çok noktaya yayın duyurusu yine de yerleşik `bonjour` Plugin’in etkin olmasını gerektirir.
- `off`: Plugin etkinliğini değiştirmeden LAN çok noktaya yayın duyurusunu bastırır.
- Yerleşik `bonjour` Plugin, macOS ana makinelerinde otomatik başlar ve Linux, Windows ve kapsayıcılaştırılmış Gateway dağıtımlarında açık katılımlıdır.
- Ana makine adı, geçerli bir DNS etiketi olduğunda varsayılan olarak sistem ana makine adına ayarlanır; aksi durumda `openclaw` değerine geri döner. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

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
- Eksik/boş değişkenler yapılandırma yüklenirken hata fırlatır.
- Değişmez `${VAR}` için `$${VAR}` ile kaçış uygulayın.
- `$include` ile çalışır.

---

## Gizli anahtarlar

Gizli anahtar başvuruları eklemelidir: düz metin değerler hâlâ çalışır.

### `SecretRef`

Tek bir nesne şekli kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Doğrulama:

- `provider` deseni: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` kimlik deseni: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` kimliği: mutlak JSON pointer (örneğin `"/providers/openai/apiKey"`)
- `source: "exec"` kimlik deseni: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (AWS tarzı `secret#json_key` seçicilerini destekler)
- `source: "exec"` kimlikleri `.` veya `..` eğik çizgiyle sınırlandırılmış yol segmentleri içermemelidir (örneğin `a/../b` reddedilir)

### Desteklenen kimlik bilgisi yüzeyi

- Kanonik matris: [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)
- `secrets apply`, desteklenen `openclaw.json` kimlik bilgisi yollarını hedefler.
- `auth-profiles.json` başvuruları çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.

### Gizli anahtar sağlayıcıları yapılandırması

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
- Windows ACL doğrulaması kullanılamadığında dosya ve exec sağlayıcı yolları güvenli biçimde kapalı başarısız olur. `allowInsecurePath: true` değerini yalnızca doğrulanamayan güvenilir yollar için ayarlayın.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yükleri kullanır.
- Varsayılan olarak sembolik bağlantı komut yolları reddedilir. Çözümlenen hedef yolu doğrulanırken sembolik bağlantı yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın.
- `trustedDirs` yapılandırılmışsa güvenilir dizin denetimi çözümlenen hedef yola uygulanır.
- `exec` alt ortamı varsayılan olarak en düşük düzeydedir; gerekli değişkenleri `passEnv` ile açıkça geçirin.
- Gizli anahtar başvuruları etkinleştirme sırasında bellek içi bir anlık görüntüye çözümlenir; ardından istek yolları yalnızca anlık görüntüyü okur.
- Etkin yüzey filtreleme etkinleştirme sırasında uygulanır: etkin yüzeylerdeki çözümlenmemiş başvurular başlatma/yeniden yüklemeyi başarısız kılar; etkin olmayan yüzeyler ise tanılamalarla atlanır.

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
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyinde refs destekler (`api_key` için `keyRef`, `token` için `tokenRef`).
- `{ "provider": { "apiKey": "..." } }` gibi eski düz `auth-profiles.json` eşlemeleri bir çalışma zamanı biçimi değildir; `openclaw doctor --fix` bunları `.legacy-flat.*.bak` yedeğiyle birlikte standart `provider:default` API anahtarı profillerine yeniden yazar.
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

- `billingBackoffHours`: bir profil gerçek
  faturalandırma/yetersiz kredi hataları nedeniyle başarısız olduğunda saat cinsinden temel geri çekilme süresi (varsayılan: `5`). Açık faturalandırma metni,
  `401`/`403` yanıtlarında bile yine buraya düşebilir, ancak sağlayıcıya özel metin
  eşleyiciler onları sahibi olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter
  `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya
  kuruluş/çalışma alanı harcama limiti mesajları bunun yerine
  `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalandırma geri çekilme saatleri için isteğe bağlı sağlayıcı başına geçersiz kılmalar.
- `billingMaxHours`: faturalandırma geri çekilmesinin üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenilirlikli `auth_permanent` hataları için dakika cinsinden temel geri çekilme süresi (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan saat cinsinden kayan pencere (varsayılan: `24`).
- `overloadedProfileRotations`: model yedeğine geçmeden önce aşırı yük hataları için aynı sağlayıcı içindeki en fazla auth-profile rotasyonu (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı meşgul biçimleri buraya düşer.
- `overloadedBackoffMs`: aşırı yüklü bir sağlayıcı/profil rotasyonunu yeniden denemeden önceki sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model yedeğine geçmeden önce oran sınırı hataları için aynı sağlayıcı içindeki en fazla auth-profile rotasyonu (varsayılan: `1`). Bu oran sınırı kovası `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

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
- `maxFileBytes`: rotasyon öncesinde etkin günlük dosyasının bayt cinsinden en büyük boyutu (pozitif tamsayı; varsayılan: `104857600` = 100 MB). OpenClaw, etkin dosyanın yanında en fazla beş numaralı arşiv tutar.
- `redactSensitive` / `redactPatterns`: konsol çıktısı, dosya günlükleri, OTLP günlük kayıtları ve kalıcı oturum transcript metni için en iyi çaba maskelemesi. `redactSensitive: "off"` yalnızca bu genel günlük/transcript politikasını devre dışı bırakır; UI/araç/tanılama güvenlik yüzeyleri sırları yayımlamadan önce yine de redakte eder.

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
- `stuckSessionWarnMs`: uzun süren işleme oturumlarını `session.long_running`, `session.stalled` veya `session.stuck` olarak sınıflandırmak için ms cinsinden ilerleme yok yaşı eşiği. Yanıt, araç, durum, blok ve ACP ilerlemesi zamanlayıcıyı sıfırlar; tekrarlanan `session.stuck` tanılamaları değişiklik olmadığında geri çekilir.
- `stuckSessionAbortMs`: kurtarma için uygun durmuş etkin işin abort-drain edilebilmesinden önce ms cinsinden ilerleme yok yaşı eşiği. Ayarlanmadığında OpenClaw, en az 5 dakika ve `stuckSessionWarnMs` değerinin 3 katı olan daha güvenli genişletilmiş gömülü çalıştırma penceresini kullanır.
- `memoryPressureSnapshot`: bellek baskısı `critical` düzeyine ulaştığında redakte edilmiş bir OOM öncesi kararlılık anlık görüntüsü yakalar (varsayılan: `false`). Normal bellek baskısı olaylarını korurken kararlılık paketi dosya taramasını/yazımını eklemek için `true` olarak ayarlayın.
- `otel.enabled`: OpenTelemetry dışa aktarma işlem hattını etkinleştirir (varsayılan: `false`). Tam yapılandırma, sinyal kataloğu ve gizlilik modeli için bkz. [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry).
- `otel.endpoint`: OTel dışa aktarımı için toplayıcı URL'si.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: isteğe bağlı sinyale özel OTLP uç noktaları. Ayarlandıklarında, yalnızca ilgili sinyal için `otel.endpoint` değerini geçersiz kılarlar.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC metadata başlıkları.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarımını etkinleştirir.
- `otel.logsExporter`: günlük dışa aktarma hedefi: `"otlp"` (varsayılan), stdout satırı başına bir JSON nesnesi için `"stdout"` veya `"both"`.
- `otel.sampleRate`: iz örnekleme oranı `0`-`1`.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri boşaltma aralığı.
- `otel.captureContent`: OTEL span öznitelikleri için açık onaylı ham içerik yakalama. Varsayılan olarak kapalıdır. Boolean `true`, sistem dışı mesaj/araç içeriğini yakalar; nesne biçimi `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` ve `toolDefinitions` değerlerini açıkça etkinleştirmenizi sağlar.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: `{gen_ai.operation.name} {gen_ai.request.model}` span adları, `CLIENT` span türü ve eski `gen_ai.system` yerine `gen_ai.provider.name` dahil olmak üzere en yeni deneysel GenAI çıkarım span biçimi için ortam anahtarı. Varsayılan olarak span'ler uyumluluk için `openclaw.model.call` ve `gen_ai.system` değerlerini korur; GenAI metrikleri sınırlı semantik öznitelikler kullanır.
- `OPENCLAW_OTEL_PRELOADED=1`: zaten genel bir OpenTelemetry SDK kaydetmiş ana makineler için ortam anahtarı. OpenClaw bu durumda tanılama dinleyicilerini etkin tutarken Plugin sahipli SDK başlatma/kapatma adımlarını atlar.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` ve `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: eşleşen yapılandırma anahtarı ayarlanmadığında kullanılan sinyale özel uç nokta ortam değişkenleri.
- `cacheTrace.enabled`: gömülü çalıştırmalar için cache trace anlık görüntülerini günlüğe kaydet (varsayılan: `false`).
- `cacheTrace.filePath`: cache trace JSONL için çıktı yolu (varsayılan: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: cache trace çıktısına nelerin dahil edileceğini denetler (tümünün varsayılanı: `true`).

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

- `channel`: npm/git kurulumları için yayın kanalı - `"stable"`, `"beta"` veya `"dev"`.
- `checkOnStart`: gateway başlatıldığında npm güncellemelerini denetle (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka plan otomatik güncellemeyi etkinleştir (varsayılan: `false`).
- `auto.stableDelayHours`: stable kanal otomatik uygulaması öncesi saat cinsinden en az gecikme (varsayılan: `6`; en fazla: `168`).
- `auto.stableJitterHours`: saat cinsinden ek stable kanal yayılım penceresi (varsayılan: `12`; en fazla: `168`).
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

- `enabled`: genel ACP özellik kapısı (varsayılan: `true`; ACP dispatch ve spawn olanaklarını gizlemek için `false` ayarlayın).
- `dispatch.enabled`: ACP oturum turn dispatch için bağımsız kapı (varsayılan: `true`). Yürütmeyi engellerken ACP komutlarını kullanılabilir tutmak için `false` ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı backend kimliği (kayıtlı bir ACP çalışma zamanı Plugin ile eşleşmelidir).
  Önce backend Plugin'i kurun ve `plugins.allow` ayarlanmışsa backend Plugin kimliğini (örneğin `acpx`) dahil edin; aksi halde ACP backend yüklenmez.
- `defaultAgent`: spawn'lar açık bir hedef belirtmediğinde yedek ACP hedef ajan kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen ajan kimliklerinin izin listesi; boş olması ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: aynı anda etkin olabilecek en fazla ACP oturumu.
- `stream.coalesceIdleMs`: akışlı metin için ms cinsinden boşta flush penceresi.
- `stream.maxChunkChars`: akışlı blok projeksiyonu bölünmeden önce en büyük parça boyutu.
- `stream.repeatSuppression`: turn başına tekrarlanan durum/araç satırlarını bastır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı akış yapar; `"final_only"` turn terminal olaylarına kadar tamponlar.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önceki ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP turn başına projelendirilen en fazla asistan çıktı karakteri.
- `stream.maxSessionUpdateChars`: projelendirilen ACP durum/güncelleme satırları için en fazla karakter.
- `stream.tagVisibility`: akışlı olaylar için tag adlarından boolean görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum worker'larının uygun temizleme öncesi dakika cinsinden boşta TTL değeri.
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
  - `"off"`: slogan metni yoktur (banner başlığı/sürümü yine gösterilir).
- Banner’ın tamamını gizlemek için (yalnızca sloganları değil), `OPENCLAW_HIDE_BANNER=1` env değerini ayarlayın.

---

## Sihirbaz

CLI kılavuzlu kurulum akışları (`onboard`, `configure`, `doctor`) tarafından yazılan metadata:

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

Geçerli derlemeler artık TCP köprüsünü içermez. Nodes, Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık config şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları çıkarabilir).

<Accordion title="Eski köprü config’i (tarihsel başvuru)">

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
    maxConcurrentRuns: 8, // varsayılan; cron dispatch + yalıtılmış cron agent-turn yürütmesi
    webhook: "https://example.invalid/legacy", // depolanan notify:true işleri için kullanımdan kaldırılmış fallback
    webhookToken: "replace-with-dedicated-token", // giden webhook kimlik doğrulaması için isteğe bağlı bearer token
    sessionRetention: "24h", // duration string veya false
    runLog: {
      maxBytes: "2mb", // varsayılan 2_000_000 bayt
      keepLines: 2000, // varsayılan 2000
    },
  },
}
```

- `sessionRetention`: tamamlanan yalıtılmış cron çalıştırma oturumlarının `sessions.json` içinden budanmadan önce ne kadar tutulacağını belirtir. Arşivlenmiş silinmiş cron transcript’lerinin temizliğini de denetler. Varsayılan: `24h`; devre dışı bırakmak için `false` ayarlayın.
- `runLog.maxBytes`: eski dosya destekli cron çalıştırma günlükleriyle uyumluluk için kabul edilir. Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: iş başına tutulan en yeni SQLite çalıştırma geçmişi satırları. Varsayılan: `2000`.
- `webhookToken`: cron webhook POST teslimi (`delivery.mode = "webhook"`) için kullanılan bearer token; atlanırsa auth header gönderilmez.
- `webhook`: hâlâ `notify: true` içeren depolanmış işleri taşımak için `openclaw doctor --fix` tarafından kullanılan, kullanımdan kaldırılmış eski fallback webhook URL’si (http/https); runtime teslimi iş başına `delivery.mode="webhook"` ile `delivery.to` kullanır veya announce teslimini korurken `delivery.completionDestination` kullanır.

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

- `maxAttempts`: geçici hatalarda cron işleri için maksimum yeniden deneme sayısı (varsayılan: `3`; aralık: `0`-`10`).
- `backoffMs`: her yeniden deneme girişimi için ms cinsinden backoff gecikmeleri dizisi (varsayılan: `[30000, 60000, 300000]`; 1-10 girdi).
- `retryOn`: yeniden denemeleri tetikleyen hata türleri - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Tüm geçici türleri yeniden denemek için atlayın.

Tek seferlik işler, yeniden deneme girişimleri tükenene kadar etkin kalır, ardından son hata durumunu koruyarak devre dışı kalır. Yinelenen işler, bir sonraki zamanlanmış yuvalarından önce backoff sonrasında yeniden çalışmak için aynı geçici yeniden deneme ilkesini kullanır; kalıcı hatalar veya tükenmiş geçici yeniden denemeler, hata backoff ile normal yinelenen takvime geri döner.

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
- `includeSkipped`: ardışık atlanan çalıştırmaları uyarı eşiğine dahil eder (varsayılan: `false`). Atlanan çalıştırmalar ayrı izlenir ve yürütme hatası backoff’unu etkilemez.
- `mode`: teslim modu - `"announce"` bir kanal mesajı üzerinden gönderir; `"webhook"` yapılandırılmış webhook’a post eder.
- `accountId`: uyarı teslimini kapsamlamak için isteğe bağlı hesap veya kanal id’si.

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
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi varsa varsayılan olarak `"announce"` olur.
- `channel`: announce teslimi için kanal override’ı. `"last"` bilinen son teslim kanalını yeniden kullanır.
- `to`: açık announce hedefi veya webhook URL’si. Webhook modu için gereklidir.
- `accountId`: teslim için isteğe bağlı hesap override’ı.
- İş başına `delivery.failureDestination` bu global varsayılanı override eder.
- Ne global ne de iş başına hata hedefi ayarlandığında, zaten `announce` ile teslim eden işler hata durumunda o birincil announce hedefine geri döner.
- `delivery.failureDestination`, işin birincil `delivery.mode` değeri `"webhook"` olmadığı sürece yalnızca `sessionTarget="isolated"` işleri için desteklenir.

[Cron İşleri](/tr/automation/cron-jobs) bölümüne bakın. Yalıtılmış cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya modeli şablon değişkenleri

`tools.media.models[].args` içinde genişletilen şablon placeholder’ları:

| Değişken           | Açıklama                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Gelen tam mesaj gövdesi                           |
| `{{RawBody}}`      | Ham gövde (geçmiş/gönderen sarmalayıcıları yok)   |
| `{{BodyStripped}}` | Grup bahsetmeleri çıkarılmış gövde                |
| `{{From}}`         | Gönderen tanımlayıcısı                            |
| `{{To}}`           | Hedef tanımlayıcısı                               |
| `{{MessageSid}}`   | Kanal mesaj id’si                                 |
| `{{SessionId}}`    | Geçerli oturum UUID’si                            |
| `{{IsNewSession}}` | Yeni oturum oluşturulduğunda `"true"`             |
| `{{MediaUrl}}`     | Gelen medya sözde URL’si                          |
| `{{MediaPath}}`    | Yerel medya yolu                                  |
| `{{MediaType}}`    | Medya türü (image/audio/document/…)               |
| `{{Transcript}}`   | Ses transcript’i                                  |
| `{{Prompt}}`       | CLI girdileri için çözümlenmiş medya prompt’u     |
| `{{MaxChars}}`     | CLI girdileri için çözümlenmiş maksimum çıktı karakterleri |
| `{{ChatType}}`     | `"direct"` veya `"group"`                         |
| `{{GroupSubject}}` | Grup konusu (en iyi çaba)                         |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (en iyi çaba)             |
| `{{SenderName}}`   | Gönderen görünen adı (en iyi çaba)                |
| `{{SenderE164}}`   | Gönderen telefon numarası (en iyi çaba)           |
| `{{Provider}}`     | Provider ipucu (whatsapp, telegram, discord vb.)  |

---

## Config include’ları (`$include`)

Config’i birden fazla dosyaya bölün:

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
- Dosya dizisi: sırayla deep-merge uygulanır (sonrakiler öncekileri override eder).
- Kardeş anahtarlar: include’lardan sonra birleştirilir (include edilen değerleri override eder).
- İç içe include’lar: 10 düzeye kadar derinlik.
- Yollar: include eden dosyaya göre çözümlenir, ancak üst düzey config dizininin (`openclaw.json` için `dirname`) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca yine bu sınırın içinde çözümlendiklerinde izin verilir. Yollar null byte içermemeli ve çözümlemeden önce ve sonra kesinlikle 4096 karakterden kısa olmalıdır.
- Tek dosyalı include tarafından desteklenen yalnızca bir üst düzey bölümü değiştiren OpenClaw’a ait yazmalar, o include edilen dosyaya yazılır. Örneğin, `plugins install`, `plugins: { $include: "./plugins.json5" }` öğesini `plugins.json5` içinde günceller ve `openclaw.json` dosyasını olduğu gibi bırakır.
- Root include’ları, include dizileri ve kardeş override’ları olan include’lar OpenClaw’a ait yazmalar için salt okunurdur; bu yazmalar config’i düzleştirmek yerine kapalı başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları, döngüsel include’lar, geçersiz yol biçimi ve aşırı uzunluk için net mesajlar.

---

_İlgili: [Configuration](/tr/gateway/configuration) · [Configuration Examples](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Configuration](/tr/gateway/configuration)
- [Configuration examples](/tr/gateway/configuration-examples)
