---
read_when:
    - تريد أتمتة قائمة على الأحداث للأوامر /new و/reset و/stop ولأحداث دورة حياة الوكيل
    - تريد إنشاء الخطافات أو تثبيتها أو تصحيح أخطائها
summary: 'الخطافات: أتمتة قائمة على الأحداث للأوامر وأحداث دورة الحياة'
title: الخطافات
x-i18n:
    generated_at: "2026-07-12T05:32:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Hooks هي نصوص برمجية صغيرة تعمل داخل Gateway عند إطلاق أحداث الوكيل: أوامر مثل `/new` و`/reset` و`/stop`، وCompaction الجلسة، ودورة حياة Gateway، وتدفق الرسائل. تُكتشف من الأدلة وتُدار باستخدام `openclaw hooks`. لا يحمّل Gateway Hooks الداخلية إلا بعد تمكين Hooks أو تهيئة إدخال Hook واحد على الأقل، أو حزمة Hooks، أو معالج قديم، أو دليل Hooks إضافي.

يوجد نوعان من Hooks في OpenClaw:

- **Hooks الداخلية** (هذه الصفحة): تعمل داخل Gateway عند إطلاق أحداث الوكيل.
- **Webhooks**: نقاط نهاية HTTP خارجية تتيح للأنظمة الأخرى تشغيل أعمال في OpenClaw. راجع [Webhooks](/ar/automation/cron-jobs#webhooks).

يمكن أيضًا تضمين Hooks داخل Plugins. يعرض `openclaw hooks list` كلًا من Hooks المستقلة وتلك المُدارة بواسطة Plugins (وتظهر بصيغة `plugin:<id>`).

## اختيار السطح المناسب

لدى OpenClaw عدة أسطح توسعة تبدو متشابهة، لكنها تحل مشكلات مختلفة:

| إذا أردت...                                                                                                                | فاستخدم...                                         | السبب                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| حفظ لقطة عند `/new`، أو تسجيل `/reset`، أو استدعاء API خارجي بعد `message:sent`، أو إضافة أتمتة عامة للمشغّل              | Hooks الداخلية (`HOOK.md`، هذه الصفحة)            | Hooks المعتمدة على الملفات مخصصة للآثار الجانبية التي يديرها المشغّل وأتمتة الأوامر ودورة الحياة |
| إعادة كتابة المطالبات، أو حظر الأدوات، أو إلغاء الرسائل الصادرة، أو إضافة برمجيات وسيطة/سياسات مرتبة                       | Hooks المكتوبة بأنواع عبر `api.on(...)` في Plugin | تحتوي Hooks المكتوبة بأنواع على عقود وأولويات وقواعد دمج ودلالات حظر/إلغاء صريحة              |
| إضافة تصدير للقياس عن بُعد فقط أو قابلية الرصد                                                                             | الأحداث التشخيصية                                  | قابلية الرصد هي ناقل أحداث منفصل، وليست سطح Hooks للسياسات                                    |

استخدم Hooks الداخلية عندما تريد أتمتة تتصرف مثل تكامل صغير مثبّت. واستخدم Hooks المكتوبة بأنواع في Plugin عندما تحتاج إلى التحكم في دورة حياة وقت التشغيل.

## البدء السريع

```bash
# سرد Hooks المتاحة
openclaw hooks list

# تمكين Hook
openclaw hooks enable session-memory

# التحقق من حالة Hook
openclaw hooks check

# الحصول على معلومات مفصلة
openclaw hooks info session-memory
```

## أنواع الأحداث

تشترك Hooks في مفتاح محدد من هذا الجدول، أو في اسم فئة مجرد
(`command` أو `session` أو `agent` أو `gateway` أو `message`) لتلقي كل إجراء
ضمن تلك الفئة. لا يطلق نواة OpenClaw أي شيء آخر، ولذلك يكون أي اسم آخر في
الغالب خطأً مطبعيًا يترك Hook معطلة بصمت (ولا يمكن إطلاقه إلا بواسطة Plugin
يطلق حدثًا مخصصًا). يسجل محمّل Hooks تحذيرًا لمثل هذه الأسماء
(مثل `command:nwe`)، ويشير إليها `openclaw hooks info <name>`، ولذلك يمكن
تشخيص Hook التي لا تعمل مطلقًا.

| الحدث                    | وقت إطلاقه                                                |
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | عند إصدار الأمر `/new`                                    |
| `command:reset`          | عند إصدار الأمر `/reset`                                  |
| `command:stop`           | عند إصدار الأمر `/stop`                                   |
| `command`                | أي حدث أمر (مستمع عام)                                    |
| `session:compact:before` | قبل أن تلخّص Compaction السجل                             |
| `session:compact:after`  | بعد اكتمال Compaction                                     |
| `session:patch`          | عند تعديل خصائص الجلسة                                    |
| `agent:bootstrap`        | قبل حقن ملفات تمهيد مساحة العمل                           |
| `gateway:startup`        | بعد بدء القنوات وتحميل Hooks                              |
| `gateway:shutdown`       | عند بدء إيقاف تشغيل Gateway                               |
| `gateway:pre-restart`    | قبل إعادة تشغيل متوقعة لـ Gateway                         |
| `message:received`       | رسالة واردة من أي قناة                                    |
| `message:transcribed`    | بعد اكتمال نسخ الصوت                                      |
| `message:preprocessed`   | بعد اكتمال المعالجة المسبقة للوسائط والروابط أو تخطيها    |
| `message:sent`           | عند محاولة الإرسال الصادر (تحتوي `context.success` على النتيجة) |

## كتابة Hooks

### بنية Hook

كل Hook عبارة عن دليل يحتوي على ملفين:

```text
my-hook/
├── HOOK.md          # البيانات الوصفية + التوثيق
└── handler.ts       # تنفيذ المعالج
```

يمكن أن يكون ملف المعالج `handler.ts` أو `handler.js` أو `index.ts` أو `index.js`.

### تنسيق HOOK.md

```markdown
---
name: my-hook
description: "وصف موجز لما تفعله Hook هذه"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Hook الخاصة بي

يوضع التوثيق المفصل هنا.
```

**حقول البيانات الوصفية** (`metadata.openclaw`):

| الحقل      | الوصف                                                      |
| ---------- | ---------------------------------------------------------- |
| `emoji`    | الرمز التعبيري المعروض في CLI                              |
| `events`   | مصفوفة الأحداث المطلوب الاستماع إليها                      |
| `export`   | التصدير المسمى المطلوب استخدامه (الافتراضي `"default"`)    |
| `os`       | المنصات المطلوبة (مثل `["darwin", "linux"]`)               |
| `requires` | مسارات `bins` أو `anyBins` أو `env` أو `config` المطلوبة   |
| `always`   | تجاوز فحوص الأهلية (قيمة منطقية)                           |
| `hookKey`  | تجاوز مفتاح التهيئة (الافتراضي هو اسم Hook)                |
| `homepage` | عنوان URL للتوثيق يعرضه `openclaw hooks info`              |
| `install`  | طرق التثبيت                                                |

### تنفيذ المعالج

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

يتضمن كل حدث: `type` و`action` و`sessionKey` و`timestamp` و`messages` و`context` (بيانات خاصة بالحدث). يمكن أيضًا أن تتضمن سياقات Hooks المكتوبة بأنواع في Plugin الخاصة بالوكيل والأداة الحقل `trace`، وهو سياق تتبع تشخيصي متوافق مع W3C وللقراءة فقط، ويمكن للـ Plugins تمريره إلى السجلات المهيكلة لربطه مع OTEL.

لا تُسلَّم السلاسل النصية المدفوعة إلى `event.messages` مرة أخرى إلى الدردشة إلا مع
`command:new` و`command:reset` (وتُوجَّه كرد إلى المحادثة الأصلية)
ومع `session:compact:before` و`session:compact:after`
(وتُرسل كإشعارات بحالة Compaction). تتجاهل جميع الأحداث الأخرى الرسائل
المدفوعة، بما فيها `command:stop` و`message:*` و`agent:bootstrap`
و`session:patch` و`gateway:*`.

### أبرز عناصر سياق الأحداث

**أحداث الأوامر** (`command:new` و`command:reset`): `context.sessionEntry` و`context.previousSessionEntry` و`context.commandSource` و`context.senderId` و`context.workspaceDir` و`context.cfg`.

**أحداث الأوامر** (`command:stop`): `context.sessionEntry` و`context.sessionId` و`context.commandSource` و`context.senderId`.

**أحداث الرسائل** (`message:received`): `context.from` و`context.content` و`context.channelId` و`context.metadata` (بيانات خاصة بالمزوّد، بما فيها `senderId` و`senderName` و`guildId`). يفضّل `context.content` نص أمر غير فارغ للرسائل الشبيهة بالأوامر، ثم يعود إلى نص الرسالة الواردة الخام والنص العام؛ ولا يتضمن إثراءً خاصًا بالوكيل، مثل سجل سلسلة المحادثة أو ملخصات الروابط.

**أحداث الرسائل** (`message:sent`): `context.to` و`context.content` و`context.success` و`context.channelId`، بالإضافة إلى `context.error` عند فشل الإرسال.

**أحداث الرسائل** (`message:transcribed`): `context.transcript` و`context.from` و`context.channelId` و`context.mediaPath`.

**أحداث الرسائل** (`message:preprocessed`): `context.bodyForAgent` (النص النهائي المُثرى) و`context.from` و`context.channelId`.

**أحداث التمهيد** (`agent:bootstrap`): `context.bootstrapFiles` (مصفوفة قابلة للتعديل) و`context.agentId`.

**أحداث تصحيح الجلسة** (`session:patch`): `context.sessionEntry` و`context.patch` (الحقول المتغيرة فقط) و`context.cfg`. لا يمكن إلا للعملاء ذوي الامتيازات تشغيل أحداث التصحيح؛ والسياق نسخة مستنسخة، ولذلك لا تستطيع المعالجات تعديل إدخال الجلسة الفعلي.

**أحداث Compaction**: يتضمن `session:compact:before` الحقلين `messageCount` و`tokenCount`. ويضيف `session:compact:after` الحقول `compactedCount` و`summaryLength` و`tokensBefore` و`tokensAfter`.

يراقب `command:stop` إصدار المستخدم للأمر `/stop`؛ فهو جزء من دورة حياة الإلغاء/الأمر،
وليس بوابة لإنهاء الوكيل. ينبغي للـ Plugins التي تحتاج إلى فحص إجابة نهائية طبيعية
ومطالبة الوكيل بتمرير إضافي أن تستخدم Hook المكتوبة بأنواع
`before_agent_finalize` بدلًا من ذلك. راجع [Hooks الخاصة بـ Plugin](/ar/plugins/hooks).

**أحداث دورة حياة Gateway**: يتضمن `gateway:shutdown` الحقلين `reason` و`restartExpectedMs`، ويُطلق عند بدء إيقاف تشغيل Gateway. يتضمن `gateway:pre-restart` السياق نفسه، لكنه لا يُطلق إلا عندما يكون الإيقاف جزءًا من إعادة تشغيل متوقعة وتُقدَّم قيمة محدودة لـ `restartExpectedMs`. أثناء الإيقاف، يكون انتظار كل Hook لدورة الحياة قائمًا على أفضل جهد ومحدودًا، بحيث يستمر الإيقاف إذا تعطل أحد المعالجات. ميزانية الانتظار الافتراضية هي 5 ثوانٍ لـ `gateway:shutdown` و10 ثوانٍ لـ `gateway:pre-restart`.

استخدم `gateway:pre-restart` لإشعارات إعادة التشغيل القصيرة بينما لا تزال القنوات متاحة:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

بين حدث `gateway:shutdown` (أو `gateway:pre-restart`) وبقية تسلسل الإيقاف، يطلق Gateway أيضًا Hook مكتوبة بأنواع في Plugin باسم `session_end` لكل جلسة كانت لا تزال نشطة عند توقف العملية. تكون قيمة `reason` للحدث هي `shutdown` عند التوقف العادي بإشارة SIGTERM/SIGINT، و`restart` عندما يكون الإغلاق مجدولًا كجزء من إعادة تشغيل متوقعة. تكون عملية التصريف هذه محدودة حتى لا يتمكن معالج `session_end` البطيء من منع خروج العملية، ويجري تخطي الجلسات التي سبق إنهاؤها عبر الاستبدال أو إعادة الضبط أو الحذف أو Compaction لتجنب الإطلاق المزدوج.

## اكتشاف Hooks

تُكتشف Hooks من أربعة مصادر:

1. **Hooks المضمّنة**: تُشحن مع OpenClaw
2. **Hooks الخاصة بـ Plugin**: تكون مضمّنة داخل Plugins المثبّتة؛ ويمكنها تجاوز Hooks المضمّنة التي تحمل الاسم نفسه
3. **Hooks المُدارة**: `~/.openclaw/hooks/` (مثبّتة من المستخدم ومشتركة بين مساحات العمل)؛ ويمكنها تجاوز Hooks المضمّنة وتلك الخاصة بـ Plugins. تشترك الأدلة الإضافية من `hooks.internal.load.extraDirs` في هذه الأولوية.
4. **Hooks مساحة العمل**: `<workspace>/hooks/` (لكل وكيل، ومعطّلة افتراضيًا إلى أن تُمكّن صراحةً)

يمكن لـ Hooks مساحة العمل إضافة أسماء Hooks جديدة، لكنها لا تستطيع تجاوز Hooks المضمّنة أو المُدارة أو المقدمة من Plugins التي تحمل الاسم نفسه.

يتخطى Gateway اكتشاف Hooks الداخلية عند بدء التشغيل حتى تُهيّأ. مكّن Hook مضمّنة أو مُدارة باستخدام `openclaw hooks enable <name>`، أو ثبّت حزمة Hooks، أو اضبط `hooks.internal.enabled=true` للاشتراك. عندما تمكّن Hook واحدة بالاسم، لا يحمّل Gateway إلا معالج تلك Hook؛ أما `hooks.internal.enabled=true` وأدلة Hooks الإضافية والمعالجات القديمة فتشترك في الاكتشاف الواسع.

### حزم Hooks

حزم Hooks هي حزم npm تصدّر Hooks عبر `openclaw.hooks` في `package.json`. ثبّتها باستخدام:

```bash
openclaw plugins install <path-or-spec>
```

مواصفات Npm مخصصة للسجل فقط (اسم الحزمة + إصدار دقيق اختياري أو وسم توزيع). تُرفض مواصفات Git/URL/الملفات ونطاقات semver. الأمران الأقدم `openclaw hooks install` و`openclaw hooks update` اسمان مستعاران مهملان للأمرين `openclaw plugins install` و`openclaw plugins update`.

## الخطافات المضمّنة

| الخطاف                | الأحداث                                           | ما يفعله                                                        |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | يحفظ سياق الجلسة في `<workspace>/memory/`                        |
| bootstrap-extra-files | `agent:bootstrap`                                 | يحقن ملفات تمهيد إضافية من أنماط glob                            |
| command-logger        | `command`                                         | يسجّل جميع الأوامر في `~/.openclaw/logs/commands.log`            |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | يرسل إشعارات محادثة مرئية عند بدء/انتهاء Compaction الجلسة       |
| boot-md               | `gateway:startup`                                 | يشغّل `BOOT.md` عند بدء Gateway                                  |

فعّل أي خطاف مضمّن:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### تفاصيل session-memory

يستخرج آخر رسائل المستخدم/المساعد (15 افتراضيًا، وقابلة للضبط عبر `hooks.internal.entries.session-memory.messages`) ويحفظها في `<workspace>/memory/YYYY-MM-DD-HHMM.md` باستخدام التاريخ المحلي للمضيف. يعمل التقاط الذاكرة في الخلفية كي لا تتأخر إقرارات `/new` و`/reset` بسبب قراءة النصوص المنسوخة أو التوليد الاختياري للاسم المختصر. اضبط `hooks.internal.entries.session-memory.llmSlug: true` لتوليد أسماء مختصرة وصفية للملفات، ويمكنك اختياريًا ضبط `hooks.internal.entries.session-memory.model` على اسم مستعار مضبوط مثل `sonnet`، أو معرّف نموذج مجرد لدى المزوّد الافتراضي للوكيل، أو مرجع `provider/model`. يستخدم توليد الاسم المختصر النموذج الافتراضي للوكيل عند حذف `model`، ويرجع إلى أسماء مختصرة قائمة على الطابع الزمني عند عدم توفره. يتطلب ضبط `workspace.dir`.

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

تُقبل `patterns` و`files` كاسمين مستعارين لـ`paths`. تُحل المسارات نسبةً إلى مساحة العمل ويجب أن تبقى داخلها. لا تُحمّل إلا أسماء ملفات التمهيد الأساسية المعروفة (`AGENTS.md`، و`SOUL.md`، و`TOOLS.md`، و`IDENTITY.md`، و`USER.md`، و`HEARTBEAT.md`، و`BOOTSTRAP.md`، و`MEMORY.md`).

<a id="command-logger"></a>

### تفاصيل command-logger

يسجّل كل أمر يبدأ بشرطة مائلة كسطر JSON (الطابع الزمني، والإجراء، ومفتاح الجلسة، ومعرّف المرسل، والمصدر) في `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### تفاصيل compaction-notifier

يرسل رسائل حالة قصيرة إلى المحادثة الحالية عندما يبدأ OpenClaw ضغط النص المنسوخ للجلسة وينتهي منه. يجعل هذا المنعطفات الطويلة أقل إرباكًا على واجهات المحادثة، إذ يمكن للمستخدم رؤية أن المساعد يلخّص السياق وسيواصل بعد Compaction.

<a id="boot-md"></a>

### تفاصيل boot-md

يشغّل `BOOT.md` عند بدء Gateway لكل نطاق وكيل مضبوط، إذا كان الملف موجودًا في مساحة العمل المحلولة لذلك الوكيل.

## خطافات Plugin

يمكن لبرامج Plugin تسجيل خطافات محددة الأنواع عبر حزمة تطوير Plugin لتحقيق تكامل أعمق:
اعتراض استدعاءات الأدوات، وتعديل المطالبات، والتحكم في تدفق الرسائل، وغير ذلك.
استخدم خطافات Plugin عندما تحتاج إلى `before_tool_call` أو `before_agent_reply`
أو `before_install` أو خطافات دورة حياة أخرى داخل العملية.

تختلف الخطافات الداخلية التي تديرها برامج Plugin: فهي تشارك في نظام أحداث
الأوامر/دورة الحياة العام في هذه الصفحة، وتظهر في `openclaw hooks list` بصيغة
`plugin:<id>`. استخدمها للآثار الجانبية والتوافق مع حزم الخطافات، وليس
للبرمجيات الوسيطة المرتبة أو بوابات السياسات.

للاطلاع على المرجع الكامل لخطافات Plugin، راجع [خطافات Plugin](/ar/plugins/hooks).

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

تستوفي قيم البيئة الخاصة بكل خطاف عمليات التحقق من أهلية `requires.env` للخطاف (إلى جانب بيئة العملية)، ويمكن للمعالجات قراءتها من إدخال إعداد الخطاف الخاص بها:

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
لا يزال تنسيق إعداد المصفوفة القديم `hooks.internal.handlers` مدعومًا للتوافق مع الإصدارات السابقة، لكن ينبغي للخطافات الجديدة استخدام النظام القائم على الاكتشاف.
</Note>

## مرجع CLI

```bash
# سرد جميع الخطافات (أضف --eligible أو --verbose أو --json)
openclaw hooks list

# عرض معلومات مفصلة عن خطاف
openclaw hooks info <hook-name>

# عرض ملخص الأهلية
openclaw hooks check

# تمكين/تعطيل
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## أفضل الممارسات

- **أبقِ المعالجات سريعة.** تعمل الخطافات أثناء معالجة الأوامر. شغّل الأعمال الثقيلة دون انتظار باستخدام `void processInBackground(event)`.
- **تعامل مع الأخطاء بسلاسة.** غلّف العمليات المحفوفة بالمخاطر ضمن try/catch؛ ولا تطرح استثناءً حتى تتمكن المعالجات الأخرى من العمل.
- **رشّح الأحداث مبكرًا.** ارجع فورًا إذا لم يكن نوع الحدث/الإجراء ذا صلة.
- **استخدم مفاتيح أحداث محددة.** فضّل `"events": ["command:new"]` على `"events": ["command"]` لتقليل الحمل الإضافي.

## استكشاف الأخطاء وإصلاحها

### لم يُكتشف الخطاف

```bash
# التحقق من بنية الدليل
ls -la ~/.openclaw/hooks/my-hook/
# ينبغي أن يعرض: HOOK.md, handler.ts

# سرد جميع الخطافات المكتشفة
openclaw hooks list
```

### الخطاف غير مؤهل

```bash
openclaw hooks info my-hook
```

تحقق من الملفات التنفيذية المفقودة (PATH)، أو متغيرات البيئة، أو قيم الإعداد، أو توافق نظام التشغيل.

### الخطاف لا يُنفّذ

1. تحقق من تمكين الخطاف: `openclaw hooks list`
2. أعد تشغيل عملية Gateway حتى يُعاد تحميل الخطافات.
3. تحقق من سجلات Gateway: `openclaw logs --follow | grep -i hook`

## ذو صلة

- [مرجع CLI: الخطافات](/ar/cli/hooks)
- [خطافات Webhook](/ar/automation/cron-jobs#webhooks)
- [خطافات Plugin](/ar/plugins/hooks) — خطافات دورة حياة Plugin داخل العملية
- [الإعداد](/ar/gateway/configuration-reference#hooks)
