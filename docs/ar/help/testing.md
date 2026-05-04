---
read_when:
    - تشغيل الاختبارات محليًا أو في بيئة التكامل المستمر
    - إضافة اختبارات انحدار لأخطاء النماذج/المزوّدين
    - تصحيح أخطاء سلوك Gateway + الوكيل
summary: 'حزمة الاختبار: مجموعات اختبارات الوحدة وe2e والاختبارات الحية، ومشغلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-05-04T07:08:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

يحتوي OpenClaw على ثلاث مجموعات Vitest (الوحدة/التكامل، e2e، الحية) ومجموعة صغيرة
من مشغلات Docker. هذا المستند هو دليل "كيف نختبر":

- ما تغطيه كل مجموعة (وما تتعمد _عدم_ تغطيته).
- الأوامر التي يجب تشغيلها لسير العمل الشائع (محلياً، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/الموفرين.
- كيف تضيف اختبارات رجعية لمشكلات النماذج/الموفرين الواقعية.

<Note>
**مكدس QA (qa-lab وqa-channel ومسارات النقل الحية)** موثق بشكل منفصل:

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) — البنية، سطح الأوامر، تأليف السيناريوهات.
- [Matrix QA](/ar/concepts/qa-matrix) — مرجع لـ `pnpm openclaw qa matrix`.
- [قناة QA](/ar/channels/qa-channel) — Plugin النقل الاصطناعي المستخدم بواسطة السيناريوهات المدعومة من المستودع.

تغطي هذه الصفحة تشغيل مجموعات الاختبار العادية ومشغلات Docker/Parallels. يسرد قسم المشغلات الخاصة بـ QA أدناه ([المشغلات الخاصة بـ QA](#qa-specific-runners)) استدعاءات `qa` الملموسة ويشير مرة أخرى إلى المراجع أعلاه.
</Note>

## بدء سريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع للمجموعة الكاملة محلياً على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- الاستهداف المباشر للملفات يوجه الآن مسارات الإضافات/القنوات أيضاً: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولاً عندما تعمل على فشل واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بآلة Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح موفرين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة الحية (النماذج + فحوصات أداة/صورة Gateway): `pnpm test:live`
- استهدف ملفاً حياً واحداً بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- تقارير أداء وقت التشغيل: شغّل `OpenClaw Performance` مع
  `live_gpt54=true` لدورة وكيل حقيقية لـ `openai/gpt-5.4` أو
  `deep_profile=true` لآثار Kova الخاصة بـ CPU/الذاكرة/التتبع. تنشر التشغيلات اليومية المجدولة
  عناصر مسارات الموفر الوهمي، والملف العميق، وGPT 5.4 إلى
  `openclaw/clawgrit-reports` عند تكوين `CLAWGRIT_REPORTS_TOKEN`. كما
  يتضمن تقرير الموفر الوهمي أرقام تشغيل Gateway على مستوى المصدر، والذاكرة،
  وضغط Plugin، وحلقة hello متكررة بنموذج وهمي، وبدء تشغيل CLI.
- مسح النماذج الحية عبر Docker: `pnpm test:docker:live-models`
  - يشغل كل نموذج محدد دورة نصية بالإضافة إلى فحص صغير بنمط قراءة ملف.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغل أيضاً دورة صورة صغيرة.
    عطّل الفحوصات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل فشل الموفر.
  - تغطية CI: يستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومي و
    `OpenClaw Release Checks` اليدوي سير العمل القابل لإعادة الاستخدام الحي/E2E مع
    `include_live_suites: true`، والذي يتضمن مهام مصفوفة منفصلة للنماذج الحية عبر Docker
    مجزأة حسب الموفر.
  - لإعادة تشغيل CI مركزة، شغّل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و`live_models_only: true`.
  - أضف أسرار موفرين جديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    بالإضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/الخاصة بالإصدار.
- فحص دخان محادثة Codex الأصلية المرتبطة: `pnpm test:docker:live-codex-bind`
  - يشغل مساراً حياً عبر Docker ضد مسار خادم تطبيق Codex، ويربط رسالة Slack DM اصطناعية
    باستخدام `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من مرور رد عادي ومرفق صورة
    عبر ربط Plugin الأصلي بدلاً من ACP.
- فحص دخان حاضنة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغل دورات وكيل Gateway عبر حاضنة خادم تطبيق Codex المملوكة لـ Plugin،
    ويتحقق من `/codex status` و`/codex models`، ويمارس افتراضياً فحوصات الصورة،
    وCron MCP، والوكيل الفرعي، وGuardian. عطّل فحص الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل أعطال أخرى في خادم تطبيق Codex.
    لفحص وكيل فرعي مركز، عطّل الفحوصات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد فحص الوكيل الفرعي ما لم يتم تعيين
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- فحص دخان أمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري بحزام ومساند لسطح أمر الإنقاذ في قناة الرسائل.
    يمارس `/crestodian status`، ويضع تغيير نموذج مستمراً في الطابور،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/التكوين.
- فحص دخان مخطط Crestodian عبر Docker: `pnpm test:docker:crestodian-planner`
  - يشغل Crestodian في حاوية بلا تكوين مع Claude CLI وهمي على `PATH`
    ويتحقق من أن رجوع المخطط التقريبي يترجم إلى كتابة تكوين مكتوبة ومدققة.
- فحص دخان التشغيل الأول لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من دليل حالة OpenClaw فارغ، ويوجه `openclaw` العاري إلى
    Crestodian، ويطبق كتابات الإعداد/النموذج/الوكيل/Discord Plugin + SecretRef،
    ويتحقق من التكوين، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضاً في QA Lab بواسطة
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- فحص دخان تكلفة Moonshot/Kimi: مع تعيين `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مع `moonshot/kimi-k2.6`. تحقق من أن JSON يبلّغ عن Moonshot/K2.6 وأن
  نص المساعد يخزن `usage.cost` الموحّد.

<Tip>
عندما تحتاج إلى حالة فشل واحدة فقط، فضّل تضييق الاختبارات الحية عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## المشغلات الخاصة بـ QA

تقع هذه الأوامر بجانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغل CI ‏QA Lab في سير عمل مخصصة. التكافؤ الوكيلي متداخل تحت
`QA-Lab - All Lanes` والتحقق من الإصدار، وليس سير عمل PR مستقلاً.
يجب أن يستخدم التحقق الواسع `Full Release Validation` مع
`rerun_group=qa-parity` أو مجموعة QA الخاصة بفحوصات الإصدار. يعمل `QA-Lab - All Lanes`
ليلاً على `main` ومن التشغيل اليدوي مع مسار التكافؤ الوهمي، ومسار Matrix الحي،
ومسار Telegram الحي المُدار بواسطة Convex، ومسار Discord الحي المُدار بواسطة Convex
كمهام متوازية. تمرر فحوصات QA المجدولة وفحوصات الإصدار خيار Matrix
`--profile fast` صراحة، بينما تظل القيمة الافتراضية لـ Matrix CLI وإدخال سير العمل اليدوي
`all`؛ ويمكن للتشغيل اليدوي تقسيم `all` إلى مهام `transport`،
و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`. يشغل `OpenClaw Release
Checks` التكافؤ بالإضافة إلى مسارات Matrix السريعة وTelegram قبل موافقة الإصدار،
باستخدام `mock-openai/gpt-5.5` لفحوصات نقل الإصدار كي تبقى
حتمية وتتجنب بدء تشغيل Plugin الموفر العادي. تعطل Gateways النقل الحية هذه
بحث الذاكرة؛ ويظل سلوك الذاكرة مغطى بواسطة مجموعات تكافؤ QA.

تستخدم أجزاء الوسائط الحية للإصدار الكامل
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، والذي يحتوي بالفعل على
`ffmpeg` و`ffprobe`. تستخدم أجزاء النماذج/الخلفيات الحية عبر Docker صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
التزام محدد، ثم تسحبها باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلاً من إعادة البناء
داخل كل جزء.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة بالمستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضياً باستخدام عمّال
    Gateway معزولين. يكون `qa-channel` افتراضياً بتزامن 4 (محدوداً بعدد
    السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد
    العمّال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد الحصول على القطع الأثرية دون رمز خروج فاشل.
  - يدعم أوضاع الموفّر `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم موفّر محلياً مدعوماً بـ AIMock لتغطية تجريبية
    للبيانات المثبتة ومحاكاة البروتوكول دون استبدال مسار
    `mock-openai` الواعي بالسيناريوهات.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل قياس بدء تشغيل Gateway إضافة إلى حزمة صغيرة من سيناريوهات QA Lab الوهمية
    (`channel-chat-baseline` و`memory-failure-fallback`
    و`gateway-restart-inflight-run`) ويكتب ملخصاً مدمجاً لملاحظات CPU
    ضمن `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم افتراضياً فقط ملاحظات CPU الساخنة المستمرة (`--cpu-core-warn`
    إضافة إلى `--hot-wall-warn-ms`)، لذا تُسجّل اندفاعات بدء التشغيل القصيرة
    كمقاييس دون أن تبدو كانحدار تثبيت Gateway الممتد لدقائق.
  - يستخدم قطع `dist` المبنية؛ شغّل البناء أولاً عندما لا تحتوي نسخة العمل
    بالفعل على مخرجات تشغيلية حديثة.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل حزمة QA نفسها داخل آلة Linux افتراضية مؤقتة من Multipass.
  - يحافظ على سلوك اختيار السيناريوهات نفسه مثل `qa suite` على المضيف.
  - يعيد استخدام رايات اختيار الموفّر/النموذج نفسها مثل `qa suite`.
  - تمرر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح الموفّر المستندة إلى البيئة، ومسار إعداد موفّر QA الحي، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى أدلة الإخراج تحت جذر المستودع حتى يتمكن الضيف من الكتابة عائداً عبر
    مساحة العمل المركبة.
  - يكتب تقرير QA والملخص المعتادين إضافة إلى سجلات Multipass ضمن
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA بأسلوب المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني أرشيف npm من نسخة العمل الحالية، ويثبته عالمياً في
    Docker، ويشغّل تهيئة غير تفاعلية لمفتاح OpenAI API، ويضبط Telegram
    افتراضياً، ويتحقق من أن تشغيل Plugin المعبأ يُحمّل دون إصلاح اعتماديات
    بدء التشغيل، ويشغّل doctor، ويشغّل دورة وكيل محلية واحدة مقابل
    نقطة نهاية OpenAI وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ نفسه
    مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل اختبار دخان Docker حتمياً للتطبيق المبني لسجلات سياق التشغيل المضمنة.
    يتحقق من أن سياق تشغيل OpenClaw المخفي يُحفظ كرسالة مخصصة غير معروضة بدلاً من تسريبه
    إلى دورة المستخدم المرئية، ثم يزرع ملف JSONL لجلسة معطوبة متأثرة ويتحقق من أن
    `openclaw doctor --fix` يعيد كتابته إلى الفرع النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبت حزمة OpenClaw مرشحة في Docker، ويشغّل تهيئة الحزمة المثبتة،
    ويضبط Telegram عبر CLI المثبت، ثم يعيد استخدام مسار QA الحي لـ Telegram
    مع تلك الحزمة المثبتة باعتبارها Gateway النظام قيد الاختبار.
  - يكون الافتراضي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛ عيّن
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار أرشيف محلي محلول بدلاً من
    التثبيت من السجل.
  - يستخدم اعتمادات بيئة Telegram نفسها أو مصدر اعتمادات Convex نفسه مثل
    `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، عيّن
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` إضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. إذا كان
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI،
    يختار مغلّف Docker ‏Convex تلقائياً.
  - يتحقق المغلّف من بيئة اعتمادات Telegram أو Convex على المضيف قبل
    أعمال بناء/تثبيت Docker. عيّن `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    فقط عند تصحيح إعداد ما قبل الاعتماد عمداً.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` القيمة المشتركة
    `OPENCLAW_QA_CREDENTIAL_ROLE` لهذا المسار فقط.
  - يعرّض GitHub Actions هذا المسار كسير عمل يدوي للمشرفين باسم
    `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة
    `qa-live-shared` واستئجارات اعتمادات Convex CI.
- يعرّض GitHub Actions أيضاً `Package Acceptance` كإثبات منتج جانبي التشغيل
  مقابل حزمة مرشحة واحدة. يقبل مرجعاً موثوقاً، أو مواصفة npm منشورة،
  أو URL لأرشيف HTTPS مع SHA-256، أو قطعة أرشيف من تشغيل آخر، ويرفع
  `openclaw-current.tgz` الموحّد باسم `package-under-test`، ثم يشغّل
  مجدول Docker E2E الحالي بملفات تعريف مسارات smoke أو package أو product أو full أو custom.
  عيّن `telegram_mode=mock-openai` أو `live-frontier` لتشغيل سير عمل
  Telegram QA مقابل قطعة `package-under-test` نفسها.
  - أحدث إثبات منتج beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات URL الأرشيف الدقيق ملخصاً:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- يحمّل إثبات القطعة أرشيفاً من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - يحزم ويبثّت بناء OpenClaw الحالي في Docker، ويبدأ Gateway
    مع ضبط OpenAI، ثم يفعّل القنوات/Plugins المضمّنة عبر تعديلات الإعداد.
  - يتحقق من أن اكتشاف الإعداد يترك Plugins القابلة للتنزيل غير المضبوطة غائبة،
    وأن أول إصلاح doctor مضبوط يثبت كل Plugin مفقود قابل للتنزيل صراحة،
    وأن إعادة تشغيل ثانية لا تشغّل إصلاح اعتماديات مخفياً.
  - يثبت أيضاً خط أساس npm أقدم معروفاً، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن doctor اللاحق للتحديث في المرشح
    ينظف بقايا اعتماديات Plugin القديمة دون إصلاح postinstall من جهة عدة الاختبار.
- `pnpm test:parallels:npm-update`
  - يشغّل اختبار دخان تحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. تثبت كل
    منصة محددة أولاً حزمة خط الأساس المطلوبة، ثم تشغّل أمر
    `openclaw update` المثبت في الضيف نفسه وتتحقق من
    الإصدار المثبت، وحالة التحديث، وجاهزية Gateway، ودورة وكيل محلية واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux` أثناء
    التكرار على ضيف واحد. استخدم `--json` لمسار قطعة الملخص
    وحالة كل مسار.
  - يستخدم مسار OpenAI ‏`openai/gpt-5.5` لإثبات دورة الوكيل الحية افتراضياً.
    مرّر `--model <provider/model>` أو عيّن
    `OPENCLAW_PARALLELS_OPENAI_MODEL` عند التحقق عمداً من نموذج OpenAI آخر.
  - غلّف التشغيلات المحلية الطويلة بمهلة مضيف حتى لا تستهلك حالات توقف نقل
    Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسارات متداخلة ضمن `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن المغلّف الخارجي عالق.
  - قد يستغرق تحديث Windows من 10 إلى 15 دقيقة في أعمال doctor بعد التحديث وتحديث الحزمة
    على ضيف بارد؛ يظل ذلك سليماً عندما يكون سجل npm المتداخل للتصحيح
    يتقدم.
  - لا تشغّل هذا المغلّف التجميعي بالتوازي مع مسارات دخان Parallels الفردية
    لنظام macOS أو Windows أو Linux. فهي تشترك في حالة الآلة الافتراضية وقد تتصادم عند
    استعادة اللقطة أو تقديم الحزمة أو حالة Gateway في الضيف.
  - يشغّل إثبات ما بعد التحديث سطح Plugin المضمّن المعتاد لأن
    واجهات القدرات مثل الكلام وتوليد الصور وفهم الوسائط
    تُحمّل عبر APIs التشغيل المضمّنة حتى عندما تتحقق دورة الوكيل نفسها
    من رد نصي بسيط فقط.

- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم موفّر AIMock المحلي لاختبار دخان البروتوكول المباشر.
- `pnpm openclaw qa matrix`
  - يشغّل مسار Matrix QA الحي مقابل خادم Tuwunel منزلي مؤقت مدعوم بـ Docker. نسخة المصدر فقط — لا تشحن التثبيتات المعبأة `qa-lab`.
  - CLI الكامل، وكتالوج الملف الشخصي/السيناريو، ومتغيرات البيئة، وتخطيط القطع: [Matrix QA](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار Telegram QA الحي مقابل مجموعة خاصة حقيقية باستخدام رموز بوت المشغّل وبوت النظام قيد الاختبار من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` للاعتمادات المجمعة المشتركة. استخدم وضع البيئة افتراضياً، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في الاستئجارات المجمعة.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما تريد
    القطع دون رمز خروج فاشل.
  - يتطلب بوتين مميزين في المجموعة الخاصة نفسها، مع كشف بوت النظام قيد الاختبار لاسم مستخدم Telegram.
  - للملاحظة المستقرة بين البوتات، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا البوتين وتأكد من أن بوت المشغّل يستطيع مراقبة حركة بوتات المجموعة.
  - يكتب تقرير Telegram QA وملخصاً وقطعة الرسائل المرصودة ضمن `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال المشغّل إلى رد النظام قيد الاختبار المرصود.

تشترك مسارات النقل الحي في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ تعيش مصفوفة تغطية كل مسار في [نظرة عامة على QA ← تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). يُعد `qa-channel` الحزمة الاصطناعية الواسعة وليس جزءاً من تلك المصفوفة.

### اعتمادات Telegram المشتركة عبر Convex (v1)

عند تمكين `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل QA lab على استئجار حصري من مجمع مدعوم بـ Convex، ويرسل Heartbeat
لذلك الاستئجار أثناء تشغيل المسار، ويحرر الاستئجار عند الإيقاف.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- اختيار دور الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - افتراضي البيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (يكون افتراضياً `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL من Convex عبر `http://` للـ loopback للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` ‏`https://` في التشغيل العادي.

تتطلب أوامر إدارة المشرفين (إضافة/إزالة/سرد المجمع)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديداً.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل التشغيلات الحية للتحقق من عنوان URL لموقع Convex، وأسرار الوسيط،
وبادئة endpoint، ومهلة HTTP، وإمكانية الوصول إلى admin/list من دون طباعة
قيم الأسرار. استخدم `--json` لإخراج قابل للقراءة آليًا في السكربتات وأدوات CI.

عقد endpoint الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - النفاد/قابل لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- يجب أن يكون `groupId` سلسلة نصية رقمية لمعرف دردشة Telegram.
- يتحقق `admin/add` من هذا الشكل عند `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

### إضافة قناة إلى QA

توجد أسماء البنية ومساعدي السيناريو لمحولات القنوات الجديدة في [نظرة عامة على QA → إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: تنفيذ مشغل النقل على وصلة مضيف `qa-lab` المشتركة، والتصريح عن `qaRunners` في بيان Plugin، والتركيب كـ `openclaw qa <runner>`، وتأليف السيناريوهات ضمن `qa/scenarios/`.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكر في المجموعات على أنها «واقعية متزايدة» (ومعها زيادة في الهشاشة/التكلفة):

### الوحدة / التكامل (افتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم التشغيلات غير المستهدفة مجموعة تقسيم `vitest.full-*.config.ts` وقد توسع التقسيمات متعددة المشاريع إلى إعدادات لكل مشروع من أجل الجدولة المتوازية
- الملفات: قوائم الوحدة/النواة ضمن `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`؛ تعمل اختبارات وحدة الواجهة في تقسيم `unit-ui` المخصص
- النطاق:
  - اختبارات وحدة صرفة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، التوجيه، الأدوات، التحليل، الإعداد)
  - تراجعات حتمية للأخطاء المعروفة
- التوقعات:
  - يعمل في CI
  - لا يتطلب مفاتيح حقيقية
  - يجب أن يكون سريعًا ومستقرًا
  - يجب أن تثبت اختبارات المحلل ومحمل السطح العام سلوك الرجوع الواسع لـ `api.js` و
    `runtime-api.js` باستخدام تجهيزات Plugin صغيرة مولدة، وليس
    واجهات API لمصدر Plugin المجمعة الحقيقية. تنتمي تحميلات API الحقيقية لـ Plugin إلى
    مجموعات العقد/التكامل المملوكة لـ Plugin.

<AccordionGroup>
  <Accordion title="المشاريع، والتقسيمات، والمسارات محددة النطاق">

    - تشغل `pnpm test` غير المستهدفة اثني عشر إعداد تقسيم أصغر (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) بدلًا من عملية مشروع جذر أصلية عملاقة واحدة. يقلل هذا ذروة RSS على الأجهزة المحملة ويتجنب أن تستهلك أعمال الرد التلقائي/Plugin المجموعات غير المرتبطة.
    - ما زال `pnpm test --watch` يستخدم رسم مشاريع `vitest.config.ts` الجذري الأصلي، لأن حلقة مراقبة متعددة التقسيمات ليست عملية.
    - توجه `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر المسارات محددة النطاق أولًا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع كلفة بدء مشروع الجذر كاملة.
    - توسع `pnpm test:changed` مسارات git المتغيرة إلى مسارات رخيصة محددة النطاق افتراضيًا: تعديلات اختبار مباشرة، وملفات `*.test.ts` شقيقة، وتعيينات مصدر صريحة، ومعتمدات محلية من رسم الاستيراد. لا تؤدي تعديلات الإعداد/التهيئة/الحزمة إلى تشغيل واسع للاختبارات إلا إذا استخدمت صراحة `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هو بوابة الفحص المحلي الذكية العادية للعمل الضيق. يصنف الاختلاف إلى النواة، واختبارات النواة، وPlugins، واختبارات Plugin، والتطبيقات، والوثائق، وبيانات الإصدار الوصفية، وأدوات Docker الحية، والأدوات، ثم يشغل أوامر فحص الأنواع والLint والحراسة المطابقة. لا يشغل اختبارات Vitest؛ استخدم `pnpm test:changed` أو `pnpm test <target>` الصريح لإثبات الاختبار. تشغل زيادات الإصدار التي تقتصر على بيانات الإصدار الوصفية فحوصات مستهدفة للإصدار/الإعداد/اعتمادات الجذر، مع حارس يرفض تغييرات الحزمة خارج حقل الإصدار في المستوى الأعلى.
    - تشغل تعديلات مشغل Docker ACP الحي فحوصات مركزة: صياغة shell لسكربتات مصادقة Docker الحية وتشغيلًا تجريبيًا جافًا لمجدول Docker الحي. لا تُضمّن تغييرات `package.json` إلا عندما يكون الاختلاف محدودًا بـ `scripts["test:docker:live-*"]`؛ ما زالت تعديلات الاعتمادات، والتصدير، والإصدار، وأسطح الحزمة الأخرى تستخدم الحراس الأوسع.
    - تمر اختبارات الوحدة خفيفة الاستيراد من الوكلاء، والأوامر، وPlugins، ومساعدي الرد التلقائي، و`plugin-sdk`، ومناطق الأدوات الصرفة المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ تبقى الملفات ذات الحالة/الثقيلة وقت التشغيل على المسارات الحالية.
    - تعين ملفات مصدر مساعد محددة من `plugin-sdk` و`commands` أيضًا تشغيلات وضع التغيير إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، فتتجنب تعديلات المساعدين إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
    - لدى `auto-reply` حاويات مخصصة لمساعدي النواة في المستوى الأعلى، واختبارات تكامل `reply.*` في المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. يقسم CI أيضًا الشجرة الفرعية للرد إلى تقسيمات agent-runner، وdispatch، وcommands/state-routing كي لا تمتلك حاوية واحدة كثيفة الاستيراد ذيل Node الكامل.
    - يتخطى CI العادي للطلبات/الرئيسي عمدًا المسح الدفعي لـ Plugin وتقسيم `agentic-plugins` الخاص بالإصدار فقط. ترسل عملية Full Release Validation سير عمل الابن `Plugin Prerelease` المنفصل لهذه المجموعات الثقيلة بـ Plugin/Plugins على مرشحي الإصدار.

  </Accordion>

  <Accordion title="تغطية المشغل المضمن">

    - عندما تغير مدخلات اكتشاف أداة الرسائل أو سياق وقت تشغيل
      Compaction، أبقِ مستويي التغطية.
    - أضف تراجعات مساعد مركزة لحدود التوجيه والتطبيع الصرفة.
    - حافظ على سلامة مجموعات تكامل المشغل المضمن:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه المجموعات من أن المعرفات محددة النطاق وسلوك Compaction ما زالا يتدفقان
      عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ اختبارات المساعد فقط
      ليست بديلًا كافيًا عن مسارات التكامل هذه.

  </Accordion>

  <Accordion title="مجمع Vitest وافتراضيات العزل">

    - يفترض إعداد Vitest الأساسي `threads`.
    - يثبت إعداد Vitest المشترك `isolate: false` ويستخدم
      المشغل غير المعزول عبر مشاريع الجذر وe2e والإعدادات الحية.
    - يحتفظ مسار واجهة الجذر بإعداد `jsdom` والمحسن الخاص به، لكنه يعمل أيضًا على
      المشغل غير المعزول المشترك.
    - يرث كل تقسيم `pnpm test` افتراضيات `threads` + `isolate: false`
      نفسها من إعداد Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node التابعة لـ Vitest
      افتراضيًا لتقليل تبدل ترجمة V8 أثناء التشغيلات المحلية الكبيرة.
      اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8
      القياسي.

  </Accordion>

  <Accordion title="التكرار المحلي السريع">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يطلقها اختلاف ما.
    - خطاف ما قبل الالتزام مخصص للتنسيق فقط. يعيد تنظيم الملفات المنسقة ولا
      يشغل Lint أو فحص الأنواع أو الاختبارات.
    - شغل `pnpm check:changed` صراحة قبل التسليم أو الدفع عندما
      تحتاج إلى بوابة الفحص المحلي الذكية.
    - توجه `pnpm test:changed` عبر مسارات رخيصة محددة النطاق افتراضيًا. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر الوكيل
      أن تعديل مشغل أو إعداد أو حزمة أو عقد يحتاج حقًا إلى تغطية
      Vitest أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه
      نفسه، لكن مع حد أعلى للعمال.
    - التحجيم التلقائي للعمال المحليين محافظ عمدًا ويتراجع
      عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، لذلك تسبب تشغيلات
      Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
    - يضع إعداد Vitest الأساسي علامة على ملفات المشاريع/الإعداد كـ
      `forceRerunTriggers` كي تبقى إعادات التشغيل في وضع التغيير صحيحة عندما تتغير
      توصيلات الاختبار.
    - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعلًا على المضيفين
      المدعومين؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت
      موقع ذاكرة تخزين مؤقت صريحًا واحدًا للتنميط المباشر.

  </Accordion>

  <Accordion title="تصحيح الأداء">

    - يفعّل `pnpm test:perf:imports` تقرير مدد استيراد Vitest بالإضافة إلى
      مخرجات تفصيل الاستيراد.
    - يحدد `pnpm test:perf:imports:changed` نطاق عرض التنميط نفسه إلى
      الملفات التي تغيرت منذ `origin/main`.
    - تُكتب بيانات توقيت التقسيمات إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم تشغيلات الإعداد الكامل مسار الإعداد كمفتاح؛ وتلحق تقسيمات CI
      ذات أنماط التضمين اسم التقسيم كي يمكن تتبع التقسيمات المرشحة
      بشكل منفصل.
    - عندما يبقى اختبار ساخن واحد يقضي معظم وقته في استيرادات البدء،
      أبقِ الاعتمادات الثقيلة خلف وصلة `*.runtime.ts` محلية ضيقة و
      حاكِ تلك الوصلة مباشرة بدلًا من الاستيراد العميق لمساعدي وقت التشغيل فقط
      لتمريرهم عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` تشغيل
      `test:changed` الموجه مقابل مسار مشروع الجذر الأصلي لذلك الاختلاف
      الملتزم، ويطبع زمن الجدار بالإضافة إلى أقصى RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة الحالية
      غير النظيفة بتوجيه قائمة الملفات المتغيرة عبر
      `scripts/test-projects.mjs` وإعداد Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي
      لكلفة بدء Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغل من أجل
      مجموعة الوحدة مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، مجبر على عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا بحلقة رجوع مع تفعيل التشخيصات افتراضيًا
  - يدفع تبدل رسائل Gateway والذاكرة والحمولات الكبيرة الاصطناعية عبر مسار أحداث التشخيص
  - يستعلم عن `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدي استمرار حزمة استقرار التشخيص
  - يؤكد أن المسجل يبقى محدودًا، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق قوائم الانتظار لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج إلى مفاتيح
  - مسار ضيق لمتابعة تراجعات الاستقرار، وليس بديلًا عن مجموعة Gateway الكاملة

### E2E (دخان Gateway)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts`، و`test/**/*.e2e.test.ts`، واختبارات E2E الخاصة بـ Plugin المضمنة ضمن `extensions/`
- الإعدادات الافتراضية لوقت التشغيل:
  - تستخدم Vitest `threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - تستخدم عمالًا تكيفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - تعمل في الوضع الصامت افتراضيًا لتقليل عبء إدخال/إخراج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تمكين مخرجات وحدة التحكم التفصيلية.
- النطاق:
  - سلوك Gateway متعدد النسخ من البداية إلى النهاية
  - واجهات WebSocket/HTTP، وإقران العقد، والشبكات الأثقل
- التوقعات:
  - تعمل في CI (عند تمكينها في خط الأنابيب)
  - لا تتطلب مفاتيح حقيقية
  - أجزاء متحركة أكثر من اختبارات الوحدة (قد تكون أبطأ)

### E2E: فحص دخاني لخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ Gateway معزولًا لـ OpenShell على المضيف عبر Docker
  - ينشئ صندوقًا رمليًا من Dockerfile محلي مؤقت
  - يمرّن خلفية OpenShell في OpenClaw عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات القياسي عن بُعد عبر جسر نظام ملفات الصندوق الرملي
- التوقعات:
  - اختياري فقط؛ ليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا باسم `openshell` إضافة إلى عفريت Docker عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولة، ثم يدمّر Gateway الاختبار والصندوق الرملي
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل حزمة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي أو سكربت تغليف غير افتراضي

### مباشر (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`، و`test/**/*.live.test.ts`، واختبارات live الخاصة بـ Plugin المضمنة ضمن `extensions/`
- الافتراضي: **ممكّن** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزود/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - رصد تغييرات تنسيق المزود، وخصائص استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر لـ CI عمدًا (شبكات حقيقية، سياسات مزودين حقيقية، حصص، انقطاعات)
  - يكلّف مالًا / يستخدم حدود المعدل
  - يُفضّل تشغيل مجموعات فرعية ضيقة بدلًا من "كل شيء"
- تستورد عمليات live المصدر `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيًا، ما زالت عمليات live تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى مجلد home اختباري مؤقت حتى لا تتمكن تجهيزات اختبارات الوحدة من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم اختبارات live مجلد home الحقيقي لديك.
- أصبح `pnpm test:live` يفترض الآن وضعًا أهدأ: يحتفظ بمخرجات التقدم `[live] ...`، لكنه يكتم إشعار `~/.profile` الإضافي وسجلات تمهيد Gateway/ثرثرة Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بالمزود): اضبط `*_API_KEYS` بتنسيق الفواصل/الفواصل المنقوطة أو `*_API_KEY_1`، `*_API_KEY_2` (مثلًا `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) أو تجاوزًا لكل live عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حد المعدل.
- مخرجات التقدم/Heartbeat:
  - تصدر حزم live الآن أسطر تقدم إلى stderr بحيث تكون استدعاءات المزود الطويلة ظاهرة النشاط حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة تحكم Vitest بحيث تتدفق أسطر تقدم المزود/Gateway فورًا أثناء عمليات live.
  - اضبط Heartbeat للنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat لـ Gateway/الفحص باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي حزمة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات Gateway / بروتوكول WS / الإقران: أضف `pnpm test:e2e`
- تصحيح "البوت الخاص بي متوقف" / إخفاقات خاصة بالمزود / استدعاء الأدوات: شغّل `pnpm test:live` ضيقًا

## اختبارات live (التي تلامس الشبكة)

بالنسبة إلى مصفوفة نماذج live، والفحوص الدخانية لخلفية CLI، وفحوص ACP الدخانية، وحاضنة خادم تطبيق Codex، وكل اختبارات live الخاصة بمزودي الوسائط (Deepgram، BytePlus، ComfyUI، الصور، الموسيقى، الفيديو، حاضنة الوسائط) — إضافة إلى التعامل مع بيانات الاعتماد لعمليات live — راجع
[اختبار حزم live](/ar/help/testing-live). وبالنسبة إلى قائمة التحقق المخصصة للتحديث والتحقق من Plugin، راجع
[اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins).

## مشغلات Docker (فحوص اختيارية لـ "يعمل في Linux")

تنقسم مشغلات Docker هذه إلى مجموعتين:

- مشغلات نماذج live: يشغّل `test:docker:live-models` و`test:docker:live-gateway` فقط ملف live المطابق لمفتاح ملف التعريف داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب مجلد الإعداد المحلي لديك ومساحة العمل (واستيراد `~/.profile` إذا كان مركبًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تفترض مشغلات Docker live حدًا دخانيًا أصغر افتراضيًا حتى يبقى فحص Docker الكامل عمليًا:
  يفترض `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويفترض
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة هذه عندما تريد
  صراحةً الفحص الشامل الأكبر.
- يبني `test:docker:all` صورة Docker الخاصة بـ live مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كأرشيف npm tarball عبر `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتي `scripts/e2e/Dockerfile`. الصورة المجردة ليست إلا مشغّل Node/Git لمسارات التثبيت/التحديث/اعتمادية Plugin؛ تركّب تلك المسارات أرشيف tarball المبني مسبقًا. تثبّت الصورة الوظيفية أرشيف tarball نفسه في `/app` لمسارات وظائف التطبيق المبني. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في خانات العمليات، بينما تمنع حدود الموارد مسارات live الثقيلة، وتثبيت npm، والمسارات متعددة الخدمات من البدء كلها في وقت واحد. إذا كان مسار واحد أثقل من الحدود النشطة، يستطيع المجدول مع ذلك بدءه عندما تكون المجموعة فارغة ثم يبقيه يعمل وحده حتى تتاح السعة من جديد. القيم الافتراضية هي 10 خانات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما يملك مضيف Docker هامشًا أكبر. ينفذ المشغّل فحصًا تمهيديًا لـ Docker افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في عمليات التشغيل اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون دون بناء Docker أو تشغيله، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة واحتياجات الحزمة/الصورة وبيانات الاعتماد.
- `Package Acceptance` هو بوابة الحزمة الأصلية في GitHub لسؤال "هل يعمل هذا الأرشيف القابل للتثبيت كمنتج؟" يحل حزمة مرشحة واحدة من `source=npm`، أو `source=ref`، أو `source=url`، أو `source=artifact`، ويرفعها باسم `package-under-test`، ثم يشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد أرشيف tarball الدقيق هذا بدلًا من إعادة حزم المرجع المحدد. تُرتّب ملفات التعريف حسب الاتساع: `smoke`، و`package`، و`product`، و`full`. راجع [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins) لعقد الحزمة/التحديث/Plugin، ومصفوفة نجاة الترقيات المنشورة، وافتراضات الإصدار، وفرز الإخفاقات.
- تشغّل فحوص البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يتتبع الحارس الرسم البياني الثابت المبني من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا استورد بدء التشغيل قبل الإرسال اعتماديات حزمة مثل Commander، أو واجهة موجه، أو undici، أو التسجيل قبل إرسال الأمر؛ كما يبقي مقطع تشغيل Gateway المضمن ضمن الميزانية ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة. يغطي فحص CLI الدخاني المعبأ أيضًا مساعدة الجذر، ومساعدة الإعداد الأولي، ومساعدة doctor، والحالة، ومخطط الإعداد، وأمر قائمة النماذج.
- يقتصر توافق `Package Acceptance` القديم عند `2026.4.25` (بما في ذلك `2026.4.25-beta.*`). حتى ذلك الحد، تتحمل الحاضنة فقط فجوات بيانات تعريف الحزمة المشحونة: إدخالات مخزون QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات التصحيح في تجهيز git المشتق من tarball، وغياب `update.channel` المحفوظ، ومواقع سجلات تثبيت Plugin القديمة، وغياب استمرار سجل تثبيت السوق، وترحيل بيانات تعريف الإعداد أثناء `plugins update`. بالنسبة إلى الحزم بعد `2026.4.25`، تكون تلك المسارات إخفاقات صارمة.
- مشغلات الفحص الدخاني للحاويات: `test:docker:openwebui`، و`test:docker:onboard`، و`test:docker:npm-onboard-channel-agent`، و`test:docker:update-channel-switch`، و`test:docker:upgrade-survivor`، و`test:docker:published-upgrade-survivor`، و`test:docker:session-runtime-context`، و`test:docker:agents-delete-shared-workspace`، و`test:docker:gateway-network`، و`test:docker:browser-cdp-snapshot`، و`test:docker:mcp-channels`، و`test:docker:pi-bundle-mcp-tools`، و`test:docker:cron-mcp-cleanup`، و`test:docker:plugins`، و`test:docker:plugin-update`، و`test:docker:plugin-lifecycle-matrix`، و`test:docker:config-reload` تشغّل حاوية حقيقية واحدة أو أكثر وتتحقق من مسارات تكامل أعلى مستوى.

تربط مشغلات Docker الخاصة بنماذج live أيضًا مجلدات مصادقة CLI المطلوبة فقط (أو كل المجلدات المدعومة عندما لا يكون التشغيل مضيقًا)، ثم تنسخها إلى مجلد home داخل الحاوية قبل التشغيل حتى تتمكن مصادقة OAuth الخاصة بواجهات CLI الخارجية من تحديث الرموز دون تعديل مخزن مصادقة المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- اختبار دخان ربط ACP: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- اختبار دخان خلفية CLI: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار دخان حزام خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- اختبار دخان قابلية المراقبة: `pnpm qa:otel:smoke` هو مسار خاص للتحقق من استخراج مصدر QA. وهو ليس جزءا من مسارات إصدار Docker للحزمة عمدا لأن أرشيف npm tarball يحذف QA Lab.
- اختبار دخان Open WebUI المباشر: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، إنشاء بنية كاملة): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- اختبار دخان إعداد/قناة/وكيل أرشيف npm tarball: يثبت `pnpm test:docker:npm-onboard-channel-agent` أرشيف OpenClaw المضغوط عالميا في Docker، ويهيئ OpenAI عبر إعداد أولي بإحالة بيئية إضافة إلى Telegram افتراضيا، ويشغل doctor، ويشغل دورة وكيل OpenAI واحدة بمحاكاة. أعد استخدام أرشيف tarball مبنيا مسبقا باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخط إعادة بناء المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- اختبار دخان تبديل قناة التحديث: يثبت `pnpm test:docker:update-channel-switch` أرشيف OpenClaw المضغوط عالميا في Docker، ويبدل من حزمة `stable` إلى git `dev`، ويتحقق من القناة المحفوظة وعمل Plugin بعد التحديث، ثم يعود إلى حزمة `stable` ويتحقق من حالة التحديث.
- اختبار دخان النجاة من الترقية: يثبت `pnpm test:docker:upgrade-survivor` أرشيف OpenClaw المضغوط فوق تجهيز مستخدم قديم متسخ يتضمن وكلاء، وإعدادات قناة، وقوائم سماح Plugin، وحالة تبعيات Plugin قديمة، وملفات مساحة عمل/جلسة موجودة. يشغل تحديث الحزمة إضافة إلى doctor غير تفاعلي دون مفاتيح مزود أو قناة مباشرة، ثم يبدأ Gateway عبر حلقة رجوع ويتحقق من حفظ الإعداد/الحالة إضافة إلى ميزانيات بدء التشغيل/الحالة.
- اختبار دخان النجاة من ترقية منشورة: يثبت `pnpm test:docker:published-upgrade-survivor`‏ `openclaw@latest` افتراضيا، ويزرع ملفات مستخدم موجود واقعية، ويهيئ ذلك الأساس بوصفة أوامر مدمجة، ويتحقق من الإعداد الناتج، ويحدث ذلك التثبيت المنشور إلى أرشيف tarball المرشح، ويشغل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر حلقة رجوع ويتحقق من النوايا المهيأة، وحفظ الحالة، وبدء التشغيل، و`/healthz`، و`/readyz`، وميزانيات حالة RPC. تجاوز أساسا واحدا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، واطلب من مجدول التجميع توسيع الأساسات الدقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `all-since-2026.4.23`، ووسع التجهيزات ذات شكل القضايا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues`؛ تتضمن مجموعة reported-issues‏ `configured-plugin-installs` لإصلاح تثبيت Plugin خارجي لـ OpenClaw تلقائيا. تعرض Package Acceptance هذه كـ `published_upgrade_survivor_baseline`، و`published_upgrade_survivor_baselines`، و`published_upgrade_survivor_scenarios`.
- اختبار دخان سياق وقت تشغيل الجلسة: يتحقق `pnpm test:docker:session-runtime-context` من استمرار نص سياق وقت التشغيل المخفي إضافة إلى إصلاح doctor لفروع إعادة كتابة الموجه المكررة المتأثرة.
- اختبار دخان التثبيت العالمي عبر Bun: يحزم `bash scripts/e2e/bun-global-install-smoke.sh` الشجرة الحالية، ويثبتها باستخدام `bun install -g` في منزل معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد مزودي الصور المضمنين بدلا من التعليق. أعد استخدام أرشيف tarball مبنيا مسبقا باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخط بناء المضيف باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- اختبار دخان Docker للمثبت: يشارك `bash scripts/test-install-sh-docker.sh` ذاكرة npm مؤقتة واحدة عبر حاويات الجذر والتحديث وdirect-npm الخاصة به. يعتمد اختبار دخان التحديث افتراضيا على npm `latest` كأساس مستقر قبل الترقية إلى أرشيف tarball المرشح. تجاوزه باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` محليا، أو باستخدام إدخال `update_baseline_version` في مسار عمل Install Smoke على GitHub. تحتفظ فحوصات المثبت دون صلاحيات جذر بذاكرة npm مؤقتة معزولة حتى لا تحجب إدخالات الذاكرة المؤقتة المملوكة للجذر سلوك التثبيت المحلي للمستخدم. اضبط `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة الجذر/التحديث/direct-npm المؤقتة عبر عمليات إعادة التشغيل المحلية.
- يتخطى Install Smoke CI التحديث العالمي المباشر المكرر عبر npm باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغل السكربت محليا دون هذا المتغير البيئي عندما تكون تغطية `npm install -g` المباشرة مطلوبة.
- اختبار دخان CLI لحذف الوكلاء لمساحة العمل المشتركة: يبني `pnpm test:docker:agents-delete-shared-workspace` (السكربت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) صورة Dockerfile الجذر افتراضيا، ويزرع وكيلين مع مساحة عمل واحدة في منزل حاوية معزول، ويشغل `agents delete --json`، ويتحقق من JSON صالح وسلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke باستخدام `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- اختبار دخان لقطة Browser CDP: يبني `pnpm test:docker:browser-cdp-snapshot` (السكربت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) صورة E2E المصدر إضافة إلى طبقة Chromium، ويبدأ Chromium باستخدام CDP خام، ويشغل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي عناوين URL للروابط، والعناصر القابلة للنقر المرقاة بالمؤشر، ومراجع iframe، وبيانات الإطار الوصفية.
- انحدار OpenAI Responses web_search بتفكير أدنى: يشغل `pnpm test:docker:openai-web-search-minimal` (السكربت: `scripts/e2e/openai-web-search-minimal-docker.sh`) خادم OpenAI محاكيا عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط المزود ويتحقق من ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + اختبار دخان إطار إشعار Claude خام): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة Pi (خادم MCP حقيقي عبر stdio + اختبار دخان السماح/الرفض لملف Pi التعريفي المضمن): `pnpm test:docker:pi-bundle-mcp-tools` (السكربت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف Cron/الوكيل الفرعي لـ MCP (Gateway حقيقي + تفكيك ابن MCP عبر stdio بعد تشغيلات cron معزولة ووكيل فرعي لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكربت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (اختبار دخان التثبيت/التحديث لمسار محلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git متحركة، وClawHub kitchen-sink، وتحديثات marketplace، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)
  اضبط `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/وقت التشغيل الافتراضي kitchen-sink باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. دون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم تجهيز ClawHub محلي محكم العزل.
- اختبار دخان عدم تغير تحديث Plugin: `pnpm test:docker:plugin-update` (السكربت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- اختبار دخان مصفوفة دورة حياة Plugin: يثبت `pnpm test:docker:plugin-lifecycle-matrix` أرشيف OpenClaw المضغوط في حاوية عارية، ويثبت Plugin من npm، ويبدل التمكين/التعطيل، ويرقيه ويخفض إصداره عبر سجل npm محلي، ويحذف الكود المثبت، ثم يتحقق من أن إلغاء التثبيت لا يزال يزيل الحالة القديمة مع تسجيل مقاييس RSS/CPU لكل مرحلة من دورة الحياة.
- اختبار دخان بيانات إعادة تحميل الإعداد الوصفية: `pnpm test:docker:config-reload` (السكربت: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: يغطي `pnpm test:docker:plugins` اختبار دخان التثبيت/التحديث لمسار محلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git متحركة، وتجهيزات ClawHub، وتحديثات marketplace، وتمكين/فحص حزمة Claude. يغطي `pnpm test:docker:plugin-update` سلوك التحديث دون تغيير للـ plugins المثبتة. يغطي `pnpm test:docker:plugin-lifecycle-matrix` تثبيت Plugin من npm مع تتبع الموارد، وتمكينه، وتعطيله، وترقيته، وخفض إصداره، وإلغاء تثبيته عند غياب الكود.

لبناء الصورة الوظيفية المشتركة مسبقا وإعادة استخدامها يدويا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بالمجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ذات أولوية عند ضبطها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكربتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات Docker الخاصة بـ QR والمثبت بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلا من وقت تشغيل التطبيق المبني المشترك.

تشغّل مشغّلات Docker للنماذج الحية أيضًا نسخة العمل الحالية بتركيب ربط للقراءة فقط، وتجهّزها في دليل عمل مؤقت داخل الحاوية. يحافظ ذلك على خفة صورة runtime مع الاستمرار في تشغيل Vitest مقابل المصدر/الإعداد المحلي لديك بدقة.
تتخطى خطوة التجهيز التخزينات المؤقتة الكبيرة المحلية فقط ومخرجات بناء التطبيقات مثل
`.pnpm-store`، و`.worktrees`، و`__openclaw_vitest__`، وأدلة مخرجات `.build` المحلية للتطبيق أو Gradle، حتى لا تقضي عمليات Docker الحية دقائق في نسخ
مصنوعات خاصة بالجهاز.
كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات Gateway الحية عمال قنوات
Telegram/Discord/وما إلى ذلك الحقيقيين داخل الحاوية.
ما زال `test:docker:live-models` يشغّل `pnpm test:live`، لذلك مرّر أيضًا
`OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق تغطية Gateway الحية أو استبعادها
من مسار Docker ذلك.
`test:docker:openwebui` هو فحص دخاني توافق أعلى مستوى: يبدأ حاوية Gateway من
OpenClaw مع تمكين نقاط نهاية HTTP المتوافقة مع OpenAI، ويبدأ حاوية Open WebUI
مثبّتة الإصدار مقابل ذلك Gateway، ويسجّل الدخول عبر Open WebUI، ويتحقق من أن
`/api/models` يعرّض `openclaw/default`، ثم يرسل طلب محادثة حقيقيًا عبر وكيل
`/api/chat/completions` في Open WebUI.
قد تكون أول عملية تشغيل أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى جلب صورة
Open WebUI، وقد يحتاج Open WebUI إلى إكمال إعداد بدء التشغيل البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج حي قابلًا للاستخدام، ويُعد `OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيًا) الطريقة الأساسية لتوفيره في عمليات التشغيل داخل Docker.
تطبع عمليات التشغيل الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عمدًا ولا يحتاج إلى حساب Telegram أو Discord أو iMessage
حقيقي. يبدأ حاوية Gateway مزروعة، ويبدأ حاوية ثانية تُشغّل `openclaw mcp serve`،
ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءات النصوص، وبيانات تعريف المرفقات،
وسلوك قائمة انتظار الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة +
الأذونات بأسلوب Claude عبر جسر MCP الحقيقي باستخدام stdio. يفحص التحقق من الإشعارات
إطارات MCP الخام عبر stdio مباشرة، بحيث يتحقق الفحص الدخاني مما يبثه الجسر فعليًا،
وليس فقط ما تصادف أن يعرّضه SDK عميل محدد.
`test:docker:pi-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج حي. يبني صورة Docker
للمستودع، ويبدأ خادم فحص MCP حقيقيًا عبر stdio داخل الحاوية، ويمثّل ذلك الخادم من
خلال runtime حزمة Pi المضمنة لـ MCP، وينفّذ الأداة، ثم يتحقق من أن `coding` و`messaging`
يحافظان على أدوات `bundle-mcp` بينما يرشحها `minimal` و`tools.deny: ["bundle-mcp"]`.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج حي. يبدأ Gateway مزروعًا
مع خادم فحص MCP حقيقي عبر stdio، ويشغّل دورة Cron معزولة ودورة ابن لمرة واحدة عبر
`/subagents spawn`، ثم يتحقق من خروج عملية MCP الابنة بعد كل تشغيل.

فحص دخاني يدوي لخيط ACP باللغة العادية (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لسير عمل الانحدار/تصحيح الأخطاء. قد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه خيوط ACP، لذلك لا تحذفه.

متغيرات البيئة المفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) مركّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) مركّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) مركّب إلى `/home/node/.profile` وتتم قراءته قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المقروءة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعداد/مساحة عمل مؤقتة ومن دون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) مركّب إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية ضمن `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، و`~/.codex/config.toml`، و`.claude.json`، و`~/.claude/.credentials.json`، و`~/.claude/settings.json`، و`~/.claude/settings.local.json`
  - تركّب عمليات تشغيل المزوّدين المضيّقة فقط الأدلة/الملفات المطلوبة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز ذلك يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all`، أو `OPENCLAW_DOCKER_AUTH_DIRS=none`، أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لترشيح المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لعمليات إعادة التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن الملف الشخصي (وليس من env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرّضه Gateway لفحص Open WebUI الدخاني
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز موجه فحص nonce المستخدم بواسطة فحص Open WebUI الدخاني
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبّتة

## سلامة المستندات

شغّل فحوصات المستندات بعد تعديلات المستندات: `pnpm check:docs`.
شغّل تحقق روابط Mintlify الكامل مع المراسي عندما تحتاج أيضًا إلى فحوصات عناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه انحدارات "مسار حقيقي" من دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، وGateway حقيقي + حلقة agent): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج إعداد Gateway (WS `wizard.start`/`wizard.next`، يكتب الإعداد + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية agent (Skills)

لدينا بالفعل بضعة اختبارات آمنة لـ CI تتصرف مثل "تقييمات موثوقية agent":

- استدعاء أدوات وهمي عبر Gateway الحقيقي + حلقة agent (`src/gateway/gateway.test.ts`).
- تدفقات معالج إعداد من البداية إلى النهاية تتحقق من ربط الجلسة وتأثيرات الإعداد (`src/gateway/gateway.test.ts`).

ما يزال مفقودًا لـ Skills (انظر [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في الموجه، هل يختار agent المهارة الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ agent ملف `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسيطات المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تؤكد ترتيب الأدوات، واستمرار سجل الجلسة، وحدود sandbox.

يجب أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين وهميين لتأكيد استدعاءات الأدوات + ترتيبها، وقراءات ملف المهارة، وربط الجلسة.
- حزمة صغيرة من السيناريوهات المركزة على المهارات (الاستخدام مقابل التجنب، الحواجز، حقن الموجه).
- تقييمات حية اختيارية (بالاشتراك، ومحكومة بمتغيرات البيئة) فقط بعد وضع الحزمة الآمنة لـ CI.

## اختبارات العقد (شكل Plugin والقناة)

تتحقق اختبارات العقد من أن كل Plugin وقناة مسجلين يلتزمان بعقد الواجهة الخاص بهما.
تكرر على كل Plugins المكتشفة وتشغّل حزمة من تأكيدات الشكل والسلوك. يتخطى مسار وحدة
`pnpm test` الافتراضي عمدًا ملفات الفحص الدخاني وهذه seams المشتركة؛ شغّل أوامر العقود
صراحة عندما تلمس أسطح القنوات أو المزوّدين المشتركة.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

موجودة في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي لـ Plugin (المعرّف، الاسم، القدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - التعامل مع الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - التعامل مع معرّف الخيط
- **directory** - واجهة API للدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

موجودة في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّدين

موجودة في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة API لفهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - runtime المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تُشغّل

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة Plugin قناة أو مزوّد أو تعديله
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقد في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة الانحدارات (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج اكتُشفت في التشغيل الحي:

- أضف انحدارًا آمنًا لـ CI إن أمكن (مزوّد mock/stub، أو التقاط تحويل شكل الطلب الدقيق)
- إذا كانت بطبيعتها حية فقط (حدود المعدل، سياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا واختياريًا عبر متغيرات البيئة
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ تحويل/إعادة تشغيل طلب المزوّد → اختبار نماذج مباشر
  - خطأ مسار جلسة/سجل/أدوات Gateway → فحص دخاني حي لـ Gateway أو اختبار وهمي آمن لـ CI لـ Gateway
- حاجز حماية اجتياز SecretRef:
  - يشتق `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا عيّنيًا واحدًا لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرّفات exec ذات مقاطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة بـ `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند معرّفات أهداف غير مصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذو صلة

- [اختبار الحي](/ar/help/testing-live)
- [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)
- [CI](/ar/ci)
