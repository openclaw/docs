---
read_when:
    - تريد تمكين code_execution أو تكوينه
    - تريد تحليلاً عن بُعد من دون وصول إلى الصدفة المحلية
    - تريد دمج x_search أو web_search مع تحليل Python عن بُعد
summary: 'code_execution: تشغيل تحليل Python بعيد داخل بيئة معزولة باستخدام xAI'
title: تنفيذ التعليمات البرمجية
x-i18n:
    generated_at: "2026-06-27T18:39:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

يشغّل `code_execution` تحليلاً بعيداً للغة Python داخل sandbox على واجهة Responses API الخاصة بـ xAI. يتم تسجيله بواسطة Plugin `xai` المضمّن (ضمن عقد `tools`) ويرسل الطلبات إلى نقطة النهاية نفسها `https://api.x.ai/v1/responses` التي يستخدمها `x_search`.

| الخاصية           | القيمة                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| اسم الأداة          | `code_execution`                                                                  |
| Plugin المزوّد    | `xai` (مضمّن، `enabledByDefault: true`)                                         |
| المصادقة               | ملف مصادقة xAI، أو `XAI_API_KEY`، أو `plugins.entries.xai.config.webSearch.apiKey` |
| النموذج الافتراضي      | `grok-4-1-fast`                                                                   |
| المهلة الافتراضية    | 30 ثانية                                                                        |
| `maxTurns` الافتراضي | غير مضبوط (تطبّق xAI حدّها الداخلي الخاص)                                        |

يختلف هذا عن [`exec`](/ar/tools/exec) المحلي:

- يشغّل `exec` أوامر shell على جهازك أو على عقدة مقترنة.
- يشغّل `code_execution` لغة Python في sandbox بعيد خاص بـ xAI.

استخدم `code_execution` من أجل:

- الحسابات.
- الجداول.
- الإحصاءات السريعة.
- التحليل بأسلوب المخططات.
- تحليل البيانات التي يعيدها `x_search` أو `web_search`.

لا تستخدمه عندما تحتاج إلى ملفات محلية، أو shell الخاص بك، أو المستودع، أو أجهزة مقترنة. استخدم [`exec`](/ar/tools/exec) لذلك.

## الإعداد

<Steps>
  <Step title="Provide xAI credentials">
    سجّل الدخول باستخدام Grok OAuth عبر اشتراك SuperGrok أو X Premium مؤهل،
    أو خزّن مفتاح API. يستخدم xAI OAuth التحقق برمز الجهاز، لذلك يعمل
    من المضيفات البعيدة دون استدعاء localhost. يعمل OAuth مع
    `code_execution` و`x_search`؛ ويمكن أيضاً لـ `XAI_API_KEY` أو إعداد web-search في Plugin
    تشغيل Grok `web_search`.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    أثناء التثبيت الجديد، تتوفر خيارات المصادقة نفسها داخل
    التهيئة الأولية:

    ```bash
    openclaw onboard --install-daemon
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

  </Step>

  <Step title="Enable and tune code_execution">
    يتوفر `code_execution` عندما تكون بيانات اعتماد xAI متاحة. اضبط
    `plugins.entries.xai.config.codeExecution.enabled` على `false` لتعطيله،
    أو استخدم الكتلة نفسها لضبط النموذج والمهلة.

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

    يظهر `code_execution` في قائمة أدوات الوكيل بمجرد أن يعيد Plugin `xai` التسجيل مع `enabled: true`.

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

تأخذ الأداة معاملاً داخلياً واحداً هو `task`، لذلك ينبغي أن يرسل الوكيل طلب التحليل كاملاً وأي بيانات مضمنة في مطالبة واحدة.

## الأخطاء

عند تشغيل الأداة دون مصادقة، تُرجع خطأ `missing_xai_api_key` منظماً يشير إلى خيارات ملف المصادقة ومتغير البيئة والإعدادات. يكون الخطأ بصيغة JSON، وليس استثناءً مطروحاً، لذلك يمكن للوكيل تصحيح نفسه:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## الحدود

- هذا تنفيذ بعيد عبر xAI، وليس تنفيذ عملية محلية.
- تعامل مع النتائج كتحليل عابر، وليس كجلسة دفتر ملاحظات دائمة.
- لا تفترض الوصول إلى الملفات المحلية أو مساحة عملك.
- للحصول على بيانات X حديثة، استخدم [`x_search`](/ar/tools/web#x_search) أولاً ومرّر النتيجة إلى `code_execution`.

## ذات صلة

<CardGroup cols={2}>
  <Card title="Exec tool" href="/ar/tools/exec" icon="terminal">
    تنفيذ shell محلي على جهازك أو عقدة مقترنة.
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
