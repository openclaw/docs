---
read_when:
    - '`tools.*` politikasını, izin listelerini veya deneysel özellikleri yapılandırma'
    - Özel sağlayıcıları kaydetme veya temel URL'leri geçersiz kılma
    - OpenAI uyumlu, kendi barındırdığınız uç noktaları ayarlama
sidebarTitle: Tools and custom providers
summary: Araç yapılandırması (politika, deneysel aç/kapat seçenekleri, sağlayıcı destekli araçlar) ve özel sağlayıcı/base-URL kurulumu
title: Yapılandırma — araçlar ve özel sağlayıcılar
x-i18n:
    generated_at: "2026-04-30T09:20:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1790c92ecaf822c837326d8e22e9d72cc44e5d4cc0bcc00c154ba5160975002a
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` yapılandırma anahtarları ve özel sağlayıcı / temel URL kurulumu. Ajanlar, kanallar ve diğer üst düzey yapılandırma anahtarları için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration-reference).

## Araçlar

### Araç profilleri

`tools.profile`, `tools.allow`/`tools.deny` öncesinde temel bir izin listesi ayarlar:

<Note>
Yerel ilk kurulum, ayarlanmamış yeni yerel yapılandırmaları varsayılan olarak `tools.profile: "coding"` yapar (mevcut açık profiller korunur).
</Note>

| Profil      | İçerir                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | yalnızca `session_status`                                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Kısıtlama yok (ayarlanmamışla aynı)                                                                                             |

### Araç grupları

| Grup               | Araçlar                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash`, `exec` için takma ad olarak kabul edilir)                                  |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Tüm yerleşik araçlar (sağlayıcı Plugin'lerini hariç tutar)                                                              |

### `tools.allow` / `tools.deny`

Genel araç izin/verme politikası (engelleme kazanır). Büyük/küçük harfe duyarsızdır, `*` joker karakterlerini destekler. Docker sandbox kapalıyken bile uygulanır.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Belirli sağlayıcılar veya modeller için araçları daha da kısıtlar. Sıra: temel profil → sağlayıcı profili → izin/verme.

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

### `tools.elevated`

Sandbox dışındaki yükseltilmiş `exec` erişimini denetler:

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
- Yükseltilmiş `exec`, sandboxing'i atlar ve yapılandırılmış çıkış yolunu kullanır (varsayılan olarak `gateway` veya exec hedefi `node` olduğunda `node`).

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
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Araç döngüsü güvenlik denetimleri **varsayılan olarak devre dışıdır**. Algılamayı etkinleştirmek için `enabled: true` ayarlayın. Ayarlar genel olarak `tools.loopDetection` içinde tanımlanabilir ve ajan başına `agents.list[].tools.loopDetection` içinde geçersiz kılınabilir.

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
  Döngü analizi için tutulan en fazla araç çağrısı geçmişi.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Uyarılar için tekrarlayan ilerleme yok deseni eşiği.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Kritik döngüleri engellemek için daha yüksek tekrarlama eşiği.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Herhangi bir ilerleme yok çalışması için kesin durdurma eşiği.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Aynı araç/aynı argüman çağrıları tekrarlandığında uyar.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Bilinen yoklama araçlarında (`process.poll`, `command_status` vb.) uyar/engelle.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Değişimli ilerleme yok çift desenlerinde uyar/engelle.
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

Gelen medya anlama işlemini yapılandırır (görüntü/ses/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
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
    **Provider girdisi** (`type: "provider"` ya da atlanmış):

    - `provider`: API provider kimliği (`openai`, `anthropic`, `google`/`gemini`, `groq` vb.)
    - `model`: model kimliği geçersiz kılması
    - `profile` / `preferredProfile`: `auth-profiles.json` profil seçimi

    **CLI girdisi** (`type: "cli"`):

    - `command`: çalıştırılacak yürütülebilir dosya
    - `args`: şablonlu argümanlar (`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` vb. desteklenir; `openclaw doctor --fix`, kullanımdan kaldırılmış `{input}` yer tutucularını `{{MediaPath}}` değerine taşır)

    **Ortak alanlar:**

    - `capabilities`: isteğe bağlı liste (`image`, `audio`, `video`). Varsayılanlar: `openai`/`anthropic`/`minimax` → görüntü, `google` → görüntü+ses+video, `groq` → ses.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: girdi başına geçersiz kılmalar.
    - `tools.media.image.timeoutSeconds` ve eşleşen görüntü modeli `timeoutSeconds` girdileri, aracı açık `image` aracını çağırdığında da uygulanır.
    - Hatalar bir sonraki girdiye geri döner.

    Provider kimlik doğrulaması standart sırayı izler: `auth-profiles.json` → ortam değişkenleri → `models.providers.*.apiKey`.

    **Eşzamansız tamamlama alanları:**

    - `asyncCompletion.directSend`: `true` olduğunda, tamamlanan eşzamansız `music_generate` ve `video_generate` görevleri önce doğrudan kanal teslimini dener. Varsayılan: `false` (eski talep eden oturum uyandırma/model teslim yolu).

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

Varsayılan: `tree` (geçerli oturum + onun tarafından başlatılan oturumlar, örneğin alt aracılar).

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
    - `tree`: geçerli oturum + geçerli oturum tarafından başlatılan oturumlar (alt aracılar).
    - `agent`: geçerli aracı kimliğine ait herhangi bir oturum (aynı aracı kimliği altında gönderene göre oturumlar çalıştırıyorsanız başka kullanıcıları içerebilir).
    - `all`: herhangi bir oturum. Aracılar arası hedefleme yine de `tools.agentToAgent` gerektirir.
    - Sandbox sıkıştırması: geçerli oturum sandbox içindeyse ve `agents.defaults.sandbox.sessionToolsVisibility="spawned"` ise, `tools.sessions.visibility="all"` olsa bile görünürlük zorunlu olarak `tree` olur.

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
  <Accordion title="Attachment notes">
    - Ekler yalnızca `runtime: "subagent"` için desteklenir. ACP runtime bunları reddeder.
    - Dosyalar, alt çalışma alanında `.openclaw/attachments/<uuid>/` konumuna bir `.manifest.json` ile materyalleştirilir.
    - Ek içeriği, konuşma dökümü kalıcılığından otomatik olarak sansürlenir.
    - Base64 girdileri katı alfabe/dolgu denetimleri ve kod çözme öncesi boyut koruması ile doğrulanır.
    - Dosya izinleri dizinler için `0700`, dosyalar için `0600` olur.
    - Temizleme, `cleanup` politikasını izler: `delete` ekleri her zaman kaldırır; `keep` bunları yalnızca `retainOnSessionKeep: true` olduğunda saklar.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Deneysel yerleşik araç bayrakları. Katı-aracı GPT-5 otomatik etkinleştirme kuralı uygulanmadığı sürece varsayılan olarak kapalıdır.

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
- Varsayılan: Bir OpenAI veya OpenAI Codex GPT-5 ailesi çalıştırması için `agents.defaults.embeddedPi.executionContract` (veya ajan başına bir geçersiz kılma) `"strict-agentic"` olarak ayarlanmadığı sürece `false`. Aracı bu kapsamın dışında zorla etkinleştirmek için `true`, strict-agentic GPT-5 çalıştırmalarında bile kapalı tutmak için `false` ayarlayın.
- Etkinleştirildiğinde, sistem istemi kullanım rehberliği de ekler; böylece model bunu yalnızca kapsamlı işler için kullanır ve en fazla bir adımı `in_progress` olarak tutar.

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
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: başlatılan alt ajanlar için varsayılan model. Atlanırsa alt ajanlar çağıranın modelini devralır.
- `allowAgents`: istekte bulunan ajan kendi `subagents.allowAgents` değerini ayarlamadığında `sessions_spawn` için hedef ajan kimliklerinin varsayılan izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı ajan).
- `runTimeoutSeconds`: araç çağrısı `runTimeoutSeconds` değerini atladığında `sessions_spawn` için varsayılan zaman aşımı (saniye). `0`, zaman aşımı yok anlamına gelir.
- Alt ajan başına araç ilkesi: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Özel sağlayıcılar ve temel URL'ler

OpenClaw yerleşik model kataloğunu kullanır. Özel sağlayıcıları yapılandırmada `models.providers` veya `~/.openclaw/agents/<agentId>/agent/models.json` üzerinden ekleyin.

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
      - Boş olmayan ajan `apiKey` değerleri yalnızca ilgili sağlayıcı geçerli yapılandırma/kimlik doğrulama profili bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
      - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş gizli değerleri kalıcılaştırmak yerine kaynak işaretçilerinden (env başvuruları için `ENV_VAR_NAME`, file/exec başvuruları için `secretref-managed`) yenilenir.
      - SecretRef tarafından yönetilen sağlayıcı üst bilgi değerleri kaynak işaretçilerinden yenilenir (env başvuruları için `secretref-env:ENV_VAR_NAME`, file/exec başvuruları için `secretref-managed`).
      - Boş veya eksik ajan `apiKey`/`baseUrl`, yapılandırmadaki `models.providers` değerine geri döner.
      - Eşleşen model `contextWindow`/`maxTokens`, açık yapılandırma ile örtük katalog değerleri arasındaki daha yüksek değeri kullanır.
      - Eşleşen model `contextTokens`, mevcut olduğunda açık bir çalışma zamanı sınırını korur; yerel model üst verisini değiştirmeden etkili bağlamı sınırlamak için bunu kullanın.
      - Yapılandırmanın `models.json` dosyasını tamamen yeniden yazmasını istediğinizde `models.mode: "replace"` kullanın.
      - İşaretçi kalıcılığı kaynak açısından otoritatiftir: işaretçiler, çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazılır.

  </Accordion>
</AccordionGroup>

### Sağlayıcı alanı ayrıntıları

<AccordionGroup>
  <Accordion title="Üst düzey katalog">
    - `models.mode`: sağlayıcı kataloğu davranışı (`merge` veya `replace`).
    - `models.providers`: sağlayıcı kimliğine göre anahtarlanan özel sağlayıcı haritası.
      - Güvenli düzenlemeler: eklemeli güncellemeler için `openclaw config set models.providers.<id> '<json>' --strict-json --merge` veya `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` kullanın. `config set`, `--replace` geçmediğiniz sürece yıkıcı değiştirmeleri reddeder.

  </Accordion>
  <Accordion title="Sağlayıcı bağlantısı ve kimlik doğrulama">
    - `models.providers.*.api`: istek bağdaştırıcısı (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` vb.). MLX, vLLM, SGLang ve çoğu OpenAI uyumlu yerel sunucu gibi kendi barındırdığınız `/v1/chat/completions` arka uçları için `openai-completions` kullanın. `baseUrl` içeren ancak `api` içermeyen özel bir sağlayıcı varsayılan olarak `openai-completions` kullanır; `openai-responses` değerini yalnızca arka uç `/v1/responses` desteklediğinde ayarlayın.
    - `models.providers.*.apiKey`: sağlayıcı kimlik bilgisi (SecretRef/env ikamesini tercih edin).
    - `models.providers.*.auth`: kimlik doğrulama stratejisi (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: model girdisi `contextWindow` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan yerel bağlam penceresi.
    - `models.providers.*.contextTokens`: model girdisi `contextTokens` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan etkili çalışma zamanı bağlam sınırı.
    - `models.providers.*.maxTokens`: model girdisi `maxTokens` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan çıktı belirteci sınırı.
    - `models.providers.*.timeoutSeconds`: bağlantı, üst bilgiler, gövde ve toplam istek iptali işlemeyi içeren, saniye cinsinden isteğe bağlı sağlayıcı başına model HTTP isteği zaman aşımı.
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` için isteklere `options.num_ctx` enjekte eder (varsayılan: `true`).
    - `models.providers.*.authHeader`: gerektiğinde kimlik bilgisinin `Authorization` üst bilgisinde taşınmasını zorunlu kılar.
    - `models.providers.*.baseUrl`: yukarı akış API temel URL'si.
    - `models.providers.*.headers`: proxy/kiracı yönlendirmesi için ek statik üst bilgiler.

  </Accordion>
  <Accordion title="İstek taşıma geçersiz kılmaları">
    `models.providers.*.request`: model sağlayıcı HTTP istekleri için taşıma geçersiz kılmaları.

    - `request.headers`: ek üst bilgiler (sağlayıcı varsayılanlarıyla birleştirilir). Değerler SecretRef kabul eder.
    - `request.auth`: kimlik doğrulama stratejisi geçersiz kılması. Modlar: `"provider-default"` (sağlayıcının yerleşik kimlik doğrulamasını kullan), `"authorization-bearer"` (`token` ile), `"header"` (`headerName`, `value`, isteğe bağlı `prefix` ile).
    - `request.proxy`: HTTP proxy geçersiz kılması. Modlar: `"env-proxy"` (`HTTP_PROXY`/`HTTPS_PROXY` env değişkenlerini kullan), `"explicit-proxy"` (`url` ile). Her iki mod da isteğe bağlı bir `tls` alt nesnesi kabul eder.
    - `request.tls`: doğrudan bağlantılar için TLS geçersiz kılması. Alanlar: `ca`, `cert`, `key`, `passphrase` (tümü SecretRef kabul eder), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: `true` olduğunda, sağlayıcı HTTP fetch koruması üzerinden DNS özel, CGNAT veya benzer aralıklara çözümlendiğinde `baseUrl` adresine HTTPS'ye izin verir (güvenilen, kendi barındırılan OpenAI uyumlu uç noktalar için operatör onayı). `localhost`, `127.0.0.1` ve `[::1]` gibi loopback model sağlayıcı akış URL'lerine, bu açıkça `false` olarak ayarlanmadığı sürece otomatik olarak izin verilir; LAN, tailnet ve özel DNS ana makineleri yine de onay gerektirir. WebSocket üst bilgiler/TLS için aynı `request` değerini kullanır, ancak bu fetch SSRF kapısını kullanmaz. Varsayılan `false`.

  </Accordion>
  <Accordion title="Model kataloğu girdileri">
    - `models.providers.*.models`: açık sağlayıcı model kataloğu girdileri.
    - `models.providers.*.models.*.input`: model giriş modaliteleri. Yalnızca metin modelleri için `["text"]`, yerel görüntü/vision modelleri için `["text", "image"]` kullanın. Görüntü ekleri, yalnızca seçilen model görüntü destekli olarak işaretlendiğinde ajan turlarına enjekte edilir.
    - `models.providers.*.models.*.contextWindow`: yerel model bağlam penceresi üst verisi. Bu, ilgili model için sağlayıcı düzeyindeki `contextWindow` değerini geçersiz kılar.
    - `models.providers.*.models.*.contextTokens`: isteğe bağlı çalışma zamanı bağlam sınırı. Bu, sağlayıcı düzeyindeki `contextTokens` değerini geçersiz kılar; modelin yerel `contextWindow` değerinden daha küçük etkili bir bağlam bütçesi istediğinizde kullanın; `openclaw models list`, farklı olduklarında her iki değeri de gösterir.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: isteğe bağlı uyumluluk ipucu. `api: "openai-completions"` ve boş olmayan, yerel olmayan bir `baseUrl` (`api.openai.com` olmayan ana makine) için OpenClaw çalışma zamanında bunu `false` olmaya zorlar. Boş/atlanmış `baseUrl`, varsayılan OpenAI davranışını korur.
    - `models.providers.*.models.*.compat.requiresStringContent`: yalnızca dize kullanan OpenAI uyumlu sohbet uç noktaları için isteğe bağlı uyumluluk ipucu. `true` olduğunda OpenClaw, isteği göndermeden önce saf metin `messages[].content` dizilerini düz dizelere indirger.

  </Accordion>
  <Accordion title="Amazon Bedrock keşfi">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock otomatik keşif ayarları kökü.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: örtük keşfi açar/kapatır.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: keşif için AWS bölgesi.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: hedefli keşif için isteğe bağlı sağlayıcı kimliği filtresi.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: keşif yenilemesi için yoklama aralığı.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: keşfedilen modeller için geri dönüş bağlam penceresi.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: keşfedilen modeller için geri dönüş maksimum çıktı belirteçleri.

  </Accordion>
</AccordionGroup>

Etkileşimli özel sağlayıcı ilk kurulumu, GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V ve GLM-4V gibi yaygın vision model kimlikleri için görüntü girişini çıkarır ve bilinen yalnızca metin aileleri için ek soruyu atlar. Bilinmeyen model kimlikleri yine de görüntü desteği için sorar. Etkileşimsiz ilk kurulum aynı çıkarımı kullanır; görüntü destekli üst veriyi zorlamak için `--custom-image-input` veya yalnızca metin üst verisini zorlamak için `--custom-text-input` geçin.

### Sağlayıcı örnekleri

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Paketli `cerebras` sağlayıcı Plugin'i bunu `openclaw onboard --auth-choice cerebras-api-key` ile yapılandırabilir. Açık sağlayıcı yapılandırmasını yalnızca varsayılanları geçersiz kılarken kullanın.

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

    Cerebras için `cerebras/zai-glm-4.7`; Z.AI doğrudan erişimi için `zai/glm-4.7` kullanın.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic uyumlu, yerleşik sağlayıcı. Kısayol: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Yerel modeller (LM Studio)">
    Bkz. [Yerel Modeller](/tr/gateway/local-models). Kısaca: ciddi donanımda LM Studio Responses API üzerinden büyük bir yerel model çalıştırın; yedek için barındırılan modelleri birleştirilmiş tutun.
  </Accordion>
  <Accordion title="MiniMax M2.7 (doğrudan)">
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

    `MINIMAX_API_KEY` ayarlayın. Kısayollar: `openclaw onboard --auth-choice minimax-global-api` veya `openclaw onboard --auth-choice minimax-cn-api`. Model kataloğu varsayılan olarak yalnızca M2.7 içerir. Anthropic uyumlu akış yolunda, `thinking` değerini kendiniz açıkça ayarlamadığınız sürece OpenClaw varsayılan olarak MiniMax düşünmeyi devre dışı bırakır. `/fast on` veya `params.fastMode: true`, `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

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

    Yerel Moonshot uç noktaları, paylaşılan `openai-completions` aktarımında akış kullanım uyumluluğunu bildirir ve OpenClaw bunu yalnızca yerleşik sağlayıcı kimliği yerine uç nokta yeteneklerine göre belirler.

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

    `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) ayarlayın. Zen kataloğu için `opencode/...` başvurularını veya Go kataloğu için `opencode-go/...` başvurularını kullanın. Kısayol: `openclaw onboard --auth-choice opencode-zen` veya `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (Anthropic uyumlu)">
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
    - Genel uç nokta için, temel URL geçersiz kılmasıyla özel bir sağlayıcı tanımlayın.

  </Accordion>
</AccordionGroup>

---

## İlgili

- [Yapılandırma — aracılar](/tr/gateway/config-agents)
- [Yapılandırma — kanallar](/tr/gateway/config-channels)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — diğer üst düzey anahtarlar
- [Araçlar ve plugins](/tr/tools)
