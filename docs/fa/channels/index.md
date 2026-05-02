---
read_when:
    - می‌خواهید یک کانال گفت‌وگو برای OpenClaw انتخاب کنید
    - به یک مرور سریع از پلتفرم‌های پیام‌رسانی پشتیبانی‌شده نیاز دارید
summary: سکوهای پیام‌رسانی که OpenClaw می‌تواند به آن‌ها متصل شود
title: کانال‌های چت
x-i18n:
    generated_at: "2026-05-02T11:35:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw می‌تواند در هر برنامهٔ چتی که همین حالا استفاده می‌کنید با شما صحبت کند. هر کانال از طریق Gateway متصل می‌شود.
متن در همه‌جا پشتیبانی می‌شود؛ رسانه و واکنش‌ها بسته به کانال متفاوت‌اند.

## نکات تحویل

- پاسخ‌های Telegram که شامل نحو تصویر markdown هستند، مانند `![alt](url)`،
  در صورت امکان در مسیر نهایی خروجی به پاسخ‌های رسانه‌ای تبدیل می‌شوند.
- پیام‌های مستقیم چندنفرهٔ Slack به‌عنوان چت‌های گروهی مسیریابی می‌شوند، بنابراین سیاست گروه، رفتار mention
  و قواعد نشست گروهی برای مکالمات MPIM اعمال می‌شود.
- راه‌اندازی WhatsApp به‌صورت نصب در زمان نیاز است: onboarding می‌تواند پیش از نصب بستهٔ Plugin
  جریان راه‌اندازی را نشان دهد، و Gateway زمان اجرای WhatsApp را
  فقط وقتی کانال واقعاً فعال باشد بارگذاری می‌کند.

## کانال‌های پشتیبانی‌شده

- [BlueBubbles](/fa/channels/bluebubbles) — **توصیه‌شده برای iMessage**؛ از REST API سرور macOS در BlueBubbles با پشتیبانی کامل از قابلیت‌ها استفاده می‌کند (Plugin همراه؛ ویرایش، لغو ارسال، افکت‌ها، واکنش‌ها، مدیریت گروه — ویرایش در حال حاضر روی macOS 26 Tahoe خراب است).
- [Discord](/fa/channels/discord) — Discord Bot API + Gateway؛ از سرورها، کانال‌ها و پیام‌های مستقیم پشتیبانی می‌کند.
- [Feishu](/fa/channels/feishu) — ربات Feishu/Lark از طریق WebSocket (Plugin همراه).
- [Google Chat](/fa/channels/googlechat) — برنامهٔ Google Chat API از طریق HTTP webhook (Plugin قابل دانلود).
- [iMessage (legacy)](/fa/channels/imessage) — یکپارچه‌سازی قدیمی macOS از طریق imsg CLI (منسوخ شده؛ برای راه‌اندازی‌های جدید از BlueBubbles استفاده کنید).
- [IRC](/fa/channels/irc) — سرورهای کلاسیک IRC؛ کانال‌ها + پیام‌های مستقیم با کنترل‌های pairing/allowlist.
- [LINE](/fa/channels/line) — ربات LINE Messaging API (Plugin قابل دانلود).
- [Matrix](/fa/channels/matrix) — پروتکل Matrix (Plugin قابل دانلود).
- [Mattermost](/fa/channels/mattermost) — Bot API + WebSocket؛ کانال‌ها، گروه‌ها، پیام‌های مستقیم (Plugin قابل دانلود).
- [Microsoft Teams](/fa/channels/msteams) — Bot Framework؛ پشتیبانی سازمانی (Plugin همراه).
- [Nextcloud Talk](/fa/channels/nextcloud-talk) — چت خودمیزبان از طریق Nextcloud Talk (Plugin همراه).
- [Nostr](/fa/channels/nostr) — پیام‌های مستقیم غیرمتمرکز از طریق NIP-04 (Plugin همراه).
- [QQ Bot](/fa/channels/qqbot) — QQ Bot API؛ چت خصوصی، چت گروهی و رسانهٔ غنی (Plugin همراه).
- [Signal](/fa/channels/signal) — signal-cli؛ با تمرکز بر حریم خصوصی.
- [Slack](/fa/channels/slack) — Bolt SDK؛ برنامه‌های workspace.
- [Synology Chat](/fa/channels/synology-chat) — Synology NAS Chat از طریق webhookهای خروجی+ورودی (Plugin همراه).
- [Telegram](/fa/channels/telegram) — Bot API از طریق grammY؛ از گروه‌ها پشتیبانی می‌کند.
- [Tlon](/fa/channels/tlon) — پیام‌رسان مبتنی بر Urbit (Plugin همراه).
- [Twitch](/fa/channels/twitch) — چت Twitch از طریق اتصال IRC (Plugin همراه).
- [Voice Call](/fa/plugins/voice-call) — تلفن از طریق Plivo یا Twilio (Plugin، جداگانه نصب می‌شود).
- [WebChat](/fa/web/webchat) — رابط کاربری WebChat متعلق به Gateway روی WebSocket.
- [WeChat](/fa/channels/wechat) — Plugin ربات Tencent iLink از طریق ورود با QR؛ فقط چت‌های خصوصی (Plugin خارجی).
- [WhatsApp](/fa/channels/whatsapp) — محبوب‌ترین؛ از Baileys استفاده می‌کند و به QR pairing نیاز دارد.
- [Yuanbao](/fa/channels/yuanbao) — ربات Tencent Yuanbao (Plugin خارجی).
- [Zalo](/fa/channels/zalo) — Zalo Bot API؛ پیام‌رسان محبوب ویتنام (Plugin همراه).
- [Zalo Personal](/fa/channels/zalouser) — حساب شخصی Zalo از طریق ورود با QR (Plugin همراه).

## یادداشت‌ها

- کانال‌ها می‌توانند هم‌زمان اجرا شوند؛ چند مورد را پیکربندی کنید و OpenClaw بر اساس هر چت مسیریابی می‌کند.
- سریع‌ترین راه‌اندازی معمولاً **Telegram** است (توکن سادهٔ ربات). WhatsApp به QR pairing نیاز دارد و
  وضعیت بیشتری را روی دیسک ذخیره می‌کند.
- رفتار گروه بسته به کانال متفاوت است؛ [گروه‌ها](/fa/channels/groups) را ببینید.
- pairing پیام مستقیم و allowlistها برای ایمنی اعمال می‌شوند؛ [امنیت](/fa/gateway/security) را ببینید.
- عیب‌یابی: [عیب‌یابی کانال](/fa/channels/troubleshooting).
- ارائه‌دهندگان مدل جداگانه مستند شده‌اند؛ [ارائه‌دهندگان مدل](/fa/providers/models) را ببینید.
