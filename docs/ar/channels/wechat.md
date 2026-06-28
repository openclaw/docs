---
read_when:
    - تريد ربط OpenClaw بـ WeChat أو Weixin
    - أنت تثبّت Plugin قناة openclaw-weixin أو تستكشف مشكلاته وتصلحها
    - تحتاج إلى فهم كيفية تشغيل Plugins القنوات الخارجية بجانب Gateway
summary: إعداد قناة WeChat من خلال Plugin openclaw-weixin الخارجي
title: WeChat
x-i18n:
    generated_at: "2026-05-06T07:45:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 803557a4fc92056c63053a3388100a451b2d85d4e892877707b3c2e3a677c0b0
    source_path: channels/wechat.md
    workflow: 16
    postprocess_version: locale-links-v1
---

يتصل OpenClaw بـ WeChat عبر Plugin القناة الخارجي من Tencent
`@tencent-weixin/openclaw-weixin`.

الحالة: Plugin خارجي. المحادثات المباشرة والوسائط مدعومة. محادثات المجموعات غير
معلنة في بيانات تعريف الإمكانات الخاصة بالـ Plugin الحالي.

## التسمية

- **WeChat** هو الاسم الظاهر للمستخدم في هذه الوثائق.
- **Weixin** هو الاسم المستخدم في حزمة Tencent وفي معرّف الـ Plugin.
- `openclaw-weixin` هو معرّف قناة OpenClaw.
- `@tencent-weixin/openclaw-weixin` هي حزمة npm.

استخدم `openclaw-weixin` في أوامر CLI ومسارات الإعداد.

## كيف يعمل

لا تعيش شيفرة WeChat في مستودع نواة OpenClaw. يوفر OpenClaw
عقد Plugin القناة العام، ويوفر الـ Plugin الخارجي وقت التشغيل
المخصص لـ WeChat:

1. يثبّت `openclaw plugins install` الحزمة `@tencent-weixin/openclaw-weixin`.
2. يكتشف Gateway بيان الـ Plugin ويحمل نقطة دخول الـ Plugin.
3. يسجل الـ Plugin معرّف القناة `openclaw-weixin`.
4. يبدأ `openclaw channels login --channel openclaw-weixin` تسجيل الدخول عبر رمز QR.
5. يخزن الـ Plugin بيانات اعتماد الحساب ضمن دليل حالة OpenClaw.
6. عند بدء Gateway، يبدأ الـ Plugin مراقب Weixin لكل حساب
   مكوّن.
7. تُطبّع رسائل WeChat الواردة عبر عقد القناة، وتُوجّه إلى
   وكيل OpenClaw المحدد، ثم تُرسل مرة أخرى عبر مسار الخروج في الـ Plugin.

هذا الفصل مهم: يجب أن تبقى نواة OpenClaw حيادية تجاه القنوات. تسجيل دخول WeChat،
واستدعاءات Tencent iLink API، ورفع/تنزيل الوسائط، ورموز السياق، ومراقبة الحسابات
كلها مملوكة للـ Plugin الخارجي.

## التثبيت

تثبيت سريع:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

تثبيت يدوي:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

أعد تشغيل Gateway بعد التثبيت:

```bash
openclaw gateway restart
```

## تسجيل الدخول

شغّل تسجيل الدخول عبر QR على الجهاز نفسه الذي يشغّل Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

امسح رمز QR باستخدام WeChat على هاتفك وأكّد تسجيل الدخول. يحفظ الـ Plugin
رمز الحساب محليًا بعد نجاح المسح.

لإضافة حساب WeChat آخر، شغّل أمر تسجيل الدخول نفسه مرة أخرى. للحسابات المتعددة،
اعزل جلسات الرسائل المباشرة حسب الحساب والقناة والمرسل:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## التحكم في الوصول

تستخدم الرسائل المباشرة نموذج الاقتران وقائمة السماح العادي في OpenClaw للـ
Plugins الخاصة بالقنوات.

وافِق على المرسلين الجدد:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

للاطلاع على نموذج التحكم في الوصول الكامل، راجع [الاقتران](/ar/channels/pairing).

## التوافق

يتحقق الـ Plugin من إصدار OpenClaw المضيف عند بدء التشغيل.

| خط الـ Plugin | إصدار OpenClaw          | وسم npm |
| ------------- | ----------------------- | ------- |
| `2.x`         | `>=2026.3.22`           | `latest` |
| `1.x`         | `>=2026.1.0 <2026.3.22` | `legacy` |

إذا أبلغ الـ Plugin أن إصدار OpenClaw لديك قديم جدًا، فإما أن تحدّث
OpenClaw أو تثبّت خط الـ Plugin القديم:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## عملية جانبية

يمكن لـ Plugin الخاص بـ WeChat تشغيل عمل مساعد إلى جانب Gateway أثناء مراقبته
Tencent iLink API. في القضية #68451، كشف ذلك المسار المساعد عن علة في تنظيف
Gateway العام القديم في OpenClaw: كان بإمكان عملية فرعية أن تحاول تنظيف عملية
Gateway الأب، مما يسبب حلقات إعادة تشغيل تحت مديري العمليات مثل systemd.

يستثني تنظيف بدء تشغيل OpenClaw الحالي العملية الحالية وأسلافها،
لذلك يجب ألا يقتل مساعد القناة الـ Gateway الذي أطلقه. هذا الإصلاح
عام؛ وليس مسارًا خاصًا بـ WeChat في النواة.

## استكشاف الأخطاء وإصلاحها

تحقق من التثبيت والحالة:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

إذا ظهرت القناة على أنها مثبتة لكنها لا تتصل، فتأكد من أن الـ Plugin
مفعّل وأعد التشغيل:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

إذا كان Gateway يعيد التشغيل مرارًا بعد تفعيل WeChat، فحدّث كلًا من OpenClaw والـ
Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

إذا أبلغ بدء التشغيل أن حزمة الـ Plugin المثبتة `requires compiled runtime
output for TypeScript entry`، فهذا يعني أن حزمة npm نُشرت من دون ملفات وقت تشغيل
JavaScript المترجمة التي يحتاجها OpenClaw. حدّث/أعد التثبيت بعد أن ينشر
ناشر الـ Plugin حزمة مصححة، أو عطّل/أزل تثبيت الـ Plugin مؤقتًا.

تعطيل مؤقت:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## وثائق ذات صلة

- نظرة عامة على القنوات: [قنوات الدردشة](/ar/channels)
- الاقتران: [الاقتران](/ar/channels/pairing)
- توجيه القنوات: [توجيه القنوات](/ar/channels/channel-routing)
- معمارية الـ Plugin: [معمارية الـ Plugin](/ar/plugins/architecture)
- SDK Plugin القناة: [SDK Plugin القناة](/ar/plugins/sdk-channel-plugins)
- الحزمة الخارجية: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
