---
read_when:
    - در دسترس قرار دادن رابط کاربری کنترل Gateway خارج از localhost
    - خودکارسازی دسترسی به شبکهٔ تیل‌نت یا داشبورد عمومی
summary: Serve/Funnel یکپارچهٔ Tailscale برای داشبورد Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:45:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw می‌تواند Tailscale **Serve** (tailnet) یا **Funnel** (عمومی) را به‌طور خودکار برای
داشبورد Gateway و پورت WebSocket پیکربندی کند. این کار باعث می‌شود Gateway به حلقه بازگشت متصل بماند، در حالی که
Tailscale، HTTPS، مسیریابی، و (برای Serve) سرآیندهای هویت را فراهم می‌کند.

## حالت‌ها

- `serve`: Serve فقط مخصوص Tailnet از طریق `tailscale serve`. Gateway روی `127.0.0.1` باقی می‌ماند.
- `funnel`: HTTPS عمومی از طریق `tailscale funnel`. OpenClaw به یک گذرواژه مشترک نیاز دارد.
- `off`: پیش‌فرض (بدون خودکارسازی Tailscale).

خروجی وضعیت و حسابرسی از **نمایانی Tailscale** برای این حالت Serve/Funnel در OpenClaw
استفاده می‌کند. `off` یعنی OpenClaw، Serve یا Funnel را مدیریت نمی‌کند؛ به این معنی نیست که
daemon محلی Tailscale متوقف شده یا از حساب خارج شده است.

## احراز هویت

برای کنترل دست‌دهی، `gateway.auth.mode` را تنظیم کنید:

- `none` (فقط ورود خصوصی)
- `token` (پیش‌فرض وقتی `OPENCLAW_GATEWAY_TOKEN` تنظیم شده باشد)
- `password` (راز مشترک از طریق `OPENCLAW_GATEWAY_PASSWORD` یا پیکربندی)
- `trusted-proxy` (پروکسی معکوس آگاه از هویت؛ [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth) را ببینید)

وقتی `tailscale.mode = "serve"` و `gateway.auth.allowTailscale` برابر `true` باشد،
احراز هویت رابط کاربری کنترل/WebSocket می‌تواند بدون ارائه توکن/گذرواژه از سرآیندهای هویت Tailscale
(`tailscale-user-login`) استفاده کند. OpenClaw هویت را با حل‌کردن نشانی `x-forwarded-for` از طریق daemon محلی Tailscale
(`tailscale whois`) و تطبیق آن با سرآیند پیش از پذیرش، تأیید می‌کند.
OpenClaw فقط زمانی یک درخواست را Serve در نظر می‌گیرد که از حلقه بازگشت و همراه با
سرآیندهای `x-forwarded-for`، `x-forwarded-proto` و `x-forwarded-host` مربوط به Tailscale
وارد شود.
برای نشست‌های اپراتور رابط کاربری کنترل که شامل هویت دستگاه مرورگر هستند، این
مسیر Serve تأییدشده همچنین رفت‌وبرگشت جفت‌سازی دستگاه را رد می‌کند. این کار
هویت دستگاه مرورگر را دور نمی‌زند: کلاینت‌های بدون دستگاه همچنان رد می‌شوند، و اتصال‌های WebSocket
با نقش node یا غیر از رابط کاربری کنترل همچنان بررسی‌های عادی جفت‌سازی و
احراز هویت را دنبال می‌کنند.
نقاط پایانی HTTP API (برای مثال `/v1/*`، `/tools/invoke` و `/api/channels/*`)
از احراز هویت با سرآیند هویت Tailscale استفاده **نمی‌کنند**. آن‌ها همچنان حالت عادی احراز هویت HTTP مربوط به gateway را
دنبال می‌کنند: احراز هویت با راز مشترک به‌طور پیش‌فرض، یا یک راه‌اندازی عمداً
پیکربندی‌شده `none` برای پروکسی مورد اعتماد / ورود خصوصی.
این جریان بدون توکن فرض می‌کند میزبان gateway مورد اعتماد است. اگر ممکن است کد محلی نامطمئن
روی همان میزبان اجرا شود، `gateway.auth.allowTailscale` را غیرفعال کنید و به‌جای آن
احراز هویت با توکن/گذرواژه را الزامی کنید.
برای الزامی‌کردن اعتبارنامه‌های صریح راز مشترک، `gateway.auth.allowTailscale: false`
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

### فقط Tailnet (اتصال به IP Tailnet)

وقتی می‌خواهید Gateway مستقیماً روی IP Tailnet گوش کند، از این استفاده کنید (بدون Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

اتصال از دستگاه Tailnet دیگر:

- رابط کاربری کنترل: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
حلقه بازگشت (`http://127.0.0.1:18789`) در این حالت کار **نخواهد کرد**.
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

`OPENCLAW_GATEWAY_PASSWORD` را به ثبت گذرواژه روی دیسک ترجیح دهید.

## نمونه‌های CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## نکته‌ها

- Tailscale Serve/Funnel نیاز دارد CLI مربوط به `tailscale` نصب شده و وارد حساب شده باشد.
- `tailscale.mode: "funnel"` برای جلوگیری از نمایانی عمومی، شروع به کار را رد می‌کند مگر اینکه حالت احراز هویت `password` باشد.
- اگر می‌خواهید OpenClaw هنگام خاموشی پیکربندی `tailscale serve`
  یا `tailscale funnel` را برگرداند، `gateway.tailscale.resetOnExit` را تنظیم کنید.
- برای زنده نگه داشتن یک مسیر `tailscale funnel` که به‌صورت خارجی پیکربندی شده است
  در میان راه‌اندازی‌های دوباره gateway، `gateway.tailscale.preserveFunnel: true` را تنظیم کنید. وقتی فعال باشد و
  gateway در `mode: "serve"` اجرا شود، OpenClaw پیش از اعمال دوباره Serve، `tailscale funnel status` را بررسی می‌کند
  و وقتی یک مسیر Funnel از قبل پورت gateway را پوشش دهد، آن را رد می‌کند. سیاست فقط-گذرواژه Funnel مدیریت‌شده توسط OpenClaw تغییر نمی‌کند.
- `gateway.bind: "tailnet"` یک اتصال مستقیم Tailnet است (بدون HTTPS، بدون Serve/Funnel).
- `gateway.bind: "auto"` حلقه بازگشت را ترجیح می‌دهد؛ اگر فقط Tailnet می‌خواهید، از `tailnet` استفاده کنید.
- Serve/Funnel فقط **رابط کاربری کنترل Gateway + WS** را در معرض دسترسی قرار می‌دهد. nodeها از طریق
  همان نقطه پایانی WS مربوط به Gateway متصل می‌شوند، بنابراین Serve می‌تواند برای دسترسی node کار کند.

## کنترل مرورگر (Gateway راه دور + مرورگر محلی)

اگر Gateway را روی یک ماشین اجرا می‌کنید اما می‌خواهید مرورگری را روی ماشین دیگری کنترل کنید،
یک **میزبان node** روی ماشین مرورگر اجرا کنید و هر دو را روی همان tailnet نگه دارید.
Gateway کنش‌های مرورگر را به node پروکسی می‌کند؛ سرور کنترل جداگانه یا URL مربوط به Serve لازم نیست.

برای کنترل مرورگر از Funnel پرهیز کنید؛ جفت‌سازی node را مانند دسترسی اپراتور در نظر بگیرید.

## پیش‌نیازها + محدودیت‌های Tailscale

- Serve نیاز دارد HTTPS برای tailnet شما فعال باشد؛ اگر موجود نباشد، CLI درخواست می‌دهد.
- Serve سرآیندهای هویت Tailscale را تزریق می‌کند؛ Funnel این کار را نمی‌کند.
- Funnel به Tailscale v1.38.3+، MagicDNS، HTTPS فعال و یک ویژگی node از نوع funnel نیاز دارد.
- Funnel فقط از پورت‌های `443`، `8443` و `10000` روی TLS پشتیبانی می‌کند.
- Funnel روی macOS به گونه متن‌باز برنامه Tailscale نیاز دارد.

## بیشتر بدانید

- نمای کلی Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- فرمان `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- نمای کلی Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- فرمان `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## مرتبط

- [دسترسی راه دور](/fa/gateway/remote)
- [کشف](/fa/gateway/discovery)
- [احراز هویت](/fa/gateway/authentication)
