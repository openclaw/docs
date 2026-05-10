---
read_when:
    - تغيير سلوك مؤشر الكتابة أو إعداداته الافتراضية
summary: متى يعرض OpenClaw مؤشرات الكتابة وكيفية ضبطها
title: مؤشرات الكتابة
x-i18n:
    generated_at: "2026-05-10T19:36:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

تُرسل مؤشرات الكتابة إلى قناة الدردشة أثناء نشاط التشغيل. استخدم
`agents.defaults.typingMode` للتحكم في **وقت** بدء الكتابة و`typingIntervalSeconds`
للتحكم في **مدى تكرار** تحديثها.

## الإعدادات الافتراضية

عندما يكون `agents.defaults.typingMode` **غير معيّن**، يحافظ OpenClaw على السلوك القديم:

- **الدردشات المباشرة**: تبدأ الكتابة فور بدء حلقة النموذج.
- **دردشات المجموعة مع إشارة**: تبدأ الكتابة فورًا.
- **دردشات المجموعة بدون إشارة**: تبدأ الكتابة فقط عند بدء تدفق نص الرسالة.
- **تشغيلات Heartbeat**: تبدأ الكتابة عندما يبدأ تشغيل Heartbeat إذا كان
  هدف Heartbeat الذي تم حله دردشة تدعم الكتابة ولم تكن الكتابة معطلة.

## الأوضاع

عيّن `agents.defaults.typingMode` إلى أحد الخيارات التالية:

- `never` - لا يوجد مؤشر كتابة، أبدًا.
- `instant` - ابدأ الكتابة **بمجرد أن تبدأ حلقة النموذج**، حتى إذا كان التشغيل
  يعيد لاحقًا رمز الرد الصامت فقط.
- `thinking` - ابدأ الكتابة عند **أول فرق استدلال** (يتطلب
  `reasoningLevel: "stream"` للتشغيل).
- `message` - ابدأ الكتابة عند **أول فرق نصي غير صامت** (يتجاهل
  رمز الصمت `NO_REPLY`).

ترتيب "مدى تبكير تشغيله":
`never` → `message` → `thinking` → `instant`

## التكوين

عيّن الإعداد الافتراضي على مستوى الوكيل:

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

تجاوز الوضع أو الإيقاع لكل جلسة:

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
  مع مطابقة غير حساسة لحالة الأحرف).
- لا يعمل `thinking` إلا إذا كان التشغيل يبث الاستدلال (`reasoningLevel: "stream"`).
  إذا لم يصدر النموذج فروق استدلال، فلن تبدأ الكتابة.
- كتابة Heartbeat هي إشارة حيوية لهدف التسليم الذي تم حله. تبدأ
  عند بدء تشغيل Heartbeat بدلًا من اتباع توقيت تدفق `message` أو `thinking`.
  عيّن `typingMode: "never"` لتعطيلها.
- لا تعرض Heartbeats الكتابة عندما يكون `target: "none"`، أو عندما يتعذر
  حل الهدف، أو عندما يكون تسليم الدردشة معطلًا لـ Heartbeat، أو عندما لا
  تدعم القناة الكتابة.
- يتحكم `typingIntervalSeconds` في **إيقاع التحديث**، وليس وقت البدء.
  القيمة الافتراضية هي 6 ثوانٍ.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Presence" href="/ar/concepts/presence" icon="signal">
    كيف يتتبع Gateway العملاء المتصلين ويعرضهم في علامة تبويب مثيلات macOS.
  </Card>
  <Card title="Streaming and chunking" href="/ar/concepts/streaming" icon="bars-staggered">
    سلوك البث الصادر، وحدود الأجزاء، والتسليم الخاص بكل قناة.
  </Card>
</CardGroup>
