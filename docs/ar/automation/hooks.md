---
read_when:
    - أنت تريد أتمتة معتمدة على الأحداث لأوامر `/new` و`/reset` و`/stop` وأحداث دورة حياة الوكيل
    - أنت تريد إنشاء الخطافات أو تثبيتها أو تصحيحها
summary: 'الخطافات: الأتمتة المعتمدة على الأحداث للأوامر وأحداث دورة الحياة'
title: الخطافات
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:22:51Z"
  model: gpt-5.4
  provider: openai
  source_hash: cf40a64449347ef750b4b0e0a83b80e2e8fdef87d92daa71f028d2bf6a3d3d22
  source_path: automation/hooks.md
  workflow: 15
---

الخطافات هي نصوص برمجية صغيرة تعمل عند حدوث شيء ما داخل Gateway. يمكن اكتشافها من الأدلة وفحصها باستخدام `openclaw hooks`. لا يحمّل Gateway الخطافات الداخلية إلا بعد تفعيل الخطافات أو إعداد إدخال خطاف واحد على الأقل، أو حزمة خطافات، أو معالج قديم، أو دليل خطافات إضافي.

يوجد نوعان من الخطافات في OpenClaw:

- **الخطافات الداخلية** (هذه الصفحة): تعمل داخل Gateway عند تشغيل أحداث الوكيل، مثل `/new` أو `/reset` أو `/stop` أو أحداث دورة الحياة.
- **Webhooks**: نقاط نهاية HTTP خارجية تتيح للأنظمة الأخرى تشغيل الأعمال في OpenClaw. راجع [Webhooks](/ar/automation/cron-jobs#webhooks).

يمكن أيضًا تضمين الخطافات داخل Plugins. يعرض `openclaw hooks list` كلاً من الخطافات المستقلة والخطافات التي تديرها Plugins.

## البدء السريع

```bash
# عرض الخطافات المتاحة
openclaw hooks list

# تفعيل خطاف
openclaw hooks enable session-memory

# التحقق من حالة الخطاف
openclaw hooks check

# الحصول على معلومات مفصلة
openclaw hooks info session-memory
```

## أنواع الأحداث

| الحدث                    | وقت تشغيله                                     |
| ------------------------ | ---------------------------------------------- |
| `command:new`            | عند إصدار الأمر `/new`                         |
| `command:reset`          | عند إصدار الأمر `/reset`                       |
| `command:stop`           | عند إصدار الأمر `/stop`                        |
| `command`                | أي حدث أمر (مستمع عام)                         |
| `session:compact:before` | قبل أن يلخص Compaction السجل                   |
| `session:compact:after`  | بعد اكتمال Compaction                          |
| `session:patch`          | عند تعديل خصائص الجلسة                         |
| `agent:bootstrap`        | قبل إدخال ملفات التهيئة الأولية لمساحة العمل   |
| `gateway:startup`        | بعد بدء القنوات وتحميل الخطافات                |
| `message:received`       | رسالة واردة من أي قناة                         |
| `message:transcribed`    | بعد اكتمال نسخ الصوت                           |
| `message:preprocessed`   | بعد اكتمال فهم جميع الوسائط والروابط           |
| `message:sent`           | عند تسليم الرسالة الصادرة                      |

## كتابة الخطافات

### بنية الخطاف

كل خطاف هو دليل يحتوي على ملفين:

```
my-hook/
├── HOOK.md          # البيانات الوصفية + التوثيق
└── handler.ts       # تنفيذ المعالج
```

### تنسيق HOOK.md

```markdown
---
name: my-hook
description: "وصف قصير لما يفعله هذا الخطاف"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# خطافي

يوضع هنا التوثيق التفصيلي.
```

**حقول البيانات الوصفية** (`metadata.openclaw`):

| الحقل      | الوصف                                                |
| ---------- | ---------------------------------------------------- |
| `emoji`    | رمز تعبيري للعرض في CLI                              |
| `events`   | مصفوفة بالأحداث المطلوب الاستماع إليها              |
| `export`   | التصدير المسمى المطلوب استخدامه (الافتراضي `"default"`) |
| `os`       | المنصات المطلوبة (مثلًا `["darwin", "linux"]`)      |
| `requires` | المتطلبات من `bins` أو `anyBins` أو `env` أو مسارات `config` |
| `always`   | تجاوز فحوصات الأهلية (قيمة منطقية)                  |
| `install`  | طرق التثبيت                                          |

### تنفيذ المعالج

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // منطقك هنا

  // يمكن اختياريًا إرسال رسالة إلى المستخدم
  event.messages.push("تم تنفيذ الخطاف!");
};

export default handler;
```

يتضمن كل حدث: `type` و`action` و`sessionKey` و`timestamp` و`messages` (أضف إليها لإرسال رسالة إلى المستخدم) و`context` (بيانات خاصة بالحدث). يمكن أن تتضمن سياقات خطافات Plugin الخاصة بالوكيل والأداة أيضًا `trace`، وهو سياق تتبع تشخيصي للقراءة فقط ومتوافق مع W3C، ويمكن لـ Plugins تمريره إلى السجلات المنظمة لربط OTEL.

### أبرز عناصر سياق الحدث

**أحداث الأوامر** (`command:new`، `command:reset`): `context.sessionEntry` و`context.previousSessionEntry` و`context.commandSource` و`context.workspaceDir` و`context.cfg`.

**أحداث الرسائل** (`message:received`): `context.from` و`context.content` و`context.channelId` و`context.metadata` (بيانات خاصة بالموفر تتضمن `senderId` و`senderName` و`guildId`).

**أحداث الرسائل** (`message:sent`): `context.to` و`context.content` و`context.success` و`context.channelId`.

**أحداث الرسائل** (`message:transcribed`): `context.transcript` و`context.from` و`context.channelId` و`context.mediaPath`.

**أحداث الرسائل** (`message:preprocessed`): `context.bodyForAgent` (النص النهائي المعزز) و`context.from` و`context.channelId`.

**أحداث التهيئة الأولية** (`agent:bootstrap`): `context.bootstrapFiles` (مصفوفة قابلة للتعديل) و`context.agentId`.

**أحداث تصحيح الجلسة** (`session:patch`): `context.sessionEntry` و`context.patch` (الحقول التي تغيرت فقط) و`context.cfg`. لا يمكن إلا للعملاء ذوي الامتيازات تشغيل أحداث التصحيح.

**أحداث Compaction**: يتضمن `session:compact:before` القيمتين `messageCount` و`tokenCount`. ويضيف `session:compact:after` القيم `compactedCount` و`summaryLength` و`tokensBefore` و`tokensAfter`.

يراقب `command:stop` قيام المستخدم بإصدار `/stop`؛ وهو متعلق بدورة حياة الإلغاء/الأمر، وليس بوابة لإنهاء الوكيل نهائيًا. يجب على Plugins التي تحتاج إلى فحص إجابة نهائية طبيعية وطلب تمريرة إضافية من الوكيل استخدام خطاف Plugin المطبّع `before_agent_finalize` بدلًا من ذلك. راجع [Plugin hooks](/ar/plugins/hooks).

## اكتشاف الخطافات

يتم اكتشاف الخطافات من هذه الأدلة، بترتيب تصاعدي من حيث أسبقية التجاوز:

1. **الخطافات المضمنة**: تُشحن مع OpenClaw
2. **خطافات Plugins**: خطافات مضمّنة داخل Plugins المثبتة
3. **الخطافات المُدارة**: `~/.openclaw/hooks/` (مثبتة من قبل المستخدم ومشتركة عبر مساحات العمل). تشترك الأدلة الإضافية من `hooks.internal.load.extraDirs` في هذه الأسبقية.
4. **خطافات مساحة العمل**: `<workspace>/hooks/` (لكل وكيل على حدة، ومعطلة افتراضيًا حتى يتم تفعيلها صراحة)

يمكن لخطافات مساحة العمل إضافة أسماء خطافات جديدة، لكنها لا تستطيع تجاوز الخطافات المضمنة أو المُدارة أو التي توفرها Plugins إذا كان لها الاسم نفسه.

يتخطى Gateway اكتشاف الخطافات الداخلية عند بدء التشغيل إلى أن يتم إعداد الخطافات الداخلية. فعّل خطافًا مضمّنًا أو مُدارًا باستخدام `openclaw hooks enable <name>`، أو ثبّت حزمة خطافات، أو عيّن `hooks.internal.enabled=true` للاشتراك. عند تفعيل خطاف مسمى واحد، يحمّل Gateway معالج ذلك الخطاف فقط؛ بينما `hooks.internal.enabled=true` والأدلة الإضافية للخطافات والمعالجات القديمة تُدخل النظام في وضع الاكتشاف الواسع.

### حزم الخطافات

حزم الخطافات هي حزم npm تصدّر الخطافات عبر `openclaw.hooks` في `package.json`. ثبّتها باستخدام:

```bash
openclaw plugins install <path-or-spec>
```

يُسمح فقط بمواصفات npm الخاصة بالسجل (اسم الحزمة + إصدار دقيق اختياري أو dist-tag). يتم رفض مواصفات Git/URL/file ونطاقات semver.

## الخطافات المضمنة

| الخطاف                | الأحداث                         | ما الذي يفعله                                          |
| --------------------- | ------------------------------ | ------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset` | يحفظ سياق الجلسة في `<workspace>/memory/`              |
| bootstrap-extra-files | `agent:bootstrap`              | يدرج ملفات تهيئة أولية إضافية من أنماط glob           |
| command-logger        | `command`                      | يسجل جميع الأوامر في `~/.openclaw/logs/commands.log`   |
| boot-md               | `gateway:startup`              | يشغّل `BOOT.md` عند بدء Gateway                        |

فعّل أي خطاف مضمن:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### تفاصيل session-memory

يستخرج آخر 15 رسالة من المستخدم/المساعد، ويولّد slug وصفيًا لاسم الملف عبر LLM، ثم يحفظه في `<workspace>/memory/YYYY-MM-DD-slug.md`. يتطلب إعداد `workspace.dir`.

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

تُفسَّر المسارات نسبةً إلى مساحة العمل. لا يتم تحميل إلا أسماء ملفات التهيئة الأولية الأساسية المعروفة (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md` و`MEMORY.md`).

<a id="command-logger"></a>

### تفاصيل command-logger

يسجل كل أمر slash في `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### تفاصيل boot-md

يشغّل `BOOT.md` من مساحة العمل النشطة عند بدء Gateway.

## خطافات Plugins

يمكن لـ Plugins تسجيل خطافات مطبّعة من خلال Plugin SDK لتحقيق تكامل أعمق:
اعتراض استدعاءات الأدوات، وتعديل المطالبات، والتحكم في تدفق الرسائل، والمزيد.
استخدم خطافات Plugins عندما تحتاج إلى `before_tool_call` أو `before_agent_reply` أو `before_install` أو غيرها من خطافات دورة الحياة داخل العملية.

للمرجع الكامل لخطافات Plugins، راجع [Plugin hooks](/ar/plugins/hooks).

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

متغيرات البيئة لكل خطاف:

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

أدلة خطافات إضافية:

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
لا يزال تنسيق إعداد المصفوفة القديمة `hooks.internal.handlers` مدعومًا من أجل التوافق مع الإصدارات السابقة، لكن يجب أن تستخدم الخطافات الجديدة النظام المعتمد على الاكتشاف.
</Note>

## مرجع CLI

```bash
# عرض جميع الخطافات (أضف --eligible أو --verbose أو --json)
openclaw hooks list

# عرض معلومات مفصلة عن خطاف
openclaw hooks info <hook-name>

# عرض ملخص الأهلية
openclaw hooks check

# تفعيل/تعطيل
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## أفضل الممارسات

- **اجعل المعالجات سريعة.** تعمل الخطافات أثناء معالجة الأوامر. نفّذ الأعمال الثقيلة في الخلفية بطريقة fire-and-forget باستخدام `void processInBackground(event)`.
- **تعامل مع الأخطاء بسلاسة.** لفّ العمليات الخطِرة داخل try/catch؛ ولا ترمِ الأخطاء حتى تتمكن المعالجات الأخرى من العمل.
- **صفِّ الأحداث مبكرًا.** أعد مباشرة إذا لم يكن نوع الحدث/إجراءه ذا صلة.
- **استخدم مفاتيح أحداث محددة.** فضّل `"events": ["command:new"]` على `"events": ["command"]` لتقليل الحمل.

## استكشاف الأخطاء وإصلاحها

### لم يتم اكتشاف الخطاف

```bash
# تحقّق من بنية الدليل
ls -la ~/.openclaw/hooks/my-hook/
# يجب أن يُظهر: HOOK.md, handler.ts

# عرض جميع الخطافات المكتشفة
openclaw hooks list
```

### الخطاف غير مؤهل

```bash
openclaw hooks info my-hook
```

تحقق من وجود ملفات تنفيذية مفقودة (PATH)، أو متغيرات بيئة، أو قيم إعداد، أو توافق نظام التشغيل.

### الخطاف لا يعمل

1. تحقّق من أن الخطاف مفعّل: `openclaw hooks list`
2. أعد تشغيل عملية Gateway حتى تُعاد تحميل الخطافات.
3. تحقّق من سجلات Gateway: `./scripts/clawlog.sh | grep hook`

## ذو صلة

- [مرجع CLI: hooks](/ar/cli/hooks)
- [Webhooks](/ar/automation/cron-jobs#webhooks)
- [Plugin hooks](/ar/plugins/hooks) — خطافات دورة حياة Plugin داخل العملية
- [الإعداد](/ar/gateway/configuration-reference#hooks)
