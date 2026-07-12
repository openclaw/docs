---
read_when:
    - تريد اختيار قناة دردشة لـ OpenClaw
    - تحتاج إلى نظرة عامة سريعة على منصات المراسلة المدعومة
summary: منصات المراسلة التي يمكن لـ OpenClaw الاتصال بها
title: قنوات الدردشة
x-i18n:
    generated_at: "2026-07-12T05:33:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

يمكن لـ OpenClaw التواصل معك عبر أي تطبيق دردشة تستخدمه بالفعل. تتصل كل قناة عبر Gateway.
النص مدعوم في كل مكان؛ أما الوسائط والتفاعلات فتختلف حسب القناة.

تأتي iMessage وTelegram وواجهة WebChat مضمنة في التثبيت الأساسي. تُثبَّت القنوات الموسومة
بعبارة "Plugin رسمي" بأمر واحد (`openclaw plugins install @openclaw/<id>`)
أو عند الطلب أثناء `openclaw onboard` / `openclaw channels add`، ثم تتطلب إعادة تشغيل Gateway.
أما قنوات "Plugin خارجي" فتُصان خارج مستودع OpenClaw.

## القنوات المدعومة

- [Discord](/ar/channels/discord) - واجهة Discord Bot API وGateway؛ تدعم الخوادم والقنوات والرسائل الخاصة (Plugin رسمي).
- [Feishu](/ar/channels/feishu) - روبوت Feishu/Lark عبر WebSocket (Plugin رسمي).
- [Google Chat](/ar/channels/googlechat) - تطبيق Google Chat API عبر Webhook يستخدم HTTP (Plugin رسمي).
- [iMessage](/ar/channels/imessage) - مضمنة في النواة. تكامل أصلي مع macOS عبر جسر `imsg` على جهاز Mac مسجّل الدخول (أو مغلّف SSH عندما يعمل Gateway في مكان آخر)، بما في ذلك إجراءات API خاصة للردود وتفاعلات tapback والتأثيرات والمرفقات وإدارة المجموعات.
- [IRC](/ar/channels/irc) - خوادم IRC التقليدية؛ قنوات ورسائل خاصة مع عناصر تحكم في الاقتران وقائمة السماح (Plugin رسمي).
- [LINE](/ar/channels/line) - روبوت LINE Messaging API (Plugin رسمي).
- [Matrix](/ar/channels/matrix) - بروتوكول Matrix (Plugin رسمي).
- [Mattermost](/ar/channels/mattermost) - واجهة Bot API وWebSocket؛ قنوات ومجموعات ورسائل خاصة (Plugin رسمي).
- [Microsoft Teams](/ar/channels/msteams) - Bot Framework؛ دعم للمؤسسات (Plugin رسمي).
- [Nextcloud Talk](/ar/channels/nextcloud-talk) - دردشة مستضافة ذاتيًا عبر Nextcloud Talk (Plugin رسمي).
- [Nostr](/ar/channels/nostr) - رسائل خاصة لامركزية عبر NIP-04 (Plugin رسمي).
- [QQ Bot](/ar/channels/qqbot) - واجهة QQ Bot API؛ دردشة خاصة ودردشة جماعية ووسائط غنية (Plugin رسمي).
- [Raft](/ar/channels/raft) - جسر إيقاظ عبر Raft CLI للتعاون بين البشر والوكلاء (Plugin رسمي).
- [Signal](/ar/channels/signal) - signal-cli؛ يركز على الخصوصية (Plugin رسمي).
- [Slack](/ar/channels/slack) - Bolt SDK؛ تطبيقات مساحات العمل (Plugin رسمي).
- [SMS](/ar/channels/sms) - رسائل SMS مدعومة من Twilio عبر Webhook الخاص بـ Gateway (Plugin رسمي).
- [Synology Chat](/ar/channels/synology-chat) - Synology NAS Chat عبر Webhooks صادرة وواردة (Plugin رسمي).
- [Telegram](/ar/channels/telegram) - مضمنة في النواة. واجهة Bot API عبر grammY؛ تدعم المجموعات.
- [Tlon](/ar/channels/tlon) - برنامج مراسلة قائم على Urbit (Plugin رسمي).
- [Twitch](/ar/channels/twitch) - دردشة Twitch عبر اتصال IRC (Plugin رسمي).
- [المكالمات الصوتية](/ar/plugins/voice-call) - اتصالات هاتفية عبر Plivo أو Telnyx أو Twilio (Plugin رسمي).
- [WebChat](/ar/web/webchat) - مضمنة في النواة. واجهة WebChat الخاصة بـ Gateway عبر WebSocket.
- [WeChat](/ar/channels/wechat) - روبوت Tencent iLink عبر تسجيل الدخول برمز QR؛ للدردشات الخاصة فقط (Plugin خارجي).
- [WhatsApp](/ar/channels/whatsapp) - الأكثر شيوعًا؛ يستخدم Baileys ويتطلب الاقتران برمز QR (Plugin رسمي).
- [Yuanbao](/ar/channels/yuanbao) - روبوت Tencent Yuanbao (Plugin خارجي).
- [Zalo](/ar/channels/zalo) - واجهة Zalo Bot API؛ برنامج المراسلة الشائع في فيتنام (Plugin رسمي).
- [Zalo ClawBot](/ar/channels/zaloclawbot) - مساعد Zalo شخصي عبر تسجيل الدخول برمز QR؛ مرتبط بالمالك (Plugin خارجي).
- [Zalo Personal](/ar/channels/zalouser) - حساب Zalo شخصي عبر تسجيل الدخول برمز QR (Plugin رسمي).

## ملاحظات التسليم

- تُحوَّل ردود Telegram التي تحتوي على صيغة صور Markdown، مثل `![alt](url)`،
  إلى ردود وسائط في مسار الإرسال النهائي متى أمكن.
- تُوجَّه الرسائل الخاصة متعددة الأشخاص في Slack على أنها دردشات جماعية، لذا تنطبق سياسة
  المجموعات وسلوك الإشارات وقواعد جلسات المجموعات على محادثات MPIM.
- يتم إعداد WhatsApp بالتثبيت عند الطلب: يمكن لعملية الإعداد الأولي عرض مسار الإعداد قبل
  تثبيت حزمة Plugin، ولا يحمّل Gateway ‏Plugin الخارجي من
  ClawHub/npm إلا عندما تكون القناة نشطة فعليًا.
- يمكن للقنوات التي تقبل الرسائل الواردة المنشأة بواسطة الروبوتات استخدام
  [الحماية المشتركة من حلقات الروبوتات](/ar/channels/bot-loop-protection) لمنع أزواج الروبوتات من
  الرد على بعضها بعضًا بلا نهاية.
- يمكن للغرف المدعومة التي تعمل دائمًا استخدام [أحداث الغرف المحيطة](/ar/channels/ambient-room-events)
  بحيث تصبح الأحاديث غير الموجّهة إلى الوكيل في الغرفة سياقًا هادئًا، ما لم يُرسل الوكيل باستخدام
  أداة `message`.

## ملاحظات

- يمكن تشغيل القنوات بالتزامن؛ اضبط عدة قنوات وسيوجّه OpenClaw الرسائل حسب كل دردشة.
- يكون الإعداد الأسرع عادةً عبر **Telegram** (رمز روبوت بسيط، دون تثبيت Plugin). يتطلب WhatsApp
  الاقتران برمز QR ويخزّن مزيدًا من الحالة على القرص.
- يختلف سلوك المجموعات حسب القناة؛ راجع [المجموعات](/ar/channels/groups).
- يُفرض اقتران الرسائل الخاصة وقوائم السماح لضمان السلامة؛ راجع [الأمان](/ar/gateway/security).
- استكشاف الأخطاء وإصلاحها: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).
- يُوثَّق موفرو النماذج بشكل منفصل؛ راجع [موفري النماذج](/ar/providers/models).
