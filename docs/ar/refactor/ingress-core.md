---
read_when:
    - تدقيق سبب إضافة إعادة هيكلة مدخل القناة كمية كبيرة جدًا من التعليمات البرمجية
    - نقل سياسة المسار أو الأمر أو الحدث أو التفعيل أو مجموعة الوصول من Plugins المضمّنة إلى النواة
    - مراجعة ما إذا كان مساعد إدخال القناة يحذف فعليًا كود Plugin المضمّن
sidebarTitle: Ingress core deletion
summary: خطة قائمة على الحذف أولًا لنقل شيفرة الربط المتكررة الخاصة بوارد القنوات إلى النواة.
title: خطة حذف نواة الإدخال الوارد
x-i18n:
    generated_at: "2026-05-10T19:59:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# خطة حذف نواة الدخول

إعادة هيكلة الدخول ليست سليمة ما دامت تضيف آلاف الأسطر الصافية. لا تُحتسب
المركزة في النواة إلا عندما تصبح شفرة الإنتاج الخاصة بالـ Plugin المضمّنة أصغر،
وتُعزل توافقية SDK القديمة الخاصة بالأطراف الثالثة في طبقات SDK/النواة الوسيطة.

الشكل المطلوب وقت التشغيل:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

ينبغي ألا تترجم الـ Plugins المضمّنة الدخول مرة أخرى إلى أشكال محلية مثل `AccessResult` أو
`GroupAccessDecision` أو `CommandAuthDecision` أو `DmCommandAccess` أو
`{ allowed, reasonCode }` إلا إذا كان ذلك النوع جزءا من API العامة للـ Plugin.

## الميزانية

مقاسة مقابل أساس دمج PR مع `origin/main`، بما في ذلك الملفات غير المتتبعة.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

الحد الأدنى المتبقي للتنظيف:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

لا يُحتسب حذف التعليقات فقط كتنظيف. كانت جولة الميزانية السابقة متساهلة أكثر من اللازم
لأنها شملت تعليقات QQBot التوضيحية المستعادة؛ يتتبع هذا المستند حركة شفرة التنفيذ/المستندات/الاختبارات فقط.

أعد القياس بعد كل موجة تنظيف:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## التشخيص

أضافت الجولة الأولى نواة الدخول المشتركة، ثم تركت بجانبها قدرا كبيرا جدا من
التفويض المحلي الخاص بالـ Plugin:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

هذا يكرر النموذج. نمت شفرة إنتاج النواة بنحو 3,376 سطرا، بينما صارت شفرة إنتاج
الـ Plugin المضمّنة أصغر بمقدار 1,240 سطرا. هذا أفضل من الجولة الأولى، لكنه ليس
ضمن الحد الأدنى للميزانية. يبقى الإصلاح قائما على الحذف أولا:

- احذف DTOs الخاصة بالـ Plugin التي تعيد تسمية حقول الدخول فقط
- احذف الاختبارات التي تتحقق فقط من شكل الغلاف
- أضف مساعدات النواة فقط عندما يحذف التصحيح نفسه شفرة من الـ Plugin المضمّنة
- أبقِ توافقية SDK القديمة في طبقات SDK/النواة الوسيطة فقط
- أعد حزم النواة بعد أن يكشف حذف الأغلفة الشكل المستقر

## النقاط الساخنة

ملفات الإنتاج المضمّنة الموجبة التي لا تزال بحاجة إلى الانكماش:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

الفرع ليس ضمن الحد الأدنى للميزانية بعد. ينبغي أن يحذف العمل المتبقي المهم للمراجعة
تدفق التفويض المتكرر أو تهيئة الأدوار أو اختبارات الأغلفة قبل إضافة تجريد آخر إلى النواة.

## القراءة الحالية للشفرة

توجد وصلة النواة السليمة بالفعل في `src/channels/message-access/runtime.ts`:
فهي تملك محولات الهوية، وقوائم السماح الفعالة، وقراءات مخزن الاقتران، وواصفات
المسار، وإعدادات الأوامر/الأحداث المسبقة، ومجموعات الوصول، وإسقاط
`ResolvedChannelMessageIngress` النهائي المحلول.

النمو المتبقي هو في معظمه غراء Plugin موضوع فوق تلك الوصلة:

- يغلّف `extensions/telegram/src/ingress.ts` قرارات النواة في مساعدات أوامر/أحداث
  خاصة بـ Telegram، ثم لا تزال مواقع الاستدعاء تمرر قوائم سماح وقوائم مالكين
  مطبّعة مسبقا.
- لا تزال `extensions/discord/src/monitor/dm-command-auth.ts` و
  `extensions/feishu/src/policy.ts` و `extensions/googlechat/src/monitor-access.ts`
  و `extensions/matrix/src/matrix/monitor/access-state.ts` تحتفظ بـ DTOs سياسة
  محلية أو أسماء قرارات قديمة بجانب الدخول.
- يحافظ `extensions/signal/src/monitor/access-policy.ts` بشكل صحيح على تطبيع هوية
  Signal وردود الاقتران محليا، لكنه لا يزال يحتوي على وصلة غلاف ينبغي أن تنهار
  إلى استهلاك مباشر للدخول.
- لا تزال `extensions/nextcloud-talk/src/inbound.ts` و `extensions/irc/src/inbound.ts`
  و `extensions/qa-channel/src/inbound.ts` و `extensions/zalo/src/monitor.ts` و
  `extensions/zalouser/src/monitor.ts` تكرر تجميع المسار/الغلاف/الدور الذي يمكن
  نقله إلى مساعدات أدوار مشتركة خارج نواة الدخول.

الخلاصة: نقل مزيد من الشفرة إلى النواة مفيد فقط إذا حذف طبقات أغلفة الـ Plugin هذه
في التصحيح نفسه. إن إضافة تجريد آخر مع ترك قيم إرجاع الأغلفة في مكانها يكرر الخطأ.

## الحدود

تملك النواة السياسة العامة:

- تطبيع قوائم السماح ومطابقتها
- توسيع مجموعات الوصول والتشخيصات
- قراءات قوائم سماح الرسائل الخاصة من مخزن الاقتران
- بوابات المسار والمرسل والأمر والحدث والتفعيل
- تعيين القبول: الإرسال، الإسقاط، التخطي، المراقبة، الاقتران
- الحالة المنقحة، والقرارات، والتشخيصات، وإسقاطات توافقية SDK
- واصفات عامة قابلة لإعادة الاستخدام للهوية، والمسار، والأمر، والحدث، والتفعيل،
  والنتائج

تملك الـ Plugins حقائق النقل والآثار الجانبية:

- صحة الـ webhook/socket/request
- استخراج هوية المنصة وعمليات بحث API
- الإعدادات الافتراضية للسياسة الخاصة بالقناة
- تسليم تحديات الاقتران، والردود، والإقرارات، والتفاعلات، والكتابة، والوسائط، والسجل،
  والإعداد، والطبيب، والحالة، والسجلات، والنص الظاهر للمستخدم

يجب أن تبقى النواة غير مرتبطة بالقناة: لا Discord ولا Slack ولا Telegram ولا Matrix ولا غرفة
ولا نقابة ولا مساحة ولا عميل API ولا إعداد افتراضي خاص بـ Plugin في
`src/channels/message-access`.

## قاعدة القبول

يجب أن يحذف كل مساعد جديد في النواة شفرة إنتاج من الـ Plugin المضمّنة فورا.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

توقف وأعد التصميم إذا:

- زادت أسطر إنتاج الـ Plugin
- نمت الاختبارات أسرع من انكماش الإنتاج
- أعاد مسار ساخن مضمّن DTO لا يفعل سوى إعادة تسمية `ResolvedChannelMessageIngress`
- احتاج مساعد في النواة إلى معرّف قناة، أو كائن منصة، أو عميل API، أو
  إعداد افتراضي خاص بقناة

## حزم العمل

1. جمّد الميزانية.
   ضع LOC في PR، وأبقِ فحص deprecated-ingress الأخضر، وضمّن LOC قبل/بعد
   في التزامات التنظيف.

2. احذف وصلات DTO الرقيقة.
   استبدل قيم إرجاع الأغلفة المحلية الخاصة بالـ Plugin بـ `ResolvedChannelMessageIngress` أو
   `senderAccess` أو `commandAccess` أو `routeAccess` أو `ingress` مباشرة. ابدأ
   بـ QQBot وTelegram وSlack وDiscord وSignal وFeishu وMatrix وiMessage وTlon.
   احذف اختبارات شكل الغلاف؛ أبقِ اختبارات السلوك.

3. أضف تصنيف النتائج فقط مع الحذف.
   قد يعرّض مصنف عام `dispatch` و `pairing-required` و `skip-activation` و
   `drop-command` و `drop-route` و `drop-sender` و `drop-ingress`. يجب أن يشتق
   من مخطط القرار، لا من سلاسل الأسباب، وأن يرحّل ثلاث Plugins على الأقل في التصحيح نفسه.

4. أضف بناة واصفات المسار فقط مع الحذف.
   مساعدات هدف المسار ومرسل المسار العامة مقبولة فقط إذا صغّرت فورا الـ Plugins الثقيلة
   بالمسارات: Google Chat وIRC وMicrosoft Teams وNextcloud Talk وMattermost وSlack
   وZalo وZalo Personal.

5. أضف إعدادات الأوامر/الأحداث المسبقة فقط مع الحذف.
   ركّز أشكال الأمر النصي، والأمر الأصلي، والاستدعاء العكسي، وموضوع الأصل.
   يجب أن يفترض مستهلكو الأوامر عدم التفويض عندما لا تعمل بوابة أمر؛
   يجب ألا تبدأ الأحداث الاقتران.

6. أضف إعدادات الهوية المسبقة فقط حيث تزيل الشفرة المتكررة.
   يُسمح بمساعدات stable-id وstable-id-plus-aliases وphone/e164 ومتعددة المعرّفات
   عندما تدخل القيم الخام فقط إلى دخل المحول وتحتفظ الحالة المنقحة بمعرّفات/أعداد مبهمة.

7. شارك تجميع الدور المصرح.
   خارج نواة الدخول، أزل تهيئة المسار/الغلاف/السياق/الرد المتكررة من QA Channel وIRC
   وNextcloud Talk وZalo وZalo Personal. يجوز للنواة أن تملك تسلسل
   المسار/الجلسة/الغلاف/الإرسال؛ وتحتفظ الـ Plugins بالتسليم والسياق الخاص بالقناة.

8. اعزل التوافقية.
   تبقى مساعدات SDK المهملة متوافقة مع المصدر، لكن يجب ألا تستورد المسارات الساخنة
   المضمّنة واجهات الدخول أو تفويض الأوامر المهملة. ينبغي أن تستخدم اختبارات التوافقية
   Plugins وهمية لأطراف ثالثة، لا دواخل Plugin مضمّنة.

9. أعد حزم النواة.
   بعد أن تستهلك الأغلفة إسقاطات وقت التشغيل مباشرة، ادمج الوحدات ذات الاستخدام الواحد،
   وأزل الصادرات غير المستخدمة، وانقل إسقاط التوافقية خارج المسارات الساخنة، وأبقِ
   اختبارات مركزة للهوية، والمسار، والأمر/الحدث، والتفعيل، ومجموعات الوصول، وطبقات
   التوافق الوسيطة.

## موجات الحذف

شغّل هذه بالترتيب. يجب أن تخفض كل موجة LOC إنتاج الـ Plugin المضمّنة.

1. انهيار الأغلفة، دلتا Plugin المتوقعة: -400 إلى -600.
   استبدل أنواع نتائج `resolveXAccess` و `resolveXCommandAccess` و
   `accessFromIngress` المحلية الخاصة بالـ Plugin بقراءات مباشرة من
   `ResolvedChannelMessageIngress`. الأهداف الأولى: تفويض أوامر الرسائل الخاصة في Discord،
   وسياسة Feishu، وحالة الوصول في Matrix، ودخول Telegram، وسياسة وصول Signal،
   ومحول QQBot SDK.

2. مساعدات النتائج المشتركة، دلتا Plugin المتوقعة: -200 إلى -350.
   أضف مصنفا عاما واحدا فقط إذا حذف سلاسل `shouldBlockControlCommand` والاقتران
   وتخطي التفعيل وحظر المسار وحظر المرسل المتكررة عبر ثلاث Plugins على الأقل.

3. بناة واصفات المسار، دلتا Plugin المتوقعة: -200 إلى -350.
   انقل تجميع واصف هدف المسار ومرسل المسار المتكرر إلى مساعدات النواة.
   الأهداف الأولى: Google Chat وIRC وMicrosoft Teams وNextcloud Talk وMattermost
   وSlack وZalo وZalo Personal.

4. مشاركة تجميع الدور، دلتا Plugin المتوقعة: -250 إلى -450.
   استخدم تسلسل المسار/الجلسة/الغلاف/الإرسال المشترك للـ Plugins الواردة البسيطة.
   الأهداف الأولى: QA Channel وIRC وNextcloud Talk وZalo وZalo Personal.

5. إعادة حزم النواة، دلتا النواة المتوقعة: -300 إلى -700.
   بعد أن تستهلك الـ Plugins إسقاطات وقت التشغيل مباشرة، احذف الوحدات ذات الاستخدام الواحد،
   وادمج الملفات الصغيرة مرة أخرى في `runtime.ts` أو ملفات شقيقة مركزة، وأبقِ ملفات
   توافقية SDK منفصلة عن المسارات الساخنة المضمّنة.

6. تقليم الاختبارات، دلتا الاختبارات المتوقعة: -300 إلى -600.
   احذف الاختبارات التي تتحقق فقط من أشكال الأغلفة المحذوفة. أبقِ اختبارات السلوك
   لرفض الأوامر، والرجوع الاحتياطي للمجموعة، ومطابقة موضوع الأصل، وتخطي التفعيل،
   ومجموعات الوصول، والاقتران، والتنقيح.

الشكل الأدنى المتوقع للهبوط بعد هذه الموجات:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## لا تنقل

لا تنقل افتراضيات إعدادات المنصات، أو تجربة الإعداد، أو نصوص `doctor/fix`، أو عمليات بحث API،
أو فحوص وجود المالك في Slack، أو معالجة الأسماء المستعارة/التحقق في Matrix، أو تحليل
callbacks في Telegram، أو تحليل صياغة الأوامر، أو تسجيل الأوامر الأصلية، أو تحليل
حمولات التفاعلات، أو ردود الاقتران، أو ردود الأوامر، أو إقرارات الاستلام، أو الكتابة، أو الوسائط، أو السجل،
أو السجلات.

## التحقق

حلقة محلية موجّهة:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

استخدم Testbox لإثبات البوابات الواسعة المتغيرة/مجموعة الاختبارات الكاملة بمجرد أن يصبح اتجاه LOC
ضمن الميزانية.

يسجل كل حزمة عمل:

- LOC قبل/بعد حسب الفئة
- أغلفة Plugin المحذوفة
- LOC الجديد لمساعدات النواة، إن وجد
- الاختبارات الموجّهة التي تم تشغيلها
- قائمة النقاط الساخنة المتبقية

## معايير الخروج

- لا تحتوي استيرادات الإنتاج المجمعة على واجهات channel-access أو command-auth المهجورة
- كود التوافق معزول في نقاط تماس SDK/core
- تستهلك Plugins المجمعة إسقاطات الدخول أو النتائج العامة مباشرة
- LOC إنتاج Plugin أقل صافيًا بما لا يقل عن 1,500 مقابل `origin/main`
- LOC إنتاج النواة <= +1,500، أو يُسدَّد أي تجاوز مع بقاء الإجمالي
  <= +2,000
- تغطي الاختبارات التمثيلية سلوك التنقيح، والتوجيه، والأمر/الحدث، والتنشيط،
  ومجموعة الوصول، والسلوك الاحتياطي الخاص بالقناة
