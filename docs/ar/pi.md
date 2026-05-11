---
read_when:
    - فهم تصميم تكامل Pi SDK في OpenClaw
    - تعديل دورة حياة جلسة الوكيل أو الأدوات أو ربط المزوّد الخاص بـ Pi
summary: بنية تكامل وكيل Pi المضمّن في OpenClaw ودورة حياة الجلسة
title: بنية تكامل Pi
x-i18n:
    generated_at: "2026-05-11T20:36:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44d1f3fb0e04302f09c6259dbce8a12a0f25e345c2407162d82c7712d33d5e0a
    source_path: pi.md
    workflow: 16
---

يتكامل OpenClaw مع [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) وحزمه الشقيقة (`pi-ai`، و`pi-agent-core`، و`pi-tui`) لتشغيل قدرات وكيل الذكاء الاصطناعي الخاصة به.

## نظرة عامة

يستخدم OpenClaw عدة تطوير البرمجيات الخاصة بـ pi لتضمين وكيل برمجة بالذكاء الاصطناعي في معمارية Gateway للمراسلة لديه. وبدلا من تشغيل pi كعملية فرعية أو استخدام وضع RPC، يستورد OpenClaw مباشرة `AgentSession` الخاصة بـ pi وينشئ مثيلا منها عبر `createAgentSession()`. يوفر هذا النهج المضمّن ما يلي:

- تحكم كامل في دورة حياة الجلسة ومعالجة الأحداث
- حقن أدوات مخصصة (المراسلة، صندوق الاختبار، إجراءات خاصة بالقناة)
- تخصيص موجه النظام لكل قناة/سياق
- استمرارية الجلسة مع دعم التفريع/Compaction
- تدوير ملفات تعريف المصادقة متعددة الحسابات مع تجاوز الأعطال
- تبديل النماذج دون الارتباط بمزود محدد

## تبعيات الحزم

```json
{
  "@earendil-works/pi-agent-core": "0.74.0",
  "@earendil-works/pi-ai": "0.74.0",
  "@earendil-works/pi-coding-agent": "0.74.0",
  "@earendil-works/pi-tui": "0.74.0"
}
```

| الحزمة            | الغرض                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | تجريدات LLM الأساسية: `Model`، و`streamSimple`، وأنواع الرسائل، وواجهات API الخاصة بالمزودين           |
| `pi-agent-core`   | حلقة الوكيل، وتنفيذ الأدوات، وأنواع `AgentMessage`                                                     |
| `pi-coding-agent` | SDK عالي المستوى: `createAgentSession`، و`SessionManager`، و`AuthStorage`، و`ModelRegistry`، وأدوات مدمجة |
| `pi-tui`          | مكونات واجهة المستخدم الطرفية (تستخدم في وضع TUI المحلي الخاص بـ OpenClaw)                             |

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

توجد الآن بيئات تشغيل إجراءات الرسائل الخاصة بالقنوات في أدلة الامتدادات المملوكة للـ Plugin
بدلا من وجودها تحت `src/agents/tools`، على سبيل المثال:

- ملفات بيئة تشغيل إجراءات Plugin الخاص بـ Discord
- ملف بيئة تشغيل إجراءات Plugin الخاص بـ Slack
- ملف بيئة تشغيل إجراءات Plugin الخاص بـ Telegram
- ملف بيئة تشغيل إجراءات Plugin الخاص بـ WhatsApp

## تدفق التكامل الأساسي

### 1. تشغيل وكيل مضمّن

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

داخل `runEmbeddedAttempt()` (التي يستدعيها `runEmbeddedPiAgent()`)، يتم استخدام SDK الخاص بـ pi:

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

### 3. الاشتراك في الأحداث

تشترك `subscribeEmbeddedPiSession()` في أحداث `AgentSession` الخاصة بـ pi:

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

- `message_start` / `message_end` / `message_update` (النص/التفكير المتدفق)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. إرسال الموجه

بعد الإعداد، يتم إرسال الموجه إلى الجلسة:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

يتولى SDK حلقة الوكيل الكاملة: الإرسال إلى LLM، وتنفيذ استدعاءات الأدوات، وبث الاستجابات.

حقن الصور محلي على مستوى الموجه: يحمّل OpenClaw مراجع الصور من الموجه الحالي ويمررها عبر `images` لذلك الدور فقط. ولا يعيد فحص أدوار السجل الأقدم لإعادة حقن حمولات الصور.

## معمارية الأدوات

### مسار الأدوات

1. **الأدوات الأساسية**: `codingTools` الخاصة بـ pi (القراءة، وbash، والتحرير، والكتابة)
2. **الاستبدالات المخصصة**: يستبدل OpenClaw bash بـ `exec`/`process`، ويخصص القراءة/التحرير/الكتابة لصندوق الاختبار
3. **أدوات OpenClaw**: المراسلة، والمتصفح، واللوحة، والجلسات، وCron، وGateway، وما إلى ذلك.
4. **أدوات القنوات**: أدوات إجراءات خاصة بـ Discord/Telegram/Slack/WhatsApp
5. **تصفية السياسات**: تتم تصفية الأدوات حسب سياسات الملف التعريفي، والمزود، والوكيل، والمجموعة، وصندوق الاختبار
6. **تطبيع المخططات**: يتم تنظيف المخططات لمعالجة خصوصيات Gemini/OpenAI
7. **تغليف AbortSignal**: يتم تغليف الأدوات لاحترام إشارات الإجهاض

### محول تعريف الأدوات

لدى `AgentTool` في pi-agent-core توقيع `execute` مختلف عن `ToolDefinition` في pi-coding-agent. يربط المحول في `pi-tool-definition-adapter.ts` بينهما:

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

تمرر `splitSdkTools()` جميع الأدوات عبر `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

يضمن هذا أن تظل تصفية السياسات في OpenClaw، وتكامل sandbox، ومجموعة الأدوات الموسعة متسقة عبر المزوّدين.

## إنشاء مطالبة النظام

تُبنى مطالبة النظام في `buildAgentSystemPrompt()` (`system-prompt.ts`). وهي تجمع مطالبة كاملة تتضمن أقسامًا تشمل الأدوات، ونمط استدعاء الأدوات، وحواجز الأمان، والتحكم في OpenClaw، وSkills، والمستندات، ومساحة العمل، وSandbox، والمراسلة، وتوجيهات إخراج المساعد، والصوت، والردود الصامتة، وHeartbeats، وبيانات تعريف وقت التشغيل، إضافةً إلى الذاكرة والتفاعلات عند تفعيلها، وملفات سياق اختيارية ومحتوى مطالبة نظام إضافي. تُقلَّص الأقسام في وضع المطالبة الأدنى المستخدم بواسطة الوكلاء الفرعيين.

تُطبَّق المطالبة بعد إنشاء الجلسة عبر `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## إدارة الجلسات

### ملفات الجلسات

الجلسات هي ملفات JSONL ذات بنية شجرية (ربط id/parentId). يتولى `SessionManager` الخاص بـ Pi الاستمرارية:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

يلف OpenClaw ذلك باستخدام `guardSessionManager()` لضمان أمان نتائج الأدوات.

### التخزين المؤقت للجلسات

يخزّن `session-manager-cache.ts` مثيلات SessionManager مؤقتًا لتجنب تحليل الملفات المتكرر:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### تحديد السجل

يقلّص `limitHistoryTurns()` سجل المحادثة بناءً على نوع القناة (رسالة مباشرة مقابل مجموعة).

### Compaction

تُفعَّل Compaction التلقائية عند تجاوز السياق. تشمل بصمات التجاوز الشائعة
`request_too_large`، و`context length exceeded`، و`input exceeds the
maximum number of tokens`، و`input token count exceeds the maximum number of
input tokens`، و`input is too long for the model`، و`ollama error: context
length exceeded`. يتولى `compactEmbeddedPiSessionDirect()` تنفيذ
Compaction اليدوية:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## المصادقة وحل النموذج

### ملفات تعريف المصادقة

يحافظ OpenClaw على مخزن لملفات تعريف المصادقة يحتوي على عدة مفاتيح API لكل مزوّد:

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

يفعّل `FailoverError` الرجوع إلى نموذج بديل عند تكوين ذلك:

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

يضيف `src/agents/pi-hooks/compaction-safeguard.ts` حواجز أمان إلى Compaction، بما في ذلك ميزانية رموز تكيفية إضافةً إلى ملخصات إخفاق الأدوات وعمليات الملفات:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### تقليم السياق

ينفذ `src/agents/pi-hooks/context-pruning.ts` تقليم السياق المستند إلى cache-TTL:

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

### تقسيم الكتل

يدير `EmbeddedBlockChunker` بث النص إلى كتل رد منفصلة:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### إزالة وسوم التفكير/النهائي

تُعالَج مخرجات البث لإزالة كتل `<think>`/`<thinking>` واستخراج محتوى `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### توجيهات الرد

تُحلَّل وتُستخرج توجيهات الرد مثل `[[media:url]]` و`[[voice]]` و`[[reply:id]]`:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## معالجة الأخطاء

### تصنيف الأخطاء

يصنّف `pi-embedded-helpers.ts` الأخطاء للتعامل المناسب:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### الرجوع لمستوى التفكير

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

## تكامل Sandbox

عند تفعيل وضع sandbox، تُقيَّد الأدوات والمسارات:

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

## التعامل الخاص بالمزوّدين

### Anthropic

- تنقية السلسلة السحرية للرفض
- التحقق من الأدوار المتتالية في الدور
- تحقق صارم من معلمات أداة Pi في المصدر الأعلى

### Google/Gemini

- تنقية مخطط الأدوات المملوك لـ Plugin

### OpenAI

- أداة `apply_patch` لنماذج Codex
- التعامل مع تخفيض مستوى التفكير

## تكامل TUI

لدى OpenClaw أيضًا وضع TUI محلي يستخدم مكونات pi-tui مباشرةً:

```typescript
// src/tui/tui.ts
import { ... } from "@earendil-works/pi-tui";
```

يوفر هذا تجربة الطرفية التفاعلية المشابهة للوضع الأصلي في pi.

## الفروقات الرئيسية عن Pi CLI

| الجانب          | Pi CLI                  | OpenClaw المضمّن                                                                             |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| الاستدعاء       | أمر `pi` / RPC          | SDK عبر `createAgentSession()`                                                                 |
| الأدوات         | أدوات البرمجة الافتراضية | مجموعة أدوات OpenClaw المخصصة                                                                 |
| مطالبة النظام   | AGENTS.md + المطالبات   | ديناميكية حسب القناة/السياق                                                                    |
| تخزين الجلسات   | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (أو `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| المصادقة        | اعتماد واحد             | ملفات تعريف متعددة مع تدوير                                                                    |
| الامتدادات      | محمّلة من القرص         | مسارات برمجية + قرصية                                                                          |
| التعامل مع الأحداث | عرض TUI             | قائم على الاستدعاءات الراجعة (onBlockReply، وغيرها)                                           |

## اعتبارات مستقبلية

مجالات محتملة لإعادة العمل:

1. **محاذاة تواقيع الأدوات**: يجري حاليًا التكييف بين تواقيع pi-agent-core وpi-coding-agent
2. **تغليف مدير الجلسات**: يضيف `guardSessionManager` أمانًا لكنه يزيد التعقيد
3. **تحميل الامتدادات**: يمكن استخدام `ResourceLoader` الخاص بـ pi بشكل أكثر مباشرة
4. **تعقيد معالج البث**: أصبح `subscribeEmbeddedPiSession` كبيرًا
5. **غرائب المزوّدين**: توجد مسارات كثيرة خاصة بالمزوّدين قد يتمكن pi من التعامل معها

## الاختبارات

تغطي اختبارات تكامل Pi هذه الحزم:

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
