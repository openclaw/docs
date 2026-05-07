---
read_when:
    - فهم كيفية ترابط مكدس ضمان الجودة
    - توسيع qa-lab أو qa-channel أو محوّل نقل
    - إضافة سيناريوهات ضمان الجودة المستندة إلى المستودع
    - بناء أتمتة ضمان جودة أكثر واقعية حول لوحة معلومات Gateway
summary: 'نظرة عامة على مكدس QA: qa-lab، وqa-channel، والسيناريوهات المدعومة بالمستودع، ومسارات النقل المباشر، ومحوّلات النقل، وإعداد التقارير.'
title: نظرة عامة على ضمان الجودة
x-i18n:
    generated_at: "2026-05-07T13:16:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

مكدس QA الخاص يهدف إلى اختبار OpenClaw بطريقة أكثر واقعية
ومشكلة على هيئة قنوات مما يمكن لاختبار وحدة واحد أن يفعله.

الأجزاء الحالية:

- `extensions/qa-channel`: قناة رسائل اصطناعية بواجهات DM، والقناة، والسلسلة،
  والتفاعل، والتحرير، والحذف.
- `extensions/qa-lab`: واجهة مصحح الأخطاء وحافلة QA لمراقبة النص،
  وحقن الرسائل الواردة، وتصدير تقرير Markdown.
- `extensions/qa-matrix`، Plugins مشغلات مستقبلية: محولات نقل حية
  تقود قناة حقيقية داخل Gateway QA فرعي.
- `qa/`: أصول أولية مدعومة من المستودع لمهمة الانطلاق وسيناريوهات QA
  الأساسية.
- [Mantis](/ar/concepts/mantis): تحقق حي قبل وبعد للأخطاء التي
  تحتاج إلى عمليات نقل حقيقية، ولقطات شاشة للمتصفح، وحالة VM، وأدلة PR.

## سطح الأوامر

كل تدفق QA يعمل تحت `pnpm openclaw qa <subcommand>`. لدى العديد منها أسماء مستعارة بنصوص `pnpm qa:*`؛ كلا الشكلين مدعومان.

| الأمر                                               | الغرض                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | فحص ذاتي مدمج لـ QA؛ يكتب تقرير Markdown.                                                                                                                                                                                                                              |
| `qa suite`                                          | تشغيل سيناريوهات مدعومة من المستودع مقابل مسار QA Gateway. الأسماء المستعارة: `pnpm openclaw qa suite --runner multipass` من أجل Linux VM قابل للتخلص منه.                                                                                                           |
| `qa coverage`                                       | طباعة مخزون تغطية سيناريوهات Markdown (`--json` لمخرجات الآلة).                                                                                                                                                                                                        |
| `qa parity-report`                                  | مقارنة ملفي `qa-suite-summary.json` وكتابة تقرير التكافؤ الوكيلي.                                                                                                                                                                                                      |
| `qa character-eval`                                 | تشغيل سيناريو QA للشخصية عبر نماذج حية متعددة مع تقرير محكوم. راجع [إعداد التقارير](#reporting).                                                                                                                                                                      |
| `qa manual`                                         | تشغيل مطالبة لمرة واحدة مقابل مسار الموفر/النموذج المحدد.                                                                                                                                                                                                              |
| `qa ui`                                             | بدء واجهة مصحح أخطاء QA وحافلة QA المحلية (الاسم المستعار: `pnpm qa:lab:ui`).                                                                                                                                                                                          |
| `qa docker-build-image`                             | بناء صورة QA Docker مسبقة التحضير.                                                                                                                                                                                                                                      |
| `qa docker-scaffold`                                | كتابة هيكل docker-compose للوحة معلومات QA + مسار Gateway.                                                                                                                                                                                                              |
| `qa up`                                             | بناء موقع QA، وبدء المكدس المدعوم بـ Docker، وطباعة عنوان URL (الاسم المستعار: `pnpm qa:lab:up`؛ يضيف متغير `:fast` الخيار `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                  |
| `qa aimock`                                         | بدء خادم موفر AIMock فقط.                                                                                                                                                                                                                                               |
| `qa mock-openai`                                    | بدء خادم موفر `mock-openai` الواعي بالسيناريو فقط.                                                                                                                                                                                                                     |
| `qa credentials doctor` / `add` / `list` / `remove` | إدارة مجموعة بيانات اعتماد Convex المشتركة.                                                                                                                                                                                                                            |
| `qa matrix`                                         | مسار نقل حي مقابل خادم منازل Tuwunel قابل للتخلص منه. راجع [Matrix QA](/ar/concepts/qa-matrix).                                                                                                                                                                          |
| `qa telegram`                                       | مسار نقل حي مقابل مجموعة Telegram خاصة حقيقية.                                                                                                                                                                                                                         |
| `qa discord`                                        | مسار نقل حي مقابل قناة guild خاصة حقيقية في Discord.                                                                                                                                                                                                                   |
| `qa slack`                                          | مسار نقل حي مقابل قناة Slack خاصة حقيقية.                                                                                                                                                                                                                              |
| `qa mantis`                                         | مشغل تحقق قبل وبعد لأخطاء النقل الحي، مع أدلة تفاعلات حالة Discord، وفحص Crabbox لسطح المكتب/المتصفح، وفحص Slack داخل VNC. راجع [Mantis](/ar/concepts/mantis) و[دليل تشغيل Mantis Slack Desktop](/ar/concepts/mantis-slack-desktop-runbook). |

## تدفق المشغل

تدفق مشغل QA الحالي هو موقع QA بلوحتين:

- اليسار: لوحة معلومات Gateway (واجهة التحكم) مع الوكيل.
- اليمين: QA Lab، تعرض النص الشبيه بـ Slack وخطة السيناريو.

شغله باستخدام:

```bash
pnpm qa:lab:up
```

يبني ذلك موقع QA، ويبدأ مسار Gateway المدعوم بـ Docker، ويعرض صفحة
QA Lab حيث يمكن للمشغل أو حلقة الأتمتة إعطاء الوكيل مهمة QA،
ومراقبة سلوك القناة الحقيقي، وتسجيل ما نجح، أو فشل، أو
بقي محظورا.

لتكرار أسرع على واجهة QA Lab دون إعادة بناء صورة Docker في كل مرة،
ابدأ المكدس بحزمة QA Lab مركبة بالربط:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

يحافظ `qa:lab:up:fast` على خدمات Docker على صورة مسبقة البناء ويركب بالربط
`extensions/qa-lab/web/dist` داخل حاوية `qa-lab`. يعيد `qa:lab:watch`
بناء تلك الحزمة عند التغيير، ويعاد تحميل المتصفح تلقائيا عندما يتغير تجزئة أصل QA Lab.

لفحص دخان محلي لتتبع OpenTelemetry، شغل:

```bash
pnpm qa:otel:smoke
```

يبدأ ذلك النص مستقبل تتبع OTLP/HTTP محليا، ويشغل سيناريو QA
`otel-trace-smoke` مع تفعيل Plugin `diagnostics-otel`، ثم
يفك ترميز نطاقات protobuf المصدرة ويتحقق من الشكل الحرج للإصدار:
يجب أن تكون `openclaw.run` و`openclaw.harness.run` و`openclaw.model.call`
و`openclaw.context.assembled` و`openclaw.message.delivery` موجودة؛
ويجب ألا تصدر استدعاءات النموذج `StreamAbandoned` في الأدوار الناجحة؛ ويجب أن تبقى معرّفات التشخيص الخام وسمات
`openclaw.content.*` خارج التتبع. يكتب
`otel-smoke-summary.json` بجوار آثار مجموعة QA.

يبقى QA الخاص بقابلية المراقبة مقتصرا على سحب المصدر. حزمة npm tarball تحذف
QA Lab عمدا، لذلك لا تشغل مسارات إصدار Docker للحزمة أوامر `qa`. استخدم
`pnpm qa:otel:smoke` من سحب مصدر مبني عند تغيير أدوات
التشخيص.

لمسار دخان Matrix حقيقي النقل، شغل:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع CLI الكامل، وكتالوج الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط الآثار لهذا المسار موجودة في [Matrix QA](/ar/concepts/qa-matrix). باختصار: يوفر خادم منازل Tuwunel قابلا للتخلص منه في Docker، ويسجل مستخدمي driver/SUT/observer مؤقتين، ويشغل Plugin Matrix الحقيقي داخل Gateway QA فرعي محدود بذلك النقل (بلا `qa-channel`)، ثم يكتب تقرير Markdown، وملخص JSON، وأثر الأحداث المرصودة، وسجل مخرجات مدمجا تحت `.artifacts/qa-e2e/matrix-<timestamp>/`.

تغطي السيناريوهات سلوك النقل الذي لا تستطيع اختبارات الوحدة إثباته من البداية إلى النهاية: بوابة الإشارات، وسياسات السماح للبوتات، وقوائم السماح، والردود العلوية والمتسلسلة، وتوجيه DM، ومعالجة التفاعلات، وكبت التحرير الوارد، وإزالة تكرار إعادة التشغيل، والتعافي من انقطاع خادم المنازل، وتسليم بيانات اعتماد الموافقة، ومعالجة الوسائط، وتدفقات تمهيد/تعافي/تحقق Matrix E2EE. كما يقود ملف CLI الشخصي لـ E2EE أوامر `openclaw matrix encryption setup` والتحقق عبر خادم المنازل القابل للتخلص منه نفسه قبل فحص ردود Gateway.

لدى Discord أيضا سيناريوهات اختيارية خاصة بـ Mantis لإعادة إنتاج الأخطاء. استخدم
`--scenario discord-status-reactions-tool-only` للخط الزمني الصريح لتفاعل الحالة،
أو `--scenario discord-thread-reply-filepath-attachment` لإنشاء سلسلة
Discord حقيقية والتحقق من أن `message.thread-reply` يحافظ على مرفق
`filePath`. تبقى هذه السيناريوهات خارج مسار Discord الحي الافتراضي
لأنها مجسات إعادة إنتاج قبل/بعد وليست تغطية دخان واسعة.
يمكن لسير عمل مرفقات السلاسل في Mantis أيضا إضافة فيديو شاهد Discord Web
مسجل الدخول عندما يكون `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` أو
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` مضبوطا في بيئة QA.
ملف تعريف العارض هذا مخصص للالتقاط المرئي فقط؛ ما يزال قرار النجاح/الفشل
قادما من عراف Discord REST.

يستخدم CI سطح الأوامر نفسه في `.github/workflows/qa-live-transports-convex.yml`. تشغل الجولات المجدولة واليدوية الافتراضية ملف Matrix الشخصي السريع ببيانات اعتماد frontier حية، و`--fast`، و`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. تنشر `matrix_profile=all` اليدوية العمل إلى خمسة أجزاء ملفات شخصية بحيث يمكن تشغيل الكتالوج الشامل بالتوازي مع الحفاظ على دليل آثار واحد لكل جزء.

لمسارات دخان Telegram وDiscord وSlack حقيقية النقل:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

تستهدف قناة حقيقية موجودة مسبقا ببوتين (driver + SUT). متغيرات البيئة المطلوبة، وقوائم السيناريوهات، وآثار المخرجات، ومجموعة بيانات اعتماد Convex موثقة في [مرجع QA لـ Telegram وDiscord وSlack](#telegram-discord-and-slack-qa-reference) أدناه.

لتشغيل Slack desktop VM بالكامل مع إنقاذ VNC، شغّل:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر ذلك الأمر جهاز سطح مكتب/متصفح من Crabbox، ويشغّل مسار Slack الحي داخل VM، ويفتح Slack Web في متصفح VNC، ويلتقط سطح المكتب، وينسخ `slack-qa/` و`slack-desktop-smoke.png` و`slack-desktop-smoke.mp4` عند توفر التقاط الفيديو إلى دليل عناصر Mantis. توفر إيجارات سطح المكتب/المتصفح في Crabbox أدوات الالتقاط وحزم مساعد المتصفح/البناء الأصلي مسبقًا، لذا ينبغي ألا يثبّت السيناريو إلا البدائل الاحتياطية في الإيجارات الأقدم. يبلّغ Mantis عن التوقيتات الإجمالية ولكل مرحلة في `mantis-slack-desktop-smoke-report.md` بحيث توضّح التشغيلات البطيئة ما إذا كان الوقت قد صُرف في إحماء الإيجار، أو الحصول على بيانات الاعتماد، أو الإعداد البعيد، أو نسخ العناصر. أعد استخدام `--lease-id <cbx_...>` بعد تسجيل الدخول يدويًا إلى Slack Web عبر VNC؛ كما تُبقي الإيجارات المعاد استخدامها ذاكرة تخزين pnpm الخاصة بـ Crabbox دافئة. يتحقق الوضع الافتراضي `--hydrate-mode source` من نسخة مصدرية ويشغّل التثبيت/البناء داخل VM. استخدم `--hydrate-mode prehydrated` فقط عندما تحتوي مساحة العمل البعيدة المعاد استخدامها مسبقًا على `node_modules` و`dist/` مبنية؛ يتخطى ذلك الوضع خطوة التثبيت/البناء المكلفة ويفشل بشكل مغلق عندما لا تكون مساحة العمل جاهزة. مع `--gateway-setup`، يترك Mantis بوابة OpenClaw Slack مستمرة تعمل داخل VM على المنفذ `38973`؛ ومن دونه، يشغّل الأمر مسار Slack QA العادي من بوت إلى بوت ويخرج بعد التقاط العناصر.

توجد قائمة تحقق المشغّل، وأمر إرسال سير عمل GitHub، وعقد تعليق الأدلة، وجدول قرار وضع الإحضار، وتفسير التوقيت، وخطوات التعامل مع الفشل في [دليل تشغيل Mantis Slack Desktop](/ar/concepts/mantis-slack-desktop-runbook).

لمهمة سطح مكتب بنمط الوكيل/CV، شغّل:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

يستأجر `visual-task` أو يعيد استخدام جهاز سطح مكتب/متصفح من Crabbox، ويبدأ `crabbox record --while`، ويقود المتصفح المرئي عبر `visual-driver` متداخل، ويلتقط `visual-task.png`، ويشغّل `openclaw infer image describe` على لقطة الشاشة عند اختيار `--vision-mode image-describe`، ويكتب `visual-task.mp4` و`mantis-visual-task-summary.json` و`mantis-visual-task-driver-result.json` و`mantis-visual-task-report.md`. عند ضبط `--expect-text`، تطلب مطالبة الرؤية حكمًا منظمًا بصيغة JSON ولا تنجح إلا عندما يبلّغ النموذج عن دليل مرئي إيجابي؛ أما الاستجابة السلبية التي تقتبس النص الهدف فقط فتفشل في التأكيد. استخدم `--vision-mode metadata` لاختبار دخان بلا نموذج يثبت توصيلات سطح المكتب والمتصفح ولقطة الشاشة والفيديو من دون استدعاء مزود فهم الصور. التسجيل عنصر مطلوب لـ `visual-task`؛ إذا لم يسجل Crabbox ملف `visual-task.mp4` غير فارغ، تفشل المهمة حتى لو نجح المشغّل المرئي. عند الفشل، يحتفظ Mantis بالإيجار من أجل VNC إلا إذا كانت المهمة قد نجحت بالفعل ولم يتم ضبط `--keep-lease`.

قبل استخدام بيانات اعتماد حية مجمّعة، شغّل:

```bash
pnpm openclaw qa credentials doctor
```

يفحص الطبيب بيئة وسيط Convex، ويتحقق من إعدادات نقاط النهاية، ويتحقق من إمكانية الوصول إلى admin/list عند وجود سر المشرف. ولا يبلّغ إلا عن حالة الأسرار كمعيّنة/ناقصة.

## تغطية النقل الحي

تشترك مسارات النقل الحي في عقد واحد بدلًا من أن يخترع كل منها شكل قائمة سيناريوهات خاصًا به. `qa-channel` هي حزمة سلوك المنتج الاصطناعية الواسعة وليست جزءًا من مصفوفة تغطية النقل الحي.

| المسار | Canary | بوابة الإشارة | بوت إلى بوت | حظر قائمة السماح | رد من المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة الخيط | عزل الخيط | ملاحظة التفاعل | أمر المساعدة | تسجيل الأمر الأصلي |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

يبقي هذا `qa-channel` كحزمة سلوك المنتج الواسعة، بينما تشترك Matrix وTelegram ووسائل النقل الحية المستقبلية في قائمة تحقق صريحة لعقد النقل.

لمسار Linux VM مؤقت من دون إدخال Docker في مسار QA، شغّل:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

يُشغّل هذا ضيف Multipass جديدًا، ويثبّت التبعيات، ويبني OpenClaw داخل الضيف، ويشغّل `qa suite`، ثم ينسخ تقرير QA العادي والملخص إلى `.artifacts/qa-e2e/...` على المضيف. يعيد استخدام سلوك اختيار السيناريو نفسه كما في `qa suite` على المضيف. تنفّذ تشغيلات حزمة المضيف وMultipass عدة سيناريوهات محددة بالتوازي مع عمال Gateway معزولين افتراضيًا. تكون التزامنية الافتراضية في `qa-channel` هي 4، ومحددة بعدد السيناريوهات المختارة. استخدم `--concurrency <count>` لضبط عدد العمال، أو `--concurrency 1` للتنفيذ التسلسلي. يخرج الأمر برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما تريد العناصر من دون رمز خروج فاشل. تمرر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف: مفاتيح المزود القائمة على env، ومسار إعداد مزود QA الحي، و`CODEX_HOME` عند وجوده. أبقِ `--output-dir` تحت جذر المستودع حتى يتمكن الضيف من الكتابة مرة أخرى عبر مساحة العمل المركّبة.

## مرجع Telegram وDiscord وSlack QA

لدى Matrix [صفحة مخصصة](/ar/concepts/qa-matrix) بسبب عدد سيناريوهاتها وتوفير خادمها المنزلي المدعوم بـ Docker. أما Telegram وDiscord وSlack فهي أصغر - بضعة سيناريوهات لكل منها، بلا نظام ملفات تعريف، وتعمل مقابل قنوات حقيقية موجودة مسبقًا - لذلك يوجد مرجعها هنا.

### أعلام CLI المشتركة

تُسجَّل هذه المسارات عبر `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` وتقبل الأعلام نفسها:

| العلم                                  | الافتراضي                                                         | الوصف                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | شغّل هذا السيناريو فقط. قابل للتكرار.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | مكان كتابة التقارير/الملخص/الرسائل المرصودة وسجل الإخراج. تُحل المسارات النسبية نسبةً إلى `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | جذر المستودع عند الاستدعاء من cwd محايد.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | معرّف حساب مؤقت داخل إعداد Gateway الخاص بـ QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` أو `live-frontier` (لا يزال `live-openai` القديم يعمل).                                                  |
| `--model <ref>` / `--alt-model <ref>` | الافتراضي للمزود                                                | مراجع النموذج الأساسي/البديل.                                                                                         |
| `--fast`                              | معطّل                                                             | وضع المزود السريع حيثما كان مدعومًا.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | راجع [مجموعة بيانات اعتماد Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` في CI، و`maintainer` خلاف ذلك                              | الدور المستخدم عند `--credential-source convex`.                                                                          |

يخرج كل مسار برمز غير صفري عند فشل أي سيناريو. يكتب `--allow-failures` العناصر من دون تعيين رمز خروج فاشل.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

يستهدف مجموعة Telegram خاصة حقيقية واحدة مع بوتين متميزين (المشغّل + SUT). يجب أن يكون لبوت SUT اسم مستخدم Telegram؛ تعمل ملاحظة بوت إلى بوت بأفضل صورة عندما يكون لدى كلا البوتين **Bot-to-Bot Communication Mode** مفعّلًا في `@BotFather`.

البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - معرّف محادثة رقمي (سلسلة نصية).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختياري:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` يُبقي نصوص الرسائل في عناصر الرسائل المرصودة (الافتراضي يحجبها).

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

عناصر الإخراج:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - يتضمن RTT لكل رد (إرسال المشغّل → رد SUT المرصود) بدءًا من Canary.
- `telegram-qa-observed-messages.json` - تُحجب النصوص إلا إذا كان `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

يستهدف قناة نقابة Discord خاصة حقيقية واحدة مع بوتين: بوت مشغّل يتحكم به إطار الاختبار، وبوت SUT يبدأه Gateway فرعي لـ OpenClaw عبر Plugin Discord المضمّن. يتحقق من التعامل مع إشارات القناة، ومن أن بوت SUT سجّل الأمر الأصلي `/help` مع Discord، ومن سيناريوهات أدلة Mantis الاختيارية.

البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - يجب أن يطابق معرّف مستخدم بوت SUT الذي يعيده Discord (وإلا يفشل المسار بسرعة).

اختياري:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` يُبقي نصوص الرسائل في عناصر الرسائل المرصودة.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` يختار قناة الصوت/المسرح لـ `discord-voice-autojoin`؛ ومن دونه، يختار السيناريو أول قناة صوت/مسرح مرئية لبوت SUT.

السيناريوهات (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - سيناريو صوتي اختياري. يعمل بمفرده، ويفعّل `channels.discord.voice.autoJoin`، ويتحقق من أن حالة صوت Discord الحالية لبوت SUT هي قناة الصوت/المسرح المستهدفة. قد تتضمن بيانات اعتماد Convex Discord قيمة `voiceChannelId` اختيارية؛ وإلا يكتشف المُشغّل أول قناة صوت/مسرح مرئية في النقابة.
- `discord-status-reactions-tool-only` - سيناريو Mantis اختياري. يعمل بمفرده لأنه يبدّل SUT إلى ردود نقابة دائمة التشغيل ومعتمدة على الأدوات فقط مع `messages.statusReactions.enabled=true`، ثم يلتقط خطًا زمنيًا لتفاعلات REST إضافة إلى مخرجات مرئية بصيغتي HTML/PNG. تحفظ تقارير Mantis قبل/بعد أيضًا مخرجات MP4 التي يوفّرها السيناريو باسمَي `baseline.mp4` و`candidate.mp4`.

شغّل سيناريو الانضمام التلقائي إلى صوت Discord صراحةً:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

شغّل سيناريو تفاعلات الحالة في Mantis صراحةً:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

مخرجات الإخراج:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - تُنقّح المتون ما لم تكن `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` و`discord-status-reactions-tool-only-timeline.png` عند تشغيل سيناريو تفاعلات الحالة.

### ضمان جودة Slack

```bash
pnpm openclaw qa slack
```

يستهدف قناة Slack خاصة حقيقية واحدة مع بوتين مميزين: بوت مُشغّل تتحكم به عدة الاختبار وبوت SUT يبدأه Gateway OpenClaw الابن عبر Plugin Slack المضمّن.

متغيرات البيئة المطلوبة عند استخدام `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختياري:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` يبقي متون الرسائل في مخرجات الرسائل المرصودة.

السيناريوهات (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

مخرجات الإخراج:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - تُنقّح المتون ما لم تكن `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### إعداد مساحة عمل Slack

يحتاج المسار إلى تطبيقَي Slack مميزين في مساحة عمل واحدة، إضافة إلى قناة يكون كلا البوتين عضوين فيها:

- `channelId` - معرّف `Cxxxxxxxxxx` لقناة دُعي إليها كلا البوتين. استخدم قناة مخصصة؛ ينشر المسار في كل تشغيل.
- `driverBotToken` - رمز البوت (`xoxb-...`) لتطبيق **Driver**.
- `sutBotToken` - رمز البوت (`xoxb-...`) لتطبيق **SUT**، ويجب أن يكون تطبيق Slack منفصلًا عن المُشغّل حتى يكون معرّف مستخدم البوت مميزًا.
- `sutAppToken` - رمز على مستوى التطبيق (`xapp-...`) لتطبيق SUT مع `connections:write`، يستخدمه Socket Mode حتى يتمكن تطبيق SUT من استقبال الأحداث.

فضّل مساحة عمل Slack مخصصة لضمان الجودة بدل إعادة استخدام مساحة عمل إنتاجية.

يضيّق بيان SUT أدناه عمدًا تثبيت الإنتاج الخاص بـPlugin Slack المضمّن (`extensions/slack/src/setup-shared.ts:10`) إلى الأذونات والأحداث التي تغطيها مجموعة ضمان جودة Slack الحية. لإعداد قناة الإنتاج كما يراها المستخدمون، راجع [الإعداد السريع لقناة Slack](/ar/channels/slack#quick-setup)؛ زوج Driver/SUT الخاص بضمان الجودة منفصل عمدًا لأن المسار يحتاج إلى معرّفَي مستخدم بوت مميزين في مساحة عمل واحدة.

**1. أنشئ تطبيق Driver**

انتقل إلى [api.slack.com/apps](https://api.slack.com/apps) ← _Create New App_ ← _From a manifest_ ← اختر مساحة عمل ضمان الجودة، والصق البيان التالي، ثم _Install to Workspace_:

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

انسخ _Bot User OAuth Token_ (`xoxb-...`) - يصبح هذا `driverBotToken`. يحتاج المُشغّل فقط إلى نشر الرسائل وتعريف نفسه؛ لا أحداث، ولا Socket Mode.

**2. أنشئ تطبيق SUT**

كرر _Create New App → From a manifest_ في مساحة العمل نفسها. يستخدم تطبيق ضمان الجودة هذا عمدًا نسخة أضيق من بيان الإنتاج الخاص بـPlugin Slack المضمّن (`extensions/slack/src/setup-shared.ts:10`): تُحذف نطاقات وأحداث التفاعل لأن مجموعة ضمان جودة Slack الحية لا تغطي معالجة التفاعلات بعد.

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

- _Install to Workspace_ ← انسخ _Bot User OAuth Token_ ← يصبح هذا `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ ← أضف النطاق `connections:write` ← احفظ ← انسخ قيمة `xapp-...` ← تصبح هذه `sutAppToken`.

تحقق من أن البوتين لهما معرّفا مستخدمين مميزان عبر استدعاء `auth.test` على كل رمز. يميز وقت التشغيل بين المُشغّل وSUT عبر معرّف المستخدم؛ إعادة استخدام تطبيق واحد لكليهما ستفشل في بوابة الإشارات فورًا.

**3. أنشئ القناة**

في مساحة عمل ضمان الجودة، أنشئ قناة (مثل `#openclaw-qa`) وادعُ كلا البوتين من داخل القناة:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

انسخ معرّف `Cxxxxxxxxxx` من _channel info → About → Channel ID_ - يصبح هذا `channelId`. تعمل القناة العامة؛ وإذا استخدمت قناة خاصة، فكلا التطبيقين لديهما بالفعل `groups:history`، لذلك ستنجح قراءات السجل الخاصة بعدة الاختبار.

**4. سجّل بيانات الاعتماد**

يوجد خياران. استخدم متغيرات البيئة للتصحيح على جهاز واحد (اضبط متغيرات `OPENCLAW_QA_SLACK_*` الأربعة ومرر `--credential-source env`)، أو ازرع مجمع Convex المشترك حتى تتمكن CI والمشرفون الآخرون من استئجارها.

لمجمع Convex، اكتب الحقول الأربعة إلى ملف JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

مع تصدير `OPENCLAW_QA_CONVEX_SITE_URL` و`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` في صدفتك، سجّل وتحقق:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

توقع `count: 1` و`status: "active"`، بلا حقل `lease`.

**5. تحقق من البداية إلى النهاية**

شغّل المسار محليًا لتأكيد أن كلا البوتين يستطيعان التحدث إلى بعضهما عبر الوسيط:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

يكتمل التشغيل الأخضر في أقل بكثير من 30 ثانية، ويُظهر `slack-qa-report.md` كلاً من `slack-canary` و`slack-mention-gating` بالحالة `pass`. إذا علِق المسار لنحو 90 ثانية وخرج مع `Convex credential pool exhausted for kind "slack"`، فإما أن المجمع فارغ أو أن كل صف مستأجر - سيخبرك `qa credentials list --kind slack --status all --json` بأي الاحتمالين.

### مجمع بيانات اعتماد Convex

يمكن لمسارات Telegram وDiscord وSlack استئجار بيانات الاعتماد من مجمع Convex مشترك بدل قراءة متغيرات البيئة أعلاه. مرر `--credential-source convex` (أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)؛ يكتسب QA Lab استئجارًا حصريًا، ويرسل له Heartbeat طوال مدة التشغيل، ويحرره عند الإيقاف. أنواع المجمع هي `"telegram"` و`"discord"` و`"slack"`.

أشكال الحمولة التي يتحقق منها الوسيط على `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - يجب أن يكون `groupId` سلسلة معرّف دردشة رقمية.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - يجب أن يطابق `channelId` النمط `^[A-Z][A-Z0-9]+$` (معرّف Slack مثل `Cxxxxxxxxxx`). راجع [إعداد مساحة عمل Slack](#setting-up-the-slack-workspace) لتجهيز التطبيقات والنطاقات.

توجد متغيرات البيئة التشغيلية وعقدة نقطة نهاية وسيط Convex في [الاختبار ← بيانات اعتماد Telegram المشتركة عبر Convex](/ar/help/testing#shared-telegram-credentials-via-convex-v1) (اسم القسم يسبق دعم Discord؛ دلالات الوسيط متطابقة لكلا النوعين).

## بذور مدعومة بالمستودع

توجد أصول البذور في `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

توجد هذه عمدًا في git حتى تكون خطة ضمان الجودة مرئية للبشر والوكيل معًا.

ينبغي أن يبقى `qa-lab` مشغّل Markdown عامًا. كل ملف سيناريو Markdown هو مصدر الحقيقة لتشغيل اختبار واحد وينبغي أن يعرّف:

- بيانات تعريف السيناريو
- بيانات تعريف اختيارية للفئة والقدرة والمسار والمخاطر
- مراجع الوثائق والكود
- متطلبات Plugin اختيارية
- رقعة إعداد Gateway اختيارية
- `qa-flow` القابل للتنفيذ

يُسمح لسطح وقت التشغيل القابل لإعادة الاستخدام الذي يدعم `qa-flow` بأن يبقى عامًا وشاملًا. على سبيل المثال، يمكن لسيناريوهات Markdown الجمع بين مساعدين على جانب النقل ومساعدين على جانب المتصفح يقودون Control UI المضمّنة عبر تماس Gateway `browser.request` من دون إضافة مشغّل حالة خاصة.

ينبغي تجميع ملفات السيناريو حسب قدرة المنتج بدل مجلد شجرة المصدر. حافظ على ثبات معرّفات السيناريو عند نقل الملفات؛ استخدم `docsRefs` و`codeRefs` لإمكانية تتبع التنفيذ.

ينبغي أن تبقى قائمة الأساس عريضة بما يكفي لتغطية:

- دردشة الرسائل المباشرة والقنوات
- سلوك الخيوط
- دورة حياة إجراء الرسالة
- استدعاءات Cron
- استرجاع الذاكرة
- تبديل النموذج
- تسليم الوكيل الفرعي
- قراءة المستودع وقراءة الوثائق
- مهمة بناء صغيرة واحدة مثل Lobster Invaders

## مسارات محاكاة المزوّدين

تملك `qa suite` مساري محاكاة مزودين محليين:

- `mock-openai` هو محاكي OpenClaw الواعي بالسيناريو. يبقى مسار المحاكاة الحتمي الافتراضي لضمان الجودة المدعوم بالمستودع وبوابات التكافؤ.
- `aimock` يبدأ خادم مزود مدعومًا بـAIMock لتغطية تجريبية للبروتوكول، والتجهيزات، والتسجيل/إعادة التشغيل، والفوضى. إنه إضافي ولا يستبدل موزّع سيناريو `mock-openai`.

يوجد تنفيذ مسار المزود تحت `extensions/qa-lab/src/providers/`. يملك كل مزود إعداداته الافتراضية، وبدء تشغيل الخادم المحلي، وإعداد نموذج Gateway، واحتياجات تجهيز ملف تعريف المصادقة، وأعلام قدرات الحي/المحاكاة. ينبغي أن يوجّه كود المجموعة المشتركة وGateway عبر سجل المزودين بدل التفريع على أسماء المزودين.

## محولات النقل

`qa-lab` يملك حدًّا فاصلًا عامًا للنقل لسيناريوهات ضمان الجودة بصيغة markdown. يُعد `qa-channel` أول مهايئ على هذا الحد الفاصل، لكن هدف التصميم أوسع: يجب أن تتصل القنوات الحقيقية أو الاصطناعية المستقبلية بمشغّل المجموعة نفسه بدلًا من إضافة مشغّل ضمان جودة خاص بالنقل.

على مستوى البنية، يكون الفصل كالتالي:

- يملك `qa-lab` تنفيذ السيناريو العام، وتزامن العمال، وكتابة المصنوعات، والتقارير.
- يملك مهايئ النقل إعداد Gateway، والجاهزية، ومراقبة الوارد والصادر، وإجراءات النقل، وحالة النقل المعيارية.
- تحدد ملفات سيناريوهات Markdown ضمن `qa/scenarios/` تشغيل الاختبار؛ ويوفر `qa-lab` سطح وقت التشغيل القابل لإعادة الاستخدام الذي ينفذها.

### إضافة قناة

تتطلب إضافة قناة إلى نظام ضمان الجودة المعتمد على Markdown شيئين بالضبط:

1. مهايئ نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تضف جذر أمر ضمان جودة جديدًا على المستوى الأعلى عندما يستطيع مضيف `qa-lab` المشترك امتلاك التدفق.

يملك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء المجموعة وإنهاؤها
- تزامن العمال
- كتابة المصنوعات
- إنشاء التقارير
- تنفيذ السيناريو
- أسماء توافق بديلة لسيناريوهات `qa-channel` الأقدم

تملك Plugins المشغّل عقد النقل:

- كيفية تركيب `openclaw qa <runner>` أسفل جذر `qa` المشترك
- كيفية إعداد Gateway لذلك النقل
- كيفية فحص الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية مراقبة الرسائل الصادرة
- كيفية كشف النصوص المنسوخة وحالة النقل المعيارية
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة الضبط أو التنظيف الخاصين بالنقل

الحد الأدنى لاعتماد قناة جديدة:

1. أبقِ `qa-lab` مالكًا لجذر `qa` المشترك.
2. نفّذ مشغّل النقل على حد مضيف `qa-lab` المشترك.
3. أبقِ الآليات الخاصة بالنقل داخل Plugin المشغّل أو حزمة اختبار القناة.
4. ركّب المشغّل كـ `openclaw qa <runner>` بدلًا من تسجيل أمر جذري منافس. يجب أن تعلن Plugins المشغّل عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`. أبقِ `runtime-api.ts` خفيفًا؛ يجب أن يبقى CLI الكسول وتنفيذ المشغّل خلف نقاط دخول منفصلة.
5. ألّف أو كيّف سيناريوهات Markdown ضمن أدلة `qa/scenarios/` ذات السمات.
6. استخدم مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. أبقِ أسماء التوافق البديلة الحالية عاملة ما لم يكن المستودع يجري ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا كان من الممكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحد، فأبقِه في Plugin ذلك المشغّل أو حزمة اختبار Plugin.
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

تبقى أسماء التوافق البديلة متاحة للسيناريوهات الحالية - `waitForQaChannelReady` و`waitForOutboundMessage` و`waitForNoOutbound` و`formatConversationTranscript` و`resetBus` - لكن يجب أن تستخدم كتابة السيناريوهات الجديدة الأسماء العامة. توجد الأسماء البديلة لتجنب ترحيل فوري شامل، لا كنموذج للمضي قدمًا.

## التقارير

يصدّر `qa-lab` تقرير بروتوكول Markdown من الخط الزمني للناقل المرصود.
يجب أن يجيب التقرير عن:

- ما الذي نجح
- ما الذي فشل
- ما الذي بقي محظورًا
- ما سيناريوهات المتابعة الجديرة بالإضافة

لجرد السيناريوهات المتاحة - وهو مفيد عند تقدير حجم عمل المتابعة أو توصيل نقل جديد - شغّل `pnpm openclaw qa coverage` (أضف `--json` لإخراج قابل للقراءة آليًا).

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

يشغّل الأمر عمليات فرعية محلية لـ Gateway ضمان الجودة، وليس Docker. يجب أن تضبط سيناريوهات تقييم الشخصية الهيئة عبر `SOUL.md`، ثم تشغّل أدوار مستخدم عادية مثل الدردشة، ومساعدة مساحة العمل، ومهام الملفات الصغيرة. يجب ألا يُخبر النموذج المرشح بأنه قيد التقييم. يحافظ الأمر على كل نص منسوخ كامل، ويسجل إحصاءات التشغيل الأساسية، ثم يطلب من نماذج التحكيم في الوضع السريع مع استدلال `xhigh` حيث يكون مدعومًا ترتيب التشغيلات حسب الطبيعية، والانطباع العام، والفكاهة.
استخدم `--blind-judge-models` عند مقارنة المزوّدين: ما زال موجّه التحكيم يحصل على كل نص منسوخ وحالة تشغيل، لكن تُستبدل مراجع المرشحين بتسميات محايدة مثل `candidate-01`؛ ويربط التقرير الترتيبات مرة أخرى بالمراجع الحقيقية بعد التحليل.
تكون تشغيلات المرشحين افتراضيًا على تفكير `high`، مع `medium` لـ GPT-5.5 و`xhigh` لمراجع تقييم OpenAI الأقدم التي تدعمه. تجاوز مرشحًا محددًا ضمنيًا باستخدام
`--model provider/model,thinking=<level>`. ما زال `--thinking <level>` يعيّن احتياطيًا عامًا، ويُحتفظ بالصيغة الأقدم `--model-thinking <provider/model=level>` للتوافق.
تستخدم مراجع مرشحي OpenAI الوضع السريع افتراضيًا بحيث تُستخدم المعالجة ذات الأولوية حيث يدعمها المزوّد. أضف `,fast` أو `,no-fast` أو `,fast=false` ضمنيًا عندما يحتاج مرشح أو حكم واحد إلى تجاوز. مرّر `--fast` فقط عندما تريد فرض تشغيل الوضع السريع لكل نموذج مرشح. تُسجل مدد المرشحين والحكام في التقرير لتحليل المعايير، لكن موجّهات الحكام تقول صراحةً ألا يتم الترتيب حسب السرعة.
تعمل تشغيلات نماذج المرشحين والحكام افتراضيًا بتزامن 16. خفّض
`--concurrency` أو `--judge-concurrency` عندما تجعل حدود المزوّد أو ضغط Gateway المحلي التشغيل شديد الضجيج.
عندما لا يُمرّر أي مرشح `--model`، يستخدم تقييم الشخصية افتراضيًا
`openai/gpt-5.5` و`openai/gpt-5.2` و`openai/gpt-5` و`anthropic/claude-opus-4-6`
و`anthropic/claude-sonnet-4-6` و`zai/glm-5.1`
و`moonshot/kimi-k2.5` و
`google/gemini-3.1-pro-preview` عندما لا يُمرّر أي `--model`.
عندما لا يُمرّر `--judge-model`، تكون نماذج التحكيم الافتراضية
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high`.

## مستندات ذات صلة

- [ضمان الجودة بالمصفوفة](/ar/concepts/qa-matrix)
- [قناة ضمان الجودة](/ar/channels/qa-channel)
- [الاختبار](/ar/help/testing)
- [لوحة المعلومات](/ar/web/dashboard)
