---
read_when:
    - کار روی ویژگی‌های Zalo یا Webhookها
summary: وضعیت پشتیبانی از ربات Zalo، قابلیت‌ها و پیکربندی
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
    postprocess_version: locale-links-v1
---

وضعیت: آزمایشی. پیام‌های مستقیم پشتیبانی می‌شوند. بخش [قابلیت‌ها](#capabilities) در ادامه، رفتار فعلی ربات Marketplace را نشان می‌دهد.

## Plugin همراه

Zalo در نسخه‌های فعلی OpenClaw به‌صورت Plugin همراه عرضه می‌شود، بنابراین بیلدهای بسته‌بندی‌شده معمول به نصب جداگانه نیاز ندارند.

اگر از یک بیلد قدیمی‌تر یا نصب سفارشی‌ای استفاده می‌کنید که Zalo را حذف کرده است، بسته npm را مستقیماً نصب کنید:

- نصب از طریق CLI: `openclaw plugins install @openclaw/zalo`
- نسخه پین‌شده: `openclaw plugins install @openclaw/zalo@2026.5.2`
- یا از checkout سورس: `openclaw plugins install ./path/to/local/zalo-plugin`
- جزئیات: [Plugins](/fa/tools/plugin)

## راه‌اندازی سریع (مبتدی)

1. مطمئن شوید Plugin مربوط به Zalo در دسترس است.
   - نسخه‌های بسته‌بندی‌شده فعلی OpenClaw از قبل آن را همراه دارند.
   - نصب‌های قدیمی‌تر/سفارشی می‌توانند آن را با دستورهای بالا به‌صورت دستی اضافه کنند.
2. توکن را تنظیم کنید:
   - Env: `ZALO_BOT_TOKEN=...`
   - یا config: `channels.zalo.accounts.default.botToken: "..."`.
3. Gateway را بازراه‌اندازی کنید (یا راه‌اندازی را کامل کنید).
4. دسترسی پیام مستقیم به‌صورت پیش‌فرض با جفت‌سازی انجام می‌شود؛ در اولین تماس، کد جفت‌سازی را تأیید کنید.

حداقل پیکربندی:

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

Zalo یک برنامه پیام‌رسان متمرکز بر ویتنام است؛ Bot API آن به Gateway اجازه می‌دهد برای گفت‌وگوهای یک‌به‌یک یک ربات اجرا کند.
برای پشتیبانی یا اعلان‌هایی که در آن‌ها مسیریابی قطعی به Zalo می‌خواهید، گزینه مناسبی است.

این صفحه رفتار فعلی OpenClaw برای **ربات‌های Zalo Bot Creator / Marketplace** را نشان می‌دهد.
**ربات‌های Zalo Official Account (OA)** سطح محصول متفاوتی از Zalo هستند و ممکن است رفتار متفاوتی داشته باشند.

- یک کانال Zalo Bot API که مالک آن Gateway است.
- مسیریابی قطعی: پاسخ‌ها به Zalo برمی‌گردند؛ مدل هرگز کانال‌ها را انتخاب نمی‌کند.
- پیام‌های مستقیم نشست اصلی agent را به اشتراک می‌گذارند.
- بخش [قابلیت‌ها](#capabilities) در ادامه، پشتیبانی فعلی ربات Marketplace را نشان می‌دهد.

## راه‌اندازی (مسیر سریع)

### 1) ایجاد توکن ربات (Zalo Bot Platform)

1. به [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) بروید و وارد شوید.
2. یک ربات جدید بسازید و تنظیمات آن را پیکربندی کنید.
3. توکن کامل ربات را کپی کنید (معمولاً `numeric_id:secret`). برای ربات‌های Marketplace، توکن قابل‌استفاده در زمان اجرا ممکن است پس از ایجاد در پیام خوشامد ربات ظاهر شود.

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

اگر بعداً به سطحی از ربات Zalo منتقل شدید که در آن گروه‌ها در دسترس هستند، می‌توانید پیکربندی ویژه گروه مانند `groupPolicy` و `groupAllowFrom` را صریحاً اضافه کنید. برای رفتار فعلی ربات Marketplace، [قابلیت‌ها](#capabilities) را ببینید.

گزینه Env: `ZALO_BOT_TOKEN=...` (فقط برای حساب پیش‌فرض کار می‌کند).

پشتیبانی چندحسابی: از `channels.zalo.accounts` با توکن‌های جداگانه برای هر حساب و `name` اختیاری استفاده کنید.

3. Gateway را بازراه‌اندازی کنید. وقتی توکن تشخیص داده شود (env یا config)، Zalo شروع به کار می‌کند.
4. دسترسی پیام مستقیم به‌صورت پیش‌فرض روی جفت‌سازی است. وقتی برای اولین بار با ربات تماس گرفته شد، کد را تأیید کنید.

## نحوه کار (رفتار)

- پیام‌های ورودی با placeholderهای رسانه در envelope مشترک کانال نرمال‌سازی می‌شوند.
- پاسخ‌ها همیشه به همان گفت‌وگوی Zalo برمی‌گردند.
- به‌صورت پیش‌فرض long-polling؛ حالت webhook با `channels.zalo.webhookUrl` در دسترس است.

## محدودیت‌ها

- متن خروجی به قطعه‌های ۲۰۰۰ نویسه‌ای تقسیم می‌شود (محدودیت Zalo API).
- دانلود/آپلود رسانه با `channels.zalo.mediaMaxMb` محدود می‌شود (پیش‌فرض 5).
- Streaming به‌صورت پیش‌فرض مسدود است، چون محدودیت ۲۰۰۰ نویسه‌ای کاربرد Streaming را کمتر می‌کند.

## کنترل دسترسی (پیام‌های مستقیم)

### دسترسی پیام مستقیم

- پیش‌فرض: `channels.zalo.dmPolicy = "pairing"`. فرستنده‌های ناشناخته یک کد جفت‌سازی دریافت می‌کنند؛ پیام‌ها تا زمان تأیید نادیده گرفته می‌شوند (کدها پس از ۱ ساعت منقضی می‌شوند).
- تأیید از طریق:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- جفت‌سازی تبادل توکن پیش‌فرض است. جزئیات: [جفت‌سازی](/fa/channels/pairing)
- `channels.zalo.allowFrom` شناسه‌های عددی کاربر را می‌پذیرد (جست‌وجوی نام کاربری در دسترس نیست).

## کنترل دسترسی (گروه‌ها)

برای **ربات‌های Zalo Bot Creator / Marketplace**، پشتیبانی گروه در عمل در دسترس نبود، چون ربات اصلاً نمی‌توانست به گروه اضافه شود.

یعنی کلیدهای پیکربندی مرتبط با گروه در ادامه در schema وجود دارند، اما برای ربات‌های Marketplace قابل‌استفاده نبودند:

- `channels.zalo.groupPolicy` مدیریت ورودی گروه را کنترل می‌کند: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` محدود می‌کند کدام شناسه‌های فرستنده می‌توانند ربات را در گروه‌ها فعال کنند.
- اگر `groupAllowFrom` تنظیم نشده باشد، Zalo برای بررسی فرستنده به `allowFrom` برمی‌گردد.
- نکته زمان اجرا: اگر `channels.zalo` کاملاً وجود نداشته باشد، runtime همچنان برای ایمنی به `groupPolicy="allowlist"` برمی‌گردد.

مقادیر سیاست گروه (وقتی دسترسی گروه روی سطح ربات شما در دسترس باشد) عبارت‌اند از:

- `groupPolicy: "disabled"` — همه پیام‌های گروه را مسدود می‌کند.
- `groupPolicy: "open"` — به هر عضو گروه اجازه می‌دهد (با دروازه mention).
- `groupPolicy: "allowlist"` — پیش‌فرض fail-closed؛ فقط فرستنده‌های مجاز پذیرفته می‌شوند.

اگر از سطح محصول متفاوتی برای ربات Zalo استفاده می‌کنید و رفتار گروهیِ کارا را تأیید کرده‌اید، آن را جداگانه مستند کنید و فرض نکنید با جریان ربات Marketplace یکسان است.

## Long-polling در برابر webhook

- پیش‌فرض: long-polling (به URL عمومی نیاز ندارد).
- حالت Webhook: `channels.zalo.webhookUrl` و `channels.zalo.webhookSecret` را تنظیم کنید.
  - webhook secret باید ۸ تا ۲۵۶ نویسه باشد.
  - URL مربوط به webhook باید از HTTPS استفاده کند.
  - Zalo رویدادها را با header به نام `X-Bot-Api-Secret-Token` برای راستی‌آزمایی ارسال می‌کند.
  - HTTP مربوط به Gateway درخواست‌های webhook را در `channels.zalo.webhookPath` مدیریت می‌کند (پیش‌فرض مسیر URL مربوط به webhook است).
  - درخواست‌ها باید از `Content-Type: application/json` (یا انواع رسانه‌ای `+json`) استفاده کنند.
  - رویدادهای تکراری (`event_name + message_id`) برای یک بازه کوتاه replay نادیده گرفته می‌شوند.
  - ترافیک burst به‌ازای هر مسیر/منبع rate-limit می‌شود و ممکن است HTTP 429 برگرداند.

**نکته:** طبق مستندات Zalo API، getUpdates (polling) و webhook برای هر ربات به‌صورت متقابل ناسازگارند.

## انواع پیام پشتیبانی‌شده

برای یک نمای سریع از پشتیبانی، [قابلیت‌ها](#capabilities) را ببینید. نکات زیر در جاهایی که رفتار به زمینه بیشتری نیاز دارد، جزئیات اضافه می‌کنند.

- **پیام‌های متنی**: پشتیبانی کامل با تقسیم‌بندی ۲۰۰۰ نویسه‌ای.
- **URLهای ساده در متن**: مانند ورودی متن عادی رفتار می‌کنند.
- **پیش‌نمایش لینک‌ها / کارت‌های لینک غنی**: وضعیت ربات Marketplace را در [قابلیت‌ها](#capabilities) ببینید؛ این‌ها به‌طور قابل‌اعتماد پاسخ را فعال نمی‌کردند.
- **پیام‌های تصویری**: وضعیت ربات Marketplace را در [قابلیت‌ها](#capabilities) ببینید؛ مدیریت تصویر ورودی قابل‌اعتماد نبود (نشانگر تایپ بدون پاسخ نهایی).
- **استیکرها**: وضعیت ربات Marketplace را در [قابلیت‌ها](#capabilities) ببینید.
- **یادداشت‌های صوتی / فایل‌های صوتی / ویدئو / پیوست‌های فایل عمومی**: وضعیت ربات Marketplace را در [قابلیت‌ها](#capabilities) ببینید.
- **انواع پشتیبانی‌نشده**: ثبت می‌شوند (برای مثال، پیام‌های کاربران محافظت‌شده).

## قابلیت‌ها

این جدول رفتار فعلی **ربات Zalo Bot Creator / Marketplace** را در OpenClaw خلاصه می‌کند.

| ویژگی                       | وضعیت                                      |
| --------------------------- | ------------------------------------------ |
| پیام‌های مستقیم             | ✅ پشتیبانی می‌شود                         |
| گروه‌ها                     | ❌ برای ربات‌های Marketplace در دسترس نیست |
| رسانه (تصاویر ورودی)        | ⚠️ محدود / در محیط خود تأیید کنید          |
| رسانه (تصاویر خروجی)        | ⚠️ برای ربات‌های Marketplace دوباره آزموده نشده است |
| URLهای ساده در متن          | ✅ پشتیبانی می‌شود                         |
| پیش‌نمایش لینک‌ها           | ⚠️ برای ربات‌های Marketplace غیرقابل‌اعتماد |
| واکنش‌ها                    | ❌ پشتیبانی نمی‌شود                        |
| استیکرها                    | ⚠️ بدون پاسخ agent برای ربات‌های Marketplace |
| یادداشت صوتی / صوت / ویدئو  | ⚠️ بدون پاسخ agent برای ربات‌های Marketplace |
| پیوست‌های فایل              | ⚠️ بدون پاسخ agent برای ربات‌های Marketplace |
| Threadها                    | ❌ پشتیبانی نمی‌شود                        |
| نظرسنجی‌ها                  | ❌ پشتیبانی نمی‌شود                        |
| دستورهای بومی               | ❌ پشتیبانی نمی‌شود                        |
| Streaming                   | ⚠️ مسدود شده (محدودیت ۲۰۰۰ نویسه)          |

## مقصدهای تحویل (CLI/cron)

- از یک chat id به‌عنوان مقصد استفاده کنید.
- نمونه: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## عیب‌یابی

**ربات پاسخ نمی‌دهد:**

- بررسی کنید توکن معتبر است: `openclaw channels status --probe`
- تأیید کنید فرستنده تأیید شده است (pairing یا allowFrom)
- لاگ‌های Gateway را بررسی کنید: `openclaw logs --follow`

**Webhook رویدادها را دریافت نمی‌کند:**

- مطمئن شوید URL مربوط به webhook از HTTPS استفاده می‌کند
- تأیید کنید secret token بین ۸ تا ۲۵۶ نویسه است
- اطمینان پیدا کنید endpoint HTTP مربوط به Gateway روی مسیر پیکربندی‌شده در دسترس است
- بررسی کنید polling مربوط به getUpdates در حال اجرا نباشد (این‌ها متقابلاً ناسازگارند)

## مرجع پیکربندی (Zalo)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

کلیدهای تخت سطح بالا (`channels.zalo.botToken`، `channels.zalo.dmPolicy`، و موارد مشابه) میان‌بر قدیمی تک‌حسابی هستند. برای پیکربندی‌های جدید، `channels.zalo.accounts.<id>.*` را ترجیح دهید. هر دو شکل همچنان اینجا مستند شده‌اند چون در schema وجود دارند.

گزینه‌های provider:

- `channels.zalo.enabled`: فعال/غیرفعال کردن شروع کانال.
- `channels.zalo.botToken`: توکن ربات از Zalo Bot Platform.
- `channels.zalo.tokenFile`: خواندن توکن از مسیر یک فایل معمولی. symlinkها رد می‌شوند.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing).
- `channels.zalo.allowFrom`: allowlist پیام مستقیم (شناسه‌های کاربر). `open` به `"*"` نیاز دارد. wizard شناسه‌های عددی را درخواست می‌کند.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: allowlist). در config وجود دارد؛ برای رفتار فعلی ربات Marketplace، [قابلیت‌ها](#capabilities) و [کنترل دسترسی (گروه‌ها)](#access-control-groups) را ببینید.
- `channels.zalo.groupAllowFrom`: allowlist فرستنده گروه (شناسه‌های کاربر). وقتی تنظیم نشده باشد، به `allowFrom` برمی‌گردد.
- `channels.zalo.mediaMaxMb`: سقف رسانه ورودی/خروجی (MB، پیش‌فرض 5).
- `channels.zalo.webhookUrl`: فعال کردن حالت webhook (HTTPS الزامی است).
- `channels.zalo.webhookSecret`: webhook secret (۸ تا ۲۵۶ نویسه).
- `channels.zalo.webhookPath`: مسیر webhook روی سرور HTTP مربوط به Gateway.
- `channels.zalo.proxy`: URL مربوط به proxy برای درخواست‌های API.

گزینه‌های چندحسابی:

- `channels.zalo.accounts.<id>.botToken`: توکن جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.tokenFile`: فایل توکن معمولی جداگانه برای هر حساب. symlinkها رد می‌شوند.
- `channels.zalo.accounts.<id>.name`: نام نمایشی.
- `channels.zalo.accounts.<id>.enabled`: فعال/غیرفعال کردن حساب.
- `channels.zalo.accounts.<id>.dmPolicy`: سیاست پیام مستقیم جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.groupPolicy`: سیاست گروه جداگانه برای هر حساب. در config وجود دارد؛ برای رفتار فعلی ربات Marketplace، [قابلیت‌ها](#capabilities) و [کنترل دسترسی (گروه‌ها)](#access-control-groups) را ببینید.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist فرستنده گروه جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.webhookUrl`: URL مربوط به webhook جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.webhookSecret`: webhook secret جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.webhookPath`: مسیر webhook جداگانه برای هر حساب.
- `channels.zalo.accounts.<id>.proxy`: URL مربوط به proxy جداگانه برای هر حساب.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و دروازه mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و مقاوم‌سازی
