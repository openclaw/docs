---
read_when:
    - تثبيت أو تهيئة حاضنة acpx لـ Claude Code / Codex / Gemini CLI
    - تمكين جسر MCP لأدوات Plugin أو أدوات OpenClaw
    - تكوين أوضاع أذونات ACP
summary: 'إعداد وكلاء ACP: تهيئة حزام acpx، وإعداد Plugin، والأذونات'
title: وكلاء ACP — الإعداد
x-i18n:
    generated_at: "2026-07-12T06:31:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

للاطلاع على النظرة العامة ودليل تشغيل المشغّل والمفاهيم، راجع [وكلاء ACP](/ar/tools/acp-agents).

تتناول هذه الصفحة إعداد حاضنة acpx، وإعداد Plugin لجسور MCP، وإعداد الأذونات.

استخدم هذه الصفحة فقط عند إعداد مسار ACP/acpx. لإعداد وقت تشغيل خادم تطبيق Codex
الأصلي، استخدم [حاضنة Codex](/ar/plugins/codex-harness). ولمفاتيح OpenAI API أو إعداد
موفّر النماذج عبر Codex OAuth، استخدم
[OpenAI](/ar/providers/openai).

لدى Codex مساران في OpenClaw:

| المسار                     | الإعداد/الأمر                                          | صفحة الإعداد                            |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| خادم تطبيق Codex الأصلي    | `/codex ...`، ومراجع الوكلاء `openai/gpt-*`            | [حاضنة Codex](/ar/plugins/codex-harness)   |
| محوّل Codex ACP الصريح     | `/acp spawn codex`، و`runtime: "acp", agentId: "codex"` | هذه الصفحة                              |

فضّل المسار الأصلي ما لم تكن بحاجة صريحة إلى سلوك ACP/acpx.

## دعم حاضنة acpx (الحالي)

الأسماء المستعارة المضمنة لحاضنة acpx (من تبعية `acpx` المثبّتة):

| الاسم المستعار | يغلّف                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| `claude`       | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`        | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`      | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`       | [Cursor CLI](https://cursor.com/docs/cli/acp) ‏(`cursor-agent acp`)                                             |
| `droid`        | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent`   | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`       | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`        | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`     | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`         | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`         | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`          | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`     | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`     | جسر OpenClaw ACP ‏(الأمر الأصلي `openclaw acp`)                                                                 |
| `pi`           | [وكيل البرمجة Pi](https://github.com/mariozechner/pi)                                                           |
| `qoder`        | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`         | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`         | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

يُحلّ الاسمان `factory-droid` و`factorydroid` أيضًا إلى محوّل `droid` المضمن.

عندما يستخدم OpenClaw الواجهة الخلفية acpx، فضّل هذه القيم لـ`agentId` ما لم يعرّف إعداد acpx أسماء مستعارة مخصصة للوكلاء.
إذا كان تثبيت Cursor المحلي لديك لا يزال يتيح ACP بالأمر `agent acp`، فتجاوز أمر وكيل `cursor` في إعداد acpx بدلًا من تغيير القيمة الافتراضية المضمنة.

يمكن أيضًا لاستخدام acpx CLI المباشر استهداف محوّلات عشوائية عبر `--agent <command>`، لكن منفذ التجاوز الخام هذا ميزة في acpx CLI (وليس مسار `agentId` المعتاد في OpenClaw).

يعتمد التحكم في النموذج على إمكانات المحوّل. يطبّع OpenClaw مراجع نماذج Codex ACP
قبل بدء التشغيل. تحتاج الحاضنات الأخرى إلى إمكانات ACP ‏`models` ودعم
`session/set_model`؛ وإذا لم تعرض الحاضنة إمكانات ACP هذه ولا خيار بدء تشغيل
خاصًا بها لتحديد النموذج، فلن يستطيع OpenClaw/acpx فرض اختيار نموذج.

## الإعداد المطلوب

الخط الأساسي لـACP في النواة:

```json5
{
  acp: {
    enabled: true,
    // اختياري. القيمة الافتراضية true؛ اضبطها على false لإيقاف توجيه ACP مؤقتًا مع إبقاء عناصر تحكم /acp.
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

إعداد ربط سلاسل المحادثات خاص بمحوّل القناة. مثال لـDiscord:

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
        // القيمة الافتراضية true بالفعل؛ وهي معروضة هنا صراحةً.
        spawnSessions: true,
      },
    },
  },
}
```

إذا لم يعمل إنشاء جلسة ACP مرتبطة بسلسلة محادثة، فتحقق أولًا من علامة ميزة المحوّل:

- Discord: ‏`channels.discord.threadBindings.spawnSessions=true`

لا تتطلب عمليات الربط بالمحادثة الحالية إنشاء سلسلة محادثة فرعية. بل تتطلب سياق محادثة نشطًا ومحوّل قناة يتيح روابط محادثات ACP.

راجع [مرجع الإعداد](/ar/gateway/configuration-reference).

## إعداد Plugin للواجهة الخلفية acpx

تستخدم عمليات التثبيت المجمّعة Plugin وقت التشغيل الرسمي `@openclaw/acpx` لـACP.
ثبّته وفعّله قبل استخدام جلسات حاضنة ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

يمكن لنسخ الشيفرة المصدرية أيضًا استخدام Plugin مساحة العمل المحلية بعد `pnpm install`.

ابدأ باستخدام:

```text
/acp doctor
```

إذا عطّلت `acpx`، أو منعته عبر `plugins.allow` / `plugins.deny`، أو أردت
العودة إلى Plugin المجمّع، فاستخدم مسار الحزمة الصريح:

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

### فحص بدء تشغيل وقت تشغيل acpx

يدمج Plugin ‏`acpx` وقت تشغيل ACP مباشرةً (من دون ملف `acpx` تنفيذي منفصل أو
إصدار يلزم إعداده). وهو يسجّل الواجهة الخلفية المضمنة افتراضيًا أثناء بدء تشغيل
Gateway وينتظر فحص بدء التشغيل قبل إشارة `ready` الخاصة بـGateway.
اضبط `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` أو
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` فقط للبرامج النصية أو البيئات التي
تُبقي فحص بدء التشغيل معطّلًا عمدًا. شغّل `/acp doctor` لإجراء فحص صريح
عند الطلب.

تجاوز أمر وكيل ACP فردي باستخدام وسائط منظّمة عندما يجب أن يبقى المسار
أو قيمة العلامة رمز argv واحدًا:

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

- `agents.<id>.command` هو الملف التنفيذي أو سلسلة الأمر الحالية لوكيل ACP ذاك.
- `agents.<id>.args` اختياري. يُقتبس كل عنصر في المصفوفة وفق قواعد الصدفة قبل أن يمرّره OpenClaw عبر سجل سلاسل أوامر acpx الحالي.

راجع [Plugins](/ar/tools/plugin).

### التنزيل التلقائي للمحوّلات

ينزّل `acpx` محوّلات ACP تلقائيًا (مثل جسري Claude وCodex لـACP)
عبر `npx` عند أول استخدام. لا تحتاج إلى تثبيت حزم المحوّلات
يدويًا، ولا توجد خطوة منفصلة بعد التثبيت لـOpenClaw نفسه. إذا فشل
تنزيل محوّل أو إنشاؤه، فسيبلّغ `/acp doctor` عن الفشل.

### جسر MCP لأدوات Plugin

افتراضيًا، لا تتيح جلسات ACPX أدوات OpenClaw المسجّلة بواسطة Plugins
لحاضنة ACP.

إذا أردت أن تستدعي وكلاء ACP مثل Codex أو Claude Code أدوات Plugins
المثبّتة في OpenClaw، مثل استرجاع الذاكرة/تخزينها، ففعّل الجسر المخصص:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

ما يفعله هذا:

- يحقن خادم MCP مضمنًا باسم `openclaw-plugin-tools` في تمهيد جلسة
  ACPX.
- يتيح أدوات Plugins المسجّلة بالفعل بواسطة Plugins OpenClaw
  المثبّتة والمفعّلة.
- يُبقي الميزة صريحة ومعطّلة افتراضيًا.

ملاحظات الأمان والثقة:

- يوسّع هذا نطاق أدوات حاضنة ACP.
- لا يحصل وكلاء ACP إلا على إمكانية الوصول إلى أدوات Plugins النشطة بالفعل في Gateway.
- تعامل مع هذا باعتباره حد الثقة نفسه الذي ينطبق على السماح لتلك Plugins بالتنفيذ داخل
  OpenClaw نفسه.
- راجع Plugins المثبّتة قبل تفعيله.

تستمر `mcpServers` المخصصة في العمل كما كانت من قبل. جسر أدوات Plugins المضمن
وسيلة راحة إضافية اختيارية، وليس بديلًا عن إعداد خادم MCP العام.

### جسر MCP لأدوات OpenClaw

افتراضيًا، لا تتيح جلسات ACPX أيضًا أدوات OpenClaw المضمنة عبر
MCP. فعّل جسر أدوات النواة المنفصل عندما يحتاج وكيل ACP إلى أدوات
مضمنة محددة مثل `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

ما يفعله هذا:

- يحقن خادم MCP مضمنًا باسم `openclaw-tools` في تمهيد جلسة
  ACPX.
- يتيح أدوات OpenClaw المضمنة المحددة. يتيح الخادم الأولي `cron`.
- يُبقي إتاحة أدوات النواة صريحة ومعطّلة افتراضيًا.

### إعداد مهلة عمليات وقت التشغيل

يمنح Plugin ‏`acpx` عمليات بدء تشغيل وقت التشغيل المضمن والتحكم فيه مهلة افتراضية
قدرها 120 ثانية. يمنح هذا الحاضنات الأبطأ مثل Gemini CLI وقتًا كافيًا
لإكمال بدء تشغيل ACP وتهيئته. تجاوزها إذا كان مضيفك يحتاج إلى
حد مختلف للعملية:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

تستخدم دورات وقت التشغيل مهل الوكيل/التشغيل في OpenClaw، بما في ذلك `/acp timeout`.
لا يقبل `sessions_spawn` تجاوزات للمهلة لكل استدعاء؛ ومسار المشغّل
هو `agents.defaults.subagents.runTimeoutSeconds`. أعد تشغيل Gateway بعد
تغيير `timeoutSeconds`.

### إعداد وكيل فحص السلامة

عندما يفحص `/acp doctor` أو فحص بدء التشغيل الواجهة الخلفية، يختبر Plugin ‏`acpx`
المجمّع وكيل حاضنة واحدًا. إذا ضُبط `acp.allowedAgents`، فسيستخدم
الوكيل الأول المسموح به افتراضيًا؛ وإلا فسيستخدم `codex`. إذا كان نشرك
يحتاج إلى وكيل ACP مختلف لفحوصات السلامة، فاضبط وكيل الفحص صراحةً:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

## إعداد الأذونات

تعمل جلسات ACP بصورة غير تفاعلية — فلا توجد TTY للموافقة على مطالبات أذونات كتابة الملفات وتنفيذ أوامر الصدفة أو رفضها. يوفّر Plugin ‏acpx مفتاحي إعداد يتحكمان في كيفية معالجة الأذونات:

أذونات حاضنة ACPX هذه منفصلة عن موافقات التنفيذ في OpenClaw، ومنفصلة عن علامات تجاوز المورّد الخاصة بالواجهة الخلفية لـCLI مثل `--permission-mode bypassPermissions` في Claude CLI. يمثّل `approve-all` في ACPX مفتاح الطوارئ على مستوى الحاضنة لجلسات ACP.

للاطلاع على مقارنة أوسع بين `tools.exec.mode` في OpenClaw وموافقات Codex Guardian
وأذونات حاضنة ACPX، راجع
[أوضاع الأذونات](/ar/tools/permission-modes).

### `permissionMode`

يتحكم في العمليات التي يمكن لوكيل الحاضنة تنفيذها من دون مطالبة.

| القيمة          | السلوك                                                               |
| --------------- | -------------------------------------------------------------------- |
| `approve-all`   | الموافقة تلقائيًا على جميع عمليات كتابة الملفات وأوامر الصَدَفة.     |
| `approve-reads` | الموافقة تلقائيًا على القراءة فقط؛ تتطلب الكتابة والتنفيذ مطالبات.    |
| `deny-all`      | رفض جميع مطالبات الأذونات.                                           |

### `nonInteractivePermissions`

يتحكم في ما يحدث عندما يُفترض عرض مطالبة إذن، ولكن لا تتوفر TTY تفاعلية (وهذا هو الحال دائمًا في جلسات ACP).

| القيمة | السلوك                                                                         |
| ------ | ------------------------------------------------------------------------------ |
| `fail` | إنهاء الجلسة بسبب `PermissionPromptUnavailableError`. **(الافتراضي)**          |
| `deny` | رفض الإذن بصمت والمتابعة (تدهور تدريجي للخدمة).                                 |

### الإعداد

اضبط القيم عبر إعدادات Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

أعِد تشغيل Gateway بعد تغيير هذه القيم.

<Warning>
يستخدم OpenClaw افتراضيًا `permissionMode=approve-reads` و`nonInteractivePermissions=fail`. في جلسات ACP غير التفاعلية، قد تفشل أي عملية كتابة أو تنفيذ تؤدي إلى مطالبة إذن مع الخطأ `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

إذا كنت بحاجة إلى تقييد الأذونات، فاضبط `nonInteractivePermissions` على `deny` كي تتدهور الجلسات تدريجيًا بدلًا من تعطّلها.
</Warning>

## ذو صلة

- [وكلاء ACP](/ar/tools/acp-agents) — نظرة عامة، دليل تشغيل للمشغّل، المفاهيم
- [الوكلاء الفرعيون](/ar/tools/subagents)
- [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)
