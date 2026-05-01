---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النماذج/المزوّدين
    - تصحيح أخطاء سلوك Gateway والوكيل
summary: 'عدة الاختبار: مجموعات unit/e2e/live، ومشغلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-05-01T07:40:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c28e45c483169f528483f7a27265d89c34f3865eb56b51407639b566e117162
    source_path: help/testing.md
    workflow: 16
---

لدى OpenClaw ثلاث حِزم Vitest اختبارية (الوحدات/التكامل، وe2e، والحية) ومجموعة صغيرة
من مشغلات Docker. هذا المستند دليل "كيف نختبر":

- ما تغطيه كل حزمة (وما تتعمد _عدم_ تغطيته).
- الأوامر التي يجب تشغيلها لسير العمل الشائع (محليًا، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/المزوّدين.
- كيف تضيف اختبارات تراجع لمشكلات النماذج/المزوّدين الواقعية.

<Note>
**مكدس QA (qa-lab، وqa-channel، ومسارات النقل الحية)** موثق بشكل منفصل:

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) — البنية، وسطح الأوامر، وتأليف السيناريوهات.
- [Matrix QA](/ar/concepts/qa-matrix) — مرجع لـ `pnpm openclaw qa matrix`.
- [قناة QA](/ar/channels/qa-channel) — Plugin النقل الاصطناعي المستخدم في السيناريوهات المدعومة بالمستودع.

تغطي هذه الصفحة تشغيل حِزم الاختبار العادية ومشغلات Docker/Parallels. يسرد قسم المشغلات الخاصة بـ QA أدناه ([مشغلات خاصة بـ QA](#qa-specific-runners)) استدعاءات `qa` المحددة ويشير مجددًا إلى المراجع أعلاه.
</Note>

## بداية سريعة

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع للحزمة الكاملة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- الاستهداف المباشر للملفات يوجّه الآن مسارات الإضافات/القنوات أيضًا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تكرر العمل على فشل واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بآلة Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- حزمة E2E: `pnpm test:e2e`

عند تصحيح المزوّدين/النماذج الحقيقية (يتطلب بيانات اعتماد حقيقية):

- الحزمة الحية (النماذج + مجسات أداة/صورة Gateway): `pnpm test:live`
- استهدف ملفًا حيًا واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- مسح نماذج حي عبر Docker: `pnpm test:docker:live-models`
  - يشغّل كل نموذج محدد الآن دورة نصية إضافة إلى مجس صغير بأسلوب قراءة ملف.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغّل أيضًا دورة صورة صغيرة.
    عطّل المجسات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل إخفاقات المزوّد.
  - تغطية CI: يستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومي و
    `OpenClaw Release Checks` اليدوي سير عمل live/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، والذي يتضمن مهام مصفوفة نماذج Docker حية منفصلة
    ومجزأة حسب المزوّد.
  - لإعادات تشغيل CI المركزة، شغّل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و `live_models_only: true`.
  - أضف أسرار المزوّدين الجديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    إضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/الخاصة بالإصدار.
- فحص دخان Codex الأصلي للمحادثة المرتبطة: `pnpm test:docker:live-codex-bind`
  - يشغّل مسارًا حيًا عبر Docker ضد مسار خادم تطبيق Codex، ويربط رسالة Slack DM اصطناعية
    باستخدام `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من مرور رد عادي ومرفق صورة
    عبر ربط Plugin الأصلي بدلًا من ACP.
- فحص دخان حزام خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغّل دورات وكيل Gateway عبر حزام خادم تطبيق Codex المملوك لـ Plugin،
    ويتحقق من `/codex status` و `/codex models`، وبشكل افتراضي يمارس مجسات الصورة،
    وcron MCP، والوكيل الفرعي، وGuardian. عطّل مجس الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل إخفاقات أخرى في
    خادم تطبيق Codex. لفحص مركز للوكيل الفرعي، عطّل المجسات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد مجس الوكيل الفرعي ما لم يتم ضبط
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- فحص دخان أمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري احترازي مزدوج لسطح أمر الإنقاذ لقناة الرسائل.
    يمارس `/crestodian status`، ويضع تغيير نموذج دائمًا في الطابور،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعدادات.
- فحص دخان مخطط Crestodian عبر Docker: `pnpm test:docker:crestodian-planner`
  - يشغّل Crestodian في حاوية بلا إعدادات مع Claude CLI مزيف على `PATH`
    ويتحقق من أن fallback المخطط الضبابي يترجم إلى كتابة إعدادات نمطية ومدققة.
- فحص دخان التشغيل الأول لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من دليل حالة OpenClaw فارغ، ويوجّه `openclaw` المجرد إلى
    Crestodian، ويطبق setup/model/agent/Discord plugin + كتابات SecretRef،
    ويتحقق من الإعدادات، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضًا في QA Lab بواسطة
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- فحص دخان تكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل أمرًا معزولًا
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  ضد `moonshot/kimi-k2.6`. تحقق من أن JSON يبلغ عن Moonshot/K2.6 وأن
  نص المساعد يخزن `usage.cost` المطبّعة.

<Tip>
عندما تحتاج حالة فاشلة واحدة فقط، فضّل تضييق الاختبارات الحية عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## مشغلات خاصة بـ QA

تقع هذه الأوامر بجانب حِزم الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغّل CI مختبر QA Lab في مسارات عمل مخصصة. يعمل `Parity gate` على طلبات PR المطابقة
ومن التشغيل اليدوي مع مزوّدين وهميين. يعمل `QA-Lab - All Lanes` ليليًا على
`main` ومن التشغيل اليدوي مع بوابة التكافؤ الوهمية، ومسار Matrix الحي،
ومسار Telegram حي مدار من Convex، ومسار Discord حي مدار من Convex كمهام
متوازية. تمرر فحوصات QA المجدولة وفحوصات الإصدار `--profile fast` إلى Matrix
صراحةً، بينما تبقى القيمة الافتراضية لكل من Matrix CLI وإدخال سير العمل اليدوي
`all`؛ ويمكن للتشغيل اليدوي تجزئة `all` إلى مهام `transport`، و`media`، و`e2ee-smoke`،
و`e2ee-deep`، و`e2ee-cli`. يشغّل `OpenClaw Release Checks` التكافؤ إضافة إلى
مساري Matrix السريع وTelegram قبل موافقة الإصدار، باستخدام
`mock-openai/gpt-5.5` لفحوصات نقل الإصدار كي تبقى حتمية
وتتجنب بدء Plugin المزوّد العادي. تعطل بوابات النقل الحية هذه
بحث الذاكرة؛ ويبقى سلوك الذاكرة مغطى بواسطة حِزم تكافؤ QA.

تستخدم أجزاء وسائط الإصدار الحية الكاملة
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، والتي تحتوي مسبقًا على
`ffmpeg` و`ffprobe`. تستخدم أجزاء نماذج/خلفيات Docker الحية صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
التزام محدد، ثم تسحبها باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلًا من إعادة البناء
داخل كل جزء.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة بالمستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمال Gateway معزولين.
    القيمة الافتراضية لتزامن `qa-channel` هي 4 (محدودة بعدد السيناريوهات
    المحددة). استخدم `--concurrency <count>` لضبط عدد العمال،
    أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج بقيمة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد القطع الأثرية دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier`، و`mock-openai`، و`aimock`.
    يبدأ `aimock` خادم مزوّد محليًا مدعومًا بـ AIMock لتغطية تجريبية
    للتركيبات ومحاكاة البروتوكول دون استبدال مسار
    `mock-openai` الواعي بالسيناريو.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل قياس بدء Gateway إضافة إلى حزمة صغيرة من سيناريوهات QA Lab الوهمية
    (`channel-chat-baseline`، و`memory-failure-fallback`،
    و`gateway-restart-inflight-run`) ويكتب ملخص ملاحظة CPU مدمجًا
    تحت `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم فقط ملاحظات CPU الساخنة المستمرة افتراضيًا (`--cpu-core-warn`
    إضافة إلى `--hot-wall-warn-ms`)، لذلك تُسجل اندفاعات البدء القصيرة كمقاييس
    دون أن تبدو مثل تراجع تثبيت Gateway الممتد لدقائق.
  - يستخدم قطع `dist` المبنية؛ شغّل بناءً أولًا عندما لا تحتوي نسخة العمل
    بالفعل على خرج وقت تشغيل حديث.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل حزمة QA نفسها داخل Linux VM مؤقتة من Multipass.
  - يحافظ على سلوك اختيار السيناريو نفسه مثل `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزوّد/النموذج نفسها مثل `qa suite`.
  - تمرر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد المستندة إلى البيئة، ومسار إعداد مزوّد QA الحي، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى أدلة الخرج تحت جذر المستودع كي يستطيع الضيف الكتابة مرة أخرى عبر
    مساحة العمل المركّبة.
  - يكتب تقرير QA والملخص العاديين إضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لعمل QA بأسلوب المشغل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني tarball npm من نسخة العمل الحالية، ويثبته عالميًا في
    Docker، ويشغّل تهيئة OpenAI API-key غير تفاعلية، ويضبط Telegram
    افتراضيًا، ويتحقق من أن تفعيل Plugin يثبت تبعيات وقت التشغيل عند
    الحاجة، ويشغّل doctor، ويشغّل دورة وكيل محلية واحدة ضد نقطة نهاية OpenAI
    وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ نفسه
    مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل فحص دخان Docker حتميًا لتطبيق مبني من أجل نصوص سياق وقت التشغيل
    المضمنة. يتحقق من أن سياق وقت تشغيل OpenClaw المخفي محفوظ كرسالة مخصصة
    غير معروضة بدلًا من التسرب إلى دورة المستخدم المرئية، ثم يزرع JSONL جلسة
    مكسورة متأثرة ويتحقق من أن
    `openclaw doctor --fix` يعيد كتابته إلى الفرع النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبت مرشح حزمة OpenClaw في Docker، ويشغّل تهيئة الحزمة المثبتة،
    ويضبط Telegram عبر CLI المثبت، ثم يعيد استخدام مسار QA الحي لـ Telegram
    مع تلك الحزمة المثبتة باعتبارها Gateway للنظام قيد الاختبار.
  - القيمة الافتراضية هي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛ اضبط
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار tarball محلي محلول بدلًا من
    التثبيت من السجل.
  - يستخدم بيانات اعتماد بيئة Telegram نفسها أو مصدر اعتماد Convex نفسه مثل
    `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، اضبط
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` إضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. إذا كان
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI،
    يختار مغلف Docker Convex تلقائيًا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` القيمة المشتركة
    `OPENCLAW_QA_CREDENTIAL_ROLE` لهذا المسار فقط.
  - تعرض GitHub Actions هذا المسار كسير عمل مشرف يدوي
    `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة
    `qa-live-shared` وإيجارات بيانات اعتماد Convex CI.
- تعرض GitHub Actions أيضًا `Package Acceptance` كإثبات منتج جانبي التشغيل
  ضد حزمة مرشحة واحدة. يقبل مرجعًا موثوقًا، أو مواصفة npm منشورة،
  أو URL tarball عبر HTTPS مع SHA-256، أو قطعة tarball من تشغيل آخر، ويرفع
  `openclaw-current.tgz` المطبّع باسم `package-under-test`، ثم يشغّل
  مجدول Docker E2E الحالي بملفات تعريف مسارات smoke أو package أو product أو full أو custom.
  اضبط `telegram_mode=mock-openai` أو `live-frontier` لتشغيل سير عمل Telegram QA
  ضد قطعة `package-under-test` نفسها.
  - أحدث إثبات منتج beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات URL tarball الدقيق ملخصًا:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- يحمّل إثبات الأثر ملف tarball كأثر من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - يحزم تثبيت OpenClaw الحالي ويثبته في Docker، ويشغّل Gateway
    مع ضبط OpenAI، ثم يفعّل القنوات/Plugin المضمّنة عبر تعديلات
    الإعدادات.
  - يتحقق من أن اكتشاف الإعداد يترك تبعيات وقت تشغيل Plugin غير المضبوطة
    غائبة، وأن أول تشغيل Gateway مضبوط أو تشغيل doctor يثبّت تبعيات وقت
    تشغيل كل Plugin مضمّن عند الطلب، وأن إعادة تشغيل ثانية لا تعيد
    تثبيت التبعيات التي فُعّلت بالفعل.
  - يثبّت أيضًا خط أساس npm أقدم معروفًا، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن doctor بعد التحديث
    للمرشح يصلح تبعيات وقت تشغيل القنوات المضمّنة دون إصلاح postinstall
    من جهة الحاضنة.
- `pnpm test:parallels:npm-update`
  - يشغّل اختبار smoke لتحديث التثبيت الأصلي المعبأ عبر ضيوف Parallels. يثبّت
    كل نظام محدد أولًا حزمة خط الأساس المطلوبة، ثم يشغّل أمر
    `openclaw update` المثبت في الضيف نفسه ويتحقق من الإصدار المثبت، وحالة
    التحديث، وجاهزية Gateway، ودورة وكيل محلي واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux` أثناء
    التكرار على ضيف واحد. استخدم `--json` لمسار أثر الملخص وحالة كل مسار.
  - يستخدم مسار OpenAI النموذج `openai/gpt-5.5` لإثبات دورة الوكيل الحية
    افتراضيًا. مرّر `--model <provider/model>` أو عيّن
    `OPENCLAW_PARALLELS_OPENAI_MODEL` عند التحقق المتعمد من نموذج OpenAI آخر.
  - غلّف التشغيلات المحلية الطويلة بمهلة مضيف حتى لا تستهلك توقفات نقل
    Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسارات متداخلة تحت `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي متوقف.
  - قد يستغرق تحديث Windows من 10 إلى 15 دقيقة في إصلاح doctor/تبعيات وقت
    التشغيل بعد التحديث على ضيف بارد؛ يبقى ذلك سليمًا ما دام سجل تصحيح npm
    المتداخل يتقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات smoke الفردية الخاصة
    بـ Parallels على macOS أو Windows أو Linux. فهي تشترك في حالة VM ويمكن أن
    تتصادم عند استعادة اللقطات أو تقديم الحزم أو حالة Gateway في الضيف.
  - يشغّل إثبات ما بعد التحديث سطح Plugin المضمّن العادي لأن واجهات القدرات
    مثل الكلام، وتوليد الصور، وفهم الوسائط تُحمّل عبر APIs وقت التشغيل
    المضمّنة حتى عندما تتحقق دورة الوكيل نفسها من رد نصي بسيط فقط.

- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم مزود AIMock المحلي لاختبار smoke مباشر للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي لـ Matrix مقابل خادم Tuwunel منزلي مؤقت مدعوم بـ Docker. من نسخة المصدر فقط — لا تشحن التثبيتات المعبأة `qa-lab`.
  - CLI الكامل، وفهرس الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط الآثار: [QA لـ Matrix](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رموز بوت السائق وSUT من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` للاعتمادات المشتركة المجمّعة. استخدم وضع البيئة افتراضيًا، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في التأجيرات المجمّعة.
  - يخرج بقيمة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد الآثار دون رمز خروج فاشل.
  - يتطلب بوتين متميزين في المجموعة الخاصة نفسها، مع أن يكشف بوت SUT عن اسم مستخدم Telegram.
  - لمراقبة مستقرة بين البوتات، فعّل وضع Bot-to-Bot Communication Mode في `@BotFather` لكلا البوتين وتأكد من قدرة بوت السائق على مراقبة مرور بوتات المجموعة.
  - يكتب تقرير QA لـ Telegram وملخصًا وأثر الرسائل المرصودة تحت `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال السائق إلى رد SUT المرصود.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ توجد مصفوفة تغطية كل مسار في [نظرة عامة على QA ← تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). يُعد `qa-channel` المجموعة التركيبية الواسعة وليس جزءًا من تلك المصفوفة.

### اعتمادات Telegram مشتركة عبر Convex (v1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل مختبر QA على تأجير حصري من مجموعة مدعومة بـ Convex، ويرسل heartbeats
لذلك التأجير أثناء تشغيل المسار، ويحرر التأجير عند الإيقاف.

قالب مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (مثلًا `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- اختيار دور الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - افتراضي البيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (افتراضيًا `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL من Convex باستخدام `http://` عبر loopback للتطوير المحلي فقط.

ينبغي أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` ‏`https://` في التشغيل العادي.

تتطلب أوامر إدارة المشرفين (إضافة/إزالة/عرض المجموعة)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل التشغيلات الحية للتحقق من عنوان URL لموقع Convex، وأسرار الوسيط،
وبادئة نقطة النهاية، ومهلة HTTP، وقابلية وصول الإدارة/العرض دون طباعة
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
- يجب أن يكون `groupId` سلسلة معرّف دردشة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

### إضافة قناة إلى QA

توجد أسماء المعمارية ومساعدي السيناريو لمهايئات القنوات الجديدة في [نظرة عامة على QA ← إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: تنفيذ مشغّل النقل على seam مضيف `qa-lab` المشترك، وإعلان `qaRunners` في بيان Plugin، وتركيبه كـ `openclaw qa <runner>`، وتأليف السيناريوهات تحت `qa/scenarios/`.

## مجموعات الاختبار (ما يُشغّل وأين)

فكّر في المجموعات بوصفها «واقعية متزايدة» (ومعها زيادة في التقلب/التكلفة):

### Unit / integration (الافتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم التشغيلات غير المستهدفة مجموعة الشظايا `vitest.full-*.config.ts` وقد توسّع الشظايا متعددة المشاريع إلى إعدادات لكل مشروع للجدولة المتوازية
- الملفات: قوائم جرد core/unit تحت `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`؛ تعمل اختبارات وحدة UI في شظية `unit-ui` المخصصة
- النطاق:
  - اختبارات وحدة صرفة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، والتوجيه، والأدوات، والتحليل، والإعدادات)
  - تراجعات حتمية للأخطاء المعروفة
- التوقعات:
  - يعمل في CI
  - لا يتطلب مفاتيح حقيقية
  - ينبغي أن يكون سريعًا ومستقرًا
  - يجب أن تثبت اختبارات المحلّل ومحمّل السطح العام سلوك الرجوع الواسع لـ `api.js` و
    `runtime-api.js` باستخدام تجهيزات Plugin صغيرة مولّدة، لا APIs مصدر Plugin
    المضمّنة الحقيقية. تنتمي تحميلات API الحقيقية لـ Plugin إلى
    مجموعات العقد/التكامل التي يملكها Plugin.

<AccordionGroup>
  <Accordion title="المشاريع، والشظايا، والمسارات المحددة">

    - تشغّل `pnpm test` غير المستهدفة اثني عشر إعداد تقسيم أصغر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) بدل عملية مشروع جذر أصلية واحدة ضخمة. يقلل هذا ذروة RSS على الأجهزة المحمّلة ويتجنب أن تحرم أعمال auto-reply/extension مجموعات الاختبار غير المرتبطة من الموارد.
    - لا يزال `pnpm test --watch` يستخدم مخطط مشروع الجذر الأصلي `vitest.config.ts`، لأن حلقة المراقبة متعددة التقسيمات غير عملية.
    - تمرّر `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر المسارات محددة النطاق أولًا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع كلفة بدء مشروع الجذر بالكامل.
    - توسّع `pnpm test:changed` مسارات git المتغيرة إلى مسارات رخيصة محددة النطاق افتراضيًا: تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، والتابعين المحليين في مخطط الاستيراد. لا تؤدي تعديلات الإعداد/التهيئة/الحزمة إلى تشغيل الاختبارات على نطاق واسع إلا إذا استخدمت صراحة `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هي بوابة الفحص المحلي الذكي المعتادة للعمل الضيق. تصنّف الفرق إلى core، واختبارات core، وextensions، واختبارات extension، والتطبيقات، والمستندات، وبيانات الإصدار الوصفية، وأدوات Docker الحية، والأدوات، ثم تشغّل أوامر فحص الأنواع وlint والحراسة المطابقة. لا تشغّل اختبارات Vitest؛ استدعِ `pnpm test:changed` أو `pnpm test <target>` الصريح لإثبات الاختبار. تشغّل زيادات الإصدارات التي تقتصر على بيانات الإصدار الوصفية فقط فحوصات مستهدفة للإصدار/الإعداد/اعتماديات الجذر، مع حارس يرفض تغييرات الحزمة خارج حقل الإصدار ذي المستوى الأعلى.
    - تشغّل تعديلات حزمة ACP الحية في Docker فحوصات مركزة: صياغة shell لنصوص مصادقة Docker الحية وتشغيلًا تجريبيًا جافًا لمجدول Docker الحي. تُضمّن تغييرات `package.json` فقط عندما يكون الفرق محدودًا بـ `scripts["test:docker:live-*"]`؛ وتظل تعديلات الاعتماديات، والتصدير، والإصدار، وغيرها من أسطح الحزمة تستخدم الحراسات الأوسع.
    - تُمرَّر اختبارات الوحدة خفيفة الاستيراد من agents وcommands وplugins ومساعدات auto-reply و`plugin-sdk` ومناطق الأدوات الصافية المشابهة عبر مسار `unit-fast`، الذي يتجاوز `test/setup-openclaw-runtime.ts`؛ وتبقى الملفات ذات الحالة أو الثقيلة وقت التشغيل على المسارات الحالية.
    - تُعيّن أيضًا ملفات مصدر مساعدة مختارة من `plugin-sdk` و`commands` تشغيلات وضع التغيير إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، لذلك تتجنب تعديلات المساعد إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
    - يملك `auto-reply` حاويات مخصصة لمساعدات core ذات المستوى الأعلى، واختبارات تكامل `reply.*` ذات المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. تقسم CI أيضًا الشجرة الفرعية reply إلى تقسيمات agent-runner وdispatch وcommands/state-routing حتى لا تستحوذ حاوية ثقيلة الاستيراد واحدة على ذيل Node بالكامل.
    - تتخطى CI العادية لـ PR/main عمدًا مسح دفعة extension وتقسيم `agentic-plugins` الخاص بالإصدار فقط. يطلق Full Release Validation سير العمل الابن المنفصل `Plugin Prerelease` لهذه المجموعات الثقيلة في plugin/extension على مرشحات الإصدار.

  </Accordion>

  <Accordion title="تغطية المشغّل المضمّن">

    - عند تغيير مدخلات اكتشاف أدوات الرسائل أو سياق تشغيل Compaction،
      أبقِ مستويي التغطية كليهما.
    - أضف اختبارات انحدار مساعدة مركزة لحدود التوجيه والتطبيع
      الصافية.
    - أبقِ مجموعات تكامل المشغّل المضمّن سليمة:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه المجموعات من أن المعرّفات محددة النطاق وسلوك Compaction لا يزالان يمران
      عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ والاختبارات المقتصرة على المساعدات
      ليست بديلًا كافيًا لتلك مسارات التكامل.

  </Accordion>

  <Accordion title="افتراضيات تجمع Vitest والعزل">

    - يضبط إعداد Vitest الأساسي القيمة الافتراضية على `threads`.
    - يثبت إعداد Vitest المشترك `isolate: false` ويستخدم
      المشغّل غير المعزول عبر مشاريع الجذر، وe2e، والإعدادات الحية.
    - يحتفظ مسار واجهة المستخدم الجذري بإعداد `jsdom` والمُحسّن الخاصين به، لكنه يعمل أيضًا على
      المشغّل غير المعزول المشترك.
    - يرث كل تقسيم `pnpm test` افتراضيات `threads` + `isolate: false`
      نفسها من إعداد Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node الفرعية الخاصة بـ Vitest
      افتراضيًا لتقليل عبء ترجمة V8 أثناء التشغيلات المحلية الكبيرة.
      اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8
      القياسي.

  </Accordion>

  <Accordion title="تكرار محلي سريع">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يفعّلها الفرق.
    - خطاف ما قبل الالتزام مخصص للتنسيق فقط. يعيد إدراج الملفات المنسقة في staging ولا
      يشغّل lint أو فحص الأنواع أو الاختبارات.
    - شغّل `pnpm check:changed` صراحة قبل التسليم أو الدفع عندما
      تحتاج إلى بوابة الفحص المحلي الذكي.
    - تمر `pnpm test:changed` عبر مسارات رخيصة محددة النطاق افتراضيًا. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر الوكيل
      أن تعديل حزمة اختبار، أو إعداد، أو حزمة، أو عقد يحتاج فعلًا إلى تغطية
      Vitest أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه
      نفسه، لكن مع حد أعلى للعاملين.
    - التحجيم التلقائي للعاملين المحليين محافظ عمدًا ويتراجع
      عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، لذلك تُحدث تشغيلات
      Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
    - يضع إعداد Vitest الأساسي المشاريع/ملفات الإعداد بصفتها
      `forceRerunTriggers` حتى تبقى عمليات إعادة التشغيل في وضع التغيير صحيحة عند تغير
      توصيلات الاختبار.
    - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفين المدعومين؛
      اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا كنت تريد
      موقع ذاكرة تخزين مؤقت صريحًا واحدًا للتنميط المباشر.

  </Accordion>

  <Accordion title="تصحيح أداء الأخطاء">

    - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى
      مخرجات تفصيل الاستيراد.
    - يقيّد `pnpm test:perf:imports:changed` عرض التنميط نفسه إلى
      الملفات المتغيرة منذ `origin/main`.
    - تُكتب بيانات توقيت التقسيم إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم تشغيلات الإعداد الكامل مسار الإعداد كمفتاح؛ وتُلحق تقسيمات CI
      ذات أنماط التضمين اسم التقسيم حتى يمكن تتبع التقسيمات المفلترة
      بشكل منفصل.
    - عندما لا يزال اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل،
      أبقِ الاعتماديات الثقيلة خلف حد `*.runtime.ts` محلي ضيق و
      استهزئ بذلك الحد مباشرة بدل الاستيراد العميق لمساعدات وقت التشغيل لمجرد
      تمريرها عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` تشغيل
      `test:changed` الموجّه بمسار مشروع الجذر الأصلي لذلك الفرق الملتزم
      ويطبع وقت الجدار بالإضافة إلى أقصى RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة الحالية
      غير النظيفة بتمرير قائمة الملفات المتغيرة عبر
      `scripts/test-projects.mjs` وإعداد Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي من أجل
      بدء Vitest/Vite وأعباء التحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل من أجل
      مجموعة الوحدة مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، مجبر على عامل واحد
- النطاق:
  - يبدأ Gateway loopback حقيقيًا مع تفعيل التشخيصات افتراضيًا
  - يدفع churn اصطناعيًا لرسائل Gateway والذاكرة والحمولات الكبيرة عبر مسار حدث التشخيص
  - يستعلم `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات استمرار حزمة استقرار التشخيص
  - يؤكد أن المسجّل يبقى محدودًا، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق الطوابير لكل جلسة تصرف عائدة إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج إلى مفاتيح
  - مسار ضيق لمتابعة انحدار الاستقرار، وليس بديلًا لمجموعة Gateway الكاملة

### E2E (اختبار Gateway smoke)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts`، و`test/**/*.e2e.test.ts`، واختبارات E2E الخاصة بالـ Plugin المضمّنة تحت `extensions/`
- افتراضيات وقت التشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عاملين تكيفيين (CI: حتى 2، محلي: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل عبء إدخال/إخراج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العاملين (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل مخرجات وحدة التحكم التفصيلية.
- النطاق:
  - سلوك Gateway متعدد النسخ من البداية إلى النهاية
  - أسطح WebSocket/HTTP، واقتران node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تفعيله في pipeline)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي أجزاء متحركة أكثر من اختبارات الوحدة (قد يكون أبطأ)

### E2E: اختبار smoke لخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ Gateway OpenShell معزولًا على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يمرّن خلفية OpenShell في OpenClaw عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات remote-canonical عبر جسر fs الخاص بـ sandbox
- التوقعات:
  - اختياري فقط؛ ليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI `openshell` محليًا بالإضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر Gateway الاختبار وsandbox
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتفعيل الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو نص wrapper

### حي (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`، و`test/**/*.live.test.ts`، والاختبارات الحية الخاصة بالـ Plugin المضمّنة تحت `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - “هل يعمل هذا المزود/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟”
  - التقاط تغييرات تنسيق المزود، وخصائص استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر في CI حسب التصميم (شبكات حقيقية، سياسات مزودين حقيقية، حصص، انقطاعات)
  - يكلف مالًا / يستخدم حدود المعدل
  - يفضل تشغيل مجموعات فرعية ضيقة بدل “كل شيء”
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API المفقودة.
- افتراضيًا، لا تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى منزل اختبار مؤقت حتى لا تتمكن تجهيزات الوحدة من تعديل `~/.openclaw` الحقيقي الخاص بك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية دليل المنزل الحقيقي الخاص بك.
- أصبح `pnpm test:live` افتراضيًا الآن في وضع أهدأ: يحافظ على مخرجات تقدم `[live] ...`، لكنه يكتم إشعار `~/.profile` الإضافي ويصمت سجلات تمهيد Gateway/ضجيج Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بالمزود): اضبط `*_API_KEYS` بصيغة الفواصل/الفواصل المنقوطة أو `*_API_KEY_1`، `*_API_KEY_2` (مثل `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) أو تجاوزًا لكل تشغيل حي عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- مخرجات التقدم/Heartbeat:
  - تصدر المجموعات الحية الآن أسطر تقدم إلى stderr بحيث تبدو استدعاءات المزود الطويلة نشطة بصريًا حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطل `vitest.live.config.ts` اعتراض وحدة تحكم Vitest حتى تُبث أسطر تقدم المزود/Gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeat للنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat لـ Gateway/probe باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تحرير المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات Gateway / بروتوكول WS / الإقران: أضف `pnpm test:e2e`
- تصحيح أخطاء “روبوتي متوقف” / الإخفاقات الخاصة بالموفّر / استدعاء الأدوات: شغّل `pnpm test:live` مضيّق النطاق

## الاختبارات الحية (التي تلامس الشبكة)

لمصفوفة النماذج الحية، واختبارات الدخان لخلفية CLI، واختبارات الدخان لـ ACP، وحزمة اختبار خادم تطبيق Codex، وكل الاختبارات الحية لموفّري الوسائط (Deepgram، BytePlus، ComfyUI، الصور، الموسيقى، الفيديو، حزمة الوسائط) — بالإضافة إلى التعامل مع بيانات الاعتماد للتشغيلات الحية — راجع [الاختبار — الحزم الحية](/ar/help/testing-live).

## مشغلات Docker (فحوصات "يعمل على Linux" اختيارية)

تنقسم مشغلات Docker هذه إلى مجموعتين:

- مشغلات النماذج الحية: يشغّل `test:docker:live-models` و`test:docker:live-gateway` ملف الاختبار الحي المطابق لمفتاح ملف التعريف فقط داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع وصل دليل الإعدادات المحلي ومساحة العمل لديك (ومصدر `~/.profile` إذا كان موصولًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تضبط مشغلات Docker الحية افتراضيًا حدّ دخان أصغر لكي يبقى المسح الكامل عبر Docker عمليًا:
  يضبط `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويضبط
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة هذه عندما تريد
  صراحةً إجراء المسح الشامل الأكبر.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كأرشيف npm عبر `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة العارية هي فقط مشغّل Node/Git لمسارات التثبيت/التحديث/اعتمادات Plugin؛ وتوصل تلك المسارات الأرشيف المبني مسبقًا. تثبّت الصورة الوظيفية الأرشيف نفسه داخل `/app` لمسارات وظائف التطبيق المبني. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق التخطيط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في فتحات العمليات، بينما تمنع حدود الموارد المسارات الحية الثقيلة، ومسارات تثبيت npm، والمسارات متعددة الخدمات من البدء كلها دفعة واحدة. إذا كان مسار واحد أثقل من الحدود النشطة، يستطيع المجدول مع ذلك بدءه عندما يكون المجمّع فارغًا ثم يبقيه يعمل وحده حتى تتوفر السعة مجددًا. الافتراضيات هي 10 فتحات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما يملك مضيف Docker سعة إضافية. يجري المشغّل فحصًا تمهيديًا لـ Docker افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزّن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون دون بناء Docker أو تشغيله، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة، واحتياجات الحزمة/الصورة، وبيانات الاعتماد.
- `Package Acceptance` هي بوابة الحزمة الأصلية في GitHub لسؤال "هل يعمل هذا الأرشيف القابل للتثبيت كمنتج؟" تحلّ حزمة مرشحة واحدة من `source=npm` أو `source=ref` أو `source=url` أو `source=artifact`، وترفعها باسم `package-under-test`، ثم تشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد ذلك الأرشيف نفسه بدلًا من إعادة حزم المرجع المحدد. يحدد `workflow_ref` سكربتات سير العمل/حزمة الاختبار الموثوقة، بينما يحدد `package_ref` التثبيت/الفرع/الوسم المصدر المراد حزمه عند `source=ref`؛ وهذا يسمح لمنطق القبول الحالي بالتحقق من التثبيتات الموثوقة الأقدم. تُرتّب ملفات التعريف حسب الاتساع: `smoke` هو تثبيت/قناة/وكيل سريع بالإضافة إلى Gateway/الإعدادات، و`package` هو عقد الحزمة/التحديث/Plugin بالإضافة إلى أداة الاختبار keyless upgrade-survivor، ومسار ناجي الترقية من خط الأساس المنشور، والبديل الأصلي الافتراضي لمعظم تغطية حزمة/تحديث Parallels، ويضيف `product` قنوات MCP، وتنظيف cron/الوكيل الفرعي، وبحث OpenAI على الويب، وOpenWebUI، ويشغّل `full` أجزاء Docker الخاصة بمسار الإصدار مع OpenWebUI. بالنسبة إلى `published-upgrade-survivor`، تستخدم Package Acceptance دائمًا `package-under-test` كمرشح و`published_upgrade_survivor_baseline` كخط أساس منشور، مع افتراض `openclaw@latest`؛ قسّم التغطية الأوسع بإرسال تشغيلات متعددة بقيم خط أساس دقيقة. يضبط المسار المنشور خط الأساس الخاص به بوصفة أمر `openclaw config set` مخبوزة، ثم يسجل خطوات الوصفة في ملخص المسار. يشغّل تحقق الإصدار فرق حزمة مخصصًا (`bundled-channel-deps-compat plugins-offline`) بالإضافة إلى QA حزمة Telegram لأن أجزاء Docker الخاصة بمسار الإصدار تغطي بالفعل مسارات الحزمة/التحديث/Plugin المتداخلة. تتضمن أوامر إعادة تشغيل Docker المستهدفة في GitHub والمولدة من المصنوعات أثر الحزمة السابق، ومدخلات الصور المحضّرة، وخط أساس published upgrade-survivor عند توفره، حتى تستطيع المسارات الفاشلة تجنب إعادة بناء الحزمة والصور.
- تشغّل فحوصات البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يجتاز الحارس الرسم البياني المبني الثابت من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا كانت بدء التشغيل قبل الإرسال تستورد اعتماديات الحزمة مثل Commander أو واجهة المطالبات أو undici أو التسجيل قبل إرسال الأمر؛ كما يبقي جزء تشغيل Gateway المضمّن ضمن الميزانية ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة. يغطي دخان CLI المعبأ أيضًا مساعدة الجذر، ومساعدة الإعداد الأولي، ومساعدة الطبيب، والحالة، ومخطط الإعدادات، وأمر قائمة النماذج.
- توافق Package Acceptance القديم محدود عند `2026.4.25` (`2026.4.25-beta.*` مشمول). حتى ذلك الحد، تتسامح حزمة الاختبار فقط مع فجوات بيانات التعريف في الحزم المشحونة: إدخالات مخزون QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات التصحيح في أداة git المستمدة من الأرشيف، وغياب `update.channel` المستمر، ومواقع سجل تثبيت Plugin القديمة، وغياب استمرارية سجل تثبيت السوق، وترحيل بيانات تعريف الإعدادات أثناء `plugins update`. بالنسبة إلى الحزم بعد `2026.4.25`، تكون تلك المسارات إخفاقات صارمة.
- مشغلات دخان الحاويات: يشغّل `test:docker:openwebui`، و`test:docker:onboard`، و`test:docker:npm-onboard-channel-agent`، و`test:docker:update-channel-switch`، و`test:docker:upgrade-survivor`، و`test:docker:published-upgrade-survivor`، و`test:docker:session-runtime-context`، و`test:docker:agents-delete-shared-workspace`، و`test:docker:gateway-network`، و`test:docker:browser-cdp-snapshot`، و`test:docker:mcp-channels`، و`test:docker:pi-bundle-mcp-tools`، و`test:docker:cron-mcp-cleanup`، و`test:docker:plugins`، و`test:docker:plugin-update`، و`test:docker:config-reload` حاوية حقيقية واحدة أو أكثر ويتحقق من مسارات تكامل أعلى مستوى.

تصل مشغلات Docker للنماذج الحية أيضًا بيوت مصادقة CLI اللازمة فقط (أو كل البيوت المدعومة عندما لا يكون التشغيل مضيّقًا)، ثم تنسخها إلى بيت الحاوية قبل التشغيل حتى يستطيع OAuth الخاص بـ CLI خارجي تحديث الرموز دون تعديل مخزن مصادقة المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- فحص دخان ربط ACP: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيًا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- فحص دخان خلفية CLI: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- فحص دخان حاضنة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- فحص دخان قابلية الرصد: `pnpm qa:otel:smoke` هو مسار فحص مصدر خاص بـ QA. وهو غير مضمّن عمدًا في مسارات إصدار Docker للحزمة لأن ملف npm tarball لا يتضمن QA Lab.
- فحص دخان Open WebUI المباشر: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، إنشاء هيكل كامل): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- فحص دخان الإعداد الأولي/القناة/الوكيل لحزمة npm tarball: `pnpm test:docker:npm-onboard-channel-agent` يثبت حزمة OpenClaw tarball المعبأة عالميًا في Docker، ويهيئ OpenAI عبر إعداد أولي باستخدام مرجع بيئة بالإضافة إلى Telegram افتراضيًا، ويتحقق من أن doctor أصلح تبعيات وقت تشغيل Plugin المفعلة، ثم يشغل دورة وكيل OpenAI واحدة بمحاكاة. أعد استخدام ملف tarball مبني مسبقًا باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة بناء المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- فحص دخان تبديل قناة التحديث: `pnpm test:docker:update-channel-switch` يثبت حزمة OpenClaw tarball المعبأة عالميًا في Docker، وينتقل من حزمة `stable` إلى git `dev`، ويتحقق من القناة المحفوظة وعمل Plugin بعد التحديث، ثم يعود إلى حزمة `stable` ويفحص حالة التحديث.
- فحص دخان النجاة من الترقية: `pnpm test:docker:upgrade-survivor` يثبت حزمة OpenClaw tarball المعبأة فوق تثبيت مستخدم قديم غير نظيف يحتوي على وكلاء، وإعدادات قناة، وقوائم سماح Plugin، وحالة قديمة لتبعيات وقت تشغيل Plugin، وملفات مساحة عمل/جلسة موجودة. يشغل تحديث الحزمة بالإضافة إلى doctor غير تفاعلي من دون موفر مباشر أو مفاتيح قنوات، ثم يبدأ Gateway عبر loopback ويفحص الحفاظ على الإعدادات/الحالة بالإضافة إلى حدود ميزانية البدء/الحالة.
- فحص دخان النجاة من الترقية المنشورة: `pnpm test:docker:published-upgrade-survivor` يثبت `openclaw@latest` افتراضيًا، ويزرع ملفات مستخدم واقعية موجودة، ويهيئ ذلك الأساس بوصفة أوامر مدمجة، ويتحقق من الإعداد الناتج، ويحدّث ذلك التثبيت المنشور إلى ملف tarball المرشح، ويشغل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر loopback ويفحص النوايا المهيأة، والحفاظ على الحالة، وبدء التشغيل، وحدود ميزانية الحالة. تجاوز الأساس باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`؛ ويعرض Package Acceptance القيمة نفسها باسم `published_upgrade_survivor_baseline`.
- فحص دخان سياق وقت تشغيل الجلسة: `pnpm test:docker:session-runtime-context` يتحقق من استمرار نص سياق وقت التشغيل المخفي بالإضافة إلى إصلاح doctor لفروع إعادة كتابة المطالبة المتكررة المتأثرة.
- فحص دخان التثبيت العالمي عبر Bun: `bash scripts/e2e/bun-global-install-smoke.sh` يحزم الشجرة الحالية، ويثبتها باستخدام `bun install -g` في مجلد منزلي معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد موفري الصور المضمنين بدلًا من التعليق. أعد استخدام ملف tarball مبني مسبقًا باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ بناء المضيف باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- فحص دخان Docker للمثبت: `bash scripts/test-install-sh-docker.sh` يشارك ذاكرة تخزين npm مؤقت واحدة بين حاويات الجذر والتحديث وdirect-npm. يستخدم فحص دخان التحديث افتراضيًا npm `latest` كأساس مستقر قبل الترقية إلى ملف tarball المرشح. تجاوزه باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` محليًا، أو عبر إدخال `update_baseline_version` في سير عمل Install Smoke على GitHub. تحتفظ فحوصات المثبت لغير الجذر بذاكرة تخزين npm مؤقت معزولة حتى لا تخفي إدخالات الذاكرة المؤقتة المملوكة للجذر سلوك التثبيت المحلي للمستخدم. عيّن `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة التخزين المؤقت للجذر/التحديث/direct-npm عبر عمليات إعادة التشغيل المحلية.
- يتخطى Install Smoke CI التحديث العالمي المكرر عبر direct-npm باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل السكربت محليًا من دون هذا المتغير عندما تكون تغطية `npm install -g` المباشرة مطلوبة.
- فحص دخان CLI لحذف الوكلاء لمساحة عمل مشتركة: `pnpm test:docker:agents-delete-shared-workspace` (السكربت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) يبني صورة Dockerfile الجذرية افتراضيًا، ويزرع وكيلين مع مساحة عمل واحدة في منزل حاوية معزول، ويشغل `agents delete --json`، ويتحقق من JSON صالح بالإضافة إلى سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke باستخدام `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- تشبيك Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- فحص دخان لقطة Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (السكربت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) يبني صورة E2E المصدرية بالإضافة إلى طبقة Chromium، ويبدأ Chromium مع CDP خام، ويشغل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي عناوين URL للروابط، والعناصر القابلة للنقر المرقاة بالمؤشر، ومراجع iframe، وبيانات تعريف الإطار.
- انحدار الحد الأدنى من الاستدلال لـ OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (السكربت: `scripts/e2e/openai-web-search-minimal-docker.sh`) يشغل خادم OpenAI بمحاكاة عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط الموفر ويفحص ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + فحص دخان إطار إشعار Claude خام): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة Pi (خادم MCP حقيقي عبر stdio + فحص دخان السماح/الرفض لملف Pi الشخصي المضمن): `pnpm test:docker:pi-bundle-mcp-tools` (السكربت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف MCP لـ Cron/الوكيل الفرعي (Gateway حقيقي + إنهاء عملية MCP فرعية عبر stdio بعد تشغيلات cron معزولة ووكيل فرعي لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكربت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (فحص دخان التثبيت، تثبيت/إلغاء تثبيت شامل لـ ClawHub، تحديثات السوق، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)
  عيّن `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/وقت التشغيل الشامل الافتراضي باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. من دون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم تثبيت محلي معزول لـ ClawHub.
- فحص دخان تحديث Plugin من دون تغيير: `pnpm test:docker:plugin-update` (السكربت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- فحص دخان بيانات تعريف إعادة تحميل الإعدادات: `pnpm test:docker:config-reload` (السكربت: `scripts/e2e/config-reload-source-docker.sh`)
- تبعيات وقت تشغيل Plugin المضمن: `pnpm test:docker:bundled-channel-deps` يبني صورة تشغيل Docker صغيرة افتراضيًا، ويبني OpenClaw ويحزمه مرة واحدة على المضيف، ثم يثبت ملف tarball هذا في كل سيناريو تثبيت Linux. أعد استخدام الصورة باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`، أو تخطَّ إعادة بناء المضيف بعد بناء محلي حديث باستخدام `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`، أو أشر إلى ملف tarball موجود باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. يحزم التجميع الكامل لـ Docker وشرائح bundled-channel لمسار الإصدار ملف tarball هذا مسبقًا مرة واحدة، ثم يجزئ فحوصات القنوات المضمنة إلى مسارات مستقلة، بما في ذلك مسارات تحديث منفصلة لـ Telegram وDiscord وSlack وFeishu وmemory-lancedb وACPX. تقسم شرائح الإصدار فحوصات دخان القنوات، وأهداف التحديث، وعقود الإعداد/وقت التشغيل إلى `bundled-channels-core` و`bundled-channels-update-a` و`bundled-channels-update-b` و`bundled-channels-contracts`؛ وتظل شريحة التجميع `bundled-channels` متاحة لعمليات إعادة التشغيل اليدوية. يقسم سير عمل الإصدار أيضًا شرائح مثبت الموفر وشرائح تثبيت/إلغاء تثبيت Plugin المضمن؛ وتظل شرائح `package-update` و`plugins-runtime` و`plugins-integrations` القديمة أسماء مستعارة تجميعية لعمليات إعادة التشغيل اليدوية. استخدم `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` لتضييق مصفوفة القنوات عند تشغيل المسار المضمن مباشرة، أو `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` لتضييق سيناريو التحديث. تستخدم تشغيلات Docker لكل سيناريو افتراضيًا `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`؛ ويستخدم سيناريو التحديث متعدد الأهداف افتراضيًا `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. يتحقق المسار أيضًا من أن `channels.<id>.enabled=false` و`plugins.entries.<id>.enabled=false` يمنعان إصلاح doctor/تبعيات وقت التشغيل.
- ضيّق تبعيات وقت تشغيل Plugin المضمن أثناء التكرار بتعطيل السيناريوهات غير ذات الصلة، على سبيل المثال:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

للبناء المسبق وإعادة استخدام الصورة الوظيفية المشتركة يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بكل مجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` صاحبة الأولوية عند تعيينها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكربتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات Docker الخاصة بـ QR والمثبت بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلًا من وقت تشغيل التطبيق المبني المشترك.

تقوم مشغلات Docker للنماذج الحية أيضا بربط checkout الحالي بوضع القراءة فقط
وتجهيزه في دليل عمل مؤقت داخل الحاوية. يحافظ هذا على صورة وقت التشغيل
خفيفة، مع الاستمرار في تشغيل Vitest على المصدر/الإعداد المحلي نفسه لديك.
تتجاوز خطوة التجهيز ذاكرات التخزين المؤقت الكبيرة المحلية فقط ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` المحلية للتطبيقات أو
أدلة مخرجات Gradle، حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ
مصنوعات خاصة بالجهاز.
كما أنها تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات Gateway الحية
عمال قنوات Telegram/Discord/إلخ. حقيقيين داخل الحاوية.
لا يزال `test:docker:live-models` يشغل `pnpm test:live`، لذا مرر
`OPENCLAW_LIVE_GATEWAY_*` أيضا عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
الحية من ذلك مسار Docker.
`test:docker:openwebui` هو فحص توافق أعلى مستوى: يبدأ حاوية Gateway
لـ OpenClaw مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبتة الإصدار مقابل ذلك Gateway، ويسجل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل طلب
دردشة حقيقيا عبر وكيل Open WebUI في `/api/chat/completions`.
قد تكون التشغيلية الأولى أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب صورة
Open WebUI وقد يحتاج Open WebUI إلى إنهاء إعداد بدء التشغيل البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج حي صالحا، ويعد `OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيا) الطريقة الأساسية لتوفيره في التشغيلات المحوسبة بـ Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عمدا ولا يحتاج إلى حساب Telegram أو Discord أو iMessage
حقيقي. يشغل حاوية Gateway مزروعة، ثم يبدأ حاوية ثانية تشغل `openclaw mcp serve`،
ثم يتحقق من اكتشاف المحادثات الموجهة، وقراءات النصوص، وبيانات تعريف المرفقات،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات +
الأذونات بأسلوب Claude عبر جسر MCP الحقيقي عبر stdio. يفحص تحقق الإشعارات
إطارات MCP الخام عبر stdio مباشرة، حتى يتحقق الفحص مما يصدره الجسر فعليا،
وليس فقط مما تصادف أن يعرضه SDK عميل محدد.
`test:docker:pi-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبني صورة Docker للمستودع، ويبدأ خادم فحص MCP حقيقيا عبر stdio
داخل الحاوية، ويمثل ذلك الخادم عبر وقت تشغيل MCP لحزمة Pi المضمنة،
وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان بأدوات
`bundle-mcp` بينما يقوم `minimal` و`tools.deny: ["bundle-mcp"]` بترشيحها.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبدأ Gateway مزروعا مع خادم فحص MCP حقيقي عبر stdio، ويشغل
دورة cron معزولة ودورة ابن لمرة واحدة عبر `/subagents spawn`، ثم يتحقق
من خروج عملية MCP الابنة بعد كل تشغيل.

فحص يدوي لمسار ACP ذي اللغة العادية للخيوط (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لتدفقات عمل الانحدار/التصحيح. قد تكون هناك حاجة إليه مجددا للتحقق من توجيه خيوط ACP، لذا لا تحذفه.

متغيرات بيئة مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) مركب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) مركب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) مركب إلى `/home/node/.profile` ويتم تحميله قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المحملة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعداد/مساحة عمل مؤقتة ومن دون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) مركب إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتا داخل Docker
- يتم تركيب أدلة/ملفات مصادقة CLI الخارجية ضمن `$HOME` بوضع القراءة فقط تحت `/host-auth...`، ثم نسخها إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و`~/.codex/config.toml` و`.claude.json` و`~/.claude/.credentials.json` و`~/.claude/settings.json` و`~/.claude/settings.local.json`
  - تركب تشغيلات المزوّدين المضيقة فقط الأدلة/الملفات المطلوبة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز ذلك يدويا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لترشيح المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لإعادة التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن الملفات الشخصية (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لفحص Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز مطالبة تحقق nonce التي يستخدمها فحص Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI مثبت الإصدار

## سلامة المستندات

شغل فحوصات المستندات بعد تعديلات المستندات: `pnpm check:docs`.
شغل تحقق Mintlify الكامل من المراسي عندما تحتاج أيضا إلى فحوصات عناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه انحدارات "مسار حقيقي" من دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، وGateway حقيقي + حلقة وكيل): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج إعداد Gateway (WS `wizard.start`/`wizard.next`، يكتب الإعداد + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بضعة اختبارات آمنة لـ CI تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء أدوات وهمي عبر Gateway الحقيقي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات معالج إعداد من البداية إلى النهاية تتحقق من توصيل الجلسة وتأثيرات الإعداد (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودا لـ Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تكون Skills مدرجة في المطالبة، هل يختار الوكيل skill الصحيح (أو يتجنب غير ذي الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الدورات تؤكد ترتيب الأدوات، وحمل سجل الجلسة، وحدود sandbox.

ينبغي أن تبقى التقييمات المستقبلية حتمية أولا:

- مشغل سيناريو يستخدم مزوّدين وهميين لتأكيد استدعاءات الأدوات + ترتيبها، وقراءات ملفات skill، وتوصيل الجلسة.
- مجموعة صغيرة من سيناريوهات تركز على skill (استخدام مقابل تجنب، بوابات، حقن المطالبات).
- تقييمات حية اختيارية (تفعيل اختياري، محكومة بالبيئة) فقط بعد وضع المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلين يطابقان
عقد الواجهة الخاص بهما. تمر على كل Plugins المكتشفة وتشغل مجموعة من
تأكيدات الشكل والسلوك. يتجاوز مسار وحدات `pnpm test` الافتراضي عمدا
ملفات الفحص والدخان ومناطق الوصل المشتركة هذه؛ شغل أوامر العقود صراحة
عندما تلمس أسطح القنوات أو المزوّدين المشتركة.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

تقع في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - شكل Plugin الأساسي (المعرف، الاسم، القدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - التعامل مع الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - التعامل مع معرفات الخيوط
- **directory** - API الدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّدين

تقع في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّدين

تقع في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - API كتالوج النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تشغلها

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة أو تعديل قناة أو Plugin مزوّد
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة الانحدارات (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج مكتشفة في التشغيل الحي:

- أضف انحدارا آمنا لـ CI إن أمكن (مزوّد وهمي/بديل، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت بطبيعتها حية فقط (حدود المعدل، سياسات المصادقة)، فاجعل الاختبار الحي ضيقا واختياريا عبر متغيرات البيئة
- فضّل استهداف أصغر طبقة تلتقط العطل:
  - خلل تحويل/إعادة تشغيل طلب المزوّد → اختبار نماذج مباشر
  - خلل مسار جلسة/سجل/أدوات Gateway → فحص حي لـ Gateway أو اختبار Gateway وهمي آمن لـ CI
- حاجز حماية اجتياز SecretRef:
  - يشتق `src/secrets/exec-secret-ref-id-parity.test.ts` هدفا عينة واحدا لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرفات exec ذات مقطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة مع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدا عند معرفات أهداف غير مصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذات صلة

- [اختبار حي](/ar/help/testing-live)
- [CI](/ar/ci)
