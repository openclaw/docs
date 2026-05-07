---
read_when:
    - تريد اختيار قناة دردشة لـ OpenClaw
    - تحتاج إلى نظرة عامة سريعة على منصات المراسلة المدعومة
summary: منصات المراسلة التي يمكن لـ OpenClaw الاتصال بها
title: قنوات الدردشة
x-i18n:
    generated_at: "2026-05-07T01:50:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

يمكن لـ OpenClaw التحدث إليك على أي تطبيق دردشة تستخدمه بالفعل. يتصل كل قناة عبر Gateway.
النص مدعوم في كل مكان؛ أما الوسائط والتفاعلات فتختلف حسب القناة.

## ملاحظات التسليم

- يتم تحويل ردود Telegram التي تحتوي على صياغة صور Markdown، مثل `![alt](url)`،
  إلى ردود وسائط في مسار الإرسال النهائي عندما يكون ذلك ممكنًا.
- تُوجَّه رسائل Slack المباشرة متعددة الأشخاص كدردشات جماعية، لذا تنطبق سياسة المجموعات وسلوك الإشارات وقواعد الجلسات الجماعية على محادثات MPIM.
- إعداد WhatsApp يكون عند الطلب: يمكن لمرحلة الإعداد عرض تدفق الإعداد قبل
  تثبيت حزمة Plugin، ولا يحمّل Gateway وقت تشغيل WhatsApp
  إلا عندما تكون القناة نشطة فعليًا.

## القنوات المدعومة

- [BlueBubbles](/ar/channels/bluebubbles) - جسر iMessage قديم عبر واجهة REST API لخادم BlueBubbles على macOS؛ مهمل لإعدادات OpenClaw الجديدة لكنه لا يزال مدعومًا للإعدادات الحالية وإجراءات private-API الأغنى.
- [Discord](/ar/channels/discord) - Discord Bot API + Gateway؛ يدعم الخوادم والقنوات والرسائل المباشرة.
- [Feishu](/ar/channels/feishu) - بوت Feishu/Lark عبر WebSocket (Plugin مضمّن).
- [Google Chat](/ar/channels/googlechat) - تطبيق Google Chat API عبر Webhook HTTP (Plugin قابل للتنزيل).
- [iMessage](/ar/channels/imessage) - تكامل macOS أصلي عبر CLI الخاص بـ imsg؛ مفضل لإعدادات OpenClaw iMessage الجديدة عندما تكون أذونات المضيف والوصول إلى Messages ملائمين.
- [IRC](/ar/channels/irc) - خوادم IRC الكلاسيكية؛ قنوات ورسائل مباشرة مع عناصر تحكم في الاقتران وقائمة السماح.
- [LINE](/ar/channels/line) - بوت LINE Messaging API (Plugin قابل للتنزيل).
- [Matrix](/ar/channels/matrix) - بروتوكول Matrix (Plugin قابل للتنزيل).
- [Mattermost](/ar/channels/mattermost) - Bot API + WebSocket؛ قنوات ومجموعات ورسائل مباشرة (Plugin قابل للتنزيل).
- [Microsoft Teams](/ar/channels/msteams) - Bot Framework؛ دعم مؤسسي (Plugin مضمّن).
- [Nextcloud Talk](/ar/channels/nextcloud-talk) - دردشة ذاتية الاستضافة عبر Nextcloud Talk (Plugin مضمّن).
- [Nostr](/ar/channels/nostr) - رسائل مباشرة لامركزية عبر NIP-04 (Plugin مضمّن).
- [QQ Bot](/ar/channels/qqbot) - QQ Bot API؛ دردشة خاصة ودردشة جماعية ووسائط غنية (Plugin مضمّن).
- [Signal](/ar/channels/signal) - signal-cli؛ يركز على الخصوصية.
- [Slack](/ar/channels/slack) - Bolt SDK؛ تطبيقات مساحة العمل.
- [Synology Chat](/ar/channels/synology-chat) - Synology NAS Chat عبر Webhooks صادرة وداخلة (Plugin مضمّن).
- [Telegram](/ar/channels/telegram) - Bot API عبر grammY؛ يدعم المجموعات.
- [Tlon](/ar/channels/tlon) - مراسل مبني على Urbit (Plugin مضمّن).
- [Twitch](/ar/channels/twitch) - دردشة Twitch عبر اتصال IRC (Plugin مضمّن).
- [Voice Call](/ar/plugins/voice-call) - اتصالات هاتفية عبر Plivo أو Twilio (Plugin، يُثبَّت بشكل منفصل).
- [WebChat](/ar/web/webchat) - واجهة Gateway WebChat عبر WebSocket.
- [WeChat](/ar/channels/wechat) - Plugin بوت Tencent iLink عبر تسجيل دخول QR؛ الدردشات الخاصة فقط (Plugin خارجي).
- [WhatsApp](/ar/channels/whatsapp) - الأكثر شعبية؛ يستخدم Baileys ويتطلب اقتران QR.
- [Yuanbao](/ar/channels/yuanbao) - بوت Tencent Yuanbao (Plugin خارجي).
- [Zalo](/ar/channels/zalo) - Zalo Bot API؛ مراسل شائع في فيتنام (Plugin مضمّن).
- [Zalo Personal](/ar/channels/zalouser) - حساب Zalo شخصي عبر تسجيل دخول QR (Plugin مضمّن).

## ملاحظات

- يمكن تشغيل القنوات في وقت واحد؛ اضبط قنوات متعددة وسيوجّه OpenClaw حسب كل دردشة.
- يكون أسرع إعداد عادةً **Telegram** (رمز بوت بسيط). يتطلب WhatsApp اقتران QR
  ويخزن حالة أكثر على القرص.
- يختلف سلوك المجموعات حسب القناة؛ راجع [المجموعات](/ar/channels/groups).
- يتم فرض اقتران الرسائل المباشرة وقوائم السماح للسلامة؛ راجع [الأمان](/ar/gateway/security).
- استكشاف الأخطاء وإصلاحها: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).
- موفرو النماذج موثّقون بشكل منفصل؛ راجع [موفرو النماذج](/ar/providers/models).
