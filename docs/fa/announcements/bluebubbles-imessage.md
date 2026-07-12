---
read_when:
    - شما از کانال قدیمی BlueBubbles استفاده می‌کردید و باید به iMessage مهاجرت کنید
    - شما در حال انتخاب راه‌اندازی پشتیبانی‌شدهٔ iMessage در OpenClaw هستید
    - به توضیح کوتاهی درباره حذف BlueBubbles نیاز دارید
summary: پشتیبانی از BlueBubbles از OpenClaw حذف شده است. برای راه‌اندازی‌های جدید و منتقل‌شدهٔ iMessage، از Plugin همراه iMessage با imsg استفاده کنید.
title: حذف BlueBubbles و مسیر iMessage مبتنی بر imsg
x-i18n:
    generated_at: "2026-07-12T09:31:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# حذف BlueBubbles و مسیر imsg برای iMessage

OpenClaw دیگر کانال BlueBubbles را عرضه نمی‌کند. پشتیبانی از iMessage از طریق Plugin همراه `imessage` انجام می‌شود: Gateway، برنامهٔ [`imsg`](https://github.com/steipete/imsg) را به‌صورت یک فرایند فرزند، در محیط محلی یا از طریق یک پوشش‌دهندهٔ SSH، اجرا می‌کند و با استفاده از JSON-RPC روی stdin/stdout با آن ارتباط برقرار می‌کند. بدون سرور، بدون Webhook و بدون درگاه.

اگر پیکربندی شما همچنان حاوی `channels.bluebubbles` است، آن را به `channels.imessage` منتقل کنید. نشانی قدیمی مستندات `/channels/bluebubbles` به [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) هدایت می‌شود که شامل جدول کامل تبدیل پیکربندی و فهرست بررسی تغییر مسیر است.

## چه چیزهایی تغییر کرده‌اند

- مسیر پشتیبانی‌شدهٔ iMessage فاقد سرور HTTP مربوط به BlueBubbles، مسیر Webhook، گذرواژهٔ REST یا محیط اجرای Plugin مربوط به BlueBubbles است.
- OpenClaw پیام‌ها را از طریق `imsg` روی Macی که در Messages.app به حساب وارد شده است، می‌خواند و پایش می‌کند.
- ارسال، دریافت، تاریخچه و رسانه‌های پایه از رابط‌های عادی `imsg` و مجوزهای macOS استفاده می‌کنند.
- کنش‌های پیشرفته (پاسخ‌های رشته‌ای، واکنش‌ها، ویرایش، لغو ارسال، جلوه‌ها، تأییدیه‌های خواندن، نشانگرهای تایپ و مدیریت گروه) به پل API خصوصی نیاز دارند: دستور `imsg launch` را اجرا کنید که مستلزم غیرفعال بودن SIP است.
- Gatewayهای Linux و Windows همچنان می‌توانند با تنظیم `channels.imessage.cliPath` روی یک پوشش‌دهندهٔ SSH که `imsg` را روی Mac دارای نشست فعال اجرا می‌کند، از iMessage استفاده کنند.

## چه باید کرد

1. `imsg` را روی Mac مربوط به Messages نصب و بررسی کنید:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. مجوزهای Full Disk Access و Automation را به بستر فرایندی که `imsg` و OpenClaw را اجرا می‌کند، اعطا کنید.

3. پیکربندی قدیمی را تبدیل کنید:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Gateway را راه‌اندازی مجدد و بررسی کنید:

   ```bash
   openclaw channels status --probe
   ```

5. پیش از حذف سرور قدیمی BlueBubbles، پیام‌های مستقیم، گروه‌ها، پیوست‌ها و هر کنش API خصوصی مورد استفادهٔ خود را آزمایش کنید.

## نکات مهاجرت

- `channels.bluebubbles.serverUrl` و `channels.bluebubbles.password` در iMessage معادلی ندارند؛ هیچ سروری برای اتصال یا احراز هویت وجود ندارد.
- `allowFrom`، `groupAllowFrom`، `groups`، `includeAttachments`، `attachmentRoots`، `mediaMaxMb`، `textChunkLimit` و `actions.*` در زیر `channels.imessage` معنای خود را حفظ می‌کنند.
- `channels.imessage.includeAttachments` همچنان به‌صورت پیش‌فرض غیرفعال است. اگر انتظار دارید عکس‌های دریافتی، یادداشت‌های صوتی، ویدئوها یا فایل‌ها به عامل برسند، آن را صریحاً تنظیم کنید.
- هنگام استفاده از `groupPolicy: "allowlist"`، بلوک قدیمی `groups`، از جمله هر ورودی عام `"*"`، را کپی کنید. فهرست‌های مجاز فرستندگان گروه و دفتر ثبت گروه دو کنترل جداگانه هستند؛ بلوک `groups` دارای ورودی، اما بدون `chat_id` منطبق (یا بدون `"*"`) پیام را هنگام اجرا حذف می‌کند و بلوک خالی `groups` هنگام راه‌اندازی هشدار ثبت می‌کند، هرچند پالایش فرستنده همچنان اجازهٔ عبور پیام‌ها را می‌دهد.
- اتصال‌های ACP دارای `match.channel: "bluebubbles"` باید به `"imessage"` تغییر کنند.
- کلیدهای نشست قدیمی BlueBubbles به کلیدهای نشست iMessage تبدیل نمی‌شوند. تأییدیه‌های جفت‌سازی بر اساس شناسه‌های فرستنده ثبت می‌شوند، بنابراین ورودی‌های کپی‌شدهٔ `allowFrom` همچنان کار می‌کنند، اما تاریخچهٔ مکالمات مربوط به کلیدهای نشست BlueBubbles منتقل نمی‌شود.

## همچنین ببینید

- [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles)
- [iMessage](/fa/channels/imessage)
- [مرجع پیکربندی - iMessage](/fa/gateway/config-channels#imessage)
