---
read_when:
    - تثبيت أو تكوين إطار acpx لـ Claude Code / Codex / Gemini CLI
    - تمكين جسر MCP لـ plugin-tools أو OpenClaw-tools
    - تكوين أوضاع أذونات ACP
summary: 'إعداد وكلاء ACP: تهيئة حاضنة acpx، إعداد Plugin، الأذونات'
title: وكلاء ACP — الإعداد
x-i18n:
    generated_at: "2026-05-02T21:03:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

للاطلاع على النظرة العامة، ودليل تشغيل المشغّل، والمفاهيم، راجع [وكلاء ACP](/ar/tools/acp-agents).

تغطي الأقسام أدناه تكوين مسخّر acpx، وإعداد Plugin لجسور MCP، وتكوين الأذونات.

استخدم هذه الصفحة فقط عندما تكون بصدد إعداد مسار ACP/acpx. بالنسبة إلى تكوين تشغيل خادم تطبيق Codex الأصلي، استخدم [مسخّر Codex](/ar/plugins/codex-harness). وبالنسبة إلى مفاتيح OpenAI API أو تكوين موفّر نماذج Codex OAuth، استخدم
[OpenAI](/ar/providers/openai).

لدى Codex مساران في OpenClaw:

| المسار                      | التكوين/الأمر                                         | صفحة الإعداد                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| خادم تطبيق Codex الأصلي    | `/codex ...`, `agentRuntime.id: "codex"`               | [مسخّر Codex](/ar/plugins/codex-harness) |
| محوّل Codex ACP الصريح | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | هذه الصفحة                               |

فضّل المسار الأصلي ما لم تكن تحتاج صراحةً إلى سلوك ACP/acpx.

## دعم مسخّر acpx (الحالي)

أسماء مسخّرات acpx المضمّنة الحالية:

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

عندما يستخدم OpenClaw واجهة acpx الخلفية، فضّل هذه القيم لـ `agentId` ما لم يعرّف تكوين acpx لديك أسماء مستعارة مخصصة للوكلاء.
إذا كان تثبيت Cursor المحلي لديك لا يزال يعرّض ACP بوصفه `agent acp`، فتجاوز أمر وكيل `cursor` في تكوين acpx لديك بدلًا من تغيير الإعداد الافتراضي المضمّن.

يمكن لاستخدام acpx CLI المباشر أيضًا استهداف محوّلات عشوائية عبر `--agent <command>`، لكن منفذ الهروب الخام هذا هو ميزة في acpx CLI (وليس مسار `agentId` العادي في OpenClaw).

يعتمد التحكم في النموذج على قدرات المحوّل. يطبّع OpenClaw مراجع نماذج Codex ACP قبل بدء التشغيل. تحتاج المسخّرات الأخرى إلى `models` في ACP بالإضافة إلى دعم `session/set_model`؛ إذا لم يعرّض مسخّر ما تلك القدرة في ACP ولا علم نموذج بدء التشغيل الخاص به، فلن يتمكن OpenClaw/acpx من فرض اختيار نموذج.

## التكوين المطلوب

خط أساس ACP الأساسي:

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

تكوين ربط السلاسل خاص بمحوّل القناة. مثال لـ Discord:

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

إذا لم يعمل إنشاء ACP المرتبط بالسلسلة، فتحقق أولًا من علم ميزة المحوّل:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

لا تتطلب روابط المحادثة الحالية إنشاء سلسلة فرعية. إنها تتطلب سياق محادثة نشطًا ومحوّل قناة يعرّض روابط محادثات ACP.

راجع [مرجع التكوين](/ar/gateway/configuration-reference).

## إعداد Plugin لواجهة acpx الخلفية

تستخدم التثبيتات المعبأة Plugin تشغيل `@openclaw/acpx` الرسمي لـ ACP.
ثبّته وفعّله قبل استخدام جلسات مسخّر ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

يمكن لنسخ المصدر أيضًا استخدام Plugin مساحة العمل المحلي بعد `pnpm install`.

ابدأ بـ:

```text
/acp doctor
```

إذا عطّلت `acpx`، أو منعته عبر `plugins.allow` / `plugins.deny`، أو أردت العودة إلى Plugin المعبأ، فاستخدم مسار الحزمة الصريح:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

تثبيت مساحة العمل المحلي أثناء التطوير:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

ثم تحقق من صحة الواجهة الخلفية:

```text
/acp doctor
```

### تكوين أمر acpx وإصداره

افتراضيًا، يسجّل Plugin `acpx` واجهة ACP الخلفية المضمّنة من دون تشغيل وكيل ACP أثناء بدء تشغيل Gateway. شغّل `/acp doctor` لإجراء فحص حي صريح. عيّن `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` فقط عندما تحتاج إلى أن يفحص Gateway الوكيل المكوّن عند بدء التشغيل.

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

- يقبل `command` مسارًا مطلقًا، أو مسارًا نسبيًا (يُحل من مساحة عمل OpenClaw)، أو اسم أمر.
- يعطّل `expectedVersion: "any"` مطابقة الإصدار الصارمة.
- تعطّل مسارات `command` المخصصة التثبيت التلقائي المحلي لـ Plugin.

راجع [Plugins](/ar/tools/plugin).

### تثبيت التبعيات تلقائيًا

عند تثبيت OpenClaw عموميًا باستخدام `npm install -g openclaw`، تُثبّت تبعيات تشغيل acpx (الثنائيات الخاصة بالمنصة) تلقائيًا عبر خطاف ما بعد التثبيت. إذا فشل التثبيت التلقائي، فسيظل Gateway يبدأ بشكل طبيعي ويبلغ عن التبعية المفقودة عبر `openclaw acp doctor`.

### جسر MCP لأدوات Plugin

افتراضيًا، لا تعرّض جلسات ACPX أدوات OpenClaw المسجّلة عبر Plugin إلى مسخّر ACP.

إذا كنت تريد من وكلاء ACP مثل Codex أو Claude Code استدعاء أدوات Plugin المثبتة في OpenClaw مثل استرجاع/تخزين الذاكرة، ففعّل الجسر المخصص:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

ما يفعله هذا:

- يحقن خادم MCP مضمّنًا باسم `openclaw-plugin-tools` في تمهيد جلسة ACPX.
- يعرّض أدوات Plugin المسجّلة مسبقًا بواسطة Plugins OpenClaw المثبتة والمفعّلة.
- يبقي الميزة صريحة ومعطّلة افتراضيًا.

ملاحظات الأمان والثقة:

- يوسّع هذا سطح أدوات مسخّر ACP.
- يحصل وكلاء ACP على الوصول فقط إلى أدوات Plugin النشطة مسبقًا في Gateway.
- تعامل مع هذا بصفته حد الثقة نفسه للسماح لتلك Plugins بالتنفيذ داخل OpenClaw نفسه.
- راجع Plugins المثبتة قبل تفعيله.

لا تزال `mcpServers` المخصصة تعمل كما كانت. جسر أدوات Plugin المضمّن هو تسهيل إضافي اختياري، وليس بديلًا عن تكوين خادم MCP العام.

### جسر MCP لأدوات OpenClaw

افتراضيًا، لا تعرّض جلسات ACPX أيضًا أدوات OpenClaw المضمّنة عبر MCP. فعّل جسر الأدوات الأساسية المنفصل عندما يحتاج وكيل ACP إلى أدوات مضمّنة محددة مثل `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

ما يفعله هذا:

- يحقن خادم MCP مضمّنًا باسم `openclaw-tools` في تمهيد جلسة ACPX.
- يعرّض أدوات OpenClaw المضمّنة المحددة. يعرّض الخادم الأولي `cron`.
- يبقي تعريض الأدوات الأساسية صريحًا ومعطّلًا افتراضيًا.

### تكوين مهلة التشغيل

يضبط Plugin `acpx` افتراضيًا مهلة دورات التشغيل المضمّنة على 120 ثانية. يمنح هذا المسخّرات الأبطأ مثل Gemini CLI وقتًا كافيًا لإكمال بدء تشغيل ACP وتهيئته. تجاوزه إذا كان المضيف لديك يحتاج إلى حد تشغيل مختلف:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

### تكوين وكيل فحص الصحة

عندما يفحص `/acp doctor` أو فحص بدء التشغيل الاختياري الواجهة الخلفية، يفحص Plugin `acpx` المجمّع وكيل مسخّر واحدًا. إذا تم تعيين `acp.allowedAgents`، فسيستخدم افتراضيًا أول وكيل مسموح؛ وإلا فسيستخدم `codex` افتراضيًا. إذا كان نشرُك يحتاج إلى وكيل ACP مختلف لفحوصات الصحة، فعيّن وكيل الفحص صراحةً:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

## تكوين الأذونات

تعمل جلسات ACP بشكل غير تفاعلي — لا توجد TTY للموافقة على مطالبات أذونات كتابة الملفات وتنفيذ أوامر shell أو رفضها. يوفر Plugin acpx مفتاحي تكوين يتحكمان في كيفية التعامل مع الأذونات:

تُعد أذونات مسخّر ACPX هذه منفصلة عن موافقات التنفيذ في OpenClaw ومنفصلة عن أعلام تجاوز مورّد واجهة CLI الخلفية مثل Claude CLI `--permission-mode bypassPermissions`. يُعد `approve-all` في ACPX مفتاح كسر الحاجز على مستوى المسخّر لجلسات ACP.

### `permissionMode`

يتحكم في العمليات التي يمكن لوكيل المسخّر تنفيذها من دون مطالبة.

| القيمة           | السلوك                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | الموافقة التلقائية على جميع عمليات كتابة الملفات وأوامر shell.          |
| `approve-reads` | الموافقة التلقائية على القراءات فقط؛ تتطلب الكتابات والتنفيذ مطالبات. |
| `deny-all`      | رفض جميع مطالبات الأذونات.                              |

### `nonInteractivePermissions`

يتحكم فيما يحدث عندما يُفترض عرض مطالبة إذن لكن لا تتوفر TTY تفاعلية (وهذا هو الحال دائمًا لجلسات ACP).

| القيمة  | السلوك                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | إجهاض الجلسة مع `AcpRuntimeError`. **(افتراضي)**           |
| `deny` | رفض الإذن بصمت والمتابعة (تدهور سلس). |

### التكوين

عيّنه عبر تكوين Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

أعد تشغيل Gateway بعد تغيير هذه القيم.

<Warning>
يستخدم OpenClaw افتراضيًا `permissionMode=approve-reads` و`nonInteractivePermissions=fail`. في جلسات ACP غير التفاعلية، يمكن أن يفشل أي تنفيذ للكتابة أو الأوامر يؤدي إلى مطالبة إذن مع `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

إذا كنت تحتاج إلى تقييد الأذونات، فعيّن `nonInteractivePermissions` إلى `deny` كي تتدهور الجلسات بسلاسة بدلًا من التعطل.
</Warning>

## ذات صلة

- [وكلاء ACP](/ar/tools/acp-agents) — النظرة العامة، ودليل تشغيل المشغّل، والمفاهيم
- [الوكلاء الفرعيون](/ar/tools/subagents)
- [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)
