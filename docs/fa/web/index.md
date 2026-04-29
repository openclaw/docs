---
read_when:
    - می‌خواهید از طریق Tailscale به Gateway دسترسی داشته باشید
    - شما رابط کاربری کنترل مرورگر و ویرایش پیکربندی را می‌خواهید
summary: 'سطوح وب Gateway: رابط کاربری کنترل، حالت‌های اتصال، و امنیت'
title: وب
x-i18n:
    generated_at: "2026-04-29T23:49:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1e357d1e9f4ad0286b9412cd0a684b6428180e0586eef76577ecb2909212fb2
    source_path: web/index.md
    workflow: 16
---

Gateway یک **رابط کاربری کنترل مرورگر** کوچک (Vite + Lit) را از همان پورتی که WebSocket مربوط به Gateway استفاده می‌کند ارائه می‌کند:

- پیش‌فرض: `http://<host>:18789/`
- با `gateway.tls.enabled: true`: `https://<host>:18789/`
- پیشوند اختیاری: `gateway.controlUi.basePath` را تنظیم کنید (مثلاً `/openclaw`)

قابلیت‌ها در [رابط کاربری کنترل](/fa/web/control-ui) قرار دارند. ادامه‌ی این صفحه بر حالت‌های bind، امنیت، و سطوح در معرض وب تمرکز دارد.

## Webhookها

وقتی `hooks.enabled=true` باشد، Gateway همچنین یک endpoint کوچک Webhook را روی همان سرور HTTP در دسترس قرار می‌دهد.
برای احراز هویت + payloadها، [پیکربندی Gateway](/fa/gateway/configuration) ← `hooks` را ببینید.

## پیکربندی (به‌صورت پیش‌فرض روشن)

وقتی assetها موجود باشند (`dist/control-ui`)، رابط کاربری کنترل **به‌صورت پیش‌فرض فعال است**.
می‌توانید آن را از طریق پیکربندی کنترل کنید:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## دسترسی Tailscale

### Serve یکپارچه (توصیه‌شده)

Gateway را روی loopback نگه دارید و اجازه دهید Tailscale Serve آن را proxy کند:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

سپس gateway را شروع کنید:

```bash
openclaw gateway
```

باز کنید:

- `https://<magicdns>/` (یا `gateway.controlUi.basePath` پیکربندی‌شده‌ی شما)

### bind روی tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

سپس gateway را شروع کنید (این مثال non-loopback از احراز هویت token با shared-secret استفاده می‌کند):

```bash
openclaw gateway
```

باز کنید:

- `http://<tailscale-ip>:18789/` (یا `gateway.controlUi.basePath` پیکربندی‌شده‌ی شما)

### اینترنت عمومی (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## نکات امنیتی

- احراز هویت Gateway به‌صورت پیش‌فرض الزامی است (token، password، trusted-proxy، یا headerهای هویت Tailscale Serve وقتی فعال باشند).
- bindهای non-loopback همچنان احراز هویت gateway را **الزامی** می‌کنند. در عمل یعنی احراز هویت token/password یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`.
- wizard به‌صورت پیش‌فرض احراز هویت shared-secret ایجاد می‌کند و معمولاً یک token برای gateway تولید می‌کند (حتی روی loopback).
- در حالت shared-secret، رابط کاربری `connect.params.auth.token` یا `connect.params.auth.password` را ارسال می‌کند.
- وقتی `gateway.tls.enabled: true` باشد، dashboard محلی و helperهای status، URLهای dashboard را با `https://` و URLهای WebSocket را با `wss://` نمایش می‌دهند.
- در حالت‌های دارای هویت مانند Tailscale Serve یا `trusted-proxy`، بررسی احراز هویت WebSocket به‌جای آن از headerهای درخواست تأمین می‌شود.
- برای استقرارهای رابط کاربری کنترل non-loopback، `gateway.controlUi.allowedOrigins` را صریحاً تنظیم کنید (originهای کامل). بدون آن، راه‌اندازی gateway به‌صورت پیش‌فرض رد می‌شود.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` حالت fallback origin مبتنی بر Host-header را فعال می‌کند، اما یک کاهش امنیتی خطرناک است.
- با Serve، headerهای هویت Tailscale می‌توانند احراز هویت رابط کاربری کنترل/WebSocket را وقتی `gateway.auth.allowTailscale` برابر `true` باشد تأمین کنند (بدون نیاز به token/password). endpointهای HTTP API از آن headerهای هویت Tailscale استفاده نمی‌کنند؛ در عوض از حالت احراز هویت HTTP معمول gateway پیروی می‌کنند. برای الزام credentials صریح، `gateway.auth.allowTailscale: false` را تنظیم کنید. [Tailscale](/fa/gateway/tailscale) و [امنیت](/fa/gateway/security) را ببینید. این جریان بدون token فرض می‌کند میزبان gateway قابل اعتماد است.
- `gateway.tailscale.mode: "funnel"` به `gateway.auth.mode: "password"` نیاز دارد (shared password).

## ساخت رابط کاربری

Gateway فایل‌های static را از `dist/control-ui` ارائه می‌کند. آن‌ها را با این دستور بسازید:

```bash
pnpm ui:build
```
