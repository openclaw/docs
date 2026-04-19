---
read_when:
    - أنت بحاجة إلى طريقة تثبيت غير البدء السريع في قسم Getting Started
    - تريد النشر إلى منصة سحابية
    - تحتاج إلى التحديث، أو الترحيل، أو إلغاء التثبيت
summary: ثبّت OpenClaw — نص التثبيت البرمجي، وnpm/pnpm/bun، ومن المصدر، وDocker، والمزيد
title: ثبّت
x-i18n:
    generated_at: "2026-04-19T07:16:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0a5fdbbf13dcaf2fed6840f35aa22b2e9e458509509f98303c8d87c2556a6f
    source_path: install/index.md
    workflow: 15
---

# التثبيت

## الموصى به: نص التثبيت البرمجي

أسرع طريقة للتثبيت. يكتشف نظام التشغيل لديك، ويثبّت Node إذا لزم الأمر، ويثبّت OpenClaw، ثم يبدأ الإعداد الأوّلي.

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

للتثبيت بدون تشغيل الإعداد الأوّلي:

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

للاطّلاع على جميع العلامات وخيارات CI/الأتمتة، راجع [تفاصيل أداة التثبيت](/ar/install/installer).

## متطلبات النظام

- **Node 24** (موصى به) أو Node 22.14+ — يتولى نص التثبيت البرمجي هذا تلقائيًا
- **macOS أو Linux أو Windows** — كل من Windows الأصلي وWSL2 مدعومان؛ WSL2 أكثر استقرارًا. راجع [Windows](/ar/platforms/windows).
- لا تكون `pnpm` مطلوبة إلا إذا كنت ستبني من المصدر

## طرق التثبيت البديلة

### أداة التثبيت ذات البادئة المحلية (`install-cli.sh`)

استخدم هذا عندما تريد الاحتفاظ بـ OpenClaw وNode ضمن بادئة محلية مثل
`~/.openclaw`، من دون الاعتماد على تثبيت Node على مستوى النظام:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

وهي تدعم تثبيتات npm افتراضيًا، بالإضافة إلى التثبيتات من نسخة git checkout ضمن تدفق البادئة نفسه. المرجع الكامل: [تفاصيل أداة التثبيت](/ar/install/installer#install-clish).

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
    يتطلب pnpm موافقة صريحة على الحزم التي تحتوي على نصوص بناء برمجية. شغّل `pnpm approve-builds -g` بعد أول تثبيت.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun مدعوم لمسار التثبيت العام لـ CLI. أمّا بالنسبة إلى بيئة تشغيل Gateway، فما يزال Node هو بيئة daemon الموصى بها.
    </Note>

  </Tab>
</Tabs>

<Accordion title="استكشاف الأخطاء وإصلاحها: أخطاء بناء sharp (npm)">
  إذا فشل `sharp` بسبب وجود libvips مثبّتة على مستوى النظام:

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

أو يمكنك تخطي الربط واستخدام `pnpm openclaw ...` من داخل المستودع. راجع [الإعداد](/ar/start/setup) للاطّلاع على مسارات العمل التطويرية الكاملة.

### التثبيت من GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### الحاويات ومديرو الحزم

<CardGroup cols={2}>
  <Card title="Docker" href="/ar/install/docker" icon="container">
    عمليات نشر داخل حاويات أو بدون واجهة.
  </Card>
  <Card title="Podman" href="/ar/install/podman" icon="container">
    بديل حاويات بدون صلاحيات root لـ Docker.
  </Card>
  <Card title="Nix" href="/ar/install/nix" icon="snowflake">
    تثبيت تصريحي عبر Nix flake.
  </Card>
  <Card title="Ansible" href="/ar/install/ansible" icon="server">
    تجهيز آلي على نطاق واسع.
  </Card>
  <Card title="Bun" href="/ar/install/bun" icon="zap">
    استخدام CLI فقط عبر بيئة Bun.
  </Card>
</CardGroup>

## التحقق من التثبيت

```bash
openclaw --version      # تأكيد أن CLI متاح
openclaw doctor         # التحقق من مشكلات الإعداد
openclaw gateway status # التحقق من أن Gateway يعمل
```

إذا كنت تريد بدءًا مُدارًا بعد التثبيت:

- macOS: LaunchAgent عبر `openclaw onboard --install-daemon` أو `openclaw gateway install`
- Linux/WSL2: خدمة systemd على مستوى المستخدم عبر الأوامر نفسها
- Windows الأصلي: Scheduled Task أولًا، مع بديل عنصر تسجيل دخول لكل مستخدم في مجلد Startup إذا تم رفض إنشاء المهمة

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
    حافظ على OpenClaw محدّثًا.
  </Card>
  <Card title="الترحيل" href="/ar/install/migrating" icon="arrow-right">
    انقل إلى جهاز جديد.
  </Card>
  <Card title="إلغاء التثبيت" href="/ar/install/uninstall" icon="trash-2">
    أزل OpenClaw بالكامل.
  </Card>
</CardGroup>

## استكشاف الأخطاء وإصلاحها: تعذّر العثور على `openclaw`

إذا نجح التثبيت لكن تعذّر العثور على `openclaw` في الطرفية لديك:

```bash
node -v           # هل Node مثبّت؟
npm prefix -g     # أين توجد الحزم العامة؟
echo "$PATH"      # هل دليل bin العام موجود في PATH؟
```

إذا لم يكن `$(npm prefix -g)/bin` موجودًا في `$PATH` لديك، فأضفه إلى ملف بدء تشغيل الصدفة (`~/.zshrc` أو `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

ثم افتح طرفية جديدة. راجع [إعداد Node](/ar/install/node) لمزيد من التفاصيل.
