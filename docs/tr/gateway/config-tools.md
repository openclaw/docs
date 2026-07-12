---
read_when:
    - '`tools.*` politikasını, izin verilenler listelerini veya deneysel özellikleri yapılandırma'
    - Özel sağlayıcıları kaydetme veya temel URL'leri geçersiz kılma
    - OpenAI uyumlu, kendi barındırdığınız uç noktaları ayarlama
sidebarTitle: Tools and custom providers
summary: Araç yapılandırması (politika, deneysel anahtarlar, sağlayıcı destekli araçlar) ve özel sağlayıcı/temel URL kurulumu
title: Yapılandırma — araçlar ve özel sağlayıcılar
x-i18n:
    generated_at: "2026-07-12T12:16:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` yapılandırma anahtarları ve özel sağlayıcı / temel URL kurulumu. Aracılar, kanallar ve diğer üst düzey yapılandırma anahtarları için [Yapılandırma başvurusuna](/tr/gateway/configuration-reference) bakın.

## Araçlar

### Araç profilleri

`tools.profile`, `tools.allow`/`tools.deny` öncesinde temel bir izin listesi belirler:

<Note>
Yerel ilk katılım, ayarlanmamışsa yeni yerel yapılandırmalarda varsayılan olarak `tools.profile: "coding"` değerini kullanır (mevcut açık profiller korunur).
</Note>

| Profil      | İçerik                                                                                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Yalnızca `session_status`                                                                                                                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | Kısıtlama yok (ayarlanmamış olmasıyla aynı)                                                                                                                                                                                  |

`coding` ve `messaging`, `bundle-mcp` öğesine (yapılandırılmış MCP sunucuları) da örtük olarak izin verir.

### Araç grupları

| Grup               | Araçlar                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash`, `exec` için takma ad olarak kabul edilir)                                                                 |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                  |
| `group:openclaw`   | Yukarıdaki yerleşik araçların `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` dışındakilerin tümü (Plugin araçları hariç)                |
| `group:plugins`    | `bundle-mcp` aracılığıyla sunulan yapılandırılmış MCP sunucuları dâhil, yüklenen Plugin'lerin sahip olduğu araçlar                                      |

`spawn_task`, bir kodlama aracısının başlatmadan, onaylanmış takip çalışması önermesine olanak tanır. Control UI, başlığı ve özeti eyleme dönüştürülebilir bir çip olarak gösterir; Gateway destekli bir TUI, eşdeğer bir etkileşimli istem gösterir. İkisinden birinin kabul edilmesi, yeni bir yönetilen çalışma ağacı oturumu oluşturur ve mevcut işlem devam ederken tam istemi oraya gönderir. `dismiss_task`, `spawn_task` tarafından döndürülen geçici `task_id` aracılığıyla hâlâ beklemede olan bir öneriyi geri çeker.

Araçlar yalnızca başlatan operatör yüzeyi Gateway görev önerisi olaylarını alıp işleyebildiğinde sunulur. Kanal oturumları ve yerel/gömülü TUI oturumları bunları almaz; kanal aktarımlarının bu akışı güvenli biçimde sunabilmesi için taşınabilir, türü belirlenmiş bir görev eylemi gerekir. Öneriler işleme özeldir ve Gateway yeniden başlatıldığında kaybolur. Her iki araç da `coding` profilinde ve `group:sessions` içinde kalır; böylece normal `tools.allow` ve `tools.deny` ilkesi, yüzey bunları desteklediğinde araçları otomatik olarak yapılandırır.

### Korumalı alan araç ilkesi içindeki MCP ve Plugin araçları

Yapılandırılmış MCP sunucuları, `bundle-mcp` Plugin kimliği altında Plugin'e ait araçlar olarak sunulur. Normal araç profilleri bunlara izin verebilir; ancak `tools.sandbox.tools`, korumalı alan oturumları için ek bir geçittir. Korumalı alan modu `"all"` veya `"non-main"` ise MCP/Plugin araçlarının görünür olması gerektiğinde korumalı alan araç izin listesine şu girdilerden birini ekleyin:

- `mcp.servers` kaynağındaki OpenClaw tarafından yönetilen MCP sunucuları için `bundle-mcp`
- Belirli bir yerel Plugin için Plugin kimliği
- Yüklenen ve Plugin'e ait tüm araçlar için `group:plugins`
- Yalnızca bir sunucu istiyorsanız tam MCP sunucu araç adları veya `outlook__send_mail` ya da `outlook__*` gibi sunucu glob kalıpları

Sunucu glob kalıpları, ham `mcp.servers` anahtarını değil, sağlayıcı açısından güvenli MCP sunucu önekini kullanır. `[A-Za-z0-9_-]` dışında kalan karakterler `-` olur, harfle başlamayan adlara `mcp-` öneki eklenir ve uzun ya da yinelenen önekler kısaltılabilir veya son ek alabilir; örneğin `mcp.servers["Outlook Graph"]`, `outlook-graph__*` gibi bir glob kalıbı kullanır.

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

Bu korumalı alan katmanı girdisi olmadan MCP sunucusu yine başarıyla yüklenebilir, ancak araçları sağlayıcı isteğinden önce filtrelenir. `mcp.servers` içindeki OpenClaw tarafından yönetilen sunucularda bu yapıyı yakalamak için `openclaw doctor` kullanın. Paketlenmiş Plugin manifestlerinden veya Claude `.mcp.json` dosyasından yüklenen MCP sunucuları aynı korumalı alan geçidini kullanır; ancak bu tanılama henüz bu kaynakları listelemez. Araçları korumalı alan işlemlerinde kaybolursa aynı izin listesi girdilerini kullanın.

### `tools.codeMode`

`tools.codeMode`, genel OpenClaw kod modu yüzeyini etkinleştirir. Araçları olan bir
çalıştırma için etkinleştirildiğinde, normal OpenClaw araçları korumalı alan içindeki `tools.*`
katalog köprüsünün arkasına taşınır ve MCP araçları oluşturulan `MCP`
ad alanı üzerinden kullanılabilir. Model normalde `exec` ve `wait` araçlarını görür; yapılandırılmış
sonuçları yalnızca JSON kullanan köprüden geçemeyen `computer` gibi araçlar doğrudan kalır.

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

MCP bildirimleri, kod modunda salt okunur sanal API dosya yüzeyi üzerinden
sunulur. Konuk kod, TypeScript tarzı imzaları incelemek için `API.list("mcp")` ve
`API.read("mcp/<server>.d.ts")` çağrılarını, ardından
`MCP.<server>.<tool>()` çağrısını yapabilir. Çalışma zamanı sözleşmesi, sınırlar
ve hata ayıklama adımları için [Kod moduna](/tr/reference/code-mode) bakın.

### `tools.allow` / `tools.deny`

Genel araç izin/engelleme politikası (engelleme önceliklidir). Büyük/küçük harfe duyarsızdır ve `*` joker karakterlerini destekler. Docker korumalı alanı kapalıyken bile uygulanır.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` ve `apply_patch` ayrı araç kimlikleridir. `allow: ["write"]`, uyumlu modeller için `apply_patch` aracını da etkinleştirir; ancak `deny: ["write"]`, `apply_patch` aracını engellemez. Tüm dosya değişikliklerini engellemek için `group:fs` grubunu engelleyin veya değişiklik yapan her aracı açıkça listeleyin:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` ve `alsoAllow` aynı kapsamda (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) birlikte ayarlanamaz; yapılandırma doğrulaması bunu reddeder. `alsoAllow` girdilerini `allow` içine birleştirin veya `allow` ayarını kaldırıp bunun yerine `profile` + `alsoAllow` kullanın.
</Note>

### `tools.byProvider`

Belirli sağlayıcılar veya modeller için araçları daha fazla kısıtlar. Sıralama: temel profil → sağlayıcı profili → izin/engelleme.

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

Belirli bir istekte bulunan kimliği için araçları kısıtlar. Bu, kanal erişim denetimine ek bir derinlemesine savunma katmanıdır; gönderici değerleri mesaj metninden değil, kanal bağdaştırıcısından gelmelidir.

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

Anahtarlar açık önekler kullanır: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` veya `"*"`. Kanal kimlikleri, standart OpenClaw kimlikleridir; `teams` gibi diğer adlar `msteams` olarak normalleştirilir. Öneksiz eski anahtarlar yalnızca `id:` olarak kabul edilir. Eşleştirme sırası kanal+kimlik, kimlik, e164, kullanıcı adı, ad ve ardından joker karakterdir.

Ajan başına `agents.list[].tools.toolsBySender`, eşleştiğinde boş bir `{}` politikasıyla bile genel gönderici eşleşmesini geçersiz kılar.

### `tools.elevated`

Korumalı alan dışındaki yükseltilmiş `exec` erişimini denetler:

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

- Ajan başına geçersiz kılma (`agents.list[].tools.elevated`) yalnızca daha fazla kısıtlama uygulayabilir.
- `/elevated on|off|ask|full`, durumu oturum başına saklar; satır içi yönergeler tek bir mesaja uygulanır.
- Yükseltilmiş `exec`, korumalı alanı atlar ve yapılandırılmış çıkış yolunu kullanır (varsayılan olarak `gateway`; `exec` hedefi `node` olduğunda `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

Gösterilen değerler, `applyPatch.allowModels` dışında varsayılan değerlerdir (`applyPatch.allowModels` varsayılan olarak boştur/ayarlanmamıştır; bu, uyumlu herhangi bir modelin `apply_patch` kullanabileceği anlamına gelir). `approvalRunningNoticeMs`, onay destekli `exec` uzun süre çalıştığında çalıştığına dair bir bildirim gönderir; `0` bu bildirimi devre dışı bırakır.

### `tools.loopDetection`

Araç döngüsü güvenlik denetimleri **varsayılan olarak devre dışıdır**. Algılamayı etkinleştirmek için `enabled: true` ayarlayın. Ayarlar genel olarak `tools.loopDetection` içinde tanımlanabilir ve ajan başına `agents.list[].tools.loopDetection` konumunda geçersiz kılınabilir.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Döngü analizi için tutulan araç çağrısı geçmişinin azami uzunluğu.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Uyarılar için ilerleme sağlamayan yinelenen örüntü eşiği.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  Aynı kullanılamayan veya bilinmeyen araç adına yapılan yinelenen çağrıları, bu sayıdaki başarısız denemeden sonra engeller.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Kritik döngüleri engellemek için kullanılan daha yüksek yineleme eşiği.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  İlerleme sağlamayan herhangi bir çalıştırma için kesin durdurma eşiği.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Aynı araç ve aynı bağımsız değişkenlerle yinelenen çağrılarda uyar.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Bilinen yoklama araçlarında (`process.poll`, `command_status` vb.) uyarır veya engeller.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  İlerleme sağlamayan dönüşümlü çift örüntülerinde uyarır veya engeller.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  Otomatik Compaction sonrasında korumanın etkin kaldığı deneme sayısıdır; ajan bu pencere içinde aynı (araç, bağımsız değişkenler, sonuç) birleşimini yinelerse işlemi iptal eder.
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
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
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

Gösterilen değerler, `provider` ve `userAgent` dışında varsayılan değerlerdir. `maxResponseBytes`, 32000–10000000 aralığıyla sınırlandırılır; `maxChars`, `maxCharsCap` ile sınırlandırılır (daha büyük yanıtlara izin vermek için `maxCharsCap` değerini yükseltin).

### `tools.media`

Gelen medyanın anlaşılmasını (görüntü/ses/video) yapılandırır:

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

`concurrency` (varsayılan `2`), `audio.maxBytes` (varsayılan 20 MB) ve `video.maxBytes` (varsayılan 50 MB) varsayılan değerleriyle gösterilmiştir; `image.maxBytes` varsayılan olarak 10 MB'dir. Yetenek başına istek zaman aşımı varsayılanları: görüntü/ses için `60` sn., video için `120` sn.

<AccordionGroup>
  <Accordion title="Medya modeli girdisi alanları">
    **Sağlayıcı girdisi** (`type: "provider"` veya belirtilmemiş):

    - `provider`: API sağlayıcı kimliği (`openai`, `anthropic`, `google`/`gemini`, `groq` vb.)
    - `model`: model kimliği geçersiz kılma değeri
    - `profile` / `preferredProfile`: `auth-profiles.json` profil seçimi

    **CLI girdisi** (`type: "cli"`):

    - `command`: çalıştırılacak yürütülebilir dosya
    - `args`: şablonlanmış bağımsız değişkenler (`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` vb. desteklenir; `openclaw doctor --fix`, kullanımdan kaldırılmış `{input}` yer tutucularını `{{MediaPath}}` biçimine taşır)

    **Ortak alanlar:**

    - `capabilities`: isteğe bağlı liste (`image`, `audio`, `video`). Her sağlayıcı Plugin'i kendi varsayılan yetenek kümesini bildirir; örneğin paketle birlikte gelen `openai` sağlayıcısının varsayılanı görüntü+ses, `anthropic`/`minimax` sağlayıcılarının görüntü, `google` sağlayıcısının görüntü+ses+video ve `groq` sağlayıcısının sestir.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: girdi başına geçersiz kılma değerleri.
    - `tools.media.image.timeoutSeconds` ve eşleşen görüntü modeli `timeoutSeconds` girdileri, ajan açık `image` aracını çağırdığında da uygulanır. Görüntü anlama için bu zaman aşımı isteğin kendisine uygulanır ve önceki hazırlık çalışmalarının süresi nedeniyle azaltılmaz.
    - Başarısızlık durumunda sonraki girdiye geçilir.

    Sağlayıcı kimlik doğrulaması standart sırayı izler: `auth-profiles.json` → ortam değişkenleri → `models.providers.*.apiKey`.

    **Eşzamansız tamamlama alanları:**

    - `asyncCompletion.directSend`: kullanımdan kaldırılmış uyumluluk bayrağı. Tamamlanan eşzamansız medya görevleri, ajanın sonucu alması, kullanıcıya nasıl bildireceğine karar vermesi ve kaynak teslimatı gerektiriyorsa mesaj aracını kullanması için istekte bulunan oturum aracılığıyla yürütülmeye devam eder.

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

Oturum araçlarının (`sessions_list`, `sessions_history`, `sessions_send`) hangi oturumları hedefleyebileceğini denetler.

Varsayılan: `tree` (geçerli oturum + alt ajanlar gibi bu oturum tarafından başlatılan oturumlar).

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
    - `tree`: geçerli oturum + geçerli oturum tarafından başlatılan oturumlar (alt ajanlar).
    - `agent`: geçerli ajan kimliğine ait herhangi bir oturum (aynı ajan kimliği altında gönderici başına oturum çalıştırıyorsanız diğer kullanıcıları da içerebilir).
    - `all`: herhangi bir oturum. Ajanlar arası hedefleme için yine de `tools.agentToAgent` gerekir.
    - Korumalı alan sınırlaması: geçerli oturum korumalı alandaysa ve `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (varsayılan) olarak ayarlanmışsa, `tools.sessions.visibility="all"` olsa bile görünürlük zorunlu olarak `tree` olur.
    - Değer `all` olmadığında `sessions_list`, etkin modu açıklayan kısa bir `visibility` alanı ile bazı oturumların geçerli kapsamın dışında kaldıkları için gösterilmeyebileceğini belirten bir uyarı içerir.

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
    - Ekler için `enabled: true` gerekir.
    - Alt ajan ekleri, alt çalışma alanında `.openclaw/attachments/<uuid>/` konumunda bir `.manifest.json` dosyasıyla somutlaştırılır.
    - ACP ekleri yalnızca görüntü olabilir ve aynı dosya sayısı, dosya başına bayt ve toplam bayt sınırlarını geçtikten sonra ACP çalışma zamanına satır içinde iletilir.
    - Ek içeriği, transkript kalıcılığından otomatik olarak çıkartılır.
    - Base64 girdileri, katı alfabe/doldurma denetimleri ve kod çözme öncesi boyut korumasıyla doğrulanır.
    - Alt ajan eki dosya izinleri dizinler için `0700`, dosyalar için `0600` değerindedir.
    - Alt ajan temizliği `cleanup` politikasını izler: `delete` ekleri her zaman kaldırır; `keep` ise yalnızca `retainOnSessionKeep: true` olduğunda ekleri korur.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Deneysel yerleşik araç bayrakları. Katı ajanlı GPT-5 otomatik etkinleştirme kuralı uygulanmadığı sürece varsayılan olarak kapalıdır.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: sıradan olmayan, çok adımlı çalışmaların takibi için yapılandırılmış `update_plan` aracını etkinleştirir.
- Varsayılan: Bir `openai` sağlayıcı çalıştırmasında GPT-5 ailesinden bir model kimliği için `agents.defaults.embeddedAgent.executionContract` (veya ajan başına geçersiz kılma değeri) `"strict-agentic"` olarak ayarlanmadığı sürece `false` değerindedir (Codex kimlik doğrulaması ve model yönlendirmesi `openai` sağlayıcısı altında yer aldığından bu, OpenAI Codex CLI çalıştırmalarını da kapsar). Aracı bu kapsam dışında zorunlu olarak etkinleştirmek için `true`, katı ajanlı GPT-5 çalıştırmalarında bile kapalı tutmak için `false` olarak ayarlayın.
- Etkinleştirildiğinde sistem istemi, modelin aracı yalnızca kapsamlı çalışmalarda kullanması ve en fazla bir adımı `in_progress` durumunda tutması için kullanım yönergeleri de ekler.

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

- `model`: başlatılan alt ajanlar için varsayılan model. Belirtilmezse alt ajanlar çağıranın modelini devralır.
- `allowAgents`: istekte bulunan ajan kendi `subagents.allowAgents` değerini ayarlamadığında `sessions_spawn` için yapılandırılmış hedef ajan kimliklerinin varsayılan izin listesi (`["*"]` = yapılandırılmış herhangi bir hedef; varsayılan: yalnızca aynı ajan). Ajan yapılandırması silinmiş eski girdiler `sessions_spawn` tarafından reddedilir ve `agents_list` çıktısında gösterilmez; bunları temizlemek için `openclaw doctor --fix` komutunu çalıştırın.
- `maxConcurrent`: eşzamanlı alt ajan çalıştırmalarının azami sayısı. Varsayılan: `8`.
- `runTimeoutSeconds`: çağıran kendi geçersiz kılma değerini iletmediğinde `sessions_spawn` için zaman aşımı (saniye). Varsayılan: `0` (zaman aşımı yok); yukarıda gösterilen `900`, yaygın olarak isteğe bağlı kullanılan bir değerdir, yerleşik varsayılan değildir.
- `announceTimeoutMs`: Gateway `agent` duyuru teslimatı denemeleri için çağrı başına zaman aşımı (milisaniye). Varsayılan: `120000`. Geçici yeniden denemeler, toplam duyuru bekleme süresini yapılandırılmış tek bir zaman aşımından daha uzun hâle getirebilir.
- `archiveAfterMinutes`: bir alt ajan oturumu tamamlandıktan sonra otomatik olarak arşivlenmesine kadar geçen dakika sayısı. Varsayılan: `60`; `0`, otomatik arşivlemeyi devre dışı bırakır.
- Alt ajan başına araç politikası: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Özel sağlayıcılar ve temel URL'ler

Sağlayıcı Plugin'leri kendi model kataloğu satırlarını yayımlar. Yapılandırmadaki `models.providers` veya `~/.openclaw/agents/<agentId>/agent/models.json` aracılığıyla özel sağlayıcılar ekleyin.

Özel/yerel bir sağlayıcının `baseUrl` değerini yapılandırmak, model HTTP istekleri için dar kapsamlı ağ güveni kararıdır: OpenClaw, ayrı bir yapılandırma seçeneği eklemeden veya diğer özel kaynaklara güvenmeden tam olarak bu `scheme://host:port` kaynağına korumalı getirme yolu üzerinden izin verir.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
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
  <Accordion title="Auth and merge precedence">
    - Özel kimlik doğrulama gereksinimleri için `authHeader: true` + `headers` kullanın.
    - Agent yapılandırma kökünü `OPENCLAW_AGENT_DIR` ile geçersiz kılın.
    - Eşleşen sağlayıcı kimlikleri için birleştirme önceliği:
      - Boş olmayan agent `models.json` `baseUrl` değerleri önceliklidir.
      - Boş olmayan agent `apiKey` değerleri yalnızca ilgili sağlayıcı geçerli yapılandırma/kimlik doğrulama profili bağlamında SecretRef tarafından yönetilmiyorsa önceliklidir.
      - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş gizli değerler kalıcılaştırılmak yerine kaynak işaretçilerinden (ortam referansları için `ENV_VAR_NAME`, dosya/çalıştırma referansları için `secretref-managed`) yenilenir.
      - SecretRef tarafından yönetilen sağlayıcı üstbilgi değerleri, kaynak işaretçilerinden (ortam referansları için `secretref-env:ENV_VAR_NAME`, dosya/çalıştırma referansları için `secretref-managed`) yenilenir.
      - Boş veya eksik agent `apiKey`/`baseUrl` değerleri, yapılandırmadaki `models.providers` değerine geri döner.
      - Eşleşen model `contextWindow`/`maxTokens` değerlerinde: açık yapılandırma değeri mevcut ve geçerliyse (pozitif, sonlu bir sayı) önceliklidir; aksi takdirde örtük/oluşturulmuş katalog değeri kullanılır.
      - Eşleşen model `contextTokens` değeri de aynı açık-değer-öncelikli-aksi-hâlde-örtük kuralını izler; yerel model meta verilerini değiştirmeden etkin bağlamı sınırlamak için bunu kullanın.
      - Sağlayıcı Plugin katalogları, agent'ın Plugin durumu altında oluşturulmuş ve Plugin'e ait katalog parçaları olarak saklanır.
      - Yapılandırmanın `models.json` dosyasını tamamen yeniden yazmasını ve Plugin'e ait katalog parçalarının birleştirilmesini atlamasını istediğinizde `models.mode: "replace"` kullanın.
      - İşaretçilerin kalıcılaştırılmasında kaynak belirleyicidir: işaretçiler, çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazılır.

  </Accordion>
</AccordionGroup>

### Sağlayıcı alanı ayrıntıları

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: sağlayıcı kataloğu davranışı (`merge` veya `replace`).
    - `models.providers`: sağlayıcı kimliğine göre anahtarlanmış özel sağlayıcı eşlemesi.
      - Güvenli düzenlemeler: eklemeli güncellemeler için `openclaw config set models.providers.<id> '<json>' --strict-json --merge` veya `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` kullanın. `--replace` iletmediğiniz sürece `config set`, yıkıcı değiştirmeleri reddeder.

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: istek bağdaştırıcısı (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). MLX, vLLM, SGLang ve OpenAI ile uyumlu çoğu yerel sunucu gibi kendi barındırdığınız `/v1/chat/completions` arka uçları için `openai-completions` kullanın. `baseUrl` içeren ancak `api` içermeyen özel bir sağlayıcı varsayılan olarak `openai-completions` kullanır; yalnızca arka uç `/v1/responses` desteği sunuyorsa `openai-responses` ayarlayın.
    - `models.providers.*.apiKey`: sağlayıcı kimlik bilgisi (SecretRef/ortam değişkeni ikamesini tercih edin).
    - `models.providers.*.auth`: kimlik doğrulama stratejisi (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: model girdisi `contextWindow` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan yerel bağlam penceresi.
    - `models.providers.*.contextTokens`: model girdisi `contextTokens` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan etkin çalışma zamanı bağlam sınırı.
    - `models.providers.*.maxTokens`: model girdisi `maxTokens` ayarlamadığında bu sağlayıcı altındaki modeller için varsayılan çıktı belirteci sınırı.
    - `models.providers.*.timeoutSeconds`: bağlantı, üstbilgiler, gövde ve toplam istek iptal işlemleri dâhil olmak üzere sağlayıcı başına isteğe bağlı model HTTP isteği zaman aşımı süresi (saniye).
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` için isteklere `options.num_ctx` ekler (varsayılan: `true`).
    - `models.providers.*.authHeader`: gerektiğinde kimlik bilgilerinin `Authorization` üstbilgisinde taşınmasını zorunlu kılar.
    - `models.providers.*.baseUrl`: üst akış API temel URL'si.
    - `models.providers.*.headers`: vekil/kiracı yönlendirmesi için ek statik üstbilgiler.

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: model sağlayıcısı HTTP istekleri için taşıma geçersiz kılmaları.

    - `request.headers`: ek üstbilgiler (sağlayıcı varsayılanlarıyla birleştirilir). Değerler SecretRef kabul eder.
    - `request.auth`: kimlik doğrulama stratejisi geçersiz kılması. Modlar: `"provider-default"` (sağlayıcının yerleşik kimlik doğrulamasını kullanır), `"authorization-bearer"` (`token` ile), `"header"` (`headerName`, `value` ve isteğe bağlı `prefix` ile).
    - `request.proxy`: HTTP vekil sunucusu geçersiz kılması. Modlar: `"env-proxy"` (`HTTP_PROXY`/`HTTPS_PROXY` ortam değişkenlerini kullanır), `"explicit-proxy"` (`url` ile). Her iki mod da isteğe bağlı bir `tls` alt nesnesini kabul eder.
    - `request.tls`: doğrudan bağlantılar için TLS geçersiz kılması. Alanlar: `ca`, `cert`, `key`, `passphrase` (tümü SecretRef kabul eder), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: `true` olduğunda, model sağlayıcısı HTTP isteklerinin sağlayıcı HTTP getirme koruması üzerinden özel, CGNAT veya benzer aralıklara erişmesine izin verir. Özel/yerel sağlayıcı temel URL'leri, açıkça etkinleştirilmedikçe engellenmeye devam eden meta veri/bağlantı-yerel kaynakları dışında, tam olarak yapılandırılmış kaynağa zaten güvenir. Tam kaynak güvenini devre dışı bırakmak için bunu `false` olarak ayarlayın. WebSocket, üstbilgiler/TLS için aynı `request` değerini kullanır ancak bu getirme SSRF geçidini kullanmaz. Varsayılan `false`.

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: açık sağlayıcı model kataloğu girdileri.
    - `models.providers.*.models.*.input`: model girdi kipleri. Yalnızca metin kullanan modeller için `["text"]`, yerel görüntü/görme modelleri için `["text", "image"]` kullanın. Görüntü ekleri, yalnızca seçilen model görüntü destekli olarak işaretlendiğinde agent turlarına eklenir.
    - `models.providers.*.models.*.contextWindow`: yerel model bağlam penceresi meta verisi. Bu değer, ilgili model için sağlayıcı düzeyindeki `contextWindow` değerini geçersiz kılar.
    - `models.providers.*.models.*.contextTokens`: isteğe bağlı çalışma zamanı bağlam sınırı. Bu değer, sağlayıcı düzeyindeki `contextTokens` değerini geçersiz kılar; modelin yerel `contextWindow` değerinden daha küçük bir etkin bağlam bütçesi istediğinizde bunu kullanın; değerler farklı olduğunda `openclaw models list` her ikisini de gösterir.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: isteğe bağlı uyumluluk ipucu. Boş olmayan, yerel olmayan bir `baseUrl` (`api.openai.com` olmayan ana makine) ile `api: "openai-completions"` kullanıldığında OpenClaw, çalışma zamanında bunu `false` olmaya zorlar. Boş/atlanmış `baseUrl`, varsayılan OpenAI davranışını korur.
    - `models.providers.*.models.*.compat.requiresStringContent`: yalnızca dize kabul eden, OpenAI ile uyumlu sohbet uç noktaları için isteğe bağlı uyumluluk ipucu. `true` olduğunda OpenClaw, isteği göndermeden önce yalnızca metin içeren `messages[].content` dizilerini düz dizelere dönüştürür.
    - `models.providers.*.models.*.compat.strictMessageKeys`: katı, OpenAI ile uyumlu sohbet uç noktaları için isteğe bağlı uyumluluk ipucu. `true` olduğunda OpenClaw, isteği göndermeden önce giden Chat Completions ileti nesnelerini `role` ve `content` alanlarıyla sınırlar.
    - `models.providers.*.models.*.compat.thinkingFormat`: isteğe bağlı düşünme yükü ipucu. Together tarzı `reasoning.enabled` için `"together"`, üst düzey `enable_thinking` için `"qwen"` veya vLLM gibi istek düzeyinde sohbet şablonu anahtar sözcük bağımsız değişkenlerini destekleyen Qwen ailesi OpenAI uyumlu sunucularda `chat_template_kwargs.enable_thinking` için `"qwen-chat-template"` kullanın. Yapılandırılmış vLLM Qwen modelleri, bu biçimler için ikili `/think` seçenekleri (`off`, `on`) sunar.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: önceki asistan iletilerinin yeniden oynatma sırasında `reasoning_content` alanını korumasını gerektiren DeepSeek tarzı Chat Completions arka uçları için isteğe bağlı uyumluluk ipucu. `true` olduğunda OpenClaw, giden asistan iletilerinde bu alanı korur. Ayıklanmış akıl yürütme sonrasında istekleri reddeden özel, DeepSeek uyumlu bir vekil bağlarken bunu kullanın. Varsayılan `false`.

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock otomatik keşif ayarlarının kökü.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: örtük keşfi açar/kapatır.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: keşif için AWS bölgesi.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: hedefli keşif için isteğe bağlı sağlayıcı kimliği filtresi.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: keşif yenilemesinin yoklama aralığı.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: keşfedilen modeller için yedek bağlam penceresi.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: keşfedilen modeller için yedek azami çıktı belirteci sayısı.

  </Accordion>
</AccordionGroup>

Etkileşimli özel sağlayıcı ilk katılımı; GPT-4o/GPT-4.1/GPT-5+, `o1`/`o3`/`o4` akıl yürütme aileleri, Claude, Gemini, `-vl` sonekli tüm kimlikler (Qwen-VL ve benzerleri) ve LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V ve GLM-4V gibi adlandırılmış aileler dâhil olmak üzere bilinen görme modeli kimliği örüntüleri için görüntü girdisini çıkarır; yalnızca metin kullandığı bilinen ailelerde (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama ve vl/vision soneki bulunmayan yalın Qwen kimlikleri) ek soruyu atlar. Bilinmeyen model kimliklerinde görüntü desteği yine sorulur. Etkileşimsiz ilk katılım aynı çıkarımı kullanır; görüntü destekli meta verileri zorunlu kılmak için `--custom-image-input`, yalnızca metin meta verilerini zorunlu kılmak için `--custom-text-input` iletin.

### Sağlayıcı örnekleri

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Resmî harici `cerebras` sağlayıcı Plugin'i bunu `openclaw onboard --auth-choice cerebras-api-key` aracılığıyla yapılandırabilir. Açık sağlayıcı yapılandırmasını yalnızca varsayılanları geçersiz kılarken kullanın.

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
    [Yerel Modeller](/tr/gateway/local-models) bölümüne bakın. Kısaca: güçlü donanımlarda LM Studio Responses API aracılığıyla büyük bir yerel model çalıştırın; geri dönüş için barındırılan modelleri birleştirilmiş olarak tutun.
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

    `MINIMAX_API_KEY` değerini ayarlayın. Kısayollar: `openclaw onboard --auth-choice minimax-global-api` veya `openclaw onboard --auth-choice minimax-cn-api`. Model kataloğu varsayılan olarak M3'ü kullanır ve M2.7 varyantlarını da içerir. Anthropic uyumlu akış yolunda OpenClaw, `thinking` değerini açıkça kendiniz ayarlamadığınız sürece MiniMax M2.x düşünme özelliğini varsayılan olarak devre dışı bırakır; MiniMax-M3 (ve M3.x) ise varsayılan olarak sağlayıcının atlanmış/uyarlanabilir düşünme yolunda kalır. `/fast on` veya `params.fastMode: true`, `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

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

    Yerel Moonshot uç noktaları, paylaşılan `openai-completions` aktarımında akış kullanım uyumluluğunu bildirir ve OpenClaw bunu yalnızca yerleşik sağlayıcı kimliğine göre değil, uç nokta yeteneklerine göre etkinleştirir.

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

    `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) değerini ayarlayın. Zen kataloğu için `opencode/...`, Go kataloğu için `opencode-go/...` başvurularını kullanın. Kısayol: `openclaw onboard --auth-choice opencode-zen` veya `openclaw onboard --auth-choice opencode-go`.

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

    Temel URL, `/v1` bölümünü içermemelidir (Anthropic istemcisi bunu ekler). Kısayol: `openclaw onboard --auth-choice synthetic-api-key`.

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

    `ZAI_API_KEY` değerini ayarlayın. Model başvuruları standart `zai/*` sağlayıcı kimliğini kullanır. Kısayol: `openclaw onboard --auth-choice zai-api-key`.

    - Genel uç nokta: `https://api.z.ai/api/paas/v4`
    - Kodlama uç noktası: `https://api.z.ai/api/coding/paas/v4`
    - Varsayılan `zai-api-key` kimlik doğrulama seçeneği anahtarınızı yoklar ve hangi uç noktaya ait olduğunu otomatik olarak algılar (algılama kesin sonuç vermezse varsayılanı Global olan bir isteme geri döner). Açık seçim için özel CN ve Coding-Plan kimlik doğrulama seçenekleri de kullanılabilir.
    - Genel uç nokta için temel URL geçersiz kılma değeriyle özel bir sağlayıcı tanımlayın.

  </Accordion>
</AccordionGroup>

---

## İlgili

- [Yapılandırma — aracılar](/tr/gateway/config-agents)
- [Yapılandırma — kanallar](/tr/gateway/config-channels)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — diğer üst düzey anahtarlar
- [Araçlar ve Plugin'ler](/tr/tools)
