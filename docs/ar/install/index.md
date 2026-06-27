---
read_when:
    - تحتاج إلى طريقة تثبيت غير دليل البدء السريع
    - تريد النشر إلى منصة سحابية
    - تحتاج إلى التحديث أو الترحيل أو إلغاء التثبيت
summary: تثبيت OpenClaw - سكربت التثبيت، npm/pnpm/bun، من المصدر، Docker، والمزيد
title: ثبّت
x-i18n:
    generated_at: "2026-06-27T17:51:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## متطلبات النظام

- **Node 24** (موصى به) أو Node 22.19+ - يتولى سكربت المثبّت ذلك تلقائياً
- **macOS أو Linux أو Windows** - يمكن لمستخدمي Windows البدء بتطبيق Windows Hub الأصلي، أو مثبّت CLI عبر PowerShell، أو Gateway على WSL2. راجع [Windows](/ar/platforms/windows).
- لا تحتاج إلى `pnpm` إلا إذا كنت تبني من المصدر

## موصى به: سكربت المثبّت

أسرع طريقة للتثبيت. يكتشف نظام التشغيل لديك، ويثبّت Node عند الحاجة، ويثبّت OpenClaw، ويشغّل الإعداد الأولي.

<Note>
يمكن لمستخدمي سطح مكتب Windows أيضاً تثبيت تطبيق [Windows Hub](/ar/platforms/windows#recommended-windows-hub) المرافق الأصلي، والذي يتضمن الإعداد، وحالة صينية النظام، والدردشة، ووضع العقدة، ووضع MCP المحلي.
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

للتثبيت من دون تشغيل الإعداد الأولي:

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

للاطلاع على جميع العلامات وخيارات CI/الأتمتة، راجع [تفاصيل المثبّت الداخلية](/ar/install/installer).

## طرق تثبيت بديلة

### مثبّت البادئة المحلية (`install-cli.sh`)

استخدم هذا عندما تريد إبقاء OpenClaw وNode ضمن بادئة محلية مثل
`~/.openclaw`، من دون الاعتماد على تثبيت Node على مستوى النظام:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

يدعم تثبيتات npm افتراضياً، بالإضافة إلى تثبيتات git-checkout ضمن مسار
البادئة نفسه. المرجع الكامل: [تفاصيل المثبّت الداخلية](/ar/install/installer#install-clish).

مثبّت مسبقاً؟ بدّل بين تثبيتات الحزمة وgit باستخدام
`openclaw update --channel dev` و`openclaw update --channel stable`. راجع
[التحديث](/ar/install/updating#switch-between-npm-and-git-installs).

### npm أو pnpm أو bun

إذا كنت تدير Node بنفسك بالفعل:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    يمسح المثبّت المستضاف مرشحات حداثة npm مثل `min-release-age`
    لتثبيت حزمة OpenClaw. إذا ثبّت يدوياً باستخدام npm، فستظل
    سياسة npm الخاصة بك مطبقة.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    يتطلب pnpm موافقة صريحة للحزم التي تحتوي على سكربتات بناء. شغّل `pnpm approve-builds -g` بعد أول تثبيت.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun مدعوم لمسار تثبيت CLI العام. بالنسبة إلى وقت تشغيل Gateway، يظل Node وقت تشغيل الخدمة الموصى به.
    </Note>

  </Tab>
</Tabs>

### من المصدر

للمساهمين أو أي شخص يريد التشغيل من نسخة محلية:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

أو تخطّ الربط واستخدم `pnpm openclaw ...` من داخل المستودع. راجع [الإعداد](/ar/start/setup) لمعرفة مسارات عمل التطوير الكاملة.

### التثبيت من نسخة GitHub الرئيسية

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### الحاويات ومديرو الحزم

<CardGroup cols={2}>
  <Card title="Docker" href="/ar/install/docker" icon="container">
    عمليات نشر داخل حاويات أو بلا واجهة.
  </Card>
  <Card title="Podman" href="/ar/install/podman" icon="container">
    بديل حاويات بلا صلاحيات جذرية لـ Docker.
  </Card>
  <Card title="Nix" href="/ar/install/nix" icon="snowflake">
    تثبيت تصريحي عبر Nix flake.
  </Card>
  <Card title="Ansible" href="/ar/install/ansible" icon="server">
    تهيئة آلية لأساطيل الأجهزة.
  </Card>
  <Card title="Bun" href="/ar/install/bun" icon="zap">
    استخدام CLI فقط عبر وقت تشغيل Bun.
  </Card>
</CardGroup>

## التحقق من التثبيت

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

إذا كنت تريد بدء تشغيل مُداراً بعد التثبيت:

- macOS: LaunchAgent عبر `openclaw onboard --install-daemon` أو `openclaw gateway install`
- Linux/WSL2: خدمة systemd للمستخدم عبر الأوامر نفسها
- Windows الأصلي: Scheduled Task أولاً، مع عنصر تسجيل دخول احتياطي في مجلد بدء التشغيل لكل مستخدم إذا رُفض إنشاء المهمة

## الاستضافة والنشر

انشر OpenClaw على خادم سحابي أو VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/ar/vps">
    أي Linux VPS.
  </Card>
  <Card title="Docker VM" href="/ar/install/docker-vm-runtime">
    خطوات Docker المشتركة.
  </Card>
  <Card title="Kubernetes" href="/ar/install/kubernetes">
    نشر K8s.
  </Card>
  <Card title="Fly.io" href="/ar/install/fly">
    النشر على Fly.io.
  </Card>
  <Card title="Hetzner" href="/ar/install/hetzner">
    نشر Hetzner.
  </Card>
  <Card title="GCP" href="/ar/install/gcp">
    نشر Google Cloud.
  </Card>
  <Card title="Azure" href="/ar/install/azure">
    نشر Azure.
  </Card>
  <Card title="Railway" href="/ar/install/railway">
    نشر Railway.
  </Card>
  <Card title="Render" href="/ar/install/render">
    نشر Render.
  </Card>
  <Card title="Northflank" href="/ar/install/northflank">
    نشر Northflank.
  </Card>
</CardGroup>

## التحديث أو الترحيل أو إلغاء التثبيت

<CardGroup cols={3}>
  <Card title="Updating" href="/ar/install/updating" icon="refresh-cw">
    أبقِ OpenClaw محدّثاً.
  </Card>
  <Card title="Migrating" href="/ar/install/migrating" icon="arrow-right">
    الانتقال إلى جهاز جديد.
  </Card>
  <Card title="Uninstall" href="/ar/install/uninstall" icon="trash-2">
    إزالة OpenClaw بالكامل.
  </Card>
</CardGroup>

## استكشاف الأخطاء وإصلاحها: لم يتم العثور على `openclaw`

إذا نجح التثبيت لكن لم يتم العثور على `openclaw` في الطرفية لديك:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

إذا لم يكن `$(npm prefix -g)/bin` موجوداً في `$PATH` لديك، فأضفه إلى ملف بدء تشغيل الصدفة (`~/.zshrc` أو `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

ثم افتح طرفية جديدة. راجع [إعداد Node](/ar/install/node) لمزيد من التفاصيل.
