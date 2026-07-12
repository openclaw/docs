---
read_when:
    - در دسترس قرار دادن رابط کاربری کنترل Gateway خارج از localhost
    - خودکارسازی دسترسی به داشبورد از طریق tailnet یا عمومی
summary: یکپارچه‌سازی Tailscale Serve/Funnel برای داشبورد Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T10:10:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw می‌تواند Tailscale **Serve** (درون tailnet) یا **Funnel** (عمومی) را برای داشبورد Gateway و درگاه WebSocket به‌طور خودکار پیکربندی کند. با این کار، Gateway همچنان به local loopback متصل می‌ماند و Tailscale، HTTPS، مسیریابی و (برای Serve) سرآیندهای هویت را فراهم می‌کند.

## حالت‌ها

`gateway.tailscale.mode`:

| حالت           | رفتار                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------- |
| `serve`        | Serve فقط در tailnet از طریق `tailscale serve`. Gateway روی `127.0.0.1` باقی می‌ماند.         |
| `funnel`       | HTTPS عمومی از طریق `tailscale funnel`. به یک گذرواژهٔ مشترک نیاز دارد.                       |
| `off` (پیش‌فرض) | بدون خودکارسازی Tailscale.                                                                    |

خروجی وضعیت و ممیزی برای این حالت Serve/Funnel در OpenClaw از اصطلاح **دسترسی Tailscale** استفاده می‌کند. `off` یعنی OpenClaw، Serve یا Funnel را مدیریت نمی‌کند؛ به این معنا نیست که دیمن محلی Tailscale متوقف شده یا از حساب خارج شده است.

## نمونه‌های پیکربندی

### فقط tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

باز کنید: `https://<magicdns>/` (یا `gateway.controlUi.basePath` پیکربندی‌شدهٔ خودتان)

برای ارائهٔ رابط کنترل از طریق یک سرویس نام‌گذاری‌شدهٔ Tailscale به‌جای نام میزبان دستگاه، `gateway.tailscale.serviceName` را روی نام سرویس تنظیم کنید:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

سپس هنگام راه‌اندازی، نشانی سرویس به‌صورت `https://openclaw.<tailnet-name>.ts.net/` به‌جای نام میزبان دستگاه گزارش می‌شود. سرویس‌های Tailscale مستلزم آن هستند که میزبان، یک Node برچسب‌گذاری‌شده و تأییدشده در tailnet شما باشد—پیش از فعال‌سازی این گزینه، برچسب را پیکربندی و سرویس را در Tailscale تأیید کنید؛ در غیر این صورت، `tailscale serve --service=...` هنگام راه‌اندازی Gateway ناموفق خواهد بود.

### فقط tailnet (اتصال به IP شبکهٔ tailnet)

از این گزینه استفاده کنید تا Gateway بدون Serve/Funnel مستقیماً روی IP شبکهٔ tailnet گوش دهد:

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

از یک دستگاه دیگر در tailnet متصل شوید:

- رابط کنترل: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
وقتی یک IPv4 قابل اتصال در tailnet موجود باشد، Gateway برای کلاینت‌های احراز هویت‌شدهٔ همان میزبان، `http://127.0.0.1:18789` را نیز الزامی می‌کند. اگر هنگام راه‌اندازی هیچ نشانی tailnet در دسترس نباشد، فقط به local loopback بازمی‌گردد؛ پس از در دسترس قرار گرفتن Tailscale، برای افزودن دسترسی مستقیم از tailnet، آن را دوباره راه‌اندازی کنید. هیچ‌یک از این مسیرها دسترسی LAN یا عمومی اضافه نمی‌کنند.
</Note>

### اینترنت عمومی (Funnel + گذرواژهٔ مشترک)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

به‌جای ثبت گذرواژه روی دیسک، استفاده از `OPENCLAW_GATEWAY_PASSWORD` را ترجیح دهید.

## نمونه‌های CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## احراز هویت

`gateway.auth.mode` فرایند دست‌دهی را کنترل می‌کند:

| حالت                                                  | مورد استفاده                                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `none`                                                | فقط ورودی خصوصی                                                                        |
| `token` (پیش‌فرض وقتی `OPENCLAW_GATEWAY_TOKEN` تنظیم شده است) | توکن مشترک                                                                             |
| `password`                                            | راز مشترک از طریق `OPENCLAW_GATEWAY_PASSWORD` یا پیکربندی                             |
| `trusted-proxy`                                       | پراکسی معکوس آگاه از هویت؛ [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth) را ببینید |

### سرآیندهای هویت Tailscale (فقط Serve)

وقتی `tailscale.mode: "serve"` باشد و `gateway.auth.allowTailscale` روی `true` تنظیم شده باشد، احراز هویت رابط کنترل/WebSocket می‌تواند به‌جای توکن/گذرواژه از سرآیندهای هویت Tailscale (`tailscale-user-login`) استفاده کند. OpenClaw پیش از پذیرش درخواست، سرآیند را با تفکیک نشانی `x-forwarded-for` درخواست از طریق دیمن محلی Tailscale (`tailscale whois`) و تطبیق آن با نام ورود موجود در سرآیند اعتبارسنجی می‌کند. یک درخواست فقط زمانی واجد شرایط استفاده از این مسیر است که از local loopback وارد شود و سرآیندهای `x-forwarded-for`، `x-forwarded-proto` و `x-forwarded-host` متعلق به Tailscale را همراه داشته باشد.

این جریان بدون توکن فرض می‌کند میزبان Gateway مورد اعتماد است. اگر ممکن است کد محلی نامطمئن روی همان میزبان اجرا شود، `gateway.auth.allowTailscale: false` را تنظیم کنید و در عوض احراز هویت با توکن/گذرواژه را الزامی کنید.

دامنهٔ این عبور:

- فقط برای سطح احراز هویت WebSocket رابط کنترل اعمال می‌شود. نقاط پایانی API مبتنی بر HTTP (`/v1/*`، `/tools/invoke`، `/api/channels/*` و غیره) هرگز از احراز هویت با سرآیند هویت Tailscale استفاده نمی‌کنند؛ آن‌ها همیشه از حالت معمول احراز هویت HTTP در Gateway پیروی می‌کنند.
- برای نشست‌های اپراتور رابط کنترل که از قبل هویت دستگاه مرورگر را دارند، هویت تأییدشدهٔ Tailscale رفت‌وبرگشت جفت‌سازی با توکن راه‌اندازی/کد QR را حذف می‌کند.
- خود هویت دستگاه را دور نمی‌زند: کلاینت‌های بدون دستگاه همچنان رد می‌شوند و اتصال‌های دارای نقش Node همچنان مراحل عادی جفت‌سازی و بررسی‌های احراز هویت را طی می‌کنند.

## نکات

- Tailscale Serve/Funnel به نصب بودن CLI ابزار `tailscale` و ورود به حساب نیاز دارد.
- `tailscale.mode: "funnel"` برای جلوگیری از دسترسی عمومی، تا زمانی که حالت احراز هویت `password` نباشد، از راه‌اندازی خودداری می‌کند.
- `gateway.tailscale.serviceName` فقط در حالت Serve اعمال می‌شود و به `tailscale serve --service=<name>` ارسال می‌شود. مقدار باید از قالب `svc:<dns-label>` متعلق به Tailscale استفاده کند؛ برای مثال `svc:openclaw`. Tailscale الزام می‌کند میزبان‌های سرویس، Nodeهای برچسب‌گذاری‌شده باشند و ممکن است پیش از آنکه Serve بتواند سرویس را منتشر کند، سرویس نیازمند تأیید در کنسول مدیریت باشد.
- `gateway.tailscale.resetOnExit` هنگام خاموش شدن، پیکربندی `tailscale serve`/`tailscale funnel` را لغو می‌کند.
- `gateway.tailscale.preserveFunnel: true` مسیر `tailscale funnel` پیکربندی‌شده از خارج را در راه‌اندازی‌های مجدد Gateway فعال نگه می‌دارد. با `mode: "serve"`، OpenClaw پیش از اعمال دوبارهٔ Serve، وضعیت `tailscale funnel status` را بررسی می‌کند و اگر از قبل یک مسیر Funnel درگاه Gateway را پوشش دهد، از اعمال آن صرف‌نظر می‌کند. سیاست Funnel مدیریت‌شده توسط OpenClaw که فقط گذرواژه را می‌پذیرد، بدون تغییر باقی می‌ماند.
- `gateway.bind: "tailnet"` از اتصال مستقیم به tailnet (بدون HTTPS و بدون Serve/Funnel) به‌همراه `127.0.0.1` محلی الزامی، در صورت موجود بودن IPv4 شبکهٔ tailnet، استفاده می‌کند؛ در غیر این صورت، فقط به local loopback بازمی‌گردد.
- `gateway.bind: "auto"`، local loopback را ترجیح می‌دهد؛ برای محدود کردن دسترسی شبکه به tailnet، همراه با حفظ دسترسی local loopback از همان میزبان، از `tailnet` استفاده کنید.
- Serve/Funnel فقط **رابط کنترل Gateway + WS** را در معرض دسترسی قرار می‌دهند. Nodeها از طریق همان نقطهٔ پایانی WS در Gateway متصل می‌شوند، بنابراین Serve برای دسترسی Node نیز کار می‌کند.

### پیش‌نیازها و محدودیت‌های Tailscale

- Serve مستلزم فعال بودن HTTPS برای tailnet شما است؛ اگر فعال نباشد، CLI از شما می‌خواهد آن را فعال کنید.
- Serve سرآیندهای هویت Tailscale را تزریق می‌کند؛ Funnel چنین کاری نمی‌کند.
- Funnel به Tailscale نسخهٔ 1.38.3 یا جدیدتر، MagicDNS، فعال بودن HTTPS و یک ویژگی Node مربوط به Funnel نیاز دارد.
- Funnel فقط از درگاه‌های `443`، `8443` و `10000` روی TLS پشتیبانی می‌کند.
- Funnel در macOS به گونهٔ متن‌باز برنامهٔ Tailscale نیاز دارد.

## کنترل مرورگر (Gateway راه دور + مرورگر محلی)

برای اجرای Gateway روی یک دستگاه و کنترل مرورگر روی دستگاهی دیگر، یک **میزبان Node** روی دستگاه مرورگر اجرا کنید و هر دو را در یک tailnet نگه دارید. Gateway کنش‌های مرورگر را به Node پراکسی می‌کند؛ به سرور کنترل جداگانه یا نشانی Serve نیازی نیست.

برای کنترل مرورگر از Funnel اجتناب کنید؛ با جفت‌سازی Node مانند دسترسی اپراتور رفتار کنید.

## بیشتر بدانید

- نمای کلی Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- فرمان `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- نمای کلی Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- فرمان `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## مرتبط

- [دسترسی از راه دور](/fa/gateway/remote)
- [کشف](/fa/gateway/discovery)
- [احراز هویت](/fa/gateway/authentication)
