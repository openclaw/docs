---
read_when:
    - '`tools.*` politikası, izin listeleri veya deneysel özellikleri yapılandırma'
    - Özel sağlayıcıları kaydetme veya temel URL'leri geçersiz kılma
    - OpenAI uyumlu kendi barındırılan uç noktaları ayarlama
sidebarTitle: Tools and custom providers
summary: Araç yapılandırması (politika, deneysel açma/kapatmalar, sağlayıcı destekli araçlar) ve özel sağlayıcı/temel URL kurulumu
title: Yapılandırma — araçlar ve özel sağlayıcılar
x-i18n:
    generated_at: "2026-06-28T00:33:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` yapılandırma anahtarları ve özel sağlayıcı / temel URL kurulumu. Ajanlar, kanallar ve diğer üst düzey yapılandırma anahtarları için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration-reference).

## Araçlar

### Araç profilleri

`tools.profile`, `tools.allow`/`tools.deny` öncesinde bir temel izin listesi ayarlar:

<Note>
Yerel başlangıç kurulumu, ayarlanmamış yeni yerel yapılandırmaları varsayılan olarak `tools.profile: "coding"` değerine ayarlar (mevcut açık profiller korunur).
</Note>

| Profil      | İçerdikleri                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | yalnızca `session_status`                                                                                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | Kısıtlama yok (ayarlanmamış ile aynı)                                                                                                             |

### Araç grupları

| Grup               | Araçlar                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash`, `exec` için takma ad olarak kabul edilir)                                  |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | Tüm yerleşik araçlar (sağlayıcı Plugin'leri hariç)                                                                      |
| `group:plugins`    | `bundle-mcp` üzerinden sunulan yapılandırılmış MCP sunucuları dahil, yüklenen Plugin'lere ait araçlar                   |

### Korumalı alan araç ilkesi içindeki MCP ve Plugin araçları

Yapılandırılmış MCP sunucuları, `bundle-mcp` Plugin kimliği altında Plugin'e ait araçlar olarak sunulur. Normal araç profilleri bunlara izin verebilir, ancak `tools.sandbox.tools`, korumalı alan oturumları için ek bir geçittir. Korumalı alan modu `"all"` veya `"non-main"` ise MCP/Plugin araçlarının görünür olması gerektiğinde korumalı alan araç izin listesine şu girdilerden birini ekleyin:

- `mcp.servers` içindeki OpenClaw tarafından yönetilen MCP sunucuları için `bundle-mcp`
- belirli bir yerel Plugin için Plugin kimliği
- yüklenen tüm Plugin'e ait araçlar için `group:plugins`
- yalnızca tek bir sunucuyu istediğinizde tam MCP sunucu araç adları veya `outlook__send_mail` ya da `outlook__*` gibi sunucu glob'ları

Sunucu glob'ları, ham `mcp.servers` anahtarı olmak zorunda olmayan, sağlayıcı açısından güvenli MCP sunucu önekini kullanır. `[A-Za-z0-9_-]` dışındaki karakterler `-` olur, harfle başlamayan adlara `mcp-` öneki eklenir ve uzun ya da yinelenen önekler kısaltılabilir veya sonek alabilir; örneğin, `mcp.servers["Outlook Graph"]`, `outlook-graph__*` gibi bir glob kullanır.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

Bu korumalı alan katmanı girdisi olmadan MCP sunucusu yine başarıyla yüklenebilir, ancak araçları sağlayıcı isteğinden önce filtrelenir. `mcp.servers` içindeki OpenClaw tarafından yönetilen sunucular için bu şekli yakalamak üzere `openclaw doctor` kullanın. Paketlenmiş Plugin manifestlerinden veya Claude `.mcp.json` dosyasından yüklenen MCP sunucuları aynı korumalı alan geçidini kullanır, ancak bu tanılama henüz bu kaynakları listelemez; araçları korumalı alan turlarında kaybolursa aynı izin listesi girdilerini kullanın.

### `tools.codeMode`

`tools.codeMode`, genel OpenClaw kod modu yüzeyini etkinleştirir. Araçlarla yapılan bir çalıştırma için etkinleştirildiğinde model yalnızca `exec` ve `wait` görür; normal OpenClaw araçları korumalı alan içindeki `tools.*` katalog köprüsünün arkasına taşınır ve MCP araçları oluşturulan `MCP` ad alanı üzerinden kullanılabilir.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Kısa gösterim de kabul edilir:

```json5
{
  tools: { codeMode: true },
}
```

MCP bildirimleri, kod modunda salt okunur sanal API dosya yüzeyi üzerinden sunulur. Konuk kod, `MCP.<server>.<tool>()` çağırmadan önce TypeScript tarzı imzaları incelemek için `API.list("mcp")` ve `API.read("mcp/<server>.d.ts")` çağırabilir. Çalışma zamanı sözleşmesi, sınırlar ve hata ayıklama adımları için bkz. [Kod modu](/tr/reference/code-mode).

### `tools.allow` / `tools.deny`

Genel araç izin/reddetme ilkesi (reddetme kazanır). Büyük/küçük harfe duyarsızdır, `*` joker karakterlerini destekler. Docker korumalı alanı kapalıyken bile uygulanır.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` ve `apply_patch` ayrı araç kimlikleridir. `allow: ["write"]`, uyumlu modeller için `apply_patch` öğesini de etkinleştirir, ancak `deny: ["write"]`, `apply_patch` öğesini reddetmez. Tüm dosya değişikliklerini engellemek için `group:fs` öğesini reddedin veya her değişiklik yapan aracı açıkça listeleyin:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Belirli sağlayıcılar veya modeller için araçları daha da kısıtlar. Sıra: temel profil → sağlayıcı profili → izin/reddetme.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

Belirli bir istekte bulunan kimliği için araçları kısıtlar. Bu, kanal erişim denetiminin üzerinde katmanlı savunmadır; gönderici değerleri ileti metninden değil, kanal bağdaştırıcısından gelmelidir.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

Anahtarlar açık önekler kullanır: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` veya `"*"`. Kanal kimlikleri kanonik OpenClaw kimlikleridir; `teams` gibi takma adlar `msteams` olarak normalleştirilir. Eski öneksiz anahtarlar yalnızca `id:` olarak kabul edilir. Eşleştirme sırası channel+id, id, e164, username, name ve ardından joker karakterdir.

Ajan başına `agents.list[].tools.toolsBySender`, eşleştiğinde, boş bir `{}` ilkesiyle bile genel gönderici eşleşmesini geçersiz kılar.

### `tools.elevated`

Korumalı alan dışındaki yükseltilmiş exec erişimini denetler:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Ajan başına geçersiz kılma (`agents.list[].tools.elevated`) yalnızca daha fazla kısıtlayabilir.
- `/elevated on|off|ask|full` durumu oturum başına saklar; satır içi yönergeler tek iletiye uygulanır.
- Yükseltilmiş `exec`, korumalı alanı atlar ve yapılandırılmış kaçış yolunu kullanır (varsayılan olarak `gateway` veya exec hedefi `node` olduğunda `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Araç döngüsü güvenlik denetimleri **varsayılan olarak devre dışıdır**. Algılamayı etkinleştirmek için `enabled: true` ayarlayın. Ayarlar genel olarak `tools.loopDetection` içinde tanımlanabilir ve ajan başına `agents.list[].tools.loopDetection` konumunda geçersiz kılınabilir.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Döngü analizi için saklanan en fazla araç çağrısı geçmişi.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Uyarılar için yinelenen ilerleme göstermeyen örüntü eşiği.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Kritik döngüleri engellemek için daha yüksek yineleme eşiği.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Herhangi bir ilerleme göstermeyen çalıştırma için kesin durdurma eşiği.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Aynı araç/aynı bağımsız değişkenlerle yinelenen çağrılarda uyar.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Bilinen yoklama araçlarında (`process.poll`, `command_status` vb.) uyar/engelle.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Dönüşümlü ilerleme göstermeyen çift örüntülerinde uyar/engelle.
</ParamField>

<Warning>
`warningThreshold >= criticalThreshold` veya `criticalThreshold >= globalCircuitBreakerThreshold` ise doğrulama başarısız olur.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Gelen medya anlama özelliğini yapılandırır (görüntü/ses/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Medya modeli girdi alanları">
    **Sağlayıcı girdisi** (`type: "provider"` veya atlanmış):

    - `provider`: API sağlayıcı kimliği (`openai`, `anthropic`, `google`/`gemini`, `groq` vb.)
    - `model`: model kimliği geçersiz kılma değeri
    - `profile` / `preferredProfile`: `auth-profiles.json` profil seçimi

    **CLI girdisi** (`type: "cli"`):

    - `command`: çalıştırılacak yürütülebilir dosya
    - `args`: şablonlu argümanlar (`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` vb. desteklenir; `openclaw doctor --fix`, kullanımdan kaldırılmış `{input}` yer tutucularını `{{MediaPath}}` değerine geçirir)

    **Ortak alanlar:**

    - `capabilities`: isteğe bağlı liste (`image`, `audio`, `video`). Varsayılanlar: `openai`/`anthropic`/`minimax` → görüntü, `google` → görüntü+ses+video, `groq` → ses.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: girdi başına geçersiz kılmalar.
    - `tools.media.image.timeoutSeconds` ve eşleşen görüntü modeli `timeoutSeconds` girdileri, ajan açık `image` aracını çağırdığında da uygulanır. Görüntü anlama için bu zaman aşımı isteğin kendisine uygulanır ve önceki hazırlık çalışması nedeniyle azaltılmaz.
    - Hatalar bir sonraki girdiye geri döner.

    Sağlayıcı kimlik doğrulaması standart sırayı izler: `auth-profiles.json` → ortam değişkenleri → `models.providers.*.apiKey`.

    **Eşzamansız tamamlama alanları:**

    - `asyncCompletion.directSend`: kullanımdan kaldırılmış uyumluluk bayrağı. Tamamlanan eşzamansız medya görevleri, ajanın sonucu alması, kullanıcıya nasıl bildireceğine karar vermesi ve kaynak teslimatı gerektirdiğinde mesaj aracını kullanması için istek sahibi oturumu aracılığıyla yönetilmeye devam eder.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Oturum araçları (`sessions_list`, `sessions_history`, `sessions_send`) tarafından hangi oturumların hedeflenebileceğini denetler.

Varsayılan: `tree` (geçerli oturum + alt ajanlar gibi onun tarafından oluşturulan oturumlar).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Görünürlük kapsamları">
    - `self`: yalnızca geçerli oturum anahtarı.
    - `tree`: geçerli oturum + geçerli oturum tarafından oluşturulan oturumlar (alt ajanlar).
    - `agent`: geçerli ajan kimliğine ait herhangi bir oturum (aynı ajan kimliği altında gönderici başına oturumlar çalıştırıyorsanız diğer kullanıcıları içerebilir).
    - `all`: herhangi bir oturum. Ajanlar arası hedefleme yine de `tools.agentToAgent` gerektirir.
    - Korumalı alan sınırlaması: geçerli oturum korumalı alandaysa ve `agents.defaults.sandbox.sessionToolsVisibility="spawned"` ise, `tools.sessions.visibility="all"` olsa bile görünürlük `tree` değerine zorlanır.
    - `all` olmadığında, `sessions_list` etkili modu açıklayan kompakt bir `visibility` alanı ve bazı oturumların geçerli kapsam dışında atlanabileceğine dair bir uyarı içerir.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

`sessions_spawn` için satır içi ek desteğini denetler.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ek notları">
    - Ekler `enabled: true` gerektirir.
    - Alt ajan ekleri, alt çalışma alanında `.openclaw/attachments/<uuid>/` konumuna bir `.manifest.json` ile oluşturulur.
    - ACP ekleri yalnızca görüntüdür ve aynı dosya sayısı, dosya başına bayt ve toplam bayt sınırları geçildikten sonra ACP çalışma zamanına satır içi iletilir.
    - Ek içeriği, transkript kalıcılığından otomatik olarak redakte edilir.
    - Base64 girdileri katı alfabe/dolgu denetimleri ve kod çözme öncesi boyut korumasıyla doğrulanır.
    - Alt ajan ek dosyası izinleri dizinler için `0700`, dosyalar için `0600` değerindedir.
    - Alt ajan temizliği `cleanup` ilkesini izler: `delete` ekleri her zaman kaldırır; `keep` bunları yalnızca `retainOnSessionKeep: true` olduğunda tutar.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Deneysel yerleşik araç bayrakları. Katı-ajan tabanlı GPT-5 otomatik etkinleştirme kuralı uygulanmadıkça varsayılan olarak kapalıdır.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: önemsiz olmayan çok adımlı iş takibi için yapılandırılmış `update_plan` aracını etkinleştirir.
- Varsayılan: `agents.defaults.embeddedAgent.executionContract` (veya ajan başına geçersiz kılma) bir OpenAI ya da OpenAI Codex GPT-5 ailesi çalıştırması için `"strict-agentic"` olarak ayarlanmadıkça `false`. Bu kapsam dışında aracı zorla açmak için `true`, katı-ajan tabanlı GPT-5 çalıştırmalarında bile kapalı tutmak için `false` olarak ayarlayın.
- Etkinleştirildiğinde, sistem istemi de kullanım kılavuzu ekler; böylece model bunu yalnızca kapsamlı işler için kullanır ve en fazla bir adımı `in_progress` olarak tutar.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: oluşturulan alt ajanlar için varsayılan model. Atlanırsa, alt ajanlar çağıranın modelini devralır.
- `allowAgents`: istek sahibi ajan kendi `subagents.allowAgents` değerini ayarlamadığında `sessions_spawn` için yapılandırılmış hedef ajan kimliklerinin varsayılan izin listesi (`["*"]` = yapılandırılmış herhangi bir hedef; varsayılan: yalnızca aynı ajan). Ajan yapılandırması silinmiş eski girdiler `sessions_spawn` tarafından reddedilir ve `agents_list` içinden atlanır; bunları temizlemek için `openclaw doctor --fix` çalıştırın.
- `runTimeoutSeconds`: `sessions_spawn` için varsayılan zaman aşımı (saniye). `0`, zaman aşımı olmadığı anlamına gelir.
- `announceTimeoutMs`: gateway `agent` duyuru teslim denemeleri için çağrı başına zaman aşımı (milisaniye). Varsayılan: `120000`. Geçici yeniden denemeler, toplam duyuru bekleme süresini yapılandırılmış tek bir zaman aşımından daha uzun hale getirebilir.
- Alt ajan başına araç ilkesi: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Özel sağlayıcılar ve temel URL'ler

Sağlayıcı pluginleri kendi model katalog satırlarını yayımlar. Yapılandırmada `models.providers` aracılığıyla veya `~/.openclaw/agents/<agentId>/agent/models.json` içinde özel sağlayıcılar ekleyin.

Özel/yerel sağlayıcı `baseUrl` yapılandırmak, model HTTP istekleri için dar kapsamlı ağ güven kararıdır: OpenClaw, ayrı bir yapılandırma seçeneği eklemeden veya diğer özel kaynaklara güvenmeden, korumalı fetch yolu üzerinden tam olarak bu `scheme://host:port` kaynağına izin verir.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Kimlik doğrulama ve birleştirme önceliği">
    - Özel kimlik doğrulama ihtiyaçları için `authHeader: true` + `headers` kullanın.
    - Ajan yapılandırma kökünü `OPENCLAW_AGENT_DIR` ile geçersiz kılın.
    - Eşleşen sağlayıcı kimlikleri için birleştirme önceliği:
      - Boş olmayan ajan `models.json` `baseUrl` değerleri kazanır.
      - Boş olmayan ajan `apiKey` değerleri yalnızca ilgili sağlayıcı geçerli yapılandırma/kimlik doğrulama profili bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
      - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş sırları kalıcı hale getirmek yerine kaynak işaretçilerinden (ortam referansları için `ENV_VAR_NAME`, dosya/exec referansları için `secretref-managed`) yenilenir.
      - SecretRef tarafından yönetilen sağlayıcı üstbilgi değerleri, kaynak işaretçilerinden (ortam referansları için `secretref-env:ENV_VAR_NAME`, dosya/exec referansları için `secretref-managed`) yenilenir.
      - Boş veya eksik ajan `apiKey`/`baseUrl`, yapılandırmadaki `models.providers` değerine geri döner.
      - Eşleşen model `contextWindow`/`maxTokens`, açık yapılandırma ile örtük katalog değerleri arasındaki daha yüksek değeri kullanır.
      - Eşleşen model `contextTokens`, varsa açık bir çalışma zamanı sınırını korur; yerel model meta verilerini değiştirmeden etkili bağlamı sınırlamak için bunu kullanın.
      - Sağlayıcı-plugin katalogları, ajanın plugin durumu altında oluşturulmuş, pluginin sahip olduğu katalog parçaları olarak depolanır.
      - Yapılandırmanın `models.json` ve etkin plugin katalog parçalarını tamamen yeniden yazmasını istediğinizde `models.mode: "replace"` kullanın.
      - İşaretçi kalıcılığı kaynak yetkilidir: işaretçiler çözümlenmiş çalışma zamanı sır değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazılır.

  </Accordion>
</AccordionGroup>

### Sağlayıcı alan ayrıntıları

<AccordionGroup>
  <Accordion title="Üst düzey katalog">
    - `models.mode`: sağlayıcı kataloğu davranışı (`merge` veya `replace`).
    - `models.providers`: sağlayıcı kimliğine göre anahtarlanmış özel sağlayıcı eşlemi.
      - Güvenli düzenlemeler: eklemeli güncellemeler için `openclaw config set models.providers.<id> '<json>' --strict-json --merge` veya `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` kullanın. `config set`, `--replace` iletmediğiniz sürece yıkıcı değiştirmeleri reddeder.

  </Accordion>
  <Accordion title="Sağlayıcı bağlantısı ve kimlik doğrulama">
    - `models.providers.*.api`: istek adaptörü (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` vb.). MLX, vLLM, SGLang ve çoğu OpenAI uyumlu yerel sunucu gibi kendi barındırdığınız `/v1/chat/completions` arka uçları için `openai-completions` kullanın. `baseUrl` içeren ancak `api` içermeyen özel sağlayıcı varsayılan olarak `openai-completions` kullanır; `openai-responses` değerini yalnızca arka uç `/v1/responses` desteklediğinde ayarlayın.
    - `models.providers.*.apiKey`: sağlayıcı kimlik bilgisi (SecretRef/env ikamesi tercih edilir).
    - `models.providers.*.auth`: kimlik doğrulama stratejisi (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: model girdisi `contextWindow` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan yerel bağlam penceresi.
    - `models.providers.*.contextTokens`: model girdisi `contextTokens` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan etkili çalışma zamanı bağlam sınırı.
    - `models.providers.*.maxTokens`: model girdisi `maxTokens` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan çıktı belirteci sınırı.
    - `models.providers.*.timeoutSeconds`: bağlanma, üstbilgiler, gövde ve toplam istek iptal işleme dahil olmak üzere, sağlayıcı başına isteğe bağlı model HTTP isteği zaman aşımı, saniye cinsinden.
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` için isteklere `options.num_ctx` enjekte eder (varsayılan: `true`).
    - `models.providers.*.authHeader`: gerektiğinde kimlik bilgisi aktarımını `Authorization` üstbilgisinde zorlar.
    - `models.providers.*.baseUrl`: yukarı akış API temel URL'si.
    - `models.providers.*.headers`: proxy/kiracı yönlendirmesi için ek statik üstbilgiler.

  </Accordion>
  <Accordion title="İstek aktarımı geçersiz kılmaları">
    `models.providers.*.request`: model sağlayıcı HTTP istekleri için aktarım geçersiz kılmaları.

    - `request.headers`: ek üstbilgiler (sağlayıcı varsayılanlarıyla birleştirilir). Değerler SecretRef kabul eder.
    - `request.auth`: kimlik doğrulama stratejisi geçersiz kılması. Modlar: `"provider-default"` (sağlayıcının yerleşik kimlik doğrulamasını kullan), `"authorization-bearer"` (`token` ile), `"header"` (`headerName`, `value`, isteğe bağlı `prefix` ile).
    - `request.proxy`: HTTP proxy geçersiz kılması. Modlar: `"env-proxy"` (`HTTP_PROXY`/`HTTPS_PROXY` env değişkenlerini kullan), `"explicit-proxy"` (`url` ile). Her iki mod da isteğe bağlı `tls` alt nesnesini kabul eder.
    - `request.tls`: doğrudan bağlantılar için TLS geçersiz kılması. Alanlar: `ca`, `cert`, `key`, `passphrase` (tümü SecretRef kabul eder), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: `true` olduğunda, model sağlayıcı HTTP isteklerinin sağlayıcı HTTP fetch koruması üzerinden özel, CGNAT veya benzer aralıklara gitmesine izin verir. Özel/yerel sağlayıcı temel URL'leri, açıkça etkinleştirme olmadan engelli kalmaya devam eden metadata/link-local kökenleri dışında, tam yapılandırılmış kökene zaten güvenir. Tam köken güveninden çıkmak için bunu `false` olarak ayarlayın. WebSocket üstbilgiler/TLS için aynı `request` değerini kullanır, ancak bu fetch SSRF kapısını kullanmaz. Varsayılan `false`.

  </Accordion>
  <Accordion title="Model katalog girdileri">
    - `models.providers.*.models`: açık sağlayıcı model katalog girdileri.
    - `models.providers.*.models.*.input`: model giriş kipleri. Yalnızca metin modelleri için `["text"]`, yerel görüntü/vision modelleri için `["text", "image"]` kullanın. Görüntü ekleri, yalnızca seçilen model görüntü destekli olarak işaretlendiğinde agent turlarına enjekte edilir.
    - `models.providers.*.models.*.contextWindow`: yerel model bağlam penceresi metadata'sı. Bu, söz konusu model için sağlayıcı düzeyindeki `contextWindow` değerini geçersiz kılar.
    - `models.providers.*.models.*.contextTokens`: isteğe bağlı çalışma zamanı bağlam sınırı. Bu, sağlayıcı düzeyindeki `contextTokens` değerini geçersiz kılar; modelin yerel `contextWindow` değerinden daha küçük etkili bir bağlam bütçesi istediğinizde kullanın; `openclaw models list` farklı olduklarında her iki değeri de gösterir.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: isteğe bağlı uyumluluk ipucu. Boş olmayan yerel olmayan `baseUrl` (host `api.openai.com` değil) ile `api: "openai-completions"` için OpenClaw çalışma zamanında bunu `false` olarak zorlar. Boş/atlanmış `baseUrl`, varsayılan OpenAI davranışını korur.
    - `models.providers.*.models.*.compat.requiresStringContent`: yalnızca dize kabul eden OpenAI uyumlu sohbet uç noktaları için isteğe bağlı uyumluluk ipucu. `true` olduğunda OpenClaw, isteği göndermeden önce saf metin `messages[].content` dizilerini düz dizelere yassılaştırır.
    - `models.providers.*.models.*.compat.strictMessageKeys`: katı OpenAI uyumlu sohbet uç noktaları için isteğe bağlı uyumluluk ipucu. `true` olduğunda OpenClaw, isteği göndermeden önce giden Chat Completions ileti nesnelerini `role` ve `content` alanlarına indirger.
    - `models.providers.*.models.*.compat.thinkingFormat`: isteğe bağlı düşünme yükü ipucu. Together tarzı `reasoning.enabled` için `"together"`, üst düzey `enable_thinking` için `"qwen"` veya vLLM gibi istek düzeyi chat-template kwargs destekleyen Qwen ailesi OpenAI uyumlu sunucularda `chat_template_kwargs.enable_thinking` için `"qwen-chat-template"` kullanın. Yapılandırılmış vLLM Qwen modelleri, bu biçimler için ikili `/think` seçenekleri (`off`, `on`) sunar.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: yeniden oynatmada önceki assistant iletilerinin `reasoning_content` alanını korumasını gerektiren DeepSeek tarzı Chat Completions arka uçları için isteğe bağlı uyumluluk ipucu. `true` olduğunda OpenClaw, giden assistant iletilerinde bu alanı korur. Bunu, çıkarılmış reasoning sonrasında istekleri reddeden özel DeepSeek uyumlu bir proxy bağlarken kullanın. Varsayılan `false`.

  </Accordion>
  <Accordion title="Amazon Bedrock keşfi">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock otomatik keşif ayarları kökü.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: örtük keşfi aç/kapat.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: keşif için AWS bölgesi.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: hedefli keşif için isteğe bağlı sağlayıcı kimliği filtresi.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: keşif yenilemesi için yoklama aralığı.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: keşfedilen modeller için yedek bağlam penceresi.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: keşfedilen modeller için yedek en yüksek çıktı belirteç sayısı.

  </Accordion>
</AccordionGroup>

Etkileşimli özel sağlayıcı hazırlığı GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V ve GLM-4V gibi yaygın vision model kimlikleri için görüntü girişini çıkarır ve bilinen yalnızca metin aileleri için ek soruyu atlar. Bilinmeyen model kimlikleri yine de görüntü desteği için sorar. Etkileşimsiz hazırlık aynı çıkarımı kullanır; görüntü destekli metadata'yı zorlamak için `--custom-image-input`, yalnızca metin metadata'sını zorlamak için `--custom-text-input` geçin.

### Sağlayıcı örnekleri

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Resmi harici `cerebras` sağlayıcı Plugin'i bunu `openclaw onboard --auth-choice cerebras-api-key` ile yapılandırabilir. Açık sağlayıcı yapılandırmasını yalnızca varsayılanları geçersiz kılarken kullanın.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Cerebras için `cerebras/zai-glm-4.7`; doğrudan Z.AI için `zai/glm-4.7` kullanın.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic uyumlu, yerleşik sağlayıcı. Kısayol: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Yerel modeller (LM Studio)">
    Bkz. [Yerel Modeller](/tr/gateway/local-models). Kısaca: güçlü donanımda LM Studio Responses API üzerinden büyük bir yerel model çalıştırın; yedek için barındırılan modelleri birleştirilmiş tutun.
  </Accordion>
  <Accordion title="MiniMax M3 (doğrudan)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    `MINIMAX_API_KEY` ayarlayın. Kısayollar: `openclaw onboard --auth-choice minimax-global-api` veya `openclaw onboard --auth-choice minimax-cn-api`. Model kataloğu varsayılan olarak M3'e ayarlanır ve M2.7 varyantlarını da içerir. Anthropic uyumlu streaming yolunda OpenClaw, `thinking` değerini siz açıkça ayarlamadıkça MiniMax M2.x düşünmeyi varsayılan olarak devre dışı bırakır; MiniMax-M3 (ve M3.x) varsayılan olarak sağlayıcının atlanmış/uyarlamalı düşünme yolunda kalır. `/fast on` veya `params.fastMode: true`, `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    Çin uç noktası için: `baseUrl: "https://api.moonshot.cn/v1"` veya `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Yerel Moonshot uç noktaları, paylaşılan `openai-completions` aktarımında streaming kullanım uyumluluğunu duyurur ve OpenClaw bunu yalnızca yerleşik sağlayıcı kimliği yerine uç nokta yeteneklerine göre belirler.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) ayarlayın. Zen kataloğu için `opencode/...` referanslarını veya Go kataloğu için `opencode-go/...` referanslarını kullanın. Kısayol: `openclaw onboard --auth-choice opencode-zen` veya `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Sentetik (Anthropic uyumlu)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    Temel URL `/v1` içermemelidir (Anthropic istemcisi bunu ekler). Kısayol: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    `ZAI_API_KEY` ayarlayın. Model referansları kanonik `zai/*` sağlayıcı kimliğini kullanır. Kısayol: `openclaw onboard --auth-choice zai-api-key`.

    - Genel uç nokta: `https://api.z.ai/api/paas/v4`
    - Kodlama uç noktası (varsayılan): `https://api.z.ai/api/coding/paas/v4`
    - Genel uç nokta için, temel URL geçersiz kılmasıyla özel bir sağlayıcı tanımlayın.

  </Accordion>
</AccordionGroup>

---

## İlgili

- [Yapılandırma — aracılar](/tr/gateway/config-agents)
- [Yapılandırma — kanallar](/tr/gateway/config-channels)
- [Yapılandırma referansı](/tr/gateway/configuration-reference) — diğer üst düzey anahtarlar
- [Araçlar ve pluginler](/tr/tools)
