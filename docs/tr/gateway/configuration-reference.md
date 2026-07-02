---
read_when:
    - Tam alan düzeyinde yapılandırma semantiğine veya varsayılanlara ihtiyacınız var
    - Kanal, model, Gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Temel OpenClaw anahtarları, varsayılanlar ve özel alt sistem başvurularına bağlantılar için Gateway yapılandırma başvurusu
title: Yapılandırma başvurusu
x-i18n:
    generated_at: "2026-07-02T08:43:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d31c4c35f216480f4536a57bca50558a8d19dcf57dcf30be9033555c019d72
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Çekirdek `~/.openclaw/openclaw.json` yapılandırma başvurusu. Görev odaklı bir genel bakış için bkz. [Yapılandırma](/tr/gateway/configuration).

Ana OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendi daha derin başvurusu olduğunda oraya bağlantı verir. Kanal ve plugin sahipli komut katalogları ile derin bellek/QMD ayarları bu sayfa yerine kendi sayfalarında bulunur.

Kodda doğruluk kaynağı:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema'yı, mevcut olduğunda paketle gelen/plugin/kanal meta verileriyle birleştirilmiş olarak yazdırır
- `config.schema.lookup`, ayrıntıya inen araçlar için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, yapılandırma belgeleri temel hash'ini geçerli şema yüzeyine göre doğrular

Agent arama yolu: düzenlemelerden önce tam alan düzeyi belgeler ve kısıtlar için
`gateway` araç eylemi `config.schema.lookup` kullanın. Görev odaklı rehberlik için
[Yapılandırma](/tr/gateway/configuration) sayfasını, daha geniş alan haritası,
varsayılanlar ve alt sistem başvurularına bağlantılar için bu sayfayı kullanın.

Ayrılmış derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki dreaming yapılandırması için [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
- Geçerli yerleşik + paketle gelen komut kataloğu için [Slash commands](/tr/tools/slash-commands)
- Kanala özgü komut yüzeyleri için sahip kanal/plugin sayfaları

Yapılandırma biçimi **JSON5**'tir (yorumlara + sonda virgüllere izin verilir). Tüm alanlar isteğe bağlıdır - OpenClaw atlandıklarında güvenli varsayılanlar kullanır.

---

## Kanallar

Kanal başına yapılandırma anahtarları ayrılmış bir sayfaya taşındı - Slack,
Discord, Telegram, WhatsApp, Matrix, iMessage ve diğer paketle gelen kanallar
(kimlik doğrulama, erişim denetimi, çoklu hesap, mention geçidi) dahil
`channels.*` için bkz. [Yapılandırma - kanallar](/tr/gateway/config-channels).

## Agent varsayılanları, çoklu agent, oturumlar ve mesajlar

Ayrılmış bir sayfaya taşındı - şunlar için bkz.
[Yapılandırma - agent'lar](/tr/gateway/config-agents):

- `agents.defaults.*` (çalışma alanı, model, düşünme, heartbeat, bellek, medya, skills, sandbox)
- `multiAgent.*` (çoklu agent yönlendirme ve bağlamalar)
- `session.*` (oturum yaşam döngüsü, compaction, budama)
- `messages.*` (mesaj teslimi, TTS, markdown işleme)
- `talk.*` (Talk modu)
  - `talk.consultThinkingLevel`: Control UI Talk gerçek zamanlı danışmalarının arkasındaki tam OpenClaw agent çalıştırması için düşünme düzeyi geçersiz kılması
  - `talk.consultFastMode`: Control UI Talk gerçek zamanlı danışmaları için tek seferlik hızlı mod geçersiz kılması
  - `talk.speechLocale`: iOS/macOS üzerinde Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği
  - `talk.silenceTimeoutMs`: ayarlanmadığında, Talk dökümü göndermeden önce platformun varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`)
  - `talk.realtime.consultRouting`: `openclaw_agent_consult` öğesini atlayan kesinleşmiş gerçek zamanlı Talk dökümleri için Gateway relay fallback'i

## Araçlar ve özel sağlayıcılar

Araç ilkesi, deneysel anahtarlar, sağlayıcı destekli araç yapılandırması ve özel
sağlayıcı / temel URL kurulumu ayrılmış bir sayfaya taşındı - bkz.
[Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## Modeller

Sağlayıcı tanımları, model allowlist'leri ve özel sağlayıcı kurulumu
[Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools#custom-providers-and-base-urls) içinde bulunur.
`models` kökü ayrıca global model kataloğu davranışına sahiptir.

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
- `models.providers.*.localService`: yerel model sunucuları için isteğe bağlı
  isteğe bağlı süreç yöneticisi. OpenClaw yapılandırılmış sağlık uç noktasını yoklar,
  gerektiğinde mutlak `command` komutunu başlatır, hazır olmayı bekler ve ardından model
  isteğini gönderir. Bkz. [Yerel model hizmetleri](/tr/gateway/local-model-services).
- `models.pricing.enabled`: sidecar'lar ve kanallar Gateway hazır yoluna ulaştıktan
  sonra başlayan arka plan fiyatlandırma bootstrap'ini denetler. `false` olduğunda,
  Gateway OpenRouter ve LiteLLM fiyatlandırma kataloğu getirmelerini atlar; yapılandırılmış
  `models.providers.*.models[].cost` değerleri yerel maliyet tahminleri için çalışmaya devam eder.

## MCP

OpenClaw tarafından yönetilen MCP sunucu tanımları `mcp.servers` altında bulunur ve
gömülü OpenClaw ile diğer runtime adaptörleri tarafından tüketilir. `openclaw mcp list`,
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

- `mcp.servers`: yapılandırılmış MCP araçlarını açığa çıkaran runtime'lar için adlandırılmış stdio veya uzak MCP sunucu tanımları.
  Uzak girdiler `transport: "streamable-http"` veya `transport: "sse"` kullanır;
  `type: "http"`, `openclaw mcp set` ve `openclaw doctor --fix` tarafından
  kanonik `transport` alanına normalleştirilen CLI'ya özgü bir takma addır.
- `mcp.servers.<name>.enabled`: kaydedilmiş bir sunucu tanımını korurken onu gömülü OpenClaw MCP keşfi ve araç projeksiyonundan hariç tutmak için `false` ayarlayın.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: sunucu başına MCP istek zaman aşımı, saniye veya milisaniye cinsinden.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: sunucu başına bağlantı zaman aşımı, saniye veya milisaniye cinsinden.
- `mcp.servers.<name>.supportsParallelToolCalls`: paralel MCP araç çağrıları yapıp yapmamayı seçebilen adaptörler için isteğe bağlı eşzamanlılık ipucu.
- `mcp.servers.<name>.auth`: OAuth gerektiren HTTP MCP sunucuları için `"oauth"` ayarlayın. Token'ları OpenClaw state altında saklamak için `openclaw mcp login <name>` çalıştırın.
- `mcp.servers.<name>.oauth`: isteğe bağlı OAuth kapsamı, yönlendirme URL'si ve istemci meta veri URL'si geçersiz kılmaları.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: özel uç noktalar ve karşılıklı TLS için HTTP TLS denetimleri.
- `mcp.servers.<name>.toolFilter`: isteğe bağlı sunucu başına araç seçimi. `include`
  keşfedilen MCP araçlarını eşleşen adlarla sınırlar; `exclude` eşleşen adları gizler.
  Girdiler tam MCP araç adları veya basit `*` glob'larıdır. Kaynakları veya prompt'ları
  olan sunucular ayrıca yardımcı araç adları (`resources_list`, `resources_read`,
  `prompts_list`, `prompts_get`) üretir ve bu adlar aynı filtreyi kullanır.
- `mcp.servers.<name>.codex`: isteğe bağlı Codex app-server projeksiyon denetimleri.
  Bu blok yalnızca Codex app-server thread'leri için OpenClaw meta verisidir; ACP oturumlarını,
  genel Codex harness yapılandırmasını veya diğer runtime adaptörlerini etkilemez.
  Boş olmayan `codex.agents`, sunucuyu listelenen OpenClaw agent kimlikleriyle sınırlar.
  Boş, boşluklu veya geçersiz kapsamlı agent listeleri, global hale gelmek yerine
  yapılandırma doğrulaması tarafından reddedilir ve runtime projeksiyon yolu tarafından atlanır.
  `codex.defaultToolsApprovalMode`, o sunucu için Codex'in yerel
  `default_tools_approval_mode` değerini yayar. OpenClaw, yerel `mcp_servers`
  yapılandırmasını Codex'e geçirmeden önce `codex` bloğunu kaldırır. Sunucunun her Codex
  app-server agent için Codex'in varsayılan MCP onay davranışıyla projekte edilmesini
  sürdürmek için bloğu atlayın.
- `mcp.sessionIdleTtlMs`: oturum kapsamlı paketle gelen MCP runtime'ları için boşta TTL.
  Tek seferlik gömülü çalıştırmalar, çalışma sonu temizliği ister; bu TTL uzun ömürlü
  oturumlar ve gelecekteki çağıranlar için emniyet sınırıdır.
- `mcp.*` altındaki değişiklikler, önbelleğe alınmış oturum MCP runtime'ları yok edilerek sıcak uygulanır.
  Sonraki araç keşfi/kullanımı bunları yeni yapılandırmadan yeniden oluşturur; bu nedenle kaldırılan
  `mcp.servers` girdileri boşta TTL beklenmeden hemen temizlenir.
- Runtime keşfi, o oturum için önbelleğe alınmış kataloğu düşürerek MCP araç listesi değişiklik
  bildirimlerini de dikkate alır. Kaynaklar veya prompt'lar duyuran sunucular; kaynakları
  listeleme/okuma ve prompt'ları listeleme/getirme için yardımcı araçlar alır. Yinelenen araç
  çağrısı hataları, başka bir çağrı denenmeden önce etkilenen sunucuyu kısa süreliğine duraklatır.

Runtime davranışı için bkz. [MCP](/tr/cli/mcp#openclaw-as-an-mcp-client-registry) ve
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

- `allowBundled`: yalnızca paketle gelen skills için isteğe bağlı allowlist (yönetilen/çalışma alanı skills etkilenmez).
- `load.extraDirs`: ek paylaşılan skill kökleri (en düşük öncelik).
- `load.allowSymlinkTargets`: bağlantı yapılandırılmış kaynak kökünün dışında bulunduğunda skill symlink'lerinin çözümlenebileceği güvenilir gerçek hedef kökler.
- `workshop.allowSymlinkTargetWrites`: Skill Workshop apply işleminin zaten güvenilir symlink hedefleri üzerinden yazmasına izin verir (varsayılan: false).
- `install.preferBrew`: true olduğunda, `brew` kullanılabiliyorsa diğer yükleyici türlerine geri düşmeden önce Homebrew yükleyicilerini tercih edin.
- `install.nodeManager`: `metadata.openclaw.install` özellikleri için node yükleyici tercihi (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: güvenilir `operator.admin` Gateway istemcilerinin `skills.upload.*` üzerinden hazırlanmış özel zip arşivlerini yüklemesine izin verin (varsayılan: false). Bu yalnızca yüklenen arşiv yolunu etkinleştirir; normal ClawHub yüklemeleri bunu gerektirmez.
- `entries.<skillKey>.enabled: false`, paketle gelmiş/yüklenmiş olsa bile bir skill'i devre dışı bırakır.
- `entries.<skillKey>.apiKey`: birincil env var bildiren skills için kolaylık (düz metin dizesi veya SecretRef nesnesi).

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
- Bağımsız Plugin dosyalarını `plugins.load.paths` içine koyun; otomatik keşfedilen uzantı kökleri, bu köklerdeki yardımcı betiklerin başlatmayı engellememesi için üst düzey `.js`, `.mjs` ve `.ts` dosyalarını yok sayar.
- Keşif, yerel OpenClaw Plugin'lerinin yanı sıra uyumlu Codex bundle'larını ve Claude bundle'larını, manifest içermeyen Claude varsayılan düzen bundle'ları dahil kabul eder.
- **Yapılandırma değişiklikleri Gateway'in yeniden başlatılmasını gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen Plugin'ler yüklenir). `deny` önceliklidir.
- `plugins.entries.<id>.apiKey`: Plugin düzeyinde API anahtarı kolaylık alanı (Plugin tarafından desteklendiğinde).
- `plugins.entries.<id>.env`: Plugin kapsamlı ortam değişkeni eşlemi.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda çekirdek, `before_prompt_build` öğesini engeller ve eski `before_agent_start` içinden prompt'u değiştiren alanları yok sayarken eski `modelOverride` ve `providerOverride` değerlerini korur. Yerel Plugin hook'larına ve desteklenen bundle tarafından sağlanan hook dizinlerine uygulanır.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` olduğunda, güvenilen ve bundle olmayan Plugin'ler `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` ve `agent_end` gibi türlenmiş hook'lardan ham konuşma içeriğini okuyabilir.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu Plugin'e arka plan subagent çalıştırmaları için çalıştırma başına `provider` ve `model` geçersiz kılmaları istemesi konusunda açıkça güvenin.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilen subagent geçersiz kılmaları için kanonik `provider/model` hedeflerinin isteğe bağlı izin listesi. `"*"` değerini yalnızca herhangi bir modele izin vermeyi bilinçli olarak istediğinizde kullanın.
- `plugins.entries.<id>.llm.allowModelOverride`: bu Plugin'e `api.runtime.llm.complete` için model geçersiz kılmaları istemesi konusunda açıkça güvenin.
- `plugins.entries.<id>.llm.allowedModels`: güvenilen Plugin LLM tamamlama geçersiz kılmaları için kanonik `provider/model` hedeflerinin isteğe bağlı izin listesi. `"*"` değerini yalnızca herhangi bir modele izin vermeyi bilinçli olarak istediğinizde kullanın.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: bu Plugin'e `api.runtime.llm.complete` öğesini varsayılan olmayan bir agent kimliğine karşı çalıştırması konusunda açıkça güvenin.
- `plugins.entries.<id>.config`: Plugin tarafından tanımlanan yapılandırma nesnesi (mevcut olduğunda yerel OpenClaw Plugin şeması tarafından doğrulanır).
- Kanal Plugin hesabı/çalışma zamanı ayarları `channels.<id>` altında bulunur ve merkezi bir OpenClaw seçenek kayıt defteriyle değil, sahip Plugin'in manifest `channelConfigs` meta verileriyle açıklanmalıdır.

### Codex harness Plugin yapılandırması

Bundle olarak gelen `codex` Plugin'i, yerel Codex uygulama sunucusu harness ayarlarını
`plugins.entries.codex.config` altında sahiplenir. Tam yapılandırma
yüzeyi için [Codex harness başvurusu](/tr/plugins/codex-harness-reference) ve çalışma zamanı modeli için [Codex harness](/tr/plugins/codex-harness) bölümüne bakın.

`codexPlugins` yalnızca yerel Codex harness'ını seçen oturumlara uygulanır.
OpenClaw sağlayıcı çalıştırmaları, ACP konuşma bağlamaları veya Codex olmayan
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

- `plugins.entries.codex.config.codexPlugins.enabled`: Codex harness'ı için yerel Codex
  Plugin/uygulama desteğini etkinleştirir. Varsayılan: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  taşınmış Plugin uygulaması elicitation'ları için varsayılan yıkıcı eylem ilkesi.
  Güvenli Codex onay şemalarını sormadan kabul etmek için `true`, reddetmek için `false`,
  Codex tarafından gerekli onayları OpenClaw Plugin onayları üzerinden yönlendirmek için `"auto"` veya kalıcı onay olmadan her Plugin yazma/yıkıcı
  eylemi için sormak üzere `"ask"` kullanın. `"ask"` modu, etkilenen uygulama için kalıcı Codex
  araç başına onay geçersiz kılmalarını temizler ve Codex iş parçacığı başlamadan önce bu uygulama için insan
  onayları gözden geçiricisini seçer.
  Varsayılan: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: genel `codexPlugins.enabled` de doğru olduğunda
  taşınmış bir Plugin girdisini etkinleştirir.
  Varsayılan: açık girdiler için `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  kararlı marketplace kimliği. V1 yalnızca `"openai-curated"` destekler.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: taşıma işleminden gelen kararlı
  Codex Plugin kimliği, örneğin `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  Plugin başına yıkıcı eylem geçersiz kılması. Atlandığında genel
  `allow_destructive_actions` değeri kullanılır. Plugin başına değer aynı
  `true`, `false`, `"auto"` veya `"ask"` ilkelerini kabul eder.

`"ask"` kullanan kabul edilmiş her Plugin uygulaması, o uygulamanın onay isteklerini
insan gözden geçiriciye yönlendirir. Diğer uygulamalar ve uygulama dışı iş parçacığı onayları kendi
yapılandırılmış gözden geçiricisini korur; bu nedenle karma Plugin ilkeleri `"ask"` davranışını devralmaz.

`codexPlugins.enabled` genel etkinleştirme yönergesidir. Taşıma tarafından yazılan açık Plugin
girdileri, kalıcı kurulum ve onarım uygunluğu kümesidir.
`plugins["*"]` desteklenmez, `install` anahtarı yoktur ve yerel
`marketplacePath` değerleri ana makineye özgü oldukları için kasıtlı olarak yapılandırma alanı değildir.

`app/list` hazırlık denetimleri bir saat boyunca önbelleğe alınır ve eski olduğunda
asenkron olarak yenilenir. Codex iş parçacığı uygulama yapılandırması her turda değil,
Codex harness oturumu kurulurken hesaplanır; yerel Plugin yapılandırmasını değiştirdikten sonra `/new`, `/reset` veya Gateway yeniden başlatmasını kullanın.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch sağlayıcı ayarları.
  - `apiKey`: Daha yüksek limitler için isteğe bağlı Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` ortam değişkenine geri döner.
  - `baseUrl`: Firecrawl API temel URL'si (varsayılan: `https://api.firecrawl.dev`; self-hosted geçersiz kılmalar özel/dahili endpoint'leri hedeflemelidir).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkarır (varsayılan: `true`).
  - `maxAgeMs`: milisaniye cinsinden en yüksek önbellek yaşı (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: kazıma isteği zaman aşımı, saniye cinsinden (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web araması) ayarları.
  - `enabled`: X Search sağlayıcısını etkinleştirir.
  - `model`: arama için kullanılacak Grok modeli (örn. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: bellek Dreaming ayarları. Aşamalar ve eşikler için [Dreaming](/tr/concepts/dreaming) bölümüne bakın.
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam dreaming taraması için cron temposu (varsayılan olarak `"0 3 * * *"`).
  - `model`: isteğe bağlı Dream Diary subagent model geçersiz kılması. `plugins.entries.memory-core.subagent.allowModelOverride: true` gerektirir; hedefleri kısıtlamak için `allowedModels` ile eşleştirin. Model kullanılamıyor hataları oturumun varsayılan modeliyle bir kez yeniden denenir; güven veya izin listesi hataları sessizce geri dönmez.
  - aşama ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya açık yapılandırma anahtarları değildir).
- Tam bellek yapılandırması [Bellek yapılandırma başvurusu](/tr/reference/memory-config) içinde bulunur:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude bundle Plugin'leri, `settings.json` içinden gömülü OpenClaw varsayılanlarına da katkıda bulunabilir; OpenClaw bunları ham OpenClaw yapılandırma yamaları olarak değil, arındırılmış agent ayarları olarak uygular.
- `plugins.slots.memory`: etkin bellek Plugin kimliğini seçin veya bellek Plugin'lerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: etkin bağlam motoru Plugin kimliğini seçin; başka bir motor kurup seçmediğiniz sürece varsayılan `"legacy"` değeridir.

[Plugin'ler](/tr/tools/plugin) bölümüne bakın.

---

## Taahhütler

`commitments` çıkarımsal takip belleğini denetler: OpenClaw konuşma turlarından check-in'leri algılayabilir ve bunları Heartbeat çalıştırmaları üzerinden iletebilir.

- `commitments.enabled`: çıkarımsal takip taahhütleri için gizli LLM çıkarımını, depolamayı ve Heartbeat iletimini etkinleştirir. Varsayılan: `false`.
- `commitments.maxPerDay`: kayan bir günde agent oturumu başına iletilen en yüksek çıkarımsal takip taahhüdü sayısı. Varsayılan: `3`.

[Çıkarımsal taahhütler](/tr/concepts/commitments) bölümüne bakın.

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
- `tabCleanup`, boşta kalma süresinden sonra veya bir oturum sınırını aştığında
  izlenen birincil ajan sekmelerini geri kazanır. Bu ayrı temizleme modlarını
  devre dışı bırakmak için `idleMinutes: 0` veya `maxTabsPerSession: 0` ayarlayın.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ayarlanmamışsa devre dışıdır, bu nedenle tarayıcı gezinmesi varsayılan olarak katı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` değerini yalnızca özel ağ tarayıcı gezinmesine bilerek güvendiğinizde ayarlayın.
- Katı modda, uzak CDP profil uç noktaları (`profiles.*.cdpUrl`) erişilebilirlik/keşif kontrolleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski bir takma ad olarak desteklenmeye devam eder.
- Katı modda, açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca ekleme içindir (başlatma/durdurma/sıfırlama devre dışıdır).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw'ın `/json/version` keşfetmesini istediğinizde HTTP(S) kullanın; sağlayıcınız
  size doğrudan DevTools WebSocket URL'si verdiğinde WS(S) kullanın.
- `remoteCdpTimeoutMs` ve `remoteCdpHandshakeTimeoutMs`, uzak ve
  `attachOnly` CDP erişilebilirliği ile sekme açma isteklerine uygulanır. Yönetilen loopback
  profilleri yerel CDP varsayılanlarını korur.
- Harici olarak yönetilen bir CDP hizmetine loopback üzerinden erişilebiliyorsa, ilgili
  profilin `attachOnly: true` değerini ayarlayın; aksi takdirde OpenClaw loopback bağlantı noktasını
  yerel yönetilen tarayıcı profili olarak değerlendirir ve yerel bağlantı noktası sahipliği hataları bildirebilir.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve seçili ana makineye
  veya bağlı bir tarayıcı düğümü üzerinden eklenebilir.
- `existing-session` profilleri, Brave veya Edge gibi belirli bir Chromium tabanlı
  tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri, Chrome zaten DevTools HTTP(S) keşif uç noktası
  veya doğrudan WS(S) uç noktası arkasında çalışıyorsa `cdpUrl` ayarlayabilir. Bu
  modda OpenClaw, otomatik bağlanmayı kullanmak yerine uç noktayı Chrome MCP'ye geçirir;
  Chrome MCP başlatma argümanları için `userDataDir` yok sayılır.
- `existing-session` profilleri mevcut Chrome MCP rota sınırlarını korur:
  CSS seçici hedefleme yerine anlık görüntü/ref odaklı eylemler, tek dosya yükleme
  kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve
  `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; `cdpUrl`
  değerini yalnızca uzak CDP profilleri veya existing-session uç nokta ekleme
  için açıkça ayarlayın.
- Yerel yönetilen profiller, ilgili profil için genel
  `browser.executablePath` değerini geçersiz kılmak üzere `executablePath` ayarlayabilir. Bunu bir profili
  Chrome'da, diğerini Brave'de çalıştırmak için kullanın.
- Yerel yönetilen profiller, süreç başlatıldıktan sonra Chrome CDP HTTP
  keşfi için `browser.localLaunchTimeoutMs`, başlatma sonrası CDP websocket hazırlığı için
  `browser.localCdpReadyTimeoutMs` kullanır. Chrome'un başarıyla başladığı ancak
  hazırlık kontrollerinin başlatmayla yarıştığı daha yavaş ana makinelerde bunları artırın. Her iki değer de
  `120000` ms değerine kadar pozitif tam sayılar olmalıdır; geçersiz yapılandırma değerleri reddedilir.
- Otomatik algılama sırası: Chromium tabanlıysa varsayılan tarayıcı → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` ve `browser.profiles.<name>.executablePath` değerlerinin ikisi de
  Chromium başlatılmadan önce işletim sisteminizin ana dizini için `~` ve `~/...` kabul eder.
  `existing-session` profillerindeki profil başına `userDataDir` de tilde ile genişletilir.
- Kontrol hizmeti: yalnızca loopback (bağlantı noktası `gateway.port` değerinden türetilir, varsayılan `18791`).
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

- `seamColor`: yerel uygulama UI kromu için vurgu rengi (Konuşma Modu balon tonu vb.).
- `assistant`: Control UI kimlik geçersiz kılması. Etkin ajan kimliğine geri döner.

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

- `mode`: `local` (Gateway'i çalıştır) veya `remote` (uzak Gateway'e bağlan). `local` olmadıkça Gateway başlatmayı reddeder.
- `port`: WS + HTTP için tek çoklanmış bağlantı noktası. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP'si) veya `custom`.
- **Eski bind takma adları**: `gateway.bind` içinde host takma adlarını (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind'i konteyner içinde `127.0.0.1` üzerinde dinler. Docker köprü ağıyla (`-p 18789:18789`) trafik `eth0` üzerinden gelir, bu nedenle Gateway'e ulaşılamaz. Tüm arayüzlerde dinlemek için `--network host` kullanın veya `bind: "lan"` (ya da `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Kimlik doğrulama**: varsayılan olarak gereklidir. loopback dışı bind'ler Gateway kimlik doğrulaması gerektirir. Pratikte bu, paylaşılan bir token/parola veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkında bir ters proxy anlamına gelir. İlk kurulum sihirbazı varsayılan olarak bir token oluşturur.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırıldıysa (SecretRefs dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. İkisi de yapılandırılmışken mod ayarlanmamışsa başlatma ve servis yükleme/onarım akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık no-auth modu. Yalnızca güvenilir yerel local loopback kurulumları için kullanın; bu, bilinçli olarak ilk kurulum istemlerinde sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: tarayıcı/kullanıcı kimlik doğrulamasını kimlik farkında bir ters proxy'ye devredin ve `gateway.trustedProxies` kaynaklı kimlik başlıklarına güvenin (bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)). Bu mod varsayılan olarak **loopback dışı** bir proxy kaynağı bekler; aynı host loopback ters proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir. Dahili aynı host çağıranlar yerel doğrudan yedek olarak `gateway.auth.password` kullanabilir; `gateway.auth.token`, trusted-proxy moduyla karşılıklı olarak dışlayıcı kalır.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını **kullanmaz**; bunun yerine Gateway'in normal HTTP kimlik doğrulama modunu izler. Bu tokensiz akış Gateway host'unun güvenilir olduğunu varsayar. `tailscale.mode = "serve"` olduğunda varsayılan olarak `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP'si ve kimlik doğrulama kapsamı başına uygulanır (shared-secret ve device-token bağımsız izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Async Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler, hata yazımından önce serileştirilir. Bu nedenle aynı istemciden eşzamanlı hatalı denemeler, ikisi de sıradan uyuşmazlık olarak yarışıp geçmek yerine ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` olur; localhost trafiğinin de bilerek hız sınırına tabi olmasını istediğinizde (test kurulumları veya katı proxy dağıtımları için) `false` olarak ayarlayın.
- Tarayıcı kökenli WS kimlik doğrulama denemeleri, loopback muafiyeti devre dışı bırakılarak her zaman kısıtlanır (tarayıcı tabanlı localhost kaba kuvvet denemelerine karşı katmanlı savunma).
- loopback üzerinde, bu tarayıcı kökenli kilitlemeler normalleştirilmiş `Origin`
  değeri başına yalıtılır; bu nedenle bir localhost origin'inden tekrarlanan hatalar
  farklı bir origin'i otomatik olarak kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, loopback bind) veya `funnel` (herkese açık, kimlik doğrulama gerektirir).
- `tailscale.serviceName`: Serve modu için isteğe bağlı Tailscale Service adı, örneğin
  `svc:openclaw`. Ayarlandığında OpenClaw bunu `tailscale serve
--service` komutuna geçirir; böylece Control UI cihaz host adı yerine adlandırılmış bir Service üzerinden sunulabilir. Değer Tailscale'in `svc:<dns-label>`
  Service adı biçimini kullanmalıdır; başlatma türetilmiş Service URL'sini bildirir.
- `tailscale.preserveFunnel`: `true` olduğunda ve `tailscale.mode = "serve"` ise OpenClaw,
  başlangıçta Serve'i yeniden uygulamadan önce `tailscale funnel status` kontrol eder ve harici olarak yapılandırılmış bir Funnel rotası Gateway bağlantı noktasını zaten kapsıyorsa
  bunu atlar. Varsayılan `false`.
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı-origin izin listesi. Herkese açık loopback dışı tarayıcı origin'leri için gereklidir. loopback, RFC1918/link-local, `.local`, `.ts.net` veya Tailscale CGNAT host'larından yüklenen özel aynı-origin LAN/Tailnet UI'ları, Host-header yedeğini etkinleştirmeden kabul edilir.
- `controlUi.chatMessageMaxWidth`: gruplanmış Control UI sohbet mesajları için isteğe bağlı maksimum genişlik. `960px`, `82%`, `min(1280px, 82%)` ve `calc(100% - 2rem)` gibi kısıtlı CSS genişlik değerlerini kabul eder.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: bilerek Host-header origin ilkesine dayanan dağıtımlar için Host-header origin yedeğini etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için, herkese açık host'larda `remote.url` `wss://` olmalıdır; düz metin `ws://` yalnızca loopback, LAN, link-local, `.local`, `.ts.net` ve Tailscale CGNAT host'ları için kabul edilir.
- `remote.remotePort`: uzak SSH host'undaki Gateway bağlantı noktası. Varsayılan `18789`; yerel tünel bağlantı noktası uzak Gateway bağlantı noktasından farklı olduğunda bunu kullanın.
- `gateway.remote.token` / `.password` uzak istemci kimlik bilgisi alanlarıdır. Tek başlarına Gateway kimlik doğrulamasını yapılandırmazlar.
- `gateway.push.apns.relay.baseUrl`: röle destekli iOS derlemeleri kayıtları Gateway'e yayımladıktan sonra kullanılan harici APNs rölesi için temel HTTPS URL'si. Herkese açık App Store derlemeleri barındırılan OpenClaw rölesini kullanır. Özel röle URL'leri, röle URL'si o röleyi gösteren bilinçli olarak ayrı bir iOS derleme/dağıtım yolu ile eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: Gateway'den röleye gönderim zaman aşımı, milisaniye cinsinden. Varsayılan `10000`.
- Röle destekli kayıtlar belirli bir Gateway kimliğine devredilir. Eşleştirilmiş iOS uygulaması `gateway.identity.get` alır, bu kimliği röle kaydına dahil eder ve kayıt kapsamlı bir gönderim iznini Gateway'e iletir. Başka bir Gateway bu depolanmış kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki röle yapılandırması için geçici env geçersiz kılmaları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP röle URL'leri için yalnızca geliştirme amaçlı kaçış yolu. Üretim röle URL'leri HTTPS üzerinde kalmalıdır.
- `gateway.handshakeTimeoutMs`: kimlik doğrulama öncesi Gateway WebSocket el sıkışma zaman aşımı, milisaniye cinsinden. Varsayılan: `15000`. Ayarlandığında `OPENCLAW_HANDSHAKE_TIMEOUT_MS` öncelik alır. Yerel istemcilerin bağlanabildiği ancak başlangıç ısınmasının hâlâ oturduğu yüklü veya düşük güçlü host'larda bunu artırın.
- `gateway.channelHealthCheckMinutes`: kanal sağlık izleyicisi aralığı, dakika cinsinden. Sağlık izleyicisi yeniden başlatmalarını global olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: eski soket eşiği, dakika cinsinden. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya ona eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına maksimum sağlık izleyicisi yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: global izleyiciyi etkin tutarken sağlık izleyicisi yeniden başlatmaları için kanal başına devre dışı bırakma.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap başına geçersiz kılma. Ayarlandığında kanal düzeyi geçersiz kılmadan önceliklidir.
- Yerel Gateway çağrı yolları `gateway.remote.*` değerini yalnızca `gateway.auth.*` ayarlanmamışsa yedek olarak kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenmemişse, çözümleme kapalı şekilde başarısız olur (uzak yedek maskelemesi yoktur).
- `trustedProxies`: TLS'i sonlandıran veya iletilmiş istemci başlıkları enjekte eden ters proxy IP'leri. Yalnızca kontrol ettiğiniz proxy'leri listeleyin. loopback girdileri aynı host proxy/yerel algılama kurulumları için hâlâ geçerlidir (örneğin Tailscale Serve veya yerel ters proxy), ancak loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hale **getirmez**.
- `allowRealIpFallback`: `true` olduğunda Gateway, `X-Forwarded-For` eksikse `X-Real-IP` kabul eder. Kapalı şekilde başarısız olma davranışı için varsayılan `false`.
- `gateway.nodes.pairing.autoApproveCidrs`: istenen kapsam olmadan ilk kez node cihaz eşleştirmesini otomatik onaylamak için isteğe bağlı CIDR/IP izin listesi. Ayarlanmamışsa devre dışıdır. Bu, operatör/tarayıcı/Control UI/WebChat eşleştirmesini otomatik onaylamaz ve rol, kapsam, metadata veya public-key yükseltmelerini otomatik onaylamaz.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: eşleştirme ve platform izin listesi değerlendirmesinden sonra bildirilen node komutları için global izin/verme şekillendirmesi. `camera.snap`, `camera.clip` ve `screen.record` gibi tehlikeli node komutlarını kabul etmek için `allowCommands` kullanın; `denyCommands`, bir platform varsayılanı veya açık izin aksi halde içerecek olsa bile komutu kaldırır. Bir node bildirilen komut listesini değiştirdikten sonra, Gateway'in güncellenmiş komut anlık görüntüsünü depolaması için o cihaz eşleştirmesini reddedip yeniden onaylayın.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek tool adları (varsayılan engelleme listesini genişletir).
- `gateway.tools.allow`: owner/admin çağıranlar için varsayılan HTTP engelleme listesinden tool adlarını kaldırın. Bu, kimlik taşıyan `operator.write`
  çağıranları owner/admin erişimine yükseltmez; izin listesine alınsalar bile `cron`, `gateway` ve `nodes` owner olmayan çağıranlar için
  kullanılamaz kalır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Admin HTTP RPC: varsayılan olarak `admin-http-rpc` Plugin'i olarak kapalıdır. `POST /api/v1/admin/rpc` kaydetmek için Plugin'i etkinleştirin. Bkz. [Admin HTTP RPC](/tr/plugins/admin-http-rpc).
- Chat Completions: varsayılan olarak devre dışıdır. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdisi sıkılaştırması:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarlanmamış olarak ele alınır; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı response sıkılaştırma başlığı:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca kontrol ettiğiniz HTTPS origin'leri için ayarlayın; bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çoklu instance yalıtımı

Tek bir host üzerinde benzersiz bağlantı noktaları ve state dizinleriyle birden fazla Gateway çalıştırın:

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

- `enabled`: Gateway listener'ında TLS sonlandırmayı etkinleştirir (HTTPS/WSS) (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel self-signed sertifika/anahtar çifti otomatik oluşturur; yalnızca yerel/dev kullanımı için.
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
  - `"hybrid"` (varsayılan): önce sıcak yeniden yüklemeyi dene; gerekirse yeniden başlatmaya geri dön.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tamsayı).
- `deferralTimeoutMs`: yeniden başlatmayı veya kanal sıcak yeniden yüklemesini zorlamadan önce devam eden işlemleri beklemek için ms cinsinden isteğe bağlı en uzun süre. Varsayılan sınırlı beklemeyi (`300000`) kullanmak için atlayın; süresiz beklemek ve düzenli olarak hâlâ beklemede uyarıları günlüğe yazmak için `0` olarak ayarlayın.

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
Sorgu dizesi hook token’ları reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, etkin Gateway paylaşılan gizli kimlik doğrulamasından (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) farklı olmalıdır; başlangıç, yeniden kullanım algıladığında ölümcül olmayan bir güvenlik uyarısı günlüğe yazar.
- `openclaw security audit`, yalnızca denetim zamanında sağlanan Gateway parola kimlik doğrulaması (`--auth password --password <password>`) dahil olmak üzere hook/Gateway kimlik doğrulaması yeniden kullanımını kritik bir bulgu olarak işaretler. Kalıcı yeniden kullanılan bir `hooks.token` değerini döndürmek için `openclaw doctor --fix` çalıştırın, ardından harici hook göndericilerini yeni hook token’ını kullanacak şekilde güncelleyin.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini sınırlayın (örneğin `["hook:"]`).
- Bir eşleme veya önayar şablonlu bir `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` ayarlayın ve `hooks.allowRequestSessionKey=true` yapın. Statik eşleme anahtarları bu katılımı gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükündeki `sessionKey` yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` aracılığıyla çözümlenir
  - Şablonla işlenen eşleme `sessionKey` değerleri harici olarak sağlanmış kabul edilir ve ayrıca `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Mapping details">

- `match.path`, `/hooks` sonrasındaki alt yolla eşleşir (örn. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanıyla eşleşir.
- `{{messages[0].subject}}` gibi şablonlar yükten okur.
- `transform`, bir hook eylemi döndüren bir JS/TS modülünü gösterebilir.
  - `transform.module` göreli bir yol olmalıdır ve `hooks.transformsDir` içinde kalır (mutlak yollar ve dizin dışına çıkma reddedilir).
  - `hooks.transformsDir` değerini `~/.openclaw/hooks/transforms` altında tutun; çalışma alanı skill dizinleri reddedilir. `openclaw doctor` bu yolu geçersiz bildirirse transform modülünü hooks transforms dizinine taşıyın veya `hooks.transformsDir` değerini kaldırın.
- `agentId`, belirli bir ajana yönlendirir; bilinmeyen kimlikler varsayılan ajana geri döner.
- `allowedAgentIds`: `agentId` atlandığında varsayılan ajan yolu dahil olmak üzere etkin ajan yönlendirmesini kısıtlar (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık bir `sessionKey` olmadan hook ajan çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranlarının ve şablon odaklı eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin verir (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri (istek + eşleme) için isteğe bağlı önek izin listesi, örn. `["hook:"]`. Herhangi bir eşleme veya önayar şablonlu bir `sessionKey` kullandığında zorunlu hale gelir.
- `deliver: true`, son yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` değerini alır.
- `model`, bu hook çalıştırması için LLM’yi geçersiz kılar (model kataloğu ayarlanmışsa izin verilmiş olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail önayarı `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- Bu ileti başına yönlendirmeyi korursanız `hooks.allowRequestSessionKey: true` ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanıyla eşleşecek şekilde sınırlayın, örneğin `["hook:", "hook:gmail:"]`.
- `hooks.allowRequestSessionKey: false` gerekiyorsa önayarı şablonlu varsayılan yerine statik bir `sessionKey` ile geçersiz kılın.

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

- Ajan tarafından düzenlenebilir HTML/CSS/JS ve A2UI’yi Gateway portu altında HTTP üzerinden sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` değerini koruyun (varsayılan).
- Loopback olmayan bağlamalar: canvas rotaları, diğer Gateway HTTP yüzeyleriyle aynı şekilde Gateway kimlik doğrulaması (token/parola/güvenilir proxy) gerektirir.
- Node WebViews genellikle kimlik doğrulama üstbilgileri göndermez; bir düğüm eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için düğüm kapsamlı yetenek URL’lerini duyurur.
- Yetenek URL’leri etkin düğüm WS oturumuna bağlıdır ve hızla sona erer. IP tabanlı geri dönüş kullanılmaz.
- Sunulan HTML’ye canlı yeniden yükleme istemcisi enjekte eder.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- Ayrıca A2UI’yi `/__openclaw__/a2ui/` konumunda sunar.
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

- `minimal` (yerleşik `bonjour` Plugin etkin olduğunda varsayılan): TXT kayıtlarından `cliPath` + `sshPort` öğelerini çıkar.
- `full`: `cliPath` + `sshPort` öğelerini dahil et; LAN çoklu yayın reklamı yine de yerleşik `bonjour` Plugin’in etkin olmasını gerektirir.
- `off`: Plugin etkinliğini değiştirmeden LAN çoklu yayın reklamını bastır.
- Yerleşik `bonjour` Plugin, macOS ana makinelerinde otomatik başlar ve Linux, Windows ve kapsayıcılaştırılmış Gateway dağıtımlarında katılıma bağlıdır.
- Ana makine adı, geçerli bir DNS etiketi olduğunda varsayılan olarak sistem ana makine adını alır; aksi halde `openclaw` değerine geri döner. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

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
- Eksik/boş değişkenler yapılandırma yüklenirken hata fırlatır.
- Değişmez `${VAR}` için `$${VAR}` ile kaçış yapın.
- `$include` ile çalışır.

---

## Gizli Bilgiler

Gizli bilgi başvuruları eklemelidir: düz metin değerler hâlâ çalışır.

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
- `source: "exec"` id’leri `.` veya `..` eğik çizgiyle ayrılmış yol segmentleri içermemelidir (örneğin `a/../b` reddedilir)

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

- `file` sağlayıcısı `mode: "json"` ve `mode: "singleValue"` destekler (`singleValue` modunda `id`, `"value"` olmalıdır).
- Windows ACL doğrulaması kullanılamadığında dosya ve exec sağlayıcı yolları güvenli biçimde kapalı kalır. `allowInsecurePath: true` değerini yalnızca doğrulanamayan güvenilir yollar için ayarlayın.
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yükleri kullanır.
- Varsayılan olarak sembolik bağlantı komut yolları reddedilir. Çözümlenen hedef yolu doğrularken sembolik bağlantı yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın.
- `trustedDirs` yapılandırılmışsa, güvenilir dizin denetimi çözümlenen hedef yola uygulanır.
- `exec` alt ortamı varsayılan olarak en az düzeydedir; gerekli değişkenleri `passEnv` ile açıkça geçirin.
- Gizli bilgi başvuruları etkinleştirme zamanında bellek içi bir anlık görüntüye çözümlenir, ardından istek yolları yalnızca anlık görüntüyü okur.
- Etkin yüzey filtreleme etkinleştirme sırasında uygulanır: etkin yüzeylerdeki çözümlenmemiş başvurular başlatma/yeniden yüklemeyi başarısız kılar, etkin olmayan yüzeyler ise tanılamalarla atlanır.

---

## Kimlik Doğrulama Depolaması

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
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyinde refs (`api_key` için `keyRef`, `token` için `tokenRef`) destekler.
- `{ "provider": { "apiKey": "..." } }` gibi eski düz `auth-profiles.json` eşlemeleri bir çalışma zamanı biçimi değildir; `openclaw doctor --fix` bunları `.legacy-flat.*.bak` yedeğiyle kurallı `provider:default` API anahtarı profillerine yeniden yazar.
- OAuth modu profilleri (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli kimlik doğrulama profili kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri, bellekte çözümlenmiş anlık görüntülerden gelir; eski statik `auth.json` girdileri bulunduğunda temizlenir.
- Eski OAuth içe aktarmaları `~/.openclaw/credentials/oauth.json` konumundan yapılır.
- Bkz. [OAuth](/tr/concepts/oauth).
- Sırlar çalışma zamanı davranışı ve `audit/configure/apply` araçları: [Sır Yönetimi](/tr/gateway/secrets).

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

- `billingBackoffHours`: bir profil gerçek faturalandırma/yetersiz kredi hataları nedeniyle başarısız olduğunda saat cinsinden temel geri çekilme (varsayılan: `5`). Açık faturalandırma metni, `401`/`403` yanıtlarında bile buraya düşebilir, ancak sağlayıcıya özgü metin eşleştiricileri onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya kuruluş/çalışma alanı harcama sınırı iletileri bunun yerine `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalandırma geri çekilme saatleri için isteğe bağlı sağlayıcı başına geçersiz kılmalar.
- `billingMaxHours`: faturalandırma geri çekilmesinin üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenilirlikli `auth_permanent` hataları için dakika cinsinden temel geri çekilme (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan saat cinsinden kayan pencere (varsayılan: `24`).
- `overloadedProfileRotations`: model yedeğine geçmeden önce aşırı yük hataları için aynı sağlayıcıdaki en fazla kimlik doğrulama profili döndürmesi (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı meşgul biçimleri buraya düşer.
- `overloadedBackoffMs`: aşırı yüklenmiş bir sağlayıcı/profil döndürmesini yeniden denemeden önceki sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model yedeğine geçmeden önce hız sınırı hataları için aynı sağlayıcıdaki en fazla kimlik doğrulama profili döndürmesi (varsayılan: `1`). Bu hız sınırı kovası `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

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
- `maxFileBytes`: döndürmeden önce etkin günlük dosyasının bayt cinsinden en büyük boyutu (pozitif tamsayı; varsayılan: `104857600` = 100 MB). OpenClaw, etkin dosyanın yanında en fazla beş numaralı arşiv tutar.
- `redactSensitive` / `redactPatterns`: konsol çıktısı, dosya günlükleri, OTLP günlük kayıtları ve kalıcı oturum transcript metni için en iyi çaba maskelemesi. `redactSensitive: "off"` yalnızca bu genel günlük/transcript ilkesini devre dışı bırakır; UI/araç/tanı güvenliği yüzeyleri sırları yayımlamadan önce yine de redakte eder.

---

## Tanılar

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

- `enabled`: enstrümantasyon çıktısı için ana açma/kapama ayarı (varsayılan: `true`).
- `flags`: hedefli günlük çıktısını etkinleştiren bayrak dizeleri dizisi (`"telegram.*"` veya `"*"` gibi joker karakterleri destekler).
- `stuckSessionWarnMs`: uzun süren işleme oturumlarını `session.long_running`, `session.stalled` veya `session.stuck` olarak sınıflandırmak için ms cinsinden ilerleme olmama yaşı eşiği. Yanıt, araç, durum, blok ve ACP ilerlemesi zamanlayıcıyı sıfırlar; yinelenen `session.stuck` tanıları değişiklik olmadığında geri çekilir.
- `stuckSessionAbortMs`: uygun takılı etkin işin kurtarma için iptal edilip boşaltılabilmesinden önce ms cinsinden ilerleme olmama yaşı eşiği. Ayarlanmadığında OpenClaw, en az 5 dakika ve `stuckSessionWarnMs` değerinin 3 katı olan daha güvenli uzatılmış gömülü çalışma penceresini kullanır.
- `memoryPressureSnapshot`: bellek baskısı `critical` düzeyine ulaştığında redakte edilmiş bir OOM öncesi kararlılık anlık görüntüsü yakalar (varsayılan: `false`). Normal bellek baskısı olaylarını korurken kararlılık paketi dosya tarama/yazmasını eklemek için `true` olarak ayarlayın.
- `otel.enabled`: OpenTelemetry dışa aktarma hattını etkinleştirir (varsayılan: `false`). Tam yapılandırma, sinyal kataloğu ve gizlilik modeli için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).
- `otel.endpoint`: OTel dışa aktarımı için toplayıcı URL'si.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: isteğe bağlı sinyale özgü OTLP uç noktaları. Ayarlandıklarında, yalnızca o sinyal için `otel.endpoint` değerini geçersiz kılarlar.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC metadata başlıkları.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarımını etkinleştirir.
- `otel.logsExporter`: günlük dışa aktarma hedefi: `"otlp"` (varsayılan), stdout satırı başına bir JSON nesnesi için `"stdout"` veya `"both"`.
- `otel.sampleRate`: iz örnekleme oranı `0`-`1`.
- `otel.flushIntervalMs`: ms cinsinden periyodik telemetri boşaltma aralığı.
- `otel.captureContent`: OTEL span öznitelikleri için isteğe bağlı ham içerik yakalama. Varsayılan olarak kapalıdır. Boolean `true`, sistem dışı ileti/araç içeriğini yakalar; nesne biçimi `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` ve `toolDefinitions` değerlerini açıkça etkinleştirmenizi sağlar.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: `{gen_ai.operation.name} {gen_ai.request.model}` span adları, `CLIENT` span türü ve eski `gen_ai.system` yerine `gen_ai.provider.name` dahil olmak üzere en son deneysel GenAI çıkarım span biçimi için ortam açma/kapama ayarı. Varsayılan olarak span'ler uyumluluk için `openclaw.model.call` ve `gen_ai.system` değerlerini korur; GenAI metrikleri sınırlı anlamsal öznitelikler kullanır.
- `OPENCLAW_OTEL_PRELOADED=1`: zaten global bir OpenTelemetry SDK kaydetmiş hostlar için ortam açma/kapama ayarı. OpenClaw bu durumda tanı dinleyicilerini etkin tutarken Plugin tarafından sahiplenilen SDK başlatma/kapatma işlemini atlar.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` ve `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: eşleşen yapılandırma anahtarı ayarlanmamışsa kullanılan sinyale özgü uç nokta ortam değişkenleri.
- `cacheTrace.enabled`: gömülü çalışmalar için önbellek izleme anlık görüntülerini günlüğe kaydeder (varsayılan: `false`).
- `cacheTrace.filePath`: önbellek izleme JSONL çıktısı için çıkış yolu (varsayılan: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: önbellek izleme çıktısına nelerin dahil edileceğini kontrol eder (tümünün varsayılanı: `true`).

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
- `checkOnStart`: Gateway başladığında npm güncellemelerini denetler (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka plan otomatik güncellemeyi etkinleştirir (varsayılan: `false`).
- `auto.stableDelayHours`: stable kanalda otomatik uygulama öncesi saat cinsinden en az gecikme (varsayılan: `6`; en fazla: `168`).
- `auto.stableJitterHours`: stable kanal yayılımı için saat cinsinden ek dağıtım penceresi (varsayılan: `12`; en fazla: `168`).
- `auto.betaCheckIntervalHours`: beta kanal denetimlerinin saat cinsinden ne sıklıkla çalışacağı (varsayılan: `1`; en fazla: `24`).

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

- `enabled`: global ACP özellik kapısı (varsayılan: `true`; ACP dispatch ve spawn affordance'larını gizlemek için `false` olarak ayarlayın).
- `dispatch.enabled`: ACP oturum turu dispatch için bağımsız kapı (varsayılan: `true`). Yürütmeyi engellerken ACP komutlarını kullanılabilir tutmak için `false` olarak ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı backend kimliği (kayıtlı bir ACP çalışma zamanı Plugin ile eşleşmelidir).
  Önce backend Plugin'ini kurun ve `plugins.allow` ayarlanmışsa backend Plugin kimliğini dahil edin (örneğin `acpx`), aksi takdirde ACP backend yüklenmez.
- `defaultAgent`: spawn'lar açık bir hedef belirtmediğinde yedek ACP hedef ajan kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen ajan kimliklerinin izin listesi; boş olması ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: aynı anda etkin olabilecek en fazla ACP oturumu.
- `stream.coalesceIdleMs`: akış halinde gönderilen metin için ms cinsinden boşta bekleme boşaltma penceresi.
- `stream.maxChunkChars`: akış halinde gönderilen blok projeksiyonunu bölmeden önceki en büyük parça boyutu.
- `stream.repeatSuppression`: tur başına yinelenen durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı olarak akış yapar; `"final_only"` tur terminal olaylarına kadar arabelleğe alır.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önceki ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP turu başına projelendirilen en fazla asistan çıktı karakteri.
- `stream.maxSessionUpdateChars`: projelendirilen ACP durum/güncelleme satırları için en fazla karakter.
- `stream.tagVisibility`: akış olayları için etiket adlarından boolean görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum worker'ları için temizlemeye uygun hale gelmeden önce dakika cinsinden boşta kalma TTL'si.
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

- `cli.banner.taglineMode` banner sloganı stilini kontrol eder:
  - `"random"` (varsayılan): dönüşümlü komik/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yoktur (banner başlığı/sürümü yine gösterilir).
- Bannerın tamamını gizlemek için (yalnızca sloganları değil), `OPENCLAW_HIDE_BANNER=1` env değerini ayarlayın.

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

[Aracı varsayılanları](/tr/gateway/config-agents#agent-defaults) altındaki `agents.list` kimlik alanlarına bakın.

---

## Bridge (eski, kaldırıldı)

Geçerli derlemeler artık TCP bridge içermez. Node'lar Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları çıkarabilir).

<Accordion title="Eski bridge yapılandırması (tarihsel referans)">

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

- `sessionRetention`: tamamlanan yalıtılmış cron çalıştırma oturumlarının `sessions.json` içinden temizlenmeden önce ne kadar süre tutulacağı. Arşivlenmiş silinmiş cron transkriptlerinin temizlenmesini de kontrol eder. Varsayılan: `24h`; devre dışı bırakmak için `false` olarak ayarlayın.
- `runLog.maxBytes`: eski dosya destekli cron çalıştırma günlükleriyle uyumluluk için kabul edilir. Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: iş başına tutulan en yeni SQLite çalıştırma geçmişi satırları. Varsayılan: `2000`.
- `webhookToken`: cron Webhook POST teslimi (`delivery.mode = "webhook"`) için kullanılan bearer token; atlanırsa auth başlığı gönderilmez.
- `webhook`: hâlâ `notify: true` içeren kayıtlı işleri taşımak için `openclaw doctor --fix` tarafından kullanılan, kullanımdan kaldırılmış eski yedek Webhook URL'si (http/https); çalışma zamanı teslimi iş başına `delivery.mode="webhook"` ile `delivery.to` değerini ya da duyuru teslimini korurken `delivery.completionDestination` değerini kullanır.

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
- `backoffMs`: her yeniden deneme girişimi için ms cinsinden geri çekilme gecikmeleri dizisi (varsayılan: `[30000, 60000, 300000]`; 1-10 girdi).
- `retryOn`: yeniden denemeleri tetikleyen hata türleri - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Tüm geçici türleri yeniden denemek için atlayın.

Tek seferlik işler, yeniden deneme girişimleri tükenene kadar etkin kalır, ardından son hata durumunu koruyarak devre dışı bırakılır. Yinelenen işler, bir sonraki zamanlanmış yuvalarından önce geri çekilmeden sonra tekrar çalışmak için aynı geçici yeniden deneme ilkesini kullanır; kalıcı hatalar veya tükenmiş geçici yeniden denemeler, hata geri çekilmesiyle normal yinelenen zamanlamaya geri döner.

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
- `after`: bir uyarı tetiklenmeden önceki ardışık hata sayısı (pozitif tam sayı, en az: `1`).
- `cooldownMs`: aynı iş için yinelenen uyarılar arasındaki en az milisaniye (negatif olmayan tam sayı).
- `includeSkipped`: ardışık atlanan çalıştırmaları uyarı eşiğine dahil et (varsayılan: `false`). Atlanan çalıştırmalar ayrı izlenir ve yürütme hatası geri çekilmesini etkilemez.
- `mode`: teslim modu - `"announce"` bir kanal mesajı üzerinden gönderir; `"webhook"` yapılandırılmış Webhook'a gönderi yapar.
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
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi olduğunda varsayılan olarak `"announce"` kullanılır.
- `channel`: duyuru teslimi için kanal geçersiz kılması. `"last"` bilinen son teslim kanalını yeniden kullanır.
- `to`: açık duyuru hedefi veya Webhook URL'si. Webhook modu için zorunludur.
- `accountId`: teslim için isteğe bağlı hesap geçersiz kılması.
- İş başına `delivery.failureDestination` bu genel varsayılanı geçersiz kılar.
- Genel ya da iş başına hata hedefi ayarlanmadığında, zaten `announce` üzerinden teslim eden işler hata durumunda o birincil duyuru hedefine geri döner.
- `delivery.failureDestination`, işin birincil `delivery.mode` değeri `"webhook"` olmadığı sürece yalnızca `sessionTarget="isolated"` işleri için desteklenir.

[Cron İşleri](/tr/automation/cron-jobs) bölümüne bakın. Yalıtılmış cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya modeli şablon değişkenleri

`tools.media.models[].args` içinde genişletilen şablon yer tutucuları:

| Değişken           | Açıklama                                           |
| ------------------ | -------------------------------------------------- |
| `{{Body}}`         | Tam gelen mesaj gövdesi                            |
| `{{RawBody}}`      | Ham gövde (geçmiş/gönderen sarmalayıcıları yok)    |
| `{{BodyStripped}}` | Grup mention'ları çıkarılmış gövde                 |
| `{{From}}`         | Gönderen tanımlayıcısı                             |
| `{{To}}`           | Hedef tanımlayıcısı                                |
| `{{MessageSid}}`   | Kanal mesajı id'si                                 |
| `{{SessionId}}`    | Geçerli oturum UUID'si                             |
| `{{IsNewSession}}` | Yeni oturum oluşturulduğunda `"true"`              |
| `{{MediaUrl}}`     | Gelen medya sözde URL'si                           |
| `{{MediaPath}}`    | Yerel medya yolu                                   |
| `{{MediaType}}`    | Medya türü (image/audio/document/…)                |
| `{{Transcript}}`   | Ses transkripti                                    |
| `{{Prompt}}`       | CLI girdileri için çözümlenmiş medya prompt'u      |
| `{{MaxChars}}`     | CLI girdileri için çözümlenmiş en fazla çıktı karakteri |
| `{{ChatType}}`     | `"direct"` veya `"group"`                          |
| `{{GroupSubject}}` | Grup konusu (en iyi çaba)                          |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (en iyi çaba)              |
| `{{SenderName}}`   | Gönderen görünen adı (en iyi çaba)                 |
| `{{SenderE164}}`   | Gönderen telefon numarası (en iyi çaba)            |
| `{{Provider}}`     | Sağlayıcı ipucu (whatsapp, telegram, discord, etc.) |

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

- Tek dosya: içeren nesnenin yerini alır.
- Dosya dizisi: sırayla derin birleştirilir (sonrakiler öncekileri geçersiz kılar).
- Kardeş anahtarlar: include'lardan sonra birleştirilir (include edilen değerleri geçersiz kılar).
- İç içe include'lar: en fazla 10 seviye derinliğe kadar.
- Yollar: include eden dosyaya göre çözümlenir, ancak üst düzey yapılandırma dizininin (`openclaw.json` için `dirname`) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca yine bu sınır içinde çözümlendiklerinde izin verilir. Yollar null bayt içermemeli ve çözümlemeden önce ve sonra kesinlikle 4096 karakterden kısa olmalıdır.
- Tek dosyalı include tarafından desteklenen yalnızca bir üst düzey bölümü değiştiren OpenClaw'a ait yazımlar, o include edilen dosyaya yazılır. Örneğin, `plugins install`, `plugins: { $include: "./plugins.json5" }` değerini `plugins.json5` içinde günceller ve `openclaw.json` dosyasını olduğu gibi bırakır.
- Kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar, OpenClaw'a ait yazımlar için salt okunurdur; bu yazımlar yapılandırmayı düzleştirmek yerine kapalı şekilde başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları, döngüsel include'lar, geçersiz yol biçimi ve aşırı uzunluk için net iletiler.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
