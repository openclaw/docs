---
read_when:
    - می‌خواهید یک کانال چت برای OpenClaw انتخاب کنید
    - شما به یک مرور سریع بر پلتفرم‌های پیام‌رسانی پشتیبانی‌شده نیاز دارید
summary: پلتفرم‌های پیام‌رسانی که OpenClaw می‌تواند به آن‌ها متصل شود
title: کانال‌های چت
x-i18n:
    generated_at: "2026-05-07T01:50:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw می‌تواند در هر برنامهٔ چتی که از قبل استفاده می‌کنید با شما گفتگو کند. هر کانال از طریق Gateway متصل می‌شود.
متن در همه‌جا پشتیبانی می‌شود؛ رسانه و واکنش‌ها بسته به کانال متفاوت‌اند.

## نکات تحویل

- پاسخ‌های Telegram که شامل نحو تصویر در Markdown هستند، مانند `![alt](url)`،
  در صورت امکان در مسیر خروجی نهایی به پاسخ‌های رسانه‌ای تبدیل می‌شوند.
- پیام‌های مستقیم چندنفرهٔ Slack به‌عنوان چت‌های گروهی مسیریابی می‌شوند، بنابراین خط‌مشی گروه، رفتار اشاره‌کردن،
  و قواعد نشست گروه برای گفتگوهای MPIM اعمال می‌شود.
- راه‌اندازی WhatsApp نصب بر اساس تقاضا است: فرایند آغازبه‌کار می‌تواند پیش از
  نصب بستهٔ plugin، جریان راه‌اندازی را نشان دهد، و Gateway زمان اجرای WhatsApp را
  فقط وقتی بارگذاری می‌کند که کانال واقعاً فعال باشد.

## کانال‌های پشتیبانی‌شده

- [BlueBubbles](/fa/channels/bluebubbles) - پل قدیمی iMessage از طریق BlueBubbles macOS server REST API؛ برای راه‌اندازی‌های جدید OpenClaw منسوخ شده اما همچنان برای پیکربندی‌های موجود و کنش‌های غنی‌تر private-API پشتیبانی می‌شود.
- [Discord](/fa/channels/discord) - Discord Bot API + Gateway؛ از سرورها، کانال‌ها و پیام‌های مستقیم پشتیبانی می‌کند.
- [Feishu](/fa/channels/feishu) - ربات Feishu/Lark از طریق WebSocket (plugin همراه).
- [Google Chat](/fa/channels/googlechat) - برنامهٔ Google Chat API از طریق HTTP webhook (plugin قابل دانلود).
- [iMessage](/fa/channels/imessage) - یکپارچه‌سازی بومی macOS از طریق imsg CLI؛ برای راه‌اندازی‌های جدید OpenClaw iMessage وقتی مجوزهای میزبان و دسترسی Messages مناسب باشند ترجیح داده می‌شود.
- [IRC](/fa/channels/irc) - سرورهای کلاسیک IRC؛ کانال‌ها + پیام‌های مستقیم با کنترل‌های جفت‌سازی/فهرست مجاز.
- [LINE](/fa/channels/line) - ربات LINE Messaging API (plugin قابل دانلود).
- [Matrix](/fa/channels/matrix) - پروتکل Matrix (plugin قابل دانلود).
- [Mattermost](/fa/channels/mattermost) - Bot API + WebSocket؛ کانال‌ها، گروه‌ها، پیام‌های مستقیم (plugin قابل دانلود).
- [Microsoft Teams](/fa/channels/msteams) - Bot Framework؛ پشتیبانی سازمانی (plugin همراه).
- [Nextcloud Talk](/fa/channels/nextcloud-talk) - چت خودمیزبان از طریق Nextcloud Talk (plugin همراه).
- [Nostr](/fa/channels/nostr) - پیام‌های مستقیم غیرمتمرکز از طریق NIP-04 (plugin همراه).
- [QQ Bot](/fa/channels/qqbot) - QQ Bot API؛ چت خصوصی، چت گروهی، و رسانهٔ غنی (plugin همراه).
- [Signal](/fa/channels/signal) - signal-cli؛ متمرکز بر حریم خصوصی.
- [Slack](/fa/channels/slack) - Bolt SDK؛ برنامه‌های فضای کاری.
- [Synology Chat](/fa/channels/synology-chat) - Synology NAS Chat از طریق webhookهای خروجی+ورودی (plugin همراه).
- [Telegram](/fa/channels/telegram) - Bot API از طریق grammY؛ از گروه‌ها پشتیبانی می‌کند.
- [Tlon](/fa/channels/tlon) - پیام‌رسان مبتنی بر Urbit (plugin همراه).
- [Twitch](/fa/channels/twitch) - چت Twitch از طریق اتصال IRC (plugin همراه).
- [Voice Call](/fa/plugins/voice-call) - تلفن از طریق Plivo یا Twilio (plugin، جداگانه نصب می‌شود).
- [WebChat](/fa/web/webchat) - رابط کاربری Gateway WebChat روی WebSocket.
- [WeChat](/fa/channels/wechat) - plugin Tencent iLink Bot از طریق ورود QR؛ فقط چت‌های خصوصی (plugin خارجی).
- [WhatsApp](/fa/channels/whatsapp) - محبوب‌ترین؛ از Baileys استفاده می‌کند و به جفت‌سازی QR نیاز دارد.
- [Yuanbao](/fa/channels/yuanbao) - ربات Tencent Yuanbao (plugin خارجی).
- [Zalo](/fa/channels/zalo) - Zalo Bot API؛ پیام‌رسان محبوب ویتنام (plugin همراه).
- [Zalo Personal](/fa/channels/zalouser) - حساب شخصی Zalo از طریق ورود QR (plugin همراه).

## یادداشت‌ها

- کانال‌ها می‌توانند هم‌زمان اجرا شوند؛ چندین کانال را پیکربندی کنید تا OpenClaw بر اساس هر چت مسیریابی کند.
- سریع‌ترین راه‌اندازی معمولاً **Telegram** است (توکن سادهٔ ربات). WhatsApp به جفت‌سازی QR نیاز دارد و
  وضعیت بیشتری را روی دیسک ذخیره می‌کند.
- رفتار گروه بسته به کانال متفاوت است؛ [گروه‌ها](/fa/channels/groups) را ببینید.
- جفت‌سازی پیام مستقیم و فهرست‌های مجاز برای ایمنی اعمال می‌شوند؛ [امنیت](/fa/gateway/security) را ببینید.
- عیب‌یابی: [عیب‌یابی کانال](/fa/channels/troubleshooting).
- ارائه‌دهندگان مدل جداگانه مستند شده‌اند؛ [ارائه‌دهندگان مدل](/fa/providers/models) را ببینید.
