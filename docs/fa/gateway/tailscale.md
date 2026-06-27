---
read_when:
    - در دسترس قرار دادن رابط کاربری کنترل Gateway خارج از localhost
    - خودکارسازی دسترسی به tailnet یا داشبورد عمومی
summary: Tailscale Serve/Funnel یکپارچه برای داشبورد Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T17:50:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw می‌تواند Tailscale **Serve** (tailnet) یا **Funnel** (عمومی) را برای داشبورد
Gateway و پورت WebSocket به‌صورت خودکار پیکربندی کند. این کار Gateway را به loopback محدود نگه می‌دارد، در حالی که
Tailscale، HTTPS، مسیریابی، و (برای Serve) سرآیندهای هویت را فراهم می‌کند.

## حالت‌ها

- `serve`: Serve فقط برای Tailnet از طریق `tailscale serve`. gateway روی `127.0.0.1` باقی می‌ماند.
- `funnel`: HTTPS عمومی از طریق `tailscale funnel`. OpenClaw به یک گذرواژه مشترک نیاز دارد.
- `off`: پیش‌فرض (بدون خودکارسازی Tailscale).

خروجی وضعیت و ممیزی از **Tailscale exposure** برای این حالت Serve/Funnel در OpenClaw
استفاده می‌کند. `off` یعنی OpenClaw، Serve یا Funnel را مدیریت نمی‌کند؛ به این معنا نیست که
daemon محلی Tailscale متوقف شده یا از حساب خارج شده است.

## احراز هویت

برای کنترل handshake، `gateway.auth.mode` را تنظیم کنید:

- `none` (فقط ورودی خصوصی)
- `token` (پیش‌فرض وقتی `OPENCLAW_GATEWAY_TOKEN` تنظیم شده باشد)
- `password` (راز مشترک از طریق `OPENCLAW_GATEWAY_PASSWORD` یا پیکربندی)
- `trusted-proxy` (پراکسی معکوس آگاه از هویت؛ [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth) را ببینید)

وقتی `tailscale.mode = "serve"` و `gateway.auth.allowTailscale` برابر `true` باشد،
احراز هویت Control UI/WebSocket می‌تواند بدون ارائه token/password از سرآیندهای هویت Tailscale
(`tailscale-user-login`) استفاده کند. OpenClaw هویت را با resolve کردن نشانی `x-forwarded-for` از طریق daemon محلی Tailscale
(`tailscale whois`) و تطبیق آن با سرآیند، پیش از پذیرش آن تأیید می‌کند.
OpenClaw فقط زمانی یک درخواست را Serve در نظر می‌گیرد که از loopback همراه با سرآیندهای
`x-forwarded-for`، `x-forwarded-proto`، و `x-forwarded-host` متعلق به Tailscale
وارد شده باشد.
برای نشست‌های اپراتور Control UI که شامل هویت دستگاه مرورگر هستند، این مسیر Serve تأییدشده
رفت‌وبرگشت جفت‌سازی دستگاه را نیز رد می‌کند. این مسیر هویت دستگاه مرورگر را دور نمی‌زند:
کلاینت‌های بدون دستگاه همچنان رد می‌شوند، و اتصال‌های node-role یا WebSocket غیر Control UI
همچنان بررسی‌های عادی جفت‌سازی و احراز هویت را دنبال می‌کنند.
endpointهای HTTP API (برای مثال `/v1/*`، `/tools/invoke`، و `/api/channels/*`)
از احراز هویت سرآیند هویت Tailscale استفاده **نمی‌کنند**. آن‌ها همچنان از حالت عادی احراز هویت HTTP در gateway
پیروی می‌کنند: احراز هویت با راز مشترک به‌صورت پیش‌فرض، یا راه‌اندازی `none` برای trusted-proxy / private-ingress که عمداً
پیکربندی شده باشد.
این جریان بدون token فرض می‌کند میزبان gateway مورد اعتماد است. اگر کد محلی غیرقابل‌اعتماد
ممکن است روی همان میزبان اجرا شود، `gateway.auth.allowTailscale` را غیرفعال کنید و به‌جای آن
احراز هویت token/password را الزامی کنید.
برای الزامی کردن اعتبارنامه‌های صریح راز مشترک، `gateway.auth.allowTailscale: false`
را تنظیم کنید و از `gateway.auth.mode: "token"` یا `"password"` استفاده کنید.

## نمونه‌های پیکربندی

### فقط Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

باز کردن: `https://<magicdns>/` (یا `gateway.controlUi.basePath` پیکربندی‌شده شما)

برای نمایش Control UI از طریق یک Tailscale Service نام‌دار به‌جای نام میزبان دستگاه،
`gateway.tailscale.serviceName` را روی نام Service تنظیم کنید:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

با نمونه بالا، راه‌اندازی URL سرویس را به‌صورت
`https://openclaw.<tailnet-name>.ts.net/` به‌جای نام میزبان دستگاه گزارش می‌کند.
Tailscale Services نیاز دارد میزبان یک نود برچسب‌گذاری‌شده و تأییدشده در
tailnet شما باشد. پیش از فعال کردن این گزینه، برچسب را پیکربندی و Service را در Tailscale تأیید کنید؛ در غیر این صورت
`tailscale serve --service=...` هنگام راه‌اندازی gateway شکست می‌خورد.

### فقط Tailnet (bind به IP تیل‌نت)

وقتی می‌خواهید Gateway مستقیماً روی IP تیل‌نت گوش دهد، از این استفاده کنید (بدون Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

از یک دستگاه Tailnet دیگر متصل شوید:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) در این حالت کار **نخواهد کرد**.
</Note>

### اینترنت عمومی (Funnel + گذرواژه مشترک)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

`OPENCLAW_GATEWAY_PASSWORD` را به commit کردن گذرواژه روی دیسک ترجیح دهید.

## نمونه‌های CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## نکات

- Tailscale Serve/Funnel نیاز دارد CLI مربوط به `tailscale` نصب شده و وارد حساب شده باشد.
- `tailscale.mode: "funnel"` برای جلوگیری از قرار گرفتن عمومی، مگر اینکه حالت احراز هویت `password` باشد، از شروع کار خودداری می‌کند.
- `gateway.tailscale.serviceName` فقط روی حالت Serve اعمال می‌شود و به
  `tailscale serve --service=<name>` پاس داده می‌شود. مقدار باید از قالب نام Service در Tailscale
  یعنی `svc:<dns-label>` استفاده کند، برای مثال `svc:openclaw`.
  Tailscale نیاز دارد میزبان‌های Service نودهای برچسب‌گذاری‌شده باشند، و ممکن است Service پیش از اینکه Serve بتواند آن را منتشر کند
  در کنسول مدیریت نیاز به تأیید داشته باشد.
- اگر می‌خواهید OpenClaw هنگام خاموش شدن پیکربندی `tailscale serve`
  یا `tailscale funnel` را برگرداند، `gateway.tailscale.resetOnExit` را تنظیم کنید.
- برای زنده نگه داشتن مسیر `tailscale funnel` که خارجاً پیکربندی شده است
  در میان راه‌اندازی‌های دوباره gateway، `gateway.tailscale.preserveFunnel: true` را تنظیم کنید. وقتی فعال باشد و
  gateway در `mode: "serve"` اجرا شود، OpenClaw پیش از اعمال دوباره Serve، `tailscale funnel status`
  را بررسی می‌کند و وقتی یک مسیر Funnel از قبل پورت gateway را پوشش داده باشد، از آن عبور می‌کند.
  سیاست Funnel مدیریت‌شده توسط OpenClaw که فقط گذرواژه را می‌پذیرد، بدون تغییر می‌ماند.
- `gateway.bind: "tailnet"` یک bind مستقیم Tailnet است (بدون HTTPS، بدون Serve/Funnel).
- `gateway.bind: "auto"`، loopback را ترجیح می‌دهد؛ اگر فقط Tailnet می‌خواهید، از `tailnet` استفاده کنید.
- Serve/Funnel فقط **رابط کنترل Gateway + WS** را در دسترس قرار می‌دهند. نودها از طریق
  همان endpoint مربوط به Gateway WS متصل می‌شوند، بنابراین Serve می‌تواند برای دسترسی نود هم کار کند.

## کنترل مرورگر (Gateway راه دور + مرورگر محلی)

اگر Gateway را روی یک ماشین اجرا می‌کنید اما می‌خواهید مرورگری را روی ماشین دیگری کنترل کنید،
یک **میزبان نود** روی ماشین مرورگر اجرا کنید و هر دو را روی همان tailnet نگه دارید.
Gateway کنش‌های مرورگر را به نود proxy می‌کند؛ نیازی به سرور کنترل جداگانه یا URL مربوط به Serve نیست.

برای کنترل مرورگر از Funnel پرهیز کنید؛ جفت‌سازی نود را مانند دسترسی اپراتور در نظر بگیرید.

## پیش‌نیازها + محدودیت‌های Tailscale

- Serve نیاز دارد HTTPS برای tailnet شما فعال باشد؛ اگر فعال نباشد، CLI درخواست می‌دهد.
- Serve سرآیندهای هویت Tailscale را تزریق می‌کند؛ Funnel این کار را نمی‌کند.
- Funnel به Tailscale v1.38.3+، MagicDNS، فعال بودن HTTPS، و یک ویژگی نود funnel نیاز دارد.
- Funnel فقط از پورت‌های `443`، `8443`، و `10000` روی TLS پشتیبانی می‌کند.
- Funnel روی macOS به گونه متن‌باز اپ Tailscale نیاز دارد.

## بیشتر بدانید

- نمای کلی Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- فرمان `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- نمای کلی Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- فرمان `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## مرتبط

- [دسترسی راه دور](/fa/gateway/remote)
- [کشف](/fa/gateway/discovery)
- [احراز هویت](/fa/gateway/authentication)
