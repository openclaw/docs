---
read_when:
    - راه‌اندازی OpenClaw در Oracle Cloud
    - به‌دنبال میزبانی رایگان VPS برای OpenClaw
    - می‌خواهید OpenClaw را به‌صورت 24/7 روی یک سرور کوچک داشته باشید
summary: میزبانی OpenClaw روی سطح ARM همیشه‌رایگان Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-29T23:06:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: dce0d2a33556c8e48a48df744f8d1341fcfa78c93ff5a5e02a5013d207f3e6ed
    source_path: install/oracle.md
    workflow: 16
---

Gateway پایدار OpenClaw را روی سطح ARM **Always Free** در Oracle Cloud (تا 4 OCPU، 24 گیگابایت RAM، 200 گیگابایت فضای ذخیره‌سازی) بدون هزینه اجرا کنید.

## پیش‌نیازها

- حساب Oracle Cloud ([ثبت‌نام](https://www.oracle.com/cloud/free/)) -- اگر با مشکل مواجه شدید، [راهنمای ثبت‌نام جامعه کاربری](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) را ببینید
- حساب Tailscale (رایگان در [tailscale.com](https://tailscale.com))
- یک جفت کلید SSH
- حدود 30 دقیقه زمان

## راه‌اندازی

<Steps>
  <Step title="ایجاد یک نمونه OCI">
    1. وارد [Oracle Cloud Console](https://cloud.oracle.com/) شوید.
    2. به **Compute > Instances > Create Instance** بروید.
    3. پیکربندی کنید:
       - **نام:** `openclaw`
       - **ایمیج:** Ubuntu 24.04 (aarch64)
       - **شکل:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (یا تا 4)
       - **حافظه:** 12 گیگابایت (یا تا 24 گیگابایت)
       - **حجم راه‌اندازی:** 50 گیگابایت (تا 200 گیگابایت رایگان)
       - **کلید SSH:** کلید عمومی خود را اضافه کنید
    4. روی **Create** کلیک کنید و نشانی IP عمومی را یادداشت کنید.

    <Tip>
    اگر ایجاد نمونه با پیام «Out of capacity» شکست خورد، یک دامنه دسترس‌پذیری دیگر را امتحان کنید یا بعدا دوباره تلاش کنید. ظرفیت سطح رایگان محدود است.
    </Tip>

  </Step>

  <Step title="اتصال و به‌روزرسانی سیستم">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` برای کامپایل ARM برخی وابستگی‌ها لازم است.

  </Step>

  <Step title="پیکربندی کاربر و نام میزبان">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    فعال کردن linger باعث می‌شود سرویس‌های کاربر پس از خروج هم اجرا بمانند.

  </Step>

  <Step title="نصب Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    از این به بعد، از طریق Tailscale وصل شوید: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="نصب OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    وقتی پرسیده شد «How do you want to hatch your bot?»، **Do this later** را انتخاب کنید.

  </Step>

  <Step title="پیکربندی Gateway">
    برای دسترسی امن از راه دور، از احراز هویت توکنی همراه با Tailscale Serve استفاده کنید.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` در اینجا فقط برای پردازش IP فورواردشده/کلاینت محلی توسط پراکسی محلی Tailscale Serve است. این **نه** `gateway.auth.mode: "trusted-proxy"` است. مسیرهای نمایشگر diff در این راه‌اندازی رفتار fail-closed را حفظ می‌کنند: درخواست‌های خام نمایشگر `127.0.0.1` بدون هدرهای پراکسی فورواردشده می‌توانند `Diff not found` برگردانند. برای پیوست‌ها از `mode=file` / `mode=both` استفاده کنید، یا اگر به پیوندهای نمایشگر قابل‌اشتراک‌گذاری نیاز دارید، آگاهانه نمایشگرهای راه دور را فعال کنید و `plugins.entries.diffs.config.viewerBaseUrl` را تنظیم کنید (یا یک `baseUrl` پراکسی پاس بدهید).

  </Step>

  <Step title="قفل کردن امنیت VCN">
    همه ترافیک را به‌جز Tailscale در لبه شبکه مسدود کنید:

    1. در OCI Console به **Networking > Virtual Cloud Networks** بروید.
    2. روی VCN خود کلیک کنید، سپس **Security Lists > Default Security List** را باز کنید.
    3. همه قانون‌های ورودی را **حذف** کنید، به‌جز `0.0.0.0/0 UDP 41641` (Tailscale).
    4. قانون‌های خروجی پیش‌فرض را نگه دارید (اجازه به همه خروجی‌ها).

    این کار SSH روی پورت 22، HTTP، HTTPS و هر چیز دیگر را در لبه شبکه مسدود می‌کند. از این نقطه به بعد فقط می‌توانید از طریق Tailscale وصل شوید.

  </Step>

  <Step title="اعتبارسنجی">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    از هر دستگاهی در tailnet خود به Control UI دسترسی پیدا کنید:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    `<tailnet-name>` را با نام tailnet خود جایگزین کنید (در `tailscale status` قابل مشاهده است).

  </Step>
</Steps>

## جایگزین: تونل SSH

اگر Tailscale Serve کار نمی‌کند، از دستگاه محلی خود یک تونل SSH بسازید:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

سپس `http://localhost:18789` را باز کنید.

## عیب‌یابی

**ایجاد نمونه شکست می‌خورد («Out of capacity»)** -- نمونه‌های ARM سطح رایگان محبوب هستند. یک دامنه دسترس‌پذیری دیگر را امتحان کنید یا در ساعت‌های کم‌ترافیک دوباره تلاش کنید.

**Tailscale وصل نمی‌شود** -- برای احراز هویت دوباره، `sudo tailscale up --ssh --hostname=openclaw --reset` را اجرا کنید.

**Gateway شروع نمی‌شود** -- `openclaw doctor --non-interactive` را اجرا کنید و گزارش‌ها را با `journalctl --user -u openclaw-gateway.service -n 50` بررسی کنید.

**مشکلات باینری ARM** -- بیشتر بسته‌های npm روی ARM64 کار می‌کنند. برای باینری‌های بومی، به‌دنبال انتشارهای `linux-arm64` یا `aarch64` بگردید. معماری را با `uname -m` بررسی کنید.

## گام‌های بعدی

- [کانال‌ها](/fa/channels) -- Telegram، WhatsApp، Discord و موارد بیشتر را متصل کنید
- [پیکربندی Gateway](/fa/gateway/configuration) -- همه گزینه‌های پیکربندی
- [به‌روزرسانی](/fa/install/updating) -- OpenClaw را به‌روز نگه دارید

## مرتبط

- [نمای کلی نصب](/fa/install)
- [GCP](/fa/install/gcp)
- [میزبانی VPS](/fa/vps)
