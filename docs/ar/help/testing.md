---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات الانحدار لأخطاء النموذج/المزوّد
    - تصحيح أخطاء سلوك Gateway والوكيل
summary: 'عدة الاختبار: مجموعات اختبارات الوحدة وe2e والاختبارات الحية، ومشغلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-07-02T08:19:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

لدى OpenClaw ثلاث حزم Vitest (وحدة/تكامل، e2e، مباشر) ومجموعة صغيرة
من مشغلات Docker. هذا المستند هو دليل "كيف نختبر":

- ما تغطيه كل حزمة (وما لا تغطيه _عمدا_).
- الأوامر التي ينبغي تشغيلها لسير العمل الشائع (محلي، قبل الدفع، التصحيح).
- كيف تكتشف الاختبارات المباشرة بيانات الاعتماد وتختار النماذج/الموفرين.
- كيف تضيف اختبارات منع تراجع لمشكلات النماذج/الموفرين الواقعية.

<Note>
**حزمة QA (`qa-lab`، و`qa-channel`، ومسارات النقل المباشر)** موثقة بشكل منفصل:

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation) - البنية، وسطح الأوامر، وتأليف السيناريوهات.
- [Matrix QA](/ar/concepts/qa-matrix) - مرجع لـ `pnpm openclaw qa matrix`.
- [بطاقة نضج الأداء](/ar/maturity/scorecard) - كيف تدعم أدلة QA الخاصة بالإصدار قرارات الاستقرار وLTS.
- [قناة QA](/ar/channels/qa-channel) - Plugin النقل الاصطناعي المستخدم بواسطة السيناريوهات المدعومة بالمستودع.

تغطي هذه الصفحة تشغيل حزم الاختبار العادية ومشغلات Docker/Parallels. يسرد قسم المشغلات الخاصة بـ QA أدناه ([المشغلات الخاصة بـ QA](#qa-specific-runners)) استدعاءات `qa` المحددة ويشير مرة أخرى إلى المراجع أعلاه.
</Note>

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل محلي أسرع للحزمة الكاملة على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest المباشرة: `pnpm test:watch`
- الاستهداف المباشر للملفات يوجه الآن مسارات الإضافات/القنوات أيضا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضل التشغيلات المستهدفة أولا عندما تكرر العمل على فشل واحد.
- موقع QA المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- حزمة E2E: `pnpm test:e2e`

## مجلدات الاختبار المؤقتة

فضل المساعدات المشتركة في `test/helpers/temp-dir.ts` للمجلدات
المؤقتة المملوكة للاختبار. إنها تجعل الملكية صريحة وتبقي التنظيف ضمن دورة
حياة الاختبار نفسها:

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

لا يعرض `useAutoCleanupTempDirTracker()` عمدا أي طريقة تنظيف يدوية؛ يمتلك Vitest
التنظيف بعد كل اختبار. تبقى المساعدات منخفضة المستوى الموجودة للاختبارات التي
لم تنتقل بعد، لكن ينبغي للاختبارات الجديدة والمهاجرة استخدام المتتبع
ذاتي التنظيف. تجنب استخدامات `makeTempDir` أو `cleanupTempDirs` أو
`createTempDirTracker` اليدوية الجديدة، وتجنب استدعاءات `fs.mkdtemp*` المجردة
الجديدة في الاختبارات ما لم تكن الحالة تتحقق صراحة من سلوك المجلدات المؤقتة الخام.
أضف تعليق سماح قابل للتدقيق مع سبب محدد عندما يحتاج اختبار عمدا إلى مجلد مؤقت مجرد:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

لإظهار الهجرة، يبلّغ `node scripts/report-test-temp-creations.mjs` عن إنشاء
مجلدات مؤقتة مجردة جديدة وعن استخدامات يدوية جديدة للمساعد المشترك في أسطر
الفروق المضافة من دون حظر أنماط التنظيف الموجودة. يتبع نطاق ملفه عمدا
تصنيف مسار الاختبار نفسه المستخدم بواسطة `scripts/changed-lanes.mjs`
بدلا من الحفاظ على استدلال منفصل لأسماء ملفات مساعدات الاختبار، مع تخطي
تنفيذ المساعد المشترك نفسه. يشغل `check:changed` هذا التقرير لمسارات الاختبار
المتغيرة كإشارة CI تحذيرية فقط؛ النتائج هي تعليقات تحذير GitHub، وليست حالات فشل.

عند تصحيح موفرين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- الحزمة المباشرة (نماذج + فحوصات أدوات/صور Gateway): `pnpm test:live`
- استهداف ملف مباشر واحد بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- تقارير أداء وقت التشغيل: شغّل `OpenClaw Performance` مع
  `live_openai_candidate=true` لدورة وكيل `openai/gpt-5.5` حقيقية أو
  `deep_profile=true` لآثار Kova الخاصة بالمعالج/الذاكرة/التتبع. تنشر التشغيلات
  اليومية المجدولة آثار مسارات الموفر الوهمي، والتوصيف العميق، وGPT 5.5 إلى
  `openclaw/clawgrit-reports` عندما يكون `CLAWGRIT_REPORTS_TOKEN` مهيأ. يتضمن
  تقرير الموفر الوهمي أيضا أرقام تمهيد Gateway على مستوى المصدر، والذاكرة،
  وضغط Plugin، وحلقة ترحيب متكررة بنموذج وهمي، وبدء تشغيل CLI.
- مسح النماذج المباشر عبر Docker: `pnpm test:docker:live-models`
  - يشغل كل نموذج محدد الآن دورة نصية بالإضافة إلى فحص صغير بأسلوب قراءة ملف.
    النماذج التي تعلن بياناتها الوصفية عن إدخال `image` تشغل أيضا دورة صورة صغيرة.
    عطّل الفحوصات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل حالات فشل الموفر.
  - تغطية CI: يستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومي
    و`OpenClaw Release Checks` اليدوي سير العمل المباشر/E2E القابل لإعادة
    الاستخدام مع `include_live_suites: true`، مما يتضمن وظائف مصفوفة نماذج
    مباشرة منفصلة في Docker مقسمة حسب الموفر.
  - لإعادة تشغيل CI مركزة، شغّل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و`live_models_only: true`.
  - أضف أسرار الموفرين الجديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    بالإضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
    ومستدعيه المجدولين/الخاصة بالإصدار.
- اختبار دخان المحادثة المربوطة الأصلي لـ Codex: `pnpm test:docker:live-codex-bind`
  - يشغل مسارا مباشرا عبر Docker مقابل مسار خادم تطبيق Codex، ويربط رسالة Slack DM
    اصطناعية باستخدام `/codex bind`، ويمارس `/codex fast` و
    `/codex permissions`، ثم يتحقق من رد عادي ومرفق صورة يمران عبر ربط Plugin
    الأصلي بدلا من ACP.
- اختبار دخان حزمة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغل دورات وكيل Gateway عبر حزمة خادم تطبيق Codex المملوكة لـ Plugin،
    ويتحقق من `/codex status` و`/codex models`، وبشكل افتراضي يمارس فحوصات الصورة،
    وCron MCP، والوكيل الفرعي، وGuardian. عطّل فحص الوكيل الفرعي باستخدام
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند عزل حالات فشل أخرى
    في خادم تطبيق Codex. لفحص وكيل فرعي مركز، عطّل الفحوصات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    يخرج هذا بعد فحص الوكيل الفرعي ما لم يتم ضبط
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- اختبار دخان تثبيت Codex عند الطلب: `pnpm test:docker:codex-on-demand`
  - يثبت أرشيف OpenClaw المعبأ في Docker، ويشغل إعداد مفتاح OpenAI API،
    ويتحقق من أن Plugin Codex وتبعية `@openai/codex` تم تنزيلهما إلى جذر
    مشروع npm المدار عند الطلب.
- اختبار دخان تبعية أداة Plugin المباشر: `pnpm test:docker:live-plugin-tool`
  - يعبئ Plugin ثابتة مع تبعية `slugify` حقيقية، ويثبتها عبر
    `npm-pack:`، ويتحقق من التبعية تحت جذر مشروع npm المدار،
    ثم يطلب من نموذج OpenAI مباشر استدعاء أداة Plugin وإرجاع الـ slug المخفي.
- اختبار دخان أمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري احتياطي لسطح أمر الإنقاذ لقناة الرسائل. يمارس
    `/crestodian status`، ويضع في الطابور تغييرا مستمرا للنموذج،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة التدقيق/الإعدادات.
- اختبار دخان مخطط Crestodian عبر Docker: `pnpm test:docker:crestodian-planner`
  - يشغل Crestodian في حاوية بلا إعدادات مع Claude CLI وهمي على `PATH`
    ويتحقق من أن رجوع المخطط التقريبي يترجم إلى كتابة إعدادات نوعية ومدققة.
- اختبار دخان التشغيل الأول لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من مجلد حالة OpenClaw فارغ، ويتحقق من نقطة دخول Crestodian الحديثة
    في الإعداد، ويطبق كتابات الإعداد/النموذج/الوكيل/Plugin Discord + SecretRef،
    ويتحقق من الإعدادات، ويتحقق من إدخالات التدقيق. مسار إعداد Ring 0 نفسه
    مغطى أيضا في QA Lab بواسطة
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- اختبار دخان تكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مع `moonshot/kimi-k2.6`. تحقق من أن JSON يبلغ عن Moonshot/K2.6 وأن سجل
  المساعد يخزن `usage.cost` المطبعة.

<Tip>
عندما تحتاج إلى حالة فاشلة واحدة فقط، فضل تضييق الاختبارات المباشرة عبر متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## المشغلات الخاصة بـ QA

تقع هذه الأوامر بجانب حزم الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغل CI ‏QA Lab في سير عمل مخصصة. تكافؤ الوكلاء متداخل تحت
`QA-Lab - All Lanes` والتحقق من الإصدار، وليس سير عمل PR مستقلا.
ينبغي للتحقق الواسع استخدام `Full Release Validation` مع
`rerun_group=qa-parity` أو مجموعة QA الخاصة بفحوصات الإصدار. تبقي فحوصات
الإصدار المستقر/الافتراضي النقع المباشر/Docker الشامل خلف `run_release_soak=true`؛
يفرض ملف التعريف `full` تشغيل النقع. يعمل `QA-Lab - All Lanes`
ليليا على `main` ومن التشغيل اليدوي مع مسار التكافؤ الوهمي، ومسار Matrix المباشر،
ومسار Telegram المباشر المدار بواسطة Convex، ومسار Discord المباشر المدار بواسطة
Convex كوظائف متوازية. تمرر QA المجدولة وفحوصات الإصدار Matrix
`--profile fast` صراحة، بينما يبقى إدخال سير العمل اليدوي وCLI Matrix افتراضيا
على `all`؛ يمكن للتشغيل اليدوي تقسيم `all` إلى وظائف `transport`،
و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`. يشغل
`OpenClaw Release Checks` التكافؤ بالإضافة إلى مسارات Matrix السريع وTelegram
قبل موافقة الإصدار، باستخدام `mock-openai/gpt-5.5` لفحوصات نقل الإصدار كي تبقى
حتمية وتتجنب بدء تشغيل Plugin الموفر العادي. تعطل بوابات النقل المباشر هذه
بحث الذاكرة؛ يبقى سلوك الذاكرة مغطى بحزم تكافؤ QA.

تستخدم أجزاء وسائط الإصدار المباشر الكامل
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، الذي يحتوي بالفعل على
`ffmpeg` و`ffprobe`. تستخدم أجزاء نماذج/خلفيات Docker المباشرة صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة المبنية مرة واحدة لكل
التزام محدد، ثم تسحبها مع `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلا من إعادة بنائها
داخل كل جزء.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة من المستودع مباشرة على المضيف.
  - يكتب عناصر `qa-evidence.json` و`qa-suite-summary.json` و
    `qa-suite-report.md` عالية المستوى لمجموعة السيناريوهات المحددة، بما في ذلك
    اختيارات سيناريوهات التدفق المختلط وVitest وPlaywright.
  - عند إرساله بواسطة `pnpm openclaw qa run --qa-profile <profile>`، يضمّن
    بطاقة درجات ملف تصنيف taxonomy المحدد في `qa-evidence.json` نفسه.
    يكتب `smoke-ci` أدلة مختصرة، ما يضبط `evidenceMode: "slim"` ويحذف
    `execution` لكل إدخال. يغطي `release` الشريحة المنسقة لجاهزية الإصدار؛
    ويحدد `all` كل فئات النضج النشطة، وهو مخصص لعمليات إرسال سير عمل
    Profile Evidence في QA الصريحة عندما تكون هناك حاجة إلى عنصر بطاقة درجات
    كامل.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا باستخدام عمال gateway معزولين.
    القيمة الافتراضية لتزامن `qa-channel` هي 4 (محدودة بعدد السيناريوهات
    المحددة). استخدم `--concurrency <count>` لضبط عدد العمال، أو
    `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد العناصر دون رمز خروج فاشل.
  - يدعم أوضاع الموفر `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم موفر محليًا مدعومًا بـ AIMock لتغطية fixture
    التجريبية ومحاكاة البروتوكول دون استبدال مسار `mock-openai` الواعي
    بالسيناريوهات.
- `pnpm openclaw qa coverage --match <query>`
  - يبحث في معرّفات السيناريوهات والعناوين والأسطح ومعرّفات التغطية ومراجع
    المستندات ومراجع الكود والplugins ومتطلبات الموفر، ثم يطبع أهداف الحزمة
    المطابقة.
  - استخدم هذا قبل تشغيل QA Lab عندما تعرف السلوك المتأثر أو مسار الملف
    ولكن لا تعرف أصغر سيناريو. هو إرشادي فقط؛ لا تزال بحاجة إلى اختيار إثبات
    المحاكاة أو التشغيل الحي أو Multipass أو Matrix أو النقل من السلوك الجاري
    تغييره.
- `pnpm test:plugins:kitchen-sink-live`
  - يشغّل اختبار التحمل الحي لـ Plugin OpenAI Kitchen Sink عبر QA Lab. يثبت
    حزمة Kitchen Sink الخارجية، ويتحقق من مخزون سطح SDK الخاص بالPlugin،
    ويفحص `/healthz` و`/readyz`، ويسجل أدلة CPU/RSS للGateway، ويشغّل دورة
    OpenAI حية، ويفحص التشخيصات العدائية. يتطلب مصادقة OpenAI حية مثل
    `OPENAI_API_KEY`. في جلسات Testbox المهيأة، يحمّل تلقائيًا ملف مصادقة
    Testbox الحية عندما يكون مساعد `openclaw-testbox-env` موجودًا.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل قياس بدء تشغيل الGateway إضافة إلى حزمة صغيرة من سيناريوهات QA Lab
    المحاكية (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) ويكتب ملخص ملاحظة CPU مدمجًا تحت
    `.artifacts/gateway-cpu-scenarios/`.
  - يعلّم افتراضيًا فقط ملاحظات CPU الساخنة المستمرة (`--cpu-core-warn`
    إضافة إلى `--hot-wall-warn-ms`)، لذلك تُسجل اندفاعات بدء التشغيل القصيرة
    كمقاييس دون أن تبدو مثل تراجع تثبيت الGateway الممتد لدقائق.
  - يستخدم عناصر `dist` المبنية؛ شغّل بناءً أولًا عندما لا يحتوي checkout
    بالفعل على مخرجات تشغيل حديثة.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل حزمة QA نفسها داخل آلة Multipass Linux افتراضية مؤقتة.
  - يحافظ على سلوك اختيار السيناريوهات نفسه مثل `qa suite` على المضيف.
  - يعيد استخدام أعلام اختيار الموفر/النموذج نفسها مثل `qa suite`.
  - تمرر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح الموفر المستندة إلى env، ومسار إعداد موفر QA الحي، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى أدلة الإخراج تحت جذر المستودع كي يتمكن الضيف من الكتابة مرة
    أخرى عبر مساحة العمل المركبة.
  - يكتب تقرير QA والملخص العاديين إضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لعمل QA بأسلوب المشغل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني tarball npm من checkout الحالي، ويثبته عالميًا في Docker، ويشغّل
    إعداد OpenAI API-key غير تفاعلي، ويضبط Telegram افتراضيًا، ويتحقق من أن
    تشغيل الPlugin المعبأ يحمّل دون إصلاح تبعيات بدء التشغيل، ويشغّل doctor،
    ويشغّل دورة agent محلية واحدة ضد نقطة نهاية OpenAI محاكية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ
    نفسه مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل smoke حتميًا في Docker لتطبيق مبني لنصوص سياق التشغيل المضمنة.
    يتحقق من أن سياق تشغيل OpenClaw المخفي محفوظ كرسالة مخصصة غير معروضة
    بدلًا من تسربه إلى دورة المستخدم المرئية، ثم يزرع جلسة JSONL معطلة متأثرة
    ويتحقق من أن `openclaw doctor --fix` يعيد كتابتها إلى الفرع النشط مع نسخة
    احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبت مرشح حزمة OpenClaw في Docker، ويشغّل إعداد الحزمة المثبتة، ويضبط
    Telegram عبر CLI المثبت، ثم يعيد استخدام مسار QA الحي لـ Telegram مع تلك
    الحزمة المثبتة بوصفها Gateway النظام قيد الاختبار.
  - يركب الغلاف مصدر harness الخاص بـ `qa-lab` فقط من checkout؛ تمتلك الحزمة
    المثبتة `dist` و`openclaw/plugin-sdk` وتشغيل الPlugin المضمن كي لا يخلط
    المسار plugins من checkout الحالي داخل الحزمة قيد الاختبار.
  - القيمة الافتراضية هي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛
    عيّن `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار tarball محلي محلول بدلًا من التثبيت
    من السجل.
  - يصدر توقيت RTT متكررًا في `qa-evidence.json` افتراضيًا باستخدام
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. تجاوز
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES` أو
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` أو
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` لضبط تشغيل RTT.
    يقبل `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` قائمة مفصولة بفواصل من معرّفات
    فحص QA لـ Telegram لأخذ عينات منها؛ عندما لا يكون مضبوطًا، يكون الفحص
    الافتراضي القادر على RTT هو `telegram-mentioned-message-reply`.
  - يستخدم بيانات اعتماد env نفسها لـ Telegram أو مصدر بيانات اعتماد Convex
    مثل `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، عيّن
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` إضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور. إذا كان
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI، يحدد غلاف
    Docker Convex تلقائيًا.
  - يتحقق الغلاف من env بيانات اعتماد Telegram أو Convex على المضيف قبل عمل
    بناء/تثبيت Docker. عيّن `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    فقط عند تصحيح إعداد ما قبل بيانات الاعتماد عمدًا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` المتغير
    المشترك `OPENCLAW_QA_CREDENTIAL_ROLE` لهذا المسار فقط. عند تحديد بيانات
    اعتماد Convex وعدم ضبط أي دور، يستخدم الغلاف `ci` في CI و`maintainer`
    خارج CI.
  - تعرض GitHub Actions هذا المسار كسير عمل يدوي للمشرفين باسم
    `NPM Telegram Beta E2E`. لا يعمل عند الدمج. يستخدم سير العمل بيئة
    `qa-live-shared` وإيجارات بيانات اعتماد Convex CI.
- تعرض GitHub Actions أيضًا `Package Acceptance` لإثبات منتج جانبي مقابل
  حزمة مرشحة واحدة. يقبل مرجعًا موثوقًا، أو مواصفة npm منشورة، أو URL tarball
  عبر HTTPS مع SHA-256، أو عنصر tarball من تشغيل آخر، ويرفع
  `openclaw-current.tgz` الموحّد باسم `package-under-test`، ثم يشغّل مجدول
  Docker E2E الحالي بملفات تعريف مسارات smoke أو package أو product أو full
  أو custom. عيّن `telegram_mode=mock-openai` أو `live-frontier` لتشغيل سير عمل
  QA لـ Telegram مقابل عنصر `package-under-test` نفسه.
  - أحدث إثبات منتج beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات URL tarball الدقيق ملخصًا ويستخدم سياسة سلامة URL العامة:

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

يقرأ `source=trusted-url` ملف `.github/package-trusted-sources.json` من مرجع
سير العمل الموثوق ولا يقبل بيانات اعتماد URL أو تجاوز شبكة خاصة عبر مدخل
سير العمل. إذا أعلنت السياسة المسماة مصادقة bearer، فاضبط السر الثابت
`OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- ينزّل إثبات العنصر tarball من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - يحزم ويثبت بناء OpenClaw الحالي في Docker، ويبدأ الGateway مع إعداد
    OpenAI، ثم يفعّل القنوات/الplugins المضمنة عبر تعديلات الإعداد.
  - يتحقق من أن اكتشاف الإعداد يترك الplugins القابلة للتنزيل غير المضبوطة
    غائبة، وأن أول إصلاح doctor مضبوط يثبت كل Plugin قابل للتنزيل مفقود
    صراحة، وأن إعادة التشغيل الثانية لا تشغّل إصلاح تبعيات مخفيًا.
  - يثبت أيضًا خط أساس npm أقدم معروفًا، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن doctor بعد تحديث المرشح
    ينظف بقايا تبعيات الPlugin القديمة دون إصلاح postinstall من جانب harness.
- `pnpm test:parallels:npm-update`
  - يشغّل smoke تحديث التثبيت المعبأ الأصلي عبر ضيوف Parallels. يثبت كل
    نظام أساسي محدد أولًا حزمة خط الأساس المطلوبة، ثم يشغّل أمر
    `openclaw update` المثبت في الضيف نفسه ويتحقق من الإصدار المثبت وحالة
    التحديث وجاهزية الGateway ودورة agent محلية واحدة.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux`
    أثناء التكرار على ضيف واحد. استخدم `--json` لمسار عنصر الملخص وحالة كل
    مسار.
  - يستخدم مسار OpenAI `openai/gpt-5.5` لإثبات دورة agent الحية افتراضيًا.
    مرّر `--model <provider/model>` أو عيّن `OPENCLAW_PARALLELS_OPENAI_MODEL`
    عند التحقق عمدًا من نموذج OpenAI آخر.
  - غلّف التشغيلات المحلية الطويلة بمهلة على المضيف كي لا تستهلك حالات توقف
    نقل Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسارات متداخلة تحت `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي متوقف.
  - يمكن أن يستغرق تحديث Windows من 10 إلى 15 دقيقة في doctor بعد التحديث
    وعمل تحديث الحزمة على ضيف بارد؛ يظل ذلك سليمًا عندما يكون سجل تصحيح npm
    المتداخل يتقدم.
  - لا تشغّل هذا الغلاف المجمع بالتوازي مع مسارات smoke الفردية لـ Parallels
    macOS أو Windows أو Linux. فهي تشترك في حالة VM ويمكن أن تتصادم عند
    استعادة snapshot أو تقديم الحزمة أو حالة Gateway الضيف.
  - يشغّل إثبات ما بعد التحديث سطح الPlugin المضمن العادي لأن واجهات capability
    مثل الكلام وتوليد الصور وفهم الوسائط تُحمّل عبر APIs التشغيل المضمنة حتى
    عندما تفحص دورة agent نفسها استجابة نصية بسيطة.

- `pnpm openclaw qa aimock`
  - يبدأ خادم موفر AIMock المحلي فقط لاختبار دخان البروتوكول المباشر.
- `pnpm openclaw qa matrix`
  - يشغّل مسار ضمان الجودة الحي لـ Matrix مقابل خادم Tuwunel منزلي مؤقت مدعوم بـ Docker. متاح فقط في نسخة مصدرية - التثبيتات المعبأة لا تشحن `qa-lab`.
  - CLI الكامل، وفهرس الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط المصنوعات: [ضمان جودة Matrix](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار ضمان الجودة الحي لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رموز بوت المشغّل وSUT من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف محادثة Telegram الرقمي.
  - يدعم `--credential-source convex` للاعتمادات المجمّعة المشتركة. استخدم وضع البيئة افتراضيًا، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في عقود التأجير المجمّعة.
  - تغطي الإعدادات الافتراضية الكناري، وبوابة الذكر، وعنونة الأوامر، و`/status`، وردود البوتات المذكورة بين البوتات، وردود الأوامر الأصلية الأساسية. تغطي إعدادات `mock-openai` الافتراضية أيضًا انحدارات سلسلة الردود الحتمية وبث الرسالة النهائية في Telegram. استخدم `--list-scenarios` للمجسات الاختيارية مثل `session_status`.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما تريد المصنوعات بدون رمز خروج فاشل.
  - يتطلب بوتين مميزين في المجموعة الخاصة نفسها، مع أن يعرّض بوت SUT اسم مستخدم Telegram.
  - لمراقبة مستقرة بين البوتات، فعّل وضع اتصال بوت إلى بوت في `@BotFather` لكلا البوتين وتأكد من أن بوت المشغّل يمكنه مراقبة حركة مرور بوتات المجموعة.
  - يكتب تقرير ضمان جودة Telegram وملخصًا و`qa-evidence.json` ضمن `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد RTT من طلب إرسال المشغّل إلى رد SUT المرصود.

`Mantis Telegram Live` هو غلاف دليل PR حول هذا المسار. يشغّل مرجع المرشح باستخدام اعتماديات Telegram مؤجرة من Convex، ويعرض حزمة تقرير/دليل ضمان الجودة المنقّحة في متصفح سطح مكتب Crabbox، ويسجّل دليل MP4، وينشئ GIF مقصوص الحركة، ويرفع حزمة المصنوعات، وينشر دليل PR مضمّنًا عبر تطبيق Mantis GitHub عند تعيين `pr_number`. يمكن للمشرفين تشغيله من واجهة Actions عبر `Mantis Scenario` (`scenario_id:
telegram-live`) أو مباشرة من تعليق على طلب سحب:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` هو غلاف Telegram Desktop الأصلي الوكيلي قبل/بعد لدليل PR المرئي. شغّله من واجهة Actions باستخدام `instructions` حرّة الصياغة، أو عبر `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`)، أو من تعليق PR:

```text
@openclaw-mantis telegram desktop proof
```

يقرأ وكيل Mantis طلب PR، ويقرر السلوك المرئي في Telegram الذي يثبت التغيير، ويشغّل مسار دليل Crabbox Telegram Desktop للمستخدم الحقيقي على مراجع الأساس والمرشح، ويكرر حتى تصبح ملفات GIF الأصلية مفيدة، ويكتب بيان `motionPreview` مزدوجًا، وينشر جدول GIF نفسه ذي العمودين عبر تطبيق Mantis GitHub عند تعيين `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - يستأجر أو يعيد استخدام سطح مكتب Linux من Crabbox، ويثبّت Telegram Desktop الأصلي، ويهيئ OpenClaw برمز بوت SUT مؤجر لـ Telegram، ويبدأ Gateway، ويسجل دليل لقطة شاشة/MP4 من سطح مكتب VNC المرئي.
  - يستخدم افتراضيًا `--credential-source convex` بحيث تحتاج سير العمل إلى سر وسيط Convex فقط. استخدم `--credential-source env` مع متغيرات `OPENCLAW_QA_TELEGRAM_*` نفسها مثل `pnpm openclaw qa telegram`.
  - لا يزال Telegram Desktop يحتاج إلى تسجيل دخول/ملف شخصي للمستخدم. رمز البوت يهيئ OpenClaw فقط. استخدم `--telegram-profile-archive-env <name>` لأرشيف ملف شخصي `.tgz` بترميز base64، أو استخدم `--keep-lease` وسجّل الدخول يدويًا عبر VNC مرة واحدة.
  - يكتب `mantis-telegram-desktop-builder-report.md` و`mantis-telegram-desktop-builder-summary.json` و`telegram-desktop-builder.png` و`telegram-desktop-builder.mp4` ضمن دليل الإخراج.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة؛ تعيش مصفوفة التغطية لكل مسار في [نظرة عامة على ضمان الجودة → تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` هو الحزمة الاصطناعية الواسعة وليس جزءًا من تلك المصفوفة.

### اعتماديات Telegram المشتركة عبر Convex (v1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لضمان جودة النقل الحي، يحصل مختبر ضمان الجودة على عقد تأجير حصري من تجمع مدعوم بـ Convex، ويرسل Heartbeat لذلك التأجير أثناء تشغيل المسار، ويحرر التأجير عند الإيقاف. يسبق اسم القسم دعم Discord وSlack وWhatsApp؛ عقد التأجير مشترك عبر الأنواع.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` لـ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` لـ `ci`
- تحديد دور الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - افتراضي البيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (افتراضيه `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL من Convex عبر `http://` للحلقة المحلية للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` الصيغة `https://` في التشغيل العادي.

تتطلب أوامر إدارة المشرفين (إضافة/إزالة/سرد التجمع) تحديدًا `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل التشغيلات الحية للتحقق من عنوان URL لموقع Convex، وأسرار الوسيط، وبادئة نقطة النهاية، ومهلة HTTP، وإمكانية الوصول للإدارة/السرد بدون طباعة قيم الأسرار. استخدم `--json` لمخرجات قابلة للقراءة آليًا في السكربتات وأدوات CI.

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
- يجب أن يكون `groupId` سلسلة معرّف محادثة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` ويرفض الحمولات المشوهة.

شكل الحمولة لنوع مستخدم Telegram الحقيقي:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- يجب أن تكون `groupId` و`testerUserId` و`telegramApiId` سلاسل رقمية.
- يجب أن تكون `tdlibArchiveSha256` و`desktopTdataArchiveSha256` سلاسل سداسية SHA-256.
- `kind: "telegram-user"` محجوز لسير عمل دليل Mantis Telegram Desktop. يجب ألا تحصل مسارات QA Lab العامة عليه.

حمولات متعددة القنوات يتحقق منها الوسيط:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

يمكن لمسارات Slack أيضًا الاستئجار من التجمع، لكن التحقق من حمولة Slack يعيش حاليًا في مشغّل ضمان جودة Slack بدلًا من الوسيط. استخدم `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` لصفوف Slack.

### إضافة قناة إلى ضمان الجودة

تعيش أسماء البنية ومساعدات السيناريو لمحولات القنوات الجديدة في [نظرة عامة على ضمان الجودة → إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel). الحد الأدنى: تنفيذ مشغّل النقل على واجهة مضيف `qa-lab` المشتركة، والتصريح بـ `qaRunners` في بيان Plugin، والتركيب باسم `openclaw qa <runner>`، وتأليف السيناريوهات ضمن `qa/scenarios/`.

## حزم الاختبار (ما يُشغَّل وأين)

فكّر في الحزم على أنها "واقعية متزايدة" (وتذبذب/تكلفة متزايدان):

### الوحدة / التكامل (افتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم التشغيلات غير المستهدفة مجموعة شظايا `vitest.full-*.config.ts` وقد توسّع شظايا المشاريع المتعددة إلى إعدادات لكل مشروع للجدولة المتوازية
- الملفات: قوائم جرد الوحدة/النواة ضمن `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`؛ تعمل اختبارات وحدة واجهة المستخدم في شظية `unit-ui` المخصصة
- النطاق:
  - اختبارات وحدة صرفة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، والتوجيه، والأدوات، والتحليل، والإعدادات)
  - انحدارات حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - ينبغي أن تكون سريعة ومستقرة
  - يجب أن تثبت اختبارات المحلّل ومحمّل السطح العام سلوك الرجوع الواسع لـ `api.js` و`runtime-api.js` باستخدام تجهيزات Plugin صغيرة مولّدة، وليس واجهات API لمصدر Plugin حقيقي مضمّن. تنتمي تحميلات API الحقيقية لـ Plugin إلى حزم العقد/التكامل المملوكة للـ Plugin.

سياسة الاعتماديات الأصلية:

- تتخطى تثبيتات الاختبار الافتراضية بناءات opus الأصلية الاختيارية في Discord. يستخدم صوت Discord `libopus-wasm` المضمّن، ويبقى `@discordjs/opus` معطّلًا في `allowBuilds` حتى لا تجمع الاختبارات المحلية ومسارات Testbox الإضافة الأصلية.
- قارن أداء opus الأصلي في مستودع قياس `libopus-wasm`، وليس في حلقات تثبيت/اختبار OpenClaw الافتراضية. لا تضبط `@discordjs/opus` إلى `true` في `allowBuilds` الافتراضية؛ فهذا يجعل حلقات التثبيت/الاختبار غير ذات الصلة تجمع شيفرة أصلية.

<AccordionGroup>
  <Accordion title="المشاريع، والشظايا، والمسارات محددة النطاق">

    - تُشغّل `pnpm test` غير المستهدفة اثني عشر إعداد تقسيم أصغر (`core-unit-fast` و`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدل عملية مشروع جذري أصلية ضخمة واحدة. يقلل هذا ذروة RSS على الأجهزة المحمّلة، ويتجنب أن تؤدي أعمال الرد التلقائي/الإضافات إلى تجويع مجموعات اختبار غير مرتبطة.
    - لا يزال `pnpm test --watch` يستخدم مخطط مشروع `vitest.config.ts` الجذري الأصلي، لأن حلقة مراقبة متعددة التقسيمات ليست عملية.
    - تمرّر `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر مسارات محددة النطاق أولاً، لذلك يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` دفع كلفة بدء تشغيل المشروع الجذري بالكامل.
    - توسّع `pnpm test:changed` مسارات git المتغيرة إلى مسارات محددة النطاق ورخيصة افتراضياً: تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، والمعتمدات المحلية في مخطط الاستيراد. لا تؤدي تعديلات الإعداد/التهيئة/الحزمة إلى تشغيل واسع للاختبارات إلا إذا استخدمت صراحةً `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` هي بوابة الفحص المحلي الذكية العادية للعمل الضيق. تصنّف الفرق إلى النواة، واختبارات النواة، والإضافات، واختبارات الإضافات، والتطبيقات، والوثائق، وبيانات إصدار التعريف، وأدوات Docker الحية، والأدوات، ثم تشغّل أوامر فحص الأنواع والlint والحراسة المطابقة. لا تشغّل اختبارات Vitest؛ استدعِ `pnpm test:changed` أو `pnpm test <target>` صريحاً لإثبات الاختبار. تشغّل زيادات الإصدارات التي تقتصر على بيانات إصدار التعريف فقط فحوصاً مستهدفة للإصدار/الإعداد/اعتماد الجذر، مع حارس يرفض تغييرات الحزمة خارج حقل الإصدار ذي المستوى الأعلى.
    - تشغّل تعديلات عدة ACP الحية في Docker فحوصاً مركزة: صياغة الصدفة لسكربتات مصادقة Docker الحية، وتجربة جافة لجدولة Docker الحية. لا تُضمّن تغييرات `package.json` إلا عندما يقتصر الفرق على `scripts["test:docker:live-*"]`؛ أما تعديلات الاعتمادات والتصدير والإصدار والأسطح الأخرى للحزمة فتظل تستخدم الحراسات الأوسع.
    - تمر اختبارات الوحدة خفيفة الاستيراد من الوكلاء، والأوامر، والمكونات الإضافية، ومساعدات الرد التلقائي، و`plugin-sdk`، ومناطق الأدوات الصافية المشابهة عبر مسار `unit-fast`، الذي يتجاوز `test/setup-openclaw-runtime.ts`؛ تبقى الملفات ذات الحالة أو الثقيلة في وقت التشغيل على المسارات الحالية.
    - تعيّن ملفات مصدر مساعدة محددة في `plugin-sdk` و`commands` أيضاً تشغيلات وضع التغييرات إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
    - لدى `auto-reply` حاويات مخصصة لمساعدات النواة ذات المستوى الأعلى، واختبارات التكامل `reply.*` ذات المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. يقسم CI أيضاً الشجرة الفرعية للرد إلى تقسيمات مشغّل الوكيل، والإرسال، والأوامر/توجيه الحالة، بحيث لا تملك حاوية واحدة ثقيلة الاستيراد ذيل Node الكامل.
    - يتخطى CI العادي لطلبات السحب/الفرع الرئيسي عمداً مسح دفعة الإضافات وتقسيم `agentic-plugins` الخاص بالإصدار فقط. يشغّل إرسال التحقق الكامل من الإصدار سير العمل الفرعي المنفصل `Plugin Prerelease` لتلك المجموعات الثقيلة بالمكونات الإضافية/الإضافات على مرشحات الإصدار.

  </Accordion>

  <Accordion title="تغطية المشغّل المضمّن">

    - عند تغيير مدخلات اكتشاف أدوات الرسائل أو سياق وقت تشغيل
      Compaction، أبقِ مستويي التغطية كليهما.
    - أضف تراجعات مساعدة مركزة لحدود التوجيه والتطبيع
      الصافية.
    - حافظ على سلامة مجموعات تكامل المشغّل المضمّن:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`،
      و`src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`، و
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق تلك المجموعات من أن المعرّفات محددة النطاق وسلوك Compaction لا يزالان يتدفقان
      عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ اختبارات المساعدات فقط
      ليست بديلاً كافياً لتلك مسارات التكامل.

  </Accordion>

  <Accordion title="تجمع Vitest وافتراضيات العزل">

    - افتراضات إعداد Vitest الأساسي هي `threads`.
    - يثبت إعداد Vitest المشترك `isolate: false` ويستخدم
      المشغّل غير المعزول عبر مشاريع الجذر، وإعدادات e2e، والإعدادات الحية.
    - يحتفظ مسار واجهة المستخدم الجذري بتهيئة `jsdom` والمُحسّن الخاصين به، لكنه يعمل على
      المشغّل المشترك غير المعزول أيضاً.
    - يرث كل تقسيم `pnpm test` افتراضات `threads` + `isolate: false`
      نفسها من إعداد Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` لعمليات Node الفرعية الخاصة بـ Vitest
      افتراضياً لتقليل اضطراب ترجمة V8 أثناء التشغيلات المحلية الكبيرة.
      اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8
      القياسي.
    - ينهي `scripts/run-vitest.mjs` تشغيلات Vitest الصريحة غير المراقبة بعد
      5 دقائق دون أي خرج stdout أو stderr. اضبط
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` لتعطيل المراقب أثناء
      تحقيق صامت مقصود.

  </Accordion>

  <Accordion title="تكرار محلي سريع">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يفعّلها الفرق.
    - خطاف ما قبل الالتزام مخصص للتنسيق فقط. يعيد تجهيز الملفات المنسقة ولا
      يشغّل lint أو فحص الأنواع أو الاختبارات.
    - شغّل `pnpm check:changed` صراحةً قبل التسليم أو الدفع عندما
      تحتاج بوابة الفحص المحلي الذكية.
    - تمرّر `pnpm test:changed` عبر مسارات محددة النطاق ورخيصة افتراضياً. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر الوكيل
      أن تعديل عدة أو إعداد أو حزمة أو عقد يحتاج فعلاً إلى تغطية Vitest
      أوسع.
    - يحافظ `pnpm test:max` و`pnpm test:changed:max` على سلوك التوجيه
      نفسه، لكن مع حد أعلى للعاملين.
    - التحجيم التلقائي للعاملين محلياً محافظ عمداً ويتراجع
      عندما يكون متوسط حمل المضيف عالياً بالفعل، لذلك تسبب تشغيلات Vitest المتزامنة المتعددة
      ضرراً أقل افتراضياً.
    - يعلّم إعداد Vitest الأساسي ملفات المشاريع/الإعدادات بوصفها
      `forceRerunTriggers` بحيث تبقى إعادة التشغيل في وضع التغييرات صحيحة عند تغيّر
      توصيل الاختبارات.
    - يُبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلاً على المضيفين المدعومين؛
      اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت
      موقع تخزين مؤقتاً صريحاً واحداً للتنميط المباشر.

  </Accordion>

  <Accordion title="تصحيح أداء الأخطاء">

    - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest إضافةً إلى
      خرج تفصيل الاستيراد.
    - يحدد `pnpm test:perf:imports:changed` عرض التنميط نفسه على
      الملفات المتغيرة منذ `origin/main`.
    - تُكتب بيانات توقيت التقسيم إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم تشغيلات الإعداد الكامل مسار الإعداد كمفتاح؛ وتلحق تقسيمات CI ذات نمط التضمين
      اسم التقسيم بحيث يمكن تتبع التقسيمات المفلترة
      على نحو منفصل.
    - عندما يظل اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل،
      أبقِ الاعتمادات الثقيلة خلف حد محلي ضيق `*.runtime.ts` و
      حاكِ ذلك الحد مباشرةً بدلاً من الاستيراد العميق لمساعدات وقت التشغيل لمجرد
      تمريرها عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` مسار
      `test:changed` الموجّه مع مسار المشروع الجذري الأصلي لذلك الفرق الملتزم
      ويطبع زمن الساعة إضافةً إلى الحد الأقصى RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة المتسخة الحالية
      بتوجيه قائمة الملفات المتغيرة عبر
      `scripts/test-projects.mjs` وإعداد Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي من أجل
      حمل بدء تشغيل Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل من أجل
      مجموعة الوحدة مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، مجبر على عامل واحد
- النطاق:
  - يبدأ Gateway loopback حقيقياً مع تمكين التشخيصات افتراضياً
  - يدفع اضطراب رسائل Gateway الاصطناعية والذاكرة والحمولات الكبيرة عبر مسار حدث التشخيص
  - يستعلم `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات استمرارية حزمة استقرار التشخيصات
  - يؤكد أن المسجل يبقى محدوداً، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق الطوابير لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج مفاتيح
  - مسار ضيق لمتابعة تراجعات الاستقرار، وليس بديلاً عن مجموعة Gateway الكاملة

### E2E (تجميع المستودع)

- الأمر: `pnpm test:e2e`
- النطاق:
  - يشغّل مسار E2E لدخان Gateway
  - يشغّل مسار E2E للمتصفح المحاكى في واجهة التحكم
- التوقعات:
  - آمن لـ CI ولا يحتاج مفاتيح
  - يتطلب تثبيت Playwright Chromium

### E2E (دخان Gateway)

- الأمر: `pnpm test:e2e:gateway`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts`، و`test/**/*.e2e.test.ts`، واختبارات E2E للمكونات الإضافية المضمّنة تحت `extensions/`
- افتراضيات وقت التشغيل:
  - يستخدم `threads` في Vitest مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عاملين تكيفيين (CI: حتى 2، محلياً: 1 افتراضياً).
  - يعمل في الوضع الصامت افتراضياً لتقليل حمل إدخال/إخراج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العاملين (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تمكين خرج وحدة التحكم المفصل.
- النطاق:
  - سلوك Gateway الشامل متعدد النسخ
  - أسطح WebSocket/HTTP، واقتران العقد، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في خط الأنابيب)
  - لا يتطلب مفاتيح حقيقية
  - أجزاء متحركة أكثر من اختبارات الوحدة (قد يكون أبطأ)

### E2E (متصفح واجهة التحكم المحاكى)

- الأمر: `pnpm test:ui:e2e`
- الإعداد: `test/vitest/vitest.ui-e2e.config.ts`
- الملفات: `ui/src/**/*.e2e.test.ts`
- النطاق:
  - يبدأ واجهة تحكم Vite
  - يدفع صفحة Chromium حقيقية عبر Playwright
  - يستبدل WebSocket الخاص بـ Gateway بمحاكيات حتمية داخل المتصفح
- التوقعات:
  - يعمل في CI كجزء من `pnpm test:e2e`
  - لا يتطلب Gateway حقيقياً أو وكلاء أو مفاتيح مزودين
  - يجب أن تكون تبعية المتصفح موجودة (`pnpm --dir ui exec playwright install chromium`)

### E2E: دخان خلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يعيد استخدام Gateway OpenShell محلي نشط
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يمرّن خلفية OpenShell في OpenClaw عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات ذي المرجع البعيد عبر جسر sandbox fs
- التوقعات:
  - اختياري فقط؛ ليس جزءاً من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محلياً باسم `openshell` إضافةً إلى عفريت Docker عامل
  - يتطلب Gateway OpenShell محلياً نشطاً ومصدر إعداده
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمر sandbox الاختبار
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدوياً
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو سكربت تغليف
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` لكشف إعداد Gateway المسجل للاختبار المعزول
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` لتجاوز IP الخاص بـ Gateway في Docker المستخدم بواسطة تثبيت سياسة المضيف

### حي (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات Plugin المباشرة المضمّنة ضمن `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزوّد/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - التقاط تغييرات تنسيق المزوّد، وخصوصيات استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدّل
- التوقعات:
  - غير مستقر في CI عن قصد (شبكات حقيقية، سياسات مزوّدين حقيقية، حصص، انقطاعات)
  - يكلّف مالًا / يستخدم حدود المعدّل
  - فضّل تشغيل مجموعات فرعية أضيق بدلًا من "كل شيء"
- تستخدم التشغيلات المباشرة مفاتيح API المصدّرة مسبقًا وملفات تعريف المصادقة المرحلية.
- افتراضيًا، لا تزال التشغيلات المباشرة تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى بيت اختبار مؤقت حتى لا تتمكن تجهيزات اختبارات الوحدة من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات المباشرة دليل البيت الحقيقي لديك.
- يستخدم `pnpm test:live` افتراضيًا وضعًا أهدأ: فهو يُبقي خرج التقدم `[live] ...` ويكتم سجلات تمهيد Gateway وضجيج Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بالمزوّد): اضبط `*_API_KEYS` بتنسيق الفواصل/الفواصل المنقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (مثلًا `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو تجاوزًا لكل تشغيل مباشر عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حدود المعدّل.
- خرج التقدم/Heartbeat:
  - تبث مجموعات الاختبار المباشرة الآن أسطر تقدم إلى stderr حتى تظهر استدعاءات المزوّد الطويلة كنشطة بوضوح حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة تحكم Vitest حتى تتدفق أسطر تقدم المزوّد/Gateway فورًا أثناء التشغيلات المباشرة.
  - اضبط Heartbeat النماذج المباشرة باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat الخاصة بـ Gateway/المجس باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة اختبار يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكة Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح "الروبوت لدي متوقف" / إخفاقات خاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` مضيقًا

## الاختبارات المباشرة (التي تلامس الشبكة)

لمصفوفة النماذج المباشرة، وتجارب دخان خلفية CLI، وتجارب دخان ACP، وحاضنة
خادم تطبيق Codex، وكل اختبارات مزوّدي الوسائط المباشرة (Deepgram وBytePlus وComfyUI والصور
والموسيقى والفيديو وحاضنة الوسائط) - إضافة إلى التعامل مع بيانات الاعتماد للتشغيلات المباشرة - راجع
[اختبار المجموعات المباشرة](/ar/help/testing-live). وللقائمة المرجعية المخصصة للتحديث
وتحقق Plugin، راجع
[اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins).

## مشغّلات Docker (فحوصات "يعمل في Linux" اختيارية)

تنقسم مشغّلات Docker هذه إلى مجموعتين:

- مشغّلات النماذج المباشرة: يشغّل `test:docker:live-models` و`test:docker:live-gateway` ملفهما المباشر المطابق لمفتاح ملف التعريف فقط داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعداد المحلي لديك ومساحة العمل وملف بيئة ملف التعريف الاختياري. نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تحتفظ مشغّلات Docker المباشرة بسقوفها العملية الخاصة عند الحاجة:
  يضبط `test:docker:live-models` افتراضيًا المجموعة المنسقة المدعومة عالية الإشارة، ويضبط
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1` و
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8` و
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. اضبط `OPENCLAW_LIVE_MAX_MODELS`
  أو متغيرات بيئة Gateway عندما تريد صراحةً سقفًا أصغر أو مسحًا أوسع.
- يبني `test:docker:all` صورة Docker المباشرة مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كحزمة npm tarball عبر `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة المجردة هي فقط مشغّل Node/Git لمسارات التثبيت/التحديث/اعتمادات Plugin؛ تركّب تلك المسارات حزمة tarball المبنية مسبقًا. تثبّت الصورة الوظيفية حزمة tarball نفسها في `/app` لمسارات وظائف التطبيق المبني. تعيش تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويعيش منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في خانات العمليات، بينما تمنع سقوف الموارد مسارات المباشر الثقيلة، وتثبيت npm، والخدمات المتعددة من البدء كلها دفعة واحدة. إذا كان مسار واحد أثقل من السقوف النشطة، يمكن للمجدول مع ذلك تشغيله عندما يكون المجمّع فارغًا ثم يبقيه يعمل وحده حتى تتاح السعة مرة أخرى. القيم الافتراضية هي 10 خانات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ اضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` فقط عندما يكون لدى مضيف Docker هامش أكبر. يجري المشغّل فحصًا تمهيديًا لـ Docker افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون دون بناء Docker أو تشغيله، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة، واحتياجات الحزمة/الصورة، وبيانات الاعتماد.
- `Package Acceptance` هو بوابة الحزم الأصلية في GitHub لسؤال "هل تعمل حزمة tarball القابلة للتثبيت هذه كمنتج؟" يحل حزمة مرشحة واحدة من `source=npm` أو `source=ref` أو `source=url` أو `source=artifact`، ويرفعها باسم `package-under-test`، ثم يشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد حزمة tarball نفسها بالضبط بدلًا من إعادة حزم المرجع المحدد. تُرتب ملفات التعريف حسب الاتساع: `smoke` و`package` و`product` و`full`. راجع [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins) لعقد الحزمة/التحديث/Plugin، ومصفوفة الناجين من الترقية المنشورة، وافتراضيات الإصدار، وفرز الإخفاقات.
- تشغّل فحوصات البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يجتاز الحارس الرسم البياني المبني الثابت من `dist/entry.js` و`dist/cli/run-main.js` ويفشل إذا استورد بدء التشغيل قبل الإرسال اعتماديات حزم مثل Commander أو واجهة المطالبة أو undici أو التسجيل قبل إرسال الأمر؛ كما يُبقي مقطع تشغيل Gateway المضمّن ضمن الميزانية ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة. يغطي دخان CLI المحزم أيضًا مساعدة الجذر، ومساعدة الإعداد الأولي، ومساعدة الطبيب، والحالة، ومخطط الإعداد، وأمر قائمة النماذج.
- توافق `Package Acceptance` القديم محدود عند `2026.4.25` (بما في ذلك `2026.4.25-beta.*`). حتى ذلك الحد، تتسامح الحاضنة فقط مع فجوات بيانات التعريف للحزم المشحونة: إدخالات جرد QA الخاصة المحذوفة، و`gateway install --wrapper` المفقود، وملفات الرقع المفقودة في تجهيز git المشتق من tarball، و`update.channel` المستمر المفقود، ومواقع سجلات تثبيت Plugin القديمة، واستمرارية سجلات تثبيت السوق المفقودة، وترحيل بيانات تعريف الإعداد أثناء `plugins update`. بالنسبة إلى الحزم بعد `2026.4.25`، تكون تلك المسارات إخفاقات صارمة.
- مشغّلات دخان الحاويات: `test:docker:openwebui` و`test:docker:onboard` و`test:docker:npm-onboard-channel-agent` و`test:docker:release-user-journey` و`test:docker:release-typed-onboarding` و`test:docker:release-media-memory` و`test:docker:release-upgrade-user-journey` و`test:docker:release-plugin-marketplace` و`test:docker:skill-install` و`test:docker:update-channel-switch` و`test:docker:upgrade-survivor` و`test:docker:published-upgrade-survivor` و`test:docker:session-runtime-context` و`test:docker:agents-delete-shared-workspace` و`test:docker:gateway-network` و`test:docker:browser-cdp-snapshot` و`test:docker:mcp-channels` و`test:docker:agent-bundle-mcp-tools` و`test:docker:cron-mcp-cleanup` و`test:docker:plugins` و`test:docker:plugin-update` و`test:docker:plugin-lifecycle-matrix` و`test:docker:config-reload` تشغّل حاوية حقيقية واحدة أو أكثر وتتحقق من مسارات تكامل أعلى مستوى.
- مسارات Docker/Bash E2E التي تثبّت حزمة OpenClaw tarball المحزمة عبر `scripts/lib/openclaw-e2e-instance.sh` تحدّ `npm install` عند `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (افتراضيًا `600s`؛ اضبط `0` لتعطيل الغلاف من أجل التصحيح).

تقوم مشغّلات Docker للنماذج المباشرة أيضًا بتركيب بيوت مصادقة CLI المطلوبة فقط (أو كل البيوت المدعومة عندما لا يكون التشغيل مضيقًا)، ثم تنسخها إلى بيت الحاوية قبل التشغيل حتى يتمكن OAuth الخاص بـ CLI الخارجي من تحديث الرموز دون تعديل مخزن مصادقة المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- دخان ربط ACP: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيًا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- دخان خلفية CLI: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- دخان حاضنة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- دخان قابلية الملاحظة: `pnpm qa:otel:smoke` و`pnpm qa:prometheus:smoke` و`pnpm qa:observability:smoke` هي مسارات QA خاصة لاستخراج المصدر. وهي ليست جزءًا من مسارات إصدار Docker للحزم عمدًا لأن حزمة npm tarball تحذف QA Lab.
- دخان Open WebUI المباشر: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، سقالات كاملة): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- دخان إعداد/قناة/وكيل حزمة npm tarball: يثبت `pnpm test:docker:npm-onboard-channel-agent` حزمة OpenClaw tarball المحزمة عالميًا في Docker، ويضبط OpenAI عبر إعداد أولي بمرجع بيئة إضافة إلى Telegram افتراضيًا، ويشغّل الطبيب، ويشغّل دورة وكيل OpenAI واحدة ساخرة. أعد استخدام حزمة tarball مبنية مسبقًا باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة بناء المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` أو `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- اختبار دخان رحلة مستخدم الإصدار: يثبّت `pnpm test:docker:release-user-journey` أرشيف tarball المجمّع لـ OpenClaw عالميًا في مجلد Docker رئيسي نظيف، ويشغّل الإعداد الأولي، ويضبط موفّر OpenAI وهميًا، ويشغّل دورة وكيل، ويثبّت/يزيل تثبيت Plugins خارجية، ويضبط ClickClack مقابل تجهيز محلي، ويتحقق من الرسائل الصادرة/الواردة، ويعيد تشغيل Gateway، ويشغّل doctor.
- اختبار دخان الإعداد الأولي المكتوب للإصدار: يثبّت `pnpm test:docker:release-typed-onboarding` أرشيف tarball المجمّع، ويقود `openclaw onboard` عبر TTY حقيقي، ويضبط OpenAI كموفّر بمرجع بيئي، ويتحقق من عدم استمرار تخزين المفتاح الخام، ويشغّل دورة وكيل وهمية.
- اختبار دخان الوسائط/الذاكرة للإصدار: يثبّت `pnpm test:docker:release-media-memory` أرشيف tarball المجمّع، ويتحقق من فهم الصور من مرفق PNG، ومخرجات توليد صور متوافقة مع OpenAI، واستدعاء بحث الذاكرة، وبقاء الاستدعاء بعد إعادة تشغيل Gateway.
- اختبار دخان رحلة مستخدم ترقية الإصدار: يثبّت `pnpm test:docker:release-upgrade-user-journey` افتراضيًا أحدث خط أساس منشور أقدم من أرشيف tarball المرشح، ويضبط حالة الموفّر/Plugin/ClickClack على الحزمة المنشورة، ويرقّي إلى أرشيف tarball المرشح، ثم يعيد تشغيل رحلة الوكيل/Plugin/القناة الأساسية. إذا لم يوجد خط أساس منشور أقدم، فإنه يعيد استخدام إصدار المرشح. تجاوز خط الأساس باستخدام `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- اختبار دخان سوق Plugins للإصدار: يثبّت `pnpm test:docker:release-plugin-marketplace` من سوق تجهيز محلي، ويحدّث Plugin المثبّت، ويزيل تثبيته، ويتحقق من اختفاء CLI الخاص بـ Plugin مع تقليم بيانات تعريف التثبيت.
- اختبار دخان تثبيت Skill: يثبّت `pnpm test:docker:skill-install` أرشيف tarball المجمّع لـ OpenClaw عالميًا في Docker، ويعطّل تثبيتات الأرشيفات المرفوعة في الإعدادات، ويحلّ slug الخاص بـ Skill الحالي الحي في ClawHub من البحث، ويثبّته باستخدام `openclaw skills install`، ويتحقق من Skill المثبّتة إضافة إلى بيانات تعريف الأصل/القفل `.clawhub`.
- اختبار دخان تبديل قناة التحديث: يثبّت `pnpm test:docker:update-channel-switch` أرشيف tarball المجمّع لـ OpenClaw عالميًا في Docker، وينتقل من حزمة `stable` إلى git `dev`، ويتحقق من القناة المستمرة وعمل Plugin بعد التحديث، ثم يعود إلى حزمة `stable` ويفحص حالة التحديث.
- اختبار دخان النجاة من الترقية: يثبّت `pnpm test:docker:upgrade-survivor` أرشيف tarball المجمّع لـ OpenClaw فوق تجهيز مستخدم قديم غير نظيف يحتوي على وكلاء، وإعدادات قناة، وقوائم سماح Plugins، وحالة تبعيات Plugin قديمة، وملفات مساحة عمل/جلسة موجودة. يشغّل تحديث الحزمة وdoctor غير تفاعلي من دون موفّر حي أو مفاتيح قنوات، ثم يبدأ Gateway حلقة رجوع ويتحقق من الحفاظ على الإعدادات/الحالة إضافة إلى ميزانيات بدء التشغيل/الحالة.
- اختبار دخان النجاة من الترقية المنشورة: يثبّت `pnpm test:docker:published-upgrade-survivor` افتراضيًا `openclaw@latest`، ويزرع ملفات مستخدم موجودة واقعية، ويضبط خط الأساس هذا بوصفة أوامر مضمّنة، ويتحقق من الإعدادات الناتجة، ويحدّث ذلك التثبيت المنشور إلى أرشيف tarball المرشح، ويشغّل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway حلقة رجوع ويفحص النوايا المضبوطة، والحفاظ على الحالة، وبدء التشغيل، و`/healthz`، و`/readyz`، وميزانيات حالة RPC. تجاوز خط أساس واحدًا باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، واطلب من مجدول التجميع توسيع خطوط الأساس المحلية الدقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`، ووسّع التجهيزات ذات شكل المشكلات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues`؛ تتضمن مجموعة المشكلات المبلّغ عنها `configured-plugin-installs` لإصلاح تثبيت Plugin خارجي لـ OpenClaw تلقائيًا. يعرّض قبول الحزمة هذه القيم باسم `published_upgrade_survivor_baseline`، و`published_upgrade_survivor_baselines`، و`published_upgrade_survivor_scenarios`، ويحل رموز خط الأساس الوصفية مثل `last-stable-4` أو `all-since-2026.4.23`، ويوسّع التحقق الكامل من الإصدار بوابة حزمة اختبار التحمل للإصدار إلى `last-stable-4 2026.4.23 2026.5.2 2026.4.15` إضافة إلى `reported-issues`.
- اختبار دخان سياق وقت تشغيل الجلسة: يتحقق `pnpm test:docker:session-runtime-context` من استمرار نص سياق وقت التشغيل المخفي إضافة إلى إصلاح doctor لفروع إعادة كتابة الموجه المتكررة المتأثرة.
- اختبار دخان التثبيت العالمي عبر Bun: يحزم `bash scripts/e2e/bun-global-install-smoke.sh` الشجرة الحالية، ويثبّتها باستخدام `bun install -g` في مجلد رئيسي معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد موفّري الصور المضمّنين بدل التعليق. أعد استخدام أرشيف tarball مبني مسبقًا باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ بناء المضيف باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- اختبار دخان Docker للمثبّت: يشارك `bash scripts/test-install-sh-docker.sh` ذاكرة npm مخبئية واحدة عبر حاويات الجذر، والتحديث، وdirect-npm. يعتمد اختبار دخان التحديث افتراضيًا على npm `latest` كخط أساس مستقر قبل الترقية إلى أرشيف tarball المرشح. تجاوزه محليًا باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، أو باستخدام إدخال `update_baseline_version` في سير عمل Install Smoke على GitHub. تحتفظ فحوصات المثبّت غير الجذر بذاكرة npm مخبئية معزولة حتى لا تخفي إدخالات الذاكرة المخبئية المملوكة للجذر سلوك التثبيت المحلي للمستخدم. عيّن `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة الجذر/التحديث/direct-npm المخبئية عبر عمليات إعادة التشغيل المحلية.
- يتخطى Install Smoke CI التحديث العالمي المباشر المكرر عبر npm باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل السكربت محليًا من دون هذا المتغير البيئي عندما تكون تغطية `npm install -g` المباشرة مطلوبة.
- اختبار دخان CLI لحذف الوكلاء لمساحة العمل المشتركة: يبني `pnpm test:docker:agents-delete-shared-workspace` (السكربت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) صورة Dockerfile الجذرية افتراضيًا، ويزرع وكيلين مع مساحة عمل واحدة في مجلد رئيسي معزول للحاوية، ويشغّل `agents delete --json`، ويتحقق من JSON صالح إضافة إلى سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke باستخدام `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكة Gateway (حاويتان، مصادقة WS + الصحة): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- اختبار دخان لقطة Browser CDP: يبني `pnpm test:docker:browser-cdp-snapshot` (السكربت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) صورة E2E المصدر إضافة إلى طبقة Chromium، ويبدأ Chromium مع CDP خام، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي عناوين URL للروابط، والعناصر القابلة للنقر المرفوعة بالمؤشر، ومراجع iframe، وبيانات تعريف الإطار.
- انحدار الاستدلال الأدنى لـ OpenAI Responses web_search: يشغّل `pnpm test:docker:openai-web-search-minimal` (السكربت: `scripts/e2e/openai-web-search-minimal-docker.sh`) خادم OpenAI وهميًا عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يجبر مخطط الموفّر على الرفض ويفحص ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + اختبار دخان إطار إشعار Claude خام): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة OpenClaw (خادم MCP stdio حقيقي + اختبار دخان سماح/رفض ملف تعريف OpenClaw المضمّن): `pnpm test:docker:agent-bundle-mcp-tools` (السكربت: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- تنظيف Cron/الوكيل الفرعي لـ MCP (Gateway حقيقي + إنهاء فرع MCP stdio بعد تشغيلات Cron معزولة وتشغيل وكيل فرعي لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكربت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (اختبار دخان التثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، وبيانات تعريف حزمة npm تالفة، ومراجع git متحركة، وتجهيز ClawHub شامل، وتحديثات السوق، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)
  عيّن `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/وقت التشغيل الافتراضي الشامل باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. من دون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم تجهيز ClawHub محليًا محكم العزل.
- اختبار دخان تحديث Plugin بلا تغيير: `pnpm test:docker:plugin-update` (السكربت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- اختبار دخان مصفوفة دورة حياة Plugin: يثبّت `pnpm test:docker:plugin-lifecycle-matrix` أرشيف tarball المجمّع لـ OpenClaw في حاوية عارية، ويثبّت Plugin من npm، ويبدّل التمكين/التعطيل، ويرقيه ويخفضه عبر سجل npm محلي، ويحذف الشيفرة المثبّتة، ثم يتحقق من أن إلغاء التثبيت لا يزال يزيل الحالة القديمة مع تسجيل مقاييس RSS/CPU لكل مرحلة من دورة الحياة.
- اختبار دخان بيانات تعريف إعادة تحميل الإعدادات: `pnpm test:docker:config-reload` (السكربت: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: يغطي `pnpm test:docker:plugins` اختبار دخان التثبيت/التحديث للمسار المحلي، و`file:`، وسجل npm مع تبعيات مرفوعة، ومراجع git متحركة، وتجهيزات ClawHub، وتحديثات السوق، وتمكين/فحص حزمة Claude. يغطي `pnpm test:docker:plugin-update` سلوك التحديث بلا تغيير لـ Plugins المثبّتة. يغطي `pnpm test:docker:plugin-lifecycle-matrix` تثبيت Plugin من npm مع تتبع الموارد، وتمكينه، وتعطيله، وترقيته، وخفضه، وإلغاء تثبيته عند فقدان الشيفرة.

لبناء الصورة الوظيفية المشتركة مسبقًا وإعادة استخدامها يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بالمجموعات مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` هي الغالبة عند ضبطها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكربتات إذا لم تكن محلية بالفعل. تحتفظ اختبارات QR وDocker للمثبّت بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدل وقت تشغيل التطبيق المبني المشترك.

تقوم مشغلات Docker للنماذج الحية أيضًا بربط checkout الحالي للقراءة فقط وتهيئته في workdir مؤقت داخل الحاوية. يحافظ هذا على صورة وقت التشغيل خفيفة، مع الاستمرار في تشغيل Vitest ضد المصدر/التكوين المحلي نفسه لديك. تتجاوز خطوة التهيئة ذاكرات التخزين المؤقت الكبيرة المحلية فقط ومخرجات بناء التطبيق مثل `.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة إخراج `.build` المحلية للتطبيق أو Gradle، حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ artifacts خاصة بالجهاز.
كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات Gateway الحية عمّال قنوات Telegram/Discord/وما إلى ذلك الحقيقيين داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذلك مرّر أيضًا
`OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق تغطية Gateway الحية أو استثنائها من مسار Docker ذلك.
`test:docker:openwebui` هو فحص توافق smoke أعلى مستوى: يبدأ حاوية Gateway من OpenClaw مع تمكين نقاط النهاية HTTP المتوافقة مع OpenAI، ويبدأ حاوية Open WebUI مثبتة الإصدار مقابل ذلك Gateway، ويسجل الدخول عبر Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل طلب محادثة حقيقيًا عبر وكيل `/api/chat/completions` في Open WebUI.
اضبط `OPENWEBUI_SMOKE_MODE=models` لفحوصات CI الخاصة بمسار الإصدار التي يجب أن تتوقف بعد تسجيل الدخول إلى Open WebUI واكتشاف النموذج، دون انتظار إكمال نموذج حي.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب صورة Open WebUI وقد يحتاج Open WebUI إلى إكمال إعداده البارد الخاص.
يتوقع هذا المسار وجود مفتاح نموذج حي قابل للاستخدام. وفّره عبر بيئة العملية، أو ملفات تعريف المصادقة المهيأة، أو `OPENCLAW_PROFILE_FILE` صريح.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` حتمي عن قصد ولا يحتاج إلى حساب Telegram أو Discord أو iMessage حقيقي. يقلع حاوية Gateway مهيأة ببذور، ويبدأ حاوية ثانية تنشئ `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجهة، وقراءات النصوص، وبيانات المرفقات الوصفية، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة + الأذونات بأسلوب Claude عبر جسر MCP الحقيقي عبر stdio. يفحص اختبار الإشعارات إطارات MCP الخام عبر stdio مباشرة، بحيث يتحقق فحص smoke مما يصدره الجسر فعليًا، وليس فقط ما يصادف أن تعرضه SDK عميل معينة.
`test:docker:agent-bundle-mcp-tools` حتمي ولا يحتاج إلى مفتاح نموذج حي. يبني صورة Docker للمستودع، ويبدأ خادم فحص MCP حقيقيًا عبر stdio داخل الحاوية، ويجسد ذلك الخادم عبر وقت تشغيل MCP لحزمة OpenClaw المضمنة، وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان بأدوات `bundle-mcp` بينما تقوم `minimal` و`tools.deny: ["bundle-mcp"]` بترشيحها.
`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح نموذج حي. يبدأ Gateway مهيأ ببذور مع خادم فحص MCP حقيقي عبر stdio، ويشغل دورة cron معزولة ودورة ابن لمرة واحدة عبر `sessions_spawn`، ثم يتحقق من خروج عملية MCP الابنة بعد كل تشغيل.

فحص smoke يدوي لخيط ACP بلغة عادية (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- أبقِ هذا السكربت لسير عمل الانحدار/تصحيح الأخطاء. قد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه خيوط ACP، لذلك لا تحذفه.

متغيرات البيئة المفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) مركّب على `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) مركّب على `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` مركّب ومحمّل قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المحملة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة تكوين/workspace مؤقتة وبدون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) مركّب على `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - تشغيلات المزوّد المضيقة تركّب فقط الأدلة/الملفات المطلوبة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لترشيح المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لإعادة التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن ملف التعريف (وليس env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لفحص smoke الخاص بـ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز مطالبة فحص nonce التي يستخدمها فحص smoke الخاص بـ Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## تحقق سلامة الوثائق

شغّل فحوصات الوثائق بعد تعديلات الوثائق: `pnpm check:docs`.
شغّل تحقق روابط Mintlify anchors الكامل عندما تحتاج أيضًا إلى فحوصات العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه انحدارات "مسار حقيقي" دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة agent): `src/gateway/gateway.test.ts` (الحالة: "يشغّل استدعاء أداة OpenAI وهميًا من البداية إلى النهاية عبر حلقة agent الخاصة بـ Gateway")
- معالج Gateway الإرشادي (WS `wizard.start`/`wizard.next`، يكتب التكوين + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "يشغّل المعالج الإرشادي عبر ws ويكتب تكوين رمز المصادقة")

## تقييمات موثوقية agent (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية agent":

- استدعاء الأدوات الوهمي عبر Gateway الحقيقي + حلقة agent (`src/gateway/gateway.test.ts`).
- تدفقات المعالج الإرشادي من البداية إلى النهاية التي تتحقق من ربط الجلسة وتأثيرات التكوين (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودًا لـ Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في المطالبة، هل يختار agent Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ agent ملف `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسيطات المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تتحقق من ترتيب الأدوات، واستمرار سجل الجلسة، وحدود sandbox.

يجب أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين وهميين للتحقق من استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skills، وربط الجلسات.
- مجموعة صغيرة من السيناريوهات المركزة على Skills (استخدام مقابل تجنب، بوابات، حقن المطالبات).
- تقييمات حية اختيارية (opt-in، محكومة بمتغيرات env) فقط بعد وجود المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلة تلتزم بعقد الواجهة الخاص بها. تكرر على كل Plugins المكتشفة وتشغّل مجموعة من تأكيدات الشكل والسلوك. يتجاوز مسار الوحدة الافتراضي `pnpm test` ملفات smoke والحدود المشتركة هذه عن قصد؛ شغّل أوامر العقود صراحة عندما تلمس أسطح القنوات أو المزوّدين المشتركة.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

موجودة في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي لـ Plugin (id، name، capabilities)
- **setup** - عقد معالج الإعداد الإرشادي
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - التعامل مع الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - التعامل مع معرفات الخيوط
- **directory** - API الدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

موجودة في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
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
- **wizard** - معالج الإعداد الإرشادي

### متى تُشغّل

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة أو تعديل قناة أو Plugin مزوّد
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة الانحدارات (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج مكتشفة في التشغيل الحي:

- أضف انحدارًا آمنًا لـ CI إذا أمكن (مزوّد mock/stub، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت بطبيعتها حية فقط (حدود المعدل، سياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا واختياريًا عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ تحويل/إعادة تشغيل طلب المزوّد → اختبار نماذج مباشر
  - خطأ في مسار جلسة/سجل/أدوات Gateway → فحص smoke حي لـ Gateway أو اختبار mock آمن لـ CI لـ Gateway
- حاجز حماية عبور SecretRef:
  - يستنتج `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا عينيًا واحدًا لكل فئة SecretRef من بيانات السجل الوصفية (`listSecretTargetRegistryEntries()`)، ثم يؤكد أن exec ids التي تحتوي على مقاطع عبور مرفوضة.
  - إذا أضفت عائلة أهداف SecretRef جديدة `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند وجود target ids غير مصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذات صلة

- [اختبار مباشر](/ar/help/testing-live)
- [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)
- [CI](/ar/ci)
