---
read_when:
    - Agent varsayılanlarını ayarlama (modeller, düşünme, workspace, Heartbeat, medya, Skills)
    - Çoklu agent yönlendirmesini ve bağlamaları yapılandırma
    - Oturum, mesaj teslimi ve konuşma modu davranışını ayarlama
summary: Agent varsayılanları, çoklu agent yönlendirme, oturum, mesajlar ve konuşma yapılandırması
title: Yapılandırma — agent'lar
x-i18n:
    generated_at: "2026-04-26T11:28:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e99e1548c708e62156b3743028eaa5ee705b5f4967bffdab59c3cb342dfa724
    source_path: gateway/config-agents.md
    workflow: 15
---

`agents.*`, `multiAgent.*`, `session.*`,
`messages.*` ve `talk.*` altındaki agent kapsamlı yapılandırma anahtarları.
Kanallar, tools, gateway çalışma zamanı ve diğer üst düzey anahtarlar için bkz. [Yapılandırma referansı](/tr/gateway/configuration-reference).

## Agent varsayılanları

### `agents.defaults.workspace`

Varsayılan: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Sistem isteminin Runtime satırında gösterilen isteğe bağlı depo kökü. Ayarlanmazsa OpenClaw, workspace'ten yukarı doğru yürüyerek otomatik algılar.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills`
ayarlamayan agent'lar için isteğe bağlı varsayılan skill allowlist'i.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather değerlerini devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerine geçer
      { id: "locked-down", skills: [] }, // skill yok
    ],
  },
}
```

- Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` alanını atlayın.
- Varsayılanları devralmak için `agents.list[].skills` alanını atlayın.
- Hiç Skills olmaması için `agents.list[].skills: []` ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi o agent için son kümedir; varsayılanlarla birleşmez.

### `agents.defaults.skipBootstrap`

Workspace bootstrap dosyalarının (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) otomatik oluşturulmasını devre dışı bırakır.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Workspace bootstrap dosyalarının sistem istemine ne zaman enjekte edildiğini denetler. Varsayılan: `"always"`.

- `"continuation-skip"`: güvenli devam turları (tamamlanmış bir assistant yanıtından sonra), istem boyutunu küçülterek workspace bootstrap yeniden enjeksiyonunu atlar. Heartbeat çalıştırmaları ve Compaction sonrası yeniden denemeler yine bağlamı yeniden oluşturur.
- `"never"`: her turda workspace bootstrap ve bağlam dosyası enjeksiyonunu devre dışı bırakır. Bunu yalnızca istem yaşam döngüsüne tamamen sahip olan agent'lar için kullanın (özel bağlam motorları, kendi bağlamını oluşturan yerel çalışma zamanları veya özel bootstrap'siz iş akışları). Heartbeat ve Compaction kurtarma turları da enjeksiyonu atlar.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Kırpmadan önce workspace bootstrap dosyası başına maksimum karakter. Varsayılan: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Tüm workspace bootstrap dosyaları boyunca enjekte edilen toplam maksimum karakter. Varsayılan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Bootstrap bağlamı kırpıldığında agent tarafından görülen uyarı metnini denetler.
Varsayılan: `"once"`.

- `"off"`: sistem istemine asla uyarı metni enjekte etme.
- `"once"`: her benzersiz kırpma imzası için bir kez uyarı enjekte et (önerilir).
- `"always"`: kırpma olduğunda her çalıştırmada uyarı enjekte et.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Bağlam bütçesi sahiplik haritası

OpenClaw birden çok yüksek hacimli istem/bağlam bütçesine sahiptir ve bunlar
kasıtlı olarak tek bir genel düğme üzerinden akmak yerine alt sistemlere
bölünmüştür.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normal workspace bootstrap enjeksiyonu.
- `agents.defaults.startupContext.*`:
  son günlük `memory/*.md` dosyaları dahil tek seferlik `/new` ve `/reset`
  başlangıç önsözü.
- `skills.limits.*`:
  sistem istemine enjekte edilen kompakt Skills listesi.
- `agents.defaults.contextLimits.*`:
  sınırlı çalışma zamanı alıntıları ve enjekte edilen çalışma zamanı sahipli bloklar.
- `memory.qmd.limits.*`:
  indekslenmiş memory_search alıntısı ve enjeksiyon boyutlandırması.

Yalnızca tek bir agent farklı bir
bütçeye ihtiyaç duyduğunda eşleşen agent başına geçersiz kılmayı kullanın:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Çıplak `/new` ve `/reset`
çalıştırmalarında enjekte edilen ilk tur başlangıç önsözünü denetler.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Sınırlı çalışma zamanı bağlam yüzeyleri için paylaşılan varsayılanlar.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: kırpma metadata'sı ve devam bildirimi eklenmeden önce varsayılan `memory_get` alıntı sınırı.
- `memoryGetDefaultLines`: `lines` atlandığında varsayılan `memory_get` satır penceresi.
- `toolResultMaxChars`: kalıcılaştırılmış sonuçlar ve taşma kurtarma için kullanılan canlı tool sonuç sınırı.
- `postCompactionMaxChars`: Compaction sonrası yenileme enjeksiyonu sırasında kullanılan AGENTS.md alıntı sınırı.

#### `agents.list[].contextLimits`

Paylaşılan `contextLimits` düğmeleri için agent başına geçersiz kılma. Atlanan alanlar
`agents.defaults.contextLimits` değerinden devralınır.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Sistem istemine enjekte edilen kompakt Skills listesi için genel sınır. Bu,
gerektiğinde `SKILL.md` dosyalarının okunmasını etkilemez.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills istem bütçesi için agent başına geçersiz kılma.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Sağlayıcı çağrılarından önce transcript/tool görsel bloklarında en uzun görsel kenarı için maksimum piksel boyutu.
Varsayılan: `1200`.

Daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda vision token kullanımını ve istek payload boyutunu azaltır.
Daha yüksek değerler daha fazla görsel ayrıntıyı korur.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Sistem istemi bağlamı için saat dilimi (mesaj zaman damgaları için değil). Ana makine saat dilimine fallback yapar.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Sistem istemindeki zaman biçimi. Varsayılan: `auto` (OS tercihi).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // genel varsayılan sağlayıcı parametreleri
      agentRuntime: {
        id: "pi", // pi | auto | kayıtlı harness kimliği, örn. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Dize biçimi yalnızca birincil modeli ayarlar.
  - Nesne biçimi birincil modeli ve sıralı failover modellerini ayarlar.
- `imageModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - `image` tool yolu tarafından vision model yapılandırması olarak kullanılır.
  - Ayrıca seçili/varsayılan model görsel girdi kabul edemediğinde fallback yönlendirmesi için kullanılır.
- `imageGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan görsel oluşturma yeteneği ve görsel üreten gelecekteki tüm tool/Plugin yüzeyleri tarafından kullanılır.
  - Tipik değerler: yerel Gemini görsel oluşturma için `google/gemini-3.1-flash-image-preview`, fal için `fal/fal-ai/flux/dev`, OpenAI Images için `openai/gpt-image-2` veya saydam arka planlı OpenAI PNG/WebP çıktısı için `openai/gpt-image-1.5`.
  - Bir sağlayıcı/modeli doğrudan seçerseniz eşleşen sağlayıcı kimlik doğrulamasını da yapılandırın (örneğin `google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5` için `OPENAI_API_KEY` veya OpenAI Codex OAuth, `fal/*` için `FAL_KEY`).
  - Atlanırsa `image_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından sağlayıcı kimliği sırasına göre kayıtlı diğer görsel oluşturma sağlayıcılarını dener.
- `musicGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan müzik oluşturma yeteneği ve yerleşik `music_generate` tool'u tarafından kullanılır.
  - Tipik değerler: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` veya `minimax/music-2.6`.
  - Atlanırsa `music_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından sağlayıcı kimliği sırasına göre kayıtlı diğer müzik oluşturma sağlayıcılarını dener.
  - Bir sağlayıcı/modeli doğrudan seçerseniz eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
- `videoGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan video oluşturma yeteneği ve yerleşik `video_generate` tool'u tarafından kullanılır.
  - Tipik değerler: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` veya `qwen/wan2.7-r2v`.
  - Atlanırsa `video_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından sağlayıcı kimliği sırasına göre kayıtlı diğer video oluşturma sağlayıcılarını dener.
  - Bir sağlayıcı/modeli doğrudan seçerseniz eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
  - Paketlenmiş Qwen video oluşturma sağlayıcısı en fazla 1 çıktı videosu, 1 girdi görseli, 4 girdi videosu, 10 saniye süre ve sağlayıcı düzeyinde `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` seçeneklerini destekler.
- `pdfModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - `pdf` tool'u tarafından model yönlendirmesi için kullanılır.
  - Atlanırsa PDF tool'u sırasıyla `imageModel` ve ardından çözümlenen oturum/varsayılan modele fallback yapar.
- `pdfMaxBytesMb`: çağrı zamanında `maxBytesMb` geçirilmediğinde `pdf` tool'u için varsayılan PDF boyut sınırı.
- `pdfMaxPages`: `pdf` tool'unda extraction fallback modu tarafından dikkate alınan varsayılan azami sayfa sayısı.
- `verboseDefault`: agent'lar için varsayılan ayrıntı düzeyi. Değerler: `"off"`, `"on"`, `"full"`. Varsayılan: `"off"`.
- `elevatedDefault`: agent'lar için varsayılan yükseltilmiş çıktı düzeyi. Değerler: `"off"`, `"on"`, `"ask"`, `"full"`. Varsayılan: `"on"`.
- `model.primary`: biçim `provider/model` (örn. API anahtarı erişimi için `openai/gpt-5.5` veya Codex OAuth için `openai-codex/gpt-5.5`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, sonra bu tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra yapılandırılmış varsayılan sağlayıcıya fallback yapar (kullanımdan kaldırılmış uyumluluk davranışı, bu nedenle açık `provider/model` tercih edin). O sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, bayat kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele fallback yapar.
- `models`: `/model` için yapılandırılmış model kataloğu ve allowlist. Her girdi `alias` (kısayol) ve `params` (sağlayıcıya özgü; örneğin `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`) içerebilir.
  - Güvenli düzenlemeler: girdi eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. `config set`, `--replace` geçmediğiniz sürece mevcut allowlist girdilerini kaldıracak değişiklikleri reddeder.
  - Sağlayıcı kapsamlı yapılandırma/onboarding akışları, seçili sağlayıcı modellerini bu eşlemeye birleştirir ve zaten yapılandırılmış ilgisiz sağlayıcıları korur.
  - Doğrudan OpenAI Responses modelleri için sunucu tarafı Compaction otomatik olarak etkinleştirilir. `context_management` enjeksiyonunu durdurmak için `params.responsesServerCompaction: false`, eşiği geçersiz kılmak için `params.responsesCompactThreshold` kullanın. Bkz. [OpenAI sunucu tarafı Compaction](/tr/providers/openai#server-side-compaction-responses-api).
- `params`: tüm modellere uygulanan genel varsayılan sağlayıcı parametreleri. `agents.defaults.params` altında ayarlanır (örn. `{ cacheRetention: "long" }`).
- `params` birleştirme önceliği (config): `agents.defaults.params` (genel taban), `agents.defaults.models["provider/model"].params` (model başına) ile geçersiz kılınır; ardından `agents.list[].params` (eşleşen agent kimliği) anahtar bazında geçersiz kılar. Ayrıntılar için bkz. [Prompt Caching](/tr/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: OpenAI uyumlu proxy'ler için `api: "openai-completions"` istek gövdelerine birleştirilen gelişmiş pass-through JSON. Oluşturulmuş istek anahtarlarıyla çakışırsa ek gövde kazanır; yerel olmayan completions yolları yine de sonrasında yalnızca OpenAI'ye özgü `store` alanını çıkarır.
- `params.chat_template_kwargs`: vLLM/OpenAI uyumlu chat-template bağımsız değişkenleri; üst düzey `api: "openai-completions"` istek gövdelerine birleştirilir. `vllm/nemotron-3-*` için thinking kapalıyken OpenClaw otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir; açık `chat_template_kwargs` bu varsayılanları geçersiz kılar ve `extra_body.chat_template_kwargs` yine son önceliğe sahiptir.
- `params.preserveThinking`: yalnızca Z.AI için, korunmuş thinking'e katılımlı etkinleştirme. Etkinleştirildiğinde ve thinking açık olduğunda OpenClaw `thinking.clear_thinking: false` gönderir ve önceki `reasoning_content` değerini yeniden oynatır; bkz. [Z.AI thinking ve korunmuş thinking](/tr/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: varsayılan düşük düzey agent çalışma zamanı ilkesi. Atlanan kimlik varsayılan olarak OpenClaw Pi olur. Yerleşik PI harness'ini zorlamak için `id: "pi"`, kayıtlı Plugin harness'lerinin desteklenen modelleri sahiplenmesine izin vermek için `id: "auto"`, `id: "codex"` gibi kayıtlı bir harness kimliği veya `id: "claude-cli"` gibi desteklenen bir CLI backend takma adı kullanın. Otomatik Pi fallback'i devre dışı bırakmak için `fallback: "none"` ayarlayın. `codex` gibi açık Plugin çalışma zamanları, aynı geçersiz kılma kapsamında `fallback: "pi"` ayarlamadığınız sürece varsayılan olarak fail closed davranır. Model başvurularını kanonik `provider/model` olarak tutun; Codex, Claude CLI, Gemini CLI ve diğer yürütme backend'lerini eski çalışma zamanı sağlayıcı önekleri yerine çalışma zamanı config'i üzerinden seçin. Bunun sağlayıcı/model seçiminden nasıl farklı olduğunu görmek için bkz. [Agent runtimes](/tr/concepts/agent-runtimes).
- Bu alanları değiştiren config yazıcıları (örneğin `/models set`, `/models set-image` ve fallback ekleme/kaldırma komutları) mümkün olduğunda kanonik nesne biçimini kaydeder ve mevcut fallback listelerini korur.
- `maxConcurrent`: oturumlar arasında azami paralel agent çalıştırması (her oturum yine serileştirilir). Varsayılan: 4.

### `agents.defaults.agentRuntime`

`agentRuntime`, agent turlarını hangi düşük düzey yürütücünün çalıştırdığını denetler. Çoğu
kurulum varsayılan OpenClaw Pi çalışma zamanını korumalıdır. Paketlenmiş Codex app-server harness'i gibi güvenilen
bir Plugin yerel bir harness sağladığında veya Claude CLI gibi desteklenen bir CLI backend'i istediğinizde bunu kullanın. Zihinsel model için bkz. [Agent runtimes](/tr/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, kayıtlı bir Plugin harness kimliği veya desteklenen bir CLI backend takma adı. Paketlenmiş Codex Plugin'i `codex` kaydeder; paketlenmiş Anthropic Plugin'i `claude-cli` CLI backend'ini sağlar.
- `fallback`: `"pi"` veya `"none"`. `id: "auto"` içinde atlanan fallback varsayılan olarak `"pi"` olur; böylece eski config'ler hiçbir Plugin harness'i bir çalıştırmayı sahiplenmediğinde PI kullanmaya devam edebilir. `id: "codex"` gibi açık Plugin çalışma zamanı modunda atlanan fallback varsayılan olarak `"none"` olur; böylece eksik bir harness sessizce PI kullanmak yerine başarısız olur. Çalışma zamanı geçersiz kılmaları daha geniş bir kapsamdaki fallback'i devralmaz; o uyumluluk fallback'ini bilinçli olarak istediğinizde açık çalışma zamanının yanında `fallback: "pi"` ayarlayın. Seçilen Plugin harness başarısızlıkları her zaman doğrudan gösterilir.
- Ortam geçersiz kılmaları: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>`, `id` değerini geçersiz kılar; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none`, o süreç için fallback'i geçersiz kılar.
- Yalnızca Codex kurulumları için `model: "openai/gpt-5.5"` ve `agentRuntime.id: "codex"` ayarlayın. Okunabilirlik için açıkça `agentRuntime.fallback: "none"` da ayarlayabilirsiniz; açık Plugin çalışma zamanları için bu varsayılandır.
- Claude CLI kurulumları için `model: "anthropic/claude-opus-4-7"` artı `agentRuntime.id: "claude-cli"` tercih edin. Eski `claude-cli/claude-opus-4-7` model başvuruları uyumluluk için hâlâ çalışır, ancak yeni config sağlayıcı/model seçimini kanonik tutmalı ve yürütme backend'ini `agentRuntime.id` içine koymalıdır.
- Eski çalışma zamanı ilke anahtarları `openclaw doctor --fix` ile `agentRuntime` olarak yeniden yazılır.
- İlk gömülü çalıştırmadan sonra harness seçimi oturum kimliği başına sabitlenir. Config/env değişiklikleri mevcut bir transkripti değil, yeni veya sıfırlanmış oturumları etkiler. Transkript geçmişi olup kayıtlı sabitlemesi olmayan eski oturumlar PI'ye sabitlenmiş kabul edilir. `/status`, örneğin `Runtime: OpenClaw Pi Default` veya `Runtime: OpenAI Codex` gibi etkin çalışma zamanını bildirir.
- Bu yalnızca metin agent turu yürütmesini denetler. Medya oluşturma, vision, PDF, müzik, video ve TTS yine sağlayıcı/model ayarlarını kullanır.

**Yerleşik takma ad kısayolları** (yalnızca model `agents.defaults.models` içinde olduğunda uygulanır):

| Takma ad            | Model                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` veya `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Yapılandırdığınız takma adlar her zaman varsayılanlara üstün gelir.

Z.AI GLM-4.x modelleri, `--thinking off` ayarlamadığınız veya `agents.defaults.models["zai/<model>"].params.thinking` değerini kendiniz tanımlamadığınız sürece thinking modunu otomatik etkinleştirir.
Z.AI modelleri, tool çağrısı akışı için varsayılan olarak `tool_stream` etkinleştirir. Bunu devre dışı bırakmak için `agents.defaults.models["zai/<model>"].params.tool_stream` değerini `false` yapın.
Anthropic Claude 4.6 modelleri, açık bir thinking düzeyi ayarlanmadığında varsayılan olarak `adaptive` thinking kullanır.

### `agents.defaults.cliBackends`

Yalnızca metin tabanlı fallback çalıştırmaları için isteğe bağlı CLI backend'leri (tool çağrısı olmadan). API sağlayıcıları başarısız olduğunda yedek olarak faydalıdır.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Veya CLI bir istem dosyası bayrağını kabul ediyorsa systemPromptFileArg kullanın.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI backend'leri öncelikle metin içindir; tools her zaman devre dışıdır.
- `sessionArg` ayarlandığında oturumlar desteklenir.
- `imageArg` dosya yollarını kabul ettiğinde görsel pass-through desteklenir.

### `agents.defaults.systemPromptOverride`

OpenClaw tarafından derlenen sistem isteminin tamamını sabit bir dizeyle değiştirir. Varsayılan düzeyde (`agents.defaults.systemPromptOverride`) veya agent başına (`agents.list[].systemPromptOverride`) ayarlanır. Agent başına değerler önceliklidir; boş veya yalnızca boşluk içeren bir değer yok sayılır. Kontrollü istem deneyleri için yararlıdır.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Model ailesine göre uygulanan, sağlayıcıdan bağımsız istem katmanları. GPT-5 ailesi model kimlikleri, sağlayıcılar arasında paylaşılan davranış sözleşmesini alır; `personality` yalnızca dostça etkileşim tarzı katmanını denetler.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (varsayılan) ve `"on"`, dostça etkileşim tarzı katmanını etkinleştirir.
- `"off"`, yalnızca dostça katmanı devre dışı bırakır; etiketlenmiş GPT-5 davranış sözleşmesi etkin kalır.
- Bu paylaşılan ayar yapılmamışsa eski `plugins.entries.openai.config.personality` değeri yine okunur.

### `agents.defaults.heartbeat`

Düzenli Heartbeat çalıştırmaları.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m devre dışı bırakır
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // varsayılan: true; false, Heartbeat bölümünü sistem isteminden çıkarır
        lightContext: false, // varsayılan: false; true, workspace bootstrap dosyalarından yalnızca HEARTBEAT.md dosyasını tutar
        isolatedSession: false, // varsayılan: false; true, her heartbeat'i yeni bir oturumda çalıştırır (konuşma geçmişi yok)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (varsayılan) | block
        target: "none", // varsayılan: none | seçenekler: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: süre dizesi (ms/s/m/h). Varsayılan: `30m` (API anahtarı kimlik doğrulaması) veya `1h` (OAuth kimlik doğrulaması). Devre dışı bırakmak için `0m` ayarlayın.
- `includeSystemPromptSection`: false olduğunda, Heartbeat bölümünü sistem isteminden çıkarır ve `HEARTBEAT.md` enjeksiyonunu bootstrap bağlamında atlar. Varsayılan: `true`.
- `suppressToolErrorWarnings`: true olduğunda Heartbeat çalıştırmaları sırasında tool hata uyarısı payload'larını bastırır.
- `timeoutSeconds`: bir Heartbeat agent turu iptal edilmeden önce izin verilen azami saniye. Ayarlanmazsa `agents.defaults.timeoutSeconds` kullanılır.
- `directPolicy`: doğrudan/DM teslim ilkesi. `allow` (varsayılan) doğrudan hedef teslimine izin verir. `block`, doğrudan hedef teslimini bastırır ve `reason=dm-blocked` yayar.
- `lightContext`: true olduğunda Heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve workspace bootstrap dosyalarından yalnızca `HEARTBEAT.md` tutulur.
- `isolatedSession`: true olduğunda her Heartbeat yeni bir oturumda, önceki konuşma geçmişi olmadan çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım kalıbı. Heartbeat başına token maliyetini ~100K'dan ~2-5K token'a düşürür.
- Agent başına: `agents.list[].heartbeat` ayarlayın. Herhangi bir agent `heartbeat` tanımlarsa, Heartbeat yalnızca **o agent'lar** için çalışır.
- Heartbeat'ler tam agent turu çalıştırır — daha kısa aralıklar daha fazla token tüketir.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // kayıtlı bir compaction sağlayıcı Plugin'inin kimliği (isteğe bağlı)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom olduğunda kullanılır
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] yeniden enjeksiyonu devre dışı bırakır
        model: "openrouter/anthropic/claude-sonnet-4-6", // isteğe bağlı, yalnızca compaction için model geçersiz kılma
        notifyUser: true, // compaction başladığında ve bittiğinde kullanıcıya kısa bildirimler gönder (varsayılan: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` veya `safeguard` (uzun geçmişler için parçalı özetleme). Bkz. [Compaction](/tr/concepts/compaction).
- `provider`: kayıtlı bir compaction sağlayıcı Plugin'inin kimliği. Ayarlandığında yerleşik LLM özetlemesi yerine sağlayıcının `summarize()` yöntemi çağrılır. Başarısızlıkta yerleşik olana fallback yapar. Bir sağlayıcı ayarlamak `mode: "safeguard"` kullanımını zorunlu kılar. Bkz. [Compaction](/tr/concepts/compaction).
- `timeoutSeconds`: OpenClaw'ın iptal etmeden önce tek bir Compaction işlemine izin verdiği azami saniye. Varsayılan: `900`.
- `keepRecentTokens`: son transcript kuyruğunu olduğu gibi tutmak için Pi kesme noktası bütçesi. Elle `/compact`, açıkça ayarlandığında bunu dikkate alır; aksi halde manuel Compaction katı bir denetim noktasıdır.
- `identifierPolicy`: `strict` (varsayılan), `off` veya `custom`. `strict`, Compaction özetlemesi sırasında yerleşik opak tanımlayıcı koruma rehberliğini başa ekler.
- `identifierInstructions`: `identifierPolicy=custom` olduğunda kullanılan isteğe bağlı özel tanımlayıcı koruma metni.
- `qualityGuard`: safeguard özetleri için bozuk çıktı durumunda yeniden deneme denetimleri. Safeguard modunda varsayılan olarak etkindir; denetimi atlamak için `enabled: false` ayarlayın.
- `postCompactionSections`: Compaction sonrası yeniden enjekte edilecek isteğe bağlı AGENTS.md H2/H3 bölüm adları. Varsayılan `["Session Startup", "Red Lines"]`; yeniden enjeksiyonu devre dışı bırakmak için `[]` ayarlayın. Ayarlanmazsa veya açıkça bu varsayılan çift ayarlanırsa eski `Every Session`/`Safety` başlıkları da eski uyumluluk fallback'i olarak kabul edilir.
- `model`: yalnızca Compaction özetlemesi için isteğe bağlı `provider/model-id` geçersiz kılma. Ana oturum bir modeli korurken Compaction özetlerinin başka bir modelde çalışmasını istediğinizde bunu kullanın; ayarlanmazsa Compaction oturumun birincil modelini kullanır.
- `notifyUser`: `true` olduğunda Compaction başladığında ve tamamlandığında kullanıcıya kısa bildirimler gönderir (örneğin "Compacting context..." ve "Compaction complete"). Compaction'ın sessiz kalması için varsayılan olarak devre dışıdır.
- `memoryFlush`: otomatik Compaction öncesinde kalıcı anıları depolamak için sessiz agentik tur. Workspace salt okunursa atlanır.

### `agents.defaults.contextPruning`

LLM'e göndermeden önce bellek içi bağlamdan **eski tool sonuçlarını** budar. Diskteki oturum geçmişini **değiştirmez**.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // süre (ms/s/m/h), varsayılan birim: dakika
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl modu davranışı">

- `mode: "cache-ttl"` budama geçişlerini etkinleştirir.
- `ttl`, budamanın ne kadar sıklıkla yeniden çalışabileceğini denetler (son önbellek dokunuşundan sonra).
- Budama, önce büyük tool sonuçlarını yumuşak biçimde kırpar, gerekirse daha eski tool sonuçlarını sert biçimde temizler.

**Yumuşak kırpma**, başı + sonu korur ve ortaya `...` ekler.

**Sert temizleme**, tüm tool sonucunu yer tutucuyla değiştirir.

Notlar:

- Görsel blokları asla kırpılmaz/temizlenmez.
- Oranlar karakter tabanlıdır (yaklaşık), tam token sayıları değildir.
- `keepLastAssistants` kadar assistant mesajı yoksa budama atlanır.

</Accordion>

Davranış ayrıntıları için bkz. [Session Pruning](/tr/concepts/session-pruning).

### Blok akışı

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (minMs/maxMs kullanın)
    },
  },
}
```

- Telegram dışındaki kanallar, blok yanıtlarını etkinleştirmek için açık `*.blockStreaming: true` gerektirir.
- Kanal geçersiz kılmaları: `channels.<channel>.blockStreamingCoalesce` (ve hesap başına varyantları). Signal/Slack/Discord/Google Chat varsayılan olarak `minChars: 1500` kullanır.
- `humanDelay`: blok yanıtları arasında rastgele duraklama. `natural` = 800–2500 ms. Agent başına geçersiz kılma: `agents.list[].humanDelay`.

Davranış ve parça ayrıntıları için bkz. [Streaming](/tr/concepts/streaming).

### Yazıyor göstergeleri

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Varsayılanlar: doğrudan sohbetler/mention'lar için `instant`, mention yapılmayan grup sohbetleri için `message`.
- Oturum başına geçersiz kılmalar: `session.typingMode`, `session.typingIntervalSeconds`.

Bkz. [Typing Indicators](/tr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Gömülü agent için isteğe bağlı sandbox. Tam kılavuz için bkz. [Sandboxing](/tr/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRef / satır içi içerik de desteklenir:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox ayrıntıları">

**Backend:**

- `docker`: yerel Docker çalışma zamanı (varsayılan)
- `ssh`: genel SSH destekli uzak çalışma zamanı
- `openshell`: OpenShell çalışma zamanı

`backend: "openshell"` seçildiğinde, çalışma zamanına özgü ayarlar
`plugins.entries.openshell.config` altına taşınır.

**SSH backend config'i:**

- `target`: `user@host[:port]` biçiminde SSH hedefi
- `command`: SSH istemci komutu (varsayılan: `ssh`)
- `workspaceRoot`: kapsam başına workspace'ler için kullanılan mutlak uzak kök
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH'e geçirilen mevcut yerel dosyalar
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw'ın çalışma zamanında geçici dosyalara dönüştürdüğü satır içi içerikler veya SecretRef değerleri
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH ana makine anahtarı ilkesi düğmeleri

**SSH kimlik doğrulama önceliği:**

- `identityData`, `identityFile` üzerinde kazanır
- `certificateData`, `certificateFile` üzerinde kazanır
- `knownHostsData`, `knownHostsFile` üzerinde kazanır
- SecretRef destekli `*Data` değerleri, sandbox oturumu başlamadan önce etkin sır çalışma zamanı anlık görüntüsünden çözülür

**SSH backend davranışı:**

- oluşturma veya yeniden oluşturmadan sonra uzak workspace'i bir kez tohumlar
- ardından uzak SSH workspace'ini kanonik durumda tutar
- `exec`, dosya tools ve medya yollarını SSH üzerinden yönlendirir
- uzak değişiklikleri otomatik olarak ana makineye geri senkronize etmez
- sandbox tarayıcı kapsayıcılarını desteklemez

**Workspace erişimi:**

- `none`: `~/.openclaw/sandboxes` altında kapsam başına sandbox workspace
- `ro`: `/workspace` içinde sandbox workspace, `/agent` içinde salt okunur bağlanmış agent workspace
- `rw`: agent workspace, `/workspace` içine okuma/yazma olarak bağlanır

**Kapsam:**

- `session`: oturum başına kapsayıcı + workspace
- `agent`: agent başına bir kapsayıcı + workspace (varsayılan)
- `shared`: paylaşılan kapsayıcı ve workspace (oturumlar arası yalıtım yok)

**OpenShell Plugin config'i:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // isteğe bağlı
          gatewayEndpoint: "https://lab.example", // isteğe bağlı
          policy: "strict", // isteğe bağlı OpenShell ilke kimliği
          providers: ["openai"], // isteğe bağlı
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell modu:**

- `mirror`: `exec` öncesinde uzaktakini yerelden tohumlar, `exec` sonrasında geri senkronize eder; yerel workspace kanonik kalır
- `remote`: uzaktakini sandbox oluşturulduğunda bir kez tohumlar, ardından uzak workspace'i kanonik durumda tutar

`remote` modunda, OpenClaw dışında yapılan ana makine yerel düzenlemeleri tohumlama adımından sonra sandbox içine otomatik olarak senkronize edilmez.
Taşıma SSH üzerinden OpenShell sandbox içine yapılır, ancak sandbox yaşam döngüsüne ve isteğe bağlı mirror senkronizasyonuna Plugin sahiptir.

**`setupCommand`** kapsayıcı oluşturulduktan sonra bir kez çalışır (`sh -lc` üzerinden). Ağ çıkışı, yazılabilir kök ve root kullanıcı gerektirir.

**Kapsayıcılar varsayılan olarak `network: "none"` kullanır** — agent'ın dış erişime ihtiyacı varsa `"bridge"` (veya özel bir bridge ağı) olarak ayarlayın.
`"host"` engellenir. `"container:<id>"` ise yalnızca
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` açıkça ayarlanırsa varsayılan olarak engellenir (acil durum modu).

**Gelen ekler** etkin workspace içinde `media/inbound/*` altına hazırlanır.

**`docker.binds`** ek ana makine dizinlerini bağlar; genel ve agent başına bağlamalar birleştirilir.

**Sandbox tarayıcı** (`sandbox.browser.enabled`): kapsayıcı içinde Chromium + CDP. noVNC URL'si sistem istemine enjekte edilir. `openclaw.json` içinde `browser.enabled` gerektirmez.
noVNC gözlemci erişimi varsayılan olarak VNC kimlik doğrulaması kullanır ve OpenClaw paylaşılan URL içinde parolayı açığa çıkarmak yerine kısa ömürlü bir token URL'si üretir.

- `allowHostControl: false` (varsayılan), sandbox oturumlarının ana makine tarayıcısını hedeflemesini engeller.
- `network` varsayılan olarak `openclaw-sandbox-browser` kullanır (ayrılmış bridge ağı). Yalnızca açıkça genel bridge bağlantısı istediğinizde `bridge` olarak ayarlayın.
- `cdpSourceRange`, CDP girişini isteğe bağlı olarak kapsayıcı sınırında bir CIDR aralığına sınırlar (örneğin `172.21.0.1/32`).
- `sandbox.browser.binds`, ek ana makine dizinlerini yalnızca sandbox tarayıcı kapsayıcısına bağlar. Ayarlandığında (`[]` dahil), tarayıcı kapsayıcısı için `docker.binds` yerine geçer.
- Başlatma varsayılanları `scripts/sandbox-browser-entrypoint.sh` içinde tanımlanır ve kapsayıcı ana makineleri için ayarlanmıştır:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT değerinden türetilir>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (varsayılan olarak etkin)
  - `--disable-3d-apis`, `--disable-software-rasterizer` ve `--disable-gpu`
    varsayılan olarak etkindir ve WebGL/3D kullanımı gerektiriyorsa
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` ile devre dışı bırakılabilir.
  - İş akışınız bunlara bağlıysa uzantıları yeniden etkinleştirmek için
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` kullanın.
  - `--renderer-process-limit=2`,
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile değiştirilebilir; Chromium'un
    varsayılan süreç sınırını kullanmak için `0` ayarlayın.
  - ayrıca `noSandbox` etkinse `--no-sandbox`.
  - Varsayılanlar kapsayıcı görselinin temel çizgisidir; kapsayıcı varsayılanlarını
    değiştirmek için özel bir entrypoint içeren özel bir tarayıcı görseli kullanın.

</Accordion>

Tarayıcı sandbox'ı ve `sandbox.docker.binds` yalnızca Docker içindir.

Görselleri oluşturun:

```bash
scripts/sandbox-setup.sh           # ana sandbox görseli
scripts/sandbox-browser-setup.sh   # isteğe bağlı tarayıcı görseli
```

### `agents.list` (agent başına geçersiz kılmalar)

Bir agent'a kendi TTS sağlayıcısını, sesini, modelini,
stilini veya otomatik TTS modunu vermek için `agents.list[].tts` kullanın. Agent bloğu, genel
`messages.tts` üzerine derin birleştirme yapar; böylece paylaşılan kimlik bilgileri tek yerde kalırken,
tek tek agent'lar yalnızca ihtiyaç duydukları ses veya sağlayıcı alanlarını geçersiz kılabilir. Etkin agent'ın
geçersiz kılması; otomatik sesli yanıtlara, `/tts audio`, `/tts status` ve
`tts` agent tool'una uygulanır. Sağlayıcı örnekleri ve öncelik için bkz. [Text-to-speech](/tr/tools/tts#per-agent-voice-overrides).

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // veya { primary, fallbacks }
        thinkingDefault: "high", // agent başına thinking düzeyi geçersiz kılması
        reasoningDefault: "on", // agent başına reasoning görünürlüğü geçersiz kılması
        fastModeDefault: false, // agent başına hızlı mod geçersiz kılması
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // eşleşen defaults.models params değerlerini anahtar bazında geçersiz kılar
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // ayarlanırsa agents.defaults.skills yerine geçer
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: kararlı agent kimliği (zorunlu).
- `default`: birden fazla ayarlanmışsa ilki kazanır (uyarı günlüğe yazılır). Hiçbiri ayarlanmazsa ilk liste girdisi varsayılan olur.
- `model`: dize biçimi yalnızca `primary` değerini geçersiz kılar; nesne biçimi `{ primary, fallbacks }` her ikisini de geçersiz kılar (`[]` genel fallback'leri devre dışı bırakır). Yalnızca `primary` geçersiz kılan Cron görevleri, `fallbacks: []` ayarlamadığınız sürece varsayılan fallback'leri devralmaya devam eder.
- `params`: `agents.defaults.models` içindeki seçili model girdisi üzerine birleştirilen agent başına akış parametreleri. Tüm model kataloğunu çoğaltmadan `cacheRetention`, `temperature` veya `maxTokens` gibi agent'e özgü geçersiz kılmalar için bunu kullanın.
- `tts`: isteğe bağlı agent başına text-to-speech geçersiz kılmaları. Bu blok `messages.tts` üzerine derin birleştirme yapar; bu yüzden paylaşılan sağlayıcı kimlik bilgilerini ve fallback ilkesini `messages.tts` içinde tutun, burada yalnızca sağlayıcı, ses, model, stil veya otomatik mod gibi persona'ya özgü değerleri ayarlayın.
- `skills`: isteğe bağlı agent başına skill allowlist. Atlanırsa agent, ayarlanmışsa `agents.defaults.skills` değerini devralır; açık bir liste varsayılanlarla birleşmek yerine onların yerine geçer ve `[]` hiçbir Skills olmadığı anlamına gelir.
- `thinkingDefault`: isteğe bağlı agent başına varsayılan thinking düzeyi (`off | minimal | low | medium | high | xhigh | adaptive | max`). Mesaj başına veya oturum geçersiz kılması ayarlanmadığında bu agent için `agents.defaults.thinkingDefault` değerini geçersiz kılar. Seçili sağlayıcı/model profili hangi değerlerin geçerli olduğunu denetler; Google Gemini için `adaptive`, sağlayıcı sahipli dinamik thinking'i korur (Gemini 3/3.1'de `thinkingLevel` atlanır, Gemini 2.5'te `thinkingBudget: -1` kullanılır).
- `reasoningDefault`: isteğe bağlı agent başına varsayılan reasoning görünürlüğü (`on | off | stream`). Mesaj başına veya oturum reasoning geçersiz kılması ayarlanmadığında uygulanır.
- `fastModeDefault`: isteğe bağlı agent başına varsayılan hızlı mod değeri (`true | false`). Mesaj başına veya oturum hızlı mod geçersiz kılması ayarlanmadığında uygulanır.
- `agentRuntime`: isteğe bağlı agent başına düşük düzey çalışma zamanı ilkesi geçersiz kılması. Bir agent'ı Codex-only yapmak, diğer agent'ların ise varsayılan PI fallback'i `auto` modunda tutması için `{ id: "codex" }` kullanın.
- `runtime`: isteğe bağlı agent başına çalışma zamanı tanımlayıcısı. Agent varsayılan olarak ACP harness oturumları kullanacaksa `runtime.acp` varsayılanlarıyla (`agent`, `backend`, `mode`, `cwd`) birlikte `type: "acp"` kullanın.
- `identity.avatar`: workspace'e göreli yol, `http(s)` URL'si veya `data:` URI.
- `identity` varsayılanları türetir: `emoji` değerinden `ackReaction`, `name`/`emoji` değerlerinden `mentionPatterns`.
- `subagents.allowAgents`: `sessions_spawn` için agent kimliği allowlist'i (`["*"]` = herhangi biri; varsayılan: yalnızca aynı agent).
- Sandbox kalıtım koruması: isteyen oturum sandbox içindeyse `sessions_spawn`, sandbox olmadan çalışacak hedefleri reddeder.
- `subagents.requireAgentId`: true olduğunda `agentId` atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorlar; varsayılan: false).

---

## Çoklu agent yönlendirme

Tek bir Gateway içinde birden çok yalıtılmış agent çalıştırın. Bkz. [Multi-Agent](/tr/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Binding eşleşme alanları

- `type` (isteğe bağlı): normal yönlendirme için `route` (eksik type varsayılan olarak route olur), kalıcı ACP konuşma bağlamaları için `acp`.
- `match.channel` (zorunlu)
- `match.accountId` (isteğe bağlı; `*` = herhangi bir hesap; atlanırsa = varsayılan hesap)
- `match.peer` (isteğe bağlı; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (isteğe bağlı; kanala özgü)
- `acp` (isteğe bağlı; yalnızca `type: "acp"` için): `{ mode, label, cwd, backend }`

**Deterministik eşleşme sırası:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (tam eşleşme, peer/guild/team olmadan)
5. `match.accountId: "*"` (kanal genelinde)
6. Varsayılan agent

Her katmanda, eşleşen ilk `bindings` girdisi kazanır.

`type: "acp"` girdileri için OpenClaw, tam konuşma kimliğine göre çözümleme yapar (`match.channel` + hesap + `match.peer.id`) ve yukarıdaki route binding katman sırasını kullanmaz.

### Agent başına erişim profilleri

<Accordion title="Tam erişim (sandbox yok)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Salt okunur tools + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Dosya sistemi erişimi yok (yalnızca mesajlaşma)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Öncelik ayrıntıları için bkz. [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools).

---

## Oturum

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // bu token sayısının üzerinde üst thread fork'u atlanır (0 devre dışı bırakır)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // süre veya false
      maxDiskBytes: "500mb", // isteğe bağlı katı bütçe
      highWaterBytes: "400mb", // isteğe bağlı temizlik hedefi
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // varsayılan hareketsizlik nedeniyle otomatik odak kaldırma süresi, saat cinsinden (`0` devre dışı bırakır)
      maxAgeHours: 0, // varsayılan katı azami yaş, saat cinsinden (`0` devre dışı bırakır)
    },
    mainKey: "main", // eski (çalışma zamanı her zaman "main" kullanır)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Oturum alanı ayrıntıları">

- **`scope`**: grup sohbeti bağlamları için temel oturum gruplama stratejisi.
  - `per-sender` (varsayılan): kanal bağlamı içinde her gönderen kendi yalıtılmış oturumunu alır.
  - `global`: kanal bağlamındaki tüm katılımcılar tek bir oturumu paylaşır (yalnızca paylaşılan bağlam amaçlandığında kullanın).
- **`dmScope`**: DM'lerin nasıl gruplandığı.
  - `main`: tüm DM'ler ana oturumu paylaşır.
  - `per-peer`: kanallar arasında gönderen kimliğine göre yalıtım.
  - `per-channel-peer`: kanal + gönderen başına yalıtım (çok kullanıcılı gelen kutuları için önerilir).
  - `per-account-channel-peer`: hesap + kanal + gönderen başına yalıtım (çok hesaplı kurulumlar için önerilir).
- **`identityLinks`**: kanallar arası oturum paylaşımı için kanonik kimlikleri sağlayıcı önekli peer değerlerine eşler.
- **`reset`**: birincil sıfırlama ilkesi. `daily`, yerel saate göre `atHour` anında sıfırlar; `idle`, `idleMinutes` sonrasında sıfırlar. Her ikisi de yapılandırıldığında önce hangisinin süresi dolarsa o kazanır. Günlük sıfırlama tazeliği oturum satırının `sessionStartedAt` değerini kullanır; boşta sıfırlama tazeliği `lastInteractionAt` değerini kullanır. Heartbeat, Cron uyandırmaları, exec bildirimleri ve Gateway muhasebesi gibi arka plan/sistem olayı yazıları `updatedAt` değerini güncelleyebilir, ancak günlük/boşta oturumları taze tutmazlar.
- **`resetByType`**: tür başına geçersiz kılmalar (`direct`, `group`, `thread`). Eski `dm`, `direct` için takma ad olarak kabul edilir.
- **`parentForkMaxTokens`**: fork'lanmış bir thread oturumu oluştururken izin verilen azami üst oturum `totalTokens` değeri (varsayılan `100000`).
  - Üst `totalTokens` bu değerin üzerindeyse OpenClaw, üst transcript geçmişini devralmak yerine yeni bir thread oturumu başlatır.
  - Bu korumayı devre dışı bırakmak ve her zaman üst fork'a izin vermek için `0` ayarlayın.
- **`mainKey`**: eski alan. Çalışma zamanı ana doğrudan sohbet kovası için her zaman `"main"` kullanır.
- **`agentToAgent.maxPingPongTurns`**: agent-to-agent alışverişleri sırasında agent'lar arasındaki azami geri yanıt turu sayısı (tamsayı, aralık: `0`–`5`). `0`, ping-pong zincirlemeyi devre dışı bırakır.
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, eski `dm` takma adıyla), `keyPrefix` veya `rawKeyPrefix` ile eşleşir. İlk deny kazanır.
- **`maintenance`**: oturum deposu temizleme + saklama denetimleri.
  - `mode`: `warn` yalnızca uyarı yayar; `enforce` temizliği uygular.
  - `pruneAfter`: bayat girdiler için yaş kesme noktası (varsayılan `30d`).
  - `maxEntries`: `sessions.json` içindeki azami girdi sayısı (varsayılan `500`).
  - `rotateBytes`: `sessions.json` bu boyutu aştığında döndürür (varsayılan `10mb`).
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript arşivleri için saklama süresi. Varsayılan olarak `pruneAfter`; devre dışı bırakmak için `false` ayarlayın.
  - `maxDiskBytes`: isteğe bağlı oturumlar dizini disk bütçesi. `warn` modunda uyarı günlüğü yazar; `enforce` modunda en eski yapıtları/oturumları önce kaldırır.
  - `highWaterBytes`: bütçe temizliğinden sonraki isteğe bağlı hedef. Varsayılan olarak `maxDiskBytes` değerinin `%80`'i.
- **`threadBindings`**: thread'e bağlı oturum özellikleri için genel varsayılanlar.
  - `enabled`: ana varsayılan anahtar (sağlayıcılar geçersiz kılabilir; Discord `channels.discord.threadBindings.enabled` kullanır)
  - `idleHours`: hareketsizlik nedeniyle otomatik odak kaldırma için varsayılan saat sayısı (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `maxAgeHours`: katı azami yaş için varsayılan saat sayısı (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)

</Accordion>

---

## Mesajlar

```json5
{
  messages: {
    responsePrefix: "🦞", // veya "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 devre dışı bırakır
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Yanıt öneki

Kanal/hesap başına geçersiz kılmalar: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Çözümleme (en özel olan kazanır): hesap → kanal → genel. `""` devre dışı bırakır ve zincirlemeyi durdurur. `"auto"`, `[{identity.name}]` türetir.

**Şablon değişkenleri:**

| Değişken          | Açıklama               | Örnek                       |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Kısa model adı         | `claude-opus-4-6`           |
| `{modelFull}`     | Tam model tanımlayıcısı | `anthropic/claude-opus-4-6` |
| `{provider}`      | Sağlayıcı adı          | `anthropic`                 |
| `{thinkingLevel}` | Geçerli thinking düzeyi | `high`, `low`, `off`        |
| `{identity.name}` | Agent kimlik adı       | (`"auto"` ile aynı)         |

Değişkenler büyük/küçük harfe duyarsızdır. `{think}`, `{thinkingLevel}` için bir takma addır.

### Ack tepkisi

- Varsayılan olarak etkin agent'ın `identity.emoji` değeri kullanılır, aksi halde `"👀"`. Devre dışı bırakmak için `""` ayarlayın.
- Kanal başına geçersiz kılmalar: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Çözümleme sırası: hesap → kanal → `messages.ackReaction` → kimlik fallback'i.
- Kapsam: `group-mentions` (varsayılan), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Telegram, WhatsApp ve BlueBubbles gibi tepki destekli kanallarda yanıttan sonra ack'i kaldırır.
- `messages.statusReactions.enabled`: Slack, Discord ve Telegram üzerinde yaşam döngüsü durum tepkilerini etkinleştirir.
  Slack ve Discord'da ayarsız bırakıldığında, ack tepkileri etkinken durum tepkileri etkin kalır.
  Telegram'da yaşam döngüsü durum tepkilerini etkinleştirmek için bunu açıkça `true` yapın.

### Gelen debounce

Aynı göndericiden hızla gelen yalnızca metin içeren mesajları tek bir agent turunda toplar. Medya/ekler hemen flush edilir. Denetim komutları debounce'u atlar.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto`, varsayılan otomatik TTS modunu denetler: `off`, `always`, `inbound` veya `tagged`. `/tts on|off`, yerel tercihleri geçersiz kılabilir ve `/tts status` etkin durumu gösterir.
- `summaryModel`, otomatik özet için `agents.defaults.model.primary` değerini geçersiz kılar.
- `modelOverrides` varsayılan olarak etkindir; `modelOverrides.allowProvider` varsayılan olarak `false` olur (katılımlı etkinleştirme).
- API anahtarları `ELEVENLABS_API_KEY`/`XI_API_KEY` ve `OPENAI_API_KEY` değerlerine fallback yapar.
- Paketlenmiş konuşma sağlayıcıları Plugin sahibidir. `plugins.allow` ayarlıysa kullanmak istediğiniz her TTS sağlayıcı Plugin'ini ekleyin; örneğin Edge TTS için `microsoft`. Eski `edge` sağlayıcı kimliği, `microsoft` için takma ad olarak kabul edilir.
- `providers.openai.baseUrl`, OpenAI TTS uç noktasını geçersiz kılar. Çözümleme sırası config, sonra `OPENAI_TTS_BASE_URL`, sonra `https://api.openai.com/v1`.
- `providers.openai.baseUrl`, OpenAI dışı bir uç noktaya işaret ettiğinde OpenClaw bunu OpenAI uyumlu bir TTS sunucusu olarak değerlendirir ve model/ses doğrulamasını gevşetir.

---

## Talk

Talk modu için varsayılanlar (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- Birden fazla Talk sağlayıcısı yapılandırıldığında `talk.provider`, `talk.providers` içindeki bir anahtarla eşleşmelidir.
- Eski düz Talk anahtarları (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) yalnızca uyumluluk içindir ve otomatik olarak `talk.providers.<provider>` içine taşınır.
- Ses kimlikleri `ELEVENLABS_VOICE_ID` veya `SAG_VOICE_ID` değerlerine fallback yapar.
- `providers.*.apiKey`, düz metin dizeleri veya SecretRef nesneleri kabul eder.
- `ELEVENLABS_API_KEY` fallback'i yalnızca hiçbir Talk API anahtarı yapılandırılmadığında uygulanır.
- `providers.*.voiceAliases`, Talk yönergelerinin kolay adlar kullanmasına izin verir.
- `providers.mlx.modelId`, macOS yerel MLX yardımcısı tarafından kullanılan Hugging Face deposunu seçer. Atlanırsa macOS `mlx-community/Soprano-80M-bf16` kullanır.
- macOS MLX oynatma, mevcutsa paketlenmiş `openclaw-mlx-tts` yardımcısı veya `PATH` üzerindeki çalıştırılabilir dosya üzerinden çalışır; geliştirme için `OPENCLAW_MLX_TTS_BIN`, yardımcı yolunu geçersiz kılar.
- `speechLocale`, iOS/macOS Talk konuşma tanıma tarafından kullanılan BCP 47 yerel kimliğini ayarlar. Cihaz varsayılanını kullanmak için ayarsız bırakın.
- `silenceTimeoutMs`, Talk modunun transkripti göndermeden önce kullanıcı sessizliğinden sonra ne kadar bekleyeceğini denetler. Ayarsız bırakıldığında platform varsayılan duraklama penceresi kullanılır (`macOS ve Android'de 700 ms, iOS'ta 900 ms`).

---

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference) — diğer tüm config anahtarları
- [Yapılandırma](/tr/gateway/configuration) — yaygın görevler ve hızlı kurulum
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
