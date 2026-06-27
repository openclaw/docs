---
read_when:
    - تحتاج إلى أتمتة مدفوعة بالأحداث لـ /new و/reset و/stop وأحداث دورة حياة الوكيل
    - تريد بناء الخطافات أو تثبيتها أو تصحيح أخطائها
summary: 'الخطافات: أتمتة مدفوعة بالأحداث للأوامر وأحداث دورة الحياة'
title: الخطافات
x-i18n:
    generated_at: "2026-06-27T17:08:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Hooks هي سكربتات صغيرة تعمل عندما يحدث شيء داخل Gateway. يمكن اكتشافها من الأدلة وفحصها باستخدام `openclaw hooks`. يحمّل Gateway Hooks الداخلية فقط بعد تمكين Hooks أو تكوين إدخال Hook واحد على الأقل، أو حزمة Hook، أو معالج قديم، أو دليل Hook إضافي.

يوجد نوعان من Hooks في OpenClaw:

- **Hooks الداخلية** (هذه الصفحة): تعمل داخل Gateway عند إطلاق أحداث الوكيل، مثل `/new` أو `/reset` أو `/stop` أو أحداث دورة الحياة.
- **Webhook**: نقاط نهاية HTTP خارجية تتيح للأنظمة الأخرى تشغيل عمل في OpenClaw. راجع [Webhook](/ar/automation/cron-jobs#webhooks).

يمكن أيضًا تضمين Hooks داخل plugins. يعرض `openclaw hooks list` كلًا من Hooks المستقلة وHooks المُدارة بواسطة plugin.

## اختر السطح المناسب

لدى OpenClaw عدة أسطح امتداد تبدو متشابهة لكنها تحل مشكلات مختلفة:

| إذا كنت تريد...                                                                                                     | استخدم...                                | لماذا                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| حفظ لقطة عند `/new`، أو تسجيل `/reset`، أو استدعاء API خارجي بعد `message:sent`، أو إضافة أتمتة عامة للمشغل | Hooks الداخلية (`HOOK.md`، هذه الصفحة) | Hooks المستندة إلى الملفات مخصصة للآثار الجانبية التي يديرها المشغل وأتمتة الأوامر/دورة الحياة |
| إعادة كتابة المطالبات، أو حظر الأدوات، أو إلغاء الرسائل الصادرة، أو إضافة وسيط/سياسة مرتبة                              | Hooks plugin النمطية عبر `api.on(...)`  | Hooks النمطية لها عقود صريحة، وأولويات، وقواعد دمج، ودلالات حظر/إلغاء      |
| إضافة تصدير للقياسات فقط أو قابلية مراقبة                                                                            | أحداث التشخيص                     | قابلية المراقبة هي ناقل أحداث منفصل، وليست سطح Hook للسياسات                              |

استخدم Hooks الداخلية عندما تريد أتمتة تتصرف مثل تكامل صغير مثبت. استخدم Hooks plugin النمطية عندما تحتاج إلى التحكم في دورة حياة وقت التشغيل.

## بدء سريع

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

| الحدث                    | متى يتم إطلاقه                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | إصدار أمر `/new`                                      |
| `command:reset`          | إصدار أمر `/reset`                                    |
| `command:stop`           | إصدار أمر `/stop`                                     |
| `command`                | أي حدث أمر (مستمع عام)                       |
| `session:compact:before` | قبل أن تلخص Compaction السجل                       |
| `session:compact:after`  | بعد اكتمال Compaction                                 |
| `session:patch`          | عند تعديل خصائص الجلسة                       |
| `agent:bootstrap`        | قبل حقن ملفات تمهيد مساحة العمل              |
| `gateway:startup`        | بعد بدء القنوات وتحميل Hooks                  |
| `gateway:shutdown`       | عند بدء إيقاف Gateway                               |
| `gateway:pre-restart`    | قبل إعادة تشغيل Gateway متوقعة                         |
| `message:received`       | رسالة واردة من أي قناة                           |
| `message:transcribed`    | بعد اكتمال تفريغ الصوت                        |
| `message:preprocessed`   | بعد اكتمال أو تخطي المعالجة المسبقة للوسائط والروابط |
| `message:sent`           | تسليم رسالة صادرة                                 |

## كتابة Hooks

### بنية Hook

كل Hook هو دليل يحتوي على ملفين:

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
| `events`   | مصفوفة بالأحداث المراد الاستماع إليها                        |
| `export`   | التصدير المسمى المراد استخدامه (الافتراضي هو `"default"`)        |
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

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

يتضمن كل حدث: `type` و`action` و`sessionKey` و`timestamp` و`messages` (ادفع الردود هنا على الأسطح القابلة للرد فقط) و`context` (بيانات خاصة بالحدث). يمكن أن تتضمن سياقات Hooks الوكيل والأداة أيضًا `trace`، وهو سياق تتبع تشخيصي للقراءة فقط ومتوافق مع W3C ويمكن أن تمرره plugins إلى السجلات المهيكلة لربط OTEL.

يتم تسليم `event.messages` تلقائيًا فقط على الأسطح القابلة للرد مثل
`command:*` و`message:received`. أحداث دورة الحياة فقط مثل
`agent:bootstrap` أو `session:*` أو `gateway:*` أو `message:sent` لا تحتوي على
قناة رد وتتجاهل الرسائل المدفوعة.

### أبرز سياقات الأحداث

**أحداث الأوامر** (`command:new`، `command:reset`): `context.sessionEntry`، `context.previousSessionEntry`، `context.commandSource`، `context.workspaceDir`، `context.cfg`.

**أحداث الرسائل** (`message:received`): `context.from`، `context.content`، `context.channelId`، `context.metadata` (بيانات خاصة بالمزود تشمل `senderId` و`senderName` و`guildId`). يفضل `context.content` نص أمر غير فارغ للرسائل الشبيهة بالأوامر، ثم يعود إلى النص الوارد الخام والنص العام؛ ولا يتضمن إثراءً خاصًا بالوكيل مثل سجل السلسلة أو ملخصات الروابط.

**أحداث الرسائل** (`message:sent`): `context.to`، `context.content`، `context.success`، `context.channelId`.

**أحداث الرسائل** (`message:transcribed`): `context.transcript`، `context.from`، `context.channelId`، `context.mediaPath`.

**أحداث الرسائل** (`message:preprocessed`): `context.bodyForAgent` (النص النهائي المُثرى)، `context.from`، `context.channelId`.

**أحداث التمهيد** (`agent:bootstrap`): `context.bootstrapFiles` (مصفوفة قابلة للتعديل)، `context.agentId`.

**أحداث تصحيح الجلسة** (`session:patch`): `context.sessionEntry`، `context.patch` (الحقول التي تغيرت فقط)، `context.cfg`. يمكن للعملاء ذوي الامتيازات فقط تشغيل أحداث التصحيح.

**أحداث Compaction**: يتضمن `session:compact:before` القيمتين `messageCount` و`tokenCount`. يضيف `session:compact:after` القيم `compactedCount` و`summaryLength` و`tokensBefore` و`tokensAfter`.

يراقب `command:stop` إصدار المستخدم للأمر `/stop`؛ وهو جزء من دورة حياة الإلغاء/الأمر،
وليس بوابة لإنهاء الوكيل. يجب على plugins التي تحتاج إلى فحص إجابة نهائية طبيعية
وطلب تمريرة إضافية من الوكيل استخدام Hook plugin النمطي
`before_agent_finalize` بدلًا من ذلك. راجع [Hooks plugin](/ar/plugins/hooks).

**أحداث دورة حياة Gateway**: يتضمن `gateway:shutdown` القيمتين `reason` و`restartExpectedMs` ويتم إطلاقه عند بدء إيقاف Gateway. يتضمن `gateway:pre-restart` السياق نفسه لكنه لا يُطلق إلا عندما يكون الإيقاف جزءًا من إعادة تشغيل متوقعة ويتم توفير قيمة `restartExpectedMs` محدودة. أثناء الإيقاف، يكون انتظار كل Hook لدورة الحياة بأفضل جهد ومحدودًا بحيث يستمر الإيقاف إذا تعطل معالج. ميزانية الانتظار الافتراضية هي 5 ثوانٍ لـ`gateway:shutdown` و10 ثوانٍ لـ`gateway:pre-restart`.

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

بين حدث `gateway:shutdown` (أو `gateway:pre-restart`) وبقية تسلسل الإيقاف، يطلق Gateway أيضًا Hook plugin نمطيًا باسم `session_end` لكل جلسة كانت لا تزال نشطة عند توقف العملية. تكون قيمة `reason` في الحدث هي `shutdown` عند إيقاف عادي عبر SIGTERM/SIGINT، و`restart` عندما يكون الإغلاق مجدولًا كجزء من إعادة تشغيل متوقعة. هذا التصريف محدود بحيث لا يستطيع معالج `session_end` البطيء منع خروج العملية، ويتم تخطي الجلسات التي أُنهِيت بالفعل عبر الاستبدال / إعادة الضبط / الحذف / Compaction لتجنب الإطلاق المزدوج.

## اكتشاف Hooks

يتم اكتشاف Hooks من هذه الأدلة، بترتيب أسبقية التجاوز المتزايدة:

1. **Hooks المضمّنة**: تُشحن مع OpenClaw
2. **Hooks plugins**: Hooks مضمّنة داخل plugins مثبتة
3. **Hooks المُدارة**: `~/.openclaw/hooks/` (مثبتة بواسطة المستخدم، مشتركة عبر مساحات العمل). تشترك الأدلة الإضافية من `hooks.internal.load.extraDirs` في هذه الأسبقية.
4. **Hooks مساحة العمل**: `<workspace>/hooks/` (لكل وكيل، معطلة افتراضيًا حتى يتم تمكينها صراحة)

يمكن لـHooks مساحة العمل إضافة أسماء Hooks جديدة لكنها لا تستطيع تجاوز Hooks المضمّنة أو المُدارة أو المقدمة من plugins التي تحمل الاسم نفسه.

يتخطى Gateway اكتشاف Hooks الداخلية عند بدء التشغيل حتى يتم تكوين Hooks الداخلية. مكّن Hook مضمّنًا أو مُدارًا باستخدام `openclaw hooks enable <name>`، أو ثبّت حزمة Hook، أو اضبط `hooks.internal.enabled=true` للاشتراك. عند تمكين Hook مسمى واحد، يحمّل Gateway معالج ذلك Hook فقط؛ أما `hooks.internal.enabled=true` وأدلة Hook الإضافية والمعالجات القديمة فتشترك في الاكتشاف الواسع.

### حزم Hook

حزم Hook هي حزم npm تصدر Hooks عبر `openclaw.hooks` في `package.json`. ثبّت باستخدام:

```bash
openclaw plugins install <path-or-spec>
```

مواصفات npm مقتصرة على السجل فقط (اسم الحزمة + إصدار دقيق اختياري أو dist-tag). تُرفض مواصفات Git/URL/file ونطاقات semver.

## Hooks المضمّنة

| الخطاف                | الأحداث                                           | ما يفعله                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | يحفظ سياق الجلسة في `<workspace>/memory/`                      |
| bootstrap-extra-files | `agent:bootstrap`                                 | يحقن ملفات تمهيد إضافية من أنماط glob                         |
| command-logger        | `command`                                         | يسجل جميع الأوامر في `~/.openclaw/logs/commands.log`           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | يرسل إشعارات محادثة مرئية عند بدء/انتهاء Compaction الجلسة     |
| boot-md               | `gateway:startup`                                 | يشغل `BOOT.md` عند بدء Gateway                                 |

فعّل أي خطاف مرفق:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### تفاصيل session-memory

يستخرج آخر 15 رسالة من المستخدم/المساعد ويحفظها في `<workspace>/memory/YYYY-MM-DD-HHMM.md` باستخدام التاريخ المحلي للمضيف. يعمل التقاط الذاكرة في الخلفية حتى لا تتأخر تأكيدات `/new` و`/reset` بسبب قراءة النصوص أو توليد slug اختياري. اضبط `hooks.internal.entries.session-memory.llmSlug: true` لتوليد slugs وصفية لأسماء الملفات باستخدام النموذج المكوّن. يتطلب تهيئة `workspace.dir`.

<a id="bootstrap-extra-files"></a>

### تهيئة bootstrap-extra-files

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

تُحل المسارات نسبةً إلى مساحة العمل. لا تُحمّل إلا أسماء ملفات التمهيد الأساسية المعروفة (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`، `MEMORY.md`).

<a id="command-logger"></a>

### تفاصيل command-logger

يسجل كل أمر شرطة مائلة في `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### تفاصيل compaction-notifier

يرسل رسائل حالة قصيرة إلى المحادثة الحالية عندما يبدأ OpenClaw وينتهي من ضغط نص الجلسة. يجعل هذا الأدوار الطويلة أقل إرباكًا على واجهات المحادثة لأن المستخدم يمكنه رؤية أن المساعد يلخص السياق وسيواصل بعد Compaction.

<a id="boot-md"></a>

### تفاصيل boot-md

يشغل `BOOT.md` من مساحة العمل النشطة عند بدء Gateway.

## خطافات Plugin

يمكن لـ Plugins تسجيل خطافات typed عبر Plugin SDK لتكامل أعمق:
اعتراض استدعاءات الأدوات، وتعديل الموجهات، والتحكم في تدفق الرسائل، والمزيد.
استخدم خطافات Plugin عندما تحتاج إلى `before_tool_call` أو `before_agent_reply` أو
`before_install` أو خطافات دورة حياة أخرى داخل العملية.

تختلف الخطافات الداخلية التي يديرها Plugin: فهي تشارك في نظام أحداث الأوامر/دورة الحياة
الخشن في هذه الصفحة وتظهر في `openclaw hooks list` على هيئة
`plugin:<id>`. استخدمها للآثار الجانبية والتوافق مع حزم الخطافات، وليس
للبرمجيات الوسيطة المرتبة أو بوابات السياسة.

للمرجع الكامل لخطافات Plugin، راجع [خطافات Plugin](/ar/plugins/hooks).

## التهيئة

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
لا يزال تنسيق تهيئة المصفوفة القديم `hooks.internal.handlers` مدعومًا للتوافق مع الإصدارات السابقة، لكن ينبغي للخطافات الجديدة استخدام النظام القائم على الاكتشاف.
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

- **أبقِ المعالجات سريعة.** تعمل الخطافات أثناء معالجة الأوامر. شغّل الأعمال الثقيلة بأسلوب الإطلاق والنسيان باستخدام `void processInBackground(event)`.
- **تعامل مع الأخطاء بسلاسة.** غلّف العمليات المحفوفة بالمخاطر في try/catch؛ لا ترمِ أخطاء حتى تتمكن المعالجات الأخرى من العمل.
- **رشّح الأحداث مبكرًا.** عُد فورًا إذا لم يكن نوع الحدث/الإجراء ذا صلة.
- **استخدم مفاتيح أحداث محددة.** فضّل `"events": ["command:new"]` على `"events": ["command"]` لتقليل الحمل الزائد.

## استكشاف الأخطاء وإصلاحها

### لم يُكتشف الخطاف

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

تحقق من الثنائيات المفقودة (PATH)، أو متغيرات البيئة، أو قيم التهيئة، أو توافق نظام التشغيل.

### الخطاف لا يُنفّذ

1. تحقق من أن الخطاف مفعّل: `openclaw hooks list`
2. أعد تشغيل عملية Gateway حتى تُعاد تحميل الخطافات.
3. تحقق من سجلات Gateway: `./scripts/clawlog.sh | grep hook`

## ذو صلة

- [مرجع CLI: الخطافات](/ar/cli/hooks)
- [Webhooks](/ar/automation/cron-jobs#webhooks)
- [خطافات Plugin](/ar/plugins/hooks) — خطافات دورة حياة Plugin داخل العملية
- [التهيئة](/ar/gateway/configuration-reference#hooks)
