---
read_when:
    - ویرایش قراردادهای IPC یا IPC برنامه نوار منو
summary: معماری IPC در macOS برای برنامه OpenClaw، انتقال گره Gateway و PeekabooBridge
title: IPC در macOS
x-i18n:
    generated_at: "2026-06-28T00:13:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# معماری IPC در OpenClaw برای macOS

**مدل فعلی:** یک سوکت محلی Unix، **سرویس میزبان node** را برای تأییدهای exec و `system.run` به **برنامه macOS** وصل می‌کند. یک CLI اشکال‌زدایی `openclaw-mac` برای بررسی‌های کشف/اتصال وجود دارد؛ کنش‌های عامل همچنان از طریق Gateway WebSocket و `node.invoke` جریان می‌یابند. خودکارسازی UI از PeekabooBridge استفاده می‌کند.

## اهداف

- یک نمونه واحد از برنامه GUI که مالک همه کارهای مرتبط با TCC باشد (اعلان‌ها، ضبط صفحه، میکروفون، گفتار، AppleScript).
- سطحی کوچک برای خودکارسازی: Gateway + فرمان‌های node، به‌علاوه PeekabooBridge برای خودکارسازی UI.
- مجوزهای قابل پیش‌بینی: همیشه همان bundle ID امضاشده، اجراشده توسط launchd، تا اعطاهای TCC پایدار بمانند.

## نحوه کارکرد

### انتقال Gateway + node

- برنامه Gateway را اجرا می‌کند (حالت محلی) و به‌عنوان یک node به آن وصل می‌شود.
- کنش‌های عامل از طریق `node.invoke` انجام می‌شوند (مثلاً `system.run`، `system.notify`، `canvas.*`).
- فرمان‌های رایج node در Mac شامل `canvas.*`، `camera.snap`، `camera.clip`،
  `screen.snapshot`، `screen.record`، `system.run`، و `system.notify` هستند.
- node یک نگاشت `permissions` گزارش می‌کند تا عامل‌ها بتوانند ببینند آیا دسترسی به صفحه،
  دوربین، میکروفون، گفتار، خودکارسازی، یا دسترس‌پذیری در دسترس است یا نه.

### سرویس node + IPC برنامه

- یک سرویس میزبان node بدون رابط گرافیکی به Gateway WebSocket وصل می‌شود.
- درخواست‌های `system.run` از طریق یک سوکت محلی Unix به برنامه macOS فوروارد می‌شوند.
- برنامه exec را در زمینه UI انجام می‌دهد، در صورت نیاز درخواست تأیید نشان می‌دهد، و خروجی را برمی‌گرداند.

نمودار (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (خودکارسازی UI)

- خودکارسازی UI از یک سوکت جداگانه UNIX به نام `bridge.sock` و پروتکل JSON مربوط به PeekabooBridge استفاده می‌کند.
- ترتیب ترجیح میزبان (سمت کلاینت): Peekaboo.app → Claude.app → OpenClaw.app → اجرای محلی.
- امنیت: میزبان‌های bridge به TeamID مجاز نیاز دارند؛ راه فرار DEBUG-only برای همان UID با `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` محافظت می‌شود (قرارداد Peekaboo).
- ببینید: [کاربرد PeekabooBridge](/fa/platforms/mac/peekaboo) برای جزئیات.

## جریان‌های عملیاتی

- راه‌اندازی/ساخت مجدد: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - نمونه‌های موجود را می‌کشد
  - ساخت Swift + بسته‌بندی
  - LaunchAgent را می‌نویسد/راه‌اندازی اولیه می‌کند/kickstart می‌کند
- نمونه واحد: اگر نمونه دیگری با همان bundle ID در حال اجرا باشد، برنامه زودتر خارج می‌شود.

## نکات سخت‌سازی

- ترجیحاً برای همه سطوح دارای امتیاز، تطابق TeamID الزامی باشد.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (فقط DEBUG) ممکن است برای توسعه محلی به فراخوان‌های همان UID اجازه دهد.
- همه ارتباطات فقط محلی باقی می‌مانند؛ هیچ سوکت شبکه‌ای در معرض قرار نمی‌گیرد.
- درخواست‌های TCC فقط از bundle برنامه GUI منشأ می‌گیرند؛ bundle ID امضاشده را در بازسازی‌ها پایدار نگه دارید.
- سخت‌سازی IPC: حالت سوکت `0600`، توکن، بررسی‌های peer-UID، چالش/پاسخ HMAC، TTL کوتاه.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [جریان IPC در macOS (تأییدهای Exec)](/fa/tools/exec-approvals-advanced#macos-ipc-flow)
