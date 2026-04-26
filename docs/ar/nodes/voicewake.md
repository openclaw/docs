---
read_when:
    - تغيير سلوك أو إعدادات كلمات تنبيه الصوت الافتراضية
    - إضافة منصات Nodes جديدة تحتاج إلى مزامنة كلمات التنبيه
summary: كلمات تنبيه الصوت العامة (المملوكة لـ Gateway) وكيفية مزامنتها عبر العقد
title: تنبيه الصوت
x-i18n:
    generated_at: "2026-04-26T11:34:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 15
---

يتعامل OpenClaw مع **كلمات تنبيه الصوت كقائمة عامة واحدة** تملكها **Gateway**.

- **لا توجد كلمات تنبيه مخصصة لكل Node**.
- يمكن **لأي واجهة عقدة/تطبيق تعديل** القائمة؛ ويتم حفظ التغييرات بواسطة Gateway وبثها إلى الجميع.
- يحتفظ macOS وiOS بمفاتيح تبديل محلية لـ **Voice Wake enabled/disabled** ‏(تختلف تجربة الاستخدام المحلية والأذونات).
- يحتفظ Android حاليًا بخيار Voice Wake معطّلًا ويستخدم تدفق ميكروفون يدويًا في تبويب Voice.

## التخزين (مضيف Gateway)

تُخزن كلمات التنبيه على جهاز gateway في:

- `~/.openclaw/settings/voicewake.json`

الشكل:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## البروتوكول

### الطرق

- `voicewake.get` → ‏`{ triggers: string[] }`
- `voicewake.set` مع الوسائط `{ triggers: string[] }` → ‏`{ triggers: string[] }`

ملاحظات:

- تتم تسوية Triggers ‏(إزالة المسافات، وإسقاط القيم الفارغة). وتعود القوائم الفارغة إلى القيم الافتراضية.
- يتم فرض حدود لأسباب السلامة (حدود العدد/الطول).

### طرق التوجيه (trigger → target)

- `voicewake.routing.get` → ‏`{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` مع الوسائط `{ config: VoiceWakeRoutingConfig }` → ‏`{ config: VoiceWakeRoutingConfig }`

شكل `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

تدعم أهداف التوجيه واحدًا فقط من:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### الأحداث

- حمولة `voicewake.changed` ‏`{ triggers: string[] }`
- حمولة `voicewake.routing.changed` ‏`{ config: VoiceWakeRoutingConfig }`

من الذي يتلقاها:

- كل عملاء WebSocket ‏(تطبيق macOS وWebChat وما إلى ذلك)
- كل Nodes المتصلة (iOS/Android)، وكذلك عند اتصال node كدفعة أولية لـ "الحالة الحالية"

## سلوك العميل

### تطبيق macOS

- يستخدم القائمة العامة للتحكم في مشغلات `VoiceWakeRuntime`.
- يؤدي تعديل "Trigger words" في إعدادات Voice Wake إلى استدعاء `voicewake.set` ثم يعتمد على البث للحفاظ على مزامنة العملاء الآخرين.

### عقدة iOS

- تستخدم القائمة العامة لاكتشاف المشغلات في `VoiceWakeManager`.
- يؤدي تعديل Wake Words في Settings إلى استدعاء `voicewake.set` ‏(عبر Gateway WS) كما يحافظ أيضًا على استجابة اكتشاف كلمات التنبيه محليًا.

### عقدة Android

- يكون Voice Wake معطّلًا حاليًا في وقت تشغيل/إعدادات Android.
- يستخدم Android voice التقاط ميكروفون يدويًا في تبويب Voice بدلًا من مشغلات كلمات التنبيه.

## ذو صلة

- [وضع Talk](/ar/nodes/talk)
- [الصوت والملاحظات الصوتية](/ar/nodes/audio)
- [فهم الوسائط](/ar/nodes/media-understanding)
