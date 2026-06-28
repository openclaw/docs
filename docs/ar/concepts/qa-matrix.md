---
read_when:
    - تشغيل pnpm openclaw qa matrix محليًا
    - إضافة أو اختيار سيناريوهات ضمان الجودة في Matrix
    - فرز إخفاقات Matrix QA أو حالات انتهاء المهلة أو التنظيف العالق
summary: 'مرجع المشرف لمسار QA المباشر لـ Matrix المدعوم بـ Docker: CLI، وملفات التعريف، ومتغيرات البيئة، والسيناريوهات، ونتاجات الإخراج.'
title: ضمان جودة Matrix
x-i18n:
    generated_at: "2026-05-06T07:50:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

يشغّل مسار Matrix QA الـ Plugin المضمّن `@openclaw/matrix` مقابل خادم منزلي Tuwunel قابل للتخلّص منه في Docker، مع حسابات مؤقتة للسائق، وSUT، والمراقب، إضافة إلى غرف مُهيّأة مسبقًا. وهو تغطية Matrix الحية الواقعية للنقل.

هذه أدوات مخصّصة للمشرفين فقط. إصدارات OpenClaw المعبأة تحذف `qa-lab` عمدًا، لذا لا يتوفر `openclaw qa` إلا من نسخة مصدرية. تحمّل النسخ المصدرية المشغّل المضمّن مباشرة - ولا حاجة إلى خطوة تثبيت Plugin.

لمزيد من سياق إطار عمل QA الأوسع، راجع [نظرة عامة على QA](/ar/concepts/qa-e2e-automation).

## البدء السريع

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

يشغّل الأمر العادي `pnpm openclaw qa matrix` الخيار `--profile all` ولا يتوقف عند أول فشل. استخدم `--profile fast --fail-fast` كبوابة إصدار؛ وجزّئ الكتالوج باستخدام `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` عند تشغيل المخزون الكامل بالتوازي.

## ما يفعله المسار

1. يوفّر خادمًا منزليًا Tuwunel قابلًا للتخلّص منه في Docker (الصورة الافتراضية `ghcr.io/matrix-construct/tuwunel:v1.5.1`، واسم الخادم `matrix-qa.test`، والمنفذ `28008`).
2. يسجّل ثلاثة مستخدمين مؤقتين - `driver` (يرسل حركة المرور الواردة)، و`sut` (حساب OpenClaw Matrix قيد الاختبار)، و`observer` (التقاط حركة مرور من طرف ثالث).
3. يهيّئ الغرف المطلوبة للسيناريوهات المحددة مسبقًا (الرئيسية، وسلاسل النقاش، والوسائط، وإعادة التشغيل، والثانوية، وقائمة السماح، وE2EE، ورسالة DM للتحقق، وغيرها).
4. يبدأ Gateway فرعيًا من OpenClaw مع Plugin Matrix الحقيقي المقيّد بحساب SUT؛ ولا يتم تحميل `qa-channel` في الفرع.
5. يشغّل السيناريوهات بالتسلسل، مع مراقبة الأحداث عبر عملاء Matrix للسائق/المراقب.
6. يفكك الخادم المنزلي، ويكتب عناصر التقرير والملخص، ثم يخرج.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### الأعلام الشائعة

| العلم                  | الافتراضي                                       | الوصف                                                                                                            |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | ملف تعريف السيناريو. راجع [ملفات التعريف](#profiles).                                                                           |
| `--fail-fast`         | متوقف                                           | التوقف بعد أول فحص أو سيناريو فاشل.                                                                         |
| `--scenario <id>`     | -                                             | تشغيل هذا السيناريو فقط. قابل للتكرار. راجع [السيناريوهات](#scenarios).                                                       |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | المكان الذي تُكتب فيه التقارير، والملخص، والأحداث المرصودة، وسجل الإخراج. تُحلّ المسارات النسبية مقابل `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | جذر المستودع عند الاستدعاء من دليل عمل محايد.                                                        |
| `--sut-account <id>`  | `sut`                                         | معرّف حساب Matrix داخل إعدادات Gateway الخاصة بـ QA.                                                                        |

### أعلام المزوّد

يستخدم المسار نقل Matrix حقيقيًا لكن مزوّد النموذج قابل للضبط:

| العلم                     | الافتراضي          | الوصف                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` لإرسال وهمي حتمي أو `live-frontier` لمزوّدي frontier الحيين. لا يزال الاسم المستعار القديم `live-openai` يعمل. |
| `--model <ref>`          | افتراضي المزوّد | مرجع `provider/model` الأساسي.                                                                                                             |
| `--alt-model <ref>`      | افتراضي المزوّد | مرجع `provider/model` البديل عندما تبدّل السيناريوهات أثناء التشغيل.                                                                            |
| `--fast`                 | متوقف              | تفعيل الوضع السريع للمزوّد حيث يكون مدعومًا.                                                                                                |

لا يقبل Matrix QA الخيار `--credential-source` أو `--credential-role`. يوفّر المسار مستخدمين قابلين للتخلّص منهم محليًا؛ ولا توجد مجموعة بيانات اعتماد مشتركة للاستئجار منها.

## ملفات التعريف

يحدد ملف التعريف المحدد أي السيناريوهات ستعمل.

| ملف التعريف         | استخدمه من أجل                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (افتراضي) | الكتالوج الكامل. بطيء لكنه شامل.                                                                                                                                                                                                   |
| `fast`          | مجموعة فرعية كبوابة إصدار تختبر عقد النقل الحي: canary، وبوابة الإشارات، وحظر قائمة السماح، وشكل الرد، واستئناف إعادة التشغيل، ومتابعة سلسلة النقاش، وعزل سلسلة النقاش، ومراقبة التفاعل، وتسليم بيانات اعتماد الموافقة على exec. |
| `transport`     | سيناريوهات سلاسل النقاش على مستوى النقل، وDM، والغرف، والانضمام التلقائي، والإشارات/قائمة السماح، والموافقة، والتفاعلات.                                                                                                                                  |
| `media`         | تغطية مرفقات الصور، والصوت، والفيديو، وPDF، وEPUB.                                                                                                                                                                                  |
| `e2ee-smoke`    | الحد الأدنى من تغطية E2EE - رد مشفّر أساسي، ومتابعة سلسلة نقاش، ونجاح bootstrap.                                                                                                                                                  |
| `e2ee-deep`     | سيناريوهات E2EE الشاملة لفقدان الحالة، والنسخ الاحتياطي، والمفاتيح، والاسترداد.                                                                                                                                                                     |
| `e2ee-cli`      | سيناريوهات CLI الخاصة بـ `openclaw matrix encryption setup` و`verify *` المشغّلة عبر حزمة QA.                                                                                                                                       |

يوجد التعيين الدقيق في `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## السيناريوهات

قائمة معرّفات السيناريوهات الكاملة هي اتحاد `MatrixQaScenarioId` في `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. تتضمن الفئات:

- سلاسل النقاش - `matrix-thread-*`، `matrix-subagent-thread-spawn`
- المستوى الأعلى / DM / الغرفة - `matrix-top-level-reply-shape`، `matrix-room-*`، `matrix-dm-*`
- البث وتقدّم الأدوات - `matrix-room-partial-streaming-preview`، `matrix-room-quiet-streaming-preview`، `matrix-room-tool-progress-*`، `matrix-room-block-streaming`
- الوسائط - `matrix-media-type-coverage`، `matrix-room-image-understanding-attachment`، `matrix-attachment-only-ignored`، `matrix-unsupported-media-safe`
- التوجيه - `matrix-room-autojoin-invite`، `matrix-secondary-room-*`
- التفاعلات - `matrix-reaction-*`
- الموافقات - `matrix-approval-*` (بيانات اعتماد exec/Plugin، والبديل المجزأ، وتفاعلات الرفض، وسلاسل النقاش، وتوجيه `target: "both"`)
- إعادة التشغيل وإعادة التشغيل من السجل - `matrix-restart-*`، `matrix-stale-sync-replay-dedupe`، `matrix-room-membership-loss`، `matrix-homeserver-restart-resume`، `matrix-initial-catchup-then-incremental`
- بوابة الإشارات، والتواصل بين بوت وبوت، وقوائم السماح - `matrix-mention-*`، `matrix-allowbots-*`، `matrix-allowlist-*`، `matrix-multi-actor-ordering`، `matrix-inbound-edit-*`، `matrix-mxid-prefixed-command-block`، `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (رد أساسي، ومتابعة سلسلة نقاش، وbootstrap، ودورة حياة مفتاح الاسترداد، ومتغيرات فقدان الحالة، وسلوك النسخ الاحتياطي على الخادم، ونظافة الأجهزة، والتحقق عبر SAS / QR / DM، وإعادة التشغيل، وتنقيح العناصر)
- CLI الخاص بـ E2EE - `matrix-e2ee-cli-*` (إعداد التشفير، وإعداد idempotent، وفشل bootstrap، ودورة حياة مفتاح الاسترداد، والحسابات المتعددة، وجولة ذهاب وإياب لرد Gateway، والتحقق الذاتي)

مرّر `--scenario <id>` (قابل للتكرار) لتشغيل مجموعة منتقاة يدويًا؛ وادمجه مع `--profile all` لتجاهل بوابة ملف التعريف.

## متغيرات البيئة

| المتغير                                | الافتراضي                                   | التأثير                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 دقيقة)                        | حد أعلى صارم للتشغيل بأكمله.                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | حد للرد الأولي للكناري. يرفع CI للإصدار هذا الحد على المشغلات المشتركة حتى لا تفشل أول دورة Gateway بطيئة قبل بدء تغطية السيناريوهات.                                       |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | نافذة هدوء لتأكيدات عدم الرد السلبية. تُقيَّد إلى `≤` مهلة التشغيل.                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | حد لتفكيك Docker. تتضمن أسطح الفشل أمر الاسترداد `docker compose ... down --remove-orphans`.                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | تجاوز صورة خادم المنازل عند التحقق مقابل إصدار Tuwunel مختلف.                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | مفعّل                                        | `0` يكتم أسطر تقدم `[matrix-qa] ...` على stderr. و`1` يفرض تفعيلها.                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | منقّح                                  | `1` يُبقي متن الرسالة و`formatted_body` في `matrix-qa-observed-events.json`. الإعداد الافتراضي ينقّحها للحفاظ على أمان مصنوعات CI.                                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | معطّل                                       | `1` يتخطى `process.exit` الحتمي بعد كتابة المصنوعات. الإعداد الافتراضي يفرض الخروج لأن مقابض التشفير الأصلية في matrix-js-sdk قد تُبقي حلقة الأحداث حيّة بعد اكتمال المصنوعات. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | غير معيّن                                     | عند تعيينه بواسطة مشغّل خارجي (مثل `scripts/run-node.mjs`)، تعيد QA الخاصة بـ Matrix استخدام مسار السجل هذا بدلًا من بدء tee خاص بها.                                                                   |

## مصنوعات الإخراج

تُكتب إلى `--output-dir`:

- `matrix-qa-report.md` - تقرير بروتوكول Markdown (ما الذي نجح، وفشل، وتُخطّي، ولماذا).
- `matrix-qa-summary.json` - ملخص منظّم مناسب لتحليل CI ولوحات المعلومات.
- `matrix-qa-observed-events.json` - أحداث Matrix المرصودة من عملاء السائق والمراقب. تُنقّح المتون ما لم يكن `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`؛ وتُلخّص بيانات الموافقة الوصفية باستخدام حقول آمنة مختارة ومعاينة أمر مقتطعة.
- `matrix-qa-output.log` - stdout/stderr المدمجان من التشغيل. إذا كان `OPENCLAW_RUN_NODE_OUTPUT_LOG` معيّنًا، يُعاد استخدام سجل المشغّل الخارجي بدلًا من ذلك.

دليل الإخراج الافتراضي هو `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` حتى لا تستبدل التشغيلات المتتالية بعضها بعضًا.

## نصائح الفرز

- **يتوقف التشغيل قرب النهاية:** قد تعيش مقابض التشفير الأصلية في `matrix-js-sdk` مدة أطول من عُدّة الاختبار. الإعداد الافتراضي يفرض `process.exit` نظيفًا بعد كتابة المصنوعات؛ إذا كنت قد ألغيت تعيين `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`، فتوقع أن تبقى العملية معلّقة.
- **خطأ التنظيف:** ابحث عن أمر الاسترداد المطبوع (استدعاء `docker compose ... down --remove-orphans`) وشغّله يدويًا لتحرير منفذ خادم المنازل.
- **نوافذ التأكيد السلبي غير المستقرة في CI:** اخفض `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (الافتراضي 8 ثوانٍ) عندما يكون CI سريعًا؛ وارفعه على المشغلات المشتركة البطيئة.
- **تحتاج إلى متون منقّحة لتقرير خلل:** أعد التشغيل مع `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` وأرفق `matrix-qa-observed-events.json`. تعامل مع المصنوع الناتج على أنه حساس.
- **إصدار Tuwunel مختلف:** وجّه `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` إلى الإصدار قيد الاختبار. يتحقق المسار من الصورة الافتراضية المثبتة فقط.

## عقد النقل الحي

Matrix هو أحد ثلاثة مسارات نقل حية (Matrix، Telegram، Discord) تشترك في قائمة تحقق عقد واحدة معرفة في [نظرة عامة على QA ← تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). يظل `qa-channel` المجموعة الاصطناعية الواسعة وليس جزءًا من تلك المصفوفة عن قصد.

## ذات صلة

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) - مكدس QA العام وعقد النقل الحي
- [قناة QA](/ar/channels/qa-channel) - محوّل قناة اصطناعي للسيناريوهات المدعومة بالمستودع
- [الاختبار](/ar/help/testing) - تشغيل الاختبارات وإضافة تغطية QA
- [Matrix](/ar/channels/matrix) - Plugin القناة قيد الاختبار
