---
read_when:
    - فهم كيفية ترابط مكدس ضمان الجودة معًا
    - توسيع qa-lab أو qa-channel أو محوِّل نقل
    - إضافة سيناريوهات ضمان الجودة المدعومة بالمستودع
    - بناء أتمتة QA أعلى واقعية حول لوحة معلومات Gateway
summary: 'نظرة عامة على حزمة ضمان الجودة: qa-lab، وqa-channel، والسيناريوهات المدعومة بالمستودع، ومسارات النقل الحية، ومحولات النقل، وإعداد التقارير.'
title: نظرة عامة على ضمان الجودة
x-i18n:
    generated_at: "2026-07-01T08:04:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

تهدف حزمة QA الخاصة إلى اختبار OpenClaw بطريقة أكثر واقعية
ومشكّلة حسب القنوات مما يمكن لاختبار وحدة واحد أن يفعله.

الأجزاء الحالية:

- `extensions/qa-channel`: قناة رسائل اصطناعية تتضمن أسطح الرسائل الخاصة، والقنوات، والسلاسل،
  والتفاعلات، والتعديل، والحذف.
- `extensions/qa-lab`: واجهة مصحح أخطاء وناقل QA لمراقبة النص المنسوخ،
  وحقن الرسائل الواردة، وتصدير تقرير Markdown.
- `extensions/qa-matrix`، وPlugins تشغيل مستقبلية: محولات نقل حية
  تشغّل قناة حقيقية داخل QA gateway فرعي.
- `qa/`: أصول تأسيسية مدعومة من المستودع لمهمة البدء وسيناريوهات QA
  الأساسية.
- [Mantis](/ar/concepts/mantis): تحقق حي قبل وبعد للأخطاء التي
  تحتاج إلى وسائل نقل حقيقية، ولقطات شاشة للمتصفح، وحالة VM، وأدلة PR.

## سطح الأوامر

يعمل كل تدفق QA تحت `pnpm openclaw qa <subcommand>`. لدى الكثير منها أسماء مستعارة
للسكربتات بصيغة `pnpm qa:*`؛ كلا الشكلين مدعومان.

| الأمر                                                | الغرض                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | فحص QA ذاتي مضمّن بدون `--qa-profile`؛ مشغّل ملف نضج مدعوم بالتصنيف باستخدام `--qa-profile smoke-ci`، أو `--qa-profile release`، أو `--qa-profile all`.                                                                                                                   |
| `qa suite`                                          | تشغيل السيناريوهات المدعومة من المستودع على مسار QA gateway. الأسماء المستعارة: `pnpm openclaw qa suite --runner multipass` لاستخدام Linux VM مؤقت.                                                                                                                       |
| `qa coverage`                                       | طباعة مخزون تغطية سيناريوهات YAML (`--json` للمخرجات الآلية).                                                                                                                                                                                                            |
| `qa parity-report`                                  | مقارنة ملفي `qa-suite-summary.json` وكتابة تقرير التكافؤ الوكيلي، أو استخدام `--runtime-axis --token-efficiency` لكتابة تقارير تكافؤ وقت تشغيل Codex مقابل OpenClaw وكفاءة الرموز من ملخص زوج وقت تشغيل واحد.                                                               |
| `qa character-eval`                                 | تشغيل سيناريو QA الخاص بالشخصية عبر عدة نماذج حية مع تقرير محكّم. راجع [إعداد التقارير](#reporting).                                                                                                                                                                    |
| `qa manual`                                         | تشغيل مطالبة لمرة واحدة على مسار المزوّد/النموذج المحدد.                                                                                                                                                                                                                 |
| `qa ui`                                             | بدء واجهة مصحح QA وناقل QA المحلي (الاسم المستعار: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | بناء صورة QA Docker المجهزة مسبقًا.                                                                                                                                                                                                                                      |
| `qa docker-scaffold`                                | كتابة هيكل docker-compose للوحة معلومات QA + مسار Gateway.                                                                                                                                                                                                               |
| `qa up`                                             | بناء موقع QA، وبدء الحزمة المدعومة بـ Docker، وطباعة عنوان URL (الاسم المستعار: `pnpm qa:lab:up`؛ يضيف متغير `:fast` الخيار `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                       |
| `qa aimock`                                         | بدء خادم مزوّد AIMock فقط.                                                                                                                                                                                                                                               |
| `qa mock-openai`                                    | بدء خادم مزوّد `mock-openai` الواعي بالسيناريوهات فقط.                                                                                                                                                                                                                   |
| `qa credentials doctor` / `add` / `list` / `remove` | إدارة مجموعة بيانات اعتماد Convex المشتركة.                                                                                                                                                                                                                             |
| `qa matrix`                                         | مسار نقل حي ضد خادم Tuwunel homeserver مؤقت. راجع [Matrix QA](/ar/concepts/qa-matrix).                                                                                                                                                                                      |
| `qa telegram`                                       | مسار نقل حي ضد مجموعة Telegram خاصة حقيقية.                                                                                                                                                                                                                              |
| `qa discord`                                        | مسار نقل حي ضد قناة خادم Discord خاصة حقيقية.                                                                                                                                                                                                                            |
| `qa slack`                                          | مسار نقل حي ضد قناة Slack خاصة حقيقية.                                                                                                                                                                                                                                   |
| `qa whatsapp`                                       | مسار نقل حي ضد حسابات WhatsApp Web حقيقية.                                                                                                                                                                                                                               |
| `qa mantis`                                         | مشغّل تحقق قبل وبعد لأخطاء النقل الحي، مع أدلة تفاعلات حالة Discord، واختبار Crabbox لسطح المكتب/المتصفح، واختبار Slack داخل VNC. راجع [Mantis](/ar/concepts/mantis) و[دليل تشغيل Mantis Slack Desktop](/ar/concepts/mantis-slack-desktop-runbook). |

يقرأ `qa run` المدعوم بملف تعريف العضوية من `taxonomy.yaml`، ثم يرسل
السيناريوهات المحلولة عبر `qa suite`. يقوم `--surface` و
`--category` بتصفية ملف التعريف المحدد بدلًا من تعريف مسارات منفصلة.
يتضمن ملف `qa-evidence.json` الناتج ملخص بطاقة تقييم ملف التعريف مع
أعداد الفئات المحددة ومعرفات التغطية المفقودة؛ وتظل إدخالات الأدلة
الفردية مصدر الحقيقة للاختبارات، وأدوار التغطية، والنتائج.
معرفات تغطية ميزات التصنيف هي أهداف إثبات دقيقة، وليست أسماء مستعارة. تحقق
تغطية السيناريو الأساسية المعرفات المطابقة؛ وتبقى التغطية الثانوية إرشادية.
تستخدم معرفات التغطية صيغة `namespace.behavior` المنقطة مع مقاطع
أبجدية رقمية/شرطات صغيرة؛ وقد تستمر معرفات ملف التعريف والسطح والفئة في استخدام
معرفات التصنيف الحالية ذات الشرطات أو النقاط.
تحذف الأدلة المختصرة `execution` لكل إدخال وتعيّن `evidenceMode: "slim"`؛
ويستخدم `smoke-ci` الوضع المختصر افتراضيًا، بينما يعيد `--evidence-mode full` الإدخالات الكاملة:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

استخدم `smoke-ci` لإثبات ملف تعريف حتمي مع مزودي نماذج وهميين وخوادم
مزود Crabline محلية. استخدم `release` لإثبات Stable/LTS ضد قنوات حية.
استخدم `all` فقط لتشغيلات أدلة التصنيف الكامل الصريحة؛ فهو يحدد
كل فئة نضج نشطة ويمكن إرساله عبر سير عمل `QA Profile
Evidence` باستخدام `qa_profile=all`. عندما يحتاج أمر أيضًا إلى ملف تعريف جذر OpenClaw،
ضع ملف تعريف الجذر قبل أمر QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## تدفق المشغّل

تدفق مشغّل QA الحالي هو موقع QA بلوحتين:

- اليسار: لوحة معلومات Gateway (Control UI) مع الوكيل.
- اليمين: QA Lab، يعرض النص المنسوخ الشبيه بـ Slack وخطة السيناريو.

شغّله باستخدام:

```bash
pnpm qa:lab:up
```

يبني ذلك موقع QA، ويبدأ مسار Gateway المدعوم بـ Docker، ويعرض
صفحة QA Lab حيث يمكن للمشغّل أو حلقة الأتمتة إعطاء الوكيل مهمة QA،
ومراقبة سلوك القناة الحقيقي، وتسجيل ما نجح أو فشل أو بقي محجوبًا.

لتكرار أسرع على واجهة QA Lab دون إعادة بناء صورة Docker في كل مرة،
ابدأ الحزمة بحزمة QA Lab مركبة بالربط:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

يبقي `qa:lab:up:fast` خدمات Docker على صورة مجهزة مسبقًا ويركب بالربط
`extensions/qa-lab/web/dist` داخل حاوية `qa-lab`. يعيد `qa:lab:watch`
بناء تلك الحزمة عند التغيير، ويعيد المتصفح التحميل تلقائيًا عندما يتغير
هاش أصول QA Lab.

لاختبار إشارة OpenTelemetry محلي، شغّل:

```bash
pnpm qa:otel:smoke
```

يبدأ ذلك السكربت مستقبِل OTLP/HTTP محليًا، ويشغّل سيناريو QA
`otel-trace-smoke` مع تمكين Plugin `diagnostics-otel`، ثم يتحقق من أن المسارات،
والمقاييس، والسجلات قد صُدّرت. يفك ترميز مقاطع تتبع protobuf المصدّرة
ويتحقق من الشكل الحرج للإصدار:
يجب أن تكون `openclaw.run`، و`openclaw.harness.run`، ومقطع استدعاء نموذج
وفق أحدث اصطلاح دلالي GenAI، و`openclaw.context.assembled`، و`openclaw.message.delivery`
موجودة. يفرض الاختبار
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`، لذلك يجب أن يستخدم مقطع استدعاء النموذج
اسم `{gen_ai.operation.name} {gen_ai.request.model}`؛
يجب ألا تصدّر استدعاءات النموذج `StreamAbandoned` في الدورات الناجحة؛ ويجب أن تبقى معرفات التشخيص الخام
وسمات `openclaw.content.*` خارج التتبع. يجب ألا تحتوي حمولات OTLP الخام
على حارس المطالبة، أو حارس الاستجابة، أو مفتاح جلسة QA.
يكتب `otel-smoke-summary.json` بجانب آثار حزمة QA.

لاختبار OpenTelemetry مدعوم بالمجمّع، شغّل:

```bash
pnpm qa:otel:collector-smoke
```

يضع ذلك المسار حاوية Docker حقيقية لـ OpenTelemetry Collector أمام
المستقبِل المحلي نفسه. استخدمه عند تغيير توصيل نقاط النهاية، أو توافق المجمّع،
أو سلوك تصدير OTLP الذي قد يخفيه المستقبِل داخل العملية.

لاختبار كشط Prometheus المحمي، شغّل:

```bash
pnpm qa:prometheus:smoke
```

يشغّل ذلك الاسم المستعار سيناريو QA ‏`docker-prometheus-smoke` مع تمكين
`diagnostics-prometheus`، ويتحقق من رفض عمليات الكشط غير المصادق عليها،
ثم يتحقق من أن الكشط المصادق عليه يتضمن عائلات المقاييس الحرجة للإصدار
من دون محتوى المطالبات، أو محتوى الاستجابات، أو معرّفات التشخيص الخام، أو رموز
المصادقة، أو المسارات المحلية.

لتشغيل اختباري الدخان الخاصين بقابلية الملاحظة بالتتابع، استخدم:

```bash
pnpm qa:observability:smoke
```

لمسار OpenTelemetry المدعوم بالمجمّع مع اختبار دخان كشط Prometheus المحمي،
استخدم:

```bash
pnpm qa:observability:collector-smoke
```

يبقى QA لقابلية الملاحظة محصورًا في نسخة مصدرية مستخرجة. تتعمد حزمة tarball
الخاصة بـ npm حذف QA Lab، لذلك لا تشغّل مسارات إصدار Docker للحزمة أوامر `qa`.
استخدم `pnpm qa:otel:smoke` أو `pnpm qa:prometheus:smoke` أو
`pnpm qa:observability:smoke` من نسخة مصدرية مبنية عند تغيير أدوات
التشخيص.

لمسار دخان Matrix يستخدم نقلًا حقيقيًا ولا يتطلب بيانات اعتماد موفّر النماذج،
شغّل ملف التعريف السريع مع موفّر OpenAI الوهمي الحتمي:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

لمسار موفّر الواجهة الحية، قدّم بيانات اعتماد متوافقة مع OpenAI صراحةً:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

يعيش مرجع CLI الكامل، وفهرس ملفات التعريف/السيناريوهات، ومتغيرات البيئة، وتخطيط المصنوعات لهذا المسار في [QA لـ Matrix](/ar/concepts/qa-matrix). باختصار: يوفّر خادم Tuwunel منزليًا مؤقتًا في Docker، ويسجّل مستخدمي برنامج تشغيل/SUT/مراقب مؤقتين، ويشغّل Plugin الحقيقي لـ Matrix داخل Gateway فرعي مخصص لذلك النقل (من دون `qa-channel`)، ثم يكتب تقرير Markdown وملخص JSON ومصنوع أحداث مرصودة وسجل خرج مدمج تحت `.artifacts/qa-e2e/matrix-<timestamp>/`.

تغطي السيناريوهات سلوك النقل الذي لا تستطيع اختبارات الوحدة إثباته من البداية إلى النهاية: بوابة الإشارات، وسياسات السماح للبوتات، وقوائم السماح، والردود في المستوى الأعلى والردود المتفرعة، وتوجيه الرسائل المباشرة، ومعالجة التفاعلات، وكبت التعديلات الواردة، وإزالة تكرار إعادة التشغيل عند الاستئناف، والتعافي من انقطاع الخادم المنزلي، وتسليم بيانات تعريف الموافقة، ومعالجة الوسائط، وتدفقات تمهيد/استرداد/تحقق E2EE في Matrix. كما يقود ملف تعريف CLI الخاص بـ E2EE أوامر `openclaw matrix encryption setup` والتحقق عبر الخادم المنزلي المؤقت نفسه قبل فحص ردود Gateway.

لدى Discord أيضًا سيناريوهات اختيارية خاصة بـ Mantis لإعادة إنتاج الأخطاء. استخدم
`--scenario discord-status-reactions-tool-only` للمخطط الزمني الصريح لتفاعل الحالة،
أو `--scenario discord-thread-reply-filepath-attachment` لإنشاء سلسلة Discord
حقيقية والتحقق من أن `message.thread-reply` يحافظ على مرفق
`filePath`. تبقى هذه السيناريوهات خارج مسار Discord الحي الافتراضي
لأنها مجسات إعادة إنتاج قبل/بعد وليست تغطية دخان واسعة.
يمكن لسير عمل مرفق السلسلة في Mantis أيضًا إضافة فيديو شاهد Discord Web
مسجّل الدخول عند تكوين `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` أو
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` في بيئة QA.
ملف تعريف العارض هذا مخصص للالتقاط المرئي فقط؛ ما زال قرار النجاح/الفشل
يأتي من عرّاف Discord REST.

يستخدم CI سطح الأوامر نفسه في `.github/workflows/qa-live-transports-convex.yml`.
تشغّل عمليات التشغيل المجدولة واليدوية الافتراضية ملف تعريف Matrix السريع مع
بيانات اعتماد live-frontier المقدمة من QA، و`--fast`، و
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. يؤدي التشغيل اليدوي `matrix_profile=all`
إلى التفرع إلى خمس شظايا لملفات التعريف.

لمسارات دخان Telegram وDiscord وSlack وWhatsApp ذات النقل الحقيقي:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

تستهدف قناة حقيقية موجودة مسبقًا مع بوتين أو حسابين (برنامج التشغيل + SUT). متغيرات البيئة المطلوبة، وقوائم السيناريوهات، ومصنوعات الخرج، ومجموعة بيانات اعتماد Convex موثقة في [مرجع QA لـ Telegram وDiscord وSlack وWhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) أدناه.

لتشغيل VM سطح مكتب Slack كامل مع إنقاذ VNC، شغّل:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر ذلك الأمر جهاز سطح مكتب/متصفح من Crabbox، ويشغّل مسار Slack الحي
داخل VM، ويفتح Slack Web في متصفح VNC، ويلتقط سطح المكتب، وينسخ
`slack-qa/` و`slack-desktop-smoke.png` و`slack-desktop-smoke.mp4`
عندما يكون التقاط الفيديو متاحًا إلى دليل مصنوعات Mantis. توفر إيجارات
سطح المكتب/المتصفح من Crabbox أدوات الالتقاط وحزم مساعد المتصفح/البناء الأصلي
مسبقًا، لذلك ينبغي للسيناريو تثبيت البدائل فقط على الإيجارات الأقدم.
يبلّغ Mantis عن التوقيتات الإجمالية وتوقيتات كل مرحلة في
`mantis-slack-desktop-smoke-report.md` حتى توضّح عمليات التشغيل البطيئة ما إذا كان الوقت
ذهب إلى إحماء الإيجار، أو الحصول على بيانات الاعتماد، أو الإعداد البعيد، أو نسخ المصنوعات.
أعد استخدام `--lease-id <cbx_...>` بعد تسجيل الدخول إلى Slack Web يدويًا عبر VNC؛
تحافظ الإيجارات المعاد استخدامها أيضًا على سخونة ذاكرة تخزين pnpm في Crabbox. يتحقق الوضع الافتراضي
`--hydrate-mode source` من نسخة مصدرية مستخرجة ويشغّل التثبيت/البناء
داخل VM. استخدم `--hydrate-mode prehydrated` فقط عندما تحتوي مساحة العمل البعيدة المعاد استخدامها
بالفعل على `node_modules` و`dist/` مبني؛ يتخطى ذلك الوضع خطوة
التثبيت/البناء المكلفة ويفشل مغلقًا عندما لا تكون مساحة العمل جاهزة.
مع `--gateway-setup`، يترك Mantis ‏Gateway دائمًا لـ OpenClaw Slack
قيد التشغيل داخل VM على المنفذ `38973`؛ وبدونه، يشغّل الأمر مسار QA الطبيعي
من بوت إلى بوت في Slack ويخرج بعد التقاط المصنوعات.

لإثبات واجهة موافقة Slack الأصلية مع دليل سطح مكتب، شغّل وضع نقاط تحقق الموافقة
في Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

هذا الوضع متنافر مع `--gateway-setup`. يشغّل سيناريوهات موافقة Slack،
ويرفض معرّفات السيناريوهات غير الخاصة بالموافقة، وينتظر عند كل حالة موافقة معلّقة
ومحلولة، ويعرض رسالة Slack API المرصودة إلى
`approval-checkpoints/<scenario>-pending.png` و
`approval-checkpoints/<scenario>-resolved.png`، ثم يفشل إذا كانت أي نقطة تحقق،
أو دليل رسالة، أو إقرار، أو لقطة شاشة معروضة مفقودة أو فارغة.
قد تظل إيجارات CI الباردة تعرض تسجيل الدخول إلى Slack في `slack-desktop-smoke.png`؛
صور نقاط تحقق الموافقة هي الدليل المرئي لهذا المسار.

تعيش قائمة تحقق المشغّل، وأمر إطلاق سير عمل GitHub، وعقد تعليق الأدلة،
وجدول قرار وضع الإرواء، وتفسير التوقيت، وخطوات معالجة الفشل في [دليل تشغيل Mantis لسطح مكتب Slack](/ar/concepts/mantis-slack-desktop-runbook).

لمهمة سطح مكتب بأسلوب وكيل/CV، شغّل:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

يستأجر `visual-task` أو يعيد استخدام جهاز سطح مكتب/متصفح من Crabbox، ويبدأ
`crabbox record --while`، ويقود المتصفح المرئي عبر
`visual-driver` متداخل، ويلتقط `visual-task.png`، ويشغّل `openclaw infer image describe`
على لقطة الشاشة عند تحديد `--vision-mode image-describe`، ويكتب
`visual-task.mp4` و`mantis-visual-task-summary.json` و
`mantis-visual-task-driver-result.json` و`mantis-visual-task-report.md`.
عند ضبط `--expect-text`، تطلب مطالبة الرؤية حكم JSON منظمًا
ولا تنجح إلا عندما يبلّغ النموذج عن دليل مرئي إيجابي؛ تفشل الاستجابة السلبية
التي تقتبس النص المستهدف فقط في التأكيد.
استخدم `--vision-mode metadata` لدخان بلا نموذج يثبت وصلات سطح المكتب
والمتصفح ولقطة الشاشة والفيديو من دون استدعاء موفّر فهم صور.
التسجيل مصنوع مطلوب لـ `visual-task`؛ إذا لم يسجّل Crabbox ملف
`visual-task.mp4` غير فارغ، تفشل المهمة حتى إذا نجح برنامج التشغيل المرئي.
عند الفشل، يحتفظ Mantis بالإيجار لـ VNC ما لم تكن المهمة قد نجحت بالفعل
ولم يتم ضبط `--keep-lease`.

قبل استخدام بيانات اعتماد حية مجمّعة، شغّل:

```bash
pnpm openclaw qa credentials doctor
```

يفحص doctor بيئة وسيط Convex، ويتحقق من إعدادات نقطة النهاية، ويتحقق من إمكانية الوصول إلى admin/list عند وجود سر المشرف. لا يبلّغ إلا عن حالة الضبط/الفقدان للأسرار.

## تغطية النقل الحي

تشترك مسارات النقل الحي في عقد واحد بدل أن يخترع كل منها شكل قائمة سيناريوهات خاصًا به. `qa-channel` هي حزمة سلوك المنتج الاصطناعية الواسعة وليست جزءًا من مصفوفة تغطية النقل الحي.

ينبغي لمشغلات النقل الحي استيراد معرّفات السيناريوهات المشتركة، ومساعدات
تغطية الأساس، ومساعد اختيار السيناريو من
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| المسار | الكناري | بوابة الإشارات | بوت إلى بوت | حظر قائمة السماح | رد في المستوى الأعلى | رد مقتبس | استئناف إعادة التشغيل | متابعة السلسلة | عزل السلسلة | مراقبة التفاعلات | أمر المساعدة | تسجيل أمر أصلي |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

يحافظ هذا على `qa-channel` كحزمة سلوك المنتج الواسعة، بينما تشترك Matrix
وTelegram ووسائل النقل الحية الأخرى في قائمة تحقق صريحة لعقد النقل.

لمسار VM Linux مؤقت من دون إدخال Docker في مسار QA، شغّل:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

يشغّل هذا ضيف Multipass جديدًا، ويثبّت الاعتماديات، ويبني OpenClaw
داخل الضيف، ويشغّل `qa suite`، ثم ينسخ تقرير QA الطبيعي والملخص
إلى `.artifacts/qa-e2e/...` على المضيف.
يعيد استخدام سلوك اختيار السيناريو نفسه الذي يستخدمه `qa suite` على المضيف.
تنفّذ عمليات تشغيل الحزمة على المضيف وMultipass سيناريوهات محددة متعددة بالتوازي
مع عمال Gateway معزولين افتراضيًا. يستخدم `qa-channel` قيمة تزامن افتراضية
4، محددة بعدد السيناريوهات المختارة. استخدم `--concurrency <count>` لضبط
عدد العمال، أو `--concurrency 1` للتنفيذ التسلسلي.
استخدم `--pack personal-agent` لتشغيل حزمة معيار المساعد الشخصي. محدد
الحزمة إضافي مع أعلام `--scenario` المتكررة: تعمل السيناريوهات الصريحة
أولًا، ثم تعمل سيناريوهات الحزمة بترتيب الحزمة مع إزالة التكرارات.
استخدم `--pack observability` عندما يوفّر مشغل QA مخصص بالفعل إعداد
مجمّع OpenTelemetry ويريد اختيار سيناريوهات دخان تشخيصات OpenTelemetry وPrometheus
معًا.
يخرج الأمر برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
تريد المصنوعات من دون رمز خروج فاشل.
تمرر عمليات التشغيل الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
مفاتيح الموفّر المستندة إلى البيئة، ومسار تكوين موفّر QA الحي، و
`CODEX_HOME` عند وجوده. أبقِ `--output-dir` تحت جذر المستودع حتى يستطيع الضيف
الكتابة مرة أخرى عبر مساحة العمل المركّبة.

## مرجع ضمان الجودة لـ Telegram وDiscord وSlack وWhatsApp

لدى Matrix [صفحة مخصصة](/ar/concepts/qa-matrix) بسبب عدد سيناريوهاته وتجهيز خادم homeserver المدعوم بـ Docker. يعمل Telegram وDiscord وSlack وWhatsApp على وسائل نقل حقيقية موجودة مسبقًا، لذلك يوجد مرجعها هنا.

### أعلام CLI المشتركة

تُسجَّل هذه المسارات عبر `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` وتقبل الأعلام نفسها:

| العلم                                 | الافتراضي                                          | الوصف                                                                                                                                             |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | شغّل هذا السيناريو فقط. قابل للتكرار.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | المكان الذي تُكتب فيه التقارير والملخصات والأدلة والآثار الخاصة بوسيلة النقل وسجل الإخراج. تُحل المسارات النسبية مقابل `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | جذر المستودع عند الاستدعاء من cwd محايد.                                                                                                          |
| `--sut-account <id>`                  | `sut`                                              | معرّف حساب مؤقت داخل إعدادات Gateway لضمان الجودة.                                                                                                |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` أو `live-frontier` (ما زال `live-openai` القديم يعمل).                                                                              |
| `--model <ref>` / `--alt-model <ref>` | افتراضي المزوّد                                    | مراجع النموذج الأساسي/البديل.                                                                                                                     |
| `--fast`                              | متوقف                                              | وضع المزوّد السريع عند دعمه.                                                                                                                       |
| `--credential-source <env\|convex>`   | `env`                                              | راجع [مجموعة بيانات اعتماد Convex](#convex-credential-pool).                                                                                     |
| `--credential-role <maintainer\|ci>`  | `ci` في CI، و`maintainer` خلاف ذلك                 | الدور المستخدم عند `--credential-source convex`.                                                                                                  |

يخرج كل مسار برمز غير صفري عند فشل أي سيناريو. يكتب `--allow-failures` الآثار من دون تعيين رمز خروج فاشل.

### ضمان جودة Telegram

```bash
pnpm openclaw qa telegram
```

يستهدف مجموعة Telegram خاصة حقيقية واحدة مع بوتين مميزين (السائق + SUT). يجب أن يكون لبوت SUT اسم مستخدم في Telegram؛ تعمل مراقبة بوت إلى بوت بأفضل شكل عندما يكون لدى البوتين **وضع اتصال بوت إلى بوت** مفعّل في `@BotFather`.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - معرّف محادثة رقمي (سلسلة).
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

تغطي المجموعة الافتراضية الضمنية دائمًا الفحص canary، وبوابة الإشارات، وردود الأوامر الأصلية، وعنونة الأوامر، وردود المجموعات من بوت إلى بوت. تتضمن افتراضيات `mock-openai` أيضًا فحوصات حتمية لسلسلة الردود وبث الرسالة النهائية. يبقى `telegram-current-session-status-tool` اختياريًا لأنه مستقر فقط عند تشغيله في سلسلة مباشرة بعد canary، وليس بعد ردود أوامر أصلية عشوائية. استخدم `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` لطباعة التقسيم الحالي بين الافتراضي والاختياري مع مراجع الانحدار.

آثار الإخراج:

- `telegram-qa-report.md`
- `qa-evidence.json` - إدخالات أدلة لفحوصات النقل الحية، بما في ذلك حقول الملف الشخصي والتغطية والمزوّد والقناة والآثار والنتيجة وRTT.

تستخدم عمليات Telegram الخاصة بالحزمة عقد بيانات اعتماد Telegram نفسه. قياس RTT المتكرر
جزء من مسار Telegram الحي العادي للحزمة؛ ويُدمج توزيع RTT
داخل `qa-evidence.json` ضمن `result.timing` لفحص RTT
المحدد.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

عند تعيين `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`، يستأجر مغلّف الحزمة الحية
بيان اعتماد `kind: "telegram"`، ويصدّر متغيرات بيئة المجموعة/السائق/بوت SUT
المستأجرة إلى تشغيل الحزمة المثبتة، ويرسل Heartbeat للتأجير، ويحرره عند
الإيقاف. يضبط مغلّف الحزمة افتراضيًا 20 فحص RTT لـ
`telegram-mentioned-message-reply`، ومهلة RTT قدرها 30s، ودور Convex
`maintainer` خارج CI عند اختيار Convex. تجاوز
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES` أو `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
أو `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` لضبط قياس RTT من دون
إنشاء أمر RTT منفصل أو تنسيق ملخص خاص بـ Telegram.

### ضمان جودة Discord

```bash
pnpm openclaw qa discord
```

يستهدف قناة Guild خاصة حقيقية واحدة في Discord مع بوتين: بوت سائق يتحكم به harness وبوت SUT يبدأه OpenClaw gateway الفرعي عبر Plugin Discord المضمن. يتحقق من معالجة إشارات القناة، ومن أن بوت SUT سجّل أمر `/help` الأصلي لدى Discord، ومن سيناريوهات أدلة Mantis الاختيارية.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - يجب أن يطابق معرّف مستخدم بوت SUT المُعاد من Discord (وإلا يفشل المسار سريعًا).

اختياري:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` يبقي نصوص الرسائل في آثار الرسائل المرصودة.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` يحدد قناة الصوت/المنصة لـ `discord-voice-autojoin`؛ وبدونه يختار السيناريو أول قناة صوت/منصة مرئية لبوت SUT.

السيناريوهات (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - سيناريو صوت اختياري. يعمل بمفرده، ويفعّل `channels.discord.voice.autoJoin`، ويتحقق من أن حالة الصوت الحالية لبوت SUT في Discord هي قناة الصوت/المنصة الهدف. قد تتضمن بيانات اعتماد Discord في Convex قيمة `voiceChannelId` اختيارية؛ وإلا يكتشف المشغّل أول قناة صوت/منصة مرئية في Guild.
- `discord-status-reactions-tool-only` - سيناريو Mantis اختياري. يعمل بمفرده لأنه يبدّل SUT إلى ردود Guild دائمة التشغيل ومعتمدة على الأدوات فقط مع `messages.statusReactions.enabled=true`، ثم يلتقط خطًا زمنيًا للتفاعلات عبر REST إضافة إلى آثار مرئية HTML/PNG. كما تحفظ تقارير Mantis قبل/بعد آثار MP4 المقدمة من السيناريو باسم `baseline.mp4` و`candidate.mp4`.

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
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

آثار الإخراج:

- `discord-qa-report.md`
- `qa-evidence.json` - إدخالات أدلة لفحوصات النقل الحية.
- `discord-qa-observed-messages.json` - تُنقّح النصوص ما لم يكن `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` و`discord-status-reactions-tool-only-timeline.png` عند تشغيل سيناريو تفاعلات الحالة.

### ضمان جودة Slack

```bash
pnpm openclaw qa slack
```

يستهدف قناة Slack خاصة حقيقية واحدة مع بوتين مميزين: بوت سائق يتحكم به harness وبوت SUT يبدأه OpenClaw gateway الفرعي عبر Plugin Slack المضمن.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختياري:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` يبقي نصوص الرسائل في آثار الرسائل المرصودة.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` يفعّل نقاط تحقق الموافقة المرئية
  لـ Mantis. يكتب المشغّل `<scenario>.pending.json` و
  `<scenario>.resolved.json`، ثم ينتظر ملفات `.ack.json` المطابقة.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` يتجاوز مهلة
  إقرار نقطة التحقق. الافتراضي هو `120000`.

السيناريوهات (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - سيناريو موافقة exec أصلية اختياري في Slack.
  يطلب موافقة exec عبر Gateway، ويتحقق من أن رسالة Slack تحتوي على
  أزرار موافقة أصلية، ويحلّها، ثم يتحقق من تحديث Slack المحلول.
- `slack-approval-plugin-native` - سيناريو موافقة Plugin أصلية اختياري في Slack.
  يفعّل تمرير موافقات exec وPlugin معًا حتى لا تُكبت أحداث Plugin
  بواسطة توجيه موافقة exec، ثم يتحقق من مسار واجهة Slack الأصلية نفسه
  في حالتي الانتظار والحل.

آثار الإخراج:

- `slack-qa-report.md`
- `qa-evidence.json` - إدخالات أدلة لفحوصات النقل الحية.
- `slack-qa-observed-messages.json` - تُنقّح النصوص ما لم يكن `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - فقط عندما يعيّن Mantis
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`؛ يحتوي على JSON لنقطة التحقق،
  وJSON للإقرار، ولقطات شاشة للحالتين المعلقة/المحلولة.

#### إعداد مساحة عمل Slack

يحتاج المسار إلى تطبيقين مميزين في Slack داخل مساحة عمل واحدة، إضافة إلى قناة يكون كلا البوتين عضوين فيها:

- `channelId` - معرّف `Cxxxxxxxxxx` لقناة دُعي إليها كلا البوتين. استخدم قناة مخصصة؛ ينشر المسار في كل تشغيل.
- `driverBotToken` - رمز بوت (`xoxb-...`) لتطبيق **Driver**.
- `sutBotToken` - رمز بوت (`xoxb-...`) لتطبيق **SUT**، ويجب أن يكون تطبيق Slack منفصلًا عن السائق حتى يكون معرّف مستخدم البوت الخاص به مميزًا.
- `sutAppToken` - رمز على مستوى التطبيق (`xapp-...`) لتطبيق SUT مع `connections:write`، يستخدمه Socket Mode كي يتمكن تطبيق SUT من تلقي الأحداث.

فضّل مساحة عمل Slack مخصصة لضمان الجودة على إعادة استخدام مساحة عمل إنتاجية.

يضيّق بيان SUT أدناه عمدًا تثبيت Plugin Slack المضمن للإنتاج (`extensions/slack/src/setup-shared.ts:10`) إلى الأذونات والأحداث التي تغطيها مجموعة ضمان جودة Slack الحية. لإعداد قناة الإنتاج كما يراه المستخدمون، راجع [الإعداد السريع لقناة Slack](/ar/channels/slack#quick-setup)؛ زوج QA Driver/SUT منفصل عمدًا لأن المسار يحتاج إلى معرّفي مستخدم بوت مميزين داخل مساحة عمل واحدة.

**1. أنشئ تطبيق Driver**

انتقل إلى [api.slack.com/apps](https://api.slack.com/apps) → _إنشاء تطبيق جديد_ → _من بيان_ → اختر مساحة عمل QA، والصق البيان الآتي، ثم _التثبيت في مساحة العمل_:

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

انسخ _Bot User OAuth Token_ ‏(`xoxb-...`) - وسيصبح ذلك `driverBotToken`. لا يحتاج المشغّل إلا إلى نشر الرسائل والتعرّف إلى نفسه؛ لا أحداث، ولا Socket Mode.

**2. أنشئ تطبيق SUT**

كرّر _إنشاء تطبيق جديد → من بيان_ في مساحة العمل نفسها. يستخدم تطبيق QA هذا عمدًا نسخة أضيق من بيان الإنتاج الخاص بـ Slack plugin المضمّن (`extensions/slack/src/setup-shared.ts:10`): تم حذف نطاقات التفاعلات والأحداث لأن مجموعة اختبارات Slack QA الحية لا تغطي معالجة التفاعلات بعد.

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

- _التثبيت في مساحة العمل_ → انسخ _Bot User OAuth Token_ → وسيصبح ذلك `sutBotToken`.
- _المعلومات الأساسية → رموز مستوى التطبيق → توليد الرمز والنطاقات_ → أضف النطاق `connections:write` → احفظ → انسخ قيمة `xapp-...` → وسيصبح ذلك `sutAppToken`.

تحقّق من أن الروبوتين لهما معرّفا مستخدم مختلفان باستدعاء `auth.test` على كل رمز. يميّز وقت التشغيل بين المشغّل وSUT بواسطة معرّف المستخدم؛ ستفشل إعادة استخدام تطبيق واحد لكليهما في بوابة الإشارات فورًا.

**3. أنشئ القناة**

في مساحة عمل QA، أنشئ قناة (مثلًا `#openclaw-qa`) وادعُ الروبوتين كليهما من داخل القناة:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

انسخ معرّف `Cxxxxxxxxxx` من _معلومات القناة → حول → معرّف القناة_ - وسيصبح ذلك `channelId`. تعمل القناة العامة؛ وإذا استخدمت قناة خاصة، فكلا التطبيقين لديهما `groups:history` بالفعل، لذلك ستظل قراءات السجل في الحزمة تنجح.

**4. سجّل بيانات الاعتماد**

يوجد خياران. استخدم متغيرات البيئة لتصحيح الأخطاء على جهاز واحد (اضبط متغيرات `OPENCLAW_QA_SLACK_*` الأربعة ومرّر `--credential-source env`)، أو ازرع مجمع Convex المشترك حتى يتمكن CI والمشرفون الآخرون من استئجارها.

بالنسبة إلى مجمع Convex، اكتب الحقول الأربعة إلى ملف JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

مع تصدير `OPENCLAW_QA_CONVEX_SITE_URL` و`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` في الصدفة لديك، سجّل وتحقّق:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

توقّع `count: 1`، و`status: "active"`، من دون حقل `lease`.

**5. تحقّق من البداية إلى النهاية**

شغّل المسار محليًا للتأكد من أن كلا الروبوتين يستطيعان التحدث إلى بعضهما عبر الوسيط:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

يكتمل التشغيل الناجح في أقل بكثير من 30 ثانية، ويعرض `slack-qa-report.md` كلًا من `slack-canary` و`slack-mention-gating` بالحالة `pass`. إذا علِق المسار لنحو 90 ثانية وخرج بالرسالة `Convex credential pool exhausted for kind "slack"`، فإما أن المجمع فارغ أو أن كل صف مستأجر - سيخبرك `qa credentials list --kind slack --status all --json` أيهما.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

يستهدف حسابين مخصصين من WhatsApp Web: حساب مشغّل تتحكم به
الحزمة، وحساب SUT يبدأه Gateway الفرعي لـ OpenClaw عبر
WhatsApp plugin المضمّن.

البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

اختياري:

- يفعّل `OPENCLAW_QA_WHATSAPP_GROUP_JID` سيناريوهات المجموعات مثل
  `whatsapp-mention-gating`، و`whatsapp-group-pending-history-context`،
  و`whatsapp-broadcast-group-fanout`، و`whatsapp-group-activation-always`،
  و`whatsapp-group-reply-to-bot-triggers`، وسيناريوهات إجراءات/وسائط/استطلاعات المجموعة، و
  `whatsapp-group-allowlist-block`.
- يحافظ `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` على نصوص الرسائل في
  عناصر الرسائل المرصودة.

فهرس السيناريوهات (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- الأساس وبوابة المجموعات: `whatsapp-canary`، و`whatsapp-pairing-block`،
  و`whatsapp-mention-gating`، و`whatsapp-group-pending-history-context`،
  و`whatsapp-group-activation-always`،
  و`whatsapp-group-reply-to-bot-triggers`،
  و`whatsapp-top-level-reply-shape`، و`whatsapp-restart-resume`،
  و`whatsapp-group-allowlist-block`.
- الأوامر الأصلية: `whatsapp-help-command`، و`whatsapp-status-command`،
  و`whatsapp-commands-command`، و`whatsapp-tools-compact-command`،
  و`whatsapp-whoami-command`، و`whatsapp-context-command`،
  و`whatsapp-native-new-command`.
- سلوك الرد والمخرجات النهائية: `whatsapp-tool-only-usage-footer`،
  و`whatsapp-reply-to-message`، و`whatsapp-group-reply-to-message`،
  و`whatsapp-reply-to-mode-batched`، و`whatsapp-reply-context-isolation`،
  و`whatsapp-reply-delivery-shape`، و`whatsapp-stream-final-message-accounting`.
- إجراءات الرسائل لمسار المستخدم: يبدأ `whatsapp-agent-message-action-react` من
  رسالة DM حقيقية من المشغّل، ويسمح للنموذج باستدعاء أداة `message`، ويرصد
  تفاعل WhatsApp الأصلي. يستخدم `whatsapp-agent-message-action-upload-file`
  الوضعية نفسها لـ `message(action=upload-file)` ويرصد وسائط
  WhatsApp الأصلية. يثبت `whatsapp-group-agent-message-action-react` و
  `whatsapp-group-agent-message-action-upload-file` الإجراءات المرئية للمستخدم نفسها
  في مجموعة WhatsApp حقيقية.
- توزيع المجموعة: يبدأ `whatsapp-broadcast-group-fanout` من رسالة مجموعة
  WhatsApp واحدة تمت الإشارة فيها، ويتحقق من ردود مرئية مميزة من `main` و
  `qa-second`.
- تفعيل المجموعة: يغيّر `whatsapp-group-activation-always` جلسة مجموعة حقيقية
  إلى `/activation always`، ويثبت أن رسالة مجموعة من دون إشارة توقظ
  الوكيل، ثم يستعيد `/activation mention`. يزرع `whatsapp-group-reply-to-bot-triggers`
  رد روبوت، ويرسل ردًا مقتبسًا أصليًا عليه من دون إشارة صريحة،
  ويتحقق من أن الوكيل يستيقظ من سياق ذلك الرد.
- الوسائط الواردة والرسائل المنظمة: `whatsapp-inbound-image-caption`،
  و`whatsapp-audio-preflight`، و`whatsapp-inbound-structured-messages`،
  و`whatsapp-group-audio-gating`، و`whatsapp-inbound-reaction-no-trigger`.
  ترسل هذه أحداث صورة وصوت ومستند وموقع وجهة اتصال وملصق
  وتفاعل WhatsApp حقيقية عبر المشغّل.
- فحوصات عقد Gateway المباشرة:
  `whatsapp-outbound-media-matrix`،
  و`whatsapp-outbound-document-preserves-filename`، و`whatsapp-outbound-poll`،
  و`whatsapp-group-outbound-media`، و`whatsapp-group-outbound-poll`،
  و`whatsapp-message-actions`، و`whatsapp-reply-context-isolation`،
  و`whatsapp-reply-delivery-shape`. تتجاوز هذه توجيه النموذج عمدًا وتثبت
  عقود Gateway/القناة الحتمية لـ `send`، و`poll`، و`message.action`.
- تغطية التحكم في الوصول: `whatsapp-access-control-dm-open`،
  و`whatsapp-access-control-dm-disabled`، و`whatsapp-access-control-group-open`،
  و`whatsapp-access-control-group-disabled`، و`whatsapp-group-allowlist-block`.
- الموافقات الأصلية: `whatsapp-approval-exec-deny-native`،
  و`whatsapp-approval-exec-native`، و`whatsapp-approval-exec-reaction-native`،
  و`whatsapp-approval-exec-group-reaction-native`،
  و`whatsapp-approval-plugin-native`.
- تفاعلات الحالة: `whatsapp-status-reactions`،
  و`whatsapp-status-reaction-lifecycle`.

يحتوي الفهرس حاليًا على 50 سيناريو. يُبقى مسار `live-frontier` الافتراضي
صغيرًا عند 10 سيناريوهات لتغطية دخان سريعة. يشغّل مسار `mock-openai` الافتراضي
44 سيناريو حتميًا عبر نقل WhatsApp الحقيقي مع
محاكاة مخرجات النموذج فقط. تبقى سيناريوهات الموافقة وبعض الفحوصات الأثقل/الحاجبة
صريحة بواسطة معرّف السيناريو.

يرصد مشغّل WhatsApp QA أحداثًا حية منظمة (`text`، و`media`،
و`location`، و`reaction`، و`poll`) ويمكنه إرسال الوسائط والاستطلاعات
وجهات الاتصال والمواقع والملصقات بنشاط. يستورد QA Lab ذلك المشغّل عبر
سطح حزمة `@openclaw/whatsapp/api.js` بدلًا من الوصول إلى ملفات
وقت تشغيل WhatsApp الخاصة. بالنسبة إلى ملاحظات المجموعات، يكون `fromJid` هو JID المجموعة بينما
يحدد `participantJid` و`fromPhoneE164` مرسل المشارك. يتم تنقيح
محتوى الرسائل افتراضيًا. فحوصات Gateway المباشرة
للاستطلاع، وupload-file، والوسائط، واستطلاع المجموعة، ووسائط المجموعة، وشكل الرد هي
فحوصات لعقد النقل/API؛ ولا تُعامل كدليل على أن مطالبة مستخدم جعلت الوكيل يختار
الإجراء نفسه. يأتي دليل إجراءات مسار المستخدم من سيناريوهات مثل
`whatsapp-agent-message-action-react` و
`whatsapp-group-agent-message-action-react`، حيث يرسل المشغّل رسالة
WhatsApp عادية ويرصد QA Lab أثر WhatsApp الأصلي الناتج.
تتضمن تقارير WhatsApp وضعية كل سيناريو (`user-path`، و`direct-gateway`،
أو `native-approval`) حتى لا يُساء فهم الدليل على أنه يثبت عقدًا أقوى
مما يثبته فعلًا.

عناصر المخرجات:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - إدخالات أدلة لفحوصات النقل الحي.
- `whatsapp-qa-observed-messages.json` - يتم تنقيح النصوص ما لم يكن `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### مجمع بيانات اعتماد Convex

يمكن لمسارات Telegram وDiscord وSlack وWhatsApp استئجار بيانات الاعتماد من مجمع Convex مشترك بدلًا من قراءة متغيرات البيئة أعلاه. مرّر `--credential-source convex` (أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)؛ يحصل QA Lab على استئجار حصري، ويرسل Heartbeat طوال مدة التشغيل، ويحرره عند الإيقاف. أنواع المجمع هي `"telegram"`، و`"discord"`، و`"slack"`، و`"whatsapp"`.

أشكال الحمولة التي يتحقق منها الوسيط عند `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - يجب أن يكون `groupId` سلسلة رقمية لمعرّف الدردشة.
- مستخدم Telegram حقيقي (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - لإثبات Mantis Telegram Desktop فقط. يجب ألا تحصل مسارات QA Lab العامة على هذا النوع.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - يجب أن تكون أرقام الهواتف سلاسل E.164 مميزة.

يمسك سير عمل إثبات Mantis Telegram Desktop بحجز Convex
`telegram-user` حصري واحد لكل من مشغّل TDLib CLI وشاهد Telegram Desktop،
ثم يحرره بعد نشر الإثبات.

عندما يحتاج PR إلى فرق مرئي حتمي، يمكن لـ Mantis استخدام رد النموذج الوهمي
نفسه على `main` وعلى رأس PR أثناء تغيير منسّق Telegram أو طبقة التسليم.
إعدادات الالتقاط الافتراضية مضبوطة لتعليقات PR: فئة Crabbox القياسية،
وتسجيل سطح مكتب بمعدل 24fps، وملف GIF للحركة بمعدل 24fps، وعرض معاينة 1920px.
يجب أن تنشر تعليقات قبل/بعد حزمة نظيفة تحتوي فقط على ملفات GIF
المقصودة.

يمكن لمسارات Slack استخدام المجموعة أيضًا. تعيش فحوصات شكل حمولة Slack حاليًا في مشغّل Slack QA بدلًا من الوسيط؛ استخدم `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`، مع معرّف قناة Slack مثل `Cxxxxxxxxxx`. راجع [إعداد مساحة عمل Slack](#setting-up-the-slack-workspace) لتوفير التطبيق والنطاقات.

تعيش متغيرات البيئة التشغيلية وعقدة نهاية وسيط Convex في [الاختبار ← بيانات اعتماد Telegram المشتركة عبر Convex](/ar/help/testing#shared-telegram-credentials-via-convex-v1) (اسم القسم يسبق مجموعة القنوات المتعددة؛ دلالات الحجز مشتركة بين الأنواع).

## البذور المدعومة بالمستودع

تعيش أصول البذور في `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

هذه موجودة عمدًا في git بحيث تكون خطة QA مرئية لكل من البشر
والوكيل.

يجب أن يبقى `qa-lab` مشغّل سيناريوهات YAML عامًا. كل ملف YAML للسيناريو
هو مصدر الحقيقة لتشغيل اختبار واحد ويجب أن يعرّف:

- `title` في المستوى الأعلى
- بيانات `scenario` الوصفية
- بيانات وصفية اختيارية للفئة والإمكانات والمسار والمخاطر في `scenario`
- مراجع المستندات والكود في `scenario`
- متطلبات Plugin اختيارية في `scenario`
- تصحيح إعداد Gateway اختياري في `scenario`
- `flow` قابل للتنفيذ في المستوى الأعلى لسيناريوهات التدفق، أو `scenario.execution.kind` /
  `scenario.execution.path` لسيناريوهات Vitest وPlaywright

يُسمح لسطح التشغيل القابل لإعادة الاستخدام الذي يدعم `flow` بأن يبقى عامًا
وعابرًا للقطاعات. على سبيل المثال، يمكن لسيناريوهات YAML دمج مساعدين من جانب
النقل مع مساعدين من جانب المتصفح يقودون Control UI المضمّن عبر وصلة
Gateway `browser.request` من دون إضافة مشغّل لحالة خاصة.

يجب تجميع ملفات السيناريو حسب إمكانات المنتج بدلًا من مجلد شجرة المصدر.
أبقِ معرّفات السيناريوهات مستقرة عند نقل الملفات؛ استخدم `docsRefs` و`codeRefs`
لتتبع التنفيذ.

يجب أن تبقى قائمة الأساس عريضة بما يكفي لتغطية:

- دردشة DM والقناة
- سلوك السلاسل
- دورة حياة إجراء الرسالة
- استدعاءات Cron
- استدعاء الذاكرة
- تبديل النماذج
- تسليم الوكيل الفرعي
- قراءة المستودع وقراءة المستندات
- مهمة بناء صغيرة واحدة مثل Lobster Invaders

## مسارات المزوّد الوهمية

يمتلك `qa suite` مسارين محليين وهميين للمزوّد:

- `mock-openai` هو محاكاة OpenClaw الواعية بالسيناريو. يبقى مسار المحاكاة
  الحتمي الافتراضي لـ QA المدعوم بالمستودع وبوابات التكافؤ.
- `aimock` يبدأ خادم مزوّد مدعومًا بـ AIMock لتغطية البروتوكول التجريبي،
  والتجهيزات، والتسجيل/الإعادة، والفوضى. إنه إضافي ولا يستبدل
  موزّع سيناريوهات `mock-openai`.

يعيش تنفيذ مسار المزوّد تحت `extensions/qa-lab/src/providers/`.
يمتلك كل مزوّد إعداداته الافتراضية، وبدء تشغيل الخادم المحلي، وإعداد نموذج Gateway،
واحتياجات تجهيز ملف تعريف المصادقة، وأعلام إمكانات الحي/الوهمي. يجب أن يمر كود
الحزمة وGateway المشتركان عبر سجل المزوّدين بدلًا من التفريع على
أسماء المزوّدين.

## محوّلات النقل

يمتلك `qa-lab` وصلة نقل عامة لسيناريوهات YAML QA. `qa-channel` هو
الافتراضي الاصطناعي. يبدأ `crabline` خوادم محلية بشكل مزوّد ويشغّل
Plugins القنوات العادية في OpenClaw ضدها. `live` محجوز لبيانات اعتماد
المزوّدين الحقيقية والقنوات الخارجية.

على مستوى البنية، يكون التقسيم كالتالي:

- يمتلك `qa-lab` تنفيذ السيناريوهات العام، وتزامن العمال، وكتابة الأدلة، والتقارير.
- يمتلك محوّل النقل إعداد Gateway، والجاهزية، ومراقبة الوارد والصادر، وإجراءات النقل، وحالة النقل المطبّعة.
- تعرّف ملفات سيناريوهات YAML تحت `qa/scenarios/` تشغيل الاختبار؛ ويوفر `qa-lab` سطح التشغيل القابل لإعادة الاستخدام الذي ينفذها.

### إضافة قناة

تتطلب إضافة قناة إلى نظام YAML QA تنفيذ القناة إضافة إلى
حزمة سيناريوهات تمرّن عقد القناة. لتغطية smoke في CI، أضف
خادم مزوّد Crabline المحلي المطابق واعرضه عبر مشغّل `crabline`.

لا تضف جذر أمر QA جديدًا في المستوى الأعلى عندما يستطيع مضيف `qa-lab` المشترك امتلاك التدفق.

يمتلك `qa-lab` آليات المضيف المشترك:

- جذر الأمر `openclaw qa`
- بدء الحزمة وإيقافها
- تزامن العمال
- كتابة الأدلة
- توليد التقارير
- تنفيذ السيناريوهات
- أسماء توافق بديلة لسيناريوهات `qa-channel` الأقدم

تمتلك Plugins المشغّل عقد النقل:

- كيف يُركّب `openclaw qa <runner>` أسفل جذر `qa` المشترك
- كيف يُعدّ Gateway لذلك النقل
- كيف تُفحص الجاهزية
- كيف تُحقن الأحداث الواردة
- كيف تُراقب الرسائل الصادرة
- كيف تُعرض النصوص وحالة النقل المطبّعة
- كيف تُنفذ الإجراءات المدعومة بالنقل
- كيف يُعالج إعادة الضبط أو التنظيف الخاص بالنقل

الحد الأدنى لاعتماد قناة جديدة:

1. أبقِ `qa-lab` مالكًا لجذر `qa` المشترك.
2. نفّذ مشغّل النقل على وصلة مضيف `qa-lab` المشتركة.
3. أبقِ الآليات الخاصة بالنقل داخل Plugin المشغّل أو حاضنة القناة.
4. ركّب المشغّل كـ `openclaw qa <runner>` بدلًا من تسجيل أمر جذري منافس. يجب أن تعلن Plugins المشغّل عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`. أبقِ `runtime-api.ts` خفيفًا؛ يجب أن يبقى تنفيذ CLI والمشغّل الكسول خلف نقاط دخول منفصلة.
5. ألّف أو كيّف سيناريوهات YAML تحت أدلة `qa/scenarios/` ذات السمات.
6. استخدم مساعدي السيناريو العامين للسيناريوهات الجديدة.
7. أبقِ أسماء التوافق البديلة الحالية عاملة ما لم يكن المستودع ينفذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا كان يمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحد، فأبقِه في Plugin ذلك المشغّل أو حاضنة Plugin.
- إذا كان السيناريو يحتاج إلى إمكانية جديدة يمكن لأكثر من قناة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة في `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بالنقل واجعل ذلك صريحًا في عقد السيناريو.

### أسماء مساعدي السيناريو

المساعدون العامون المفضلون للسيناريوهات الجديدة:

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

تبقى أسماء التوافق البديلة متاحة للسيناريوهات الحالية - `waitForQaChannelReady`، و`waitForOutboundMessage`، و`waitForNoOutbound`، و`formatConversationTranscript`، و`resetBus` - لكن يجب أن يستخدم تأليف السيناريوهات الجديدة الأسماء العامة. توجد الأسماء البديلة لتجنب ترحيل في يوم واحد، لا كنموذج للمضي قدمًا.

## التقارير

يصدّر `qa-lab` تقرير بروتوكول Markdown من الخط الزمني المرصود للحافلة.
يجب أن يجيب التقرير عن:

- ما الذي نجح
- ما الذي فشل
- ما الذي بقي محظورًا
- ما سيناريوهات المتابعة التي تستحق الإضافة

لجرد السيناريوهات المتاحة - وهو مفيد عند تقدير حجم عمل المتابعة أو توصيل نقل جديد - شغّل `pnpm openclaw qa coverage` (أضف `--json` للإخراج القابل للقراءة آليًا).
عند اختيار إثبات مركّز لسلوك متأثر أو مسار ملف، شغّل `pnpm openclaw qa coverage --match <query>`.
يبحث تقرير المطابقة في بيانات السيناريو الوصفية، ومراجع المستندات، ومراجع الكود، ومعرّفات التغطية، وPlugins، ومتطلبات المزوّدين، ثم يطبع أهداف `qa suite --scenario ...` المطابقة.
يكتب كل تشغيل `qa suite` أدلة المستوى الأعلى `qa-evidence.json`،
و`qa-suite-summary.json`، و`qa-suite-report.md` لمجموعة
السيناريوهات المحددة. السيناريوهات التي تعلن `execution.kind: vitest` أو
`execution.kind: playwright` تشغّل مسار الاختبار المطابق وتكتب أيضًا
سجلات لكل سيناريو. السيناريوهات التي تعلن `execution.kind: script` تشغّل
منتج الأدلة عند `execution.path` عبر `node --import tsx` (مع
توسيع `${outputDir}` و`${scenarioId}` في `execution.args`)؛ يكتب المنتج
ملف `qa-evidence.json` الخاص به، وتُستورد إدخالاته إلى مخرجات الحزمة
وتُحل مسارات أدلته نسبةً إلى ملف `qa-evidence.json` لذلك المنتج.
عند الوصول إلى `qa suite` عبر
`qa run --qa-profile`، يتضمن ملف `qa-evidence.json` نفسه أيضًا ملخص
بطاقة تقييم الملف الشخصي لفئات التصنيف المحددة.
عامله كوسيلة اكتشاف، لا كبديل عن البوابة؛ لا يزال السيناريو المحدد يحتاج إلى وضع المزوّد الصحيح، أو النقل الحي، أو Multipass، أو Testbox، أو مسار الإصدار للسلوك قيد الاختبار.
لسياق بطاقة التقييم، راجع [بطاقة تقييم النضج](/ar/maturity/scorecard).

لفحوصات الشخصية والأسلوب، شغّل السيناريو نفسه عبر مراجع نماذج حية متعددة
واكتب تقرير Markdown محكّمًا:

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

يشغّل الأمر عمليات فرعية محلية لـ QA Gateway، وليس Docker. ينبغي لسيناريوهات
تقييم الشخصية ضبط الشخصية عبر `SOUL.md`، ثم تشغيل تفاعلات مستخدم عادية
مثل الدردشة، والمساعدة في مساحة العمل، ومهام الملفات الصغيرة. يجب ألا يُبلَّغ
النموذج المرشح بأنه قيد التقييم. يحافظ الأمر على كل نسخة نصية كاملة،
ويسجل إحصاءات تشغيل أساسية، ثم يطلب من نماذج التحكيم في الوضع السريع مع
استدلال `xhigh` حيث يكون مدعوما لترتيب عمليات التشغيل بحسب الطبيعية، والأجواء، والفكاهة.
استخدم `--blind-judge-models` عند مقارنة المزوّدين: لا تزال مطالبة التحكيم تحصل على
كل نسخة نصية وحالة تشغيل، لكن تُستبدل مراجع المرشحين بتسميات محايدة
مثل `candidate-01`؛ ويربط التقرير الترتيبات بالمراجع الحقيقية بعد
التحليل.
تستخدم عمليات تشغيل المرشحين افتراضيا تفكير `high`، مع `medium` لـ GPT-5.5 و`xhigh`
لمراجع تقييم OpenAI الأقدم التي تدعمه. تجاوز مرشحا محددا ضمن السطر باستخدام
`--model provider/model,thinking=<level>`. لا يزال `--thinking <level>` يضبط
احتياطيا عاما، ويُحتفظ بالصيغة الأقدم `--model-thinking <provider/model=level>`
للتوافق.
تستخدم مراجع مرشحي OpenAI افتراضيا الوضع السريع بحيث تُستخدم المعالجة ذات الأولوية حيث
يدعمها المزوّد. أضف `,fast` أو `,no-fast` أو `,fast=false` ضمن السطر عندما يحتاج
مرشح أو محكّم واحد إلى تجاوز. مرّر `--fast` فقط عندما تريد
فرض الوضع السريع على كل نموذج مرشح. تُسجل مدد المرشحين والمحكّمين
في التقرير لتحليل القياسات المرجعية، لكن مطالبات التحكيم تنص صراحة على
عدم الترتيب بحسب السرعة.
تستخدم عمليات تشغيل نماذج المرشحين والمحكّمين معا تزامنا افتراضيا قدره 16. خفّض
`--concurrency` أو `--judge-concurrency` عندما تجعل حدود المزوّد أو ضغط Gateway
المحلي التشغيل كثير الضجيج.
عند عدم تمرير أي مرشح `--model`، يستخدم تقييم الشخصية افتراضيا
`openai/gpt-5.5`، و`openai/gpt-5.2`، و`openai/gpt-5`، و`anthropic/claude-opus-4-8`،
و`anthropic/claude-sonnet-4-6`، و`zai/glm-5.1`،
و`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` عند عدم تمرير `--model`.
عند عدم تمرير `--judge-model`، يستخدم المحكّمون افتراضيا
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-8,thinking=high`.

## المستندات ذات الصلة

- [مصفوفة QA](/ar/concepts/qa-matrix)
- [بطاقة تقييم النضج](/ar/maturity/scorecard)
- [حزمة قياس وكيل شخصي](/ar/concepts/personal-agent-benchmark-pack)
- [قناة QA](/ar/channels/qa-channel)
- [الاختبار](/ar/help/testing)
- [لوحة المعلومات](/ar/web/dashboard)
