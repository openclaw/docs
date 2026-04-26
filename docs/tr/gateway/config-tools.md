---
read_when:
    - '`tools.*` ilkesi, izin listeleri veya deneysel özelliklerini yapılandırma'
    - Özel sağlayıcıları kaydetme veya base URL'leri geçersiz kılma
    - OpenAI uyumlu kendi barındırdığınız uç noktaları kurma
sidebarTitle: Tools and custom providers
summary: Araçlar yapılandırması (ilke, deneysel geçişler, sağlayıcı destekli araçlar) ve özel sağlayıcı/base URL kurulumu
title: Yapılandırma — araçlar ve özel sağlayıcılar
x-i18n:
    generated_at: "2026-04-26T11:28:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef030940b155224e614675a85c7a81567fd3a493e5ec1c25c5956d49cbc11b86
    source_path: gateway/config-tools.md
    workflow: 15
---

`tools.*` yapılandırma anahtarları ve özel sağlayıcı / base URL kurulumu. Ajanlar, kanallar ve diğer üst düzey yapılandırma anahtarları için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) bölümüne bakın.

## Araçlar

### Araç profilleri

`tools.profile`, `tools.allow`/`tools.deny` öncesinde temel bir izin listesi ayarlar:

<Note>
Yerel onboarding, ayarlanmamış yeni yerel yapılandırmalarda varsayılan olarak `tools.profile: "coding"` kullanır (mevcut açık profiller korunur).
</Note>

| Profile     | Includes                                                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | yalnızca `session_status`                                                                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                        |
| `full`      | Kısıtlama yok (ayarlanmamış ile aynı)                                                                                             |

### Araç grupları

| Group              | Tools                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash`, `exec` için bir diğer ad olarak kabul edilir)                              |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                    |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                             |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                     |
| `group:ui`         | `browser`, `canvas`                                                                                                       |
| `group:automation` | `cron`, `gateway`                                                                                                         |
| `group:messaging`  | `message`                                                                                                                 |
| `group:nodes`      | `nodes`                                                                                                                   |
| `group:agents`     | `agents_list`                                                                                                             |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                        |
| `group:openclaw`   | Tüm yerleşik araçlar (sağlayıcı Plugins hariç)                                                                            |

### `tools.allow` / `tools.deny`

Genel araç izin/engelleme ilkesi (engelleme kazanır). Büyük/küçük harfe duyarsızdır, `*` joker karakterlerini destekler. Docker sandbox kapalı olsa bile uygulanır.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Belirli sağlayıcılar veya modeller için araçları daha da kısıtlar. Sıralama: temel profil → sağlayıcı profili → allow/deny.

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

Sandbox dışındaki yükseltilmiş exec erişimini denetler:

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

- Ajan başına geçersiz kılma (`agents.list[].tools.elevated`) yalnızca daha fazla kısıtlama getirebilir.
- `/elevated on|off|ask|full`, durumu oturum başına saklar; satır içi yönergeler tek mesaja uygulanır.
- Yükseltilmiş `exec`, sandboxing'i atlar ve yapılandırılmış kaçış yolunu kullanır (varsayılan olarak `gateway`, exec hedefi `node` olduğunda `node`).

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

Araç döngüsü güvenlik denetimleri varsayılan olarak **devre dışıdır**. Algılamayı etkinleştirmek için `enabled: true` ayarlayın. Ayarlar genel olarak `tools.loopDetection` içinde tanımlanabilir ve ajan başına `agents.list[].tools.loopDetection` altında geçersiz kılınabilir.

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
  Döngü analizi için tutulacak en fazla araç çağrısı geçmişi.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Uyarılar için yineleyen ilerleme-yok örüntüsü eşiği.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Kritik döngüleri engellemek için daha yüksek yineleme eşiği.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Herhangi bir ilerleme-yok çalıştırması için kesin durdurma eşiği.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Yinelenen aynı araç/aynı bağımsız değişken çağrılarında uyar.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Bilinen yoklama araçlarında (`process.poll`, `command_status` vb.) uyar/engelle.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Sırayla değişen ilerleme-yok çift örüntülerinde uyar/engelle.
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
        apiKey: "brave_api_key", // veya BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // isteğe bağlı; otomatik algılama için atlayın
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
        directSend: false, // isteğe bağlı: tamamlanan eşzamansız müzik/videoyu doğrudan kanala gönder
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
  <Accordion title="Medya model girdisi alanları">
    **Sağlayıcı girdisi** (`type: "provider"` veya atlanmış):

    - `provider`: API sağlayıcı kimliği (`openai`, `anthropic`, `google`/`gemini`, `groq` vb.)
    - `model`: model kimliği geçersiz kılması
    - `profile` / `preferredProfile`: `auth-profiles.json` profil seçimi

    **CLI girdisi** (`type: "cli"`):

    - `command`: çalıştırılacak yürütülebilir dosya
    - `args`: şablonlu bağımsız değişkenler (`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` vb. desteklenir)

    **Ortak alanlar:**

    - `capabilities`: isteğe bağlı liste (`image`, `audio`, `video`). Varsayılanlar: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: girdi başına geçersiz kılmalar.
    - Hatalar bir sonraki girdiye geri düşer.

    Sağlayıcı kimlik doğrulaması standart sırayı izler: `auth-profiles.json` → env değişkenleri → `models.providers.*.apiKey`.

    **Eşzamansız tamamlama alanları:**

    - `asyncCompletion.directSend`: `true` olduğunda, tamamlanan eşzamansız `music_generate` ve `video_generate` görevleri önce doğrudan kanal teslimatını dener. Varsayılan: `false` (eski istek sahibi-oturum uyandırma/model-teslimat yolu).

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

Hangi oturumların oturum araçları tarafından hedeflenebileceğini denetler (`sessions_list`, `sessions_history`, `sessions_send`).

Varsayılan: `tree` (geçerli oturum + onun tarafından oluşturulan oturumlar, örneğin alt ajanlar).

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
    - `agent`: geçerli ajan kimliğine ait herhangi bir oturum (aynı ajan kimliği altında gönderen başına oturumlar çalıştırıyorsanız diğer kullanıcıları içerebilir).
    - `all`: herhangi bir oturum. Ajanlar arası hedefleme yine de `tools.agentToAgent` gerektirir.
    - Sandbox kıstırması: geçerli oturum sandbox'lıysa ve `agents.defaults.sandbox.sessionToolsVisibility="spawned"` ise, `tools.sessions.visibility="all"` olsa bile görünürlük `tree` olmaya zorlanır.
  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

`sessions_spawn` için satır içi ek desteğini denetler.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // isteğe bağlı: satır içi dosya eklerine izin vermek için true ayarlayın
        maxTotalBytes: 5242880, // tüm dosyalar genelinde toplam 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // dosya başına 1 MB
        retainOnSessionKeep: false, // cleanup="keep" olduğunda ekleri koru
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ek notları">
    - Ekler yalnızca `runtime: "subagent"` için desteklenir. ACP çalışma zamanı bunları reddeder.
    - Dosyalar, `.manifest.json` ile birlikte `.openclaw/attachments/<uuid>/` altında çocuk çalışma alanında somutlaştırılır.
    - Ek içeriği otomatik olarak transkript kalıcılığından sansürlenir.
    - Base64 girdileri, sıkı alfabe/dolgu denetimleri ve kod çözme öncesi boyut korumasıyla doğrulanır.
    - Dosya izinleri dizinler için `0700`, dosyalar için `0600` olur.
    - Temizleme `cleanup` ilkesini izler: `delete` ekleri her zaman kaldırır; `keep`, bunları yalnızca `retainOnSessionKeep: true` olduğunda korur.
  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Deneysel yerleşik araç bayrakları. Katı ajan tabanlı GPT-5 otomatik etkinleştirme kuralı uygulanmadığı sürece varsayılan olarak kapalıdır.

```json5
{
  tools: {
    experimental: {
      planTool: true, // deneysel update_plan'ı etkinleştir
    },
  },
}
```

- `planTool`: trivial olmayan çok adımlı iş takibi için yapılandırılmış `update_plan` aracını etkinleştirir.
- Varsayılan: `agents.defaults.embeddedPi.executionContract` (veya ajan başına geçersiz kılma) bir OpenAI veya OpenAI Codex GPT-5 ailesi çalıştırması için `"strict-agentic"` olarak ayarlanmadıkça `false`. Bu kapsam dışında aracı zorla açmak için `true`, strict-agentic GPT-5 çalıştırmalarında bile kapalı tutmak için `false` ayarlayın.
- Etkinleştirildiğinde sistem istemi ayrıca modele bunu yalnızca önemli işler için kullanmasını ve en fazla bir adımı `in_progress` olarak tutmasını söyleyen kullanım rehberliği ekler.

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

- `model`: oluşturulan alt ajanlar için varsayılan model. Atlanırsa alt ajanlar çağıranın modelini devralır.
- `allowAgents`: isteyen ajan kendi `subagents.allowAgents` değerini ayarlamadığında `sessions_spawn` için hedef ajan kimliklerinin varsayılan izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı ajan).
- `runTimeoutSeconds`: araç çağrısı `runTimeoutSeconds` değerini atladığında `sessions_spawn` için varsayılan zaman aşımı (saniye). `0`, zaman aşımı olmadığı anlamına gelir.
- Alt ajan başına araç ilkesi: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Özel sağlayıcılar ve base URL'ler

OpenClaw, yerleşik model kataloğunu kullanır. Yapılandırmada veya `~/.openclaw/agents/<agentId>/agent/models.json` içinde `models.providers` aracılığıyla özel sağlayıcılar ekleyin.

```json5
{
  models: {
    mode: "merge", // merge (varsayılan) | replace
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
    - Ajan yapılandırma kökünü `OPENCLAW_AGENT_DIR` ile geçersiz kılın (veya eski ortam değişkeni diğer adı olan `PI_CODING_AGENT_DIR` ile).
    - Eşleşen sağlayıcı kimlikleri için birleştirme önceliği:
      - Boş olmayan ajan `models.json` `baseUrl` değerleri kazanır.
      - Boş olmayan ajan `apiKey` değerleri, yalnızca o sağlayıcı geçerli yapılandırma/auth-profile bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
      - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş gizli değerleri kalıcılaştırmak yerine kaynak işaretçilerden (`ENV_VAR_NAME` env başvuruları için, `secretref-managed` dosya/exec başvuruları için) yenilenir.
      - SecretRef tarafından yönetilen sağlayıcı başlık değerleri, kaynak işaretçilerden (`secretref-env:ENV_VAR_NAME` env başvuruları için, `secretref-managed` dosya/exec başvuruları için) yenilenir.
      - Boş veya eksik ajan `apiKey`/`baseUrl` değerleri, yapılandırmadaki `models.providers` alanına geri düşer.
      - Eşleşen model `contextWindow`/`maxTokens` değerleri, açık yapılandırma ile örtük katalog değerleri arasındaki daha yüksek değeri kullanır.
      - Eşleşen model `contextTokens`, mevcutsa açık çalışma zamanı sınırını korur; yerel model meta verisini değiştirmeden etkin bağlamı sınırlamak için bunu kullanın.
      - Yapılandırmanın `models.json` dosyasını tamamen yeniden yazmasını istediğinizde `models.mode: "replace"` kullanın.
      - İşaretçi kalıcılığı kaynak açısından yetkilidir: işaretçiler çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazılır.
  </Accordion>
</AccordionGroup>

### Sağlayıcı alan ayrıntıları

<AccordionGroup>
  <Accordion title="Üst düzey katalog">
    - `models.mode`: sağlayıcı katalog davranışı (`merge` veya `replace`).
    - `models.providers`: sağlayıcı kimliğiyle anahtarlanan özel sağlayıcı eşlemesi.
      - Güvenli düzenlemeler: eklemeli güncellemeler için `openclaw config set models.providers.<id> '<json>' --strict-json --merge` veya `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` kullanın. `config set`, `--replace` geçmediğiniz sürece yıkıcı değiştirmeleri reddeder.
  </Accordion>
  <Accordion title="Sağlayıcı bağlantısı ve kimlik doğrulama">
    - `models.providers.*.api`: istek bağdaştırıcısı (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` vb).
    - `models.providers.*.apiKey`: sağlayıcı kimlik bilgisi (SecretRef/env ikamesi tercih edilir).
    - `models.providers.*.auth`: kimlik doğrulama stratejisi (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` için isteklere `options.num_ctx` ekler (varsayılan: `true`).
    - `models.providers.*.authHeader`: gerektiğinde kimlik bilgisi taşınmasını `Authorization` başlığında zorlar.
    - `models.providers.*.baseUrl`: üst akış API base URL'si.
    - `models.providers.*.headers`: proxy/tenant yönlendirmesi için ek statik başlıklar.
  </Accordion>
  <Accordion title="İstek taşıma geçersiz kılmaları">
    `models.providers.*.request`: model-sağlayıcı HTTP istekleri için taşıma geçersiz kılmaları.

    - `request.headers`: ek başlıklar (sağlayıcı varsayılanlarıyla birleştirilir). Değerler SecretRef kabul eder.
    - `request.auth`: kimlik doğrulama stratejisi geçersiz kılması. Modlar: `"provider-default"` (sağlayıcının yerleşik kimlik doğrulamasını kullan), `"authorization-bearer"` (`token` ile), `"header"` (`headerName`, `value`, isteğe bağlı `prefix` ile).
    - `request.proxy`: HTTP proxy geçersiz kılması. Modlar: `"env-proxy"` (`HTTP_PROXY`/`HTTPS_PROXY` env değişkenlerini kullan), `"explicit-proxy"` (`url` ile). Her iki mod da isteğe bağlı bir `tls` alt nesnesi kabul eder.
    - `request.tls`: doğrudan bağlantılar için TLS geçersiz kılması. Alanlar: `ca`, `cert`, `key`, `passphrase` (hepsi SecretRef kabul eder), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: `true` olduğunda, sağlayıcı HTTP fetch koruması aracılığıyla DNS özel, CGNAT veya benzeri aralıklara çözümlendiğinde `baseUrl` için HTTPS'e izin verir (güvenilen kendi barındırılan OpenAI uyumlu uç noktalar için operatör katılımı). WebSocket aynı `request` yapısını başlıklar/TLS için kullanır ama o fetch SSRF geçidi için kullanmaz. Varsayılan `false`.

  </Accordion>
  <Accordion title="Model katalog girdileri">
    - `models.providers.*.models`: açık sağlayıcı model katalog girdileri.
    - `models.providers.*.models.*.contextWindow`: yerel model bağlam penceresi meta verisi.
    - `models.providers.*.models.*.contextTokens`: isteğe bağlı çalışma zamanı bağlam sınırı. Modelin yerel `contextWindow` değerinden daha küçük bir etkin bağlam bütçesi istiyorsanız bunu kullanın; `openclaw models list`, farklı olduklarında her iki değeri de gösterir.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: isteğe bağlı uyumluluk ipucu. `api: "openai-completions"` ile boş olmayan yerel olmayan bir `baseUrl` için (`api.openai.com` olmayan host), OpenClaw çalışma zamanında bunu `false` yapmaya zorlar. Boş/atlanmış `baseUrl`, varsayılan OpenAI davranışını korur.
    - `models.providers.*.models.*.compat.requiresStringContent`: yalnızca dizgi kabul eden OpenAI uyumlu sohbet uç noktaları için isteğe bağlı uyumluluk ipucu. `true` olduğunda OpenClaw, isteği göndermeden önce saf metin `messages[].content` dizilerini düz dizgilere indirger.
  </Accordion>
  <Accordion title="Amazon Bedrock keşfi">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock otomatik keşif ayarları kökü.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: örtük keşfi aç/kapat.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: keşif için AWS bölgesi.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: hedefli keşif için isteğe bağlı sağlayıcı kimliği filtresi.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: keşif yenilemesi için yoklama aralığı.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: keşfedilen modeller için geri dönüş bağlam penceresi.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: keşfedilen modeller için geri dönüş en yüksek çıktı token'ı.
  </Accordion>
</AccordionGroup>

### Sağlayıcı örnekleri

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.6 / 4.7)">
    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/zai-glm-4.6"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
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
              { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
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
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic uyumlu, yerleşik sağlayıcı. Kısayol: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Yerel modeller (LM Studio)">
    Bkz. [Yerel Modeller](/tr/gateway/local-models). Kısaca: ciddi donanımda LM Studio Responses API üzerinden büyük bir yerel model çalıştırın; geri dönüş için barındırılan modelleri birleştirilmiş halde tutun.
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

    `MINIMAX_API_KEY` ayarlayın. Kısayollar: `openclaw onboard --auth-choice minimax-global-api` veya `openclaw onboard --auth-choice minimax-cn-api`. Model kataloğu varsayılan olarak yalnızca M2.7 kullanır. Anthropic uyumlu akış yolunda OpenClaw, `thinking` değerini açıkça ayarlamadığınız sürece MiniMax düşünmesini varsayılan olarak devre dışı bırakır. `/fast on` veya `params.fastMode: true`, `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

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

    Yerel Moonshot uç noktaları, paylaşılan `openai-completions` taşıması üzerinde akış kullanım uyumluluğu ilan eder ve OpenClaw bunu yalnızca yerleşik sağlayıcı kimliğine göre değil, uç nokta yeteneklerine göre anahtarlar.

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

    `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) ayarlayın. Zen kataloğu için `opencode/...`, Go kataloğu için `opencode-go/...` başvurularını kullanın. Kısayol: `openclaw onboard --auth-choice opencode-zen` veya `openclaw onboard --auth-choice opencode-go`.

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

    Base URL `/v1` içermemelidir (Anthropic istemcisi bunu ekler). Kısayol: `openclaw onboard --auth-choice synthetic-api-key`.

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

    `ZAI_API_KEY` ayarlayın. `z.ai/*` ve `z-ai/*` kabul edilen diğer adlardır. Kısayol: `openclaw onboard --auth-choice zai-api-key`.

    - Genel uç nokta: `https://api.z.ai/api/paas/v4`
    - Kodlama uç noktası (varsayılan): `https://api.z.ai/api/coding/paas/v4`
    - Genel uç nokta için base URL geçersiz kılmalı özel bir sağlayıcı tanımlayın.

  </Accordion>
</AccordionGroup>

---

## İlgili

- [Yapılandırma — ajanlar](/tr/gateway/config-agents)
- [Yapılandırma — kanallar](/tr/gateway/config-channels)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — diğer üst düzey anahtarlar
- [Araçlar ve Plugins](/tr/tools)
