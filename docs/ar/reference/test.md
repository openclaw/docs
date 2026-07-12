---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم وضعي القوة/التغطية
title: الاختبارات
x-i18n:
    generated_at: "2026-07-12T06:37:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- حزمة الاختبار الكاملة (مجموعات الاختبارات، الاختبارات الحية، Docker): [الاختبار](/ar/help/testing)
- التحقق من التحديثات وحزم Plugin: [اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins)

## الإعداد الافتراضي للوكيل

تشغّل جلسات الوكيل الاختبارات وعمليات التحقق كثيفة الحوسبة عن بُعد
عبر Crabbox. تستخدم شيفرة المشرفين الموثوقين Blacksmith Testbox افتراضيًا. يقوم
سير عمل Testbox المُعدّ بتحميل بيانات الاعتماد، لذلك يجب أن تستخدم شيفرة المساهمين
غير الموثوقين أو التفرعات CI للتفرعات بلا أسرار، أو AWS Crabbox المباشر والمُنقّى بدلًا منه.

عندما يُرجّح أن تتطلب مهمة شيفرة موثوقة اختبارات أو إثباتًا مكثفًا، ابدأ الإحماء
المسبق فورًا في جلسة أوامر تعمل في الخلفية، وواصل العمل أثناء تجهيزها،
وأعِد استخدام المعرّف `tbx_...` المُعاد، وزامن نسخة العمل الحالية في كل تشغيل،
وأوقفها قبل التسليم:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

بعد أول إعادة استخدام ناجحة، يسجّل الغلاف بصمة أساس الحجز
والاعتماديات وسير عمل Testbox ضمن `.crabbox/testbox-leases/`.
تستمر التعديلات التي تقتصر على المصدر في إعادة استخدام الصندوق المُسخّن. يؤدي تغيّر أساس الدمج أو ملف القفل
أو مدخل مدير الحزم أو الغلاف أو سير عمل Testbox إلى الإخفاق الآمن، ويتطلب
حجزًا جديدًا. وتستمر كل عملية تشغيل في مزامنة نسخة العمل الحالية.
يُخصّص `OPENCLAW_TESTBOX_ALLOW_STALE=1` للتشخيص المتعمّد فقط، وليس
لإثبات الإصدار.

أوامر الاختبار المحلية أدناه مخصّصة لسير عمل البشر أو لحالة احتياطية صريحة للوكيل
يطلبها المستخدم. يجب الإبلاغ عن عدم توفر المزوّد البعيد؛ فهذا
لا يمنح إذنًا لتشغيل بوابة تحقق محلية واسعة بصمت.

بالنسبة إلى الشيفرة غير الموثوقة، نفّذ الإحماء المسبق باستخدام `--provider aws`. يجب أن تضبط كل عملية تشغيل
`CRABBOX_ENV_ALLOW=CI`، وتمرّر `--provider aws --no-hydrate`، وتستخدم
مجلد `HOME` بعيدًا مؤقتًا وجديدًا قبل تثبيت الاعتماديات أو تشغيل
الاختبارات. استخدم حجزًا جديدًا مُسخّنًا ومخصّصًا لذلك المصدر غير الموثوق؛ ولا تُعِد أبدًا استخدام
حجز موثوق أو جرى تحميل بيانات الاعتماد فيه سابقًا. شغّل ملف Crabbox التنفيذي الموثوق والمثبّت
من نسخة `main` موثوقة ونظيفة، واجلب طلب السحب البعيد فقط باستخدام
`--fresh-pr`؛ ولا تنفّذ أبدًا غلاف نسخة العمل غير الموثوقة أو إعداداتها محليًا.
ألغِ ضبط `CRABBOX_AWS_INSTANCE_PROFILE`، وأخفق بأمان ما لم تكن قيمة
`aws.instanceProfile` المحلولة فارغة. قبل أي تثبيت أو اختبار، استخدم
أدوات موثوقة ذات مسارات مطلقة لفرض رمز IMDSv2، وإثبات أن نقطة نهاية بيانات اعتماد IAM
تعيد 404، والتحقق من أن `git rev-parse HEAD` البعيد يساوي قيمة SHA الكاملة
لرأس طلب السحب الذي تمت مراجعته. اربط الحجز بقيمة SHA هذه وأوقفه وأعد إحماءه عند تغيّر الرأس.
ارفع `scripts/crabbox-untrusted-bootstrap.sh` الموثوق من نسخة
`main` نظيفة إلى جانب `--fresh-pr`؛ فهو يثبّت إصدارات Node وpnpm المثبّتة،
ويتحقق من SHA وتثبيت إصدار مدير الحزم، ويعزل `HOME`، ويثبّت الاعتماديات،
ثم ينفّذ الاختبار المطلوب. إذا تعذّر على الوسيط إثبات عدم وجود دور أو عدم وجود طلب سحب بعيد،
فاستخدم CI للتفرعات بلا أسرار. لا تستخدم `hydrate-github` أو `--no-sync` أو
سير عمل Testbox محمّلًا ببيانات الاعتماد.
ألغِ ضبط جميع تجاوزات `CRABBOX_TAILSCALE*`، وافرض `--network public
--tailscale=false`، وامسح أعلام عقدة الخروج/الشبكة المحلية، واشترط أن يفيد `crabbox inspect`
بوجود شبكة عامة من دون حالة Tailscale قبل رفع أي برنامج نصي.

## الترتيب المحلي المعتاد

1. `pnpm test:changed` لإثبات Vitest ضمن نطاق التغييرات.
2. `pnpm test <path-or-filter>` لملف واحد أو دليل أو هدف صريح.
3. `pnpm test` فقط عندما تحتاج عمدًا إلى مجموعة Vitest المحلية الكاملة.

في شجرة عمل Codex أو نسخة عمل مرتبطة/متناثرة، يتجنب الوكلاء التشغيل المحلي المباشر
لأوامر `pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- حالة احتياطية محلية لملف صغير يطلبها المستخدم صراحةً:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- بوابات التغييرات أو الإثبات الواسع: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` لكي يعمل pnpm داخل Testbox.
- تمثل قيمة `exitCode` النهائية للغلاف وبيانات التوقيت بصيغة JSON نتيجة الأمر. قد تظهر عملية Blacksmith GitHub Actions المفوّضة بالحالة `cancelled` بعد نجاح أمر SSH لأن Testbox يُوقَف من خارج إجراء إبقاء الاتصال؛ تحقّق من ملخص الغلاف ومخرجات الأمر قبل اعتبار ذلك إخفاقًا.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: يُبقي تسلسل عمليات التحقق الثقيلة داخل شجرة العمل الحالية بدلًا من دليل Git المشترك لأوامر مثل `pnpm check:changed` و`pnpm test ...` المستهدف. استخدمه فقط على المضيفات المحلية عالية السعة عندما تشغّل عمدًا عمليات تحقق مستقلة عبر أشجار عمل مرتبطة.

## الأوامر الأساسية

تنتهي عمليات تشغيل غلاف الاختبار بملخص قصير `[test] passed|failed|skipped ... in ...`؛ ويظل سطر المدة الخاص بـ Vitest هو تفاصيل كل شظية.

| الأمر                                             | وظيفته                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | تُوجَّه أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة النطاق. أما عمليات التشغيل بلا أهداف فهي إثبات للمجموعة الكاملة: تتوسع مجموعات الشظايا الثابتة إلى إعدادات فرعية للتنفيذ المحلي المتوازي، مع طباعة التوزيع المتوقع للشظايا قبل البدء. وتتوسع مجموعة الامتدادات دائمًا إلى إعدادات شظايا لكل امتداد بدلًا من عملية ضخمة واحدة للمشروع الجذري. |
| `pnpm test:changed`                               | تشغيل ذكي ورخيص لاختبارات التغييرات: أهداف دقيقة من التعديلات المباشرة على الاختبارات، وملفات `*.test.ts` الشقيقة، وتعيينات المصدر الصريحة، ومخطط الاستيراد المحلي. تُتخطى تغييرات النطاق الواسع/الإعدادات/الحزم ما لم تُعيَّن إلى اختبارات دقيقة.                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | تشغيل واسع وصريح لاختبارات التغييرات؛ استخدمه عندما ينبغي أن يعود تعديل في بيئة الاختبار/الإعدادات/الحزمة إلى سلوك Vitest الأوسع لاختبارات التغييرات.                                                                                                                                                                                                 |
| `pnpm test:force`                                 | يحرّر منفذ Gateway المُعدّ في OpenClaw (الافتراضي `18789`)، ثم يشغّل المجموعة الكاملة باستخدام منفذ Gateway معزول كي لا تتعارض اختبارات الخادم مع نسخة قيد التشغيل.                                                                                                                                                                             |
| `pnpm test:coverage`                              | يُصدر تقريرًا معلوماتيًا عن تغطية V8 لمسار الوحدات الافتراضي (`vitest.unit.config.ts`)؛ ولا تُفرض أي حدود دنيا للتغطية.                                                                                                                                                                                                                                 |
| `pnpm test:coverage:changed`                      | تغطية الوحدات فقط للملفات التي تغيّرت منذ `origin/main`.                                                                                                                                                                                                                                                                                              |
| `pnpm changed:lanes`                              | يعرض المسارات المعمارية التي يشغّلها الفرق مقارنةً بـ `origin/main`.                                                                                                                                                                                                                                                                                  |
| `pnpm check:changed`                              | يفوّض إلى Crabbox/Testbox افتراضيًا خارج CI، ثم يشغّل بوابة التحقق الذكية للتغييرات داخل العملية الفرعية البعيدة: التنسيق، إضافةً إلى فحص الأنواع والفحص الساكن وأوامر الحماية للمسارات المتأثرة. لا يشغّل Vitest؛ استخدم `pnpm test:changed` أو `pnpm test <target>` لإثبات الاختبار.                                                                      |

## حالة الاختبار المشتركة ومساعدات العمليات

- `src/test-utils/openclaw-test-state.ts`: استخدمه من Vitest عندما يحتاج الاختبار إلى `HOME` أو `OPENCLAW_STATE_DIR` أو `OPENCLAW_CONFIG_PATH` أو نموذج إعدادات أو مساحة عمل أو دليل وكيل أو مخزن ملفات تعريف المصادقة، على نحو معزول.
- `pnpm test:env-mutations:report`: تقرير غير حاجب للاختبارات/بيئات الاختبار التي تعدّل `HOME` أو `OPENCLAW_STATE_DIR` أو `OPENCLAW_CONFIG_PATH` أو `OPENCLAW_WORKSPACE_DIR` أو مفاتيح البيئة المرتبطة بها مباشرةً. استخدمه للعثور على المرشحين للترحيل إلى مساعد حالة الاختبار المشتركة.
- `test/helpers/openclaw-test-instance.ts`: لاختبارات E2E على مستوى العملية التي تحتاج إلى Gateway قيد التشغيل وبيئة CLI والتقاط السجلات والتنظيف في مكان واحد.
- يمكن لمسارات Docker/Bash الخاصة باختبارات E2E التي تستورد `scripts/lib/docker-e2e-image.sh` تمرير `docker_e2e_test_state_shell_b64 <label> <scenario>` إلى الحاوية وفك ترميزه باستخدام `scripts/lib/openclaw-e2e-instance.sh`؛ ويمكن للبرامج النصية متعددة الأدلة الرئيسية تمرير `docker_e2e_test_state_function_b64` واستدعاء `openclaw_test_state_create <label> <scenario>` في كل تدفق. يكتب `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` ملف بيئة للمضيف يمكن استيراده (تحافظ `--` قبل `create` على عدم تعامل إصدارات Node الأحدث مع `--env-file` على أنه علم Node). يمكن للمسارات التي تشغّل Gateway استيراد `scripts/lib/openclaw-e2e-instance.sh` لحل نقطة الدخول، وبدء OpenAI الوهمي، والتشغيل في المقدمة/الخلفية، وفحوص الجاهزية، وتصدير بيئة الحالة، وتفريغ السجلات، وتنظيف العمليات.

## مسارات واجهة التحكم وTUI والامتدادات

- **اختبارات E2E لواجهة التحكم باستخدام محاكاة:** يشغّل `pnpm test:ui:e2e` مسار Vitest + Playwright الذي يبدأ واجهة تحكم Vite ويتحكم في صفحة Chromium حقيقية مقابل WebSocket محاكى لـ Gateway. توجد الاختبارات في `ui/src/**/*.e2e.test.ts`، وتوجد عناصر المحاكاة/التحكم المشتركة في `ui/src/test-helpers/control-ui-e2e.ts`. يتضمن `pnpm test:e2e` هذا المسار. تستخدم عمليات تشغيل الوكيل Testbox/Crabbox افتراضيًا، بما في ذلك الإثبات المستهدف؛ استخدم `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` فقط كخيار احتياطي محلي صريح.
- **اختبارات TUI PTY:** يشغّل `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` مسار PTY السريع ذي الواجهة الخلفية الوهمية. يشغّل `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` أو `pnpm tui:pty:test:watch --mode local` اختبار الدخان الأبطأ لـ `tui --local`، والذي يحاكي نقطة نهاية النموذج الخارجية فقط. تحقّق من نص مرئي ثابت أو استدعاءات التجهيزات، وليس من لقطات ANSI الأولية.
- يشغّل `pnpm test:extensions` و`pnpm test extensions` جميع أجزاء الامتدادات/الإضافات. تعمل Plugins القنوات الثقيلة وPlugin المتصفح وOpenAI كأجزاء مخصصة؛ وتبقى مجموعات Plugins الأخرى مجمّعة. يشغّل `pnpm test extensions/<id>` مسار Plugin مضمّنة واحدة.
- تُربط ملفات المصدر التي لها اختبارات شقيقة بذلك الاختبار الشقيق قبل الرجوع إلى أنماط glob أوسع للدليل. تستخدم تعديلات الأدوات المساعدة ضمن `src/channels/plugins/contracts/test-helpers` و`src/plugin-sdk/test-helpers` و`src/plugins/contracts` رسمًا بيانيًا محليًا للاستيراد لتشغيل الاختبارات التي تستوردها بدلًا من تشغيل كل جزء على نطاق واسع عندما يكون مسار التبعية دقيقًا.
- تتفرع أهداف أدلة العقود إلى مسارات العقود الخاصة بها: يشغّل `pnpm test src/channels/plugins/contracts` إعدادات عقود القنوات الأربعة، ويشغّل `pnpm test src/plugins/contracts` إعداد عقود Plugins، لأن مشروعي `channels`/`plugins` العامين يستبعدان `contracts/**`.
- ينقسم `auto-reply` إلى ثلاثة إعدادات مخصصة (`core` و`top-level` و`reply`) كي لا تهيمن أداة اختبار الردود على اختبارات الحالة/الرموز المميزة/الأدوات المساعدة الأخف في المستوى الأعلى.
- تُوجَّه ملفات اختبار محددة في `plugin-sdk` و`commands` عبر مسارات خفيفة مخصصة لا تُبقي سوى `test/setup.ts`، مع إبقاء الحالات كثيفة التشغيل في مساراتها الحالية.
- يستخدم إعداد Vitest الأساسي افتراضيًا `pool: "threads"` و`isolate: false`، مع تمكين مشغّل الاختبارات المشترك غير المعزول عبر إعدادات المستودع.
- يشغّل `pnpm test:channels` الملف `vitest.channels.config.ts`.

## Gateway واختبارات E2E

- تكامل Gateway اختياري: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: تجميع اختبارات E2E للمستودع = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: اختبارات دخان شاملة لـ Gateway (إقران WS/HTTP/Node متعدد النُسخ). تستخدم افتراضيًا `threads` مع `isolate: false` وعمّالًا متكيفين في `vitest.e2e.config.ts`؛ اضبطها باستخدام `OPENCLAW_E2E_WORKERS=<n>`، وفعّل السجلات التفصيلية باستخدام `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: اختبارات مباشرة لموفري الخدمة (Claude/Minimax/DeepSeek/z.ai/إلخ، مقيّدة بالنمط `*.live.test.ts`). تتطلب مفاتيح API و`LIVE=1` (أو `OPENCLAW_LIVE_TEST=1`) لإلغاء التخطي؛ ويمكن تفعيل المخرجات التفصيلية باستخدام `OPENCLAW_LIVE_TEST_QUIET=0`.

## حزمة Docker الكاملة (`pnpm test:docker:all`)

تبني صورة الاختبارات المباشرة المشتركة، وتحزم OpenClaw مرة واحدة في أرشيف npm، وتبني/تعيد استخدام صورة تشغيل أساسية تتضمن Node/Git وصورة وظيفية تثبّت ذلك الأرشيف في `/app`، ثم تشغّل مسارات اختبارات الدخان في Docker من خلال مجدول موزون. يمثّل `scripts/package-openclaw-for-docker.mjs` أداة التحزيم الوحيدة المحلية/الخاصة بالتكامل المستمر، ويتحقق من الأرشيف ومن `dist/postinstall-inventory.json` قبل أن يستخدمه Docker.

- الصورة الأساسية (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): مسارات المثبّت/التحديث/تبعيات Plugins؛ تُركّب الأرشيف المبني مسبقًا بدلًا من نسخ مصادر المستودع.
- الصورة الوظيفية (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): مسارات وظائف التطبيق المبني العادية.
- تعريفات المسارات: `scripts/lib/docker-e2e-scenarios.mjs`. المخطط: `scripts/lib/docker-e2e-plan.mjs`. المنفّذ: `scripts/test-docker-all.mjs`.
- يُخرج `node scripts/test-docker-all.mjs --plan-json` خطة التكامل المستمر التي يملكها المجدول (المسارات، وأنواع الصور، واحتياجات الحزمة/الصورة المباشرة، وسيناريوهات الحالة، وعمليات التحقق من بيانات الاعتماد) دون بناء Docker أو تشغيله.

عناصر التحكم في الجدولة (متغيرات البيئة، والقيم الافتراضية بين قوسين):

| متغير البيئة                                                                                                   | القيمة الافتراضية  | الغرض                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | خانات العمليات.                                                                                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | تجمّع المسارات اللاحقة الحساسة لموفري الخدمة.                                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | الحد الأقصى لمسارات موفري الخدمة المباشرة الثقيلة.                                                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | الحد الأقصى لمسارات موارد npm.                                                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | الحد الأقصى لمسارات موارد الخدمات.                                                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | الحدود القصوى للمسارات الثقيلة لكل موفر خدمة.                                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | حدود قصوى أضيق لكل موفر خدمة.                                                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | تجاوز الإعداد للمضيفين الأكبر.                                                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | التأخير بين بدء المسارات، لتجنب عواصف إنشاء العمليات في برنامج Docker الخفي المحلي.                                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 دقيقة) | مهلة احتياطية لكل مسار؛ تستخدم المسارات المباشرة/اللاحقة المحددة حدودًا أكثر صرامة.                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | عدد إعادة المحاولات لإخفاقات موفري الخدمة المباشرة العابرة.                                                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | متوقف               | طباعة بيان المسارات دون تشغيل Docker.                                                                                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | الفاصل الزمني لطباعة حالة المسارات النشطة.                                                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | مفعّل               | إعادة استخدام `.artifacts/docker-tests/lane-timings.json` للترتيب من الأطول إلى الأقصر؛ اضبطه على `0` للتعطيل.                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | استخدم `skip` للمسارات الحتمية/المحلية فقط، و`only` لمسارات موفري الخدمة المباشرة فقط. الأسماء البديلة: `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. يدمج وضع الاختبارات المباشرة فقط المسارات المباشرة الرئيسية واللاحقة في تجمّع واحد مرتب من الأطول إلى الأقصر كي تجمع فئات موفري الخدمة أعمال Claude/Codex/Gemini معًا. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | مهلة إعداد الواجهة الخلفية لـ CLI في Docker.                                                                                                                                                                                                                                                                                                           |

نمط متغيرات البيئة لحدود الموارد هو `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (يُحوّل اسم المورد إلى أحرف كبيرة، وتُدمج المحارف غير الأبجدية الرقمية في `_`).

سلوك آخر: يجري المشغّل فحوصات Docker التمهيدية افتراضيًا، وينظّف حاويات OpenClaw E2E القديمة، ويشارك ذاكرات التخزين المؤقت لأدوات CLI الخاصة بموفّري الخدمة بين المسارات المتوافقة، ويتوقف عن جدولة مسارات مجمّعة جديدة بعد أول فشل ما لم يُضبط `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`. إذا تجاوز أحد المسارات الحد الفعلي للوزن/الموارد على مضيف منخفض التوازي، فلا يزال بإمكانه البدء من تجمّع فارغ والعمل منفردًا حتى يحرر السعة. تُكتب سجلات كل مسار و`summary.json` و`failures.json` وتوقيتات المراحل ضمن `.artifacts/docker-tests/<run-id>/`؛ استخدم `pnpm test:docker:timings <summary.json>` لفحص المسارات البطيئة، و`pnpm test:docker:rerun <run-id|summary.json|failures.json>` لطباعة أوامر إعادة تشغيل موجّهة ومنخفضة التكلفة.

### مسارات Docker البارزة

| الأمر                                                                       | ما يتحقق منه                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | حاوية E2E للمصدر مدعومة بـ Chromium مع CDP خام وGateway معزول؛ تتضمن لقطات أدوار CDP الناتجة عن `browser doctor --deep` عناوين URL للروابط، والعناصر القابلة للنقر التي رُفعت بواسطة المؤشر، ومراجع iframe، والبيانات الوصفية للإطارات.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | يثبّت ملف tarball المجمّع في مشغّل Docker مجرد مع `skills.install.allowUploadedArchives: false`، ويستخرج المعرّف النصي الحالي لإحدى Skills من بحث ClawHub المباشر، ويثبّتها عبر `openclaw skills install`، ويتحقق من `SKILL.md` و`.clawhub/origin.json` و`.clawhub/lock.json` و`skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | اختبارات مباشرة مركّزة للواجهة الخلفية لـ CLI؛ لدى Gemini أسماء بديلة مطابقة هي `:resume` و`:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | OpenClaw مع Open WebUI ضمن Docker: تسجيل الدخول، وفحص `/api/models`، وتشغيل محادثة فعلية عبر وكيل من خلال `/api/chat/completions`. يتطلب مفتاحًا صالحًا لنموذج مباشر ويسحب صورة خارجية؛ ولا يُتوقع أن يكون مستقرًا في CI مثل مجموعات اختبارات الوحدة وE2E.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | حاوية Gateway مزوّدة ببيانات أولية مع حاوية عميل تُشغّل `openclaw mcp serve`: اكتشاف المحادثات الموجّه، وقراءة النصوص المسجلة، والبيانات الوصفية للمرفقات، وسلوك قائمة انتظار الأحداث المباشرة، وتوجيه الإرسال الصادر، وإشعارات القنوات والأذونات بأسلوب Claude عبر جسر stdio الحقيقي (يقرأ التحقق إطارات MCP الخام من stdio مباشرةً).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | يثبّت ملف tarball المجمّع فوق تجهيز مستخدم قديم غير نظيف، ويشغّل تحديث الحزمة مع أداة الفحص دون تفاعل ومن دون مفاتيح مباشرة لموفّري الخدمة/القنوات، ويبدأ Gateway عبر local loopback، ويتحقق من بقاء إعدادات الوكلاء/القنوات وقوائم السماح للـ Plugin وملفات مساحة العمل/الجلسات وحالة تبعيات Plugin القديمة المتقادمة وحالة بدء التشغيل وRPC سليمة.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | يثبّت `openclaw@latest` افتراضيًا، ويهيئ ملفات واقعية لمستخدم حالي، ويضبط الإعدادات عبر وصفة مضمنة تستخدم `openclaw config set`، ثم يحدّث إلى ملف tarball المجمّع، ويشغّل أداة الفحص دون تفاعل، ويكتب `.artifacts/upgrade-survivor/summary.json`، ويتحقق من `/healthz` و`/readyz` وحالة RPC. تجاوز الإعداد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`، أو وسّع مصفوفة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو أضف تجهيزات سيناريو باستخدام `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (يتضمن `configured-plugin-installs` و`stale-source-plugin-shadow`). تعرض ميزة قبول الحزمة هذه القيم باسم `published_upgrade_survivor_baseline(s)` / `_scenarios`، وتحل الرموز الوصفية مثل `last-stable-4` أو `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | إطار اختبار نجاة الترقية المنشورة في سيناريو `plugin-deps-cleanup`، بدءًا من `openclaw@2026.4.23` افتراضيًا. يوسّع سير عمل `Update Migration` ذلك باستخدام `baselines=all-since-2026.4.23` لإثبات تنظيف تبعيات Plugin المضبوطة خارج CI للإصدار الكامل.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | اختبار دخاني للتثبيت/التحديث للمسار المحلي وحزم سجل npm ذات السابقة `file:` والتبعيات المرفوعة، ومراجع git المتحركة، وتجهيزات ClawHub، وتحديثات سوق الإضافات، وتمكين/فحص حزمة Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## بوابة طلب السحب المحلية

لفحوصات اعتماد/بوابة طلب السحب المحلية، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا تعثر `pnpm test` بشكل متقطع على مضيف محمّل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزل المشكلة باستخدام `pnpm test <path/to/test>`. للمضيفين محدودي الذاكرة:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## أدوات أداء الاختبارات

- يفعّل `pnpm test:perf:imports` إعداد تقارير مدة الاستيراد وتفاصيله في Vitest، مع الاستمرار في استخدام توجيه المسارات المحددة للأهداف الصريحة من الملفات/الأدلة. ويحصر `pnpm test:perf:imports:changed` التحليل نفسه في الملفات التي تغيرت منذ `origin/main`.
- يقيس `pnpm test:perf:changed:bench -- --ref <git-ref>` أداء مسار الوضع المتغير الموجّه مقارنةً بالتشغيل الأصلي للمشروع الجذري لنفس فرق git المُثبَت؛ بينما يقيس `pnpm test:perf:changed:bench -- --worktree` أداء مجموعة تغييرات شجرة العمل الحالية من دون تثبيتها أولًا.
- يكتب `pnpm test:perf:profile:main` ملف تعريف CPU لخيط Vitest الرئيسي (`.artifacts/vitest-main-profile`)؛ ويكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU والذاكرة الديناميكية لمشغّل اختبارات الوحدة (`.artifacts/vitest-runner-profile`).
- يشغّل `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` كل إعداد فرعي لمجموعة Vitest الكاملة تسلسليًا، ويكتب بيانات المدة المجمعة، بالإضافة إلى عناصر JSON/السجل لكل إعداد. تعزل تقارير المجموعة الكاملة الملفات افتراضيًا، كي لا تُحتسب مخططات الوحدات المحتفظ بها وتوقفات GC الناتجة من الملفات السابقة على التأكيدات اللاحقة؛ ولا تمرّر `-- --no-isolate` إلا عند تحليل تراكم العامل المشترك عمدًا. يستخدم وكيل أداء الاختبارات هذا خطًا أساسًا قبل محاولة إصلاح الاختبارات البطيئة. يقارن `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` التقارير المجمعة بعد تغيير يركز على الأداء.
- تحدّث عمليات تشغيل الأجزاء الكاملة وأجزاء الإضافات وأجزاء نمط التضمين بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم عمليات التشغيل اللاحقة للإعداد الكامل تلك التوقيتات لموازنة الأجزاء البطيئة والسريعة. تُلحق أجزاء CI ذات نمط التضمين اسم الجزء بمفتاح التوقيت، ما يُبقي توقيتات الأجزاء المرشّحة ظاهرة من دون استبدال بيانات توقيت الإعداد الكامل. عيّن `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل عنصر التوقيت المحلي.

## قياسات الأداء

<Accordion title="زمن استجابة النموذج (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

متغيرات البيئة الاختيارية: `MINIMAX_API_KEY`، و`MINIMAX_BASE_URL`، و`MINIMAX_MODEL`، و`ANTHROPIC_API_KEY`. الموجّه الافتراضي: «أجب بكلمة واحدة: ok. من دون علامات ترقيم أو نص إضافي.»

</Accordion>

<Accordion title="بدء تشغيل CLI (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

الإعدادات المسبقة:

- `startup`: `--version`، و`--help`، و`health`، و`health --json`، و`status --json`، و`status`
- `real`: `health`، و`status`، و`status --json`، و`sessions`، و`sessions --json`، و`tasks --json`، و`tasks list --json`، و`tasks audit --json`، و`agents list --json`، و`gateway status`، و`gateway status --json`، و`gateway health --json`، و`config get gateway.port`
- `all`: الإعدادان المسبقان معًا

يتضمن الناتج `sampleCount`، والمتوسط، وp50، وp95، والقيمة الدنيا/العليا، وتوزيع رمز الخروج/الإشارة، والحد الأقصى لـRSS لكل أمر. يكتب `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل.

الناتج المحفوظ: يكتب `pnpm test:startup:bench:smoke` إلى `.artifacts/cli-startup-bench-smoke.json`؛ ويكتب `pnpm test:startup:bench:save` إلى `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). التثبيت المُدرج في المستودع: `test/fixtures/cli-startup-bench.json`، ويُحدَّث بواسطة `pnpm test:startup:bench:update`، وتُجرى مقارنته بواسطة `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="بدء تشغيل Gateway (scripts/bench-gateway-startup.ts)">

يستخدم افتراضيًا مدخل CLI المبني في `dist/entry.js`؛ شغّل `pnpm build` أولًا. مرّر `--entry scripts/run-node.mjs` لقياس مشغّل المصدر بدلًا منه، وأبقِ تلك النتائج منفصلة عن الخطوط الأساسية للمدخل المبني.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

معرّفات الحالات: `default`، و`skipChannels` (يُتخطى بدء تشغيل القنوات)، و`oneInternalHook`، و`allInternalHooks`، و`fiftyPlugins` (50 Plugin من بيان التعريف)، و`fiftyStartupLazyPlugins` (50 Plugin من بيان التعريف بتحميل كسول عند بدء التشغيل).

يتضمن الناتج أول ناتج للعملية، و`/healthz`، و`/readyz`، ووقت سجل استماع HTTP، ووقت سجل جاهزية Gateway، ووقت CPU، ونسبة نواة CPU، والحد الأقصى لـRSS، والذاكرة الديناميكية، ومقاييس تتبع بدء التشغيل، وتأخير حلقة الأحداث، ومقاييس تفاصيل جدول البحث الخاص بالـPlugin. يعيّن البرنامج النصي `OPENCLAW_GATEWAY_STARTUP_TRACE=1` في بيئة Gateway الفرعية.

يمثل `/healthz` حالة التشغيل (يمكن لخادم HTTP الرد). ويمثل `/readyz` الجاهزية للاستخدام (استقرت العمليات الجانبية للـPlugin عند بدء التشغيل، والقنوات، والأعمال الحرجة للجاهزية التي تلي الإرفاق). تُرسل خطافات بدء التشغيل بشكل غير متزامن ولا تشكل جزءًا من ضمان الجاهزية. وقت سجل الجاهزية هو الطابع الزمني الداخلي لـGateway، وهو مفيد لإسناد الوقت إلى العملية، لكنه ليس بديلًا عن فحص `/readyz` الخارجي.

استخدم ناتج JSON أو `--output` عند مقارنة التغييرات. ولا تستخدم `--cpu-prof-dir` إلا بعد أن يشير ناتج التتبع إلى أعمال استيراد أو ترجمة برمجية أو أعمال مقيّدة بالـCPU لا تستطيع توقيتات المراحل وحدها تفسيرها.

</Accordion>

<Accordion title="إعادة تشغيل Gateway (scripts/bench-gateway-restart.ts)">

لنظامي macOS وLinux فقط (يستخدم SIGUSR1 لإعادة التشغيل داخل العملية؛ ويفشل فورًا على Windows). يستخدم الإعداد الافتراضي نفسه للمدخل المبني، وخيار التجاوز `--entry scripts/run-node.mjs` نفسه المستخدم في بدء تشغيل Gateway أعلاه.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

معرّفات الحالات: `skipChannels`، و`skipChannelsAcpxProbe` (فحص بدء تشغيل ACPX مفعّل)، و`skipChannelsNoAcpxProbe` (الفحص معطّل)، و`default`، و`fiftyPlugins`.

يتضمن الناتج حالة `/healthz` التالية، وحالة `/readyz` التالية، ومدة التوقف، وتوقيت الجاهزية بعد إعادة التشغيل، وCPU، وRSS، ومقاييس تتبع بدء تشغيل العملية البديلة، ومقاييس تتبع إعادة التشغيل لمعالجة الإشارة، وانتظار انتهاء العمل النشط، ومراحل الإغلاق، وبدء التشغيل التالي، وتوقيت الجاهزية، ولقطات الذاكرة. يعيّن البرنامج النصي `OPENCLAW_GATEWAY_STARTUP_TRACE=1` و`OPENCLAW_GATEWAY_RESTART_TRACE=1`.

استخدم مقياس الأداء هذا عندما يمس تغييرٌ ما إشارات إعادة التشغيل، أو معالجات الإغلاق، أو بدء التشغيل بعد إعادة التشغيل، أو إيقاف العمليات الجانبية، أو تسليم الخدمة، أو الجاهزية بعد إعادة التشغيل. ابدأ بـ`skipChannels` لعزل آليات Gateway عن بدء تشغيل القنوات؛ ولا تستخدم `default` أو الحالات كثيفة الـPlugin إلا بعد أن تفسّر الحالة المحدودة مسار إعادة التشغيل. مقاييس التتبع تلميحات للإسناد وليست أحكامًا — قيّم تغيير إعادة التشغيل باستخدام عينات متعددة، ونطاق المالك المطابق، وسلوك `/healthz`/`/readyz`، وعقد إعادة التشغيل الظاهر للمستخدم.

</Accordion>

## الاختبار الشامل للتأهيل (Docker)

اختياري؛ ولا يلزم إلا لاختبارات الدخان للتأهيل داخل الحاويات. تدفق بدء التشغيل البارد الكامل داخل حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يشغّل المعالج التفاعلي عبر طرفية زائفة، ويتحقق من ملفات الإعداد/مساحة العمل/الجلسة، ثم يبدأ Gateway ويشغّل `openclaw health`.

## اختبار دخان استيراد QR (Docker)

يضمن تحميل مساعد وقت تشغيل QR المُصان ضمن بيئات تشغيل Docker Node المدعومة (Node 24 افتراضيًا، ومتوافق مع Node 22):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)
- [اختبار التحديثات والـPlugin](/ar/help/testing-updates-plugins)
