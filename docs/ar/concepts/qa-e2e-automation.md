---
read_when:
    - فهم كيفية ترابط منظومة ضمان الجودة
    - توسيع qa-lab أو qa-channel أو محوّل النقل
    - إضافة سيناريوهات ضمان الجودة المدعومة بالمستودع
    - بناء أتمتة ضمان جودة أكثر واقعية حول لوحة معلومات Gateway
summary: 'نظرة عامة على حزمة ضمان الجودة: qa-lab وqa-channel، والسيناريوهات المدعومة بالمستودع، ومسارات النقل المباشرة، ومحوّلات النقل، وإعداد التقارير.'
title: نظرة عامة على ضمان الجودة
x-i18n:
    generated_at: "2026-05-10T19:36:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

تهدف حزمة QA الخاصة إلى اختبار OpenClaw بطريقة أكثر واقعية،
ومشكّلة على هيئة قناة، مما يستطيع اختبار وحدة واحد فعله.

الأجزاء الحالية:

- `extensions/qa-channel`: قناة رسائل اصطناعية ذات أسطح للرسائل المباشرة، والقنوات، والسلاسل،
  والتفاعلات، والتعديل، والحذف.
- `extensions/qa-lab`: واجهة مصحّح أخطاء وناقل QA لمراقبة النص المنقول،
  وحقن الرسائل الواردة، وتصدير تقرير Markdown.
- `extensions/qa-matrix`، وPlugins التشغيل المستقبلية: محوّلات نقل حيّة
  تشغّل قناة حقيقية داخل Gateway QA فرعية.
- `qa/`: أصول أولية مدعومة بالمستودع لمهمة البدء وسيناريوهات QA
  الأساسية.
- [Mantis](/ar/concepts/mantis): تحقق حي قبل وبعد للأخطاء التي
  تحتاج إلى وسائل نقل حقيقية، ولقطات شاشة للمتصفح، وحالة VM، وأدلة PR.

## سطح الأوامر

يعمل كل تدفق QA تحت `pnpm openclaw qa <subcommand>`. لدى كثير منها أسماء مستعارة لنصوص `pnpm qa:*`؛ وكلا الشكلين مدعومان.

| الأمر                                             | الغرض                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | فحص ذاتي مضمّن لـ QA؛ يكتب تقرير Markdown.                                                                                                                                                                                                                        |
| `qa suite`                                          | تشغيل سيناريوهات مدعومة بالمستودع مقابل مسار Gateway QA. الأسماء المستعارة: `pnpm openclaw qa suite --runner multipass` من أجل VM Linux يمكن التخلص منها.                                                                                                                                  |
| `qa coverage`                                       | طباعة مخزون تغطية السيناريو بصيغة markdown (`--json` لمخرجات الآلة).                                                                                                                                                                                           |
| `qa parity-report`                                  | مقارنة ملفّي `qa-suite-summary.json` وكتابة تقرير التكافؤ الوكيلي.                                                                                                                                                                                          |
| `qa character-eval`                                 | تشغيل سيناريو QA للشخصية عبر نماذج حيّة متعددة مع تقرير محكّم. راجع [التقارير](#reporting).                                                                                                                                                            |
| `qa manual`                                         | تشغيل مطالبة لمرة واحدة مقابل مسار المزوّد/النموذج المحدد.                                                                                                                                                                                                          |
| `qa ui`                                             | بدء واجهة مصحح QA وناقل QA المحلي (الاسم المستعار: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | بناء صورة Docker المعدّة مسبقًا لـ QA.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | كتابة هيكل docker-compose للوحة معلومات QA + مسار Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | بناء موقع QA، وبدء الحزمة المدعومة بـ Docker، وطباعة URL (الاسم المستعار: `pnpm qa:lab:up`؛ يضيف متغير `:fast` الخيار `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | بدء خادم مزوّد AIMock فقط.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | بدء خادم مزوّد `mock-openai` الواعي بالسيناريو فقط.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | إدارة مجمع بيانات اعتماد Convex المشترك.                                                                                                                                                                                                                               |
| `qa matrix`                                         | مسار نقل حي مقابل خادم Tuwunel منزلي يمكن التخلص منه. راجع [QA لـ Matrix](/ar/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | مسار نقل حي مقابل مجموعة Telegram خاصة حقيقية.                                                                                                                                                                                                              |
| `qa discord`                                        | مسار نقل حي مقابل قناة Guild خاصة حقيقية في Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | مسار نقل حي مقابل قناة Slack خاصة حقيقية.                                                                                                                                                                                                               |
| `qa mantis`                                         | مشغّل تحقق قبل وبعد لأخطاء النقل الحي، مع أدلة تفاعلات حالة Discord، وفحص سطح مكتب/متصفح Crabbox، وفحص Slack داخل VNC. راجع [Mantis](/ar/concepts/mantis) و[دليل تشغيل Mantis Slack Desktop](/ar/concepts/mantis-slack-desktop-runbook). |

## تدفق المشغّل

تدفق مشغّل QA الحالي هو موقع QA بلوحتين:

- اليسار: لوحة معلومات Gateway (واجهة التحكم) مع الوكيل.
- اليمين: QA Lab، يعرض النص المنقول الشبيه بـ Slack وخطة السيناريو.

شغّله باستخدام:

```bash
pnpm qa:lab:up
```

يبني ذلك موقع QA، ويبدأ مسار Gateway المدعوم بـ Docker، ويعرض صفحة
QA Lab حيث يستطيع المشغّل أو حلقة الأتمتة إعطاء الوكيل مهمة QA،
ومراقبة سلوك القناة الحقيقي، وتسجيل ما نجح أو فشل أو
ظل محظورًا.

للدوران الأسرع على واجهة QA Lab دون إعادة بناء صورة Docker في كل مرة،
ابدأ الحزمة مع حزمة QA Lab مركّبة عبر bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

يبقي `qa:lab:up:fast` خدمات Docker على صورة مبنية مسبقًا ويركّب
`extensions/qa-lab/web/dist` داخل حاوية `qa-lab` عبر bind mount. يعيد `qa:lab:watch`
بناء تلك الحزمة عند التغيير، ويُعاد تحميل المتصفح تلقائيًا عندما يتغير
هاش أصول QA Lab.

لفحص دخان محلي لتتبّع OpenTelemetry، شغّل:

```bash
pnpm qa:otel:smoke
```

يبدأ ذلك النص مستقبِل تتبع OTLP/HTTP محليًا، ويشغّل سيناريو QA
`otel-trace-smoke` مع تمكين Plugin `diagnostics-otel`، ثم
يفك ترميز spans protobuf المصدّرة ويتحقق من الشكل الحرج للإصدار:
يجب أن تكون `openclaw.run`، و`openclaw.harness.run`، و`openclaw.model.call`،
و`openclaw.context.assembled`، و`openclaw.message.delivery` موجودة؛
ويجب ألا تصدّر نداءات النموذج `StreamAbandoned` في الأدوار الناجحة؛ ويجب أن تبقى معرّفات التشخيص الخام وسمات
`openclaw.content.*` خارج التتبع. يكتب
`otel-smoke-summary.json` بجانب آثار حزمة QA.

يبقى QA الخاص بالملاحظة مقتصرًا على checkout للمصدر. يتعمّد ملف npm tarball حذف
QA Lab، لذلك لا تشغّل مسارات إصدار Docker الخاصة بالحزم أوامر `qa`. استخدم
`pnpm qa:otel:smoke` من checkout مصدر مبني عند تغيير
أدوات تشخيص القياس.

لمسار فحص دخان Matrix حقيقي النقل، شغّل:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

يوجد مرجع CLI الكامل، وفهرس الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط الآثار لهذا المسار في [QA لـ Matrix](/ar/concepts/qa-matrix). بنظرة سريعة: يوفّر خادم Tuwunel منزليًا يمكن التخلص منه في Docker، ويسجّل مستخدمين مؤقتين للسائق/SUT/المراقب، ويشغّل Plugin Matrix الحقيقي داخل Gateway QA فرعية محددة النطاق لذلك النقل (من دون `qa-channel`)، ثم يكتب تقرير Markdown، وملخص JSON، وأثر أحداث مرصودة، وسجل مخرجات مدمجًا تحت `.artifacts/qa-e2e/matrix-<timestamp>/`.

تغطي السيناريوهات سلوك النقل الذي لا تستطيع اختبارات الوحدة إثباته من البداية إلى النهاية: بوابة الإشارات، وسياسات السماح للبوت، وقوائم السماح، والردود في المستوى الأعلى وداخل السلاسل، وتوجيه الرسائل المباشرة، ومعالجة التفاعلات، وقمع التعديل الوارد، وإزالة تكرار إعادة العرض بعد إعادة التشغيل، والتعافي من انقطاع الخادم المنزلي، وتسليم بيانات اعتماد الموافقة، ومعالجة الوسائط، وتدفقات تمهيد/استرداد/تحقق E2EE في Matrix. كما تقود شخصية CLI الخاصة بـ E2EE أوامر `openclaw matrix encryption setup` وأوامر التحقق عبر الخادم المنزلي نفسه القابل للتخلص منه قبل فحص ردود Gateway.

لدى Discord أيضًا سيناريوهات Mantis اختيارية فقط لإعادة إنتاج الأخطاء. استخدم
`--scenario discord-status-reactions-tool-only` للخط الزمني الصريح لتفاعل الحالة،
أو `--scenario discord-thread-reply-filepath-attachment` لإنشاء سلسلة Discord
حقيقية والتحقق من أن `message.thread-reply` يحافظ على مرفق
`filePath`. تبقى هذه السيناريوهات خارج مسار Discord الحي الافتراضي
لأنها مجسات إعادة إنتاج قبل/بعد وليست تغطية دخان واسعة.
يمكن لسير عمل Mantis الخاص بمرفقات السلاسل أيضًا إضافة فيديو شاهد Discord Web
مسجّل الدخول عند ضبط `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` أو
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` في بيئة QA.
ملف تعريف العارض هذا مخصص للالتقاط المرئي فقط؛ ما زال قرار النجاح/الفشل
يأتي من مرجع Discord REST.

يستخدم CI سطح الأوامر نفسه في `.github/workflows/qa-live-transports-convex.yml`. تشغّل عمليات الجدولة والعمليات اليدوية الافتراضية ملف Matrix الشخصي السريع مع بيانات اعتماد frontier الحية، و`--fast`، و`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. تؤدي العملية اليدوية `matrix_profile=all` إلى التفرع إلى أجزاء الملفات الشخصية الخمسة كي يعمل الفهرس الشامل بالتوازي مع إبقاء دليل آثار واحد لكل جزء.

لمسارات فحص دخان Telegram وDiscord وSlack الحقيقية النقل:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

تستهدف قناة حقيقية موجودة مسبقًا مع بوتين (السائق + SUT). متغيرات البيئة المطلوبة، وقوائم السيناريوهات، وآثار المخرجات، ومجمع بيانات اعتماد Convex موثقة في [مرجع QA لـ Telegram وDiscord وSlack](#telegram-discord-and-slack-qa-reference) أدناه.

لإجراء تشغيل VM سطح مكتب Slack كامل مع إنقاذ عبر VNC، شغّل:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر ذلك الأمر جهاز سطح مكتب/متصفح Crabbox، ويشغّل مسار Slack الحي
داخل VM، ويفتح Slack Web في متصفح VNC، ويلتقط سطح المكتب، وينسخ
`slack-qa/` و`slack-desktop-smoke.png` و`slack-desktop-smoke.mp4`
عندما يكون التقاط الفيديو متاحًا إلى دليل عناصر Mantis. توفر تأجيرات
سطح المكتب/المتصفح في Crabbox أدوات الالتقاط وحزم المساعدة للمتصفح/البناء الأصلي
مسبقًا، لذلك لا ينبغي أن يثبت السيناريو بدائل إلا على التأجيرات الأقدم.
تبلغ Mantis عن التوقيتات الإجمالية ولكل مرحلة في
`mantis-slack-desktop-smoke-report.md` بحيث تبين عمليات التشغيل البطيئة ما إذا كان الوقت قد صُرف في
تهيئة التأجير، أو الحصول على بيانات الاعتماد، أو الإعداد البعيد، أو نسخ العناصر. أعد استخدام
`--lease-id <cbx_...>` بعد تسجيل الدخول إلى Slack Web يدويًا عبر VNC؛
كما تبقي التأجيرات المعاد استخدامها ذاكرة التخزين المؤقت لمخزن pnpm الخاص بـ Crabbox دافئة. يتحقق الوضع الافتراضي
`--hydrate-mode source` من نسخة مصدرية ويشغّل التثبيت/البناء
داخل VM. استخدم `--hydrate-mode prehydrated` فقط عندما تكون مساحة العمل البعيدة المعاد استخدامها
تحتوي بالفعل على `node_modules` و`dist/` مبني؛ فهذا الوضع يتخطى
خطوة التثبيت/البناء المكلفة ويفشل بطريقة مغلقة عندما لا تكون مساحة العمل جاهزة.
مع `--gateway-setup`، تترك Mantis بوابة OpenClaw Slack دائمة
قيد التشغيل داخل VM على المنفذ `38973`؛ وبدون ذلك، يشغّل الأمر
مسار Slack QA العادي من بوت إلى بوت ويخرج بعد التقاط العناصر.

توجد قائمة تحقق المشغل، وأمر إرسال سير عمل GitHub، وعقد تعليق الأدلة،
وجدول قرار وضع الترطيب، وتفسير التوقيتات، وخطوات التعامل مع الفشل في [دليل تشغيل Mantis Slack Desktop](/ar/concepts/mantis-slack-desktop-runbook).

لمهمة سطح مكتب بنمط وكيل/رؤية حاسوبية، شغّل:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

يستأجر `visual-task` جهاز سطح مكتب/متصفح Crabbox أو يعيد استخدامه، ويبدأ
`crabbox record --while`، ويقود المتصفح المرئي عبر
`visual-driver` متداخل، ويلتقط `visual-task.png`، ويشغّل `openclaw infer image describe`
على لقطة الشاشة عند تحديد `--vision-mode image-describe`، ويكتب
`visual-task.mp4` و`mantis-visual-task-summary.json`
و`mantis-visual-task-driver-result.json` و`mantis-visual-task-report.md`.
عند تعيين `--expect-text`، تطلب رسالة الرؤية حكم JSON منظّمًا
ولا تنجح إلا عندما يبلغ النموذج عن دليل مرئي إيجابي؛ أما الاستجابة السلبية
التي تقتبس النص الهدف فقط فتفشل في التحقق.
استخدم `--vision-mode metadata` لاختبار دخان بلا نموذج يثبت توصيل
سطح المكتب والمتصفح ولقطة الشاشة والفيديو دون استدعاء
مزود فهم صور. التسجيل عنصر مطلوب لـ `visual-task`؛ إذا لم تسجل Crabbox
أي `visual-task.mp4` غير فارغ، تفشل المهمة حتى إذا نجح مشغل الرؤية.
عند الفشل، تحتفظ Mantis بالتأجير من أجل VNC ما لم تكن المهمة قد
نجحت بالفعل ولم يتم تعيين `--keep-lease`.

قبل استخدام بيانات الاعتماد الحية المجمعة، شغّل:

```bash
pnpm openclaw qa credentials doctor
```

يفحص الطبيب بيئة وسيط Convex، ويتحقق من إعدادات نقاط النهاية، ويتأكد من إمكانية وصول admin/list عند وجود سر المشرف. ولا يبلغ إلا عن حالة التعيين/الفقدان للأسرار.

## تغطية النقل الحي

تشارك مسارات النقل الحي عقدًا واحدًا بدل أن يخترع كل منها شكل قائمة سيناريوهات خاصًا به. `qa-channel` هي مجموعة سلوك المنتج الاصطناعية الواسعة وليست جزءًا من مصفوفة تغطية النقل الحي.

| المسار     | Canary | بوابة الإشارة | من بوت إلى بوت | حظر قائمة السماح | رد من المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة الخيط | عزل الخيط | ملاحظة التفاعل | أمر المساعدة | تسجيل الأمر الأصلي |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

يبقي هذا `qa-channel` كمجموعة سلوك المنتج الواسعة بينما تشترك Matrix
وTelegram ووسائل النقل الحية المستقبلية في قائمة تحقق صريحة واحدة لعقد النقل.

لمسار VM Linux مؤقت من دون إدخال Docker في مسار QA، شغّل:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

يُقلع هذا ضيف Multipass جديدًا، ويثبت التبعيات، ويبني OpenClaw
داخل الضيف، ويشغّل `qa suite`، ثم ينسخ تقرير QA العادي
والملخص مرة أخرى إلى `.artifacts/qa-e2e/...` على المضيف.
يعيد استخدام سلوك اختيار السيناريو نفسه مثل `qa suite` على المضيف.
تنفذ تشغيلات مجموعة المضيف وMultipass عدة سيناريوهات مختارة بالتوازي
مع عمال Gateway معزولين افتراضيًا. القيمة الافتراضية لتزامن `qa-channel`
هي 4، ومحدودة بعدد السيناريوهات المختارة. استخدم `--concurrency <count>` لضبط
عدد العمال، أو `--concurrency 1` للتنفيذ التسلسلي.
يخرج الأمر برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
تريد العناصر دون رمز خروج فاشل.
تمرر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
مفاتيح المزود المستندة إلى البيئة، ومسار إعداد مزود QA الحي، و
`CODEX_HOME` عند وجوده. أبقِ `--output-dir` تحت جذر المستودع لكي يتمكن الضيف
من الكتابة مرة أخرى عبر مساحة العمل المركبة.

## مرجع Telegram وDiscord وSlack QA

لدى Matrix [صفحة مخصصة](/ar/concepts/qa-matrix) بسبب عدد سيناريوهاتها وتوفير خادم المنزل المدعوم بـ Docker. أما Telegram وDiscord وSlack فهي أصغر - بضع سيناريوهات لكل منها، بلا نظام ملفات تعريف، وضد قنوات حقيقية موجودة مسبقًا - لذلك يوجد مرجعها هنا.

### أعلام CLI المشتركة

تسجل هذه المسارات عبر `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` وتقبل الأعلام نفسها:

| العلم                                  | الافتراضي                                                         | الوصف                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | شغّل هذا السيناريو فقط. قابل للتكرار.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | حيث تُكتب التقارير/الملخص/الرسائل المرصودة وسجل الإخراج. تُحل المسارات النسبية مقابل `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | جذر المستودع عند الاستدعاء من cwd محايد.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | معرف حساب مؤقت داخل إعداد Gateway الخاص بـ QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` أو `live-frontier` (لا يزال `live-openai` القديم يعمل).                                                  |
| `--model <ref>` / `--alt-model <ref>` | افتراضي المزود                                                | مراجع النموذج الأساسية/البديلة.                                                                                         |
| `--fast`                              | متوقف                                                             | وضع المزود السريع حيث يكون مدعومًا.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | راجع [مجمع بيانات اعتماد Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` في CI، و`maintainer` خلاف ذلك                              | الدور المستخدم عند `--credential-source convex`.                                                                          |

يخرج كل مسار برمز غير صفري عند فشل أي سيناريو. يكتب `--allow-failures` العناصر دون تعيين رمز خروج فاشل.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

يستهدف مجموعة Telegram خاصة حقيقية واحدة مع بوتين مميزين (المشغل + SUT). يجب أن يملك بوت SUT اسم مستخدم Telegram؛ وتعمل ملاحظة بوت إلى بوت بأفضل شكل عندما يكون لدى كلا البوتين **وضع التواصل من بوت إلى بوت** مفعّلًا في `@BotFather`.

البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - معرف محادثة رقمي (سلسلة).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختياري:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` يحتفظ بمحتوى الرسائل في عناصر الرسائل المرصودة (الافتراضي يحجبها).

السيناريوهات (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

تغطي المجموعة الافتراضية الضمنية دائمًا Canary، وبوابة الإشارة، وردود الأوامر الأصلية، وعنونة الأوامر، وردود المجموعة من بوت إلى بوت. تشمل افتراضيات `mock-openai` أيضًا فحوصات حتمية لسلسلة الرد وتدفق الرسالة النهائية. يبقى `telegram-current-session-status-tool` اختياريًا لأنه لا يكون مستقرًا إلا عندما يأتي في خيط مباشر بعد Canary، وليس بعد ردود أوامر أصلية عشوائية. استخدم `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` لطباعة التقسيم الحالي بين الافتراضي/الاختياري مع مراجع الانحدار.

عناصر الإخراج:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - يتضمن RTT لكل رد (إرسال المشغل → ملاحظة رد SUT) بدءًا من Canary.
- `telegram-qa-observed-messages.json` - تُحجب المحتويات ما لم يكن `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

يستهدف قناة نقابة Discord خاصة حقيقية واحدة مع بوتين: بوت مشغل يتحكم به الحزام وبوت SUT يبدأه Gateway فرعي لـ OpenClaw عبر Plugin Discord المضمن. يتحقق من التعامل مع إشارات القناة، ومن أن بوت SUT قد سجل أمر `/help` الأصلي مع Discord، ومن سيناريوهات أدلة Mantis الاختيارية.

البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - يجب أن يطابق معرّف مستخدم بوت SUT الذي يعيده Discord (وإلا يفشل المسار بسرعة).

اختياري:

- يحافظ `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` على نصوص الرسائل في عتاد الرسائل المرصودة.
- يحدد `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` قناة الصوت/المنصة لـ `discord-voice-autojoin`؛ وبدونه، يختار السيناريو أول قناة صوت/منصة مرئية لبوت SUT.

السيناريوهات (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - سيناريو صوت اختياري. يعمل بمفرده، ويفعّل `channels.discord.voice.autoJoin`، ويتحقق من أن حالة صوت Discord الحالية لبوت SUT هي قناة الصوت/المنصة الهدف. قد تتضمن بيانات اعتماد Discord في Convex قيمة `voiceChannelId` اختيارية؛ وإلا يكتشف المشغّل أول قناة صوت/منصة مرئية في الخادم.
- `discord-status-reactions-tool-only` - سيناريو Mantis اختياري. يعمل بمفرده لأنه يبدّل SUT إلى ردود خادم دائمة التشغيل ومقتصرة على الأدوات مع `messages.statusReactions.enabled=true`، ثم يلتقط مخططًا زمنيًا لتفاعلات REST إضافة إلى عتاد مرئي HTML/PNG. كما تحافظ تقارير Mantis قبل/بعد على عتاد MP4 المقدّم من السيناريو باسمَي `baseline.mp4` و`candidate.mp4`.

شغّل سيناريو الانضمام التلقائي إلى صوت Discord صراحة:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

شغّل سيناريو تفاعل الحالة في Mantis صراحة:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

عتاد الإخراج:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - تُنقّح النصوص ما لم يكن `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` و`discord-status-reactions-tool-only-timeline.png` عند تشغيل سيناريو تفاعل الحالة.

### ضمان جودة Slack

```bash
pnpm openclaw qa slack
```

يستهدف قناة Slack خاصة حقيقية واحدة مع بوتين متميزين: بوت مشغّل يتحكم به الحزام، وبوت SUT يشغّله Gateway فرعي من OpenClaw عبر Plugin Slack المضمّن.

متغيرات البيئة المطلوبة عند استخدام `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختياري:

- يحافظ `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` على نصوص الرسائل في عتاد الرسائل المرصودة.

السيناريوهات (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

عتاد الإخراج:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - تُنقّح النصوص ما لم يكن `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### إعداد مساحة عمل Slack

يحتاج المسار إلى تطبيقَي Slack متميزين في مساحة عمل واحدة، إضافة إلى قناة يكون كلا البوتين عضوين فيها:

- `channelId` - معرّف `Cxxxxxxxxxx` لقناة دُعي إليها كلا البوتين. استخدم قناة مخصصة؛ ينشر المسار في كل تشغيل.
- `driverBotToken` - رمز البوت (`xoxb-...`) لتطبيق **المشغّل**.
- `sutBotToken` - رمز البوت (`xoxb-...`) لتطبيق **SUT**، ويجب أن يكون تطبيق Slack منفصلًا عن المشغّل حتى يكون معرّف مستخدم البوت متميزًا.
- `sutAppToken` - رمز على مستوى التطبيق (`xapp-...`) لتطبيق SUT مع `connections:write`، ويستخدمه Socket Mode حتى يستطيع تطبيق SUT تلقي الأحداث.

فضّل مساحة عمل Slack مخصصة لضمان الجودة بدلًا من إعادة استخدام مساحة عمل إنتاجية.

يضيّق بيان SUT أدناه عمدًا تثبيت الإنتاج الخاص بـ Plugin Slack المضمّن (`extensions/slack/src/setup-shared.ts:10`) إلى الأذونات والأحداث التي تغطيها مجموعة ضمان جودة Slack الحية. لإعداد قناة الإنتاج كما يراه المستخدمون، راجع [الإعداد السريع لقناة Slack](/ar/channels/slack#quick-setup)؛ زوج المشغّل/SUT الخاص بضمان الجودة منفصل عمدًا لأن المسار يحتاج إلى معرّفَي مستخدم بوت متميزين في مساحة عمل واحدة.

**1. أنشئ تطبيق المشغّل**

انتقل إلى [api.slack.com/apps](https://api.slack.com/apps) ← _إنشاء تطبيق جديد_ ← _من بيان_ ← اختر مساحة عمل ضمان الجودة، والصق البيان التالي، ثم _التثبيت في مساحة العمل_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

انسخ _رمز OAuth لمستخدم البوت_ (`xoxb-...`) - سيصبح ذلك `driverBotToken`. لا يحتاج المشغّل إلا إلى نشر الرسائل وتعريف نفسه؛ لا أحداث، ولا Socket Mode.

**2. أنشئ تطبيق SUT**

كرر _إنشاء تطبيق جديد ← من بيان_ في مساحة العمل نفسها. يستخدم تطبيق ضمان الجودة هذا عمدًا نسخة أضيق من بيان الإنتاج الخاص بـ Plugin Slack المضمّن (`extensions/slack/src/setup-shared.ts:10`): تُحذف نطاقات وأحداث التفاعل لأن مجموعة ضمان جودة Slack الحية لا تغطي التعامل مع التفاعلات بعد.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

بعد أن ينشئ Slack التطبيق، نفّذ شيئين في صفحة إعداداته:

- _التثبيت في مساحة العمل_ ← انسخ _رمز OAuth لمستخدم البوت_ ← يصبح ذلك `sutBotToken`.
- _المعلومات الأساسية ← رموز على مستوى التطبيق ← إنشاء رمز ونطاقات_ ← أضف النطاق `connections:write` ← احفظ ← انسخ قيمة `xapp-...` ← تصبح ذلك `sutAppToken`.

تحقق من أن للبوتين معرّفَي مستخدم متميزين باستدعاء `auth.test` على كل رمز. يميز وقت التشغيل بين المشغّل وSUT حسب معرّف المستخدم؛ إعادة استخدام تطبيق واحد لكليهما ستفشل حجب الإشارات فورًا.

**3. أنشئ القناة**

في مساحة عمل ضمان الجودة، أنشئ قناة (مثلًا `#openclaw-qa`) وادعُ كلا البوتين من داخل القناة:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

انسخ معرّف `Cxxxxxxxxxx` من _معلومات القناة ← حول ← معرّف القناة_ - سيصبح ذلك `channelId`. تعمل القناة العامة؛ وإذا استخدمت قناة خاصة فلكلا التطبيقين `groups:history` مسبقًا، لذلك ستظل قراءات السجل الخاصة بالحزام ناجحة.

**4. سجّل بيانات الاعتماد**

خياران. استخدم متغيرات البيئة لتصحيح الأخطاء على جهاز واحد (اضبط متغيرات `OPENCLAW_QA_SLACK_*` الأربعة ومرّر `--credential-source env`)، أو بذر مجمع Convex المشترك حتى يستطيع CI والمشرفون الآخرون استئجارها.

بالنسبة إلى مجمع Convex، اكتب الحقول الأربعة في ملف JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

مع تصدير `OPENCLAW_QA_CONVEX_SITE_URL` و`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` في الصدفة لديك، سجّل وتحقق:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

توقع `count: 1`، و`status: "active"`، دون حقل `lease`.

**5. تحقق من النهاية إلى النهاية**

شغّل المسار محليًا للتأكد من أن كلا البوتين يستطيعان التحدث إلى بعضهما عبر الوسيط:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

يكتمل التشغيل الأخضر في أقل بكثير من 30 ثانية، ويُظهر `slack-qa-report.md` أن كلًا من `slack-canary` و`slack-mention-gating` بحالة `pass`. إذا علّق المسار لنحو 90 ثانية وخرج برسالة `Convex credential pool exhausted for kind "slack"`، فإما أن المجمع فارغ أو أن كل صف مستأجر - سيخبرك `qa credentials list --kind slack --status all --json` أيهما.

### مجمع بيانات اعتماد Convex

يمكن لمسارات Telegram وDiscord وSlack وWhatsApp استئجار بيانات الاعتماد من مجمع Convex مشترك بدلًا من قراءة متغيرات البيئة أعلاه. مرّر `--credential-source convex` (أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)؛ يحصل QA Lab على عقد استئجار حصري، ويرسل له Heartbeat طوال مدة التشغيل، ويحرره عند الإيقاف. أنواع المجمع هي `"telegram"` و`"discord"` و`"slack"` و`"whatsapp"`.

أشكال الحمولة التي يتحقق منها الوسيط في `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - يجب أن يكون `groupId` سلسلة معرّف دردشة رقمية.
- مستخدم Telegram حقيقي (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - استئجار حصري واحد لحساب مؤقت يستخدمه كل من مشغّل TDLib CLI وشاهد Telegram Desktop المرئي.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - يجب أن تكون أرقام الهاتف سلاسل E.164 متميزة.

لإثبات Telegram مرئي بمستخدم حقيقي، فضّل جلسة Crabbox محتفظًا بها:

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

يحتفظ `start` بعقد استئجار Convex `telegram-user` حصري واحد لكل من مشغّل TDLib CLI وشاهد Telegram Desktop، ويبدأ تسجيل سطح المكتب، ويترك Crabbox حيًا لخطوات إعادة الإنتاج العشوائية التي يقودها الوكيل. يمكن للوكلاء استخدام `send` و`run` و`screenshot` و`status` حتى يكتفوا، ثم يجمع `finish` لقطة الشاشة والفيديو وفيديو/GIF مقصوص الحركة ومخرجات فحص TDLib والسجلات قبل تحرير بيانات الاعتماد. يعلّق `publish --session <file> --pr <number>` بصورة GIF الحركية فقط افتراضيًا؛ و`--full-artifacts` هو الاشتراك الصريح في السجلات ومخرجات JSON. يظل أمر `probe` الافتراضي اختصارًا بأمر واحد لفحوصات دخان `/status` السريعة.

استخدم `--mock-response-file <path>` عندما يحتاج PR إلى فرق بصري حتمي:
يمكن تشغيل رد نموذج المحاكاة نفسه على `main` وعلى رأس PR بينما تتغير
صياغة Telegram أو طبقة التسليم. تم ضبط إعدادات الالتقاط الافتراضية لتعليقات PR:
فئة Crabbox القياسية، وتسجيل سطح مكتب بمعدل 24fps، وملف GIF حركي بمعدل 24fps، و
عرض معاينة 1920px. يجب أن تنشر تعليقات ما قبل/بعد حزمة نظيفة تحتوي
على ملفات GIF المقصودة فقط.

يمكن لمسارات Slack أيضًا استخدام المجموعة. تعيش فحوصات شكل حمولة Slack حاليًا في مشغل QA الخاص بـ Slack بدلًا من الوسيط؛ استخدم `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`، مع معرّف قناة Slack مثل `Cxxxxxxxxxx`. راجع [إعداد مساحة عمل Slack](#setting-up-the-slack-workspace) لتجهيز التطبيق والنطاقات.

تعيش متغيرات البيئة التشغيلية وعقدة نهاية وسيط Convex في [الاختبار ← بيانات اعتماد Telegram المشتركة عبر Convex](/ar/help/testing#shared-telegram-credentials-via-convex-v1) (اسم القسم يسبق مجموعة القنوات المتعددة؛ دلالات الاستئجار مشتركة عبر الأنواع).

## بذور مدعومة بالمستودع

تعيش أصول البذور في `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

هذه موجودة عمدًا في git حتى تكون خطة QA مرئية لكل من البشر و
الوكيل.

يجب أن يبقى `qa-lab` مشغل markdown عامًا. كل ملف سيناريو markdown هو
مصدر الحقيقة لتشغيل اختبار واحد ويجب أن يعرّف:

- بيانات تعريف السيناريو
- بيانات تعريف اختيارية للفئة، والقدرة، والمسار، والمخاطر
- مراجع الوثائق والكود
- متطلبات Plugin اختيارية
- رقعة إعداد Gateway اختيارية
- `qa-flow` القابل للتنفيذ

يُسمح لسطح وقت التشغيل القابل لإعادة الاستخدام الذي يدعم `qa-flow` بأن يبقى عامًا
وعابرًا للجوانب. على سبيل المثال، يمكن لسيناريوهات markdown الجمع بين
مساعدات جانب النقل ومساعدات جانب المتصفح التي تقود واجهة Control UI المضمنة عبر
وصلة Gateway `browser.request` دون إضافة مشغل لحالة خاصة.

يجب تجميع ملفات السيناريو حسب قدرة المنتج بدلًا من مجلد شجرة المصدر.
أبقِ معرّفات السيناريو ثابتة عند نقل الملفات؛ استخدم `docsRefs` و `codeRefs`
لإمكانية تتبع التنفيذ.

يجب أن تبقى قائمة الأساس واسعة بما يكفي لتغطية:

- دردشة الرسائل المباشرة والقنوات
- سلوك السلاسل
- دورة حياة إجراء الرسالة
- استدعاءات cron
- استرجاع الذاكرة
- تبديل النموذج
- تسليم الوكيل الفرعي
- قراءة المستودع وقراءة الوثائق
- مهمة بناء صغيرة واحدة مثل Lobster Invaders

## مسارات محاكاة المزوّد

يملك `qa suite` مسارين محليين لمحاكاة المزوّد:

- `mock-openai` هو محاكي OpenClaw الواعي بالسيناريو. يبقى مسار المحاكاة
  الحتمي الافتراضي لـ QA المدعوم بالمستودع وبوابات التكافؤ.
- `aimock` يبدأ خادم مزوّد مدعومًا بـ AIMock لتغطية البروتوكول التجريبي،
  والتجهيزات، والتسجيل/إعادة التشغيل، والفوضى. إنه إضافي ولا
  يستبدل موزّع سيناريوهات `mock-openai`.

يعيش تنفيذ مسار المزوّد ضمن `extensions/qa-lab/src/providers/`.
يمتلك كل مزوّد إعداداته الافتراضية، وبدء تشغيل الخادم المحلي، وإعداد نموذج Gateway،
واحتياجات تجهيز ملف تعريف المصادقة، وأعلام قدرات الوضع الحي/المحاكاة. يجب أن يمر كود المجموعة و
Gateway المشترك عبر سجل المزوّدين بدلًا من التفريع على
أسماء المزوّدين.

## محولات النقل

يمتلك `qa-lab` وصلة نقل عامة لسيناريوهات QA المكتوبة بـ markdown. `qa-channel` هو أول محول على تلك الوصلة، لكن هدف التصميم أوسع: يجب أن تتصل القنوات الحقيقية أو الاصطناعية المستقبلية بمشغل المجموعة نفسه بدلًا من إضافة مشغل QA مخصص للنقل.

على مستوى البنية، يكون التقسيم كما يلي:

- يمتلك `qa-lab` تنفيذ السيناريو العام، وتزامن العمال، وكتابة الآثار، والتقارير.
- يمتلك محول النقل إعداد Gateway، والجاهزية، وملاحظة الوارد والصادر، وإجراءات النقل، وحالة النقل المطبعة.
- تعرّف ملفات سيناريو markdown ضمن `qa/scenarios/` تشغيل الاختبار؛ يوفر `qa-lab` سطح وقت التشغيل القابل لإعادة الاستخدام الذي ينفذها.

### إضافة قناة

تتطلب إضافة قناة إلى نظام QA المكتوب بـ markdown شيئين بالضبط:

1. محول نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تضف جذر أمر QA جديدًا على المستوى الأعلى عندما يستطيع مضيف `qa-lab` المشترك امتلاك التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء المجموعة وإنهاؤها
- تزامن العمال
- كتابة الآثار
- إنشاء التقرير
- تنفيذ السيناريو
- أسماء توافق بديلة لسيناريوهات `qa-channel` الأقدم

تمتلك Plugins المشغلة عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت جذر `qa` المشترك
- كيفية إعداد Gateway لذلك النقل
- كيفية فحص الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية ملاحظة الرسائل الصادرة
- كيفية عرض النصوص وحالة النقل المطبعة
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة الضبط أو التنظيف الخاصين بالنقل

الحد الأدنى لاعتماد قناة جديدة:

1. أبقِ `qa-lab` مالكًا لجذر `qa` المشترك.
2. نفّذ مشغل النقل على وصلة مضيف `qa-lab` المشتركة.
3. أبقِ الآليات الخاصة بالنقل داخل Plugin المشغل أو عدة القناة.
4. ركّب المشغل باسم `openclaw qa <runner>` بدلًا من تسجيل أمر جذري منافس. يجب أن تعلن Plugins المشغلة عن `qaRunners` في `openclaw.plugin.json` وأن تصدر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`. أبقِ `runtime-api.ts` خفيفًا؛ يجب أن يبقى تنفيذ CLI الكسول والمشغل خلف نقاط دخول منفصلة.
5. ألّف أو كيّف سيناريوهات markdown ضمن أدلة `qa/scenarios/` ذات السمات.
6. استخدم مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. أبقِ أسماء التوافق البديلة الحالية عاملة ما لم يكن المستودع يجري ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا كان يمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحد، فأبقِه في Plugin المشغل أو عدة Plugin تلك.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن لأكثر من قناة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بالقناة في `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بالنقل واجعل ذلك صريحًا في عقد السيناريو.

### أسماء مساعدات السيناريو

المساعدات العامة المفضلة للسيناريوهات الجديدة:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

تبقى أسماء التوافق البديلة متاحة للسيناريوهات الحالية - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - لكن يجب أن يستخدم تأليف السيناريوهات الجديدة الأسماء العامة. توجد الأسماء البديلة لتجنب ترحيل يوم حاسم، وليس بوصفها النموذج المستقبلي.

## التقارير

يصدر `qa-lab` تقرير بروتوكول Markdown من خط زمن الحافلة المرصود.
يجب أن يجيب التقرير عن:

- ما الذي نجح
- ما الذي فشل
- ما الذي بقي محظورًا
- ما سيناريوهات المتابعة التي تستحق الإضافة

لجرد السيناريوهات المتاحة - وهو مفيد عند تقدير حجم عمل المتابعة أو توصيل نقل جديد - شغّل `pnpm openclaw qa coverage` (أضف `--json` للحصول على مخرجات قابلة للقراءة آليًا).

لفحوصات الشخصية والأسلوب، شغّل السيناريو نفسه عبر عدة مراجع نماذج حية
واكتب تقرير Markdown مُحكّمًا:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

يشغّل الأمر عمليات فرعية محلية لـ QA Gateway، وليس Docker. يجب أن تضبط
سيناريوهات تقييم الشخصية الشخصية عبر `SOUL.md`، ثم تشغّل أدوار مستخدم عادية
مثل الدردشة، ومساعدة مساحة العمل، ومهام الملفات الصغيرة. يجب ألا يُخبر النموذج المرشح
بأنه قيد التقييم. يحفظ الأمر كل نص كامل، ويسجل إحصاءات تشغيل أساسية، ثم يطلب من نماذج التحكيم في الوضع السريع مع
استدلال `xhigh` حيث يكون مدعومًا ترتيب مرات التشغيل حسب الطبيعية، والإحساس، والفكاهة.
استخدم `--blind-judge-models` عند مقارنة المزوّدين: لا يزال موجّه الحكم يحصل على
كل نص وحالة تشغيل، لكن تُستبدل مراجع المرشحين بتسميات محايدة
مثل `candidate-01`؛ يربط التقرير الترتيبات مرة أخرى بالمراجع الحقيقية بعد
التحليل.
تستخدم عمليات المرشحين افتراضيًا تفكير `high`، مع `medium` لـ GPT-5.5 و `xhigh`
لمراجع تقييم OpenAI الأقدم التي تدعمه. تجاوز مرشحًا محددًا ضمن السطر باستخدام
`--model provider/model,thinking=<level>`. لا يزال `--thinking <level>` يعيّن
احتياطيًا عامًا، ويُحتفظ بالصيغة الأقدم `--model-thinking <provider/model=level>`
للتوافق.
تستخدم مراجع مرشحي OpenAI افتراضيًا الوضع السريع حتى تُستخدم المعالجة ذات الأولوية حيث
يدعمها المزوّد. أضف `,fast` أو `,no-fast` أو `,fast=false` ضمن السطر عندما يحتاج
مرشح واحد أو حكم واحد إلى تجاوز. مرّر `--fast` فقط عندما تريد
فرض الوضع السريع على كل نموذج مرشح. تُسجل مدد المرشحين والحكام في التقرير لتحليل المعايير، لكن موجّهات الحكم تقول صراحة
ألا يكون الترتيب حسب السرعة.
تستخدم عمليات المرشحين ونماذج التحكيم افتراضيًا تزامن 16. خفّض
`--concurrency` أو `--judge-concurrency` عندما تجعل حدود المزوّد أو ضغط Gateway المحلي
التشغيل كثير الضوضاء.
عندما لا يُمرر أي مرشح `--model`، يكون تقييم الشخصية افتراضيًا
`openai/gpt-5.5`، و `openai/gpt-5.2`، و `openai/gpt-5`، و `anthropic/claude-opus-4-6`،
و `anthropic/claude-sonnet-4-6`، و `zai/glm-5.1`،
و `moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` عندما لا يُمرر أي `--model`.
عندما لا يُمرر `--judge-model`، تكون نماذج التحكيم افتراضيًا
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high`.

## وثائق ذات صلة

- [Matrix QA](/ar/concepts/qa-matrix)
- [قناة QA](/ar/channels/qa-channel)
- [الاختبار](/ar/help/testing)
- [لوحة التحكم](/ar/web/dashboard)
