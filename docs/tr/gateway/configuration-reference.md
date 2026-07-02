---
read_when:
    - Tam alan düzeyinde yapılandırma semantiğine veya varsayılan değerlere ihtiyacınız var
    - Kanal, model, gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Temel OpenClaw anahtarları, varsayılanlar ve ayrılmış alt sistem başvurularına bağlantılar için Gateway yapılandırma başvurusu
title: Yapılandırma başvurusu
x-i18n:
    generated_at: "2026-07-02T01:11:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d15cc968bc89a7a490a5eaf571d5f38d052ad8783fcc7de5ca17d08ac04bfcc7
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` için çekirdek yapılandırma referansı. Görev odaklı bir genel bakış için bkz. [Yapılandırma](/tr/gateway/configuration).

Ana OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendi daha derin referansı olduğunda ilgili bağlantılara yönlendirir. Kanal ve plugin sahipli komut katalogları ile derin bellek/QMD ayarları bu sayfa yerine kendi sayfalarında bulunur.

Kod gerçeği:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema'yı yazdırır; mevcut olduğunda bundled/plugin/kanal meta verileri birleştirilir
- `config.schema.lookup`, ayrıntıya inme araçları için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, config-doc taban çizgisi hash'ini geçerli şema yüzeyine göre doğrular

Ajan arama yolu: düzenlemelerden önce tam alan düzeyi belgeler ve kısıtlamalar için
`gateway` araç eylemi `config.schema.lookup` kullanın. Görev odaklı rehberlik için
[Yapılandırma](/tr/gateway/configuration) sayfasını; daha geniş alan haritası,
varsayılanlar ve alt sistem referanslarına bağlantılar için bu sayfayı kullanın.

Özel derin referanslar:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki dreaming yapılandırması için [Bellek yapılandırma referansı](/tr/reference/memory-config)
- Geçerli yerleşik + bundled komut kataloğu için [Eğik çizgi komutları](/tr/tools/slash-commands)
- Kanala özgü komut yüzeyleri için sahip kanal/plugin sayfaları

Yapılandırma biçimi **JSON5**'tir (yorumlara + sondaki virgüllere izin verilir). Tüm alanlar isteğe bağlıdır - OpenClaw atlandıklarında güvenli varsayılanlar kullanır.

---

## Kanallar

Kanal başına yapılandırma anahtarları özel bir sayfaya taşındı - Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage ve diğer bundled kanallar dahil `channels.*`
için [Yapılandırma - kanallar](/tr/gateway/config-channels) sayfasına bakın
(kimlik doğrulama, erişim denetimi, çoklu hesap, bahsetme kapısı).

## Ajan varsayılanları, çoklu ajan, oturumlar ve iletiler

Özel bir sayfaya taşındı - şunlar için
[Yapılandırma - ajanlar](/tr/gateway/config-agents) sayfasına bakın:

- `agents.defaults.*` (çalışma alanı, model, düşünme, heartbeat, bellek, medya, Skills, sandbox)
- `multiAgent.*` (çoklu ajan yönlendirmesi ve bağlamaları)
- `session.*` (oturum yaşam döngüsü, compaction, budama)
- `messages.*` (ileti teslimi, TTS, markdown işleme)
- `talk.*` (Talk modu)
  - `talk.consultThinkingLevel`: Control UI Talk gerçek zamanlı danışmalarının arkasındaki tam OpenClaw ajan çalışması için düşünme düzeyi geçersiz kılması
  - `talk.consultFastMode`: Control UI Talk gerçek zamanlı danışmaları için tek seferlik hızlı mod geçersiz kılması
  - `talk.speechLocale`: iOS/macOS üzerinde Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği
  - `talk.silenceTimeoutMs`: ayarlanmadığında Talk, transkripti göndermeden önce platform varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`)
  - `talk.realtime.consultRouting`: `openclaw_agent_consult` atlayan tamamlanmış gerçek zamanlı Talk transkriptleri için Gateway aktarma yedeği

## Araçlar ve özel sağlayıcılar

Araç ilkesi, deneysel geçişler, sağlayıcı destekli araç yapılandırması ve özel
sağlayıcı / temel URL kurulumu özel bir sayfaya taşındı - bkz.
[Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## Modeller

Sağlayıcı tanımları, model izin listeleri ve özel sağlayıcı kurulumu
[Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls)
içinde bulunur. `models` kökü ayrıca genel model kataloğu davranışını yönetir.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: sağlayıcı kataloğu davranışı (`merge` veya `replace`).
- `models.providers`: sağlayıcı kimliğine göre anahtarlanan özel sağlayıcı eşlemesi.
- `models.providers.*.localService`: yerel model sunucuları için isteğe bağlı,
  talep üzerine çalışan süreç yöneticisi. OpenClaw yapılandırılan sağlık uç
  noktasını yoklar, gerektiğinde mutlak `command` komutunu başlatır, hazır olmayı
  bekler ve ardından model isteğini gönderir. Bkz. [Yerel model hizmetleri](/tr/gateway/local-model-services).
- `models.pricing.enabled`: sidecar'lar ve kanallar Gateway hazır yoluna
  ulaştıktan sonra başlayan arka plan fiyatlandırma önyüklemesini denetler.
  `false` olduğunda Gateway, OpenRouter ve LiteLLM fiyatlandırma kataloğu
  getirmelerini atlar; yapılandırılmış `models.providers.*.models[].cost`
  değerleri yerel maliyet tahminleri için çalışmaya devam eder.

## MCP

OpenClaw tarafından yönetilen MCP sunucu tanımları `mcp.servers` altında bulunur
ve gömülü OpenClaw ile diğer çalışma zamanı bağdaştırıcıları tarafından kullanılır.
`openclaw mcp list`, `show`, `set` ve `unset` komutları, yapılandırma
düzenlemeleri sırasında hedef sunucuya bağlanmadan bu bloğu yönetir.

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

- `mcp.servers`: yapılandırılmış MCP araçlarını açığa çıkaran çalışma zamanları
  için adlandırılmış stdio veya uzak MCP sunucu tanımları.
  Uzak girdiler `transport: "streamable-http"` veya `transport: "sse"` kullanır;
  `type: "http"`, `openclaw mcp set` ve `openclaw doctor --fix` tarafından
  kanonik `transport` alanına normalleştirilen CLI yerel bir takma addır.
- `mcp.servers.<name>.enabled`: kaydedilmiş bir sunucu tanımını korurken onu
  gömülü OpenClaw MCP keşfinden ve araç projeksiyonundan hariç tutmak için
  `false` olarak ayarlayın.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: sunucu başına MCP isteği
  zaman aşımı, saniye veya milisaniye cinsinden.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: sunucu başına
  bağlantı zaman aşımı, saniye veya milisaniye cinsinden.
- `mcp.servers.<name>.supportsParallelToolCalls`: paralel MCP araç çağrıları
  yapıp yapmamayı seçebilen bağdaştırıcılar için isteğe bağlı eşzamanlılık ipucu.
- `mcp.servers.<name>.auth`: OAuth gerektiren HTTP MCP sunucuları için `"oauth"`
  olarak ayarlayın. Belirteçleri OpenClaw durumu altında saklamak için
  `openclaw mcp login <name>` çalıştırın.
- `mcp.servers.<name>.oauth`: isteğe bağlı OAuth kapsamı, yönlendirme URL'si ve
  istemci meta veri URL'si geçersiz kılmaları.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: özel uç noktalar ve
  karşılıklı TLS için HTTP TLS denetimleri.
- `mcp.servers.<name>.toolFilter`: isteğe bağlı sunucu başına araç seçimi.
  `include`, keşfedilen MCP araçlarını eşleşen adlarla sınırlar; `exclude`,
  eşleşen adları gizler. Girdiler tam MCP araç adları veya basit `*` glob'larıdır.
  Kaynaklara veya prompt'lara sahip sunucular ayrıca yardımcı araç adları
  (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) oluşturur
  ve bu adlar aynı filtreyi kullanır.
- `mcp.servers.<name>.codex`: isteğe bağlı Codex uygulama sunucusu projeksiyon
  denetimleri. Bu blok yalnızca Codex uygulama sunucusu iş parçacıkları için
  OpenClaw meta verisidir; ACP oturumlarını, genel Codex harness yapılandırmasını
  veya diğer çalışma zamanı bağdaştırıcılarını etkilemez. Boş olmayan
  `codex.agents`, sunucuyu listelenen OpenClaw ajan kimlikleriyle sınırlar. Boş,
  boşluklardan oluşan veya geçersiz kapsamlı ajan listeleri, genel hale gelmek
  yerine yapılandırma doğrulaması tarafından reddedilir ve çalışma zamanı
  projeksiyon yolu tarafından atlanır. `codex.defaultToolsApprovalMode`, bu
  sunucu için Codex'in yerel `default_tools_approval_mode` değerini yayar.
  OpenClaw, yerel `mcp_servers` yapılandırmasını Codex'e iletmeden önce `codex`
  bloğunu kaldırır. Sunucunun her Codex uygulama sunucusu ajanı için Codex'in
  varsayılan MCP onay davranışıyla projekte edilmesini sağlamak için bloğu
  atlayın.
- `mcp.sessionIdleTtlMs`: oturum kapsamlı paketlenmiş MCP çalışma zamanları için
  boşta kalma TTL değeri. Tek seferlik gömülü çalıştırmalar, çalıştırma sonu
  temizliği ister; bu TTL uzun ömürlü oturumlar ve gelecekteki çağıranlar için
  güvenlik ağıdır.
- `mcp.*` altındaki değişiklikler, önbelleğe alınmış oturum MCP çalışma
  zamanlarını elden çıkararak sıcak uygulanır. Sonraki araç keşfi/kullanımı
  bunları yeni yapılandırmadan yeniden oluşturur, böylece kaldırılan
  `mcp.servers` girdileri boşta kalma TTL'sini beklemek yerine hemen temizlenir.
- Çalışma zamanı keşfi, o oturum için önbelleğe alınmış kataloğu düşürerek MCP
  araç listesi değişiklik bildirimlerini de dikkate alır. Kaynakları veya
  prompt'ları duyuran sunucular, kaynakları listelemek/okumak ve prompt'ları
  listelemek/getirmek için yardımcı araçlar alır. Yinelenen araç çağrısı
  hataları, başka bir çağrı denenmeden önce etkilenen sunucuyu kısa süreliğine
  duraklatır.

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
- `load.allowSymlinkTargets`: bağlantı yapılandırılmış kaynak kökünün dışında
  bulunduğunda Skill sembolik bağlantılarının çözümlenebileceği güvenilir gerçek
  hedef kökler.
- `workshop.allowSymlinkTargetWrites`: Skill Workshop uygulamasının, zaten
  güvenilen sembolik bağlantı hedefleri üzerinden yazmasına izin verir
  (varsayılan: false).
- `install.preferBrew`: true olduğunda, `brew` mevcutsa diğer yükleyici türlerine
  geri dönmeden önce Homebrew yükleyicilerini tercih eder.
- `install.nodeManager`: `metadata.openclaw.install` belirtimleri için node
  yükleyici tercihi (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: güvenilir `operator.admin` Gateway
  istemcilerinin `skills.upload.*` üzerinden hazırlanmış özel zip arşivlerini
  yüklemesine izin verir (varsayılan: false). Bu yalnızca yüklenen arşiv yolunu
  etkinleştirir; normal ClawHub yüklemeleri bunu gerektirmez.
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

- `~/.openclaw/extensions` ve `<workspace>/.openclaw/extensions` altındaki paket veya bundle dizinlerinden, ayrıca `plugins.load.paths` içinde listelenen dosya veya dizinlerden yüklenir.
- Bağımsız Plugin dosyalarını `plugins.load.paths` içine koyun; otomatik keşfedilen extension kökleri, bu köklerdeki yardımcı betiklerin başlatmayı engellememesi için üst düzey `.js`, `.mjs` ve `.ts` dosyalarını yok sayar.
- Keşif, native OpenClaw Plugin'leri ile uyumlu Codex bundle'larını ve Claude bundle'larını kabul eder; buna manifest içermeyen Claude varsayılan yerleşimli bundle'lar da dahildir.
- **Config değişiklikleri gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen Plugin'ler yüklenir). `deny` önceliklidir.
- `plugins.entries.<id>.apiKey`: Plugin düzeyinde API anahtarı kolaylık alanı (Plugin tarafından desteklendiğinde).
- `plugins.entries.<id>.env`: Plugin kapsamlı env var eşlemesi.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda core, `before_prompt_build` işlemini engeller ve legacy `before_agent_start` kaynaklı prompt değiştiren alanları yok sayarken legacy `modelOverride` ve `providerOverride` değerlerini korur. Native Plugin hook'ları ve desteklenen bundle tarafından sağlanan hook dizinleri için geçerlidir.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` olduğunda, güvenilen ve bundle olmayan Plugin'ler `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` ve `agent_end` gibi typed hook'lardan ham konuşma içeriğini okuyabilir.
- `plugins.entries.<id>.subagent.allowModelOverride`: Bu Plugin'e, arka plan subagent çalıştırmaları için çalıştırma başına `provider` ve `model` override'ları istemesi konusunda açıkça güvenin.
- `plugins.entries.<id>.subagent.allowedModels`: Güvenilen subagent override'ları için canonical `provider/model` hedeflerinin isteğe bağlı izin listesi. `"*"` değerini yalnızca bilerek herhangi bir modele izin vermek istediğinizde kullanın.
- `plugins.entries.<id>.llm.allowModelOverride`: Bu Plugin'e, `api.runtime.llm.complete` için model override'ları istemesi konusunda açıkça güvenin.
- `plugins.entries.<id>.llm.allowedModels`: Güvenilen Plugin LLM tamamlama override'ları için canonical `provider/model` hedeflerinin isteğe bağlı izin listesi. `"*"` değerini yalnızca bilerek herhangi bir modele izin vermek istediğinizde kullanın.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: Bu Plugin'e, `api.runtime.llm.complete` işlemini varsayılan olmayan bir agent id ile çalıştırması konusunda açıkça güvenin.
- `plugins.entries.<id>.config`: Plugin tarafından tanımlanan config nesnesi (mevcut olduğunda native OpenClaw Plugin şeması tarafından doğrulanır).
- Channel Plugin hesabı/runtime ayarları `channels.<id>` altında bulunur ve merkezi bir OpenClaw seçenek registry'si tarafından değil, sahip Plugin'in manifest `channelConfigs` metadata'sı tarafından açıklanmalıdır.

### Codex harness Plugin config

Bundle olarak gelen `codex` Plugin'i, native Codex app-server harness ayarlarının sahibidir:
`plugins.entries.codex.config`. Tam config yüzeyi için
[Codex harness başvurusu](/tr/plugins/codex-harness-reference) ve runtime modeli için
[Codex harness](/tr/plugins/codex-harness) sayfasına bakın.

`codexPlugins` yalnızca native Codex harness'ını seçen oturumlara uygulanır.
OpenClaw provider çalıştırmaları, ACP konuşma bağlamaları veya Codex olmayan herhangi bir harness için Codex Plugin'lerini etkinleştirmez.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: Codex harness için native Codex
  Plugin/app desteğini etkinleştirir. Varsayılan: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  migrate edilmiş Plugin app elicitations için varsayılan destructive-action politikası.
  Prompt göstermeden güvenli Codex approval şemalarını kabul etmek için `true`, bunları reddetmek için `false`,
  Codex tarafından gereken approval'ları OpenClaw Plugin approval'ları üzerinden yönlendirmek için `"auto"` veya
  kalıcı approval olmadan her Plugin write/destructive action için prompt göstermek üzere `"ask"` kullanın.
  `"ask"` modu, etkilenen app için kalıcı Codex araç başına approval override'larını temizler ve
  Codex thread başlamadan önce o app için human approvals reviewer'ı seçer.
  Varsayılan: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: global
  `codexPlugins.enabled` de true olduğunda migrate edilmiş bir Plugin girişini etkinleştirir.
  Varsayılan: açık girişler için `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  kararlı marketplace kimliği. V1 yalnızca `"openai-curated"` destekler.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: migration'dan gelen kararlı
  Codex Plugin kimliği; örneğin `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  Plugin başına destructive-action override'ı. Atlandığında global
  `allow_destructive_actions` değeri kullanılır. Plugin başına değer aynı
  `true`, `false`, `"auto"` veya `"ask"` politikalarını kabul eder.

`"ask"` kullanan kabul edilmiş her Plugin app, o app'in approval isteklerini
human reviewer'a yönlendirir. Diğer app'ler ve app dışı thread approval'ları
yapılandırılmış reviewer'larını korur; böylece karma Plugin politikaları `"ask"` davranışını devralmaz.

`codexPlugins.enabled` global etkinleştirme yönergesidir. Migration tarafından yazılan açık Plugin
girişleri, kalıcı install ve repair eligibility kümesidir.
`plugins["*"]` desteklenmez, `install` anahtarı yoktur ve yerel
`marketplacePath` değerleri host'a özgü oldukları için bilerek config alanları değildir.

`app/list` readiness kontrolleri bir saat önbelleğe alınır ve stale olduğunda
asenkron olarak yenilenir. Codex thread app config'i her turn'de değil, Codex harness
oturumu kurulurken hesaplanır; native Plugin config değiştikten sonra `/new`, `/reset` veya gateway
yeniden başlatması kullanın.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider ayarları.
  - `apiKey`: Daha yüksek limitler için isteğe bağlı Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` env var değerine fallback yapar.
  - `baseUrl`: Firecrawl API base URL (varsayılan: `https://api.firecrawl.dev`; self-hosted override'lar private/internal endpoint'leri hedeflemelidir).
  - `onlyMainContent`: Sayfalardan yalnızca ana içeriği çıkarır (varsayılan: `true`).
  - `maxAgeMs`: Maksimum cache yaşı, milisaniye cinsinden (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: Scrape isteği zaman aşımı, saniye cinsinden (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web search) ayarları.
  - `enabled`: X Search provider'ını etkinleştirir.
  - `model`: Arama için kullanılacak Grok modeli (örn. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: memory dreaming ayarları. Aşamalar ve eşikler için [Dreaming](/tr/concepts/dreaming) sayfasına bakın.
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: Her tam dreaming sweep için cron sıklığı (varsayılan `"0 3 * * *"`).
  - `model`: isteğe bağlı Dream Diary subagent model override'ı. `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir; hedefleri sınırlamak için `allowedModels` ile eşleştirin. Model kullanılamıyor hataları, oturumun varsayılan modeliyle bir kez yeniden denenir; güven veya izin listesi hataları sessizce fallback yapmaz.
  - Aşama politikası ve eşikler implementation detail'dır (kullanıcıya dönük config anahtarları değildir).
- Tam memory config [Memory configuration reference](/tr/reference/memory-config) içinde bulunur:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude bundle Plugin'leri, `settings.json` üzerinden gömülü OpenClaw varsayılanları da katkı olarak sağlayabilir; OpenClaw bunları ham OpenClaw config patch'leri olarak değil, sanitize edilmiş agent ayarları olarak uygular.
- `plugins.slots.memory`: aktif memory Plugin id'sini seçin veya memory Plugin'lerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: aktif context engine Plugin id'sini seçin; başka bir engine kurup seçmediğiniz sürece varsayılan `"legacy"` olur.

Bkz. [Plugin'ler](/tr/tools/plugin).

---

## Commitments

`commitments`, çıkarılan takip memory'sini kontrol eder: OpenClaw konuşma turn'lerinden check-in'leri algılayabilir ve bunları heartbeat çalıştırmaları üzerinden iletebilir.

- `commitments.enabled`: Çıkarılan takip commitments için gizli LLM çıkarımı, depolama ve heartbeat iletimini etkinleştirir. Varsayılan: `false`.
- `commitments.maxPerDay`: Hareketli bir gün içinde agent oturumu başına iletilen çıkarılmış takip commitments için maksimum sayı. Varsayılan: `3`.

Bkz. [Çıkarılan commitments](/tr/concepts/commitments).

---

## Browser

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
- `tabCleanup`, izlenen birincil ajan sekmelerini boşta kalma süresinden sonra veya bir
  oturum sınırını aştığında geri kazanır. Bu ayrı temizleme modlarını devre dışı
  bırakmak için `idleMinutes: 0` veya `maxTabsPerSession: 0` ayarlayın.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`, ayarlanmadığında devre dışıdır; bu nedenle tarayıcı gezinmesi varsayılan olarak katı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezinmesine bilinçli olarak güvendiğinizde ayarlayın.
- Katı modda, uzak CDP profil uç noktaları (`profiles.*.cdpUrl`) erişilebilirlik/keşif kontrolleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski bir takma ad olarak desteklenmeye devam eder.
- Katı modda, açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca bağlanma içindir (başlat/durdur/sıfırla devre dışıdır).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw'ın `/json/version` keşfetmesini istediğinizde HTTP(S) kullanın; sağlayıcınız
  size doğrudan bir DevTools WebSocket URL'si verdiğinde WS(S) kullanın.
- `remoteCdpTimeoutMs` ve `remoteCdpHandshakeTimeoutMs`, uzak ve
  `attachOnly` CDP erişilebilirliğinin yanı sıra sekme açma istekleri için geçerlidir. Yönetilen loopback
  profilleri yerel CDP varsayılanlarını korur.
- Harici olarak yönetilen bir CDP hizmetine loopback üzerinden erişilebiliyorsa, o
  profilin `attachOnly: true` değerini ayarlayın; aksi takdirde OpenClaw, loopback bağlantı noktasını
  yerel olarak yönetilen bir tarayıcı profili olarak değerlendirir ve yerel bağlantı noktası sahipliği hataları bildirebilir.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve seçilen ana bilgisayara
  veya bağlı bir tarayıcı düğümü üzerinden bağlanabilir.
- `existing-session` profilleri, Brave veya Edge gibi belirli bir
  Chromium tabanlı tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri, Chrome zaten bir DevTools HTTP(S) keşif uç noktası
  veya doğrudan WS(S) uç noktası arkasında çalışıyorsa `cdpUrl` ayarlayabilir. Bu
  modda OpenClaw, otomatik bağlantı kullanmak yerine uç noktayı Chrome MCP'ye iletir;
  `userDataDir`, Chrome MCP başlatma argümanları için yok sayılır.
- `existing-session` profilleri mevcut Chrome MCP rota sınırlarını korur:
  CSS seçici hedefleme yerine snapshot/ref odaklı eylemler, tek dosya yükleme
  kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve
  `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; `cdpUrl`
  değerini yalnızca uzak CDP profilleri veya existing-session uç noktasına
  bağlanma için açıkça ayarlayın.
- Yerel yönetilen profiller, o profil için genel
  `browser.executablePath` değerini geçersiz kılmak üzere `executablePath` ayarlayabilir. Bunu bir profili
  Chrome'da, başka bir profili Brave'de çalıştırmak için kullanın.
- Yerel yönetilen profiller, işlem başladıktan sonra Chrome CDP HTTP
  keşfi için `browser.localLaunchTimeoutMs` ve başlatma sonrası CDP websocket hazır olma durumu için
  `browser.localCdpReadyTimeoutMs` kullanır. Chrome'un başarıyla
  başladığı ancak hazır olma kontrollerinin başlatma ile yarıştığı daha yavaş ana bilgisayarlarda bunları artırın. Her iki değer de
  `120000` ms'ye kadar pozitif tam sayılar olmalıdır; geçersiz yapılandırma değerleri reddedilir.
- Otomatik algılama sırası: Chromium tabanlıysa varsayılan tarayıcı → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` ve `browser.profiles.<name>.executablePath`, Chromium başlatılmadan önce
  işletim sisteminizin ana dizini için hem `~` hem de `~/...` kabul eder.
  `existing-session` profillerindeki profil başına `userDataDir` de tilde ile genişletilir.
- Denetim hizmeti: yalnızca loopback (bağlantı noktası `gateway.port` değerinden türetilir, varsayılan `18791`).
- `extraArgs`, yerel Chromium başlangıcına ek başlatma bayrakları ekler (örneğin
  `--disable-gpu`, pencere boyutlandırma veya hata ayıklama bayrakları).

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

- `mode`: `local` (gateway'i çalıştır) veya `remote` (uzak gateway'e bağlan). `local` olmadıkça Gateway başlatmayı reddeder.
- `port`: WS + HTTP için tek çoklanmış port. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP), veya `custom`.
- **Eski bind takma adları**: `gateway.bind` içinde host takma adlarını (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind, konteyner içinde `127.0.0.1` üzerinde dinler. Docker bridge ağı (`-p 18789:18789`) ile trafik `eth0` üzerinden gelir, bu yüzden gateway'e ulaşılamaz. Tüm arayüzlerde dinlemek için `--network host` kullanın veya `bind: "lan"` (ya da `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Kimlik doğrulama**: varsayılan olarak gereklidir. Loopback dışı bind'ler gateway kimlik doğrulaması gerektirir. Pratikte bu, paylaşılan bir token/parola veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik duyarlı bir ters proxy anlamına gelir. Onboarding sihirbazı varsayılan olarak bir token oluşturur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. İkisi de yapılandırılmış ve mode ayarlanmamış olduğunda başlangıç ve servis kurulum/onarım akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık kimlik doğrulamasız mod. Yalnızca güvenilir local loopback kurulumları için kullanın; bu seçenek onboarding istemlerinde bilinçli olarak sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: tarayıcı/kullanıcı kimlik doğrulamasını kimlik duyarlı bir ters proxy'ye devreder ve `gateway.trustedProxies` içinden gelen kimlik başlıklarına güvenir (bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)). Bu mod varsayılan olarak **loopback dışı** bir proxy kaynağı bekler; aynı host üzerindeki loopback ters proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir. Dahili aynı host çağırıcıları yerel doğrudan yedek olarak `gateway.auth.password` kullanabilir; `gateway.auth.token`, trusted-proxy moduyla karşılıklı olarak dışlayıcı kalır.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını **kullanmaz**; bunun yerine gateway'in normal HTTP kimlik doğrulama modunu izler. Bu tokensız akış gateway host'unun güvenilir olduğunu varsayar. `tailscale.mode = "serve"` olduğunda varsayılan değer `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP'si ve kimlik doğrulama kapsamı başına uygulanır (shared-secret ve device-token bağımsız izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Asenkron Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler hata yazımından önce serileştirilir. Bu nedenle aynı istemciden eşzamanlı kötü denemeler, ikisi de düz uyuşmazlık olarak yarışıp geçmek yerine ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` olur; localhost trafiğinin de hız sınırına tabi olmasını özellikle istediğinizde (test kurulumları veya sıkı proxy dağıtımları için) `false` ayarlayın.
- Tarayıcı kaynaklı WS kimlik doğrulama denemeleri her zaman loopback muafiyeti devre dışı bırakılarak sınırlandırılır (tarayıcı tabanlı localhost kaba kuvvet saldırılarına karşı derinlemesine savunma).
- Loopback üzerinde, bu tarayıcı kaynaklı kilitlemeler normalize edilmiş `Origin`
  değeri başına yalıtılır; böylece bir localhost origin'inden tekrarlanan başarısızlıklar farklı bir origin'i otomatik olarak
  kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, loopback bind) veya `funnel` (genel, kimlik doğrulaması gerektirir).
- `tailscale.serviceName`: Serve modu için isteğe bağlı Tailscale Service adı, örneğin
  `svc:openclaw`. Ayarlandığında OpenClaw bunu `tailscale serve
--service` komutuna geçirir; böylece Control UI cihaz host adı yerine adlandırılmış bir Service üzerinden
  dışa açılabilir. Değer Tailscale'in `svc:<dns-label>`
  Service adı biçimini kullanmalıdır; başlangıç türetilen Service URL'sini bildirir.
- `tailscale.preserveFunnel`: `true` ve `tailscale.mode = "serve"` olduğunda OpenClaw,
  başlangıçta Serve'ü yeniden uygulamadan önce `tailscale funnel status` kontrol eder ve harici yapılandırılmış bir Funnel rotası gateway portunu zaten kapsıyorsa
  bunu atlar. Varsayılan `false`.
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı-origin izin listesi. Genel loopback dışı tarayıcı origin'leri için gereklidir. Loopback, RFC1918/link-local, `.local`, `.ts.net` veya Tailscale CGNAT host'larından yüklenen özel aynı-origin LAN/Tailnet arayüzleri, Host-header yedeklemesi etkinleştirilmeden kabul edilir.
- `controlUi.chatMessageMaxWidth`: gruplanmış Control UI sohbet mesajları için isteğe bağlı maksimum genişlik. `960px`, `82%`, `min(1280px, 82%)` ve `calc(100% - 2rem)` gibi kısıtlı CSS genişlik değerlerini kabul eder.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host-header origin ilkesine bilinçli olarak dayanan dağıtımlar için Host-header origin yedeklemesini etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için, genel host'larda `remote.url` `wss://` olmalıdır; düz metin `ws://` yalnızca loopback, LAN, link-local, `.local`, `.ts.net` ve Tailscale CGNAT host'ları için kabul edilir.
- `remote.remotePort`: uzak SSH host'undaki gateway portu. Varsayılan `18789`; yerel tünel portu uzak gateway portundan farklı olduğunda bunu kullanın.
- `gateway.remote.token` / `.password` uzak istemci kimlik bilgisi alanlarıdır. Tek başlarına gateway kimlik doğrulamasını yapılandırmazlar.
- `gateway.push.apns.relay.baseUrl`: relay destekli iOS derlemeleri kayıtları gateway'e yayımladıktan sonra kullanılan harici APNs relay'i için temel HTTPS URL'si. Genel App Store/TestFlight derlemeleri barındırılan OpenClaw relay'ini kullanır. Özel relay URL'leri, relay URL'si o relay'i işaret eden bilinçli olarak ayrı bir iOS derleme/dağıtım yoluyla eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: milisaniye cinsinden gateway'den relay'e gönderim zaman aşımı. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir gateway kimliğine devredilir. Eşlenen iOS uygulaması `gateway.identity.get` getirir, bu kimliği relay kaydına dahil eder ve kayıt kapsamlı bir gönderim yetkisini gateway'e iletir. Başka bir gateway bu saklanan kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici env geçersiz kılmaları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL'leri için yalnızca geliştirme amaçlı kaçış yolu. Üretim relay URL'leri HTTPS üzerinde kalmalıdır.
- `gateway.handshakeTimeoutMs`: kimlik doğrulama öncesi Gateway WebSocket el sıkışma zaman aşımı, milisaniye cinsinden. Varsayılan: `15000`. Ayarlandığında `OPENCLAW_HANDSHAKE_TIMEOUT_MS` önceliklidir. Başlangıç ısınması hâlâ otururken yerel istemcilerin bağlanabildiği yüklü veya düşük güçlü host'larda bunu artırın.
- `gateway.channelHealthCheckMinutes`: kanal sağlık izleme aralığı, dakika cinsinden. Sağlık izleme yeniden başlatmalarını küresel olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: bayat soket eşiği, dakika cinsinden. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına en fazla sağlık izleme yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: küresel izleyici etkin kalırken sağlık izleme yeniden başlatmaları için kanal bazında devre dışı bırakma.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap bazında geçersiz kılma. Ayarlandığında kanal düzeyi geçersiz kılmaya göre önceliklidir.
- Yerel gateway çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa yedek olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenmemişse, çözümleme kapalı başarısız olur (uzak yedek maskelemesi yoktur).
- `trustedProxies`: TLS'i sonlandıran veya iletilen istemci başlıkları ekleyen ters proxy IP'leri. Yalnızca kontrol ettiğiniz proxy'leri listeleyin. Loopback girdileri aynı host proxy/yerel algılama kurulumları için (örneğin Tailscale Serve veya yerel bir ters proxy) hâlâ geçerlidir, ancak loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hâle **getirmez**.
- `allowRealIpFallback`: `true` olduğunda gateway, `X-Forwarded-For` eksikse `X-Real-IP` kabul eder. Kapalı başarısız davranış için varsayılan `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: istenen kapsam olmadan ilk kez node cihaz eşlemesini otomatik onaylamak için isteğe bağlı CIDR/IP izin listesi. Ayarlanmamışsa devre dışıdır. Bu, operator/browser/Control UI/WebChat eşlemesini otomatik onaylamaz ve rol, kapsam, metadata veya public-key yükseltmelerini otomatik onaylamaz.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: eşleştirme ve platform izin listesi değerlendirmesinden sonra bildirilen node komutları için küresel izin/ret şekillendirmesi. `camera.snap`, `camera.clip` ve `screen.record` gibi tehlikeli node komutlarına dahil olmak için `allowCommands` kullanın; `denyCommands`, bir platform varsayılanı veya açık izin aksi hâlde onu dahil edecek olsa bile komutu kaldırır. Bir node bildirdiği komut listesini değiştirdikten sonra, gateway'in güncel komut anlık görüntüsünü saklaması için o cihaz eşlemesini reddedip yeniden onaylayın.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek araç adları (varsayılan ret listesini genişletir).
- `gateway.tools.allow`: owner/admin çağırıcılar için varsayılan HTTP ret listesinden
  araç adlarını kaldırır. Bu, kimlik taşıyan `operator.write`
  çağırıcılarını owner/admin erişimine yükseltmez; `cron`, `gateway` ve `nodes`, izin listesine alınsalar bile
  owner olmayan çağırıcılar için kullanılamaz kalır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Admin HTTP RPC: `admin-http-rpc` Plugin'i olarak varsayılan kapalıdır. `POST /api/v1/admin/rpc` kaydetmek için Plugin'i etkinleştirin. Bkz. [Admin HTTP RPC](/tr/plugins/admin-http-rpc).
- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdi sıkılaştırması:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarlanmamış kabul edilir; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt sıkılaştırma başlığı:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca kontrol ettiğiniz HTTPS origin'leri için ayarlayın; bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çoklu örnek yalıtımı

Tek bir host üzerinde benzersiz portlar ve durum dizinleriyle birden çok gateway çalıştırın:

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

- `enabled`: gateway dinleyicisinde TLS sonlandırmasını etkinleştirir (HTTPS/WSS) (varsayılan: `false`).
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

- `mode`: yapılandırma düzenlemelerinin çalışma zamanında nasıl uygulanacağını kontrol eder.
  - `"off"`: canlı düzenlemeleri yok say; değişiklikler açık bir yeniden başlatma gerektirir.
  - `"restart"`: yapılandırma değiştiğinde Gateway sürecini her zaman yeniden başlat.
  - `"hot"`: değişiklikleri yeniden başlatmadan süreç içinde uygula.
  - `"hybrid"` (varsayılan): önce sıcak yeniden yüklemeyi dene; gerekirse yeniden başlatmaya geri dön.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tam sayı).
- `deferralTimeoutMs`: yeniden başlatmayı veya kanal sıcak yeniden yüklemesini zorlamadan önce devam eden işlemleri beklemek için ms cinsinden isteğe bağlı azami süre. Varsayılan sınırlı beklemeyi (`300000`) kullanmak için atlayın; süresiz beklemek ve hâlâ bekleyen işlemler için periyodik uyarılar günlüğe yazmak üzere `0` olarak ayarlayın.

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
- `hooks.token`, etkin Gateway paylaşılan gizli anahtar kimlik doğrulamasından (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) farklı olmalıdır; başlangıç, yeniden kullanım algıladığında ölümcül olmayan bir güvenlik uyarısı günlüğe yazar.
- `openclaw security audit`, yalnızca denetim zamanında sağlanan Gateway parola kimlik doğrulaması (`--auth password --password <password>`) dahil olmak üzere hook/Gateway kimlik doğrulaması yeniden kullanımını kritik bulgu olarak işaretler. Kalıcılaştırılmış yeniden kullanılan bir `hooks.token` değerini döndürmek için `openclaw doctor --fix` komutunu çalıştırın, ardından harici hook göndericilerini yeni hook tokenını kullanacak şekilde güncelleyin.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini sınırlandırın (örneğin `["hook:"]`).
- Bir eşleme veya ön ayar şablonlu bir `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` değerini ayarlayın ve `hooks.allowRequestSessionKey=true` yapın. Statik eşleme anahtarları bu açık tercihi gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükünden gelen `sessionKey` yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` üzerinden çözümlenir
  - Şablonla işlenen eşleme `sessionKey` değerleri harici olarak sağlanmış kabul edilir ve ayrıca `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Eşleme ayrıntıları">

- `match.path`, `/hooks` sonrasındaki alt yolla eşleşir (örn. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanıyla eşleşir.
- `{{messages[0].subject}}` gibi şablonlar yükten okur.
- `transform`, hook eylemi döndüren bir JS/TS modülünü gösterebilir.
  - `transform.module` göreli bir yol olmalı ve `hooks.transformsDir` içinde kalmalıdır (mutlak yollar ve dizin geçişi reddedilir).
  - `hooks.transformsDir` değerini `~/.openclaw/hooks/transforms` altında tutun; çalışma alanı skill dizinleri reddedilir. `openclaw doctor` bu yolu geçersiz olarak raporlarsa dönüştürme modülünü hooks dönüşümleri dizinine taşıyın veya `hooks.transformsDir` değerini kaldırın.
- `agentId`, belirli bir aracıya yönlendirir; bilinmeyen kimlikler varsayılan aracıya geri döner.
- `allowedAgentIds`: `agentId` atlandığında varsayılan aracı yolu dahil olmak üzere etkili aracı yönlendirmesini sınırlar (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan hook aracı çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranlarının ve şablon odaklı eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin verir (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri (istek + eşleme) için isteğe bağlı önek izin listesi, örn. `["hook:"]`. Herhangi bir eşleme veya ön ayar şablonlu bir `sessionKey` kullandığında zorunlu hale gelir.
- `deliver: true`, son yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` olur.
- `model`, bu hook çalıştırması için LLM değerini geçersiz kılar (model kataloğu ayarlanmışsa izin verilmiş olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail ön ayarı `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- Bu ileti başına yönlendirmeyi korursanız `hooks.allowRequestSessionKey: true` olarak ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanıyla eşleşecek şekilde sınırlandırın, örneğin `["hook:", "hook:gmail:"]`.
- `hooks.allowRequestSessionKey: false` gerekiyorsa ön ayarı, şablonlu varsayılan yerine statik bir `sessionKey` ile geçersiz kılın.

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

## Canvas Plugin barındırıcısı

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

- Gateway bağlantı noktası altında HTTP üzerinden aracı tarafından düzenlenebilir HTML/CSS/JS ve A2UI sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` değerini koruyun (varsayılan).
- local loopback olmayan bağlamalar: canvas rotaları, diğer Gateway HTTP yüzeyleriyle aynı şekilde Gateway kimlik doğrulaması (token/parola/güvenilir proxy) gerektirir.
- Node WebView'ları genellikle kimlik doğrulama üstbilgileri göndermez; bir node eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için node kapsamlı yetenek URL'lerini duyurur.
- Yetenek URL'leri etkin node WS oturumuna bağlıdır ve hızla sona erer. IP tabanlı geri dönüş kullanılmaz.
- Sunulan HTML içine canlı yeniden yükleme istemcisini enjekte eder.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- Ayrıca A2UI'yi `/__openclaw__/a2ui/` adresinde sunar.
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

- `minimal` (yerleşik `bonjour` Plugin etkin olduğunda varsayılan): TXT kayıtlarından `cliPath` + `sshPort` değerlerini atlar.
- `full`: `cliPath` + `sshPort` değerlerini içerir; LAN çok noktaya yayın duyurusu yine de yerleşik `bonjour` Plugin'in etkin olmasını gerektirir.
- `off`: Plugin etkinliğini değiştirmeden LAN çok noktaya yayın duyurusunu bastırır.
- Yerleşik `bonjour` Plugin, macOS ana makinelerinde otomatik başlar ve Linux, Windows ve konteynerleştirilmiş Gateway dağıtımlarında açık tercihe bağlıdır.
- Ana makine adı, geçerli bir DNS etiketi olduğunda varsayılan olarak sistem ana makine adını kullanır; aksi halde `openclaw` değerine geri döner. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

### Geniş alan (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` altında bir tek noktaya yayın DNS-SD bölgesi yazar. Ağlar arası keşif için bir DNS sunucusuyla (CoreDNS önerilir) + Tailscale split DNS ile eşleştirin.

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

Herhangi bir yapılandırma dizesinde ortam değişkenlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Yalnızca büyük harfli adlar eşleşir: `[A-Z_][A-Z0-9_]*`.
- Eksik/boş değişkenler yapılandırma yüklemesinde hata fırlatır.
- Değişmez `${VAR}` için `$${VAR}` ile kaçış yapın.
- `$include` ile çalışır.

---

## Gizli Bilgiler

Gizli bilgi referansları eklemelidir: düz metin değerler çalışmaya devam eder.

### `SecretRef`

Tek bir nesne şekli kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Doğrulama:

- `provider` deseni: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id deseni: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: mutlak JSON işaretçisi (örneğin `"/providers/openai/apiKey"`)
- `source: "exec"` id deseni: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (AWS tarzı `secret#json_key` seçicilerini destekler)
- `source: "exec"` id değerleri `.` veya `..` eğik çizgiyle ayrılmış yol segmentleri içermemelidir (örneğin `a/../b` reddedilir)

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

- `file` sağlayıcısı `mode: "json"` ve `mode: "singleValue"` değerlerini destekler (`singleValue` modunda `id` değeri `"value"` olmalıdır).
- Windows ACL doğrulaması kullanılamadığında dosya ve exec sağlayıcı yolları kapalı olarak başarısız olur. `allowInsecurePath: true` değerini yalnızca doğrulanamayan güvenilir yollar için ayarlayın.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yüklerini kullanır.
- Varsayılan olarak, sembolik bağlantı komut yolları reddedilir. Çözümlenen hedef yolu doğrularken sembolik bağlantı yollarına izin vermek için `allowSymlinkCommand: true` değerini ayarlayın.
- `trustedDirs` yapılandırılmışsa, güvenilir dizin denetimi çözümlenen hedef yola uygulanır.
- `exec` alt ortamı varsayılan olarak en düşük düzeydedir; gerekli değişkenleri `passEnv` ile açıkça geçirin.
- Gizli bilgi referansları etkinleştirme sırasında bellek içi bir anlık görüntüye çözümlenir, ardından istek yolları yalnızca anlık görüntüyü okur.
- Etkin yüzey filtreleme etkinleştirme sırasında uygulanır: etkin yüzeylerde çözümlenemeyen referanslar başlatma/yeniden yüklemeyi başarısız kılar, etkin olmayan yüzeyler ise tanılama ile atlanır.

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

- Aracı başına profiller `<agentDir>/auth-profiles.json` konumunda saklanır.
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyinde ref'leri (`api_key` için `keyRef`, `token` için `tokenRef`) destekler.
- `{ "provider": { "apiKey": "..." } }` gibi eski düz `auth-profiles.json` eşlemeleri bir çalışma zamanı biçimi değildir; `openclaw doctor --fix` bunları `.legacy-flat.*.bak` yedeğiyle kanonik `provider:default` API anahtarı profillerine yeniden yazar.
- OAuth modu profilleri (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli auth-profile kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri, bellek içi çözümlenmiş anlık görüntülerden gelir; eski statik `auth.json` girdileri keşfedildiğinde temizlenir.
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

- `billingBackoffHours`: bir profil gerçek faturalandırma/yetersiz kredi hataları nedeniyle başarısız olduğunda saat cinsinden temel geri çekilme süresi (varsayılan: `5`). Açık faturalandırma metni, `401`/`403` yanıtlarında bile yine buraya düşebilir, ancak sağlayıcıya özgü metin eşleştiricileri onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya kuruluş/çalışma alanı harcama limiti mesajları bunun yerine `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalandırma geri çekilme saatleri için isteğe bağlı sağlayıcı başına geçersiz kılmalar.
- `billingMaxHours`: faturalandırma geri çekilmesinin üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenilirlikli `auth_permanent` hataları için dakika cinsinden temel geri çekilme süresi (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan saat cinsinden kayan pencere (varsayılan: `24`).
- `overloadedProfileRotations`: model fallback'e geçmeden önce aşırı yük hataları için aynı sağlayıcıdaki azami auth-profile rotasyonları (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı meşgul şekilleri buraya düşer.
- `overloadedBackoffMs`: aşırı yüklenmiş bir sağlayıcı/profil rotasyonunu yeniden denemeden önceki sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model fallback'e geçmeden önce hız sınırı hataları için aynı sağlayıcıdaki azami auth-profile rotasyonları (varsayılan: `1`). Bu hız sınırı kovası `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

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
- `maxFileBytes`: rotasyondan önce etkin günlük dosyasının bayt cinsinden azami boyutu (pozitif tam sayı; varsayılan: `104857600` = 100 MB). OpenClaw, etkin dosyanın yanında beş adede kadar numaralı arşiv tutar.
- `redactSensitive` / `redactPatterns`: konsol çıktısı, dosya günlükleri, OTLP günlük kayıtları ve kalıcı oturum transkript metni için en iyi çaba maskelemesi. `redactSensitive: "off"` yalnızca bu genel günlük/transkript politikasını devre dışı bırakır; UI/araç/tanı güvenliği yüzeyleri, yaymadan önce secrets değerlerini yine de redakte eder.

---

## Tanılamalar

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

- `enabled`: enstrümantasyon çıktısı için ana geçiş düğmesi (varsayılan: `true`).
- `flags`: hedefli günlük çıktısını etkinleştiren bayrak dizeleri dizisi (`"telegram.*"` veya `"*"` gibi joker karakterleri destekler).
- `stuckSessionWarnMs`: uzun süren işleme oturumlarını `session.long_running`, `session.stalled` veya `session.stuck` olarak sınıflandırmak için ms cinsinden ilerleme yok yaşı eşiği. Yanıt, araç, durum, blok ve ACP ilerlemesi zamanlayıcıyı sıfırlar; tekrarlanan `session.stuck` tanılamaları değişiklik olmadığında geri çekilir.
- `stuckSessionAbortMs`: uygun duran etkin işlerin kurtarma için abort-drain edilebilmesinden önce ms cinsinden ilerleme yok yaşı eşiği. Ayarlanmadığında OpenClaw, en az 5 dakika ve 3x `stuckSessionWarnMs` olan daha güvenli genişletilmiş gömülü çalıştırma penceresini kullanır.
- `memoryPressureSnapshot`: bellek baskısı `critical` düzeyine ulaştığında redakte edilmiş bir OOM öncesi kararlılık anlık görüntüsü yakalar (varsayılan: `false`). Normal bellek baskısı olaylarını korurken kararlılık paketi dosya taraması/yazması eklemek için `true` olarak ayarlayın.
- `otel.enabled`: OpenTelemetry dışa aktarma pipeline'ını etkinleştirir (varsayılan: `false`). Tam yapılandırma, sinyal kataloğu ve gizlilik modeli için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).
- `otel.endpoint`: OTel dışa aktarması için collector URL'si.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: isteğe bağlı sinyale özgü OTLP uç noktaları. Ayarlandıklarında, yalnızca o sinyal için `otel.endpoint` değerini geçersiz kılarlar.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC meta veri başlıkları.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarımını etkinleştirir.
- `otel.logsExporter`: günlük dışa aktarma hedefi: `"otlp"` (varsayılan), stdout satırı başına bir JSON nesnesi için `"stdout"` veya `"both"`.
- `otel.sampleRate`: iz örnekleme oranı `0`-`1`.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri boşaltma aralığı.
- `otel.captureContent`: OTEL span öznitelikleri için açık katılımlı ham içerik yakalama. Varsayılan olarak kapalıdır. Boolean `true`, sistem dışı mesaj/araç içeriğini yakalar; nesne biçimi `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` ve `toolDefinitions` değerlerini açıkça etkinleştirmenizi sağlar.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: `{gen_ai.operation.name} {gen_ai.request.model}` span adları, `CLIENT` span türü ve eski `gen_ai.system` yerine `gen_ai.provider.name` dahil olmak üzere en yeni deneysel GenAI çıkarım span şekli için ortam geçiş düğmesi. Varsayılan olarak span'ler uyumluluk için `openclaw.model.call` ve `gen_ai.system` değerlerini korur; GenAI metrikleri sınırlı semantik öznitelikler kullanır.
- `OPENCLAW_OTEL_PRELOADED=1`: zaten global bir OpenTelemetry SDK kaydetmiş host'lar için ortam geçiş düğmesi. OpenClaw bu durumda tanı dinleyicilerini etkin tutarken Plugin'e ait SDK başlatma/kapatma işlemini atlar.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` ve `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: eşleşen yapılandırma anahtarı ayarlanmadığında kullanılan sinyale özgü uç nokta ortam değişkenleri.
- `cacheTrace.enabled`: gömülü çalıştırmalar için cache trace anlık görüntülerini günlüğe kaydeder (varsayılan: `false`).
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

- `channel`: npm/git kurulumları için sürüm kanalı - `"stable"`, `"beta"` veya `"dev"`.
- `checkOnStart`: gateway başladığında npm güncellemelerini denetle (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka plan otomatik güncellemeyi etkinleştir (varsayılan: `false`).
- `auto.stableDelayHours`: stable kanalında otomatik uygulamadan önce saat cinsinden asgari gecikme (varsayılan: `6`; azami: `168`).
- `auto.stableJitterHours`: saat cinsinden ek stable kanalına yayma penceresi (varsayılan: `12`; azami: `168`).
- `auto.betaCheckIntervalHours`: beta kanalı denetimlerinin saat cinsinden çalışma sıklığı (varsayılan: `1`; azami: `24`).

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

- `enabled`: global ACP özellik geçidi (varsayılan: `true`; ACP dispatch ve spawn erişimlerini gizlemek için `false` olarak ayarlayın).
- `dispatch.enabled`: ACP oturum turu dispatch'i için bağımsız geçit (varsayılan: `true`). Yürütmeyi engellerken ACP komutlarını kullanılabilir tutmak için `false` olarak ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı backend kimliği (kayıtlı bir ACP çalışma zamanı Plugin'iyle eşleşmelidir).
  Önce backend Plugin'ini kurun ve `plugins.allow` ayarlanmışsa backend Plugin kimliğini (örneğin `acpx`) dahil edin; aksi takdirde ACP backend yüklenmez.
- `defaultAgent`: spawn'lar açık bir hedef belirtmediğinde fallback ACP hedef aracı kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen aracı kimliklerinin allowlist'i; boş olması ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: aynı anda etkin olabilecek azami ACP oturumu sayısı.
- `stream.coalesceIdleMs`: akışlı metin için ms cinsinden boşta flush penceresi.
- `stream.maxChunkChars`: akışlı blok projeksiyonunu bölmeden önceki azami parça boyutu.
- `stream.repeatSuppression`: tur başına yinelenen durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı olarak akış yapar; `"final_only"` tur terminal olaylarına kadar tamponlar.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önceki ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP turu başına projekte edilen azami asistan çıktı karakteri.
- `stream.maxSessionUpdateChars`: projekte edilen ACP durum/güncelleme satırları için azami karakter sayısı.
- `stream.tagVisibility`: akışlı olaylar için etiket adlarından boolean görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum işçileri uygun temizlikten önce dakika cinsinden boşta TTL.
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

- `cli.banner.taglineMode`, banner sloganı stilini kontrol eder:
  - `"random"` (varsayılan): dönen komik/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yoktur (banner başlığı/sürümü yine de gösterilir).
- Tüm banner'ı gizlemek için (yalnızca sloganları değil), `OPENCLAW_HIDE_BANNER=1` env değerini ayarlayın.

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

[Agent varsayılanları](/tr/gateway/config-agents#agent-defaults) altındaki `agents.list` kimlik alanlarına bakın.

---

## Köprü (eski, kaldırıldı)

Geçerli derlemeler artık TCP köprüsünü içermez. Node'lar Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları çıkarabilir).

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

- `sessionRetention`: tamamlanan yalıtılmış cron çalıştırma oturumlarının `sessions.json` içinden budanmadan önce ne kadar süre tutulacağını belirtir. Arşivlenmiş silinmiş cron dökümlerinin temizlenmesini de kontrol eder. Varsayılan: `24h`; devre dışı bırakmak için `false` olarak ayarlayın.
- `runLog.maxBytes`: eski dosya destekli cron çalıştırma günlükleriyle uyumluluk için kabul edilir. Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: iş başına tutulan en yeni SQLite çalıştırma geçmişi satırları. Varsayılan: `2000`.
- `webhookToken`: cron Webhook POST teslimi (`delivery.mode = "webhook"`) için kullanılan bearer token; atlanırsa auth üst bilgisi gönderilmez.
- `webhook`: hâlâ `notify: true` içeren kayıtlı işleri taşımak için `openclaw doctor --fix` tarafından kullanılan, kullanımdan kaldırılmış eski yedek Webhook URL'si (http/https); çalışma zamanı teslimi iş başına `delivery.mode="webhook"` ile birlikte `delivery.to` değerini veya duyuru teslimi korunurken `delivery.completionDestination` değerini kullanır.

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

Tek seferlik işler, yeniden deneme girişimleri tükenene kadar etkin kalır, ardından son hata durumunu koruyarak devre dışı bırakılır. Yinelenen işler, bir sonraki zamanlanmış yuvalarından önce geri çekilme sonrasında yeniden çalışmak için aynı geçici yeniden deneme politikasını kullanır; kalıcı hatalar veya tükenmiş geçici yeniden denemeler, hata geri çekilmesiyle birlikte normal yinelenen zamanlamaya geri döner.

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
- `cooldownMs`: aynı iş için tekrarlanan uyarılar arasındaki en az milisaniye (negatif olmayan tam sayı).
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
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi varsa varsayılan olarak `"announce"` kullanılır.
- `channel`: duyuru teslimi için kanal geçersiz kılması. `"last"` bilinen son teslim kanalını yeniden kullanır.
- `to`: açık duyuru hedefi veya Webhook URL'si. Webhook modu için gereklidir.
- `accountId`: teslim için isteğe bağlı hesap geçersiz kılması.
- İş başına `delivery.failureDestination`, bu genel varsayılanı geçersiz kılar.
- Ne genel ne de iş başına hata hedefi ayarlanmışsa, zaten `announce` üzerinden teslim eden işler hata durumunda bu birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, işin birincil `delivery.mode` değeri `"webhook"` olmadığı sürece yalnızca `sessionTarget="isolated"` işleri için desteklenir.

[Cron İşleri](/tr/automation/cron-jobs) bölümüne bakın. Yalıtılmış cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya modeli şablon değişkenleri

`tools.media.models[].args` içinde genişletilen şablon yer tutucuları:

| Değişken           | Açıklama                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Tam gelen mesaj gövdesi                         |
| `{{RawBody}}`      | Ham gövde (geçmiş/gönderen sarmalayıcıları yok)             |
| `{{BodyStripped}}` | Grup bahsetmeleri çıkarılmış gövde                 |
| `{{From}}`         | Gönderen tanımlayıcısı                                 |
| `{{To}}`           | Hedef tanımlayıcısı                            |
| `{{MessageSid}}`   | Kanal mesaj kimliği                                |
| `{{SessionId}}`    | Geçerli oturum UUID'si                              |
| `{{IsNewSession}}` | Yeni oturum oluşturulduğunda `"true"`                 |
| `{{MediaUrl}}`     | Gelen medya sözde URL'si                          |
| `{{MediaPath}}`    | Yerel medya yolu                                  |
| `{{MediaType}}`    | Medya türü (görsel/ses/belge/…)               |
| `{{Transcript}}`   | Ses dökümü                                  |
| `{{Prompt}}`       | CLI girişleri için çözümlenmiş medya istemi             |
| `{{MaxChars}}`     | CLI girişleri için çözümlenmiş en fazla çıktı karakteri         |
| `{{ChatType}}`     | `"direct"` veya `"group"`                           |
| `{{GroupSubject}}` | Grup konusu (en iyi çaba)                       |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (en iyi çaba)               |
| `{{SenderName}}`   | Gönderen görünen adı (en iyi çaba)                 |
| `{{SenderE164}}`   | Gönderen telefon numarası (en iyi çaba)                 |
| `{{Provider}}`     | Provider ipucu (whatsapp, telegram, discord, vb.) |

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

- Tek dosya: içeren nesnenin yerini alır.
- Dosya dizisi: sırayla derin birleştirilir (sonrakiler öncekileri geçersiz kılar).
- Kardeş anahtarlar: include'lardan sonra birleştirilir (dahil edilen değerleri geçersiz kılar).
- İç içe include'lar: 10 seviyeye kadar derinlik.
- Yollar: include eden dosyaya göre çözümlenir, ancak üst düzey yapılandırma dizininin (`openclaw.json` dosyasının `dirname` değeri) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca yine bu sınır içinde çözümlendiklerinde izin verilir. Yollar null bayt içermemeli ve çözümleme öncesinde ve sonrasında kesinlikle 4096 karakterden kısa olmalıdır.
- Yalnızca tek dosyalı include tarafından desteklenen bir üst düzey bölümü değiştiren OpenClaw'a ait yazmalar, o dahil edilen dosyaya geçirilerek yazılır. Örneğin, `plugins install`, `plugins: { $include: "./plugins.json5" }` değerini `plugins.json5` içinde günceller ve `openclaw.json` dosyasını dokunulmamış bırakır.
- Kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar OpenClaw'a ait yazmalar için salt okunurdur; bu yazmalar yapılandırmayı düzleştirmek yerine kapalı başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları, döngüsel include'lar, geçersiz yol biçimi ve aşırı uzunluk için açık mesajlar.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
