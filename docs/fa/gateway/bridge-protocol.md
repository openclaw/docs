---
read_when:
    - ساخت یا اشکال‌زدایی کلاینت‌های Node (حالت Node در iOS/Android/macOS)
    - بررسی خطاهای جفت‌سازی یا احراز هویت پل
    - ممیزی سطح Node که Gateway در معرض قرار می‌دهد
summary: 'پروتکل پل تاریخی (گره‌های قدیمی): TCP JSONL، جفت‌سازی، RPC محدوده‌دار'
title: پروتکل پل
x-i18n:
    generated_at: "2026-05-07T13:18:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc906ca3a8a4ebef9b39c53187bcb4d06b287875b8e8748a168812f9a52e6152
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
پل TCP **حذف شده است**. بیلدهای فعلی OpenClaw شنوندهٔ پل را ارائه نمی‌کنند و کلیدهای پیکربندی `bridge.*` دیگر در schema نیستند. این صفحه فقط برای ارجاع تاریخی نگه داشته شده است. برای همهٔ کلاینت‌های Node/اپراتور از [پروتکل Gateway](/fa/gateway/protocol) استفاده کنید.
</Warning>

## چرا وجود داشت

- **مرز امنیتی**: پل به‌جای سطح کامل API Gateway، یک فهرست مجاز کوچک را در معرض دسترس قرار می‌دهد.
- **جفت‌سازی + هویت Node**: پذیرش Node در اختیار Gateway است و به یک توکن اختصاصی برای هر Node گره خورده است.
- **تجربهٔ کاربری کشف**: Nodeها می‌توانند Gatewayها را از طریق Bonjour روی LAN کشف کنند، یا مستقیماً از طریق یک tailnet وصل شوند.
- **WS حلقهٔ محلی**: صفحهٔ کنترل کامل WS محلی می‌ماند مگر اینکه از طریق SSH تونل شود.

## انتقال

- TCP، یک شیء JSON در هر خط (JSONL).
- TLS اختیاری (وقتی `bridge.tls.enabled` برابر true باشد).
- پورت پیش‌فرض تاریخی شنونده `18790` بود (بیلدهای فعلی پل TCP را راه‌اندازی نمی‌کنند).

وقتی TLS فعال باشد، رکوردهای TXT کشف شامل `bridgeTls=1` به‌همراه `bridgeTlsSha256` به‌عنوان یک اشارهٔ غیرمحرمانه هستند. توجه کنید که رکوردهای TXT مربوط به Bonjour/mDNS احراز اصالت نمی‌شوند؛ کلاینت‌ها نباید اثرانگشت اعلام‌شده را بدون قصد صریح کاربر یا راستی‌آزمایی خارج از باند دیگر، به‌عنوان یک pin معتبر تلقی کنند.

## دست‌دهی + جفت‌سازی

1. کلاینت `hello` را همراه با فرادادهٔ Node + توکن ارسال می‌کند (اگر از قبل جفت شده باشد).
2. اگر جفت نشده باشد، Gateway با `error` (`NOT_PAIRED`/`UNAUTHORIZED`) پاسخ می‌دهد.
3. کلاینت `pair-request` را ارسال می‌کند.
4. Gateway منتظر تأیید می‌ماند، سپس `pair-ok` و `hello-ok` را ارسال می‌کند.

در گذشته، `hello-ok` مقدار `serverName` را برمی‌گرداند؛ سطح‌های Plugin میزبانی‌شده اکنون از طریق `pluginSurfaceUrls` اعلام می‌شوند. Canvas/A2UI از `pluginSurfaceUrls.canvas` استفاده می‌کند؛ نام مستعار منسوخ `canvasHostUrl` بخشی از پروتکل بازطراحی‌شده نیست.

## فریم‌ها

کلاینت → Gateway:

- `req` / `res`: RPC محدوده‌دار Gateway (chat, sessions, config, health, voicewake, skills.bins)
- `event`: سیگنال‌های Node (رونوشت صوتی، درخواست عامل، اشتراک چت، چرخهٔ عمر exec)

Gateway → کلاینت:

- `invoke` / `invoke-res`: فرمان‌های Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: به‌روزرسانی‌های چت برای نشست‌های مشترک‌شده
- `ping` / `pong`: زنده‌نگهدار

اعمال فهرست مجاز قدیمی در `src/gateway/server-bridge.ts` قرار داشت (حذف شده است).

## رویدادهای چرخهٔ عمر exec

Nodeها می‌توانند رویدادهای `exec.finished` یا `exec.denied` را منتشر کنند تا فعالیت system.run را نمایان کنند.
این‌ها در Gateway به رویدادهای سیستم نگاشت می‌شوند. (Nodeهای قدیمی ممکن است همچنان `exec.started` را منتشر کنند.)

فیلدهای payload (همه اختیاری‌اند مگر خلافش ذکر شده باشد):

- `sessionKey` (ضروری): نشست عامل برای دریافت رویداد سیستم.
- `runId`: شناسهٔ یکتای exec برای گروه‌بندی.
- `command`: رشتهٔ فرمان خام یا قالب‌بندی‌شده.
- `exitCode`, `timedOut`, `success`, `output`: جزئیات تکمیل (فقط finished).
- `reason`: دلیل رد شدن (فقط denied).

## استفادهٔ تاریخی از tailnet

- پل را به یک IP مربوط به tailnet متصل کنید: `bridge.bind: "tailnet"` در
  `~/.openclaw/openclaw.json` (فقط تاریخی؛ `bridge.*` دیگر معتبر نیست).
- کلاینت‌ها از طریق نام MagicDNS یا IP مربوط به tailnet وصل می‌شوند.
- Bonjour از شبکه‌ها عبور **نمی‌کند**؛ در صورت نیاز از میزبان/پورت دستی یا DNS-SD گسترده‌ناحیه استفاده کنید.

## نسخه‌بندی

پل **v1 ضمنی** بود (بدون مذاکرهٔ حداقل/حداکثر). این بخش فقط ارجاع تاریخی است؛ کلاینت‌های فعلی Node/اپراتور از [پروتکل Gateway](/fa/gateway/protocol) مبتنی بر WebSocket استفاده می‌کنند.

## مرتبط

- [پروتکل Gateway](/fa/gateway/protocol)
- [Nodeها](/fa/nodes)
