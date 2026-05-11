---
read_when:
    - درک طراحی یکپارچه‌سازی SDKِ Pi در OpenClaw
    - تغییر چرخهٔ حیات نشست عامل، ابزارها یا اتصال‌دهی ارائه‌دهنده برای Pi
summary: معماری یکپارچه‌سازی عامل Pi تعبیه‌شدهٔ OpenClaw و چرخهٔ حیات جلسه
title: معماری یکپارچه‌سازی Pi
x-i18n:
    generated_at: "2026-05-11T20:38:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44d1f3fb0e04302f09c6259dbce8a12a0f25e345c2407162d82c7712d33d5e0a
    source_path: pi.md
    workflow: 16
---

OpenClaw با [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) و بسته‌های خواهر آن (`pi-ai`، `pi-agent-core`، `pi-tui`) یکپارچه می‌شود تا قابلیت‌های عامل هوش مصنوعی خود را فراهم کند.

## نمای کلی

OpenClaw از pi SDK برای تعبیه یک عامل کدنویسی هوش مصنوعی در معماری Gateway پیام‌رسانی خود استفاده می‌کند. به‌جای اجرای pi به‌صورت یک فرایند فرعی یا استفاده از حالت RPC، OpenClaw مستقیما `AgentSession` متعلق به pi را از طریق `createAgentSession()` وارد و نمونه‌سازی می‌کند. این رویکرد تعبیه‌شده فراهم می‌کند:

- کنترل کامل بر چرخه عمر نشست و مدیریت رویدادها
- تزریق ابزار سفارشی (پیام‌رسانی، sandbox، کنش‌های مختص کانال)
- سفارشی‌سازی اعلان سیستم برای هر کانال/زمینه
- ماندگاری نشست با پشتیبانی از شاخه‌بندی/Compaction
- چرخش پروفایل احراز هویت چندحسابی با failover
- تعویض مدل مستقل از ارائه‌دهنده

## وابستگی‌های بسته

```json
{
  "@earendil-works/pi-agent-core": "0.74.0",
  "@earendil-works/pi-ai": "0.74.0",
  "@earendil-works/pi-coding-agent": "0.74.0",
  "@earendil-works/pi-tui": "0.74.0"
}
```

| بسته              | هدف                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | انتزاع‌های اصلی LLM: `Model`، `streamSimple`، انواع پیام، APIهای ارائه‌دهنده                           |
| `pi-agent-core`   | حلقه عامل، اجرای ابزار، انواع `AgentMessage`                                                          |
| `pi-coding-agent` | SDK سطح بالا: `createAgentSession`، `SessionManager`، `AuthStorage`، `ModelRegistry`، ابزارهای داخلی |
| `pi-tui`          | مولفه‌های رابط کاربری ترمینال (در حالت TUI محلی OpenClaw استفاده می‌شود)                              |

## ساختار فایل

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

اکنون runtimeهای کنش پیام مختص کانال به‌جای `src/agents/tools` در
دایرکتوری‌های افزونه تحت مالکیت Plugin قرار دارند، برای مثال:

- فایل‌های runtime کنش Plugin متعلق به Discord
- فایل runtime کنش Plugin متعلق به Slack
- فایل runtime کنش Plugin متعلق به Telegram
- فایل runtime کنش Plugin متعلق به WhatsApp

## جریان یکپارچه‌سازی هسته

### 1. اجرای یک عامل تعبیه‌شده

نقطه ورود اصلی `runEmbeddedPiAgent()` در `pi-embedded-runner/run.ts` است:

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

### 2. ایجاد نشست

درون `runEmbeddedAttempt()` (که توسط `runEmbeddedPiAgent()` فراخوانی می‌شود)، از pi SDK استفاده می‌شود:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";

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

### 3. اشتراک رویداد

`subscribeEmbeddedPiSession()` در رویدادهای `AgentSession` متعلق به pi مشترک می‌شود:

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

رویدادهای مدیریت‌شده شامل این موارد هستند:

- `message_start` / `message_end` / `message_update` (متن/تفکر جریانی)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. اعلان‌دهی

پس از راه‌اندازی، به نشست اعلان داده می‌شود:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK حلقه کامل عامل را مدیریت می‌کند: ارسال به LLM، اجرای فراخوانی‌های ابزار، و پخش پاسخ‌ها.

تزریق تصویر محلیِ اعلان است: OpenClaw ارجاع‌های تصویر را از اعلان فعلی بارگذاری می‌کند و
آن‌ها را فقط برای همان نوبت از طریق `images` عبور می‌دهد. نوبت‌های قدیمی‌تر تاریخچه را دوباره اسکن نمی‌کند
تا payloadهای تصویر را دوباره تزریق کند.

## معماری ابزار

### خط لوله ابزار

1. **ابزارهای پایه**: `codingTools` متعلق به pi (read، bash، edit، write)
2. **جایگزین‌های سفارشی**: OpenClaw ابزار bash را با `exec`/`process` جایگزین می‌کند و read/edit/write را برای sandbox سفارشی می‌کند
3. **ابزارهای OpenClaw**: پیام‌رسانی، مرورگر، canvas، نشست‌ها، cron، Gateway و غیره.
4. **ابزارهای کانال**: ابزارهای کنش مختص Discord/Telegram/Slack/WhatsApp
5. **فیلترگذاری سیاستی**: ابزارها بر اساس سیاست‌های پروفایل، ارائه‌دهنده، عامل، گروه و sandbox فیلتر می‌شوند
6. **نرمال‌سازی schema**: schemaها برای ویژگی‌های خاص Gemini/OpenAI پاک‌سازی می‌شوند
7. **پوشش AbortSignal**: ابزارها پوشانده می‌شوند تا به سیگنال‌های لغو احترام بگذارند

### تطبیق‌دهنده تعریف ابزار

`AgentTool` متعلق به pi-agent-core امضای `execute` متفاوتی نسبت به `ToolDefinition` متعلق به pi-coding-agent دارد. تطبیق‌دهنده در `pi-tool-definition-adapter.ts` این فاصله را پر می‌کند:

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

### راهبرد جداسازی ابزار

`splitSdkTools()` همه ابزارها را از طریق `customTools` عبور می‌دهد:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

این تضمین می‌کند که فیلترگذاری سیاست، یکپارچه‌سازی sandbox، و مجموعه‌ابزار توسعه‌یافته‌ی OpenClaw در میان providerها سازگار بمانند.

## ساخت system prompt

system prompt در `buildAgentSystemPrompt()` (`system-prompt.ts`) ساخته می‌شود. این تابع یک prompt کامل را با بخش‌هایی از جمله Tooling، Tool Call Style، نرده‌های ایمنی، OpenClaw Control، Skills، Docs، Workspace، Sandbox، Messaging، Assistant Output Directives، Voice، Silent Replies، Heartbeats، فراداده‌ی Runtime، به‌همراه Memory و Reactions در صورت فعال بودن، و فایل‌های زمینه‌ای اختیاری و محتوای system prompt اضافی مونتاژ می‌کند. بخش‌ها برای حالت prompt کمینه که توسط subagentها استفاده می‌شود کوتاه می‌شوند.

prompt پس از ایجاد session از طریق `applySystemPromptOverrideToSession()` اعمال می‌شود:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## مدیریت session

### فایل‌های session

Sessionها فایل‌های JSONL با ساختار درختی هستند (پیونددهی id/parentId). `SessionManager` مربوط به Pi پایداری داده‌ها را مدیریت می‌کند:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw این را با `guardSessionManager()` برای ایمنی نتیجه‌ی ابزار wrap می‌کند.

### cache کردن session

`session-manager-cache.ts` نمونه‌های SessionManager را cache می‌کند تا از parsing تکراری فایل جلوگیری شود:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### محدودسازی history

`limitHistoryTurns()` history مکالمه را بر اساس نوع کانال (DM در برابر گروه) کوتاه می‌کند.

### Compaction

Auto-compaction هنگام overflow شدن context فعال می‌شود. امضاهای رایج overflow شامل `request_too_large`، `context length exceeded`، `input exceeds the
maximum number of tokens`، `input token count exceeds the maximum number of
input tokens`، `input is too long for the model`، و `ollama error: context
length exceeded` هستند. `compactEmbeddedPiSessionDirect()`، compaction دستی را مدیریت می‌کند:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## احراز هویت و resolve کردن model

### پروفایل‌های auth

OpenClaw یک store برای auth profileها با چند API key برای هر provider نگه می‌دارد:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profileها هنگام failure با ردیابی cooldown چرخش می‌کنند:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Resolve کردن model

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

### Failover

`FailoverError` وقتی پیکربندی شده باشد fallback مدل را فعال می‌کند:

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

## افزونه‌های Pi

OpenClaw افزونه‌های سفارشی pi را برای رفتار تخصصی بارگذاری می‌کند:

### محافظ Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` نرده‌های محافظتی را به compaction اضافه می‌کند، از جمله بودجه‌بندی adaptive token به‌همراه خلاصه‌های failure ابزار و operationهای فایل:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### هرس context

`src/agents/pi-hooks/context-pruning.ts` هرس context مبتنی بر cache-TTL را پیاده‌سازی می‌کند:

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

## Streaming و پاسخ‌های بلوکی

### قطعه‌بندی بلوک

`EmbeddedBlockChunker` متن streaming را به بلوک‌های پاسخ مجزا مدیریت می‌کند:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### حذف تگ Thinking/Final

خروجی streaming پردازش می‌شود تا بلوک‌های `<think>`/`<thinking>` حذف شوند و محتوای `<final>` استخراج شود:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### دستورالعمل‌های پاسخ

دستورالعمل‌های پاسخ مانند `[[media:url]]`، `[[voice]]`، `[[reply:id]]` parse و استخراج می‌شوند:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## مدیریت خطا

### طبقه‌بندی خطا

`pi-embedded-helpers.ts` خطاها را برای مدیریت مناسب طبقه‌بندی می‌کند:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback سطح thinking

اگر یک سطح thinking پشتیبانی نشود، fallback می‌کند:

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

## یکپارچه‌سازی sandbox

وقتی حالت sandbox فعال باشد، ابزارها و مسیرها محدود می‌شوند:

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

## مدیریت ویژه‌ی provider

### Anthropic

- پاک‌سازی magic string مربوط به refusal
- اعتبارسنجی turn برای roleهای متوالی
- اعتبارسنجی سخت‌گیرانه‌ی پارامتر ابزار upstream Pi

### Google/Gemini

- سالم‌سازی schema ابزار تحت مالکیت Plugin

### OpenAI

- ابزار `apply_patch` برای مدل‌های Codex
- مدیریت downgrade سطح thinking

## یکپارچه‌سازی TUI

OpenClaw همچنین یک حالت TUI محلی دارد که مستقیماً از کامپوننت‌های pi-tui استفاده می‌کند:

```typescript
// src/tui/tui.ts
import { ... } from "@earendil-works/pi-tui";
```

این تجربه‌ی ترمینال تعاملی مشابه حالت native در pi را فراهم می‌کند.

## تفاوت‌های کلیدی با Pi CLI

| جنبه            | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| فراخوانی        | دستور `pi` / RPC        | SDK از طریق `createAgentSession()`                                                            |
| ابزارها         | ابزارهای coding پیش‌فرض | مجموعه ابزار سفارشی OpenClaw                                                                   |
| system prompt   | AGENTS.md + promptها    | پویا برای هر کانال/context                                                                     |
| ذخیره‌سازی session | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (یا `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | credential تکی          | چند profile با rotation                                                                        |
| افزونه‌ها       | بارگذاری‌شده از disk    | مسیرهای برنامه‌نویسی‌شده + disk                                                                |
| مدیریت event    | rendering در TUI        | مبتنی بر callback (onBlockReply و غیره)                                                        |

## ملاحظات آینده

حوزه‌های دارای پتانسیل بازکاری:

1. **هم‌ترازی امضای ابزار**: در حال حاضر بین امضاهای pi-agent-core و pi-coding-agent adapter انجام می‌شود
2. **wrap کردن session manager**: `guardSessionManager` ایمنی اضافه می‌کند اما پیچیدگی را افزایش می‌دهد
3. **بارگذاری افزونه**: می‌تواند مستقیماً بیشتر از `ResourceLoader` مربوط به pi استفاده کند
4. **پیچیدگی handler مربوط به streaming**: `subscribeEmbeddedPiSession` بزرگ شده است
5. **ویژگی‌های خاص provider**: codepathهای ویژه‌ی provider زیادی وجود دارد که pi بالقوه می‌تواند مدیریت کند

## تست‌ها

پوشش یکپارچه‌سازی Pi این suiteها را در بر می‌گیرد:

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

Live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (`OPENCLAW_LIVE_TEST=1` را فعال کنید)

برای دستورهای اجرای فعلی، [گردش‌کار توسعه‌ی Pi](/fa/pi-dev) را ببینید.

## مرتبط

- [گردش‌کار توسعه‌ی Pi](/fa/pi-dev)
- [نمای کلی نصب](/fa/install)
