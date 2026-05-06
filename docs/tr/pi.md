---
read_when:
    - OpenClaw'da Pi SDK entegrasyon tasarımını anlama
    - Pi için aracı oturumu yaşam döngüsünü, araç altyapısını veya sağlayıcı bağlantılarını değiştirme
summary: OpenClaw'ın gömülü Pi ajan entegrasyonunun ve oturum yaşam döngüsünün mimarisi
title: Pi entegrasyon mimarisi
x-i18n:
    generated_at: "2026-05-06T09:21:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: abd9e828b0a72ac4e796f33c247bb2b5d7143ddf5e897ad9d7380cfbfce1eb64
    source_path: pi.md
    workflow: 16
---

OpenClaw, yapay zeka ajanı yeteneklerini desteklemek için [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) ve kardeş paketleriyle (`pi-ai`, `pi-agent-core`, `pi-tui`) entegre olur.

## Genel Bakış

OpenClaw, mesajlaşma Gateway mimarisine bir yapay zeka kodlama ajanı gömmek için pi SDK'sını kullanır. pi'yi bir alt süreç olarak başlatmak veya RPC modunu kullanmak yerine OpenClaw, pi'nin `AgentSession` öğesini `createAgentSession()` üzerinden doğrudan içe aktarır ve örnekler. Bu gömülü yaklaşım şunları sağlar:

- Oturum yaşam döngüsü ve olay işleme üzerinde tam denetim
- Özel araç enjeksiyonu (mesajlaşma, korumalı alan, kanala özgü eylemler)
- Kanal/bağlam başına sistem istemi özelleştirmesi
- Dallanma/Compaction desteğiyle oturum kalıcılığı
- Devretme ile çok hesaplı kimlik doğrulama profili rotasyonu
- Sağlayıcıdan bağımsız model değiştirme

## Paket bağımlılıkları

```json
{
  "@mariozechner/pi-agent-core": "0.73.0",
  "@mariozechner/pi-ai": "0.73.0",
  "@mariozechner/pi-coding-agent": "0.73.0",
  "@mariozechner/pi-tui": "0.73.0"
}
```

| Paket            | Amaç                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `pi-ai`          | Temel LLM soyutlamaları: `Model`, `streamSimple`, mesaj türleri, sağlayıcı API'leri                   |
| `pi-agent-core`  | Ajan döngüsü, araç yürütme, `AgentMessage` türleri                                                    |
| `pi-coding-agent` | Üst düzey SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, yerleşik araçlar |
| `pi-tui`         | Terminal UI bileşenleri (OpenClaw'ın yerel TUI modunda kullanılır)                                    |

## Dosya yapısı

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/ içinden yeniden dışa aktarır
├── pi-embedded-runner/
│   ├── run.ts                     # Ana giriş: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Oturum kurulumu ile tek deneme mantığı
│   │   ├── params.ts              # RunEmbeddedPiAgentParams türü
│   │   ├── payloads.ts            # Çalıştırma sonuçlarından yanıt yükleri oluşturur
│   │   ├── images.ts              # Görüntü modeli resim enjeksiyonu
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # İptal hatası algılama
│   ├── cache-ttl.ts               # Bağlam budama için önbellek TTL takibi
│   ├── compact.ts                 # Manuel/otomatik Compaction mantığı
│   ├── extensions.ts              # Gömülü çalıştırmalar için pi uzantılarını yükler
│   ├── extra-params.ts            # Sağlayıcıya özgü akış parametreleri
│   ├── google.ts                  # Google/Gemini tur sıralaması düzeltmeleri
│   ├── history.ts                 # Geçmiş sınırlama (DM ve grup)
│   ├── lanes.ts                   # Oturum/genel komut şeritleri
│   ├── logger.ts                  # Alt sistem günlükleyicisi
│   ├── model.ts                   # ModelRegistry ile model çözümleme
│   ├── runs.ts                    # Aktif çalıştırma takibi, iptal, kuyruk
│   ├── sandbox-info.ts            # Sistem istemi için korumalı alan bilgisi
│   ├── session-manager-cache.ts   # SessionManager örneği önbelleğe alma
│   ├── session-manager-init.ts    # Oturum dosyası başlatma
│   ├── system-prompt.ts           # Sistem istemi oluşturucu
│   ├── tool-split.ts              # Araçları builtIn ve custom olarak ayırır
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel eşlemesi, hata açıklaması
├── pi-embedded-subscribe.ts       # Oturum olay aboneliği/dağıtımı
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Olay işleyici fabrikası
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Akış blok yanıtı parçalama
├── pi-embedded-messaging.ts       # Mesajlaşma aracı gönderim takibi
├── pi-embedded-helpers.ts         # Hata sınıflandırma, tur doğrulama
├── pi-embedded-helpers/           # Yardımcı modüller
├── pi-embedded-utils.ts           # Biçimlendirme yardımcıları
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Araçlar için AbortSignal sarmalama
├── pi-tools.policy.ts             # Araç izin listesi/engelleme listesi politikası
├── pi-tools.read.ts               # Okuma aracı özelleştirmeleri
├── pi-tools.schema.ts             # Araç şeması normalleştirme
├── pi-tools.types.ts              # AnyAgentTool tür takma adı
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition adaptörü
├── pi-settings.ts                 # Ayar geçersiz kılmaları
├── pi-hooks/                      # Özel pi hook'ları
│   ├── compaction-safeguard.ts    # Koruma uzantısı
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL bağlam budama uzantısı
│   └── context-pruning/
├── model-auth.ts                  # Kimlik doğrulama profili çözümleme
├── auth-profiles.ts               # Profil deposu, bekleme süresi, devretme
├── model-selection.ts             # Varsayılan model çözümleme
├── models-config.ts               # models.json oluşturma
├── model-catalog.ts               # Model kataloğu önbelleği
├── context-window-guard.ts        # Bağlam penceresi doğrulama
├── failover-error.ts              # FailoverError sınıfı
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Sistem istemi parametre çözümleme
├── system-prompt-report.ts        # Hata ayıklama raporu oluşturma
├── tool-summaries.ts              # Araç açıklama özetleri
├── tool-policy.ts                 # Araç politikası çözümleme
├── transcript-policy.ts           # Transkript doğrulama politikası
├── skills.ts                      # Skill anlık görüntüsü/istem oluşturma
├── skills/                        # Skill alt sistemi
├── sandbox.ts                     # Korumalı alan bağlamı çözümleme
├── sandbox/                       # Korumalı alan alt sistemi
├── channel-tools.ts               # Kanala özgü araç enjeksiyonu
├── openclaw-tools.ts              # OpenClaw'a özgü araçlar
├── bash-tools.ts                  # exec/süreç araçları
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
Plugin sahipliğindeki uzantı dizinlerinde yaşar; örneğin:

- Discord Plugin eylemi çalışma zamanı dosyaları
- Slack Plugin eylemi çalışma zamanı dosyası
- Telegram Plugin eylemi çalışma zamanı dosyası
- WhatsApp Plugin eylemi çalışma zamanı dosyası

## Çekirdek entegrasyon akışı

### 1. Gömülü Ajan Çalıştırma

Ana giriş noktası, `pi-embedded-runner/run.ts` içindeki `runEmbeddedPiAgent()` işlevidir:

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

`runEmbeddedAttempt()` içinde (`runEmbeddedPiAgent()` tarafından çağrılır), pi SDK kullanılır:

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

- `message_start` / `message_end` / `message_update` (akışlı metin/düşünme)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. İstem Verme

Kurulumdan sonra oturuma istem verilir:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK, LLM'ye gönderme, araç çağrılarını yürütme ve yanıtları akıtma dahil tam ajan döngüsünü yönetir.

Resim enjeksiyonu isteme yereldir: OpenClaw, geçerli istemden resim referanslarını yükler ve
bunları yalnızca o tur için `images` üzerinden geçirir. Resim yüklerini yeniden enjekte etmek için
daha eski geçmiş turlarını yeniden taramaz.

## Araç mimarisi

### Araç işlem hattı

1. **Temel Araçlar**: pi'nin `codingTools` öğeleri (read, bash, edit, write)
2. **Özel Değiştirmeler**: OpenClaw, bash'i `exec`/`process` ile değiştirir; read/edit/write öğelerini korumalı alan için özelleştirir
3. **OpenClaw Araçları**: mesajlaşma, tarayıcı, canvas, oturumlar, Cron, Gateway vb.
4. **Kanal Araçları**: Discord/Telegram/Slack/WhatsApp'a özgü eylem araçları
5. **Politika Filtreleme**: Araçlar profile, sağlayıcıya, ajana, gruba ve korumalı alan politikalarına göre filtrelenir
6. **Şema Normalleştirme**: Şemalar Gemini/OpenAI ayrıntıları için temizlenir
7. **AbortSignal Sarmalama**: Araçlar, iptal sinyallerine uymak için sarmalanır

### Araç tanımı adaptörü

pi-agent-core'un `AgentTool` öğesi, pi-coding-agent'ın `ToolDefinition` öğesinden farklı bir `execute` imzasına sahiptir. `pi-tool-definition-adapter.ts` içindeki adaptör bunu köprüler:

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

Bu, OpenClaw'ın ilke filtrelemesinin, sandbox entegrasyonunun ve genişletilmiş araç kümesinin sağlayıcılar arasında tutarlı kalmasını sağlar.

## Sistem istemi oluşturma

Sistem istemi `buildAgentSystemPrompt()` içinde oluşturulur (`system-prompt.ts`). Tooling, Tool Call Style, Safety guardrails, OpenClaw CLI reference, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeat'ler, Runtime metadata ve etkinleştirildiğinde Memory ile Reactions dahil olmak üzere bölümlerden oluşan tam bir istemi birleştirir; ayrıca isteğe bağlı bağlam dosyaları ve ek sistem istemi içeriği de eklenir. Bölümler, alt ajanlar tarafından kullanılan minimal istem modu için kırpılır.

İstem, oturum oluşturulduktan sonra `applySystemPromptOverrideToSession()` ile uygulanır:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Oturum yönetimi

### Oturum dosyaları

Oturumlar, ağaç yapısına sahip JSONL dosyalarıdır (id/parentId bağlantısı). Pi'nin `SessionManager` bileşeni kalıcılığı yönetir:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw bunu araç sonucu güvenliği için `guardSessionManager()` ile sarar.

### Oturum önbelleğe alma

`session-manager-cache.ts`, tekrar tekrar dosya ayrıştırmayı önlemek için SessionManager örneklerini önbelleğe alır:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Geçmiş sınırlama

`limitHistoryTurns()`, konuşma geçmişini kanal türüne göre kırpar (DM ve grup).

### Compaction

Otomatik Compaction, bağlam taşması olduğunda tetiklenir. Yaygın taşma imzaları arasında `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` ve `ollama error: context length exceeded` bulunur. `compactEmbeddedPiSessionDirect()` manuel Compaction işlemini yönetir:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Kimlik doğrulama ve model çözümleme

### Kimlik doğrulama profilleri

OpenClaw, sağlayıcı başına birden çok API anahtarı içeren bir kimlik doğrulama profili deposu tutar:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profiller, bekleme süresi takibiyle hatalarda döndürülür:

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

### Yedekleme

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

## Pi uzantıları

OpenClaw, özel davranışlar için özel pi uzantılarını yükler:

### Compaction güvenlik önlemi

`src/agents/pi-hooks/compaction-safeguard.ts`, uyarlanabilir token bütçelemesi ile araç hatası ve dosya işlemi özetleri dahil olmak üzere Compaction için korumalar ekler:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Bağlam budama

`src/agents/pi-hooks/context-pruning.ts`, önbellek TTL tabanlı bağlam budamasını uygular:

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

## Akış ve blok yanıtlar

### Blok parçalama

`EmbeddedBlockChunker`, akan metni ayrı yanıt bloklarına yönetir:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/Final Etiketlerini Sıyırma

Akış çıktısı, `<think>`/`<thinking>` bloklarını sıyırmak ve `<final>` içeriğini çıkarmak için işlenir:

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

### Hata sınıflandırması

`pi-embedded-helpers.ts`, uygun işleme için hataları sınıflandırır:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Düşünme düzeyi yedeği

Bir düşünme düzeyi desteklenmiyorsa, yedeğe döner:

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

Sandbox modu etkinleştirildiğinde araçlar ve yollar kısıtlanır:

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

## Sağlayıcıya Özgü İşleme

### Anthropic

- Reddetme sihirli dizesini temizleme
- Ardışık roller için tur doğrulaması
- Katı üst kaynak Pi araç parametresi doğrulaması

### Google/Gemini

- Plugin tarafından sahip olunan araç şeması temizleme

### OpenAI

- Codex modelleri için `apply_patch` aracı
- Düşünme düzeyi düşürme işleme

## TUI Entegrasyonu

OpenClaw ayrıca pi-tui bileşenlerini doğrudan kullanan yerel bir TUI moduna sahiptir:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Bu, pi'nin yerel moduna benzer etkileşimli terminal deneyimini sağlar.

## Pi CLI'den temel farklar

| Boyut           | Pi CLI                  | OpenClaw Gömülü                                                                                |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Çağırma         | `pi` komutu / RPC       | `createAgentSession()` üzerinden SDK                                                           |
| Araçlar         | Varsayılan kodlama araçları | Özel OpenClaw araç paketi                                                                   |
| Sistem istemi   | AGENTS.md + istemler    | Kanal/bağlam başına dinamik                                                                    |
| Oturum depolama | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (veya `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Kimlik doğrulama | Tek kimlik bilgisi     | Döndürmeli çoklu profil                                                                        |
| Uzantılar       | Diskten yüklenir        | Programatik + disk yolları                                                                     |
| Olay işleme     | TUI işleme              | Geri çağırma tabanlı (onBlockReply vb.)                                                        |

## Gelecek değerlendirmeler

Olası yeniden çalışma alanları:

1. **Araç imzası hizalaması**: Şu anda pi-agent-core ve pi-coding-agent imzaları arasında uyarlama yapılıyor
2. **Oturum yöneticisi sarmalama**: `guardSessionManager` güvenlik ekler ancak karmaşıklığı artırır
3. **Uzantı yükleme**: Pi'nin `ResourceLoader` bileşenini daha doğrudan kullanabilir
4. **Akış işleyici karmaşıklığı**: `subscribeEmbeddedPiSession` büyüdü
5. **Sağlayıcı özellikleri**: Pi'nin potansiyel olarak yönetebileceği çok sayıda sağlayıcıya özgü kod yolu

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (`OPENCLAW_LIVE_TEST=1` etkinleştirin)

Güncel çalıştırma komutları için bkz. [Pi Geliştirme İş Akışı](/tr/pi-dev).

## İlgili

- [Pi geliştirme iş akışı](/tr/pi-dev)
- [Kurulum genel bakışı](/tr/install)
