---
read_when:
    - تغییر حالت‌های احراز هویت یا در معرض قرارگیری داشبورد
summary: دسترسی و احراز هویت داشبورد Gateway (Control UI)
title: داشبورد
x-i18n:
    generated_at: "2026-05-05T01:54:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

داشبورد Gateway همان رابط کاربری کنترل در مرورگر است که به‌طور پیش‌فرض در `/` ارائه می‌شود
(با `gateway.controlUi.basePath` بازنویسی کنید).

باز کردن سریع (Gateway محلی):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (یا [http://localhost:18789/](http://localhost:18789/))
- با `gateway.tls.enabled: true`، از `https://127.0.0.1:18789/` و
  `wss://127.0.0.1:18789` برای نقطه پایانی WebSocket استفاده کنید.

ارجاعات کلیدی:

- [رابط کاربری کنترل](/fa/web/control-ui) برای استفاده و قابلیت‌های رابط کاربری.
- [Tailscale](/fa/gateway/tailscale) برای خودکارسازی Serve/Funnel.
- [سطوح وب](/fa/web) برای حالت‌های bind و نکات امنیتی.

احراز هویت در مرحله handshake مربوط به WebSocket و از طریق مسیر احراز هویت پیکربندی‌شده Gateway
اعمال می‌شود:

- `connect.params.auth.token`
- `connect.params.auth.password`
- سرآیندهای هویت Tailscale Serve وقتی `gateway.auth.allowTailscale: true` است
- سرآیندهای هویت trusted-proxy وقتی `gateway.auth.mode: "trusted-proxy"` است

`gateway.auth` را در [پیکربندی Gateway](/fa/gateway/configuration) ببینید.

نکته امنیتی: رابط کاربری کنترل یک **سطح مدیریتی** است (چت، پیکربندی، تأییدهای exec).
آن را عمومی در دسترس قرار ندهید. رابط کاربری توکن‌های URL داشبورد را برای نشست تب فعلی مرورگر و URL انتخاب‌شده Gateway در sessionStorage نگه می‌دارد و پس از بارگذاری آن‌ها را از URL حذف می‌کند.
localhost، Tailscale Serve یا تونل SSH را ترجیح دهید.

## مسیر سریع (توصیه‌شده)

- پس از onboarding، CLI داشبورد را خودکار باز می‌کند و یک لینک پاک (بدون توکن) چاپ می‌کند.
- باز کردن دوباره در هر زمان: `openclaw dashboard` (لینک را کپی می‌کند، اگر ممکن باشد مرورگر را باز می‌کند، و اگر headless باشد راهنمای SSH نشان می‌دهد).
- اگر تحویل از طریق clipboard و مرورگر شکست بخورد، `openclaw dashboard` همچنان URL پاک را چاپ می‌کند
  و به شما می‌گوید از توکن `OPENCLAW_GATEWAY_TOKEN` یا
  `gateway.auth.token` به‌عنوان کلید fragment URL یعنی `token` استفاده کنید؛ مقدار توکن‌ها را در لاگ‌ها چاپ نمی‌کند.
- اگر رابط کاربری برای احراز هویت با shared-secret درخواست داد، توکن یا
  گذرواژه پیکربندی‌شده را در تنظیمات رابط کاربری کنترل جای‌گذاری کنید.

## مبانی احراز هویت (محلی در برابر راه‌دور)

- **Localhost**: `http://127.0.0.1:18789/` را باز کنید.
- **TLS مربوط به Gateway**: وقتی `gateway.tls.enabled: true` باشد، لینک‌های داشبورد/وضعیت از
  `https://` و لینک‌های WebSocket رابط کاربری کنترل از `wss://` استفاده می‌کنند.
- **منبع توکن shared-secret**: `gateway.auth.token` (یا
  `OPENCLAW_GATEWAY_TOKEN`)؛ `openclaw dashboard` می‌تواند آن را از طریق fragment URL برای bootstrap یک‌باره عبور دهد، و رابط کاربری کنترل آن را برای نشست تب فعلی مرورگر و URL انتخاب‌شده Gateway به‌جای localStorage در sessionStorage نگه می‌دارد.
- اگر `gateway.auth.token` با SecretRef مدیریت شود، `openclaw dashboard`
  طبق طراحی یک URL بدون توکن چاپ/کپی/باز می‌کند. این کار از افشای توکن‌های مدیریت‌شده خارجی در لاگ‌های shell، تاریخچه clipboard یا آرگومان‌های راه‌اندازی مرورگر جلوگیری می‌کند.
- اگر `gateway.auth.token` به‌صورت SecretRef پیکربندی شده و در shell فعلی شما resolve نشده باشد، `openclaw dashboard` همچنان یک URL بدون توکن به‌همراه راهنمای عملی برای تنظیم احراز هویت چاپ می‌کند.
- **گذرواژه shared-secret**: از `gateway.auth.password` پیکربندی‌شده (یا
  `OPENCLAW_GATEWAY_PASSWORD`) استفاده کنید. داشبورد گذرواژه‌ها را بین reloadها نگه نمی‌دارد.
- **حالت‌های دارای هویت**: Tailscale Serve می‌تواند احراز هویت رابط کاربری کنترل/WebSocket را از طریق سرآیندهای هویت وقتی `gateway.auth.allowTailscale: true` است برآورده کند، و یک reverse proxy غیر local loopback و آگاه از هویت می‌تواند
  `gateway.auth.mode: "trusted-proxy"` را برآورده کند. در این حالت‌ها داشبورد برای WebSocket به shared secret جای‌گذاری‌شده نیاز ندارد.
- **غیر از localhost**: از Tailscale Serve، یک bind غیر local loopback با shared-secret، یک reverse proxy غیر local loopback و آگاه از هویت با
  `gateway.auth.mode: "trusted-proxy"`، یا یک تونل SSH استفاده کنید. APIهای HTTP همچنان از احراز هویت shared-secret استفاده می‌کنند مگر اینکه عمداً
  `gateway.auth.mode: "none"` برای private-ingress یا احراز هویت HTTP از نوع trusted-proxy را اجرا کنید. [سطوح وب](/fa/web) را ببینید.

<a id="if-you-see-unauthorized-1008"></a>

## اگر "unauthorized" / 1008 را می‌بینید

- مطمئن شوید Gateway در دسترس است (محلی: `openclaw status`؛ راه‌دور: تونل SSH با `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید).
- برای `AUTH_TOKEN_MISMATCH`، کلاینت‌ها ممکن است وقتی Gateway راهنمای retry برمی‌گرداند، یک retry مورد اعتماد با توکن device ذخیره‌شده انجام دهند. آن retry با توکن ذخیره‌شده، scopeهای تأییدشده ذخیره‌شده توکن را دوباره استفاده می‌کند؛ فراخوان‌های دارای `deviceToken` صریح / `scopes` صریح مجموعه scope درخواستی خود را نگه می‌دارند. اگر احراز هویت پس از آن retry همچنان شکست خورد، drift توکن را دستی برطرف کنید.
- خارج از آن مسیر retry، تقدم احراز هویت اتصال ابتدا shared token/password صریح، سپس `deviceToken` صریح، سپس توکن device ذخیره‌شده، سپس توکن bootstrap است.
- در مسیر ناهمگام رابط کاربری کنترل Tailscale Serve، تلاش‌های ناموفق برای همان
  `{scope, ip}` پیش از ثبت آن‌ها توسط محدودکننده failed-auth به‌صورت ترتیبی انجام می‌شوند، بنابراین
  دومین retry بد هم‌زمان می‌تواند از قبل `retry later` را نشان دهد.
- برای مراحل ترمیم drift توکن، [چک‌لیست بازیابی drift توکن](/fa/cli/devices#token-drift-recovery-checklist) را دنبال کنید.
- shared secret را از میزبان Gateway بازیابی یا فراهم کنید:
  - توکن: `openclaw config get gateway.auth.token`
  - گذرواژه: `gateway.auth.password` پیکربندی‌شده یا
    `OPENCLAW_GATEWAY_PASSWORD` را resolve کنید
  - توکن مدیریت‌شده با SecretRef: ارائه‌دهنده secret خارجی را resolve کنید یا
    `OPENCLAW_GATEWAY_TOKEN` را در این shell export کنید، سپس `openclaw dashboard` را دوباره اجرا کنید
  - shared secret پیکربندی نشده است: `openclaw doctor --generate-gateway-token`
- در تنظیمات داشبورد، توکن یا گذرواژه را در فیلد احراز هویت جای‌گذاری کنید،
  سپس وصل شوید.
- انتخاب‌گر زبان رابط کاربری در **نمای کلی -> دسترسی Gateway -> زبان** قرار دارد.
  این بخش جزئی از کارت دسترسی است، نه بخش ظاهر.

## مرتبط

- [رابط کاربری کنترل](/fa/web/control-ui)
- [WebChat](/fa/web/webchat)
