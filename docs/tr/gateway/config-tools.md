---
read_when:
    - '`tools.*` politikasını, izin listelerini veya deneysel özellikleri yapılandırma'
    - Özel sağlayıcıları kaydetme veya temel URL'leri geçersiz kılma
    - OpenAI uyumlu kendi kendine barındırılan uç noktaları ayarlama
sidebarTitle: Tools and custom providers
summary: Araçlar yapılandırması (ilke, deneysel anahtarlar, sağlayıcı destekli araçlar) ve özel sağlayıcı/temel URL kurulumu
title: Yapılandırma — araçlar ve özel sağlayıcılar
x-i18n:
    generated_at: "2026-05-05T01:46:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9196bff46d8b0f9447fb46b47fc764f5bbc4f0b19eb252d4db611e94e57b4883
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` yapılandırma anahtarları ve özel sağlayıcı / temel URL kurulumu. agents, channels ve diğer üst düzey yapılandırma anahtarları için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration-reference).

## Araçlar

### Araç profilleri

`tools.profile`, `tools.allow`/`tools.deny` öncesinde temel bir izin listesi ayarlar:

<Note>
Yerel ilk kurulum, ayarlanmamışsa yeni yerel yapılandırmalar için varsayılanı `tools.profile: "coding"` olarak belirler (mevcut açık profiller korunur).
</Note>

| Profil      | İçerir                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Yalnızca `session_status`                                                                                                       |
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

Belirli sağlayıcılar veya modeller için araçları daha da kısıtlayın. Sıra: temel profil → sağlayıcı profili → izin ver/reddet.

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

- Aracı başına geçersiz kılma (`agents.list[].tools.elevated`) yalnızca daha fazla kısıtlayabilir.
- `/elevated on|off|ask|full`, durumu oturum başına depolar; satır içi yönergeler tek iletiye uygulanır.
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
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Araç döngüsü güvenlik denetimleri **varsayılan olarak devre dışıdır**. Algılamayı etkinleştirmek için `enabled: true` ayarlayın. Ayarlar genel olarak `tools.loopDetection` içinde tanımlanabilir ve aracı başına `agents.list[].tools.loopDetection` konumunda geçersiz kılınabilir.

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
  Uyarılar için tekrarlayan ilerleme-yok deseni eşiği.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Kritik döngüleri engellemek için daha yüksek tekrarlama eşiği.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Herhangi bir ilerleme-yok çalışması için kesin durdurma eşiği.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Aynı araç/aynı bağımsız değişken çağrıları tekrarlandığında uyar.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Bilinen yoklama araçlarında (`process.poll`, `command_status` vb.) uyar/engelle.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Dönüşümlü ilerleme-yok çift desenlerinde uyar/engelle.
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

Gelen medya anlamayı yapılandırır (görüntü/ses/video):

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
    **Sağlayıcı girdisi** (`type: "provider"` veya atlanmış):

    - `provider`: API sağlayıcı kimliği (`openai`, `anthropic`, `google`/`gemini`, `groq` vb.)
    - `model`: model kimliği geçersiz kılması
    - `profile` / `preferredProfile`: `auth-profiles.json` profil seçimi

    **CLI girdisi** (`type: "cli"`):

    - `command`: çalıştırılacak yürütülebilir dosya
    - `args`: şablonlanmış argümanlar (`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` vb. desteklenir; `openclaw doctor --fix`, kullanım dışı `{input}` yer tutucularını `{{MediaPath}}` biçimine geçirir)

    **Ortak alanlar:**

    - `capabilities`: isteğe bağlı liste (`image`, `audio`, `video`). Varsayılanlar: `openai`/`anthropic`/`minimax` → görüntü, `google` → görüntü+ses+video, `groq` → ses.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: girdi başına geçersiz kılmalar.
    - `tools.media.image.timeoutSeconds` ve eşleşen görüntü modeli `timeoutSeconds` girdileri, ajan açık `image` aracını çağırdığında da uygulanır.
    - Hatalar bir sonraki girdiye geri düşer.

    Sağlayıcı kimlik doğrulaması standart sırayı izler: `auth-profiles.json` → env değişkenleri → `models.providers.*.apiKey`.

    **Eşzamansız tamamlama alanları:**

    - `asyncCompletion.directSend`: kullanım dışı uyumluluk bayrağı. Tamamlanan eşzamansız medya görevleri istek sahibi oturumu aracılı kalır; böylece ajan sonucu alır, kullanıcıya nasıl söyleyeceğine karar verir ve kaynak teslimi gerektirdiğinde mesaj aracını kullanır.

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

Varsayılan: `tree` (geçerli oturum + alt ajanlar gibi onun oluşturduğu oturumlar).

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
    - `tree`: geçerli oturum + geçerli oturumun oluşturduğu oturumlar (alt ajanlar).
    - `agent`: geçerli ajan kimliğine ait herhangi bir oturum (aynı ajan kimliği altında gönderene göre oturumlar çalıştırıyorsanız diğer kullanıcıları içerebilir).
    - `all`: herhangi bir oturum. Ajanlar arası hedefleme yine de `tools.agentToAgent` gerektirir.
    - Korumalı alan sıkıştırması: geçerli oturum korumalı alandaysa ve `agents.defaults.sandbox.sessionToolsVisibility="spawned"` ise, `tools.sessions.visibility="all"` olsa bile görünürlük zorunlu olarak `tree` yapılır.

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
    - Dosyalar, alt çalışma alanında `.openclaw/attachments/<uuid>/` konumuna bir `.manifest.json` ile materyalize edilir.
    - Ek içeriği, döküm kalıcılığından otomatik olarak sansürlenir.
    - Base64 girdileri katı alfabe/dolgu denetimleri ve kod çözme öncesi boyut korumasıyla doğrulanır.
    - Dosya izinleri dizinler için `0700`, dosyalar için `0600` değerindedir.
    - Temizleme, `cleanup` ilkesini izler: `delete` ekleri her zaman kaldırır; `keep` bunları yalnızca `retainOnSessionKeep: true` olduğunda korur.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Deneysel yerleşik araç bayrakları. Katı aracılı GPT-5 otomatik etkinleştirme kuralı uygulanmadığı sürece varsayılan olarak kapalıdır.

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
- Varsayılan: Bir OpenAI veya OpenAI Codex GPT-5 ailesi çalıştırması için `agents.defaults.embeddedPi.executionContract` (veya aracı bazında bir geçersiz kılma) `"strict-agentic"` olarak ayarlanmadığı sürece `false`. Aracı bu kapsam dışında zorla açmak için `true`, katı aracılı GPT-5 çalıştırmalarında bile kapalı tutmak için `false` olarak ayarlayın.
- Etkinleştirildiğinde, sistem istemi ayrıca modelin bunu yalnızca kapsamlı işler için kullanması ve en fazla bir adımı `in_progress` durumunda tutması için kullanım rehberliği ekler.

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

- `model`: oluşturulan alt aracılar için varsayılan model. Atlanırsa, alt aracılar çağıranın modelini devralır.
- `allowAgents`: istekte bulunan aracı kendi `subagents.allowAgents` değerini ayarlamadığında `sessions_spawn` için hedef aracı kimliklerinin varsayılan izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı aracı).
- `runTimeoutSeconds`: araç çağrısı `runTimeoutSeconds` değerini atladığında `sessions_spawn` için varsayılan zaman aşımı (saniye). `0`, zaman aşımı yok anlamına gelir.
- Alt aracı başına araç ilkesi: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Özel sağlayıcılar ve temel URL'ler

OpenClaw yerleşik model kataloğunu kullanır. Yapılandırmada veya `~/.openclaw/agents/<agentId>/agent/models.json` içinde `models.providers` aracılığıyla özel sağlayıcılar ekleyin.

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
    - Aracı yapılandırma kökünü `OPENCLAW_AGENT_DIR` (veya eski ortam değişkeni takma adı olan `PI_CODING_AGENT_DIR`) ile geçersiz kılın.
    - Eşleşen sağlayıcı kimlikleri için birleştirme önceliği:
      - Boş olmayan aracı `models.json` `baseUrl` değerleri kazanır.
      - Boş olmayan aracı `apiKey` değerleri yalnızca ilgili sağlayıcı geçerli yapılandırma/kimlik doğrulama profili bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
      - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş gizli bilgileri kalıcı hale getirmek yerine kaynak işaretçilerinden (ortam referansları için `ENV_VAR_NAME`, dosya/exec referansları için `secretref-managed`) yenilenir.
      - SecretRef tarafından yönetilen sağlayıcı üst bilgi değerleri, kaynak işaretçilerinden (ortam referansları için `secretref-env:ENV_VAR_NAME`, dosya/exec referansları için `secretref-managed`) yenilenir.
      - Boş veya eksik aracı `apiKey`/`baseUrl`, yapılandırmadaki `models.providers` değerine geri döner.
      - Eşleşen model `contextWindow`/`maxTokens`, açık yapılandırma ile örtük katalog değerleri arasındaki daha yüksek değeri kullanır.
      - Eşleşen model `contextTokens`, varsa açık bir runtime sınırını korur; yerel model meta verilerini değiştirmeden etkili bağlamı sınırlamak için bunu kullanın.
      - Yapılandırmanın `models.json` dosyasını tamamen yeniden yazmasını istediğinizde `models.mode: "replace"` kullanın.
      - İşaretçi kalıcılığı kaynak yetkilidir: işaretçiler çözümlenmiş runtime gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazılır.

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
    - `models.providers.*.api`: istek adaptörü (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` vb.). MLX, vLLM, SGLang ve çoğu OpenAI uyumlu yerel sunucu gibi kendinden barındırılan `/v1/chat/completions` arka uçları için `openai-completions` kullanın. `baseUrl` içeren ancak `api` içermeyen bir özel sağlayıcı varsayılan olarak `openai-completions` kullanır; `openai-responses` değerini yalnızca arka uç `/v1/responses` desteklediğinde ayarlayın.
    - `models.providers.*.apiKey`: sağlayıcı kimlik bilgisi (SecretRef/ortam ikamesini tercih edin).
    - `models.providers.*.auth`: kimlik doğrulama stratejisi (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: model girdisi `contextWindow` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan yerel bağlam penceresi.
    - `models.providers.*.contextTokens`: model girdisi `contextTokens` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan etkili runtime bağlam sınırı.
    - `models.providers.*.maxTokens`: model girdisi `maxTokens` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan çıktı belirteci sınırı.
    - `models.providers.*.timeoutSeconds`: bağlantı, üst bilgiler, gövde ve toplam istek iptali işlemeyi içeren, sağlayıcı başına isteğe bağlı model HTTP isteği zaman aşımı süresi.
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` için isteklere `options.num_ctx` enjekte edin (varsayılan: `true`).
    - `models.providers.*.authHeader`: gerektiğinde kimlik bilgisi aktarımını `Authorization` üst bilgisinde zorunlu kılın.
    - `models.providers.*.baseUrl`: yukarı akış API temel URL'si.
    - `models.providers.*.headers`: proxy/kiracı yönlendirmesi için ek statik üst bilgiler.

  </Accordion>
  <Accordion title="İstek aktarımı geçersiz kılmaları">
    `models.providers.*.request`: model sağlayıcı HTTP istekleri için aktarım geçersiz kılmaları.

    - `request.headers`: ek üst bilgiler (sağlayıcı varsayılanlarıyla birleştirilir). Değerler SecretRef kabul eder.
    - `request.auth`: kimlik doğrulama stratejisi geçersiz kılması. Modlar: `"provider-default"` (sağlayıcının yerleşik kimlik doğrulamasını kullan), `"authorization-bearer"` (`token` ile), `"header"` (`headerName`, `value`, isteğe bağlı `prefix` ile).
    - `request.proxy`: HTTP proxy geçersiz kılması. Modlar: `"env-proxy"` (`HTTP_PROXY`/`HTTPS_PROXY` ortam değişkenlerini kullan), `"explicit-proxy"` (`url` ile). Her iki mod da isteğe bağlı bir `tls` alt nesnesi kabul eder.
    - `request.tls`: doğrudan bağlantılar için TLS geçersiz kılması. Alanlar: `ca`, `cert`, `key`, `passphrase` (tümü SecretRef kabul eder), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: `true` olduğunda, DNS özel, CGNAT veya benzer aralıklara çözümlendiğinde sağlayıcı HTTP fetch koruması üzerinden `baseUrl` için HTTPS'e izin verin (güvenilir kendinden barındırılan OpenAI uyumlu uç noktalar için operatör katılımı). `localhost`, `127.0.0.1` ve `[::1]` gibi local loopback model sağlayıcı akış URL'lerine bu açıkça `false` olarak ayarlanmadığı sürece otomatik olarak izin verilir; LAN, tailnet ve özel DNS ana bilgisayarları yine de katılım gerektirir. WebSocket, üst bilgiler/TLS için aynı `request` değerini kullanır, ancak söz konusu fetch SSRF kapısını kullanmaz. Varsayılan `false`.

  </Accordion>
  <Accordion title="Model kataloğu girdileri">
    - `models.providers.*.models`: açık sağlayıcı model kataloğu girdileri.
    - `models.providers.*.models.*.input`: model girdi modaliteleri. Yalnızca metin modelleri için `["text"]`, yerel görüntü/görüş modelleri için `["text", "image"]` kullanın. Görüntü ekleri yalnızca seçilen model görüntü destekli olarak işaretlendiğinde aracı turlarına enjekte edilir.
    - `models.providers.*.models.*.contextWindow`: yerel model bağlam penceresi meta verileri. Bu, ilgili model için sağlayıcı düzeyindeki `contextWindow` değerini geçersiz kılar.
    - `models.providers.*.models.*.contextTokens`: isteğe bağlı runtime bağlam sınırı. Bu, sağlayıcı düzeyindeki `contextTokens` değerini geçersiz kılar; modelin yerel `contextWindow` değerinden daha küçük etkili bir bağlam bütçesi istediğinizde kullanın; `openclaw models list`, farklı olduklarında iki değeri de gösterir.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: isteğe bağlı uyumluluk ipucu. Yerel olmayan boş olmayan bir `baseUrl` (ana bilgisayar `api.openai.com` değil) ile `api: "openai-completions"` için OpenClaw bunu runtime sırasında `false` olmaya zorlar. Boş/atlanmış `baseUrl`, varsayılan OpenAI davranışını korur.
    - `models.providers.*.models.*.compat.requiresStringContent`: yalnızca dize kabul eden OpenAI uyumlu sohbet uç noktaları için isteğe bağlı uyumluluk ipucu. `true` olduğunda, OpenClaw isteği göndermeden önce saf metin `messages[].content` dizilerini düz dizelere indirger.

  </Accordion>
  <Accordion title="Amazon Bedrock keşfi">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock otomatik keşif ayarları kökü.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: örtük keşfi aç/kapat.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: keşif için AWS bölgesi.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: hedefli keşif için isteğe bağlı sağlayıcı kimliği filtresi.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: keşif yenilemesi için yoklama aralığı.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: keşfedilen modeller için yedek bağlam penceresi.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: keşfedilen modeller için yedek en yüksek çıktı belirteci sayısı.

  </Accordion>
</AccordionGroup>

Etkileşimli özel sağlayıcı ilk katılımı, GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V ve GLM-4V gibi yaygın görüş modeli kimlikleri için görüntü girdisini çıkarır ve bilinen yalnızca metin aileleri için ek soruyu atlar. Bilinmeyen model kimlikleri yine de görüntü desteği için istem gösterir. Etkileşimsiz ilk katılım aynı çıkarımı kullanır; görüntü destekli meta verileri zorlamak için `--custom-image-input` veya yalnızca metin meta verilerini zorlamak için `--custom-text-input` geçin.

### Sağlayıcı örnekleri

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Paketle gelen `cerebras` sağlayıcı Plugin'i bunu `openclaw onboard --auth-choice cerebras-api-key` aracılığıyla yapılandırabilir. Açık sağlayıcı yapılandırmasını yalnızca varsayılanları geçersiz kılarken kullanın.

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

    `cerebras/zai-glm-4.7` öğesini Cerebras için; `zai/glm-4.7` öğesini doğrudan Z.AI için kullanın.

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
  <Accordion title="Local models (LM Studio)">
    [Yerel Modeller](/tr/gateway/local-models) bölümüne bakın. TL;DR: ciddi donanımda LM Studio Responses API üzerinden büyük bir yerel model çalıştırın; yedek için barındırılan modelleri birleştirilmiş tutun.
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

    `MINIMAX_API_KEY` ayarlayın. Kısayollar: `openclaw onboard --auth-choice minimax-global-api` veya `openclaw onboard --auth-choice minimax-cn-api`. Model kataloğu varsayılan olarak yalnızca M2.7 kullanır. Anthropic uyumlu akış yolunda, `thinking` değerini açıkça kendiniz ayarlamadığınız sürece OpenClaw varsayılan olarak MiniMax düşünmesini devre dışı bırakır. `/fast on` veya `params.fastMode: true`, `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

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

    Yerel Moonshot uç noktaları, paylaşılan `openai-completions` taşımasında akış kullanım uyumluluğunu duyurur ve OpenClaw bunu yalnızca yerleşik sağlayıcı kimliği yerine uç nokta yeteneklerine göre anahtarlar.

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
    - Genel uç nokta için, temel URL geçersiz kılmasıyla özel bir sağlayıcı tanımlayın.

  </Accordion>
</AccordionGroup>

---

## İlgili

- [Yapılandırma — agents](/tr/gateway/config-agents)
- [Yapılandırma — kanallar](/tr/gateway/config-channels)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — diğer üst düzey anahtarlar
- [Araçlar ve pluginler](/tr/tools)
