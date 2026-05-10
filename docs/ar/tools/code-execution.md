---
read_when:
    - تريد تمكين code_execution أو تكوينه
    - تريد تحليلاً عن بُعد دون وصول إلى الصدفة المحلية
    - تريد الجمع بين x_search أو web_search وتحليل Python عن بُعد
summary: 'code_execution: تشغيل تحليل Python عن بُعد داخل صندوق عزل باستخدام xAI'
title: تنفيذ التعليمات البرمجية
x-i18n:
    generated_at: "2026-05-10T20:03:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76be496e459fac9c7f6b0324cceb884d3a693fd72d7541094d1bb64a4f1b7b8b
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` يشغّل تحليل Python عن بُعد داخل صندوق حماية على واجهة Responses API الخاصة بـ xAI. يتم تسجيله بواسطة Plugin `xai` المضمّن (ضمن عقد `tools`) ويوجّه الطلبات إلى نقطة النهاية نفسها `https://api.x.ai/v1/responses` التي يستخدمها `x_search`.

| الخاصية           | القيمة                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| اسم الأداة          | `code_execution`                                                                  |
| Plugin المزوّد    | `xai` (مضمّن، `enabledByDefault: true`)                                         |
| المصادقة               | ملف تعريف مصادقة xAI، أو `XAI_API_KEY`، أو `plugins.entries.xai.config.webSearch.apiKey` |
| النموذج الافتراضي      | `grok-4-1-fast`                                                                   |
| المهلة الافتراضية    | 30 ثانية                                                                        |
| `maxTurns` الافتراضي | غير مضبوط (تطبّق xAI حدّها الداخلي الخاص)                                        |

يختلف هذا عن [`exec`](/ar/tools/exec) المحلي:

- يشغّل `exec` أوامر shell على جهازك أو Node مقترن.
- يشغّل `code_execution` Python في صندوق الحماية البعيد الخاص بـ xAI.

استخدم `code_execution` من أجل:

- الحسابات.
- الجدولة.
- الإحصاءات السريعة.
- التحليل بنمط المخططات.
- تحليل البيانات التي يُرجعها `x_search` أو `web_search`.

لا تستخدمه عندما تحتاج إلى ملفات محلية، أو shell الخاص بك، أو مستودعك، أو أجهزة مقترنة. استخدم [`exec`](/ar/tools/exec) لذلك.

## الإعداد

<Steps>
  <Step title="Provide an xAI API key">
    شغّل `openclaw onboard --auth-choice xai-api-key` من أجل `code_execution` و
    `x_search`، أو اضبط `XAI_API_KEY` / هيّئ المفتاح ضمن Plugin الخاص بـ xAI
    عندما تريد أيضًا أن يستخدم بحث الويب من Grok بيانات الاعتماد نفسها:

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

  <Step title="Enable and tune code_execution">
    الأداة محكومة بـ `plugins.entries.xai.config.codeExecution.enabled`. الافتراضي أنها معطّلة.

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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    يظهر `code_execution` في قائمة أدوات الوكيل بمجرد أن يعيد Plugin xAI التسجيل مع `enabled: true`.

  </Step>
</Steps>

## كيفية استخدامه

اطلب بشكل طبيعي واجعل نية التحليل صريحة:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

تأخذ الأداة داخليًا وسيط `task` واحدًا، لذلك ينبغي للوكيل إرسال طلب التحليل الكامل وأي بيانات مضمنة في موجه واحد.

## الأخطاء

عندما تعمل الأداة من دون مصادقة، تُرجع خطأً منظّمًا من نوع `missing_xai_api_key` يشير إلى ملف تعريف المصادقة، ومتغير البيئة، وخيارات الإعدادات. الخطأ بصيغة JSON، وليس استثناءً مرميًا، لذلك يمكن للوكيل تصحيح نفسه:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Run openclaw onboard --auth-choice xai-api-key, set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## الحدود

- هذا تنفيذ بعيد لدى xAI، وليس تنفيذ عملية محلية.
- تعامل مع النتائج كتحليل مؤقت، لا كجلسة دفتر ملاحظات دائمة.
- لا تفترض الوصول إلى الملفات المحلية أو مساحة العمل الخاصة بك.
- للحصول على بيانات X حديثة، استخدم [`x_search`](/ar/tools/web#x_search) أولًا ومرّر النتيجة إلى `code_execution`.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Exec tool" href="/ar/tools/exec" icon="terminal">
    تنفيذ shell محلي على جهازك أو Node مقترن.
  </Card>
  <Card title="Exec approvals" href="/ar/tools/exec-approvals" icon="shield">
    سياسة السماح/الرفض لتنفيذ shell.
  </Card>
  <Card title="Web tools" href="/ar/tools/web" icon="globe">
    `web_search` و`x_search` و`web_fetch`.
  </Card>
  <Card title="xAI provider" href="/ar/providers/xai" icon="microchip">
    نماذج Grok، وبحث الويب/X، وإعدادات تنفيذ الكود.
  </Card>
</CardGroup>
