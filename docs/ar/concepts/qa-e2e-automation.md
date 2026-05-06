---
read_when:
    - فهم كيفية تكامل مكدس ضمان الجودة
    - توسيع qa-lab أو qa-channel أو محوّل نقل
    - إضافة سيناريوهات ضمان الجودة المدعومة بالمستودع
    - بناء أتمتة ضمان جودة أكثر واقعية حول لوحة تحكم Gateway
summary: 'نظرة عامة على حزمة ضمان الجودة: qa-lab، وqa-channel، والسيناريوهات المدعومة بالمستودع، ومسارات النقل الحية، ومحولات النقل، وإعداد التقارير.'
title: نظرة عامة على ضمان الجودة
x-i18n:
    generated_at: "2026-05-06T07:50:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

تهدف حزمة QA الخاصة إلى اختبار OpenClaw بطريقة أكثر واقعية
ومشكلة حسب القناة مما يمكن لاختبار وحدة واحد أن يفعله.

المكونات الحالية:

- `extensions/qa-channel`: قناة رسائل اصطناعية بأسطح للرسائل المباشرة، والقناة، والسلسلة،
  والتفاعل، والتحرير، والحذف.
- `extensions/qa-lab`: واجهة مصحح وناقل QA لمراقبة النص الكامل،
  وحقن الرسائل الواردة، وتصدير تقرير Markdown.
- `extensions/qa-matrix`، وPlugins التشغيل المستقبلية: محولات نقل حية
  تقود قناة حقيقية داخل child QA gateway.
- `qa/`: أصول تمهيدية مدعومة بالمستودع لمهمة البدء وسيناريوهات QA
  الأساسية.
- [Mantis](/ar/concepts/mantis): تحقق حي قبل وبعد للأخطاء التي
  تحتاج إلى وسائل نقل حقيقية، ولقطات شاشة للمتصفح، وحالة VM، وأدلة PR.

## سطح الأوامر

يعمل كل تدفق QA تحت `pnpm openclaw qa <subcommand>`. لدى كثير منها أسماء مستعارة لسكربتات `pnpm qa:*`؛ كلا الشكلين مدعوم.

| الأمر                                             | الغرض                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | فحص ذاتي مدمج لـ QA؛ يكتب تقرير Markdown.                                                                                                                                                                                                                        |
| `qa suite`                                          | تشغيل السيناريوهات المدعومة بالمستودع مقابل مسار QA gateway. الأسماء المستعارة: `pnpm openclaw qa suite --runner multipass` من أجل Linux VM مؤقت.                                                                                                                                  |
| `qa coverage`                                       | طباعة مخزون تغطية السيناريوهات بصيغة markdown (`--json` لمخرجات الآلة).                                                                                                                                                                                           |
| `qa parity-report`                                  | مقارنة ملفي `qa-suite-summary.json` وكتابة تقرير التكافؤ الوكيلي.                                                                                                                                                                                          |
| `qa character-eval`                                 | تشغيل سيناريو QA للشخصية عبر عدة نماذج حية مع تقرير محكوم. راجع [إعداد التقارير](#reporting).                                                                                                                                                            |
| `qa manual`                                         | تشغيل مطالبة لمرة واحدة مقابل مسار المزوّد/النموذج المحدد.                                                                                                                                                                                                          |
| `qa ui`                                             | بدء واجهة مصحح QA وناقل QA المحلي (الاسم المستعار: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | بناء صورة Docker المجهزة مسبقا لـ QA.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | كتابة هيكل docker-compose للوحة معلومات QA + مسار gateway.                                                                                                                                                                                                    |
| `qa up`                                             | بناء موقع QA، وبدء الحزمة المدعومة بـ Docker، وطباعة URL (الاسم المستعار: `pnpm qa:lab:up`؛ يضيف متغير `:fast` الخيار `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | بدء خادم مزوّد AIMock فقط.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | بدء خادم مزوّد `mock-openai` الواعي بالسيناريو فقط.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | إدارة مجموعة بيانات اعتماد Convex المشتركة.                                                                                                                                                                                                                               |
| `qa matrix`                                         | مسار نقل حي مقابل خادم Tuwunel homeserver مؤقت. راجع [Matrix QA](/ar/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | مسار نقل حي مقابل مجموعة Telegram خاصة حقيقية.                                                                                                                                                                                                              |
| `qa discord`                                        | مسار نقل حي مقابل قناة guild خاصة حقيقية في Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | مسار نقل حي مقابل قناة Slack خاصة حقيقية.                                                                                                                                                                                                               |
| `qa mantis`                                         | مشغل تحقق قبل وبعد لأخطاء النقل الحي، مع أدلة تفاعلات حالة Discord، واختبار سطح مكتب/متصفح Crabbox، واختبار Slack-in-VNC. راجع [Mantis](/ar/concepts/mantis) و[دليل تشغيل Mantis لسطح مكتب Slack](/ar/concepts/mantis-slack-desktop-runbook). |

## تدفق المشغل

تدفق مشغل QA الحالي هو موقع QA بلوحتين:

- اليسار: لوحة معلومات Gateway (Control UI) مع الوكيل.
- اليمين: QA Lab، يعرض النص الكامل الشبيه بـ Slack وخطة السيناريو.

شغله باستخدام:

```bash
pnpm qa:lab:up
```

يبني ذلك موقع QA، ويبدأ مسار gateway المدعوم بـ Docker، ويعرض
صفحة QA Lab حيث يمكن لمشغل أو حلقة أتمتة إعطاء الوكيل مهمة QA،
ومراقبة سلوك القناة الحقيقي، وتسجيل ما نجح، أو فشل، أو
بقي محجوبا.

لتكرار أسرع على واجهة QA Lab UI المحلية من دون إعادة بناء صورة Docker في كل مرة،
ابدأ الحزمة مع حزمة QA Lab مربوطة بالتركيب:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

يبقي `qa:lab:up:fast` خدمات Docker على صورة مبنية مسبقا ويربط
`extensions/qa-lab/web/dist` داخل حاوية `qa-lab`. يعيد `qa:lab:watch`
بناء تلك الحزمة عند التغيير، ويعيد المتصفح التحميل تلقائيا عندما يتغير
تجزئة أصل QA Lab.

لاختبار دخان تتبع OpenTelemetry محلي، شغل:

```bash
pnpm qa:otel:smoke
```

يبدأ ذلك السكربت مستقبلا محليا لتتبعات OTLP/HTTP، ويشغل سيناريو QA
`otel-trace-smoke` مع تفعيل Plugin `diagnostics-otel`، ثم
يفك ترميز امتدادات protobuf المصدرة ويتحقق من الشكل الحرج للإصدار:
يجب وجود `openclaw.run`، و`openclaw.harness.run`، و`openclaw.model.call`،
و`openclaw.context.assembled`، و`openclaw.message.delivery`؛
ويجب ألا تصدر استدعاءات النموذج `StreamAbandoned` في الجولات الناجحة؛ ويجب أن تبقى معرفات التشخيص الخام وسمات
`openclaw.content.*` خارج التتبع. يكتب
`otel-smoke-summary.json` بجانب آثار حزمة QA.

يبقى QA لقابلية الملاحظة مقتصرا على checkout للمصدر. يتعمد أرشيف npm tarball حذف
QA Lab، لذلك لا تشغل مسارات إصدار Docker للحزمة أوامر `qa`. استخدم
`pnpm qa:otel:smoke` من checkout مصدر مبني عند تغيير أدوات تشخيص
instrumentation.

لمسار دخان Matrix حقيقي النقل، شغل:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

توجد مرجعية CLI الكاملة، وكتالوج الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط الآثار لهذا المسار في [Matrix QA](/ar/concepts/qa-matrix). باختصار: يوفر خادم Tuwunel homeserver مؤقتا في Docker، ويسجل مستخدمي driver/SUT/observer مؤقتين، ويشغل Plugin Matrix الحقيقي داخل child QA gateway مخصص لذلك النقل (من دون `qa-channel`)، ثم يكتب تقرير Markdown، وملخص JSON، وأثر أحداث مرصودة، وسجل مخرجات مدمجا تحت `.artifacts/qa-e2e/matrix-<timestamp>/`.

تغطي السيناريوهات سلوك النقل الذي لا يمكن لاختبارات الوحدة إثباته من البداية إلى النهاية: بوابة الإشارات، وسياسات allow-bot، وقوائم السماح، والردود ذات المستوى الأعلى والمتسلسلة، وتوجيه DM، ومعالجة التفاعلات، وكبت التحرير الوارد، وإزالة تكرار إعادة التشغيل، والتعافي من انقطاع homeserver، وتسليم بيانات اعتماد الموافقة، ومعالجة الوسائط، وتدفقات تمهيد/استعادة/تحقق Matrix E2EE. كما يقود ملف CLI الشخصي لـ E2EE أوامر `openclaw matrix encryption setup` والتحقق عبر خادم homeserver المؤقت نفسه قبل فحص ردود gateway.

لدى Discord أيضا سيناريوهات اختيارية مخصصة لـ Mantis فقط لإعادة إنتاج الأخطاء. استخدم
`--scenario discord-status-reactions-tool-only` لمخطط تفاعلات الحالة الصريح،
أو `--scenario discord-thread-reply-filepath-attachment` لإنشاء
سلسلة Discord حقيقية والتحقق من أن `message.thread-reply` يحافظ على مرفق
`filePath`. تبقى هذه السيناريوهات خارج مسار Discord الحي الافتراضي
لأنها مجسات إعادة إنتاج قبل/بعد وليست تغطية دخان واسعة.
يمكن لتدفق عمل Mantis لمرفقات السلاسل أيضا إضافة فيديو شاهد Discord Web
مسجل الدخول عندما يكون `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` أو
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` مضبوطا في بيئة QA.
ملف تعريف المشاهد هذا مخصص للالتقاط البصري فقط؛ لا يزال قرار النجاح/الفشل
قادما من Discord REST oracle.

يستخدم CI سطح الأوامر نفسه في `.github/workflows/qa-live-transports-convex.yml`. تشغل عمليات التشغيل المجدولة واليدوية الافتراضية ملف Matrix السريع ببيانات اعتماد frontier الحية، و`--fast`، و`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. يوزع `matrix_profile=all` اليدوي العمل على خمس شرائح للملفات الشخصية حتى يتمكن الكتالوج الشامل من التشغيل بالتوازي مع الحفاظ على دليل آثار واحد لكل شريحة.

لمسارات دخان Telegram وDiscord وSlack حقيقية النقل:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

تستهدف قناة حقيقية موجودة مسبقا مع botين (driver + SUT). متغيرات البيئة المطلوبة، وقوائم السيناريوهات، وآثار المخرجات، ومجموعة بيانات اعتماد Convex موثقة في [مرجع QA لـ Telegram وDiscord وSlack](#telegram-discord-and-slack-qa-reference) أدناه.

لتشغيل Slack desktop VM كامل مع إنقاذ VNC، شغّل:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر ذلك الأمر جهاز Crabbox لسطح المكتب/المتصفح، ويشغّل مسار Slack الحي
داخل VM، ويفتح Slack Web في متصفح VNC، ويلتقط سطح المكتب، وينسخ
`slack-qa/` و`slack-desktop-smoke.png` و`slack-desktop-smoke.mp4`
عندما يكون التقاط الفيديو متاحًا إلى دليل عيوب Mantis. توفّر إيجارات Crabbox
لسطح المكتب/المتصفح أدوات الالتقاط وحزم مساعد المتصفح/البناء الأصلي
مسبقًا، لذا يجب ألا يثبّت السيناريو إلا بدائل احتياطية على الإيجارات الأقدم.
يبلّغ Mantis عن التوقيتات الإجمالية وتوقيتات كل مرحلة في
`mantis-slack-desktop-smoke-report.md` حتى توضّح التشغيلات البطيئة هل ذهب الوقت إلى
تهيئة الإيجار، أو الحصول على بيانات الاعتماد، أو الإعداد البعيد، أو نسخ العيوب. أعد استخدام
`--lease-id <cbx_...>` بعد تسجيل الدخول إلى Slack Web يدويًا عبر VNC؛
تحافظ الإيجارات المعاد استخدامها أيضًا على دفء ذاكرة تخزين pnpm الخاصة بـ Crabbox. يتحقق الوضع الافتراضي
`--hydrate-mode source` من نسخة مصدرية ويشغّل التثبيت/البناء
داخل VM. استخدم `--hydrate-mode prehydrated` فقط عندما تكون مساحة العمل البعيدة المعاد استخدامها
تحتوي مسبقًا على `node_modules` و`dist/` مبنية؛ يتخطى ذلك الوضع
خطوة التثبيت/البناء المكلفة ويفشل بإغلاق آمن عندما لا تكون مساحة العمل جاهزة.
مع `--gateway-setup`، يترك Mantis Gateway دائمًا لـ OpenClaw Slack
قيد التشغيل داخل VM على المنفذ `38973`؛ ومن دونه، يشغّل الأمر
مسار ضمان جودة Slack العادي من بوت إلى بوت ويخرج بعد التقاط العيوب.

توجد قائمة تحقق المشغّل، وأمر إرسال سير عمل GitHub، وعقد تعليق الأدلة،
وجدول قرار hydrate-mode، وتفسير التوقيت، وخطوات التعامل مع الفشل
في [دليل تشغيل Mantis لسطح مكتب Slack](/ar/concepts/mantis-slack-desktop-runbook).

لمهمة سطح مكتب بأسلوب وكيل/CV، شغّل:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

يستأجر `visual-task` جهاز Crabbox لسطح المكتب/المتصفح أو يعيد استخدامه، ويبدأ
`crabbox record --while`، ويقود المتصفح المرئي عبر
`visual-driver` متداخل، ويلتقط `visual-task.png`، ويشغّل `openclaw infer image describe`
على لقطة الشاشة عند اختيار `--vision-mode image-describe`، ويكتب
`visual-task.mp4` و`mantis-visual-task-summary.json`
و`mantis-visual-task-driver-result.json` و`mantis-visual-task-report.md`.
عند ضبط `--expect-text`، تطلب مطالبة الرؤية حكم JSON منظمًا
ولا تنجح إلا عندما يبلّغ النموذج عن دليل مرئي إيجابي؛ أما الاستجابة
السلبية التي تقتبس النص الهدف فقط فتفشل التأكيد.
استخدم `--vision-mode metadata` لتشغيل smoke بلا نموذج يثبت توصيلات سطح المكتب،
والمتصفح، ولقطة الشاشة، والفيديو دون استدعاء مزود فهم الصور.
التسجيل عيب مطلوب لـ `visual-task`؛ إذا لم يسجّل Crabbox
ملف `visual-task.mp4` غير فارغ، تفشل المهمة حتى إذا نجح المشغّل المرئي.
عند الفشل، يحتفظ Mantis بالإيجار من أجل VNC ما لم تكن المهمة قد
نجحت بالفعل ولم يتم ضبط `--keep-lease`.

قبل استخدام بيانات اعتماد حية مجمّعة، شغّل:

```bash
pnpm openclaw qa credentials doctor
```

يفحص الطبيب بيئة وسيط Convex، ويتحقق من صحة إعدادات نقطة النهاية، ويتحقق من إمكانية الوصول إلى admin/list عند وجود سر المشرف. لا يبلّغ إلا عن حالة مضبوط/مفقود للأسرار.

## تغطية النقل الحي

تشارك مسارات النقل الحي عقدًا واحدًا بدلًا من أن يخترع كل منها شكل قائمة سيناريوهات خاصًا به. `qa-channel` هي حزمة سلوك المنتج الاصطناعية الواسعة وليست جزءًا من مصفوفة تغطية النقل الحي.

| المسار     | Canary | حظر الإشارات | بوت إلى بوت | حظر قائمة السماح | رد على المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة في سلسلة | عزل السلاسل | ملاحظة التفاعلات | أمر المساعدة | تسجيل الأمر الأصلي |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

يحافظ هذا على `qa-channel` كحزمة سلوك المنتج الواسعة، بينما تشترك Matrix
وTelegram ووسائط النقل الحية المستقبلية في قائمة تحقق صريحة واحدة
لعقد النقل.

لمسار Linux VM مؤقت دون إدخال Docker في مسار ضمان الجودة، شغّل:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

يشغّل هذا ضيف Multipass جديدًا، ويثبّت الاعتماديات، ويبني OpenClaw
داخل الضيف، ويشغّل `qa suite`، ثم ينسخ تقرير ضمان الجودة والملخص
العاديين مرة أخرى إلى `.artifacts/qa-e2e/...` على المضيف.
ويعيد استخدام سلوك اختيار السيناريو نفسه الذي يستخدمه `qa suite` على المضيف.
تنفّذ تشغيلات حزمة المضيف وMultipass سيناريوهات متعددة محددة بالتوازي
مع عمال Gateway معزولين افتراضيًا. يكون افتراضي `qa-channel` هو التزامن
4، مع سقف بعدد السيناريوهات المحددة. استخدم `--concurrency <count>` لضبط
عدد العمال، أو `--concurrency 1` للتنفيذ التسلسلي.
يخرج الأمر برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
تريد العيوب دون رمز خروج فاشل.
تمرر التشغيلات الحية مدخلات مصادقة ضمان الجودة المدعومة والعملية للضيف:
مفاتيح المزود المستندة إلى البيئة، ومسار إعداد مزود ضمان الجودة الحي، و
`CODEX_HOME` عند وجوده. أبقِ `--output-dir` تحت جذر المستودع حتى يستطيع الضيف
الكتابة مرة أخرى عبر مساحة العمل المركبة.

## مرجع ضمان الجودة لـ Telegram وDiscord وSlack

لدى Matrix [صفحة مخصصة](/ar/concepts/qa-matrix) بسبب عدد سيناريوهاته وتوفير homeserver المدعوم بـ Docker. Telegram وDiscord وSlack أصغر - عدد قليل من السيناريوهات لكل منها، بلا نظام ملفات تعريف، وضد قنوات حقيقية موجودة مسبقًا - لذلك يوجد مرجعها هنا.

### أعلام CLI المشتركة

تسجل هذه المسارات عبر `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` وتقبل الأعلام نفسها:

| العلم                                  | الافتراضي                                                         | الوصف                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | شغّل هذا السيناريو فقط. قابل للتكرار.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | المكان الذي تُكتب فيه التقارير/الملخص/الرسائل المرصودة وسجل الإخراج. تُحل المسارات النسبية نسبةً إلى `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | جذر المستودع عند الاستدعاء من cwd محايد.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | معرّف حساب مؤقت داخل إعداد Gateway لضمان الجودة.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` أو `live-frontier` (ما زال `live-openai` القديم يعمل).                                                  |
| `--model <ref>` / `--alt-model <ref>` | افتراضي المزود                                                | مراجع النموذج الأساسي/البديل.                                                                                         |
| `--fast`                              | متوقف                                                             | الوضع السريع للمزود حيث يكون مدعومًا.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | راجع [مجمع بيانات اعتماد Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` في CI، و`maintainer` خلاف ذلك                              | الدور المستخدم عند `--credential-source convex`.                                                                          |

يخرج كل مسار برمز غير صفري عند فشل أي سيناريو. يكتب `--allow-failures` العيوب دون ضبط رمز خروج فاشل.

### ضمان جودة Telegram

```bash
pnpm openclaw qa telegram
```

يستهدف مجموعة Telegram خاصة حقيقية واحدة ببوتين مميزين (مشغّل + SUT). يجب أن يمتلك بوت SUT اسم مستخدم في Telegram؛ تعمل ملاحظة بوت إلى بوت بأفضل شكل عندما يكون لدى كلا البوتين **Bot-to-Bot Communication Mode** مفعّلًا في `@BotFather`.

البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - معرّف دردشة رقمي (سلسلة).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختياري:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` يحتفظ بنصوص الرسائل في عيوب الرسائل المرصودة (الافتراضي يحجبها).

السيناريوهات (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

عيوب الإخراج:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - يتضمن RTT لكل رد (إرسال المشغّل → رد SUT المرصود) بدءًا من canary.
- `telegram-qa-observed-messages.json` - النصوص محجوبة ما لم يتم ضبط `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### ضمان جودة Discord

```bash
pnpm openclaw qa discord
```

يستهدف قناة guild خاصة حقيقية واحدة في Discord ببوتين: بوت مشغّل يتحكم به الحزام، وبوت SUT يبدأه OpenClaw gateway الابن عبر Discord plugin المضمّن. يتحقق من التعامل مع إشارات القناة، ومن أن بوت SUT سجّل أمر `/help` الأصلي لدى Discord، ومن سيناريوهات أدلة Mantis الاختيارية.

البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - يجب أن يطابق معرّف مستخدم بوت SUT الذي يعيده Discord (وإلا يفشل المسار سريعًا).

اختياري:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` يحتفظ بنصوص الرسائل في عيوب الرسائل المرصودة.

السيناريوهات (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - سيناريو Mantis اختياري. يعمل بمفرده لأنه يبدّل SUT إلى ردود guild دائمة التشغيل ومقتصرة على الأدوات مع `messages.statusReactions.enabled=true`، ثم يلتقط خطًا زمنيًا لتفاعلات REST بالإضافة إلى عيوب HTML/PNG مرئية. وتحافظ تقارير Mantis قبل/بعد أيضًا على عيوب MP4 المقدمة من السيناريو باسم `baseline.mp4` و`candidate.mp4`.

شغّل سيناريو تفاعل الحالة في Mantis صراحة:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

مخرجات الآثار:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - تُنقَّح النصوص ما لم يكن `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` و`discord-status-reactions-tool-only-timeline.png` عند تشغيل سيناريو تفاعلات الحالة.

### QA Slack

```bash
pnpm openclaw qa slack
```

يستهدف قناة Slack خاصة وحقيقية واحدة مع بوتين متميزين: بوت مشغّل يتحكم به إطار الاختبار، وبوت SUT يبدأه Gateway OpenClaw الفرعي من خلال Slack Plugin المضمّن.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختياري:

- يحافظ `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` على نصوص الرسائل في آثار الرسائل المرصودة.

السيناريوهات (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

مخرجات الآثار:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - تُنقَّح النصوص ما لم يكن `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### إعداد مساحة عمل Slack

يتطلب المسار تطبيقَي Slack متميزين في مساحة عمل واحدة، إضافة إلى قناة يكون كلا البوتين عضوين فيها:

- `channelId` - معرّف `Cxxxxxxxxxx` لقناة دُعي إليها كلا البوتين. استخدم قناة مخصصة؛ ينشر المسار فيها في كل تشغيل.
- `driverBotToken` - رمز البوت (`xoxb-...`) لتطبيق **المشغّل**.
- `sutBotToken` - رمز البوت (`xoxb-...`) لتطبيق **SUT**، الذي يجب أن يكون تطبيق Slack منفصلًا عن المشغّل كي يكون معرّف مستخدم البوت الخاص به متميزًا.
- `sutAppToken` - رمز على مستوى التطبيق (`xapp-...`) لتطبيق SUT مع `connections:write`، ويستخدمه وضع Socket Mode حتى يتمكن تطبيق SUT من استقبال الأحداث.

فضّل مساحة عمل Slack مخصصة لاختبارات QA بدلًا من إعادة استخدام مساحة عمل إنتاجية.

يضيّق بيان SUT أدناه عمدًا تثبيت Slack Plugin الإنتاجي المضمّن (`extensions/slack/src/setup-shared.ts:10`) إلى الأذونات والأحداث التي تغطيها حزمة QA Slack الحية. لإعداد قناة الإنتاج كما يراها المستخدمون، راجع [الإعداد السريع لقناة Slack](/ar/channels/slack#quick-setup)؛ يُفصل زوج مشغّل/SUT في QA عمدًا لأن المسار يحتاج إلى معرّفَي مستخدم بوت متميزين في مساحة عمل واحدة.

**1. أنشئ تطبيق المشغّل**

انتقل إلى [api.slack.com/apps](https://api.slack.com/apps) ← _إنشاء تطبيق جديد_ ← _من بيان_ ← اختر مساحة عمل QA، والصق البيان التالي، ثم _التثبيت في مساحة العمل_:

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

انسخ _Bot User OAuth Token_ (`xoxb-...`) - يصبح ذلك `driverBotToken`. يحتاج المشغّل فقط إلى نشر الرسائل وتعريف نفسه؛ لا أحداث، ولا Socket Mode.

**2. أنشئ تطبيق SUT**

كرّر _إنشاء تطبيق جديد ← من بيان_ في مساحة العمل نفسها. يستخدم تطبيق QA هذا عمدًا نسخة أضيق من بيان الإنتاج الخاص بـSlack Plugin المضمّن (`extensions/slack/src/setup-shared.ts:10`): تُحذف نطاقات وأحداث التفاعلات لأن حزمة QA Slack الحية لا تغطي معالجة التفاعلات بعد.

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

بعد أن ينشئ Slack التطبيق، نفّذ أمرين في صفحة إعداداته:

- _التثبيت في مساحة العمل_ ← انسخ _Bot User OAuth Token_ ← يصبح ذلك `sutBotToken`.
- _المعلومات الأساسية ← الرموز على مستوى التطبيق ← إنشاء رمز ونطاقات_ ← أضف النطاق `connections:write` ← احفظ ← انسخ قيمة `xapp-...` ← تصبح `sutAppToken`.

تحقق من أن للبوتين معرّفَي مستخدم متميزين عبر استدعاء `auth.test` على كل رمز. يميز وقت التشغيل بين المشغّل وSUT حسب معرّف المستخدم؛ ستفشل بوابة الإشارات فورًا إذا أُعيد استخدام تطبيق واحد لكليهما.

**3. أنشئ القناة**

في مساحة عمل QA، أنشئ قناة (مثل `#openclaw-qa`) وادعُ كلا البوتين من داخل القناة:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

انسخ معرّف `Cxxxxxxxxxx` من _معلومات القناة ← حول ← معرّف القناة_ - يصبح ذلك `channelId`. تعمل القناة العامة؛ وإذا استخدمت قناة خاصة، فإن كلا التطبيقين يملكان بالفعل `groups:history` لذلك ستظل قراءات السجل في إطار الاختبار ناجحة.

**4. سجّل بيانات الاعتماد**

هناك خياران. استخدم متغيرات البيئة لتصحيح الأخطاء على جهاز واحد (عيّن المتغيرات الأربعة `OPENCLAW_QA_SLACK_*` ومرّر `--credential-source env`)، أو املأ تجمع Convex المشترك حتى تتمكن CI والمشرفون الآخرون من استئجارها.

بالنسبة إلى تجمع Convex، اكتب الحقول الأربعة في ملف JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

مع تصدير `OPENCLAW_QA_CONVEX_SITE_URL` و`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` في الصدفة، سجّل وتحقق:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

توقع `count: 1`، و`status: "active"`، من دون حقل `lease`.

**5. تحقق من البداية إلى النهاية**

شغّل المسار محليًا للتأكد من أن كلا البوتين يستطيعان التحدث إلى بعضهما عبر الوسيط:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

يكتمل التشغيل الناجح في أقل بكثير من 30 ثانية، ويُظهر `slack-qa-report.md` كلًا من `slack-canary` و`slack-mention-gating` بالحالة `pass`. إذا توقف المسار لنحو 90 ثانية وخرج برسالة `Convex credential pool exhausted for kind "slack"`، فإما أن التجمع فارغ أو أن كل صف مستأجر - سيخبرك `qa credentials list --kind slack --status all --json` أيهما.

### تجمع بيانات اعتماد Convex

يمكن لمسارات Telegram وDiscord وSlack استئجار بيانات الاعتماد من تجمع Convex مشترك بدلًا من قراءة متغيرات البيئة أعلاه. مرّر `--credential-source convex` (أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)؛ يستحوذ QA Lab على استئجار حصري، ويرسل له Heartbeat طوال مدة التشغيل، ويحرره عند الإيقاف. أنواع التجمع هي `"telegram"` و`"discord"` و`"slack"`.

أشكال الحمولة التي يتحقق منها الوسيط عند `admin/add`:

- Telegram (`kind: "telegram"`): ‏`{ groupId: string, driverToken: string, sutToken: string }` - يجب أن يكون `groupId` سلسلة معرّف دردشة رقمية.
- Discord (`kind: "discord"`): ‏`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): ‏`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - يجب أن يطابق `channelId` النمط `^[A-Z][A-Z0-9]+$` (معرّف Slack مثل `Cxxxxxxxxxx`). راجع [إعداد مساحة عمل Slack](#setting-up-the-slack-workspace) لتجهيز التطبيق والنطاقات.

توجد متغيرات بيئة التشغيل وعقدة نقطة نهاية وسيط Convex في [الاختبار ← بيانات اعتماد Telegram المشتركة عبر Convex](/ar/help/testing#shared-telegram-credentials-via-convex-v1) (يسبق اسم القسم دعم Discord؛ دلالات الوسيط متطابقة لكلا النوعين).

## البذور المدعومة بالمستودع

توجد أصول البذور في `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

توجد هذه الملفات عمدًا في git حتى تكون خطة QA مرئية لكل من البشر والوكيل.

يجب أن يبقى `qa-lab` مشغّل Markdown عامًا. كل ملف سيناريو Markdown هو مصدر الحقيقة لتشغيل اختبار واحد ويجب أن يعرّف:

- بيانات تعريف السيناريو
- بيانات تعريف اختيارية للفئة والقدرة والمسار والمخاطر
- مراجع المستندات والكود
- متطلبات Plugin اختيارية
- تصحيح إعدادات Gateway اختياري
- `qa-flow` القابل للتنفيذ

يُسمح لسطح وقت التشغيل القابل لإعادة الاستخدام الذي يدعم `qa-flow` بأن يبقى عامًا ومتعدد الجوانب. على سبيل المثال، يمكن لسيناريوهات Markdown الجمع بين مساعدين من جانب النقل ومساعدين من جانب المتصفح يقودون Control UI المضمّن عبر واجهة Gateway `browser.request` من دون إضافة مشغّل حالة خاصة.

يجب تجميع ملفات السيناريو حسب قدرة المنتج لا حسب مجلد شجرة المصدر. حافظ على ثبات معرّفات السيناريوهات عند نقل الملفات؛ استخدم `docsRefs` و`codeRefs` لإمكانية تتبع التنفيذ.

يجب أن تبقى قائمة الأساس واسعة بما يكفي لتغطية:

- دردشة الرسائل المباشرة والقنوات
- سلوك السلاسل
- دورة حياة إجراء الرسالة
- استدعاءات Cron
- استرجاع الذاكرة
- تبديل النماذج
- تسليم الوكيل الفرعي
- قراءة المستودع وقراءة المستندات
- مهمة بناء صغيرة واحدة مثل Lobster Invaders

## مسارات محاكاة المزوّد

لدى `qa suite` مساران محليان لمحاكاة المزوّد:

- `mock-openai` هو محاكي OpenClaw المدرك للسيناريو. يبقى مسار المحاكاة الحتمي الافتراضي لاختبارات QA المدعومة بالمستودع وبوابات التكافؤ.
- يبدأ `aimock` خادم مزوّد مدعومًا بـAIMock لتغطية تجريبية للبروتوكول والتركيبات والتسجيل/إعادة التشغيل والفوضى. إنه إضافي ولا يستبدل مرسِل سيناريوهات `mock-openai`.

يعيش تنفيذ مسارات المزوّد ضمن `extensions/qa-lab/src/providers/`. يملك كل مزوّد افتراضاته، وبدء تشغيل الخادم المحلي، وإعداد نموذج Gateway، واحتياجات تهيئة ملف تعريف المصادقة، وأعلام قدرات الحي/المحاكى. يجب أن تمر شيفرة الحزمة المشتركة وGateway عبر سجل المزوّد بدلًا من التفريع بناءً على أسماء المزوّدين.

## محولات النقل

يمتلك `qa-lab` واجهة نقل عامة لسيناريوهات QA في Markdown. `qa-channel` هو أول محول على هذه الواجهة، لكن هدف التصميم أوسع: يجب أن ترتبط القنوات الحقيقية أو الاصطناعية المستقبلية بمشغّل الحزمة نفسه بدلًا من إضافة مشغّل QA خاص بالنقل.

على مستوى المعمارية، يكون التقسيم كالتالي:

- يمتلك `qa-lab` تنفيذ السيناريوهات العام، وتزامن العاملين، وكتابة الآثار، وإعداد التقارير.
- يمتلك محول النقل إعداد Gateway، والجاهزية، والمراقبة الواردة والصادرة، وإجراءات النقل، وحالة النقل المطبّعة.
- تعرّف ملفات سيناريو Markdown ضمن `qa/scenarios/` تشغيل الاختبار؛ ويوفر `qa-lab` سطح وقت التشغيل القابل لإعادة الاستخدام الذي ينفذها.

### إضافة قناة

تتطلب إضافة قناة إلى نظام QA في Markdown شيئين بالضبط:

1. محول نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تضف جذر أمر QA جديدًا على المستوى الأعلى عندما يستطيع مضيف `qa-lab` المشترك امتلاك التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء المجموعة وإنهاؤها
- تزامن العمال
- كتابة الآثار
- توليد التقارير
- تنفيذ السيناريوهات
- أسماء توافق بديلة لسيناريوهات `qa-channel` الأقدم

تمتلك Plugins الخاصة بالمشغّل عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت جذر `qa` المشترك
- كيفية تكوين gateway لذلك النقل
- كيفية التحقق من الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية مراقبة الرسائل الصادرة
- كيفية كشف النصوص والحالة المعيارية للنقل
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة الضبط أو التنظيف الخاصين بالنقل

الحد الأدنى لاعتماد قناة جديدة:

1. أبقِ `qa-lab` مالكًا لجذر `qa` المشترك.
2. نفّذ مشغّل النقل على نقطة وصل مضيف `qa-lab` المشتركة.
3. أبقِ الآليات الخاصة بالنقل داخل Plugin المشغّل أو حاضنة القناة.
4. ركّب المشغّل كـ `openclaw qa <runner>` بدلًا من تسجيل أمر جذري منافس. ينبغي أن تعلن Plugins المشغّل عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`. أبقِ `runtime-api.ts` خفيفًا؛ يجب أن يبقى تنفيذ CLI والمشغّل الكسول خلف نقاط دخول منفصلة.
5. ألّف أو كيّف سيناريوهات Markdown تحت أدلة `qa/scenarios/` ذات السمات.
6. استخدم مساعدي السيناريو العامين للسيناريوهات الجديدة.
7. أبقِ أسماء التوافق البديلة الحالية عاملة ما لم يكن المستودع ينفّذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا كان يمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحد، فأبقه في Plugin ذلك المشغّل أو حاضنة Plugin.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن أن تستخدمها أكثر من قناة، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة في `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بالنقل واجعل ذلك صريحًا في عقد السيناريو.

### أسماء مساعدي السيناريو

المساعدون العامون المفضّلون للسيناريوهات الجديدة:

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

تبقى أسماء التوافق البديلة متاحة للسيناريوهات الحالية - `waitForQaChannelReady` و`waitForOutboundMessage` و`waitForNoOutbound` و`formatConversationTranscript` و`resetBus` - لكن يجب أن يستخدم تأليف السيناريوهات الجديدة الأسماء العامة. وُجدت هذه الأسماء البديلة لتجنب ترحيل شامل في يوم واحد، لا باعتبارها النموذج المعتمد مستقبلًا.

## التقارير

يصدّر `qa-lab` تقرير بروتوكول بصيغة Markdown من الخط الزمني المرصود للحافلة.
يجب أن يجيب التقرير عن:

- ما الذي عمل
- ما الذي فشل
- ما الذي بقي محظورًا
- ما سيناريوهات المتابعة التي تستحق الإضافة

للحصول على فهرس السيناريوهات المتاحة - وهو مفيد عند تقدير حجم عمل المتابعة أو توصيل نقل جديد - شغّل `pnpm openclaw qa coverage` (أضف `--json` للحصول على خرج قابل للقراءة آليًا).

لفحوصات الشخصية والأسلوب، شغّل السيناريو نفسه عبر عدة مراجع نماذج حية
واكتب تقرير Markdown محكّمًا:

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

يشغّل الأمر عمليات فرعية محلية لـ QA gateway، وليس Docker. يجب أن تضبط سيناريوهات تقييم الشخصية الشخصية عبر `SOUL.md`، ثم تشغّل أدوار مستخدم عادية مثل المحادثة، ومساعدة مساحة العمل، ومهام ملفات صغيرة. لا ينبغي إبلاغ النموذج المرشح بأنه يخضع للتقييم. يحافظ الأمر على كل نص كامل، ويسجل إحصاءات تشغيل أساسية، ثم يطلب من نماذج التحكيم في الوضع السريع مع استدلال `xhigh` حيثما كان مدعومًا ترتيب التشغيلات حسب الطبيعية، والانطباع العام، وروح الدعابة.
استخدم `--blind-judge-models` عند مقارنة المزوّدين: ما زالت مطالبة التحكيم تتلقى كل نص وحالة تشغيل، لكن مراجع المرشحين تُستبدل بتسميات حيادية مثل `candidate-01`؛ ويربط التقرير الترتيبات بالمراجع الحقيقية بعد التحليل.
تعمل تشغيلات المرشحين افتراضيًا بتفكير `high`، مع `medium` لـ GPT-5.5 و`xhigh`
لمراجع تقييم OpenAI الأقدم التي تدعمه. تجاوز مرشحًا محددًا ضمنيًا باستخدام
`--model provider/model,thinking=<level>`. ما زال `--thinking <level>` يضبط
احتياطيًا عامًا، ويُحتفظ بالصيغة الأقدم `--model-thinking <provider/model=level>`
للتوافق.
تعمل مراجع مرشحي OpenAI افتراضيًا بالوضع السريع لاستخدام المعالجة ذات الأولوية حيث يدعمها المزوّد. أضف `,fast` أو `,no-fast` أو `,fast=false` ضمنيًا عندما يحتاج مرشح أو محكّم واحد إلى تجاوز. مرّر `--fast` فقط عندما تريد فرض الوضع السريع على كل نموذج مرشح. تُسجّل مدد المرشحين والمحكمين في التقرير لتحليل المعايير، لكن مطالبات التحكيم تنص صراحةً على عدم الترتيب حسب السرعة.
تعمل تشغيلات نماذج المرشحين والمحكمين افتراضيًا بتزامن 16. خفّض
`--concurrency` أو `--judge-concurrency` عندما تجعل حدود المزوّد أو ضغط gateway المحلي التشغيل كثير الضجيج.
عند عدم تمرير أي مرشح `--model`، يستخدم تقييم الشخصية افتراضيًا
`openai/gpt-5.5` و`openai/gpt-5.2` و`openai/gpt-5` و`anthropic/claude-opus-4-6`
و`anthropic/claude-sonnet-4-6` و`zai/glm-5.1`
و`moonshot/kimi-k2.5` و
`google/gemini-3.1-pro-preview` عند عدم تمرير أي `--model`.
عند عدم تمرير أي `--judge-model`، يكون المحكّمون افتراضيًا
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high`.

## المستندات ذات الصلة

- [Matrix QA](/ar/concepts/qa-matrix)
- [QA Channel](/ar/channels/qa-channel)
- [الاختبار](/ar/help/testing)
- [لوحة التحكم](/ar/web/dashboard)
