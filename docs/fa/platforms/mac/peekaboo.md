---
read_when:
    - میزبانی PeekabooBridge در OpenClaw.app
    - یکپارچه‌سازی Peekaboo از طریق Swift Package Manager
    - تغییر پروتکل/مسیرهای PeekabooBridge
    - انتخاب میان PeekabooBridge، قابلیت استفاده از رایانه در Codex و cua-driver MCP
summary: یکپارچه‌سازی PeekabooBridge برای خودکارسازی رابط کاربری macOS
title: پل Peekaboo
x-i18n:
    generated_at: "2026-07-12T10:18:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw می‌تواند **PeekabooBridge** را به‌عنوان یک واسط محلی و آگاه از مجوزها برای خودکارسازی رابط کاربری میزبانی کند (`PeekabooBridgeHostCoordinator`، با پشتیبانی بستهٔ Swift با نام `steipete/Peekaboo`). این قابلیت به CLI `peekaboo` امکان می‌دهد ضمن استفادهٔ مجدد از مجوزهای TCC برنامهٔ macOS، خودکارسازی رابط کاربری را اجرا کند.

## این چیست (و چه نیست)

- **میزبان**: OpenClaw.app می‌تواند به‌عنوان میزبان PeekabooBridge عمل کند.
- **کلاینت**: CLI `peekaboo` (رابط مجزایی به‌شکل `openclaw ui ...` وجود ندارد).
- **رابط کاربری**: هم‌پوشانی‌های بصری در Peekaboo.app باقی می‌مانند؛ OpenClaw صرفاً یک میزبان واسط سبک است.

## ارتباط با سایر مسیرهای کنترل دسکتاپ

OpenClaw چهار مسیر کنترل دسکتاپ دارد که عمداً از یکدیگر جدا نگه داشته می‌شوند:

- **میزبان PeekabooBridge**: OpenClaw.app سوکت محلی PeekabooBridge را میزبانی می‌کند. CLI `peekaboo` کلاینت است و برای گرفتن اسکرین‌شات، کلیک‌کردن، کار با منوها و کادرهای محاوره‌ای، عملیات Dock و مدیریت پنجره‌ها از مجوزهای macOS متعلق به OpenClaw.app استفاده می‌کند.
- **استفادهٔ عامل از رایانه (`computer.act`)**: ابزار داخلی `computer` متعلق به عامل Gateway از طریق `screen.snapshot` اسکرین‌شات می‌گیرد و با فرمان خطرناک Node به نام `computer.act`، اشاره‌گر و صفحه‌کلید را کنترل می‌کند. یک Node در macOS، با استفاده از سرویس‌های خودکارسازی تعبیه‌شدهٔ Peekaboo که این پل در معرض استفاده قرار می‌دهد و همچنین توابع محدود CoreGraphics، فرمان `computer.act` را درون همان فرایند اجرا می‌کند، بدون آنکه از سوکت PeekabooBridge یا CLI `peekaboo` عبور کند. به [استفاده از رایانه](/nodes/computer-use) مراجعه کنید.
- **استفادهٔ Codex از رایانه**: Plugin همراه `codex`، Plugin مربوط به MCP با نام `computer-use` در Codex را بررسی می‌کند و می‌تواند آن را نصب کند (`extensions/codex/src/app-server/computer-use.ts`)؛ سپس در نوبت‌های حالت Codex، مدیریت فراخوانی‌های ابزار بومی کنترل دسکتاپ را به Codex می‌سپارد. OpenClaw این عملیات را از طریق PeekabooBridge نیابت نمی‌کند.
- **MCP مستقیم `cua-driver`**: OpenClaw می‌تواند سرور بالادستی `cua-driver mcp` متعلق به TryCua را به‌عنوان یک سرور MCP معمولی ثبت کند و بدون مسیریابی از طریق بازار Codex یا سوکت PeekabooBridge، طرح‌واره‌های خود راه‌انداز CUA و گردش‌کار مبتنی بر شناسهٔ فرایند، پنجره و نمایهٔ عنصر آن را در اختیار عامل‌ها قرار دهد.

برای دسترسی به سطح گستردهٔ خودکارسازی macOS از طریق میزبان پل آگاه از مجوز OpenClaw.app، از Peekaboo استفاده کنید. زمانی از استفادهٔ عامل از رایانه بهره ببرید که عامل Gateway باید دسکتاپ را از طریق فرمان یکپارچهٔ Node به نام `computer.act` ببیند و کنترل کند؛ فرمانی که هر مدل بینایی می‌تواند آن را هدایت کند. زمانی از استفادهٔ Codex از رایانه بهره ببرید که یک عامل در حالت Codex باید به Plugin بومی Codex متکی باشد. برای در معرض استفاده قرار دادن راه‌انداز CUA برای هر محیط زمان اجرای تحت مدیریت OpenClaw به‌عنوان یک سرور MCP معمولی، مستقیماً از `cua-driver mcp` استفاده کنید.

## فعال‌کردن پل

در برنامهٔ macOS: **Settings -> Enable Peekaboo Bridge**.

پس از فعال‌سازی، OpenClaw یک سرور سوکت محلی UNIX را در `~/Library/Application Support/OpenClaw/<socket-name>` راه‌اندازی می‌کند. اگر غیرفعال باشد، میزبان متوقف می‌شود و `peekaboo` به سایر میزبان‌های دردسترس بازمی‌گردد. هماهنگ‌کننده همچنین پیوندهای نمادین سوکت قدیمی (`clawdbot`، `clawdis` و `moltbot` در Application Support) را که برای نصب‌های قدیمی‌تر `peekaboo` به سوکت فعلی اشاره می‌کنند، نگه می‌دارد.

## ترتیب کشف کلاینت

کلاینت‌های Peekaboo معمولاً میزبان‌ها را به این ترتیب امتحان می‌کنند:

1. Peekaboo.app (تجربهٔ کاربری کامل)
2. Claude.app (در صورت نصب‌بودن)
3. OpenClaw.app (واسط سبک)

برای مشاهدهٔ میزبان فعال و مسیر سوکت مورد استفاده، `peekaboo bridge status --verbose` را اجرا کنید. برای بازنویسی آن از این دستور استفاده کنید:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## امنیت و مجوزها

- پل، **امضاهای کد فراخواننده** را اعتبارسنجی می‌کند؛ فهرست مجازی از TeamIDها اعمال می‌شود (TeamID میزبان Peekaboo به‌همراه TeamID خود برنامهٔ در حال اجرا).
- برای Accessibility، هویت امضاشدهٔ پل/برنامه را به یک محیط زمان اجرای عمومی `node` ترجیح دهید. اعطای Accessibility به `node` باعث می‌شود هر بسته‌ای که با آن فایل اجرایی Node راه‌اندازی می‌شود، دسترسی خودکارسازی رابط گرافیکی را به ارث ببرد؛ به [مجوزهای macOS](/fa/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes) مراجعه کنید.
- زمان درخواست‌ها پس از ۱۰ ثانیه به پایان می‌رسد (`requestTimeoutSec: 10`).
- اگر مجوزهای لازم وجود نداشته باشند، پل به‌جای بازکردن System Settings، پیام خطای روشنی برمی‌گرداند.

## رفتار تصویر لحظه‌ای (خودکارسازی)

تصاویر لحظه‌ای با پنجرهٔ اعتبار ۱۰ دقیقه‌ای و سقف ۵۰ تصویر در حافظه ذخیره می‌شوند (`InMemorySnapshotManager`)؛ مصنوعات هنگام پاک‌سازی حذف نمی‌شوند. اگر به نگه‌داری طولانی‌تری نیاز دارید، از کلاینت دوباره تصویر بگیرید.

## عیب‌یابی

- اگر `peekaboo` پیام "bridge client is not authorized" را گزارش می‌کند، مطمئن شوید کلاینت به‌درستی امضا شده است؛ یا میزبان را فقط در حالت **اشکال‌زدایی** با `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` اجرا کنید.
- اگر هیچ میزبانی پیدا نشد، یکی از برنامه‌های میزبان (Peekaboo.app یا OpenClaw.app) را باز کنید و تأیید کنید که مجوزها اعطا شده‌اند.

## مرتبط

- [برنامهٔ macOS](/fa/platforms/macos)
- [مجوزهای macOS](/fa/platforms/mac/permissions)
