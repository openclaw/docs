---
read_when:
    - تغيير سلوك مؤشر الكتابة أو إعداداته الافتراضية
summary: متى يعرض OpenClaw مؤشرات الكتابة وكيفية ضبطها
title: مؤشرات الكتابة
x-i18n:
    generated_at: "2026-05-06T07:51:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

تُرسل مؤشرات الكتابة إلى قناة الدردشة أثناء نشاط التشغيل. استخدم
`agents.defaults.typingMode` للتحكم في **متى** تبدأ الكتابة و`typingIntervalSeconds`
للتحكم في **عدد مرات** تحديثها.

## الإعدادات الافتراضية

عندما يكون `agents.defaults.typingMode` **غير مضبوط**، يحافظ OpenClaw على السلوك القديم:

- **الدردشات المباشرة**: تبدأ الكتابة فور بدء حلقة النموذج.
- **دردشات المجموعات مع إشارة**: تبدأ الكتابة فورًا.
- **دردشات المجموعات بدون إشارة**: تبدأ الكتابة فقط عندما يبدأ نص الرسالة بالتدفق.
- **تشغيلات Heartbeat**: تبدأ الكتابة عندما يبدأ تشغيل Heartbeat إذا كان
  هدف Heartbeat المحلول دردشة تدعم الكتابة ولم تكن الكتابة معطّلة.

## الأوضاع

اضبط `agents.defaults.typingMode` على أحد الخيارات التالية:

- `never` - لا يوجد مؤشر كتابة أبدًا.
- `instant` - ابدأ الكتابة **بمجرد بدء حلقة النموذج**، حتى إذا أعاد التشغيل
  لاحقًا رمز الرد الصامت فقط.
- `thinking` - ابدأ الكتابة عند **أول دلتا استدلال** (يتطلب
  `reasoningLevel: "stream"` للتشغيل).
- `message` - ابدأ الكتابة عند **أول دلتا نصية غير صامتة** (يتجاهل
  رمز الصمت `NO_REPLY`).

ترتيب "مدى بكوره في التشغيل":
`never` → `message` → `thinking` → `instant`

## التكوين

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

يمكنك تجاوز الوضع أو الإيقاع لكل جلسة:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## ملاحظات

- لن يعرض وضع `message` الكتابة للردود الصامتة فقط عندما تكون الحمولة كلها
  رمز الصمت الدقيق (على سبيل المثال `NO_REPLY` / `no_reply`،
  مع المطابقة دون حساسية لحالة الأحرف).
- يعمل `thinking` فقط إذا كان التشغيل يبث الاستدلال (`reasoningLevel: "stream"`).
  إذا لم يُصدر النموذج دلتات استدلال، فلن تبدأ الكتابة.
- كتابة Heartbeat هي إشارة حيوية لهدف التسليم المحلول. تبدأ
  عند بدء تشغيل Heartbeat بدلًا من اتباع توقيت تدفق `message` أو `thinking`.
  اضبط `typingMode: "never"` لتعطيلها.
- لا تُظهر Heartbeats الكتابة عندما يكون `target: "none"`، أو عندما يتعذر
  حل الهدف، أو عندما يكون تسليم الدردشة معطّلًا لـ Heartbeat، أو عندما لا
  تدعم القناة الكتابة.
- يتحكم `typingIntervalSeconds` في **إيقاع التحديث**، وليس وقت البدء.
  القيمة الافتراضية هي 6 ثوانٍ.

## ذات صلة

<CardGroup cols={2}>
  <Card title="Presence" href="/ar/concepts/presence" icon="signal">
    كيف يتتبع Gateway العملاء المتصلين ويعرضهم في تبويب Instances على macOS.
  </Card>
  <Card title="Streaming and chunking" href="/ar/concepts/streaming" icon="bars-staggered">
    سلوك التدفق الصادر، وحدود المقاطع، والتسليم الخاص بكل قناة.
  </Card>
</CardGroup>
