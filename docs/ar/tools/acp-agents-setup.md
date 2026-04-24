---
read_when:
    - تثبيت أو إعداد acpx harness لـ Claude Code / Codex / Gemini CLI
    - تفعيل جسر MCP الخاص بـ plugin-tools أو OpenClaw-tools
    - إعداد أوضاع أذونات ACP
summary: 'إعداد ACP Agents: إعداد acpx harness وPlugin والأذونات'
title: ACP Agents — الإعداد
x-i18n:
    generated_at: "2026-04-24T08:06:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

للحصول على النظرة العامة، ودليل تشغيل المشغّل، والمفاهيم، راجع [ACP Agents](/ar/tools/acp-agents).
وتغطي هذه الصفحة إعداد acpx harness، وإعداد Plugin لجسور MCP، و
إعداد الأذونات.

## دعم acpx harness ‏(الحالي)

الأسماء البديلة المضمنة الحالية لـ acpx harness:

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

عندما يستخدم OpenClaw الواجهة الخلفية acpx، ففضّل هذه القيم لـ `agentId` ما لم يكن إعداد acpx لديك يعرّف أسماء بديلة مخصصة للوكلاء.
إذا كان تثبيت Cursor المحلي لديك ما يزال يكشف ACP على أنه `agent acp`, فتجاوز أمر الوكيل `cursor` في إعداد acpx لديك بدلًا من تغيير القيمة الافتراضية المضمنة.

يمكن لاستخدام acpx CLI المباشر أيضًا أن يستهدف محولات عشوائية عبر `--agent <command>`, لكن هذا المنفذ الخام هو ميزة في acpx CLI ‏(وليس في مسار `agentId` العادي في OpenClaw).

## الإعدادات المطلوبة

خط الأساس الأساسي لـ ACP:

```json5
{
  acp: {
    enabled: true,
    // اختياري. الافتراضي true؛ اضبطه على false لإيقاف إرسال ACP مؤقتًا مع إبقاء عناصر التحكم /acp.
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

إعدادات ربط الخيوط خاصة بكل محول قناة. مثال لـ Discord:

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

إذا لم يعمل التشغيل المرتبط بخيط ACP، فتحقق أولًا من علم الميزة الخاص بالمحول:

- Discord: ‏`channels.discord.threadBindings.spawnAcpSessions=true`

لا تتطلب الارتباطات الخاصة بالمحادثة الحالية إنشاء خيط فرعي. بل تتطلب سياق محادثة نشطًا ومحول قناة يكشف عن ارتباطات محادثة ACP.

راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## إعداد Plugin للواجهة الخلفية acpx

تأتي التثبيتات الجديدة مع تفعيل Plugin وقت التشغيل `acpx` المضمن افتراضيًا، لذا
فإن ACP تعمل عادةً من دون خطوة تثبيت Plugin يدوية.

ابدأ بـ:

```text
/acp doctor
```

إذا كنت قد عطّلت `acpx` أو رفضته عبر `plugins.allow` / `plugins.deny` أو كنت تريد
التبديل إلى نسخة تطوير محلية، فاستخدم مسار Plugin الصريح:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

تثبيت محلي من مساحة العمل أثناء التطوير:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

ثم تحقق من سلامة الواجهة الخلفية:

```text
/acp doctor
```

### إعدادات أمر acpx والإصدار

افتراضيًا، يستخدم Plugin ‏`acpx` المضمن الملف التنفيذي المثبّت محليًا داخل Plugin (`node_modules/.bin/acpx` داخل حزمة Plugin). وعند البدء، يسجّل الواجهة الخلفية على أنها غير جاهزة، وتتحقق مهمة في الخلفية من `acpx --version`; وإذا كان الملف التنفيذي مفقودًا أو غير مطابق، فإنها تشغّل `npm install --omit=dev --no-save acpx@<pinned>` ثم تعيد التحقق. وتبقى gateway غير حاجزة طوال ذلك.

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

- يقبل `command` مسارًا مطلقًا، أو مسارًا نسبيًا (يتم تحليله من مساحة عمل OpenClaw)، أو اسم أمر.
- يعطّل `expectedVersion: "any"` المطابقة الصارمة للإصدار.
- تؤدي مسارات `command` المخصصة إلى تعطيل التثبيت التلقائي المحلي داخل Plugin.

راجع [Plugins](/ar/tools/plugin).

### التثبيت التلقائي للتبعيات

عندما تثبّت OpenClaw عالميًا باستخدام `npm install -g openclaw`, يتم تثبيت
تبعيات وقت تشغيل acpx ‏(الملفات التنفيذية الخاصة بالمنصة) تلقائيًا
عبر خطاف postinstall. وإذا فشل التثبيت التلقائي، فإن gateway ما تزال تبدأ
بشكل طبيعي وتبلغ عن التبعية المفقودة عبر `openclaw acp doctor`.

### جسر MCP الخاص بأدوات Plugin

افتراضيًا، لا تكشف جلسات ACPX **أدوات OpenClaw المسجلة بواسطة Plugins** لـ
ACP harness.

إذا كنت تريد من ACP Agents مثل Codex أو Claude Code استدعاء أدوات
Plugins OpenClaw المثبتة مثل استدعاء/تخزين الذاكرة، ففعّل الجسر المخصص:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

ما الذي يفعله هذا:

- يحقن خادم MCP مدمجًا باسم `openclaw-plugin-tools` في bootstrap
  جلسة ACPX.
- يكشف أدوات Plugins المسجلة بالفعل بواسطة Plugins OpenClaw المثبتة
  والمفعّلة.
- يبقي الميزة صريحة ومعطلة افتراضيًا.

ملاحظات الأمان والثقة:

- يوسّع هذا سطح أدوات ACP harness.
- تحصل ACP Agents على الوصول فقط إلى أدوات Plugins النشطة أصلًا في gateway.
- تعامل مع هذا على أنه حد الثقة نفسه كما لو كنت تسمح لتلك Plugins بالتنفيذ داخل
  OpenClaw نفسه.
- راجع Plugins المثبتة قبل تفعيله.

ما تزال `mcpServers` المخصصة تعمل كما كانت. إن جسر plugin-tools المدمج هو
وسيلة راحة إضافية اختيارية، وليس بديلًا عن إعداد خادم MCP العام.

### جسر MCP الخاص بأدوات OpenClaw

افتراضيًا، لا تكشف جلسات ACPX أيضًا **أدوات OpenClaw المضمنة** عبر
MCP. فعّل الجسر المنفصل للأدوات الأساسية عندما يحتاج ACP agent إلى أدوات
مدمجة مختارة مثل `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

ما الذي يفعله هذا:

- يحقن خادم MCP مدمجًا باسم `openclaw-tools` في bootstrap
  جلسة ACPX.
- يكشف أدوات OpenClaw المضمنة المختارة. ويكشف الخادم الأولي الأداة `cron`.
- يبقي كشف الأدوات الأساسية صريحًا ومعطلًا افتراضيًا.

### إعداد مهلة وقت التشغيل

يضبط Plugin ‏`acpx` المضمن أدوار وقت التشغيل المضمنة افتراضيًا على مهلة
120 ثانية. وهذا يمنح harnesses الأبطأ مثل Gemini CLI وقتًا كافيًا لإكمال
بدء ACP والتهيئة. تجاوز ذلك إذا كان المضيف لديك يحتاج إلى حد وقت تشغيل مختلف:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

أعد تشغيل gateway بعد تغيير هذه القيمة.

### إعداد وكيل فحص السلامة

يفحص Plugin ‏`acpx` المضمن harness agent واحدًا أثناء تقرير ما إذا كانت
واجهة وقت التشغيل المضمن جاهزة. والقيمة الافتراضية هي `codex`. وإذا كانت عملية النشر لديك
تستخدم ACP agent افتراضيًا مختلفًا، فاضبط وكيل الفحص على المعرّف نفسه:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

أعد تشغيل gateway بعد تغيير هذه القيمة.

## إعداد الأذونات

تعمل جلسات ACP بشكل غير تفاعلي — فلا توجد TTY للموافقة على مطالبات أذونات كتابة الملفات وshell-exec أو رفضها. ويوفر Plugin ‏acpx مفتاحي إعداد يتحكمان في كيفية التعامل مع الأذونات:

تعد أذونات ACPX harness هذه منفصلة عن موافقات exec في OpenClaw ومنفصلة عن أعلام التجاوز الخاصة ببائعي الواجهات الخلفية لـ CLI مثل `--permission-mode bypassPermissions` في Claude CLI. ويُعد `approve-all` في ACPX مفتاح الطوارئ على مستوى harness لجلسات ACP.

### `permissionMode`

يتحكم في العمليات التي يمكن لوكيل harness تنفيذها من دون مطالبة.

| القيمة          | السلوك                                                   |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | يوافق تلقائيًا على جميع كتابات الملفات وأوامر shell.    |
| `approve-reads` | يوافق تلقائيًا على القراءات فقط؛ أما الكتابات وexec فتتطلب مطالبات. |
| `deny-all`      | يرفض جميع مطالبات الأذونات.                             |

### `nonInteractivePermissions`

يتحكم في ما يحدث عندما يكون من المفترض عرض مطالبة إذن لكن لا توجد TTY تفاعلية متاحة (وهو ما يحدث دائمًا في جلسات ACP).

| القيمة | السلوك                                                           |
| ------ | ---------------------------------------------------------------- |
| `fail` | يوقف الجلسة مع `AcpRuntimeError`. **(الافتراضي)**               |
| `deny` | يرفض الإذن بصمت ويواصل التنفيذ (خفض سلس).                       |

### الإعدادات

اضبطها عبر إعداد Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

أعد تشغيل gateway بعد تغيير هذه القيم.

> **مهم:** يستخدم OpenClaw حاليًا القيمة الافتراضية `permissionMode=approve-reads` و`nonInteractivePermissions=fail`. وفي جلسات ACP غير التفاعلية، يمكن لأي كتابة أو exec تطلق مطالبة إذن أن تفشل بالخطأ `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> إذا كنت تحتاج إلى تقييد الأذونات، فاضبط `nonInteractivePermissions` على `deny` بحيث تنخفض الجلسات بسلاسة بدلًا من التعطل.

## ذو صلة

- [ACP Agents](/ar/tools/acp-agents) — النظرة العامة، ودليل تشغيل المشغّل، والمفاهيم
- [الوكلاء الفرعيون](/ar/tools/subagents)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
