---
read_when:
    - تريد روبوت مساعد شخصيًا على Zalo مع تسجيل الدخول باستخدام رمز QR
    - أنت تثبّت Plugin قناة openclaw-zaloclawbot أو تستكشف أخطاءه وإصلاحها
summary: إعداد قناة Zalo ClawBot عبر Plugin الخارجي openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-12T05:37:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

يتصل OpenClaw بـ Zalo ClawBot من خلال Plugin الخارجي `@zalo-platforms/openclaw-zaloclawbot` المُدرج في الكتالوج. يستخدم تسجيل الدخول رمز QR لتطبيق Zalo Mini App؛ ومعرّف Plugin في الإعدادات هو `openclaw-zaloclawbot`.

## التوافق

| إصدار Plugin | إصدار OpenClaw | وسم توزيع npm | الحالة             |
| ------------ | --------------- | ------------- | ------------------ |
| 0.1.4        | >=2026.4.10     | `latest`      | نشط / تجريبي       |

## المتطلبات الأساسية

- Node.js >= 22
- تثبيت [OpenClaw](https://docs.openclaw.ai/install) (مع توفر CLI الخاص بـ `openclaw`)
- حساب Zalo على جهاز محمول لمسح رمز QR الخاص بتسجيل الدخول

## التثبيت باستخدام الإعداد الأولي (موصى به)

```bash
openclaw onboard
```

اختر **Zalo ClawBot** من قائمة القنوات. يثبّت المعالج Plugin من الكتالوج الرسمي (بعد التحقق من سلامته)، ويعرض رمز QR لتسجيل الدخول في الطرفية، ثم يُكمل إعداد القناة بمجرد مسحه باستخدام تطبيق Zalo.

## التثبيت اليدوي

لإضافة القناة إلى Gateway سبق إعداده:

### 1. تثبيت Plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

استخدم الإصدار المثبّت الدقيق لكي يتحقق OpenClaw من الحزمة باستخدام تجزئة السلامة المسجلة في الكتالوج أثناء التثبيت.

### 2. تمكين Plugin في الإعدادات

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. إنشاء رمز QR وتسجيل الدخول

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

امسح رمز QR المعروض في الطرفية باستخدام تطبيق Zalo للأجهزة المحمولة، واقبل شروط الاستخدام داخل Zalo Mini App، ثم فوّض الجلسة.

### 4. إعادة تشغيل Gateway

```bash
openclaw gateway restart
```

## آلية العمل

على خلاف قناة Zalo القياسية، التي تتطلب تسجيل حساب Zalo Official Account (OA) خاص بك وإعداد بيانات اعتماد ثابتة للمطور، فإن Zalo ClawBot هو **مساعد شخصي مرتبط بالمالك** ويعمل على بنية تحتية رسمية مشتركة:

1. **الإعداد الأولي:** يؤدي رمز QR إلى Zalo Mini App يربط روبوتًا خاصًا جرى توفيره حديثًا ضمن حساب OA رسمي مشترك بمعرّف مستخدم Zalo الخاص بك مباشرةً.
2. **خصوصية مرتبطة بالمالك:** لا يتواصل الروبوت إلا مع مالكه. وتُسقط رسائل المستخدمين الآخرين على مستوى المنصة.
3. **مسار API الرسمي:** يستخدم Plugin واجهات API الخاصة بـ Zalo Bot Platform، وليس أتمتة المتصفح أو جلسات الويب.

## التفاصيل الداخلية

يتواصل Plugin مع Zalo عبر حلقة استقصاء طويل مستمرة (`getUpdates`). وتكون Webhooks معطلة افتراضيًا عند تشغيل Gateway محليًا من سطح المكتب أو الطرفية. تُعالج الرسائل من جانب العميل وتُربط ببيئة تشغيل الوكيل المحلي لديك.

يدير Plugin بيانات اعتماد الروبوت ضمن دليل حالة OpenClaw. تعامل مع هذا الدليل على أنه حساس، وأخضعه لسياسة التحكم في الوصول والنسخ الاحتياطي نفسها المطبقة على بقية حالة OpenClaw.

توجد بيئة تشغيل Plugin هذا بالكامل داخل الحزمة الخارجية `@zalo-platforms/openclaw-zaloclawbot`؛ أما تفاصيل السلوك الواردة أدناه، بخلاف التثبيت والإعداد، فهي وفقًا لما أفاد به مشرفو Plugin ولم يُتحقق منها بالرجوع إلى الشفرة المصدرية الأساسية لـ OpenClaw.

## استكشاف الأخطاء وإصلاحها

- **انتهاء مهلة تسجيل الدخول عبر QR:** تنتهي صلاحية رمز تسجيل الدخول (`zbsk`) بعد 5 دقائق لأسباب أمنية. إذا انتهت صلاحية رمز QR قبل مسحه، فأعد تشغيل أمر تسجيل الدخول لإنشاء رمز جديد.
- **فشل تحميل Gateway:** تأكد من أن إصدار مضيف OpenClaw هو `2026.4.10` أو أحدث. لا تدعم الإصدارات الأقدم سجل تثبيت Plugins الخارجية من npm الذي يتطلبه هذا المعرّف.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [Zalo](/ar/channels/zalo) - قناة Zalo Bot Creator / Marketplace المضمّنة
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة ومسار الاقتران
- [Plugins](/ar/tools/plugin) - تثبيت Plugins وإدارتها
