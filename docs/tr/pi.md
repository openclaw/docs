---
read_when:
    - OpenClaw'da Pi SDK entegrasyon tasarımını anlama
    - Pi için ajan oturum yaşam döngüsünü, araç yapısını veya sağlayıcı bağlantısını değiştirme
summary: OpenClaw'ın gömülü Pi ajan entegrasyonunun ve oturum yaşam döngüsünün mimarisi
title: Pi entegrasyon mimarisi
x-i18n:
    generated_at: "2026-04-24T09:18:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c0c490cad121a65d557a72887ea619a7d0cff34a62220752214185c9148dc0b
    source_path: pi.md
    workflow: 15
---

Bu belge, OpenClaw'ın AI ajan yeteneklerini güçlendirmek için [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) ve kardeş paketleri (`pi-ai`, `pi-agent-core`, `pi-tui`) ile nasıl entegre olduğunu açıklar.

## Genel bakış

OpenClaw, bir AI kodlama ajanını mesajlaşma gateway mimarisi içine gömmek için pi SDK'sını kullanır. Pi'yi alt süreç olarak başlatmak veya RPC modunu kullanmak yerine OpenClaw, pi'nin `AgentSession` yapısını doğrudan `createAgentSession()` aracılığıyla içe aktarır ve örnekler. Bu gömülü yaklaşım şunları sağlar:

- Oturum yaşam döngüsü ve olay işleme üzerinde tam denetim
- Özel araç enjeksiyonu (mesajlaşma, sandbox, kanala özgü eylemler)
- Kanal/bağlam başına sistem istemi özelleştirmesi
- Dallanma/Compaction destekli oturum kalıcılığı
- Failover ile çok hesaplı auth profile döndürme
- Sağlayıcıdan bağımsız model değiştirme

## Paket bağımlılıkları

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Paket              | Amaç                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `pi-ai`            | Çekirdek LLM soyutlamaları: `Model`, `streamSimple`, mesaj türleri, sağlayıcı API'leri               |
| `pi-agent-core`    | Ajan döngüsü, araç yürütme, `AgentMessage` türleri                                                    |
| `pi-coding-agent`  | Üst düzey SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, yerleşik araçlar |
| `pi-tui`           | Terminal UI bileşenleri (OpenClaw'ın yerel TUI modunda kullanılır)                                    |

## Dosya yapısı

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/ içinden yeniden dışa aktarımlar
├── pi-embedded-runner/
│   ├── run.ts                     # Ana giriş: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Oturum kurulumu ile tek deneme mantığı
│   │   ├── params.ts              # RunEmbeddedPiAgentParams türü
│   │   ├── payloads.ts            # Çalıştırma sonuçlarından yanıt payload'ları oluşturur
│   │   ├── images.ts              # Vision model görsel enjeksiyonu
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort hata algılama
│   ├── cache-ttl.ts               # Bağlam budama için önbellek TTL takibi
│   ├── compact.ts                 # Elle/otomatik Compaction mantığı
│   ├── extensions.ts              # Gömülü çalıştırmalar için pi uzantılarını yükler
│   ├── extra-params.ts            # Sağlayıcıya özgü akış parametreleri
│   ├── google.ts                  # Google/Gemini tur sıralama düzeltmeleri
│   ├── history.ts                 # Geçmiş sınırlama (DM vs grup)
│   ├── lanes.ts                   # Oturum/genel komut hatları
│   ├── logger.ts                  # Alt sistem günlükleyicisi
│   ├── model.ts                   # ModelRegistry üzerinden model çözümleme
│   ├── runs.ts                    # Etkin çalıştırma takibi, abort, kuyruk
│   ├── sandbox-info.ts            # Sistem istemi için sandbox bilgisi
│   ├── session-manager-cache.ts   # SessionManager örneği önbellekleme
│   ├── session-manager-init.ts    # Oturum dosyası başlatma
│   ├── system-prompt.ts           # Sistem istemi oluşturucu
│   ├── tool-split.ts              # Araçları builtIn ve custom olarak ayırır
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel eşleme, hata açıklaması
├── pi-embedded-subscribe.ts       # Oturum olayı aboneliği/dağıtımı
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Olay işleyici fabrikası
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Akış blok yanıtı parçalama
├── pi-embedded-messaging.ts       # Mesajlaşma aracı gönderim takibi
├── pi-embedded-helpers.ts         # Hata sınıflandırması, tur doğrulama
├── pi-embedded-helpers/           # Yardımcı modüller
├── pi-embedded-utils.ts           # Biçimlendirme yardımcıları
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Araçlar için AbortSignal sarmalama
├── pi-tools.policy.ts             # Araç izin listesi/red listesi politikası
├── pi-tools.read.ts               # Read aracı özelleştirmeleri
├── pi-tools.schema.ts             # Araç şeması normalizasyonu
├── pi-tools.types.ts              # AnyAgentTool tür takma adı
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition bağdaştırıcısı
├── pi-settings.ts                 # Ayar geçersiz kılmaları
├── pi-hooks/                      # Özel pi hook'ları
│   ├── compaction-safeguard.ts    # Safeguard uzantısı
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL bağlam budama uzantısı
│   └── context-pruning/
├── model-auth.ts                  # Auth profile çözümleme
├── auth-profiles.ts               # Profile deposu, bekleme süresi, failover
├── model-selection.ts             # Varsayılan model çözümleme
├── models-config.ts               # models.json üretimi
├── model-catalog.ts               # Model kataloğu önbelleği
├── context-window-guard.ts        # Bağlam penceresi doğrulaması
├── failover-error.ts              # FailoverError sınıfı
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Sistem istemi parametre çözümleme
├── system-prompt-report.ts        # Hata ayıklama raporu üretimi
├── tool-summaries.ts              # Araç açıklama özetleri
├── tool-policy.ts                 # Araç politikası çözümleme
├── transcript-policy.ts           # Transkript doğrulama politikası
├── skills.ts                      # Skill anlık görüntüsü/istem oluşturma
├── skills/                        # Skill alt sistemi
├── sandbox.ts                     # Sandbox bağlam çözümleme
├── sandbox/                       # Sandbox alt sistemi
├── channel-tools.ts               # Kanala özgü araç enjeksiyonu
├── openclaw-tools.ts              # OpenClaw'a özgü araçlar
├── bash-tools.ts                  # exec/process araçları
├── apply-patch.ts                 # apply_patch aracı (OpenAI)
├── tools/                         # Tekil araç uygulamaları
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

Kanala özgü mesaj eylemi çalışma zamanları artık `src/agents/tools` altında değil,
Plugin'e ait uzantı dizinlerinde yaşar; örneğin:

- Discord Plugin'i eylem çalışma zamanı dosyaları
- Slack Plugin'i eylem çalışma zamanı dosyası
- Telegram Plugin'i eylem çalışma zamanı dosyası
- WhatsApp Plugin'i eylem çalışma zamanı dosyası

## Çekirdek entegrasyon akışı

### 1. Gömülü bir ajan çalıştırma

Ana giriş noktası `pi-embedded-runner/run.ts` içindeki `runEmbeddedPiAgent()` fonksiyonudur:

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. Oturum oluşturma

`runEmbeddedPiAgent()` tarafından çağrılan `runEmbeddedAttempt()` içinde pi SDK kullanılır:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. Olay aboneliği

`subscribeEmbeddedPiSession()`, pi'nin `AgentSession` olaylarına abone olur:

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

İşlenen olaylar şunları içerir:

- `message_start` / `message_end` / `message_update` (akış metni/thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. İstem gönderme

Kurulumdan sonra oturuma istem gönderilir:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK tam ajan döngüsünü işler: LLM'ye gönderme, araç çağrılarını yürütme, yanıtları akış hâlinde iletme.

Görsel enjeksiyonu isteme özeldir: OpenClaw, geçerli istemden görsel ref'lerini yükler ve
bunları yalnızca o tur için `images` üzerinden geçirir. Eski geçmiş turlarını yeniden tarayarak
görsel payload'larını yeniden enjekte etmez.

## Araç mimarisi

### Araç işlem hattı

1. **Temel Araçlar**: pi'nin `codingTools` araçları (read, bash, edit, write)
2. **Özel Değiştirmeler**: OpenClaw, bash yerine `exec`/`process` koyar, read/edit/write araçlarını sandbox için özelleştirir
3. **OpenClaw Araçları**: mesajlaşma, browser, canvas, oturumlar, Cron, gateway vb.
4. **Kanal Araçları**: Discord/Telegram/Slack/WhatsApp'e özgü eylem araçları
5. **Politika Filtreleme**: araçlar, profile, sağlayıcı, ajan, grup, sandbox politikalarına göre filtrelenir
6. **Şema Normalizasyonu**: şemalar Gemini/OpenAI tuhaflıkları için temizlenir
7. **AbortSignal Sarmalama**: araçlar abort sinyallerine uyacak şekilde sarılır

### Araç tanımı bağdaştırıcısı

pi-agent-core içindeki `AgentTool`, pi-coding-agent içindeki `ToolDefinition` yapısından farklı bir `execute` imzasına sahiptir. `pi-tool-definition-adapter.ts` içindeki bağdaştırıcı bunu köprüler:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent imzası pi-agent-core'dan farklıdır
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Araç ayırma stratejisi

`splitSdkTools()`, tüm araçları `customTools` üzerinden geçirir:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Boş. Her şeyi biz geçersiz kılıyoruz
    customTools: toToolDefinitions(options.tools),
  };
}
```

Bu, OpenClaw'ın politika filtrelemesinin, sandbox entegrasyonunun ve genişletilmiş araç setinin sağlayıcılar arasında tutarlı kalmasını sağlar.

## Sistem istemi oluşturma

Sistem istemi, `buildAgentSystemPrompt()` içinde (`system-prompt.ts`) oluşturulur. Tooling, Tool Call Style, Safety guardrails, OpenClaw CLI reference, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, Runtime metadata bölümleri ile birlikte etkin olduğunda Memory ve Reactions bölümlerini, ayrıca isteğe bağlı bağlam dosyalarını ve ek sistem istemi içeriğini içeren tam bir istem oluşturur. Bölümler, alt ajanlar tarafından kullanılan minimal istem modu için kırpılır.

İstem, oturum oluşturulduktan sonra `applySystemPromptOverrideToSession()` ile uygulanır:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Oturum yönetimi

### Oturum dosyaları

Oturumlar, ağaç yapısına sahip JSONL dosyalarıdır (`id`/`parentId` bağlantıları). Pi'nin `SessionManager` yapısı kalıcılığı yönetir:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw bunu araç sonucu güvenliği için `guardSessionManager()` ile sarar.

### Oturum önbellekleme

`session-manager-cache.ts`, tekrar tekrar dosya ayrıştırmayı önlemek için SessionManager örneklerini önbellekler:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Geçmiş sınırlama

`limitHistoryTurns()`, kanal türüne göre (DM vs grup) konuşma geçmişini kırpar.

### Compaction

Otomatik Compaction, bağlam taşmasında tetiklenir. Yaygın taşma imzaları
şunları içerir:
`request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` ve `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()`, elle
Compaction işlemini yönetir:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Kimlik doğrulama ve model çözümleme

### Auth profile'ları

OpenClaw, sağlayıcı başına birden çok API anahtarına sahip bir auth profile deposu tutar:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile'lar, bekleme süresi takibi ile başarısızlıklarda döndürülür:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Model çözümleme

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// pi'nin ModelRegistry ve AuthStorage yapılarını kullanır
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError`, yapılandırıldığında model fallback'ini tetikler:

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Pi uzantıları

OpenClaw, özelleşmiş davranış için özel pi uzantıları yükler:

### Compaction safeguard

`src/agents/pi-hooks/compaction-safeguard.ts`, adaptif token bütçeleme ile birlikte araç hata ve dosya işlemi özetlerini de içeren korumaları Compaction'a ekler:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Bağlam budama

`src/agents/pi-hooks/context-pruning.ts`, önbellek TTL tabanlı bağlam budamayı uygular:

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## Akış ve blok yanıtları

### Blok parçalama

`EmbeddedBlockChunker`, akış hâlindeki metni ayrık yanıt bloklarına dönüştürmeyi yönetir:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/final etiket temizleme

Akış çıktısı, `<think>`/`<thinking>` bloklarını temizlemek ve `<final>` içeriğini çıkarmak için işlenir:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // <think>...</think> içeriğini temizle
  // enforceFinalTag varsa yalnızca <final>...</final> içeriğini döndür
};
```

### Yanıt yönergeleri

`[[media:url]]`, `[[voice]]`, `[[reply:id]]` gibi yanıt yönergeleri ayrıştırılır ve çıkarılır:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Hata işleme

### Hata sınıflandırma

`pi-embedded-helpers.ts`, hataları uygun işleme için sınıflandırır:

```typescript
isContextOverflowError(errorText)     // Bağlam çok büyük
isCompactionFailureError(errorText)   // Compaction başarısız oldu
isAuthAssistantError(lastAssistant)   // Auth başarısızlığı
isRateLimitAssistantError(...)        // Hız sınırı
isFailoverAssistantError(...)         // Failover yapılmalı
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking düzeyi fallback'i

Bir thinking düzeyi desteklenmiyorsa fallback uygulanır:

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## Sandbox entegrasyonu

Sandbox modu etkin olduğunda araçlar ve yollar sınırlandırılır:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Sandbox'lı read/edit/write araçlarını kullan
  // Exec container içinde çalışır
  // Browser bridge URL kullanır
}
```

## Sağlayıcıya özgü işleme

### Anthropic

- Reddetme magic string temizliği
- Art arda roller için tur doğrulama
- Sıkı yukarı akış Pi araç parametresi doğrulaması

### Google/Gemini

- Plugin'e ait araç şeması sanitize etme

### OpenAI

- Codex modelleri için `apply_patch` aracı
- Thinking düzeyi düşürme işleme

## TUI entegrasyonu

OpenClaw ayrıca doğrudan pi-tui bileşenlerini kullanan yerel bir TUI moduna da sahiptir:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Bu, pi'nin yerel moduna benzer etkileşimli terminal deneyimini sağlar.

## Pi CLI'dan temel farklar

| Yön              | Pi CLI                  | OpenClaw Embedded                                                                               |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| Çağırma          | `pi` komutu / RPC       | `createAgentSession()` üzerinden SDK                                                            |
| Araçlar          | Varsayılan kodlama araçları | Özel OpenClaw araç paketi                                                                    |
| Sistem istemi    | AGENTS.md + istemler    | Kanal/bağlam başına dinamik                                                                     |
| Oturum depolama  | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (veya `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth             | Tek kimlik bilgisi      | Döndürmeli çoklu profile                                                                        |
| Uzantılar        | Diskten yüklenir        | Programatik + disk yolları                                                                      |
| Olay işleme      | TUI render etme         | Callback tabanlı (`onBlockReply` vb.)                                                           |

## Geleceğe dönük değerlendirmeler

Olası yeniden çalışma alanları:

1. **Araç imzası hizalaması**: Şu anda pi-agent-core ile pi-coding-agent imzaları arasında bağdaştırma yapılıyor
2. **Session manager sarmalama**: `guardSessionManager` güvenlik ekler ama karmaşıklığı artırır
3. **Uzantı yükleme**: pi'nin `ResourceLoader` yapısı daha doğrudan kullanılabilir
4. **Akış işleyici karmaşıklığı**: `subscribeEmbeddedPiSession` oldukça büyüdü
5. **Sağlayıcı tuhaflıkları**: pi'nin potansiyel olarak ele alabileceği birçok sağlayıcıya özgü kod yolu var

## Testler

Pi entegrasyon kapsamı şu paketlere yayılır:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-hooks/**/*.test.ts`

Canlı/isteğe bağlı:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (`OPENCLAW_LIVE_TEST=1` ile etkinleştirin)

Geçerli çalıştırma komutları için bkz. [Pi Geliştirme İş Akışı](/tr/pi-dev).

## İlgili

- [Pi geliştirme iş akışı](/tr/pi-dev)
- [Kuruluma genel bakış](/tr/install)
