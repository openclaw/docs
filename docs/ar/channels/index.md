---
read_when:
    - تريد اختيار قناة دردشة لـ OpenClaw
    - تحتاج إلى نظرة عامة سريعة على منصات المراسلة المدعومة
summary: منصات المراسلة التي يمكن لـ OpenClaw الاتصال بها
title: قنوات الدردشة
x-i18n:
    generated_at: "2026-05-02T07:17:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw يمكنه التحدث إليك عبر أي تطبيق دردشة تستخدمه بالفعل. تتصل كل قناة عبر Gateway.
النص مدعوم في كل مكان؛ أما الوسائط والتفاعلات فتختلف حسب القناة.

## ملاحظات التسليم

- يتم تحويل ردود Telegram التي تحتوي على صيغة صور markdown، مثل `![alt](url)`،
  إلى ردود وسائط في مسار الإرسال النهائي عندما يكون ذلك ممكنًا.
- يتم توجيه رسائل Slack المباشرة متعددة الأشخاص كدردشات جماعية، لذلك تنطبق سياسة المجموعات وسلوك الإشارات وقواعد جلسات المجموعات على محادثات MPIM.
- إعداد WhatsApp يعمل بالتثبيت عند الطلب: يمكن أن يعرض الإعداد الأولي مسار الإعداد قبل
  تثبيت حزمة plugin، ولا يحمّل Gateway وقت تشغيل WhatsApp
  إلا عندما تكون القناة نشطة فعليًا.

## القنوات المدعومة

- [BlueBubbles](/ar/channels/bluebubbles) — **موصى به لـ iMessage**؛ يستخدم واجهة BlueBubbles macOS server REST API مع دعم كامل للميزات (plugin مضمّن؛ تعديل، إلغاء إرسال، مؤثرات، تفاعلات، إدارة المجموعات — التعديل معطّل حاليًا على macOS 26 Tahoe).
- [Discord](/ar/channels/discord) — Discord Bot API + Gateway؛ يدعم الخوادم والقنوات والرسائل المباشرة.
- [Feishu](/ar/channels/feishu) — روبوت Feishu/Lark عبر WebSocket (plugin مضمّن).
- [Google Chat](/ar/channels/googlechat) — تطبيق Google Chat API عبر HTTP webhook (plugin قابل للتنزيل).
- [iMessage (القديم)](/ar/channels/imessage) — تكامل macOS القديم عبر imsg CLI (مهمل، استخدم BlueBubbles للإعدادات الجديدة).
- [IRC](/ar/channels/irc) — خوادم IRC الكلاسيكية؛ قنوات + رسائل مباشرة مع عناصر تحكم الاقتران/قائمة السماح.
- [LINE](/ar/channels/line) — روبوت LINE Messaging API (plugin قابل للتنزيل).
- [Matrix](/ar/channels/matrix) — بروتوكول Matrix (plugin قابل للتنزيل).
- [Mattermost](/ar/channels/mattermost) — Bot API + WebSocket؛ قنوات ومجموعات ورسائل مباشرة (plugin قابل للتنزيل).
- [Microsoft Teams](/ar/channels/msteams) — Bot Framework؛ دعم مؤسسي (plugin مضمّن).
- [Nextcloud Talk](/ar/channels/nextcloud-talk) — دردشة مستضافة ذاتيًا عبر Nextcloud Talk (plugin مضمّن).
- [Nostr](/ar/channels/nostr) — رسائل مباشرة لامركزية عبر NIP-04 (plugin مضمّن).
- [QQ Bot](/ar/channels/qqbot) — QQ Bot API؛ دردشة خاصة ودردشة جماعية ووسائط غنية (plugin مضمّن).
- [Signal](/ar/channels/signal) — signal-cli؛ يركز على الخصوصية.
- [Slack](/ar/channels/slack) — Bolt SDK؛ تطبيقات مساحات العمل.
- [Synology Chat](/ar/channels/synology-chat) — Synology NAS Chat عبر webhooks صادرة + واردة (plugin مضمّن).
- [Telegram](/ar/channels/telegram) — Bot API عبر grammY؛ يدعم المجموعات.
- [Tlon](/ar/channels/tlon) — مراسلة مبنية على Urbit (plugin مضمّن).
- [Twitch](/ar/channels/twitch) — دردشة Twitch عبر اتصال IRC (plugin مضمّن).
- [Voice Call](/ar/plugins/voice-call) — اتصالات هاتفية عبر Plivo أو Twilio (plugin، يُثبّت بشكل منفصل).
- [WebChat](/ar/web/webchat) — واجهة Gateway WebChat عبر WebSocket.
- [WeChat](/ar/channels/wechat) — plugin Tencent iLink Bot عبر تسجيل الدخول برمز QR؛ الدردشات الخاصة فقط (plugin خارجي).
- [WhatsApp](/ar/channels/whatsapp) — الأكثر شيوعًا؛ يستخدم Baileys ويتطلب اقتران QR.
- [Yuanbao](/ar/channels/yuanbao) — روبوت Tencent Yuanbao (plugin خارجي).
- [Zalo](/ar/channels/zalo) — Zalo Bot API؛ تطبيق المراسلة الشائع في فيتنام (plugin مضمّن).
- [Zalo Personal](/ar/channels/zalouser) — حساب Zalo شخصي عبر تسجيل الدخول برمز QR (plugin مضمّن).

## ملاحظات

- يمكن تشغيل القنوات في الوقت نفسه؛ اضبط قنوات متعددة وسيوجّه OpenClaw الرسائل حسب كل دردشة.
- أسرع إعداد يكون عادةً **Telegram** (رمز روبوت بسيط). يتطلب WhatsApp اقتران QR
  ويخزّن حالة أكثر على القرص.
- يختلف سلوك المجموعات حسب القناة؛ راجع [المجموعات](/ar/channels/groups).
- يتم فرض اقتران الرسائل المباشرة وقوائم السماح لأغراض السلامة؛ راجع [الأمان](/ar/gateway/security).
- استكشاف الأخطاء وإصلاحها: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).
- موفرو النماذج موثقون بشكل منفصل؛ راجع [موفرو النماذج](/ar/providers/models).
