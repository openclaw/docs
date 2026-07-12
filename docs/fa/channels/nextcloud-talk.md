---
read_when:
    - کار روی قابلیت‌های کانال Nextcloud Talk
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-12T09:34:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk یک Plugin کانال قابل دانلود (`@openclaw/nextcloud-talk`) است که OpenClaw را از طریق یک ربات Webhook در Talk به یک نمونهٔ Nextcloud میزبانی‌شده توسط خودتان متصل می‌کند. پیام‌های مستقیم، اتاق‌ها، واکنش‌ها و پیام‌های markdown پشتیبانی می‌شوند؛ رسانه‌ها به‌صورت URL ارسال می‌شوند.

## نصب

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

برای دنبال‌کردن برچسب انتشار رسمی فعلی، از مشخصات سادهٔ بسته استفاده کنید. فقط زمانی یک نسخهٔ دقیق را ثابت کنید که به نصب تکرارپذیر نیاز دارید.

از یک کپی محلی مخزن (گردش‌کارهای توسعه):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

پس از نصب، Gateway را راه‌اندازی مجدد کنید. جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع (مبتدی)

1. Plugin را نصب کنید (بالا).
2. در سرور Nextcloud خود، یک ربات ایجاد کنید:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   گزینهٔ `--feature response` را نگه دارید: بدون آن، پاسخ‌های خروجی با خطای 401 ناموفق می‌شوند. یک ربات موجود را با `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1` اصلاح کنید.

3. ربات را در تنظیمات اتاق هدف فعال کنید.
4. OpenClaw را پیکربندی کنید:
   - پیکربندی: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - یا متغیر محیطی: `NEXTCLOUD_TALK_BOT_SECRET` (فقط حساب پیش‌فرض)

   راه‌اندازی CLI (`--url`/`--token` نام‌های مستعار فیلدهای صریح هستند؛ `nc-talk` و `nc` نیز به‌عنوان نام مستعار کانال کار می‌کنند):

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

   راز مبتنی بر فایل:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Gateway را راه‌اندازی مجدد کنید (یا راه‌اندازی را به پایان برسانید).

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

- ربات‌ها نمی‌توانند پیام مستقیم را آغاز کنند. کاربر باید ابتدا به ربات پیام بدهد.
- URL مربوط به Webhook باید از سرور Nextcloud قابل دسترسی باشد؛ وقتی Gateway پشت پراکسی قرار دارد، `webhookPublicUrl` را تنظیم کنید. درخواست‌های Webhook با استفاده از راز ربات و HMAC-SHA256 امضا می‌شوند؛ امضاهای نامعتبر رد شده و نرخ آن‌ها محدود می‌شود.
- بارگذاری رسانه توسط API ربات پشتیبانی نمی‌شود؛ رسانهٔ خروجی به‌صورت خط `Attachment: <url>` افزوده می‌شود.
- بار دادهٔ Webhook پیام‌های مستقیم را از اتاق‌ها متمایز نمی‌کند؛ برای فعال‌کردن جست‌وجوی نوع اتاق، `apiUser` + `apiPassword` را تنظیم کنید (حدود ۵ دقیقه در حافظهٔ نهان می‌ماند). بدون آن‌ها، هر گفت‌وگو به‌عنوان اتاق در نظر گرفته می‌شود.
- درخواست‌های خروجی از محافظ SSRF عبور می‌کنند. برای میزبان Nextcloud در یک شبکهٔ خصوصی/داخلی مورد اعتماد، با `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true` صراحتاً اجازه دهید.
- با تنظیم `apiUser`/`apiPassword` و `webhookPublicUrl`، دستور `openclaw channels status` ربات را بررسی می‌کند و در صورت نبود قابلیت `response` هشدار می‌دهد.

## کنترل دسترسی (پیام‌های مستقیم)

- پیش‌فرض: `channels.nextcloud-talk.dmPolicy = "pairing"`. فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند.
- تأیید از طریق:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- پیام‌های مستقیم عمومی: `channels.nextcloud-talk.dmPolicy="open"` به‌همراه `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` فقط با شناسه‌های کاربری Nextcloud تطبیق داده می‌شود (با حروف کوچک)؛ نام‌های نمایشی نادیده گرفته می‌شوند.

## اتاق‌ها (گروه‌ها)

- پیش‌فرض: `channels.nextcloud-talk.groupPolicy = "allowlist"` (مشروط به اشاره).
- اتاق‌ها را با `channels.nextcloud-talk.rooms` در فهرست مجاز قرار دهید که کلید آن توکن اتاق است؛ `"*"` یک پیش‌فرض عام تنظیم می‌کند:

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

- کلیدهای هر اتاق: `requireMention` (پیش‌فرض true)، `enabled` (false اتاق را غیرفعال می‌کند)، `allowFrom` (فهرست مجاز فرستندگان همان اتاق)، `tools` (بازنویسی‌های مجاز/غیرمجاز ابزارها)، `skills` (محدودکردن Skills بارگذاری‌شده)، `systemPrompt`.
- برای مجازنکردن هیچ اتاقی، فهرست مجاز را خالی نگه دارید یا `channels.nextcloud-talk.groupPolicy="disabled"` را تنظیم کنید.

## قابلیت‌ها

| قابلیت            | وضعیت               |
| ----------------- | ------------------- |
| پیام‌های مستقیم   | پشتیبانی می‌شود     |
| اتاق‌ها            | پشتیبانی می‌شود     |
| رشته‌ها            | پشتیبانی نمی‌شود    |
| رسانه              | فقط URL             |
| واکنش‌ها           | پشتیبانی می‌شود     |
| فرمان‌های بومی     | پشتیبانی نمی‌شود    |

## مرجع پیکربندی (Nextcloud Talk)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های ارائه‌دهنده:

- `channels.nextcloud-talk.enabled`: فعال/غیرفعال‌کردن راه‌اندازی کانال.
- `channels.nextcloud-talk.baseUrl`: URL نمونهٔ Nextcloud.
- `channels.nextcloud-talk.botSecret`: راز مشترک ربات (رشته یا ارجاع راز).
- `channels.nextcloud-talk.botSecretFile`: مسیر فایل معمولی راز. پیوندهای نمادین رد می‌شوند.
- `channels.nextcloud-talk.apiUser`: کاربر API برای جست‌وجوی اتاق‌ها (تشخیص پیام مستقیم) و بررسی وضعیت.
- `channels.nextcloud-talk.apiPassword`: گذرواژهٔ API/برنامه برای جست‌وجوی اتاق‌ها.
- `channels.nextcloud-talk.apiPasswordFile`: مسیر فایل گذرواژهٔ API.
- `channels.nextcloud-talk.webhookPort`: درگاه شنوندهٔ Webhook (پیش‌فرض: 8788).
- `channels.nextcloud-talk.webhookHost`: میزبان Webhook (پیش‌فرض: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: مسیر Webhook (پیش‌فرض: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL مربوط به Webhook که از بیرون قابل دسترسی است.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing). مقدار `open` به `allowFrom=["*"]` نیاز دارد.
- `channels.nextcloud-talk.allowFrom`: فهرست مجاز پیام مستقیم (شناسه‌های کاربری).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (پیش‌فرض: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: فهرست مجاز فرستندگان اتاق (شناسه‌های کاربری)؛ اگر تنظیم نشده باشد، از `allowFrom` استفاده می‌کند.
- `channels.nextcloud-talk.rooms`: تنظیمات و فهرست مجاز هر اتاق (بالا را ببینید).
- گروه‌های دسترسی ایستای فرستندگان را می‌توان از `allowFrom` و `groupAllowFrom` با `accessGroup:<name>` ارجاع داد.
- `channels.nextcloud-talk.historyLimit`: محدودیت تاریخچهٔ گروه (0 آن را غیرفعال می‌کند).
- `channels.nextcloud-talk.dmHistoryLimit`: محدودیت تاریخچهٔ پیام مستقیم (0 آن را غیرفعال می‌کند).
- `channels.nextcloud-talk.dms`: بازنویسی‌های هر پیام مستقیم با کلید شناسهٔ کاربری (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: اندازهٔ قطعهٔ متن خروجی برحسب نویسه (پیش‌فرض: 4000).
- `channels.nextcloud-talk.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم در خطوط خالی (مرز پاراگراف‌ها) پیش از قطعه‌بندی براساس طول.
- `channels.nextcloud-talk.blockStreaming`: غیرفعال‌کردن پخش جریانی بلوکی برای این کانال.
- `channels.nextcloud-talk.blockStreamingCoalesce`: تنظیم ادغام پخش جریانی بلوکی.
- `channels.nextcloud-talk.responsePrefix`: پیشوند پاسخ خروجی.
- `channels.nextcloud-talk.markdown.tables`: حالت رندر جدول markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: سقف رسانهٔ ورودی (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: عبور میزبان‌های خصوصی/داخلی Nextcloud از محافظ SSRF را مجاز می‌کند.
- `channels.nextcloud-talk.accounts.<id>`: بازنویسی‌های هر حساب (همان کلیدها)؛ `defaultAccount` حساب پیش‌فرض را انتخاب می‌کند. متغیرهای محیطی `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` فقط بر حساب پیش‌فرض اعمال می‌شوند.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و الزام اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و مقاوم‌سازی
