---
read_when:
    - تريد استخدام توليد الفيديو عبر Alibaba Wan في OpenClaw
    - تحتاج إلى إعداد مفتاح API لـ Model Studio أو DashScope لتوليد الفيديو
summary: توليد الفيديو باستخدام Alibaba Model Studio Wan في OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T08:08:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw يوفّر Plugin مضمّنًا باسم `alibaba` يسجّل موفّرًا لتوليد الفيديو لنماذج Wan على Alibaba Model Studio (الاسم الدولي لـ DashScope). يكون الـ Plugin مفعّلًا افتراضيًا؛ ما عليك سوى تعيين مفتاح API.

| الخاصية              | القيمة                                                                          |
| -------------------- | ------------------------------------------------------------------------------- |
| معرّف الموفّر         | `alibaba`                                                                       |
| Plugin               | مضمّن، `enabledByDefault: true`                                                 |
| متغيرات بيئة المصادقة | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (أول تطابق يفوز) |
| علامة الإعداد الأولي  | `--auth-choice alibaba-model-studio-api-key`                                    |
| علامة CLI المباشرة    | `--alibaba-model-studio-api-key <key>`                                          |
| النموذج الافتراضي     | `alibaba/wan2.6-t2v`                                                            |
| عنوان URL الأساسي الافتراضي | `https://dashscope-intl.aliyuncs.com`                                           |

## البدء

<Steps>
  <Step title="Set an API key">
    استخدم الإعداد الأولي لتخزين المفتاح مقابل موفّر `alibaba`:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    أو مرّر المفتاح مباشرة أثناء التثبيت/الإعداد الأولي:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    أو صدّر أيًا من متغيرات البيئة المقبولة قبل بدء Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Set a default video model">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify the provider is configured">
    ```bash
    openclaw models list --provider alibaba
    ```

    يجب أن تتضمن القائمة جميع نماذج Wan الخمسة المضمّنة. إذا لم يتم حل `MODELSTUDIO_API_KEY`، فإن `openclaw models status --json` يبلّغ عن بيانات الاعتماد المفقودة ضمن `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  يتوثّق كل من Plugin Alibaba و[Plugin Qwen](/ar/providers/qwen) مقابل DashScope ويقبلان متغيرات بيئة متداخلة. استخدم معرّفات النماذج `alibaba/...` لتشغيل سطح فيديو Wan المخصص؛ واستخدم معرّفات `qwen/...` عندما تريد سطح الدردشة أو التضمين أو فهم الوسائط الخاص بـ Qwen.
</Note>

## نماذج Wan المضمّنة

| مرجع النموذج               | الوضع                    |
| -------------------------- | ------------------------ |
| `alibaba/wan2.6-t2v`       | نص إلى فيديو (افتراضي)  |
| `alibaba/wan2.6-i2v`       | صورة إلى فيديو          |
| `alibaba/wan2.6-r2v`       | مرجع إلى فيديو          |
| `alibaba/wan2.6-r2v-flash` | مرجع إلى فيديو (سريع)   |
| `alibaba/wan2.7-r2v`       | مرجع إلى فيديو          |

## القدرات والحدود

يعكس الموفّر المضمّن حدود واجهة API لفيديو Wan في DashScope. تشترك الأوضاع الثلاثة كلها في عدد الفيديوهات لكل طلب وحد مدة الفيديو نفسه؛ ويختلف شكل الإدخال فقط.

| الوضع              | الحد الأقصى للفيديوهات الناتجة | الحد الأقصى لصور الإدخال | الحد الأقصى لفيديوهات الإدخال | الحد الأقصى للمدة | عناصر التحكم المدعومة                                      |
| ------------------ | ------------------------------ | ------------------------- | ------------------------------ | ----------------- | ---------------------------------------------------------- |
| نص إلى فيديو       | 1                              | غير متاح                  | غير متاح                       | 10 ث              | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| صورة إلى فيديو     | 1                              | 1                         | غير متاح                       | 10 ث              | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| مرجع إلى فيديو     | 1                              | غير متاح                  | 4                              | 10 ث              | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

عندما لا يضمّن الطلب `durationSeconds`، يرسل الموفّر القيمة الافتراضية المقبولة لدى DashScope وهي **5 ثوانٍ**. عيّن `durationSeconds` صراحةً في [أداة توليد الفيديو](/ar/tools/video-generation) للتمديد حتى 10 ثوانٍ.

<Warning>
  يجب أن تكون إدخالات الصور والفيديو المرجعية عناوين URL بعيدة من نوع `http(s)`. لا تقبل أوضاع المرجع في DashScope مسارات الملفات المحلية؛ ارفعها إلى تخزين كائنات أولًا أو استخدم مسار [أداة الوسائط](/ar/tools/media-overview) الذي ينتج عنوان URL عامًا بالفعل.
</Warning>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="Override the DashScope base URL">
    يستخدم الموفّر نقطة نهاية DashScope الدولية افتراضيًا. لاستهداف نقطة نهاية منطقة الصين، عيّن:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    يزيل الموفّر الشرطات المائلة اللاحقة قبل إنشاء عناوين URL لمهام AIGC.

  </Accordion>

  <Accordion title="Auth env priority">
    يحل OpenClaw مفتاح API الخاص بـ Alibaba من متغيرات البيئة بهذا الترتيب، مع أخذ أول قيمة غير فارغة:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    تتجاوز إدخالات `auth.profiles` المضبوطة (عبر `openclaw models auth login`) حل متغيرات البيئة. راجع [ملفات تعريف المصادقة في الأسئلة الشائعة للنماذج](/ar/help/faq-models#what-is-an-auth-profile) لمعرفة آليات تدوير الملفات الشخصية وفترات التهدئة والتجاوز.

  </Accordion>

  <Accordion title="Relationship to the Qwen plugin">
    يتصل كلا الـ Pluginين المضمّنين بـ DashScope ويقبلان مفاتيح API متداخلة. استخدم:

    - معرّفات `alibaba/wan*.*` لتشغيل موفّر فيديو Wan المخصص الموثّق في هذه الصفحة.
    - معرّفات `qwen/*` لدردشة Qwen والتضمين وفهم الوسائط (راجع [Qwen](/ar/providers/qwen)).

    تعيين `MODELSTUDIO_API_KEY` مرة واحدة يصادق كلا الـ Pluginين لأن قائمة متغيرات بيئة المصادقة تتداخل عمدًا؛ لست بحاجة إلى إعداد كل Plugin على حدة.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Video generation" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="Qwen" href="/ar/providers/qwen" icon="microchip">
    إعداد دردشة Qwen والتضمين وفهم الوسائط باستخدام مصادقة DashScope نفسها.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    الإعدادات الافتراضية للوكلاء وإعدادات النماذج.
  </Card>
  <Card title="Models FAQ" href="/ar/help/faq-models" icon="circle-question">
    ملفات تعريف المصادقة، وتبديل النماذج، وحل أخطاء "no profile".
  </Card>
</CardGroup>
