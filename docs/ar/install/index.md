---
read_when:
    - تحتاج إلى طريقة تثبيت غير البدء السريع في Getting Started
    - تريد النشر على منصة سحابية
    - تحتاج إلى التحديث أو الترحيل أو إلغاء التثبيت
summary: تثبيت OpenClaw — برنامج التثبيت النصي، وnpm/pnpm/bun، ومن المصدر، وDocker، وغير ذلك
title: تثبيت
x-i18n:
    generated_at: "2026-04-26T11:33:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8dc6b9511be6bf9060cc150a7c51daf3b6d556dab4a85910094b4b892145cd7
    source_path: install/index.md
    workflow: 15
---

## متطلبات النظام

- **Node 24** (موصى به) أو Node 22.14+ — يتولى برنامج التثبيت النصي هذا تلقائيًا
- **macOS أو Linux أو Windows** — يتم دعم Windows الأصلي وWSL2؛ وWSL2 أكثر استقرارًا. راجع [Windows](/ar/platforms/windows).
- لا يلزم `pnpm` إلا إذا كنت ستبني من المصدر

## الموصى به: برنامج التثبيت النصي

أسرع طريقة للتثبيت. فهو يكتشف نظام التشغيل لديك، ويثبت Node عند الحاجة، ويثبت OpenClaw، ثم يشغّل الإعداد الأولي.

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

للاطلاع على جميع الأعلام وخيارات CI/الأتمتة، راجع [تفاصيل برنامج التثبيت الداخلية](/ar/install/installer).

## طرق التثبيت البديلة

### مُثبّت البادئة المحلية (`install-cli.sh`)

استخدم هذا عندما تريد الاحتفاظ بـ OpenClaw وNode تحت بادئة محلية مثل
`~/.openclaw`، من دون الاعتماد على تثبيت Node على مستوى النظام:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

وهو يدعم تثبيتات npm افتراضيًا، بالإضافة إلى تثبيتات git checkout ضمن
تدفق البادئة نفسه. المرجع الكامل: [تفاصيل برنامج التثبيت الداخلية](/ar/install/installer#install-clish).

هل هو مثبت بالفعل؟ بدّل بين تثبيتات الحزمة وgit باستخدام
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
    يتطلب pnpm موافقة صريحة على الحزم التي تحتوي على نصوص بناء. شغّل `pnpm approve-builds -g` بعد أول تثبيت.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    يتم دعم Bun لمسار تثبيت CLI العام. أما بالنسبة إلى بيئة تشغيل Gateway، فيظل Node هو بيئة daemon الموصى بها.
    </Note>

  </Tab>
</Tabs>

<Accordion title="استكشاف الأخطاء وإصلاحها: أخطاء بناء sharp (npm)">
  إذا فشل `sharp` بسبب وجود libvips مثبت عالميًا:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### من المصدر

للمساهمين أو لأي شخص يريد التشغيل من نسخة checkout محلية:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

أو تخطَّ الربط واستخدم `pnpm openclaw ...` من داخل المستودع. راجع [الإعداد](/ar/start/setup) لمعرفة تدفقات عمل التطوير الكاملة.

### التثبيت من GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### الحاويات ومديرو الحزم

<CardGroup cols={2}>
  <Card title="Docker" href="/ar/install/docker" icon="container">
    عمليات نشر معتمدة على الحاويات أو headless.
  </Card>
  <Card title="Podman" href="/ar/install/podman" icon="container">
    بديل حاويات rootless لـ Docker.
  </Card>
  <Card title="Nix" href="/ar/install/nix" icon="snowflake">
    تثبيت تصريحي عبر Nix flake.
  </Card>
  <Card title="Ansible" href="/ar/install/ansible" icon="server">
    تجهيز آلي لأساطيل الأجهزة.
  </Card>
  <Card title="Bun" href="/ar/install/bun" icon="zap">
    استخدام CLI فقط عبر بيئة Bun.
  </Card>
</CardGroup>

## التحقق من التثبيت

```bash
openclaw --version      # تأكد من أن CLI متاح
openclaw doctor         # تحقق من مشكلات التهيئة
openclaw gateway status # تحقق من أن Gateway قيد التشغيل
```

إذا كنت تريد تشغيلًا مُدارًا بعد التثبيت:

- macOS: ‏LaunchAgent عبر `openclaw onboard --install-daemon` أو `openclaw gateway install`
- Linux/WSL2: خدمة systemd للمستخدم عبر الأوامر نفسها
- Windows الأصلي: Scheduled Task أولًا، مع عنصر تسجيل دخول ضمن مجلد Startup لكل مستخدم كخيار رجوع إذا رُفض إنشاء المهمة

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

## استكشاف الأخطاء وإصلاحها: تعذّر العثور على `openclaw`

إذا نجح التثبيت لكن تعذّر العثور على `openclaw` في الطرفية:

```bash
node -v           # هل تم تثبيت Node؟
npm prefix -g     # أين توجد الحزم العامة؟
echo "$PATH"      # هل دليل bin العام موجود في PATH؟
```

إذا لم يكن `$(npm prefix -g)/bin` موجودًا في `$PATH`، فأضفه إلى ملف بدء الصدفة (`~/.zshrc` أو `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

ثم افتح طرفية جديدة. راجع [إعداد Node](/ar/install/node) لمزيد من التفاصيل.
