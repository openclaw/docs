---
read_when:
    - '`tools.*` politikasını, izin listelerini veya deneysel özellikleri yapılandırma'
    - Özel sağlayıcıları kaydetme veya temel URL’leri geçersiz kılma
    - Kendi barındırdığınız OpenAI uyumlu uç noktaları ayarlama
sidebarTitle: Tools and custom providers
summary: Araçlar yapılandırması (politika, deneysel açma/kapama seçenekleri, sağlayıcı destekli araçlar) ve özel sağlayıcı/temel URL kurulumu
title: Yapılandırma — araçlar ve özel sağlayıcılar
x-i18n:
    generated_at: "2026-05-11T20:29:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9ab0ec823da1e2e8598d9efb998a207c4486ba82dcf4dd65422c6bf90581b46
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` yapılandırma anahtarları ve özel sağlayıcı / temel URL kurulumu. Agent’lar, kanallar ve diğer üst düzey yapılandırma anahtarları için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration-reference).

## Araçlar

### Araç profilleri

`tools.profile`, `tools.allow`/`tools.deny` öncesinde bir temel izin listesi ayarlar:

<Note>
Yerel ilk kurulum, ayarlanmamış olduğunda yeni yerel yapılandırmaları varsayılan olarak `tools.profile: "coding"` yapar (mevcut açık profiller korunur).
</Note>

| Profil      | İçerir                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `minimal`   | Yalnızca `session_status`                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Kısıtlama yok (ayarlanmamış ile aynı)                                                                                          |

### Araç grupları

| Grup               | Araçlar                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash`, `exec` için bir takma ad olarak kabul edilir)                              |
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
| `group:openclaw`   | Tüm yerleşik araçlar (sağlayıcı Plugin’lerini hariç tutar)                                                              |

### `tools.allow` / `tools.deny`

Küresel araç izin/ret ilkesi (ret kazanır). Büyük/küçük harfe duyarsızdır, `*` joker karakterlerini destekler. Docker sanal alanı kapalıyken bile uygulanır.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` ve `apply_patch` ayrı araç kimlikleridir. `allow: ["write"]`, uyumlu modeller için `apply_patch` aracını da etkinleştirir, ancak `deny: ["write"]`, `apply_patch` aracını reddetmez. Tüm dosya değişikliklerini engellemek için `group:fs` öğesini reddedin veya her değişiklik yapan aracı açıkça listeleyin:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Belirli sağlayıcılar veya modeller için araçları daha da kısıtlar. Sıra: temel profil → sağlayıcı profili → izin/ret.

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

Belirli bir istek sahibi kimliği için araçları kısıtlar. Bu, kanal erişim denetiminin üzerine eklenen katmanlı savunmadır; gönderen değerleri mesaj metninden değil, kanal adaptöründen gelmelidir.

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

Agent başına `agents.list[].tools.toolsBySender`, boş bir `{}` ilkesiyle bile eşleştiğinde küresel gönderen eşleşmesini geçersiz kılar.

### `tools.elevated`

Sanal alan dışındaki yükseltilmiş exec erişimini denetler:

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

- Agent başına geçersiz kılma (`agents.list[].tools.elevated`) yalnızca daha fazla kısıtlayabilir.
- `/elevated on|off|ask|full` durumu oturum başına saklar; satır içi yönergeler tek bir mesaja uygulanır.
- Yükseltilmiş `exec`, sanal alanı atlar ve yapılandırılmış kaçış yolunu kullanır (varsayılan olarak `gateway`, exec hedefi `node` olduğunda ise `node`).

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

Araç döngüsü güvenlik denetimleri **varsayılan olarak devre dışıdır**. Algılamayı etkinleştirmek için `enabled: true` ayarlayın. Ayarlar genel olarak `tools.loopDetection` içinde tanımlanabilir ve ajan bazında `agents.list[].tools.loopDetection` içinde geçersiz kılınabilir.

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
  Uyarılar için tekrarlayan ilerleme sağlamayan desen eşiği.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Kritik döngüleri engellemek için daha yüksek tekrarlama eşiği.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  İlerleme sağlamayan herhangi bir çalışma için kesin durdurma eşiği.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Aynı araç/aynı bağımsız değişkenlerle tekrarlanan çağrılarda uyar.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Bilinen yoklama araçlarında (`process.poll`, `command_status` vb.) uyar/engelle.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Dönüşümlü ilerleme sağlamayan ikili desenlerde uyar/engelle.
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

Gelen medya anlama işlevini yapılandırır (görüntü/ses/video):

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
  <Accordion title="Media model entry fields">
    **Sağlayıcı girdisi** (`type: "provider"` veya belirtilmezse):

    - `provider`: API sağlayıcı kimliği (`openai`, `anthropic`, `google`/`gemini`, `groq` vb.)
    - `model`: model kimliği geçersiz kılması
    - `profile` / `preferredProfile`: `auth-profiles.json` profil seçimi

    **CLI girdisi** (`type: "cli"`):

    - `command`: çalıştırılacak yürütülebilir dosya
    - `args`: şablonlu bağımsız değişkenler (`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` vb. desteklenir; `openclaw doctor --fix`, kullanımdan kaldırılmış `{input}` yer tutucularını `{{MediaPath}}` olarak taşır)

    **Ortak alanlar:**

    - `capabilities`: isteğe bağlı liste (`image`, `audio`, `video`). Varsayılanlar: `openai`/`anthropic`/`minimax` → görüntü, `google` → görüntü+ses+video, `groq` → ses.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: girdi başına geçersiz kılmalar.
    - `tools.media.image.timeoutSeconds` ve eşleşen görüntü modeli `timeoutSeconds` girdileri, ajan açık `image` aracını çağırdığında da uygulanır.
    - Hatalar bir sonraki girdiye geri döner.

    Sağlayıcı kimlik doğrulaması standart sırayı izler: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

    **Eşzamansız tamamlama alanları:**

    - `asyncCompletion.directSend`: kullanımdan kaldırılmış uyumluluk bayrağı. Tamamlanan eşzamansız medya görevleri, ajanın sonucu alması, kullanıcıya nasıl söyleyeceğine karar vermesi ve kaynak teslimatı gerektirdiğinde mesaj aracını kullanması için istekte bulunan oturum aracılı kalır.

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

Varsayılan: `tree` (geçerli oturum + alt ajanlar gibi onun tarafından başlatılan oturumlar).

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
  <Accordion title="Visibility scopes">
    - `self`: yalnızca geçerli oturum anahtarı.
    - `tree`: geçerli oturum + geçerli oturum tarafından başlatılan oturumlar (alt ajanlar).
    - `agent`: geçerli ajan kimliğine ait herhangi bir oturum (aynı ajan kimliği altında gönderici başına oturum çalıştırıyorsanız diğer kullanıcıları içerebilir).
    - `all`: herhangi bir oturum. Ajanlar arası hedefleme yine de `tools.agentToAgent` gerektirir.
    - Korumalı alan sınırlaması: geçerli oturum korumalı alandaysa ve `agents.defaults.sandbox.sessionToolsVisibility="spawned"` ise, `tools.sessions.visibility="all"` olsa bile görünürlük `tree` olmaya zorlanır.

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
    - Ekler yalnızca `runtime: "subagent"` için desteklenir. ACP runtime bunları reddeder.
    - Dosyalar, alt çalışma alanında `.openclaw/attachments/<uuid>/` konumuna bir `.manifest.json` ile oluşturulur.
    - Ek içeriği transcript kalıcılığından otomatik olarak redakte edilir.
    - Base64 girdileri katı alfabe/doldurma denetimleri ve kod çözme öncesi boyut koruması ile doğrulanır.
    - Dosya izinleri dizinler için `0700`, dosyalar için `0600` olur.
    - Temizleme `cleanup` politikasını izler: `delete` ekleri her zaman kaldırır; `keep` bunları yalnızca `retainOnSessionKeep: true` olduğunda korur.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Deneysel yerleşik araç bayrakları. Katı agentic GPT-5 otomatik etkinleştirme kuralı uygulanmadıkça varsayılan olarak kapalıdır.

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
- Varsayılan: Bir OpenAI veya OpenAI Codex GPT-5 ailesi çalıştırması için `agents.defaults.embeddedPi.executionContract` (veya ajan başına geçersiz kılma) `"strict-agentic"` olarak ayarlanmadıkça `false`. Aracı bu kapsam dışında zorla açmak için `true`, katı agentic GPT-5 çalıştırmalarında bile kapalı tutmak için `false` ayarlayın.
- Etkinleştirildiğinde sistem istemi, modelin bunu yalnızca kapsamlı işler için kullanması ve en fazla bir adımı `in_progress` tutması için kullanım rehberliği de ekler.

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

- `model`: oluşturulan alt ajanlar için varsayılan model. Atlanırsa alt ajanlar çağıranın modelini devralır.
- `allowAgents`: istekte bulunan ajan kendi `subagents.allowAgents` değerini ayarlamadığında `sessions_spawn` için hedef ajan kimliklerinin varsayılan izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı ajan).
- `runTimeoutSeconds`: araç çağrısı `runTimeoutSeconds` değerini atladığında `sessions_spawn` için varsayılan zaman aşımı (saniye). `0`, zaman aşımı yok anlamına gelir.
- `announceTimeoutMs`: Gateway `agent` duyuru teslim denemeleri için çağrı başına zaman aşımı (milisaniye). Varsayılan: `120000`. Geçici yeniden denemeler toplam duyuru beklemesini yapılandırılmış tek bir zaman aşımından daha uzun hale getirebilir.
- Alt ajan başına araç politikası: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Özel sağlayıcılar ve taban URL'ler

OpenClaw yerleşik model kataloğunu kullanır. Özel sağlayıcıları yapılandırmada `models.providers` üzerinden veya `~/.openclaw/agents/<agentId>/agent/models.json` içinde ekleyin.

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
    - Ajan yapılandırma kökünü `OPENCLAW_AGENT_DIR` (veya eski ortam değişkeni takma adı olan `PI_CODING_AGENT_DIR`) ile geçersiz kılın.
    - Eşleşen sağlayıcı kimlikleri için birleştirme önceliği:
      - Boş olmayan ajan `models.json` `baseUrl` değerleri kazanır.
      - Boş olmayan ajan `apiKey` değerleri yalnızca bu sağlayıcı geçerli yapılandırma/auth-profile bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
      - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş gizli değerleri kalıcı hale getirmek yerine kaynak işaretçilerinden (`ENV_VAR_NAME` ortam ref'leri için, `secretref-managed` dosya/exec ref'leri için) yenilenir.
      - SecretRef tarafından yönetilen sağlayıcı başlık değerleri, kaynak işaretçilerinden (`secretref-env:ENV_VAR_NAME` ortam ref'leri için, `secretref-managed` dosya/exec ref'leri için) yenilenir.
      - Boş veya eksik ajan `apiKey`/`baseUrl`, yapılandırmadaki `models.providers` değerine geri düşer.
      - Eşleşen model `contextWindow`/`maxTokens`, açık yapılandırma ile örtük katalog değerleri arasındaki daha yüksek değeri kullanır.
      - Eşleşen model `contextTokens`, mevcut olduğunda açık bir çalışma zamanı üst sınırını korur; yerel model meta verilerini değiştirmeden etkili bağlamı sınırlamak için bunu kullanın.
      - Yapılandırmanın `models.json` dosyasını tamamen yeniden yazmasını istediğinizde `models.mode: "replace"` kullanın.
      - İşaretçi kalıcılığı kaynak yetkilidir: işaretçiler çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazılır.

  </Accordion>
</AccordionGroup>

### Sağlayıcı alanı ayrıntıları

<AccordionGroup>
  <Accordion title="Üst düzey katalog">
    - `models.mode`: sağlayıcı katalog davranışı (`merge` veya `replace`).
    - `models.providers`: sağlayıcı kimliğine göre anahtarlanmış özel sağlayıcı haritası.
      - Güvenli düzenlemeler: eklemeli güncellemeler için `openclaw config set models.providers.<id> '<json>' --strict-json --merge` veya `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` kullanın. `config set`, `--replace` geçmediğiniz sürece yıkıcı değiştirmeleri reddeder.

  </Accordion>
  <Accordion title="Sağlayıcı bağlantısı ve kimlik doğrulama">
    - `models.providers.*.api`: istek bağdaştırıcısı (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` vb.). MLX, vLLM, SGLang ve çoğu OpenAI uyumlu yerel sunucu gibi kendi kendine barındırılan `/v1/chat/completions` arka uçları için `openai-completions` kullanın. `baseUrl` değerine sahip ancak `api` değeri olmayan özel sağlayıcı varsayılan olarak `openai-completions` kullanır; yalnızca arka uç `/v1/responses` desteklediğinde `openai-responses` ayarlayın.
    - `models.providers.*.apiKey`: sağlayıcı kimlik bilgisi (SecretRef/ortam değişkeni ikamesini tercih edin).
    - `models.providers.*.auth`: kimlik doğrulama stratejisi (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: model girdisi `contextWindow` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan yerel bağlam penceresi.
    - `models.providers.*.contextTokens`: model girdisi `contextTokens` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan etkili çalışma zamanı bağlam üst sınırı.
    - `models.providers.*.maxTokens`: model girdisi `maxTokens` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan çıktı token üst sınırı.
    - `models.providers.*.timeoutSeconds`: bağlantı, başlıklar, gövde ve toplam istek iptal işleme dahil olmak üzere sağlayıcı başına isteğe bağlı model HTTP isteği zaman aşımı, saniye cinsinden.
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` için isteklere `options.num_ctx` enjekte eder (varsayılan: `true`).
    - `models.providers.*.authHeader`: gerektiğinde kimlik bilgisi aktarımını `Authorization` başlığında zorlar.
    - `models.providers.*.baseUrl`: yukarı akış API taban URL'si.
    - `models.providers.*.headers`: proxy/kiracı yönlendirmesi için ek statik başlıklar.

  </Accordion>
  <Accordion title="İstek aktarımı geçersiz kılmaları">
    `models.providers.*.request`: model sağlayıcı HTTP istekleri için aktarım geçersiz kılmaları.

    - `request.headers`: ek başlıklar (sağlayıcı varsayılanlarıyla birleştirilir). Değerler SecretRef kabul eder.
    - `request.auth`: kimlik doğrulama stratejisi geçersiz kılma. Modlar: `"provider-default"` (sağlayıcının yerleşik kimlik doğrulamasını kullan), `"authorization-bearer"` (`token` ile), `"header"` (`headerName`, `value`, isteğe bağlı `prefix` ile).
    - `request.proxy`: HTTP proxy geçersiz kılma. Modlar: `"env-proxy"` (`HTTP_PROXY`/`HTTPS_PROXY` ortam değişkenlerini kullan), `"explicit-proxy"` (`url` ile). Her iki mod da isteğe bağlı bir `tls` alt nesnesi kabul eder.
    - `request.tls`: doğrudan bağlantılar için TLS geçersiz kılma. Alanlar: `ca`, `cert`, `key`, `passphrase` (tümü SecretRef kabul eder), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: `true` olduğunda, DNS özel, CGNAT veya benzer aralıklara çözümlendiğinde `baseUrl` için HTTPS'ye sağlayıcı HTTP fetch koruması üzerinden izin verir (güvenilen, kendi kendine barındırılan OpenAI uyumlu uç noktalar için operatörün açık seçimi). `localhost`, `127.0.0.1` ve `[::1]` gibi loopback model sağlayıcı akış URL'lerine, bu açıkça `false` olarak ayarlanmadığı sürece otomatik olarak izin verilir; LAN, tailnet ve özel DNS ana bilgisayarları yine de açık seçim gerektirir. WebSocket başlıklar/TLS için aynı `request` değerini kullanır, ancak bu fetch SSRF geçidini kullanmaz. Varsayılan `false`.

  </Accordion>
  <Accordion title="Model katalog girdileri">
    - `models.providers.*.models`: açık sağlayıcı model katalog girdileri.
    - `models.providers.*.models.*.input`: model girdi modaliteleri. Yalnızca metin modelleri için `["text"]`, yerel görüntü/vision modelleri için `["text", "image"]` kullanın. Görüntü ekleri yalnızca seçili model görüntü yetenekli olarak işaretlendiğinde ajan turlarına enjekte edilir.
    - `models.providers.*.models.*.contextWindow`: yerel model bağlam penceresi meta verileri. Bu, söz konusu model için sağlayıcı düzeyi `contextWindow` değerini geçersiz kılar.
    - `models.providers.*.models.*.contextTokens`: isteğe bağlı çalışma zamanı bağlam üst sınırı. Bu, sağlayıcı düzeyi `contextTokens` değerini geçersiz kılar; modelin yerel `contextWindow` değerinden daha küçük etkili bir bağlam bütçesi istediğinizde bunu kullanın; `openclaw models list`, farklı olduklarında iki değeri de gösterir.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: isteğe bağlı uyumluluk ipucu. Yerel olmayan, boş olmayan bir `baseUrl` (ana bilgisayar `api.openai.com` değil) ile `api: "openai-completions"` için OpenClaw bunu çalışma zamanında `false` değerine zorlar. Boş/atlanmış `baseUrl`, varsayılan OpenAI davranışını korur.
    - `models.providers.*.models.*.compat.requiresStringContent`: yalnızca dize kullanan OpenAI uyumlu chat uç noktaları için isteğe bağlı uyumluluk ipucu. `true` olduğunda OpenClaw, saf metin `messages[].content` dizilerini isteği göndermeden önce düz dizelere düzleştirir.
    - `models.providers.*.models.*.compat.strictMessageKeys`: katı OpenAI uyumlu chat uç noktaları için isteğe bağlı uyumluluk ipucu. `true` olduğunda OpenClaw, giden Chat Completions ileti nesnelerini isteği göndermeden önce `role` ve `content` alanlarına indirger.
    - `models.providers.*.models.*.compat.thinkingFormat`: isteğe bağlı düşünme yükü ipucu. Üst düzey `enable_thinking` için `"qwen"` veya vLLM gibi istek düzeyi chat-template kwargs destekleyen Qwen ailesi OpenAI uyumlu sunucularda `chat_template_kwargs.enable_thinking` için `"qwen-chat-template"` kullanın.

  </Accordion>
  <Accordion title="Amazon Bedrock keşfi">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock otomatik keşif ayarları kökü.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: örtük keşfi açar/kapatır.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: keşif için AWS bölgesi.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: hedefli keşif için isteğe bağlı sağlayıcı kimliği filtresi.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: keşif yenilemesi için yoklama aralığı.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: keşfedilen modeller için geri dönüş bağlam penceresi.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: keşfedilen modeller için geri dönüş azami çıktı token sayısı.

  </Accordion>
</AccordionGroup>

Etkileşimli özel sağlayıcı ilk kurulumu, GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V ve GLM-4V gibi yaygın görsel model kimlikleri için görüntü girdisini çıkarımlar ve bilinen yalnızca metin aileleri için ek soruyu atlar. Bilinmeyen model kimlikleri yine de görüntü desteği için soru sorar. Etkileşimsiz ilk kurulum aynı çıkarımı kullanır; görüntü destekli meta verileri zorlamak için `--custom-image-input`, yalnızca metin meta verilerini zorlamak için `--custom-text-input` geçin.

### Sağlayıcı örnekleri

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Birlikte gelen `cerebras` sağlayıcı Plugin'i bunu `openclaw onboard --auth-choice cerebras-api-key` ile yapılandırabilir. Açık sağlayıcı yapılandırmasını yalnızca varsayılanları geçersiz kılarken kullanın.

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

    Cerebras için `cerebras/zai-glm-4.7`; Z.AI doğrudan kullanımı için `zai/glm-4.7` kullanın.

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
  <Accordion title="Local models (LM Studio)">
    [Yerel Modeller](/tr/gateway/local-models) bölümüne bakın. Özet: güçlü donanımda LM Studio Responses API üzerinden büyük bir yerel model çalıştırın; yedek kullanım için barındırılan modelleri birleştirilmiş tutun.
  </Accordion>
  <Accordion title="MiniMax M2.7 (direct)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
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
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    `MINIMAX_API_KEY` ayarlayın. Kısayollar: `openclaw onboard --auth-choice minimax-global-api` veya `openclaw onboard --auth-choice minimax-cn-api`. Model kataloğu varsayılan olarak yalnızca M2.7 kullanır. Anthropic uyumlu akış yolunda, siz açıkça `thinking` ayarlamadığınız sürece OpenClaw varsayılan olarak MiniMax düşünmeyi devre dışı bırakır. `/fast on` veya `params.fastMode: true`, `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

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

    Yerel Moonshot uç noktaları, paylaşılan `openai-completions` aktarımında akış kullanım uyumluluğunu duyurur ve OpenClaw bunu yalnızca yerleşik sağlayıcı kimliği yerine uç nokta yeteneklerine göre belirler.

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

    `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) ayarlayın. Zen kataloğu için `opencode/...` ref'lerini veya Go kataloğu için `opencode-go/...` ref'lerini kullanın. Kısayol: `openclaw onboard --auth-choice opencode-zen` veya `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
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

    `ZAI_API_KEY` ayarlayın. `z.ai/*` ve `z-ai/*` kabul edilen takma adlardır. Kısayol: `openclaw onboard --auth-choice zai-api-key`.

    - Genel uç nokta: `https://api.z.ai/api/paas/v4`
    - Kodlama uç noktası (varsayılan): `https://api.z.ai/api/coding/paas/v4`
    - Genel uç nokta için temel URL geçersiz kılmasıyla özel bir sağlayıcı tanımlayın.

  </Accordion>
</AccordionGroup>

---

## İlgili

- [Yapılandırma — aracılar](/tr/gateway/config-agents)
- [Yapılandırma — kanallar](/tr/gateway/config-channels)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — diğer üst düzey anahtarlar
- [Araçlar ve Plugin'ler](/tr/tools)
