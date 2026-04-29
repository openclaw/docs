---
read_when:
    - درک طراحی یکپارچه‌سازی Pi SDK در OpenClaw
    - تغییر چرخهٔ حیات نشست عامل، ابزارها یا اتصال ارائه‌دهنده برای Pi
summary: معماری یکپارچه‌سازی عامل Pi تعبیه‌شدهٔ OpenClaw و چرخهٔ حیات نشست
title: معماری یکپارچه‌سازی Pi
x-i18n:
    generated_at: "2026-04-29T23:09:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b155cd5296875f2f187c68c6929c48aba27cef047f0caad74f560bcde5533e5
    source_path: pi.md
    workflow: 16
---

OpenClaw با [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) و بسته‌های هم‌خانوادهٔ آن (`pi-ai`، `pi-agent-core`، `pi-tui`) یکپارچه می‌شود تا قابلیت‌های عامل هوش مصنوعی خود را فراهم کند.

## نمای کلی

OpenClaw از SDK مربوط به pi استفاده می‌کند تا یک عامل کدنویسی هوش مصنوعی را در معماری Gateway پیام‌رسانی خود جاسازی کند. به‌جای اجرای pi به‌عنوان زیرفرایند یا استفاده از حالت RPC، OpenClaw مستقیما `AgentSession` مربوط به pi را از طریق `createAgentSession()` وارد و نمونه‌سازی می‌کند. این رویکرد جاسازی‌شده فراهم می‌کند:

- کنترل کامل بر چرخهٔ عمر نشست و مدیریت رویداد
- تزریق ابزار سفارشی (پیام‌رسانی، sandbox، کنش‌های مخصوص کانال)
- سفارشی‌سازی پرامپت سیستم برای هر کانال/زمینه
- ماندگاری نشست با پشتیبانی از شاخه‌سازی/Compaction
- چرخش پروفایل احراز هویت چندحسابی همراه با failover
- تغییر مدل مستقل از ارائه‌دهنده

## وابستگی‌های بسته

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| بسته              | هدف                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | انتزاع‌های اصلی LLM: `Model`، `streamSimple`، انواع پیام، APIهای ارائه‌دهنده                           |
| `pi-agent-core`   | حلقهٔ عامل، اجرای ابزار، انواع `AgentMessage`                                                          |
| `pi-coding-agent` | SDK سطح‌بالا: `createAgentSession`، `SessionManager`، `AuthStorage`، `ModelRegistry`، ابزارهای داخلی |
| `pi-tui`          | مؤلفه‌های رابط کاربری ترمینال (استفاده‌شده در حالت TUI محلی OpenClaw)                                  |

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

runtimeهای کنش پیام مخصوص کانال اکنون به‌جای زیر `src/agents/tools`، در دایرکتوری‌های افزونهٔ متعلق به Plugin قرار دارند، برای نمونه:

- فایل‌های runtime کنش Plugin مربوط به Discord
- فایل runtime کنش Plugin مربوط به Slack
- فایل runtime کنش Plugin مربوط به Telegram
- فایل runtime کنش Plugin مربوط به WhatsApp

## جریان یکپارچه‌سازی هسته

### 1. اجرای یک عامل جاسازی‌شده

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

### 2. ایجاد نشست

درون `runEmbeddedAttempt()` (که توسط `runEmbeddedPiAgent()` فراخوانی می‌شود)، از SDK مربوط به pi استفاده می‌شود:

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

### 3. اشتراک رویداد

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

رویدادهای مدیریت‌شده شامل این موارد هستند:

- `message_start` / `message_end` / `message_update` (متن/تفکر جریانی)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. پرامپت‌دهی

پس از راه‌اندازی، نشست پرامپت می‌شود:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK حلقهٔ کامل عامل را مدیریت می‌کند: ارسال به LLM، اجرای فراخوانی‌های ابزار، و جریان‌دهی پاسخ‌ها.

تزریق تصویر مخصوص پرامپت است: OpenClaw ارجاع‌های تصویر را از پرامپت فعلی بارگذاری می‌کند و آن‌ها را فقط برای همان نوبت از طریق `images` عبور می‌دهد. این کار نوبت‌های قدیمی‌تر تاریخچه را دوباره اسکن نمی‌کند تا payloadهای تصویر را دوباره تزریق کند.

## معماری ابزار

### خط لولهٔ ابزار

1. **ابزارهای پایه**: `codingTools` مربوط به pi (read، bash، edit، write)
2. **جایگزین‌های سفارشی**: OpenClaw ابزار bash را با `exec`/`process` جایگزین می‌کند و read/edit/write را برای sandbox سفارشی می‌کند
3. **ابزارهای OpenClaw**: پیام‌رسانی، مرورگر، canvas، نشست‌ها، Cron، Gateway و غیره
4. **ابزارهای کانال**: ابزارهای کنش مخصوص Discord/Telegram/Slack/WhatsApp
5. **پالایش سیاست**: ابزارها بر اساس پروفایل، ارائه‌دهنده، عامل، گروه، و سیاست‌های sandbox پالایش می‌شوند
6. **نرمال‌سازی schema**: schemaها برای ویژگی‌های خاص Gemini/OpenAI پاک‌سازی می‌شوند
7. **پوشش AbortSignal**: ابزارها پوشش داده می‌شوند تا به سیگنال‌های لغو احترام بگذارند

### آداپتر تعریف ابزار

`AgentTool` مربوط به pi-agent-core امضای `execute` متفاوتی با `ToolDefinition` مربوط به pi-coding-agent دارد. آداپتر موجود در `pi-tool-definition-adapter.ts` این دو را به هم متصل می‌کند:

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

`splitSdkTools()` همهٔ ابزارها را از طریق `customTools` عبور می‌دهد:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

این تضمین می‌کند که فیلترگذاری خط‌مشی، یکپارچه‌سازی sandbox، و مجموعه ابزار توسعه‌یافته OpenClaw در میان ارائه‌دهنده‌ها سازگار باقی بماند.

## ساخت پرامپت سیستمی

پرامپت سیستمی در `buildAgentSystemPrompt()` (`system-prompt.ts`) ساخته می‌شود. این تابع یک پرامپت کامل را با بخش‌هایی شامل ابزارها، سبک فراخوانی ابزار، حفاظ‌های ایمنی، مرجع OpenClaw CLI، Skills، مستندات، فضای کاری، Sandbox، پیام‌رسانی، برچسب‌های پاسخ، صدا، پاسخ‌های بی‌صدا، Heartbeatها، فراداده زمان اجرا، به‌علاوه Memory و Reactions در صورت فعال بودن، و فایل‌های زمینه‌ای اختیاری و محتوای پرامپت سیستمی اضافی مونتاژ می‌کند. بخش‌ها برای حالت پرامپت حداقلی که توسط زیرعامل‌ها استفاده می‌شود کوتاه‌سازی می‌شوند.

پرامپت پس از ایجاد نشست از طریق `applySystemPromptOverrideToSession()` اعمال می‌شود:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## مدیریت نشست

### فایل‌های نشست

نشست‌ها فایل‌های JSONL با ساختار درختی هستند (اتصال id/parentId). `SessionManager` در Pi ماندگاری را مدیریت می‌کند:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw این را با `guardSessionManager()` برای ایمنی نتیجه ابزار پوشش می‌دهد.

### کش نشست

`session-manager-cache.ts` نمونه‌های SessionManager را برای جلوگیری از تجزیه مکرر فایل کش می‌کند:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### محدودسازی تاریخچه

`limitHistoryTurns()` تاریخچه گفت‌وگو را بر اساس نوع کانال (پیام مستقیم در برابر گروه) کوتاه می‌کند.

### Compaction

Compaction خودکار هنگام سرریز زمینه فعال می‌شود. امضاهای رایج سرریز شامل `request_too_large`، `context length exceeded`، `input exceeds the maximum number of tokens`، `input token count exceeds the maximum number of input tokens`، `input is too long for the model`، و `ollama error: context length exceeded` هستند. `compactEmbeddedPiSessionDirect()` Compaction دستی را مدیریت می‌کند:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## احراز هویت و تعیین مدل

### پروفایل‌های احراز هویت

OpenClaw یک ذخیره‌گاه پروفایل احراز هویت با چندین کلید API برای هر ارائه‌دهنده نگه می‌دارد:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

پروفایل‌ها هنگام شکست با رهگیری دوره آرام‌سازی چرخش می‌کنند:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### تعیین مدل

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

`FailoverError` در صورت پیکربندی، بازگشت به مدل جایگزین را فعال می‌کند:

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

### حفاظت Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` حفاظ‌هایی را به Compaction اضافه می‌کند، از جمله بودجه‌بندی تطبیقی توکن به‌علاوه خلاصه‌های شکست ابزار و عملیات فایل:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### هرس زمینه

`src/agents/pi-hooks/context-pruning.ts` هرس زمینه مبتنی بر cache-TTL را پیاده‌سازی می‌کند:

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

## استریم و پاسخ‌های بلوکی

### قطعه‌بندی بلوک

`EmbeddedBlockChunker` استریم متن را به بلوک‌های پاسخ مجزا مدیریت می‌کند:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### حذف برچسب Thinking/Final

خروجی استریم برای حذف بلوک‌های `<think>`/`<thinking>` و استخراج محتوای `<final>` پردازش می‌شود:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### دستورهای پاسخ

دستورهای پاسخ مانند `[[media:url]]`، `[[voice]]`، `[[reply:id]]` تجزیه و استخراج می‌شوند:

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

### بازگشت سطح Thinking

اگر یک سطح thinking پشتیبانی نشود، به سطح جایگزین برمی‌گردد:

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

## مدیریت ویژه ارائه‌دهنده

### Anthropic

- پاک‌سازی رشته جادویی امتناع
- اعتبارسنجی نوبت برای نقش‌های پیاپی
- اعتبارسنجی سخت‌گیرانه پارامتر ابزار Pi بالادستی

### Google/Gemini

- پاک‌سازی شِمای ابزار متعلق به Plugin

### OpenAI

- ابزار `apply_patch` برای مدل‌های Codex
- مدیریت کاهش سطح Thinking

## یکپارچه‌سازی TUI

OpenClaw همچنین یک حالت TUI محلی دارد که مستقیماً از مؤلفه‌های pi-tui استفاده می‌کند:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

این تجربه ترمینال تعاملی مشابه حالت بومی pi را فراهم می‌کند.

## تفاوت‌های کلیدی با Pi CLI

| جنبه            | Pi CLI                  | OpenClaw توکار                                                                                 |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| فراخوانی        | دستور `pi` / RPC        | SDK از طریق `createAgentSession()`                                                             |
| ابزارها         | ابزارهای کدنویسی پیش‌فرض | مجموعه ابزار سفارشی OpenClaw                                                                   |
| پرامپت سیستمی   | AGENTS.md + پرامپت‌ها   | پویا برای هر کانال/زمینه                                                                       |
| ذخیره نشست      | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (یا `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| احراز هویت      | یک اعتبارنامه           | چندپروفایلی با چرخش                                                                            |
| افزونه‌ها       | بارگذاری‌شده از دیسک    | برنامه‌نویسی‌شده + مسیرهای دیسک                                                                |
| مدیریت رویداد   | رندر TUI                | مبتنی بر callback (onBlockReply و غیره)                                                        |

## ملاحظات آینده

حوزه‌های بازکاری احتمالی:

1. **هم‌ترازی امضای ابزار**: در حال حاضر بین امضاهای pi-agent-core و pi-coding-agent تطبیق انجام می‌شود
2. **پوشش مدیر نشست**: `guardSessionManager` ایمنی اضافه می‌کند اما پیچیدگی را افزایش می‌دهد
3. **بارگذاری افزونه**: می‌تواند از `ResourceLoader` در pi مستقیم‌تر استفاده کند
4. **پیچیدگی مدیریت‌کننده استریم**: `subscribeEmbeddedPiSession` بزرگ شده است
5. **ویژگی‌های خاص ارائه‌دهنده‌ها**: مسیرهای کد زیادی که ویژه ارائه‌دهنده هستند و pi ممکن است بتواند آن‌ها را مدیریت کند

## تست‌ها

پوشش یکپارچه‌سازی Pi این مجموعه‌ها را در بر می‌گیرد:

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

زنده/اختیاری:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (فعال‌سازی با `OPENCLAW_LIVE_TEST=1`)

برای دستورهای اجرای فعلی، [گردش‌کار توسعه Pi](/fa/pi-dev) را ببینید.

## مرتبط

- [گردش‌کار توسعه Pi](/fa/pi-dev)
- [نمای کلی نصب](/fa/install)
