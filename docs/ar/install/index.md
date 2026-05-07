---
read_when:
    - تحتاج إلى طريقة تثبيت بخلاف دليل البدء السريع «بدء الاستخدام»
    - تريد النشر إلى منصة سحابية
    - تحتاج إلى التحديث أو الترحيل أو إلغاء التثبيت
summary: تثبيت OpenClaw - سكربت التثبيت، npm/pnpm/bun، من المصدر، Docker، والمزيد
title: التثبيت
x-i18n:
    generated_at: "2026-05-07T13:23:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5dc92d262710cc96a160b7cac2b93ee1e25f994ddcd45e274ad96c026b7d72
    source_path: install/index.md
    workflow: 16
---

## متطلبات النظام

- **Node 24** (موصى به) أو Node 22.16+ - يتولى نص التثبيت البرمجي ذلك تلقائيا
- **macOS أو Linux أو Windows** - يدعم كل من Windows الأصلي و WSL2؛ و WSL2 أكثر استقرارا. راجع [Windows](/ar/platforms/windows).
- لا تحتاج إلى `pnpm` إلا إذا كنت تبني من المصدر

## موصى به: نص التثبيت البرمجي

أسرع طريقة للتثبيت. يكتشف نظام التشغيل لديك، ويثبت Node عند الحاجة، ويثبت OpenClaw، ويشغل الإعداد الأولي.

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

لجميع العلامات وخيارات CI/الأتمتة، راجع [تفاصيل المثبت الداخلية](/ar/install/installer).

## طرق التثبيت البديلة

### مثبت البادئة المحلية (`install-cli.sh`)

استخدم هذا عندما تريد إبقاء OpenClaw و Node ضمن بادئة محلية مثل
`~/.openclaw`، من دون الاعتماد على تثبيت Node على مستوى النظام:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

يدعم تثبيتات npm افتراضيا، إضافة إلى تثبيتات السحب من git ضمن تدفق البادئة
نفسه. المرجع الكامل: [تفاصيل المثبت الداخلية](/ar/install/installer#install-clish).

مثبت بالفعل؟ بدّل بين تثبيتات الحزمة و git باستخدام
`openclaw update --channel dev` و `openclaw update --channel stable`. راجع
[التحديث](/ar/install/updating#switch-between-npm-and-git-installs).

### npm أو pnpm أو bun

إذا كنت تدير Node بنفسك بالفعل:

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
    يتطلب pnpm موافقة صريحة على الحزم التي تحتوي على نصوص بناء برمجية. شغل `pnpm approve-builds -g` بعد أول تثبيت.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun مدعوم لمسار تثبيت CLI العام. أما بالنسبة إلى وقت تشغيل Gateway، فيبقى Node وقت تشغيل الخدمة الموصى به.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Troubleshooting: sharp build errors (npm)">
  إذا فشل `sharp` بسبب libvips مثبت عالميا:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### من المصدر

للمساهمين أو أي شخص يريد التشغيل من نسخة محلية:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

أو تجاوز الربط واستخدم `pnpm openclaw ...` من داخل المستودع. راجع [الإعداد](/ar/start/setup) لتدفقات عمل التطوير الكاملة.

### التثبيت من GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### الحاويات ومديرو الحزم

<CardGroup cols={2}>
  <Card title="Docker" href="/ar/install/docker" icon="container">
    عمليات نشر ضمن حاويات أو بلا واجهة رسومية.
  </Card>
  <Card title="Podman" href="/ar/install/podman" icon="container">
    بديل حاويات بلا صلاحيات جذرية لـ Docker.
  </Card>
  <Card title="Nix" href="/ar/install/nix" icon="snowflake">
    تثبيت تصريحي عبر Nix flake.
  </Card>
  <Card title="Ansible" href="/ar/install/ansible" icon="server">
    توفير آلي لأسطول الأجهزة.
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

إذا كنت تريد بدءا مداريا بعد التثبيت:

- macOS: LaunchAgent عبر `openclaw onboard --install-daemon` أو `openclaw gateway install`
- Linux/WSL2: خدمة systemd للمستخدم عبر الأوامر نفسها
- Windows الأصلي: Scheduled Task أولا، مع عنصر تسجيل دخول في مجلد Startup لكل مستخدم كخيار احتياطي إذا رفض إنشاء المهمة

## الاستضافة والنشر

انشر OpenClaw على خادم سحابي أو VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/ar/vps">أي VPS يعمل بنظام Linux</Card>
  <Card title="Docker VM" href="/ar/install/docker-vm-runtime">خطوات Docker المشتركة</Card>
  <Card title="Kubernetes" href="/ar/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/ar/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/ar/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/ar/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/ar/install/azure">Azure</Card>
  <Card title="Railway" href="/ar/install/railway">Railway</Card>
  <Card title="Render" href="/ar/install/render">Render</Card>
  <Card title="Northflank" href="/ar/install/northflank">Northflank</Card>
</CardGroup>

## التحديث أو الترحيل أو إلغاء التثبيت

<CardGroup cols={3}>
  <Card title="Updating" href="/ar/install/updating" icon="refresh-cw">
    حافظ على OpenClaw محدثا.
  </Card>
  <Card title="Migrating" href="/ar/install/migrating" icon="arrow-right">
    الانتقال إلى جهاز جديد.
  </Card>
  <Card title="Uninstall" href="/ar/install/uninstall" icon="trash-2">
    أزل OpenClaw بالكامل.
  </Card>
</CardGroup>

## استكشاف الأخطاء وإصلاحها: لم يتم العثور على `openclaw`

إذا نجح التثبيت لكن لم يتم العثور على `openclaw` في الطرفية لديك:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

إذا لم يكن `$(npm prefix -g)/bin` ضمن `$PATH` لديك، فأضفه إلى ملف بدء تشغيل الصدفة (`~/.zshrc` أو `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

ثم افتح طرفية جديدة. راجع [إعداد Node](/ar/install/node) لمزيد من التفاصيل.
