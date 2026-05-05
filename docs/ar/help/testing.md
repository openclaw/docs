---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النماذج/المزوّدين
    - تصحيح أخطاء سلوك Gateway والوكيل
summary: 'حزمة الاختبار: مجموعات اختبارات الوحدة/نهاية إلى نهاية/المباشرة، ومشغلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-05-05T06:18:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw لديه ثلاث حزم Vitest (الوحدات/التكامل، e2e، الحية) ومجموعة صغيرة
من مشغلات Docker. هذا المستند هو دليل "كيف نختبر":

- ما تغطيه كل حزمة (وما لا تغطيه عمدًا).
- الأوامر التي يجب تشغيلها لسير العمل الشائع (محليًا، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/المزودين.
- كيف تضيف اختبارات انحدار لمشكلات النماذج/المزودين الواقعية.

<Note>
**مكدس QA (qa-lab، qa-channel، مسارات النقل الحية)** موثق بشكل منفصل:

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) — البنية، سطح الأوامر، تأليف السيناريوهات.
- [Matrix QA](/ar/concepts/qa-matrix) — مرجع لـ `pnpm openclaw qa matrix`.
- [قناة QA](/ar/channels/qa-channel) — Plugin النقل الاصطناعي المستخدم بواسطة السيناريوهات المدعومة بالمستودع.

تغطي هذه الصفحة تشغيل حزم الاختبار العادية ومشغلات Docker/Parallels. يسرد قسم المشغلات الخاصة بـ QA أدناه ([المشغلات الخاصة بـ QA](#qa-specific-runners)) استدعاءات `qa` المحددة ويشير مرة أخرى إلى المراجع أعلاه.
</Note>

## البدء السريع

في معظم الأيام:

- بوابة كاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع للحزمة الكاملة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- استهداف الملفات المباشر يوجه الآن مسارات الإضافات/القنوات أيضًا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضل التشغيلات المستهدفة أولًا عندما تكرر العمل على فشل واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA المدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- حزمة E2E: `pnpm test:e2e`

عند تصحيح المزودين/النماذج الحقيقية (يتطلب بيانات اعتماد حقيقية):

- الحزمة الحية (النماذج + فحوصات Gateway للأدوات/الصور): `pnpm test:live`
- استهدف ملفًا حيًا واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- تقارير أداء وقت التشغيل: شغل `OpenClaw Performance` مع
  `live_gpt54=true` لدورة وكيل حقيقية لـ `openai/gpt-5.4` أو
  `deep_profile=true` لآثار Kova الخاصة بالمعالج/الكومة/التتبع. تنشر التشغيلات اليومية المجدولة
  آثار مسارات المزود الوهمي، والملف الشخصي العميق، وGPT 5.4 إلى
  `openclaw/clawgrit-reports` عندما يكون `CLAWGRIT_REPORTS_TOKEN` مهيأ. ويتضمن
  تقرير المزود الوهمي أيضًا أرقام تمهيد Gateway على مستوى المصدر، والذاكرة،
  وضغط Plugin، وحلقة ترحيب النموذج المزيف المتكررة، وبدء تشغيل CLI.
- مسح النماذج الحية عبر Docker: `pnpm test:docker:live-models`
  - يشغل كل نموذج محدد الآن دورة نصية إضافة إلى فحص صغير بأسلوب قراءة ملف.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغل أيضًا دورة صورة صغيرة.
    عطل الفحوصات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل أعطال المزودين.
  - تغطية CI: كل من `OpenClaw Scheduled Live And E2E Checks` اليومي و
    `OpenClaw Release Checks` اليدوي يستدعيان سير العمل الحي/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، والذي يتضمن مهام مصفوفة منفصلة لنماذج Docker الحية
    مجزأة حسب المزود.
  - لإعادة تشغيل CI مركزة، شغل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و `live_models_only: true`.
  - أضف أسرار المزودين الجديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    إضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` والمستدعين
    المجدولين/الخاصة بالإصدار.
- فحص دخان للمحادثة المرتبطة الأصلية في Codex: `pnpm test:docker:live-codex-bind`
  - يشغل مسار Docker حيًا على مسار خادم تطبيق Codex، ويربط رسالة Slack DM اصطناعية
    باستخدام `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من مرور رد عادي ومرفق صورة
    عبر ربط Plugin الأصلي بدلًا من ACP.
- فحص دخان لحاضنة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغل دورات وكيل Gateway عبر حاضنة خادم تطبيق Codex المملوكة لـ Plugin،
    ويتحقق من `/codex status` و `/codex models`، وبشكل افتراضي يمارس فحوصات الصورة،
    وcron MCP، والوكيل الفرعي، وGuardian. عطل فحص الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل أعطال أخرى في
    خادم تطبيق Codex. لإجراء فحص مركز للوكيل الفرعي، عطل الفحوصات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد فحص الوكيل الفرعي ما لم يتم تعيين
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- فحص دخان لأمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري شديد التحوط لسطح أمر الإنقاذ في قناة الرسائل.
    يمارس `/crestodian status`، ويضع تغيير نموذج دائمًا في الصف،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعداد.
- فحص دخان لمخطط Crestodian عبر Docker: `pnpm test:docker:crestodian-planner`
  - يشغل Crestodian في حاوية بلا إعداد مع Claude CLI مزيف على `PATH`
    ويتحقق من أن رجوع المخطط الضبابي يترجم إلى كتابة إعداد نمطية ومدققة.
- فحص دخان للتشغيل الأول لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من دليل حالة OpenClaw فارغ، ويوجه `openclaw` العاري إلى
    Crestodian، ويطبق كتابات setup/model/agent/Discord plugin + SecretRef،
    ويتحقق من الإعداد، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضًا في QA Lab بواسطة
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- فحص دخان لتكلفة Moonshot/Kimi: مع تعيين `MOONSHOT_API_KEY`، شغل
  `openclaw models list --provider moonshot --json`، ثم شغل أمرًا معزولًا
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  على `moonshot/kimi-k2.6`. تحقق من أن JSON يبلغ عن Moonshot/K2.6 وأن
  سجل المساعد يخزن `usage.cost` المطبعة.

<Tip>
عندما تحتاج إلى حالة فاشلة واحدة فقط، فضل تضييق الاختبارات الحية عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## المشغلات الخاصة بـ QA

توجد هذه الأوامر بجانب حزم الاختبار الرئيسية عندما تحتاج إلى واقعية QA Lab:

يشغل CI ‏QA Lab في مسارات عمل مخصصة. تكافؤ الوكلاء مدمج ضمن
`QA-Lab - All Lanes` والتحقق من الإصدار، وليس سير عمل PR مستقلًا.
يجب أن يستخدم التحقق الواسع `Full Release Validation` مع
`rerun_group=qa-parity` أو مجموعة QA الخاصة بفحوصات الإصدار. تبقي فحوصات الإصدار
المستقرة/الافتراضية نقع Docker/الحي الشامل خلف `run_release_soak=true`؛ ويفرض
ملف `full` الشخصي تشغيل النقع. يشغل `QA-Lab - All Lanes`
ليليًا على `main` ومن التشغيل اليدوي مع مسار تكافؤ وهمي، ومسار Matrix حي،
ومسار Telegram حي مدار من Convex، ومسار Discord حي مدار من Convex
كمهام متوازية. تمرر QA المجدولة وفحوصات الإصدار
`--profile fast` إلى Matrix صراحة، بينما يبقى الإدخال الافتراضي لـ Matrix CLI
وسير العمل اليدوي `all`؛ يمكن للتشغيل اليدوي تجزئة `all` إلى مهام
`transport`، و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`.
يشغل `OpenClaw Release Checks` التكافؤ إضافة إلى مسارات Matrix السريعة وTelegram
قبل موافقة الإصدار، مستخدمًا `mock-openai/gpt-5.5` لفحوصات نقل الإصدار لكي تبقى
حتمية وتتجنب بدء تشغيل Plugin المزود العادي. تعطل Gateways النقل الحية هذه بحث الذاكرة؛ وتبقى
سلوكيات الذاكرة مغطاة بواسطة حزم تكافؤ QA.

تستخدم أجزاء وسائط الإصدار الحية الكاملة
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، والذي يحتوي مسبقًا على
`ffmpeg` و`ffprobe`. تستخدم أجزاء نماذج/خلفيات Docker الحية صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
التزام محدد، ثم تسحبها باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلًا من إعادة البناء
داخل كل جزء.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة بالمستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا باستخدام عمال
    Gateway معزولين. يستخدم `qa-channel` التزامن 4 افتراضيًا (مقيّدًا بعدد
    السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد العمال،
    أو `--concurrency 1` لمسار التسلسل الأقدم.
  - يخرج بقيمة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد القطع الأثرية دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم مزوّد محليًا مدعومًا بـ AIMock لتغطية تجريبية
    للتركيبات ومحاكاة البروتوكول دون استبدال مسار `mock-openai` الواعي
    بالسيناريو.
- `pnpm test:plugins:kitchen-sink-live`
  - يشغّل مجموعة اختبارات Plugin الحية OpenAI Kitchen Sink عبر QA Lab. يثبّت
    حزمة Kitchen Sink الخارجية، ويتحقق من مخزون سطح SDK الخاص بـ Plugin،
    ويفحص `/healthz` و`/readyz`، ويسجل أدلة CPU/RSS الخاصة بـ Gateway،
    ويشغّل دورة OpenAI حية، ويتحقق من التشخيصات العدائية. يتطلب مصادقة
    OpenAI حية مثل `OPENAI_API_KEY`. في جلسات Testbox المهيأة، يستورد تلقائيًا
    ملف مصادقة Testbox الحية عندما يكون مساعد `openclaw-testbox-env` موجودًا.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل اختبار بدء Gateway القياسي إضافة إلى حزمة صغيرة من سيناريوهات QA Lab
    الوهمية (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) ويكتب ملخص ملاحظة CPU مدمجًا ضمن
    `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم ملاحظات CPU الساخنة المستمرة فقط افتراضيًا (`--cpu-core-warn`
    مع `--hot-wall-warn-ms`)، لذلك تُسجّل دفعات بدء التشغيل القصيرة كمقاييس
    دون أن تبدو كانحدار تثبيت Gateway الذي يستمر دقائق.
  - يستخدم قطع `dist` الأثرية المبنية؛ شغّل البناء أولًا عندما لا يحتوي
    السحب بالفعل على مخرجات تشغيل حديثة.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل VM Linux مؤقتة عبر Multipass.
  - يحافظ على سلوك اختيار السيناريو نفسه مثل `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزوّد/النموذج نفسها مثل `qa suite`.
  - تمرر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد المعتمدة على env، ومسار إعدادات مزوّد QA الحي، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى مجلدات الإخراج ضمن جذر المستودع كي يتمكن الضيف من الكتابة
    مرة أخرى عبر مساحة العمل المثبتة.
  - يكتب تقرير QA والملخص المعتادين إضافة إلى سجلات Multipass ضمن
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لعمل QA بنمط المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني أرشيف npm tarball من السحب الحالي، ويثبّته عموميًا في Docker،
    ويشغّل تهيئة OpenAI غير تفاعلية بمفتاح API، ويهيئ Telegram افتراضيًا،
    ويتحقق من أن تشغيل Plugin المعبأ يحمّل دون إصلاح اعتماديات عند بدء
    التشغيل، ويشغّل doctor، ويشغّل دورة وكيل محلية واحدة مقابل نقطة نهاية
    OpenAI وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت
    المعبأ نفسه مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل اختبار Docker دخانيًا حتميًا للتطبيق المبني لنصوص سياق التشغيل
    المضمنة. يتحقق من استمرار سياق تشغيل OpenClaw المخفي كرسالة مخصصة غير
    معروضة بدلًا من تسربه إلى دورة المستخدم المرئية، ثم يزرع ملف JSONL لجلسة
    معطوبة متأثرة ويتحقق من أن `openclaw doctor --fix` يعيد كتابته إلى الفرع
    النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبّت مرشح حزمة OpenClaw في Docker، ويشغّل تهيئة الحزمة المثبتة، ويهيئ
    Telegram عبر CLI المثبت، ثم يعيد استخدام مسار QA الحي لـ Telegram مع تلك
    الحزمة المثبتة بوصفها Gateway قيد الاختبار.
  - القيمة الافتراضية هي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛
    عيّن `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار أرشيف tarball محلي محلول بدلًا من
    التثبيت من السجل.
  - يستخدم بيانات اعتماد env الخاصة بـ Telegram نفسها أو مصدر بيانات اعتماد
    Convex نفسه مثل `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، عيّن
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` مع
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. إذا كان
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI، يختار مغلف
    Docker Convex تلقائيًا.
  - يتحقق المغلف من env بيانات اعتماد Telegram أو Convex على المضيف قبل عمل
    بناء/تثبيت Docker. عيّن `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    فقط عند تصحيح إعداد ما قبل بيانات الاعتماد عمدًا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` المتغير
    المشترك `OPENCLAW_QA_CREDENTIAL_ROLE` لهذا المسار فقط.
  - يعرّض GitHub Actions هذا المسار كسير عمل يدوي للمشرفين باسم
    `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة
    `qa-live-shared` وعقود بيانات اعتماد Convex الخاصة بـ CI.
- يعرّض GitHub Actions أيضًا `Package Acceptance` لإثبات منتج جانبي مقابل
  حزمة مرشحة واحدة. يقبل مرجعًا موثوقًا، أو مواصفة npm منشورة، أو URL لأرشيف
  tarball عبر HTTPS مع SHA-256، أو قطعة tarball أثرية من تشغيل آخر، ويرفع
  `openclaw-current.tgz` الموحّد باسم `package-under-test`، ثم يشغّل مجدول
  Docker E2E الحالي بملفات مسارات smoke أو package أو product أو full أو
  المخصصة. عيّن `telegram_mode=mock-openai` أو `live-frontier` لتشغيل سير عمل
  QA الخاص بـ Telegram مقابل القطعة الأثرية نفسها `package-under-test`.
  - أحدث إثبات منتج beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات URL الدقيق لأرشيف tarball ملخصًا:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- ينزّل إثبات القطعة الأثرية قطعة tarball أثرية من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - يعبئ بناء OpenClaw الحالي ويثبّته في Docker، ويبدأ Gateway مع تهيئة
    OpenAI، ثم يمكّن قنوات/Plugins المضمنة عبر تعديلات الإعدادات.
  - يتحقق من أن اكتشاف الإعداد يترك Plugins القابلة للتنزيل غير المهيأة غائبة،
    وأن أول إصلاح doctor مهيأ يثبّت كل Plugin قابل للتنزيل مفقود بشكل صريح،
    وأن إعادة تشغيل ثانية لا تشغّل إصلاح اعتماديات مخفيًا.
  - يثبّت أيضًا خط أساس npm أقدم معروفًا، ويمكّن Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن doctor بعد التحديث الخاص
    بالمرشح ينظف بقايا اعتماديات Plugin القديمة دون إصلاح postinstall من جهة
    الحاضنة.
- `pnpm test:parallels:npm-update`
  - يشغّل اختبار دخان تحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. يثبّت
    كل نظام محدد أولًا حزمة خط الأساس المطلوبة، ثم يشغّل أمر `openclaw update`
    المثبت في الضيف نفسه ويتحقق من الإصدار المثبت، وحالة التحديث، وجاهزية
    Gateway، ودورة وكيل محلية واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux`
    أثناء التكرار على ضيف واحد. استخدم `--json` لمسار قطعة الملخص الأثرية
    وحالة كل مسار.
  - يستخدم مسار OpenAI `openai/gpt-5.5` افتراضيًا لإثبات دورة الوكيل الحية.
    مرّر `--model <provider/model>` أو عيّن `OPENCLAW_PARALLELS_OPENAI_MODEL`
    عند التحقق عمدًا من نموذج OpenAI آخر.
  - لف التشغيلات المحلية الطويلة بمهلة على المضيف حتى لا تستهلك تعطلات نقل
    Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات المسارات المتداخلة ضمن `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن المغلف الخارجي متوقف.
  - قد يستغرق تحديث Windows من 10 إلى 15 دقيقة في عمل doctor بعد التحديث
    وتحديث الحزمة على ضيف بارد؛ يظل ذلك سليمًا عندما يكون سجل npm debug
    المتداخل يتقدم.
  - لا تشغّل هذا المغلف التجميعي بالتوازي مع مسارات دخان Parallels الفردية
    لـ macOS أو Windows أو Linux. فهي تشارك حالة VM ويمكن أن تتصادم في استعادة
    اللقطة، أو تقديم الحزمة، أو حالة Gateway الضيف.
  - يشغّل إثبات ما بعد التحديث سطح Plugin المضمن العادي لأن واجهات القدرات مثل
    الكلام، وتوليد الصور، وفهم الوسائط تُحمّل عبر واجهات API التشغيل المضمنة
    حتى عندما تتحقق دورة الوكيل نفسها من استجابة نصية بسيطة فقط.

- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم مزوّد AIMock المحلي لاختبار دخان البروتوكول المباشر.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي لـ Matrix مقابل خادم Tuwunel homeserver مؤقت مدعوم بـ Docker. السحب من المصدر فقط — لا تشحن التثبيتات المعبأة `qa-lab`.
  - CLI الكامل، وكتالوج الملف الشخصي/السيناريو، ومتغيرات env، وتخطيط القطع الأثرية: [QA الخاص بـ Matrix](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رموز بوت السائق والبوت قيد الاختبار من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرف المجموعة هو معرف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المجمعة المشتركة. استخدم وضع env افتراضيًا، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في العقود المجمعة.
  - يخرج بقيمة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد القطع الأثرية دون رمز خروج فاشل.
  - يتطلب بوتين مختلفين في المجموعة الخاصة نفسها، مع كشف البوت قيد الاختبار عن اسم مستخدم Telegram.
  - لملاحظة مستقرة بين البوتات، مكّن وضع اتصال البوتات ببعضها في `@BotFather` لكلا البوتين وتأكد من قدرة بوت السائق على ملاحظة حركة بوتات المجموعة.
  - يكتب تقرير QA لـ Telegram وملخصًا وقطعة رسائل مرصودة أثرية ضمن `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال السائق إلى رد البوت قيد الاختبار المرصود.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ توجد مصفوفة تغطية كل مسار في [نظرة عامة على QA ← تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). يُعد `qa-channel` المجموعة الاصطناعية الواسعة وليس جزءًا من تلك المصفوفة.

### بيانات اعتماد Telegram المشتركة عبر Convex (v1)

عند تمكين `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل QA lab على عقد حصري من مجموعة مدعومة بـ Convex، ويرسل Heartbeat
لذلك العقد أثناء تشغيل المسار، ويحرر العقد عند الإيقاف.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات env المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - القيمة الافتراضية في env: `OPENCLAW_QA_CREDENTIAL_ROLE` (تكون افتراضيًا `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات env اختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL الخاصة بـ Convex عبر loopback `http://` للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` ‎`https://` في التشغيل العادي.

تتطلب أوامر إدارة المشرفين (إضافة/إزالة/عرض المجموعة)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل عمليات التشغيل الحية للتحقق من عنوان URL لموقع Convex، وأسرار الوسيط،
وبادئة نقطة النهاية، ومهلة HTTP، وإمكانية الوصول إلى الإدارة/القائمة من دون طباعة
قيم الأسرار. استخدم `--json` للحصول على مخرجات قابلة للقراءة آليًا في السكربتات وأدوات CI.

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
- يجب أن يكون `groupId` سلسلة رقمية لمعرّف دردشة Telegram.
- يتحقق `admin/add` من هذا الشكل عند `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

### إضافة قناة إلى QA

توجد أسماء البنية ومساعدات السيناريو لمحوّلات القنوات الجديدة في [نظرة عامة على QA → إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: تنفيذ مشغل النقل على حد مضيف `qa-lab` المشترك، والإعلان عن `qaRunners` في بيان Plugin، والتركيب باسم `openclaw qa <runner>`، وتأليف السيناريوهات ضمن `qa/scenarios/`.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكّر في المجموعات على أنها «واقعية متزايدة» (ومعها تزايد في الهشاشة/التكلفة):

### الوحدة / التكامل (افتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم عمليات التشغيل غير الموجّهة مجموعة شظايا `vitest.full-*.config.ts` وقد توسّع الشظايا متعددة المشاريع إلى إعدادات لكل مشروع لأجل الجدولة المتوازية
- الملفات: قوائم جرد الوحدة/النواة ضمن `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`؛ تعمل اختبارات وحدة الواجهة في شظية `unit-ui` المخصصة
- النطاق:
  - اختبارات وحدة صرفة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، التوجيه، الأدوات، التحليل، الإعداد)
  - انحدارات حتمية للأخطاء المعروفة
- التوقعات:
  - يعمل في CI
  - لا يتطلب مفاتيح حقيقية
  - يجب أن يكون سريعًا ومستقرًا
  - يجب أن تثبت اختبارات المحلل ومحمّل السطح العام سلوك الرجوع الواسع في `api.js` و
    `runtime-api.js` باستخدام تجهيزات Plugin صغيرة مُولّدة، وليس
    واجهات API لمصدر Plugin حقيقي مضمّن. تحميلات API الحقيقية للـ Plugin مكانها
    مجموعات العقود/التكامل المملوكة للـ Plugin.

<AccordionGroup>
  <Accordion title="المشاريع، والشظايا، والمسارات محددة النطاق">

    - يشغّل `pnpm test` غير الموجّه اثني عشر إعداد شظايا أصغر (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) بدلًا من عملية مشروع جذري أصلية عملاقة واحدة. يقلل هذا ذروة RSS على الأجهزة المحمّلة ويتجنب أن تحرم أعمال الرد التلقائي/Plugin المجموعات غير ذات الصلة.
    - ما زال `pnpm test --watch` يستخدم مخطط مشروع `vitest.config.ts` الجذري الأصلي، لأن حلقة مراقبة متعددة الشظايا ليست عملية.
    - يوجّه `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر مسارات محددة النطاق أولًا، بحيث يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع تكلفة بدء المشروع الجذري كاملة.
    - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى مسارات رخيصة محددة النطاق افتراضيًا: تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، وتوابع مخطط الاستيراد المحلية. لا تؤدي تعديلات الإعداد/التهيئة/الحزمة إلى تشغيل واسع للاختبارات إلا إذا استخدمت صراحة `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هو بوابة الفحص المحلي الذكية العادية للأعمال الضيقة. يصنّف الفرق إلى النواة، واختبارات النواة، وPlugins، واختبارات Plugin، والتطبيقات، والمستندات، وبيانات تعريف الإصدار، وأدوات Docker الحية، والأدوات، ثم يشغّل أوامر فحص الأنواع والـ lint والحراسة المطابقة. لا يشغّل اختبارات Vitest؛ استدعِ `pnpm test:changed` أو `pnpm test <target>` صريحًا لإثبات الاختبار. تشغّل زيادات الإصدار الخاصة ببيانات تعريف الإصدار فقط فحوصات موجهة للإصدار/الإعداد/اعتماديات الجذر، مع حارس يرفض تغييرات الحزمة خارج حقل الإصدار الأعلى مستوى.
    - تشغّل تعديلات عدة ACP الحية في Docker فحوصات مركزة: صياغة shell لسكربتات مصادقة Docker الحية وتجربة تشغيل جافة لمجدول Docker الحي. تُدرج تغييرات `package.json` فقط عندما يكون الفرق محدودًا في `scripts["test:docker:live-*"]`؛ لا تزال تعديلات الاعتماديات، والتصدير، والإصدار، والأسطح الأخرى للحزمة تستخدم الحراس الأوسع.
    - تُوجّه اختبارات الوحدة خفيفة الاستيراد من الوكلاء، والأوامر، وPlugins، ومساعدات الرد التلقائي، و`plugin-sdk`، ومناطق الأدوات الصرفة المشابهة عبر مسار `unit-fast`، الذي يتجاوز `test/setup-openclaw-runtime.ts`؛ تبقى الملفات ذات الحالة/الثقيلة وقت التشغيل على المسارات الحالية.
    - تُعيّن ملفات مصدر مساعدة مختارة من `plugin-sdk` و`commands` أيضًا تشغيلات وضع التغيير إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدين إعادة تشغيل المجموعة الثقيلة كاملة لذلك الدليل.
    - لدى `auto-reply` حاويات مخصصة لمساعدات النواة الأعلى مستوى، واختبارات تكامل `reply.*` الأعلى مستوى، والشجرة الفرعية `src/auto-reply/reply/**`. يقسّم CI أيضًا شجرة الرد الفرعية إلى شظايا مشغّل الوكيل، والإرسال، والأوامر/توجيه الحالة كي لا تمتلك حاوية واحدة كثيفة الاستيراد ذيل Node كاملًا.
    - يتجاوز CI العادي للـ PR/main عمدًا مسح دفعات Plugin وشظية `agentic-plugins` الخاصة بالإصدارات فقط. يرسل التحقق الكامل من الإصدار سير العمل الابن المنفصل `Plugin Prerelease` لتلك المجموعات الثقيلة بالـ Plugin/Plugin على مرشحي الإصدار.

  </Accordion>

  <Accordion title="تغطية المشغل المضمن">

    - عند تغيير مدخلات اكتشاف أداة الرسائل أو سياق وقت تشغيل
      Compaction، احتفظ بمستويي التغطية كليهما.
    - أضف انحدارات مساعدة مركزة لحدود التوجيه والتطبيع الصرفة.
    - حافظ على سلامة مجموعات تكامل المشغل المضمن:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه المجموعات من أن المعرّفات محددة النطاق وسلوك Compaction لا يزالان يتدفقان
      عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ اختبارات المساعدين فقط
      ليست بديلًا كافيًا لتلك مسارات التكامل.

  </Accordion>

  <Accordion title="افتراضيات مجموعة Vitest والعزل">

    - يتم ضبط إعداد Vitest الأساسي افتراضيًا على `threads`.
    - يثبت إعداد Vitest المشترك `isolate: false` ويستخدم
      المشغل غير المعزول عبر المشاريع الجذرية، وإعدادات e2e، والإعدادات الحية.
    - يحافظ مسار الواجهة الجذري على تهيئة `jsdom` والمحسّن الخاص به، لكنه يعمل على
      المشغل المشترك غير المعزول أيضًا.
    - ترث كل شظية `pnpm test` افتراضيات `threads` + `isolate: false`
      نفسها من إعداد Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` إلى عمليات Node الابنة لـ Vitest
      افتراضيًا لتقليل اضطراب ترجمة V8 أثناء التشغيلات المحلية الكبيرة.
      اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8 القياسي.

  </Accordion>

  <Accordion title="التكرار المحلي السريع">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يفعّلها الفرق.
    - خطاف ما قبل الالتزام مخصص للتنسيق فقط. يعيد تجهيز الملفات المنسقة ولا
      يشغّل lint أو فحص الأنواع أو الاختبارات.
    - شغّل `pnpm check:changed` صراحة قبل التسليم أو الدفع عندما
      تحتاج إلى بوابة الفحص المحلي الذكية.
    - يوجّه `pnpm test:changed` عبر مسارات رخيصة محددة النطاق افتراضيًا. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر الوكيل
      أن تعديل العدة أو الإعداد أو الحزمة أو العقد يحتاج فعلًا إلى تغطية Vitest أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه نفسه،
      لكن مع حد أعلى للعاملين.
    - التحجيم التلقائي للعاملين محليًا محافظ عمدًا ويتراجع
      عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، لذلك تُحدث تشغيلات Vitest المتزامنة
      المتعددة ضررًا أقل افتراضيًا.
    - يعلّم إعداد Vitest الأساسي المشاريع/ملفات الإعداد باعتبارها
      `forceRerunTriggers` حتى تبقى عمليات إعادة التشغيل في وضع التغيير صحيحة عندما تتغير
      توصيلات الاختبار.
    - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفين المدعومين؛ اضبط
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت
      موقع ذاكرة مؤقتة صريحًا واحدًا للتنميط المباشر.

  </Accordion>

  <Accordion title="تصحيح الأداء">

    - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى
      مخرجات تفصيل الاستيراد.
    - يحدد `pnpm test:perf:imports:changed` عرض التنميط نفسه إلى
      الملفات المتغيرة منذ `origin/main`.
    - تُكتب بيانات توقيت الشظايا إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم تشغيلات الإعداد الكامل مسار الإعداد كمفتاح؛ وتضيف شظايا CI
      ذات نمط التضمين اسم الشظية حتى يمكن تتبع الشظايا المفلترة
      بشكل منفصل.
    - عندما لا يزال اختبار ساخن واحد يقضي معظم وقته في استيرادات البدء،
      أبقِ الاعتماديات الثقيلة خلف حد محلي ضيق `*.runtime.ts` و
      حاكِ ذلك الحد مباشرة بدلًا من الاستيراد العميق لمساعدات وقت التشغيل فقط
      لتمريرها عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` مسار
      `test:changed` الموجّه مع مسار المشروع الجذري الأصلي لذلك الفرق الملتزم
      ويطبع وقت الجدار بالإضافة إلى أقصى RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة الحالية
      المتسخة عبر توجيه قائمة الملفات المتغيرة من خلال
      `scripts/test-projects.mjs` وإعداد Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لأجل
      كلفة بدء Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغل لأجل
      مجموعة الوحدة مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، مجبر على عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا على local loopback مع تمكين التشخيصات افتراضيًا
  - يدفع تقلبات رسائل Gateway والذاكرة والحمولات الكبيرة الاصطناعية عبر مسار حدث التشخيص
  - يستعلم `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات استمرارية حزمة استقرار التشخيص
  - يؤكد أن المسجل يبقى محدودًا، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق قوائم الانتظار لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج مفاتيح
  - مسار ضيق لمتابعة انحدارات الاستقرار، وليس بديلًا لمجموعة Gateway الكاملة

### E2E (دخان Gateway)

- الأمر: `pnpm test:e2e`
- التهيئة: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts`، و`test/**/*.e2e.test.ts`، واختبارات E2E للـ Plugin المضمّنة ضمن `extensions/`
- الإعدادات الافتراضية للتشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمالًا تكيفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل عبء دخل/خرج الطرفية.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل إخراج الطرفية المفصل.
- النطاق:
  - سلوك Gateway متعدد النسخ من البداية إلى النهاية
  - أسطح WebSocket/HTTP، وإقران Node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تفعيله في خط المعالجة)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات الوحدة (قد يكون أبطأ)

### E2E: اختبار دخاني لخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ Gateway معزولًا لـ OpenShell على المضيف عبر Docker
  - ينشئ صندوق عزل من Dockerfile محلي مؤقت
  - يمرّن خلفية OpenShell في OpenClaw عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات ذي المرجع البعيد عبر جسر fs لصندوق العزل
- التوقعات:
  - اختياري فقط؛ ليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا باسم `openshell` بالإضافة إلى خدمة Docker عاملة
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر Gateway الاختباري وصندوق العزل
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتفعيل الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو سكربت غلاف

### مباشر (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- التهيئة: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`، و`test/**/*.live.test.ts`، واختبارات مباشرة للـ Plugin المضمّنة ضمن `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يعيّن `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - «هل يعمل هذا المزود/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟»
  - التقاط تغييرات تنسيق المزود، وخصوصيات استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - ليس مستقرًا في CI عمدًا (شبكات حقيقية، وسياسات مزودين حقيقية، وحصص، وانقطاعات)
  - يكلّف مالًا / يستخدم حدود المعدل
  - يفضّل تشغيل مجموعات فرعية مضيقة بدلًا من «كل شيء»
- تستورد عمليات التشغيل المباشر `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيًا، تظل عمليات التشغيل المباشر تعزل `HOME` وتنسخ مواد التهيئة/المصادقة إلى منزل اختبار مؤقت بحيث لا تستطيع تجهيزات اختبارات الوحدة تعديل `~/.openclaw` الحقيقي لديك.
- عيّن `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات المباشرة دليل المنزل الحقيقي لديك.
- أصبح `pnpm test:live` يستخدم افتراضيًا وضعًا أهدأ: يحتفظ بإخراج تقدم `[live] ...`، لكنه يكتم إشعار `~/.profile` الإضافي ويسكت سجلات تمهيد Gateway وضوضاء Bonjour. عيّن `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بالمزود): عيّن `*_API_KEYS` بتنسيق فاصلة/فاصلة منقوطة أو `*_API_KEY_1`، و`*_API_KEY_2` (مثل `OPENAI_API_KEYS`، و`ANTHROPIC_API_KEYS`، و`GEMINI_API_KEYS`) أو تجاوزًا خاصًا بالتشغيل المباشر عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- إخراج التقدم/Heartbeat:
  - تصدر مجموعات الاختبارات المباشرة الآن أسطر تقدم إلى stderr لكي تكون استدعاءات المزود الطويلة ظاهرة كنشطة حتى عندما يكون التقاط طرفية Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض طرفية Vitest بحيث تتدفق أسطر تقدم المزود/Gateway فورًا أثناء عمليات التشغيل المباشر.
  - اضبط Heartbeat للنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat للـ Gateway/المسبار باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة اختبارات ينبغي أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات Gateway / بروتوكول WS / الإقران: أضف `pnpm test:e2e`
- تصحيح «الروبوت الخاص بي متوقف» / إخفاقات خاصة بالمزود / استدعاء الأدوات: شغّل `pnpm test:live` مضيقًا

## الاختبارات المباشرة (التي تلمس الشبكة)

لمصفوفة النماذج المباشرة، واختبارات الدخان لخلفية CLI، واختبارات دخان ACP، وحزمة اختبار خادم تطبيق Codex،
وكل اختبارات مزودي الوسائط المباشرة (Deepgram، وBytePlus، وComfyUI، والصور،
والموسيقى، والفيديو، وحزمة اختبار الوسائط) — بالإضافة إلى التعامل مع بيانات الاعتماد لعمليات التشغيل المباشر — راجع
[اختبار مجموعات التشغيل المباشر](/ar/help/testing-live). لقائمة التحقق المخصصة للتحديث
والتحقق من Plugin، راجع
[اختبار التحديثات والـ plugins](/ar/help/testing-updates-plugins).

## مشغلات Docker (فحوصات اختيارية لـ "يعمل في Linux")

تنقسم مشغلات Docker هذه إلى مجموعتين:

- مشغلات النماذج المباشرة: يشغّل `test:docker:live-models` و`test:docker:live-gateway` ملف التشغيل المباشر المطابق لمفتاح ملف التعريف فقط داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل التهيئة المحلي ومساحة العمل لديك (واستيراد `~/.profile` إذا كان مركبًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغلات Docker المباشرة افتراضيًا حدًا أصغر لاختبار دخاني بحيث يظل مسح Docker الكامل عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة هذه عندما تريد
  صراحةً الفحص الشامل الأكبر.
- يبني `test:docker:all` صورة Docker المباشرة مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كحزمة npm tarball من خلال `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة العارية هي فقط مشغل Node/Git لمسارات التثبيت/التحديث/اعتماديات Plugin؛ تركّب هذه المسارات حزمة tarball المبنية مسبقًا. تثبّت الصورة الوظيفية حزمة tarball نفسها في `/app` لمسارات وظائف التطبيق المبني. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق التخطيط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في خانات العمليات، بينما تمنع حدود الموارد مسارات التشغيل المباشر الثقيلة، وتثبيت npm، والمسارات متعددة الخدمات من البدء كلها في وقت واحد. إذا كان مسار واحد أثقل من الحدود النشطة، يستطيع المجدول رغم ذلك بدءه عندما يكون المجمّع فارغًا ثم يبقيه يعمل وحده حتى تتوفر السعة مرة أخرى. الإعدادات الافتراضية هي 10 خانات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما يكون لدى مضيف Docker مساحة أكبر. ينفّذ المشغل فحص Docker تمهيديًا افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزّن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في عمليات التشغيل اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون دون بناء Docker أو تشغيله، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة، واحتياجات الحزمة/الصورة، وبيانات الاعتماد.
- `Package Acceptance` هو بوابة الحزمة الأصلية في GitHub للسؤال: "هل تعمل حزمة tarball القابلة للتثبيت هذه كمنتج؟" يحدد حزمة مرشحة واحدة من `source=npm`، أو `source=ref`، أو `source=url`، أو `source=artifact`، ويرفعها باسم `package-under-test`، ثم يشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد حزمة tarball تلك بالضبط بدلًا من إعادة حزم المرجع المحدد. ترتّب ملفات التعريف حسب الاتساع: `smoke`، و`package`، و`product`، و`full`. راجع [اختبار التحديثات والـ plugins](/ar/help/testing-updates-plugins) لعقد الحزمة/التحديث/Plugin، ومصفوفة البقاء للترقية المنشورة، وافتراضيات الإصدار، وفرز الإخفاقات.
- تشغّل فحوصات البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يسير الحارس عبر الرسم البياني المبني الثابت من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا استورد بدء التشغيل قبل الإرسال اعتماديات حزم مثل Commander، أو واجهة المطالبات، أو undici، أو التسجيل قبل إرسال الأمر؛ كما يبقي جزء تشغيل Gateway المضمّن ضمن الميزانية ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة. يغطي اختبار دخان CLI المعبأ أيضًا مساعدة الجذر، ومساعدة الإعداد، ومساعدة doctor، والحالة، ومخطط التهيئة، وأمر قائمة النماذج.
- يقتصر توافق `Package Acceptance` القديم على `2026.4.25` (ويشمل `2026.4.25-beta.*`). حتى ذلك الحد، تتسامح حزمة الاختبار فقط مع فجوات بيانات وصفية للحزمة المشحونة: إدخالات جرد QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات التصحيح في تجهيز git المشتق من حزمة tarball، وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة، وغياب استمرار سجلات تثبيت السوق، وترحيل بيانات وصفية للتهيئة أثناء `plugins update`. بالنسبة للحزم بعد `2026.4.25`، تكون هذه المسارات إخفاقات صارمة.
- مشغلات اختبار دخان الحاويات: `test:docker:openwebui`، و`test:docker:onboard`، و`test:docker:npm-onboard-channel-agent`، و`test:docker:update-channel-switch`، و`test:docker:upgrade-survivor`، و`test:docker:published-upgrade-survivor`، و`test:docker:session-runtime-context`، و`test:docker:agents-delete-shared-workspace`، و`test:docker:gateway-network`، و`test:docker:browser-cdp-snapshot`، و`test:docker:mcp-channels`، و`test:docker:pi-bundle-mcp-tools`، و`test:docker:cron-mcp-cleanup`، و`test:docker:plugins`، و`test:docker:plugin-update`، و`test:docker:plugin-lifecycle-matrix`، و`test:docker:config-reload` تشغّل حاوية حقيقية واحدة أو أكثر وتتحقق من مسارات تكامل أعلى مستوى.

تركّب مشغلات Docker للنماذج المباشرة أيضًا منازل مصادقة CLI اللازمة فقط (أو كل المنازل المدعومة عندما لا يكون التشغيل مضيقًا)، ثم تنسخها إلى منزل الحاوية قبل التشغيل حتى يستطيع OAuth الخاص بواجهة CLI الخارجية تحديث الرموز دون تعديل مخزن مصادقة المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكريبت: `scripts/test-live-models-docker.sh`)
- اختبار دخان ربط ACP: `pnpm test:docker:live-acp-bind` (السكريبت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيًا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- اختبار دخان خلفية CLI: `pnpm test:docker:live-cli-backend` (السكريبت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار دخان حزام خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (السكريبت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكريبت: `scripts/test-live-gateway-models-docker.sh`)
- اختبار دخان قابلية المراقبة: `pnpm qa:otel:smoke` هو مسار QA خاص من نسخة المصدر. وهو ليس جزءًا من مسارات إصدار Docker للحزمة عمدًا لأن كرة npm لا تتضمن QA Lab.
- اختبار دخان Open WebUI مباشر: `pnpm test:docker:openwebui` (السكريبت: `scripts/e2e/openwebui-docker.sh`)
- معالج التهيئة (TTY، سقالة كاملة): `pnpm test:docker:onboard` (السكريبت: `scripts/e2e/onboard-docker.sh`)
- اختبار دخان تهيئة/قناة/وكيل كرة Npm: يثبت `pnpm test:docker:npm-onboard-channel-agent` كرة OpenClaw المعبأة عالميًا في Docker، ويضبط OpenAI عبر تهيئة مرجعية من البيئة إضافة إلى Telegram افتراضيًا، ويشغّل الطبيب، ويشغّل دورة وكيل OpenAI واحدة بمحاكاة. أعد استخدام كرة مبنية مسبقًا مع `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة بناء المضيف مع `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة مع `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` أو `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- اختبار دخان تبديل قناة التحديث: يثبت `pnpm test:docker:update-channel-switch` كرة OpenClaw المعبأة عالميًا في Docker، ويبدّل من حزمة `stable` إلى git `dev`، ويتحقق من عمل القناة المحفوظة وPlugin بعد التحديث، ثم يبدّل عائدًا إلى حزمة `stable` ويفحص حالة التحديث.
- اختبار دخان ناجي الترقية: يثبت `pnpm test:docker:upgrade-survivor` كرة OpenClaw المعبأة فوق تجهيز مستخدم قديم متسخ يحتوي على وكلاء، وإعداد قناة، وقوائم سماح Plugin، وحالة اعتماد Plugin قديمة، وملفات مساحة عمل/جلسة موجودة. يشغّل تحديث الحزمة مع الطبيب غير التفاعلي دون مزود مباشر أو مفاتيح قناة، ثم يبدأ Gateway عبر local loopback ويفحص حفظ الإعدادات/الحالة إضافة إلى ميزانيات بدء التشغيل/الحالة.
- اختبار دخان ناجي الترقية المنشورة: يثبت `pnpm test:docker:published-upgrade-survivor` الحزمة `openclaw@latest` افتراضيًا، ويزرع ملفات مستخدم موجود واقعية، ويضبط ذلك الخط الأساسي بوصفة أوامر مضمنة، ويتحقق من الإعداد الناتج، ويحدّث ذلك التثبيت المنشور إلى كرة المرشح، ويشغّل الطبيب غير التفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر local loopback ويفحص المقاصد المضبوطة، وحفظ الحالة، وبدء التشغيل، و`/healthz`، و`/readyz`، وميزانيات حالة RPC. تجاوز خطًا أساسيًا واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، واطلب من المجدول التجميعي توسيع الخطوط الأساسية المحلية الدقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`، ووسّع تجهيزات بشكل البلاغات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues`؛ تتضمن مجموعة البلاغات `configured-plugin-installs` لإصلاح تثبيت Plugin OpenClaw خارجيًا تلقائيًا. تعرض Package Acceptance هذه القيم باسم `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`، وتحل رموز الخط الأساسي الوصفية مثل `last-stable-4` أو `all-since-2026.4.23`، وتوسّع Full Release Validation بوابة حزمة الاختبار المطوّل للإصدار إلى `last-stable-4 2026.4.23 2026.5.2 2026.4.15` إضافة إلى `reported-issues`.
- اختبار دخان سياق تشغيل الجلسة: يتحقق `pnpm test:docker:session-runtime-context` من استمرار نص سياق التشغيل المخفي إضافة إلى إصلاح الطبيب للفروع المتأثرة المكررة لإعادة كتابة المطالبة.
- اختبار دخان التثبيت العالمي عبر Bun: يحزم `bash scripts/e2e/bun-global-install-smoke.sh` الشجرة الحالية، ويثبتها باستخدام `bun install -g` في منزل معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد مزودي صور مضمّنين بدلًا من التعليق. أعد استخدام كرة مبنية مسبقًا مع `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ بناء المضيف مع `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- اختبار دخان مثبت Docker: يشارك `bash scripts/test-install-sh-docker.sh` ذاكرة تخزين npm مؤقتة واحدة بين حاويات الجذر والتحديث وdirect-npm. يعتمد اختبار دخان التحديث افتراضيًا على npm `latest` كخط أساسي مستقر قبل الترقية إلى كرة المرشح. تجاوزه باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` محليًا، أو باستخدام إدخال `update_baseline_version` في سير عمل Install Smoke على GitHub. تحتفظ فحوصات المثبت غير الجذري بذاكرة تخزين npm مؤقتة معزولة حتى لا تخفي إدخالات الذاكرة المؤقتة المملوكة للجذر سلوك التثبيت المحلي للمستخدم. عيّن `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة التخزين المؤقت root/update/direct-npm عبر الإعادات المحلية.
- يتخطى Install Smoke CI التحديث العالمي المباشر المكرر عبر npm باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل السكريبت محليًا دون هذا المتغير عند الحاجة إلى تغطية `npm install -g` المباشرة.
- اختبار دخان CLI لحذف الوكلاء لمساحة عمل مشتركة: يبني `pnpm test:docker:agents-delete-shared-workspace` (السكريبت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) صورة Dockerfile الجذرية افتراضيًا، ويزرع وكيلين مع مساحة عمل واحدة في منزل حاوية معزول، ويشغّل `agents delete --json`، ويتحقق من JSON صالح إضافة إلى سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke مع `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكريبت: `scripts/e2e/gateway-network-docker.sh`)
- اختبار دخان لقطة Browser CDP: يبني `pnpm test:docker:browser-cdp-snapshot` (السكريبت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) صورة E2E المصدر إضافة إلى طبقة Chromium، ويبدأ Chromium مع CDP الخام، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي عناوين URL للروابط، والعناصر القابلة للنقر المرقّاة بالمؤشر، ومراجع iframe، وبيانات الإطار الوصفية.
- انحدار الاستدلال الأدنى لـ OpenAI Responses web_search: يشغّل `pnpm test:docker:openai-web-search-minimal` (السكريبت: `scripts/e2e/openai-web-search-minimal-docker.sh`) خادم OpenAI بمحاكاة عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط المزود ويفحص ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + اختبار دخان إطار إشعار Claude خام): `pnpm test:docker:mcp-channels` (السكريبت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة Pi (خادم MCP stdio حقيقي + اختبار دخان سماح/رفض ملف Pi الشخصي المضمن): `pnpm test:docker:pi-bundle-mcp-tools` (السكريبت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف MCP لـ Cron/الوكيل الفرعي (Gateway حقيقي + تفكيك ابن MCP عبر stdio بعد تشغيلات cron معزولة ووكيل فرعي لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكريبت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (اختبار دخان التثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع الاعتمادات المرفوعة، ومراجع git المتحركة، وحزمة ClawHub شاملة، وتحديثات السوق، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (السكريبت: `scripts/e2e/plugins-docker.sh`)
  عيّن `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/التشغيل الافتراضي الشامل باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. دون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم تجهيز ClawHub محليًا ومحكم العزل.
- اختبار دخان عدم تغير تحديث Plugin: `pnpm test:docker:plugin-update` (السكريبت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- اختبار دخان مصفوفة دورة حياة Plugin: يثبت `pnpm test:docker:plugin-lifecycle-matrix` كرة OpenClaw المعبأة في حاوية عارية، ويثبت Plugin من npm، ويبدّل التمكين/التعطيل، ويرقيه ويخفضه عبر سجل npm محلي، ويحذف الشيفرة المثبتة، ثم يتحقق من أن إلغاء التثبيت لا يزال يزيل الحالة القديمة مع تسجيل مقاييس RSS/CPU لكل مرحلة من دورة الحياة.
- اختبار دخان بيانات إعادة تحميل الإعدادات الوصفية: `pnpm test:docker:config-reload` (السكريبت: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: يغطي `pnpm test:docker:plugins` اختبار دخان التثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع الاعتمادات المرفوعة، ومراجع git المتحركة، وتجهيزات ClawHub، وتحديثات السوق، وتمكين/فحص حزمة Claude. يغطي `pnpm test:docker:plugin-update` سلوك التحديث غير المتغير لـ Plugins المثبتة. يغطي `pnpm test:docker:plugin-lifecycle-matrix` تثبيت Plugin من npm مع تتبع الموارد، والتمكين، والتعطيل، والترقية، والتخفيض، وإلغاء التثبيت عند فقدان الشيفرة.

لبناء صورة الوظائف المشتركة مسبقًا وإعادة استخدامها يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بالأجنحة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ذات أولوية عند تعيينها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكريبتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات QR وDocker للمثبت بملفات Dockerfiles الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلًا من تشغيل التطبيق المبني المشترك.

تقوم مشغّلات Docker للنماذج المباشرة أيضًا بربط التحميل للنسخة الحالية من المستودع بوضع القراءة فقط
وتجهيزها في دليل عمل مؤقت داخل الحاوية. يحافظ هذا على صورة وقت التشغيل
خفيفة، مع الاستمرار في تشغيل Vitest على مصدر/إعداداتك المحلية نفسها.
تتخطى خطوة التجهيز ذاكرات التخزين المؤقت الكبيرة المحلية فقط ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` المحلية للتطبيق أو
أدلة مخرجات Gradle، حتى لا تقضي عمليات Docker المباشرة دقائق في نسخ
آثار خاصة بالجهاز.
كما أنها تضبط `OPENCLAW_SKIP_CHANNELS=1` بحيث لا تبدأ عمليات فحص Gateway المباشرة
عمال قنوات Telegram/Discord/إلخ. حقيقيين داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذلك مرّر أيضًا
`OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
المباشرة من مسار Docker ذاك.
`test:docker:openwebui` هو فحص توافق أعلى مستوى: يبدأ حاوية
Gateway من OpenClaw مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبّتة الإصدار مقابل ذلك Gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` تعرض `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وكيل `/api/chat/completions` الخاص بـ Open WebUI.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد يحتاج Open WebUI إلى إنهاء إعداد البدء البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج مباشرًا صالحًا للاستخدام، ويُعد `OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيًا) الطريقة الأساسية لتوفيره في عمليات التشغيل داخل Docker.
تطبع عمليات التشغيل الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عمدًا ولا يحتاج إلى حساب Telegram أو Discord أو iMessage
حقيقي. يبدأ حاوية Gateway مزروعة بالبيانات، ويبدأ حاوية ثانية تنشئ
`openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءات النصوص،
وبيانات تعريف المرفقات، وسلوك طابور الأحداث المباشر، وتوجيه الإرسال الصادر،
وإشعارات القناة + الأذونات بأسلوب Claude عبر جسر stdio MCP الحقيقي. يفحص تحقق الإشعارات
إطارات stdio MCP الخام مباشرة، بحيث يؤكد الفحص ما يصدره الجسر فعليًا،
وليس فقط ما يظهره SDK عميل معيّن.
`test:docker:pi-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج مباشر.
يبني صورة Docker للمستودع، ويبدأ خادم فحص stdio MCP حقيقيًا
داخل الحاوية، ويجسّد ذلك الخادم عبر وقت تشغيل MCP المضمّن في حزمة Pi،
وينفّذ الأداة، ثم يتحقق من أن `coding` و`messaging` يبقيان
أدوات `bundle-mcp` بينما تقوم `minimal` و`tools.deny: ["bundle-mcp"]` بترشيحها.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج مباشر.
يبدأ Gateway مزروعًا بالبيانات مع خادم فحص stdio MCP حقيقي، ويشغّل
دورة cron معزولة ودورة ابن لمرة واحدة عبر `/subagents spawn`، ثم يتحقق
من خروج عملية MCP الابنة بعد كل تشغيل.

فحص يدوي بلغة ACP عادية لسلاسل المحادثة (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- أبقِ هذا السكربت لتدفقات عمل الانحدار/تصحيح الأخطاء. قد تكون هناك حاجة إليه مجددًا للتحقق من توجيه سلاسل ACP، لذلك لا تحذفه.

متغيرات بيئة مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) يُحمّل إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) يُحمّل إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) يُحمّل إلى `/home/node/.profile` ويُقرأ قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المقروءة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعداد/مساحة عمل مؤقتة ومن دون تحميلات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) يُحمّل إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- تُحمّل أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` بوضع القراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - عمليات تشغيل الموفّرين المضيّقة تُحمّل فقط الأدلة/الملفات اللازمة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز ذلك يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لترشيح الموفّرين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لإعادات التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن الملف الشخصي (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لفحص Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز مطالبة تحقق nonce المستخدمة في فحص Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبّتة

## سلامة الوثائق

شغّل فحوصات الوثائق بعد تعديلات الوثائق: `pnpm check:docs`.
شغّل تحقق روابط Mintlify الكامل للمراسي عندما تحتاج أيضًا إلى فحوصات العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه انحدارات “مسار حقيقي” من دون موفّرين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة وكيل): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج إعداد Gateway (WS `wizard.start`/`wizard.next`، يكتب الإعداد + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل “تقييمات موثوقية الوكيل”:

- استدعاء أدوات وهمي عبر Gateway الحقيقي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات معالج إعداد شاملة تتحقق من توصيل الجلسة وتأثيرات الإعداد (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودًا لـ Skills (انظر [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في المطالبة، هل يختار الوكيل Skill المناسبة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الدورات تؤكد ترتيب الأدوات، واستمرارية سجل الجلسة، وحدود sandbox.

ينبغي أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم موفّرين وهميين لتأكيد استدعاءات الأدوات + ترتيبها، وقراءات ملف Skill، وتوصيل الجلسة.
- مجموعة صغيرة من السيناريوهات المركزة على Skills (الاستخدام مقابل التجنب، البوابات، حقن المطالبات).
- تقييمات مباشرة اختيارية (تفعيل اختياري ومحكومة بالبيئة) فقط بعد وجود المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلين يلتزمان
بعقد الواجهة الخاص بهما. تكرر المرور على كل Plugins المكتشفة وتشغّل مجموعة
من تأكيدات الشكل والسلوك. يتخطى مسار وحدات `pnpm test` الافتراضي عمدًا
ملفات الفحص والدخان لهذه الواجهات المشتركة؛ شغّل أوامر العقود صراحة
عندما تلمس أسطح القنوات المشتركة أو الموفّرين.

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
- **threading** - معالجة معرّف سلسلة المحادثة
- **directory** - واجهة API للدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة الموفّرين

موجودة في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugins

### عقود الموفّرين

موجودة في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - API كتالوج النماذج
- **discovery** - اكتشاف Plugins
- **loader** - تحميل Plugins
- **runtime** - وقت تشغيل الموفّر
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تُشغّل

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة أو تعديل قناة أو Plugin موفّر
- بعد إعادة هيكلة تسجيل Plugins أو اكتشافها

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة انحدارات (إرشادات)

عندما تصلح مشكلة موفّر/نموذج مكتشفة في التشغيل المباشر:

- أضف انحدارًا آمنًا لـ CI إن أمكن (موفّر وهمي/بديل، أو التقط تحويل شكل الطلب بدقة)
- إذا كانت بطبيعتها مباشرة فقط (حدود المعدل، سياسات المصادقة)، فأبقِ الاختبار المباشر ضيقًا ومفعّلًا اختياريًا عبر متغيرات البيئة
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ تحويل/إعادة تشغيل طلب الموفّر → اختبار نماذج مباشر
  - خطأ في مسار جلسة/سجل/أدوات Gateway → فحص Gateway مباشر أو اختبار Gateway وهمي آمن لـ CI
- حاجز حماية اجتياز SecretRef:
  - يستنتج `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا عيّنيًا واحدًا لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرّفات exec ذات مقطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة مع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند معرّفات الأهداف غير المصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذات صلة

- [اختبار التشغيل المباشر](/ar/help/testing-live)
- [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)
- [CI](/ar/ci)
