---
read_when:
    - Bir plugin'den çekirdek yardımcıları çağırmanız gerektiğinde (TTS, STT, görüntü oluşturma, web arama, alt aracı)
    - api.runtime öğesinin neleri açığa çıkardığını anlamak istediğinizde
    - plugin kodundan yapılandırma, aracı veya medya yardımcılarına erişirken
sidebarTitle: Runtime Helpers
summary: api.runtime -- kayıt sırasında plugin'lere sunulan enjekte edilmiş çalışma zamanı yardımcıları
title: Plugin Çalışma Zamanı Yardımcıları
x-i18n:
    generated_at: "2026-04-05T14:02:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667edff734fd30f9b05d55eae6360830a45ae8f3012159f88a37b5e05404e666
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# Plugin Çalışma Zamanı Yardımcıları

Kayıt sırasında her plugin'e enjekte edilen `api.runtime` nesnesi için başvuru.
Host iç detaylarını doğrudan içe aktarmak yerine bu yardımcıları kullanın.

<Tip>
  **Adım adım bir kılavuz mu arıyorsunuz?** Bu yardımcıların bağlam içinde nasıl
  kullanıldığını gösteren adım adım kılavuzlar için
  [Channel Plugins](/plugins/sdk-channel-plugins) veya
  [Provider Plugins](/plugins/sdk-provider-plugins) sayfalarına bakın.
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
// Aracının çalışma dizinini çözümleyin
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Aracı çalışma alanını çözümleyin
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Aracı kimliğini alın
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Varsayılan düşünme düzeyini alın
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Aracı zaman aşımını alın
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Çalışma alanının mevcut olduğundan emin olun
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Gömülü bir Pi aracısı çalıştırın
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedPiAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Son değişiklikleri özetle",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

**Oturum deposu yardımcıları**, `api.runtime.agent.session` altındadır:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Varsayılan model ve provider sabitleri:

```typescript
const model = api.runtime.agent.defaults.model; // ör. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // ör. "anthropic"
```

### `api.runtime.subagent`

Arka plandaki alt aracı çalıştırmalarını başlatın ve yönetin.

```typescript
// Bir alt aracı çalıştırması başlatın
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Bu sorguyu odaklı takip aramalarına genişlet.",
  provider: "openai", // isteğe bağlı geçersiz kılma
  model: "gpt-4.1-mini", // isteğe bağlı geçersiz kılma
  deliver: false,
});

// Tamamlanmasını bekleyin
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Oturum mesajlarını okuyun
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Bir oturumu silin
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Model geçersiz kılmaları (`provider`/`model`), yapılandırmada
  `plugins.entries.<id>.subagent.allowModelOverride: true` üzerinden
  operatör onayı gerektirir.
  Güvenilmeyen plugin'ler yine de alt aracılar çalıştırabilir, ancak geçersiz
  kılma istekleri reddedilir.
</Warning>

### `api.runtime.taskFlow`

Bir Task Flow çalışma zamanını mevcut bir OpenClaw oturum anahtarına veya
güvenilir araç bağlamına bağlayın, ardından her çağrıda bir sahip geçmeden Task Flow'lar oluşturun ve yönetin.

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

Kendi bağlama katmanınızdan gelen güvenilir bir OpenClaw oturum anahtarınız
zaten varsa `bindSession({ sessionKey, requesterOrigin })` kullanın. Ham
kullanıcı girdisinden bağlama yapmayın.

### `api.runtime.tts`

Metinden konuşmaya sentezi.

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

// Kullanılabilir sesleri listeleyin
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Çekirdek `messages.tts` yapılandırmasını ve provider seçimini kullanır. PCM ses
tamponu + örnekleme hızı döndürür.

### `api.runtime.mediaUnderstanding`

Görüntü, ses ve video analizi.

```typescript
// Bir görüntüyü açıklayın
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Sesi yazıya dökün
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // MIME çıkarılamadığında isteğe bağlı
});

// Bir videoyu açıklayın
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

Çıktı üretilmediğinde `{ text: undefined }` döndürür (ör. girdi atlandığında).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)`, uyumluluk diğer adı olarak
  `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` için kullanılmaya devam eder.
</Info>

### `api.runtime.imageGeneration`

Görüntü oluşturma.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "Gün batımı çizen bir robot",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Web arama.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Düşük seviyeli medya yardımcıları.

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

Sistem düzeyinde yardımcılar.

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

Model ve provider kimlik doğrulama çözümlemesi.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Durum dizini çözümlemesi.

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

Kanala özgü çalışma zamanı yardımcıları (bir channel plugin'i yüklendiğinde kullanılabilir).

## Çalışma zamanı başvurularını depolama

`register` geri çağrısı dışında kullanmak üzere çalışma zamanı başvurusunu
saklamak için `createPluginRuntimeStore` kullanın:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("my-plugin runtime not initialized");

// Giriş noktanızda
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// Diğer dosyalarda
export function getRuntime() {
  return store.getRuntime(); // başlatılmadıysa fırlatır
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // başlatılmadıysa null döndürür
}
```

## Diğer üst düzey `api` alanları

`api.runtime` ötesinde, API nesnesi ayrıca şunları sağlar:

| Alan                     | Tür                       | Açıklama                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Plugin kimliği                                                                             |
| `api.name`               | `string`                  | Plugin görünen adı                                                                         |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içinden plugin'e özgü yapılandırma                           |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                   |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif tam-giriş öncesi başlangıç/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göre göreli bir yolu çözümleyin                                              |

## İlgili

- [SDK Genel Bakış](/plugins/sdk-overview) -- alt yol başvurusu
- [SDK Giriş Noktaları](/plugins/sdk-entrypoints) -- `definePluginEntry` seçenekleri
- [Plugin İç Yapısı](/plugins/architecture) -- yetenek modeli ve kayıt defteri
