---
read_when:
    - إذا كنت تريد أتمتة قائمة على الأحداث لأوامر `/new` و`/reset` و`/stop` وأحداث دورة حياة الوكيل
    - إذا كنت تريد إنشاء الخطافات أو تثبيتها أو تصحيح أخطائها
summary: 'الخطافات: أتمتة قائمة على الأحداث للأوامر وأحداث دورة الحياة'
title: الخطافات
x-i18n:
    generated_at: "2026-04-11T02:44:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14296398e4042d442ebdf071a07c6be99d4afda7cbf3c2b934e76dc5539742c7
    source_path: automation/hooks.md
    workflow: 15
---

# الخطافات

الخطافات هي نصوص برمجية صغيرة تعمل عند حدوث شيء ما داخل Gateway. يتم اكتشافها تلقائيًا من الأدلة ويمكن فحصها باستخدام `openclaw hooks`.

يوجد نوعان من الخطافات في OpenClaw:

- **الخطافات الداخلية** (هذه الصفحة): تعمل داخل Gateway عند إطلاق أحداث الوكيل، مثل `/new` أو `/reset` أو `/stop` أو أحداث دورة الحياة.
- **Webhooks**: نقاط نهاية HTTP خارجية تتيح للأنظمة الأخرى تشغيل العمل في OpenClaw. راجع [Webhooks](/ar/automation/cron-jobs#webhooks).

يمكن أيضًا تضمين الخطافات داخل plugins. يعرض `openclaw hooks list` كلًا من الخطافات المستقلة والخطافات التي تديرها plugins.

## البدء السريع

```bash
# اعرض الخطافات المتاحة
openclaw hooks list

# فعّل خطافًا
openclaw hooks enable session-memory

# تحقّق من حالة الخطاف
openclaw hooks check

# احصل على معلومات مفصلة
openclaw hooks info session-memory
```

## أنواع الأحداث

| الحدث                    | وقت إطلاقه                                      |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | عند إصدار الأمر `/new`                           |
| `command:reset`          | عند إصدار الأمر `/reset`                         |
| `command:stop`           | عند إصدار الأمر `/stop`                          |
| `command`                | أي حدث أمر (مستمع عام)                           |
| `session:compact:before` | قبل أن يلخّص الضغط السجل                          |
| `session:compact:after`  | بعد اكتمال الضغط                                 |
| `session:patch`          | عند تعديل خصائص الجلسة                           |
| `agent:bootstrap`        | قبل إدخال ملفات bootstrap لمساحة العمل          |
| `gateway:startup`        | بعد بدء القنوات وتحميل الخطافات                  |
| `message:received`       | رسالة واردة من أي قناة                           |
| `message:transcribed`    | بعد اكتمال نسخ الصوت إلى نص                      |
| `message:preprocessed`   | بعد اكتمال فهم جميع الوسائط والروابط             |
| `message:sent`           | بعد تسليم الرسالة الصادرة                        |

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

يوضع التوثيق المفصل هنا.
```

**حقول البيانات الوصفية** (`metadata.openclaw`):

| الحقل      | الوصف                                                |
| ---------- | ---------------------------------------------------- |
| `emoji`    | الرمز التعبيري المعروض في CLI                        |
| `events`   | مصفوفة بالأحداث المطلوب الاستماع إليها              |
| `export`   | التصدير المسمى المطلوب استخدامه (الافتراضي `"default"`) |
| `os`       | المنصات المطلوبة (مثل `["darwin", "linux"]`)        |
| `requires` | مسارات `bins` أو `anyBins` أو `env` أو `config` المطلوبة |
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

  // اختياريًا أرسل رسالة إلى المستخدم
  event.messages.push("تم تنفيذ الخطاف!");
};

export default handler;
```

يتضمن كل حدث: `type` و`action` و`sessionKey` و`timestamp` و`messages` (أضف إليها لإرسالها إلى المستخدم) و`context` (بيانات خاصة بالحدث).

### أبرز عناصر سياق الحدث

**أحداث الأوامر** (`command:new` و`command:reset`): `context.sessionEntry` و`context.previousSessionEntry` و`context.commandSource` و`context.workspaceDir` و`context.cfg`.

**أحداث الرسائل** (`message:received`): `context.from` و`context.content` و`context.channelId` و`context.metadata` (بيانات خاصة بالموفر تتضمن `senderId` و`senderName` و`guildId`).

**أحداث الرسائل** (`message:sent`): `context.to` و`context.content` و`context.success` و`context.channelId`.

**أحداث الرسائل** (`message:transcribed`): `context.transcript` و`context.from` و`context.channelId` و`context.mediaPath`.

**أحداث الرسائل** (`message:preprocessed`): `context.bodyForAgent` (النص النهائي المُثْرى) و`context.from` و`context.channelId`.

**أحداث Bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (مصفوفة قابلة للتعديل) و`context.agentId`.

**أحداث تصحيح الجلسة** (`session:patch`): `context.sessionEntry` و`context.patch` (الحقول التي تغيّرت فقط) و`context.cfg`. لا يمكن إلا للعملاء ذوي الامتيازات تشغيل أحداث التصحيح.

**أحداث الضغط**: يتضمن `session:compact:before` القيمتين `messageCount` و`tokenCount`. ويضيف `session:compact:after` القيم `compactedCount` و`summaryLength` و`tokensBefore` و`tokensAfter`.

## اكتشاف الخطافات

يتم اكتشاف الخطافات من هذه الأدلة، بترتيب تصاعدي لأولوية التجاوز:

1. **الخطافات المضمّنة**: تأتي مع OpenClaw
2. **خطافات plugins**: خطافات مضمّنة داخل plugins المثبتة
3. **الخطافات المُدارة**: `~/.openclaw/hooks/` (مثبّتة من المستخدم ومشتركة بين مساحات العمل). تشترك الأدلة الإضافية من `hooks.internal.load.extraDirs` في هذه الأولوية.
4. **خطافات مساحة العمل**: `<workspace>/hooks/` (لكل وكيل، ومعطلة افتراضيًا حتى يتم تفعيلها صراحةً)

يمكن لخطافات مساحة العمل إضافة أسماء خطافات جديدة، لكنها لا تستطيع تجاوز الخطافات المضمّنة أو المُدارة أو المقدمة من plugin بالاسم نفسه.

### حِزم الخطافات

حِزم الخطافات هي حزم npm تصدّر الخطافات عبر `openclaw.hooks` في `package.json`. ثبّتها باستخدام:

```bash
openclaw plugins install <path-or-spec>
```

تقتصر مواصفات npm على السجل فقط (اسم الحزمة مع إصدار دقيق اختياري أو dist-tag). ويتم رفض مواصفات Git/URL/file ونطاقات semver.

## الخطافات المضمّنة

| الخطاف                | الأحداث                        | ما الذي يفعله                                          |
| --------------------- | ------------------------------ | ------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset` | يحفظ سياق الجلسة في `<workspace>/memory/`              |
| bootstrap-extra-files | `agent:bootstrap`              | يدرج ملفات bootstrap إضافية من أنماط glob             |
| command-logger        | `command`                      | يسجل جميع الأوامر في `~/.openclaw/logs/commands.log`   |
| boot-md               | `gateway:startup`              | يشغّل `BOOT.md` عند بدء gateway                        |

لتفعيل أي خطاف مضمّن:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### تفاصيل session-memory

يستخرج آخر 15 رسالة من المستخدم/المساعد، ويولّد اسم ملف وصفيًا عبر LLM، ثم يحفظه في `<workspace>/memory/YYYY-MM-DD-slug.md`. يتطلب إعداد `workspace.dir`.

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

يتم تحليل المسارات نسبةً إلى مساحة العمل. ولا يتم تحميل إلا أسماء ملفات bootstrap الأساسية المعروفة (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md` و`MEMORY.md`).

<a id="command-logger"></a>

### تفاصيل command-logger

يسجل كل أمر slash في `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### تفاصيل boot-md

يشغّل `BOOT.md` من مساحة العمل النشطة عند بدء gateway.

## خطافات plugins

يمكن لـ plugins تسجيل الخطافات عبر Plugin SDK لتحقيق تكامل أعمق: اعتراض استدعاءات الأدوات، وتعديل المطالبات، والتحكم في تدفق الرسائل، وغير ذلك. يوفّر Plugin SDK عدد 28 خطافًا تغطي تحليل النموذج، ودورة حياة الوكيل، وتدفق الرسائل، وتنفيذ الأدوات، وتنسيق الوكلاء الفرعيين، ودورة حياة gateway.

للاطلاع على المرجع الكامل لخطافات plugin، بما في ذلك `before_tool_call` و`before_agent_reply` و`before_install` وجميع خطافات plugin الأخرى، راجع [Plugin Architecture](/ar/plugins/architecture#provider-runtime-hooks).

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
لا تزال صيغة إعداد المصفوفة القديمة `hooks.internal.handlers` مدعومة للتوافق مع الإصدارات السابقة، لكن الخطافات الجديدة يجب أن تستخدم النظام المعتمد على الاكتشاف.
</Note>

## مرجع CLI

```bash
# اعرض كل الخطافات (أضف --eligible أو --verbose أو --json)
openclaw hooks list

# اعرض معلومات مفصلة عن خطاف
openclaw hooks info <hook-name>

# اعرض ملخص الأهلية
openclaw hooks check

# تفعيل/تعطيل
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## أفضل الممارسات

- **اجعل المعالجات سريعة.** تعمل الخطافات أثناء معالجة الأوامر. شغّل الأعمال الثقيلة في الخلفية بأسلوب fire-and-forget باستخدام `void processInBackground(event)`.
- **تعامل مع الأخطاء بسلاسة.** غلّف العمليات المحفوفة بالمخاطر داخل try/catch؛ ولا ترمِ الأخطاء حتى تتمكن المعالجات الأخرى من العمل.
- **صفِّ الأحداث مبكرًا.** أعِد فورًا إذا لم يكن نوع/إجراء الحدث ذا صلة.
- **استخدم مفاتيح أحداث محددة.** فضّل `"events": ["command:new"]` بدلًا من `"events": ["command"]` لتقليل الحمل.

## استكشاف الأخطاء وإصلاحها

### لم يتم اكتشاف الخطاف

```bash
# تحقّق من بنية الدليل
ls -la ~/.openclaw/hooks/my-hook/
# يجب أن يعرض: HOOK.md, handler.ts

# اعرض كل الخطافات المكتشفة
openclaw hooks list
```

### الخطاف غير مؤهل

```bash
openclaw hooks info my-hook
```

تحقق من وجود ثنائيات مفقودة (PATH)، أو متغيرات بيئة، أو قيم إعداد، أو توافق نظام التشغيل.

### الخطاف لا يعمل

1. تحقّق من أن الخطاف مفعّل: `openclaw hooks list`
2. أعد تشغيل عملية gateway لكي يُعاد تحميل الخطافات.
3. افحص سجلات gateway: `./scripts/clawlog.sh | grep hook`

## ذو صلة

- [مرجع CLI: hooks](/cli/hooks)
- [Webhooks](/ar/automation/cron-jobs#webhooks)
- [Plugin Architecture](/ar/plugins/architecture#provider-runtime-hooks) — المرجع الكامل لخطافات plugin
- [الإعداد](/ar/gateway/configuration-reference#hooks)
