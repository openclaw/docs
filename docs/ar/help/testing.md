---
read_when:
    - تشغيل الاختبارات محليًا أو في بيئة التكامل المستمر
    - إضافة اختبارات انحدار لأخطاء النماذج/المزوّدين
    - تصحيح أخطاء سلوك Gateway + سلوك الوكيل
summary: 'مجموعة أدوات الاختبار: مجموعات اختبارات الوحدة وe2e والاختبارات المباشرة، ومشغّلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-05-10T19:44:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4c839e5557ddbe8350a022afa06f2d73b455323d8e3928e1ee1ed8910da76e
    source_path: help/testing.md
    workflow: 16
---

لدى OpenClaw ثلاث مجموعات Vitest ‏(الوحدات/التكامل، e2e، live) ومجموعة صغيرة
من مشغلات Docker. هذا المستند دليل "كيف نختبر":

- ما تغطيه كل مجموعة (وما _لا_ تغطيه عمدًا).
- أي أوامر تشغلها لسير العمل الشائع (محليًا، قبل الدفع، التصحيح).
- كيف تكتشف اختبارات live بيانات الاعتماد وتختار النماذج/المزودين.
- كيف تضيف انحدارات لمشكلات النماذج/المزودين الواقعية.

<Note>
**مكدس QA ‏(qa-lab، qa-channel، مسارات نقل live)** موثق على نحو منفصل:

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) - البنية، سطح الأوامر، تأليف السيناريوهات.
- [QA المصفوفة](/ar/concepts/qa-matrix) - مرجع لـ `pnpm openclaw qa matrix`.
- [قناة QA](/ar/channels/qa-channel) - Plugin النقل الاصطناعي المستخدم في السيناريوهات المدعومة بالمستودع.

تغطي هذه الصفحة تشغيل مجموعات الاختبار العادية ومشغلات Docker/Parallels. يسرد قسم مشغلات QA المحددة أدناه ([مشغلات QA المحددة](#qa-specific-runners)) استدعاءات `qa` الملموسة ويشير مجددًا إلى المراجع أعلاه.
</Note>

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع للمجموعة الكاملة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest المباشرة: `pnpm test:watch`
- الاستهداف المباشر للملفات يوجه الآن مسارات الإضافات/القنوات أيضًا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تكرر العمل على فشل واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA المدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح مزودين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- مجموعة live (النماذج + مجسات أداة/صورة Gateway): `pnpm test:live`
- استهدف ملف live واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- تقارير أداء وقت التشغيل: أرسل `OpenClaw Performance` مع
  `live_gpt54=true` لدورة وكيل `openai/gpt-5.4` حقيقية أو
  `deep_profile=true` لتحف Kova الخاصة بالمعالج/الكومة/التتبع. تنشر التشغيلات اليومية المجدولة
  تحف مسارات المزود الوهمي، والملف العميق، وGPT 5.4 إلى
  `openclaw/clawgrit-reports` عندما يكون `CLAWGRIT_REPORTS_TOKEN` مهيأ. يتضمن
  تقرير المزود الوهمي أيضًا أرقام تمهيد Gateway على مستوى المصدر، والذاكرة،
  وضغط Plugins، وحلقة hello متكررة بنموذج وهمي، وبدء CLI.
- مسح نماذج live في Docker: `pnpm test:docker:live-models`
  - يشغل كل نموذج محدد الآن دورة نصية إضافة إلى مجس صغير بنمط قراءة ملف.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغل أيضًا دورة صورة صغيرة.
    عطّل المجسات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل إخفاقات المزود.
  - تغطية CI: يستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومي و
    `OpenClaw Release Checks` اليدوي سير عمل live/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، والذي يتضمن مهام مصفوفة نماذج live منفصلة في Docker
    مجزأة حسب المزود.
  - لإعادات تشغيل CI المركزة، أرسل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و `live_models_only: true`.
  - أضف أسرار المزودين الجديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    إضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/الخاصة بالإصدار.
- دخان محادثة Codex الأصلية المربوطة: `pnpm test:docker:live-codex-bind`
  - يشغل مسار live في Docker مقابل مسار خادم تطبيق Codex، ويربط رسالة Slack مباشرة اصطناعية
    باستخدام `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من أن ردًا عاديًا ومرفق صورة
    يمران عبر ربط Plugin الأصلي بدلًا من ACP.
- دخان حزمة اختبار خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغل دورات وكيل Gateway عبر حزمة اختبار خادم تطبيق Codex المملوكة للـ Plugin،
    ويتحقق من `/codex status` و `/codex models`، ويمارس افتراضيًا مجسات الصورة،
    وMCP الخاص بـ Cron، والوكيل الفرعي، وGuardian. عطّل مجس الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل إخفاقات أخرى في خادم تطبيق Codex.
    لفحص مركز للوكيل الفرعي، عطّل المجسات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد مجس الوكيل الفرعي ما لم يتم ضبط
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- دخان تثبيت Codex عند الطلب: `pnpm test:docker:codex-on-demand`
  - يثبت أرشيف OpenClaw المحزم في Docker، ويشغل إعداد مفتاح OpenAI API،
    ويتحقق من أن Plugin Codex إضافة إلى اعتمادية `@openai/codex`
    قد نُزلا إلى جذر npm المدار عند الطلب.
- دخان اعتمادية أداة Plugin live: `pnpm test:docker:live-plugin-tool`
  - يحزم Plugin تثبيت مع اعتمادية `slugify` حقيقية، ويثبته عبر
    `npm-pack:`، ويتحقق من الاعتمادية تحت جذر npm المدار، ثم يطلب من
    نموذج OpenAI live استدعاء أداة Plugin وإرجاع slug المخفي.
- دخان أمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري متحفظ لسطح أمر إنقاذ قناة الرسائل.
    يمارس `/crestodian status`، ويضع تغيير نموذج دائم في قائمة الانتظار،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعدادات.
- دخان مخطط Crestodian في Docker: `pnpm test:docker:crestodian-planner`
  - يشغل Crestodian في حاوية بلا إعدادات مع Claude CLI وهمي على `PATH`
    ويتحقق من أن احتياط المخطط التقريبي يترجم إلى كتابة إعدادات مكتوبة ومدققة.
- دخان التشغيل الأول لـ Crestodian في Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من مجلد حالة OpenClaw فارغ، ويوجه `openclaw` المجرد إلى
    Crestodian، ويطبق إعدادات setup/model/agent/Discord plugin + SecretRef،
    ويتحقق من الإعدادات، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضًا في QA Lab عبر
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- دخان تكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغل
  `openclaw models list --provider moonshot --json`، ثم شغل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مع `moonshot/kimi-k2.6`. تحقق من أن JSON يبلغ عن Moonshot/K2.6 وأن
  نص المساعد المخزن يسجل `usage.cost` المعيارية.

<Tip>
عندما تحتاج إلى حالة فاشلة واحدة فقط، فضّل تضييق اختبارات live عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## مشغلات QA المحددة

تقع هذه الأوامر بجانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغل CI ‏QA Lab في سير عمل مخصصة. تكافؤ الوكلاء متداخل تحت
`QA-Lab - All Lanes` والتحقق من الإصدار، وليس سير عمل PR مستقلًا.
ينبغي أن يستخدم التحقق الواسع `Full Release Validation` مع
`rerun_group=qa-parity` أو مجموعة QA لفحوصات الإصدار. تبقي فحوصات الإصدار
المستقرة/الافتراضية نقع live/Docker الشامل خلف `run_release_soak=true`؛ ويفرض
ملف التعريف `full` تشغيل النقع. يعمل `QA-Lab - All Lanes`
ليليًا على `main` ومن الإرسال اليدوي مع مسار التكافؤ الوهمي، ومسار Matrix live،
ومسار Telegram live المدار بـ Convex، ومسار Discord live المدار بـ Convex
كمهام متوازية. تمرر QA المجدولة وفحوصات الإصدار
`--profile fast` إلى Matrix صراحة، بينما يظل الافتراضي لمدخل CLI الخاص بـ Matrix
وسير العمل اليدوي `all`؛ ويمكن للإرسال اليدوي تجزئة `all` إلى مهام `transport`،
و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`. يشغل `OpenClaw Release
Checks` التكافؤ إضافة إلى مساري Matrix السريع وTelegram قبل موافقة الإصدار،
باستخدام `mock-openai/gpt-5.5` لفحوصات نقل الإصدار حتى تبقى
حتمية وتتجنب بدء Plugin المزود العادي. تعطل Gateways النقل live هذه بحث الذاكرة؛
ويبقى سلوك الذاكرة مغطى بمجموعات تكافؤ QA.

تستخدم أجزاء وسائط live للإصدار الكامل
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، والتي تحتوي بالفعل على
`ffmpeg` و`ffprobe`. تستخدم أجزاء نماذج/خلفيات live في Docker صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
تثبيت محدد، ثم تسحبها باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلًا من إعادة البناء
داخل كل جزء.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة بالمستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضياً باستخدام عمال Gateway
    معزولين. يستخدم `qa-channel` التوازي 4 افتراضياً (محدوداً بعدد السيناريوهات
    المحددة). استخدم `--concurrency <count>` لضبط عدد العمال، أو `--concurrency 1`
    للمسار التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد القطع الأثرية دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم مزوّد محلياً مدعوماً بـ AIMock لتغطية تجريبية
    للثوابت وبروتوكولات المحاكاة دون استبدال مسار `mock-openai` الواعي بالسيناريوهات.
- `pnpm test:plugins:kitchen-sink-live`
  - يشغّل اختبار التحمل المباشر لـ OpenAI Kitchen Sink Plugin عبر QA Lab. يثبّت
    حزمة Kitchen Sink الخارجية، ويتحقق من مخزون سطح plugin SDK، ويفحص
    `/healthz` و`/readyz`، ويسجّل أدلة CPU/RSS الخاصة بالـ Gateway، ويشغّل
    دورة OpenAI مباشرة، ويفحص التشخيصات العدائية. يتطلب مصادقة OpenAI مباشرة
    مثل `OPENAI_API_KEY`. في جلسات Testbox المجهزة، يحمّل تلقائياً ملف تعريف
    المصادقة المباشرة الخاص بـ Testbox عند وجود مساعد `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل اختبار بدء تشغيل Gateway إضافة إلى حزمة صغيرة من سيناريوهات QA Lab
    المحاكية (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) ويكتب ملخصاً مدمجاً لملاحظات CPU
    ضمن `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم افتراضياً فقط ملاحظات CPU الساخنة المستمرة (`--cpu-core-warn`
    إضافة إلى `--hot-wall-warn-ms`)، لذلك تُسجّل دفعات بدء التشغيل القصيرة كمقاييس
    دون أن تبدو مثل انحدار تثبيت Gateway المستمر لدقائق.
  - يستخدم قطع `dist` المبنية؛ شغّل بناءً أولاً عندما لا تحتوي نسخة العمل
    بالفعل على مخرجات تشغيل حديثة.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل آلة Linux افتراضية مؤقتة من Multipass.
  - يحافظ على سلوك اختيار السيناريوهات نفسه مثل `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزوّد/النموذج نفسها مثل `qa suite`.
  - تمرّر التشغيلات المباشرة مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد المستندة إلى البيئة، ومسار إعداد مزوّد QA المباشر، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى أدلة الإخراج تحت جذر المستودع حتى يتمكن الضيف من الكتابة عائداً عبر
    مساحة العمل المركّبة.
  - يكتب تقرير QA العادي والملخص إضافة إلى سجلات Multipass ضمن
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA بأسلوب المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني أرشيف npm من نسخة العمل الحالية، ويثبته عالمياً في
    Docker، ويشغّل إعداد OpenAI غير التفاعلي باستخدام مفتاح API، ويضبط Telegram
    افتراضياً، ويتحقق من أن تشغيل plugin المعبأ يحمّل دون إصلاح تبعيات عند بدء
    التشغيل، ويشغّل doctor، ويشغّل دورة وكيل محلية واحدة ضد نقطة نهاية OpenAI
    محاكية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ نفسه
    مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل اختبار Docker حتمياً للتطبيق المبني لنصوص سياق التشغيل المضمنة.
    يتحقق من أن سياق تشغيل OpenClaw المخفي يُحفظ كرسالة مخصصة غير معروضة بدلاً
    من تسريبه إلى دورة المستخدم المرئية، ثم يزرع ملف JSONL لجلسة معطلة متأثرة
    ويتحقق من أن `openclaw doctor --fix` يعيد كتابته إلى الفرع النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبّت حزمة OpenClaw مرشحة في Docker، ويشغّل إعداد الحزمة المثبتة، ويضبط
    Telegram عبر CLI المثبت، ثم يعيد استخدام مسار QA المباشر لـ Telegram مع تلك
    الحزمة المثبتة بصفتها Gateway للنظام قيد الاختبار.
  - يركّب الغلاف مصدر حاضنة `qa-lab` فقط من نسخة العمل؛ تمتلك الحزمة المثبتة
    `dist` و`openclaw/plugin-sdk` وتشغيل plugin المضمن بحيث لا يخلط المسار
    plugins نسخة العمل الحالية داخل الحزمة قيد الاختبار.
  - القيمة الافتراضية هي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛ عيّن
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار أرشيف محلي محلول بدلاً من التثبيت من
    السجل.
  - يستخدم بيانات اعتماد بيئة Telegram نفسها أو مصدر بيانات اعتماد Convex نفسه مثل
    `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، عيّن
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` إضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. إذا كان
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI، يختار غلاف Docker
    Convex تلقائياً.
  - يتحقق الغلاف من بيئة بيانات اعتماد Telegram أو Convex على المضيف قبل
    أعمال بناء/تثبيت Docker. عيّن `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    فقط عند تصحيح إعداد ما قبل بيانات الاعتماد عمداً.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` قيمة
    `OPENCLAW_QA_CREDENTIAL_ROLE` المشتركة لهذا المسار فقط.
  - يعرّض GitHub Actions هذا المسار كسير عمل يدوي للمشرفين باسم
    `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة
    `qa-live-shared` وإيجارات بيانات اعتماد Convex الخاصة بـ CI.
- يعرّض GitHub Actions أيضاً `Package Acceptance` لإثبات منتج جانبي
  ضد حزمة مرشحة واحدة. يقبل مرجعاً موثوقاً، أو مواصفة npm منشورة،
  أو عنوان URL لأرشيف HTTPS إضافة إلى SHA-256، أو قطعة أرشيفية من تشغيل آخر، ويرفع
  `openclaw-current.tgz` المطبع باسم `package-under-test`، ثم يشغّل مجدول
  Docker E2E الحالي بملفات تعريف smoke أو package أو product أو full أو
  مسار مخصص. عيّن `telegram_mode=mock-openai` أو `live-frontier` لتشغيل سير عمل
  Telegram QA ضد قطعة `package-under-test` نفسها.
  - أحدث إثبات منتج beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات عنوان URL الدقيق للأرشيف ملخصاً:

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
  - يحزم ويثبّت بناء OpenClaw الحالي في Docker، ويبدأ Gateway
    مع ضبط OpenAI، ثم يفعّل القناة/الـ plugins المضمنة عبر تعديلات الإعداد.
  - يتحقق من أن اكتشاف الإعداد يترك plugins القابلة للتنزيل وغير المضبوطة غائبة،
    وأن أول إصلاح doctor مضبوط يثبّت كل plugin قابل للتنزيل ومفقود صراحةً،
    وأن إعادة تشغيل ثانية لا تشغّل إصلاح تبعيات مخفياً.
  - يثبّت أيضاً خط أساس npm أقدم معروفاً، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن doctor اللاحق للتحديث في
    المرشح ينظف بقايا تبعيات plugin القديمة دون إصلاح postinstall من جهة الحاضنة.
- `pnpm test:parallels:npm-update`
  - يشغّل اختبار تحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. كل منصة محددة
    تثبّت أولاً حزمة خط الأساس المطلوبة، ثم تشغّل أمر `openclaw update` المثبت
    في الضيف نفسه وتتحقق من الإصدار المثبت، وحالة التحديث، وجاهزية Gateway،
    ودورة وكيل محلية واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux` أثناء
    التكرار على ضيف واحد. استخدم `--json` لمسار قطعة الملخص وحالة كل مسار.
  - يستخدم مسار OpenAI `openai/gpt-5.5` لإثبات دورة الوكيل المباشرة افتراضياً.
    مرّر `--model <provider/model>` أو عيّن `OPENCLAW_PARALLELS_OPENAI_MODEL`
    عند التحقق عمداً من نموذج OpenAI آخر.
  - غلّف التشغيلات المحلية الطويلة بمهلة على المضيف حتى لا تستهلك تعثرات نقل
    Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسارات متداخلة تحت `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي متوقف.
  - يمكن أن يستغرق تحديث Windows من 10 إلى 15 دقيقة في أعمال doctor اللاحقة للتحديث
    وتحديث الحزم على ضيف بارد؛ يظل ذلك سليماً عندما يكون سجل npm debug المتداخل
    يتقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات اختبار Parallels الفردية
    لـ macOS أو Windows أو Linux. فهي تشترك في حالة VM ويمكن أن تتصادم عند
    استعادة اللقطات أو تقديم الحزم أو حالة Gateway في الضيف.
  - يشغّل إثبات ما بعد التحديث سطح plugin المضمن العادي لأن واجهات القدرات
    مثل الكلام، وتوليد الصور، وفهم الوسائط تُحمّل عبر واجهات API تشغيل مدمجة حتى
    عندما تتحقق دورة الوكيل نفسها فقط من استجابة نصية بسيطة.

- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم مزوّد AIMock المحلي لاختبار بروتوكول smoke مباشرة.
- `pnpm openclaw qa matrix`
  - يشغّل مسار Matrix QA المباشر ضد خادم Tuwunel homeserver مؤقت مدعوم بـ Docker. نسخة المصدر فقط - لا تشحن التثبيتات المعبأة `qa-lab`.
  - CLI كامل، وكتالوج الملفات/السيناريوهات، ومتغيرات البيئة، وتخطيط القطع: [Matrix QA](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار Telegram QA المباشر ضد مجموعة خاصة حقيقية باستخدام رموز driver وSUT bot من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرف المجموعة هو معرف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المجمعة المشتركة. استخدم وضع البيئة افتراضياً، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في الإيجارات المجمعة.
  - تغطي القيم الافتراضية canary، وبوابة الإشارات، وعنونة الأوامر، و`/status`، وردود bot-to-bot المذكورة، وردود الأوامر الأصلية الأساسية. تغطي قيم `mock-openai` الافتراضية أيضاً انحدارات سلسلة الردود الحتمية وبث رسالة Telegram النهائية. استخدم `--list-scenarios` للفحوص الاختيارية مثل `session_status`.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما تريد
    القطع الأثرية دون رمز خروج فاشل.
  - يتطلب بوتين متميزين في المجموعة الخاصة نفسها، مع كشف SUT bot لاسم مستخدم Telegram.
  - للمراقبة المستقرة من bot-to-bot، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا البوتين وتأكد من أن driver bot يستطيع مراقبة حركة مرور بوتات المجموعة.
  - يكتب تقرير Telegram QA وملخصاً وقطعة رسائل مرصودة ضمن `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال driver إلى رد SUT المرصود.

`Mantis Telegram Live` هو غلاف أدلة PR حول هذا المسار. يشغّل
مرجع المرشح باستخدام بيانات اعتماد Telegram مؤجرة من Convex، ويعرض نص الرسائل
المرصودة المنقح في متصفح سطح مكتب Crabbox، ويسجل دليل MP4،
وينشئ GIF مقصوصاً حسب الحركة، ويرفع حزمة القطع، وينشر أدلة PR مضمّنة
عبر Mantis GitHub App عند تعيين `pr_number`. يمكن للمشرفين
بدؤه من واجهة Actions عبر `Mantis Scenario` (`scenario_id:
telegram-live`) أو مباشرة من تعليق pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - يستأجر سطح مكتب Linux من Crabbox أو يعيد استخدامه، ويثبت Telegram Desktop الأصلي، ويكوّن OpenClaw باستخدام رمز بوت Telegram SUT مستأجر، ويبدأ Gateway، ويسجل أدلة لقطة شاشة/MP4 من سطح مكتب VNC المرئي.
  - الإعداد الافتراضي هو `--credential-source convex` بحيث لا تحتاج مسارات العمل إلا إلى سر وسيط Convex. استخدم `--credential-source env` مع متغيرات `OPENCLAW_QA_TELEGRAM_*` نفسها مثل `pnpm openclaw qa telegram`.
  - لا يزال Telegram Desktop يحتاج إلى تسجيل دخول/ملف تعريف مستخدم. رمز البوت يكوّن OpenClaw فقط. استخدم `--telegram-profile-archive-env <name>` لأرشيف ملف تعريف `.tgz` بترميز base64، أو استخدم `--keep-lease` وسجل الدخول يدويًا عبر VNC مرة واحدة.
  - يكتب `mantis-telegram-desktop-builder-report.md`، و`mantis-telegram-desktop-builder-summary.json`، و`telegram-desktop-builder.png`، و`telegram-desktop-builder.mp4` ضمن دليل الإخراج.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ توجد مصفوفة التغطية لكل مسار في [نظرة عامة على QA → تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` هي الحزمة الاصطناعية الواسعة وليست جزءًا من تلك المصفوفة.

### بيانات اعتماد Telegram المشتركة عبر Convex (v1)

عند تمكين `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) من أجل
QA النقل الحي، يحصل مختبر QA على إيجار حصري من مجموعة مدعومة بـ Convex، ويرسل Heartbeat لذلك
الإيجار أثناء تشغيل المسار، ويحرر الإيجار عند الإيقاف. يسبق اسم القسم دعم
Discord، وSlack، وWhatsApp؛ عقد الإيجار مشترك عبر الأنواع.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` من أجل `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` من أجل `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - الإعداد الافتراضي للبيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (يكون افتراضيًا `ci` في CI، و`maintainer` بخلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL لـ Convex عبر `http://` لـ loopback للتطوير المحلي فقط.

ينبغي أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` ‏`https://` في التشغيل العادي.

تتطلب أوامر إدارة المشرفين (إضافة/إزالة/سرد المجموعة)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل التشغيلات الحية للتحقق من عنوان URL لموقع Convex، وأسرار الوسيط،
وبادئة نقطة النهاية، ومهلة HTTP، وإمكانية وصول الإدارة/السرد بدون طباعة
قيم الأسرار. استخدم `--json` لإخراج قابل للقراءة آليًا في السكربتات وأدوات
CI.

عقد نقطة النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - نفاد/قابل لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - النجاح: `{ status: "ok", index, data }`
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
  - حاجز الإيجار النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة معرف محادثة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

شكل الحمولة لنوع مستخدم Telegram الحقيقي:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- يجب أن تكون `groupId`، و`testerUserId`، و`telegramApiId` سلاسل رقمية.
- يجب أن تكون `tdlibArchiveSha256` و`desktopTdataArchiveSha256` سلاسل SHA-256 سداسية عشرية.
- يمثل `kind: "telegram-user"` حساب Telegram مؤقتًا واحدًا. تعامل مع الإيجار باعتباره على مستوى الحساب: يستعيد مشغل TDLib CLI والشاهد المرئي في Telegram Desktop من الحمولة نفسها، وينبغي أن تحتفظ مهمة واحدة فقط بالإيجار في كل مرة.

استعادة إيجار مستخدم Telegram الحقيقي:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

استخدم ملف تعريف Desktop المستعاد مع `Telegram -workdir "$tmp/desktop"` عند الحاجة إلى تسجيل مرئي. في بيئات المشغل المحلية، يقرأ `scripts/e2e/telegram-user-credential.ts` الملف `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` افتراضيًا إذا كانت متغيرات بيئة العملية غائبة.

جلسة Crabbox مدارة بواسطة الوكيل:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

يستأجر `start` بيانات اعتماد `telegram-user`، ويستعيد الحساب نفسه إلى
TDLib وTelegram Desktop على سطح مكتب Linux من Crabbox، ويبدأ Gateway SUT
محاكيًا محليًا من نسخة العمل الحالية، ويفتح محادثة Telegram المرئية، ويبدأ
تسجيل سطح المكتب، ويكتب `session.json` خاصًا. أثناء بقاء الجلسة
نشطة، يستطيع الوكيل الاستمرار في الاختبار حتى يقتنع:

- يرسل `send --session <file> --text <message>` عبر مستخدم TDLib الحقيقي وينتظر رد SUT.
- يشغل `run --session <file> -- <remote command>` أمرًا عشوائيًا على Crabbox ويحفظ مخرجاته، على سبيل المثال `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- يلتقط `screenshot --session <file>` سطح المكتب المرئي الحالي.
- يطبع `status --session <file>` الإيجار وأمر WebVNC.
- يوقف `finish --session <file>` المسجل، ويلتقط لقطة الشاشة/الفيديو/آثار قص الحركة، ويحرر بيانات اعتماد Convex، ويوقف عمليات SUT المحلية، ويوقف إيجار Crabbox ما لم يتم تمرير `--keep-box`.
- ينشر `publish --session <file> --pr <number>` تعليق PR يحتوي على GIF فقط افتراضيًا. مرر `--full-artifacts` فقط عندما تكون السجلات أو آثار JSON مطلوبة عمدًا.

لإعادة إنتاج مرئية حتمية، مرر `--mock-response-file <path>` إلى `start`
أو إلى اختصار الأمر الواحد `probe`. يستخدم المشغل افتراضيًا فئة
Crabbox قياسية، وتسجيلًا بمعدل 24 إطارًا في الثانية، ومعاينات GIF للحركة بمعدل 24 إطارًا في الثانية، وعرض GIF
بمقدار 1920 بكسل. تجاوز ذلك باستخدام `--class`، و`--record-fps`، و`--preview-fps`، و
`--preview-width` فقط عندما يحتاج الإثبات إلى إعدادات التقاط مختلفة.

إثبات Crabbox بأمر واحد:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

أمر `probe` الافتراضي هو اختصار لدورة بدء/إرسال/إنهاء واحدة. استخدمه
لاختبار `/status` سريع. استخدم أوامر الجلسة لمراجعة PR،
أو عمل إعادة إنتاج العلل، أو أي حالة يحتاج فيها الوكيل إلى دقائق من التجريب
العشوائي قبل تقرير اكتمال الإثبات. استخدم `--id <cbx_...>` لإعادة
استخدام إيجار سطح مكتب دافئ، و`--keep-box` لإبقاء VNC مفتوحًا بعد الإنهاء،
و`--desktop-chat-title <name>` لاختيار المحادثة المرئية، و`--tdlib-url <tgz>`
عند استخدام أرشيف Linux `libtdjson.so` معد مسبقًا بدلًا من بناء TDLib على
صندوق جديد. يتحقق المشغل من `--tdlib-url` باستخدام `--tdlib-sha256 <hex>` أو،
افتراضيًا، ملف شقيق `<url>.sha256`.

حمولات متعددة القنوات تم التحقق منها بواسطة الوسيط:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

يمكن لمسارات Slack أيضًا الاستئجار من المجموعة، لكن التحقق من حمولة Slack حاليًا
يعيش في مشغل QA الخاص بـ Slack بدلًا من الوسيط. استخدم
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
لصفوف Slack.

### إضافة قناة إلى QA

توجد أسماء البنية ومساعد السيناريو لمهايئات القنوات الجديدة في [نظرة عامة على QA → إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: تنفيذ مشغل النقل على نقطة تماس مضيف `qa-lab` المشتركة، وإعلان `qaRunners` في بيان Plugin، والتركيب كـ `openclaw qa <runner>`، وتأليف السيناريوهات ضمن `qa/scenarios/`.

## حزم الاختبار (ما الذي يعمل وأين)

فكر في الحزم باعتبارها "واقعية متزايدة" (ومعها زيادة في عدم الاستقرار/التكلفة):

### الوحدة / التكامل (افتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم التشغيلات غير المستهدفة مجموعة شظايا `vitest.full-*.config.ts` وقد توسع شظايا المشاريع المتعددة إلى إعدادات لكل مشروع من أجل الجدولة المتوازية
- الملفات: مخزونات الوحدة/النواة ضمن `src/**/*.test.ts`، و`packages/**/*.test.ts`، و`test/**/*.test.ts`؛ تعمل اختبارات وحدة UI في شظية `unit-ui` المخصصة
- النطاق:
  - اختبارات وحدة صرفة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، والتوجيه، والأدوات، والتحليل، والإعداد)
  - انحدارات حتمية للعلل المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - ينبغي أن تكون سريعة ومستقرة
  - يجب أن تثبت اختبارات المحلل ومحمل السطح العام سلوك الرجوع الواسع لـ `api.js` و
    `runtime-api.js` باستخدام تجهيزات Plugin صغيرة مولدة، لا
    واجهات API لمصدر Plugin المجمّع الحقيقي. تنتمي تحميلات API الخاصة بـ Plugin الحقيقي إلى
    حزم العقد/التكامل المملوكة من Plugin.

سياسة الاعتماديات الأصلية:

- تتخطى تثبيتات الاختبار الافتراضية بناءات Discord opus الأصلية الاختيارية. يستخدم استقبال صوت Discord مفكك ترميز `opusscript` الخالص بـ JS، ويبقى `@discordjs/opus` في `ignoredBuiltDependencies` حتى لا تجمع الاختبارات المحلية ومسارات Testbox الملحق الأصلي.
- استخدم مسار أداء صوت Discord مخصصًا أو مسارًا حيًا إذا كنت تحتاج عمدًا إلى مقارنة بناء opus أصلي. لا تضف `@discordjs/opus` مرة أخرى إلى `onlyBuiltDependencies` الافتراضي؛ فهذا يجعل حلقات التثبيت/الاختبار غير ذات الصلة تجمع كودًا أصليًا.

<AccordionGroup>
  <Accordion title="المشاريع، والشظايا، والمسارات محددة النطاق">

    - تشغّل `pnpm test` غير المستهدفة اثني عشر إعداد شريحة أصغر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) بدلاً من عملية مشروع جذر أصلية ضخمة واحدة. يقلل هذا ذروة RSS على الأجهزة المحمّلة، ويتجنب أن يؤدي عمل الرد التلقائي/Plugin إلى حرمان الحِزم غير ذات الصلة من الموارد.
    - لا تزال `pnpm test --watch` تستخدم مخطط مشروع الجذر الأصلي `vitest.config.ts`، لأن حلقة مراقبة متعددة الشرائح ليست عملية.
    - توجّه `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر المسارات محددة النطاق أولاً، لذلك تتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع كلفة بدء تشغيل مشروع الجذر الكامل.
    - توسّع `pnpm test:changed` مسارات git المتغيرة إلى مسارات رخيصة محددة النطاق افتراضياً: تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، والتابعين في مخطط الاستيراد المحلي. لا تؤدي تعديلات الإعداد/التهيئة/الحزمة إلى تشغيل الاختبارات على نطاق واسع إلا إذا استخدمت صراحةً `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هي بوابة الفحص المحلية الذكية المعتادة للعمل الضيق. تصنّف الفروقات إلى core، واختبارات core، وplugins، واختبارات Plugin، والتطبيقات، والمستندات، وبيانات تعريف الإصدار، وأدوات Docker الحية، والأدوات، ثم تشغّل أوامر فحص النوع والlint والحراسة المطابقة. لا تشغّل اختبارات Vitest؛ استدعِ `pnpm test:changed` أو `pnpm test <target>` صريحاً لإثبات الاختبار. تشغّل زيادات الإصدار المحصورة في بيانات تعريف الإصدار فحوصات مستهدفة للإصدار/الإعداد/اعتماد الجذر، مع حارس يرفض تغييرات الحزمة خارج حقل الإصدار في المستوى الأعلى.
    - تشغّل تعديلات حاضنة ACP الحية عبر Docker فحوصات مركزة: صياغة shell لنصوص مصادقة Docker الحية وتشغيلاً تجريبياً جافاً لمجدول Docker الحي. تُضمّن تغييرات `package.json` فقط عندما تكون الفروقات محصورة في `scripts["test:docker:live-*"]`؛ ولا تزال تعديلات الاعتماد والتصدير والإصدار وأسطح الحزمة الأخرى تستخدم الحراسات الأوسع.
    - تمر اختبارات الوحدات خفيفة الاستيراد من agents والأوامر وplugins ومساعدات الرد التلقائي و`plugin-sdk` ومناطق الأدوات النقية المشابهة عبر مسار `unit-fast`، الذي يتجاوز `test/setup-openclaw-runtime.ts`؛ وتبقى الملفات ذات الحالة/الثقيلة وقت التشغيل على المسارات الحالية.
    - تعيّن ملفات مصدر مساعدة محددة من `plugin-sdk` و`commands` أيضاً تشغيلات وضع التغيير إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، لذلك تتجنب تعديلات المساعدات إعادة تشغيل الحزمة الثقيلة الكاملة لذلك الدليل.
    - لدى `auto-reply` حاويات مخصصة لمساعدات core في المستوى الأعلى، واختبارات تكامل `reply.*` في المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. تقسم CI كذلك شجرة الرد الفرعية إلى شرائح agent-runner وdispatch وcommands/state-routing حتى لا تمتلك حاوية ثقيلة الاستيراد واحدة كامل ذيل Node.
    - تتجاوز CI العادية لطلبات PR/main عمداً مسح دفعة Plugin وشريحة `agentic-plugins` الخاصة بالإصدار فقط. يطلق Full Release Validation سير العمل الفرعي المنفصل `Plugin Prerelease` لتلك الحِزم الثقيلة في plugins/Plugin على مرشحي الإصدار.

  </Accordion>

  <Accordion title="تغطية المشغّل المضمّن">

    - عند تغيير مدخلات اكتشاف أداة الرسائل أو سياق وقت تشغيل
      Compaction، حافظ على كلا مستويي التغطية.
    - أضف انحدارات مساعدة مركزة لحدود التوجيه والتطبيع النقية.
    - أبقِ حِزم تكامل المشغّل المضمّن سليمة:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه الحِزم من أن المعرفات محددة النطاق وسلوك Compaction ما زالت تتدفق
      عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ ولا تُعد اختبارات المساعدات فقط
      بديلاً كافياً عن مسارات التكامل هذه.

  </Accordion>

  <Accordion title="تجمع Vitest وافتراضيات العزل">

    - يعتمد إعداد Vitest الأساسي افتراضياً على `threads`.
    - يثبت إعداد Vitest المشترك `isolate: false` ويستخدم المشغّل
      غير المعزول عبر مشاريع الجذر، وe2e، والإعدادات الحية.
    - يحتفظ مسار واجهة المستخدم الجذري بتهيئة `jsdom` والمحسّن الخاصين به، لكنه يعمل
      على المشغّل المشترك غير المعزول أيضاً.
    - ترث كل شريحة `pnpm test` افتراضيات `threads` + `isolate: false`
      نفسها من إعداد Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node الفرعية
      في Vitest افتراضياً لتقليل اضطراب ترجمة V8 أثناء التشغيلات المحلية الكبيرة.
      اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8 القياسي.

  </Accordion>

  <Accordion title="تكرار محلي سريع">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي تُشغّلها الفروقات.
    - خطاف ما قبل الالتزام مخصص للتنسيق فقط. يعيد إدراج الملفات المنسقة
      ولا يشغّل lint أو فحص النوع أو الاختبارات.
    - شغّل `pnpm check:changed` صراحةً قبل التسليم أو الدفع عندما
      تحتاج إلى بوابة الفحص المحلية الذكية.
    - توجّه `pnpm test:changed` عبر مسارات رخيصة محددة النطاق افتراضياً. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر agent
      أن تعديل حاضنة أو إعداد أو حزمة أو عقد يحتاج فعلاً إلى تغطية Vitest أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه
      نفسه، لكن مع حد أعلى للعاملين.
    - التحجيم التلقائي للعاملين المحليين محافظ عمداً ويتراجع
      عندما يكون متوسط حمل المضيف مرتفعاً بالفعل، لذلك تُحدث تشغيلات Vitest
      المتزامنة المتعددة ضرراً أقل افتراضياً.
    - يعلّم إعداد Vitest الأساسي ملفات المشاريع/الإعداد كـ
      `forceRerunTriggers` حتى تبقى إعادة تشغيل وضع التغيير صحيحة عند تغير
      توصيلات الاختبار.
    - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعلاً على المضيفين المدعومين؛
      اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت
      موقع تخزين مؤقت صريحاً واحداً للتحليل المباشر.

  </Accordion>

  <Accordion title="تصحيح أداء">

    - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest إضافةً إلى
      مخرجات تفصيل الاستيراد.
    - يحدد `pnpm test:perf:imports:changed` نطاق عرض التحليل نفسه إلى
      الملفات المتغيرة منذ `origin/main`.
    - تُكتب بيانات توقيت الشرائح إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم تشغيلات الإعداد الكامل مسار الإعداد كمفتاح؛ وتضيف شرائح CI بنمط التضمين
      اسم الشريحة حتى يمكن تتبع الشرائح المرشحة على حدة.
    - عندما يظل اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل،
      أبقِ الاعتمادات الثقيلة خلف حد `*.runtime.ts` محلي ضيق
      وحاكِ ذلك الحد مباشرة بدلاً من الاستيراد العميق لمساعدات وقت التشغيل فقط
      لتمريرها عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` تشغيل
      `test:changed` الموجّه بمسار مشروع الجذر الأصلي لذلك الفرق الملتزم
      ويطبع زمن الجدار إضافة إلى أقصى RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة الحالية
      غير النظيفة عن طريق توجيه قائمة الملفات المتغيرة عبر
      `scripts/test-projects.mjs` وإعداد Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي
      لتكاليف بدء تشغيل Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل لحزمة
      الوحدات مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، مفروض على عامل واحد
- النطاق:
  - يبدأ Gateway حقيقياً عبر loopback مع تمكين التشخيصات افتراضياً
  - يدفع اضطراب رسائل gateway والذاكرة والحمولات الكبيرة الاصطناعي عبر مسار حدث التشخيص
  - يستعلم عن `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات استمرارية حزمة الاستقرار التشخيصية
  - يؤكد أن المسجل يبقى محدوداً، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق قوائم الانتظار لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج إلى مفاتيح
  - مسار ضيق لمتابعة انحدارات الاستقرار، وليس بديلاً عن حزمة Gateway الكاملة

### E2E (اختبار smoke لـ Gateway)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات E2E للـ Plugin المضمنة ضمن `extensions/`
- افتراضيات وقت التشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عاملين تكيفيين (CI: حتى 2، محلياً: 1 افتراضياً).
  - يعمل في الوضع الصامت افتراضياً لتقليل كلفة إدخال/إخراج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العاملين (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تمكين مخرجات وحدة التحكم التفصيلية.
- النطاق:
  - سلوك gateway من طرف إلى طرف ومتعدد النسخ
  - أسطح WebSocket/HTTP، وإقران node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في خط الأنابيب)
  - لا يتطلب مفاتيح حقيقية
  - أجزاء متحركة أكثر من اختبارات الوحدات (قد يكون أبطأ)

### E2E: اختبار smoke لخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ gateway OpenShell معزولاً على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يختبر خلفية OpenShell في OpenClaw عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات القياسي البعيد عبر جسر sandbox fs
- التوقعات:
  - اختياري فقط؛ ليس جزءاً من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محلياً لـ `openshell` إضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمر gateway الاختبار وsandbox
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل حزمة e2e الأوسع يدوياً
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو نص غلاف

### مباشر (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات مباشرة للـ Plugin المضمنة ضمن `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزود/النموذج فعلياً _اليوم_ باستخدام اعتماديات حقيقية؟"
  - التقاط تغييرات تنسيق المزود، وغرائب استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر على CI عمداً (شبكات حقيقية، سياسات مزودين حقيقية، حصص، انقطاعات)
  - يكلف مالاً / يستخدم حدود المعدل
  - يُفضّل تشغيل مجموعات فرعية محددة بدلاً من "كل شيء"
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API المفقودة.
- افتراضياً، لا تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى منزل اختبار مؤقت حتى لا تتمكن تجهيزات الوحدات من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمداً إلى أن تستخدم الاختبارات الحية دليل المنزل الحقيقي لديك.
- يعتمد `pnpm test:live` الآن وضعاً أهدأ افتراضياً: يبقي مخرجات تقدم `[live] ...`، لكنه يكتم إشعار `~/.profile` الإضافي ويسكت سجلات تمهيد gateway/ضجيج Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بالمزود): اضبط `*_API_KEYS` بتنسيق الفواصل/الفواصل المنقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (على سبيل المثال `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو تجاوزاً لكل تشغيل مباشر عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- مخرجات التقدم/Heartbeat:
  - تصدر الحِزم الحية الآن أسطر تقدم إلى stderr حتى تكون استدعاءات المزود الطويلة نشطة بصرياً حتى عندما يكون التقاط وحدة التحكم في Vitest هادئاً.
  - يعطل `vitest.live.config.ts` اعتراض وحدة التحكم في Vitest حتى تتدفق أسطر تقدم المزود/gateway فوراً أثناء التشغيلات الحية.
  - اضبط Heartbeat للنماذج المباشرة باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat للـ gateway/probe باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي حزمة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- منطق التحرير/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكة Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح "روبوتي متوقف" / إخفاقات خاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` مضيّق النطاق

## اختبارات حية (تلامس الشبكة)

لمصفوفة النماذج الحية، وتجارب دخان خلفية CLI، وتجارب دخان ACP، وحزمة اختبار خادم تطبيق Codex، وكل اختبارات مزوّدي الوسائط الحية (Deepgram، BytePlus، ComfyUI، الصورة، الموسيقى، الفيديو، حزمة اختبار الوسائط) - إضافة إلى التعامل مع بيانات الاعتماد للتشغيلات الحية - راجع [اختبار الحزم الحية](/ar/help/testing-live). لقائمة التحقق المخصصة للتحديث والتحقق من Plugin، راجع [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins).

## مشغلات Docker (فحوصات "يعمل في Linux" الاختيارية)

تنقسم مشغلات Docker هذه إلى مجموعتين:

- مشغلات النماذج الحية: يشغّل `test:docker:live-models` و`test:docker:live-gateway` ملفهما الحي المطابق لمفتاح ملف التعريف فقط داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل إعداداتك المحلي ومساحة العمل (ومصدر `~/.profile` إذا كان مركّبًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغلات Docker الحية حد دخان أصغر افتراضيًا حتى يبقى المسح الكامل في Docker عمليًا:
  يضبط `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويضبط
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة هذه عندما تريد
  صراحةً الفحص الشامل الأكبر.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كحزمة npm tarball عبر `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة المجردة هي مشغّل Node/Git فقط لمسارات التثبيت/التحديث/اعتماديات Plugin؛ تركّب هذه المسارات حزمة tarball المبنية مسبقًا. تثبّت الصورة الوظيفية حزمة tarball نفسها في `/app` لمسارات وظائف التطبيق المبني. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في خانات العمليات، بينما تمنع حدود الموارد مسارات الحي الثقيلة، وتثبيت npm، والخدمات المتعددة من البدء كلها في وقت واحد. إذا كان مسار واحد أثقل من الحدود النشطة، يمكن للمجدول مع ذلك بدءه عندما يكون المجمع فارغًا ثم يبقيه يعمل وحده حتى تتوفر السعة مجددًا. القيم الافتراضية هي 10 خانات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما يملك مضيف Docker سعة أكبر. ينفّذ المشغّل فحص Docker تمهيديًا افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون دون بناء أو تشغيل Docker، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة، واحتياجات الحزم/الصور، وبيانات الاعتماد.
- `Package Acceptance` هو بوابة الحزمة الأصلية في GitHub لسؤال "هل تعمل حزمة tarball القابلة للتثبيت هذه كمنتج؟" يحلّ حزمة مرشحة واحدة من `source=npm` أو `source=ref` أو `source=url` أو `source=artifact`، ويرفعها باسم `package-under-test`، ثم يشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد حزمة tarball تلك بالضبط بدلًا من إعادة حزم المرجع المحدد. تُرتّب ملفات التعريف حسب الاتساع: `smoke`، و`package`، و`product`، و`full`. راجع [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins) لعقد الحزمة/التحديث/Plugin، ومصفوفة ناجي الترقية المنشورة، وافتراضات الإصدار، وفرز الإخفاقات.
- تشغّل فحوصات البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يتتبع الحارس الرسم البياني المبني الثابت من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا استورد بدء التشغيل قبل الإرسال اعتماديات حزم مثل Commander، أو واجهة المطالبة، أو undici، أو التسجيل قبل إرسال الأمر؛ كما يبقي جزء تشغيل Gateway المضمّن ضمن الميزانية ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة. يغطي دخان CLI المعبأ أيضًا مساعدة الجذر، ومساعدة onboard، ومساعدة doctor، والحالة، ومخطط الإعدادات، وأمر قائمة النماذج.
- توافق `Package Acceptance` القديم محدود عند `2026.4.25` (بما في ذلك `2026.4.25-beta.*`). حتى ذلك الحد، تتسامح الحزمة الاختبارية فقط مع فجوات بيانات تعريف الحزمة المشحونة: إدخالات مخزون QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات التصحيح في تثبيت git المشتق من حزمة tarball، وغياب `update.channel` المستمر، ومواقع سجل تثبيت Plugin القديمة، وغياب استمرارية سجل تثبيت السوق، وترحيل بيانات تعريف الإعدادات أثناء `plugins update`. للحزم بعد `2026.4.25`، تكون هذه المسارات إخفاقات صارمة.
- مشغلات دخان الحاويات: يشغّل `test:docker:openwebui`، و`test:docker:onboard`، و`test:docker:npm-onboard-channel-agent`، و`test:docker:skill-install`، و`test:docker:update-channel-switch`، و`test:docker:upgrade-survivor`، و`test:docker:published-upgrade-survivor`، و`test:docker:session-runtime-context`، و`test:docker:agents-delete-shared-workspace`، و`test:docker:gateway-network`، و`test:docker:browser-cdp-snapshot`، و`test:docker:mcp-channels`، و`test:docker:pi-bundle-mcp-tools`، و`test:docker:cron-mcp-cleanup`، و`test:docker:plugins`، و`test:docker:plugin-update`، و`test:docker:plugin-lifecycle-matrix`، و`test:docker:config-reload` حاوية حقيقية واحدة أو أكثر ويتحقق من مسارات التكامل الأعلى مستوى.

تركّب مشغلات Docker للنماذج الحية أيضًا أدلة اعتماد CLI المطلوبة فقط (أو كل الأدلة المدعومة عندما لا يكون التشغيل مضيّق النطاق)، ثم تنسخها إلى منزل الحاوية قبل التشغيل حتى يستطيع OAuth الخاص بواجهة CLI الخارجية تحديث الرموز دون تعديل مخزن اعتماد المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- فحص دخاني لربط ACP: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- فحص دخاني لخلفية CLI: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- فحص دخاني لحزمة اختبار خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- فحص دخاني لقابلية الملاحظة: `pnpm qa:otel:smoke` هو مسار خاص لفحص مصدر QA من نسخة العمل. وهو عمدا ليس جزءا من مسارات إصدار Docker للحزمة لأن أرشيف npm يستبعد QA Lab.
- فحص دخاني مباشر لـ Open WebUI: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج التهيئة الأولى (TTY، سقالات كاملة): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- فحص دخاني لتهيئة/قناة/وكيل أرشيف npm: `pnpm test:docker:npm-onboard-channel-agent` يثبت أرشيف OpenClaw المضغوط عالميا داخل Docker، ويضبط OpenAI عبر تهيئة أولية بمرجع بيئي إضافة إلى Telegram افتراضيا، ويشغل doctor، ثم يشغل دورة وكيل OpenAI واحدة بمحاكاة. أعد استخدام أرشيف مبني مسبقا عبر `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخط إعادة بناء المضيف عبر `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة عبر `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` أو `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- فحص دخاني لتثبيت Skill: `pnpm test:docker:skill-install` يثبت أرشيف OpenClaw المضغوط عالميا داخل Docker، ويعطل تثبيتات الأرشيفات المرفوعة في الإعدادات، ويستخرج slug الحالي المباشر لـ Skill من ClawHub عبر البحث، ويثبته باستخدام `openclaw skills install`، ويتحقق من Skill المثبتة إضافة إلى بيانات أصل/قفل `.clawhub`.
- فحص دخاني لتبديل قناة التحديث: `pnpm test:docker:update-channel-switch` يثبت أرشيف OpenClaw المضغوط عالميا داخل Docker، ثم يبدل من حزمة `stable` إلى git `dev`، ويتحقق من القناة المحفوظة وعمل Plugin بعد التحديث، ثم يعود إلى حزمة `stable` ويفحص حالة التحديث.
- فحص دخاني للنجاة من الترقية: `pnpm test:docker:upgrade-survivor` يثبت أرشيف OpenClaw المضغوط فوق تجهيز مستخدم قديم متسخ يحتوي وكلاء، وإعدادات قناة، وقوائم سماح للـ Plugins، وحالة تبعيات Plugin قديمة، وملفات مساحة عمل/جلسة موجودة. يشغل تحديث الحزمة مع doctor غير تفاعلي بدون مفاتيح مزود أو قناة مباشرة، ثم يبدأ Gateway عبر local loopback ويفحص حفظ الإعدادات/الحالة إضافة إلى ميزانيات بدء التشغيل/الحالة.
- فحص دخاني منشور للنجاة من الترقية: `pnpm test:docker:published-upgrade-survivor` يثبت `openclaw@latest` افتراضيا، ويزرع ملفات مستخدم موجود واقعية، ويضبط ذلك الأساس بوصفة أوامر مدمجة، ويتحقق من الإعدادات الناتجة، ويحدث ذلك التثبيت المنشور إلى أرشيف المرشح، ويشغل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway عبر local loopback ويفحص النوايا المضبوطة، وحفظ الحالة، وبدء التشغيل، و`/healthz`، و`/readyz`، وميزانيات حالة RPC. تجاوز أساسا واحدا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، واطلب من المجدول التجميعي توسيع الأساسات المحلية الدقيقة عبر `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`، ووسّع التجهيزات ذات شكل المشكلات عبر `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues`؛ تتضمن مجموعة reported-issues العنصر `configured-plugin-installs` لإصلاح تثبيت Plugin خارجي لـ OpenClaw تلقائيا. يعرّض Package Acceptance هذه القيم باسم `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`، ويفك رموز الأساس الوصفية مثل `last-stable-4` أو `all-since-2026.4.23`، وتوسّع Full Release Validation بوابة حزمة نقع الإصدار إلى `last-stable-4 2026.4.23 2026.5.2 2026.4.15` إضافة إلى `reported-issues`.
- فحص دخاني لسياق وقت تشغيل الجلسة: `pnpm test:docker:session-runtime-context` يتحقق من استمرار نص سياق وقت التشغيل المخفي إضافة إلى إصلاح doctor لفروع إعادة كتابة المطالبة المتأثرة والمكررة.
- فحص دخاني للتثبيت العالمي عبر Bun: `bash scripts/e2e/bun-global-install-smoke.sh` يحزم الشجرة الحالية، ويثبتها باستخدام `bun install -g` في منزل معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد مزودي الصور المضمنين بدلا من التعليق. أعد استخدام أرشيف مبني مسبقا عبر `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخط بناء المضيف عبر `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية عبر `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- فحص دخاني لمثبت Docker: `bash scripts/test-install-sh-docker.sh` يشارك ذاكرة تخزين npm مؤقت واحدة بين حاويات root والتحديث وdirect-npm. يفترض فحص التحديث الدخاني `latest` من npm كخط أساس مستقر قبل الترقية إلى أرشيف المرشح. تجاوزه محليا عبر `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، أو عبر إدخال `update_baseline_version` في سير عمل Install Smoke على GitHub. تحافظ فحوصات المثبت لغير root على ذاكرة تخزين npm مؤقت معزولة حتى لا تخفي إدخالات الذاكرة المؤقتة المملوكة لـ root سلوك التثبيت المحلي للمستخدم. اضبط `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة التخزين المؤقت root/update/direct-npm عبر الإعادات المحلية.
- يتخطى Install Smoke CI تحديث direct-npm العالمي المكرر عبر `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغل السكربت محليا بدون ذلك المتغير البيئي عندما تكون تغطية `npm install -g` المباشرة مطلوبة.
- فحص دخاني لـ CLI لحذف الوكلاء مساحة عمل مشتركة: `pnpm test:docker:agents-delete-shared-workspace` (السكربت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) يبني صورة Dockerfile الجذرية افتراضيا، ويزرع وكيلين مع مساحة عمل واحدة في منزل حاوية معزول، ويشغل `agents delete --json`، ويتحقق من JSON صالح إضافة إلى سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke عبر `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكة Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- فحص دخاني للقطات Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (السكربت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) يبني صورة E2E المصدر إضافة إلى طبقة Chromium، ويبدأ Chromium مع CDP خام، ويشغل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي عناوين URL للروابط، والعناصر القابلة للنقر المرفوعة بالمؤشر، ومراجع iframe، وبيانات الإطار الوصفية.
- ارتداد الحد الأدنى من الاستدلال لـ OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (السكربت: `scripts/e2e/openai-web-search-minimal-docker.sh`) يشغل خادم OpenAI بمحاكاة عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط المزود ويتحقق من ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + فحص دخاني خام لإطار إشعار Claude): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة Pi (خادم MCP حقيقي عبر stdio + فحص دخاني للسماح/المنع في ملف Pi الشخصي المضمن): `pnpm test:docker:pi-bundle-mcp-tools` (السكربت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف MCP لـ Cron/الوكيل الفرعي (Gateway حقيقي + تفكيك ابن MCP عبر stdio بعد تشغيلات Cron معزولة ووكيل فرعي لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكربت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (فحص دخاني للتثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git متحركة، وClawHub شامل، وتحديثات السوق، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)
  اضبط `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/وقت التشغيل الشامل الافتراضي عبر `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم تجهيز ClawHub محليا محكما.
- فحص دخاني للتحديث غير المتغير لـ Plugin: `pnpm test:docker:plugin-update` (السكربت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- فحص دخاني لمصفوفة دورة حياة Plugin: `pnpm test:docker:plugin-lifecycle-matrix` يثبت أرشيف OpenClaw المضغوط في حاوية مجردة، ويثبت Plugin من npm، ويبدل التمكين/التعطيل، ويرقيه ويخفضه عبر سجل npm محلي، ويحذف الكود المثبت، ثم يتحقق من أن إلغاء التثبيت ما زال يزيل الحالة القديمة مع تسجيل مقاييس RSS/CPU لكل مرحلة من دورة الحياة.
- فحص دخاني لبيانات إعادة تحميل الإعدادات الوصفية: `pnpm test:docker:config-reload` (السكربت: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: يغطي `pnpm test:docker:plugins` فحصا دخانيا للتثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git متحركة، وتجهيزات ClawHub، وتحديثات السوق، وتمكين/فحص حزمة Claude. يغطي `pnpm test:docker:plugin-update` سلوك التحديث غير المتغير للـ Plugins المثبتة. يغطي `pnpm test:docker:plugin-lifecycle-matrix` تثبيت Plugin من npm مع تتبع الموارد، وتمكينه، وتعطيله، وترقيته، وتخفيضه، وإلغاء تثبيت الكود المفقود.

للبناء المسبق وإعادة استخدام الصورة الوظيفية المشتركة يدويا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بالحزم، مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`، ذات أولوية عند ضبطها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكربتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات QR ومثبت Docker بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت لا من وقت تشغيل التطبيق المبني المشترك.

تشغّل مشغّلات Docker للنماذج الحية أيضًا عملية bind-mount للنسخة الحالية للقراءة فقط وتهيئها في workdir مؤقت داخل الحاوية. يحافظ هذا على صورة التشغيل نحيفة مع الاستمرار في تشغيل Vitest ضد مصدر/تكوينك المحلي الدقيق.
تتخطى خطوة التهيئة ذاكرات التخزين المؤقت الكبيرة المحلية فقط ومخرجات بناء التطبيق مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` المحلية للتطبيق أو مخرجات
Gradle حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ آثار خاصة بالجهاز.
كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ اختبارات Gateway الحية عمال قنوات Telegram/Discord/إلخ. الحقيقية داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر
`OPENCLAW_LIVE_GATEWAY_*` أيضًا عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway الحية من مسار Docker ذلك.
`test:docker:openwebui` هو اختبار توافق smoke أعلى مستوى: يبدأ حاوية Gateway من OpenClaw مع تمكين نقاط نهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبتة على إصدار محدد مقابل ذلك Gateway، ويسجل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وكيل `/api/chat/completions` في Open WebUI.
اضبط `OPENWEBUI_SMOKE_MODE=models` لفحوص CI الخاصة بمسار الإصدار التي يجب أن تتوقف
بعد تسجيل الدخول إلى Open WebUI واكتشاف النموذج، من دون انتظار اكتمال نموذج حي.
قد تكون أول تشغيل noticeably أبطأ لأن Docker قد يحتاج إلى سحب صورة
Open WebUI وقد يحتاج Open WebUI إلى إنهاء إعداد بدء التشغيل البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج حي قابلًا للاستخدام، و`OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيًا) هو الطريقة الأساسية لتوفيره في التشغيلات المعبأة بـ Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عمدًا ولا يحتاج إلى حساب
Telegram أو Discord أو iMessage حقيقي. يشغّل حاوية Gateway مبذّرة،
ويبدأ حاوية ثانية تُطلق `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءات النصوص، وبيانات تعريف المرفقات،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة +
الأذونات بنمط Claude عبر جسر stdio MCP الحقيقي. يفحص اختبار الإشعارات
إطارات stdio MCP الخام مباشرة حتى يتحقق اختبار smoke مما يرسله
الجسر فعليًا، وليس فقط ما يَعرضه SDK عميل محدد بالصدفة.
`test:docker:pi-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبني صورة Docker الخاصة بالمستودع، ويبدأ خادم اختبار stdio MCP حقيقيًا
داخل الحاوية، ويجسّد ذلك الخادم عبر Runtime MCP المضمن في حزمة Pi،
وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان
بأدوات `bundle-mcp` بينما تقوم `minimal` و`tools.deny: ["bundle-mcp"]` بترشيحها.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبدأ Gateway مبذّرًا مع خادم اختبار stdio MCP حقيقي، ويشغّل
دورة cron معزولة ودورة فرعية لمرة واحدة عبر `/subagents spawn`، ثم يتحقق
من خروج عملية MCP الفرعية بعد كل تشغيل.

اختبار smoke يدوي لسلسلة ACP بلغة عادية (ليس ضمن CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لتدفقات عمل الانحدار/التصحيح. قد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه سلاسل ACP، لذا لا تحذفه.

متغيرات بيئة مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) مركّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) مركّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) مركّب إلى `/home/node/.profile` ويتم تحميله قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المحمّلة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة تكوين/مساحة عمل مؤقتة ومن دون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) مركّب إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية ضمن `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - تشغيلات المزوّدين المضيّقة تركّب فقط الأدلة/الملفات اللازمة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لترشيح المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لإعادة التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن الملف الشخصي (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لاختبار smoke الخاص بـ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز مطالبة فحص nonce المستخدمة بواسطة اختبار smoke الخاص بـ Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## سلامة التوثيق

شغّل فحوص التوثيق بعد تعديلات التوثيق: `pnpm check:docs`.
شغّل تحقق Mintlify الكامل من anchors عندما تحتاج إلى فحوص عناوين داخل الصفحة أيضًا: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه انحدارات "خط أنابيب حقيقي" من دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة عامل): `src/gateway/gateway.test.ts` (الحالة: "يشغّل استدعاء أداة OpenAI وهميًا من البداية إلى النهاية عبر حلقة عامل Gateway")
- معالج Gateway (WS `wizard.start`/`wizard.next`، يكتب التكوين + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "يشغّل المعالج عبر ws ويكتب تكوين رمز المصادقة")

## تقييمات موثوقية العامل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية العامل":

- استدعاء أدوات وهمي عبر Gateway الحقيقي + حلقة العامل (`src/gateway/gateway.test.ts`).
- تدفقات معالج من البداية إلى النهاية تتحقق من توصيل الجلسة وتأثيرات التكوين (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودًا لـ Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُسرد Skills في المطالبة، هل يختار العامل Skill الصحيحة (أو يتجنب غير الملائمة)؟
- **الامتثال:** هل يقرأ العامل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تؤكد ترتيب الأدوات، واستمرار سجل الجلسة، وحدود sandbox.

ينبغي أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريو يستخدم مزوّدين وهميين لتأكيد استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وتوصيل الجلسة.
- مجموعة صغيرة من السيناريوهات المركزة على Skill (استخدام مقابل تجنب، بوابات، حقن المطالبات).
- تقييمات حية اختيارية (اختيارية ومقيّدة بمتغيرات البيئة) فقط بعد توفر المجموعة الآمنة لـ CI.

## اختبارات العقد (شكل Plugin والقناة)

تتحقق اختبارات العقد من أن كل Plugin وقناة مسجلة يلتزمان بعقد
الواجهة الخاص بهما. تتكرر على كل plugins المكتشفة وتشغّل مجموعة من
تأكيدات الشكل والسلوك. يتخطى مسار وحدات `pnpm test` الافتراضي عمدًا
ملفات الوصلات المشتركة وsmoke هذه؛ شغّل أوامر العقد صراحة
عندما تلمس أسطح القنوات أو المزوّدين المشتركة.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

موجودة في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - شكل Plugin الأساسي (id، الاسم، الإمكانات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرف سلسلة الرسائل
- **directory** - واجهة API للدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

موجودة في `src/plugins/contracts/*.contract.test.ts`.

- **status** - اختبارات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّد

موجودة في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة API لفهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - Runtime المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تُشغَّل

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة أو تعديل قناة أو provider plugin
- بعد إعادة هيكلة تسجيل أو اكتشاف plugin

تعمل اختبارات العقد في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة الانحدارات (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج اكتُشفت في التشغيل الحي:

- أضف انحدارًا آمنًا لـ CI إن أمكن (مزوّد mock/stub، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت بطبيعتها حية فقط (حدود المعدل، سياسات المصادقة)، فاجعل الاختبار الحي ضيقًا واختياريًا عبر متغيرات البيئة
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ تحويل/إعادة تشغيل طلب المزوّد → اختبار نماذج مباشر
  - خطأ جلسة/سجل/خط أنابيب أدوات Gateway → اختبار smoke حي لـ Gateway أو اختبار mock آمن لـ CI لـ Gateway
- حاجز حماية اجتياز SecretRef:
  - يستخرج `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا واحدًا مأخوذًا كعينة لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرفات exec التي تحتوي على مقاطع اجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة بـ `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند معرفات الأهداف غير المصنّفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذات صلة

- [اختبار الحي](/ar/help/testing-live)
- [اختبار التحديثات وplugins](/ar/help/testing-updates-plugins)
- [CI](/ar/ci)
