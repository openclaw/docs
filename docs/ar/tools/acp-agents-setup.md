---
read_when:
    - تثبيت أو تكوين إطار acpx لـ Claude Code / Codex / Gemini CLI
    - تمكين جسر MCP الخاص بـ plugin-tools أو OpenClaw-tools
    - تكوين أوضاع أذونات ACP
summary: 'إعداد وكلاء ACP: تهيئة حاضنة acpx، إعداد Plugin، الأذونات'
title: وكلاء ACP — الإعداد
x-i18n:
    generated_at: "2026-05-02T07:43:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4426219227e77d5dc57039c0c8f7324590388db141689239deaa2441609f4afd
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

للحصول على النظرة العامة، ودليل تشغيل المشغّل، والمفاهيم، راجع [وكلاء ACP](/ar/tools/acp-agents).

تغطي الأقسام أدناه إعداد حاضنة acpx، وإعداد Plugin لجسور MCP، وتكوين الأذونات.

استخدم هذه الصفحة فقط عند إعداد مسار ACP/acpx. لتكوين وقت تشغيل خادم تطبيقات Codex الأصلي، استخدم [حاضنة Codex](/ar/plugins/codex-harness). بالنسبة إلى مفاتيح OpenAI API أو تكوين موفر نماذج Codex OAuth، استخدم [OpenAI](/ar/providers/openai).

لدى Codex مساران في OpenClaw:

| المسار                     | التكوين/الأمر                                           | صفحة الإعداد                            |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| خادم تطبيقات Codex الأصلي | `/codex ...`, `agentRuntime.id: "codex"`               | [حاضنة Codex](/ar/plugins/codex-harness) |
| مهايئ Codex ACP الصريح    | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | هذه الصفحة                              |

فضّل المسار الأصلي ما لم تكن تحتاج صراحة إلى سلوك ACP/acpx.

## دعم حاضنة acpx (الحالي)

أسماء الحاضنات المضمنة الحالية في acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

عندما يستخدم OpenClaw خلفية acpx، فضّل هذه القيم لـ `agentId` ما لم يعرّف تكوين acpx لديك أسماء وكلاء مخصصة.
إذا كان تثبيت Cursor المحلي لديك لا يزال يعرّض ACP على أنه `agent acp`، فتجاوز أمر وكيل `cursor` في تكوين acpx لديك بدلا من تغيير الإعداد الافتراضي المضمن.

يمكن لاستخدام acpx CLI المباشر أيضا استهداف مهايئات عشوائية عبر `--agent <command>`، لكن منفذ الهروب الخام هذا ميزة في acpx CLI (وليس مسار `agentId` المعتاد في OpenClaw).

يعتمد التحكم في النموذج على إمكانات المهايئ. يقوم OpenClaw بتطبيع مراجع نماذج Codex ACP قبل بدء التشغيل. تحتاج الحاضنات الأخرى إلى ACP `models` مع دعم `session/set_model`؛ إذا لم تعرض الحاضنة تلك الإمكانية في ACP ولا علم نموذج بدء التشغيل الخاص بها، فلا يمكن لـ OpenClaw/acpx فرض اختيار نموذج.

## التكوين المطلوب

خط الأساس الأساسي لـ ACP:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

تكوين ربط السلاسل خاص بمهايئ القناة. مثال لـ Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnSessions: true,
      },
    },
  },
}
```

إذا لم يعمل إنشاء ACP المرتبط بسلسلة، فتحقق أولا من علم ميزة المهايئ:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

لا تتطلب روابط المحادثة الحالية إنشاء سلسلة فرعية. إنها تتطلب سياق محادثة نشطا ومهايئ قناة يعرّض روابط محادثات ACP.

راجع [مرجع التكوين](/ar/gateway/configuration-reference).

## إعداد Plugin لخلفية acpx

تأتي التثبيتات الجديدة مع Plugin وقت تشغيل `acpx` المضمن مفعلا افتراضيا، لذلك يعمل ACP عادة دون خطوة تثبيت Plugin يدوية.

ابدأ بـ:

```text
/acp doctor
```

إذا عطّلت `acpx`، أو حظرته عبر `plugins.allow` / `plugins.deny`، أو أردت التبديل إلى نسخة تطوير محلية، فاستخدم مسار Plugin الصريح:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

تثبيت مساحة العمل المحلية أثناء التطوير:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

ثم تحقق من صحة الخلفية:

```text
/acp doctor
```

### تكوين أمر acpx وإصداره

افتراضيا، يسجل Plugin `acpx` المضمن خلفية ACP المضمنة دون إنشاء وكيل ACP أثناء بدء تشغيل Gateway. شغّل `/acp doctor` لإجراء فحص مباشر صريح. عيّن `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` فقط عندما تحتاج إلى أن يفحص Gateway الوكيل المكوّن عند بدء التشغيل.

تجاوز الأمر أو الإصدار في تكوين Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- يقبل `command` مسارا مطلقا، أو مسارا نسبيا (يتم حله من مساحة عمل OpenClaw)، أو اسم أمر.
- يعطل `expectedVersion: "any"` مطابقة الإصدار الصارمة.
- تعطل مسارات `command` المخصصة التثبيت التلقائي المحلي للـ Plugin.

راجع [Plugins](/ar/tools/plugin).

### تثبيت التبعيات التلقائي

عند تثبيت OpenClaw عالميا باستخدام `npm install -g openclaw`، يتم تثبيت تبعيات وقت تشغيل acpx (الثنائيات الخاصة بالمنصة) تلقائيا عبر خطاف postinstall. إذا فشل التثبيت التلقائي، فسيظل Gateway يبدأ بشكل طبيعي ويبلغ عن التبعية المفقودة عبر `openclaw acp doctor`.

### جسر MCP لأدوات Plugin

افتراضيا، لا تعرّض جلسات ACPX أدوات OpenClaw المسجلة بواسطة Plugins إلى حاضنة ACP.

إذا أردت أن يستدعي وكلاء ACP مثل Codex أو Claude Code أدوات Plugins المثبتة في OpenClaw مثل استدعاء/تخزين الذاكرة، ففعّل الجسر المخصص:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

ما يفعله هذا:

- يحقن خادم MCP مضمنا باسم `openclaw-plugin-tools` في تمهيد جلسة ACPX.
- يعرّض أدوات Plugins المسجلة مسبقا بواسطة Plugins المثبتة والمفعلة في OpenClaw.
- يبقي الميزة صريحة ومعطلة افتراضيا.

ملاحظات الأمان والثقة:

- يوسّع هذا سطح أدوات حاضنة ACP.
- يحصل وكلاء ACP على الوصول فقط إلى أدوات Plugins النشطة بالفعل في Gateway.
- تعامل مع هذا كحد الثقة نفسه مثل السماح لتلك Plugins بالتنفيذ داخل OpenClaw نفسه.
- راجع Plugins المثبتة قبل تفعيله.

تستمر `mcpServers` المخصصة في العمل كما في السابق. جسر أدوات Plugins المضمن هو تسهيل إضافي اختياري، وليس بديلا عن تكوين خادم MCP العام.

### جسر MCP لأدوات OpenClaw

افتراضيا، لا تعرّض جلسات ACPX أيضا أدوات OpenClaw المضمنة عبر MCP. فعّل جسر أدوات النواة المنفصل عندما يحتاج وكيل ACP إلى أدوات مضمنة محددة مثل `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

ما يفعله هذا:

- يحقن خادم MCP مضمنا باسم `openclaw-tools` في تمهيد جلسة ACPX.
- يعرّض أدوات OpenClaw مضمنة محددة. يعرّض الخادم الأولي `cron`.
- يبقي تعريض أدوات النواة صريحا ومعطلا افتراضيا.

### تكوين مهلة وقت التشغيل

يضبط Plugin `acpx` المضمن مهلة افتراضية لدورات وقت التشغيل المضمنة قدرها 120 ثانية. يمنح هذا الحاضنات الأبطأ مثل Gemini CLI وقتا كافيا لإكمال بدء تشغيل ACP وتهيئته. تجاوزه إذا كان مضيفك يحتاج إلى حد وقت تشغيل مختلف:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

### تكوين وكيل فحص الصحة

عندما يتحقق `/acp doctor` أو فحص بدء التشغيل الاختياري من الخلفية، يفحص Plugin `acpx` المضمن وكيل حاضنة واحدا. إذا تم تعيين `acp.allowedAgents`، فسيستخدم افتراضيا أول وكيل مسموح؛ وإلا فسيستخدم `codex` افتراضيا. إذا كان نشرُك يحتاج إلى وكيل ACP مختلف لفحوصات الصحة، فعيّن وكيل الفحص صراحة:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

## تكوين الأذونات

تعمل جلسات ACP بشكل غير تفاعلي، فلا توجد TTY للموافقة على مطالبات أذونات كتابة الملفات وتنفيذ shell أو رفضها. يوفر Plugin acpx مفتاحي تكوين يتحكمان في كيفية التعامل مع الأذونات:

تكون أذونات حاضنة ACPX هذه منفصلة عن موافقات التنفيذ في OpenClaw ومنفصلة عن أعلام تجاوز مورّدي خلفيات CLI مثل Claude CLI `--permission-mode bypassPermissions`. يعد ACPX `approve-all` مفتاح الطوارئ على مستوى الحاضنة لجلسات ACP.

### `permissionMode`

يتحكم في العمليات التي يستطيع وكيل الحاضنة تنفيذها دون مطالبة.

| القيمة          | السلوك                                                   |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | الموافقة تلقائيا على كل عمليات كتابة الملفات وأوامر shell. |
| `approve-reads` | الموافقة تلقائيا على القراءات فقط؛ تتطلب الكتابات والتنفيذ مطالبات. |
| `deny-all`      | رفض كل مطالبات الأذونات.                                |

### `nonInteractivePermissions`

يتحكم فيما يحدث عندما كان سيتم عرض مطالبة أذونات ولكن لا تتوفر TTY تفاعلية (وهذا هو الحال دائما لجلسات ACP).

| القيمة | السلوك                                                              |
| ------ | ------------------------------------------------------------------- |
| `fail` | إجهاض الجلسة مع `AcpRuntimeError`. **(افتراضي)**                    |
| `deny` | رفض الإذن بصمت والمتابعة (تدهور تدريجي).                           |

### التكوين

عيّنه عبر تكوين Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

أعد تشغيل Gateway بعد تغيير هذه القيم.

<Warning>
يضبط OpenClaw افتراضيا `permissionMode=approve-reads` و`nonInteractivePermissions=fail`. في جلسات ACP غير التفاعلية، يمكن أن تفشل أي كتابة أو تنفيذ يطلق مطالبة أذونات مع `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

إذا احتجت إلى تقييد الأذونات، فعيّن `nonInteractivePermissions` إلى `deny` حتى تتدهور الجلسات تدريجيا بدلا من أن تتعطل.
</Warning>

## ذات صلة

- [وكلاء ACP](/ar/tools/acp-agents) — النظرة العامة، دليل تشغيل المشغّل، المفاهيم
- [الوكلاء الفرعيون](/ar/tools/subagents)
- [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)
