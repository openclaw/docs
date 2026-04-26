---
read_when:
    - تثبيت أو تهيئة acpx harness لـ Claude Code / Codex / Gemini CLI
    - تمكين جسر MCP الخاص بـ plugin-tools أو OpenClaw-tools
    - تهيئة أوضاع صلاحيات ACP
summary: 'إعداد وكلاء ACP: إعدادات acpx harness، وإعداد Plugin، والصلاحيات'
title: وكلاء ACP — الإعداد
x-i18n:
    generated_at: "2026-04-26T11:40:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

للاطلاع على النظرة العامة، ودليل تشغيل المشغّل، والمفاهيم، راجع [وكلاء ACP](/ar/tools/acp-agents).

تغطي الأقسام أدناه إعدادات acpx harness، وإعداد Plugin لجسور MCP، وإعدادات الصلاحيات.

استخدم هذه الصفحة فقط عندما تقوم بإعداد مسار ACP/acpx. أما بالنسبة إلى إعدادات
وقت تشغيل Codex app-server الأصلية، فاستخدم [Codex harness](/ar/plugins/codex-harness). وبالنسبة إلى
مفاتيح OpenAI API أو إعدادات مزوّد النماذج الخاصة بـ Codex OAuth، فاستخدم
[OpenAI](/ar/providers/openai).

يملك Codex مسارين في OpenClaw:

| المسار                     | الإعداد/الأمر                                             | صفحة الإعداد                         |
| -------------------------- | --------------------------------------------------------- | ------------------------------------ |
| Codex app-server الأصلي    | `/codex ...`, `agentRuntime.id: "codex"`                  | [Codex harness](/ar/plugins/codex-harness) |
| محول Codex ACP الصريح      | `/acp spawn codex`, `runtime: "acp", agentId: "codex"`    | هذه الصفحة                           |

فضّل المسار الأصلي ما لم تكن تحتاج صراحةً إلى سلوك ACP/acpx.

## دعم acpx harness ‏(الحالي)

الأسماء البديلة الحالية المضمّنة في acpx harness:

- `claude`
- `codex`
- `copilot`
- `cursor` ‏(Cursor CLI: ‏`cursor-agent acp`)
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

عندما يستخدم OpenClaw الواجهة الخلفية acpx، ففضّل هذه القيم في `agentId` ما لم تكن إعدادات acpx الخاصة بك تعرّف أسماء بديلة مخصصة للوكلاء.
إذا كان تثبيت Cursor المحلي لديك لا يزال يكشف ACP باسم `agent acp`، فتجاوز أمر الوكيل `cursor` في إعدادات acpx بدلًا من تغيير القيمة المضمّنة الافتراضية.

يمكن أيضًا لاستخدام acpx CLI المباشر أن يستهدف محولات اعتباطية عبر `--agent <command>`، لكن مخرج الهروب الخام هذا هو ميزة في acpx CLI ‏(وليس مسار `agentId` العادي في OpenClaw).

يعتمد التحكم في النموذج على قدرات المحول. وتُطبّع مراجع نماذج Codex ACP بواسطة
OpenClaw قبل البدء. أما الـ harness الأخرى فتحتاج إلى ACP `models` بالإضافة إلى
دعم `session/set_model`؛ وإذا كانت harness لا تكشف لا عن قدرة ACP هذه
ولا عن علم بدء تشغيل خاص بها للنموذج، فلن يستطيع OpenClaw/acpx فرض اختيار نموذج.

## الإعدادات المطلوبة

خط الأساس الأساسي لـ ACP:

```json5
{
  acp: {
    enabled: true,
    // اختياري. الافتراضي true؛ اضبطه على false لإيقاف إرسال ACP مؤقتًا مع الإبقاء على عناصر التحكم /acp.
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

تعتمد إعدادات ربط الخيوط على مهايئ القناة. مثال لـ Discord:

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

إذا لم يعمل إنشاء ACP المرتبط بالخيط، فتحقق أولًا من علامة ميزة المهايئ:

- Discord: ‏`channels.discord.threadBindings.spawnAcpSessions=true`

لا تتطلب عمليات الربط بالمحادثة الحالية إنشاء خيط فرعي. لكنها تتطلب سياق محادثة نشطًا ومهايئ قناة يكشف عن روابط محادثة ACP.

راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## إعداد Plugin للواجهة الخلفية acpx

تأتي التثبيتات الجديدة مع Plugin وقت التشغيل المضمّنة `acpx` مفعّلة افتراضيًا، لذلك يعمل ACP
عادةً من دون خطوة تثبيت Plugin يدوية.

ابدأ بـ:

```text
/acp doctor
```

إذا كنت قد عطّلت `acpx`، أو منعتها عبر `plugins.allow` / `plugins.deny`، أو تريد
الانتقال إلى نسخة تطوير محلية، فاستخدم مسار Plugin الصريح:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

تثبيت مساحة عمل محلية أثناء التطوير:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

ثم تحقق من سلامة الواجهة الخلفية:

```text
/acp doctor
```

### إعدادات الأمر والإصدار لـ acpx

افتراضيًا، تسجّل Plugin المضمّنة `acpx` الواجهة الخلفية المضمّنة لـ ACP من دون
تشغيل ACP agent أثناء بدء Gateway. شغّل `/acp doctor` لإجراء
مجس حي صريح. واضبط `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` فقط عندما تحتاج إلى أن
تقوم Gateway بفحص الوكيل المُهيأ عند البدء.

تجاوز الأمر أو الإصدار في إعدادات Plugin:

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
- يؤدي `expectedVersion: "any"` إلى تعطيل مطابقة الإصدار الصارمة.
- تؤدي مسارات `command` المخصصة إلى تعطيل التثبيت التلقائي المحلي للـ Plugin.

راجع [Plugins](/ar/tools/plugin).

### التثبيت التلقائي للتبعيات

عندما تثبّت OpenClaw عالميًا باستخدام `npm install -g openclaw`، تُثبَّت
تبعيات وقت التشغيل الخاصة بـ acpx ‏(الثنائيات الخاصة بكل منصة) تلقائيًا
عبر خطاف postinstall. وإذا فشل التثبيت التلقائي، فستبدأ gateway مع ذلك
بشكل طبيعي وتبلّغ عن التبعية المفقودة عبر `openclaw acp doctor`.

### جسر MCP لأدوات Plugin

افتراضيًا، لا تكشف جلسات ACPX **عن** أدوات OpenClaw المسجلة بواسطة Plugins لـ
ACP harness.

إذا كنت تريد أن تستدعي وكلاء ACP مثل Codex أو Claude Code
أدوات Plugin المثبتة في OpenClaw مثل استرجاع/تخزين الذاكرة، ففعّل الجسر المخصص:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

ما الذي يفعله هذا:

- يحقن خادم MCP مضمّنًا باسم `openclaw-plugin-tools` في bootstrap الخاصة
  بجلسة ACPX.
- يكشف أدوات Plugins المسجلة بالفعل بواسطة Plugins OpenClaw المثبتة والمفعّلة.
- يبقي الميزة صريحة ومعطلة افتراضيًا.

ملاحظات الأمان والثقة:

- هذا يوسّع سطح أدوات ACP harness.
- يحصل وكلاء ACP فقط على أدوات Plugins النشطة بالفعل في gateway.
- تعامل مع هذا على أنه نفس حدود الثقة التي تنطبق عندما تسمح لتلك Plugins بالتنفيذ داخل
  OpenClaw نفسها.
- راجع Plugins المثبتة قبل التمكين.

لا تزال `mcpServers` المخصصة تعمل كما كانت من قبل. ويُعد الجسر المضمّن plugin-tools
ميزة راحة إضافية بالاشتراك، وليس بديلًا عن إعدادات خادم MCP العامة.

### جسر MCP لأدوات OpenClaw

افتراضيًا، لا تكشف جلسات ACPX أيضًا **عن** أدوات OpenClaw المضمّنة عبر
MCP. فعّل جسر الأدوات الأساسية المنفصل عندما يحتاج وكيل ACP إلى أدوات
مضمّنة محددة مثل `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

ما الذي يفعله هذا:

- يحقن خادم MCP مضمّنًا باسم `openclaw-tools` في bootstrap الخاصة
  بجلسة ACPX.
- يكشف أدوات OpenClaw المضمّنة المحددة. ويكشف الخادم الأولي الأداة `cron`.
- يبقي كشف الأدوات الأساسية صريحًا ومعطّلًا افتراضيًا.

### إعداد مهلة وقت التشغيل

تضبط Plugin المضمّنة `acpx` افتراضيًا مهلة 120 ثانية
لأدوار وقت التشغيل المضمّن. وهذا يمنح harnesses الأبطأ مثل Gemini CLI وقتًا كافيًا لإكمال
بدء ACP وتهيئته. تجاوزها إذا كان مضيفك يحتاج إلى حد مختلف
لوقت التشغيل:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

أعد تشغيل gateway بعد تغيير هذه القيمة.

### إعدادات وكيل مجس السلامة

عندما يفحص `/acp doctor` أو مجس البدء الاختياري الواجهة الخلفية، تقوم Plugin المضمّنة
`acpx` بفحص وكيل harness واحد. وإذا تم تعيين `acp.allowedAgents`، فسيكون الافتراضي
هو أول وكيل مسموح؛ وإلا فسيكون الافتراضي `codex`. وإذا كان
نشرُك يحتاج إلى وكيل ACP مختلف لفحوصات السلامة، فاضبط وكيل المجس صراحةً:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

أعد تشغيل gateway بعد تغيير هذه القيمة.

## إعدادات الصلاحيات

تعمل جلسات ACP بشكل غير تفاعلي — فلا توجد TTY للموافقة أو الرفض على مطالبات صلاحيات كتابة الملفات أو تنفيذ shell. وتوفّر Plugin acpx مفتاحي إعدادات يتحكمان في كيفية التعامل مع الصلاحيات:

تعد صلاحيات ACPX harness هذه منفصلة عن موافقات exec في OpenClaw ومنفصلة عن أعلام تجاوز المزوّدات الخاصة بواجهات CLI الخلفية مثل Claude CLI ‏`--permission-mode bypassPermissions`. ويمثل ACPX ‏`approve-all` مفتاح الكسر الزجاجي على مستوى harness لجلسات ACP.

### `permissionMode`

يتحكم في العمليات التي يمكن لوكيل harness تنفيذها من دون مطالبة.

| القيمة            | السلوك                                                    |
| ----------------- | --------------------------------------------------------- |
| `approve-all`     | الموافقة التلقائية على جميع عمليات كتابة الملفات وأوامر shell. |
| `approve-reads`   | الموافقة التلقائية على القراءات فقط؛ أما الكتابة وexec فتتطلبان مطالبات. |
| `deny-all`        | رفض جميع مطالبات الصلاحيات.                               |

### `nonInteractivePermissions`

يتحكم في ما يحدث عندما تكون مطالبة صلاحية ستظهر ولكن لا تتوفر TTY تفاعلية (وهذا هو الحال دائمًا في جلسات ACP).

| القيمة | السلوك                                                                 |
| ------ | ---------------------------------------------------------------------- |
| `fail` | إجهاض الجلسة مع `AcpRuntimeError`. **(الافتراضي)**                     |
| `deny` | رفض الصلاحية بصمت والمتابعة (تدهور سلس).                               |

### الإعدادات

اضبطها عبر إعدادات Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

أعد تشغيل gateway بعد تغيير هذه القيم.

> **مهم:** يستخدم OpenClaw حاليًا افتراضيًا `permissionMode=approve-reads` و`nonInteractivePermissions=fail`. وفي جلسات ACP غير التفاعلية، قد تفشل أي عملية كتابة أو exec تطلق مطالبة صلاحية مع الخطأ `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> إذا كنت تحتاج إلى تقييد الصلاحيات، فاضبط `nonInteractivePermissions` إلى `deny` حتى تتدهور الجلسات بشكل سلس بدلًا من أن تتعطل.

## ذو صلة

- [وكلاء ACP](/ar/tools/acp-agents) — نظرة عامة، ودليل تشغيل المشغّل، والمفاهيم
- [الوكلاء الفرعيون](/ar/tools/subagents)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
