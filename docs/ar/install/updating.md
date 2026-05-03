---
read_when:
    - تحديث OpenClaw
    - يتعطل شيء ما بعد التحديث
summary: تحديث OpenClaw بأمان (التثبيت العام أو من المصدر)، مع استراتيجية التراجع
title: التحديث
x-i18n:
    generated_at: "2026-05-03T21:38:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9e26ea71748dfd1573cdca01126bf29ebc56be56eac604e2b6a009b463820d1
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
openclaw update --dry-run   # معاينة دون تطبيق
```

لا يقبل `openclaw update` الخيار `--verbose`. لتشخيصات التحديث، استخدم
`--dry-run` لمعاينة الإجراءات المخطط لها، أو `--json` للنتائج المهيكلة، أو
`openclaw update status --json` لفحص حالة القناة والتوافر. لدى
المثبّت علم `--verbose` خاص به، لكن ذلك العلم ليس جزءًا من
`openclaw update`.

يفضّل `--channel beta` الإصدار التجريبي، لكن وقت التشغيل يعود إلى stable/latest عندما
تكون وسم beta مفقودة أو أقدم من أحدث إصدار stable. استخدم `--tag beta`
إذا كنت تريد npm beta dist-tag الخام لتحديث حزمة لمرة واحدة.

راجع [قنوات التطوير](/ar/install/development-channels) لمعرفة دلالات القنوات.

## التبديل بين تثبيتات npm وgit

استخدم القنوات عندما تريد تغيير نوع التثبيت. يحافظ المحدّث على
حالتك وإعداداتك وبيانات اعتمادك ومساحة عملك في `~/.openclaw`؛ فهو يغيّر فقط
تثبيت كود OpenClaw الذي يستخدمه CLI وGateway.

```bash
# تثبيت حزمة npm -> نسخة git قابلة للتحرير
openclaw update --channel dev

# نسخة git -> تثبيت حزمة npm
openclaw update --channel stable
```

شغّله أولًا مع `--dry-run` لمعاينة تبديل وضع التثبيت الدقيق:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

تضمن قناة `dev` وجود نسخة git، وتبنيها، وتثبّت CLI العمومي
من تلك النسخة. تستخدم قناتا `stable` و`beta` تثبيتات الحزم. إذا كان
Gateway مثبتًا بالفعل، فإن `openclaw update` يحدّث بيانات تعريف الخدمة
ويعيد تشغيلها ما لم تمرّر `--no-restart`.

## بديل: إعادة تشغيل المثبّت

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

أضف `--no-onboard` لتخطي الإعداد الأولي. لفرض نوع تثبيت محدد عبر
المثبّت، مرّر `--install-method git --no-onboard` أو
`--install-method npm --no-onboard`.

إذا فشل `openclaw update` بعد مرحلة تثبيت حزمة npm، فأعد تشغيل
المثبّت. لا يستدعي المثبّت المحدّث القديم؛ بل يشغّل تثبيت
الحزمة العمومية مباشرة ويمكنه استرداد تثبيت npm محدّث جزئيًا.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

لتثبيت الاسترداد على إصدار محدد أو dist-tag محدد، أضف `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## بديل: npm أو pnpm أو bun يدويًا

```bash
npm i -g openclaw@latest
```

عندما يدير `openclaw update` تثبيت npm عموميًا، فإنه يثبّت الهدف أولًا في
بادئة npm مؤقتة، ويتحقق من مخزون `dist` المعبأ، ثم يستبدل
شجرة الحزمة النظيفة في البادئة العمومية الحقيقية. يجنّب ذلك قيام npm بتراكب
حزمة جديدة فوق ملفات قديمة من الحزمة السابقة. إذا فشل أمر التثبيت،
يعيد OpenClaw المحاولة مرة واحدة مع `--omit=optional`. تساعد إعادة المحاولة هذه المضيفات التي لا تستطيع فيها
التبعيات الاختيارية الأصلية أن تُترجم، مع إبقاء الفشل الأصلي مرئيًا
إذا فشل المسار الاحتياطي أيضًا.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### مواضيع متقدمة لتثبيت npm

<AccordionGroup>
  <Accordion title="شجرة حزم للقراءة فقط">
    يتعامل OpenClaw مع التثبيتات العمومية المعبأة على أنها للقراءة فقط في وقت التشغيل، حتى عندما يكون دليل الحزمة العمومية قابلًا للكتابة من قبل المستخدم الحالي. توجد تثبيتات حزم Plugin في جذور npm/git مملوكة لـ OpenClaw ضمن دليل إعدادات المستخدم، ولا يغيّر بدء تشغيل Gateway شجرة حزمة OpenClaw.

    تثبّت بعض إعدادات npm على Linux الحزم العمومية ضمن أدلة مملوكة للجذر مثل `/usr/lib/node_modules/openclaw`. يدعم OpenClaw هذا التخطيط لأن أوامر تثبيت/تحديث Plugin تكتب خارج دليل الحزمة العمومية ذلك.

  </Accordion>
  <Accordion title="وحدات systemd معزّزة">
    امنح OpenClaw حق الكتابة إلى جذور الإعداد/الحالة الخاصة به حتى تتمكن تثبيتات Plugin الصريحة، وتحديثات Plugin، وتنظيف doctor من حفظ تغييراتها:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="فحص تمهيدي لمساحة القرص">
    قبل تحديثات الحزم وتثبيتات Plugin الصريحة، يحاول OpenClaw إجراء فحص مساحة قرص بأفضل جهد للمجلد الهدف. تنتج المساحة المنخفضة تحذيرًا يتضمن المسار الذي تم فحصه، لكنها لا تمنع التحديث لأن حصص أنظمة الملفات واللقطات ووحدات تخزين الشبكة يمكن أن تتغير بعد الفحص. يظل تثبيت مدير الحزم الفعلي والتحقق بعد التثبيت هما المرجع المعتمد.
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
| `stable` | ينتظر `stableDelayHours`، ثم يطبق مع تباين حتمي عبر `stableJitterHours` (طرح موزّع). |
| `beta`   | يتحقق كل `betaCheckIntervalHours` (الافتراضي: كل ساعة) ويطبق فورًا.                              |
| `dev`    | لا يوجد تطبيق تلقائي. استخدم `openclaw update` يدويًا.                                                           |

يسجّل Gateway أيضًا تلميح تحديث عند بدء التشغيل (عطّله باستخدام `update.checkOnStart: false`).
لخفض الإصدار أو الاسترداد من حادثة، اضبط `OPENCLAW_NO_AUTO_UPDATE=1` في بيئة Gateway لحظر التطبيقات التلقائية حتى عندما يكون `update.auto.enabled` مضبوطًا. يمكن أن تستمر تلميحات تحديث بدء التشغيل ما لم يتم تعطيل `update.checkOnStart` أيضًا.

تفرض تحديثات مدير الحزم المطلوبة عبر معالج مستوى التحكم الحي في Gateway
إعادة تشغيل تحديث غير مؤجلة ودون فترة تهدئة بعد استبدال الحزمة. يجنّب ذلك
ترك عملية قديمة في الذاكرة مدة تكفي لتحميل كسول لأجزاء
من شجرة حزمة تم استبدالها بالفعل. يظل `openclaw update` عبر الصدفة
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

### تثبيت التزام (المصدر)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

للعودة إلى الأحدث: `git checkout main && git pull`.

## إذا كنت عالقًا

- شغّل `openclaw doctor` مرة أخرى واقرأ المخرجات بعناية.
- بالنسبة إلى `openclaw update --channel dev` على نسخ المصدر، يهيّئ المحدّث `pnpm` تلقائيًا عند الحاجة. إذا رأيت خطأ تهيئة pnpm/corepack، فثبّت `pnpm` يدويًا (أو أعد تفعيل `corepack`) ثم أعد تشغيل التحديث.
- تحقق من: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- اسأل في Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install): جميع طرق التثبيت.
- [Doctor](/ar/gateway/doctor): فحوصات الصحة بعد التحديثات.
- [الترحيل](/ar/install/migrating): أدلة ترحيل الإصدارات الرئيسية.
