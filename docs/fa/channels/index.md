---
read_when:
    - می‌خواهید یک کانال چت برای OpenClaw انتخاب کنید
    - به یک نمای کلی سریع از پلتفرم‌های پیام‌رسانی پشتیبانی‌شده نیاز دارید
summary: پلتفرم‌های پیام‌رسانی که OpenClaw می‌تواند به آن‌ها متصل شود
title: کانال‌های گفت‌وگو
x-i18n:
    generated_at: "2026-05-10T19:22:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57ae81a99d265abbf3f9f016506e787d66b4f6984d833e43e7a8554e157a3c17
    source_path: channels/index.md
    workflow: 16
---

OpenClaw می‌تواند در هر برنامهٔ چتی که همین حالا استفاده می‌کنید با شما صحبت کند. هر کانال از طریق Gateway متصل می‌شود.
متن همه‌جا پشتیبانی می‌شود؛ رسانه و واکنش‌ها بسته به کانال متفاوت‌اند.

## نکات تحویل

- پاسخ‌های Telegram که شامل نحو تصویر در markdown هستند، مانند `![alt](url)`،
  در صورت امکان در مسیر خروجی نهایی به پاسخ‌های رسانه‌ای تبدیل می‌شوند.
- پیام‌های مستقیم چندنفرهٔ Slack به‌عنوان چت‌های گروهی مسیریابی می‌شوند، بنابراین سیاست گروه،
  رفتار اشاره، و قواعد نشست گروهی برای مکالمات MPIM اعمال می‌شود.
- راه‌اندازی WhatsApp به‌صورت نصب در زمان نیاز است: فرایند آغازبه‌کار می‌تواند پیش از
  نصب بستهٔ Plugin، جریان راه‌اندازی را نشان دهد، و Gateway زمان اجرای WhatsApp را
  فقط وقتی کانال واقعاً فعال باشد بارگذاری می‌کند.

## کانال‌های پشتیبانی‌شده

- [Discord](/fa/channels/discord) - Discord Bot API + Gateway؛ از سرورها، کانال‌ها، و پیام‌های مستقیم پشتیبانی می‌کند.
- [Feishu](/fa/channels/feishu) - ربات Feishu/Lark از طریق WebSocket (Plugin همراه).
- [Google Chat](/fa/channels/googlechat) - برنامهٔ Google Chat API از طریق HTTP webhook (Plugin قابل دانلود).
- [iMessage](/fa/channels/imessage) - یکپارچه‌سازی بومی macOS از طریق پل `imsg` روی Mac واردشده به حساب (یا پوشش SSH وقتی Gateway جای دیگری اجرا می‌شود)، شامل اقدام‌های API خصوصی برای پاسخ‌ها، tapbackها، جلوه‌ها، پیوست‌ها، و مدیریت گروه. برای راه‌اندازی‌های جدید iMessage در OpenClaw، وقتی مجوزهای میزبان و دسترسی Messages مناسب باشند، گزینهٔ ترجیحی است.
- [IRC](/fa/channels/irc) - سرورهای کلاسیک IRC؛ کانال‌ها + پیام‌های مستقیم با کنترل‌های جفت‌سازی/فهرست مجاز.
- [LINE](/fa/channels/line) - ربات LINE Messaging API (Plugin قابل دانلود).
- [Matrix](/fa/channels/matrix) - پروتکل Matrix (Plugin قابل دانلود).
- [Mattermost](/fa/channels/mattermost) - Bot API + WebSocket؛ کانال‌ها، گروه‌ها، پیام‌های مستقیم (Plugin قابل دانلود).
- [Microsoft Teams](/fa/channels/msteams) - Bot Framework؛ پشتیبانی سازمانی (Plugin همراه).
- [Nextcloud Talk](/fa/channels/nextcloud-talk) - چت خودمیزبان از طریق Nextcloud Talk (Plugin همراه).
- [Nostr](/fa/channels/nostr) - پیام‌های مستقیم غیرمتمرکز از طریق NIP-04 (Plugin همراه).
- [QQ Bot](/fa/channels/qqbot) - QQ Bot API؛ چت خصوصی، چت گروهی، و رسانهٔ غنی (Plugin همراه).
- [Signal](/fa/channels/signal) - signal-cli؛ متمرکز بر حریم خصوصی.
- [Slack](/fa/channels/slack) - Bolt SDK؛ برنامه‌های فضای کاری.
- [Synology Chat](/fa/channels/synology-chat) - Synology NAS Chat از طریق webhookهای خروجی+ورودی (Plugin همراه).
- [Telegram](/fa/channels/telegram) - Bot API از طریق grammY؛ از گروه‌ها پشتیبانی می‌کند.
- [Tlon](/fa/channels/tlon) - پیام‌رسان مبتنی بر Urbit (Plugin همراه).
- [Twitch](/fa/channels/twitch) - چت Twitch از طریق اتصال IRC (Plugin همراه).
- [Voice Call](/fa/plugins/voice-call) - تلفن از طریق Plivo یا Twilio (Plugin، جداگانه نصب می‌شود).
- [WebChat](/fa/web/webchat) - رابط کاربری WebChatِ Gateway روی WebSocket.
- [WeChat](/fa/channels/wechat) - Plugin ربات Tencent iLink از طریق ورود QR؛ فقط چت‌های خصوصی (Plugin خارجی).
- [WhatsApp](/fa/channels/whatsapp) - محبوب‌ترین؛ از Baileys استفاده می‌کند و به جفت‌سازی QR نیاز دارد.
- [Yuanbao](/fa/channels/yuanbao) - ربات Tencent Yuanbao (Plugin خارجی).
- [Zalo](/fa/channels/zalo) - Zalo Bot API؛ پیام‌رسان محبوب ویتنام (Plugin همراه).
- [Zalo Personal](/fa/channels/zalouser) - حساب شخصی Zalo از طریق ورود QR (Plugin همراه).

## یادداشت‌ها

- کانال‌ها می‌توانند هم‌زمان اجرا شوند؛ چند کانال را پیکربندی کنید تا OpenClaw بر اساس هر چت مسیریابی کند.
- سریع‌ترین راه‌اندازی معمولاً **Telegram** است (توکن سادهٔ ربات). WhatsApp به جفت‌سازی QR نیاز دارد و
  وضعیت بیشتری را روی دیسک ذخیره می‌کند.
- رفتار گروه بسته به کانال متفاوت است؛ [گروه‌ها](/fa/channels/groups) را ببینید.
- جفت‌سازی پیام مستقیم و فهرست‌های مجاز برای ایمنی اعمال می‌شوند؛ [امنیت](/fa/gateway/security) را ببینید.
- عیب‌یابی: [عیب‌یابی کانال](/fa/channels/troubleshooting).
- ارائه‌دهندگان مدل جداگانه مستندسازی شده‌اند؛ [ارائه‌دهندگان مدل](/fa/providers/models) را ببینید.
