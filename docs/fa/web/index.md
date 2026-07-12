---
read_when:
    - می‌خواهید از طریق Tailscale به Gateway دسترسی پیدا کنید
    - شما رابط کاربری کنترل در مرورگر و ویرایش پیکربندی را می‌خواهید
summary: 'رابط‌های وب Gateway: رابط کاربری کنترل، حالت‌های اتصال و امنیت'
title: وب
x-i18n:
    generated_at: "2026-07-12T11:06:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway یک **رابط کاربری کنترل در مرورگر** کوچک (Vite + Lit) را از همان درگاه WebSocket مربوط به Gateway ارائه می‌کند:

- پیش‌فرض: `http://<host>:18789/`
- با `gateway.tls.enabled: true`: `https://<host>:18789/`
- پیشوند اختیاری: `gateway.controlUi.basePath` را تنظیم کنید (برای مثال، `/openclaw`)

قابلیت‌ها در [رابط کاربری کنترل](/fa/web/control-ui) توضیح داده شده‌اند. این صفحه حالت‌های اتصال، امنیت و دیگر سطوح در معرض وب را پوشش می‌دهد.

## پیکربندی (به‌طور پیش‌فرض فعال)

هنگامی که دارایی‌ها موجود باشند (`dist/control-ui`)، رابط کاربری کنترل **به‌طور پیش‌فرض فعال است**:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath اختیاری است
  },
}
```

## Webhookها

وقتی `hooks.enabled=true` باشد، Gateway یک نقطه پایانی Webhook را نیز روی همان سرور HTTP ارائه می‌کند. برای احراز هویت و بارهای داده، بخش `hooks` را در [مرجع پیکربندی Gateway](/fa/gateway/configuration-reference#hooks) ببینید.

## فراخوانی رویهٔ راه‌دور مدیریتی HTTP

`POST /api/v1/admin/rpc` روش‌های منتخب صفحهٔ کنترل Gateway را از طریق HTTP ارائه می‌کند. این قابلیت به‌طور پیش‌فرض غیرفعال است و فقط زمانی ثبت می‌شود که Plugin به نام `admin-http-rpc` فعال باشد. برای مدل احراز هویت، روش‌های مجاز و مقایسه با API مبتنی بر WebSocket، [فراخوانی رویهٔ راه‌دور مدیریتی HTTP](/fa/plugins/admin-http-rpc) را ببینید.

## دسترسی Tailscale

<Tabs>
  <Tab title="سرویس‌دهی یکپارچه (توصیه‌شده)">
    Gateway را روی local loopback نگه دارید و اجازه دهید Tailscale Serve آن را پراکسی کند:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Gateway را راه‌اندازی کنید:

    ```bash
    openclaw gateway
    ```

    `https://<magicdns>/` (یا `gateway.controlUi.basePath` پیکربندی‌شدهٔ خود) را باز کنید.

  </Tab>
  <Tab title="اتصال Tailnet + توکن">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Gateway را راه‌اندازی کنید (این نمونهٔ غیر local loopback از احراز هویت توکنِ راز مشترک استفاده می‌کند):

    ```bash
    openclaw gateway
    ```

    `http://<tailscale-ip>:18789/` (یا `gateway.controlUi.basePath` پیکربندی‌شدهٔ خود) را باز کنید.

  </Tab>
  <Tab title="اینترنت عمومی (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // یا OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` به `gateway.auth.mode: "password"` نیاز دارد؛ Serve و Funnel هر دو به `gateway.bind: "loopback"` نیاز دارند.

  </Tab>
</Tabs>

## نکات امنیتی

- احراز هویت Gateway به‌طور پیش‌فرض الزامی است: توکن، گذرواژه، پراکسی مورداعتماد یا سرآیندهای هویت Tailscale Serve، در صورت فعال بودن.
- اتصال‌های غیر local loopback همچنان **به** احراز هویت Gateway **نیاز دارند**: احراز هویت با توکن/گذرواژه یا پراکسی معکوس آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`.
- راهنمای راه‌اندازی اولیه به‌طور پیش‌فرض احراز هویت با راز مشترک ایجاد می‌کند و معمولاً حتی روی local loopback نیز یک توکن Gateway تولید می‌کند.
- در حالت راز مشترک، رابط کاربری هنگام دست‌دهی WebSocket، مقدار `connect.params.auth.token` یا `connect.params.auth.password` را ارسال می‌کند.
- با `gateway.tls.enabled: true`، ابزارهای کمکی داشبورد/وضعیت محلی، نشانی‌های `https://` و نشانی‌های WebSocket با `wss://` را نمایش می‌دهند.
- در حالت‌های دارای هویت (Tailscale Serve و `trusted-proxy`)، بررسی احراز هویت WebSocket به‌جای راز مشترک، با سرآیندهای درخواست برآورده می‌شود.
- برای استقرارهای عمومی و غیر local loopback رابط کاربری کنترل، `gateway.controlUi.allowedOrigins` را به‌صراحت تنظیم کنید (مبدأهای کامل). بارگذاری‌های خصوصی با مبدأ یکسان بدون این تنظیم برای local loopback، میزبان‌های RFC1918/پیوند-محلی، `.local`، `.ts.net` و Tailscale CGNAT پذیرفته می‌شوند.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` بازگشت به مبدأ مبتنی بر سرآیند Host را فعال می‌کند؛ این یک تنزل امنیتی خطرناک است.
- هنگام استفاده از Serve، اگر `gateway.auth.allowTailscale: true` باشد، سرآیندهای هویت Tailscale احراز هویت رابط کاربری کنترل/WebSocket را برآورده می‌کنند (به توکن/گذرواژه نیازی نیست). نقاط پایانی API مبتنی بر HTTP از سرآیندهای هویت Tailscale استفاده نمی‌کنند؛ آن‌ها همیشه از حالت عادی احراز هویت HTTP مربوط به Gateway پیروی می‌کنند. برای الزام اعتبارنامه‌های صریح حتی از طریق Serve، `gateway.auth.allowTailscale: false` را تنظیم کنید. این جریان بدون توکن فرض می‌کند که خود میزبان Gateway مورداعتماد است. [Tailscale](/fa/gateway/tailscale) و [امنیت](/fa/gateway/security) را ببینید.

## ساخت رابط کاربری

Gateway فایل‌های ایستا را از `dist/control-ui` ارائه می‌کند:

```bash
pnpm ui:build
```
