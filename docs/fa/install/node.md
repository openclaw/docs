---
read_when:
    - باید پیش از نصب OpenClaw، Node.js را نصب کنید
    - OpenClaw را نصب کرده‌اید اما دستور `openclaw` پیدا نمی‌شود
    - npm install -g با مشکلات مجوزها یا PATH ناموفق می‌شود
summary: نصب و پیکربندی Node.js برای OpenClaw - نیازمندی‌های نسخه، گزینه‌های نصب، و عیب‌یابی PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-04T10:52:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c556593982efa7f6fcd6e24787cca7ca6af30d265f54bb927a0608d2efc58d6
    source_path: install/node.md
    workflow: 16
---

OpenClaw به **Node 22.19+، Node 23.11+، یا Node 24+** نیاز دارد. **Node 24 زمان اجرای پیش‌فرض و توصیه‌شده** برای نصب‌ها، CI و جریان‌های کاری انتشار است. Node 22 همچنان از طریق خط فعال LTS پشتیبانی می‌شود. [اسکریپت نصب](/fa/install#alternative-install-methods) Node را به‌صورت خودکار تشخیص می‌دهد و نصب می‌کند - این صفحه برای زمانی است که می‌خواهید Node را خودتان راه‌اندازی کنید و مطمئن شوید همه‌چیز درست متصل شده است (نسخه‌ها، PATH، نصب‌های سراسری).

## نسخهٔ خود را بررسی کنید

```bash
node -v
```

اگر این دستور `v24.x.x` یا بالاتر چاپ کند، روی پیش‌فرض توصیه‌شده هستید. اگر `v22.19.x` یا بالاتر چاپ کند، روی مسیر پشتیبانی‌شدهٔ Node 22 LTS هستید، اما همچنان توصیه می‌کنیم هر زمان مناسب بود به Node 24 ارتقا دهید. نسخه‌های Node 23 پیش از `v23.11.0` پشتیبانی نمی‌شوند. اگر Node نصب نیست یا نسخه خارج از بازهٔ پشتیبانی‌شده است، یکی از روش‌های نصب زیر را انتخاب کنید.

## نصب Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (توصیه‌شده):

    ```bash
    brew install node
    ```

    یا نصب‌کنندهٔ macOS را از [nodejs.org](https://nodejs.org/) دانلود کنید.

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

    یا از یک مدیر نسخه استفاده کنید (پایین را ببینید).

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

    یا نصب‌کنندهٔ Windows را از [nodejs.org](https://nodejs.org/) دانلود کنید.

  </Tab>
</Tabs>

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  مدیران نسخه به شما اجازه می‌دهند به‌سادگی بین نسخه‌های Node جابه‌جا شوید. گزینه‌های محبوب:

- [**fnm**](https://github.com/Schniz/fnm) - سریع، چندسکویی
- [**nvm**](https://github.com/nvm-sh/nvm) - پرکاربرد در macOS/Linux
- [**mise**](https://mise.jdx.dev/) - چندزبانه (Node، Python، Ruby و غیره)

نمونه با fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  مطمئن شوید مدیر نسخهٔ شما در فایل راه‌اندازی پوسته‌تان (`~/.zshrc` یا `~/.bashrc`) مقداردهی اولیه شده است. اگر نشده باشد، ممکن است `openclaw` در نشست‌های جدید ترمینال پیدا نشود، چون PATH شامل دایرکتوری bin مربوط به Node نخواهد بود.
  </Warning>
</Accordion>

## عیب‌یابی

### `openclaw: command not found`

این تقریباً همیشه یعنی دایرکتوری bin سراسری npm در PATH شما نیست.

<Steps>
  <Step title="Find your global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Check if it's on your PATH">
    ```bash
    echo "$PATH"
    ```

    در خروجی به‌دنبال `<npm-prefix>/bin` (macOS/Linux) یا `<npm-prefix>` (Windows) بگردید.

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        به `~/.zshrc` یا `~/.bashrc` اضافه کنید:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        سپس یک ترمینال جدید باز کنید (یا در zsh دستور `rehash` / در bash دستور `hash -r` را اجرا کنید).
      </Tab>
      <Tab title="Windows">
        خروجی `npm prefix -g` را از طریق Settings → System → Environment Variables به PATH سیستم خود اضافه کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### خطاهای مجوز در `npm install -g` (Linux)

اگر خطاهای `EACCES` می‌بینید، پیشوند سراسری npm را به دایرکتوری‌ای تغییر دهید که کاربر بتواند در آن بنویسد:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

برای دائمی‌کردن آن، خط `export PATH=...` را به `~/.bashrc` یا `~/.zshrc` خود اضافه کنید.

## مرتبط

- [نمای کلی نصب](/fa/install) - همهٔ روش‌های نصب
- [به‌روزرسانی](/fa/install/updating) - به‌روز نگه‌داشتن OpenClaw
- [شروع به کار](/fa/start/getting-started) - گام‌های نخست پس از نصب
