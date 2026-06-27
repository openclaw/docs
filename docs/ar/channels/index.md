---
read_when:
    - تريد اختيار قناة دردشة لـ OpenClaw
    - تحتاج إلى نظرة عامة سريعة على منصات المراسلة المدعومة
summary: منصات المراسلة التي يمكن لـ OpenClaw الاتصال بها
title: قنوات الدردشة
x-i18n:
    generated_at: "2026-06-27T17:10:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

يمكن لـ OpenClaw التحدث إليك على أي تطبيق دردشة تستخدمه بالفعل. تتصل كل قناة عبر Gateway.
النص مدعوم في كل مكان؛ أما الوسائط والتفاعلات فتختلف حسب القناة.

## ملاحظات التسليم

- تُحوَّل ردود Telegram التي تحتوي على صيغة صور Markdown، مثل `![alt](url)`،
  إلى ردود وسائط في مسار الإرسال النهائي متى أمكن ذلك.
- تُوجَّه الرسائل المباشرة متعددة الأشخاص في Slack كمحادثات جماعية، لذلك تنطبق سياسة المجموعات وسلوك الإشارات
  وقواعد جلسات المجموعات على محادثات MPIM.
- إعداد WhatsApp يتم بالتثبيت عند الطلب: يمكن لمرحلة الإعداد الأولي عرض مسار الإعداد قبل
  تثبيت حزمة Plugin، ولا يحمّل Gateway الـ Plugin الخارجي من
  ClawHub/npm إلا عندما تكون القناة نشطة فعلاً.
- يمكن للقنوات التي تقبل الرسائل الواردة المؤلفة من البوت استخدام
  [حماية حلقة البوت](/ar/channels/bot-loop-protection) المشتركة لمنع أزواج البوتات من
  الرد على بعضها إلى ما لا نهاية.
- يمكن للغرف المدعومة التي تعمل دائماً استخدام [أحداث الغرفة المحيطة](/ar/channels/ambient-room-events)
  بحيث تصبح أحاديث الغرفة غير المذكورة سياقاً هادئاً ما لم يرسل الوكيل باستخدام
  أداة `message`.

## القنوات المدعومة

- [Discord](/ar/channels/discord) - Discord Bot API + Gateway؛ يدعم الخوادم والقنوات والرسائل المباشرة.
- [Feishu](/ar/channels/feishu) - بوت Feishu/Lark عبر WebSocket ‏(Plugin مدمج).
- [Google Chat](/ar/channels/googlechat) - تطبيق Google Chat API عبر HTTP webhook ‏(Plugin قابل للتنزيل).
- [iMessage](/ar/channels/imessage) - تكامل macOS أصلي عبر جسر `imsg` على Mac مسجّل الدخول (أو غلاف SSH عندما يعمل Gateway في مكان آخر)، بما يشمل إجراءات API خاصة للردود، وtapbacks، والتأثيرات، والمرفقات، وإدارة المجموعات. مفضل لإعدادات OpenClaw iMessage الجديدة عندما تكون أذونات المضيف والوصول إلى Messages مناسبين.
- [IRC](/ar/channels/irc) - خوادم IRC الكلاسيكية؛ قنوات ورسائل مباشرة مع عناصر تحكم في الاقتران وقوائم السماح.
- [LINE](/ar/channels/line) - بوت LINE Messaging API ‏(Plugin قابل للتنزيل).
- [Matrix](/ar/channels/matrix) - بروتوكول Matrix ‏(Plugin قابل للتنزيل).
- [Mattermost](/ar/channels/mattermost) - Bot API + WebSocket؛ قنوات ومجموعات ورسائل مباشرة (Plugin قابل للتنزيل).
- [Microsoft Teams](/ar/channels/msteams) - Bot Framework؛ دعم مؤسسي (Plugin مدمج).
- [Nextcloud Talk](/ar/channels/nextcloud-talk) - دردشة مستضافة ذاتياً عبر Nextcloud Talk ‏(Plugin مدمج).
- [Nostr](/ar/channels/nostr) - رسائل مباشرة لامركزية عبر NIP-04 ‏(Plugin مدمج).
- [QQ Bot](/ar/channels/qqbot) - QQ Bot API؛ دردشة خاصة ودردشة جماعية ووسائط غنية (Plugin مدمج).
- [Raft](/ar/channels/raft) - جسر إيقاظ Raft CLI لتعاون البشر والوكلاء (Plugin خارجي).
- [Signal](/ar/channels/signal) - signal-cli؛ يركز على الخصوصية.
- [Slack](/ar/channels/slack) - Bolt SDK؛ تطبيقات مساحة العمل.
- [SMS](/ar/channels/sms) - رسائل SMS مدعومة من Twilio عبر Webhook الخاص بـ Gateway ‏(Plugin رسمي).
- [Synology Chat](/ar/channels/synology-chat) - Synology NAS Chat عبر Webhooks صادرة وواردة (Plugin مدمج).
- [Telegram](/ar/channels/telegram) - Bot API عبر grammY؛ يدعم المجموعات.
- [Tlon](/ar/channels/tlon) - مراسل قائم على Urbit ‏(Plugin مدمج).
- [Twitch](/ar/channels/twitch) - دردشة Twitch عبر اتصال IRC ‏(Plugin مدمج).
- [المكالمات الصوتية](/ar/plugins/voice-call) - الاتصال الهاتفي عبر Plivo أو Twilio ‏(Plugin، يثبّت بشكل منفصل).
- [WebChat](/ar/web/webchat) - واجهة Gateway WebChat عبر WebSocket.
- [WeChat](/ar/channels/wechat) - Plugin Tencent iLink Bot عبر تسجيل الدخول برمز QR؛ الدردشات الخاصة فقط (Plugin خارجي).
- [WhatsApp](/ar/channels/whatsapp) - الأكثر شيوعاً؛ يستخدم Baileys ويتطلب اقتران QR.
- [Yuanbao](/ar/channels/yuanbao) - بوت Tencent Yuanbao ‏(Plugin خارجي).
- [Zalo](/ar/channels/zalo) - Zalo Bot API؛ مراسل شائع في فيتنام (Plugin مدمج).
- [Zalo ClawBot](/ar/channels/zaloclawbot) - مساعد Zalo شخصي عبر تسجيل الدخول برمز QR؛ مرتبط بالمالك (Plugin خارجي).
- [Zalo Personal](/ar/channels/zalouser) - حساب Zalo شخصي عبر تسجيل الدخول برمز QR ‏(Plugin مدمج).

## ملاحظات

- يمكن تشغيل القنوات في الوقت نفسه؛ اضبط عدة قنوات وسيوجّه OpenClaw حسب كل دردشة.
- أسرع إعداد عادةً هو **Telegram** (رمز بوت بسيط). يتطلب WhatsApp اقتران QR و
  يخزن حالة أكثر على القرص.
- يختلف سلوك المجموعات حسب القناة؛ راجع [المجموعات](/ar/channels/groups).
- تُفرض قوائم السماح واقتران الرسائل المباشرة من أجل السلامة؛ راجع [الأمان](/ar/gateway/security).
- استكشاف الأخطاء وإصلاحها: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).
- موفرو النماذج موثقون بشكل منفصل؛ راجع [موفري النماذج](/ar/providers/models).
