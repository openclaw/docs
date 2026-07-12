---
read_when:
    - تحديث OpenClaw
    - يتعطل شيء ما بعد التحديث
summary: تحديث OpenClaw بأمان (عبر التثبيت العام أو من المصدر)، بالإضافة إلى استراتيجية التراجع
title: التحديث
x-i18n:
    generated_at: "2026-07-12T06:05:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

حافظ على تحديث OpenClaw.

لاستبدال صور Docker وPodman وKubernetes، راجع
[ترقية صور الحاويات](/ar/install/docker#upgrading-container-images). ينفّذ
Gateway أعمال ترقية آمنة عند بدء التشغيل قبل أن يصبح جاهزًا، ويتوقف إذا كانت
الحالة المركّبة تحتاج إلى إصلاح يدوي.

## موصى به: `openclaw update`

يكتشف نوع التثبيت لديك (npm أو git)، ويجلب أحدث إصدار، ويشغّل `openclaw doctor`، ثم يعيد تشغيل Gateway.

```bash
openclaw update
```

بدّل القنوات أو استهدف إصدارًا محددًا:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # معاينة دون تطبيق
```

لا يتضمن `openclaw update` الخيار `--verbose` (بخلاف برنامج التثبيت). للتشخيص، استخدم
`--dry-run` لمعاينة الإجراءات المخططة، أو `--json` للحصول على نتائج منظّمة، أو
`openclaw update status --json` لفحص حالة القناة والتوفّر.

يفضّل `--channel beta` وسم توزيع npm التجريبي، لكنه يعود إلى المستقر/الأحدث
عندما يكون وسم الإصدار التجريبي مفقودًا أو يكون إصداره أقدم من أحدث إصدار
مستقر. استخدم `--tag beta` بدلًا من ذلك لتحديث حزمة لمرة واحدة مثبّت على وسم
توزيع npm التجريبي الخام.

تتوفر `--channel extended-stable` للحزم فقط، ويظل التثبيت
في الواجهة الأمامية فقط. يقرأ OpenClaw محدد npm العام `extended-stable`،
ويتحقق من الحزمة الدقيقة المحددة، ويثبّت ذلك الإصدار بعينه. يؤدي فقدان
بيانات السجل أو عدم اتساقها إلى الإيقاف الآمن؛ ولا يعود أبدًا إلى `latest`.
إذا كان الإصدار المحدد أقدم من الإصدار المثبّت، يظل تأكيد
الرجوع إلى إصدار أقدم المعتاد ساريًا. يحتفظ CLI بالقناة بعد
تحديث أساسي ناجح؛ أما التنفيذ المباشر للأمر `npm install -g openclaw@extended-stable`
فلا يحدّث `update.channel`.
بعد استبدال النواة، تتقارب Plugins الرسمية المؤهلة من npm ذات النية
الافتراضية/غير المقيّدة أو نية `latest` إلى ذلك الإصدار الدقيق من النواة. تظل
التثبيتات المثبّتة على إصدار دقيق والوسوم الصريحة بخلاف `latest` وPlugins
التابعة لجهات خارجية والمصادر غير التابعة لـ npm دون تغيير.
تحتفظ عمليات التثبيت من الكتالوج التي أنشأتها إصدارات OpenClaw الحالية بتلك
النية الافتراضية. تظل السجلات الأقدم التي تحتوي على إصدار دقيق فقط مثبّتة عليه لأن
OpenClaw لا يستطيع التمييز بأمان بين تثبيت تلقائي قديم وتثبيت اختاره المستخدم؛ شغّل
`openclaw plugins update @openclaw/name` مرة واحدة على قناة `extended-stable`
لإعادة إشراك Plugin هذه في تتبع الإصدار الدقيق للنواة.

يوفر `--channel dev` نسخة عمل متحركة ودائمة من فرع GitHub `main`. لتحديث
حزمة لمرة واحدة، يربط `--tag main` بمواصفة الحزمة `github:openclaw/openclaw#main`
ويثبّتها مباشرة عبر مدير الحزم المستهدف (npm/pnpm/bun).

بالنسبة إلى Plugins المُدارة، يُعد غياب إصدار تجريبي تحذيرًا لا فشلًا: يمكن
أن ينجح تحديث النواة مع عودة Plugin إلى إصدارها الافتراضي/الأحدث المسجّل.

راجع [قنوات الإصدار](/ar/install/development-channels) للاطلاع على دلالات القنوات.

## التبديل بين تثبيتات npm وgit

استخدم القنوات لتغيير نوع التثبيت. يحتفظ برنامج التحديث بالحالة والإعدادات
وبيانات الاعتماد ومساحة العمل في `~/.openclaw`؛ ولا يغيّر سوى تثبيت شيفرة OpenClaw
الذي يستخدمه CLI وGateway.

```bash
# تثبيت حزمة npm -> نسخة عمل git قابلة للتحرير
openclaw update --channel dev

# نسخة عمل git -> تثبيت حزمة npm
openclaw update --channel stable
```

عاين تبديل وضع التثبيت أولًا:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

تضمن `dev` وجود نسخة عمل git، وتبنيها، وتثبّت CLI العام منها.
تستخدم قنوات `stable` و`extended-stable` و`beta` تثبيتات الحزم.
يُرفض `extended-stable` على نسخة عمل git دون تعديلها أو
تحويلها. إذا كان Gateway مثبّتًا بالفعل، يحدّث `openclaw update`
بيانات الخدمة الوصفية ويعيد تشغيلها ما لم تمرر `--no-restart`.

بالنسبة إلى تثبيتات الحزم التي تتضمن خدمة Gateway مُدارة، يستهدف `openclaw update`
جذر الحزمة الذي تستخدمه تلك الخدمة. إذا كان الأمر `openclaw` في الصدفة صادرًا
من تثبيت مختلف، يطبع برنامج التحديث كلا الجذرين ومسار Node
للخدمة المُدارة، ويتحقق من توافق إصدار Node مع متطلب `engines.node`
للإصدار المستهدف قبل استبدال الحزمة.

## بديل: إعادة تشغيل برنامج التثبيت

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

أضف `--no-onboard` لتخطي الإعداد الأولي. لفرض نوع تثبيت محدد، مرّر
`--install-method git --no-onboard` أو `--install-method npm --no-onboard`.

إذا فشل `openclaw update` بعد مرحلة تثبيت حزمة npm، فأعد تشغيل
برنامج التثبيت بدلًا منه. فهو لا يستدعي برنامج التحديث؛ بل ينفّذ تثبيت الحزمة
العام مباشرة ويمكنه استعادة تثبيت npm محدّث جزئيًا.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

ثبّت الاستعادة على إصدار أو وسم توزيع محدد باستخدام `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## بديل: استخدام npm أو pnpm أو bun يدويًا

```bash
npm i -g openclaw@latest
```

فضّل `openclaw update` للتثبيتات الخاضعة للإشراف: إذ يمكنه تنسيق استبدال الحزمة
مع خدمة Gateway قيد التشغيل. إذا أجريت تحديثًا يدويًا على تثبيت خاضع
للإشراف، فأوقف Gateway المُدار أولًا. تستبدل مديرات الحزم الملفات
في موضعها، وإلا فقد يحاول Gateway قيد التشغيل تحميل ملفات النواة أو Plugin
في أثناء الاستبدال. أعد تشغيل Gateway بعد انتهاء مدير الحزم حتى يلتقط
التثبيت الجديد.

بالنسبة إلى تثبيت عام على مستوى نظام Linux ومملوك للمستخدم الجذر، إذا فشل `openclaw update`
بالخطأ `EACCES`، فاستعده باستخدام npm الخاص بالنظام مع إبقاء Gateway متوقفًا أثناء
الاستبدال اليدوي. استخدم أعلام ملف التعريف/البيئة نفسها التي تستخدمها عادةً مع
Gateway ذاك. استبدل `/usr/bin/npm` بمسار npm الخاص بالنظام الذي يملك
البادئة العامة المملوكة للمستخدم الجذر على مضيفك:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

ثم تحقّق:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

عندما يدير `openclaw update` تثبيت npm عامًا، فإنه يثبّت الهدف
أولًا في بادئة npm مؤقتة، ويتحقق من محتويات `dist` المضمّنة في الحزمة، ثم
يستبدل شجرة الحزمة النظيفة داخل البادئة العامة الفعلية، متجنبًا قيام npm
بوضع حزمة جديدة فوق ملفات قديمة متبقية من الحزمة السابقة. إذا فشل أمر
التثبيت، يعيد OpenClaw المحاولة مرة واحدة باستخدام `--omit=optional`، مما يساعد
المضيفين الذين يتعذر عليهم ترجمة التبعيات الأصلية الاختيارية.

تمسح أوامر تحديث npm وتحديث Plugins التي يديرها OpenClaw أيضًا
حجر سلسلة التوريد `min-release-age` في npm (أو مفتاح الإعداد الأقدم `before`)
لعملية npm الفرعية. توجد هذه السياسة للحماية العامة، لكن تحديث OpenClaw
الصريح يعني «ثبّت الإصدار المحدد الآن».

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### موضوعات متقدمة لتثبيت npm

<AccordionGroup>
  <Accordion title="شجرة حزم للقراءة فقط">
    يتعامل OpenClaw مع التثبيتات العامة المضمّنة في حزم بوصفها للقراءة فقط في وقت التشغيل، حتى عندما يكون دليل الحزمة العام قابلًا للكتابة بواسطة المستخدم الحالي. توجد تثبيتات حزم Plugins في جذور npm/git التي يملكها OpenClaw ضمن دليل إعدادات المستخدم، ولا يعدّل بدء تشغيل Gateway شجرة حزمة OpenClaw.

    تثبّت بعض إعدادات npm على Linux الحزم العامة ضمن أدلة مملوكة للمستخدم الجذر مثل `/usr/lib/node_modules/openclaw`. يدعم OpenClaw هذا التخطيط لأن أوامر تثبيت/تحديث Plugins تكتب خارج دليل الحزمة العام ذاك.

  </Accordion>
  <Accordion title="وحدات systemd محصّنة">
    امنح OpenClaw صلاحية الكتابة إلى جذور الإعدادات/الحالة حتى تتمكن عمليات تثبيت Plugins الصريحة وتحديثاتها وتنظيف doctor من حفظ تغييراتها:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="فحص تمهيدي لمساحة القرص">
    قبل تحديثات الحزم وتثبيتات Plugins الصريحة، يحاول OpenClaw إجراء فحص لمساحة القرص بأفضل جهد ممكن لوحدة التخزين المستهدفة. تؤدي المساحة المنخفضة إلى ظهور تحذير يتضمن المسار الذي جرى فحصه، لكنها لا تمنع التحديث لأن حصص نظام الملفات واللقطات ووحدات التخزين الشبكية قد تتغير بعد الفحص. يظل تثبيت مدير الحزم الفعلي والتحقق بعد التثبيت هما المرجع الحاسم.
  </Accordion>
</AccordionGroup>

## برنامج التحديث التلقائي

معطّل افتراضيًا. فعّله في `~/.openclaw/openclaw.json`:

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

| القناة            | السلوك                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | ينتظر `stableDelayHours` (الافتراضي: 6)، ثم يطبّق التحديث مع تفاوت حتمي عبر `stableJitterHours` (الافتراضي: 12) لتنفيذ طرح موزّع.                       |
| `extended-stable` | يتحقق من تلميح تحديث للقراءة فقط عند بدء التشغيل وكل 24 ساعة عند تمكين `checkOnStart`. ولا يطبّقه تلقائيًا أبدًا.                                    |
| `beta`            | يتحقق كل `betaCheckIntervalHours` (الافتراضي: 1) ويطبّق التحديث فورًا.                                                                                  |
| `dev`             | لا يوجد تطبيق تلقائي. استخدم `openclaw update` يدويًا.                                                                                                |

يسجّل Gateway أيضًا تلميح تحديث عند بدء التشغيل (عطّله باستخدام
`update.checkOnStart: false`). تستخدم تحديدات `extended-stable` المخزّنة
مسار التلميح المخصص للقراءة فقط وفاصل التلميح الحالي البالغ 24 ساعة، لكنها لا تستدعي
أبدًا التثبيت التلقائي أو التسليم أو إعادة التشغيل أو تأخير/تفاوت القناة المستقرة أو استطلاع القناة التجريبية.
للرجوع إلى إصدار أقدم أو التعافي من حادثة، عيّن `OPENCLAW_NO_AUTO_UPDATE=1` في بيئة Gateway لمنع التطبيقات التلقائية حتى عند ضبط `update.auto.enabled`. قد تستمر تلميحات التحديث عند بدء التشغيل ما لم يُعطّل `update.checkOnStart` أيضًا.

لا تستبدل تحديثات مدير الحزم المطلوبة عبر مستوى تحكم Gateway المباشر
(`update.run`) شجرة الحزمة داخل عملية Gateway قيد التشغيل.
في تثبيتات الخدمة المُدارة، يبدأ Gateway عملية تسليم منفصلة،
ثم يتوقف ويتيح لمسار CLI المعتاد `openclaw update --yes --json` إيقاف
الخدمة واستبدال الحزمة وتحديث بيانات الخدمة الوصفية وإعادة التشغيل والتحقق من
إصدار Gateway وإمكانية الوصول إليه، واستعادة LaunchAgent مثبّت لكنه غير محمّل على macOS
عندما يكون ذلك ممكنًا. إذا تعذر على Gateway إجراء هذا التسليم بأمان،
يُبلغ `update.run` عن أمر صدفة آمن بدلًا من تشغيل مدير
الحزم داخل العملية.

تبدأ بطاقة التحديث في الشريط الجانبي لواجهة التحكم تدفق `update.run` نفسه. في
تطبيق macOS الموقّع، تحدّث البطاقة التطبيق عبر Sparkle أولًا؛ وبعد إعادة التشغيل،
يجلب التطبيق Gateway المحلي المُدار إلى الإصدار المطابق.

## بعد التحديث

<Steps>

### تشغيل doctor

```bash
openclaw doctor
```

يرحّل الإعدادات، ويدقق سياسات الرسائل المباشرة، ويتحقق من صحة Gateway. التفاصيل: [Doctor](/ar/gateway/doctor)

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
يعرض `npm view openclaw version` الإصدار المنشور حاليًا.
</Tip>

### تثبيت التزام محدد (المصدر)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

للعودة إلى الأحدث: `git checkout main && git pull`.

## إذا واجهتك مشكلة

- شغّل `openclaw doctor` مرة أخرى واقرأ المخرجات بعناية.
- بالنسبة إلى `openclaw update --channel dev` على نسخ عمل المصدر، يُمهّد برنامج التحديث `pnpm` تلقائيًا عند الحاجة. إذا ظهر خطأ تمهيد pnpm/corepack، فثبّت `pnpm` يدويًا (أو أعد تمكين `corepack`) ثم أعد تشغيل التحديث.
- راجع: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- اطرح سؤالك في Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install): جميع طرق التثبيت.
- [أداة التشخيص](/ar/gateway/doctor): فحوصات السلامة بعد التحديثات.
- [الترحيل](/ar/install/migrating): أدلة الترحيل بين الإصدارات الرئيسية.
