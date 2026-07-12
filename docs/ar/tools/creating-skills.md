---
read_when:
    - أنت تنشئ مهارة مخصصة جديدة
    - تحتاج إلى سير عمل تمهيدي سريع للمهارات المستندة إلى SKILL.md
    - تريد استخدام ورشة Skills لاقتراح Skill لمراجعة الوكيل
sidebarTitle: Creating skills
summary: أنشئ Skills مخصّصة لمساحة العمل في `SKILL.md` لوكلاء OpenClaw لديك، واختبرها وانشرها.
title: إنشاء Skills
x-i18n:
    generated_at: "2026-07-12T06:33:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

تُعلِّم Skills الوكيل كيف ومتى يستخدم الأدوات. وكل Skill عبارة عن دليل
يحتوي على ملف `SKILL.md` يتضمن ترويسة YAML أمامية وتعليمات بصيغة Markdown.
يحمّل OpenClaw المهارات من عدة جذور وفق [ترتيب أسبقية](/ar/tools/skills#loading-order) محدد.

## أنشئ أول Skill لك

<Steps>
  <Step title="أنشئ دليل Skill">
    توجد Skills في مجلد `skills/` ضمن مساحة عملك:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    يمكنك تجميع Skills في مجلدات فرعية لتنظيمها، لكن تظل تسمية Skill
    محددة بواسطة الترويسة الأمامية في `SKILL.md`، وليس مسار المجلد:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # يظل اسم Skill هو "hello-world"، ويُستدعى باستخدام /hello-world
    ```

  </Step>

  <Step title="اكتب SKILL.md">
    تحدد الترويسة الأمامية البيانات الوصفية، بينما يزوّد النص الوكيل بالتعليمات.

    ```markdown
    ---
    name: hello-world
    description: مهارة بسيطة تطبع تحية.
    ---

    # مرحبًا بالعالم

    عندما يطلب المستخدم تحية، استخدم أداة `exec` لتشغيل:

    ```bash
    echo "مرحبًا من مهارتك المخصصة!"
    ```
    ```

    قواعد التسمية:
    - استخدم الأحرف اللاتينية الصغيرة والأرقام والواصلات في `name`.
    - حافظ على تطابق اسم الدليل مع قيمة `name` في الترويسة الأمامية.
    - تظهر قيمة `description` للوكيل وفي اكتشاف أوامر الشرطة المائلة؛
      اجعلها في سطر واحد وبأقل من 160 محرفًا.

  </Step>

  <Step title="تحقق من تحميل Skill">
    ```bash
    openclaw skills list
    ```

    يراقب OpenClaw افتراضيًا ملفات `SKILL.md` الموجودة ضمن جذور Skills. إذا كانت
    المراقبة معطلة أو كنت تتابع جلسة حالية، فابدأ جلسة جديدة
    لكي يتلقى الوكيل القائمة المحدّثة:

    ```bash
    # من الدردشة — أرشف الجلسة الحالية وابدأ جلسة جديدة
    /new

    # أو أعد تشغيل Gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="اختبرها">
    ```bash
    openclaw agent --message "قدّم لي تحية"
    ```

    أو افتح دردشة واطلب ذلك من الوكيل مباشرةً. استخدم `/skill hello-world`
    لاستدعائها صراحةً بالاسم.

  </Step>
</Steps>

## مرجع SKILL.md

### الحقول المطلوبة

| الحقل         | الوصف                                                             |
| ------------- | ----------------------------------------------------------------- |
| `name`        | معرّف فريد يستخدم الأحرف اللاتينية الصغيرة والأرقام والواصلات     |
| `description` | وصف من سطر واحد يظهر للوكيل وفي مخرجات الاكتشاف                    |

### مفاتيح الترويسة الأمامية الاختيارية

| الحقل                      | القيمة الافتراضية | الوصف                                                                          |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| `user-invocable`           | `true`            | إتاحة Skill كأمر شرطة مائلة للمستخدم                                           |
| `disable-model-invocation` | `false`           | استبعاد Skill من موجه نظام الوكيل (مع استمرار تشغيلها عبر `/skill`)            |
| `command-dispatch`         | —                 | اضبطه على `tool` لتوجيه أمر الشرطة المائلة مباشرةً إلى أداة متجاوزًا النموذج   |
| `command-tool`             | —                 | اسم الأداة المطلوب استدعاؤها عند ضبط `command-dispatch: tool`                  |
| `command-arg-mode`         | `raw`             | عند التوجيه إلى أداة، يمرر سلسلة الوسيطات الأولية إلى الأداة                   |
| `homepage`                 | —                 | عنوان URL يظهر باسم "Website" في واجهة Skills على macOS                        |

للاطلاع على حقول التقييد (`requires.bins` و`requires.env` وغيرها)، راجع
[Skills — التقييد](/ar/tools/skills#gating).

### استخدام `{baseDir}`

أشِر إلى الملفات داخل دليل Skill من دون ترميز المسارات بصورة ثابتة؛
يحل الوكيل `{baseDir}` بالاستناد إلى دليل Skill نفسها:

```markdown
شغّل البرنامج النصي المساعد الموجود في `{baseDir}/scripts/run.sh`.
```

## إضافة التفعيل المشروط

قيّد Skill بحيث لا تُحمّل إلا عند توفر تبعياتها:

```markdown
---
name: gemini-search
description: البحث باستخدام Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="خيارات التقييد">
    | المفتاح | الوصف |
    | --- | --- |
    | `requires.bins` | يجب أن توجد جميع الملفات التنفيذية على `PATH` |
    | `requires.anyBins` | يجب أن يوجد ملف تنفيذي واحد على الأقل على `PATH` |
    | `requires.env` | يجب أن يوجد كل متغير بيئة في العملية أو الإعدادات |
    | `requires.config` | يجب أن تكون قيمة كل مسار في `openclaw.json` صادقة |
    | `os` | مرشح المنصة: `["darwin"]` أو `["linux"]` أو `["win32"]` |
    | `always` | اضبطه على `true` لتجاوز جميع القيود وتضمين Skill دائمًا |

    المرجع الكامل: [Skills — التقييد](/ar/tools/skills#gating).

  </Accordion>
  <Accordion title="البيئة ومفاتيح API">
    اربط مفتاح API بإدخال Skill في `openclaw.json`:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    يُحقن المفتاح في العملية المضيفة لدورة الوكيل تلك فقط.
    ولا يصل إلى البيئة المعزولة؛ راجع
    [متغيرات البيئة المعزولة](/ar/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## الاقتراح عبر Skill Workshop

بالنسبة إلى Skills التي يصوغها الوكيل، أو عندما تريد مراجعة المشغّل قبل تشغيل
Skill فعليًا، استخدم اقتراحات [Skill Workshop](/ar/tools/skill-workshop) بدلًا من كتابة
`SKILL.md` مباشرةً.

```bash
# اقترح Skill جديدة كليًا
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "مهارة بسيطة تطبع تحية." \
  --proposal ./PROPOSAL.md

# اقترح تحديثًا لـ Skill موجودة
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "مهارة تحية محدّثة"
```

استخدم `--proposal-dir` عندما يتضمن الاقتراح ملفات دعم:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "مهارة بسيطة تطبع تحية." \
  --proposal-dir ./hello-world-proposal/
```

يجب أن يحتوي الدليل على `PROPOSAL.md` في جذره. وتوضع ملفات الدعم ضمن
`assets/` أو `examples/` أو `references/` أو `scripts/` أو `templates/`.

بعد المراجعة:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

راجع [Skill Workshop](/ar/tools/skill-workshop) للاطلاع على دورة حياة الاقتراح كاملةً.

## النشر إلى ClawHub

<Steps>
  <Step title="تأكد من اكتمال SKILL.md">
    تأكد من ضبط `name` و`description` وأي حقول تقييد ضمن `metadata.openclaw`.
    أضف عنوان URL في `homepage` إذا كانت لديك صفحة للمشروع.
  </Step>
  <Step title="ثبّت ClawHub CLI المستقل وسجّل الدخول">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="انشر">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    أضف `--version <version>` أو `--owner <owner>` لتجاوز الإصدار المستنتج
    أو النشر تحت مالك محدد. راجع
    [ClawHub — النشر](/ar/clawhub/publishing) و
    [ClawHub CLI](/ar/clawhub/cli) للاطلاع على سير العمل الكامل، ونطاق المالك، وأوامر
    الصيانة الأخرى (`clawhub sync` و`clawhub skill rename` وغيرهما).

  </Step>
</Steps>

## أفضل الممارسات

<Tip>
  - **كن موجزًا** — وجّه النموذج إلى *ما* ينبغي فعله، لا إلى كيفية التصرف كذكاء اصطناعي.
  - **السلامة أولًا** — إذا كانت Skill تستخدم `exec`، فتأكد من أن الموجهات لا تسمح
    بحقن أوامر عشوائية من مدخلات غير موثوقة.
  - **اختبر محليًا** — استخدم `openclaw agent --message "..."` قبل المشاركة.
  - **استخدم ClawHub** — تصفّح Skills المجتمع على [clawhub.ai](https://clawhub.ai)
    قبل البناء من الصفر.
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="مرجع Skills" href="/ar/tools/skills" icon="puzzle-piece">
    ترتيب التحميل والتقييد وقوائم السماح وتنسيق SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/ar/tools/skill-workshop" icon="flask">
    قائمة انتظار الاقتراحات لـ Skills التي يصوغها الوكيل.
  </Card>
  <Card title="إعدادات Skills" href="/ar/tools/skills-config" icon="gear">
    مخطط إعدادات `skills.*` الكامل.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    تصفّح Skills وانشرها في السجل العام.
  </Card>
  <Card title="بناء Plugins" href="/ar/plugins/building-plugins" icon="plug">
    يمكن أن تتضمن Plugins المهارات إلى جانب الأدوات التي توثّقها.
  </Card>
</CardGroup>
