---
read_when:
    - تريد تكوين Perplexity كمزوّد للبحث على الويب
    - تحتاج إلى مفتاح Perplexity API أو إعداد وكيل OpenRouter
summary: إعداد موفّر بحث الويب Perplexity (مفتاح API، أوضاع البحث، التصفية)
title: Perplexity
x-i18n:
    generated_at: "2026-07-12T06:29:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

يسجّل Plugin ‏Perplexity موفّر `web_search` بوسيلتي نقل: واجهة Perplexity Search API الأصلية (نتائج منظّمة مع عوامل تصفية)، وإكمالات محادثة Perplexity Sonar، مباشرة أو عبر OpenRouter (إجابات مولّدة بالذكاء الاصطناعي مع استشهادات).

<Note>
تتناول هذه الصفحة إعداد **موفّر** Perplexity. لمعرفة **أداة** Perplexity (كيفية استخدام الوكيل لها)، راجع [بحث Perplexity](/ar/tools/perplexity-search).
</Note>

| الخاصية     | القيمة                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| النوع       | موفّر بحث ويب (وليس موفّر نماذج)                                       |
| المصادقة    | `PERPLEXITY_API_KEY` (أصلي) أو `OPENROUTER_API_KEY` (عبر OpenRouter)    |
| مسار الإعداد | `plugins.entries.perplexity.config.webSearch.apiKey`                   |
| التجاوزات   | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`       |
| الحصول على مفتاح | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) |

## تثبيت Plugin

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## بدء الاستخدام

<Steps>
  <Step title="تعيين مفتاح API">
    ```bash
    openclaw configure --section web
    ```

    أو عيّن المفتاح مباشرةً:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    يعمل أيضًا المفتاح المصدَّر باسم `PERPLEXITY_API_KEY` أو `OPENROUTER_API_KEY` في بيئة Gateway.

  </Step>
  <Step title="بدء البحث">
    يكتشف `web_search` ‏Perplexity تلقائيًا بمجرد أن يصبح مفتاحه بيانات اعتماد البحث المتاحة؛ ولا يلزم أي إعداد إضافي. لتثبيت الموفّر صراحةً:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## أوضاع البحث

يحدّد Plugin وسيلة النقل بهذا الترتيب:

1. عند تعيين `webSearch.baseUrl` أو `webSearch.model`: يوجّه الطلبات دائمًا عبر إكمالات محادثة Sonar إلى نقطة النهاية تلك، بصرف النظر عن نوع المفتاح.
2. خلاف ذلك، يحدّد مصدر المفتاح نقطة النهاية: تختار بادئة المفتاح المضبوط وسيلة النقل (يتقدّم الإعداد على متغيرات البيئة)؛ ويستخدم مفتاح البيئة نقطة النهاية المطابقة له مباشرةً.

| بادئة المفتاح | وسيلة النقل                                               | الميزات                                            |
| ------------- | --------------------------------------------------------- | -------------------------------------------------- |
| `pplx-`       | واجهة Perplexity Search API الأصلية (`https://api.perplexity.ai`) | نتائج منظّمة وعوامل تصفية للنطاق واللغة والتاريخ |
| `sk-or-`      | OpenRouter (`https://openrouter.ai/api/v1`)، نموذج Sonar  | إجابات مولّدة بالذكاء الاصطناعي مع استشهادات       |

يستخدم المفتاح المضبوط ذو أي بادئة أخرى واجهة Search API الأصلية أيضًا. يستخدم مسار إكمالات المحادثة نموذج `perplexity/sonar-pro` افتراضيًا؛ ويمكن تجاوزه باستخدام `plugins.entries.perplexity.config.webSearch.model`.

## التصفية في واجهة API الأصلية

| عامل التصفية                         | الوصف                                                          | وسيلة النقل     |
| ------------------------------------ | -------------------------------------------------------------- | --------------- |
| `count`                              | عدد النتائج لكل بحث، من 1 إلى 10 (الافتراضي 5)                | الأصلية فقط     |
| `freshness`                          | نافذة الحداثة: `day`، `week`، `month`، `year`                  | كلتاهما         |
| `country`                            | رمز بلد من حرفين (`us`، `de`، `jp`)                            | الأصلية فقط     |
| `language`                           | رمز لغة ISO 639-1 ‏(`en`، `fr`، `zh`)                          | الأصلية فقط     |
| `date_after` / `date_before`         | نطاق تاريخ النشر بالتنسيق `YYYY-MM-DD`                         | الأصلية فقط     |
| `domain_filter`                      | 20 نطاقًا كحد أقصى؛ قائمة سماح أو قائمة منع مسبوقة بـ `-`، ولا يجوز الجمع بينهما | الأصلية فقط |
| `max_tokens` / `max_tokens_per_page` | ميزانية المحتوى عبر جميع النتائج / لكل صفحة                   | الأصلية فقط     |

تعيد عوامل التصفية الخاصة بالواجهة الأصلية خطأً وصفيًا عند استخدامها في مسار إكمالات المحادثة.
لا يمكن الجمع بين `freshness` و`date_after`/`date_before`.

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="متغير البيئة لعمليات الخدمة الخلفية">
    <Warning>
    لا يكون المفتاح المصدَّر في صدفة تفاعلية فقط مرئيًا لخدمة Gateway الخلفية التي يديرها launchd/systemd، ما لم تُستورد تلك البيئة صراحةً. عيّن المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لكي تتمكن عملية Gateway من قراءته. راجع [متغيرات البيئة](/ar/help/environment) للاطلاع على ترتيب الأولوية الكامل.
    </Warning>
  </Accordion>

  <Accordion title="إعداد وكيل OpenRouter">
    لتوجيه عمليات بحث Perplexity عبر OpenRouter، عيّن `OPENROUTER_API_KEY` (بالبادئة `sk-or-`) بدلًا من مفتاح Perplexity أصلي. يكتشف OpenClaw المفتاح وينتقل تلقائيًا إلى وسيلة نقل Sonar. يفيد ذلك إذا كنت قد أعددت الفوترة في OpenRouter وتريد توحيد الموفّرين هناك.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="أداة بحث Perplexity" href="/ar/tools/perplexity-search" icon="magnifying-glass">
    كيفية استدعاء الوكيل لعمليات بحث Perplexity وتفسيره للنتائج.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعداد الكامل، بما في ذلك إدخالات Plugin.
  </Card>
</CardGroup>
