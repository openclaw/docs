---
read_when:
    - OpenClaw'da Pi SDK entegrasyon tasarımını anlama
    - Pi için ajan oturumu yaşam döngüsünü, araç altyapısını veya sağlayıcı bağlantılarını değiştirme
summary: OpenClaw'ın gömülü Pi ajan entegrasyonunun ve oturum yaşam döngüsünün mimarisi
title: Pi entegrasyon mimarisi
x-i18n:
    generated_at: "2026-04-30T09:31:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b155cd5296875f2f187c68c6929c48aba27cef047f0caad74f560bcde5533e5
    source_path: pi.md
    workflow: 16
---

OpenClaw, yapay zeka ajanı yeteneklerini sağlamak için [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) ve kardeş paketleriyle (`pi-ai`, `pi-agent-core`, `pi-tui`) entegre olur.

## Genel Bakış

OpenClaw, mesajlaşma Gateway mimarisine bir yapay zeka kodlama ajanı gömmek için pi SDK'sını kullanır. OpenClaw, pi'yi bir alt süreç olarak başlatmak veya RPC modunu kullanmak yerine, pi'nin `AgentSession` öğesini `createAgentSession()` üzerinden doğrudan içe aktarır ve örnekler. Bu gömülü yaklaşım şunları sağlar:

- Oturum yaşam döngüsü ve olay işleme üzerinde tam kontrol
- Özel araç enjeksiyonu (mesajlaşma, sandbox, kanala özgü eylemler)
- Kanal/bağlam başına sistem istemi özelleştirmesi
- Dallanma/Compaction desteğiyle oturum kalıcılığı
- Yedeklemeli çok hesaplı kimlik doğrulama profili döndürme
- Sağlayıcıdan bağımsız model değiştirme

## Paket bağımlılıkları

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Paket             | Amaç                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Çekirdek LLM soyutlamaları: `Model`, `streamSimple`, ileti türleri, sağlayıcı API'leri                 |
| `pi-agent-core`   | Ajan döngüsü, araç yürütme, `AgentMessage` türleri                                                     |
| `pi-coding-agent` | Üst düzey SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, yerleşik araçlar |
| `pi-tui`          | Terminal UI bileşenleri (OpenClaw'ın yerel TUI modunda kullanılır)                                     |

## Dosya yapısı

```
src/agents/
├── pi-embedded-runner.ts          # Re-exports from pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Main entry: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Single attempt logic with session setup
│   │   ├── params.ts              # RunEmbeddedPiAgentParams type
│   │   ├── payloads.ts            # Build response payloads from run results
│   │   ├── images.ts              # Vision model image injection
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort error detection
│   ├── cache-ttl.ts               # Cache TTL tracking for context pruning
│   ├── compact.ts                 # Manual/auto compaction logic
│   ├── extensions.ts              # Load pi extensions for embedded runs
│   ├── extra-params.ts            # Provider-specific stream params
│   ├── google.ts                  # Google/Gemini turn ordering fixes
│   ├── history.ts                 # History limiting (DM vs group)
│   ├── lanes.ts                   # Session/global command lanes
│   ├── logger.ts                  # Subsystem logger
│   ├── model.ts                   # Model resolution via ModelRegistry
│   ├── runs.ts                    # Active run tracking, abort, queue
│   ├── sandbox-info.ts            # Sandbox info for system prompt
│   ├── session-manager-cache.ts   # SessionManager instance caching
│   ├── session-manager-init.ts    # Session file initialization
│   ├── system-prompt.ts           # System prompt builder
│   ├── tool-split.ts              # Split tools into builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel mapping, error description
├── pi-embedded-subscribe.ts       # Session event subscription/dispatch
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Event handler factory
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Streaming block reply chunking
├── pi-embedded-messaging.ts       # Messaging tool sent tracking
├── pi-embedded-helpers.ts         # Error classification, turn validation
├── pi-embedded-helpers/           # Helper modules
├── pi-embedded-utils.ts           # Formatting utilities
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal wrapping for tools
├── pi-tools.policy.ts             # Tool allowlist/denylist policy
├── pi-tools.read.ts               # Read tool customizations
├── pi-tools.schema.ts             # Tool schema normalization
├── pi-tools.types.ts              # AnyAgentTool type alias
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition adapter
├── pi-settings.ts                 # Settings overrides
├── pi-hooks/                      # Custom pi hooks
│   ├── compaction-safeguard.ts    # Safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL context pruning extension
│   └── context-pruning/
├── model-auth.ts                  # Auth profile resolution
├── auth-profiles.ts               # Profile store, cooldown, failover
├── model-selection.ts             # Default model resolution
├── models-config.ts               # models.json generation
├── model-catalog.ts               # Model catalog cache
├── context-window-guard.ts        # Context window validation
├── failover-error.ts              # FailoverError class
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # System prompt parameter resolution
├── system-prompt-report.ts        # Debug report generation
├── tool-summaries.ts              # Tool description summaries
├── tool-policy.ts                 # Tool policy resolution
├── transcript-policy.ts           # Transcript validation policy
├── skills.ts                      # Skill snapshot/prompt building
├── skills/                        # Skill subsystem
├── sandbox.ts                     # Sandbox context resolution
├── sandbox/                       # Sandbox subsystem
├── channel-tools.ts               # Channel-specific tool injection
├── openclaw-tools.ts              # OpenClaw-specific tools
├── bash-tools.ts                  # exec/process tools
├── apply-patch.ts                 # apply_patch tool (OpenAI)
├── tools/                         # Individual tool implementations
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
Plugin sahipliğindeki eklenti dizinlerinde bulunur; örneğin:

- Discord Plugin eylemi çalışma zamanı dosyaları
- Slack Plugin eylemi çalışma zamanı dosyası
- Telegram Plugin eylemi çalışma zamanı dosyası
- WhatsApp Plugin eylemi çalışma zamanı dosyası

## Çekirdek entegrasyon akışı

### 1. Gömülü Ajan Çalıştırma

Ana giriş noktası, `pi-embedded-runner/run.ts` içindeki `runEmbeddedPiAgent()` öğesidir:

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

### 2. Oturum Oluşturma

`runEmbeddedAttempt()` içinde (`runEmbeddedPiAgent()` tarafından çağrılır) pi SDK'sı kullanılır:

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

### 3. Olay Aboneliği

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

- `message_start` / `message_end` / `message_update` (akan metin/düşünme)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. İstem Gönderme

Kurulumdan sonra oturuma istem gönderilir:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK, LLM'ye gönderme, araç çağrılarını yürütme ve yanıtları akışla iletme dahil tam ajan döngüsünü yönetir.

Görüntü enjeksiyonu isteme özeldir: OpenClaw, geçerli istemden görüntü referanslarını yükler ve
bunları yalnızca o tur için `images` üzerinden geçirir. Görüntü yüklerini yeniden enjekte etmek için
eski geçmiş turlarını yeniden taramaz.

## Araç mimarisi

### Araç işlem hattı

1. **Temel Araçlar**: pi'nin `codingTools` araçları (read, bash, edit, write)
2. **Özel Yer Değiştirmeler**: OpenClaw, bash'i `exec`/`process` ile değiştirir; sandbox için read/edit/write öğelerini özelleştirir
3. **OpenClaw Araçları**: mesajlaşma, tarayıcı, canvas, oturumlar, Cron, Gateway vb.
4. **Kanal Araçları**: Discord/Telegram/Slack/WhatsApp'a özgü eylem araçları
5. **İlke Filtreleme**: Araçlar profile, sağlayıcıya, ajana, gruba ve sandbox ilkelerine göre filtrelenir
6. **Şema Normalleştirme**: Şemalar Gemini/OpenAI özel durumları için temizlenir
7. **AbortSignal Sarmalama**: Araçlar iptal sinyallerine uyacak şekilde sarmalanır

### Araç tanımı bağdaştırıcısı

pi-agent-core'un `AgentTool` öğesi, pi-coding-agent'ın `ToolDefinition` öğesinden farklı bir `execute` imzasına sahiptir. `pi-tool-definition-adapter.ts` içindeki bağdaştırıcı bunu köprüler:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent signature differs from pi-agent-core
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
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Bu, OpenClaw'ın ilke filtrelemesinin, sandbox entegrasyonunun ve genişletilmiş araç setinin sağlayıcılar arasında tutarlı kalmasını sağlar.

## Sistem istemi oluşturma

Sistem istemi `buildAgentSystemPrompt()` içinde (`system-prompt.ts`) oluşturulur. Tooling, Tool Call Style, Güvenlik koruma sınırları, OpenClaw CLI başvurusu, Skills, Dokümanlar, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, Runtime meta verileri ve etkinleştirildiğinde Memory ve Reactions, ayrıca isteğe bağlı bağlam dosyaları ve ek sistem istemi içeriği dahil bölümlerle tam bir istem birleştirir. Bölümler, alt ajanlar tarafından kullanılan minimal istem modu için kırpılır.

İstem, oturum oluşturulduktan sonra `applySystemPromptOverrideToSession()` aracılığıyla uygulanır:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Oturum yönetimi

### Oturum dosyaları

Oturumlar, ağaç yapısına sahip JSONL dosyalarıdır (id/parentId bağlantısı). Pi'nin `SessionManager` yapısı kalıcılığı yönetir:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw bunu araç sonucu güvenliği için `guardSessionManager()` ile sarmalar.

### Oturum önbelleğe alma

`session-manager-cache.ts`, yinelenen dosya ayrıştırmasını önlemek için SessionManager örneklerini önbelleğe alır:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Geçmişi sınırlama

`limitHistoryTurns()`, konuşma geçmişini kanal türüne göre (DM ve grup) kırpar.

### Compaction

Otomatik Compaction, bağlam taşmasında tetiklenir. Yaygın taşma imzaları arasında `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` ve `ollama error: context length exceeded` bulunur. `compactEmbeddedPiSessionDirect()` manuel Compaction işlemini yönetir:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Kimlik doğrulama ve model çözümleme

### Kimlik doğrulama profilleri

OpenClaw, sağlayıcı başına birden fazla API anahtarına sahip bir kimlik doğrulama profili deposu tutar:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profiller, başarısızlıklarda bekleme süresi takibiyle döndürülür:

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

// Uses pi's ModelRegistry and AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Yedek modele geçiş

`FailoverError`, yapılandırıldığında model yedeğine geçişi tetikler:

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

## Pi eklentileri

OpenClaw, özelleştirilmiş davranış için özel Pi eklentileri yükler:

### Compaction koruması

`src/agents/pi-hooks/compaction-safeguard.ts`, uyarlanabilir token bütçelemesi ile araç hatası ve dosya işlemi özetleri dahil olmak üzere Compaction işlemine koruma sınırları ekler:

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

`EmbeddedBlockChunker`, akış metnini ayrı yanıt bloklarına yönetir:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/Final etiketlerini ayıklama

Akış çıktısı, `<think>`/`<thinking>` bloklarını ayıklamak ve `<final>` içeriğini çıkarmak için işlenir:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Yanıt yönergeleri

`[[media:url]]`, `[[voice]]`, `[[reply:id]]` gibi yanıt yönergeleri ayrıştırılır ve çıkarılır:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Hata işleme

### Hata sınıflandırma

`pi-embedded-helpers.ts`, uygun işlem için hataları sınıflandırır:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Düşünme seviyesi yedeği

Bir düşünme seviyesi desteklenmiyorsa yedek seviyeye geçer:

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

Sandbox modu etkinleştirildiğinde araçlar ve yollar sınırlandırılır:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Use sandboxed read/edit/write tools
  // Exec runs in container
  // Browser uses bridge URL
}
```

## Sağlayıcıya özel işleme

### Anthropic

- Reddetme sihirli dizesi temizleme
- Ardışık roller için tur doğrulaması
- Sıkı yukarı akış Pi araç parametresi doğrulaması

### Google/Gemini

- Plugin sahipli araç şeması temizleme

### OpenAI

- Codex modelleri için `apply_patch` aracı
- Düşünme seviyesi düşürme işleme

## TUI Entegrasyonu

OpenClaw ayrıca pi-tui bileşenlerini doğrudan kullanan yerel bir TUI moduna sahiptir:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Bu, Pi'nin yerel moduna benzer etkileşimli terminal deneyimini sağlar.

## Pi CLI ile temel farklar

| Yön             | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Çağırma         | `pi` komutu / RPC       | `createAgentSession()` üzerinden SDK                                                           |
| Araçlar         | Varsayılan kodlama araçları | Özel OpenClaw araç paketi                                                                   |
| Sistem istemi   | AGENTS.md + istemler    | Kanal/bağlam başına dinamik                                                                    |
| Oturum depolama | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (veya `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Kimlik doğrulama | Tek kimlik bilgisi     | Döndürmeli çok profilli yapı                                                                   |
| Eklentiler      | Diskten yüklenir        | Programatik + disk yolları                                                                    |
| Olay işleme     | TUI işleme              | Geri çağırım tabanlı (onBlockReply vb.)                                                        |

## Gelecek değerlendirmeleri

Olası yeniden çalışma alanları:

1. **Araç imzası hizalaması**: Şu anda pi-agent-core ve pi-coding-agent imzaları arasında uyarlama yapılıyor
2. **Oturum yöneticisi sarmalama**: `guardSessionManager` güvenlik ekler ancak karmaşıklığı artırır
3. **Eklenti yükleme**: Pi'nin `ResourceLoader` yapısını daha doğrudan kullanabilir
4. **Akış işleyici karmaşıklığı**: `subscribeEmbeddedPiSession` büyüdü
5. **Sağlayıcı ayrıntıları**: Pi'nin potansiyel olarak ele alabileceği çok sayıda sağlayıcıya özgü kod yolu

## Testler

Pi entegrasyon kapsamı şu paketleri kapsar:

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

Geçerli çalıştırma komutları için bkz. [Pi geliştirme iş akışı](/tr/pi-dev).

## İlgili

- [Pi geliştirme iş akışı](/tr/pi-dev)
- [Kurulum genel bakışı](/tr/install)
