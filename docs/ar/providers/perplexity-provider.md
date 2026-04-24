---
read_when:
    - تريد إعداد Perplexity بوصفه موفرًا للبحث على الويب
    - تحتاج إلى مفتاح API الخاص بـ Perplexity أو إعداد وكيل OpenRouter
summary: إعداد موفر بحث الويب Perplexity ‏(مفتاح API، وأوضاع البحث، والتصفية)
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T08:00:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2d3d6912bc9952bbe89124dd8aea600c938c8ceff21df46508b6e44e0a1159
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity ‏(موفر بحث الويب)

توفر Plugin الخاصة بـ Perplexity إمكانات البحث على الويب عبر Perplexity
Search API أو Perplexity Sonar عبر OpenRouter.

<Note>
تغطي هذه الصفحة إعداد **موفر** Perplexity. أما بالنسبة إلى **أداة** Perplexity
(كيف يستخدمها الوكيل)، فراجع [أداة Perplexity](/ar/tools/perplexity-search).
</Note>

| الخاصية      | القيمة                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| النوع        | موفر بحث ويب (وليس موفر نماذج)                                        |
| المصادقة     | `PERPLEXITY_API_KEY` ‏(مباشر) أو `OPENROUTER_API_KEY` ‏(عبر OpenRouter) |
| مسار الإعداد | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## البدء

<Steps>
  <Step title="ضبط مفتاح API">
    شغّل تدفق إعداد البحث على الويب التفاعلي:

    ```bash
    openclaw configure --section web
    ```

    أو اضبط المفتاح مباشرة:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="ابدأ البحث">
    سيستخدم الوكيل Perplexity تلقائيًا لعمليات البحث على الويب بمجرد ضبط المفتاح.
    لا حاجة إلى خطوات إضافية.
  </Step>
</Steps>

## أوضاع البحث

تقوم Plugin باختيار وسيلة النقل تلقائيًا بناءً على بادئة مفتاح API:

<Tabs>
  <Tab title="Perplexity API الأصلية (pplx-)">
    عندما يبدأ مفتاحك بـ `pplx-`، يستخدم OpenClaw واجهة Perplexity Search
    API الأصلية. تعيد هذه الوسيلة نتائج منظّمة وتدعم عوامل تصفية النطاق واللغة
    والتاريخ (راجع خيارات التصفية أدناه).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    عندما يبدأ مفتاحك بـ `sk-or-`، يوجّه OpenClaw الطلبات عبر OpenRouter باستخدام
    نموذج Perplexity Sonar. تعيد هذه الوسيلة إجابات مولّفة بالذكاء الاصطناعي مع
    استشهادات.
  </Tab>
</Tabs>

| بادئة المفتاح | وسيلة النقل                    | الميزات                                           |
| ------------- | ----------------------------- | ------------------------------------------------- |
| `pplx-`       | Perplexity Search API الأصلية | نتائج منظّمة، وعوامل تصفية النطاق/اللغة/التاريخ   |
| `sk-or-`      | OpenRouter ‏(Sonar)           | إجابات مولّفة بالذكاء الاصطناعي مع استشهادات      |

## التصفية في API الأصلية

<Note>
تتوفر خيارات التصفية فقط عند استخدام Perplexity API الأصلية
(مفتاح `pplx-`). ولا تدعم عمليات البحث عبر OpenRouter/Sonar هذه المعلمات.
</Note>

عند استخدام Perplexity API الأصلية، تدعم عمليات البحث عوامل التصفية التالية:

| عامل التصفية   | الوصف                                | المثال                             |
| -------------- | ----------------------------------- | ---------------------------------- |
| البلد          | رمز بلد مكون من حرفين               | `us`, `de`, `jp`                   |
| اللغة          | رمز لغة ISO 639-1                   | `en`, `fr`, `zh`                   |
| نطاق التاريخ   | نافذة الزمن الحديثة                 | `day`, `week`, `month`, `year`     |
| عوامل تصفية النطاق | قائمة سماح أو قائمة منع (بحد أقصى 20 نطاقًا) | `example.com`                      |
| ميزانية المحتوى | حدود الرموز لكل استجابة / لكل صفحة | `max_tokens`, `max_tokens_per_page` |

## إعداد متقدم

<AccordionGroup>
  <Accordion title="متغير البيئة لعمليات daemon">
    إذا كانت OpenClaw Gateway تعمل بوصفها daemon ‏(launchd/systemd)، فتأكد من أن
    `PERPLEXITY_API_KEY` متاح لتلك العملية.

    <Warning>
    لن يكون المفتاح المضبوط فقط في `~/.profile` مرئيًا لـ daemon من نوع launchd/systemd
    ما لم يتم استيراد تلك البيئة صراحةً. اضبط المفتاح في
    `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان أن عملية gateway تستطيع
    قراءته.
    </Warning>

  </Accordion>

  <Accordion title="إعداد وكيل OpenRouter">
    إذا كنت تفضل توجيه عمليات بحث Perplexity عبر OpenRouter، فاضبط
    `OPENROUTER_API_KEY` ‏(ببادئة `sk-or-`) بدلًا من مفتاح Perplexity الأصلي.
    سيكتشف OpenClaw البادئة ويحوّل تلقائيًا إلى وسيلة النقل Sonar.

    <Tip>
    تُعد وسيلة النقل عبر OpenRouter مفيدة إذا كان لديك بالفعل حساب OpenRouter
    وتريد فوترة موحدة عبر عدة موفّرين.
    </Tip>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="أداة بحث Perplexity" href="/ar/tools/perplexity-search" icon="magnifying-glass">
    كيف يستدعي الوكيل عمليات بحث Perplexity ويفسر النتائج.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعدادات الكامل بما في ذلك إدخالات Plugins.
  </Card>
</CardGroup>
