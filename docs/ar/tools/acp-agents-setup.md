---
read_when:
    - تثبيت أو تكوين إطار acpx لـ Claude Code / Codex / Gemini CLI
    - تمكين جسر MCP لـ plugin-tools أو OpenClaw-tools
    - تكوين أوضاع أذونات ACP
summary: 'إعداد وكلاء ACP: تهيئة إطار acpx، إعداد Plugin، الأذونات'
title: وكلاء ACP — الإعداد
x-i18n:
    generated_at: "2026-04-30T08:27:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

للاطلاع على النظرة العامة ودليل تشغيل المشغّل والمفاهيم، راجع [وكلاء ACP](/ar/tools/acp-agents).

تغطي الأقسام أدناه إعداد حاضنة acpx، وإعداد Plugin لجسور MCP، وإعداد الأذونات.

استخدم هذه الصفحة فقط عند إعداد مسار ACP/acpx. لإعداد وقت تشغيل خادم تطبيق Codex الأصلي، استخدم [حاضنة Codex](/ar/plugins/codex-harness). لإعداد مفاتيح OpenAI API أو مزوّد نموذج Codex OAuth، استخدم
[OpenAI](/ar/providers/openai).

لدى Codex مساران في OpenClaw:

| المسار                      | الإعداد/الأمر                                         | صفحة الإعداد                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| خادم تطبيق Codex الأصلي    | `/codex ...`, `agentRuntime.id: "codex"`               | [حاضنة Codex](/ar/plugins/codex-harness) |
| محوّل Codex ACP الصريح | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | هذه الصفحة                               |

فضّل المسار الأصلي ما لم تكن تحتاج صراحة إلى سلوك ACP/acpx.

## دعم حاضنة acpx (حالي)

أسماء الحاضنات المستعارة المضمنة الحالية في acpx:

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

عندما يستخدم OpenClaw واجهة acpx الخلفية، فضّل هذه القيم لـ `agentId` ما لم يكن إعداد acpx لديك يعرّف أسماء مستعارة مخصصة للوكلاء.
إذا كان تثبيت Cursor المحلي لديك لا يزال يعرّض ACP على أنه `agent acp`، فتجاوز أمر وكيل `cursor` في إعداد acpx لديك بدلاً من تغيير الإعداد الافتراضي المضمن.

يمكن لاستخدام acpx CLI المباشر أيضًا استهداف محوّلات عشوائية عبر `--agent <command>`، لكن منفذ الهروب الخام هذا ميزة في acpx CLI (وليس مسار `agentId` العادي في OpenClaw).

يعتمد التحكم في النموذج على قدرات المحوّل. يطبّع OpenClaw مراجع نموذج Codex ACP قبل بدء التشغيل. تحتاج الحاضنات الأخرى إلى ACP `models` بالإضافة إلى دعم `session/set_model`؛ إذا لم تعرض الحاضنة تلك القدرة في ACP ولا علامة نموذج بدء تشغيل خاصة بها، فلا يستطيع OpenClaw/acpx فرض اختيار نموذج.

## الإعداد المطلوب

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

إعداد ربط السلاسل خاص بمحوّل القناة. مثال لـ Discord:

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

إذا لم يعمل إنشاء ACP المرتبط بالسلسلة، فتحقق أولاً من علامة ميزة المحوّل:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

لا تتطلب ارتباطات المحادثة الحالية إنشاء سلسلة فرعية. بل تتطلب سياق محادثة نشطًا ومحوّل قناة يعرّض ارتباطات محادثة ACP.

راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## إعداد Plugin لواجهة acpx الخلفية

تأتي التثبيتات الجديدة مع Plugin وقت تشغيل `acpx` المجمّع مفعّلًا افتراضيًا، لذلك يعمل ACP عادةً دون خطوة تثبيت Plugin يدوية.

ابدأ بـ:

```text
/acp doctor
```

إذا عطّلت `acpx`، أو منعته عبر `plugins.allow` / `plugins.deny`، أو أردت التبديل إلى نسخة تطوير محلية، فاستخدم مسار Plugin الصريح:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

التثبيت من مساحة عمل محلية أثناء التطوير:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

ثم تحقق من صحة الواجهة الخلفية:

```text
/acp doctor
```

### إعداد أمر acpx وإصداره

افتراضيًا، يسجل Plugin `acpx` المجمّع واجهة ACP الخلفية المضمنة دون إنشاء وكيل ACP أثناء بدء تشغيل Gateway. شغّل `/acp doctor` لإجراء فحص حي صريح. اضبط `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` فقط عندما تحتاج إلى أن يفحص Gateway الوكيل المعدّ عند بدء التشغيل.

تجاوز الأمر أو الإصدار في إعداد Plugin:

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
- تعطّل مسارات `command` المخصصة التثبيت التلقائي المحلي للـ Plugin.

راجع [Plugins](/ar/tools/plugin).

### تثبيت التبعيات تلقائيًا

عند تثبيت OpenClaw عالميًا باستخدام `npm install -g openclaw`، تُثبّت تبعيات وقت تشغيل acpx (الثنائيات الخاصة بالمنصة) تلقائيًا عبر خطاف postinstall. إذا فشل التثبيت التلقائي، يستمر Gateway في البدء بشكل طبيعي ويبلّغ عن التبعية المفقودة من خلال `openclaw acp doctor`.

### جسر MCP لأدوات Plugin

افتراضيًا، لا تعرّض جلسات ACPX أدوات OpenClaw المسجلة عبر Plugin إلى حاضنة ACP.

إذا أردت أن يتمكن وكلاء ACP مثل Codex أو Claude Code من استدعاء أدوات Plugin المثبتة في OpenClaw مثل استرجاع/تخزين الذاكرة، ففعّل الجسر المخصص:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

ما يفعله هذا:

- يحقن خادم MCP مضمنًا باسم `openclaw-plugin-tools` في تمهيد جلسة ACPX.
- يعرّض أدوات Plugin المسجلة مسبقًا بواسطة Plugins المثبتة والمفعّلة في OpenClaw.
- يبقي الميزة صريحة ومعطلة افتراضيًا.

ملاحظات الأمان والثقة:

- يوسّع هذا سطح أدوات حاضنة ACP.
- يحصل وكلاء ACP على الوصول فقط إلى أدوات Plugin النشطة بالفعل في Gateway.
- تعامل مع هذا على أنه حد الثقة نفسه المتمثل في السماح لتلك Plugins بالتنفيذ داخل OpenClaw نفسه.
- راجع Plugins المثبتة قبل تفعيله.

تظل `mcpServers` المخصصة تعمل كما كانت. جسر أدوات Plugin المضمن ميزة راحة إضافية اختيارية، وليس بديلًا لإعداد خادم MCP العام.

### جسر MCP لأدوات OpenClaw

افتراضيًا، لا تعرّض جلسات ACPX أيضًا أدوات OpenClaw المضمنة عبر MCP. فعّل جسر أدوات النواة المنفصل عندما يحتاج وكيل ACP إلى أدوات مدمجة محددة مثل `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

ما يفعله هذا:

- يحقن خادم MCP مضمنًا باسم `openclaw-tools` في تمهيد جلسة ACPX.
- يعرّض أدوات OpenClaw مدمجة مختارة. يعرّض الخادم الأولي `cron`.
- يبقي تعريض أدوات النواة صريحًا ومعطلًا افتراضيًا.

### إعداد مهلة وقت التشغيل

يضبط Plugin `acpx` المجمّع مهلة المنعطفات المضمنة في وقت التشغيل افتراضيًا على 120 ثانية. يمنح هذا الحاضنات الأبطأ مثل Gemini CLI وقتًا كافيًا لإكمال بدء تشغيل ACP وتهيئته. تجاوزه إذا كان مضيفك يحتاج حدًا مختلفًا لوقت التشغيل:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

### إعداد وكيل فحص الصحة

عندما يتحقق `/acp doctor` أو فحص بدء التشغيل الاختياري من الواجهة الخلفية، يفحص Plugin `acpx` المجمّع وكيل حاضنة واحدًا. إذا كان `acp.allowedAgents` مضبوطًا، فإنه يستخدم افتراضيًا أول وكيل مسموح؛ وإلا فإنه يستخدم `codex` افتراضيًا. إذا كان نشرُك يحتاج وكيل ACP مختلفًا لفحوصات الصحة، فاضبط وكيل الفحص صراحةً:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

## إعداد الأذونات

تعمل جلسات ACP دون تفاعل؛ لا يوجد TTY للموافقة على مطالبات أذونات كتابة الملفات وتنفيذ أوامر الصدفة أو رفضها. يوفر Plugin acpx مفتاحي إعداد يتحكمان في كيفية التعامل مع الأذونات:

أذونات حاضنة ACPX هذه منفصلة عن موافقات التنفيذ في OpenClaw ومنفصلة عن علامات تجاوز مورّد واجهة CLI الخلفية مثل Claude CLI `--permission-mode bypassPermissions`. يعد ACPX `approve-all` مفتاح الطوارئ على مستوى الحاضنة لجلسات ACP.

### `permissionMode`

يتحكم في العمليات التي يمكن لوكيل الحاضنة تنفيذها دون مطالبة.

| القيمة           | السلوك                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | يوافق تلقائيًا على جميع عمليات كتابة الملفات وأوامر الصدفة.          |
| `approve-reads` | يوافق تلقائيًا على القراءات فقط؛ تتطلب الكتابات والتنفيذ مطالبات. |
| `deny-all`      | يرفض جميع مطالبات الأذونات.                              |

### `nonInteractivePermissions`

يتحكم فيما يحدث عندما يُفترض عرض مطالبة إذن لكن لا يتوفر TTY تفاعلي (وهذا هو الحال دائمًا لجلسات ACP).

| القيمة  | السلوك                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | يجهض الجلسة مع `AcpRuntimeError`. **(افتراضي)**           |
| `deny` | يرفض الإذن بصمت ويستمر (تدهور سلس). |

### الإعداد

اضبط عبر إعداد Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

أعد تشغيل Gateway بعد تغيير هذه القيم.

<Warning>
يضبط OpenClaw افتراضيًا `permissionMode=approve-reads` و`nonInteractivePermissions=fail`. في جلسات ACP غير التفاعلية، يمكن لأي كتابة أو تنفيذ يطلق مطالبة إذن أن يفشل مع `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

إذا كنت تحتاج إلى تقييد الأذونات، فاضبط `nonInteractivePermissions` على `deny` حتى تتدهور الجلسات بسلاسة بدلًا من التعطل.
</Warning>

## ذات صلة

- [وكلاء ACP](/ar/tools/acp-agents) — النظرة العامة، دليل تشغيل المشغّل، المفاهيم
- [الوكلاء الفرعيون](/ar/tools/subagents)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
