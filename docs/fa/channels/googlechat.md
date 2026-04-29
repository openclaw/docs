---
read_when:
    - کار روی ویژگی‌های کانال Google Chat
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی برنامه Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-04-29T22:25:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 16
---

وضعیت: آماده برای پیام‌های مستقیم + فضاها از طریق Webhookهای Google Chat API (فقط HTTP).

## راه‌اندازی سریع (مبتدی)

1. یک پروژه Google Cloud بسازید و **Google Chat API** را فعال کنید.
   - بروید به: [اعتبارنامه‌های Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - اگر API از قبل فعال نیست، آن را فعال کنید.
2. یک **حساب سرویس** بسازید:
   - **Create Credentials** > **Service Account** را فشار دهید.
   - هر نامی که می‌خواهید به آن بدهید (مثلاً `openclaw-chat`).
   - مجوزها را خالی بگذارید (**Continue** را فشار دهید).
   - اصول دارای دسترسی را خالی بگذارید (**Done** را فشار دهید).
3. **کلید JSON** را بسازید و دانلود کنید:
   - در فهرست حساب‌های سرویس، روی حسابی که همین حالا ساختید کلیک کنید.
   - به زبانه **Keys** بروید.
   - روی **Add Key** > **Create new key** کلیک کنید.
   - **JSON** را انتخاب کنید و **Create** را فشار دهید.
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
     - _نکته: برای یافتن URL عمومی Gateway خود، `openclaw status` را اجرا کنید._
   - زیر **Visibility**، گزینه **Make this Chat app available to specific people and groups in `<Your Domain>`** را علامت بزنید.
   - نشانی ایمیل خود را (مثلاً `user@example.com`) در کادر متن وارد کنید.
   - پایین صفحه روی **Save** کلیک کنید.
6. **وضعیت برنامه را فعال کنید**:
   - پس از ذخیره، **صفحه را تازه‌سازی کنید**.
   - بخش **App status** را پیدا کنید (معمولاً پس از ذخیره نزدیک بالا یا پایین صفحه است).
   - وضعیت را به **Live - available to users** تغییر دهید.
   - دوباره روی **Save** کلیک کنید.
7. OpenClaw را با مسیر حساب سرویس + مخاطب Webhook پیکربندی کنید:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - یا پیکربندی: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. نوع + مقدار مخاطب Webhook را تنظیم کنید (با پیکربندی برنامه Chat شما مطابقت دارد).
9. Gateway را شروع کنید. Google Chat به مسیر Webhook شما POST خواهد کرد.

## افزودن به Google Chat

پس از اجرای Gateway و افزودن ایمیل شما به فهرست قابلیت مشاهده:

1. به [Google Chat](https://chat.google.com/) بروید.
2. روی آیکن **+** (علامت به‌علاوه) کنار **پیام‌های مستقیم** کلیک کنید.
3. در نوار جست‌وجو (جایی که معمولاً افراد را اضافه می‌کنید)، **نام برنامه**ای را که در Google Cloud Console پیکربندی کرده‌اید تایپ کنید.
   - **توجه**: بات در فهرست مرور «Marketplace» ظاهر _نخواهد شد_، چون یک برنامه خصوصی است. باید آن را با نام جست‌وجو کنید.
4. بات خود را از نتایج انتخاب کنید.
5. برای شروع یک گفت‌وگوی ۱:۱ روی **Add** یا **Chat** کلیک کنید.
6. برای فعال‌کردن دستیار، "Hello" بفرستید!

## URL عمومی (فقط Webhook)

Webhookهای Google Chat به یک نقطه پایانی عمومی HTTPS نیاز دارند. برای امنیت، **فقط مسیر `/googlechat` را** در اینترنت در دسترس قرار دهید. داشبورد OpenClaw و سایر نقاط پایانی حساس را روی شبکه خصوصی خود نگه دارید.

### گزینه A: Tailscale Funnel (پیشنهادی)

از Tailscale Serve برای داشبورد خصوصی و از Funnel برای مسیر عمومی Webhook استفاده کنید. این کار `/` را خصوصی نگه می‌دارد و فقط `/googlechat` را در دسترس قرار می‌دهد.

1. **بررسی کنید Gateway شما به چه نشانی‌ای bind شده است:**

   ```bash
   ss -tlnp | grep 18789
   ```

   نشانی IP را یادداشت کنید (مثلاً `127.0.0.1`، `0.0.0.0`، یا IP Tailscale شما مثل `100.x.x.x`).

2. **داشبورد را فقط برای tailnet در دسترس قرار دهید (پورت 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **فقط مسیر Webhook را عمومی در دسترس قرار دهید:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Node را برای دسترسی Funnel مجاز کنید:**
   اگر درخواست شد، از URL مجوزدهی نمایش‌داده‌شده در خروجی بازدید کنید تا Funnel برای این Node در سیاست tailnet شما فعال شود.

5. **پیکربندی را تأیید کنید:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL عمومی Webhook شما این خواهد بود:
`https://<node-name>.<tailnet>.ts.net/googlechat`

داشبورد خصوصی شما فقط در tailnet می‌ماند:
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

با این پیکربندی، هر درخواستی به `your-domain.com/` نادیده گرفته می‌شود یا به‌صورت 404 برگردانده می‌شود، درحالی‌که `your-domain.com/googlechat` با ایمنی به OpenClaw مسیریابی می‌شود.

### گزینه C: Cloudflare Tunnel

قواعد ingress تونل خود را طوری پیکربندی کنید که فقط مسیر Webhook را مسیریابی کند:

- **مسیر**: `/googlechat` -> `http://localhost:18789/googlechat`
- **قاعده پیش‌فرض**: HTTP 404 (Not Found)

## نحوه کار

1. Google Chat درخواست‌های POST Webhook را به Gateway می‌فرستد. هر درخواست شامل یک هدر `Authorization: Bearer <token>` است.
   - OpenClaw پیش از خواندن/تجزیه کامل بدنه‌های Webhook، زمانی که هدر وجود داشته باشد، احراز هویت bearer را تأیید می‌کند.
   - درخواست‌های Google Workspace Add-on که `authorizationEventObject.systemIdToken` را در بدنه حمل می‌کنند، از طریق بودجه بدنه پیش‌احراز هویت سخت‌گیرانه‌تر پشتیبانی می‌شوند.
2. OpenClaw توکن را در برابر `audienceType` + `audience` پیکربندی‌شده تأیید می‌کند:
   - `audienceType: "app-url"` → مخاطب همان URL HTTPS Webhook شما است.
   - `audienceType: "project-number"` → مخاطب همان شماره پروژه Cloud است.
3. پیام‌ها بر اساس فضا مسیریابی می‌شوند:
   - پیام‌های مستقیم از کلید نشست `agent:<agentId>:googlechat:direct:<spaceId>` استفاده می‌کنند.
   - فضاها از کلید نشست `agent:<agentId>:googlechat:group:<spaceId>` استفاده می‌کنند.
4. دسترسی پیام مستقیم به‌طور پیش‌فرض با جفت‌سازی است. فرستندگان ناشناخته یک کد جفت‌سازی دریافت می‌کنند؛ با این دستور تأیید کنید:
   - `openclaw pairing approve googlechat <code>`
5. فضاهای گروهی به‌طور پیش‌فرض به @-mention نیاز دارند. اگر تشخیص اشاره به نام کاربری برنامه نیاز دارد، از `botUser` استفاده کنید.

## هدف‌ها

از این شناسه‌ها برای تحویل و allowlistها استفاده کنید:

- پیام‌های مستقیم: `users/<userId>` (پیشنهادی).
- ایمیل خام `name@example.com` قابل تغییر است و فقط زمانی برای تطبیق allowlist مستقیم استفاده می‌شود که `channels.googlechat.dangerouslyAllowNameMatching: true` باشد.
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
          allow: true,
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

- اعتبارنامه‌های حساب سرویس را می‌توان به‌صورت درون‌خطی با `serviceAccount` (رشته JSON) نیز ارسال کرد.
- `serviceAccountRef` نیز پشتیبانی می‌شود (env/file SecretRef)، از جمله refهای جداگانه برای هر حساب زیر `channels.googlechat.accounts.<id>.serviceAccountRef`.
- اگر `webhookPath` تنظیم نشده باشد، مسیر پیش‌فرض Webhook برابر `/googlechat` است.
- `dangerouslyAllowNameMatching` تطبیق principal ایمیل قابل تغییر را برای allowlistها دوباره فعال می‌کند (حالت سازگاری break-glass).
- وقتی `actions.reactions` فعال باشد، واکنش‌ها از طریق ابزار `reactions` و `channels action` در دسترس‌اند.
- کنش‌های پیام، `send` را برای متن و `upload-file` را برای ارسال پیوست صریح در دسترس می‌گذارند. `upload-file`، `media` / `filePath` / `path` به‌همراه `message`، `filename` و هدف‌گیری thread اختیاری را می‌پذیرد.
- `typingIndicator` از `none`، `message` (پیش‌فرض)، و `reaction` پشتیبانی می‌کند (`reaction` به OAuth کاربر نیاز دارد).
- پیوست‌ها از طریق Chat API دانلود می‌شوند و در pipeline رسانه ذخیره می‌شوند (اندازه با `mediaMaxMb` محدود می‌شود).

جزئیات ارجاع اسرار: [مدیریت اسرار](/fa/gateway/secrets).

## عیب‌یابی

### 405 Method Not Allowed

اگر Google Cloud Logs Explorer خطاهایی مانند این نشان می‌دهد:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

این یعنی handler Webhook ثبت نشده است. علت‌های رایج:

1. **کانال پیکربندی نشده است**: بخش `channels.googlechat` در پیکربندی شما وجود ندارد. با این دستور بررسی کنید:

   ```bash
   openclaw config get channels.googlechat
   ```

   اگر "Config path not found" برگرداند، پیکربندی را اضافه کنید (به [نکات برجسته پیکربندی](#config-highlights) مراجعه کنید).

2. **Plugin فعال نیست**: وضعیت Plugin را بررسی کنید:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   اگر "disabled" نشان داد، `plugins.entries.googlechat.enabled: true` را به پیکربندی خود اضافه کنید.

3. **Gateway راه‌اندازی مجدد نشده است**: پس از افزودن پیکربندی، Gateway را راه‌اندازی مجدد کنید:

   ```bash
   openclaw gateway restart
   ```

بررسی کنید کانال در حال اجرا است:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### مشکلات دیگر

- برای خطاهای احراز هویت یا پیکربندی مخاطبِ مفقود، `openclaw channels status --probe` را بررسی کنید.
- اگر هیچ پیامی نمی‌رسد، URL Webhook برنامه Chat + اشتراک‌های رویداد را تأیید کنید.
- اگر دروازه اشاره پاسخ‌ها را مسدود می‌کند، `botUser` را روی نام منبع کاربر برنامه تنظیم کنید و `requireMention` را تأیید کنید.
- هنگام ارسال یک پیام آزمایشی، برای دیدن اینکه آیا درخواست‌ها به Gateway می‌رسند، از `openclaw logs --follow` استفاده کنید.

مستندات مرتبط:

- [پیکربندی Gateway](/fa/gateway/configuration)
- [امنیت](/fa/gateway/security)
- [واکنش‌ها](/fa/tools/reactions)

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و دروازه اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
