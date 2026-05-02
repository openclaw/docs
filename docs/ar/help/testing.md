---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النماذج/المزوّدين
    - استكشاف أخطاء سلوك Gateway + الوكيل وإصلاحها
summary: 'مجموعة أدوات الاختبار: مجموعات اختبارات الوحدة/e2e/live، ومشغلات Docker، وما يغطيه كل اختبار'
title: اختبار
x-i18n:
    generated_at: "2026-05-02T07:32:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw لديه ثلاث مجموعات Vitest (وحدة/تكامل، e2e، مباشر) ومجموعة صغيرة
من مشغلات Docker. هذا المستند هو دليل "كيف نختبر":

- ما تغطيه كل مجموعة (وما تتعمد _عدم_ تغطيته).
- الأوامر التي يجب تشغيلها لسير العمل الشائع (محليًا، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات المباشرة بيانات الاعتماد وتختار النماذج/المزودين.
- كيف تضيف اختبارات انحدار لمشكلات النماذج/المزودين الواقعية.

<Note>
**مكدس ضمان الجودة (qa-lab، qa-channel، مسارات النقل المباشر)** موثق بشكل منفصل:

- [نظرة عامة على ضمان الجودة](/ar/concepts/qa-e2e-automation) — البنية، واجهة الأوامر، تأليف السيناريوهات.
- [ضمان جودة المصفوفة](/ar/concepts/qa-matrix) — مرجع لـ `pnpm openclaw qa matrix`.
- [قناة ضمان الجودة](/ar/channels/qa-channel) — Plugin النقل الاصطناعي المستخدم بواسطة السيناريوهات المدعومة بالمستودع.

تغطي هذه الصفحة تشغيل مجموعات الاختبار العادية ومشغلات Docker/Parallels. يسرد قسم المشغلات الخاصة بضمان الجودة أدناه ([المشغلات الخاصة بضمان الجودة](#qa-specific-runners)) استدعاءات `qa` المحددة ويشير مرة أخرى إلى المراجع أعلاه.
</Note>

## بداية سريعة

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل محلي أسرع للمجموعة الكاملة على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- استهداف الملفات المباشر يوجه الآن مسارات الامتدادات/القنوات أيضًا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تكرر العمل على فشل واحد.
- موقع ضمان الجودة المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار ضمان الجودة المدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح المزودين/النماذج الحقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة المباشرة (النماذج + فحوصات أداة/صورة Gateway): `pnpm test:live`
- استهدف ملفًا مباشرًا واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- مسح نماذج مباشر عبر Docker: `pnpm test:docker:live-models`
  - يشغل كل نموذج محدد الآن دورة نصية بالإضافة إلى فحص صغير بأسلوب قراءة الملفات.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغل أيضًا دورة صورة صغيرة.
    عطّل الفحوصات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل أعطال المزود.
  - تغطية CI: يستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومي و
    `OpenClaw Release Checks` اليدوي سير العمل المباشر/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، وهذا يتضمن مهام مصفوفة منفصلة لنماذج Docker المباشرة
    مقسمة حسب المزود.
  - لإعادات تشغيل CI مركزة، شغّل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و `live_models_only: true`.
  - أضف أسرار مزود جديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    بالإضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/الخاصة بالإصدار.
- اختبار دخان المحادثة المرتبطة الأصلية لـ Codex: `pnpm test:docker:live-codex-bind`
  - يشغل مسارًا مباشرًا عبر Docker مقابل مسار خادم تطبيق Codex، ويربط رسالة Slack مباشرة اصطناعية
    باستخدام `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من مرور رد عادي ومرفق صورة
    عبر ربط Plugin الأصلي بدلًا من ACP.
- اختبار دخان حزمة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغل دورات وكيل Gateway عبر حزمة خادم تطبيق Codex المملوكة لـ Plugin،
    ويتحقق من `/codex status` و `/codex models`، وبشكل افتراضي يمارس فحوصات الصورة،
    وCron MCP، والوكيل الفرعي، وGuardian. عطّل فحص الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل أعطال أخرى في
    خادم تطبيق Codex. لفحص وكيل فرعي مركز، عطّل الفحوصات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد فحص الوكيل الفرعي ما لم يتم ضبط
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- اختبار دخان أمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري احتياطي لواجهة أمر إنقاذ قناة الرسائل.
    يمارس `/crestodian status`، ويضع في الطابور تغيير نموذج دائمًا،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعدادات.
- اختبار دخان مخطط Crestodian في Docker: `pnpm test:docker:crestodian-planner`
  - يشغل Crestodian في حاوية بلا إعدادات مع Claude CLI مزيف على `PATH`
    ويتحقق من أن تراجع المخطط التقريبي يترجم إلى كتابة إعدادات مكتوبة ومدققة.
- اختبار دخان التشغيل الأول لـ Crestodian في Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من مجلد حالة OpenClaw فارغ، ويوجه `openclaw` المجرد إلى
    Crestodian، ويطبق كتابات الإعداد/النموذج/الوكيل/Plugin Discord + SecretRef،
    ويتحقق من الإعدادات، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضًا في QA Lab بواسطة
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- اختبار دخان تكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل أمرًا معزولًا
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مقابل `moonshot/kimi-k2.6`. تحقق من أن JSON يبلّغ عن Moonshot/K2.6 وأن
  سجل المساعد يخزن `usage.cost` المعيّر.

<Tip>
عندما تحتاج إلى حالة فاشلة واحدة فقط، فضّل تضييق الاختبارات المباشرة عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## المشغلات الخاصة بضمان الجودة

تقع هذه الأوامر بجوار مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغل CI منصة QA Lab في سير عمل مخصصة. تعمل `Parity gate` على طلبات PR المطابقة
ومن التشغيل اليدوي مع مزودين وهميين. تعمل `QA-Lab - All Lanes` ليلًا على
`main` ومن التشغيل اليدوي مع بوابة التكافؤ الوهمية، ومسار Matrix المباشر،
ومسار Telegram المباشر المُدار بواسطة Convex، ومسار Discord المباشر المُدار بواسطة Convex
كمهام متوازية. تمرر اختبارات QA المجدولة واختبارات الإصدار `--profile fast`
إلى Matrix صراحةً، بينما تظل قيمة CLI الخاصة بـ Matrix ومدخل سير العمل اليدوي الافتراضية
`all`؛ ويمكن للتشغيل اليدوي تقسيم `all` إلى مهام `transport` و `media` و `e2ee-smoke` و
`e2ee-deep` و `e2ee-cli`. تشغل `OpenClaw Release Checks` التكافؤ بالإضافة إلى
مساري Matrix وTelegram السريعين قبل اعتماد الإصدار، باستخدام
`mock-openai/gpt-5.5` لفحوصات نقل الإصدار حتى تبقى حتمية
وتتجنب بدء تشغيل Plugin المزود العادي. تعطل بوابات النقل المباشر هذه
بحث الذاكرة؛ ويظل سلوك الذاكرة مغطى بواسطة مجموعات تكافؤ QA.

تستخدم تقسيمات وسائط الإصدار المباشر الكاملة
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، والتي تحتوي بالفعل على
`ffmpeg` و `ffprobe`. تستخدم تقسيمات نموذج/واجهة Docker المباشرة صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
التزام محدد، ثم تسحبها باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلًا من إعادة البناء
داخل كل تقسيم.

- `pnpm openclaw qa suite`
  - يشغل سيناريوهات QA المدعومة بالمستودع مباشرة على المضيف.
  - يشغل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمال Gateway معزولين.
    القيمة الافتراضية لتزامن `qa-channel` هي 4 (محدودة بعدد السيناريوهات
    المحددة). استخدم `--concurrency <count>` لضبط عدد العمال،
    أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج بقيمة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد القطع الأثرية دون رمز خروج فاشل.
  - يدعم أوضاع المزود `live-frontier` و `mock-openai` و `aimock`.
    يبدأ `aimock` خادم مزود محليًا مدعومًا بـ AIMock لتغطية تجريبية
    للتركيبات ومحاكاة البروتوكول دون استبدال مسار `mock-openai` الواعي بالسيناريو.
- `pnpm test:gateway:cpu-scenarios`
  - يشغل معيار بدء تشغيل Gateway بالإضافة إلى حزمة صغيرة من سيناريوهات QA Lab الوهمية
    (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) ويكتب ملخص مراقبة CPU مدمجًا
    تحت `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم فقط ملاحظات سخونة CPU المستمرة افتراضيًا (`--cpu-core-warn`
    بالإضافة إلى `--hot-wall-warn-ms`)، لذلك تُسجل اندفاعات بدء التشغيل القصيرة كمقاييس
    دون أن تبدو مثل انحدار تثبيت Gateway الذي يستمر لدقائق.
  - يستخدم قطع `dist` المبنية؛ شغّل بناءً أولًا عندما لا يحتوي checkout
    بالفعل على مخرجات وقت تشغيل حديثة.
- `pnpm openclaw qa suite --runner multipass`
  - يشغل مجموعة QA نفسها داخل آلة Multipass Linux افتراضية قابلة للتخلص منها.
  - يحافظ على سلوك اختيار السيناريو نفسه مثل `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزود/النموذج نفسها مثل `qa suite`.
  - تمرر التشغيلات المباشرة مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزود القائمة على البيئة، ومسار إعداد مزود QA المباشر، و `CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى مجلدات الإخراج تحت جذر المستودع حتى يتمكن الضيف من الكتابة مرة أخرى عبر
    مساحة العمل المثبتة.
  - يكتب تقرير QA والملخص العاديين بالإضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لعمل ضمان جودة بأسلوب المشغل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني أرشيف npm من checkout الحالي، ويثبته عالميًا في
    Docker، ويشغل تهيئة مفتاح OpenAI API غير تفاعلية، ويكوّن Telegram
    افتراضيًا، ويتحقق من تحميل وقت تشغيل Plugin المعبأ دون إصلاح
    تبعيات بدء التشغيل، ويشغل doctor، ويشغل دورة وكيل محلية واحدة مقابل
    نقطة نهاية OpenAI وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ نفسه
    مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغل اختبار دخان Docker حتمي للتطبيق المبني لسجلات سياق وقت التشغيل المضمنة.
    يتحقق من استمرار سياق وقت تشغيل OpenClaw المخفي كرسالة مخصصة غير معروضة
    بدلًا من تسربه إلى دورة المستخدم المرئية، ثم يزرع JSONL جلسة معطوبة متأثرة ويتحقق من أن
    `openclaw doctor --fix` يعيد كتابتها إلى الفرع النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبت مرشح حزمة OpenClaw في Docker، ويشغل تهيئة الحزمة المثبتة،
    ويكوّن Telegram عبر CLI المثبت، ثم يعيد استخدام مسار QA المباشر الخاص بـ Telegram
    مع تلك الحزمة المثبتة كـ Gateway قيد الاختبار.
  - القيمة الافتراضية هي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛ اضبط
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار أرشيف محلي محلول بدلًا من
    التثبيت من السجل.
  - يستخدم بيانات اعتماد بيئة Telegram نفسها أو مصدر بيانات اعتماد Convex مثل
    `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، اضبط
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` بالإضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. إذا كان
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI،
    فسيحدد غلاف Docker خيار Convex تلقائيًا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` متغير
    `OPENCLAW_QA_CREDENTIAL_ROLE` المشترك لهذا المسار فقط.
  - تعرض GitHub Actions هذا المسار كسير عمل مشرف يدوي
    `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة
    `qa-live-shared` وإيجارات بيانات اعتماد Convex CI.
- تعرض GitHub Actions أيضًا `Package Acceptance` لإثبات منتج جانبي
  مقابل حزمة مرشحة واحدة. يقبل مرجعًا موثوقًا، ومواصفة npm منشورة،
  ورابط HTTPS لأرشيف مع SHA-256، أو قطعة أرشيف من تشغيل آخر، ويرفع
  `openclaw-current.tgz` المعيّر كـ `package-under-test`، ثم يشغل
  مجدول Docker E2E الحالي بملفات تعريف مسار smoke أو package أو product أو full أو custom.
  اضبط `telegram_mode=mock-openai` أو `live-frontier` لتشغيل سير عمل QA الخاص بـ Telegram
  مقابل قطعة `package-under-test` نفسها.
  - أحدث إثبات منتج beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات رابط الأرشيف الدقيق موجزًا:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- ينزّل إثبات الأثر حزمة tarball كأثر من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - يحزم إصدار OpenClaw الحالي ويثبته في Docker، ويبدأ Gateway
    مع تهيئة OpenAI، ثم يفعّل القناة/Plugins المضمنة عبر تعديلات
    التهيئة.
  - يتحقق من أن اكتشاف الإعداد يترك Plugins القابلة للتنزيل غير المهيأة غائبة،
    وأن أول إصلاح مهيأ من doctor يثبت كل Plugin مفقود قابل للتنزيل
    صراحة، وأن إعادة تشغيل ثانية لا تشغّل إصلاح تبعيات مخفي.
  - يثبت أيضا خط أساس npm أقدم معروفا، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن doctor بعد التحديث
    في المرشح ينظف بقايا تبعيات Plugin القديمة دون إصلاح postinstall
    من جهة harness.
- `pnpm test:parallels:npm-update`
  - يشغّل اختبار smoke لتحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. كل
    منصة محددة تثبت أولا حزمة خط الأساس المطلوبة، ثم تشغّل أمر
    `openclaw update` المثبت في الضيف نفسه وتتحقق من
    الإصدار المثبت، وحالة التحديث، وجاهزية Gateway، ودورة وكيل محلي
    واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux` أثناء
    التكرار على ضيف واحد. استخدم `--json` لمسار أثر الملخص وحالة
    كل مسار.
  - يستخدم مسار OpenAI النموذج `openai/gpt-5.5` لإثبات دورة الوكيل الحية
    افتراضيا. مرر `--model <provider/model>` أو اضبط
    `OPENCLAW_PARALLELS_OPENAI_MODEL` عند التحقق المتعمد من نموذج
    OpenAI آخر.
  - غلف عمليات التشغيل المحلية الطويلة بمهلة على المضيف حتى لا تستهلك
    تعثرات نقل Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسارات متداخلة تحت `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي عالق.
  - قد يستغرق تحديث Windows من 10 إلى 15 دقيقة في أعمال doctor بعد التحديث وتحديث
    الحزمة على ضيف بارد؛ ويظل ذلك سليما عندما يكون سجل تصحيح npm
    المتداخل يتقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات smoke الفردية في Parallels
    على macOS أو Windows أو Linux. فهي تشترك في حالة VM وقد تتصادم عند
    استعادة اللقطة، أو تقديم الحزمة، أو حالة Gateway الضيف.
  - يشغّل إثبات ما بعد التحديث سطح Plugin المضمن العادي لأن
    واجهات القدرات مثل الكلام، وتوليد الصور، وفهم الوسائط
    تحمّل عبر واجهات API وقت التشغيل المضمنة حتى عندما تتحقق دورة الوكيل
    نفسها من استجابة نصية بسيطة فقط.

- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم مزود AIMock المحلي لاختبار smoke مباشر للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي لـ Matrix مقابل خادم Tuwunel homeserver مؤقت مدعوم من Docker. من نسخة المصدر فقط — لا تشحن التثبيتات المعبأة `qa-lab`.
  - CLI الكامل، وكتالوغ الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط الآثار: [Matrix QA](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رموز بوت المشغل وSUT من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` للاعتمادات المجمعة المشتركة. استخدم وضع البيئة افتراضيا، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في الإيجارات المجمعة.
  - يخرج برمز غير صفري عندما يفشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد الآثار دون رمز خروج فاشل.
  - يتطلب بوتين متميزين في المجموعة الخاصة نفسها، مع كشف بوت SUT عن اسم مستخدم Telegram.
  - للملاحظة المستقرة بين البوتات، فعّل وضع التواصل بين البوتات في `@BotFather` لكلا البوتين وتأكد من أن بوت المشغل يمكنه ملاحظة حركة بوتات المجموعة.
  - يكتب تقرير Telegram QA وملخصا وأثر الرسائل المرصودة تحت `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال المشغل إلى رد SUT المرصود.

تشترك مسارات النقل الحي في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ توجد مصفوفة تغطية كل مسار في [نظرة عامة على QA → تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` هي الحزمة الاصطناعية الواسعة وليست جزءا من تلك المصفوفة.

### اعتمادات Telegram المشتركة عبر Convex (v1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل مختبر QA على إيجار حصري من مجمع مدعوم من Convex، ويرسل
Heartbeat لذلك الإيجار أثناء تشغيل المسار، ويحرر الإيجار عند الإيقاف.

سقالة مشروع Convex المرجعية:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (مثلا `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- تحديد دور الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - افتراضي البيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (يفترض `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL لـ Convex بنمط `http://` على local loopback للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البادئة `https://` في التشغيل العادي.

تتطلب أوامر إدارة المشرفين (إضافة/إزالة/عرض المجمع)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل عمليات التشغيل الحية لفحص عنوان URL لموقع Convex، وأسرار broker،
وبادئة endpoint، ومهلة HTTP، وإمكانية الوصول إلى admin/list دون طباعة
قيم الأسرار. استخدم `--json` لمخرجات قابلة للقراءة آليا في السكربتات وأدوات CI.

عقد endpoint الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - حارس الإيجار النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن تكون `groupId` سلسلة معرّف دردشة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` ويرفض الحمولات المشوهة.

### إضافة قناة إلى QA

توجد أسماء البنية ومساعدي السيناريو لمحولات القنوات الجديدة في [نظرة عامة على QA → إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: نفّذ مشغل النقل على seam مضيف `qa-lab` المشترك، وصرّح بـ `qaRunners` في بيان Plugin، واربطه كـ `openclaw qa <runner>`، وأنشئ السيناريوهات تحت `qa/scenarios/`.

## حزم الاختبار (ما الذي يعمل وأين)

فكر في الحزم على أنها "واقعية متزايدة" (وتقلب/تكلفة متزايدان):

### الوحدة / التكامل (افتراضي)

- الأمر: `pnpm test`
- التهيئة: تستخدم عمليات التشغيل غير المستهدفة مجموعة الشظايا `vitest.full-*.config.ts` وقد توسع الشظايا متعددة المشاريع إلى تهيئات لكل مشروع للجدولة المتوازية
- الملفات: قوائم core/unit تحت `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`؛ تعمل اختبارات وحدة UI في شظية `unit-ui` المخصصة
- النطاق:
  - اختبارات وحدة نقية
  - اختبارات تكامل داخل العملية (مصادقة Gateway، التوجيه، الأدوات، التحليل، التهيئة)
  - انحدارات حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
  - يجب أن تثبت اختبارات المحلل ومحمل السطح العام سلوك الرجوع الواسع لـ `api.js` و
    `runtime-api.js` باستخدام تجهيزات Plugin صغيرة مولدة، وليس
    APIs مصادر Plugin المضمنة الحقيقية. تنتمي تحميلات API الحقيقية للـ Plugin إلى
    حزم العقد/التكامل المملوكة للـ Plugin.

<AccordionGroup>
  <Accordion title="المشاريع، والشظايا، والمسارات المحددة">

    - تعمل أوامر `pnpm test` غير المستهدفة على تشغيل اثني عشر إعداد تقسيم أصغر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) بدلا من عملية مشروع جذري أصلية ضخمة واحدة. يقلل هذا ذروة RSS على الأجهزة المحملة، ويتجنب أن تتسبب أعمال الرد التلقائي/الإضافات في تجويع الحزم غير المرتبطة.
    - لا يزال `pnpm test --watch` يستخدم مخطط مشروع الجذر الأصلي `vitest.config.ts`، لأن حلقة مراقبة متعددة التقسيمات ليست عملية.
    - تمرر `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/المجلدات الصريحة عبر المسارات محددة النطاق أولا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع تكلفة بدء تشغيل مشروع الجذر بالكامل.
    - يوسع `pnpm test:changed` مسارات git المتغيرة إلى مسارات رخيصة محددة النطاق افتراضيا: تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، والمعتمدون المحليون في مخطط الاستيراد. لا تؤدي تعديلات الإعداد/التهيئة/الحزمة إلى تشغيل اختبارات واسعة إلا إذا استخدمت صراحة `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هو بوابة الفحص المحلي الذكي المعتادة للعمل الضيق. يصنف الفرق إلى النواة، واختبارات النواة، والإضافات، واختبارات الإضافات، والتطبيقات، والوثائق، وبيانات الإصدار الوصفية، وأدوات Docker الحية، والأدوات، ثم يشغل أوامر فحص الأنواع والlint والحراسة المطابقة. لا يشغل اختبارات Vitest؛ استدع `pnpm test:changed` أو `pnpm test <target>` الصريح لإثبات الاختبار. تغييرات إصدار بيانات الإصدار الوصفية فقط تشغل فحوصات مستهدفة للإصدار/الإعداد/اعتماد الجذر، مع حارس يرفض تغييرات الحزمة خارج حقل الإصدار ذي المستوى الأعلى.
    - تشغل تعديلات عدة ACP Docker الحي فحوصات مركزة: صياغة shell لسكربتات مصادقة Docker الحية وتشغيل جاف لجدولة Docker الحية. لا تُضمَّن تغييرات `package.json` إلا عندما يكون الفرق محدودا إلى `scripts["test:docker:live-*"]`؛ أما تعديلات الاعتماد والتصدير والإصدار وأسطح الحزمة الأخرى فلا تزال تستخدم الحراس الأوسع.
    - تمر اختبارات الوحدات خفيفة الاستيراد من الوكلاء، والأوامر، والـ Plugins، ومساعدات الرد التلقائي، و`plugin-sdk`، ومناطق الأدوات النقية المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ وتبقى الملفات ذات الحالة/الثقيلة وقت التشغيل على المسارات الحالية.
    - تعيّن ملفات مصدر المساعد المختارة في `plugin-sdk` و`commands` أيضا تشغيلات وضع التغيير إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، حتى تتجنب تعديلات المساعد إعادة تشغيل الحزمة الثقيلة الكاملة لذلك المجلد.
    - لدى `auto-reply` حاويات مخصصة لمساعدات النواة ذات المستوى الأعلى، واختبارات التكامل `reply.*` ذات المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. يقسم CI أيضا شجرة الرد الفرعية إلى تقسيمات agent-runner وdispatch وcommands/state-routing حتى لا تمتلك حاوية كثيفة الاستيراد واحدة ذيل Node بالكامل.
    - يتخطى CI العادي لطلبات PR/main عمدا مسح دفعات الإضافات وتقسيم `agentic-plugins` الخاص بالإصدار فقط. يطلق Full Release Validation سير العمل الفرعي المنفصل `Plugin Prerelease` لتلك الحزم الثقيلة بالـ Plugin/الإضافات على مرشحي الإصدار.

  </Accordion>

  <Accordion title="تغطية المشغل المضمن">

    - عندما تغير مدخلات اكتشاف أداة الرسائل أو سياق وقت تشغيل Compaction،
      أبق مستويي التغطية كليهما.
    - أضف حالات انحدار مركزة للمساعدين لحدود التوجيه والتطبيع
      النقية.
    - أبق حزم تكامل المشغل المضمن سليمة:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه الحزم من أن المعرّفات محددة النطاق وسلوك Compaction لا يزالان يتدفقان
      عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ اختبارات المساعد فقط
      ليست بديلا كافيا عن مسارات التكامل هذه.

  </Accordion>

  <Accordion title="افتراضيات تجمع Vitest والعزل">

    - يكون الإعداد الأساسي لـ Vitest افتراضيا على `threads`.
    - يثبت إعداد Vitest المشترك `isolate: false` ويستخدم المشغل
      غير المعزول عبر مشاريع الجذر، وe2e، والإعدادات الحية.
    - يحافظ مسار واجهة المستخدم الجذري على إعداد `jsdom` والمحسن، لكنه يعمل أيضا على
      المشغل غير المعزول المشترك.
    - يرث كل تقسيم `pnpm test` افتراضيات `threads` + `isolate: false`
      نفسها من إعداد Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node الفرعية الخاصة بـ Vitest
      افتراضيا لتقليل اضطراب ترجمة V8 أثناء التشغيلات المحلية الكبيرة.
      عيّن `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8
      القياسي.

  </Accordion>

  <Accordion title="التكرار المحلي السريع">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يطلقها فرق ما.
    - خطاف pre-commit مخصص للتنسيق فقط. يعيد إضافة الملفات المنسقة إلى منطقة التحضير ولا
      يشغل lint أو فحص الأنواع أو الاختبارات.
    - شغّل `pnpm check:changed` صراحة قبل التسليم أو الدفع عندما
      تحتاج إلى بوابة الفحص المحلي الذكي.
    - يمرر `pnpm test:changed` عبر مسارات رخيصة محددة النطاق افتراضيا. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر الوكيل
      أن تعديل عدة أو إعداد أو حزمة أو عقد يحتاج فعلا إلى تغطية Vitest
      أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه نفسه،
      لكن مع حد أعلى للعاملين.
    - التوسع التلقائي للعاملين المحليين محافظ عمدا ويتراجع
      عندما يكون متوسط حمل المضيف عاليا بالفعل، لذلك تسبب تشغيلات Vitest
      المتزامنة المتعددة ضررا أقل افتراضيا.
    - يعلّم إعداد Vitest الأساسي المشاريع/ملفات الإعداد كـ
      `forceRerunTriggers` حتى تبقى إعادة التشغيل في وضع التغيير صحيحة عندما تتغير
      توصيلات الاختبار.
    - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعلا على المضيفين المدعومين؛
      عيّن `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت
      موقع تخزين مؤقتا صريحا واحدا للتوصيف المباشر.

  </Accordion>

  <Accordion title="تصحيح أداء">

    - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى
      إخراج تفصيل الاستيراد.
    - يحدد `pnpm test:perf:imports:changed` عرض التوصيف نفسه إلى
      الملفات المتغيرة منذ `origin/main`.
    - تكتب بيانات توقيت التقسيم إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم تشغيلات الإعداد الكامل مسار الإعداد كمفتاح؛ وتلحق تقسيمات CI
      ذات نمط التضمين اسم التقسيم حتى يمكن تتبع التقسيمات المرشحة
      بشكل منفصل.
    - عندما يظل اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل،
      أبق الاعتمادات الثقيلة خلف حد محلي ضيق `*.runtime.ts` و
      اعمل mock لذلك الحد مباشرة بدلا من الاستيراد العميق لمساعدات وقت التشغيل فقط
      لتمريرها عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` تشغيل
      `test:changed` الموجّه بمسار مشروع الجذر الأصلي لذلك الفرق الملتزم به
      ويطبع زمن wall time بالإضافة إلى أقصى RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة المتسخة الحالية
      بتمرير قائمة الملفات المتغيرة عبر
      `scripts/test-projects.mjs` وإعداد Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لبدء تشغيل
      Vitest/Vite وتكاليف التحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغل من أجل
      حزمة الوحدات مع تعطيل التوازي على مستوى الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، مفروض على عامل واحد
- النطاق:
  - يبدأ Gateway حلقة رجوع حقيقيا مع تفعيل التشخيصات افتراضيا
  - يدفع اضطراب رسائل gateway والذاكرة والحمولات الكبيرة الاصطناعي عبر مسار الحدث التشخيصي
  - يستعلم `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات استمرار حزمة الاستقرار التشخيصية
  - يؤكد أن المسجل يبقى محدودا، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق قوائم الانتظار لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يتطلب مفاتيح
  - مسار ضيق لمتابعة انحدار الاستقرار، وليس بديلا عن حزمة Gateway الكاملة

### E2E (اختبار smoke للـ gateway)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts`، و`test/**/*.e2e.test.ts`، واختبارات E2E للـ Plugin المضمّنة تحت `extensions/`
- افتراضيات وقت التشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عاملين تكيفيين (CI: حتى 2، محليا: 1 افتراضيا).
  - يعمل في الوضع الصامت افتراضيا لتقليل عبء إدخال/إخراج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العاملين (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل إخراج وحدة التحكم المفصل.
- النطاق:
  - سلوك gateway متعدد النسخ من البداية إلى النهاية
  - أسطح WebSocket/HTTP، وإقران node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تفعيله في خط الأنابيب)
  - لا يتطلب مفاتيح حقيقية
  - أجزاء متحركة أكثر من اختبارات الوحدات (قد يكون أبطأ)

### E2E: اختبار smoke لخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ gateway OpenShell معزولا على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يختبر خلفية OpenShell الخاصة بـ OpenClaw عبر `sandbox ssh-config` + تنفيذ SSH حقيقيين
  - يتحقق من سلوك نظام الملفات المتعارف عليه عن بعد عبر جسر sandbox fs
- التوقعات:
  - اختياري فقط؛ ليس جزءا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محلي `openshell` بالإضافة إلى عفريت Docker عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمر gateway الاختبار والـ sandbox
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتفعيل الاختبار عند تشغيل حزمة e2e الأوسع يدويا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو سكربت wrapper

### حي (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`، و`test/**/*.live.test.ts`، واختبارات live للـ Plugin المضمّنة تحت `extensions/`
- الافتراضي: **مفعل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزود/النموذج فعلا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - التقاط تغييرات تنسيق المزود، وخصائص استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - ليس مستقرا لـ CI عن قصد (شبكات حقيقية، وسياسات مزودين حقيقية، وحصص، وانقطاعات)
  - يكلف مالا / يستخدم حدود المعدل
  - يفضل تشغيل مجموعات فرعية ضيقة بدلا من "كل شيء"
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيا، لا تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى منزل اختبار مؤقت حتى لا تستطيع تجهيزات الوحدات تعديل `~/.openclaw` الحقيقي.
- عيّن `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدا إلى أن تستخدم الاختبارات الحية دليل منزلك الحقيقي.
- أصبح `pnpm test:live` افتراضيا في وضع أهدأ: يحتفظ بإخراج التقدم `[live] ...`، لكنه يكتم إشعار `~/.profile` الإضافي ويسكت سجلات تمهيد gateway/ثرثرة Bonjour. عيّن `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بالمزود): عيّن `*_API_KEYS` بتنسيق مفصول بفواصل/فواصل منقوطة أو `*_API_KEY_1`، `*_API_KEY_2` (على سبيل المثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) أو تجاوزا لكل تشغيل حي عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حد المعدل.
- إخراج التقدم/Heartbeat:
  - تصدر الحزم الحية الآن أسطر تقدم إلى stderr بحيث تكون استدعاءات المزود الطويلة نشطة بشكل مرئي حتى عندما يكون التقاط وحدة تحكم Vitest هادئا.
  - يعطل `vitest.live.config.ts` اعتراض وحدة تحكم Vitest حتى تتدفق أسطر تقدم المزود/gateway فورا أثناء التشغيلات الحية.
  - اضبط Heartbeat النماذج المباشرة باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat gateway/المسبار باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي حزمة ينبغي أن أشغل؟ استخدم جدول القرار هذا:

- منطق التحرير/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- عند لمس شبكة Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح أخطاء “روبوتي متوقف” / إخفاقات خاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` مضيّق النطاق

## الاختبارات الحية (التي تلامس الشبكة)

لمصفوفة النماذج الحية، واختبارات التدخين لخلفية CLI، واختبارات التدخين لـ ACP، وحاضنة خادم تطبيق Codex، وجميع اختبارات مزوّدي الوسائط الحية (Deepgram، وBytePlus، وComfyUI، والصور، والموسيقى، والفيديو، وحاضنة الوسائط) — بالإضافة إلى التعامل مع بيانات الاعتماد للتشغيلات الحية — راجع
[اختبار الحزم الحية](/ar/help/testing-live). وللقائمة المخصصة للتحقق من التحديثات والتحقق من Plugin، راجع
[اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins).

## مشغّلات Docker (فحوص اختيارية لـ "هل يعمل في Linux")

تنقسم مشغّلات Docker هذه إلى فئتين:

- مشغّلات النماذج الحية: يشغّل `test:docker:live-models` و`test:docker:live-gateway` ملفهما الحي المطابق لمفتاح ملف التعريف فقط داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب مجلد الإعدادات المحلي ومساحة العمل لديك (ومصدر `~/.profile` إذا كان مركّبًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تفترض مشغّلات Docker الحية حدًا أصغر لاختبارات التدخين افتراضيًا بحيث يبقى المسح الكامل عبر Docker عمليًا:
  يفترض `test:docker:live-models` القيمة `OPENCLAW_LIVE_MAX_MODELS=12` افتراضيًا، ويفترض
  `test:docker:live-gateway` القيم `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` افتراضيًا. تجاوز متغيرات البيئة هذه عندما تريد
  صراحةً المسح الشامل الأكبر.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كأرشيف npm tarball عبر `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة العارية هي فقط مشغّل Node/Git لمسارات التثبيت/التحديث/اعتماديات Plugin؛ تركّب تلك المسارات أرشيف tarball المبني مسبقًا. تثبّت الصورة الوظيفية أرشيف tarball نفسه في `/app` لمسارات وظائف التطبيق المبني. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطّط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدوِلًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في خانات العمليات، بينما تمنع حدود الموارد مسارات الحي الثقيل، وتثبيت npm، والخدمات المتعددة من البدء كلها في الوقت نفسه. إذا كان مسار واحد أثقل من الحدود النشطة، فلا يزال بإمكان المجدوِل بدءه عندما يكون المجمّع فارغًا ثم يُبقيه يعمل وحده إلى أن تتوفر السعة مجددًا. القيم الافتراضية هي 10 خانات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ لا تضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` إلا عندما يكون لدى مضيف Docker هامش أكبر. يجري المشغّل فحصًا تمهيديًا لـ Docker افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزّن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون من دون بناء Docker أو تشغيله، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة، واحتياجات الحزم/الصور، وبيانات الاعتماد.
- `Package Acceptance` هي بوابة الحزمة الأصلية في GitHub للإجابة عن "هل يعمل أرشيف tarball القابل للتثبيت هذا كمنتج؟" فهي تحل حزمة مرشحة واحدة من `source=npm`، أو `source=ref`، أو `source=url`، أو `source=artifact`، وترفعها باسم `package-under-test`، ثم تشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد أرشيف tarball نفسه بدلًا من إعادة حزم المرجع المحدد. تُرتّب ملفات التعريف حسب الاتساع: `smoke`، و`package`، و`product`، و`full`. راجع [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins) لعقد الحزمة/التحديث/Plugin، ومصفوفة النجاة من الترقيات المنشورة، وافتراضات الإصدار، وفرز الإخفاقات.
- تشغّل فحوص البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يسير الحارس عبر الرسم البياني المبني الثابت من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا استورد بدء التشغيل قبل التوزيع اعتماديات الحزمة مثل Commander، أو واجهة المطالبة، أو undici، أو التسجيل قبل توزيع الأمر؛ كما يُبقي حزمة تشغيل Gateway المضمّنة ضمن الميزانية ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة. يغطي اختبار التدخين لـ CLI المعبأة أيضًا مساعدة الجذر، ومساعدة الإعداد الأولي، ومساعدة doctor، والحالة، ومخطط الإعدادات، وأمر قائمة النماذج.
- توافق `Package Acceptance` القديم محدد عند `2026.4.25` (مع تضمين `2026.4.25-beta.*`). حتى ذلك الحد، تتحمل الحاضنة فجوات بيانات التعريف الخاصة بالحزم المشحونة فقط: إدخالات مخزون QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وملفات التصحيح المفقودة في مثبت git المشتق من أرشيف tarball، وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة، وغياب استمرار سجلات تثبيت السوق، وترحيل بيانات تعريف الإعدادات أثناء `plugins update`. بالنسبة للحزم بعد `2026.4.25`، تكون تلك المسارات إخفاقات صارمة.
- مشغّلات تدخين الحاويات: يشغّل `test:docker:openwebui`، و`test:docker:onboard`، و`test:docker:npm-onboard-channel-agent`، و`test:docker:update-channel-switch`، و`test:docker:upgrade-survivor`، و`test:docker:published-upgrade-survivor`، و`test:docker:session-runtime-context`، و`test:docker:agents-delete-shared-workspace`، و`test:docker:gateway-network`، و`test:docker:browser-cdp-snapshot`، و`test:docker:mcp-channels`، و`test:docker:pi-bundle-mcp-tools`، و`test:docker:cron-mcp-cleanup`، و`test:docker:plugins`، و`test:docker:plugin-update`، و`test:docker:config-reload` حاوية حقيقية واحدة أو أكثر ويتحقق من مسارات التكامل الأعلى مستوى.

تركّب مشغّلات Docker للنماذج الحية أيضًا مجلدات مصادقة CLI المطلوبة فقط بنظام bind-mount (أو جميع المجلدات المدعومة عندما لا يكون التشغيل مضيّقًا)، ثم تنسخها إلى مجلد المنزل داخل الحاوية قبل التشغيل كي يتمكن OAuth الخاص بـ CLI الخارجي من تحديث الرموز من دون تعديل مخزن مصادقة المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكريبت: `scripts/test-live-models-docker.sh`)
- فحص دخان ربط ACP: `pnpm test:docker:live-acp-bind` (السكريبت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيًا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- فحص دخان خلفية CLI: `pnpm test:docker:live-cli-backend` (السكريبت: `scripts/test-live-cli-backend-docker.sh`)
- فحص دخان حزمة اختبار خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (السكريبت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكريبت: `scripts/test-live-gateway-models-docker.sh`)
- فحص دخان قابلية المراقبة: `pnpm qa:otel:smoke` هو مسار خاص لفحص مصدر QA من checkout. وهو ليس جزءًا من مسارات إصدار Docker للحزم عن قصد لأن حزمة npm tarball تحذف QA Lab.
- فحص دخان Open WebUI المباشر: `pnpm test:docker:openwebui` (السكريبت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، scaffolding كامل): `pnpm test:docker:onboard` (السكريبت: `scripts/e2e/onboard-docker.sh`)
- فحص دخان إعداد npm tarball للقناة/الوكيل: `pnpm test:docker:npm-onboard-channel-agent` يثبت حزمة OpenClaw tarball المعبأة عالميًا في Docker، ويكوّن OpenAI عبر إعداد أولي بإحالة env إضافة إلى Telegram افتراضيًا، ويشغّل doctor، ويشغّل دورة وكيل OpenAI واحدة بمحاكاة. أعد استخدام tarball مبني مسبقًا باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة بناء المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- فحص دخان تبديل قناة التحديث: `pnpm test:docker:update-channel-switch` يثبت حزمة OpenClaw tarball المعبأة عالميًا في Docker، وينتقل من حزمة `stable` إلى git `dev`، ويتحقق من استمرار القناة وعمل Plugin بعد التحديث، ثم يعود إلى حزمة `stable` ويتحقق من حالة التحديث.
- فحص دخان النجاة من الترقية: `pnpm test:docker:upgrade-survivor` يثبت حزمة OpenClaw tarball المعبأة فوق fixture لمستخدم قديم غير نظيف يحتوي على وكلاء، وتكوين قناة، وقوائم سماح Plugin، وحالة تبعيات Plugin قديمة، وملفات workspace/session موجودة. يشغّل تحديث الحزمة إضافة إلى doctor غير تفاعلي بدون مفاتيح مزود أو قناة مباشرة، ثم يبدأ Gateway عبر local loopback ويتحقق من حفظ التكوين/الحالة إضافة إلى ميزانيات بدء التشغيل/الحالة.
- فحص دخان النجاة من الترقية المنشورة: `pnpm test:docker:published-upgrade-survivor` يثبت `openclaw@latest` افتراضيًا، ويزرع ملفات مستخدم موجودة واقعية، ويكوّن خط الأساس ذلك بوصفة أوامر مضمّنة، ويتحقق من التكوين الناتج، ويحدّث ذلك التثبيت المنشور إلى tarball المرشح، ويشغّل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر local loopback ويتحقق من المقاصد المكوّنة، وحفظ الحالة، وبدء التشغيل، و`/healthz`، و`/readyz`، وميزانيات حالة RPC. تجاوز خط أساس واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، واطلب من المجدول التجميعي توسيع خطوط الأساس الدقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، ووسّع fixtures التي تشبه المشكلات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues`؛ يعرّض Package Acceptance هذه القيم باسم `published_upgrade_survivor_baseline`، و`published_upgrade_survivor_baselines`، و`published_upgrade_survivor_scenarios`.
- فحص دخان سياق وقت تشغيل الجلسة: `pnpm test:docker:session-runtime-context` يتحقق من استمرار transcript سياق وقت التشغيل المخفي إضافة إلى إصلاح doctor لفروع prompt-rewrite المكررة المتأثرة.
- فحص دخان تثبيت Bun العالمي: `bash scripts/e2e/bun-global-install-smoke.sh` يعبئ الشجرة الحالية، ويثبتها باستخدام `bun install -g` في home معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد مزودي الصور المضمّنين بدلًا من التعليق. أعد استخدام tarball مبني مسبقًا باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ بناء المضيف باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- فحص دخان مثبت Docker: `bash scripts/test-install-sh-docker.sh` يشارك مخبأ npm واحدًا بين حاويات root والتحديث وdirect-npm. يعتمد فحص دخان التحديث افتراضيًا على npm `latest` كخط أساس stable قبل الترقية إلى tarball المرشح. تجاوزه باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` محليًا، أو باستخدام إدخال `update_baseline_version` في workflow Install Smoke على GitHub. تحتفظ فحوصات المثبت غير الجذرية بمخبأ npm معزول كي لا تخفي إدخالات المخبأ المملوكة لـ root سلوك التثبيت المحلي للمستخدم. اضبط `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام مخبأ root/update/direct-npm عبر عمليات إعادة التشغيل المحلية.
- يتخطى Install Smoke CI التحديث العالمي direct-npm المكرر باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل السكريبت محليًا بدون هذا env عندما تكون تغطية `npm install -g` المباشرة مطلوبة.
- فحص دخان CLI لحذف وكلاء workspace مشترك: `pnpm test:docker:agents-delete-shared-workspace` (السكريبت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) يبني صورة Dockerfile الجذرية افتراضيًا، ويزرع وكيلين مع workspace واحد في home حاوية معزول، ويشغّل `agents delete --json`، ويتحقق من JSON صالح إضافة إلى سلوك الاحتفاظ بالـ workspace. أعد استخدام صورة install-smoke باستخدام `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway (حاويتان، مصادقة WS + صحة): `pnpm test:docker:gateway-network` (السكريبت: `scripts/e2e/gateway-network-docker.sh`)
- فحص دخان لقطة Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (السكريبت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) يبني صورة E2E المصدر إضافة إلى طبقة Chromium، ويبدأ Chromium مع CDP خام، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي عناوين URL للروابط، والعناصر القابلة للنقر المرقّاة بالمؤشر، ومراجع iframe، وبيانات frame metadata.
- انحدار OpenAI Responses web_search للاستدلال الأدنى: `pnpm test:docker:openai-web-search-minimal` (السكريبت: `scripts/e2e/openai-web-search-minimal-docker.sh`) يشغّل خادم OpenAI بمحاكاة عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط المزود ويتحقق من ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + فحص دخان raw Claude notification-frame): `pnpm test:docker:mcp-channels` (السكريبت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP في حزمة Pi (خادم MCP stdio حقيقي + فحص دخان السماح/الرفض لملف Pi المضمّن): `pnpm test:docker:pi-bundle-mcp-tools` (السكريبت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف MCP لـ Cron/الوكيل الفرعي (Gateway حقيقي + تفكيك ابن MCP عبر stdio بعد تشغيلات cron معزولة ووكيل فرعي لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكريبت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (فحص دخان التثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git المتحركة، وحزمة ClawHub الشاملة، وتحديثات marketplace، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (السكريبت: `scripts/e2e/plugins-docker.sh`)
  اضبط `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/وقت التشغيل الشامل الافتراضي باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم fixture محليًا معزولًا لـ ClawHub.
- فحص دخان تحديث Plugin بدون تغيير: `pnpm test:docker:plugin-update` (السكريبت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- فحص دخان بيانات تعريف إعادة تحميل التكوين: `pnpm test:docker:config-reload` (السكريبت: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: يغطي `pnpm test:docker:plugins` فحص دخان التثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git المتحركة، وfixtures ClawHub، وتحديثات marketplace، وتمكين/فحص حزمة Claude. يغطي `pnpm test:docker:plugin-update` سلوك التحديث غير المتغير لـ Plugins المثبتة.

للبناء المسبق وإعادة استخدام الصورة الوظيفية المشتركة يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بالحزم مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ذات أولوية عند ضبطها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكريبتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات QR ومثبت Docker بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت لا من وقت تشغيل التطبيق المبني المشترك.

يقوم مشغّلو Docker للنماذج المباشرة أيضًا بربط checkout الحالي للقراءة فقط وتهيئته في workdir مؤقت داخل الحاوية. هذا يبقي صورة وقت التشغيل صغيرة مع الاستمرار في تشغيل Vitest على المصدر/التكوين المحليين الدقيقين لديك. تتخطى خطوة التهيئة المخابئ المحلية الكبيرة فقط ومخرجات بناء التطبيق مثل `.pnpm-store`، و`.worktrees`، و`__openclaw_vitest__`، وأدلة `.build` المحلية للتطبيق أو مخرجات Gradle حتى لا تقضي تشغيلات Docker المباشرة دقائق في نسخ artifacts خاصة بالجهاز.
كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات Gateway المباشرة عمال قنوات Telegram/Discord/إلخ. حقيقيين داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذلك مرّر `OPENCLAW_LIVE_GATEWAY_*` أيضًا عندما تحتاج إلى تضييق تغطية Gateway المباشرة أو استبعادها من مسار Docker ذلك.
`test:docker:openwebui` هو فحص دخان توافق أعلى مستوى: يبدأ حاوية Gateway لـ OpenClaw مع تمكين نقاط نهاية HTTP المتوافقة مع OpenAI، ويبدأ حاوية Open WebUI مثبتة الإصدار تجاه ذلك Gateway، ويسجل الدخول عبر Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل طلب محادثة حقيقيًا عبر وكيل Open WebUI `/api/chat/completions`.
يمكن أن تكون أول عملية تشغيل أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب صورة Open WebUI وقد يحتاج Open WebUI إلى إكمال إعداد بدء التشغيل البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج مباشر صالحًا، و`OPENCLAW_PROFILE_FILE` (`~/.profile` افتراضيًا) هو الطريقة الأساسية لتوفيره في تشغيلات Dockerized.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model": "openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عن قصد ولا يحتاج إلى حساب Telegram أو Discord أو iMessage حقيقي. يقلع حاوية Gateway مزروعة، ويبدأ حاوية ثانية تشغّل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثة الموجهة، وقراءات transcript، وبيانات تعريف المرفقات، وسلوك طابور الأحداث المباشرة، وتوجيه الإرسال الصادر، وإشعارات القناة + الأذونات بأسلوب Claude عبر جسر MCP stdio الحقيقي. يفحص تحقق الإشعارات إطارات MCP الخام عبر stdio مباشرة حتى يتحقق فحص الدخان مما يبثه الجسر فعليًا، وليس فقط ما تصادف أن يعرضه SDK عميل محدد.
`test:docker:pi-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج مباشر. يبني صورة Docker للمستودع، ويبدأ خادم فحص MCP stdio حقيقيًا داخل الحاوية، ويجسّد ذلك الخادم عبر وقت تشغيل MCP لحزمة Pi المضمّنة، وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان بأدوات `bundle-mcp` بينما يقوم `minimal` و`tools.deny: ["bundle-mcp"]` بترشيحها.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج مباشر. يبدأ Gateway مزروعًا مع خادم فحص MCP stdio حقيقي، ويشغّل دورة Cron معزولة ودورة ابن لمرة واحدة عبر `/subagents spawn`، ثم يتحقق من خروج عملية MCP الابنة بعد كل تشغيل.

فحص دخان thread ACP باللغة العادية يدويًا (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكريبت لتدفقات عمل الانحدار/التصحيح. قد يلزم مرة أخرى للتحقق من توجيه thread في ACP، لذلك لا تحذفه.

متغيرات env مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) مركّب على `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) مركّب على `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) مركّب على `/home/node/.profile` ويتم تحميله قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المحمّلة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعدادات/مساحة عمل مؤقتة ومن دون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) مركّب على `/home/node/.npm-global` لتثبيتات CLI المخزّنة مؤقتًا داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - تشغيلات الموفّر المضيّقة تركّب فقط الأدلة/الملفات المطلوبة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز ذلك يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all`، أو `OPENCLAW_DOCKER_AUTH_DIRS=none`، أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية الموفّرين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لإعادات التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن الملف الشخصي (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لاختبار دخان Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز مطالبة فحص nonce المستخدمة بواسطة اختبار دخان Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبّت

## فحص سلامة الوثائق

شغّل فحوصات الوثائق بعد تعديلات الوثائق: `pnpm check:docs`.
شغّل تحقق Mintlify الكامل من المراسي عندما تحتاج أيضًا إلى فحوصات عناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## ارتداد بلا اتصال (آمن لـ CI)

هذه ارتدادات "مسار حقيقي" من دون موفّرين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة وكيل): `src/gateway/gateway.test.ts` (الحالة: "تشغّل استدعاء أداة OpenAI وهميًا من البداية إلى النهاية عبر حلقة وكيل Gateway")
- معالج Gateway (WS `wizard.start`/`wizard.next`، يكتب الإعدادات + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "يشغّل المعالج عبر ws ويكتب إعدادات رمز المصادقة")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء أدوات وهمي عبر Gateway الحقيقي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات المعالج من البداية إلى النهاية التي تتحقق من ربط الجلسة وتأثيرات الإعدادات (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودًا لـ Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في المطالبة، هل يختار الوكيل Skills الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الجولات تؤكد ترتيب الأدوات، واستمرارية سجل الجلسة، وحدود الصندوق الرملي.

ينبغي أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم موفّرين وهميين لتأكيد استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skills، وربط الجلسة.
- مجموعة صغيرة من السيناريوهات المركزة على Skills (استخدام مقابل تجنب، بوابات، حقن المطالبات).
- تقييمات حية اختيارية (اختيارية ومقيّدة بالبيئة) فقط بعد أن تصبح المجموعة الآمنة لـ CI موجودة.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجّلين يلتزمان بعقد
واجهتهما. تمرّ على كل Plugins المكتشفة وتشغّل مجموعة من تأكيدات
الشكل والسلوك. يتخطى مسار الوحدات الافتراضي `pnpm test` عمدًا
ملفات seam المشتركة وملفات الدخان هذه؛ شغّل أوامر العقود صراحة
عندما تلمس أسطح القنوات أو الموفّرين المشتركة.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود الموفّرين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

موجودة في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - شكل Plugin الأساسي (المعرّف، الاسم، القدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرّف السلسلة
- **directory** - واجهة API للدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة الموفّر

موجودة في `src/plugins/contracts/*.contract.test.ts`.

- **status** - مجسّات حالة القناة
- **registry** - شكل سجل Plugin

### عقود الموفّر

موجودة في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة API لفهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل الموفّر
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تشغّلها

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة Plugin قناة أو موفّر أو تعديله
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة ارتدادات (إرشادات)

عندما تصلح مشكلة موفّر/نموذج مكتشفة في التشغيل الحي:

- أضف ارتدادًا آمنًا لـ CI إن أمكن (موفّر وهمي/بديل، أو التقط تحويل شكل الطلب بدقة)
- إذا كانت بطبيعتها حية فقط (حدود معدل، سياسات مصادقة)، فأبقِ الاختبار الحي ضيقًا واختياريًا عبر متغيرات البيئة
- فضّل استهداف أصغر طبقة تلتقط الخلل:
  - خلل تحويل/إعادة تشغيل طلب الموفّر → اختبار نماذج مباشر
  - خلل مسار جلسة/سجل/أدوات Gateway → اختبار دخان حي لـ Gateway أو اختبار Gateway وهمي آمن لـ CI
- حاجز حماية عبور SecretRef:
  - يستمد `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا واحدًا مأخوذًا كعينة لكل فئة SecretRef من بيانات السجل الوصفية (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرّفات exec ذات مقاطع العبور.
  - إذا أضفت عائلة أهداف SecretRef جديدة ذات `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند معرّفات أهداف غير مصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذات صلة

- [اختبار التشغيل الحي](/ar/help/testing-live)
- [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)
- [CI](/ar/ci)
