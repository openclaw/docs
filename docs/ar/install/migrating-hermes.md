---
read_when:
    - أنت تنتقل من Hermes وتريد الاحتفاظ بإعدادات النموذج والموجّهات والذاكرة وSkills
    - تريد معرفة ما يستورده OpenClaw تلقائيًا وما يظل محفوظًا في الأرشيف فقط
    - تحتاج إلى مسار ترحيل نظيف ومؤتمت بالبرامج النصية (التكامل المستمر، حاسوب محمول جديد، الأتمتة)
summary: انتقل من Hermes إلى OpenClaw عبر استيراد قابل للمعاينة والتراجع عنه
title: الانتقال من Hermes
x-i18n:
    generated_at: "2026-07-12T06:00:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

يكتشف موفّر ترحيل Hermes المضمّن الحالة في `~/.hermes`، ويعاين كل تغيير قبل تطبيقه، ويحجب الأسرار في الخطط والتقارير، وينشئ نسخة احتياطية متحقَّقًا منها لـ OpenClaw قبل أن يلمس أي شيء.

<Note>
تتطلب عمليات الاستيراد إعداد OpenClaw جديدًا. إذا كانت لديك بالفعل حالة OpenClaw محلية، فأعد تعيين الإعدادات وبيانات الاعتماد والجلسات ومساحة العمل أولًا، أو استخدم `openclaw migrate apply hermes` مباشرةً مع `--overwrite` بعد مراجعة الخطة.
</Note>

## طريقتان للاستيراد

<Tabs>
  <Tab title="معالج الإعداد الأولي">
    يكتشف Hermes في `~/.hermes` ويعرض معاينة قبل التطبيق.

    ```bash
    openclaw onboard --flow import
    ```

    أو حدّد مصدرًا بعينه:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    استخدم `openclaw migrate` لعمليات التشغيل البرمجية أو القابلة للتكرار. راجع [`openclaw migrate`](/ar/cli/migrate) للاطلاع على المرجع الكامل.

    ```bash
    openclaw migrate hermes --dry-run    # معاينة فقط
    openclaw migrate apply hermes --yes  # التطبيق مع تخطي التأكيد
    ```

    أضف `--from <path>` عندما يوجد Hermes خارج `~/.hermes`.

  </Tab>
</Tabs>

## ما يتم استيراده

<AccordionGroup>
  <Accordion title="إعدادات النموذج">
    - اختيار النموذج الافتراضي من ملف Hermes ‏`config.yaml`.
    - موفّرو النماذج المضبوطون ونقاط النهاية المخصصة المتوافقة مع OpenAI من `providers` و`custom_providers`.

  </Accordion>
  <Accordion title="خوادم MCP">
    تعريفات خوادم MCP من `mcp_servers` أو `mcp.servers`.
  </Accordion>
  <Accordion title="ملفات مساحة العمل">
    - يُنسخ `SOUL.md` و`AGENTS.md` إلى مساحة عمل وكيل OpenClaw.
    - تُلحق محتويات `memories/MEMORY.md` و`memories/USER.md` **بنهاية** ملفات ذاكرة OpenClaw المطابقة بدلًا من الكتابة فوقها.

  </Accordion>
  <Accordion title="إعدادات الذاكرة">
    إعدادات الذاكرة الافتراضية لذاكرة ملفات OpenClaw. تُسجَّل موفّرات الذاكرة الخارجية مثل Honcho كعناصر أرشيف أو مراجعة يدوية كي تتمكن من نقلها بصورة متعمدة.
  </Accordion>
  <Accordion title="Skills">
    تُنسخ Skills التي تحتوي على ملف `SKILL.md` ضمن `skills/<name>/`، إلى جانب قيم الإعداد الخاصة بكل Skill من `skills.config`.
  </Accordion>
  <Accordion title="بيانات اعتماد المصادقة">
    يطلب `openclaw migrate` التفاعلي التأكيد قبل استيراد بيانات اعتماد المصادقة، مع تحديد نعم افتراضيًا. تؤدي الموافقة إلى استيراد إدخالات OpenCode OpenAI OAuth وGitHub Copilot من ملف `auth.json` الخاص بـ OpenCode، بالإضافة إلى [مفاتيح `.env` المدعومة في Hermes](/ar/cli/migrate#supported-env-keys). أما إدخالات OAuth في ملف `auth.json` الخاص بـ Hermes فهي حالة قديمة: تظهر كعنصر لإعادة المصادقة أو الإصلاح يدويًا بواسطة doctor بدلًا من استيرادها إلى المصادقة النشطة. استخدم `--include-secrets` لاستيراد بيانات الاعتماد في تشغيل غير تفاعلي، أو `--no-auth-credentials` لتخطي استيراد بيانات الاعتماد بالكامل، أو علامة معالج الإعداد الأولي `--import-secrets`.
  </Accordion>
</AccordionGroup>

## ما يظل في الأرشيف فقط

ينسخ الموفّر العناصر التالية إلى دليل تقرير الترحيل للمراجعة اليدوية، لكنه **لا** يحمّلها في إعدادات OpenClaw النشطة أو بيانات اعتمادها:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

يرفض OpenClaw تنفيذ هذه الحالة أو الوثوق بها تلقائيًا لأن التنسيقات وافتراضات الثقة قد تتباين بين الأنظمة. انقل ما تحتاج إليه يدويًا بعد مراجعة الأرشيف.

## المسار الموصى به

<Steps>
  <Step title="معاينة الخطة">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    تسرد الخطة كل ما سيتغير، بما في ذلك التعارضات والعناصر المتخطاة والعناصر الحساسة. تُحجب المفاتيح المتداخلة التي تبدو كأسرار في المخرجات.

  </Step>
  <Step title="التطبيق مع نسخة احتياطية">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    ينشئ OpenClaw نسخة احتياطية ويتحقق منها قبل التطبيق. يستورد هذا المثال غير التفاعلي الحالة غير السرية فقط. شغّله دون `--yes` للإجابة عن مطالبة بيانات الاعتماد تفاعليًا، أو أضف `--include-secrets` لتضمين بيانات الاعتماد المدعومة في تشغيل غير مراقَب.

  </Step>
  <Step title="تشغيل doctor">
    ```bash
    openclaw doctor
    ```

    يعيد [doctor](/ar/gateway/doctor) تطبيق أي عمليات ترحيل معلّقة للإعدادات ويتحقق من المشكلات التي نشأت أثناء الاستيراد.

  </Step>
  <Step title="إعادة التشغيل والتحقق">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    تأكد من سلامة Gateway وتحميل النموذج والذاكرة وSkills المستوردة.

  </Step>
</Steps>

## معالجة التعارضات

يرفض التطبيق المتابعة عندما تُبلغ الخطة عن تعارضات، أي عندما يكون ملف أو قيمة إعداد موجودًا بالفعل في الوجهة.

<Warning>
أعد التشغيل باستخدام `--overwrite` فقط عندما يكون استبدال الوجهة الحالية مقصودًا. وقد تظل الموفّرات تنشئ نسخًا احتياطية على مستوى العناصر للملفات التي كُتب فوقها في دليل تقرير الترحيل.
</Warning>

التعارضات غير معتادة في التثبيت الجديد. وتظهر عادةً عند إعادة تشغيل الاستيراد على إعداد يتضمن تعديلات أجراها المستخدم بالفعل.

إذا ظهر تعارض في منتصف التطبيق، مثل حدوث حالة تسابق غير متوقعة على ملف إعدادات، يضع Hermes علامة `skipped` على عناصر الإعداد التابعة المتبقية مع السبب `blocked by earlier apply conflict` بدلًا من كتابتها جزئيًا. يسجّل تقرير الترحيل كل عنصر محظور كي تتمكن من حل التعارض الأصلي وإعادة تشغيل الاستيراد.

## الأسرار

يسأل `openclaw migrate` التفاعلي عمّا إذا كنت تريد استيراد بيانات اعتماد المصادقة المكتشفة، مع تحديد نعم افتراضيًا.

- تؤدي الموافقة إلى استيراد إدخالات OpenCode OpenAI OAuth وGitHub Copilot من ملف `auth.json` الخاص بـ OpenCode، بالإضافة إلى [مفاتيح `.env` المدعومة](/ar/cli/migrate#supported-env-keys). أما إدخالات OAuth في ملف `auth.json` الخاص بـ Hermes فيُبلّغ عنها لإعادة مصادقة OpenAI يدويًا أو لإصلاحها بواسطة doctor بدلًا من ذلك.
- استخدم `--no-auth-credentials`، أو أجب بلا عند المطالبة، لاستيراد الحالة غير السرية فقط.
- استخدم `--include-secrets` لاستيراد بيانات الاعتماد في تشغيل `--yes` غير مراقَب.
- استخدم علامة معالج الإعداد الأولي `--import-secrets` لاستيراد بيانات الاعتماد من المعالج.

## مخرجات JSON للأتمتة

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

عند استخدام `--json` دون `--yes`، يطبع التطبيق الخطة ولا يغيّر الحالة، وهو الوضع الأكثر أمانًا لـ CI والبرامج النصية المشتركة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="التطبيق يرفض المتابعة بسبب التعارضات">
    افحص مخرجات الخطة. يحدد كل تعارض مسار المصدر والوجهة الحالية. قرر لكل عنصر ما إذا كنت ستتخطاه، أو تعدّل الوجهة، أو تعيد التشغيل باستخدام `--overwrite`.
  </Accordion>
  <Accordion title="يوجد Hermes خارج ~/.hermes">
    مرّر `--from /actual/path` ‏(CLI) أو `--import-source /actual/path` ‏(الإعداد الأولي).
  </Accordion>
  <Accordion title="الإعداد الأولي يرفض الاستيراد إلى إعداد موجود">
    تتطلب عمليات الاستيراد عبر الإعداد الأولي إعدادًا جديدًا. إما أن تعيد تعيين الحالة وتبدأ الإعداد الأولي مجددًا، أو تستخدم `openclaw migrate apply hermes` مباشرةً، فهو يدعم `--overwrite` والتحكم الصريح في النسخ الاحتياطي.
  </Accordion>
  <Accordion title="لم تُستورد مفاتيح API">
    لا يستورد `openclaw migrate` التفاعلي مفاتيح API إلا عند قبول مطالبة بيانات الاعتماد. تحتاج عمليات التشغيل غير التفاعلية باستخدام `--yes` إلى `--include-secrets`، وتحتاج عمليات الاستيراد عبر الإعداد الأولي إلى `--import-secrets`. لا يُتعرّف إلا على [مفاتيح `.env` المدعومة](/ar/cli/migrate#supported-env-keys)، بينما تُتجاهل متغيرات `.env` الأخرى.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [`openclaw migrate`](/ar/cli/migrate): المرجع الكامل لـ CLI، وعقد Plugin، وبُنى JSON.
- [الإعداد الأولي](/ar/cli/onboard): مسار المعالج وعلامات التشغيل غير التفاعلي.
- [الترحيل](/ar/install/migrating): نقل تثبيت OpenClaw بين الأجهزة.
- [Doctor](/ar/gateway/doctor): فحص السلامة بعد الترحيل.
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace): موضع ملفات `SOUL.md` و`AGENTS.md` وملفات الذاكرة.
