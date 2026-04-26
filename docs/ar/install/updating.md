---
read_when:
    - تحديث OpenClaw
    - حدث خلل بعد التحديث
summary: تحديث OpenClaw بأمان (تثبيت عام أو من المصدر)، بالإضافة إلى استراتيجية التراجع
title: التحديث
x-i18n:
    generated_at: "2026-04-26T11:34:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: e40ff4d2db5f0b75107894d2b4959f34f3077acb55045230fb104b95795d9149
    source_path: install/updating.md
    workflow: 15
---

احرص على إبقاء OpenClaw محدثًا.

## الموصى به: `openclaw update`

أسرع طريقة للتحديث. فهو يكتشف نوع التثبيت لديك (npm أو git)، ويجلب أحدث إصدار، ويشغّل `openclaw doctor`، ويعيد تشغيل gateway.

```bash
openclaw update
```

للتبديل بين القنوات أو استهداف إصدار محدد:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # معاينة من دون تطبيق
```

يفضّل `--channel beta` قناة beta، لكن وقت التشغيل يعود إلى stable/latest عندما
تكون علامة beta مفقودة أو أقدم من أحدث إصدار stable. استخدم `--tag beta`
إذا كنت تريد dist-tag الخام الخاص بـ npm beta لتحديث حزمة لمرة واحدة.

راجع [قنوات التطوير](/ar/install/development-channels) لمعرفة دلالات القنوات.

## التبديل بين تثبيتات npm وgit

استخدم القنوات عندما تريد تغيير نوع التثبيت. يحتفظ المحدّث بالحالة،
والإعداد، وبيانات الاعتماد، ومساحة العمل في `~/.openclaw`؛ ولا يغيّر إلا
تثبيت شيفرة OpenClaw الذي يستخدمه CLI وgateway.

```bash
# تثبيت حزمة npm -> Git checkout قابل للتحرير
openclaw update --channel dev

# Git checkout -> تثبيت حزمة npm
openclaw update --channel stable
```

شغّل مع `--dry-run` أولًا لمعاينة التبديل الدقيق في وضع التثبيت:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

تضمن قناة `dev` وجود Git checkout، وتبنيه، وتثبت CLI العالمية
من تلك النسخة. أما القناتان `stable` و`beta` فتستخدمان تثبيتات الحزم. وإذا كانت
gateway مثبتة بالفعل، فإن `openclaw update` يحدّث بيانات الخدمة الوصفية
ويعيد تشغيلها ما لم تمرر `--no-restart`.

## بديل: أعد تشغيل المُثبّت

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

أضف `--no-onboard` لتخطي الإعداد الأولي. ولإجبار نوع تثبيت محدد عبر
المثبّت، مرّر `--install-method git --no-onboard` أو
`--install-method npm --no-onboard`.

## بديل: npm أو pnpm أو bun يدويًا

```bash
npm i -g openclaw@latest
```

عندما يدير `openclaw update` تثبيت npm عالميًا، فإنه يشغّل أولًا
أمر التثبيت العالمي العادي. وإذا فشل هذا الأمر، يعيد OpenClaw المحاولة مرة واحدة باستخدام
`--omit=optional`. تساعد إعادة المحاولة هذه على المضيفات التي لا تستطيع
تجميع التبعيات الأصلية الاختيارية، مع إبقاء الفشل الأصلي ظاهرًا إذا فشل البديل أيضًا.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### تثبيتات npm العالمية وتبعيات وقت التشغيل

يتعامل OpenClaw مع التثبيتات العالمية المعبأة على أنها للقراءة فقط في وقت التشغيل، حتى عندما يكون
دليل الحزمة العالمية قابلًا للكتابة بواسطة المستخدم الحالي. ويتم تجهيز تبعيات وقت التشغيل الخاصة بـ Plugin المضمنة
في دليل وقت تشغيل قابل للكتابة بدلًا من تعديل
شجرة الحزمة. وهذا يمنع `openclaw update` من التداخل مع gateway قيد التشغيل أو
وكيل محلي يقوم بإصلاح تبعيات Plugin أثناء التثبيت نفسه.

تقوم بعض إعدادات npm على Linux بتثبيت الحزم العالمية ضمن أدلة مملوكة للجذر مثل
`/usr/lib/node_modules/openclaw`. ويدعم OpenClaw هذا التخطيط عبر
المسار الخارجي نفسه للتجهيز.

بالنسبة إلى وحدات systemd المقوّاة، اضبط دليل تجهيز قابلًا للكتابة ومضمّنًا في
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

إذا لم يتم تعيين `OPENCLAW_PLUGIN_STAGE_DIR`، يستخدم OpenClaw القيمة `$STATE_DIRECTORY` عندما
توفرها systemd، ثم يعود إلى `~/.openclaw/plugin-runtime-deps`.
وتتعامل خطوة الإصلاح مع هذا التجهيز على أنه جذر حزمة محلي مملوك لـ OpenClaw وتقوم
بتجاهل إعدادات npm prefix/global الخاصة بالمستخدم، لذا لا يعيد إعداد npm الخاص بالتثبيت العالمي
توجيه تبعيات Plugin المضمنة إلى `~/node_modules` أو إلى شجرة الحزمة العالمية.

قبل تحديثات الحزم وإصلاحات تبعيات وقت التشغيل المضمنة، يحاول OpenClaw إجراء
فحص best-effort لمساحة القرص الخاصة بوحدة التخزين المستهدفة. ويؤدي انخفاض المساحة إلى تحذير
يتضمن المسار الذي تم فحصه، لكنه لا يمنع التحديث لأن حصص أنظمة الملفات،
واللقطات، ووحدات التخزين الشبكية قد تتغير بعد الفحص. وتبقى عمليات npm الفعلية
للتثبيت، والنسخ، والتحقق بعد التثبيت هي المرجع النهائي.

### تبعيات وقت التشغيل الخاصة بـ Plugin المضمنة

تحافظ التثبيتات المعبأة على تبعيات وقت التشغيل الخاصة بـ Plugin المضمنة خارج شجرة
الحزم للقراءة فقط. وعند بدء التشغيل وأثناء `openclaw doctor --fix`، يصلح OpenClaw
تبعيات وقت التشغيل فقط لتلك Plugins المضمنة النشطة في الإعداد، أو النشطة
عبر إعداد القناة القديم، أو المفعّلة بواسطة القيمة الافتراضية لبيانها المضمّن.
لا تؤدي حالة مصادقة القناة الثابتة وحدها إلى تشغيل إصلاح تبعيات وقت التشغيل
عند بدء تشغيل Gateway.

يفوز التعطيل الصريح. فلا يتم إصلاح تبعيات وقت التشغيل الخاصة بـ Plugin أو قناة معطّلة
لمجرد وجودها في الحزمة. أما Plugins الخارجية ومسارات التحميل المخصصة
فلا تزال تستخدم `openclaw plugins install` أو
`openclaw plugins update`.

## المحدّث التلقائي

يكون المحدّث التلقائي معطلًا افتراضيًا. فعّله في `~/.openclaw/openclaw.json`:

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

| القناة   | السلوك                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| `stable` | ينتظر `stableDelayHours`، ثم يطبّق مع jitter حتمي عبر `stableJitterHours` (طرح تدريجي موزع). |
| `beta`   | يتحقق كل `betaCheckIntervalHours` (الافتراضي: كل ساعة) ويطبّق فورًا.                                      |
| `dev`    | لا يوجد تطبيق تلقائي. استخدم `openclaw update` يدويًا.                                                     |

كما تسجل gateway أيضًا تلميح تحديث عند بدء التشغيل (يمكن تعطيله عبر `update.checkOnStart: false`).

## بعد التحديث

<Steps>

### شغّل doctor

```bash
openclaw doctor
```

يرحّل الإعداد، ويدقق سياسات DM، ويتحقق من سلامة gateway. التفاصيل: [Doctor](/ar/gateway/doctor)

### أعد تشغيل gateway

```bash
openclaw gateway restart
```

### تحقّق

```bash
openclaw health
```

</Steps>

## التراجع

### تثبيت إصدار محدد (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

نصيحة: يعرض `npm view openclaw version` الإصدار المنشور الحالي.

### تثبيت commit محدد (المصدر)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

للعودة إلى الأحدث: `git checkout main && git pull`.

## إذا كنت عالقًا

- شغّل `openclaw doctor` مرة أخرى واقرأ الخرج بعناية.
- بالنسبة إلى `openclaw update --channel dev` على source checkouts، يقوم المحدّث بتهيئة `pnpm` تلقائيًا عند الحاجة. وإذا رأيت خطأ في تهيئة pnpm/corepack، فثبّت `pnpm` يدويًا (أو أعد تفعيل `corepack`) ثم أعد تشغيل التحديث.
- راجع: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- اسأل في Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install) — جميع طرق التثبيت
- [Doctor](/ar/gateway/doctor) — فحوصات السلامة بعد التحديثات
- [الترحيل](/ar/install/migrating) — أدلة الترحيل بين الإصدارات الرئيسية
