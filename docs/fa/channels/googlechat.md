---
read_when:
    - کار روی ویژگی‌های کانال Google Chat
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی برنامه Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-05-04T02:21:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: afa2ca4d9673396aa24a55ca5855a34ad26a4640c3a1f6928dbf7246e403cb04
    source_path: channels/googlechat.md
    workflow: 16
---

وضعیت: Plugin قابل دانلود برای پیام‌های مستقیم + فضاها از طریق Webhookهای Google Chat API (فقط HTTP).

## نصب

پیش از پیکربندی کانال، Google Chat را نصب کنید:

```bash
openclaw plugins install @openclaw/googlechat
```

checkout محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## راه‌اندازی سریع (مبتدی)

1. یک پروژه Google Cloud بسازید و **Google Chat API** را فعال کنید.
   - بروید به: [اعتبارنامه‌های Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - اگر API هنوز فعال نشده است، آن را فعال کنید.
2. یک **حساب سرویس** بسازید:
   - روی **ایجاد اعتبارنامه** > **حساب سرویس** بزنید.
   - هر نامی که می‌خواهید برای آن بگذارید (مثلاً `openclaw-chat`).
   - مجوزها را خالی بگذارید (روی **ادامه** بزنید).
   - اصول دارای دسترسی را خالی بگذارید (روی **انجام شد** بزنید).
3. **کلید JSON** را بسازید و دانلود کنید:
   - در فهرست حساب‌های سرویس، روی حسابی که همین حالا ساختید کلیک کنید.
   - به برگه **کلیدها** بروید.
   - روی **افزودن کلید** > **ایجاد کلید جدید** کلیک کنید.
   - **JSON** را انتخاب کنید و روی **ایجاد** بزنید.
4. فایل JSON دانلودشده را روی میزبان Gateway خود ذخیره کنید (مثلاً `~/.openclaw/googlechat-service-account.json`).
5. در [پیکربندی چت Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) یک برنامه Google Chat بسازید:
   - **اطلاعات برنامه** را پر کنید:
     - **نام برنامه**: (مثلاً `OpenClaw`)
     - **نشانی URL آواتار**: (مثلاً `https://openclaw.ai/logo.png`)
     - **توضیح**: (مثلاً `Personal AI Assistant`)
   - **قابلیت‌های تعاملی** را فعال کنید.
   - زیر **کارکردها**، گزینه **پیوستن به فضاها و گفت‌وگوهای گروهی** را علامت بزنید.
   - زیر **تنظیمات اتصال**، **نشانی URL نقطه پایانی HTTP** را انتخاب کنید.
   - زیر **محرک‌ها**، **استفاده از یک نشانی URL نقطه پایانی HTTP مشترک برای همه محرک‌ها** را انتخاب کنید و آن را روی URL عمومی Gateway خود به‌همراه `/googlechat` تنظیم کنید.
     - _نکته: برای پیدا کردن URL عمومی Gateway خود `openclaw status` را اجرا کنید._
   - زیر **قابلیت مشاهده**، گزینه **در دسترس قرار دادن این برنامه Chat برای افراد و گروه‌های مشخص در `<Your Domain>`** را علامت بزنید.
   - نشانی ایمیل خود را (مثلاً `user@example.com`) در کادر متن وارد کنید.
   - در پایین روی **ذخیره** کلیک کنید.
6. **وضعیت برنامه را فعال کنید**:
   - پس از ذخیره، **صفحه را تازه‌سازی کنید**.
   - به‌دنبال بخش **وضعیت برنامه** بگردید (معمولاً پس از ذخیره نزدیک بالا یا پایین صفحه است).
   - وضعیت را به **زنده - در دسترس کاربران** تغییر دهید.
   - دوباره روی **ذخیره** کلیک کنید.
7. OpenClaw را با مسیر حساب سرویس + مخاطب Webhook پیکربندی کنید:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - یا پیکربندی: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. نوع + مقدار مخاطب Webhook را تنظیم کنید (با پیکربندی برنامه Chat شما مطابقت دارد).
9. Gateway را شروع کنید. Google Chat به مسیر Webhook شما POST می‌فرستد.

## افزودن به Google Chat

پس از اینکه Gateway در حال اجرا بود و ایمیل شما به فهرست قابلیت مشاهده اضافه شد:

1. به [Google Chat](https://chat.google.com/) بروید.
2. روی آیکن **+** (به‌علاوه) کنار **پیام‌های مستقیم** کلیک کنید.
3. در نوار جست‌وجو (جایی که معمولاً افراد را اضافه می‌کنید)، **نام برنامه**‌ای را که در Google Cloud Console پیکربندی کرده‌اید تایپ کنید.
   - **نکته**: ربات در فهرست مرور «Marketplace» ظاهر _نخواهد شد_، چون یک برنامه خصوصی است. باید آن را با نام جست‌وجو کنید.
4. ربات خود را از نتایج انتخاب کنید.
5. برای شروع گفت‌وگوی ۱:۱ روی **افزودن** یا **چت** کلیک کنید.
6. برای راه‌اندازی دستیار، «سلام» بفرستید!

## URL عمومی (فقط Webhook)

Webhookهای Google Chat به یک نقطه پایانی عمومی HTTPS نیاز دارند. برای امنیت، **فقط مسیر `/googlechat` را** در اینترنت در معرض دسترسی قرار دهید. داشبورد OpenClaw و سایر نقطه‌های پایانی حساس را روی شبکه خصوصی خود نگه دارید.

### گزینه A: Tailscale Funnel (پیشنهادی)

از Tailscale Serve برای داشبورد خصوصی و از Funnel برای مسیر عمومی Webhook استفاده کنید. این کار `/` را خصوصی نگه می‌دارد و فقط `/googlechat` را در معرض دسترسی قرار می‌دهد.

1. **بررسی کنید Gateway شما به چه نشانی‌ای bind شده است:**

   ```bash
   ss -tlnp | grep 18789
   ```

   نشانی IP را یادداشت کنید (مثلاً `127.0.0.1`، `0.0.0.0`، یا IP Tailscale شما مثل `100.x.x.x`).

2. **داشبورد را فقط برای tailnet در معرض دسترسی قرار دهید (درگاه 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **فقط مسیر Webhook را به‌صورت عمومی در معرض دسترسی قرار دهید:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Node را برای دسترسی Funnel مجاز کنید:**
   اگر درخواست شد، برای فعال کردن Funnel برای این Node در سیاست tailnet خود، URL مجوزدهی نمایش‌داده‌شده در خروجی را باز کنید.

5. **پیکربندی را بررسی کنید:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL عمومی Webhook شما این خواهد بود:
`https://<node-name>.<tailnet>.ts.net/googlechat`

داشبورد خصوصی شما فقط در tailnet باقی می‌ماند:
`https://<node-name>.<tailnet>.ts.net:8443/`

از URL عمومی (بدون `:8443`) در پیکربندی برنامه Google Chat استفاده کنید.

> نکته: این پیکربندی پس از راه‌اندازی مجدد هم باقی می‌ماند. برای حذف آن در آینده، `tailscale funnel reset` و `tailscale serve reset` را اجرا کنید.

### گزینه B: پراکسی معکوس (Caddy)

اگر از پراکسی معکوسی مثل Caddy استفاده می‌کنید، فقط مسیر مشخص را پراکسی کنید:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

با این پیکربندی، هر درخواستی به `your-domain.com/` نادیده گرفته می‌شود یا به‌صورت 404 برگردانده می‌شود، در حالی که `your-domain.com/googlechat` به‌شکل امن به OpenClaw مسیریابی می‌شود.

### گزینه C: Cloudflare Tunnel

قوانین ingress تونل خود را طوری پیکربندی کنید که فقط مسیر Webhook را مسیریابی کند:

- **مسیر**: `/googlechat` -> `http://localhost:18789/googlechat`
- **قانون پیش‌فرض**: HTTP 404 (پیدا نشد)

## نحوه کار

1. Google Chat درخواست‌های POST Webhook را به Gateway می‌فرستد. هر درخواست شامل یک سربرگ `Authorization: Bearer <token>` است.
   - وقتی سربرگ وجود داشته باشد، OpenClaw پیش از خواندن/تجزیه کامل بدنه‌های Webhook، احراز هویت bearer را بررسی می‌کند.
   - درخواست‌های Google Workspace Add-on که `authorizationEventObject.systemIdToken` را در بدنه حمل می‌کنند، از طریق بودجه بدنه سخت‌گیرانه‌تر پیش از احراز هویت پشتیبانی می‌شوند.
2. OpenClaw توکن را در برابر `audienceType` + `audience` پیکربندی‌شده بررسی می‌کند:
   - `audienceType: "app-url"` → مخاطب، URL Webhook HTTPS شماست.
   - `audienceType: "project-number"` → مخاطب، شماره پروژه Cloud است.
3. پیام‌ها بر اساس فضا مسیریابی می‌شوند:
   - پیام‌های مستقیم از کلید نشست `agent:<agentId>:googlechat:direct:<spaceId>` استفاده می‌کنند.
   - فضاها از کلید نشست `agent:<agentId>:googlechat:group:<spaceId>` استفاده می‌کنند.
4. دسترسی پیام مستقیم به‌صورت پیش‌فرض از طریق pairing است. فرستندگان ناشناس یک کد pairing دریافت می‌کنند؛ با این دستور تأیید کنید:
   - `openclaw pairing approve googlechat <code>`
5. فضاهای گروهی به‌صورت پیش‌فرض به @-mention نیاز دارند. اگر تشخیص mention به نام کاربری برنامه نیاز دارد، از `botUser` استفاده کنید.

## هدف‌ها

از این شناسه‌ها برای ارسال و allowlistها استفاده کنید:

- پیام‌های مستقیم: `users/<userId>` (پیشنهادی).
- ایمیل خام `name@example.com` تغییرپذیر است و فقط زمانی برای تطبیق allowlist مستقیم استفاده می‌شود که `channels.googlechat.dangerouslyAllowNameMatching: true` باشد.
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

نکته‌ها:

- اعتبارنامه‌های حساب سرویس را می‌توان به‌صورت درون‌خطی نیز با `serviceAccount` (رشته JSON) ارسال کرد.
- `serviceAccountRef` نیز پشتیبانی می‌شود (SecretRef از نوع env/file)، از جمله refهای مخصوص هر حساب زیر `channels.googlechat.accounts.<id>.serviceAccountRef`.
- اگر `webhookPath` تنظیم نشده باشد، مسیر پیش‌فرض Webhook برابر `/googlechat` است.
- `dangerouslyAllowNameMatching` تطبیق principal ایمیل تغییرپذیر را برای allowlistها دوباره فعال می‌کند (حالت سازگاری break-glass).
- وقتی `actions.reactions` فعال باشد، واکنش‌ها از طریق ابزار `reactions` و `channels action` در دسترس هستند.
- کنش‌های پیام، `send` را برای متن و `upload-file` را برای ارسال پیوست صریح ارائه می‌کنند. `upload-file` مقدار `media` / `filePath` / `path` را به‌همراه `message`، `filename` و هدف‌گیری thread اختیاری می‌پذیرد.
- `typingIndicator` از `none`، `message` (پیش‌فرض)، و `reaction` پشتیبانی می‌کند (`reaction` به OAuth کاربر نیاز دارد).
- پیوست‌ها از طریق Chat API دانلود می‌شوند و در pipeline رسانه ذخیره می‌شوند (اندازه با `mediaMaxMb` محدود می‌شود).

جزئیات مرجع اسرار: [مدیریت اسرار](/fa/gateway/secrets).

## عیب‌یابی

### 405 روش مجاز نیست

اگر Google Cloud Logs Explorer خطاهایی مانند این نشان دهد:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

این یعنی handler مربوط به Webhook ثبت نشده است. علت‌های رایج:

1. **کانال پیکربندی نشده است**: بخش `channels.googlechat` در پیکربندی شما وجود ندارد. با این دستور بررسی کنید:

   ```bash
   openclaw config get channels.googlechat
   ```

   اگر «Config path not found» برگرداند، پیکربندی را اضافه کنید (به [نکات برجسته پیکربندی](#config-highlights) مراجعه کنید).

2. **Plugin فعال نیست**: وضعیت Plugin را بررسی کنید:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   اگر «disabled» نشان می‌دهد، `plugins.entries.googlechat.enabled: true` را به پیکربندی خود اضافه کنید.

3. **Gateway دوباره راه‌اندازی نشده است**: پس از افزودن پیکربندی، Gateway را دوباره راه‌اندازی کنید:

   ```bash
   openclaw gateway restart
   ```

بررسی کنید کانال در حال اجراست:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### مشکلات دیگر

- برای خطاهای احراز هویت یا پیکربندی ناقص مخاطب، `openclaw channels status --probe` را بررسی کنید.
- اگر هیچ پیامی نمی‌رسد، URL Webhook برنامه Chat + اشتراک‌های رویداد را تأیید کنید.
- اگر mention gating پاسخ‌ها را مسدود می‌کند، `botUser` را روی نام منبع کاربر برنامه تنظیم کنید و `requireMention` را بررسی کنید.
- هنگام ارسال یک پیام آزمایشی، برای دیدن اینکه آیا درخواست‌ها به Gateway می‌رسند، از `openclaw logs --follow` استفاده کنید.

مستندات مرتبط:

- [پیکربندی Gateway](/fa/gateway/configuration)
- [امنیت](/fa/gateway/security)
- [واکنش‌ها](/fa/tools/reactions)

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و mention gating
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
