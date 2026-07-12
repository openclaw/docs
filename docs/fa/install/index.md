---
read_when:
    - به روشی برای نصب غیر از راه‌اندازی سریع «شروع به کار» نیاز دارید
    - می‌خواهید در یک پلتفرم ابری مستقر کنید
    - باید به‌روزرسانی، مهاجرت یا حذف نصب کنید
summary: نصب OpenClaw — اسکریپت نصب، npm/pnpm/bun، نصب از کد منبع، Docker و روش‌های دیگر
title: نصب
x-i18n:
    generated_at: "2026-07-12T10:17:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## نیازمندی‌های سیستم

- **Node 22.19+، 23.11+، یا 24+** - Node 24 هدف پیش‌فرض است؛ اسکریپت نصب این مورد را به‌طور خودکار مدیریت می‌کند.
- **macOS، Linux، یا Windows** - کاربران Windows می‌توانند با برنامه بومی Windows Hub، نصب‌کننده CLI مبتنی بر PowerShell، یا یک Gateway در WSL2 شروع کنند. به [Windows](/fa/platforms/windows) مراجعه کنید.
- `pnpm` فقط در صورتی لازم است که از کد منبع بیلد کنید.

## توصیه‌شده: اسکریپت نصب

سریع‌ترین روش نصب. این اسکریپت سیستم‌عامل شما را تشخیص می‌دهد، در صورت نیاز Node را نصب می‌کند، OpenClaw را نصب می‌کند و راه‌اندازی اولیه را اجرا می‌کند.

<Note>
کاربران دسکتاپ Windows همچنین می‌توانند برنامه همراه بومی [Windows Hub](/fa/platforms/windows#recommended-windows-hub) را نصب کنند که شامل پیکربندی، وضعیت نوار سیستم، گفت‌وگو، حالت Node و حالت MCP محلی است.
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

برای مشاهده همه پرچم‌ها و گزینه‌های CI/خودکارسازی، به [جزئیات داخلی نصب‌کننده](/fa/install/installer) مراجعه کنید.

## روش‌های جایگزین نصب

### نصب‌کننده با پیشوند محلی (`install-cli.sh`)

زمانی از این روش استفاده کنید که می‌خواهید OpenClaw و Node در یک پیشوند محلی مانند
`~/.openclaw` نگهداری شوند، بدون وابستگی به نصب سراسری Node در سیستم:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

این روش به‌طور پیش‌فرض از نصب با npm و همچنین نصب از نسخه دریافت‌شده با git در همان
جریان پیشوند پشتیبانی می‌کند. مرجع کامل: [جزئیات داخلی نصب‌کننده](/fa/install/installer#install-clish).

قبلاً نصب کرده‌اید؟ با
`openclaw update --channel dev` و `openclaw update --channel stable` بین نصب‌های بسته‌ای و git جابه‌جا شوید. به
[به‌روزرسانی](/fa/install/updating#switch-between-npm-and-git-installs) مراجعه کنید.

### npm، pnpm، یا bun

اگر خودتان Node را مدیریت می‌کنید:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    نصب‌کننده میزبانی‌شده، فیلترهای تازگی npm مانند `min-release-age`
    را برای نصب بسته OpenClaw پاک می‌کند. اگر با npm به‌صورت دستی نصب کنید، خط‌مشی
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
    pnpm برای بسته‌های دارای اسکریپت بیلد به تأیید صریح نیاز دارد. پس از نخستین نصب، `pnpm approve-builds -g` را اجرا کنید.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun برای مسیر نصب سراسری CLI پشتیبانی می‌شود. برای محیط اجرای Gateway، همچنان Node محیط اجرای توصیه‌شده برای سرویس پس‌زمینه است.
    </Note>

  </Tab>
</Tabs>

### از کد منبع

برای مشارکت‌کنندگان یا هر کسی که می‌خواهد برنامه را از یک نسخه محلی دریافت‌شده اجرا کند:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

همچنین می‌توانید از ایجاد پیوند صرف‌نظر کنید و `pnpm openclaw ...` را درون مخزن اجرا کنید. برای گردش‌کارهای کامل توسعه، به [پیکربندی](/fa/start/setup) مراجعه کنید.

### نصب از نسخه شاخه main در GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### کانتینرها و مدیران بسته

<CardGroup cols={2}>
  <Card title="Docker" href="/fa/install/docker" icon="container">
    استقرارهای کانتینری یا بدون رابط گرافیکی.
  </Card>
  <Card title="Podman" href="/fa/install/podman" icon="container">
    جایگزین کانتینری بدون دسترسی ریشه برای Docker.
  </Card>
  <Card title="Nix" href="/fa/install/nix" icon="snowflake">
    نصب اعلانی از طریق flake در Nix.
  </Card>
  <Card title="Ansible" href="/fa/install/ansible" icon="server">
    تأمین خودکار ناوگان.
  </Card>
  <Card title="Bun" href="/fa/install/bun" icon="zap">
    استفاده صرفاً از CLI از طریق محیط اجرای Bun.
  </Card>
</CardGroup>

## تأیید نصب

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

اگر پس از نصب، راه‌اندازی مدیریت‌شده می‌خواهید:

- macOS: ‏LaunchAgent از طریق `openclaw onboard --install-daemon` یا `openclaw gateway install`
- Linux/WSL2: سرویس کاربری systemd از طریق همان فرمان‌ها
- Windows بومی: ابتدا Scheduled Task و اگر ایجاد وظیفه رد شد، یک مورد ورود به سیستم در پوشه Startup مخصوص هر کاربر به‌عنوان مسیر جایگزین

## میزبانی و استقرار

OpenClaw را روی یک سرور ابری یا VPS مستقر کنید. برای انتخاب‌گر کامل
ارائه‌دهندگان (DigitalOcean، Hetzner، Hostinger، Fly.io، GCP، Azure، Railway،
Northflank، Oracle Cloud، Raspberry Pi و موارد دیگر) به [سرور Linux](/fa/vps) مراجعه کنید، یا آن را به‌صورت اعلانی روی
[Render](/fa/install/render) مستقر کنید.

<CardGroup cols={3}>
  <Card title="VPS" href="/fa/vps">
    یک ارائه‌دهنده انتخاب کنید.
  </Card>
  <Card title="ماشین مجازی Docker" href="/fa/install/docker-vm-runtime">
    مراحل مشترک Docker.
  </Card>
  <Card title="Kubernetes" href="/fa/install/kubernetes">
    استقرار K8s.
  </Card>
</CardGroup>

## به‌روزرسانی، مهاجرت، یا حذف نصب

<CardGroup cols={3}>
  <Card title="به‌روزرسانی" href="/fa/install/updating" icon="refresh-cw">
    OpenClaw را به‌روز نگه دارید.
  </Card>
  <Card title="مهاجرت" href="/fa/install/migrating" icon="arrow-right">
    به یک دستگاه جدید منتقل شوید.
  </Card>
  <Card title="حذف نصب" href="/fa/install/uninstall" icon="trash-2">
    OpenClaw را به‌طور کامل حذف کنید.
  </Card>
</CardGroup>

## عیب‌یابی: `openclaw` پیدا نشد

این مشکل تقریباً همیشه به PATH مربوط است: پوشه باینری سراسری npm در `PATH` پوسته شما قرار ندارد. برای راه‌حل کامل، از جمله مسیر Windows، به [عیب‌یابی Node.js](/fa/install/node#troubleshooting) مراجعه کنید.

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```
