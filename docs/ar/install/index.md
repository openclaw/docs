---
read_when:
    - تحتاج إلى طريقة تثبيت أخرى غير دليل البدء السريع
    - تريد النشر على منصة سحابية
    - تحتاج إلى التحديث أو الترحيل أو إلغاء التثبيت
summary: تثبيت OpenClaw - برنامج التثبيت النصي، وnpm/pnpm/bun، ومن المصدر، وDocker، والمزيد
title: تثبيت
x-i18n:
    generated_at: "2026-07-12T06:09:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## متطلبات النظام

- **Node 22.19+ أو 23.11+ أو 24+** - الإصدار Node 24 هو الهدف الافتراضي؛ ويتولى برنامج التثبيت النصي ذلك تلقائيًا.
- **macOS أو Linux أو Windows** - يمكن لمستخدمي Windows البدء بتطبيق Windows Hub الأصلي، أو مُثبّت CLI عبر PowerShell، أو Gateway على WSL2. راجع [Windows](/ar/platforms/windows).
- لا يلزم `pnpm` إلا عند البناء من المصدر.

## الموصى به: برنامج التثبيت النصي

هذه أسرع طريقة للتثبيت. يكتشف نظام التشغيل لديك، ويثبّت Node عند الحاجة، ويثبّت OpenClaw، ثم يبدأ الإعداد الأولي.

<Note>
يمكن لمستخدمي سطح المكتب على Windows أيضًا تثبيت التطبيق المصاحب الأصلي [Windows Hub](/ar/platforms/windows#recommended-windows-hub)، الذي يتضمن الإعداد، وحالة علبة النظام، والدردشة، ووضع Node، ووضع MCP المحلي.
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

للاطلاع على جميع العلامات وخيارات CI/الأتمتة، راجع [تفاصيل برنامج التثبيت الداخلية](/ar/install/installer).

## طرق تثبيت بديلة

### مُثبّت البادئة المحلية (`install-cli.sh`)

استخدمه عندما تريد الاحتفاظ بـ OpenClaw وNode ضمن بادئة محلية مثل
`~/.openclaw`، من دون الاعتماد على تثبيت Node على مستوى النظام:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

يدعم تثبيتات npm افتراضيًا، إضافةً إلى التثبيتات من نسخة git محلية ضمن مسار
البادئة نفسه. المرجع الكامل: [تفاصيل برنامج التثبيت الداخلية](/ar/install/installer#install-clish).

هل ثبّتّه بالفعل؟ بدّل بين التثبيت من الحزمة والتثبيت من git باستخدام
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
    يزيل برنامج التثبيت المستضاف عوامل تصفية حداثة npm، مثل `min-release-age`،
    عند تثبيت حزمة OpenClaw. إذا ثبّتّها يدويًا باستخدام npm، فستظل
    سياسة npm الخاصة بك سارية.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    يتطلب pnpm موافقة صريحة على الحزم التي تحتوي على برامج نصية للبناء. شغّل `pnpm approve-builds -g` بعد التثبيت الأول.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    يُدعم Bun لمسار تثبيت CLI العام. أما بالنسبة إلى وقت تشغيل Gateway، فيظل Node هو وقت التشغيل الموصى به للخدمة الخلفية.
    </Note>

  </Tab>
</Tabs>

### من المصدر

للمساهمين أو لأي شخص يريد التشغيل من نسخة محلية:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

أو تخطَّ الربط واستخدم `pnpm openclaw ...` من داخل المستودع. راجع [الإعداد](/ar/start/setup) للاطلاع على مسارات عمل التطوير الكاملة.

### التثبيت من نسخة الفرع الرئيسي على GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### الحاويات ومديرو الحزم

<CardGroup cols={2}>
  <Card title="Docker" href="/ar/install/docker" icon="container">
    عمليات نشر ضمن حاويات أو بلا واجهة رسومية.
  </Card>
  <Card title="Podman" href="/ar/install/podman" icon="container">
    بديل لـ Docker لتشغيل الحاويات من دون صلاحيات الجذر.
  </Card>
  <Card title="Nix" href="/ar/install/nix" icon="snowflake">
    تثبيت تصريحي عبر Nix flake.
  </Card>
  <Card title="Ansible" href="/ar/install/ansible" icon="server">
    تجهيز آلي لمجموعة من الأجهزة.
  </Card>
  <Card title="Bun" href="/ar/install/bun" icon="zap">
    استخدام CLI فقط عبر وقت تشغيل Bun.
  </Card>
</CardGroup>

## التحقق من التثبيت

```bash
openclaw --version      # تأكد من توفر CLI
openclaw doctor         # تحقق من مشكلات الإعدادات
openclaw gateway status # تحقق من أن Gateway قيد التشغيل
```

إذا كنت تريد بدء تشغيل مُدارًا بعد التثبيت:

- macOS: ‏LaunchAgent عبر `openclaw onboard --install-daemon` أو `openclaw gateway install`
- Linux/WSL2: خدمة مستخدم systemd عبر الأوامر نفسها
- Windows الأصلي: ‏Scheduled Task أولًا، مع الرجوع إلى عنصر تسجيل دخول لكل مستخدم في مجلد Startup إذا رُفض إنشاء المهمة

## الاستضافة والنشر

انشر OpenClaw على خادم سحابي أو VPS. راجع [خادم Linux](/ar/vps) للاطلاع على منتقي
موفري الخدمة الكامل (DigitalOcean وHetzner وHostinger وFly.io وGCP وAzure وRailway
وNorthflank وOracle Cloud وRaspberry Pi وغيرها)، أو انشره تصريحيًا على
[Render](/ar/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/ar/vps">
    اختر موفر خدمة.
  </Card>
  <Card title="آلة Docker الافتراضية" href="/ar/install/docker-vm-runtime">
    خطوات Docker المشتركة.
  </Card>
  <Card title="Kubernetes" href="/ar/install/kubernetes">
    نشر K8s.
  </Card>
</CardGroup>

## التحديث أو الترحيل أو إلغاء التثبيت

<CardGroup cols={3}>
  <Card title="التحديث" href="/ar/install/updating" icon="refresh-cw">
    حافظ على تحديث OpenClaw.
  </Card>
  <Card title="الترحيل" href="/ar/install/migrating" icon="arrow-right">
    انقل OpenClaw إلى جهاز جديد.
  </Card>
  <Card title="إلغاء التثبيت" href="/ar/install/uninstall" icon="trash-2">
    أزل OpenClaw بالكامل.
  </Card>
</CardGroup>

## استكشاف الأخطاء وإصلاحها: تعذّر العثور على `openclaw`

غالبًا ما تكون المشكلة في PATH: دليل الملفات التنفيذية العام لـ npm غير موجود في `PATH` الخاص بالصدفة. راجع [استكشاف أخطاء Node.js وإصلاحها](/ar/install/node#troubleshooting) للاطلاع على الحل الكامل، بما في ذلك مسار Windows.

```bash
node -v           # هل Node مثبت؟
npm prefix -g     # أين توجد الحزم العامة؟
echo "$PATH"      # هل دليل الملفات التنفيذية العام موجود في PATH؟
```
