---
read_when:
    - کار روی قابلیت‌های کانال Google Chat
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی برنامه Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T09:32:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat به‌عنوان Plugin رسمی `@openclaw/googlechat` اجرا می‌شود: پیام‌های مستقیم و فضاها از طریق Webhookهای APIِ Google Chat (فقط نقطه پایانی HTTP، بدون Pub/Sub).

## نصب

```bash
openclaw plugins install @openclaw/googlechat
```

نسخه محلی مخزن (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## راه‌اندازی سریع (مبتدی)

1. یک پروژه Google Cloud ایجاد و **Google Chat API** را فعال کنید.
   - به این نشانی بروید: [اعتبارنامه‌های APIِ Google Chat](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - اگر API از قبل فعال نیست، آن را فعال کنید.
2. یک **Service Account** ایجاد کنید:
   - **Create Credentials** > **Service Account** را فشار دهید.
   - هر نامی که می‌خواهید برای آن انتخاب کنید (برای مثال، `openclaw-chat`).
   - مجوزها و کاربران اصلی را خالی بگذارید (**Continue** و سپس **Done**).
3. **کلید JSON** را ایجاد و بارگیری کنید:
   - روی حساب سرویس جدید کلیک کنید > زبانه **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. فایل JSON بارگیری‌شده را روی میزبان Gateway خود ذخیره کنید (برای مثال، `~/.openclaw/googlechat-service-account.json`).
5. در [پیکربندی Chat در Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) یک برنامه Google Chat ایجاد کنید:
   - بخش **Application info** (نام برنامه، نشانی اینترنتی آواتار، توضیحات) را تکمیل کنید.
   - **Interactive features** را فعال کنید.
   - در بخش **Functionality**، گزینه **Join spaces and group conversations** را علامت بزنید.
   - در بخش **Connection settings**، گزینه **HTTP endpoint URL** را انتخاب کنید.
   - در بخش **Triggers**، گزینه **Use a common HTTP endpoint URL for all triggers** را انتخاب کنید و آن را روی نشانی عمومی Gateway خود به‌همراه `/googlechat` تنظیم کنید (به [نشانی عمومی](#public-url-webhook-only) مراجعه کنید).
   - در بخش **Visibility**، گزینه **Make this Chat app available to specific people and groups in `<Your Domain>`** را علامت بزنید و نشانی ایمیل خود را وارد کنید.
   - روی **Save** کلیک کنید.
6. وضعیت برنامه را فعال کنید: صفحه را تازه‌سازی کنید، **App status** را بیابید، آن را روی **Live - available to users** تنظیم کنید و دوباره **Save** را بزنید.
7. OpenClaw را با حساب سرویس و مخاطب Webhook پیکربندی کنید (باید با پیکربندی برنامه Chat مطابقت داشته باشد):
   - متغیر محیطی: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (فقط حساب پیش‌فرض)، یا
   - پیکربندی: به [نکات برجسته پیکربندی](#config-highlights) مراجعه کنید. `openclaw channels add --channel googlechat` همچنین `--audience-type`،‏ `--audience`،‏ `--webhook-path` و `--webhook-url` را می‌پذیرد.
8. Gateway را راه‌اندازی کنید. Google Chat درخواست‌های POST را به مسیر Webhook شما ارسال می‌کند (پیش‌فرض `/googlechat`).

## افزودن به Google Chat

پس از اجرای Gateway و قرار گرفتن ایمیل شما در فهرست مشاهده‌پذیری:

1. به [Google Chat](https://chat.google.com/) بروید.
2. روی نماد **+** (علامت جمع) کنار **Direct Messages** کلیک کنید.
3. نامی را که در Google Cloud Console برای **App name** پیکربندی کرده‌اید جست‌وجو کنید.
   - ربات در فهرست مرور Marketplace ظاهر _نمی‌شود_، زیرا برنامه خصوصی است؛ آن را با نام جست‌وجو کنید.
4. ربات را انتخاب کنید، روی **Add** یا **Chat** کلیک کنید و پیامی بفرستید.

## نشانی عمومی (فقط Webhook)

Webhookهای Google Chat به یک نقطه پایانی عمومی HTTPS نیاز دارند. برای امنیت، **فقط مسیر `/googlechat`** را در معرض اینترنت قرار دهید و داشبورد OpenClaw و دیگر نقاط پایانی را خصوصی نگه دارید.

### گزینه الف: Tailscale Funnel (پیشنهادی)

برای داشبورد خصوصی از Tailscale Serve و برای مسیر عمومی Webhook از Funnel استفاده کنید.

1. بررسی کنید Gateway شما به چه نشانی‌ای متصل است:

   ```bash
   ss -tlnp | grep 18789
   ```

   نشانی IP را یادداشت کنید (برای مثال، `127.0.0.1`،‏ `0.0.0.0` یا یک نشانی Tailscale از نوع `100.x.x.x`).

2. داشبورد را فقط در اختیار tailnet قرار دهید (درگاه 8443):

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to a Tailscale IP only:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. فقط مسیر Webhook را به‌صورت عمومی در معرض دسترسی قرار دهید:

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to a Tailscale IP only:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. اگر از شما خواسته شد، برای فعال‌سازی Funnel برای این Node، نشانی مجوز نمایش‌داده‌شده در خروجی را باز کنید.

5. تأیید کنید:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

نشانی عمومی Webhook شما `https://<node-name>.<tailnet>.ts.net/googlechat` است؛ داشبورد در `https://<node-name>.<tailnet>.ts.net:8443/` فقط در دسترس tailnet باقی می‌ماند. در پیکربندی برنامه Google Chat از نشانی عمومی (بدون `:8443`) استفاده کنید.

> نکته: این پیکربندی پس از راه‌اندازی مجدد نیز باقی می‌ماند. بعداً آن را با `tailscale funnel reset` و `tailscale serve reset` حذف کنید.

### گزینه ب: پراکسی معکوس (Caddy)

فقط مسیر Webhook را پراکسی کنید:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

درخواست‌های `your-domain.com/` نادیده گرفته می‌شوند یا پاسخ 404 می‌گیرند، درحالی‌که `your-domain.com/googlechat` به OpenClaw هدایت می‌شود.

### گزینه پ: Cloudflare Tunnel

قواعد ورودی تونل را طوری پیکربندی کنید که فقط مسیر Webhook را هدایت کنند:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**: HTTP 404 (Not Found)

## نحوه کار

1. Google Chat داده JSON را با درخواست POST به مسیر Webhook در Gateway ارسال می‌کند (فقط POST، نوع محتوای JSON الزامی و نرخ درخواست به‌ازای هر IP محدود است).
2. OpenClaw پیش از ارسال هر درخواست، آن را احراز هویت می‌کند:
   - رویدادهای برنامه Chat شامل `Authorization: Bearer <token>` هستند؛ توکن پیش از تجزیه کامل بدنه تأیید می‌شود.
   - رویدادهای افزونه Google Workspace توکن را در بدنه (`authorizationEventObject.systemIdToken`) حمل می‌کنند و پیش از تأیید، تحت محدودیت سخت‌گیرانه‌تری برای مرحله پیش از احراز هویت (۱۶ کیلوبایت، ۳ ثانیه) خوانده می‌شوند.
3. توکن در برابر `audienceType` و `audience` بررسی می‌شود:
   - `audienceType: "app-url"` ← مخاطب، نشانی HTTPS مربوط به Webhook شما است.
   - `audienceType: "project-number"` ← مخاطب، شماره پروژه Cloud است.
   - توکن‌های افزونه تحت `app-url` علاوه بر این، نیاز دارند `appPrincipal` روی شناسه عددی کلاینت OAuth 2.0 برنامه تنظیم شود (۲۱ رقم، نه ایمیل)؛ در غیر این صورت، تأیید با ثبت یک هشدار شکست می‌خورد.
4. پیام‌ها بر اساس فضا هدایت می‌شوند:
   - فضاها نشست‌های جداگانه به‌ازای هر فضا با قالب `agent:<agentId>:googlechat:group:<spaceId>` دریافت می‌کنند؛ پاسخ‌ها به رشته پیام ارسال می‌شوند.
   - پیام‌های مستقیم به‌طور پیش‌فرض در نشست اصلی عامل ادغام می‌شوند؛ برای نشست‌های پیام مستقیم جداگانه به‌ازای هر همتا، `session.dmScope` را تنظیم کنید (به [نشست](/fa/concepts/session) مراجعه کنید).
5. دسترسی به پیام مستقیم به‌طور پیش‌فرض مبتنی بر جفت‌سازی است. فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ آن را با دستور زیر تأیید کنید:
   - `openclaw pairing approve googlechat <code>`
6. فضاهای گروهی به‌طور پیش‌فرض نیازمند اشاره با @ هستند. اشاره‌ها از حاشیه‌نویسی‌های `USER_MENTION` در Chat که برنامه را هدف می‌گیرند شناسایی می‌شوند؛ اگر شناسایی به نام منبع کاربر برنامه نیاز دارد، `botUser` را تنظیم کنید (برای مثال، `users/1234567890`).
7. هنگامی که یک تأیید اجرای دستور یا Plugin از Google Chat آغاز می‌شود و یک تأییدکننده پایدار با قالب `users/<id>` پیکربندی شده است، OpenClaw یک کارت تأیید بومی (`cardsV2`) در فضا یا رشته مبدأ ارسال می‌کند. دکمه‌های کارت توکن‌های بازخوانی مبهمی حمل می‌کنند؛ اعلان دستی `/approve <id> <decision>` فقط زمانی ظاهر می‌شود که تحویل بومی در دسترس نباشد.

## مقصدها

برای تحویل و فهرست‌های مجاز از این شناسه‌ها استفاده کنید:

- پیام‌های مستقیم: `users/<userId>` (پیشنهادی).
- فضاها: `spaces/<spaceId>`.
- ایمیل خام `name@example.com` قابل تغییر است و فقط زمانی برای تطبیق فهرست مجاز استفاده می‌شود که `channels.googlechat.dangerouslyAllowNameMatching: true` باشد.
- منسوخ‌شده: `users/<email>` به‌عنوان شناسه کاربر در نظر گرفته می‌شود، نه یک ورودی ایمیل در فهرست مجاز.
- پیشوندهای `googlechat:`،‏ `google-chat:` و `gchat:` پذیرفته و حذف می‌شوند.

## نکات برجسته پیکربندی

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // add-on verification only; numeric OAuth client ID
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

نکات:

- اعتبارنامه‌های حساب سرویس: `serviceAccountFile` (مسیر)،‏ `serviceAccount` (رشته یا شیء JSON درون‌خطی) یا `serviceAccountRef` (ارجاع محرمانه env/file). متغیرهای محیطی `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON درون‌خطی) و `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (مسیر) فقط برای حساب پیش‌فرض اعمال می‌شوند. راه‌اندازی‌های چندحسابی از `channels.googlechat.accounts.<id>` با همان کلیدها، از جمله `serviceAccountRef` جداگانه برای هر حساب، استفاده می‌کنند.
- وقتی `webhookPath` تنظیم نشده باشد، مسیر پیش‌فرض Webhook برابر `/googlechat` است؛ `webhookUrl` نیز می‌تواند مسیر را فراهم کند.
- کلیدهای گروه باید شناسه‌های پایدار فضا (`spaces/<spaceId>`) باشند. کلیدهای مبتنی بر نام نمایشی منسوخ شده‌اند و با همین عنوان ثبت می‌شوند.
- `dangerouslyAllowNameMatching` تطبیق کاربران اصلی بر اساس ایمیل قابل تغییر را برای فهرست‌های مجاز دوباره فعال می‌کند (حالت سازگاری اضطراری)؛ ابزار doctor درباره ورودی‌های ایمیل هشدار می‌دهد.
- کنش‌های واکنش Google Chat ارائه نمی‌شوند. این Plugin از احراز هویت حساب سرویس استفاده می‌کند، درحالی‌که نقاط پایانی واکنش Google Chat به احراز هویت کاربر نیاز دارند. پیکربندی موجود `actions.reactions` برای سازگاری پذیرفته می‌شود، اما اثری ندارد.
- کارت‌های تأیید بومی از کلیک دکمه‌های `cardsV2` در Google Chat استفاده می‌کنند، نه رویدادهای واکنش. تأییدکنندگان از `dm.allowFrom` یا `defaultTo` گرفته می‌شوند و باید مقادیر عددی و پایدار `users/<id>` باشند.
- کنش‌های پیام فقط `send` متنی را ارائه می‌کنند. بارگذاری پیوست در Google Chat به احراز هویت کاربر نیاز دارد، درحالی‌که این Plugin از احراز هویت حساب سرویس استفاده می‌کند؛ بنابراین بارگذاری فایل خروجی ارائه نمی‌شود.
- `typingIndicator`: مقدار `message` (پیش‌فرض) یک جای‌نگهدار `_<Bot> is typing..._` ارسال می‌کند و آن را به اولین پاسخ ویرایش می‌کند؛ `none` آن را غیرفعال می‌کند؛ `reaction` به OAuth کاربر نیاز دارد و در حال حاضر هنگام استفاده از احراز هویت حساب سرویس، با ثبت خطا به `message` بازمی‌گردد.
- پیوست‌های ورودی (اولین پیوست هر پیام) از طریق APIِ Chat در خط لوله رسانه بارگیری می‌شوند و اندازه آن‌ها به `mediaMaxMb` (پیش‌فرض ۲۰) محدود است.
- پیام‌های نوشته‌شده توسط ربات به‌طور پیش‌فرض نادیده گرفته می‌شوند. با `allowBots: true`، پیام‌های پذیرفته‌شده ربات از [محافظت مشترک در برابر حلقه ربات](/fa/channels/bot-loop-protection) استفاده می‌کنند: ابتدا `channels.defaults.botLoopProtection` را پیکربندی کنید و سپس با `channels.googlechat.botLoopProtection` یا `channels.googlechat.groups.<space>.botLoopProtection` آن را بازنویسی کنید.

جزئیات ارجاع به اطلاعات محرمانه: [مدیریت اطلاعات محرمانه](/fa/gateway/secrets).

## عیب‌یابی

### 405 روش مجاز نیست

اگر Google Cloud Logs Explorer خطاهایی مانند نمونه زیر نشان می‌دهد:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

کنترل‌کننده Webhook ثبت نشده است. علت‌های رایج:

1. **کانال پیکربندی نشده است**: بخش `channels.googlechat` وجود ندارد. با دستور زیر بررسی کنید:

   ```bash
   openclaw config get channels.googlechat
   ```

   اگر `"Config path not found"` را برمی‌گرداند، پیکربندی را اضافه کنید (به [نکات برجسته پیکربندی](#config-highlights) مراجعه کنید).

2. **Plugin فعال نیست**: وضعیت Plugin را بررسی کنید:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   اگر `"disabled"` را نشان می‌دهد، `plugins.entries.googlechat.enabled: true` را به پیکربندی خود اضافه کنید.

3. **Gateway پس از تغییرات پیکربندی راه‌اندازی مجدد نشده است**:

   ```bash
   openclaw gateway restart
   ```

بررسی کنید کانال در حال اجرا است:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### مشکلات دیگر

- `openclaw channels status --probe` خطاهای احراز هویت و نبود پیکربندی مخاطب را نمایان می‌کند (`audience` و `audienceType` هر دو الزامی هستند).
- اگر هیچ پیامی دریافت نمی‌شود، نشانی Webhook و پیکربندی محرک برنامه Chat را تأیید کنید.
- اگر الزام اشاره مانع پاسخ‌ها می‌شود، `botUser` را روی نام منبع کاربر برنامه تنظیم و `requireMention` را بررسی کنید.
- اجرای `openclaw logs --follow` هنگام ارسال یک پیام آزمایشی نشان می‌دهد که آیا درخواست‌ها به Gateway می‌رسند یا نه.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [پیکربندی Gateway](/fa/gateway/configuration)
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و محدودسازی بر اساس اشاره
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و فرایند جفت‌سازی
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
