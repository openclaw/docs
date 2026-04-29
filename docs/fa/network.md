---
read_when:
    - به نمای کلی معماری شبکه + امنیت نیاز دارید
    - در حال عیب‌یابی دسترسی محلی در برابر دسترسی از طریق تیل‌نت یا جفت‌سازی هستید
    - فهرست مرجع مستندات شبکه‌سازی را می‌خواهید
summary: 'هاب شبکه: سطوح Gateway، جفت‌سازی، کشف و امنیت'
title: شبکه
x-i18n:
    generated_at: "2026-04-29T23:08:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 16
---

# هاب شبکه

این هاب به مستندات اصلی دربارهٔ نحوهٔ اتصال، جفت‌سازی و ایمن‌سازی
دستگاه‌ها توسط OpenClaw در localhost، LAN و tailnet پیوند می‌دهد.

## مدل اصلی

بیشتر عملیات از طریق Gateway (`openclaw gateway`) انجام می‌شود؛ یک فرایند واحد و طولانی‌مدت که اتصال‌های کانال و صفحهٔ کنترل WebSocket را در اختیار دارد.

- **اول loopback**: مقدار پیش‌فرض Gateway WS برابر با `ws://127.0.0.1:18789` است.
  اتصال‌های bind غیر loopback به یک مسیر احراز هویت معتبر برای gateway نیاز دارند: احراز هویت با
  توکن/گذرواژهٔ shared-secret، یا استقرار `trusted-proxy`
  غیر loopback که به‌درستی پیکربندی شده باشد.
- **یک Gateway برای هر میزبان** توصیه می‌شود. برای جداسازی، چند gateway را با پروفایل‌ها و پورت‌های جداگانه اجرا کنید ([چند Gateway](/fa/gateway/multiple-gateways)).
- **میزبان Canvas** روی همان پورتی ارائه می‌شود که Gateway استفاده می‌کند (`/__openclaw__/canvas/`، `/__openclaw__/a2ui/`) و وقتی فراتر از loopback bind شده باشد، با احراز هویت Gateway محافظت می‌شود.
- **دسترسی از راه دور** معمولاً تونل SSH یا VPN مبتنی بر Tailscale است ([دسترسی از راه دور](/fa/gateway/remote)).

منابع کلیدی:

- [معماری Gateway](/fa/concepts/architecture)
- [پروتکل Gateway](/fa/gateway/protocol)
- [راهنمای عملیاتی Gateway](/fa/gateway)
- [سطح‌های وب + حالت‌های bind](/fa/web)

## جفت‌سازی + هویت

- [نمای کلی جفت‌سازی (DM + گره‌ها)](/fa/channels/pairing)
- [جفت‌سازی گره تحت مالکیت Gateway](/fa/gateway/pairing)
- [CLI دستگاه‌ها (جفت‌سازی + چرخش توکن)](/fa/cli/devices)
- [CLI جفت‌سازی (تأییدهای DM)](/fa/cli/pairing)

اعتماد محلی:

- اتصال‌های مستقیم local loopback می‌توانند برای جفت‌سازی به‌صورت خودکار تأیید شوند تا
  تجربهٔ کاربری روی همان میزبان روان بماند.
- OpenClaw همچنین یک مسیر محدود self-connect محلیِ بک‌اند/کانتینر برای
  جریان‌های کمکیِ trusted shared-secret دارد.
- کلاینت‌های tailnet و LAN، از جمله bindهای tailnet روی همان میزبان، همچنان به
  تأیید صریح جفت‌سازی نیاز دارند.

## کشف + انتقال‌ها

- [کشف و انتقال‌ها](/fa/gateway/discovery)
- [Bonjour / mDNS](/fa/gateway/bonjour)
- [دسترسی از راه دور (SSH)](/fa/gateway/remote)
- [Tailscale](/fa/gateway/tailscale)

## گره‌ها + انتقال‌ها

- [نمای کلی گره‌ها](/fa/nodes)
- [پروتکل Bridge (گره‌های legacy، تاریخی)](/fa/gateway/bridge-protocol)
- [راهنمای عملیاتی گره: iOS](/fa/platforms/ios)
- [راهنمای عملیاتی گره: Android](/fa/platforms/android)

## امنیت

- [نمای کلی امنیت](/fa/gateway/security)
- [مرجع پیکربندی Gateway](/fa/gateway/configuration)
- [عیب‌یابی](/fa/gateway/troubleshooting)
- [Doctor](/fa/gateway/doctor)

## مرتبط

- [مدل شبکهٔ Gateway](/fa/gateway/network-model)
- [دسترسی از راه دور](/fa/gateway/remote)
