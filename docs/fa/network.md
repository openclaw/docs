---
read_when:
    - به نمای کلی معماری شبکه و امنیت نیاز دارید
    - شما در حال عیب‌یابی دسترسی محلی در برابر دسترسی tailnet یا جفت‌سازی هستید
    - شما فهرست مرجع مستندات شبکه را می‌خواهید
summary: 'هاب شبکه: سطوح Gateway، جفت‌سازی، کشف، و امنیت'
title: شبکه
x-i18n:
    generated_at: "2026-05-06T09:28:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
    postprocess_version: locale-links-v1
---

این هاب به مستندات اصلی دربارهٔ نحوهٔ اتصال، جفت‌سازی و ایمن‌سازی دستگاه‌ها توسط OpenClaw در localhost، LAN و tailnet پیوند می‌دهد.

## مدل اصلی

بیشتر عملیات از طریق Gateway (`openclaw gateway`) انجام می‌شوند؛ یک فرایند واحد و طولانی‌اجرا که مالک اتصال‌های کانال و صفحهٔ کنترل WebSocket است.

- **ابتدا Loopback**: مقدار پیش‌فرض Gateway WS برابر `ws://127.0.0.1:18789` است.
  اتصال‌های غیر loopback به یک مسیر معتبر احراز هویت Gateway نیاز دارند: احراز هویت با توکن/رمز عبورِ shared-secret، یا استقرار `trusted-proxy` غیر loopback که به‌درستی پیکربندی شده باشد.
- توصیه می‌شود **یک Gateway برای هر میزبان** داشته باشید. برای ایزوله‌سازی، چند gateway را با پروفایل‌ها و پورت‌های ایزوله اجرا کنید ([چند Gateway](/fa/gateway/multiple-gateways)).
- **میزبان Canvas** روی همان پورت Gateway ارائه می‌شود (`/__openclaw__/canvas/`، `/__openclaw__/a2ui/`) و وقتی فراتر از loopback متصل شده باشد، با احراز هویت Gateway محافظت می‌شود.
- **دسترسی راه دور** معمولاً از طریق تونل SSH یا VPN Tailscale انجام می‌شود ([دسترسی راه دور](/fa/gateway/remote)).

منابع کلیدی:

- [معماری Gateway](/fa/concepts/architecture)
- [پروتکل Gateway](/fa/gateway/protocol)
- [راهنمای عملیاتی Gateway](/fa/gateway)
- [سطوح وب + حالت‌های bind](/fa/web)

## جفت‌سازی + هویت

- [نمای کلی جفت‌سازی (DM + nodes)](/fa/channels/pairing)
- [جفت‌سازی Node تحت مالکیت Gateway](/fa/gateway/pairing)
- [CLI دستگاه‌ها (جفت‌سازی + چرخش توکن)](/fa/cli/devices)
- [CLI جفت‌سازی (تأییدهای DM)](/fa/cli/pairing)

اعتماد محلی:

- اتصال‌های مستقیم local loopback می‌توانند برای جفت‌سازی به‌صورت خودکار تأیید شوند تا تجربهٔ کاربری روی همان میزبان روان بماند.
- OpenClaw همچنین یک مسیر محدود self-connect محلیِ backend/container برای جریان‌های کمکی trusted shared-secret دارد.
- کلاینت‌های tailnet و LAN، از جمله bindهای tailnet روی همان میزبان، همچنان به تأیید صریح جفت‌سازی نیاز دارند.

## کشف + ترابردها

- [کشف و ترابردها](/fa/gateway/discovery)
- [Bonjour / mDNS](/fa/gateway/bonjour)
- [دسترسی راه دور (SSH)](/fa/gateway/remote)
- [Tailscale](/fa/gateway/tailscale)

## Nodeها + ترابردها

- [نمای کلی Nodeها](/fa/nodes)
- [پروتکل Bridge (Nodeهای قدیمی، تاریخی)](/fa/gateway/bridge-protocol)
- [راهنمای عملیاتی Node: iOS](/fa/platforms/ios)
- [راهنمای عملیاتی Node: Android](/fa/platforms/android)

## امنیت

- [نمای کلی امنیت](/fa/gateway/security)
- [مرجع پیکربندی Gateway](/fa/gateway/configuration)
- [عیب‌یابی](/fa/gateway/troubleshooting)
- [Doctor](/fa/gateway/doctor)

## مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [دسترسی راه دور](/fa/gateway/remote)
