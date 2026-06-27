---
read_when:
    - تريد تكوين Perplexity كمزوّد بحث ويب
    - تحتاج إلى إعداد مفتاح Perplexity API أو وكيل OpenRouter
summary: إعداد موفر بحث الويب في Perplexity (مفتاح API، أوضاع البحث، التصفية)
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T18:27:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

يوفّر Plugin Perplexity إمكانات بحث الويب عبر واجهة برمجة تطبيقات Perplexity
Search API أو Perplexity Sonar عبر OpenRouter.

<Note>
هذه الصفحة مخصّصة لإعداد **مزوّد** Perplexity. بالنسبة إلى **أداة** Perplexity (كيف يستخدمها الوكيل)، راجع [أداة Perplexity](/ar/tools/perplexity-search).
</Note>

| الخاصية    | القيمة                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| النوع        | مزوّد بحث ويب (وليس مزوّد نماذج)                             |
| المصادقة        | `PERPLEXITY_API_KEY` (مباشر) أو `OPENROUTER_API_KEY` (عبر OpenRouter) |
| مسار التكوين | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## بدء الاستخدام

<Steps>
  <Step title="تعيين مفتاح واجهة برمجة التطبيقات">
    شغّل مسار تكوين بحث الويب التفاعلي:

    ```bash
    openclaw configure --section web
    ```

    أو عيّن المفتاح مباشرة:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="بدء البحث">
    سيستخدم الوكيل Perplexity تلقائيًا لعمليات بحث الويب بعد تكوين المفتاح.
    لا يلزم اتخاذ أي خطوات إضافية.
  </Step>
</Steps>

## أوضاع البحث

يختار Plugin وسيلة النقل تلقائيًا بناءً على بادئة مفتاح واجهة برمجة التطبيقات:

<Tabs>
  <Tab title="واجهة Perplexity API الأصلية (pplx-)">
    عندما يبدأ مفتاحك بـ `pplx-`، يستخدم OpenClaw واجهة Perplexity Search
    API الأصلية. تُرجع وسيلة النقل هذه نتائج منظّمة وتدعم مرشحات النطاق واللغة
    والتاريخ (راجع خيارات التصفية أدناه).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    عندما يبدأ مفتاحك بـ `sk-or-`، يوجّه OpenClaw الطلب عبر OpenRouter باستخدام
    نموذج Perplexity Sonar. تُرجع وسيلة النقل هذه إجابات مولّدة بالذكاء الاصطناعي مع
    استشهادات.
  </Tab>
</Tabs>

| بادئة المفتاح | وسيلة النقل                    | الميزات                                         |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Perplexity Search API الأصلية | نتائج منظّمة، ومرشحات النطاق/اللغة/التاريخ |
| `sk-or-`   | OpenRouter (Sonar)           | إجابات مولّدة بالذكاء الاصطناعي مع استشهادات            |

## تصفية واجهة API الأصلية

<Note>
لا تتوفر خيارات التصفية إلا عند استخدام واجهة Perplexity API الأصلية
(مفتاح `pplx-`). لا تدعم عمليات البحث عبر OpenRouter/Sonar هذه المعلمات.
</Note>

عند استخدام واجهة Perplexity API الأصلية، تدعم عمليات البحث المرشحات التالية:

| المرشح         | الوصف                            | المثال                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| البلد        | رمز بلد من حرفين                  | `us`, `de`, `jp`                    |
| اللغة       | رمز لغة ISO 639-1                | `en`, `fr`, `zh`                    |
| نطاق التاريخ     | نافذة الحداثة                         | `day`, `week`, `month`, `year`      |
| مرشحات النطاق | قائمة سماح أو قائمة حظر (20 نطاقًا كحد أقصى) | `example.com`                       |
| ميزانية المحتوى | حدود الرموز لكل استجابة / لكل صفحة   | `max_tokens`, `max_tokens_per_page` |

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="متغير بيئة لعمليات الخادم الخلفية">
    إذا كان OpenClaw Gateway يعمل كعملية خادم خلفية (launchd/systemd)، فتأكد من أن
    `PERPLEXITY_API_KEY` متاح لتلك العملية.

    <Warning>
    لن يكون المفتاح الذي يُصدَّر فقط في صدفة تفاعلية مرئيًا لعملية خادم خلفية
    launchd/systemd ما لم تُستورد تلك البيئة صراحةً. عيّن
    المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان قدرة عملية gateway
    على قراءته.
    </Warning>

  </Accordion>

  <Accordion title="إعداد وكيل OpenRouter">
    إذا كنت تفضّل توجيه عمليات بحث Perplexity عبر OpenRouter، فعيّن
    `OPENROUTER_API_KEY` (بالبادئة `sk-or-`) بدلًا من مفتاح Perplexity أصلي.
    سيكتشف OpenClaw البادئة وينتقل إلى وسيلة نقل Sonar
    تلقائيًا.

    <Tip>
    تكون وسيلة نقل OpenRouter مفيدة إذا كان لديك حساب OpenRouter بالفعل
    وتريد فوترة موحّدة عبر عدة مزوّدين.
    </Tip>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="أداة بحث Perplexity" href="/ar/tools/perplexity-search" icon="magnifying-glass">
    كيف يستدعي الوكيل عمليات بحث Perplexity ويفسّر النتائج.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع التكوين الكامل، بما في ذلك إدخالات Plugin.
  </Card>
</CardGroup>
