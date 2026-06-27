---
read_when:
    - می‌خواهید یک کانال چت برای OpenClaw انتخاب کنید
    - به یک نمای کلی سریع از پلتفرم‌های پیام‌رسانی پشتیبانی‌شده نیاز دارید
summary: پلتفرم‌های پیام‌رسانی که OpenClaw می‌تواند به آن‌ها متصل شود
title: کانال‌های چت
x-i18n:
    generated_at: "2026-06-27T17:11:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw می‌تواند در هر برنامهٔ چتی که از قبل استفاده می‌کنید با شما گفتگو کند. هر کانال از طریق Gateway متصل می‌شود.
متن همه‌جا پشتیبانی می‌شود؛ رسانه و واکنش‌ها بسته به کانال متفاوت‌اند.

## نکات تحویل

- پاسخ‌های Telegram که شامل نحو تصویر markdown هستند، مانند `![alt](url)`،
  در صورت امکان در مسیر نهایی خروجی به پاسخ‌های رسانه‌ای تبدیل می‌شوند.
- پیام‌های مستقیم چندنفرهٔ Slack به‌صورت چت‌های گروهی مسیریابی می‌شوند، بنابراین سیاست گروه،
  رفتار اشاره، و قواعد نشست گروهی برای گفتگوهای MPIM اعمال می‌شوند.
- راه‌اندازی WhatsApp نصب هنگام نیاز است: راه‌اندازی اولیه می‌تواند پیش از
  نصب بستهٔ Plugin جریان راه‌اندازی را نشان دهد، و Gateway فقط وقتی کانال واقعاً فعال است
  Plugin خارجی ClawHub/npm را بارگذاری می‌کند.
- کانال‌هایی که پیام‌های ورودی نوشته‌شده توسط بات را می‌پذیرند می‌توانند از
  [محافظت در برابر حلقهٔ بات](/fa/channels/bot-loop-protection) مشترک استفاده کنند تا از
  پاسخ‌دادن بی‌پایان جفت‌های بات به یکدیگر جلوگیری شود.
- اتاق‌های همیشه‌روشنِ پشتیبانی‌شده می‌توانند از [رویدادهای محیطی اتاق](/fa/channels/ambient-room-events)
  استفاده کنند تا گفتگوی اشاره‌نشدهٔ اتاق، زمینه‌ای آرام شود مگر اینکه عامل با
  ابزار `message` ارسال کند.

## کانال‌های پشتیبانی‌شده

- [Discord](/fa/channels/discord) - Discord Bot API + Gateway؛ از سرورها، کانال‌ها و پیام‌های مستقیم پشتیبانی می‌کند.
- [Feishu](/fa/channels/feishu) - بات Feishu/Lark از طریق WebSocket (Plugin همراه).
- [Google Chat](/fa/channels/googlechat) - برنامهٔ Google Chat API از طریق HTTP webhook (Plugin قابل دانلود).
- [iMessage](/fa/channels/imessage) - یکپارچه‌سازی بومی macOS از طریق پل `imsg` روی یک Mac واردشده به حساب (یا پوشش SSH وقتی Gateway جای دیگری اجرا می‌شود)، شامل کنش‌های API خصوصی برای پاسخ‌ها، tapbackها، افکت‌ها، پیوست‌ها، و مدیریت گروه. برای راه‌اندازی‌های جدید iMessage در OpenClaw ترجیح داده می‌شود، وقتی مجوزهای میزبان و دسترسی Messages مناسب باشد.
- [IRC](/fa/channels/irc) - سرورهای کلاسیک IRC؛ کانال‌ها + پیام‌های مستقیم با کنترل‌های جفت‌سازی/فهرست مجاز.
- [LINE](/fa/channels/line) - بات LINE Messaging API (Plugin قابل دانلود).
- [Matrix](/fa/channels/matrix) - پروتکل Matrix (Plugin قابل دانلود).
- [Mattermost](/fa/channels/mattermost) - Bot API + WebSocket؛ کانال‌ها، گروه‌ها، پیام‌های مستقیم (Plugin قابل دانلود).
- [Microsoft Teams](/fa/channels/msteams) - Bot Framework؛ پشتیبانی سازمانی (Plugin همراه).
- [Nextcloud Talk](/fa/channels/nextcloud-talk) - چت خودمیزبان از طریق Nextcloud Talk (Plugin همراه).
- [Nostr](/fa/channels/nostr) - پیام‌های مستقیم غیرمتمرکز از طریق NIP-04 (Plugin همراه).
- [QQ Bot](/fa/channels/qqbot) - QQ Bot API؛ چت خصوصی، چت گروهی، و رسانهٔ غنی (Plugin همراه).
- [Raft](/fa/channels/raft) - پل بیدارسازی Raft CLI برای همکاری انسان و عامل (Plugin خارجی).
- [Signal](/fa/channels/signal) - signal-cli؛ متمرکز بر حریم خصوصی.
- [Slack](/fa/channels/slack) - Bolt SDK؛ برنامه‌های فضای کاری.
- [SMS](/fa/channels/sms) - SMS مبتنی بر Twilio از طریق Gateway webhook (Plugin رسمی).
- [Synology Chat](/fa/channels/synology-chat) - Synology NAS Chat از طریق webhookهای خروجی+ورودی (Plugin همراه).
- [Telegram](/fa/channels/telegram) - Bot API از طریق grammY؛ از گروه‌ها پشتیبانی می‌کند.
- [Tlon](/fa/channels/tlon) - پیام‌رسان مبتنی بر Urbit (Plugin همراه).
- [Twitch](/fa/channels/twitch) - چت Twitch از طریق اتصال IRC (Plugin همراه).
- [تماس صوتی](/fa/plugins/voice-call) - تلفن از طریق Plivo یا Twilio (Plugin، جداگانه نصب می‌شود).
- [WebChat](/fa/web/webchat) - رابط کاربری Gateway WebChat روی WebSocket.
- [WeChat](/fa/channels/wechat) - Plugin بات Tencent iLink از طریق ورود با QR؛ فقط چت‌های خصوصی (Plugin خارجی).
- [WhatsApp](/fa/channels/whatsapp) - محبوب‌ترین؛ از Baileys استفاده می‌کند و به جفت‌سازی QR نیاز دارد.
- [Yuanbao](/fa/channels/yuanbao) - بات Tencent Yuanbao (Plugin خارجی).
- [Zalo](/fa/channels/zalo) - Zalo Bot API؛ پیام‌رسان محبوب ویتنام (Plugin همراه).
- [Zalo ClawBot](/fa/channels/zaloclawbot) - دستیار شخصی Zalo از طریق ورود با QR؛ وابسته به مالک (Plugin خارجی).
- [Zalo Personal](/fa/channels/zalouser) - حساب شخصی Zalo از طریق ورود با QR (Plugin همراه).

## یادداشت‌ها

- کانال‌ها می‌توانند هم‌زمان اجرا شوند؛ چند مورد را پیکربندی کنید و OpenClaw بر اساس هر چت مسیریابی می‌کند.
- سریع‌ترین راه‌اندازی معمولاً **Telegram** است (توکن سادهٔ بات). WhatsApp به جفت‌سازی QR نیاز دارد و
  وضعیت بیشتری را روی دیسک ذخیره می‌کند.
- رفتار گروه بسته به کانال متفاوت است؛ [گروه‌ها](/fa/channels/groups) را ببینید.
- جفت‌سازی پیام مستقیم و فهرست‌های مجاز برای ایمنی اعمال می‌شوند؛ [امنیت](/fa/gateway/security) را ببینید.
- عیب‌یابی: [عیب‌یابی کانال](/fa/channels/troubleshooting).
- ارائه‌دهندگان مدل جداگانه مستند شده‌اند؛ [ارائه‌دهندگان مدل](/fa/providers/models) را ببینید.
