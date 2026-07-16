---
read_when:
    - تحتاج إلى طريقة تثبيت غير دليل البدء السريع لبدء الاستخدام
    - تريد النشر على منصة سحابية
    - تحتاج إلى التحديث أو الترحيل أو إلغاء التثبيت
summary: تثبيت OpenClaw - برنامج التثبيت النصي، وnpm/pnpm/bun، ومن المصدر، وDocker، والمزيد
title: تثبيت
x-i18n:
    generated_at: "2026-07-16T14:31:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## متطلبات النظام

- **Node 22.22.3+ أو 24.15+ أو 25.9+** - يُعد Node 24 الإصدار المستهدف الافتراضي؛ ويتولى برنامج التثبيت النصي ذلك تلقائيًا.
- **macOS أو Linux أو Windows** - يمكن لمستخدمي Windows البدء بتطبيق Windows Hub الأصلي، أو مثبّت CLI عبر PowerShell، أو Gateway على WSL2. راجع [Windows](/ar/platforms/windows).
- لا يلزم `pnpm` إلا عند البناء من المصدر.

## موصى به: برنامج التثبيت النصي

أسرع طريقة للتثبيت. يكتشف نظام التشغيل لديك، ويثبّت Node عند الحاجة، ويثبّت OpenClaw، ثم يبدأ الإعداد الأولي.

<Note>
يمكن لمستخدمي سطح مكتب Windows أيضًا تثبيت التطبيق المرافق الأصلي [Windows Hub](/ar/platforms/windows#recommended-windows-hub)، الذي يتضمن الإعداد، وحالة علبة النظام، والدردشة، ووضع Node، ووضع MCP المحلي.
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

استخدم هذا الخيار عندما تريد إبقاء OpenClaw وNode ضمن بادئة محلية مثل
`~/.openclaw`، من دون الاعتماد على تثبيت Node على مستوى النظام:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

يدعم تثبيتات npm افتراضيًا، بالإضافة إلى التثبيتات من نسخة git محلية ضمن
مسار البادئة نفسه. المرجع الكامل: [تفاصيل المثبّت الداخلية](/ar/install/installer#install-clish).

هل ثبّتته بالفعل؟ بدّل بين تثبيتات الحزمة وgit باستخدام
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
    يزيل المثبّت المستضاف مرشحات حداثة npm مثل `min-release-age`
    عند تثبيت حزمة OpenClaw. إذا أجريت التثبيت يدويًا باستخدام npm، فستظل
    سياسة npm الخاصة بك مطبّقة.
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
    يستطيع Bun تثبيت الحزمة العامة، لكن الملف التنفيذي `openclaw` الناتج يتطلب بيئة تشغيل Node مدعومة لأن حالة OpenClaw تستخدم `node:sqlite`.
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
    عمليات نشر ضمن حاويات أو من دون واجهة.
  </Card>
  <Card title="Podman" href="/ar/install/podman" icon="container">
    بديل لـ Docker بحاويات لا تتطلب صلاحيات الجذر.
  </Card>
  <Card title="Nix" href="/ar/install/nix" icon="snowflake">
    تثبيت تصريحي عبر Nix flake.
  </Card>
  <Card title="Ansible" href="/ar/install/ansible" icon="server">
    تجهيز آلي لمجموعة من الأجهزة.
  </Card>
  <Card title="Bun" href="/ar/install/bun" icon="zap">
    مثبّت اختياري للتبعيات ومشغّل لبرامج الحزم النصية.
  </Card>
</CardGroup>

## التحقق من التثبيت

```bash
openclaw --version      # تأكد من توفر CLI
openclaw doctor         # تحقق من مشكلات الإعداد
openclaw gateway status # تحقق من تشغيل Gateway
```

إذا أردت بدء تشغيل مُدارًا بعد التثبيت:

- macOS: ‏LaunchAgent عبر `openclaw onboard --install-daemon` أو `openclaw gateway install`
- Linux/WSL2: خدمة مستخدم systemd عبر الأوامر نفسها
- Windows الأصلي: مهمة مجدولة أولًا، مع عنصر تسجيل دخول لكل مستخدم في مجلد Startup كخيار احتياطي إذا رُفض إنشاء المهمة

## الاستضافة والنشر

انشر OpenClaw على خادم سحابي أو VPS. راجع [خادم Linux](/ar/vps) للاطلاع على
أداة اختيار المزوّد الكاملة (DigitalOcean وHetzner وHostinger وFly.io وGCP وAzure وRailway
وNorthflank وOracle Cloud وRaspberry Pi والمزيد)، أو انشره تصريحيًا على
[Render](/ar/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/ar/vps">
    اختر مزوّدًا.
  </Card>
  <Card title="جهاز Docker افتراضي" href="/ar/install/docker-vm-runtime">
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
    انتقل إلى جهاز جديد.
  </Card>
  <Card title="إلغاء التثبيت" href="/ar/install/uninstall" icon="trash-2">
    أزل OpenClaw بالكامل.
  </Card>
</CardGroup>

## استكشاف الأخطاء وإصلاحها: تعذّر العثور على `openclaw`

غالبًا ما تكون المشكلة في PATH: دليل الملفات التنفيذية العامة لـ npm غير موجود في `PATH` الخاص بصدفتك. راجع [استكشاف أخطاء Node.js وإصلاحها](/ar/install/node#troubleshooting) للاطلاع على الحل الكامل، بما في ذلك مسار Windows.

```bash
node -v           # هل Node مثبت؟
npm prefix -g     # أين توجد الحزم العامة؟
echo "$PATH"      # هل دليل الملفات التنفيذية العامة موجود في PATH؟
```
