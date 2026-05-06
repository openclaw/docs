---
read_when:
    - تشغيل الاختبارات محليًا أو في بيئة التكامل المستمر
    - إضافة اختبارات انحدار لأخطاء النماذج/المزوّدين
    - تصحيح أخطاء Gateway + سلوك الوكيل
summary: 'عدة الاختبار: مجموعات اختبارات الوحدة/e2e/المباشرة، ومشغلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-05-06T07:59:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

تضم OpenClaw ثلاث حزم Vitest (الوحدة/التكامل، e2e، الحية) ومجموعة صغيرة
من مشغلات Docker. هذا المستند دليل "كيف نختبر":

- ما تغطيه كل حزمة (وما تتعمد _عدم_ تغطيته).
- الأوامر التي يجب تشغيلها لسير العمل الشائع (محليًا، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتحدد النماذج/المزودين.
- كيف تضيف اختبارات انحدار لمشكلات النماذج/المزودين الواقعية.

<Note>
**حزمة QA (qa-lab، qa-channel، مسارات النقل الحية)** موثقة بشكل منفصل:

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) - البنية، سطح الأوامر، وتأليف السيناريوهات.
- [QA المصفوفي](/ar/concepts/qa-matrix) - مرجع لـ `pnpm openclaw qa matrix`.
- [قناة QA](/ar/channels/qa-channel) - Plugin النقل الاصطناعي المستخدم بواسطة السيناريوهات المدعومة بالمستودع.

تغطي هذه الصفحة تشغيل حزم الاختبارات العادية ومشغلات Docker/Parallels. يسرد قسم المشغلات الخاصة بـ QA أدناه ([المشغلات الخاصة بـ QA](#qa-specific-runners)) استدعاءات `qa` الملموسة ويشير مرة أخرى إلى المراجع أعلاه.
</Note>

## بداية سريعة

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل محلي أسرع للحزمة الكاملة على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- يستهدف الملفات مباشرة الآن مسارات الإضافات/القنوات أيضًا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تكرر العمل على فشل واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- حزمة E2E: `pnpm test:e2e`

عند تصحيح مزودين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- الحزمة الحية (النماذج + فحوصات أداة/صورة Gateway): `pnpm test:live`
- استهداف ملف حي واحد بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- تقارير أداء وقت التشغيل: شغّل `OpenClaw Performance` مع
  `live_gpt54=true` لدورة وكيل `openai/gpt-5.4` حقيقية أو
  `deep_profile=true` لأدوات Kova الخاصة بـ CPU/الكومة/الأثر. تنشر التشغيلات المجدولة يوميًا
  أدوات mock-provider وdeep-profile ومسار GPT 5.4 إلى
  `openclaw/clawgrit-reports` عند تكوين `CLAWGRIT_REPORTS_TOKEN`. يتضمن
  تقرير mock-provider أيضًا أرقام تشغيل Gateway على مستوى المصدر، والذاكرة،
  وضغط Plugin، وحلقة hello-loop متكررة بنموذج مزيف، وبدء تشغيل CLI.
- مسح النماذج الحية عبر Docker: `pnpm test:docker:live-models`
  - يشغل كل نموذج محدد الآن دورة نصية مع فحص صغير بنمط قراءة الملفات.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغل أيضًا دورة صورة صغيرة.
    عطّل الفحوصات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل إخفاقات المزود.
  - تغطية CI: كل من `OpenClaw Scheduled Live And E2E Checks` اليومية و
    `OpenClaw Release Checks` اليدوية يستدعيان سير العمل الحي/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، الذي يتضمن مهام مصفوفة منفصلة للنماذج الحية عبر Docker
    مقسمة حسب المزود.
  - لإعادات تشغيل CI المركزة، شغّل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و `live_models_only: true`.
  - أضف أسرار المزودين عالية الإشارة الجديدة إلى `scripts/ci-hydrate-live-auth.sh`
    إضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/الخاصة بالإصدار.
- فحص دخان الدردشة المربوطة بـ Codex الأصلي: `pnpm test:docker:live-codex-bind`
  - يشغل مسار Docker حيًا مقابل مسار خادم تطبيق Codex، ويربط رسالة Slack DM اصطناعية
    عبر `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من مرور رد عادي ومرفق صورة
    عبر ربط Plugin الأصلي بدلًا من ACP.
- فحص دخان عدة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغل دورات وكيل Gateway عبر عدة خادم تطبيق Codex المملوكة لـ Plugin،
    ويتحقق من `/codex status` و `/codex models`، وبشكل افتراضي يمارس فحوصات الصورة،
    وCron MCP، والوكيل الفرعي، وGuardian. عطّل فحص الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل إخفاقات أخرى في خادم تطبيق Codex.
    لفحص وكيل فرعي مركز، عطّل الفحوصات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد فحص الوكيل الفرعي ما لم يتم تعيين
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- فحص دخان أمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري شديد الاحتياط لسطح أمر الإنقاذ لقناة الرسائل.
    يمارس `/crestodian status`، ويضع تغيير نموذج دائمًا في قائمة الانتظار،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/التكوين.
- فحص دخان مخطط Crestodian عبر Docker: `pnpm test:docker:crestodian-planner`
  - يشغل Crestodian في حاوية بلا تكوين مع Claude CLI مزيف على `PATH`
    ويتحقق من أن fallback المخطط التقريبي يتحول إلى كتابة تكوين نوعية ومدققة.
- فحص دخان التشغيل الأول لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من مجلد حالة OpenClaw فارغ، ويوجه `openclaw` المجرد إلى
    Crestodian، ويطبق إعداد/نموذج/وكيل/Plugin Discord + كتابات SecretRef،
    ويتحقق من التكوين، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضًا في QA Lab عبر
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- فحص دخان تكلفة Moonshot/Kimi: مع تعيين `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مع `moonshot/kimi-k2.6`. تحقق من أن JSON يذكر Moonshot/K2.6 وأن
  سجل المساعد يخزن `usage.cost` المطبّعة.

<Tip>
عندما تحتاج إلى حالة فشل واحدة فقط، فضّل تضييق الاختبارات الحية عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## المشغلات الخاصة بـ QA

تقع هذه الأوامر بجانب حزم الاختبارات الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغل CI حزمة QA Lab في سير عمل مخصص. التكافؤ الوكيلي مضمّن تحت
`QA-Lab - All Lanes` والتحقق من الإصدار، وليس سير عمل PR مستقلًا.
ينبغي أن يستخدم التحقق الواسع `Full Release Validation` مع
`rerun_group=qa-parity` أو مجموعة QA لفحوصات الإصدار. تبقي فحوصات الإصدار
المستقرة/الافتراضية الاستنزاف الحي/Docker الشامل خلف `run_release_soak=true`؛
يفرض ملف `full` الاستنزاف. يعمل `QA-Lab - All Lanes`
ليلًا على `main` ومن التشغيل اليدوي مع مسار التكافؤ الوهمي، ومسار Matrix الحي،
ومسار Telegram الحي المدار بواسطة Convex، ومسار Discord الحي المدار بواسطة Convex
كمهام متوازية. تمرر فحوصات QA المجدولة وفحوصات الإصدار إلى Matrix
`--profile fast` صراحة، بينما تبقى القيمة الافتراضية لـ Matrix CLI ومدخل سير العمل اليدوي
`all`؛ يمكن للتشغيل اليدوي تجزئة `all` إلى مهام `transport`،
و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`. يشغل `OpenClaw Release
Checks` التكافؤ مع مسارات Matrix السريعة وTelegram قبل موافقة الإصدار،
باستخدام `mock-openai/gpt-5.5` لفحوصات نقل الإصدار كي تبقى
حتمية وتتجنب بدء تشغيل Plugin المزود العادي. تعطل Gateways النقل الحية هذه
بحث الذاكرة؛ يبقى سلوك الذاكرة مغطى بواسطة حزم تكافؤ QA.

تستخدم أجزاء الوسائط الحية للتحقق الكامل من الإصدار
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، الذي يحتوي مسبقًا على
`ffmpeg` و `ffprobe`. تستخدم أجزاء النماذج/الخلفيات الحية عبر Docker صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
التزام محدد، ثم تسحبها مع `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلًا من إعادة البناء
داخل كل جزء.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة بالمستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضياً مع عمال Gateway معزولين. يستخدم `qa-channel` تزامناً افتراضياً قدره 4 (محدوداً بعدد السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد العمال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما تريد الحصول على الآثار دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`. يبدأ `aimock` خادم مزوّد محلياً مدعوماً بـ AIMock لتغطية تجريبية للتركيبات ومحاكاة البروتوكول دون استبدال مسار `mock-openai` الواعي بالسيناريوهات.
- `pnpm test:plugins:kitchen-sink-live`
  - يشغّل اختبار التحمل الحي لـ Plugin OpenAI Kitchen Sink عبر QA Lab. يثبّت حزمة Kitchen Sink الخارجية، ويتحقق من مخزون سطح plugin SDK، ويفحص `/healthz` و`/readyz`، ويسجل دليل CPU/RSS الخاص بـ Gateway، ويشغّل دورة OpenAI حية، ويفحص التشخيصات العدائية. يتطلب مصادقة OpenAI حية مثل `OPENAI_API_KEY`. في جلسات Testbox المعبأة، يحمّل تلقائياً ملف مصادقة Testbox الحية عندما يكون مساعد `openclaw-testbox-env` موجوداً.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل معيار بدء Gateway بالإضافة إلى حزمة صغيرة من سيناريوهات QA Lab الوهمية (`channel-chat-baseline`، `memory-failure-fallback`، `gateway-restart-inflight-run`) ويكتب ملخص ملاحظة CPU مدمجاً تحت `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم فقط ملاحظات CPU الساخنة المستمرة افتراضياً (`--cpu-core-warn` بالإضافة إلى `--hot-wall-warn-ms`)، لذلك تُسجل دفعات بدء التشغيل القصيرة كمقاييس دون أن تبدو كارتداد تثبيت Gateway الممتد لدقائق.
  - يستخدم آثار `dist` المبنية؛ شغّل البناء أولاً عندما لا يحتوي السحب على مخرجات تشغيل حديثة بالفعل.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل VM Linux مؤقتة من Multipass.
  - يحافظ على سلوك اختيار السيناريوهات نفسه كما في `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزوّد/النموذج نفسها كما في `qa suite`.
  - تمرر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف: مفاتيح المزوّد المستندة إلى env، ومسار إعداد مزوّد QA الحي، و`CODEX_HOME` عند وجوده.
  - يجب أن تبقى أدلة الإخراج تحت جذر المستودع حتى يتمكن الضيف من الكتابة عائداً عبر مساحة العمل المركبة.
  - يكتب تقرير QA والملخص المعتادين بالإضافة إلى سجلات Multipass تحت `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لعمل QA بأسلوب المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني tarball npm من السحب الحالي، ويثبته عالمياً في Docker، ويشغّل تهيئة مفتاح OpenAI API غير التفاعلية، ويضبط Telegram افتراضياً، ويتحقق من تحميل تشغيل Plugin المعبأ دون إصلاح تبعيات بدء التشغيل، ويشغّل doctor، ويشغّل دورة وكيل محلية واحدة مقابل نقطة نهاية OpenAI وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ نفسه مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل فحص Docker حتمياً للتطبيق المبني لنسخ سياق التشغيل المضمنة. يتحقق من أن سياق تشغيل OpenClaw المخفي محفوظ كرسالة مخصصة غير معروضة بدلاً من التسرب إلى دورة المستخدم المرئية، ثم يزرع جلسة JSONL معطوبة متأثرة ويتحقق من أن `openclaw doctor --fix` يعيد كتابتها إلى الفرع النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبّت مرشح حزمة OpenClaw في Docker، ويشغّل تهيئة الحزمة المثبتة، ويضبط Telegram عبر CLI المثبت، ثم يعيد استخدام مسار Telegram QA الحي مع تلك الحزمة المثبتة باعتبارها Gateway النظام قيد الاختبار.
  - القيمة الافتراضية هي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛ عيّن `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار tarball محلي محلول بدلاً من التثبيت من السجل.
  - يستخدم بيانات اعتماد env الخاصة بـ Telegram نفسها أو مصدر بيانات اعتماد Convex نفسه مثل `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، عيّن `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` بالإضافة إلى `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. إذا كان `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI، يختار غلاف Docker Convex تلقائياً.
  - يتحقق الغلاف من env بيانات اعتماد Telegram أو Convex على المضيف قبل عمل بناء/تثبيت Docker. عيّن `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` فقط عند تصحيح إعداد ما قبل بيانات الاعتماد عمداً.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` القيمة المشتركة `OPENCLAW_QA_CREDENTIAL_ROLE` لهذا المسار فقط.
  - يعرّض GitHub Actions هذا المسار كسير عمل مشرف يدوي باسم `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة `qa-live-shared` وإيجارات بيانات اعتماد Convex CI.
- يعرّض GitHub Actions أيضاً `Package Acceptance` لإثبات المنتج الجانبي مقابل حزمة مرشحة واحدة. يقبل مرجعاً موثوقاً، أو مواصفة npm منشورة، أو عنوان HTTPS tarball URL بالإضافة إلى SHA-256، أو أثر tarball من تشغيل آخر، ويرفع `openclaw-current.tgz` الموحد باسم `package-under-test`، ثم يشغّل مجدول Docker E2E الحالي بملفات تعريف مسارات smoke أو package أو product أو full أو custom. عيّن `telegram_mode=mock-openai` أو `live-frontier` لتشغيل سير عمل Telegram QA مقابل أثر `package-under-test` نفسه.
  - أحدث إثبات منتج beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات عنوان tarball URL الدقيق ملخصاً:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- يحمّل إثبات الأثر أثر tarball من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - يحزم ويثبّت بناء OpenClaw الحالي في Docker، ويبدأ Gateway مع إعداد OpenAI، ثم يفعّل القنوات/Plugins المضمنة عبر تعديلات الإعداد.
  - يتحقق من أن اكتشاف الإعداد يترك Plugins القابلة للتنزيل غير المضبوطة غائبة، وأن أول إصلاح doctor مضبوط يثبّت كل Plugin قابل للتنزيل مفقود صراحةً، وأن إعادة تشغيل ثانية لا تشغّل إصلاح تبعيات مخفياً.
  - يثبّت أيضاً أساس npm أقدم معروفاً، ويفعّل Telegram قبل تشغيل `openclaw update --tag <candidate>`، ويتحقق من أن doctor اللاحق للتحديث في المرشح ينظف بقايا تبعيات Plugin القديمة دون إصلاح postinstall من جانب harness.
- `pnpm test:parallels:npm-update`
  - يشغّل فحص تحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. تثبّت كل منصة محددة أولاً الحزمة الأساسية المطلوبة، ثم تشغّل أمر `openclaw update` المثبت في الضيف نفسه وتتحقق من الإصدار المثبت، وحالة التحديث، وجاهزية Gateway، ودورة وكيل محلية واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux` أثناء التكرار على ضيف واحد. استخدم `--json` لمسار أثر الملخص وحالة كل مسار.
  - يستخدم مسار OpenAI `openai/gpt-5.5` لإثبات دورة الوكيل الحية افتراضياً. مرّر `--model <provider/model>` أو عيّن `OPENCLAW_PARALLELS_OPENAI_MODEL` عند التحقق عمداً من نموذج OpenAI آخر.
  - لفّ التشغيلات المحلية الطويلة بمهلة على المضيف حتى لا تستهلك توقفات نقل Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسارات متداخلة تحت `/tmp/openclaw-parallels-npm-update.*`. افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log` قبل افتراض أن الغلاف الخارجي متوقف.
  - قد يستغرق تحديث Windows من 10 إلى 15 دقيقة في عمل doctor اللاحق للتحديث وتحديث الحزمة على ضيف بارد؛ يظل ذلك سليماً عندما يكون سجل تصحيح npm المتداخل يتقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات فحص Parallels الفردية لـ macOS أو Windows أو Linux. فهي تشترك في حالة VM ويمكن أن تتصادم عند استعادة اللقطة، أو تقديم الحزمة، أو حالة Gateway الضيف.
  - يشغّل إثبات ما بعد التحديث سطح Plugin المضمن المعتاد لأن واجهات القدرة مثل الكلام وتوليد الصور وفهم الوسائط تُحمّل عبر APIs التشغيل المضمنة حتى عندما تتحقق دورة الوكيل نفسها من استجابة نصية بسيطة فقط.

- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم مزوّد AIMock المحلي لاختبار فحص البروتوكول مباشرة.
- `pnpm openclaw qa matrix`
  - يشغّل مسار Matrix QA الحي مقابل خادم Tuwunel homeserver مؤقت مدعوم بـ Docker. سحب المصدر فقط - لا تشحن التثبيتات المعبأة `qa-lab`.
  - CLI الكامل، وكتالوج الملف الشخصي/السيناريو، ومتغيرات env، وتخطيط الآثار: [Matrix QA](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار Telegram QA الحي مقابل مجموعة خاصة حقيقية باستخدام رموز bot السائق والنظام قيد الاختبار من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرف المجموعة هو معرف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمعة. استخدم وضع env افتراضياً، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في الإيجارات المجمعة.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما تريد الحصول على الآثار دون رمز خروج فاشل.
  - يتطلب botين مميزين في المجموعة الخاصة نفسها، مع كشف bot النظام قيد الاختبار عن اسم مستخدم Telegram.
  - لملاحظة مستقرة من bot إلى bot، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا botين وتأكد من أن bot السائق يمكنه ملاحظة حركة botات المجموعة.
  - يكتب تقرير Telegram QA وملخصاً وأثر الرسائل المرصودة تحت `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال السائق إلى رد النظام قيد الاختبار المرصود.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ توجد مصفوفة التغطية الخاصة بكل مسار في [نظرة عامة على QA ← تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` هي المجموعة الاصطناعية الواسعة وليست جزءاً من تلك المصفوفة.

### بيانات اعتماد Telegram المشتركة عبر Convex (v1)

عند تمكين `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل QA lab على إيجار حصري من تجمع مدعوم بـ Convex، ويرسل heartbeats
لذلك الإيجار أثناء تشغيل المسار، ويحرر الإيجار عند الإغلاق.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات env المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - القيمة الافتراضية لـ Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (تكون افتراضياً `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات env اختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين Convex URL الخاصة بـ loopback `http://` للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البادئة `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرفين (إضافة/إزالة/سرد في المجموعة)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل التشغيلات الحية للتحقق من عنوان URL لموقع Convex، وأسرار الوسيط،
وبادئة نقطة النهاية، ومهلة HTTP، وإمكانية الوصول للإدارة/السرد من دون طباعة
قيم الأسرار. استخدم `--json` للحصول على مخرجات قابلة للقراءة آليًا في السكربتات
وأدوات CI.

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
- يجب أن يكون `groupId` سلسلة معرف دردشة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

### إضافة قناة إلى QA

توجد أسماء البنية ومساعدي السيناريوهات لمهايئات القنوات الجديدة في [نظرة عامة على QA → إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: تنفيذ مشغل النقل على seam المضيف المشترك `qa-lab`، والتصريح عن `qaRunners` في بيان Plugin، والتركيب كـ `openclaw qa <runner>`، وتأليف السيناريوهات ضمن `qa/scenarios/`.

## مجموعات الاختبارات (ما الذي يعمل وأين)

فكر في المجموعات على أنها "واقعية متزايدة" (ومعها زيادة في عدم الثبات/التكلفة):

### الوحدة / التكامل (افتراضي)

- الأمر: `pnpm test`
- التكوين: تستخدم التشغيلات غير المستهدفة مجموعة الشظايا `vitest.full-*.config.ts` وقد توسع شظايا المشاريع المتعددة إلى تكوينات لكل مشروع للجدولة المتوازية
- الملفات: قوائم جرد الوحدة/النواة ضمن `src/**/*.test.ts`، و`packages/**/*.test.ts`، و`test/**/*.test.ts`؛ تعمل اختبارات وحدة الواجهة في شظية `unit-ui` المخصصة
- النطاق:
  - اختبارات وحدة نقية
  - اختبارات تكامل داخل العملية (مصادقة Gateway، والتوجيه، والأدوات، والتحليل، والتكوين)
  - انحدارات حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
  - يجب أن تثبت اختبارات المحلل ومحمل السطح العام سلوك الرجوع الواسع لـ `api.js` و
    `runtime-api.js` باستخدام تجهيزات Plugin صغيرة مولدة، وليس
    واجهات API لمصدر Plugin المضمن الحقيقي. تنتمي تحميلات API الخاصة بـ Plugin الحقيقي إلى
    مجموعات العقود/التكامل المملوكة للـ Plugin.

<AccordionGroup>
  <Accordion title="المشاريع والشظايا والمسارات محددة النطاق">

    - يشغل `pnpm test` غير المستهدف اثني عشر تكوينًا أصغر للشظايا (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) بدلًا من عملية مشروع جذرية أصلية ضخمة واحدة. يقلل هذا ذروة RSS على الأجهزة المحملة ويتجنب أن تحرم أعمال الرد التلقائي/الإضافات المجموعات غير ذات الصلة من الموارد.
    - لا يزال `pnpm test --watch` يستخدم مخطط مشروع الجذر الأصلي `vitest.config.ts`، لأن حلقة مراقبة متعددة الشظايا ليست عملية.
    - يوجه `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر المسارات محددة النطاق أولًا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع تكلفة بدء مشروع الجذر بالكامل.
    - يوسع `pnpm test:changed` مسارات git المتغيرة إلى مسارات رخيصة محددة النطاق افتراضيًا: تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتخطيطات المصدر الصريحة، وتوابع مخطط الاستيراد المحلية. لا تؤدي تعديلات التكوين/الإعداد/الحزمة إلى تشغيل واسع للاختبارات إلا إذا استخدمت صراحة `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هو بوابة الفحص المحلي الذكية العادية للعمل الضيق. يصنف الفرق إلى النواة، واختبارات النواة، والإضافات، واختبارات الإضافات، والتطبيقات، والوثائق، وبيانات إصدار الإصدار، وأدوات Docker الحية، والأدوات، ثم يشغل أوامر فحص الأنواع والlint والحراسة المطابقة. لا يشغل اختبارات Vitest؛ استدعِ `pnpm test:changed` أو `pnpm test <target>` صريحًا لإثبات الاختبار. تشغل زيادات الإصدار الخاصة ببيانات الإصدار فقط فحوصات مستهدفة للإصدار/التكوين/اعتماد الجذر، مع حارس يرفض تغييرات الحزمة خارج حقل الإصدار ذي المستوى الأعلى.
    - تشغل تعديلات عدة Docker ACP الحية فحوصات مركزة: صياغة shell لسكربتات مصادقة Docker الحية وتجربة جافة لمجدول Docker الحي. لا تُضمن تغييرات `package.json` إلا عندما يقتصر الفرق على `scripts["test:docker:live-*"]`؛ لا تزال تعديلات الاعتماد والتصدير والإصدار وأسطح الحزمة الأخرى تستخدم الحراس الأوسع.
    - تمر اختبارات الوحدة الخفيفة الاستيراد من الوكلاء، والأوامر، وplugins، ومساعدي الرد التلقائي، و`plugin-sdk`، ومناطق الأدوات النقية المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ تبقى الملفات ذات الحالة/الثقيلة وقت التشغيل على المسارات الحالية.
    - تخطط بعض ملفات مصدر مساعدي `plugin-sdk` و`commands` أيضًا تشغيلات وضع التغيير إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، لذلك تتجنب تعديلات المساعدين إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
    - لدى `auto-reply` حاويات مخصصة لمساعدي النواة من المستوى الأعلى، واختبارات تكامل `reply.*` من المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. تقسم CI كذلك الشجرة الفرعية للرد إلى شظايا مشغل الوكيل، والإرسال، والأوامر/توجيه الحالة حتى لا تمتلك حاوية ثقيلة الاستيراد واحدة ذيل Node الكامل.
    - تتخطى CI العادية لـ PR/main عمدًا اكتساح دفعة الإضافات وشظية `agentic-plugins` الخاصة بالإصدار فقط. يرسل التحقق الكامل من الإصدار سير عمل فرعيًا منفصلًا باسم `Plugin Prerelease` لهذه المجموعات الثقيلة في plugins/extensions على مرشحي الإصدار.

  </Accordion>

  <Accordion title="تغطية المشغل المضمن">

    - عند تغيير مدخلات اكتشاف أداة الرسائل أو سياق وقت تشغيل
      Compaction، حافظ على مستويي التغطية كليهما.
    - أضف انحدارات مساعد مركزة لحدود التوجيه والتطبيع النقية.
    - حافظ على صحة مجموعات تكامل المشغل المضمن:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه المجموعات من أن المعرفات محددة النطاق وسلوك Compaction لا يزالان يتدفقان
      عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ اختبارات المساعدين فقط
      ليست بديلًا كافيًا لتلك مسارات التكامل.

  </Accordion>

  <Accordion title="إعدادات Vitest الافتراضية للمجموعة والعزل">

    - يستخدم تكوين Vitest الأساسي افتراضيًا `threads`.
    - يثبت تكوين Vitest المشترك `isolate: false` ويستخدم
      المشغل غير المعزول عبر مشاريع الجذر، وe2e، والتكوينات الحية.
    - يحتفظ مسار واجهة الجذر بإعداد `jsdom` والمحسن الخاصين به، لكنه يعمل على
      المشغل المشترك غير المعزول أيضًا.
    - ترث كل شظية `pnpm test` الإعدادات الافتراضية نفسها `threads` + `isolate: false`
      من تكوين Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node الفرعية الخاصة بـ Vitest
      افتراضيًا لتقليل churn تجميع V8 أثناء التشغيلات المحلية الكبيرة.
      عيّن `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8
      القياسي.

  </Accordion>

  <Accordion title="تكرار محلي سريع">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يطلقها الفرق.
    - خطاف ما قبل الالتزام مخصص للتنسيق فقط. يعيد تنظيم الملفات المنسقة و
      لا يشغل lint أو فحص الأنواع أو الاختبارات.
    - شغل `pnpm check:changed` صراحة قبل التسليم أو الدفع عندما
      تحتاج إلى بوابة الفحص المحلي الذكية.
    - يوجه `pnpm test:changed` عبر مسارات رخيصة محددة النطاق افتراضيًا. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر الوكيل
      أن تعديل عدة أو تكوين أو حزمة أو عقد يحتاج فعلًا إلى
      تغطية Vitest أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه نفسه
      لكن مع حد أعلى للعمال.
    - القياس التلقائي للعمال محليًا محافظ عمدًا ويتراجع
      عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، لذلك تسبب تشغيلات
      Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
    - يعلّم تكوين Vitest الأساسي المشاريع/ملفات التكوين باعتبارها
      `forceRerunTriggers` حتى تبقى إعادة التشغيل في وضع التغيير صحيحة عندما تتغير
      توصيلات الاختبار.
    - يبقي التكوين `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفات المدعومة؛
      عيّن `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت
      موقع ذاكرة تخزين مؤقت صريحًا واحدًا للتوصيف المباشر.

  </Accordion>

  <Accordion title="تصحيح أخطاء الأداء">

    - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى
      مخرجات تفصيل الاستيراد.
    - يحدد `pnpm test:perf:imports:changed` عرض التوصيف نفسه إلى
      الملفات التي تغيرت منذ `origin/main`.
    - تُكتب بيانات توقيت الشظايا إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم تشغيلات التكوين الكامل مسار التكوين كمفتاح؛ تضيف شظايا CI
      القائمة على نمط التضمين اسم الشظية حتى يمكن تتبع الشظايا المرشحة
      بشكل منفصل.
    - عندما لا يزال اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل،
      أبقِ الاعتمادات الثقيلة خلف seam محلي ضيق `*.runtime.ts` و
      حاكِ ذلك seam مباشرة بدلًا من الاستيراد العميق لمساعدي وقت التشغيل فقط
      لتمريرهم عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` مسار
      `test:changed` الموجّه مع مسار مشروع الجذر الأصلي لذلك الفرق الملتزم
      ويطبع وقت الحائط بالإضافة إلى أقصى RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة الحالية
      المتسخة عبر توجيه قائمة الملفات المتغيرة من خلال
      `scripts/test-projects.mjs` وتكوين Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي
      لتكاليف بدء Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغل لمجموعة
      الوحدة مع تعطيل التوازي على مستوى الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- التكوين: `vitest.gateway.config.ts`، مجبر على عامل واحد
- النطاق:
  - يبدأ Gateway loopback حقيقيًا مع تمكين التشخيصات افتراضيًا
  - يقود churn اصطناعيًا لرسائل Gateway والذاكرة والحمولات الكبيرة عبر مسار حدث التشخيص
  - يستعلم عن `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدي استمرار حزمة استقرار التشخيص
  - يؤكد أن المسجل يبقى محدودًا، وأن عينات RSS الاصطناعية تبقى دون ميزانية الضغط، وأن أعماق الطوابير لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ومن دون مفاتيح
  - مسار ضيق لمتابعة انحدار الاستقرار، وليس بديلًا لمجموعة Gateway الكاملة

### E2E (دخان Gateway)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات E2E الخاصة بـ Plugin المضمّنة ضمن `extensions/`
- افتراضيات وقت التشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمّالًا متكيّفين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل عبء دخل/خرج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمّال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تمكين خرج وحدة التحكم التفصيلي.
- النطاق:
  - سلوك Gateway متعدد النسخ من البداية إلى النهاية
  - أسطح WebSocket/HTTP، إقران Node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في خط المعالجة)
  - لا يتطلب مفاتيح حقيقية
  - أجزاء متحركة أكثر من اختبارات الوحدات (قد يكون أبطأ)

### E2E: فحص دخاني لخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ Gateway معزولًا لـ OpenShell على المضيف عبر Docker
  - ينشئ صندوق رمل من Dockerfile محلي مؤقت
  - يختبر خلفية OpenShell في OpenClaw عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات البعيد المعياري عبر جسر نظام ملفات صندوق الرمل
- التوقعات:
  - اختياري فقط؛ ليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا لـ `openshell` مع عفريت Docker عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر Gateway الاختبار وصندوق الرمل
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو سكربت تغليف

### مباشر (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات Plugin المباشرة المضمّنة ضمن `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزود/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - التقاط تغييرات تنسيق المزود، وخصائص استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر في CI حسب التصميم (شبكات حقيقية، سياسات مزودين حقيقية، حصص، انقطاعات)
  - يكلّف مالًا / يستخدم حدود المعدل
  - يُفضّل تشغيل مجموعات فرعية أضيق بدلًا من "كل شيء"
- تشغّلات المباشر تستورد `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيًا، لا تزال تشغّلات المباشر تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى منزل اختبار مؤقت حتى لا تتمكن تجهيزات اختبارات الوحدات من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم اختبارات المباشر مجلد المنزل الحقيقي لديك.
- أصبح `pnpm test:live` الآن ينتقل افتراضيًا إلى وضع أكثر هدوءًا: يبقي خرج التقدم `[live] ...`، لكنه يكتم إشعار `~/.profile` الإضافي ويسكت سجلات تمهيد Gateway وضجيج Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفتاح API (خاص بالمزود): اضبط `*_API_KEYS` بتنسيق فاصلة/فاصلة منقوطة أو `*_API_KEY_1`، `*_API_KEY_2` (على سبيل المثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) أو تجاوزًا لكل تشغيل مباشر عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- خرج التقدم/Heartbeat:
  - تبث مجموعات المباشر الآن أسطر تقدم إلى stderr حتى تكون استدعاءات المزود الطويلة نشطة بصريًا حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطل `vitest.live.config.ts` اعتراض وحدة تحكم Vitest حتى تتدفق أسطر تقدم المزود/Gateway فورًا أثناء تشغّلات المباشر.
  - اضبط Heartbeat للنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat لـ Gateway/المسبار باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات Gateway / بروتوكول WS / الإقران: أضف `pnpm test:e2e`
- تصحيح "روبوتي متوقف" / إخفاقات خاصة بالمزود / استدعاء الأدوات: شغّل `pnpm test:live` مضيّقًا

## اختبارات المباشر (التي تلمس الشبكة)

لمصفوفة نماذج المباشر، وفحوصات دخانية لخلفية CLI، وفحوصات دخانية لـ ACP، وحاضنة خادم تطبيق Codex، وكل اختبارات المباشر لمزودي الوسائط (Deepgram وBytePlus وComfyUI والصور والموسيقى والفيديو وحاضنة الوسائط) - إضافة إلى التعامل مع بيانات الاعتماد لتشغّلات المباشر - راجع
[اختبار مجموعات المباشر](/ar/help/testing-live). ولقائمة التحقق المخصصة للتحديث
والتحقق من Plugin، راجع
[اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins).

## مشغلات Docker (فحوصات اختيارية لـ "يعمل في Linux")

تنقسم مشغلات Docker هذه إلى مجموعتين:

- مشغلات نماذج المباشر: يشغّل `test:docker:live-models` و`test:docker:live-gateway` ملف المباشر المطابق لمفتاح الملف التعريفي فقط داخل صورة Docker للمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب مجلد الإعداد المحلي ومساحة العمل لديك (واستيراد `~/.profile` إذا كان مركّبًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغلات Docker المباشرة افتراضيًا حدًا أصغر للفحص الدخاني حتى يظل المسح الكامل عبر Docker عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة تلك عندما
  تريد صراحةً المسح الشامل الأكبر.
- يبني `test:docker:all` صورة Docker المباشرة مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كحزمة npm بصيغة tarball عبر `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة المجرّدة هي فقط مشغل Node/Git لمسارات التثبيت/التحديث/اعتمادية Plugin؛ تركّب تلك المسارات حزمة tarball المبنية مسبقًا. تثبّت الصورة الوظيفية حزمة tarball نفسها في `/app` لمسارات وظائف التطبيق المبني. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في فتحات العمليات، بينما تمنع حدود الموارد مسارات المباشر الثقيلة، وتثبيت npm، والخدمات المتعددة من البدء كلها مرة واحدة. إذا كان مسار واحد أثقل من الحدود النشطة، فلا يزال بإمكان المجدول تشغيله عندما يكون التجمع فارغًا ثم يبقيه يعمل وحده حتى تتاح السعة مجددًا. الافتراضيات هي 10 فتحات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما يكون لدى مضيف Docker سعة إضافية. يجري المشغل فحصًا تمهيديًا لـ Docker افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في التشغّلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون دون بناء Docker أو تشغيله، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة واحتياجات الحزمة/الصورة وبيانات الاعتماد.
- `Package Acceptance` هو بوابة الحزمة الأصلية في GitHub لـ "هل تعمل حزمة tarball القابلة للتثبيت هذه كمنتج؟" يحل مرشح حزمة واحدًا من `source=npm` أو `source=ref` أو `source=url` أو `source=artifact`، ويرفعه باسم `package-under-test`، ثم يشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد حزمة tarball نفسها بدلًا من إعادة حزم المرجع المحدد. الملفات التعريفية مرتبة حسب الاتساع: `smoke` و`package` و`product` و`full`. راجع [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins) لعقد الحزمة/التحديث/Plugin، ومصفوفة النجاة من الترقية المنشورة، وافتراضيات الإصدار، وفرز الإخفاقات.
- تشغّل فحوصات البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يتتبع الحارس الرسم البياني المبني الثابت من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا استورد بدء التشغيل قبل التوجيه اعتماديات حزم مثل Commander أو واجهة موجه الأوامر، أو undici، أو التسجيل قبل توجيه الأمر؛ كما يبقي قطعة تشغيل Gateway المضمّنة ضمن الميزانية ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة. يغطي الفحص الدخاني للـ CLI المحزم أيضًا مساعدة الجذر، ومساعدة الإعداد، ومساعدة الطبيب، والحالة، ومخطط الإعداد، وأمر قائمة النماذج.
- توافق `Package Acceptance` القديم محدود عند `2026.4.25` (مع تضمين `2026.4.25-beta.*`). حتى ذلك الحد، تتحمل الحاضنة فقط فجوات بيانات وصفية لحزم مشحونة: إدخالات مخزون QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات التصحيح في تجهيز Git المشتق من tarball، وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة، وغياب استمرار سجل تثبيت السوق، وترحيل بيانات الإعداد الوصفية أثناء `plugins update`. للحزم بعد `2026.4.25`، تكون تلك المسارات إخفاقات صارمة.
- مشغلات الفحص الدخاني للحاويات: يقوم `test:docker:openwebui` و`test:docker:onboard` و`test:docker:npm-onboard-channel-agent` و`test:docker:update-channel-switch` و`test:docker:upgrade-survivor` و`test:docker:published-upgrade-survivor` و`test:docker:session-runtime-context` و`test:docker:agents-delete-shared-workspace` و`test:docker:gateway-network` و`test:docker:browser-cdp-snapshot` و`test:docker:mcp-channels` و`test:docker:pi-bundle-mcp-tools` و`test:docker:cron-mcp-cleanup` و`test:docker:plugins` و`test:docker:plugin-update` و`test:docker:plugin-lifecycle-matrix` و`test:docker:config-reload` بتمهيد حاوية حقيقية واحدة أو أكثر والتحقق من مسارات تكامل أعلى مستوى.

تقوم مشغلات Docker لنماذج المباشر أيضًا بربط منازل مصادقة CLI المطلوبة فقط (أو كل المنازل المدعومة عندما لا يكون التشغيل مضيّقًا)، ثم تنسخها إلى منزل الحاوية قبل التشغيل حتى يتمكن OAuth الخاص بـ CLI خارجي من تحديث الرموز دون تعديل مخزن مصادقة المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- دخان ربط ACP: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيًا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- دخان الواجهة الخلفية لـ CLI: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- دخان عُدّة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- دخان قابلية الملاحظة: `pnpm qa:otel:smoke` هو مسار فحص مصدر خاص بـ QA من نسخة مصدرية محلية. وهو ليس جزءًا عمدًا من مسارات إصدار Docker للحزمة لأن أرشيف npm يحذف QA Lab.
- دخان Open WebUI الحي: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، توليد هيكل كامل): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- دخان أرشيف npm للإعداد الأولي/القناة/الوكيل: يثبت `pnpm test:docker:npm-onboard-channel-agent` أرشيف OpenClaw المحزوم عالميًا في Docker، ويضبط OpenAI عبر إعداد أولي بمرجع بيئة بالإضافة إلى Telegram افتراضيًا، ويشغل doctor، ويشغل دورة وكيل OpenAI واحدة بمحاكاة. أعد استخدام أرشيف مبني مسبقًا باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة بناء المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` أو `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- دخان تبديل قناة التحديث: يثبت `pnpm test:docker:update-channel-switch` أرشيف OpenClaw المحزوم عالميًا في Docker، ويبدّل من حزمة `stable` إلى git `dev`، ويتحقق من استمرار القناة وعمل Plugin بعد التحديث، ثم يعود إلى حزمة `stable` ويفحص حالة التحديث.
- دخان ناجي الترقية: يثبت `pnpm test:docker:upgrade-survivor` أرشيف OpenClaw المحزوم فوق مُثبّتة مستخدم قديم غير نظيفة تحتوي على وكلاء، وتكوين قناة، وقوائم سماح Plugins، وحالة اعتماد Plugin قديمة، وملفات مساحة عمل/جلسة موجودة. يشغل تحديث الحزمة بالإضافة إلى doctor غير تفاعلي دون مزود حي أو مفاتيح قناة، ثم يبدأ Gateway عبر loopback ويفحص الحفاظ على التكوين/الحالة بالإضافة إلى ميزانيات بدء التشغيل/الحالة.
- دخان ناجي الترقية المنشورة: يثبت `pnpm test:docker:published-upgrade-survivor` الحزمة `openclaw@latest` افتراضيًا، ويزرع ملفات مستخدم موجود واقعية، ويضبط ذلك الخط الأساس بوصفة أوامر مخبوزة، ويتحقق من التكوين الناتج، ويحدّث ذلك التثبيت المنشور إلى أرشيف المرشح، ويشغل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر loopback ويفحص النوايا المضبوطة، والحفاظ على الحالة، وبدء التشغيل، و`/healthz`، و`/readyz`، وميزانيات حالة RPC. تجاوز خط أساس واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، واطلب من المجدول التجميعي توسيع خطوط أساس محلية دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`، ووسّع مُثبّتات تشبه المشكلات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues`؛ تتضمن مجموعة reported-issues الحالة `configured-plugin-installs` لإصلاح تثبيت Plugin خارجي من OpenClaw تلقائيًا. يعرّض Package Acceptance هذه القيم باسم `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`، ويفك رموز خطوط الأساس الوصفية مثل `last-stable-4` أو `all-since-2026.4.23`، وتوسّع Full Release Validation بوابة حزمة نقع الإصدار إلى `last-stable-4 2026.4.23 2026.5.2 2026.4.15` بالإضافة إلى `reported-issues`.
- دخان سياق وقت تشغيل الجلسة: يتحقق `pnpm test:docker:session-runtime-context` من استمرار نص سياق وقت التشغيل المخفي بالإضافة إلى إصلاح doctor لفروع إعادة كتابة المطالبات المكررة المتأثرة.
- دخان تثبيت Bun العالمي: يحزم `bash scripts/e2e/bun-global-install-smoke.sh` الشجرة الحالية، ويثبتها باستخدام `bun install -g` في مجلد منزل معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد مزودي الصور المضمّنين بدلًا من التعليق. أعد استخدام أرشيف مبني مسبقًا باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ بناء المضيف باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- دخان Docker للمثبّت: يتشارك `bash scripts/test-install-sh-docker.sh` ذاكرة npm مؤقتة واحدة عبر حاوياته الخاصة بالجذر والتحديث وdirect-npm. يفترض دخان التحديث npm `latest` بوصفه خط أساس stable قبل الترقية إلى أرشيف المرشح. تجاوزه محليًا باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، أو باستخدام إدخال `update_baseline_version` في سير عمل Install Smoke على GitHub. تحتفظ فحوصات المثبّت غير الجذرية بذاكرة npm مؤقتة معزولة حتى لا تخفي إدخالات الذاكرة المؤقتة المملوكة للجذر سلوك التثبيت المحلي للمستخدم. عيّن `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة root/update/direct-npm المؤقتة عبر عمليات الإعادة المحلية.
- يتخطى Install Smoke CI التحديث العالمي المباشر المكرر عبر npm باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل السكربت محليًا دون ذلك المتغير البيئي عندما تكون تغطية `npm install -g` المباشرة مطلوبة.
- دخان CLI لحذف وكلاء مساحة العمل المشتركة: يبني `pnpm test:docker:agents-delete-shared-workspace` (السكربت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) صورة Dockerfile الجذرية افتراضيًا، ويزرع وكيلين بمساحة عمل واحدة في مجلد منزل حاوية معزول، ويشغل `agents delete --json`، ويتحقق من JSON صالح بالإضافة إلى سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke باستخدام `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- تشبيك Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- دخان لقطة Browser CDP: يبني `pnpm test:docker:browser-cdp-snapshot` (السكربت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) صورة E2E من المصدر بالإضافة إلى طبقة Chromium، ويبدأ Chromium باستخدام CDP خام، ويشغل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي روابط URL، والعناصر القابلة للنقر المرقّاة بالمؤشر، ومراجع iframe، وبيانات الإطار الوصفية.
- انحدار الاستدلال الأدنى لـ OpenAI Responses web_search: يشغل `pnpm test:docker:openai-web-search-minimal` (السكربت: `scripts/e2e/openai-web-search-minimal-docker.sh`) خادم OpenAI مُحاكى عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط المزود ويفحص ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + دخان خام لإطار إشعار Claude): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة Pi (خادم MCP حقيقي عبر stdio + دخان سماح/منع ملف Pi المضمن): `pnpm test:docker:pi-bundle-mcp-tools` (السكربت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف Cron/الوكيل الفرعي لـ MCP (Gateway حقيقي + إزالة عملية MCP فرعية عبر stdio بعد تشغيلات cron معزولة ووكيل فرعي لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكربت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (دخان تثبيت/تحديث لمسار محلي، و`file:`، وسجل npm مع اعتماديات مرفوعة، ومراجع git متحركة، وClawHub شامل، وتحديثات marketplace، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)
  عيّن `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/وقت التشغيل الافتراضي الشامل باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم مُثبّتة ClawHub محليًا محكم العزل.
- دخان تحديث Plugin دون تغيير: `pnpm test:docker:plugin-update` (السكربت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- دخان مصفوفة دورة حياة Plugin: يثبت `pnpm test:docker:plugin-lifecycle-matrix` أرشيف OpenClaw المحزوم في حاوية عارية، ويثبت Plugin من npm، ويبدّل التمكين/التعطيل، ويرقيه ويخفضه عبر سجل npm محلي، ويحذف الشيفرة المثبتة، ثم يتحقق من أن إلغاء التثبيت ما زال يزيل الحالة القديمة مع تسجيل مقاييس RSS/CPU لكل مرحلة من دورة الحياة.
- دخان بيانات إعادة تحميل التكوين الوصفية: `pnpm test:docker:config-reload` (السكربت: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: يغطي `pnpm test:docker:plugins` دخان التثبيت/التحديث لمسار محلي، و`file:`، وسجل npm مع اعتماديات مرفوعة، ومراجع git متحركة، ومُثبّتات ClawHub، وتحديثات marketplace، وتمكين/فحص حزمة Claude. يغطي `pnpm test:docker:plugin-update` سلوك التحديث دون تغيير لـ Plugins المثبتة. يغطي `pnpm test:docker:plugin-lifecycle-matrix` تثبيت Plugin من npm مع تتبع الموارد، وتمكينه، وتعطيله، وترقيته، وخفضه، وإلغاء تثبيته عند فقدان الشيفرة.

للبناء المسبق وإعادة استخدام الصورة الوظيفية المشتركة يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بالمجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ذات أولوية عند تعيينها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكربتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات Docker الخاصة بـ QR والمثبّت بملفات Dockerfiles الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلًا من وقت تشغيل التطبيق المبني المشترك.

تقوم مشغّلات Docker للنماذج الحية أيضًا بربط التحميل للنسخة الحالية من المستودع بوضع القراءة فقط وتهيئتها داخل دليل عمل مؤقت داخل الحاوية. يحافظ هذا على صورة وقت التشغيل خفيفة، مع الاستمرار في تشغيل Vitest على المصدر/الإعدادات المحلية الدقيقة لديك. تتجاوز خطوة التهيئة ذاكرات التخزين المؤقت المحلية الكبيرة فقط ومخرجات بناء التطبيقات مثل `.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` المحلية للتطبيق أو أدلة مخرجات Gradle، حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ عناصر خاصة بالجهاز.
تضبط أيضًا `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات Gateway الحية عمّال قنوات Telegram/Discord/إلخ الحقيقيين داخل الحاوية.
ما يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر أيضًا
`OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق أو استثناء تغطية Gateway الحية من ذلك مسار Docker.
`test:docker:openwebui` هو فحص توافق بمستوى أعلى: يبدأ حاوية Gateway من OpenClaw مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI، ويبدأ حاوية Open WebUI مثبتة الإصدار مقابل ذلك Gateway، ويسجّل الدخول عبر Open WebUI، ويتحقق من أن `/api/models` يعرّض `openclaw/default`، ثم يرسل طلب محادثة حقيقيًا عبر وكيل `/api/chat/completions` في Open WebUI.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب صورة Open WebUI وقد يحتاج Open WebUI إلى إنهاء إعداد بدء التشغيل البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج حي قابلًا للاستخدام، و`OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيًا) هو الطريقة الأساسية لتوفيره في التشغيلات داخل Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عن قصد ولا يحتاج إلى حساب Telegram أو Discord أو iMessage حقيقي. يبدأ حاوية Gateway مهيأة ببذور، ويبدأ حاوية ثانية تشغّل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءات النصوص، وبيانات تعريف المرفقات، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة + الأذونات بأسلوب Claude عبر جسر MCP الحقيقي عبر stdio. يفحص تحقق الإشعارات إطارات MCP الخام عبر stdio مباشرة حتى يتحقق الفحص مما يصدره الجسر فعليًا، وليس فقط ما يحدث أن يعرضه SDK عميل معيّن.
`test:docker:pi-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج حي. يبني صورة Docker للمستودع، ويبدأ خادم فحص MCP حقيقيًا عبر stdio داخل الحاوية، ويجسّد ذلك الخادم عبر وقت تشغيل MCP المضمن في حزمة Pi، وينفّذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان بأدوات `bundle-mcp` بينما يقوم `minimal` و`tools.deny: ["bundle-mcp"]` بترشيحها.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج حي. يبدأ Gateway مهيأ ببذور مع خادم فحص MCP حقيقي عبر stdio، ويشغّل دورة cron معزولة ودورة فرعية لمرة واحدة عبر `/subagents spawn`، ثم يتحقق من خروج عملية MCP الفرعية بعد كل تشغيل.

فحص يدوي لمسار ACP بلغة طبيعية للثريدات (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- أبقِ هذا السكربت لسير عمل الانحدار/التصحيح. قد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه ثريدات ACP، لذا لا تحذفه.

متغيرات البيئة المفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) يتم تحميله إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) يتم تحميله إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) يتم تحميله إلى `/home/node/.profile` ويتم تحميل مصدره قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المحمّلة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعدادات/مساحة عمل مؤقتة ومن دون تحميلات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) يتم تحميله إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- يتم تحميل أدلة/ملفات مصادقة CLI الخارجية ضمن `$HOME` بوضع القراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - تقوم تشغيلات المزوّدين المضيّقة بتحميل الأدلة/الملفات المطلوبة فقط والمستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لترشيح المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لإعادات التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن الملف الشخصي (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرّضه Gateway لفحص Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز مطالبة فحص nonce المستخدمة بواسطة فحص Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبت

## فحص سلامة المستندات

شغّل فحوصات المستندات بعد تعديلات المستندات: `pnpm check:docs`.
شغّل تحقق روابط Mintlify الكامل للمرساة عندما تحتاج أيضًا إلى فحوصات عناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه انحدارات "خط أنابيب حقيقية" من دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة agent): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway الإرشادي (WS `wizard.start`/`wizard.next`، يكتب الإعدادات + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية agent (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية agent":

- استدعاء أدوات وهمي عبر Gateway الحقيقي + حلقة agent (`src/gateway/gateway.test.ts`).
- تدفقات المعالج الإرشادي من البداية إلى النهاية التي تتحقق من توصيل الجلسة وتأثيرات الإعدادات (`src/gateway/gateway.test.ts`).

ما يزال مفقودًا لـ Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في المطالبة، هل يختار agent الـ Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ agent `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الدورات تتحقق من ترتيب الأدوات، واستمرار سجل الجلسة، وحدود sandbox.

يجب أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين وهميين للتحقق من استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وتوصيل الجلسة.
- مجموعة صغيرة من السيناريوهات المركزة على Skills (الاستخدام مقابل التجنب، الحواجز، حقن المطالبات).
- تقييمات حية اختيارية (اختيارية ومقيدة بمتغيرات البيئة) فقط بعد وجود المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلين يلتزمان بعقد الواجهة الخاص بهما. تمر على كل Plugins المكتشفة وتشغّل مجموعة من تأكيدات الشكل والسلوك. يتجاوز مسار وحدات `pnpm test` الافتراضي عمدًا ملفات نقاط الالتقاء المشتركة والفحوصات هذه؛ شغّل أوامر العقود صراحة عندما تلمس أسطح القنوات أو المزوّدين المشتركة.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

موجودة في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي للـ Plugin (id، name، capabilities)
- **setup** - عقد معالج الإعداد الإرشادي
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرّف الثريد
- **directory** - واجهة API للدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

موجودة في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القنوات
- **registry** - شكل سجل Plugins

### عقود المزوّدين

موجودة في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة API لفهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد الإرشادي

### متى تُشغّل

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة أو تعديل قناة أو Plugin مزوّد
- بعد إعادة هيكلة تسجيل أو اكتشاف Plugin

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة الانحدارات (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج اكتُشفت في التشغيل الحي:

- أضف انحدارًا آمنًا لـ CI إن أمكن (مزوّد وهمي/بديل، أو التقاط تحويل شكل الطلب الدقيق)
- إذا كان الأمر بطبيعته حيًا فقط (حدود المعدل، سياسات المصادقة)، فاجعل الاختبار الحي ضيقًا واختياريًا عبر متغيرات البيئة
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ تحويل/إعادة تشغيل طلب المزوّد → اختبار نماذج مباشر
  - خطأ مسار Gateway للجلسة/السجل/الأدوات → فحص Gateway حي أو اختبار Gateway وهمي آمن لـ CI
- حاجز traversal لـ SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` يستمد هدفًا واحدًا عيناتيًا لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرّفات exec ذات مقاطع traversal.
  - إذا أضفت عائلة أهداف SecretRef جديدة بـ `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند معرّفات الأهداف غير المصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذات صلة

- [اختبار التشغيل الحي](/ar/help/testing-live)
- [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)
- [CI](/ar/ci)
