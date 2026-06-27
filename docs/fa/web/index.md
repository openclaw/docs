---
read_when:
    - می‌خواهید از طریق Tailscale به Gateway دسترسی داشته باشید
    - شما UI کنترل مرورگر و ویرایش پیکربندی را می‌خواهید
summary: 'سطوح وب Gateway: رابط کاربری کنترل، حالت‌های bind، و امنیت'
title: وب
x-i18n:
    generated_at: "2026-06-27T19:08:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Gateway یک **رابط کاربری کنترلِ مرورگری** کوچک (Vite + Lit) را از همان پورتی ارائه می‌کند که Gateway WebSocket از آن استفاده می‌کند:

- پیش‌فرض: `http://<host>:18789/`
- با `gateway.tls.enabled: true`: `https://<host>:18789/`
- پیشوند اختیاری: `gateway.controlUi.basePath` را تنظیم کنید (مثلاً `/openclaw`)

قابلیت‌ها در [رابط کاربری کنترل](/fa/web/control-ui) قرار دارند. بقیه این صفحه بر حالت‌های bind، امنیت، و سطوح در معرض وب تمرکز دارد.

## Webhookها

وقتی `hooks.enabled=true` باشد، Gateway همچنین یک endpoint کوچک Webhook را روی همان سرور HTTP ارائه می‌کند.
برای احراز هویت و payloadها، [پیکربندی Gateway](/fa/gateway/configuration) ← `hooks` را ببینید.

## RPC مدیریتی HTTP

RPC مدیریتی HTTP روش‌های منتخب control-plane مربوط به Gateway را در `POST /api/v1/admin/rpc` ارائه می‌کند.
این قابلیت به‌صورت پیش‌فرض غیرفعال است و فقط زمانی ثبت می‌شود که Plugin `admin-http-rpc` فعال باشد.
برای مدل احراز هویت، روش‌های مجاز، و مقایسه با WebSocket، [RPC مدیریتی HTTP](/fa/plugins/admin-http-rpc) را ببینید.

## پیکربندی (به‌صورت پیش‌فرض روشن)

رابط کاربری کنترل وقتی assetها موجود باشند (`dist/control-ui`) **به‌صورت پیش‌فرض فعال** است.
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

- `https://<magicdns>/` (یا `gateway.controlUi.basePath` پیکربندی‌شده شما)

### bind برای Tailnet + توکن

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

سپس gateway را شروع کنید (این مثال غیر-loopback از احراز هویت با توکن secret مشترک استفاده می‌کند):

```bash
openclaw gateway
```

باز کنید:

- `http://<tailscale-ip>:18789/` (یا `gateway.controlUi.basePath` پیکربندی‌شده شما)

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

- احراز هویت Gateway به‌صورت پیش‌فرض لازم است (توکن، گذرواژه، trusted-proxy، یا headerهای هویت Tailscale Serve وقتی فعال باشند).
- bindهای غیر-loopback همچنان احراز هویت gateway را **الزامی** می‌کنند. در عمل، این یعنی احراز هویت با توکن/گذرواژه یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`.
- wizard به‌صورت پیش‌فرض احراز هویت با secret مشترک می‌سازد و معمولاً یک توکن gateway تولید می‌کند (حتی روی loopback).
- در حالت secret مشترک، رابط کاربری `connect.params.auth.token` یا `connect.params.auth.password` را ارسال می‌کند.
- وقتی `gateway.tls.enabled: true` باشد، helperهای dashboard و status محلی، URLهای dashboard را با `https://` و URLهای WebSocket را با `wss://` نمایش می‌دهند.
- در حالت‌های دارای هویت مانند Tailscale Serve یا `trusted-proxy`، بررسی احراز هویت WebSocket به‌جای آن از headerهای درخواست برآورده می‌شود.
- برای استقرارهای عمومی غیر-loopback رابط کاربری کنترل، `gateway.controlUi.allowedOrigins` را صریحاً تنظیم کنید (originهای کامل). بارگذاری‌های خصوصی same-origin در LAN/Tailnet برای loopback، RFC1918/link-local، `.local`، `.ts.net`، و میزبان‌های Tailscale CGNAT پذیرفته می‌شوند.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` حالت fallback origin بر پایه Host-header را فعال می‌کند، اما یک کاهش امنیتی خطرناک است.
- با Serve، headerهای هویت Tailscale می‌توانند احراز هویت رابط کاربری کنترل/WebSocket را وقتی `gateway.auth.allowTailscale` برابر `true` باشد برآورده کنند (بدون نیاز به توکن/گذرواژه).
  endpointهای HTTP API از آن headerهای هویت Tailscale استفاده نمی‌کنند؛ در عوض از حالت احراز هویت HTTP معمول gateway پیروی می‌کنند. برای الزام به credentialهای صریح، `gateway.auth.allowTailscale: false` را تنظیم کنید. [Tailscale](/fa/gateway/tailscale) و [امنیت](/fa/gateway/security) را ببینید. این جریان بدون توکن فرض می‌کند میزبان gateway قابل اعتماد است.
- `gateway.tailscale.mode: "funnel"` به `gateway.auth.mode: "password"` نیاز دارد (گذرواژه مشترک).

## ساخت رابط کاربری

Gateway فایل‌های static را از `dist/control-ui` ارائه می‌کند. آن‌ها را با دستور زیر بسازید:

```bash
pnpm ui:build
```
