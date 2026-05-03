---
read_when:
    - فهم كيفية تكامل مكدس ضمان الجودة
    - توسيع qa-lab أو qa-channel أو محوّل نقل
    - إضافة سيناريوهات ضمان الجودة المدعومة بالمستودع
    - بناء أتمتة لضمان الجودة أكثر واقعية حول لوحة تحكم Gateway
summary: 'نظرة عامة على مكدس ضمان الجودة: qa-lab، وqa-channel، والسيناريوهات المدعومة بالمستودع، ومسارات النقل الحية، ومحولات النقل، وإعداد التقارير.'
title: نظرة عامة على ضمان الجودة
x-i18n:
    generated_at: "2026-05-03T21:31:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

مكدس QA الخاص مخصص لاختبار OpenClaw بطريقة أكثر واقعية ومشكلة كالقنوات،
أكثر مما يستطيع اختبار وحدة واحد فعله.

الأجزاء الحالية:

- `extensions/qa-channel`: قناة رسائل اصطناعية تتضمن أسطح الرسائل المباشرة، والقنوات، والسلاسل،
  والتفاعلات، والتعديل، والحذف.
- `extensions/qa-lab`: واجهة مصحح الأخطاء وناقل QA لمراقبة النص المنسوخ،
  وحقن الرسائل الواردة، وتصدير تقرير Markdown.
- `extensions/qa-matrix`، وإضافات التشغيل المستقبلية: محولات نقل حي
  تقود قناة حقيقية داخل Gateway QA فرعي.
- `qa/`: أصول أولية مدعومة بالمستودع لمهمة البدء وسيناريوهات QA
  الأساسية.
- [Mantis](/ar/concepts/mantis): تحقق حي قبل وبعد للأخطاء التي
  تحتاج إلى عمليات نقل حقيقية، ولقطات شاشة للمتصفح، وحالة VM، وأدلة PR.

## واجهة الأوامر

يعمل كل تدفق QA تحت `pnpm openclaw qa <subcommand>`. للعديد منها أسماء مستعارة كسكربتات `pnpm qa:*`؛ وكلا الشكلين مدعوم.

| الأمر                                             | الغرض                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | فحص ذاتي مدمج لـ QA؛ يكتب تقرير Markdown.                                                                                                                       |
| `qa suite`                                          | تشغيل سيناريوهات مدعومة بالمستودع مقابل مسار Gateway الخاص بـ QA. الأسماء المستعارة: `pnpm openclaw qa suite --runner multipass` لاستخدام VM Linux مؤقت.                                 |
| `qa coverage`                                       | طباعة مخزون تغطية السيناريوهات بصيغة markdown (`--json` للمخرجات الآلية).                                                                                          |
| `qa parity-report`                                  | مقارنة ملفي `qa-suite-summary.json` وكتابة تقرير التكافؤ الوكيلي.                                                                                         |
| `qa character-eval`                                 | تشغيل سيناريو QA الخاص بالشخصية عبر عدة نماذج حية مع تقرير محكوم. راجع [الإبلاغ](#reporting).                                                           |
| `qa manual`                                         | تشغيل مطالبة لمرة واحدة مقابل مسار المزوّد/النموذج المحدد.                                                                                                         |
| `qa ui`                                             | بدء واجهة مصحح QA وناقل QA المحلي (الاسم المستعار: `pnpm qa:lab:ui`).                                                                                                   |
| `qa docker-build-image`                             | بناء صورة Docker المجهزة مسبقا لـ QA.                                                                                                                                    |
| `qa docker-scaffold`                                | كتابة هيكل docker-compose للوحة معلومات QA + مسار Gateway.                                                                                                   |
| `qa up`                                             | بناء موقع QA، وبدء المكدس المدعوم بـ Docker، وطباعة URL (الاسم المستعار: `pnpm qa:lab:up`؛ يضيف متغير `:fast` الخيارات `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | بدء خادم موفر AIMock فقط.                                                                                                                                 |
| `qa mock-openai`                                    | بدء خادم موفر `mock-openai` المدرك للسيناريوهات فقط.                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | إدارة مجمع بيانات اعتماد Convex المشترك.                                                                                                                              |
| `qa matrix`                                         | مسار نقل حي مقابل خادم منزلي Tuwunel مؤقت. راجع [QA لـ Matrix](/ar/concepts/qa-matrix).                                                                     |
| `qa telegram`                                       | مسار نقل حي مقابل مجموعة Telegram خاصة حقيقية.                                                                                                             |
| `qa discord`                                        | مسار نقل حي مقابل قناة نقابة Discord خاصة حقيقية.                                                                                                      |
| `qa mantis`                                         | مشغل تحقق قبل وبعد لأخطاء النقل الحي، مع أول سيناريو لتفاعلات الحالة في Discord. راجع [Mantis](/ar/concepts/mantis).                        |

## تدفق المشغل

تدفق مشغل QA الحالي هو موقع QA بلوحتين:

- اليسار: لوحة معلومات Gateway (واجهة التحكم) مع الوكيل.
- اليمين: QA Lab، يعرض النص المنسوخ المشابه لـ Slack وخطة السيناريو.

شغله باستخدام:

```bash
pnpm qa:lab:up
```

يبني ذلك موقع QA، ويبدأ مسار Gateway المدعوم بـ Docker، ويعرض صفحة
QA Lab حيث يمكن لمشغل أو حلقة أتمتة أن تعطي الوكيل مهمة QA،
وتراقب سلوك القناة الحقيقي، وتسجل ما نجح أو فشل أو
ظل محجوبا.

لتكرار واجهة QA Lab المحلية بسرعة أكبر دون إعادة بناء صورة Docker في كل مرة،
ابدأ المكدس بحزمة QA Lab مركبة بالربط:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

يحافظ `qa:lab:up:fast` على خدمات Docker فوق صورة مبنية مسبقا ويركب بالربط
`extensions/qa-lab/web/dist` داخل حاوية `qa-lab`. يعيد `qa:lab:watch`
بناء تلك الحزمة عند التغيير، ويعيد المتصفح التحميل تلقائيا عندما يتغير تجزئة أصل QA Lab.

لتجربة دخان محلية لتتبعات OpenTelemetry، شغل:

```bash
pnpm qa:otel:smoke
```

يبدأ ذلك السكربت مستقبل تتبع OTLP/HTTP محليا، ويشغل سيناريو QA
`otel-trace-smoke` مع تفعيل Plugin `diagnostics-otel`، ثم
يفك ترميز امتدادات protobuf المصدرة ويتحقق من الشكل الحرج للإصدار:
يجب أن تكون `openclaw.run`، و`openclaw.harness.run`، و`openclaw.model.call`،
و`openclaw.context.assembled`، و`openclaw.message.delivery` موجودة؛
يجب ألا تصدر استدعاءات النموذج `StreamAbandoned` في الدورات الناجحة؛ ويجب أن تبقى معرفات التشخيص الخام وسمات
`openclaw.content.*` خارج التتبع. يكتب
`otel-smoke-summary.json` بجانب آثار مجموعة QA.

يبقى QA الخاص بقابلية الملاحظة مقتصرا على نسخة المصدر. يحذف أرشيف npm tarball عمدا
QA Lab، لذلك لا تشغل مسارات إصدار Docker للحزم أوامر `qa`. استخدم
`pnpm qa:otel:smoke` من نسخة مصدر مبنية عند تغيير
تجهيز التشخيص.

لمسار دخان Matrix حقيقي النقل، شغل:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع CLI الكامل، وكتالوج الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط الآثار لهذا المسار موجودة في [QA لـ Matrix](/ar/concepts/qa-matrix). باختصار: يجهز خادم Tuwunel منزلي مؤقتا في Docker، ويسجل مستخدمي driver/SUT/observer مؤقتين، ويشغل Plugin Matrix الحقيقي داخل Gateway QA فرعي مضبوط على ذلك النقل (بلا `qa-channel`)، ثم يكتب تقرير Markdown، وملخص JSON، وأثر observed-events، وسجل مخرجات مدمج ضمن `.artifacts/qa-e2e/matrix-<timestamp>/`.

لمسارات دخان Telegram وDiscord حقيقية النقل:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

يستهدف كلاهما قناة حقيقية موجودة مسبقا مع بوتين (driver + SUT). متغيرات البيئة المطلوبة، وقوائم السيناريوهات، وآثار المخرجات، ومجمع بيانات اعتماد Convex موثقة في [مرجع QA لـ Telegram وDiscord](#telegram-and-discord-qa-reference) أدناه.

قبل استخدام بيانات اعتماد حية مجمعة، شغل:

```bash
pnpm openclaw qa credentials doctor
```

يفحص doctor بيئة وسيط Convex، ويتحقق من إعدادات نقاط النهاية، ويتأكد من إمكانية وصول admin/list عندما يكون سر المشرف موجودا. لا يبلغ عن الأسرار إلا بحالة set/missing.

## تغطية النقل الحي

تشترك مسارات النقل الحي في عقد واحد بدلا من أن يخترع كل منها شكل قائمة سيناريوهات خاصا به. `qa-channel` هي مجموعة سلوك المنتج الاصطناعية الواسعة وليست جزءا من مصفوفة تغطية النقل الحي.

| المسار     | Canary | ضبط الإشارة | من بوت إلى بوت | حظر قائمة السماح | رد من المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة السلسلة | عزل السلسلة | مراقبة التفاعل | أمر المساعدة | تسجيل الأمر الأصلي |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

يحافظ هذا على `qa-channel` كمجموعة سلوك المنتج الواسعة، بينما تشترك Matrix،
وTelegram، وعمليات النقل الحي المستقبلية في قائمة تحقق صريحة واحدة لعقد النقل.

لمسار VM Linux مؤقت دون إدخال Docker في مسار QA، شغل:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

يشغل هذا ضيفا جديدا من Multipass، ويثبت التبعيات، ويبني OpenClaw
داخل الضيف، ويشغل `qa suite`، ثم ينسخ تقرير QA العادي
والملخص مرة أخرى إلى `.artifacts/qa-e2e/...` على المضيف.
يعيد استخدام سلوك اختيار السيناريو نفسه كما في `qa suite` على المضيف.
تنفذ تشغيلات المجموعة على المضيف وMultipass عدة سيناريوهات محددة بالتوازي
باستخدام عمال Gateway معزولين افتراضيا. تكون قيمة التزامن الافتراضية لـ `qa-channel`
هي 4، وبحد أقصى عدد السيناريوهات المحددة. استخدم `--concurrency <count>` لضبط
عدد العمال، أو `--concurrency 1` للتنفيذ التسلسلي.
يخرج الأمر برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
تريد الآثار دون رمز خروج فاشل.
تمرر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية بالنسبة إلى
الضيف: مفاتيح المزود المستندة إلى البيئة، ومسار إعداد مزود QA الحي، و
`CODEX_HOME` عند وجوده. أبق `--output-dir` تحت جذر المستودع حتى يتمكن الضيف
من الكتابة مرة أخرى عبر مساحة العمل المركبة.

## مرجع QA لـ Telegram وDiscord

لدى Matrix [صفحة مخصصة](/ar/concepts/qa-matrix) بسبب عدد سيناريوهاته وتجهيز الخادم المنزلي المدعوم بـ Docker. Telegram وDiscord أصغر حجما — حفنة من السيناريوهات لكل منهما، بلا نظام ملفات شخصية، مقابل قنوات حقيقية موجودة مسبقا — لذلك يعيش مرجعهما هنا.

### أعلام CLI المشتركة

يسجل كلا المسارين عبر `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ويقبلان الأعلام نفسها:

| العلم                                  | الافتراضي                                                   | الوصف                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | شغّل هذا السيناريو فقط. قابل للتكرار.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | المكان الذي تُكتب فيه التقارير/الملخص/الرسائل المرصودة وسجل الإخراج. تُحلّ المسارات النسبية مقابل `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | جذر المستودع عند الاستدعاء من cwd محايد.                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | معرّف حساب مؤقت داخل إعدادات Gateway ضمان الجودة.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` أو `live-frontier` (ما يزال `live-openai` القديم يعمل).                                                  |
| `--model <ref>` / `--alt-model <ref>` | افتراضي المزوّد                                          | مراجع النموذج الأساسي/البديل.                                                                                         |
| `--fast`                              | معطّل                                                       | الوضع السريع للمزوّد حيث يكون مدعومًا.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | راجع [مجموعة بيانات اعتماد Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` في CI، و`maintainer` بخلاف ذلك                        | الدور المستخدم عند `--credential-source convex`.                                                                          |

ينهي كلاهما التنفيذ برمز خروج غير صفري عند فشل أي سيناريو. يكتب `--allow-failures` الآثار بدون تعيين رمز خروج فاشل.

### ضمان جودة Telegram

```bash
pnpm openclaw qa telegram
```

يستهدف مجموعة Telegram خاصة حقيقية واحدة مع روبوتين مميزين (المشغّل + SUT). يجب أن يمتلك روبوت SUT اسم مستخدم في Telegram؛ تعمل المراقبة من روبوت إلى روبوت بأفضل شكل عندما يكون لدى كلا الروبوتين **وضع الاتصال من روبوت إلى روبوت** مفعّلًا في `@BotFather`.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — معرّف محادثة رقمي (سلسلة نصية).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختياري:

- يحتفظ `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` بنصوص الرسائل في آثار الرسائل المرصودة (الافتراضي يحجبها).

السيناريوهات (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

آثار الإخراج:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — يتضمن RTT لكل رد (إرسال المشغّل → رد SUT المرصود) بدءًا من canary.
- `telegram-qa-observed-messages.json` — تُحجب النصوص إلا إذا كان `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### ضمان جودة Discord

```bash
pnpm openclaw qa discord
```

يستهدف قناة guild خاصة حقيقية واحدة في Discord مع روبوتين: روبوت مشغّل تتحكم فيه الحزمة، وروبوت SUT يبدأه OpenClaw gateway الابن عبر Plugin Discord المضمّن. يتحقق من معالجة إشارات القناة، ومن أن روبوت SUT سجّل أمر `/help` الأصلي مع Discord، ومن سيناريوهات أدلة Mantis الاختيارية.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — يجب أن يطابق معرّف مستخدم روبوت SUT الذي يعيده Discord (وإلا يفشل المسار مبكرًا).

اختياري:

- يحتفظ `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` بنصوص الرسائل في آثار الرسائل المرصودة.

السيناريوهات (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — سيناريو Mantis اختياري. يعمل منفردًا لأنه يبدّل SUT إلى ردود guild دائمة التشغيل ومعتمدة على الأدوات فقط مع `messages.statusReactions.enabled=true`، ثم يلتقط خطًا زمنيًا لتفاعلات REST مع أثر مرئي HTML/PNG.

شغّل سيناريو تفاعل الحالة Mantis صراحةً:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

آثار الإخراج:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — تُحجب النصوص إلا إذا كان `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` و`discord-status-reactions-tool-only-timeline.png` عند تشغيل سيناريو تفاعل الحالة.

### مجموعة بيانات اعتماد Convex

يمكن لمساري Telegram وDiscord استئجار بيانات اعتماد من مجموعة Convex مشتركة بدلًا من قراءة متغيرات البيئة أعلاه. مرّر `--credential-source convex` (أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)؛ يحصل QA Lab على استئجار حصري، ويرسل له Heartbeat طوال مدة التشغيل، ويحرره عند الإيقاف. أنواع المجموعة هي `"telegram"` و`"discord"`.

أشكال الحمولة التي يتحقق منها الوسيط عند `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — يجب أن يكون `groupId` سلسلة نصية لمعرّف محادثة رقمي.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

توجد متغيرات البيئة التشغيلية وعقدة نقطة نهاية وسيط Convex في [الاختبار ← بيانات اعتماد Telegram المشتركة عبر Convex](/ar/help/testing#shared-telegram-credentials-via-convex-v1) (سبق اسم القسم دعم Discord؛ دلالات الوسيط متطابقة لكلا النوعين).

## بذور مدعومة بالمستودع

توجد أصول البذور في `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

هذه موجودة عمدًا في git بحيث تكون خطة ضمان الجودة مرئية لكل من البشر والوكيل.

يجب أن يبقى `qa-lab` مشغّل markdown عامًا. كل ملف سيناريو markdown هو مصدر الحقيقة لتشغيل اختبار واحد ويجب أن يعرّف:

- بيانات السيناريو الوصفية
- بيانات وصفية اختيارية للفئة والقدرة والمسار والمخاطر
- مراجع الوثائق والكود
- متطلبات Plugin اختيارية
- تصحيح إعدادات Gateway اختياري
- `qa-flow` القابل للتنفيذ

يُسمح لسطح وقت التشغيل القابل لإعادة الاستخدام الذي يدعم `qa-flow` بأن يبقى عامًا وشاملًا. على سبيل المثال، يمكن لسيناريوهات markdown دمج مساعدات جانب النقل مع مساعدات جانب المتصفح التي تقود Control UI المضمنة عبر وصلة Gateway `browser.request` بدون إضافة مشغّل حالة خاصة.

يجب تجميع ملفات السيناريو حسب قدرة المنتج بدلًا من مجلد شجرة المصدر. أبقِ معرّفات السيناريو مستقرة عند نقل الملفات؛ استخدم `docsRefs` و`codeRefs` لإمكانية تتبع التنفيذ.

يجب أن تبقى قائمة الأساس عريضة بما يكفي لتغطية:

- الدردشة عبر الرسائل المباشرة والقنوات
- سلوك الخيوط
- دورة حياة إجراء الرسالة
- استدعاءات Cron الراجعة
- استرجاع الذاكرة
- تبديل النماذج
- تسليم الوكيل الفرعي
- قراءة المستودع وقراءة الوثائق
- مهمة بناء صغيرة مثل Lobster Invaders

## مسارات محاكاة المزوّد

يحتوي `qa suite` على مساري محاكاة مزوّد محليين:

- `mock-openai` هو محاكي OpenClaw الواعي بالسيناريو. يبقى مسار المحاكاة الحتمي الافتراضي لضمان الجودة المدعوم بالمستودع وبوابات التكافؤ.
- يبدأ `aimock` خادم مزوّد مدعومًا بـ AIMock لتغطية تجريبية للبروتوكول، والملحقات، والتسجيل/إعادة التشغيل، والفوضى. إنه إضافي ولا يستبدل موزّع سيناريوهات `mock-openai`.

يوجد تنفيذ مسارات المزوّد تحت `extensions/qa-lab/src/providers/`. يمتلك كل مزوّد افتراضاته، وبدء تشغيل خادمه المحلي، وإعدادات نموذج Gateway، واحتياجات تجهيز ملف تعريف المصادقة، وأعلام قدرات التشغيل الحي/المحاكاة. يجب أن يمر كود الحزمة المشترك وGateway عبر سجل المزوّد بدلًا من التفريع على أسماء المزوّدين.

## محولات النقل

يمتلك `qa-lab` وصلة نقل عامة لسيناريوهات ضمان الجودة بصيغة markdown. يُعد `qa-channel` أول محول على تلك الوصلة، لكن هدف التصميم أوسع: يجب أن تتصل القنوات الحقيقية أو الاصطناعية المستقبلية بمشغّل الحزمة نفسه بدلًا من إضافة مشغّل ضمان جودة خاص بالنقل.

على مستوى البنية، يكون الفصل كالآتي:

- يمتلك `qa-lab` تنفيذ السيناريو العام، وتزامن العمال، وكتابة الآثار، وإعداد التقارير.
- يمتلك محول النقل إعدادات Gateway، والجاهزية، ومراقبة الوارد والصادر، وإجراءات النقل، وحالة النقل الموحّدة.
- تعرّف ملفات سيناريو markdown تحت `qa/scenarios/` تشغيل الاختبار؛ ويوفر `qa-lab` سطح وقت التشغيل القابل لإعادة الاستخدام الذي ينفّذها.

### إضافة قناة

تتطلب إضافة قناة إلى نظام ضمان الجودة بصيغة markdown شيئين بالضبط:

1. محول نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تضف جذر أمر ضمان جودة علويًا جديدًا عندما يستطيع مضيف `qa-lab` المشترك امتلاك التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء الحزمة وإنهاؤها
- تزامن العمال
- كتابة الآثار
- توليد التقرير
- تنفيذ السيناريو
- أسماء التوافق البديلة لسيناريوهات `qa-channel` الأقدم

تمتلك إضافات المشغّل عقد النقل:

- كيف يُركّب `openclaw qa <runner>` تحت جذر `qa` المشترك
- كيف تُعد Gateway لذلك النقل
- كيف تُفحص الجاهزية
- كيف تُحقن الأحداث الواردة
- كيف تُرصد الرسائل الصادرة
- كيف تُكشف النصوص وحالة النقل الموحّدة
- كيف تُنفذ الإجراءات المدعومة بالنقل
- كيف تُعالَج إعادة الضبط أو التنظيف الخاص بالنقل

الحد الأدنى لاعتماد قناة جديدة:

1. أبقِ `qa-lab` مالك جذر `qa` المشترك.
2. نفّذ مشغّل النقل على وصلة مضيف `qa-lab` المشتركة.
3. أبقِ الآليات الخاصة بالنقل داخل Plugin المشغّل أو حزمة اختبار القناة.
4. ركّب المشغّل كـ `openclaw qa <runner>` بدلًا من تسجيل أمر جذر منافس. يجب أن تعلن Plugins المشغّلات عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`. أبقِ `runtime-api.ts` خفيفًا؛ يجب أن يبقى تنفيذ CLI والمشغّل الكسول خلف نقاط دخول منفصلة.
5. ألّف أو كيّف سيناريوهات markdown تحت أدلة `qa/scenarios/` ذات السمات.
6. استخدم مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. أبقِ أسماء التوافق البديلة الحالية عاملة ما لم يكن المستودع يجري ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا كان يمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقِه في Plugin ذلك المشغّل أو حزمة اختبار Plugin.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن لأكثر من قناة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بالقناة في `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بالنقل واجعل ذلك صريحًا في عقد السيناريو.

### أسماء مساعدي السيناريو

المساعدات العامة المفضلة للسيناريوهات الجديدة:

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

تظل أسماء التوافق البديلة متاحة للسيناريوهات الحالية — `waitForQaChannelReady` و`waitForOutboundMessage` و`waitForNoOutbound` و`formatConversationTranscript` و`resetBus` — لكن ينبغي استخدام الأسماء العامة عند تأليف سيناريوهات جديدة. وُجدت هذه الأسماء البديلة لتجنب ترحيل شامل في يوم واحد، لا بوصفها النموذج المعتمد مستقبلًا.

## إعداد التقارير

يُصدّر `qa-lab` تقرير بروتوكول Markdown من مخطط bus الزمني المرصود.
ينبغي أن يجيب التقرير عن:

- ما الذي نجح
- ما الذي فشل
- ما الذي ظل محظورًا
- ما سيناريوهات المتابعة التي تستحق الإضافة

لجرد السيناريوهات المتاحة — وهو مفيد عند تقدير حجم أعمال المتابعة أو توصيل نقل جديد — شغّل `pnpm openclaw qa coverage` (أضف `--json` للحصول على مخرجات قابلة للقراءة آليًا).

لفحوصات الشخصية والأسلوب، شغّل السيناريو نفسه عبر عدة مراجع نماذج حية
واكتب تقرير Markdown مُحكّمًا:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

يشغّل الأمر عمليات فرعية لـ Gateway الخاص بالـ QA المحلي، وليس Docker. ينبغي أن تضبط سيناريوهات تقييم الشخصية الهيئة عبر `SOUL.md`، ثم تشغّل أدوار مستخدم عادية
مثل المحادثة، ومساعدة مساحة العمل، ومهام الملفات الصغيرة. ينبغي ألا يُخبر النموذج المرشح
بأنه قيد التقييم. يحافظ الأمر على كل نسخة كاملة
من المحادثة، ويسجل إحصاءات تشغيل أساسية، ثم يطلب من نماذج التحكيم في الوضع السريع مع
استدلال `xhigh` حيثما كان مدعومًا ترتيب عمليات التشغيل حسب الطبيعية والطابع والفكاهة.
استخدم `--blind-judge-models` عند مقارنة المزوّدين: ما زالت مطالبة التحكيم تحصل على
كل نسخة محادثة وحالة تشغيل، لكن تُستبدل مراجع المرشحين بتسميات محايدة
مثل `candidate-01`؛ ويربط التقرير الترتيبات مرة أخرى بالمراجع الحقيقية بعد
التحليل.
تستخدم عمليات تشغيل المرشحين افتراضيًا تفكير `high`، مع `medium` لـ GPT-5.5 و`xhigh`
لمراجع تقييم OpenAI الأقدم التي تدعمه. تجاوز مرشحًا محددًا ضمنيًا باستخدام
`--model provider/model,thinking=<level>`. ما زال `--thinking <level>` يضبط
بديلًا عامًا، ويُحتفظ بالصيغة الأقدم `--model-thinking <provider/model=level>`
للتوافق.
تستخدم مراجع مرشحي OpenAI افتراضيًا الوضع السريع بحيث تُستخدم المعالجة ذات الأولوية حيثما
كان المزوّد يدعمها. أضف `,fast` أو `,no-fast` أو `,fast=false` ضمنيًا عندما يحتاج
مرشح واحد أو محكّم واحد إلى تجاوز. مرّر `--fast` فقط عندما تريد
فرض الوضع السريع على كل نموذج مرشح. تُسجل مدد المرشحين والمحكّمين
في التقرير لتحليل المقاييس، لكن مطالبات التحكيم تنص صراحةً
على عدم الترتيب حسب السرعة.
تستخدم عمليات تشغيل نماذج المرشحين والمحكّمين معًا التزامن 16 افتراضيًا. خفّض
`--concurrency` أو `--judge-concurrency` عندما تجعل حدود المزوّد أو ضغط Gateway المحلي
التشغيل كثير الضجيج.
عند عدم تمرير أي مرشح `--model`، يستخدم تقييم الشخصية افتراضيًا
`openai/gpt-5.5` و`openai/gpt-5.2` و`openai/gpt-5` و`anthropic/claude-opus-4-6`
و`anthropic/claude-sonnet-4-6` و`zai/glm-5.1`
و`moonshot/kimi-k2.5` و
`google/gemini-3.1-pro-preview` عند عدم تمرير أي `--model`.
عند عدم تمرير أي `--judge-model`، يستخدم المحكّمون افتراضيًا
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high`.

## المستندات ذات الصلة

- [QA المصفوفة](/ar/concepts/qa-matrix)
- [قناة QA](/ar/channels/qa-channel)
- [الاختبار](/ar/help/testing)
- [لوحة المعلومات](/ar/web/dashboard)
