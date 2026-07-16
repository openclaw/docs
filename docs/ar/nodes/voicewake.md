---
read_when:
    - تغيير سلوك كلمات التنبيه الصوتي أو إعداداتها الافتراضية
    - إضافة منصات Node جديدة تحتاج إلى مزامنة كلمة التنبيه
summary: كلمات التنبيه الصوتي العامة (التي يديرها Gateway) وكيفية مزامنتها عبر العُقد
title: التنشيط الصوتي
x-i18n:
    generated_at: "2026-07-16T14:18:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

كلمات التنبيه هي **قائمة عامة واحدة يملكها Gateway** — ولا توجد قوائم مخصصة لكل عقدة. يمكن لأي عقدة أو واجهة مستخدم لتطبيق تعديل القائمة؛ يحفظ Gateway التغيير ويذيعه إلى كل عميل متصل.

- **macOS**: مفتاح تبديل محلي لتمكين/تعطيل التنبيه الصوتي. يتطلب macOS 26+؛ راجع [التنبيه الصوتي (macOS)](/ar/platforms/mac/voicewake) للاطلاع على تفاصيل وقت التشغيل/PTT.
- **iOS**: مفتاح تبديل محلي لتمكين/تعطيل التنبيه الصوتي في Settings.
- **Android**: مفتاح تبديل محلي لتمكين/تعطيل التنبيه الصوتي ومحرر لكلمات التنبيه في Settings → Voice. يتطلب التعرّف على الكلام على الجهاز في Android.

## التخزين

توجد كلمات التنبيه وقواعد التوجيه في قاعدة بيانات حالة Gateway، `~/.openclaw/state/openclaw.sqlite` افتراضيًا (يمكن تجاوزها باستخدام `OPENCLAW_STATE_DIR`)، في الجداول `voicewake_triggers` و`voicewake_routing_config` و`voicewake_routing_routes`. لا تُستخدم ملفات `settings/voicewake.json` و`settings/voicewake-routing.json` القديمة إلا كمدخلات ترحيل لـ `openclaw doctor --fix` — ولا يقرأها وقت التشغيل مطلقًا.

## البروتوكول

### قائمة المشغّلات

| الطريقة          | المعاملات                   | النتيجة                   |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | لا شيء                     | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

يطبّع `voicewake.set` الإدخال: يزيل المسافات البيضاء من الطرفين، ويحذف الإدخالات الفارغة، ويحتفظ بحد أقصى يبلغ 32 مشغّلًا، ويقتطع كل مشغّل إلى 64 وحدة ترميز UTF-16 من دون تقسيم أزواج البدائل. إذا كانت النتيجة فارغة، تُستخدم الإعدادات الافتراضية المضمّنة (`openclaw` و`claude` و`computer`).

### التوجيه (من المشغّل إلى الهدف)

| الطريقة                  | المعاملات                               | النتيجة                               |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | لا شيء                                 | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

يدعم كل `target` للتوجيه واحدًا فقط مما يلي:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

الحدود: 32 مسارًا كحد أقصى، ونص المشغّل بحد أقصى 64 حرفًا. تُطبّع مشغّلات المسارات للمطابقة واكتشاف التكرارات بتحويل الأحرف إلى صغيرة، وإزالة علامات الترقيم في بداية ونهاية كل كلمة، وطيّ المسافات البيضاء (`"Hey, Bot!!"` و`"hey bot"` يتطابقان ويُعدّان مكررين) — وهذا تطبيع أكثر صرامة من إزالة المسافات من الطرفين فقط المستخدمة لقائمة المشغّلات العامة أعلاه.

### الأحداث

| الحدث                       | الحمولة                              |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

يُبث كلاهما إلى كل عميل WebSocket ذي نطاق قراءة (تطبيق macOS وWebChat وما شابه) وإلى كل عقدة متصلة. وتتلقى العقدة أيضًا كليهما على هيئة دفعة لقطة أولية فور اتصالها.

## سلوك العميل

- **macOS**: يستدعي `voicewake.set`/`voicewake.get` ويستمع إلى `voicewake.changed` ليظل متزامنًا مع العملاء الآخرين.
- **iOS**: يستدعي `voicewake.set`/`voicewake.get` ويستمع إلى `voicewake.changed` لإبقاء اكتشاف كلمات التنبيه محليًا سريع الاستجابة.
- **Android**: يستدعي `voicewake.set`/`voicewake.get`، ويستمع إلى `voicewake.changed`، ويعلن عن `voiceWake` أثناء تمكينه. يظل التعرّف على الجهاز وفي الواجهة فقط؛ ويتوقف مؤقتًا عندما يكون الصوت مستخدمًا بواسطة Talk أو الإملاء اليدوي أو التقاط ملاحظة صوتية أو نطق الرسائل.

## ذو صلة

- [وضع Talk](/ar/nodes/talk)
- [الصوت والملاحظات الصوتية](/ar/nodes/audio)
- [فهم الوسائط](/ar/nodes/media-understanding)
