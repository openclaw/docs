---
read_when:
    - أنت قادم من Hermes وتريد الاحتفاظ بإعدادات النموذج والمطالبات والذاكرة وSkills
    - تريد معرفة ما يستورده OpenClaw تلقائيًا وما يبقى للأرشفة فقط
    - تحتاج إلى مسار ترحيل نظيف ومكتوب كسكربت (CI، حاسوب محمول جديد، أتمتة)
summary: الانتقال من Hermes إلى OpenClaw باستخدام استيراد مُعايَن وقابل للتراجع
title: الترحيل من Hermes
x-i18n:
    generated_at: "2026-06-27T17:52:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw يستورد حالة Hermes عبر مزوّد ترحيل مضمّن. يعاين المزوّد كل شيء قبل تغيير الحالة، ويحجب الأسرار في الخطط والتقارير، وينشئ نسخة احتياطية متحقَّقًا منها قبل التطبيق.

<Note>
تتطلب عمليات الاستيراد إعداد OpenClaw جديدًا. إذا كانت لديك بالفعل حالة OpenClaw محلية، فأعد ضبط الإعدادات وبيانات الاعتماد والجلسات ومساحة العمل أولًا، أو استخدم `openclaw migrate` مباشرة مع `--overwrite` بعد مراجعة الخطة.
</Note>

## طريقتان للاستيراد

<Tabs>
  <Tab title="معالج الإعداد الأولي">
    هذا هو المسار الأسرع. يكتشف المعالج Hermes في `~/.hermes` ويعرض معاينة قبل التطبيق.

    ```bash
    openclaw onboard --flow import
    ```

    أو وجّهه إلى مصدر محدد:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    استخدم `openclaw migrate` للتشغيل عبر السكربتات أو للتشغيل القابل للتكرار. راجع [`openclaw migrate`](/ar/cli/migrate) للاطلاع على المرجع الكامل.

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    أضف `--from <path>` عندما يكون Hermes خارج `~/.hermes`.

  </Tab>
</Tabs>

## ما الذي يتم استيراده

<AccordionGroup>
  <Accordion title="إعدادات النموذج">
    - اختيار النموذج الافتراضي من ملف Hermes `config.yaml`.
    - مزوّدو النماذج المهيّؤون ونقاط النهاية المخصصة المتوافقة مع OpenAI من `providers` و`custom_providers`.

  </Accordion>
  <Accordion title="خوادم MCP">
    تعريفات خوادم MCP من `mcp_servers` أو `mcp.servers`.
  </Accordion>
  <Accordion title="ملفات مساحة العمل">
    - يتم نسخ `SOUL.md` و`AGENTS.md` إلى مساحة عمل وكيل OpenClaw.
    - يتم **إلحاق** `memories/MEMORY.md` و`memories/USER.md` بملفات ذاكرة OpenClaw المطابقة بدلًا من الكتابة فوقها.

  </Accordion>
  <Accordion title="إعدادات الذاكرة">
    إعدادات الذاكرة الافتراضية لذاكرة ملفات OpenClaw. يتم تسجيل مزوّدي الذاكرة الخارجيين مثل Honcho كعناصر أرشيف أو عناصر مراجعة يدوية كي تتمكن من نقلها بشكل مقصود.
  </Accordion>
  <Accordion title="Skills">
    يتم نسخ Skills التي تحتوي على ملف `SKILL.md` ضمن `skills/<name>/`، مع قيم الإعدادات الخاصة بكل Skill من `skills.config`.
  </Accordion>
  <Accordion title="بيانات اعتماد المصادقة">
    يسأل `openclaw migrate` التفاعلي قبل استيراد بيانات اعتماد المصادقة، مع تحديد نعم افتراضيًا. تشمل عمليات الاستيراد المقبولة بيانات اعتماد OpenCode OpenAI OAuth من ملف OpenCode `auth.json`، وإدخالات OpenCode وGitHub Copilot من ملف OpenCode `auth.json`، و[مفاتيح `.env` المدعومة](/ar/cli/migrate#supported-env-keys). إدخالات OAuth في ملف Hermes `auth.json` هي حالة قديمة وتظهر كعمل إعادة مصادقة/doctor يدوي بدلًا من استيرادها إلى المصادقة الحية. استخدم `--include-secrets` لاستيراد بيانات الاعتماد في `openclaw migrate` غير التفاعلي، أو `--no-auth-credentials` لتخطيها، أو `--import-secrets` في الإعداد الأولي عند الاستيراد من معالج الإعداد الأولي.
  </Accordion>
</AccordionGroup>

## ما الذي يبقى في الأرشيف فقط

ينسخ المزوّد هذه العناصر إلى دليل تقرير الترحيل للمراجعة اليدوية، لكنه **لا** يحمّلها إلى إعدادات OpenClaw الحية أو بيانات اعتماده:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

يرفض OpenClaw تنفيذ هذه الحالة أو الوثوق بها تلقائيًا لأن التنسيقات وافتراضات الثقة قد تتباعد بين الأنظمة. انقل ما تحتاجه يدويًا بعد مراجعة الأرشيف.

## المسار الموصى به

<Steps>
  <Step title="معاينة الخطة">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    تسرد الخطة كل ما سيتغير، بما في ذلك التعارضات والعناصر المتخطاة وأي عناصر حساسة. يحجب إخراج الخطة المفاتيح المتداخلة التي تبدو كأسرار.

  </Step>
  <Step title="التطبيق مع نسخة احتياطية">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    ينشئ OpenClaw نسخة احتياطية ويتحقق منها قبل التطبيق. يستورد هذا المثال غير التفاعلي حالة غير سرية. شغّله بدون `--yes` للإجابة عن مطالبة بيانات الاعتماد، أو أضف `--include-secrets` لتضمين بيانات الاعتماد المدعومة في التشغيل غير المراقب.

  </Step>
  <Step title="تشغيل doctor">
    ```bash
    openclaw doctor
    ```

    يعيد [Doctor](/ar/gateway/doctor) تطبيق أي عمليات ترحيل إعدادات معلّقة ويتحقق من المشكلات التي ظهرت أثناء الاستيراد.

  </Step>
  <Step title="إعادة التشغيل والتحقق">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    تأكد من أن Gateway سليم وأن النموذج والذاكرة وSkills المستوردة قد تم تحميلها.

  </Step>
</Steps>

## التعامل مع التعارضات

يرفض التطبيق المتابعة عندما تبلغ الخطة عن تعارضات (ملف أو قيمة إعداد موجودة بالفعل في الهدف).

<Warning>
أعد التشغيل باستخدام `--overwrite` فقط عندما يكون استبدال الهدف الحالي مقصودًا. قد يظل المزوّدون يكتبون نسخًا احتياطية على مستوى العناصر للملفات التي تمت الكتابة فوقها في دليل تقرير الترحيل.
</Warning>

في تثبيت OpenClaw جديد، تكون التعارضات غير معتادة. تظهر عادة عندما تعيد تشغيل الاستيراد على إعداد يحتوي بالفعل على تعديلات من المستخدم.

إذا ظهر تعارض أثناء التطبيق (على سبيل المثال، تسابق غير متوقع على ملف إعدادات)، يعلّم Hermes عناصر الإعدادات التابعة المتبقية بالحالة `skipped` مع السبب `blocked by earlier apply conflict` بدلًا من كتابتها جزئيًا. يسجل تقرير الترحيل كل عنصر محظور كي تتمكن من حل التعارض الأصلي وإعادة تشغيل الاستيراد.

## الأسرار

يسأل `openclaw migrate` التفاعلي عمّا إذا كنت تريد استيراد بيانات اعتماد المصادقة المكتشفة، مع تحديد نعم افتراضيًا.

- يؤدي قبول المطالبة إلى استيراد بيانات اعتماد OpenCode OpenAI OAuth من ملف OpenCode `auth.json`، وإدخالات OpenCode وGitHub Copilot من ملف OpenCode `auth.json`، و[مفاتيح `.env` المدعومة](/ar/cli/migrate#supported-env-keys). يتم الإبلاغ عن إدخالات OAuth في ملف Hermes `auth.json` لإعادة مصادقة OpenAI يدويًا أو لإصلاح doctor.
- استخدم `--no-auth-credentials` أو اختر لا عند المطالبة لاستيراد الحالة غير السرية فقط.
- استخدم `--include-secrets` عند التشغيل غير المراقب مع `--yes`.
- استخدم `--import-secrets` في الإعداد الأولي عند استيراد بيانات الاعتماد من معالج الإعداد الأولي.
- بالنسبة إلى بيانات الاعتماد المُدارة عبر SecretRef، هيّئ مصدر SecretRef بعد اكتمال الاستيراد.

## إخراج JSON للأتمتة

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

مع `--json` وبدون `--yes`، يطبع التطبيق الخطة ولا يغيّر الحالة. هذا هو الوضع الأكثر أمانًا لـ CI والسكربتات المشتركة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="يرفض التطبيق بسبب التعارضات">
    افحص إخراج الخطة. يحدد كل تعارض مسار المصدر والهدف الموجود. قرر لكل عنصر ما إذا كنت ستتخطاه، أو تعدّل الهدف، أو تعيد التشغيل باستخدام `--overwrite`.
  </Accordion>
  <Accordion title="Hermes موجود خارج ~/.hermes">
    مرّر `--from /actual/path` (CLI) أو `--import-source /actual/path` (الإعداد الأولي).
  </Accordion>
  <Accordion title="يرفض الإعداد الأولي الاستيراد على إعداد موجود">
    تتطلب عمليات الاستيراد عبر الإعداد الأولي إعدادًا جديدًا. إما أن تعيد ضبط الحالة وتعيد الإعداد الأولي، أو تستخدم `openclaw migrate apply hermes` مباشرة، وهو يدعم `--overwrite` والتحكم الصريح في النسخ الاحتياطي.
  </Accordion>
  <Accordion title="لم يتم استيراد مفاتيح API">
    يستورد `openclaw migrate` التفاعلي مفاتيح API فقط عندما تقبل مطالبة بيانات الاعتماد. تتطلب عمليات التشغيل غير التفاعلية باستخدام `--yes` الخيار `--include-secrets`؛ وتتطلب عمليات الاستيراد عبر الإعداد الأولي الخيار `--import-secrets`. يتم التعرف فقط على [مفاتيح `.env` المدعومة](/ar/cli/migrate#supported-env-keys)؛ ويتم تجاهل المتغيرات الأخرى في `.env`.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [`openclaw migrate`](/ar/cli/migrate): مرجع CLI الكامل، وعقد Plugin، وأشكال JSON.
- [الإعداد الأولي](/ar/cli/onboard): تدفق المعالج والخيارات غير التفاعلية.
- [الترحيل](/ar/install/migrating): نقل تثبيت OpenClaw بين الأجهزة.
- [Doctor](/ar/gateway/doctor): فحص السلامة بعد الترحيل.
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace): مكان وجود `SOUL.md` و`AGENTS.md` وملفات الذاكرة.
