---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات منع التراجع لأخطاء النموذج/المزوّد
    - تصحيح أخطاء سلوك Gateway + الوكيل
summary: 'عدة الاختبار: مجموعات اختبارات unit/e2e/live، ومشغلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-26T11:32:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46c01493284511d99c37a18fc695cc0af19f87eb6d99eb2ef1beec331c290155
    source_path: help/testing.md
    workflow: 15
---

يمتلك OpenClaw ثلاث مجموعات Vitest ‏(unit/integration وe2e وlive) ومجموعة صغيرة
من مشغلات Docker. هذه الوثيقة هي دليل "كيف نختبر":

- ما الذي تغطيه كل مجموعة (وما الذي **لا** تغطيه عمدًا).
- الأوامر التي يجب تشغيلها لسير العمل الشائع (محلي، قبل push، تصحيح الأخطاء).
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/المزوّدين.
- كيفية إضافة اختبارات منع التراجع لمشكلات النماذج/المزوّدين الواقعية.

## بداية سريعة

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع للمجموعة الكاملة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة watch مباشرة لـ Vitest: `pnpm test:watch`
- أصبح استهداف الملفات المباشر يوجّه الآن أيضًا مسارات extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل أولًا التشغيلات الموجّهة عندما تعمل على تكرار معالجة إخفاق واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بـ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح أخطاء المزوّدين/النماذج الحقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة الحية (مجسات النماذج + أدوات Gateway/الصور): `pnpm test:live`
- استهدف ملفًا حيًا واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- مسح حي للنماذج عبر Docker: `pnpm test:docker:live-models`
  - يشغّل كل نموذج محدد الآن دورًا نصيًا بالإضافة إلى مجس صغير بأسلوب قراءة ملف.
    وتشغّل النماذج التي تعلن بياناتها الوصفية عن إدخال `image` أيضًا دور صورة صغيرًا.
    عطّل المجسات الإضافية عبر `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل إخفاقات المزوّد.
  - تغطية CI: تستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومية و
    `OpenClaw Release Checks` اليدوية سير العمل الحي/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، والذي يتضمن وظائف Docker live model
    منفصلة ومجزأة حسب المزوّد.
  - لعمليات إعادة تشغيل CI الموجّهة، شغّل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و`live_models_only: true`.
  - أضف أسرار المزوّدين الجديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    بالإضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/الخاصين بالإصدار.
- اختبار smoke أصلي لـ Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - يشغّل مسار Docker حيًا مقابل مسار خادم تطبيق Codex، ويربط Slack DM اصطناعيًا
    باستخدام `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من أن الرد العادي ومسار
    مرفق الصورة يمران عبر ربط Plugin الأصلي بدلًا من ACP.
- اختبار smoke لـ Codex app-server harness: `pnpm test:docker:live-codex-harness`
  - يشغّل أدوار وكيل Gateway عبر harness المملوك للـ Plugin لخادم تطبيق Codex،
    ويتحقق من `/codex status` و`/codex models`، ويمارس افتراضيًا مجسات الصورة،
    وCron MCP، والوكيل الفرعي، وGuardian. عطّل مجس الوكيل الفرعي عبر
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل إخفاقات أخرى في
    خادم تطبيق Codex. ولإجراء فحص موجّه للوكيل الفرعي، عطّل المجسات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    ويخرج هذا بعد مجس الوكيل الفرعي ما لم يتم ضبط
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- اختبار smoke لأمر الإنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري إضافي شديد الحذر لسطح أمر إنقاذ قناة الرسائل.
    ويمارس `/crestodian status`، ويصطف تغيير نموذج دائم في الانتظار،
    ويرد `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعدادات.
- اختبار smoke لـ Crestodian planner عبر Docker: `pnpm test:docker:crestodian-planner`
  - يشغّل Crestodian في حاوية بلا إعدادات مع Claude CLI مزيف على `PATH`
    ويتحقق من أن الرجوع الاحتياطي للمخطط الضبابي يترجم إلى كتابة إعدادات مدققة ذات نوع.
- اختبار smoke للتشغيل الأول لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من دليل حالة OpenClaw فارغ، ويوجّه أمر `openclaw` المجرد إلى
    Crestodian، ويطبّق كتابات إعداد setup/model/agent/Discord plugin + SecretRef،
    ويتحقق من الإعدادات، ويتحقق من إدخالات التدقيق. كما أن مسار إعداد Ring 0 نفسه
    مغطى أيضًا في QA Lab عبر
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- اختبار تكلفة Moonshot/Kimi smoke: عند تعيين `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  المعزول مقابل `moonshot/kimi-k2.6`. وتحقق من أن JSON يبلّغ عن Moonshot/K2.6 وأن
  transcript الخاص بالمساعد يخزّن `usage.cost` مطبّعًا.

نصيحة: عندما تحتاج إلى حالة فشل واحدة فقط، فضّل تضييق الاختبارات الحية عبر متغيرات البيئة الخاصة بقائمة السماح الموضحة أدناه.

## المشغلات الخاصة بـ QA

تقع هذه الأوامر بجانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغّل CI مختبر QA في workflows مخصصة. يعمل `Parity gate` على PRs المطابقة
ومن خلال التشغيل اليدوي مع مزوّدين وهميين. ويعمل `QA-Lab - All Lanes` ليلًا على
`main` ومن خلال التشغيل اليدوي مع مسار التكافؤ الوهمي، ومسار Matrix الحي، ومسار Telegram الحي المُدار بواسطة Convex كوظائف متوازية. ويشغّل `OpenClaw Release Checks`
المسارات نفسها قبل الموافقة على الإصدار.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة من المستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمال Gateway معزولين.
    ويستخدم `qa-channel` التزامن 4 افتراضيًا (مقيدًا بعدد السيناريوهات المحددة).
    استخدم `--concurrency <count>` لضبط عدد العمال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج بقيمة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد artifacts من دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم مزوّد محليًا مدعومًا بـ AIMock من أجل تغطية تجريبية
    للتركيبات الثابتة ومحاكاة البروتوكول من دون استبدال المسار `mock-openai`
    المدرك للسيناريو.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل Linux VM مؤقتة عبر Multipass.
  - يحافظ على سلوك اختيار السيناريو نفسه الذي يملكه `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزوّد/النموذج نفسها التي يستخدمها `qa suite`.
  - تمرّر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد المعتمدة على env، ومسار إعدادات مزوّد QA الحي، و`CODEX_HOME`
    عند توفره.
  - يجب أن تبقى أدلة الإخراج تحت جذر المستودع حتى يتمكن الضيف من الكتابة مرة أخرى عبر
    مساحة العمل المركبة.
  - تكتب تقرير QA + الملخص المعتاد بالإضافة إلى سجلات Multipass ضمن
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA بأسلوب المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني npm tarball من النسخة الحالية، ويثبّته عالميًا في
    Docker، ويشغّل إعدادًا أوليًا غير تفاعلي بمفتاح OpenAI API، ويهيّئ Telegram
    افتراضيًا، ويتحقق من أن تمكين Plugin يثبّت تبعيات وقت التشغيل عند الطلب،
    ويشغّل doctor، ويشغّل دور وكيل محليًا واحدًا مقابل نقطة نهاية OpenAI وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار
    التثبيت المعبأ نفسه مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل اختبار Docker smoke حتميًا للتطبيق المبني من أجل
    نصوص سياق وقت التشغيل المضمّن. ويتحقق من أن سياق وقت تشغيل OpenClaw المخفي
    يُحفَظ كرسالة مخصصة غير معروضة بدلًا من تسريبه إلى دور المستخدم المرئي،
    ثم يزرع ملف JSONL جلسة مكسورة متأثرة ويتحقق من أن
    `openclaw doctor --fix` يعيد كتابته إلى الفرع النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبّت حزمة OpenClaw منشورة في Docker، ويشغّل
    الإعداد الأولي لحزمة مثبتة، ويهيّئ Telegram عبر CLI المثبت، ثم يعيد استخدام
    مسار Telegram QA الحي مع تلك الحزمة المثبتة باعتبارها Gateway لنظام الاختبار SUT.
  - يستخدم افتراضيًا `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - يستخدم بيانات اعتماد Telegram البيئية نفسها أو مصدر بيانات اعتماد Convex نفسه الذي يستخدمه
    `pnpm openclaw qa telegram`. وبالنسبة لأتمتة CI/الإصدار، اضبط
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` بالإضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. وإذا
    وُجد `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex في CI،
    فسيختار غلاف Docker Convex تلقائيًا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` القيمة المشتركة
    `OPENCLAW_QA_CREDENTIAL_ROLE` لهذا المسار فقط.
  - يكشف GitHub Actions هذا المسار باعتباره workflow صيانة يدوية
    `NPM Telegram Beta E2E`. وهو لا يعمل عند الدمج. وتستخدم workflow بيئة
    `qa-live-shared` وتأجيرات بيانات اعتماد Convex الخاصة بـ CI.
- `pnpm test:docker:bundled-channel-deps`
  - يحزم ويثبّت الإصدار الحالي من OpenClaw في Docker، ويبدأ Gateway
    مع تهيئة OpenAI، ثم يفعّل القنوات/Plugins المضمّنة عبر تعديلات الإعدادات.
  - يتحقق من أن اكتشاف الإعداد يترك تبعيات وقت تشغيل Plugin غير المهيأة
    غير موجودة، وأن أول تشغيل Gateway أو doctor مهيأ يثبّت تبعيات وقت تشغيل كل Plugin مضمّنة عند الطلب، وألا تعيد
    إعادة التشغيل الثانية تثبيت التبعيات التي فُعّلت بالفعل.
  - يثبّت أيضًا baseline قديمًا معروفًا من npm، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن
    doctor بعد التحديث الخاصة بالمرشح تصلح تبعيات وقت تشغيل القناة المضمّنة من دون
    إصلاح postinstall من جهة harness.
- `pnpm test:parallels:npm-update`
  - يشغّل اختبار smoke لتحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. يثبّت كل
    نظام أساسي محدد أولًا baseline الحزمة المطلوبة، ثم يشغّل أمر
    `openclaw update` المثبت في الضيف نفسه ويتحقق من الإصدار المثبت، وحالة التحديث، وجاهزية Gateway، ودور وكيل محلي واحد.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux` أثناء
    التكرار على ضيف واحد. واستخدم `--json` لمسار artifact الملخص
    وحالة كل مسار.
  - يستخدم مسار OpenAI النموذج `openai/gpt-5.5` لإثبات دور الوكيل الحي افتراضيًا.
    مرر `--model <provider/model>` أو اضبط
    `OPENCLAW_PARALLELS_OPENAI_MODEL` عندما تريد عمدًا التحقق من نموذج OpenAI آخر.
  - لفّ التشغيلات المحلية الطويلة بمهلة على المضيف حتى لا تستهلك أعطال نقل Parallels
    بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسارات متداخلة ضمن `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي عالق.
  - قد تقضي عملية تحديث Windows من 10 إلى 15 دقيقة في إصلاح doctor/تبعيات وقت التشغيل بعد التحديث على ضيف بارد؛
    ويظل ذلك سليمًا ما دام سجل npm debug المتداخل يتقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات Parallels الفردية
    الخاصة بـ macOS أو Windows أو Linux. فهي تشترك في حالة VM ويمكن أن تتصادم على
    استعادة snapshot أو تقديم الحزم أو حالة Gateway داخل الضيف.
  - يشغّل إثبات ما بعد التحديث سطح Plugin المضمّنة المعتاد لأن
    واجهات capability مثل الكلام، وتوليد الصور، وفهم
    الوسائط تُحمَّل عبر واجهات API وقت التشغيل المضمّنة حتى عندما كان دور
    الوكيل نفسه يتحقق فقط من استجابة نصية بسيطة.

- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم مزوّد AIMock المحلي لاختبارات smoke مباشرة للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي لـ Matrix مقابل خادم Tuwunel منزلي مؤقت ومدعوم بـ Docker.
  - هذا المضيف QA مخصص اليوم للمستودع/التطوير فقط. ولا تتضمن تثبيتات OpenClaw المعبأة
    `qa-lab`، لذلك لا تكشف `openclaw qa`.
  - تحمّل نسخ المستودع runner المضمّنة مباشرة؛ ولا حاجة إلى خطوة منفصلة لتثبيت Plugin.
  - يجهّز ثلاثة مستخدمين مؤقتين لـ Matrix ‏(`driver` و`sut` و`observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ child لـ QA gateway مع Plugin Matrix الحقيقية باعتبارها ناقل SUT.
  - يستخدم افتراضيًا صورة Tuwunel الثابتة المثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1`. ويمكن تجاوزها عبر `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا تكشف Matrix عن أعلام مشتركة لمصدر بيانات الاعتماد لأن هذا المسار يجهّز مستخدمين مؤقتين محليًا.
  - يكتب تقرير Matrix QA، والملخص، وartifact للأحداث المرصودة، وسجل مخرجات stdout/stderr المجمّع ضمن `.artifacts/qa-e2e/...`.
  - يصدر التقدّم افتراضيًا ويفرض مهلة تشغيل صارمة عبر `OPENCLAW_QA_MATRIX_TIMEOUT_MS` ‏(الافتراضي 30 دقيقة). ويُقيَّد التنظيف بواسطة `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` وتتضمن الإخفاقات أمر الاسترداد `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار Telegram QA الحي مقابل مجموعة خاصة حقيقية باستخدام رمزي bot الخاصين بـ driver وSUT من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ويجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram رقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمّعة. استخدم وضع env افتراضيًا، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في التأجيرات المجمّعة.
  - يخرج بقيمة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد artifacts من دون رمز خروج فاشل.
  - يتطلب botين مختلفين في المجموعة الخاصة نفسها، مع قيام bot الخاصة بـ SUT بكشف اسم مستخدم Telegram.
  - ولأجل ملاحظة مستقرة بين bot وأخرى، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلتا botين وتأكد من أن bot الخاصة بـ driver يمكنها ملاحظة حركة bot في المجموعة.
  - يكتب تقرير Telegram QA، والملخص، وartifact الرسائل المرصودة ضمن `.artifacts/qa-e2e/...`. وتتضمن سيناريوهات الرد RTT من طلب إرسال driver حتى الرد المرصود من SUT.

تشارك مسارات النقل الحية عقدًا قياسيًا واحدًا حتى لا تنجرف وسائل النقل الجديدة:

تظل `qa-channel` مجموعة QA التركيبية الواسعة وليست جزءًا من مصفوفة تغطية
وسائل النقل الحية.

| المسار   | Canary | تقييد الإشارة | حظر قائمة السماح | رد من المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة الخيط | عزل الخيط | ملاحظة التفاعلات | أمر المساعدة |
| -------- | ------ | -------------- | ---------------- | --------------------- | -------------------------- | ------------ | ---------- | ---------------- | ------------ |
| Matrix   | x      | x              | x                | x                     | x                          | x            | x          | x                |              |
| Telegram | x      |                |                  |                       |                            |              |            |                  | x            |

### بيانات اعتماد Telegram المشتركة عبر Convex ‏(v1)

عند تمكين `--credential-source convex` ‏(أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يكتسب QA lab تأجيرًا حصريًا من مجموعة مدعومة بـ Convex، ويرسل
Heartbeat لهذا التأجير أثناء تشغيل المسار، ويحرر التأجير عند الإيقاف.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات env المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` ‏(مثل `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: ‏`--credential-role maintainer|ci`
  - الافتراضي في env: ‏`OPENCLAW_QA_CREDENTIAL_ROLE` ‏(والافتراضي `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات env الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` ‏(الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` ‏(الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` ‏(الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` ‏(الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` ‏(الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` ‏(معرّف تتبع اختياري)
- يتيح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` عناوين Convex من نوع loopback ‏`http://` للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البروتوكول `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرفين ‏(إضافة/إزالة/إدراج المجموعة)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل التشغيلات الحية للتحقق من عنوان موقع Convex، وأسرار الوسيط،
وبادئة نقطة النهاية، ومهلة HTTP، وإمكانية الوصول إلى الإدارة/الإدراج من دون طباعة
قيم الأسرار. واستخدم `--json` لمخرجات قابلة للقراءة آليًا في السكربتات وأدوات CI.

عقد نقاط النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - النفاد/القابل لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - النجاح: `{ status: "ok" }` ‏(أو `2xx` فارغ)
- `POST /release`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - النجاح: `{ status: "ok" }` ‏(أو `2xx` فارغ)
- `POST /admin/add` ‏(سر المشرف فقط)
  - الطلب: `{ kind, actorId, payload, note?, status? }`
  - النجاح: `{ status: "ok", credential }`
- `POST /admin/remove` ‏(سر المشرف فقط)
  - الطلب: `{ credentialId, actorId }`
  - النجاح: `{ status: "ok", changed, credential }`
  - حارس التأجير النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` ‏(سر المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة معرّف دردشة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

### إضافة قناة إلى QA

تتطلب إضافة قناة إلى نظام QA المعتمد على Markdown أمرين بالضبط:

1. مكيّف نقل للقناة.
2. حزمة سيناريوهات تمارس عقد القناة.

لا تضف جذر أوامر QA جديدًا من المستوى الأعلى عندما يستطيع المضيف المشترك `qa-lab`
امتلاك التدفّق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء المجموعة وإيقافها
- تزامن العمال
- كتابة artifacts
- توليد التقارير
- تنفيذ السيناريوهات
- الأسماء المستعارة للتوافق مع سيناريوهات `qa-channel` الأقدم

تمتلك Plugins الـ runner عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت جذر `qa` المشترك
- كيفية تهيئة Gateway لذلك النقل
- كيفية التحقق من الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية ملاحظة الرسائل الصادرة
- كيفية كشف النصوص وحالة النقل المطبّعة
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة الضبط أو التنظيف الخاص بالنقل

الحد الأدنى لاعتماد قناة جديدة هو:

1. إبقاء `qa-lab` مالكًا لجذر `qa` المشترك.
2. تنفيذ transport runner على واجهة المضيف المشتركة `qa-lab`.
3. إبقاء الآليات الخاصة بالنقل داخل Plugin الـ runner أو harness القناة.
4. تركيب runner على أنها `openclaw qa <runner>` بدلًا من تسجيل أمر جذر منافس.
   يجب أن تعلن Plugins الـ runner عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   أبقِ `runtime-api.ts` خفيفة؛ ويجب أن تبقى CLI الكسولة وتنفيذ الـ runner خلف نقاط دخول منفصلة.
5. تأليف أو تكييف سيناريوهات Markdown تحت أدلة `qa/scenarios/` ذات السمة المناسبة.
6. استخدام مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. الحفاظ على عمل الأسماء المستعارة الحالية للتوافق ما لم يكن المستودع ينفّذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا أمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقِه في Plugin الـ runner أو harness الخاصة بها.
- إذا احتاج السيناريو إلى قدرة جديدة يمكن لأكثر من قناة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بالقناة في `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بذلك النقل واجعل ذلك صريحًا في عقد السيناريو.

الأسماء العامة المفضلة للمساعدات في السيناريوهات الجديدة هي:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

تظل الأسماء المستعارة للتوافق متاحة للسيناريوهات الحالية، بما في ذلك:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

يجب أن تستخدم الأعمال الجديدة على القنوات أسماء المساعدات العامة.
وتوجد الأسماء المستعارة للتوافق لتجنب ترحيل شامل دفعة واحدة، لا كنموذج
لتأليف السيناريوهات الجديدة.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكّر في المجموعات على أنها "زيادة في الواقعية" (وزيادة في عدم الاستقرار/الكلفة):

### Unit / integration ‏(الافتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم التشغيلات غير الموجهة مجموعة الشظايا `vitest.full-*.config.ts` وقد توسّع شظايا المشاريع المتعددة إلى إعدادات لكل مشروع من أجل الجدولة المتوازية
- الملفات: فهارس core/unit ضمن `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts` واختبارات `ui` الخاصة بـ node المدرجة في القائمة البيضاء والمغطاة بواسطة `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات integration داخل العملية (مصادقة gateway، والتوجيه، والأدوات، والتحليل، والإعدادات)
  - اختبارات منع تراجع حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة

<AccordionGroup>
  <Accordion title="المشاريع، والشظايا، والمسارات المقيّدة">

    - يشغّل `pnpm test` غير الموجّه اثني عشر إعدادًا أصغر للشظايا (`core-unit-fast` و`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية جذر أصلية عملاقة واحدة. وهذا يقلل ذروة RSS على الأجهزة المحمّلة ويمنع أعمال auto-reply/extension من تجويع المجموعات غير ذات الصلة.
    - لا يزال `pnpm test --watch` يستخدم مخطط المشاريع الأصلي للجذر `vitest.config.ts`، لأن حلقة watch متعددة الشظايا غير عملية.
    - يوجّه كل من `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر مسارات مقيّدة أولًا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع كلفة بدء مشروع الجذر الكامل.
    - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى المسارات المقيّدة نفسها عندما يلمس الفرق ملفات source/test قابلة للتوجيه فقط؛ أما تعديلات config/setup فما تزال ترجع إلى إعادة التشغيل الواسعة لمشروع الجذر.
    - يُعد `pnpm check:changed` البوابة المحلية الذكية المعتادة للأعمال الضيقة. فهو يصنّف الفرق إلى core وcore tests وextensions وextension tests وapps وdocs وبيانات تعريف الإصدار وأدوات Docker الحية والأدوات، ثم يشغّل مسارات typecheck/lint/test المطابقة. وتتضمن تغييرات Plugin SDK العامة وعقود plugins تمريرة تحقق واحدة للـ extension لأن الامتدادات تعتمد على تلك العقود الأساسية. وتشغّل زيادات الإصدار الخاصة ببيانات تعريف الإصدار فقط فحوصات موجّهة للإصدار/الإعدادات/تبعية الجذر بدلًا من المجموعة الكاملة، مع حارس يرفض تغييرات الحزم خارج حقل الإصدار الأعلى مستوى.
    - تشغّل تعديلات live Docker ACP harness بوابة محلية مركزة: صياغة shell لسكربتات auth الخاصة بـ live Docker، وتشغيل dry-run لجدولة live Docker، واختبارات unit لربط ACP، واختبارات extension الخاصة بـ ACPX. وتُدرج تغييرات `package.json` فقط عندما يقتصر الفرق على `scripts["test:docker:live-*"]`؛ أما تعديلات التبعيات وعمليات التصدير والإصدار والأسطح الأخرى الخاصة بالحزمة فما تزال تستخدم الحواجز الأوسع.
    - تُوجَّه اختبارات unit الخفيفة الاستيراد من الوكلاء، والأوامر، وPlugins، ومساعدات auto-reply، و`plugin-sdk`، والمناطق النفعية الخالصة المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ بينما تبقى الملفات الثقيلة في الحالة/وقت التشغيل على المسارات الحالية.
    - تُطابق أيضًا بعض ملفات المصدر المساعدة المحددة من `plugin-sdk` و`commands` التشغيلات في وضع changed مع اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
    - يمتلك `auto-reply` حاويات مخصصة للمساعدات الأساسية الأعلى مستوى، واختبارات integration العليا `reply.*`، والشجرة الفرعية `src/auto-reply/reply/**`. ويقسّم CI أيضًا الشجرة الفرعية الخاصة بالرد إلى شظايا agent-runner وdispatch وcommands/state-routing حتى لا تمتلك حاوية واحدة ثقيلة الاستيراد ذيل Node الكامل.

  </Accordion>

  <Accordion title="تغطية Embedded runner">

    - عندما تغيّر مدخلات اكتشاف أدوات الرسائل أو سياق وقت تشغيل Compaction،
      حافظ على مستويي التغطية كليهما.
    - أضف اختبارات منع تراجع مساعدة ومركزة لحدود التوجيه والتطبيع الخالصة.
    - حافظ على سلامة مجموعات integration الخاصة بـ embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      و`src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه المجموعات من أن المعرّفات المقيّدة وسلوك Compaction لا يزالان
      يمران عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ ولا تعد
      الاختبارات المساعدة فقط بديلًا كافيًا عن مسارات integration هذه.

  </Accordion>

  <Accordion title="إعدادات Vitest الافتراضية الخاصة بالمجموعة والعزل">

    - يستخدم إعداد Vitest الأساسي افتراضيًا `threads`.
    - يثبت إعداد Vitest المشترك القيمة `isolate: false` ويستخدم
      runner غير المعزول عبر مشاريع الجذر، وإعدادات e2e، وlive.
    - يحتفظ مسار UI الجذري بإعداد `jsdom` والمُحسِّن الخاص به، لكنه يعمل على
      runner المشتركة غير المعزولة أيضًا.
    - ترث كل شظية من `pnpm test` القيم الافتراضية نفسها `threads` + `isolate: false`
      من إعداد Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` القيمة `--no-maglev` افتراضيًا إلى
      عمليات Node الفرعية الخاصة بـ Vitest لتقليل تذبذب ترجمة V8 أثناء التشغيلات المحلية الكبيرة.
      اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع
      سلوك V8 القياسي.

  </Accordion>

  <Accordion title="التكرار المحلي السريع">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يفعّلها الفرق.
    - خطاف ما قبل الالتزام مخصص للتنسيق فقط. فهو يعيد تجهيز الملفات
      المنسقة ولا يشغّل lint أو typecheck أو الاختبارات.
    - شغّل `pnpm check:changed` صراحةً قبل التسليم أو push عندما
      تحتاج إلى البوابة المحلية الذكية. وتتضمن تغييرات Plugin SDK العامة وعقود plugins
      تمريرة تحقق واحدة للـ extension.
    - يوجّه `pnpm test:changed` عبر مسارات مقيّدة عندما تطابق المسارات المتغيرة
      مجموعة أصغر بشكل نظيف.
    - يحافظ كل من `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه نفسه
      ولكن بحد أعلى أكبر للعمال.
    - إن التوسع التلقائي المحلي للعمال محافظ عمدًا ويتراجع
      عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، لذلك تتسبب
      تشغيلات Vitest المتعددة المتزامنة بأضرار أقل افتراضيًا.
    - يعلّم إعداد Vitest الأساسي المشاريع/ملفات الإعدادات على أنها
      `forceRerunTriggers` حتى تبقى إعادة التشغيل في وضع changed صحيحة عندما
      تتغير أسلاك الاختبار.
    - يُبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على
      المضيفين المدعومين؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا كنت تريد
      موقع ذاكرة مؤقتة صريحًا واحدًا لإجراء profiling مباشر.

  </Accordion>

  <Accordion title="تصحيح الأداء">

    - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى
      مخرجات تفصيل الاستيراد.
    - يقيّد `pnpm test:perf:imports:changed` عرض profiling نفسه على
      الملفات المتغيرة منذ `origin/main`.
    - تُكتب بيانات توقيت الشظايا إلى `.artifacts/vitest-shard-timings.json`.
      وتستخدم التشغيلات على مستوى الإعداد الكامل مسار الإعدادات كمفتاح؛
      وتضيف شظايا CI ذات أنماط التضمين اسم الشظية بحيث يمكن تتبع
      الشظايا المفلترة بشكل منفصل.
    - عندما لا يزال اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل،
      أبقِ التبعيات الثقيلة خلف واجهة محلية ضيقة من نوع `*.runtime.ts`
      وقم بمحاكاة تلك الواجهة مباشرة بدلًا من الاستيراد العميق لمساعدات وقت التشغيل
      فقط لتمريرها عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>`
      بين `test:changed` الموجّه والمسار الأصلي لمشروع الجذر لذلك الفرق الملتزم ويطبع
      زمن الجدار بالإضافة إلى macOS max RSS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` أداء شجرة العمل
      المتسخة الحالية عبر توجيه قائمة الملفات المتغيرة من خلال
      `scripts/test-projects.mjs` وإعداد Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف CPU profile للخيط الرئيسي من أجل
      نفقات بدء Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات CPU+heap profile للـ
      unit suite مع تعطيل التوازي على مستوى الملف.

  </Accordion>
</AccordionGroup>

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، ومفروض عليه عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا على loopback مع تفعيل التشخيصات افتراضيًا
  - يمرّر اضطراب رسائل Gateway، والذاكرة، والحمولات الكبيرة الاصطناعي عبر مسار أحداث التشخيص
  - يستعلم عن `diagnostics.stability` عبر WS RPC الخاص بـ Gateway
  - يغطي مساعدات استمرارية حزمة استقرار التشخيص
  - يؤكد أن المسجل يبقى ضمن الحدود، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق طوابير كل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ومن دون مفاتيح
  - مسار ضيق لمتابعة اختبارات منع تراجع الاستقرار، وليس بديلًا عن مجموعة Gateway الكاملة

### E2E ‏(smoke لـ Gateway)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات E2E الخاصة بالـ Plugins المضمّنة تحت `extensions/`
- افتراضيات وقت التشغيل:
  - يستخدم Vitest ‏`threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمالًا تكيفيين (في CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل كلفة I/O في الطرفية.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل مخرجات الطرفية المطولة.
- النطاق:
  - سلوك Gateway متعددة المثيلات من طرف إلى طرف
  - أسطح WebSocket/HTTP، واقتران Node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في المسار)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit ‏(وقد يكون أبطأ)

### E2E: اختبار smoke للواجهة الخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ OpenShell gateway معزولة على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يمارس الواجهة الخلفية OpenShell في OpenClaw عبر `sandbox ssh-config` + تنفيذ SSH حقيقي
  - يتحقق من سلوك نظام الملفات القياسي البعيد عبر جسر fs الخاص بالـ sandbox
- التوقعات:
  - يعمل بالاشتراك فقط؛ وليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا لـ `openshell` بالإضافة إلى Docker daemon عاملة
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمر gateway والـ sandbox التجريبيين
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى CLI binary غير افتراضي أو سكربت wrapper

### Live ‏(مزوّدون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات live الخاصة بالـ Plugins المضمّنة تحت `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` ‏(يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزوّد/النموذج فعلًا _اليوم_ مع بيانات اعتماد حقيقية؟"
  - التقاط تغييرات تنسيق المزوّد، ومراوغات استدعاء الأدوات، ومشكلات المصادقة، وسلوك تحديد المعدل
- التوقعات:
  - غير مستقر لـ CI بطبيعته (شبكات حقيقية، وسياسات مزوّد حقيقية، وحصص، وانقطاعات)
  - يكلّف مالًا / يستهلك حدود المعدل
  - يفضّل تشغيل مجموعات فرعية ضيقة بدلًا من "كل شيء"
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API المفقودة.
- افتراضيًا، لا تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد الإعدادات/المصادقة إلى home اختبار مؤقت حتى لا تتمكن تركيبات unit من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية دليل home الحقيقي لديك.
- يستخدم `pnpm test:live` الآن افتراضيًا وضعًا أكثر هدوءًا: فهو يُبقي مخرجات التقدّم `[live] ...`، لكنه يخفي إشعار `~/.profile` الإضافي ويكتم سجلات bootstrap الخاصة بـ Gateway وضوضاء Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت سجلات البدء الكاملة مرة أخرى.
- تدوير مفاتيح API ‏(خاص بالمزوّد): اضبط `*_API_KEYS` بصيغة فاصلة/فاصلة منقوطة أو `*_API_KEY_1` و`*_API_KEY_2` ‏(مثل `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو استخدم تجاوزًا لكل live عبر `OPENCLAW_LIVE_*_KEY`؛ وتعيد الاختبارات المحاولة عند استجابات تحديد المعدل.
- مخرجات التقدّم/Heartbeat:
  - تُصدر المجموعات الحية الآن أسطر التقدّم إلى stderr بحيث تبقى استدعاءات المزوّد الطويلة مرئية النشاط حتى عندما يكون التقاط الطرفية في Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض طرفية Vitest بحيث تتدفق أسطر تقدّم المزوّد/Gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeat الخاصة بالنماذج المباشرة عبر `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat الخاصة بـ Gateway/المجسات عبر `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` ‏(و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح "الروبوت متوقف" / إخفاقات خاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` على مجموعة فرعية ضيقة

## الاختبارات الحية (التي تلمس الشبكة)

بالنسبة إلى مصفوفة النماذج الحية، واختبارات smoke للواجهة الخلفية لـ CLI، واختبارات smoke لـ ACP، وharness خادم تطبيق Codex،
وجميع اختبارات مزوّدي الوسائط الحية (Deepgram وBytePlus وComfyUI والصور
والموسيقى والفيديو وmedia harness) — بالإضافة إلى التعامل مع بيانات الاعتماد الخاصة بالتشغيلات الحية — راجع
[الاختبار — المجموعات الحية](/ar/help/testing-live).

## مشغلات Docker ‏(فحوصات اختيارية من نوع "يعمل على Linux")

تنقسم مشغلات Docker هذه إلى فئتين:

- مشغلات النماذج الحية: يشغّل `test:docker:live-models` و`test:docker:live-gateway` فقط ملف live المطابق لمفتاح ملف التعريف داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعدادات المحلي ومساحة العمل لديك (ومع استيراد `~/.profile` إذا كان مركبًا). ونقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغلات Docker الحية افتراضيًا حدًا أصغر لاختبارات smoke حتى يظل المسح الكامل عبر Docker عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات env هذه عندما
  تريد صراحةً إجراء المسح الأكبر والأشمل.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها لمسارات Docker الحية. كما يبني أيضًا صورة مشتركة واحدة `scripts/e2e/Dockerfile` عبر `test:docker:e2e-build` ويعيد استخدامها لمشغلات smoke الخاصة بحاويات E2E التي تمارس التطبيق المبني. ويستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في فتحات العمليات، بينما تمنع حدود الموارد بدء جميع المسارات الثقيلة الخاصة بـ live وnpm-install ومتعددة الخدمات دفعة واحدة. والقيم الافتراضية هي 10 فتحات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ ولا تضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` إلا عندما يمتلك مضيف Docker سعة أكبر. ويجري المشغّل فحص Docker تمهيديًا افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزّن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة manifest المسارات الموزونة من دون بناء Docker أو تشغيلها.
- مشغلات smoke للحاويات: تبدأ `test:docker:openwebui` و`test:docker:onboard` و`test:docker:npm-onboard-channel-agent` و`test:docker:update-channel-switch` و`test:docker:session-runtime-context` و`test:docker:agents-delete-shared-workspace` و`test:docker:gateway-network` و`test:docker:browser-cdp-snapshot` و`test:docker:mcp-channels` و`test:docker:pi-bundle-mcp-tools` و`test:docker:cron-mcp-cleanup` و`test:docker:plugins` و`test:docker:plugin-update` و`test:docker:config-reload` حاوية أو أكثر حقيقية وتتحقق من مسارات integration على مستوى أعلى.

كما تقوم مشغلات Docker الخاصة بالنماذج الحية أيضًا بتركيب أدلة المصادقة الخاصة بـ CLI اللازمة فقط (أو جميع الأدلة المدعومة عندما لا يكون التشغيل مضيقًا)، ثم تنسخها إلى home الحاوية قبل التشغيل حتى يتمكن OAuth الخاص بـ CLI الخارجية من تحديث الرموز من دون تغيير مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` ‏(السكربت: `scripts/test-live-models-docker.sh`)
- اختبار smoke لربط ACP: ‏`pnpm test:docker:live-acp-bind` ‏(السكربت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيًا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- اختبار smoke للواجهة الخلفية لـ CLI: ‏`pnpm test:docker:live-cli-backend` ‏(السكربت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار smoke لـ Codex app-server harness: ‏`pnpm test:docker:live-codex-harness` ‏(السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل dev: ‏`pnpm test:docker:live-gateway` ‏(السكربت: `scripts/test-live-gateway-models-docker.sh`)
- اختبار smoke حي لـ Open WebUI: ‏`pnpm test:docker:openwebui` ‏(السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، كامل البنية): ‏`pnpm test:docker:onboard` ‏(السكربت: `scripts/e2e/onboard-docker.sh`)
- اختبار smoke للإعداد الأولي/القناة/الوكيل عبر npm tarball: يقوم `pnpm test:docker:npm-onboard-channel-agent` بتثبيت tarball OpenClaw المعبأ عالميًا في Docker، ويهيّئ OpenAI عبر إعداد أولي قائم على env-ref بالإضافة إلى Telegram افتراضيًا، ويتحقق من أن doctor تصلح تبعيات وقت تشغيل Plugin المفعّلة، ويشغّل دور وكيل OpenAI وهميًا واحدًا. أعد استخدام tarball مبنية مسبقًا عبر `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة بناء المضيف عبر `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة عبر `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- اختبار smoke لتبديل قناة التحديث: يقوم `pnpm test:docker:update-channel-switch` بتثبيت tarball OpenClaw المعبأة عالميًا في Docker، ويبدّل من package `stable` إلى git `dev`، ويتحقق من القناة المحفوظة وعمل Plugin بعد التحديث، ثم يبدّل مرة أخرى إلى package `stable` ويفحص حالة التحديث.
- اختبار smoke لسياق وقت تشغيل الجلسة: يتحقق `pnpm test:docker:session-runtime-context` من استمرارية نص سياق وقت التشغيل المخفي بالإضافة إلى إصلاح doctor لفروع إعادة كتابة prompt المتأثرة والمكررة.
- اختبار smoke للتثبيت العام عبر Bun: ‏`bash scripts/e2e/bun-global-install-smoke.sh` يحزم الشجرة الحالية، ويثبتها عبر `bun install -g` في home معزولة، ويتحقق من أن `openclaw infer image providers --json` يعيد مزوّدي الصور المضمّنين بدلًا من التعليق. أعد استخدام tarball مبنية مسبقًا عبر `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ بناء المضيف عبر `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية عبر `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- اختبار smoke للمثبّت عبر Docker: يشترك `bash scripts/test-install-sh-docker.sh` في ذاكرة npm المؤقتة نفسها عبر حاويات root وupdate وdirect-npm. ويستخدم smoke التحديث افتراضيًا npm `latest` كخط أساس مستقر قبل الترقية إلى tarball المرشحة. وتحافظ فحوصات المثبت غير الجذرية على ذاكرة npm مؤقتة معزولة حتى لا تُخفي إدخالات الذاكرة المؤقتة المملوكة لـ root سلوك التثبيت المحلي للمستخدم. اضبط `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة التخزين المؤقت root/update/direct-npm عبر التشغيلات المحلية المتكررة.
- يتخطى Install Smoke في CI التحديث العام المباشر المكرر لـ npm عبر `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل السكربت محليًا من دون هذا المتغير عندما تحتاج إلى تغطية مباشرة لـ `npm install -g`.
- اختبار smoke لـ Agents delete shared workspace عبر CLI: ‏`pnpm test:docker:agents-delete-shared-workspace` ‏(السكربت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) يبني صورة Dockerfile الجذرية افتراضيًا، ويزرع وكيلين مع مساحة عمل واحدة في home حاوية معزولة، ويشغّل `agents delete --json`، ويتحقق من صحة JSON وسلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke عبر `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway ‏(حاويتان، ومصادقة WS + الصحة): ‏`pnpm test:docker:gateway-network` ‏(السكربت: `scripts/e2e/gateway-network-docker.sh`)
- اختبار smoke لـ Browser CDP snapshot: ‏`pnpm test:docker:browser-cdp-snapshot` ‏(السكربت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) يبني صورة E2E المصدرية بالإضافة إلى طبقة Chromium، ويبدأ Chromium مع CDP خام، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات دور CDP تغطي عناوين الروابط، والعناصر القابلة للنقر المرقاة بالمؤشر، ومراجع iframe، وبيانات frame الوصفية.
- اختبار منع تراجع OpenAI Responses web_search للتفكير الأدنى: ‏`pnpm test:docker:openai-web-search-minimal` ‏(السكربت: `scripts/e2e/openai-web-search-minimal-docker.sh`) يشغّل خادم OpenAI وهميًا عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط المزوّد ويتحقق من ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP ‏(Gateway مزروعة + stdio bridge + اختبار smoke لإطار الإشعارات الخام لـ Claude): ‏`pnpm test:docker:mcp-channels` ‏(السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP المضمّنة في Pi ‏(خادم MCP حقيقي عبر stdio + اختبار smoke للسماح/المنع لملف Pi المضمّن): ‏`pnpm test:docker:pi-bundle-mcp-tools` ‏(السكربت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف MCP الخاص بـ Cron/subagent ‏(Gateway حقيقية + إزالة stdio MCP child بعد تشغيلات Cron المعزولة وتشغيلات subagent أحادية الاستخدام): ‏`pnpm test:docker:cron-mcp-cleanup` ‏(السكربت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins ‏(تثبيت smoke، وتثبيت/إزالة ClawHub، وتحديثات marketplace، وتمكين/فحص Claude-bundle): ‏`pnpm test:docker:plugins` ‏(السكربت: `scripts/e2e/plugins-docker.sh`)
  اضبط `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub الحية، أو تجاوز الحزمة الافتراضية عبر `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- اختبار smoke للتحديث غير المتغير للـ Plugin: ‏`pnpm test:docker:plugin-update` ‏(السكربت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- اختبار smoke لبيانات تعريف إعادة تحميل الإعدادات: ‏`pnpm test:docker:config-reload` ‏(السكربت: `scripts/e2e/config-reload-source-docker.sh`)
- تبعيات وقت التشغيل للـ Plugin المضمّنة: يقوم `pnpm test:docker:bundled-channel-deps` ببناء صورة Docker runner صغيرة افتراضيًا، ويبني OpenClaw ويحزمها مرة واحدة على المضيف، ثم يركّب تلك tarball داخل كل سيناريو تثبيت على Linux. أعد استخدام الصورة عبر `OPENCLAW_SKIP_DOCKER_BUILD=1`، أو تخطَّ إعادة بناء المضيف بعد بناء محلي جديد عبر `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`، أو أشِر إلى tarball موجودة عبر `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. ويقوم التجميع الكامل لـ Docker بتهيئة هذه tarball مسبقًا مرة واحدة، ثم يجزّئ فحوصات القنوات المضمّنة إلى مسارات مستقلة، بما في ذلك مسارات تحديث منفصلة لكل من Telegram وDiscord وSlack وFeishu وmemory-lancedb وACPX. استخدم `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` لتضييق مصفوفة القنوات عند تشغيل المسار المضمّن مباشرة، أو `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` لتضييق سيناريو التحديث. ويتحقق هذا المسار أيضًا من أن `channels.<id>.enabled=false` و`plugins.entries.<id>.enabled=false` يمنعان doctor/إصلاح تبعيات وقت التشغيل.
- ضيّق تبعيات وقت تشغيل Plugin المضمّنة أثناء التكرار عن طريق تعطيل السيناريوهات غير ذات الصلة، مثلًا:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

لإنشاء صورة التطبيق المبني المشتركة مسبقًا وإعادة استخدامها يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بكل مجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` هي المسيطرة عند تعيينها. وعندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تقوم السكربتات بسحبها إذا لم تكن موجودة محليًا. وتحتفظ اختبارات QR والمثبّت عبر Docker بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلًا من وقت تشغيل التطبيق المبني المشترك.

تقوم مشغلات Docker الخاصة بالنماذج الحية أيضًا بتركيب النسخة الحالية من المستودع للقراءة فقط
وتهيئتها داخل دليل عمل مؤقت داخل الحاوية. ويحافظ هذا على نحافة صورة وقت التشغيل
مع الاستمرار في تشغيل Vitest مقابل المصدر/الإعدادات المحلية الدقيقة لديك.
وتتخطى خطوة التهيئة الذاكرات المؤقتة المحلية الكبيرة فقط ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` المحلية للتطبيق أو
مخرجات Gradle حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ
artifacts خاصة بالجهاز.
كما تضبط أيضًا `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ مجسات Gateway الحية
عمال قنوات حقيقية مثل Telegram/Discord وغيرها داخل الحاوية.
ولا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر
`OPENCLAW_LIVE_GATEWAY_*` أيضًا عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
الحية من مسار Docker ذلك.
يمثل `test:docker:openwebui` اختبار smoke للتوافق على مستوى أعلى: فهو يبدأ
حاوية OpenClaw gateway مع تفعيل نقاط النهاية HTTP المتوافقة مع OpenAI،
ثم يبدأ حاوية Open WebUI مثبتة مقابل تلك Gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يكشف `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وسيط `/api/chat/completions` الخاص بـ Open WebUI.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد تحتاج إلى سحب
صورة Open WebUI وقد تحتاج Open WebUI إلى إكمال إعداد البداية الباردة الخاصة بها.
ويتوقع هذا المسار وجود مفتاح نموذج حي صالح، ويُعد `OPENCLAW_PROFILE_FILE`
‏(`~/.profile` افتراضيًا) الوسيلة الأساسية لتوفيره في التشغيلات المعتمدة على Docker.
وتطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
أما `test:docker:mcp-channels` فهو حتمي عمدًا ولا يحتاج إلى
حساب حقيقي على Telegram أو Discord أو iMessage. فهو يبدأ حاوية
Gateway مزروعة، ثم يبدأ حاوية ثانية تشغّل `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثة الموجّهة، وقراءات النصوص، وبيانات المرفقات الوصفية،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة +
الصلاحيات بأسلوب Claude عبر جسر MCP حقيقي على stdio. ويفحص اختبار الإشعارات
إطارات stdio MCP الخام مباشرة، بحيث يتحقق smoke مما يصدره الجسر فعلًا،
وليس فقط مما يحدث أن تكشفه SDK عميل معينة.
أما `test:docker:pi-bundle-mcp-tools` فهو حتمي ولا يحتاج إلى
مفتاح نموذج حي. فهو يبني صورة Docker للمستودع، ويبدأ خادم مجس MCP حقيقيًا على stdio
داخل الحاوية، ويجسّد ذلك الخادم من خلال وقت تشغيل MCP المضمّن في Pi bundle،
وينفّذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان
بأدوات `bundle-mcp` بينما تقوم `minimal` و`tools.deny: ["bundle-mcp"]` بترشيحها.
أما `test:docker:cron-mcp-cleanup` فهو حتمي ولا يحتاج إلى مفتاح نموذج حي.
فهو يبدأ Gateway مزروعة مع خادم مجس MCP حقيقي على stdio، ويشغّل دور Cron
معزولًا ودور child أحادي الاستخدام عبر `/subagents spawn`، ثم يتحقق
من خروج عملية MCP child بعد كل تشغيل.

اختبار smoke يدوي لخيط ACP بلغة طبيعية عادية (ليس في CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت من أجل سير عمل منع التراجع/تصحيح الأخطاء. فقد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه خيوط ACP، لذلك لا تحذفه.

متغيرات env مفيدة:

- `OPENCLAW_CONFIG_DIR=...` ‏(الافتراضي: `~/.openclaw`) ويُركّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` ‏(الافتراضي: `~/.openclaw/workspace`) ويُركّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` ‏(الافتراضي: `~/.profile`) ويُركّب إلى `/home/node/.profile` ويُستورد قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق من متغيرات env المستوردة من `OPENCLAW_PROFILE_FILE` فقط، باستخدام أدلة إعدادات/مساحة عمل مؤقتة ومن دون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` ‏(الافتراضي: `~/.cache/openclaw/docker-cli-tools`) ويُركّب إلى `/home/node/.npm-global` لتخزين تثبيتات CLI داخل Docker مؤقتًا
- تُركَّب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط ضمن `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و`~/.codex/config.toml` و`.claude.json` و`~/.claude/.credentials.json` و`~/.claude/settings.json` و`~/.claude/settings.local.json`
  - تركب تشغيلات المزوّدين المضيقة الأدلة/الملفات اللازمة فقط المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز ذلك يدويًا عبر `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة للتشغيلات المتكررة التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن profile ‏(وليس من env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي تكشفه Gateway لاختبار Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز prompt فحص nonce المستخدمة في اختبار Open WebUI smoke
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## سلامة الوثائق

شغّل فحوصات الوثائق بعد تعديلات الوثائق: `pnpm check:docs`.
وشغّل التحقق الكامل من Mintlify anchors عندما تحتاج أيضًا إلى فحوصات العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## منع التراجع دون اتصال ‏(آمن لـ CI)

هذه اختبارات منع تراجع لـ "مسار حقيقي" من دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway ‏(OpenAI وهمية، مع gateway + حلقة وكيل حقيقيتين): ‏`src/gateway/gateway.test.ts` ‏(الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway ‏(‏WS ‏`wizard.start`/`wizard.next`، يكتب config + auth مفروضين): ‏`src/gateway/gateway.test.ts` ‏(الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل ‏(Skills)

لدينا بالفعل عدد من الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء أدوات وهمية عبر Gateway + حلقة وكيل حقيقيتين (`src/gateway/gateway.test.ts`).
- تدفقات معالج كاملة من طرف إلى طرف تتحقق من أسلاك الجلسات وتأثيرات الإعدادات (`src/gateway/gateway.test.ts`).

ما يزال ينقص Skills ‏(راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في prompt، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/المعاملات المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تؤكد ترتيب الأدوات، واستمرار سجل الجلسة، وحدود sandbox.

يجب أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين وهميين لتأكيد استدعاءات الأدوات + ترتيبها، وقراءة ملفات Skill، وأسلاك الجلسات.
- مجموعة صغيرة من السيناريوهات المركزة على Skills ‏(استخدام مقابل تجنب، والتقييد، وحقن prompt).
- تقييمات حية اختيارية ‏(بالاشتراك وتحت تحكم env) فقط بعد وجود المجموعة الآمنة لـ CI.

## اختبارات العقود ‏(شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وكل قناة مسجلة تطابق
عقد الواجهة الخاصة بها. فهي تتكرر على جميع Plugins المكتشفة وتشغّل مجموعة من
تأكيدات الشكل والسلوك. ويتخطى مسار unit الافتراضي `pnpm test`
عمدًا هذه الملفات المشتركة الخاصة بالواجهات واختبارات smoke؛ شغّل أوامر العقود صراحةً
عندما تلمس الأسطح المشتركة الخاصة بالقنوات أو المزوّدين.

### الأوامر

- جميع العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

توجد في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي للـ Plugin ‏(المعرّف، والاسم، والقدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرّف الخيط
- **directory** - واجهة API الخاصة بالدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

توجد في `src/plugins/contracts/*.contract.test.ts`.

- **status** - مجسات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّد

توجد في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفّق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - API فهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تُشغَّل

- بعد تغيير عمليات التصدير أو المسارات الفرعية في Plugin SDK
- بعد إضافة أو تعديل Plugin قناة أو مزوّد
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافها

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات منع التراجع ‏(إرشادات)

عندما تصلح مشكلة مزوّد/نموذج اكتُشفت في live:

- أضف اختبار منع تراجع آمنًا لـ CI إن أمكن ‏(مزوّد وهمي/بديل، أو التقط التحويل الدقيق لشكل الطلب)
- إذا كانت بطبيعتها خاصة بـ live فقط ‏(حدود المعدل، وسياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا وبالاشتراك عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ في تحويل/إعادة تشغيل طلب المزوّد → اختبار نماذج مباشر
  - خطأ في Gateway session/history/tool pipeline → اختبار smoke حي لـ Gateway أو اختبار Gateway وهمي وآمن لـ CI
- حاجز الحماية ضد اجتياز SecretRef:
  - يقوم `src/secrets/exec-secret-ref-id-parity.test.ts` باشتقاق هدف عيّنة واحد لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرّفات exec التي تحتوي على مقاطع اجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة من نوع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. ويفشل الاختبار عمدًا على معرّفات الأهداف غير المصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذو صلة

- [الاختبار الحي](/ar/help/testing-live)
- [CI](/ar/ci)
