---
read_when:
    - ساخت یا اشکال‌زدایی کلاینت‌های Node (حالت Node در iOS/Android/macOS)
    - بررسی خرابی‌های جفت‌سازی یا احراز هویت پل
    - ممیزی سطح Node که توسط Gateway در معرض قرار می‌گیرد
summary: 'پروتکل پل تاریخی (گره‌های قدیمی): TCP JSONL، جفت‌سازی، RPC محدوده‌دار'
title: پروتکل پل
x-i18n:
    generated_at: "2026-04-29T22:49:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
پل TCP **حذف شده است**. بیلدهای فعلی OpenClaw شنونده‌ی پل را ارائه نمی‌کنند و کلیدهای پیکربندی `bridge.*` دیگر در schema وجود ندارند. این صفحه فقط برای ارجاع تاریخی نگه داشته شده است. برای همه‌ی کلاینت‌های node/operator از [Gateway Protocol](/fa/gateway/protocol) استفاده کنید.
</Warning>

## چرا وجود داشت

- **مرز امنیتی**: پل به‌جای کل سطح API مربوط به Gateway، یک allowlist کوچک را در معرض دسترس قرار می‌دهد.
- **جفت‌سازی + هویت Node**: پذیرش Node در مالکیت Gateway است و به یک توکن اختصاصی برای هر Node گره خورده است.
- **تجربه‌ی کشف**: Nodeها می‌توانند Gatewayها را از طریق Bonjour روی LAN کشف کنند، یا مستقیماً از طریق یک tailnet وصل شوند.
- **Loopback WS**: سطح کنترل کامل WS محلی می‌ماند مگر اینکه از طریق SSH تونل شود.

## انتقال

- TCP، یک شیء JSON در هر خط (JSONL).
- TLS اختیاری (وقتی `bridge.tls.enabled` برابر true باشد).
- پورت پیش‌فرض تاریخی شنونده `18790` بود (بیلدهای فعلی یک پل TCP را شروع نمی‌کنند).

وقتی TLS فعال باشد، رکوردهای TXT کشف شامل `bridgeTls=1` به‌همراه `bridgeTlsSha256` به‌عنوان یک راهنمای غیرمحرمانه هستند. توجه داشته باشید که رکوردهای TXT مربوط به Bonjour/mDNS احراز اصالت نمی‌شوند؛ کلاینت‌ها نباید اثرانگشت تبلیغ‌شده را بدون قصد صریح کاربر یا راستی‌آزمایی out-of-band دیگر، به‌عنوان pin معتبر در نظر بگیرند.

## دست‌دهی + جفت‌سازی

1. کلاینت `hello` را با فراداده‌ی Node + توکن ارسال می‌کند (اگر از قبل جفت شده باشد).
2. اگر جفت نشده باشد، Gateway با `error` پاسخ می‌دهد (`NOT_PAIRED`/`UNAUTHORIZED`).
3. کلاینت `pair-request` را ارسال می‌کند.
4. Gateway منتظر تأیید می‌ماند، سپس `pair-ok` و `hello-ok` را ارسال می‌کند.

از نظر تاریخی، `hello-ok` مقدار `serverName` را برمی‌گرداند و می‌توانست شامل `canvasHostUrl` باشد.

## فریم‌ها

کلاینت → Gateway:

- `req` / `res`: RPC محدودشده‌ی Gateway (chat، sessions، config، health، voicewake، skills.bins)
- `event`: سیگنال‌های Node (رونویسی صوتی، درخواست agent، اشتراک chat، چرخه‌ی عمر exec)

Gateway → کلاینت:

- `invoke` / `invoke-res`: فرمان‌های Node (`canvas.*`، `camera.*`، `screen.record`،
  `location.get`، `sms.send`)
- `event`: به‌روزرسانی‌های chat برای sessionهای مشترک‌شده
- `ping` / `pong`: keepalive

اعمال allowlist قدیمی در `src/gateway/server-bridge.ts` قرار داشت (حذف شده است).

## رویدادهای چرخه‌ی عمر Exec

Nodeها می‌توانند رویدادهای `exec.finished` یا `exec.denied` را منتشر کنند تا فعالیت system.run را نمایش دهند.
این‌ها در Gateway به رویدادهای سیستم نگاشت می‌شوند. (Nodeهای قدیمی ممکن است همچنان `exec.started` را منتشر کنند.)

فیلدهای payload (همه اختیاری هستند مگر اینکه ذکر شده باشد):

- `sessionKey` (الزامی): session مربوط به agent برای دریافت رویداد سیستم.
- `runId`: شناسه‌ی exec یکتا برای گروه‌بندی.
- `command`: رشته‌ی فرمان خام یا قالب‌بندی‌شده.
- `exitCode`، `timedOut`، `success`، `output`: جزئیات تکمیل (فقط finished).
- `reason`: دلیل رد شدن (فقط denied).

## استفاده‌ی تاریخی از tailnet

- پل را به یک IP مربوط به tailnet متصل کنید: `bridge.bind: "tailnet"` در
  `~/.openclaw/openclaw.json` (فقط تاریخی؛ `bridge.*` دیگر معتبر نیست).
- کلاینت‌ها از طریق نام MagicDNS یا IP مربوط به tailnet وصل می‌شوند.
- Bonjour از شبکه‌ها عبور نمی‌کند؛ در صورت نیاز از host/port دستی یا wide-area DNS‑SD استفاده کنید.

## نسخه‌بندی

پل **implicit v1** بود (بدون مذاکره‌ی min/max). این بخش فقط ارجاع تاریخی است؛ کلاینت‌های فعلی node/operator از WebSocket
[Gateway Protocol](/fa/gateway/protocol) استفاده می‌کنند.

## مرتبط

- [پروتکل Gateway](/fa/gateway/protocol)
- [Nodeها](/fa/nodes)
