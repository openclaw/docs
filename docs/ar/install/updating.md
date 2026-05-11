---
read_when:
    - تحديث OpenClaw
    - يتعطل شيء ما بعد التحديث
summary: تحديث OpenClaw بأمان (التثبيت العام أو من المصدر)، مع استراتيجية التراجع
title: جارٍ التحديث
x-i18n:
    generated_at: "2026-05-11T20:35:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb1506ed87b1cf2e4928987c9dbfaff17d47b87f6c18239d694e0f55deb609f7
    source_path: install/updating.md
    workflow: 16
---

حافظ على OpenClaw محدثًا باستمرار.

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

يفضّل `--channel beta` قناة beta، لكن وقت التشغيل يعود إلى stable/latest عندما
تكون علامة beta مفقودة أو أقدم من أحدث إصدار مستقر. استخدم `--tag beta`
إذا كنت تريد وسم npm beta dist-tag الخام لتحديث حزمة لمرة واحدة.

بالنسبة إلى Plugins المُدارة، يكون الرجوع الاحتياطي لقناة beta تحذيرًا: يمكن أن
ينجح تحديث النواة رغم أن Plugin يستخدم إصداره الافتراضي/latest المسجّل لأنه لا
تتوفر نسخة beta من Plugin.

راجع [قنوات التطوير](/ar/install/development-channels) لمعرفة دلالات القنوات.

## التبديل بين تثبيتات npm و git

استخدم القنوات عندما تريد تغيير نوع التثبيت. يحتفظ المحدّث بحالتك
وإعداداتك وبيانات اعتمادك ومساحة عملك في `~/.openclaw`؛ ولا يغيّر إلا
تثبيت كود OpenClaw الذي يستخدمه CLI وGateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

شغّل باستخدام `--dry-run` أولًا لمعاينة تبديل وضع التثبيت بدقة:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

تضمن قناة `dev` وجود نسخة git checkout، وتبنيها، وتثبّت CLI العام
من تلك النسخة. تستخدم قناتا `stable` و`beta` تثبيتات الحزم. إذا كان
Gateway مثبتًا بالفعل، يحدّث `openclaw update` بيانات وصف الخدمة
ويعيد تشغيلها ما لم تمرّر `--no-restart`.

## بديل: إعادة تشغيل المثبّت

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

أضف `--no-onboard` لتخطي الإعداد الأولي. لفرض نوع تثبيت محدد عبر
المثبّت، مرّر `--install-method git --no-onboard` أو
`--install-method npm --no-onboard`.

إذا فشل `openclaw update` بعد مرحلة تثبيت حزمة npm، فأعد تشغيل
المثبّت. لا يستدعي المثبّت المحدّث القديم؛ بل يشغّل تثبيت الحزمة
العامة مباشرة ويمكنه استرداد تثبيت npm محدّث جزئيًا.

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

فضّل `openclaw update` للتثبيتات الخاضعة للإشراف لأنه يستطيع تنسيق
استبدال الحزمة مع خدمة Gateway العاملة. إذا حدّثت يدويًا أثناء تشغيل
Gateway مُدار، فأعد تشغيل Gateway فور انتهاء مدير الحزم حتى لا تواصل
العملية القديمة الخدمة من ملفات حزمة تم استبدالها.

عندما يدير `openclaw update` تثبيت npm عامًا، فإنه يثبّت الهدف أولًا
في بادئة npm مؤقتة، ويتحقق من مخزون `dist` المعبأ، ثم يستبدل شجرة
الحزمة النظيفة داخل البادئة العامة الحقيقية. يتجنب ذلك أن يضع npm
حزمة جديدة فوق ملفات قديمة من الحزمة السابقة. إذا فشل أمر التثبيت،
يعيد OpenClaw المحاولة مرة واحدة باستخدام `--omit=optional`. تساعد
هذه المحاولة المضيفين الذين لا يمكن فيها تجميع الاعتماديات الاختيارية
الأصلية، مع إبقاء الفشل الأصلي مرئيًا إذا فشل الرجوع الاحتياطي أيضًا.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### موضوعات تثبيت npm المتقدمة

<AccordionGroup>
  <Accordion title="شجرة حزم للقراءة فقط">
    يتعامل OpenClaw مع التثبيتات العامة المعبأة على أنها للقراءة فقط وقت التشغيل، حتى عندما يكون دليل الحزمة العام قابلًا للكتابة من قبل المستخدم الحالي. توجد تثبيتات حزم Plugin في جذور npm/git مملوكة لـ OpenClaw ضمن دليل إعدادات المستخدم، ولا يغيّر بدء تشغيل Gateway شجرة حزمة OpenClaw.

    تثبّت بعض إعدادات npm على Linux الحزم العامة ضمن أدلة مملوكة للجذر مثل `/usr/lib/node_modules/openclaw`. يدعم OpenClaw هذا التخطيط لأن أوامر تثبيت/تحديث Plugin تكتب خارج دليل الحزمة العام هذا.

  </Accordion>
  <Accordion title="وحدات systemd مقوّاة">
    امنح OpenClaw صلاحية الكتابة إلى جذور الإعدادات/الحالة الخاصة به حتى تتمكن عمليات تثبيت Plugin الصريحة، وتحديثات Plugin، وتنظيف doctor من حفظ تغييراتها:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="فحص مسبق لمساحة القرص">
    قبل تحديثات الحزم وتثبيتات Plugin الصريحة، يحاول OpenClaw إجراء فحص لمساحة القرص بأفضل جهد للمجلد الهدف. ينتج عن انخفاض المساحة تحذير يتضمن المسار الذي تم فحصه، لكنه لا يمنع التحديث لأن حصص أنظمة الملفات، واللقطات، ووحدات التخزين الشبكية يمكن أن تتغير بعد الفحص. يظل تثبيت مدير الحزم الفعلي والتحقق بعد التثبيت هما المرجع الحاسم.
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

| القناة    | السلوك                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | ينتظر `stableDelayHours`، ثم يطبق مع تفاوت حتمي عبر `stableJitterHours` (طرح موزع). |
| `beta`   | يفحص كل `betaCheckIntervalHours` (الافتراضي: كل ساعة) ويطبق فورًا.                              |
| `dev`    | لا يوجد تطبيق تلقائي. استخدم `openclaw update` يدويًا.                                                           |

يسجّل Gateway أيضًا تلميح تحديث عند بدء التشغيل (عطّله باستخدام `update.checkOnStart: false`).
للاسترداد من الرجوع إلى إصدار أقدم أو من حادثة، اضبط `OPENCLAW_NO_AUTO_UPDATE=1` في بيئة Gateway لمنع التطبيقات التلقائية حتى عندما يكون `update.auto.enabled` مضبوطًا. يمكن أن تستمر تلميحات تحديث بدء التشغيل في العمل ما لم يتم تعطيل `update.checkOnStart` أيضًا.

تفرض تحديثات مدير الحزم المطلوبة عبر معالج مستوى التحكم المباشر في Gateway
إعادة تشغيل تحديث غير مؤجلة وبلا فترة تهدئة بعد استبدال الحزمة. يتجنب ذلك
ترك عملية قديمة في الذاكرة مدة كافية لتحميل أجزاء كسولًا من شجرة حزم
تم استبدالها بالفعل. يظل `openclaw update` عبر الصدفة هو المسار المفضل
للتثبيتات الخاضعة للإشراف لأنه يستطيع إيقاف الخدمة وإعادة تشغيلها حول التحديث.

## بعد التحديث

<Steps>

### تشغيل doctor

```bash
openclaw doctor
```

يرحّل الإعدادات، ويدقق سياسات الرسائل المباشرة، ويفحص صحة Gateway. التفاصيل: [Doctor](/ar/gateway/doctor)

### إعادة تشغيل Gateway

```bash
openclaw gateway restart
```

### التحقق

```bash
openclaw health
```

</Steps>

## الرجوع إلى إصدار سابق

### تثبيت إصدار محدد (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
يعرض `npm view openclaw version` الإصدار المنشور الحالي.
</Tip>

### تثبيت commit محدد (المصدر)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

للعودة إلى الأحدث: `git checkout main && git pull`.

## إذا كنت عالقًا

- شغّل `openclaw doctor` مرة أخرى واقرأ المخرجات بعناية.
- بالنسبة إلى `openclaw update --channel dev` على نسخ المصدر checkouts، يهيئ المحدّث `pnpm` تلقائيًا عند الحاجة. إذا رأيت خطأ تمهيد pnpm/corepack، فثبّت `pnpm` يدويًا (أو أعد تمكين `corepack`) وأعد تشغيل التحديث.
- تحقق من: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- اسأل في Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install): كل طرق التثبيت.
- [Doctor](/ar/gateway/doctor): فحوصات الصحة بعد التحديثات.
- [الترحيل](/ar/install/migrating): أدلة الترحيل بين الإصدارات الرئيسية.
