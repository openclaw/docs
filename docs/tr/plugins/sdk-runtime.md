---
read_when:
    - Bir eklentiden çekirdek yardımcıları çağırmanız gerekiyor (TTS, STT, görüntü üretimi, web araması, alt aracı)
    - '`api.runtime`’ın neleri kullanıma sunduğunu anlamak istiyorsunuz'
    - Eklenti kodundan yapılandırma, aracı veya medya yardımcılarına erişiyorsunuz
sidebarTitle: Runtime Helpers
summary: api.runtime -- eklentiler için kullanılabilir enjekte edilmiş çalışma zamanı yardımcıları
title: Eklenti Çalışma Zamanı Yardımcıları
x-i18n:
    generated_at: "2026-04-11T02:46:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf8a6ecd970300f784b8aca20eed40ba12c83107abd27385bfdc3347d2544be
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# Eklenti Çalışma Zamanı Yardımcıları

Kayıt sırasında her eklentiye enjekte edilen `api.runtime` nesnesi için başvuru.
Ana bilgisayar iç bileşenlerini doğrudan içe aktarmak yerine bu yardımcıları kullanın.

<Tip>
  **Adım adım bir rehber mi arıyorsunuz?** Bu yardımcıların bağlam içinde nasıl
  kullanıldığını gösteren yönergeli kılavuzlar için [Channel Plugins](/tr/plugins/sdk-channel-plugins)
  veya [Provider Plugins](/tr/plugins/sdk-provider-plugins) bölümlerine bakın.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Çalışma zamanı ad alanları

### `api.runtime.agent`

Aracı kimliği, dizinler ve oturum yönetimi.

```typescript
// Aracının çalışma dizinini çözümle
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Aracı çalışma alanını çözümle
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Aracı kimliğini al
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Varsayılan düşünme seviyesini al
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Aracı zaman aşımını al
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Çalışma alanının var olduğundan emin ol
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Gömülü bir aracı dönüşü çalıştır
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "En son değişiklikleri özetle",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)`, eklenti kodundan normal bir OpenClaw
aracı dönüşü başlatmak için nötr yardımcıdır. Kanal tetiklemeli yanıtlarla aynı
sağlayıcı/model çözümlemesini ve aracı harness seçimini kullanır.

`runEmbeddedPiAgent(...)` uyumluluk takma adı olarak kalır.

**Oturum deposu yardımcıları** `api.runtime.agent.session` altında bulunur:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Varsayılan model ve sağlayıcı sabitleri:

```typescript
const model = api.runtime.agent.defaults.model; // ör. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // ör. "anthropic"
```

### `api.runtime.subagent`

Arka plan alt aracı çalıştırmalarını başlatın ve yönetin.

```typescript
// Bir alt aracı çalıştırması başlat
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Bu sorguyu odaklı takip aramalarına genişlet.",
  provider: "openai", // isteğe bağlı geçersiz kılma
  model: "gpt-4.1-mini", // isteğe bağlı geçersiz kılma
  deliver: false,
});

// Tamamlanmasını bekle
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Oturum mesajlarını oku
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Bir oturumu sil
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Model geçersiz kılmaları (`provider`/`model`), yapılandırmada
  `plugins.entries.<id>.subagent.allowModelOverride: true` ile operatör onayı gerektirir.
  Güvenilmeyen eklentiler yine de alt aracı çalıştırabilir, ancak geçersiz kılma istekleri reddedilir.
</Warning>

### `api.runtime.taskFlow`

Bir Task Flow çalışma zamanını mevcut bir OpenClaw oturum anahtarına veya güvenilir araç
bağlamına bağlayın, ardından her çağrıda sahip bilgisi geçmeden Task Flow'lar oluşturup yönetin.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Yeni pull request'leri incele",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "PR #123'ü incele",
  status: "running",
  startedAt: Date.now(),
});

const waiting = taskFlow.setWaiting({
  flowId: created.flowId,
  expectedRevision: created.revision,
  currentStep: "await-human-reply",
  waitJson: { kind: "reply", channel: "telegram" },
});
```

Kendi bağlama katmanınızdan zaten güvenilir bir OpenClaw oturum anahtarınız varsa
`bindSession({ sessionKey, requesterOrigin })` kullanın. Ham kullanıcı girdisinden bağlama yapmayın.

### `api.runtime.tts`

Metinden sese sentezi.

```typescript
// Standart TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "OpenClaw'dan merhaba",
  cfg: api.config,
});

// Telefoni için optimize edilmiş TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "OpenClaw'dan merhaba",
  cfg: api.config,
});

// Kullanılabilir sesleri listele
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır. PCM ses
tamponu + örnekleme hızı döndürür.

### `api.runtime.mediaUnderstanding`

Görüntü, ses ve video analizi.

```typescript
// Bir görseli tanımla
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Sesi yazıya dök
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // MIME çıkarılamadığında isteğe bağlı
});

// Bir videoyu tanımla
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Genel dosya analizi
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Çıktı üretilmediğinde `{ text: undefined }` döndürür (ör. giriş atlandığında).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)`, uyumluluk takma adı olarak
  `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` için varlığını sürdürür.
</Info>

### `api.runtime.imageGeneration`

Görüntü üretimi.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "Gün batımını resmeden bir robot",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Web araması.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Düşük seviyeli medya yardımcı programları.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
```

### `api.runtime.config`

Yapılandırma yükleme ve yazma.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Sistem düzeyi yardımcı programlar.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Olay abonelikleri.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Günlükleme.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Model ve sağlayıcı auth çözümlemesi.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Durum dizini çözümleme.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Bellek aracı fabrikaları ve CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Kanala özgü çalışma zamanı yardımcıları (bir kanal eklentisi yüklendiğinde kullanılabilir).

`api.runtime.channel.mentions`, çalışma zamanı enjeksiyonu kullanan
paketli kanal eklentileri için paylaşılan gelen bahsetme ilkesi yüzeyidir:

```typescript
const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
  facts: {
    canDetectMention: true,
    wasMentioned: mentionMatch.matched,
    implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
      "reply_to_bot",
      isReplyToBot,
    ),
  },
  policy: {
    isGroup,
    requireMention,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});
```

Kullanılabilir bahsetme yardımcıları:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions`, eski
`resolveMentionGating*` uyumluluk yardımcılarını bilerek açığa çıkarmaz. Normalize edilmiş
`{ facts, policy }` yolunu tercih edin.

## Çalışma zamanı referanslarını saklama

`register` geri çağrısının dışında kullanmak için çalışma zamanı referansını saklamak üzere
`createPluginRuntimeStore` kullanın:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("my-plugin runtime not initialized");

// Giriş noktanızda
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "Eklentim",
  description: "Örnek",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// Diğer dosyalarda
export function getRuntime() {
  return store.getRuntime(); // başlatılmadıysa hata fırlatır
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // başlatılmadıysa null döndürür
}
```

## Diğer üst düzey `api` alanları

`api.runtime` dışında API nesnesi ayrıca şunları da sağlar:

| Alan                     | Tür                       | Açıklama                                                                                     |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Eklenti kimliği                                                                              |
| `api.name`               | `string`                  | Eklenti görünen adı                                                                          |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içinden eklentiye özgü yapılandırma                           |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` tam giriş öncesi hafif başlatma/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Eklenti köküne göre bir yolu çözümle                                                         |

## İlgili

- [SDK Overview](/tr/plugins/sdk-overview) -- alt yol başvurusu
- [SDK Entry Points](/tr/plugins/sdk-entrypoints) -- `definePluginEntry` seçenekleri
- [Plugin Internals](/tr/plugins/architecture) -- yetenek modeli ve kayıt defteri
