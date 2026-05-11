---
read_when:
    - تشغيل الاختبارات محليًا أو في التكامل المستمر
    - إضافة اختبارات انحدار لأخطاء النموذج/المزوّد
    - تصحيح أخطاء سلوك Gateway + الوكيل
summary: 'مجموعة أدوات الاختبار: مجموعات اختبارات الوحدة/e2e/المباشرة، ومشغلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-05-11T20:34:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

لدى OpenClaw ثلاث مجموعات اختبارات Vitest (الوحدات/التكامل، الطرف إلى الطرف، الحية) ومجموعة صغيرة
من مشغلات Docker. هذا المستند دليل "كيف نختبر":

- ما تغطيه كل مجموعة (وما لا تغطيه عمدًا _بشكل مقصود_).
- أي أوامر تُشغّل لسير العمل الشائع (محليًا، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/المزوّدين.
- كيف تضيف اختبارات تراجع لمشكلات النماذج/المزوّدين الواقعية.

<Note>
**حزمة QA (qa-lab، qa-channel، مسارات النقل الحية)** موثّقة بشكل منفصل:

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) - البنية، سطح الأوامر، تأليف السيناريوهات.
- [Matrix QA](/ar/concepts/qa-matrix) - مرجع لـ `pnpm openclaw qa matrix`.
- [قناة QA](/ar/channels/qa-channel) - Plugin النقل الاصطناعي المستخدم في السيناريوهات المدعومة بالمستودع.

تغطي هذه الصفحة تشغيل مجموعات الاختبار العادية ومشغلات Docker/Parallels. يسرد قسم المشغلات الخاصة بـ QA أدناه ([المشغلات الخاصة بـ QA](#qa-specific-runners)) استدعاءات `qa` المحددة ويشير مجددًا إلى المراجع أعلاه.
</Note>

## البدء السريع

في معظم الأيام:

- بوابة كاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل محلي أسرع للمجموعة الكاملة على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- الاستهداف المباشر للملفات يوجّه الآن مسارات الإضافات/القنوات أيضًا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تكرّر العمل على فشل واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA المدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة اختبارات الطرف إلى الطرف: `pnpm test:e2e`

عند تصحيح المزوّدين/النماذج الحقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة الحية (النماذج + فحوص أدوات/صور Gateway): `pnpm test:live`
- استهدف ملفًا حيًا واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- تقارير أداء وقت التشغيل: أطلق `OpenClaw Performance` مع
  `live_gpt54=true` لدورة وكيل `openai/gpt-5.4` حقيقية أو
  `deep_profile=true` لآثار Kova الخاصة بالمعالج/الذاكرة/التتبع. تنشر التشغيلات اليومية المجدولة
  عناصر مسارات المزوّد الوهمي، والملف العميق، وGPT 5.4 إلى
  `openclaw/clawgrit-reports` عند تهيئة `CLAWGRIT_REPORTS_TOKEN`. يتضمن
  تقرير المزوّد الوهمي أيضًا أرقام إقلاع Gateway على مستوى المصدر، والذاكرة،
  وضغط Plugin، وحلقة ترحيب النموذج الوهمي المتكررة، وبدء تشغيل CLI.
- مسح النماذج الحية عبر Docker: `pnpm test:docker:live-models`
  - يشغّل كل نموذج محدد الآن دورة نصية إضافة إلى فحص صغير بأسلوب قراءة ملف.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغّل أيضًا دورة صورة صغيرة.
    عطّل الفحوص الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل إخفاقات المزوّدين.
  - تغطية CI: يستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومي و
    `OpenClaw Release Checks` اليدوي سير العمل القابل لإعادة الاستخدام للاختبارات الحية/الطرف إلى الطرف مع
    `include_live_suites: true`، والذي يتضمن مهام مصفوفة منفصلة لنماذج Docker الحية
    مجزأة حسب المزوّد.
  - لإعادات تشغيل CI مركزة، أطلق `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و `live_models_only: true`.
  - أضف أسرار مزوّدين جديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    إضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/الخاصة بالإصدار.
- فحص الدخان للمحادثة المرتبطة الأصلية في Codex: `pnpm test:docker:live-codex-bind`
  - يشغّل مسار Docker حيًا على مسار خادم تطبيق Codex، ويربط رسالة Slack مباشرة اصطناعية
    باستخدام `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من أن ردًا عاديًا ومرفق صورة
    يمران عبر ربط Plugin الأصلي بدلًا من ACP.
- فحص الدخان لحاضنة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغّل دورات وكيل Gateway عبر حاضنة خادم تطبيق Codex المملوكة لـ Plugin،
    ويتحقق من `/codex status` و `/codex models`، وبشكل افتراضي يمارس فحوص الصورة،
    وcron MCP، والوكيل الفرعي، وGuardian. عطّل فحص الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل إخفاقات أخرى في
    خادم تطبيق Codex. لفحص مركز للوكيل الفرعي، عطّل الفحوص الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد فحص الوكيل الفرعي ما لم يتم ضبط
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- فحص الدخان لتثبيت Codex عند الطلب: `pnpm test:docker:codex-on-demand`
  - يثبّت حزمة OpenClaw المؤرشفة في Docker، ويشغّل تهيئة مفتاح OpenAI API،
    ويتحقق من أن Plugin الخاص بـ Codex وتبعية `@openai/codex`
    تم تنزيلهما إلى جذر npm المدار عند الطلب.
- فحص الدخان لتبعية أداة Plugin الحية: `pnpm test:docker:live-plugin-tool`
  - يحزم Plugin تجريبيًا مع تبعية `slugify` حقيقية، ويثبته عبر
    `npm-pack:`، ويتحقق من التبعية تحت جذر npm المدار، ثم يطلب من
    نموذج OpenAI حي استدعاء أداة Plugin وإرجاع المعرّف المختصر المخفي.
- فحص الدخان لأمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري مضاعف الاحتياط لسطح أمر إنقاذ قناة الرسائل.
    يمارس `/crestodian status`، ويصف تغيير نموذج مستمرًا في الطابور،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعدادات.
- فحص دخان مخطط Crestodian عبر Docker: `pnpm test:docker:crestodian-planner`
  - يشغّل Crestodian في حاوية بلا إعدادات مع Claude CLI وهمي على `PATH`
    ويتحقق من أن بديل المخطط التقريبي يُترجم إلى كتابة إعدادات نمطية خاضعة للتدقيق.
- فحص دخان التشغيل الأول لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من مجلد حالة OpenClaw فارغ، ويوجّه `openclaw` المجرد إلى
    Crestodian، ويطبق إعدادات الإعداد/النموذج/الوكيل/Plugin الخاص بـ Discord + كتابات SecretRef،
    ويتحقق من الإعدادات، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضًا في QA Lab بواسطة
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- فحص دخان تكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مع `moonshot/kimi-k2.6`. تحقق من أن JSON يبلّغ عن Moonshot/K2.6 وأن
  سجل مساعد المحادثة يخزن `usage.cost` المعياري.

<Tip>
عندما تحتاج إلى حالة فاشلة واحدة فقط، فضّل تضييق الاختبارات الحية عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## المشغلات الخاصة بـ QA

توجد هذه الأوامر بجانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغّل CI مختبر QA في سير عمل مخصص. تكافؤ الوكلاء متداخل تحت
`QA-Lab - All Lanes` والتحقق من الإصدار، وليس سير عمل PR مستقلًا.
ينبغي أن يستخدم التحقق الواسع `Full Release Validation` مع
`rerun_group=qa-parity` أو مجموعة QA الخاصة بفحوص الإصدار. تبقي فحوص الإصدار
المستقرة/الافتراضية الاختبارات الحية/Docker الشاملة وراء `run_release_soak=true`؛ ويفرض
ملف التعريف `full` تشغيلها. يشغّل `QA-Lab - All Lanes`
ليليًا على `main` ومن التشغيل اليدوي مع مسار تكافؤ وهمي، ومسار Matrix حي،
ومسار Telegram حي مدار بواسطة Convex، ومسار Discord حي مدار بواسطة Convex
كمهام متوازية. تمرر QA المجدولة وفحوص الإصدار إلى Matrix
`--profile fast` صراحة، بينما يبقى الافتراضي لكل من Matrix CLI ومدخلات سير العمل اليدوية
`all`؛ ويمكن للتشغيل اليدوي تجزئة `all` إلى مهام `transport`،
و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`. يشغّل `OpenClaw Release
Checks` التكافؤ إضافة إلى مسارات Matrix السريعة وTelegram قبل موافقة الإصدار،
باستخدام `mock-openai/gpt-5.5` لفحوص نقل الإصدار حتى تبقى
حتمية وتتجنب بدء تشغيل Plugin المزوّد العادي. تعطل Gateways النقل الحية هذه بحث الذاكرة؛ ويظل سلوك الذاكرة مغطى بواسطة مجموعات تكافؤ QA.

تستخدم أجزاء الوسائط الحية للإصدار الكامل
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، والذي يحتوي مسبقًا على
`ffmpeg` و`ffprobe`. تستخدم أجزاء نماذج/خلفيات Docker الحية صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
التزام محدد، ثم تسحبها باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلًا من إعادة البناء
داخل كل جزء.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة بالمستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا باستخدام عمال Gateway
    معزولين. يضبط `qa-channel` التوازي افتراضيًا على 4 (محدودًا بعدد
    السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد العمال،
    أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد المخرجات دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم مزوّد محليًا مدعومًا بـ AIMock لتغطية التجارب
    والبروتوكولات الوهمية دون استبدال مسار `mock-openai` الواعي بالسيناريوهات.
- `pnpm test:plugins:kitchen-sink-live`
  - يشغّل اختبار التحمل الحي لـ OpenAI Kitchen Sink Plugin عبر QA Lab. يثبّت
    حزمة Kitchen Sink الخارجية، ويتحقق من مخزون سطح plugin SDK، ويفحص
    `/healthz` و`/readyz`، ويسجل دليل CPU/RSS للـ Gateway، ويشغّل دورة OpenAI
    حية، ويتحقق من التشخيصات العدائية. يتطلب مصادقة OpenAI حية مثل
    `OPENAI_API_KEY`. في جلسات Testbox المهيأة، يحمّل تلقائيًا ملف تعريف
    المصادقة الحية الخاص بـ Testbox عندما يكون المساعد `openclaw-testbox-env`
    موجودًا.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل معيار بدء تشغيل Gateway مع حزمة صغيرة من سيناريوهات QA Lab الوهمية
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) ويكتب ملخص ملاحظة CPU مدمجًا تحت
    `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم افتراضيًا ملاحظات CPU الساخنة المستمرة فقط (`--cpu-core-warn`
    مع `--hot-wall-warn-ms`)، لذلك تُسجّل دفعات بدء التشغيل القصيرة كمقاييس
    دون أن تبدو كارتداد تثبيت Gateway الذي يستمر لدقائق.
  - يستخدم مخرجات `dist` المبنية؛ شغّل بناءً أولًا عندما لا تحتوي النسخة
    المستخرجة على مخرجات تشغيل حديثة.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل آلة Linux VM مؤقتة من Multipass.
  - يحافظ على سلوك اختيار السيناريوهات نفسه مثل `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزوّد/النموذج نفسها مثل `qa suite`.
  - تمرر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد المستندة إلى البيئة، ومسار إعداد مزوّد QA الحي، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى أدلة الإخراج تحت جذر المستودع كي يتمكن الضيف من الكتابة عائدًا
    عبر مساحة العمل المثبتة.
  - يكتب تقرير QA وملخصه العاديين إضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لعمل QA بنمط المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني أرشيف npm tarball من النسخة الحالية، ويثبته عالميًا في Docker، ويشغّل
    تهيئة OpenAI API-key غير تفاعلية، ويهيئ Telegram افتراضيًا، ويتحقق من أن
    تشغيل Plugin المعبأ يحمّل دون إصلاح تبعيات بدء التشغيل، ويشغّل doctor،
    ويشغّل دورة وكيل محلية واحدة ضد نقطة نهاية OpenAI وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ
    نفسه مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل اختبار دخان Docker حتميًا للتطبيق المبني من أجل نصوص سياق التشغيل
    المضمنة. يتحقق من أن سياق تشغيل OpenClaw المخفي يُحفظ كرسالة مخصصة غير
    معروضة بدلًا من التسرب إلى دورة المستخدم المرئية، ثم يزرع ملف JSONL لجلسة
    معطلة متأثرة ويتحقق من أن `openclaw doctor --fix` يعيد كتابته إلى الفرع
    النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبّت مرشح حزمة OpenClaw في Docker، ويشغّل تهيئة الحزمة المثبتة، ويهيئ
    Telegram عبر CLI المثبت، ثم يعيد استخدام مسار QA الحي لـ Telegram مع تلك
    الحزمة المثبتة كـ Gateway للنظام قيد الاختبار.
  - يثبّت الغلاف مصدر أداة `qa-lab` فقط من النسخة المستخرجة؛ تمتلك الحزمة
    المثبتة `dist` و`openclaw/plugin-sdk` وتشغيل Plugin المجمّع كي لا يخلط
    المسار plugins النسخة الحالية داخل الحزمة قيد الاختبار.
  - يضبط افتراضيًا `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛ اضبط
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار أرشيف tarball محلي محلول بدلًا من
    التثبيت من السجل.
  - يستخدم بيانات اعتماد بيئة Telegram نفسها أو مصدر بيانات اعتماد Convex مثل
    `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، اضبط
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` مع
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. إذا كان
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI،
    فإن غلاف Docker يختار Convex تلقائيًا.
  - يتحقق الغلاف من بيئة بيانات اعتماد Telegram أو Convex على المضيف قبل عمل
    بناء/تثبيت Docker. اضبط `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    فقط عند تصحيح إعداد ما قبل بيانات الاعتماد عمدًا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` قيمة
    `OPENCLAW_QA_CREDENTIAL_ROLE` المشتركة لهذا المسار فقط.
  - تعرض GitHub Actions هذا المسار كسير عمل مشرف يدوي
    `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة
    `qa-live-shared` وإيجارات بيانات اعتماد Convex الخاصة بـ CI.
- تعرض GitHub Actions أيضًا `Package Acceptance` لإثبات المنتج الجانبي
  مقابل حزمة مرشحة واحدة. يقبل مرجعًا موثوقًا، أو مواصفة npm منشورة،
  أو URL أرشيف tarball عبر HTTPS مع SHA-256، أو أداة tarball من تشغيل آخر،
  ويرفع `openclaw-current.tgz` الموحّد كـ `package-under-test`، ثم يشغّل
  مجدول Docker E2E الحالي بملفات تعريف مسارات smoke أو package أو product
  أو full أو custom. اضبط `telegram_mode=mock-openai` أو `live-frontier`
  لتشغيل سير عمل QA الخاص بـ Telegram مقابل أداة `package-under-test` نفسها.
  - أحدث إثبات منتج beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات URL أرشيف tarball المحدد بصمة:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- يحمّل إثبات الأداة أداة tarball من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - يحزم ويثبّت بناء OpenClaw الحالي في Docker، ويبدأ Gateway مع تهيئة OpenAI،
    ثم يفعّل القناة/plugins المجمعة عبر تعديلات الإعداد.
  - يتحقق من أن اكتشاف الإعداد يترك plugins القابلة للتنزيل غير المهيأة غائبة،
    وأن أول إصلاح doctor مهيأ يثبّت كل Plugin قابل للتنزيل ومفقود صراحة، وأن
    إعادة التشغيل الثانية لا تشغّل إصلاح تبعيات مخفيًا.
  - يثبّت أيضًا أساس npm قديمًا معروفًا، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن doctor ما بعد التحديث
    للمرشح ينظف بقايا تبعيات Plugin القديمة دون إصلاح postinstall من جهة الأداة.
- `pnpm test:parallels:npm-update`
  - يشغّل اختبار دخان تحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. يثبّت
    كل نظام أساسي محدد أولًا الحزمة الأساسية المطلوبة، ثم يشغّل أمر
    `openclaw update` المثبت في الضيف نفسه ويتحقق من الإصدار المثبت، وحالة
    التحديث، وجاهزية Gateway، ودورة وكيل محلية واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux`
    أثناء التكرار على ضيف واحد. استخدم `--json` لمسار أداة الملخص وحالة كل مسار.
  - يستخدم مسار OpenAI `openai/gpt-5.5` لإثبات دورة الوكيل الحية افتراضيًا.
    مرر `--model <provider/model>` أو اضبط `OPENCLAW_PARALLELS_OPENAI_MODEL`
    عند التحقق عمدًا من نموذج OpenAI آخر.
  - لف التشغيلات المحلية الطويلة بمهلة على المضيف كي لا تستهلك حالات توقف
    نقل Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسار متداخلة تحت `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي عالق.
  - يمكن أن يقضي تحديث Windows من 10 إلى 15 دقيقة في doctor ما بعد التحديث
    وعمل تحديث الحزمة على ضيف بارد؛ يظل ذلك سليمًا عندما يكون سجل تصحيح npm
    المتداخل في تقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات دخان Parallels الفردية
    لـ macOS أو Windows أو Linux. فهي تشترك في حالة VM وقد تتصادم عند استعادة
    اللقطة، أو تقديم الحزمة، أو حالة Gateway الضيف.
  - يشغّل إثبات ما بعد التحديث سطح Plugin المجمّع العادي لأن واجهات القدرة
    مثل الكلام، وتوليد الصور، وفهم الوسائط تُحمّل عبر واجهات API التشغيلية
    المجمعة حتى عندما تتحقق دورة الوكيل نفسها من رد نصي بسيط فقط.

- `pnpm openclaw qa aimock`
  - يبدأ خادم مزوّد AIMock المحلي فقط لاختبار دخان البروتوكول المباشر.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي لـ Matrix ضد خادم Tuwunel homeserver مؤقت مدعوم بـ Docker. النسخة المستخرجة من المصدر فقط - التثبيتات المعبأة لا تشحن `qa-lab`.
  - CLI الكامل، وكتالوجات الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط الأدوات: [Matrix QA](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي لـ Telegram ضد مجموعة خاصة حقيقية باستخدام رموز بوت السائق والنظام قيد الاختبار من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرف المجموعة هو معرف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المجمعة المشتركة. استخدم وضع البيئة افتراضيًا، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في الإيجارات المجمعة.
  - تغطي الإعدادات الافتراضية canary، وحجب الإشارة، وعنونة الأوامر، و`/status`، وردود البوت إلى البوت عند الإشارة، وردود الأوامر الأصلية الأساسية. تغطي إعدادات `mock-openai` الافتراضية أيضًا ارتدادات سلسلة الردود الحتمية وبث الرسالة النهائية في Telegram. استخدم `--list-scenarios` للفحوص الاختيارية مثل `session_status`.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد المخرجات دون رمز خروج فاشل.
  - يتطلب بوتين متميزين في المجموعة الخاصة نفسها، مع أن يعرّض بوت النظام قيد الاختبار اسم مستخدم Telegram.
  - للملاحظة المستقرة بين البوتات، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا البوتين وتأكد من أن بوت السائق يمكنه ملاحظة حركة مرور بوتات المجموعة.
  - يكتب تقرير QA لـ Telegram وملخصًا وأداة رسائل مرصودة تحت `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال السائق إلى رد النظام قيد الاختبار المرصود.

`Mantis Telegram Live` هو غلاف دليل PR حول هذا المسار. يشغّل المرجع المرشح
باستخدام بيانات اعتماد Telegram مؤجرة من Convex، ويعرض نص الرسائل المرصودة
المنقح في متصفح سطح مكتب Crabbox، ويسجل دليل MP4، وينشئ GIF مقصوص الحركة،
ويرفع حزمة الأدوات، وينشر دليل PR مضمنًا عبر تطبيق Mantis GitHub عندما يكون
`pr_number` مضبوطًا. يستطيع المشرفون بدءه من واجهة Actions عبر
`Mantis Scenario` (`scenario_id:
telegram-live`) أو مباشرة من تعليق طلب السحب:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` هو غلاف Telegram Desktop الأصلي الوكيلي
قبل/بعد لإثبات PR المرئي. ابدأه من واجهة Actions باستخدام
`instructions` حرة، أو عبر `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`)، أو من تعليق PR:

```text
@Mantis telegram desktop proof
```

يقرأ وكيل Mantis الـ PR، ويقرر أي سلوك مرئي في Telegram يثبت
التغيير، ويشغّل مسار إثبات Crabbox Telegram Desktop للمستخدم الحقيقي على مرجعي
baseline وcandidate، ويكرر حتى تصبح ملفات GIF الأصلية مفيدة، ويكتب بيانًا مزدوجًا
لـ `motionPreview`، وينشر جدول GIF نفسه ذي العمودين عبر
Mantis GitHub App عند ضبط `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - يستأجر أو يعيد استخدام سطح مكتب Crabbox Linux، ويثبّت Telegram Desktop الأصلي، ويهيئ OpenClaw باستخدام رمز بوت Telegram SUT مستأجر، ويبدأ الـ gateway، ويسجل أدلة لقطات الشاشة/MP4 من سطح مكتب VNC المرئي.
  - يستخدم افتراضيًا `--credential-source convex` بحيث تحتاج workflows إلى سر وسيط Convex فقط. استخدم `--credential-source env` مع متغيرات `OPENCLAW_QA_TELEGRAM_*` نفسها كما في `pnpm openclaw qa telegram`.
  - ما زال Telegram Desktop يحتاج إلى تسجيل دخول/ملف تعريف مستخدم. يهيئ رمز البوت OpenClaw فقط. استخدم `--telegram-profile-archive-env <name>` لأرشيف ملف تعريف `.tgz` بترميز base64، أو استخدم `--keep-lease` وسجّل الدخول يدويًا عبر VNC مرة واحدة.
  - يكتب `mantis-telegram-desktop-builder-report.md` و`mantis-telegram-desktop-builder-summary.json` و`telegram-desktop-builder.png` و`telegram-desktop-builder.mp4` ضمن دليل المخرجات.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ توجد مصفوفة التغطية الخاصة بكل مسار في [نظرة عامة على QA → تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). إن `qa-channel` هي الحزمة الاصطناعية الواسعة وليست جزءًا من تلك المصفوفة.

### بيانات اعتماد Telegram المشتركة عبر Convex (v1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
QA النقل الحي، يحصل مختبر QA على استئجار حصري من مجموعة مدعومة بـ Convex، ويرسل heartbeats لذلك
الاستئجار أثناء تشغيل المسار، ويحرر الاستئجار عند الإيقاف. يسبق اسم القسم
دعم Discord وSlack وWhatsApp؛ عقد الاستئجار مشترك عبر الأنواع.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات env المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (مثل `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - القيمة الافتراضية من env: `OPENCLAW_QA_CREDENTIAL_ROLE` (تكون افتراضيًا `ci` في CI، و`maintainer` بخلاف ذلك)

متغيرات env الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL لـ Convex عبر loopback `http://` للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البادئة `https://` في التشغيل العادي.

تتطلب أوامر مسؤول المشرف (إضافة/إزالة/سرد المجموعة)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل عمليات التشغيل الحية لفحص عنوان URL لموقع Convex، وأسرار الوسيط،
وبادئة endpoint، ومهلة HTTP، وإمكانية وصول admin/list بدون طباعة
قيم الأسرار. استخدم `--json` للحصول على مخرجات قابلة للقراءة آليًا في السكربتات وأدوات CI.

عقد endpoint الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - النفاد/قابل لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - النجاح: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - النجاح: `{ status: "ok" }` (أو `2xx` فارغ)
- `POST /release`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - النجاح: `{ status: "ok" }` (أو `2xx` فارغ)
- `POST /admin/add` (سر المشرف فقط)
  - الطلب: `{ kind, actorId, payload, note?, status? }`
  - النجاح: `{ status: "ok", credential }`
- `POST /admin/remove` (سر المشرف فقط)
  - الطلب: `{ credentialId, actorId }`
  - النجاح: `{ status: "ok", changed, credential }`
  - حارس الاستئجار النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل payload لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة معرف دردشة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` ويرفض payloads المشوهة.

شكل payload لنوع مستخدم Telegram الحقيقي:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- يجب أن تكون `groupId` و`testerUserId` و`telegramApiId` سلاسل رقمية.
- يجب أن تكون `tdlibArchiveSha256` و`desktopTdataArchiveSha256` سلاسل SHA-256 سداسية.
- يمثل `kind: "telegram-user"` حساب Telegram مؤقتًا واحدًا. تعامل مع الاستئجار على أنه يشمل الحساب كله: يستعيد مشغل TDLib CLI والشاهد المرئي في Telegram Desktop من payload نفسها، ويجب أن تحتفظ مهمة واحدة فقط بالاستئجار في كل مرة.

استعادة استئجار مستخدم Telegram الحقيقي:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

استخدم ملف تعريف Desktop المستعاد مع `Telegram -workdir "$tmp/desktop"` عند الحاجة إلى تسجيل مرئي. في بيئات المشغل المحلية، يقرأ `scripts/e2e/telegram-user-credential.ts` الملف `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` افتراضيًا إذا كانت متغيرات env للعملية غائبة.

جلسة Crabbox مدفوعة بوكيل:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

يستأجر `start` بيانات اعتماد `telegram-user`، ويستعيد الحساب نفسه في
TDLib وTelegram Desktop على سطح مكتب Crabbox Linux، ويبدأ gateway SUT وهميًا محليًا
من checkout الحالي، ويفتح دردشة Telegram المرئية، ويبدأ
تسجيل سطح المكتب، ويكتب `session.json` خاصًا. أثناء بقاء الجلسة
حية، يمكن للوكيل متابعة الاختبار حتى يرضى:

- يرسل `send --session <file> --text <message>` عبر مستخدم TDLib الحقيقي وينتظر رد SUT.
- يشغّل `run --session <file> -- <remote command>` أمرًا عشوائيًا على Crabbox ويحفظ مخرجاته، مثل `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- يلتقط `screenshot --session <file>` سطح المكتب المرئي الحالي.
- يطبع `status --session <file>` أمر الاستئجار وWebVNC.
- يوقف `finish --session <file>` المسجل، ويلتقط screenshot/video/motion-trim artifacts، ويحرر بيانات اعتماد Convex، ويوقف عمليات SUT المحلية، ويوقف استئجار Crabbox ما لم يُمرر `--keep-box`.
- ينشر `publish --session <file> --pr <number>` تعليق PR يحتوي على GIF فقط افتراضيًا. مرر `--full-artifacts` فقط عندما تكون السجلات أو JSON artifacts مطلوبة عمدًا.

لإعادة الإنتاج المرئي الحتمية، مرر `--mock-response-file <path>` إلى `start`
أو إلى اختصار الأمر الواحد `probe`. يستخدم المشغل افتراضيًا فئة Crabbox قياسية،
وتسجيلًا بمعدل 24fps، ومعاينات GIF للحركة بمعدل 24fps، وعرض GIF يبلغ 1920px.
لا تتجاوز ذلك باستخدام `--class` و`--record-fps` و`--preview-fps` و
`--preview-width` إلا عندما يحتاج الإثبات إلى إعدادات التقاط مختلفة.

إثبات Crabbox بأمر واحد:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

أمر `probe` الافتراضي هو اختصار لدورة start/send/finish واحدة. استخدمه
لاختبار smoke سريع لـ `/status`. استخدم أوامر الجلسة لمراجعة PR،
أو عمل إعادة إنتاج الأخطاء، أو أي حالة يحتاج فيها الوكيل إلى دقائق من
التجريب العشوائي قبل تقرير اكتمال الإثبات. استخدم `--id <cbx_...>` لإعادة
استخدام استئجار سطح مكتب دافئ، و`--keep-box` لإبقاء VNC مفتوحًا بعد finish،
و`--desktop-chat-title <name>` لاختيار الدردشة المرئية، و`--tdlib-url <tgz>`
عند استخدام أرشيف Linux `libtdjson.so` مُعد مسبقًا بدلًا من بناء TDLib على
جهاز جديد. يتحقق المشغل من `--tdlib-url` باستخدام `--tdlib-sha256 <hex>` أو،
افتراضيًا، ملف شقيق `<url>.sha256`.

Payloads متعددة القنوات مُتحقق منها بواسطة الوسيط:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

يمكن لمسارات Slack أيضًا الاستئجار من المجموعة، لكن التحقق من payload لـ Slack
يقع حاليًا في مشغل Slack QA بدلًا من الوسيط. استخدم
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
لصفوف Slack.

### إضافة قناة إلى QA

توجد أسماء البنية ومساعدي السيناريو لمحولات القنوات الجديدة في [نظرة عامة على QA → إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: تنفيذ مشغل النقل على خط `qa-lab` المضيف المشترك، والتصريح عن `qaRunners` في بيان Plugin، والتركيب كـ `openclaw qa <runner>`، وتأليف السيناريوهات تحت `qa/scenarios/`.

## حزم الاختبار (ما الذي يُشغّل وأين)

فكر في الحزم باعتبارها "واقعية متزايدة" (ومعها تذبذب/تكلفة متزايدة):

### الوحدة / التكامل (الافتراضي)

- الأمر: `pnpm test`
- التهيئة: تستخدم عمليات التشغيل غير المستهدفة مجموعة الشظايا `vitest.full-*.config.ts` وقد توسع شظايا المشاريع المتعددة إلى تهيئات لكل مشروع للجدولة المتوازية
- الملفات: مخزونات core/unit تحت `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`؛ تعمل اختبارات وحدة UI في شظية `unit-ui` المخصصة
- النطاق:
  - اختبارات وحدة صرفة
  - اختبارات تكامل داخل العملية (مصادقة gateway، والتوجيه، والأدوات، والتحليل، والتهيئة)
  - انحدارات حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
  - يجب أن تثبت اختبارات resolver وpublic-surface loader سلوك الرجوع الواسع لـ `api.js` و
    `runtime-api.js` باستخدام fixtures لـ plugin صغيرة مولدة، وليس
    واجهات API لمصدر plugins المضمنة الحقيقية. تنتمي تحميلات API للـ plugin الحقيقي إلى
    حزم العقد/التكامل المملوكة للـ plugin.

سياسة التبعيات الأصلية:

- تتجاوز تثبيتات الاختبار الافتراضية بناءات Discord opus الأصلية الاختيارية. يستخدم تلقي الصوت في Discord مفكك الترميز `opusscript` الخالص بلغة JS، ويبقى `@discordjs/opus` معطلا في `allowBuilds` حتى لا تجمع الاختبارات المحلية ومسارات Testbox الإضافة الأصلية.
- استخدم مسار أداء صوت Discord مخصصا أو مسارا حيا إذا كنت تحتاج عمدا إلى مقارنة بناء opus أصلي. لا تضبط `@discordjs/opus` على `true` في `allowBuilds` الافتراضي؛ فهذا يجعل حلقات التثبيت/الاختبار غير ذات الصلة تجمع شيفرة أصلية.

<AccordionGroup>
  <Accordion title="المشاريع والتجزئات والمسارات محددة النطاق">

    - يشغل `pnpm test` غير المستهدف اثني عشر تكوين تجزئة أصغر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) بدلا من عملية مشروع جذر أصلية ضخمة واحدة. يقلل هذا ذروة RSS على الأجهزة المحملة، ويتجنب أن تستنزف أعمال الرد التلقائي/الإضافات مجموعات اختبار غير ذات صلة.
    - لا يزال `pnpm test --watch` يستخدم مخطط مشروع الجذر الأصلي `vitest.config.ts`، لأن حلقة مراقبة متعددة التجزئات ليست عملية.
    - يوجه `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر المسارات محددة النطاق أولا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع كلفة بدء مشروع الجذر الكامل.
    - يوسع `pnpm test:changed` مسارات git المتغيرة إلى مسارات رخيصة محددة النطاق افتراضيا: تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، والتابعات المحلية في مخطط الاستيراد. لا تؤدي تعديلات التكوين/الإعداد/الحزمة إلى تشغيل واسع للاختبارات إلا إذا استخدمت صراحة `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هو بوابة الفحص المحلية الذكية العادية للعمل الضيق. يصنف الفرق إلى النواة، واختبارات النواة، والإضافات، واختبارات الإضافات، والتطبيقات، والوثائق، وبيانات الإصدارات الوصفية، وأدوات Docker الحية، والأدوات، ثم يشغل أوامر فحص الأنواع والlint والحراسة المطابقة. لا يشغل اختبارات Vitest؛ استدع `pnpm test:changed` أو `pnpm test <target>` صريحا لإثبات الاختبار. تشغل زيادات الإصدار الخاصة ببيانات الإصدار الوصفية فقط فحوص إصدار/تكوين/اعتماد جذرية مستهدفة، مع حارس يرفض تغييرات الحزمة خارج حقل الإصدار ذي المستوى الأعلى.
    - تشغل تعديلات عدة Docker ACP الحية فحوصا مركزة: صياغة shell لسكربتات مصادقة Docker الحية وتشغيلا تجريبيا جافا لمجدول Docker الحي. لا تدرج تغييرات `package.json` إلا عندما يكون الفرق محدودا بـ `scripts["test:docker:live-*"]`؛ أما تعديلات الاعتمادات والتصدير والإصدار وسطح الحزمة الأخرى فتظل تستخدم الحراس الأوسع.
    - توجه اختبارات الوحدة الخفيفة الاستيراد من الوكلاء والأوامر وplugins ومساعدات الرد التلقائي و`plugin-sdk` ومناطق الأدوات الخالصة المشابهة عبر مسار `unit-fast`، الذي يتجاوز `test/setup-openclaw-runtime.ts`؛ وتبقى الملفات ذات الحالة أو الثقيلة في وقت التشغيل على المسارات القائمة.
    - ترتبط أيضا ملفات مصدر مساعد محددة من `plugin-sdk` و`commands` بتشغيلات وضع التغييرات إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعد إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
    - لدى `auto-reply` حاويات مخصصة لمساعدي النواة ذوي المستوى الأعلى، واختبارات التكامل `reply.*` ذات المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. تقسم CI أيضا شجرة الرد الفرعية إلى تجزئات مشغل الوكيل، والإرسال، والأوامر/توجيه الحالة، حتى لا تمتلك حاوية واحدة ثقيلة الاستيراد ذيل Node الكامل.
    - تتجاوز CI العادية لطلبات PR/الفرع الرئيسي عمدا مسح دفعة الإضافات وتجزئة `agentic-plugins` الخاصة بالإصدار فقط. يرسل تحقق الإصدار الكامل سير العمل الابن المنفصل `Plugin Prerelease` لتلك المجموعات الثقيلة بـ plugin/extension على مرشحي الإصدار.

  </Accordion>

  <Accordion title="تغطية المشغل المضمن">

    - عندما تغير مدخلات اكتشاف أداة الرسائل أو سياق وقت تشغيل
      Compaction، أبق كلا مستويي التغطية.
    - أضف اختبارات انحدار مساعدة مركزة لحدود التوجيه والتطبيع
      الخالصة.
    - أبق مجموعات تكامل المشغل المضمن سليمة:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه المجموعات من أن المعرفات محددة النطاق وسلوك Compaction ما زالا يتدفقان
      عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ ولا تعد الاختبارات الخاصة بالمساعدين فقط
      بديلا كافيا لتلك مسارات التكامل.

  </Accordion>

  <Accordion title="افتراضيات مجمع Vitest والعزل">

    - يضبط تكوين Vitest الأساسي الافتراضي على `threads`.
    - يثبت تكوين Vitest المشترك `isolate: false` ويستخدم المشغل
      غير المعزول عبر مشاريع الجذر، وتكوينات e2e، والتكوينات الحية.
    - يحتفظ مسار واجهة المستخدم الجذري بإعداد `jsdom` والمحسن الخاصين به، لكنه يعمل على
      المشغل المشترك غير المعزول أيضا.
    - ترث كل تجزئة `pnpm test` افتراضيات `threads` + `isolate: false`
      نفسها من تكوين Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node الابنة الخاصة بـ Vitest
      افتراضيا لتقليل اضطراب تجميع V8 أثناء التشغيلات المحلية الكبيرة.
      اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8
      القياسي.

  </Accordion>

  <Accordion title="التكرار المحلي السريع">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يثيرها الفرق.
    - خطاف ما قبل الالتزام مخصص للتنسيق فقط. يعيد إدراج الملفات المنسقة في المرحلة
      ولا يشغل lint أو فحص الأنواع أو الاختبارات.
    - شغل `pnpm check:changed` صراحة قبل التسليم أو الدفع عندما
      تحتاج إلى بوابة الفحص المحلية الذكية.
    - يوجه `pnpm test:changed` عبر مسارات رخيصة محددة النطاق افتراضيا. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر الوكيل
      أن تعديل عدة أو تكوين أو حزمة أو عقد يحتاج فعلا إلى تغطية
      Vitest أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه
      نفسه، لكن مع حد أعلى للعاملين.
    - التحجيم التلقائي للعاملين محليا محافظ عمدا ويتراجع
      عندما يكون متوسط حمل المضيف عاليا بالفعل، لذلك تسبب تشغيلات
      Vitest المتزامنة المتعددة ضررا أقل افتراضيا.
    - يضع تكوين Vitest الأساسي علامة على المشاريع/ملفات التكوين كـ
      `forceRerunTriggers` حتى تبقى إعادة التشغيل في وضع التغييرات صحيحة عندما تتغير
      وصلات الاختبار.
    - يحافظ التكوين على تمكين `OPENCLAW_VITEST_FS_MODULE_CACHE` على المضيفين
      المدعومين؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت
      موقع ذاكرة تخزين مؤقت صريحا واحدا للتنميط المباشر.

  </Accordion>

  <Accordion title="تنقيح الأداء">

    - يمكن `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى
      مخرجات تفصيل الاستيراد.
    - يحدد `pnpm test:perf:imports:changed` عرض التنميط نفسه إلى
      الملفات المتغيرة منذ `origin/main`.
    - تكتب بيانات توقيت التجزئات إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم تشغيلات التكوين الكامل مسار التكوين كمفتاح؛ وتضيف تجزئات CI
      بنمط التضمين اسم التجزئة حتى يمكن تتبع التجزئات المرشحة
      على حدة.
    - عندما يظل اختبار ساخن واحد ينفق معظم وقته في استيرادات بدء التشغيل،
      أبق الاعتمادات الثقيلة خلف حد `*.runtime.ts` محلي ضيق و
      حاك ذلك الحد مباشرة بدلا من الاستيراد العميق لمساعدي وقت التشغيل فقط
      لتمريرهم عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` تشغيل
      `test:changed` الموجه بالمسار الأصلي لمشروع الجذر لذلك الفرق المثبت
      ويطبع زمن الجدار بالإضافة إلى أقصى RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة المتسخة الحالية
      عبر توجيه قائمة الملفات المتغيرة من خلال
      `scripts/test-projects.mjs` وتكوين Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لتكاليف
      بدء Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغل لمجموعة
      الوحدة مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (gateway)

- الأمر: `pnpm test:stability:gateway`
- التكوين: `vitest.gateway.config.ts`، مجبر على عامل واحد
- النطاق:
  - يبدأ Gateway loopback حقيقيا مع تمكين التشخيصات افتراضيا
  - يدفع رسائل Gateway اصطناعية، وذاكرة، واضطراب حمولات كبيرة عبر مسار حدث التشخيص
  - يستعلم `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدي استمرار حزمة الاستقرار التشخيصية
  - يؤكد أن المسجل يبقى محدودا، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق الطوابير لكل جلسة تستنزف عائدة إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج إلى مفاتيح
  - مسار ضيق لمتابعة انحدار الاستقرار، وليس بديلا لمجموعة Gateway الكاملة

### E2E (فحص سريع لـ gateway)

- الأمر: `pnpm test:e2e`
- التكوين: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات E2E لـ bundled-plugin تحت `extensions/`
- افتراضيات وقت التشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، مطابقا لبقية المستودع.
  - يستخدم عاملين تكيفيين (CI: حتى 2، محليا: 1 افتراضيا).
  - يعمل في الوضع الصامت افتراضيا لتقليل كلفة I/O الطرفية.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العاملين (محدود عند 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تمكين مخرجات الطرفية المطولة.
- النطاق:
  - سلوك Gateway من طرف إلى طرف متعدد المثيلات
  - أسطح WebSocket/HTTP، واقتران node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في خط المعالجة)
  - لا يتطلب مفاتيح حقيقية
  - أجزاء متحركة أكثر من اختبارات الوحدة (قد يكون أبطأ)

### E2E: فحص سريع لخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ Gateway OpenShell معزولا على المضيف عبر Docker
  - ينشئ صندوقا رمليا من Dockerfile محلي مؤقت
  - يمرن خلفية OpenShell في OpenClaw عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات القياسي عن بعد عبر جسر fs للصندوق الرملي
- التوقعات:
  - اختياري فقط؛ ليس جزءا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليا باسم `openshell` بالإضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمر Gateway الاختبار والصندوق الرملي
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدويا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو سكربت تغليف

### حي (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`، و`test/**/*.live.test.ts`، واختبارات التشغيل الحية للـ Plugins المضمّنة ضمن `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزوّد/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - اكتشاف تغييرات تنسيق المزوّد، وخصوصيات استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدّل
- التوقعات:
  - ليست مستقرة على CI حسب التصميم (شبكات حقيقية، سياسات مزوّدين حقيقية، حصص، انقطاعات)
  - تكلّف مالًا / تستخدم حدود المعدّل
  - يُفضّل تشغيل مجموعات فرعية محددة بدلًا من "كل شيء"
- تستورد عمليات التشغيل الحية `~/.profile` للحصول على مفاتيح API الناقصة.
- افتراضيًا، تظل عمليات التشغيل الحية تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى مجلد منزل مؤقت للاختبار حتى لا تتمكن تركيبات اختبارات الوحدة من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية مجلد المنزل الحقيقي لديك.
- أصبح `pnpm test:live` الآن يستخدم افتراضيًا وضعًا أكثر هدوءًا: فهو يُبقي مخرجات التقدم `[live] ...`، لكنه يكبت إشعار `~/.profile` الإضافي ويكتم سجلات تمهيد Gateway/ثرثرة Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بكل مزوّد): اضبط `*_API_KEYS` بتنسيق الفواصل/الفواصل المنقوطة أو `*_API_KEY_1`، و`*_API_KEY_2` (مثل `OPENAI_API_KEYS`، و`ANTHROPIC_API_KEYS`، و`GEMINI_API_KEYS`) أو تجاوزًا لكل تشغيل حي عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدّل.
- مخرجات التقدم/Heartbeat:
  - تُصدر مجموعات الاختبارات الحية الآن أسطر تقدم إلى stderr حتى تكون استدعاءات المزوّد الطويلة مرئية كنشطة حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة تحكم Vitest بحيث تتدفق أسطر تقدم المزوّد/Gateway فورًا أثناء عمليات التشغيل الحية.
  - اضبط Heartbeat للنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat لـ Gateway/المسبار باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة اختبارات يجب أن أشغّل؟

استخدم جدول القرار هذا:

- عند تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- عند لمس شبكات Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- عند تصحيح "البوت الخاص بي متوقف" / إخفاقات خاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` محدد النطاق

## الاختبارات الحية (التي تلمس الشبكة)

لمصفوفة النماذج الحية، واختبارات دخان واجهة CLI الخلفية، واختبارات دخان ACP، وحاضنة
خادم تطبيق Codex، وجميع اختبارات مزوّدي الوسائط الحية (Deepgram، وBytePlus، وComfyUI، والصور،
والموسيقى، والفيديو، وحاضنة الوسائط) - إضافة إلى التعامل مع بيانات الاعتماد لعمليات التشغيل الحية - راجع
[اختبار مجموعات الاختبارات الحية](/ar/help/testing-live). لقائمة التحقق المخصصة للتحديث
والتحقق من Plugins، راجع
[اختبار التحديثات والـ Plugins](/ar/help/testing-updates-plugins).

## مشغّلات Docker (اختبارات اختيارية لـ "يعمل في Linux")

تنقسم مشغّلات Docker هذه إلى فئتين:

- مشغّلات النماذج الحية: يشغّل `test:docker:live-models` و`test:docker:live-gateway` ملف التشغيل الحي المطابق لمفتاح الملف الشخصي فقط داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب مجلد الإعداد المحلي ومساحة العمل لديك (واستيراد `~/.profile` إذا كان مركّبًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغّلات Docker الحية افتراضيًا حدّ دخان أصغر حتى يظل الفحص الكامل عبر Docker عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة هذه عندما
  تريد صراحةً الفحص الشامل الأكبر.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كحزمة npm tarball عبر `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة العارية هي فقط مشغّل Node/Git لمسارات التثبيت/التحديث/اعتماديات Plugin؛ تركّب هذه المسارات ملف tarball المبني مسبقًا. تثبّت الصورة الوظيفية ملف tarball نفسه في `/app` لمسارات وظائف التطبيق المبني. توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويوجد منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في خانات العمليات، بينما تمنع حدود الموارد مسارات التشغيل الحي الثقيلة، وتثبيت npm، والمسارات متعددة الخدمات من البدء كلها دفعة واحدة. إذا كان مسار واحد أثقل من الحدود النشطة، فيمكن للمجدول أن يبدأه رغم ذلك عندما يكون الحوض فارغًا، ثم يبقيه يعمل وحده إلى أن تتوفر السعة مرة أخرى. القيم الافتراضية هي 10 خانات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما تتوفر لدى مضيف Docker سعة إضافية. ينفّذ المشغّل فحصًا تمهيديًا لـ Docker افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في عمليات التشغيل اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون دون بناء Docker أو تشغيله، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة، واحتياجات الحزمة/الصورة، وبيانات الاعتماد.
- `Package Acceptance` هي بوابة الحزمة الأصلية في GitHub لسؤال "هل يعمل ملف tarball القابل للتثبيت هذا كمنتج؟" فهي تحدد حزمة مرشحة واحدة من `source=npm`، أو `source=ref`، أو `source=url`، أو `source=artifact`، وترفعها باسم `package-under-test`، ثم تشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد ملف tarball نفسه بدلًا من إعادة تحزيم المرجع المحدد. تُرتّب الملفات الشخصية حسب الاتساع: `smoke`، و`package`، و`product`، و`full`. راجع [اختبار التحديثات والـ Plugins](/ar/help/testing-updates-plugins) للاطلاع على عقد الحزمة/التحديث/Plugin، ومصفوفة البقاء بعد الترقية المنشورة، وافتراضيات الإصدار، وفرز الإخفاقات.
- تشغّل اختبارات البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يتتبع الحارس الرسم البياني المبني الثابت من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا استورد بدء التشغيل قبل الإرسال اعتماديات حزم مثل Commander، أو واجهة المطالبة، أو undici، أو التسجيل قبل إرسال الأمر؛ كما يبقي جزء تشغيل Gateway المضمّن ضمن الميزانية ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة. يغطي اختبار دخان CLI المحزّم أيضًا مساعدة الجذر، ومساعدة onboarding، ومساعدة doctor، والحالة، ومخطط الإعداد، وأمر قائمة النماذج.
- توافق `Package Acceptance` القديم محدود عند `2026.4.25` (بما في ذلك `2026.4.25-beta.*`). حتى ذلك الحد، تتسامح الحاضنة فقط مع فجوات بيانات التعريف الخاصة بالحزم المشحونة: إدخالات مخزون QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات التصحيح في تركيبة git المشتقة من ملف tarball، وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة، وغياب استمرار سجل تثبيت marketplace، وترحيل بيانات تعريف الإعداد أثناء `plugins update`. بالنسبة للحزم بعد `2026.4.25`، تُعد هذه المسارات إخفاقات صارمة.
- مشغّلات دخان الحاويات: `test:docker:openwebui`، و`test:docker:onboard`، و`test:docker:npm-onboard-channel-agent`، و`test:docker:skill-install`، و`test:docker:update-channel-switch`، و`test:docker:upgrade-survivor`، و`test:docker:published-upgrade-survivor`، و`test:docker:session-runtime-context`، و`test:docker:agents-delete-shared-workspace`، و`test:docker:gateway-network`، و`test:docker:browser-cdp-snapshot`، و`test:docker:mcp-channels`، و`test:docker:pi-bundle-mcp-tools`، و`test:docker:cron-mcp-cleanup`، و`test:docker:plugins`، و`test:docker:plugin-update`، و`test:docker:plugin-lifecycle-matrix`، و`test:docker:config-reload` تشغّل حاوية حقيقية واحدة أو أكثر وتتحقق من مسارات التكامل الأعلى مستوى.

تركّب مشغّلات Docker للنماذج الحية أيضًا مجلدات مصادقة CLI المطلوبة فقط (أو جميع المجلدات المدعومة عندما لا يكون التشغيل محدد النطاق)، ثم تنسخها إلى منزل الحاوية قبل التشغيل حتى تتمكن OAuth الخاصة بواجهات CLI الخارجية من تحديث الرموز دون تعديل مخزن مصادقة المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكريبت: `scripts/test-live-models-docker.sh`)
- فحص دخان ربط ACP: `pnpm test:docker:live-acp-bind` (السكريبت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيًا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- فحص دخان الواجهة الخلفية لـ CLI: `pnpm test:docker:live-cli-backend` (السكريبت: `scripts/test-live-cli-backend-docker.sh`)
- فحص دخان حزمة اختبار خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (السكريبت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكريبت: `scripts/test-live-gateway-models-docker.sh`)
- فحص دخان قابلية المراقبة: `pnpm qa:otel:smoke` هو مسار خاص لفحص مصدر QA. وهو عمدًا ليس جزءًا من مسارات إصدار Docker الخاصة بالحزمة لأن حزمة npm tarball لا تتضمن QA Lab.
- فحص دخان Open WebUI المباشر: `pnpm test:docker:openwebui` (السكريبت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، إنشاء هيكل كامل): `pnpm test:docker:onboard` (السكريبت: `scripts/e2e/onboard-docker.sh`)
- فحص دخان الإعداد الأولي/القناة/الوكيل لحزمة npm tarball: `pnpm test:docker:npm-onboard-channel-agent` يثبّت حزمة OpenClaw tarball المجمعة عالميًا في Docker، ويضبط OpenAI عبر إعداد أولي يستخدم مرجع بيئة بالإضافة إلى Telegram افتراضيًا، ويشغّل doctor، ويشغّل دورة وكيل OpenAI وهمية واحدة. أعد استخدام حزمة tarball مبنية مسبقًا باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة بناء المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` أو `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- فحص دخان تثبيت Skills: `pnpm test:docker:skill-install` يثبّت حزمة OpenClaw tarball المجمعة عالميًا في Docker، ويعطّل تثبيت الأرشيفات المرفوعة في الإعدادات، ويستخرج slug الخاص بـ skill الحالية المباشرة في ClawHub من البحث، ويثبتها باستخدام `openclaw skills install`، ويتحقق من الـ skill المثبتة بالإضافة إلى بيانات أصل/قفل `.clawhub` الوصفية.
- فحص دخان تبديل قناة التحديث: `pnpm test:docker:update-channel-switch` يثبّت حزمة OpenClaw tarball المجمعة عالميًا في Docker، وينتقل من حزمة `stable` إلى git `dev`، ويتحقق من القناة المحفوظة وعمل Plugin بعد التحديث، ثم يعود إلى حزمة `stable` ويتحقق من حالة التحديث.
- فحص دخان النجاة من الترقية: `pnpm test:docker:upgrade-survivor` يثبّت حزمة OpenClaw tarball المجمعة فوق تجهيز مستخدم قديم غير نظيف يحتوي على وكلاء وإعدادات قناة وقوائم سماح Plugin وحالة تبعيات Plugin قديمة وملفات مساحة عمل/جلسة موجودة. يشغّل تحديث الحزمة بالإضافة إلى doctor غير تفاعلي من دون مفاتيح مزود أو قناة مباشرة، ثم يبدأ Gateway loopback ويتحقق من حفظ الإعدادات/الحالة بالإضافة إلى ميزانيات بدء التشغيل/الحالة.
- فحص دخان النجاة من الترقية المنشورة: `pnpm test:docker:published-upgrade-survivor` يثبّت `openclaw@latest` افتراضيًا، ويزرع ملفات واقعية لمستخدم موجود، ويضبط ذلك الأساس بوصفة أوامر مضمّنة، ويتحقق من الإعداد الناتج، ويحدّث ذلك التثبيت المنشور إلى حزمة tarball المرشحة، ويشغّل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway loopback ويتحقق من النوايا المضبوطة، وحفظ الحالة، وبدء التشغيل، و`/healthz`، و`/readyz`، وميزانيات حالة RPC. تجاوز أساسًا واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، واطلب من المجدول التجميعي توسيع الأسس المحلية الدقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`، ووسّع تجهيزات على شكل مشكلات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues`؛ تتضمن مجموعة reported-issues حالة `configured-plugin-installs` لإصلاح تثبيت Plugin خارجي لـ OpenClaw تلقائيًا. يعرّض Package Acceptance هذه كـ `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`، ويحل رموز الأساس الوصفية مثل `last-stable-4` أو `all-since-2026.4.23`، ويوسّع Full Release Validation بوابة حزمة release-soak إلى `last-stable-4 2026.4.23 2026.5.2 2026.4.15` بالإضافة إلى `reported-issues`.
- فحص دخان سياق تشغيل الجلسة: `pnpm test:docker:session-runtime-context` يتحقق من استمرار نص سياق التشغيل المخفي بالإضافة إلى إصلاح doctor لفروع إعادة كتابة المطالبة المكررة المتأثرة.
- فحص دخان التثبيت العالمي عبر Bun: `bash scripts/e2e/bun-global-install-smoke.sh` يجمّع الشجرة الحالية، ويثبتها باستخدام `bun install -g` في home معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد مزودي الصور المضمّنين بدلًا من التعليق. أعد استخدام حزمة tarball مبنية مسبقًا باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ بناء المضيف باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- فحص دخان Docker للمثبّت: `bash scripts/test-install-sh-docker.sh` يشارك ذاكرة تخزين npm مؤقتة واحدة بين حاويات الجذر والتحديث وdirect-npm. يستخدم فحص دخان التحديث افتراضيًا npm `latest` كأساس مستقر قبل الترقية إلى حزمة tarball المرشحة. تجاوزه محليًا باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، أو باستخدام إدخال `update_baseline_version` في سير عمل Install Smoke على GitHub. تحافظ فحوصات المثبّت لغير الجذر على ذاكرة تخزين npm مؤقتة معزولة حتى لا تخفي إدخالات التخزين المؤقت المملوكة للجذر سلوك التثبيت المحلي للمستخدم. عيّن `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة التخزين المؤقت root/update/direct-npm عبر عمليات الإعادة المحلية.
- يتخطى Install Smoke CI التحديث العالمي direct-npm المكرر باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل السكريبت محليًا من دون هذا المتغير عندما تكون تغطية `npm install -g` المباشرة مطلوبة.
- فحص دخان CLI لحذف وكلاء من مساحة عمل مشتركة: `pnpm test:docker:agents-delete-shared-workspace` (السكريبت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) يبني صورة Dockerfile الجذر افتراضيًا، ويزرع وكيلين مع مساحة عمل واحدة في home حاوية معزول، ويشغّل `agents delete --json`، ويتحقق من JSON صالح بالإضافة إلى سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke باستخدام `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكريبت: `scripts/e2e/gateway-network-docker.sh`)
- فحص دخان لقطة Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (السكريبت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) يبني صورة E2E المصدر بالإضافة إلى طبقة Chromium، ويبدأ Chromium باستخدام CDP الخام، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي روابط URL، والعناصر القابلة للنقر التي تمت ترقيتها بالمؤشر، ومراجع iframe، وبيانات الإطارات الوصفية.
- انحدار الحد الأدنى للتفكير في OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (السكريبت: `scripts/e2e/openai-web-search-minimal-docker.sh`) يشغّل خادم OpenAI وهميًا عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يجبر مخطط المزود على الرفض ويتحقق من ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + فحص دخان إطار إشعار Claude الخام): `pnpm test:docker:mcp-channels` (السكريبت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات Pi bundle MCP (خادم MCP stdio حقيقي + فحص دخان السماح/المنع لملف Pi الشخصي المضمّن): `pnpm test:docker:pi-bundle-mcp-tools` (السكريبت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف Cron/subagent MCP (Gateway حقيقي + إنهاء ابن MCP عبر stdio بعد تشغيلات cron معزولة وsubagent لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكريبت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (فحص دخان التثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git متحركة، وحزمة ClawHub شاملة، وتحديثات السوق، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (السكريبت: `scripts/e2e/plugins-docker.sh`)
  عيّن `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/التشغيل الشامل الافتراضي باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. من دون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم تجهيز ClawHub محليًا محكم العزل.
- فحص دخان تحديث Plugin من دون تغيير: `pnpm test:docker:plugin-update` (السكريبت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- فحص دخان مصفوفة دورة حياة Plugin: `pnpm test:docker:plugin-lifecycle-matrix` يثبّت حزمة OpenClaw tarball المجمعة في حاوية عارية، ويثبّت Plugin من npm، ويبدّل التمكين/التعطيل، ويرقيه ويخفضه عبر سجل npm محلي، ويحذف الشيفرة المثبتة، ثم يتحقق من أن إلغاء التثبيت لا يزال يزيل الحالة القديمة مع تسجيل مقاييس RSS/CPU لكل مرحلة من دورة الحياة.
- فحص دخان بيانات إعادة تحميل الإعدادات الوصفية: `pnpm test:docker:config-reload` (السكريبت: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: يغطي `pnpm test:docker:plugins` فحص دخان التثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git متحركة، وتجهيزات ClawHub، وتحديثات السوق، وتمكين/فحص حزمة Claude. يغطي `pnpm test:docker:plugin-update` سلوك التحديث غير المتغير للـ plugins المثبتة. يغطي `pnpm test:docker:plugin-lifecycle-matrix` تثبيت Plugin من npm مع تتبع الموارد، وتمكينه، وتعطيله، وترقيته، وخفضه، وإلغاء تثبيته عند فقدان الشيفرة.

لبناء الصورة الوظيفية المشتركة مسبقًا وإعادة استخدامها يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بكل مجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` صاحبة الأولوية عند تعيينها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكريبتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات QR وDocker الخاصة بالمثبّت بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلًا من تشغيل التطبيق المبني المشترك.

تشغّل مشغّلات Docker الخاصة بالنماذج الحية أيضًا checkout الحالي عبر bind-mount للقراءة فقط
وتحضّره في workdir مؤقت داخل الحاوية. يحافظ هذا على صورة runtime
صغيرة مع الاستمرار في تشغيل Vitest على مصدرك/إعدادك المحلي الدقيق.
تتخطى خطوة التحضير مخازن التخزين المؤقت المحلية الكبيرة فقط ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` المحلية للتطبيق أو
أدلة مخرجات Gradle حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ
artifacts خاصة بالجهاز.
كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات Gateway الحية
عاملي قنوات Telegram/Discord/إلخ. الحقيقيين داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر
`OPENCLAW_LIVE_GATEWAY_*` أيضًا عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
الحية من مسار Docker ذلك.
`test:docker:openwebui` هو اختبار توافق smoke أعلى مستوى: يبدأ حاوية
OpenClaw Gateway مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبتة الإصدار مقابل ذلك Gateway، ويسجل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وكيل `/api/chat/completions` في Open WebUI.
اضبط `OPENWEBUI_SMOKE_MODE=models` لفحوصات CI في مسار الإصدار التي يجب أن تتوقف
بعد تسجيل الدخول إلى Open WebUI واكتشاف النموذج، دون انتظار اكتمال نموذج حي.
قد تكون أول عملية تشغيل أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب صورة
Open WebUI وقد يحتاج Open WebUI إلى إكمال إعداد التشغيل البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج حي قابلًا للاستخدام، و`OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيًا) هي الطريقة الأساسية لتوفيره في التشغيلات داخل Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عمدًا ولا يحتاج إلى حساب Telegram أو Discord أو iMessage
حقيقي. يبدّئ حاوية Gateway مملوءة مسبقًا، ويبدأ حاوية ثانية تُشغّل `openclaw mcp serve`،
ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءات النصوص، وبيانات تعريف المرفقات،
وسلوك قائمة انتظار الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة +
الأذونات بأسلوب Claude عبر جسر stdio MCP الحقيقي. يفحص تحقق الإشعارات
إطارات stdio MCP الخام مباشرة حتى يتحقق اختبار smoke مما يصدره
الجسر فعليًا، وليس فقط ما يحدث أن يعرضه SDK عميل محدد.
`test:docker:pi-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبني صورة Docker للمستودع، ويبدأ خادم فحص stdio MCP حقيقيًا
داخل الحاوية، ويجسّد ذلك الخادم عبر runtime MCP لحزمة Pi المضمنة،
وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان
بأدوات `bundle-mcp` بينما تقوم `minimal` و`tools.deny: ["bundle-mcp"]` بترشيحها.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبدأ Gateway مملوءًا مسبقًا مع خادم فحص stdio MCP حقيقي، ويشغّل
دورة cron معزولة ودورة ابن لمرة واحدة عبر `/subagents spawn`، ثم يتحقق من
خروج عملية MCP الابنة بعد كل تشغيل.

اختبار smoke يدوي لسلسلة ACP بلغة طبيعية (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- أبقِ هذا السكربت لتدفقات عمل الانحدار/التصحيح. قد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه سلاسل ACP، لذا لا تحذفه.

متغيرات البيئة المفيدة:

- `OPENCLAW_CONFIG_DIR=...` (افتراضيًا: `~/.openclaw`) يُركّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (افتراضيًا: `~/.openclaw/workspace`) يُركّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (افتراضيًا: `~/.profile`) يُركّب إلى `/home/node/.profile` ويُحمّل قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المحمّلة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعداد/workspace مؤقتة ودون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (افتراضيًا: `~/.cache/openclaw/docker-cli-tools`) يُركّب إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - تشغيلات المزوّد المضيّقة تركّب فقط الأدلة/الملفات اللازمة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لترشيح المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لإعادة التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن الملف الشخصي (وليس من env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لاختبار smoke الخاص بـ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز موجه nonce-check المستخدم بواسطة اختبار smoke الخاص بـ Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبت

## فحص سلامة الوثائق

شغّل فحوصات الوثائق بعد تعديلات الوثائق: `pnpm check:docs`.
شغّل تحقق Mintlify الكامل من anchors عندما تحتاج أيضًا إلى فحوصات عناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه انحدارات "مسار حقيقي" دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة agent): `src/gateway/gateway.test.ts` (الحالة: "يشغّل استدعاء أداة OpenAI وهميًا من البداية إلى النهاية عبر حلقة agent في Gateway")
- معالج Gateway (WS `wizard.start`/`wizard.next`، يكتب الإعداد + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "يشغّل المعالج عبر ws ويكتب إعداد رمز المصادقة")

## تقييمات موثوقية agent (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية agent":

- استدعاء أدوات وهمي عبر Gateway الحقيقي + حلقة agent (`src/gateway/gateway.test.ts`).
- تدفقات معالج من البداية إلى النهاية تتحقق من توصيل الجلسة وتأثيرات الإعداد (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودًا لـ Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في الموجه، هل يختار agent المهارة الصحيحة (أو يتجنب غير الملائمة)؟
- **الامتثال:** هل يقرأ agent ملف `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الدورات تؤكد ترتيب الأدوات، وحمل سجل الجلسة، وحدود sandbox.

يجب أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين وهميين لتأكيد استدعاءات الأدوات + ترتيبها، وقراءات ملفات المهارات، وتوصيل الجلسة.
- مجموعة صغيرة من سيناريوهات تركّز على المهارات (استخدام مقابل تجنب، gating، حقن الموجهات).
- تقييمات حية اختيارية (باشتراك صريح ومقيّدة بـ env) فقط بعد توفر المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلين يطابقان
عقد الواجهة الخاص بهما. تمر عبر كل plugins المكتشفة وتُشغّل مجموعة من
تأكيدات الشكل والسلوك. يتخطى مسار وحدات `pnpm test` الافتراضي عمدًا
ملفات smoke وseam المشتركة هذه؛ شغّل أوامر العقود صراحة
عندما تلمس أسطح قناة أو مزوّد مشتركة.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

موجودة في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - شكل Plugin الأساسي (id، name، capabilities)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - التعامل مع الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - التعامل مع معرّف السلسلة
- **directory** - API الدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

موجودة في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّدين

موجودة في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - API كتالوج النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - runtime المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تُشغّل

- بعد تغيير exports أو subpaths الخاصة بـ plugin-sdk
- بعد إضافة أو تعديل قناة أو Plugin مزوّد
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة الانحدارات (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج اكتُشفت في التشغيل الحي:

- أضف انحدارًا آمنًا لـ CI إن أمكن (مزوّد mock/stub، أو التقاط تحويل شكل الطلب الدقيق)
- إذا كانت بطبيعتها حية فقط (حدود المعدل، سياسات المصادقة)، أبقِ الاختبار الحي ضيقًا واختياريًا عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ تحويل/إعادة تشغيل طلب المزوّد → اختبار نماذج مباشر
  - خطأ مسار جلسة/سجل/أدوات Gateway → اختبار smoke حي لـ Gateway أو اختبار Gateway وهمي آمن لـ CI
- حاجز حماية اجتياز SecretRef:
  - يستمد `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا واحدًا مأخوذًا كعينة لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض exec ids ذات مقاطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة ذات `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند معرّفات الأهداف غير المصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذات صلة

- [اختبار الحي](/ar/help/testing-live)
- [اختبار التحديثات وplugins](/ar/help/testing-updates-plugins)
- [CI](/ar/ci)
