---
read_when:
    - کار روی قابلیت‌های کانال Google Chat
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی برنامه Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-05-06T09:02:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b6ac581578df0fccfb560057e4b30ec359a368cb671519a153e1c727d7b920c
    source_path: channels/googlechat.md
    workflow: 16
---

وضعیت: Plugin قابل دانلود برای پیام‌های مستقیم و فضاها از طریق Webhookهای Google Chat API (فقط HTTP).

## نصب

پیش از پیکربندی کانال، Google Chat را نصب کنید:

```bash
openclaw plugins install @openclaw/googlechat
```

بررسی محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## راه‌اندازی سریع (مبتدی)

1. یک پروژه Google Cloud بسازید و **Google Chat API** را فعال کنید.
   - بروید به: [اعتبارنامه‌های Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - اگر API از قبل فعال نیست، آن را فعال کنید.
2. یک **Service Account** بسازید:
   - روی **Create Credentials** > **Service Account** بزنید.
   - هر نامی که می‌خواهید برای آن بگذارید (مثلاً `openclaw-chat`).
   - مجوزها را خالی بگذارید (روی **Continue** بزنید).
   - بخش principals با دسترسی را خالی بگذارید (روی **Done** بزنید).
3. **JSON Key** را بسازید و دانلود کنید:
   - در فهرست حساب‌های سرویس، روی حسابی که همین حالا ساختید کلیک کنید.
   - به زبانه **Keys** بروید.
   - روی **Add Key** > **Create new key** کلیک کنید.
   - **JSON** را انتخاب کنید و روی **Create** بزنید.
4. فایل JSON دانلودشده را روی میزبان Gateway خود ذخیره کنید (مثلاً `~/.openclaw/googlechat-service-account.json`).
5. در [پیکربندی Chat در Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) یک برنامه Google Chat بسازید:
   - **Application info** را پر کنید:
     - **App name**: (مثلاً `OpenClaw`)
     - **Avatar URL**: (مثلاً `https://openclaw.ai/logo.png`)
     - **Description**: (مثلاً `Personal AI Assistant`)
   - **Interactive features** را فعال کنید.
   - زیر **Functionality**، گزینه **Join spaces and group conversations** را علامت بزنید.
   - زیر **Connection settings**، گزینه **HTTP endpoint URL** را انتخاب کنید.
   - زیر **Triggers**، گزینه **Use a common HTTP endpoint URL for all triggers** را انتخاب کنید و آن را روی URL عمومی Gateway خود به‌همراه `/googlechat` تنظیم کنید.
     - _نکته: برای پیدا کردن URL عمومی Gateway خود، `openclaw status` را اجرا کنید._
   - زیر **Visibility**، گزینه **Make this Chat app available to specific people and groups in `<Your Domain>`** را علامت بزنید.
   - نشانی ایمیل خود را (مثلاً `user@example.com`) در کادر متنی وارد کنید.
   - در پایین صفحه روی **Save** کلیک کنید.
6. **وضعیت برنامه را فعال کنید**:
   - پس از ذخیره، **صفحه را تازه‌سازی کنید**.
   - بخش **App status** را پیدا کنید (معمولاً پس از ذخیره نزدیک بالا یا پایین صفحه است).
   - وضعیت را به **Live - available to users** تغییر دهید.
   - دوباره روی **Save** کلیک کنید.
7. OpenClaw را با مسیر حساب سرویس + مخاطب Webhook پیکربندی کنید:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - یا پیکربندی: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. نوع + مقدار مخاطب Webhook را تنظیم کنید (با پیکربندی برنامه Chat شما مطابقت دارد).
9. Gateway را شروع کنید. Google Chat به مسیر Webhook شما POST می‌کند.

## افزودن به Google Chat

وقتی Gateway در حال اجراست و ایمیل شما به فهرست مشاهده‌پذیری افزوده شده است:

1. به [Google Chat](https://chat.google.com/) بروید.
2. روی نماد **+** (بعلاوه) کنار **Direct Messages** کلیک کنید.
3. در نوار جست‌وجو (جایی که معمولاً افراد را اضافه می‌کنید)، **App name**ای را که در Google Cloud Console پیکربندی کرده‌اید تایپ کنید.
   - **توجه**: ربات در فهرست مرور «Marketplace» ظاهر _نخواهد شد_، چون یک برنامه خصوصی است. باید آن را با نام جست‌وجو کنید.
4. ربات خود را از نتایج انتخاب کنید.
5. برای شروع یک گفت‌وگوی یک‌به‌یک روی **Add** یا **Chat** کلیک کنید.
6. برای فعال کردن دستیار، «Hello» بفرستید!

## URL عمومی (فقط Webhook)

Webhookهای Google Chat به یک نقطه پایانی HTTPS عمومی نیاز دارند. برای امنیت، **فقط مسیر `/googlechat` را** در اینترنت در دسترس قرار دهید. داشبورد OpenClaw و دیگر نقطه‌های پایانی حساس را در شبکه خصوصی خود نگه دارید.

### گزینه A: Tailscale Funnel (پیشنهادی)

از Tailscale Serve برای داشبورد خصوصی و از Funnel برای مسیر عمومی Webhook استفاده کنید. این کار `/` را خصوصی نگه می‌دارد و فقط `/googlechat` را در دسترس قرار می‌دهد.

1. **بررسی کنید Gateway شما به چه نشانی‌ای bind شده است:**

   ```bash
   ss -tlnp | grep 18789
   ```

   نشانی IP را یادداشت کنید (مثلاً `127.0.0.1`، `0.0.0.0`، یا IP Tailscale شما مانند `100.x.x.x`).

2. **داشبورد را فقط برای tailnet در دسترس قرار دهید (درگاه 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **فقط مسیر Webhook را به‌صورت عمومی در دسترس قرار دهید:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Node را برای دسترسی Funnel مجاز کنید:**
   اگر درخواست شد، برای فعال کردن Funnel برای این Node در سیاست tailnet خود، از URL مجوزدهی نمایش‌داده‌شده در خروجی بازدید کنید.

5. **پیکربندی را تأیید کنید:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL عمومی Webhook شما این خواهد بود:
`https://<node-name>.<tailnet>.ts.net/googlechat`

داشبورد خصوصی شما فقط در tailnet باقی می‌ماند:
`https://<node-name>.<tailnet>.ts.net:8443/`

در پیکربندی برنامه Google Chat از URL عمومی (بدون `:8443`) استفاده کنید.

> توجه: این پیکربندی پس از راه‌اندازی مجدد هم باقی می‌ماند. برای حذف آن در آینده، `tailscale funnel reset` و `tailscale serve reset` را اجرا کنید.

### گزینه B: پروکسی معکوس (Caddy)

اگر از یک پروکسی معکوس مانند Caddy استفاده می‌کنید، فقط مسیر مشخص را پروکسی کنید:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

با این پیکربندی، هر درخواستی به `your-domain.com/` نادیده گرفته می‌شود یا به‌صورت 404 برگردانده می‌شود، درحالی‌که `your-domain.com/googlechat` به‌طور ایمن به OpenClaw هدایت می‌شود.

### گزینه C: Cloudflare Tunnel

قوانین ingress تونل خود را طوری پیکربندی کنید که فقط مسیر Webhook را هدایت کند:

- **مسیر**: `/googlechat` -> `http://localhost:18789/googlechat`
- **قانون پیش‌فرض**: HTTP 404 (یافت نشد)

## روش کار

1. Google Chat درخواست‌های POST Webhook را به Gateway می‌فرستد. هر درخواست شامل سرآیند `Authorization: Bearer <token>` است.
   - OpenClaw وقتی سرآیند وجود داشته باشد، پیش از خواندن/تجزیه کامل بدنه‌های Webhook، احراز هویت bearer را تأیید می‌کند.
   - درخواست‌های Google Workspace Add-on که `authorizationEventObject.systemIdToken` را در بدنه حمل می‌کنند، از طریق یک بودجه بدنه سخت‌گیرانه‌تر پیش از احراز هویت پشتیبانی می‌شوند.
2. OpenClaw توکن را در برابر `audienceType` + `audience` پیکربندی‌شده تأیید می‌کند:
   - `audienceType: "app-url"` → مخاطب، URL Webhook HTTPS شماست.
   - `audienceType: "project-number"` → مخاطب، شماره پروژه Cloud است.
3. پیام‌ها بر اساس فضا مسیریابی می‌شوند:
   - پیام‌های مستقیم از کلید نشست `agent:<agentId>:googlechat:direct:<spaceId>` استفاده می‌کنند.
   - فضاها از کلید نشست `agent:<agentId>:googlechat:group:<spaceId>` استفاده می‌کنند.
4. دسترسی پیام مستقیم به‌صورت پیش‌فرض با جفت‌سازی است. فرستنده‌های ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ با این دستور تأیید کنید:
   - `openclaw pairing approve googlechat <code>`
5. فضاهای گروهی به‌صورت پیش‌فرض به @-mention نیاز دارند. اگر تشخیص mention به نام کاربری برنامه نیاز دارد، از `botUser` استفاده کنید.

## هدف‌ها

از این شناسه‌ها برای تحویل و allowlistها استفاده کنید:

- پیام‌های مستقیم: `users/<userId>` (پیشنهادی).
- ایمیل خام `name@example.com` قابل تغییر است و فقط وقتی `channels.googlechat.dangerouslyAllowNameMatching: true` باشد برای تطبیق allowlist مستقیم استفاده می‌شود.
- منسوخ‌شده: `users/<email>` به‌عنوان شناسه کاربر در نظر گرفته می‌شود، نه allowlist ایمیل.
- فضاها: `spaces/<spaceId>`.

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
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
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
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

یادداشت‌ها:

- اعتبارنامه‌های حساب سرویس را می‌توان به‌صورت درون‌خطی نیز با `serviceAccount` (رشته JSON) ارسال کرد.
- `serviceAccountRef` نیز پشتیبانی می‌شود (SecretRef از env/file)، از جمله refهای هر حساب زیر `channels.googlechat.accounts.<id>.serviceAccountRef`.
- اگر `webhookPath` تنظیم نشده باشد، مسیر پیش‌فرض Webhook برابر `/googlechat` است.
- `dangerouslyAllowNameMatching` تطبیق principal ایمیل قابل تغییر را برای allowlistها دوباره فعال می‌کند (حالت سازگاری اضطراری).
- وقتی `actions.reactions` فعال باشد، واکنش‌ها از طریق ابزار `reactions` و `channels action` در دسترس هستند.
- کنش‌های پیام `send` را برای متن و `upload-file` را برای ارسال صریح پیوست ارائه می‌کنند. `upload-file` مقدارهای `media` / `filePath` / `path` را به‌همراه `message`، `filename`، و هدف‌گیری thread اختیاری می‌پذیرد.
- `typingIndicator` از `none`، `message` (پیش‌فرض)، و `reaction` پشتیبانی می‌کند (`reaction` به OAuth کاربر نیاز دارد).
- پیوست‌ها از طریق Chat API دانلود می‌شوند و در خط لوله رسانه ذخیره می‌شوند (اندازه با `mediaMaxMb` محدود می‌شود).

جزئیات ارجاع به اسرار: [مدیریت اسرار](/fa/gateway/secrets).

## عیب‌یابی

### 405 روش مجاز نیست

اگر Google Cloud Logs Explorer خطاهایی مانند این نشان می‌دهد:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

این یعنی handler Webhook ثبت نشده است. علت‌های رایج:

1. **کانال پیکربندی نشده است**: بخش `channels.googlechat` در پیکربندی شما وجود ندارد. با این دستور بررسی کنید:

   ```bash
   openclaw config get channels.googlechat
   ```

   اگر "Config path not found" برگرداند، پیکربندی را اضافه کنید (نگاه کنید به [نکات برجسته پیکربندی](#config-highlights)).

2. **Plugin فعال نیست**: وضعیت Plugin را بررسی کنید:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   اگر "disabled" نشان می‌دهد، `plugins.entries.googlechat.enabled: true` را به پیکربندی خود اضافه کنید.

3. **Gateway راه‌اندازی مجدد نشده است**: پس از افزودن پیکربندی، Gateway را راه‌اندازی مجدد کنید:

   ```bash
   openclaw gateway restart
   ```

تأیید کنید کانال در حال اجراست:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### مشکلات دیگر

- برای خطاهای احراز هویت یا پیکربندی مخاطبِ مفقود، `openclaw channels status --probe` را بررسی کنید.
- اگر هیچ پیامی نمی‌رسد، URL Webhook برنامه Chat + اشتراک‌های رویداد را تأیید کنید.
- اگر gating مربوط به mention پاسخ‌ها را مسدود می‌کند، `botUser` را روی نام منبع کاربر برنامه تنظیم کنید و `requireMention` را تأیید کنید.
- هنگام ارسال پیام آزمایشی، برای دیدن اینکه آیا درخواست‌ها به Gateway می‌رسند یا نه، از `openclaw logs --follow` استفاده کنید.

مستندات مرتبط:

- [پیکربندی Gateway](/fa/gateway/configuration)
- [امنیت](/fa/gateway/security)
- [واکنش‌ها](/fa/tools/reactions)

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و gating مربوط به mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
