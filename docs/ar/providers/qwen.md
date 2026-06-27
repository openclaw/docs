---
read_when:
    - تريد استخدام Qwen مع OpenClaw
    - لقد استخدمت سابقًا Qwen OAuth
summary: استخدم Qwen Cloud عبر Plugin الخاص به في OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-06-27T18:27:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

يتعامل OpenClaw الآن مع Qwen بصفته Plugin مزوّدًا من الدرجة الأولى بالمعرّف القياسي
`qwen`. يستهدف Plugin المزوّد نقاط نهاية Qwen Cloud / Alibaba DashScope و
Coding Plan، ويحافظ على عمل معرّفات `modelstudio` القديمة كاسم مستعار للتوافق،
ويكشف أيضًا تدفق رمز Qwen Portal كمزوّد `qwen-oauth`.

- المزوّد: `qwen`
- مزوّد البوابة: [`qwen-oauth`](/ar/providers/qwen-oauth)
- متغير البيئة المفضّل: `QWEN_API_KEY`
- مقبول أيضًا للتوافق: `MODELSTUDIO_API_KEY`، `DASHSCOPE_API_KEY`
- نمط API: متوافق مع OpenAI

<Tip>
إذا كنت تريد `qwen3.6-plus`، ففضّل نقطة نهاية **Standard (pay-as-you-go)**.
قد يتأخر دعم Coding Plan عن الفهرس العام.
</Tip>

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## البدء

اختر نوع خطتك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **الأفضل لـ:** الوصول القائم على الاشتراك عبر Qwen Coding Plan.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API أو انسخه من [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="شغّل التهيئة الأولية">
        لنقطة النهاية **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        لنقطة النهاية **China**:

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
    تعمل كأسماء مستعارة للتوافق، لكن تدفقات الإعداد الجديدة يجب أن تفضّل معرّفات
    اختيار المصادقة القياسية `qwen-*` ومراجع النماذج `qwen/...`. إذا عرّفت إدخال
    `models.providers.modelstudio` مخصصًا ودقيقًا بقيمة `api` أخرى، فإن ذلك
    المزوّد المخصص يملك مراجع `modelstudio/...` بدلًا من اسم توافق Qwen المستعار.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **الأفضل لـ:** الوصول بالدفع حسب الاستخدام عبر نقطة نهاية Standard Model Studio، بما في ذلك نماذج مثل `qwen3.6-plus` التي قد لا تكون متاحة في Coding Plan.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API أو انسخه من [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="شغّل التهيئة الأولية">
        لنقطة النهاية **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        لنقطة النهاية **China**:

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
    تعمل كأسماء مستعارة للتوافق، لكن تدفقات الإعداد الجديدة يجب أن تفضّل معرّفات
    اختيار المصادقة القياسية `qwen-*` ومراجع النماذج `qwen/...`. إذا عرّفت إدخال
    `models.providers.modelstudio` مخصصًا ودقيقًا بقيمة `api` أخرى، فإن ذلك
    المزوّد المخصص يملك مراجع `modelstudio/...` بدلًا من اسم توافق Qwen المستعار.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **الأفضل لـ:** رمز Qwen Portal مقابل `https://portal.qwen.ai/v1`.

    راجع [Qwen OAuth / Portal](/ar/providers/qwen-oauth) لصفحة المزوّد المخصصة
    وملاحظات الترحيل.

    <Steps>
      <Step title="وفّر رمز البوابة الخاص بك">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="عيّن نموذجًا افتراضيًا">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    يستخدم `qwen-oauth` اسم متغير البيئة نفسه `QWEN_API_KEY` الذي يستخدمه مزوّد
    DashScope، لكنه يخزّن المصادقة تحت معرّف المزوّد `qwen-oauth` عند تكوينه
    عبر تهيئة OpenClaw الأولية.
    </Note>

  </Tab>
</Tabs>

## أنواع الخطط ونقاط النهاية

| الخطة                      | المنطقة | اختيار المصادقة           | نقطة النهاية                                      |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

يختار المزوّد نقطة النهاية تلقائيًا بناءً على اختيار المصادقة. تستخدم الخيارات
القياسية عائلة `qwen-*`؛ ويبقى `modelstudio-*` للتوافق فقط.
يمكنك التجاوز باستخدام `baseUrl` مخصص في التكوين.

<Tip>
**إدارة المفاتيح:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**الوثائق:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## الفهرس المدمج

يشحن OpenClaw حاليًا هذا الفهرس الثابت لـ Qwen. الفهرس المكوّن
واعٍ بنقطة النهاية: تكوينات Coding Plan تحذف النماذج المعروفة بأنها تعمل فقط على
نقطة نهاية Standard.

| مرجع النموذج                | الإدخال     | السياق    | ملاحظات                                           |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | نص، صورة    | 1,000,000 | النموذج الافتراضي                                 |
| `qwen/qwen3.6-plus`         | نص، صورة    | 1,000,000 | فضّل نقاط نهاية Standard عندما تحتاج إلى هذا النموذج |
| `qwen/qwen3-max-2026-01-23` | نص          | 262,144   | خط Qwen Max                                       |
| `qwen/qwen3-coder-next`     | نص          | 262,144   | الترميز                                           |
| `qwen/qwen3-coder-plus`     | نص          | 1,000,000 | الترميز                                           |
| `qwen/MiniMax-M2.5`         | نص          | 1,000,000 | التفكير مفعّل                                     |
| `qwen/glm-5`                | نص          | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | نص          | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | نص، صورة    | 262,144   | Moonshot AI عبر Alibaba                            |
| `qwen-oauth/qwen3.5-plus`   | نص، صورة    | 1,000,000 | افتراضي Qwen Portal                               |

<Note>
قد يظل التوفر مختلفًا حسب نقطة النهاية وخطة الفوترة حتى عندما يكون النموذج
موجودًا في الفهرس الثابت.
</Note>

## عناصر التحكم في التفكير

بالنسبة إلى نماذج Qwen Cloud الممكّنة للتفكير، يربط المزوّد
مستويات تفكير OpenClaw بعلامة طلب DashScope العليا `enable_thinking`. يرسل
تعطيل التفكير `enable_thinking: false`؛ وترسل مستويات التفكير الأخرى
`enable_thinking: true`.

## إضافات متعددة الوسائط

يكشف Plugin `qwen` أيضًا قدرات متعددة الوسائط على نقاط نهاية DashScope
**Standard** (وليس نقاط نهاية Coding Plan):

- **فهم الفيديو** عبر `qwen-vl-max-latest`
- **توليد فيديو Wan** عبر `wan2.6-t2v` (الافتراضي)، `wan2.6-i2v`، `wan2.6-r2v`، `wan2.6-r2v-flash`، `wan2.7-r2v`

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

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="فهم الصور والفيديو">
    يسجّل Plugin Qwen فهم الوسائط للصور والفيديو
    على نقاط نهاية DashScope **Standard** (وليس نقاط نهاية Coding Plan).

    | الخاصية      | القيمة                |
    | ------------- | --------------------- |
    | النموذج       | `qwen-vl-max-latest`  |
    | الإدخال المدعوم | صور، فيديو          |

    يتم حل فهم الوسائط تلقائيًا من مصادقة Qwen المكوّنة، ولا حاجة إلى
    تكوين إضافي. تأكد من أنك تستخدم نقطة نهاية Standard (pay-as-you-go)
    لدعم فهم الوسائط.

  </Accordion>

  <Accordion title="توفر Qwen 3.6 Plus">
    يتوفر `qwen3.6-plus` على نقاط نهاية Standard (pay-as-you-go) Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    إذا أرجعت نقاط نهاية Coding Plan خطأ "نموذج غير مدعوم" لـ
    `qwen3.6-plus`، فانتقل إلى Standard (pay-as-you-go) بدلًا من زوج
    نقطة نهاية/مفتاح Coding Plan.

    لا يعلن فهرس Qwen الثابت في OpenClaw عن `qwen3.6-plus` على نقاط نهاية Coding
    Plan، لكن إدخالات `qwen/qwen3.6-plus` المكوّنة صراحة تحت
    `models.providers.qwen.models` تُحترم على `baseUrls` الخاصة بـ Coding Plan حتى
    يمكنك تفعيل ذلك النموذج إذا فعّلته Aliyun على اشتراكك. لا تزال
    API المنبع تقرر ما إذا كان الاستدعاء سينجح.

  </Accordion>

  <Accordion title="خطة القدرات">
    يجري وضع Plugin `qwen` ليكون موطن المورّد لكامل سطح Qwen
    Cloud، وليس فقط نماذج الترميز/النص.

    - **نماذج النص/الدردشة:** متاحة عبر Plugin
    - **استدعاء الأدوات، والمخرجات المهيكلة، والتفكير:** موروثة من النقل المتوافق مع OpenAI
    - **توليد الصور:** مخطط له في طبقة Plugin المزوّد
    - **فهم الصور/الفيديو:** متاح عبر Plugin على نقطة نهاية Standard
    - **الكلام/الصوت:** مخطط له في طبقة Plugin المزوّد
    - **تضمينات الذاكرة/إعادة الترتيب:** مخطط لها عبر سطح محوّل التضمين
    - **توليد الفيديو:** متاح عبر Plugin من خلال قدرة توليد الفيديو المشتركة

  </Accordion>

  <Accordion title="تفاصيل توليد الفيديو">
    بالنسبة إلى توليد الفيديو، يربط OpenClaw منطقة Qwen المكوّنة بمضيف
    DashScope AIGC المطابق قبل إرسال المهمة:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    يعني ذلك أن `models.providers.qwen.baseUrl` العادي الذي يشير إلى مضيفي
    Qwen سواء لـ Coding Plan أو Standard لا يزال يبقي توليد الفيديو على نقطة
    نهاية فيديو DashScope الإقليمية الصحيحة.

    حدود توليد الفيديو الحالية في Qwen:

    - حتى **1** فيديو ناتج لكل طلب
    - حتى **1** صورة إدخال
    - حتى **4** مقاطع فيديو إدخال
    - حتى مدة **10 ثوانٍ**
    - يدعم `size` و`aspectRatio` و`resolution` و`audio` و`watermark`
    - يتطلب وضع صورة/فيديو المرجع حاليًا **عناوين URL بعيدة http(s)**. تُرفض
      مسارات الملفات المحلية مقدمًا لأن نقطة نهاية فيديو DashScope لا
      تقبل مخازن الرفع المحلية لتلك المراجع.

  </Accordion>

  <Accordion title="توافق استخدام البث">
    تعلن نقاط نهاية Model Studio الأصلية عن توافق استخدام البث عبر ناقل
    `openai-completions` المشترك. يعتمد OpenClaw الآن في ذلك على قدرات نقطة
    النهاية، لذلك ترث معرفات المزوّد المخصص المتوافقة مع DashScope والموجّهة إلى
    المضيفين الأصليين أنفسهم سلوك استخدام البث نفسه بدلًا من اشتراط معرف المزوّد
    المضمّن `qwen` تحديدًا.

    ينطبق توافق استخدام البث الأصلي على كلٍّ من مضيفي Coding Plan ومضيفي
    DashScope القياسية المتوافقة:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="مناطق نقاط النهاية متعددة الوسائط">
    تستخدم الأسطح متعددة الوسائط (فهم الفيديو وتوليد فيديو Wan) نقاط نهاية
    DashScope **القياسية**، وليس نقاط نهاية Coding Plan:

    - عنوان URL الأساسي القياسي العالمي/الدولي: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - عنوان URL الأساسي القياسي للصين: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="إعداد البيئة والخدمة الخفية">
    إذا كان Gateway يعمل كخدمة خفية (launchd/systemd)، فتأكد من أن `QWEN_API_KEY`
    متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
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
