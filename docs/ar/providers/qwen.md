---
read_when:
    - تريد استخدام Qwen مع OpenClaw
    - سبق أن استخدمت Qwen OAuth
summary: استخدم Qwen Cloud عبر موفر qwen المضمّن مع OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-30T08:22:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898a7ef1f071c838f3bd877632dd06cf0e6112adfa2833895280f99642df56e6
    source_path: providers/qwen.md
    workflow: 16
---

<Warning>

**تمت إزالة Qwen OAuth.** لم يعد تكامل OAuth للطبقة المجانية
(`qwen-portal`) الذي كان يستخدم نقاط نهاية `portal.qwen.ai` متاحًا.
راجع [المشكلة #49557](https://github.com/openclaw/openclaw/issues/49557) للاطلاع على
الخلفية.

</Warning>

يتعامل OpenClaw الآن مع Qwen كمزوّد مضمّن من الدرجة الأولى بالمعرّف الأساسي
`qwen`. يستهدف المزوّد المضمّن نقاط نهاية Qwen Cloud / Alibaba DashScope و
Coding Plan، ويُبقي معرّفات `modelstudio` القديمة عاملة كاسم مستعار
للتوافق.

- المزوّد: `qwen`
- متغير البيئة المفضّل: `QWEN_API_KEY`
- مقبول أيضًا للتوافق: `MODELSTUDIO_API_KEY`، `DASHSCOPE_API_KEY`
- نمط API: متوافق مع OpenAI

<Tip>
إذا كنت تريد `qwen3.6-plus`، ففضّل نقطة نهاية **Standard (الدفع حسب الاستخدام)**.
قد يتأخر دعم Coding Plan عن الفهرس العام.
</Tip>

## البدء

اختر نوع خطتك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Coding Plan (اشتراك)">
    **الأفضل لـ:** الوصول القائم على الاشتراك عبر Qwen Coding Plan.

    <Steps>
      <Step title="احصل على مفتاح API">
        أنشئ مفتاح API أو انسخه من [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        لنقطة النهاية **العالمية**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        لنقطة النهاية **الصينية**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="عيّن نموذجًا افتراضيًا">
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
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    ما زالت معرّفات اختيار المصادقة القديمة `modelstudio-*` ومراجع النماذج `modelstudio/...`
    تعمل كأسماء مستعارة للتوافق، لكن يجب أن تفضّل تدفقات الإعداد الجديدة
    معرّفات اختيار المصادقة الأساسية `qwen-*` ومراجع النماذج `qwen/...`. إذا عرّفت إدخالًا
    مخصصًا مطابقًا `models.providers.modelstudio` بقيمة `api` أخرى، فسيملك ذلك
    المزوّد المخصص مراجع `modelstudio/...` بدلًا من الاسم المستعار لتوافق Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (الدفع حسب الاستخدام)">
    **الأفضل لـ:** الوصول بالدفع حسب الاستخدام عبر نقطة نهاية Standard Model Studio، بما في ذلك نماذج مثل `qwen3.6-plus` التي قد لا تكون متاحة في Coding Plan.

    <Steps>
      <Step title="احصل على مفتاح API">
        أنشئ مفتاح API أو انسخه من [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        لنقطة النهاية **العالمية**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        لنقطة النهاية **الصينية**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="عيّن نموذجًا افتراضيًا">
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
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    ما زالت معرّفات اختيار المصادقة القديمة `modelstudio-*` ومراجع النماذج `modelstudio/...`
    تعمل كأسماء مستعارة للتوافق، لكن يجب أن تفضّل تدفقات الإعداد الجديدة
    معرّفات اختيار المصادقة الأساسية `qwen-*` ومراجع النماذج `qwen/...`. إذا عرّفت إدخالًا
    مخصصًا مطابقًا `models.providers.modelstudio` بقيمة `api` أخرى، فسيملك ذلك
    المزوّد المخصص مراجع `modelstudio/...` بدلًا من الاسم المستعار لتوافق Qwen.
    </Note>

  </Tab>
</Tabs>

## أنواع الخطط ونقاط النهاية

| الخطة                      | المنطقة | اختيار المصادقة           | نقطة النهاية                                      |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (الدفع حسب الاستخدام) | الصين  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (الدفع حسب الاستخدام) | عالمي | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (اشتراك) | الصين  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (اشتراك) | عالمي | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

يختار المزوّد نقطة النهاية تلقائيًا بناءً على اختيار المصادقة لديك. تستخدم
الاختيارات الأساسية عائلة `qwen-*`؛ ويظل `modelstudio-*` للتوافق فقط.
يمكنك التجاوز باستخدام `baseUrl` مخصص في الإعدادات.

<Tip>
**إدارة المفاتيح:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**المستندات:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## الفهرس المضمّن

يشحن OpenClaw حاليًا فهرس Qwen المضمّن هذا. الفهرس المضبوط
مدرك لنقطة النهاية: تُسقط إعدادات Coding Plan النماذج المعروفة فقط بأنها تعمل على
نقطة نهاية Standard.

| مرجع النموذج                | الإدخال      | السياق    | ملاحظات                                           |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | نص، صورة | 1,000,000 | النموذج الافتراضي                                  |
| `qwen/qwen3.6-plus`         | نص، صورة | 1,000,000 | فضّل نقاط نهاية Standard عندما تحتاج إلى هذا النموذج |
| `qwen/qwen3-max-2026-01-23` | نص        | 262,144   | خط Qwen Max                                      |
| `qwen/qwen3-coder-next`     | نص        | 262,144   | البرمجة                                             |
| `qwen/qwen3-coder-plus`     | نص        | 1,000,000 | البرمجة                                             |
| `qwen/MiniMax-M2.5`         | نص        | 1,000,000 | Reasoning مفعّل                                  |
| `qwen/glm-5`                | نص        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | نص        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | نص، صورة | 262,144   | Moonshot AI عبر Alibaba                            |

<Note>
قد يظل التوفر مختلفًا حسب نقطة النهاية وخطة الفوترة حتى عندما يكون النموذج
موجودًا في الفهرس المضمّن.
</Note>

## عناصر التحكم في التفكير

بالنسبة إلى نماذج Qwen Cloud المفعّل فيها Reasoning، يربط المزوّد المضمّن مستويات
التفكير في OpenClaw بعلم الطلب العلوي `enable_thinking` في DashScope. يرسل
تعطيل التفكير `enable_thinking: false`؛ وترسل مستويات التفكير الأخرى
`enable_thinking: true`.

## الإضافات متعددة الوسائط

يكشف Plugin `qwen` أيضًا عن قدرات متعددة الوسائط على نقاط نهاية DashScope
**Standard** (وليس نقاط نهاية Coding Plan):

- **فهم الفيديو** عبر `qwen-vl-max-latest`
- **توليد فيديو Wan** عبر `wan2.6-t2v` (افتراضي)، `wan2.6-i2v`، `wan2.6-r2v`، `wan2.6-r2v-flash`، `wan2.7-r2v`

لاستخدام Qwen كمزوّد الفيديو الافتراضي:

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
راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="فهم الصور والفيديو">
    يسجل Plugin Qwen المضمّن فهم الوسائط للصور والفيديو
    على نقاط نهاية DashScope **Standard** (وليس نقاط نهاية Coding Plan).

    | الخاصية      | القيمة                 |
    | ------------- | --------------------- |
    | النموذج       | `qwen-vl-max-latest`  |
    | الإدخال المدعوم | الصور، الفيديو       |

    يُحل فهم الوسائط تلقائيًا من مصادقة Qwen المضبوطة — ولا توجد
    حاجة إلى إعدادات إضافية. تأكد من أنك تستخدم نقطة نهاية Standard (الدفع حسب الاستخدام)
    لدعم فهم الوسائط.

  </Accordion>

  <Accordion title="توفر Qwen 3.6 Plus">
    يتوفر `qwen3.6-plus` على نقاط نهاية Standard (الدفع حسب الاستخدام) في Model Studio:

    - الصين: `dashscope.aliyuncs.com/compatible-mode/v1`
    - عالمي: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    إذا أعادت نقاط نهاية Coding Plan خطأ "نموذج غير مدعوم" لـ
    `qwen3.6-plus`، فانتقل إلى Standard (الدفع حسب الاستخدام) بدلًا من زوج
    نقطة النهاية/المفتاح الخاص بـ Coding Plan.

    لا يعلن فهرس Qwen المضمّن في OpenClaw عن `qwen3.6-plus` على نقاط نهاية Coding
    Plan، لكن تُحترم إدخالات `qwen/qwen3.6-plus` المضبوطة صراحةً ضمن
    `models.providers.qwen.models` على عناوين baseUrls الخاصة بـ Coding Plan بحيث
    يمكنك تفعيل ذلك النموذج إذا فعّلته Aliyun في اشتراكك. ما زالت
    API الصاعدة هي التي تقرر ما إذا كان الاستدعاء سينجح.

  </Accordion>

  <Accordion title="خطة القدرات">
    يتم تموضع Plugin `qwen` كموطن المورّد لسطح Qwen
    Cloud الكامل، وليس فقط نماذج البرمجة/النص.

    - **نماذج النص/الدردشة:** مضمّنة الآن
    - **استدعاء الأدوات، والمخرجات المنظمة، والتفكير:** موروثة من النقل المتوافق مع OpenAI
    - **توليد الصور:** مخطط له على طبقة provider-plugin
    - **فهم الصور/الفيديو:** مضمّن الآن على نقطة نهاية Standard
    - **الكلام/الصوت:** مخطط له على طبقة provider-plugin
    - **تضمينات الذاكرة/إعادة الترتيب:** مخطط لها عبر سطح محول التضمين
    - **توليد الفيديو:** مضمّن الآن عبر قدرة توليد الفيديو المشتركة

  </Accordion>

  <Accordion title="تفاصيل توليد الفيديو">
    بالنسبة إلى توليد الفيديو، يربط OpenClaw منطقة Qwen المضبوطة بمضيف
    DashScope AIGC المطابق قبل إرسال المهمة:

    - عالمي/دولي: `https://dashscope-intl.aliyuncs.com`
    - الصين: `https://dashscope.aliyuncs.com`

    هذا يعني أن `models.providers.qwen.baseUrl` عاديًا يشير إلى مضيفي Qwen
    الخاصين بـ Coding Plan أو Standard سيظل يُبقي توليد الفيديو على نقطة نهاية
    فيديو DashScope الإقليمية الصحيحة.

    حدود توليد الفيديو المضمّنة الحالية في Qwen:

    - ما يصل إلى **1** فيديو إخراج لكل طلب
    - ما يصل إلى **1** صورة إدخال
    - ما يصل إلى **4** فيديوهات إدخال
    - ما يصل إلى **10 ثوانٍ** مدة
    - يدعم `size` و`aspectRatio` و`resolution` و`audio` و`watermark`
    - يتطلب وضع صورة/فيديو المرجع حاليًا **عناوين URL بعيدة بصيغة http(s)**. تُرفض
      مسارات الملفات المحلية مبكرًا لأن نقطة نهاية فيديو DashScope لا تقبل
      مخازن محلية مرفوعة لتلك المراجع.

  </Accordion>

  <Accordion title="توافق استخدام البث">
    تعلن نقاط نهاية Model Studio الأصلية عن توافق استخدام البث على
    نقل `openai-completions` المشترك. يربط OpenClaw ذلك الآن بقدرات نقطة النهاية،
    لذلك ترث معرّفات المزوّدين المخصصة المتوافقة مع DashScope التي تستهدف
    المضيفين الأصليين أنفسهم سلوك استخدام البث نفسه بدلًا من
    اشتراط معرّف المزوّد المضمّن `qwen` تحديدًا.

    ينطبق توافق استخدام البث الأصلي على مضيفي Coding Plan وعلى
    المضيفين المتوافقين مع Standard DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="مناطق نقاط النهاية متعددة الوسائط">
    تستخدم الأسطح متعددة الوسائط (فهم الفيديو وتوليد فيديو Wan)
    نقاط نهاية DashScope **Standard**، وليس نقاط نهاية Coding Plan:

    - عنوان URL الأساسي العالمي/الدولي لـ Standard: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - عنوان URL الأساسي الصيني لـ Standard: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="إعداد البيئة والبرنامج الخفي">
    إذا كان Gateway يعمل كبرنامج خفي (launchd/systemd)، فتأكد من أن `QWEN_API_KEY` متاح
    لذلك process (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/ar/providers/alibaba" icon="cloud">
    مزوّد ModelStudio القديم وملاحظات الترحيل.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها العام والأسئلة الشائعة.
  </Card>
</CardGroup>
