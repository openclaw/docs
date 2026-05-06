---
read_when:
    - در دسترس قرار دادن رابط کاربری کنترل Gateway خارج از localhost
    - خودکارسازی دسترسی به شبکهٔ تیل‌نت یا داشبورد عمومی
summary: یکپارچه‌سازی Tailscale Serve/Funnel برای داشبورد Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T17:57:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw می‌تواند Tailscale **Serve** (tailnet) یا **Funnel** (عمومی) را برای داشبورد Gateway و پورت WebSocket به‌صورت خودکار پیکربندی کند. این کار باعث می‌شود Gateway همچنان به loopback متصل بماند، در حالی که Tailscale‏ HTTPS، مسیریابی، و (برای Serve) سرآیندهای هویت را فراهم می‌کند.

## حالت‌ها

- `serve`: ‏Serve فقط برای Tailnet از طریق `tailscale serve`. ‏Gateway روی `127.0.0.1` باقی می‌ماند.
- `funnel`: ‏HTTPS عمومی از طریق `tailscale funnel`. ‏OpenClaw به یک گذرواژهٔ مشترک نیاز دارد.
- `off`: پیش‌فرض (بدون خودکارسازی Tailscale).

خروجی وضعیت و حسابرسی از **در معرض‌گذاری Tailscale** برای این حالت Serve/Funnel در OpenClaw استفاده می‌کند. `off` یعنی OpenClaw مدیریت Serve یا Funnel را انجام نمی‌دهد؛ به این معنا نیست که دیمون محلی Tailscale متوقف شده یا از حساب خارج شده است.

## احراز هویت

برای کنترل دست‌دهی، `gateway.auth.mode` را تنظیم کنید:

- `none` (فقط ورودی خصوصی)
- `token` (پیش‌فرض وقتی `OPENCLAW_GATEWAY_TOKEN` تنظیم شده باشد)
- `password` (راز مشترک از طریق `OPENCLAW_GATEWAY_PASSWORD` یا پیکربندی)
- `trusted-proxy` (پراکسی معکوس آگاه از هویت؛ [احراز هویت پراکسی معتمد](/fa/gateway/trusted-proxy-auth) را ببینید)

وقتی `tailscale.mode = "serve"` و `gateway.auth.allowTailscale` برابر `true` باشد، احراز هویت Control UI/WebSocket می‌تواند بدون ارائهٔ توکن/گذرواژه از سرآیندهای هویت Tailscale (`tailscale-user-login`) استفاده کند. OpenClaw هویت را با resolve کردن نشانی `x-forwarded-for` از طریق دیمون محلی Tailscale (`tailscale whois`) و تطبیق آن با سرآیند، پیش از پذیرش، تأیید می‌کند. OpenClaw فقط زمانی یک درخواست را Serve در نظر می‌گیرد که از loopback و همراه با سرآیندهای `x-forwarded-for`، `x-forwarded-proto` و `x-forwarded-host` متعلق به Tailscale برسد.
برای نشست‌های اپراتور Control UI که شامل هویت دستگاه مرورگر هستند، این مسیر Serve تأییدشده همچنین رفت‌وبرگشت جفت‌سازی دستگاه را رد می‌کند. این مسیر هویت دستگاه مرورگر را دور نمی‌زند: کلاینت‌های بدون دستگاه همچنان رد می‌شوند، و اتصال‌های WebSocket با نقش node یا غیر Control UI همچنان بررسی‌های عادی جفت‌سازی و احراز هویت را دنبال می‌کنند.
نقاط پایانی HTTP API (برای مثال `/v1/*`،‏ `/tools/invoke` و `/api/channels/*`) از احراز هویت مبتنی بر سرآیند هویت Tailscale استفاده **نمی‌کنند**. آن‌ها همچنان حالت عادی احراز هویت HTTP در gateway را دنبال می‌کنند: احراز هویت با راز مشترک به‌صورت پیش‌فرض، یا یک راه‌اندازی `none` برای trusted-proxy / private-ingress که عمداً پیکربندی شده باشد.
این جریان بدون توکن فرض می‌کند میزبان gateway معتمد است. اگر ممکن است کد محلی نامطمئن روی همان میزبان اجرا شود، `gateway.auth.allowTailscale` را غیرفعال کنید و به‌جای آن احراز هویت با توکن/گذرواژه را الزامی کنید.
برای الزامی کردن اعتبارنامه‌های صریح مبتنی بر راز مشترک، `gateway.auth.allowTailscale: false` را تنظیم کنید و از `gateway.auth.mode: "token"` یا `"password"` استفاده کنید.

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

باز کردن: `https://<magicdns>/` (یا `gateway.controlUi.basePath` پیکربندی‌شدهٔ شما)

### فقط Tailnet (اتصال به IP‏ Tailnet)

وقتی می‌خواهید Gateway مستقیماً روی IP‏ Tailnet گوش کند (بدون Serve/Funnel)، از این حالت استفاده کنید.

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

اتصال از یک دستگاه Tailnet دیگر:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) در این حالت کار **نخواهد** کرد.
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

به‌جای ثبت گذرواژه روی دیسک، `OPENCLAW_GATEWAY_PASSWORD` را ترجیح دهید.

## نمونه‌های CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## نکته‌ها

- Tailscale Serve/Funnel نیاز دارد CLI‏ `tailscale` نصب شده و وارد حساب شده باشد.
- `tailscale.mode: "funnel"` برای جلوگیری از در معرض‌گذاری عمومی، مگر اینکه حالت احراز هویت `password` باشد، از شروع به کار خودداری می‌کند.
- اگر می‌خواهید OpenClaw هنگام خاموش‌شدن پیکربندی `tailscale serve` یا `tailscale funnel` را برگرداند، `gateway.tailscale.resetOnExit` را تنظیم کنید.
- `gateway.bind: "tailnet"` یک اتصال مستقیم Tailnet است (بدون HTTPS، بدون Serve/Funnel).
- `gateway.bind: "auto"`‏ loopback را ترجیح می‌دهد؛ اگر فقط Tailnet می‌خواهید، از `tailnet` استفاده کنید.
- Serve/Funnel فقط **رابط کنترل Gateway + WS** را در معرض قرار می‌دهند. Nodeها از طریق همان نقطهٔ پایانی WS در Gateway وصل می‌شوند، بنابراین Serve می‌تواند برای دسترسی node هم کار کند.

## کنترل مرورگر (Gateway راه‌دور + مرورگر محلی)

اگر Gateway را روی یک ماشین اجرا می‌کنید اما می‌خواهید مرورگری را روی ماشین دیگری کنترل کنید، روی ماشین مرورگر یک **میزبان node** اجرا کنید و هر دو را روی یک tailnet نگه دارید.
Gateway کنش‌های مرورگر را به node پراکسی می‌کند؛ به سرور کنترل جداگانه یا URL‏ Serve جداگانه نیاز نیست.

برای کنترل مرورگر از Funnel پرهیز کنید؛ با جفت‌سازی node مانند دسترسی اپراتور برخورد کنید.

## پیش‌نیازها + محدودیت‌های Tailscale

- Serve نیاز دارد HTTPS برای tailnet شما فعال باشد؛ اگر موجود نباشد، CLI درخواست می‌دهد.
- Serve سرآیندهای هویت Tailscale را تزریق می‌کند؛ Funnel این کار را نمی‌کند.
- Funnel به Tailscale v1.38.3+،‏ MagicDNS،‏ HTTPS فعال، و یک ویژگی node از نوع funnel نیاز دارد.
- Funnel فقط از پورت‌های `443`،‏ `8443` و `10000` روی TLS پشتیبانی می‌کند.
- Funnel روی macOS به گونهٔ متن‌باز برنامهٔ Tailscale نیاز دارد.

## بیشتر بیاموزید

- نمای کلی Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- فرمان `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- نمای کلی Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- فرمان `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## مرتبط

- [دسترسی راه‌دور](/fa/gateway/remote)
- [کشف](/fa/gateway/discovery)
- [احراز هویت](/fa/gateway/authentication)
