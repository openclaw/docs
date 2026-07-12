---
read_when:
    - تريد استخدام LongCat-2.0 مع OpenClaw
    - تحتاج إلى مفتاح واجهة برمجة تطبيقات LongCat أو حدود النموذج
summary: إعداد واجهة LongCat API لنموذج LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-12T06:23:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) توفّر واجهة API مستضافة لنموذج LongCat-2.0، وهو
نموذج استدلال مصمم لأعباء عمل البرمجة والوكلاء. توفّر OpenClaw
Plugin الرسمي `longcat` لنقطة نهاية LongCat المتوافقة مع OpenAI.

| الخاصية    | القيمة                               |
| ---------- | ------------------------------------ |
| المزوّد    | `longcat`                            |
| المصادقة   | `LONGCAT_API_KEY`                    |
| API        | إكمالات المحادثة المتوافقة مع OpenAI |
| عنوان URL الأساسي | `https://api.longcat.chat/openai` |
| النموذج    | `longcat/LongCat-2.0`                |
| السياق     | 1,048,576 رمزًا                      |
| الحد الأقصى للمخرجات | 131,072 رمزًا             |
| الإدخال    | نص                                  |

## تثبيت Plugin

ثبّت الحزمة الرسمية، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## بدء الاستخدام

<Steps>
  <Step title="إنشاء مفتاح API">
    سجّل الدخول إلى [منصة LongCat API](https://longcat.chat/platform/) وأنشئ
    مفتاحًا في صفحة [مفاتيح API](https://longcat.chat/platform/api_keys).
  </Step>
  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="التحقق من النموذج">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

يضيف الإعداد الأولي الكتالوج المستضاف ويحدد `longcat/LongCat-2.0` عندما لا
يكون هناك نموذج أساسي مُهيأ بالفعل.

### الإعداد غير التفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## سلوك الاستدلال

توفّر LongCat تحكمًا ثنائيًا في التفكير. تربط OpenClaw مستويات التفكير المفعّلة
بـ `thinking: { type: "enabled" }`، وتربط `/think off` بـ
`thinking: { type: "disabled" }`. لا توثّق LongCat حاليًا
`reasoning_effort`، ولذلك لا ترسله OpenClaw.

تعيد LongCat الاستدلال في `reasoning_content`. تحتفظ OpenClaw بهذا الحقل
عند إعادة تشغيل أدوار استدعاء الأدوات الخاصة بالمساعد، بحيث تحافظ جلسات الوكيل
متعددة الأدوار على بنية الرسائل التي يتوقعها المزوّد.

## التسعير

يستخدم الكتالوج المضمّن أسعار LongCat المعلنة بنظام الدفع حسب الاستخدام، بالدولار
الأمريكي لكل مليون رمز: 0.75 دولار للإدخال غير المخزّن مؤقتًا، و0.015 دولار
للإدخال المخزّن مؤقتًا، و2.95 دولار للمخرجات. قد تقدّم LongCat خصومات مؤقتة؛
وتُعد [صفحة التسعير](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
وسجلات الفوترة الخاصة بك المرجع المعتمد.

## LongCat-2.0 المستضاف ذاتيًا

يستهدف مزوّد `longcat` واجهة API المستضافة من LongCat. لاستخدام الأوزان المفتوحة
على [Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0)، شغّل
النموذج من خلال بيئة تشغيل متوافقة مع OpenAI، واستخدم بدلًا من ذلك مزوّد
[vLLM](/ar/providers/vllm) أو [SGLang](/ar/providers/sglang) الموجود في OpenClaw.

احتفظ بمعرّف النموذج الدقيق لبيئة التشغيل في كتالوج المزوّد المستضاف ذاتيًا؛
ولا توجّه نشرًا محليًا عبر `longcat/LongCat-2.0`.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="يعمل المفتاح في الصدفة، ولكن ليس في Gateway">
    لا ترث عمليات Gateway التي تديرها الخدمات الخفية جميع متغيرات الصدفة
    التفاعلية. ضع `LONGCAT_API_KEY` في `~/.openclaw/.env`، أو هيّئه من خلال
    الإعداد الأولي، أو استخدم مرجع أسرار معتمدًا.
  </Accordion>

  <Accordion title="تفشل الطلبات بالرمز 402 أو 429">
    يعني `402` أن الحساب لا يملك حصة رموز كافية. ويعني `429` أن مفتاح API
    بلغ حد المعدل. تحقّق من [استخدام LongCat](https://longcat.chat/platform/usage)
    وأعد محاولة الطلبات المحدودة بالمعدل بعد انتهاء فترة التراجع الخاصة بالمزوّد.
  </Accordion>

  <Accordion title="لا يظهر النموذج">
    شغّل `openclaw plugins list` وتأكد من أن Plugin ‏`longcat`
    مفعّل، ثم شغّل `openclaw models list --provider longcat`.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers" icon="layers">
    تهيئة المزوّد، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="وثائق LongCat API" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    نقاط نهاية API المستضافة، والمصادقة، والحدود، والأمثلة.
  </Card>
  <Card title="بطاقة نموذج LongCat-2.0" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    البنية، وإرشادات النشر، وتفاصيل النموذج.
  </Card>
  <Card title="الأسرار" href="/ar/gateway/secrets" icon="key">
    خزّن بيانات اعتماد المزوّد دون تضمين نص صريح في الإعدادات.
  </Card>
</CardGroup>
