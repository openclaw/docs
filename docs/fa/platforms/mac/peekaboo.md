---
read_when:
    - میزبانی PeekabooBridge در OpenClaw.app
    - یکپارچه‌سازی Peekaboo از طریق Swift Package Manager
    - تغییر پروتکل/مسیرهای PeekabooBridge
    - انتخاب میان PeekabooBridge، Codex Computer Use و cua-driver MCP
summary: یکپارچه‌سازی PeekabooBridge برای خودکارسازی رابط کاربری macOS
title: پل Peekaboo
x-i18n:
    generated_at: "2026-07-16T16:51:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw می‌تواند **PeekabooBridge** را به‌عنوان یک کارگزار محلی و آگاه از مجوز برای خودکارسازی رابط کاربری میزبانی کند (`PeekabooBridgeHostCoordinator`، مبتنی بر بستهٔ Swift ‏`steipete/Peekaboo`). این قابلیت به CLI ‏`peekaboo` اجازه می‌دهد ضمن استفادهٔ مجدد از مجوزهای TCC برنامهٔ macOS، خودکارسازی رابط کاربری را هدایت کند.

## این چیست (و چیست نیست)

- **میزبان**: OpenClaw.app می‌تواند به‌عنوان میزبان PeekabooBridge عمل کند.
- **کارخواه**: CLI ‏`peekaboo` (هیچ سطح جداگانه‌ای برای `openclaw ui ...` وجود ندارد).
- **رابط کاربری**: هم‌پوشانی‌های بصری در Peekaboo.app باقی می‌مانند؛ OpenClaw یک میزبان کارگزار سبک است.

## ارتباط با دیگر مسیرهای کنترل دسکتاپ

OpenClaw چهار مسیر کنترل دسکتاپ دارد که عمداً از یکدیگر جدا نگه داشته می‌شوند:

- **میزبان PeekabooBridge**: OpenClaw.app سوکت محلی PeekabooBridge را میزبانی می‌کند. CLI ‏`peekaboo` کارخواه است و برای گرفتن نماگرفت، کلیک، کار با منوها و کادرهای محاوره‌ای، اقدامات Dock و مدیریت پنجره‌ها از مجوزهای macOS متعلق به OpenClaw.app استفاده می‌کند.
- **استفاده از رایانه با هدایت عامل (`computer.act`)**: ابزار داخلی `computer` عامل Gateway از طریق `screen.snapshot` نماگرفت می‌گیرد و با فرمان خطرناک Node ‏`computer.act` نشانگر و صفحه‌کلید را هدایت می‌کند. یک Node در macOS، ‏`computer.act` را درون همان فرایند و با استفاده از سرویس‌های تعبیه‌شدهٔ خودکارسازی Peekaboo که این پل ارائه می‌کند، به‌همراه امکانات محدود CoreGraphics اجرا می‌کند؛ بدون عبور از سوکت PeekabooBridge یا CLI ‏`peekaboo`. به [استفاده از رایانه](/fa/nodes/computer-use) مراجعه کنید.
- **استفاده از رایانه در Codex**: Plugin همراه `codex`، ‏Plugin ‏MCP ‏`computer-use` متعلق به Codex ‏(`extensions/codex/src/app-server/computer-use.ts`) را بررسی می‌کند و می‌تواند آن را نصب کند، سپس در نوبت‌های حالت Codex مالکیت فراخوانی‌های ابزار بومی کنترل دسکتاپ را به Codex می‌سپارد. OpenClaw این اقدامات را از طریق PeekabooBridge پراکسی نمی‌کند.
- **MCP مستقیم `cua-driver`**: OpenClaw می‌تواند سرور بالادستی `cua-driver mcp` متعلق به TryCua را به‌عنوان یک سرور MCP معمولی ثبت کند و طرح‌واره‌ها و گردش‌کار pid/window/element-index خودِ راه‌انداز CUA را در اختیار عامل‌ها قرار دهد، بدون مسیریابی از طریق بازار Codex یا سوکت PeekabooBridge.

برای دسترسی به سطح گستردهٔ خودکارسازی macOS از طریق میزبان پل آگاه از مجوز OpenClaw.app، از Peekaboo استفاده کنید. هنگامی که عامل Gateway باید دسکتاپ را از طریق یک فرمان یکنواخت Node ‏`computer.act` ببیند و کنترل کند که هر مدل بینایی بتواند آن را هدایت کند، از استفاده از رایانه با هدایت عامل بهره بگیرید. وقتی یک عامل در حالت Codex باید به Plugin بومی Codex متکی باشد، از استفاده از رایانه در Codex استفاده کنید. برای در معرض دسترس قرار دادن راه‌انداز CUA برای هر محیط اجرایی مدیریت‌شده توسط OpenClaw به‌عنوان یک سرور MCP معمولی، از `cua-driver mcp` مستقیم استفاده کنید.

## فعال‌کردن پل

در برنامهٔ macOS: **Settings -> Enable Peekaboo Bridge**. برای فعال‌شدن این کلید، **Allow Computer Control** باید روشن باشد، زیرا هر دو مجوز خودکارسازی محلی رابط کاربری را اعطا می‌کنند؛ وقتی Computer Control خاموش است، کلید غیرفعال می‌شود و میزبان اجرا نمی‌شود. برای هدایت Peekaboo بدون Computer Control، برنامهٔ Mac خود Peekaboo را به‌عنوان میزبان اجرا کنید.

وقتی این گزینه فعال و Computer Control روشن باشد، OpenClaw یک سرور سوکت UNIX محلی را در `~/Library/Application Support/OpenClaw/<socket-name>` راه‌اندازی می‌کند. اگر غیرفعال باشد، میزبان متوقف می‌شود و `peekaboo` به دیگر میزبان‌های دردسترس برمی‌گردد. هماهنگ‌کننده همچنین پیوندهای نمادین سوکت قدیمی (`clawdbot`، ‏`clawdis`، ‏`moltbot` در Application Support) را نگهداری می‌کند که برای نصب‌های قدیمی‌تر `peekaboo` به سوکت فعلی اشاره می‌کنند.

## ترتیب کشف کارخواه

کارخواه‌های Peekaboo معمولاً میزبان‌ها را به این ترتیب امتحان می‌کنند:

1. Peekaboo.app (تجربهٔ کاربری کامل)
2. Claude.app (در صورت نصب‌بودن)
3. OpenClaw.app (کارگزار سبک)

برای دیدن میزبان فعال و مسیر سوکت در حال استفاده، از `peekaboo bridge status --verbose` استفاده کنید. برای بازنویسی آن:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## امنیت و مجوزها

- پل، **امضاهای کد فراخواننده** را اعتبارسنجی می‌کند؛ یک فهرست مجاز از TeamIDها اعمال می‌شود (TeamID میزبان Peekaboo به‌همراه TeamID خود برنامهٔ در حال اجرا).
- برای Accessibility، هویت امضاشدهٔ پل/برنامه را به یک محیط اجرایی عمومی `node` ترجیح دهید. اعطای Accessibility به `node` باعث می‌شود هر بسته‌ای که با آن فایل اجرایی Node راه‌اندازی شود، دسترسی خودکارسازی رابط گرافیکی را به ارث ببرد؛ به [مجوزهای macOS](/fa/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes) مراجعه کنید.
- درخواست‌ها پس از 10 ثانیه مهلتشان تمام می‌شود (`requestTimeoutSec: 10`).
- اگر مجوزهای لازم وجود نداشته باشند، پل به‌جای راه‌اندازی System Settings یک پیام خطای روشن برمی‌گرداند.

## رفتار نماگرفت (خودکارسازی)

نماگرفت‌ها با پنجرهٔ اعتبار 10 دقیقه‌ای و سقف 50 نماگرفت (`InMemorySnapshotManager`) در حافظه ذخیره می‌شوند؛ مصنوعات هنگام پاک‌سازی حذف نمی‌شوند. اگر به نگهداری طولانی‌تری نیاز دارید، دوباره از کارخواه نماگرفت بگیرید.

## عیب‌یابی

- اگر `peekaboo` گزارش می‌دهد «کارخواه پل مجاز نیست»، مطمئن شوید کارخواه به‌درستی امضا شده است یا میزبان را فقط در حالت **debug** با `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` اجرا کنید.
- اگر هیچ میزبانی یافت نشد، یکی از برنامه‌های میزبان (Peekaboo.app یا OpenClaw.app) را باز کنید و تأیید کنید که مجوزها اعطا شده‌اند.

## مرتبط

- [برنامهٔ macOS](/fa/platforms/macos)
- [مجوزهای macOS](/fa/platforms/mac/permissions)
