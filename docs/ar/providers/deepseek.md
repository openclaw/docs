---
read_when:
    - تريد استخدام DeepSeek مع OpenClaw
    - تحتاج إلى متغير البيئة الخاص بمفتاح API أو خيار مصادقة CLI
summary: إعداد DeepSeek (المصادقة + اختيار النموذج)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T07:58:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ead407c67c05bd8700db1cba36defdd9d47bdc9a071c76a07c4b4fb82f6b80e2
    source_path: providers/deepseek.md
    workflow: 15
---

يوفر [DeepSeek](https://www.deepseek.com) نماذج ذكاء اصطناعي قوية عبر API متوافق مع OpenAI.

| الخاصية | القيمة                     |
| -------- | -------------------------- |
| الموفّر | `deepseek`                 |
| المصادقة | `DEEPSEEK_API_KEY`         |
| API      | متوافق مع OpenAI          |
| Base URL | `https://api.deepseek.com` |

## البدء

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    أنشئ مفتاح API على [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    سيطلب هذا مفتاح API الخاص بك ويضبط `deepseek/deepseek-chat` بوصفه النموذج الافتراضي.

  </Step>
  <Step title="تحقق من توفر النماذج">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="إعداد غير تفاعلي">
    بالنسبة إلى عمليات التثبيت المؤتمتة أو غير المزودة بواجهة، مرّر جميع العلامات مباشرة:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
إذا كان Gateway يعمل كخدمة daemon ‏(`launchd`/`systemd`)، فتأكد من أن `DEEPSEEK_API_KEY`
متاح لتلك العملية (على سبيل المثال في `~/.openclaw/.env` أو عبر
`env.shellEnv`).
</Warning>

## الفهرس المضمن

| مرجع النموذج                 | الاسم             | الإدخال | السياق  | الحد الأقصى للإخراج | ملاحظات                                             |
| ---------------------------- | ----------------- | ------- | ------- | ------------------- | --------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072 | 8,192               | النموذج الافتراضي؛ واجهة DeepSeek V3.2 غير الخاصة بالتفكير |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072 | 65,536              | واجهة V3.2 مع تمكين الاستدلال                       |

<Tip>
يعلن كلا النموذجين المضمنين حاليًا عن توافق استخدام البث في المصدر.
</Tip>

## مثال على التهيئة

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل لتهيئة الوكلاء والنماذج والموفّرين.
  </Card>
</CardGroup>
