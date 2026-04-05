---
read_when:
    - OpenClaw içindeki Pi SDK entegrasyon tasarımını anlamak
    - Pi için ajan oturum yaşam döngüsünü, araçları veya sağlayıcı bağlantılarını değiştirmek
summary: OpenClaw'ın gömülü Pi ajan entegrasyonunun ve oturum yaşam döngüsünün mimarisi
title: Pi Entegrasyon Mimarisi
x-i18n:
    generated_at: "2026-04-05T14:00:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 596de5fbb1430008698079f211db200e02ca8485547550fd81571a459c4c83c7
    source_path: pi.md
    workflow: 15
---

# Pi Entegrasyon Mimarisi

Bu belge, OpenClaw'ın AI ajan yeteneklerini desteklemek için [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) ve onun eş paketleri olan (`pi-ai`, `pi-agent-core`, `pi-tui`) ile nasıl entegre olduğunu açıklar.

## Genel Bakış

OpenClaw, bir AI kodlama ajanını mesajlaşma ağ geçidi mimarisine gömmek için pi SDK'sını kullanır. OpenClaw, pi'yi bir alt süreç olarak başlatmak veya RPC modunu kullanmak yerine, pi'nin `AgentSession` bileşenini doğrudan içe aktarır ve `createAgentSession()` aracılığıyla örneğini oluşturur. Bu gömülü yaklaşım şunları sağlar:

- Oturum yaşam döngüsü ve olay işleme üzerinde tam denetim
- Özel araç ekleme (mesajlaşma, sandbox, kanala özgü işlemler)
- Kanal/bağlam başına sistem istemi özelleştirmesi
- Dallanma/sıkıştırma desteğiyle oturum kalıcılığı
- Hata durumunda devreye giren çok hesaplı kimlik doğrulama profili rotasyonu
- Sağlayıcıdan bağımsız model değiştirme

## Paket Bağımlılıkları

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| Paket             | Amaç                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Temel LLM soyutlamaları: `Model`, `streamSimple`, mesaj türleri, sağlayıcı API'leri                  |
| `pi-agent-core`   | Ajan döngüsü, araç yürütme, `AgentMessage` türleri                                                    |
| `pi-coding-agent` | Üst düzey SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, yerleşik araçlar |
| `pi-tui`          | Terminal UI bileşenleri (OpenClaw'ın yerel TUI modunda kullanılır)                                    |

## Dosya Yapısı

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/ içinden yeniden dışa aktarımlar
├── pi-embedded-runner/
│   ├── run.ts                     # Ana giriş: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Oturum kurulumuyla tek deneme mantığı
│   │   ├── params.ts              # RunEmbeddedPiAgentParams türü
│   │   ├── payloads.ts            # Çalıştırma sonuçlarından yanıt payload'ları oluşturur
│   │   ├── images.ts              # Görü modeli görsel ekleme
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # İptal hatası tespiti
│   ├── cache-ttl.ts               # Bağlam budama için önbellek TTL takibi
│   ├── compact.ts                 # El ile/otomatik sıkıştırma mantığı
│   ├── extensions.ts              # Gömülü çalıştırmalar için pi uzantılarını yükler
│   ├── extra-params.ts            # Sağlayıcıya özgü akış parametreleri
│   ├── google.ts                  # Google/Gemini tur sıralama düzeltmeleri
│   ├── history.ts                 # Geçmiş sınırlama (DM ile grup)
│   ├── lanes.ts                   # Oturum/genel komut şeritleri
│   ├── logger.ts                  # Alt sistem günlükleyicisi
│   ├── model.ts                   # ModelRegistry üzerinden model çözümleme
│   ├── runs.ts                    # Etkin çalıştırma takibi, iptal, kuyruk
│   ├── sandbox-info.ts            # Sistem istemi için sandbox bilgisi
│   ├── session-manager-cache.ts   # SessionManager örneği önbellekleme
│   ├── session-manager-init.ts    # Oturum dosyası başlatma
│   ├── system-prompt.ts           # Sistem istemi oluşturucu
│   ├── tool-split.ts              # Araçları builtIn ve custom olarak böler
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel eşleme, hata açıklaması
├── pi-embedded-subscribe.ts       # Oturum olayı aboneliği/gönderimi
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Olay işleyici fabrikası
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Akış blok yanıt parçalama
├── pi-embedded-messaging.ts       # Mesajlaşma aracı gönderim takibi
├── pi-embedded-helpers.ts         # Hata sınıflandırması, tur doğrulama
├── pi-embedded-helpers/           # Yardımcı modüller
├── pi-embedded-utils.ts           # Biçimlendirme yardımcıları
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Araçlar için AbortSignal sarmalama
├── pi-tools.policy.ts             # Araç izin listesi/engelleme listesi ilkesi
├── pi-tools.read.ts               # Read aracı özelleştirmeleri
├── pi-tools.schema.ts             # Araç şeması normalleştirme
├── pi-tools.types.ts              # AnyAgentTool tür takma adı
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition bağdaştırıcısı
├── pi-settings.ts                 # Ayar geçersiz kılmaları
├── pi-hooks/                      # Özel pi hook'ları
│   ├── compaction-safeguard.ts    # Koruma uzantısı
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL bağlam budama uzantısı
│   └── context-pruning/
├── model-auth.ts                  # Kimlik doğrulama profili çözümleme
├── auth-profiles.ts               # Profil deposu, bekleme süresi, hata sonrası devreye girme
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
├── tool-policy.ts                 # Araç ilkesi çözümleme
├── transcript-policy.ts           # Transkript doğrulama ilkesi
├── skills.ts                      # Skills anlık görüntüsü/istem oluşturma
├── skills/                        # Skills alt sistemi
├── sandbox.ts                     # Sandbox bağlamı çözümleme
├── sandbox/                       # Sandbox alt sistemi
├── channel-tools.ts               # Kanala özgü araç ekleme
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

Kanala özgü mesaj işlem çalışma zamanları artık `src/agents/tools` altında değil, eklentiye ait uzantı dizinlerinde bulunuyor; örneğin:

- Discord eklentisi işlem çalışma zamanı dosyaları
- Slack eklentisi işlem çalışma zamanı dosyası
- Telegram eklentisi işlem çalışma zamanı dosyası
- WhatsApp eklentisi işlem çalışma zamanı dosyası

## Temel Entegrasyon Akışı

### 1. Gömülü Bir Ajanı Çalıştırma

Ana giriş noktası, `pi-embedded-runner/run.ts` içindeki `runEmbeddedPiAgent()` işlevsidir:

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

- `message_start` / `message_end` / `message_update` (akış metni/düşünme)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `auto_compaction_start` / `auto_compaction_end`

### 4. İstem Gönderme

Kurulumdan sonra oturuma istem gönderilir:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK tam ajan döngüsünü yönetir: LLM'e gönderme, araç çağrılarını yürütme, yanıtları akış halinde iletme.

Görsel ekleme isteme özeldir: OpenClaw, mevcut istemden görsel referanslarını yükler ve bunları yalnızca o tur için `images` üzerinden geçirir. Görsel payload'larını yeniden eklemek için eski geçmiş turlarını tekrar taramaz.

## Araç Mimarisi

### Araç Hattı

1. **Temel Araçlar**: pi'nin `codingTools` araçları (`read`, `bash`, `edit`, `write`)
2. **Özel Değiştirmeler**: OpenClaw, `bash` yerine `exec`/`process` kullanır, `read`/`edit`/`write` araçlarını sandbox için özelleştirir
3. **OpenClaw Araçları**: mesajlaşma, browser, canvas, oturumlar, cron, gateway vb.
4. **Kanal Araçları**: Discord/Telegram/Slack/WhatsApp'e özgü işlem araçları
5. **İlke Filtreleme**: Araçlar profil, sağlayıcı, ajan, grup ve sandbox ilkelerine göre filtrelenir
6. **Şema Normalleştirme**: Şemalar Gemini/OpenAI tuhaflıkları için temizlenir
7. **AbortSignal Sarmalama**: Araçlar, iptal sinyallerine uyacak şekilde sarılır

### Araç Tanım Bağdaştırıcısı

pi-agent-core'un `AgentTool` türü, pi-coding-agent'ın `ToolDefinition` türünden farklı bir `execute` imzasına sahiptir. `pi-tool-definition-adapter.ts` içindeki bağdaştırıcı bu farkı köprüler:

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

### Araç Bölme Stratejisi

`splitSdkTools()`, tüm araçları `customTools` üzerinden geçirir:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Boş. Her şeyi biz geçersiz kılıyoruz
    customTools: toToolDefinitions(options.tools),
  };
}
```

Bu, OpenClaw'ın ilke filtrelemesinin, sandbox entegrasyonunun ve genişletilmiş araç setinin sağlayıcılar arasında tutarlı kalmasını sağlar.

## Sistem İstemi Oluşturma

Sistem istemi, `buildAgentSystemPrompt()` içinde (`system-prompt.ts`) oluşturulur. Araç kullanımı, Araç Çağrısı Tarzı, Güvenlik korumaları, OpenClaw CLI başvurusu, Skills, Belgeler, Çalışma Alanı, Sandbox, Mesajlaşma, Yanıt Etiketleri, Ses, Sessiz Yanıtlar, Heartbeat'ler, Çalışma zamanı meta verileri ile etkin olduğunda Bellek ve Reactions ve isteğe bağlı bağlam dosyaları ve ek sistem istemi içeriği gibi bölümlerden oluşan tam bir istem derler. Alt ajanlar için kullanılan minimal istem modunda bölümler kırpılır.

İstem, oturum oluşturulduktan sonra `applySystemPromptOverrideToSession()` aracılığıyla uygulanır:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Oturum Yönetimi

### Oturum Dosyaları

Oturumlar, ağaç yapısına sahip JSONL dosyalarıdır (`id`/`parentId` bağlantıları). Pi'nin `SessionManager` bileşeni kalıcılığı yönetir:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw bunu araç sonucu güvenliği için `guardSessionManager()` ile sarar.

### Oturum Önbellekleme

`session-manager-cache.ts`, tekrarlanan dosya ayrıştırmasını önlemek için SessionManager örneklerini önbelleğe alır:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Geçmiş Sınırlandırma

`limitHistoryTurns()`, kanal türüne göre (DM ile grup) konuşma geçmişini kırpar.

### Sıkıştırma

Bağlam taşması olduğunda otomatik sıkıştırma tetiklenir. Yaygın taşma imzaları arasında
`request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` ve `ollama error: context
length exceeded` bulunur. `compactEmbeddedPiSessionDirect()`, el ile
sıkıştırmayı yönetir:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Kimlik Doğrulama ve Model Çözümleme

### Kimlik Doğrulama Profilleri

OpenClaw, sağlayıcı başına birden fazla API anahtarı içeren bir kimlik doğrulama profili deposu tutar:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profiller, bekleme süresi takibiyle hatalarda döndürülür:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Model Çözümleme

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// pi'nin ModelRegistry ve AuthStorage bileşenlerini kullanır
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Hata Sonrası Devreye Girme

`FailoverError`, yapılandırıldığında model geri dönüşünü tetikler:

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

## Pi Uzantıları

OpenClaw, özel davranışlar için özel pi uzantıları yükler:

### Sıkıştırma Koruması

`src/agents/pi-hooks/compaction-safeguard.ts`, uyarlanabilir token bütçeleme ile araç başarısızlığı ve dosya işlemi özetleri dahil olmak üzere sıkıştırmaya korumalar ekler:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Bağlam Budama

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

## Akış ve Blok Yanıtları

### Blok Parçalama

`EmbeddedBlockChunker`, akış metnini ayrık yanıt blokları halinde yönetir:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/Final Etiketlerini Kaldırma

Akış çıktısı, `<think>`/`<thinking>` bloklarını kaldırmak ve `<final>` içeriğini çıkarmak için işlenir:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // <think>...</think> içeriğini kaldır
  // enforceFinalTag varsa yalnızca <final>...</final> içeriğini döndür
};
```

### Yanıt Yönergeleri

`[[media:url]]`, `[[voice]]`, `[[reply:id]]` gibi yanıt yönergeleri ayrıştırılır ve çıkarılır:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Hata İşleme

### Hata Sınıflandırması

`pi-embedded-helpers.ts`, uygun işleme için hataları sınıflandırır:

```typescript
isContextOverflowError(errorText)     // Bağlam çok büyük
isCompactionFailureError(errorText)   // Sıkıştırma başarısız oldu
isAuthAssistantError(lastAssistant)   // Kimlik doğrulama hatası
isRateLimitAssistantError(...)        // Hız sınırına takıldı
isFailoverAssistantError(...)         // Hata sonrası devreye girmeli
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking Seviyesi Geri Dönüşü

Bir thinking seviyesi desteklenmiyorsa geri dönüş yapılır:

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

## Sandbox Entegrasyonu

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
  // Browser köprü URL'sini kullanır
}
```

## Sağlayıcıya Özgü İşleme

### Anthropic

- Reddetme sihirli dizesinin temizlenmesi
- Ardışık roller için tur doğrulaması
- Claude Code parametre uyumluluğu

### Google/Gemini

- Eklentiye ait araç şeması temizleme

### OpenAI

- Codex modelleri için `apply_patch` aracı
- Thinking seviyesi düşürme işleme

## TUI Entegrasyonu

OpenClaw ayrıca doğrudan pi-tui bileşenlerini kullanan yerel bir TUI moduna da sahiptir:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Bu, pi'nin yerel moduna benzer etkileşimli terminal deneyimini sağlar.

## Pi CLI'dan Temel Farklar

| Özellik        | Pi CLI                  | OpenClaw Embedded                                                                                 |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| Çağırma        | `pi` komutu / RPC       | `createAgentSession()` üzerinden SDK                                                              |
| Araçlar        | Varsayılan kodlama araçları | Özel OpenClaw araç paketi                                                                       |
| Sistem istemi  | AGENTS.md + istemler    | Kanal/bağlam başına dinamik                                                                       |
| Oturum depolama | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (veya `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Kimlik doğrulama | Tek kimlik bilgisi    | Döndürmeli çoklu profil                                                                           |
| Uzantılar      | Diskten yüklenir        | Programatik + disk yolları                                                                        |
| Olay işleme    | TUI oluşturma           | Geri çağırım tabanlı (`onBlockReply` vb.)                                                         |

## Geleceğe Yönelik Değerlendirmeler

Olası yeniden çalışma alanları:

1. **Araç imzası hizalaması**: Şu anda pi-agent-core ve pi-coding-agent imzaları arasında uyarlama yapılıyor
2. **Session manager sarmalama**: `guardSessionManager` güvenlik ekliyor ancak karmaşıklığı artırıyor
3. **Uzantı yükleme**: pi'nin `ResourceLoader` bileşeni daha doğrudan kullanılabilir
4. **Akış işleyici karmaşıklığı**: `subscribeEmbeddedPiSession` büyüdü
5. **Sağlayıcı tuhaflıkları**: pi'nin potansiyel olarak ele alabileceği birçok sağlayıcıya özgü kod yolu var

## Testler

Pi entegrasyon kapsamı şu paketleri içerir:

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

Geçerli çalıştırma komutları için bkz. [Pi Geliştirme İş Akışı](/tr/pi-dev).
