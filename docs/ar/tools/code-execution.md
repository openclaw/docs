---
read_when:
    - تريد تمكين code_execution أو تهيئته
    - تريد تحليلاً عن بُعد دون وصول إلى سطر الأوامر المحلي
    - تريد دمج x_search أو web_search مع تحليل Python عن بُعد
summary: code_execution -- تشغيل تحليل Python عن بُعد في بيئة معزولة باستخدام xAI
title: تنفيذ الكود
x-i18n:
    generated_at: "2026-04-30T08:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` يُشغّل تحليل Python بعيدًا ومعزولًا على Responses API الخاصة بـ xAI.
يختلف هذا عن [`exec`](/ar/tools/exec) المحلي:

- يُشغّل `exec` أوامر shell على جهازك أو العقدة
- يُشغّل `code_execution` لغة Python في sandbox البعيد الخاص بـ xAI

استخدم `code_execution` من أجل:

- الحسابات
- إنشاء الجداول
- الإحصاءات السريعة
- التحليل بنمط المخططات
- تحليل البيانات التي يعيدها `x_search` أو `web_search`

لا تستخدمه **عندما تحتاج إلى ملفات محلية أو shell الخاص بك أو المستودع الخاص بك أو أجهزة
مقترنة**. استخدم [`exec`](/ar/tools/exec) لذلك.

## الإعداد

تحتاج إلى مفتاح xAI API. يعمل أي مما يلي:

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

اطلب بشكل طبيعي واجعل نية التحليل واضحة:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

تأخذ الأداة داخليًا معلمة `task` واحدة، لذا ينبغي للوكيل إرسال
طلب التحليل الكامل وأي بيانات مضمنة في موجه واحد.

## الحدود

- هذا تنفيذ بعيد من xAI، وليس تنفيذ عملية محلية.
- ينبغي التعامل معه كتحليل مؤقت، وليس كدفتر ملاحظات دائم.
- لا تفترض وجود وصول إلى الملفات المحلية أو مساحة العمل الخاصة بك.
- للحصول على بيانات X حديثة، استخدم [`x_search`](/ar/tools/web#x_search) أولًا.

## ذات صلة

- [أداة Exec](/ar/tools/exec)
- [موافقات Exec](/ar/tools/exec-approvals)
- [أداة apply_patch](/ar/tools/apply-patch)
- [أدوات Web](/ar/tools/web)
- [xAI](/ar/providers/xai)
