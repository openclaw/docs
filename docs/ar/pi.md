---
read_when:
    - فهم تصميم تكامل Pi SDK في OpenClaw
    - تعديل دورة حياة جلسة الوكيل، أو الأدوات، أو ربط provider لـ Pi
summary: معمارية تكامل وكيل Pi المضمن في OpenClaw ودورة حياة الجلسة
title: معمارية تكامل Pi
x-i18n:
    generated_at: "2026-04-24T07:51:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c0c490cad121a65d557a72887ea619a7d0cff34a62220752214185c9148dc0b
    source_path: pi.md
    workflow: 15
---

تصف هذه الوثيقة كيف يدمج OpenClaw مع [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) والحزم الشقيقة له (`pi-ai` و`pi-agent-core` و`pi-tui`) لتشغيل قدرات وكيل الذكاء الاصطناعي الخاصة به.

## نظرة عامة

يستخدم OpenClaw مجموعة تطوير Pi لتضمين وكيل برمجة بالذكاء الاصطناعي داخل معمارية بوابة المراسلة الخاصة به. وبدلًا من تشغيل pi كعملية فرعية أو استخدام وضع RPC، يقوم OpenClaw مباشرةً باستيراد `AgentSession` الخاص بـ pi وإنشائه عبر `createAgentSession()`. يوفّر هذا النهج المضمّن ما يلي:

- تحكمًا كاملًا في دورة حياة الجلسة ومعالجة الأحداث
- حقن أدوات مخصصة (المراسلة، وsandbox، والإجراءات الخاصة بكل قناة)
- تخصيص system prompt لكل قناة/سياق
- استمرارية الجلسة مع دعم التفريع/Compaction
- تدوير ملفات تعريف المصادقة متعددة الحسابات مع failover
- تبديل النماذج بشكل مستقل عن provider

## تبعيات الحزم

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| الحزمة | الغرض |
| ------ | ----- |
| `pi-ai` | تجريدات LLM الأساسية: `Model`، و`streamSimple`، وأنواع الرسائل، وواجهات provider |
| `pi-agent-core` | حلقة الوكيل، وتنفيذ الأدوات، وأنواع `AgentMessage` |
| `pi-coding-agent` | SDK عالي المستوى: `createAgentSession`، و`SessionManager`، و`AuthStorage`، و`ModelRegistry`، والأدوات المضمنة |
| `pi-tui` | مكونات واجهة الطرفية (تُستخدم في وضع TUI المحلي في OpenClaw) |

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

توجد الآن أوقات تشغيل إجراءات الرسائل الخاصة بكل قناة في أدلة extensions
المملوكة للـ Plugin بدلًا من `src/agents/tools`، على سبيل المثال:

- ملفات وقت تشغيل إجراءات Plugin الخاصة بـ Discord
- ملف وقت تشغيل إجراءات Plugin الخاصة بـ Slack
- ملف وقت تشغيل إجراءات Plugin الخاصة بـ Telegram
- ملف وقت تشغيل إجراءات Plugin الخاصة بـ WhatsApp

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

داخل `runEmbeddedAttempt()` ‏(التي تستدعيها `runEmbeddedPiAgent()`)، تُستخدم مجموعة تطوير pi:

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

- `message_start` / `message_end` / `message_update` ‏(نص/تفكير متدفق)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. الـ Prompting

بعد الإعداد، تُرسل prompt إلى الجلسة:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

تتعامل مجموعة التطوير مع حلقة الوكيل الكاملة: الإرسال إلى LLM، وتنفيذ استدعاءات الأدوات، وبث الاستجابات.

يكون حقن الصور محليًا بالنسبة إلى prompt: يحمّل OpenClaw مراجع الصور من prompt الحالية
ويمررها عبر `images` لذلك الدور فقط. ولا يعيد فحص أدوار السجل الأقدم
لإعادة حقن حمولات الصور.

## معمارية الأدوات

### مسار الأدوات

1. **الأدوات الأساسية**: ‏`codingTools` الخاصة بـ pi ‏(`read` و`bash` و`edit` و`write`)
2. **استبدالات مخصصة**: يستبدل OpenClaw ‏`bash` بـ `exec`/`process`، ويخصص read/edit/write للـ sandbox
3. **أدوات OpenClaw**: المراسلة، والمتصفح، واللوحة، والجلسات، وcron، وgateway، وغير ذلك
4. **أدوات القنوات**: أدوات الإجراءات الخاصة بـ Discord/Telegram/Slack/WhatsApp
5. **تصفية السياسة**: تُصفى الأدوات وفق سياسات الملف الشخصي، والـ provider، والوكيل، والمجموعة، والـ sandbox
6. **تطبيع المخطط**: تُنظف المخططات لمراعاة غرائب Gemini/OpenAI
7. **لفّ AbortSignal**: تُلف الأدوات لاحترام إشارات الإلغاء

### مهايئ تعريف الأداة

يمتلك `AgentTool` في pi-agent-core توقيع `execute` مختلفًا عن `ToolDefinition` في pi-coding-agent. ويصل المهايئ الموجود في `pi-tool-definition-adapter.ts` بين الاثنين:

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

يضمن هذا بقاء تصفية السياسة في OpenClaw، وتكامل sandbox، ومجموعة الأدوات الموسعة متسقة عبر providers.

## بناء System Prompt

يُبنى system prompt في `buildAgentSystemPrompt()` ‏(`system-prompt.ts`). وهو يجمع prompt كاملة مع أقسام تشمل Tooling، وTool Call Style، وحواجز الأمان، ومرجع OpenClaw CLI، وSkills، وDocs، وWorkspace، وSandbox، وMessaging، وReply Tags، وVoice، وSilent Replies، وHeartbeats، وبيانات تعريف وقت التشغيل، بالإضافة إلى Memory وReactions عند التفعيل، وملفات سياق اختيارية ومحتوى system prompt إضافي. ويتم تقليم الأقسام لاستخدام وضع prompt الأدنى المستخدم مع الوكلاء الفرعيين.

تُطبَّق prompt بعد إنشاء الجلسة عبر `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## إدارة الجلسات

### ملفات الجلسات

الجلسات هي ملفات JSONL ذات بنية شجرية (ربط عبر id/parentId). ويتولى `SessionManager` في Pi الاستمرارية:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

ويلف OpenClaw هذا باستخدام `guardSessionManager()` لسلامة نتائج الأدوات.

### التخزين المؤقت للجلسة

يخزن `session-manager-cache.ts` مثيلات SessionManager مؤقتًا لتجنب تحليل الملفات بشكل متكرر:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### تحديد السجل

يقوم `limitHistoryTurns()` بتقليم سجل المحادثة وفقًا لنوع القناة (رسالة مباشرة مقابل مجموعة).

### Compaction

يتم تشغيل Compaction التلقائي عند تجاوز السياق. وتشمل تواقيع تجاوز السياق الشائعة
`request_too_large` و`context length exceeded` و`input exceeds the
maximum number of tokens` و`input token count exceeds the maximum number of
input tokens` و`input is too long for the model` و`ollama error: context
length exceeded`. ويتولى `compactEmbeddedPiSessionDirect()` تنفيذ
Compaction اليدوي:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## المصادقة وحلّ النموذج

### ملفات تعريف المصادقة

يحافظ OpenClaw على مخزن لملفات تعريف المصادقة مع عدة مفاتيح API لكل provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

تدور الملفات الشخصية عند الإخفاقات مع تتبع cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### حلّ النموذج

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

يؤدي `FailoverError` إلى تشغيل fallback للنموذج عند ضبطه:

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

يقوم OpenClaw بتحميل امتدادات Pi مخصصة لسلوكيات متخصصة:

### Compaction Safeguard

يضيف `src/agents/pi-hooks/compaction-safeguard.ts` حواجز حماية إلى Compaction، بما في ذلك ميزانية الرموز التكيفية إضافةً إلى ملخصات فشل الأدوات وعمليات الملفات:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### تقليم السياق

ينفذ `src/agents/pi-hooks/context-pruning.ts` تقليم السياق القائم على Cache-TTL:

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

### تقطيع الكتل

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

يقوم `pi-embedded-helpers.ts` بتصنيف الأخطاء من أجل المعالجة المناسبة:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### fallback لمستوى التفكير

إذا كان مستوى التفكير غير مدعوم، فسيتم الرجوع إلى مستوى بديل:

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

## المعالجة الخاصة بالـ Provider

### Anthropic

- تنقية سلسلة الرفض السحرية
- التحقق من الأدوار المتتالية
- تحقق صارم من معلمات أدوات Pi upstream

### Google/Gemini

- تنقية مخطط الأدوات المملوكة للـ Plugin

### OpenAI

- أداة `apply_patch` لنماذج Codex
- معالجة خفض مستوى التفكير

## تكامل TUI

يمتلك OpenClaw أيضًا وضع TUI محليًا يستخدم مكونات pi-tui مباشرة:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

يوفر هذا تجربة الطرفية التفاعلية المشابهة للوضع الأصلي في Pi.

## الاختلافات الأساسية عن Pi CLI

| الجانب | Pi CLI | OpenClaw Embedded |
| ------ | ------ | ----------------- |
| الاستدعاء | أمر `pi` / ‏RPC | SDK عبر `createAgentSession()` |
| الأدوات | أدوات البرمجة الافتراضية | مجموعة أدوات OpenClaw مخصصة |
| system prompt | ‏AGENTS.md + prompts | ديناميكية لكل قناة/سياق |
| تخزين الجلسات | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` ‏(أو `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| المصادقة | بيانات اعتماد واحدة | ملفات شخصية متعددة مع تدوير |
| الامتدادات | تُحمَّل من القرص | برمجيًا + مسارات قرص |
| معالجة الأحداث | عرض TUI | قائم على callbacks ‏(`onBlockReply`، وغير ذلك) |

## اعتبارات مستقبلية

مجالات محتملة لإعادة العمل:

1. **محاذاة توقيع الأدوات**: يوجد حاليًا تكييف بين تواقيع pi-agent-core وpi-coding-agent
2. **لف Session Manager**: يضيف `guardSessionManager` أمانًا لكنه يزيد التعقيد
3. **تحميل الامتدادات**: يمكن أن يستخدم `ResourceLoader` الخاص بـ pi بشكل أكثر مباشرة
4. **تعقيد معالج البث**: نما `subscribeEmbeddedPiSession` كثيرًا
5. **غرائب providers**: توجد مسارات كود كثيرة خاصة بالـ provider يمكن لـ pi ربما التعامل معها

## الاختبارات

تمتد تغطية تكامل Pi عبر هذه المجموعات:

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` ‏(فعّل `OPENCLAW_LIVE_TEST=1`)

لأوامر التشغيل الحالية، راجع [سير عمل تطوير Pi](/ar/pi-dev).

## ذو صلة

- [سير عمل تطوير Pi](/ar/pi-dev)
- [نظرة عامة على التثبيت](/ar/install)
