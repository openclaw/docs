---
read_when:
    - فهم كيفية تكامل حزمة ضمان الجودة معًا
    - توسيع qa-lab أو qa-channel أو محوّل نقل
    - إضافة سيناريوهات ضمان الجودة المدعومة بالمستودع
    - بناء أتمتة QA أعلى واقعية حول لوحة معلومات Gateway
summary: 'نظرة عامة على حزمة ضمان الجودة: `qa-lab`، و`qa-channel`، والسيناريوهات المدعومة بالمستودع، ومسارات النقل الحية، ومحوّلات النقل، وإعداد التقارير.'
title: نظرة عامة على ضمان الجودة
x-i18n:
    generated_at: "2026-06-30T14:03:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

المقصود من حزمة QA الخاصة هو اختبار OpenClaw بطريقة أكثر واقعية
ومشكّلة كقناة مما يمكن لاختبار وحدة واحد فعله.

الأجزاء الحالية:

- `extensions/qa-channel`: قناة رسائل اصطناعية تتضمن أسطح الرسائل المباشرة، والقناة، والسلاسل،
  والتفاعلات، والتحرير، والحذف.
- `extensions/qa-lab`: واجهة مصحح أخطاء وناقل QA لمراقبة النص المنسوخ،
  وحقن الرسائل الواردة، وتصدير تقرير Markdown.
- `extensions/qa-matrix`، وإضافات المشغّل المستقبلية: محولات نقل حية
  تقود قناة حقيقية داخل Gateway QA فرعي.
- `qa/`: أصول بذور مدعومة بالمستودع لمهمة البدء وسيناريوهات QA
  الأساسية.
- [Mantis](/ar/concepts/mantis): تحقق حي قبل وبعد للأخطاء التي
  تحتاج إلى وسائل نقل حقيقية، ولقطات شاشة للمتصفح، وحالة VM، وأدلة PR.

## سطح الأوامر

كل تدفق QA يعمل تحت `pnpm openclaw qa <subcommand>`. لدى كثير منها أسماء بديلة عبر سكربتات `pnpm qa:*`؛ كلا الشكلين مدعومان.

| الأمر                                               | الغرض                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | فحص QA ذاتي مضمّن بدون `--qa-profile`؛ مشغّل ملف نضج مدعوم بالتصنيف مع `--qa-profile smoke-ci` أو `--qa-profile release` أو `--qa-profile all`.                                                                                                                        |
| `qa suite`                                          | تشغيل سيناريوهات مدعومة بالمستودع مقابل مسار QA Gateway. أسماء بديلة: `pnpm openclaw qa suite --runner multipass` لاستخدام Linux VM مؤقت.                                                                                                                            |
| `qa coverage`                                       | طباعة مخزون تغطية سيناريوهات YAML (`--json` للمخرجات الآلية).                                                                                                                                                                                                          |
| `qa parity-report`                                  | مقارنة ملفي `qa-suite-summary.json` وكتابة تقرير التكافؤ الوكيلي، أو استخدام `--runtime-axis --token-efficiency` لكتابة تقارير تكافؤ وقت تشغيل Codex مقابل OpenClaw وكفاءة الرموز من ملخص زوج وقت تشغيل واحد.                                                        |
| `qa character-eval`                                 | تشغيل سيناريو QA للشخصية عبر نماذج حية متعددة مع تقرير مُحكّم. انظر [التقارير](#reporting).                                                                                                                                                                           |
| `qa manual`                                         | تشغيل مطالبة واحدة مقابل مسار المزوّد/النموذج المحدد.                                                                                                                                                                                                                  |
| `qa ui`                                             | بدء واجهة مصحح QA وناقل QA المحلي (الاسم البديل: `pnpm qa:lab:ui`).                                                                                                                                                                                                   |
| `qa docker-build-image`                             | بناء صورة Docker المسبقة التحضير لـ QA.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | كتابة قالب docker-compose للوحة معلومات QA + مسار Gateway.                                                                                                                                                                                                             |
| `qa up`                                             | بناء موقع QA، وبدء الحزمة المدعومة بـ Docker، وطباعة عنوان URL (الاسم البديل: `pnpm qa:lab:up`؛ متغير `:fast` يضيف `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                           |
| `qa aimock`                                         | بدء خادم مزوّد AIMock فقط.                                                                                                                                                                                                                                             |
| `qa mock-openai`                                    | بدء خادم مزوّد `mock-openai` المدرك للسيناريو فقط.                                                                                                                                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | إدارة تجمع بيانات اعتماد Convex المشترك.                                                                                                                                                                                                                               |
| `qa matrix`                                         | مسار نقل حي مقابل خادم Tuwunel homeserver مؤقت. انظر [Matrix QA](/ar/concepts/qa-matrix).                                                                                                                                                                                |
| `qa telegram`                                       | مسار نقل حي مقابل مجموعة Telegram خاصة حقيقية.                                                                                                                                                                                                                         |
| `qa discord`                                        | مسار نقل حي مقابل قناة Guild خاصة حقيقية في Discord.                                                                                                                                                                                                                  |
| `qa slack`                                          | مسار نقل حي مقابل قناة Slack خاصة حقيقية.                                                                                                                                                                                                                              |
| `qa whatsapp`                                       | مسار نقل حي مقابل حسابات WhatsApp Web حقيقية.                                                                                                                                                                                                                          |
| `qa mantis`                                         | مشغّل تحقق قبل وبعد لأخطاء النقل الحي، مع أدلة تفاعلات حالة Discord، واختبار Crabbox سطح مكتب/متصفح سريع، واختبار Slack-in-VNC سريع. انظر [Mantis](/ar/concepts/mantis) و[دليل تشغيل Mantis Slack Desktop](/ar/concepts/mantis-slack-desktop-runbook).                  |

يقرأ `qa run` المدعوم بالملفات العضوية من `taxonomy.yaml`، ثم يرسل
السيناريوهات المحلولة عبر `qa suite`. يقوم `--surface` و
`--category` بتصفية الملف المحدد بدلاً من تعريف مسارات منفصلة.
يتضمن ملف `qa-evidence.json` الناتج ملخص بطاقة تقييم للملف مع
أعداد الفئات المحددة ومعرّفات التغطية المفقودة؛ وتظل إدخالات الأدلة
الفردية هي مصدر الحقيقة للاختبارات، وأدوار التغطية، والنتائج.
معرّفات تغطية ميزات التصنيف هي أهداف إثبات دقيقة، وليست أسماء بديلة. تحقق
تغطية السيناريو الأساسية المعرّفات المطابقة؛ أما التغطية الثانوية فتبقى استشارية.
تستخدم معرّفات التغطية شكل `namespace.behavior` المنقّط مع مقاطع
أبجدية رقمية/شرطات صغيرة؛ وقد تظل معرّفات الملف والسطح والفئة تستخدم
معرّفات التصنيف الحالية ذات الشرطات أو النقاط.
تحذف الأدلة المختصرة `execution` لكل إدخال وتعيّن `evidenceMode: "slim"`؛
يستخدم `smoke-ci` الوضع المختصر افتراضياً، ويعيد `--evidence-mode full` الإدخالات الكاملة:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

استخدم `smoke-ci` لإثبات ملفات حتمية مع مزوّدي نماذج وهميين
وخوادم مزوّد Crabline المحلية. استخدم `release` لإثبات Stable/LTS مقابل قنوات حية.
استخدم `all` فقط لتشغيلات أدلة التصنيف الكاملة الصريحة؛ فهو يحدد
كل فئة نضج نشطة ويمكن إرساله عبر سير عمل `QA Profile
Evidence` مع `qa_profile=all`. عندما يحتاج أمر أيضاً إلى ملف جذر OpenClaw،
ضع ملف الجذر قبل أمر QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## تدفق المشغّل

تدفق مشغّل QA الحالي هو موقع QA ذو لوحتين:

- اليسار: لوحة معلومات Gateway (Control UI) مع الوكيل.
- اليمين: QA Lab، يعرض النص المنسوخ الشبيه بـ Slack وخطة السيناريو.

شغّله باستخدام:

```bash
pnpm qa:lab:up
```

يبني ذلك موقع QA، ويبدأ مسار Gateway المدعوم بـ Docker، ويعرض صفحة
QA Lab حيث يمكن للمشغّل أو حلقة الأتمتة إعطاء الوكيل مهمة QA،
ومراقبة سلوك القناة الحقيقي، وتسجيل ما نجح، أو فشل، أو بقي محظوراً.

لتكرار أسرع على واجهة QA Lab بدون إعادة بناء صورة Docker في كل مرة،
ابدأ الحزمة مع حزمة QA Lab موصولة عبر bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

يبقي `qa:lab:up:fast` خدمات Docker على صورة مسبقة البناء ويوصل
`extensions/qa-lab/web/dist` إلى حاوية `qa-lab` عبر bind mount. يعيد
`qa:lab:watch` بناء تلك الحزمة عند التغيير، ويعيد المتصفح التحميل تلقائياً عندما يتغير
تجزئة أصل QA Lab.

لاختبار سريع محلي لإشارة OpenTelemetry، شغّل:

```bash
pnpm qa:otel:smoke
```

يبدأ ذلك السكربت مستقبِل OTLP/HTTP محلياً، ويشغّل سيناريو QA
`otel-trace-smoke` مع تفعيل Plugin `diagnostics-otel`، ثم يتحقق من تصدير
التتبعات، والمقاييس، والسجلات. يفك ترميز امتدادات تتبع protobuf المصدّرة
ويفحص الشكل الحرج للإصدار:
يجب أن تكون `openclaw.run`، و`openclaw.harness.run`، وامتداد استدعاء نموذج
وفق أحدث اتفاقية دلالية GenAI، و`openclaw.context.assembled`، و`openclaw.message.delivery`
موجودة. يفرض الاختبار السريع
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`، لذلك يجب أن يستخدم امتداد استدعاء النموذج
اسم `{gen_ai.operation.name} {gen_ai.request.model}`؛
يجب ألا تصدّر استدعاءات النماذج `StreamAbandoned` في الجولات الناجحة؛ ويجب أن تبقى معرّفات التشخيص الخام وسمات
`openclaw.content.*` خارج التتبع. يجب ألا تحتوي حمولات OTLP الخام
على حارس المطالبة، أو حارس الاستجابة، أو مفتاح جلسة QA.
يكتب `otel-smoke-summary.json` بجانب عناصر QA suite الأثرية.

لاختبار OpenTelemetry سريع مدعوم بمجمّع، شغّل:

```bash
pnpm qa:otel:collector-smoke
```

يضع ذلك المسار حاوية Docker حقيقية لـ OpenTelemetry Collector أمام
المستقبِل المحلي نفسه. استخدمه عند تغيير توصيل نقطة النهاية، أو توافق المجمّع،
أو سلوك تصدير OTLP الذي قد يخفيه المستقبِل داخل العملية.

لاختبار كشط Prometheus المحمي السريع، شغّل:

```bash
pnpm qa:prometheus:smoke
```

ذلك الاسم المستعار يشغّل سيناريو QA `docker-prometheus-smoke` مع تفعيل
`diagnostics-prometheus`، ويتحقق من رفض عمليات السحب غير المصادقة،
ثم يتحقق من أن السحب المصادق يتضمن عائلات المقاييس الحرجة للإصدار
من دون محتوى المطالبات، أو محتوى الردود، أو المعرّفات التشخيصية الخام، أو
رموز المصادقة، أو المسارات المحلية.

لتشغيل اختباري الدخان للرصدية واحدًا تلو الآخر، استخدم:

```bash
pnpm qa:observability:smoke
```

لمسار OpenTelemetry المدعوم بالمجمّع مع اختبار دخان سحب Prometheus المحمي،
استخدم:

```bash
pnpm qa:observability:collector-smoke
```

تبقى QA الرصدية مقتصرة على نسخة مصدرية فقط. يحذف أرشيف npm tarball عمدًا
QA Lab، لذلك لا تشغّل مسارات إصدار Docker للحزمة أوامر `qa`. استخدم
`pnpm qa:otel:smoke`، أو `pnpm qa:prometheus:smoke`، أو
`pnpm qa:observability:smoke` من نسخة مصدرية مبنية عند تغيير
أدوات القياس التشخيصية.

لمسار دخان Matrix حقيقي النقل لا يتطلب بيانات اعتماد موفر النموذج،
شغّل ملف التعريف السريع مع موفر OpenAI المحاكي الحتمي:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

لمسار موفر live-frontier، قدّم بيانات اعتماد متوافقة مع OpenAI
بشكل صريح:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

توجد مرجعية CLI الكاملة، وفهرس ملفات التعريف/السيناريوهات، ومتغيرات البيئة، وتخطيط القطع الأثرية لهذا المسار في [Matrix QA](/ar/concepts/qa-matrix). باختصار: يجهّز خادم Tuwunel homeserver مؤقتًا في Docker، ويسجّل مستخدمي driver/SUT/observer مؤقتين، ويشغّل Plugin Matrix الحقيقي داخل Gateway QA فرعي مقيّد بذلك النقل (من دون `qa-channel`)، ثم يكتب تقرير Markdown، وملخص JSON، وقطعة أثرية للأحداث المرصودة، وسجل خرج مدمجًا تحت `.artifacts/qa-e2e/matrix-<timestamp>/`.

تغطي السيناريوهات سلوك النقل الذي لا تستطيع اختبارات الوحدة إثباته من البداية إلى النهاية: بوابة الإشارات، وسياسات السماح بالتواصل بين البوتات، وقوائم السماح، والردود ذات المستوى الأعلى والمترابطة، وتوجيه الرسائل المباشرة، ومعالجة التفاعلات، وكبت التعديلات الواردة، وإزالة تكرار إعادة التشغيل، والتعافي من انقطاع homeserver، وتسليم بيانات الموافقة الوصفية، ومعالجة الوسائط، وتدفقات تمهيد/استرداد/تحقق Matrix E2EE. كما يقود ملف تعريف CLI الخاص بـ E2EE أوامر `openclaw matrix encryption setup` وأوامر التحقق عبر homeserver المؤقت نفسه قبل التحقق من ردود Gateway.

يحتوي Discord أيضًا على سيناريوهات اختيارية خاصة بـ Mantis لإعادة إنتاج الأخطاء. استخدم
`--scenario discord-status-reactions-tool-only` للمخطط الزمني الصريح لتفاعلات الحالة،
أو `--scenario discord-thread-reply-filepath-attachment` لإنشاء سلسلة Discord
حقيقية والتحقق من أن `message.thread-reply` يحافظ على مرفق
`filePath`. تبقى هذه السيناريوهات خارج مسار Discord الحي الافتراضي
لأنها مجسات إعادة إنتاج قبل/بعد وليست تغطية دخان واسعة.
يمكن لسير عمل مرفق السلسلة في Mantis أيضًا إضافة فيديو شاهد Discord Web
مسجل الدخول عند ضبط `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` أو
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` في بيئة QA.
ملف تعريف العارض هذا مخصص للالتقاط المرئي فقط؛ أما قرار النجاح/الفشل
فيظل صادرًا من مرجع Discord REST.

تستخدم CI سطح الأوامر نفسه في `.github/workflows/qa-live-transports-convex.yml`.
تشغّل عمليات التشغيل المجدولة واليدوية الافتراضية ملف تعريف Matrix السريع مع
بيانات اعتماد live-frontier المقدمة من QA، و`--fast`، و
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. تؤدي عمليات التشغيل اليدوية مع `matrix_profile=all` إلى
التوزيع على شرائح ملفات التعريف الخمس.

لمسارات دخان Telegram وDiscord وSlack وWhatsApp الحقيقية النقل:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

تستهدف قناة حقيقية موجودة مسبقًا مع بوتين أو حسابين (driver + SUT). متغيرات البيئة المطلوبة، وقوائم السيناريوهات، وقطع الخرج الأثرية، ومجمّع بيانات اعتماد Convex موثقة في [مرجع QA لـ Telegram وDiscord وSlack وWhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) أدناه.

لتشغيل Slack desktop VM كامل مع إنقاذ VNC، شغّل:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر ذلك الأمر جهاز Crabbox سطح مكتب/متصفح، ويشغّل مسار Slack الحي
داخل VM، ويفتح Slack Web في متصفح VNC، ويلتقط سطح المكتب، وينسخ
`slack-qa/`، و`slack-desktop-smoke.png`، و`slack-desktop-smoke.mp4`
عند توفر التقاط الفيديو إلى دليل قطع Mantis الأثرية. توفر عقود إيجار
Crabbox لسطح المكتب/المتصفح أدوات الالتقاط وحزم مساعد المتصفح/البناء الأصلي
مسبقًا، لذلك ينبغي ألا يثبّت السيناريو البدائل إلا في عقود الإيجار الأقدم.
تبلغ Mantis عن التوقيتات الإجمالية وتوقيتات كل مرحلة في
`mantis-slack-desktop-smoke-report.md` حتى تعرض عمليات التشغيل البطيئة ما إذا كان الوقت قد صُرف في
تسخين عقد الإيجار، أو الحصول على بيانات الاعتماد، أو الإعداد البعيد، أو نسخ القطع الأثرية. أعد استخدام
`--lease-id <cbx_...>` بعد تسجيل الدخول إلى Slack Web يدويًا عبر VNC؛
كما تحافظ عقود الإيجار المعاد استخدامها على سخونة ذاكرة تخزين pnpm الخاصة بـ Crabbox. يتحقق الوضع الافتراضي
`--hydrate-mode source` من نسخة مصدرية ويشغّل التثبيت/البناء
داخل VM. استخدم `--hydrate-mode prehydrated` فقط عندما تحتوي مساحة العمل البعيدة المعاد استخدامها بالفعل على
`node_modules` و`dist/` مبني؛ يتجاوز ذلك الوضع خطوة
التثبيت/البناء المكلفة ويفشل بإغلاق عندما لا تكون مساحة العمل جاهزة.
مع `--gateway-setup`، تترك Mantis Gateway OpenClaw Slack مستمرًا
قيد التشغيل داخل VM على المنفذ `38973`؛ ومن دونه، يشغّل الأمر مسار Slack QA العادي
من بوت إلى بوت ويخرج بعد التقاط القطع الأثرية.

لإثبات واجهة موافقة Slack الأصلية مع دليل سطح المكتب، شغّل وضع نقاط تحقق الموافقة في Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

هذا الوضع متنافر مع `--gateway-setup`. يشغّل سيناريوهات موافقة Slack،
ويرفض معرّفات السيناريو غير الخاصة بالموافقة، وينتظر عند كل حالة موافقة معلقة
ومحلولة، ويعرض رسالة Slack API المرصودة في
`approval-checkpoints/<scenario>-pending.png` و
`approval-checkpoints/<scenario>-resolved.png`، ثم يفشل إذا كانت أي نقطة تحقق،
أو دليل رسالة، أو إقرار، أو لقطة شاشة معروضة مفقودة أو فارغة.
قد تظل عقود إيجار CI الباردة تعرض تسجيل الدخول إلى Slack في `slack-desktop-smoke.png`؛ صور
نقاط تحقق الموافقة هي الدليل المرئي لهذا المسار.

توجد قائمة تحقق المشغّل، وأمر تشغيل سير عمل GitHub، وعقد تعليق الأدلة،
وجدول قرار hydrate-mode، وتفسير التوقيت، وخطوات معالجة الفشل في [دليل تشغيل Mantis Slack Desktop](/ar/concepts/mantis-slack-desktop-runbook).

لمهمة سطح مكتب بأسلوب agent/CV، شغّل:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

يستأجر `visual-task` جهاز Crabbox سطح مكتب/متصفح أو يعيد استخدامه، ويبدأ
`crabbox record --while`، ويقود المتصفح المرئي عبر
`visual-driver` متداخل، ويلتقط `visual-task.png`، ويشغّل `openclaw infer image describe`
على لقطة الشاشة عند اختيار `--vision-mode image-describe`، ويكتب
`visual-task.mp4`، و`mantis-visual-task-summary.json`،
و`mantis-visual-task-driver-result.json`، و`mantis-visual-task-report.md`.
عند ضبط `--expect-text`، تطلب مطالبة الرؤية حكم JSON منظمًا
ولا تنجح إلا عندما يبلّغ النموذج عن دليل مرئي إيجابي؛ أما
الاستجابة السلبية التي تقتبس النص المستهدف فقط فتفشل التأكيد.
استخدم `--vision-mode metadata` لاختبار دخان بلا نموذج يثبت سطح المكتب،
والمتصفح، ولقطة الشاشة، ومسار الفيديو من دون استدعاء موفر فهم الصور.
التسجيل قطعة أثرية مطلوبة لـ `visual-task`؛ إذا لم يسجل Crabbox
ملف `visual-task.mp4` غير فارغ، تفشل المهمة حتى لو نجح المشغل المرئي.
عند الفشل، تحتفظ Mantis بعقد الإيجار لـ VNC ما لم تكن المهمة قد نجحت بالفعل
ولم يتم ضبط `--keep-lease`.

قبل استخدام بيانات الاعتماد الحية المجمعة، شغّل:

```bash
pnpm openclaw qa credentials doctor
```

يتحقق doctor من بيئة وسيط Convex، ويتحقق من صحة إعدادات نقطة النهاية، ويتحقق من إمكانية وصول admin/list عند وجود سر المشرف. لا يبلّغ إلا عن حالة الأسرار كمعيّنة/مفقودة.

## تغطية النقل الحي

تشترك مسارات النقل الحي في عقد واحد بدلًا من أن يخترع كل منها شكل قائمة سيناريوهات خاصًا به. `qa-channel` هو مجموعة سلوك المنتج الاصطناعية الواسعة وليس جزءًا من مصفوفة تغطية النقل الحي.

ينبغي لمشغلات النقل الحي استيراد معرّفات السيناريو المشتركة، ومساعدات
التغطية الأساسية، ومساعد اختيار السيناريو من
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| المسار     | كناري | بوابة الإشارات | بوت إلى بوت | حظر قائمة السماح | رد المستوى الأعلى | رد اقتباس | استئناف بعد إعادة التشغيل | متابعة السلسلة | عزل السلسلة | رصد التفاعلات | أمر المساعدة | تسجيل الأمر الأصلي |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

يحافظ هذا على `qa-channel` كمجموعة سلوك المنتج الواسعة بينما تشترك Matrix،
وTelegram، ووسائل النقل الحية الأخرى في قائمة تحقق صريحة لعقد النقل.

لمسار Linux VM مؤقت من دون إدخال Docker في مسار QA، شغّل:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

يشغّل هذا ضيف Multipass جديدًا، ويثبّت التبعيات، ويبني OpenClaw
داخل الضيف، ويشغّل `qa suite`، ثم ينسخ تقرير QA العادي والملخص
مرة أخرى إلى `.artifacts/qa-e2e/...` على المضيف.
يعيد استخدام سلوك اختيار السيناريو نفسه مثل `qa suite` على المضيف.
تنفذ عمليات تشغيل المجموعة على المضيف وMultipass عدة سيناريوهات محددة بالتوازي
مع عمال Gateway معزولين افتراضيًا. يتخذ `qa-channel` التوازي
4 افتراضيًا، مع حد أقصى يساوي عدد السيناريوهات المحددة. استخدم `--concurrency <count>` لضبط
عدد العمال، أو `--concurrency 1` للتنفيذ التسلسلي.
استخدم `--pack personal-agent` لتشغيل حزمة معيار المساعد الشخصي. محدد
الحزمة إضافي مع علامات `--scenario` المتكررة: تعمل السيناريوهات الصريحة
أولًا، ثم تعمل سيناريوهات الحزمة بترتيب الحزمة مع إزالة التكرارات.
استخدم `--pack observability` عندما يوفر مشغل QA مخصص بالفعل
إعداد مجمّع OpenTelemetry ويريد اختيار سيناريوهات دخان تشخيص
OpenTelemetry وPrometheus معًا.
يخرج الأمر برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
تريد القطع الأثرية من دون رمز خروج فاشل.
تمرر عمليات التشغيل الحية مدخلات مصادقة QA المدعومة العملية للضيف:
مفاتيح الموفر المستندة إلى البيئة، ومسار تكوين موفر QA الحي، و
`CODEX_HOME` عند وجوده. أبقِ `--output-dir` تحت جذر المستودع حتى يتمكن الضيف
من الكتابة مرة أخرى عبر مساحة العمل المركبة.

## مرجع ضمان الجودة في Telegram وDiscord وSlack وWhatsApp

تملك Matrix [صفحة مخصصة](/ar/concepts/qa-matrix) بسبب عدد سيناريوهاتها وتوفير خادم منزلي مدعوم من Docker. تعمل Telegram وDiscord وSlack وWhatsApp مقابل وسائل نقل حقيقية موجودة مسبقًا، لذلك يوجد مرجعها هنا.

### أعلام CLI المشتركة

تُسجَّل هذه المسارات عبر `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` وتقبل الأعلام نفسها:

| العلم                                  | الافتراضي                                            | الوصف                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | شغّل هذا السيناريو فقط. قابل للتكرار.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | مكان كتابة التقارير والملخصات والأدلة والآثار الخاصة بوسيلة النقل وسجل الإخراج. تُحلّ المسارات النسبية مقابل `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | جذر المستودع عند الاستدعاء من cwd محايد.                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | معرّف حساب مؤقت داخل إعداد Gateway لضمان الجودة.                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` أو `live-frontier` (ما زال `live-openai` القديم يعمل).                                                                            |
| `--model <ref>` / `--alt-model <ref>` | الافتراضي للمزوّد                                   | مراجع النموذج الأساسية/البديلة.                                                                                                                   |
| `--fast`                              | متوقف                                                | وضع المزوّد السريع حيثما كان مدعومًا.                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | راجع [مجمّع بيانات اعتماد Convex](#convex-credential-pool).                                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` في CI، و`maintainer` خلاف ذلك                 | الدور المستخدم عندما تكون `--credential-source convex`.                                                                                                    |

يخرج كل مسار برمز غير صفري عند فشل أي سيناريو. يكتب `--allow-failures` الآثار دون تعيين رمز خروج فاشل.

### ضمان جودة Telegram

```bash
pnpm openclaw qa telegram
```

يستهدف مجموعة Telegram خاصة حقيقية واحدة مع بوتين مميزين (المشغّل + SUT). يجب أن يكون لبوت SUT اسم مستخدم في Telegram؛ وتعمل ملاحظة بوت إلى بوت بأفضل شكل عندما يكون لدى كلا البوتين **وضع اتصال بوت إلى بوت** مفعّلًا في `@BotFather`.

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

تغطي المجموعة الافتراضية الضمنية دائمًا سيناريو canary، وبوابة الإشارات، وردود الأوامر الأصلية، وعنونة الأوامر، وردود مجموعة بوت إلى بوت. تتضمن افتراضيات `mock-openai` أيضًا فحوصات حتمية لسلسلة الردود وتدفق الرسالة النهائية. يبقى `telegram-current-session-status-tool` اختياريًا لأنه لا يكون مستقرًا إلا عند تسلسله مباشرة بعد canary، وليس بعد ردود أوامر أصلية عشوائية. استخدم `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` لطباعة التقسيم الحالي بين الافتراضي/الاختياري مع مراجع الانحدار.

آثار الإخراج:

- `telegram-qa-report.md`
- `qa-evidence.json` - إدخالات أدلة لفحوصات وسيلة النقل الحية، بما في ذلك حقول الملف الشخصي والتغطية والمزوّد والقناة والآثار والنتيجة وRTT.

تستخدم عمليات تشغيل حزمة Telegram عقد بيانات اعتماد Telegram نفسه. يُعد قياس RTT المتكرر جزءًا من مسار Telegram الحي العادي للحزمة؛ وتُدمج توزيعة RTT في `qa-evidence.json` ضمن `result.timing` لفحص RTT المحدد.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

عند تعيين `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`، يستأجر مغلّف الحزمة الحية بيانات اعتماد `kind: "telegram"`، ويصدّر متغيرات بيئة المجموعة/المشغّل/بوت SUT المستأجرة إلى تشغيل الحزمة المثبّتة، ويرسل Heartbeat لعقد الإيجار، ويحرره عند إيقاف التشغيل. يفترض مغلّف الحزمة 20 فحص RTT لـ`telegram-mentioned-message-reply`، ومهلة RTT قدرها 30 ثانية، ودور Convex `maintainer` خارج CI عند اختيار Convex. تجاوز `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES` أو `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` أو `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` لضبط قياس RTT دون إنشاء أمر RTT منفصل أو تنسيق ملخص خاص بـTelegram.

### ضمان جودة Discord

```bash
pnpm openclaw qa discord
```

يستهدف قناة نقابة Discord خاصة حقيقية واحدة مع بوتين: بوت مشغّل يتحكم به الحزام وبوت SUT يبدأه Gateway الفرعي لـOpenClaw عبر Plugin Discord المضمّن. يتحقق من التعامل مع إشارات القناة، ومن أن بوت SUT سجّل أمر `/help` الأصلي مع Discord، ومن سيناريوهات أدلة Mantis الاختيارية.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - يجب أن يطابق معرّف مستخدم بوت SUT الذي يرجعه Discord (وإلا يفشل المسار بسرعة).

اختياري:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` يبقي متون الرسائل في آثار الرسائل المرصودة.
- يحدد `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` قناة الصوت/المنصة لـ`discord-voice-autojoin`؛ وبدونه، يختار السيناريو أول قناة صوت/منصة مرئية لبوت SUT.

السيناريوهات (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - سيناريو صوت اختياري. يعمل بمفرده، ويمكّن `channels.discord.voice.autoJoin`، ويتحقق من أن حالة صوت Discord الحالية لبوت SUT هي قناة الصوت/المنصة الهدف. قد تتضمن بيانات اعتماد Convex لـDiscord قيمة `voiceChannelId` اختيارية؛ وإلا يكتشف المشغّل أول قناة صوت/منصة مرئية في النقابة.
- `discord-status-reactions-tool-only` - سيناريو Mantis اختياري. يعمل بمفرده لأنه يحوّل SUT إلى ردود نقابة دائمة التشغيل وتعتمد على الأدوات فقط مع `messages.statusReactions.enabled=true`، ثم يلتقط خطًا زمنيًا للتفاعلات عبر REST بالإضافة إلى آثار مرئية HTML/PNG. كما تحفظ تقارير Mantis قبل/بعد آثار MP4 المقدمة من السيناريو باسم `baseline.mp4` و`candidate.mp4`.

شغّل سيناريو الانضمام التلقائي لصوت Discord صراحةً:

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
- `qa-evidence.json` - إدخالات أدلة لفحوصات وسيلة النقل الحية.
- `discord-qa-observed-messages.json` - تُنقّح المتون ما لم تكن `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` و`discord-status-reactions-tool-only-timeline.png` عند تشغيل سيناريو تفاعل الحالة.

### ضمان جودة Slack

```bash
pnpm openclaw qa slack
```

يستهدف قناة Slack خاصة حقيقية واحدة مع بوتين مميزين: بوت مشغّل يتحكم به الحزام وبوت SUT يبدأه Gateway الفرعي لـOpenClaw عبر Plugin Slack المضمّن.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختياري:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` يبقي متون الرسائل في آثار الرسائل المرصودة.
- يفعّل `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` نقاط تحقق موافقة مرئية لـMantis. يكتب المشغّل `<scenario>.pending.json` و`<scenario>.resolved.json`، ثم ينتظر ملفات `.ack.json` المطابقة.
- يتجاوز `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` مهلة إقرار نقطة التحقق. الافتراضي هو `120000`.

السيناريوهات (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - سيناريو موافقة تنفيذ Slack أصلية اختياري.
  يطلب موافقة تنفيذ عبر Gateway، ويتحقق من أن رسالة Slack تحتوي على أزرار موافقة أصلية، ويحلها، ثم يتحقق من تحديث Slack المحلول.
- `slack-approval-plugin-native` - سيناريو موافقة Plugin Slack أصلية اختياري.
  يفعّل تمرير موافقات التنفيذ والPlugin معًا حتى لا تُحجب أحداث الPlugin بتوجيه موافقة التنفيذ، ثم يتحقق من مسار واجهة Slack الأصلية نفسه للحالة المعلقة/المحلولة.

آثار الإخراج:

- `slack-qa-report.md`
- `qa-evidence.json` - إدخالات أدلة لفحوصات وسيلة النقل الحية.
- `slack-qa-observed-messages.json` - تُنقّح المتون ما لم تكن `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - فقط عندما يعيّن Mantis
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`؛ يحتوي على JSON نقطة التحقق،
  وJSON الإقرار، ولقطات شاشة معلقة/محلولة.

#### إعداد مساحة عمل Slack

يحتاج المسار إلى تطبيقَي Slack مميزين في مساحة عمل واحدة، بالإضافة إلى قناة يكون كلا البوتين عضوين فيها:

- `channelId` - معرّف `Cxxxxxxxxxx` لقناة دُعي إليها كلا البوتين. استخدم قناة مخصصة؛ ينشر المسار في كل تشغيل.
- `driverBotToken` - رمز البوت (`xoxb-...`) لتطبيق **المشغّل**.
- `sutBotToken` - رمز البوت (`xoxb-...`) لتطبيق **SUT**، والذي يجب أن يكون تطبيق Slack منفصلًا عن المشغّل حتى يكون معرّف مستخدم البوت الخاص به مميزًا.
- `sutAppToken` - رمز على مستوى التطبيق (`xapp-...`) لتطبيق SUT مع `connections:write`، ويستخدمه Socket Mode حتى يتمكن تطبيق SUT من تلقي الأحداث.

فضّل مساحة عمل Slack مخصصة لضمان الجودة على إعادة استخدام مساحة عمل إنتاجية.

يضيق بيان SUT أدناه عمدًا تثبيت Plugin Slack المضمّن للإنتاج (`extensions/slack/src/setup-shared.ts:10`) إلى الأذونات والأحداث التي تغطيها مجموعة ضمان جودة Slack الحية. لإعداد قناة الإنتاج كما يراها المستخدمون، راجع [إعداد قناة Slack السريع](/ar/channels/slack#quick-setup)؛ زوج المشغّل/SUT لضمان الجودة منفصل عمدًا لأن المسار يحتاج إلى معرّفَي مستخدم بوت مميزين في مساحة عمل واحدة.

**1. أنشئ تطبيق المشغّل**

انتقل إلى [api.slack.com/apps](https://api.slack.com/apps) → _إنشاء تطبيق جديد_ → _من ملف بيان_ → اختر مساحة عمل ضمان الجودة، والصق ملف البيان التالي، ثم _التثبيت في مساحة العمل_:

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

انسخ _رمز OAuth لمستخدم البوت_ (`xoxb-...`) - وسيصبح هذا `driverBotToken`. لا يحتاج المشغّل إلا إلى نشر الرسائل والتعريف بنفسه؛ لا أحداث، ولا Socket Mode.

**2. إنشاء تطبيق SUT**

كرّر _إنشاء تطبيق جديد → من ملف بيان_ في مساحة العمل نفسها. يستخدم تطبيق ضمان الجودة هذا عمداً إصداراً أضيق من ملف بيان الإنتاج الخاص بـ Plugin Slack المضمّن (`extensions/slack/src/setup-shared.ts:10`): حُذفت نطاقات وأحداث التفاعلات لأن مجموعة ضمان جودة Slack الحية لا تغطي معالجة التفاعلات بعد.

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

- _التثبيت في مساحة العمل_ → انسخ _رمز OAuth لمستخدم البوت_ → وسيصبح هذا `sutBotToken`.
- _المعلومات الأساسية → الرموز على مستوى التطبيق → إنشاء رمز ونطاقات_ → أضف النطاق `connections:write` → احفظ → انسخ القيمة `xapp-...` → وستصبح هذه `sutAppToken`.

تحقق من أن للبوتين معرفَي مستخدم مختلفين عبر استدعاء `auth.test` على كل رمز. يميّز وقت التشغيل بين المشغّل وSUT حسب معرف المستخدم؛ وستفشل إعادة استخدام تطبيق واحد لكليهما عند بوابة الإشارة فوراً.

**3. إنشاء القناة**

في مساحة عمل ضمان الجودة، أنشئ قناة (مثلاً `#openclaw-qa`) وادعُ البوتين كليهما من داخل القناة:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

انسخ معرف `Cxxxxxxxxxx` من _معلومات القناة → حول → معرف القناة_ - وسيصبح هذا `channelId`. تصلح قناة عامة؛ وإذا استخدمت قناة خاصة، فالتطبيقان لديهما بالفعل `groups:history`، لذا ستظل قراءات السجل الخاصة بالحزمة تنجح.

**4. تسجيل بيانات الاعتماد**

هناك خياران. استخدم متغيرات البيئة لتصحيح الأخطاء على جهاز واحد (عيّن متغيرات `OPENCLAW_QA_SLACK_*` الأربعة ومرّر `--credential-source env`)، أو ازرع مجموعة Convex المشتركة حتى يتمكن CI والمشرفون الآخرون من استئجارها.

بالنسبة إلى مجموعة Convex، اكتب الحقول الأربعة في ملف JSON:

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

توقّع `count: 1` و`status: "active"` ودون حقل `lease`.

**5. التحقق من البداية إلى النهاية**

شغّل المسار محلياً لتأكيد أن البوتين يستطيعان التحدث إلى بعضهما عبر الوسيط:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

يكتمل التشغيل الناجح في أقل بكثير من 30 ثانية، ويُظهر `slack-qa-report.md` كلاً من `slack-canary` و`slack-mention-gating` بالحالة `pass`. إذا علِق المسار لنحو 90 ثانية وخرج مع `Convex credential pool exhausted for kind "slack"`، فإما أن المجموعة فارغة أو أن كل صفوفها مستأجرة - سيخبرك `qa credentials list --kind slack --status all --json` بأي الحالتين.

### ضمان جودة WhatsApp

```bash
pnpm openclaw qa whatsapp
```

يستهدف حسابين مخصصين على WhatsApp Web: حساب مشغّل تتحكم به
الحزمة، وحساب SUT يبدأه Gateway الفرعي لـ OpenClaw من خلال
Plugin WhatsApp المضمّن.

البيئة المطلوبة عند استخدام `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

اختياري:

- يمكّن `OPENCLAW_QA_WHATSAPP_GROUP_JID` سيناريوهات المجموعات مثل
  `whatsapp-mention-gating` و`whatsapp-group-allowlist-block`.
- يحتفظ `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` بنصوص الرسائل في
  عناصر رسائل المراقبة.

فهرس السيناريوهات (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- خط الأساس وبوابة المجموعات: `whatsapp-canary`، `whatsapp-pairing-block`،
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
- الوسائط الواردة والرسائل المنظمة: `whatsapp-inbound-image-caption`،
  `whatsapp-audio-preflight`، `whatsapp-inbound-structured-messages`،
  `whatsapp-group-audio-gating`. ترسل هذه أحداث صورة وصوت
  ومستند وموقع وجهة اتصال وملصق حقيقية من WhatsApp عبر المشغّل.
- تغطية Gateway الصادرة وإجراءات الرسائل:
  `whatsapp-outbound-media-matrix`،
  `whatsapp-outbound-document-preserves-filename`، `whatsapp-outbound-poll`،
  `whatsapp-message-actions`.
- تغطية التحكم في الوصول: `whatsapp-access-control-dm-open`،
  `whatsapp-access-control-dm-disabled`، `whatsapp-access-control-group-open`،
  `whatsapp-access-control-group-disabled`، `whatsapp-group-allowlist-block`.
- الموافقات الأصلية: `whatsapp-approval-exec-deny-native`،
  `whatsapp-approval-exec-native`، `whatsapp-approval-exec-reaction-native`،
  `whatsapp-approval-plugin-native`.
- تفاعلات الحالة: `whatsapp-status-reactions`.

يحتوي الفهرس حالياً على 36 سيناريو. يُبقى مسار `live-frontier` الافتراضي
صغيراً عند 10 سيناريوهات لتغطية اختبار دخان سريعة. يشغّل مسار `mock-openai`
الافتراضي 31 سيناريو حتمياً عبر نقل WhatsApp الحقيقي مع محاكاة
مخرجات النموذج فقط. تبقى سيناريوهات الموافقة وبعض الفحوصات الأثقل أو الحاجبة
صريحة حسب معرف السيناريو.

يراقب مشغّل ضمان جودة WhatsApp أحداثاً حية منظمة (`text` و`media`
و`location` و`reaction` و`poll`) ويمكنه إرسال الوسائط والاستطلاعات
وجهات الاتصال والمواقع والملصقات فعلياً. يستورد QA Lab ذلك المشغّل عبر
سطح حزمة `@openclaw/whatsapp/api.js` بدلاً من الوصول إلى ملفات
وقت تشغيل WhatsApp الخاصة. يُنقّح محتوى الرسائل افتراضياً. تعمل تغطية
الاستطلاع الصادر ورفع الملف عبر استدعاءات Gateway حتمية من نوع `poll` و
`message.action` بدلاً من استدعاء الأدوات عبر مطالبة النموذج فقط.

عناصر الإخراج:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - إدخالات دليل لفحوصات النقل الحية.
- `whatsapp-qa-observed-messages.json` - النصوص منقّحة ما لم يكن `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### مجموعة بيانات اعتماد Convex

يمكن لمسارات Telegram وDiscord وSlack وWhatsApp استئجار بيانات اعتماد من مجموعة Convex مشتركة بدلاً من قراءة متغيرات البيئة أعلاه. مرّر `--credential-source convex` (أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)؛ يحصل QA Lab على استئجار حصري، ويرسل له Heartbeat طوال مدة التشغيل، ويحرره عند الإيقاف. أنواع المجموعة هي `"telegram"` و`"discord"` و`"slack"` و`"whatsapp"`.

أشكال الحمولة التي يتحقق منها الوسيط عند `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - يجب أن يكون `groupId` سلسلة معرف دردشة رقمية.
- مستخدم Telegram حقيقي (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - إثبات Mantis Telegram Desktop فقط. يجب ألا تحصل مسارات QA Lab العامة على هذا النوع.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - يجب أن تكون أرقام الهاتف سلاسل E.164 مميزة.

يمسك سير عمل إثبات Mantis Telegram Desktop باستئجار Convex
`telegram-user` حصري واحد لكل من مشغّل TDLib CLI وشاهد Telegram Desktop،
ثم يحرره بعد نشر الإثبات.

عندما يحتاج PR إلى فرق بصري حتمي، يمكن لـ Mantis استخدام رد النموذج
الوهمي نفسه على `main` وعلى رأس PR أثناء تغيّر منسّق Telegram أو طبقة
التسليم. تضبط افتراضات الالتقاط لتناسب تعليقات PR: فئة Crabbox قياسية،
تسجيل سطح مكتب بمعدل 24fps، وGIF للحركة بمعدل 24fps، وعرض معاينة 1920px.
ينبغي لتعليقات قبل/بعد أن تنشر حزمة نظيفة تحتوي على ملفات GIF المقصودة فقط.

يمكن لمسارات Slack استخدام المجموعة أيضاً. تتحقق أشكال حمولة Slack حالياً داخل مشغّل ضمان جودة Slack بدلاً من الوسيط؛ استخدم `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`، مع معرف قناة Slack مثل `Cxxxxxxxxxx`. راجع [إعداد مساحة عمل Slack](#setting-up-the-slack-workspace) لتوفير التطبيق والنطاقات.

توجد متغيرات البيئة التشغيلية وعقد نقطة نهاية وسيط Convex في [الاختبار → بيانات اعتماد Telegram المشتركة عبر Convex](/ar/help/testing#shared-telegram-credentials-via-convex-v1) (يسبق اسم القسم مجموعة القنوات المتعددة؛ دلالات الاستئجار مشتركة عبر الأنواع).

## بذور مدعومة بالمستودع

توجد أصول البذور في `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

هذه موجودة عمداً في git حتى تكون خطة ضمان الجودة مرئية لكل من البشر
والوكيل.

ينبغي أن يبقى `qa-lab` مشغّل سيناريوهات YAML عاماً. كل ملف سيناريو YAML هو
مصدر الحقيقة لتشغيل اختبار واحد، وينبغي أن يعرّف:

- `title` في المستوى الأعلى
- بيانات `scenario` الوصفية
- بيانات فئة وإمكانات ومسار ومخاطر اختيارية في `scenario`
- مراجع المستندات والكود في `scenario`
- متطلبات Plugin اختيارية في `scenario`
- رقعة إعداد Gateway اختيارية في `scenario`
- `flow` قابل للتنفيذ في المستوى الأعلى لسيناريوهات التدفق، أو `scenario.execution.kind` /
  `scenario.execution.path` لسيناريوهات Vitest وPlaywright

السطح القابل لإعادة الاستخدام في وقت التشغيل الذي يدعم `flow` مسموح له بالبقاء عامًا
وعابرًا للاهتمامات. على سبيل المثال، يمكن لسيناريوهات YAML أن تجمع بين مساعدات جهة النقل
ومساعدات جهة المتصفح التي تشغّل Control UI المضمّن عبر منفذ Gateway `browser.request`
من دون إضافة مشغّل حالة خاصة.

ينبغي تجميع ملفات السيناريو حسب قدرة المنتج لا حسب مجلد شجرة المصدر.
أبقِ معرّفات السيناريوهات مستقرة عند نقل الملفات؛ واستخدم `docsRefs` و`codeRefs`
لتتبّع التنفيذ.

ينبغي أن تبقى قائمة الأساس واسعة بما يكفي لتغطية:

- محادثات الرسائل المباشرة والقنوات
- سلوك السلاسل
- دورة حياة إجراء الرسالة
- استدعاءات cron
- استرجاع الذاكرة
- تبديل النماذج
- تسليم العمل إلى الوكيل الفرعي
- قراءة المستودعات وقراءة الوثائق
- مهمة بناء صغيرة واحدة مثل Lobster Invaders

## مسارات محاكاة المزوّد

يحتوي `qa suite` على مسارين محليين لمحاكاة المزوّد:

- `mock-openai` هو محاكي OpenClaw الواعي بالسيناريو. يظل مسار المحاكاة الحتمي الافتراضي
  لضمان الجودة المدعوم بالمستودع وبوابات التكافؤ.
- `aimock` يشغّل خادم مزوّد مدعومًا بـ AIMock لتغطية البروتوكول التجريبي
  والتجهيزات والتسجيل/إعادة التشغيل والفوضى. وهو إضافة ولا يستبدل
  موزّع سيناريوهات `mock-openai`.

يوجد تنفيذ مسار المزوّد ضمن `extensions/qa-lab/src/providers/`.
يمتلك كل مزوّد إعداداته الافتراضية، وبدء تشغيل الخادم المحلي، وتكوين نموذج Gateway،
واحتياجات تمهيد ملف تعريف المصادقة، ورايات قدرات التشغيل الحي/المحاكاة. ينبغي أن تمر
أكواد الحزمة وGateway المشتركة عبر سجل المزوّدين بدلًا من التفريع على
أسماء المزوّدين.

## محوّلات النقل

يمتلك `qa-lab` منفذ نقل عامًا لسيناريوهات ضمان الجودة YAML. `qa-channel` هو
الافتراضي الاصطناعي. يبدأ `crabline` خوادم محلية بشكل المزوّد ويشغّل
Plugin القنوات العادية في OpenClaw عليها. `live` محجوز لبيانات اعتماد المزوّد
الحقيقية والقنوات الخارجية.

على مستوى البنية، يكون التقسيم كالتالي:

- يمتلك `qa-lab` تنفيذ السيناريو العام، وتزامن العمال، وكتابة الأثر، والتقارير.
- يمتلك محوّل النقل تكوين Gateway، والجاهزية، ومراقبة الوارد والصادر، وإجراءات النقل، وحالة النقل المطبّعة.
- تعرّف ملفات سيناريوهات YAML ضمن `qa/scenarios/` تشغيل الاختبار؛ ويوفر `qa-lab` السطح القابل لإعادة الاستخدام في وقت التشغيل الذي ينفّذها.

### إضافة قناة

تتطلب إضافة قناة إلى نظام ضمان الجودة YAML تنفيذ القناة بالإضافة إلى
حزمة سيناريوهات تختبر عقد القناة. لتغطية CI الدخانية، أضف
خادم المزوّد المحلي Crabline المطابق واكشفه عبر مشغّل `crabline`.

لا تضف جذر أمر QA علويًا جديدًا عندما يستطيع مضيف `qa-lab` المشترك امتلاك التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر أمر `openclaw qa`
- بدء الحزمة وإنهاؤها
- تزامن العمال
- كتابة الأثر
- إنشاء التقارير
- تنفيذ السيناريو
- الأسماء المستعارة للتوافق مع سيناريوهات `qa-channel` الأقدم

تمتلك Plugins المشغّلات عقد النقل:

- كيف يُثبّت `openclaw qa <runner>` تحت جذر `qa` المشترك
- كيف يُكوّن Gateway لذلك النقل
- كيف تُفحص الجاهزية
- كيف تُحقن الأحداث الواردة
- كيف تُراقب الرسائل الصادرة
- كيف تُكشف النصوص وحالة النقل المطبّعة
- كيف تُنفّذ الإجراءات المدعومة بالنقل
- كيف يُعالَج إعادة الضبط أو التنظيف الخاص بالنقل

الحد الأدنى لاعتماد قناة جديدة:

1. أبقِ `qa-lab` مالكًا لجذر `qa` المشترك.
2. نفّذ مشغّل النقل على منفذ مضيف `qa-lab` المشترك.
3. أبقِ الآليات الخاصة بالنقل داخل Plugin المشغّل أو عدة القناة.
4. ثبّت المشغّل باسم `openclaw qa <runner>` بدلًا من تسجيل أمر جذر منافس. ينبغي أن تعلن Plugins المشغّلات عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`. أبقِ `runtime-api.ts` خفيفًا؛ وينبغي أن يبقى تنفيذ CLI الكسول والمشغّل خلف نقاط دخول منفصلة.
5. أنشئ أو كيّف سيناريوهات YAML ضمن أدلة `qa/scenarios/` الموضوعية.
6. استخدم مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. أبقِ الأسماء المستعارة للتوافق الحالية عاملة ما لم يكن المستودع يجري ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا أمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقِه في Plugin ذلك المشغّل أو عدة Plugin.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن لأكثر من قناة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة في `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بالنقل واجعل ذلك صريحًا في عقد السيناريو.

### أسماء مساعدي السيناريو

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

تبقى الأسماء المستعارة للتوافق متاحة للسيناريوهات الحالية - `waitForQaChannelReady`، و`waitForOutboundMessage`، و`waitForNoOutbound`، و`formatConversationTranscript`، و`resetBus` - لكن ينبغي أن تستخدم كتابة السيناريوهات الجديدة الأسماء العامة. توجد الأسماء المستعارة لتجنب ترحيل يوم مفاجئ شامل، لا كنموذج للمضي قدمًا.

## التقارير

يصدّر `qa-lab` تقرير بروتوكول Markdown من الخط الزمني للحافلة المرصودة.
ينبغي أن يجيب التقرير عن:

- ما الذي نجح
- ما الذي فشل
- ما الذي بقي محظورًا
- ما سيناريوهات المتابعة الجديرة بالإضافة

لجرد السيناريوهات المتاحة - وهو مفيد عند تقدير حجم عمل المتابعة أو توصيل نقل جديد - شغّل `pnpm openclaw qa coverage` (أضف `--json` للحصول على مخرجات قابلة للقراءة آليًا).
عند اختيار إثبات مركز لسلوك أو مسار ملف تم لمسه، شغّل `pnpm openclaw qa coverage --match <query>`.
يبحث تقرير المطابقة في بيانات السيناريو الوصفية، ومراجع الوثائق، ومراجع الكود، ومعرّفات التغطية، وPlugins، ومتطلبات المزوّد، ثم يطبع أهداف `qa suite --scenario ...` المطابقة.
يكتب كل تشغيل لـ `qa suite` آثار `qa-evidence.json`،
و`qa-suite-summary.json`، و`qa-suite-report.md` في المستوى العلوي لمجموعة
السيناريوهات المحددة. تشغّل السيناريوهات التي تعلن `execution.kind: vitest` أو
`execution.kind: playwright` مسار الاختبار المطابق وتكتب أيضًا
سجلات لكل سيناريو. وتشغّل السيناريوهات التي تعلن `execution.kind: script`
منتج الأدلة في `execution.path` عبر `node --import tsx` (مع
توسيع `${outputDir}` و`${scenarioId}` في `execution.args`)؛ يكتب المنتج
ملف `qa-evidence.json` الخاص به، وتُستورد إدخالاته إلى مخرجات الحزمة
وتُحل مسارات آثاره نسبةً إلى `qa-evidence.json` الخاص بذلك المنتج.
عند الوصول إلى `qa suite` عبر
`qa run --qa-profile`، يتضمن ملف `qa-evidence.json` نفسه أيضًا ملخص
بطاقة درجات الملف الشخصي لفئات التصنيف المحددة.
عامله كأداة اكتشاف، لا كبديل للبوابة؛ لا يزال السيناريو المحدد يحتاج إلى وضع المزوّد الصحيح، أو النقل الحي، أو Multipass، أو Testbox، أو مسار الإصدار للسلوك قيد الاختبار.
لسياق بطاقة الدرجات، راجع [بطاقة درجات النضج](/ar/maturity/scorecard).

لفحوصات الشخصية والأسلوب، شغّل السيناريو نفسه عبر عدة مراجع نماذج حية
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

يشغّل الأمر عمليات فرعية محلية لـ QA gateway، وليس Docker. ينبغي لسيناريوهات تقييم الشخصية
أن تضبط الشخصية عبر `SOUL.md`، ثم تشغّل جولات مستخدم عادية
مثل الدردشة، ومساعدة مساحة العمل، ومهام الملفات الصغيرة. لا ينبغي إخبار النموذج المرشح
بأنه يخضع للتقييم. يحفظ الأمر كل نص كامل،
ويسجل إحصاءات التشغيل الأساسية، ثم يطلب من نماذج التحكيم في الوضع السريع مع
استدلال `xhigh` حيث يكون مدعومًا ترتيب عمليات التشغيل حسب الطبيعية، والإحساس، والفكاهة.
استخدم `--blind-judge-models` عند مقارنة المزوّدين: لا تزال مطالبة التحكيم تحصل على
كل نص وحالة تشغيل، لكن تُستبدل مراجع المرشحين بتسميات محايدة
مثل `candidate-01`؛ ويعيد التقرير ربط الترتيبات بالمراجع الحقيقية بعد
التحليل.
تعمل عمليات المرشحين افتراضيًا بتفكير `high`، مع `medium` لـ GPT-5.5 و`xhigh`
لمراجع تقييم OpenAI الأقدم التي تدعم ذلك. تجاوز مرشحًا محددًا ضمنيًا باستخدام
`--model provider/model,thinking=<level>`. لا يزال `--thinking <level>` يضبط
احتياطيًا عامًا، ويُحافظ على الصيغة الأقدم `--model-thinking <provider/model=level>`
للتوافق.
تستخدم مراجع مرشحي OpenAI الوضع السريع افتراضيًا بحيث تُستخدم المعالجة ذات الأولوية حيث
يدعمها المزوّد. أضف `,fast` أو `,no-fast` أو `,fast=false` ضمنيًا عندما يحتاج
مرشح واحد أو محكّم واحد إلى تجاوز. مرّر `--fast` فقط عندما تريد
فرض الوضع السريع على كل نموذج مرشح. تُسجل مدد المرشحين والمحكمين
في التقرير لتحليل المعايير، لكن مطالبات التحكيم تنص صراحةً
على عدم الترتيب حسب السرعة.
تعمل عمليات نماذج المرشحين والمحكمين افتراضيًا بتزامن 16. خفّض
`--concurrency` أو `--judge-concurrency` عندما تجعل حدود المزوّد أو ضغط Gateway
المحلي التشغيل كثير الضجيج.
عند عدم تمرير أي مرشح `--model`، يستخدم تقييم الشخصية افتراضيًا
`openai/gpt-5.5`، و`openai/gpt-5.2`، و`openai/gpt-5`، و`anthropic/claude-opus-4-8`،
و`anthropic/claude-sonnet-4-6`، و`zai/glm-5.1`،
و`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` عند عدم تمرير أي `--model`.
عند عدم تمرير أي `--judge-model`، يستخدم المحكمون افتراضيًا
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-8,thinking=high`.

## الوثائق ذات الصلة

- [Matrix QA](/ar/concepts/qa-matrix)
- [بطاقة درجات النضج](/ar/maturity/scorecard)
- [حزمة معايير الوكيل الشخصي](/ar/concepts/personal-agent-benchmark-pack)
- [قناة QA](/ar/channels/qa-channel)
- [الاختبار](/ar/help/testing)
- [لوحة التحكم](/ar/web/dashboard)
