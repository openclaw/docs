---
read_when:
    - تريد تفعيل أو تكوين code_execution
    - تريد إجراء تحليل عن بُعد دون الوصول إلى الصدفة المحلية
    - تريد دمج x_search أو web_search مع تحليل Python عن بُعد
summary: 'code_execution: تشغيل تحليل Python عن بُعد في بيئة معزولة باستخدام xAI'
title: تنفيذ التعليمات البرمجية
x-i18n:
    generated_at: "2026-05-06T08:16:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` يشغّل تحليل Python بعيدًا ومعزولًا على Responses API الخاصة بـ xAI. يتم تسجيله بواسطة Plugin `xai` المضمّن (تحت عقد `tools`) ويرسل الطلبات إلى نقطة النهاية نفسها `https://api.x.ai/v1/responses` التي يستخدمها `x_search`.

| الخاصية           | القيمة                                                          |
| ------------------ | -------------------------------------------------------------- |
| اسم الأداة          | `code_execution`                                               |
| Plugin المزوّد    | `xai` (مضمّن، `enabledByDefault: true`)                      |
| المصادقة               | `XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey` |
| النموذج الافتراضي      | `grok-4-1-fast`                                                |
| المهلة الافتراضية    | 30 ثانية                                                     |
| `maxTurns` الافتراضي | غير مضبوط (تطبّق xAI حدّها الداخلي الخاص)                     |

هذا يختلف عن [`exec`](/ar/tools/exec) المحلي:

- يشغّل `exec` أوامر shell على جهازك أو العقدة المقترنة.
- يشغّل `code_execution` لغة Python في بيئة xAI البعيدة المعزولة.

استخدم `code_execution` من أجل:

- الحسابات.
- الجدولة.
- الإحصاءات السريعة.
- التحليل بنمط المخططات.
- تحليل البيانات التي يعيدها `x_search` أو `web_search`.

لا تستخدمه عندما تحتاج إلى ملفات محلية، أو shell الخاص بك، أو المستودع الخاص بك، أو أجهزة مقترنة. استخدم [`exec`](/ar/tools/exec) لذلك.

## الإعداد

<Steps>
  <Step title="وفّر مفتاح xAI API">
    اضبط `XAI_API_KEY` في بيئة Gateway، أو هيّئ المفتاح ضمن Plugin xAI بحيث تغطي بيانات الاعتماد نفسها `code_execution` و`x_search` وبحث الويب وأدوات xAI الأخرى:

    ```bash
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

  </Step>

  <Step title="فعّل واضبط code_execution">
    الأداة محكومة بالإعداد `plugins.entries.xai.config.codeExecution.enabled`. الافتراضي هو إيقاف التشغيل.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="أعد تشغيل Gateway">
    ```bash
    openclaw gateway restart
    ```

    يظهر `code_execution` في قائمة أدوات الوكيل بمجرد أن يعيد Plugin xAI التسجيل مع `enabled: true`.

  </Step>
</Steps>

## كيفية استخدامه

اطلب بشكل طبيعي واجعل قصد التحليل صريحًا:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

تأخذ الأداة معامل `task` واحدًا داخليًا، لذا ينبغي أن يرسل الوكيل طلب التحليل الكامل وأي بيانات مضمّنة في مطالبة واحدة.

## الأخطاء

عندما تعمل الأداة من دون مصادقة، تعيد خطأ منظمًا باسم `missing_xai_api_key` يشير إلى متغير البيئة ومسار الإعداد. الخطأ بصيغة JSON، وليس استثناءً مطروحًا، لذلك يمكن للوكيل تصحيح نفسه:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## الحدود

- هذا تنفيذ بعيد لدى xAI، وليس تنفيذ عملية محلية.
- تعامل مع النتائج كتحليل مؤقت، وليس كجلسة دفتر ملاحظات دائمة.
- لا تفترض وجود وصول إلى الملفات المحلية أو مساحة العمل الخاصة بك.
- للحصول على بيانات X حديثة، استخدم [`x_search`](/ar/tools/web#x_search) أولًا ومرّر النتيجة إلى `code_execution`.

## ذو صلة

<CardGroup cols={2}>
  <Card title="أداة Exec" href="/ar/tools/exec" icon="terminal">
    تنفيذ shell محلي على جهازك أو العقدة المقترنة.
  </Card>
  <Card title="موافقات Exec" href="/ar/tools/exec-approvals" icon="shield">
    سياسة السماح/الرفض لتنفيذ shell.
  </Card>
  <Card title="أدوات الويب" href="/ar/tools/web" icon="globe">
    `web_search` و`x_search` و`web_fetch`.
  </Card>
  <Card title="مزوّد xAI" href="/ar/providers/xai" icon="microchip">
    نماذج Grok وبحث الويب/X وإعدادات تنفيذ الكود.
  </Card>
</CardGroup>
