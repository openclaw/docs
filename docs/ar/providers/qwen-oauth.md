---
read_when:
    - تريد تكوين معرّف المزوّد qwen-oauth
    - لقد استخدمت سابقًا بيانات اعتماد Qwen Portal OAuth
    - تحتاج إلى نقطة نهاية Qwen Portal أو إرشادات الترحيل
summary: استخدم معرّف موفّر Qwen Portal مع OpenClaw
title: Qwen OAuth / البوابة
x-i18n:
    generated_at: "2026-06-27T18:27:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` هو معرّف مزوّد Qwen Portal. يستهدف نقطة نهاية Qwen Portal
ويُبقي إعدادات Qwen OAuth / البوابة الأقدم قابلة للعنونة عبر معرّف مزوّد
مميز.

استخدم هذا المزوّد عندما يكون لديك تحديدًا رمز Qwen Portal حالي لـ
`https://portal.qwen.ai/v1`، أو عندما تنقل إعداد Qwen Portal / Qwen CLI أقدم
وتريد إبقاء بيانات الاعتماد هذه منفصلة عن مزوّد Qwen Cloud القياسي. ليس هذا
الخيار الأول الموصى به لمستخدمي Qwen الجدد.

لإعدادات Qwen Cloud الجديدة، فضّل [Qwen](/ar/providers/qwen) مع نقطة نهاية Standard
ModelStudio ما لم يكن لديك تحديدًا رمز Qwen Portal حالي.

## الإعداد

وفّر رمز البوابة عبر الإعداد الأولي:

```bash
openclaw onboard --auth-choice qwen-oauth
```

أو عيّن:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## الإعدادات الافتراضية

- المزوّد: `qwen-oauth`
- الأسماء المستعارة: `qwen-portal`, `qwen-cli`
- عنوان URL الأساسي: `https://portal.qwen.ai/v1`
- متغير البيئة: `QWEN_API_KEY`
- نمط API: متوافق مع OpenAI
- النموذج الافتراضي: `qwen-oauth/qwen3.5-plus`

## كيف يختلف هذا عن Qwen

لدى OpenClaw معرّفا مزوّد يواجهان Qwen:

| المزوّد     | عائلة نقاط النهاية                                          | الأنسب لـ                                                                               |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | نقاط نهاية Qwen Cloud / Alibaba DashScope وCoding Plan | إعدادات مفاتيح API الجديدة، Standard بنظام الدفع حسب الاستخدام، Coding Plan، ميزات DashScope متعددة الوسائط |
| `qwen-oauth` | نقطة نهاية Qwen Portal عند `portal.qwen.ai/v1`              | رموز Qwen Portal الحالية وإعدادات Qwen OAuth / CLI القديمة                         |

يستخدم كلا المزوّدين أشكال طلبات متوافقة مع OpenAI، لكنهما سطحا مصادقة
منفصلان. يجب ألا يُعامل الرمز المخزّن لـ `qwen-oauth` كمفتاح DashScope
أو ModelStudio، ويجب أن يستخدم مفتاح DashScope الجديد مزوّد `qwen`
القياسي بدلًا من ذلك.

## متى تختار Qwen OAuth / Portal

- لديك بالفعل رمز Qwen Portal عامل.
- تحافظ على سير عمل Qwen OAuth أو Qwen CLI قديم أثناء الانتقال إلى
  نموذج المزوّدين في OpenClaw.
- تحتاج إلى اختبار التوافق مع نقطة نهاية Qwen Portal تحديدًا.

اختر [Qwen](/ar/providers/qwen) للإعداد الجديد، وخيارات نقاط نهاية أوسع، وStandard
ModelStudio، وCoding Plan، وكتالوج Plugin الكامل لـ Qwen.

## النماذج

يزرع كتالوج Plugin الخاص بـ Qwen الإعداد الافتراضي لـ Qwen Portal:

- `qwen-oauth/qwen3.5-plus`

يعتمد التوفر على حساب Qwen Portal والرمز الحاليين. إذا كان حسابك يستخدم مفاتيح
ModelStudio / DashScope API بدلًا من ذلك، فكوّن مزوّد `qwen` القياسي:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## الترحيل

قد لا تكون ملفات Qwen Portal OAuth الشخصية القديمة قابلة للتحديث. إذا توقف ملف
شخصي للبوابة عن العمل، فأعد المصادقة برمز حالي أو انتقل إلى مزوّد Qwen
Standard:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

يستخدم ModelStudio العالمي Standard:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## استكشاف الأخطاء وإصلاحها

- إخفاقات تحديث Portal OAuth: قد لا تكون ملفات Qwen Portal OAuth الشخصية
  القديمة قابلة للتحديث. أعد تشغيل الإعداد الأولي برمز حالي.
- أخطاء نقطة النهاية الخاطئة: تأكد من أن مرجع النموذج يبدأ بـ `qwen-oauth/` عند
  استخدام رمز بوابة. استخدم مراجع `qwen/` فقط لمزوّد Qwen القياسي.
- الالتباس حول `QWEN_API_KEY`: تذكر صفحتا Qwen متغير البيئة هذا، لكن الإعداد
  الأولي يخزّن بيانات الاعتماد تحت معرّف المزوّد المحدد. فضّل الإعداد الأولي عندما
  تُبقي كلًا من `qwen` و`qwen-oauth` متاحين على الجهاز نفسه.

## ذات صلة

- [Qwen](/ar/providers/qwen)
- [Alibaba Model Studio](/ar/providers/alibaba)
- [مزوّدو النماذج](/ar/concepts/model-providers)
- [كل المزوّدين](/ar/providers/index)
