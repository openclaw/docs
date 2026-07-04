---
read_when:
    - تشغيل pnpm openclaw qa matrix محليًا
    - إضافة سيناريوهات ضمان جودة Matrix أو تحديدها
    - فرز أعطال Matrix QA أو المهلات أو التنظيف العالق
summary: 'مرجع المشرف لمسار QA المباشر في Matrix المدعوم بـ Docker: CLI، وملفات التعريف، ومتغيرات البيئة، والسيناريوهات، ومصنوعات الإخراج.'
title: ضمان جودة المصفوفة
x-i18n:
    generated_at: "2026-07-04T20:34:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

تُشغّل مسار Matrix QA الـ Plugin المضمّن `@openclaw/matrix` مقابل خادم Tuwunel homeserver مؤقت في Docker، مع حسابات مؤقتة للسائق وSUT والمراقب، إضافةً إلى غرف مُهيأة مسبقاً. وهو تغطية النقل الحية والواقعية لـ Matrix.

هذه أدوات خاصة بالمشرفين فقط. إصدارات OpenClaw المعبأة تتعمد حذف `qa-lab`، لذلك لا يتوفر `openclaw qa` إلا من checkout للمصدر. تقوم checkouts المصدر بتحميل المشغّل المضمّن مباشرةً - ولا حاجة إلى خطوة تثبيت Plugin.

للحصول على سياق أوسع حول إطار QA، راجع [نظرة عامة على QA](/ar/concepts/qa-e2e-automation).

## البدء السريع

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

يشغّل الأمر العادي `pnpm openclaw qa matrix` الخيار `--profile all` ولا يتوقف عند أول فشل. استخدم `--profile fast --fail-fast` كبوابة إصدار؛ وقسّم الفهرس باستخدام `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` عند تشغيل المخزون الكامل بالتوازي.

## ما يفعله المسار

1. يوفّر خادم Tuwunel homeserver مؤقتاً في Docker (الصورة الافتراضية `ghcr.io/matrix-construct/tuwunel:v1.5.1`، اسم الخادم `matrix-qa.test`، المنفذ `28008`) خلف مسجّل محدود يحجب البيانات الحساسة للطلبات/الاستجابات.
2. يسجّل ثلاثة مستخدمين مؤقتين - `driver` (يرسل حركة المرور الواردة)، و`sut` (حساب OpenClaw Matrix قيد الاختبار)، و`observer` (التقاط حركة مرور من طرف ثالث).
3. يهيئ الغرف المطلوبة من السيناريوهات المحددة (الرئيسية، threading، الوسائط، إعادة التشغيل، الثانوية، قائمة السماح، E2EE، رسالة التحقق المباشرة، وما إلى ذلك).
4. يشغّل مجس بروتوكول `matrix-qa-v1` المحايد للركيزة مقابل حد Tuwunel المسجّل. تثبت اختبارات الوحدة عقد المجس مع مُثبّت بروتوكول Matrix؛ ويمتلك مضيف محوّل نقل QA المعياري في [#99707](https://github.com/openclaw/openclaw/pull/99707) توصيلات هدف Crabline الحقيقية.
5. يبدأ Gateway فرعياً من OpenClaw مع Plugin Matrix الحقيقي المقيّد بحساب SUT؛ ولا يتم تحميل `qa-channel` في الفرع.
6. يشغّل السيناريوهات بالتتابع، مع مراقبة الأحداث عبر عملاء Matrix للسائق/المراقب واشتقاق توقعات التوجيه/الحالة من حركة المرور المسجّلة.
7. يفكك خادم homeserver، ويكتب التقرير ومخرجات الأدلة، ثم يخرج.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### العلامات الشائعة

| العلامة                | الافتراضي                                    | الوصف                                                                                                                                       |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                       | ملف تعريف السيناريو. راجع [ملفات التعريف](#profiles).                                                                                       |
| `--fail-fast`         | متوقف                                       | التوقف بعد أول فحص أو سيناريو فاشل.                                                                                                        |
| `--scenario <id>`     | -                                           | تشغيل هذا السيناريو فقط. قابل للتكرار. راجع [السيناريوهات](#scenarios).                                                                    |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | مكان كتابة التقارير والملخص ومخزون التوجيه/الحالة والأحداث المرصودة وسجل الإخراج. تُحل المسارات النسبية مقابل `--repo-root`.              |
| `--repo-root <path>`  | `process.cwd()`                             | جذر المستودع عند الاستدعاء من دليل عمل محايد.                                                                                              |
| `--sut-account <id>`  | `sut`                                       | معرّف حساب Matrix داخل إعدادات Gateway الخاصة بـ QA.                                                                                        |

### علامات المزوّد

يستخدم المسار نقل Matrix حقيقياً، لكن مزوّد النموذج قابل للتكوين:

| العلامة                 | الافتراضي        | الوصف                                                                                                                                          |
| ----------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier` | `mock-openai` للإرسال الوهمي الحتمي أو `live-frontier` لمزوّدي frontier الحيين. لا يزال الاسم المستعار القديم `live-openai` يعمل.             |
| `--model <ref>`         | افتراضي المزوّد  | مرجع `provider/model` الأساسي.                                                                                                                  |
| `--alt-model <ref>`     | افتراضي المزوّد  | مرجع `provider/model` بديل عند تبديل السيناريوهات في منتصف التشغيل.                                                                            |
| `--fast`                | متوقف            | تفعيل الوضع السريع للمزوّد حيث يكون مدعوماً.                                                                                                  |

لا يقبل Matrix QA الخيارين `--credential-source` أو `--credential-role`. يوفّر المسار مستخدمين مؤقتين محلياً؛ ولا توجد مجموعة بيانات اعتماد مشتركة للاستئجار منها.

## ملفات التعريف

يحدد ملف التعريف المحدد السيناريوهات التي ستعمل.

| ملف التعريف     | استخدمه من أجل                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (افتراضي) | الفهرس الكامل. بطيء لكنه شامل.                                                                                                                                                                                                       |
| `fast`          | مجموعة فرعية لبوابة الإصدار تختبر عقد النقل الحي: canary، بوابة الإشارات، حظر قائمة السماح، شكل الرد، استئناف إعادة التشغيل، متابعة threading، عزل threading، مراقبة التفاعلات، وتسليم بيانات اعتماد موافقة exec الوصفية. |
| `transport`     | سيناريوهات threading على مستوى النقل، والرسائل المباشرة، والغرف، والانضمام التلقائي، والإشارة/قائمة السماح، والموافقة، والتفاعل.                                                                                                   |
| `media`         | تغطية مرفقات الصور والصوت والفيديو وPDF وEPUB.                                                                                                                                                                                      |
| `e2ee-smoke`    | الحد الأدنى من تغطية E2EE - رد مشفّر أساسي، ومتابعة threading، ونجاح bootstrap.                                                                                                                                                       |
| `e2ee-deep`     | سيناريوهات شاملة لفقدان حالة E2EE والنسخ الاحتياطي والمفاتيح والاسترداد.                                                                                                                                                            |
| `e2ee-cli`      | سيناريوهات CLI للأمرين `openclaw matrix encryption setup` و`verify *` التي تُقاد عبر حزمة QA.                                                                                                                                         |

توجد المطابقة الدقيقة في `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## السيناريوهات

قائمة معرّفات السيناريو الكاملة هي اتحاد `MatrixQaScenarioId` في `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. تشمل الفئات:

- threading - `matrix-thread-*`، `matrix-subagent-thread-spawn`
- المستوى الأعلى / رسالة مباشرة / غرفة - `matrix-top-level-reply-shape`، `matrix-room-*`، `matrix-dm-*`
- البث وتقدم الأدوات - `matrix-room-partial-streaming-preview`، `matrix-room-quiet-streaming-preview`، `matrix-room-tool-progress-*`، `matrix-room-block-streaming`
- الوسائط - `matrix-media-type-coverage`، `matrix-room-image-understanding-attachment`، `matrix-attachment-only-ignored`، `matrix-unsupported-media-safe`
- التوجيه - `matrix-room-autojoin-invite`، `matrix-secondary-room-*`
- التفاعلات - `matrix-reaction-*`
- الموافقات - `matrix-approval-*` (بيانات exec/Plugin الوصفية، fallback المجزأ، تفاعلات الرفض، threading، وتوجيه `target: "both"`)
- إعادة التشغيل وإعادة التشغيل من السجل - `matrix-restart-*`، `matrix-stale-sync-replay-dedupe`، `matrix-room-membership-loss`، `matrix-homeserver-restart-resume`، `matrix-initial-catchup-then-incremental`
- بوابة الإشارات، وروبوت إلى روبوت، وقوائم السماح - `matrix-mention-*`، `matrix-allowbots-*`، `matrix-allowlist-*`، `matrix-multi-actor-ordering`، `matrix-inbound-edit-*`، `matrix-mxid-prefixed-command-block`، `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (رد أساسي، متابعة threading، bootstrap، دورة حياة مفتاح الاسترداد، متغيرات فقدان الحالة، سلوك النسخ الاحتياطي للخادم، نظافة الجهاز، تحقق SAS / QR / DM، إعادة التشغيل، حجب مخرجات الأدلة)
- E2EE CLI - `matrix-e2ee-cli-*` (إعداد التشفير، إعداد متكرر آمن، فشل bootstrap، دورة حياة مفتاح الاسترداد، حسابات متعددة، رحلة ذهاب وإياب لرد Gateway، التحقق الذاتي)

مرّر `--scenario <id>` (قابل للتكرار) لتشغيل مجموعة منتقاة يدوياً؛ واجمعه مع `--profile all` لتجاهل بوابة ملف التعريف.

## متغيرات البيئة

| المتغير                                | الافتراضي                                   | التأثير                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 دقيقة)                        | حد أعلى صارم للتشغيل بأكمله.                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | حد لرد الاختبار الأولي. يرفع CI للإصدارات هذا الحد على المشغلات المشتركة كي لا تفشل دورة Gateway الأولى البطيئة قبل بدء تغطية السيناريو.                                       |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | نافذة هادئة لتأكيدات عدم الرد السلبية. تُقيَّد إلى `≤` مهلة التشغيل.                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | حد لإزالة Docker. تتضمن أسطح الفشل أمر الاسترداد `docker compose ... down --remove-orphans`.                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | تجاوز صورة الخادم المنزلي عند التحقق باستخدام إصدار Tuwunel مختلف.                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | مفعّل                                        | تجعل `0` أسطر تقدم `[matrix-qa] ...` صامتة على stderr. وتجبرها `1` على الظهور.                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | منقّح                                  | تبقي `1` نص الرسالة و`formatted_body` في `matrix-qa-observed-events.json`. ينقّح الافتراضي المحتوى للحفاظ على أمان عناصر CI.                                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | معطّل                                       | تتخطى `1` استدعاء `process.exit` الحتمي بعد كتابة العناصر. يفرض الافتراضي الخروج لأن مقابض التشفير الأصلية في matrix-js-sdk يمكن أن تبقي حلقة الأحداث نشطة بعد اكتمال العناصر. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | غير معيّن                                     | عند تعيينه بواسطة مشغّل خارجي (مثل `scripts/run-node.mjs`)، يعيد QA الخاص بـ Matrix استخدام مسار السجل هذا بدلاً من بدء `tee` خاص به.                                                                   |

## عناصر الإخراج

تُكتب إلى `--output-dir`:

- `matrix-qa-report.md` - تقرير بروتوكول Markdown (ما نجح، وما فشل، وما تم تخطيه، والسبب).
- `matrix-qa-summary.json` - ملخص منظم مناسب لتحليل CI ولوحات المعلومات.
- `matrix-qa-route-state-manifest.json` - قائمة حصر `matrix-qa-v1` ديناميكية مفهرسة حسب معرف السيناريو. تسجل أشكال المسارات/الأجسام المنقّحة، وترتيب الطلبات، وإعادات المحاولة المرصودة، والأخطاء، واستمرارية رموز المزامنة، وعائلات حالات الأجهزة/المفاتيح/الوسائط/النسخ الاحتياطي المرصودة أثناء ذلك التشغيل. هذا دليل قابل للتنفيذ، وليس أساساً مرجعياً محفوظاً في المستودع.
- `matrix-qa-observed-events.json` - أحداث Matrix المرصودة من عملاء السائق والمراقب. تُنقّح الأجسام ما لم يكن `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`؛ وتُلخّص بيانات موافقة التعريف باستخدام حقول آمنة مختارة ومعاينة أمر مقتطعة.
- `matrix-qa-output.log` - مخرجات stdout/stderr المجمعة من التشغيل. إذا كان `OPENCLAW_RUN_NODE_OUTPUT_LOG` معيّناً، يُعاد استخدام سجل المشغّل الخارجي بدلاً من ذلك.

دليل الإخراج الافتراضي هو `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` كي لا تستبدل عمليات التشغيل المتعاقبة بعضها بعضاً.

## نصائح الفرز

- **يتوقف التشغيل قرب النهاية:** يمكن أن تبقى مقابض التشفير الأصلية في `matrix-js-sdk` بعد عمر الحزام الاختباري. يفرض الافتراضي استدعاء `process.exit` نظيفاً بعد كتابة العناصر؛ إذا كنت قد ألغيت تعيين `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`، فتوقع أن تبقى العملية قيد التشغيل مدة أطول.
- **خطأ تنظيف:** ابحث عن أمر الاسترداد المطبوع (استدعاء `docker compose ... down --remove-orphans`) وشغّله يدوياً لتحرير منفذ الخادم المنزلي.
- **نوافذ التأكيدات السلبية المتذبذبة في CI:** خفّض `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (الافتراضي 8 ثوانٍ) عندما يكون CI سريعاً؛ وارفعه على المشغلات المشتركة البطيئة.
- **تحتاج إلى أجسام منقّحة لتقرير خطأ:** أعد التشغيل باستخدام `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` وأرفق `matrix-qa-observed-events.json`. تعامل مع العنصر الناتج باعتباره حساساً.
- **إصدار Tuwunel مختلف:** وجّه `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` إلى الإصدار قيد الاختبار. يتحقق المسار من الصورة الافتراضية المثبتة فقط.

## عقد النقل المباشر

Matrix واحد من ثلاثة مسارات نقل مباشرة (Matrix وTelegram وDiscord) تشترك في قائمة تحقق عقد واحدة معرّفة في [نظرة عامة على QA → تغطية النقل المباشر](/ar/concepts/qa-e2e-automation#live-transport-coverage). تبقى `qa-channel` هي الحزمة الاصطناعية الواسعة، وهي ليست جزءاً من تلك المصفوفة عمداً.

## ذات صلة

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) - مكدس QA العام وعقد النقل المباشر
- [قناة QA](/ar/channels/qa-channel) - محوّل قناة اصطناعي للسيناريوهات المدعومة بالمستودع
- [الاختبار](/ar/help/testing) - تشغيل الاختبارات وإضافة تغطية QA
- [Matrix](/ar/channels/matrix) - Plugin القناة قيد الاختبار
