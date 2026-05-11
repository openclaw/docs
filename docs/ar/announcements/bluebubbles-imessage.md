---
read_when:
    - كنت تستخدم قناة BlueBubbles القديمة وتحتاج إلى الانتقال إلى iMessage
    - أنت تختار إعداد iMessage المدعوم في OpenClaw
    - تحتاج إلى شرح موجز لإزالة BlueBubbles
summary: تمت إزالة دعم BlueBubbles من OpenClaw. استخدم Plugin iMessage المضمّن مع imsg لإعدادات iMessage الجديدة والمُرحَّلة.
title: إزالة BlueBubbles ومسار imsg iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 970e33772534fd3e3d8d3012222bdd9c645ed713b8d38cff21b25b276ae1f544
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# إزالة BlueBubbles ومسار imsg في iMessage

لم يعد OpenClaw يوفّر قناة BlueBubbles. يعمل دعم iMessage الآن من خلال Plugin `imessage` المضمّن، الذي يشغّل [`imsg`](https://github.com/steipete/imsg) محليًا أو عبر مغلّف SSH ويتواصل باستخدام JSON-RPC عبر stdin/stdout.

إذا كان إعدادك لا يزال يحتوي على `channels.bluebubbles`، فانقله إلى `channels.imessage`. يعيد عنوان URL القديم لوثائق `/channels/bluebubbles` التوجيه إلى [الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles)، الذي يحتوي على جدول ترجمة الإعدادات الكامل وقائمة تحقق الانتقال.

## ما الذي تغيّر

- لا يوجد خادم HTTP لـ BlueBubbles، أو مسار Webhook، أو كلمة مرور REST، أو وقت تشغيل Plugin لـ BlueBubbles في مسار iMessage المدعوم في OpenClaw.
- يقرأ OpenClaw الرسائل ويراقبها من خلال `imsg` على جهاز Mac الذي تم تسجيل الدخول فيه إلى Messages.app.
- تستخدم عمليات الإرسال والاستقبال والسجل والوسائط الأساسية واجهات `imsg` العادية وأذونات macOS.
- تتطلب الإجراءات المتقدمة مثل الردود المتسلسلة، وtapbacks، والتحرير، وإلغاء الإرسال، والتأثيرات، وإيصالات القراءة، ومؤشرات الكتابة، وإدارة المجموعات استخدام `imsg launch` مع توفر جسر API الخاص.
- يمكن لـ Gateways على Linux وWindows الاستمرار في استخدام iMessage من خلال ضبط `channels.imessage.cliPath` على مغلّف SSH يشغّل `imsg` على جهاز Mac المسجّل الدخول.

## ما الذي يجب فعله

1. ثبّت `imsg` وتحقق منه على جهاز Mac الخاص بتطبيق Messages:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. امنح أذونات Full Disk Access وAutomation لسياق العملية الذي يشغّل `imsg` وOpenClaw.

3. ترجم الإعداد القديم:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. أعد تشغيل Gateway وتحقق:

   ```bash
   openclaw channels status --probe
   ```

5. اختبر الرسائل المباشرة والمجموعات والمرفقات وأي إجراءات API خاصة تعتمد عليها قبل حذف خادم BlueBubbles القديم.

## ملاحظات الترحيل

- لا يوجد مكافئ في iMessage لـ `channels.bluebubbles.serverUrl` و`channels.bluebubbles.password`.
- تحتوي `channels.bluebubbles.allowFrom` و`groupAllowFrom` و`groups` و`includeAttachments` وجذور المرفقات وحدود حجم الوسائط والتجزئة ومفاتيح تبديل الإجراءات على مكافئات في iMessage.
- لا يزال `channels.imessage.includeAttachments` معطلًا افتراضيًا. اضبطه صراحةً إذا كنت تتوقع وصول الصور الواردة أو المذكرات الصوتية أو مقاطع الفيديو أو الملفات إلى الوكيل.
- مع `groupPolicy: "allowlist"`، انسخ كتلة `groups` القديمة، بما في ذلك أي إدخال حرف بدل `"*"`. قوائم السماح لمرسلي المجموعة وسجل المجموعة بوابتان منفصلتان.
- يجب تغيير ارتباطات ACP التي تطابق `channel: "bluebubbles"` إلى `channel: "imessage"`.
- لا تتحول مفاتيح جلسات BlueBubbles القديمة إلى مفاتيح جلسات iMessage. تنتقل موافقات الاقتران حسب المعرّف، لكن سجل المحادثات ضمن مفاتيح جلسات BlueBubbles لا ينتقل.

## انظر أيضًا

- [الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles)
- [iMessage](/ar/channels/imessage)
- [مرجع الإعدادات - iMessage](/ar/gateway/config-channels#imessage)
