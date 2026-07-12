---
read_when:
    - تريد استخدام إنشاء الفيديو عبر Alibaba Wan في OpenClaw
    - تحتاج إلى إعداد مفتاح API لـ Model Studio أو DashScope لإنشاء الفيديو
summary: توليد الفيديو باستخدام Alibaba Model Studio Wan في OpenClaw
title: استوديو نماذج Alibaba
x-i18n:
    generated_at: "2026-07-12T06:20:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

يسجّل Plugin `alibaba` المضمّن موفّرًا لتوليد الفيديو لنماذج Wan على Alibaba Model Studio (الاسم الدولي لـ DashScope). وهو مفعّل افتراضيًا؛ ولا يلزم سوى مفتاح API.

| الخاصية                    | القيمة                                                                          |
| -------------------------- | ------------------------------------------------------------------------------- |
| معرّف الموفّر              | `alibaba`                                                                       |
| Plugin                     | مضمّن، `enabledByDefault: true`                                                  |
| متغيرات بيئة المصادقة      | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (يُعتمد أول تطابق) |
| خيار الإعداد الأولي        | `--auth-choice alibaba-model-studio-api-key`                                    |
| خيار CLI المباشر           | `--alibaba-model-studio-api-key <key>`                                          |
| النموذج الافتراضي          | `alibaba/wan2.6-t2v`                                                            |
| عنوان URL الأساسي الافتراضي | `https://dashscope-intl.aliyuncs.com`                                           |

## بدء الاستخدام

<Steps>
  <Step title="تعيين مفتاح API">
    خزّن المفتاح لدى الموفّر `alibaba` من خلال الإعداد الأولي:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    أو مرّر المفتاح مباشرةً:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    أو صدّر أحد متغيرات البيئة المقبولة قبل تشغيل Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # أو DASHSCOPE_API_KEY=...
    # أو QWEN_API_KEY=...
    ```

  </Step>
  <Step title="تعيين نموذج فيديو افتراضي">
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
  <Step title="التحقق من إعداد الموفّر">
    ```bash
    openclaw models list --provider alibaba
    ```

    تتضمن القائمة جميع نماذج Wan الخمسة المضمّنة. إذا تعذّر العثور على `MODELSTUDIO_API_KEY`، فسيعرض `openclaw models status --json` بيانات الاعتماد المفقودة ضمن `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  يستخدم كل من Plugin Alibaba و[Plugin Qwen](/ar/providers/qwen) المصادقة عبر DashScope ويقبلان متغيرات بيئة متداخلة. استخدم معرّفات النماذج `alibaba/...` لواجهة فيديو Wan المخصصة؛ واستخدم معرّفات `qwen/...` لمحادثة Qwen أو التضمين أو فهم الوسائط.
</Note>

## نماذج Wan المضمّنة

| مرجع النموذج               | الوضع                            |
| -------------------------- | -------------------------------- |
| `alibaba/wan2.6-t2v`       | تحويل النص إلى فيديو (افتراضي)   |
| `alibaba/wan2.6-i2v`       | تحويل الصورة إلى فيديو           |
| `alibaba/wan2.6-r2v`       | تحويل المرجع إلى فيديو           |
| `alibaba/wan2.6-r2v-flash` | تحويل المرجع إلى فيديو (سريع)    |
| `alibaba/wan2.7-r2v`       | تحويل المرجع إلى فيديو           |

## الإمكانات والحدود

تشترك الأوضاع الثلاثة جميعها في الحد نفسه لعدد مقاطع الفيديو ومدة الفيديو لكل طلب؛ ويختلف شكل الإدخال فقط.

| الوضع                  | الحد الأقصى لمقاطع الفيديو الناتجة | الحد الأقصى لصور الإدخال | الحد الأقصى لمقاطع فيديو الإدخال | المدة القصوى | عناصر التحكم المدعومة                                     |
| ---------------------- | ---------------------------------- | ------------------------ | -------------------------------- | ------------ | --------------------------------------------------------- |
| تحويل النص إلى فيديو   | 1                                  | غير منطبق                | غير منطبق                        | 10 ثوانٍ     | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| تحويل الصورة إلى فيديو | 1                                  | 1                        | غير منطبق                        | 10 ثوانٍ     | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| تحويل المرجع إلى فيديو | 1                                  | غير منطبق                | 4                                | 10 ثوانٍ     | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

يحصل الطلب الذي لا يحدد `durationSeconds` على القيمة الافتراضية المقبولة لدى DashScope، وهي **5 ثوانٍ**. عيّن `durationSeconds` صراحةً في [أداة توليد الفيديو](/ar/tools/video-generation) لتمديد المدة حتى 10 ثوانٍ.

<Warning>
  يجب أن تكون مُدخلات الصور ومقاطع الفيديو المرجعية عناوين URL بعيدة من نوع `http(s)`؛ إذ ترفض أوضاع المراجع في DashScope مسارات الملفات المحلية. ارفعها أولًا إلى مساحة تخزين للكائنات، أو استخدم مسار [أداة الوسائط](/ar/tools/media-overview) الذي ينتج بالفعل عنوان URL عامًا.
</Warning>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="تجاوز عنوان URL الأساسي لـ DashScope">
    يستخدم الموفّر افتراضيًا نقطة نهاية DashScope الدولية. لاستهداف نقطة النهاية الخاصة بمنطقة الصين:

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

  <Accordion title="أولوية متغيرات بيئة المصادقة">
    يعثر OpenClaw على مفتاح API الخاص بـ Alibaba من متغيرات البيئة وفق الترتيب التالي، ويعتمد أول قيمة غير فارغة:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    تتجاوز إدخالات `auth.profiles` المُعدّة (التي تُعيّن عبر `openclaw models auth login`) آلية العثور على القيمة من متغيرات البيئة. راجع [ملفات تعريف المصادقة في الأسئلة الشائعة حول النماذج](/ar/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) للتعرّف على آليات تدوير ملفات التعريف وفترة التهدئة والتجاوز.

  </Accordion>

  <Accordion title="العلاقة مع Plugin Qwen">
    يتصل كلا الـ Plugin المضمّنين بـ DashScope ويقبلان مفاتيح API متداخلة. استخدم:

    - معرّفات `alibaba/wan*.*` لموفّر فيديو Wan المخصص والموثّق في هذه الصفحة.
    - معرّفات `qwen/*` لمحادثة Qwen والتضمين وفهم الوسائط (راجع [Qwen](/ar/providers/qwen)).

    يؤدي تعيين `MODELSTUDIO_API_KEY` مرة واحدة إلى مصادقة كلا الـ Plugin، لأن قائمة متغيرات بيئة المصادقة متداخلة عن قصد؛ ولا يلزم إجراء الإعداد الأولي لكل Plugin على حدة.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="Qwen" href="/ar/providers/qwen" icon="microchip">
    إعداد محادثة Qwen والتضمين وفهم الوسائط باستخدام مصادقة DashScope نفسها.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    الإعدادات الافتراضية للوكيل وإعداد النماذج.
  </Card>
  <Card title="الأسئلة الشائعة حول النماذج" href="/ar/help/faq-models" icon="circle-question">
    ملفات تعريف المصادقة وتبديل النماذج وحل أخطاء "عدم وجود ملف تعريف".
  </Card>
</CardGroup>
