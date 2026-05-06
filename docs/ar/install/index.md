---
read_when:
    - تحتاج إلى طريقة تثبيت غير دليل البدء السريع في قسم بدء الاستخدام.
    - تريد النشر إلى منصة سحابية
    - تحتاج إلى التحديث أو الترحيل أو إلغاء التثبيت
summary: تثبيت OpenClaw - سكربت التثبيت، npm/pnpm/bun، من المصدر، Docker، والمزيد
title: التثبيت
x-i18n:
    generated_at: "2026-05-06T08:01:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## متطلبات النظام

- **Node 24** (موصى به) أو Node 22.14+ - يتولى سكربت التثبيت هذا تلقائيًا
- **macOS أو Linux أو Windows** - كل من Windows الأصلي وWSL2 مدعومان؛ WSL2 أكثر استقرارًا. راجع [Windows](/ar/platforms/windows).
- لا تحتاج إلى `pnpm` إلا إذا كنت تبني من المصدر

## موصى به: سكربت التثبيت

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

للتثبيت دون تشغيل الإعداد الأولي:

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

لجميع الأعلام وخيارات CI/الأتمتة، راجع [تفاصيل المثبّت الداخلية](/ar/install/installer).

## طرق تثبيت بديلة

### مثبّت البادئة المحلية (`install-cli.sh`)

استخدم هذا عندما تريد إبقاء OpenClaw وNode ضمن بادئة محلية مثل
`~/.openclaw`، دون الاعتماد على تثبيت Node على مستوى النظام:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

يدعم تثبيتات npm افتراضيًا، بالإضافة إلى تثبيتات git-checkout ضمن تدفق
البادئة نفسه. المرجع الكامل: [تفاصيل المثبّت الداخلية](/ar/install/installer#install-clish).

مثبت بالفعل؟ بدّل بين تثبيتات الحزمة وgit باستخدام
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
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    يتطلب pnpm موافقة صريحة للحزم التي تحتوي على سكربتات بناء. شغّل `pnpm approve-builds -g` بعد التثبيت الأول.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun مدعوم لمسار تثبيت CLI العام. أما بالنسبة إلى وقت تشغيل Gateway، فيظل Node وقت تشغيل الخدمة الموصى به.
    </Note>

  </Tab>
</Tabs>

<Accordion title="استكشاف الأخطاء وإصلاحها: أخطاء بناء sharp (npm)">
  إذا فشل `sharp` بسبب libvips مثبتة عالميًا:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### من المصدر

للمساهمين أو لأي شخص يريد التشغيل من نسخة محلية:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

أو تجاوز الربط واستخدم `pnpm openclaw ...` من داخل المستودع. راجع [الإعداد](/ar/start/setup) لسير عمل التطوير الكامل.

### التثبيت من فرع main على GitHub

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
    تهيئة تلقائية لأسطول الأجهزة.
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

إذا كنت تريد بدءًا مُدارًا بعد التثبيت:

- macOS: LaunchAgent عبر `openclaw onboard --install-daemon` أو `openclaw gateway install`
- Linux/WSL2: خدمة systemd للمستخدم عبر الأوامر نفسها
- Windows الأصلي: Scheduled Task أولًا، مع عنصر تسجيل دخول في مجلد Startup لكل مستخدم كخيار احتياطي إذا رُفض إنشاء المهمة

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
  <Card title="التحديث" href="/ar/install/updating" icon="refresh-cw">
    حافظ على OpenClaw محدثًا.
  </Card>
  <Card title="الترحيل" href="/ar/install/migrating" icon="arrow-right">
    انتقل إلى جهاز جديد.
  </Card>
  <Card title="إلغاء التثبيت" href="/ar/install/uninstall" icon="trash-2">
    أزل OpenClaw بالكامل.
  </Card>
</CardGroup>

## استكشاف الأخطاء وإصلاحها: لم يتم العثور على `openclaw`

إذا نجح التثبيت ولكن لم يتم العثور على `openclaw` في الطرفية لديك:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

إذا لم يكن `$(npm prefix -g)/bin` ضمن `$PATH`، فأضفه إلى ملف بدء تشغيل الصدفة لديك (`~/.zshrc` أو `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

ثم افتح طرفية جديدة. راجع [إعداد Node](/ar/install/node) لمزيد من التفاصيل.
