---
read_when:
- تريد تفعيل `code_execution` أو تهيئته
- You want remote analysis without local shell access
- تريد الجمع بين `x_search` أو `web_search` والتحليل البعيد باستخدام Python
summary: code_execution -- تشغيل تحليل Python بعيد معزول باستخدام xAI
title: تنفيذ الشيفرة
x-i18n:
  generated_at: '2026-04-24T08:07:47Z'
  refreshed_at: '2026-04-28T05:23:26Z'
  model: gpt-5.4
  provider: openai
  source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
  source_path: tools/code-execution.md
  workflow: 15
---

يقوم `code_execution` بتشغيل تحليل Python بعيد ومعزول على Responses API الخاصة بـ xAI.
وهذا يختلف عن [`exec`](/ar/tools/exec) المحلية:

- يقوم `exec` بتشغيل أوامر shell على جهازك أو على Node
- بينما يقوم `code_execution` بتشغيل Python داخل sandbox بعيدة تابعة لـ xAI

استخدم `code_execution` من أجل:

- العمليات الحسابية
- إعداد الجداول
- الإحصاءات السريعة
- التحليل على نمط الرسوم البيانية
- تحليل البيانات المعادة من `x_search` أو `web_search`

**لا** تستخدمه عندما تحتاج إلى ملفات محلية، أو shell لديك، أو المستودع الخاص بك، أو
الأجهزة المقترنة. استخدم [`exec`](/ar/tools/exec) لذلك.

## الإعداد

تحتاج إلى مفتاح xAI API. يعمل أي من هذه الخيارات:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

مثال:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## كيفية استخدامه

اطلب بشكل طبيعي ووضّح نية التحليل صراحةً:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

تأخذ الأداة داخليًا معلمة واحدة هي `task`، لذا ينبغي على الوكيل إرسال
طلب التحليل الكامل وأي بيانات مضمّنة في مطالبة واحدة.

## الحدود

- هذا تنفيذ بعيد من xAI، وليس تنفيذ عمليات محلية.
- ينبغي التعامل معه على أنه تحليل مؤقت، وليس دفتر ملاحظات دائمًا.
- لا تفترض وجود وصول إلى الملفات المحلية أو إلى مساحة العمل الخاصة بك.
- للحصول على بيانات X حديثة، استخدم [`x_search`](/ar/tools/web#x_search) أولًا.

## ذو صلة

- [أداة Exec](/ar/tools/exec)
- [موافقات Exec](/ar/tools/exec-approvals)
- [أداة apply_patch](/ar/tools/apply-patch)
- [أدوات الويب](/ar/tools/web)
- [xAI](/ar/providers/xai)
