---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النموذج/المزوّد
    - تصحيح أخطاء سلوك Gateway والوكيل
summary: 'مجموعة أدوات الاختبار: حِزم اختبارات unit/e2e/live، ومشغلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-05-02T20:48:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: a5bfbd2ea78b05ca23e97318943e0043645814d2aa4ccb7540a2bf7c601d0d09
    source_path: help/testing.md
    workflow: 16
---

لدى OpenClaw ثلاث مجموعات Vitest (الوحدة/التكامل، e2e، المباشرة) ومجموعة صغيرة
من مشغلات Docker. هذا المستند هو دليل "كيف نختبر":

- ما الذي تغطيه كل مجموعة (وما الذي لا تغطيه عمدًا).
- الأوامر التي يجب تشغيلها لسير العمل الشائع (محليًا، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات المباشرة بيانات الاعتماد وتختار النماذج/المزودين.
- كيف تضيف اختبارات تراجعية لمشكلات النماذج/المزودين الواقعية.

<Note>
**مكدس QA (qa-lab، qa-channel، ومسارات النقل المباشر)** موثق بشكل منفصل:

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) — البنية، سطح الأوامر، وتأليف السيناريوهات.
- [Matrix QA](/ar/concepts/qa-matrix) — مرجع لـ `pnpm openclaw qa matrix`.
- [قناة QA](/ar/channels/qa-channel) — Plugin النقل الاصطناعي المستخدم في السيناريوهات المدعومة من المستودع.

تغطي هذه الصفحة تشغيل مجموعات الاختبار العادية ومشغلات Docker/Parallels. يسرد قسم المشغلات الخاصة بـ QA أدناه ([المشغلات الخاصة بـ QA](#qa-specific-runners)) استدعاءات `qa` المحددة ويشير مرة أخرى إلى المراجع أعلاه.
</Note>

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع للمجموعة الكاملة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- الاستهداف المباشر للملفات يوجه الآن مسارات الإضافات/القنوات أيضًا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تكرر العمل على فشل واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA المدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عند لمس الاختبارات أو الرغبة في ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح المزودين/النماذج الحقيقيين (يتطلب بيانات اعتماد حقيقية):

- المجموعة المباشرة (النماذج + مجسات أداة/صورة Gateway): `pnpm test:live`
- استهداف ملف مباشر واحد بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- تقارير أداء وقت التشغيل: شغّل `OpenClaw Performance` مع
  `live_gpt54=true` لدورة وكيل `openai/gpt-5.4` حقيقية أو
  `deep_profile=true` لآثار Kova الخاصة بالمعالج/الكومة/التتبع. تنشر التشغيلات اليومية المجدولة
  آثار مسارات المزود الوهمي، والملف العميق، وGPT 5.4 إلى
  `openclaw/clawgrit-reports` عندما يكون `CLAWGRIT_REPORTS_TOKEN` مضبوطًا. يتضمن
  تقرير المزود الوهمي أيضًا أرقام إقلاع Gateway على مستوى المصدر، والذاكرة،
  وضغط الـ Plugin، وحلقة الترحيب المتكررة للنموذج الوهمي، وبدء CLI.
- مسح النماذج المباشر عبر Docker: `pnpm test:docker:live-models`
  - يشغل كل نموذج محدد دورة نصية إضافة إلى مجس صغير بنمط قراءة ملف.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغل أيضًا دورة صورة صغيرة.
    عطّل المجسات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل إخفاقات المزود.
  - تغطية CI: يستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومي و
    `OpenClaw Release Checks` اليدوي سير العمل القابل لإعادة الاستخدام المباشر/E2E مع
    `include_live_suites: true`، وهو ما يتضمن مهام مصفوفة منفصلة لنماذج Docker المباشرة
    مجزأة حسب المزود.
  - لإعادات تشغيل CI مركزة، شغّل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و `live_models_only: true`.
  - أضف أسرار مزودين جديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    إضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` والمستدعين
    المجدولين/الخاصة بالإصدار.
- اختبار دخاني لدردشة Codex الأصلية المرتبطة: `pnpm test:docker:live-codex-bind`
  - يشغل مسار Docker مباشرًا مقابل مسار خادم تطبيق Codex، ويربط رسالة Slack مباشرة اصطناعية
    باستخدام `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من رد عادي ومرفق صورة
    يمران عبر ربط الـ Plugin الأصلي بدلًا من ACP.
- اختبار دخاني لحاضنة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغل دورات وكيل Gateway عبر حاضنة خادم تطبيق Codex المملوكة للـ Plugin،
    ويتحقق من `/codex status` و `/codex models`، ويمارس افتراضيًا مجسات الصورة،
    وcron MCP، والوكيل الفرعي، وGuardian. عطّل مجس الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل إخفاقات أخرى في
    خادم تطبيق Codex. لفحص وكيل فرعي مركز، عطّل المجسات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد مجس الوكيل الفرعي ما لم يتم ضبط
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- اختبار دخاني لأمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري احتياطي متشدد لسطح أمر الإنقاذ لقناة الرسائل.
    يمارس `/crestodian status`، ويضع في الطابور تغيير نموذج مستمرًا،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعدادات.
- اختبار دخاني لمخطط Crestodian عبر Docker: `pnpm test:docker:crestodian-planner`
  - يشغل Crestodian في حاوية بلا إعدادات مع Claude CLI وهمي على `PATH`
    ويتحقق من أن رجوع المخطط الضبابي يترجم إلى كتابة إعدادات نمطية مدققة.
- اختبار دخاني للتشغيل الأول لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من مجلد حالة OpenClaw فارغ، ويوجه `openclaw` العاري إلى
    Crestodian، ويطبق كتابات الإعداد/النموذج/الوكيل/Discord Plugin + SecretRef،
    ويتحقق من الإعدادات، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضًا في QA Lab بواسطة
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- اختبار دخاني لتكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مع `moonshot/kimi-k2.6`. تحقق من أن JSON يورد Moonshot/K2.6 وأن
  سجل المساعد يخزن `usage.cost` مطبّعة.

<Tip>
عندما تحتاج إلى حالة فاشلة واحدة فقط، فضّل تضييق الاختبارات المباشرة عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## المشغلات الخاصة بـ QA

تقع هذه الأوامر بجانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغل CI ‏QA Lab في سير عمل مخصص. تكون مطابقة الوكلاء متداخلة تحت
`QA-Lab - All Lanes` والتحقق من الإصدار، وليست سير عمل PR مستقلًا.
ينبغي للتحقق الواسع استخدام `Full Release Validation` مع
`rerun_group=qa-parity` أو مجموعة QA الخاصة بفحوصات الإصدار. يعمل `QA-Lab - All Lanes`
ليليًا على `main` ومن التشغيل اليدوي مع مسار المطابقة الوهمي، ومسار Matrix المباشر،
ومسار Telegram المباشر المدار بواسطة Convex، ومسار Discord المباشر المدار بواسطة Convex
كمهام متوازية. تمرر QA المجدولة وفحوصات الإصدار
`--profile fast` إلى Matrix صراحة، بينما تبقى القيمة الافتراضية لمدخلات Matrix CLI وسير العمل اليدوي
`all`؛ يمكن للتشغيل اليدوي تجزئة `all` إلى مهام `transport`،
و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`. يشغل `OpenClaw Release
Checks` المطابقة إضافة إلى مساري Matrix وTelegram السريعين قبل موافقة الإصدار،
باستخدام `mock-openai/gpt-5.5` لفحوصات نقل الإصدار بحيث تبقى
حتمية وتتجنب بدء تشغيل Plugin المزود العادي. تعطل Gateways النقل المباشر هذه
بحث الذاكرة؛ يبقى سلوك الذاكرة مغطى بواسطة مجموعات مطابقة QA.

تستخدم أجزاء الوسائط المباشرة للتحقق الكامل من الإصدار
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، الذي يحتوي بالفعل على
`ffmpeg` و`ffprobe`. تستخدم أجزاء نماذج/خلفيات Docker المباشرة صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
التزام محدد، ثم تسحبها باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلًا من إعادة البناء
داخل كل جزء.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات ضمان الجودة المدعومة بالمستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا باستخدام عمال Gateway
    معزولين. يكون `qa-channel` افتراضيًا بتزامن 4 (محدودًا بعدد السيناريوهات
    المحددة). استخدم `--concurrency <count>` لضبط عدد العمال، أو
    `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد الحصول على artifacts بدون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم مزوّد محليًا مدعومًا بـ AIMock لتغطية تجريبية
    للتركيبات ومحاكاة البروتوكول بدون استبدال مسار `mock-openai` الواعي
    بالسيناريوهات.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل مقياس بدء تشغيل Gateway بالإضافة إلى حزمة صغيرة من سيناريوهات QA Lab
    الوهمية (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) ويكتب ملخصًا مدمجًا لملاحظات وحدة المعالجة
    المركزية تحت `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم افتراضيًا ملاحظات سخونة وحدة المعالجة المركزية المستمرة فقط
    (`--cpu-core-warn` بالإضافة إلى `--hot-wall-warn-ms`)، لذلك تُسجّل
    اندفاعات بدء التشغيل القصيرة كمقاييس بدون أن تبدو كارتداد تثبيت Gateway
    الممتد لدقائق.
  - يستخدم artifacts المبنية في `dist`؛ شغّل بناءً أولًا عندما لا يحتوي
    checkout على مخرجات runtime حديثة بالفعل.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة ضمان الجودة نفسها داخل آلة Linux افتراضية مؤقتة من Multipass.
  - يحافظ على سلوك اختيار السيناريوهات نفسه مثل `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزوّد/النموذج نفسها مثل `qa suite`.
  - تمرّر التشغيلات الحية مدخلات مصادقة ضمان الجودة المدعومة والعملية للضيف:
    مفاتيح المزوّد المستندة إلى env، ومسار تهيئة مزوّد ضمان الجودة الحي،
    و`CODEX_HOME` عند وجوده.
  - يجب أن تبقى أدلة الإخراج تحت جذر المستودع حتى يتمكن الضيف من الكتابة مرة
    أخرى عبر مساحة العمل المركبة.
  - يكتب تقرير ضمان الجودة العادي والملخص بالإضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع ضمان الجودة المدعوم بـ Docker لعمل ضمان الجودة بأسلوب المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني tarball لـ npm من checkout الحالي، ويثبّته عالميًا في Docker،
    ويشغّل إعداد OpenAI API-key غير التفاعلي، ويهيئ Telegram افتراضيًا،
    ويتحقق من أن runtime الخاص بـ Plugin المعبأ يُحمّل بدون إصلاح تبعيات
    بدء التشغيل، ويشغّل doctor، ويشغّل دورة agent محلية واحدة مقابل endpoint
    وهمي لـ OpenAI.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ
    نفسه مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل smoke حتميًا لتطبيق مبني داخل Docker لنصوص سياق runtime المضمن.
    يتحقق من أن سياق runtime المخفي لـ OpenClaw يستمر كرسالة مخصصة غير معروضة
    بدلًا من التسرب إلى دورة المستخدم المرئية، ثم يزرع ملف JSONL لجلسة معطلة
    متأثرة ويتحقق من أن `openclaw doctor --fix` يعيد كتابته إلى الفرع النشط مع
    نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبّت مرشح حزمة OpenClaw في Docker، ويشغّل إعداد الحزمة المثبتة، ويهيئ
    Telegram عبر CLI المثبت، ثم يعيد استخدام مسار ضمان الجودة الحي لـ Telegram
    مع تلك الحزمة المثبتة بوصفها SUT Gateway.
  - القيمة الافتراضية هي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛
    عيّن `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار tarball محلي محلول بدلًا من التثبيت
    من السجل.
  - يستخدم بيانات اعتماد env نفسها لـ Telegram أو مصدر بيانات اعتماد Convex
    نفسه مثل `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، عيّن
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` بالإضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. إذا كان
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI، فسيختار غلاف
    Docker Convex تلقائيًا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`
    `OPENCLAW_QA_CREDENTIAL_ROLE` المشترك لهذا المسار فقط.
  - تعرض GitHub Actions هذا المسار كسير عمل يدوي للمشرفين باسم
    `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة
    `qa-live-shared` وتأجيرات بيانات اعتماد Convex CI.
- تعرض GitHub Actions أيضًا `Package Acceptance` لإثبات المنتج الجانبي مقابل
  حزمة مرشحة واحدة. يقبل مرجعًا موثوقًا، أو مواصفة npm منشورة، أو عنوان URL
  لـ tarball عبر HTTPS مع SHA-256، أو artifact لـ tarball من تشغيل آخر، ويرفع
  `openclaw-current.tgz` الموحّد باسم `package-under-test`، ثم يشغّل مجدول
  Docker E2E الحالي بملفات تعريف مسارات smoke أو package أو product أو full أو
  custom. عيّن `telegram_mode=mock-openai` أو `live-frontier` لتشغيل سير عمل
  ضمان الجودة لـ Telegram مقابل artifact نفسه `package-under-test`.
  - إثبات المنتج لأحدث beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات عنوان URL دقيق لـ tarball موجزًا:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- ينزّل إثبات artifact أداة tarball من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - يحزم بناء OpenClaw الحالي ويثبته في Docker، ويبدأ Gateway مع تهيئة OpenAI،
    ثم يفعّل القنوات/Plugins المضمّنة عبر تعديلات التهيئة.
  - يتحقق من أن اكتشاف الإعداد يترك Plugins القابلة للتنزيل غير المهيأة غائبة،
    وأن أول إصلاح doctor مهيأ يثبّت كل Plugin قابلة للتنزيل مفقودة صراحةً، وأن
    إعادة تشغيل ثانية لا تشغّل إصلاح تبعيات مخفيًا.
  - يثبّت أيضًا خط أساس npm أقدم معروفًا، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن doctor بعد التحديث
    للمرشح ينظف بقايا تبعيات Plugin القديمة بدون إصلاح postinstall من جهة
    harness.
- `pnpm test:parallels:npm-update`
  - يشغّل smoke تحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. تثبّت كل منصة
    محددة أولًا حزمة خط الأساس المطلوبة، ثم تشغّل الأمر المثبت
    `openclaw update` في الضيف نفسه وتتحقق من الإصدار المثبت، وحالة التحديث،
    وجاهزية Gateway، ودورة agent محلية واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux`
    أثناء التكرار على ضيف واحد. استخدم `--json` لمسار artifact الخاص بالملخص
    وحالة كل مسار.
  - يستخدم مسار OpenAI `openai/gpt-5.5` لإثبات دورة agent الحية افتراضيًا.
    مرّر `--model <provider/model>` أو عيّن `OPENCLAW_PARALLELS_OPENAI_MODEL`
    عند التحقق عمدًا من نموذج OpenAI آخر.
  - لفّ التشغيلات المحلية الطويلة بمهلة على المضيف حتى لا تستهلك تعثرات نقل
    Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسارات متداخلة تحت `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي عالق.
  - يمكن أن يستغرق تحديث Windows من 10 إلى 15 دقيقة في doctor بعد التحديث
    وعمل تحديث الحزمة على ضيف بارد؛ يظل ذلك سليمًا عندما يكون سجل npm debug
    المتداخل يتقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات smoke الفردية لـ Parallels
    على macOS أو Windows أو Linux. فهي تشترك في حالة الآلة الافتراضية ويمكن أن
    تتصادم عند استعادة اللقطة، أو تقديم الحزمة، أو حالة Gateway الخاصة بالضيف.
  - يشغّل إثبات ما بعد التحديث سطح Plugin المضمّن العادي لأن واجهات القدرة مثل
    الكلام، وتوليد الصور، وفهم الوسائط تُحمّل عبر واجهات API الخاصة بـ runtime
    المضمّن حتى عندما تتحقق دورة agent نفسها من استجابة نصية بسيطة فقط.

- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم مزوّد AIMock المحلي لاختبار smoke مباشر للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار ضمان الجودة الحي لـ Matrix مقابل خادم Tuwunel منزلي مؤقت مدعوم بـ Docker. checkout المصدر فقط — لا تشحن التثبيتات المعبأة `qa-lab`.
  - CLI الكامل، وكتالوج الملف الشخصي/السيناريو، ومتغيرات env، وتخطيط artifacts: [ضمان جودة Matrix](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار ضمان الجودة الحي لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رموز driver وSUT bot من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرف المجموعة هو معرف محادثة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمعة. استخدم وضع env افتراضيًا، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في التأجيرات المجمعة.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد الحصول على artifacts بدون رمز خروج فاشل.
  - يتطلب بوتين متميزين في المجموعة الخاصة نفسها، مع إظهار SUT bot لاسم مستخدم Telegram.
  - لملاحظة مستقرة بين البوتات، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا البوتين وتأكد من أن driver bot يمكنه ملاحظة حركة مرور بوتات المجموعة.
  - يكتب تقرير ضمان الجودة لـ Telegram، وملخصًا، وartifact للرسائل المرصودة تحت `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال driver إلى رد SUT المرصود.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ توجد مصفوفة تغطية كل مسار في [نظرة عامة على ضمان الجودة → تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` هي المجموعة الاصطناعية الواسعة وليست جزءًا من تلك المصفوفة.

### بيانات اعتماد Telegram المشتركة عبر Convex (v1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل مختبر ضمان الجودة على تأجير حصري من pool مدعوم بـ Convex، ويرسل Heartbeat
لذلك التأجير أثناء تشغيل المسار، ويحرر التأجير عند الإيقاف.

سقالة مشروع Convex المرجعية:

- `qa/convex-credential-broker/`

متغيرات env المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - القيمة الافتراضية لـ Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (تكون افتراضيًا `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات env اختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL لـ Convex عبر `http://` الخاصة بـ loopback للتطوير المحلي فقط.

ينبغي أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` ‏`https://` في التشغيل العادي.

تتطلب أوامر إدارة المشرفين (إضافة/إزالة/سرد pool)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل التشغيلات الحية للتحقق من عنوان URL لموقع Convex، وأسرار الوسيط،
وبادئة endpoint، ومهلة HTTP، وإمكانية الوصول إلى الإدارة/السرد بدون طباعة
قيم الأسرار. استخدم `--json` للمخرجات المقروءة آليًا في السكربتات وأدوات CI.

عقدة endpoint الافتراضية (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (سر المشرفين فقط)
  - الطلب: `{ kind, actorId, payload, note?, status? }`
  - النجاح: `{ status: "ok", credential }`
- `POST /admin/remove` (سر المشرفين فقط)
  - الطلب: `{ credentialId, actorId }`
  - النجاح: `{ status: "ok", changed, credential }`
  - حاجز الإيجار النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر المشرفين فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة رقمية لمعرّف محادثة Telegram.
- يتحقق `admin/add` من هذا الشكل عند `kind: "telegram"` ويرفض الحمولات سيئة التشكيل.

### إضافة قناة إلى QA

توجد أسماء البنية ومساعدي السيناريوهات لمحولات القنوات الجديدة في [نظرة عامة على QA → إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: تنفيذ مشغل النقل على حد المضيف المشترك `qa-lab`، والتصريح عن `qaRunners` في بيان Plugin، والتركيب كـ `openclaw qa <runner>`، وتأليف السيناريوهات ضمن `qa/scenarios/`.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكّر في المجموعات باعتبارها «واقعية متزايدة» (ومعها تزيد الهشاشة/التكلفة):

### وحدة / تكامل (افتراضي)

- الأمر: `pnpm test`
- الإعدادات: تستخدم التشغيلات غير المستهدفة مجموعة الشظايا `vitest.full-*.config.ts` وقد توسّع الشظايا متعددة المشاريع إلى إعدادات لكل مشروع من أجل الجدولة المتوازية
- الملفات: مخزونات الوحدة/النواة ضمن `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`؛ تعمل اختبارات وحدة UI في شظية `unit-ui` المخصصة
- النطاق:
  - اختبارات وحدة صرفة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، التوجيه، الأدوات، التحليل، الإعدادات)
  - انحدارات حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
  - يجب أن تثبت اختبارات محلل التحميل والسطح العام سلوك الرجوع الواسع في `api.js` و
    `runtime-api.js` باستخدام تجهيزات Plugin صغيرة مولدة، وليس
    واجهات API لمصدر Plugin حقيقي مضمّن. تنتمي تحميلات API الحقيقية للـ Plugin إلى
    مجموعات عقود/تكامل مملوكة للـ Plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - يشغّل `pnpm test` غير المستهدف اثني عشر إعداد شظايا أصغر (`core-unit-fast` و`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدل عملية مشروع جذر أصلية ضخمة واحدة. يقلل هذا ذروة RSS على الأجهزة المحملة ويتجنب أن تجوّع أعمال الرد التلقائي/الإضافات المجموعات غير ذات الصلة.
    - لا يزال `pnpm test --watch` يستخدم مخطط مشروع الجذر الأصلي `vitest.config.ts`، لأن حلقة مراقبة متعددة الشظايا ليست عملية.
    - يمرر `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/المجلدات الصريحة عبر المسارات المحددة النطاق أولًا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع كلفة بدء مشروع الجذر كاملة.
    - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى مسارات محددة النطاق ورخيصة افتراضيًا: تعديلات الاختبار المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، والتابعين المحليين في مخطط الاستيراد. لا تؤدي تعديلات الإعدادات/التهيئة/الحزمة إلى تشغيل واسع للاختبارات ما لم تستخدم صراحة `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هو بوابة الفحص المحلي الذكي الاعتيادية للأعمال الضيقة. يصنف الفرق إلى النواة، واختبارات النواة، والإضافات، واختبارات الإضافات، والتطبيقات، والوثائق، وبيانات تعريف الإصدار، وأدوات Docker الحية، والأدوات، ثم يشغّل أوامر فحص النوع والlint والحراس المطابقة. لا يشغّل اختبارات Vitest؛ استدعِ `pnpm test:changed` أو `pnpm test <target>` صريحًا لإثبات الاختبار. تشغّل زيادات الإصدار الخاصة ببيانات تعريف الإصدار فقط فحوصًا مستهدفة للإصدار/الإعدادات/اعتمادات الجذر، مع حارس يرفض تغييرات الحزمة خارج حقل الإصدار في المستوى الأعلى.
    - تشغّل تعديلات حاضنة Docker ACP الحية فحوصًا مركزة: صياغة shell لسكربتات مصادقة Docker الحية وتشغيلًا تجريبيًا جافًا لمجدول Docker الحي. تُدرج تغييرات `package.json` فقط عندما يكون الفرق محدودًا بـ `scripts["test:docker:live-*"]`؛ أما تعديلات الاعتمادات والتصدير والإصدار وسطح الحزمة الأخرى فلا تزال تستخدم الحراس الأوسع.
    - تمر اختبارات الوحدة الخفيفة الاستيراد من الوكلاء، والأوامر، وPlugins، ومساعدي الرد التلقائي، و`plugin-sdk`، ومناطق الأدوات الصرفة المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ تبقى الملفات ذات الحالة/الثقيلة وقت التشغيل على المسارات القائمة.
    - تعيّن أيضًا ملفات مصدر المساعد المختارة من `plugin-sdk` و`commands` تشغيلات وضع التغيير إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدين إعادة تشغيل المجموعة الثقيلة الكاملة لذلك المجلد.
    - لدى `auto-reply` حاويات مخصصة لمساعدي النواة في المستوى الأعلى، واختبارات تكامل `reply.*` في المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. يقسم CI أيضًا الشجرة الفرعية للرد إلى شظايا مشغل الوكيل، والإرسال، والأوامر/توجيه الحالة حتى لا تمتلك حاوية واحدة ثقيلة الاستيراد ذيل Node كاملًا.
    - يتخطى CI الاعتيادي لـ PR/main عمدًا مسح دفعات الإضافات وشظية `agentic-plugins` الخاصة بالإصدار فقط. يطلق Full Release Validation سير العمل الفرعي المنفصل `Plugin Prerelease` لهذه المجموعات الثقيلة بالـ Plugin/الإضافات على مرشحات الإصدار.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - عندما تغيّر مدخلات اكتشاف أداة الرسائل أو سياق وقت تشغيل
      Compaction، أبقِ كلا مستويي التغطية.
    - أضف انحدارات مساعدة مركزة لحدود التوجيه والتطبيع
      الصرفة.
    - أبقِ مجموعات تكامل المشغل المضمن سليمة:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه المجموعات من أن المعرّفات محددة النطاق وسلوك Compaction ما زالا يتدفقان
      عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ اختبارات المساعدين فقط
      ليست بديلًا كافيًا لتلك مسارات التكامل.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - تضبط إعدادات Vitest الأساسية الافتراضي على `threads`.
    - تثبت إعدادات Vitest المشتركة `isolate: false` وتستخدم
      المشغل غير المعزول عبر مشاريع الجذر، وe2e، والإعدادات الحية.
    - يحافظ مسار UI الجذري على إعداد `jsdom` والمحسّن الخاصين به، لكنه يعمل على
      المشغل المشترك غير المعزول أيضًا.
    - ترث كل شظية `pnpm test` الافتراضات نفسها `threads` + `isolate: false`
      من إعدادات Vitest المشتركة.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node الفرعية الخاصة بـ Vitest
      افتراضيًا لتقليل churn تجميع V8 أثناء التشغيلات المحلية الكبيرة.
      عيّن `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8
      القياسي.

  </Accordion>

  <Accordion title="Fast local iteration">

    - يعرض `pnpm changed:lanes` أي مسارات معمارية يفعّلها الفرق.
    - خطاف ما قبل الالتزام خاص بالتنسيق فقط. يعيد ترتيب الملفات المنسقة في المرحلة
      ولا يشغّل lint أو فحص النوع أو الاختبارات.
    - شغّل `pnpm check:changed` صراحة قبل التسليم أو الدفع عندما
      تحتاج إلى بوابة الفحص المحلي الذكية.
    - يمرر `pnpm test:changed` عبر مسارات محددة النطاق ورخيصة افتراضيًا. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر الوكيل
      أن تعديل حاضنة أو إعدادات أو حزمة أو عقد يحتاج حقًا إلى تغطية
      Vitest أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه نفسه،
      لكن مع حد أعلى للعمال.
    - التوسيع التلقائي للعمال المحليين محافظ عمدًا ويتراجع
      عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، لذلك تسبب تشغيلات
      Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
    - تضع إعدادات Vitest الأساسية علامة على المشاريع/ملفات الإعدادات كـ
      `forceRerunTriggers` حتى تبقى إعادة التشغيل في وضع التغيير صحيحة عندما تتغير
      توصيلات الاختبارات.
    - تبقي الإعدادات `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفين المدعومين؛
      عيّن `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت
      موقع تخزين مؤقت صريحًا واحدًا للتنميط المباشر.

  </Accordion>

  <Accordion title="Perf debugging">

    - يفعّل `pnpm test:perf:imports` تقارير مدة استيراد Vitest إضافة إلى
      مخرجات تفصيل الاستيراد.
    - يحدد `pnpm test:perf:imports:changed` عرض التنميط نفسه على
      الملفات المتغيرة منذ `origin/main`.
    - تُكتب بيانات توقيت الشظايا إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم تشغيلات الإعداد الكامل مسار الإعداد كمفتاح؛ تضيف شظايا CI
      ذات نمط التضمين اسم الشظية حتى يمكن تتبع الشظايا المصفاة
      بشكل منفصل.
    - عندما لا يزال اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل،
      أبقِ الاعتمادات الثقيلة خلف حد محلي ضيق `*.runtime.ts` و
      حاكِ ذلك الحد مباشرة بدل استيراد مساعدي وقت التشغيل بعمق فقط
      لتمريرهم عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين
      `test:changed` الموجّه ومسار مشروع الجذر الأصلي لذلك الفرق
      الملتزم، ويطبع زمن الجدار إضافة إلى الحد الأقصى لـ RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة الوسخة الحالية
      عبر تمرير قائمة الملفات المتغيرة عبر
      `scripts/test-projects.mjs` وإعدادات Vitest الجذرية.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي
      لتكاليف بدء Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغل من أجل
      مجموعة الوحدة مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعدادات: `vitest.gateway.config.ts`، مع فرض عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا على local loopback مع تمكين التشخيصات افتراضيًا
  - يدفع دوران رسائل gateway والذاكرة والحمولات الكبيرة الاصطناعي عبر مسار حدث التشخيص
  - يستعلم عن `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدي استمرارية حزمة استقرار التشخيص
  - يؤكد أن المسجل يبقى محدودًا، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق طوابير كل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI وبدون مفاتيح
  - مسار ضيق لمتابعة انحدارات الاستقرار، وليس بديلًا لمجموعة Gateway الكاملة

### E2E (فحص Gateway سريع)

- الأمر: `pnpm test:e2e`
- الإعدادات: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات E2E للـ Plugin المضمنة ضمن `extensions/`
- افتراضيات وقت التشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، مطابقًا لبقية المستودع.
  - يستخدم عمالًا تكيفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل كلفة إدخال/إخراج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (محدود عند 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تمكين مخرجات وحدة التحكم التفصيلية.
- النطاق:
  - سلوك Gateway طرفًا لطرف متعدد النسخ
  - أسطح WebSocket/HTTP، وإقران node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في خط الأنابيب)
  - لا يتطلب مفاتيح حقيقية
  - أجزاء متحركة أكثر من اختبارات الوحدة (قد يكون أبطأ)

### E2E: فحص سريع لخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ Gateway معزولًا لـ OpenShell على المضيف عبر Docker
  - ينشئ صندوق حماية من `Dockerfile` محلي مؤقت
  - يختبر واجهة OpenClaw الخلفية لـ OpenShell عبر `sandbox ssh-config` حقيقي وتنفيذ SSH
  - يتحقق من سلوك نظام الملفات ذي المرجعية البعيدة عبر جسر نظام ملفات صندوق الحماية
- التوقعات:
  - اشتراك اختياري فقط؛ ليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا لـ `openshell` إضافةً إلى عفريت Docker يعمل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولة، ثم يدمّر Gateway الاختبار وصندوق الحماية
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو سكربت تغليف

### مباشر (موفّرون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`، و`test/**/*.live.test.ts`، واختبارات Plugin الحية المضمّنة ضمن `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا الموفّر/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - التقاط تغييرات تنسيق الموفّر، وخصائص استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدّل
- التوقعات:
  - غير مستقر لـ CI حسب التصميم (شبكات حقيقية، سياسات موفّرين حقيقية، حصص، انقطاعات)
  - يكلّف مالًا / يستخدم حدود المعدّل
  - فضّل تشغيل مجموعات فرعية محددة بدلًا من "كل شيء"
- تستورد عمليات التشغيل الحية `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيًا، ما تزال عمليات التشغيل الحية تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى مجلد رئيسي اختباري مؤقت كي لا تتمكن تجهيزات اختبارات الوحدة من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية مجلدك الرئيسي الحقيقي.
- أصبح `pnpm test:live` افتراضيًا في وضع أهدأ: يبقي مخرجات التقدم `[live] ...`، لكنه يخفي إشعار `~/.profile` الإضافي ويكتم سجلات تمهيد Gateway وضجيج Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل كاملة.
- تدوير مفاتيح API (خاص بالموفّر): اضبط `*_API_KEYS` بتنسيق الفواصل/الفواصل المنقوطة أو `*_API_KEY_1`، `*_API_KEY_2` (مثلًا `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) أو تجاوزًا لكل تشغيل حي عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدّل.
- مخرجات التقدم/Heartbeat:
  - تصدر المجموعات الحية الآن أسطر تقدم إلى stderr بحيث تبقى استدعاءات الموفّر الطويلة ظاهرة النشاط حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة تحكم Vitest بحيث تتدفق أسطر تقدم الموفّر/Gateway فورًا أثناء عمليات التشغيل الحية.
  - اضبط Heartbeat النماذج المباشرة باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat Gateway/الاستقصاء باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح "روبوتي متوقف" / إخفاقات خاصة بموفّر / استدعاء الأدوات: شغّل `pnpm test:live` محددًا

## الاختبارات الحية (التي تلمس الشبكة)

لمصفوفة النماذج الحية، واختبارات CLI الخلفية الدخانية، واختبارات ACP الدخانية، وحاضنة خادم تطبيق Codex، وكل اختبارات موفّري الوسائط الحية (Deepgram، BytePlus، ComfyUI، الصور، الموسيقى، الفيديو، حاضنة الوسائط) — إضافةً إلى معالجة بيانات الاعتماد لعمليات التشغيل الحية — راجع [اختبار المجموعات الحية](/ar/help/testing-live). وللقائمة المخصصة للتحقق من التحديثات وPlugin، راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

## مشغّلات Docker (اختبارات "يعمل على Linux" الاختيارية)

تنقسم مشغّلات Docker هذه إلى فئتين:

- مشغّلات النماذج الحية: يشغّل `test:docker:live-models` و`test:docker:live-gateway` فقط ملف التعريف الحي المطابق لمفتاح الملف الشخصي داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب مجلد الإعداد المحلي ومساحة العمل لديك (واستيراد `~/.profile` إذا كان مركّبًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تعتمد مشغّلات Docker الحية افتراضيًا حدًا أصغر للاختبارات الدخانية كي يبقى مسح Docker الكامل عمليًا:
  يعتمد `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويعتمد
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة هذه عندما
  تريد صراحةً المسح الشامل الأكبر.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كحزمة npm tarball عبر `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة العارية هي فقط مشغّل Node/Git لمسارات التثبيت/التحديث/اعتمادات Plugin؛ تركّب هذه المسارات حزمة tarball المبنية مسبقًا. تثبّت الصورة الوظيفية الحزمة نفسها في `/app` لمسارات وظائف التطبيق المبني. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق التخطيط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في خانات العمليات، بينما تمنع حدود الموارد مسارات live الثقيلة، وتثبيت npm، والخدمات المتعددة من البدء كلها دفعة واحدة. إذا كان مسار واحد أثقل من الحدود النشطة، لا يزال بإمكان المجدول بدءه عندما يكون التجمع فارغًا ثم يبقيه يعمل وحده حتى تتوفر السعة مجددًا. الافتراضيات هي 10 خانات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما يملك مضيف Docker مساحة أكبر. ينفّذ المشغّل فحص Docker تمهيديًا افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في عمليات التشغيل اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون دون بناء Docker أو تشغيله، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة، واحتياجات الحزمة/الصورة، وبيانات الاعتماد.
- `Package Acceptance` هي بوابة الحزمة الأصلية في GitHub للإجابة عن "هل تعمل حزمة tarball القابلة للتثبيت هذه كمنتج؟" وهي تحل حزمة مرشحة واحدة من `source=npm` أو `source=ref` أو `source=url` أو `source=artifact`، وترفعها باسم `package-under-test`، ثم تشغّل مسارات Docker E2E القابلة لإعادة الاستخدام على حزمة tarball تلك بالضبط بدلًا من إعادة حزم المرجع المحدد. تُرتّب الملفات الشخصية حسب الاتساع: `smoke`، و`package`، و`product`، و`full`. راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins) لعقد الحزمة/التحديث/Plugin، ومصفوفة البقاء بعد ترقية المنشور، وافتراضيات الإصدار، وفرز الإخفاقات.
- تشغّل اختبارات البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يتتبع الحارس الرسم البياني الثابت المبني من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا استورد بدء التشغيل قبل الإرسال اعتماديات الحزمة مثل Commander، أو واجهة المطالبة، أو undici، أو التسجيل قبل إرسال الأمر؛ كما يبقي مقطع تشغيل Gateway المضمّن ضمن الميزانية ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة. يغطي الاختبار الدخاني للـ CLI المعبأ أيضًا مساعدة الجذر، ومساعدة onboarding، ومساعدة doctor، والحالة، ومخطط الإعداد، وأمر قائمة النماذج.
- يقتصر توافق `Package Acceptance` القديم على `2026.4.25` (بما في ذلك `2026.4.25-beta.*`). حتى ذلك الحد، تتسامح الحاضنة فقط مع فجوات بيانات تعريف الحزم المشحونة: إدخالات جرد QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات التصحيح في تجهيز git المشتق من حزمة tarball، وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة، وغياب استمرارية سجلات تثبيت marketplace، وترحيل بيانات تعريف الإعداد أثناء `plugins update`. بالنسبة للحزم بعد `2026.4.25`، تكون هذه المسارات إخفاقات صارمة.
- مشغّلات دخان الحاويات: `test:docker:openwebui`، و`test:docker:onboard`، و`test:docker:npm-onboard-channel-agent`، و`test:docker:update-channel-switch`، و`test:docker:upgrade-survivor`، و`test:docker:published-upgrade-survivor`، و`test:docker:session-runtime-context`، و`test:docker:agents-delete-shared-workspace`، و`test:docker:gateway-network`، و`test:docker:browser-cdp-snapshot`، و`test:docker:mcp-channels`، و`test:docker:pi-bundle-mcp-tools`، و`test:docker:cron-mcp-cleanup`، و`test:docker:plugins`، و`test:docker:plugin-update`، و`test:docker:config-reload` تشغّل حاوية حقيقية واحدة أو أكثر وتتحقق من مسارات تكامل أعلى مستوى.

تركّب مشغّلات Docker للنماذج الحية أيضًا مجلدات مصادقة CLI المطلوبة فقط (أو كلها المدعومة عندما لا يكون التشغيل محددًا)، ثم تنسخها إلى مجلد الحاوية الرئيسي قبل التشغيل بحيث يمكن لـ OAuth الخاص بـ CLI خارجي تحديث الرموز دون تعديل مخزن مصادقة المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (البرنامج النصي: `scripts/test-live-models-docker.sh`)
- دخان ربط ACP: `pnpm test:docker:live-acp-bind` (البرنامج النصي: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- دخان خلفية CLI: `pnpm test:docker:live-cli-backend` (البرنامج النصي: `scripts/test-live-cli-backend-docker.sh`)
- دخان مشغل خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (البرنامج النصي: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (البرنامج النصي: `scripts/test-live-gateway-models-docker.sh`)
- دخان قابلية الملاحظة: `pnpm qa:otel:smoke` هو مسار خاص لفحص مصدر QA من نسخة المصدر. ليس جزءا من مسارات إصدار Docker للحزمة عمدا لأن أرشيف npm يستبعد QA Lab.
- دخان Open WebUI المباشر: `pnpm test:docker:openwebui` (البرنامج النصي: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، هيكلة كاملة): `pnpm test:docker:onboard` (البرنامج النصي: `scripts/e2e/onboard-docker.sh`)
- دخان إعداد/قناة/وكيل أرشيف Npm: يثبت `pnpm test:docker:npm-onboard-channel-agent` أرشيف OpenClaw المضغوط عالميا في Docker، ويضبط OpenAI عبر إعداد أولي بإحالة بيئية إضافة إلى Telegram افتراضيا، ويشغل doctor، ويشغل دورة وكيل OpenAI واحدة بمحاكاة. أعد استخدام أرشيف مبني مسبقا باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخط إعادة بناء المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- دخان تبديل قناة التحديث: يثبت `pnpm test:docker:update-channel-switch` أرشيف OpenClaw المضغوط عالميا في Docker، ويبدّل من حزمة `stable` إلى git `dev`، ويتحقق من القناة المحفوظة وعمل Plugin بعد التحديث، ثم يعود إلى حزمة `stable` ويفحص حالة التحديث.
- دخان ناجي الترقية: يثبت `pnpm test:docker:upgrade-survivor` أرشيف OpenClaw المضغوط فوق تجهيز مستخدم قديم غير نظيف يحتوي على وكلاء، وإعدادات قناة، وقوائم سماح Plugin، وحالة تبعيات Plugin قديمة، وملفات مساحة عمل/جلسة موجودة. يشغل تحديث الحزمة مع doctor غير تفاعلي دون مفاتيح مزود أو قناة مباشرة، ثم يبدأ Gateway عبر local loopback ويفحص حفظ الإعداد/الحالة إضافة إلى ميزانيات البدء/الحالة.
- دخان ناجي الترقية المنشور: يثبت `pnpm test:docker:published-upgrade-survivor` الحزمة `openclaw@latest` افتراضيا، ويزرع ملفات مستخدم موجودة واقعية، ويضبط ذلك الأساس بوصفة أوامر مضمّنة، ويتحقق من الإعداد الناتج، ويحدّث ذلك التثبيت المنشور إلى أرشيف المرشح، ويشغل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر local loopback ويفحص المقاصد المضبوطة، وحفظ الحالة، والبدء، و`/healthz`، و`/readyz`، وميزانيات حالة RPC. تجاوز أساسا واحدا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، واطلب من المجدول التجميعي توسيع الأسس الدقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `all-since-2026.4.23`، ووسّع التجهيزات المشابهة للمشكلات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues`؛ تتضمن مجموعة reported-issues الحالة `configured-plugin-installs` لإصلاح تثبيت Plugin خارجي لـ OpenClaw تلقائيا. تكشف Package Acceptance هذه كـ `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`.
- دخان سياق تشغيل الجلسة: يتحقق `pnpm test:docker:session-runtime-context` من استمرار نص سياق التشغيل المخفي إضافة إلى إصلاح doctor لفروع إعادة كتابة المطالبة المتكررة المتأثرة.
- دخان تثبيت Bun العالمي: يحزم `bash scripts/e2e/bun-global-install-smoke.sh` الشجرة الحالية، ويثبتها باستخدام `bun install -g` في منزل معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد مزودي صور مضمنين بدلا من التعليق. أعد استخدام أرشيف مبني مسبقا باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخط بناء المضيف باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- دخان مثبّت Docker: يشارك `bash scripts/test-install-sh-docker.sh` ذاكرة تخزين npm مؤقتة واحدة بين حاويات root والتحديث وdirect-npm. يستخدم دخان التحديث npm `latest` افتراضيا كأساس مستقر قبل الترقية إلى أرشيف المرشح. تجاوز ذلك محليا باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، أو باستخدام إدخال `update_baseline_version` لسير عمل Install Smoke على GitHub. تبقي فحوصات المثبّت غير الجذر ذاكرة تخزين npm مؤقتة معزولة كي لا تخفي إدخالات الذاكرة المؤقتة المملوكة للجذر سلوك التثبيت المحلي للمستخدم. عيّن `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة التخزين المؤقت root/update/direct-npm عبر الإعادات المحلية.
- يتخطى Install Smoke CI تحديث direct-npm العالمي المكرر باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل البرنامج النصي محليا دون ذلك المتغير البيئي عندما تكون تغطية `npm install -g` المباشرة مطلوبة.
- دخان CLI لحذف الوكلاء لمساحة عمل مشتركة: يبني `pnpm test:docker:agents-delete-shared-workspace` (البرنامج النصي: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) صورة Dockerfile الجذرية افتراضيا، ويزرع وكيلين بمساحة عمل واحدة في منزل حاوية معزول، ويشغل `agents delete --json`، ويتحقق من JSON صالح إضافة إلى سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke باستخدام `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (البرنامج النصي: `scripts/e2e/gateway-network-docker.sh`)
- دخان لقطة Browser CDP: يبني `pnpm test:docker:browser-cdp-snapshot` (البرنامج النصي: `scripts/e2e/browser-cdp-snapshot-docker.sh`) صورة E2E المصدر إضافة إلى طبقة Chromium، ويبدأ Chromium مع CDP خام، ويشغل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي روابط URL، والعناصر القابلة للنقر المرقّاة بالمؤشر، ومراجع iframe، وبيانات الإطار الوصفية.
- انحدار الاستدلال الأدنى في OpenAI Responses web_search: يشغل `pnpm test:docker:openai-web-search-minimal` (البرنامج النصي: `scripts/e2e/openai-web-search-minimal-docker.sh`) خادم OpenAI محاكى عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يجبر مخطط المزود على الرفض ويفحص ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + دخان إطار إشعار Claude خام): `pnpm test:docker:mcp-channels` (البرنامج النصي: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة Pi (خادم MCP stdio حقيقي + دخان سماح/رفض ملف Pi المضمن): `pnpm test:docker:pi-bundle-mcp-tools` (البرنامج النصي: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف MCP لـ Cron/الوكيل الفرعي (Gateway حقيقي + إنهاء فرع MCP stdio بعد تشغيلات cron معزولة ووكيل فرعي لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (البرنامج النصي: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (دخان تثبيت/تحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git متحركة، وClawHub شامل، وتحديثات السوق، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (البرنامج النصي: `scripts/e2e/plugins-docker.sh`)
  عيّن `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/التشغيل الشامل الافتراضي باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. دون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم تجهيز ClawHub محليا محكما.
- دخان عدم تغيّر تحديث Plugin: `pnpm test:docker:plugin-update` (البرنامج النصي: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- دخان بيانات وصفية لإعادة تحميل الإعداد: `pnpm test:docker:config-reload` (البرنامج النصي: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: يغطي `pnpm test:docker:plugins` دخان التثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git متحركة، وتجهيزات ClawHub، وتحديثات السوق، وتمكين/فحص حزمة Claude. يغطي `pnpm test:docker:plugin-update` سلوك التحديث غير المتغير لـ plugins المثبتة.

لبناء الصورة الوظيفية المشتركة مسبقا وإعادة استخدامها يدويا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بالحزمة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ذات أولوية عند ضبطها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها البرامج النصية إذا لم تكن محلية بالفعل. تحتفظ اختبارات QR والمثبّت في Docker بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلا من تشغيل التطبيق المبني المشترك.

كما يركّب مشغلو Docker للنماذج المباشرة نسخة المصدر الحالية للقراءة فقط
ويجهزونها في مجلد عمل مؤقت داخل الحاوية. يحافظ ذلك على خفة صورة التشغيل
مع الاستمرار في تشغيل Vitest مقابل مصدرك/إعدادك المحلي الدقيق.
تتخطى خطوة التجهيز ذاكرات التخزين المؤقت المحلية الكبيرة ومخرجات بناء التطبيقات مثل
`.pnpm-store`، و`.worktrees`، و`__openclaw_vitest__`، ومجلدات `.build` المحلية للتطبيق أو
مخرجات Gradle كي لا تقضي تشغيلات Docker المباشرة دقائق في نسخ
أدوات خاصة بالجهاز.
كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ مجسات Gateway المباشرة
عمال قنوات Telegram/Discord/إلخ. حقيقية داخل الحاوية.
ما زال `test:docker:live-models` يشغل `pnpm test:live`، لذلك مرر
`OPENCLAW_LIVE_GATEWAY_*` أيضا عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
المباشرة من ذلك المسار في Docker.
`test:docker:openwebui` هو دخان توافق أعلى مستوى: يبدأ حاوية Gateway من
OpenClaw مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبتة مقابل ذلك Gateway، ويسجل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يكشف `openclaw/default`، ثم يرسل
طلب دردشة حقيقيا عبر وكيل `/api/chat/completions` الخاص بـ Open WebUI.
قد تكون التشغيلات الأولى أبطأ بوضوح لأن Docker قد يحتاج إلى سحب صورة
Open WebUI وقد يحتاج Open WebUI إلى إنهاء إعداد بدء التشغيل البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج مباشر صالحا، و`OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيا) هو الطريقة الأساسية لتوفيره في التشغيلات داخل Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عمدا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. يشغل حاوية Gateway
مزروعة، ويبدأ حاوية ثانية تطلق `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجهة، وقراءات النص، وبيانات المرفقات الوصفية،
وسلوك طابور الأحداث المباشرة، وتوجيه الإرسال الصادر، وإشعارات القناة +
الأذونات بأسلوب Claude عبر جسر MCP stdio الحقيقي. يفحص تحقق الإشعار
إطارات MCP stdio الخام مباشرة حتى يتحقق الدخان مما يصدره
الجسر فعليا، لا فقط ما تصادف أن تعرضه SDK عميل محددة.
`test:docker:pi-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج مباشر.
يبني صورة Docker للمستودع، ويبدأ خادم فحص MCP stdio حقيقيا
داخل الحاوية، ويموضع ذلك الخادم عبر تشغيل MCP لحزمة Pi المضمنة،
وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان
بأدوات `bundle-mcp` بينما يقوم `minimal` و`tools.deny: ["bundle-mcp"]` بترشيحها.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج مباشر.
يبدأ Gateway مزروعا مع خادم فحص MCP stdio حقيقي، ويشغل
دورة cron معزولة ودورة فرعية لمرة واحدة عبر `/subagents spawn`، ثم يتحقق
من خروج عملية MCP الفرعية بعد كل تشغيل.

دخان يدوي لسلسلة ACP بلغة طبيعية عادية (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا البرنامج النصي لتدفقات عمل الانحدار/التصحيح. قد يكون مطلوبا مرة أخرى للتحقق من توجيه سلسلة ACP، لذلك لا تحذفه.

متغيرات البيئة المفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) مركّب على `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) مركّب على `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) مركّب على `/home/node/.profile` ويتم تحميله قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المحمّلة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة مؤقتة للإعدادات ومساحة العمل ودون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) مركّب على `/home/node/.npm-global` لتثبيتات CLI المخزّنة مؤقتًا داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية ضمن `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - تشغيلات المزوّدين المضيّقة تركّب فقط الأدلة/الملفات المطلوبة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز ذلك يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all`، أو `OPENCLAW_DOCKER_AUTH_DIRS=none`، أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لإعادات التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن الملفات الشخصية (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لاختبار Open WebUI الدخاني
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز موجّه فحص nonce المستخدم بواسطة اختبار Open WebUI الدخاني
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبّتة

## تحقق سلامة الوثائق

شغّل فحوصات الوثائق بعد تعديلات الوثائق: `pnpm check:docs`.
شغّل تحقق Mintlify الكامل من الارتساءات عندما تحتاج أيضًا إلى فحوصات عناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه انحدارات “مسار حقيقي” دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة وكيل): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway (WS `wizard.start`/`wizard.next`، يكتب الإعدادات + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (skills)

لدينا بالفعل بضعة اختبارات آمنة لـ CI تتصرف مثل “تقييمات موثوقية الوكيل”:

- استدعاء أدوات وهمي عبر Gateway الحقيقي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات معالج كاملة تتحقق من توصيل الجلسة وآثار الإعدادات (`src/gateway/gateway.test.ts`).

ما يزال مفقودًا بالنسبة إلى skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج skills في الموجّه، هل يختار الوكيل skill الصحيحة (أو يتجنب غير الملائمة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسيطات المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تؤكد ترتيب الأدوات، وترحيل سجل الجلسة، وحدود صندوق العزل.

يجب أن تظل التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين وهميين لتأكيد استدعاءات الأدوات + ترتيبها، وقراءات ملفات skill، وتوصيل الجلسة.
- مجموعة صغيرة من السيناريوهات المركّزة على skills (الاستخدام مقابل التجنب، البوابات، حقن الموجّهات).
- تقييمات حية اختيارية (اشتراك صريح، محكومة بمتغيرات البيئة) فقط بعد وجود المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجّلين يطابقان
عقد الواجهة الخاص بهما. وهي تكرّر عبر كل plugins المكتشفة وتشغّل مجموعة من
تأكيدات الشكل والسلوك. يتخطى مسار وحدات `pnpm test` الافتراضي عمدًا
ملفات الوصلات المشتركة والاختبارات الدخانية هذه؛ شغّل أوامر العقود صراحةً
عندما تلمس أسطح القنوات أو المزوّدين المشتركة.

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
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرّف سلسلة المحادثة
- **directory** - واجهة API للدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّدين

موجودة في `src/plugins/contracts/*.contract.test.ts`.

- **status** - مجسات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّدين

موجودة في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - API كتالوج النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تُشغّل

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة أو تعديل قناة أو Plugin مزوّد
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة الانحدارات (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج مكتشفة في الوضع الحي:

- أضف انحدارًا آمنًا لـ CI إن أمكن (مزوّد وهمي/محاكى، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت بطبيعتها حية فقط (حدود المعدّل، سياسات المصادقة)، فاجعل الاختبار الحي ضيقًا واختياريًا عبر متغيرات البيئة
- فضّل استهداف أصغر طبقة تلتقط الخلل:
  - خلل تحويل/إعادة تشغيل طلب المزوّد → اختبار نماذج مباشر
  - خلل مسار جلسة/سجل/أدوات Gateway → اختبار دخاني حي لـ Gateway أو اختبار Gateway وهمي آمن لـ CI
- حاجز عبور SecretRef:
  - يشتق `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا واحدًا مأخوذًا كعيّنة لكل فئة SecretRef من بيانات وصف سجل البيانات (`listSecretTargetRegistryEntries()`)، ثم يؤكد أن معرّفات exec ذات مقاطع العبور مرفوضة.
  - إذا أضفت عائلة أهداف SecretRef جديدة بـ `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند معرّفات الأهداف غير المصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذو صلة

- [اختبار الوضع الحي](/ar/help/testing-live)
- [اختبار التحديثات وplugins](/ar/help/testing-updates-plugins)
- [CI](/ar/ci)
