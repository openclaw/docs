---
read_when:
    - ویرایش قراردادهای IPC یا IPC برنامهٔ نوار منو
summary: معماری IPC در macOS برای برنامه OpenClaw، ترنسپورت Node Gateway و PeekabooBridge
title: ارتباط بین‌فرایندی macOS
x-i18n:
    generated_at: "2026-04-29T23:12:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# معماری IPC در macOS برای OpenClaw

**مدل فعلی:** یک سوکت محلی Unix، **سرویس میزبان node** را برای تأییدهای exec + `system.run` به **برنامه macOS** متصل می‌کند. یک CLI اشکال‌زدایی `openclaw-mac` برای بررسی‌های کشف/اتصال وجود دارد؛ کنش‌های عامل همچنان از طریق Gateway WebSocket و `node.invoke` جریان می‌یابند. خودکارسازی UI از PeekabooBridge استفاده می‌کند.

## اهداف

- یک نمونه برنامه GUI واحد که مالک تمام کارهای مرتبط با TCC باشد (اعلان‌ها، ضبط صفحه، میکروفون، گفتار، AppleScript).
- یک سطح کوچک برای خودکارسازی: Gateway + فرمان‌های node، به‌علاوه PeekabooBridge برای خودکارسازی UI.
- مجوزهای قابل پیش‌بینی: همیشه همان bundle ID امضاشده، اجراشده توسط launchd، تا اعطای مجوزهای TCC پایدار بماند.

## نحوه کار

### انتقال Gateway + node

- برنامه Gateway را اجرا می‌کند (حالت محلی) و به‌عنوان یک node به آن متصل می‌شود.
- کنش‌های عامل از طریق `node.invoke` انجام می‌شوند (برای مثال `system.run`، `system.notify`، `canvas.*`).

### سرویس node + IPC برنامه

- یک سرویس میزبان node بدون رابط گرافیکی به Gateway WebSocket متصل می‌شود.
- درخواست‌های `system.run` از طریق یک سوکت محلی Unix به برنامه macOS ارسال می‌شوند.
- برنامه exec را در زمینه UI انجام می‌دهد، در صورت نیاز درخواست تأیید نشان می‌دهد، و خروجی را برمی‌گرداند.

نمودار (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (خودکارسازی UI)

- خودکارسازی UI از یک سوکت UNIX جداگانه با نام `bridge.sock` و پروتکل JSON مربوط به PeekabooBridge استفاده می‌کند.
- ترتیب ترجیح میزبان (در سمت کلاینت): Peekaboo.app → Claude.app → OpenClaw.app → اجرای محلی.
- امنیت: میزبان‌های bridge به TeamID مجاز نیاز دارند؛ راه فرار same-UID فقط برای DEBUG با `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` محافظت می‌شود (قرارداد Peekaboo).
- برای جزئیات ببینید: [استفاده از PeekabooBridge](/fa/platforms/mac/peekaboo).

## جریان‌های عملیاتی

- راه‌اندازی دوباره/ساخت دوباره: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - نمونه‌های موجود را می‌کشد
  - ساخت Swift + بسته‌بندی
  - LaunchAgent را می‌نویسد/bootstrap می‌کند/kickstart می‌کند
- نمونه واحد: اگر نمونه دیگری با همان bundle ID در حال اجرا باشد، برنامه زود خارج می‌شود.

## نکات سخت‌سازی

- برای همه سطوح دارای امتیاز، الزام به تطابق TeamID را ترجیح دهید.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (فقط DEBUG) ممکن است به فراخوان‌های same-UID برای توسعه محلی اجازه دهد.
- تمام ارتباطات فقط محلی باقی می‌مانند؛ هیچ سوکت شبکه‌ای در معرض قرار نمی‌گیرد.
- درخواست‌های TCC فقط از bundle برنامه GUI منشأ می‌گیرند؛ bundle ID امضاشده را در بازسازی‌ها پایدار نگه دارید.
- سخت‌سازی IPC: حالت سوکت `0600`، توکن، بررسی‌های peer-UID، چالش/پاسخ HMAC، TTL کوتاه.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [جریان IPC در macOS (تأییدهای Exec)](/fa/tools/exec-approvals-advanced#macos-ipc-flow)
