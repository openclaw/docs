---
read_when:
    - تحديث OpenClaw
    - يتعطّل شيء ما بعد التحديث
summary: تحديث OpenClaw بأمان (التثبيت العام أو من المصدر)، بالإضافة إلى استراتيجية التراجع
title: التحديث
x-i18n:
    generated_at: "2026-05-07T13:23:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
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
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

لا يقبل `openclaw update` الخيار `--verbose`. لتشخيصات التحديث، استخدم
`--dry-run` لمعاينة الإجراءات المخطط لها، أو `--json` للحصول على نتائج منظمة، أو
`openclaw update status --json` لفحص حالة القناة والتوفر. لدى المثبّت علم
`--verbose` خاص به، لكن هذا العلم ليس جزءًا من
`openclaw update`.

يفضّل `--channel beta` القناة beta، لكن وقت التشغيل يعود إلى stable/latest عندما
تكون علامة beta مفقودة أو أقدم من أحدث إصدار مستقر. استخدم `--tag beta`
إذا كنت تريد dist-tag الخام لقناة npm beta لتحديث حزمة لمرة واحدة.

راجع [قنوات التطوير](/ar/install/development-channels) لمعرفة دلالات القنوات.

## التبديل بين تثبيتات npm وgit

استخدم القنوات عندما تريد تغيير نوع التثبيت. يحافظ المحدّث على
الحالة والإعدادات وبيانات الاعتماد ومساحة العمل في `~/.openclaw`؛ فهو يغيّر فقط
تثبيت كود OpenClaw الذي يستخدمه CLI وGateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

شغّله أولًا مع `--dry-run` لمعاينة تبديل وضع التثبيت بدقة:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

تضمن قناة `dev` وجود نسخة git checkout، وتبنيها، وتثبّت CLI العام
من تلك النسخة. تستخدم قناتا `stable` و`beta` تثبيتات الحزم. إذا كان
Gateway مثبتًا بالفعل، فإن `openclaw update` يحدّث بيانات تعريف الخدمة
ويعيد تشغيلها ما لم تمرر `--no-restart`.

## بديل: إعادة تشغيل المثبّت

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

أضف `--no-onboard` لتخطي الإعداد الأولي. لفرض نوع تثبيت محدد عبر
المثبّت، مرر `--install-method git --no-onboard` أو
`--install-method npm --no-onboard`.

إذا فشل `openclaw update` بعد مرحلة تثبيت حزمة npm، فأعد تشغيل
المثبّت. لا يستدعي المثبّت المحدّث القديم؛ بل يشغّل تثبيت الحزمة
العامة مباشرة ويمكنه استرداد تثبيت npm محدث جزئيًا.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

لتثبيت الاسترداد على إصدار أو dist-tag محدد، أضف `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## بديل: npm أو pnpm أو bun يدويًا

```bash
npm i -g openclaw@latest
```

فضّل `openclaw update` للتثبيتات المُدارة لأنه يستطيع تنسيق
تبديل الحزمة مع خدمة Gateway الجارية. إذا حدّثت يدويًا أثناء تشغيل
Gateway مُدار، فأعد تشغيل Gateway فور انتهاء مدير الحزم حتى لا تواصل
العملية القديمة تقديم الخدمة من ملفات حزمة تم استبدالها.

عندما يدير `openclaw update` تثبيت npm عامًا، فإنه يثبّت الهدف أولًا في
بادئة npm مؤقتة، ويتحقق من مخزون `dist` المعبأ، ثم يستبدل شجرة الحزمة
النظيفة في البادئة العامة الحقيقية. هذا يتجنب قيام npm بتركيب حزمة
جديدة فوق ملفات قديمة من الحزمة السابقة. إذا فشل أمر التثبيت،
يعيد OpenClaw المحاولة مرة واحدة مع `--omit=optional`. تساعد إعادة المحاولة هذه
المضيفين الذين لا تستطيع التبعيات الاختيارية الأصلية أن تُترجم لديهم، مع إبقاء
الفشل الأصلي مرئيًا إذا فشل مسار الرجوع أيضًا.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### مواضيع تثبيت npm المتقدمة

<AccordionGroup>
  <Accordion title="شجرة حزم للقراءة فقط">
    يتعامل OpenClaw مع التثبيتات العامة المعبأة كشجرة للقراءة فقط في وقت التشغيل، حتى عندما يكون دليل الحزمة العام قابلًا للكتابة من قبل المستخدم الحالي. تعيش تثبيتات حزم Plugin في جذور npm/git مملوكة لـ OpenClaw ضمن دليل إعدادات المستخدم، ولا يغيّر بدء تشغيل Gateway شجرة حزمة OpenClaw.

    تثبّت بعض إعدادات npm على Linux الحزم العامة ضمن أدلة مملوكة للجذر مثل `/usr/lib/node_modules/openclaw`. يدعم OpenClaw هذا التخطيط لأن أوامر تثبيت/تحديث Plugin تكتب خارج دليل الحزمة العام ذلك.

  </Accordion>
  <Accordion title="وحدات systemd مقواة">
    امنح OpenClaw صلاحية الكتابة إلى جذور الإعدادات/الحالة الخاصة به حتى تتمكن تثبيتات Plugin الصريحة، وتحديثات Plugin، وتنظيف doctor من حفظ تغييراتها:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="فحص مساحة القرص المسبق">
    قبل تحديثات الحزم وتثبيتات Plugin الصريحة، يحاول OpenClaw إجراء فحص مساحة قرص بأفضل جهد لوحدة التخزين الهدف. ينتج عن انخفاض المساحة تحذير يتضمن المسار الذي تم فحصه، لكنه لا يحظر التحديث لأن حصص أنظمة الملفات، واللقطات، ووحدات التخزين الشبكية يمكن أن تتغير بعد الفحص. يظل تثبيت مدير الحزم الفعلي والتحقق اللاحق للتثبيت هما المرجع الحاسم.
  </Accordion>
</AccordionGroup>

## المحدّث التلقائي

المحدّث التلقائي متوقف افتراضيًا. فعّله في `~/.openclaw/openclaw.json`:

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

| القناة | السلوك |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | ينتظر `stableDelayHours`، ثم يطبق مع تذبذب حتمي عبر `stableJitterHours` (طرح موزع). |
| `beta`   | يتحقق كل `betaCheckIntervalHours` (الافتراضي: كل ساعة) ويطبق فورًا. |
| `dev`    | لا يوجد تطبيق تلقائي. استخدم `openclaw update` يدويًا. |

يسجل Gateway أيضًا تلميح تحديث عند بدء التشغيل (عطّله باستخدام `update.checkOnStart: false`).
للرجوع إلى إصدار أقدم أو للتعافي من حادث، اضبط `OPENCLAW_NO_AUTO_UPDATE=1` في بيئة Gateway لحظر التطبيقات التلقائية حتى عند ضبط `update.auto.enabled`. يمكن أن تظل تلميحات التحديث عند بدء التشغيل تعمل ما لم يتم تعطيل `update.checkOnStart` أيضًا.

تفرض تحديثات مدير الحزم المطلوبة عبر معالج مستوى تحكم Gateway الحي
إعادة تشغيل تحديث غير مؤجلة وبدون فترة تهدئة بعد تبديل الحزمة. هذا
يتجنب ترك عملية قديمة في الذاكرة مدة كافية لتحميل أجزاء كسولًا
من شجرة حزمة تم استبدالها بالفعل. يظل `openclaw update` من الصدفة
هو المسار المفضل للتثبيتات المُدارة لأنه يستطيع إيقاف الخدمة
وإعادة تشغيلها حول التحديث.

## بعد التحديث

<Steps>

### شغّل doctor

```bash
openclaw doctor
```

يرحّل الإعدادات، ويدقق سياسات الرسائل المباشرة، ويفحص صحة Gateway. التفاصيل: [Doctor](/ar/gateway/doctor)

### أعد تشغيل Gateway

```bash
openclaw gateway restart
```

### تحقق

```bash
openclaw health
```

</Steps>

## الرجوع إلى إصدار سابق

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

## إذا كنت عالقًا

- شغّل `openclaw doctor` مرة أخرى واقرأ المخرجات بعناية.
- بالنسبة إلى `openclaw update --channel dev` على نسخ المصدر checkout، يهيئ المحدّث `pnpm` تلقائيًا عند الحاجة. إذا رأيت خطأ تهيئة pnpm/corepack، فثبّت `pnpm` يدويًا (أو أعد تفعيل `corepack`) ثم أعد تشغيل التحديث.
- تحقق من: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- اسأل في Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install): جميع طرق التثبيت.
- [Doctor](/ar/gateway/doctor): فحوصات الصحة بعد التحديثات.
- [الترحيل](/ar/install/migrating): أدلة ترحيل الإصدارات الرئيسية.
