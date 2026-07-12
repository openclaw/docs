---
read_when:
    - راه‌اندازی OpenClaw در Oracle Cloud
    - در جست‌وجوی میزبانی رایگان VPS برای OpenClaw
    - OpenClaw را به‌صورت ۲۴ ساعته و ۷ روز هفته روی یک سرور کوچک می‌خواهید
summary: میزبانی OpenClaw در سطح ARM همیشه رایگان Oracle Cloud
title: ابر اوراکل
x-i18n:
    generated_at: "2026-07-12T10:17:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

یک Gateway دائمی OpenClaw را بدون هیچ هزینه‌ای روی سطح ARM **Always Free** در Oracle Cloud (تا ۴ OCPU، ۲۴ گیگابایت RAM و ۲۰۰ گیگابایت فضای ذخیره‌سازی) اجرا کنید.

## پیش‌نیازها

- حساب Oracle Cloud ([ثبت‌نام](https://www.oracle.com/cloud/free/)) — اگر با مشکلی مواجه شدید، [راهنمای ثبت‌نام جامعه کاربران](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) را ببینید
- حساب Tailscale (رایگان در [tailscale.com](https://tailscale.com))
- یک جفت کلید SSH
- حدود ۳۰ دقیقه زمان

## راه‌اندازی

<Steps>
  <Step title="ایجاد یک نمونه OCI">
    1. وارد [Oracle Cloud Console](https://cloud.oracle.com/) شوید.
    2. به **Compute > Instances > Create Instance** بروید.
    3. پیکربندی کنید:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** ۲ (یا حداکثر ۴)
       - **Memory:** ۱۲ گیگابایت (یا حداکثر ۲۴ گیگابایت)
       - **Boot volume:** ۵۰ گیگابایت (تا ۲۰۰ گیگابایت رایگان)
       - **SSH key:** کلید عمومی خود را اضافه کنید
    4. روی **Create** کلیک کنید و نشانی IP عمومی را یادداشت کنید.

    <Tip>
    اگر ایجاد نمونه با پیام «Out of capacity» ناموفق بود، دامنه دسترس‌پذیری دیگری را امتحان کنید یا بعداً دوباره تلاش کنید. ظرفیت سطح رایگان محدود است.
    </Tip>

  </Step>

  <Step title="اتصال و به‌روزرسانی سیستم">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    بسته `build-essential` برای کامپایل برخی وابستگی‌ها روی ARM ضروری است.

  </Step>

  <Step title="پیکربندی کاربر و نام میزبان">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    فعال‌سازی ماندگاری باعث می‌شود سرویس‌های کاربر پس از خروج نیز به کار خود ادامه دهند.

  </Step>

  <Step title="نصب Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    از این پس از طریق Tailscale متصل شوید: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="نصب OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    هنگامی که پیام «How do you want to hatch your bot?» نمایش داده شد، **Do this later** را انتخاب کنید.

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

    مقدار `gateway.trustedProxies=["127.0.0.1"]` در اینجا فقط برای مدیریت IP ارسالی و کلاینت محلی در پراکسی محلی Tailscale Serve است. این مقدار **همان** `gateway.auth.mode: "trusted-proxy"` نیست. در این راه‌اندازی، مسیرهای نمایشگر تفاوت همچنان رفتار بسته در صورت خطا را حفظ می‌کنند: درخواست‌های خام نمایشگر از `127.0.0.1` که سربرگ‌های ارسالی پراکسی را ندارند، پاسخ `Diff not found` دریافت می‌کنند. برای پیوست‌ها از `mode=file` یا `mode=both` استفاده کنید؛ یا اگر به پیوندهای اشتراک‌پذیر نمایشگر نیاز دارید، نمایشگرهای راه دور را آگاهانه فعال کنید و `plugins.entries.diffs.config.viewerBaseUrl` را تنظیم کنید (یا یک `baseUrl` پراکسی ارسال کنید).

  </Step>

  <Step title="محدودسازی امنیت VCN">
    همه ترافیک به‌جز Tailscale را در مرز شبکه مسدود کنید:

    1. در OCI Console به **Networking > Virtual Cloud Networks** بروید.
    2. روی VCN خود و سپس **Security Lists > Default Security List** کلیک کنید.
    3. همه قواعد ورودی به‌جز `0.0.0.0/0 UDP 41641` مربوط به Tailscale را **Remove** کنید.
    4. قواعد خروجی پیش‌فرض را حفظ کنید تا همه ترافیک خروجی مجاز باشد.

    این کار SSH روی درگاه ۲۲، HTTP، HTTPS و هر ترافیک دیگری را در مرز شبکه مسدود می‌کند. از این مرحله به بعد فقط از طریق Tailscale می‌توانید متصل شوید.

  </Step>

  <Step title="اعتبارسنجی">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    از هر دستگاهی در tailnet خود به رابط کنترل دسترسی پیدا کنید:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    مقدار `<tailnet-name>` را با نام tailnet خود جایگزین کنید که در خروجی `tailscale status` قابل مشاهده است.

  </Step>
</Steps>

## اعتبارسنجی وضعیت امنیتی

وقتی VCN محدود شده باشد و فقط UDP 41641 باز بماند و Gateway به local loopback متصل باشد، ترافیک عمومی در مرز شبکه مسدود می‌شود و دسترسی مدیریتی فقط از طریق tailnet امکان‌پذیر است. در نتیجه، دیگر به چندین مرحله سنتی ایمن‌سازی VPS نیازی نیست:

| مرحله سنتی                  | لازم است؟       | دلیل                                                                          |
| --------------------------- | --------------- | ----------------------------------------------------------------------------- |
| دیواره آتش UFW              | خیر             | VCN ترافیک را پیش از رسیدن به نمونه مسدود می‌کند.                             |
| fail2ban                    | خیر             | درگاه ۲۲ در VCN مسدود است و سطحی برای حملات جست‌وجوی فراگیر وجود ندارد.       |
| ایمن‌سازی sshd              | خیر             | SSH در Tailscale از sshd استفاده نمی‌کند.                                    |
| غیرفعال‌کردن ورود root      | خیر             | Tailscale بر اساس هویت tailnet احراز هویت می‌کند، نه کاربران سیستم.          |
| احراز هویت فقط با کلید SSH  | خیر             | به همین دلیل؛ هویت tailnet جایگزین کلیدهای SSH سیستم می‌شود.                 |
| ایمن‌سازی IPv6              | معمولاً خیر     | به تنظیمات VCN و زیرشبکه بستگی دارد؛ موارد واقعاً تخصیص‌یافته یا در معرض دسترس را بررسی کنید. |

مواردی که همچنان توصیه می‌شوند:

- اجرای `chmod 700 ~/.openclaw` برای محدودکردن مجوزهای فایل‌های اعتبارنامه.
- اجرای `openclaw security audit` برای بررسی وضعیت امنیتی مختص OpenClaw.
- اجرای منظم `sudo apt update && sudo apt upgrade` برای نصب وصله‌های سیستم‌عامل.
- بررسی دوره‌ای دستگاه‌ها در [کنسول مدیریتی Tailscale](https://login.tailscale.com/admin).

دستورهای اعتبارسنجی سریع:

```bash
# تأیید کنید هیچ درگاه عمومی در حال شنود نیست
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# فعال‌بودن SSH در Tailscale را بررسی کنید
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# اختیاری: پس از تأیید عملکرد SSH در Tailscale، sshd را کاملاً غیرفعال کنید
sudo systemctl disable --now ssh
```

## نکات ARM

سطح Always Free از معماری ARM (`aarch64`) استفاده می‌کند. بیشتر قابلیت‌های OpenClaw بدون مشکل کار می‌کنند؛ تعداد کمی از فایل‌های اجرایی بومی به ساخت ARM نیاز دارند:

- Node.js، Telegram و WhatsApp (Baileys): کاملاً JavaScript هستند و مشکلی ندارند.
- بیشتر بسته‌های npm دارای کد بومی: مصنوعات ازپیش‌ساخته‌شده `linux-arm64` برای آن‌ها موجود است.
- ابزارهای کمکی اختیاری CLI، مانند فایل‌های اجرایی Go یا Rust ارائه‌شده توسط Skills: پیش از نصب، وجود نسخه `aarch64` یا `linux-arm64` را بررسی کنید.

معماری را با `uname -m` بررسی کنید؛ خروجی باید `aarch64` باشد. فایل‌های اجرایی فاقد ساخت ARM را از کد منبع نصب کنید یا از آن‌ها صرف‌نظر کنید.

## ماندگاری و پشتیبان‌گیری

وضعیت OpenClaw در مسیرهای زیر نگهداری می‌شود:

- `~/.openclaw/` — شامل `openclaw.json`، فایل `auth-profiles.json` مختص هر عامل، وضعیت کانال‌ها و ارائه‌دهندگان و داده‌های نشست.
- `~/.openclaw/workspace/` — فضای کاری عامل شامل SOUL.md، حافظه و مصنوعات.

این داده‌ها پس از راه‌اندازی مجدد باقی می‌مانند. برای تهیه یک تصویر لحظه‌ای قابل‌انتقال اجرا کنید:

```bash
openclaw backup create
```

## راهکار جایگزین: تونل SSH

اگر Tailscale Serve کار نمی‌کند، از دستگاه محلی خود یک تونل SSH ایجاد کنید:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

سپس `http://localhost:18789` را باز کنید.

## عیب‌یابی

**ایجاد نمونه ناموفق است («Out of capacity»)** — نمونه‌های ARM سطح رایگان پرطرفدارند. دامنه دسترس‌پذیری دیگری را امتحان کنید یا در ساعات کم‌مصرف دوباره تلاش کنید.

**Tailscale متصل نمی‌شود** — برای احراز هویت مجدد، `sudo tailscale up --ssh --hostname=openclaw --reset` را اجرا کنید.

**Gateway راه‌اندازی نمی‌شود** — دستور `openclaw doctor --non-interactive` را اجرا کنید و گزارش‌ها را با `journalctl --user -u openclaw-gateway.service -n 50` بررسی کنید.

**مشکلات فایل‌های اجرایی ARM** — بیشتر بسته‌های npm روی ARM64 کار می‌کنند. برای فایل‌های اجرایی بومی به‌دنبال نسخه‌های `linux-arm64` یا `aarch64` بگردید. معماری را با `uname -m` بررسی کنید.

## مراحل بعدی

- [کانال‌ها](/fa/channels) — Telegram، WhatsApp، Discord و موارد دیگر را متصل کنید
- [پیکربندی Gateway](/fa/gateway/configuration) — همه گزینه‌های پیکربندی
- [به‌روزرسانی](/fa/install/updating) — OpenClaw را به‌روز نگه دارید

## مطالب مرتبط

- [نمای کلی نصب](/fa/install)
- [GCP](/fa/install/gcp)
- [میزبانی VPS](/fa/vps)
