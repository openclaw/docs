---
read_when:
    - در دسترس قرار دادن رابط کاربری کنترل Gateway خارج از localhost
    - خودکارسازی دسترسی به شبکهٔ Tailscale یا داشبورد عمومی
summary: Serve/Funnel یکپارچهٔ Tailscale برای داشبورد Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-29T22:56:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw می‌تواند Tailscale **Serve** (tailnet) یا **Funnel** (عمومی) را برای داشبورد Gateway و پورت WebSocket به‌صورت خودکار پیکربندی کند. این کار Gateway را همچنان به loopback محدود نگه می‌دارد، در حالی که Tailscale HTTPS، مسیریابی، و (برای Serve) سرآیندهای هویت را فراهم می‌کند.

## حالت‌ها

- `serve`: Serve فقط مخصوص tailnet از طریق `tailscale serve`. Gateway روی `127.0.0.1` باقی می‌ماند.
- `funnel`: HTTPS عمومی از طریق `tailscale funnel`. OpenClaw به یک گذرواژه مشترک نیاز دارد.
- `off`: پیش‌فرض (بدون خودکارسازی Tailscale).

خروجی وضعیت و حسابرسی برای این حالت Serve/Funnel در OpenClaw از **در معرض‌بودن از طریق Tailscale** استفاده می‌کند. `off` یعنی OpenClaw مدیریت Serve یا Funnel را انجام نمی‌دهد؛ به این معنا نیست که daemon محلی Tailscale متوقف شده یا از حساب خارج شده است.

## احراز هویت

برای کنترل handshake، `gateway.auth.mode` را تنظیم کنید:

- `none` (فقط ورود خصوصی)
- `token` (پیش‌فرض وقتی `OPENCLAW_GATEWAY_TOKEN` تنظیم شده باشد)
- `password` (راز مشترک از طریق `OPENCLAW_GATEWAY_PASSWORD` یا پیکربندی)
- `trusted-proxy` (reverse proxy آگاه از هویت؛ [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth) را ببینید)

وقتی `tailscale.mode = "serve"` باشد و `gateway.auth.allowTailscale` برابر `true` باشد، احراز هویت رابط کاربری کنترل/WebSocket می‌تواند بدون ارائه token/password از سرآیندهای هویت Tailscale (`tailscale-user-login`) استفاده کند. OpenClaw هویت را با resolve کردن نشانی `x-forwarded-for` از طریق daemon محلی Tailscale (`tailscale whois`) و تطبیق آن با سرآیند، پیش از پذیرش آن، تأیید می‌کند. OpenClaw فقط وقتی یک درخواست را Serve در نظر می‌گیرد که از loopback همراه با سرآیندهای `x-forwarded-for`، `x-forwarded-proto` و `x-forwarded-host` متعلق به Tailscale وارد شود.
برای نشست‌های اپراتور رابط کاربری کنترل که شامل هویت دستگاه مرورگر هستند، این مسیر Serve تأییدشده رفت‌وبرگشت جفت‌سازی دستگاه را نیز رد می‌کند. این کار هویت دستگاه مرورگر را دور نمی‌زند: کلاینت‌های بدون دستگاه همچنان رد می‌شوند، و اتصال‌های WebSocket مربوط به نقش node یا غیر از رابط کاربری کنترل همچنان بررسی‌های معمول جفت‌سازی و احراز هویت را دنبال می‌کنند.
endpointهای HTTP API (برای مثال `/v1/*`، `/tools/invoke` و `/api/channels/*`) از احراز هویت مبتنی بر سرآیند هویت Tailscale استفاده **نمی‌کنند**. آن‌ها همچنان حالت عادی احراز هویت HTTP Gateway را دنبال می‌کنند: به‌صورت پیش‌فرض احراز هویت با راز مشترک، یا یک پیکربندی آگاهانه با trusted-proxy / private-ingress `none`.
این جریان بدون token فرض می‌کند میزبان Gateway قابل اعتماد است. اگر ممکن است کد محلی نامطمئن روی همان میزبان اجرا شود، `gateway.auth.allowTailscale` را غیرفعال کنید و به‌جای آن احراز هویت token/password را الزامی کنید.
برای الزام به اعتبارنامه‌های صریح با راز مشترک، `gateway.auth.allowTailscale: false` را تنظیم کنید و از `gateway.auth.mode: "token"` یا `"password"` استفاده کنید.

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

باز کنید: `https://<magicdns>/` (یا `gateway.controlUi.basePath` پیکربندی‌شده شما)

### فقط tailnet (اتصال به IP tailnet)

وقتی می‌خواهید Gateway مستقیماً روی IP tailnet گوش دهد، از این استفاده کنید (بدون Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

از یک دستگاه دیگر در tailnet وصل شوید:

- رابط کاربری کنترل: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) در این حالت کار **نخواهد** کرد.
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

- Tailscale Serve/Funnel نیاز دارد CLI `tailscale` نصب شده و وارد حساب شده باشد.
- `tailscale.mode: "funnel"` برای جلوگیری از در معرض‌گذاری عمومی، تا وقتی حالت احراز هویت `password` نباشد از شروع شدن خودداری می‌کند.
- اگر می‌خواهید OpenClaw هنگام خاموش شدن پیکربندی `tailscale serve` یا `tailscale funnel` را برگرداند، `gateway.tailscale.resetOnExit` را تنظیم کنید.
- `gateway.bind: "tailnet"` اتصال مستقیم به tailnet است (بدون HTTPS، بدون Serve/Funnel).
- `gateway.bind: "auto"` loopback را ترجیح می‌دهد؛ اگر فقط tailnet می‌خواهید از `tailnet` استفاده کنید.
- Serve/Funnel فقط **رابط کاربری کنترل Gateway + WS** را در معرض قرار می‌دهند. Nodeها از طریق همان endpoint مربوط به Gateway WS وصل می‌شوند، بنابراین Serve می‌تواند برای دسترسی node کار کند.

## کنترل مرورگر (Gateway راه دور + مرورگر محلی)

اگر Gateway را روی یک ماشین اجرا می‌کنید اما می‌خواهید مرورگری را روی ماشین دیگری کنترل کنید، یک **میزبان node** روی ماشین مرورگر اجرا کنید و هر دو را در همان tailnet نگه دارید. Gateway کنش‌های مرورگر را به node پروکسی می‌کند؛ هیچ سرور کنترل جداگانه یا URL مربوط به Serve لازم نیست.

برای کنترل مرورگر از Funnel پرهیز کنید؛ جفت‌سازی node را مانند دسترسی اپراتور در نظر بگیرید.

## پیش‌نیازها و محدودیت‌های Tailscale

- Serve نیاز دارد HTTPS برای tailnet شما فعال باشد؛ اگر وجود نداشته باشد CLI درخواست فعال‌سازی می‌دهد.
- Serve سرآیندهای هویت Tailscale را تزریق می‌کند؛ Funnel این کار را نمی‌کند.
- Funnel به Tailscale v1.38.3+، MagicDNS، فعال بودن HTTPS و یک ویژگی node برای funnel نیاز دارد.
- Funnel فقط از پورت‌های `443`، `8443` و `10000` روی TLS پشتیبانی می‌کند.
- Funnel روی macOS به نسخه متن‌باز برنامه Tailscale نیاز دارد.

## بیشتر بدانید

- نمای کلی Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- دستور `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- نمای کلی Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- دستور `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## مرتبط

- [دسترسی راه دور](/fa/gateway/remote)
- [کشف](/fa/gateway/discovery)
- [احراز هویت](/fa/gateway/authentication)
