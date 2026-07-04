---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النموذج/المزوّد
    - تصحيح أخطاء سلوك Gateway والوكيل
summary: 'عدة الاختبار: مجموعات اختبارات الوحدة/e2e/الحية، ومشغلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-07-04T03:49:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

يحتوي OpenClaw على ثلاث مجموعات اختبارات Vitest (وحدة/تكامل، وe2e، ومباشرة) ومجموعة صغيرة
من مشغلات Docker. هذا المستند هو دليل "كيف نختبر":

- ما الذي تغطيه كل مجموعة (وما الذي تتعمد _عدم_ تغطيته).
- الأوامر التي يجب تشغيلها لسير العمل الشائع (محليًا، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات المباشرة بيانات الاعتماد وتختار النماذج/الموفرين.
- كيف تضيف اختبارات انحدار لمشكلات النماذج/الموفرين في العالم الحقيقي.

<Note>
**مكدس QA (qa-lab، qa-channel، ومسارات النقل المباشر)** موثق بشكل منفصل:

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) - البنية، سطح الأوامر، وتأليف السيناريوهات.
- [Matrix QA](/ar/concepts/qa-matrix) - مرجع لـ `pnpm openclaw qa matrix`.
- [بطاقة تقييم النضج](/ar/maturity/scorecard) - كيف تدعم أدلة QA الخاصة بالإصدارات قرارات الاستقرار وLTS.
- [قناة QA](/ar/channels/qa-channel) - Plugin النقل الاصطناعي المستخدم بواسطة السيناريوهات المدعومة من المستودع.

تغطي هذه الصفحة تشغيل مجموعات الاختبارات العادية ومشغلات Docker/Parallels. يسرد قسم مشغلات QA المحددة أدناه ([مشغلات QA المحددة](#qa-specific-runners)) استدعاءات `qa` الملموسة ويشير مجددًا إلى المراجع أعلاه.
</Note>

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع لمجموعة الاختبارات الكاملة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- استهداف الملفات المباشر يوجه الآن مسارات الامتدادات/القنوات أيضًا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تكرر العمل على فشل واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA المدعوم بآلة افتراضية Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة e2e: `pnpm test:e2e`

## مجلدات الاختبار المؤقتة

فضّل المساعدات المشتركة في `test/helpers/temp-dir.ts` للمجلدات المؤقتة
المملوكة للاختبار. فهي تجعل الملكية صريحة وتحافظ على التنظيف ضمن دورة حياة
الاختبار نفسها:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

يعرض `useAutoCleanupTempDirTracker(afterEach)` عمدًا أي طريقة تنظيف يدوية؛ يملك Vitest
التنظيف بعد كل اختبار. تبقى المساعدات منخفضة المستوى الموجودة للاختبارات التي
لم تنتقل بعد، لكن الاختبارات الجديدة والمهاجرة يجب أن تستخدم متعقب التنظيف
التلقائي. تجنب استخدامًا جديدًا لـ `makeTempDir` أو `cleanupTempDirs` أو
`createTempDirTracker` وتجنب استدعاءات `fs.mkdtemp*` العارية الجديدة في الاختبارات
إلا إذا كانت الحالة تتحقق صراحة من سلوك المجلد المؤقت الخام. أضف تعليق سماح
قابلًا للتدقيق مع سبب ملموس عندما يحتاج اختبار عمدًا إلى مجلد مؤقت عارٍ:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

لرؤية الهجرة، يبلّغ `node scripts/report-test-temp-creations.mjs` عن إنشاء مجلدات
مؤقتة عارية جديدة وعن استخدام جديد يدوي لمساعد مشترك في أسطر diff المضافة
دون حظر أنماط التنظيف الموجودة. يتبع نطاق ملفه عمدًا تصنيف مسارات الاختبار نفسه
المستخدم بواسطة `scripts/changed-lanes.mjs` بدلًا من الحفاظ على حدس منفصل لأسماء
ملفات مساعدات الاختبار، مع تخطي تنفيذ المساعد المشترك نفسه. يشغّل `check:changed`
هذا التقرير لمسارات الاختبار المتغيرة كإشارة CI تحذيرية فقط؛ النتائج هي تعليقات
تحذير GitHub وليست إخفاقات.

عند تصحيح موفرين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة المباشرة (النماذج + مجسات Gateway للأدوات/الصور): `pnpm test:live`
- استهداف ملف مباشر واحد بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- تقارير أداء وقت التشغيل: أرسل `OpenClaw Performance` مع
  `live_openai_candidate=true` لدورة وكيل `openai/gpt-5.5` حقيقية أو
  `deep_profile=true` لأدلة Kova الخاصة بالمعالج/الذاكرة/التتبع. تنشر التشغيلات المجدولة يوميًا
  أدلة مسارات الموفر الوهمي، والتنميط العميق، وGPT 5.5 إلى
  `openclaw/clawgrit-reports` عندما يكون `CLAWGRIT_REPORTS_TOKEN` مضبوطًا. يتضمن
  تقرير الموفر الوهمي أيضًا أرقام إقلاع Gateway على مستوى المصدر، والذاكرة،
  وضغط Plugins، وحلقة الترحيب المتكررة للنموذج الوهمي، وبدء تشغيل CLI.
- مسح النماذج المباشر عبر Docker: `pnpm test:docker:live-models`
  - يشغل كل نموذج محدد الآن دورة نصية بالإضافة إلى مجس صغير بأسلوب قراءة ملف.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغّل أيضًا دورة صورة صغيرة.
    عطّل المجسات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل إخفاقات الموفرين.
  - تغطية CI: كل من `OpenClaw Scheduled Live And E2E Checks` اليومية و
    `OpenClaw Release Checks` اليدوية يستدعيان سير العمل المباشر/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، والذي يتضمن مهام مصفوفة نماذج مباشرة منفصلة في Docker
    مقسمة حسب الموفر.
  - لإعادات تشغيل CI المركزة، أرسل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و `live_models_only: true`.
  - أضف أسرار موفرين عالية الإشارة جديدة إلى `scripts/ci-hydrate-live-auth.sh`
    بالإضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/الخاصة بالإصدار.
- اختبار دخان محادثة Codex المربوطة الأصلية: `pnpm test:docker:live-codex-bind`
  - يشغّل مسار Docker مباشرًا مقابل مسار خادم تطبيق Codex، ويربط رسالة Slack DM اصطناعية
    باستخدام `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من رد عادي ومسار مرفق صورة
    عبر ربط Plugin الأصلي بدلًا من ACP.
- اختبار دخان عدة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغّل دورات وكيل Gateway عبر عدة خادم تطبيق Codex المملوكة لـ Plugin،
    ويتحقق من `/codex status` و `/codex models`، ويمارس افتراضيًا مجسات الصورة،
    وcron MCP، والوكيل الفرعي، وGuardian. عطّل مجس الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل إخفاقات أخرى في خادم تطبيق Codex.
    لفحص وكيل فرعي مركز، عطّل المجسات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد مجس الوكيل الفرعي ما لم يتم ضبط
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- اختبار دخان تثبيت Codex عند الطلب: `pnpm test:docker:codex-on-demand`
  - يثبت حزمة tarball المعبأة لـ OpenClaw في Docker، ويشغّل إعداد مفتاح OpenAI API،
    ويتحقق من أن Plugin Codex واعتمادية `@openai/codex`
    تم تنزيلهما إلى جذر مشروع npm المُدار عند الطلب.
- اختبار دخان اعتماد أداة Plugin المباشر: `pnpm test:docker:live-plugin-tool`
  - يحزم Plugin ثابتًا مع اعتمادية `slugify` حقيقية، ويثبته عبر
    `npm-pack:`، ويتحقق من الاعتمادية تحت جذر مشروع npm المُدار،
    ثم يطلب من نموذج OpenAI مباشر استدعاء أداة Plugin وإرجاع slug المخفي.
- اختبار دخان أمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري مزدوج الاحتياط لسطح أمر الإنقاذ لقناة الرسائل.
    يمارس `/crestodian status`، ويضع تغيير نموذج مستمرًا في الطابور،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعدادات.
- اختبار دخان مخطط Crestodian عبر Docker: `pnpm test:docker:crestodian-planner`
  - يشغّل Crestodian في حاوية بلا إعدادات مع Claude CLI وهمي على `PATH`
    ويتحقق من أن رجوع المخطط التقريبي يترجم إلى كتابة إعدادات typed ومدققة.
- اختبار دخان التشغيل الأول لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من مجلد حالة OpenClaw فارغ، ويتحقق من نقطة دخول Crestodian الحديثة في الإعداد
    الأولي، ويطبق كتابات الإعداد/النموذج/الوكيل/Plugin Discord + SecretRef،
    ويتحقق من الإعدادات، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضًا في QA Lab بواسطة
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- اختبار دخان تكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل اختبارًا معزولًا
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مقابل `moonshot/kimi-k2.6`. تحقق من أن JSON يبلّغ عن Moonshot/K2.6 وأن
  نص المساعد يخزن `usage.cost` المطبّع.

<Tip>
عندما تحتاج إلى حالة فاشلة واحدة فقط، فضّل تضييق الاختبارات المباشرة عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## مشغلات QA المحددة

توجد هذه الأوامر بجانب مجموعات الاختبارات الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغّل CI ‏QA Lab في مسارات عمل مخصصة. تكافؤ الوكلاء متداخل تحت
`QA-Lab - All Lanes` والتحقق من الإصدارات، وليس سير عمل PR مستقلًا.
يجب أن يستخدم التحقق الواسع `Full Release Validation` مع
`rerun_group=qa-parity` أو مجموعة QA الخاصة بفحوصات الإصدار. تُبقي فحوصات الإصدار
المستقرة/الافتراضية التشبع المباشر/Docker الشامل خلف `run_release_soak=true`؛
ويفرض ملف `full` التشبع. يعمل `QA-Lab - All Lanes`
كل ليلة على `main` ومن الإرسال اليدوي مع مسار التكافؤ الوهمي، ومسار Matrix المباشر،
ومسار Telegram المباشر المُدار بواسطة Convex، ومسار Discord المباشر المُدار بواسطة Convex
كمهام متوازية. تمرر QA المجدولة وفحوصات الإصدار إلى Matrix
‏`--profile fast` صراحة، بينما تبقى افتراضية CLI الخاصة بـ Matrix وإدخال سير العمل
اليدوي `all`؛ يمكن للإرسال اليدوي تقسيم `all` إلى مهام `transport`،
و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`. يشغّل `OpenClaw Release
Checks` التكافؤ بالإضافة إلى مسارات Matrix السريعة وTelegram قبل موافقة الإصدار،
باستخدام `mock-openai/gpt-5.5` لفحوصات نقل الإصدار حتى تبقى
حتمية وتتجنب بدء تشغيل Plugin الموفر العادي. تعطل بوابات النقل المباشر هذه
بحث الذاكرة؛ يبقى سلوك الذاكرة مغطى بواسطة مجموعات تكافؤ QA.

تستخدم أجزاء الوسائط المباشرة للإصدار الكامل
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، والتي تحتوي مسبقًا على
`ffmpeg` و`ffprobe`. تستخدم أجزاء نماذج/خلفيات Docker المباشرة صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
التزام محدد، ثم تسحبها باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلًا من إعادة البناء
داخل كل جزء.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات ضمان الجودة المدعومة من المستودع مباشرة على المضيف.
  - يكتب عناصر `qa-evidence.json` و`qa-suite-summary.json` و
    `qa-suite-report.md` ذات المستوى الأعلى لمجموعة السيناريوهات المحددة، بما في ذلك
    اختيارات سيناريوهات التدفق المختلط وVitest وPlaywright.
  - عند تشغيله بواسطة `pnpm openclaw qa run --qa-profile <profile>`، يضمّن
    بطاقة درجات ملف تصنيف التصنيف المحدد في `qa-evidence.json` نفسه.
    يكتب `smoke-ci` أدلة مختصرة، ما يضبط `evidenceMode: "slim"` ويحذف
    `execution` لكل إدخال. يغطي `release` الشريحة المنسقة لجاهزية الإصدار؛
    يحدد `all` كل فئة نضج نشطة، وهو مخصص لتشغيلات سير عمل أدلة ملف تعريف ضمان الجودة الصريحة عندما تكون هناك حاجة إلى عنصر بطاقة درجات كامل.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا باستخدام عمال
    gateway معزولين. تكون قيمة التوازي الافتراضية في `qa-channel` هي 4 (محدودة بعدد
    السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد العمال،
    أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد العناصر دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم مزوّد محليًا مدعومًا بـ AIMock لتغطية تجريبية
    للتركيبات ومحاكاة البروتوكول دون استبدال مسار `mock-openai` الواعي بالسيناريوهات.
- `pnpm openclaw qa coverage --match <query>`
  - يبحث في معرّفات السيناريوهات والعناوين والأسطح ومعرّفات التغطية ومراجع الوثائق ومراجع الكود
    وplugins ومتطلبات المزوّد، ثم يطبع أهداف المجموعة المطابقة.
  - استخدم هذا قبل تشغيل QA Lab عندما تعرف السلوك أو مسار الملف المتأثر
    لكنك لا تعرف أصغر سيناريو. هو إرشادي فقط؛ ما زال عليك اختيار إثبات
    mock أو live أو Multipass أو Matrix أو النقل بناءً على السلوك الذي يجري تغييره.
- `pnpm test:plugins:kitchen-sink-live`
  - يشغّل اختبار التحمل الحي لـ OpenAI Kitchen Sink plugin عبر QA Lab. فهو
    يثبت حزمة Kitchen Sink الخارجية، ويتحقق من مخزون سطح plugin SDK،
    ويفحص `/healthz` و`/readyz`، ويسجل أدلة CPU/RSS في gateway،
    ويشغّل دورة OpenAI حية، ويتحقق من التشخيصات العدائية.
    يتطلب مصادقة OpenAI حية مثل `OPENAI_API_KEY`. في جلسات Testbox
    المهيأة، يستورد تلقائيًا ملف تعريف المصادقة الحية لـ Testbox عندما يكون
    مساعد `openclaw-testbox-env` موجودًا.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل قياس بدء تشغيل gateway مع حزمة صغيرة من سيناريوهات QA Lab الوهمية
    (`channel-chat-baseline` و`memory-failure-fallback` و
    `gateway-restart-inflight-run`) ويكتب ملخص ملاحظة CPU مدمجًا
    ضمن `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم افتراضيًا فقط ملاحظات CPU الساخنة المستمرة (`--cpu-core-warn`
    مع `--hot-wall-warn-ms`)، لذلك تُسجل دفعات بدء التشغيل القصيرة كمقاييس
    دون أن تبدو مثل انحدار تثبيت gateway الممتد لدقائق.
  - يستخدم عناصر `dist` المبنية؛ شغّل البناء أولًا عندما لا يحتوي checkout
    بالفعل على خرج تشغيل حديث.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة ضمان الجودة نفسها داخل آلة افتراضية Linux مؤقتة من Multipass.
  - يحافظ على سلوك اختيار السيناريو نفسه مثل `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار المزوّد/النموذج نفسها مثل `qa suite`.
  - تمرّر التشغيلات الحية مدخلات مصادقة ضمان الجودة المدعومة والعملية للضيف:
    مفاتيح المزوّد المعتمدة على البيئة، ومسار إعداد مزوّد QA live، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى أدلة الخرج ضمن جذر المستودع لكي يتمكن الضيف من الكتابة مرة أخرى عبر
    مساحة العمل المركبة.
  - يكتب تقرير ضمان الجودة والملخص العاديين بالإضافة إلى سجلات Multipass ضمن
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع ضمان الجودة المدعوم بـ Docker لعمل ضمان الجودة بأسلوب المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني tarball من npm من checkout الحالي، ويثبته عالميًا في
    Docker، ويشغّل إعداد OpenAI API-key غير التفاعلي، ويهيئ Telegram
    افتراضيًا، ويتحقق من أن تشغيل plugin المعبأ يحمّل دون إصلاح تبعيات عند بدء التشغيل،
    ويشغّل doctor، ويشغّل دورة وكيل محلية واحدة مقابل
    نقطة نهاية OpenAI وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ نفسه
    مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل فحص Docker حتميًا للتطبيق المبني لنصوص سياق التشغيل المضمن.
    يتحقق من استمرار سياق تشغيل OpenClaw المخفي كرسالة مخصصة غير معروضة
    بدلًا من تسريبه إلى دورة المستخدم المرئية، ثم يزرع جلسة JSONL معطلة متأثرة
    ويتحقق من أن `openclaw doctor --fix` يعيد كتابتها إلى الفرع النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبت مرشح حزمة OpenClaw في Docker، ويشغّل إعداد الحزمة المثبتة،
    ويهيئ Telegram عبر CLI المثبت، ثم يعيد استخدام مسار ضمان الجودة الحي لـ Telegram
    مع تلك الحزمة المثبتة بوصفها SUT Gateway.
  - يركّب الغلاف مصدر عدة `qa-lab` فقط من checkout؛ تمتلك
    الحزمة المثبتة `dist` و`openclaw/plugin-sdk` وتشغيل plugin المضمن
    كي لا يخلط المسار plugins من checkout الحالي داخل الحزمة
    قيد الاختبار.
  - تكون القيمة الافتراضية `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛ اضبط
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار tarball محلي محلول بدلًا من
    التثبيت من السجل.
  - يصدر توقيت RTT متكررًا في `qa-evidence.json` افتراضيًا مع
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. تجاوز
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES` أو
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` أو
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` لضبط تشغيل RTT.
    يقبل `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` قائمة مفصولة بفواصل من
    معرّفات فحوص QA الخاصة بـ Telegram لأخذ عينات منها؛ عند عدم ضبطه، يكون فحص RTT الافتراضي القادر
    هو `telegram-mentioned-message-reply`.
  - يستخدم بيانات اعتماد بيئة Telegram نفسها أو مصدر بيانات اعتماد Convex نفسه مثل
    `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، اضبط
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` بالإضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور. إذا كانت
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI،
    يحدد غلاف Docker Convex تلقائيًا.
  - يتحقق الغلاف من بيئة بيانات اعتماد Telegram أو Convex على المضيف قبل
    عمل بناء/تثبيت Docker. اضبط `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    فقط عند تصحيح إعداد ما قبل بيانات الاعتماد عمدًا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` المتغير المشترك
    `OPENCLAW_QA_CREDENTIAL_ROLE` لهذا المسار فقط. عند تحديد بيانات اعتماد Convex
    وعدم ضبط دور، يستخدم الغلاف `ci` في CI و
    `maintainer` خارج CI.
  - تعرض GitHub Actions هذا المسار كسير عمل يدوي للمشرفين
    `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة
    `qa-live-shared` وإيجارات بيانات اعتماد Convex CI.
- تعرض GitHub Actions أيضًا `Package Acceptance` لإثبات المنتج في تشغيل جانبي
  مقابل حزمة مرشحة واحدة. يقبل مرجعًا موثوقًا، أو مواصفة npm منشورة،
  أو عنوان URL لـ tarball عبر HTTPS مع SHA-256، أو عنصر tarball من تشغيل آخر، ويرفع
  `openclaw-current.tgz` الموحّد كـ `package-under-test`، ثم يشغّل
  مجدول Docker E2E الحالي بملفات تعريف مسارات smoke أو package أو product أو full أو custom.
  اضبط `telegram_mode=mock-openai` أو `live-frontier` لتشغيل سير عمل ضمان الجودة الخاص بـ Telegram
  مقابل عنصر `package-under-test` نفسه.
  - إثبات منتج أحدث إصدار beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات عنوان URL الدقيق لـ tarball ملخصًا ويستخدم سياسة أمان عناوين URL العامة:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- تستخدم مرايا tarball المؤسسية/الخاصة سياسة مصدر موثوق صريحة:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

يقرأ `source=trusted-url` ملف `.github/package-trusted-sources.json` من مرجع سير العمل الموثوق ولا يقبل بيانات اعتماد URL أو تجاوز شبكة خاصة من مدخل سير العمل. إذا أعلنت السياسة المسماة مصادقة bearer، فاضبط السر الثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- يحمّل إثبات العناصر tarball من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - يحزم ويبني تثبيت OpenClaw الحالي في Docker، ويبدأ Gateway
    مع تهيئة OpenAI، ثم يفعّل القنوات/plugins المضمنة عبر تعديلات الإعداد.
  - يتحقق من أن اكتشاف الإعداد يترك plugins القابلة للتنزيل وغير المهيأة غائبة،
    وأن أول إصلاح doctor مهيأ يثبت كل plugin قابل للتنزيل ومفقود
    صراحةً، وأن إعادة التشغيل الثانية لا تشغّل إصلاح تبعيات مخفيًا.
  - يثبت أيضًا أساس npm أقدم معروف، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن doctor بعد التحديث للمرشح
    ينظف بقايا تبعيات plugin القديمة دون إصلاح postinstall من جهة العدة.
- `pnpm test:parallels:npm-update`
  - يشغّل فحص تحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. يثبت كل
    نظام أساسي محدد أولًا حزمة الأساس المطلوبة، ثم يشغّل
    أمر `openclaw update` المثبت في الضيف نفسه ويتحقق من
    النسخة المثبتة وحالة التحديث وجاهزية gateway ودورة وكيل محلية واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux` أثناء
    التكرار على ضيف واحد. استخدم `--json` لمسار عنصر الملخص
    وحالة كل مسار.
  - يستخدم مسار OpenAI `openai/gpt-5.5` لإثبات دورة الوكيل الحية
    افتراضيًا. مرّر `--model <provider/model>` أو اضبط
    `OPENCLAW_PARALLELS_OPENAI_MODEL` عند التحقق عمدًا من نموذج OpenAI آخر.
  - غلّف التشغيلات المحلية الطويلة بمهلة على المضيف كي لا تستهلك
    توقفات نقل Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات المسارات المتداخلة ضمن `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي متوقف.
  - يمكن أن يقضي تحديث Windows من 10 إلى 15 دقيقة في doctor بعد التحديث وعمل
    تحديث الحزمة على ضيف بارد؛ ويظل ذلك سليمًا عندما يكون سجل تصحيح npm
    المتداخل يتقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات فحص Parallels
    الفردية لـ macOS أو Windows أو Linux. فهي تشارك حالة الآلة الافتراضية ويمكن أن تتصادم عند
    استعادة اللقطة أو تقديم الحزمة أو حالة gateway في الضيف.
  - يشغّل إثبات ما بعد التحديث سطح plugin المضمن العادي لأن
    واجهات الإمكانات مثل الكلام وتوليد الصور وفهم الوسائط
    تُحمّل عبر واجهات API لتشغيل الحزم المضمنة حتى عندما تتحقق دورة الوكيل
    نفسها من استجابة نصية بسيطة فقط.

- `pnpm openclaw qa aimock`
  - يشغّل فقط خادم موفّر AIMock المحلي لاختبار smoke
    مباشر للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي لـ Matrix مقابل خادم Tuwunel homeserver مؤقت مدعوم بـ Docker. مخصص لنسخ المصدر فقط - التثبيتات المعبأة لا تشحن `qa-lab`.
  - CLI الكامل، وفهرس الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط الأدلة: [QA لـ Matrix](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رموز bot الخاصة بالمشغّل وSUT من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` للاعتمادات المجمّعة المشتركة. استخدم وضع البيئة افتراضياً، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في التأجيرات المجمّعة.
  - تغطي الافتراضيات canary، وبوابة الإشارات، وعنونة الأوامر، و`/status`، وردود bot-to-bot المشار إليها، وردود الأوامر الأصلية الأساسية. تغطي افتراضيات `mock-openai` أيضاً انحدارات سلسلة الردود الحتمية وبث الرسالة النهائية في Telegram. استخدم `--list-scenarios` للفحوصات الاختيارية مثل `session_status`.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد الأدلة دون رمز خروج فاشل.
  - يتطلب botين مختلفين في المجموعة الخاصة نفسها، مع كشف bot الخاص بـ SUT لاسم مستخدم Telegram.
  - للملاحظة المستقرة بين bot وbot، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا botين وتأكد من أن bot المشغّل يستطيع ملاحظة حركة bot في المجموعة.
  - يكتب تقرير QA لـ Telegram وملخصاً و`qa-evidence.json` ضمن `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال المشغّل إلى رد SUT المرصود.

`Mantis Telegram Live` هو غلاف دليل PR حول هذا المسار. يشغّل مرجع المرشح باستخدام اعتمادات Telegram مؤجرة من Convex، ويعرض حزمة تقرير/أدلة QA المنقحة في متصفح سطح مكتب Crabbox، ويسجل دليل MP4، ويولّد GIF مقصوصاً بالحركة، ويرفع حزمة الأدلة، وينشر دليل PR مضمناً عبر Mantis GitHub App عند ضبط `pr_number`. يستطيع المشرفون تشغيله من واجهة Actions عبر `Mantis Scenario` (`scenario_id:
telegram-live`) أو مباشرة من تعليق pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` هو غلاف Telegram Desktop الأصلي الوكيلي قبل/بعد لدليل PR المرئي. شغّله من واجهة Actions باستخدام `instructions` حرة، عبر `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`)، أو من تعليق PR:

```text
@openclaw-mantis telegram desktop proof
```

يقرأ وكيل Mantis ملف PR، ويقرر أي سلوك مرئي في Telegram يثبت التغيير، ويشغّل مسار دليل Telegram Desktop في Crabbox لمستخدم حقيقي على مراجع الأساس والمرشح، ويكرر حتى تصبح ملفات GIF الأصلية مفيدة، ويكتب بيان `motionPreview` مزدوجاً، وينشر جدول GIF نفسه بعمودين عبر Mantis GitHub App عند ضبط `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - يؤجر أو يعيد استخدام سطح مكتب Linux في Crabbox، ويثبّت Telegram Desktop الأصلي، ويهيئ OpenClaw برمز bot لـ Telegram SUT مؤجر، ويبدأ Gateway، ويسجل أدلة لقطة شاشة/MP4 من سطح مكتب VNC المرئي.
  - يستخدم افتراضياً `--credential-source convex` حتى لا تحتاج workflows إلا إلى سر وسيط Convex. استخدم `--credential-source env` مع متغيرات `OPENCLAW_QA_TELEGRAM_*` نفسها مثل `pnpm openclaw qa telegram`.
  - لا يزال Telegram Desktop يحتاج إلى تسجيل دخول/ملف شخصي لمستخدم. رمز bot يهيئ OpenClaw فقط. استخدم `--telegram-profile-archive-env <name>` لأرشيف ملف شخصي `.tgz` بترميز base64، أو استخدم `--keep-lease` وسجّل الدخول يدوياً عبر VNC مرة واحدة.
  - يكتب `mantis-telegram-desktop-builder-report.md` و`mantis-telegram-desktop-builder-summary.json` و`telegram-desktop-builder.png` و`telegram-desktop-builder.mp4` ضمن مجلد الإخراج.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ تعيش مصفوفة التغطية لكل مسار في [نظرة عامة على QA ← تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` هو الحزمة التركيبية الواسعة وليس جزءاً من تلك المصفوفة.

### اعتمادات Telegram المشتركة عبر Convex (v1)

عند تمكين `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
QA النقل الحي، يحصل مختبر QA على تأجير حصري من مجمّع مدعوم بـ Convex، ويرسل heartbeats لذلك
التأجير أثناء تشغيل المسار، ويحرر التأجير عند الإيقاف. يسبق اسم القسم
دعم Discord وSlack وWhatsApp؛ عقد التأجير مشترك عبر الأنواع.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (مثلاً `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- اختيار دور الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - افتراضي البيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (يكون افتراضياً `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL لـ Convex عبر local loopback `http://` للتطوير المحلي فقط.

ينبغي أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` بادئة `https://` في التشغيل العادي.

تتطلب أوامر إدارة المشرفين (إضافة/إزالة/سرد المجمّع)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديداً.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل التشغيلات الحية للتحقق من عنوان URL لموقع Convex، وأسرار الوسيط،
وبادئة نقطة النهاية، ومهلة HTTP، وإمكانية الوصول إلى الإدارة/السرد دون طباعة
قيم الأسرار. استخدم `--json` لمخرجات قابلة للقراءة آلياً في السكربتات وأدوات CI.

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
- يجب أن يكون `groupId` سلسلة معرّف دردشة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

شكل الحمولة لنوع مستخدم Telegram الحقيقي:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- يجب أن تكون `groupId` و`testerUserId` و`telegramApiId` سلاسل رقمية.
- يجب أن تكون `tdlibArchiveSha256` و`desktopTdataArchiveSha256` سلاسل SHA-256 hex.
- `kind: "telegram-user"` محجوز لـ workflow دليل Mantis Telegram Desktop. يجب ألا تقتنيه مسارات QA Lab العامة.

حمولات متعددة القنوات متحقق منها من الوسيط:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

يمكن لمسارات Slack أيضاً التأجير من المجمّع، لكن تحقق حمولة Slack حالياً
يعيش في مشغّل QA لـ Slack بدلاً من الوسيط. استخدم
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
لصفوف Slack.

### إضافة قناة إلى QA

تعيش بنية وأسماء مساعدي السيناريو لمهايئات القنوات الجديدة في [نظرة عامة على QA ← إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: نفّذ مشغّل النقل على seam مضيف `qa-lab` المشترك، وصرّح بـ `qaRunners` في بيان Plugin، وثبّته كـ `openclaw qa <runner>`، وألّف السيناريوهات ضمن `qa/scenarios/`.

## حزم الاختبار (ما الذي يعمل وأين)

فكّر في الحزم على أنها "واقعية متزايدة" (ومعها هشاشة/تكلفة متزايدة):

### الوحدة / التكامل (افتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم التشغيلات غير المستهدفة مجموعة shards في `vitest.full-*.config.ts` وقد توسّع shards متعددة المشاريع إلى إعدادات لكل مشروع للجدولة المتوازية
- الملفات: قوائم core/unit ضمن `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`؛ تعمل اختبارات وحدة UI في shard المخصص `unit-ui`
- النطاق:
  - اختبارات وحدة صرفة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، التوجيه، الأدوات، التحليل، الإعداد)
  - انحدارات حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
  - يجب أن تثبت اختبارات المحلل ومحمّل السطح العام سلوك fallback الواسع لـ `api.js` و
    `runtime-api.js` باستخدام تجهيزات Plugin صغيرة مولّدة، وليس
    واجهات API لمصدر Plugin الحقيقي المضمّن. تنتمي تحميلات API الحقيقية لـ Plugin إلى
    حزم العقد/التكامل المملوكة لـ Plugin.

سياسة الاعتماد الأصلي:

- تتخطى تثبيتات الاختبار الافتراضية عمليات بناء opus الأصلية الاختيارية لـ Discord. يستخدم صوت Discord `libopus-wasm` المضمّن، ويبقى `@discordjs/opus` معطلاً في `allowBuilds` حتى لا تجمع الاختبارات المحلية ومسارات Testbox الإضافة الأصلية.
- قارن أداء opus الأصلي في مستودع benchmark لـ `libopus-wasm`، وليس في حلقات تثبيت/اختبار OpenClaw الافتراضية. لا تضبط `@discordjs/opus` إلى `true` في `allowBuilds` الافتراضي؛ فهذا يجعل حلقات التثبيت/الاختبار غير ذات الصلة تجمع كوداً أصلياً.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - تُشغّل عمليات `pnpm test` غير المستهدفة اثني عشر تكوينًا أصغر للتقسيم (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) بدلًا من عملية أصلية عملاقة واحدة لمشروع الجذر. يقلّل هذا ذروة RSS على الأجهزة المحمّلة ويتجنب أن تتسبب أعمال auto-reply/extension في حرمان مجموعات اختبار غير مرتبطة من الموارد.
    - لا يزال `pnpm test --watch` يستخدم مخطط مشروع الجذر الأصلي `vitest.config.ts`، لأن حلقة مراقبة متعددة التقسيمات ليست عملية.
    - يوجّه `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر مسارات محددة النطاق أولًا، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع تكلفة بدء تشغيل مشروع الجذر كاملة.
    - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى مسارات محددة النطاق رخيصة افتراضيًا: تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، والتوابع المحلية في مخطط الاستيراد. لا تؤدي تعديلات config/setup/package إلى تشغيل اختبارات واسعة إلا إذا استخدمت صراحة `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هو بوابة الفحص المحلي الذكي العادية للعمل الضيق. يصنّف الفرق إلى core، واختبارات core، وextensions، واختبارات extension، وapps، وdocs، وبيانات إصدار وصفية، وأدوات Docker الحية، والأدوات، ثم يشغّل أوامر typecheck وlint وguard المطابقة. لا يشغّل اختبارات Vitest؛ استدعِ `pnpm test:changed` أو `pnpm test <target>` صراحة لإثبات الاختبارات. تشغّل زيادات الإصدار الخاصة ببيانات الإصدار الوصفية فقط فحوصات موجهة للإصدار/config/اعتمادات الجذر، مع حارس يرفض تغييرات package خارج حقل الإصدار الأعلى مستوى.
    - تشغّل تعديلات حزمة Live Docker ACP فحوصات مركّزة: صياغة shell لسكربتات مصادقة Live Docker وتجربة جافة لجدولة Live Docker. تُضمّن تغييرات `package.json` فقط عندما يقتصر الفرق على `scripts["test:docker:live-*"]`؛ أما تعديلات الاعتمادات، والتصدير، والإصدار، والأسطح الأخرى للحزمة فتظل تستخدم الحراس الأوسع.
    - تمر اختبارات الوحدة الخفيفة الاستيراد من agents، وcommands، وplugins، ومساعدات auto-reply، و`plugin-sdk`، ومناطق الأدوات النقية المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ وتبقى الملفات الثقيلة ذات الحالة/وقت التشغيل على المسارات الحالية.
    - تعيّن ملفات مصدر مساعد محددة من `plugin-sdk` و`commands` أيضًا تشغيلات وضع التغييرات إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، لذلك تتجنب تعديلات المساعدين إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
    - لدى `auto-reply` حاويات مخصصة لمساعدات core على المستوى الأعلى، واختبارات تكامل `reply.*` على المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. يقسّم CI كذلك الشجرة الفرعية للرد إلى تقسيمات agent-runner، وdispatch، وcommands/state-routing حتى لا تمتلك حاوية كثيفة الاستيراد واحدة ذيل Node كاملًا.
    - يتخطى CI العادي لـ PR/main عمدًا مسح دفعة extensions وتقسيم `agentic-plugins` الخاص بالإصدار فقط. يطلق Full Release Validation سير عمل الابن المنفصل `Plugin Prerelease` لهذه المجموعات الثقيلة في plugins/extensions على مرشحي الإصدارات.

  </Accordion>

  <Accordion title="تغطية المشغّل المضمّن">

    - عندما تغيّر مدخلات اكتشاف أدوات الرسائل أو سياق تشغيل
      Compaction، أبقِ كلا مستويي التغطية.
    - أضف اختبارات تراجع مركّزة للمساعدات للحدود النقية الخاصة بالتوجيه والتطبيع.
    - حافظ على سلامة مجموعات تكامل المشغّل المضمّن:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, و
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه المجموعات من أن المعرّفات محددة النطاق وسلوك Compaction لا يزالان يتدفقان
      عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ اختبارات المساعدات فقط
      ليست بديلًا كافيًا لتلك مسارات التكامل.

  </Accordion>

  <Accordion title="افتراضيات تجمّع Vitest والعزل">

    - يضبط تكوين Vitest الأساسي القيمة الافتراضية على `threads`.
    - يثبّت تكوين Vitest المشترك `isolate: false` ويستخدم المشغّل
      غير المعزول عبر مشاريع الجذر، وتكوينات e2e، والتكوينات الحية.
    - يحافظ مسار UI الجذري على إعداد `jsdom` والمُحسّن الخاصين به، لكنه يعمل أيضًا على
      المشغّل المشترك غير المعزول.
    - يرث كل تقسيم `pnpm test` نفس افتراضيات `threads` + `isolate: false`
      من تكوين Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node الابنة
      الخاصة بـ Vitest افتراضيًا لتقليل اضطراب ترجمة V8 أثناء التشغيلات المحلية الكبيرة.
      اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8
      القياسي.
    - ينهي `scripts/run-vitest.mjs` تشغيلات Vitest الصريحة غير المراقبة بعد
      5 دقائق بلا أي مخرجات stdout أو stderr. اضبط
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` لتعطيل المراقب لتحقيق
      صامت عمدًا.

  </Accordion>

  <Accordion title="التكرار المحلي السريع">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يفعّلها الفرق.
    - خطاف pre-commit خاص بالتنسيق فقط. يعيد إدراج الملفات المنسقة في الفهرس ولا
      يشغّل lint أو typecheck أو الاختبارات.
    - شغّل `pnpm check:changed` صراحة قبل التسليم أو الدفع عندما
      تحتاج إلى بوابة الفحص المحلي الذكي.
    - يوجّه `pnpm test:changed` عبر مسارات محددة النطاق رخيصة افتراضيًا. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر الوكيل
      أن تعديلًا في الحزمة أو config أو package أو العقد يحتاج فعلًا إلى تغطية
      Vitest أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه نفسه،
      لكن مع حد أعلى للعمال.
    - التحجيم التلقائي للعمال محليًا محافظ عمدًا ويتراجع
      عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، لذلك تُحدث تشغيلات Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
    - يضع تكوين Vitest الأساسي علامة على المشاريع/ملفات config باعتبارها
      `forceRerunTriggers` حتى تبقى إعادة تشغيل وضع التغييرات صحيحة عندما يتغير
      توصيل الاختبارات.
    - يحافظ التكوين على تفعيل `OPENCLAW_VITEST_FS_MODULE_CACHE` على المضيفين المدعومين؛
      اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت
      موقع ذاكرة تخزين مؤقت صريحًا واحدًا للتنميط المباشر.

  </Accordion>

  <Accordion title="تصحيح الأداء">

    - يفعّل `pnpm test:perf:imports` تقارير مدة استيراد Vitest إضافة إلى
      مخرجات تفصيل الاستيراد.
    - يحدد `pnpm test:perf:imports:changed` عرض التنميط نفسه على
      الملفات المتغيرة منذ `origin/main`.
    - تُكتب بيانات توقيت التقسيمات إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم تشغيلات التكوين الكامل مسار التكوين كمفتاح؛ وتُلحق تقسيمات CI ذات نمط التضمين اسم التقسيم حتى يمكن تتبع التقسيمات المفلترة
      بشكل منفصل.
    - عندما يظل اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل،
      أبقِ الاعتمادات الثقيلة خلف حد محلي ضيق `*.runtime.ts` و
      حاكِ ذلك الحد مباشرة بدلًا من الاستيراد العميق لمساعدات وقت التشغيل فقط
      لتمريرها عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين
      `test:changed` الموجّه ومسار مشروع الجذر الأصلي لذلك الفرق المثبّت
      ويطبع وقت الحائط إضافة إلى الحد الأقصى لـ RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة الحالية
      المتسخة عن طريق توجيه قائمة الملفات المتغيرة عبر
      `scripts/test-projects.mjs` وتكوين Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي من أجل
      بدء تشغيل Vitest/Vite وتكلفة التحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل من أجل
      مجموعة الوحدة مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- التكوين: `vitest.gateway.config.ts`، مفروض على عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا عبر loopback مع تفعيل التشخيصات افتراضيًا
  - يدفع رسائل gateway اصطناعية، وذاكرة، واضطراب حِمل كبير عبر مسار حدث التشخيص
  - يستعلم `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات استمرار حزمة استقرار التشخيصات
  - يؤكد أن المسجّل يبقى محدودًا، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق الصفوف لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج إلى مفاتيح
  - مسار ضيق لمتابعة تراجع الاستقرار، وليس بديلًا عن مجموعة Gateway الكاملة

### E2E (تجميع المستودع)

- الأمر: `pnpm test:e2e`
- النطاق:
  - يشغّل مسار E2E لدخان gateway
  - يشغّل مسار E2E للمتصفح المحاكى في Control UI
- التوقعات:
  - آمن لـ CI ولا يحتاج إلى مفاتيح
  - يتطلب تثبيت Playwright Chromium

### E2E (دخان gateway)

- الأمر: `pnpm test:e2e:gateway`
- التكوين: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts`، و`test/**/*.e2e.test.ts`، واختبارات E2E للـ bundled-plugin ضمن `extensions/`
- افتراضيات وقت التشغيل:
  - يستخدم `threads` في Vitest مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمالًا تكيفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل تكلفة إدخال/إخراج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل مخرجات وحدة التحكم المطوّلة.
- النطاق:
  - سلوك gateway من البداية إلى النهاية متعدد المثيلات
  - أسطح WebSocket/HTTP، وإقران العُقد، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تفعيله في خط المعالجة)
  - لا يتطلب مفاتيح حقيقية
  - أجزاء متحركة أكثر من اختبارات الوحدة (يمكن أن يكون أبطأ)

### E2E (متصفح Control UI المحاكى)

- الأمر: `pnpm test:ui:e2e`
- التكوين: `test/vitest/vitest.ui-e2e.config.ts`
- الملفات: `ui/src/**/*.e2e.test.ts`
- النطاق:
  - يبدأ Vite Control UI
  - يقود صفحة Chromium حقيقية عبر Playwright
  - يستبدل Gateway WebSocket بمحاكاة حتمية داخل المتصفح
- التوقعات:
  - يعمل في CI كجزء من `pnpm test:e2e`
  - لا يتطلب Gateway حقيقيًا أو agents أو مفاتيح مزوّدين
  - يجب أن تكون اعتمادية المتصفح موجودة (`pnpm --dir ui exec playwright install chromium`)

### E2E: دخان خلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يعيد استخدام OpenShell gateway محلي نشط
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يمرّن خلفية OpenShell الخاصة بـ OpenClaw عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات البعيد-القياسي عبر جسر sandbox fs
- التوقعات:
  - اشتراك اختياري فقط؛ ليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا باسم `openshell` إضافة إلى Docker daemon عامل
  - يتطلب OpenShell gateway محليًا نشطًا ومصدر تكوينه
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر sandbox الاختبار
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتفعيل الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو سكربت تغليف
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` لكشف تكوين gateway المسجل للاختبار المعزول
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` لتجاوز IP الخاص بـ Docker gateway الذي يستخدمه مثبّت سياسة المضيف

### مباشر (مزوّدون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`، و`test/**/*.live.test.ts`، واختبارات live للـ bundled-plugin ضمن `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزوّد/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - رصد تغييرات تنسيق المزوّد، وخصوصيات استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - ليست مستقرة على CI بالتصميم (شبكات حقيقية، سياسات مزوّدين حقيقية، حصص، انقطاعات)
  - تكلف مالًا / تستخدم حدود المعدل
  - يُفضّل تشغيل مجموعات فرعية محددة بدلًا من "كل شيء"
- تستخدم التشغيلات المباشرة مفاتيح API المصدّرة مسبقًا وملفات تعريف المصادقة المرحلية.
- افتراضيًا، لا تزال التشغيلات المباشرة تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى منزل اختبار مؤقت حتى لا تتمكن تجهيزات اختبارات الوحدة من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات المباشرة دليل المنزل الحقيقي لديك.
- يعتمد `pnpm test:live` افتراضيًا وضعًا أهدأ: يُبقي إخراج التقدم `[live] ...` ويكتم سجلات تمهيد Gateway/ثرثرة Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل كاملة.
- تدوير مفاتيح API (خاص بالمزوّد): اضبط `*_API_KEYS` بصيغة مفصولة بفواصل/فواصل منقوطة أو `*_API_KEY_1`، و`*_API_KEY_2` (مثل `OPENAI_API_KEYS`، و`ANTHROPIC_API_KEYS`، و`GEMINI_API_KEYS`) أو تجاوزًا لكل تشغيل مباشر عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- إخراج التقدم/Heartbeat:
  - تُصدر الحزم المباشرة الآن أسطر تقدم إلى stderr بحيث تظل استدعاءات المزوّد الطويلة نشطة بوضوح حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة تحكم Vitest بحيث تتدفق أسطر تقدم المزوّد/Gateway فورًا أثناء التشغيلات المباشرة.
  - اضبط Heartbeat النماذج المباشرة باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat Gateway/الفحص باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي حزمة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح "روبوتي متوقف" / أعطال خاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` محددًا

## اختبارات live (التي تلمس الشبكة)

لمصفوفة النماذج المباشرة، واختبارات دخان خلفية CLI، واختبارات دخان ACP، وحاضنة خادم تطبيق Codex، وكل اختبارات live لمزوّدي الوسائط (Deepgram، BytePlus، ComfyUI، الصور، الموسيقى، الفيديو، حاضنة الوسائط) - إضافةً إلى التعامل مع بيانات الاعتماد للتشغيلات المباشرة - راجع [اختبار حزم live](/ar/help/testing-live). وللقائمة المخصصة للتحقق من التحديثات وPlugin، راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

## مشغّلات Docker (فحوصات اختيارية لـ "يعمل على Linux")

تنقسم مشغّلات Docker هذه إلى فئتين:

- مشغّلات النماذج المباشرة: يشغّل `test:docker:live-models` و`test:docker:live-gateway` ملف live المطابق لمفتاح ملف التعريف فقط داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعداد المحلي لديك، ومساحة العمل، وملف env اختياري لملف التعريف. نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تحتفظ مشغّلات Docker المباشرة بسقوفها العملية الخاصة عند الحاجة:
  يعتمد `test:docker:live-models` افتراضيًا المجموعة المنسقة عالية الإشارة والمدعومة، ويعتمد
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. اضبط `OPENCLAW_LIVE_MAX_MODELS`
  أو متغيرات env الخاصة بـ Gateway عندما تريد صراحةً سقفًا أصغر أو فحصًا أوسع.
- يبني `test:docker:all` صورة Docker المباشرة مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كحزمة npm tarball من خلال `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة المجردة هي فقط مشغّل Node/Git لمسارات التثبيت/التحديث/اعتمادات Plugin؛ وتركّب تلك المسارات حزمة tarball المبنية مسبقًا. تثبّت الصورة الوظيفية حزمة tarball نفسها في `/app` لمسارات وظائف التطبيق المبني. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في فتحات العمليات، بينما تمنع سقوف الموارد مسارات live الثقيلة، وتثبيت npm، والمسارات متعددة الخدمات من البدء كلها في وقت واحد. إذا كان مسار واحد أثقل من السقوف النشطة، يستطيع المجدول مع ذلك تشغيله عندما يكون الحوض فارغًا ثم يُبقيه يعمل وحده حتى تتوفر السعة مجددًا. الافتراضيات هي 10 فتحات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما يكون لدى مضيف Docker مساحة أكبر. يجري المشغّل فحصًا تمهيديًا لـ Docker افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون دون بناء Docker أو تشغيله، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة، واحتياجات الحزم/الصور، وبيانات الاعتماد.
- `Package Acceptance` هي بوابة الحزم الأصلية في GitHub للسؤال "هل تعمل حزمة tarball القابلة للتثبيت هذه كمنتج؟" تحل مرشح حزمة واحدًا من `source=npm`، أو `source=ref`، أو `source=url`، أو `source=artifact`، وترفعه باسم `package-under-test`، ثم تشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد حزمة tarball تلك بالضبط بدلًا من إعادة تحزيم المرجع المحدد. تُرتب ملفات التعريف حسب الاتساع: `smoke`، و`package`، و`product`، و`full`. راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins) لعقد الحزمة/التحديث/Plugin، ومصفوفة النجاة من الترقية المنشورة، وافتراضيات الإصدار، وفرز الأعطال.
- تشغّل فحوصات البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يتتبع الحارس الرسم البياني المبني الثابت من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا كانت واردات بدء التشغيل قبل الإرسال تستورد اعتماديات الحزم مثل Commander، أو واجهة المطالبات، أو undici، أو التسجيل قبل إرسال الأمر؛ كما يُبقي قطعة تشغيل Gateway المضمّنة ضمن الميزانية ويرفض الواردات الثابتة لمسارات Gateway الباردة المعروفة. يغطي اختبار دخان CLI المحزّم أيضًا مساعدة الجذر، ومساعدة onboard، ومساعدة doctor، والحالة، ومخطط الإعداد، وأمر قائمة النماذج.
- يقتصر توافق قبول الحزمة القديم على `2026.4.25` (بما في ذلك `2026.4.25-beta.*`). حتى ذلك الحد، تتسامح الحاضنة فقط مع فجوات بيانات التعريف في الحزم المشحونة: إدخالات جرد QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات التصحيح في تجهيز git المشتق من حزمة tarball، وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة، وغياب استمرار سجل تثبيت السوق، وترحيل بيانات تعريف الإعداد أثناء `plugins update`. بالنسبة للحزم بعد `2026.4.25`، تكون تلك المسارات أعطالًا صارمة.
- مشغّلات دخان الحاويات: يقوم `test:docker:openwebui`، و`test:docker:onboard`، و`test:docker:npm-onboard-channel-agent`، و`test:docker:release-user-journey`، و`test:docker:release-typed-onboarding`، و`test:docker:release-media-memory`، و`test:docker:release-upgrade-user-journey`، و`test:docker:release-plugin-marketplace`، و`test:docker:skill-install`، و`test:docker:update-channel-switch`، و`test:docker:upgrade-survivor`، و`test:docker:published-upgrade-survivor`، و`test:docker:session-runtime-context`، و`test:docker:agents-delete-shared-workspace`، و`test:docker:gateway-network`، و`test:docker:browser-cdp-snapshot`، و`test:docker:mcp-channels`، و`test:docker:agent-bundle-mcp-tools`، و`test:docker:cron-mcp-cleanup`، و`test:docker:plugins`، و`test:docker:plugin-update`، و`test:docker:plugin-lifecycle-matrix`، و`test:docker:config-reload` بتشغيل حاوية حقيقية واحدة أو أكثر والتحقق من مسارات تكامل ذات مستوى أعلى.
- مسارات Docker/Bash E2E التي تثبّت حزمة OpenClaw tarball المجمّعة عبر `scripts/lib/openclaw-e2e-instance.sh` تحدد سقف `npm install` عند `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (الافتراضي `600s`؛ اضبط `0` لتعطيل الغلاف لأغراض التصحيح).

تقوم مشغّلات Docker للنماذج المباشرة أيضًا بتركيب منازل مصادقة CLI المطلوبة فقط (أو كل المنازل المدعومة عندما لا يكون التشغيل محددًا)، ثم تنسخها إلى منزل الحاوية قبل التشغيل حتى تتمكن OAuth الخاصة بـ CLI الخارجية من تحديث الرموز دون تعديل مخزن مصادقة المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- اختبار دخان ربط ACP: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude، وCodex، وGemini افتراضيًا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- اختبار دخان خلفية CLI: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار دخان حاضنة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- اختبارات دخان قابلية الملاحظة: `pnpm qa:otel:smoke`، و`pnpm qa:prometheus:smoke`، و`pnpm qa:observability:smoke` هي مسارات خاصة لـ QA من checkout المصدر. وهي ليست جزءًا من مسارات إصدار Docker للحزم عمدًا لأن حزمة npm tarball تحذف QA Lab.
- اختبار دخان Open WebUI المباشر: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج التهيئة (TTY، سقالات كاملة): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- اختبار دخان التهيئة/القناة/الوكيل لحزمة npm tarball: يثبّت `pnpm test:docker:npm-onboard-channel-agent` حزمة OpenClaw tarball المجمّعة عالميًا في Docker، ويعدّ OpenAI عبر تهيئة env-ref إضافةً إلى Telegram افتراضيًا، ويشغّل doctor، ويشغّل دورة وكيل OpenAI واحدة بمحاكاة. أعد استخدام حزمة tarball مبنية مسبقًا باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة بناء المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` أو `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- اختبار دخان رحلة مستخدم الإصدار: يثبّت `pnpm test:docker:release-user-journey` أرشيف OpenClaw المضغوط بصيغة tarball عالميًا في دليل Docker منزلي نظيف، ويشغّل الإعداد الأولي، ويضبط موفّر OpenAI وهميًا، ويشغّل دورة وكيل، ويثبّت/يزيل تثبيت plugins خارجية، ويضبط ClickClack مقابل fixture محلي، ويتحقق من المراسلة الصادرة/الواردة، ويعيد تشغيل Gateway، ويشغّل doctor.
- اختبار دخان الإعداد الأولي المكتوب للإصدار: يثبّت `pnpm test:docker:release-typed-onboarding` أرشيف tarball المضغوط، ويقود `openclaw onboard` عبر TTY حقيقي، ويضبط OpenAI كموفّر env-ref، ويتحقق من عدم استمرار أي مفتاح خام، ويشغّل دورة وكيل وهمية.
- اختبار دخان الوسائط/الذاكرة للإصدار: يثبّت `pnpm test:docker:release-media-memory` أرشيف tarball المضغوط، ويتحقق من فهم الصور من مرفق PNG، ومخرجات توليد صور متوافقة مع OpenAI، واستدعاء بحث الذاكرة، وبقاء الاستدعاء بعد إعادة تشغيل Gateway.
- اختبار دخان رحلة مستخدم ترقية الإصدار: يثبّت `pnpm test:docker:release-upgrade-user-journey` افتراضيًا أحدث خط أساس منشور أقدم من أرشيف tarball المرشح، ويضبط حالة الموفّر/Plugin/ClickClack على الحزمة المنشورة، ويرقّي إلى أرشيف tarball المرشح، ثم يعيد تشغيل رحلة الوكيل/Plugin/القناة الأساسية. إذا لم يوجد خط أساس منشور أقدم، فإنه يعيد استخدام إصدار المرشح. تجاوز خط الأساس باستخدام `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- اختبار دخان سوق Plugin للإصدار: يثبّت `pnpm test:docker:release-plugin-marketplace` من سوق fixture محلي، ويحدّث Plugin المثبّت، ويزيل تثبيته، ويتحقق من اختفاء CLI الخاص بـ Plugin مع تقليم بيانات تعريف التثبيت.
- اختبار دخان تثبيت Skills: يثبّت `pnpm test:docker:skill-install` أرشيف OpenClaw المضغوط بصيغة tarball عالميًا في Docker، ويعطّل تثبيتات الأرشيفات المرفوعة في الإعدادات، ويحل slug الخاص بـ Skills الحي الحالي من ClawHub عبر البحث، ويثبّته باستخدام `openclaw skills install`، ويتحقق من Skills المثبّتة بالإضافة إلى بيانات تعريف الأصل/القفل `.clawhub`.
- اختبار دخان تبديل قناة التحديث: يثبّت `pnpm test:docker:update-channel-switch` أرشيف OpenClaw المضغوط بصيغة tarball عالميًا في Docker، وينتقل من حزمة `stable` إلى git `dev`، ويتحقق من عمل القناة المستمرة وPlugin بعد التحديث، ثم يعود إلى حزمة `stable` ويفحص حالة التحديث.
- اختبار دخان ناجي الترقية: يثبّت `pnpm test:docker:upgrade-survivor` أرشيف OpenClaw المضغوط بصيغة tarball فوق fixture مستخدم قديم غير نظيف يحتوي على وكلاء، وإعدادات قناة، وقوائم سماح Plugin، وحالة تبعيات Plugin قديمة، وملفات مساحة عمل/جلسة موجودة. يشغّل تحديث الحزمة بالإضافة إلى doctor غير تفاعلي من دون موفّر حي أو مفاتيح قناة، ثم يبدأ Gateway loopback ويفحص الحفاظ على الإعدادات/الحالة بالإضافة إلى ميزانيات بدء التشغيل/الحالة.
- اختبار دخان ناجي الترقية المنشورة: يثبّت `pnpm test:docker:published-upgrade-survivor` افتراضيًا `openclaw@latest`، ويزرع ملفات مستخدم موجود واقعية، ويضبط ذلك الخط الأساسي باستخدام وصفة أوامر مضمّنة، ويتحقق من الإعدادات الناتجة، ويحدّث ذلك التثبيت المنشور إلى أرشيف tarball المرشح، ويشغّل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway loopback ويفحص intents المضبوطة، والحفاظ على الحالة، وبدء التشغيل، و`/healthz`، و`/readyz`، وميزانيات حالة RPC. تجاوز خط أساس واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، واطلب من المجدول التجميعي توسيع خطوط الأساس المحلية الدقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`، ووسّع fixtures بشكل issues باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues`؛ تتضمن مجموعة reported-issues `configured-plugin-installs` لإصلاح تثبيت OpenClaw Plugin خارجي تلقائيًا. يعرّض Package Acceptance هذه القيم باسم `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`، ويحل رموز خط الأساس الوصفية مثل `last-stable-4` أو `all-since-2026.4.23`، ويوسّع Full Release Validation بوابة حزمة release-soak إلى `last-stable-4 2026.4.23 2026.5.2 2026.4.15` بالإضافة إلى `reported-issues`.
- اختبار دخان سياق وقت تشغيل الجلسة: يتحقق `pnpm test:docker:session-runtime-context` من استمرار نص سياق وقت التشغيل المخفي بالإضافة إلى إصلاح doctor لفروع إعادة كتابة prompt المكررة المتأثرة.
- اختبار دخان التثبيت العالمي عبر Bun: يحزم `bash scripts/e2e/bun-global-install-smoke.sh` الشجرة الحالية، ويثبّتها باستخدام `bun install -g` في دليل منزلي معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد موفّري الصور المضمّنين بدلًا من التعليق. أعد استخدام أرشيف tarball مبني مسبقًا باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ بناء المضيف باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- اختبار دخان Docker للمثبّت: يشارك `bash scripts/test-install-sh-docker.sh` ذاكرة npm مؤقتة واحدة عبر حاويات root والتحديث وdirect-npm. يعتمد اختبار دخان التحديث افتراضيًا على npm `latest` كخط أساس stable قبل الترقية إلى أرشيف tarball المرشح. تجاوز ذلك محليًا باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، أو باستخدام إدخال `update_baseline_version` الخاص بسير عمل Install Smoke على GitHub. تبقي فحوصات المثبّت لغير root ذاكرة npm مؤقتة معزولة حتى لا تخفي إدخالات الذاكرة المؤقتة المملوكة لـ root سلوك التثبيت المحلي للمستخدم. اضبط `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة root/update/direct-npm المؤقتة عبر الإعادات المحلية.
- يتخطى Install Smoke CI التحديث العالمي المباشر المكرر عبر npm باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل السكربت محليًا من دون ذلك المتغير عندما تكون تغطية `npm install -g` المباشرة مطلوبة.
- اختبار دخان CLI لحذف الوكلاء لمساحة عمل مشتركة: يبني `pnpm test:docker:agents-delete-shared-workspace` (السكربت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) صورة Dockerfile الجذرية افتراضيًا، ويزرع وكيلين مع مساحة عمل واحدة في دليل منزلي لحاوية معزولة، ويشغّل `agents delete --json`، ويتحقق من JSON صالح بالإضافة إلى سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke باستخدام `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway (حاويتان، مصادقة WS + health): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- اختبار دخان لقطة Browser CDP: يبني `pnpm test:docker:browser-cdp-snapshot` (السكربت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) صورة E2E من المصدر بالإضافة إلى طبقة Chromium، ويبدأ Chromium مع CDP خام، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي عناوين URL للروابط، والعناصر القابلة للنقر التي تمت ترقيتها بالمؤشر، ومراجع iframe، وبيانات تعريف الإطار.
- انحدار reasoning الأدنى لـ OpenAI Responses web_search: يشغّل `pnpm test:docker:openai-web-search-minimal` (السكربت: `scripts/e2e/openai-web-search-minimal-docker.sh`) خادم OpenAI وهميًا عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط الموفّر ويفحص ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + اختبار دخان raw Claude notification-frame): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة OpenClaw (خادم MCP حقيقي عبر stdio + اختبار دخان سماح/رفض ملف تعريف OpenClaw مضمّن): `pnpm test:docker:agent-bundle-mcp-tools` (السكربت: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- تنظيف MCP لـ Cron/الوكيل الفرعي (Gateway حقيقي + تفكيك طفل MCP عبر stdio بعد تشغيلات cron معزولة ووكيل فرعي لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكربت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (اختبار دخان التثبيت/التحديث لمسار محلي، و`file:`، وسجل npm مع تبعيات مرفوعة، وبيانات تعريف حزمة npm مشوهة، ومراجع git متحركة، وClawHub kitchen-sink، وتحديثات السوق، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)
  اضبط `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/وقت التشغيل الافتراضي kitchen-sink باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. من دون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم fixture محليًا مغلقًا لـ ClawHub.
- اختبار دخان عدم تغيّر تحديث Plugin: `pnpm test:docker:plugin-update` (السكربت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- اختبار دخان مصفوفة دورة حياة Plugin: يثبّت `pnpm test:docker:plugin-lifecycle-matrix` أرشيف OpenClaw المضغوط بصيغة tarball في حاوية عارية، ويثبّت Plugin من npm، ويبدّل التمكين/التعطيل، ويرقّيه ويخفض إصداره عبر سجل npm محلي، ويحذف الكود المثبّت، ثم يتحقق من أن إلغاء التثبيت لا يزال يزيل الحالة القديمة مع تسجيل مقاييس RSS/CPU لكل مرحلة من مراحل دورة الحياة.
- اختبار دخان بيانات تعريف إعادة تحميل الإعدادات: `pnpm test:docker:config-reload` (السكربت: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: يغطي `pnpm test:docker:plugins` اختبار دخان التثبيت/التحديث لمسار محلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git متحركة، وfixtures لـ ClawHub، وتحديثات السوق، وتمكين/فحص حزمة Claude. يغطي `pnpm test:docker:plugin-update` سلوك التحديث غير المتغير للـ plugins المثبّتة. يغطي `pnpm test:docker:plugin-lifecycle-matrix` تثبيت Plugin من npm مع تتبع الموارد، وتمكينه، وتعطيله، وترقيته، وخفض إصداره، وإلغاء تثبيته عند فقدان الكود.

لبناء الصورة الوظيفية المشتركة مسبقًا وإعادة استخدامها يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بالمجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` صاحبة الأولوية عند ضبطها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكربتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات Docker الخاصة بـ QR والمثبّت بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلًا من وقت تشغيل التطبيق المبني المشترك.

تربط مشغّلات Docker للنماذج الحية أيضًا نسخة العمل الحالية للقراءة فقط عبر bind-mount
وتجهزها داخل دليل عمل مؤقت داخل الحاوية. يحافظ هذا على صورة runtime
نحيفة مع استمرار تشغيل Vitest مقابل المصدر/الإعدادات المحلية الدقيقة لديك.
تتجاوز خطوة التجهيز الذاكرات المخبئية المحلية الكبيرة ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة مخرجات `.build` المحلية للتطبيق أو
Gradle حتى لا تقضي عمليات Docker الحية دقائق في نسخ
عناصر خاصة بالجهاز.
كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات Gateway الحية
عمال قنوات Telegram/Discord/إلخ الحقيقيين داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر
`OPENCLAW_LIVE_GATEWAY_*` أيضًا عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
الحية من مسار Docker ذلك.
`test:docker:openwebui` هو فحص توافق دخاني أعلى مستوى: يبدأ حاوية
Gateway من OpenClaw مع تمكين نقاط نهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبتة الإصدار مقابل ذلك Gateway، ويسجل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` تعرض `openclaw/default`، ثم يرسل
طلب محادثة حقيقيًا عبر وكيل Open WebUI ‏`/api/chat/completions`.
اضبط `OPENWEBUI_SMOKE_MODE=models` لفحوصات CI الخاصة بمسار الإصدار التي يجب أن تتوقف
بعد تسجيل الدخول إلى Open WebUI واكتشاف النموذج، دون انتظار إكمال نموذج حي.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد يحتاج Open WebUI إلى إنهاء إعداد البدء البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج حي قابلًا للاستخدام. وفّره عبر بيئة العملية،
أو ملفات تعريف المصادقة المجهزة، أو `OPENCLAW_PROFILE_FILE` صريح.
تطبع عمليات التشغيل الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عن قصد ولا يحتاج إلى حساب
Telegram أو Discord أو iMessage حقيقي. يشغّل حاوية Gateway مزروعة البيانات،
ويبدأ حاوية ثانية تطلق `openclaw mcp serve`، ثم يتحقق من
اكتشاف المحادثات الموجّهة، وقراءات النصوص، وبيانات تعريف المرفقات،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات + الأذونات بأسلوب Claude
عبر جسر stdio MCP الحقيقي. يفحص تحقق الإشعارات
إطارات stdio MCP الخام مباشرة حتى يؤكد الفحص الدخاني ما يصدره
الجسر فعليًا، لا فقط ما يحدث أن تعرضه SDK عميل معينة.
`test:docker:agent-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبني صورة Docker للمستودع، ويبدأ خادم فحص stdio MCP حقيقيًا
داخل الحاوية، ويجسد ذلك الخادم عبر runtime حزمة OpenClaw المضمنة
لـ MCP، وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان
بأدوات `bundle-mcp` بينما تقوم `minimal` و`tools.deny: ["bundle-mcp"]` بترشيحها.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج حي.
يبدأ Gateway مزروع البيانات مع خادم فحص stdio MCP حقيقي، ويشغّل
دورة cron معزولة ودورة فرعية لمرة واحدة عبر `sessions_spawn`، ثم يتحقق
من خروج عملية MCP الفرعية بعد كل تشغيل.

فحص دخاني يدوي لسلاسل ACP باللغة العادية (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لسير عمل الانحدار/التصحيح. قد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه سلاسل ACP، لذا لا تحذفه.

متغيرات env مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) مركّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) مركّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` مركّب ومصدَّر قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات env المصدّرة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعداد/مساحة عمل مؤقتة ودون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) مركّب إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - تشغّل مزودات narrowed تركّب فقط الأدلة/الملفات المطلوبة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لترشيح المزودين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لإعادة التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن ملفات التعريف (وليس env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لفحص Open WebUI الدخاني
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز مطالبة التحقق من nonce التي يستخدمها فحص Open WebUI الدخاني
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## سلامة المستندات

شغّل فحوصات المستندات بعد تعديلات المستندات: `pnpm check:docs`.
شغّل تحقق Mintlify الكامل من المرساة عندما تحتاج إلى فحوصات عناوين داخل الصفحة أيضًا: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه انحدارات "مسار حقيقي" دون مزودين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة وكيل): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway ‏(WS `wizard.start`/`wizard.next`، يكتب الإعدادات + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء أدوات وهمي عبر Gateway الحقيقي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات المعالج من طرف إلى طرف التي تتحقق من توصيل الجلسات وتأثيرات الإعدادات (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودًا لـ Skills (انظر [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في المطالبة، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تؤكد ترتيب الأدوات، وحمل سجل الجلسة، وحدود sandbox.

يجب أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزودين وهميين لتأكيد استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وتوصيل الجلسة.
- مجموعة صغيرة من السيناريوهات المركزة على Skills (استخدام مقابل تجنب، بوابات، حقن المطالبات).
- تقييمات حية اختيارية (اشتراك اختياري، محكومة بـ env) فقط بعد وجود المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلين يتوافقان مع
عقد الواجهة الخاص بهما. تمر على جميع Plugins المكتشفة وتشغّل مجموعة من
تأكيدات الشكل والسلوك. يتجاوز مسار وحدة `pnpm test` الافتراضي عمدًا
ملفات seam والفحص الدخاني المشتركة هذه؛ شغّل أوامر العقود صراحة
عندما تلمس أسطح القنوات أو المزودين المشتركة.

### الأوامر

- جميع العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزودين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

موجودة في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي لـ Plugin (id، الاسم، القدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرفات السلاسل
- **directory** - واجهة API للدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزود

موجودة في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزودين

موجودة في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة API لفهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - runtime المزود
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تشغّلها

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة أو تعديل قناة أو Plugin مزود
- بعد إعادة هيكلة تسجيل أو اكتشاف Plugin

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة انحدارات (إرشادات)

عندما تصلح مشكلة مزود/نموذج اكتُشفت في التشغيل الحي:

- أضف انحدارًا آمنًا لـ CI إن أمكن (مزود mock/stub، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت حية بطبيعتها فقط (حدود معدل، سياسات مصادقة)، فأبقِ الاختبار الحي ضيقًا واختياريًا عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخلل:
  - خلل تحويل/إعادة تشغيل طلب المزود → اختبار نماذج مباشر
  - خلل في مسار جلسة/سجل/أدوات Gateway → فحص Gateway حي دخاني أو اختبار Gateway وهمي آمن لـ CI
- حاجز اجتياز SecretRef:
  - يستنتج `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا واحدًا مُعيّنًا لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض exec ids التي تحتوي على مقاطع اجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة مع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند معرفات الأهداف غير المصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذو صلة

- [اختبار التشغيل الحي](/ar/help/testing-live)
- [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)
- [CI](/ar/ci)
