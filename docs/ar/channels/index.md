---
read_when:
    - تريد اختيار قناة دردشة لـ OpenClaw
    - تحتاج إلى نظرة عامة سريعة على منصات المراسلة المدعومة
summary: منصات المراسلة التي يمكن لـ OpenClaw الاتصال بها
title: قنوات الدردشة
x-i18n:
    generated_at: "2026-05-10T19:22:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57ae81a99d265abbf3f9f016506e787d66b4f6984d833e43e7a8554e157a3c17
    source_path: channels/index.md
    workflow: 16
---

يمكن لـ OpenClaw التحدث معك على أي تطبيق دردشة تستخدمه بالفعل. تتصل كل قناة عبر Gateway.
النص مدعوم في كل مكان؛ أما الوسائط والتفاعلات فتختلف حسب القناة.

## ملاحظات التسليم

- يتم تحويل ردود Telegram التي تحتوي على صيغة صور markdown، مثل `![alt](url)`،
  إلى ردود وسائط في مسار الخروج النهائي عند الإمكان.
- تُوجَّه رسائل Slack المباشرة متعددة الأشخاص كدردشات جماعية، لذلك تنطبق سياسة المجموعة وسلوك
  الإشارات وقواعد جلسات المجموعات على محادثات MPIM.
- إعداد WhatsApp يتم بالتثبيت عند الطلب: يمكن للإعداد الأولي عرض تدفق الإعداد قبل
  تثبيت حزمة Plugin، ولا يحمّل Gateway بيئة تشغيل WhatsApp
  إلا عندما تكون القناة نشطة فعليًا.

## القنوات المدعومة

- [Discord](/ar/channels/discord) - واجهة Discord Bot API + Gateway؛ يدعم الخوادم والقنوات والرسائل المباشرة.
- [Feishu](/ar/channels/feishu) - بوت Feishu/Lark عبر WebSocket (Plugin مضمن).
- [Google Chat](/ar/channels/googlechat) - تطبيق Google Chat API عبر HTTP webhook (Plugin قابل للتنزيل).
- [iMessage](/ar/channels/imessage) - تكامل macOS أصلي عبر جسر `imsg` على Mac مسجّل الدخول (أو غلاف SSH عندما يعمل Gateway في مكان آخر)، بما في ذلك إجراءات API خاصة للردود، وtapbacks، والتأثيرات، والمرفقات، وإدارة المجموعات. مفضّل لإعدادات OpenClaw iMessage الجديدة عندما تكون أذونات المضيف ووصول Messages مناسبين.
- [IRC](/ar/channels/irc) - خوادم IRC تقليدية؛ قنوات + رسائل مباشرة مع عناصر تحكم للإقران وقائمة السماح.
- [LINE](/ar/channels/line) - بوت LINE Messaging API (Plugin قابل للتنزيل).
- [Matrix](/ar/channels/matrix) - بروتوكول Matrix (Plugin قابل للتنزيل).
- [Mattermost](/ar/channels/mattermost) - Bot API + WebSocket؛ قنوات ومجموعات ورسائل مباشرة (Plugin قابل للتنزيل).
- [Microsoft Teams](/ar/channels/msteams) - Bot Framework؛ دعم مؤسسي (Plugin مضمن).
- [Nextcloud Talk](/ar/channels/nextcloud-talk) - دردشة مستضافة ذاتيًا عبر Nextcloud Talk (Plugin مضمن).
- [Nostr](/ar/channels/nostr) - رسائل مباشرة لامركزية عبر NIP-04 (Plugin مضمن).
- [QQ Bot](/ar/channels/qqbot) - QQ Bot API؛ دردشة خاصة، ودردشة جماعية، ووسائط غنية (Plugin مضمن).
- [Signal](/ar/channels/signal) - signal-cli؛ يركز على الخصوصية.
- [Slack](/ar/channels/slack) - Bolt SDK؛ تطبيقات مساحة العمل.
- [Synology Chat](/ar/channels/synology-chat) - Synology NAS Chat عبر Webhook صادرة+واردة (Plugin مضمن).
- [Telegram](/ar/channels/telegram) - Bot API عبر grammY؛ يدعم المجموعات.
- [Tlon](/ar/channels/tlon) - مراسل قائم على Urbit (Plugin مضمن).
- [Twitch](/ar/channels/twitch) - دردشة Twitch عبر اتصال IRC (Plugin مضمن).
- [Voice Call](/ar/plugins/voice-call) - اتصالات هاتفية عبر Plivo أو Twilio (Plugin، يُثبّت بشكل منفصل).
- [WebChat](/ar/web/webchat) - واجهة WebChat الخاصة بـ Gateway عبر WebSocket.
- [WeChat](/ar/channels/wechat) - Plugin Tencent iLink Bot عبر تسجيل دخول QR؛ دردشات خاصة فقط (Plugin خارجي).
- [WhatsApp](/ar/channels/whatsapp) - الأكثر شعبية؛ يستخدم Baileys ويتطلب إقران QR.
- [Yuanbao](/ar/channels/yuanbao) - بوت Tencent Yuanbao (Plugin خارجي).
- [Zalo](/ar/channels/zalo) - Zalo Bot API؛ المراسل الشائع في فيتنام (Plugin مضمن).
- [Zalo Personal](/ar/channels/zalouser) - حساب Zalo شخصي عبر تسجيل دخول QR (Plugin مضمن).

## ملاحظات

- يمكن تشغيل القنوات في الوقت نفسه؛ اضبط عدة قنوات وسيوجّه OpenClaw حسب كل دردشة.
- عادةً ما يكون أسرع إعداد هو **Telegram** (رمز بوت بسيط). يتطلب WhatsApp إقران QR و
  يخزن حالة أكثر على القرص.
- يختلف سلوك المجموعات حسب القناة؛ راجع [المجموعات](/ar/channels/groups).
- يتم فرض إقران الرسائل المباشرة وقوائم السماح للسلامة؛ راجع [الأمان](/ar/gateway/security).
- استكشاف الأخطاء وإصلاحها: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).
- موفرو النماذج موثقون بشكل منفصل؛ راجع [موفرو النماذج](/ar/providers/models).
