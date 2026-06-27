---
read_when:
    - به روشی برای نصب نیاز دارید که غیر از شروع سریع «Getting Started» باشد.
    - می‌خواهید روی یک پلتفرم ابری مستقر کنید
    - باید به‌روزرسانی، مهاجرت، یا حذف نصب انجام دهید
summary: نصب OpenClaw - اسکریپت نصب‌کننده، npm/pnpm/bun، از سورس، Docker و موارد دیگر
title: نصب
x-i18n:
    generated_at: "2026-06-27T17:58:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## نیازمندی‌های سیستم

- **Node 24** (پیشنهادی) یا Node 22.19+ - اسکریپت نصب این مورد را به‌صورت خودکار مدیریت می‌کند
- **macOS، Linux، یا Windows** - کاربران Windows می‌توانند با برنامه بومی Windows Hub، نصب‌کننده PowerShell برای CLI، یا یک Gateway مبتنی بر WSL2 شروع کنند. [Windows](/fa/platforms/windows) را ببینید.
- `pnpm` فقط زمانی لازم است که از سورس بسازید

## پیشنهادی: اسکریپت نصب‌کننده

سریع‌ترین روش نصب. سیستم‌عامل شما را تشخیص می‌دهد، در صورت نیاز Node را نصب می‌کند، OpenClaw را نصب می‌کند و فرایند راه‌اندازی اولیه را اجرا می‌کند.

<Note>
کاربران دسکتاپ Windows همچنین می‌توانند برنامه همراه بومی [Windows Hub](/fa/platforms/windows#recommended-windows-hub) را نصب کنند که شامل راه‌اندازی، وضعیت tray، چت، حالت node، و حالت MCP محلی است.
</Note>

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

برای همه پرچم‌ها و گزینه‌های CI/اتوماسیون، [جزئیات داخلی نصب‌کننده](/fa/install/installer) را ببینید.

## روش‌های جایگزین نصب

### نصب‌کننده با پیشوند محلی (`install-cli.sh`)

زمانی از این استفاده کنید که می‌خواهید OpenClaw و Node زیر یک پیشوند محلی مانند
`~/.openclaw` نگه داشته شوند، بدون وابستگی به نصب سراسری Node روی سیستم:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

این روش به‌طور پیش‌فرض از نصب‌های npm پشتیبانی می‌کند، به‌علاوه نصب‌های git-checkout را در همان
جریان پیشوندی. مرجع کامل: [جزئیات داخلی نصب‌کننده](/fa/install/installer#install-clish).

قبلا نصب کرده‌اید؟ با `openclaw update --channel dev` و `openclaw update --channel stable` بین نصب‌های بسته و git جابه‌جا شوید. [به‌روزرسانی](/fa/install/updating#switch-between-npm-and-git-installs) را ببینید.

### npm، pnpm، یا bun

اگر خودتان Node را مدیریت می‌کنید:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    نصب‌کننده میزبانی‌شده فیلترهای تازگی npm مانند `min-release-age`
    را برای نصب بسته OpenClaw پاک می‌کند. اگر به‌صورت دستی با npm نصب کنید، سیاست
    npm خودتان همچنان اعمال می‌شود.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm برای بسته‌هایی که اسکریپت build دارند به تأیید صریح نیاز دارد. پس از اولین نصب `pnpm approve-builds -g` را اجرا کنید.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun برای مسیر نصب سراسری CLI پشتیبانی می‌شود. برای زمان‌اجرای Gateway، Node همچنان زمان‌اجرای پیشنهادی برای daemon است.
    </Note>

  </Tab>
</Tabs>

### از سورس

برای مشارکت‌کنندگان یا هر کسی که می‌خواهد از checkout محلی اجرا کند:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

یا link را رد کنید و از داخل repo از `pnpm openclaw ...` استفاده کنید. برای جریان‌های کاری کامل توسعه، [راه‌اندازی](/fa/start/setup) را ببینید.

### نصب از checkout شاخه main در GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### کانتینرها و مدیرهای بسته

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
    آماده‌سازی خودکار ناوگان.
  </Card>
  <Card title="Bun" href="/fa/install/bun" icon="zap">
    استفاده فقط از CLI از طریق زمان‌اجرای Bun.
  </Card>
</CardGroup>

## تأیید نصب

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

اگر پس از نصب راه‌اندازی مدیریت‌شده می‌خواهید:

- macOS: LaunchAgent از طریق `openclaw onboard --install-daemon` یا `openclaw gateway install`
- Linux/WSL2: سرویس کاربری systemd از طریق همان دستورها
- Windows بومی: ابتدا Scheduled Task، با fallback به آیتم ورود پوشه Startup برای هر کاربر اگر ایجاد task رد شود

## میزبانی و استقرار

OpenClaw را روی یک سرور ابری یا VPS مستقر کنید:

<CardGroup cols={3}>
  <Card title="VPS" href="/fa/vps">
    هر VPS مبتنی بر Linux.
  </Card>
  <Card title="Docker VM" href="/fa/install/docker-vm-runtime">
    مراحل مشترک Docker.
  </Card>
  <Card title="Kubernetes" href="/fa/install/kubernetes">
    استقرار K8s.
  </Card>
  <Card title="Fly.io" href="/fa/install/fly">
    استقرار روی Fly.io.
  </Card>
  <Card title="Hetzner" href="/fa/install/hetzner">
    استقرار Hetzner.
  </Card>
  <Card title="GCP" href="/fa/install/gcp">
    استقرار Google Cloud.
  </Card>
  <Card title="Azure" href="/fa/install/azure">
    استقرار Azure.
  </Card>
  <Card title="Railway" href="/fa/install/railway">
    استقرار Railway.
  </Card>
  <Card title="Render" href="/fa/install/render">
    استقرار Render.
  </Card>
  <Card title="Northflank" href="/fa/install/northflank">
    استقرار Northflank.
  </Card>
</CardGroup>

## به‌روزرسانی، مهاجرت، یا حذف نصب

<CardGroup cols={3}>
  <Card title="Updating" href="/fa/install/updating" icon="refresh-cw">
    OpenClaw را به‌روز نگه دارید.
  </Card>
  <Card title="Migrating" href="/fa/install/migrating" icon="arrow-right">
    انتقال به یک ماشین جدید.
  </Card>
  <Card title="Uninstall" href="/fa/install/uninstall" icon="trash-2">
    OpenClaw را کامل حذف کنید.
  </Card>
</CardGroup>

## عیب‌یابی: `openclaw` پیدا نشد

اگر نصب موفق بود اما `openclaw` در ترمینال شما پیدا نمی‌شود:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

اگر `$(npm prefix -g)/bin` در `$PATH` شما نیست، آن را به فایل راه‌اندازی shell خود اضافه کنید (`~/.zshrc` یا `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

سپس یک ترمینال جدید باز کنید. برای جزئیات بیشتر [راه‌اندازی Node](/fa/install/node) را ببینید.
