---
read_when:
    - تريد تكوين Perplexity كموفّر بحث على الويب
    - تحتاج إلى مفتاح API الخاص بـ Perplexity أو إعداد وكيل OpenRouter
summary: إعداد مزوّد بحث الويب Perplexity (مفتاح API، أوضاع البحث، التصفية)
title: Perplexity
x-i18n:
    generated_at: "2026-04-30T08:22:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

يوفر Plugin Perplexity إمكانات بحث الويب من خلال Perplexity
Search API أو Perplexity Sonar عبر OpenRouter.

<Note>
هذه الصفحة هي إعداد **المزوّد** في Perplexity. بالنسبة إلى **الأداة** في Perplexity (كيفية استخدام الوكيل لها)، راجع [أداة Perplexity](/ar/tools/perplexity-search).
</Note>

| الخاصية     | القيمة                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| النوع       | مزوّد بحث ويب (وليس مزوّد نماذج)                                      |
| المصادقة    | `PERPLEXITY_API_KEY` (مباشر) أو `OPENROUTER_API_KEY` (عبر OpenRouter) |
| مسار التهيئة | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## البدء

<Steps>
  <Step title="تعيين مفتاح API">
    شغّل تدفق تهيئة بحث الويب التفاعلي:

    ```bash
    openclaw configure --section web
    ```

    أو عيّن المفتاح مباشرةً:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="بدء البحث">
    سيستخدم الوكيل Perplexity تلقائيًا لعمليات بحث الويب بمجرد تهيئة المفتاح.
    لا يلزم اتخاذ أي خطوات إضافية.
  </Step>
</Steps>

## أوضاع البحث

يحدد Plugin وسيلة النقل تلقائيًا بناءً على بادئة مفتاح API:

<Tabs>
  <Tab title="واجهة API الأصلية من Perplexity (pplx-)">
    عندما يبدأ مفتاحك بـ `pplx-`، يستخدم OpenClaw واجهة Perplexity Search
    API الأصلية. تُرجع وسيلة النقل هذه نتائج منظّمة وتدعم مرشحات النطاق واللغة
    والتاريخ (راجع خيارات التصفية أدناه).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    عندما يبدأ مفتاحك بـ `sk-or-`، يوجّه OpenClaw الطلبات عبر OpenRouter باستخدام
    نموذج Perplexity Sonar. تُرجع وسيلة النقل هذه إجابات مركّبة بالذكاء الاصطناعي مع
    استشهادات.
  </Tab>
</Tabs>

| بادئة المفتاح | وسيلة النقل                 | الميزات                                         |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | واجهة Perplexity Search API الأصلية | نتائج منظّمة، مرشحات النطاق/اللغة/التاريخ |
| `sk-or-`   | OpenRouter (Sonar)           | إجابات مركّبة بالذكاء الاصطناعي مع استشهادات            |

## تصفية API الأصلية

<Note>
لا تتوفر خيارات التصفية إلا عند استخدام واجهة Perplexity API الأصلية
(مفتاح `pplx-`). لا تدعم عمليات البحث عبر OpenRouter/Sonar هذه المعلمات.
</Note>

عند استخدام واجهة Perplexity API الأصلية، تدعم عمليات البحث المرشحات التالية:

| المرشح         | الوصف                            | المثال                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| البلد        | رمز بلد مكوّن من حرفين                  | `us`, `de`, `jp`                    |
| اللغة       | رمز لغة ISO 639-1                | `en`, `fr`, `zh`                    |
| النطاق الزمني     | نافذة الحداثة                         | `day`, `week`, `month`, `year`      |
| مرشحات النطاق | قائمة سماح أو قائمة حظر (بحد أقصى 20 نطاقًا) | `example.com`                       |
| ميزانية المحتوى | حدود الرموز لكل استجابة / لكل صفحة   | `max_tokens`, `max_tokens_per_page` |

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="متغير البيئة لعمليات الخدمة الخلفية">
    إذا كان OpenClaw Gateway يعمل كخدمة خلفية (launchd/systemd)، فتأكد من
    توفر `PERPLEXITY_API_KEY` لتلك العملية.

    <Warning>
    لن يكون المفتاح المعين فقط في `~/.profile` مرئيًا لخدمة launchd/systemd
    الخلفية ما لم يتم استيراد تلك البيئة صراحةً. عيّن المفتاح في
    `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان أن عملية Gateway يمكنها
    قراءته.
    </Warning>

  </Accordion>

  <Accordion title="إعداد وكيل OpenRouter">
    إذا كنت تفضّل توجيه عمليات بحث Perplexity عبر OpenRouter، فعيّن
    `OPENROUTER_API_KEY` (بالبادئة `sk-or-`) بدلًا من مفتاح Perplexity الأصلي.
    سيكتشف OpenClaw البادئة ويتحول إلى وسيلة نقل Sonar
    تلقائيًا.

    <Tip>
    تكون وسيلة نقل OpenRouter مفيدة إذا كان لديك بالفعل حساب OpenRouter
    وتريد فوترة موحّدة عبر عدة مزوّدين.
    </Tip>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="أداة بحث Perplexity" href="/ar/tools/perplexity-search" icon="magnifying-glass">
    كيف يستدعي الوكيل عمليات بحث Perplexity ويفسّر النتائج.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع التهيئة الكامل، بما في ذلك إدخالات Plugin.
  </Card>
</CardGroup>
