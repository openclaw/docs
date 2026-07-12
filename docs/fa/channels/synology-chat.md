---
read_when:
    - راه‌اندازی Synology Chat با OpenClaw
    - اشکال‌زدایی مسیریابی Webhook در Synology Chat
summary: راه‌اندازی Webhook در Synology Chat و پیکربندی OpenClaw
title: گفت‌وگوی Synology
x-i18n:
    generated_at: "2026-07-12T09:36:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat از طریق یک جفت Webhook به OpenClaw متصل می‌شود: یک Webhook خروجی Synology Chat پیام‌های مستقیم ورودی را به Gateway ارسال می‌کند و پاسخ‌ها از طریق یک Webhook ورودی Synology Chat بازگردانده می‌شوند.

وضعیت: Plugin رسمی، با نصب جداگانه. فقط پیام‌های مستقیم؛ ارسال متن و فایل مبتنی بر URL پشتیبانی می‌شود.

## نصب

```bash
openclaw plugins install @openclaw/synology-chat
```

نسخهٔ محلی مخزن (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع

1. Plugin را نصب کنید (در بالا).
2. در بخش یکپارچه‌سازی‌های Synology Chat:
   - یک Webhook ورودی ایجاد و URL آن را کپی کنید.
   - یک Webhook خروجی با توکن محرمانهٔ خود ایجاد کنید.
3. URL وب‌هوک خروجی را به Gateway‏ OpenClaw خود هدایت کنید:
   - به‌طور پیش‌فرض `https://gateway-host/webhook/synology`.
   - یا مسیر سفارشی `channels.synology-chat.webhookPath` خود.
4. راه‌اندازی را در OpenClaw تکمیل کنید. Synology Chat در هر دو روش، در همان فهرست راه‌اندازی کانال نمایش داده می‌شود:
   - هدایت‌شده: `openclaw onboard` یا `openclaw channels add`
   - مستقیم: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway را راه‌اندازی مجدد کنید و یک پیام مستقیم برای ربات Synology Chat بفرستید.

جزئیات احراز هویت Webhook:

- OpenClaw ابتدا توکن Webhook خروجی را از `body.token`، سپس از
  `?token=...` و پس از آن از سرآیندها می‌پذیرد.
- قالب‌های پذیرفته‌شدهٔ سرآیند:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- توکن‌های خالی یا مفقود به رد ایمن درخواست منجر می‌شوند.
- محموله‌ها می‌توانند از نوع `application/x-www-form-urlencoded` یا `application/json` باشند؛ `token`، `user_id` و `text` الزامی‌اند.

پیکربندی حداقلی:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## متغیرهای محیطی

برای حساب پیش‌فرض، می‌توانید از متغیرهای محیطی استفاده کنید:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (جداشده با ویرگول)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

مقادیر پیکربندی بر متغیرهای محیطی اولویت دارند.

`SYNOLOGY_CHAT_INCOMING_URL` و `SYNOLOGY_NAS_HOST` را نمی‌توان از فایل `.env` فضای کاری تنظیم کرد؛ به [فایل‌های `.env` فضای کاری](/fa/gateway/security#workspace-env-files) مراجعه کنید.

## سیاست پیام مستقیم و کنترل دسترسی

- مقادیر پشتیبانی‌شدهٔ `dmPolicy`:‏ `allowlist` (پیش‌فرض)، `open` و `disabled`.‏ Synology Chat فرایند جفت‌سازی ندارد؛ فرستندگان را با افزودن شناسه‌های عددی کاربری Synology آن‌ها به `allowedUserIds` تأیید کنید.
- `allowedUserIds` فهرستی (یا رشته‌ای جداشده با ویرگول) از شناسه‌های کاربری Synology را می‌پذیرد.
- در حالت `allowlist`، فهرست خالی `allowedUserIds` پیکربندی نادرست تلقی می‌شود و مسیر Webhook راه‌اندازی نخواهد شد.
- `dmPolicy: "open"` تنها زمانی پیام‌های مستقیم عمومی را مجاز می‌کند که `allowedUserIds` شامل `"*"` باشد؛ با ورودی‌های محدودکننده، فقط کاربران منطبق می‌توانند گفتگو کنند. حالت `open` با فهرست خالی `allowedUserIds` نیز از راه‌اندازی مسیر خودداری می‌کند.
- `dmPolicy: "disabled"` پیام‌های مستقیم را مسدود می‌کند.
- اتصال گیرندهٔ پاسخ به‌طور پیش‌فرض بر پایهٔ `user_id` عددی و پایدار باقی می‌ماند. `channels.synology-chat.dangerouslyAllowNameMatching: true` حالت سازگاری اضطراری است که جست‌وجوی نام کاربری/نام مستعار تغییرپذیر را برای تحویل پاسخ دوباره فعال می‌کند.

## تحویل خروجی

از شناسه‌های عددی کاربری Synology Chat به‌عنوان مقصد استفاده کنید. پیشوندهای `synology-chat:`،‏ `synology_chat:` و `synology:` پذیرفته می‌شوند.

نمونه‌ها:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

متن خروجی در قطعه‌های ۲۰۰۰ نویسه‌ای تقسیم می‌شود. ارسال رسانه از طریق تحویل فایل مبتنی بر URL پشتیبانی می‌شود: NAS فایل را بارگیری و پیوست می‌کند (حداکثر ۳۲ مگابایت). URLهای فایل خروجی باید از `http` یا `https` استفاده کنند و مقصدهای شبکهٔ خصوصی یا به‌شکل دیگری مسدودشده، پیش از آنکه OpenClaw نشانی را به Webhook‏ NAS ارسال کند، رد می‌شوند.

## چندحسابی

چندین حساب Synology Chat در `channels.synology-chat.accounts` پشتیبانی می‌شوند.
هر حساب می‌تواند توکن، URL ورودی، مسیر Webhook، سیاست پیام مستقیم و محدودیت‌ها را بازنویسی کند.
نشست‌های پیام مستقیم برای هر حساب و کاربر مجزا هستند؛ بنابراین `user_id` عددی یکسان
در دو حساب متفاوت Synology وضعیت رونوشت مشترکی ندارد.
به هر حساب فعال یک `webhookPath` متمایز اختصاص دهید. OpenClaw مسیرهای دقیق تکراری را رد می‌کند
و در راه‌اندازی‌های چندحسابی، از راه‌اندازی حساب‌های نام‌داری که فقط یک مسیر Webhook مشترک را به ارث می‌برند خودداری می‌کند.
اگر عمداً برای یک حساب نام‌دار به ارث‌بری قدیمی نیاز دارید،
`dangerouslyAllowInheritedWebhookPath: true` را در همان حساب یا در `channels.synology-chat` تنظیم کنید،
اما مسیرهای دقیق تکراری همچنان با رد ایمن مواجه می‌شوند. مسیرهای صریح برای هر حساب را ترجیح دهید.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## نکات امنیتی

- `token` را محرمانه نگه دارید و در صورت افشا آن را تعویض کنید.
- `allowInsecureSsl: false` را حفظ کنید، مگر اینکه صراحتاً به گواهی خودامضاشدهٔ NAS محلی اعتماد داشته باشید.
- درخواست‌های Webhook ورودی با توکن اعتبارسنجی می‌شوند و برای هر فرستنده محدودیت نرخ دارند (`rateLimitPerMinute`، پیش‌فرض ۳۰).
- بررسی توکن نامعتبر از مقایسهٔ زمان‌ثابت اطلاعات محرمانه استفاده می‌کند و با رد ایمن مواجه می‌شود؛ تلاش‌های مکرر با توکن نامعتبر، نشانی IP مبدأ را موقتاً مسدود می‌کنند.
- متن پیام ورودی در برابر الگوهای شناخته‌شدهٔ تزریق پرامپت پاک‌سازی و در ۴۰۰۰ نویسه کوتاه می‌شود.
- برای محیط عملیاتی، `dmPolicy: "allowlist"` را ترجیح دهید.
- `dangerouslyAllowNameMatching` را غیرفعال نگه دارید، مگر اینکه صراحتاً به تحویل پاسخ قدیمی مبتنی بر نام کاربری نیاز داشته باشید.
- `dangerouslyAllowInheritedWebhookPath` را غیرفعال نگه دارید، مگر اینکه صراحتاً خطر مسیریابی مسیر مشترک را در راه‌اندازی چندحسابی بپذیرید.

## عیب‌یابی

- `Missing required fields (token, user_id, text)`:
  - محمولهٔ Webhook خروجی یکی از فیلدهای الزامی را ندارد
  - اگر Synology توکن را در سرآیندها ارسال می‌کند، مطمئن شوید Gateway/پروکسی آن سرآیندها را حفظ می‌کند
- `Invalid token`:
  - اطلاعات محرمانهٔ Webhook خروجی با `channels.synology-chat.token` مطابقت ندارد
  - درخواست به حساب/مسیر Webhook اشتباه می‌رسد
  - یک پروکسی معکوس پیش از رسیدن درخواست به OpenClaw، سرآیند توکن را حذف کرده است
- `Rate limit exceeded`:
  - تلاش‌های بیش‌ازحد با توکن نامعتبر از یک مبدأ می‌تواند آن مبدأ را موقتاً مسدود کند
  - فرستندگان احرازشده نیز محدودیت نرخ پیام جداگانه‌ای برای هر کاربر دارند
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` فعال است، اما هیچ کاربری پیکربندی نشده است
- `User not authorized`:
  - `user_id` عددی فرستنده در `allowedUserIds` نیست

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) — رفتار گفتگوی گروهی و محدودسازی بر پایهٔ اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و مقاوم‌سازی
