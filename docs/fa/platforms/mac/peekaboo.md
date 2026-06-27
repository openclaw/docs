---
read_when:
    - میزبانی PeekabooBridge در OpenClaw.app
    - یکپارچه‌سازی Peekaboo از طریق Swift Package Manager
    - تغییر پروتکل/مسیرهای PeekabooBridge
    - تصمیم‌گیری بین PeekabooBridge، Codex Computer Use و cua-driver MCP
summary: یکپارچه‌سازی PeekabooBridge برای خودکارسازی رابط کاربری macOS
title: پل پیکابو
x-i18n:
    generated_at: "2026-06-27T18:08:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw می‌تواند **PeekabooBridge** را به‌عنوان یک واسطهٔ محلی اتوماسیون UI با آگاهی از مجوزها میزبانی کند. این باعث می‌شود CLI `peekaboo` بتواند اتوماسیون UI را اجرا کند و هم‌زمان از مجوزهای TCC برنامهٔ macOS دوباره استفاده کند.

## این چیست (و چیست نیست)

- **میزبان**: OpenClaw.app می‌تواند به‌عنوان میزبان PeekabooBridge عمل کند.
- **کلاینت**: از CLI `peekaboo` استفاده کنید (بدون سطح جداگانهٔ `openclaw ui ...`).
- **UI**: هم‌پوشانی‌های بصری در Peekaboo.app باقی می‌مانند؛ OpenClaw فقط یک میزبان واسطهٔ سبک است.

## رابطه با Computer Use

OpenClaw سه مسیر کنترل دسکتاپ دارد، و این مسیرها عمداً جدا از هم می‌مانند:

- **میزبان PeekabooBridge**: OpenClaw.app می‌تواند سوکت محلی PeekabooBridge را میزبانی کند.
  CLI `peekaboo` همچنان کلاینت باقی می‌ماند و از مجوزهای macOS متعلق به OpenClaw.app
  برای بدوی‌های اتوماسیون Peekaboo مانند اسکرین‌شات‌ها، کلیک‌ها،
  منوها، دیالوگ‌ها، کنش‌های Dock، و مدیریت پنجره استفاده می‌کند.
- **Codex Computer Use**: Plugin داخلی `codex` سرور برنامهٔ Codex را آماده می‌کند،
  بررسی می‌کند که سرور MCP `computer-use` متعلق به Codex در دسترس باشد، و سپس اجازه می‌دهد
  Codex در نوبت‌های حالت Codex مالک فراخوانی‌های ابزار کنترل دسکتاپ بومی باشد. OpenClaw
  این کنش‌ها را از طریق PeekabooBridge پراکسی نمی‌کند.
- **MCP مستقیم `cua-driver`**: OpenClaw می‌تواند سرور بالادستی
  `cua-driver mcp` متعلق به TryCua را به‌عنوان یک سرور MCP عادی ثبت کند. این کار به عامل‌ها
  طرح‌واره‌های خود درایور CUA و گردش‌کار pid/پنجره/نمایهٔ عنصر را می‌دهد، بدون اینکه
  از طریق بازار Codex یا سوکت PeekabooBridge مسیریابی شود.

وقتی سطح گستردهٔ اتوماسیون macOS و میزبان پل با آگاهی از مجوزهای OpenClaw.app را می‌خواهید، از Peekaboo استفاده کنید. وقتی یک عامل حالت Codex
باید به Plugin بومی computer-use متعلق به Codex تکیه کند، از Codex Computer Use استفاده کنید. وقتی می‌خواهید درایور CUA برای هر runtime مدیریت‌شده توسط OpenClaw به‌عنوان یک سرور MCP عادی در معرض استفاده قرار گیرد، از `cua-driver mcp` مستقیم استفاده کنید.

## فعال‌سازی پل

در برنامهٔ macOS:

- Settings → **Enable Peekaboo Bridge**

وقتی فعال باشد، OpenClaw یک سرور سوکت UNIX محلی را راه‌اندازی می‌کند. اگر غیرفعال باشد، میزبان
متوقف می‌شود و `peekaboo` به میزبان‌های دردسترس دیگر بازمی‌گردد.

## ترتیب کشف کلاینت

کلاینت‌های Peekaboo معمولاً میزبان‌ها را به این ترتیب امتحان می‌کنند:

1. Peekaboo.app (تجربهٔ کاربری کامل)
2. Claude.app (اگر نصب شده باشد)
3. OpenClaw.app (واسطهٔ سبک)

برای دیدن اینکه کدام میزبان فعال است و کدام مسیر سوکت در حال استفاده است، از `peekaboo bridge status --verbose` استفاده کنید. می‌توانید با این مورد بازنویسی کنید:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## امنیت و مجوزها

- پل **امضاهای کد فراخوان** را اعتبارسنجی می‌کند؛ یک فهرست مجاز از TeamIDها
  اعمال می‌شود (TeamID میزبان Peekaboo + TeamID برنامهٔ OpenClaw).
- برای
  دسترسی‌پذیری، هویت امضاشدهٔ پل/برنامه را به runtime عمومی `node` ترجیح دهید. اعطای دسترسی‌پذیری به `node` باعث می‌شود هر بسته‌ای که توسط
  آن فایل اجرایی Node راه‌اندازی شود، دسترسی اتوماسیون GUI را به ارث ببرد؛
  [مجوزهای macOS](/fa/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes) را ببینید.
- درخواست‌ها پس از حدود ۱۰ ثانیه منقضی می‌شوند.
- اگر مجوزهای لازم وجود نداشته باشند، پل به‌جای راه‌اندازی System Settings
  یک پیام خطای روشن برمی‌گرداند.

## رفتار Snapshot (اتوماسیون)

Snapshotها در حافظه ذخیره می‌شوند و پس از یک بازهٔ کوتاه به‌طور خودکار منقضی می‌شوند.
اگر به نگهداری طولانی‌تر نیاز دارید، دوباره از کلاینت capture بگیرید.

## عیب‌یابی

- اگر `peekaboo` گزارش داد "bridge client is not authorized"، مطمئن شوید کلاینت
  به‌درستی امضا شده است یا میزبان را فقط در حالت **debug** با `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  اجرا کنید.
- اگر هیچ میزبانی پیدا نشد، یکی از برنامه‌های میزبان (Peekaboo.app یا OpenClaw.app)
  را باز کنید و تأیید کنید که مجوزها اعطا شده‌اند.

## مرتبط

- [برنامهٔ macOS](/fa/platforms/macos)
- [مجوزهای macOS](/fa/platforms/mac/permissions)
