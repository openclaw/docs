---
read_when:
    - ویرایش قراردادهای IPC یا IPC برنامه نوار منو
summary: معماری IPC در macOS برای برنامه OpenClaw، انتقال Node در Gateway و PeekabooBridge
title: IPC در macOS
x-i18n:
    generated_at: "2026-07-12T10:24:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# معماری IPC در macOS برای OpenClaw

یک سوکت محلی Unix، سرویس میزبان Node را برای تأییدهای اجرا و `system.run` به برنامه macOS متصل می‌کند. یک CLI اشکال‌زدایی به نام `openclaw-mac` (`apps/macos/Sources/OpenClawMacCLI`) برای بررسی‌های کشف/اتصال وجود دارد؛ کنش‌های عامل همچنان از طریق WebSocket مربوط به Gateway و `node.invoke` جریان می‌یابند. مسیر مبتنی بر Node یعنی `computer.act`، خودکارسازی تعبیه‌شده Peekaboo را درون همان فرایند اجرا می‌کند؛ کلاینت‌های مستقل Peekaboo از PeekabooBridge استفاده می‌کنند.

## اهداف

- یک نمونه واحد از برنامه رابط گرافیکی که مالک همه کارهای مرتبط با TCC باشد (اعلان‌ها، ضبط صفحه، میکروفون، گفتار، AppleScript).
- سطحی کوچک برای خودکارسازی: Gateway + فرمان‌های Node، اجرای درون‌فرایندی `computer.act`، به‌علاوه PeekabooBridge برای کلاینت‌های مستقل خودکارسازی رابط کاربری.
- مجوزهای قابل‌پیش‌بینی: همیشه همان شناسه بسته امضاشده که توسط launchd راه‌اندازی می‌شود، تا مجوزهای TCC پایدار بمانند.

## نحوه کار

### انتقال Gateway + Node

- برنامه Gateway را (در حالت محلی) اجرا می‌کند و به‌عنوان یک Node به آن متصل می‌شود.
- کنش‌های عامل از طریق `node.invoke` انجام می‌شوند (برای نمونه `system.run`، `system.notify`، `canvas.*`).
- فرمان‌های Node شامل `canvas.*`، `camera.snap`، `camera.clip`، `screen.snapshot`، `screen.record`، `computer.act`، `system.run` و `system.notify` هستند.
- Node یک نگاشت `permissions` گزارش می‌کند تا عامل‌ها بتوانند ببینند آیا دسترسی به صفحه، دوربین، میکروفون، گفتار، خودکارسازی یا دسترس‌پذیری فراهم است یا نه.

### سرویس Node + ارتباط IPC برنامه

- یک سرویس میزبان Node بدون رابط گرافیکی به WebSocket مربوط به Gateway متصل می‌شود.
- درخواست‌های `system.run` از طریق یک سوکت محلی Unix (`ExecApprovalsSocket.swift`) به برنامه macOS هدایت می‌شوند.
- برنامه اجرا را در زمینه رابط کاربری انجام می‌دهد، در صورت نیاز درخواست تأیید می‌کند و خروجی را بازمی‌گرداند.

نمودار (SCI):

```text
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (خودکارسازی رابط کاربری)

- ابزار داخلی `computer` عامل از این سوکت استفاده **نمی‌کند**. یک Node جفت‌شده macOS، با سرویس‌های تعبیه‌شده Peekaboo، `computer.act` را در فرایند برنامه اجرا می‌کند.
- خودکارسازی رابط کاربری از یک سوکت UNIX جداگانه (`~/Library/Application Support/OpenClaw/<socket>`) و پروتکل JSON مربوط به PeekabooBridge استفاده می‌کند.
- ترتیب ترجیح میزبان (در سمت کلاینت): Peekaboo.app -> Claude.app -> OpenClaw.app -> اجرای محلی.
- امنیت: میزبان‌های پل به TeamID موجود در فهرست مجاز نیاز دارند (`PeekabooBridgeHostCoordinator` همراه برنامه، یک تیم ثابت و همچنین تیم امضاکننده خود برنامه را در فهرست مجاز قرار می‌دهد)؛ یک راه گریز فقط مخصوص DEBUG برای UID یکسان، با `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` محافظت می‌شود (قرارداد Peekaboo).
- برای جزئیات، ببینید: [کاربرد PeekabooBridge](/fa/platforms/mac/peekaboo).

## جریان‌های عملیاتی

- راه‌اندازی مجدد/ساخت مجدد: `scripts/restart-mac.sh` نمونه‌های موجود را متوقف می‌کند، از طریق Swift دوباره می‌سازد، مجدداً بسته‌بندی می‌کند و دوباره راه می‌اندازد. این اسکریپت به‌طور خودکار یک هویت امضای موجود را تشخیص می‌دهد و اگر هیچ‌کدام پیدا نشود، به `--no-sign` بازمی‌گردد؛ برای الزامی‌کردن امضا، `--sign` را ارسال کنید (اگر کلیدی موجود نباشد، ناموفق می‌شود) یا برای اجبار مسیر بدون امضا، `--no-sign` را ارسال کنید. در مسیر امضاشده، متغیر محیطی `SIGN_IDENTITY` حذف می‌شود تا سازوکار تشخیص خودکار هویت در خود `scripts/codesign-mac-app.sh` گواهی را انتخاب کند.
- نمونه واحد: برنامه `NSWorkspace.runningApplications` را برای یافتن شناسه بسته تکراری بررسی می‌کند و اگر بیش از یک نمونه پیدا شود، خارج می‌شود (`isDuplicateInstance()` در `MenuBar.swift`).

## نکات مقاوم‌سازی

- برای همه سطوح دارای دسترسی ویژه، ترجیحاً تطابق TeamID را الزامی کنید.
- PeekabooBridge: متغیر `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (فقط مخصوص DEBUG) ممکن است برای توسعه محلی به فراخوان‌های دارای UID یکسان اجازه دسترسی دهد.
- همه ارتباطات فقط محلی باقی می‌مانند؛ هیچ سوکت شبکه‌ای در معرض دسترسی قرار نمی‌گیرد.
- درخواست‌های TCC فقط از بسته برنامه رابط گرافیکی منشأ می‌گیرند؛ شناسه بسته امضاشده را در ساخت‌های مجدد ثابت نگه دارید.
- مقاوم‌سازی سوکت تأییدهای اجرا: حالت فایل `0600`، توکن مشترک، بررسی UID همتا (`getpeereid`)، چالش/پاسخ HMAC-SHA256 و TTL کوتاه برای درخواست‌ها.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [جریان IPC در macOS (تأییدهای اجرا)](/fa/tools/exec-approvals-advanced#macos-ipc-flow)
