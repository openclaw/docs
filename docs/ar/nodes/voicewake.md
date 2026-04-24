---
read_when:
    - تغيير سلوك كلمات الإيقاظ الصوتي أو إعداداتها الافتراضية
    - إضافة منصات Node جديدة تحتاج إلى مزامنة كلمات الإيقاظ】【：】【“】【analysis
summary: كلمات الإيقاظ الصوتي العامة (المملوكة لـ Gateway) وكيفية مزامنتها عبر Nodes
title: الإيقاظ الصوتي
x-i18n:
    generated_at: "2026-04-24T07:50:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5094c17aaa7f868beb81d04f7dc60565ded1852cc5c835a33de64dbd3da74bb4
    source_path: nodes/voicewake.md
    workflow: 15
---

يتعامل OpenClaw مع **كلمات الإيقاظ** على أنها **قائمة عامة واحدة** مملوكة لـ **Gateway**.

- لا توجد **كلمات إيقاظ مخصصة لكل Node**.
- يمكن **لأي Node/واجهة تطبيق تعديل** القائمة؛ وتُحفَظ التغييرات بواسطة Gateway وتُبث إلى الجميع.
- يحتفظ كل من macOS وiOS بخيارات تبديل محلية لتفعيل/تعطيل **الإيقاظ الصوتي** (إذ تختلف تجربة الاستخدام المحلية والأذونات).
- يحتفظ Android حاليًا بالإيقاظ الصوتي في وضع الإيقاف ويستخدم تدفق ميكروفون يدوي في تبويب Voice.

## التخزين (مضيف Gateway)

تُخزَّن كلمات الإيقاظ على جهاز gateway في:

- `~/.openclaw/settings/voicewake.json`

الشكل:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## البروتوكول

### الطرق

- `voicewake.get` → ‏`{ triggers: string[] }`
- `voicewake.set` مع المعاملات `{ triggers: string[] }` → ‏`{ triggers: string[] }`

ملاحظات:

- تُطبَّع triggers ‏(يُزال الفراغ الزائد، وتُحذف القيم الفارغة). وتعود القوائم الفارغة إلى الإعدادات الافتراضية.
- تُفرَض حدود لأغراض السلامة (حدود العدد/الطول).

### الأحداث

- حمولة `voicewake.changed` ‏`{ triggers: string[] }`

من الذي يستقبلها:

- جميع عملاء WebSocket ‏(تطبيق macOS، وWebChat، إلخ)
- جميع Nodes المتصلة (iOS/Android)، وكذلك عند اتصال node كدفعة أولية لـ “الحالة الحالية”.

## سلوك العميل

### تطبيق macOS

- يستخدم القائمة العامة لتقييد مشغلات `VoiceWakeRuntime`.
- يؤدي تحرير “كلمات التحفيز” في إعدادات Voice Wake إلى استدعاء `voicewake.set` ثم الاعتماد على البث لإبقاء بقية العملاء متزامنين.

### iOS node

- تستخدم القائمة العامة لاكتشاف triggers في `VoiceWakeManager`.
- يؤدي تحرير Wake Words في Settings إلى استدعاء `voicewake.set` ‏(عبر Gateway WS) كما يحافظ أيضًا على استجابة اكتشاف كلمات الإيقاظ محليًا.

### Android node

- الإيقاظ الصوتي معطل حاليًا في وقت تشغيل/Settings الخاصة بـ Android.
- يستخدم صوت Android التقاط الميكروفون اليدوي في تبويب Voice بدلًا من triggers كلمات الإيقاظ.

## ذو صلة

- [وضع Talk](/ar/nodes/talk)
- [الصوت والملاحظات الصوتية](/ar/nodes/audio)
- [فهم الوسائط](/ar/nodes/media-understanding)
