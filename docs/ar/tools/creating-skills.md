---
read_when:
    - أنت تنشئ مهارة مخصصة جديدة
    - تحتاج إلى سير عمل سريع للبدء مع Skills المستندة إلى SKILL.md
    - تريد استخدام Skill Workshop لاقتراح skill لمراجعة الوكيل
sidebarTitle: Creating skills
summary: أنشئ واختبر وانشر Skills مخصصة لمساحة العمل عبر SKILL.md لوكلاء OpenClaw لديك.
title: إنشاء Skills
x-i18n:
    generated_at: "2026-06-27T18:39:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

تعلّم Skills الوكيل كيف ومتى يستخدم الأدوات. كل skill هو دليل
يحتوي على ملف `SKILL.md` يتضمن YAML frontmatter وتعليمات markdown.
يحمّل OpenClaw المهارات من عدة جذور وفق [ترتيب أسبقية](/ar/tools/skills#loading-order) محدد.

## أنشئ أول skill لك

<Steps>
  <Step title="أنشئ دليل skill">
    توجد Skills في مجلد `skills/` داخل مساحة عملك. أنشئ دليلاً
    للـ skill الجديدة:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    يمكنك تجميع skills في مجلدات فرعية للتنظيم — ستظل الـ skill
    مسماة بحسب frontmatter في `SKILL.md`، وليس مسار المجلد:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="اكتب SKILL.md">
    أنشئ `SKILL.md` داخل الدليل. يعرّف frontmatter البيانات الوصفية؛
    ويعطي المتن التعليمات للوكيل.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    قواعد التسمية:
    - استخدم أحرفًا صغيرة وأرقامًا وواصلات في `name`.
    - أبقِ اسم الدليل وقيمة `name` في frontmatter متطابقين.
    - يظهر `description` للوكيل وفي اكتشاف أوامر الشرطة المائلة —
      اجعله في سطر واحد وبأقل من 160 حرفًا.

  </Step>

  <Step title="تحقق من تحميل skill">
    ```bash
    openclaw skills list
    ```

    يراقب OpenClaw ملفات `SKILL.md` ضمن جذور skills افتراضيًا. إذا كان
    المراقب معطلاً أو كنت تتابع جلسة موجودة، فابدأ جلسة جديدة
    حتى يتلقى الوكيل القائمة المحدّثة:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="اختبرها">
    أرسل رسالة يفترض أن تشغّل الـ skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    أو افتح محادثة واسأل الوكيل مباشرة. استخدم `/skill hello-world`
    لاستدعائها صراحةً بالاسم.

  </Step>
</Steps>

## مرجع SKILL.md

### الحقول المطلوبة

| الحقل         | الوصف                                                     |
| ------------- | --------------------------------------------------------------- |
| `name`        | معرّف فريد يستخدم أحرفًا صغيرة وأرقامًا وواصلات        |
| `description` | وصف من سطر واحد يظهر للوكيل وفي مخرجات الاكتشاف |

### مفاتيح frontmatter الاختيارية

| الحقل                      | الافتراضي | الوصف                                                                      |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | إظهار الـ skill كأمر شرطة مائلة للمستخدم                                         |
| `disable-model-invocation` | `false` | إبقاء الـ skill خارج موجّه نظام الوكيل (وتظل تعمل عبر `/skill`)        |
| `command-dispatch`         | —       | اضبطها على `tool` لتوجيه أمر الشرطة المائلة مباشرة إلى أداة، متجاوزًا النموذج |
| `command-tool`             | —       | اسم الأداة المراد استدعاؤها عند ضبط `command-dispatch: tool`                         |
| `command-arg-mode`         | `raw`   | في توجيه الأدوات، يمرّر سلسلة الوسيطات الخام إلى الأداة                      |
| `homepage`                 | —       | عنوان URL يظهر باسم "موقع الويب" في واجهة Skills على macOS                                    |

لحقول التقييد (`requires.bins` و`requires.env` وغيرها) راجع
[Skills — التقييد](/ar/tools/skills#gating).

### استخدام `{baseDir}`

استخدم `{baseDir}` في متن الـ skill للإشارة إلى ملفات داخل دليل الـ skill
دون ترميز المسارات بشكل ثابت:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## إضافة تفعيل شرطي

قيّد الـ skill بحيث لا تُحمّل إلا عند توفر اعتمادياتها:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="خيارات التقييد">
    | المفتاح | الوصف |
    | --- | --- |
    | `requires.bins` | يجب أن توجد كل الملفات التنفيذية على `PATH` |
    | `requires.anyBins` | يجب أن يوجد ملف تنفيذي واحد على الأقل على `PATH` |
    | `requires.env` | يجب أن يوجد كل متغير env في العملية أو الإعدادات |
    | `requires.config` | يجب أن يكون كل مسار `openclaw.json` ذا قيمة صادقة |
    | `os` | مرشح المنصة: `["darwin"]`، `["linux"]`، `["win32"]` |
    | `always` | اضبطها على `true` لتجاوز كل القيود وتضمين الـ skill دائمًا |

    المرجع الكامل: [Skills — التقييد](/ar/tools/skills#gating).

  </Accordion>
  <Accordion title="البيئة ومفاتيح API">
    اربط مفتاح API بإدخال skill في `openclaw.json`:

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

    يُحقن المفتاح في عملية المضيف لدورة الوكيل تلك فقط.
    ولا يصل إلى sandbox — راجع
    [متغيرات env في sandbox](/ar/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## الاقتراح عبر Skill Workshop

بالنسبة إلى skills التي يصوغها الوكيل أو عندما تريد مراجعة المشغّل قبل أن تصبح skill
نشطة، استخدم مقترحات [Skill Workshop](/ar/tools/skill-workshop) بدلاً من كتابة
`SKILL.md` مباشرة.

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

استخدم `--proposal-dir` عندما يتضمن المقترح ملفات دعم:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

يجب أن يحتوي الدليل على `PROPOSAL.md`. يمكن وضع ملفات الدعم في `assets/`،
أو `examples/`، أو `references/`، أو `scripts/`، أو `templates/`.

بعد المراجعة:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

راجع [Skill Workshop](/ar/tools/skill-workshop) لدورة حياة المقترح الكاملة.

## النشر إلى ClawHub

<Steps>
  <Step title="تأكد من اكتمال SKILL.md">
    تأكد من ضبط `name` و`description` وأي حقول تقييد ضمن `metadata.openclaw`.
    أضف عنوان URL في `homepage` إذا كانت لديك صفحة مشروع.
  </Step>
  <Step title="ثبّت skill الخاصة بـ ClawHub">
    توثّق skill الخاصة بـ ClawHub شكل أمر النشر الحالي والبيانات الوصفية
    المطلوبة:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="انشر">
    ```bash
    clawhub publish
    ```

    راجع [ClawHub — النشر](/ar/clawhub/publishing) للاطلاع على التدفق الكامل.

  </Step>
</Steps>

## أفضل الممارسات

<Tip>
  - **كن موجزًا** — أرشد النموذج إلى *ما* يجب فعله، لا إلى كيفية كونه ذكاءً اصطناعيًا.
  - **السلامة أولاً** — إذا كانت skill تستخدم `exec`، فتأكد من أن المطالبات لا تسمح
    بحقن أوامر عشوائية من مدخلات غير موثوقة.
  - **اختبر محليًا** — استخدم `openclaw agent --message "..."` قبل المشاركة.
  - **استخدم ClawHub** — تصفح skills المجتمع على [clawhub.ai](https://clawhub.ai)
    قبل البناء من الصفر.
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="مرجع Skills" href="/ar/tools/skills" icon="puzzle-piece">
    ترتيب التحميل، والتقييد، وقوائم السماح، وتنسيق SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/ar/tools/skill-workshop" icon="flask">
    طابور مقترحات skills التي يصوغها الوكيل.
  </Card>
  <Card title="إعدادات Skills" href="/ar/tools/skills-config" icon="gear">
    مخطط إعدادات `skills.*` الكامل.
  </Card>
  <Card title="ClawHub" href="/ar/clawhub" icon="cloud">
    تصفح skills وانشرها في السجل العام.
  </Card>
  <Card title="بناء plugins" href="/ar/plugins/building-plugins" icon="plug">
    يمكن أن تشحن plugins مهارات إلى جانب الأدوات التي توثقها.
  </Card>
</CardGroup>
