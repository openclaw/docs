---
read_when:
    - می‌خواهید نمایی مختصر از مدل شبکه‌سازی Gateway داشته باشید
summary: نحوهٔ اتصال Gateway، نودها و میزبان بوم.
title: مدل شبکه
x-i18n:
    generated_at: "2026-04-29T22:53:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 16
---

> این محتوا در [Network](/fa/network#core-model) ادغام شده است. برای راهنمای فعلی، آن صفحه را ببینید.

بیشتر عملیات از طریق Gateway (`openclaw gateway`) انجام می‌شود؛ یک فرایند واحد و بلندمدت که مالک اتصال‌های کانال و صفحه کنترل WebSocket است.

## قوانین اصلی

- توصیه می‌شود برای هر میزبان یک Gateway داشته باشید. این تنها فرایندی است که مجاز است مالک نشست WhatsApp Web باشد. برای ربات‌های نجات یا ایزولاسیون سخت‌گیرانه، چند Gateway را با پروفایل‌ها و پورت‌های جدا اجرا کنید. [چند Gateway](/fa/gateway/multiple-gateways) را ببینید.
- ابتدا loopback: مقدار پیش‌فرض Gateway WS برابر `ws://127.0.0.1:18789` است. راه‌انداز به‌طور پیش‌فرض احراز هویت با راز مشترک ایجاد می‌کند و معمولا حتی برای loopback هم یک توکن می‌سازد. برای دسترسی غیر loopback، از یک مسیر معتبر احراز هویت Gateway استفاده کنید: احراز هویت با توکن/رمز عبور راز مشترک، یا استقرار غیر loopback از نوع `trusted-proxy` که درست پیکربندی شده باشد. راه‌اندازی‌های tailnet/موبایل معمولا به‌جای tailnet خام `ws://` از طریق Tailscale Serve یا یک نقطه پایانی `wss://` دیگر بهتر کار می‌کنند.
- Nodeها در صورت نیاز از طریق LAN،‏ tailnet یا SSH به Gateway WS وصل می‌شوند. پل TCP قدیمی حذف شده است.
- میزبان Canvas توسط سرور HTTP مربوط به Gateway روی **همان پورت** Gateway ارائه می‌شود (پیش‌فرض `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    وقتی `gateway.auth` پیکربندی شده باشد و Gateway فراتر از loopback bind شود، این مسیرها با احراز هویت Gateway محافظت می‌شوند. کلاینت‌های Node از URLهای قابلیت با دامنه Node استفاده می‌کنند که به نشست فعال WS آن‌ها وابسته است. [پیکربندی Gateway](/fa/gateway/configuration) (`canvasHost`, `gateway`) را ببینید.
- استفاده راه دور معمولا با تونل SSH یا VPN نوع tailnet انجام می‌شود. [دسترسی راه دور](/fa/gateway/remote) و [کشف](/fa/gateway/discovery) را ببینید.

## مرتبط

- [دسترسی راه دور](/fa/gateway/remote)
- [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)
- [پروتکل Gateway](/fa/gateway/protocol)
