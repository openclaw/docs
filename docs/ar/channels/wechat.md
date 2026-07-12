---
read_when:
    - تريد ربط OpenClaw بـ WeChat أو Weixin
    - أنت تثبّت Plugin قناة openclaw-weixin أو تستكشف أخطاءه وإصلاحها
    - تحتاج إلى فهم كيفية تشغيل Plugins القنوات الخارجية إلى جانب Gateway
summary: إعداد قناة WeChat عبر Plugin الخارجي openclaw-weixin
title: ويتشات
x-i18n:
    generated_at: "2026-07-12T05:36:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

يتصل OpenClaw بـ WeChat من خلال Plugin القناة الخارجي من Tencent:
`@tencent-weixin/openclaw-weixin`.

الحالة: Plugin خارجي، يتولى فريق Tencent Weixin صيانته. تُدعم المحادثات المباشرة
والوسائط. لا تعلن البيانات الوصفية لإمكانات Plugin عن دعم المحادثات الجماعية
(إذ تعلن عن المحادثات المباشرة فقط).

## التسمية

- **WeChat** هو الاسم الظاهر للمستخدم في هذه الوثائق.
- **Weixin** هو الاسم الذي تستخدمه حزمة Tencent ومعرّف Plugin.
- `openclaw-weixin` هو معرّف قناة OpenClaw (ويعمل `weixin` و`wechat` كاسمين مستعارين).
- `@tencent-weixin/openclaw-weixin` هي حزمة npm.

استخدم `openclaw-weixin` في أوامر CLI ومسارات الإعدادات.

## آلية العمل

لا توجد شيفرة WeChat في مستودع OpenClaw الأساسي. يوفّر OpenClaw
عقد Plugin العام للقنوات، بينما يوفّر Plugin الخارجي بيئة التشغيل
الخاصة بـ WeChat:

1. يثبّت `openclaw plugins install` الحزمة `@tencent-weixin/openclaw-weixin`.
2. يكتشف Gateway بيان Plugin ويحمّل نقطة دخوله.
3. يسجّل Plugin معرّف القناة `openclaw-weixin`.
4. يبدأ `openclaw channels login --channel openclaw-weixin` تسجيل الدخول عبر رمز QR.
5. يخزّن Plugin بيانات اعتماد الحساب ضمن دليل حالة OpenClaw
   (`~/.openclaw` افتراضيًا).
6. عند بدء Gateway، يشغّل Plugin مراقب Weixin لكل
   حساب مُعدّ.
7. تُوحّد رسائل WeChat الواردة عبر عقد القناة، وتُوجّه إلى
   وكيل OpenClaw المحدد، ثم تُرسل الردود عبر مسار الإرسال الصادر في Plugin.

هذا الفصل مهم: تظل نواة OpenClaw مستقلة عن القنوات. ويتولى Plugin الخارجي
تسجيل الدخول إلى WeChat، واستدعاءات واجهة Tencent iLink API، ورفع الوسائط وتنزيلها،
ورموز السياق، ومراقبة الحسابات.

## التثبيت

التثبيت السريع:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

التثبيت اليدوي:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

أعد تشغيل Gateway بعد التثبيت:

```bash
openclaw gateway restart
```

## تسجيل الدخول

شغّل تسجيل الدخول عبر رمز QR على الجهاز نفسه الذي يشغّل Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

امسح رمز QR باستخدام WeChat على هاتفك وأكّد تسجيل الدخول. يحفظ Plugin
رمز الحساب محليًا بعد نجاح المسح.

لإضافة حساب WeChat آخر، شغّل أمر تسجيل الدخول نفسه مجددًا. عند استخدام عدة
حسابات، اعزل جلسات الرسائل المباشرة حسب الحساب والقناة والمرسل:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## التحكم في الوصول

تستخدم الرسائل المباشرة نموذج الاقتران وقائمة السماح المعتادين في OpenClaw
لـ Plugins القنوات.

وافق على المرسلين الجدد:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

للاطلاع على نموذج التحكم في الوصول كاملًا، راجع [الاقتران](/ar/channels/pairing).

## التوافق

يتحقق Plugin من إصدار OpenClaw المضيف عند بدء التشغيل.

| سلسلة Plugin | إصدار OpenClaw                                                | وسم npm  |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12` (الإصدار الحالي 2.4.6؛ كانت إصدارات 2.x المبكرة تقبل `>=2026.3.22`) | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

إذا أبلغ Plugin بأن إصدار OpenClaw لديك قديم جدًا، فإما أن تحدّث
OpenClaw أو تثبّت السلسلة القديمة من Plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## العملية المرافقة

يمكن لـ Plugin WeChat تشغيل مهام مساعدة بجانب Gateway أثناء مراقبة
واجهة Tencent iLink API. في المشكلة #68451، كشف مسار المهام المساعدة هذا خللًا في
التنظيف العام للنسخ القديمة من Gateway في OpenClaw: كان بإمكان عملية فرعية محاولة
تنظيف عملية Gateway الأصلية، مما تسبب في حلقات إعادة تشغيل عند استخدام مديري العمليات مثل systemd.

يستثني تنظيف بدء التشغيل الحالي في OpenClaw العملية الحالية وأسلافها،
لذلك لا يمكن لمساعد القناة إنهاء Gateway الذي شغّله. هذا الإصلاح
عام؛ وليس مسارًا خاصًا بـ WeChat في النواة.

## استكشاف الأخطاء وإصلاحها

تحقق من التثبيت والحالة:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

إذا ظهرت القناة على أنها مثبّتة لكنها لا تتصل، فتأكد من أن Plugin
مفعّل ثم أعد التشغيل:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

إذا تكررت إعادة تشغيل Gateway بعد تمكين WeChat، فحدّث كلًا من OpenClaw
وPlugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

إذا أبلغ بدء التشغيل بأن حزمة Plugin المثبّتة `requires compiled runtime
output for TypeScript entry`، فهذا يعني أن حزمة npm نُشرت دون ملفات بيئة تشغيل
JavaScript المترجمة التي يحتاجها OpenClaw. حدّث Plugin أو أعد تثبيته بعد أن ينشر
ناشره حزمة مصححة، أو عطّل Plugin أو ألغِ تثبيته مؤقتًا.

التعطيل المؤقت:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## الوثائق ذات الصلة

- نظرة عامة على القنوات: [قنوات المحادثة](/ar/channels)
- الاقتران: [الاقتران](/ar/channels/pairing)
- توجيه القنوات: [توجيه القنوات](/ar/channels/channel-routing)
- بنية Plugins: [بنية Plugins](/ar/plugins/architecture)
- حزمة تطوير Plugin القناة: [حزمة تطوير Plugin القناة](/ar/plugins/sdk-channel-plugins)
- الحزمة الخارجية: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
