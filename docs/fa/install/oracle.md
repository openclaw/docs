---
read_when:
    - راه‌اندازی OpenClaw روی Oracle Cloud
    - به‌دنبال میزبانی VPS رایگان برای OpenClaw
    - می‌خواهید OpenClaw به‌صورت ۲۴/۷ روی یک سرور کوچک اجرا شود
summary: OpenClaw را روی لایه ARM همیشه رایگان Oracle Cloud میزبانی کنید
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-06T09:27:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
---

یک OpenClaw Gateway پایدار را بدون هزینه روی سطح ARM ‏**Always Free** در Oracle Cloud اجرا کنید (تا 4 OCPU، ‏24 گیگابایت RAM، ‏200 گیگابایت فضای ذخیره‌سازی).

## پیش‌نیازها

- حساب Oracle Cloud ([ثبت‌نام](https://www.oracle.com/cloud/free/)) -- اگر به مشکل خوردید، [راهنمای ثبت‌نام جامعه کاربری](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) را ببینید
- حساب Tailscale (رایگان در [tailscale.com](https://tailscale.com))
- یک جفت کلید SSH
- حدود 30 دقیقه

## راه‌اندازی

<Steps>
  <Step title="ساخت یک نمونه OCI">
    1. وارد [Oracle Cloud Console](https://cloud.oracle.com/) شوید.
    2. به **Compute > Instances > Create Instance** بروید.
    3. پیکربندی کنید:
       - **نام:** `openclaw`
       - **ایمیج:** Ubuntu 24.04 (aarch64)
       - **شکل:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUها:** 2 (یا تا 4)
       - **حافظه:** 12 گیگابایت (یا تا 24 گیگابایت)
       - **حجم بوت:** 50 گیگابایت (تا 200 گیگابایت رایگان)
       - **کلید SSH:** کلید عمومی خود را اضافه کنید
    4. روی **Create** کلیک کنید و نشانی IP عمومی را یادداشت کنید.

    <Tip>
    اگر ساخت نمونه با خطای "Out of capacity" شکست خورد، یک دامنه دسترس‌پذیری دیگر را امتحان کنید یا بعدا دوباره تلاش کنید. ظرفیت سطح رایگان محدود است.
    </Tip>

  </Step>

  <Step title="اتصال و به‌روزرسانی سیستم">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` برای کامپایل ARM بعضی وابستگی‌ها لازم است.

  </Step>

  <Step title="پیکربندی کاربر و نام میزبان">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    فعال کردن linger باعث می‌شود سرویس‌های کاربر پس از خروج همچنان اجرا شوند.

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

    وقتی پیام "How do you want to hatch your bot?" نمایش داده شد، **Do this later** را انتخاب کنید.

  </Step>

  <Step title="پیکربندی Gateway">
    برای دسترسی راه دور امن، از احراز هویت توکنی همراه با Tailscale Serve استفاده کنید.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` در اینجا فقط برای مدیریت IP فورواردشده/کلاینت محلی پراکسی Tailscale Serve محلی است. این **نه** `gateway.auth.mode: "trusted-proxy"` است. مسیرهای نمایشگر diff در این راه‌اندازی رفتار fail-closed را حفظ می‌کنند: درخواست‌های خام نمایشگر از `127.0.0.1` بدون هدرهای پراکسی فورواردشده می‌توانند `Diff not found` برگردانند. برای پیوست‌ها از `mode=file` / `mode=both` استفاده کنید، یا اگر به پیوندهای نمایشگر قابل‌اشتراک‌گذاری نیاز دارید، نمایشگرهای راه دور را آگاهانه فعال کنید و `plugins.entries.diffs.config.viewerBaseUrl` را تنظیم کنید (یا یک `baseUrl` پراکسی پاس بدهید).

  </Step>

  <Step title="قفل کردن امنیت VCN">
    همه ترافیک به‌جز Tailscale را در لبه شبکه مسدود کنید:

    1. در OCI Console به **Networking > Virtual Cloud Networks** بروید.
    2. روی VCN خود کلیک کنید، سپس **Security Lists > Default Security List** را انتخاب کنید.
    3. همه قوانین ingress را به‌جز `0.0.0.0/0 UDP 41641` (Tailscale) **حذف** کنید.
    4. قوانین egress پیش‌فرض را نگه دارید (اجازه همه خروجی‌ها).

    این کار SSH روی پورت 22، HTTP، HTTPS و هر چیز دیگر را در لبه شبکه مسدود می‌کند. از این نقطه به بعد فقط می‌توانید از طریق Tailscale وصل شوید.

  </Step>

  <Step title="راستی‌آزمایی">
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

## راستی‌آزمایی وضعیت امنیتی

با قفل شدن VCN (فقط UDP 41641 باز است) و bind شدن Gateway به loopback، ترافیک عمومی در لبه شبکه مسدود می‌شود و دسترسی مدیریتی فقط از طریق tailnet امکان‌پذیر است. این موضوع نیاز به چند مرحله سنتی سخت‌سازی VPS را حذف می‌کند:

| مرحله سنتی | لازم است؟ | چرا |
| ------------------ | ----------- | ------------------------------------------------------------------------- |
| فایروال UFW | خیر | VCN پیش از رسیدن ترافیک به نمونه، آن را مسدود می‌کند. |
| fail2ban | خیر | پورت 22 در VCN مسدود است؛ سطح حمله brute-force وجود ندارد. |
| سخت‌سازی sshd | خیر | Tailscale SSH از sshd استفاده نمی‌کند. |
| غیرفعال کردن ورود root | خیر | Tailscale با هویت tailnet احراز هویت می‌کند، نه کاربران سیستم. |
| احراز هویت فقط با کلید SSH | خیر | همان مورد — هویت tailnet جایگزین کلیدهای SSH سیستم می‌شود. |
| سخت‌سازی IPv6 | معمولا خیر | به تنظیمات VCN/زیرشبکه بستگی دارد؛ بررسی کنید واقعا چه چیزی اختصاص یافته/در معرض قرار گرفته است. |

همچنان توصیه می‌شود:

- `chmod 700 ~/.openclaw` برای محدود کردن مجوزهای فایل‌های اعتبارنامه.
- `openclaw security audit` برای بررسی وضعیت مختص OpenClaw.
- اجرای منظم `sudo apt update && sudo apt upgrade` برای وصله‌های سیستم‌عامل.
- مرور دوره‌ای دستگاه‌ها در [کنسول ادمین Tailscale](https://login.tailscale.com/admin).

دستورهای سریع راستی‌آزمایی:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## نکات ARM

سطح Always Free از نوع ARM (`aarch64`) است. بیشتر قابلیت‌های OpenClaw به‌خوبی کار می‌کنند؛ تعداد کمی از باینری‌های native به بیلدهای ARM نیاز دارند:

- Node.js، Telegram، WhatsApp (Baileys): JavaScript خالص، بدون مشکل.
- بیشتر بسته‌های npm دارای کد native: آرتیفکت‌های ازپیش‌ساخته `linux-arm64` موجود است.
- کمک‌کننده‌های اختیاری CLI (مثلا باینری‌های Go/Rust که توسط skills ارسال می‌شوند): پیش از نصب، وجود انتشار `aarch64` / `linux-arm64` را بررسی کنید.

معماری را با `uname -m` راستی‌آزمایی کنید (باید `aarch64` چاپ کند). برای باینری‌هایی که بیلد ARM ندارند، از سورس نصب کنید یا از آن‌ها صرف‌نظر کنید.

## پایداری و پشتیبان‌گیری

وضعیت OpenClaw زیر این مسیرها قرار دارد:

- `~/.openclaw/` — `openclaw.json`، ‏`auth-profiles.json` برای هر agent، وضعیت کانال/ارائه‌دهنده، و داده‌های نشست.
- `~/.openclaw/workspace/` — فضای کاری agent ‏(SOUL.md، حافظه، آرتیفکت‌ها).

این‌ها پس از راه‌اندازی مجدد باقی می‌مانند. برای گرفتن یک اسنپ‌شات قابل‌انتقال:

```bash
openclaw backup create
```

## جایگزین: تونل SSH

اگر Tailscale Serve کار نمی‌کند، از یک تونل SSH از ماشین محلی خود استفاده کنید:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

سپس `http://localhost:18789` را باز کنید.

## عیب‌یابی

**ساخت نمونه شکست می‌خورد ("Out of capacity")** -- نمونه‌های ARM سطح رایگان محبوب هستند. یک دامنه دسترس‌پذیری دیگر را امتحان کنید یا در ساعت‌های کم‌ترافیک دوباره تلاش کنید.

**Tailscale وصل نمی‌شود** -- برای احراز هویت دوباره، `sudo tailscale up --ssh --hostname=openclaw --reset` را اجرا کنید.

**Gateway شروع نمی‌شود** -- `openclaw doctor --non-interactive` را اجرا کنید و لاگ‌ها را با `journalctl --user -u openclaw-gateway.service -n 50` بررسی کنید.

**مشکلات باینری ARM** -- بیشتر بسته‌های npm روی ARM64 کار می‌کنند. برای باینری‌های native، دنبال انتشارهای `linux-arm64` یا `aarch64` بگردید. معماری را با `uname -m` راستی‌آزمایی کنید.

## گام‌های بعدی

- [کانال‌ها](/fa/channels) -- اتصال Telegram، WhatsApp، Discord و موارد بیشتر
- [پیکربندی Gateway](/fa/gateway/configuration) -- همه گزینه‌های پیکربندی
- [به‌روزرسانی](/fa/install/updating) -- OpenClaw را به‌روز نگه دارید

## مرتبط

- [نمای کلی نصب](/fa/install)
- [GCP](/fa/install/gcp)
- [میزبانی VPS](/fa/vps)
