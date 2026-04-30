---
read_when:
    - تحديث OpenClaw
    - يتعطل شيء ما بعد تحديث
summary: تحديث OpenClaw بأمان (التثبيت العام أو من المصدر)، بالإضافة إلى استراتيجية التراجع
title: التحديث
x-i18n:
    generated_at: "2026-04-30T08:09:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

حافظ على OpenClaw محدثًا.

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

يفضّل `--channel beta` قناة beta، لكن وقت التشغيل يعود إلى stable/latest عندما
تكون وسم beta غير موجودة أو أقدم من أحدث إصدار مستقر. استخدم `--tag beta`
إذا كنت تريد وسم توزيع npm beta الخام لتحديث حزمة لمرة واحدة.

راجع [قنوات التطوير](/ar/install/development-channels) لمعرفة دلالات القنوات.

## التبديل بين تثبيتات npm و git

استخدم القنوات عندما تريد تغيير نوع التثبيت. يحافظ المحدّث على
الحالة، والإعدادات، وبيانات الاعتماد، ومساحة العمل في `~/.openclaw`؛ ولا يغيّر إلا
تثبيت شيفرة OpenClaw الذي يستخدمه CLI وGateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

شغّل مع `--dry-run` أولًا لمعاينة تبديل وضع التثبيت بالضبط:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

تضمن قناة `dev` وجود نسخة git checkout، وتبنيها، وتثبّت CLI العام
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
المثبّت. لا يستدعي المثبّت المحدّث القديم؛ بل يشغّل تثبيت الحزمة العامة
مباشرةً ويمكنه استرداد تثبيت npm محدّث جزئيًا.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

لتثبيت الاسترداد على إصدار محدد أو وسم توزيع محدد، أضف `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## بديل: npm أو pnpm أو bun يدويًا

```bash
npm i -g openclaw@latest
```

عندما يدير `openclaw update` تثبيت npm عامًا، فإنه يثبّت الهدف أولًا داخل
بادئة npm مؤقتة، ويتحقق من مخزون `dist` المضمّن في الحزمة، ثم يستبدل
شجرة الحزمة النظيفة داخل البادئة العامة الحقيقية. يتجنب ذلك قيام npm بوضع
حزمة جديدة فوق ملفات قديمة متبقية من الحزمة السابقة. إذا فشل أمر التثبيت،
يعيد OpenClaw المحاولة مرة واحدة مع `--omit=optional`. تساعد إعادة المحاولة هذه المضيفات التي لا تستطيع فيها
التبعيات الاختيارية الأصلية التحويل البرمجي، مع إبقاء الفشل الأصلي ظاهرًا
إذا فشل خيار الرجوع أيضًا.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### موضوعات متقدمة لتثبيت npm

<AccordionGroup>
  <Accordion title="شجرة حزم للقراءة فقط">
    يتعامل OpenClaw مع التثبيتات العامة المعبأة كأنها للقراءة فقط أثناء التشغيل، حتى عندما يكون دليل الحزمة العام قابلًا للكتابة بواسطة المستخدم الحالي. تُحضّر تبعيات وقت تشغيل Plugins المضمّنة داخل دليل وقت تشغيل قابل للكتابة بدلًا من تعديل شجرة الحزم. يمنع ذلك `openclaw update` من التسابق مع Gateway قيد التشغيل أو وكيل محلي يصلح تبعيات Plugins أثناء التثبيت نفسه.

    تثبّت بعض إعدادات npm على Linux الحزم العامة تحت أدلة مملوكة للجذر مثل `/usr/lib/node_modules/openclaw`. يدعم OpenClaw هذا التخطيط عبر مسار التحضير الخارجي نفسه.

  </Accordion>
  <Accordion title="وحدات systemd معززة">
    عيّن دليل تحضير قابلًا للكتابة ومضمّنًا في `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    يقبل `OPENCLAW_PLUGIN_STAGE_DIR` أيضًا قائمة مسارات. يحل OpenClaw تبعيات وقت تشغيل Plugins المضمّنة من اليسار إلى اليمين عبر الجذور المدرجة، ويتعامل مع الجذور السابقة كطبقات مثبتة مسبقًا للقراءة فقط، ولا يثبّت أو يصلح إلا داخل الجذر النهائي القابل للكتابة:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    إذا لم يتم تعيين `OPENCLAW_PLUGIN_STAGE_DIR`، يستخدم OpenClaw `$STATE_DIRECTORY` عندما يوفّره systemd، ثم يعود إلى `~/.openclaw/plugin-runtime-deps`. تتعامل خطوة الإصلاح مع ذلك التحضير كجذر حزم محلي مملوك لـ OpenClaw وتتجاهل بادئة npm الخاصة بالمستخدم والإعدادات العامة، لذلك لا تعيد إعدادات npm الخاصة بالتثبيت العام توجيه تبعيات Plugins المضمّنة إلى `~/node_modules` أو شجرة الحزمة العامة.

  </Accordion>
  <Accordion title="فحص مسبق لمساحة القرص">
    قبل تحديثات الحزم وإصلاحات تبعيات وقت التشغيل المضمّنة، يحاول OpenClaw إجراء فحص مساحة قرص بأفضل جهد للمجلد الهدف. تؤدي المساحة المنخفضة إلى تحذير يتضمن المسار الذي تم فحصه، لكنها لا تمنع التحديث لأن حصص أنظمة الملفات، واللقطات، ووحدات التخزين الشبكية يمكن أن تتغير بعد الفحص. يظل تثبيت npm الفعلي، والنسخ، والتحقق بعد التثبيت هي المرجع النهائي.
  </Accordion>
  <Accordion title="تبعيات وقت تشغيل Plugins المضمّنة">
    تُبقي التثبيتات المعبأة تبعيات وقت تشغيل Plugins المضمّنة خارج شجرة الحزمة للقراءة فقط. عند بدء التشغيل وأثناء `openclaw doctor --fix`، يصلح OpenClaw تبعيات وقت التشغيل فقط لـ Plugins المضمّنة النشطة في الإعدادات، أو النشطة عبر إعدادات القنوات القديمة، أو المفعّلة افتراضيًا بواسطة ملف manifest المضمّن الخاص بها. لا تؤدي حالة مصادقة القناة المحفوظة وحدها إلى تشغيل إصلاح تبعيات وقت التشغيل عند بدء Gateway.

    التعطيل الصريح له الأولوية. لا يحصل Plugin أو قناة معطّلة على إصلاح لتبعيات وقت التشغيل الخاصة بها لمجرد وجودها في الحزمة. لا تزال Plugins الخارجية ومسارات التحميل المخصصة تستخدم `openclaw plugins install` أو `openclaw plugins update`.

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
| `stable` | ينتظر `stableDelayHours`، ثم يطبّق مع تذبذب حتمي عبر `stableJitterHours` (طرح موزّع). |
| `beta`   | يتحقق كل `betaCheckIntervalHours` (الافتراضي: كل ساعة) ويطبّق فورًا.                              |
| `dev`    | لا يوجد تطبيق تلقائي. استخدم `openclaw update` يدويًا.                                                           |

يسجّل Gateway أيضًا تلميح تحديث عند بدء التشغيل (عطّله باستخدام `update.checkOnStart: false`).
لخفض الإصدار أو الاسترداد من حادثة، عيّن `OPENCLAW_NO_AUTO_UPDATE=1` في بيئة Gateway لمنع التطبيقات التلقائية حتى عند ضبط `update.auto.enabled`. يمكن أن تظل تلميحات التحديث عند بدء التشغيل تعمل ما لم يتم تعطيل `update.checkOnStart` أيضًا.

## بعد التحديث

<Steps>

### شغّل doctor

```bash
openclaw doctor
```

يرحّل الإعدادات، ويدقق سياسات الرسائل المباشرة، ويتحقق من صحة Gateway. التفاصيل: [Doctor](/ar/gateway/doctor)

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
- بالنسبة إلى `openclaw update --channel dev` على نسخ المصدر checkout، يجهّز المحدّث `pnpm` تلقائيًا عند الحاجة. إذا رأيت خطأ تجهيز pnpm/corepack، فثبّت `pnpm` يدويًا (أو أعد تفعيل `corepack`) وأعد تشغيل التحديث.
- تحقق من: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- اسأل في Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install): جميع طرق التثبيت.
- [Doctor](/ar/gateway/doctor): فحوصات الصحة بعد التحديثات.
- [الترحيل](/ar/install/migrating): أدلة ترحيل الإصدارات الرئيسية.
