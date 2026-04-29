---
read_when:
    - پیش از نصب OpenClaw باید Node.js را نصب کنید
    - OpenClaw را نصب کرده‌اید اما دستور `openclaw` یافت نمی‌شود
    - npm install -g به‌دلیل مشکلات مجوزها یا PATH ناموفق می‌شود
summary: نصب و پیکربندی Node.js برای OpenClaw — الزامات نسخه، گزینه‌های نصب، و عیب‌یابی PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-29T23:06:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99c72b917fa8beba136ee6010799c0183cff8b2420b5a1bd256d9155e50f065a
    source_path: install/node.md
    workflow: 16
---

OpenClaw به **Node 22.14 یا جدیدتر** نیاز دارد. **Node 24 runtime پیش‌فرض و توصیه‌شده** برای نصب‌ها، CI و workflowهای انتشار است. Node 22 همچنان از طریق خط LTS فعال پشتیبانی می‌شود. [اسکریپت نصب‌کننده](/fa/install#alternative-install-methods) به‌طور خودکار Node را شناسایی و نصب می‌کند — این صفحه برای زمانی است که می‌خواهید Node را خودتان راه‌اندازی کنید و مطمئن شوید همه چیز به‌درستی متصل شده است (نسخه‌ها، PATH، نصب‌های global).

## نسخه خود را بررسی کنید

```bash
node -v
```

اگر این دستور `v24.x.x` یا بالاتر را چاپ کند، روی پیش‌فرض توصیه‌شده هستید. اگر `v22.14.x` یا بالاتر را چاپ کند، روی مسیر پشتیبانی‌شده Node 22 LTS هستید، اما همچنان توصیه می‌کنیم هر زمان مناسب بود به Node 24 ارتقا دهید. اگر Node نصب نیست یا نسخه آن بیش از حد قدیمی است، یکی از روش‌های نصب زیر را انتخاب کنید.

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

    یا نصب‌کننده Windows را از [nodejs.org](https://nodejs.org/) دانلود کنید.

  </Tab>
</Tabs>

<Accordion title="استفاده از مدیر نسخه (nvm، fnm، mise، asdf)">
  مدیران نسخه به شما امکان می‌دهند به‌راحتی بین نسخه‌های Node جابه‌جا شوید. گزینه‌های محبوب:

- [**fnm**](https://github.com/Schniz/fnm) — سریع، چندسکویی
- [**nvm**](https://github.com/nvm-sh/nvm) — پرکاربرد در macOS/Linux
- [**mise**](https://mise.jdx.dev/) — چندزبانه (Node، Python، Ruby و غیره)

نمونه با fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  مطمئن شوید مدیر نسخه شما در فایل راه‌اندازی shell مقداردهی اولیه شده است (`~/.zshrc` یا `~/.bashrc`). اگر این‌طور نباشد، ممکن است `openclaw` در sessionهای جدید ترمینال پیدا نشود، چون PATH شامل دایرکتوری bin مربوط به Node نخواهد بود.
  </Warning>
</Accordion>

## عیب‌یابی

### `openclaw: command not found`

این تقریباً همیشه یعنی دایرکتوری bin سراسری npm در PATH شما نیست.

<Steps>
  <Step title="پیدا کردن prefix سراسری npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="بررسی اینکه آیا در PATH شما هست">
    ```bash
    echo "$PATH"
    ```

    در خروجی به‌دنبال `<npm-prefix>/bin` (macOS/Linux) یا `<npm-prefix>` (Windows) بگردید.

  </Step>
  <Step title="افزودن آن به فایل راه‌اندازی shell">
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

اگر خطاهای `EACCES` را می‌بینید، prefix سراسری npm را به یک دایرکتوری قابل‌نوشتن توسط کاربر تغییر دهید:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

خط `export PATH=...` را به `~/.bashrc` یا `~/.zshrc` خود اضافه کنید تا دائمی شود.

## مرتبط

- [نمای کلی نصب](/fa/install) — همه روش‌های نصب
- [به‌روزرسانی](/fa/install/updating) — به‌روز نگه داشتن OpenClaw
- [شروع کار](/fa/start/getting-started) — گام‌های نخست پس از نصب
