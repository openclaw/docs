---
read_when:
    - به مرور کلی معماری شبکه و امنیت نیاز دارید
    - در حال اشکال‌زدایی دسترسی محلی در مقایسه با دسترسی از طریق tailnet یا جفت‌سازی هستید
    - فهرست مرجع مستندات شبکه را می‌خواهید
summary: 'هاب شبکه: سطوح Gateway، جفت‌سازی، کشف و امنیت'
title: شبکه
x-i18n:
    generated_at: "2026-07-12T10:19:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

این مرکز به مستندات اصلی دربارهٔ نحوهٔ اتصال، جفت‌سازی و ایمن‌سازی
دستگاه‌ها توسط OpenClaw در localhost، شبکهٔ محلی و tailnet پیوند می‌دهد.

## مدل اصلی

بیشتر عملیات از طریق Gateway (`openclaw gateway`) انجام می‌شوند؛ فرایندی واحد و بلندمدت که مالک اتصال‌های کانال و صفحهٔ کنترل WebSocket است.

- **ابتدا local loopback**: نشانی پیش‌فرض WS در Gateway برابر با `ws://127.0.0.1:18789` است.
  اتصال‌های غیرـloopback بدون یک مسیر معتبر احراز هویت Gateway
  راه‌اندازی نمی‌شوند: احراز هویت با توکن/گذرواژهٔ محرمانهٔ مشترک، یا استقرار
  غیرـloopback از نوع `trusted-proxy` که به‌درستی پیکربندی شده باشد.
- استفاده از **یک Gateway برای هر میزبان** توصیه می‌شود. برای جداسازی، چند Gateway را با نمایه‌ها و درگاه‌های مجزا اجرا کنید ([چند Gateway](/fa/gateway/multiple-gateways)).
- **میزبان Canvas** روی همان درگاه Gateway ارائه می‌شود (`/__openclaw__/canvas/`، `/__openclaw__/a2ui/`) و هنگام اتصال فراتر از loopback، با احراز هویت Gateway محافظت می‌شود.
- **دسترسی از راه دور** معمولاً از طریق تونل SSH یا VPN مبتنی بر Tailscale انجام می‌شود ([دسترسی از راه دور](/fa/gateway/remote)).

منابع کلیدی:

- [معماری Gateway](/fa/concepts/architecture)
- [پروتکل Gateway](/fa/gateway/protocol)
- [راهنمای عملیاتی Gateway](/fa/gateway)
- [سطوح وب و حالت‌های اتصال](/fa/web)

## جفت‌سازی و هویت

- [نمای کلی جفت‌سازی (پیام مستقیم و Nodeها)](/fa/channels/pairing)
- [جفت‌سازی Node تحت مالکیت Gateway](/fa/gateway/pairing)
- [CLI دستگاه‌ها (جفت‌سازی و چرخش توکن)](/fa/cli/devices)
- [CLI جفت‌سازی (تأیید پیام‌های مستقیم)](/fa/cli/pairing)

اعتماد محلی:

- اتصال‌های مستقیم local loopback (بدون سرآیندهای هدایت‌شده/پراکسی) می‌توانند
  برای جفت‌سازی به‌طور خودکار تأیید شوند تا تجربهٔ کاربری روی یک میزبان روان بماند.
- OpenClaw همچنین یک مسیر محدود اتصال به خود در سطح بک‌اند/کانتینر محلی برای
  جریان‌های کمکی قابل‌اعتماد مبتنی بر محرمانهٔ مشترک دارد.
- کلاینت‌های tailnet و شبکهٔ محلی، از جمله اتصال‌های tailnet روی همان میزبان،
  همچنان به تأیید صریح جفت‌سازی نیاز دارند.

## کشف و روش‌های انتقال

- [کشف و روش‌های انتقال](/fa/gateway/discovery)
- [Bonjour / mDNS](/fa/gateway/bonjour)
- [دسترسی از راه دور (SSH)](/fa/gateway/remote)
- [Tailscale](/fa/gateway/tailscale)

## Nodeها و روش‌های انتقال

- [نمای کلی Nodeها](/fa/nodes)
- [پروتکل پل (Nodeهای قدیمی، تاریخی)](/fa/gateway/bridge-protocol)
- [راهنمای عملیاتی Node: iOS](/fa/platforms/ios)
- [راهنمای عملیاتی Node: Android](/fa/platforms/android)

## امنیت

- [نمای کلی امنیت](/fa/gateway/security)
- [مرجع پیکربندی Gateway](/fa/gateway/configuration)
- [عیب‌یابی](/fa/gateway/troubleshooting)
- [پزشک](/fa/gateway/doctor)

## مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [دسترسی از راه دور](/fa/gateway/remote)
