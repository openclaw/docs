---
read_when:
    - کار روی قابلیت‌های Zalo یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Zalo
title: Zalo
x-i18n:
    generated_at: "2026-04-29T22:31:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: e79a4a27accc7f460bd3ae9c01e8f5f80e21a285af5d89b94bb9c89244a4438f
    source_path: channels/zalo.md
    workflow: 16
---

وضعیت: آزمایشی. پیام‌های مستقیم پشتیبانی می‌شوند. بخش [قابلیت‌ها](#capabilities) در پایین، رفتار فعلی بات‌های Marketplace را نشان می‌دهد.

## Plugin همراه

Zalo در نسخه‌های فعلی OpenClaw به‌صورت یک Plugin همراه عرضه می‌شود، بنابراین بیلدهای بسته‌بندی‌شده‌ی معمول به نصب جداگانه نیاز ندارند.

اگر از بیلد قدیمی‌تر یا نصب سفارشی‌ای استفاده می‌کنید که Zalo را شامل نمی‌شود، وقتی یک بسته‌ی npm فعلی منتشر شد آن را نصب کنید:

- نصب از طریق CLI: `openclaw plugins install @openclaw/zalo`
- یا از یک checkout منبع: `openclaw plugins install ./path/to/local/zalo-plugin`
- جزئیات: [Pluginها](/fa/tools/plugin)

اگر npm بسته‌ی متعلق به OpenClaw را منسوخ گزارش کرد، تا زمانی که بسته‌ی npm جدیدتری منتشر شود از یک بیلد بسته‌بندی‌شده‌ی فعلی OpenClaw یا مسیر checkout محلی استفاده کنید.

## راه‌اندازی سریع (مبتدی)

1. مطمئن شوید Plugin مربوط به Zalo در دسترس است.
   - نسخه‌های بسته‌بندی‌شده‌ی فعلی OpenClaw از قبل آن را همراه دارند.
   - نصب‌های قدیمی‌تر/سفارشی می‌توانند با دستورهای بالا آن را دستی اضافه کنند.
2. توکن را تنظیم کنید:
   - Env: `ZALO_BOT_TOKEN=...`
   - یا پیکربندی: `channels.zalo.accounts.default.botToken: "..."`.
3. Gateway را بازراه‌اندازی کنید (یا راه‌اندازی را کامل کنید).
4. دسترسی پیام مستقیم به‌صورت پیش‌فرض با جفت‌سازی است؛ کد جفت‌سازی را در اولین تماس تایید کنید.

پیکربندی حداقلی:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## چیست

Zalo یک برنامه‌ی پیام‌رسان متمرکز بر ویتنام است؛ Bot API آن به Gateway اجازه می‌دهد برای گفتگوهای ۱به‌۱ یک بات اجرا کند.
برای پشتیبانی یا اعلان‌هایی که در آن‌ها مسیریابی قطعی برگشت به Zalo می‌خواهید، گزینه‌ی مناسبی است.

این صفحه رفتار فعلی OpenClaw را برای **Zalo Bot Creator / بات‌های Marketplace** نشان می‌دهد.
**بات‌های Zalo Official Account (OA)** سطح محصول متفاوتی از Zalo هستند و ممکن است رفتار متفاوتی داشته باشند.

- یک کانال Zalo Bot API که مالک آن Gateway است.
- مسیریابی قطعی: پاسخ‌ها به Zalo برمی‌گردند؛ مدل هرگز کانال‌ها را انتخاب نمی‌کند.
- پیام‌های مستقیم نشست اصلی عامل را به اشتراک می‌گذارند.
- بخش [قابلیت‌ها](#capabilities) در پایین پشتیبانی فعلی بات‌های Marketplace را نشان می‌دهد.

## راه‌اندازی (مسیر سریع)

### 1) ایجاد توکن بات (Zalo Bot Platform)

1. به [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) بروید و وارد شوید.
2. یک بات جدید ایجاد کنید و تنظیمات آن را پیکربندی کنید.
3. توکن کامل بات را کپی کنید (معمولا `numeric_id:secret`). برای بات‌های Marketplace، توکن قابل استفاده در زمان اجرا ممکن است پس از ایجاد، در پیام خوشامد بات ظاهر شود.

### 2) پیکربندی توکن (env یا config)

نمونه:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

اگر بعدا به سطحی از بات Zalo منتقل شدید که در آن گروه‌ها در دسترس هستند، می‌توانید پیکربندی مخصوص گروه مانند `groupPolicy` و `groupAllowFrom` را صریحا اضافه کنید. برای رفتار فعلی بات‌های Marketplace، [قابلیت‌ها](#capabilities) را ببینید.

گزینه‌ی Env: `ZALO_BOT_TOKEN=...` (فقط برای حساب پیش‌فرض کار می‌کند).

پشتیبانی چندحسابی: از `channels.zalo.accounts` با توکن‌های جداگانه برای هر حساب و `name` اختیاری استفاده کنید.

3. Gateway را بازراه‌اندازی کنید. Zalo زمانی شروع می‌شود که یک توکن resolve شود (env یا config).
4. دسترسی پیام مستقیم به‌صورت پیش‌فرض با جفت‌سازی است. وقتی برای اولین بار با بات تماس گرفته شد، کد را تایید کنید.

## چگونه کار می‌کند (رفتار)

- پیام‌های ورودی به پاکت کانال مشترک با placeholderهای رسانه‌ای نرمال‌سازی می‌شوند.
- پاسخ‌ها همیشه به همان گفتگوی Zalo برمی‌گردند.
- به‌صورت پیش‌فرض long-polling؛ حالت webhook با `channels.zalo.webhookUrl` در دسترس است.

## محدودیت‌ها

- متن خروجی به بخش‌های ۲۰۰۰ نویسه‌ای تقسیم می‌شود (محدودیت Zalo API).
- دانلود/آپلود رسانه با `channels.zalo.mediaMaxMb` محدود می‌شود (پیش‌فرض ۵).
- Streaming به‌صورت پیش‌فرض مسدود است، چون محدودیت ۲۰۰۰ نویسه، streaming را کمتر مفید می‌کند.

## کنترل دسترسی (پیام‌های مستقیم)

### دسترسی پیام مستقیم

- پیش‌فرض: `channels.zalo.dmPolicy = "pairing"`. فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ پیام‌ها تا زمان تایید نادیده گرفته می‌شوند (کدها پس از ۱ ساعت منقضی می‌شوند).
- تایید از طریق:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- جفت‌سازی، تبادل توکن پیش‌فرض است. جزئیات: [جفت‌سازی](/fa/channels/pairing)
- `channels.zalo.allowFrom` شناسه‌های عددی کاربر را می‌پذیرد (جستجوی نام کاربری در دسترس نیست).

## کنترل دسترسی (گروه‌ها)

برای **Zalo Bot Creator / بات‌های Marketplace**، پشتیبانی گروه در عمل در دسترس نبود، چون بات اصلا نمی‌توانست به یک گروه اضافه شود.

این یعنی کلیدهای پیکربندی مرتبط با گروه در پایین در schema وجود دارند، اما برای بات‌های Marketplace قابل استفاده نبودند:

- `channels.zalo.groupPolicy` پردازش ورودی گروه را کنترل می‌کند: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` محدود می‌کند کدام شناسه‌های فرستنده می‌توانند بات را در گروه‌ها فعال کنند.
- اگر `groupAllowFrom` تنظیم نشده باشد، Zalo برای بررسی فرستنده‌ها به `allowFrom` برمی‌گردد.
- نکته‌ی زمان اجرا: اگر `channels.zalo` کاملا غایب باشد، runtime همچنان برای ایمنی به `groupPolicy="allowlist"` برمی‌گردد.

مقادیر سیاست گروه (وقتی دسترسی گروه روی سطح بات شما در دسترس باشد) عبارت‌اند از:

- `groupPolicy: "disabled"` — همه‌ی پیام‌های گروه را مسدود می‌کند.
- `groupPolicy: "open"` — هر عضو گروه را مجاز می‌کند (با gate مبتنی بر mention).
- `groupPolicy: "allowlist"` — پیش‌فرض fail-closed؛ فقط فرستندگان مجاز پذیرفته می‌شوند.

اگر از سطح محصول متفاوتی برای بات Zalo استفاده می‌کنید و رفتار گروهی کارآمد را تایید کرده‌اید، آن را جداگانه مستند کنید و فرض نکنید با جریان بات Marketplace یکسان است.

## Long-polling در برابر webhook

- پیش‌فرض: long-polling (به URL عمومی نیاز ندارد).
- حالت Webhook: `channels.zalo.webhookUrl` و `channels.zalo.webhookSecret` را تنظیم کنید.
  - secret مربوط به webhook باید ۸ تا ۲۵۶ نویسه باشد.
  - URL مربوط به Webhook باید از HTTPS استفاده کند.
  - Zalo برای راستی‌آزمایی، رویدادها را با header به نام `X-Bot-Api-Secret-Token` ارسال می‌کند.
  - HTTP مربوط به Gateway درخواست‌های webhook را در `channels.zalo.webhookPath` پردازش می‌کند (پیش‌فرض، مسیر URL مربوط به webhook است).
  - درخواست‌ها باید از `Content-Type: application/json` (یا نوع‌های رسانه‌ای `+json`) استفاده کنند.
  - رویدادهای تکراری (`event_name + message_id`) برای یک پنجره‌ی کوتاه replay نادیده گرفته می‌شوند.
  - ترافیک burst به‌ازای هر path/source محدودسازی نرخ می‌شود و ممکن است HTTP 429 برگرداند.

**نکته:** طبق مستندات Zalo API، getUpdates (polling) و webhook برای هر بات متقابلا انحصاری هستند.

## انواع پیام پشتیبانی‌شده

برای یک نمای سریع از پشتیبانی، [قابلیت‌ها](#capabilities) را ببینید. یادداشت‌های پایین در جاهایی که رفتار به زمینه‌ی بیشتری نیاز دارد جزئیات اضافه می‌کنند.

- **پیام‌های متنی**: پشتیبانی کامل با بخش‌بندی ۲۰۰۰ نویسه‌ای.
- **URLهای ساده در متن**: مانند ورودی متنی عادی رفتار می‌کنند.
- **پیش‌نمایش لینک / کارت‌های لینک غنی**: وضعیت بات Marketplace را در [قابلیت‌ها](#capabilities) ببینید؛ آن‌ها پاسخ را به‌طور قابل اتکا trigger نمی‌کردند.
- **پیام‌های تصویری**: وضعیت بات Marketplace را در [قابلیت‌ها](#capabilities) ببینید؛ پردازش تصویر ورودی غیرقابل اتکا بود (نمایشگر تایپ بدون پاسخ نهایی).
- **استیکرها**: وضعیت بات Marketplace را در [قابلیت‌ها](#capabilities) ببینید.
- **یادداشت‌های صوتی / فایل‌های صوتی / ویدیو / پیوست‌های فایل عمومی**: وضعیت بات Marketplace را در [قابلیت‌ها](#capabilities) ببینید.
- **نوع‌های پشتیبانی‌نشده**: ثبت می‌شوند (برای مثال، پیام‌ها از کاربران محافظت‌شده).

## قابلیت‌ها

این جدول رفتار فعلی **Zalo Bot Creator / بات Marketplace** را در OpenClaw خلاصه می‌کند.

| ویژگی                     | وضعیت                                  |
| --------------------------- | --------------------------------------- |
| پیام‌های مستقیم             | ✅ پشتیبانی می‌شود                            |
| گروه‌ها                      | ❌ برای بات‌های Marketplace در دسترس نیست   |
| رسانه (تصاویر ورودی)      | ⚠️ محدود / در محیط خودتان تایید کنید |
| رسانه (تصاویر خروجی)     | ⚠️ برای بات‌های Marketplace دوباره آزمایش نشده است   |
| URLهای ساده در متن          | ✅ پشتیبانی می‌شود                            |
| پیش‌نمایش لینک               | ⚠️ برای بات‌های Marketplace غیرقابل اتکا      |
| واکنش‌ها                   | ❌ پشتیبانی نمی‌شود                        |
| استیکرها                    | ⚠️ بدون پاسخ عامل برای بات‌های Marketplace  |
| یادداشت‌های صوتی / صوت / ویدیو | ⚠️ بدون پاسخ عامل برای بات‌های Marketplace  |
| پیوست‌های فایل            | ⚠️ بدون پاسخ عامل برای بات‌های Marketplace  |
| Threadها                     | ❌ پشتیبانی نمی‌شود                        |
| نظرسنجی‌ها                       | ❌ پشتیبانی نمی‌شود                        |
| دستورهای بومی             | ❌ پشتیبانی نمی‌شود                        |
| Streaming                   | ⚠️ مسدود شده (محدودیت ۲۰۰۰ نویسه)            |

## مقصدهای تحویل (CLI/cron)

- از شناسه‌ی گفتگو به‌عنوان target استفاده کنید.
- نمونه: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## عیب‌یابی

**بات پاسخ نمی‌دهد:**

- بررسی کنید توکن معتبر است: `openclaw channels status --probe`
- تایید کنید فرستنده مجاز شده است (pairing یا allowFrom)
- لاگ‌های Gateway را بررسی کنید: `openclaw logs --follow`

**Webhook رویدادها را دریافت نمی‌کند:**

- مطمئن شوید URL مربوط به webhook از HTTPS استفاده می‌کند
- تایید کنید secret token بین ۸ تا ۲۵۶ نویسه است
- تایید کنید endpoint مربوط به HTTP در Gateway روی مسیر پیکربندی‌شده قابل دسترسی است
- بررسی کنید polling مربوط به getUpdates در حال اجرا نیست (آن‌ها متقابلا انحصاری هستند)

## مرجع پیکربندی (Zalo)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

کلیدهای تخت سطح بالا (`channels.zalo.botToken`، `channels.zalo.dmPolicy` و موارد مشابه) یک shorthand قدیمی برای تک‌حساب هستند. برای پیکربندی‌های جدید، `channels.zalo.accounts.<id>.*` را ترجیح دهید. هر دو شکل همچنان اینجا مستند شده‌اند، چون در schema وجود دارند.

گزینه‌های provider:

- `channels.zalo.enabled`: فعال/غیرفعال‌سازی شروع کانال.
- `channels.zalo.botToken`: توکن بات از Zalo Bot Platform.
- `channels.zalo.tokenFile`: خواندن توکن از مسیر یک فایل عادی. symlinkها رد می‌شوند.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing).
- `channels.zalo.allowFrom`: فهرست مجاز پیام مستقیم (شناسه‌های کاربر). `open` به `"*"` نیاز دارد. wizard شناسه‌های عددی را درخواست می‌کند.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: allowlist). در config وجود دارد؛ برای رفتار فعلی بات Marketplace، [قابلیت‌ها](#capabilities) و [کنترل دسترسی (گروه‌ها)](#access-control-groups) را ببینید.
- `channels.zalo.groupAllowFrom`: فهرست مجاز فرستنده‌ی گروه (شناسه‌های کاربر). وقتی تنظیم نشده باشد به `allowFrom` برمی‌گردد.
- `channels.zalo.mediaMaxMb`: سقف رسانه‌ی ورودی/خروجی (MB، پیش‌فرض ۵).
- `channels.zalo.webhookUrl`: فعال‌سازی حالت webhook (HTTPS لازم است).
- `channels.zalo.webhookSecret`: secret مربوط به webhook (۸ تا ۲۵۶ نویسه).
- `channels.zalo.webhookPath`: مسیر webhook روی سرور HTTP مربوط به Gateway.
- `channels.zalo.proxy`: URL مربوط به proxy برای درخواست‌های API.

گزینه‌های چندحسابی:

- `channels.zalo.accounts.<id>.botToken`: توکن جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.tokenFile`: فایل توکن عادی جداگانه برای هر حساب. symlinkها رد می‌شوند.
- `channels.zalo.accounts.<id>.name`: نام نمایشی.
- `channels.zalo.accounts.<id>.enabled`: فعال/غیرفعال‌سازی حساب.
- `channels.zalo.accounts.<id>.dmPolicy`: سیاست پیام مستقیم جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.allowFrom`: فهرست مجاز جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.groupPolicy`: سیاست گروه جداگانه برای هر حساب. در config وجود دارد؛ برای رفتار فعلی بات Marketplace، [قابلیت‌ها](#capabilities) و [کنترل دسترسی (گروه‌ها)](#access-control-groups) را ببینید.
- `channels.zalo.accounts.<id>.groupAllowFrom`: فهرست مجاز فرستنده‌ی گروه جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.webhookUrl`: URL مربوط به webhook جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.webhookSecret`: secret مربوط به webhook جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.webhookPath`: مسیر webhook جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.proxy`: URL مربوط به proxy جداگانه برای هر حساب.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه‌ی کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفتگوی گروهی و gate مبتنی بر mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
