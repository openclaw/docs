---
read_when:
    - تدقيق سبب إضافة إعادة هيكلة إدخال القناة الكثير جدًا من التعليمات البرمجية
    - نقل سياسة المسارات أو الأوامر أو الأحداث أو التفعيل أو مجموعات الوصول من Plugins المضمّنة إلى النواة
    - مراجعة ما إذا كان مساعد إدخال القناة يحذف فعليًا شيفرة Plugin المضمّنة
sidebarTitle: Ingress core deletion
summary: خطة تبدأ بالحذف لنقل منطق ربط دخول القنوات المتكرر إلى النواة.
title: خطة حذف نواة الدخول الوارد
x-i18n:
    generated_at: "2026-05-12T01:00:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# خطة حذف نواة الإدخال

لا تكون إعادة هيكلة الإدخال صحية عندما تضيف آلاف الأسطر الصافية. لا يُحتسب
التمركز في النواة إلا عندما يصغر كود الإنتاج في Plugin المضمّن وتُحجر
توافقية SDK القديمة لأطراف ثالثة داخل رقع توافق SDK/النواة.

الشكل التشغيلي المطلوب:

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

ينبغي ألا تترجم Plugins المضمّنة الإدخال مرة أخرى إلى أشكال محلية مثل `AccessResult` أو
`GroupAccessDecision` أو `CommandAuthDecision` أو
`DmCommandAccess` أو
`{ allowed, reasonCode }` ما لم يكن ذلك النوع واجهة API عامة للـ Plugin.

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

الحد الأدنى للتنظيف المتبقي:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

حذف التعليقات فقط لا يُحتسب تنظيفًا. كانت جولة الميزانية السابقة
متساهلة أكثر من اللازم لأنها تضمنت تعليقات QQBot التوضيحية المستعادة؛ هذا
المستند يتتبع حركة الكود التنفيذي/الوثائق/الاختبارات فقط.

أعد القياس بعد كل موجة تنظيف:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## التشخيص

أضافت الجولة الأولى نواة الإدخال المشتركة، ثم تركت قدرًا كبيرًا من
التخويل المحلي للـ Plugin بجانبها:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

هذا يكرر النموذج. نما كود إنتاج النواة بحوالي 3,376 سطرًا، بينما
أصبح كود إنتاج Plugins المضمّنة أصغر بـ 1,240 سطرًا. هذا أفضل من الجولة
الأولى، لكنه ليس ضمن الحد الأدنى للميزانية. يبقى الإصلاح قائمًا على الحذف أولًا:

- احذف DTOs الخاصة بالـ Plugin التي لا تفعل سوى إعادة تسمية حقول الإدخال
- احذف الاختبارات التي تتحقق فقط من شكل الغلاف
- أضف مساعدات النواة فقط عندما يحذف التصحيح نفسه كود Plugin المضمّن
- أبقِ توافق SDK القديم في رقع توافق SDK/النواة فقط
- أعد ترتيب النواة بعد أن يكشف حذف الأغلفة الشكل المستقر

## النقاط الساخنة

ملفات الإنتاج المضمّنة ذات الإضافة الموجبة التي ما زالت بحاجة إلى التصغير:

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

الفرع ليس ضمن الحد الأدنى للميزانية بعد. ينبغي أن يحذف العمل المتبقي
المهم للمراجعة تدفق التخويل المتكرر، أو تجهيز الدور، أو اختبارات الأغلفة
قبل إضافة تجريد آخر للنواة.

## قراءة الكود الحالية

يوجد فاصل النواة الصحي بالفعل في `src/channels/message-access/runtime.ts`:
فهو يملك محولات الهوية، وقوائم السماح الفعلية، وقراءات مخزن الاقتران،
واصفات المسارات، إعدادات الأوامر/الأحداث المسبقة، مجموعات الوصول، والإسقاط
النهائي المحلول `ResolvedChannelMessageIngress`.

النمو المتبقي هو في الغالب غراء Plugin موضوع فوق ذلك الفاصل:

- يغلّف `extensions/telegram/src/ingress.ts` قرارات النواة في مساعدات أوامر/أحداث
  خاصة بـ Telegram، ثم تظل مواقع الاستدعاء تمرر قوائم سماح وقوائم مالكين
  مُطبّعة مسبقًا.
- لا تزال `extensions/discord/src/monitor/dm-command-auth.ts` و
  `extensions/feishu/src/policy.ts` و `extensions/googlechat/src/monitor-access.ts`
  و `extensions/matrix/src/matrix/monitor/access-state.ts` تحتفظ بـ DTOs
  سياسة محلية أو أسماء قرارات قديمة بجانب الإدخال.
- يحتفظ `extensions/signal/src/monitor/access-policy.ts` بشكل صحيح بتطبيع هوية
  Signal وردود الاقتران محليًا، لكنه ما زال يملك فاصل غلاف ينبغي أن ينهار إلى
  استهلاك مباشر للإدخال.
- لا تزال `extensions/nextcloud-talk/src/inbound.ts` و `extensions/irc/src/inbound.ts`
  و `extensions/qa-channel/src/inbound.ts` و `extensions/zalo/src/monitor.ts` و
  `extensions/zalouser/src/monitor.ts` تكرر تجميع المسار/الغلاف/الدور
  الذي يمكن نقله إلى مساعدات دور مشتركة خارج نواة الإدخال.

الخلاصة: نقل مزيد من الكود إلى النواة لا يكون مفيدًا إلا إذا حذف طبقات
أغلفة الـ Plugin هذه في التصحيح نفسه. إضافة تجريد آخر مع إبقاء مرتجعات
الأغلفة في مكانها تكرر الخطأ.

## الحدود

تملك النواة السياسة العامة:

- تطبيع قوائم السماح ومطابقتها
- توسيع مجموعات الوصول والتشخيصات
- قراءات قوائم سماح الرسائل المباشرة من مخزن الاقتران
- بوابات المسار والمرسل والأمر والحدث والتفعيل
- تعيين القبول: الإرسال، الإسقاط، التخطي، المراقبة، الاقتران
- الحالة والقرارات والتشخيصات المنقحة وإسقاطات توافق SDK
- واصفات عامة قابلة لإعادة الاستخدام للهوية والمسار والأمر والحدث والتفعيل
  والنتائج

تملك Plugins حقائق النقل والآثار الجانبية:

- أصالة الـ webhook/المقبس/الطلب
- استخراج هوية المنصة واستدعاءات API
- افتراضات السياسة الخاصة بالقناة
- تسليم تحدي الاقتران، الردود، الإقرارات، التفاعلات، الكتابة، الوسائط، السجل،
  الإعداد، الطبيب، الحالة، السجلات، والنص الظاهر للمستخدمين

يجب أن تبقى النواة محايدة تجاه القنوات: لا Discord أو Slack أو Telegram أو Matrix أو غرفة
أو نقابة أو مساحة أو عميل API أو افتراض خاص بالـ Plugin في
`src/channels/message-access`.

## قاعدة القبول

يجب أن يحذف كل مساعد جديد في النواة كود إنتاج Plugin المضمّن فورًا.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

توقف وأعد التصميم إذا:

- زادت LOC إنتاج الـ Plugin
- نمت الاختبارات أسرع من تقلص الإنتاج
- أعاد مسار ساخن مضمّن DTO لا يفعل سوى إعادة تسمية `ResolvedChannelMessageIngress`
- احتاج مساعد في النواة إلى معرّف قناة، أو كائن منصة، أو عميل API، أو
  افتراض خاص بالقناة

## حزم العمل

1. جمّد الميزانية.
   ضع LOC في PR، وأبقِ فحص الإدخال المهمل أخضر، وضمّن LOC قبل/بعد
   في Commits التنظيف.

2. احذف فواصل DTO الرقيقة.
   استبدل مرتجعات الأغلفة المحلية للـ Plugin بـ `ResolvedChannelMessageIngress` أو
   `senderAccess` أو `commandAccess` أو `routeAccess` أو `ingress` مباشرة. ابدأ
   بـ QQBot وTelegram وSlack وDiscord وSignal وFeishu وMatrix وiMessage و
   Tlon. احذف اختبارات شكل الغلاف؛ أبقِ اختبارات السلوك.

3. أضف تصنيف النتائج فقط مع الحذف.
   يمكن لمصنّف عام أن يعرض `dispatch` و `pairing-required` و
   `skip-activation` و `drop-command` و `drop-route` و `drop-sender` و
   `drop-ingress`. يجب أن يُشتق من مخطط القرار، لا من سلاسل الأسباب،
   وأن ينقل ثلاثة Plugins على الأقل في التصحيح نفسه.

4. أضف بناة واصفات المسارات فقط مع الحذف.
   مساعدات هدف المسار ومرسل المسار العامة مقبولة فقط إذا صغّرت فورًا
   Plugins كثيرة المسارات: Google Chat وIRC وMicrosoft Teams و
   Nextcloud Talk وMattermost وSlack وZalo وZalo Personal.

5. أضف إعدادات الأوامر/الأحداث المسبقة فقط مع الحذف.
   ركّز أشكال أمر النص، والأمر الأصلي، والاستدعاء، والأصل-الموضوع.
   يجب أن يفترض مستهلكو الأوامر عدم التخويل عند عدم تشغيل بوابة أوامر؛
   ويجب ألا تبدأ الأحداث الاقتران.

6. أضف إعدادات الهوية المسبقة فقط حيث تزيل الكود النمطي.
   مساعدات المعرّف المستقر، والمعرّف المستقر مع الأسماء المستعارة، والهاتف/e164،
   ومتعددة المعرّفات مسموحة عندما تدخل القيم الخام إلى مدخل المحول فقط وتحتفظ
   الحالة المنقحة بمعرّفات/أعداد مبهمة.

7. شارك تجميع الدور المخوّل.
   خارج نواة الإدخال، أزل تجهيز المسار/الجلسة/الغلاف/الرد المتكرر من
   QA Channel وIRC وNextcloud Talk وZalo وZalo Personal.
   يمكن أن تملك النواة تسلسل المسار/الجلسة/الغلاف/الإرسال؛ وتحتفظ Plugins
   بالتسليم والسياق الخاص بالقناة.

8. اعزل التوافق.
   تبقى مساعدات SDK المهملة متوافقة على مستوى المصدر، لكن يجب ألا تستورد
   المسارات الساخنة المضمّنة واجهات الإدخال أو تخويل الأوامر المهملة. ينبغي
   لاختبارات التوافق استخدام Plugins أطراف ثالثة مزيفة، لا تفاصيل Plugins المضمّنة.

9. أعد ترتيب النواة.
   بعد أن تستهلك الأغلفة الإسقاطات التشغيلية مباشرة، اطوِ الوحدات أحادية الاستخدام،
   وأزل الصادرات غير المستخدمة، وانقل إسقاط التوافق خارج المسارات الساخنة، وأبقِ
   اختبارات مركزة للهوية والمسار والأمر/الحدث والتفعيل ومجموعات الوصول
   ورقع توافق SDK.

## موجات الحذف

نفّذ هذه بالترتيب. يجب أن تخفض كل موجة LOC إنتاج الـ Plugin المضمّن.

1. انهيار الغلاف، دلتا Plugin المتوقعة: -400 إلى -600.
   استبدل أنواع نتائج `resolveXAccess` و `resolveXCommandAccess` و
   `accessFromIngress` المحلية للـ Plugin بقراءات مباشرة من
   `ResolvedChannelMessageIngress`. الأهداف الأولى: تخويل أوامر الرسائل المباشرة في Discord،
   سياسة Feishu، حالة وصول Matrix، إدخال Telegram، سياسة وصول Signal،
   ومحول QQBot SDK.

2. مساعدات النتائج المشتركة، دلتا Plugin المتوقعة: -200 إلى -350.
   أضف مصنّفًا عامًا واحدًا فقط إذا حذف سلالم `shouldBlockControlCommand`
   المتكررة والاقتران وتخطي التفعيل وحظر المسار وحظر المرسل عبر ثلاثة Plugins على الأقل.

3. بناة واصفات المسارات، دلتا Plugin المتوقعة: -200 إلى -350.
   انقل تجميع واصف هدف المسار ومرسل المسار المتكرر إلى مساعدات النواة.
   الأهداف الأولى: Google Chat وIRC وMicrosoft Teams وNextcloud Talk و
   Mattermost وSlack وZalo وZalo Personal.

4. مشاركة تجميع الدور، دلتا Plugin المتوقعة: -250 إلى -450.
   استخدم تسلسل مسار/جلسة/غلاف/إرسال مشتركًا لـ Plugins الواردة البسيطة.
   الأهداف الأولى: QA Channel وIRC وNextcloud Talk وZalo وZalo Personal.

5. إعادة ترتيب النواة، دلتا النواة المتوقعة: -300 إلى -700.
   بعد أن تستهلك Plugins الإسقاطات التشغيلية مباشرة، احذف الوحدات أحادية الاستخدام،
   وادمج الملفات الصغيرة مرة أخرى في `runtime.ts` أو أشقاء مركزين، وأبقِ ملفات
   توافق SDK منفصلة عن المسارات الساخنة المضمّنة.

6. تقليم الاختبارات، دلتا الاختبارات المتوقعة: -300 إلى -600.
   احذف الاختبارات التي تتحقق فقط من أشكال الأغلفة المحذوفة. أبقِ اختبارات السلوك
   لرفض الأوامر، والرجوع الاحتياطي للمجموعة، ومطابقة الأصل-الموضوع، وتخطي التفعيل،
   ومجموعات الوصول، والاقتران، والتنقيح.

شكل الهبوط الأدنى المتوقع بعد هذه الموجات:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## لا تنقل

لا تنقل الإعدادات الافتراضية لتكوين المنصة، أو تجربة إعداد المستخدم، أو نصوص doctor/fix، أو استعلامات API،
أو فحوصات وجود مالك Slack، أو معالجة الأسماء المستعارة/التحقق في Matrix، أو تحليل
استدعاءات Telegram، أو تحليل صياغة الأوامر، أو تسجيل الأوامر الأصلية، أو تحليل
حمولات التفاعلات، أو ردود الإقران، أو ردود الأوامر، أو الإقرارات، أو الكتابة، أو الوسائط، أو السجل،
أو السجلات.

## التحقق

حلقة محلية مستهدفة:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

استخدم Testbox لإثبات بوابات التغيير الواسعة/مجموعة الاختبارات الكاملة عندما يصبح اتجاه LOC
ضمن الميزانية.

يسجل كل حزمة عمل:

- LOC قبل/بعد حسب الفئة
- أغلفة Plugin المحذوفة
- LOC لمساعدات النواة الجديدة، إن وجدت
- الاختبارات المستهدفة التي تم تشغيلها
- قائمة النقاط الساخنة المتبقية

## معايير الخروج

- لا تحتوي استيرادات الإنتاج المجمعة على واجهات channel-access أو command-auth المتقادمة
- يكون كود التوافق معزولًا في حدود SDK/core
- تستهلك Plugins المجمعة إسقاطات الدخول أو النتائج العامة مباشرة
- يكون LOC الإنتاجي الخاص بـ Plugin أقل صافيًا بما لا يقل عن 1,500 مقارنةً بـ `origin/main`
- يكون LOC الإنتاجي للنواة `<= +1,500`، أو يتم التعويض عن أي زيادة مع بقاء الإجمالي
  `<= +2,000`
- تغطي الاختبارات التمثيلية سلوك التنقيح، والتوجيه، والأوامر/الأحداث، والتنشيط،
  ومجموعة الوصول، والسلوك الاحتياطي الخاص بالقناة
