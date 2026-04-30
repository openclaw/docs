---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النماذج/المزوّدين
    - تصحيح أخطاء سلوك Gateway + الوكيل
summary: 'مجموعة أدوات الاختبار: مجموعات اختبارات الوحدات وe2e والاختبارات الحية، ومشغّلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-30T08:05:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

يحتوي OpenClaw على ثلاث مجموعات Vitest (وحدة/تكامل، e2e، مباشرة) ومجموعة صغيرة
من مشغلات Docker. هذا المستند دليل "كيف نختبر":

- ما تغطيه كل مجموعة (وما تتعمد _عدم_ تغطيته).
- أي أوامر يجب تشغيلها لسير العمل الشائع (محليًا، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات المباشرة بيانات الاعتماد وتختار النماذج/المزوّدين.
- كيف تضيف اختبارات تراجع لمشكلات النماذج/المزوّدين الواقعية.

<Note>
**مكدس QA (qa-lab، qa-channel، مسارات النقل المباشر)** موثق بشكل منفصل:

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) — البنية، سطح الأوامر، تأليف السيناريوهات.
- [Matrix QA](/ar/concepts/qa-matrix) — مرجع لـ `pnpm openclaw qa matrix`.
- [قناة QA](/ar/channels/qa-channel) — Plugin النقل الاصطناعي المستخدم بواسطة السيناريوهات المدعومة بالمستودع.

تغطي هذه الصفحة تشغيل مجموعات الاختبار العادية ومشغلات Docker/Parallels. يسرد قسم مشغلات QA المحددة أدناه ([مشغلات خاصة بـ QA](#qa-specific-runners)) استدعاءات `qa` الملموسة ويشير مجددًا إلى المراجع أعلاه.
</Note>

## بدء سريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع للمجموعة الكاملة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest المباشرة: `pnpm test:watch`
- الاستهداف المباشر للملفات يوجّه الآن مسارات الامتدادات/القنوات أيضًا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تكرر العمل على فشل واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA المدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح مزوّدين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة المباشرة (النماذج + فحوصات Gateway للأدوات/الصور): `pnpm test:live`
- استهداف ملف مباشر واحد بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- مسح نماذج Docker المباشر: `pnpm test:docker:live-models`
  - يشغّل كل نموذج محدد دورة نصية إضافة إلى فحص صغير بأسلوب قراءة ملف.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغّل أيضًا دورة صورة صغيرة.
    عطّل الفحوصات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل إخفاقات المزوّد.
  - تغطية CI: تستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومية و
    `OpenClaw Release Checks` اليدوية سير عمل live/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، وهو ما يتضمن مهام مصفوفة منفصلة لنماذج Docker المباشرة
    مقسمة حسب المزوّد.
  - لإعادة تشغيل CI المركزة، شغّل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و `live_models_only: true`.
  - أضف أسرار المزوّد عالية الإشارة الجديدة إلى `scripts/ci-hydrate-live-auth.sh`
    إضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/الخاصين بالإصدار.
- فحص دخان محادثة Codex الأصلية المرتبطة: `pnpm test:docker:live-codex-bind`
  - يشغّل مسار Docker مباشرًا ضد مسار خادم تطبيق Codex، ويربط رسالة Slack DM اصطناعية
    عبر `/codex bind`، ويجرب `/codex fast` و
    `/codex permissions`، ثم يتحقق من توجيه رد عادي ومرفق صورة
    عبر ربط Plugin الأصلي بدلًا من ACP.
- فحص دخان حاضنة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغّل دورات وكيل Gateway عبر حاضنة خادم تطبيق Codex المملوكة لـ Plugin،
    ويتحقق من `/codex status` و `/codex models`، وبشكل افتراضي يجرب فحوصات الصورة
    وCron MCP والوكيل الفرعي وGuardian. عطّل فحص الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل إخفاقات أخرى في
    خادم تطبيق Codex. لفحص مركز للوكيل الفرعي، عطّل الفحوصات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد فحص الوكيل الفرعي ما لم يتم تعيين
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- فحص دخان أمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري احتياطي لسطح أمر الإنقاذ في قناة الرسائل.
    يجرّب `/crestodian status`، ويضع تغيير نموذج دائمًا في الصف،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعدادات.
- فحص دخان Docker لمخطط Crestodian: `pnpm test:docker:crestodian-planner`
  - يشغّل Crestodian في حاوية بلا إعدادات مع Claude CLI وهمي على `PATH`
    ويتحقق من أن التراجع الغامض للمخطط يترجم إلى كتابة إعدادات typed مدققة.
- فحص دخان Docker للتشغيل الأول لـ Crestodian: `pnpm test:docker:crestodian-first-run`
  - يبدأ من دليل حالة OpenClaw فارغ، ويوجّه `openclaw` المجرد إلى
    Crestodian، ويطبق إعداد/نموذج/وكيل/Plugin Discord + كتابات SecretRef،
    ويتحقق من الإعدادات، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضًا في QA Lab بواسطة
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- فحص دخان تكلفة Moonshot/Kimi: مع تعيين `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مع `moonshot/kimi-k2.6`. تحقق من أن JSON يبلغ عن Moonshot/K2.6 وأن
  نص المساعد يخزن `usage.cost` الموحّد.

<Tip>
عندما تحتاج إلى حالة فاشلة واحدة فقط، فضّل تضييق الاختبارات المباشرة عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## مشغلات خاصة بـ QA

تقع هذه الأوامر بجانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغّل CI ‏QA Lab في سير عمل مخصصة. يعمل `Parity gate` على طلبات PR المطابقة
ومن التشغيل اليدوي مع مزوّدين وهميين. يعمل `QA-Lab - All Lanes` كل ليلة على
`main` ومن التشغيل اليدوي مع بوابة التكافؤ الوهمية، ومسار Matrix المباشر،
ومسار Telegram المباشر المُدار بواسطة Convex، ومسار Discord المباشر المُدار بواسطة Convex
كمهام متوازية. تمرر فحوصات QA المجدولة وفحوصات الإصدار `--profile fast` لـ Matrix
صراحةً، بينما تبقى القيم الافتراضية لمدخل CLI الخاص بـ Matrix وسير العمل اليدوي
`all`؛ ويمكن للتشغيل اليدوي تقسيم `all` إلى مهام `transport` و`media` و`e2ee-smoke`
و`e2ee-deep` و`e2ee-cli`. يشغّل `OpenClaw Release Checks` التكافؤ إضافة إلى
مسارات Matrix وTelegram السريعة قبل موافقة الإصدار، باستخدام
`mock-openai/gpt-5.5` لفحوصات نقل الإصدار بحيث تبقى حتمية
وتتجنب بدء تشغيل Plugin المزوّد المعتاد. تعطل Gateways النقل المباشر هذه
بحث الذاكرة؛ ويبقى سلوك الذاكرة مغطى بواسطة مجموعات تكافؤ QA.

تستخدم أجزاء وسائط الإصدار المباشرة الكاملة
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، والتي تحتوي مسبقًا على
`ffmpeg` و`ffprobe`. تستخدم أجزاء نماذج/خلفيات Docker المباشرة صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
commit محدد، ثم تسحبها باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلًا من إعادة البناء
داخل كل جزء.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة بالمستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمال Gateway معزولين.
    القيمة الافتراضية لـ `qa-channel` هي التزامن 4 (مقيدة بعدد السيناريوهات
    المحددة). استخدم `--concurrency <count>` لضبط عدد العمال،
    أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد القطع الأثرية دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم مزوّد محليًا مدعومًا بـ AIMock لتغطية تجريبية
    للثوابت وبروتوكول mock دون استبدال مسار `mock-openai` الواعي بالسيناريوهات.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل قياس بدء Gateway إضافة إلى حزمة صغيرة من سيناريوهات QA Lab الوهمية
    (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) ويكتب ملخص ملاحظة CPU مجمعًا
    تحت `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم فقط ملاحظات CPU الساخنة المستمرة افتراضيًا (`--cpu-core-warn`
    إضافة إلى `--hot-wall-warn-ms`)، لذا تُسجل اندفاعات بدء التشغيل القصيرة كمقاييس
    دون أن تبدو مثل تراجع انشغال Gateway لدقائق طويلة.
  - يستخدم قطع `dist` المبنية؛ شغّل البناء أولًا عندما لا تحتوي نسخة checkout
    على خرج تشغيل حديث مسبقًا.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل آلة Linux افتراضية مؤقتة من Multipass.
  - يحتفظ بسلوك اختيار السيناريوهات نفسه كما في `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزوّد/النموذج نفسها كما في `qa suite`.
  - تمرر التشغيلات المباشرة مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد القائمة على البيئة، ومسار إعداد مزوّد QA المباشر، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى أدلة الخرج تحت جذر المستودع حتى يتمكن الضيف من الكتابة مرة أخرى عبر
    مساحة العمل المركبة.
  - يكتب تقرير QA والملخص العاديين إضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لعمل QA بأسلوب المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني tarball لـ npm من نسخة checkout الحالية، ويثبته عالميًا في
    Docker، ويشغّل إلحاق مفتاح OpenAI API غير تفاعلي، ويعد Telegram
    افتراضيًا، ويتحقق من أن تمكين Plugin يثبت تبعيات التشغيل عند الطلب،
    ويشغّل doctor، ويشغّل دورة وكيل محلية واحدة ضد نقطة نهاية OpenAI
    وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ نفسه
    مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل فحص دخان Docker حتميًا للتطبيق المبني لنصوص سياق التشغيل المضمنة.
    يتحقق من أن سياق تشغيل OpenClaw المخفي يُحفظ كرسالة مخصصة غير معروضة
    بدلًا من التسرب إلى دورة المستخدم المرئية، ثم يزرع جلسة JSONL مكسورة متأثرة
    ويتحقق من أن `openclaw doctor --fix` يعيد كتابتها إلى الفرع النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبت حزمة مرشحة لـ OpenClaw في Docker، ويشغّل إلحاق الحزمة المثبتة،
    ويعد Telegram عبر CLI المثبت، ثم يعيد استخدام مسار QA المباشر لـ Telegram
    مع تلك الحزمة المثبتة بوصفها Gateway للنظام قيد الاختبار.
  - القيمة الافتراضية هي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛ عيّن
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار tarball محلي محلول بدلًا من
    التثبيت من السجل.
  - يستخدم بيانات اعتماد بيئة Telegram نفسها أو مصدر بيانات اعتماد Convex نفسه مثل
    `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، عيّن
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` إضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. إذا كان
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI،
    يختار غلاف Docker ‏Convex تلقائيًا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` قيمة
    `OPENCLAW_QA_CREDENTIAL_ROLE` المشتركة لهذا المسار فقط.
  - تعرض GitHub Actions هذا المسار أيضًا كسير عمل يدوي للمشرفين
    `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة
    `qa-live-shared` وإيجارات بيانات اعتماد Convex CI.
- تعرض GitHub Actions أيضًا `Package Acceptance` لإثبات المنتج كتجربة جانبية
  ضد حزمة مرشحة واحدة. يقبل مرجعًا موثوقًا، أو مواصفة npm منشورة،
  أو عنوان HTTPS لـ tarball مع SHA-256، أو قطعة tarball من تشغيل آخر، ويرفع
  `openclaw-current.tgz` الموحّد باسم `package-under-test`، ثم يشغّل مجدول
  Docker E2E الموجود بملفات تعريف مسارات smoke أو package أو product أو full أو custom.
  عيّن `telegram_mode=mock-openai` أو `live-frontier` لتشغيل سير عمل
  Telegram QA ضد قطعة `package-under-test` نفسها.
  - أحدث إثبات منتج beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات عنوان tarball URL محدد ملخصًا:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- ينزّل إثبات الأثر الفني أثراً فنياً من نوع tarball من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - يحزم تثبيت بنية OpenClaw الحالية ويثبتها في Docker، ويبدأ Gateway
    مع تكوين OpenAI، ثم يفعّل القنوات/Plugins المضمّنة عبر تعديلات
    التكوين.
  - يتحقق من أن اكتشاف الإعداد يترك تبعيات تشغيل Plugin غير المكوّنة
    غائبة، وأن أول تشغيل Gateway أو doctor مكوّن يثبّت تبعيات تشغيل كل
    Plugin مضمّن عند الطلب، وأن إعادة التشغيل الثانية لا تعيد تثبيت
    التبعيات التي سبق تفعيلها.
  - يثبّت أيضاً خط أساس أقدم معروفاً من npm، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن doctor بعد التحديث
    في المرشح يصلح تبعيات تشغيل القناة المضمّنة من دون إصلاح postinstall
    من جهة حزمة الاختبار.
- `pnpm test:parallels:npm-update`
  - يشغّل اختبار دخان تحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. يثبّت كل
    نظام أساسي محدد أولاً حزمة خط الأساس المطلوبة، ثم يشغّل أمر
    `openclaw update` المثبّت في الضيف نفسه ويتحقق من الإصدار المثبّت،
    وحالة التحديث، وجاهزية Gateway، ودورة وكيل محلي واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux` أثناء
    التكرار على ضيف واحد. استخدم `--json` لمسار أثر الملخص وحالة كل مسار.
  - يستخدم مسار OpenAI النموذج `openai/gpt-5.5` افتراضياً لإثبات دورة الوكيل
    الحية. مرّر `--model <provider/model>` أو اضبط
    `OPENCLAW_PARALLELS_OPENAI_MODEL` عند التحقق عمداً من نموذج OpenAI آخر.
  - غلّف التشغيلات المحلية الطويلة بمهلة زمنية على المضيف حتى لا تستهلك
    توقفات نقل Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات المسارات المتداخلة تحت `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي متوقف.
  - قد يستغرق تحديث Windows من 10 إلى 15 دقيقة في إصلاح doctor/تبعيات
    التشغيل بعد التحديث على ضيف بارد؛ يظل ذلك سليماً عندما يكون سجل تصحيح
    npm المتداخل يتقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات دخان Parallels الفردية
    على macOS أو Windows أو Linux. فهي تشترك في حالة VM وقد تتصادم في
    استعادة اللقطات، أو تقديم الحزم، أو حالة Gateway الضيف.
  - يشغّل إثبات ما بعد التحديث سطح Plugin المضمّن العادي لأن واجهات القدرات
    مثل الكلام، وتوليد الصور، وفهم الوسائط تُحمّل عبر واجهات API التشغيل
    المضمّنة حتى عندما لا تتحقق دورة الوكيل نفسها إلا من استجابة نصية بسيطة.

- `pnpm openclaw qa aimock`
  - يبدأ خادم موفّر AIMock المحلي فقط لاختبار دخان البروتوكول المباشر.
- `pnpm openclaw qa matrix`
  - يشغّل مسار ضمان الجودة الحي لـ Matrix مقابل خادم منازل Tuwunel مؤقت مدعوم بـ Docker. من نسخة المصدر فقط — لا تشحن التثبيتات المعبأة `qa-lab`.
  - CLI الكامل، وكتالوج الملفات الشخصية/السيناريوهات، ومتغيرات env، وتخطيط الآثار: [ضمان جودة Matrix](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار ضمان الجودة الحي لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رموز بوت المشغّل وSUT من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID`، و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`، و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف محادثة Telegram الرقمي.
  - يدعم `--credential-source convex` للاعتمادات المشتركة المجمّعة. استخدم وضع env افتراضياً، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في الإيجارات المجمّعة.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد آثاراً من دون رمز خروج فاشل.
  - يتطلب بوتين مميزين في المجموعة الخاصة نفسها، مع كشف بوت SUT عن اسم مستخدم Telegram.
  - لملاحظة مستقرة بين البوتات، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا البوتين وتأكد من أن بوت المشغّل يستطيع ملاحظة حركة مرور بوتات المجموعة.
  - يكتب تقرير ضمان جودة Telegram، وملخصاً، وأثر الرسائل المرصودة تحت `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال المشغّل إلى رد SUT المرصود.

تشترك مسارات النقل الحي في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ تعيش مصفوفة تغطية كل مسار في [نظرة عامة على ضمان الجودة → تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). يُعد `qa-channel` الحزمة الاصطناعية الواسعة وليس جزءاً من تلك المصفوفة.

### اعتمادات Telegram المشتركة عبر Convex (v1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل مختبر ضمان الجودة على إيجار حصري من مجموعة مدعومة بـ Convex، ويرسل Heartbeat
لذلك الإيجار أثناء تشغيل المسار، ويحرر الإيجار عند الإيقاف.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات env المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- اختيار دور الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - افتراضي env: `OPENCLAW_QA_CREDENTIAL_ROLE` (يكون افتراضياً `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات env اختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين Convex ذات local loopback عبر `http://` للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البادئة `https://` في التشغيل العادي.

تتطلب أوامر إدارة المشرفين (إضافة/إزالة/سرد المجموعة)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديداً.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل التشغيلات الحية للتحقق من عنوان URL لموقع Convex، وأسرار الوسيط،
وبادئة نقطة النهاية، ومهلة HTTP، وإمكانية الوصول إلى admin/list من دون طباعة
قيم الأسرار. استخدم `--json` لإخراج قابل للقراءة آلياً في السكربتات وأدوات CI.

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
  - حارس الإيجار النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة معرّف محادثة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

### إضافة قناة إلى ضمان الجودة

تعيش بنية وأسماء مساعدي السيناريوهات لمحولات القنوات الجديدة في [نظرة عامة على ضمان الجودة → إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: تنفيذ مشغّل النقل على منفذ المضيف المشترك `qa-lab`، والتصريح عن `qaRunners` في بيان Plugin، والتركيب باسم `openclaw qa <runner>`، وتأليف السيناريوهات تحت `qa/scenarios/`.

## حزم الاختبار (ما الذي يعمل وأين)

فكّر في الحزم على أنها «واقعية متزايدة» (ومعها تذبذب/تكلفة متزايدان):

### الوحدة / التكامل (افتراضي)

- الأمر: `pnpm test`
- التكوين: تستخدم التشغيلات غير المستهدفة مجموعة التجزئة `vitest.full-*.config.ts` وقد توسّع تجزئات المشاريع المتعددة إلى تكوينات لكل مشروع للجدولة المتوازية
- الملفات: قوائم جرد الوحدة/النواة تحت `src/**/*.test.ts`، و`packages/**/*.test.ts`، و`test/**/*.test.ts`؛ تعمل اختبارات وحدة UI في تجزئة `unit-ui` المخصصة
- النطاق:
  - اختبارات وحدة صرفة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، والتوجيه، والأدوات، والتحليل، والتكوين)
  - انحدارات حتمية للأخطاء المعروفة
- التوقعات:
  - يعمل في CI
  - لا يتطلب مفاتيح حقيقية
  - يجب أن يكون سريعاً ومستقراً
  - يجب أن تثبت اختبارات المحلّل ومحمّل السطح العام سلوك الرجوع الواسع لـ `api.js` و
    `runtime-api.js` باستخدام تجهيزات Plugin صغيرة مولّدة، وليس
    واجهات API مصدرية لـ Plugin مضمّن حقيقي. تنتمي تحميلات API الحقيقية لـ Plugin إلى
    حزم العقد/التكامل المملوكة لـ Plugin.

<AccordionGroup>
  <Accordion title="المشاريع والتجزئات والمسارات محددة النطاق">

    - تشغّل عملية `pnpm test` غير المستهدفة اثني عشر إعداد تقسيم أصغر (`core-unit-fast` و`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية مشروع جذري أصلية واحدة ضخمة. يقلل هذا ذروة RSS على الأجهزة المحمّلة، ويتجنب أن تحرم أعمال auto-reply/extension مجموعات الاختبار غير ذات الصلة من الموارد.
    - لا يزال `pnpm test --watch` يستخدم مخطط مشروع الجذر الأصلي `vitest.config.ts`، لأن حلقة المراقبة متعددة التقسيمات غير عملية.
    - توجّه `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الدلائل الصريحة عبر المسارات محددة النطاق أولًا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع كلفة بدء تشغيل مشروع الجذر كاملة.
    - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى مسارات رخيصة محددة النطاق افتراضيًا: تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، والاعتماديات المحلية في مخطط الاستيراد. لا تؤدي تعديلات الإعداد/config/setup/package إلى تشغيل الاختبارات على نطاق واسع إلا إذا استخدمت صراحةً `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هو بوابة الفحص المحلي الذكي المعتادة للأعمال الضيقة. يصنّف الفرق إلى core، واختبارات core، وextensions، واختبارات extension، والتطبيقات، والوثائق، وبيانات تعريف الإصدار، وأدوات Docker الحية، والأدوات، ثم يشغّل أوامر فحص النوع وlint والحراسة المطابقة. لا يشغّل اختبارات Vitest؛ استدعِ `pnpm test:changed` أو `pnpm test <target>` صريحًا لإثبات الاختبار. تشغّل زيادات الإصدار التي تقتصر على بيانات تعريف الإصدار فقط فحوصات موجهة للإصدار/config/اعتماديات الجذر، مع حارس يرفض تغييرات الحزمة خارج حقل الإصدار في المستوى الأعلى.
    - تشغّل تعديلات حزمة Docker ACP الحية فحوصات مركزة: صياغة shell لسكربتات مصادقة Docker الحية، وتشغيلًا تجريبيًا جافًا لمجدول Docker الحي. تُضمَّن تغييرات `package.json` فقط عندما يقتصر الفرق على `scripts["test:docker:live-*"]`؛ أما تعديلات الاعتماديات، والتصدير، والإصدار، وأسطح الحزمة الأخرى فما زالت تستخدم الحراسات الأوسع.
    - تمر اختبارات الوحدات خفيفة الاستيراد من agents، وcommands، وplugins، ومساعدات auto-reply، و`plugin-sdk`، ومناطق الأدوات النقية المماثلة عبر مسار `unit-fast`، الذي يتجاوز `test/setup-openclaw-runtime.ts`؛ وتبقى الملفات ذات الحالة/الثقيلة وقت التشغيل على المسارات الحالية.
    - تُعيّن أيضًا ملفات مصدر مساعدات مختارة من `plugin-sdk` و`commands` تشغيلات وضع التغييرات إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
    - لدى `auto-reply` حاويات مخصصة لمساعدات core في المستوى الأعلى، واختبارات التكامل `reply.*` في المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. يقسم CI أيضًا الشجرة الفرعية للرد إلى تقسيمات agent-runner وdispatch وcommands/state-routing بحيث لا تملك حاوية واحدة ثقيلة الاستيراد ذيل Node كاملًا.
    - يتخطى CI العادي لطلبات PR/main عمدًا مسح دفعة extension وتقسيم `agentic-plugins` الخاص بالإصدار فقط. يطلق Full Release Validation سير العمل الفرعي المنفصل `Plugin Prerelease` لهذه المجموعات الثقيلة في plugin/extension على مرشحي الإصدار.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - عند تغيير مدخلات اكتشاف أدوات الرسائل أو سياق وقت تشغيل Compaction، حافظ على مستويي التغطية كليهما.
    - أضف اختبارات ارتداد مساعدة مركزة لحدود التوجيه والتطبيع النقية.
    - حافظ على سلامة مجموعات تكامل المشغّل المضمنة:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه المجموعات من أن المعرّفات محددة النطاق وسلوك Compaction ما زالا يمران عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ ولا تُعد اختبارات المساعدات فقط بديلًا كافيًا عن مسارات التكامل تلك.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - تضبط إعدادات Vitest الأساسية الافتراضي على `threads`.
    - تثبّت إعدادات Vitest المشتركة `isolate: false` وتستخدم المشغّل غير المعزول عبر مشاريع الجذر، وإعدادات e2e، والإعدادات الحية.
    - يحتفظ مسار واجهة المستخدم الجذر بإعداد `jsdom` والمحسّن الخاصين به، لكنه يعمل أيضًا على المشغّل المشترك غير المعزول.
    - يرث كل تقسيم `pnpm test` نفس إعدادات `threads` + `isolate: false` الافتراضية من إعدادات Vitest المشتركة.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node الفرعية الخاصة بـ Vitest افتراضيًا لتقليل اضطراب ترجمة V8 أثناء التشغيلات المحلية الكبيرة. عيّن `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8 القياسي.

  </Accordion>

  <Accordion title="Fast local iteration">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يفعّلها الفرق.
    - خطاف ما قبل الالتزام مخصص للتنسيق فقط. يعيد staging للملفات المنسقة ولا يشغّل lint أو فحص النوع أو الاختبارات.
    - شغّل `pnpm check:changed` صراحةً قبل التسليم أو الدفع عندما تحتاج إلى بوابة الفحص المحلي الذكي.
    - يوجّه `pnpm test:changed` عبر مسارات رخيصة محددة النطاق افتراضيًا. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر agent أن تعديل حزمة اختبار أو إعداد أو حزمة أو عقد يحتاج فعلًا إلى تغطية Vitest أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه نفسه، لكن مع حد أعلى للعاملين.
    - التوسيع التلقائي للعاملين محليًا محافظ عمدًا ويتراجع عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، لذلك تُحدث تشغيلات Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
    - تعلّم إعدادات Vitest الأساسية ملفات المشاريع/الإعدادات على أنها `forceRerunTriggers` بحيث تبقى إعادات التشغيل في وضع التغييرات صحيحة عندما تتغير وصلات الاختبار.
    - تبقي الإعدادات `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفات المدعومة؛ عيّن `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت موقع تخزين مؤقت صريحًا واحدًا للتحليل المباشر للأداء.

  </Accordion>

  <Accordion title="Perf debugging">

    - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى إخراج تفصيل الاستيراد.
    - يحدد `pnpm test:perf:imports:changed` نطاق عرض التحليل نفسه على الملفات المتغيرة منذ `origin/main`.
    - تُكتب بيانات توقيت التقسيم إلى `.artifacts/vitest-shard-timings.json`. تستخدم تشغيلات الإعداد الكامل مسار الإعداد كمفتاح؛ وتضيف تقسيمات CI بنمط التضمين اسم التقسيم بحيث يمكن تتبع التقسيمات المفلترة بشكل منفصل.
    - عندما لا يزال اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل، أبقِ الاعتماديات الثقيلة خلف حد محلي ضيق `*.runtime.ts` وحاكِ ذلك الحد مباشرة بدلًا من الاستيراد العميق لمساعدات وقت التشغيل لمجرد تمريرها عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين `test:changed` الموجّه ومسار مشروع الجذر الأصلي لذلك الفرق الملتزم به، ويطبع وقت الحائط بالإضافة إلى RSS الأقصى على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` أداء الشجرة الحالية غير النظيفة عبر توجيه قائمة الملفات المتغيرة من خلال `scripts/test-projects.mjs` وإعدادات Vitest الجذرية.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لكلفة بدء تشغيل Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل لمجموعة الوحدات مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، مفروض على عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا عبر local loopback مع تفعيل التشخيصات افتراضيًا
  - يمرر اضطراب رسائل Gateway الاصطناعية والذاكرة والحمولات الكبيرة عبر مسار حدث التشخيص
  - يستعلم عن `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات استمرارية حزمة استقرار التشخيصات
  - يتحقق من أن المسجّل يبقى محدودًا، وأن عينات RSS الاصطناعية تبقى دون ميزانية الضغط، وأن أعماق الطوابير لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج إلى مفاتيح
  - مسار ضيق لمتابعة ارتدادات الاستقرار، وليس بديلًا عن مجموعة Gateway الكاملة

### E2E (اختبار دخان Gateway)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات E2E للـ bundled-plugin ضمن `extensions/`
- افتراضيات وقت التشغيل:
  - يستخدم `threads` في Vitest مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عاملين تكيّفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل كلفة I/O في وحدة التحكم.
- التجاوزات المفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العاملين (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل إخراج وحدة التحكم المفصل.
- النطاق:
  - سلوك Gateway متعدد النسخ من البداية إلى النهاية
  - أسطح WebSocket/HTTP، واقتران node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تفعيله في pipeline)
  - لا تتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات الوحدات (قد يكون أبطأ)

### E2E: اختبار دخان خلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ OpenShell gateway معزولًا على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يختبر خلفية OpenShell الخاصة بـ OpenClaw عبر `sandbox ssh-config` + تنفيذ SSH حقيقيين
  - يتحقق من سلوك نظام الملفات القانوني عن بُعد عبر جسر sandbox fs
- التوقعات:
  - اختياري فقط؛ ليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا باسم `openshell` بالإضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر Gateway الاختبار وsandbox
- التجاوزات المفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتفعيل الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ثنائي CLI أو سكربت تغليف غير افتراضي

### حي (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات live للـ bundled-plugin ضمن `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزود/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - التقاط تغييرات تنسيق المزودين، وغرائب استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر في CI حسب التصميم (شبكات حقيقية، وسياسات مزودين حقيقية، وحصص، وانقطاعات)
  - يكلّف مالًا / يستخدم حدود المعدل
  - يُفضّل تشغيل مجموعات فرعية ضيقة بدلًا من "كل شيء"
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API المفقودة.
- افتراضيًا، ما زالت التشغيلات الحية تعزل `HOME` وتنسخ مواد config/auth إلى منزل اختبار مؤقت بحيث لا تستطيع fixtures الوحدات تعديل `~/.openclaw` الحقيقي لديك.
- عيّن `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية دليل المنزل الحقيقي لديك.
- أصبح `pnpm test:live` افتراضيًا في وضع أهدأ: فهو يبقي إخراج التقدم `[live] ...`، لكنه يكتم إشعار `~/.profile` الإضافي ويصمت سجلات تمهيد Gateway وضجيج Bonjour. عيّن `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بالمزود): عيّن `*_API_KEYS` بصيغة الفاصلة/الفاصلة المنقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (مثل `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو تجاوزًا لكل تشغيل حي عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- إخراج التقدم/Heartbeat:
  - تبث المجموعات الحية الآن أسطر تقدم إلى stderr بحيث تبقى استدعاءات المزود الطويلة نشطة بصريًا حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة تحكم Vitest بحيث تتدفق أسطر تقدم المزود/Gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeat للنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat الخاص بـ Gateway/probe باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح “روبوتي معطل” / إخفاقات خاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` محدود النطاق

## الاختبارات المباشرة (التي تلامس الشبكة)

لمصفوفة النماذج المباشرة، واختبارات smoke لواجهة CLI الخلفية، واختبارات smoke لـ ACP، وحاضنة خادم تطبيق Codex، وكل اختبارات مزوّدي الوسائط المباشرة (Deepgram، BytePlus، ComfyUI، الصور، الموسيقى، الفيديو، حاضنة الوسائط) — إضافة إلى التعامل مع بيانات الاعتماد للتشغيلات المباشرة — راجع
[الاختبار — الحزم المباشرة](/ar/help/testing-live).

## مشغّلات Docker (فحوصات اختيارية لـ "هل يعمل في Linux")

تنقسم مشغّلات Docker هذه إلى مجموعتين:

- مشغّلات النماذج المباشرة: يشغّل `test:docker:live-models` و`test:docker:live-gateway` ملفهما المباشر المطابق لمفتاح الملف الشخصي فقط داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعداد المحلي ومساحة العمل لديك (ومصدر `~/.profile` إذا كان مركّبًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تعتمد مشغّلات Docker المباشرة حد smoke أصغر افتراضيًا حتى يظل مسح Docker الكامل عمليًا:
  يكون `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويكون
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة هذه عندما تريد صراحةً
  الفحص الشامل الأكبر.
- يبني `test:docker:all` صورة Docker المباشرة مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كأرشيف npm tarball من خلال `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة المجردة هي فقط مشغّل Node/Git لمسارات التثبيت/التحديث/اعتمادية Plugin؛ تركّب تلك المسارات الأرشيف المسبق البناء. تثبّت الصورة الوظيفية الأرشيف نفسه في `/app` لمسارات وظائف التطبيق المبني. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطِّط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في خانات العمليات، بينما تمنع حدود الموارد مسارات live الثقيلة، وتثبيت npm، والمسارات متعددة الخدمات من البدء جميعًا في الوقت نفسه. إذا كان مسار واحد أثقل من الحدود النشطة، فلا يزال بإمكان المجدول بدءه عندما يكون المجمّع فارغًا ثم يبقيه يعمل وحده حتى تتوفر السعة مرة أخرى. الافتراضيات هي 10 خانات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما يملك مضيف Docker مساحة أكبر. ينفّذ المشغّل فحصًا تمهيديًا لـ Docker افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزّن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون من دون بناء أو تشغيل Docker، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة، واحتياجات الحزمة/الصورة، وبيانات الاعتماد.
- `Package Acceptance` هو بوابة الحزمة الأصلية في GitHub لسؤال "هل يعمل هذا الأرشيف القابل للتثبيت كمنتج؟" يحل حزمة مرشحة واحدة من `source=npm` أو `source=ref` أو `source=url` أو `source=artifact`، ويرفعها باسم `package-under-test`، ثم يشغّل مسارات Docker E2E القابلة لإعادة الاستخدام على ذلك الأرشيف نفسه بدلًا من إعادة حزم المرجع المحدد. يحدد `workflow_ref` نصوص سير العمل/الحاضنة الموثوقة، بينما يحدد `package_ref` commit/branch/tag المصدر للحزم عندما يكون `source=ref`؛ وهذا يتيح لمنطق القبول الحالي التحقق من commits موثوقة أقدم. ترتّب الملفات الشخصية حسب الاتساع: `smoke` سريع للتثبيت/القناة/الوكيل إضافة إلى gateway/config، و`package` هو عقد الحزمة/التحديث/Plugin والبديل الأصلي الافتراضي لمعظم تغطية الحزمة/التحديث في Parallels، ويضيف `product` قنوات MCP، وتنظيف cron/subagent، وبحث OpenAI على الويب، وOpenWebUI، ويشغّل `full` مقاطع Docker لمسار الإصدار مع OpenWebUI. يشغّل تحقق الإصدار دلتا حزمة مخصصة (`bundled-channel-deps-compat plugins-offline`) إضافة إلى ضمان جودة حزمة Telegram لأن مقاطع Docker لمسار الإصدار تغطي بالفعل مسارات الحزمة/التحديث/Plugin المتداخلة. تتضمن أوامر إعادة تشغيل Docker المستهدفة في GitHub والمولّدة من artifacts مدخلات أثر الحزمة السابق والصور المحضّرة عند توفرها، حتى تتمكن المسارات الفاشلة من تجنب إعادة بناء الحزمة والصور.
- تشغّل فحوصات البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يمشي الحارس على الرسم البياني المبني الثابت من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا استورد بدء التشغيل قبل التوجيه اعتماديات حزم مثل Commander، أو واجهة المطالبة، أو undici، أو التسجيل قبل توجيه الأمر؛ كما يُبقي مقطع تشغيل Gateway المضمّن ضمن الميزانية ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة. يغطي smoke الخاص بواجهة CLI المعبأة أيضًا مساعدة الجذر، ومساعدة onboard، ومساعدة doctor، وstatus، ومخطط config، وأمر قائمة نماذج.
- توافق `Package Acceptance` القديم محدود عند `2026.4.25` (بما في ذلك `2026.4.25-beta.*`). حتى ذلك الحد، تتسامح الحاضنة فقط مع فجوات بيانات تعريف الحزم المشحونة: إدخالات مخزون QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات التصحيح في تجهيز git المشتق من الأرشيف، وغياب `update.channel` المستمر، ومواقع سجل تثبيت Plugin القديمة، وغياب استمرار سجل تثبيت السوق، وترحيل بيانات تعريف config أثناء `plugins update`. بالنسبة للحزم بعد `2026.4.25`، تكون تلك المسارات إخفاقات صارمة.
- مشغّلات smoke للحاويات: يشغّل `test:docker:openwebui`، و`test:docker:onboard`، و`test:docker:npm-onboard-channel-agent`، و`test:docker:update-channel-switch`، و`test:docker:session-runtime-context`، و`test:docker:agents-delete-shared-workspace`، و`test:docker:gateway-network`، و`test:docker:browser-cdp-snapshot`، و`test:docker:mcp-channels`، و`test:docker:pi-bundle-mcp-tools`، و`test:docker:cron-mcp-cleanup`، و`test:docker:plugins`، و`test:docker:plugin-update`، و`test:docker:config-reload` حاوية حقيقية واحدة أو أكثر ويتحقق من مسارات تكامل أعلى مستوى.

تركّب مشغّلات Docker للنماذج المباشرة أيضًا منازل مصادقة CLI المطلوبة فقط (أو كل المنازل المدعومة عندما لا يكون التشغيل محدود النطاق)، ثم تنسخها إلى منزل الحاوية قبل التشغيل حتى تتمكن OAuth الخاصة بواجهات CLI الخارجية من تحديث الرموز من دون تعديل مخزن مصادقة المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكريبت: `scripts/test-live-models-docker.sh`)
- اختبار دخان ربط ACP: `pnpm test:docker:live-acp-bind` (السكريبت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- اختبار دخان خلفية CLI: `pnpm test:docker:live-cli-backend` (السكريبت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار دخان حزمة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (السكريبت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكريبت: `scripts/test-live-gateway-models-docker.sh`)
- اختبار دخان قابلية الملاحظة: `pnpm qa:otel:smoke` هو مسار تحقق خاص من مصدر QA checkout. وهو ليس جزءا من مسارات إصدار Docker للحزمة عمدا لأن ملف npm tarball يحذف QA Lab.
- اختبار دخان Open WebUI المباشر: `pnpm test:docker:openwebui` (السكريبت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، سقالات كاملة): `pnpm test:docker:onboard` (السكريبت: `scripts/e2e/onboard-docker.sh`)
- اختبار دخان الإعداد الأولي/القناة/الوكيل لملف npm tarball: `pnpm test:docker:npm-onboard-channel-agent` يثبت ملف OpenClaw tarball المعبأ عالميا في Docker، ويكوّن OpenAI عبر إعداد أولي بمرجع env بالإضافة إلى Telegram افتراضيا، ويتحقق من أن doctor أصلح اعتماديات تشغيل Plugin المفعلة، ويشغل دورة وكيل OpenAI واحدة محاكية. أعد استخدام ملف tarball مبنيا مسبقا باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخط إعادة بناء المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- اختبار دخان تبديل قناة التحديث: `pnpm test:docker:update-channel-switch` يثبت ملف OpenClaw tarball المعبأ عالميا في Docker، ويبدّل من الحزمة `stable` إلى git `dev`، ويتحقق من القناة المحفوظة وعمل Plugin بعد التحديث، ثم يعود إلى الحزمة `stable` ويفحص حالة التحديث.
- اختبار دخان سياق تشغيل الجلسة: `pnpm test:docker:session-runtime-context` يتحقق من استمرار نص سياق التشغيل المخفي بالإضافة إلى إصلاح doctor لفروع إعادة كتابة المطالبات المكررة المتأثرة.
- اختبار دخان التثبيت العالمي عبر Bun: `bash scripts/e2e/bun-global-install-smoke.sh` يحزم الشجرة الحالية، ويثبتها باستخدام `bun install -g` في home معزولة، ويتحقق من أن `openclaw infer image providers --json` يعيد مزودي الصور المضمنين بدلا من التعليق. أعد استخدام ملف tarball مبنيا مسبقا باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخط بناء المضيف باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- اختبار دخان Docker للمثبت: `bash scripts/test-install-sh-docker.sh` يشارك ذاكرة تخزين npm مؤقت واحدة بين حاويات root والتحديث وdirect-npm الخاصة به. اختبار دخان التحديث يستخدم npm `latest` افتراضيا كخط أساس مستقر قبل الترقية إلى ملف tarball المرشح. تجاوزه باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` محليا، أو باستخدام إدخال `update_baseline_version` الخاص بسير عمل Install Smoke على GitHub. تحتفظ فحوصات المثبت غير الجذرية بذاكرة تخزين npm مؤقت معزولة حتى لا تخفي إدخالات الذاكرة المؤقتة المملوكة للجذر سلوك التثبيت المحلي للمستخدم. اضبط `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة التخزين المؤقت root/update/direct-npm عبر إعادات التشغيل المحلية.
- يتخطى Install Smoke CI التحديث العالمي direct-npm المكرر باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغل السكريبت محليا بدون هذا env عندما تكون تغطية `npm install -g` المباشرة مطلوبة.
- اختبار دخان CLI لحذف الوكلاء لمساحة عمل مشتركة: `pnpm test:docker:agents-delete-shared-workspace` (السكريبت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) يبني صورة Dockerfile الجذرية افتراضيا، ويزرع وكيلين مع مساحة عمل واحدة في home حاوية معزولة، ويشغل `agents delete --json`، ويتحقق من JSON صالح بالإضافة إلى سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke باستخدام `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكريبت: `scripts/e2e/gateway-network-docker.sh`)
- اختبار دخان لقطة Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (السكريبت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) يبني صورة E2E المصدر بالإضافة إلى طبقة Chromium، ويبدأ Chromium مع CDP خام، ويشغل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي عناوين URL للروابط، والعناصر القابلة للنقر المرفوعة بالمؤشر، ومراجع iframe، وبيانات تعريف الإطار.
- انحدار الاستدلال الأدنى لـ OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (السكريبت: `scripts/e2e/openai-web-search-minimal-docker.sh`) يشغل خادم OpenAI محاكيا عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يجبر مخطط المزود على الرفض ويفحص ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + اختبار دخان لإطار إشعار Claude خام): `pnpm test:docker:mcp-channels` (السكريبت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة Pi (خادم stdio MCP حقيقي + اختبار دخان السماح/الرفض لملف Pi المضمن): `pnpm test:docker:pi-bundle-mcp-tools` (السكريبت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف Cron/subagent MCP (Gateway حقيقي + تفكيك ابن stdio MCP بعد تشغيلات cron معزولة وsubagent لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكريبت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (اختبار دخان التثبيت، تثبيت/إلغاء تثبيت حزمة ClawHub شاملة، تحديثات marketplace، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (السكريبت: `scripts/e2e/plugins-docker.sh`)
  اضبط `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/التشغيل الافتراضي الشامل باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم fixture محلي معزول لـ ClawHub.
- اختبار دخان تحديث Plugin بدون تغيير: `pnpm test:docker:plugin-update` (السكريبت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- اختبار دخان بيانات تعريف إعادة تحميل الإعدادات: `pnpm test:docker:config-reload` (السكريبت: `scripts/e2e/config-reload-source-docker.sh`)
- اعتماديات تشغيل Plugin المضمنة: `pnpm test:docker:bundled-channel-deps` يبني افتراضيا صورة مشغل Docker صغيرة، ويبني OpenClaw ويحزمه مرة واحدة على المضيف، ثم يثبت ملف tarball ذلك في كل سيناريو تثبيت Linux. أعد استخدام الصورة مع `OPENCLAW_SKIP_DOCKER_BUILD=1`، أو تخط إعادة بناء المضيف بعد بناء محلي حديث باستخدام `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`، أو أشر إلى ملف tarball موجود باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. يحزم تجميع Docker الكامل وأجزاء bundled-channel لمسار الإصدار ملف tarball هذا مرة واحدة مسبقا، ثم يجزئ فحوصات القنوات المضمنة إلى مسارات مستقلة، بما في ذلك مسارات تحديث منفصلة لـ Telegram وDiscord وSlack وFeishu وmemory-lancedb وACPX. تقسم أجزاء الإصدار اختبارات دخان القنوات، وأهداف التحديث، وعقود الإعداد/التشغيل إلى `bundled-channels-core` و`bundled-channels-update-a` و`bundled-channels-update-b` و`bundled-channels-contracts`؛ ويبقى جزء التجميع `bundled-channels` متاحا لإعادات التشغيل اليدوية. يقسم سير عمل الإصدار أيضا أجزاء مثبت المزود وأجزاء تثبيت/إلغاء تثبيت Plugin المضمنة؛ وتبقى أجزاء `package-update` و`plugins-runtime` و`plugins-integrations` القديمة أسماء مستعارة تجميعية لإعادات التشغيل اليدوية. استخدم `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` لتضييق مصفوفة القنوات عند تشغيل المسار المضمن مباشرة، أو `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` لتضييق سيناريو التحديث. الإعداد الافتراضي لتشغيلات Docker لكل سيناريو هو `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`؛ والإعداد الافتراضي لسيناريو التحديث متعدد الأهداف هو `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. يتحقق المسار أيضا من أن `channels.<id>.enabled=false` و`plugins.entries.<id>.enabled=false` يكبحان إصلاح doctor/اعتماديات التشغيل.
- ضيق اعتماديات تشغيل Plugin المضمنة أثناء التكرار عن طريق تعطيل السيناريوهات غير ذات الصلة، مثلا:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

لبناء الصورة الوظيفية المشتركة مسبقا وإعادة استخدامها يدويا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تبقى تجاوزات الصور الخاصة بالحزمة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` هي السائدة عند ضبطها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكريبتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات Docker الخاصة بـ QR والمثبت بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلا من تشغيل التطبيق المبني المشترك.

تثبت مشغلات Docker للنماذج المباشرة أيضا checkout الحالي للقراءة فقط وتهيئه في workdir مؤقت داخل الحاوية. يحافظ ذلك على خفة صورة التشغيل مع الاستمرار في تشغيل Vitest مقابل مصدرك/إعداداتك المحلية الدقيقة. تتخطى خطوة التهيئة ذاكرات التخزين المؤقت المحلية الكبيرة ومخرجات بناء التطبيقات مثل `.pnpm-store` و`.worktrees` و`__openclaw_vitest__` ومجلدات مخرجات `.build` المحلية للتطبيق أو Gradle، حتى لا تقضي تشغيلات Docker المباشرة دقائق في نسخ آثار خاصة بالجهاز. كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ تحقيقات Gateway المباشرة عمال قنوات Telegram/Discord/etc. حقيقيين داخل الحاوية. لا يزال `test:docker:live-models` يشغل `pnpm test:live`، لذا مرر أيضا `OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway المباشرة من مسار Docker ذلك. `test:docker:openwebui` هو اختبار دخان توافق أعلى مستوى: يبدأ حاوية Gateway من OpenClaw مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI، ويبدأ حاوية Open WebUI مثبتة بإصدار محدد مقابل ذلك Gateway، ويسجل الدخول عبر Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل طلب محادثة حقيقيا عبر وكيل `/api/chat/completions` الخاص بـ Open WebUI. قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب صورة Open WebUI وقد يحتاج Open WebUI إلى إنهاء إعداد بدء التشغيل البارد الخاص به. يتوقع هذا المسار مفتاح نموذج مباشر قابل للاستخدام، و`OPENCLAW_PROFILE_FILE` (`~/.profile` افتراضيا) هو الطريقة الأساسية لتوفيره في تشغيلات Docker. تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model": "openclaw/default", ... }`. `test:docker:mcp-channels` حتمي عمدا ولا يحتاج إلى حساب Telegram أو Discord أو iMessage حقيقي. يشغل حاوية Gateway مزروعة، ويبدأ حاوية ثانية تنشئ `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجهة، وقراءات النصوص، وبيانات تعريف المرفقات، وسلوك قائمة انتظار الأحداث المباشرة، وتوجيه الإرسال الصادر، وإشعارات القناة + الأذونات على نمط Claude عبر جسر stdio MCP الحقيقي. يفحص تحقق الإشعارات إطارات stdio MCP الخام مباشرة حتى يتحقق اختبار الدخان مما يصدره الجسر فعليا، وليس فقط ما يحدث أن يعرضه SDK عميل محدد. `test:docker:pi-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج مباشر. يبني صورة Docker للمستودع، ويبدأ خادم اختبار stdio MCP حقيقيا داخل الحاوية، ويجسد ذلك الخادم عبر تشغيل MCP لحزمة Pi المضمنة، وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان بأدوات `bundle-mcp` بينما يرشحها `minimal` و`tools.deny: ["bundle-mcp"]`. `test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج مباشر. يبدأ Gateway مزروعا مع خادم اختبار stdio MCP حقيقي، ويشغل دورة cron معزولة ودورة ابن `/subagents spawn` لمرة واحدة، ثم يتحقق من خروج عملية MCP الابنة بعد كل تشغيل.

اختبار دخان سلسلة ACP يدوية بلغة عادية (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لتدفقات عمل الانحدار/التصحيح. قد تكون هناك حاجة إليه مجددًا للتحقق من توجيه سلاسل ACP، لذلك لا تحذفه.

متغيرات البيئة المفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) مركب على `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) مركب على `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) مركب على `/home/node/.profile` ويتم تحميله قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المحملة من `OPENCLAW_PROFILE_FILE`، باستخدام مجلدات إعدادات/مساحة عمل مؤقتة ومن دون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) مركب على `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- تُركب مجلدات/ملفات مصادقة CLI الخارجية ضمن `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - المجلدات الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - تشغلات المزوّد المضيقة تركب فقط المجلدات/الملفات المطلوبة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز ذلك يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لإعادات التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن الملف الشخصي (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لاختبار Open WebUI السريع
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز مطالبة فحص nonce المستخدمة بواسطة اختبار Open WebUI السريع
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## فحص سلامة المستندات

شغّل فحوصات المستندات بعد تعديلات المستندات: `pnpm check:docs`.
شغّل تحقق Mintlify الكامل من المراسي عندما تحتاج أيضًا إلى فحوصات عناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه انحدارات "مسار تنفيذ حقيقي" من دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (OpenAI محاكى، Gateway حقيقي + حلقة وكيل): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway (WS `wizard.start`/`wizard.next`، يكتب الإعدادات + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بضعة اختبارات آمنة لـ CI تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء أدوات محاكى عبر Gateway الحقيقي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات معالج كاملة تتحقق من توصيل الجلسة وتأثيرات الإعدادات (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودًا لـ Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في المطالبة، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تتحقق من ترتيب الأدوات، واستمرارية سجل الجلسة، وحدود sandbox.

يجب أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين محاكين للتحقق من استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وتوصيل الجلسة.
- مجموعة صغيرة من السيناريوهات المركزة على Skills (الاستخدام مقابل التجنب، البوابات، حقن المطالبات).
- تقييمات حية اختيارية (بالاشتراك، ومحكومة بمتغيرات البيئة) فقط بعد توفر المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلين يلتزمان بعقد
الواجهة الخاص بهما. وهي تمر على كل Plugins المكتشفة وتشغل مجموعة من
توكيدات الشكل والسلوك. مسار وحدات `pnpm test` الافتراضي يتخطى عمدًا
ملفات وصلات المشاركة والاختبارات السريعة هذه؛ شغّل أوامر العقود صراحة
عندما تمس أسطح القنوات أو المزوّدين المشتركة.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

موجودة في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي لـ Plugin (المعرّف، الاسم، الإمكانات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرّف السلسلة
- **directory** - واجهة برمجة تطبيقات الدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّدين

موجودة في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugins

### عقود المزوّدين

موجودة في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة برمجة تطبيقات كتالوج النماذج
- **discovery** - اكتشاف Plugins
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تشغلها

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة أو تعديل قناة أو Plugin مزوّد
- بعد إعادة هيكلة تسجيل Plugins أو اكتشافها

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة الانحدارات (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج اكتُشفت في التشغيل الحي:

- أضف انحدارًا آمنًا لـ CI إن أمكن (مزوّد محاكى/بديل، أو التقط تحويل شكل الطلب الدقيق)
- إذا كان الأمر حيًا بطبيعته فقط (حدود المعدل، سياسات المصادقة)، فأبق الاختبار الحي ضيقًا واختياريًا عبر متغيرات البيئة
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ تحويل/إعادة تشغيل طلب المزوّد → اختبار نماذج مباشر
  - خطأ مسار جلسة/سجل/أدوات Gateway → اختبار سريع حي لـ Gateway أو اختبار Gateway محاكى آمن لـ CI
- حاجز حماية عبور SecretRef:
  - يشتق `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا واحدًا مأخوذًا كعينة لكل فئة SecretRef من بيانات سجل البيانات الوصفية (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرّفات exec ذات مقاطع العبور.
  - إذا أضفت عائلة أهداف SecretRef جديدة مع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند معرّفات الأهداف غير المصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذات صلة

- [الاختبار الحي](/ar/help/testing-live)
- [CI](/ar/ci)
