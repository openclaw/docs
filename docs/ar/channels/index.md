---
read_when:
    - تريد اختيار قناة دردشة لـ OpenClaw
    - تحتاج إلى نظرة عامة سريعة على منصات المراسلة المدعومة
summary: منصات المراسلة التي يمكن لـ OpenClaw الاتصال بها
title: قنوات الدردشة
x-i18n:
    generated_at: "2026-05-06T07:43:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

يمكن لـ OpenClaw التحدث معك على أي تطبيق دردشة تستخدمه بالفعل. يتصل كل Channel عبر Gateway.
النص مدعوم في كل مكان؛ وتختلف الوسائط والتفاعلات حسب Channel.

## ملاحظات التسليم

- تُحوَّل ردود Telegram التي تحتوي على صيغة صور Markdown، مثل `![alt](url)`،
  إلى ردود وسائط في مسار الإرسال النهائي عندما يكون ذلك ممكنًا.
- تُوجَّه رسائل Slack المباشرة متعددة الأشخاص كمحادثات جماعية، لذا تنطبق سياسة المجموعات وسلوك الإشارات
  وقواعد جلسات المجموعات على محادثات MPIM.
- إعداد WhatsApp يتم بالتثبيت عند الطلب: يمكن لعملية التهيئة عرض مسار الإعداد قبل
  تثبيت حزمة Plugin، ولا يحمّل Gateway وقت تشغيل WhatsApp
  إلا عندما يكون Channel نشطًا فعليًا.

## Channels المدعومة

- [BlueBubbles](/ar/channels/bluebubbles) - **موصى به لـ iMessage**؛ يستخدم واجهة BlueBubbles macOS server REST API مع دعم كامل للميزات (Plugin مضمن؛ التعديل، إلغاء الإرسال، التأثيرات، التفاعلات، إدارة المجموعات - التعديل معطل حاليًا على macOS 26 Tahoe).
- [Discord](/ar/channels/discord) - Discord Bot API + Gateway؛ يدعم الخوادم والقنوات والرسائل المباشرة.
- [Feishu](/ar/channels/feishu) - روبوت Feishu/Lark عبر WebSocket (Plugin مضمن).
- [Google Chat](/ar/channels/googlechat) - تطبيق Google Chat API عبر HTTP webhook (Plugin قابل للتنزيل).
- [iMessage (قديم)](/ar/channels/imessage) - تكامل macOS قديم عبر imsg CLI (مهمل، استخدم BlueBubbles للإعدادات الجديدة).
- [IRC](/ar/channels/irc) - خوادم IRC الكلاسيكية؛ القنوات + الرسائل المباشرة مع عناصر تحكم الاقتران/قائمة السماح.
- [LINE](/ar/channels/line) - روبوت LINE Messaging API (Plugin قابل للتنزيل).
- [Matrix](/ar/channels/matrix) - بروتوكول Matrix (Plugin قابل للتنزيل).
- [Mattermost](/ar/channels/mattermost) - Bot API + WebSocket؛ القنوات والمجموعات والرسائل المباشرة (Plugin قابل للتنزيل).
- [Microsoft Teams](/ar/channels/msteams) - Bot Framework؛ دعم مؤسسي (Plugin مضمن).
- [Nextcloud Talk](/ar/channels/nextcloud-talk) - دردشة مستضافة ذاتيًا عبر Nextcloud Talk (Plugin مضمن).
- [Nostr](/ar/channels/nostr) - رسائل مباشرة لامركزية عبر NIP-04 (Plugin مضمن).
- [QQ Bot](/ar/channels/qqbot) - QQ Bot API؛ دردشة خاصة ودردشة جماعية ووسائط غنية (Plugin مضمن).
- [Signal](/ar/channels/signal) - signal-cli؛ يركز على الخصوصية.
- [Slack](/ar/channels/slack) - Bolt SDK؛ تطبيقات مساحات العمل.
- [Synology Chat](/ar/channels/synology-chat) - Synology NAS Chat عبر Webhooks صادرة+واردة (Plugin مضمن).
- [Telegram](/ar/channels/telegram) - Bot API عبر grammY؛ يدعم المجموعات.
- [Tlon](/ar/channels/tlon) - مراسلة قائمة على Urbit (Plugin مضمن).
- [Twitch](/ar/channels/twitch) - دردشة Twitch عبر اتصال IRC (Plugin مضمن).
- [مكالمة صوتية](/ar/plugins/voice-call) - اتصالات هاتفية عبر Plivo أو Twilio (Plugin، يُثبَّت بشكل منفصل).
- [WebChat](/ar/web/webchat) - واجهة Gateway WebChat عبر WebSocket.
- [WeChat](/ar/channels/wechat) - Plugin Tencent iLink Bot عبر تسجيل الدخول برمز QR؛ الدردشات الخاصة فقط (Plugin خارجي).
- [WhatsApp](/ar/channels/whatsapp) - الأكثر شيوعًا؛ يستخدم Baileys ويتطلب اقتران QR.
- [Yuanbao](/ar/channels/yuanbao) - روبوت Tencent Yuanbao (Plugin خارجي).
- [Zalo](/ar/channels/zalo) - Zalo Bot API؛ تطبيق المراسلة الشائع في فيتنام (Plugin مضمن).
- [Zalo Personal](/ar/channels/zalouser) - حساب Zalo شخصي عبر تسجيل الدخول برمز QR (Plugin مضمن).

## ملاحظات

- يمكن تشغيل Channels في الوقت نفسه؛ قم بتكوين عدة Channels وسيقوم OpenClaw بالتوجيه حسب الدردشة.
- أسرع إعداد عادةً هو **Telegram** (رمز روبوت بسيط). يتطلب WhatsApp اقتران QR و
  يخزن حالة أكثر على القرص.
- يختلف سلوك المجموعات حسب Channel؛ راجع [المجموعات](/ar/channels/groups).
- يتم فرض اقتران الرسائل المباشرة وقوائم السماح من أجل السلامة؛ راجع [الأمان](/ar/gateway/security).
- استكشاف الأخطاء وإصلاحها: [استكشاف أخطاء Channel وإصلاحها](/ar/channels/troubleshooting).
- موفرو النماذج موثقون بشكل منفصل؛ راجع [موفرو النماذج](/ar/providers/models).
