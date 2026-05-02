---
read_when:
    - تريد أتمتة قائمة على الأحداث لـ /new و/reset و/stop وأحداث دورة حياة الوكيل
    - تريد إنشاء الخطافات أو تثبيتها أو تصحيح أخطائها
summary: 'الخطافات: أتمتة مدفوعة بالأحداث للأوامر وأحداث دورة الحياة'
title: الخطافات
x-i18n:
    generated_at: "2026-05-02T20:41:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

Hooks هي سكربتات صغيرة تُشغَّل عند حدوث شيء ما داخل Gateway. يمكن اكتشافها من الأدلة وفحصها باستخدام `openclaw hooks`. لا يحمّل Gateway الخطافات الداخلية إلا بعد تمكين الخطافات أو تكوين إدخال خطاف واحد على الأقل، أو حزمة خطافات، أو معالج قديم، أو دليل خطافات إضافي.

هناك نوعان من الخطافات في OpenClaw:

- **الخطافات الداخلية** (هذه الصفحة): تُشغَّل داخل Gateway عند إطلاق أحداث الوكيل، مثل `/new` أو `/reset` أو `/stop` أو أحداث دورة الحياة.
- **Webhooks**: نقاط نهاية HTTP خارجية تتيح لأنظمة أخرى تشغيل عمل في OpenClaw. راجع [Webhooks](/ar/automation/cron-jobs#webhooks).

يمكن أيضًا تضمين الخطافات داخل plugins. يعرض `openclaw hooks list` الخطافات المستقلة والخطافات المُدارة بواسطة Plugin.

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

| الحدث                    | متى يُطلق                                                  |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | عند إصدار أمر `/new`                                      |
| `command:reset`          | عند إصدار أمر `/reset`                                    |
| `command:stop`           | عند إصدار أمر `/stop`                                     |
| `command`                | أي حدث أمر (مستمع عام)                                    |
| `session:compact:before` | قبل أن يلخّص Compaction السجل                              |
| `session:compact:after`  | بعد اكتمال Compaction                                     |
| `session:patch`          | عند تعديل خصائص الجلسة                                    |
| `agent:bootstrap`        | قبل حقن ملفات تمهيد مساحة العمل                           |
| `gateway:startup`        | بعد بدء القنوات وتحميل الخطافات                           |
| `gateway:shutdown`       | عند بدء إيقاف تشغيل Gateway                               |
| `gateway:pre-restart`    | قبل إعادة تشغيل متوقعة لـ Gateway                         |
| `message:received`       | رسالة واردة من أي قناة                                    |
| `message:transcribed`    | بعد اكتمال نسخ الصوت                                      |
| `message:preprocessed`   | بعد اكتمال المعالجة المسبقة للوسائط والروابط أو تخطيها    |
| `message:sent`           | تسليم رسالة صادرة                                         |

## كتابة الخطافات

### بنية الخطاف

كل خطاف هو دليل يحتوي على ملفين:

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

| الحقل      | الوصف                                                |
| ---------- | ---------------------------------------------------- |
| `emoji`    | رمز تعبيري للعرض في CLI                              |
| `events`   | مصفوفة بالأحداث التي يجب الاستماع إليها              |
| `export`   | التصدير المسمى المطلوب استخدامه (الإعداد الافتراضي `"default"`) |
| `os`       | المنصات المطلوبة (مثل `["darwin", "linux"]`)         |
| `requires` | مسارات `bins` أو `anyBins` أو `env` أو `config` المطلوبة |
| `always`   | تجاوز فحوص الأهلية (قيمة منطقية)                     |
| `install`  | طرق التثبيت                                          |

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

يتضمن كل حدث: `type` و`action` و`sessionKey` و`timestamp` و`messages` (ادفع إليها للإرسال إلى المستخدم) و`context` (بيانات خاصة بالحدث). يمكن أن تتضمن سياقات خطافات agent وtool plugin أيضًا `trace`، وهو سياق تتبع تشخيصي للقراءة فقط ومتوافق مع W3C، يمكن أن تمرره plugins إلى السجلات المنظمة لربط OTEL.

### أبرز سياقات الأحداث

**أحداث الأوامر** (`command:new` و`command:reset`): `context.sessionEntry` و`context.previousSessionEntry` و`context.commandSource` و`context.workspaceDir` و`context.cfg`.

**أحداث الرسائل** (`message:received`): `context.from` و`context.content` و`context.channelId` و`context.metadata` (بيانات خاصة بالمزوّد تشمل `senderId` و`senderName` و`guildId`). يفضّل `context.content` نص أمر غير فارغ للرسائل الشبيهة بالأوامر، ثم يرجع إلى النص الوارد الخام والنص العام؛ ولا يتضمن إثراءً خاصًا بالوكيل مثل سجل المحادثة أو ملخصات الروابط.

**أحداث الرسائل** (`message:sent`): `context.to` و`context.content` و`context.success` و`context.channelId`.

**أحداث الرسائل** (`message:transcribed`): `context.transcript` و`context.from` و`context.channelId` و`context.mediaPath`.

**أحداث الرسائل** (`message:preprocessed`): `context.bodyForAgent` (النص النهائي المُثرى) و`context.from` و`context.channelId`.

**أحداث التمهيد** (`agent:bootstrap`): `context.bootstrapFiles` (مصفوفة قابلة للتعديل) و`context.agentId`.

**أحداث تصحيح الجلسة** (`session:patch`): `context.sessionEntry` و`context.patch` (الحقول التي تغيّرت فقط) و`context.cfg`. لا يمكن إلا للعملاء ذوي الامتياز تشغيل أحداث التصحيح.

**أحداث Compaction**: يتضمن `session:compact:before` كلًا من `messageCount` و`tokenCount`. يضيف `session:compact:after` كلًا من `compactedCount` و`summaryLength` و`tokensBefore` و`tokensAfter`.

يراقب `command:stop` إصدار المستخدم للأمر `/stop`؛ فهو دورة حياة إلغاء/أمر، وليس بوابة إنهاء الوكيل. يجب على plugins التي تحتاج إلى فحص إجابة نهائية طبيعية وطلب مرور إضافي واحد من الوكيل استخدام خطاف plugin المطبوع `before_agent_finalize` بدلًا من ذلك. راجع [خطافات Plugin](/ar/plugins/hooks).

**أحداث دورة حياة Gateway**: يتضمن `gateway:shutdown` كلًا من `reason` و`restartExpectedMs` ويُطلق عند بدء إيقاف تشغيل Gateway. يتضمن `gateway:pre-restart` السياق نفسه، لكنه لا يُطلق إلا عندما يكون الإيقاف جزءًا من إعادة تشغيل متوقعة وتُوفَّر قيمة `restartExpectedMs` محدودة. أثناء الإيقاف، يكون انتظار كل خطاف دورة حياة قائمًا على أفضل جهد ومحدودًا بحيث يستمر الإيقاف إذا تعطل أحد المعالجات.

## اكتشاف الخطافات

تُكتشف الخطافات من هذه الأدلة، بترتيب تصاعدي لأسبقية التجاوز:

1. **الخطافات المضمنة**: تُشحن مع OpenClaw
2. **خطافات Plugin**: خطافات مضمنة داخل plugins المثبتة
3. **الخطافات المُدارة**: `~/.openclaw/hooks/` (مثبتة بواسطة المستخدم ومشتركة بين مساحات العمل). تشترك الأدلة الإضافية من `hooks.internal.load.extraDirs` في هذه الأسبقية.
4. **خطافات مساحة العمل**: `<workspace>/hooks/` (لكل وكيل، معطلة افتراضيًا حتى يتم تمكينها صراحة)

يمكن لخطافات مساحة العمل إضافة أسماء خطافات جديدة لكنها لا تستطيع تجاوز الخطافات المضمنة أو المُدارة أو المقدمة من Plugin التي تحمل الاسم نفسه.

يتخطى Gateway اكتشاف الخطافات الداخلية عند بدء التشغيل حتى يتم تكوين الخطافات الداخلية. مكّن خطافًا مضمنًا أو مُدارًا باستخدام `openclaw hooks enable <name>`، أو ثبّت حزمة خطافات، أو عيّن `hooks.internal.enabled=true` للاشتراك. عندما تُمكّن خطافًا واحدًا مسمى، يحمّل Gateway معالج ذلك الخطاف فقط؛ أما `hooks.internal.enabled=true` وأدلة الخطافات الإضافية والمعالجات القديمة فتشترك في الاكتشاف الواسع.

### حزم الخطافات

حزم الخطافات هي حزم npm تصدّر الخطافات عبر `openclaw.hooks` في `package.json`. ثبّتها باستخدام:

```bash
openclaw plugins install <path-or-spec>
```

مواصفات Npm خاصة بالسجل فقط (اسم الحزمة + إصدار دقيق اختياري أو dist-tag). يتم رفض مواصفات Git/URL/file ونطاقات semver.

## الخطافات المضمّنة

| Hook                  | Events                         | ما يفعله                                                |
| --------------------- | ------------------------------ | ------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | يحفظ سياق الجلسة في `<workspace>/memory/`               |
| bootstrap-extra-files | `agent:bootstrap`              | يحقن ملفات تمهيد إضافية من أنماط glob                  |
| command-logger        | `command`                      | يسجّل كل الأوامر في `~/.openclaw/logs/commands.log`    |
| boot-md               | `gateway:startup`              | يشغّل `BOOT.md` عند بدء Gateway                         |

فعّل أي خطاف مضمّن:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### تفاصيل session-memory

يستخرج آخر 15 رسالة من المستخدم/المساعد، وينشئ مقطع اسم ملف وصفيًا عبر LLM، ويحفظه في `<workspace>/memory/YYYY-MM-DD-slug.md` باستخدام التاريخ المحلي للمضيف. يتطلب تهيئة `workspace.dir`.

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

تُحل المسارات نسبةً إلى مساحة العمل. لا تُحمّل إلا أسماء ملفات التمهيد الأساسية المعروفة (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### تفاصيل command-logger

يسجّل كل أمر شرطة مائلة في `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### تفاصيل boot-md

يشغّل `BOOT.md` من مساحة العمل النشطة عند بدء Gateway.

## خطافات Plugin

يمكن للـ Plugins تسجيل خطافات typed عبر Plugin SDK لتكامل أعمق:
اعتراض استدعاءات الأدوات، وتعديل المطالبات، والتحكم في تدفق الرسائل، والمزيد.
استخدم خطافات Plugin عندما تحتاج إلى `before_tool_call` أو `before_agent_reply` أو
`before_install` أو غيرها من خطافات دورة الحياة داخل العملية.

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

- **أبقِ المعالجات سريعة.** تعمل الخطافات أثناء معالجة الأوامر. شغّل الأعمال الثقيلة بأسلوب التشغيل دون انتظار باستخدام `void processInBackground(event)`.
- **تعامل مع الأخطاء بسلاسة.** غلّف العمليات الخطرة في try/catch؛ ولا ترمِ استثناءً حتى تتمكن المعالجات الأخرى من العمل.
- **رشّح الأحداث مبكرًا.** ارجع فورًا إذا لم يكن نوع الحدث/الإجراء ذا صلة.
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

تحقق من الثنائيات المفقودة (PATH)، أو متغيرات البيئة، أو قيم التهيئة، أو توافق نظام التشغيل.

### الخطاف لا يُنفَّذ

1. تحقّق من أن الخطاف مُمكّن: `openclaw hooks list`
2. أعد تشغيل عملية Gateway حتى تُعاد تحميل الخطافات.
3. تحقّق من سجلات Gateway: `./scripts/clawlog.sh | grep hook`

## ذات صلة

- [مرجع CLI: الخطافات](/ar/cli/hooks)
- [Webhooks](/ar/automation/cron-jobs#webhooks)
- [خطافات Plugin](/ar/plugins/hooks) — خطافات دورة حياة Plugin داخل العملية
- [التكوين](/ar/gateway/configuration-reference#hooks)
