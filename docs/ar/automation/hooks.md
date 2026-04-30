---
read_when:
    - تريد أتمتة قائمة على الأحداث لكل من /new و /reset و /stop وأحداث دورة حياة الوكيل
    - تريد بناء الخطافات أو تثبيتها أو تصحيح أخطائها
summary: 'Hooks: أتمتة مدفوعة بالأحداث للأوامر وأحداث دورة الحياة'
title: الخطافات
x-i18n:
    generated_at: "2026-04-30T07:39:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 16
---

Hooks هي نصوص برمجية صغيرة تعمل عند حدوث شيء داخل Gateway. يمكن اكتشافها من الأدلة وفحصها باستخدام `openclaw hooks`. يحمّل Gateway الخطّافات الداخلية فقط بعد تمكين الخطّافات أو تكوين إدخال خطّاف واحد على الأقل، أو حزمة خطّافات، أو معالج قديم، أو دليل خطّافات إضافي.

يوجد نوعان من الخطّافات في OpenClaw:

- **الخطّافات الداخلية** (هذه الصفحة): تعمل داخل Gateway عند إطلاق أحداث الوكيل، مثل `/new` أو `/reset` أو `/stop` أو أحداث دورة الحياة.
- **Webhooks**: نقاط نهاية HTTP خارجية تتيح للأنظمة الأخرى تشغيل عمل في OpenClaw. راجع [Webhooks](/ar/automation/cron-jobs#webhooks).

يمكن أيضًا تجميع الخطّافات داخل plugins. يعرض `openclaw hooks list` كلًا من الخطّافات المستقلة والخطّافات المُدارة بواسطة plugin.

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
| `command:new`            | إصدار الأمر `/new`                                      |
| `command:reset`          | إصدار الأمر `/reset`                                    |
| `command:stop`           | إصدار الأمر `/stop`                                     |
| `command`                | أي حدث أمر (مستمع عام)                       |
| `session:compact:before` | قبل أن يلخّص Compaction السجل                       |
| `session:compact:after`  | بعد اكتمال Compaction                                 |
| `session:patch`          | عند تعديل خصائص الجلسة                       |
| `agent:bootstrap`        | قبل حقن ملفات تمهيد مساحة العمل              |
| `gateway:startup`        | بعد بدء القنوات وتحميل الخطّافات                  |
| `gateway:shutdown`       | عند بدء إيقاف Gateway                               |
| `gateway:pre-restart`    | قبل إعادة تشغيل Gateway متوقعة                         |
| `message:received`       | رسالة واردة من أي قناة                           |
| `message:transcribed`    | بعد اكتمال تفريغ الصوت                        |
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
| `events`   | مصفوفة أحداث للاستماع إليها                        |
| `export`   | التصدير المسمّى المراد استخدامه (الافتراضي `"default"`)        |
| `os`       | المنصات المطلوبة (مثل `["darwin", "linux"]`)     |
| `requires` | مسارات `bins` أو `anyBins` أو `env` أو `config` المطلوبة |
| `always`   | تجاوز فحوص الأهلية (قيمة منطقية)                  |
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

يتضمن كل حدث: `type` و`action` و`sessionKey` و`timestamp` و`messages` (ادفع إليها للإرسال إلى المستخدم) و`context` (بيانات خاصة بالحدث). يمكن أن تتضمن سياقات خطّافات وكيل وplugin الأدوات أيضًا `trace`، وهو سياق تتبع تشخيصي متوافق مع W3C وللقراءة فقط يمكن أن تمرره plugins إلى السجلات المنظمة لربط OTEL.

### أبرز سياقات الأحداث

**أحداث الأوامر** (`command:new`، `command:reset`): `context.sessionEntry`، `context.previousSessionEntry`، `context.commandSource`، `context.workspaceDir`، `context.cfg`.

**أحداث الرسائل** (`message:received`): `context.from`، `context.content`، `context.channelId`، `context.metadata` (بيانات خاصة بالمزوّد تشمل `senderId` و`senderName` و`guildId`).

**أحداث الرسائل** (`message:sent`): `context.to`، `context.content`، `context.success`، `context.channelId`.

**أحداث الرسائل** (`message:transcribed`): `context.transcript`، `context.from`، `context.channelId`، `context.mediaPath`.

**أحداث الرسائل** (`message:preprocessed`): `context.bodyForAgent` (النص النهائي المُثرى)، `context.from`، `context.channelId`.

**أحداث التمهيد** (`agent:bootstrap`): `context.bootstrapFiles` (مصفوفة قابلة للتعديل)، `context.agentId`.

**أحداث تصحيح الجلسة** (`session:patch`): `context.sessionEntry`، `context.patch` (الحقول التي تغيّرت فقط)، `context.cfg`. يمكن للعملاء ذوي الامتيازات فقط إطلاق أحداث التصحيح.

**أحداث Compaction**: يتضمن `session:compact:before` كلًا من `messageCount` و`tokenCount`. يضيف `session:compact:after` كلًا من `compactedCount` و`summaryLength` و`tokensBefore` و`tokensAfter`.

يراقب `command:stop` إصدار المستخدم للأمر `/stop`؛ إنه إلغاء/دورة حياة
أمر، وليس بوابة إنهاء للوكيل. يجب على plugins التي تحتاج إلى فحص
إجابة نهائية طبيعية وطلب مرور إضافي واحد من الوكيل استخدام خطّاف
plugin المكتوب `before_agent_finalize` بدلًا من ذلك. راجع [خطّافات Plugin](/ar/plugins/hooks).

**أحداث دورة حياة Gateway**: يتضمن `gateway:shutdown` كلًا من `reason` و`restartExpectedMs` ويُطلق عند بدء إيقاف Gateway. يتضمن `gateway:pre-restart` السياق نفسه لكنه لا يُطلق إلا عندما يكون الإيقاف جزءًا من إعادة تشغيل متوقعة وتُوفَّر قيمة `restartExpectedMs` محدودة. أثناء الإيقاف، يكون انتظار كل خطّاف دورة حياة وفق أفضل جهد ومحدودًا حتى يستمر الإيقاف إذا تعطل معالج.

## اكتشاف الخطّافات

تُكتشف الخطّافات من هذه الأدلة، بترتيب أسبقية التجاوز التصاعدية:

1. **الخطّافات المضمّنة**: المشحونة مع OpenClaw
2. **خطّافات Plugin**: الخطّافات المجمّعة داخل plugins المثبتة
3. **الخطّافات المُدارة**: `~/.openclaw/hooks/` (مثبتة من المستخدم، مشتركة عبر مساحات العمل). تشارك الأدلة الإضافية من `hooks.internal.load.extraDirs` هذه الأسبقية.
4. **خطّافات مساحة العمل**: `<workspace>/hooks/` (لكل وكيل، معطلة افتراضيًا حتى يتم تمكينها صراحة)

يمكن لخطّافات مساحة العمل إضافة أسماء خطّافات جديدة لكنها لا تستطيع تجاوز الخطّافات المضمّنة أو المُدارة أو المقدمة من plugin التي تحمل الاسم نفسه.

يتخطى Gateway اكتشاف الخطّافات الداخلية عند بدء التشغيل حتى تُكوَّن الخطّافات الداخلية. مكّن خطّافًا مضمّنًا أو مُدارًا باستخدام `openclaw hooks enable <name>`، أو ثبّت حزمة خطّافات، أو عيّن `hooks.internal.enabled=true` للاشتراك. عند تمكين خطّاف مسمّى واحد، يحمّل Gateway معالج ذلك الخطّاف فقط؛ بينما يشترك `hooks.internal.enabled=true` وأدلة الخطّافات الإضافية والمعالجات القديمة في الاكتشاف الواسع.

### حزم الخطّافات

حزم الخطّافات هي حزم npm تصدّر الخطّافات عبر `openclaw.hooks` في `package.json`. ثبّتها باستخدام:

```bash
openclaw plugins install <path-or-spec>
```

مواصفات npm من السجل فقط (اسم الحزمة + إصدار دقيق اختياري أو dist-tag). تُرفض مواصفات Git/URL/file ونطاقات semver.

## الخطّافات المضمّنة

| الخطّاف                  | الأحداث                         | ما يفعله                                          |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | يحفظ سياق الجلسة في `<workspace>/memory/`        |
| bootstrap-extra-files | `agent:bootstrap`              | يحقن ملفات تمهيد إضافية من أنماط glob |
| command-logger        | `command`                      | يسجل كل الأوامر في `~/.openclaw/logs/commands.log`  |
| boot-md               | `gateway:startup`              | يشغل `BOOT.md` عند بدء Gateway                |

مكّن أي خطّاف مضمّن:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### تفاصيل session-memory

يستخرج آخر 15 رسالة من المستخدم/المساعد، وينشئ slug وصفيًا لاسم الملف عبر LLM، ويحفظه في `<workspace>/memory/YYYY-MM-DD-slug.md` باستخدام التاريخ المحلي للمضيف. يتطلب تكوين `workspace.dir`.

<a id="bootstrap-extra-files"></a>

### تكوين bootstrap-extra-files

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

تُحل المسارات بالنسبة إلى مساحة العمل. لا تُحمّل إلا أسماء ملفات التمهيد الأساسية المعروفة (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`، `MEMORY.md`).

<a id="command-logger"></a>

### تفاصيل command-logger

يسجل كل أمر مائل في `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### تفاصيل boot-md

يشغل `BOOT.md` من مساحة العمل النشطة عند بدء Gateway.

## خطّافات Plugin

يمكن أن تسجل plugins خطّافات مكتوبة عبر Plugin SDK لتكامل أعمق:
اعتراض استدعاءات الأدوات، وتعديل المطالبات، والتحكم في تدفق الرسائل، والمزيد.
استخدم خطّافات plugin عندما تحتاج إلى `before_tool_call` أو `before_agent_reply`
أو `before_install` أو خطّافات دورة حياة أخرى داخل العملية.

للمرجع الكامل لخطّافات plugin، راجع [خطّافات Plugin](/ar/plugins/hooks).

## التكوين

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

أدلة الخطّافات الإضافية:

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
لا يزال تنسيق تكوين المصفوفة القديمة `hooks.internal.handlers` مدعومًا للتوافق العكسي، لكن ينبغي للخطّافات الجديدة استخدام النظام القائم على الاكتشاف.
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

- **أبقِ المعالجات سريعة.** تعمل الخطّافات أثناء معالجة الأوامر. شغّل الأعمال الثقيلة بأسلوب الإطلاق والنسيان باستخدام `void processInBackground(event)`.
- **تعامل مع الأخطاء برفق.** لفّ العمليات الخطرة في try/catch؛ لا ترمِ استثناءً حتى تتمكن المعالجات الأخرى من العمل.
- **رشّح الأحداث مبكرًا.** عُد فورًا إذا لم يكن نوع/إجراء الحدث ذا صلة.
- **استخدم مفاتيح أحداث محددة.** فضّل `"events": ["command:new"]` على `"events": ["command"]` لتقليل الحمل.

## استكشاف الأخطاء وإصلاحها

### لم يُكتشف الخطّاف

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### الخطّاف غير مؤهل

```bash
openclaw hooks info my-hook
```

تحقق من الثنائيات المفقودة (PATH)، أو متغيرات البيئة، أو قيم التكوين، أو توافق نظام التشغيل.

### الخطّاف لا يعمل

1. تحقق من تمكين الخطّاف: `openclaw hooks list`
2. أعد تشغيل عملية Gateway حتى تُعاد تحميل الخطّافات.
3. تحقق من سجلات Gateway: `./scripts/clawlog.sh | grep hook`

## ذات صلة

- [مرجع CLI: الخطافات](/ar/cli/hooks)
- [Webhookات](/ar/automation/cron-jobs#webhooks)
- [خطافات Plugin](/ar/plugins/hooks) — خطافات دورة حياة Plugin داخل العملية
- [التكوين](/ar/gateway/configuration-reference#hooks)
