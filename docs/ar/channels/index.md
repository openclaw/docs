---
read_when:
    - أنت تريد اختيار قناة دردشة لـ OpenClaw
    - تحتاج إلى نظرة عامة سريعة على منصات المراسلة المدعومة
summary: منصات المراسلة التي يمكن لـ OpenClaw الاتصال بها
title: قنوات الدردشة
x-i18n:
    generated_at: "2026-04-24T07:30:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: c016b78b16724e73b21946d6bed0009f4cbebd1f887620431b9b4bff70f2b1ff
    source_path: channels/index.md
    workflow: 15
---

يمكن لـ OpenClaw التحدث إليك عبر أي تطبيق دردشة تستخدمه بالفعل. تتصل كل قناة عبر Gateway.
النص مدعوم في كل مكان؛ أما الوسائط والتفاعلات فتختلف حسب القناة.

## القنوات المدعومة

- [BlueBubbles](/ar/channels/bluebubbles) — **موصى به لـ iMessage**؛ يستخدم واجهة REST API لخادم BlueBubbles على macOS مع دعم كامل للميزات (Plugin مضمّن؛ التعديل، وإلغاء الإرسال، والتأثيرات، والتفاعلات، وإدارة المجموعات — التعديل معطّل حاليًا على macOS 26 Tahoe).
- [Discord](/ar/channels/discord) — واجهة Discord Bot API + Gateway؛ تدعم الخوادم والقنوات والرسائل الخاصة.
- [Feishu](/ar/channels/feishu) — بوت Feishu/Lark عبر WebSocket (Plugin مضمّن).
- [Google Chat](/ar/channels/googlechat) — تطبيق Google Chat API عبر HTTP Webhook.
- [iMessage (legacy)](/ar/channels/imessage) — تكامل macOS قديم عبر imsg CLI (مهمل، استخدم BlueBubbles في الإعدادات الجديدة).
- [IRC](/ar/channels/irc) — خوادم IRC الكلاسيكية؛ قنوات + رسائل خاصة مع عناصر تحكم الاقتران/قائمة السماح.
- [LINE](/ar/channels/line) — بوت LINE Messaging API (Plugin مضمّن).
- [Matrix](/ar/channels/matrix) — بروتوكول Matrix (Plugin مضمّن).
- [Mattermost](/ar/channels/mattermost) — Bot API + WebSocket؛ قنوات ومجموعات ورسائل خاصة (Plugin مضمّن).
- [Microsoft Teams](/ar/channels/msteams) — Bot Framework؛ دعم للمؤسسات (Plugin مضمّن).
- [Nextcloud Talk](/ar/channels/nextcloud-talk) — دردشة مستضافة ذاتيًا عبر Nextcloud Talk (Plugin مضمّن).
- [Nostr](/ar/channels/nostr) — رسائل خاصة لامركزية عبر NIP-04 (Plugin مضمّن).
- [QQ Bot](/ar/channels/qqbot) — واجهة QQ Bot API؛ دردشة خاصة ودردشة جماعية ووسائط غنية (Plugin مضمّن).
- [Signal](/ar/channels/signal) — signal-cli؛ يركّز على الخصوصية.
- [Slack](/ar/channels/slack) — Bolt SDK؛ تطبيقات مساحات العمل.
- [Synology Chat](/ar/channels/synology-chat) — Synology NAS Chat عبر Webhooks صادرة + واردة (Plugin مضمّن).
- [Telegram](/ar/channels/telegram) — Bot API عبر grammY؛ تدعم المجموعات.
- [Tlon](/ar/channels/tlon) — تطبيق مراسلة قائم على Urbit (Plugin مضمّن).
- [Twitch](/ar/channels/twitch) — دردشة Twitch عبر اتصال IRC (Plugin مضمّن).
- [Voice Call](/ar/plugins/voice-call) — اتصالات هاتفية عبر Plivo أو Twilio (Plugin، يُثبَّت بشكل منفصل).
- [WebChat](/ar/web/webchat) — واجهة Gateway WebChat عبر WebSocket.
- [WeChat](/ar/channels/wechat) — Plugin بوت Tencent iLink عبر تسجيل الدخول برمز QR؛ المحادثات الخاصة فقط (Plugin خارجي).
- [WhatsApp](/ar/channels/whatsapp) — الأكثر شيوعًا؛ يستخدم Baileys ويتطلب الاقتران عبر QR.
- [Zalo](/ar/channels/zalo) — واجهة Zalo Bot API؛ تطبيق المراسلة الشائع في فيتنام (Plugin مضمّن).
- [Zalo Personal](/ar/channels/zalouser) — حساب Zalo شخصي عبر تسجيل الدخول برمز QR (Plugin مضمّن).

## ملاحظات

- يمكن تشغيل القنوات في الوقت نفسه؛ اضبط عدة قنوات وسيقوم OpenClaw بالتوجيه لكل دردشة.
- أسرع إعداد يكون عادةً **Telegram** (رمز bot بسيط). يتطلب WhatsApp الاقتران عبر QR
  ويخزن مزيدًا من الحالة على القرص.
- يختلف سلوك المجموعات حسب القناة؛ راجع [المجموعات](/ar/channels/groups).
- يتم فرض الاقتران في الرسائل الخاصة وقوائم السماح لأسباب تتعلق بالأمان؛ راجع [الأمان](/ar/gateway/security).
- استكشاف الأخطاء وإصلاحها: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).
- يتم توثيق مزوّدي النماذج بشكل منفصل؛ راجع [موفرو النماذج](/ar/providers/models).
