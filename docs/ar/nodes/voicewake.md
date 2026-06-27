---
read_when:
    - تغيير سلوك كلمات تنبيه الصوت أو إعداداتها الافتراضية
    - إضافة منصات Node جديدة تحتاج إلى مزامنة كلمة التنبيه
summary: كلمات التنبيه الصوتية العامة (مملوكة لـ Gateway) وكيفية مزامنتها عبر العقد
title: الإيقاظ الصوتي
x-i18n:
    generated_at: "2026-06-27T17:55:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

يعامل OpenClaw **كلمات التنبيه كقائمة عامة واحدة** يملكها **Gateway**.

- لا توجد **كلمات تنبيه مخصصة لكل عقدة**.
- **يمكن لأي واجهة مستخدم لعقدة/تطبيق تعديل** القائمة؛ يحفظ Gateway التغييرات ويبثها إلى الجميع.
- يحتفظ macOS وiOS بمفاتيح تبديل محلية **لتمكين/تعطيل Voice Wake** (تختلف تجربة المستخدم المحلية + الأذونات).
- يحتفظ Android حاليًا بإيقاف Voice Wake ويستخدم تدفق ميكروفون يدويًا في تبويب Voice.

## التخزين (مضيف Gateway)

تُخزَّن كلمات التنبيه وقواعد التوجيه في قاعدة بيانات حالة Gateway:

- `~/.openclaw/state/openclaw.sqlite`

الجداول النشطة هي:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

ملفات `settings/voicewake.json` و`settings/voicewake-routing.json` القديمة هي
مدخلات ترحيل doctor فقط؛ يقرأ وقت التشغيل جداول SQLite ويكتب إليها.

## البروتوكول

### الطرق

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` مع المعاملات `{ triggers: string[] }` → `{ triggers: string[] }`

ملاحظات:

- تُطبَّع المحفزات (إزالة المسافات الزائدة، وإسقاط القيم الفارغة). تعود القوائم الفارغة إلى الإعدادات الافتراضية.
- تُفرض الحدود للسلامة (حدود العدد/الطول).

### طرق التوجيه (المحفز → الهدف)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` مع المعاملات `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

شكل `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

تدعم أهداف المسارات واحدًا فقط بالضبط مما يلي:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### الأحداث

- حمولة `voicewake.changed` ‏`{ triggers: string[] }`
- حمولة `voicewake.routing.changed` ‏`{ config: VoiceWakeRoutingConfig }`

من يتلقاها:

- جميع عملاء WebSocket (تطبيق macOS، وWebChat، وما إلى ذلك)
- جميع العقد المتصلة (iOS/Android)، وكذلك عند اتصال العقدة كدفعة أولية من "الحالة الحالية".

## سلوك العميل

### تطبيق macOS

- يستخدم القائمة العامة للتحكم في محفزات `VoiceWakeRuntime`.
- يؤدي تعديل "كلمات المحفز" في إعدادات Voice Wake إلى استدعاء `voicewake.set` ثم الاعتماد على البث لإبقاء العملاء الآخرين متزامنين.

### عقدة iOS

- تستخدم القائمة العامة لاكتشاف محفزات `VoiceWakeManager`.
- يؤدي تعديل كلمات التنبيه في الإعدادات إلى استدعاء `voicewake.set` (عبر Gateway WS) ويحافظ أيضًا على استجابة اكتشاف كلمات التنبيه المحلية.

### عقدة Android

- Voice Wake معطل حاليًا في وقت تشغيل/إعدادات Android.
- يستخدم صوت Android التقاط الميكروفون اليدوي في تبويب Voice بدلًا من محفزات كلمات التنبيه.

## ذات صلة

- [وضع التحدث](/ar/nodes/talk)
- [الملاحظات الصوتية والصوت](/ar/nodes/audio)
- [فهم الوسائط](/ar/nodes/media-understanding)
