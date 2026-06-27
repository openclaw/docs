---
read_when:
    - تكوين مجموعات WhatsApp تحديدًا
    - تغيير أوضاع تفعيل WhatsApp (`mention` مقابل `always`)
    - ضبط مفاتيح جلسات مجموعات WhatsApp أو سياق الرسائل المعلّقة
sidebarTitle: WhatsApp groups
summary: التعامل مع رسائل مجموعات WhatsApp — التفعيل، قوائم السماح، الجلسات، وحقن السياق
title: رسائل مجموعات WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:10:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 790866fd959b43d94b745082f3c90920b81c0a016492e9e164c600663f1b2eee
    source_path: channels/group-messages.md
    workflow: 16
---

لنموذج المجموعات العابرة للقنوات (Discord، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo)، راجع [المجموعات](/ar/channels/groups). تغطي هذه الصفحة السلوك الخاص بـ WhatsApp فوق ذلك النموذج: التفعيل، قوائم السماح للمجموعات، مفاتيح الجلسات لكل مجموعة، وحقن سياق الرسائل المعلّقة.

الهدف: السماح لـ OpenClaw بالوجود في مجموعات WhatsApp، والاستيقاظ فقط عند الإشارة إليه، وإبقاء ذلك الخيط منفصلاً عن جلسة الرسائل المباشرة الشخصية.

<Note>
يُستخدم `agents.list[].groupChat.mentionPatterns` أيضاً بواسطة Telegram وDiscord وSlack وiMessage. في إعدادات الوكلاء المتعددين، اضبطه لكل وكيل، أو استخدم `messages.groupChat.mentionPatterns` كاحتياطي عام.
</Note>

## السلوك

- أوضاع التفعيل: `mention` (الافتراضي) أو `always`. يتطلب `mention` إشارة (إشارات WhatsApp @ الحقيقية عبر `mentionedJids`، أو أنماط regex آمنة، أو رقم E.164 الخاص بالروبوت في أي موضع داخل النص). يوقظ `always` الوكيل عند كل رسالة، لكنه يجب أن يرد فقط عندما يستطيع إضافة قيمة مفيدة؛ وإلا فإنه يعيد رمز الصمت الدقيق `NO_REPLY` / `no_reply`. يمكن ضبط الإعدادات الافتراضية في التكوين (`channels.whatsapp.groups`) وتجاوزها لكل مجموعة عبر `/activation`. عند ضبط `channels.whatsapp.groups`، فإنه يعمل أيضاً كقائمة سماح للمجموعات (أدرج `"*"` للسماح للجميع).
- سياسة المجموعة: يتحكم `channels.whatsapp.groupPolicy` فيما إذا كانت رسائل المجموعات مقبولة (`open|disabled|allowlist`). يستخدم `allowlist` القيمة `channels.whatsapp.groupAllowFrom` (الاحتياطي: `channels.whatsapp.allowFrom` الصريح). الافتراضي هو `allowlist` (محظور حتى تضيف المرسلين).
- الجلسات لكل مجموعة: تبدو مفاتيح الجلسات مثل `agent:<agentId>:whatsapp:group:<jid>`، لذلك تكون الأوامر مثل `/verbose on` أو `/trace on` أو `/think high` (المرسلة كرسائل مستقلة) محددة النطاق لتلك المجموعة؛ وتبقى حالة الرسائل المباشرة الشخصية دون تغيير. يتم تخطي Heartbeats لخيوط المجموعات.
- حقن السياق: تُسبق رسائل المجموعة **المعلّقة فقط** (الافتراضي 50) التي _لم_ تشغّل عملية تشغيل تحت `[Chat messages since your last reply - for context]`، مع وضع السطر المشغّل تحت `[Current message - respond to this]`. لا تُعاد حقن الرسائل الموجودة بالفعل في الجلسة.
- إظهار المرسل: تنتهي كل دفعة مجموعة الآن بـ `[from: Sender Name (+E164)]` حتى يعرف OpenClaw من يتحدث.
- الرسائل المؤقتة/ذات العرض الواحد: نفك تغليفها قبل استخراج النص/الإشارات، لذلك تظل الإشارات داخلها قادرة على التشغيل.
- موجّه نظام المجموعة: في أول دور من جلسة مجموعة (وكلما غيّر `/activation` الوضع) نحقن نبذة قصيرة في موجّه النظام مثل `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` إذا لم تكن البيانات الوصفية متاحة، فما زلنا نخبر الوكيل بأنها محادثة مجموعة.

## مثال تكوين (WhatsApp)

أضف كتلة `groupChat` إلى `~/.openclaw/openclaw.json` حتى تعمل إشارات اسم العرض حتى عندما يزيل WhatsApp الرمز المرئي `@` من متن النص:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

ملاحظات:

- تعابير regex غير حساسة لحالة الأحرف وتستخدم نفس حواجز الحماية الآمنة لتعابير regex مثل أسطح regex الأخرى في التكوين؛ يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا يزال WhatsApp يرسل الإشارات المعيارية عبر `mentionedJids` عندما ينقر شخص ما على جهة الاتصال، لذلك نادراً ما تكون آلية الاحتياط بالرقم مطلوبة، لكنها شبكة أمان مفيدة.

### أمر التفعيل (للمالك فقط)

استخدم أمر محادثة المجموعة:

- `/activation mention`
- `/activation always`

يمكن فقط لرقم المالك (من `channels.whatsapp.allowFrom`، أو رقم E.164 الخاص بالروبوت عند عدم ضبطه) تغيير ذلك. أرسل `/status` كرسالة مستقلة في المجموعة لمعرفة وضع التفعيل الحالي.

## كيفية الاستخدام

1. أضف حساب WhatsApp الخاص بك (الحساب الذي يشغّل OpenClaw) إلى المجموعة.
2. قل `@openclaw …` (أو أدرج الرقم). يمكن فقط للمرسلين المدرجين في قائمة السماح تشغيله ما لم تضبط `groupPolicy: "open"`.
3. سيتضمن موجّه الوكيل سياق المجموعة الحديث بالإضافة إلى علامة `[from: …]` اللاحقة حتى يستطيع مخاطبة الشخص الصحيح.
4. تنطبق التوجيهات على مستوى الجلسة (`/verbose on`، `/trace on`، `/think high`، `/new` أو `/reset`، `/compact`) فقط على جلسة تلك المجموعة؛ أرسلها كرسائل مستقلة حتى يتم تسجيلها. تظل جلسة الرسائل المباشرة الشخصية مستقلة.

## الاختبار / التحقق

- اختبار يدوي سريع:
  - أرسل إشارة `@openclaw` في المجموعة وتأكد من وجود رد يشير إلى اسم المرسل.
  - أرسل إشارة ثانية وتحقق من تضمين كتلة السجل، ثم مسحها في الدور التالي.
- افحص سجلات Gateway (شغّل باستخدام `--verbose`) لرؤية إدخالات `inbound web message` التي تعرض `from: <groupJid>` ولاحقة `[from: …]`.

## اعتبارات معروفة

- يتم تخطي Heartbeats للمجموعات عمداً لتجنب البث المزعج.
- يستخدم منع الصدى نص الدفعة المدمج؛ إذا أرسلت نصاً مطابقاً مرتين دون إشارات، فسيتلقى الأول فقط رداً.
- ستظهر إدخالات مخزن الجلسات بصيغة `agent:<agentId>:whatsapp:group:<jid>` في مخزن الجلسات (`~/.openclaw/agents/<agentId>/sessions/sessions.json` افتراضياً)؛ ويعني غياب الإدخال فقط أن المجموعة لم تشغّل عملية تشغيل بعد.
- تتبع مؤشرات الكتابة في المجموعات `agents.defaults.typingMode`. عندما يتم الاشتراك في الردود المرئية ضمن وضع أداة الرسائل فقط، تبدأ الكتابة فوراً افتراضياً حتى يستطيع أعضاء المجموعة رؤية أن الوكيل يعمل حتى إذا لم يُنشر رد نهائي تلقائي. يظل تكوين وضع الكتابة الصريح هو صاحب الأولوية.

## ذات صلة

- [المجموعات](/ar/channels/groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [مجموعات البث](/ar/channels/broadcast-groups)
