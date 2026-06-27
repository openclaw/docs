---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النموذج/المزوّد
    - تصحيح أخطاء سلوك Gateway والوكيل
summary: 'مجموعة الاختبار: مجموعات اختبارات الوحدة وe2e والمباشرة، ومشغلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-06-27T17:47:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

لدى OpenClaw ثلاث مجموعات Vitest (وحدات/تكامل، e2e، مباشرة) ومجموعة صغيرة
من مشغلات Docker. هذا المستند دليل "كيف نختبر":

- ما تغطيه كل مجموعة (وما لا تغطيه عمدًا).
- الأوامر التي يجب تشغيلها لمسارات العمل الشائعة (محليًا، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات المباشرة بيانات الاعتماد وتحدد النماذج/الموفرين.
- كيف تضيف اختبارات انحدار لمشكلات النماذج/الموفرين الواقعية.

<Note>
**مكدس QA (qa-lab، qa-channel، مسارات النقل المباشر)** موثق على نحو منفصل:

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) - البنية، سطح الأوامر، تأليف السيناريوهات.
- [Matrix QA](/ar/concepts/qa-matrix) - مرجع لـ `pnpm openclaw qa matrix`.
- [بطاقة تقييم النضج](/ar/maturity/scorecard) - كيف تدعم أدلة QA للإصدار قرارات الاستقرار وLTS.
- [قناة QA](/ar/channels/qa-channel) - Plugin النقل الاصطناعي المستخدم في السيناريوهات المدعومة بالمستودع.

تغطي هذه الصفحة تشغيل مجموعات الاختبار العادية ومشغلات Docker/Parallels. يسرد قسم المشغلات الخاصة بـ QA أدناه ([المشغلات الخاصة بـ QA](#qa-specific-runners)) استدعاءات `qa` الملموسة ويشير مجددًا إلى المراجع أعلاه.
</Note>

## البدء السريع

في معظم الأيام:

- بوابة كاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع لمجموعة الاختبارات الكاملة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- أصبح استهداف الملفات المباشر يوجه مسارات الإضافات/القنوات أيضًا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات الموجهة أولًا عندما تكرر العمل على فشل واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA المدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تعدل الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

## أدلة الاختبار المؤقتة

فضّل المساعدات المشتركة في `test/helpers/temp-dir.ts` للأدلة المؤقتة
المملوكة للاختبار. فهي تجعل الملكية صريحة وتحافظ على التنظيف ضمن دورة حياة
الاختبار نفسها:

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

استخدم `makeTempDir(tempDirs, prefix)` و`cleanupTempDirs(tempDirs)` عندما يكون الاختبار
يمتلك بالفعل مصفوفة أو مجموعة من المسارات. تجنب استدعاءات `fs.mkdtemp*` العارية الجديدة في
الاختبارات إلا إذا كانت حالة ما تتحقق صراحة من سلوك الدليل المؤقت الخام. أضف
تعليق سماح قابلًا للتدقيق مع سبب ملموس عندما يحتاج اختبار عمدًا إلى
دليل مؤقت عارٍ:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

لإتاحة رؤية الهجرة، يبلغ `node scripts/report-test-temp-creations.mjs` عن
إنشاء أدلة مؤقتة عارية جديدة في أسطر الفروقات المضافة من دون حظر أنماط التنظيف
الحالية. يتبع نطاق ملفه عمدًا تصنيف مسارات الاختبار نفسه
المستخدم بواسطة `scripts/changed-lanes.mjs` بدلًا من الحفاظ على حدس مستقل
لأسماء ملفات مساعدات الاختبار، مع تخطي تنفيذ المساعد المشترك نفسه.
يشغل `check:changed` هذا التقرير لمسارات الاختبارات المتغيرة كإشارة CI
تحذيرية فقط؛ النتائج هي تعليقات تحذير GitHub، وليست حالات فشل.

عند تصحيح موفرين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة المباشرة (نماذج + Gateway وأدوات/مجسات صور): `pnpm test:live`
- استهداف ملف مباشر واحد بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- تقارير أداء وقت التشغيل: أطلق `OpenClaw Performance` مع
  `live_openai_candidate=true` لدورة وكيل `openai/gpt-5.5` حقيقية أو
  `deep_profile=true` لآثار Kova الخاصة بالمعالج/الذاكرة/التتبع. تنشر التشغيلات اليومية المجدولة
  آثار مسار mock-provider وdeep-profile وGPT 5.5 إلى
  `openclaw/clawgrit-reports` عندما يكون `CLAWGRIT_REPORTS_TOKEN` مضبوطًا. يتضمن
  تقرير mock-provider أيضًا أرقام إقلاع Gateway على مستوى المصدر، والذاكرة،
  وضغط Plugin، وحلقة hello-loop متكررة بنموذج وهمي، وبدء تشغيل CLI.
- مسح النماذج المباشر عبر Docker: `pnpm test:docker:live-models`
  - يشغل كل نموذج محدد الآن دورة نصية إضافة إلى مجس صغير بأسلوب قراءة ملف.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغل أيضًا دورة صورة صغيرة.
    عطّل المجسات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل أعطال الموفر.
  - تغطية CI: يستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومي و
    `OpenClaw Release Checks` اليدوي سير العمل المباشر/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، وهذا يتضمن وظائف مصفوفة Docker مباشرة منفصلة
    للنماذج مقسمة حسب الموفر.
  - لإعادات تشغيل CI المركزة، أطلق `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و`live_models_only: true`.
  - أضف أسرار الموفرين الجديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    إضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/الخاصة بالإصدار.
- اختبار دخان محادثة مربوطة أصليًا بـ Codex: `pnpm test:docker:live-codex-bind`
  - يشغل مسار Docker مباشرًا ضد مسار خادم تطبيق Codex، ويربط رسالة Slack DM اصطناعية
    باستخدام `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من مرور رد عادي ومرفق صورة
    عبر ربط Plugin الأصلي بدلًا من ACP.
- اختبار دخان حزمة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغل دورات وكيل Gateway عبر حزمة خادم تطبيق Codex المملوكة لـ Plugin،
    ويتحقق من `/codex status` و`/codex models`، ويمارس افتراضيًا مجسات الصورة
    وcron MCP والوكيل الفرعي وGuardian. عطّل مجس الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل أعطال أخرى في
    خادم تطبيق Codex. لفحص وكيل فرعي مركز، عطّل المجسات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد مجس الوكيل الفرعي إلا إذا كان
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` مضبوطًا.
- اختبار دخان تثبيت Codex عند الطلب: `pnpm test:docker:codex-on-demand`
  - يثبت حزمة tarball المعبأة لـ OpenClaw في Docker، ويشغل إعداد OpenAI بمفتاح API،
    ويتحقق من أن Plugin Codex واعتماد `@openai/codex`
    قد نُزّلا عند الطلب إلى جذر مشروع npm المُدار.
- اختبار دخان اعتماد أداة Plugin مباشر: `pnpm test:docker:live-plugin-tool`
  - يحزم Plugin تجريبيًا مع اعتماد `slugify` حقيقي، ويثبته عبر
    `npm-pack:`، ويتحقق من الاعتماد تحت جذر مشروع npm المُدار،
    ثم يطلب من نموذج OpenAI مباشر استدعاء أداة Plugin وإرجاع
    slug المخفي.
- اختبار دخان أمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري احتياطي لسطح أمر إنقاذ قناة الرسائل.
    يمارس `/crestodian status`، ويضع تغيير نموذج دائمًا في الطابور،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعدادات.
- اختبار دخان مخطط Crestodian عبر Docker: `pnpm test:docker:crestodian-planner`
  - يشغل Crestodian في حاوية بلا إعدادات مع Claude CLI وهمي على `PATH`
    ويتحقق من أن تراجع المخطط التقريبي يترجم إلى كتابة إعدادات typed مدققة.
- اختبار دخان التشغيل الأول لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من دليل حالة OpenClaw فارغ، ويتحقق من نقطة دخول Crestodian الحديثة أثناء الإعداد،
    ويطبق كتابات الإعداد/النموذج/الوكيل/Plugin Discord + SecretRef،
    ويتحقق من الإعدادات، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضًا في QA Lab بواسطة
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- اختبار دخان تكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مع `moonshot/kimi-k2.6`. تحقق من أن JSON يبلغ عن Moonshot/K2.6 وأن
  نص المساعد يخزن `usage.cost` المطبّعة.

<Tip>
عندما تحتاج إلى حالة فاشلة واحدة فقط، فضّل تضييق الاختبارات المباشرة عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## المشغلات الخاصة بـ QA

تقع هذه الأوامر بجانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغل CI مختبر QA في سير عمل مخصصة. يتم تضمين التكافؤ الوكيلي تحت
`QA-Lab - All Lanes` والتحقق من الإصدار، وليس كسير عمل PR مستقل.
يجب أن يستخدم التحقق الواسع `Full Release Validation` مع
`rerun_group=qa-parity` أو مجموعة QA لفحوصات الإصدار. تبقي فحوصات الإصدار
المستقرة/الافتراضية اختبارات النقع المباشرة/Docker الشاملة خلف `run_release_soak=true`؛ أما
ملف التعريف `full` فيفرض تشغيل النقع. يعمل `QA-Lab - All Lanes`
ليليًا على `main` ومن الإطلاق اليدوي مع مسار تكافؤ وهمي، ومسار Matrix مباشر،
ومسار Telegram مباشر مُدار من Convex، ومسار Discord مباشر مُدار من Convex
كوظائف متوازية. تمرر QA المجدولة وفحوصات الإصدار إلى Matrix
`--profile fast` صراحة، بينما يبقى إدخال Matrix CLI وسير العمل اليدوي
الافتراضي `all`؛ يمكن للإطلاق اليدوي تقسيم `all` إلى وظائف `transport`
و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`. يشغل `OpenClaw Release
Checks` التكافؤ إضافة إلى مسارات Matrix السريعة وTelegram قبل موافقة الإصدار،
باستخدام `mock-openai/gpt-5.5` لفحوصات نقل الإصدار حتى تبقى
حتمية وتتجنب بدء تشغيل Plugin الموفر العادي. تعطل Gateways النقل المباشر هذه
البحث في الذاكرة؛ ويبقى سلوك الذاكرة مغطى بواسطة مجموعات تكافؤ QA.

تستخدم أجزاء وسائط الإصدار المباشر الكامل
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، والذي يحتوي بالفعل على
`ffmpeg` و`ffprobe`. تستخدم أجزاء نماذج/خلفيات Docker المباشرة صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
التزام محدد، ثم تسحبها مع `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلًا من إعادة البناء
داخل كل جزء.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة بالمستودع مباشرة على المضيف.
  - يكتب آثار `qa-evidence.json` و`qa-suite-summary.json` و
    `qa-suite-report.md` ذات المستوى الأعلى لمجموعة السيناريوهات المحددة، بما في ذلك
    اختيارات سيناريوهات التدفق المختلط وVitest وPlaywright.
  - عند تشغيله عبر `pnpm openclaw qa run --qa-profile <profile>`، يضمّن
    بطاقة نتائج ملف التصنيف المحدد في `qa-evidence.json` نفسه.
    يكتب `smoke-ci` أدلة مختصرة، ما يضبط `evidenceMode: "slim"` ويحذف
    `execution` لكل إدخال. يغطي `release` الشريحة المنسقة لجاهزية الإصدار؛
    ويحدد `all` كل فئة نضج نشطة، وهو مخصص لتشغيلات سير عمل
    QA Profile Evidence الصريحة عندما تكون هناك حاجة إلى أثر بطاقة نتائج كاملة.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضياً مع عمال
    Gateway معزولين. يستخدم `qa-channel` افتراضياً تزامناً قدره 4 (محدوداً بعدد
    السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد العمال،
    أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد الآثار دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادماً محلياً لمزوّد مدعوم بـ AIMock لتغطية تجريبية
    للتركيبات ومحاكاة البروتوكول دون استبدال مسار `mock-openai` الواعي بالسيناريو.
- `pnpm openclaw qa coverage --match <query>`
  - يبحث في معرّفات السيناريوهات، والعناوين، والأسطح، ومعرّفات التغطية، ومراجع الوثائق، ومراجع الكود،
    والـ plugins، ومتطلبات المزوّدين، ثم يطبع أهداف المجموعة المطابقة.
  - استخدم هذا قبل تشغيل QA Lab عندما تعرف السلوك أو مسار الملف المتأثر
    لكنك لا تعرف أصغر سيناريو. هو إرشادي فقط؛ ما زال عليك اختيار إثبات المحاكاة،
    أو المباشر، أو Multipass، أو Matrix، أو النقل من السلوك الذي يجري تغييره.
- `pnpm test:plugins:kitchen-sink-live`
  - يشغّل اختبار الإجهاد المباشر لـ OpenAI Kitchen Sink plugin عبر QA Lab. يقوم
    بتثبيت حزمة Kitchen Sink الخارجية، والتحقق من مخزون سطح plugin SDK،
    وفحص `/healthz` و`/readyz`، وتسجيل أدلة CPU/RSS الخاصة بالـ Gateway،
    وتشغيل دورة OpenAI مباشرة، والتحقق من التشخيصات العدائية.
    يتطلب مصادقة OpenAI مباشرة مثل `OPENAI_API_KEY`. في جلسات Testbox
    المهيأة، يستورد تلقائياً ملف مصادقة Testbox المباشر عندما يكون مساعد
    `openclaw-testbox-env` موجوداً.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل اختبار بدء تشغيل Gateway إضافة إلى حزمة صغيرة من سيناريوهات QA Lab المحاكية
    (`channel-chat-baseline` و`memory-failure-fallback` و
    `gateway-restart-inflight-run`) ويكتب ملخص مراقبة CPU مدمجاً
    تحت `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم افتراضياً ملاحظات CPU الساخنة المستمرة فقط (`--cpu-core-warn`
    مع `--hot-wall-warn-ms`)، لذا تُسجل دفعات بدء التشغيل القصيرة كمقاييس
    دون أن تبدو مثل انحدار تثبيت Gateway الممتد لدقائق.
  - يستخدم آثار `dist` المبنية؛ شغّل البناء أولاً عندما لا يحتوي checkout
    بالفعل على مخرجات تشغيل حديثة.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل VM مؤقت يعمل بنظام Linux عبر Multipass.
  - يحافظ على سلوك اختيار السيناريو نفسه كما في `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزوّد/النموذج نفسها كما في `qa suite`.
  - تمرّر التشغيلات المباشرة مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد القائمة على env، ومسار إعداد مزوّد QA المباشر، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى أدلة الإخراج تحت جذر المستودع حتى يتمكن الضيف من الكتابة مرة أخرى عبر
    مساحة العمل المركبة.
  - يكتب تقرير QA والملخص العاديين إضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لعمل QA بأسلوب المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني tarball لـ npm من checkout الحالي، ويثبته عالمياً في
    Docker، ويشغّل إعداد OpenAI API-key غير التفاعلي، ويضبط Telegram
    افتراضياً، ويتحقق من أن runtime الخاص بالـ plugin المعبأ يُحمّل دون إصلاح
    تبعيات بدء التشغيل، ويشغّل doctor، ويشغّل دورة agent محلية واحدة ضد
    نقطة نهاية OpenAI محاكية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار packaged-install
    نفسه مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل smoke حتمياً لتطبيق مبني داخل Docker لنصوص سياق runtime المضمنة.
    يتحقق من أن سياق runtime المخفي لـ OpenClaw يُحفظ كرسالة مخصصة غير معروضة
    بدلاً من التسرب إلى دورة المستخدم المرئية، ثم يزرع session JSONL مكسوراً متأثراً ويتحقق من أن
    `openclaw doctor --fix` يعيد كتابته إلى الفرع النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبت حزمة OpenClaw مرشحة في Docker، ويشغّل إعداد الحزمة المثبتة،
    ويضبط Telegram عبر CLI المثبت، ثم يعيد استخدام مسار QA المباشر لـ Telegram
    مع تلك الحزمة المثبتة باعتبارها SUT Gateway.
  - يركّب الغلاف مصدر harness الخاص بـ `qa-lab` فقط من checkout؛ وتتولى
    الحزمة المثبتة ملكية `dist` و`openclaw/plugin-sdk` وruntime الخاص بالـ plugin
    المجمّع، بحيث لا يخلط المسار plugins من checkout الحالي داخل الحزمة
    قيد الاختبار.
  - القيمة الافتراضية هي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛ عيّن
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار tarball محلي محلول بدلاً من
    التثبيت من السجل.
  - يصدر توقيت RTT متكرراً في `qa-evidence.json` افتراضياً مع
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. تجاوز
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES` أو
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` أو
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` لضبط تشغيل RTT.
    يقبل `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` قائمة مفصولة بفواصل من
    معرّفات فحوصات QA لـ Telegram لأخذ عينات منها؛ وعند عدم ضبطه، يكون الفحص
    الافتراضي القادر على RTT هو `telegram-mentioned-message-reply`.
  - يستخدم بيانات اعتماد env نفسها لـ Telegram أو مصدر بيانات اعتماد Convex نفسه مثل
    `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، عيّن
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` مع
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور. إذا كان
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI،
    يحدد غلاف Docker Convex تلقائياً.
  - يتحقق الغلاف من env بيانات اعتماد Telegram أو Convex على المضيف قبل
    عمل بناء/تثبيت Docker. عيّن `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    فقط عند تصحيح إعداد ما قبل بيانات الاعتماد عمداً.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` القيمة المشتركة
    `OPENCLAW_QA_CREDENTIAL_ROLE` لهذا المسار فقط. عند تحديد بيانات اعتماد Convex
    وعدم ضبط أي دور، يستخدم الغلاف `ci` في CI و
    `maintainer` خارج CI.
  - تعرض GitHub Actions هذا المسار كسير عمل يدوي للمشرفين
    `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة
    `qa-live-shared` واستئجارات بيانات اعتماد Convex CI.
- تعرض GitHub Actions أيضاً `Package Acceptance` لإثبات منتج يعمل جانبياً
  ضد حزمة مرشحة واحدة. يقبل مرجعاً موثوقاً، أو مواصفة npm منشورة،
  أو URL لـ tarball عبر HTTPS مع SHA-256، أو أثر tarball من تشغيل آخر، ويرفع
  `openclaw-current.tgz` الموحّد باسم `package-under-test`، ثم يشغّل
  مجدول Docker E2E الحالي بملفات مسارات smoke أو package أو product أو full أو custom.
  عيّن `telegram_mode=mock-openai` أو `live-frontier` لتشغيل سير عمل
  QA الخاص بـ Telegram ضد أثر `package-under-test` نفسه.
  - إثبات أحدث منتج beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات URL الدقيق للـ tarball قيمة digest ويستخدم سياسة أمان URL العامة:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- تستخدم مرايا tarball الخاصة بالمؤسسات/الخاصة سياسة مصدر موثوق صريحة:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

يقرأ `source=trusted-url` الملف `.github/package-trusted-sources.json` من مرجع سير العمل الموثوق ولا يقبل بيانات اعتماد URL أو تجاوز شبكة خاصة عبر مدخل سير العمل. إذا أعلنت السياسة المسماة مصادقة bearer، فاضبط السر الثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- ينزّل إثبات الأثر tarball artifact من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - يحزم ويثبت بناء OpenClaw الحالي في Docker، ويبدأ Gateway
    مع ضبط OpenAI، ثم يفعّل channel/plugins المجمعة عبر تعديلات config.
  - يتحقق من أن اكتشاف الإعداد يترك plugins القابلة للتنزيل غير المضبوطة غائبة،
    وأن أول إصلاح doctor مضبوط يثبت كل plugin قابل للتنزيل مفقود
    صراحة، وأن إعادة تشغيل ثانية لا تشغّل إصلاح تبعيات مخفياً.
  - يثبت أيضاً أساس npm أقدم معروفاً، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن doctor بعد التحديث الخاص بالمرشح
    ينظف بقايا تبعيات plugin القديمة دون إصلاح postinstall من جانب harness.
- `pnpm test:parallels:npm-update`
  - يشغّل smoke تحديث packaged-install الأصلي عبر ضيوف Parallels. يثبت كل
    نظام أساسي محدد أولاً الحزمة الأساسية المطلوبة، ثم يشغّل أمر
    `openclaw update` المثبت في الضيف نفسه ويتحقق من الإصدار المثبت،
    وحالة التحديث، وجاهزية Gateway، ودورة agent محلية واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux` أثناء
    التكرار على ضيف واحد. استخدم `--json` لمسار أثر الملخص
    وحالة كل مسار.
  - يستخدم مسار OpenAI `openai/gpt-5.5` لإثبات دورة agent المباشرة
    افتراضياً. مرّر `--model <provider/model>` أو اضبط
    `OPENCLAW_PARALLELS_OPENAI_MODEL` عند التحقق عمداً من نموذج
    OpenAI آخر.
  - لفّ التشغيلات المحلية الطويلة بمهلة على المضيف حتى لا تستهلك حالات توقف
    نقل Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسارات متداخلة تحت `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي متوقف.
  - قد يستغرق تحديث Windows من 10 إلى 15 دقيقة في doctor بعد التحديث وأعمال
    تحديث الحزمة على ضيف بارد؛ يظل ذلك سليماً عندما يكون سجل تصحيح npm
    المتداخل يتقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات smoke الفردية لـ Parallels
    على macOS أو Windows أو Linux. فهي تشترك في حالة VM وقد تتصادم عند
    استعادة اللقطة أو خدمة الحزم أو حالة Gateway الخاصة بالضيف.
  - يشغّل إثبات ما بعد التحديث سطح plugin المجمع العادي لأن
    واجهات الإمكانات مثل الكلام وتوليد الصور وفهم الوسائط
    تُحمّل عبر APIs runtime المجمعة حتى عندما تتحقق دورة agent
    نفسها من استجابة نصية بسيطة فقط.

- `pnpm openclaw qa aimock`
  - يبدأ خادم موفر AIMock المحلي فقط لاختبار Smoke المباشر
    للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA المباشر لـ Matrix مقابل خادم Tuwunel homeserver مؤقت مدعوم بـ Docker. متاح فقط من شجرة المصدر - التثبيتات المعبأة لا تشحن `qa-lab`.
  - CLI الكامل، وفهرس الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط الأثر: [QA لـ Matrix](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA المباشر لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رموز بوت المشغّل وبوت SUT من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرف المجموعة هو معرف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` للاعتمادات المشتركة المجمّعة. استخدم وضع البيئة افتراضيًا، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` لاختيار عقود التأجير المجمّعة.
  - تغطي الافتراضيات Canary، وبوابة الإشارات، وعنونة الأوامر، و`/status`، وردود البوت إلى البوت عند الإشارة، وردود الأوامر الأصلية الأساسية. تغطي افتراضيات `mock-openai` أيضًا انحدارات سلسلة الردود الحتمية وبث الرسالة النهائية في Telegram. استخدم `--list-scenarios` للفحوصات الاختيارية مثل `session_status`.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد الآثار دون رمز خروج فاشل.
  - يتطلب بوتين متميزين في المجموعة الخاصة نفسها، مع كشف بوت SUT لاسم مستخدم Telegram.
  - للمراقبة المستقرة بين البوتات، فعّل وضع التواصل من بوت إلى بوت في `@BotFather` لكلا البوتين، وتأكد من أن بوت المشغّل يستطيع مراقبة حركة بوتات المجموعة.
  - يكتب تقرير QA لـ Telegram، وملخصًا، و`qa-evidence.json` تحت `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال المشغّل إلى رد SUT المرصود.

`Mantis Telegram Live` هو غلاف أدلة PR حول هذا المسار. يشغّل
مرجع المرشح باستخدام اعتمادات Telegram مستأجرة من Convex، ويعرض حزمة تقرير/أدلة QA
المنقحة في متصفح سطح مكتب Crabbox، ويسجل أدلة MP4،
وينشئ GIF مقصوص الحركة، ويرفع حزمة الآثار، وينشر أدلة PR
مضمنة عبر تطبيق Mantis GitHub عند تعيين `pr_number`. يمكن للمشرفين
بدؤه من واجهة Actions عبر `Mantis Scenario` (`scenario_id:
telegram-live`) أو مباشرة من تعليق على طلب سحب:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` هو غلاف Telegram Desktop الأصلي الوكيلي
قبل/بعد لإثبات PR المرئي. ابدأه من واجهة Actions باستخدام
`instructions` حرة، عبر `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`)، أو من تعليق على PR:

```text
@openclaw-mantis telegram desktop proof
```

يقرأ وكيل Mantis طلب PR، ويقرر أي سلوك مرئي في Telegram يثبت
التغيير، ويشغّل مسار إثبات Telegram Desktop لمستخدم حقيقي عبر Crabbox على مراجع الأساس
والمرشح، ويكرر حتى تصبح ملفات GIF الأصلية مفيدة، ويكتب بيان
`motionPreview` مزدوجًا، وينشر جدول GIF نفسه ذي العمودين عبر
تطبيق Mantis GitHub عند تعيين `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - يستأجر أو يعيد استخدام سطح مكتب Linux من Crabbox، ويثبت Telegram Desktop الأصلي، ويهيئ OpenClaw باستخدام رمز بوت Telegram SUT مستأجر، ويبدأ Gateway، ويسجل أدلة لقطة شاشة/MP4 من سطح مكتب VNC المرئي.
  - يستخدم افتراضيًا `--credential-source convex` بحيث لا تحتاج سير العمل إلا إلى سر وسيط Convex. استخدم `--credential-source env` مع متغيرات `OPENCLAW_QA_TELEGRAM_*` نفسها كما في `pnpm openclaw qa telegram`.
  - لا يزال Telegram Desktop يحتاج إلى تسجيل دخول/ملف شخصي لمستخدم. رمز البوت يهيئ OpenClaw فقط. استخدم `--telegram-profile-archive-env <name>` لأرشيف ملف شخصي `.tgz` بترميز base64، أو استخدم `--keep-lease` وسجّل الدخول يدويًا عبر VNC مرة واحدة.
  - يكتب `mantis-telegram-desktop-builder-report.md` و`mantis-telegram-desktop-builder-summary.json` و`telegram-desktop-builder.png` و`telegram-desktop-builder.mp4` تحت دليل الإخراج.

تشترك مسارات النقل المباشر في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ توجد مصفوفة التغطية لكل مسار في [نظرة عامة على QA ← تغطية النقل المباشر](/ar/concepts/qa-e2e-automation#live-transport-coverage). يُعد `qa-channel` الحزمة الاصطناعية الواسعة وليس جزءًا من تلك المصفوفة.

### اعتمادات Telegram المشتركة عبر Convex (v1)

عند تمكين `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) من أجل
QA للنقل المباشر، يحصل مختبر QA على تأجير حصري من مجموعة مدعومة بـ Convex، ويرسل Heartbeat لذلك
التأجير أثناء تشغيل المسار، ويحرر التأجير عند إيقاف التشغيل. يسبق اسم القسم
دعم Discord وSlack وWhatsApp؛ عقد التأجير مشترك عبر الأنواع.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- اختيار دور الاعتمادات:
  - CLI: `--credential-role maintainer|ci`
  - افتراضي البيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (يكون افتراضيًا `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL لـ Convex عبر `http://` loopback للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` ‏`https://` في التشغيل العادي.

تتطلب أوامر إدارة المشرفين (إضافة/إزالة/سرد المجموعة)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل التشغيلات المباشرة للتحقق من عنوان URL لموقع Convex، وأسرار الوسيط،
وبادئة نقطة النهاية، ومهلة HTTP، وقابلية الوصول إلى الإدارة/السرد دون طباعة
قيم الأسرار. استخدم `--json` لمخرجات قابلة للقراءة آليًا في السكربتات وأدوات
CI.

عقد نقطة النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - مستنفد/قابل لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - حارس التأجير النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة معرف دردشة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل من أجل `kind: "telegram"` ويرفض الحمولات المشوهة.

شكل الحمولة لنوع مستخدم Telegram الحقيقي:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- يجب أن تكون `groupId` و`testerUserId` و`telegramApiId` سلاسل رقمية.
- يجب أن تكون `tdlibArchiveSha256` و`desktopTdataArchiveSha256` سلاسل SHA-256 سداسية عشرية.
- `kind: "telegram-user"` محجوز لسير عمل إثبات Mantis Telegram Desktop. يجب ألا تحصل مسارات QA Lab العامة عليه.

حمولات متعددة القنوات يتحقق منها الوسيط:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

يمكن لمسارات Slack أيضًا الاستئجار من المجموعة، لكن التحقق من حمولة Slack حاليًا
موجود في مشغّل QA لـ Slack بدلًا من الوسيط. استخدم
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
لصفوف Slack.

### إضافة قناة إلى QA

توجد أسماء البنية ومساعدي السيناريو لمحوّلات القنوات الجديدة في [نظرة عامة على QA ← إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: تنفيذ مشغّل النقل على منفذ مضيف `qa-lab` المشترك، والتصريح عن `qaRunners` في بيان Plugin، وتركيبه كـ `openclaw qa <runner>`، وتأليف السيناريوهات تحت `qa/scenarios/`.

## حزم الاختبار (ما الذي يعمل وأين)

فكر في الحزم بوصفها "واقعية متزايدة" (ومعها تذبذب/تكلفة متزايدان):

### الوحدة / التكامل (افتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم التشغيلات غير المستهدفة مجموعة أجزاء `vitest.full-*.config.ts` وقد توسّع أجزاء المشاريع المتعددة إلى إعدادات لكل مشروع من أجل الجدولة المتوازية
- الملفات: قوائم جرد الوحدة/النواة تحت `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`؛ تعمل اختبارات وحدة UI في جزء `unit-ui` المخصص
- النطاق:
  - اختبارات وحدة صرفة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، والتوجيه، والأدوات، والتحليل، والإعداد)
  - انحدارات حتمية للأخطاء المعروفة
- التوقعات:
  - يعمل في CI
  - لا يتطلب مفاتيح حقيقية
  - يجب أن يكون سريعًا ومستقرًا
  - يجب أن تثبت اختبارات المحلل ومحمّل السطح العام سلوك الرجوع الواسع لـ `api.js` و
    `runtime-api.js` باستخدام تجهيزات Plugin صغيرة مولدة، وليس
    واجهات API حقيقية من مصدر Plugin المضمّن. تنتمي تحميلات API الحقيقية للـ Plugin إلى
    حزم العقد/التكامل المملوكة للـ Plugin.

سياسة الاعتماد الأصلي:

- تتخطى تثبيتات الاختبار الافتراضية بنايات Discord opus الأصلية الاختيارية. يستخدم صوت Discord ‏`libopus-wasm` المضمّن، ويبقى `@discordjs/opus` معطلًا في `allowBuilds` حتى لا تجمع الاختبارات المحلية ومسارات Testbox الإضافة الأصلية.
- قارِن أداء opus الأصلي في مستودع قياس أداء `libopus-wasm`، لا في حلقات تثبيت/اختبار OpenClaw الافتراضية. لا تعيّن `@discordjs/opus` إلى `true` في `allowBuilds` الافتراضي؛ فهذا يجعل حلقات التثبيت/الاختبار غير ذات الصلة تجمع كودًا أصليًا.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - تشغّل أوامر `pnpm test` غير المستهدفة اثني عشر إعداد shard أصغر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) بدل عملية مشروع جذر أصلية عملاقة واحدة. يقلل هذا ذروة RSS على الأجهزة المحمّلة، ويتجنب أن يؤدي عمل auto-reply/extension إلى تجويع الحزم غير المرتبطة.
    - لا يزال `pnpm test --watch` يستخدم مخطط مشروع الجذر الأصلي `vitest.config.ts`، لأن حلقة مراقبة متعددة الـ shard ليست عملية.
    - توجّه `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر المسارات scoped أولا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع تكلفة بدء مشروع الجذر كاملة.
    - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى مسارات scoped رخيصة افتراضيا: تعديلات الاختبار المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، والمعتمدات المحلية في مخطط الاستيراد. لا تؤدي تعديلات config/setup/package إلى تشغيل واسع للاختبارات إلا إذا استخدمت صراحة `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هو بوابة الفحص المحلي الذكية العادية للعمل الضيق. يصنف diff إلى core، واختبارات core، وextensions، واختبارات extension، وapps، وdocs، وبيانات release الوصفية، وأدوات Docker الحية، وtooling، ثم يشغّل أوامر typecheck وlint وguard المطابقة. لا يشغّل اختبارات Vitest؛ استدع `pnpm test:changed` أو `pnpm test <target>` الصريح لإثبات الاختبار. تشغّل زيادات الإصدار التي تقتصر على بيانات release الوصفية فحوصات موجهة للإصدار/config/اعتماديات الجذر، مع guard يرفض تغييرات package خارج حقل الإصدار الأعلى مستوى.
    - تشغّل تعديلات حزمة ACP الحية في Docker فحوصات مركزة: صياغة shell لسكربتات مصادقة Docker الحية وتشغيل تجريبي جاف لمجدول Docker الحي. لا تُضمّن تغييرات `package.json` إلا عندما يقتصر diff على `scripts["test:docker:live-*"]`؛ ولا تزال تعديلات الاعتماديات وexport والإصدار وأسطح package الأخرى تستخدم guards الأوسع.
    - اختبارات الوحدة خفيفة الاستيراد من agents وcommands وplugins ومساعدات auto-reply و`plugin-sdk` ومناطق الأدوات الخالصة المشابهة تُوجّه عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ تبقى الملفات ذات الحالة/الثقيلة runtime على المسارات الحالية.
    - تعيّن ملفات مصدر مساعدة مختارة من `plugin-sdk` و`commands` أيضا تشغيلات الوضع المتغير إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، حتى تتجنب تعديلات المساعدين إعادة تشغيل الحزمة الثقيلة الكاملة لذلك الدليل.
    - لدى `auto-reply` حاويات مخصصة لمساعدي core في المستوى الأعلى، واختبارات التكامل `reply.*` في المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. يقسم CI كذلك شجرة reply الفرعية إلى shards لـ agent-runner وdispatch وcommands/state-routing حتى لا تمتلك حاوية ثقيلة الاستيراد واحدة ذيل Node الكامل.
    - يتخطى CI العادي لـ PR/main عمدا مسح دفعة extension وshard `agentic-plugins` المخصص للإصدارات فقط. يطلق Full Release Validation سير العمل الفرعي المنفصل `Plugin Prerelease` لتلك الحزم الثقيلة للـ plugin/extension على مرشحات الإصدار.

  </Accordion>

  <Accordion title="تغطية المشغّل المضمّن">

    - عندما تغيّر مدخلات اكتشاف أدوات الرسائل أو سياق runtime الخاص بـ compaction، أبق كلا مستويي التغطية.
    - أضف تراجعات مساعدة مركزة لحدود التوجيه والتطبيع الخالصة.
    - حافظ على سلامة حزم تكامل المشغّل المضمّن:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`،
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`، و
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه الحزم من أن المعرّفات scoped وسلوك compaction لا يزالان يمران
      عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ الاختبارات المقتصرة على المساعدين
      ليست بديلا كافيا عن مسارات التكامل تلك.

  </Accordion>

  <Accordion title="افتراضيات Vitest pool والعزل">

    - يضبط إعداد Vitest الأساسي القيمة الافتراضية إلى `threads`.
    - يثبت إعداد Vitest المشترك `isolate: false` ويستخدم المشغّل غير المعزول عبر مشاريع الجذر وe2e والإعدادات الحية.
    - يحتفظ مسار واجهة المستخدم في الجذر بإعداد `jsdom` والمحسّن الخاص به، لكنه يعمل أيضا على المشغّل المشترك غير المعزول.
    - يرث كل shard لـ `pnpm test` افتراضيات `threads` + `isolate: false` نفسها من إعداد Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node الفرعية الخاصة بـ Vitest افتراضيا لتقليل اضطراب ترجمة V8 أثناء التشغيلات المحلية الكبيرة. عيّن `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8 القياسي.
    - ينهي `scripts/run-vitest.mjs` تشغيلات Vitest الصريحة غير المراقبة بعد
      5 دقائق بلا خرج stdout أو stderr. عيّن
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` لتعطيل watchdog أثناء تحقيق صامت عمدا.

  </Accordion>

  <Accordion title="التكرار المحلي السريع">

    - يعرض `pnpm changed:lanes` أي مسارات معمارية يطلقها diff.
    - hook ما قبل commit مخصص للتنسيق فقط. يعيد staged للملفات المنسقة ولا يشغّل lint أو typecheck أو الاختبارات.
    - شغّل `pnpm check:changed` صراحة قبل التسليم أو الدفع عندما تحتاج بوابة الفحص المحلي الذكية.
    - يوجّه `pnpm test:changed` عبر مسارات scoped رخيصة افتراضيا. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر agent أن تعديل harness أو config أو package أو contract يحتاج فعلا إلى تغطية Vitest أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه نفسه، لكن مع حد أعلى للعاملين.
    - التحجيم التلقائي للعاملين محليا محافظ عمدا ويتراجع عندما يكون متوسط حمل المضيف عاليا بالفعل، لذلك تُحدث تشغيلات Vitest المتزامنة المتعددة ضررا أقل افتراضيا.
    - يعلّم إعداد Vitest الأساسي ملفات المشاريع/config بصفتها `forceRerunTriggers` حتى تبقى إعادة التشغيل في وضع التغييرات صحيحة عندما تتغير توصيلات الاختبار.
    - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعلا على المضيفين المدعومين؛ عيّن `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت موقع cache صريحا واحدا للتنميط المباشر.

  </Accordion>

  <Accordion title="تصحيح الأداء">

    - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى خرج تفصيل الاستيراد.
    - يحدد `pnpm test:perf:imports:changed` عرض التنميط نفسه إلى الملفات المتغيرة منذ `origin/main`.
    - تُكتب بيانات توقيت shard إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم تشغيلات الإعداد الكامل مسار config مفتاحا؛ وتلحق shards الخاصة بـ CI ذات أنماط التضمين اسم shard حتى يمكن تتبع shards المفلترة منفصلة.
    - عندما لا يزال اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل، أبق الاعتماديات الثقيلة خلف حد `*.runtime.ts` محلي ضيق، وmock ذلك الحد مباشرة بدلا من deep-import لمساعدي runtime فقط لتمريرهم عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` تشغيل `test:changed` الموجّه بالمسار الأصلي لمشروع الجذر لذلك diff الملتزم، ويطبع زمن wall time بالإضافة إلى macOS max RSS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة المتسخة الحالية عبر توجيه قائمة الملفات المتغيرة خلال
      `scripts/test-projects.mjs` وإعداد Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لتكاليف بدء Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل لحزمة الوحدة مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، مجبر على عامل واحد
- النطاق:
  - يبدأ Gateway loopback حقيقيا مع تفعيل التشخيصات افتراضيا
  - يدفع اضطراب رسائل gateway والذاكرة والحمولات الكبيرة الاصطناعية عبر مسار أحداث التشخيص
  - يستعلم `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدي استمرار حزمة الاستقرار التشخيصية
  - يؤكد أن المسجل يبقى محدودا، وأن عينات RSS الاصطناعية تبقى دون ميزانية الضغط، وأن أعماق الطوابير لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج مفاتيح
  - مسار ضيق لمتابعة تراجعات الاستقرار، وليس بديلا عن حزمة Gateway الكاملة

### E2E (تجميع repo)

- الأمر: `pnpm test:e2e`
- النطاق:
  - يشغّل مسار E2E لدخان gateway
  - يشغّل مسار E2E للمتصفح المموّه في Control UI
- التوقعات:
  - آمن لـ CI ولا يحتاج مفاتيح
  - يتطلب تثبيت Playwright Chromium

### E2E (دخان gateway)

- الأمر: `pnpm test:e2e:gateway`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts`، و`test/**/*.e2e.test.ts`، واختبارات E2E الخاصة بالـ plugin المضمّن تحت `extensions/`
- افتراضيات runtime:
  - يستخدم Vitest `threads` مع `isolate: false`، بما يطابق بقية repo.
  - يستخدم عاملين تكيفيين (CI: حتى 2، محليا: 1 افتراضيا).
  - يعمل في الوضع الصامت افتراضيا لتقليل تكلفة console I/O.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العاملين (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل خرج console التفصيلي.
- النطاق:
  - سلوك gateway من طرف إلى طرف متعدد المثيلات
  - أسطح WebSocket/HTTP، وإقران node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تفعيله في pipeline)
  - لا يتطلب مفاتيح حقيقية
  - أجزاء متحركة أكثر من اختبارات الوحدة (قد يكون أبطأ)

### E2E (متصفح Control UI المموّه)

- الأمر: `pnpm test:ui:e2e`
- الإعداد: `test/vitest/vitest.ui-e2e.config.ts`
- الملفات: `ui/src/**/*.e2e.test.ts`
- النطاق:
  - يبدأ Vite Control UI
  - يقود صفحة Chromium حقيقية عبر Playwright
  - يستبدل Gateway WebSocket بـ mocks حتمية داخل المتصفح
- التوقعات:
  - يعمل في CI كجزء من `pnpm test:e2e`
  - لا يتطلب Gateway حقيقيا أو agents أو مفاتيح مزودين
  - يجب أن تكون تبعية المتصفح موجودة (`pnpm --dir ui exec playwright install chromium`)

### E2E: دخان backend لـ OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يعيد استخدام Gateway OpenShell محلي نشط
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يمرّن backend الخاص بـ OpenShell في OpenClaw عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات remote-canonical عبر جسر sandbox fs
- التوقعات:
  - اختياري فقط؛ ليس جزءا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليا باسم `openshell` بالإضافة إلى Docker daemon عامل
  - يتطلب Gateway OpenShell محليا نشطا ومصدر config الخاص به
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمر sandbox الاختبار
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتفعيل الاختبار عند تشغيل حزمة e2e الأوسع يدويا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي أو سكربت wrapper غير افتراضي
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` لكشف config الخاصة بـ gateway المسجل إلى الاختبار المعزول
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` لتجاوز IP الخاص بـ Docker gateway المستخدم بواسطة fixture سياسة المضيف

### Live (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات bundled-plugin الحية ضمن `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزوّد/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - اكتشاف تغييرات تنسيق المزوّد، وخصوصيات استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - ليست مستقرة على CI بحكم التصميم (شبكات حقيقية، سياسات مزوّدين حقيقية، حصص، انقطاعات)
  - تكلف مالًا / تستخدم حدود المعدل
  - يفضّل تشغيل مجموعات فرعية مضيّقة بدلًا من "كل شيء"
- تستخدم التشغيلات الحية مفاتيح API المصدّرة مسبقًا وملفات تعريف المصادقة المرحلية.
- افتراضيًا، تظل التشغيلات الحية تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى موطن اختبار مؤقت حتى لا تستطيع تجهيزات اختبارات الوحدة تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية دليل الموطن الحقيقي لديك.
- يكون `pnpm test:live` افتراضيًا في وضع أهدأ: يحتفظ بمخرجات التقدم `[live] ...` ويكتم سجلات تمهيد Gateway/ثرثرة Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بالمزوّد): اضبط `*_API_KEYS` بتنسيق الفاصلة/الفاصلة المنقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (مثل `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو تجاوزًا لكل تشغيل حي عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- مخرجات التقدم/Heartbeat:
  - تُصدر مجموعات الاختبارات الحية الآن أسطر تقدم إلى stderr حتى تكون استدعاءات المزوّد الطويلة نشطة بوضوح حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة تحكم Vitest حتى تتدفق أسطر تقدم المزوّد/Gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeat النماذج المباشرة باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat Gateway/المسبار باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة اختبارات ينبغي أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح "روبوتي متوقف" / إخفاقات خاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` مضيّقًا

## الاختبارات الحية (التي تلمس الشبكة)

لمصفوفة النماذج الحية، واختبارات دخان واجهة CLI الخلفية، واختبارات دخان ACP، وحزمة اختبار خادم تطبيق Codex،
وجميع اختبارات مزوّدي الوسائط الحية (Deepgram وBytePlus وComfyUI والصور
والموسيقى والفيديو وحزمة اختبار الوسائط) - إضافة إلى التعامل مع بيانات الاعتماد للتشغيلات الحية - راجع
[اختبار المجموعات الحية](/ar/help/testing-live). لقائمة التحقق المخصصة للتحديث
والتحقق من Plugin، راجع
[اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins).

## مشغّلات Docker (فحوصات اختيارية لـ "يعمل في Linux")

تنقسم مشغّلات Docker هذه إلى مجموعتين:

- مشغّلات النماذج الحية: يشغّل `test:docker:live-models` و`test:docker:live-gateway` ملفهما الحي المطابق لمفتاح ملف التعريف فقط داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعداد المحلي لديك، ومساحة العمل، وملف بيئة ملف تعريف اختياري. نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تحتفظ مشغّلات Docker الحية بحدودها العملية الخاصة عند الحاجة:
  يكون `test:docker:live-models` افتراضيًا على المجموعة المنتقاة المدعومة عالية الإشارة، ويكون
  `test:docker:live-gateway` افتراضيًا على `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. اضبط `OPENCLAW_LIVE_MAX_MODELS`
  أو متغيرات بيئة Gateway عندما تريد صراحة حدًا أصغر أو فحصًا أكبر.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كحزمة npm tarball عبر `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة العارية هي فقط مشغّل Node/Git لمسارات التثبيت/التحديث/اعتمادات Plugin؛ تركّب تلك المسارات الحزمة tarball المبنية مسبقًا. تثبّت الصورة الوظيفية الحزمة tarball نفسها في `/app` لمسارات وظائف التطبيق المبني. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في خانات العمليات، بينما تمنع حدود الموارد مسارات الحي الثقيلة وتثبيت npm ومتعددة الخدمات من البدء كلها دفعة واحدة. إذا كان مسار واحد أثقل من الحدود النشطة، فلا يزال بإمكان المجدول بدءه عندما يكون التجمع فارغًا ثم يبقيه يعمل وحده حتى تتوفر السعة مرة أخرى. الافتراضيات هي 10 خانات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما يكون لدى مضيف Docker سعة إضافية. يجري المشغّل فحص Docker تمهيديًا افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون دون بناء Docker أو تشغيله، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة، واحتياجات الحزمة/الصورة، وبيانات الاعتماد.
- `Package Acceptance` هي بوابة الحزمة الأصلية في GitHub لسؤال "هل تعمل هذه الحزمة القابلة للتثبيت كمنتج؟" تحل حزمة مرشحة واحدة من `source=npm` أو `source=ref` أو `source=url` أو `source=artifact`، وترفعها باسم `package-under-test`، ثم تشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد تلك الحزمة tarball نفسها بدلًا من إعادة حزم المرجع المحدد. تُرتَّب ملفات التعريف حسب الاتساع: `smoke` و`package` و`product` و`full`. راجع [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins) لعقد الحزمة/التحديث/Plugin، ومصفوفة النجاة من الترقية المنشورة، وافتراضيات الإصدار، وفرز الإخفاقات.
- تشغّل فحوصات البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يتتبع الحارس الرسم البياني المبني الثابت من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا استورد بدء التشغيل السابق لتوزيع الأوامر اعتماديات حزم مثل Commander أو واجهة المطالبات أو undici أو التسجيل قبل توزيع الأوامر؛ كما يُبقي جزء تشغيل Gateway المضمّن ضمن الميزانية ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة. يغطي دخان CLI المحزّم أيضًا مساعدة الجذر، ومساعدة onboard، ومساعدة doctor، والحالة، ومخطط الإعداد، وأمر قائمة النماذج.
- توافق `Package Acceptance` القديم محدود عند `2026.4.25` (بما في ذلك `2026.4.25-beta.*`). حتى ذلك الحد، تتسامح الحزمة الاختبارية فقط مع فجوات بيانات التعريف للحزم المشحونة: إدخالات مخزون QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات التصحيح في تجهيز git المشتق من tarball، وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة، وغياب استمرار سجل تثبيت marketplace، وترحيل بيانات تعريف الإعداد أثناء `plugins update`. بالنسبة للحزم بعد `2026.4.25`، تكون تلك المسارات إخفاقات صارمة.
- مشغّلات دخان الحاويات: `test:docker:openwebui` و`test:docker:onboard` و`test:docker:npm-onboard-channel-agent` و`test:docker:release-user-journey` و`test:docker:release-typed-onboarding` و`test:docker:release-media-memory` و`test:docker:release-upgrade-user-journey` و`test:docker:release-plugin-marketplace` و`test:docker:skill-install` و`test:docker:update-channel-switch` و`test:docker:upgrade-survivor` و`test:docker:published-upgrade-survivor` و`test:docker:session-runtime-context` و`test:docker:agents-delete-shared-workspace` و`test:docker:gateway-network` و`test:docker:browser-cdp-snapshot` و`test:docker:mcp-channels` و`test:docker:agent-bundle-mcp-tools` و`test:docker:cron-mcp-cleanup` و`test:docker:plugins` و`test:docker:plugin-update` و`test:docker:plugin-lifecycle-matrix` و`test:docker:config-reload` تشغّل حاوية حقيقية واحدة أو أكثر وتتحقق من مسارات التكامل عالية المستوى.
- تحد مسارات Docker/Bash E2E التي تثبّت حزمة OpenClaw tarball المعبأة عبر `scripts/lib/openclaw-e2e-instance.sh` مدة `npm install` عند `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (الافتراضي `600s`؛ اضبط `0` لتعطيل الغلاف من أجل التصحيح).

تركّب مشغّلات Docker للنماذج الحية أيضًا مواضع مصادقة CLI اللازمة فقط بربط bind (أو كل المواضع المدعومة عندما لا يكون التشغيل مضيّقًا)، ثم تنسخها إلى موطن الحاوية قبل التشغيل حتى تستطيع external-CLI OAuth تحديث الرموز دون تعديل مخزن مصادقة المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- دخان ربط ACP: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيًا، مع تغطية Droid/OpenCode صارمة عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- دخان واجهة CLI الخلفية: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- دخان حزمة اختبار خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل تطوير: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- دخان قابلية المراقبة: `pnpm qa:otel:smoke` و`pnpm qa:prometheus:smoke` و`pnpm qa:observability:smoke` هي مسارات QA خاصة لسحب المصدر. وهي عمدًا ليست جزءًا من مسارات إصدار Docker للحزمة لأن حزمة npm tarball تحذف QA Lab.
- دخان Open WebUI الحي: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج التهيئة (TTY، سقالة كاملة): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- دخان تهيئة/قناة/وكيل حزمة npm tarball: يثبّت `pnpm test:docker:npm-onboard-channel-agent` حزمة OpenClaw tarball المعبأة عالميًا في Docker، ويعدّ OpenAI عبر تهيئة env-ref إضافة إلى Telegram افتراضيًا، ويشغّل doctor، ويشغّل دورة وكيل OpenAI واحدة بمحاكاة. أعد استخدام حزمة tarball مبنية مسبقًا باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة بناء المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` أو `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- فحص دخان رحلة مستخدم الإصدار: يقوم `pnpm test:docker:release-user-journey` بتثبيت حزمة tarball المعبأة من OpenClaw عموميًا في مجلد Docker منزلي نظيف، وتشغيل الإعداد الأولي، وتهيئة مزود OpenAI وهمي، وتشغيل دورة agent، وتثبيت/إلغاء تثبيت Plugins خارجية، وتهيئة ClickClack مقابل fixture محلي، والتحقق من الرسائل الصادرة/الواردة، وإعادة تشغيل Gateway، وتشغيل doctor.
- فحص دخان الإعداد الأولي المكتوب للإصدار: يقوم `pnpm test:docker:release-typed-onboarding` بتثبيت حزمة tarball المعبأة، وقيادة `openclaw onboard` عبر TTY حقيقي، وتهيئة OpenAI كمزود env-ref، والتحقق من عدم استمرار حفظ أي مفتاح خام، وتشغيل دورة agent وهمية.
- فحص دخان الوسائط/الذاكرة للإصدار: يقوم `pnpm test:docker:release-media-memory` بتثبيت حزمة tarball المعبأة، والتحقق من فهم الصور من مرفق PNG، ومخرجات توليد صور متوافقة مع OpenAI، واستدعاء بحث الذاكرة، وبقاء الاستدعاء بعد إعادة تشغيل Gateway.
- فحص دخان رحلة مستخدم ترقية الإصدار: يقوم `pnpm test:docker:release-upgrade-user-journey` افتراضيًا بتثبيت أحدث أساس منشور أقدم من حزمة tarball المرشحة، وتهيئة حالة المزود/Plugin/ClickClack على الحزمة المنشورة، والترقية إلى حزمة tarball المرشحة، ثم إعادة تشغيل رحلة agent/Plugin/القناة الأساسية. إذا لم يوجد أساس منشور أقدم، فإنه يعيد استخدام نسخة المرشح. تجاوز الأساس باستخدام `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- فحص دخان سوق Plugins للإصدار: يقوم `pnpm test:docker:release-plugin-marketplace` بالتثبيت من سوق fixture محلي، وتحديث Plugin المثبت، وإلغاء تثبيته، والتحقق من اختفاء CLI الخاص بـ Plugin مع تقليم بيانات تعريف التثبيت.
- فحص دخان تثبيت Skill: يقوم `pnpm test:docker:skill-install` بتثبيت حزمة tarball المعبأة من OpenClaw عموميًا في Docker، وتعطيل تثبيتات الأرشيف المرفوعة في الإعدادات، وحل slug الحالي الحي لـ Skill في ClawHub من البحث، وتثبيته باستخدام `openclaw skills install`، والتحقق من Skill المثبتة إضافة إلى بيانات تعريف الأصل/القفل في `.clawhub`.
- فحص دخان تبديل قناة التحديث: يقوم `pnpm test:docker:update-channel-switch` بتثبيت حزمة tarball المعبأة من OpenClaw عموميًا في Docker، والتبديل من حزمة `stable` إلى git `dev`، والتحقق من القناة المستمرة وعمل Plugin بعد التحديث، ثم التبديل مجددًا إلى حزمة `stable` وفحص حالة التحديث.
- فحص دخان ناجي الترقية: يقوم `pnpm test:docker:upgrade-survivor` بتثبيت حزمة tarball المعبأة من OpenClaw فوق fixture مستخدم قديم غير نظيف يحتوي على agents، وتهيئة القناة، وقوائم سماح Plugins، وحالة تبعيات Plugin قديمة، وملفات مساحة عمل/جلسة موجودة. يشغل تحديث الحزمة إضافة إلى doctor غير تفاعلي بدون مزود حي أو مفاتيح قناة، ثم يبدأ Gateway عبر local loopback ويفحص حفظ الإعدادات/الحالة إضافة إلى ميزانيات بدء التشغيل/الحالة.
- فحص دخان ناجي الترقية المنشورة: يقوم `pnpm test:docker:published-upgrade-survivor` افتراضيًا بتثبيت `openclaw@latest`، وزرع ملفات مستخدم موجود واقعية، وتهيئة ذلك الأساس بوصفة أوامر مدمجة، والتحقق من الإعدادات الناتجة، وتحديث ذلك التثبيت المنشور إلى حزمة tarball المرشحة، وتشغيل doctor غير تفاعلي، وكتابة `.artifacts/upgrade-survivor/summary.json`، ثم بدء Gateway عبر local loopback وفحص المقاصد المهيأة، وحفظ الحالة، وبدء التشغيل، و`/healthz`، و`/readyz`، وميزانيات حالة RPC. تجاوز أساسًا واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، واطلب من المجدول التجميعي توسيع الأسس المحلية الدقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`، ووسّع fixtures المشكّلة كقضايا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues`؛ تتضمن مجموعة reported-issues `configured-plugin-installs` لإصلاح تثبيت OpenClaw Plugin خارجي تلقائيًا. يكشف Package Acceptance هذه كـ `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`، ويحل رموز الأساس الوصفية مثل `last-stable-4` أو `all-since-2026.4.23`، وتوسع Full Release Validation بوابة حزمة release-soak إلى `last-stable-4 2026.4.23 2026.5.2 2026.4.15` إضافة إلى `reported-issues`.
- فحص دخان سياق تشغيل الجلسة: يتحقق `pnpm test:docker:session-runtime-context` من استمرار نسخ سياق التشغيل المخفية إضافة إلى إصلاح doctor لفروع إعادة كتابة prompt المكررة المتأثرة.
- فحص دخان تثبيت Bun العمومي: يقوم `bash scripts/e2e/bun-global-install-smoke.sh` بتعبئة الشجرة الحالية، وتثبيتها باستخدام `bun install -g` في مجلد منزلي معزول، والتحقق من أن `openclaw infer image providers --json` يعيد مزودي صور مضمّنين بدلًا من التعليق. أعد استخدام حزمة tarball مبنية مسبقًا باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ بناء المضيف باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- فحص دخان Docker للمثبت: يشارك `bash scripts/test-install-sh-docker.sh` ذاكرة npm مؤقتة واحدة عبر حاويات root والتحديث وdirect-npm. يفترض فحص دخان التحديث npm `latest` كأساس stable قبل الترقية إلى حزمة tarball المرشحة. تجاوز ذلك محليًا باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، أو باستخدام إدخال `update_baseline_version` في سير عمل Install Smoke على GitHub. تحتفظ فحوصات المثبت غير الجذر بذاكرة npm مؤقتة معزولة كي لا تخفي إدخالات الذاكرة المؤقتة المملوكة للجذر سلوك التثبيت المحلي للمستخدم. عيّن `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة root/update/direct-npm المؤقتة عبر إعادات التشغيل المحلية.
- يتخطى Install Smoke CI التحديث العمومي direct-npm المكرر باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل السكربت محليًا بدون هذا env عند الحاجة إلى تغطية `npm install -g` المباشرة.
- فحص دخان CLI لحذف agents لمساحة العمل المشتركة: يقوم `pnpm test:docker:agents-delete-shared-workspace` (السكربت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) ببناء صورة Dockerfile الجذر افتراضيًا، وزرع agentين مع مساحة عمل واحدة في مجلد منزلي معزول للحاوية، وتشغيل `agents delete --json`، والتحقق من JSON صالح إضافة إلى سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke باستخدام `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- فحص دخان لقطة Browser CDP: يقوم `pnpm test:docker:browser-cdp-snapshot` (السكربت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) ببناء صورة E2E المصدر إضافة إلى طبقة Chromium، وبدء Chromium مع CDP خام، وتشغيل `browser doctor --deep`، والتحقق من أن لقطات دور CDP تغطي عناوين URL للروابط، والعناصر القابلة للنقر المرفوعة بالمؤشر، ومراجع iframe، وبيانات الإطار التعريفية.
- انحدار الاستدلال الأدنى لـ OpenAI Responses web_search: يقوم `pnpm test:docker:openai-web-search-minimal` (السكربت: `scripts/e2e/openai-web-search-minimal-docker.sh`) بتشغيل خادم OpenAI وهمي عبر Gateway، والتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط المزود ويفحص ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + فحص دخان خام لإطار إشعار Claude): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة OpenClaw (خادم MCP حقيقي عبر stdio + فحص دخان سماح/رفض ملف تعريف OpenClaw مضمّن): `pnpm test:docker:agent-bundle-mcp-tools` (السكربت: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- تنظيف MCP لـ Cron/subagent (Gateway حقيقي + تفكيك stdio MCP child بعد تشغيلات cron معزولة وsubagent لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكربت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (فحص دخان التثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، وبيانات تعريف حزمة npm مشوهة، ومراجع git متحركة، وClawHub kitchen-sink، وتحديثات السوق، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)
  عيّن `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج حزمة/تشغيل kitchen-sink الافتراضي باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم fixture محليًا مغلقًا لـ ClawHub.
- فحص دخان تحديث Plugin بدون تغيير: `pnpm test:docker:plugin-update` (السكربت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- فحص دخان مصفوفة دورة حياة Plugin: يقوم `pnpm test:docker:plugin-lifecycle-matrix` بتثبيت حزمة tarball المعبأة من OpenClaw في حاوية عارية، وتثبيت npm Plugin، والتبديل بين التمكين/التعطيل، وترقيته وخفض نسخته عبر سجل npm محلي، وحذف الكود المثبت، ثم التحقق من أن إلغاء التثبيت ما يزال يزيل الحالة القديمة مع تسجيل مقاييس RSS/CPU لكل مرحلة من دورة الحياة.
- فحص دخان بيانات تعريف إعادة تحميل الإعدادات: `pnpm test:docker:config-reload` (السكربت: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: يغطي `pnpm test:docker:plugins` فحص دخان التثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git متحركة، وfixtures ClawHub، وتحديثات السوق، وتمكين/فحص حزمة Claude. يغطي `pnpm test:docker:plugin-update` سلوك التحديث غير المتغير لـ Plugins المثبتة. يغطي `pnpm test:docker:plugin-lifecycle-matrix` تثبيت npm Plugin مع تتبع الموارد، والتمكين، والتعطيل، والترقية، وخفض النسخة، وإلغاء التثبيت عند غياب الكود.

للبناء المسبق وإعادة استخدام الصورة الوظيفية المشتركة يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بالمجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` لها الأسبقية عند تعيينها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكربتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات QR وDocker للمثبت بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلًا من تشغيل التطبيق المبني المشترك.

تقوم مشغلات Docker للنماذج الحية أيضا بربط التحميل للنسخة الحالية للقراءة فقط
وتجهيزها في مجلد عمل مؤقت داخل الحاوية. يحافظ هذا على صورة وقت التشغيل
خفيفة مع الاستمرار في تشغيل Vitest على نفس المصدر/الإعداد المحلي لديك.
تتجاوز خطوة التجهيز ذاكرات التخزين المؤقت المحلية الكبيرة ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة إخراج `.build` المحلية للتطبيق أو
Gradle حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ
آثار خاصة بالجهاز.
كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ مجسات Gateway الحية
عمال قنوات Telegram/Discord/إلخ. حقيقيين داخل الحاوية.
ما زال `test:docker:live-models` يشغل `pnpm test:live`، لذا مرر
`OPENCLAW_LIVE_GATEWAY_*` أيضا عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
الحية من مسار Docker هذا.
`test:docker:openwebui` هو فحص توافق دخاني أعلى مستوى: يبدأ
حاوية Gateway من OpenClaw مع تمكين نقاط نهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبتة الإصدار مقابل ذلك Gateway، ويسجل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` تعرض `openclaw/default`، ثم يرسل
طلب محادثة حقيقيا عبر وكيل Open WebUI عند `/api/chat/completions`.
اضبط `OPENWEBUI_SMOKE_MODE=models` لفحوص CI الخاصة بمسار الإصدار التي يجب أن تتوقف
بعد تسجيل الدخول إلى Open WebUI واكتشاف النموذج، دون انتظار إكمال نموذج حي.
قد تكون أول عملية تشغيل أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد يحتاج Open WebUI إلى إنهاء إعداد البدء البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج حي صالحا للاستخدام. وفره عبر بيئة العملية،
أو ملفات تعريف المصادقة المجهزة، أو `OPENCLAW_PROFILE_FILE` صريح.
تطبع عمليات التشغيل الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عمدا ولا يحتاج إلى حساب
Telegram أو Discord أو iMessage حقيقي. يشغل حاوية Gateway مزروعة بالبيانات،
ويبدأ حاوية ثانية تستدعي `openclaw mcp serve`، ثم يتحقق من
اكتشاف المحادثات الموجهة، وقراءات النسخ النصية، وبيانات تعريف المرفقات،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة +
الأذونات بأسلوب Claude عبر جسر MCP الحقيقي باستخدام stdio. يفحص فحص الإشعارات
إطارات MCP الخام عبر stdio مباشرة حتى يتحقق الفحص الدخاني مما
يبثه الجسر فعليا، وليس فقط ما يظهره SDK عميل معين بالصدفة.
`test:docker:agent-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبني صورة Docker للمستودع، ويبدأ خادم مجس MCP حقيقيا عبر stdio
داخل الحاوية، ويمثل ذلك الخادم عبر وقت تشغيل MCP لحزمة OpenClaw المضمنة،
وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان
بأدوات `bundle-mcp` بينما يقوم `minimal` و`tools.deny: ["bundle-mcp"]` بتصفيتها.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبدأ Gateway مزروعا بالبيانات مع خادم مجس MCP حقيقي عبر stdio، ويشغل
دورة Cron معزولة ودورة فرعية لمرة واحدة عبر `sessions_spawn`، ثم يتحقق
من خروج عملية MCP الفرعية بعد كل تشغيل.

فحص دخاني يدوي لسلسلة ACP باللغة العادية (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لتدفقات عمل الانحدار/التصحيح. قد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه سلاسل ACP، لذا لا تحذفه.

متغيرات بيئة مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) مثبت إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) مثبت إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` مثبت ومصدر قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المصدرّة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعداد/مساحة عمل مؤقتة ودون تحميلات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) مثبت إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتا داخل Docker
- أدلة/ملفات مصادقة CLI الخارجية ضمن `$HOME` تثبت للقراءة فقط ضمن `/host-auth...`، ثم تنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - تشغيلات المزود المضيقة تثبت فقط الأدلة/الملفات المطلوبة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز يدويا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزودين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لإعادة التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن ملف التعريف (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لفحص Open WebUI الدخاني
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز مطالبة فحص nonce المستخدمة بواسطة فحص Open WebUI الدخاني
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة الإصدار

## سلامة الوثائق

شغل فحوص الوثائق بعد تعديلات الوثائق: `pnpm check:docs`.
شغل تحقق Mintlify الكامل من الروابط الداخلية عندما تحتاج أيضا إلى فحوص عناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه انحدارات "مسار حقيقي" دون مزودين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة وكيل): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway (WS `wizard.start`/`wizard.next`، يكتب الإعداد + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء الأدوات الوهمي عبر Gateway الحقيقي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات المعالج من البداية إلى النهاية التي تتحقق من توصيل الجلسة وتأثيرات الإعداد (`src/gateway/gateway.test.ts`).

ما يزال مفقودا لـ Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تدرج Skills في المطالبة، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود تدفق العمل:** سيناريوهات متعددة الأدوار تؤكد ترتيب الأدوات، واستمرار سجل الجلسة، وحدود وضع الحماية.

يجب أن تبقى التقييمات المستقبلية حتمية أولا:

- مشغل سيناريو يستخدم مزودين وهميين لتأكيد استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وتوصيل الجلسة.
- مجموعة صغيرة من السيناريوهات المركزة على Skills (استخدام مقابل تجنب، بوابات، حقن المطالبات).
- تقييمات حية اختيارية (بموافقة صريحة، ومقيدة بالبيئة) فقط بعد توفر المجموعة الآمنة لـ CI.

## اختبارات العقد (شكل Plugin والقناة)

تتحقق اختبارات العقد من أن كل Plugin وقناة مسجلين يلتزمان
بعقد الواجهة الخاص بهما. وهي تمر على كل Plugins المكتشفة وتشغل مجموعة من
تأكيدات الشكل والسلوك. يتجاوز مسار الوحدة الافتراضي `pnpm test` عمدا
ملفات الفحص الدخاني ونقاط الربط المشتركة هذه؛ شغل أوامر العقد صراحة
عندما تلمس أسطح القناة أو المزود المشتركة.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزودين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

تقع في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - شكل Plugin الأساسي (المعرف، الاسم، القدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرف السلسلة
- **directory** - واجهة API للدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزود

تقع في `src/plugins/contracts/*.contract.test.ts`.

- **status** - مجسات حالة القناة
- **registry** - شكل سجل Plugins

### عقود المزودين

تقع في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة API لفهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزود
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تشغلها

- بعد تغيير صادرات plugin-sdk أو مساراته الفرعية
- بعد إضافة أو تعديل Plugin قناة أو مزود
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقد في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة الانحدارات (إرشادات)

عندما تصلح مشكلة مزود/نموذج اكتشفت في التشغيل الحي:

- أضف انحدارا آمنا لـ CI إن أمكن (مزود وهمي/بديل، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت المشكلة حية فقط بطبيعتها (حدود المعدل، سياسات المصادقة)، فأبق الاختبار الحي ضيقا واختياريا عبر متغيرات البيئة
- فضل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ تحويل/إعادة تشغيل طلب المزود → اختبار نماذج مباشر
  - خطأ مسار جلسة/سجل/أدوات Gateway → فحص Gateway حي دخاني أو اختبار Gateway وهمي آمن لـ CI
- حاجز اجتياز SecretRef:
  - يستنتج `src/secrets/exec-secret-ref-id-parity.test.ts` هدفا واحدا عشوائيا لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرفات exec ذات مقاطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة مع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدا عند معرفات أهداف غير مصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذات صلة

- [اختبار الحي](/ar/help/testing-live)
- [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)
- [CI](/ar/ci)
