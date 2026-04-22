---
read_when:
    - OpenClaw'da Pi SDK entegrasyon tasarımını anlama
    - Pi için aracı oturum yaşam döngüsünü, araç kullanımını veya sağlayıcı bağlantılarını değiştirme
summary: OpenClaw'un gömülü Pi aracı entegrasyonunun mimarisi ve oturum yaşam döngüsü
title: Pi Entegrasyon Mimarisi
x-i18n:
    generated_at: "2026-04-22T04:23:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ab2934958cd699b585ce57da5ac3077754d46725e74a8e604afc14d2b4ca022
    source_path: pi.md
    workflow: 15
---

# Pi Entegrasyon Mimarisi

Bu belge, OpenClaw'un AI aracı yeteneklerini güçlendirmek için [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) ve onun kardeş paketleri (`pi-ai`, `pi-agent-core`, `pi-tui`) ile nasıl entegre olduğunu açıklar.

## Genel bakış

OpenClaw, AI kodlama aracısını mesajlaşma gateway mimarisi içine gömmek için pi SDK'yı kullanır. Pi'yi bir alt süreç olarak başlatmak veya RPC modu kullanmak yerine OpenClaw, pi'nin `AgentSession` bileşenini `createAgentSession()` aracılığıyla doğrudan içe aktarır ve örnekler. Bu gömülü yaklaşım şunları sağlar:

- Oturum yaşam döngüsü ve olay işleme üzerinde tam denetim
- Özel araç enjeksiyonu (mesajlaşma, sandbox, kanala özgü eylemler)
- Kanal/bağlam başına sistem istemi özelleştirmesi
- Dallanma/Compaction desteği ile oturum kalıcılığı
- Çok hesaplı kimlik doğrulama profili döndürme ve geri dönüş
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

| Paket             | Amaç                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Çekirdek LLM soyutlamaları: `Model`, `streamSimple`, mesaj türleri, sağlayıcı API'leri                |
| `pi-agent-core`   | Aracı döngüsü, araç yürütme, `AgentMessage` türleri                                                    |
| `pi-coding-agent` | Yüksek düzey SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, yerleşik araçlar |
| `pi-tui`          | Terminal kullanıcı arayüzü bileşenleri (OpenClaw'un yerel TUI modunda kullanılır)                     |

## Dosya yapısı

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/ içinden yeniden dışa aktarımlar
├── pi-embedded-runner/
│   ├── run.ts                     # Ana giriş: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Oturum kurulumu ile tek deneme mantığı
│   │   ├── params.ts              # RunEmbeddedPiAgentParams türü
│   │   ├── payloads.ts            # Çalıştırma sonuçlarından yanıt yükleri oluşturma
│   │   ├── images.ts              # Vision model görsel enjeksiyonu
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort hata algılama
│   ├── cache-ttl.ts               # Bağlam budama için önbellek TTL izleme
│   ├── compact.ts                 # Elle/otomatik Compaction mantığı
│   ├── extensions.ts              # Gömülü çalıştırmalar için pi uzantılarını yükleme
│   ├── extra-params.ts            # Sağlayıcıya özgü akış parametreleri
│   ├── google.ts                  # Google/Gemini tur sıralama düzeltmeleri
│   ├── history.ts                 # Geçmiş sınırlama (DM ve grup)
│   ├── lanes.ts                   # Oturum/genel komut şeritleri
│   ├── logger.ts                  # Alt sistem günlükleyicisi
│   ├── model.ts                   # ModelRegistry aracılığıyla model çözümleme
│   ├── runs.ts                    # Etkin çalıştırma izleme, abort, kuyruk
│   ├── sandbox-info.ts            # Sistem istemi için sandbox bilgisi
│   ├── session-manager-cache.ts   # SessionManager örneği önbellekleme
│   ├── session-manager-init.ts    # Oturum dosyası başlatma
│   ├── system-prompt.ts           # Sistem istemi oluşturucu
│   ├── tool-split.ts              # Araçları builtIn ve custom olarak ayırma
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel eşleme, hata açıklaması
├── pi-embedded-subscribe.ts       # Oturum olay aboneliği/dağıtımı
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Olay işleyici fabrikası
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Akış blok yanıtı parçalama
├── pi-embedded-messaging.ts       # Mesajlaşma aracı gönderim izleme
├── pi-embedded-helpers.ts         # Hata sınıflandırması, tur doğrulaması
├── pi-embedded-helpers/           # Yardımcı modüller
├── pi-embedded-utils.ts           # Biçimlendirme yardımcıları
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Araçlar için AbortSignal sarmalama
├── pi-tools.policy.ts             # Araç allowlist/denylist ilkesi
├── pi-tools.read.ts               # Read aracı özelleştirmeleri
├── pi-tools.schema.ts             # Araç şeması normalleştirme
├── pi-tools.types.ts              # AnyAgentTool tür takma adı
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition bağdaştırıcısı
├── pi-settings.ts                 # Ayar geçersiz kılmaları
├── pi-hooks/                      # Özel pi hook'ları
│   ├── compaction-safeguard.ts    # Koruma uzantısı
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Önbellek-TTL bağlam budama uzantısı
│   └── context-pruning/
├── model-auth.ts                  # Kimlik doğrulama profili çözümleme
├── auth-profiles.ts               # Profil deposu, bekleme süresi, geri dönüş
├── model-selection.ts             # Varsayılan model çözümleme
├── models-config.ts               # models.json üretimi
├── model-catalog.ts               # Model kataloğu önbelleği
├── context-window-guard.ts        # Bağlam penceresi doğrulaması
├── failover-error.ts              # FailoverError sınıfı
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Sistem istemi parametre çözümlemesi
├── system-prompt-report.ts        # Hata ayıklama raporu üretimi
├── tool-summaries.ts              # Araç açıklama özetleri
├── tool-policy.ts                 # Araç ilkesi çözümleme
├── transcript-policy.ts           # Transkript doğrulama ilkesi
├── skills.ts                      # Skills anlık görüntüsü/istem oluşturma
├── skills/                        # Skills alt sistemi
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

Kanala özgü mesaj eylemi çalışma zamanları artık `src/agents/tools` altında değil, plugin'e ait uzantı
dizinlerinde bulunur; örneğin:

- Discord plugin eylem çalışma zamanı dosyaları
- Slack plugin eylem çalışma zamanı dosyası
- Telegram plugin eylem çalışma zamanı dosyası
- WhatsApp plugin eylem çalışma zamanı dosyası

## Çekirdek entegrasyon akışı

### 1. Gömülü bir aracı çalıştırma

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

- `message_start` / `message_end` / `message_update` (akış metni/düşünme)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. İstem verme

Kurulumdan sonra oturuma istem verilir:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK, tam aracı döngüsünü işler: LLM'e gönderme, araç çağrılarını yürütme, yanıtları akış olarak iletme.

Görsel enjeksiyonu isteme yereldir: OpenClaw, mevcut istemden görsel başvurularını yükler ve
bunları yalnızca o tur için `images` üzerinden iletir. Eski geçmiş turlarını yeniden tarayıp
görsel yüklerini yeniden enjekte etmez.

## Araç mimarisi

### Araç işlem hattı

1. **Temel Araçlar**: pi'nin `codingTools` araçları (`read`, `bash`, `edit`, `write`)
2. **Özel Yerine Koymalar**: OpenClaw, `bash` yerine `exec`/`process` koyar, `read`/`edit`/`write` araçlarını sandbox için özelleştirir
3. **OpenClaw Araçları**: mesajlaşma, tarayıcı, canvas, oturumlar, Cron, gateway vb.
4. **Kanal Araçları**: Discord/Telegram/Slack/WhatsApp'e özgü eylem araçları
5. **İlke Filtreleme**: Araçlar profil, sağlayıcı, aracı, grup, sandbox ilkelerine göre filtrelenir
6. **Şema Normalleştirme**: Şemalar Gemini/OpenAI tuhaflıkları için temizlenir
7. **AbortSignal Sarmalama**: Araçlar abort sinyallerine uyacak şekilde sarılır

### Araç tanımı bağdaştırıcısı

pi-agent-core içindeki `AgentTool`, pi-coding-agent içindeki `ToolDefinition` türünden farklı bir `execute` imzasına sahiptir. `pi-tool-definition-adapter.ts` içindeki bağdaştırıcı bunu köprüler:

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
    builtInTools: [], // Boş. Her şeyi geçersiz kılıyoruz
    customTools: toToolDefinitions(options.tools),
  };
}
```

Bu, OpenClaw'un ilke filtrelemesinin, sandbox entegrasyonunun ve genişletilmiş araç setinin sağlayıcılar arasında tutarlı kalmasını sağlar.

## Sistem istemi oluşturma

Sistem istemi, `buildAgentSystemPrompt()` içinde (`system-prompt.ts`) oluşturulur. Araç kullanımı, Araç Çağrısı Stili, Güvenlik korkulukları, OpenClaw CLI başvurusu, Skills, Belgeler, Çalışma Alanı, Sandbox, Mesajlaşma, Yanıt Etiketleri, Ses, Sessiz Yanıtlar, Heartbeat'ler, Çalışma zamanı meta verileri ile etkin olduğunda Memory ve Reactions bölümleri, ayrıca isteğe bağlı bağlam dosyaları ve ek sistem istemi içeriğini içeren tam bir istem derler. Alt aracılar için kullanılan en küçük istem modunda bölümler kırpılır.

İstem, oturum oluşturulduktan sonra `applySystemPromptOverrideToSession()` aracılığıyla uygulanır:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Oturum yönetimi

### Oturum dosyaları

Oturumlar, ağaç yapısına sahip (id/parentId bağlantılı) JSONL dosyalarıdır. Pi'nin `SessionManager` bileşeni kalıcılığı yönetir:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw bunu araç sonucu güvenliği için `guardSessionManager()` ile sarar.

### Oturum önbellekleme

`session-manager-cache.ts`, tekrarlanan dosya ayrıştırmayı önlemek için SessionManager örneklerini önbellekler:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Geçmiş sınırlama

`limitHistoryTurns()`, kanal türüne göre (DM ve grup) konuşma geçmişini kırpar.

### Compaction

Otomatik Compaction, bağlam taşmasında tetiklenir. Yaygın taşma imzaları
arasında `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` ve `ollama error: context
length exceeded` bulunur. `compactEmbeddedPiSessionDirect()`, elle
Compaction işlemini yürütür:

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

Profiller, bekleme süresi izleme ile hatalarda döndürülür:

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

// pi'nin ModelRegistry ve AuthStorage bileşenlerini kullanır
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Geri dönüş

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

## Pi uzantıları

OpenClaw, özelleştirilmiş davranış için özel pi uzantılarını yükler:

### Compaction koruması

`src/agents/pi-hooks/compaction-safeguard.ts`, uyarlanabilir belirteç bütçelemesi ile araç hatası ve dosya işlemi özetleri dahil olmak üzere Compaction'a korkuluklar ekler:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Bağlam budama

`src/agents/pi-hooks/context-pruning.ts`, önbellek-TTL tabanlı bağlam budamayı uygular:

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

`EmbeddedBlockChunker`, akış metnini ayrık yanıt blokları halinde yönetir:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Düşünme/nihai etiket temizleme

Akış çıktısı, `<think>`/`<thinking>` bloklarını temizlemek ve `<final>` içeriğini ayıklamak için işlenir:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // <think>...</think> içeriğini temizle
  // enforceFinalTag varsa yalnızca <final>...</final> içeriğini döndür
};
```

### Yanıt yönergeleri

`[[media:url]]`, `[[voice]]`, `[[reply:id]]` gibi yanıt yönergeleri ayrıştırılır ve ayıklanır:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Hata işleme

### Hata sınıflandırması

`pi-embedded-helpers.ts`, hataları uygun işleme için sınıflandırır:

```typescript
isContextOverflowError(errorText)     // Bağlam çok büyük
isCompactionFailureError(errorText)   // Compaction başarısız oldu
isAuthAssistantError(lastAssistant)   // Kimlik doğrulama hatası
isRateLimitAssistantError(...)        // Hız sınırına takıldı
isFailoverAssistantError(...)         // Geri dönüş yapılmalı
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Düşünme düzeyi geri dönüşü

Bir düşünme düzeyi desteklenmiyorsa geri dönüş yapılır:

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

Sandbox modu etkin olduğunda araçlar ve yollar kısıtlanır:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Sandbox'lı read/edit/write araçlarını kullan
  // Exec container içinde çalışır
  // Tarayıcı köprü URL'sini kullanır
}
```

## Sağlayıcıya özgü işleme

### Anthropic

- Ret sihirli dizesi temizleme
- Art arda roller için tur doğrulaması
- Katı upstream Pi araç parametresi doğrulaması

### Google/Gemini

- Plugin'e ait araç şeması temizleme

### OpenAI

- Codex modelleri için `apply_patch` aracı
- Düşünme düzeyi düşürme işleme

## TUI entegrasyonu

OpenClaw ayrıca pi-tui bileşenlerini doğrudan kullanan yerel bir TUI moduna da sahiptir:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Bu, pi'nin yerel moduna benzer etkileşimli terminal deneyimi sağlar.

## Pi CLI'den temel farklar

| Boyut           | Pi CLI                  | Gömülü OpenClaw                                                                                 |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Çağırma         | `pi` komutu / RPC       | `createAgentSession()` aracılığıyla SDK                                                        |
| Araçlar         | Varsayılan kodlama araçları | Özel OpenClaw araç paketi                                                                    |
| Sistem istemi   | AGENTS.md + istemler    | Kanal/bağlam başına dinamik                                                                    |
| Oturum depolama | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (veya `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Kimlik doğrulama| Tek kimlik bilgisi      | Döndürmeli çoklu profil                                                                        |
| Uzantılar       | Diskten yüklenir        | Programatik + disk yolları                                                                     |
| Olay işleme     | TUI oluşturma           | Geri çağrı tabanlı (`onBlockReply` vb.)                                                        |

## Geleceğe dönük değerlendirmeler

Olası yeniden çalışma alanları:

1. **Araç imzası hizalama**: Şu anda pi-agent-core ve pi-coding-agent imzaları arasında uyarlama yapılıyor
2. **Session manager sarmalama**: `guardSessionManager` güvenlik ekliyor ancak karmaşıklığı artırıyor
3. **Uzantı yükleme**: Pi'nin `ResourceLoader` bileşeni daha doğrudan kullanılabilir
4. **Akış işleyici karmaşıklığı**: `subscribeEmbeddedPiSession` büyüdü
5. **Sağlayıcı tuhaflıkları**: Pi'nin potansiyel olarak ele alabileceği çok sayıda sağlayıcıya özgü kod yolu var

## Testler

Pi entegrasyonu kapsamı şu test paketlerine yayılır:

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

Geçerli çalıştırma komutları için [Pi Development Workflow](/tr/pi-dev) bölümüne bakın.
