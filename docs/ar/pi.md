---
read_when:
    - فهم تصميم تكامل مجموعة تطوير برمجيات Pi في OpenClaw
    - تعديل دورة حياة جلسة الوكيل أو الأدوات أو ربط المزوّدين لـ Pi
summary: بنية تكامل وكيل Pi المضمّن الخاص بـ OpenClaw ودورة حياة الجلسة
title: معمارية تكامل Pi
x-i18n:
    generated_at: "2026-04-30T08:10:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b155cd5296875f2f187c68c6929c48aba27cef047f0caad74f560bcde5533e5
    source_path: pi.md
    workflow: 16
---

يتكامل OpenClaw مع [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) وحزمه الشقيقة (`pi-ai` و`pi-agent-core` و`pi-tui`) لتشغيل قدرات وكيل الذكاء الاصطناعي لديه.

## نظرة عامة

يستخدم OpenClaw مجموعة تطوير pi لتضمين وكيل ترميز ذكاء اصطناعي في معمارية Gateway الخاصة بالمراسلة. وبدلا من تشغيل pi كعملية فرعية أو استخدام وضع RPC، يستورد OpenClaw مباشرة `AgentSession` الخاص بـ pi وينشئه عبر `createAgentSession()`. يوفر هذا النهج المضمّن ما يلي:

- تحكم كامل في دورة حياة الجلسة ومعالجة الأحداث
- حقن أدوات مخصصة (المراسلة، الصندوق الرملي، الإجراءات الخاصة بالقناة)
- تخصيص مطالبة النظام لكل قناة/سياق
- استمرار الجلسات مع دعم التفريع/Compaction
- تدوير ملفات تعريف المصادقة متعددة الحسابات مع تجاوز الأعطال
- تبديل النماذج بلا اعتماد على مزود محدد

## اعتماديات الحزم

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| الحزمة             | الغرض                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `pi-ai`           | تجريدات LLM الأساسية: `Model` و`streamSimple` وأنواع الرسائل وواجهات API للمزودين                         |
| `pi-agent-core`   | حلقة الوكيل، وتنفيذ الأدوات، وأنواع `AgentMessage`                                                         |
| `pi-coding-agent` | مجموعة تطوير عالية المستوى: `createAgentSession` و`SessionManager` و`AuthStorage` و`ModelRegistry` والأدوات المدمجة |
| `pi-tui`          | مكونات واجهة المستخدم الطرفية (تُستخدم في وضع TUI المحلي الخاص بـ OpenClaw)                                |

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

توجد الآن بيئات تشغيل إجراءات الرسائل الخاصة بالقنوات داخل أدلة Plugin المملوكة للـ Plugin بدلا من وجودها تحت `src/agents/tools`، على سبيل المثال:

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

داخل `runEmbeddedAttempt()` (التي يستدعيها `runEmbeddedPiAgent()`)، تُستخدم مجموعة تطوير pi:

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

### 4. المطالبة

بعد الإعداد، تُرسل المطالبة إلى الجلسة:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

تتولى مجموعة تطوير البرمجيات حلقة الوكيل الكاملة: الإرسال إلى LLM، وتنفيذ استدعاءات الأدوات، وبث الردود.

يكون حقن الصور محليا للمطالبة: يحمّل OpenClaw مراجع الصور من المطالبة الحالية ويمررها عبر `images` لذلك الدور فقط. ولا يعيد فحص أدوار السجل الأقدم لإعادة حقن حمولات الصور.

## معمارية الأدوات

### مسار الأدوات

1. **الأدوات الأساسية**: `codingTools` الخاصة بـ pi (read وbash وedit وwrite)
2. **الاستبدالات المخصصة**: يستبدل OpenClaw bash بـ `exec`/`process`، ويخصص read/edit/write للصندوق الرملي
3. **أدوات OpenClaw**: المراسلة، والمتصفح، واللوحة، والجلسات، وCron، وGateway، وغيرها
4. **أدوات القنوات**: أدوات إجراءات خاصة بـ Discord/Telegram/Slack/WhatsApp
5. **تصفية السياسات**: تُصفى الأدوات حسب ملف التعريف، والمزود، والوكيل، والمجموعة، وسياسات الصندوق الرملي
6. **تطبيع المخططات**: تُنظف المخططات للتعامل مع خصوصيات Gemini/OpenAI
7. **تغليف AbortSignal**: تُغلف الأدوات لاحترام إشارات الإجهاض

### محول تعريفات الأدوات

يملك `AgentTool` الخاص بـ pi-agent-core توقيع `execute` مختلفا عن `ToolDefinition` الخاص بـ pi-coding-agent. يسد المحول في `pi-tool-definition-adapter.ts` هذه الفجوة:

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

هذا يضمن بقاء تصفية سياسات OpenClaw، وتكامل sandbox، ومجموعة الأدوات الموسعة متسقة عبر المزوّدين.

## إنشاء مطالبة النظام

تُنشأ مطالبة النظام في `buildAgentSystemPrompt()` (`system-prompt.ts`). وهي تجمع مطالبة كاملة بأقسام تشمل الأدوات، ونمط استدعاء الأدوات، وحواجز الأمان، ومرجع OpenClaw CLI، وSkills، والوثائق، ومساحة العمل، وsandbox، والمراسلة، ووسوم الرد، والصوت، والردود الصامتة، وHeartbeats، وبيانات runtime الوصفية، إضافة إلى Memory وReactions عند تفعيلهما، وملفات السياق الاختيارية ومحتوى مطالبة النظام الإضافي. تُختصر الأقسام في وضع المطالبة الأدنى المستخدم بواسطة الوكلاء الفرعيين.

تُطبّق المطالبة بعد إنشاء الجلسة عبر `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## إدارة الجلسات

### ملفات الجلسة

الجلسات هي ملفات JSONL ببنية شجرية (ربط id/parentId). يتولى `SessionManager` الخاص بـ Pi الاستمرارية:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

يلف OpenClaw هذا باستخدام `guardSessionManager()` من أجل أمان نتائج الأدوات.

### التخزين المؤقت للجلسات

يخزّن `session-manager-cache.ts` مثيلات SessionManager مؤقتًا لتجنّب تحليل الملفات بشكل متكرر:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### تحديد السجل

يقلّص `limitHistoryTurns()` سجل المحادثة بناءً على نوع القناة (رسالة مباشرة مقابل مجموعة).

### Compaction

يُفعّل Compaction التلقائي عند تجاوز السياق. تشمل بصمات التجاوز الشائعة `request_too_large`، و`context length exceeded`، و`input exceeds the maximum number of tokens`، و`input token count exceeds the maximum number of input tokens`، و`input is too long for the model`، و`ollama error: context length exceeded`. يتعامل `compactEmbeddedPiSessionDirect()` مع Compaction اليدوي:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## المصادقة وحل النموذج

### ملفات تعريف المصادقة

يحافظ OpenClaw على مخزن لملفات تعريف المصادقة مع عدة مفاتيح API لكل مزوّد:

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

### تجاوز الأعطال

يشغّل `FailoverError` الرجوع إلى نموذج بديل عند ضبط ذلك:

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

يضيف `src/agents/pi-hooks/compaction-safeguard.ts` حواجز حماية إلى Compaction، بما في ذلك ميزانية الرموز التكيفية إضافة إلى ملخصات إخفاق الأدوات وعمليات الملفات:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### تهذيب السياق

ينفّذ `src/agents/pi-hooks/context-pruning.ts` تهذيب السياق بناءً على cache-TTL:

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

## البث والردود الكتلية

### تقسيم الكتل

يدير `EmbeddedBlockChunker` بث النص في كتل رد منفصلة:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### تجريد وسوم التفكير/النهائي

تُعالج مخرجات البث لتجريد كتل `<think>`/`<thinking>` واستخراج محتوى `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### توجيهات الرد

تُحلّل توجيهات الرد مثل `[[media:url]]`، و`[[voice]]`، و`[[reply:id]]` وتُستخرج:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## معالجة الأخطاء

### تصنيف الأخطاء

يصنّف `pi-embedded-helpers.ts` الأخطاء للمعالجة المناسبة:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### الرجوع في مستوى التفكير

إذا كان مستوى التفكير غير مدعوم، فإنه يرجع إلى بديل:

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

## تكامل sandbox

عند تفعيل وضع sandbox، تُقيّد الأدوات والمسارات:

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

## المعالجة الخاصة بالمزوّدين

### Anthropic

- تنظيف سلسلة الرفض السحرية
- التحقق من الأدوار المتتالية في الدور
- تحقق صارم من معاملات أداة Pi الصادرة من المنبع

### Google/Gemini

- تنقية مخطط الأدوات المملوك لـ Plugin

### OpenAI

- أداة `apply_patch` لنماذج Codex
- معالجة خفض مستوى التفكير

## تكامل TUI

لدى OpenClaw أيضًا وضع TUI محلي يستخدم مكوّنات pi-tui مباشرة:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

يوفر هذا تجربة الطرفية التفاعلية المشابهة للوضع الأصلي في pi.

## الفروقات الرئيسية عن Pi CLI

| الجانب | Pi CLI | OpenClaw المضمّن |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| الاستدعاء | أمر `pi` / RPC | SDK عبر `createAgentSession()` |
| الأدوات | أدوات الترميز الافتراضية | حزمة أدوات OpenClaw مخصصة |
| مطالبة النظام | AGENTS.md + المطالبات | ديناميكية حسب القناة/السياق |
| تخزين الجلسة | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (أو `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| المصادقة | اعتماد واحد | ملفات تعريف متعددة مع تدوير |
| الامتدادات | محمّلة من القرص | برمجية + مسارات قرص |
| معالجة الأحداث | عرض TUI | قائمة على الاستدعاءات (onBlockReply، إلخ) |

## اعتبارات مستقبلية

مجالات محتملة لإعادة العمل:

1. **محاذاة توقيع الأدوات**: يجري حاليًا التكييف بين تواقيع pi-agent-core وpi-coding-agent
2. **تغليف مدير الجلسات**: يضيف `guardSessionManager` أمانًا لكنه يزيد التعقيد
3. **تحميل الامتدادات**: يمكن استخدام `ResourceLoader` الخاص بـ pi بشكل مباشر أكثر
4. **تعقيد معالج البث**: أصبح `subscribeEmbeddedPiSession` كبيرًا
5. **خصوصيات المزوّدين**: مسارات تعليمات برمجية كثيرة خاصة بالمزوّدين قد يتمكن pi من معالجتها

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

اختبارات حية/اختيارية:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (فعّل `OPENCLAW_LIVE_TEST=1`)

لأوامر التشغيل الحالية، راجع [سير عمل تطوير Pi](/ar/pi-dev).

## ذات صلة

- [سير عمل تطوير Pi](/ar/pi-dev)
- [نظرة عامة على التثبيت](/ar/install)
