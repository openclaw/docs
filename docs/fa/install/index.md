---
read_when:
    - به روشی برای نصب غیر از شروع سریع «شروع به کار» نیاز دارید
    - می‌خواهید روی یک پلتفرم ابری استقرار دهید
    - باید به‌روزرسانی کنید، مهاجرت دهید یا حذف نصب کنید
summary: نصب OpenClaw - اسکریپت نصب‌کننده، npm/pnpm/bun، از منبع، Docker و موارد دیگر
title: نصب
x-i18n:
    generated_at: "2026-05-06T09:26:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## الزامات سیستم

- **Node 24** (توصیه‌شده) یا Node 22.14+ - اسکریپت نصب‌کننده این مورد را به‌صورت خودکار مدیریت می‌کند
- **macOS، Linux، یا Windows** - هم Windows بومی و هم WSL2 پشتیبانی می‌شوند؛ WSL2 پایدارتر است. [Windows](/fa/platforms/windows) را ببینید.
- `pnpm` فقط زمانی لازم است که از سورس بسازید

## توصیه‌شده: اسکریپت نصب‌کننده

سریع‌ترین راه نصب. سیستم‌عامل شما را تشخیص می‌دهد، در صورت نیاز Node را نصب می‌کند، OpenClaw را نصب می‌کند، و راه‌اندازی اولیه را اجرا می‌کند.

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

برای نصب بدون اجرای راه‌اندازی اولیه:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

برای همه فلگ‌ها و گزینه‌های CI/خودکارسازی، [جزئیات داخلی نصب‌کننده](/fa/install/installer) را ببینید.

## روش‌های جایگزین نصب

### نصب‌کننده پیشوند محلی (`install-cli.sh`)

وقتی از این استفاده کنید که می‌خواهید OpenClaw و Node زیر یک پیشوند محلی مانند
`~/.openclaw` نگه داشته شوند، بدون وابستگی به نصب سراسری Node در سیستم:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

این به‌صورت پیش‌فرض از نصب‌های npm پشتیبانی می‌کند، به‌علاوه نصب‌های git-checkout زیر همان
جریان پیشوند. مرجع کامل: [جزئیات داخلی نصب‌کننده](/fa/install/installer#install-clish).

قبلا نصب کرده‌اید؟ با `openclaw update --channel dev` و `openclaw update --channel stable` بین نصب‌های پکیجی و git جابه‌جا شوید. [به‌روزرسانی](/fa/install/updating#switch-between-npm-and-git-installs) را ببینید.

### npm، pnpm، یا bun

اگر خودتان Node را مدیریت می‌کنید:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm برای پکیج‌هایی که اسکریپت ساخت دارند به تایید صریح نیاز دارد. پس از اولین نصب، `pnpm approve-builds -g` را اجرا کنید.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun برای مسیر نصب CLI سراسری پشتیبانی می‌شود. برای runtime مربوط به Gateway، Node همچنان runtime پیشنهادی daemon است.
    </Note>

  </Tab>
</Tabs>

<Accordion title="عیب‌یابی: خطاهای ساخت sharp (npm)">
  اگر `sharp` به‌دلیل libvips نصب‌شده به‌صورت سراسری شکست خورد:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### از سورس

برای مشارکت‌کنندگان یا هر کسی که می‌خواهد از یک checkout محلی اجرا کند:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

یا لینک را رد کنید و از داخل repo از `pnpm openclaw ...` استفاده کنید. برای جریان‌های کامل توسعه، [راه‌اندازی](/fa/start/setup) را ببینید.

### نصب از GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### کانتینرها و مدیران پکیج

<CardGroup cols={2}>
  <Card title="Docker" href="/fa/install/docker" icon="container">
    استقرارهای کانتینری یا بدون رابط گرافیکی.
  </Card>
  <Card title="Podman" href="/fa/install/podman" icon="container">
    جایگزین کانتینر بدون root برای Docker.
  </Card>
  <Card title="Nix" href="/fa/install/nix" icon="snowflake">
    نصب اعلانی از طریق Nix flake.
  </Card>
  <Card title="Ansible" href="/fa/install/ansible" icon="server">
    تامین خودکار ناوگان.
  </Card>
  <Card title="Bun" href="/fa/install/bun" icon="zap">
    استفاده فقط از CLI از طریق runtime مربوط به Bun.
  </Card>
</CardGroup>

## تایید نصب

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

اگر پس از نصب راه‌اندازی مدیریت‌شده می‌خواهید:

- macOS: ‏LaunchAgent از طریق `openclaw onboard --install-daemon` یا `openclaw gateway install`
- Linux/WSL2: سرویس کاربری systemd از طریق همان دستورها
- Windows بومی: ابتدا Scheduled Task، با fallback آیتم ورود پوشه Startup برای هر کاربر اگر ایجاد task رد شود

## میزبانی و استقرار

OpenClaw را روی یک سرور ابری یا VPS مستقر کنید:

<CardGroup cols={3}>
  <Card title="VPS" href="/fa/vps">هر VPS لینوکسی</Card>
  <Card title="Docker VM" href="/fa/install/docker-vm-runtime">مراحل مشترک Docker</Card>
  <Card title="Kubernetes" href="/fa/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/fa/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/fa/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/fa/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/fa/install/azure">Azure</Card>
  <Card title="Railway" href="/fa/install/railway">Railway</Card>
  <Card title="Render" href="/fa/install/render">Render</Card>
  <Card title="Northflank" href="/fa/install/northflank">Northflank</Card>
</CardGroup>

## به‌روزرسانی، مهاجرت، یا حذف نصب

<CardGroup cols={3}>
  <Card title="به‌روزرسانی" href="/fa/install/updating" icon="refresh-cw">
    OpenClaw را به‌روز نگه دارید.
  </Card>
  <Card title="مهاجرت" href="/fa/install/migrating" icon="arrow-right">
    به یک ماشین جدید منتقل شوید.
  </Card>
  <Card title="حذف نصب" href="/fa/install/uninstall" icon="trash-2">
    OpenClaw را کاملا حذف کنید.
  </Card>
</CardGroup>

## عیب‌یابی: `openclaw` پیدا نشد

اگر نصب موفق بود اما `openclaw` در ترمینال شما پیدا نمی‌شود:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

اگر `$(npm prefix -g)/bin` در `$PATH` شما نیست، آن را به فایل راه‌اندازی shell خود (`~/.zshrc` یا `~/.bashrc`) اضافه کنید:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

سپس یک ترمینال جدید باز کنید. برای جزئیات بیشتر، [راه‌اندازی Node](/fa/install/node) را ببینید.
