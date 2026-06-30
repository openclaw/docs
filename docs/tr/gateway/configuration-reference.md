---
read_when:
    - Tam alan düzeyinde yapılandırma anlamlarına veya varsayılanlara ihtiyacınız var
    - Kanal, model, Gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Temel OpenClaw anahtarları, varsayılanları ve özel alt sistem referanslarına bağlantılar için Gateway yapılandırma referansı
title: Yapılandırma başvurusu
x-i18n:
    generated_at: "2026-06-30T22:29:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c95497f4f76fd124505ffb9d0173e7e2adeeed82ee12812b2eca9673d5520fc4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Core config `~/.openclaw/openclaw.json` için başvuru. Görev odaklı bir genel bakış için [Configuration](/tr/gateway/configuration) sayfasına bakın.

Ana OpenClaw config yüzeylerini kapsar ve bir alt sistemin kendi daha derin başvurusu olduğunda oraya bağlantı verir. Kanal ve plugin sahipli komut katalogları ile derin bellek/QMD ayarları bu sayfa yerine kendi sayfalarında yer alır.

Kod gerçeği:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Şemasını yazdırır; mevcut olduğunda birlikte gelen/plugin/kanal meta verileri birleştirilir
- `config.schema.lookup`, ayrıntıya inen araçlar için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, config belgeleri temel hash değerini geçerli şema yüzeyine göre doğrular

Agent arama yolu: düzenlemelerden önce tam alan düzeyindeki belgeler ve
kısıtlar için `gateway` araç eylemi `config.schema.lookup` kullanın. Görev
odaklı rehberlik için [Configuration](/tr/gateway/configuration) sayfasını, daha
geniş alan haritası, varsayılanlar ve alt sistem başvurularına bağlantılar için
bu sayfayı kullanın.

Özel derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki dreaming config için [Memory configuration reference](/tr/reference/memory-config)
- Geçerli yerleşik + birlikte gelen komut kataloğu için [Slash commands](/tr/tools/slash-commands)
- Kanala özgü komut yüzeyleri için sahip kanal/plugin sayfaları

Config biçimi **JSON5**'tir (yorumlara + sonda virgüllere izin verilir). Tüm alanlar isteğe bağlıdır - alanlar atlandığında OpenClaw güvenli varsayılanları kullanır.

---

## Kanallar

Kanal başına config anahtarları özel bir sayfaya taşındı - Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage ve diğer birlikte gelen kanallar (kimlik
doğrulama, erişim denetimi, çoklu hesap, mention geçidi) dahil `channels.*`
için [Configuration - channels](/tr/gateway/config-channels) sayfasına bakın.

## Agent varsayılanları, çoklu agent, oturumlar ve iletiler

Özel bir sayfaya taşındı - şunlar için
[Configuration - agents](/tr/gateway/config-agents) sayfasına bakın:

- `agents.defaults.*` (çalışma alanı, model, düşünme, heartbeat, bellek, medya, skills, sandbox)
- `multiAgent.*` (çoklu agent yönlendirmesi ve bağlamaları)
- `session.*` (oturum yaşam döngüsü, compaction, budama)
- `messages.*` (ileti teslimi, TTS, markdown işleme)
- `talk.*` (Talk modu)
  - `talk.consultThinkingLevel`: Control UI Talk gerçek zamanlı danışmalarının arkasındaki tam OpenClaw agent çalıştırması için düşünme düzeyi geçersiz kılması
  - `talk.consultFastMode`: Control UI Talk gerçek zamanlı danışmaları için tek seferlik hızlı mod geçersiz kılması
  - `talk.speechLocale`: iOS/macOS üzerinde Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği
  - `talk.silenceTimeoutMs`: ayarlanmadığında Talk, transkripti göndermeden önce platformun varsayılan duraklama penceresini korur (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: `openclaw_agent_consult` öğesini atlayan sonuçlandırılmış gerçek zamanlı Talk transkriptleri için Gateway relay fallback

## Araçlar ve özel sağlayıcılar

Araç ilkesi, deneysel geçişler, sağlayıcı destekli araç yapılandırması ve özel
sağlayıcı / temel URL kurulumu özel bir sayfaya taşındı - bkz.
[Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## Modeller

Sağlayıcı tanımları, model izin listeleri ve özel sağlayıcı kurulumu
[Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls)
içinde yer alır. `models` kökü ayrıca küresel model kataloğu davranışını yönetir.

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
- `models.providers.*.localService`: yerel model sunucuları için isteğe bağlı talep üzerine süreç yöneticisi. OpenClaw yapılandırılmış sağlık uç noktasını yoklar, gerektiğinde mutlak `command` değerini başlatır, hazır olmasını bekler ve ardından model isteğini gönderir. Bkz. [Yerel model hizmetleri](/tr/gateway/local-model-services).
- `models.pricing.enabled`: sidecar'lar ve kanallar Gateway hazır yoluna ulaştıktan sonra başlayan arka plan fiyatlandırma önyüklemesini denetler. `false` olduğunda Gateway, OpenRouter ve LiteLLM fiyatlandırma kataloğu getirmelerini atlar; yapılandırılmış `models.providers.*.models[].cost` değerleri yerel maliyet tahminleri için çalışmaya devam eder.

## MCP

OpenClaw tarafından yönetilen MCP sunucusu tanımları `mcp.servers` altında yer alır ve
gömülü OpenClaw ile diğer çalışma zamanı bağdaştırıcıları tarafından tüketilir. `openclaw mcp list`,
`show`, `set` ve `unset` komutları, yapılandırma düzenlemeleri sırasında hedef sunucuya bağlanmadan bu bloğu yönetir.

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

- `mcp.servers`: yapılandırılmış MCP araçlarını açığa çıkaran çalışma zamanları için adlandırılmış stdio veya uzak MCP sunucusu tanımları.
  Uzak girdiler `transport: "streamable-http"` veya `transport: "sse"` kullanır;
  `type: "http"`, `openclaw mcp set` ve `openclaw doctor --fix` tarafından kanonik `transport` alanına normalleştirilen CLI'ye özgü bir takma addır.
- `mcp.servers.<name>.enabled`: kayıtlı bir sunucu tanımını korurken gömülü OpenClaw MCP keşfinden ve araç projeksiyonundan hariç tutmak için `false` olarak ayarlayın.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: sunucu başına MCP isteği zaman aşımı, saniye veya milisaniye cinsinden.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: sunucu başına bağlantı zaman aşımı, saniye veya milisaniye cinsinden.
- `mcp.servers.<name>.supportsParallelToolCalls`: paralel MCP araç çağrıları yapıp yapmayacağını seçebilen bağdaştırıcılar için isteğe bağlı eşzamanlılık ipucu.
- `mcp.servers.<name>.auth`: OAuth gerektiren HTTP MCP sunucuları için `"oauth"` olarak ayarlayın. Belirteçleri OpenClaw durumu altında depolamak için `openclaw mcp login <name>` çalıştırın.
- `mcp.servers.<name>.oauth`: isteğe bağlı OAuth kapsamı, yönlendirme URL'si ve istemci meta veri URL'si geçersiz kılmaları.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: özel uç noktalar ve karşılıklı TLS için HTTP TLS denetimleri.
- `mcp.servers.<name>.toolFilter`: sunucu başına isteğe bağlı araç seçimi. `include`, keşfedilen MCP araçlarını eşleşen adlarla sınırlar; `exclude`, eşleşen adları gizler. Girdiler tam MCP araç adları veya basit `*` glob'larıdır. Kaynakları veya istemleri olan sunucular ayrıca yardımcı araç adları (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) üretir ve bu adlar aynı filtreyi kullanır.
- `mcp.servers.<name>.codex`: isteğe bağlı Codex uygulama sunucusu projeksiyon denetimleri.
  Bu blok yalnızca Codex uygulama sunucusu iş parçacıkları için OpenClaw meta verisidir; ACP oturumlarını, genel Codex harness yapılandırmasını veya diğer çalışma zamanı bağdaştırıcılarını etkilemez.
  Boş olmayan `codex.agents`, sunucuyu listelenen OpenClaw ajan kimlikleriyle sınırlar.
  Boş, dolu olmayan veya geçersiz kapsamlı ajan listeleri yapılandırma doğrulaması tarafından reddedilir ve küresel hale gelmek yerine çalışma zamanı projeksiyon yolu tarafından atlanır.
  `codex.defaultToolsApprovalMode`, o sunucu için Codex'in yerel `default_tools_approval_mode` değerini yayar. OpenClaw, yerel `mcp_servers` yapılandırmasını Codex'e iletmeden önce `codex` bloğunu çıkarır. Sunucunun her Codex uygulama sunucusu ajanı için Codex'in varsayılan MCP onay davranışıyla projekte edilmesini sürdürmek için bloğu atlayın.
- `mcp.sessionIdleTtlMs`: oturum kapsamlı paketlenmiş MCP çalışma zamanları için boşta kalma TTL'i.
  Tek seferlik gömülü çalıştırmalar, çalıştırma sonu temizliği ister; bu TTL, uzun ömürlü oturumlar ve gelecekteki çağıranlar için son güvencedir.
- `mcp.*` altındaki değişiklikler, önbelleğe alınmış oturum MCP çalışma zamanları elden çıkarılarak sıcak uygulanır.
  Bir sonraki araç keşfi/kullanımı bunları yeni yapılandırmadan yeniden oluşturur; böylece kaldırılan `mcp.servers` girdileri boşta kalma TTL'ini beklemek yerine hemen temizlenir.
- Çalışma zamanı keşfi, o oturumun önbelleğe alınmış kataloğunu bırakarak MCP araç listesi değişiklik bildirimlerini de dikkate alır. Kaynaklar veya istemler duyuran sunucular, kaynakları listeleme/okuma ve istemleri listeleme/getirme için yardımcı araçlar alır. Yinelenen araç çağrısı hataları, başka bir çağrı denenmeden önce etkilenen sunucuyu kısa süreliğine duraklatır.

Çalışma zamanı davranışı için bkz. [MCP](/tr/cli/mcp#openclaw-as-an-mcp-client-registry) ve
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
- `load.allowSymlinkTargets`: bağlantı yapılandırılmış kaynak kökünün dışında bulunduğunda Skill sembolik bağlantılarının çözümlenebileceği güvenilir gerçek hedef kökler.
- `workshop.allowSymlinkTargetWrites`: Skill Workshop apply işleminin önceden güvenilen sembolik bağlantı hedefleri üzerinden yazmasına izin verir (varsayılan: false).
- `install.preferBrew`: true olduğunda, diğer yükleyici türlerine geri dönmeden önce `brew` mevcutsa Homebrew yükleyicilerini tercih eder.
- `install.nodeManager`: `metadata.openclaw.install` belirtimleri için node yükleyici tercihi (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: güvenilir `operator.admin` Gateway istemcilerinin `skills.upload.*` üzerinden hazırlanmış özel zip arşivlerini yüklemesine izin verir (varsayılan: false). Bu yalnızca yüklenmiş arşiv yolunu etkinleştirir; normal ClawHub yüklemeleri bunu gerektirmez.
- `entries.<skillKey>.enabled: false`, paketlenmiş/yüklenmiş olsa bile bir Skill'i devre dışı bırakır.
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
- Bağımsız plugin dosyalarını `plugins.load.paths` içine koyun; otomatik keşfedilen extension kökleri üst düzey `.js`, `.mjs` ve `.ts` dosyalarını yok sayar, böylece bu köklerdeki yardımcı betikler başlatmayı engellemez.
- Keşif; yerel OpenClaw plugin’lerini ve manifest içermeyen Claude varsayılan düzen bundle’ları dahil uyumlu Codex bundle’ları ile Claude bundle’larını kabul eder.
- **Config değişiklikleri gateway’in yeniden başlatılmasını gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen plugin’ler yüklenir). `deny` önceliklidir.
- `plugins.entries.<id>.apiKey`: plugin düzeyi API anahtarı kolaylık alanı (plugin tarafından desteklendiğinde).
- `plugins.entries.<id>.env`: plugin kapsamlı env var eşlemesi.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda core, `before_prompt_build` öğesini engeller ve eski `before_agent_start` içinden prompt’u değiştiren alanları yok sayarken eski `modelOverride` ve `providerOverride` değerlerini korur. Yerel plugin hook’larına ve desteklenen bundle tarafından sağlanan hook dizinlerine uygulanır.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` olduğunda, güvenilen bundle dışı plugin’ler `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` ve `agent_end` gibi typed hook’lardan ham konuşma içeriğini okuyabilir.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu plugin’e arka plan subagent çalıştırmaları için çalışma başına `provider` ve `model` geçersiz kılmaları istemesi konusunda açıkça güven.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilen subagent geçersiz kılmaları için canonical `provider/model` hedeflerinin isteğe bağlı izin listesi. Herhangi bir modele izin vermeyi özellikle istediğinizde yalnızca `"*"` kullanın.
- `plugins.entries.<id>.llm.allowModelOverride`: bu plugin’e `api.runtime.llm.complete` için model geçersiz kılmaları istemesi konusunda açıkça güven.
- `plugins.entries.<id>.llm.allowedModels`: güvenilen plugin LLM tamamlama geçersiz kılmaları için canonical `provider/model` hedeflerinin isteğe bağlı izin listesi. Herhangi bir modele izin vermeyi özellikle istediğinizde yalnızca `"*"` kullanın.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: bu plugin’e `api.runtime.llm.complete` öğesini varsayılan olmayan bir agent kimliğine karşı çalıştırması konusunda açıkça güven.
- `plugins.entries.<id>.config`: plugin tarafından tanımlanan config nesnesi (mevcut olduğunda yerel OpenClaw plugin schema’sı tarafından doğrulanır).
- Channel plugin hesap/runtime ayarları `channels.<id>` altında bulunur ve merkezi bir OpenClaw seçenek registry’si tarafından değil, sahip plugin’in manifest `channelConfigs` metadata’sı tarafından açıklanmalıdır.

### Codex harness plugin config

Bundle edilen `codex` plugin’i, yerel Codex app-server harness ayarlarını
`plugins.entries.codex.config` altında sahiplenir. Tam config
yüzeyi için [Codex harness referansı](/tr/plugins/codex-harness-reference) ve runtime modeli
için [Codex harness](/tr/plugins/codex-harness) sayfasına bakın.

`codexPlugins` yalnızca yerel Codex harness’ını seçen oturumlara uygulanır.
OpenClaw provider çalıştırmaları, ACP conversation bağlamaları veya Codex dışı
herhangi bir harness için Codex plugin’lerini etkinleştirmez.

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
  plugin/app desteğini etkinleştirir. Varsayılan: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  taşınan plugin app elicitations için varsayılan yıkıcı eylem politikası.
  Güvenli Codex approval schema’larını sormadan kabul etmek için `true`, bunları
  reddetmek için `false`, Codex tarafından gereken onayları OpenClaw plugin
  onayları üzerinden yönlendirmek için `"auto"` veya durable approval olmadan
  her plugin yazma/yıkıcı eylemi için sormak üzere `"always"` kullanın.
  `"always"` modu, thread başlatılmadan önce etkilenen app için durable Codex
  araç başına approval geçersiz kılmalarını temizler.
  Varsayılan: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: global
  `codexPlugins.enabled` de true olduğunda taşınmış bir plugin entry’sini etkinleştirir.
  Varsayılan: açık entry’ler için `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  kararlı marketplace kimliği. V1 yalnızca `"openai-curated"` destekler.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: migration’dan gelen kararlı
  Codex plugin kimliği, örneğin `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  plugin başına yıkıcı eylem geçersiz kılması. Atlandığında global
  `allow_destructive_actions` değeri kullanılır. Plugin başına değer aynı
  `true`, `false`, `"auto"` veya `"always"` politikalarını kabul eder.

`codexPlugins.enabled` global etkinleştirme yönergesidir. Migration tarafından
yazılan açık plugin entry’leri durable install ve repair uygunluk kümesidir.
`plugins["*"]` desteklenmez, `install` anahtarı yoktur ve yerel
`marketplacePath` değerleri host’a özgü oldukları için bilinçli olarak config alanı değildir.

`app/list` hazır olma kontrolleri bir saat boyunca cache’lenir ve eskiyince
asenkron olarak yenilenir. Codex thread app config’i her turda değil, Codex harness
oturumu kurulurken hesaplanır; yerel plugin config’i değiştirildikten sonra `/new`,
`/reset` veya gateway yeniden başlatması kullanın.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider ayarları.
  - `apiKey`: Daha yüksek limitler için isteğe bağlı Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` env var değerine geri döner.
  - `baseUrl`: Firecrawl API base URL’si (varsayılan: `https://api.firecrawl.dev`; self-hosted geçersiz kılmalar private/internal endpoint’leri hedeflemelidir).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkar (varsayılan: `true`).
  - `maxAgeMs`: milisaniye cinsinden maksimum cache yaşı (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: saniye cinsinden scrape isteği zaman aşımı (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web search) ayarları.
  - `enabled`: X Search provider’ını etkinleştir.
  - `model`: arama için kullanılacak Grok modeli (örn. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: memory dreaming ayarları. Aşamalar ve eşikler için [Dreaming](/tr/concepts/dreaming) sayfasına bakın.
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam dreaming taraması için cron ritmi (varsayılan olarak `"0 3 * * *"`).
  - `model`: isteğe bağlı Dream Diary subagent model geçersiz kılması. `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir; hedefleri kısıtlamak için `allowedModels` ile eşleştirin. Model-kullanılamaz hataları oturum varsayılan modeliyle bir kez yeniden denenir; güven veya izin listesi hataları sessizce geri dönmez.
  - aşama politikası ve eşikler uygulama ayrıntılarıdır (kullanıcıya dönük config key’leri değildir).
- Tam memory config [Memory config referansı](/tr/reference/memory-config) içinde bulunur:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkinleştirilmiş Claude bundle plugin’leri `settings.json` içinden gömülü OpenClaw varsayılanları da sağlayabilir; OpenClaw bunları ham OpenClaw config patch’leri olarak değil, temizlenmiş agent ayarları olarak uygular.
- `plugins.slots.memory`: aktif memory plugin kimliğini seçin veya memory plugin’lerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: aktif context engine plugin kimliğini seçin; başka bir engine kurup seçmediğiniz sürece varsayılan `"legacy"` değeridir.

Bkz. [Plugin’ler](/tr/tools/plugin).

---

## Commitments

`commitments`, çıkarımsal takip memory’sini kontrol eder: OpenClaw konuşma turlarından check-in’leri algılayabilir ve bunları heartbeat çalıştırmaları üzerinden iletebilir.

- `commitments.enabled`: çıkarımsal takip commitments için gizli LLM çıkarımı, depolama ve heartbeat teslimini etkinleştir. Varsayılan: `false`.
- `commitments.maxPerDay`: kayan bir gün içinde agent oturumu başına teslim edilen maksimum çıkarımsal takip commitments sayısı. Varsayılan: `3`.

Bkz. [Çıkarımsal commitments](/tr/concepts/commitments).

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
- `tabCleanup`, boşta kalma süresinden sonra veya bir oturum sınırını aştığında
  izlenen birincil ajan sekmelerini geri kazanır. Bu tekil temizleme modlarını
  devre dışı bırakmak için `idleMinutes: 0` veya `maxTabsPerSession: 0` ayarlayın.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ayarlanmamışsa devre dışıdır; bu nedenle tarayıcı gezinmesi varsayılan olarak katı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezinmesine bilerek güvendiğinizde ayarlayın.
- Katı modda, uzak CDP profil uç noktaları (`profiles.*.cdpUrl`) erişilebilirlik/keşif kontrolleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski bir takma ad olarak desteklenmeye devam eder.
- Katı modda, açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca eklenebilir durumdadır (başlat/durdur/sıfırla devre dışıdır).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw'ın `/json/version` keşfetmesini istediğinizde HTTP(S) kullanın;
  sağlayıcınız size doğrudan DevTools WebSocket URL'si verdiğinde WS(S)
  kullanın.
- `remoteCdpTimeoutMs` ve `remoteCdpHandshakeTimeoutMs`, uzak ve
  `attachOnly` CDP erişilebilirliğine ve sekme açma isteklerine uygulanır. Yönetilen loopback
  profilleri yerel CDP varsayılanlarını korur.
- Harici olarak yönetilen bir CDP hizmetine loopback üzerinden erişilebiliyorsa, o
  profil için `attachOnly: true` ayarlayın; aksi halde OpenClaw loopback portunu
  yerel yönetilen bir tarayıcı profili olarak değerlendirir ve yerel port sahipliği hataları bildirebilir.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve seçilen ana makinede
  veya bağlı bir tarayıcı düğümü üzerinden eklenebilir.
- `existing-session` profilleri, Brave veya Edge gibi belirli bir Chromium tabanlı
  tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri, Chrome zaten bir DevTools HTTP(S) keşif uç noktası
  veya doğrudan WS(S) uç noktası arkasında çalışıyorsa `cdpUrl` ayarlayabilir. Bu
  modda OpenClaw, otomatik bağlanma kullanmak yerine uç noktayı Chrome MCP'ye geçirir;
  Chrome MCP başlatma argümanları için `userDataDir` yok sayılır.
- `existing-session` profilleri mevcut Chrome MCP rota sınırlarını korur:
  CSS seçici hedefleme yerine anlık görüntü/ref odaklı eylemler, tek dosya yükleme
  kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve
  `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar;
  `cdpUrl` değerini yalnızca uzak CDP profilleri veya mevcut oturum uç noktası
  ekleme için açıkça ayarlayın.
- Yerel yönetilen profiller, o profil için genel `browser.executablePath` değerini
  geçersiz kılmak üzere `executablePath` ayarlayabilir. Bunu bir profili
  Chrome'da ve başka bir profili Brave'de çalıştırmak için kullanın.
- Yerel yönetilen profiller, süreç başladıktan sonra Chrome CDP HTTP
  keşfi için `browser.localLaunchTimeoutMs`, başlatma sonrası CDP websocket
  hazır olma durumu için `browser.localCdpReadyTimeoutMs` kullanır. Chrome'un
  başarıyla başladığı ancak hazır olma kontrollerinin başlangıçla yarıştığı daha yavaş ana makinelerde
  bunları artırın. Her iki değer de `120000` ms'ye kadar pozitif tam sayı
  olmalıdır; geçersiz yapılandırma değerleri reddedilir.
- Otomatik algılama sırası: Chromium tabanlıysa varsayılan tarayıcı → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` ve `browser.profiles.<name>.executablePath` ikisi de
  Chromium başlatılmadan önce işletim sistemi ana dizininiz için `~` ve `~/...` kabul eder.
  `existing-session` profillerindeki profil başına `userDataDir` da tilde genişletilir.
- Denetim hizmeti: yalnızca loopback (`gateway.port` değerinden türetilen port, varsayılan `18791`).
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

- `mode`: `local` (gateway'i çalıştır) veya `remote` (uzak gateway'e bağlan). Gateway, `local` olmadıkça başlatmayı reddeder.
- `port`: WS + HTTP için tek çoğullamalı port. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP'si) veya `custom`.
- **Eski bind alias'ları**: `gateway.bind` içinde host alias'ları (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind'i, konteyner içinde `127.0.0.1` üzerinde dinler. Docker bridge ağıyla (`-p 18789:18789`) trafik `eth0` üzerinden gelir, bu yüzden gateway'e erişilemez. Tüm arayüzlerde dinlemek için `--network host` kullanın veya `bind: "lan"` (ya da `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Kimlik doğrulama**: varsayılan olarak zorunludur. loopback dışı bind'ler gateway kimlik doğrulaması gerektirir. Pratikte bu, paylaşılan token/parola veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkında bir reverse proxy anlamına gelir. Onboarding sihirbazı varsayılan olarak bir token üretir.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. İkisi de yapılandırılmışken mode ayarlanmamışsa başlatma ve servis kurulum/onarım akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık kimlik doğrulamasız mod. Yalnızca güvenilen local loopback kurulumları için kullanın; bu seçenek onboarding istemlerinde bilerek sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: tarayıcı/kullanıcı kimlik doğrulamasını kimlik farkında bir reverse proxy'ye devredin ve `gateway.trustedProxies` içinden gelen kimlik başlıklarına güvenin (bkz. [Güvenilen Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)). Bu mod varsayılan olarak **loopback dışı** bir proxy kaynağı bekler; aynı host üzerindeki loopback reverse proxy'ler için açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerekir. Dahili aynı host çağırıcıları yerel doğrudan fallback olarak `gateway.auth.password` kullanabilir; `gateway.auth.token`, trusted-proxy modu ile karşılıklı olarak dışlayıcı kalır.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını **kullanmaz**; bunun yerine gateway'in normal HTTP kimlik doğrulama modunu izler. Bu tokensız akış, gateway host'unun güvenilir olduğunu varsayar. `tailscale.mode = "serve"` olduğunda varsayılan değer `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP'si ve kimlik doğrulama kapsamı başına uygulanır (shared-secret ve device-token bağımsız izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Asenkron Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler hata yazımından önce seri hale getirilir. Bu nedenle aynı istemciden eşzamanlı kötü denemeler, ikisi de düz uyuşmazlık olarak yarışmak yerine ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` olur; localhost trafiğinin de hız sınırlamasına tabi olmasını bilerek istediğinizde (test kurulumları veya katı proxy dağıtımları için) `false` ayarlayın.
- Tarayıcı kökenli WS kimlik doğrulama denemeleri, loopback muafiyeti devre dışı bırakılmış şekilde her zaman sınırlandırılır (tarayıcı tabanlı localhost brute force'a karşı derinlemesine savunma).
- Loopback üzerinde, bu tarayıcı kökenli kilitlemeler normalize edilmiş `Origin`
  değeri başına izole edilir; bu nedenle bir localhost origin'inden gelen yinelenen başarısızlıklar farklı bir origin'i otomatik olarak
  kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, loopback bind) veya `funnel` (genel, kimlik doğrulama gerektirir).
- `tailscale.serviceName`: Serve modu için isteğe bağlı Tailscale Service adı, örneğin
  `svc:openclaw`. Ayarlandığında OpenClaw bunu `tailscale serve
--service` komutuna geçirir; böylece Control UI, cihaz hostname'i yerine adlandırılmış bir Service üzerinden
  sunulabilir. Değer Tailscale'in `svc:<dns-label>`
  Service adı biçimini kullanmalıdır; başlatma türetilen Service URL'sini bildirir.
- `tailscale.preserveFunnel`: `true` ve `tailscale.mode = "serve"` olduğunda OpenClaw,
  başlangıçta Serve'ü yeniden uygulamadan önce `tailscale funnel status` denetler ve
  harici olarak yapılandırılmış bir Funnel rotası gateway portunu zaten kapsıyorsa bunu atlar.
  Varsayılan `false`.
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı-origin izin listesi. Genel loopback dışı tarayıcı origin'leri için gereklidir. Loopback, RFC1918/link-local, `.local`, `.ts.net` veya Tailscale CGNAT host'larından yüklenen özel same-origin LAN/Tailnet UI, Host-header fallback'i etkinleştirilmeden kabul edilir.
- `controlUi.chatMessageMaxWidth`: gruplanmış Control UI sohbet mesajları için isteğe bağlı maksimum genişlik. `960px`, `82%`, `min(1280px, 82%)` ve `calc(100% - 2rem)` gibi sınırlandırılmış CSS genişlik değerlerini kabul eder.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host-header origin politikasına bilerek dayanan dağıtımlar için Host-header origin fallback'ini etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için genel host'larda `remote.url` `wss://` olmalıdır; düz metin `ws://` yalnızca loopback, LAN, link-local, `.local`, `.ts.net` ve Tailscale CGNAT host'ları için kabul edilir.
- `remote.remotePort`: uzak SSH host'undaki gateway portu. Varsayılan `18789`; yerel tünel portu uzak gateway portundan farklı olduğunda bunu kullanın.
- `gateway.remote.token` / `.password` uzak istemci kimlik bilgisi alanlarıdır. Tek başlarına gateway kimlik doğrulamasını yapılandırmazlar.
- `gateway.push.apns.relay.baseUrl`: relay destekli iOS derlemeleri kayıtları gateway'e yayımladıktan sonra kullanılan harici APNs relay'i için temel HTTPS URL'si. Genel App Store/TestFlight derlemeleri barındırılan OpenClaw relay'ini kullanır. Özel relay URL'leri, relay URL'si bu relay'i işaret eden kasıtlı olarak ayrı bir iOS derleme/dağıtım yoluyla eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: milisaniye cinsinden gateway'den relay'e gönderim zaman aşımı. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir gateway kimliğine devredilir. Eşleştirilmiş iOS uygulaması `gateway.identity.get` alır, bu kimliği relay kaydına dahil eder ve kayıt kapsamlı gönderim iznini gateway'e iletir. Başka bir gateway bu saklanan kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici env override'ları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL'leri için yalnızca geliştirme amaçlı kaçış yolu. Üretim relay URL'leri HTTPS üzerinde kalmalıdır.
- `gateway.handshakeTimeoutMs`: kimlik doğrulama öncesi Gateway WebSocket handshake zaman aşımı, milisaniye cinsinden. Varsayılan: `15000`. Ayarlandığında `OPENCLAW_HANDSHAKE_TIMEOUT_MS` önceliklidir. Başlangıç ısınması hâlâ otururken yerel istemcilerin bağlanabildiği yüklü veya düşük güçlü host'larda bunu artırın.
- `gateway.channelHealthCheckMinutes`: kanal sağlık izleyici aralığı, dakika cinsinden. Sağlık izleyici yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: eski soket eşiği, dakika cinsinden. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına maksimum sağlık izleyici yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izleyici etkin kalırken sağlık izleyici yeniden başlatmaları için kanal başına opt-out.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap başına override. Ayarlandığında kanal düzeyi override'a göre önceliklidir.
- Yerel gateway çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa fallback olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef aracılığıyla açıkça yapılandırılmış ve çözümlenmemişse, çözümleme kapalı güvenli şekilde başarısız olur (remote fallback maskelemesi yoktur).
- `trustedProxies`: TLS'yi sonlandıran veya forwarded-client başlıkları enjekte eden reverse proxy IP'leri. Yalnızca kontrol ettiğiniz proxy'leri listeleyin. Loopback girdileri aynı host proxy/yerel algılama kurulumları için (örneğin Tailscale Serve veya yerel reverse proxy) hâlâ geçerlidir, ancak loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hale **getirmez**.
- `allowRealIpFallback`: `true` olduğunda gateway, `X-Forwarded-For` eksikse `X-Real-IP` kabul eder. Kapalı güvenli davranış için varsayılan `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: istenen kapsam olmadan ilk kez node cihaz eşleştirmesini otomatik onaylamak için isteğe bağlı CIDR/IP izin listesi. Ayarlanmamışsa devre dışıdır. Bu, operator/browser/Control UI/WebChat eşleştirmesini otomatik onaylamaz ve rol, kapsam, metadata veya public-key yükseltmelerini otomatik onaylamaz.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: eşleştirme ve platform izin listesi değerlendirmesinden sonra bildirilmiş node komutları için genel allow/deny şekillendirmesi. `camera.snap`, `camera.clip` ve `screen.record` gibi tehlikeli node komutlarına açıkça dahil olmak için `allowCommands` kullanın; `denyCommands`, bir platform varsayılanı veya açık allow aksi halde onu içerse bile komutu kaldırır. Bir node bildirdiği komut listesini değiştirdikten sonra gateway'in güncellenmiş komut snapshot'ını saklaması için bu cihaz eşleştirmesini reddedip yeniden onaylayın.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek tool adları (varsayılan deny listesini genişletir).
- `gateway.tools.allow`: owner/admin çağırıcılar için varsayılan HTTP deny listesinden tool adlarını kaldırır. Bu, kimlik taşıyan `operator.write`
  çağırıcılarını owner/admin erişimine yükseltmez; `cron`, `gateway` ve `nodes`, allowlist'e alınsalar bile
  owner olmayan çağırıcılar için kullanılamaz kalır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Admin HTTP RPC: `admin-http-rpc` Plugin'i olarak varsayılan olarak kapalıdır. `POST /api/v1/admin/rpc` kaydetmek için Plugin'i etkinleştirin. Bkz. [Admin HTTP RPC](/tr/plugins/admin-http-rpc).
- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdisi sıkılaştırması:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarlanmamış kabul edilir; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt sıkılaştırma başlığı:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca kontrol ettiğiniz HTTPS origin'leri için ayarlayın; bkz. [Güvenilen Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çoklu instance izolasyonu

Benzersiz portlar ve state dizinleriyle tek host üzerinde birden fazla gateway çalıştırın:

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

- `enabled`: gateway dinleyicisinde TLS sonlandırmayı etkinleştirir (HTTPS/WSS) (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel kendinden imzalı sertifika/anahtar çifti otomatik üretir; yalnızca yerel/geliştirme kullanımı için.
- `certPath`: TLS sertifika dosyasına dosya sistemi yolu.
- `keyPath`: TLS private key dosyasına dosya sistemi yolu; izinleri kısıtlı tutun.
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
  - `"restart"`: yapılandırma değiştiğinde gateway sürecini her zaman yeniden başlat.
  - `"hot"`: değişiklikleri yeniden başlatmadan süreç içinde uygula.
  - `"hybrid"` (varsayılan): önce hot reload dene; gerekirse yeniden başlatmaya geri dön.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tam sayı).
- `deferralTimeoutMs`: yeniden başlatmayı veya kanal hot reload işlemini zorlamadan önce devam eden işlemleri beklemek için ms cinsinden isteğe bağlı maksimum süre. Varsayılan sınırlı beklemeyi (`300000`) kullanmak için bunu atlayın; süresiz beklemek ve düzenli aralıklarla hâlâ bekleyen uyarıları günlüğe yazmak için `0` ayarlayın.

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
- `hooks.token`, etkin Gateway paylaşılan gizli kimlik doğrulamasından (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) farklı olmalıdır; başlangıç, yeniden kullanım algıladığında ölümcül olmayan bir güvenlik uyarısını günlüğe yazar.
- `openclaw security audit`, yalnızca denetim zamanında sağlanan Gateway parola kimlik doğrulaması (`--auth password --password <password>`) dahil olmak üzere hook/Gateway kimlik doğrulama yeniden kullanımını kritik bulgu olarak işaretler. Kalıcı hale getirilmiş yeniden kullanılan bir `hooks.token` değerini döndürmek için `openclaw doctor --fix` çalıştırın, ardından dış hook göndericilerini yeni hook token'ını kullanacak şekilde güncelleyin.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini kısıtlayın (örneğin `["hook:"]`).
- Bir eşleme veya ön ayar şablonlu bir `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` ayarlayın ve `hooks.allowRequestSessionKey=true` yapın. Statik eşleme anahtarları bu açık katılımı gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükünden gelen `sessionKey` yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` üzerinden çözümlenir
  - Şablonla işlenmiş eşleme `sessionKey` değerleri dışarıdan sağlanmış kabul edilir ve ayrıca `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Eşleme ayrıntıları">

- `match.path`, `/hooks` sonrasındaki alt yolu eşleştirir (örn. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanını eşleştirir.
- `{{messages[0].subject}}` gibi şablonlar yükten okur.
- `transform`, hook eylemi döndüren bir JS/TS modülünü gösterebilir.
  - `transform.module` göreli bir yol olmalı ve `hooks.transformsDir` içinde kalmalıdır (mutlak yollar ve dizin geçişi reddedilir).
  - `hooks.transformsDir` değerini `~/.openclaw/hooks/transforms` altında tutun; çalışma alanı Skills dizinleri reddedilir. `openclaw doctor` bu yolu geçersiz bildirirse transform modülünü hook transforms dizinine taşıyın veya `hooks.transformsDir` değerini kaldırın.
- `agentId`, belirli bir ajana yönlendirir; bilinmeyen ID'ler varsayılan ajana geri döner.
- `allowedAgentIds`: `agentId` atlandığında varsayılan ajan yolu dahil olmak üzere etkin ajan yönlendirmesini kısıtlar (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan hook ajan çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranların ve şablon odaklı eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin verir (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri (istek + eşleme) için isteğe bağlı önek izin listesi, örn. `["hook:"]`. Herhangi bir eşleme veya ön ayar şablonlu `sessionKey` kullandığında zorunlu hale gelir.
- `deliver: true`, son yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` olur.
- `model`, bu hook çalıştırması için LLM'yi geçersiz kılar (model kataloğu ayarlanmışsa izin verilmiş olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail ön ayarı `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- Bu ileti başına yönlendirmeyi korursanız `hooks.allowRequestSessionKey: true` ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanıyla eşleşecek şekilde kısıtlayın, örneğin `["hook:", "hook:gmail:"]`.
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

## Canvas Plugin host'u

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
- Node WebView'ları genellikle kimlik doğrulama başlıkları göndermez; bir düğüm eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için düğüm kapsamlı yetenek URL'lerini duyurur.
- Yetenek URL'leri etkin düğüm WS oturumuna bağlıdır ve hızlıca sona erer. IP tabanlı geri dönüş kullanılmaz.
- Sunulan HTML'ye live-reload istemcisini enjekte eder.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- Ayrıca A2UI'yi `/__openclaw__/a2ui/` konumunda sunar.
- Değişiklikler gateway yeniden başlatması gerektirir.
- Büyük dizinler veya `EMFILE` hataları için live reload'u devre dışı bırakın.

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
- `full`: `cliPath` + `sshPort` değerlerini dahil eder; LAN multicast reklamı hâlâ yerleşik `bonjour` Plugin'in etkin olmasını gerektirir.
- `off`: Plugin etkinliğini değiştirmeden LAN multicast reklamını bastırır.
- Yerleşik `bonjour` Plugin, macOS host'larında otomatik başlar ve Linux, Windows ve kapsayıcıya alınmış Gateway dağıtımlarında açık katılımlıdır.
- Host adı, geçerli bir DNS etiketi olduğunda varsayılan olarak sistem host adı olur, aksi halde `openclaw` değerine geri döner. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

### Geniş alan (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` altında tek noktaya yayın DNS-SD bölgesi yazar. Ağlar arası keşif için bir DNS sunucusu (CoreDNS önerilir) + Tailscale split DNS ile eşleştirin.

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
- Eksik/boş değişkenler yapılandırma yüklemesinde hata fırlatır.
- Değişmez `${VAR}` için `$${VAR}` ile kaçış yapın.
- `$include` ile çalışır.

---

## Gizli bilgiler

Gizli bilgi referansları eklemelidir: düz metin değerler çalışmaya devam eder.

### `SecretRef`

Tek bir nesne biçimi kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Doğrulama:

- `provider` deseni: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id deseni: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: mutlak JSON işaretçisi (örneğin `"/providers/openai/apiKey"`)
- `source: "exec"` id deseni: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (AWS tarzı `secret#json_key` seçicilerini destekler)
- `source: "exec"` id'leri `.` veya `..` eğik çizgiyle ayrılmış yol segmentleri içeremez (örneğin `a/../b` reddedilir)

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

- `file` sağlayıcısı `mode: "json"` ve `mode: "singleValue"` değerlerini destekler (`id`, singleValue modunda `"value"` olmalıdır).
- Windows ACL doğrulaması kullanılamadığında dosya ve exec sağlayıcısı yolları kapalı başarısız olur. `allowInsecurePath: true` ayarını yalnızca doğrulanamayan güvenilir yollar için belirleyin.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yüklerini kullanır.
- Varsayılan olarak symlink komut yolları reddedilir. Çözümlenen hedef yolu doğrulanırken symlink yollarına izin vermek için `allowSymlinkCommand: true` ayarını belirleyin.
- `trustedDirs` yapılandırılmışsa, güvenilir dizin denetimi çözümlenen hedef yola uygulanır.
- `exec` alt ortamı varsayılan olarak minimum düzeydedir; gerekli değişkenleri `passEnv` ile açıkça geçirin.
- Gizli bilgi referansları etkinleştirme sırasında bellek içi bir anlık görüntüye çözümlenir, ardından istek yolları yalnızca anlık görüntüyü okur.
- Etkin yüzey filtreleme etkinleştirme sırasında uygulanır: etkin yüzeylerdeki çözümlenmemiş referanslar başlatmayı/yeniden yüklemeyi başarısız kılarken, etkin olmayan yüzeyler tanılamalarla atlanır.

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
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyinde başvuruları (`api_key` için `keyRef`, `token` için `tokenRef`) destekler.
- `{ "provider": { "apiKey": "..." } }` gibi eski düz `auth-profiles.json` eşlemeleri runtime formatı değildir; `openclaw doctor --fix`, bunları `.legacy-flat.*.bak` yedeğiyle kurallı `provider:default` API anahtarı profillerine yeniden yazar.
- OAuth modu profilleri (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli kimlik doğrulama profili kimlik bilgilerini desteklemez.
- Statik runtime kimlik bilgileri, bellekte çözümlenmiş anlık görüntülerden gelir; eski statik `auth.json` girdileri keşfedildiğinde temizlenir.
- Eski OAuth içe aktarımları `~/.openclaw/credentials/oauth.json` konumundan yapılır.
- Bkz. [OAuth](/tr/concepts/oauth).
- Gizli bilgiler runtime davranışı ve `audit/configure/apply` araçları: [Gizli Bilgi Yönetimi](/tr/gateway/secrets).

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

- `billingBackoffHours`: bir profil gerçek faturalandırma/yetersiz kredi hataları nedeniyle başarısız olduğunda saat cinsinden temel geri çekilme süresi (varsayılan: `5`). Açık faturalandırma metni, `401`/`403` yanıtlarında bile buraya düşebilir; ancak sağlayıcıya özgü metin eşleştiriciler, onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya kuruluş/çalışma alanı harcama limiti iletileri bunun yerine `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalandırma geri çekilme saatleri için isteğe bağlı sağlayıcı başına geçersiz kılmalar.
- `billingMaxHours`: faturalandırma geri çekilmesinin üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenli `auth_permanent` hataları için dakika cinsinden temel geri çekilme süresi (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan saat cinsinden kayan pencere (varsayılan: `24`).
- `overloadedProfileRotations`: model yedeğine geçmeden önce aşırı yüklenme hataları için aynı sağlayıcıda en fazla kimlik doğrulama profili rotasyonu sayısı (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı-meşgul şekilleri buraya düşer.
- `overloadedBackoffMs`: aşırı yüklenmiş bir sağlayıcı/profil rotasyonunu yeniden denemeden önceki sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model yedeğine geçmeden önce hız sınırı hataları için aynı sağlayıcıda en fazla kimlik doğrulama profili rotasyonu sayısı (varsayılan: `1`). Bu hız sınırı kovası, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

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
- `--verbose` kullanıldığında `consoleLevel`, `debug` düzeyine yükselir.
- `maxFileBytes`: rotasyondan önce etkin günlük dosyasının bayt cinsinden en büyük boyutu (pozitif tam sayı; varsayılan: `104857600` = 100 MB). OpenClaw, etkin dosyanın yanında en fazla beş numaralı arşiv tutar.
- `redactSensitive` / `redactPatterns`: konsol çıktısı, dosya günlükleri, OTLP günlük kayıtları ve kalıcı oturum transkripti metni için en iyi çabayla maskeleme. `redactSensitive: "off"` yalnızca bu genel günlük/transkript ilkesini devre dışı bırakır; UI/araç/tanı güvenliği yüzeyleri, yayımdan önce gizli bilgileri yine de redakte eder.

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

- `enabled`: enstrümantasyon çıktısı için ana açma kapama anahtarı (varsayılan: `true`).
- `flags`: hedefli günlük çıktısını etkinleştiren bayrak dizgileri dizisi (`"telegram.*"` veya `"*"` gibi joker karakterleri destekler).
- `stuckSessionWarnMs`: uzun süren işleme oturumlarını `session.long_running`, `session.stalled` veya `session.stuck` olarak sınıflandırmak için ms cinsinden ilerlemesiz yaş eşiği. Yanıt, araç, durum, blok ve ACP ilerlemesi zamanlayıcıyı sıfırlar; tekrarlanan `session.stuck` tanılamaları değişiklik olmadığında geri çekilir.
- `stuckSessionAbortMs`: uygun durmuş etkin işlerin kurtarma için iptal edilip boşaltılmasından önce ms cinsinden ilerlemesiz yaş eşiği. Ayarlanmadığında OpenClaw, en az 5 dakika ve `stuckSessionWarnMs` değerinin 3 katı olan daha güvenli genişletilmiş gömülü çalıştırma penceresini kullanır.
- `memoryPressureSnapshot`: bellek baskısı `critical` düzeyine ulaştığında redakte edilmiş bir OOM öncesi kararlılık anlık görüntüsü yakalar (varsayılan: `false`). Normal bellek baskısı olaylarını korurken kararlılık paketi dosya tarama/yazma işlemini eklemek için `true` olarak ayarlayın.
- `otel.enabled`: OpenTelemetry dışa aktarma işlem hattını etkinleştirir (varsayılan: `false`). Tam yapılandırma, sinyal kataloğu ve gizlilik modeli için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).
- `otel.endpoint`: OTel dışa aktarma için toplayıcı URL'si.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: isteğe bağlı sinyale özgü OTLP uç noktaları. Ayarlandıklarında yalnızca ilgili sinyal için `otel.endpoint` değerini geçersiz kılarlar.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC meta veri başlıkları.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarımını etkinleştirir.
- `otel.logsExporter`: günlük dışa aktarma hedefi: `"otlp"` (varsayılan), stdout satırı başına bir JSON nesnesi için `"stdout"` veya `"both"`.
- `otel.sampleRate`: iz örnekleme oranı `0`-`1`.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri boşaltma aralığı.
- `otel.captureContent`: OTEL span öznitelikleri için isteğe bağlı ham içerik yakalama. Varsayılan olarak kapalıdır. Boole `true`, sistem dışı ileti/araç içeriğini yakalar; nesne biçimi `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` ve `toolDefinitions` öğelerini açıkça etkinleştirmenizi sağlar.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: `{gen_ai.operation.name} {gen_ai.request.model}` span adları, `CLIENT` span türü ve eski `gen_ai.system` yerine `gen_ai.provider.name` dahil en son deneysel GenAI çıkarım span şekli için ortam açma kapama anahtarı. Varsayılan olarak span'ler uyumluluk için `openclaw.model.call` ve `gen_ai.system` değerlerini korur; GenAI metrikleri sınırlı semantik öznitelikler kullanır.
- `OPENCLAW_OTEL_PRELOADED=1`: genel bir OpenTelemetry SDK'sını zaten kaydetmiş ana bilgisayarlar için ortam açma kapama anahtarı. OpenClaw bu durumda tanı dinleyicilerini etkin tutarken Plugin sahipli SDK başlatma/kapatma işlemini atlar.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` ve `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: eşleşen yapılandırma anahtarı ayarlanmamışsa kullanılan sinyale özgü uç nokta ortam değişkenleri.
- `cacheTrace.enabled`: gömülü çalıştırmalar için önbellek izi anlık görüntülerini günlüğe kaydetir (varsayılan: `false`).
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
- `checkOnStart`: Gateway başlatıldığında npm güncellemelerini denetle (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka planda otomatik güncellemeyi etkinleştirir (varsayılan: `false`).
- `auto.stableDelayHours`: stable kanalında otomatik uygulamadan önce saat cinsinden en düşük gecikme (varsayılan: `6`; en fazla: `168`).
- `auto.stableJitterHours`: stable kanalı dağıtımı için saat cinsinden ek yayma penceresi (varsayılan: `12`; en fazla: `168`).
- `auto.betaCheckIntervalHours`: beta kanalı denetimlerinin saat cinsinden ne sıklıkla çalışacağı (varsayılan: `1`; en fazla: `24`).

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

- `enabled`: genel ACP özellik geçidi (varsayılan: `true`; ACP dispatch ve spawn erişimlerini gizlemek için `false` olarak ayarlayın).
- `dispatch.enabled`: ACP oturum turu dispatch işlemi için bağımsız geçit (varsayılan: `true`). Yürütmeyi engellerken ACP komutlarını kullanılabilir tutmak için `false` olarak ayarlayın.
- `backend`: varsayılan ACP runtime arka uç kimliği (kayıtlı bir ACP runtime Plugin ile eşleşmelidir).
  Önce arka uç Plugin'ini kurun; `plugins.allow` ayarlanmışsa arka uç Plugin kimliğini (örneğin `acpx`) dahil edin, aksi halde ACP arka ucu yüklenmez.
- `defaultAgent`: spawn işlemleri açık bir hedef belirtmediğinde yedek ACP hedef aracı kimliği.
- `allowedAgents`: ACP runtime oturumları için izin verilen aracı kimliklerinin izin listesi; boş değer ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: aynı anda etkin olabilecek en fazla ACP oturumu.
- `stream.coalesceIdleMs`: akışlı metin için ms cinsinden boşta boşaltma penceresi.
- `stream.maxChunkChars`: akışlı blok projeksiyonunu bölmeden önceki en büyük parça boyutu.
- `stream.repeatSuppression`: tur başına tekrarlanan durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı olarak akış yapar; `"final_only"` tur terminal olaylarına kadar arabelleğe alır.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünen metinden önceki ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP turu başına projekte edilen en fazla asistan çıktı karakteri.
- `stream.maxSessionUpdateChars`: projekte edilen ACP durum/güncelleme satırları için en fazla karakter.
- `stream.tagVisibility`: akışlı olaylar için etiket adlarından boole görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum çalışanları için temizlemeye uygun hale gelmeden önce dakika cinsinden boşta TTL.
- `runtime.installCommand`: bir ACP runtime ortamını başlatırken çalıştırılacak isteğe bağlı kurulum komutu.

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

- `cli.banner.taglineMode` banner sloganı stilini denetler:
  - `"random"` (varsayılan): dönüşümlü komik/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yok (banner başlığı/sürümü yine gösterilir).
- Tüm banner'ı gizlemek için (yalnızca sloganları değil), `OPENCLAW_HIDE_BANNER=1` env değerini ayarlayın.

---

## Sihirbaz

CLI yönlendirmeli kurulum akışları (`onboard`, `configure`, `doctor`) tarafından yazılan metadata:

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

## Bridge (eski, kaldırıldı)

Geçerli derlemeler artık TCP bridge içermez. Node'lar Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları kaldırabilir).

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

- `sessionRetention`: tamamlanmış yalıtılmış cron çalıştırma oturumlarının `sessions.json` içinden budanmadan önce ne kadar süre tutulacağı. Arşivlenmiş silinmiş cron transkriptlerinin temizliğini de denetler. Varsayılan: `24h`; devre dışı bırakmak için `false` olarak ayarlayın.
- `runLog.maxBytes`: eski dosya destekli cron çalıştırma günlükleriyle uyumluluk için kabul edilir. Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: iş başına tutulan en yeni SQLite çalıştırma geçmişi satırları. Varsayılan: `2000`.
- `webhookToken`: cron Webhook POST teslimi (`delivery.mode = "webhook"`) için kullanılan bearer token; atlanırsa auth başlığı gönderilmez.
- `webhook`: hâlâ `notify: true` içeren depolanmış işleri geçirmek için `openclaw doctor --fix` tarafından kullanılan, kullanımdan kaldırılmış eski yedek Webhook URL'si (http/https); runtime teslimi iş başına `delivery.mode="webhook"` ile `delivery.to` değerini veya duyuru teslimi korunurken `delivery.completionDestination` değerini kullanır.

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

Tek seferlik işler yeniden deneme girişimleri tükenene kadar etkin kalır, ardından son hata durumunu koruyarak devre dışı kalır. Yinelenen işler, bir sonraki zamanlanmış aralıklarından önce geri çekilmeden sonra yeniden çalışmak için aynı geçici yeniden deneme politikasını kullanır; kalıcı hatalar veya tükenmiş geçici yeniden denemeler, hata geri çekilmesiyle normal yinelenen zamanlamaya geri döner.

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
- `mode`: teslim modu - `"announce"` bir kanal mesajı üzerinden gönderir; `"webhook"` yapılandırılmış Webhook'a gönderir.
- `accountId`: uyarı teslimini kapsamlandırmak için isteğe bağlı hesap veya kanal id'si.

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
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi olduğunda varsayılan olarak `"announce"` olur.
- `channel`: duyuru teslimi için kanal geçersiz kılma. `"last"` bilinen son teslim kanalını yeniden kullanır.
- `to`: açık duyuru hedefi veya Webhook URL'si. Webhook modu için gereklidir.
- `accountId`: teslim için isteğe bağlı hesap geçersiz kılma.
- İş başına `delivery.failureDestination` bu genel varsayılanı geçersiz kılar.
- Ne genel ne de iş başına hata hedefi ayarlandığında, zaten `announce` üzerinden teslim eden işler hata durumunda bu birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, işin birincil `delivery.mode` değeri `"webhook"` olmadığı sürece yalnızca `sessionTarget="isolated"` işleri için desteklenir.

[Cron İşleri](/tr/automation/cron-jobs) bölümüne bakın. Yalıtılmış cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya modeli şablon değişkenleri

`tools.media.models[].args` içinde genişletilen şablon yer tutucuları:

| Değişken           | Açıklama                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Tam gelen mesaj gövdesi                           |
| `{{RawBody}}`      | Ham gövde (geçmiş/gönderen sarmalayıcıları yok)   |
| `{{BodyStripped}}` | Grup bahsetmeleri kaldırılmış gövde               |
| `{{From}}`         | Gönderen tanımlayıcısı                            |
| `{{To}}`           | Hedef tanımlayıcısı                               |
| `{{MessageSid}}`   | Kanal mesaj id'si                                 |
| `{{SessionId}}`    | Geçerli oturum UUID'si                            |
| `{{IsNewSession}}` | Yeni oturum oluşturulduğunda `"true"`             |
| `{{MediaUrl}}`     | Gelen medya sözde URL'si                          |
| `{{MediaPath}}`    | Yerel medya yolu                                  |
| `{{MediaType}}`    | Medya türü (image/audio/document/…)               |
| `{{Transcript}}`   | Ses transkripti                                   |
| `{{Prompt}}`       | CLI girişleri için çözümlenmiş medya prompt'u     |
| `{{MaxChars}}`     | CLI girişleri için çözümlenmiş maksimum çıktı karakteri |
| `{{ChatType}}`     | `"direct"` veya `"group"`                         |
| `{{GroupSubject}}` | Grup konusu (en iyi çaba)                         |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (en iyi çaba)             |
| `{{SenderName}}`   | Gönderen görünen adı (en iyi çaba)                |
| `{{SenderE164}}`   | Gönderen telefon numarası (en iyi çaba)           |
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
- Kardeş anahtarlar: include'lardan sonra birleştirilir (dahil edilen değerleri geçersiz kılar).
- İç içe include'lar: en fazla 10 seviye derinliğe kadar.
- Yollar: include eden dosyaya göre çözümlenir, ancak üst düzey yapılandırma dizininin (`openclaw.json` için `dirname`) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca yine bu sınır içinde çözümlendiklerinde izin verilir. Yollar null bayt içermemeli ve çözümlemeden önce ve sonra kesinlikle 4096 karakterden kısa olmalıdır.
- Yalnızca tek dosyalı bir include tarafından desteklenen bir üst düzey bölümü değiştiren OpenClaw sahipli yazmalar, bu dahil edilen dosyaya yazılır. Örneğin, `plugins install`, `plugins.json5` içindeki `plugins: { $include: "./plugins.json5" }` değerini günceller ve `openclaw.json` dosyasını olduğu gibi bırakır.
- Kök include'ları, include dizileri ve kardeş geçersiz kılmaları olan include'lar OpenClaw sahipli yazmalar için salt okunurdur; bu yazmalar yapılandırmayı düzleştirmek yerine güvenli biçimde başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları, döngüsel include'lar, geçersiz yol biçimi ve aşırı uzunluk için açık mesajlar.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
