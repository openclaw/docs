---
read_when:
    - کار روی ویژگی‌های کانال Nextcloud Talk
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-10T19:23:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4b3b2d074cc8d3c19223dbb0c306c6861717d0f35e638e3aab04b03647fd248
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

وضعیت: Plugin همراه (ربات Webhook). پیام‌های مستقیم، اتاق‌ها، واکنش‌ها و پیام‌های markdown پشتیبانی می‌شوند.

## Plugin همراه

Nextcloud Talk در نسخه‌های فعلی OpenClaw به‌عنوان یک Plugin همراه عرضه می‌شود، بنابراین
بیلدهای بسته‌بندی‌شده معمولی به نصب جداگانه نیاز ندارند.

اگر از بیلد قدیمی‌تر یا نصب سفارشی‌ای استفاده می‌کنید که Nextcloud Talk را مستثنا کرده است،
بسته npm را مستقیما نصب کنید:

نصب از طریق CLI (رجیستری npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

از بسته بدون نسخه مشخص استفاده کنید تا از تگ انتشار رسمی فعلی پیروی کند. فقط زمانی یک
نسخه دقیق را pin کنید که به نصب قابل بازتولید نیاز دارید.

checkout محلی (هنگام اجرا از یک repo گیت):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

جزئیات: [Plugins](/fa/tools/plugin)

## راه‌اندازی سریع (مبتدی)

1. مطمئن شوید Plugin مربوط به Nextcloud Talk در دسترس است.
   - نسخه‌های بسته‌بندی‌شده فعلی OpenClaw از قبل آن را همراه دارند.
   - نصب‌های قدیمی‌تر/سفارشی می‌توانند آن را با دستورهای بالا به‌صورت دستی اضافه کنند.
2. روی سرور Nextcloud خود، یک ربات بسازید:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

3. ربات را در تنظیمات اتاق هدف فعال کنید.
4. OpenClaw را پیکربندی کنید:
   - پیکربندی: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - یا env: `NEXTCLOUD_TALK_BOT_SECRET` (فقط حساب پیش‌فرض)

   راه‌اندازی CLI:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   فیلدهای صریح معادل:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   secret مبتنی بر فایل:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Gateway را دوباره راه‌اندازی کنید (یا راه‌اندازی را تمام کنید).

پیکربندی حداقلی:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## یادداشت‌ها

- ربات‌ها نمی‌توانند آغازگر DM باشند. کاربر باید ابتدا به ربات پیام بدهد.
- URL مربوط به Webhook باید برای Gateway قابل دسترسی باشد؛ اگر پشت proxy هستید `webhookPublicUrl` را تنظیم کنید.
- بارگذاری‌های رسانه توسط API ربات پشتیبانی نمی‌شوند؛ رسانه به‌صورت URL ارسال می‌شود.
- payload مربوط به Webhook بین DM و اتاق تمایز قائل نمی‌شود؛ برای فعال‌کردن lookup نوع اتاق، `apiUser` + `apiPassword` را تنظیم کنید (در غیر این صورت DMها به‌عنوان اتاق در نظر گرفته می‌شوند).

## کنترل دسترسی (DMها)

- پیش‌فرض: `channels.nextcloud-talk.dmPolicy = "pairing"`. فرستنده‌های ناشناس یک کد pairing دریافت می‌کنند.
- تأیید از طریق:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DMهای عمومی: `channels.nextcloud-talk.dmPolicy="open"` به‌همراه `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` فقط با شناسه‌های کاربری Nextcloud مطابقت داده می‌شود؛ نام‌های نمایشی نادیده گرفته می‌شوند.

## اتاق‌ها (گروه‌ها)

- پیش‌فرض: `channels.nextcloud-talk.groupPolicy = "allowlist"` (وابسته به mention).
- اتاق‌ها را با `channels.nextcloud-talk.rooms` در allowlist قرار دهید:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- برای مجاز نکردن هیچ اتاقی، allowlist را خالی نگه دارید یا `channels.nextcloud-talk.groupPolicy="disabled"` را تنظیم کنید.

## قابلیت‌ها

| قابلیت         | وضعیت        |
| --------------- | ------------- |
| پیام‌های مستقیم | پشتیبانی می‌شود     |
| اتاق‌ها           | پشتیبانی می‌شود     |
| رشته‌ها         | پشتیبانی نمی‌شود |
| رسانه           | فقط URL      |
| واکنش‌ها       | پشتیبانی می‌شود     |
| دستورهای بومی | پشتیبانی نمی‌شود |

## مرجع پیکربندی (Nextcloud Talk)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های provider:

- `channels.nextcloud-talk.enabled`: فعال/غیرفعال کردن شروع channel.
- `channels.nextcloud-talk.baseUrl`: URL نمونه Nextcloud.
- `channels.nextcloud-talk.botSecret`: secret مشترک ربات.
- `channels.nextcloud-talk.botSecretFile`: مسیر secret از نوع فایل معمولی. symlinkها رد می‌شوند.
- `channels.nextcloud-talk.apiUser`: کاربر API برای lookup اتاق‌ها (تشخیص DM).
- `channels.nextcloud-talk.apiPassword`: گذرواژه API/app برای lookup اتاق‌ها.
- `channels.nextcloud-talk.apiPasswordFile`: مسیر فایل گذرواژه API.
- `channels.nextcloud-talk.webhookPort`: پورت listener مربوط به Webhook (پیش‌فرض: 8788).
- `channels.nextcloud-talk.webhookHost`: میزبان Webhook (پیش‌فرض: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: مسیر Webhook (پیش‌فرض: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL مربوط به Webhook که از بیرون قابل دسترسی است.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist مربوط به DM (شناسه‌های کاربر). `open` به `"*"` نیاز دارد.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist گروه (شناسه‌های کاربر).
- `channels.nextcloud-talk.rooms`: تنظیمات و allowlist برای هر اتاق.
- گروه‌های دسترسی static فرستنده را می‌توان با `accessGroup:<name>` از `allowFrom` و `groupAllowFrom` ارجاع داد.
- `channels.nextcloud-talk.historyLimit`: محدودیت تاریخچه گروه (0 غیرفعال می‌کند).
- `channels.nextcloud-talk.dmHistoryLimit`: محدودیت تاریخچه DM (0 غیرفعال می‌کند).
- `channels.nextcloud-talk.dms`: overrideهای هر DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: اندازه قطعه متن خروجی (نویسه‌ها).
- `channels.nextcloud-talk.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم روی خط‌های خالی (مرزهای پاراگراف) پیش از قطعه‌بندی بر اساس طول.
- `channels.nextcloud-talk.blockStreaming`: غیرفعال کردن streaming بلوکی برای این channel.
- `channels.nextcloud-talk.blockStreamingCoalesce`: تنظیم coalesce برای streaming بلوکی.
- `channels.nextcloud-talk.mediaMaxMb`: سقف رسانه ورودی (MB).

## مرتبط

- [نمای کلی Channels](/fa/channels) — همه channelهای پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و وابستگی به mention
- [مسیریابی Channel](/fa/channels/channel-routing) — مسیریابی session برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و مقاوم‌سازی
