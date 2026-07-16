---
doc-schema-version: 1
read_when:
    - فهم كيفية تكامل مكوّنات حزمة ضمان الجودة معًا
    - توسيع qa-lab أو qa-channel أو محوّل نقل
    - إضافة سيناريوهات ضمان الجودة المدعومة بالمستودع
    - بناء أتمتة لضمان الجودة بواقعية أعلى حول لوحة معلومات Gateway
summary: 'نظرة عامة على منظومة ضمان الجودة: qa-lab وqa-channel والسيناريوهات المدعومة بالمستودع ومسارات النقل المباشر ومهايئات النقل وإعداد التقارير.'
title: نظرة عامة على ضمان الجودة
x-i18n:
    generated_at: "2026-07-16T14:10:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dcb506cedb57289f29938eb55b5f11ceedfaabba88364dce8249116010ce859
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

تختبر حزمة ضمان الجودة الخاصة OpenClaw بطريقة واقعية تحاكي القنوات، وهو ما
لا يستطيع اختبار الوحدة فعله.

المكوّنات:

- `extensions/qa-channel`: قناة رسائل اصطناعية بواجهات للرسائل المباشرة والقنوات وسلاسل المحادثات
  والتفاعلات والتعديل والحذف.
- `extensions/qa-lab`: واجهة مستخدم لتصحيح الأخطاء، وناقل ضمان الجودة، وملفات تعريف للسيناريوهات، ومحوّلات نقل
  حية لمراقبة النص المنسوخ، وحقن الرسائل الواردة،
  وتصدير تقرير Markdown.
- `qa/`: أصول أولية مدعومة بالمستودع لمهمة البدء وسيناريوهات ضمان الجودة
  الأساسية.
- [Mantis](/ar/concepts/mantis): تحقق حي قبل/بعد للأخطاء التي
  تتطلب وسائل نقل حقيقية، ولقطات شاشة للمتصفح، وحالة آلة افتراضية، وأدلة طلب السحب.

## واجهة الأوامر

يعمل كل تدفق لضمان الجودة ضمن `pnpm openclaw qa <subcommand>`. وللكثير منها أسماء مستعارة
للبرامج النصية ضمن `pnpm qa:*`؛ ويعمل كلا الشكلين.

| الأمر                                               | الغرض                                                                                                                                                                                                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | فحص ذاتي مضمن لضمان الجودة من دون `--qa-profile`؛ مشغّل ملفات تعريف النضج المدعوم بالتصنيف باستخدام `--qa-profile smoke-ci` أو `--qa-profile release` أو `--qa-profile all`.                                                                                                  |
| `qa suite`                                          | تشغيل السيناريوهات المدعومة بالمستودع مقابل مسار Gateway لضمان الجودة. يستخدم `--runner multipass` آلة Linux افتراضية مؤقتة بدلًا من المضيف.                                                                                                                                         |
| `qa coverage`                                       | طباعة مخزون تغطية السيناريوهات بصيغة YAML ‏(`--json` للمخرجات الآلية؛ و`--match <query>` للعثور على سيناريوهات لسلوك جرى تعديله؛ و`--tools` لتغطية تجهيزات أدوات وقت التشغيل).                                                                                  |
| `qa parity-report`                                  | مقارنة ملفي `qa-suite-summary.json` لبوابة تكافؤ على محور النموذج، أو استخدام `--runtime-axis --token-efficiency` لكتابة تقارير تكافؤ وقت التشغيل وكفاءة الرموز بين Codex وOpenClaw.                                                                          |
| `qa confidence-report`                              | تصنيف عناصر إثبات ضمان الجودة مقابل بيان لإنتاج تقرير ثقة خالٍ من العناصر المجهولة.                                                                                                                                                                               |
| `qa confidence-self-test`                           | كتابة مؤشرات ضبط سلبية أولية تثبت أن بوابة الثقة تكتشف الانحراف.                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | إعادة تشغيل نصوص JSONL المنسقة عبر مسخّر إعادة تشغيل تكافؤ وقت التشغيل.                                                                                                                                                                                         |
| `qa character-eval`                                 | تشغيل سيناريو ضمان جودة الشخصية عبر عدة نماذج حية مع تقرير خاضع للتقييم. راجع [إعداد التقارير](#reporting).                                                                                                                                                        |
| `qa manual`                                         | تشغيل مطالبة لمرة واحدة مقابل مسار المزوّد/النموذج المحدد.                                                                                                                                                                                                      |
| `qa ui`                                             | بدء واجهة مستخدم تصحيح أخطاء ضمان الجودة وناقل ضمان الجودة المحلي (الاسم المستعار: `pnpm qa:lab:ui`).                                                                                                                                                                                                |
| `qa docker-build-image`                             | بناء صورة Docker المجهزة مسبقًا لضمان الجودة.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | كتابة هيكل docker-compose للوحة معلومات ضمان الجودة مع مسار Gateway.                                                                                                                                                                                                |
| `qa up`                                             | بناء موقع ضمان الجودة، وبدء الحزمة المدعومة بـ Docker، وطباعة عنوان URL (الاسم المستعار: `pnpm qa:lab:up`؛ ويضيف متغير `:fast` الخيار `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                              |
| `qa aimock`                                         | بدء خادم مزوّد AIMock فقط.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | بدء خادم المزوّد `mock-openai` المدرك للسيناريوهات فقط.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | إدارة تجمّع بيانات اعتماد Convex المشترك.                                                                                                                                                                                                                           |
| `qa discord`                                        | مسار نقل حي مقابل قناة حقيقية في خادم Discord خاص.                                                                                                                                                                                                   |
| `qa matrix`                                         | ملفات تعريف Matrix في مختبر ضمان الجودة مقابل خادم Tuwunel منزلي مؤقت. راجع [مسارات اختبار Matrix الأولية](#matrix-smoke-lanes).                                                                                                                                                      |
| `qa slack`                                          | مسار نقل حي مقابل قناة Slack خاصة حقيقية.                                                                                                                                                                                                           |
| `qa telegram`                                       | مسار نقل حي مقابل مجموعة Telegram خاصة حقيقية.                                                                                                                                                                                                          |
| `qa whatsapp`                                       | مسار نقل حي مقابل حسابات WhatsApp Web حقيقية.                                                                                                                                                                                                             |
| `qa mantis`                                         | مشغّل تحقق قبل/بعد لأخطاء النقل الحي، مع دليل تفاعلات الحالة في Discord، واختبار Crabbox الأولي لسطح المكتب/المتصفح، واختبار Slack الأولي ضمن VNC. راجع [Mantis](/ar/concepts/mantis) و[دليل تشغيل Mantis لسطح مكتب Slack](/ar/concepts/mantis-slack-desktop-runbook). |

### `qa run` المدعوم بملفات التعريف

يقرأ `qa run` المدعوم بملفات التعريف العضوية من `taxonomy.yaml`، ثم يرسل
السيناريوهات المحلولة عبر `qa suite`. يرشّح `--surface` و`--category`
ملف التعريف المحدد بدلًا من تعريف مسارات منفصلة. يتضمن
`qa-evidence.json` الناتج ملخص بطاقة أداء لملف التعريف مع أعداد الفئات المحددة
ومعرّفات التغطية المفقودة؛ وتبقى إدخالات الأدلة الفردية
مصدر الحقيقة للاختبارات وأدوار التغطية والنتائج. معرّفات تغطية ميزات
التصنيف هي أهداف إثبات دقيقة وليست أسماء مستعارة: تحقق تغطية السيناريو الأساسية
المعرّفات المطابقة، بينما تبقى التغطية الثانوية استشارية. تستخدم معرّفات التغطية
صيغة `namespace.behavior` المنقطة مع مقاطع من أحرف أبجدية رقمية صغيرة/شرطات؛
وقد تظل معرّفات ملف التعريف والسطح والفئة تستخدم معرّفات
التصنيف الحالية ذات الشرطات أو النقاط.

تحذف الأدلة الموجزة `execution` لكل إدخال وتضبط `evidenceMode: "slim"`؛
يستخدم `smoke-ci` الوضع الموجز افتراضيًا، ويستعيد `--evidence-mode full` الإدخالات الكاملة:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

استخدم `smoke-ci` لإثبات حتمي لملف التعريف باستخدام مزوّدي نماذج وهميين وخوادم
مزوّد Crabline المحلية. استخدم `release` لإثبات Stable/LTS مقابل
القنوات الحية. استخدم `all` فقط لتشغيل أدلة التصنيف الكامل صراحةً؛ فهو
يحدد كل فئة نضج نشطة ويمكن إرساله عبر سير عمل GitHub Actions ‏`QA
Profile Evidence` باستخدام `qa_profile=all`. عندما يحتاج
أمر أيضًا إلى ملف تعريف جذري لـ OpenClaw، ضع ملف التعريف الجذري قبل
أمر ضمان الجودة:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## تدفق المشغّل

تدفق مشغّل ضمان الجودة الحالي هو موقع ضمان جودة ذو لوحتين:

- اليسار: لوحة معلومات Gateway ‏(واجهة التحكم) مع الوكيل.
- اليمين: مختبر ضمان الجودة، ويعرض النص المنسوخ المشابه لـ Slack وخطة السيناريو.

شغّله باستخدام:

```bash
pnpm qa:lab:up
```

يبني ذلك موقع ضمان الجودة، ويبدأ مسار Gateway المدعوم بـ Docker، ويعرض
صفحة مختبر ضمان الجودة حيث يمكن لمشغّل أو حلقة أتمتة إسناد مهمة ضمان جودة
إلى الوكيل، ومراقبة سلوك القناة الحقيقي، وتسجيل ما نجح أو فشل أو
ظل محظورًا.

لتكرار أسرع لواجهة مستخدم مختبر ضمان الجودة دون إعادة بناء صورة Docker في كل مرة،
ابدأ الحزمة باستخدام حزمة مختبر ضمان الجودة موصولة عبر ربط:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

يبقي `qa:lab:up:fast` خدمات Docker على صورة مبنية مسبقًا
ويربط `extensions/qa-lab/web/dist` داخل حاوية `qa-lab`.
يعيد `qa:lab:watch` بناء تلك الحزمة عند التغيير، ويُعاد تحميل المتصفح تلقائيًا
عند تغيّر تجزئة أصل مختبر ضمان الجودة.

### اختبارات قابلية المراقبة الأولية

<Note>
يبقى ضمان جودة قابلية المراقبة مقتصرًا على نسخة المصدر المستخرجة. يحذف ملف npm المضغوط عمدًا
مختبر ضمان الجودة (و`qa-channel`)؛ لذلك لا تشغّل مسارات إصدار Docker للحزمة
أوامر `qa`. شغّلها من نسخة مصدر مبنية عند
تغيير أدوات التشخيص.
</Note>

| الاسم المستعار                           | ما الذي يشغّله                                                                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | مستقبِل OpenTelemetry محلي بالإضافة إلى سيناريو `otel-trace-smoke` مع تمكين `diagnostics-otel`.                                      |
| `pnpm qa:otel:collector-smoke`          | المسار نفسه خلف حاوية Docker فعلية لـ OpenTelemetry Collector. استخدمه عند تغيير توصيل نقاط النهاية أو توافق المجمّع/OTLP. |
| `pnpm qa:prometheus:smoke`              | سيناريو `docker-prometheus-smoke` مع تمكين `diagnostics-prometheus`.                                                           |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` متبوعًا بـ `qa:prometheus:smoke`.                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` متبوعًا بـ `qa:prometheus:smoke`.                                                                            |

يبدأ `qa:otel:smoke` مستقبِل OTLP/HTTP محليًا، ويشغّل دورة وكيل
مصغّرة لقناة QA، ثم يتحقق من تصدير التتبعات والمقاييس والسجلات. ويفك ترميز
امتدادات التتبع المصدّرة بتنسيق protobuf ويتحقق من البنية الحرجة للإصدار:
يجب أن تكون `openclaw.run` و`openclaw.harness.run` وامتداد استدعاء نموذج
وفق أحدث اصطلاح دلالي لـ GenAI و`openclaw.context.assembled` و`openclaw.message.delivery`
كلها موجودة. يفرض اختبار الدخان
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`، لذا يجب أن يستخدم امتداد استدعاء
النموذج الاسم `{gen_ai.operation.name} {gen_ai.request.model}`؛ ويجب ألا تصدّر
استدعاءات النموذج `StreamAbandoned` في الدورات الناجحة؛ كما يجب أن تظل معرّفات
التشخيص الخام وسمات `openclaw.content.*` خارج التتبع. تطلب مطالبة السيناريو
من النموذج الرد بعلامة ثابتة وحجب سلسلة
سرية ثابتة؛ ويجب ألا تحتوي حمولات OTLP الخام على أيٍّ منهما، ولا على مفتاح جلسة
QA المشتق من معرّف السيناريو. ويكتب `otel-smoke-summary.json`
بجوار عناصر مجموعة QA.

يتحقق `qa:prometheus:smoke` من رفض عمليات الاستخلاص غير المصادق عليها، ثم
يتحقق من أن الاستخلاص المصادق عليه يتضمن عائلات المقاييس الحرجة للإصدار
من دون محتوى المطالبة أو محتوى الاستجابة أو معرّفات التشخيص الخام أو رموز
المصادقة أو المسارات المحلية.

### مسارات اختبار الدخان لـ Matrix

لتشغيل مسار اختبار دخان فعلي للنقل في Matrix لا يتطلب بيانات اعتماد
موفّر النموذج، شغّل ملف تعريف الإصدار باستخدام موفّر OpenAI الحتمي الوهمي:

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

بالنسبة إلى مسار الموفّر الحدودي المباشر، قدّم بيانات اعتماد متوافقة مع OpenAI
صراحةً:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

يشغّل `pnpm openclaw qa matrix` العادي ملف تعريف `all` الكامل ويواصل بعد
إخفاقات السيناريوهات. استخدم `--fail-fast` لدورة ملاحظات أقصر، أو كرّر
`--scenario <id>` لتحديد سيناريوهات فردية؛ وتكون لمعرّفات السيناريوهات الصريحة
الأولوية على `--profile`.

| ملف التعريف | السيناريوهات | الغرض                                                                                                                                    |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | الكتالوج الكامل (الافتراضي).                                                                                                             |
| `release`    | 2         | خط الأساس للقناة الحرج للإصدار وإعادة تحميل قائمة السماح مباشرةً.                                                                        |
| `fast`       | 12        | تغطية مركّزة للمحادثات المتفرعة والتفاعلات والموافقات والسياسات وتقييد الروبوتات والردود المشفّرة.                                      |
| `transport`  | 50        | المحادثات المتفرعة، وتوجيه الرسائل المباشرة/الغرف، والانضمام التلقائي، والموافقات، والتفاعلات، وإعادات التشغيل، وسياسة الإشارات/قائمة السماح، والتعديلات، وترتيب الجهات الفاعلة المتعددة. |
| `media`      | 7         | تغطية الصور والصور المولّدة والصوت والمرفقات والوسائط غير المدعومة والوسائط المشفّرة.                                                     |
| `e2ee-smoke` | 8         | الحد الأدنى لتغطية الرد المشفّر والمحادثات المتفرعة والتمهيد والاسترداد وإعادة التشغيل والتنقيح والإخفاقات.                              |
| `e2ee-deep`  | 18        | فقدان الحالة والنسخ الاحتياطي واسترداد المفاتيح وسلامة الأجهزة والتحقق عبر SAS/QR/الرسائل المباشرة.                                     |
| `e2ee-cli`   | 9         | أوامر `openclaw matrix encryption setup` ومفتاح الاسترداد والحسابات المتعددة ورحلة Gateway ذهابًا وإيابًا والتحقق الذاتي عبر الحاضنة. |

توجد عضوية ملفات التعريف ومتطلبات القناة مع سيناريوهات Matrix التصريحية
ضمن `qa/scenarios/channels/`. يختار التشغيل برنامج تشغيل القناة.
وتوجد تطبيقاتها المباشرة ضمن
`extensions/qa-lab/src/live-transports/matrix/scenarios/`.

يوفّر المحوّل خادمًا منزليًا مؤقتًا من Tuwunel في Docker (الصورة الافتراضية
`ghcr.io/matrix-construct/tuwunel:v1.5.1`، واسم الخادم `matrix-qa.test`،
والمنفذ `28008`)، ويسجّل مستخدمين مؤقتين لبرنامج التشغيل والنظام قيد الاختبار والمراقب، ويجهّز
الغرف المطلوبة، ويسجّل حدود الطلب/الاستجابة المنقّحة. ثم
يشغّل Plugin Matrix الفعلي داخل Gateway QA فرعي مقيّد بذلك النقل
(من دون `qa-channel`) ويفكك البيئة.

الخيارات الشائعة:

| العلامة                  | القيمة الافتراضية | الغرض                                                                                 |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `--profile <profile>`    | `all`             | تحديد أحد ملفات التعريف أعلاه.                                                    |
| `--scenario <id>`        | -                 | تحديد سيناريو واحد؛ قابل للتكرار.                                                     |
| `--fail-fast`            | معطّل             | التوقف بعد أول عملية تحقق أو سيناريو فاشل.                                            |
| `--allow-failures`       | معطّل             | كتابة العناصر من دون إرجاع رمز خروج فاشل عند إخفاق السيناريوهات.                      |
| `--provider-mode <mode>` | `live-frontier`   | استخدام `mock-openai` للإرسال الحتمي أو `live-frontier` لموفّر مباشر. |
| `--model <ref>`          | افتراضي الموفّر    | تعيين مرجع `provider/model` الأساسي.                                          |
| `--alt-model <ref>`      | افتراضي الموفّر    | تعيين النموذج البديل الذي تستخدمه السيناريوهات التي تبدّل النماذج.                    |
| `--fast`                 | معطّل             | تمكين الوضع السريع للموفّر حيثما يكون مدعومًا.                                        |
| `--output-dir <path>`    | مولّد              | اختيار دليل التقرير؛ تُحل المسارات النسبية استنادًا إلى `--repo-root`.           |
| `--repo-root <path>`     | الدليل الحالي      | التشغيل من دليل عمل محايد.                                                            |
| `--sut-account <id>`     | `sut`             | تحديد معرّف حساب Matrix في إعدادات Gateway الفرعي.                            |

لا تستأجر QA الخاصة بـ Matrix بيانات اعتماد Matrix مشتركة: ينشئ المحوّل
مستخدمين مؤقتين محليًا، لذا لا يقبل `--credential-source` أو
`--credential-role`. تجاوز صورة الخادم المنزلي باستخدام
`OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`؛ واضبط عمليات التحقق السلبية من عدم الرد باستخدام
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (القيمة الافتراضية `8000`، وتُقيّد بمهلة
السيناريو النشط). عادةً ما يفرض الأمر أحادي التشغيل خروجًا نظيفًا بعد
تفريغ العناصر، لأن مقابض تشفير Matrix الأصلية قد تبقى بعد التنظيف؛ عيّن
`OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` فقط لحاضنة اختبار مباشرة
تحتاج إلى أن يعود الأمر بدلًا من ذلك.

يكتب كل تشغيل عناصر QA Lab العادية ضمن دليل الإخراج
المحدد: `qa-suite-report.md` و`qa-suite-summary.json` و`qa-evidence.json`
وبيان `matrix-harness-*/matrix-qa-harness.json` منقّح. إذا فشل
التنظيف، فشغّل أمر الاسترداد `docker compose ... down --remove-orphans`
المطبوع. على المشغّلات البطيئة، زِد نافذة عدم الرد؛ وفي CI السريع، يمكن لنافذة
أصغر تقصير عمليات التحقق السلبية.

تغطي السيناريوهات سلوك النقل الذي لا تستطيع اختبارات الوحدات إثباته من
البداية إلى النهاية: تقييد الإشارات، وسياسات السماح للروبوتات، وقوائم السماح، والردود
عالية المستوى والمتفرعة، وتوجيه الرسائل المباشرة، ومعالجة التفاعلات، ومنع
التعديلات الواردة، وإزالة تكرار إعادة التشغيل، والتعافي من انقطاع الخادم المنزلي،
وتسليم بيانات الموافقة الوصفية، ومعالجة الوسائط، وتدفقات تمهيد/استرداد/تحقق E2EE في Matrix. كما
يقود ملف تعريف CLI الخاص بـ E2EE أوامر `openclaw matrix encryption setup`
والتحقق عبر الخادم المنزلي المؤقت نفسه قبل التحقق من
ردود Gateway.

يظل `matrix-room-block-streaming` و`subagent-thread-spawn` متاحين عبر
تحديد `--scenario` صراحةً، لكنهما يبقيان خارج ملف تعريف `all` الافتراضي.

يستخدم CI سطح الأوامر نفسه في
`.github/workflows/qa-live-transports-convex.yml`. تنفّذ عمليات التشغيل المجدولة وعمليات الإصدار
سيناريوهات الإصدار. توزّع عمليات إرسال `matrix_profile=all` اليدوية
ملفات التعريف `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`؛
وتحدد عمليات الإرسال المركّزة `fast` أو `release` أو `transport` في مهمة واحدة.

### سيناريوهات Mantis في Discord

يتضمن Discord أيضًا سيناريوهات اشتراك اختيارية خاصة بـ Mantis لإعادة إنتاج الأخطاء. استخدم
`--scenario discord-status-reactions-tool-only` للمخطط الزمني الصريح
لتفاعلات الحالة، أو `--scenario discord-thread-reply-filepath-attachment`
لإنشاء محادثة متفرعة فعلية في Discord والتحقق من أن `message.thread-reply`
يحافظ على مرفق `filePath`. تظل هذه السيناريوهات خارج مسار
Discord المباشر الافتراضي لأنها مجسّات إعادة إنتاج قبل/بعد وليست
تغطية اختبار دخان واسعة. يمكن لسير عمل Mantis الخاص بمرفقات المحادثة المتفرعة أيضًا إضافة
فيديو شاهد من Discord Web مسجّل الدخول عندما يكون
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` أو
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` مضبوطًا في بيئة QA.
ملف تعريف العارض هذا مخصص للالتقاط المرئي فقط؛ ويظل قرار النجاح/الفشل
صادرًا عن مرجع Discord REST.

بالنسبة إلى مسارات اختبار الدخان الفعلية الأخرى للنقل:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

تستهدف هذه المسارات قناة فعلية موجودة مسبقًا تضم روبوتين أو حسابين (برنامج التشغيل +
النظام قيد الاختبار). متغيرات البيئة المطلوبة وقوائم السيناريوهات وعناصر الإخراج ومجموعة بيانات اعتماد
Convex لوسائل النقل الأربع هذه موثّقة في
[مرجع QA لـ Discord وSlack وTelegram وWhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference)
أدناه.

### مشغّلات سطح مكتب Slack والمهام المرئية في Mantis

لتشغيل كامل لآلة Slack المكتبية الافتراضية مع إنقاذ VNC، شغّل:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر هذا الأمر جهاز سطح مكتب/متصفح من Crabbox، ويشغّل مسار Slack المباشر
داخل الجهاز الافتراضي، ويفتح Slack Web في متصفح VNC، ويلتقط سطح المكتب،
وينسخ `slack-qa/` و`slack-desktop-smoke.png` و
`slack-desktop-smoke.mp4` (عند توفر التقاط الفيديو) إلى
دليل عناصر Mantis. توفر عمليات استئجار سطح المكتب/المتصفح من Crabbox أدوات الالتقاط
وحزم المساعدة للمتصفح/البناء الأصلي مسبقًا، لذا ينبغي للسيناريو
تثبيت البدائل الاحتياطية فقط في عمليات الاستئجار الأقدم. يعرض Mantis التوقيتات الإجمالية
وتوقيتات كل مرحلة في `mantis-slack-desktop-smoke-report.md` لكي توضّح عمليات التشغيل البطيئة
ما إذا كان الوقت قد استُهلك في تهيئة عملية الاستئجار، أو الحصول على بيانات الاعتماد، أو الإعداد البعيد، أو
نسخ العناصر. أعد استخدام `--lease-id <cbx_...>` بعد تسجيل الدخول إلى Slack Web
يدويًا عبر VNC؛ كما تُبقي عمليات الاستئجار المعاد استخدامها ذاكرة التخزين المؤقت لمخزن pnpm في Crabbox
مهيّأة. يتحقق الإعداد الافتراضي `--hydrate-mode source` من نسخة عمل للمصدر
ويشغّل التثبيت/البناء داخل الجهاز الافتراضي. استخدم `--hydrate-mode prehydrated` فقط عندما
تحتوي مساحة العمل البعيدة المعاد استخدامها مسبقًا على `node_modules` ونسخة مبنية من `dist/`؛
يتجاوز هذا الوضع خطوة التثبيت/البناء المكلفة ويتوقف بأمان عند عدم
جاهزية مساحة العمل. عند استخدام `--gateway-setup`، يترك Mantis
Gateway دائمًا لـ OpenClaw Slack قيد التشغيل داخل الجهاز الافتراضي على المنفذ `38973`؛ ومن دونه،
يشغّل الأمر مسار ضمان الجودة العادي من روبوت إلى روبوت في Slack ويخرج بعد التقاط
العناصر.

لإثبات واجهة مستخدم الموافقة الأصلية في Slack بأدلة من سطح المكتب، شغّل وضع
نقاط تحقق الموافقة في Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

يتنافى هذا الوضع مع `--gateway-setup`. فهو يشغّل سيناريوهات
الموافقة في Slack، ويرفض معرّفات السيناريوهات غير المتعلقة بالموافقة، وينتظر عند كل حالة موافقة
معلّقة ومحسومة، ويصيّر رسالة Slack API المرصودة إلى
`approval-checkpoints/<scenario>-pending.png` و
`approval-checkpoints/<scenario>-resolved.png`، ثم يفشل إذا كانت أي نقطة تحقق،
أو دليل رسالة، أو إقرار، أو لقطة شاشة مصيّرة مفقودة أو
فارغة. قد تستمر عمليات استئجار CI الباردة في إظهار تسجيل الدخول إلى Slack في
`slack-desktop-smoke.png`؛ وتمثل صور نقاط تحقق الموافقة الدليل
المرئي لهذا المسار.

يحتفظ تشغيل نقاط التحقق الافتراضي بسيناريوهَي الموافقة القياسيين في Slack.
لالتقاط أي من مسارَي الموافقة الاختياريين في Codex، حدده صراحةً باستخدام
`--scenario slack-codex-approval-exec-native` أو
`--scenario slack-codex-approval-plugin-native`؛ يقبل Mantis كليهما وينتج
زوج لقطات الشاشة نفسه للحالتين المعلّقة والمحسومة. يوسّع المشغّل المهل الزمنية لنقاط التحقق
والأوامر البعيدة لكل مسار Codex محدد حتى يكتمل
تسلسل الموافقة بالكامل، وإكمال الوكيل، وتحديث الحالة المحسومة.

توجد قائمة تحقق المشغّل، وأمر تشغيل سير عمل GitHub، وعقد تعليق
الأدلة، وجدول قرار وضع التزويد، وتفسير التوقيت، وخطوات معالجة
الفشل في
[دليل تشغيل Mantis لسطح مكتب Slack](/ar/concepts/mantis-slack-desktop-runbook).

لمهمة سطح مكتب بأسلوب الوكيل/الرؤية الحاسوبية، شغّل:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

يستأجر `visual-task` جهاز سطح مكتب/متصفح من Crabbox أو يعيد استخدامه، ويبدأ
`crabbox record --while`، ويتحكم في المتصفح المرئي عبر
`visual-driver` متداخل، ويلتقط `visual-task.png`، ويشغّل `openclaw infer image
describe` على لقطة الشاشة عند تحديد `--vision-mode image-describe`،
ويكتب `visual-task.mp4` و`mantis-visual-task-summary.json` و
`mantis-visual-task-driver-result.json` و
`mantis-visual-task-report.md`. عند تعيين `--expect-text`، تطلب مطالبة الرؤية
حكمًا منظمًا بصيغة JSON (`visible` و`evidence` و`reason`)
ولا تنجح إلا عندما يبلغ النموذج عن `visible: true` مع دليل
يستشهد بالنص المتوقع؛ وتظل استجابة `visible: false` التي تقتبس
النص المستهدف فحسب غير ناجحة في التحقق. استخدم `--vision-mode metadata` لاختبار
دخان بلا نموذج يثبت عمل سطح المكتب والمتصفح ولقطة الشاشة والفيديو
من دون استدعاء موفر لفهم الصور. التسجيل عنصر
مطلوب لـ `visual-task`؛ وإذا لم يسجل Crabbox ملف
`visual-task.mp4` غير فارغ، تفشل المهمة حتى لو نجح برنامج التشغيل المرئي. عند
الفشل، يحتفظ Mantis بعملية الاستئجار لـ VNC ما لم تكن المهمة قد نجحت بالفعل
ولم يُعيّن `--keep-lease`.

### فحص سلامة مجموعة بيانات الاعتماد

قبل استخدام بيانات الاعتماد المباشرة المجمعة، شغّل:

```bash
pnpm openclaw qa credentials doctor
```

يفحص الطبيب متغيرات بيئة وسيط Convex ‏(`OPENCLAW_QA_CONVEX_SITE_URL`،
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`)، ويتحقق من إعدادات نقطة النهاية، ويبلغ
فقط عن حالة التعيين/الفقدان لـ `OPENCLAW_QA_CONVEX_SECRET_CI` و
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`، ويتحقق من إمكانية الوصول إلى الإدارة/القائمة
عند توفر سر المشرف.

## تغطية السيناريوهات القياسية

يحدد الملف الجذري `taxonomy.yaml` معرّفات التغطية الدلالية. تربط ملفات YAML للسيناريوهات
ضمن `qa/scenarios/` كل سيناريو بهذه المعرّفات وتمتلك بيانات
التنفيذ الوصفية: `channel` هو متطلب القناة الوحيد، وتصرّح `profiles`
بعضوية عمليات التشغيل المسماة. برنامج تشغيل القناة خيار تنفيذ قابل للتبديل
على مستوى التشغيل. تستعلم مشغّلات TypeScript
عن هذا الكتالوج؛ ولا تحتفظ بقوائم موازية للسيناريوهات أو التغطية.

يعرض ناتج `qa coverage` الثابت ربط التصنيف بالسيناريوهات. يأتي
الإثبات الفعلي من `qa-evidence.json`، الذي يسجل السيناريو المنفذ،
ومعرّفات التغطية، والقناة، وبرنامج التشغيل المستخدم فعليًا، والنتيجة. القناة وبرنامج التشغيل
بُعدان للتقرير، وليسا مفردات إضافية لمعرّفات التغطية أو محاور
لتحديد أهلية السيناريو.

لمسار جهاز Linux افتراضي مؤقت من دون إدخال Docker في مسار ضمان الجودة، شغّل:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

يُقلع هذا ضيف Multipass جديدًا، ويثبت التبعيات، ويبني OpenClaw
داخل الضيف، ويشغّل `qa suite`، ثم ينسخ تقرير ضمان الجودة المعتاد
والملخص إلى `.artifacts/qa-e2e/...` على المضيف. ويعيد استخدام سلوك
اختيار السيناريو نفسه المستخدم في `qa suite` على المضيف.

تنفذ عمليات تشغيل الحزمة على المضيف وMultipass عدة سيناريوهات محددة
بالتوازي باستخدام عمال Gateway معزولين افتراضيًا. تكون قيمة `qa-channel` الافتراضية
تزامنًا مقداره 4، بحد أقصى يساوي عدد السيناريوهات المحددة. استخدم `--concurrency
<count>` لضبط عدد العمال، أو `--concurrency 1` للتنفيذ التسلسلي.
استخدم `--pack personal-agent` لتشغيل حزمة معايير المساعد الشخصي (10
سيناريوهات). مُحدِّد الحزمة تراكمي مع علامات `--scenario` المتكررة:
تُشغّل السيناريوهات الصريحة أولًا، ثم تُشغّل سيناريوهات الحزمة وفق ترتيبها
مع إزالة التكرارات. استخدم `--pack observability` لتحديد
السيناريوهين `otel-trace-smoke` و`docker-prometheus-smoke` معًا عندما يكون
مشغّل ضمان جودة مخصص قد وفّر مسبقًا إعداد جامع OpenTelemetry.

يخرج الأمر برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures`
عندما تريد العناصر من دون رمز خروج يدل على الفشل.

تمرر عمليات التشغيل المباشر مدخلات مصادقة ضمان الجودة المدعومة والعملية
للضيف: مفاتيح الموفر المستندة إلى متغيرات البيئة، ومسار إعدادات موفر ضمان الجودة المباشر،
و`CODEX_HOME` عند توفره. احتفظ بـ `--output-dir` ضمن جذر المستودع حتى
يتمكن الضيف من إعادة الكتابة عبر مساحة العمل المثبتة.

## مرجع ضمان الجودة لـ Discord وSlack وTelegram وWhatsApp

يستخدم محول Matrix المسار المؤقت المعتمد على Docker والموثق أعلاه.
تعمل Discord وSlack وTelegram وWhatsApp مقابل
وسائل نقل حقيقية موجودة مسبقًا، لذلك يوجد مرجعها هنا.

### علامات CLI المشتركة

تُسجّل هذه المسارات عبر
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts`
وتقبل العلامات نفسها:

| العلامة                                  | القيمة الافتراضية                                            | الوصف                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | شغّل هذا السيناريو فقط. قابلة للتكرار.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | موضع كتابة التقارير والملخصات والأدلة والعناصر الخاصة بوسيلة النقل وسجل المخرجات. تُحل المسارات النسبية بالنسبة إلى `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | جذر المستودع عند الاستدعاء من دليل عمل محايد.                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | معرّف الحساب المؤقت داخل إعدادات Gateway لضمان الجودة.                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` أو `aimock` أو `live-frontier`.                                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | الإعداد الافتراضي للموفر                                   | مراجع النموذج الأساسي/البديل.                                                                                                                   |
| `--fast`                              | متوقف                                                | الوضع السريع للموفر حيثما كان مدعومًا.                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | راجع [مجموعة بيانات اعتماد Convex](#convex-credential-pool).                                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` في CI، و`maintainer` في غير ذلك                 | الدور المستخدم عند `--credential-source convex`.                                                                                                    |
| `--allow-failures`                    | متوقف                                                | اكتب العناصر من دون إرجاع رمز خروج يدل على الفشل عند فشل السيناريوهات.                                                                      |

يخرج كل مسار برمز غير صفري عند فشل أي سيناريو. يكتب `--allow-failures`
العناصر من دون تعيين رمز خروج يدل على الفشل. يقبل Telegram أيضًا
`--list-scenarios` لطباعة معرّفات السيناريوهات المتاحة والخروج؛ ولا تعرض المسارات الأخرى
هذه العلامة.

### ضمان الجودة لـ Telegram

```bash
pnpm openclaw qa telegram
```

يستهدف مجموعة Telegram خاصة حقيقية واحدة تضم روبوتين متميزين (برنامج التشغيل +
النظام قيد الاختبار). يجب أن يكون لروبوت النظام قيد الاختبار اسم مستخدم في Telegram؛ وتعمل المراقبة من روبوت إلى روبوت
بأفضل صورة عند تمكين **Bot-to-Bot Communication Mode** لكلا
الروبوتين في `@BotFather`.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - معرّف المحادثة الرقمي (سلسلة نصية).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

يحدد ملف التعريف `release` سيناريوهات Telegram بصيغة YAML التي تخضع للصيانة؛ ويضيف `all`
اختبارات ضغط اختيارية للجلسة والاستخدام وسلسلة الردود والبث. تتجاوز قيم
`--scenario` الصريحة ملف التعريف.

- `channel-canary`
- `channel-mention-gating`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

يغطي ملف تعريف `release` دائمًا اختبار الكناري، وتقييد الإشارات، وردود الأوامر الأصلية،
وتوجيه الأوامر، وردود المجموعات من بوت إلى بوت. يتضمن `mock-openai`
أيضًا فحص المعاينة الحتمي للرد النهائي الطويل.
يظل `telegram-current-session-status-tool` و
`telegram-tool-only-usage-footer` اختياريين: الأول لا يكون مستقرًا إلا
عند تنفيذه مباشرةً بعد اختبار الكناري، والثاني إثبات عبر Telegram حقيقي
لتذييل `/usage` في الردود التي تقتصر على الأدوات. استخدم `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` لطباعة التقسيم الحالي
بين الافتراضي والاختياري مع مراجع اختبارات الانحدار. استخدم `--profile all` لكل
سيناريو لمحوّل Telegram المباشر.

عناصر الإخراج:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - إدخالات أدلة لفحوصات النقل المباشر،
  بما يشمل حقول ملف التعريف، والتغطية، والموفّر، والقناة، والعناصر، والنتيجة، وزمن RTT.

تستخدم عمليات تشغيل حزمة Telegram عقد بيانات اعتماد Telegram نفسه. يُعد قياس RTT
المتكرر جزءًا من مسار Telegram المباشر المعتاد للحزمة؛ ويُدمج توزيع RTT
في `qa-evidence.json` ضمن `result.timing` لفحص RTT
المحدد.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

عند تعيين `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`، يستأجر مغلّف التشغيل المباشر للحزمة
بيانات اعتماد `kind: "telegram"`، ويصدّر متغيرات بيئة المجموعة/برنامج التشغيل/بوت النظام قيد الاختبار المستأجرة
إلى تشغيل الحزمة المثبتة، ويرسل Heartbeat للإيجار، ويحرره
عند الإيقاف. يستخدم مغلّف الحزمة افتراضيًا 20 فحص RTT بقيمة
`channel-canary`، ومهلة RTT قدرها 30s، ودور Convex
`maintainer` خارج CI عند تحديد Convex. تجاوز
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES` أو `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
أو `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` لضبط قياس RTT دون
إنشاء أمر RTT منفصل أو تنسيق ملخص خاص بـ Telegram.

### ضمان جودة Discord

```bash
pnpm openclaw qa discord
```

يستهدف قناة واحدة حقيقية خاصة ضمن خادم Discord باستخدام بوتين: بوت برنامج تشغيل
تتحكم فيه عُدّة الاختبار، وبوت للنظام قيد الاختبار يبدأه Gateway الفرعي لـ OpenClaw
من خلال Plugin Discord المضمّن. يتحقق من معالجة إشارات القناة، ومن
أن بوت النظام قيد الاختبار سجّل الأمر الأصلي `/help` لدى Discord، ومن
سيناريوهات أدلة Mantis الاختيارية.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - يجب أن يطابق معرّف مستخدم بوت النظام قيد الاختبار
  الذي يعيده Discord (وإلا يفشل المسار فورًا).

اختياري:

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` يحدد قناة الصوت/المنصة من أجل
  `discord-voice-autojoin`؛ وبدونه، يختار السيناريو أول قناة
  صوت/منصة مرئية لبوت النظام قيد الاختبار.

سيناريوهات وحدة YAML لـ Discord ‏(`qa/scenarios/channels/discord-*.yaml`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - سيناريو صوتي اختياري. يعمل منفردًا، ويفعّل
  `channels.discord.voice.autoJoin`، ويتحقق من أن حالة الصوت الحالية لبوت النظام قيد الاختبار
  في Discord هي قناة الصوت/المنصة المستهدفة. قد تتضمن بيانات اعتماد Discord في Convex
  القيمة الاختيارية `voiceChannelId`؛ وإلا يكتشف محوّل برنامج التشغيل
  أول قناة صوت/منصة مرئية في الخادم.
- `discord-status-reactions-tool-only` - سيناريو Mantis اختياري. يعمل
  منفردًا لأنه يحوّل النظام قيد الاختبار إلى ردود دائمة في الخادم تقتصر على الأدوات
  باستخدام `messages.statusReactions.enabled=true`، ثم يلتقط مخططًا زمنيًا
  لتفاعلات REST مع عناصر مرئية بصيغتي HTML/PNG. تحتفظ تقارير Mantis لما قبل التنفيذ وما بعده
  أيضًا بعناصر MP4 التي يوفرها السيناريو باسمَي `baseline.mp4`
  و`candidate.mp4`.
- `discord-thread-reply-filepath-attachment` - سيناريو Mantis اختياري؛ راجع
  [سيناريوهات Mantis في Discord](#discord-mantis-scenarios).

شغّل سيناريو الانضمام التلقائي إلى صوت Discord صراحةً:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

شغّل سيناريو تفاعلات حالة Mantis صراحةً:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

عناصر الإخراج:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - إدخالات أدلة لفحوصات النقل المباشر.
- `discord-qa-reaction-timelines.json` و
  `discord-status-reactions-tool-only-timeline.png` عند تشغيل سيناريو
  تفاعلات الحالة.

### ضمان جودة Slack

```bash
pnpm openclaw qa slack
```

يستهدف قناة Slack حقيقية خاصة واحدة باستخدام بوتين منفصلين: بوت برنامج تشغيل
تتحكم فيه عُدّة الاختبار، وبوت للنظام قيد الاختبار يبدأه Gateway الفرعي لـ OpenClaw
من خلال Plugin Slack المضمّن.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختياري:

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` يفعّل نقاط تحقق
  مرئية للموافقة في Mantis. يكتب المحوّل `<scenario>.pending.json` و
  `<scenario>.resolved.json`، ثم ينتظر ملفات `.ack.json` المطابقة.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` يتجاوز مهلة
  الإقرار بنقطة التحقق. القيمة الافتراضية هي `120000`.

سيناريوهات YAML القياسية المتاحة عبر محوّل Slack المباشر:

- `thread-follow-up`
- `thread-isolation`

سيناريوهات وحدة YAML لـ Slack ‏(`qa/scenarios/channels/slack-*.yaml`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - فحص Slack حقيقي اختياري يؤكد أن
  قناة معطّلة ومضبوطة تُصدر تحذيرًا منظّمًا دون إرسال رد.
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`، و`slack-progress-commentary-false`،
  و`slack-progress-commentary-omitted`، و
  `slack-progress-commentary-verbose-dedupe` - فحوصات Slack حقيقية اختيارية
  لعناصر التحكم المستقلة في التعليقات/تقدم الأدوات، والقيمة الافتراضية القديمة
  عند حذف المفتاح، وسلوك التسليم لمرة واحدة عند تفعيل التقدم المطوّل الدائم.
- `slack-reaction-glyph-native` - سيناريو مباشر اختياري لتفاعل أداة الرسائل.
  يوجّه الوكيل إلى تمرير الرمز `✅` نفسه، ويؤكد أن Slack خزّن
  `white_check_mark` لبوت النظام قيد الاختبار على الرسالة المستهدفة.
- `slack-chart-presentation-native` - سيناريو مخطط محمول اختياري
  يتحقق من كتلة `data_visualization` الأصلية والنص الدقيق الميسّر.
- `slack-table-presentation-native` - سيناريو جدول محمول اختياري
  يتحقق من كتلة `data_table` الأصلية، والصفوف الدقيقة، والنص الميسّر.
- `slack-table-invalid-blocks-fallback` - سيناريو نقل مباشر اختياري
  يرسل جدولًا خامًا يتجاوز الحد ويمكن قراءته بنيويًا، ويحتوي على 101 صف بيانات
  بالإضافة إلى رأسه، عبر
  مسار إرسال Slack الإنتاجي، ويثبت أن Slack نفسه يعيد `invalid_blocks`،
  ويتحقق من أن البديل المخزّن مع تعطيل التنسيق مكتمل ولا يحتوي على
  كتلة بيانات أصلية. لا تحتفظ تفاصيل السيناريو إلا بأدلة آمنة لرمز الخطأ والعدد
  والقيم المنطقية.
- `slack-approval-exec-native` - سيناريو موافقة أصلي اختياري لتنفيذ Slack.
  يطلب موافقة على التنفيذ عبر Gateway، ويتحقق من أن رسالة Slack
  تحتوي على أزرار موافقة أصلية، ويحسمها، ثم يتحقق من تحديث Slack
  بعد الحسم.
- `slack-approval-plugin-native` - سيناريو موافقة أصلي اختياري على Plugin في Slack.
  يفعّل إعادة توجيه موافقات التنفيذ وPlugin معًا كي لا
  تُحجب أحداث Plugin بسبب توجيه موافقات التنفيذ، ثم يتحقق من مسار
  واجهة Slack الأصلية نفسه في حالتي الانتظار والحسم.
- `slack-codex-approval-exec-native` - سيناريو موافقة اختياري على أوامر Codex Guardian.
  يفعّل Plugin Codex في وضع Guardian، ويوجّه دورة وكيل
  Gateway ناشئة من Slack عبر عُدّة خادم تطبيق Codex،
  وينتظر مطالبة الموافقة الأصلية على Plugin في Slack من أجل
  `openclaw-codex-app-server`، ويحسمها، ويتحقق من أن دورة Codex
  تنتهي بعلامات خرج الأمر والمساعد المتوقعة.
- `slack-codex-approval-plugin-native` - سيناريو موافقة اختياري على ملفات Codex.
  يستخدم تعليمة `apply_patch` خارج مساحة العمل كي يصدر Codex
  مسار موافقة خادم التطبيق على تغيير الملف، ثم يتحقق من مسار
  موافقة Slack الأصلي نفسه في حالتي الانتظار والحسم، وعلامة المساعد النهائية، ومحتويات الملف
  الدقيقة قبل التنظيف.

تتطلب سيناريوهات موافقة Codex قيمة `openai/*` أو `codex/*` من `--model`،
وبيانات اعتماد النموذج المباشر المعتادة، ومصادقة Codex أو مصادقة مفتاح API يقبلها Plugin Codex.
تتضمن تفاصيل السيناريو أسلوب خادم تطبيق Codex، ومفتاح نموذج Codex
المحدد، والحالة النهائية لدورة Codex، والتحقق من علامة العملية إلى جانب
بيانات موافقة Slack المنقحة.

عناصر الإخراج:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - إدخالات أدلة لفحوصات النقل المباشر.
- `approval-checkpoints/` - فقط عندما يعيّن Mantis
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`؛ ويحتوي على JSON لنقطة التحقق،
  وJSON للإقرار، ولقطات شاشة لحالتي الانتظار والحسم.

#### إعداد مساحة عمل Slack

يحتاج المسار إلى تطبيقي Slack منفصلين في مساحة عمل واحدة، بالإضافة إلى قناة
يشترك فيها البوتان:

- `channelId` - معرّف `Cxxxxxxxxxx` لقناة دُعي إليها البوتان.
  استخدم قناة مخصصة؛ إذ ينشر المسار في كل تشغيل.
- `driverBotToken` - رمز البوت (`xoxb-...`) لتطبيق **برنامج التشغيل**.
- `sutBotToken` - رمز البوت (`xoxb-...`) لتطبيق **النظام قيد الاختبار**، الذي يجب أن يكون
  تطبيق Slack منفصلًا عن برنامج التشغيل كي يكون معرّف مستخدم البوت الخاص به مختلفًا.
- `sutAppToken` - رمز على مستوى التطبيق (`xapp-...`) لتطبيق النظام قيد الاختبار مع
  `connections:write`، ويستخدمه Socket Mode كي يتمكن تطبيق النظام قيد الاختبار من استقبال الأحداث.

يُفضّل استخدام مساحة عمل Slack مخصصة لضمان الجودة بدلًا من إعادة استخدام مساحة عمل
إنتاجية.

يضيّق بيان النظام قيد الاختبار أدناه عن قصد نطاق تثبيت Plugin Slack المضمّن
في بيئة الإنتاج (`extensions/slack/src/setup-shared.ts:12`) ليقتصر على
الأذونات والأحداث التي تغطيها مجموعة ضمان جودة Slack المباشرة. للاطلاع على
إعداد قناة الإنتاج كما يراه المستخدمون، راجع
[الإعداد السريع لقناة Slack](/ar/channels/slack#quick-setup)؛ ويكون زوج برنامج التشغيل/النظام قيد الاختبار
لضمان الجودة منفصلًا عن قصد لأن المسار يحتاج إلى معرّفي مستخدم بوت مختلفين
في مساحة عمل واحدة.

**1. إنشاء تطبيق برنامج التشغيل**

انتقل إلى [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ ←
_From a manifest_ ← اختر مساحة عمل ضمان الجودة، والصق البيان التالي،
ثم اختر _Install to Workspace_:

```json
{
  "display_information": {
    "name": "برنامج تشغيل ضمان جودة OpenClaw",
    "description": "بوت برنامج تشغيل اختباري لمسار ضمان جودة Slack المباشر في OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "برنامج تشغيل ضمان جودة OpenClaw",
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

انسخ _Bot User OAuth Token_ ‏(`xoxb-...`) - وسيصبح
`driverBotToken`. لا يحتاج برنامج التشغيل إلا إلى نشر الرسائل والتعريف
بنفسه؛ ولا يحتاج إلى أحداث أو Socket Mode.

**2. إنشاء تطبيق النظام قيد الاختبار**

كرر _Create New App → From a manifest_ في مساحة العمل نفسها. يستخدم تطبيق ضمان الجودة هذا
عن قصد إصدارًا أضيق نطاقًا من بيان الإنتاج الخاص بـ Plugin Slack المضمّن
(`extensions/slack/src/setup-shared.ts:12`): حُذفت نطاقات التفاعلات
وأحداثها لأن مجموعة ضمان جودة Slack المباشرة لا تغطي
معالجة التفاعلات حتى الآن.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "موصل OpenClaw QA SUT لـ OpenClaw"
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

- _Install to Workspace_ → انسخ _Bot User OAuth Token_ → ليصبح
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → أضف
  النطاق `connections:write` → احفظ → انسخ قيمة `xapp-...` → لتصبح
  `sutAppToken`.

تحقق من أن للبوتين معرّفي مستخدم مختلفين باستدعاء `auth.test` لكل
رمز مميز. تميّز بيئة التشغيل بين برنامج التشغيل والنظام قيد الاختبار حسب معرّف المستخدم؛ وستفشل بوابة الإشارات فورًا عند إعادة استخدام تطبيق واحد
لكليهما.

**3. إنشاء القناة**

في مساحة عمل ضمان الجودة، أنشئ قناة (مثل `#openclaw-qa`) وادعُ كلا
البوتين من داخل القناة:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

انسخ معرّف `Cxxxxxxxxxx` من _channel info → About → Channel ID_ - ليصبح
`channelId`. يمكن استخدام قناة عامة؛ وإذا استخدمت قناة خاصة،
فإن كلا التطبيقين يمتلكان بالفعل `groups:history`، لذلك ستظل قراءات السجل الخاصة بأداة الاختبار
ناجحة.

**4. تسجيل بيانات الاعتماد**

يتوفر خياران. استخدم متغيرات البيئة لتصحيح الأخطاء على جهاز واحد (عيّن متغيرات
`OPENCLAW_QA_SLACK_*` الأربعة ومرّر `--credential-source env`)، أو املأ
مجموعة Convex المشتركة حتى تتمكن بيئة CI والمشرفون الآخرون من استئجارها.

بالنسبة إلى مجموعة Convex، اكتب الحقول الأربعة في ملف JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

بعد تصدير `OPENCLAW_QA_CONVEX_SITE_URL` و`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
في الصدفة، سجّل وتحقق:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "بذرة مجموعة Slack لضمان الجودة"

pnpm openclaw qa credentials list --kind slack --status all --json
```

توقّع `count: 1` و`status: "active"`، ومن دون حقل `lease`.

**5. التحقق الشامل**

شغّل المسار محليًا للتأكد من قدرة كلا البوتين على التواصل أحدهما مع الآخر عبر
الوسيط:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

يكتمل التشغيل الناجح في أقل بكثير من 30 ثانية، ويعرض `qa-suite-report.md`
كلاً من `slack-canary` و`slack-mention-gating` بالحالة `pass`. إذا ظل
المسار معلقًا لمدة تقارب 90 ثانية ثم خرج مع `Convex credential pool exhausted
for kind "slack"`، فإما أن المجموعة فارغة أو أن كل صفوفها مستأجرة - وسيبيّن `qa
credentials list --kind slack --status all --json` أيهما السبب.

### ضمان جودة WhatsApp

```bash
pnpm openclaw qa whatsapp
```

يستهدف حسابين مخصصين في WhatsApp Web: حساب برنامج تشغيل تتحكم فيه
أداة الاختبار، وحساب نظام قيد الاختبار يبدأه Gateway الفرعي لـ OpenClaw عبر
Plugin WhatsApp المضمّن.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

اختياري:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` يفعّل سيناريوهات المجموعات مثل
  `whatsapp-mention-gating` و`whatsapp-group-pending-history-context`
  و`whatsapp-broadcast-group-fanout` و`whatsapp-group-activation-always`
  و`whatsapp-group-reply-to-bot-triggers`، وسيناريوهات إجراءات المجموعات والوسائط والاستطلاعات،
  و`whatsapp-group-allowlist-block`.

سيناريوهات WhatsApp بتنسيق YAML ‏(`qa/scenarios/channels/whatsapp-*.yaml`):

- خط الأساس وبوابة المجموعات: `whatsapp-canary` و`whatsapp-pairing-block`
  و`whatsapp-mention-gating` و`whatsapp-group-pending-history-context`
  و`whatsapp-group-activation-always` و`whatsapp-group-reply-to-bot-triggers`
  و`whatsapp-top-level-reply-shape` و`whatsapp-restart-resume`
  و`whatsapp-group-allowlist-block`.
- الأوامر الأصلية: `whatsapp-help-command` و`whatsapp-status-command`
  و`whatsapp-commands-command` و`whatsapp-tools-compact-command`
  و`whatsapp-whoami-command` و`whatsapp-context-command`
  و`whatsapp-native-new-command`.
- سلوك الرد والمخرجات النهائية: `whatsapp-tool-only-usage-footer`
  و`whatsapp-reply-to-message` و`whatsapp-group-reply-to-message`
  و`whatsapp-reply-to-mode-batched` و`whatsapp-reply-context-isolation`
  و`whatsapp-reply-delivery-shape` و`whatsapp-stream-final-message-accounting`.
- إجراءات الرسائل في مسار المستخدم: يبدأ `whatsapp-agent-message-action-react`
  من رسالة خاصة حقيقية لبرنامج التشغيل، ويسمح للنموذج باستدعاء أداة `message`،
  ويراقب تفاعل WhatsApp الأصلي. يستخدم `whatsapp-agent-message-action-upload-file`
  النهج نفسه مع `message(action=upload-file)` ويراقب
  وسائط WhatsApp الأصلية. يثبت `whatsapp-group-agent-message-action-react` و
  `whatsapp-group-agent-message-action-upload-file` الإجراءات نفسها
  المرئية للمستخدم في مجموعة WhatsApp حقيقية.
- توزيع المجموعة: يبدأ `whatsapp-broadcast-group-fanout` من رسالة واحدة
  في مجموعة WhatsApp تتضمن إشارة، ويتحقق من ظهور ردود مميزة من `main`
  و`qa-second`.
- تنشيط المجموعة: يغيّر `whatsapp-group-activation-always` جلسة مجموعة حقيقية
  إلى `/activation always`، ويثبت أن رسالة مجموعة بلا إشارة توقظ
  الوكيل، ثم يستعيد `/activation mention`.
  ينشئ `whatsapp-group-reply-to-bot-triggers` ردًا أوليًا من البوت، ويرسل إليه رد اقتباس
  أصليًا من دون إشارة صريحة، ويتحقق من أن الوكيل
  يستيقظ من سياق ذلك الرد.
- الوسائط الواردة والرسائل المنظمة: `whatsapp-inbound-image-caption`
  و`whatsapp-audio-preflight` و`whatsapp-inbound-structured-messages`
  و`whatsapp-group-audio-gating` و`whatsapp-inbound-reaction-no-trigger`.
  ترسل هذه أحداث صور وصوت ومستندات ومواقع وجهات اتصال
  وملصقات وتفاعلات حقيقية في WhatsApp عبر برنامج التشغيل.
- اختبارات عقد Gateway المباشرة: `whatsapp-outbound-media-matrix`
  و`whatsapp-outbound-document-preserves-filename` و`whatsapp-outbound-poll`
  و`whatsapp-outbound-send-serialization`
  و`whatsapp-group-outbound-media` و`whatsapp-group-outbound-poll`
  و`whatsapp-message-actions` و`whatsapp-reply-context-isolation`
  و`whatsapp-reply-delivery-shape`. تتجاوز هذه مطالبة النموذج عمدًا
  وتثبت عقود `send` و`poll` و
  `message.action` الحتمية في Gateway/القناة.
- تغطية التحكم في الوصول: `whatsapp-access-control-dm-open`
  و`whatsapp-access-control-dm-disabled` و`whatsapp-access-control-group-open`
  و`whatsapp-access-control-group-disabled` و`whatsapp-group-allowlist-block`.
- الموافقات الأصلية: `whatsapp-approval-exec-deny-native`
  و`whatsapp-approval-exec-native` و`whatsapp-approval-exec-reaction-native`
  و`whatsapp-approval-exec-group-reaction-native`
  و`whatsapp-approval-plugin-native`.
- تفاعلات الحالة: `whatsapp-status-reactions`
  و`whatsapp-status-reaction-lifecycle`.

يحتوي الكتالوج حاليًا على 52 سيناريو. يظل مسار `live-frontier` الافتراضي
صغيرًا عند 8 سيناريوهات لتوفير تغطية تحقق أولي سريعة. يشغّل مسار `mock-openai`
الافتراضي 39 سيناريو بصورة حتمية عبر نقل WhatsApp الحقيقي،
مع محاكاة مخرجات النموذج فقط؛ وتظل سيناريوهات الموافقة وبعض
عمليات التحقق الأثقل أو الحاجبة صريحة حسب معرّف السيناريو.

يراقب برنامج تشغيل ضمان جودة WhatsApp أحداثًا حية منظمة (`text` و`media`
و`location` و`reaction` و`poll`)، ويمكنه إرسال الوسائط والاستطلاعات
وجهات الاتصال والمواقع والملصقات بفاعلية. يستورد مختبر ضمان الجودة برنامج التشغيل هذا عبر
سطح الحزمة `@openclaw/whatsapp/api.js` بدلًا من الوصول إلى ملفات
بيئة تشغيل WhatsApp الخاصة. بالنسبة إلى مراقبات المجموعات، يمثّل `fromJid` معرّف JID للمجموعة،
بينما يحدّد `participantJid` و`fromPhoneE164` المرسل المشارك.
يُحجب محتوى الرسالة افتراضيًا. تُعد اختبارات Gateway المباشرة للاستطلاع وتحميل الملف
والوسائط واستطلاع المجموعة ووسائط المجموعة وشكل الرد عمليات تحقق لعقد
النقل/API؛ ولا تُعد دليلًا على أن مطالبة مستخدم جعلت
الوكيل يختار الإجراء نفسه. يأتي إثبات الإجراءات عبر مسار المستخدم من سيناريوهات
مثل `whatsapp-agent-message-action-react` و
`whatsapp-group-agent-message-action-react`، حيث يرسل برنامج التشغيل رسالة
WhatsApp عادية ويراقب مختبر ضمان الجودة عنصر WhatsApp الأصلي الناتج.
تتضمن تفاصيل سيناريو WhatsApp نهج كل سيناريو (`user-path`
أو `direct-gateway` أو `native-approval`) حتى لا يُساء فهم الأدلة على أنها تثبت
عقدًا أقوى مما تثبته بالفعل.

عناصر المخرجات:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - إدخالات الأدلة لعمليات تحقق النقل المباشر.

### مجموعة بيانات اعتماد Convex

يمكن لمسارات Discord وSlack وTelegram وWhatsApp استئجار بيانات اعتماد من
مجموعة Convex مشتركة بدلًا من قراءة متغيرات البيئة أعلاه. مرّر
`--credential-source convex` (أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)؛
يحصل مختبر ضمان الجودة على عقد إيجار حصري، ويرسل Heartbeat طوال مدة
التشغيل، ويحرره عند الإغلاق. أنواع المجموعة هي `"discord"` و`"slack"`
و`"telegram"` و`"whatsapp"`.

أشكال الحمولة التي يتحقق منها الوسيط عند `admin/add`:

- Discord ‏(`kind: "discord"`): ‏`{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram ‏(`kind: "telegram"`): ‏`{ groupId: string, driverToken: string,
sutToken: string }` - يجب أن تكون `groupId` سلسلة معرّف دردشة رقمية.
- مستخدم Telegram حقيقي (`kind: "telegram-user"`): ‏`{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  لإثبات Mantis عبر Telegram Desktop فقط. يجب ألا تحصل مسارات مختبر ضمان الجودة العامة
  على هذا النوع.
- WhatsApp ‏(`kind: "whatsapp"`): ‏`{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - يجب أن تكون أرقام الهواتف سلاسل E.164 مميزة.

يحتفظ سير عمل إثبات Mantis عبر Telegram Desktop بعقد إيجار Convex حصري واحد
من النوع `telegram-user` لكل من برنامج تشغيل TDLib CLI وشاهد Telegram Desktop،
ثم يحرره بعد نشر الإثبات.

عندما يحتاج طلب سحب إلى فرق مرئي حتمي، يمكن لـ Mantis استخدام رد النموذج الوهمي
نفسه على `main` وعلى رأس طلب السحب أثناء تغيّر منسّق Telegram أو
طبقة التسليم. ضُبطت إعدادات الالتقاط الافتراضية لتعليقات طلبات السحب: فئة
Crabbox قياسية، وتسجيل سطح مكتب بسرعة 24fps، وصورة GIF متحركة بسرعة 24fps، وعرض معاينة
1920px. ينبغي أن تنشر تعليقات ما قبل/بعد حزمة نظيفة لا تحتوي
إلا على صور GIF المقصودة.

يمكن لمسارات Slack أيضًا استخدام المجموعة. توجد عمليات التحقق من شكل حمولة Slack حاليًا
في مشغّل ضمان جودة Slack بدلًا من الوسيط؛ استخدم `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`، مع
معرّف قناة Slack مثل `Cxxxxxxxxxx`. راجع
[إعداد مساحة عمل Slack](#setting-up-the-slack-workspace) لتوفير التطبيق
والنطاقات.

توجد متغيرات البيئة التشغيلية وعقد نقطة نهاية وسيط Convex في
[الاختبار ← بيانات اعتماد Telegram المشتركة عبر Convex](/ar/help/testing#shared-telegram-credentials-via-convex-v1)
(اسم القسم أقدم من المجموعة متعددة القنوات؛ ودلالات عقد الإيجار
مشتركة بين الأنواع).

## البذور المدعومة من المستودع

توجد أصول البذور في `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

توجد هذه في git عمدًا حتى تكون خطة ضمان الجودة مرئية للبشر
وللوكيل.

يظل `qa-lab` مشغّل سيناريوهات YAML عامًا. يمثّل كل ملف YAML للسيناريو
مصدر الحقيقة لتشغيل اختبار واحد، وينبغي أن يعرّف:

- `title` في المستوى الأعلى
- بيانات `scenario` الوصفية
- بيانات وصفية اختيارية للفئة والقدرة والمسار والمخاطر في `scenario`
- مراجع الوثائق والشيفرة في `scenario`
- متطلبات Plugin الاختيارية في `scenario`
- تصحيحًا اختياريًا لإعدادات Gateway في `scenario`
- `flow` قابلًا للتنفيذ في المستوى الأعلى لسيناريوهات التدفق، أو
  `scenario.execution.kind` / `scenario.execution.path` لسيناريوهات Vitest و
  Playwright

يبقى سطح وقت التشغيل القابل لإعادة الاستخدام الذي يدعم `flow` عامًا
وشاملًا لعدة جوانب. على سبيل المثال، يمكن لسيناريوهات YAML دمج مساعدات جانب النقل
مع مساعدات جانب المتصفح التي تتحكم في واجهة Control UI المضمّنة عبر
واجهة `browser.request` في Gateway من دون إضافة مشغّل لحالة خاصة.

ينبغي تجميع ملفات السيناريو حسب قدرة المنتج بدلًا من مجلد شجرة
المصدر. أبقِ معرّفات السيناريو ثابتة عند نقل الملفات؛ واستخدم `docsRefs` و
`codeRefs` لإمكانية تتبّع التنفيذ.

ينبغي أن تظل القائمة الأساسية واسعة بما يكفي لتغطية:

- الرسائل المباشرة ودردشة القنوات
- سلوك سلاسل المحادثات
- دورة حياة إجراءات الرسائل
- استدعاءات Cron
- استرجاع الذاكرة
- تبديل النموذج
- تسليم المهمة إلى الوكيل الفرعي
- قراءة المستودع وقراءة الوثائق
- مهمة بناء صغيرة واحدة مثل Lobster Invaders

## مسارات محاكاة المزوّد

يحتوي `qa suite` على مسارين محليين لمحاكاة المزوّد:

- `mock-openai` هو محاكي OpenClaw المدرك للسيناريوهات. ويظل مسار
  المحاكاة الحتمي الافتراضي لضمان الجودة المدعوم بالمستودع وبوابات التكافؤ.
- يشغّل `aimock` خادم مزوّد مدعومًا بـ AIMock لتغطية
  البروتوكول التجريبي والتركيبات والتسجيل/إعادة التشغيل والفوضى. وهو تكميلي
  ولا يستبدل موزّع سيناريوهات `mock-openai`.

يوجد تنفيذ مسار المزوّد ضمن `extensions/qa-lab/src/providers/`.
يمتلك كل مزوّد إعداداته الافتراضية، وبدء تشغيل خادمه المحلي، وتهيئة نموذج Gateway،
واحتياجات إعداد ملف تعريف المصادقة، وعلامات إمكانات التشغيل الفعلي/المحاكاة. تمرّر الشيفرة المشتركة للحزمة
ولـ Gateway العمل عبر سجل المزوّدين بدلًا من التفريع بناءً على
أسماء المزوّدين.

## محوّلات النقل

يمتلك `qa-lab` واجهة نقل عامة لسيناريوهات ضمان الجودة في YAML. ويمثّل `qa-channel`
الخيار الاصطناعي الافتراضي. يشغّل `crabline` خوادم محلية تحاكي المزوّدين
ويشغّل Plugins القنوات العادية في OpenClaw عليها. أما `live` فهو محجوز
لبيانات اعتماد المزوّدين الحقيقية والقنوات الخارجية.

على مستوى البنية، يكون التقسيم كالتالي:

- يمتلك `qa-lab` تنفيذ السيناريو العام، وتزامن العمال، وكتابة
  العناصر، وإعداد التقارير.
- يمتلك محوّل النقل تهيئة Gateway، والتحقق من الجاهزية، ومراقبة
  الوارد والصادر، وإجراءات النقل، وحالة النقل الموحّدة.
- تحدّد ملفات سيناريو YAML ضمن `qa/scenarios/` تشغيل الاختبار؛ ويوفّر `qa-lab`
  سطح وقت التشغيل القابل لإعادة الاستخدام الذي ينفّذها.

### إضافة قناة

تتطلب إضافة قناة إلى نظام ضمان الجودة في YAML تنفيذ القناة
إضافةً إلى حزمة سيناريوهات تختبر عقد القناة. ولتغطية CI
التمهيدية، أضف خادم المزوّد المحلي المطابق في Crabline وأتحه
من خلال برنامج تشغيل `crabline`.

لا تضف جذر أمر جديدًا من المستوى الأعلى لضمان الجودة عندما يستطيع مضيف `qa-lab` المشترك
امتلاك التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء تشغيل الحزمة وإنهاؤها
- تزامن العمال
- كتابة العناصر
- إنشاء التقارير
- تنفيذ السيناريو
- أسماء التوافق البديلة لسيناريوهات `qa-channel` الأقدم

تمتلك Plugins المشغّل عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت جذر `qa` المشترك
- كيفية تهيئة Gateway لذلك النقل
- كيفية التحقق من الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية مراقبة الرسائل الصادرة
- كيفية إتاحة النصوص المنسوخة وحالة النقل الموحّدة
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية معالجة إعادة الضبط أو التنظيف الخاصين بالنقل

الحد الأدنى لاعتماد قناة جديدة:

1. أبقِ `qa-lab` مالكًا لجذر `qa` المشترك.
2. نفّذ مشغّل النقل على واجهة مضيف `qa-lab` المشتركة.
3. أبقِ الآليات الخاصة بالنقل داخل Plugin المشغّل أو
   إطار اختبار القناة.
4. ركّب المشغّل بصفته `openclaw qa <runner>` بدلًا من تسجيل
   أمر جذري منافس. ينبغي أن تعلن Plugins المشغّل عن `qaRunners` في
   `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations`
   مطابقة من `runtime-api.ts`. أبقِ `runtime-api.ts` خفيفًا؛ وينبغي أن يظل تنفيذ CLI الكسول
   وتنفيذ المشغّل خلف نقاط دخول منفصلة. يتيح `adapterFactory`
   اختياري النقل للسيناريوهات المشتركة من دون تغيير
   كتالوج السيناريوهات الحالي للأمر.
5. أنشئ أو عدّل سيناريوهات YAML ضمن أدلة `qa/scenarios/`
   ذات السمات.
6. استخدم مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. أبقِ أسماء التوافق البديلة الحالية عاملة ما لم يكن المستودع يجري
   ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا أمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقِه في Plugin
  المشغّل أو إطار اختبار Plugin الخاص بها.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن لأكثر من قناة استخدامها،
  فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة في `suite.ts`.
- إذا كان السلوك ذا معنى لنوع نقل واحد فقط، فأبقِ السيناريو
  خاصًا بالنقل واجعل ذلك صريحًا في عقد السيناريو.

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

تظل أسماء التوافق البديلة متاحة للسيناريوهات الحالية -
`waitForQaChannelReady`، و`waitForOutboundMessage`، و`waitForNoOutbound`،
و`formatConversationTranscript`، و`resetBus` - لكن ينبغي عند إنشاء سيناريوهات جديدة
استخدام الأسماء العامة. توجد الأسماء البديلة لتجنب
ترحيل شامل دفعة واحدة، لا باعتبارها النموذج المعتمد مستقبلًا.

## إعداد التقارير

يصدّر `qa-lab` تقرير بروتوكول بتنسيق Markdown من المخطط الزمني المرصود لناقل الأحداث.
ينبغي أن يجيب التقرير عن:

- ما الذي نجح
- ما الذي فشل
- ما الذي ظل محظورًا
- ما سيناريوهات المتابعة الجديرة بالإضافة

للحصول على قائمة السيناريوهات المتاحة - وهي مفيدة عند تقدير حجم عمل المتابعة
أو توصيل نقل جديد - شغّل `pnpm openclaw qa coverage` (وأضف `--json`
لإخراج قابل للقراءة آليًا). عند اختيار إثبات مركّز لسلوك
أو مسار ملف جرى لمسه، شغّل `pnpm openclaw qa coverage --match <query>`. يبحث
تقرير المطابقة في بيانات السيناريو الوصفية، ومراجع الوثائق، ومراجع الشيفرة، ومعرّفات التغطية،
وPlugins، ومتطلبات المزوّدين، ثم يطبع أهداف `qa suite
--scenario ...` المطابقة.

يكتب كل تشغيل لـ `qa suite` العناصر ذات المستوى الأعلى `qa-evidence.json`،
و`qa-suite-summary.json`، و`qa-suite-report.md` لمجموعة
السيناريوهات المحددة. تشغّل السيناريوهات التي تعلن `execution.kind: vitest` أو
`execution.kind: playwright` مسار الاختبار المطابق وتكتب أيضًا
سجلات خاصة بكل سيناريو. وتشغّل السيناريوهات التي تعلن `execution.kind: script`
منتج الأدلة في `execution.path` عبر `node --import tsx` (مع
توسيع `${outputDir}` و`${scenarioId}` في `execution.args`)؛ ويكتب
المنتج ملف `qa-evidence.json` الخاص به، وتُستورد إدخالاته إلى
مخرجات الحزمة، وتُحل مسارات عناصره نسبةً إلى
`qa-evidence.json` الخاص بذلك المنتج. وعند الوصول إلى `qa suite` عبر `qa run
--qa-profile`، يتضمن `qa-evidence.json` نفسه أيضًا ملخص
بطاقة أداء ملف التعريف لفئات التصنيف المحددة.

تعامل مع مخرجات التغطية بوصفها أداة مساعدة للاكتشاف، لا بديلًا عن البوابة؛ فلا يزال
السيناريو المحدد يحتاج إلى وضع المزوّد المناسب أو النقل الفعلي أو
Multipass أو Testbox أو مسار الإصدار المناسب للسلوك الخاضع للاختبار. للاطلاع
على سياق بطاقة الأداء، راجع [بطاقة أداء النضج](/ar/maturity/scorecard).

لفحوص الشخصية والأسلوب، شغّل السيناريو نفسه عبر عدة
مراجع نماذج فعلية واكتب تقرير Markdown مُقيّمًا:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

يشغّل الأمر عمليات فرعية محلية لـ Gateway ضمان الجودة، وليس Docker. ينبغي
أن تضبط سيناريوهات تقييم الشخصية الهوية عبر `SOUL.md`، ثم تشغّل أدوار
مستخدم عادية مثل الدردشة، والمساعدة في مساحة العمل، ومهام الملفات الصغيرة. ينبغي ألا
يُخبَر النموذج المرشح بأنه قيد التقييم. يحتفظ الأمر
بالنص المنسوخ الكامل لكل تشغيل، ويسجل إحصاءات التشغيل الأساسية، ثم يطلب من نماذج التحكيم في
الوضع السريع مع استدلال `xhigh` حيثما كان مدعومًا ترتيب عمليات التشغيل حسب
الطبيعية، والطابع العام، والفكاهة. استخدم `--blind-judge-models` عند مقارنة
المزوّدين: تظل مطالبة المحكّم تتلقى كل نص منسوخ وحالة تشغيل، لكن
تُستبدل مراجع المرشحين بتسميات محايدة مثل `candidate-01`؛ ويعيد
التقرير ربط الترتيبات بالمراجع الحقيقية بعد التحليل.

تستخدم عمليات تشغيل المرشحين افتراضيًا نمط التفكير `high`، مع `medium` لـ GPT-5.6 Luna و
`xhigh` لمراجع تقييم OpenAI الأقدم التي تدعمه. تجاوز إعداد مرشح محدد
ضمن السطر باستخدام `--model provider/model,thinking=<level>`؛ وتدعم
الخيارات المضمّنة أيضًا `fast`، و`no-fast`، و`fast=<bool>`. لا يزال `--thinking
<level>` يضبط قيمة احتياطية عامة، ويُحتفظ بصيغة `--model-thinking
<provider/model=level>` الأقدم للتوافق. تستخدم مراجع مرشحي OpenAI
الوضع السريع افتراضيًا بحيث تُستخدم المعالجة ذات الأولوية عندما يدعمها المزوّد.
مرّر `--fast` فقط عندما تريد فرض تشغيل الوضع السريع
لكل نموذج مرشح. تُسجّل مدد المرشحين والمحكّمين في
التقرير لتحليل المعايير المرجعية، لكن مطالبات المحكّمين تنص صراحةً على عدم الترتيب
حسب السرعة. تستخدم عمليات تشغيل نماذج المرشحين والمحكّمين تزامنًا افتراضيًا قدره 16.
خفّض `--concurrency` أو `--judge-concurrency` عندما تجعل حدود المزوّد أو ضغط
Gateway المحلي التشغيل كثير التشويش.

عندما لا يُمرّر `--model` للمرشح، يستخدم تقييم الشخصية افتراضيًا
`openai/gpt-5.6-luna`، و`openai/gpt-5.2`، و`openai/gpt-5`،
و`anthropic/claude-opus-4-8`، و`anthropic/claude-sonnet-4-6`، و`zai/glm-5.1`،
و`moonshot/kimi-k2.5`، و`google/gemini-3.1-pro-preview`. وعندما لا
يُمرّر `--judge-model`، يستخدم المحكّمون افتراضيًا
`openai/gpt-5.6-sol,thinking=xhigh,fast` و
`anthropic/claude-opus-4-8,thinking=high`.

## الوثائق ذات الصلة

- [بطاقة أداء النضج](/ar/maturity/scorecard)
- [حزمة المعايير المرجعية للوكيل الشخصي](/ar/concepts/personal-agent-benchmark-pack)
- [قناة ضمان الجودة](/ar/channels/qa-channel)
- [الاختبار](/ar/help/testing)
- [لوحة المعلومات](/ar/web/dashboard)
