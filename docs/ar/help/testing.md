---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النماذج/المزوّدين
    - تصحيح أخطاء سلوك Gateway + الوكيل
summary: 'عدة الاختبار: مجموعات اختبارات الوحدة/e2e/الحية، ومشغّلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-05-05T01:48:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw لديه ثلاث حزم Vitest (الوحدات/التكامل، e2e، الحية) ومجموعة صغيرة
من مشغلات Docker. هذا المستند هو دليل "كيف نختبر":

- ما تغطيه كل حزمة (وما لا تغطيه عمدًا _بشكل مقصود_).
- الأوامر التي ينبغي تشغيلها لسير العمل الشائعة (محليًا، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتحدد النماذج/المزوّدين.
- كيف تضيف اختبارات تراجع لمشكلات النماذج/المزوّدين في العالم الحقيقي.

<Note>
**حزمة QA (qa-lab، qa-channel، مسارات النقل الحية)** موثقة بشكل منفصل:

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) — البنية، سطح الأوامر، تأليف السيناريوهات.
- [Matrix QA](/ar/concepts/qa-matrix) — مرجع لـ `pnpm openclaw qa matrix`.
- [قناة QA](/ar/channels/qa-channel) — Plugin النقل الاصطناعي المستخدم بواسطة السيناريوهات المدعومة بالمستودع.

تغطي هذه الصفحة تشغيل حزم الاختبار العادية ومشغلات Docker/Parallels. يسرد قسم مشغلات QA المخصصة أدناه ([مشغلات QA المخصصة](#qa-specific-runners)) استدعاءات `qa` المحددة ويشير مجددًا إلى المراجع أعلاه.
</Note>

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع للحزمة الكاملة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest المباشرة: `pnpm test:watch`
- الاستهداف المباشر للملفات يوجه الآن مسارات الإضافات/القنوات أيضًا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تكرر العمل على فشل واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA المدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- حزمة E2E: `pnpm test:e2e`

عند تصحيح مزوّدين/نماذج حقيقيين (يتطلب بيانات اعتماد حقيقية):

- الحزمة الحية (النماذج + فحوصات أداة/صورة Gateway): `pnpm test:live`
- استهداف ملف حي واحد بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- تقارير أداء وقت التشغيل: أطلق `OpenClaw Performance` مع
  `live_gpt54=true` لدورة وكيل حقيقية لـ `openai/gpt-5.4` أو
  `deep_profile=true` لآثار Kova الخاصة بالمعالج/الذاكرة/التتبع. تنشر التشغيلات اليومية المجدولة
  آثار مسارات المزوّد الوهمي، والملف التعريفي العميق، وGPT 5.4 إلى
  `openclaw/clawgrit-reports` عندما يكون `CLAWGRIT_REPORTS_TOKEN` مهيأ. يتضمن
  تقرير المزوّد الوهمي أيضًا أرقام إقلاع Gateway على مستوى المصدر، والذاكرة،
  وضغط Plugin، وحلقة الترحيب المتكررة للنموذج الوهمي، وبدء تشغيل CLI.
- مسح النماذج الحي عبر Docker: `pnpm test:docker:live-models`
  - يشغل كل نموذج محدد الآن دورة نصية إضافة إلى فحص صغير بأسلوب قراءة ملف.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغل أيضًا دورة صورة صغيرة.
    عطّل الفحوصات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل أعطال المزوّد.
  - تغطية CI: تستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومية و
    `OpenClaw Release Checks` اليدوية سير العمل الحي/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، والذي يتضمن مهام مصفوفة Docker حية منفصلة للنماذج
    مجزأة حسب المزوّد.
  - لإعادة تشغيل CI مركزة، أطلق `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و `live_models_only: true`.
  - أضف أسرار المزوّدين الجديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    إضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` والمستدعين
    المجدولين/الخاصة بالإصدار.
- فحص دخان المحادثة المرتبطة الأصلية لـ Codex: `pnpm test:docker:live-codex-bind`
  - يشغل مسارًا حيًا في Docker مقابل مسار خادم تطبيق Codex، ويربط رسالة Slack DM اصطناعية
    باستخدام `/codex bind`، ويتمرن على `/codex fast` و
    `/codex permissions`، ثم يتحقق من أن ردًا عاديًا ومرفق صورة
    يمران عبر ربط Plugin الأصلي بدلًا من ACP.
- فحص دخان حاضنة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغل دورات وكيل Gateway عبر حاضنة خادم تطبيق Codex المملوكة لـ Plugin،
    ويتحقق من `/codex status` و `/codex models`، وبشكل افتراضي يمرّن فحوصات الصورة،
    وCron MCP، والوكيل الفرعي، وGuardian. عطّل فحص الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل أعطال أخرى في
    خادم تطبيق Codex. لفحص مركز للوكيل الفرعي، عطّل الفحوصات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد فحص الوكيل الفرعي ما لم يتم ضبط
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- فحص دخان أمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري معزز لسطح أمر إنقاذ قناة الرسائل.
    يتمرن على `/crestodian status`، ويضع تغيير نموذج مستمرًا في الطابور،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعداد.
- فحص دخان مخطط Crestodian عبر Docker: `pnpm test:docker:crestodian-planner`
  - يشغل Crestodian في حاوية بلا إعدادات مع Claude CLI وهمي على `PATH`
    ويتحقق من أن رجوع المخطط التقريبي يتحول إلى كتابة إعدادات نمطية مدققة.
- فحص دخان التشغيل الأول لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من دليل حالة OpenClaw فارغ، ويوجه `openclaw` المجرد إلى
    Crestodian، ويطبق كتابات الإعداد/النموذج/الوكيل/Plugin Discord + SecretRef،
    ويتحقق من الإعدادات، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضًا في QA Lab بواسطة
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- فحص دخان تكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  بشكل معزول مقابل `moonshot/kimi-k2.6`. تحقق من أن JSON يبلغ عن Moonshot/K2.6 وأن
  سجل المساعد يخزن `usage.cost` المعيارية.

<Tip>
عندما تحتاج إلى حالة فاشلة واحدة فقط، فضّل تضييق الاختبارات الحية عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## مشغلات QA المخصصة

تقع هذه الأوامر بجانب حزم الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغل CI ‏QA Lab في مسارات عمل مخصصة. التكافؤ الوكيلي متداخل تحت
`QA-Lab - All Lanes` والتحقق من الإصدار، وليس مسار عمل PR مستقلًا.
ينبغي أن يستخدم التحقق الواسع `Full Release Validation` مع
`rerun_group=qa-parity` أو مجموعة QA الخاصة بفحوصات الإصدار. تُبقي فحوصات الإصدار
المستقرة/الافتراضية النقع الحي/Docker الشامل خلف `run_release_soak=true`؛ ويجبر
ملف التعريف `full` النقع على التشغيل. يعمل `QA-Lab - All Lanes`
ليليًا على `main` ومن الإطلاق اليدوي مع مسار التكافؤ الوهمي، ومسار Matrix الحي،
ومسار Telegram الحي المُدار بواسطة Convex، ومسار Discord الحي المُدار بواسطة Convex
كمهام متوازية. تمرر QA المجدولة وفحوصات الإصدار خيار Matrix
`--profile fast` صراحة، بينما يظل الافتراضي لكل من Matrix CLI ومدخل سير العمل اليدوي
هو `all`؛ يمكن للإطلاق اليدوي تجزئة `all` إلى مهام `transport`،
و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`. يشغل `OpenClaw Release
Checks` التكافؤ إضافة إلى مساري Matrix السريع وTelegram قبل اعتماد الإصدار،
باستخدام `mock-openai/gpt-5.5` لفحوصات نقل الإصدار لكي تبقى
حتمية وتتجنب بدء تشغيل Plugin المزوّد العادي. تعطل Gateways النقل الحية هذه
بحث الذاكرة؛ يبقى سلوك الذاكرة مغطى بواسطة حزم تكافؤ QA.

تستخدم أجزاء الوسائط الحية للإصدار الكامل
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، والذي يحتوي مسبقًا على
`ffmpeg` و`ffprobe`. تستخدم أجزاء نماذج/خلفيات Docker الحية صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
التزام محدد، ثم تسحبها باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلًا من إعادة البناء
داخل كل جزء.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة بالمستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمال Gateway
    معزولين. يكون افتراضي `qa-channel` هو التزامن 4 (محدودًا بعدد
    السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد العمال،
    أو `--concurrency 1` لمسار التنفيذ التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد المخرجات دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم مزوّد محليًا مدعومًا من AIMock لتغطية تجريبية
    للثوابت وبروتوكولات المحاكاة دون استبدال مسار `mock-openai` الواعي
    بالسيناريوهات.
- `pnpm test:plugins:kitchen-sink-live`
  - يشغّل اختبار التحمل الحي لـ OpenAI Kitchen Sink Plugin عبر مختبر QA. فهو
    يثبّت حزمة Kitchen Sink الخارجية، ويتحقق من جرد سطح SDK للـ Plugin،
    ويفحص `/healthz` و`/readyz`، ويسجل أدلة CPU/RSS الخاصة بـ Gateway،
    ويشغّل دورة OpenAI حية، ويتحقق من التشخيصات العدائية.
    يتطلب مصادقة OpenAI حية مثل `OPENAI_API_KEY`. في جلسات Testbox المهيأة،
    يستورد تلقائيًا ملف تعريف المصادقة الحية لـ Testbox عندما يكون مساعد
    `openclaw-testbox-env` موجودًا.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل قياس بدء تشغيل Gateway بالإضافة إلى حزمة صغيرة من سيناريوهات مختبر
    QA المحاكية (`channel-chat-baseline` و`memory-failure-fallback`
    و`gateway-restart-inflight-run`) ويكتب ملخصًا مدمجًا لملاحظات CPU ضمن
    `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم افتراضيًا ملاحظات سخونة CPU المستمرة فقط (`--cpu-core-warn`
    بالإضافة إلى `--hot-wall-warn-ms`)، لذلك تُسجَّل دفعات بدء التشغيل
    القصيرة كمقاييس دون أن تبدو مثل انحدار تثبيت Gateway الذي يستمر لدقائق.
  - يستخدم مخرجات `dist` المبنية؛ شغّل البناء أولًا عندما لا يحتوي checkout
    على خرج تشغيل حديث بالفعل.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل حزمة QA نفسها داخل آلة افتراضية Linux مؤقتة من Multipass.
  - يحافظ على سلوك اختيار السيناريو نفسه مثل `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزوّد/النموذج نفسها مثل `qa suite`.
  - تمرّر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد المعتمدة على البيئة، ومسار إعداد مزوّد QA الحي، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى مجلدات الخرج تحت جذر المستودع حتى يتمكن الضيف من الكتابة
    مرة أخرى عبر مساحة العمل المركبة.
  - يكتب تقرير QA العادي + الملخص بالإضافة إلى سجلات Multipass ضمن
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لعمل QA بنمط المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني أرشيف npm من checkout الحالي، ويثبّته عالميًا في Docker، ويشغّل
    تهيئة مفتاح OpenAI API غير التفاعلية، ويضبط Telegram افتراضيًا، ويتحقق من
    أن تشغيل Plugin المعبأ يحمّل دون إصلاح تبعيات عند بدء التشغيل، ويشغّل
    doctor، ويشغّل دورة وكيل محلية واحدة مقابل نقطة نهاية OpenAI محاكية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ
    نفسه مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل اختبار Docker حتميًا للتطبيق المبني لنصوص سياق التشغيل المضمّن.
    يتحقق من استمرار سياق تشغيل OpenClaw المخفي كرسالة مخصصة غير معروضة بدل
    تسربه إلى دورة المستخدم المرئية، ثم يزرع جلسة JSONL متضررة ومعطلة ويتحقق
    من أن `openclaw doctor --fix` يعيد كتابتها إلى الفرع النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبّت حزمة OpenClaw مرشحة في Docker، ويشغّل تهيئة الحزمة المثبتة، ويضبط
    Telegram عبر CLI المثبت، ثم يعيد استخدام مسار QA الحي لـ Telegram مع تلك
    الحزمة المثبتة بصفتها SUT Gateway.
  - القيمة الافتراضية هي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛ اضبط
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار أرشيف محلي محلول بدل التثبيت من السجل.
  - يستخدم بيانات اعتماد Telegram البيئية نفسها أو مصدر بيانات اعتماد Convex
    نفسه مثل `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، اضبط
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` بالإضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. إذا كان
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI، يختار غلاف
    Docker Convex تلقائيًا.
  - يتحقق الغلاف من بيئة بيانات اعتماد Telegram أو Convex على المضيف قبل عمل
    بناء/تثبيت Docker. اضبط `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    فقط عند تصحيح إعداد ما قبل بيانات الاعتماد عمدًا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` قيمة
    `OPENCLAW_QA_CREDENTIAL_ROLE` المشتركة لهذا المسار فقط.
  - تعرض GitHub Actions هذا المسار أيضًا كمسار عمل يدوي للمشرفين
    `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم مسار العمل بيئة
    `qa-live-shared` وعقود بيانات اعتماد Convex CI.
- تعرض GitHub Actions أيضًا `Package Acceptance` لإثبات المنتج عبر تشغيل جانبي
  ضد حزمة مرشحة واحدة. يقبل مرجعًا موثوقًا، أو مواصفة npm منشورة، أو عنوان URL
  لأرشيف HTTPS مع SHA-256، أو مُخرج أرشيف من تشغيل آخر، ويرفع
  `openclaw-current.tgz` الموحّد باسم `package-under-test`، ثم يشغّل مجدول
  Docker E2E الموجود بملفات تعريف مسارات smoke أو package أو product أو full
  أو custom. اضبط `telegram_mode=mock-openai` أو `live-frontier` لتشغيل مسار عمل
  QA الخاص بـ Telegram ضد مُخرج `package-under-test` نفسه.
  - إثبات أحدث منتج beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات عنوان URL الدقيق للأرشيف digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- يحمّل إثبات المُخرج أرشيفًا من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - يحزم بناء OpenClaw الحالي ويثبّته في Docker، ويبدأ Gateway مع ضبط OpenAI،
    ثم يمكّن القنوات/Plugins المضمّنة عبر تعديلات الإعداد.
  - يتحقق من أن اكتشاف الإعداد يترك Plugins القابلة للتنزيل غير المضبوطة
    غائبة، وأن أول إصلاح doctor مضبوط يثبّت كل Plugin مفقود قابل للتنزيل
    صراحة، وأن إعادة التشغيل الثانية لا تشغّل إصلاح تبعيات مخفيًا.
  - يثبّت أيضًا خط أساس npm أقدم معروفًا، ويمكّن Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن doctor ما بعد التحديث في
    المرشح ينظف بقايا تبعيات Plugin القديمة دون إصلاح postinstall من جانب
    الحاضنة.
- `pnpm test:parallels:npm-update`
  - يشغّل اختبار تحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. تثبّت كل منصة
    محددة أولًا حزمة خط الأساس المطلوبة، ثم تشغّل أمر `openclaw update` المثبت
    في الضيف نفسه وتتحقق من الإصدار المثبت، وحالة التحديث، وجاهزية Gateway،
    ودورة وكيل محلية واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux` أثناء
    التكرار على ضيف واحد. استخدم `--json` لمسار مُخرج الملخص وحالة كل مسار.
  - يستخدم مسار OpenAI `openai/gpt-5.5` افتراضيًا لإثبات دورة الوكيل الحية.
    مرّر `--model <provider/model>` أو اضبط `OPENCLAW_PARALLELS_OPENAI_MODEL`
    عند التحقق عمدًا من نموذج OpenAI آخر.
  - غلّف التشغيلات المحلية الطويلة بمهلة على المضيف حتى لا تستهلك توقفات نقل
    Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسارات متداخلة ضمن `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي متوقف.
  - يمكن أن يقضي تحديث Windows من 10 إلى 15 دقيقة في عمل doctor ما بعد التحديث
    وتحديث الحزم على ضيف بارد؛ ما يزال ذلك سليمًا عندما يتقدم سجل تصحيح npm
    المتداخل.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات smoke الفردية لـ Parallels
    macOS أو Windows أو Linux. فهي تشترك في حالة الآلة الافتراضية ويمكن أن
    تتصادم عند استعادة اللقطة، أو تقديم الحزمة، أو حالة Gateway للضيف.
  - يشغّل إثبات ما بعد التحديث سطح Plugin المضمّن العادي لأن واجهات القدرات
    مثل الكلام، وتوليد الصور، وفهم الوسائط تُحمّل عبر واجهات API للتشغيل
    المضمّن حتى عندما تتحقق دورة الوكيل نفسها من استجابة نصية بسيطة فقط.

- `pnpm openclaw qa aimock`
  - يبدأ خادم مزوّد AIMock المحلي فقط لاختبار smoke مباشر للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي لـ Matrix ضد خادم Tuwunel homeserver مؤقت مدعوم بـ Docker. للـ source-checkout فقط — لا تشحن التثبيتات المعبأة `qa-lab`.
  - CLI الكامل، وكتالوج ملفات التعريف/السيناريوهات، ومتغيرات البيئة، وتخطيط المخرجات: [QA لـ Matrix](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي لـ Telegram ضد مجموعة خاصة حقيقية باستخدام رموز بوت السائق وSUT من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات اعتماد مشتركة مجمّعة. استخدم وضع البيئة افتراضيًا، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في عقود التأجير المجمعة.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد المخرجات دون رمز خروج فاشل.
  - يتطلب بوتين مميزين في المجموعة الخاصة نفسها، مع كشف بوت SUT عن اسم مستخدم Telegram.
  - لملاحظة مستقرة بين البوتات، فعّل وضع الاتصال من بوت إلى بوت في `@BotFather` لكلا البوتين وتأكد من أن بوت السائق يستطيع ملاحظة حركة بوتات المجموعة.
  - يكتب تقرير QA لـ Telegram، وملخصًا، ومُخرج الرسائل المرصودة ضمن `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال السائق إلى رد SUT المرصود.

تشترك مسارات النقل الحي في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ تعيش مصفوفة تغطية كل مسار في [نظرة عامة على QA → تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). يُعد `qa-channel` الحزمة الاصطناعية الواسعة وليس جزءًا من تلك المصفوفة.

### بيانات اعتماد Telegram المشتركة عبر Convex (v1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل مختبر QA على عقد تأجير حصري من مجموعة مدعومة بـ Convex، ويرسل Heartbeat
لذلك التأجير أثناء تشغيل المسار، ويحرر التأجير عند إيقاف التشغيل.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - افتراضي البيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (افتراضيًا `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL الخاصة بـ Convex ذات `http://` عبر loopback للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البادئة `https://` في التشغيل العادي.

تتطلب أوامر المسؤول الخاصة بالمشرفين (pool add/remove/list)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل التشغيل الحي للتحقق من عنوان URL لموقع Convex، وأسرار الوسيط،
وبادئة نقطة النهاية، ومهلة HTTP، وقابلية الوصول إلى admin/list من دون طباعة
قيم الأسرار. استخدم `--json` لإخراج قابل للقراءة آليًا في السكربتات وأدوات CI.

عقد نقطة النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - مستنفد/قابل لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - حارس التأجير النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة رقمية لمعرّف محادثة Telegram.
- يتحقق `admin/add` من هذا الشكل عند `kind: "telegram"` ويرفض الحمولات غير السليمة.

### إضافة قناة إلى QA

توجد أسماء البنية ومساعدات السيناريو لمحوّلات القنوات الجديدة في [نظرة عامة على QA ← إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: نفّذ مشغّل النقل على واجهة مضيف `qa-lab` المشتركة، وأعلن `qaRunners` في بيان Plugin، وثبّته كـ `openclaw qa <runner>`، واكتب السيناريوهات ضمن `qa/scenarios/`.

## مجموعات الاختبار (ما الذي يعمل وأين)

تعامل مع المجموعات على أنها «واقعية متزايدة» (ومعها تزداد الهشاشة/التكلفة):

### الوحدة / التكامل (افتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم عمليات التشغيل غير المحددة مجموعة أجزاء `vitest.full-*.config.ts`، وقد توسّع أجزاء المشاريع المتعددة إلى إعدادات لكل مشروع من أجل الجدولة المتوازية
- الملفات: قوائم جرد اختبارات النواة/الوحدة ضمن `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`؛ تعمل اختبارات وحدة UI في جزء `unit-ui` المخصص
- النطاق:
  - اختبارات وحدة صرفة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، التوجيه، الأدوات، التحليل، الإعداد)
  - اختبارات انحدار حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
  - يجب أن تثبت اختبارات المحلّل ومحمّل السطح العام سلوك الرجوع الواسع لـ `api.js` و
    `runtime-api.js` باستخدام تجهيزات Plugin صغيرة مولّدة، وليس
    واجهات API لمصدر Plugin حقيقي مضمّن. تحميلات API الحقيقية لـ Plugin تنتمي إلى
    مجموعات عقود/تكامل مملوكة لـ Plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - يشغّل `pnpm test` غير المحدد اثني عشر إعداد جزء أصغر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) بدلًا من عملية مشروع جذرية أصلية ضخمة واحدة. يقلل هذا ذروة RSS على الأجهزة المحمّلة ويمنع عمل auto-reply/extension من تجويع المجموعات غير ذات الصلة.
    - لا يزال `pnpm test --watch` يستخدم مخطط مشروع `vitest.config.ts` الجذري الأصلي، لأن حلقة مراقبة متعددة الأجزاء ليست عملية.
    - يوجّه `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر المسارات محددة النطاق أولًا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع تكلفة بدء مشروع الجذر بالكامل.
    - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى مسارات رخيصة محددة النطاق افتراضيًا: تعديلات الاختبار المباشرة، وملفات `*.test.ts` الشقيقة، وخرائط المصدر الصريحة، والمعتمدات المحلية في مخطط الاستيراد. لا تؤدي تعديلات الإعداد/التهيئة/الحزمة إلى تشغيل واسع للاختبارات إلا إذا استخدمت صراحة `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هو بوابة الفحص المحلية الذكية المعتادة للعمل الضيق. يصنّف الفرق إلى النواة، واختبارات النواة، وextensions، واختبارات extension، والتطبيقات، والمستندات، وبيانات الإصدار الوصفية، وأدوات Docker الحية، والأدوات، ثم يشغّل أوامر فحص الأنواع والlint والحراسة المطابقة. لا يشغّل اختبارات Vitest؛ استدعِ `pnpm test:changed` أو `pnpm test <target>` صريحًا لإثبات الاختبار. تشغّل زيادات الإصدار التي تقتصر على بيانات الإصدار الوصفية فحوصات موجهة للإصدار/الإعداد/اعتماديات الجذر، مع حارس يرفض تغييرات الحزمة خارج حقل الإصدار عالي المستوى.
    - تشغّل تعديلات حزمة ACP الحية على Docker فحوصات مركزة: صياغة shell لسكربتات مصادقة Docker الحية وتشغيلًا تجريبيًا جافًا لمجدول Docker الحي. تُدرج تغييرات `package.json` فقط عندما يكون الفرق محدودًا بـ `scripts["test:docker:live-*"]`؛ ولا تزال تعديلات الاعتماديات والتصدير والإصدار وأسطح الحزمة الأخرى تستخدم الحراس الأوسع.
    - تُوجّه اختبارات الوحدة خفيفة الاستيراد من agents والأوامر وplugins ومساعدات auto-reply و`plugin-sdk` ومناطق الأدوات الصرفة المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ تبقى الملفات ذات الحالة/الثقيلة وقت التشغيل على المسارات الموجودة.
    - تُعيّن أيضًا ملفات مصدر مساعدة مختارة من `plugin-sdk` و`commands` تشغيلات وضع التغيير إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدين إعادة تشغيل المجموعة الثقيلة بالكامل لذلك الدليل.
    - لدى `auto-reply` حاويات مخصصة لمساعدات النواة العليا، واختبارات تكامل `reply.*` العليا، وشجرة `src/auto-reply/reply/**` الفرعية. يقسم CI شجرة الردود الفرعية أكثر إلى أجزاء agent-runner وdispatch وcommands/state-routing حتى لا تستحوذ حاوية ثقيلة الاستيراد واحدة على ذيل Node بالكامل.
    - يتخطى CI العادي لـ PR/main عمدًا مسح دفعة extension وجزء `agentic-plugins` الخاص بالإصدار فقط. يطلق Full Release Validation سير العمل الفرعي المنفصل `Plugin Prerelease` لتلك المجموعات الثقيلة بـ plugin/extension على مرشحي الإصدار.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - عندما تغيّر مدخلات اكتشاف أداة الرسائل أو سياق تشغيل Compaction،
      أبقِ مستويي التغطية كلاهما.
    - أضف اختبارات انحدار مركزة للمساعدين لحدود التوجيه والتطبيع الصرفة.
    - أبقِ مجموعات تكامل المشغّل المضمّن سليمة:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق تلك المجموعات من أن المعرّفات محددة النطاق وسلوك Compaction لا تزال تمر
      عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ اختبارات المساعدين فقط
      ليست بديلًا كافيًا لتلك مسارات التكامل.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - الإعداد الأساسي لـ Vitest يضبط الافتراضي على `threads`.
    - يثبت إعداد Vitest المشترك `isolate: false` ويستخدم
      المشغّل غير المعزول عبر مشاريع الجذر وإعدادات e2e والحية.
    - يحافظ مسار UI الجذري على تهيئة `jsdom` والمحسّن الخاصين به، لكنه يعمل
      أيضًا على المشغّل المشترك غير المعزول.
    - يرث كل جزء `pnpm test` نفس افتراضيات `threads` + `isolate: false`
      من إعداد Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node الفرعية الخاصة بـ Vitest
      افتراضيًا لتقليل تكرار ترجمة V8 أثناء التشغيلات المحلية الكبيرة.
      اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8 القياسي.

  </Accordion>

  <Accordion title="Fast local iteration">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يطلقها الفرق.
    - خطاف pre-commit للتنسيق فقط. يعيد إدراج الملفات المنسقة
      ولا يشغّل lint أو فحص الأنواع أو الاختبارات.
    - شغّل `pnpm check:changed` صراحة قبل التسليم أو الدفع عندما
      تحتاج إلى بوابة الفحص المحلية الذكية.
    - يوجّه `pnpm test:changed` عبر مسارات رخيصة محددة النطاق افتراضيًا. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر الوكيل
      أن تعديل حزمة اختبار أو إعداد أو حزمة أو عقد يحتاج فعلًا إلى تغطية Vitest أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه نفسه،
      لكن مع حد أعلى للعمال.
    - التحجيم التلقائي للعمال محليًا محافظ عمدًا ويتراجع
      عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، لذلك تُحدث تشغيلات
      Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
    - يعلّم إعداد Vitest الأساسي المشاريع/ملفات الإعداد كـ
      `forceRerunTriggers` حتى تبقى إعادات التشغيل في وضع التغيير صحيحة عندما تتغير
      توصيلات الاختبار.
    - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفين المدعومين؛
      اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت
      موقع تخزين مؤقت صريحًا واحدًا للتنميط المباشر.

  </Accordion>

  <Accordion title="Perf debugging">

    - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى
      إخراج تفصيل الاستيراد.
    - يحدد `pnpm test:perf:imports:changed` عرض التنميط نفسه إلى
      الملفات المتغيرة منذ `origin/main`.
    - تُكتب بيانات توقيت الأجزاء إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم تشغيلات الإعداد الكامل مسار الإعداد كمفتاح؛ وتلحق أجزاء CI
      ذات نمط التضمين اسم الجزء حتى يمكن تتبع الأجزاء المرشحة
      بشكل منفصل.
    - عندما لا يزال اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل،
      أبقِ الاعتماديات الثقيلة خلف واجهة `*.runtime.ts` محلية ضيقة و
      قم بمحاكاة تلك الواجهة مباشرة بدلًا من الاستيراد العميق لمساعدات وقت التشغيل فقط
      لتمريرها عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين
      `test:changed` الموجّه ومسار مشروع الجذر الأصلي لذلك الفرق المثبت
      ويطبع زمن الحائط بالإضافة إلى أقصى RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة المتسخة الحالية
      عبر توجيه قائمة الملفات المتغيرة من خلال
      `scripts/test-projects.mjs` وإعداد Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي من أجل
      تكاليف بدء Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل من أجل
      مجموعة الوحدة مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، مفروض على عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا عبر loopback مع تمكين التشخيصات افتراضيًا
  - يدفع رسائل Gateway اصطناعية وذاكرة وحملًا كبيرًا عبر مسار حدث التشخيص
  - يستعلم عن `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات استمرار حزمة استقرار التشخيصات
  - يؤكد أن المسجل يبقى محدودًا، وأن عينات RSS الاصطناعية تبقى دون ميزانية الضغط، وأن أعماق قوائم الانتظار لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج مفاتيح
  - مسار ضيق لمتابعة انحدارات الاستقرار، وليس بديلًا لمجموعة Gateway الكاملة

### E2E (اختبار دخان Gateway)

- الأمر: `pnpm test:e2e`
- التهيئة: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات E2E الخاصة بـ Plugin المضمّنة ضمن `extensions/`
- الإعدادات الافتراضية لوقت التشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمالًا تكيفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل عبء دخل/خرج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل إخراج وحدة التحكم المفصّل.
- النطاق:
  - سلوك Gateway متعدد النسخ من البداية إلى النهاية
  - أسطح WebSocket/HTTP، وإقران Node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تفعيله في خط الأنابيب)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات الوحدة (قد يكون أبطأ)

### E2E: اختبار دخان الواجهة الخلفية لـ OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ Gateway معزولًا لـ OpenShell على المضيف عبر Docker
  - ينشئ صندوق رمل من Dockerfile محلي مؤقت
  - يمرّن الواجهة الخلفية لـ OpenShell في OpenClaw عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات المتعارف عليه عن بعد عبر جسر fs الخاص بصندوق الرمل
- التوقعات:
  - اختياري فقط؛ ليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا باسم `openshell` إضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر Gateway الاختبار وصندوق الرمل
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتفعيل الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي أو سكربت تغليف غير افتراضي

### مباشر (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- التهيئة: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات live الخاصة بـ Plugin المضمّنة ضمن `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزود/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - التقاط تغييرات صيغة المزود، وخصائص استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - ليس مستقرًا في CI عن قصد (شبكات حقيقية، سياسات مزودين حقيقية، حصص، انقطاعات)
  - يكلف مالًا / يستخدم حدود المعدل
  - يفضّل تشغيل مجموعات فرعية مقيّدة بدلًا من "كل شيء"
- تشغّل عمليات live المصدر `~/.profile` لالتقاط مفاتيح API المفقودة.
- افتراضيًا، ما زالت عمليات live تعزل `HOME` وتنسخ مواد التهيئة/المصادقة إلى مجلد اختبار مؤقت للمنزل حتى لا تتمكن تجهيزات الوحدة من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم اختبارات live مجلد المنزل الحقيقي لديك.
- أصبح `pnpm test:live` يستخدم الآن وضعًا أهدأ افتراضيًا: يحتفظ بإخراج التقدم `[live] ...`، لكنه يكتم إشعار `~/.profile` الإضافي وسجلات تمهيد Gateway/ثرثرة Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بكل مزود): اضبط `*_API_KEYS` بتنسيق الفواصل/الفواصل المنقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (مثل `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو تجاوزًا لكل live عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- إخراج التقدم/Heartbeat:
  - تصدر مجموعات live الآن أسطر تقدم إلى stderr بحيث تكون استدعاءات المزود الطويلة نشطة بوضوح حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة تحكم Vitest حتى تتدفق أسطر تقدم المزود/Gateway فورًا أثناء عمليات live.
  - اضبط Heartbeat للنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat للـ Gateway/المسبار باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة اختبارات ينبغي أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت كثيرًا)
- لمس شبكات Gateway / بروتوكول WS / الإقران: أضف `pnpm test:e2e`
- تصحيح "روبوتي متوقف" / إخفاقات خاصة بالمزود / استدعاء الأدوات: شغّل `pnpm test:live` مقيّدًا

## اختبارات live (التي تلمس الشبكة)

لمصفوفة نماذج live، واختبارات دخان الواجهة الخلفية للـ CLI، واختبارات دخان ACP، وحاضنة خادم تطبيق Codex،
وجميع اختبارات live لمزودي الوسائط (Deepgram وBytePlus وComfyUI والصور
والموسيقى والفيديو وحاضنة الوسائط) — إضافة إلى التعامل مع بيانات الاعتماد لعمليات live — راجع
[اختبار مجموعات live](/ar/help/testing-live). لقائمة التحقق المخصصة للتحديث
وتحقق Plugin، راجع
[اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

## مشغّلات Docker (اختبارات "يعمل في Linux" الاختيارية)

تنقسم مشغّلات Docker هذه إلى مجموعتين:

- مشغّلات نماذج live: يشغّل `test:docker:live-models` و`test:docker:live-gateway` ملف live المطابق لمفتاح الملف الشخصي فقط داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب مجلد التهيئة المحلي ومساحة العمل لديك (وتشغيل المصدر `~/.profile` إذا كان مركّبًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغّلات Docker live حد دخان أصغر افتراضيًا حتى يبقى المسح الكامل في Docker عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة تلك عندما
  تريد صراحةً الفحص الشامل الأكبر.
- يبني `test:docker:all` صورة Docker الخاصة بـ live مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كحزمة npm tarball عبر `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة المجردة هي فقط مشغّل Node/Git لمسارات التثبيت/التحديث/اعتمادية Plugin؛ تركّب تلك المسارات الحزمة المسبقة البناء. تثبّت الصورة الوظيفية الحزمة نفسها في `/app` لمسارات وظائف التطبيق المبني. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في خانات العمليات، بينما تمنع حدود الموارد مسارات live الثقيلة، وتثبيت npm، ومتعددة الخدمات من البدء كلها دفعة واحدة. إذا كان مسار واحد أثقل من الحدود النشطة، يستطيع المجدول مع ذلك بدءه عندما يكون الحوض فارغًا ثم يبقيه يعمل وحده حتى تتوفر السعة مجددًا. الافتراضيات هي 10 خانات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما يكون لدى مضيف Docker هامش أكبر. يجري المشغّل فحصًا تمهيديًا لـ Docker افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزونة دون بناء أو تشغيل Docker، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة، واحتياجات الحزمة/الصورة، وبيانات الاعتماد.
- `Package Acceptance` هو بوابة الحزمة الأصلية في GitHub لسؤال "هل تعمل هذه الحزمة القابلة للتثبيت كمنتج؟" يحلّ حزمة مرشحة واحدة من `source=npm` أو `source=ref` أو `source=url` أو `source=artifact`، ويرفعها باسم `package-under-test`، ثم يشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد تلك الحزمة الدقيقة بدلًا من إعادة حزم المرجع المحدد. ترتّب الملفات الشخصية حسب الاتساع: `smoke` و`package` و`product` و`full`. راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins) لعقد الحزمة/التحديث/Plugin، ومصفوفة بقاء الترقية المنشورة، وافتراضيات الإصدار، وفرز الإخفاقات.
- تشغّل اختبارات البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يمرّ الحارس عبر الرسم البياني المبني الثابت من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا كانت استيرادات بدء التشغيل قبل الإرسال تستورد اعتماديات حزم مثل Commander أو واجهة مطالبات UI أو undici أو التسجيل قبل إرسال الأمر؛ كما يبقي قطعة تشغيل Gateway المضمّنة ضمن الميزانية ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة. يغطي اختبار دخان CLI المعبأ أيضًا مساعدة الجذر، ومساعدة الإعداد الأولي، ومساعدة doctor، والحالة، ومخطط التهيئة، وأمر قائمة النماذج.
- توافق `Package Acceptance` القديم محدود عند `2026.4.25` (بما يشمل `2026.4.25-beta.*`). حتى ذلك الحد، تتحمل الحاضنة فقط فجوات بيانات تعريف الحزم المشحونة: إدخالات مخزون QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات التصحيح في تجهيز git المشتق من tarball، وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة، وغياب استمرارية سجل تثبيت السوق، وترحيل بيانات تعريف التهيئة أثناء `plugins update`. للحزم بعد `2026.4.25`، تكون تلك المسارات إخفاقات صارمة.
- مشغّلات دخان الحاويات: `test:docker:openwebui` و`test:docker:onboard` و`test:docker:npm-onboard-channel-agent` و`test:docker:update-channel-switch` و`test:docker:upgrade-survivor` و`test:docker:published-upgrade-survivor` و`test:docker:session-runtime-context` و`test:docker:agents-delete-shared-workspace` و`test:docker:gateway-network` و`test:docker:browser-cdp-snapshot` و`test:docker:mcp-channels` و`test:docker:pi-bundle-mcp-tools` و`test:docker:cron-mcp-cleanup` و`test:docker:plugins` و`test:docker:plugin-update` و`test:docker:plugin-lifecycle-matrix` و`test:docker:config-reload` تبدأ حاوية حقيقية واحدة أو أكثر وتتحقق من مسارات تكامل أعلى مستوى.

تربط مشغّلات Docker لنماذج live أيضًا مجلدات منازل مصادقة CLI المطلوبة فقط (أو كل المجلدات المدعومة عندما لا يكون التشغيل مقيّدًا)، ثم تنسخها إلى مجلد المنزل داخل الحاوية قبل التشغيل حتى يتمكن OAuth الخاص بالـ CLI الخارجي من تحديث الرموز دون تعديل مخزن مصادقة المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- فحص دخاني لربط ACP: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- فحص دخاني لخلفية CLI: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- فحص دخاني لحزام خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- فحص دخاني لقابلية الملاحظة: `pnpm qa:otel:smoke` هو مسار QA خاص لفحص نسخة مصدرية. لا يدخل عمدا ضمن مسارات إصدار Docker للحزم لأن أرشيف npm لا يتضمن QA Lab.
- فحص دخاني مباشر لـ Open WebUI: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، إنشاء هيكل كامل): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- فحص دخاني لإعداد أرشيف Npm والقناة والوكيل: `pnpm test:docker:npm-onboard-channel-agent` يثبت أرشيف OpenClaw المحزم عالميا في Docker، ويضبط OpenAI عبر إعداد أولي بمرجع بيئة مع Telegram افتراضيا، ويشغل doctor، ويشغل دورة وكيل OpenAI واحدة بمحاكاة. أعد استخدام أرشيف محزما مسبقا باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخط إعادة بناء المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` أو `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- فحص دخاني لتبديل قناة التحديث: `pnpm test:docker:update-channel-switch` يثبت أرشيف OpenClaw المحزم عالميا في Docker، ويبدّل من حزمة `stable` إلى git `dev`، ويتحقق من عمل القناة المحفوظة وPlugin بعد التحديث، ثم يعود إلى حزمة `stable` ويفحص حالة التحديث.
- فحص دخاني للترقية الناجية: `pnpm test:docker:upgrade-survivor` يثبت أرشيف OpenClaw المحزم فوق fixture مستخدم قديم غير نظيف يتضمن وكلاء، وتكوين قناة، وقوائم سماح لـ Plugin، وحالة تبعيات Plugin قديمة، وملفات مساحة عمل/جلسة موجودة. يشغل تحديث الحزمة مع doctor غير تفاعلي من دون مزود مباشر أو مفاتيح قناة، ثم يبدأ Gateway عبر local loopback ويفحص حفظ التكوين/الحالة مع ميزانيات البدء/الحالة.
- فحص دخاني منشور للترقية الناجية: `pnpm test:docker:published-upgrade-survivor` يثبت `openclaw@latest` افتراضيا، ويزرع ملفات مستخدم موجود واقعية، ويضبط ذلك الأساس بوصفة أوامر مضمّنة، ويتحقق من التكوين الناتج، ويحدث ذلك التثبيت المنشور إلى الأرشيف المرشح، ويشغل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر local loopback ويفحص النوايا المضبوطة، وحفظ الحالة، والبدء، و`/healthz`، و`/readyz`، وميزانيات حالة RPC. تجاوز أساسا واحدا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، واطلب من المجدول التجميعي توسيع الأسس الدقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `all-since-2026.4.23`، ووسّع fixtures ذات شكل المشكلات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues`؛ تتضمن مجموعة reported-issues حالة `configured-plugin-installs` لإصلاح تثبيت Plugin خارجي لـ OpenClaw تلقائيا. تعرض Package Acceptance هذه كـ `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`؛ ويستخدم Full Release Validation أحدث أساس افتراضي في مسار الحجب ويوسع إلى all-since/reported-issues فقط عند `run_release_soak=true` أو `release_profile=full`.
- فحص دخاني لسياق تشغيل الجلسة: `pnpm test:docker:session-runtime-context` يتحقق من استمرار سجل سياق التشغيل المخفي مع إصلاح doctor للفروع المتأثرة والمكررة من إعادة كتابة المطالبات.
- فحص دخاني للتثبيت العالمي عبر Bun: `bash scripts/e2e/bun-global-install-smoke.sh` يحزم الشجرة الحالية، ويثبتها باستخدام `bun install -g` في مجلد home معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد مزودي الصور المضمنين بدلا من التوقف. أعد استخدام أرشيف محزما مسبقا باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخط بناء المضيف باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- فحص دخاني للمثبت عبر Docker: `bash scripts/test-install-sh-docker.sh` يشارك ذاكرة تخزين npm مؤقتة واحدة بين حاويات root والتحديث وdirect-npm. يعتمد فحص التحديث افتراضيا على npm `latest` كأساس مستقر قبل الترقية إلى الأرشيف المرشح. تجاوزه محليا باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، أو باستخدام مدخل `update_baseline_version` في سير عمل Install Smoke على GitHub. تحتفظ فحوصات المثبت لغير root بذاكرة تخزين npm مؤقتة معزولة حتى لا تحجب إدخالات الذاكرة المؤقتة المملوكة لـ root سلوك التثبيت المحلي للمستخدم. اضبط `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة التخزين المؤقت root/update/direct-npm عبر إعادات التشغيل المحلية.
- يتخطى Install Smoke CI التحديث العالمي المباشر المكرر عبر npm باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل السكربت محليا من دون هذه البيئة عند الحاجة إلى تغطية `npm install -g` المباشرة.
- فحص دخاني لـ CLI لحذف الوكلاء مساحة عمل مشتركة: `pnpm test:docker:agents-delete-shared-workspace` (السكربت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) يبني صورة Dockerfile الجذر افتراضيا، ويزرع وكيلين مع مساحة عمل واحدة في home حاوية معزولة، ويشغل `agents delete --json`، ويتحقق من JSON صالح مع سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke باستخدام `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- فحص دخاني للقطات Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (السكربت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) يبني صورة E2E المصدرية مع طبقة Chromium، ويبدأ Chromium مع CDP خام، ويشغل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي عناوين URL للروابط، والعناصر القابلة للنقر المرفوعة بالمؤشر، ومراجع iframe، وبيانات الإطار الوصفية.
- انحدار الحد الأدنى للاستدلال في OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (السكربت: `scripts/e2e/openai-web-search-minimal-docker.sh`) يشغل خادم OpenAI بمحاكاة عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يجبر مخطط المزود على الرفض ويفحص ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + فحص دخاني لإطار إشعار Claude خام): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات Pi bundle MCP (خادم MCP حقيقي عبر stdio + فحص دخاني لسماح/رفض ملف Pi المضمن): `pnpm test:docker:pi-bundle-mcp-tools` (السكربت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف Cron/subagent MCP (Gateway حقيقي + إنهاء تابع MCP عبر stdio بعد تشغيلات cron معزولة وsubagent لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكربت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (فحص دخاني للتثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git المتحركة، وحزمة ClawHub شاملة، وتحديثات marketplace، وتمكين/فحص Claude-bundle): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)
  اضبط `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/التشغيل الافتراضي الشامل باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. من دون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم fixture محلي معزول لـ ClawHub.
- فحص دخاني لتحديث Plugin دون تغيير: `pnpm test:docker:plugin-update` (السكربت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- فحص دخاني لمصفوفة دورة حياة Plugin: `pnpm test:docker:plugin-lifecycle-matrix` يثبت أرشيف OpenClaw المحزم في حاوية عارية، ويثبت Plugin من npm، ويبدل التمكين/التعطيل، ويرقيه ويخفضه عبر سجل npm محلي، ويحذف الكود المثبت، ثم يتحقق من أن الإلغاء لا يزال يزيل الحالة القديمة مع تسجيل مقاييس RSS/CPU لكل مرحلة من دورة الحياة.
- فحص دخاني لبيانات إعادة تحميل التكوين الوصفية: `pnpm test:docker:config-reload` (السكربت: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: يغطي `pnpm test:docker:plugins` الفحص الدخاني للتثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git المتحركة، وfixtures ClawHub، وتحديثات marketplace، وتمكين/فحص Claude-bundle. يغطي `pnpm test:docker:plugin-update` سلوك التحديث دون تغيير للـ plugins المثبتة. يغطي `pnpm test:docker:plugin-lifecycle-matrix` تثبيت Plugin من npm مع تتبع الموارد، وتمكينه، وتعطيله، وترقيته، وخفضه، وإلغاء تثبيته عند فقدان الكود.

لبناء الصورة الوظيفية المشتركة مسبقا وإعادة استخدامها يدويا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بالمجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ذات أولوية عند ضبطها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكربتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات QR وDocker للمثبت بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلا من تشغيل التطبيق المبني المشترك.

تقوم مشغلات Docker للنماذج الحية أيضًا بربط التحميل للنسخة الحالية للقراءة فقط
وتجهيزها في دليل عمل مؤقت داخل الحاوية. يحافظ هذا على خفة صورة وقت التشغيل
مع الاستمرار في تشغيل Vitest على المصدر/الإعدادات المحلية الدقيقة لديك.
تتجاوز خطوة التجهيز ذاكرات التخزين المؤقت المحلية الكبيرة فقط ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` المحلية للتطبيق
أو أدلة مخرجات Gradle، حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ
الآثار الخاصة بالجهاز.
كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات Gateway الحية
عمال قنوات Telegram/Discord/وغيرها الحقيقيين داخل الحاوية.
لا يزال `test:docker:live-models` يشغل `pnpm test:live`، لذلك مرر
`OPENCLAW_LIVE_GATEWAY_*` أيضًا عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
الحية من مسار Docker ذلك.
`test:docker:openwebui` هو فحص توافق أعلى مستوى: يبدأ حاوية Gateway من
OpenClaw مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبتة الإصدار مقابل ذلك Gateway، ويسجل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وكيل Open WebUI `/api/chat/completions`.
قد تكون أول عملية تشغيل أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى جلب صورة
Open WebUI، وقد يحتاج Open WebUI إلى إنهاء إعداد بدء التشغيل البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج حيًا قابلًا للاستخدام، ويمثل `OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيًا) الطريقة الأساسية لتوفيره في التشغيلات داخل Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عمدًا ولا يحتاج إلى حساب Telegram أو Discord
أو iMessage حقيقي. يشغل حاوية Gateway مزروعة مسبقًا،
ويبدأ حاوية ثانية تنشئ `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجهة،
وقراءة النصوص، وبيانات تعريف المرفقات، وسلوك طابور الأحداث الحية،
وتوجيه الإرسال الصادر، وإشعارات القنوات + الأذونات بأسلوب Claude عبر جسر MCP
الحقيقي المعتمد على stdio. يفحص اختبار الإشعارات إطارات stdio MCP الخام مباشرة
حتى يتحقق الفحص مما يصدره الجسر فعليًا، وليس فقط ما يصادف أن تعرضه SDK عميل معينة.
`test:docker:pi-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبني صورة Docker للمستودع، ويبدأ خادم فحص MCP حقيقيًا عبر stdio داخل الحاوية،
ويجسد ذلك الخادم عبر وقت تشغيل MCP لحزمة Pi المضمنة،
وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان بأدوات
`bundle-mcp` بينما يقوم `minimal` و`tools.deny: ["bundle-mcp"]` بترشيحها.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبدأ Gateway مزروعًا مسبقًا مع خادم فحص MCP حقيقي عبر stdio، ويشغل دورة Cron
معزولة ودورة ابن لمرة واحدة عبر `/subagents spawn`، ثم يتحقق من أن عملية MCP
الفرعية تخرج بعد كل تشغيل.

فحص ACP يدوي للغة العادية في الخيوط (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لسير عمل الانحدار/التصحيح. قد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه خيوط ACP، لذلك لا تحذفه.

متغيرات البيئة المفيدة:

- `OPENCLAW_CONFIG_DIR=...` (افتراضيًا: `~/.openclaw`) مثبت إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (افتراضيًا: `~/.openclaw/workspace`) مثبت إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (افتراضيًا: `~/.profile`) مثبت إلى `/home/node/.profile` ويتم تحميله قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المحملة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعدادات/مساحة عمل مؤقتة ومن دون تحميلات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (افتراضيًا: `~/.cache/openclaw/docker-cli-tools`) مثبت إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- أدلة/ملفات مصادقة CLI الخارجية ضمن `$HOME` تثبت للقراءة فقط تحت `/host-auth...`، ثم تنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و`~/.codex/config.toml` و`.claude.json` و`~/.claude/.credentials.json` و`~/.claude/settings.json` و`~/.claude/settings.local.json`
  - تقوم تشغيلات الموفرين المضيقة بتثبيت الأدلة/الملفات المطلوبة فقط والمستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز ذلك يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لترشيح الموفرين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لعمليات إعادة التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن الملف الشخصي (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لفحص Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز موجه فحص nonce المستخدم بواسطة فحص Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## فحص سلامة الوثائق

شغل فحوصات الوثائق بعد تعديلات الوثائق: `pnpm check:docs`.
شغل تحقق Mintlify الكامل من المراسي عندما تحتاج إلى فحوصات عناوين داخل الصفحة أيضًا: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه انحدارات "مسار حقيقي" دون موفرين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة agent): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway (WS `wizard.start`/`wizard.next`، يكتب الإعدادات + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بضعة اختبارات آمنة لـ CI تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء أدوات وهمي عبر Gateway الحقيقي + حلقة agent (`src/gateway/gateway.test.ts`).
- تدفقات معالج من طرف إلى طرف تتحقق من توصيل الجلسة وتأثيرات الإعدادات (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودًا لـ Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تدرج Skills في الموجه، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الجولات تتحقق من ترتيب الأدوات، واستمرار سجل الجلسة، وحدود صندوق العزل.

ينبغي أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغل سيناريوهات يستخدم موفرين وهميين للتحقق من استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skills، وتوصيل الجلسة.
- مجموعة صغيرة من السيناريوهات المركزة على Skills (استخدام مقابل تجنب، بوابات، حقن الموجهات).
- تقييمات حية اختيارية (باشتراك صريح، ومحكومة بمتغيرات البيئة) فقط بعد توفر المجموعة الآمنة لـ CI.

## اختبارات العقد (شكل Plugin والقناة)

تتحقق اختبارات العقد من أن كل Plugin وقناة مسجلين يلتزمان بعقد
الواجهة الخاص بهما. تمر على جميع Plugins المكتشفة وتشغل مجموعة من
تأكيدات الشكل والسلوك. يتجاوز مسار وحدة `pnpm test` الافتراضي عمدًا
ملفات الفحص والدخان الخاصة بالوصلات المشتركة هذه؛ شغل أوامر العقد صراحة
عندما تلمس أسطح القنوات أو الموفرين المشتركة.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود الموفرين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

تقع في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي لـ Plugin (المعرف، الاسم، القدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرف الخيط
- **directory** - API الدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة الموفر

تقع في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugin

### عقود الموفرين

تقع في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - API كتالوج النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل الموفر
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تشغلها

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة Plugin قناة أو موفر أو تعديله
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقد في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة الانحدارات (إرشادات)

عندما تصلح مشكلة موفر/نموذج اكتشفت في التشغيل الحي:

- أضف انحدارًا آمنًا لـ CI إن أمكن (موفر وهمي/بديل، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت بطبيعتها حية فقط (حدود المعدل، سياسات المصادقة)، فأبق الاختبار الحي ضيقًا واختياريًا عبر متغيرات البيئة
- فضل استهداف أصغر طبقة تلتقط الخلل:
  - خطأ تحويل/إعادة تشغيل طلب الموفر → اختبار نماذج مباشر
  - خطأ مسار جلسة/سجل/أدوات Gateway → فحص Gateway حي أو اختبار Gateway وهمي آمن لـ CI
- حاجز اجتياز SecretRef:
  - يشتق `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا واحدًا مختارًا لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرفات exec ذات مقاطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند معرفات الأهداف غير المصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذو صلة

- [اختبار التشغيل الحي](/ar/help/testing-live)
- [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)
- [CI](/ar/ci)
