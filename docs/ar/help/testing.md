---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات الانحدار لأخطاء النموذج/المزوّد
    - تصحيح أخطاء سلوك Gateway + الوكيل
summary: 'مجموعة الاختبار: حِزم اختبارات الوحدة/e2e/المباشرة، ومشغلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-05-03T21:37:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7fb57bee958c4e6243f02193a657d7b19ca633c7a27f70eac6b590931390671
    source_path: help/testing.md
    workflow: 16
---

OpenClaw لديه ثلاث حزم Vitest (وحدة/تكامل، e2e، مباشر) ومجموعة صغيرة
من مشغلات Docker. هذا المستند هو دليل "كيف نختبر":

- ما تغطيه كل حزمة (وما تتعمد _عدم_ تغطيته).
- الأوامر التي يجب تشغيلها لسير العمل الشائع (محليًا، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات المباشرة بيانات الاعتماد وتختار النماذج/المزوّدين.
- كيف تضيف اختبارات انحدار لمشكلات النماذج/المزوّدين الواقعية.

<Note>
**حزمة QA (qa-lab، qa-channel، مسارات النقل المباشر)** موثقة بشكل منفصل:

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) — البنية، سطح الأوامر، تأليف السيناريوهات.
- [Matrix QA](/ar/concepts/qa-matrix) — مرجع لـ `pnpm openclaw qa matrix`.
- [قناة QA](/ar/channels/qa-channel) — Plugin النقل الاصطناعي المستخدم بواسطة السيناريوهات المدعومة من المستودع.

تغطي هذه الصفحة تشغيل حزم الاختبار العادية ومشغلات Docker/Parallels. يسرد قسم المشغلات الخاصة بـ QA أدناه ([المشغلات الخاصة بـ QA](#qa-specific-runners)) استدعاءات `qa` المحددة ويعيدك إلى المراجع أعلاه.
</Note>

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل محلي أسرع للحزمة الكاملة على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- الاستهداف المباشر للملفات يوجه الآن مسارات الامتداد/القناة أيضًا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تعمل على فشل واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA المدعوم بـ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- حزمة E2E: `pnpm test:e2e`

عند تصحيح المزوّدين/النماذج الحقيقية (يتطلب بيانات اعتماد حقيقية):

- الحزمة المباشرة (النماذج + اختبارات Gateway للأدوات/الصور): `pnpm test:live`
- استهدف ملفًا مباشرًا واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- تقارير أداء وقت التشغيل: أرسل `OpenClaw Performance` مع
  `live_gpt54=true` لدورة وكيل حقيقية باستخدام `openai/gpt-5.4` أو
  `deep_profile=true` لمخرجات Kova الخاصة بالمعالج/الذاكرة/التتبع. تنشر التشغيلات اليومية المجدولة
  مخرجات مسارات mock-provider وdeep-profile وGPT 5.4 إلى
  `openclaw/clawgrit-reports` عندما يكون `CLAWGRIT_REPORTS_TOKEN` مضبوطًا. كما
  يتضمن تقرير mock-provider أرقام تمهيد Gateway على مستوى المصدر، والذاكرة،
  وضغط Plugin، وحلقة hello-loop متكررة بنموذج زائف، وبدء تشغيل CLI.
- مسح النماذج المباشر عبر Docker: `pnpm test:docker:live-models`
  - يشغّل كل نموذج محدد دورة نصية بالإضافة إلى اختبار صغير بأسلوب قراءة ملف.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغّل أيضًا دورة صورة صغيرة.
    عطّل الاختبارات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل إخفاقات المزوّد.
  - تغطية CI: يستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومي و
    `OpenClaw Release Checks` اليدوي سير عمل live/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، والذي يتضمن مهام مصفوفة منفصلة للنماذج المباشرة عبر Docker
    مقسمة حسب المزوّد.
  - لإعادات تشغيل CI مركزة، أرسل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و `live_models_only: true`.
  - أضف أسرار المزوّدين عالية الإشارة الجديدة إلى `scripts/ci-hydrate-live-auth.sh`
    بالإضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيها
    المجدولين/الخاصة بالإصدار.
- اختبار دخان للدردشة المربوطة الأصلية في Codex: `pnpm test:docker:live-codex-bind`
  - يشغّل مسار Docker مباشرًا مقابل مسار خادم تطبيق Codex، ويربط رسالة Slack DM اصطناعية
    باستخدام `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من مرور رد عادي ومرفق صورة
    عبر ربط Plugin الأصلي بدلًا من ACP.
- اختبار دخان لحاضنة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغّل دورات وكيل Gateway عبر حاضنة خادم تطبيق Codex المملوكة لـ Plugin،
    ويتحقق من `/codex status` و `/codex models`، ويمارس افتراضيًا اختبارات الصورة،
    وCron MCP، والوكيل الفرعي، وGuardian. عطّل اختبار الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل إخفاقات أخرى في
    خادم تطبيق Codex. لفحص مركّز للوكيل الفرعي، عطّل الاختبارات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد اختبار الوكيل الفرعي ما لم يتم ضبط
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- اختبار دخان لأمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري زائد الاحتياط لسطح أمر الإنقاذ في قناة الرسائل.
    يمارس `/crestodian status`، ويضع تغيير نموذج دائمًا في قائمة الانتظار،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعداد.
- اختبار دخان لمخطط Crestodian عبر Docker: `pnpm test:docker:crestodian-planner`
  - يشغّل Crestodian في حاوية بلا إعدادات مع Claude CLI زائف على `PATH`
    ويتحقق من أن احتياطي المخطط التقريبي يترجم إلى كتابة إعدادات typed مدققة.
- اختبار دخان لأول تشغيل لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من دليل حالة OpenClaw فارغ، ويوجه `openclaw` المجرد إلى
    Crestodian، ويطبق إعدادات setup/model/agent/Discord plugin + SecretRef،
    ويتحقق من الإعدادات، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضًا في QA Lab بواسطة
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- اختبار دخان لتكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مع `moonshot/kimi-k2.6`. تحقق من أن JSON يبلّغ عن Moonshot/K2.6 وأن
  سجل المساعد يخزن `usage.cost` المطبع.

<Tip>
عندما تحتاج إلى حالة فشل واحدة فقط، فضّل تضييق الاختبارات المباشرة عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## المشغلات الخاصة بـ QA

تقع هذه الأوامر بجانب حزم الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغّل CI مختبر QA Lab في سير عمل مخصصة. يكون تكافؤ الوكلاء متداخلًا تحت
`QA-Lab - All Lanes` والتحقق من الإصدار، وليس سير عمل PR مستقلًا.
يجب أن يستخدم التحقق الواسع `Full Release Validation` مع
`rerun_group=qa-parity` أو مجموعة QA الخاصة بفحوصات الإصدار. يشغّل `QA-Lab - All Lanes`
ليلًا على `main` ومن الإرسال اليدوي مع مسار تكافؤ mock، ومسار Matrix المباشر،
ومسار Telegram المباشر المدار بواسطة Convex، ومسار Discord المباشر المدار بواسطة Convex
كمهام متوازية. تمرر QA المجدولة وفحوصات الإصدار خيار Matrix
`--profile fast` صراحة، بينما تظل القيمة الافتراضية لـ Matrix CLI ومدخل سير العمل اليدوي
`all`؛ يمكن للإرسال اليدوي تقسيم `all` إلى مهام `transport`،
و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`. يشغّل `OpenClaw Release
Checks` التكافؤ بالإضافة إلى مسارات Matrix السريعة وTelegram قبل موافقة الإصدار،
باستخدام `mock-openai/gpt-5.5` لفحوصات نقل الإصدار كي تبقى
حتمية وتتجنب بدء تشغيل Plugin المزوّد العادي. تعطل Gateways النقل المباشر هذه
بحث الذاكرة؛ يظل سلوك الذاكرة مغطى بواسطة حزم تكافؤ QA.

تستخدم أجزاء وسائط الإصدار المباشر الكاملة
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، والتي تحتوي مسبقًا على
`ffmpeg` و `ffprobe`. تستخدم أجزاء النماذج/الخلفيات المباشرة عبر Docker صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
التزام محدد، ثم تسحبها باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلًا من إعادة بنائها
داخل كل جزء.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات ضمان الجودة المدعومة بالمستودع مباشرةً على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمال Gateway معزولين. يكون `qa-channel` افتراضيًا بتزامن 4 (مقيّد بعدد السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد العمال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما تريد الحصول على القطع الأثرية دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`. يبدأ `aimock` خادم مزوّد محلي مدعومًا بـ AIMock لتغطية تجريبية للتجهيزات وبروتوكولات المحاكاة دون استبدال مسار `mock-openai` الواعي بالسيناريوهات.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل اختبار قياس بدء تشغيل Gateway إضافةً إلى حزمة صغيرة من سيناريوهات QA Lab المحاكية (`channel-chat-baseline` و`memory-failure-fallback` و`gateway-restart-inflight-run`) ويكتب ملخص ملاحظة CPU مدمجًا ضمن `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم افتراضيًا ملاحظات CPU الساخنة المستمرة فقط (`--cpu-core-warn` إضافةً إلى `--hot-wall-warn-ms`)، لذلك تُسجَّل دفعات بدء التشغيل القصيرة كمقاييس دون أن تبدو كانحدار تثبيت Gateway الممتد لدقائق.
  - يستخدم قطع `dist` الأثرية المبنية؛ شغّل البناء أولًا عندما لا تحتوي نسخة العمل بالفعل على مخرجات تشغيل حديثة.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل حزمة ضمان الجودة نفسها داخل آلة Multipass Linux افتراضية قابلة للتخلص منها.
  - يحافظ على سلوك اختيار السيناريوهات نفسه كما في `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزوّد/النموذج نفسها كما في `qa suite`.
  - تمرّر عمليات التشغيل الحية مدخلات مصادقة ضمان الجودة المدعومة والعملية للضيف:
    مفاتيح المزوّد المستندة إلى البيئة، ومسار إعداد مزوّد ضمان الجودة الحي، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى مجلدات الإخراج ضمن جذر المستودع كي يتمكن الضيف من الكتابة عائدًا عبر
    مساحة العمل المثبّتة.
  - يكتب تقرير ضمان الجودة والملخص العاديين إضافةً إلى سجلات Multipass ضمن
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع ضمان الجودة المدعوم بـ Docker لأعمال ضمان الجودة بأسلوب المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني أرشيف npm من نسخة العمل الحالية، ويثبته عالميًا في Docker، ويشغّل إعداد مفتاح OpenAI API غير التفاعلي، ويهيئ Telegram افتراضيًا، ويتحقق من أن وقت تشغيل Plugin المعبأ يتم تحميله دون إصلاح تبعيات بدء التشغيل، ويشغّل doctor، ويشغّل دورة وكيل محلية واحدة ضد نقطة نهاية OpenAI محاكية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ نفسه مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل اختبار Docker حتميًا للتطبيق المبني لنصوص سياق وقت التشغيل المضمّن. يتحقق من أن سياق وقت تشغيل OpenClaw المخفي يُحفَظ كرسالة مخصصة غير معروضة بدلًا من التسرب إلى دورة المستخدم المرئية، ثم يزرع ملف JSONL لجلسة معطلة متأثرة ويتحقق من أن `openclaw doctor --fix` يعيد كتابته إلى الفرع النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبّت مرشح حزمة OpenClaw في Docker، ويشغّل إعداد الحزمة المثبتة، ويهيئ Telegram عبر CLI المثبّت، ثم يعيد استخدام مسار ضمان الجودة الحي لـ Telegram مع تلك الحزمة المثبتة بوصفها SUT Gateway.
  - يكون الافتراضي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛ عيّن `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار أرشيف محلي محلول بدلًا من التثبيت من السجل.
  - يستخدم بيانات اعتماد بيئة Telegram نفسها أو مصدر بيانات اعتماد Convex نفسه كما في `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، عيّن `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` إضافةً إلى `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. إذا كان `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI، يختار غلاف Docker Convex تلقائيًا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` قيمة `OPENCLAW_QA_CREDENTIAL_ROLE` المشتركة لهذا المسار فقط.
  - تعرض GitHub Actions هذا المسار كسير عمل يدوي للمشرفين باسم `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة `qa-live-shared` واستئجارات بيانات اعتماد Convex لـ CI.
- تعرض GitHub Actions أيضًا `Package Acceptance` لإثبات المنتج كتشغيل جانبي ضد حزمة مرشحة واحدة. يقبل مرجعًا موثوقًا، أو مواصفة npm منشورة، أو رابط أرشيف HTTPS مع SHA-256، أو قطعة أثرية لأرشيف من تشغيل آخر، ويرفع `openclaw-current.tgz` المُطبّع باسم `package-under-test`، ثم يشغّل مجدول Docker E2E الحالي بملفات تعريف مسارات دخان، أو حزمة، أو منتج، أو كامل، أو مخصص. عيّن `telegram_mode=mock-openai` أو `live-frontier` لتشغيل سير عمل ضمان الجودة لـ Telegram ضد قطعة `package-under-test` الأثرية نفسها.
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

- ينزّل إثبات القطعة الأثرية أرشيفًا من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - يعبئ بناء OpenClaw الحالي ويثبته في Docker، ويبدأ Gateway مع تهيئة OpenAI، ثم يمكّن القنوات/Plugins المجمّعة عبر تعديلات الإعداد.
  - يتحقق من أن اكتشاف الإعداد يترك Plugins القابلة للتنزيل غير المهيأة غائبة، وأن أول إصلاح doctor مهيأ يثبّت كل Plugin قابل للتنزيل مفقود صراحةً، وأن إعادة التشغيل الثانية لا تشغّل إصلاح تبعيات مخفيًا.
  - يثبّت أيضًا خط أساس npm أقدم معروفًا، ويمكّن Telegram قبل تشغيل `openclaw update --tag <candidate>`، ويتحقق من أن doctor بعد التحديث الخاص بالمرشح ينظف بقايا تبعيات Plugin القديمة دون إصلاح postinstall من جانب حزام الاختبار.
- `pnpm test:parallels:npm-update`
  - يشغّل اختبار دخان تحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. يثبّت كل نظام أساسي محدد أولًا حزمة خط الأساس المطلوبة، ثم يشغّل أمر `openclaw update` المثبت في الضيف نفسه ويتحقق من الإصدار المثبت، وحالة التحديث، وجاهزية Gateway، ودورة وكيل محلية واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux` أثناء التكرار على ضيف واحد. استخدم `--json` لمسار قطعة الملخص الأثرية وحالة كل مسار.
  - يستخدم مسار OpenAI `openai/gpt-5.5` لإثبات دورة الوكيل الحية افتراضيًا. مرّر `--model <provider/model>` أو عيّن `OPENCLAW_PARALLELS_OPENAI_MODEL` عند التحقق عمدًا من نموذج OpenAI آخر.
  - لفّ عمليات التشغيل المحلية الطويلة بمهلة مضيف حتى لا تستهلك توقفات نقل Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسارات متداخلة ضمن `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي عالق.
  - قد يستغرق تحديث Windows من 10 إلى 15 دقيقة في أعمال doctor بعد التحديث وتحديث الحزم على ضيف بارد؛ يظل ذلك صحيًا عندما يكون سجل تصحيح npm المتداخل يتقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات دخان Parallels الفردية لـ macOS أو Windows أو Linux. فهي تشترك في حالة VM ويمكن أن تتصادم عند استعادة اللقطة، أو تقديم الحزمة، أو حالة Gateway للضيف.
  - يشغّل إثبات ما بعد التحديث سطح Plugin المجمّع العادي لأن واجهات القدرة مثل الكلام وتوليد الصور وفهم الوسائط تُحمّل عبر واجهات API وقت التشغيل المجمّعة حتى عندما تتحقق دورة الوكيل نفسها من رد نصي بسيط فقط.

- `pnpm openclaw qa aimock`
  - يبدأ خادم مزوّد AIMock المحلي فقط لاختبار دخان البروتوكول المباشر.
- `pnpm openclaw qa matrix`
  - يشغّل مسار ضمان الجودة الحي لـ Matrix ضد خادم Tuwunel homeserver مدعوم بـ Docker وقابل للتخلص منه. نسخة المصدر فقط — لا تشحن التثبيتات المعبأة `qa-lab`.
  - CLI الكامل، وكتالوج الملف الشخصي/السيناريو، ومتغيرات البيئة، وتخطيط القطع الأثرية: [ضمان جودة Matrix](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار ضمان الجودة الحي لـ Telegram ضد مجموعة خاصة حقيقية باستخدام رموز بوت المشغّل وSUT من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرف المجموعة هو معرف محادثة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات اعتماد مجمّعة مشتركة. استخدم وضع البيئة افتراضيًا، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في الاستئجارات المجمّعة.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما تريد الحصول على القطع الأثرية دون رمز خروج فاشل.
  - يتطلب بوتين مختلفين في المجموعة الخاصة نفسها، مع أن يعرّض بوت SUT اسم مستخدم Telegram.
  - لملاحظة مستقرة بين بوت وبوت، فعّل وضع تواصل Bot-to-Bot في `@BotFather` لكلا البوتين وتأكد من أن بوت المشغّل يمكنه ملاحظة مرور بوتات المجموعة.
  - يكتب تقرير ضمان جودة Telegram، وملخصًا، وقطعة أثرية للرسائل المرصودة ضمن `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال المشغّل إلى رد SUT المرصود.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ توجد مصفوفة تغطية كل مسار في [نظرة عامة على ضمان الجودة ← تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). يُعد `qa-channel` الحزمة الاصطناعية الواسعة وليس جزءًا من تلك المصفوفة.

### بيانات اعتماد Telegram المشتركة عبر Convex (v1)

عند تمكين `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل مختبر ضمان الجودة على استئجار حصري من مجمع مدعوم بـ Convex، ويرسل Heartbeat
لذلك الاستئجار أثناء تشغيل المسار، ويحرر الاستئجار عند إيقاف التشغيل.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - افتراضي البيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (يكون افتراضيًا `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL لـ Convex عبر `http://` على local loopback للتطوير المحلي فقط.

ينبغي أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL`‏ `https://` في التشغيل العادي.

تتطلب أوامر إدارة المشرفين (إضافة/إزالة/عرض المجمع)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل عمليات التشغيل الحية للتحقق من رابط موقع Convex، وأسرار الوسيط،
وبادئة نقطة النهاية، ومهلة HTTP، وقابلية الوصول إلى الإدارة/القائمة دون طباعة
قيم الأسرار. استخدم `--json` لمخرجات قابلة للقراءة آليًا في السكربتات وأدوات CI.

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
- `POST /admin/add` (سرّ المشرف فقط)
  - الطلب: `{ kind, actorId, payload, note?, status? }`
  - النجاح: `{ status: "ok", credential }`
- `POST /admin/remove` (سرّ المشرف فقط)
  - الطلب: `{ credentialId, actorId }`
  - النجاح: `{ status: "ok", changed, credential }`
  - حارس التأجير النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سرّ المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة رقمية لمعرّف دردشة Telegram.
- يتحقق `admin/add` من هذا الشكل عند `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

### إضافة قناة إلى QA

توجد أسماء البنية ومساعدات السيناريو لمهايئات القنوات الجديدة في [نظرة عامة على QA ← إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: تنفيذ مشغّل النقل على وصلة مضيف `qa-lab` المشتركة، والتصريح عن `qaRunners` في بيان Plugin، وتركيبه كـ `openclaw qa <runner>`، وتأليف السيناريوهات ضمن `qa/scenarios/`.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكّر في المجموعات على أنها «واقعية متزايدة» (ومعها زيادة في الهشاشة/التكلفة):

### الوحدة / التكامل (افتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم التشغيلات غير المستهدفة مجموعة الشظايا `vitest.full-*.config.ts` وقد توسّع الشظايا متعددة المشاريع إلى إعدادات لكل مشروع لجدولة متوازية
- الملفات: مخزونات الوحدة/النواة ضمن `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`؛ تعمل اختبارات وحدة واجهة المستخدم في شظية `unit-ui` المخصصة
- النطاق:
  - اختبارات وحدة صرفة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، التوجيه، الأدوات، التحليل، الإعداد)
  - انحدارات حتمية للأخطاء المعروفة
- التوقعات:
  - يعمل في CI
  - لا يتطلب مفاتيح حقيقية
  - ينبغي أن يكون سريعًا ومستقرًا
  - يجب أن تثبت اختبارات المحلِّل ومحمّل السطح العام سلوك الرجوع الواسع لـ `api.js` و
    `runtime-api.js` باستخدام تجهيزات Plugin صغيرة مولّدة، وليس
    واجهات API لمصدر Plugin حقيقي مضمّن. تنتمي تحميلات API الحقيقية للـ Plugin إلى
    مجموعات العقود/التكامل المملوكة للـ Plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - يشغّل `pnpm test` غير المستهدف اثني عشر إعداد شظايا أصغر (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) بدل عملية مشروع جذري أصلية واحدة ضخمة. هذا يقلل ذروة RSS على الأجهزة المحمّلة ويتجنب أن تحرم أعمال الرد التلقائي/الإضافات المجموعات غير المرتبطة من الموارد.
    - لا يزال `pnpm test --watch` يستخدم مخطط مشروع `vitest.config.ts` الجذري الأصلي، لأن حلقة مراقبة متعددة الشظايا ليست عملية.
    - يوجّه `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/المجلدات الصريحة عبر المسارات المحددة أولًا، لذا يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع تكلفة بدء المشروع الجذري الكاملة.
    - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى مسارات محددة رخيصة افتراضيًا: تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، والمعتمدات المحلية في مخطط الاستيراد. لا تؤدي تعديلات الإعداد/التهيئة/الحزمة إلى تشغيل واسع للاختبارات إلا إذا استخدمت صراحة `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هو بوابة الفحص المحلية الذكية المعتادة للأعمال الضيقة. يصنف الفرق إلى النواة، واختبارات النواة، والإضافات، واختبارات الإضافات، والتطبيقات، والوثائق، وبيانات تعريف الإصدار، وأدوات Docker الحية، والأدوات، ثم يشغّل أوامر فحص الأنواع والlint والحراس المطابقة. لا يشغّل اختبارات Vitest؛ استدعِ `pnpm test:changed` أو `pnpm test <target>` الصريح لإثبات الاختبار. تشغّل زيادات الإصدار التي تخص بيانات تعريف الإصدار فقط فحوصات مستهدفة للإصدار/الإعداد/اعتماد الجذر، مع حارس يرفض تغييرات الحزمة خارج حقل الإصدار في المستوى الأعلى.
    - تشغّل تعديلات عدة ACP الحية في Docker فحوصات مركّزة: صياغة shell لسكربتات مصادقة Docker الحية، وتشغيلًا تجريبيًا جافًا لمجدول Docker الحي. لا تُدرج تغييرات `package.json` إلا عندما يقتصر الفرق على `scripts["test:docker:live-*"]`؛ أما تعديلات الاعتماد والتصدير والإصدار وسطح الحزمة الأخرى فما زالت تستخدم الحراس الأوسع.
    - تُوجَّه اختبارات الوحدة خفيفة الاستيراد من الوكلاء، والأوامر، والـ plugins، ومساعدات الرد التلقائي، و`plugin-sdk`، ومناطق الأدوات الصرفة المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ تبقى الملفات ذات الحالة/الثقيلة وقت التشغيل على المسارات الموجودة.
    - تعيّن ملفات مصدر مساعدة مختارة من `plugin-sdk` و`commands` أيضًا تشغيلات وضع التغيير إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، لتتجنب تعديلات المساعدات إعادة تشغيل المجموعة الثقيلة الكاملة لذلك المجلد.
    - لدى `auto-reply` حاويات مخصصة لمساعدات النواة في المستوى الأعلى، واختبارات تكامل `reply.*` في المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. يقسم CI كذلك الشجرة الفرعية للرد إلى شظايا agent-runner، وdispatch، وcommands/state-routing حتى لا تمتلك حاوية ثقيلة الاستيراد واحدة ذيل Node الكامل.
    - يتخطى CI العادي للـ PR/main عمدًا مسح دفعة الإضافات وشظية `agentic-plugins` الخاصة بالإصدار فقط. يرسل التحقق الكامل من الإصدار سير العمل الفرعي المنفصل `Plugin Prerelease` لتلك المجموعات الثقيلة بالـ plugin/extension على مرشحي الإصدار.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - عند تغيير مدخلات اكتشاف أداة الرسائل أو سياق وقت تشغيل
      Compaction، أبقِ مستويي التغطية كليهما.
    - أضف انحدارات مساعدة مركّزة لحدود التوجيه والتطبيع
      الصرفة.
    - حافظ على سلامة مجموعات تكامل المشغّل المضمّن:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق تلك المجموعات من أن المعرّفات المحددة وسلوك Compaction ما زالا يتدفقان
      عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ اختبارات المساعدات فقط
      ليست بديلًا كافيًا لتلك مسارات التكامل.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - يعتمد إعداد Vitest الأساسي افتراضيًا على `threads`.
    - يثبت إعداد Vitest المشترك `isolate: false` ويستخدم
      المشغّل غير المعزول عبر المشاريع الجذرية، وe2e، والإعدادات الحية.
    - يحتفظ مسار واجهة المستخدم الجذري بإعداد `jsdom` والمحسّن الخاص به، لكنه يعمل
      أيضًا على المشغّل غير المعزول المشترك.
    - ترث كل شظية `pnpm test` افتراضيات `threads` + `isolate: false`
      نفسها من إعداد Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node الفرعية
      الخاصة بـ Vitest افتراضيًا لتقليل اضطراب ترجمة V8 أثناء التشغيلات المحلية الكبيرة.
      عيّن `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8
      القياسي.

  </Accordion>

  <Accordion title="Fast local iteration">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يفعّلها الفرق.
    - خطاف ما قبل الالتزام مخصص للتنسيق فقط. يعيد تجهيز الملفات المنسقة ولا
      يشغّل lint أو فحص الأنواع أو الاختبارات.
    - شغّل `pnpm check:changed` صراحة قبل التسليم أو الدفع عندما
      تحتاج إلى بوابة الفحص المحلية الذكية.
    - يوجّه `pnpm test:changed` عبر مسارات محددة رخيصة افتراضيًا. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر الوكيل
      أن تعديل عدة أو إعداد أو حزمة أو عقد يحتاج فعلًا إلى تغطية
      Vitest أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه نفسه،
      لكن بسقف عمال أعلى.
    - التوسيع التلقائي المحلي للعمال محافظ عمدًا ويتراجع
      عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، لذا تسبب تشغيلات
      Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
    - يعلّم إعداد Vitest الأساسي المشاريع/ملفات الإعداد كـ
      `forceRerunTriggers` حتى تبقى إعادة التشغيل في وضع التغيير صحيحة عندما تتغير
      وصلات الاختبار.
    - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفين المدعومين؛
      عيّن `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت
      موقع ذاكرة مخبئية صريحًا واحدًا للتنميط المباشر.

  </Accordion>

  <Accordion title="Perf debugging">

    - يفعّل `pnpm test:perf:imports` تقارير مدة استيراد Vitest بالإضافة إلى
      مخرجات تفصيل الاستيراد.
    - يحدد `pnpm test:perf:imports:changed` عرض التنميط نفسه إلى
      الملفات المتغيرة منذ `origin/main`.
    - تُكتب بيانات توقيت الشظايا إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم تشغيلات الإعداد الكامل مسار الإعداد كمفتاح؛ وتلحق شظايا CI ذات نمط التضمين
      اسم الشظية حتى يمكن تتبع الشظايا المفلترة
      بشكل منفصل.
    - عندما يظل اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل،
      أبقِ الاعتمادات الثقيلة خلف وصلة محلية ضيقة `*.runtime.ts` و
      حاكِ تلك الوصلة مباشرة بدل الاستيراد العميق لمساعدات وقت التشغيل لمجرد
      تمريرها عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` تشغيل
      `test:changed` الموجّه بمسار المشروع الجذري الأصلي لذلك الفرق الملتزم
      ويطبع زمن الجدار بالإضافة إلى أقصى RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة المتسخة الحالية
      عبر توجيه قائمة الملفات المتغيرة من خلال
      `scripts/test-projects.mjs` وإعداد Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تنميط CPU للخيط الرئيسي من أجل
      كلفة بدء Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تنميط CPU+heap للمشغّل من أجل
      مجموعة الوحدة مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، مجبر على عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا عبر local loopback مع تفعيل التشخيصات افتراضيًا
  - يدفع اضطراب رسائل Gateway والذاكرة والحمولات الكبيرة الاصطناعي عبر مسار حدث التشخيص
  - يستعلم عن `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات حفظ حزمة استقرار التشخيص
  - يؤكد أن المسجّل يبقى محدودًا، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق الطوابير لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يتطلب مفاتيح
  - مسار ضيق لمتابعة انحدار الاستقرار، وليس بديلًا لمجموعة Gateway الكاملة

### E2E (اختبار Smoke للـ Gateway)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات E2E للـ bundled-plugin ضمن `extensions/`
- افتراضات وقت التشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، مطابقًا لبقية المستودع.
  - يستخدم عمالًا تكيفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل كلفة إدخال/إخراج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بسقف 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل مخرجات وحدة التحكم المطوّلة.
- النطاق:
  - سلوك Gateway متعدد النسخ من البداية إلى النهاية
  - أسطح WebSocket/HTTP، وإقران node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تفعيله في خط المعالجة)
  - لا يتطلب مفاتيح حقيقية
  - أجزاء متحركة أكثر من اختبارات الوحدة (قد يكون أبطأ)

### E2E: اختبار Smoke لخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ Gateway معزولًا لـ OpenShell على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يختبر واجهة OpenClaw الخلفية لـ OpenShell عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات ذي المسار القانوني البعيد عبر جسر fs في sandbox
- التوقعات:
  - اختياري فقط؛ ليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا لـ `openshell` بالإضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر Gateway الاختبار وsandbox
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI تنفيذي أو سكربت تغليف غير افتراضي

### مباشر (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات bundled-plugin المباشرة ضمن `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - «هل يعمل هذا المزود/النموذج فعليًا _اليوم_ باستخدام اعتمادات حقيقية؟»
  - التقاط تغييرات تنسيق المزود، وخصوصيات استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر في CI عن قصد (شبكات حقيقية، سياسات مزودين حقيقية، حصص، انقطاعات)
  - يكلّف مالًا / يستخدم حدود المعدل
  - يفضّل تشغيل مجموعات فرعية أضيق بدلًا من «كل شيء»
- تشغّل عمليات التشغيل المباشرة `~/.profile` مصدرًا لالتقاط مفاتيح API المفقودة.
- افتراضيًا، تظل عمليات التشغيل المباشرة تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى مجلد home اختباري مؤقت حتى لا تتمكن fixtures الوحدة من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات المباشرة دليل home الحقيقي لديك.
- أصبح `pnpm test:live` يستخدم افتراضيًا وضعًا أهدأ: يحتفظ بمخرجات التقدم `[live] ...`، لكنه يكتم إشعار `~/.profile` الإضافي وسجلات تمهيد Gateway/ثرثرة Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بالمزود): اضبط `*_API_KEYS` بتنسيق مفصول بفواصل/فواصل منقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (مثلًا `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو تجاوزًا لكل تشغيل مباشر عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- مخرجات التقدم/Heartbeat:
  - تصدر المجموعات المباشرة الآن أسطر تقدم إلى stderr بحيث تبقى استدعاءات المزود الطويلة ظاهرة كنشطة حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة تحكم Vitest حتى تتدفق أسطر تقدم المزود/Gateway فورًا أثناء عمليات التشغيل المباشرة.
  - اضبط Heartbeat النماذج المباشرة باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat Gateway/الفحص باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح «البوت الخاص بي متوقف» / إخفاقات خاصة بالمزود / استدعاء الأدوات: شغّل `pnpm test:live` بنطاق ضيق

## اختبارات مباشرة (تلامس الشبكة)

لمصفوفة النماذج المباشرة، واختبارات smoke لواجهة CLI الخلفية، واختبارات smoke لـ ACP، وحزمة اختبار خادم تطبيق Codex، وجميع اختبارات مزودي الوسائط المباشرة (Deepgram وBytePlus وComfyUI والصور والموسيقى والفيديو وحزمة اختبار الوسائط) — بالإضافة إلى التعامل مع الاعتمادات لعمليات التشغيل المباشرة — راجع
[اختبار المجموعات المباشرة](/ar/help/testing-live). لقائمة التحقق المخصصة للتحديث و
التحقق من Plugin، راجع
[اختبار التحديثات وplugins](/ar/help/testing-updates-plugins).

## مشغلات Docker (فحوصات اختيارية لـ "يعمل على Linux")

تنقسم مشغلات Docker هذه إلى فئتين:

- مشغلات النماذج المباشرة: يشغّل `test:docker:live-models` و`test:docker:live-gateway` فقط ملف live المطابق لمفتاح ملف التعريف داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعداد المحلي ومساحة العمل لديك (وتشغيل `~/.profile` مصدرًا إذا كان مركبًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغلات Docker المباشرة افتراضيًا حد smoke أصغر حتى يبقى مسح Docker الكامل عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة هذه عندما تريد
  صراحةً الفحص الشامل الأكبر.
- يبني `test:docker:all` صورة Docker المباشرة مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كـ npm tarball من خلال `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة العارية هي فقط مشغل Node/Git لمسارات التثبيت/التحديث/اعتمادية Plugin؛ وتركّب تلك المسارات tarball المبني مسبقًا. تثبّت الصورة الوظيفية tarball نفسه في `/app` لمسارات وظائف التطبيق المبني. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في فتحات العمليات، بينما تمنع حدود الموارد بدء المسارات الثقيلة المباشرة ومسارات تثبيت npm والمسارات متعددة الخدمات كلها في وقت واحد. إذا كان مسار واحد أثقل من الحدود النشطة، لا يزال بإمكان المجدول بدءه عندما يكون الحوض فارغًا ثم يبقيه يعمل وحده حتى تتوفر السعة مجددًا. القيم الافتراضية هي 10 فتحات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما يكون لدى مضيف Docker هامش أكبر. يجري المشغل فحصًا تمهيديًا لـ Docker افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في عمليات التشغيل اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون دون بناء Docker أو تشغيله، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة، واحتياجات الحزمة/الصورة، والاعتمادات.
- `Package Acceptance` هي بوابة الحزمة الأصلية في GitHub لسؤال "هل تعمل هذه tarball القابلة للتثبيت كمنتج؟" تحلّ مرشح حزمة واحدًا من `source=npm` أو `source=ref` أو `source=url` أو `source=artifact`، وترفعه باسم `package-under-test`، ثم تشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد تلك tarball الدقيقة بدلًا من إعادة حزم المرجع المحدد. تُرتّب ملفات التعريف حسب الاتساع: `smoke` و`package` و`product` و`full`. راجع [اختبار التحديثات وplugins](/ar/help/testing-updates-plugins) لعقد الحزمة/التحديث/Plugin، ومصفوفة ناجي الترقية المنشورة، وافتراضيات الإصدار، وفرز الإخفاقات.
- تشغّل فحوصات البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يسير الحارس عبر الرسم البياني المبني الثابت من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا كانت واردات بدء التشغيل قبل الإرسال تستورد اعتماديات الحزمة مثل Commander أو واجهة prompt أو undici أو التسجيل قبل إرسال الأمر؛ كما يبقي جزء تشغيل Gateway المضمّن ضمن الميزانية ويرفض الواردات الثابتة لمسارات Gateway الباردة المعروفة. يغطي اختبار smoke لـ CLI المعبأ أيضًا تعليمات الجذر، وتعليمات onboard، وتعليمات doctor، والحالة، ومخطط الإعداد، وأمر قائمة نماذج.
- توافق `Package Acceptance` القديم محدد عند `2026.4.25` (بما في ذلك `2026.4.25-beta.*`). حتى ذلك الحد، تتسامح الحزمة مع فجوات بيانات التعريف الخاصة بالحزم المشحونة فقط: إدخالات مخزون QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات patch في fixture git المشتقة من tarball، وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة، وغياب استمرار سجل تثبيت السوق، وترحيل بيانات تعريف الإعداد أثناء `plugins update`. بالنسبة للحزم بعد `2026.4.25`، تكون هذه المسارات إخفاقات صارمة.
- مشغلات smoke للحاويات: `test:docker:openwebui` و`test:docker:onboard` و`test:docker:npm-onboard-channel-agent` و`test:docker:update-channel-switch` و`test:docker:upgrade-survivor` و`test:docker:published-upgrade-survivor` و`test:docker:session-runtime-context` و`test:docker:agents-delete-shared-workspace` و`test:docker:gateway-network` و`test:docker:browser-cdp-snapshot` و`test:docker:mcp-channels` و`test:docker:pi-bundle-mcp-tools` و`test:docker:cron-mcp-cleanup` و`test:docker:plugins` و`test:docker:plugin-update` و`test:docker:plugin-lifecycle-matrix` و`test:docker:config-reload` تمهّد حاوية حقيقية واحدة أو أكثر وتتحقق من مسارات تكامل أعلى مستوى.

تركّب مشغلات Docker للنماذج المباشرة أيضًا فقط أدلة home لمصادقة CLI المطلوبة (أو جميع الأدلة المدعومة عندما لا يكون التشغيل مضيقًا)، ثم تنسخها إلى home الحاوية قبل التشغيل حتى يتمكن OAuth الخاص بـ CLI الخارجي من تحديث الرموز دون تعديل مخزن مصادقة المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- فحص ACP bind smoke: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيًا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- فحص CLI backend smoke: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- فحص Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- فحص قابلية المراقبة smoke: `pnpm qa:otel:smoke` هو مسار QA خاص لسحب المصدر. لا يكون عمدًا جزءًا من مسارات إصدار Docker للحزمة لأن أرشيف npm tarball يحذف QA Lab.
- فحص Open WebUI live smoke: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، إنشاء هيكل كامل): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- فحص إعداد npm tarball/channel/agent smoke: يثبّت `pnpm test:docker:npm-onboard-channel-agent` أرشيف OpenClaw tarball المعبأ عالميًا في Docker، ويهيئ OpenAI عبر إعداد أولي بمرجع بيئي مع Telegram افتراضيًا، ويشغّل doctor، ويشغّل دورة وكيل OpenAI واحدة بمحاكاة. أعد استخدام أرشيف tarball مبني مسبقًا باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تجاوز إعادة بناء المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل channel باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- فحص تبديل channel التحديث smoke: يثبّت `pnpm test:docker:update-channel-switch` أرشيف OpenClaw tarball المعبأ عالميًا في Docker، ثم يبدّل من حزمة `stable` إلى git `dev`، ويتحقق من عمل channel المحفوظ وPlugin بعد التحديث، ثم يبدّل مرة أخرى إلى حزمة `stable` ويتحقق من حالة التحديث.
- فحص ناجي الترقية smoke: يثبّت `pnpm test:docker:upgrade-survivor` أرشيف OpenClaw tarball المعبأ فوق fixture مستخدم قديم غير نظيف يحتوي على وكلاء، وإعداد channel، وقوائم سماح Plugin، وحالة اعتماد Plugin قديمة، وملفات مساحة عمل/جلسة موجودة. يشغّل تحديث الحزمة إضافة إلى doctor غير تفاعلي دون مفاتيح مزود live أو channel، ثم يبدأ Gateway عبر loopback ويتحقق من حفظ الإعداد/الحالة إضافة إلى ميزانيات بدء التشغيل/الحالة.
- فحص ناجي الترقية المنشورة smoke: يثبّت `pnpm test:docker:published-upgrade-survivor` الحزمة `openclaw@latest` افتراضيًا، وينشئ ملفات واقعية لمستخدم موجود، ويهيئ خط الأساس ذلك بوصفة أوامر مضمّنة، ويتحقق من الإعداد الناتج، ويحدّث ذلك التثبيت المنشور إلى أرشيف tarball المرشح، ويشغّل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر loopback ويتحقق من المقاصد المهيأة، وحفظ الحالة، وبدء التشغيل، و`/healthz`، و`/readyz`، وميزانيات حالة RPC. تجاوز خط أساس واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، أو اطلب من المجدول التجميعي توسيع خطوط الأساس الدقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `all-since-2026.4.23`، ووسّع fixtures ذات شكل البلاغات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues`؛ تتضمن مجموعة reported-issues الحالة `configured-plugin-installs` لإصلاح تثبيت Plugin خارجي من OpenClaw تلقائيًا. يعرّض Package Acceptance هذه القيم باسم `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`.
- فحص سياق وقت تشغيل الجلسة smoke: يتحقق `pnpm test:docker:session-runtime-context` من استمرار transcript سياق وقت التشغيل المخفي إضافة إلى إصلاح doctor لفروع إعادة كتابة prompt المكررة المتأثرة.
- فحص تثبيت Bun العالمي smoke: يحزم `bash scripts/e2e/bun-global-install-smoke.sh` الشجرة الحالية، ويثبتها باستخدام `bun install -g` في home معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد مزودي صور مضمّنين بدلًا من التعليق. أعد استخدام أرشيف tarball مبني مسبقًا باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تجاوز بناء المضيف باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- فحص Docker للمثبّت smoke: يشارك `bash scripts/test-install-sh-docker.sh` ذاكرة تخزين npm مؤقتة واحدة عبر حاويات root والتحديث وdirect-npm. يفترض فحص التحديث smoke استخدام npm `latest` كخط أساس stable قبل الترقية إلى أرشيف tarball المرشح. تجاوز ذلك باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` محليًا، أو باستخدام إدخال `update_baseline_version` الخاص بسير عمل Install Smoke على GitHub. تحتفظ فحوصات المثبّت لغير root بذاكرة تخزين npm مؤقتة معزولة حتى لا تخفي إدخالات الذاكرة المؤقتة المملوكة لـ root سلوك التثبيت المحلي للمستخدم. عيّن `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة التخزين المؤقت root/update/direct-npm عبر الإعادات المحلية.
- يتجاوز Install Smoke CI التحديث العالمي المكرر عبر direct-npm باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل السكربت محليًا بدون ذلك المتغير البيئي عندما تكون تغطية `npm install -g` المباشرة مطلوبة.
- فحص CLI smoke لحذف مساحة العمل المشتركة للوكلاء: `pnpm test:docker:agents-delete-shared-workspace` (السكربت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) يبني صورة Dockerfile الجذر افتراضيًا، وينشئ وكيلين بمساحة عمل واحدة في home حاوية معزول، ويشغّل `agents delete --json`، ويتحقق من JSON صالح إضافة إلى سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke باستخدام `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- فحص لقطة Browser CDP smoke: يبني `pnpm test:docker:browser-cdp-snapshot` (السكربت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) صورة source E2E إضافة إلى طبقة Chromium، ويبدأ Chromium باستخدام CDP خام، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات دور CDP تغطي عناوين URL للروابط، والعناصر القابلة للنقر المرفوعة بالمؤشر، ومراجع iframe، وبيانات تعريف frame.
- ارتداد OpenAI Responses web_search للحد الأدنى من reasoning: يشغّل `pnpm test:docker:openai-web-search-minimal` (السكربت: `scripts/e2e/openai-web-search-minimal-docker.sh`) خادم OpenAI بمحاكاة عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط المزود ويتحقق من ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway ممهّد + جسر stdio + فحص smoke لإطار إشعار Claude خام): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات Pi bundle MCP (خادم stdio MCP حقيقي + فحص سماح/رفض profile Pi مضمّن): `pnpm test:docker:pi-bundle-mcp-tools` (السكربت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف Cron/subagent MCP (Gateway حقيقي + إنهاء child MCP عبر stdio بعد تشغيلات cron معزولة وsubagent لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكربت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (فحص smoke للتثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع اعتماديات مرفوعة، ومراجع git متحركة، وClawHub شامل، وتحديثات marketplace، وتمكين/فحص Claude-bundle): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)
  عيّن `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتجاوز كتلة ClawHub، أو تجاوز زوج الحزمة/وقت التشغيل الافتراضي الشامل باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم fixture محليًا معزولًا لـ ClawHub.
- فحص Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (السكربت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- فحص مصفوفة دورة حياة Plugin smoke: يثبّت `pnpm test:docker:plugin-lifecycle-matrix` أرشيف OpenClaw tarball المعبأ في حاوية bare، ويثبّت Plugin من npm، ويبدّل enable/disable، ويرقيه ويخفضه عبر سجل npm محلي، ويحذف الشيفرة المثبتة، ثم يتحقق من أن uninstall لا يزال يزيل الحالة القديمة مع تسجيل مقاييس RSS/CPU لكل مرحلة من مراحل دورة الحياة.
- فحص بيانات تعريف إعادة تحميل الإعداد smoke: `pnpm test:docker:config-reload` (السكربت: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: يغطي `pnpm test:docker:plugins` فحص smoke للتثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع اعتماديات مرفوعة، ومراجع git متحركة، وfixtures من ClawHub، وتحديثات marketplace، وتمكين/فحص Claude-bundle. يغطي `pnpm test:docker:plugin-update` سلوك التحديث غير المتغير للـ plugins المثبتة. يغطي `pnpm test:docker:plugin-lifecycle-matrix` تثبيت Plugin من npm مع تتبع الموارد، وتمكينه، وتعطيله، وترقيته، وخفضه، وإلغاء تثبيته عند فقدان الشيفرة.

للبناء المسبق وإعادة استخدام الصورة الوظيفية المشتركة يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بالمجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` هي ذات الأولوية عند تعيينها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكربتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات QR وDocker للمثبّت بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلًا من وقت تشغيل التطبيق المبني المشترك.

تعمل مشغلات Docker للنماذج الحية أيضا على ربط checkout الحالي للقراءة فقط وتهيئته في دليل عمل مؤقت داخل الحاوية. يحافظ هذا على صورة runtime صغيرة مع الاستمرار في تشغيل Vitest على مصدر/إعداداتك المحلية الدقيقة. تتخطى خطوة التهيئة ذاكرات التخزين المؤقت المحلية الكبيرة ومخرجات بناء التطبيق مثل `.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` المحلية للتطبيق أو مخرجات Gradle، حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ artifacts خاصة بالجهاز.
كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ مجسات Gateway الحية عمال قنوات Telegram/Discord/إلخ. حقيقيين داخل الحاوية.
ما زال `test:docker:live-models` يشغل `pnpm test:live`، لذا مرر أيضا `OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق تغطية Gateway الحية أو استبعادها من ذلك مسار Docker.
`test:docker:openwebui` هو فحص توافق أعلى مستوى: يبدأ حاوية Gateway من OpenClaw مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI، ويبدأ حاوية Open WebUI مثبتة على إصدار محدد مقابل ذلك Gateway، ويسجل الدخول عبر Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل طلب دردشة حقيقيا عبر وكيل Open WebUI عند `/api/chat/completions`.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب صورة Open WebUI وقد يحتاج Open WebUI إلى إكمال إعداد البدء البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج حي صالحا، ويعد `OPENCLAW_PROFILE_FILE` (`~/.profile` افتراضيا) الطريقة الأساسية لتوفيره في التشغيلات داخل Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عمدا ولا يحتاج إلى حساب Telegram أو Discord أو iMessage حقيقي. يشغل حاوية Gateway مزروعة بالبيانات، ويبدأ حاوية ثانية تولد `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجهة، وقراءات transcript، وبيانات مرفقات metadata، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة + الأذونات بأسلوب Claude عبر جسر stdio MCP الحقيقي. يفحص تحقق الإشعارات إطارات stdio MCP الخام مباشرة حتى يثبت الفحص ما يصدره الجسر فعلا، وليس فقط ما يحدث أن يعرضه SDK عميل محدد.
`test:docker:pi-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج حي. يبني صورة Docker للمستودع، ويبدأ خادم فحص stdio MCP حقيقيا داخل الحاوية، ويمثل ذلك الخادم عبر runtime MCP المضمن في حزمة Pi، وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان بأدوات `bundle-mcp` بينما ترشحها `minimal` و`tools.deny: ["bundle-mcp"]`.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج حي. يبدأ Gateway مزروعا ببيانات مع خادم فحص stdio MCP حقيقي، ويشغل دورة cron معزولة ودورة فرعية لمرة واحدة عبر `/subagents spawn`، ثم يتحقق من خروج عملية MCP الفرعية بعد كل تشغيل.

فحص يدوي لخيط ACP بلغة طبيعية (ليس ضمن CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لسير عمل regression/debug. قد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه خيوط ACP، لذلك لا تحذفه.

متغيرات بيئة مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) مثبت إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) مثبت إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) مثبت إلى `/home/node/.profile` ويتم تحميله قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المحملة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعدادات/مساحة عمل مؤقتة ومن دون تثبيتات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) مثبت إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتا داخل Docker
- تثبت أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - تثبت تشغيلات الموفرين المضيقة فقط الأدلة/الملفات المطلوبة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز ذلك يدويا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لترشيح الموفرين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لإعادات التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن الملف الشخصي (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لفحص Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز prompt تحقق nonce المستخدم بواسطة فحص Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبت

## تحقق سلامة المستندات

شغل فحوصات المستندات بعد تعديلات المستندات: `pnpm check:docs`.
شغل تحقق Mintlify الكامل من anchors عندما تحتاج أيضا إلى فحوصات عناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## Regression دون اتصال (آمن لـ CI)

هذه regressions “مسار حقيقي” من دون موفرين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، gateway حقيقي + حلقة وكيل): `src/gateway/gateway.test.ts` (الحالة: "يشغل استدعاء أداة OpenAI وهميا من البداية إلى النهاية عبر حلقة وكيل gateway")
- معالج Gateway (WS `wizard.start`/`wizard.next`، يكتب الإعدادات + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "يشغل المعالج عبر ws ويكتب إعدادات رمز المصادقة")

## تقييمات موثوقية الوكيل (skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل “تقييمات موثوقية الوكيل”:

- استدعاء أدوات وهمي عبر gateway الحقيقي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات معالج من البداية إلى النهاية تتحقق من توصيل الجلسة وتأثيرات الإعدادات (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودا لـ skills (انظر [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تكون skills مدرجة في prompt، هل يختار الوكيل skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تؤكد ترتيب الأدوات، واستمرارية سجل الجلسة، وحدود sandbox.

ينبغي أن تبقى التقييمات المستقبلية حتمية أولا:

- مشغل سيناريوهات يستخدم موفرين وهميين لتأكيد استدعاءات الأدوات + ترتيبها، وقراءات ملفات skill، وتوصيل الجلسة.
- مجموعة صغيرة من سيناريوهات مركزة على skill (استخدام مقابل تجنب، gating، prompt injection).
- تقييمات حية اختيارية (اختيارية ومقيدة بمتغيرات البيئة) فقط بعد وجود المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل plugin والقناة)

تتحقق اختبارات العقود من أن كل plugin وقناة مسجلين يلتزمان بعقد الواجهة الخاص بهما. تمر على كل plugins المكتشفة وتشغل مجموعة من تأكيدات الشكل والسلوك. يتخطى مسار وحدات `pnpm test` الافتراضي عمدا ملفات الفحص وshared seam هذه؛ شغل أوامر العقود صراحة عندما تلمس أسطح القناة المشتركة أو الموفر.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود الموفرين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

موجودة في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - شكل Plugin الأساسي (id، name، capabilities)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرف الخيط
- **directory** - واجهة API للدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة الموفرين

موجودة في `src/plugins/contracts/*.contract.test.ts`.

- **status** - مجسات حالة القناة
- **registry** - شكل سجل Plugin

### عقود الموفرين

موجودة في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة API لفهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - runtime الموفر
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تشغلها

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة أو تعديل Plugin قناة أو موفر
- بعد refactoring تسجيل Plugin أو اكتشافه

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة regressions (إرشادات)

عندما تصلح مشكلة موفر/نموذج مكتشفة في التشغيل الحي:

- أضف regression آمنا لـ CI إن أمكن (موفر وهمي/بديل، أو التقاط تحويل شكل الطلب الدقيق)
- إذا كان بطبيعته حيا فقط (حدود المعدل، سياسات المصادقة)، فاجعل الاختبار الحي ضيقا واختياريا عبر متغيرات البيئة
- فضل استهداف أصغر طبقة تلتقط الخلل:
  - خلل تحويل/إعادة تشغيل طلب الموفر → اختبار نماذج مباشر
  - خلل مسار جلسة/سجل/أداة gateway → فحص gateway حي أو اختبار gateway وهمي آمن لـ CI
- حاجز SecretRef traversal:
  - يشتق `src/secrets/exec-secret-ref-id-parity.test.ts` هدفا واحدا مأخوذا عينة لكل فئة SecretRef من metadata السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرفات exec ذات مقاطع traversal.
  - إذا أضفت عائلة أهداف SecretRef جديدة ذات `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدا عند معرفات أهداف غير مصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذو صلة

- [اختبار التشغيل الحي](/ar/help/testing-live)
- [اختبار التحديثات وplugins](/ar/help/testing-updates-plugins)
- [CI](/ar/ci)
