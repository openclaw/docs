---
read_when:
    - می‌خواهید یک کانال چت برای OpenClaw انتخاب کنید
    - به یک مرور سریع از پلتفرم‌های پیام‌رسانی پشتیبانی‌شده نیاز دارید
summary: سکوهای پیام‌رسانی که OpenClaw می‌تواند به آن‌ها متصل شود
title: کانال‌های چت
x-i18n:
    generated_at: "2026-04-29T22:26:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw می‌تواند در هر برنامهٔ گفتگویی که همین حالا استفاده می‌کنید با شما صحبت کند. هر کانال از طریق Gateway متصل می‌شود.
متن در همه‌جا پشتیبانی می‌شود؛ رسانه و واکنش‌ها بسته به کانال متفاوت‌اند.

## نکات تحویل

- پاسخ‌های Telegram که شامل نحو تصویر در markdown هستند، مانند `![alt](url)`،
  در صورت امکان در مسیر خروجی نهایی به پاسخ‌های رسانه‌ای تبدیل می‌شوند.
- پیام‌های مستقیم چندنفرهٔ Slack به‌عنوان گفتگوهای گروهی مسیریابی می‌شوند، بنابراین سیاست گروه، رفتار mention
  و قوانین نشست گروهی برای گفتگوهای MPIM اعمال می‌شوند.
- راه‌اندازی WhatsApp به‌صورت نصب هنگام نیاز است: onboarding می‌تواند پیش از آماده‌سازی
  وابستگی‌های زمان اجرای Baileys جریان راه‌اندازی را نشان دهد، و Gateway زمان اجرای WhatsApp
  را فقط وقتی بارگذاری می‌کند که کانال واقعاً فعال باشد.

## کانال‌های پشتیبانی‌شده

- [BlueBubbles](/fa/channels/bluebubbles) — **توصیه‌شده برای iMessage**؛ از REST API سرور BlueBubbles macOS با پشتیبانی کامل از قابلیت‌ها استفاده می‌کند (Plugin همراه؛ ویرایش، لغو ارسال، افکت‌ها، واکنش‌ها، مدیریت گروه — ویرایش در حال حاضر روی macOS 26 Tahoe خراب است).
- [Discord](/fa/channels/discord) — API ربات Discord + Gateway؛ از سرورها، کانال‌ها و DMها پشتیبانی می‌کند.
- [Feishu](/fa/channels/feishu) — ربات Feishu/Lark از طریق WebSocket (Plugin همراه).
- [Google Chat](/fa/channels/googlechat) — برنامهٔ Google Chat API از طریق Webhook HTTP.
- [iMessage (legacy)](/fa/channels/imessage) — یکپارچه‌سازی قدیمی macOS از طریق imsg CLI (منسوخ شده، برای راه‌اندازی‌های جدید از BlueBubbles استفاده کنید).
- [IRC](/fa/channels/irc) — سرورهای کلاسیک IRC؛ کانال‌ها + DMها با کنترل‌های pairing/allowlist.
- [LINE](/fa/channels/line) — ربات LINE Messaging API (Plugin همراه).
- [Matrix](/fa/channels/matrix) — پروتکل Matrix (Plugin همراه).
- [Mattermost](/fa/channels/mattermost) — Bot API + WebSocket؛ کانال‌ها، گروه‌ها، DMها (Plugin همراه).
- [Microsoft Teams](/fa/channels/msteams) — Bot Framework؛ پشتیبانی سازمانی (Plugin همراه).
- [Nextcloud Talk](/fa/channels/nextcloud-talk) — گفتگوی خودمیزبان از طریق Nextcloud Talk (Plugin همراه).
- [Nostr](/fa/channels/nostr) — DMهای غیرمتمرکز از طریق NIP-04 (Plugin همراه).
- [QQ Bot](/fa/channels/qqbot) — QQ Bot API؛ گفتگوی خصوصی، گفتگوی گروهی و رسانهٔ غنی (Plugin همراه).
- [Signal](/fa/channels/signal) — signal-cli؛ متمرکز بر حریم خصوصی.
- [Slack](/fa/channels/slack) — Bolt SDK؛ برنامه‌های workspace.
- [Synology Chat](/fa/channels/synology-chat) — Synology NAS Chat از طریق Webhookهای outgoing+incoming (Plugin همراه).
- [Telegram](/fa/channels/telegram) — Bot API از طریق grammY؛ از گروه‌ها پشتیبانی می‌کند.
- [Tlon](/fa/channels/tlon) — پیام‌رسان مبتنی بر Urbit (Plugin همراه).
- [Twitch](/fa/channels/twitch) — گفتگوی Twitch از طریق اتصال IRC (Plugin همراه).
- [Voice Call](/fa/plugins/voice-call) — تلفن از طریق Plivo یا Twilio (Plugin، جداگانه نصب می‌شود).
- [WebChat](/fa/web/webchat) — رابط کاربری WebChat در Gateway از طریق WebSocket.
- [WeChat](/fa/channels/wechat) — Plugin ربات Tencent iLink از طریق ورود با QR؛ فقط گفتگوهای خصوصی (Plugin خارجی).
- [WhatsApp](/fa/channels/whatsapp) — محبوب‌ترین؛ از Baileys استفاده می‌کند و به pairing با QR نیاز دارد.
- [Yuanbao](/fa/channels/yuanbao) — ربات Tencent Yuanbao (Plugin خارجی).
- [Zalo](/fa/channels/zalo) — Zalo Bot API؛ پیام‌رسان محبوب ویتنام (Plugin همراه).
- [Zalo Personal](/fa/channels/zalouser) — حساب شخصی Zalo از طریق ورود با QR (Plugin همراه).

## یادداشت‌ها

- کانال‌ها می‌توانند هم‌زمان اجرا شوند؛ چند مورد را پیکربندی کنید و OpenClaw براساس هر گفتگو مسیریابی می‌کند.
- سریع‌ترین راه‌اندازی معمولاً **Telegram** است (توکن سادهٔ ربات). WhatsApp به pairing با QR نیاز دارد و
  وضعیت بیشتری را روی دیسک ذخیره می‌کند.
- رفتار گروه بسته به کانال متفاوت است؛ [گروه‌ها](/fa/channels/groups) را ببینید.
- pairing و allowlist برای DMها جهت ایمنی اعمال می‌شوند؛ [امنیت](/fa/gateway/security) را ببینید.
- عیب‌یابی: [عیب‌یابی کانال](/fa/channels/troubleshooting).
- ارائه‌دهندگان مدل جداگانه مستند شده‌اند؛ [ارائه‌دهندگان مدل](/fa/providers/models) را ببینید.
