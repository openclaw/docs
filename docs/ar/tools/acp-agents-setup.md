---
read_when:
    - تثبيت أو إعداد أداة acpx لـ Claude Code / Codex / Gemini CLI
    - تمكين جسر MCP لأدوات Plugin أو أدوات OpenClaw
    - تكوين أوضاع أذونات ACP
summary: 'إعداد وكلاء ACP: تهيئة أداة acpx، وإعداد Plugin، والأذونات'
title: وكلاء ACP — الإعداد
x-i18n:
    generated_at: "2026-07-16T15:10:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

للاطلاع على النظرة العامة ودليل تشغيل المشغّل والمفاهيم، راجع [وكلاء ACP](/ar/tools/acp-agents).

تتناول هذه الصفحة إعدادات أداة acpx، وإعداد Plugin لجسور MCP، وإعدادات الأذونات.

استخدم هذه الصفحة فقط عند إعداد مسار ACP/acpx. لإعدادات وقت تشغيل
خادم تطبيق Codex الأصلي، استخدم [أداة Codex](/ar/plugins/codex-harness). ولمفاتيح
OpenAI API أو إعدادات موفّر النماذج عبر Codex OAuth، استخدم
[OpenAI](/ar/providers/openai).

لدى Codex مساران في OpenClaw:

| المسار                      | الإعداد/الأمر                                         | صفحة الإعداد                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| خادم تطبيق Codex الأصلي    | `/codex ...`، ومراجع الوكيل `openai/gpt-*`                | [أداة Codex](/ar/plugins/codex-harness) |
| محوّل Codex ACP الصريح | `/acp spawn codex`، `runtime: "acp", agentId: "codex"` | هذه الصفحة                               |

فضّل المسار الأصلي ما لم تكن تحتاج صراحةً إلى سلوك ACP/acpx.

## دعم أداة acpx (الحالي)

الأسماء المستعارة المضمّنة لأداة acpx (من تبعية `acpx` المثبّتة):

| الاسم المستعار        | يغلّف                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | جسر OpenClaw ACP (`openclaw acp` أصلي)                                                                     |
| `pi`         | [وكيل البرمجة Pi](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

يُحلّ كل من `factory-droid` و`factorydroid` أيضًا إلى محوّل `droid` المضمّن.

عندما يستخدم OpenClaw الواجهة الخلفية acpx، فضّل هذه القيم لـ `agentId` ما لم يعرّف إعداد acpx لديك أسماء مستعارة مخصّصة للوكلاء.
إذا كان تثبيت Cursor المحلي لديك لا يزال يعرض ACP باسم `agent acp`، فتجاوز أمر الوكيل `cursor` في إعداد acpx بدلًا من تغيير القيمة الافتراضية المضمّنة.

يمكن أيضًا لاستخدام acpx CLI المباشر استهداف محوّلات عشوائية عبر `--agent <command>`، لكن منفذ التجاوز الخام هذا ميزة في acpx CLI (وليس مسار OpenClaw `agentId` المعتاد).

يعتمد التحكم في النموذج على إمكانات المحوّل. يطبّع OpenClaw مراجع نماذج Codex ACP
قبل بدء التشغيل. تحتاج الأدوات الأخرى إلى دعم ACP `models` بالإضافة إلى
`session/set_model`؛ وإذا لم تعرض الأداة إمكانية ACP تلك
ولا خيار نموذج خاصًا بها عند بدء التشغيل، فلن يتمكن OpenClaw/acpx من فرض اختيار نموذج.

## الإعداد المطلوب

خط أساس ACP الأساسي:

```json5
{
  acp: {
    enabled: true,
    // اختياري. القيمة الافتراضية true؛ اضبطها على false لإيقاف إرسال ACP مؤقتًا مع الإبقاء على عناصر تحكم /acp.
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
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // القيم الافتراضية هي coalesceIdleMs: 350 وmaxChunkChars: 1800؛ وهي معروضة هنا صراحةً.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

إعداد ربط سلاسل المحادثات خاص بمحوّل القناة. مثال لـ Discord:

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
        // القيمة الافتراضية هي true بالفعل؛ وهي معروضة هنا صراحةً.
        spawnSessions: true,
      },
    },
  },
}
```

إذا لم يعمل إنشاء ACP المرتبط بسلسلة محادثة، فتحقق أولًا من علامة ميزة المحوّل:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

لا تتطلب عمليات الربط بالمحادثة الحالية إنشاء سلسلة فرعية. بل تتطلب سياق محادثة نشطًا ومحوّل قناة يعرض عمليات ربط محادثات ACP.

راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## إعداد Plugin للواجهة الخلفية acpx

تستخدم عمليات التثبيت المعبّأة Plugin وقت التشغيل الرسمي `@openclaw/acpx` لـ ACP.
ثبّته ومكّنه قبل استخدام جلسات أدوات ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

يمكن لنسخ المصدر أيضًا استخدام Plugin مساحة العمل المحلي بعد `pnpm install`.

ابدأ بـ:

```text
/acp doctor
```

إذا عطّلت `acpx`، أو رفضته عبر `plugins.allow` / `plugins.deny`، أو أردت
العودة إلى Plugin المعبّأ، فاستخدم مسار الحزمة الصريح:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

تثبيت مساحة العمل المحلية أثناء التطوير:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

ثم تحقق من سلامة الواجهة الخلفية:

```text
/acp doctor
```

### اختبار بدء تشغيل وقت تشغيل acpx

يدمج Plugin `acpx` وقت تشغيل ACP مباشرةً (من دون ملف تنفيذي `acpx` منفصل أو
إصدار لإعداده). ويسجّل افتراضيًا الواجهة الخلفية المضمّنة أثناء
بدء تشغيل Gateway وينتظر اختبار بدء التشغيل قبل إشارة gateway `ready`.
اضبط `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` أو
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` فقط للبرامج النصية أو البيئات التي
تُبقي اختبار بدء التشغيل معطّلًا عمدًا. شغّل `/acp doctor` لإجراء اختبار صريح
عند الطلب.

تجاوز أمر وكيل ACP فردي باستخدام وسائط منظّمة عندما ينبغي أن يبقى المسار
أو قيمة الخيار رمز argv واحدًا:

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

- `agents.<id>.command` هو الملف التنفيذي أو سلسلة الأوامر الموجودة لوكيل ACP ذاك.
- `agents.<id>.args` اختياري. يُقتبس كل عنصر في المصفوفة وفق قواعد الصدفة قبل أن يمرره OpenClaw عبر سجل سلسلة أوامر acpx الحالي.

راجع [Plugins](/ar/tools/plugin).

### التنزيل التلقائي للمحوّل

ينزّل `acpx` محوّلات ACP تلقائيًا (مثل جسري Claude وCodex ACP)
عبر `npx` عند أول استخدام. لا تحتاج إلى تثبيت حزم المحوّلات
يدويًا، ولا توجد خطوة postinstall منفصلة لـ OpenClaw نفسه. إذا فشل
تنزيل محوّل أو إنشاؤه، فسيبلّغ `/acp doctor` عن الفشل.

### جسر MCP لأدوات Plugin

افتراضيًا، **لا** تعرض جلسات ACPX الأدوات المسجّلة بواسطة Plugins في OpenClaw
لأداة ACP.

إذا أردت أن تستدعي وكلاء ACP مثل Codex أو Claude Code أدوات Plugins المثبّتة
في OpenClaw، مثل استرجاع الذاكرة/تخزينها، فمكّن الجسر المخصّص:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

ما يفعله ذلك:

- يحقن خادم MCP مضمّنًا باسم `openclaw-plugin-tools` في تمهيد جلسة
  ACPX.
- يعرض أدوات Plugins المسجّلة بالفعل بواسطة Plugins OpenClaw
  المثبّتة والممكّنة.
- يمرر هوية جلسة ACP النشطة إلى مصانع أدوات Plugin، بحيث
  تبقى الأدوات محددة النطاق بالوكيل ضمن مساحة أسماء ذلك الوكيل.
- يُبقي الميزة صريحة ومعطّلة افتراضيًا.

ملاحظات الأمان والثقة:

- يوسّع هذا سطح أدوات أداة ACP.
- لا يحصل وكلاء ACP إلا على إمكانية الوصول إلى أدوات Plugins النشطة بالفعل في gateway.
- تعامل مع هذا بوصفه حد الثقة نفسه المطبّق عند السماح لتلك Plugins بالتنفيذ داخل
  OpenClaw نفسه.
- راجع Plugins المثبّتة قبل تمكينه.

تستمر `mcpServers` المخصّصة في العمل كما كانت. جسر أدوات Plugins المضمّن هو
وسيلة إضافية اختيارية، وليس بديلًا لإعداد خادم MCP العام.

### جسر MCP لأدوات OpenClaw

افتراضيًا، **لا** تعرض جلسات ACPX أيضًا أدوات OpenClaw المضمّنة عبر
MCP. مكّن جسر الأدوات الأساسية المنفصل عندما يحتاج وكيل ACP إلى أدوات
مضمّنة محددة مثل `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

ما يفعله ذلك:

- يحقن خادم MCP مضمّنًا باسم `openclaw-tools` في تمهيد جلسة
  ACPX.
- يعرض أدوات OpenClaw المضمّنة المحددة. يعرض الخادم الأولي `cron`.
- يُبقي عرض الأدوات الأساسية صريحًا ومعطّلًا افتراضيًا.

### إعداد مهلة عمليات وقت التشغيل

يمنح Plugin `acpx` عمليات بدء تشغيل وقت التشغيل المضمّن والتحكم فيه 120
ثانية افتراضيًا. يمنح ذلك الأدوات الأبطأ مثل Gemini CLI وقتًا كافيًا
لإكمال بدء تشغيل ACP وتهيئته. تجاوز هذه القيمة إذا كان مضيفك يحتاج إلى
حد زمني مختلف للعملية:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

تستخدم دورات وقت التشغيل مهل وكيل/تشغيل OpenClaw، بما في ذلك `/acp timeout`.
لا يقبل `sessions_spawn` تجاوزات للمهلة لكل استدعاء؛ ومسار المشغّل
هو `agents.defaults.subagents.runTimeoutSeconds`. أعد تشغيل gateway بعد
تغيير `timeoutSeconds`.

### إعداد وكيل اختبار السلامة

عندما يتحقق `/acp doctor` أو اختبار بدء التشغيل من الواجهة الخلفية، يختبر Plugin `acpx`
المضمّن وكيل أداة واحدًا. إذا ضُبط `acp.allowedAgents`، فإنه يستخدم افتراضيًا
أول وكيل مسموح به؛ وإلا فسيستخدم `codex` افتراضيًا. إذا كان نشرُك
يحتاج إلى وكيل ACP مختلف لاختبارات السلامة، فاضبط وكيل الاختبار صراحةً:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

أعد تشغيل gateway بعد تغيير هذه القيمة.

## إعداد الأذونات

تعمل جلسات ACP بشكل غير تفاعلي — فلا توجد TTY للموافقة على مطالبات أذونات كتابة الملفات وتنفيذ أوامر الصدفة أو رفضها. يوفر Plugin ‏acpx مفتاحَي إعداد يتحكمان في كيفية التعامل مع الأذونات:

أذونات بيئة ACPX هذه منفصلة عن موافقات التنفيذ في OpenClaw، ومنفصلة عن علامات تجاوز المورّد الخاصة بالواجهة الخلفية لـ CLI، مثل Claude CLI ‏`--permission-mode bypassPermissions`. يمثّل ACPX ‏`approve-all` مفتاح تجاوز الطوارئ على مستوى بيئة التشغيل لجلسات ACP.

للاطلاع على مقارنة أوسع بين OpenClaw ‏`tools.exec.mode`، وموافقات Codex Guardian،
وأذونات بيئة ACPX، راجع
[أوضاع الأذونات](/ar/tools/permission-modes).

### `permissionMode`

يتحكم في العمليات التي يمكن لوكيل بيئة التشغيل تنفيذها دون مطالبة.

| القيمة           | السلوك                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | الموافقة تلقائيًا على جميع عمليات كتابة الملفات وأوامر الصدفة.          |
| `approve-reads` | الموافقة تلقائيًا على عمليات القراءة فقط؛ تتطلب الكتابة والتنفيذ مطالبات. |
| `deny-all`      | رفض جميع مطالبات الأذونات.                              |

### `nonInteractivePermissions`

يتحكم فيما يحدث عندما يُفترض عرض مطالبة إذن، لكن لا تتوفر TTY تفاعلية (وهو الحال دائمًا في جلسات ACP).

| القيمة  | السلوك                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | إنهاء الجلسة باستخدام `PermissionPromptUnavailableError`. **(الافتراضي)** |
| `deny` | رفض الإذن بصمت والمتابعة (تدهور سلس).        |

### الإعداد

اضبط القيم عبر إعداد Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

أعِد تشغيل Gateway بعد تغيير هذه القيم.

<Warning>
يستخدم OpenClaw افتراضيًا `permissionMode=approve-reads` و`nonInteractivePermissions=fail`. في جلسات ACP غير التفاعلية، قد تفشل أي عملية كتابة أو تنفيذ تؤدي إلى مطالبة إذن باستخدام `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

إذا كان تقييد الأذونات مطلوبًا، فاضبط `nonInteractivePermissions` على `deny` كي تتدهور الجلسات بسلاسة بدلًا من التعطل.
</Warning>

## ذو صلة

- [وكلاء ACP](/ar/tools/acp-agents) — نظرة عامة، ودليل تشغيل للمشغّل، ومفاهيم
- [الوكلاء الفرعيون](/ar/tools/subagents)
- [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)
