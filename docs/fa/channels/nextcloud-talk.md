---
read_when:
    - کار روی قابلیت‌های کانال Nextcloud Talk
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-29T22:27:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

وضعیت: Plugin همراه (ربات Webhook). پیام‌های مستقیم، اتاق‌ها، واکنش‌ها و پیام‌های markdown پشتیبانی می‌شوند.

## Plugin همراه

Nextcloud Talk در نسخه‌های فعلی OpenClaw به‌صورت Plugin همراه عرضه می‌شود، بنابراین
بیلدهای بسته‌بندی‌شده معمولی به نصب جداگانه نیاز ندارند.

اگر از یک بیلد قدیمی‌تر یا نصب سفارشی استفاده می‌کنید که Nextcloud Talk را شامل نمی‌شود،
وقتی یک بسته npm فعلی منتشر شد، آن را نصب کنید:

نصب از طریق CLI (رجیستری npm، وقتی بسته فعلی وجود داشته باشد):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

اگر npm بسته متعلق به OpenClaw را منسوخ‌شده گزارش کرد، تا زمانی که بسته npm جدیدتری
منتشر شود، از بیلد بسته‌بندی‌شده فعلی OpenClaw یا مسیر checkout محلی استفاده کنید.

checkout محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع (مبتدی)

1. مطمئن شوید Plugin مربوط به Nextcloud Talk در دسترس است.
   - نسخه‌های بسته‌بندی‌شده فعلی OpenClaw از قبل آن را همراه خود دارند.
   - نصب‌های قدیمی‌تر/سفارشی می‌توانند با دستورهای بالا آن را به‌صورت دستی اضافه کنند.
2. در سرور Nextcloud خود، یک ربات بسازید:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. ربات را در تنظیمات اتاق هدف فعال کنید.
4. OpenClaw را پیکربندی کنید:
   - پیکربندی: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - یا متغیر محیطی: `NEXTCLOUD_TALK_BOT_SECRET` (فقط حساب پیش‌فرض)

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

5. Gateway را بازراه‌اندازی کنید (یا راه‌اندازی را کامل کنید).

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

## نکات

- ربات‌ها نمی‌توانند DMها را آغاز کنند. کاربر باید ابتدا به ربات پیام بدهد.
- URL مربوط به Webhook باید برای Gateway قابل دسترسی باشد؛ اگر پشت پراکسی هستید `webhookPublicUrl` را تنظیم کنید.
- بارگذاری رسانه توسط API ربات پشتیبانی نمی‌شود؛ رسانه به‌صورت URL ارسال می‌شود.
- payload مربوط به Webhook بین DMها و اتاق‌ها تمایز قائل نمی‌شود؛ برای فعال کردن جست‌وجوی نوع اتاق، `apiUser` + `apiPassword` را تنظیم کنید (در غیر این صورت DMها به‌عنوان اتاق در نظر گرفته می‌شوند).

## کنترل دسترسی (DMها)

- پیش‌فرض: `channels.nextcloud-talk.dmPolicy = "pairing"`. فرستنده‌های ناشناخته یک کد pairing دریافت می‌کنند.
- تأیید از طریق:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DMهای عمومی: `channels.nextcloud-talk.dmPolicy="open"` به‌همراه `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` فقط با شناسه‌های کاربری Nextcloud تطبیق داده می‌شود؛ نام‌های نمایشی نادیده گرفته می‌شوند.

## اتاق‌ها (گروه‌ها)

- پیش‌فرض: `channels.nextcloud-talk.groupPolicy = "allowlist"` (کنترل‌شده با mention).
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

| قابلیت | وضعیت |
| --------------- | ------------- |
| پیام‌های مستقیم | پشتیبانی می‌شود |
| اتاق‌ها | پشتیبانی می‌شود |
| رشته‌ها | پشتیبانی نمی‌شود |
| رسانه | فقط URL |
| واکنش‌ها | پشتیبانی می‌شود |
| دستورهای بومی | پشتیبانی نمی‌شود |

## مرجع پیکربندی (Nextcloud Talk)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های ارائه‌دهنده:

- `channels.nextcloud-talk.enabled`: فعال/غیرفعال کردن راه‌اندازی کانال.
- `channels.nextcloud-talk.baseUrl`: URL نمونه Nextcloud.
- `channels.nextcloud-talk.botSecret`: secret مشترک ربات.
- `channels.nextcloud-talk.botSecretFile`: مسیر secret در قالب فایل معمولی. symlinkها رد می‌شوند.
- `channels.nextcloud-talk.apiUser`: کاربر API برای جست‌وجوی اتاق‌ها (تشخیص DM).
- `channels.nextcloud-talk.apiPassword`: گذرواژه API/app برای جست‌وجوی اتاق‌ها.
- `channels.nextcloud-talk.apiPasswordFile`: مسیر فایل گذرواژه API.
- `channels.nextcloud-talk.webhookPort`: پورت listener مربوط به Webhook (پیش‌فرض: 8788).
- `channels.nextcloud-talk.webhookHost`: میزبان Webhook (پیش‌فرض: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: مسیر Webhook (پیش‌فرض: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL مربوط به Webhook که از بیرون قابل دسترسی است.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist مربوط به DM (شناسه‌های کاربری). `open` به `"*"` نیاز دارد.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist مربوط به گروه (شناسه‌های کاربری).
- `channels.nextcloud-talk.rooms`: تنظیمات و allowlist هر اتاق.
- `channels.nextcloud-talk.historyLimit`: محدودیت تاریخچه گروه (0 غیرفعال می‌کند).
- `channels.nextcloud-talk.dmHistoryLimit`: محدودیت تاریخچه DM (0 غیرفعال می‌کند).
- `channels.nextcloud-talk.dms`: overrideهای هر DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: اندازه قطعه متن خروجی (نویسه‌ها).
- `channels.nextcloud-talk.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خطوط خالی (مرزهای پاراگراف) قبل از قطعه‌بندی بر اساس طول.
- `channels.nextcloud-talk.blockStreaming`: غیرفعال کردن block streaming برای این کانال.
- `channels.nextcloud-talk.blockStreamingCoalesce`: تنظیمات coalesce برای block streaming.
- `channels.nextcloud-talk.mediaMaxMb`: سقف رسانه ورودی (MB).

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و کنترل mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
