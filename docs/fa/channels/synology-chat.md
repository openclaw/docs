---
read_when:
    - راه‌اندازی Synology Chat با OpenClaw
    - اشکال‌زدایی مسیریابی Webhook در Synology Chat
summary: راه‌اندازی Webhook در Synology Chat و پیکربندی OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-29T22:29:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

وضعیت: کانال پیام مستقیم Plugin بسته‌بندی‌شده با استفاده از Webhookهای Synology Chat.
این Plugin پیام‌های ورودی را از Webhookهای خروجی Synology Chat می‌پذیرد و پاسخ‌ها را
از طریق یک Webhook ورودی Synology Chat ارسال می‌کند.

## Plugin بسته‌بندی‌شده

Synology Chat در نسخه‌های فعلی OpenClaw به‌صورت یک Plugin بسته‌بندی‌شده عرضه می‌شود، بنابراین ساخت‌های
بسته‌بندی‌شدهٔ معمول به نصب جداگانه نیاز ندارند.

اگر از یک ساخت قدیمی‌تر یا نصب سفارشی استفاده می‌کنید که Synology Chat را حذف کرده است،
آن را دستی نصب کنید:

نصب از یک checkout محلی:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع

1. مطمئن شوید Plugin مربوط به Synology Chat در دسترس است.
   - نسخه‌های بسته‌بندی‌شدهٔ فعلی OpenClaw از قبل آن را همراه دارند.
   - نصب‌های قدیمی‌تر/سفارشی می‌توانند آن را با دستور بالا از یک checkout منبع به‌صورت دستی اضافه کنند.
   - `openclaw onboard` اکنون Synology Chat را در همان فهرست راه‌اندازی کانال که `openclaw channels add` نشان می‌دهد، نمایش می‌دهد.
   - راه‌اندازی غیرتعاملی: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. در ادغام‌های Synology Chat:
   - یک Webhook ورودی ایجاد کنید و URL آن را کپی کنید.
   - یک Webhook خروجی با توکن محرمانهٔ خود ایجاد کنید.
3. URL مربوط به Webhook خروجی را به Gateway مربوط به OpenClaw اشاره دهید:
   - به‌صورت پیش‌فرض `https://gateway-host/webhook/synology`.
   - یا `channels.synology-chat.webhookPath` سفارشی شما.
4. راه‌اندازی را در OpenClaw کامل کنید.
   - راهنمایی‌شده: `openclaw onboard`
   - مستقیم: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway را بازراه‌اندازی کنید و یک DM به ربات Synology Chat بفرستید.

جزئیات احراز هویت Webhook:

- OpenClaw توکن Webhook خروجی را ابتدا از `body.token`، سپس
  `?token=...`، و سپس از headerها می‌پذیرد.
- شکل‌های پذیرفته‌شدهٔ header:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- توکن‌های خالی یا ناموجود به‌صورت fail closed رد می‌شوند.

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

مقادیر پیکربندی، متغیرهای محیطی را override می‌کنند.

`SYNOLOGY_CHAT_INCOMING_URL` را نمی‌توان از یک فایل `.env` در workspace تنظیم کرد؛ [فایل‌های `.env` در workspace](/fa/gateway/security) را ببینید.

## سیاست DM و کنترل دسترسی

- `dmPolicy: "allowlist"` پیش‌فرض پیشنهادی است.
- `allowedUserIds` فهرستی (یا رشته‌ای جداشده با ویرگول) از شناسه‌های کاربری Synology را می‌پذیرد.
- در حالت `allowlist`، فهرست خالی `allowedUserIds` به‌عنوان پیکربندی نادرست در نظر گرفته می‌شود و مسیر Webhook شروع نخواهد شد (برای اجازه به همه از `dmPolicy: "open"` همراه با `allowedUserIds: ["*"]` استفاده کنید).
- `dmPolicy: "open"` فقط زمانی DMهای عمومی را مجاز می‌کند که `allowedUserIds` شامل `"*"` باشد؛ با ورودی‌های محدودکننده، فقط کاربران مطابق می‌توانند گفتگو کنند.
- `dmPolicy: "disabled"` DMها را مسدود می‌کند.
- اتصال گیرندهٔ پاسخ به‌صورت پیش‌فرض روی `user_id` عددی پایدار باقی می‌ماند. `channels.synology-chat.dangerouslyAllowNameMatching: true` حالت سازگاری break-glass است که جست‌وجوی نام کاربری/نام مستعار قابل تغییر را برای تحویل پاسخ دوباره فعال می‌کند.
- تأییدهای pairing با این‌ها کار می‌کنند:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## تحویل خروجی

از شناسه‌های عددی کاربران Synology Chat به‌عنوان هدف استفاده کنید.

مثال‌ها:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

ارسال رسانه با تحویل فایل مبتنی بر URL پشتیبانی می‌شود.
URLهای فایل خروجی باید از `http` یا `https` استفاده کنند، و هدف‌های شبکهٔ خصوصی یا به‌نحوی مسدودشده پیش از آنکه OpenClaw URL را به Webhook مربوط به NAS ارسال کند، رد می‌شوند.

## چندحسابی

چندین حساب Synology Chat زیر `channels.synology-chat.accounts` پشتیبانی می‌شوند.
هر حساب می‌تواند token، URL ورودی، مسیر Webhook، سیاست DM و محدودیت‌ها را override کند.
نشست‌های پیام مستقیم برای هر حساب و کاربر ایزوله هستند، بنابراین همان `user_id` عددی
در دو حساب Synology متفاوت، وضعیت transcript مشترک ندارد.
برای هر حساب فعال، یک `webhookPath` متمایز بدهید. OpenClaw اکنون مسیرهای دقیق تکراری را رد می‌کند
و از شروع حساب‌های نام‌گذاری‌شده‌ای که در راه‌اندازی‌های چندحسابی فقط یک مسیر Webhook مشترک را به ارث می‌برند، خودداری می‌کند.
اگر عمداً برای یک حساب نام‌گذاری‌شده به ارث‌بری legacy نیاز دارید،
`dangerouslyAllowInheritedWebhookPath: true` را روی همان حساب یا در `channels.synology-chat` تنظیم کنید،
اما مسیرهای دقیق تکراری همچنان به‌صورت fail-closed رد می‌شوند. مسیرهای صریح برای هر حساب را ترجیح دهید.

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

- `token` را محرمانه نگه دارید و در صورت افشا، آن را rotate کنید.
- `allowInsecureSsl: false` را حفظ کنید مگر اینکه صراحتاً به یک گواهی محلی خودامضاشدهٔ NAS اعتماد دارید.
- درخواست‌های Webhook ورودی با توکن راستی‌آزمایی می‌شوند و برای هر فرستنده rate-limit دارند.
- بررسی‌های توکن نامعتبر از مقایسهٔ محرمانهٔ constant-time استفاده می‌کنند و به‌صورت fail closed رد می‌شوند.
- برای production، `dmPolicy: "allowlist"` را ترجیح دهید.
- `dangerouslyAllowNameMatching` را خاموش نگه دارید مگر اینکه صراحتاً به تحویل پاسخ legacy مبتنی بر نام کاربری نیاز دارید.
- `dangerouslyAllowInheritedWebhookPath` را خاموش نگه دارید مگر اینکه صراحتاً ریسک مسیریابی با مسیر مشترک را در راه‌اندازی چندحسابی بپذیرید.

## عیب‌یابی

- `Missing required fields (token, user_id, text)`:
  - payload مربوط به Webhook خروجی یکی از فیلدهای الزامی را ندارد
  - اگر Synology توکن را در headerها می‌فرستد، مطمئن شوید Gateway/proxy آن headerها را حفظ می‌کند
- `Invalid token`:
  - secret مربوط به Webhook خروجی با `channels.synology-chat.token` مطابقت ندارد
  - درخواست به حساب/مسیر Webhook اشتباه برخورد می‌کند
  - یک reverse proxy پیش از رسیدن درخواست به OpenClaw، header توکن را حذف کرده است
- `Rate limit exceeded`:
  - تلاش‌های بیش‌ازحد با توکن نامعتبر از یک منبع واحد می‌تواند آن منبع را موقتاً قفل کند
  - فرستندگان احراز هویت‌شده نیز یک محدودیت نرخ پیام جداگانه برای هر کاربر دارند
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` فعال است اما هیچ کاربری پیکربندی نشده است
- `User not authorized`:
  - `user_id` عددی فرستنده در `allowedUserIds` نیست

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفتگوی گروهی و mention gating
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و مقاوم‌سازی
