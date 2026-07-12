---
read_when:
    - تريد استخدام Qwen مع OpenClaw
    - لديك اشتراك في خطة الرموز المميزة من Alibaba Cloud
    - لقد استخدمت سابقًا مصادقة Qwen عبر OAuth
summary: استخدم Qwen Cloud من خلال Plugin الخاص به في OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-12T06:24:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud هو Plugin مزوّد خارجي رسمي لـ OpenClaw بمعرّف أساسي `qwen`. وهو يستهدف نقاط نهاية Qwen Cloud / Alibaba DashScope للخطة القياسية وخطة البرمجة، ويعرض خطة الرموز باسم `qwen-token-plan`، ويُبقي `modelstudio` اسمًا مستعارًا للتوافق، ويمتلك بصورة مستقلة معرّف المزوّد المخصّص `bailian-token-plan` الموثّق من Alibaba، ويعرض تدفق رمز Qwen Portal باسم [`qwen-oauth`](/ar/providers/qwen-oauth).

| الخاصية                     | القيمة                                     |
| -------------------------- | ------------------------------------------ |
| المزوّد                    | `qwen`                                     |
| مزوّد خطة الرموز           | `qwen-token-plan`                          |
| مزوّد البوابة              | [`qwen-oauth`](/ar/providers/qwen-oauth)      |
| متغير البيئة المفضّل       | `QWEN_API_KEY`                             |
| متغير بيئة خطة الرموز      | `QWEN_TOKEN_PLAN_API_KEY`                  |
| مقبول أيضًا (للتوافق)      | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| نمط API                    | متوافق مع OpenAI                           |

<Tip>
يعمل `qwen3.7-plus` و`qwen3.6-plus` مع نقاط نهاية خطة البرمجة والخطة القياسية.
بالنسبة إلى `qwen3.7-max` أو `qwen3.6-flash`، استخدم نقطة نهاية **قياسية (الدفع حسب الاستخدام)**.
</Tip>

## تثبيت Plugin

يُشحن `qwen` بصفته Plugin خارجيًا رسميًا، وليس مضمّنًا مع النواة. ثبّته وأعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## البدء

اختر نوع خطتك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="خطة البرمجة (اشتراك)">
    **الأنسب لـ:** الوصول القائم على الاشتراك عبر خطة Qwen للبرمجة.

    <Steps>
      <Step title="احصل على مفتاح API">
        أنشئ مفتاح API أو انسخه من [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        لنقطة النهاية **العالمية**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        لنقطة النهاية في **الصين**:

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
      <Step title="تحقّق من توفّر النموذج">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    لا تزال معرّفات اختيار المصادقة القديمة `modelstudio-*` ومراجع النماذج `modelstudio/...`
    تعمل كأسماء مستعارة للتوافق، لكن ينبغي لتدفقات الإعداد الجديدة تفضيل معرّفات
    اختيار المصادقة الأساسية `qwen-*` ومراجع النماذج `qwen/...`. إذا عرّفت إدخالًا
    مخصّصًا مطابقًا تمامًا في `models.providers.modelstudio` بقيمة `api` أخرى، فإن
    ذلك المزوّد المخصّص يمتلك مراجع `modelstudio/...` بدلًا من الاسم المستعار
    المتوافق لـ Qwen.
    </Note>

  </Tab>

  <Tab title="القياسية (الدفع حسب الاستخدام)">
    **الأنسب لـ:** الوصول بالدفع حسب الاستخدام عبر نقطة نهاية Model Studio القياسية، بما في ذلك `qwen3.7-max` و`qwen3.6-flash` غير المتاحين في خطة البرمجة.

    <Steps>
      <Step title="احصل على مفتاح API">
        أنشئ مفتاح API أو انسخه من [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        لنقطة النهاية **العالمية**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        لنقطة النهاية في **الصين**:

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
      <Step title="تحقّق من توفّر النموذج">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    لا تزال معرّفات اختيار المصادقة القديمة `modelstudio-*` ومراجع النماذج `modelstudio/...`
    تعمل كأسماء مستعارة للتوافق، لكن ينبغي لتدفقات الإعداد الجديدة تفضيل معرّفات
    اختيار المصادقة الأساسية `qwen-*` ومراجع النماذج `qwen/...`. إذا عرّفت إدخالًا
    مخصّصًا مطابقًا تمامًا في `models.providers.modelstudio` بقيمة `api` أخرى، فإن
    ذلك المزوّد المخصّص يمتلك مراجع `modelstudio/...` بدلًا من الاسم المستعار
    المتوافق لـ Qwen.
    </Note>

  </Tab>

  <Tab title="خطة الرموز (إصدار الفريق)">
    **الأنسب لـ:** وصول فرق قائم على الرصيد إلى Qwen والنماذج المدعومة من جهات خارجية عبر Alibaba Cloud Model Studio.

    <Steps>
      <Step title="احصل على مفتاحك المخصّص">
        عيّن مقعدًا في خطة الرموز وأنشئ مفتاحه المخصّص `sk-sp-...`. مفاتيح خطة الرموز وخطة البرمجة والدفع حسب الاستخدام غير قابلة للتبادل. راجع [نظرة عامة على خطة الرموز العالمية](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) أو [نظرة عامة على خطة الرموز في الصين](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        لنقطة النهاية **العالمية / الدولية** في سنغافورة:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        لنقطة النهاية في **الصين** في بكين:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="تحقّق من المزوّد">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    يستخدم دليل Alibaba لـ OpenClaw المعرّف `bailian-token-plan` لمزوّد مخصّص
    يدويًا. يسجّل Plugin هذا المعرّف بصفته مالكًا للتوافق، لكن ينبغي للإعدادات
    الجديدة استخدام `qwen-token-plan`. يحتفظ إدخال مخصّص مطابق تمامًا في
    `models.providers.bailian-token-plan` بملكية آلية النقل والفهرس المضبوطين
    لديه؛ ولا يُدمج أبدًا في فهرس OpenAI الأساسي.
    </Note>

    <Warning>
    استخدم خطة الرموز لجلسات OpenClaw التفاعلية فقط. لا تحددها لوظائف
    Cron أو النصوص البرمجية غير الخاضعة للإشراف أو الواجهات الخلفية للتطبيقات. توضح Alibaba أن
    الاستخدام غير التفاعلي قد يؤدي إلى تعليق الاشتراك أو إلغاء مفتاح API الخاص به.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / البوابة">
    **الأنسب لـ:** استخدام رمز Qwen Portal مع `https://portal.qwen.ai/v1`.

    راجع [Qwen OAuth / البوابة](/ar/providers/qwen-oauth) للاطلاع على صفحة المزوّد
    المخصّصة وملاحظات الترحيل.

    <Steps>
      <Step title="وفّر رمز البوابة">
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
      <Step title="تحقّق من توفّر النموذج">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    يستخدم `qwen-oauth` اسم متغير البيئة `QWEN_API_KEY` نفسه الذي يستخدمه مزوّد Qwen Cloud،
    لكنه يخزّن المصادقة تحت معرّف المزوّد `qwen-oauth` عند ضبطه
    من خلال الإعداد الأولي في OpenClaw.
    </Note>

  </Tab>
</Tabs>

## أنواع الخطط ونقاط النهاية

| الخطة                      | المنطقة | اختيار المصادقة            | نقطة النهاية                                                     |
| -------------------------- | ------ | -------------------------- | ---------------------------------------------------------------- |
| خطة البرمجة (اشتراك)       | الصين  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| خطة البرمجة (اشتراك)       | عالمية | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                | عالمية | `qwen-oauth`               | `portal.qwen.ai/v1`                                              |
| القياسية (الدفع حسب الاستخدام) | الصين  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| القياسية (الدفع حسب الاستخدام) | عالمية | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| خطة الرموز (إصدار الفريق)  | الصين  | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| خطة الرموز (إصدار الفريق)  | عالمية | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

يحدّد المزوّد نقطة النهاية تلقائيًا بناءً على اختيار المصادقة. تستخدم
الخيارات الأساسية عائلة `qwen-*`؛ ويظل `modelstudio-*` مخصّصًا للتوافق فقط.
يمكنك تجاوز ذلك باستخدام `baseUrl` مخصّص في الإعداد.

<Tip>
**إدارة المفاتيح:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**الوثائق:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## الفهرس المضمّن

يُشحن OpenClaw مع فهرس Qwen الثابت هذا. يراعي الفهرس نقطة النهاية: إذ تحذف
إعدادات خطة البرمجة النماذج التي لا تعمل إلا على نقطة النهاية القياسية.

| مرجع النموذج                | الإدخال     | السياق     | ملاحظات                 |
| --------------------------- | ----------- | ---------- | ----------------------- |
| `qwen/qwen3.5-plus`         | نص، صورة    | 1,000,000  | النموذج الافتراضي       |
| `qwen/qwen3.6-flash`        | نص، صورة    | 1,000,000  | نقاط النهاية القياسية فقط |
| `qwen/qwen3.6-plus`         | نص، صورة    | 1,000,000  | خطة البرمجة + القياسية  |
| `qwen/qwen3.7-max`          | نص          | 1,000,000  | نقاط النهاية القياسية فقط |
| `qwen/qwen3.7-plus`         | نص، صورة    | 1,000,000  | خطة البرمجة + القياسية  |
| `qwen/qwen3-max-2026-01-23` | نص          | 262,144    | سلسلة Qwen Max          |
| `qwen/qwen3-coder-next`     | نص          | 262,144    | البرمجة                  |
| `qwen/qwen3-coder-plus`     | نص          | 1,000,000  | البرمجة                  |
| `qwen/MiniMax-M2.5`         | نص          | 1,000,000  | الاستدلال مفعّل          |
| `qwen/glm-5`                | نص          | 202,752    | GLM                     |
| `qwen/glm-4.7`              | نص          | 202,752    | GLM                     |
| `qwen/kimi-k2.5`            | نص، صورة    | 262,144    | Moonshot AI عبر Alibaba |
| `qwen-oauth/qwen3.5-plus`   | نص، صورة    | 1,000,000  | الإعداد الافتراضي لـ Qwen Portal |

<Note>
قد يظل التوفّر مختلفًا حسب نقطة النهاية وخطة الفوترة، حتى عندما يكون النموذج
موجودًا في الفهرس الثابت.
</Note>

### فهرس خطة الرموز

تستخدم خطة الرموز قائمة سماح منفصلة تعتمد على التطابق النصي التام. لا تُدرج هنا نماذج
الخطة المخصّصة لتوليد الصور فقط لأنها تستخدم واجهات API مختلفة.

| مرجع النموذج                        | الإدخال     | السياق     |
| ----------------------------------- | ----------- | ---------- |
| `qwen-token-plan/qwen3.7-max`       | نص          | 1,000,000  |
| `qwen-token-plan/qwen3.7-plus`      | نص، صورة    | 1,000,000  |
| `qwen-token-plan/qwen3.6-plus`      | نص، صورة    | 1,000,000  |
| `qwen-token-plan/qwen3.6-flash`     | نص، صورة    | 1,000,000  |
| `qwen-token-plan/deepseek-v4-pro`   | نص          | 1,000,000  |
| `qwen-token-plan/deepseek-v4-flash` | نص          | 1,000,000  |
| `qwen-token-plan/deepseek-v3.2`     | نص          | 131,072    |
| `qwen-token-plan/kimi-k2.7-code`    | نص، صورة    | 262,144    |
| `qwen-token-plan/kimi-k2.6`         | نص، صورة    | 262,144    |
| `qwen-token-plan/kimi-k2.5`         | نص، صورة    | 262,144    |
| `qwen-token-plan/glm-5.2`           | نص          | 1,000,000  |
| `qwen-token-plan/glm-5.1`           | نص          | 202,752    |
| `qwen-token-plan/glm-5`             | نص          | 202,752    |
| `qwen-token-plan/MiniMax-M2.5`      | نص          | 196,608    |

## عناصر التحكم في التفكير

`qwen3.7-max` و`qwen3.7-plus` و`qwen3.6-flash` و`qwen3.6-plus`
هي نماذج مفعّل فيها الاستدلال ضمن الكتالوج المدمج. بالنسبة إلى نماذج الاستدلال في عائلة `qwen`،
يحوّل المزوّد مستويات التفكير في OpenClaw إلى علامة الطلب ذات المستوى الأعلى
`enable_thinking` في DashScope: يؤدي تعطيل التفكير إلى إرسال `enable_thinking: false`،
بينما يؤدي أي مستوى آخر إلى إرسال `enable_thinking: true`. يمكن للنماذج المخصصة اعتماد
حمولة تفكير بديلة لقالب المحادثة عبر ضبط
`compat.thinkingFormat: "qwen-chat-template"` في إدخال النموذج.

تُصنَّف نماذج Token Plan أيضًا على أنها تدعم الاستدلال. يعمل `kimi-k2.7-code` و
`MiniMax-M2.5` بالتفكير فقط، لذلك يُبقي OpenClaw التفكير مفعّلًا حتى عندما
تطلب الجلسة `/think off`. يربط DeepSeek V4 المستويات من `minimal` إلى `high`
بجهد الخدمة `high`، ويربط `xhigh` أو `max` بـ`max`. يقبل GLM 5.2
النطاق الكامل من `minimal` إلى `max`؛ بينما يقبل GLM 5.1 وGLM 5 المستويات حتى
`xhigh`، وتستخدم النماذج الثلاثة `high` افتراضيًا. تتبع النماذج الهجينة الأخرى
حالة التشغيل أو الإيقاف المطلوبة.

## الإضافات متعددة الوسائط

يوفّر Plugin ‏`qwen` إمكانات متعددة الوسائط على نقاط نهاية DashScope
**Standard** فقط، وليس على نقاط نهاية Coding Plan:

- **فهم الصور والفيديو** عبر `qwen-vl-max-latest`
- **إنشاء فيديو Wan** عبر `wan2.6-t2v` (الافتراضي)، و`wan2.6-i2v`، و`wan2.6-r2v`، و`wan2.6-r2v-flash`، و`wan2.7-r2v`

يُحدَّد استيثاق Qwen المضبوط تلقائيًا لفهم الوسائط؛ ولا حاجة إلى إعدادات
إضافية. تأكد من استخدام نقطة نهاية Standard (الدفع حسب الاستخدام) لكي
يعمل فهم الوسائط.

لجعل Qwen مزوّد الفيديو الافتراضي:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

حدود إنشاء الفيديو: فيديو ناتج واحد لكل طلب، وما يصل إلى صورة إدخال واحدة
(تحويل الصورة إلى فيديو)، وما يصل إلى 4 فيديوهات إدخال (تحويل الفيديو إلى فيديو)،
وبمدة قصوى تبلغ 10 ثوانٍ. يدعم `size` و`aspectRatio` و`resolution` و`audio`
و`watermark`. تتطلب إدخالات الصور أو الفيديوهات المرجعية عناوين URL بعيدة ببروتوكول
http(s)؛ وتُرفض مسارات الملفات المحلية مسبقًا لأن نقطة نهاية الفيديو في DashScope لا
تقبل المخازن المؤقتة المحلية المرفوعة لهذه المراجع.

<Note>
راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الأعطال.
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="توافر Qwen 3.6 و3.7">
    يتوفر `qwen3.7-plus` و`qwen3.6-plus` على نقاط نهاية Coding Plan وStandard. أما `qwen3.7-max` و`qwen3.6-flash` فيتوفران على Standard فقط. نقاط نهاية Standard (الدفع حسب الاستخدام) هي:

    - الصين: `dashscope.aliyuncs.com/compatible-mode/v1`
    - عالميًا: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    يستبعد OpenClaw النموذجين `qwen3.7-max` و`qwen3.6-flash` من كتالوجات Coding Plan.
    إذا أعادت نقطة نهاية Coding Plan خطأ "نموذج غير مدعوم" لأي منهما،
    فانتقل إلى نقطة نهاية Standard المطابقة ومفتاحها.

  </Accordion>

  <Accordion title="توجيه منطقة إنشاء الفيديو">
    يربط OpenClaw منطقة Qwen المضبوطة بمضيف DashScope AIGC المطابق
    قبل إرسال مهمة فيديو:

    - عالمي/دولي: `https://dashscope-intl.aliyuncs.com`
    - الصين: `https://dashscope.aliyuncs.com`

    يظل `models.providers.qwen.baseUrl` العادي الذي يشير إلى مضيفات Qwen الخاصة
    بـCoding Plan أو Standard يوجّه إنشاء الفيديو إلى نقطة نهاية فيديو DashScope
    الإقليمية المطابقة.

  </Accordion>

  <Accordion title="توافق استخدام البث">
    تعلن نقاط نهاية Qwen الأصلية توافق استخدام البث عبر ناقل
    `openai-completions` المشترك، ولذلك ترث معرّفات المزوّد المخصص المتوافقة مع DashScope
    والموجّهة إلى المضيفات الأصلية نفسها السلوك ذاته دون اشتراط
    معرّف المزوّد المدمج `qwen` تحديدًا. ينطبق ذلك على نقاط نهاية Coding Plan
    وStandard وToken Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="خطة الإمكانات">
    يجري إعداد Plugin ‏`qwen` ليكون الموطن الخاص بالمورّد لكامل واجهة Qwen
    Cloud، وليس لنماذج البرمجة والنصوص فقط.

    - **نماذج النصوص/المحادثة:** متاحة عبر Plugin
    - **استدعاء الأدوات، والمخرجات المنظَّمة، والتفكير:** موروثة من الناقل المتوافق مع OpenAI
    - **إنشاء الصور:** مخطط له في طبقة Plugin المزوّد
    - **فهم الصور/الفيديو:** متاح عبر Plugin على نقطة نهاية Standard
    - **الكلام/الصوت:** مخطط له في طبقة Plugin المزوّد
    - **تضمينات الذاكرة/إعادة الترتيب:** مخطط لها عبر واجهة محوّل التضمين
    - **إنشاء الفيديو:** متاح عبر Plugin من خلال إمكانية إنشاء الفيديو المشتركة

  </Accordion>

  <Accordion title="إعداد البيئة والخدمة الخلفية">
    إذا كان Gateway يعمل كخدمة خلفية (launchd/systemd)، فتأكد من إتاحة `QWEN_API_KEY`
    أو `QWEN_TOKEN_PLAN_API_KEY` لتلك العملية (على سبيل المثال، في
    `~/.openclaw/.env` أو عبر `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="Alibaba Model Studio" href="/ar/providers/alibaba" icon="cloud">
    مزوّد إنشاء فيديو Wan المضمّن على منصة DashScope نفسها.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها عمومًا والأسئلة الشائعة.
  </Card>
</CardGroup>
