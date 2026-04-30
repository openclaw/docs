---
read_when:
    - تريد اختيار قناة دردشة لـ OpenClaw
    - تحتاج إلى نظرة عامة سريعة على منصات المراسلة المدعومة
summary: منصات المراسلة التي يمكن لـ OpenClaw الاتصال بها
title: قنوات الدردشة
x-i18n:
    generated_at: "2026-04-30T07:41:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

يمكن لـ OpenClaw التحدث إليك على أي تطبيق دردشة تستخدمه بالفعل. يتصل كل قناة عبر Gateway.
النص مدعوم في كل مكان؛ أما الوسائط والتفاعلات فتختلف حسب القناة.

## ملاحظات التسليم

- ردود Telegram التي تحتوي على صيغة صور Markdown، مثل `![alt](url)`،
  تُحوَّل إلى ردود وسائط في المسار الصادر النهائي عندما يكون ذلك ممكنًا.
- رسائل Slack المباشرة متعددة الأشخاص تُوجَّه كمحادثات جماعية، لذلك تنطبق سياسة المجموعات وسلوك الإشارة
  وقواعد جلسات المجموعة على محادثات MPIM.
- إعداد WhatsApp يتم بالتثبيت عند الطلب: يمكن أن يعرض الإعداد الأولي مسار الإعداد قبل
  تجهيز تبعيات تشغيل Baileys، ولا يحمّل Gateway وقت تشغيل WhatsApp
  إلا عندما تكون القناة نشطة فعليًا.

## القنوات المدعومة

- [BlueBubbles](/ar/channels/bluebubbles) — **موصى به لـ iMessage**؛ يستخدم واجهة REST API الخاصة بخادم BlueBubbles على macOS مع دعم كامل للميزات (Plugin مضمن؛ التحرير، إلغاء الإرسال، التأثيرات، التفاعلات، إدارة المجموعات — التحرير معطّل حاليًا على macOS 26 Tahoe).
- [Discord](/ar/channels/discord) — Discord Bot API + Gateway؛ يدعم الخوادم والقنوات والرسائل المباشرة.
- [Feishu](/ar/channels/feishu) — روبوت Feishu/Lark عبر WebSocket ‏(Plugin مضمن).
- [Google Chat](/ar/channels/googlechat) — تطبيق Google Chat API عبر HTTP Webhook.
- [iMessage (قديم)](/ar/channels/imessage) — تكامل macOS قديم عبر imsg CLI (مهمل، استخدم BlueBubbles للإعدادات الجديدة).
- [IRC](/ar/channels/irc) — خوادم IRC الكلاسيكية؛ قنوات ورسائل مباشرة مع عناصر تحكم الاقتران وقوائم السماح.
- [LINE](/ar/channels/line) — روبوت LINE Messaging API ‏(Plugin مضمن).
- [Matrix](/ar/channels/matrix) — بروتوكول Matrix ‏(Plugin مضمن).
- [Mattermost](/ar/channels/mattermost) — Bot API + WebSocket؛ قنوات، مجموعات، رسائل مباشرة (Plugin مضمن).
- [Microsoft Teams](/ar/channels/msteams) — Bot Framework؛ دعم للمؤسسات (Plugin مضمن).
- [Nextcloud Talk](/ar/channels/nextcloud-talk) — دردشة مستضافة ذاتيًا عبر Nextcloud Talk ‏(Plugin مضمن).
- [Nostr](/ar/channels/nostr) — رسائل مباشرة لامركزية عبر NIP-04 ‏(Plugin مضمن).
- [QQ Bot](/ar/channels/qqbot) — QQ Bot API؛ دردشة خاصة، دردشة جماعية، ووسائط غنية (Plugin مضمن).
- [Signal](/ar/channels/signal) — signal-cli؛ يركز على الخصوصية.
- [Slack](/ar/channels/slack) — Bolt SDK؛ تطبيقات مساحات العمل.
- [Synology Chat](/ar/channels/synology-chat) — Synology NAS Chat عبر Webhooks الصادرة+الواردة (Plugin مضمن).
- [Telegram](/ar/channels/telegram) — Bot API عبر grammY؛ يدعم المجموعات.
- [Tlon](/ar/channels/tlon) — مراسل قائم على Urbit ‏(Plugin مضمن).
- [Twitch](/ar/channels/twitch) — دردشة Twitch عبر اتصال IRC ‏(Plugin مضمن).
- [المكالمة الصوتية](/ar/plugins/voice-call) — اتصالات هاتفية عبر Plivo أو Twilio (Plugin، يُثبَّت منفصلًا).
- [WebChat](/ar/web/webchat) — واجهة Gateway WebChat عبر WebSocket.
- [WeChat](/ar/channels/wechat) — Plugin Tencent iLink Bot عبر تسجيل الدخول برمز QR؛ الدردشات الخاصة فقط (Plugin خارجي).
- [WhatsApp](/ar/channels/whatsapp) — الأكثر شيوعًا؛ يستخدم Baileys ويتطلب الاقتران برمز QR.
- [Yuanbao](/ar/channels/yuanbao) — روبوت Tencent Yuanbao ‏(Plugin خارجي).
- [Zalo](/ar/channels/zalo) — Zalo Bot API؛ تطبيق مراسلة شائع في فيتنام (Plugin مضمن).
- [Zalo Personal](/ar/channels/zalouser) — حساب Zalo شخصي عبر تسجيل الدخول برمز QR ‏(Plugin مضمن).

## ملاحظات

- يمكن تشغيل القنوات في الوقت نفسه؛ اضبط عدة قنوات وسيُوجّه OpenClaw حسب كل دردشة.
- أسرع إعداد عادةً هو **Telegram** (رمز روبوت بسيط). يتطلب WhatsApp الاقتران برمز QR
  ويخزّن حالة أكبر على القرص.
- يختلف سلوك المجموعات حسب القناة؛ راجع [المجموعات](/ar/channels/groups).
- يتم فرض الاقتران للرسائل المباشرة وقوائم السماح من أجل السلامة؛ راجع [الأمان](/ar/gateway/security).
- استكشاف الأخطاء وإصلاحها: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).
- موفرو النماذج موثقون على نحو منفصل؛ راجع [موفرو النماذج](/ar/providers/models).
