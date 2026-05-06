---
read_when:
    - فهم تصميم تكامل Pi SDK في OpenClaw
    - تعديل دورة حياة جلسة الوكيل أو الأدوات أو ربط المزوّد لـ Pi
summary: بنية تكامل وكيل Pi المضمّن في OpenClaw ودورة حياة الجلسة
title: بنية تكامل Pi
x-i18n:
    generated_at: "2026-05-06T08:03:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: abd9e828b0a72ac4e796f33c247bb2b5d7143ddf5e897ad9d7380cfbfce1eb64
    source_path: pi.md
    workflow: 16
---

تتكامل OpenClaw مع [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) وحزمها الشقيقة (`pi-ai`، `pi-agent-core`، `pi-tui`) لتشغيل قدرات وكيل الذكاء الاصطناعي لديها.

## نظرة عامة

تستخدم OpenClaw حزمة pi SDK لتضمين وكيل ترميز بالذكاء الاصطناعي داخل بنية Gateway للمراسلة الخاصة بها. بدلا من تشغيل pi كعملية فرعية أو استخدام وضع RPC، تستورد OpenClaw مباشرة `AgentSession` الخاصة بـ pi وتنشئ مثيلا منها عبر `createAgentSession()`. يوفر هذا النهج المضمن:

- تحكما كاملا في دورة حياة الجلسة ومعالجة الأحداث
- حقن أدوات مخصصة (المراسلة، صندوق العزل، إجراءات خاصة بالقنوات)
- تخصيص موجه النظام لكل قناة/سياق
- استمرارية الجلسة مع دعم التفريع/Compaction
- تدوير ملفات تعريف المصادقة متعددة الحسابات مع تجاوز الفشل
- تبديل النماذج دون التقيد بموفر معين

## اعتماديات الحزم

```json
{
  "@mariozechner/pi-agent-core": "0.73.0",
  "@mariozechner/pi-ai": "0.73.0",
  "@mariozechner/pi-coding-agent": "0.73.0",
  "@mariozechner/pi-tui": "0.73.0"
}
```

| الحزمة            | الغرض                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | تجريدات LLM الأساسية: `Model`، `streamSimple`، أنواع الرسائل، واجهات API للموفرين                      |
| `pi-agent-core`   | حلقة الوكيل، تنفيذ الأدوات، أنواع `AgentMessage`                                                       |
| `pi-coding-agent` | SDK عالي المستوى: `createAgentSession`، `SessionManager`، `AuthStorage`، `ModelRegistry`، الأدوات المضمنة |
| `pi-tui`          | مكونات واجهة المستخدم الطرفية (تستخدم في وضع TUI المحلي في OpenClaw)                                  |

## بنية الملفات

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

توجد الآن أوقات تشغيل إجراءات الرسائل الخاصة بالقنوات في أدلة Plugin المملوكة للـ Plugin
بدلا من أن تكون تحت `src/agents/tools`، على سبيل المثال:

- ملفات وقت تشغيل إجراءات Plugin الخاص بـ Discord
- ملف وقت تشغيل إجراءات Plugin الخاص بـ Slack
- ملف وقت تشغيل إجراءات Plugin الخاص بـ Telegram
- ملف وقت تشغيل إجراءات Plugin الخاص بـ WhatsApp

## تدفق التكامل الأساسي

### 1. تشغيل وكيل مضمن

نقطة الدخول الرئيسية هي `runEmbeddedPiAgent()` في `pi-embedded-runner/run.ts`:

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

### 2. إنشاء الجلسة

داخل `runEmbeddedAttempt()` (الذي يستدعيه `runEmbeddedPiAgent()`)، يتم استخدام pi SDK:

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

### 3. الاشتراك في الأحداث

يشترك `subscribeEmbeddedPiSession()` في أحداث `AgentSession` الخاصة بـ pi:

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

تشمل الأحداث التي تتم معالجتها:

- `message_start` / `message_end` / `message_update` (بث النص/التفكير)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. التوجيه

بعد الإعداد، يتم إرسال الموجه إلى الجلسة:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

يتولى SDK حلقة الوكيل الكاملة: الإرسال إلى LLM، وتنفيذ استدعاءات الأدوات، وبث الاستجابات.

حقن الصور محلي للموجه: تحمل OpenClaw مراجع الصور من الموجه الحالي
وتمررها عبر `images` لتلك الجولة فقط. وهي لا تعيد فحص جولات السجل الأقدم
لإعادة حقن حمولات الصور.

## بنية الأدوات

### مسار الأدوات

1. **الأدوات الأساسية**: أدوات `codingTools` الخاصة بـ pi (read، bash، edit، write)
2. **الاستبدالات المخصصة**: تستبدل OpenClaw bash بـ `exec`/`process`، وتخصص read/edit/write لصندوق العزل
3. **أدوات OpenClaw**: المراسلة، المتصفح، اللوحة، الجلسات، Cron، Gateway، وغير ذلك
4. **أدوات القنوات**: أدوات الإجراءات الخاصة بـ Discord/Telegram/Slack/WhatsApp
5. **تصفية السياسات**: تتم تصفية الأدوات حسب ملف التعريف، والموفر، والوكيل، والمجموعة، وسياسات صندوق العزل
6. **تطبيع المخططات**: تنظيف المخططات للتعامل مع خصوصيات Gemini/OpenAI
7. **تغليف AbortSignal**: تغليف الأدوات بحيث تراعي إشارات الإحباط

### مهايئ تعريف الأداة

لدى `AgentTool` في pi-agent-core توقيع `execute` مختلف عن `ToolDefinition` في pi-coding-agent. يربط المهايئ في `pi-tool-definition-adapter.ts` بينهما:

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

### استراتيجية تقسيم الأدوات

يمرر `splitSdkTools()` جميع الأدوات عبر `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

يضمن هذا بقاء تصفية سياسة OpenClaw، وتكامل الصندوق الرملي، ومجموعة الأدوات الموسعة متسقة عبر المزوّدين.

## إنشاء موجه النظام

يُبنى موجه النظام في `buildAgentSystemPrompt()` (`system-prompt.ts`). ويجمع موجهًا كاملًا بأقسام تشمل الأدوات، ونمط استدعاء الأدوات، وحواجز السلامة، ومرجع OpenClaw CLI، وSkills، والوثائق، ومساحة العمل، والصندوق الرملي، والمراسلة، ووسوم الرد، والصوت، والردود الصامتة، وHeartbeats، وبيانات تشغيلية وصفية، إضافة إلى الذاكرة والتفاعلات عند تمكينها، وملفات سياق اختيارية ومحتوى إضافي لموجه النظام. تُقتطع الأقسام لوضع الموجه المصغّر المستخدم بواسطة الوكلاء الفرعيين.

يُطبق الموجه بعد إنشاء الجلسة عبر `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## إدارة الجلسات

### ملفات الجلسات

الجلسات هي ملفات JSONL ذات بنية شجرية (ربط id/parentId). يتولى `SessionManager` في Pi الاستمرارية:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

يلف OpenClaw هذا باستخدام `guardSessionManager()` لضمان سلامة نتائج الأدوات.

### التخزين المؤقت للجلسات

يخزّن `session-manager-cache.ts` مثيلات SessionManager مؤقتًا لتجنب تحليل الملفات بشكل متكرر:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### تحديد السجل

تقتطع `limitHistoryTurns()` سجل المحادثة بناءً على نوع القناة (رسالة مباشرة مقابل مجموعة).

### Compaction

يُشغّل الضغط التلقائي عند تجاوز السياق. تتضمن بصمات التجاوز الشائعة `request_too_large`، و`context length exceeded`، و`input exceeds the maximum number of tokens`، و`input token count exceeds the maximum number of input tokens`، و`input is too long for the model`، و`ollama error: context length exceeded`. يتولى `compactEmbeddedPiSessionDirect()` الضغط اليدوي:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## المصادقة وحل النموذج

### ملفات تعريف المصادقة

يحافظ OpenClaw على مخزن ملفات تعريف مصادقة مع عدة مفاتيح API لكل مزوّد:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

تدور ملفات التعريف عند الإخفاقات مع تتبع فترة التهدئة:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### حل النموذج

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

### تجاوز الفشل

يشغّل `FailoverError` الرجوع إلى نموذج بديل عند تهيئته:

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

## امتدادات Pi

يحمّل OpenClaw امتدادات pi مخصصة لسلوك متخصص:

### حماية Compaction

يضيف `src/agents/pi-hooks/compaction-safeguard.ts` حواجز إلى الضغط، بما في ذلك ميزنة رموز تكيفية وملخصات إخفاق الأدوات وعمليات الملفات:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### تقليم السياق

ينفذ `src/agents/pi-hooks/context-pruning.ts` تقليم السياق بناءً على cache-TTL:

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

## البث وردود الكتل

### تقطيع الكتل

يدير `EmbeddedBlockChunker` بث النص إلى كتل رد منفصلة:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### تجريد وسوم التفكير/النهائي

تُعالج مخرجات البث لإزالة كتل `<think>`/`<thinking>` واستخراج محتوى `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### توجيهات الرد

تُحلل وتُستخرج توجيهات الرد مثل `[[media:url]]`، و`[[voice]]`، و`[[reply:id]]`:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## معالجة الأخطاء

### تصنيف الأخطاء

يصنف `pi-embedded-helpers.ts` الأخطاء للتعامل الملائم معها:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### الرجوع في مستوى التفكير

إذا كان مستوى التفكير غير مدعوم، فإنه يرجع إلى مستوى بديل:

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

## تكامل الصندوق الرملي

عند تمكين وضع الصندوق الرملي، تُقيّد الأدوات والمسارات:

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

## معالجة خاصة بالمزوّدين

### Anthropic

- تنقية سلسلة الرفض السحرية
- التحقق من صحة الأدوار المتتالية في الأدوار
- تحقق صارم من معاملات أداة Pi الصاعدة

### Google/Gemini

- تعقيم مخطط الأدوات المملوك من Plugin

### OpenAI

- أداة `apply_patch` لنماذج Codex
- معالجة خفض مستوى التفكير

## تكامل TUI

يمتلك OpenClaw أيضًا وضع TUI محلي يستخدم مكونات pi-tui مباشرة:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

يوفر هذا تجربة الطرفية التفاعلية المشابهة للوضع الأصلي في pi.

## الاختلافات الرئيسية عن Pi CLI

| الجانب          | Pi CLI                  | OpenClaw المضمّن                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| الاستدعاء       | أمر `pi` / RPC          | SDK عبر `createAgentSession()`                                                                 |
| الأدوات         | أدوات ترميز افتراضية    | حزمة أدوات OpenClaw مخصصة                                                                     |
| موجه النظام     | AGENTS.md + موجهات      | ديناميكي حسب القناة/السياق                                                                    |
| تخزين الجلسات   | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (أو `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| المصادقة        | بيانات اعتماد واحدة     | ملفات تعريف متعددة مع التدوير                                                                 |
| الامتدادات      | محمّلة من القرص         | برمجية + مسارات قرصية                                                                         |
| معالجة الأحداث  | عرض TUI                 | قائمة على الاستدعاءات الراجعة (onBlockReply، إلخ.)                                            |

## اعتبارات مستقبلية

مجالات لإعادة العمل المحتملة:

1. **محاذاة توقيع الأدوات**: يجري حاليًا التكييف بين توقيعات pi-agent-core وpi-coding-agent
2. **لف مدير الجلسات**: يضيف `guardSessionManager` السلامة لكنه يزيد التعقيد
3. **تحميل الامتدادات**: يمكن استخدام `ResourceLoader` الخاص بـ pi بشكل أكثر مباشرة
4. **تعقيد معالج البث**: أصبح `subscribeEmbeddedPiSession` كبيرًا
5. **خصوصيات المزوّدين**: العديد من مسارات التعليمات البرمجية الخاصة بالمزوّدين التي قد يتمكن pi من التعامل معها

## الاختبارات

تمتد تغطية تكامل Pi عبر هذه الحزم:

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

مباشر/اختياري:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (فعّل `OPENCLAW_LIVE_TEST=1`)

لأوامر التشغيل الحالية، راجع [سير عمل تطوير Pi](/ar/pi-dev).

## ذات صلة

- [سير عمل تطوير Pi](/ar/pi-dev)
- [نظرة عامة على التثبيت](/ar/install)
