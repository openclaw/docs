---
read_when:
    - تريد استخدام Qwen مع OpenClaw
    - لقد استخدمت سابقًا Qwen OAuth
summary: استخدم Qwen Cloud عبر مزوّد qwen المضمن في OpenClaw
title: Qwen
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T08:00:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**تمت إزالة Qwen OAuth.** لم يعد تكامل OAuth الخاص بالطبقة المجانية
(`qwen-portal`) الذي كان يستخدم نقاط نهاية `portal.qwen.ai` متاحًا.
راجع [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) للحصول على
الخلفية.

</Warning>

يتعامل OpenClaw الآن مع Qwen بوصفه مزوّدًا مضمنًا من الدرجة الأولى بمعرّف مرجعي
`qwen`. ويستهدف المزوّد المضمن نقاط نهاية Qwen Cloud / Alibaba DashScope و
Coding Plan، ويحافظ على عمل معرّفات `modelstudio` القديمة بوصفها
اسمًا بديلًا للتوافق.

- المزوّد: `qwen`
- متغير البيئة المفضل: `QWEN_API_KEY`
- يُقبل أيضًا للتوافق: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- نمط API: متوافق مع OpenAI

<Tip>
إذا كنت تريد `qwen3.6-plus`, ففضّل نقطة نهاية **Standard (الدفع حسب الاستخدام)**.
فقد يتأخر دعم Coding Plan عن الكتالوج العام.
</Tip>

## البدء

اختر نوع خطتك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Coding Plan (اشتراك)">
    **الأفضل لـ:** الوصول القائم على الاشتراك عبر Qwen Coding Plan.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API أو انسخه من [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        لنقطة النهاية **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        ولنقطة النهاية **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    ما تزال معرّفات `modelstudio-*` القديمة الخاصة بخيارات المصادقة ومراجع النماذج `modelstudio/...`
    تعمل كأسماء بديلة للتوافق، لكن تدفقات الإعداد الجديدة يجب أن تفضّل
    معرّفات خيارات المصادقة المرجعية `qwen-*` ومراجع النماذج `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (الدفع حسب الاستخدام)">
    **الأفضل لـ:** الوصول بنظام الدفع حسب الاستخدام عبر نقطة نهاية Standard Model Studio، بما في ذلك نماذج مثل `qwen3.6-plus` التي قد لا تكون متاحة ضمن Coding Plan.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API أو انسخه من [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        لنقطة النهاية **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        ولنقطة النهاية **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    ما تزال معرّفات `modelstudio-*` القديمة الخاصة بخيارات المصادقة ومراجع النماذج `modelstudio/...`
    تعمل كأسماء بديلة للتوافق، لكن تدفقات الإعداد الجديدة يجب أن تفضّل
    معرّفات خيارات المصادقة المرجعية `qwen-*` ومراجع النماذج `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## أنواع الخطط ونقاط النهاية

| الخطة                      | المنطقة | خيار المصادقة              | نقطة النهاية                                     |
| -------------------------- | ------- | -------------------------- | ------------------------------------------------ |
| Standard (الدفع حسب الاستخدام) | الصين   | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (الدفع حسب الاستخدام) | عالمي   | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (اشتراك)       | الصين   | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (اشتراك)       | عالمي   | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

يختار المزوّد نقطة النهاية تلقائيًا بناءً على خيار المصادقة لديك. وتستخدم
الخيارات المرجعية عائلة `qwen-*`؛ أما `modelstudio-*` فتبقى للتوافق فقط.
ويمكنك التجاوز باستخدام `baseUrl` مخصص في الإعدادات.

<Tip>
**إدارة المفاتيح:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**الوثائق:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## الكتالوج المضمن

يشحن OpenClaw حاليًا كتالوج Qwen المضمن التالي. والكتالوج المضبوط
واعٍ بنقطة النهاية: إذ إن إعدادات Coding Plan تحذف النماذج المعروفة بأنها تعمل
فقط على نقطة نهاية Standard.

| مرجع النموذج                | الإدخال      | السياق     | ملاحظات                                             |
| -------------------------- | ------------ | ---------- | --------------------------------------------------- |
| `qwen/qwen3.5-plus`        | نص، صورة     | 1,000,000  | النموذج الافتراضي                                   |
| `qwen/qwen3.6-plus`        | نص، صورة     | 1,000,000  | فضّل نقاط نهاية Standard عند الحاجة إلى هذا النموذج |
| `qwen/qwen3-max-2026-01-23` | نص          | 262,144    | خط Qwen Max                                         |
| `qwen/qwen3-coder-next`    | نص           | 262,144    | برمجة                                               |
| `qwen/qwen3-coder-plus`    | نص           | 1,000,000  | برمجة                                               |
| `qwen/MiniMax-M2.5`        | نص           | 1,000,000  | الاستدلال مفعّل                                     |
| `qwen/glm-5`               | نص           | 202,752    | GLM                                                 |
| `qwen/glm-4.7`             | نص           | 202,752    | GLM                                                 |
| `qwen/kimi-k2.5`           | نص، صورة     | 262,144    | Moonshot AI عبر Alibaba                             |

<Note>
قد يختلف التوفر مع ذلك بحسب نقطة النهاية وخطة الفوترة حتى عندما يكون النموذج
موجودًا في الكتالوج المضمن.
</Note>

## إضافات متعددة الوسائط

يكشف Plugin ‏`qwen` أيضًا عن إمكانات متعددة الوسائط على نقاط نهاية DashScope
**Standard** ‏(وليس نقاط نهاية Coding Plan):

- **فهم الفيديو** عبر `qwen-vl-max-latest`
- **توليد فيديو Wan** عبر `wan2.6-t2v` ‏(الافتراضي)، و`wan2.6-i2v`، و`wan2.6-r2v`، و`wan2.6-r2v-flash`، و`wan2.7-r2v`

لاستخدام Qwen كمزوّد فيديو افتراضي:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
راجع [توليد الفيديو](/ar/tools/video-generation) للاطلاع على معلمات الأدوات المشتركة، واختيار المزوّد، وسلوك الرجوع عند الفشل.
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="فهم الصور والفيديو">
    يسجل Plugin ‏Qwen المضمن فهم الوسائط للصور والفيديو
    على نقاط نهاية DashScope **Standard** ‏(وليس نقاط نهاية Coding Plan).

    | الخاصية        | القيمة                |
    | -------------- | --------------------- |
    | النموذج        | `qwen-vl-max-latest`  |
    | الإدخال المدعوم | الصور، الفيديو       |

    يتم تحليل فهم الوسائط تلقائيًا من مصادقة Qwen المضبوطة — ولا
    حاجة إلى إعدادات إضافية. تأكد من أنك تستخدم نقطة نهاية Standard (الدفع حسب الاستخدام)
    لدعم فهم الوسائط.

  </Accordion>

  <Accordion title="توفر Qwen 3.6 Plus">
    يتوفر `qwen3.6-plus` على نقاط نهاية Standard (الدفع حسب الاستخدام) الخاصة بـ Model Studio:

    - الصين: `dashscope.aliyuncs.com/compatible-mode/v1`
    - عالمي: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    إذا أعادت نقاط نهاية Coding Plan خطأ "unsupported model" بالنسبة إلى
    `qwen3.6-plus`، فانتقل إلى Standard (الدفع حسب الاستخدام) بدلًا من
    زوج نقطة النهاية/المفتاح الخاص بـ Coding Plan.

  </Accordion>

  <Accordion title="خطة الإمكانات">
    يتم وضع Plugin ‏`qwen` باعتباره بيت المزوّد لسطح Qwen
    Cloud الكامل، وليس فقط لنماذج البرمجة/النص.

    - **نماذج النص/الدردشة:** مضمنة الآن
    - **استدعاء الأدوات، والمخرجات المنظمة، والتفكير:** موروثة من النقل المتوافق مع OpenAI
    - **توليد الصور:** مخطط له على مستوى Plugin المزوّد
    - **فهم الصور/الفيديو:** مضمن الآن على نقطة نهاية Standard
    - **الكلام/الصوت:** مخطط له على مستوى Plugin المزوّد
    - **Embeddings/Reranking للذاكرة:** مخطط له عبر سطح محول embeddings
    - **توليد الفيديو:** مضمن الآن عبر إمكانية توليد الفيديو المشتركة

  </Accordion>

  <Accordion title="تفاصيل توليد الفيديو">
    بالنسبة إلى توليد الفيديو، يقوم OpenClaw بتعيين منطقة Qwen المضبوطة إلى
    مضيف DashScope AIGC المطابق قبل إرسال الوظيفة:

    - Global/Intl: ‏`https://dashscope-intl.aliyuncs.com`
    - الصين: `https://dashscope.aliyuncs.com`

    وهذا يعني أن `models.providers.qwen.baseUrl` العادي الذي يشير إلى أي من
    مضيفات Qwen الخاصة بـ Coding Plan أو Standard سيبقي توليد الفيديو على نقطة
    نهاية DashScope الإقليمية الصحيحة للفيديو.

    الحدود الحالية المضمنة لتوليد الفيديو في Qwen:

    - حتى **1** فيديو خرج لكل طلب
    - حتى **1** صورة إدخال
    - حتى **4** فيديوهات إدخال
    - مدة حتى **10 ثوانٍ**
    - يدعم `size`, و`aspectRatio`, و`resolution`, و`audio`, و`watermark`
    - يتطلب وضع الصورة/الفيديو المرجعي حاليًا **عناوين URL بعيدة من نوع http(s)**. وتُرفض
      مسارات الملفات المحلية مسبقًا لأن نقطة نهاية الفيديو في DashScope لا
      تقبل مخازن محلية مرفوعة لتلك المراجع.

  </Accordion>

  <Accordion title="توافق استخدام البث">
    تعلن نقاط نهاية Model Studio الأصلية عن توافق استخدام البث على
    النقل المشترك `openai-completions`. ويعتمد OpenClaw الآن ذلك على إمكانات
    نقطة النهاية، لذا فإن معرّفات المزوّدات المخصصة المتوافقة مع DashScope والتي تستهدف
    المضيفات الأصلية نفسها ترث سلوك استخدام البث نفسه بدلًا من
    اشتراط معرّف المزوّد المضمن `qwen` تحديدًا.

    ينطبق توافق الاستخدام في البث الأصلي على كل من مضيفات Coding Plan و
    المضيفات المتوافقة مع DashScope الخاصة بـ Standard:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="مناطق نقاط النهاية متعددة الوسائط">
    تستخدم الأسطح متعددة الوسائط (فهم الفيديو وتوليد فيديو Wan) نقاط نهاية DashScope
    **Standard**، وليس نقاط نهاية Coding Plan:

    - عنوان URL الأساسي لـ Standard العالمي/الدولي: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - عنوان URL الأساسي لـ Standard في الصين: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="إعداد البيئة وdaemon">
    إذا كانت Gateway تعمل كـ daemon ‏(launchd/systemd)، فتأكد من أن `QWEN_API_KEY`
    متاح لتلك العملية (على سبيل المثال في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع عند الفشل.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/ar/providers/alibaba" icon="cloud">
    مزوّد ModelStudio القديم وملاحظات الترحيل.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء العام والأسئلة الشائعة.
  </Card>
</CardGroup>
