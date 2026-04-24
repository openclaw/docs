---
read_when:
    - أنت تريد أتمتة مدفوعة بالأحداث لأوامر `/new` و`/reset` و`/stop` وأحداث دورة حياة الوكيل
    - أنت تريد إنشاء Hooks أو تثبيتها أو تصحيح أخطائها
summary: 'Hooks: أتمتة مدفوعة بالأحداث للأوامر وأحداث دورة الحياة'
title: Hooks
x-i18n:
    generated_at: "2026-04-24T07:29:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6246f25272208d9a9ff2f186bcd3a463c78ea24b833f0259174d0f7f0cbea6
    source_path: automation/hooks.md
    workflow: 15
---

Hooks هي نصوص برمجية صغيرة تعمل عندما يحدث شيء داخل Gateway. يمكن اكتشافها من الأدلة وفحصها باستخدام `openclaw hooks`. يحمّل Gateway الـ hooks الداخلية فقط بعد أن تفعّل hooks أو تُعدّ إدخال hook واحدًا على الأقل، أو حزمة hook، أو معالجًا قديمًا، أو دليل hooks إضافيًا.

يوجد نوعان من Hooks في OpenClaw:

- **Hooks الداخلية** (هذه الصفحة): تعمل داخل Gateway عند وقوع أحداث الوكيل، مثل `/new` أو `/reset` أو `/stop` أو أحداث دورة الحياة.
- **Webhooks**: نقاط نهاية HTTP خارجية تسمح لأنظمة أخرى بتشغيل أعمال داخل OpenClaw. راجع [Webhooks](/ar/automation/cron-jobs#webhooks).

يمكن أيضًا تجميع Hooks داخل plugins. يعرض `openclaw hooks list` كلًا من hooks المستقلة وhooks التي تديرها plugins.

## البدء السريع

```bash
# سرد الـ hooks المتاحة
openclaw hooks list

# تفعيل hook
openclaw hooks enable session-memory

# التحقق من حالة hook
openclaw hooks check

# الحصول على معلومات تفصيلية
openclaw hooks info session-memory
```

## أنواع الأحداث

| الحدث                    | وقت إطلاقه                                      |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | عند إصدار الأمر `/new`                           |
| `command:reset`          | عند إصدار الأمر `/reset`                         |
| `command:stop`           | عند إصدار الأمر `/stop`                          |
| `command`                | أي حدث أمر (مستمع عام)                           |
| `session:compact:before` | قبل أن يلخّص Compaction السجل                    |
| `session:compact:after`  | بعد اكتمال Compaction                            |
| `session:patch`          | عند تعديل خصائص الجلسة                           |
| `agent:bootstrap`        | قبل حقن ملفات bootstrap الخاصة بمساحة العمل      |
| `gateway:startup`        | بعد بدء القنوات وتحميل hooks                     |
| `message:received`       | رسالة واردة من أي قناة                           |
| `message:transcribed`    | بعد اكتمال نسخ الصوت إلى نص                      |
| `message:preprocessed`   | بعد اكتمال جميع عمليات فهم الوسائط والروابط      |
| `message:sent`           | عند تسليم الرسالة الصادرة                        |

## كتابة Hooks

### بنية Hook

كل hook عبارة عن دليل يحتوي على ملفين:

```text
my-hook/
├── HOOK.md          # البيانات الوصفية + التوثيق
└── handler.ts       # تنفيذ المعالج
```

### تنسيق `HOOK.md`

```markdown
---
name: my-hook
description: "وصف مختصر لما تقوم به هذه الـ hook"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

يوضع التوثيق التفصيلي هنا.
```

**حقول البيانات الوصفية** (`metadata.openclaw`):

| الحقل      | الوصف                                                |
| ---------- | ---------------------------------------------------- |
| `emoji`    | رمز تعبيري للعرض في CLI                              |
| `events`   | مصفوفة بالأحداث المطلوب الاستماع إليها              |
| `export`   | التصدير المسمّى المطلوب استخدامه (الافتراضي `"default"`) |
| `os`       | المنصات المطلوبة (مثل `["darwin", "linux"]`)        |
| `requires` | عناصر `bins` أو `anyBins` أو `env` أو مسارات `config` المطلوبة |
| `always`   | تجاوز فحوص الأهلية (قيمة منطقية)                    |
| `install`  | طرق التثبيت                                          |

### تنفيذ المعالج

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // منطقك هنا

  // اختياريًا إرسال رسالة إلى المستخدم
  event.messages.push("Hook executed!");
};

export default handler;
```

يتضمن كل حدث: `type` و`action` و`sessionKey` و`timestamp` و`messages` (أضف إليها للإرسال إلى المستخدم) و`context` (بيانات خاصة بالحدث). يمكن أن تتضمن سياقات hooks الخاصة بالوكيل وplugin الأدوات أيضًا `trace`، وهو سياق trace تشخيصي متوافق مع W3C للقراءة فقط، ويمكن للـ plugins تمريره إلى السجلات المنظمة لربط OTEL.

### أبرز عناصر سياق الحدث

**أحداث الأوامر** (`command:new`, `command:reset`): `context.sessionEntry` و`context.previousSessionEntry` و`context.commandSource` و`context.workspaceDir` و`context.cfg`.

**أحداث الرسائل** (`message:received`): `context.from` و`context.content` و`context.channelId` و`context.metadata` (بيانات خاصة بالمزوّد تتضمن `senderId` و`senderName` و`guildId`).

**أحداث الرسائل** (`message:sent`): `context.to` و`context.content` و`context.success` و`context.channelId`.

**أحداث الرسائل** (`message:transcribed`): `context.transcript` و`context.from` و`context.channelId` و`context.mediaPath`.

**أحداث الرسائل** (`message:preprocessed`): `context.bodyForAgent` (النص النهائي المُغنى) و`context.from` و`context.channelId`.

**أحداث Bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (مصفوفة قابلة للتعديل) و`context.agentId`.

**أحداث تصحيح الجلسة** (`session:patch`): `context.sessionEntry` و`context.patch` (الحقول التي تغيّرت فقط) و`context.cfg`. لا يمكن إلا للعملاء المميزين تشغيل أحداث patch.

**أحداث Compaction**: يتضمن `session:compact:before` كلاً من `messageCount` و`tokenCount`. ويضيف `session:compact:after` القيم `compactedCount` و`summaryLength` و`tokensBefore` و`tokensAfter`.

## اكتشاف Hooks

يتم اكتشاف Hooks من هذه الأدلة، بترتيب تصاعدي في أسبقية التجاوز:

1. **Hooks المضمّنة**: تُشحن مع OpenClaw
2. **Hooks الخاصة بالـ plugin**: hooks مُجمّعة داخل plugins المثبتة
3. **Hooks المُدارة**: `~/.openclaw/hooks/` (مثبّتة من المستخدم، ومشتركة بين مساحات العمل). تشترك الأدلة الإضافية من `hooks.internal.load.extraDirs` في هذه الأسبقية.
4. **Hooks مساحة العمل**: `<workspace>/hooks/` (لكل وكيل، ومعطلة افتراضيًا حتى يتم تفعيلها صراحةً)

يمكن لـ hooks مساحة العمل إضافة أسماء hooks جديدة، لكنها لا تستطيع تجاوز hooks المضمّنة أو المُدارة أو المقدمة من plugins إذا كان لها الاسم نفسه.

يتجاوز Gateway اكتشاف hooks الداخلية عند بدء التشغيل إلى أن يتم إعداد hooks الداخلية. فعّل hook مضمّنة أو مُدارة باستخدام `openclaw hooks enable <name>`، أو ثبّت حزمة hook، أو اضبط `hooks.internal.enabled=true` للاشتراك. عند تفعيل hook مسمّاة واحدة، يحمّل Gateway معالج تلك الـ hook فقط؛ بينما يفعّل `hooks.internal.enabled=true` والأدلة الإضافية والمعالجات القديمة الاكتشاف الشامل.

### حزم Hooks

حزم Hooks هي حزم npm تصدّر hooks عبر `openclaw.hooks` في `package.json`. ثبّتها باستخدام:

```bash
openclaw plugins install <path-or-spec>
```

مواصفات npm تقتصر على السجل فقط (اسم الحزمة مع إصدار دقيق اختياري أو dist-tag). يتم رفض مواصفات Git/URL/file ونطاقات semver.

## Hooks المضمّنة

| Hook                  | الأحداث                        | ما الذي تفعله                                           |
| --------------------- | ------------------------------ | ------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | تحفظ سياق الجلسة في `<workspace>/memory/`               |
| bootstrap-extra-files | `agent:bootstrap`              | تحقن ملفات bootstrap إضافية من أنماط glob              |
| command-logger        | `command`                      | تسجل جميع الأوامر في `~/.openclaw/logs/commands.log`    |
| boot-md               | `gateway:startup`              | تشغّل `BOOT.md` عند بدء تشغيل gateway                   |

فعّل أي hook مضمّنة:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### تفاصيل session-memory

تستخرج آخر 15 رسالة مستخدم/مساعد، وتولّد slug وصفيًا لاسم الملف عبر LLM، وتحفظه في `<workspace>/memory/YYYY-MM-DD-slug.md`. يتطلب ذلك أن يكون `workspace.dir` مضبوطًا.

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

تُحلّ المسارات نسبةً إلى مساحة العمل. لا يتم تحميل إلا أسماء ملفات bootstrap الأساسية المعترف بها (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### تفاصيل command-logger

تسجل كل أمر slash في `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### تفاصيل boot-md

تشغّل `BOOT.md` من مساحة العمل النشطة عند بدء تشغيل gateway.

## Hooks الخاصة بالـ Plugin

يمكن للـ plugins تسجيل hooks عبر Plugin SDK لتحقيق تكامل أعمق: اعتراض استدعاءات الأدوات، وتعديل المطالبات، والتحكم في تدفق الرسائل، وغير ذلك. يوفّر Plugin SDK عدد 28 hook تغطي تحليل النموذج، ودورة حياة الوكيل، وتدفق الرسائل، وتنفيذ الأدوات، وتنسيق الوكلاء الفرعيين، ودورة حياة gateway.

للاطلاع على المرجع الكامل لـ hooks الخاصة بالـ plugin، بما في ذلك `before_tool_call` و`before_agent_reply` و`before_install` وجميع hooks الأخرى الخاصة بالـ plugin، راجع [Plugin Architecture](/ar/plugins/architecture-internals#provider-runtime-hooks).

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

متغيرات البيئة لكل hook:

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

أدلة hooks إضافية:

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
لا تزال صيغة الإعداد القديمة `hooks.internal.handlers` القائمة على المصفوفة مدعومة من أجل التوافق مع الإصدارات السابقة، لكن ينبغي أن تستخدم hooks الجديدة النظام القائم على الاكتشاف.
</Note>

## مرجع CLI

```bash
# سرد جميع الـ hooks (أضف --eligible أو --verbose أو --json)
openclaw hooks list

# عرض معلومات تفصيلية عن hook
openclaw hooks info <hook-name>

# عرض ملخص الأهلية
openclaw hooks check

# تفعيل/تعطيل
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## أفضل الممارسات

- **اجعل المعالجات سريعة.** تعمل Hooks أثناء معالجة الأوامر. نفّذ الأعمال الثقيلة بنمط fire-and-forget باستخدام `void processInBackground(event)`.
- **تعامل مع الأخطاء بسلاسة.** لفّ العمليات المحفوفة بالمخاطر داخل try/catch؛ لا ترمِ الأخطاء حتى تتمكن المعالجات الأخرى من العمل.
- **صفِّ الأحداث مبكرًا.** أعد فورًا إذا لم يكن نوع الحدث/إجراؤه ذا صلة.
- **استخدم مفاتيح أحداث محددة.** فضّل `"events": ["command:new"]` على `"events": ["command"]` لتقليل الحمل.

## استكشاف الأخطاء وإصلاحها

### لم يتم اكتشاف Hook

```bash
# تحقّق من بنية الدليل
ls -la ~/.openclaw/hooks/my-hook/
# يجب أن يعرض: HOOK.md, handler.ts

# سرد جميع الـ hooks المكتشفة
openclaw hooks list
```

### Hook غير مؤهلة

```bash
openclaw hooks info my-hook
```

تحقق من غياب الملفات التنفيذية المطلوبة (PATH)، أو متغيرات البيئة، أو قيم الإعداد، أو توافق نظام التشغيل.

### Hook لا تُنفَّذ

1. تحقّق من أن hook مفعّلة: `openclaw hooks list`
2. أعد تشغيل عملية gateway حتى يُعاد تحميل hooks.
3. تحقّق من سجلات gateway: `./scripts/clawlog.sh | grep hook`

## ذو صلة

- [مرجع CLI: hooks](/ar/cli/hooks)
- [Webhooks](/ar/automation/cron-jobs#webhooks)
- [Plugin Architecture](/ar/plugins/architecture-internals#provider-runtime-hooks) — المرجع الكامل لـ hooks الخاصة بالـ plugin
- [Configuration](/ar/gateway/configuration-reference#hooks)
