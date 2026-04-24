---
read_when:
    - تحتاج إلى فهم كيفية توحيد الطوابع الزمنية للنموذج
    - إعداد المنطقة الزمنية للمستخدم في system prompts
summary: التعامل مع المنطقة الزمنية للوكلاء والأغلفة والمطالبات
title: المناطق الزمنية
x-i18n:
    generated_at: "2026-04-24T07:39:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 15
---

يوحّد OpenClaw الطوابع الزمنية بحيث يرى النموذج **وقتًا مرجعيًا واحدًا**.

## أغلفة الرسائل (محلية افتراضيًا)

تُغلَّف الرسائل الواردة في غلاف مثل:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

يكون الطابع الزمني في الغلاف **محليًا بالنسبة إلى المضيف افتراضيًا**، بدقة الدقائق.

يمكنك تجاوز ذلك باستخدام:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- يستخدم `envelopeTimezone: "utc"` التوقيت العالمي UTC.
- يستخدم `envelopeTimezone: "user"` القيمة `agents.defaults.userTimezone` (مع الرجوع إلى المنطقة الزمنية للمضيف).
- استخدم منطقة زمنية صريحة من IANA (مثل `"Europe/Vienna"`) لإزاحة ثابتة.
- تؤدي `envelopeTimestamp: "off"` إلى إزالة الطوابع الزمنية المطلقة من ترويسات الأغلفة.
- تؤدي `envelopeElapsed: "off"` إلى إزالة لاحقات الزمن المنقضي (بنمط `+2m`).

### أمثلة

**محلي (الافتراضي):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**منطقة زمنية ثابتة:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**الزمن المنقضي:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## حمولات الأدوات (بيانات المزوّد الخام + حقول موحّدة)

تعيد استدعاءات الأدوات (`channels.discord.readMessages` و`channels.slack.readMessages` وغيرها) **طوابع زمنية خام خاصة بالمزوّد**.
كما نرفق حقولًا موحّدة لتحقيق الاتساق:

- `timestampMs` (مللي ثواني UTC من حقبة يونكس)
- `timestampUtc` (سلسلة UTC بصيغة ISO 8601)

يتم الحفاظ على حقول المزوّد الخام.

## المنطقة الزمنية للمستخدم في system prompt

اضبط `agents.defaults.userTimezone` لإخبار النموذج بالمنطقة الزمنية المحلية للمستخدم. إذا كانت
غير مضبوطة، يحل OpenClaw **المنطقة الزمنية للمضيف أثناء التشغيل** (من دون كتابة إلى الإعداد).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

يتضمن system prompt ما يلي:

- قسم `Current Date & Time` مع الوقت المحلي والمنطقة الزمنية
- `Time format: 12-hour` أو `24-hour`

يمكنك التحكم في تنسيق المطالبة باستخدام `agents.defaults.timeFormat` (`auto` | `12` | `24`).

راجع [التاريخ والوقت](/ar/date-time) للاطلاع على السلوك الكامل والأمثلة.

## ذو صلة

- [Heartbeat](/ar/gateway/heartbeat) — تستخدم الساعات النشطة المنطقة الزمنية للجدولة
- [وظائف Cron](/ar/automation/cron-jobs) — تستخدم تعبيرات Cron المنطقة الزمنية للجدولة
- [التاريخ والوقت](/ar/date-time) — السلوك الكامل للتاريخ/الوقت والأمثلة
