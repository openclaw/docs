---
read_when:
    - تثبيت أو إعداد acpx harness لـ Claude Code / Codex / Gemini CLI
    - تمكين جسر MCP الخاص بـ plugin-tools أو OpenClaw-tools
    - تكوين أوضاع أذونات ACP
summary: 'إعداد وكلاء ACP: تهيئة حزمة acpx، إعداد Plugin، الأذونات'
title: وكلاء ACP — الإعداد
x-i18n:
    generated_at: "2026-06-27T18:38:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

للحصول على النظرة العامة، ودليل تشغيل المشغّل، والمفاهيم، راجع [وكلاء ACP](/ar/tools/acp-agents).

تغطي الأقسام أدناه إعداد acpx harness، وإعداد Plugin لجسور MCP، وإعداد الأذونات.

استخدم هذه الصفحة فقط عند إعداد مسار ACP/acpx. لإعدادات وقت تشغيل خادم تطبيق Codex الأصلية، استخدم [Codex harness](/ar/plugins/codex-harness). ولمفاتيح OpenAI API أو إعداد موفّر النماذج Codex OAuth، استخدم
[OpenAI](/ar/providers/openai).

لدى Codex مساران في OpenClaw:

| المسار                    | الإعداد/الأمر                                            | صفحة الإعداد                            |
| ------------------------- | -------------------------------------------------------- | --------------------------------------- |
| خادم تطبيق Codex الأصلي   | `/codex ...`, `openai/gpt-*` agent refs                  | [Codex harness](/ar/plugins/codex-harness) |
| محوّل Codex ACP الصريح    | `/acp spawn codex`, `runtime: "acp", agentId: "codex"`   | هذه الصفحة                              |

فضّل المسار الأصلي ما لم تكن تحتاج صراحة إلى سلوك ACP/acpx.

## دعم acpx harness (الحالي)

أسماء acpx built-in harness المستعارة الحالية:

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
- `qwen`

عندما يستخدم OpenClaw خلفية acpx، فضّل هذه القيم لـ `agentId` ما لم يعرّف إعداد acpx لديك أسماء وكلاء مستعارة مخصصة.
إذا كان تثبيت Cursor المحلي لديك لا يزال يعرّض ACP باسم `agent acp`، فتجاوز أمر وكيل `cursor` في إعداد acpx بدل تغيير الإعداد الافتراضي المضمّن.

يمكن لاستخدام acpx CLI المباشر أيضًا استهداف محوّلات عشوائية عبر `--agent <command>`، لكن منفذ الهروب الخام هذا ميزة في acpx CLI (وليس مسار `agentId` العادي في OpenClaw).

يعتمد التحكم في النموذج على قدرات المحوّل. يطبّع OpenClaw مراجع نماذج Codex ACP قبل بدء التشغيل. تحتاج harnesses الأخرى إلى ACP `models` إضافة إلى دعم `session/set_model`؛ وإذا لم يعرّض harness تلك القدرة في ACP ولا علم نموذج بدء التشغيل الخاص به، فلن يستطيع OpenClaw/acpx فرض اختيار نموذج.

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
      "openclaw",
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

إعداد ربط الخيوط خاص بمحوّل القناة. مثال لـ Discord:

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

إذا لم يعمل إنشاء ACP المربوط بخيط، فتحقق أولًا من علامة ميزة المحوّل:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

لا تتطلب روابط المحادثة الحالية إنشاء خيط فرعي. إنها تتطلب سياق محادثة نشطًا ومحوّل قناة يعرّض روابط محادثات ACP.

راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## إعداد Plugin لخلفية acpx

تستخدم التثبيتات المعبأة Plugin وقت التشغيل الرسمي `@openclaw/acpx` لـ ACP.
ثبّته وفعّله قبل استخدام جلسات ACP harness:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

يمكن لنسخ المصدر أيضًا استخدام Plugin مساحة العمل المحلية بعد `pnpm install`.

ابدأ بـ:

```text
/acp doctor
```

إذا عطّلت `acpx`، أو رفضته عبر `plugins.allow` / `plugins.deny`، أو أردت الرجوع إلى Plugin المعبأ، فاستخدم مسار الحزمة الصريح:

```bash
openclaw plugins install @openclaw/acpx
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

### إعداد أمر وإصدار acpx

افتراضيًا، يسجّل Plugin `acpx` خلفية ACP المضمّنة أثناء بدء تشغيل Gateway وينتظر مسبار بدء تشغيل وقت التشغيل المضمّن قبل إشارة `ready` الخاصة بالبوابة. عيّن `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` أو
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` فقط للسكربتات أو البيئات التي تبقي مسبار بدء التشغيل معطّلًا عمدًا. شغّل `/acp doctor` لإجراء مسبار صريح عند الطلب.

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

تجاوز أمر وكيل ACP فردي بوسيطات منظّمة عندما ينبغي أن يبقى المسار أو قيمة العلم رمز argv واحدًا:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` هو الملف التنفيذي أو سلسلة الأمر الموجودة لذلك وكيل ACP.
- `agents.<id>.args` اختياري. يُقتبس كل عنصر في المصفوفة بأسلوب shell قبل أن يمرره OpenClaw عبر سجل سلاسل أوامر acpx الحالي.

راجع [Plugins](/ar/tools/plugin).

### تثبيت التبعيات تلقائيًا

عند تثبيت OpenClaw عالميًا باستخدام `npm install -g openclaw`، تُثبّت تبعيات وقت تشغيل acpx (الثنائيات الخاصة بالمنصة) تلقائيًا عبر خطاف postinstall. إذا فشل التثبيت التلقائي، فسيظل Gateway يبدأ بشكل طبيعي ويبلغ عن التبعية المفقودة عبر `openclaw acp doctor`.

### جسر MCP لأدوات Plugin

افتراضيًا، لا تعرّض جلسات ACPX أدوات OpenClaw المسجلة بواسطة Plugin إلى ACP harness.

إذا أردت أن تستدعي وكلاء ACP مثل Codex أو Claude Code أدوات OpenClaw Plugin المثبتة مثل استدعاء/تخزين الذاكرة، ففعّل الجسر المخصص:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

ما يفعله هذا:

- يحقن خادم MCP مضمّنًا باسم `openclaw-plugin-tools` في تمهيد جلسة ACPX.
- يعرّض أدوات Plugin المسجلة مسبقًا بواسطة Plugins OpenClaw المثبتة والمفعّلة.
- يبقي الميزة صريحة ومعطّلة افتراضيًا.

ملاحظات الأمان والثقة:

- يوسّع هذا سطح أدوات ACP harness.
- يحصل وكلاء ACP على حق الوصول فقط إلى أدوات Plugin النشطة مسبقًا في Gateway.
- تعامل مع هذا باعتباره حد الثقة نفسه مثل السماح لتلك Plugins بالتنفيذ داخل OpenClaw نفسه.
- راجع Plugins المثبتة قبل تفعيله.

لا تزال `mcpServers` المخصصة تعمل كما في السابق. جسر plugin-tools المضمّن وسيلة راحة إضافية اختيارية، وليس بديلًا لإعداد خوادم MCP العام.

### جسر MCP لأدوات OpenClaw

افتراضيًا، لا تعرّض جلسات ACPX أيضًا أدوات OpenClaw المضمّنة عبر MCP. فعّل جسر أدوات النواة المنفصل عندما يحتاج وكيل ACP إلى أدوات مضمّنة محددة مثل `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

ما يفعله هذا:

- يحقن خادم MCP مضمّنًا باسم `openclaw-tools` في تمهيد جلسة ACPX.
- يعرّض أدوات OpenClaw المضمّنة المحددة. يعرّض الخادم الأولي `cron`.
- يبقي تعريض أدوات النواة صريحًا ومعطّلًا افتراضيًا.

### إعداد مهلة عمليات وقت التشغيل

يمنح Plugin `acpx` عمليات بدء تشغيل وقت التشغيل المضمّن وعمليات التحكم 120 ثانية افتراضيًا. يمنح ذلك harnesses الأبطأ مثل Gemini CLI وقتًا كافيًا لإكمال بدء تشغيل ACP وتهيئته. تجاوزه إذا كان مضيفك يحتاج إلى حد عمليات مختلف:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

تستخدم دورات وقت التشغيل مهل وكيل/تشغيل OpenClaw، بما في ذلك `/acp timeout`.
لا يقبل `sessions_spawn` تجاوزات مهلة لكل استدعاء. أعد تشغيل Gateway بعد تغيير هذه القيمة.

### إعداد وكيل مسبار الصحة

عندما يفحص `/acp doctor` أو مسبار بدء التشغيل الخلفية، يختبر Plugin `acpx` المضمّن وكيل harness واحدًا. إذا كان `acp.allowedAgents` مضبوطًا، فسيستخدم افتراضيًا أول وكيل مسموح؛ وإلا فسيستخدم افتراضيًا `codex`. إذا كان نشرُك يحتاج إلى وكيل ACP مختلف لفحوصات الصحة، فاضبط وكيل المسبار صراحة:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

## إعداد الأذونات

تعمل جلسات ACP بشكل غير تفاعلي — لا يوجد TTY للموافقة على مطالبات أذونات كتابة الملفات وتنفيذ أوامر shell أو رفضها. يوفر Plugin acpx مفتاحي إعداد يتحكمان في كيفية معالجة الأذونات:

أذونات ACPX harness هذه منفصلة عن موافقات تنفيذ OpenClaw ومنفصلة عن أعلام تجاوز موردي خلفية CLI مثل Claude CLI `--permission-mode bypassPermissions`. إن ACPX `approve-all` هو مفتاح الطوارئ على مستوى harness لجلسات ACP.

للمقارنة الأوسع بين OpenClaw `tools.exec.mode`، وموافقات Codex Guardian، وأذونات ACPX harness، راجع
[أوضاع الأذونات](/ar/tools/permission-modes).

### `permissionMode`

يتحكم في العمليات التي يستطيع وكيل harness تنفيذها دون مطالبة.

| القيمة          | السلوك                                                   |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | الموافقة تلقائيًا على كل عمليات كتابة الملفات وأوامر shell. |
| `approve-reads` | الموافقة تلقائيًا على القراءات فقط؛ تتطلب الكتابات والتنفيذ مطالبات. |
| `deny-all`      | رفض كل مطالبات الأذونات.                                |

### `nonInteractivePermissions`

يتحكم فيما يحدث عندما يفترض أن تظهر مطالبة إذن لكن لا يتوفر TTY تفاعلي (وهذا هو الحال دائمًا في جلسات ACP).

| القيمة | السلوك                                                              |
| ------ | ------------------------------------------------------------------- |
| `fail` | إجهاض الجلسة مع `AcpRuntimeError`. **(افتراضي)**                    |
| `deny` | رفض الإذن بصمت والمتابعة (تدهور سلس).                               |

### الإعداد

اضبط عبر إعداد Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

أعد تشغيل Gateway بعد تغيير هذه القيم.

<Warning>
يستخدم OpenClaw افتراضيًا `permissionMode=approve-reads` و`nonInteractivePermissions=fail`. في جلسات ACP غير التفاعلية، قد يفشل أي تنفيذ كتابة أو exec يطلق مطالبة إذن برسالة `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

إذا كنت تحتاج إلى تقييد الأذونات، فاضبط `nonInteractivePermissions` على `deny` كي تتدهور الجلسات بسلاسة بدلًا من الانهيار.
</Warning>

## ذات صلة

- [وكلاء ACP](/ar/tools/acp-agents) — النظرة العامة، دليل تشغيل المشغّل، المفاهيم
- [الوكلاء الفرعيون](/ar/tools/subagents)
- [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)
