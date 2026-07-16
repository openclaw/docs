---
read_when:
    - تريد اختيار قناة دردشة لـ OpenClaw
    - تحتاج إلى نظرة عامة سريعة على منصات المراسلة المدعومة
summary: منصات المراسلة التي يمكن لـ OpenClaw الاتصال بها
title: قنوات الدردشة
x-i18n:
    generated_at: "2026-07-16T13:32:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

يمكن لـ OpenClaw التواصل معك عبر أي تطبيق دردشة تستخدمه بالفعل. تتصل كل قناة عبر Gateway.
النص مدعوم في كل مكان؛ أما الوسائط والتفاعلات فتختلف حسب القناة.

تأتي iMessage وTelegram وواجهة WebChat مضمنة في التثبيت الأساسي. تُثبَّت القنوات المعلَّمة
بعبارة "Plugin رسمي" بأمر واحد (`openclaw plugins install @openclaw/<id>`)
أو عند الطلب أثناء `openclaw onboard` / `openclaw channels add`، ثم تتطلب إعادة تشغيل Gateway.
أما قنوات "Plugin خارجي" فتُصان خارج مستودع OpenClaw.

## القنوات المدعومة

- [Discord](/ar/channels/discord) - واجهة Discord Bot API مع Gateway؛ تدعم الخوادم والقنوات والرسائل الخاصة (Plugin رسمي).
- [Feishu](/ar/channels/feishu) - روبوت Feishu/Lark عبر WebSocket (Plugin رسمي).
- [Google Chat](/ar/channels/googlechat) - تطبيق Google Chat API عبر Webhook من نوع HTTP (Plugin رسمي).
- [iMessage](/ar/channels/imessage) - مضمنة في النظام الأساسي. تكامل أصلي مع macOS عبر جسر `imsg` على جهاز Mac مسجَّل الدخول (أو غلاف SSH عندما يعمل Gateway في مكان آخر)، بما يشمل إجراءات API خاصة للردود وتفاعلات tapback والتأثيرات والمرفقات وإدارة المجموعات.
- [IRC](/ar/channels/irc) - خوادم IRC التقليدية؛ قنوات ورسائل خاصة مع ضوابط الاقتران وقائمة السماح (Plugin رسمي).
- [LINE](/ar/channels/line) - روبوت LINE Messaging API (Plugin رسمي).
- [Matrix](/ar/channels/matrix) - بروتوكول Matrix (Plugin رسمي).
- [Mattermost](/ar/channels/mattermost) - واجهة Bot API مع WebSocket؛ قنوات ومجموعات ورسائل خاصة (Plugin رسمي).
- [Microsoft Teams](/ar/channels/msteams) - Bot Framework؛ دعم للمؤسسات (Plugin رسمي).
- [Nextcloud Talk](/ar/channels/nextcloud-talk) - دردشة مستضافة ذاتيًا عبر Nextcloud Talk (Plugin رسمي).
- [Nostr](/ar/channels/nostr) - رسائل خاصة لامركزية عبر NIP-04 (Plugin رسمي).
- [QQ Bot](/ar/channels/qqbot) - واجهة QQ Bot API؛ دردشة خاصة ودردشة جماعية ووسائط غنية (Plugin رسمي).
- [Reef](/ar/channels/reef) - مراسلة محمية ومشفرة من طرف إلى طرف بين مثيلات OpenClaw التابعة لأشخاص مختلفين (Plugin مضمن).
- [Raft](/ar/channels/raft) - جسر تنبيه Raft CLI للتعاون بين البشر والوكلاء (Plugin رسمي).
- [Signal](/ar/channels/signal) - signal-cli؛ يركز على الخصوصية (Plugin رسمي).
- [Slack](/ar/channels/slack) - Bolt SDK؛ تطبيقات مساحات العمل (Plugin رسمي).
- [SMS](/ar/channels/sms) - رسائل SMS مدعومة من Twilio عبر Webhook الخاص بـ Gateway (Plugin رسمي).
- [Synology Chat](/ar/channels/synology-chat) - Synology NAS Chat عبر Webhooks صادرة وواردة (Plugin رسمي).
- [Telegram](/ar/channels/telegram) - مضمنة في النظام الأساسي. واجهة Bot API عبر grammY؛ تدعم المجموعات.
- [Tlon](/ar/channels/tlon) - تطبيق مراسلة قائم على Urbit (Plugin رسمي).
- [Twitch](/ar/channels/twitch) - دردشة Twitch عبر اتصال IRC (Plugin رسمي).
- [المكالمات الصوتية](/ar/plugins/voice-call) - اتصالات هاتفية عبر Plivo أو Telnyx أو Twilio (Plugin رسمي).
- [WebChat](/ar/web/webchat) - مضمنة في النظام الأساسي. واجهة WebChat الخاصة بـ Gateway عبر WebSocket.
- [WeChat](/ar/channels/wechat) - روبوت Tencent iLink عبر تسجيل الدخول باستخدام رمز QR؛ للدردشات الخاصة فقط (Plugin خارجي).
- [WhatsApp](/ar/channels/whatsapp) - الأكثر شيوعًا؛ تستخدم Baileys وتتطلب الاقتران عبر رمز QR (Plugin رسمي).
- [Yuanbao](/ar/channels/yuanbao) - روبوت Tencent Yuanbao (Plugin خارجي).
- [Zalo](/ar/channels/zalo) - واجهة Zalo Bot API؛ تطبيق المراسلة الشائع في فيتنام (Plugin رسمي).
- [Zalo ClawBot](/ar/channels/zaloclawbot) - مساعد Zalo شخصي عبر تسجيل الدخول باستخدام رمز QR؛ مرتبط بالمالك (Plugin خارجي).
- [Zalo Personal](/ar/channels/zalouser) - حساب Zalo شخصي عبر تسجيل الدخول باستخدام رمز QR (Plugin رسمي).

## ملاحظات التسليم

- تُحوَّل ردود Telegram التي تحتوي على صيغة صور Markdown، مثل `![alt](url)`،
  إلى ردود وسائط في المسار الصادر النهائي متى أمكن.
- تُوجَّه الرسائل الخاصة متعددة الأشخاص في Slack بوصفها دردشات جماعية، لذا تنطبق سياسة المجموعات وسلوك الإشارات
  وقواعد جلسات المجموعات على محادثات MPIM.
- إعداد WhatsApp قائم على التثبيت عند الطلب: يمكن لعملية الإعداد الأولي عرض تدفق الإعداد قبل
  تثبيت حزمة Plugin، ولا يحمّل Gateway
  Plugin الخارجي من ClawHub/npm إلا عندما تكون القناة نشطة فعليًا.
- يمكن للقنوات التي تقبل الرسائل الواردة التي تنشئها الروبوتات استخدام
  [الحماية المشتركة من حلقات الروبوتات](/ar/channels/bot-loop-protection) لمنع أزواج الروبوتات من
  الرد على بعضها إلى ما لا نهاية.
- يمكن للغرف المدعومة والدائمة النشاط استخدام [أحداث الغرف المحيطية](/ar/channels/ambient-room-events)
  كي تتحول أحاديث الغرفة التي لا تتضمن إشارة إلى سياق هادئ، ما لم يرسل الوكيل باستخدام
  أداة `message`.

## ملاحظات

- يمكن تشغيل القنوات في الوقت نفسه؛ اضبط عدة قنوات وسيوجّه OpenClaw الرسائل حسب كل دردشة.
- عادةً ما يكون الإعداد الأسرع عبر **Telegram** (رمز روبوت بسيط، من دون تثبيت Plugin). يتطلب WhatsApp
  الاقتران عبر رمز QR ويخزّن حالة أكثر على القرص.
- يختلف سلوك المجموعات حسب القناة؛ راجع [المجموعات](/ar/channels/groups).
- يُفرَض اقتران الرسائل الخاصة وقوائم السماح لأسباب أمنية؛ راجع [الأمان](/ar/gateway/security).
- استكشاف الأخطاء وإصلاحها: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).
- يُوثَّق موفرو النماذج بصورة منفصلة؛ راجع [موفري النماذج](/ar/providers/models).
