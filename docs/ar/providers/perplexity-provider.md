---
read_when:
    - تريد تهيئة Perplexity كموفر بحث ويب
    - تحتاج إلى مفتاح API لـ Perplexity أو إعداد وكيل OpenRouter
summary: إعداد موفر بحث الويب Perplexity (مفتاح API، وأوضاع البحث، والتصفية)
title: Perplexity
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-25T13:57:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d913d71c1b3a5cfbd755efff9235adfd5dd460ef606a6d229d2cceb5134174d3
    source_path: providers/perplexity-provider.md
    workflow: 15
---

يوفر Plugin الخاص بـ Perplexity إمكانات بحث الويب عبر
Perplexity Search API أو Perplexity Sonar عبر OpenRouter.

<Note>
تغطي هذه الصفحة إعداد **الموفر** لـ Perplexity. أما **الأداة**
في Perplexity (أي كيف يستخدمها agent)، فراجع [أداة Perplexity](/ar/tools/perplexity-search).
</Note>

| الخاصية    | القيمة                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| النوع       | موفر بحث ويب (وليس موفر نماذج)                                         |
| المصادقة    | `PERPLEXITY_API_KEY` (مباشر) أو `OPENROUTER_API_KEY` (عبر OpenRouter) |
| مسار التهيئة | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## البدء

<Steps>
  <Step title="اضبط مفتاح API">
    شغّل تدفق إعداد بحث الويب التفاعلي:

    ```bash
    openclaw configure --section web
    ```

    أو اضبط المفتاح مباشرة:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="ابدأ البحث">
    سيستخدم agent Perplexity تلقائيًا لعمليات بحث الويب بمجرد
    تهيئة المفتاح. ولا يلزم أي خطوات إضافية.
  </Step>
</Steps>

## أوضاع البحث

يختار Plugin وسيلة النقل تلقائيًا بناءً على بادئة مفتاح API:

<Tabs>
  <Tab title="Perplexity API الأصلي (pplx-)">
    عندما يبدأ المفتاح لديك بـ `pplx-`، يستخدم OpenClaw
    Perplexity Search API الأصلي. تعيد وسيلة النقل هذه نتائج منظمة
    وتدعم تصفية النطاق واللغة والتاريخ (راجع خيارات التصفية أدناه).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    عندما يبدأ المفتاح لديك بـ `sk-or-`، يوجّه OpenClaw الطلبات عبر OpenRouter
    باستخدام نموذج Perplexity Sonar. تعيد وسيلة النقل هذه إجابات
    مركبة بالذكاء الاصطناعي مع استشهادات.
  </Tab>
</Tabs>

| بادئة المفتاح | وسيلة النقل                    | الميزات                                          |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Perplexity Search API الأصلي | نتائج منظمة، وتصفية النطاق/اللغة/التاريخ         |
| `sk-or-`   | OpenRouter (Sonar)           | إجابات مركبة بالذكاء الاصطناعي مع استشهادات      |

## التصفية في API الأصلي

<Note>
تتوفر خيارات التصفية فقط عند استخدام Perplexity API الأصلي
(مفتاح `pplx-`). ولا تدعم عمليات البحث عبر OpenRouter/Sonar هذه المعلمات.
</Note>

عند استخدام Perplexity API الأصلي، تدعم عمليات البحث عوامل التصفية التالية:

| عامل التصفية | الوصف                                | المثال                              |
| -------------- | -------------------------------------- | ----------------------------------- |
| البلد          | رمز بلد مكوّن من حرفين                | `us`، `de`، `jp`                    |
| اللغة          | رمز لغة ISO 639-1                     | `en`، `fr`، `zh`                    |
| النطاق الزمني  | نافذة الحداثة                         | `day`، `week`، `month`، `year`      |
| تصفية النطاقات | قائمة سماح أو قائمة حظر (بحد أقصى 20 نطاقًا) | `example.com`                 |
| ميزانية المحتوى | حدود الرموز لكل استجابة / لكل صفحة     | `max_tokens`، `max_tokens_per_page` |

## تهيئة متقدمة

<AccordionGroup>
  <Accordion title="متغير البيئة لعمليات daemon">
    إذا كان OpenClaw Gateway يعمل كعملية daemon ‏(launchd/systemd)، فتأكد من أن
    `PERPLEXITY_API_KEY` متاح لتلك العملية.

    <Warning>
    المفتاح المضبوط فقط في `~/.profile` لن يكون مرئيًا لعملية daemon تعمل عبر launchd/systemd
    ما لم يتم استيراد تلك البيئة صراحة. اضبط المفتاح في
    `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان أن عملية gateway يمكنها
    قراءته.
    </Warning>

  </Accordion>

  <Accordion title="إعداد وكيل OpenRouter">
    إذا كنت تفضّل توجيه عمليات بحث Perplexity عبر OpenRouter، فاضبط
    `OPENROUTER_API_KEY` (بالبادئة `sk-or-`) بدلًا من مفتاح Perplexity أصلي.
    سيكتشف OpenClaw البادئة ويبدّل إلى وسيلة نقل Sonar
    تلقائيًا.

    <Tip>
    تكون وسيلة النقل عبر OpenRouter مفيدة إذا كان لديك بالفعل حساب OpenRouter
    وتريد فوترة موحدة عبر عدة موفّرين.
    </Tip>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="أداة بحث Perplexity" href="/ar/tools/perplexity-search" icon="magnifying-glass">
    كيف يستدعي agent عمليات بحث Perplexity ويفسر النتائج.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل للتهيئة بما في ذلك إدخالات Plugins.
  </Card>
</CardGroup>
