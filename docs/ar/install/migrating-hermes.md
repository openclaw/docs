---
read_when:
    - تنتقل من Hermes وتريد الاحتفاظ بتكوين النموذج والموجّهات والذاكرة وSkills الخاصة بك
    - تريد معرفة ما يستورده OpenClaw تلقائيًا وما يبقى مقتصرًا على الأرشيف
    - تحتاج إلى مسار ترحيل نظيف ومُدار عبر سكربتات (CI، حاسوب محمول جديد، أتمتة)
summary: انتقل من Hermes إلى OpenClaw باستخدام استيراد يمكن معاينته والتراجع عنه
title: الترحيل من Hermes
x-i18n:
    generated_at: "2026-04-30T08:08:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

تستورد OpenClaw حالة Hermes عبر مزوّد ترحيل مضمّن. يعاين المزوّد كل شيء قبل تغيير الحالة، وينقّح الأسرار في الخطط والتقارير، وينشئ نسخة احتياطية متحقَّقًا منها قبل التطبيق.

<Note>
تتطلب عمليات الاستيراد إعداد OpenClaw جديدًا. إذا كانت لديك حالة OpenClaw محلية بالفعل، فأعد ضبط الإعدادات وبيانات الاعتماد والجلسات ومساحة العمل أولًا، أو استخدم `openclaw migrate` مباشرةً مع `--overwrite` بعد مراجعة الخطة.
</Note>

## طريقتان للاستيراد

<Tabs>
  <Tab title="معالج الإعداد الأولي">
    المسار الأسرع. يكتشف المعالج Hermes في `~/.hermes` ويعرض معاينة قبل التطبيق.

    ```bash
    openclaw onboard --flow import
    ```

    أو وجّهه إلى مصدر محدد:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    استخدم `openclaw migrate` للتشغيلات النصية أو القابلة للتكرار. راجع [`openclaw migrate`](/ar/cli/migrate) للمرجع الكامل.

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    أضف `--from <path>` عندما يكون Hermes خارج `~/.hermes`.

  </Tab>
</Tabs>

## ما يتم استيراده

<AccordionGroup>
  <Accordion title="إعداد النموذج">
    - اختيار النموذج الافتراضي من `config.yaml` في Hermes.
    - مزوّدو النماذج المكوّنون ونقاط النهاية المخصصة المتوافقة مع OpenAI من `providers` و`custom_providers`.

  </Accordion>
  <Accordion title="خوادم MCP">
    تعريفات خوادم MCP من `mcp_servers` أو `mcp.servers`.
  </Accordion>
  <Accordion title="ملفات مساحة العمل">
    - يتم نسخ `SOUL.md` و`AGENTS.md` إلى مساحة عمل وكيل OpenClaw.
    - يتم **إلحاق** `memories/MEMORY.md` و`memories/USER.md` بملفات ذاكرة OpenClaw المطابقة بدلًا من استبدالها.

  </Accordion>
  <Accordion title="إعداد الذاكرة">
    الإعدادات الافتراضية لتكوين الذاكرة لذاكرة ملفات OpenClaw. يتم تسجيل مزوّدي الذاكرة الخارجيين مثل Honcho كعناصر أرشيف أو مراجعة يدوية حتى تتمكن من نقلها بعناية.
  </Accordion>
  <Accordion title="Skills">
    يتم نسخ Skills التي تحتوي على ملف `SKILL.md` ضمن `skills/<name>/`، مع قيم الإعداد لكل Skill من `skills.config`.
  </Accordion>
  <Accordion title="مفاتيح API (اختياري)">
    عيّن `--include-secrets` لاستيراد مفاتيح `.env` المدعومة: `OPENAI_API_KEY`، `ANTHROPIC_API_KEY`، `OPENROUTER_API_KEY`، `GOOGLE_API_KEY`، `GEMINI_API_KEY`، `GROQ_API_KEY`، `XAI_API_KEY`، `MISTRAL_API_KEY`، `DEEPSEEK_API_KEY`. بدون هذا العلم، لا يتم نسخ الأسرار أبدًا.
  </Accordion>
</AccordionGroup>

## ما يبقى للأرشيف فقط

ينسخ المزوّد هذه العناصر إلى دليل تقرير الترحيل للمراجعة اليدوية، لكنه **لا** يحمّلها في إعدادات OpenClaw الحية أو بيانات الاعتماد:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

ترفض OpenClaw تنفيذ هذه الحالة أو الوثوق بها تلقائيًا لأن التنسيقات وافتراضات الثقة يمكن أن تختلف بين الأنظمة. انقل ما تحتاج إليه يدويًا بعد مراجعة الأرشيف.

## التدفق الموصى به

<Steps>
  <Step title="عاين الخطة">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    تسرد الخطة كل ما سيتغير، بما في ذلك التعارضات والعناصر المتخطاة وأي عناصر حساسة. ينقّح إخراج الخطة المفاتيح المتداخلة التي تبدو كأسرار.

  </Step>
  <Step title="طبّق مع نسخة احتياطية">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    تنشئ OpenClaw نسخة احتياطية وتتحقق منها قبل التطبيق. إذا كنت تحتاج إلى استيراد مفاتيح API، فأضف `--include-secrets`.

  </Step>
  <Step title="شغّل Doctor">
    ```bash
    openclaw doctor
    ```

    يعيد [Doctor](/ar/gateway/doctor) تطبيق أي عمليات ترحيل إعدادات معلقة ويفحص المشكلات التي أُدخلت أثناء الاستيراد.

  </Step>
  <Step title="أعد التشغيل وتحقق">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    تأكد من أن Gateway سليم وأن النموذج والذاكرة وSkills المستوردة قد تم تحميلها.

  </Step>
</Steps>

## معالجة التعارضات

يرفض التطبيق المتابعة عندما تبلغ الخطة عن تعارضات (ملف أو قيمة إعدادات موجودة بالفعل في الهدف).

<Warning>
أعد التشغيل مع `--overwrite` فقط عندما يكون استبدال الهدف الحالي مقصودًا. قد يظل المزوّدون يكتبون نسخًا احتياطية على مستوى العنصر للملفات المستبدلة في دليل تقرير الترحيل.
</Warning>

في تثبيت OpenClaw جديد، تكون التعارضات غير معتادة. تظهر عادةً عندما تعيد تشغيل الاستيراد على إعداد يحتوي بالفعل على تعديلات من المستخدم.

إذا ظهر تعارض أثناء التطبيق (على سبيل المثال، تسابق غير متوقع على ملف إعدادات)، يضع Hermes علامة `skipped` على عناصر الإعدادات التابعة المتبقية مع السبب `blocked by earlier apply conflict` بدلًا من كتابتها جزئيًا. يسجل تقرير الترحيل كل عنصر محظور حتى تتمكن من حل التعارض الأصلي وإعادة تشغيل الاستيراد.

## الأسرار

لا يتم استيراد الأسرار افتراضيًا أبدًا.

- شغّل `openclaw migrate apply hermes --yes` أولًا لاستيراد الحالة غير السرية.
- إذا كنت تريد أيضًا نسخ مفاتيح `.env` المدعومة، فأعد التشغيل مع `--include-secrets`.
- بالنسبة إلى بيانات الاعتماد المُدارة عبر SecretRef، كوّن مصدر SecretRef بعد اكتمال الاستيراد.

## إخراج JSON للأتمتة

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

مع `--json` وبدون `--yes`، يطبع التطبيق الخطة ولا يغيّر الحالة. هذا هو الوضع الأكثر أمانًا لـ CI والنصوص المشتركة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="يرفض التطبيق بسبب تعارضات">
    افحص إخراج الخطة. يحدد كل تعارض مسار المصدر والهدف الحالي. قرر لكل عنصر ما إذا كنت ستتخطاه، أو تعدّل الهدف، أو تعيد التشغيل مع `--overwrite`.
  </Accordion>
  <Accordion title="يوجد Hermes خارج ~/.hermes">
    مرّر `--from /actual/path` ‏(CLI) أو `--import-source /actual/path` (الإعداد الأولي).
  </Accordion>
  <Accordion title="يرفض الإعداد الأولي الاستيراد على إعداد موجود">
    تتطلب عمليات استيراد الإعداد الأولي إعدادًا جديدًا. إما أن تعيد ضبط الحالة وتعيد الإعداد الأولي، أو تستخدم `openclaw migrate apply hermes` مباشرةً، فهو يدعم `--overwrite` والتحكم الصريح في النسخ الاحتياطي.
  </Accordion>
  <Accordion title="لم يتم استيراد مفاتيح API">
    `--include-secrets` مطلوب، ولا يتم التعرف إلا على المفاتيح المذكورة أعلاه. يتم تجاهل المتغيرات الأخرى في `.env`.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [`openclaw migrate`](/ar/cli/migrate): مرجع CLI الكامل، وعقد Plugin، وأشكال JSON.
- [الإعداد الأولي](/ar/cli/onboard): تدفق المعالج والأعلام غير التفاعلية.
- [الترحيل](/ar/install/migrating): نقل تثبيت OpenClaw بين الأجهزة.
- [Doctor](/ar/gateway/doctor): فحص السلامة بعد الترحيل.
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace): مكان وجود `SOUL.md` و`AGENTS.md` وملفات الذاكرة.
