---
read_when:
    - تريد ربط OpenClaw بـ WeChat أو Weixin
    - أنت تقوم بتثبيت Plugin قناة openclaw-weixin أو استكشاف أخطائه وإصلاحها
    - تحتاج إلى فهم كيفية تشغيل Plugins القنوات الخارجية إلى جانب Gateway
summary: إعداد قناة WeChat عبر Plugin ‏openclaw-weixin الخارجي
title: WeChat
x-i18n:
    generated_at: "2026-04-24T07:32:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 15
---

يتصل OpenClaw بـ WeChat من خلال Plugin القناة الخارجي من Tencent
`@tencent-weixin/openclaw-weixin`.

الحالة: Plugin خارجي. الدردشات المباشرة والوسائط مدعومة. ولا يتم الإعلان عن دردشات المجموعات
بواسطة بيانات قدرات Plugin الحالية.

## التسمية

- **WeChat** هو الاسم الظاهر للمستخدم في هذه المستندات.
- **Weixin** هو الاسم المستخدم بواسطة حزمة Tencent وبواسطة معرّف Plugin.
- `openclaw-weixin` هو معرّف قناة OpenClaw.
- `@tencent-weixin/openclaw-weixin` هي حزمة npm.

استخدم `openclaw-weixin` في أوامر CLI ومسارات الإعدادات.

## كيف يعمل

لا يوجد كود WeChat داخل مستودع OpenClaw الأساسي. يوفّر OpenClaw
العقد العام لـ Plugin القنوات، ويوفّر Plugin الخارجي
وقت التشغيل الخاص بـ WeChat:

1. يقوم `openclaw plugins install` بتثبيت `@tencent-weixin/openclaw-weixin`.
2. يكتشف Gateway بيان Plugin ويحمّل نقطة دخول Plugin.
3. يسجّل Plugin معرّف القناة `openclaw-weixin`.
4. يبدأ `openclaw channels login --channel openclaw-weixin` تسجيل الدخول عبر QR.
5. يخزّن Plugin بيانات اعتماد الحساب ضمن دليل حالة OpenClaw.
6. عند بدء تشغيل Gateway، يبدأ Plugin مراقب Weixin الخاص به لكل
   حساب مُهيأ.
7. تُطبَّع رسائل WeChat الواردة عبر عقد القناة، وتُوجَّه إلى
   وكيل OpenClaw المحدد، ثم تُرسَل مرة أخرى عبر مسار الإرسال الصادر الخاص بـ Plugin.

هذا الفصل مهم: يجب أن يظل OpenClaw core مستقلًا عن القنوات. فتسجيل دخول WeChat،
واستدعاءات واجهة Tencent iLink البرمجية، ورفع/تنزيل الوسائط، ورموز السياق، ومراقبة
الحسابات كلها مملوكة لـ Plugin الخارجي.

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

امسح رمز QR باستخدام WeChat على هاتفك وأكّد تسجيل الدخول. يحفظ Plugin
رمز الحساب محليًا بعد نجاح المسح.

لإضافة حساب WeChat آخر، شغّل أمر تسجيل الدخول نفسه مرة أخرى. وبالنسبة للحسابات
المتعددة، اعزل جلسات الرسائل المباشرة حسب الحساب، والقناة، والمرسل:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## التحكم في الوصول

تستخدم الرسائل المباشرة نموذج الاقتران وallowlist العادي في OpenClaw الخاص بـ Plugins
القنوات.

للموافقة على مرسلين جدد:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

للاطلاع على نموذج التحكم الكامل في الوصول، راجع [الاقتران](/ar/channels/pairing).

## التوافق

يتحقق Plugin من إصدار OpenClaw المضيف عند بدء التشغيل.

| خط Plugin | إصدار OpenClaw          | وسم npm  |
| --------- | ----------------------- | -------- |
| `2.x`     | `>=2026.3.22`           | `latest` |
| `1.x`     | `>=2026.1.0 <2026.3.22` | `legacy` |

إذا أبلغ Plugin أن إصدار OpenClaw لديك قديم جدًا، فإما أن تحدّث
OpenClaw أو تثبّت خط Plugin القديم:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## عملية Sidecar

يمكن لـ Plugin الخاص بـ WeChat تشغيل أعمال مساعدة إلى جانب Gateway أثناء مراقبته
لواجهة Tencent iLink البرمجية. في المشكلة #68451، كشف مسار المساعد هذا عن خطأ في
تنظيف OpenClaw العام لـ Gateway القديم: إذ كان بإمكان عملية فرعية أن تحاول تنظيف
عملية Gateway الأصلية، مما يسبب حلقات إعادة تشغيل تحت مديري العمليات مثل systemd.

يستثني تنظيف بدء التشغيل الحالي في OpenClaw العملية الحالية وأسلافها،
لذلك يجب ألا تقتل أداة مساعدة القناة Gateway الذي أطلقها. وهذا الإصلاح
عام؛ وليس مسارًا خاصًا بـ WeChat داخل core.

## استكشاف الأخطاء وإصلاحها

تحقق من التثبيت والحالة:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

إذا ظهرت القناة على أنها مثبتة ولكنها لا تتصل، فتأكد من أن Plugin
ممكّن وأعد التشغيل:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

إذا كان Gateway يُعاد تشغيله بشكل متكرر بعد تمكين WeChat، فحدّث كلًا من OpenClaw وPlugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

تعطيل مؤقت:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## مستندات ذات صلة

- نظرة عامة على القنوات: [قنوات الدردشة](/ar/channels)
- الاقتران: [الاقتران](/ar/channels/pairing)
- توجيه القنوات: [توجيه القنوات](/ar/channels/channel-routing)
- بنية Plugin: [بنية Plugin](/ar/plugins/architecture)
- SDK الخاص بـ Plugin القنوات: [SDK لـ Plugin القنوات](/ar/plugins/sdk-channel-plugins)
- الحزمة الخارجية: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
