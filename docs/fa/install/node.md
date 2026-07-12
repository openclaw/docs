---
read_when:
    - پیش از نصب OpenClaw، باید Node.js را نصب کنید
    - شما OpenClaw را نصب کرده‌اید، اما برای `openclaw` خطای «دستور یافت نشد» نمایش داده می‌شود
    - نصب سراسری با `npm install -g` به‌دلیل مشکلات مجوزها یا `PATH` ناموفق می‌شود
summary: نصب و پیکربندی Node.js برای OpenClaw — الزامات نسخه، گزینه‌های نصب و عیب‌یابی PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-12T10:11:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw به **Node 22.19+، Node 23.11+ یا Node 24+** نیاز دارد. **Node 24 محیط اجرای پیش‌فرض و توصیه‌شده** برای نصب‌ها، CI و گردش‌کارهای انتشار است؛ Node 22 همچنان از طریق شاخه فعال LTS پشتیبانی می‌شود. [اسکریپت نصب](/fa/install#alternative-install-methods) به‌طور خودکار Node را شناسایی و نصب می‌کند — زمانی از این صفحه استفاده کنید که می‌خواهید Node را خودتان راه‌اندازی کنید (نسخه‌ها، PATH و نصب‌های سراسری).

## بررسی نسخه

```bash
node -v
```

`v24.x.x` یا بالاتر، گزینه پیش‌فرض توصیه‌شده است. `v22.19.x` یا بالاتر، مسیر پشتیبانی‌شده Node 22 LTS است (در زمان مناسب به Node 24 ارتقا دهید). بیلدهای Node 23 پیش از `v23.11.0` پشتیبانی نمی‌شوند. اگر Node نصب نیست یا نسخه آن خارج از محدوده پشتیبانی‌شده است، یکی از روش‌های نصب زیر را انتخاب کنید.

## نصب Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (توصیه‌شده):

    ```bash
    brew install node
    ```

    یا نصب‌کننده macOS را از [nodejs.org](https://nodejs.org/) دانلود کنید.

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    یا از یک مدیر نسخه استفاده کنید (پایین‌تر را ببینید).

  </Tab>
  <Tab title="Windows">
    **winget** (توصیه‌شده):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    یا نصب‌کننده Windows را از [nodejs.org](https://nodejs.org/) دانلود کنید.

  </Tab>
</Tabs>

<Accordion title="استفاده از مدیر نسخه (nvm، fnm، mise، asdf)">
  مدیرهای نسخه امکان جابه‌جایی آسان میان نسخه‌های Node را فراهم می‌کنند. گزینه‌های محبوب:

- [**fnm**](https://github.com/Schniz/fnm) - سریع و چندسکویی
- [**nvm**](https://github.com/nvm-sh/nvm) - پرکاربرد در macOS/Linux
- [**mise**](https://mise.jdx.dev/) - چندزبانه (Node، Python، Ruby و غیره)

نمونه با fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  مدیر نسخه خود را در فایل راه‌اندازی پوسته (`~/.zshrc` یا `~/.bashrc`) مقداردهی اولیه کنید. اگر این مرحله را انجام ندهید، ممکن است `openclaw` در نشست‌های جدید ترمینال پیدا نشود، زیرا PATH شامل پوشه bin مربوط به Node نخواهد بود.
  </Warning>
</Accordion>

## عیب‌یابی

### `openclaw: command not found`

این خطا تقریباً همیشه به این معناست که پوشه سراسری bin مربوط به npm در PATH شما نیست.

<Steps>
  <Step title="یافتن پیشوند سراسری npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="بررسی وجود آن در PATH">
    ```bash
    echo "$PATH"
    ```

    در خروجی به‌دنبال `<npm-prefix>/bin` (در macOS/Linux) یا `<npm-prefix>` (در Windows) بگردید.

  </Step>
  <Step title="افزودن آن به فایل راه‌اندازی پوسته">
    <Tabs>
      <Tab title="macOS / Linux">
        مورد زیر را به `~/.zshrc` یا `~/.bashrc` اضافه کنید:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        سپس یک ترمینال جدید باز کنید (یا در zsh دستور `rehash` و در bash دستور `hash -r` را اجرا کنید).
      </Tab>
      <Tab title="Windows">
        خروجی `npm prefix -g` را از مسیر Settings → System → Environment Variables به PATH سیستم خود اضافه کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### خطاهای مجوز در `npm install -g` ‏(Linux)

اگر خطاهای `EACCES` را مشاهده کردید، پیشوند سراسری npm را به پوشه‌ای قابل‌نوشتن برای کاربر تغییر دهید:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

برای دائمی‌کردن این تنظیم، خط `export PATH=...` را به `~/.bashrc` یا `~/.zshrc` اضافه کنید.

## مطالب مرتبط

- [نمای کلی نصب](/fa/install) - همه روش‌های نصب
- [به‌روزرسانی](/fa/install/updating) - به‌روز نگه‌داشتن OpenClaw
- [شروع به کار](/fa/start/getting-started) - نخستین گام‌ها پس از نصب
