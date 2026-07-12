---
read_when:
    - تريد تمكين `code_execution` أو تكوينه
    - تريد إجراء تحليل عن بُعد دون الوصول إلى الصدفة المحلية
    - تريد دمج `x_search` أو `web_search` مع تحليل Python عن بُعد
summary: 'code_execution: تشغيل تحليل Python عن بُعد ضمن بيئة معزولة باستخدام xAI'
title: تنفيذ التعليمات البرمجية
x-i18n:
    generated_at: "2026-07-12T06:40:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

يشغّل `code_execution` تحليل Python بعيدًا ومعزولًا على Responses API من xAI
(`https://api.x.ai/v1/responses`، وهي نقطة النهاية نفسها التي يستخدمها `x_search`). وتُسجّله
إضافة `xai` المضمّنة ضمن عقد `tools`.

<Warning>
  يعمل `code_execution` على خوادم xAI. تفرض xAI رسومًا قدرها 5 دولارات لكل 1,000 استدعاء للأداة،
  بالإضافة إلى رموز الإدخال والإخراج الخاصة بالنموذج.
</Warning>

| الخاصية            | القيمة                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| اسم الأداة         | `code_execution`                                                                  |
| إضافة المزوّد      | `xai` (مضمّنة، `enabledByDefault: true`)                                          |
| المصادقة           | ملف مصادقة xAI، أو `XAI_API_KEY`، أو `plugins.entries.xai.config.webSearch.apiKey` |
| النموذج الافتراضي  | `grok-4.3`                                                                        |
| المهلة الافتراضية  | 30 ثانية                                                                          |
| `maxTurns` الافتراضي | غير معيّن (تطبّق xAI حدها الداخلي الخاص)                                        |

استخدمه لإجراء الحسابات، وإنشاء الجداول، والإحصاءات السريعة، والتحليلات
الشبيهة بالمخططات، بما في ذلك تحليل البيانات التي يعيدها `x_search` أو `web_search`. ولا يمكنه
الوصول إلى الملفات المحلية أو الصدفة أو المستودع أو الأجهزة المقترنة، كما أنه لا
يحتفظ بالحالة بين الاستدعاءات، لذا تعامل مع كل استدعاء بوصفه تحليلًا مؤقتًا، لا
جلسة دفتر ملاحظات. للحصول على بيانات X حديثة، شغّل [`x_search`](/ar/tools/web#x_search)
أولًا ومرّر النتيجة إليه.

للتنفيذ المحلي، استخدم [`exec`](/ar/tools/exec) بدلًا منه.

## الإعداد

<Steps>
  <Step title="توفير بيانات اعتماد xAI">
    تتطلب OAuth اشتراكًا مؤهلًا في SuperGrok أو X Premium
    (مع التحقق باستخدام رمز الجهاز، لذا تعمل من المضيفات البعيدة من دون
    رد اتصال عبر المضيف المحلي):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    أثناء التثبيت الجديد، يتوفر الخيار نفسه في الإعداد الأولي:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    أو استخدم مفتاح API:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    أو عبر الإعدادات:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

    يتيح أي من هذه الخيارات الثلاثة أيضًا تشغيل `x_search` و`web_search` في Grok.

  </Step>

  <Step title="تمكين code_execution وضبطه">
    عند حذف `enabled`، لا تُعرض `code_execution` إلا عندما يكون مزوّد
    النموذج النشط هو `xai` ويمكن العثور على بيانات اعتماد xAI. بالنسبة إلى نموذج نشط
    مزوّده المعروف ليس xAI، اضبط
    `plugins.entries.xai.config.codeExecution.enabled` على `true` للاشتراك في
    الاستخدام عبر المزوّدين. إذا كان مزوّد النموذج النشط مفقودًا أو تعذّر تحديده،
    تظل الأداة مخفية. اضبط `enabled` على `false` لتعطيلها لدى جميع
    المزوّدين. وتظل بيانات اعتماد xAI مطلوبة دائمًا.

    استخدم الكتلة نفسها لتجاوز النموذج أو الحد الأقصى للدورات أو المهلة:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // مطلوب لمزوّد نموذج معروف ليس xAI
                model: "grok-4.3", // تجاوز نموذج تنفيذ التعليمات البرمجية الافتراضي من xAI
                maxTurns: 2,            // حد اختياري لدورات الأداة الداخلية
                timeoutSeconds: 30,     // مهلة الطلب (الافتراضي: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="إعادة تشغيل Gateway">
    ```bash
    openclaw gateway restart
    ```

    تظهر `code_execution` في قائمة أدوات الوكيل بمجرد أن تعيد إضافة xAI
    تسجيلها وتنجح عمليات التحقق من المزوّد والتمكين والمصادقة أعلاه.

  </Step>
</Steps>

## كيفية استخدامها

وضّح هدف التحليل صراحةً؛ تأخذ الأداة معامل `task` واحدًا،
لذا أرسل الطلب الكامل وأي بيانات مضمنة في موجّه واحد:

```text
استخدم code_execution لحساب المتوسط المتحرك لمدة 7 أيام لهذه الأرقام: ...
```

```text
استخدم x_search للعثور على المنشورات التي تذكر OpenClaw هذا الأسبوع، ثم استخدم code_execution لحساب عددها حسب اليوم.
```

```text
استخدم web_search لجمع أحدث أرقام معايير أداء الذكاء الاصطناعي، ثم استخدم code_execution لمقارنة التغيّرات المئوية.
```

## الأخطاء

من دون مصادقة، تعيد الأداة خطأ JSON منظمًا (وليس استثناءً
مُلقى)، بحيث يستطيع الوكيل تصحيح الخطأ ذاتيًا:

```json
{
  "error": "missing_xai_api_key",
  "message": "تحتاج code_execution إلى بيانات اعتماد xAI. شغّل `openclaw onboard --auth-choice xai-oauth` لتسجيل الدخول باستخدام Grok، أو شغّل `openclaw onboard --auth-choice xai-api-key`، أو اضبط `XAI_API_KEY` في بيئة Gateway، أو اضبط `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## ذو صلة

<CardGroup cols={2}>
  <Card title="أداة Exec" href="/ar/tools/exec" icon="terminal">
    تنفيذ الصدفة محليًا على جهازك أو Node المقترنة.
  </Card>
  <Card title="موافقات Exec" href="/ar/tools/exec-approvals" icon="shield">
    سياسة السماح أو الرفض لتنفيذ الصدفة.
  </Card>
  <Card title="أدوات الويب" href="/ar/tools/web" icon="globe">
    `web_search` و`x_search` و`web_fetch`.
  </Card>
  <Card title="مزوّد xAI" href="/ar/providers/xai" icon="microchip">
    نماذج Grok، والبحث في الويب/X، وإعدادات تنفيذ التعليمات البرمجية.
  </Card>
</CardGroup>
