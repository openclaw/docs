---
read_when:
    - لقد استخدمت قناة BlueBubbles القديمة وتحتاج إلى الانتقال إلى iMessage
    - أنت تختار إعداد iMessage المدعوم في OpenClaw
    - تحتاج إلى شرح موجز لإزالة BlueBubbles
summary: أُزيل دعم BlueBubbles من OpenClaw. استخدم Plugin iMessage المضمّن مع imsg لإعدادات iMessage الجديدة والمُرحَّلة.
title: إزالة BlueBubbles ومسار imsg الخاص بـ iMessage
x-i18n:
    generated_at: "2026-07-12T05:32:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# إزالة BlueBubbles ومسار iMessage عبر imsg

لم يعد OpenClaw يتضمن قناة BlueBubbles. يعمل دعم iMessage من خلال Plugin `imessage` المضمّن: يشغّل Gateway أداة [`imsg`](https://github.com/steipete/imsg) كعملية فرعية، محليًا أو من خلال مغلّف SSH، ويتواصل معها عبر JSON-RPC باستخدام stdin/stdout. لا خادم، ولا Webhook، ولا منفذ.

إذا كان إعدادك لا يزال يحتوي على `channels.bluebubbles`، فانقله إلى `channels.imessage`. يعيد عنوان URL القديم للوثائق `/channels/bluebubbles` التوجيه إلى [الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles)، الذي يتضمن جدول تحويل الإعدادات الكامل وقائمة التحقق الخاصة بالانتقال.

## ما الذي تغيّر

- لا يتضمن مسار iMessage المدعوم خادم HTTP لـ BlueBubbles، أو مسار Webhook، أو كلمة مرور REST، أو بيئة تشغيل Plugin لـ BlueBubbles.
- يقرأ OpenClaw الرسائل ويراقبها من خلال `imsg` على جهاز Mac المسجّل دخوله إلى Messages.app.
- تستخدم عمليات الإرسال والاستلام والسجل والوسائط الأساسية واجهات `imsg` المعتادة وأذونات macOS.
- تتطلب الإجراءات المتقدمة (الردود المترابطة، وردود tapback، والتعديل، والتراجع عن الإرسال، والتأثيرات، وإيصالات القراءة، ومؤشرات الكتابة، وإدارة المجموعات) جسر واجهة API الخاصة: شغّل `imsg launch`، وهو ما يتطلب تعطيل SIP.
- لا يزال بإمكان بوابات Linux وWindows استخدام iMessage بتوجيه `channels.imessage.cliPath` إلى مغلّف SSH يشغّل `imsg` على جهاز Mac المسجّل دخوله.

## ما يجب فعله

1. ثبّت `imsg` وتحقق منه على جهاز Mac الذي يشغّل Messages:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. امنح أذونات الوصول الكامل إلى القرص والأتمتة لسياق العملية الذي يشغّل `imsg` وOpenClaw.

3. حوّل الإعداد القديم:

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

5. اختبر الرسائل المباشرة والمجموعات والمرفقات وأي إجراءات خاصة بواجهة API تعتمد عليها قبل حذف خادم BlueBubbles القديم.

## ملاحظات الترحيل

- ليس لـ `channels.bluebubbles.serverUrl` و`channels.bluebubbles.password` مكافئان في iMessage؛ فلا يوجد خادم للاتصال به أو المصادقة لديه.
- تحتفظ `allowFrom` و`groupAllowFrom` و`groups` و`includeAttachments` و`attachmentRoots` و`mediaMaxMb` و`textChunkLimit` و`actions.*` بمعانيها ضمن `channels.imessage`.
- يظل `channels.imessage.includeAttachments` معطّلًا افتراضيًا. عيّنه صراحةً إذا كنت تتوقع وصول الصور الواردة أو المذكرات الصوتية أو مقاطع الفيديو أو الملفات إلى الوكيل.
- عند استخدام `groupPolicy: "allowlist"`، انسخ كتلة `groups` القديمة، بما في ذلك أي مُدخل بدل شامل `"*"`. قوائم السماح لمرسلي المجموعات وسجل المجموعات بوابتان منفصلتان؛ تؤدي كتلة `groups` التي تحتوي على مُدخلات دون `chat_id` مطابق (أو دون `"*"`) إلى إسقاط الرسالة في وقت التشغيل، بينما تسجّل كتلة `groups` الفارغة تحذيرًا عند بدء التشغيل رغم أن تصفية المرسلين لا تزال تسمح بمرور الرسائل.
- يجب تغيير روابط ACP التي تحتوي على `match.channel: "bluebubbles"` إلى `"imessage"`.
- لا تتحول مفاتيح جلسات BlueBubbles القديمة إلى مفاتيح جلسات iMessage. تستند موافقات الاقتران إلى معرّفات المرسلين، لذلك تظل مُدخلات `allowFrom` المنسوخة فعّالة، لكن سجل المحادثات ضمن مفاتيح جلسات BlueBubbles لا ينتقل.

## انظر أيضًا

- [الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles)
- [iMessage](/ar/channels/imessage)
- [مرجع الإعدادات - iMessage](/ar/gateway/config-channels#imessage)
