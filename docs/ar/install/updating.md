---
read_when:
    - تحديث OpenClaw
    - يتعطل شيء ما بعد التحديث
summary: تحديث OpenClaw بأمان (تثبيت عام أو من المصدر)، بالإضافة إلى استراتيجية التراجع
title: التحديث
x-i18n:
    generated_at: "2026-05-02T07:34:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84bf4462a4ee041b0d22e433d1e9f44cfd799a5c327ba94f9df96595d92bdb3c
    source_path: install/updating.md
    workflow: 16
---

حافظ على تحديث OpenClaw.

## الموصى به: `openclaw update`

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

يفضّل `--channel beta` قناة beta، لكن وقت التشغيل يعود إلى stable/latest عندما
تكون وسم beta مفقودة أو أقدم من أحدث إصدار مستقر. استخدم `--tag beta`
إذا كنت تريد dist-tag الخام لـ npm beta لتحديث حزمة لمرة واحدة.

راجع [قنوات التطوير](/ar/install/development-channels) لمعاني القنوات.

## التبديل بين تثبيتات npm و git

استخدم القنوات عندما تريد تغيير نوع التثبيت. يحافظ المحدّث على
الحالة والإعدادات وبيانات الاعتماد ومساحة العمل في `~/.openclaw`؛ ولا يغيّر إلا
تثبيت كود OpenClaw الذي يستخدمه CLI و Gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

شغّل مع `--dry-run` أولاً لمعاينة التبديل الدقيق لوضع التثبيت:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

تضمن قناة `dev` وجود git checkout، وتبنيه، وتثبّت CLI العام
من ذلك checkout. تستخدم قناتا `stable` و `beta` تثبيتات الحزم. إذا كان
Gateway مثبتاً بالفعل، فإن `openclaw update` يحدّث بيانات تعريف الخدمة
ويعيد تشغيلها ما لم تمرر `--no-restart`.

## بديل: إعادة تشغيل المثبّت

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

أضف `--no-onboard` لتخطي الإعداد الأولي. لفرض نوع تثبيت محدد عبر
المثبّت، مرّر `--install-method git --no-onboard` أو
`--install-method npm --no-onboard`.

إذا فشل `openclaw update` بعد مرحلة تثبيت حزمة npm، فأعد تشغيل
المثبّت. لا يستدعي المثبّت المحدّث القديم؛ بل يشغّل تثبيت
الحزمة العام مباشرة ويمكنه استعادة تثبيت npm محدّث جزئياً.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

لتثبيت الاستعادة على إصدار محدد أو dist-tag محدد، أضف `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## بديل: npm أو pnpm أو bun يدوياً

```bash
npm i -g openclaw@latest
```

عندما يدير `openclaw update` تثبيت npm عاماً، فإنه يثبّت الهدف أولاً في
بادئة npm مؤقتة، ويتحقق من مخزون `dist` المعبأ، ثم يستبدل
شجرة الحزمة النظيفة داخل البادئة العامة الحقيقية. هذا يمنع npm من وضع
حزمة جديدة فوق ملفات قديمة متبقية من الحزمة السابقة. إذا فشل أمر التثبيت،
يعيد OpenClaw المحاولة مرة واحدة باستخدام `--omit=optional`. تساعد هذه المحاولة المضيفين الذين لا يمكن فيها
تجميع الاعتماديات الاختيارية الأصلية، مع إبقاء الفشل الأصلي مرئياً
إذا فشل المسار الاحتياطي أيضاً.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### موضوعات متقدمة لتثبيت npm

<AccordionGroup>
  <Accordion title="شجرة حزم للقراءة فقط">
    يتعامل OpenClaw مع التثبيتات العامة المعبأة كأنها للقراءة فقط في وقت التشغيل، حتى عندما يكون دليل الحزمة العام قابلاً للكتابة بواسطة المستخدم الحالي. تعيش تثبيتات حزم Plugin في جذور npm/git مملوكة لـ OpenClaw ضمن دليل إعدادات المستخدم، ولا يغيّر بدء تشغيل Gateway شجرة حزمة OpenClaw.

    تثبّت بعض إعدادات npm على Linux الحزم العامة ضمن أدلة مملوكة لـ root مثل `/usr/lib/node_modules/openclaw`. يدعم OpenClaw هذا التخطيط لأن أوامر تثبيت/تحديث Plugin تكتب خارج دليل الحزمة العام ذلك.

  </Accordion>
  <Accordion title="وحدات systemd مقوّاة">
    امنح OpenClaw صلاحية الكتابة إلى جذور الإعدادات/الحالة الخاصة به كي تتمكن تثبيتات Plugin الصريحة، وتحديثات Plugin، وتنظيف doctor من حفظ تغييراتها:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="فحص مسبق لمساحة القرص">
    قبل تحديثات الحزم وتثبيتات Plugin الصريحة، يحاول OpenClaw إجراء فحص لمساحة القرص المتاحة للمجلد الهدف بأفضل جهد. تنتج المساحة المنخفضة تحذيراً يتضمن المسار المفحوص، لكنها لا تمنع التحديث لأن حصص أنظمة الملفات واللقطات ووحدات التخزين الشبكية قد تتغير بعد الفحص. يظل تثبيت مدير الحزم الفعلي والتحقق بعد التثبيت هما المرجع النهائي.
  </Accordion>
</AccordionGroup>

## المحدّث التلقائي

المحدّث التلقائي معطّل افتراضياً. فعّله في `~/.openclaw/openclaw.json`:

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
| `stable` | ينتظر `stableDelayHours`، ثم يطبّق مع تفاوت حتمي عبر `stableJitterHours` (نشر موزّع). |
| `beta`   | يفحص كل `betaCheckIntervalHours` (الافتراضي: كل ساعة) ويطبّق فوراً.                              |
| `dev`    | لا يوجد تطبيق تلقائي. استخدم `openclaw update` يدوياً.                                                           |

يسجّل Gateway أيضاً تلميح تحديث عند بدء التشغيل (عطّله باستخدام `update.checkOnStart: false`).
للاسترجاع إلى إصدار أقدم أو التعافي من حادثة، اضبط `OPENCLAW_NO_AUTO_UPDATE=1` في بيئة Gateway لمنع التطبيقات التلقائية حتى عندما يكون `update.auto.enabled` مكوّناً. يمكن أن تستمر تلميحات التحديث عند بدء التشغيل ما لم يتم تعطيل `update.checkOnStart` أيضاً.

تفرض تحديثات مدير الحزم المطلوبة عبر معالج مستوى تحكم Gateway الحي
إعادة تشغيل تحديث غير مؤجلة وبدون فترة تهدئة بعد استبدال الحزمة. هذا
يتجنب إبقاء عملية قديمة في الذاكرة مدة تكفي لتحميل أجزاء كسولة
من شجرة حزمة تم استبدالها بالفعل. يبقى أمر shell `openclaw update`
هو المسار المفضل للتثبيتات الخاضعة للإشراف لأنه يستطيع إيقاف الخدمة
وإعادة تشغيلها حول التحديث.

## بعد التحديث

<Steps>

### شغّل doctor

```bash
openclaw doctor
```

يرحّل الإعدادات، ويدقق سياسات الرسائل الخاصة، ويفحص صحة Gateway. التفاصيل: [Doctor](/ar/gateway/doctor)

### أعد تشغيل Gateway

```bash
openclaw gateway restart
```

### تحقق

```bash
openclaw health
```

</Steps>

## الاسترجاع

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

## إذا علقت

- شغّل `openclaw doctor` مرة أخرى واقرأ الإخراج بعناية.
- بالنسبة إلى `openclaw update --channel dev` على source checkouts، يقوم المحدّث بالتمهيد التلقائي لـ `pnpm` عند الحاجة. إذا رأيت خطأ تمهيد pnpm/corepack، فثبّت `pnpm` يدوياً (أو أعد تفعيل `corepack`) ثم أعد تشغيل التحديث.
- تحقق من: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- اسأل في Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install): جميع طرق التثبيت.
- [Doctor](/ar/gateway/doctor): فحوصات الصحة بعد التحديثات.
- [الترحيل](/ar/install/migrating): أدلة ترحيل الإصدارات الرئيسية.
