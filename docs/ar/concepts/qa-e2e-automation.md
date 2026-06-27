---
read_when:
    - فهم كيفية ترابط حزمة ضمان الجودة معًا
    - توسيع qa-lab أو qa-channel أو محوّل نقل
    - إضافة سيناريوهات ضمان الجودة المدعومة بالمستودع
    - بناء أتمتة ضمان جودة أعلى واقعية حول لوحة معلومات Gateway
summary: 'نظرة عامة على مكدس ضمان الجودة: qa-lab، وqa-channel، والسيناريوهات المستندة إلى المستودع، ومسارات النقل المباشر، ومحولات النقل، وإعداد التقارير.'
title: نظرة عامة على ضمان الجودة
x-i18n:
    generated_at: "2026-06-27T17:31:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

يهدف مكدس QA الخاص إلى اختبار OpenClaw بطريقة أكثر واقعية
ومشكّلة حول القنوات مما يمكن لاختبار وحدة واحد تحقيقه.

الأجزاء الحالية:

- `extensions/qa-channel`: قناة رسائل اصطناعية بأسطح للرسائل المباشرة، والقناة، والسلاسل،
  والتفاعلات، والتحرير، والحذف.
- `extensions/qa-lab`: واجهة مصحّح الأخطاء وناقل QA لمراقبة النص المنسوخ،
  وحقن الرسائل الواردة، وتصدير تقرير Markdown.
- `extensions/qa-matrix`، وإضافات التشغيل المستقبلية: محوّلات نقل حية
  تقود قناة حقيقية داخل Gateway فرعي خاص بـ QA.
- `qa/`: أصول بذور مدعومة بالمستودع لمهمة البدء وسيناريوهات QA
  الأساسية.
- [Mantis](/ar/concepts/mantis): تحقق حي قبل وبعد للأخطاء التي
  تحتاج إلى وسائل نقل حقيقية، ولقطات شاشة للمتصفح، وحالة VM، وأدلة PR.

## سطح الأوامر

يعمل كل تدفق QA ضمن `pnpm openclaw qa <subcommand>`. لدى كثير منها أسماء بديلة
كسكربتات `pnpm qa:*`؛ وكلا الشكلين مدعوم.

| الأمر                                             | الغرض                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | فحص ذاتي مضمّن لـ QA بدون `--qa-profile`؛ مشغّل ملف نضج مدعوم بالتصنيف مع `--qa-profile smoke-ci` أو `--qa-profile release` أو `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | تشغيل سيناريوهات مدعومة بالمستودع مقابل مسار QA Gateway. الأسماء البديلة: `pnpm openclaw qa suite --runner multipass` لاستخدام Linux VM قابل للتخلص منه.                                                                                                                                  |
| `qa coverage`                                       | طباعة مخزون تغطية سيناريوهات YAML (`--json` للمخرجات الآلية).                                                                                                                                                                                               |
| `qa parity-report`                                  | مقارنة ملفي `qa-suite-summary.json` وكتابة تقرير التكافؤ الوكيل، أو استخدام `--runtime-axis --token-efficiency` لكتابة تقارير تكافؤ وقت تشغيل Codex مقابل OpenClaw وكفاءة الرموز من ملخص زوج وقت تشغيل واحد.                                         |
| `qa character-eval`                                 | تشغيل سيناريو QA للشخصية عبر عدة نماذج حية مع تقرير محكّم. راجع [التقارير](#reporting).                                                                                                                                                            |
| `qa manual`                                         | تشغيل موجّه لمرة واحدة مقابل مسار المزوّد/النموذج المحدد.                                                                                                                                                                                                          |
| `qa ui`                                             | بدء واجهة مصحّح QA وناقل QA المحلي (الاسم البديل: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | بناء صورة QA Docker المجهزة مسبقًا.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | كتابة قالب docker-compose للوحة QA ومسار Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | بناء موقع QA، وبدء المكدس المدعوم بـ Docker، وطباعة URL (الاسم البديل: `pnpm qa:lab:up`؛ متغير `:fast` يضيف `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | بدء خادم مزوّد AIMock فقط.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | بدء خادم مزوّد `mock-openai` الواعي بالسيناريو فقط.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | إدارة مجموعة بيانات اعتماد Convex المشتركة.                                                                                                                                                                                                                               |
| `qa matrix`                                         | مسار نقل حي مقابل خادم Tuwunel homeserver قابل للتخلص منه. راجع [Matrix QA](/ar/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | مسار نقل حي مقابل مجموعة Telegram خاصة حقيقية.                                                                                                                                                                                                              |
| `qa discord`                                        | مسار نقل حي مقابل قناة guild خاصة حقيقية في Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | مسار نقل حي مقابل قناة Slack خاصة حقيقية.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | مسار نقل حي مقابل حسابات WhatsApp Web حقيقية.                                                                                                                                                                                                                 |
| `qa mantis`                                         | مشغّل تحقق قبل وبعد لأخطاء النقل الحي، مع أدلة تفاعلات حالة Discord، ودخان سطح مكتب/متصفح Crabbox، ودخان Slack داخل VNC. راجع [Mantis](/ar/concepts/mantis) و[دليل تشغيل Mantis Slack Desktop](/ar/concepts/mantis-slack-desktop-runbook). |

يقرأ `qa run` المدعوم بالملفات العضوية من `taxonomy.yaml`، ثم يرسل
السيناريوهات المحلولة عبر `qa suite`. يقوم `--surface` و
`--category` بتصفية الملف المحدد بدلًا من تعريف مسارات منفصلة.
يتضمن ملف `qa-evidence.json` الناتج ملخص بطاقة درجات للملف مع
أعداد الفئات المحددة ومعرّفات التغطية المفقودة؛ وتبقى إدخالات الأدلة
الفردية مصدر الحقيقة للاختبارات، وأدوار التغطية، والنتائج.
معرّفات تغطية ميزات التصنيف هي أهداف إثبات دقيقة، وليست أسماء مستعارة. تحقق
تغطية السيناريو الأساسية المعرّفات المطابقة؛ وتبقى التغطية الثانوية إرشادية.
تستخدم معرّفات التغطية صيغة `namespace.behavior` المنقطة مع مقاطع
أبجدية رقمية/شرطية صغيرة؛ وقد تظل معرّفات الملف، والسطح، والفئة تستخدم
معرّفات التصنيف الحالية ذات الشرطات أو النقاط.
يحذف الدليل النحيف `execution` لكل إدخال ويعيّن `evidenceMode: "slim"`؛
يستخدم `smoke-ci` الوضع النحيف افتراضيًا، ويستعيد `--evidence-mode full` الإدخالات الكاملة:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

استخدم `smoke-ci` لإثبات ملف حتمي مع مزوّدي نماذج وهميين
وخوادم مزوّد Crabline الوهمية. استخدم `release` لإثبات Stable/LTS مقابل
قنوات حية. استخدم `all` فقط لتشغيلات الأدلة الصريحة لكامل التصنيف؛ فهو يحدد
كل فئة نضج نشطة ويمكن إرساله عبر سير عمل `QA Profile
Evidence` مع `qa_profile=all`. عندما يحتاج الأمر أيضًا إلى ملف جذر OpenClaw،
ضع ملف الجذر قبل أمر QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## تدفق المشغّل

تدفق مشغّل QA الحالي هو موقع QA بلوحتين:

- اليسار: لوحة Gateway (واجهة التحكم) مع الوكيل.
- اليمين: QA Lab، يعرض النص المنسوخ الشبيه بـ Slack وخطة السيناريو.

شغّله باستخدام:

```bash
pnpm qa:lab:up
```

يبني ذلك موقع QA، ويبدأ مسار Gateway المدعوم بـ Docker، ويعرض
صفحة QA Lab حيث يمكن للمشغّل أو حلقة الأتمتة إعطاء الوكيل مهمة QA،
ومراقبة سلوك القناة الحقيقي، وتسجيل ما نجح، أو فشل، أو بقي محظورًا.

لتكرار أسرع على واجهة QA Lab بدون إعادة بناء صورة Docker في كل مرة،
ابدأ المكدس بحزمة QA Lab مركبة ربطًا:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

يبقي `qa:lab:up:fast` خدمات Docker على صورة مبنية مسبقًا ويركب ربطًا
`extensions/qa-lab/web/dist` داخل حاوية `qa-lab`. يعيد `qa:lab:watch`
بناء تلك الحزمة عند التغيير، ويعيد المتصفح التحميل تلقائيًا عندما يتغير
تجزئة أصل QA Lab.

لدخان إشارة OpenTelemetry محلي، شغّل:

```bash
pnpm qa:otel:smoke
```

يبدأ ذلك السكربت مستقبل OTLP/HTTP محليًا، ويشغل سيناريو QA
`otel-trace-smoke` مع تفعيل Plugin `diagnostics-otel`، ثم يتحقق من تصدير
التتبعات، والمقاييس، والسجلات. يفك ترميز امتدادات التتبع protobuf المصدّرة
ويتحقق من الشكل الحرج للإصدار:
يجب أن تكون `openclaw.run`، و`openclaw.harness.run`، وامتداد استدعاء نموذج وفق أحدث
اتفاقية دلالية GenAI، و`openclaw.context.assembled`، و`openclaw.message.delivery`
موجودة. يفرض الدخان
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`، لذلك يجب أن يستخدم امتداد استدعاء
النموذج اسم `{gen_ai.operation.name} {gen_ai.request.model}`؛
يجب ألا تصدّر استدعاءات النماذج `StreamAbandoned` في الجولات الناجحة؛ ويجب أن تبقى معرّفات التشخيص الخام وسمات
`openclaw.content.*` خارج التتبع. يجب ألا تحتوي حمولات OTLP الخام
على حارس الموجّه، أو حارس الاستجابة، أو مفتاح جلسة QA.
يكتب `otel-smoke-summary.json` بجانب عناصر QA suite الأثرية.

لدخان OpenTelemetry مدعوم بمجمّع، شغّل:

```bash
pnpm qa:otel:collector-smoke
```

يضع ذلك المسار حاوية Docker حقيقية لـ OpenTelemetry Collector أمام
المستقبل المحلي نفسه. استخدمه عند تغيير توصيل نقاط النهاية، أو توافق المجمّع،
أو سلوك تصدير OTLP الذي قد يخفيه المستقبل داخل العملية.

لدخان كشط Prometheus المحمي، شغّل:

```bash
pnpm qa:prometheus:smoke
```

يشغّل ذلك الاسم المستعار سيناريو QA باسم `docker-prometheus-smoke` مع تفعيل
`diagnostics-prometheus`، ويتحقق من رفض عمليات الاستخراج غير المصادق عليها،
ثم يتحقق من أن الاستخراج المصادق عليه يتضمن عائلات المقاييس الحرجة للإصدار
دون محتوى المطالبات، أو محتوى الاستجابات، أو معرّفات التشخيص الخام، أو رموز
المصادقة، أو المسارات المحلية.

لتشغيل اختباري قابلية الملاحظة الدخانيين بالتتابع، استخدم:

```bash
pnpm qa:observability:smoke
```

لمسار OpenTelemetry المدعوم بالمجمّع مع اختبار دخاني لاستخراج Prometheus
المحمي، استخدم:

```bash
pnpm qa:observability:collector-smoke
```

تبقى QA لقابلية الملاحظة مقتصرة على نسخة source-checkout فقط. يحذف أرشيف npm
tarball عن قصد QA Lab، لذلك لا تشغّل مسارات إصدار Docker للحزمة أوامر `qa`.
استخدم `pnpm qa:otel:smoke`، أو `pnpm qa:prometheus:smoke`، أو
`pnpm qa:observability:smoke` من نسخة source checkout مبنية عند تغيير
أدوات التشخيص.

لمسار اختبار دخاني حقيقي النقل في Matrix لا يتطلب بيانات اعتماد موفّر النماذج،
شغّل الملف السريع مع موفّر OpenAI الوهمي الحتمي:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

لمسار موفّر live-frontier، قدّم بيانات اعتماد متوافقة مع OpenAI صراحة:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

مرجع CLI الكامل، وفهرس الملفات/السيناريوهات، ومتغيرات البيئة، وتخطيط المصنوعات لهذا المسار موجودة في [Matrix QA](/ar/concepts/qa-matrix). باختصار: يوفّر خادم Tuwunel homeserver مؤقتًا في Docker، ويسجّل مستخدمين مؤقتين للسائق/SUT/المراقب، ويشغّل Plugin الحقيقي لـ Matrix داخل Gateway فرعي لـ QA محدود بذلك النقل (دون `qa-channel`)، ثم يكتب تقرير Markdown، وملخص JSON، ومصنوعة observed-events، وسجل مخرجات موحدًا ضمن `.artifacts/qa-e2e/matrix-<timestamp>/`.

تغطي السيناريوهات سلوك النقل الذي لا تستطيع اختبارات الوحدة إثباته من البداية إلى النهاية: بوابة الإشارات، وسياسات السماح للبوتات، وقوائم السماح، والردود العلوية والمترابطة، وتوجيه الرسائل المباشرة، والتعامل مع التفاعلات، وكبت التعديلات الواردة، وإزالة تكرار إعادة التشغيل، واستعادة انقطاع homeserver، وتسليم بيانات موافقات الوصفية، والتعامل مع الوسائط، وتدفقات تهيئة/استعادة/تحقق E2EE في Matrix. كما يشغّل ملف CLI الخاص بـ E2EE أوامر `openclaw matrix encryption setup` والتحقق عبر homeserver المؤقت نفسه قبل فحص ردود Gateway.

لدى Discord أيضًا سيناريوهات اختيارية مخصصة لـ Mantis لإعادة إنتاج الأخطاء. استخدم
`--scenario discord-status-reactions-tool-only` لخط زمني صريح لتفاعل الحالة،
أو `--scenario discord-thread-reply-filepath-attachment` لإنشاء سلسلة Discord
حقيقية والتحقق من أن `message.thread-reply` يحتفظ بمرفق
`filePath`. تبقى هذه السيناريوهات خارج مسار Discord الحي الافتراضي لأنها
مجسات إعادة إنتاج قبل/بعد وليست تغطية دخانية واسعة. يمكن لسير عمل Mantis
لمرفق السلسلة أيضًا إضافة فيديو شاهد من Discord Web مسجّل الدخول عند تهيئة
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` أو
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` في بيئة QA. ملف ذلك العارض
مخصص للالتقاط المرئي فقط؛ أما قرار النجاح/الفشل فما زال يأتي من مرجع Discord
REST.

يستخدم CI سطح الأوامر نفسه في `.github/workflows/qa-live-transports-convex.yml`.
تشغّل عمليات التشغيل المجدولة واليدوية الافتراضية ملف Matrix السريع باستخدام
بيانات اعتماد live-frontier المقدمة من QA، و`--fast`، و
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. يوسّع التشغيل اليدوي
`matrix_profile=all` إلى الأجزاء الخمسة للملفات.

لمسارات الاختبار الدخاني الحقيقي للنقل في Telegram، وDiscord، وSlack، وWhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

تستهدف هذه المسارات قناة حقيقية موجودة مسبقًا مع بوتين أو حسابين (السائق + SUT). متغيرات البيئة المطلوبة، وقوائم السيناريوهات، ومصنوعات المخرجات، ومجمّع بيانات اعتماد Convex موثقة في [مرجع QA لـ Telegram وDiscord وSlack وWhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) أدناه.

لتشغيل VM سطح مكتب Slack كامل مع إنقاذ VNC، شغّل:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر ذلك الأمر جهاز Crabbox سطح مكتب/متصفح، ويشغّل مسار Slack الحي
داخل VM، ويفتح Slack Web في متصفح VNC، ويلتقط سطح المكتب، وينسخ
`slack-qa/`، و`slack-desktop-smoke.png`، و`slack-desktop-smoke.mp4`
عندما يكون التقاط الفيديو متاحًا إلى دليل مصنوعات Mantis. توفر إيجارات
Crabbox لسطح المكتب/المتصفح أدوات الالتقاط وحزم مساعد المتصفح/البناء الأصلي
مسبقًا، لذلك ينبغي ألا يثبّت السيناريو البدائل إلا على الإيجارات الأقدم.
تسجل Mantis التوقيت الكلي وتوقيت كل مرحلة في
`mantis-slack-desktop-smoke-report.md` حتى توضح عمليات التشغيل البطيئة هل ذهب
الوقت إلى تسخين الإيجار، أو الحصول على بيانات الاعتماد، أو الإعداد البعيد، أو
نسخ المصنوعات. أعد استخدام `--lease-id <cbx_...>` بعد تسجيل الدخول إلى Slack
Web يدويًا عبر VNC؛ تحافظ الإيجارات المعاد استخدامها أيضًا على دفء ذاكرة
Crabbox المؤقتة لمخزن pnpm. يتحقق الوضع الافتراضي `--hydrate-mode source` من
نسخة source checkout ويشغّل install/build داخل VM. استخدم
`--hydrate-mode prehydrated` فقط عندما تحتوي مساحة العمل البعيدة المعاد
استخدامها مسبقًا على `node_modules` و`dist/` مبني؛ يتخطى ذلك الوضع خطوة
install/build المكلفة ويفشل بإغلاق عندما لا تكون مساحة العمل جاهزة.
مع `--gateway-setup`، تترك Mantis بوابة OpenClaw Slack مستمرة تعمل داخل VM
على المنفذ `38973`؛ ومن دونه، يشغّل الأمر مسار QA المعتاد من بوت إلى بوت في
Slack ويخرج بعد التقاط المصنوعات.

لإثبات واجهة موافقة Slack الأصلية بدليل سطح مكتب، شغّل وضع نقاط تحقق
الموافقة في Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

هذا الوضع متنافر مع `--gateway-setup`. يشغّل سيناريوهات موافقة Slack، ويرفض
معرّفات السيناريوهات غير الخاصة بالموافقة، وينتظر عند كل حالة موافقة معلقة
ومحلولة، ويعرض رسالة Slack API المرصودة إلى
`approval-checkpoints/<scenario>-pending.png` و
`approval-checkpoints/<scenario>-resolved.png`، ثم يفشل إذا كانت أي نقطة تحقق،
أو دليل رسالة، أو إقرار، أو لقطة شاشة معروضة مفقودة أو فارغة. قد تظل إيجارات
CI الباردة تعرض تسجيل الدخول إلى Slack في `slack-desktop-smoke.png`؛ صور نقاط
تحقق الموافقة هي الدليل المرئي لهذا المسار.

توجد قائمة تحقق المشغّل، وأمر إرسال سير عمل GitHub، وعقد تعليق الدليل، وجدول قرار hydrate-mode، وتفسير التوقيت، وخطوات التعامل مع الفشل في [دليل تشغيل سطح مكتب Mantis Slack](/ar/concepts/mantis-slack-desktop-runbook).

لمهمة سطح مكتب بأسلوب وكيل/CV، شغّل:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

يستأجر `visual-task` جهاز Crabbox سطح مكتب/متصفح أو يعيد استخدامه، ويبدأ
`crabbox record --while`، ويقود المتصفح المرئي عبر `visual-driver` متداخل،
ويلتقط `visual-task.png`، ويشغّل `openclaw infer image describe` على لقطة
الشاشة عند اختيار `--vision-mode image-describe`، ويكتب
`visual-task.mp4`، و`mantis-visual-task-summary.json`،
و`mantis-visual-task-driver-result.json`، و`mantis-visual-task-report.md`.
عند ضبط `--expect-text`، تطلب مطالبة الرؤية حكم JSON منظمًا ولا تنجح إلا
عندما يبلغ النموذج عن دليل مرئي إيجابي؛ تفشل الاستجابة السلبية التي تقتبس
النص الهدف فقط في التأكيد. استخدم `--vision-mode metadata` لاختبار دخاني
بلا نموذج يثبت سطح المكتب، والمتصفح، ولقطة الشاشة، ومسار الفيديو دون استدعاء
موفّر فهم الصور. التسجيل مصنوعة مطلوبة لـ `visual-task`؛ إذا لم يسجل Crabbox
ملف `visual-task.mp4` غير فارغ، تفشل المهمة حتى لو نجح السائق المرئي. عند
الفشل، تحتفظ Mantis بالإيجار من أجل VNC ما لم تكن المهمة قد نجحت بالفعل ولم
يُضبط `--keep-lease`.

قبل استخدام بيانات اعتماد حية مجمّعة، شغّل:

```bash
pnpm openclaw qa credentials doctor
```

يفحص doctor بيئة وسيط Convex، ويتحقق من إعدادات نقطة النهاية، ويتحقق من إمكانية الوصول إلى admin/list عند وجود سر المشرف. لا يبلغ إلا عن حالة الأسرار مضبوط/مفقود.

## تغطية النقل الحي

تشارك مسارات النقل الحي عقدًا واحدًا بدل أن يخترع كل منها شكل قائمة سيناريوهات خاصًا به. `qa-channel` هو مجموعة سلوك المنتج الاصطناعية الواسعة وليس جزءًا من مصفوفة تغطية النقل الحي.

ينبغي لمشغّلات النقل الحي استيراد معرّفات السيناريوهات المشتركة، ومساعدات
التغطية الأساسية، ومساعد اختيار السيناريوهات من
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| المسار | Canary | بوابة الإشارات | بوت إلى بوت | حظر قائمة السماح | رد علوي | رد مقتبس | استئناف بعد إعادة التشغيل | متابعة سلسلة | عزل السلسلة | رصد التفاعل | أمر المساعدة | تسجيل أمر أصلي |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

يحافظ هذا على `qa-channel` بوصفها مجموعة سلوك المنتج الواسعة، بينما تشارك
Matrix وTelegram ووسائل النقل الحية الأخرى قائمة تحقق صريحة واحدة لعقد النقل.

لمسار VM Linux مؤقت دون إدخال Docker في مسار QA، شغّل:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

يشغّل هذا ضيف Multipass جديدًا، ويثبّت الاعتماديات، ويبني OpenClaw داخل
الضيف، ويشغّل `qa suite`، ثم ينسخ تقرير QA والملخص المعتادين إلى
`.artifacts/qa-e2e/...` على المضيف. يعيد استخدام سلوك اختيار السيناريوهات
نفسه الذي يستخدمه `qa suite` على المضيف. تشغّل مجموعات المضيف وMultipass عدة
سيناريوهات مختارة بالتوازي مع عمال Gateway معزولين افتراضيًا. القيمة
الافتراضية لتزامن `qa-channel` هي 4، ومحدودة بعدد السيناريوهات المختارة.
استخدم `--concurrency <count>` لضبط عدد العمال، أو `--concurrency 1`
للتنفيذ التسلسلي. استخدم `--pack personal-agent` لتشغيل حزمة معيار المساعد
الشخصي. محدد الحزمة تراكمي مع أعلام `--scenario` المتكررة: تعمل
السيناريوهات الصريحة أولًا، ثم تعمل سيناريوهات الحزمة بترتيب الحزمة مع إزالة
التكرارات. استخدم `--pack observability` عندما يوفّر مشغّل QA مخصص بالفعل
إعداد مجمّع OpenTelemetry ويريد اختيار سيناريوهات الاختبار الدخاني لتشخيصات
OpenTelemetry وPrometheus معًا. يخرج الأمر برمز غير صفري عند فشل أي سيناريو.
استخدم `--allow-failures` عندما تريد المصنوعات دون رمز خروج فاشل. تمرر
عمليات التشغيل الحية مدخلات مصادقة QA المدعومة والعملية للضيف: مفاتيح
الموفّر القائمة على البيئة، ومسار إعدادات موفّر QA الحي، و`CODEX_HOME` عند
وجوده. أبقِ `--output-dir` تحت جذر المستودع حتى يستطيع الضيف الكتابة مرة
أخرى عبر مساحة العمل المركبة.

## مرجع ضمان الجودة لـ Telegram وDiscord وSlack وWhatsApp

لدى Matrix [صفحة مخصصة](/ar/concepts/qa-matrix) بسبب عدد سيناريوهاته وتوفير خادم منزلي مدعوم بـ Docker. يعمل Telegram وDiscord وSlack وWhatsApp على وسائل نقل حقيقية موجودة مسبقًا، لذلك يوجد مرجعها هنا.

### أعلام CLI المشتركة

تُسجَّل هذه المسارات عبر `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` وتقبل الأعلام نفسها:

| العلم                                 | الافتراضي                                         | الوصف                                                                                                                                         |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | شغّل هذا السيناريو فقط. قابل للتكرار.                                                                                                           |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | المكان الذي تُكتب فيه التقارير، والملخصات، والأدلة، والآثار الخاصة بوسيلة النقل، وسجل الإخراج. تُحل المسارات النسبية نسبةً إلى `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | جذر المستودع عند الاستدعاء من cwd محايد.                                                                                                        |
| `--sut-account <id>`                  | `sut`                                              | معرّف حساب مؤقت داخل إعدادات Gateway الخاصة بضمان الجودة.                                                                                      |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` أو `live-frontier` (ما زال `live-openai` القديم يعمل).                                                                           |
| `--model <ref>` / `--alt-model <ref>` | افتراضي المزوّد                                   | مراجع النموذج الأساسي/البديل.                                                                                                                   |
| `--fast`                              | متوقف                                             | الوضع السريع للمزوّد حيث يكون مدعومًا.                                                                                                          |
| `--credential-source <env\|convex>`   | `env`                                              | راجع [مجمع بيانات اعتماد Convex](#convex-credential-pool).                                                                                     |
| `--credential-role <maintainer\|ci>`  | `ci` في CI، و`maintainer` خلاف ذلك                 | الدور المستخدم عند `--credential-source convex`.                                                                                                |

يخرج كل مسار برمز غير صفري عند فشل أي سيناريو. يكتب `--allow-failures` الآثار دون تعيين رمز خروج فاشل.

### ضمان جودة Telegram

```bash
pnpm openclaw qa telegram
```

يستهدف مجموعة Telegram خاصة حقيقية واحدة ببوتين متميزين (السائق + SUT). يجب أن يملك بوت SUT اسم مستخدم في Telegram؛ تعمل المراقبة من بوت إلى بوت بأفضل شكل عندما يكون لدى كلا البوتين **وضع التواصل بين البوتات** مفعّلًا في `@BotFather`.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - معرّف دردشة رقمي (سلسلة).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

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

تغطي المجموعة الافتراضية الضمنية دائمًا الكناري، وبوابة الإشارة، وردود الأوامر الأصلية، وعنونة الأوامر، وردود المجموعة من بوت إلى بوت. تتضمن افتراضيات `mock-openai` أيضًا فحوصًا حتمية لسلسلة الردود وبث الرسالة النهائية. يبقى `telegram-current-session-status-tool` اختياريًا لأنه يكون مستقرًا فقط عند تشغيله مباشرة بعد الكناري، وليس بعد ردود أوامر أصلية عشوائية. استخدم `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` لطباعة التقسيم الحالي بين الافتراضي/الاختياري مع مراجع الانحدار.

آثار الإخراج:

- `telegram-qa-report.md`
- `qa-evidence.json` - إدخالات أدلة لفحوص وسيلة النقل الحية، بما يشمل حقول الملف الشخصي، والتغطية، والمزوّد، والقناة، والآثار، والنتيجة، وRTT.

تستخدم تشغيلات حزمة Telegram عقد بيانات اعتماد Telegram نفسه. قياس RTT
المتكرر جزء من مسار Telegram الحي العادي للحزمة؛ ويُضمَّن توزيع RTT
في `qa-evidence.json` ضمن `result.timing` لفحص RTT المحدد.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

عند تعيين `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`، يستأجر غلاف الحزمة الحي
بيانات اعتماد `kind: "telegram"`، ويصدّر بيئة المجموعة/السائق/بوت SUT
المستأجرة إلى تشغيل الحزمة المثبّتة، ويرسل Heartbeat للإيجار، ويحرره عند
الإيقاف. يعتمد غلاف الحزمة افتراضيًا على 20 فحص RTT لـ
`telegram-mentioned-message-reply`، ومهلة RTT قدرها 30 ثانية، ودور Convex
`maintainer` خارج CI عند تحديد Convex. تجاوز
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES` أو `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
أو `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` لضبط قياس RTT دون
إنشاء أمر RTT منفصل أو تنسيق ملخص خاص بـ Telegram.

### ضمان جودة Discord

```bash
pnpm openclaw qa discord
```

يستهدف قناة Guild خاصة حقيقية واحدة في Discord ببوتين: بوت سائق تتحكم به آلية الاختبار وبوت SUT يبدأه Gateway الطفل لـ OpenClaw عبر Plugin Discord المضمّن. يتحقق من معالجة إشارات القناة، ومن أن بوت SUT قد سجّل الأمر الأصلي `/help` لدى Discord، ومن سيناريوهات أدلة Mantis الاختيارية.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - يجب أن يطابق معرّف مستخدم بوت SUT المُعاد من Discord (وإلا يفشل المسار سريعًا).

اختياري:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` يحتفظ بنصوص الرسائل في آثار الرسائل المرصودة.
- يحدد `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` قناة الصوت/المنصة لـ `discord-voice-autojoin`؛ وبدونه، يختار السيناريو أول قناة صوت/منصة مرئية لبوت SUT.

السيناريوهات (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - سيناريو صوت اختياري. يعمل بمفرده، ويفعّل `channels.discord.voice.autoJoin`، ويتحقق من أن حالة الصوت الحالية لبوت SUT في Discord هي قناة الصوت/المنصة المستهدفة. قد تتضمن بيانات اعتماد Convex Discord قيمة `voiceChannelId` اختيارية؛ وإلا يكتشف المشغّل أول قناة صوت/منصة مرئية في Guild.
- `discord-status-reactions-tool-only` - سيناريو Mantis اختياري. يعمل بمفرده لأنه يبدّل SUT إلى ردود Guild دائمة التشغيل ومقتصرة على الأدوات مع `messages.statusReactions.enabled=true`، ثم يلتقط خطًا زمنيًا للتفاعلات عبر REST وآثارًا مرئية بصيغتي HTML/PNG. كما تحفظ تقارير Mantis قبل/بعد آثار MP4 المقدمة من السيناريو باسم `baseline.mp4` و`candidate.mp4`.

شغّل سيناريو الانضمام التلقائي إلى الصوت في Discord صراحةً:

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
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

آثار الإخراج:

- `discord-qa-report.md`
- `qa-evidence.json` - إدخالات أدلة لفحوص وسيلة النقل الحية.
- `discord-qa-observed-messages.json` - تُنقّح النصوص ما لم يكن `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` و`discord-status-reactions-tool-only-timeline.png` عند تشغيل سيناريو تفاعلات الحالة.

### ضمان جودة Slack

```bash
pnpm openclaw qa slack
```

يستهدف قناة Slack خاصة حقيقية واحدة ببوتين متميزين: بوت سائق تتحكم به آلية الاختبار وبوت SUT يبدأه Gateway الطفل لـ OpenClaw عبر Plugin Slack المضمّن.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختياري:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` يحتفظ بنصوص الرسائل في آثار الرسائل المرصودة.
- يفعّل `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` نقاط تحقق الموافقة المرئية
  لـ Mantis. يكتب المشغّل `<scenario>.pending.json` و
  `<scenario>.resolved.json`، ثم ينتظر ملفات `.ack.json` المطابقة.
- يتجاوز `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` مهلة إقرار
  نقطة التحقق. الافتراضي هو `120000`.

السيناريوهات (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - سيناريو موافقة تنفيذ أصلي اختياري في Slack.
  يطلب موافقة تنفيذ عبر Gateway، ويتحقق من أن رسالة Slack تحتوي على
  أزرار موافقة أصلية، ويحلّها، ويتحقق من تحديث Slack المحلول.
- `slack-approval-plugin-native` - سيناريو موافقة Plugin أصلي اختياري في Slack.
  يفعّل تمرير موافقات التنفيذ وPlugin معًا بحيث لا تُحجب أحداث Plugin
  بسبب توجيه موافقة التنفيذ، ثم يتحقق من مسار واجهة Slack الأصلية نفسه
  للحالة المعلقة/المحلولة.

آثار الإخراج:

- `slack-qa-report.md`
- `qa-evidence.json` - إدخالات أدلة لفحوص وسيلة النقل الحية.
- `slack-qa-observed-messages.json` - تُنقّح النصوص ما لم يكن `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - فقط عندما يعيّن Mantis
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`؛ يحتوي على JSON نقاط التحقق،
  وJSON الإقرار، ولقطات شاشة للحالة المعلقة/المحلولة.

#### إعداد مساحة عمل Slack

يحتاج المسار إلى تطبيقين متميزين في Slack ضمن مساحة عمل واحدة، إضافة إلى قناة يكون كلا البوتين عضوين فيها:

- `channelId` - معرّف `Cxxxxxxxxxx` لقناة تمت دعوة كلا البوتين إليها. استخدم قناة مخصصة؛ ينشر المسار في كل تشغيل.
- `driverBotToken` - رمز بوت (`xoxb-...`) لتطبيق **Driver**.
- `sutBotToken` - رمز بوت (`xoxb-...`) لتطبيق **SUT**، والذي يجب أن يكون تطبيق Slack منفصلًا عن السائق حتى يكون معرّف مستخدم البوت الخاص به متميزًا.
- `sutAppToken` - رمز على مستوى التطبيق (`xapp-...`) لتطبيق SUT مع `connections:write`، يستخدمه Socket Mode حتى يتمكن تطبيق SUT من استقبال الأحداث.

فضّل مساحة عمل Slack مخصصة لضمان الجودة بدلًا من إعادة استخدام مساحة عمل إنتاجية.

يضيق بيان SUT أدناه عمدًا تثبيت الإنتاج لـ Plugin Slack المضمّن (`extensions/slack/src/setup-shared.ts:10`) إلى الأذونات والأحداث التي تغطيها مجموعة ضمان جودة Slack الحية. لإعداد قناة الإنتاج كما يراها المستخدمون، راجع [الإعداد السريع لقناة Slack](/ar/channels/slack#quick-setup)؛ زوج QA Driver/SUT منفصل عمدًا لأن المسار يحتاج إلى معرّفي مستخدم بوت متميزين في مساحة عمل واحدة.

**1. أنشئ تطبيق Driver**

انتقل إلى [api.slack.com/apps](https://api.slack.com/apps) → _إنشاء تطبيق جديد_ → _من manifest_ → اختر مساحة عمل QA، والصق الـ manifest التالي، ثم _التثبيت إلى مساحة العمل_:

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

انسخ _Bot User OAuth Token_ (`xoxb-...`) - ويصبح ذلك `driverBotToken`. يحتاج برنامج التشغيل فقط إلى نشر الرسائل والتعريف بنفسه؛ لا أحداث ولا Socket Mode.

**2. إنشاء تطبيق SUT**

كرر _إنشاء تطبيق جديد → من manifest_ في مساحة العمل نفسها. يستخدم تطبيق QA هذا عمدا نسخة أضيق من manifest الإنتاج الخاص بـ Slack Plugin المضمن (`extensions/slack/src/setup-shared.ts:10`): تم حذف نطاقات وأحداث التفاعل لأن مجموعة اختبارات Slack QA الحية لا تغطي معالجة التفاعلات بعد.

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

بعد أن ينشئ Slack التطبيق، نفذ أمرين في صفحة إعداداته:

- _التثبيت إلى مساحة العمل_ → انسخ _Bot User OAuth Token_ → ويصبح ذلك `sutBotToken`.
- _المعلومات الأساسية → رموز مستوى التطبيق → إنشاء رمز ونطاقات_ → أضف النطاق `connections:write` → احفظ → انسخ قيمة `xapp-...` → ويصبح ذلك `sutAppToken`.

تحقق من أن الروبوتين لهما معرفا مستخدم مختلفان عبر استدعاء `auth.test` على كل رمز. يميز runtime بين برنامج التشغيل وSUT حسب معرف المستخدم؛ ستفشل إعادة استخدام تطبيق واحد لكليهما عند بوابة الإشارة إليه مباشرة.

**3. إنشاء القناة**

في مساحة عمل QA، أنشئ قناة (مثل `#openclaw-qa`) وادع كلا الروبوتين من داخل القناة:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

انسخ معرف `Cxxxxxxxxxx` من _معلومات القناة → حول → معرف القناة_ - ويصبح ذلك `channelId`. تعمل القناة العامة؛ وإذا استخدمت قناة خاصة، فإن كلا التطبيقين يملكان بالفعل `groups:history`، لذلك ستظل قراءات السجل الخاصة بالحزمة تنجح.

**4. تسجيل بيانات الاعتماد**

خياران. استخدم متغيرات البيئة لتصحيح الأخطاء على جهاز واحد (اضبط المتغيرات الأربعة `OPENCLAW_QA_SLACK_*` ومرر `--credential-source env`)، أو ازرع مجمع Convex المشترك بحيث يستطيع CI والمشرفون الآخرون استئجارها.

بالنسبة إلى مجمع Convex، اكتب الحقول الأربعة في ملف JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

مع تصدير `OPENCLAW_QA_CONVEX_SITE_URL` و`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` في shell لديك، سجل وتحقق:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

توقع `count: 1`، و`status: "active"`، بدون حقل `lease`.

**5. التحقق من البداية إلى النهاية**

شغل المسار محليا لتأكيد قدرة كلا الروبوتين على التحدث إلى بعضهما عبر الوسيط:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

يكتمل التشغيل الناجح في أقل بكثير من 30 ثانية، ويعرض `slack-qa-report.md` كلا من `slack-canary` و`slack-mention-gating` بالحالة `pass`. إذا توقف المسار لنحو 90 ثانية وخرج بالرسالة `Convex credential pool exhausted for kind "slack"`، فإما أن المجمع فارغ أو أن كل صف مستأجر - سيخبرك `qa credentials list --kind slack --status all --json` بأي الحالتين.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

يستهدف حسابين مخصصين في WhatsApp Web: حساب برنامج تشغيل تتحكم به
الحزمة، وحساب SUT يبدأه OpenClaw gateway الابن عبر WhatsApp Plugin
المضمن.

البيئة المطلوبة عند استخدام `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

اختياري:

- يمكّن `OPENCLAW_QA_WHATSAPP_GROUP_JID` سيناريوهات المجموعات مثل
  `whatsapp-mention-gating` و`whatsapp-group-allowlist-block`.
- يحافظ `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` على نصوص الرسائل في
  آثار الرسائل المرصودة.

فهرس السيناريوهات (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- الأساس وبوابة المجموعات: `whatsapp-canary`، `whatsapp-pairing-block`،
  `whatsapp-mention-gating`، `whatsapp-top-level-reply-shape`،
  `whatsapp-restart-resume`، `whatsapp-group-allowlist-block`.
- الأوامر الأصلية: `whatsapp-help-command`، `whatsapp-status-command`،
  `whatsapp-commands-command`، `whatsapp-tools-compact-command`،
  `whatsapp-whoami-command`، `whatsapp-context-command`،
  `whatsapp-native-new-command`.
- سلوك الرد والمخرجات النهائية: `whatsapp-tool-only-usage-footer`،
  `whatsapp-reply-to-message`، `whatsapp-group-reply-to-message`،
  `whatsapp-reply-context-isolation`، `whatsapp-reply-delivery-shape`،
  `whatsapp-stream-final-message-accounting`.
- الوسائط الواردة والرسائل المهيكلة: `whatsapp-inbound-image-caption`،
  `whatsapp-audio-preflight`، `whatsapp-inbound-structured-messages`،
  `whatsapp-group-audio-gating`. ترسل هذه أحداث صور وصوت ومستندات ومواقع وجهات اتصال وملصقات WhatsApp حقيقية عبر برنامج التشغيل.
- تغطية Gateway الصادر وإجراءات الرسائل:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`، `whatsapp-outbound-poll`،
  `whatsapp-message-actions`.
- تغطية التحكم في الوصول: `whatsapp-access-control-dm-open`،
  `whatsapp-access-control-dm-disabled`، `whatsapp-access-control-group-open`،
  `whatsapp-access-control-group-disabled`، `whatsapp-group-allowlist-block`.
- الموافقات الأصلية: `whatsapp-approval-exec-deny-native`،
  `whatsapp-approval-exec-native`، `whatsapp-approval-exec-reaction-native`،
  `whatsapp-approval-plugin-native`.
- تفاعلات الحالة: `whatsapp-status-reactions`.

يحتوي الفهرس حاليا على 36 سيناريو. يبقى مسار `live-frontier` الافتراضي
صغيرا عند 10 سيناريوهات لتغطية smoke سريعة. يشغل مسار `mock-openai`
الافتراضي 31 سيناريو حتميا عبر نقل WhatsApp الحقيقي مع محاكاة مخرجات
النموذج فقط. تظل سيناريوهات الموافقة وبعض الفحوص الأثقل/الحاجبة صريحة
حسب معرف السيناريو.

يراقب برنامج تشغيل WhatsApp QA أحداثا حية مهيكلة (`text`، و`media`،
و`location`، و`reaction`، و`poll`) ويمكنه إرسال الوسائط والاستطلاعات
وجهات الاتصال والمواقع والملصقات بنشاط. يستورد QA Lab برنامج التشغيل ذلك عبر
سطح الحزمة `@openclaw/whatsapp/api.js` بدلا من الوصول إلى ملفات runtime
الخاصة بـ WhatsApp. يتم تنقيح محتوى الرسالة افتراضيا. تعمل تغطية
الاستطلاع الصادر وملف الرفع عبر استدعاءات gateway حتمية من نوع `poll` و
`message.action` بدلا من استدعاء الأدوات المعتمد فقط على مطالبة النموذج.

آثار المخرجات:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - إدخالات أدلة لفحوص النقل الحي.
- `whatsapp-qa-observed-messages.json` - النصوص منقحة ما لم يكن `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### مجمع بيانات اعتماد Convex

يمكن لمسارات Telegram وDiscord وSlack وWhatsApp استئجار بيانات اعتماد من مجمع Convex مشترك بدلا من قراءة متغيرات البيئة أعلاه. مرر `--credential-source convex` (أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)؛ يحصل QA Lab على استئجار حصري، ويرسل Heartbeat له طوال مدة التشغيل، ويحرره عند الإيقاف. أنواع المجمع هي `"telegram"`، و`"discord"`، و`"slack"`، و`"whatsapp"`.

أشكال الحمولة التي يتحقق منها الوسيط على `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - يجب أن يكون `groupId` سلسلة معرف دردشة رقمية.
- مستخدم Telegram حقيقي (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - لإثبات Mantis Telegram Desktop فقط. يجب ألا تحصل مسارات QA Lab العامة على هذا النوع.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - يجب أن تكون أرقام الهواتف سلاسل E.164 مميزة.

يمسك سير عمل إثبات Mantis Telegram Desktop باستئجار Convex حصري واحد من نوع
`telegram-user` لكل من برنامج تشغيل TDLib CLI وشاهد Telegram Desktop،
ثم يحرره بعد نشر الإثبات.

عندما يحتاج PR إلى فرق مرئي حتمي، يمكن لـ Mantis استخدام رد نموذج المحاكاة نفسه
على `main` وعلى رأس PR أثناء تغير منسق Telegram أو طبقة التسليم. تم ضبط
إعدادات الالتقاط الافتراضية لتعليقات PR: فئة Crabbox القياسية، وتسجيل سطح مكتب
بمعدل 24fps، وملف GIF للحركة بمعدل 24fps، وعرض معاينة 1920px.
يجب أن تنشر تعليقات قبل/بعد حزمة نظيفة تحتوي فقط على ملفات GIF المقصودة.

يمكن لمسارات Slack استخدام المجمع أيضا. تعيش فحوص شكل حمولة Slack حاليا في مشغل Slack QA بدلا من الوسيط؛ استخدم `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`، مع معرف قناة Slack مثل `Cxxxxxxxxxx`. راجع [إعداد مساحة عمل Slack](#setting-up-the-slack-workspace) لتوفير التطبيقات والنطاقات.

تعيش متغيرات البيئة التشغيلية وعقدة نهاية وسيط Convex في [الاختبار → بيانات اعتماد Telegram المشتركة عبر Convex](/ar/help/testing#shared-telegram-credentials-via-convex-v1) (اسم القسم يسبق المجمع متعدد القنوات؛ دلالات الاستئجار مشتركة بين الأنواع).

## بذور مدعومة من المستودع

تعيش أصول البذور في `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

هذه موجودة عمدا في git بحيث تكون خطة QA مرئية لكل من البشر
والوكيل.

يجب أن يبقى `qa-lab` مشغل سيناريوهات YAML عاما. كل ملف سيناريو YAML هو
مصدر الحقيقة لتشغيل اختبار واحد ويجب أن يعرف:

- `title` على المستوى الأعلى
- بيانات `scenario` الوصفية
- بيانات وصفية اختيارية للفئة والقدرة والمسار والمخاطر في `scenario`
- مراجع التوثيق والكود في `scenario`
- متطلبات Plugin اختيارية في `scenario`
- تصحيح إعداد gateway اختياري في `scenario`
- `flow` قابل للتنفيذ على المستوى الأعلى لسيناريوهات التدفق، أو `scenario.execution.kind` /
  `scenario.execution.path` لسيناريوهات Vitest وPlaywright

يُسمح لسطح التشغيل القابل لإعادة الاستخدام الذي يدعم `flow` بأن يبقى عامًا
وعابرًا للاهتمامات. على سبيل المثال، يمكن لسيناريوهات YAML أن تجمع بين
مساعدات جهة النقل ومساعدات جهة المتصفح التي تقود Control UI المضمّنة عبر نقطة
تماس Gateway `browser.request` من دون إضافة مشغّل خاص بحالة معينة.

ينبغي تجميع ملفات السيناريوهات حسب قدرة المنتج بدلًا من مجلد شجرة المصدر.
حافظ على ثبات معرّفات السيناريوهات عند نقل الملفات؛ واستخدم `docsRefs` و`codeRefs`
لتتبع التنفيذ.

ينبغي أن تبقى قائمة الأساس واسعة بما يكفي لتغطية:

- محادثات الرسائل المباشرة والقنوات
- سلوك السلاسل
- دورة حياة إجراءات الرسائل
- استدعاءات cron الراجعة
- استرجاع الذاكرة
- تبديل النموذج
- تسليم العمل إلى الوكيل الفرعي
- قراءة المستودع وقراءة الوثائق
- مهمة بناء صغيرة واحدة مثل Lobster Invaders

## مسارات محاكاة المزوّد

يحتوي `qa suite` على مسارين محليين لمحاكاة المزوّد:

- `mock-openai` هو محاكي OpenClaw الواعي بالسيناريوهات. ويبقى مسار المحاكاة
  الحتمية الافتراضي لضمانات QA المدعومة بالمستودع وضمانات التكافؤ.
- يبدأ `aimock` خادم مزوّد مدعومًا بـ AIMock لتغطية تجريبية للبروتوكول،
  والملحقات الاختبارية، والتسجيل/إعادة التشغيل، والفوضى. وهو إضافة ولا يستبدل
  موزّع سيناريوهات `mock-openai`.

يوجد تنفيذ مسارات المزوّد تحت `extensions/qa-lab/src/providers/`.
يمتلك كل مزوّد قيمه الافتراضية، وتشغيل الخادم المحلي، وإعداد نموذج Gateway،
واحتياجات تجهيز ملف تعريف المصادقة، وأعلام قدرات البث المباشر/المحاكاة. ينبغي
لشيفرة المجموعة المشتركة وGateway أن تمر عبر سجل المزوّدين بدلًا من التفريع حسب
أسماء المزوّدين.

## محولات النقل

يمتلك `qa-lab` نقطة تماس نقل عامة لسيناريوهات QA المكتوبة بـ YAML. ويُعد
`qa-channel` الافتراضي الاصطناعي. يبدأ `crabline` خوادم محلية بشكل المزوّد
ويشغّل Plugins القنوات العادية في OpenClaw عليها. أما `live` فمحجوز لبيانات
اعتماد المزوّدين الحقيقية والقنوات الخارجية.

على مستوى البنية، يكون التقسيم كما يلي:

- يمتلك `qa-lab` تنفيذ السيناريوهات العام، وتزامن العاملين، وكتابة الأدلة، وإعداد التقارير.
- يمتلك محول النقل إعداد Gateway، والجاهزية، وملاحظة الوارد والصادر، وإجراءات النقل، وحالة النقل المطبّعة.
- تحدد ملفات سيناريوهات YAML تحت `qa/scenarios/` تشغيل الاختبار؛ ويوفر `qa-lab` سطح التشغيل القابل لإعادة الاستخدام الذي ينفذها.

### إضافة قناة

تتطلب إضافة قناة إلى نظام QA المعتمد على YAML تنفيذ القناة بالإضافة إلى
حزمة سيناريوهات تختبر عقد القناة. ولتغطية CI السريعة، أضف خادم مزوّد Crabline
الوهمي المطابق واعرضه عبر مشغل `crabline`.

لا تضف جذر أمر QA جديدًا على المستوى الأعلى عندما يستطيع مضيف `qa-lab` المشترك امتلاك التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء المجموعة وإنهاؤها
- تزامن العاملين
- كتابة الأدلة
- إنشاء التقارير
- تنفيذ السيناريوهات
- أسماء توافق بديلة لسيناريوهات `qa-channel` الأقدم

تمتلك Plugins المشغّلات عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت جذر `qa` المشترك
- كيفية إعداد Gateway لهذا النقل
- كيفية فحص الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية ملاحظة الرسائل الصادرة
- كيفية عرض النصوص وحالة النقل المطبّعة
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة الضبط أو التنظيف الخاص بالنقل

الحد الأدنى لاعتماد قناة جديدة:

1. أبقِ `qa-lab` مالكًا لجذر `qa` المشترك.
2. نفّذ مشغّل النقل على نقطة تماس مضيف `qa-lab` المشتركة.
3. أبقِ الآليات الخاصة بالنقل داخل Plugin المشغّل أو حزمة اختبار القناة.
4. ركّب المشغّل بصيغة `openclaw qa <runner>` بدلًا من تسجيل أمر جذري منافس. ينبغي لـ Plugins المشغّلات أن تصرّح عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`. أبقِ `runtime-api.ts` خفيفًا؛ وينبغي أن يبقى تحميل CLI البطيء وتنفيذ المشغّل خلف نقاط دخول منفصلة.
5. ألّف أو عدّل سيناريوهات YAML تحت أدلة `qa/scenarios/` ذات السمات.
6. استخدم مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. أبقِ أسماء التوافق البديلة الحالية عاملة ما لم يكن المستودع ينفذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا كان يمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحد، فأبقِه في Plugin ذلك المشغّل أو حزمة اختبار Plugin.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن لأكثر من قناة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة في `suite.ts`.
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

تبقى أسماء التوافق البديلة متاحة للسيناريوهات الحالية - `waitForQaChannelReady` و`waitForOutboundMessage` و`waitForNoOutbound` و`formatConversationTranscript` و`resetBus` - لكن ينبغي لتأليف السيناريوهات الجديدة استخدام الأسماء العامة. توجد هذه الأسماء البديلة لتجنب ترحيل دفعة واحدة، لا لتكون النموذج المتبع مستقبلًا.

## إعداد التقارير

يصدّر `qa-lab` تقرير بروتوكول بصيغة Markdown من الخط الزمني المرصود لناقل الأحداث.
ينبغي أن يجيب التقرير عن:

- ما الذي نجح
- ما الذي فشل
- ما الذي بقي محظورًا
- ما سيناريوهات المتابعة الجديرة بالإضافة

لجرد السيناريوهات المتاحة - وهو مفيد عند تقدير حجم عمل المتابعة أو توصيل نقل جديد - شغّل `pnpm openclaw qa coverage` (أضف `--json` لإخراج قابل للقراءة آليًا).
عند اختيار إثبات مركّز لسلوك أو مسار ملف تم لمسه، شغّل `pnpm openclaw qa coverage --match <query>`.
يبحث تقرير المطابقة في بيانات السيناريو الوصفية، ومراجع الوثائق، ومراجع الشيفرة، ومعرّفات التغطية، وPlugins، ومتطلبات المزوّدين، ثم يطبع أهداف `qa suite --scenario ...` المطابقة.
يكتب كل تشغيل لـ `qa suite` أدلة `qa-evidence.json` و`qa-suite-summary.json`
و`qa-suite-report.md` على المستوى الأعلى لمجموعة السيناريوهات المحددة.
السيناريوهات التي تصرّح عن `execution.kind: vitest` أو
`execution.kind: playwright` تشغّل مسار الاختبار المطابق وتكتب أيضًا
سجلات لكل سيناريو. السيناريوهات التي تصرّح عن `execution.kind: script` تشغّل
منتج الأدلة عند `execution.path` عبر `node --import tsx` (مع توسيع
`${outputDir}` و`${scenarioId}` في `execution.args`)؛ يكتب المنتج ملف
`qa-evidence.json` الخاص به، وتُستورد إدخالاته إلى مخرجات المجموعة وتُحل
مسارات أدلته نسبةً إلى ملف `qa-evidence.json` لذلك المنتج. عند الوصول إلى
`qa suite` عبر `qa run --qa-profile`، يتضمن ملف `qa-evidence.json` نفسه أيضًا
ملخص بطاقة درجات الملف التعريفي لفئات التصنيف المحددة.
عامله كأداة اكتشاف، لا كبديل عن البوابة؛ فلا يزال السيناريو المحدد يحتاج إلى وضع المزوّد الصحيح، أو النقل الحي، أو Multipass، أو Testbox، أو مسار الإصدار المناسب للسلوك قيد الاختبار.
لسياق بطاقة الدرجات، راجع [بطاقة درجات النضج](/ar/maturity/scorecard).

لفحوص الشخصية والأسلوب، شغّل السيناريو نفسه عبر عدة مراجع نماذج حية
واكتب تقريرًا محكّمًا بصيغة Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

يشغّل الأمر عمليات فرعية محلية لـ QA gateway، وليس Docker. ينبغي لسيناريوهات
تقييم الشخصية ضبط الشخصية عبر `SOUL.md`، ثم تشغيل أدوار مستخدم عادية مثل
المحادثة، والمساعدة في مساحة العمل، ومهام الملفات الصغيرة. ينبغي عدم إخبار
النموذج المرشح بأنه يخضع للتقييم. يحافظ الأمر على كل نص كامل، ويسجل إحصاءات
تشغيل أساسية، ثم يطلب من نماذج التحكيم في الوضع السريع مع استدلال `xhigh`
حيثما كان مدعومًا ترتيب التشغيلات حسب الطبيعية، والإحساس العام، والفكاهة.
استخدم `--blind-judge-models` عند مقارنة المزوّدين: لا تزال مطالبة التحكيم تحصل
على كل نص وحالة تشغيل، لكن تُستبدل مراجع المرشحين بتسميات محايدة مثل
`candidate-01`؛ ويربط التقرير الترتيبات بالمراجع الحقيقية بعد التحليل.
تستخدم تشغيلات المرشحين افتراضيًا تفكير `high`، مع `medium` لـ GPT-5.5 و`xhigh`
لمراجع تقييم OpenAI الأقدم التي تدعمه. تجاوز مرشحًا محددًا ضمنيًا باستخدام
`--model provider/model,thinking=<level>`. لا يزال `--thinking <level>` يضبط
قيمة احتياطية عامة، ويُحتفظ بالصيغة الأقدم `--model-thinking <provider/model=level>`
للتوافق.
تستخدم مراجع مرشحي OpenAI الوضع السريع افتراضيًا بحيث تُستخدم المعالجة ذات
الأولوية حيث يدعمها المزوّد. أضف `,fast` أو `,no-fast` أو `,fast=false` ضمنيًا
عندما يحتاج مرشح أو محكّم واحد إلى تجاوز. مرّر `--fast` فقط عندما تريد فرض
الوضع السريع على كل نموذج مرشح. تُسجّل مدد المرشحين والمحكّمين في التقرير
لتحليل المعايير، لكن مطالبات التحكيم تقول صراحةً ألا يكون الترتيب حسب السرعة.
تستخدم تشغيلات نماذج المرشحين والمحكّمين كلاهما تزامنًا افتراضيًا قدره 16.
اخفض `--concurrency` أو `--judge-concurrency` عندما تجعل حدود المزوّد أو ضغط
Gateway المحلي التشغيل كثير الضجيج.
عند عدم تمرير أي مرشح عبر `--model`، يكون تقييم الشخصية افتراضيًا على
`openai/gpt-5.5` و`openai/gpt-5.2` و`openai/gpt-5` و`anthropic/claude-opus-4-8`
و`anthropic/claude-sonnet-4-6` و`zai/glm-5.1`
و`moonshot/kimi-k2.5` و
`google/gemini-3.1-pro-preview` عند عدم تمرير أي `--model`.
عند عدم تمرير `--judge-model`، تكون نماذج التحكيم الافتراضية هي
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-8,thinking=high`.

## وثائق ذات صلة

- [Matrix QA](/ar/concepts/qa-matrix)
- [بطاقة درجات النضج](/ar/maturity/scorecard)
- [حزمة معايير الوكيل الشخصي](/ar/concepts/personal-agent-benchmark-pack)
- [قناة QA](/ar/channels/qa-channel)
- [الاختبار](/ar/help/testing)
- [لوحة المعلومات](/ar/web/dashboard)
