---
read_when:
    - Bir Plugin içinden çekirdek yardımcılarını çağırmanız gerekir (TTS, STT, görüntü oluşturma, web arama, alt aracı, Node’lar)
    - '`api.runtime`’ın neleri sunduğunu anlamak istiyorsunuz'
    - Plugin kodundan yapılandırma, aracı veya medya yardımcılarına erişiyorsunuz
sidebarTitle: Runtime Helpers
summary: api.runtime -- Plugin'ler için kullanılabilir enjekte edilmiş çalışma zamanı yardımcıları
title: Plugin çalışma zamanı yardımcıları
x-i18n:
    generated_at: "2026-04-24T09:23:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2327bdabc0dc1e05000ff83e507007fadff2698cceaae0d4a3e7bc4885440c55
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Kayıt sırasında her Plugin içine enjekte edilen `api.runtime` nesnesi için başvuru. Ana makine iç bileşenlerini doğrudan içe aktarmak yerine bu yardımcıları kullanın.

<Tip>
  **Ayrıntılı bir anlatım mı arıyorsunuz?** Bu yardımcıların bağlam içinde nasıl kullanıldığını adım adım gösteren kılavuzlar için [Channel Plugins](/tr/plugins/sdk-channel-plugins) veya [Provider Plugins](/tr/plugins/sdk-provider-plugins) sayfalarına bakın.
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

// Varsayılan düşünme düzeyini al
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Aracı zaman aşımını al
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Çalışma alanının var olduğundan emin ol
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Gömülü bir aracı turu çalıştır
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Summarize the latest changes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)`, Plugin kodundan normal bir OpenClaw aracı turu başlatmak için tarafsız yardımcıdır. Kanal tarafından tetiklenen yanıtlardakiyle aynı sağlayıcı/model çözümlemesini ve aracı-harness seçimini kullanır.

`runEmbeddedPiAgent(...)` uyumluluk takma adı olarak kalır.

**Oturum deposu yardımcıları** `api.runtime.agent.session` altındadır:

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
  message: "Expand this query into focused follow-up searches.",
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
  `plugins.entries.<id>.subagent.allowModelOverride: true` aracılığıyla
  operatör onayı gerektirir. Güvenilmeyen Plugin’ler yine de alt aracı
  çalıştırabilir, ancak geçersiz kılma istekleri reddedilir.
</Warning>

### `api.runtime.nodes`

Bağlı Node’ları listeleyin ve Gateway ile yüklenen Plugin kodundan bir Node ana makine komutu çağırın. Bunu, örneğin başka bir Mac üzerindeki bir tarayıcı veya ses köprüsü gibi, eşlenmiş bir cihazdaki yerel işi bir Plugin sahipleniyorsa kullanın.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

Bu çalışma zamanı yalnızca Gateway içinde kullanılabilir. Node komutları yine de normal Gateway Node eşleştirmesi, komut izin listeleri ve Node-yerel komut işleme üzerinden gider.

### `api.runtime.taskFlow`

Bir TaskFlow çalışma zamanını mevcut bir OpenClaw oturum anahtarına veya güvenilir araç bağlamına bağlayın, ardından her çağrıda bir sahip geçmeden TaskFlow’lar oluşturun ve yönetin.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Review new pull requests",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Review PR #123",
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

Kendi bağlama katmanınızdan zaten güvenilir bir OpenClaw oturum anahtarınız varsa `bindSession({ sessionKey, requesterOrigin })` kullanın. Ham kullanıcı girdisinden bağlama yapmayın.

### `api.runtime.tts`

Metinden konuşmaya sentezi.

```typescript
// Standart TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// Telefoni için optimize edilmiş TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// Kullanılabilir sesleri listele
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır. PCM ses arabelleği + örnekleme hızı döndürür.

### `api.runtime.mediaUnderstanding`

Görüntü, ses ve video analizi.

```typescript
// Bir görüntüyü açıkla
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Sesi metne dönüştür
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // isteğe bağlı, MIME çıkarılamadığında
});

// Bir videoyu açıkla
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
  `api.runtime.stt.transcribeAudioFile(...)`, `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`
  için uyumluluk takma adı olarak kalır.
</Info>

### `api.runtime.imageGeneration`

Görüntü oluşturma.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
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

Düşük düzey medya yardımcıları.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
  scale: 6, // 1-12
  marginModules: 4, // 0-16
});
const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
const tmpRoot = resolvePreferredOpenClawTmpDir();
const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
  tmpRoot,
  dirPrefix: "my-plugin-qr-",
  fileName: "qr.png",
});
```

### `api.runtime.config`

Yapılandırmayı yükleme ve yazma.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Sistem düzeyi yardımcıları.

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

Model ve sağlayıcı kimlik doğrulaması çözümlemesi.

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

Kanala özgü çalışma zamanı yardımcıları (bir kanal Plugin’i yüklendiğinde kullanılabilir).

`api.runtime.channel.mentions`, çalışma zamanı enjeksiyonu kullanan paketlenmiş kanal Plugin’leri için paylaşılan gelen mention-ilkesi yüzeyidir:

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

Kullanılabilir mention yardımcıları:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions`, eski `resolveMentionGating*` uyumluluk yardımcılarını kasıtlı olarak dışa açmaz. Normalleştirilmiş `{ facts, policy }` yolunu tercih edin.

## Çalışma zamanı başvurularını depolama

`register` geri çağrısı dışında kullanmak üzere çalışma zamanı başvurusunu depolamak için `createPluginRuntimeStore` kullanın:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

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
  return store.getRuntime(); // başlatılmadıysa hata fırlatır
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // başlatılmadıysa null döndürür
}
```

Çalışma zamanı deposu kimliği için `pluginId` tercih edin. Daha düşük düzeyli `key` biçimi, bir Plugin’in kasıtlı olarak birden fazla çalışma zamanı yuvasına ihtiyaç duyduğu nadir durumlar içindir.

## Diğer üst düzey `api` alanları

`api.runtime` dışında, API nesnesi ayrıca şunları sağlar:

| Alan                     | Tür                       | Açıklama                                                                                    |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                              |
| `api.name`               | `string`                  | Plugin görünen adı                                                                          |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (mevcut olduğunda etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içinden Plugin’e özgü yapılandırma                           |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                   |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif tam-giriş öncesi başlatma/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göre bir yolu çözümle                                                        |

## İlgili

- [SDK Overview](/tr/plugins/sdk-overview) -- alt yol başvurusu
- [SDK Entry Points](/tr/plugins/sdk-entrypoints) -- `definePluginEntry` seçenekleri
- [Plugin Internals](/tr/plugins/architecture) -- yetenek modeli ve kayıt defteri
