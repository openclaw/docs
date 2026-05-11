---
read_when:
    - تغییر احراز هویت داشبورد یا حالت‌های در معرض قرارگیری
summary: دسترسی و احراز هویت داشبورد Gateway (رابط کاربری کنترل)
title: داشبورد
x-i18n:
    generated_at: "2026-05-11T20:47:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
---

داشبورد Gateway همان رابط کاربری کنترلِ مرورگری است که به‌صورت پیش‌فرض از `/` ارائه می‌شود
(با `gateway.controlUi.basePath` بازنویسی کنید).

باز کردن سریع (Gateway محلی):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (یا [http://localhost:18789/](http://localhost:18789/))
- با `gateway.tls.enabled: true`، از `https://127.0.0.1:18789/` و
  `wss://127.0.0.1:18789` برای نقطه پایانی WebSocket استفاده کنید.

مراجع کلیدی:

- [رابط کاربری کنترل](/fa/web/control-ui) برای کاربرد و قابلیت‌های رابط کاربری.
- [Tailscale](/fa/gateway/tailscale) برای خودکارسازی Serve/Funnel.
- [سطح‌های وب](/fa/web) برای حالت‌های bind و نکات امنیتی.

احراز هویت در handshake مربوط به WebSocket از طریق مسیر احراز هویت پیکربندی‌شده gateway
اعمال می‌شود:

- `connect.params.auth.token`
- `connect.params.auth.password`
- سرآیندهای هویت Tailscale Serve وقتی `gateway.auth.allowTailscale: true`
- سرآیندهای هویت trusted-proxy وقتی `gateway.auth.mode: "trusted-proxy"`

`gateway.auth` را در [پیکربندی Gateway](/fa/gateway/configuration) ببینید.

نکته امنیتی: رابط کاربری کنترل یک **سطح ادمین** است (گفت‌وگو، پیکربندی، تأییدیه‌های اجرا).
آن را عمومی در دسترس قرار ندهید. رابط کاربری توکن‌های URL داشبورد را برای نشست فعلی تب مرورگر و URL انتخاب‌شده gateway در sessionStorage نگه می‌دارد و پس از بارگذاری آن‌ها را از URL حذف می‌کند.
localhost، Tailscale Serve، یا تونل SSH را ترجیح دهید.

## مسیر سریع (توصیه‌شده)

- پس از onboarding، CLI داشبورد را به‌صورت خودکار باز می‌کند و یک پیوند تمیز (بدون توکن) چاپ می‌کند.
- باز کردن دوباره در هر زمان: `openclaw dashboard` (پیوند را کپی می‌کند، اگر ممکن باشد مرورگر را باز می‌کند، و اگر headless باشد راهنمای SSH نشان می‌دهد).
- اگر تحویل از طریق کلیپ‌بورد و مرورگر ناموفق باشد، `openclaw dashboard` همچنان
  URL تمیز را چاپ می‌کند و به شما می‌گوید از توکن `OPENCLAW_GATEWAY_TOKEN` یا
  `gateway.auth.token` به‌عنوان کلید fragment در URL با نام `token` استفاده کنید؛ مقدار توکن‌ها را در لاگ‌ها چاپ نمی‌کند.
- اگر رابط کاربری برای احراز هویت shared-secret درخواست داد، توکن یا
  گذرواژه پیکربندی‌شده را در تنظیمات رابط کاربری کنترل وارد کنید.

## مبانی احراز هویت (محلی در برابر راه دور)

- **Localhost**: `http://127.0.0.1:18789/` را باز کنید.
- **TLS Gateway**: وقتی `gateway.tls.enabled: true`، پیوندهای داشبورد/وضعیت از
  `https://` و پیوندهای WebSocket رابط کاربری کنترل از `wss://` استفاده می‌کنند.
- **منبع توکن shared-secret**: `gateway.auth.token` (یا
  `OPENCLAW_GATEWAY_TOKEN`)؛ `openclaw dashboard` می‌تواند آن را از طریق fragment در URL
  برای bootstrap یک‌باره ارسال کند، و رابط کاربری کنترل آن را برای
  نشست فعلی تب مرورگر و URL انتخاب‌شده gateway به‌جای localStorage در sessionStorage نگه می‌دارد.
- اگر `gateway.auth.token` با SecretRef مدیریت شود، `openclaw dashboard`
  عمداً یک URL بدون توکن چاپ/کپی/باز می‌کند. این کار از افشای
  توکن‌های مدیریت‌شده خارجی در لاگ‌های shell، تاریخچه کلیپ‌بورد، یا آرگومان‌های
  راه‌اندازی مرورگر جلوگیری می‌کند.
- اگر `gateway.auth.token` به‌صورت SecretRef پیکربندی شده و در shell
  فعلی شما resolve نشده باشد، `openclaw dashboard` همچنان یک URL بدون توکن همراه با
  راهنمای عملی راه‌اندازی احراز هویت چاپ می‌کند.
- **گذرواژه shared-secret**: از `gateway.auth.password` پیکربندی‌شده (یا
  `OPENCLAW_GATEWAY_PASSWORD`) استفاده کنید. داشبورد گذرواژه‌ها را بین reloadها پایدار نگه نمی‌دارد.
- **حالت‌های دارای هویت**: Tailscale Serve می‌تواند احراز هویت رابط کاربری کنترل/WebSocket را
  از طریق سرآیندهای هویت وقتی `gateway.auth.allowTailscale: true` برآورده کند، و یک
  reverse proxy آگاه از هویت و غیر loopback می‌تواند
  `gateway.auth.mode: "trusted-proxy"` را برآورده کند. در این حالت‌ها داشبورد برای WebSocket
  به shared secret واردشده نیاز ندارد.
- **غیر از localhost**: از Tailscale Serve، یک bind غیر loopback با shared-secret، یک
  reverse proxy آگاه از هویت و غیر loopback با
  `gateway.auth.mode: "trusted-proxy"`، یا یک تونل SSH استفاده کنید. APIهای HTTP همچنان از
  احراز هویت shared-secret استفاده می‌کنند مگر اینکه عمداً
  `gateway.auth.mode: "none"` با private-ingress یا احراز هویت HTTP trusted-proxy را اجرا کنید. [سطح‌های وب](/fa/web) را ببینید.

<a id="if-you-see-unauthorized-1008"></a>

## اگر "unauthorized" / 1008 را می‌بینید

- مطمئن شوید gateway قابل دسترسی است (محلی: `openclaw status`؛ راه دور: تونل SSH با `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید).
- برای `AUTH_TOKEN_MISMATCH`، کلاینت‌ها ممکن است وقتی gateway راهنمای retry برمی‌گرداند، یک retry مورد اعتماد با توکن دستگاه cached انجام دهند. این retry با cached-token از scopeهای تأییدشده cached همان توکن دوباره استفاده می‌کند؛ فراخوان‌های دارای `deviceToken` صریح / `scopes` صریح، مجموعه scope درخواستی خود را نگه می‌دارند. اگر احراز هویت پس از آن retry همچنان ناموفق بود، token drift را دستی برطرف کنید.
- برای `AUTH_SCOPE_MISMATCH`، توکن دستگاه شناسایی شده اما scopeهای درخواستی داشبورد را ندارد؛ به‌جای چرخاندن توکن shared gateway، دوباره pair کنید یا قرارداد scope درخواستی را تأیید کنید.
- خارج از آن مسیر retry، اولویت احراز هویت اتصال ابتدا token/password مشترک صریح، سپس `deviceToken` صریح، سپس توکن دستگاه ذخیره‌شده، و سپس توکن bootstrap است.
- در مسیر async مربوط به رابط کاربری کنترل Tailscale Serve، تلاش‌های ناموفق برای همان
  `{scope, ip}` پیش از ثبت‌شدن در limiter احراز هویت ناموفق به‌صورت serialized انجام می‌شوند، بنابراین
  retry بدِ هم‌زمان دوم می‌تواند از قبل `retry later` را نشان دهد.
- برای گام‌های ترمیم token drift، [چک‌لیست بازیابی token drift](/fa/cli/devices#token-drift-recovery-checklist) را دنبال کنید.
- shared secret را از میزبان gateway بازیابی یا تأمین کنید:
  - توکن: `openclaw config get gateway.auth.token`
  - گذرواژه: `gateway.auth.password` پیکربندی‌شده یا
    `OPENCLAW_GATEWAY_PASSWORD` را resolve کنید
  - توکن مدیریت‌شده با SecretRef: ارائه‌دهنده secret خارجی را resolve کنید یا
    `OPENCLAW_GATEWAY_TOKEN` را در این shell export کنید، سپس `openclaw dashboard` را دوباره اجرا کنید
  - shared secret پیکربندی نشده: `openclaw doctor --generate-gateway-token`
- در تنظیمات داشبورد، توکن یا گذرواژه را در فیلد احراز هویت وارد کنید،
  سپس متصل شوید.
- انتخابگر زبان رابط کاربری در **Overview -> Gateway Access -> Language** است.
  این بخشی از کارت دسترسی است، نه بخش Appearance.

## مرتبط

- [رابط کاربری کنترل](/fa/web/control-ui)
- [WebChat](/fa/web/webchat)
