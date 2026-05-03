---
read_when:
    - تريد أتمتة مدفوعة بالأحداث لـ /new و /reset و /stop وأحداث دورة حياة الوكيل
    - تريد إنشاء الخطافات أو تثبيتها أو تصحيح أخطائها
summary: 'الخطافات: أتمتة مدفوعة بالأحداث للأوامر وأحداث دورة الحياة'
title: الخطافات
x-i18n:
    generated_at: "2026-05-03T21:27:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

Hooks هي سكربتات صغيرة تعمل عند حدوث شيء داخل Gateway. يمكن اكتشافها من الدلائل وفحصها باستخدام `openclaw hooks`. لا يحمّل Gateway الخطّافات الداخلية إلا بعد أن تفعّل الخطّافات أو تضبط إدخال خطّاف واحدًا على الأقل، أو حزمة خطّافات، أو معالجًا قديمًا، أو دليل خطّافات إضافيًا.

هناك نوعان من الخطّافات في OpenClaw:

- **الخطّافات الداخلية** (هذه الصفحة): تعمل داخل Gateway عند إطلاق أحداث الوكيل، مثل `/new` أو `/reset` أو `/stop` أو أحداث دورة الحياة.
- **Webhooks**: نقاط نهاية HTTP خارجية تتيح للأنظمة الأخرى تشغيل العمل في OpenClaw. راجع [Webhooks](/ar/automation/cron-jobs#webhooks).

يمكن أيضًا تضمين الخطّافات داخل plugins. يعرض `openclaw hooks list` كلًا من الخطّافات المستقلة والخطّافات المُدارة بواسطة Plugin.

## البدء السريع

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## أنواع الأحداث

| الحدث                    | وقت إطلاقه                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | عند إصدار أمر `/new`                                      |
| `command:reset`          | عند إصدار أمر `/reset`                                    |
| `command:stop`           | عند إصدار أمر `/stop`                                     |
| `command`                | أي حدث أمر (مستمع عام)                       |
| `session:compact:before` | قبل أن تلخص Compaction السجل                       |
| `session:compact:after`  | بعد اكتمال Compaction                                 |
| `session:patch`          | عند تعديل خصائص الجلسة                       |
| `agent:bootstrap`        | قبل حقن ملفات تمهيد مساحة العمل              |
| `gateway:startup`        | بعد بدء القنوات وتحميل الخطّافات                  |
| `gateway:shutdown`       | عند بدء إيقاف Gateway                               |
| `gateway:pre-restart`    | قبل إعادة تشغيل متوقعة لـ Gateway                         |
| `message:received`       | رسالة واردة من أي قناة                           |
| `message:transcribed`    | بعد اكتمال نسخ الصوت                        |
| `message:preprocessed`   | بعد اكتمال المعالجة المسبقة للوسائط والروابط أو تخطيها |
| `message:sent`           | تسليم رسالة صادرة                                 |

## كتابة الخطّافات

### بنية الخطّاف

كل خطّاف هو دليل يحتوي على ملفين:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### تنسيق HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**حقول البيانات الوصفية** (`metadata.openclaw`):

| الحقل      | الوصف                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | رمز تعبيري للعرض في CLI                                |
| `events`   | مصفوفة الأحداث المراد الاستماع إليها                        |
| `export`   | التصدير المسمّى المراد استخدامه (القيمة الافتراضية `"default"`)        |
| `os`       | المنصات المطلوبة (مثل `["darwin", "linux"]`)     |
| `requires` | مسارات `bins` أو `anyBins` أو `env` أو `config` المطلوبة |
| `always`   | تجاوز فحوصات الأهلية (قيمة منطقية)                  |
| `install`  | طرق التثبيت                                 |

### تنفيذ المعالج

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

يتضمن كل حدث: `type` و`action` و`sessionKey` و`timestamp` و`messages` (استخدم push للإرسال إلى المستخدم)، و`context` (بيانات خاصة بالحدث). يمكن أن تتضمن سياقات خطّافات Plugin الخاصة بالوكلاء والأدوات أيضًا `trace`، وهو سياق تتبع تشخيصي للقراءة فقط ومتوافق مع W3C يمكن للـ plugins تمريره إلى السجلات المنظمة لربط OTEL.

### أبرز عناصر سياق الحدث

**أحداث الأوامر** (`command:new`، `command:reset`): `context.sessionEntry`، `context.previousSessionEntry`، `context.commandSource`، `context.workspaceDir`، `context.cfg`.

**أحداث الرسائل** (`message:received`): `context.from`، `context.content`، `context.channelId`، `context.metadata` (بيانات خاصة بالمزوّد تشمل `senderId` و`senderName` و`guildId`). يفضّل `context.content` نص أمر غير فارغ للرسائل الشبيهة بالأوامر، ثم يعود إلى النص الوارد الخام والنص العام؛ ولا يتضمن الإثراء الخاص بالوكيل فقط مثل سجل الخيط أو ملخصات الروابط.

**أحداث الرسائل** (`message:sent`): `context.to`، `context.content`، `context.success`، `context.channelId`.

**أحداث الرسائل** (`message:transcribed`): `context.transcript`، `context.from`، `context.channelId`، `context.mediaPath`.

**أحداث الرسائل** (`message:preprocessed`): `context.bodyForAgent` (النص النهائي المُثرى)، `context.from`، `context.channelId`.

**أحداث التمهيد** (`agent:bootstrap`): `context.bootstrapFiles` (مصفوفة قابلة للتعديل)، `context.agentId`.

**أحداث تصحيح الجلسة** (`session:patch`): `context.sessionEntry`، `context.patch` (الحقول المتغيرة فقط)، `context.cfg`. لا يمكن إلا للعملاء ذوي الامتياز تشغيل أحداث التصحيح.

**أحداث Compaction**: يتضمن `session:compact:before` القيمتين `messageCount` و`tokenCount`. يضيف `session:compact:after` القيم `compactedCount` و`summaryLength` و`tokensBefore` و`tokensAfter`.

يراقب `command:stop` إصدار المستخدم للأمر `/stop`؛ وهو جزء من دورة حياة الإلغاء/الأمر، وليس بوابة لإنهاء الوكيل. يجب على plugins التي تحتاج إلى فحص إجابة نهائية طبيعية وطلب مرور إضافي واحد من الوكيل استخدام خطّاف Plugin المكتوب `before_agent_finalize` بدلًا من ذلك. راجع [خطّافات Plugin](/ar/plugins/hooks).

**أحداث دورة حياة Gateway**: يتضمن `gateway:shutdown` القيمتين `reason` و`restartExpectedMs` ويُطلق عند بدء إيقاف Gateway. يتضمن `gateway:pre-restart` السياق نفسه، لكنه لا يُطلق إلا عندما يكون الإيقاف جزءًا من إعادة تشغيل متوقعة وتكون قيمة `restartExpectedMs` محدودة. أثناء الإيقاف، يكون انتظار كل خطّاف دورة حياة بأفضل جهد ومحدودًا حتى يستمر الإيقاف إذا تعطل معالج.

## اكتشاف الخطّافات

تُكتشف الخطّافات من هذه الدلائل، بترتيب أسبقية تجاوز متزايد:

1. **الخطّافات المضمنة**: تُشحن مع OpenClaw
2. **خطّافات Plugin**: خطّافات مضمنة داخل plugins المثبتة
3. **الخطّافات المُدارة**: `~/.openclaw/hooks/` (مثبتة من المستخدم ومشتركة عبر مساحات العمل). تشارك الدلائل الإضافية من `hooks.internal.load.extraDirs` هذه الأسبقية.
4. **خطّافات مساحة العمل**: `<workspace>/hooks/` (لكل وكيل، معطلة افتراضيًا إلى أن تُفعّل صراحة)

يمكن لخطّافات مساحة العمل إضافة أسماء خطّافات جديدة، لكنها لا تستطيع تجاوز الخطّافات المضمنة أو المُدارة أو التي يوفرها Plugin بالاسم نفسه.

يتخطى Gateway اكتشاف الخطّافات الداخلية عند بدء التشغيل إلى أن تُضبط الخطّافات الداخلية. فعّل خطّافًا مضمنًا أو مُدارًا باستخدام `openclaw hooks enable <name>`، أو ثبّت حزمة خطّافات، أو اضبط `hooks.internal.enabled=true` للاشتراك. عندما تفعّل خطّافًا واحدًا مسمى، يحمّل Gateway معالج ذلك الخطّاف فقط؛ أما `hooks.internal.enabled=true` ودلائل الخطّافات الإضافية والمعالجات القديمة فتشترك في الاكتشاف الواسع.

### حزم الخطّافات

حزم الخطّافات هي حزم npm تصدّر الخطّافات عبر `openclaw.hooks` في `package.json`. ثبّتها باستخدام:

```bash
openclaw plugins install <path-or-spec>
```

مواصفات npm تقتصر على السجل فقط (اسم الحزمة مع إصدار دقيق اختياري أو dist-tag). تُرفض مواصفات Git/URL/الملفات ونطاقات semver.

## الخطّافات المضمنة

| الخطّاف                  | الأحداث                                            | ما يفعله                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`، `command:reset`                    | يحفظ سياق الجلسة في `<workspace>/memory/`                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | يحقن ملفات تمهيد إضافية من أنماط glob          |
| command-logger        | `command`                                         | يسجل كل الأوامر في `~/.openclaw/logs/commands.log`           |
| compaction-notifier   | `session:compact:before`، `session:compact:after` | يرسل إشعارات دردشة مرئية عند بدء/انتهاء Compaction للجلسة |
| boot-md               | `gateway:startup`                                 | يشغّل `BOOT.md` عند بدء Gateway                         |

فعّل أي خطّاف مضمن:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### تفاصيل session-memory

يستخرج آخر 15 رسالة من المستخدم/المساعد، وينشئ slug وصفيًا لاسم الملف عبر LLM، ويحفظه في `<workspace>/memory/YYYY-MM-DD-slug.md` باستخدام التاريخ المحلي للمضيف. يتطلب ضبط `workspace.dir`.

<a id="bootstrap-extra-files"></a>

### إعداد bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

تُحل المسارات نسبةً إلى مساحة العمل. لا تُحمّل إلا أسماء ملفات التمهيد الأساسية المعروفة (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md` و`MEMORY.md`).

<a id="command-logger"></a>

### تفاصيل command-logger

يسجل كل أمر شرطة مائلة في `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### تفاصيل compaction-notifier

يرسل رسائل حالة قصيرة إلى المحادثة الحالية عندما يبدأ OpenClaw وينتهي من ضغط نص الجلسة. يجعل هذا الجولات الطويلة أقل إرباكًا على أسطح الدردشة لأن المستخدم يستطيع رؤية أن المساعد يلخص السياق وسيواصل بعد Compaction.

<a id="boot-md"></a>

### تفاصيل boot-md

يشغّل `BOOT.md` من مساحة العمل النشطة عند بدء Gateway.

## خطّافات Plugin

يمكن للـ plugins تسجيل خطّافات مكتوبة عبر Plugin SDK لتكامل أعمق:
اعتراض استدعاءات الأدوات، وتعديل المطالبات، والتحكم في تدفق الرسائل، وغير ذلك.
استخدم خطّافات Plugin عندما تحتاج إلى `before_tool_call` أو `before_agent_reply` أو
`before_install` أو غيرها من خطّافات دورة الحياة داخل العملية.

للاطلاع على مرجع خطّافات Plugin الكامل، راجع [خطّافات Plugin](/ar/plugins/hooks).

## الإعداد

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

متغيرات البيئة لكل خطّاف:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

دلائل الخطّافات الإضافية:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
لا يزال تنسيق إعداد مصفوفة `hooks.internal.handlers` القديم مدعومًا للتوافق مع الإصدارات السابقة، لكن يجب أن تستخدم الخطّافات الجديدة النظام القائم على الاكتشاف.
</Note>

## مرجع CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## أفضل الممارسات

- **أبقِ المعالجات سريعة.** تعمل الخطافات أثناء معالجة الأوامر. شغّل الأعمال الثقيلة دون انتظار باستخدام `void processInBackground(event)`.
- **تعامل مع الأخطاء بسلاسة.** غلّف العمليات المحفوفة بالمخاطر في try/catch؛ لا تطلق استثناءات كي تتمكن المعالجات الأخرى من العمل.
- **رشّح الأحداث مبكرًا.** عُد فورًا إذا لم يكن نوع الحدث/الإجراء ذا صلة.
- **استخدم مفاتيح أحداث محددة.** فضّل `"events": ["command:new"]` على `"events": ["command"]` لتقليل الحمل.

## استكشاف الأخطاء وإصلاحها

### لم يتم اكتشاف الخطاف

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### الخطاف غير مؤهل

```bash
openclaw hooks info my-hook
```

تحقق من الملفات التنفيذية المفقودة (PATH)، أو متغيرات البيئة، أو قيم الإعدادات، أو توافق نظام التشغيل.

### الخطاف لا يُنفّذ

1. تحقق من أن الخطاف مفعّل: `openclaw hooks list`
2. أعد تشغيل عملية Gateway حتى تُعاد تحميل الخطافات.
3. تحقق من سجلات Gateway: `./scripts/clawlog.sh | grep hook`

## ذات صلة

- [مرجع CLI: الخطافات](/ar/cli/hooks)
- [Webhooks](/ar/automation/cron-jobs#webhooks)
- [خطافات Plugin](/ar/plugins/hooks) — خطافات دورة حياة Plugin داخل العملية
- [الإعدادات](/ar/gateway/configuration-reference#hooks)
