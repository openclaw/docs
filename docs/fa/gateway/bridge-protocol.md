---
read_when:
    - ساخت یا اشکال‌زدایی کلاینت‌های Node (حالت Node در iOS/Android/macOS)
    - بررسی خرابی‌های احراز هویت در جفت‌سازی یا پل
    - ممیزی سطح Node که توسط Gateway در معرض قرار گرفته است
summary: 'پروتکل پل تاریخی (گره‌های قدیمی): TCP JSONL، جفت‌سازی، RPC محدوده‌دار'
title: پروتکل پل
x-i18n:
    generated_at: "2026-05-06T17:56:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
پل TCP **حذف شده است**. بیلدهای فعلی OpenClaw شنوندهٔ پل را عرضه نمی‌کنند و کلیدهای پیکربندی `bridge.*` دیگر در schema نیستند. این صفحه فقط برای مرجع تاریخی نگه داشته شده است. برای همهٔ کلاینت‌های Node/اپراتور از [پروتکل Gateway](/fa/gateway/protocol) استفاده کنید.
</Warning>

## چرا وجود داشت

- **مرز امنیتی**: پل به‌جای سطح کامل API Gateway، یک allowlist کوچک را در معرض قرار می‌دهد.
- **جفت‌سازی + هویت Node**: پذیرش Node در مالکیت Gateway است و به یک توکن ویژهٔ هر Node گره خورده است.
- **تجربهٔ کاربری کشف**: Nodeها می‌توانند Gatewayها را از طریق Bonjour روی LAN کشف کنند، یا مستقیماً از طریق یک tailnet متصل شوند.
- **WS Loopback**: صفحهٔ کنترل کامل WS محلی می‌ماند، مگر اینکه از طریق SSH تونل شود.

## انتقال

- TCP، یک شیء JSON در هر خط (JSONL).
- TLS اختیاری (وقتی `bridge.tls.enabled` برابر true باشد).
- پورت پیش‌فرض تاریخی شنونده `18790` بود (بیلدهای فعلی پل TCP را راه‌اندازی نمی‌کنند).

وقتی TLS فعال باشد، رکوردهای TXT کشف شامل `bridgeTls=1` به‌همراه
`bridgeTlsSha256` به‌عنوان یک راهنمای غیرمحرمانه هستند. توجه کنید که رکوردهای TXT مربوط به Bonjour/mDNS
احراز اصالت نمی‌شوند؛ کلاینت‌ها نباید اثرانگشت تبلیغ‌شده را بدون قصد صریح کاربر یا راستی‌آزمایی بیرون‌از‌باند دیگر، به‌عنوان یک pin معتبر در نظر بگیرند.

## دست‌دهی + جفت‌سازی

1. کلاینت `hello` را همراه با فرادادهٔ Node + توکن ارسال می‌کند (اگر قبلاً جفت شده باشد).
2. اگر جفت نشده باشد، Gateway با `error` (`NOT_PAIRED`/`UNAUTHORIZED`) پاسخ می‌دهد.
3. کلاینت `pair-request` را ارسال می‌کند.
4. Gateway منتظر تأیید می‌ماند، سپس `pair-ok` و `hello-ok` را ارسال می‌کند.

در گذشته، `hello-ok` مقدار `serverName` را برمی‌گرداند و می‌توانست شامل
`canvasHostUrl` باشد.

## فریم‌ها

کلاینت → Gateway:

- `req` / `res`: RPC محدودشدهٔ Gateway (chat، sessions، config، health، voicewake، skills.bins)
- `event`: سیگنال‌های Node (رونوشت صوتی، درخواست agent، اشتراک chat، چرخهٔ عمر exec)

Gateway → کلاینت:

- `invoke` / `invoke-res`: فرمان‌های Node (`canvas.*`، `camera.*`، `screen.record`،
  `location.get`، `sms.send`)
- `event`: به‌روزرسانی‌های chat برای نشست‌های مشترک‌شده
- `ping` / `pong`: keepalive

اعمال allowlist قدیمی در `src/gateway/server-bridge.ts` قرار داشت (حذف شده است).

## رویدادهای چرخهٔ عمر exec

Nodeها می‌توانند رویدادهای `exec.finished` یا `exec.denied` را برای نمایش فعالیت system.run منتشر کنند.
این‌ها در Gateway به رویدادهای سیستمی نگاشت می‌شوند. (Nodeهای قدیمی ممکن است هنوز `exec.started` منتشر کنند.)

فیلدهای payload (همه اختیاری هستند، مگر اینکه ذکر شده باشد):

- `sessionKey` (الزامی): نشست agent که رویداد سیستمی را دریافت می‌کند.
- `runId`: شناسهٔ exec یکتا برای گروه‌بندی.
- `command`: رشتهٔ فرمان خام یا قالب‌بندی‌شده.
- `exitCode`، `timedOut`، `success`، `output`: جزئیات تکمیل (فقط finished).
- `reason`: دلیل رد شدن (فقط denied).

## استفادهٔ تاریخی از tailnet

- پل را به یک IP مربوط به tailnet bind کنید: `bridge.bind: "tailnet"` در
  `~/.openclaw/openclaw.json` (فقط تاریخی؛ `bridge.*` دیگر معتبر نیست).
- کلاینت‌ها از طریق نام MagicDNS یا IP مربوط به tailnet متصل می‌شوند.
- Bonjour از شبکه‌ها عبور نمی‌کند؛ در صورت نیاز از میزبان/پورت دستی یا DNS-SD گسترده استفاده کنید.

## نسخه‌بندی

پل **implicit v1** بود (بدون مذاکرهٔ min/max). این بخش فقط مرجع تاریخی است؛ کلاینت‌های فعلی Node/اپراتور از WebSocket
[پروتکل Gateway](/fa/gateway/protocol) استفاده می‌کنند.

## مرتبط

- [پروتکل Gateway](/fa/gateway/protocol)
- [Nodeها](/fa/nodes)
