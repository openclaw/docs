---
read_when:
    - تشغيل الاختبارات محليًا أو ضمن CI
    - إضافة اختبارات انحدار لأخطاء النماذج/المزوّدين
    - تصحيح أخطاء سلوك Gateway والوكيل
summary: 'حزمة الاختبار: مجموعات اختبارات الوحدة/الشاملة/المباشرة، ومشغّلات Docker، وما يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-07-12T05:58:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

لدى OpenClaw ثلاث حزم اختبارات Vitest (الوحدة/التكامل، وe2e، والمباشرة) بالإضافة إلى
مشغّلات Docker. تغطي هذه الصفحة نطاق كل حزمة، والأمر المطلوب تشغيله لسير عمل
معيّن، وكيفية اكتشاف الاختبارات المباشرة لبيانات الاعتماد، وكيفية إضافة
اختبارات انحدار لأخطاء المزوّدات/النماذج الواقعية.

<Note>
**مكدّس ضمان الجودة (qa-lab، وqa-channel، ومسارات النقل المباشر)** موثّق بشكل منفصل:

- [نظرة عامة على ضمان الجودة](/ar/concepts/qa-e2e-automation) - البنية، وواجهة الأوامر، وتأليف السيناريوهات.
- [ضمان الجودة بالمصفوفة](/ar/concepts/qa-matrix) - مرجع للأمر `pnpm openclaw qa matrix`.
- [بطاقة تقييم النضج](/ar/maturity/scorecard) - كيف تدعم أدلة ضمان جودة الإصدار قرارات الاستقرار والدعم طويل الأجل.
- [قناة ضمان الجودة](/ar/channels/qa-channel) - Plugin النقل الاصطناعي الذي تستخدمه السيناريوهات المدعومة بالمستودع.

تغطي هذه الصفحة حزم الاختبارات العادية ومشغّلات Docker/Parallels. يسرد قسم [المشغّلات الخاصة بضمان الجودة](#qa-specific-runners) أدناه استدعاءات `qa` الفعلية ويشير مجددًا إلى المراجع أعلاه.
</Note>

## البدء السريع

في معظم الأيام:

- بوابة التحقق الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل محلي أسرع للحزمة الكاملة على جهاز ذي موارد كافية: `pnpm test:max`
- حلقة المراقبة المباشرة لـ Vitest: `pnpm test:watch`
- يوجّه الاستهداف المباشر للملفات مسارات Plugins/القنوات أيضًا: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل عمليات التشغيل المستهدفة أولًا عند تكرار العمل على إخفاق واحد.
- موقع ضمان الجودة المدعوم بـ Docker: `pnpm qa:lab:up`
- مسار ضمان الجودة المدعوم بجهاز Linux افتراضي: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تعدّل الاختبارات أو تريد ثقة إضافية:

- تقرير تغطية V8 معلوماتي: `pnpm test:coverage`
- حزمة E2E: `pnpm test:e2e`

## أدلة الاختبارات المؤقتة

استخدم الأدوات المساعدة المشتركة في `test/helpers/temp-dir.ts` للأدلة المؤقتة
المملوكة للاختبارات، بحيث تكون الملكية صريحة ويظل التنظيف ضمن دورة حياة الاختبار:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

لا تعرض `useAutoCleanupTempDirTracker(afterEach)` عمدًا أي طريقة تنظيف
يدوية، إذ يتولى Vitest التنظيف بعد كل اختبار. لا تزال الأدوات المساعدة
الأقدم منخفضة المستوى (`makeTempDir`، و`cleanupTempDirs`، و`createTempDirTracker`)
موجودة للاختبارات التي لم تُرحّل بعد؛ تجنّب استخدامها في التعليمات البرمجية الجديدة،
وتجنّب استدعاءات `fs.mkdtemp*` المباشرة الجديدة ما لم يكن الاختبار يتحقق صراحةً
من سلوك الدليل المؤقت الخام. عندما تكون هناك حاجة فعلية إلى دليل مؤقت مباشر،
أضف تعليق سماح قابلًا للتدقيق مع ذكر السبب:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

يُبلغ `node scripts/report-test-temp-creations.mjs` عن إنشاء أدلة مؤقتة
مباشرة جديدة وعن الاستخدام اليدوي الجديد للأداة المساعدة المشتركة ضمن أسطر
الفروقات المضافة، من دون حظر أساليب التنظيف الحالية. وهو يتبع تصنيف مسارات
الاختبارات نفسه المستخدم في `scripts/changed-lanes.mjs` ويتخطى تنفيذ الأداة
المساعدة المشتركة نفسه. يشغّل `check:changed` هذا التقرير لمسارات الاختبارات
المعدّلة بصفته إشارة تحذيرية فقط في CI (تعليقات تحذير توضيحية من GitHub، وليست إخفاقات).

## مهام سير العمل المباشرة ومهام Docker/Parallels

عند تصحيح أخطاء المزوّدات/النماذج الفعلية (يتطلب بيانات اعتماد فعلية):

- الحزمة المباشرة (النماذج + اختبارات أدوات/صور Gateway): `pnpm test:live`
- استهدف ملفًا مباشرًا واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- تقارير أداء وقت التشغيل: شغّل `OpenClaw Performance` مع
  `live_openai_candidate=true` لتنفيذ دورة وكيل فعلية باستخدام `openai/gpt-5.6-luna`، أو
  `deep_profile=true` للحصول على عناصر Kova الخاصة بوحدة المعالجة المركزية/الكومة/التتبّع. تنشر عمليات
  التشغيل اليومية المجدولة تقارير مسارات المزوّد الوهمي، والتنميط العميق، وGPT-5.6 Luna إلى
  `openclaw/clawgrit-reports` من مهمة ناشر منفصلة تستهلك العناصر؛
  يؤدي غياب مصادقة الناشر أو عدم صلاحيتها إلى فشل عمليات التشغيل المجدولة وعمليات
  `profile=release`. تحتفظ عمليات التشغيل اليدوية غير الخاصة بالإصدار بعناصر GitHub
  وتتعامل مع نشر التقارير بوصفه إرشاديًا. يتضمن تقرير المزوّد الوهمي أيضًا
  أرقام تشغيل Gateway على مستوى المصدر، والذاكرة، وضغط Plugins، وحلقة الترحيب
  المتكررة للنموذج الوهمي، وبدء تشغيل CLI.
- مسح النماذج المباشر عبر Docker: `pnpm test:docker:live-models`
  - يشغّل كل نموذج محدد دورة نصية بالإضافة إلى اختبار صغير شبيه بقراءة ملف.
    وتشغّل النماذج التي تشير بياناتها الوصفية إلى دعم إدخال `image` دورة صورة صغيرة أيضًا.
    عطّل الاختبارات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل إخفاقات المزوّد.
  - تغطية CI: يستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومي و
    `OpenClaw Release Checks` اليدوي سير العمل المباشر/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، بما يشمل مهام مصفوفة النماذج المباشرة عبر Docker
    المقسّمة حسب المزوّد.
  - لإعادة التشغيل المركّزة في CI، شغّل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و`live_models_only: true`.
  - أضف أسرار المزوّدات الجديدة عالية الدلالة إلى `scripts/ci-hydrate-live-auth.sh`
    وإلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/الخاصين بالإصدار.
- اختبار دخان للمحادثة المرتبطة الأصلية في Codex: `pnpm test:docker:live-codex-bind`
  - يشغّل مسارًا مباشرًا في Docker مقابل مسار خادم تطبيق Codex، ويربط
    رسالة مباشرة اصطناعية في Slack باستخدام `/codex bind`، ويختبر `/codex fast` و
    `/codex permissions`، ثم يتحقق من توجيه رد عادي ومرفق صورة
    عبر ارتباط Plugin الأصلي بدلًا من ACP.
- اختبار دخان لحاضنة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness`
  - يشغّل دورات وكيل Gateway عبر حاضنة خادم تطبيق Codex
    المملوكة لـ Plugin، ويتحقق من `/codex status` و`/codex models`، ويختبر افتراضيًا
    الصورة، وCron MCP، والوكيل الفرعي، واختبارات Guardian. عطّل اختبار
    الوكيل الفرعي باستخدام `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` عند
    عزل إخفاقات أخرى. ولإجراء فحص مركّز للوكيل الفرعي، عطّل
    الاختبارات الأخرى:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    تنتهي هذه العملية بعد اختبار الوكيل الفرعي ما لم تُضبط
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- اختبار دخان لتثبيت Codex عند الطلب: `pnpm test:docker:codex-on-demand`
  - يثبّت حزمة OpenClaw المضغوطة في Docker، ويشغّل الإعداد الأولي
    باستخدام مفتاح OpenAI API، ويتحقق من تنزيل Plugin الخاص بـ Codex واعتمادية
    `@openai/codex` عند الطلب إلى جذر مشروع npm المُدار.
- اختبار دخان مباشر لاعتمادية أداة Plugin: `pnpm test:docker:live-plugin-tool`
  - يحزم Plugin تجريبيًا باعتمادية `slugify` فعلية، ويثبّته
    من خلال `npm-pack:`، ويتحقق من الاعتمادية تحت جذر مشروع npm
    المُدار، ثم يطلب من نموذج OpenAI مباشر استدعاء أداة Plugin
    وإرجاع المعرّف المختصر المخفي.
- اختبار دخان لأمر الإنقاذ في Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري احتياطي مزدوج لواجهة أمر الإنقاذ في
    قناة الرسائل. يختبر `/crestodian status`، ويضع تغيير نموذج دائمًا
    في قائمة الانتظار، ويرد بـ `/crestodian yes`، ويتحقق من مسار كتابة
    التدقيق/الإعدادات.
- اختبار دخان لأول تشغيل لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من دليل حالة OpenClaw فارغ ويثبت أولًا أن CLI المضمّن
    `openclaw crestodian` يفشل بشكل مغلق من دون استدلال. ثم
    يختبر Claude الوهمي ويفعّله من خلال وحدة التفعيل المضمّنة.
    وبعد ذلك فقط يصل طلب CLI مضمّن تقريبي إلى المخطّط ويُحلّ إلى
    إعداد نمطي، تتبعه عمليات أحادية التنفيذ للنموذج، والوكيل، وPlugin الخاص بـ Discord،
    وSecretRef. ويتحقق من الإعدادات ومدخلات التدقيق. يُعد هذا
    دليلًا داعمًا للبوابة/العمليات، وليس إثباتًا للإعداد الأولي التفاعلي أو
    وكيل/أداة/موافقة Crestodian. يتوفر المسار نفسه في مختبر ضمان الجودة عبر
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- اختبار دخان لتكلفة Moonshot/Kimi: بعد ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل أمرًا معزولًا
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مقابل `moonshot/kimi-k2.6`. تحقق من أن JSON يبلّغ عن Moonshot/K2.6 وأن
  نص المساعد يخزّن `usage.cost` بعد توحيده.

<Tip>
عندما تحتاج إلى حالة فشل واحدة فقط، فضّل تضييق نطاق الاختبارات المباشرة باستخدام متغيرات بيئة قائمة السماح الموضحة أدناه.
</Tip>

## المشغّلات الخاصة بضمان الجودة

توجد هذه الأوامر بجانب حزم الاختبارات الرئيسية عندما تحتاج إلى واقعية مختبر ضمان الجودة.

يشغّل CI مختبر ضمان الجودة في مهام سير عمل مخصصة. يُدرج التكافؤ الوكيلي ضمن
`QA-Lab - All Lanes` والتحقق من الإصدار، وليس ضمن سير عمل مستقل لطلبات السحب.
يجب أن يستخدم التحقق الواسع `Full Release Validation` مع
`rerun_group=qa-parity` أو مجموعة ضمان الجودة لفحوص الإصدار. تُبقي فحوص الإصدار
المستقرة/الافتراضية اختبارات التحمل المباشرة/Docker الشاملة خلف `run_release_soak=true`؛
بينما يفرض ملف التعريف `full` تشغيل اختبارات التحمل. يعمل `QA-Lab - All Lanes` ليليًا على `main`
ومن التشغيل اليدوي، مع مسار التكافؤ الوهمي، ومسار Matrix المباشر،
ومسار Telegram المباشر المُدار بواسطة Convex، ومسار Discord المباشر المُدار بواسطة Convex،
بوصفها مهام متوازية. تمرّر مهام ضمان الجودة المجدولة وفحوص الإصدار الخيار
`--profile fast` إلى Matrix صراحةً، بينما تظل القيمة الافتراضية لـ CLI الخاص بـ Matrix
وإدخال سير العمل اليدوي هي `all`؛ ويمكن للتشغيل اليدوي تقسيم `all` إلى مهام
`transport`، و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`.
يشغّل `OpenClaw Release Checks` التكافؤ بالإضافة إلى مساري Matrix السريع وTelegram
قبل الموافقة على الإصدار، باستخدام `mock-openai/gpt-5.6-luna` لفحوص نقل الإصدار
كي تظل حتمية وتتجنب بدء تشغيل Plugin المزوّد العادي. تعطّل بوابات النقل
المباشر هذه البحث في الذاكرة؛ ويظل سلوك الذاكرة مغطى بحزم تكافؤ ضمان الجودة.

تستخدم أقسام الوسائط المباشرة للإصدار الكامل
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، التي تتضمن مسبقًا
`ffmpeg` و`ffprobe`. تستخدم أقسام النماذج/الخلفيات المباشرة عبر Docker صورة
`ghcr.io/openclaw/openclaw-live-test:<sha>` المشتركة، التي تُبنى مرة واحدة لكل
التزام محدد، ثم تسحبها باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` بدلًا من إعادة بنائها
داخل كل قسم.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات ضمان الجودة المدعومة بالمستودع مباشرةً على المضيف.
  - ينشئ في المستوى الأعلى ملفات الأدلة `qa-evidence.json` و`qa-suite-summary.json` و
    `qa-suite-report.md` لمجموعة السيناريوهات المحددة، بما في ذلك
    اختيارات سيناريوهات التدفق المختلط وVitest وPlaywright.
  - عند تشغيله بواسطة `pnpm openclaw qa run --qa-profile <profile>`، يضمّن
    بطاقة تقييم ملف التصنيف المحدد في ملف `qa-evidence.json` نفسه.
    يكتب `smoke-ci` أدلة مختصرة (`evidenceMode: "slim"`، من دون
    `execution` لكل إدخال). يغطي `release` الشريحة المنسّقة لجاهزية الإصدار؛ ويحدد `all`
    كل فئات النضج النشطة ويستهدف عمليات التشغيل الصريحة لسير عمل أدلة ملف
    ضمان الجودة عندما تكون هناك حاجة إلى ملف بطاقة تقييم كامل.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا باستخدام عمال
    Gateway معزولين. يستخدم `qa-channel` تزامنًا افتراضيًا قدره 4 (مقيّدًا بعدد
    السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد
    العمال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - ينهي التنفيذ برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures`
    لإنشاء الملفات دون رمز خروج يشير إلى الفشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم مزوّد محليًا مدعومًا بـAIMock لتغطية
    التركيبات التجريبية ومحاكاة البروتوكول دون استبدال مسار
    `mock-openai` المدرك للسيناريوهات.
- `pnpm openclaw qa coverage --match <query>`
  - يبحث في معرّفات السيناريوهات وعناوينها وأسطرحها ومعرّفات التغطية ومراجع الوثائق ومراجع
    الشيفرة وplugins ومتطلبات المزوّدين، ثم يطبع أهداف الحزمة
    المطابقة.
  - استخدم هذا قبل تشغيل مختبر ضمان الجودة عندما تعرف السلوك المتأثر أو مسار
    الملف، لكنك لا تعرف أصغر سيناريو. هذا إرشادي فقط — ولا يزال عليك اختيار دليل
    المحاكاة أو التشغيل الفعلي أو Multipass أو Matrix أو النقل بناءً على السلوك
    الذي يجري تغييره.
- `pnpm test:plugins:kitchen-sink-live`
  - يشغّل مجموعة اختبارات Plugin ‏OpenAI Kitchen Sink الفعلية عبر مختبر ضمان الجودة.
    يثبّت حزمة Kitchen Sink الخارجية، ويتحقق من جرد أسطح plugin SDK،
    ويفحص `/healthz` و`/readyz`، ويسجّل أدلة
    CPU/RSS الخاصة بـGateway، ويشغّل دورة OpenAI فعلية، ويتحقق من
    التشخيصات العدائية. يتطلب مصادقة OpenAI فعلية مثل `OPENAI_API_KEY`. في
    جلسات Testbox المجهّزة، يحمّل تلقائيًا ملف المصادقة الفعلية
    الخاص بـTestbox عند توفر مساعد `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - يشغّل اختبار أداء بدء تشغيل Gateway بالإضافة إلى حزمة صغيرة من سيناريوهات مختبر ضمان الجودة المحاكية
    (`channel-chat-baseline` و`memory-failure-fallback` و
    `gateway-restart-inflight-run`) ويكتب ملخصًا مجمعًا لملاحظات CPU
    ضمن `.artifacts/gateway-cpu-scenarios/`.
  - لا يضع علامات افتراضيًا إلا على ملاحظات الاستهلاك المرتفع المستمر للمعالج (`--cpu-core-warn`،
    وقيمته الافتراضية `0.9`؛ و`--hot-wall-warn-ms`، وقيمته الافتراضية `30000`)، لذلك تُسجّل اندفاعات
    بدء التشغيل القصيرة كمقاييس دون أن تبدو كتراجع تثبيت
    Gateway الذي يستمر دقائق.
  - يعمل على ملفات `dist` المبنية؛ نفّذ عملية بناء أولًا عندما لا تحتوي نسخة العمل
    بالفعل على مخرجات تشغيل حديثة.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل حزمة ضمان الجودة نفسها داخل جهاز Linux افتراضي مؤقت من Multipass، مع الاحتفاظ
    بأعلام تحديد السيناريوهات والمزوّد/النموذج نفسها المستخدمة في `qa suite`.
  - تمرّر عمليات التشغيل الفعلية مدخلات مصادقة ضمان الجودة المناسبة للضيف:
    مفاتيح المزوّد المستندة إلى متغيرات البيئة، ومسار إعدادات مزوّد التشغيل الفعلي لضمان الجودة، و
    `CODEX_HOME` عند توفره.
  - يجب أن تبقى مجلدات المخرجات ضمن جذر المستودع حتى يتمكن الضيف من الكتابة
    عبر مساحة العمل المركّبة.
  - يكتب تقرير ضمان الجودة وملخصه المعتادين، بالإضافة إلى سجلات Multipass ضمن
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع ضمان الجودة المدعوم بـDocker لأعمال ضمان الجودة بأسلوب المشغّلين.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني حزمة tarball خاصة بـnpm من نسخة العمل الحالية، ويثبّتها عموميًا داخل
    Docker، ويشغّل إعداد مفتاح واجهة OpenAI API دون تفاعل، ويضبط
    Telegram افتراضيًا، ويتحقق من تحميل وقت تشغيل plugin المضمّن دون
    إصلاح تبعيات بدء التشغيل، ويشغّل doctor، ثم يشغّل دورة واحدة للوكيل المحلي
    على نقطة نهاية OpenAI محاكية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار تثبيت الحزمة
    نفسه مع Discord.
- `pnpm test:docker:session-runtime-context`
  - يشغّل اختبار دخان حتميًا داخل Docker للتطبيق المبني، خاصًا بنصوص سياق وقت التشغيل
    المضمّنة. يتحقق من استمرار سياق وقت تشغيل OpenClaw المخفي بصفته
    رسالة مخصصة غير معروضة بدلًا من تسرّبه إلى دورة المستخدم
    المرئية، ثم يضيف بيانات أولية إلى جلسة JSONL معطلة متأثرة ويتحقق من أن
    `openclaw doctor --fix` يعيد كتابتها إلى الفرع النشط مع نسخة احتياطية.
- `pnpm test:docker:npm-telegram-live`
  - يثبّت حزمة OpenClaw مرشحة داخل Docker، ويشغّل إعداد الحزمة
    المثبّتة، ويضبط Telegram عبر CLI المثبّت، ثم يعيد استخدام
    مسار ضمان الجودة الفعلي الخاص بـTelegram مع تلك الحزمة المثبّتة باعتبار Gateway
    النظام الخاضع للاختبار.
  - يركّب الغلاف مصدر أداة `qa-lab` فقط من نسخة العمل؛
    وتملك الحزمة المثبّتة `dist` و`openclaw/plugin-sdk` ووقت تشغيل
    plugin المضمّن، ولذلك لا يخلط المسار plugins الخاصة بنسخة العمل الحالية داخل
    الحزمة الخاضعة للاختبار.
  - القيمة الافتراضية هي `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`؛ عيّن
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` أو
    `OPENCLAW_CURRENT_PACKAGE_TGZ` لاختبار حزمة tarball محلية محلولة بدلًا
    من التثبيت من السجل.
  - يصدر قياسات توقيت RTT متكررة في `qa-evidence.json` افتراضيًا باستخدام
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. تجاوز
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES` أو
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` أو
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` لضبط التشغيل.
    يقبل `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` قائمة مفصولة بفواصل من
    معرّفات فحوص ضمان الجودة الخاصة بـTelegram لأخذ عينات منها؛ وعند عدم تعيينه، يكون الفحص الافتراضي
    القادر على قياس RTT هو `telegram-mentioned-message-reply`.
  - يستخدم بيانات اعتماد Telegram نفسها المستمدة من متغيرات البيئة أو مصدر بيانات اعتماد Convex نفسه
    مثل `pnpm openclaw qa telegram`. لأتمتة CI/الإصدار، عيّن
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` بالإضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسرّ الدور. إذا كان
    `OPENCLAW_QA_CONVEX_SITE_URL` وسرّ دور Convex موجودين في
    CI، فسيحدد غلاف Docker ‏Convex تلقائيًا.
  - يتحقق الغلاف من متغيرات بيئة بيانات اعتماد Telegram أو Convex على المضيف
    قبل أعمال البناء/التثبيت داخل Docker. عيّن
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` فقط عند
    تصحيح إعداد ما قبل بيانات الاعتماد عمدًا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`
    القيمة المشتركة `OPENCLAW_QA_CREDENTIAL_ROLE` لهذا المسار فقط. عند تحديد بيانات اعتماد
    Convex وعدم تعيين دور، يستخدم الغلاف `ci` داخل CI
    و`maintainer` خارجه.
  - يوفّر GitHub Actions هذا المسار أيضًا كسير عمل يدوي للمشرفين
    `NPM Telegram Beta E2E`. ولا يعمل عند الدمج. يستخدم سير العمل
    بيئة `qa-live-shared` وتأجيرات بيانات اعتماد Convex الخاصة بـCI.
- يوفّر GitHub Actions أيضًا `Package Acceptance` لإثبات المنتج بتشغيل جانبي
  على حزمة مرشحة واحدة. ويقبل مرجع Git، أو مواصفة npm منشورة،
  أو عنوان URL لحزمة tarball عبر HTTPS مع SHA-256، أو سياسة عنوان URL موثوق، أو ملف حزمة tarball
  من تشغيل آخر (`source=ref|npm|url|trusted-url|artifact`)، ويرفع
  ملف `openclaw-current.tgz` الموحّد باسم `package-under-test`، ثم يشغّل
  مجدول اختبارات Docker الشاملة الحالي باستخدام ملفات مسارات `smoke` أو `package` أو `product` أو `full`
  أو `custom`. عيّن `telegram_mode=mock-openai` أو
  `live-frontier` لتشغيل سير عمل ضمان الجودة الخاص بـTelegram على ملف
  `package-under-test` نفسه.
  - أحدث إثبات لمنتج الإصدار التجريبي:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- يتطلب إثبات عنوان URL الدقيق لحزمة tarball قيمة تجزئة، ويستخدم سياسة أمان عناوين URL العامة:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- تستخدم مرايا حزم tarball المؤسسية/الخاصة سياسة صريحة للمصدر الموثوق:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

يقرأ `source=trusted-url` الملف `.github/package-trusted-sources.json` من مرجع سير العمل الموثوق، ولا يقبل بيانات اعتماد في عنوان URL أو تجاوزًا للشبكة الخاصة عبر مدخلات سير العمل. إذا كانت السياسة المسماة تعلن مصادقة برمز حامل، فاضبط السر الثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- ينزّل إثبات الملف حزمة tarball من تشغيل Actions آخر:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - يحزم بنية OpenClaw الحالية ويثبّتها داخل Docker، ويبدأ
    Gateway مع ضبط OpenAI، ثم يفعّل القنوات/plugins المضمّنة عبر
    تعديلات الإعدادات.
  - يتحقق من أن اكتشاف الإعداد يُبقي plugins القابلة للتنزيل وغير المضبوطة
    غائبة، وأن أول إصلاح مضبوط بواسطة doctor يثبّت كل
    plugin مفقود قابل للتنزيل صراحةً، وأن إعادة التشغيل الثانية لا تنفّذ
    إصلاحًا مخفيًا للتبعيات.
  - يثبّت أيضًا خط أساس أقدم معروفًا من npm، ويفعّل Telegram قبل
    تشغيل `openclaw update --tag <candidate>`، ويتحقق من أن
    doctor الخاص بما بعد تحديث المرشح ينظّف بقايا تبعيات plugin القديمة
    دون إصلاح postinstall من جانب أداة الاختبار.
- `pnpm test:parallels:npm-update`
  - يشغّل اختبار دخان تحديث التثبيت المحزّم الأصلي عبر ضيوف Parallels.
    تثبّت كل منصة محددة أولًا حزمة خط الأساس المطلوبة،
    ثم تشغّل أمر `openclaw update` المثبّت داخل الضيف نفسه،
    وتتحقق من الإصدار المثبّت وحالة التحديث وجاهزية Gateway
    ودورة واحدة للوكيل المحلي.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux`
    أثناء العمل التكراري على ضيف واحد. استخدم `--json` للحصول على مسار ملف الملخص
    وحالة كل مسار.
  - يستخدم مسار OpenAI النموذج `openai/gpt-5.6-luna` لإثبات دورة الوكيل الفعلية
    افتراضيًا. مرّر `--model <provider/model>` أو عيّن
    `OPENCLAW_PARALLELS_OPENAI_MODEL` للتحقق من نموذج OpenAI آخر.
  - أحط عمليات التشغيل المحلية الطويلة بمهلة زمنية على المضيف حتى لا تستهلك حالات
    تعطل نقل Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب البرنامج النصي سجلات المسارات المتداخلة ضمن
    `/tmp/openclaw-parallels-npm-update.*`. افحص `windows-update.log`
    أو `macos-update.log` أو `linux-update.log` قبل افتراض أن الغلاف
    الخارجي عالق.
  - قد يستغرق تحديث Windows من 10 إلى 15 دقيقة في أعمال doctor لما بعد التحديث
    وتحديث الحزمة على ضيف بارد؛ ويظل ذلك سليمًا ما دام
    سجل تصحيح npm المتداخل يتقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات اختبار الدخان الفردية
    لـParallels على macOS أو Windows أو Linux. فهي تشترك في حالة الجهاز الافتراضي وقد
    تتعارض عند استعادة اللقطة أو تقديم الحزمة أو حالة Gateway لدى الضيف.
  - يشغّل إثبات ما بعد التحديث سطح plugin المضمّن المعتاد لأن
    واجهات القدرات مثل الكلام وتوليد الصور وفهم
    الوسائط تُحمّل عبر واجهات API لوقت التشغيل المضمّن، حتى عندما
    لا تتحقق دورة الوكيل نفسها إلا من استجابة نصية بسيطة.

- `pnpm openclaw qa aimock`
  - يشغّل فقط خادم موفّر AIMock المحلي لإجراء اختبارات دخان مباشرة
    للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار ضمان الجودة الحي لـ Matrix على خادم Tuwunel منزلي مؤقت
    مدعوم بـ Docker. متاح فقط من نسخة الشيفرة المصدرية؛ لا تتضمن عمليات التثبيت
    المعبأة `qa-lab`.
  - CLI الكامل، ودليل الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط العناصر:
    [ضمان جودة Matrix](/ar/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - يشغّل مسار ضمان الجودة الحي لـ Telegram على مجموعة خاصة حقيقية باستخدام
    رموز بوت المشغّل والنظام قيد الاختبار من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID`،
    و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`،
    و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف
    محادثة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمّعة.
    استخدم وضع البيئة افتراضيًا، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    للاشتراك في التأجيرات المجمّعة.
  - تغطي الإعدادات الافتراضية الاختبار الكناري، وتقييد الإشارات، وعنونة الأوامر، و`/status`،
    والردود من بوت إلى بوت عند الإشارة، وردود الأوامر الأصلية الأساسية.
    تغطي إعدادات `mock-openai` الافتراضية أيضًا سلسلة الردود الحتمية
    وانحدارات بث الرسالة النهائية في Telegram. استخدم `--list-scenarios`
    لعمليات الفحص الاختيارية مثل `session_status`.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` لإنشاء
    العناصر من دون رمز خروج دال على الفشل.
  - يتطلب بوتين مختلفين في المجموعة الخاصة نفسها، مع إتاحة بوت النظام قيد الاختبار
    اسم مستخدم في Telegram.
  - لضمان مراقبة مستقرة من بوت إلى بوت، فعّل Bot-to-Bot Communication Mode
    في `@BotFather` لكلا البوتين، وتأكد من قدرة بوت المشغّل على مراقبة
    حركة البوتات في المجموعة.
  - يكتب تقرير ضمان جودة Telegram وملخصًا و`qa-evidence.json` ضمن
    `.artifacts/qa-e2e/...`. تتضمن سيناريوهات الرد زمن الذهاب والإياب من طلب إرسال
    المشغّل إلى رد النظام قيد الاختبار المرصود.

`Mantis Telegram Live` هو غلاف أدلة طلب السحب حول هذا المسار. يشغّل
المرجع المرشح باستخدام بيانات اعتماد Telegram مؤجّرة من Convex، ويعرض
حزمة تقرير/أدلة ضمان الجودة المنقّحة في متصفح سطح مكتب Crabbox، ويسجل أدلة
MP4، وينشئ ملف GIF مقتطعًا حسب الحركة، ويرفع حزمة العناصر، وينشر أدلة مضمنة
في طلب السحب عبر تطبيق Mantis في GitHub عند تعيين `pr_number`. يمكن للمشرفين
بدء تشغيله من واجهة Actions عبر `Mantis Scenario`
(`scenario_id: telegram-live`) أو مباشرة من تعليق على طلب سحب:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` هو غلاف وكيل Telegram Desktop الأصلي
لما قبل التغيير وبعده، والمخصص للإثبات المرئي لطلب السحب. شغّله من واجهة Actions باستخدام
`instructions` حرة الصياغة، أو عبر `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`)، أو من تعليق على طلب سحب:

```text
@openclaw-mantis telegram desktop proof
```

يقرأ وكيل Mantis طلب السحب، ويحدد أي سلوك ظاهر في Telegram يثبت
التغيير، ويشغّل مسار إثبات Telegram Desktop لمستخدم حقيقي عبر Crabbox على
مرجعي خط الأساس والمرشح، ويكرر العملية حتى تصبح ملفات GIF الأصلية مفيدة،
ويكتب بيان `motionPreview` مزدوجًا، وينشر جدول GIF نفسه ذي العمودين
عبر تطبيق Mantis في GitHub عند تعيين `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - يستأجر سطح مكتب Linux من Crabbox أو يعيد استخدامه، ويثبّت Telegram
    Desktop الأصلي، ويضبط OpenClaw باستخدام رمز بوت النظام قيد الاختبار في Telegram مستأجر،
    ويشغّل Gateway، ويسجل أدلة لقطات الشاشة/MP4 من
    سطح مكتب VNC الظاهر.
  - يستخدم `--credential-source convex` افتراضيًا كي لا تحتاج مهام سير العمل إلا إلى
    سر وسيط Convex. استخدم `--credential-source env` مع متغيرات
    `OPENCLAW_QA_TELEGRAM_*` نفسها المستخدمة مع `pnpm openclaw qa telegram`.
  - لا يزال Telegram Desktop يحتاج إلى تسجيل دخول/ملف شخصي لمستخدم. يضبط رمز البوت
    OpenClaw فقط. استخدم `--telegram-profile-archive-env <name>`
    لأرشيف ملف شخصي `.tgz` بترميز base64، أو استخدم `--keep-lease` وسجّل الدخول
    يدويًا عبر VNC مرة واحدة.
  - يكتب `mantis-telegram-desktop-builder-report.md`،
    و`mantis-telegram-desktop-builder-summary.json`،
    و`telegram-desktop-builder.png`، و`telegram-desktop-builder.mp4`
    ضمن دليل الإخراج.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل
الجديدة؛ وتوجد مصفوفة التغطية لكل مسار في
[نظرة عامة على ضمان الجودة - تغطية النقل الحي](/ar/concepts/qa-e2e-automation#live-transport-coverage).
يمثل `qa-channel` الحزمة الاصطناعية الواسعة وليس جزءًا من تلك المصفوفة.

### بيانات اعتماد Telegram المشتركة عبر Convex (الإصدار 1)

عند تمكين `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
لضمان جودة النقل الحي، يحصل مختبر ضمان الجودة على تأجير حصري من
مجموعة مدعومة بـ Convex، ويرسل Heartbeat لذلك التأجير أثناء تشغيل المسار،
ويحرر التأجير عند الإيقاف. يسبق اسم هذا القسم دعم Discord وSlack و
WhatsApp؛ فعقد التأجير مشترك بين الأنواع.

هيكل مشروع Convex المرجعي: `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` للدور `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` للدور `ci`
- تحديد دور بيانات الاعتماد:
  - CLI:‏ `--credential-role maintainer|ci`
  - القيمة الافتراضية من البيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (القيمة الافتراضية `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (القيمة الافتراضية `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (القيمة الافتراضية `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (القيمة الافتراضية `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (القيمة الافتراضية `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (القيمة الافتراضية `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL لـ Convex تستخدم local loopback ‏`http://` للتطوير المحلي فقط.

ينبغي أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البروتوكول `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرفين (إضافة/إزالة/سرد المجموعة)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

أدوات CLI المساعدة للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل عمليات التشغيل الحية للتحقق من عنوان URL لموقع Convex وأسرار الوسيط
وبادئة نقطة النهاية ومهلة HTTP وإمكانية الوصول للإدارة/السرد من دون طباعة
قيم الأسرار. استخدم `--json` للحصول على مخرجات قابلة للقراءة آليًا في البرامج النصية وأدوات
CI.

عقد نقطة النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
تصادق الطلبات باستخدام ترويسة `Authorization: Bearer <role secret>`؛
وتحذف الأجسام أدناه تلك الترويسة:

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

بنية الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة لمعرّف محادثة Telegram رقمي.
- يتحقق `admin/add` من هذه البنية عند `kind: "telegram"` ويرفض الحمولات المشوهة.

بنية الحمولة لنوع المستخدم الحقيقي في Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- يجب أن تكون `groupId` و`testerUserId` و`telegramApiId` سلاسل رقمية.
- يجب أن تكون `tdlibArchiveSha256` و`desktopTdataArchiveSha256` سلاسل ست عشرية من نوع SHA-256.
- يُحجز `kind: "telegram-user"` لسير عمل إثبات Mantis لـ Telegram Desktop. يجب ألا تحصل عليه مسارات مختبر ضمان الجودة العامة.

حمولات القنوات المتعددة التي يتحقق منها الوسيط:

- Discord:‏ `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp:‏ `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

يمكن لمسارات Slack أيضًا الاستئجار من المجموعة، لكن التحقق من حمولة Slack
موجود حاليًا في مشغّل ضمان جودة Slack بدلًا من الوسيط. استخدم
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
لصفوف Slack.

### إضافة قناة إلى ضمان الجودة

توجد أسماء البنية وأدوات السيناريو المساعدة لمهايئات القنوات الجديدة في
[نظرة عامة على ضمان الجودة - إضافة قناة](/ar/concepts/qa-e2e-automation#adding-a-channel).
الحد الأدنى المطلوب: نفّذ مشغّل النقل على وصلة مضيف `qa-lab` المشتركة،
وأضف `adapterFactory` للسيناريوهات المشتركة، وصرّح عن `qaRunners` في
بيان Plugin، وثبّته بوصفه `openclaw qa <runner>`، وأنشئ السيناريوهات ضمن
`qa/scenarios/`.

## حزم الاختبار (ما يُشغّل وأين)

فكّر في الحزم بوصفها «واقعية متزايدة» (مع زيادة عدم الاستقرار/التكلفة).

### اختبارات الوحدة / التكامل (الافتراضية)

- الأمر: `pnpm test`
- الضبط: تستخدم عمليات التشغيل غير المستهدفة مجموعة الأجزاء `vitest.full-*.config.ts`، وقد
  توسّع الأجزاء متعددة المشاريع إلى إعدادات منفصلة لكل مشروع للجدولة
  المتوازية
- الملفات: قوائم اختبارات النواة/الوحدة ضمن `src/**/*.test.ts`،
  و`packages/**/*.test.ts`، و`test/**/*.test.ts`؛ وتعمل اختبارات وحدة واجهة المستخدم في
  الجزء المخصص `unit-ui`
- النطاق:
  - اختبارات وحدة خالصة
  - اختبارات تكامل داخل العملية (مصادقة Gateway، والتوجيه، والأدوات، والتحليل، والضبط)
  - اختبارات انحدار حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - ينبغي أن تكون سريعة ومستقرة
  - يجب أن تثبت اختبارات المحلّل ومحمّل الأسطح العامة سلوك الرجوع الواسع لـ `api.js`
    و`runtime-api.js` باستخدام تركيبات Plugin صغيرة مولّدة،
    لا واجهات API المصدرية الفعلية لملحقات Plugin المضمّنة. تنتمي عمليات تحميل API الفعلية لملحقات Plugin إلى
    حزم العقود/التكامل التي يملكها كل Plugin.

سياسة الاعتماديات الأصلية:

- تتخطى عمليات تثبيت الاختبار الافتراضية عمليات بناء opus الأصلية الاختيارية لـ Discord. يستخدم صوت Discord
  الحزمة المضمّنة `libopus-wasm`، وتظل `@discordjs/opus` معطلة في
  `allowBuilds` حتى لا تجمع الاختبارات المحلية ومسارات Testbox الإضافة
  الأصلية.
- قارن أداء opus الأصلي في مستودع قياس أداء `libopus-wasm`، وليس
  في حلقات التثبيت/الاختبار الافتراضية لـ OpenClaw. لا تعيّن `@discordjs/opus` إلى
  `true` في `allowBuilds` الافتراضي؛ فهذا يجعل حلقات التثبيت/الاختبار غير المرتبطة
  تجمع شيفرة أصلية.

<AccordionGroup>
  <Accordion title="المشاريع والأجزاء والمسارات محددة النطاق">

    - تُشغِّل أوامر `pnpm test` غير المستهدفة ثلاثة عشر إعدادًا مجزّأً أصغر (`core-unit-fast`، و`core-unit-src`، و`core-unit-security`، و`core-unit-ui`، و`core-unit-support`، و`core-support-boundary`، و`core-tooling`، و`core-contracts`، و`core-bundled`، و`core-runtime`، و`agentic`، و`auto-reply`، و`extensions`) بدلًا من عملية أصلية عملاقة واحدة للمشروع الجذري. يقلل هذا ذروة RSS على الأجهزة المحمّلة ويمنع أعمال الرد التلقائي/الإضافات من حرمان مجموعات الاختبارات غير المرتبطة من الموارد.
    - يظل `pnpm test --watch` يستخدم مخطط المشروع الأصلي الجذري `vitest.config.ts`، لأن حلقة المراقبة متعددة الأجزاء غير عملية.
    - توجّه أوامر `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر المسارات المحددة النطاق أولًا، بحيث يتجنب `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` تحمّل تكلفة بدء المشروع الجذري كاملة.
    - يوسّع `pnpm test:changed` مسارات git المتغيرة افتراضيًا إلى مسارات محددة النطاق ومنخفضة التكلفة: تعديلات الاختبارات المباشرة، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، والملفات التابعة ضمن مخطط الاستيراد المحلي. لا تؤدي تعديلات الإعداد/التهيئة/الحزمة إلى تشغيل واسع للاختبارات ما لم تستخدم صراحةً `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - يُعد `pnpm check:changed` بوابة الفحص المحلية الذكية المعتادة للأعمال محدودة النطاق. فهو يصنّف الفرق إلى النواة، واختبارات النواة، والإضافات، واختبارات الإضافات، والتطبيقات، والوثائق، والبيانات الوصفية للإصدار، وأدوات Docker الحية، والأدوات، ثم يشغّل أوامر فحص الأنواع والتحليل الساكن والحراسة المطابقة. ولا يشغّل اختبارات Vitest؛ استخدم `pnpm test:changed` أو `pnpm test <target>` صراحةً لإثبات الاختبارات. تشغّل زيادات الإصدار التي تقتصر على البيانات الوصفية للإصدار فحوصات مستهدفة للإصدار/الإعداد/تبعيات الجذر، مع حارس يرفض تغييرات الحزم خارج حقل الإصدار ذي المستوى الأعلى.
    - تشغّل تعديلات حاضنة Docker الحية لـ ACP فحوصات مركزة: صياغة shell لنصوص مصادقة Docker الحية وتشغيلًا تجريبيًا لمجدول Docker الحي. لا تُضمّن تغييرات `package.json` إلا عندما يقتصر الفرق على `scripts["test:docker:live-*"]`؛ أما تعديلات التبعيات والتصدير والإصدار وغيرها من تعديلات سطح الحزمة فتظل تستخدم الحراس الأوسع.
    - تُوجَّه اختبارات الوحدات خفيفة الاستيراد من الوكلاء والأوامر والإضافات ومساعدات الرد التلقائي و`plugin-sdk` ومناطق الأدوات المساعدة النقية المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ بينما تبقى الملفات ذات الحالة أو كثيفة وقت التشغيل على المسارات الحالية.
    - كما تربط ملفات مصدر مساعدة محددة من `plugin-sdk` و`commands` عمليات الوضع المتغير باختبارات شقيقة صريحة ضمن تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل مجموعة الاختبارات الثقيلة الكاملة لذلك الدليل.
    - يحتوي `auto-reply` على مجموعات مخصصة لمساعدات النواة ذات المستوى الأعلى، واختبارات التكامل `reply.*` ذات المستوى الأعلى، والشجرة الفرعية `src/auto-reply/reply/**`. ويقسّم CI شجرة الردود الفرعية أكثر إلى أجزاء لمشغّل الوكيل والتوزيع والأوامر/توجيه الحالة، كي لا تستحوذ مجموعة واحدة كثيفة الاستيراد على كامل الجزء المتأخر من Node.
    - يتخطى CI المعتاد لطلبات السحب/الفرع الرئيسي عمدًا المسح الدفعي للإضافات المضمّنة والجزء `agentic-plugins` المخصص للإصدار فقط. ويطلق التحقق الكامل من الإصدار سير العمل الفرعي المنفصل `Plugin Prerelease` لمجموعات الاختبارات كثيفة الإضافات هذه على الإصدارات المرشحة.

  </Accordion>

  <Accordion title="تغطية المشغّل المضمّن">

    - عند تغيير مدخلات اكتشاف أداة الرسائل أو سياق وقت تشغيل Compaction،
      احتفظ بمستويي التغطية.
    - أضف اختبارات تراجع مركزة للمساعدات عند حدود التوجيه والتطبيع
      النقية.
    - حافظ على سلامة مجموعات تكامل المشغّل المضمّن:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`،
      و`src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`،
      و`src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه المجموعات من استمرار تدفق المعرّفات محددة النطاق وسلوك Compaction
      عبر مساري `run.ts` / `compact.ts` الحقيقيين؛ ولا تُعد اختبارات
      المساعدات وحدها بديلًا كافيًا لمسارات التكامل هذه.

  </Accordion>

  <Accordion title="القيم الافتراضية لمجموعة Vitest والعزل">

    - يستخدم إعداد Vitest الأساسي `threads` افتراضيًا.
    - يثبت إعداد Vitest المشترك القيمة `isolate: false` ويستخدم المشغّل
      غير المعزول عبر المشاريع الجذرية وإعدادات الاختبارات الشاملة والحية.
    - يحتفظ مسار واجهة المستخدم الجذري بتهيئة `jsdom` والمحسّن الخاصين به، لكنه يعمل
      أيضًا على المشغّل المشترك غير المعزول.
    - يرث كل جزء من `pnpm test` القيم الافتراضية نفسها `threads` + `isolate: false`
      من إعداد Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` افتراضيًا إلى عمليات Node
      الفرعية لـ Vitest لتقليل تكرار ترجمة V8 أثناء عمليات التشغيل المحلية الكبيرة.
      اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع سلوك V8
      القياسي.
    - ينهي `scripts/run-vitest.mjs` عمليات Vitest الصريحة غير الخاضعة للمراقبة
      بعد 5 دقائق دون أي مخرجات على stdout أو stderr. اضبط
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` لتعطيل آلية المراقبة في
      تحقيق صامت عمدًا.

  </Accordion>

  <Accordion title="التكرار المحلي السريع">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يؤدي الفرق إلى تشغيلها.
    - خطاف ما قبل الالتزام مخصص للتنسيق فقط. ويعيد إضافة الملفات المنسقة
      إلى منطقة التجهيز، ولا يشغّل التحليل الساكن أو فحص الأنواع أو الاختبارات.
    - شغّل `pnpm check:changed` صراحةً قبل التسليم أو الدفع عندما
      تحتاج إلى بوابة الفحص المحلية الذكية.
    - يوجّه `pnpm test:changed` عبر مسارات محددة النطاق ومنخفضة التكلفة افتراضيًا. استخدم
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يقرر الوكيل
      أن تعديلًا في الحاضنة أو الإعداد أو الحزمة أو العقد يحتاج فعلًا إلى
      تغطية أوسع من Vitest.
    - يحتفظ `pnpm test:max` و`pnpm test:changed:max` بسلوك التوجيه
      نفسه، ولكن بحد أعلى لعدد العمال.
    - التوسع التلقائي للعمال المحليين محافظ عمدًا ويتراجع
      عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، بحيث تسبب عمليات
      Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
    - يضع إعداد Vitest الأساسي علامة `forceRerunTriggers` على ملفات
      المشاريع/الإعداد، كي تظل عمليات إعادة التشغيل في الوضع المتغير صحيحة عند تغير
      توصيل الاختبارات.
    - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على
      المضيفين المدعومين؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      لتحديد موقع تخزين مؤقت صريح واحد للتحليل المباشر للأداء.

  </Accordion>

  <Accordion title="تصحيح أخطاء الأداء">

    - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest إلى جانب
      مخرجات تفصيل الاستيراد.
    - يقصر `pnpm test:perf:imports:changed` عرض التحليل نفسه على
      الملفات المتغيرة منذ `origin/main`.
    - تُكتب بيانات توقيت الأجزاء إلى `.artifacts/vitest-shard-timings.json`.
      تستخدم عمليات تشغيل الإعداد الكامل مسار الإعداد مفتاحًا؛ وتلحق أجزاء CI
      ذات نمط التضمين اسم الجزء حتى يمكن تتبع الأجزاء المرشحة
      بصورة منفصلة.
    - عندما يظل اختبار مكثف واحد يقضي معظم وقته في استيرادات بدء التشغيل،
      أبقِ التبعيات الثقيلة خلف حد محلي ضيق `*.runtime.ts` وأنشئ
      محاكاة لذلك الحد مباشرةً بدلًا من الاستيراد العميق لمساعدات وقت التشغيل
      لمجرد تمريرها عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` الأمر
      الموجّه `test:changed` بمسار المشروع الجذري الأصلي لذلك
      الفرق الملتزم، ويطبع الزمن الفعلي إلى جانب الحد الأقصى لـ RSS على macOS.
    - يقيس `pnpm test:perf:changed:bench -- --worktree` أداء شجرة العمل
      الحالية غير النظيفة عبر توجيه قائمة الملفات المتغيرة من خلال
      `scripts/test-projects.mjs` وإعداد Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لتكاليف
      بدء تشغيل Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل
      لمجموعة الوحدات مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `test/vitest/vitest.gateway.config.ts` و`test/vitest/vitest.logging.config.ts` و`test/vitest/vitest.infra.config.ts`، مع فرض عامل واحد لكل منها
- النطاق:
  - يبدأ Gateway حقيقيًا عبر local loopback مع تمكين التشخيصات افتراضيًا
  - يمرّر تقلبات اصطناعية لرسائل Gateway والذاكرة والحمولات الكبيرة عبر مسار أحداث التشخيص
  - يستعلم عن `diagnostics.stability` عبر RPC الخاص بـ Gateway على WS
  - يغطي مساعدات استمرارية حزمة استقرار التشخيص
  - يؤكد بقاء المسجّل ضمن الحدود، وبقاء عينات RSS الاصطناعية تحت ميزانية الضغط، وعودة أعماق الطوابير لكل جلسة إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يتطلب مفاتيح
  - مسار ضيق لمتابعة حالات تراجع الاستقرار، وليس بديلًا عن مجموعة Gateway الكاملة

### الاختبارات الشاملة (تجميع المستودع)

- الأمر: `pnpm test:e2e`
- النطاق:
  - يشغّل مسار اختبار الدخان الشامل لـ Gateway
  - يشغّل مسار المتصفح الشامل المحاكى لواجهة التحكم
- التوقعات:
  - آمن لـ CI ولا يتطلب مفاتيح
  - يتطلب تثبيت Playwright Chromium

### الاختبارات الشاملة (اختبار دخان Gateway)

- الأمر: `pnpm test:e2e:gateway`
- الإعداد: `test/vitest/vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات الإضافات المضمّنة الشاملة ضمن `extensions/`
- القيم الافتراضية لوقت التشغيل:
  - يستخدم Vitest الخيار `threads` مع `isolate: false`، بما يتوافق مع بقية المستودع.
  - يستخدم عمالًا تكيفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل تكلفة إدخال/إخراج وحدة التحكم.
- التجاوزات المفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تمكين مخرجات وحدة التحكم التفصيلية.
- النطاق:
  - سلوك Gateway شامل متعدد المثيلات
  - أسطح WebSocket/HTTP، وإقران Node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في خط المعالجة)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات الوحدات (وقد يكون أبطأ)

### الاختبارات الشاملة (متصفح واجهة التحكم المحاكى)

- الأمر: `pnpm test:ui:e2e`
- الإعداد: `test/vitest/vitest.ui-e2e.config.ts`
- الملفات: `ui/src/**/*.e2e.test.ts`
- النطاق:
  - يبدأ واجهة التحكم في Vite
  - يقود صفحة Chromium حقيقية عبر Playwright
  - يستبدل WebSocket الخاص بـ Gateway بمحاكيات حتمية داخل المتصفح
- التوقعات:
  - يعمل في CI كجزء من `pnpm test:e2e`
  - لا يتطلب Gateway حقيقيًا أو وكلاء أو مفاتيح مزودين
  - يجب أن تكون تبعية المتصفح موجودة (`pnpm --dir ui exec playwright install chromium`)

### الاختبارات الشاملة: اختبار دخان الواجهة الخلفية لـ OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يعيد استخدام Gateway محلي نشط لـ OpenShell
  - ينشئ بيئة معزولة من Dockerfile محلي مؤقت
  - يختبر الواجهة الخلفية لـ OpenShell في OpenClaw عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات المرجعي البعيد عبر جسر نظام ملفات البيئة المعزولة
- التوقعات:
  - اختياري فقط؛ وليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا لـ `openshell` وعفريت Docker عاملًا
  - يتطلب Gateway محليًا نشطًا لـ OpenShell ومصدر إعداده
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمر بيئة الاختبار المعزولة
- التجاوزات المفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة الاختبارات الشاملة الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI تنفيذي غير افتراضي أو نص تغليف
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` لإتاحة إعداد Gateway المسجل للاختبار المعزول
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` لتجاوز عنوان IP الخاص بـ Gateway في Docker والمستخدم من مثبّت سياسة المضيف

### مباشر (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `test/vitest/vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات Plugin الحية المضمّنة ضمن `extensions/`
- الإعداد الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزوّد/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - اكتشاف تغييرات تنسيق المزوّد، وخصوصيات استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدّل
- التوقعات:
  - غير مصمم ليكون مستقرًا في CI (شبكات حقيقية، وسياسات مزوّدين حقيقية، وحصص، وانقطاعات)
  - يكلّف مالًا / يستهلك حدود المعدّل
  - يُفضّل تشغيل مجموعات فرعية محددة بدلًا من "كل شيء"
- تستخدم عمليات التشغيل الحية مفاتيح API المصدّرة مسبقًا وملفات تعريف المصادقة المرحّلية.
- افتراضيًا، تظل عمليات التشغيل الحية تعزل `HOME` وتنسخ مواد الإعداد/المصادقة إلى مجلد منزل مؤقت للاختبار، كي لا تتمكن تجهيزات اختبارات الوحدات من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية مجلد المنزل الحقيقي لديك.
- يستخدم `pnpm test:live` افتراضيًا وضعًا أكثر هدوءًا: فهو يُبقي مخرجات التقدم `[live] ...` ويكتم سجلات تمهيد Gateway وضجيج Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بكل مزوّد): اضبط `*_API_KEYS` بتنسيق مفصول بفواصل أو فواصل منقوطة، أو `*_API_KEY_1` و`*_API_KEY_2` (مثل `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`)، أو استخدم تجاوزًا خاصًا بالتشغيل الحي عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات تجاوز حد المعدّل.
- مخرجات التقدم/Heartbeat:
  - تصدر مجموعات الاختبارات الحية أسطر تقدم إلى stderr، بحيث تظل استدعاءات المزوّد الطويلة ظاهرة كنشطة حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `test/vitest/vitest.live.config.ts` اعتراض وحدة التحكم في Vitest، بحيث تتدفق أسطر تقدم المزوّد/Gateway فورًا أثناء عمليات التشغيل الحية.
  - اضبط Heartbeat للنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat لـ Gateway/الاستقصاء باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة اختبارات ينبغي أن أشغّل؟

استخدم جدول القرار هذا:

- عند تعديل المنطق/الاختبارات: شغّل `pnpm test` (وكذلك `pnpm test:coverage` إذا غيّرت الكثير)
- عند تعديل شبكة Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- عند تصحيح "الروبوت لدي متوقف" / الأعطال الخاصة بمزوّد / استدعاء الأدوات: شغّل نطاقًا محددًا من `pnpm test:live`

## الاختبارات الحية (التي تتصل بالشبكة)

للحصول على مصفوفة النماذج الحية، واختبارات الدخان للواجهة الخلفية لـ CLI، واختبارات الدخان لـ ACP، وحاضنة خادم تطبيق Codex،
وجميع اختبارات مزوّدي الوسائط الحية (Deepgram وBytePlus وComfyUI
والصور والموسيقى والفيديو وحاضنة الوسائط)، بالإضافة إلى معالجة بيانات الاعتماد لعمليات التشغيل الحية

- راجع [اختبار مجموعات الاختبارات الحية](/ar/help/testing-live). وللاطلاع على قائمة التحقق المخصصة لتحديث
  Plugin والتحقق منه، راجع
  [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

## مشغّلات Docker (فحوص اختيارية لـ "يعمل على Linux")

تنقسم مشغّلات Docker هذه إلى فئتين:

- مشغّلات النماذج الحية: يشغّل `test:docker:live-models` و`test:docker:live-gateway` فقط ملف الاختبار الحي المطابق لمفتاح ملف التعريف داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع وصل مجلد الإعداد المحلي ومساحة العمل وملف بيئة اختياري لملف التعريف. نقطتا الدخول المحليتان المطابقتان هما `test:live:models-profiles` و`test:live:gateway-profiles`.
- تحتفظ مشغّلات Docker الحية بحدودها العملية الخاصة عند الحاجة:
  يستخدم `test:docker:live-models` افتراضيًا المجموعة المنتقاة المدعومة ذات الدلالة العالية، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`،
  و`OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. اضبط `OPENCLAW_LIVE_MAX_MODELS`
  أو متغيرات بيئة Gateway عندما تريد صراحةً حدًا أصغر أو فحصًا أوسع.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ويحزم OpenClaw مرة واحدة كحزمة npm مضغوطة عبر `scripts/package-openclaw-for-docker.mjs`، ثم يبني/يعيد استخدام صورتين من `scripts/e2e/Dockerfile`. الصورة الأساسية ليست سوى مشغّل Node/Git لمسارات التثبيت/التحديث/تبعيات Plugin؛ وتوصل تلك المسارات الحزمة المضغوطة المبنية مسبقًا. تثبّت الصورة الوظيفية الحزمة المضغوطة نفسها في `/app` لمسارات وظائف التطبيق المبني. توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`؛ ويوجد منطق التخطيط في `scripts/lib/docker-e2e-plan.mjs`؛ وينفّذ `scripts/test-docker-all.mjs` الخطة المحددة. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في خانات العمليات، بينما تمنع حدود الموارد المسارات الحية الثقيلة ومسارات تثبيت npm والمسارات متعددة الخدمات من البدء جميعًا في الوقت نفسه. إذا كان مسار واحد أثقل من الحدود النشطة، فلا يزال بإمكان المجدول بدء تشغيله عندما يكون المجمّع فارغًا، ثم يُبقيه قيد التشغيل منفردًا حتى تتوفر السعة مجددًا. القيم الافتراضية هي 10 خانات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ لا تضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (وتجاوزات `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` الأخرى) إلا عندما يكون لدى مضيف Docker سعة فائضة أكبر. يجري المشغّل فحصًا تمهيديًا لـ Docker افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزّن توقيتات المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم تلك التوقيتات لبدء المسارات الأطول أولًا في عمليات التشغيل اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون دون بناء Docker أو تشغيله، أو `node scripts/test-docker-all.mjs --plan-json` لطباعة خطة CI للمسارات المحددة واحتياجات الحزم/الصور وبيانات الاعتماد.
- `Package Acceptance` هي بوابة الحزمة الأصلية في GitHub للإجابة عن "هل تعمل هذه الحزمة المضغوطة القابلة للتثبيت كمنتج؟". تحل حزمة مرشحة واحدة من `source=npm` أو `source=ref` أو `source=url` أو `source=trusted-url` أو `source=artifact`، وترفعها باسم `package-under-test`، ثم تشغّل مسارات Docker E2E القابلة لإعادة الاستخدام على تلك الحزمة المضغوطة نفسها بدلًا من إعادة حزم المرجع المحدد. تُرتب ملفات التعريف حسب الاتساع: `smoke` و`package` و`product` و`full` (بالإضافة إلى `custom` لقائمة مسارات صريحة). راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins) للاطلاع على عقد الحزمة/التحديث/Plugin، ومصفوفة بقاء الترقية المنشورة، وإعدادات الإصدار الافتراضية، وفرز الأعطال.
- تشغّل فحوص البناء والإصدار `scripts/check-cli-bootstrap-imports.mjs` بعد tsdown. يتتبع الحارس الرسم البياني الثابت المبني بدءًا من `dist/entry.js` و`dist/cli/run-main.js`، ويفشل إذا استورد رسم التمهيد السابق لتوجيه الأوامر أي حزمة خارجية استيرادًا ثابتًا (تُحتسب Commander وواجهة المطالبات وundici والتسجيل والتبعيات الثقيلة المشابهة عند بدء التشغيل جميعها) قبل توجيه الأمر؛ كما يحد حجم مقطع تشغيل Gateway المضمّن عند 70 كيلوبايت، ويرفض الاستيرادات الثابتة لمسارات Gateway الباردة المعروفة (`control-ui-assets` و`diagnostic-stability-bundle` و`onboard-helpers` و`process-respawn` و`restart-sentinel` و`server-close` و`server-reload-handlers`) من ذلك المقطع. يختبر `scripts/release-check.ts` بشكل منفصل حزمة CLI المضغوطة باختبارات دخان باستخدام `--help` و`onboard --help` و`doctor --help` و`status --json --timeout 1` و`config schema` و`models list --provider openai`.
- يقتصر توافق `Package Acceptance` مع الإصدارات القديمة على `2026.4.25` (بما في ذلك `2026.4.25-beta.*`). وحتى ذلك الحد، لا تتسامح الحاضنة إلا مع فجوات بيانات التعريف في الحزم المنشورة: إدخالات مخزون QA الخاصة المحذوفة، وغياب `gateway install --wrapper`، وغياب ملفات الرقع في تجهيز Git المشتق من الحزمة المضغوطة، وغياب `update.channel` المستمر، والمواقع القديمة لسجلات تثبيت Plugin، وغياب استمرارية سجل تثبيت السوق، وترحيل بيانات تعريف الإعداد أثناء `plugins update`. بالنسبة إلى الحزم اللاحقة لـ `2026.4.25`، تُعد هذه المسارات حالات فشل صارمة.
- مشغّلات دخان الحاويات: تشغّل `test:docker:openwebui` و`test:docker:onboard` و`test:docker:npm-onboard-channel-agent` و`test:docker:release-user-journey` و`test:docker:release-typed-onboarding` و`test:docker:release-media-memory` و`test:docker:release-upgrade-user-journey` و`test:docker:release-plugin-marketplace` و`test:docker:skill-install` و`test:docker:update-channel-switch` و`test:docker:upgrade-survivor` و`test:docker:published-upgrade-survivor` و`test:docker:session-runtime-context` و`test:docker:agents-delete-shared-workspace` و`test:docker:gateway-network` و`test:docker:browser-cdp-snapshot` و`test:docker:mcp-channels` و`test:docker:agent-bundle-mcp-tools` و`test:docker:cron-mcp-cleanup` و`test:docker:plugins` و`test:docker:plugin-update` و`test:docker:plugin-lifecycle-matrix` و`test:docker:config-reload` حاوية حقيقية واحدة أو أكثر، وتتحقق من مسارات التكامل عالية المستوى.
- تضع مسارات Docker/Bash E2E التي تثبّت حزمة OpenClaw المضغوطة عبر `scripts/lib/openclaw-e2e-instance.sh` حدًا زمنيًا لأمر `npm install` باستخدام `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (القيمة الافتراضية `600s`؛ اضبطها على `0` لتعطيل الغلاف لأغراض تصحيح الأخطاء).

تصل مشغّلات Docker للنماذج الحية أيضًا بوضع الربط فقط إلى مجلدات المصادقة اللازمة لـ CLI
(أو جميع المجلدات المدعومة عندما لا تكون عملية التشغيل محددة النطاق)، ثم تنسخها إلى مجلد
المنزل داخل الحاوية قبل التشغيل، حتى يتمكن OAuth الخاص بـ CLI الخارجي من تحديث الرموز
دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (البرنامج النصي: `scripts/test-live-models-docker.sh`)
- اختبار دخان ربط ACP: `pnpm test:docker:live-acp-bind` (البرنامج النصي: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيًا، مع تغطية صارمة لـ Droid/OpenCode عبر `pnpm test:docker:live-acp-bind:droid` و`pnpm test:docker:live-acp-bind:opencode`)
- اختبار دخان الواجهة الخلفية لـ CLI: `pnpm test:docker:live-cli-backend` (البرنامج النصي: `scripts/test-live-cli-backend-docker.sh`)
- اختبار دخان حاضنة خادم تطبيق Codex: `pnpm test:docker:live-codex-harness` (البرنامج النصي: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` (البرنامج النصي: `scripts/test-live-gateway-models-docker.sh`)
- اختبارات دخان قابلية الرصد: `pnpm qa:otel:smoke` و`pnpm qa:prometheus:smoke` و`pnpm qa:observability:smoke` هي مسارات خاصة لـ QA في نسخة مصدرية. وهي ليست جزءًا من مسارات إصدار حزم Docker عمدًا، لأن حزمة npm المضغوطة تستبعد مختبر QA.
- اختبار الدخان الحي لـ Open WebUI: `pnpm test:docker:openwebui` (البرنامج النصي: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، إنشاء هيكلي كامل): `pnpm test:docker:onboard` (البرنامج النصي: `scripts/e2e/onboard-docker.sh`)
- اختبار دخان الإعداد الأولي/القناة/الوكيل لحزمة npm المضغوطة: يثبّت `pnpm test:docker:npm-onboard-channel-agent` حزمة OpenClaw المضغوطة عالميًا داخل Docker، ويضبط OpenAI عبر إعداد أولي بمرجع بيئي، بالإضافة إلى Telegram افتراضيًا، ويشغّل doctor، ثم يشغّل دورة واحدة لوكيل OpenAI وهمي. أعد استخدام حزمة مضغوطة مبنية مسبقًا باستخدام `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة البناء على المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` أو `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- اختبار دخاني لرحلة مستخدم الإصدار: يثبّت `pnpm test:docker:release-user-journey` حزمة tarball المجمّعة لـ OpenClaw عموميًا في مجلد Docker رئيسي نظيف، ويشغّل الإعداد الأولي، ويضبط موفّر OpenAI محاكى، وينفّذ دورة وكيل، ويثبّت المكوّنات الإضافية الخارجية ويلغي تثبيتها، ويضبط ClickClack مقابل تركيبة اختبار محلية، ويتحقق من المراسلة الصادرة والواردة، ويعيد تشغيل Gateway، ويشغّل doctor.
- اختبار دخاني للإعداد الأولي ذي الأنواع في الإصدار: يثبّت `pnpm test:docker:release-typed-onboarding` حزمة tarball المجمّعة، ويدير `openclaw onboard` عبر TTY حقيقي، ويضبط OpenAI كموفّر مرجعي لمتغير بيئة، ويتحقق من عدم تخزين المفتاح الخام بصورة دائمة، وينفّذ دورة وكيل محاكاة.
- اختبار دخاني للوسائط/الذاكرة في الإصدار: يثبّت `pnpm test:docker:release-media-memory` حزمة tarball المجمّعة، ويتحقق من فهم الصور من مرفق PNG، ومخرجات توليد الصور المتوافقة مع OpenAI، واسترجاع البحث في الذاكرة، واستمرار الاسترجاع بعد إعادة تشغيل Gateway.
- اختبار دخاني لرحلة مستخدم ترقية الإصدار: يثبّت `pnpm test:docker:release-upgrade-user-journey` افتراضيًا أحدث خط أساس منشور أقدم من حزمة tarball المرشحة، ويضبط حالة الموفّر/المكوّن الإضافي/ClickClack على الحزمة المنشورة، ويرقّي إلى حزمة tarball المرشحة، ثم يعيد تشغيل رحلة الوكيل/المكوّن الإضافي/القناة الأساسية. إذا لم يوجد خط أساس منشور أقدم، فإنه يعيد استخدام إصدار المرشح. تجاوز خط الأساس باستخدام `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- اختبار دخاني لسوق المكوّنات الإضافية في الإصدار: يثبّت `pnpm test:docker:release-plugin-marketplace` من سوق تركيبات اختبار محلي، ويحدّث المكوّن الإضافي المثبّت، ويلغي تثبيته، ويتحقق من اختفاء CLI الخاص بالمكوّن الإضافي مع إزالة بيانات التثبيت الوصفية.
- اختبار دخاني لتثبيت المهارة: يثبّت `pnpm test:docker:skill-install` حزمة tarball المجمّعة لـ OpenClaw عموميًا في Docker، ويعطّل عمليات تثبيت الأرشيفات المرفوعة في الإعدادات، ويستخرج المعرّف النصي الحالي للمهارة الحية في ClawHub من البحث، ويثبّتها باستخدام `openclaw skills install`، ويتحقق من المهارة المثبّتة وبيانات المنشأ/القفل الوصفية في `.clawhub`.
- اختبار دخاني لتبديل قناة التحديث: يثبّت `pnpm test:docker:update-channel-switch` حزمة tarball المجمّعة لـ OpenClaw عموميًا في Docker، وينتقل من حزمة `stable` إلى git `dev`، ويتحقق من عمل القناة المحفوظة والمكوّن الإضافي بعد التحديث، ثم يعود إلى حزمة `stable` ويفحص حالة التحديث.
- اختبار دخاني لاجتياز الترقية: يثبّت `pnpm test:docker:upgrade-survivor` حزمة tarball المجمّعة لـ OpenClaw فوق تركيبة اختبار متّسخة لمستخدم قديم تحتوي على وكلاء، وإعدادات قناة، وقوائم سماح للمكوّنات الإضافية، وحالة قديمة لاعتماديات المكوّنات الإضافية، وملفات مساحة عمل/جلسة موجودة. ويشغّل تحديث الحزمة مع doctor غير تفاعلي دون مفاتيح حية للموفّر أو القناة، ثم يبدأ Gateway على local loopback ويفحص الحفاظ على الإعدادات/الحالة وميزانيات بدء التشغيل/الحالة.
- اختبار دخاني منشور لاجتياز الترقية: يثبّت `pnpm test:docker:published-upgrade-survivor` افتراضيًا `openclaw@latest`، ويملأ ملفات واقعية لمستخدم موجود، ويضبط خط الأساس هذا باستخدام وصفة أوامر مضمنة، ويتحقق من الإعدادات الناتجة، ويحدّث التثبيت المنشور إلى حزمة tarball المرشحة، ويشغّل doctor غير تفاعلي، ويكتب `.artifacts/upgrade-survivor/summary.json`، ثم يبدأ Gateway على local loopback ويفحص المقاصد المضبوطة، والحفاظ على الحالة، وبدء التشغيل، و`/healthz`، و`/readyz`، وميزانيات حالة RPC. تجاوز خط أساس واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، أو اطلب من المجدول التجميعي توسيع خطوط الأساس المحلية الدقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`، ووسّع تركيبات الاختبار المصاغة على هيئة مشكلات باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues`؛ وتتضمن مجموعة المشكلات المبلّغ عنها `configured-plugin-installs` للإصلاح التلقائي لتثبيت مكوّنات OpenClaw الإضافية الخارجية. يتيح اختبار قبول الحزمة هذه القيم باسم `published_upgrade_survivor_baseline` و`published_upgrade_survivor_baselines` و`published_upgrade_survivor_scenarios`، ويحل رموز خطوط الأساس الوصفية مثل `last-stable-4` أو `all-since-2026.4.23`، ويوسّع التحقق الكامل من الإصدار بوابة حزمة اختبار تحمّل الإصدار إلى `last-stable-4 2026.4.23 2026.5.2 2026.4.15` بالإضافة إلى `reported-issues`.
- اختبار دخاني لسياق وقت تشغيل الجلسة: يتحقق `pnpm test:docker:session-runtime-context` من التخزين الدائم لنص سياق وقت التشغيل المخفي، بالإضافة إلى إصلاح doctor لفروع إعادة كتابة المطالبات المكررة المتأثرة.
- اختبار دخاني للتثبيت العمومي باستخدام Bun: يحزم `bash scripts/e2e/bun-global-install-smoke.sh` الشجرة الحالية، ويثبّتها باستخدام `bun install -g` في مجلد رئيسي معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد موفّري الصور المضمّنين بدلًا من التعليق. أعد استخدام حزمة tarball مبنية مسبقًا باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ بناء المضيف باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية باستخدام `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- اختبار دخاني لأداة التثبيت في Docker: يشارك `bash scripts/test-install-sh-docker.sh` ذاكرة تخزين مؤقت واحدة لـ npm بين حاويات المستخدم الجذر والتحديث والتثبيت المباشر عبر npm. يستخدم اختبار التحديث الدخاني افتراضيًا إصدار npm `latest` كخط أساس مستقر قبل الترقية إلى حزمة tarball المرشحة. تجاوزه محليًا باستخدام `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، أو باستخدام مُدخل `update_baseline_version` لسير عمل اختبار التثبيت الدخاني على GitHub. تحتفظ فحوصات أداة التثبيت لغير المستخدم الجذر بذاكرة تخزين مؤقت معزولة لـ npm كي لا تحجب إدخالات الذاكرة المملوكة للمستخدم الجذر سلوك التثبيت المحلي للمستخدم. اضبط `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة التخزين المؤقت الخاصة بالمستخدم الجذر/التحديث/التثبيت المباشر عبر npm بين عمليات إعادة التشغيل المحلية.
- يتخطى CI لاختبار التثبيت الدخاني تحديث التثبيت العمومي المباشر المكرر عبر npm باستخدام `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل البرنامج النصي محليًا دون متغير البيئة هذا عند الحاجة إلى تغطية `npm install -g` المباشرة.
- اختبار دخاني عبر CLI لحذف الوكلاء لمساحة عمل مشتركة: يبني `pnpm test:docker:agents-delete-shared-workspace` (البرنامج النصي: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) صورة Dockerfile الجذرية افتراضيًا، وينشئ وكيلين مع مساحة عمل واحدة في مجلد رئيسي معزول للحاوية، ويشغّل `agents delete --json`، ويتحقق من JSON صالح ومن سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة اختبار التثبيت الدخاني باستخدام `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway ودورة حياة المضيف: يحافظ `pnpm test:docker:gateway-network` (البرنامج النصي: `scripts/e2e/gateway-network-docker.sh`) على الاختبار الدخاني للمصادقة/السلامة عبر WebSocket في شبكة LAN بحاويتين، ثم يستخدم HTTP إداريًا عبر local loopback لإثبات تسييج التحضير، والوصول إلى التحكم المحتفظ به، والاستعادة عبر الاستئناف، وعملية إيقاف/تشغيل محضّرة داخل الحاوية نفسها. يجب أن ينتهي فحص إعادة التشغيل قبل انتهاء عقد الإيجار الأصلي، ويتحقق من أن حالة التعليق محلية للعملية بينما تبقى إعدادات Gateway المحفوظة وهوية الحاوية، ويصدر JSON قابلًا للمعالجة آليًا لتوقيت المراحل.
- اختبار دخاني للقطات CDP في المتصفح: يبني `pnpm test:docker:browser-cdp-snapshot` (البرنامج النصي: `scripts/e2e/browser-cdp-snapshot-docker.sh`) صورة E2E للمصدر بالإضافة إلى طبقة Chromium، ويبدأ Chromium باستخدام CDP خام، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات أدوار CDP تغطي عناوين URL للروابط، والعناصر القابلة للنقر التي روّجها المؤشر، ومراجع iframe، وبيانات الإطارات الوصفية.
- انحدار OpenAI Responses لاستخدام `web_search` بأدنى مستوى من الاستدلال: يشغّل `pnpm test:docker:openai-web-search-minimal` (البرنامج النصي: `scripts/e2e/openai-web-search-minimal-docker.sh`) خادم OpenAI محاكى عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط الموفّر ويفحص ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP ‏(Gateway مملوء مسبقًا + جسر stdio + اختبار دخاني خام لإطار إشعارات Claude): `pnpm test:docker:mcp-channels` (البرنامج النصي: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة OpenClaw ‏(خادم MCP حقيقي عبر stdio + اختبار دخاني مضمن للسماح/الرفض في ملف تعريف OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (البرنامج النصي: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- تنظيف MCP لـ Cron/الوكيل الفرعي (Gateway حقيقي + إنهاء عملية MCP فرعية عبر stdio بعد عمليات Cron معزولة وتشغيل وكيل فرعي لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (البرنامج النصي: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- المكوّنات الإضافية (اختبار دخاني للتثبيت/التحديث لمسار محلي، و`file:`، وسجل npm ذي الاعتماديات المرفوعة، وبيانات وصفية مشوّهة لحزمة npm، ومراجع git المتحركة، وتركيبة ClawHub شاملة، وتحديثات السوق، وتمكين/فحص حزمة Claude): `pnpm test:docker:plugins` (البرنامج النصي: `scripts/e2e/plugins-docker.sh`)
  اضبط `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لتخطي كتلة ClawHub، أو تجاوز زوج الحزمة/وقت التشغيل الشامل الافتراضي باستخدام `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. في غياب `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، يستخدم الاختبار خادم تركيبات اختبار محليًا محكم العزل لـ ClawHub.
- اختبار دخاني لعدم تغيّر تحديث المكوّن الإضافي: `pnpm test:docker:plugin-update` (البرنامج النصي: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- اختبار دخاني لمصفوفة دورة حياة المكوّن الإضافي: يثبّت `pnpm test:docker:plugin-lifecycle-matrix` حزمة tarball المجمّعة لـ OpenClaw في حاوية مجردة، ويثبّت مكوّنًا إضافيًا من npm، ويبدّل بين التمكين والتعطيل، ويرقّيه ويخفض إصداره عبر سجل npm محلي، ويحذف الشفرة المثبّتة، ثم يتحقق من أن إلغاء التثبيت لا يزال يزيل الحالة القديمة مع تسجيل مقاييس RSS/CPU لكل مرحلة من دورة الحياة.
- اختبار دخاني للبيانات الوصفية لإعادة تحميل الإعدادات: `pnpm test:docker:config-reload` (البرنامج النصي: `scripts/e2e/config-reload-source-docker.sh`)
- المكوّنات الإضافية: يغطي `pnpm test:docker:plugins` اختبار التثبيت/التحديث الدخاني لمسار محلي، و`file:`، وسجل npm ذي الاعتماديات المرفوعة، ومراجع git المتحركة، وتركيبات ClawHub، وتحديثات السوق، وتمكين/فحص حزمة Claude. يغطي `pnpm test:docker:plugin-update` سلوك التحديث دون تغييرات للمكوّنات الإضافية المثبّتة. يغطي `pnpm test:docker:plugin-lifecycle-matrix` تثبيت مكوّن npm الإضافي وتمكينه وتعطيله وترقيته وخفض إصداره وإلغاء تثبيته عند فقدان الشفرة، مع تتبع الموارد.

لبناء الصورة الوظيفية المشتركة مسبقًا وإعادة استخدامها يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بكل حزمة اختبارات، مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`، ذات أولوية عند ضبطها. عندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها البرامج النصية إذا لم تكن موجودة محليًا بالفعل. تحتفظ اختبارات QR وأداة التثبيت في Docker بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلًا من وقت تشغيل التطبيق المبني المشترك.

كما يربط مشغّلو Docker للنماذج الحية نسخة العمل الحالية بوضع القراءة فقط
ويجهّزونها في دليل عمل مؤقت داخل الحاوية. يُبقي هذا
صورة وقت التشغيل صغيرة مع الاستمرار في تشغيل Vitest مقابل
المصدر/الإعدادات المحلية المطابقة تمامًا. تتخطى خطوة التجهيز ذاكرات التخزين المؤقت المحلية الكبيرة فقط ومخرجات بناء التطبيق
مثل `.pnpm-store` و`.worktrees` و`__openclaw_vitest__` و
أدلة `.build` المحلية للتطبيق أو أدلة مخرجات Gradle، بحيث لا تقضي عمليات Docker الحية
دقائق في نسخ العناصر الخاصة بالجهاز. كما تضبط
`OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات Gateway الحية عمال قنوات
Telegram/Discord/وغيرها الحقيقيين داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر أيضًا
`OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق نطاق تغطية Gateway
الحية أو استبعادها من مسار Docker ذاك.

`test:docker:openwebui` هو اختبار توافق تمهيدي عالي المستوى: فهو يشغّل حاوية Gateway لـ OpenClaw مع تمكين نقاط نهاية HTTP المتوافقة مع OpenAI،
ويشغّل حاوية Open WebUI ذات إصدار مثبّت مقابل ذلك الـ Gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل
طلب محادثة حقيقيًا عبر وكيل `/api/chat/completions` الخاص بـ Open WebUI. اضبط
`OPENWEBUI_SMOKE_MODE=models` لعمليات تحقق CI الخاصة بمسار الإصدار التي ينبغي أن تتوقف
بعد تسجيل الدخول إلى Open WebUI واكتشاف النموذج، دون انتظار اكتمال استجابة
من نموذج فعلي. قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى
سحب صورة Open WebUI، وقد يحتاج Open WebUI إلى إكمال إعداد
البدء البارد الخاص به. يتوقع هذا المسار مفتاح نموذج فعلي صالحًا للاستخدام، يُوفَّر عبر
بيئة العملية، أو ملفات تعريف مصادقة مجهّزة مسبقًا، أو
`OPENCLAW_PROFILE_FILE` صريح. تطبع عمليات التشغيل الناجحة حمولة JSON صغيرة مثل
`{ "ok": true, "model": "openclaw/default", ... }`.

صُمِّم `test:docker:mcp-channels` ليكون حتميًا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. فهو يشغّل حاوية Gateway
مزودة ببيانات أولية، ثم يشغّل حاوية ثانية تُنشئ العملية `openclaw mcp serve`، وبعد ذلك
يتحقق من اكتشاف المحادثات الموجّهة، وقراءة النصوص المنسوخة للمحادثات، وبيانات
المرفقات الوصفية، وسلوك قائمة انتظار الأحداث المباشرة، وتوجيه الإرسال الصادر، وإشعارات
القنوات والأذونات بأسلوب Claude عبر جسر MCP الفعلي المستند إلى stdio. يفحص
اختبار الإشعارات إطارات MCP الخام عبر stdio مباشرةً، بحيث يتحقق الاختبار التمهيدي
مما يصدره الجسر فعليًا، وليس فقط مما تعرضه مصادفةً حزمة SDK
لعميل محدد.

`test:docker:agent-bundle-mcp-tools` حتمي ولا يحتاج إلى
مفتاح نموذج فعلي. فهو يبني صورة Docker للمستودع، ويشغّل خادم فحص MCP فعليًا عبر stdio
داخل الحاوية، ويُنشئ ذلك الخادم من خلال بيئة تشغيل MCP المضمّنة في حزمة
OpenClaw، وينفّذ الأداة، ثم يتحقق من أن
`coding` و`messaging` يحتفظان بأدوات `bundle-mcp`، بينما يقوم `minimal` و
`tools.deny: ["bundle-mcp"]` بتصفيتها.

`test:docker:cron-mcp-cleanup` حتمي ولا يحتاج إلى مفتاح
نموذج فعلي. فهو يشغّل Gateway مزودًا ببيانات أولية مع خادم فحص MCP فعلي عبر stdio،
وينفّذ دورة Cron معزولة ودورة فرعية أحادية التنفيذ عبر `sessions_spawn`، ثم
يتحقق من خروج العملية الفرعية لـ MCP بعد كل تشغيل.

اختبار تمهيدي يدوي لسلسلة ACP باللغة الطبيعية (ليس ضمن CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا البرنامج النصي لسير عمل الانحدار/تصحيح الأخطاء. قد تكون هناك حاجة إليه مجددًا للتحقق من توجيه سلاسل ACP، لذا لا تحذفه.

متغيرات بيئة مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) يُركَّب في `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) يُركَّب في `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` يُركَّب ويُحمَّل قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق فقط من متغيرات البيئة المحمّلة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة مؤقتة للإعدادات/مساحة العمل ومن دون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`، ما لم يكن التشغيل يستخدم بالفعل دليل ربط مُدارًا/خاصًا بـ CI) يُركَّب في `/home/node/.npm-global` لعمليات تثبيت CLI المخزنة مؤقتًا داخل Docker
- تُركَّب أدلة/ملفات مصادقة CLI الخارجية ضمن `$HOME` بوضع القراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية (تُستخدم عندما لا يكون التشغيل محصورًا في مزودين محددين): `.factory`، `.gemini`، `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - لا تركّب عمليات التشغيل المحصورة بمزودين إلا الأدلة/الملفات المطلوبة والمستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز ذلك يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all`، أو `OPENCLAW_DOCKER_AUTH_DIRS=none`، أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لحصر التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزودين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة في عمليات إعادة التشغيل التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان الحصول على بيانات الاعتماد من مخزن ملفات التعريف (وليس من البيئة)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لاختبار Open WebUI التمهيدي
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز موجّه التحقق من القيمة الفريدة المستخدم في اختبار Open WebUI التمهيدي
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبّت

## التحقق من سلامة الوثائق

شغّل فحوصات الوثائق بعد تعديلها: `pnpm check:docs`.
شغّل التحقق الكامل من روابط Mintlify الداخلية عندما تحتاج أيضًا إلى فحص العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## اختبار الانحدار دون اتصال (آمن لـ CI)

هذه اختبارات انحدار «لمسار فعلي» من دون مزودين حقيقيين:

- استدعاء أدوات Gateway ‏(OpenAI محاكى، وGateway فعلي + حلقة الوكيل): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج إعداد Gateway ‏(‏WS‏ `wizard.start`/`wizard.next`، يكتب الإعدادات + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بضعة اختبارات آمنة لـ CI تتصرف مثل «تقييمات موثوقية الوكيل»:

- استدعاء أدوات محاكى عبر Gateway الفعلي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات معالج إعداد شاملة تتحقق من ربط الجلسة وتأثيرات الإعدادات (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودًا لـ Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في الموجّه، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الدورات تتحقق من ترتيب الأدوات، واستمرار سجل الجلسة، وحدود بيئة العزل.

ينبغي أن تظل التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزودين محاكيين للتحقق من استدعاءات الأدوات وترتيبها، وقراءة ملفات Skills، وربط الجلسة.
- مجموعة صغيرة من السيناريوهات التي تركز على Skills (الاستخدام مقابل التجنب، والبوابات، وحقن الموجّهات).
- تقييمات فعلية اختيارية (اشتراك اختياري، ومقيّدة بمتغيرات البيئة) فقط بعد تجهيز المجموعة الآمنة لـ CI.

## اختبارات العقود (بنية Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلين يتوافقان مع
عقد الواجهة الخاص بهما. وهي تمر على جميع Plugins المكتشفة وتشغّل
مجموعة من تأكيدات البنية والسلوك. يتخطى مسار الوحدات الافتراضي `pnpm test`
عمدًا ملفات نقاط الالتقاء المشتركة والاختبارات التمهيدية هذه؛ شغّل أوامر العقود
صراحةً عند تعديل أسطح القنوات أو المزودين المشتركة.

### الأوامر

- جميع العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزودين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

توجد في `src/channels/plugins/contracts/*.contract.test.ts`. الفئات
العليا الحالية:

- **دليل القنوات** - البيانات الوصفية لإدخالات دليل القنوات المضمّنة/المستندة إلى السجل
- **Plugin** (مستند إلى السجل، ومقسّم إلى أجزاء) - البنية الأساسية لتسجيل Plugin
- **الأسطح فقط** (مستند إلى السجل، ومقسّم إلى أجزاء) - فحوصات البنية لكل سطح من `actions` و`setup` و`status` و`outbound` و`messaging` و`threading` و`directory` و`gateway`
- **ربط الجلسة** (مستند إلى السجل) - سلوك ربط الجلسة
- **حمولة الإرسال الصادر** - بنية حمولة الرسالة وتسويتها
- **سياسة المجموعة** (احتياطية) - فرض سياسة المجموعة الافتراضية لكل قناة
- **سلاسل المحادثات** (مستند إلى السجل، ومقسّم إلى أجزاء) - معالجة معرّفات سلاسل المحادثات
- **الدليل** (مستند إلى السجل، ومقسّم إلى أجزاء) - واجهة API للدليل/قائمة الأعضاء
- **السجل** و**النواة الخاصة بـ Plugins.\*** - سجل Plugins للقنوات، والمحمّل، والتفاصيل الداخلية لتفويض كتابة الإعدادات

تُعرض داخليًا أدوات مساعدة لحافظة التقاط الإرسال الوارد وحمولة الإرسال الصادر التي تستخدمها هذه
المجموعات عبر `src/plugin-sdk/channel-contract-testing.ts`
(مستبعد من npm، وليس مسارًا فرعيًا عامًا لـ SDK)؛ ولا يوجد ملف مستقل باسم
`inbound.contract.test.ts` في هذا الدليل.

### عقود المزودين

توجد في `src/plugins/contracts/*.contract.test.ts`. تشمل الفئات الحالية:

- **البنية** - بيان Plugin، وواجهة API، وبنية صادرات بيئة التشغيل
- **تسجيل Plugin** (+ متوازٍ) - حالات تسجيل البيان
- **بيان الحزمة** - متطلبات بيان الحزمة
- **المحمّل** - سلوك إعداد/تفكيك محمّل Plugin
- **السجل** - محتويات سجل عقود Plugins والبحث فيه
- **المزودون** - سلوك المزود المشترك عبر المزودين المضمّنين، بالإضافة إلى مزودي البحث على الويب
- **اختيار المصادقة** - البيانات الوصفية لاختيار المصادقة وسلوك الإعداد
- **إهمال دليل المزودين** - البيانات الوصفية لدليل المزودين المهملين
- **حل اختيار معالج الإعداد**، **منتقي نموذج معالج الإعداد**، **خيارات إعداد معالج الإعداد** - عقود معالج إعداد المزود
- **مزود التضمين**، **مزود تضمين الذاكرة**، **مزود جلب الويب**، **تحويل النص إلى كلام** - عقود المزود الخاصة بالقدرات
- **إجراءات الجلسة**، **مرفقات الجلسة**، **إسقاط إدخال الجلسة** - عقود حالة الجلسة المملوكة لـ Plugin
- **الدورات المجدولة** - البيانات الوصفية لدورات Plugin المجدولة وحدود الطابع الزمني
- **خطافات المضيف**، **دورة حياة سياق التشغيل**، **الآثار الجانبية لاستيراد بيئة التشغيل**، **نقاط التقاء بيئة التشغيل** - عقود دورة حياة مضيف/بيئة تشغيل Plugin وحدود الاستيراد
- **تبعيات بيئة تشغيل الامتدادات** - موضع تبعيات بيئة التشغيل للامتدادات

### متى تُشغَّل

- بعد تغيير صادرات أو مسارات Plugin SDK الفرعية
- بعد إضافة أو تعديل Plugin لقناة أو مزود
- بعد إعادة هيكلة تسجيل Plugins أو اكتشافها

تعمل اختبارات العقود ضمن CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات انحدار (إرشادات)

عند إصلاح مشكلة في مزود/نموذج اكتُشفت في بيئة فعلية:

- أضف اختبار انحدار آمنًا لـ CI إن أمكن (مزود محاكى/بديل، أو التقط التحويل الدقيق لبنية الطلب)
- إذا كانت المشكلة بطبيعتها حصرية للبيئة الفعلية (حدود المعدل، وسياسات المصادقة)، فاجعل الاختبار الفعلي محدودًا واختياريًا عبر متغيرات البيئة
- فضّل استهداف أصغر طبقة تكشف الخطأ:
  - خطأ في تحويل/إعادة تشغيل طلب المزود -> اختبار مباشر للنماذج
  - خطأ في مسار جلسة/سجل/أداة Gateway -> اختبار تمهيدي فعلي لـ Gateway أو اختبار Gateway محاكى وآمن لـ CI
- حاجز حماية اجتياز SecretRef:
  - يستخرج `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا نموذجيًا واحدًا لكل فئة SecretRef من البيانات الوصفية للسجل (`listSecretTargetRegistryEntries()`)، ثم يتحقق من رفض معرّفات exec التي تحتوي على مقاطع اجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة تستخدم `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند وجود معرّفات أهداف غير مصنفة، حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذو صلة

- [اختبار البيئة الفعلية](/ar/help/testing-live)
- [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)
- [CI](/ar/ci)
