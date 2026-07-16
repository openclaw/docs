---
read_when:
    - پیش از نصب OpenClaw باید Node.js را نصب کنید
    - OpenClaw را نصب کرده‌اید، اما `openclaw` با خطای «دستور یافت نشد» مواجه می‌شود
    - نصب سراسری با `npm install -g` به‌دلیل مشکلات مجوز یا PATH ناموفق می‌شود
summary: نصب و پیکربندی Node.js برای OpenClaw - الزامات نسخه، گزینه‌های نصب و عیب‌یابی PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-16T17:08:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

OpenClaw به **Node 22.22.3+، Node 24.15+، یا Node 25.9+** نیاز دارد. **Node 24 محیط اجرای پیش‌فرض و توصیه‌شده** برای نصب‌ها، CI و گردش‌کارهای انتشار است؛ پشتیبانی از Node 22 از طریق شاخه فعال LTS ادامه دارد. Node 23 پشتیبانی نمی‌شود. [اسکریپت نصب](/fa/install#alternative-install-methods) Node را به‌طور خودکار شناسایی و نصب می‌کند — هنگامی از این صفحه استفاده کنید که می‌خواهید Node را خودتان راه‌اندازی کنید (نسخه‌ها، PATH، نصب‌های سراسری).

## بررسی نسخه

```bash
node -v
```

`v24.15.0` یا نسخه جدیدتر از شاخه 24.x، گزینه پیش‌فرض توصیه‌شده است. `v22.22.3` یا نسخه جدیدتر از شاخه 22.x، مسیر پشتیبانی‌شده Node 22 LTS است؛ Node `v25.9.0+` نیز پشتیبانی می‌شود. Node 23 پشتیبانی نمی‌شود. اگر Node نصب نیست یا نسخه آن خارج از محدوده پشتیبانی‌شده است، یکی از روش‌های نصب زیر را انتخاب کنید.

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

    یا از یک مدیر نسخه استفاده کنید (بخش زیر را ببینید).

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
  مدیران نسخه امکان جابه‌جایی آسان میان نسخه‌های Node را فراهم می‌کنند. گزینه‌های محبوب:

- [**fnm**](https://github.com/Schniz/fnm) - سریع و چندسکویی
- [**nvm**](https://github.com/nvm-sh/nvm) - پرکاربرد در macOS/Linux
- [**mise**](https://mise.jdx.dev/) - چندزبانه (Node، Python، Ruby و غیره)

نمونه با fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  مدیر نسخه را در فایل راه‌اندازی پوسته خود (`~/.zshrc` یا `~/.bashrc`) مقداردهی اولیه کنید. اگر این مرحله را نادیده بگیرید، ممکن است `openclaw` در نشست‌های جدید ترمینال پیدا نشود، زیرا PATH شامل پوشه bin مربوط به Node نخواهد بود.
  </Warning>
</Accordion>

## عیب‌یابی

### `openclaw: command not found`

این خطا تقریباً همیشه به این معناست که پوشه bin سراسری npm در PATH قرار ندارد.

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

    در خروجی به‌دنبال `<npm-prefix>/bin` (macOS/Linux) یا `<npm-prefix>` (Windows) بگردید.

  </Step>
  <Step title="افزودن آن به فایل راه‌اندازی پوسته">
    <Tabs>
      <Tab title="macOS / Linux">
        آن را به `~/.zshrc` یا `~/.bashrc` اضافه کنید:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        سپس یک ترمینال جدید باز کنید (یا `rehash` را در zsh / `hash -r` را در bash اجرا کنید).
      </Tab>
      <Tab title="Windows">
        خروجی `npm prefix -g` را از مسیر Settings → System → Environment Variables به PATH سیستم خود اضافه کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### خطاهای مجوز در `npm install -g` (Linux)

اگر خطاهای `EACCES` را مشاهده کردید، پیشوند سراسری npm را به پوشه‌ای تغییر دهید که کاربر اجازه نوشتن در آن را دارد:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

برای دائمی‌کردن این تنظیم، خط `export PATH=...` را به `~/.bashrc` یا `~/.zshrc` خود اضافه کنید.

## مطالب مرتبط

- [نمای کلی نصب](/fa/install) - همه روش‌های نصب
- [به‌روزرسانی](/fa/install/updating) - به‌روز نگه‌داشتن OpenClaw
- [شروع به کار](/fa/start/getting-started) - نخستین گام‌ها پس از نصب
