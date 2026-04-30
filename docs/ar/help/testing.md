---
read_when:
    - تشغيل الاختبارات محليًا أو في بيئة التكامل المستمر
    - إضافة اختبارات انحدار لأخطاء النموذج/المزوّد
    - تصحيح أخطاء سلوك Gateway والوكيل
summary: 'عدة الاختبار: مجموعات اختبارات الوحدة/الطرف إلى الطرف/المباشرة، ومشغلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-30T18:38:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

لدى OpenClaw ثلاث مجموعات Vitest (وحدة/تكامل، e2e، مباشرة) ومجموعة صغيرة
من مشغلات Docker. هذا المستند هو دليل "كيف نختبر":

- ما تغطيه كل مجموعة (وما لا تغطيه عمدا).
- الأوامر التي يجب تشغيلها لسير العمل الشائع (محليا، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات المباشرة بيانات الاعتماد وتختار النماذج/الموفرين.
- كيف تضيف اختبارات رجعية لمشكلات النماذج/الموفرين الواقعية.

<Note>
**مكدس ضمان الجودة (qa-lab، qa-channel، مسارات النقل المباشر)** موثق بشكل منفصل:

- [نظرة عامة على ضمان الجودة](/ar/concepts/qa-e2e-automation) — البنية، سطح الأوامر، تأليف السيناريوهات.
- [ضمان جودة Matrix](/ar/concepts/qa-matrix) — مرجع لـ `pnpm openclaw qa matrix`.
- [قناة ضمان الجودة](/ar/channels/qa-channel) — Plugin النقل الاصطناعي المستخدم بواسطة السيناريوهات المدعومة بالمستودع.

تغطي هذه الصفحة تشغيل مجموعات الاختبار العادية ومشغلات Docker/Parallels. يسرد قسم المشغلات الخاصة بضمان الجودة أدناه ([المشغلات الخاصة بضمان الجودة](#qa-specific-runners)) استدعاءات `qa` المحددة ويعيد الإشارة إلى المراجع أعلاه.
</Note>

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع للمجموعة الكاملة محليا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- استهداف الملفات المباشر يوجه الآن مسارات الإضافات/القنوات أيضا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولا عندما تكرر العمل على فشل واحد.
- موقع ضمان الجودة المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار ضمان الجودة المدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح الموفرين/النماذج الحقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة المباشرة (النماذج + اختبارات Gateway للأدوات/الصور): `pnpm test:live`
- استهدف ملفا مباشرا واحدا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- مسح النماذج المباشر عبر Docker: `pnpm test:docker:live-models`
  - يشغل كل نموذج محدد الآن دورة نصية بالإضافة إلى اختبار صغير بأسلوب قراءة الملفات.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغل أيضا دورة صورة صغيرة.
    عطّل الاختبارات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل إخفاقات الموفر.
  - تغطية CI: يستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومي و
    `OpenClaw Release Checks` اليدوي سير العمل المباشر/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، والذي يتضمن وظائف مصفوفة نماذج مباشرة منفصلة في Docker
    مقسمة حسب الموفر.
  - لإعادات تشغيل CI المركزة، شغّل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و `live_models_only: true`.
  - أضف أسرار الموفر عالية الإشارة الجديدة إلى `scripts/ci-hydrate-live-auth.sh`
    بالإضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/إصداراته.
- اختبار دخان الدردشة المرتبطة الأصلي لـ Codex: `pnpm test:docker:live-codex-bind`
  - يشغل مسار Docker مباشرا عبر مسار خادم تطبيق Codex، ويربط رسالة Slack مباشرة اصطناعية
    باستخدام `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من أن ردا عاديا ومرفق صورة
    يمران عبر ربط Plugin الأصلي بدلا من ACP.
- اختبار دخان حزمة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغل دورات وكيل Gateway عبر حزمة خادم تطبيق Codex المملوكة للـ Plugin،
    ويتحقق من `/codex status` و `/codex models`، وبشكل افتراضي يمارس اختبارات الصورة،
    و cron MCP، والوكيل الفرعي، و Guardian. عطّل اختبار الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل إخفاقات أخرى في
    خادم تطبيق Codex. لفحص وكيل فرعي مركز، عطّل الاختبارات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد اختبار الوكيل الفرعي ما لم يتم تعيين
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- اختبار دخان أمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري زائد التحوط لسطح أمر الإنقاذ في قناة الرسائل.
    يمارس `/crestodian status`، ويضع تغيير نموذج مستمرا في الطابور،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعداد.
- اختبار دخان مخطط Crestodian في Docker: `pnpm test:docker:crestodian-planner`
  - يشغل Crestodian في حاوية بلا إعدادات مع Claude CLI مزيف على `PATH`
    ويتحقق من أن الرجوع الاحتياطي للمخطط الضبابي يترجم إلى كتابة إعدادات نمطية مدققة.
- اختبار دخان التشغيل الأول لـ Crestodian في Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من دليل حالة OpenClaw فارغ، ويوجه `openclaw` العاري إلى
    Crestodian، ويطبق كتابات إعداد/نموذج/وكيل/Plugin Discord + SecretRef،
    ويتحقق من الإعدادات، ويتحقق من إدخالات التدقيق. تتم تغطية مسار إعداد Ring 0 نفسه
    أيضا في QA Lab بواسطة
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- اختبار دخان تكلفة Moonshot/Kimi: مع تعيين `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مع `moonshot/kimi-k2.6`. تحقق من أن JSON يبلغ عن Moonshot/K2.6 وأن نص المساعد
  يخزن `usage.cost` المعياري.

<Tip>
عندما تحتاج إلى حالة فاشلة واحدة فقط، فضّل تضييق الاختبارات المباشرة عبر متغيرات البيئة لقائمة السماح الموضحة أدناه.
</Tip>

## المشغلات الخاصة بضمان الجودة

تقف هذه الأوامر بجانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغل CI‏ QA Lab في سير عمل مخصصة. تعمل `Parity gate` على طلبات السحب المطابقة
ومن التشغيل اليدوي مع موفرين وهميين. تعمل `QA-Lab - All Lanes` ليلا على
`main` ومن التشغيل اليدوي مع بوابة التكافؤ الوهمية، ومسار Matrix المباشر،
ومسار Telegram المباشر المدار بواسطة Convex، ومسار Discord المباشر المدار بواسطة Convex
كوظائف متوازية. تمرر فحوصات ضمان الجودة المجدولة والإصدار `--profile fast` لـ Matrix
صراحة، بينما تبقى قيم Matrix CLI وإدخال سير العمل اليدوي الافتراضية
`all`؛ يمكن للتشغيل اليدوي تقسيم `all` إلى وظائف `transport`، و `media`، و `e2ee-smoke`،
و `e2ee-deep`، و `e2ee-cli`. يشغل `OpenClaw Release Checks` التكافؤ بالإضافة إلى
مساري Matrix السريع و Telegram قبل موافقة الإصدار، باستخدام
`mock-openai/gpt-5.5` لفحوصات نقل الإصدار بحيث تبقى حتمية
وتتجنب بدء Plugin الموفر العادي. تعطل بوابات النقل المباشر هذه
بحث الذاكرة؛ يبقى سلوك الذاكرة مغطى بمجموعات تكافؤ ضمان الجودة.

تستخدم أقسام الوسائط المباشرة الكاملة للإصدار
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، والتي تحتوي بالفعل على
`ffmpeg` و `ffprobe`. تستخدم أقسام النماذج/الخلفيات المباشرة في Docker صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل تنفيذ
محدد، ثم تسحبها باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلا من إعادة البناء
داخل كل قسم.

- `pnpm openclaw qa suite`
  - يشغل سيناريوهات ضمان الجودة المدعومة بالمستودع مباشرة على المضيف.
  - يشغل عدة سيناريوهات محددة بالتوازي افتراضيا مع عمال Gateway معزولين.
    `qa-channel` يستخدم التزامن 4 افتراضيا (مقيدا بعدد السيناريوهات المحددة).
    استخدم `--concurrency <count>` لضبط عدد العمال،
    أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد القطع الأثرية دون رمز خروج فاشل.
  - يدعم أوضاع الموفر `live-frontier`، و `mock-openai`، و `aimock`.
    يشغّل `aimock` خادم موفر محليا مدعوما بـ AIMock لتغطية تجريبية
    للتجهيزات ومحاكاة البروتوكول دون استبدال مسار
    `mock-openai` المدرك للسيناريوهات.
- `pnpm test:gateway:cpu-scenarios`
  - يشغل قياس بدء Gateway بالإضافة إلى حزمة صغيرة من سيناريوهات QA Lab الوهمية
    (`channel-chat-baseline`، و `memory-failure-fallback`,
    `gateway-restart-inflight-run`) ويكتب ملخص ملاحظة CPU مجمعا
    تحت `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم فقط ملاحظات CPU الساخنة المستمرة افتراضيا (`--cpu-core-warn`
    بالإضافة إلى `--hot-wall-warn-ms`)، لذلك تسجل اندفاعات البدء القصيرة كمقاييس
    دون أن تبدو مثل تراجع تثبيت Gateway الذي يستمر دقائق.
  - يستخدم قطع `dist` المبنية؛ شغّل بناء أولا عندما لا تكون نسخة العمل
    تحتوي بالفعل على خرج تشغيل حديث.
- `pnpm openclaw qa suite --runner multipass`
  - يشغل مجموعة ضمان الجودة نفسها داخل آلة Linux افتراضية مؤقتة من Multipass.
  - يحتفظ بسلوك اختيار السيناريو نفسه مثل `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار الموفر/النموذج نفسها مثل `qa suite`.
  - تمرر التشغيلات المباشرة مدخلات مصادقة ضمان الجودة المدعومة العملية للضيف:
    مفاتيح الموفر القائمة على البيئة، ومسار إعداد موفر ضمان الجودة المباشر، و `CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى أدلة الإخراج تحت جذر المستودع حتى يتمكن الضيف من الكتابة مرة أخرى عبر
    مساحة العمل المركبة.
  - يكتب تقرير وضمان الجودة العادي + الملخص بالإضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع ضمان الجودة المدعوم بـ Docker لعمل ضمان الجودة بأسلوب المشغل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني أرشيف npm من نسخة العمل الحالية، ويثبته عالميا في
    Docker، ويشغل إعداد مفتاح OpenAI API غير التفاعلي، ويعد Telegram
    افتراضيا، ويتحقق من أن تمكين Plugin يثبت تبعيات وقت التشغيل عند
    الطلب، ويشغل doctor، ويشغل دورة وكيل محلية واحدة ضد نقطة نهاية OpenAI وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ نفسه
    مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغل اختبار دخان حتميا لتطبيق مبني في Docker لنصوص سياق وقت التشغيل المضمنة.
    يتحقق من أن سياق وقت تشغيل OpenClaw المخفي يستمر كرسالة مخصصة غير معروضة
    بدلا من التسرب إلى دورة المستخدم المرئية، ثم يزرع جلسة JSONL مكسورة متأثرة
    ويتحقق من أن `openclaw doctor --fix` يعيد كتابتها إلى الفرع النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبت مرشح حزمة OpenClaw في Docker، ويشغل إعداد الحزمة المثبتة،
    ويعد Telegram عبر CLI المثبت، ثم يعيد استخدام مسار ضمان الجودة المباشر لـ Telegram
    مع تلك الحزمة المثبتة كـ Gateway للنظام قيد الاختبار.
  - القيمة الافتراضية هي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛ عيّن
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار أرشيف محلي محلول بدلا من
    التثبيت من السجل.
  - يستخدم بيانات اعتماد بيئة Telegram نفسها أو مصدر بيانات اعتماد Convex مثل
    `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، عيّن
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` بالإضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. إذا كان
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI،
    يختار مغلف Docker‏ Convex تلقائيا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` المتغير المشترك
    `OPENCLAW_QA_CREDENTIAL_ROLE` لهذا المسار فقط.
  - تعرض GitHub Actions هذا المسار أيضا كسير عمل يدوي للمشرف
    `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة
    `qa-live-shared` وإيجارات بيانات اعتماد CI من Convex.
- تعرض GitHub Actions أيضا `Package Acceptance` لإثبات جانبي للمنتج
  ضد حزمة مرشحة واحدة. يقبل مرجعا موثوقا، أو مواصفة npm منشورة،
  أو عنوان URL لأرشيف HTTPS بالإضافة إلى SHA-256، أو قطعة أثرية لأرشيف من تشغيل آخر، ويرفع
  `openclaw-current.tgz` المعياري كـ `package-under-test`، ثم يشغل
  مجدول Docker E2E الحالي مع ملفات تعريف مسارات smoke، أو package، أو product، أو full، أو custom.
  عيّن `telegram_mode=mock-openai` أو `live-frontier` لتشغيل سير عمل ضمان جودة Telegram
  ضد قطعة `package-under-test` نفسها.
  - إثبات أحدث منتج beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات عنوان URL دقيق للأرشيف بصمة:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- يحمّل إثبات الأثر أرشيف tarball من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - يحزم تثبيت بناء OpenClaw الحالي ويثبّته في Docker، ويبدأ Gateway
    مع ضبط OpenAI، ثم يفعّل قنوات/Plugins المضمّنة عبر تعديلات الإعداد.
  - يتحقق من أن اكتشاف الإعداد يترك تبعيات تشغيل Plugin غير المضبوطة
    غير موجودة، وأن أول تشغيل مضبوط لـ Gateway أو doctor يثبّت تبعيات تشغيل
    كل Plugin مضمّن عند الطلب، وأن إعادة التشغيل الثانية لا تعيد تثبيت
    التبعيات التي فُعّلت بالفعل.
  - يثبّت أيضًا خط أساس npm أقدم معروفًا، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن doctor بعد التحديث
    للمرشح يصلح تبعيات تشغيل القناة المضمّنة دون إصلاح postinstall من جانب
    الحاضنة.
- `pnpm test:parallels:npm-update`
  - يشغّل اختبار تحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. يثبّت كل
    نظام أساسي محدد أولًا حزمة خط الأساس المطلوبة، ثم يشغّل أمر
    `openclaw update` المثبّت في الضيف نفسه ويتحقق من النسخة المثبّتة، وحالة
    التحديث، وجاهزية Gateway، ودورة واحدة لوكيل محلي.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux` أثناء
    التكرار على ضيف واحد. استخدم `--json` لمسار أثر الملخص وحالة كل مسار.
  - يستخدم مسار OpenAI النموذج `openai/gpt-5.5` افتراضيًا لإثبات دورة الوكيل
    الحية. مرّر `--model <provider/model>` أو عيّن
    `OPENCLAW_PARALLELS_OPENAI_MODEL` عند التحقق المتعمّد من نموذج OpenAI آخر.
  - غلّف التشغيلات المحلية الطويلة بمهلة على المضيف حتى لا تستهلك حالات توقف
    نقل Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسارات متداخلة تحت `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي معلّق.
  - قد يستغرق تحديث Windows من 10 إلى 15 دقيقة في إصلاح تبعيات doctor/التشغيل
    بعد التحديث على ضيف بارد؛ وهذا يظل سليمًا عندما يكون سجل تصحيح npm
    المتداخل يتقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات اختبار Parallels الفردية
    على macOS أو Windows أو Linux. فهي تتشارك حالة VM ويمكن أن تتصادم عند
    استعادة اللقطة، أو تقديم الحزمة، أو حالة Gateway الضيف.
  - يشغّل إثبات ما بعد التحديث سطح Plugin المضمّن العادي لأن واجهات القدرات
    مثل الكلام، وتوليد الصور، وفهم الوسائط تُحمّل عبر واجهات API التشغيل
    المضمّنة حتى عندما تفحص دورة الوكيل نفسها استجابة نصية بسيطة فقط.

- `pnpm openclaw qa aimock`
  - يبدأ خادم مزود AIMock المحلي فقط لاختبار smoke مباشر للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي لـ Matrix مقابل خادم Tuwunel homeserver مؤقت مدعوم من Docker. من نسخة مصدرية فقط — لا تشحن التثبيتات المعبأة `qa-lab`.
  - CLI الكامل، وكتالوج الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط الآثار: [QA لـ Matrix](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رموز بوت المشغّل وبوت SUT من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف محادثة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمّعة. استخدم وضع البيئة افتراضيًا، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` لاستخدام عقود الإيجار المجمّعة.
  - يخرج بقيمة غير صفرية عندما يفشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد آثارًا دون رمز خروج فاشل.
  - يتطلب بوتين مميزين في المجموعة الخاصة نفسها، مع أن يعرّض بوت SUT اسم مستخدم Telegram.
  - للحصول على مراقبة مستقرة بين البوتات، فعّل وضع اتصال البوتات في `@BotFather` لكلا البوتين وتأكد من أن بوت المشغّل يستطيع مراقبة حركة بوتات المجموعة.
  - يكتب تقرير QA لـ Telegram، وملخصًا، وأثر الرسائل المرصودة تحت `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال المشغّل إلى رد SUT المرصود.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف عمليات النقل الجديدة؛ توجد مصفوفة تغطية كل مسار في [نظرة عامة على QA ← تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). إن `qa-channel` هو المجموعة الاصطناعية الواسعة وليس جزءًا من تلك المصفوفة.

### بيانات اعتماد Telegram المشتركة عبر Convex (v1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل مختبر QA على عقد إيجار حصري من مجموعة مدعومة من Convex، ويرسل Heartbeat
لذلك العقد أثناء تشغيل المسار، ويحرر العقد عند الإيقاف.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (مثلًا `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - الافتراضي من البيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (يفترض `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL الخاصة بـ Convex عبر `http://` على local loopback للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البروتوكول `https://` في التشغيل العادي.

تتطلب أوامر المشرف الخاصة بالمشرفين (إضافة/إزالة/عرض المجموعة)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل التشغيلات الحية لفحص عنوان URL لموقع Convex، وأسرار الوسيط،
وبادئة نقطة النهاية، ومهلة HTTP، وإمكانية الوصول إلى admin/list دون طباعة
قيم الأسرار. استخدم `--json` لمخرجات قابلة للقراءة آليًا في السكربتات وأدوات
CI.

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
  - حارس عقد الإيجار النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة معرّف محادثة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

### إضافة قناة إلى QA

توجد أسماء البنية ومساعد السيناريو لمحوّلات القنوات الجديدة في [نظرة عامة على QA ← إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: تنفيذ مشغّل النقل على وصلة مضيف `qa-lab` المشتركة، والتصريح عن `qaRunners` في بيان Plugin، والتركيب باسم `openclaw qa <runner>`، وتأليف السيناريوهات تحت `qa/scenarios/`.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكّر في المجموعات على أنها “واقعية متزايدة” (مع زيادة عدم الثبات/التكلفة):

### الوحدة / التكامل (افتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم التشغيلات غير المستهدفة مجموعة الشرائح `vitest.full-*.config.ts` وقد توسّع الشرائح متعددة المشاريع إلى إعدادات لكل مشروع للجدولة المتوازية
- الملفات: قوائم جرد الوحدة/النواة تحت `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`؛ تعمل اختبارات وحدة UI في شريحة `unit-ui` المخصصة
- النطاق:
  - اختبارات وحدة صافية
  - اختبارات تكامل داخل العملية (مصادقة Gateway، والتوجيه، والأدوات، والتحليل، والإعداد)
  - انحدارات حتمية للأخطاء المعروفة
- التوقعات:
  - يعمل في CI
  - لا يتطلب مفاتيح حقيقية
  - يجب أن يكون سريعًا ومستقرًا
  - يجب أن تثبت اختبارات المحلّل ومحمّل السطح العام سلوك الرجوع الواسع لـ `api.js` و
    `runtime-api.js` باستخدام تجهيزات Plugin صغيرة مولّدة، وليس
    واجهات API لمصدر Plugin مضمّن حقيقي. تنتمي عمليات تحميل API الخاصة بـ Plugin الحقيقي إلى
    مجموعات العقد/التكامل المملوكة للـ Plugin.

<AccordionGroup>
  <Accordion title="المشاريع والشرائح والمسارات محددة النطاق">

    - تُشغّل عمليات `pnpm test` غير المستهدفة اثني عشر إعدادًا أصغر للتقسيم (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) بدلًا من عملية مشروع جذرية أصلية واحدة ضخمة. يقلّل هذا ذروة RSS على الأجهزة المحمّلة، ويتجنّب أن يؤدي عمل الرد التلقائي/الامتدادات إلى حرمان الحِزم غير ذات الصلة من الموارد.
    - لا يزال `pnpm test --watch` يستخدم مخطط مشروع `vitest.config.ts` الجذري الأصلي، لأن حلقة مراقبة متعددة التقسيمات ليست عملية.
    - توجّه `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر المسارات محددة النطاق أولًا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع تكلفة بدء تشغيل مشروع الجذر بالكامل.
    - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى مسارات رخيصة محددة النطاق افتراضيًا: تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، والاعتماديات المحلية في مخطط الاستيراد. لا تؤدي تعديلات الإعداد/التهيئة/الحزم إلى تشغيل واسع للاختبارات إلا إذا استخدمت صراحةً `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هو بوابة الفحص المحلي الذكي المعتادة للعمل الضيق. يصنّف الفرق إلى النواة، واختبارات النواة، والامتدادات، واختبارات الامتدادات، والتطبيقات، والوثائق، وبيانات تعريف الإصدار، وأدوات Docker الحية، والأدوات، ثم يشغّل أوامر فحص الأنواع وlint والحراس المطابقة. لا يشغّل اختبارات Vitest؛ استدعِ `pnpm test:changed` أو `pnpm test <target>` صريحًا لإثبات الاختبارات. تعمل زيادات الإصدارات التي تقتصر على بيانات تعريف الإصدار على فحوصات مستهدفة للإصدار/الإعداد/اعتماديات الجذر، مع حارس يرفض تغييرات الحزم خارج حقل الإصدار ذي المستوى الأعلى.
    - تشغّل تعديلات حاضنة Docker ACP الحية فحوصات مركّزة: صياغة shell لنصوص مصادقة Docker الحية وتشغيلًا تجريبيًا جافًا لمجدول Docker الحي. لا تُدرج تغييرات `package.json` إلا عندما يكون الفرق محدودًا بـ `scripts["test:docker:live-*"]`؛ لا تزال تعديلات الاعتماديات والتصدير والإصدار وغيرها من أسطح الحزمة تستخدم الحراس الأوسع.
    - تمر اختبارات الوحدات الخفيفة من ناحية الاستيراد من الوكلاء والأوامر والإضافات ومساعدي الرد التلقائي و`plugin-sdk` ومناطق الأدوات النقية المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ وتبقى الملفات ذات الحالة/الثقيلة وقت التشغيل على المسارات الموجودة.
    - تُعيّن أيضًا ملفات مصدر مساعدة مختارة من `plugin-sdk` و`commands` عمليات النمط المتغير إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدين إعادة تشغيل الحزمة الثقيلة الكاملة لذلك الدليل.
    - لدى `auto-reply` حاويات مخصصة لمساعدي النواة ذوي المستوى الأعلى، واختبارات تكامل `reply.*` ذات المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. يقسم CI كذلك الشجرة الفرعية للرد إلى تقسيمات agent-runner وdispatch وcommands/state-routing حتى لا تمتلك حاوية ثقيلة الاستيراد واحدة ذيل Node بالكامل.
    - يتخطى CI العادي لـ PR/main عمدًا مسح دفعة الامتدادات وتقسيم `agentic-plugins` المخصص للإصدار فقط. يطلق Full Release Validation سير العمل الفرعي المنفصل `Plugin Prerelease` لتلك الحِزم الثقيلة بالإضافات/الامتدادات على مرشحي الإصدار.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - عند تغيير مُدخلات اكتشاف أدوات الرسائل أو سياق وقت تشغيل Compaction، حافظ على مستويي التغطية كليهما.
    - أضف اختبارات انحدار مركّزة للمساعدين لحدود التوجيه والتطبيع النقية.
    - أبقِ حِزم تكامل المشغّل المضمّن سليمة:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه الحِزم من أن المعرّفات محددة النطاق وسلوك Compaction ما زالا يتدفقان عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ اختبارات المساعدين فقط ليست بديلًا كافيًا لتلك مسارات التكامل.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - الإعداد الأساسي لـ Vitest يستخدم `threads` افتراضيًا.
    - يثبت إعداد Vitest المشترك `isolate: false` ويستخدم المشغّل غير المعزول عبر مشاريع الجذر، وe2e، والإعدادات الحية.
    - يحتفظ مسار واجهة المستخدم الجذري بتهيئة `jsdom` والمحسّن الخاصين به، لكنه يعمل أيضًا على المشغّل المشترك غير المعزول.
    - يرث كل تقسيم `pnpm test` الافتراضات نفسها `threads` + `isolate: false` من إعداد Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node الفرعية الخاصة بـ Vitest افتراضيًا لتقليل اضطراب تجميع V8 أثناء التشغيلات المحلية الكبيرة. عيّن `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8 القياسي.

  </Accordion>

  <Accordion title="Fast local iteration">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يفعّلها الفرق.
    - خطاف ما قبل الالتزام مخصص للتنسيق فقط. يعيد تجهيز الملفات المنسّقة ولا يشغّل lint أو فحص الأنواع أو الاختبارات.
    - شغّل `pnpm check:changed` صراحةً قبل التسليم أو الدفع عندما تحتاج إلى بوابة الفحص المحلي الذكي.
    - يمر `pnpm test:changed` عبر مسارات رخيصة محددة النطاق افتراضيًا. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر الوكيل أن تعديل حاضنة أو إعداد أو حزمة أو عقد يحتاج فعلًا إلى تغطية Vitest أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه نفسه، لكن مع حد أعلى للعاملين.
    - توسيع العاملين المحلي التلقائي محافظ عمدًا ويتراجع عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، لذلك تُحدث عمليات Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
    - يوسم إعداد Vitest الأساسي المشاريع/ملفات الإعداد بأنها `forceRerunTriggers` بحيث تبقى إعادة التشغيل في النمط المتغير صحيحة عند تغيّر توصيلات الاختبار.
    - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفين المدعومين؛ عيّن `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت موقع ذاكرة تخزين مؤقت صريحًا واحدًا للتنميط المباشر.

  </Accordion>

  <Accordion title="Perf debugging">

    - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى مخرجات تفصيل الاستيراد.
    - يقيّد `pnpm test:perf:imports:changed` عرض التنميط نفسه على الملفات المتغيرة منذ `origin/main`.
    - تُكتب بيانات توقيت التقسيم إلى `.artifacts/vitest-shard-timings.json`. تستخدم تشغيلات الإعداد الكامل مسار الإعداد كمفتاح؛ وتضيف تقسيمات CI ذات نمط التضمين اسم التقسيم حتى يمكن تتبع التقسيمات المفلترة بشكل منفصل.
    - عندما لا يزال اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل، أبقِ الاعتماديات الثقيلة خلف حد محلي ضيق `*.runtime.ts` واستهزئ بذلك الحد مباشرة بدلًا من الاستيراد العميق لمساعدي وقت التشغيل لمجرد تمريرهم عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` تشغيل `test:changed` الموجّه مع مسار مشروع الجذر الأصلي لذلك الفرق الملتزَم، ويطبع زمن الجدار بالإضافة إلى الحد الأقصى لـ RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة المتسخة الحالية من خلال توجيه قائمة الملفات المتغيرة عبر `scripts/test-projects.mjs` وإعداد Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لتكاليف بدء تشغيل Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل لحزمة الوحدات مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، مفروض على عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا عبر loopback مع تمكين التشخيصات افتراضيًا
  - يدفع اضطراب رسائل Gateway والذاكرة والحمولات الكبيرة الاصطناعية عبر مسار أحداث التشخيص
  - يستعلم عن `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدي استمرارية حزمة استقرار التشخيص
  - يؤكد أن المسجل يبقى محدودًا، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق قوائم الانتظار لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج مفاتيح
  - مسار ضيق لمتابعة انحدار الاستقرار، وليس بديلًا لحزمة Gateway الكاملة

### E2E (فحص Gateway smoke)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات E2E للإضافات المضمّنة ضمن `extensions/`
- افتراضات وقت التشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، مطابقًا لبقية المستودع.
  - يستخدم عاملين تكيّفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في النمط الصامت افتراضيًا لتقليل تكلفة إدخال/إخراج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العاملين (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تمكين مخرجات وحدة التحكم التفصيلية.
- النطاق:
  - سلوك Gateway من طرف إلى طرف متعدد المثيلات
  - أسطح WebSocket/HTTP، واقتران Node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في خط الأنابيب)
  - لا يتطلب مفاتيح حقيقية
  - أجزاء متحركة أكثر من اختبارات الوحدات (قد يكون أبطأ)

### E2E: فحص smoke لخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ Gateway OpenShell معزولًا على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يمرّن خلفية OpenShell في OpenClaw عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات الكنسي البعيد عبر جسر sandbox fs
- التوقعات:
  - اختياري فقط؛ ليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI `openshell` محليًا بالإضافة إلى daemon Docker عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر Gateway الاختبار وsandbox
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل حزمة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ثنائي CLI غير افتراضي أو نص غلاف

### حي (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات الحية للإضافات المضمّنة ضمن `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - «هل يعمل هذا المزود/النموذج فعلًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟»
  - التقاط تغييرات تنسيق المزود، وغرائب استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - ليس مستقرًا لـ CI حسب التصميم (شبكات حقيقية، سياسات مزودين حقيقية، حصص، انقطاعات)
  - يكلف مالًا / يستخدم حدود المعدل
  - يُفضّل تشغيل مجموعات فرعية ضيقة بدلًا من «كل شيء»
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيًا، لا تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى منزل اختبار مؤقت حتى لا تتمكن تجهيزات الوحدات من تعديل `~/.openclaw` الحقيقي لديك.
- عيّن `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية دليلك المنزلي الحقيقي.
- أصبح `pnpm test:live` افتراضيًا على نمط أهدأ: يبقي مخرجات تقدم `[live] ...`، لكنه يكتم إشعار `~/.profile` الإضافي ويكتم سجلات تمهيد Gateway/ثرثرة Bonjour. عيّن `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بالمزود): عيّن `*_API_KEYS` بتنسيق الفواصل/الفواصل المنقوطة أو `*_API_KEY_1`، `*_API_KEY_2` (مثلًا `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) أو تجاوزًا لكل اختبار حي عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- مخرجات التقدم/Heartbeat:
  - تصدر الحِزم الحية الآن أسطر تقدم إلى stderr بحيث تكون استدعاءات المزود الطويلة نشطة بشكل مرئي حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة التحكم في Vitest بحيث تتدفق أسطر تقدم المزود/Gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeat للنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat للـ Gateway/المسبار باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي حزمة ينبغي أن أشغّل؟

استخدم جدول القرار هذا:

- عند تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- عند لمس شبكات Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- عند تصحيح "روبوتي متوقف" / إخفاقات خاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` محدّد النطاق

## الاختبارات المباشرة (التي تلمس الشبكة)

لمصفوفة النماذج المباشرة، واختبارات دخان خلفية CLI، واختبارات دخان ACP، وحزمة اختبار خادم تطبيق Codex، وكل اختبارات مزوّدي الوسائط المباشرة (Deepgram، وBytePlus، وComfyUI، والصور، والموسيقى، والفيديو، وحزمة اختبار الوسائط) — بالإضافة إلى التعامل مع بيانات الاعتماد للتشغيلات المباشرة — راجع
[الاختبار — الحزم المباشرة](/ar/help/testing-live).

## مشغّلات Docker (فحوص اختيارية "تعمل في Linux")

تنقسم مشغّلات Docker هذه إلى مجموعتين:

- مشغّلات النماذج المباشرة: يشغّل `test:docker:live-models` و`test:docker:live-gateway` فقط ملفهما المباشر المطابق لمفتاح الملف الشخصي داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تحميل دليل الإعدادات المحلي ومساحة العمل لديك (واستدعاء `~/.profile` إذا كان محمّلاً). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغّلات Docker المباشرة افتراضياً حد دخان أصغر حتى يبقى المسح الكامل عبر Docker عملياً:
  يستخدم `test:docker:live-models` افتراضياً `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضياً `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة هذه عندما تريد
  صراحةً المسح الشامل الأكبر.
- يبني `test:docker:all` صورة Docker المباشرة مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كحزمة npm tarball عبر `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة الأساسية هي فقط مشغّل Node/Git لمسارات التثبيت/التحديث/اعتمادات Plugin؛ وتحمّل تلك المسارات ملف tarball المبني مسبقاً. تثبّت الصورة الوظيفية ملف tarball نفسه في `/app` لمسارات وظائف التطبيق المبني. توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويقع منطق التخطيط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولاً محلياً مرجّحاً: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في خانات العمليات، بينما تمنع حدود الموارد مسارات التشغيل المباشر الثقيلة، وتثبيت npm، والمسارات متعددة الخدمات من البدء كلها مرة واحدة. إذا كان مسار واحد أثقل من الحدود النشطة، يستطيع المجدول مع ذلك بدءه عندما يكون المجمّع فارغاً، ثم يبقيه يعمل وحده حتى تتاح السعة مرة أخرى. القيم الافتراضية هي 10 خانات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما يكون لدى مضيف Docker سعة إضافية. يجري المشغّل فحصاً تمهيدياً لـ Docker افتراضياً، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولاً في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات المرجّح دون بناء Docker أو تشغيله، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة، واحتياجات الحزم/الصور، وبيانات الاعتماد.
- `Package Acceptance` هو بوابة الحزم الأصلية في GitHub لسؤال "هل تعمل هذه الحزمة القابلة للتثبيت كمنتج؟" يحدد حزمة مرشحة واحدة من `source=npm`، أو `source=ref`، أو `source=url`، أو `source=artifact`، ويرفعها باسم `package-under-test`، ثم يشغّل مسارات Docker E2E القابلة لإعادة الاستخدام على ملف tarball نفسه بدلاً من إعادة حزم المرجع المحدد. يحدد `workflow_ref` سكربتات سير العمل/حزمة الاختبار الموثوقة، بينما يحدد `package_ref` التثبيت/الفرع/الوسم المصدري المراد حزمه عند `source=ref`؛ يتيح هذا لمنطق القبول الحالي التحقق من تثبيتات موثوقة أقدم. تُرتّب الملفات الشخصية حسب الاتساع: `smoke` تثبيت/قناة/وكيل سريع بالإضافة إلى Gateway/الإعدادات، و`package` عقد الحزمة/التحديث/Plugin بالإضافة إلى تجهيز ناجي الترقية بدون مفاتيح والبديل الأصلي الافتراضي لمعظم تغطية حزم/تحديثات Parallels، و`product` يضيف قنوات MCP، وتنظيف cron/الوكيل الفرعي، وبحث OpenAI على الويب، وOpenWebUI، و`full` يشغّل أجزاء Docker الخاصة بمسار الإصدار مع OpenWebUI. يشغّل تحقق الإصدار دلتا حزمة مخصصة (`bundled-channel-deps-compat plugins-offline`) بالإضافة إلى QA حزمة Telegram لأن أجزاء Docker الخاصة بمسار الإصدار تغطي بالفعل مسارات الحزمة/التحديث/Plugin المتداخلة. تتضمن أوامر إعادة تشغيل Docker المستهدفة في GitHub والمولّدة من القطع الأثرية مدخلات قطعة الحزمة الأثرية السابقة والصور المجهزة عندما تكون متاحة، بحيث تستطيع المسارات الفاشلة تجنب إعادة بناء الحزمة والصور.
- تشغّل فحوص البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يجتاز الحارس الرسم البياني المبني الثابت من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا استورد بدء التشغيل قبل الإرسال اعتمادات حزم مثل Commander، أو واجهة مطالبات المستخدم، أو undici، أو التسجيل قبل إرسال الأمر؛ كما يحافظ على جزء تشغيل Gateway المضمّن ضمن الميزانية ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة. يغطي دخان CLI المعبأ أيضاً مساعدة الجذر، ومساعدة onboard، ومساعدة doctor، والحالة، ومخطط الإعدادات، وأمراً لسرد النماذج.
- توافق `Package Acceptance` القديم محدود عند `2026.4.25` (بما في ذلك `2026.4.25-beta.*`). حتى ذلك الحد، تتسامح حزمة الاختبار فقط مع فجوات بيانات تعريف الحزم التي شُحنت: إدخالات مخزون QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات التصحيح في تجهيز git المشتق من ملف tarball، وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة، وغياب استمرار سجلات تثبيت marketplace، وترحيل بيانات تعريف الإعدادات أثناء `plugins update`. بالنسبة للحزم بعد `2026.4.25`، تكون هذه المسارات إخفاقات صارمة.
- مشغّلات دخان الحاويات: يشغّل `test:docker:openwebui`، و`test:docker:onboard`، و`test:docker:npm-onboard-channel-agent`، و`test:docker:update-channel-switch`، و`test:docker:upgrade-survivor`، و`test:docker:session-runtime-context`، و`test:docker:agents-delete-shared-workspace`، و`test:docker:gateway-network`، و`test:docker:browser-cdp-snapshot`، و`test:docker:mcp-channels`، و`test:docker:pi-bundle-mcp-tools`، و`test:docker:cron-mcp-cleanup`، و`test:docker:plugins`، و`test:docker:plugin-update`، و`test:docker:config-reload` حاوية حقيقية واحدة أو أكثر ويتحقق من مسارات التكامل الأعلى مستوى.

تربط مشغّلات Docker للنماذج المباشرة أيضاً مجلدات اعتماد CLI المطلوبة فقط (أو كل المجلدات المدعومة عندما لا يكون التشغيل محدد النطاق)، ثم تنسخها إلى مجلد المنزل داخل الحاوية قبل التشغيل حتى يستطيع OAuth الخاص بـ CLI الخارجي تحديث الرموز دون تعديل مخزن الاعتماد على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكريبت: `scripts/test-live-models-docker.sh`)
- اختبار دخان ربط ACP: `pnpm test:docker:live-acp-bind` (السكريبت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- اختبار دخان واجهة خلفية CLI: `pnpm test:docker:live-cli-backend` (السكريبت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار دخان مسخّر خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (السكريبت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكريبت: `scripts/test-live-gateway-models-docker.sh`)
- اختبار دخان قابلية الملاحظة: `pnpm qa:otel:smoke` هو مسار خاص لضمان الجودة من نسخة مصدرية. لا يكون عمدا جزءا من مسارات إصدار Docker للحزمة لأن أرشيف npm يستثني QA Lab.
- اختبار دخان حي لـ Open WebUI: `pnpm test:docker:openwebui` (السكريبت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، إنشاء هيكل كامل): `pnpm test:docker:onboard` (السكريبت: `scripts/e2e/onboard-docker.sh`)
- اختبار دخان أرشيف npm للإعداد الأولي/القناة/الوكيل: `pnpm test:docker:npm-onboard-channel-agent` يثبت أرشيف OpenClaw المحزم عالميا في Docker، ويضبط OpenAI عبر إعداد أولي بإحالة بيئية إضافة إلى Telegram افتراضيا، ويتحقق من أن doctor أصلح تبعيات وقت تشغيل Plugin المفعلة، ويشغّل دورة وكيل OpenAI واحدة بمحاكاة. أعد استخدام أرشيف مبني مسبقا عبر `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخط إعادة بناء المضيف عبر `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة عبر `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- اختبار دخان تبديل قناة التحديث: `pnpm test:docker:update-channel-switch` يثبت أرشيف OpenClaw المحزم عالميا في Docker، ويبدّل من حزمة `stable` إلى git `dev`، ويتحقق من القناة المحفوظة وعمل Plugin بعد التحديث، ثم يبدّل عائدا إلى حزمة `stable` ويفحص حالة التحديث.
- اختبار دخان النجاة من الترقية: `pnpm test:docker:upgrade-survivor` يثبت أرشيف OpenClaw المحزم فوق تجهيز مستخدم قديم غير نظيف يتضمن وكلاء، وإعداد قناة، وقوائم سماح Plugin، وحالة قديمة لتبعيات وقت تشغيل Plugin، وملفات مساحة عمل/جلسة موجودة. يشغل تحديث الحزمة إضافة إلى doctor غير تفاعلي بلا مفاتيح مزود أو قناة حية، ثم يبدأ Gateway عبر local loopback ويفحص الحفاظ على الإعداد/الحالة إضافة إلى ميزانيات بدء التشغيل/الحالة.
- اختبار دخان سياق وقت تشغيل الجلسة: `pnpm test:docker:session-runtime-context` يتحقق من استمرار نص سياق وقت التشغيل المخفي إضافة إلى إصلاح doctor لفروع إعادة كتابة الموجّه المكررة المتأثرة.
- اختبار دخان تثبيت Bun عالمي: `bash scripts/e2e/bun-global-install-smoke.sh` يحزم الشجرة الحالية، ويثبتها باستخدام `bun install -g` في مجلد منزلي معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد مزودي الصور المضمنين بدلا من التعليق. أعد استخدام أرشيف مبني مسبقا عبر `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخط بناء المضيف عبر `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية عبر `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- اختبار دخان مثبت Docker: `bash scripts/test-install-sh-docker.sh` يشارك ذاكرة تخزين npm مؤقتة واحدة بين حاويات الجذر والتحديث وdirect-npm. يعتمد اختبار دخان التحديث افتراضيا على npm `latest` كخط أساس مستقر قبل الترقية إلى الأرشيف المرشح. تجاوزه محليا عبر `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، أو عبر إدخال `update_baseline_version` في مسار عمل Install Smoke على GitHub. تحافظ فحوصات المثبت غير الجذري على ذاكرة تخزين npm مؤقتة معزولة كي لا تخفي إدخالات التخزين المملوكة للجذر سلوك التثبيت المحلي للمستخدم. عيّن `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة التخزين المؤقتة للجذر/التحديث/direct-npm عبر الإعادات المحلية.
- يتخطى Install Smoke CI تحديث direct-npm العالمي المكرر عبر `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل السكريبت محليا من دون هذا المتغير البيئي عندما تكون تغطية `npm install -g` المباشرة مطلوبة.
- اختبار دخان CLI لحذف الوكلاء لمساحة عمل مشتركة: `pnpm test:docker:agents-delete-shared-workspace` (السكريبت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) يبني صورة Dockerfile الجذرية افتراضيا، ويزرع وكيلين بمساحة عمل واحدة في مجلد منزلي معزول داخل حاوية، ويشغل `agents delete --json`، ويتحقق من JSON صالح إضافة إلى سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke عبر `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكريبت: `scripts/e2e/gateway-network-docker.sh`)
- اختبار دخان لقطة Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (السكريبت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) يبني صورة E2E المصدرية إضافة إلى طبقة Chromium، ويبدأ Chromium مع CDP خام، ويشغل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي روابط URL، والعناصر القابلة للنقر المرفوعة بالمؤشر، ومراجع iframe، وبيانات الإطار الوصفية.
- انحدار الاستدلال الأدنى في OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (السكريبت: `scripts/e2e/openai-web-search-minimal-docker.sh`) يشغل خادم OpenAI بمحاكاة عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط المزود ويفحص ظهور التفصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + اختبار دخان لإطار إشعار خام من Claude): `pnpm test:docker:mcp-channels` (السكريبت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة Pi (خادم MCP حقيقي عبر stdio + اختبار دخان لسماح/منع ملف Pi المضمن): `pnpm test:docker:pi-bundle-mcp-tools` (السكريبت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف MCP لـ Cron/الوكيل الفرعي (Gateway حقيقي + إنهاء تابع MCP عبر stdio بعد تشغيلات cron معزولة ووكيل فرعي لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكريبت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (اختبار دخان التثبيت، تثبيت/إزالة حزمة ClawHub الشاملة، تحديثات السوق، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (السكريبت: `scripts/e2e/plugins-docker.sh`)
  عيّن `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/وقت التشغيل الشامل الافتراضيين عبر `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. من دون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم تجهيز ClawHub محليا محكما.
- اختبار دخان عدم تغير تحديث Plugin: `pnpm test:docker:plugin-update` (السكريبت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- اختبار دخان بيانات إعادة تحميل الإعداد الوصفية: `pnpm test:docker:config-reload` (السكريبت: `scripts/e2e/config-reload-source-docker.sh`)
- تبعيات وقت تشغيل Plugin المضمن: `pnpm test:docker:bundled-channel-deps` يبني صورة مشغل Docker صغيرة افتراضيا، ثم يبني ويحزم OpenClaw مرة واحدة على المضيف، ثم يركّب ذلك الأرشيف في كل سيناريو تثبيت Linux. أعد استخدام الصورة عبر `OPENCLAW_SKIP_DOCKER_BUILD=1`، أو تخط إعادة بناء المضيف بعد بناء محلي حديث عبر `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`، أو أشر إلى أرشيف موجود عبر `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. يحزم تجميع Docker الكامل وقطع bundled-channel في مسار الإصدار هذا الأرشيف مسبقا مرة واحدة، ثم يجزئ فحوصات القنوات المضمنة إلى مسارات مستقلة، بما في ذلك مسارات تحديث منفصلة لـ Telegram وDiscord وSlack وFeishu وmemory-lancedb وACPX. تقسّم قطع الإصدار اختبارات دخان القنوات، وأهداف التحديث، وعقود الإعداد/وقت التشغيل إلى `bundled-channels-core` و`bundled-channels-update-a` و`bundled-channels-update-b` و`bundled-channels-contracts`؛ وتبقى قطعة التجميع `bundled-channels` متاحة للإعادات اليدوية. يقسّم مسار عمل الإصدار أيضا قطع مثبت المزود وقطع تثبيت/إزالة Plugin المضمن؛ وتبقى قطع `package-update` و`plugins-runtime` و`plugins-integrations` القديمة أسماء مستعارة تجميعية للإعادات اليدوية. استخدم `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` لتضييق مصفوفة القنوات عند تشغيل المسار المضمن مباشرة، أو `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` لتضييق سيناريو التحديث. تعتمد تشغيلات Docker لكل سيناريو افتراضيا على `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`؛ ويعتمد سيناريو التحديث متعدد الأهداف افتراضيا على `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. يتحقق المسار أيضا من أن `channels.<id>.enabled=false` و`plugins.entries.<id>.enabled=false` يمنعان إصلاح doctor لتبعيات وقت التشغيل.
- ضيّق تبعيات وقت تشغيل Plugin المضمنة أثناء التكرار بتعطيل السيناريوهات غير ذات الصلة، مثلا:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

لبناء الصورة الوظيفية المشتركة مسبقا وإعادة استخدامها يدويا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تبقى تجاوزات الصور الخاصة بالمجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` صاحبة الأولوية عند تعيينها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكريبتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات QR ومثبت Docker بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلا من وقت تشغيل التطبيق المبني المشترك.

تقوم مشغلات Docker للنماذج الحية أيضا بربط checkout الحالي للقراءة فقط و
تجهيزه في workdir مؤقت داخل الحاوية. يحافظ هذا على خفة صورة التشغيل
مع استمرار تشغيل Vitest على المصدر/الإعداد المحلي الدقيق لديك.
تتخطى خطوة التجهيز التخزينات المؤقتة المحلية الكبيرة ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة مخرجات `.build` المحلية للتطبيق أو
Gradle حتى لا تستغرق تشغيلات Docker الحية دقائق في نسخ
آثار خاصة بالجهاز.
كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوص Gateway الحية
عمّال قنوات Telegram/Discord/إلخ. الحقيقيين داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر أيضا
`OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق تغطية Gateway
الحية أو استبعادها من مسار Docker ذلك.
`test:docker:openwebui` هو فحص توافق دخاني أعلى مستوى: يبدأ
حاوية Gateway من OpenClaw مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبّتة مقابل ذلك Gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل
طلب محادثة حقيقي عبر وكيل `/api/chat/completions` في Open WebUI.
قد تكون التشغيله الأولى أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب صورة
Open WebUI وقد يحتاج Open WebUI إلى إنهاء إعداد بدء التشغيل البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج حي قابل للاستخدام، و`OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيا) هي الطريقة الأساسية لتوفيره في التشغيلات المعبأة في Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عمدا ولا يحتاج إلى حساب
Telegram أو Discord أو iMessage حقيقي. يشغّل حاوية Gateway مبذورة،
ويبدأ حاوية ثانية تنشئ `openclaw mcp serve`، ثم يتحقق من
اكتشاف المحادثات الموجّهة، وقراءات النصوص، وبيانات مرفقات التعريف،
وسلوك صف الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة +
الأذونات بأسلوب Claude عبر جسر stdio MCP الحقيقي. يفحص تحقق الإشعارات
إطارات stdio MCP الخام مباشرة حتى يتحقق الفحص الدخاني مما يصدره
الجسر فعليا، وليس فقط ما يحدث أن تعرضه SDK عميل محددة.
`test:docker:pi-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبني صورة Docker للمستودع، ويبدأ خادم فحص stdio MCP حقيقيا
داخل الحاوية، ويجسّد ذلك الخادم عبر وقت تشغيل MCP الخاص بحزمة Pi المضمنة،
وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان
بأدوات `bundle-mcp` بينما تقوم `minimal` و`tools.deny: ["bundle-mcp"]` بترشيحها.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبدأ Gateway مبذورا مع خادم فحص stdio MCP حقيقي، ويشغّل
دورة cron معزولة ودورة ابن لمرة واحدة عبر `/subagents spawn`، ثم يتحقق
من أن عملية MCP الابنة تخرج بعد كل تشغيل.

فحص دخاني يدوي لسلسلة ACP باللغة العادية (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- أبق هذا السكربت لتدفقات عمل الانحدار/التصحيح. قد تكون هناك حاجة إليه مجددا للتحقق من توجيه سلاسل ACP، لذا لا تحذفه.

متغيرات بيئة مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) مركّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) مركّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) مركّب إلى `/home/node/.profile` ويتم تحميله قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المحملة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعداد/مساحة عمل مؤقتة ودون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) مركّب إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتا داخل Docker
- يتم تركيب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط تحت `/host-auth...`، ثم نسخها إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - تقوم تشغيلات المزوّدين المضيقة بتركيب الأدلة/الملفات المطلوبة فقط المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز ذلك يدويا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لترشيح المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة للتشغيلات المعادة التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن الملف الشخصي (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لفحص Open WebUI الدخاني
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز مطالبة تحقق nonce المستخدمة بواسطة فحص Open WebUI الدخاني
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## سلامة المستندات

شغّل فحوص المستندات بعد تعديلات المستندات: `pnpm check:docs`.
شغّل تحقق روابط Mintlify الكامل عندما تحتاج أيضا إلى فحوص عناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه انحدارات «مسار حقيقي» دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة وكيل): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway (WS `wizard.start`/`wizard.next`، يكتب الإعداد + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (skills)

لدينا بالفعل بضعة اختبارات آمنة لـ CI تتصرف مثل «تقييمات موثوقية الوكيل»:

- استدعاء أدوات وهمي عبر Gateway الحقيقي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات معالج من طرف إلى طرف تتحقق من توصيل الجلسة وآثار الإعداد (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودا لـ skills (انظر [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج skills في المطالبة، هل يختار الوكيل skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تؤكد ترتيب الأدوات، وحمل تاريخ الجلسة، وحدود sandbox.

ينبغي أن تبقى التقييمات المستقبلية حتمية أولا:

- مشغّل سيناريو يستخدم مزوّدين وهميين لتأكيد استدعاءات الأدوات + ترتيبها، وقراءات ملف skill، وتوصيل الجلسة.
- مجموعة صغيرة من السيناريوهات المركّزة على skill (استخدام مقابل تجنب، بوابات، حقن المطالبة).
- تقييمات حية اختيارية (باشتراك صريح، ومقيّدة بالبيئة) فقط بعد وجود المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلين يلتزمان
بعقد الواجهة الخاص بهما. تمر على كل plugins المكتشفة وتشغّل مجموعة من
تأكيدات الشكل والسلوك. يتخطى مسار وحدات `pnpm test` الافتراضي عمدا
ملفات الفحص الدخاني والـ seam المشتركة هذه؛ شغّل أوامر العقود صراحة
عندما تلمس أسطح القنوات أو المزوّدين المشتركة.

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
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - التعامل مع معرف السلسلة
- **directory** - واجهة API للدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

موجودة في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوص حالة القناة
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

### متى تشغّلها

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة أو تعديل قناة أو Plugin مزوّد
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة انحدارات (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج مكتشفة في الوضع الحي:

- أضف انحدارا آمنا لـ CI إن أمكن (مزوّد mock/stub، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت بطبيعتها حية فقط (حدود المعدل، سياسات المصادقة)، فأبق الاختبار الحي ضيقا واختياريا عبر متغيرات البيئة
- فضّل استهداف أصغر طبقة تلتقط الخلل:
  - خلل تحويل/إعادة تشغيل طلب المزوّد → اختبار نماذج مباشر
  - خلل في مسار جلسة/تاريخ/أدوات Gateway → فحص Gateway حي دخاني أو اختبار Gateway وهمي آمن لـ CI
- حاجز اجتياز SecretRef:
  - يستنتج `src/secrets/exec-secret-ref-id-parity.test.ts` هدفا عيّنيا واحدا لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرفات exec ذات مقاطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة ذات `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدا عند معرفات أهداف غير مصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذو صلة

- [اختبار حي](/ar/help/testing-live)
- [CI](/ar/ci)
