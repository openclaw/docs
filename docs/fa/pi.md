---
read_when:
    - آشنایی با طراحی یکپارچه‌سازی کیت توسعه نرم‌افزار Pi در OpenClaw
    - اصلاح چرخهٔ حیات نشست عامل، ابزارها، یا اتصال‌دهی ارائه‌دهنده برای Pi
summary: معماری یکپارچه‌سازی عامل Pi تعبیه‌شدهٔ OpenClaw و چرخهٔ حیات نشست
title: معماری یکپارچه‌سازی Pi
x-i18n:
    generated_at: "2026-05-10T19:51:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93f468416b453f4f3277406f5f40386748b7388502444266f611926cd66c96ba
    source_path: pi.md
    workflow: 16
---

OpenClaw با [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) و بسته‌های هم‌خانوادهٔ آن (`pi-ai`، `pi-agent-core`، `pi-tui`) یکپارچه می‌شود تا قابلیت‌های عامل هوش مصنوعی خود را فراهم کند.

## نمای کلی

OpenClaw از pi SDK برای嵌‌کردن یک عامل کدنویسی هوش مصنوعی در معماری Gateway پیام‌رسانی خود استفاده می‌کند. به‌جای اجرای pi به‌عنوان یک زیرفرایند یا استفاده از حالت RPC، OpenClaw مستقیماً `AgentSession` مربوط به pi را از طریق `createAgentSession()` وارد و نمونه‌سازی می‌کند. این رویکرد تعبیه‌شده این موارد را فراهم می‌کند:

- کنترل کامل بر چرخهٔ عمر نشست و مدیریت رویداد
- تزریق ابزار سفارشی (پیام‌رسانی، سندباکس، کنش‌های ویژهٔ کانال)
- سفارشی‌سازی پرامپت سیستم برای هر کانال/زمینه
- ماندگاری نشست با پشتیبانی از شاخه‌سازی/Compaction
- چرخش پروفایل احراز هویت چندحسابی با failover
- تغییر مدل مستقل از ارائه‌دهنده

## وابستگی‌های بسته

```json
{
  "@mariozechner/pi-agent-core": "0.73.0",
  "@mariozechner/pi-ai": "0.73.0",
  "@mariozechner/pi-coding-agent": "0.73.0",
  "@mariozechner/pi-tui": "0.73.0"
}
```

| بسته              | هدف                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | انتزاع‌های هستهٔ LLM: `Model`، `streamSimple`، انواع پیام، APIهای ارائه‌دهنده                           |
| `pi-agent-core`   | حلقهٔ عامل، اجرای ابزار، انواع `AgentMessage`                                                         |
| `pi-coding-agent` | SDK سطح‌بالا: `createAgentSession`، `SessionManager`، `AuthStorage`، `ModelRegistry`، ابزارهای داخلی |
| `pi-tui`          | مؤلفه‌های رابط کاربری ترمینال (در حالت TUI محلی OpenClaw استفاده می‌شود)                               |

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

اکنون زمان‌اجرای کنش‌های پیام ویژهٔ کانال به‌جای `src/agents/tools` در
دایرکتوری‌های extension متعلق به Plugin قرار دارد، برای نمونه:

- فایل‌های زمان‌اجرای کنش Plugin مربوط به Discord
- فایل زمان‌اجرای کنش Plugin مربوط به Slack
- فایل زمان‌اجرای کنش Plugin مربوط به Telegram
- فایل زمان‌اجرای کنش Plugin مربوط به WhatsApp

## جریان یکپارچه‌سازی هسته

### ۱. اجرای یک عامل تعبیه‌شده

نقطهٔ ورود اصلی `runEmbeddedPiAgent()` در `pi-embedded-runner/run.ts` است:

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

### ۲. ایجاد نشست

درون `runEmbeddedAttempt()` (که توسط `runEmbeddedPiAgent()` فراخوانی می‌شود)، از pi SDK استفاده می‌شود:

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

### ۳. اشتراک رویداد

`subscribeEmbeddedPiSession()` در رویدادهای `AgentSession` مربوط به pi مشترک می‌شود:

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

رویدادهای مدیریت‌شده شامل این مواردند:

- `message_start` / `message_end` / `message_update` (متن/تفکر جریانی)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### ۴. پرامپت‌دهی

پس از راه‌اندازی، به نشست پرامپت داده می‌شود:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK حلقهٔ کامل عامل را مدیریت می‌کند: ارسال به LLM، اجرای فراخوانی‌های ابزار، و پاسخ‌های جریانی.

تزریق تصویر محلیِ پرامپت است: OpenClaw ارجاع‌های تصویر را از پرامپت فعلی بارگذاری می‌کند و
آن‌ها را فقط برای همان نوبت از طریق `images` ارسال می‌کند. تاریخچهٔ نوبت‌های قدیمی‌تر را
برای تزریق دوبارهٔ payloadهای تصویر دوباره اسکن نمی‌کند.

## معماری ابزار

### خط لولهٔ ابزار

1. **ابزارهای پایه**: `codingTools` مربوط به pi (read، bash، edit، write)
2. **جایگزین‌های سفارشی**: OpenClaw، bash را با `exec`/`process` جایگزین می‌کند و read/edit/write را برای سندباکس سفارشی می‌کند
3. **ابزارهای OpenClaw**: پیام‌رسانی، مرورگر، canvas، نشست‌ها، cron، Gateway، و غیره
4. **ابزارهای کانال**: ابزارهای کنش ویژهٔ Discord/Telegram/Slack/WhatsApp
5. **فیلترسازی سیاست**: ابزارها بر اساس سیاست‌های پروفایل، ارائه‌دهنده، عامل، گروه، سندباکس فیلتر می‌شوند
6. **نرمال‌سازی اسکیما**: اسکیماها برای ناسازگاری‌های Gemini/OpenAI پاک‌سازی می‌شوند
7. **پیچیدن با AbortSignal**: ابزارها wrap می‌شوند تا به سیگنال‌های abort احترام بگذارند

### آداپتور تعریف ابزار

`AgentTool` مربوط به pi-agent-core امضای `execute` متفاوتی نسبت به `ToolDefinition` مربوط به pi-coding-agent دارد. آداپتور موجود در `pi-tool-definition-adapter.ts` این فاصله را پوشش می‌دهد:

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

### راهبرد تقسیم ابزار

`splitSdkTools()` همهٔ ابزارها را از طریق `customTools` ارسال می‌کند:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

این تضمین می‌کند که فیلترگذاری سیاست OpenClaw، یکپارچه‌سازی sandbox، و مجموعه ابزار توسعه‌یافته در همه providerها یکسان باقی بمانند.

## ساخت system prompt

system prompt در `buildAgentSystemPrompt()` (`system-prompt.ts`) ساخته می‌شود. این تابع یک prompt کامل را با بخش‌هایی شامل Tooling، Tool Call Style، Safety guardrails، OpenClaw Control، Skills، Docs، Workspace، Sandbox، Messaging، Assistant Output Directives، Voice، Silent Replies، Heartbeats، Runtime metadata، به‌همراه Memory و Reactions در صورت فعال بودن، و فایل‌های context اختیاری و محتوای system prompt اضافی، سرهم می‌کند. بخش‌ها برای حالت prompt حداقلی که توسط subagentها استفاده می‌شود، کوتاه‌سازی می‌شوند.

prompt پس از ایجاد session از طریق `applySystemPromptOverrideToSession()` اعمال می‌شود:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## مدیریت session

### فایل‌های session

sessionها فایل‌های JSONL با ساختار درختی هستند (پیونددهی id/parentId). `SessionManager` مربوط به Pi پایداری داده‌ها را مدیریت می‌کند:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw این را با `guardSessionManager()` برای ایمنی نتیجه ابزار بسته‌بندی می‌کند.

### کش کردن session

`session-manager-cache.ts` نمونه‌های SessionManager را کش می‌کند تا از parse مکرر فایل جلوگیری شود:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### محدودسازی history

`limitHistoryTurns()` تاریخچه گفتگو را بر اساس نوع channel (DM در برابر group) کوتاه می‌کند.

### Compaction

auto-compaction هنگام سرریز context فعال می‌شود. امضاهای رایج سرریز شامل `request_too_large`، `context length exceeded`، `input exceeds the maximum number of tokens`، `input token count exceeds the maximum number of input tokens`، `input is too long for the model`، و `ollama error: context length exceeded` هستند. `compactEmbeddedPiSessionDirect()` compaction دستی را مدیریت می‌کند:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## احراز هویت و تعیین model

### پروفایل‌های auth

OpenClaw یک مخزن auth profile با چندین API key برای هر provider نگه می‌دارد:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

profileها هنگام failure با ردیابی cooldown چرخش می‌کنند:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### تعیین model

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

### failover

`FailoverError` وقتی پیکربندی شده باشد، fallback مدل را فعال می‌کند:

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

OpenClaw افزونه‌های سفارشی Pi را برای رفتارهای تخصصی بارگذاری می‌کند:

### محافظ Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` guardrailهایی به compaction اضافه می‌کند، از جمله بودجه‌بندی adaptive token به‌همراه خلاصه‌های failure ابزار و عملیات فایل:

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

## streaming و block replyها

### قطعه‌بندی block

`EmbeddedBlockChunker` متن streaming را در blockهای پاسخ مجزا مدیریت می‌کند:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### حذف Thinking/Final Tag

خروجی streaming پردازش می‌شود تا blockهای `<think>`/`<thinking>` حذف شوند و محتوای `<final>` استخراج شود:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### دستورهای پاسخ

دستورهای پاسخ مانند `[[media:url]]`، `[[voice]]`، `[[reply:id]]` parse و استخراج می‌شوند:

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

### fallback سطح thinking

اگر یک سطح thinking پشتیبانی نشود، fallback می‌شود:

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

## یکپارچه‌سازی Sandbox

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

## مدیریت مختص provider

### Anthropic

- پاک‌سازی رشته جادویی refusal
- اعتبارسنجی turn برای roleهای متوالی
- اعتبارسنجی سخت‌گیرانه پارامتر ابزار Pi در upstream

### Google/Gemini

- پاک‌سازی schema ابزار تحت مالکیت Plugin

### OpenAI

- ابزار `apply_patch` برای modelهای Codex
- مدیریت downgrade سطح thinking

## یکپارچه‌سازی TUI

OpenClaw همچنین یک حالت TUI محلی دارد که مستقیما از کامپوننت‌های pi-tui استفاده می‌کند:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

این تجربه terminal تعاملی مشابه حالت native مربوط به Pi را فراهم می‌کند.

## تفاوت‌های کلیدی با Pi CLI

| جنبه            | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| فراخوانی        | دستور `pi` / RPC        | SDK از طریق `createAgentSession()`                                                             |
| ابزارها         | ابزارهای پیش‌فرض coding | مجموعه ابزار سفارشی OpenClaw                                                                   |
| system prompt   | AGENTS.md + promptها    | پویا بر اساس channel/context                                                                   |
| ذخیره‌سازی session | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (یا `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| auth            | یک credential           | چند profile با چرخش                                                                            |
| افزونه‌ها       | بارگذاری‌شده از disk    | برنامه‌ای + مسیرهای disk                                                                       |
| مدیریت event    | rendering در TUI        | مبتنی بر callback (onBlockReply و غیره)                                                        |

## ملاحظات آینده

حوزه‌های مناسب برای بازنگری احتمالی:

1. **هم‌ترازسازی signature ابزار**: در حال حاضر بین signatureهای pi-agent-core و pi-coding-agent سازگاری ایجاد می‌شود
2. **بسته‌بندی session manager**: `guardSessionManager` ایمنی اضافه می‌کند، اما پیچیدگی را افزایش می‌دهد
3. **بارگذاری افزونه**: می‌تواند از `ResourceLoader` مربوط به Pi مستقیم‌تر استفاده کند
4. **پیچیدگی handler streaming**: `subscribeEmbeddedPiSession` بزرگ شده است
5. **ویژگی‌های خاص provider**: codepathهای مختص provider زیادی وجود دارد که Pi احتمالا می‌تواند مدیریت کند

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

live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (فعال‌سازی با `OPENCLAW_LIVE_TEST=1`)

برای commandهای اجرای فعلی، [گردش‌کار توسعه Pi](/fa/pi-dev) را ببینید.

## مرتبط

- [گردش‌کار توسعه Pi](/fa/pi-dev)
- [نمای کلی نصب](/fa/install)
