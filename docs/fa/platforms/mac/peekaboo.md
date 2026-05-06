---
read_when:
    - میزبانی PeekabooBridge در OpenClaw.app
    - یکپارچه‌سازی Peekaboo از طریق Swift Package Manager
    - تغییر پروتکل/مسیرهای PeekabooBridge
    - انتخاب بین PeekabooBridge، Codex Computer Use و cua-driver MCP
summary: یکپارچه‌سازی PeekabooBridge برای خودکارسازی رابط کاربری macOS
title: پل دالی‌موشه
x-i18n:
    generated_at: "2026-05-06T09:31:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw می‌تواند **PeekabooBridge** را به‌عنوان یک کارگزار محلی اتوماسیون رابط کاربری با آگاهی از مجوزها میزبانی کند. این امکان را می‌دهد که CLI `peekaboo` اتوماسیون رابط کاربری را اجرا کند و هم‌زمان از مجوزهای TCC اپ macOS دوباره استفاده کند.

## این چیست (و چه نیست)

- **میزبان**: OpenClaw.app می‌تواند به‌عنوان میزبان PeekabooBridge عمل کند.
- **کلاینت**: از CLI `peekaboo` استفاده کنید (سطح جداگانه‌ای برای `openclaw ui ...` وجود ندارد).
- **رابط کاربری**: پوشش‌های بصری در Peekaboo.app باقی می‌مانند؛ OpenClaw فقط یک میزبان کارگزار سبک است.

## رابطه با Computer Use

OpenClaw سه مسیر کنترل دسکتاپ دارد و این مسیرها عمداً جدا از هم نگه داشته می‌شوند:

- **میزبان PeekabooBridge**: OpenClaw.app می‌تواند سوکت محلی PeekabooBridge را میزبانی کند.
  CLI `peekaboo` همچنان کلاینت باقی می‌ماند و برای بدویات اتوماسیون Peekaboo مانند نماگرفت‌ها، کلیک‌ها، منوها، گفت‌وگوها، کنش‌های Dock و مدیریت پنجره‌ها از مجوزهای macOS متعلق به OpenClaw.app استفاده می‌کند.
- **Codex Computer Use**: Plugin همراه `codex` سرور اپلیکیشن Codex را آماده می‌کند، بررسی می‌کند که سرور MCP `computer-use` متعلق به Codex در دسترس باشد، و سپس اجازه می‌دهد Codex در نوبت‌های حالت Codex مالک فراخوانی‌های ابزار کنترل دسکتاپ بومی باشد. OpenClaw این کنش‌ها را از طریق PeekabooBridge پراکسی نمی‌کند.
- **MCP مستقیم `cua-driver`**: OpenClaw می‌تواند سرور بالادستی `cua-driver mcp` متعلق به TryCua را به‌عنوان یک سرور MCP عادی ثبت کند. این کار شِماهای خود CUA driver و گردش‌کار pid/window/element-index را بدون مسیریابی از طریق بازار Codex یا سوکت PeekabooBridge در اختیار عامل‌ها قرار می‌دهد.

وقتی سطح گسترده اتوماسیون macOS و میزبان پل OpenClaw.app با آگاهی از مجوزها را می‌خواهید، از Peekaboo استفاده کنید. وقتی یک عامل حالت Codex باید به Plugin بومی computer-use متعلق به Codex متکی باشد، از Codex Computer Use استفاده کنید. وقتی می‌خواهید CUA driver به‌عنوان یک سرور MCP عادی در معرض هر زمان اجرای مدیریت‌شده توسط OpenClaw قرار گیرد، از `cua-driver mcp` مستقیم استفاده کنید.

## فعال کردن پل

در اپ macOS:

- تنظیمات → **فعال‌سازی Peekaboo Bridge**

وقتی فعال باشد، OpenClaw یک سرور سوکت UNIX محلی را راه‌اندازی می‌کند. اگر غیرفعال باشد، میزبان متوقف می‌شود و `peekaboo` به میزبان‌های دردسترس دیگر بازمی‌گردد.

## ترتیب کشف کلاینت

کلاینت‌های Peekaboo معمولاً میزبان‌ها را به این ترتیب امتحان می‌کنند:

1. Peekaboo.app (تجربه کاربری کامل)
2. Claude.app (اگر نصب شده باشد)
3. OpenClaw.app (کارگزار سبک)

برای دیدن اینکه کدام میزبان فعال است و کدام مسیر سوکت در حال استفاده است، از `peekaboo bridge status --verbose` استفاده کنید. می‌توانید با این دستور بازنویسی کنید:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## امنیت و مجوزها

- پل **امضاهای کد فراخواننده** را اعتبارسنجی می‌کند؛ فهرست مجاز TeamIDها اعمال می‌شود (TeamID میزبان Peekaboo + TeamID اپ OpenClaw).
- درخواست‌ها پس از حدود ۱۰ ثانیه منقضی می‌شوند.
- اگر مجوزهای لازم وجود نداشته باشند، پل به‌جای راه‌اندازی System Settings یک پیام خطای روشن برمی‌گرداند.

## رفتار نماگرفت (اتوماسیون)

نماگرفت‌ها در حافظه ذخیره می‌شوند و پس از یک بازه کوتاه به‌طور خودکار منقضی می‌شوند.
اگر به نگه‌داری طولانی‌تر نیاز دارید، دوباره از کلاینت ثبت کنید.

## عیب‌یابی

- اگر `peekaboo` گزارش داد "bridge client is not authorized"، مطمئن شوید کلاینت به‌درستی امضا شده است یا میزبان را فقط در حالت **اشکال‌زدایی** با `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` اجرا کنید.
- اگر هیچ میزبانی پیدا نشد، یکی از اپ‌های میزبان (Peekaboo.app یا OpenClaw.app) را باز کنید و تأیید کنید که مجوزها اعطا شده‌اند.

## مرتبط

- [اپ macOS](/fa/platforms/macos)
- [مجوزهای macOS](/fa/platforms/mac/permissions)
