---
read_when:
    - تحديث OpenClaw
    - يتعطل شيء ما بعد التحديث
summary: تحديث OpenClaw بأمان (تثبيت عام أو من المصدر)، مع استراتيجية الرجوع للخلف
title: جارٍ التحديث
x-i18n:
    generated_at: "2026-06-27T17:53:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

حافظ على تحديث OpenClaw.

## موصى به: `openclaw update`

أسرع طريقة للتحديث. يكتشف نوع التثبيت لديك (npm أو git)، ويجلب أحدث إصدار، ويشغّل `openclaw doctor`، ويعيد تشغيل Gateway.

```bash
openclaw update
```

للتبديل بين القنوات أو استهداف إصدار محدد:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

لا يقبل `openclaw update` الخيار `--verbose`. لتشخيصات التحديث، استخدم
`--dry-run` لمعاينة الإجراءات المخطط لها، أو `--json` للحصول على نتائج منظمة، أو
`openclaw update status --json` لفحص حالة القناة والتوفر. يملك
المثبّت علم `--verbose` خاصا به، لكن هذا العلم ليس جزءا من
`openclaw update`.

يفضّل `--channel beta` الإصدار التجريبي beta، لكن وقت التشغيل يعود إلى stable/latest عندما
تكون وسم beta مفقودا أو أقدم من أحدث إصدار stable. استخدم `--tag beta`
إذا كنت تريد dist-tag الخام الخاص بـ npm beta لتحديث حزمة لمرة واحدة.

استخدم `--channel dev` للحصول على checkout دائم ومتحرك لفرع GitHub `main`. لتحديثات الحزم،
يُطابق `--tag main` إلى `github:openclaw/openclaw#main` لتشغيل واحد، وتُحزم
مواصفات مصدر GitHub/git في tarball مؤقت قبل تنفيذ تثبيت npm المرحلي.

بالنسبة إلى Plugins المُدارة، يكون الرجوع الاحتياطي لقناة beta تحذيرا: لا يزال تحديث core
قادرا على النجاح بينما تستخدم Plugin إصدارها المسجل الافتراضي/الأحدث لأنه لا يتوفر
إصدار beta للـ Plugin.

راجع [قنوات التطوير](/ar/install/development-channels) لمعاني القنوات.

## التبديل بين تثبيتات npm و git

استخدم القنوات عندما تريد تغيير نوع التثبيت. يحافظ المحدّث على
الحالة، والتكوين، وبيانات الاعتماد، ومساحة العمل في `~/.openclaw`؛ فهو يغيّر فقط
تثبيت كود OpenClaw الذي يستخدمه CLI وGateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

شغّل أولا مع `--dry-run` لمعاينة تبديل وضع التثبيت الدقيق:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

تضمن قناة `dev` وجود git checkout، وتبنيه، وتثبّت CLI العام
من ذلك checkout. تستخدم قناتا `stable` و`beta` تثبيتات الحزم. إذا كان
Gateway مثبتا بالفعل، فإن `openclaw update` يحدّث بيانات تعريف الخدمة
ويعيد تشغيلها ما لم تمرر `--no-restart`.

بالنسبة إلى تثبيتات الحزم مع خدمة Gateway مُدارة، يستهدف `openclaw update`
جذر الحزمة الذي تستخدمه تلك الخدمة. إذا كان أمر shell `openclaw` يأتي
من تثبيت مختلف، يطبع المحدّث كلا الجذرين ومسار Node للخدمة المُدارة.
يستخدم تحديث الحزمة مدير الحزم الذي يملك جذر الخدمة
ويتحقق من Node الخاص بالخدمة المُدارة مقابل متطلبات المحرك للإصدار الهدف
قبل استبدال الحزمة.

## بديل: إعادة تشغيل المثبّت

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

أضف `--no-onboard` لتجاوز الإعداد الأولي. لفرض نوع تثبيت محدد عبر
المثبّت، مرر `--install-method git --no-onboard` أو
`--install-method npm --no-onboard`.

إذا فشل `openclaw update` بعد مرحلة تثبيت حزمة npm، فأعد تشغيل
المثبّت. لا يستدعي المثبّت المحدّث القديم؛ بل يشغّل تثبيت
الحزمة العامة مباشرة ويمكنه استرداد تثبيت npm محدّث جزئيا.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

لتثبيت الاسترداد على إصدار أو dist-tag محدد، أضف `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## بديل: npm أو pnpm أو bun يدويا

```bash
npm i -g openclaw@latest
```

فضّل `openclaw update` للتثبيتات الخاضعة للإشراف لأنه يستطيع تنسيق
تبديل الحزمة مع خدمة Gateway العاملة. إذا حدّثت يدويا في تثبيت
خاضع للإشراف، فأوقف Gateway المُدار قبل أن يبدأ مدير الحزم.
تستبدل مدراء الحزم الملفات في مكانها، وقد يحاول Gateway العامل بخلاف ذلك
تحميل ملفات core أو Plugin بينما تكون شجرة الحزمة مستبدلة جزئيا مؤقتا.
أعد تشغيل Gateway بعد انتهاء مدير الحزم حتى تلتقط الخدمة
التثبيت الجديد.

بالنسبة إلى تثبيت عام على مستوى نظام Linux مملوك للجذر، إذا فشل `openclaw update` مع
`EACCES` واستعدت باستخدام npm النظام، فأبق Gateway متوقفا طوال
استبدال الحزمة اليدوي. استخدم أعلام ملف تعريف `openclaw` نفسها أو البيئة
التي تستخدمها عادة لذلك Gateway. استبدل `/usr/bin/npm` بـ npm النظام
الذي يملك البادئة العامة المملوكة للجذر على مضيفك:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

ثم تحقق من الخدمة:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

عندما يدير `openclaw update` تثبيت npm عاما، فإنه يثبّت الهدف أولا في
بادئة npm مؤقتة، ويتحقق من مخزون `dist` المعبأ، ثم يبدّل
شجرة الحزمة النظيفة إلى البادئة العامة الفعلية. يتجنب ذلك قيام npm بتركيب
حزمة جديدة فوق ملفات قديمة من الحزمة السابقة. إذا فشل أمر التثبيت،
يعيد OpenClaw المحاولة مرة واحدة مع `--omit=optional`. تساعد إعادة المحاولة هذه المضيفات التي
لا يمكن فيها تجميع التبعيات الاختيارية الأصلية، مع إبقاء الفشل الأصلي مرئيا
إذا فشل الرجوع الاحتياطي أيضا.

كما تمسح أوامر تحديث npm وتحديث Plugins المُدارة من OpenClaw حجر
`min-release-age` الخاص بـ npm لعملية npm الفرعية. قد يبلّغ npm عن تلك
السياسة كحد `before` مشتق؛ وكلاهما مفيد لسياسات حجر سلسلة التوريد العامة،
لكن تحديث OpenClaw الصريح يعني "ثبّت إصدار OpenClaw المحدد الآن."

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### موضوعات متقدمة لتثبيت npm

<AccordionGroup>
  <Accordion title="شجرة حزم للقراءة فقط">
    يتعامل OpenClaw مع التثبيتات العامة المعبأة كأنها للقراءة فقط في وقت التشغيل، حتى عندما يكون دليل الحزمة العامة قابلا للكتابة من قبل المستخدم الحالي. توجد تثبيتات حزم Plugins في جذور npm/git مملوكة لـ OpenClaw تحت دليل تكوين المستخدم، ولا يغيّر بدء تشغيل Gateway شجرة حزمة OpenClaw.

    تثبّت بعض إعدادات npm على Linux الحزم العامة تحت أدلة مملوكة للجذر مثل `/usr/lib/node_modules/openclaw`. يدعم OpenClaw هذا التخطيط لأن أوامر تثبيت/تحديث Plugins تكتب خارج دليل الحزمة العامة هذا.

  </Accordion>
  <Accordion title="وحدات systemd معززة">
    امنح OpenClaw حق الكتابة إلى جذور التكوين/الحالة الخاصة به حتى تتمكن تثبيتات Plugins الصريحة، وتحديثات Plugins، وتنظيف doctor من حفظ تغييراتها:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="فحص مسبق لمساحة القرص">
    قبل تحديثات الحزم وتثبيتات Plugins الصريحة، يحاول OpenClaw إجراء فحص مساحة قرص بأفضل جهد على وحدة التخزين الهدف. ينتج عن انخفاض المساحة تحذير يتضمن المسار الذي تم فحصه، لكنه لا يمنع التحديث لأن حصص أنظمة الملفات، واللقطات، ووحدات التخزين الشبكية يمكن أن تتغير بعد الفحص. يظل تثبيت مدير الحزم الفعلي والتحقق بعد التثبيت هما المرجع الحاسم.
  </Accordion>
</AccordionGroup>

## المحدّث التلقائي

يكون المحدّث التلقائي متوقفا افتراضيا. فعّله في `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| القناة    | السلوك                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | ينتظر `stableDelayHours`، ثم يطبق مع jitter حتمي عبر `stableJitterHours` (طرح موزع). |
| `beta`   | يتحقق كل `betaCheckIntervalHours` (الافتراضي: كل ساعة) ويطبق فورا.                              |
| `dev`    | لا يوجد تطبيق تلقائي. استخدم `openclaw update` يدويا.                                                           |

يسجل Gateway أيضا تلميح تحديث عند بدء التشغيل (عطّله باستخدام `update.checkOnStart: false`).
لخفض الإصدار أو الاسترداد من حادث، اضبط `OPENCLAW_NO_AUTO_UPDATE=1` في بيئة Gateway لحظر التطبيقات التلقائية حتى عندما يكون `update.auto.enabled` مكوّنا. يمكن أن تظل تلميحات تحديث بدء التشغيل تعمل ما لم يكن `update.checkOnStart` معطلا أيضا.

لا تستبدل تحديثات مدير الحزم المطلوبة عبر معالج مستوى التحكم الحي في Gateway
شجرة الحزمة داخل عملية Gateway العاملة. في تثبيتات الخدمة المُدارة،
يبدأ Gateway تسليما منفصلا، ويخرج، ويترك مسار CLI المعتاد
`openclaw update --yes --json` يوقف الخدمة، ويستبدل
الحزمة، ويحدّث بيانات تعريف الخدمة، ويعيد التشغيل، ويتحقق من إصدار Gateway
وقابلية الوصول، ويسترد LaunchAgent مثبتا لكن غير محمّل على macOS عندما
يكون ذلك ممكنا. إذا لم يستطع Gateway تنفيذ ذلك التسليم بأمان، يبلّغ `update.run` عن
أمر shell آمن بدلا من تشغيل مدير الحزم داخل العملية.

## بعد التحديث

<Steps>

### تشغيل doctor

```bash
openclaw doctor
```

يرحّل التكوين، ويدقق سياسات DM، ويتحقق من صحة Gateway. التفاصيل: [Doctor](/ar/gateway/doctor)

### إعادة تشغيل Gateway

```bash
openclaw gateway restart
```

### التحقق

```bash
openclaw health
```

</Steps>

## التراجع

### تثبيت إصدار (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
يعرض `npm view openclaw version` الإصدار المنشور الحالي.
</Tip>

### تثبيت commit (المصدر)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

للعودة إلى الأحدث: `git checkout main && git pull`.

## إذا كنت عالقا

- شغّل `openclaw doctor` مرة أخرى واقرأ المخرجات بعناية.
- بالنسبة إلى `openclaw update --channel dev` على checkouts المصدر، يقوم المحدّث بتمهيد `pnpm` تلقائيا عند الحاجة. إذا رأيت خطأ تمهيد pnpm/corepack، فثبّت `pnpm` يدويا (أو أعد تفعيل `corepack`) ثم أعد تشغيل التحديث.
- تحقق من: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- اسأل في Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install): كل طرق التثبيت.
- [Doctor](/ar/gateway/doctor): فحوصات الصحة بعد التحديثات.
- [الترحيل](/ar/install/migrating): أدلة الترحيل بين الإصدارات الرئيسية.
