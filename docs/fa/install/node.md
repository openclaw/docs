---
read_when:
    - پیش از نصب OpenClaw باید Node.js را نصب کنید
    - OpenClaw را نصب کرده‌اید، اما دستور `openclaw` پیدا نمی‌شود
    - npm install -g به‌دلیل مشکلات مجوزها یا PATH ناموفق می‌شود
summary: نصب و پیکربندی Node.js برای OpenClaw - الزامات نسخه، گزینه‌های نصب، و عیب‌یابی PATH
title: Node.js
x-i18n:
    generated_at: "2026-05-07T13:25:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8ef8d00c8996741187000f55d07d15a2d09e89b6deb99cf687b6b9128ad266
    source_path: install/node.md
    workflow: 16
---

OpenClaw به **Node 22.16 یا جدیدتر** نیاز دارد. **Node 24 محیط اجرای پیش‌فرض و پیشنهادی** برای نصب‌ها، CI و گردش‌کارهای انتشار است. Node 22 همچنان از طریق خط LTS فعال پشتیبانی می‌شود. [اسکریپت نصب‌کننده](/fa/install#alternative-install-methods) به‌صورت خودکار Node را شناسایی و نصب می‌کند - این صفحه برای زمانی است که می‌خواهید خودتان Node را راه‌اندازی کنید و مطمئن شوید همه‌چیز درست متصل شده است (نسخه‌ها، PATH، نصب‌های سراسری).

## نسخه خود را بررسی کنید

```bash
node -v
```

اگر این دستور `v24.x.x` یا بالاتر چاپ کرد، روی پیش‌فرض پیشنهادی هستید. اگر `v22.16.x` یا بالاتر چاپ کرد، روی مسیر پشتیبانی‌شده Node 22 LTS هستید، اما همچنان پیشنهاد می‌کنیم در زمان مناسب به Node 24 ارتقا دهید. اگر Node نصب نیست یا نسخه آن بیش از حد قدیمی است، یکی از روش‌های نصب زیر را انتخاب کنید.

## نصب Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (پیشنهادی):

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

    یا از یک مدیر نسخه استفاده کنید (پایین را ببینید).

  </Tab>
  <Tab title="Windows">
    **winget** (پیشنهادی):

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

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  مدیران نسخه به شما امکان می‌دهند به‌سادگی بین نسخه‌های Node جابه‌جا شوید. گزینه‌های محبوب:

- [**fnm**](https://github.com/Schniz/fnm) - سریع، چندسکویی
- [**nvm**](https://github.com/nvm-sh/nvm) - پرکاربرد در macOS/Linux
- [**mise**](https://mise.jdx.dev/) - چندزبانه (Node، Python، Ruby و غیره)

نمونه با fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  مطمئن شوید مدیر نسخه شما در فایل راه‌اندازی پوسته‌تان (`~/.zshrc` یا `~/.bashrc`) مقداردهی اولیه شده است. اگر این‌طور نباشد، ممکن است `openclaw` در نشست‌های جدید ترمینال پیدا نشود، چون PATH شامل دایرکتوری bin مربوط به Node نخواهد بود.
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

اگر خطاهای `EACCES` می‌بینید، prefix سراسری npm را به دایرکتوری‌ای تغییر دهید که کاربر بتواند در آن بنویسد:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

خط `export PATH=...` را به `~/.bashrc` یا `~/.zshrc` خود اضافه کنید تا دائمی شود.

## مرتبط

- [نمای کلی نصب](/fa/install) - همه روش‌های نصب
- [به‌روزرسانی](/fa/install/updating) - به‌روز نگه داشتن OpenClaw
- [شروع به کار](/fa/start/getting-started) - گام‌های نخست پس از نصب
