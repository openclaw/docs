---
read_when:
    - تريد تهيئة معرّف المزوّد `qwen-oauth`
    - لقد استخدمت سابقًا بيانات اعتماد Qwen Portal OAuth
    - تحتاج إلى نقطة نهاية بوابة Qwen أو إرشادات الترحيل
summary: استخدم معرّف موفّر Qwen Portal مع OpenClaw
title: مصادقة Qwen عبر OAuth / البوابة
x-i18n:
    generated_at: "2026-07-12T06:29:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` هو معرّف موفّر Qwen Portal، ويسجّله Plugin ‏Qwen
(`@openclaw/qwen-provider`). وهو يستهدف نقطة نهاية Qwen Portal على
`https://portal.qwen.ai/v1`، ويُبقي إعدادات Qwen OAuth / البوابة القديمة
متاحةً عبر معرّف موفّر مستقل، ومنفصلًا عن موفّر `qwen` القياسي.

اختر `qwen-oauth` إذا كان لديك بالفعل رمز Qwen Portal صالح، أو كنت
تنقل سير عمل قديمًا لـ Qwen OAuth أو Qwen CLI، أو تحتاج إلى اختبار نقطة نهاية
Qwen Portal تحديدًا. بالنسبة إلى الإعدادات الجديدة، يُفضّل استخدام
[Qwen](/ar/providers/qwen) مع نقطة نهاية ModelStudio القياسية: فهي تغطي إعدادات
مفاتيح API الجديدة، وخيارات أوسع لنقاط النهاية، وخيار Standard للدفع حسب الاستخدام، وCoding Plan،
وفهرس Qwen Plugin الكامل.

## الإعداد

ثبّت Qwen Plugin إذا لم تكن قد ثبّتَّه بالفعل:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

قدّم رمز البوابة عبر الإعداد الأولي:

```bash
openclaw onboard --auth-choice qwen-oauth
```

تقرأ عمليات التشغيل غير التفاعلية الرمز من `--qwen-oauth-token <token>`، أو عيّن:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

يخزّن الإعداد الأولي الرمز ضمن ملف تعريف مصادقة `qwen-oauth`، ويهيّئ فهرس
نماذج البوابة، ويعيّن `qwen-oauth/qwen3.5-plus` نموذجًا افتراضيًا عندما
لا يكون أي نموذج مضبوطًا.

## الإعدادات الافتراضية

- الموفّر: `qwen-oauth`
- الأسماء المستعارة: `qwen-portal`، `qwen-cli`
- عنوان URL الأساسي: `https://portal.qwen.ai/v1`
- متغير البيئة: `QWEN_API_KEY`
- نمط API: متوافق مع OpenAI
- النموذج الافتراضي: `qwen-oauth/qwen3.5-plus`

## أوجه الاختلاف عن Qwen

لدى OpenClaw معرّفا موفّر موجّهان إلى Qwen:

| الموفّر      | عائلة نقاط النهاية                                         | الأنسب لـ                                                                                |
| ------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `qwen`       | نقاط نهاية Qwen Cloud / Alibaba DashScope وCoding Plan     | إعدادات مفاتيح API الجديدة، وStandard للدفع حسب الاستخدام، وCoding Plan، وميزات DashScope متعددة الوسائط |
| `qwen-oauth` | نقطة نهاية Qwen Portal على `portal.qwen.ai/v1`             | رموز Qwen Portal الحالية وإعدادات Qwen OAuth / CLI القديمة                              |

يستخدم كلا الموفّرين بنى طلبات متوافقة مع OpenAI، لكنهما واجهتا مصادقة
منفصلتان. يجب ألا يُعامل الرمز المخزّن لـ `qwen-oauth` على أنه مفتاح DashScope
أو ModelStudio، ويجب استخدام موفّر `qwen` القياسي بدلًا منه مع مفتاح DashScope
الجديد.

## النماذج

يهيّئ Qwen Plugin هذا الفهرس الثابت لنقطة نهاية Qwen Portal. تستخدم جميع
الإدخالات حدًا أقصى للإخراج يبلغ 65,536 رمزًا؛ ويعتمد التوفر على حساب Qwen
Portal الحالي والرمز.

| مرجع النموذج                      | الإدخال     | السياق     | ملاحظات          |
| --------------------------------- | ----------- | --------- | ---------------- |
| `qwen-oauth/qwen3.5-plus`         | نص، صورة    | 1,000,000 | النموذج الافتراضي |
| `qwen-oauth/qwen3.6-plus`         | نص، صورة    | 1,000,000 |                  |
| `qwen-oauth/qwen3-max-2026-01-23` | نص          | 262,144   |                  |
| `qwen-oauth/qwen3-coder-next`     | نص          | 262,144   |                  |
| `qwen-oauth/qwen3-coder-plus`     | نص          | 1,000,000 |                  |
| `qwen-oauth/MiniMax-M2.5`         | نص          | 1,000,000 | استدلال           |
| `qwen-oauth/glm-5`                | نص          | 202,752   |                  |
| `qwen-oauth/glm-4.7`              | نص          | 202,752   |                  |
| `qwen-oauth/kimi-k2.5`            | نص، صورة    | 262,144   |                  |

إذا كان حسابك يستخدم مفاتيح API الخاصة بـ ModelStudio / DashScope بدلًا من ذلك، فاضبط
موفّر `qwen` القياسي:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## الترحيل

ملفات تعريف Qwen Portal OAuth القديمة غير قابلة للتحديث؛ ويضع
`openclaw doctor` علامة عليها. إذا توقف ملف تعريف البوابة عن العمل، فأعد تشغيل
الإعداد الأولي باستخدام رمز حالي، أو انتقل إلى موفّر Qwen القياسي:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

يستخدم ModelStudio العالمي القياسي:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## استكشاف الأخطاء وإصلاحها

- إخفاقات تحديث OAuth للبوابة: ملفات تعريف Qwen Portal OAuth القديمة غير
  قابلة للتحديث. أعد تشغيل الإعداد الأولي باستخدام رمز حالي.
- أخطاء نقطة النهاية غير الصحيحة: تأكد من أن مرجع النموذج يبدأ بـ `qwen-oauth/` عند
  استخدام رمز البوابة. استخدم المراجع التي تبدأ بـ `qwen/` فقط مع موفّر Qwen القياسي.
- الالتباس بشأن `QWEN_API_KEY`: تذكر صفحتا Qwen متغير البيئة هذا، لكن الإعداد الأولي
  يخزّن بيانات الاعتماد ضمن معرّف الموفّر المحدد. يُفضّل استخدام الإعداد الأولي عندما
  تُبقي كلا الموفّرين `qwen` و`qwen-oauth` متاحين على الجهاز نفسه.

## ذو صلة

- [Qwen](/ar/providers/qwen)
- [Alibaba Model Studio](/ar/providers/alibaba)
- [موفّرو النماذج](/ar/concepts/model-providers)
- [جميع الموفّرين](/ar/providers/index)
