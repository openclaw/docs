---
read_when:
    - فهم كيفية تكامل منظومة ضمان الجودة
    - توسيع qa-lab، أو qa-channel، أو محوّل نقل
    - إضافة سيناريوهات ضمان الجودة المدعومة بالمستودع
    - بناء أتمتة ضمان جودة أكثر واقعية حول لوحة معلومات Gateway
summary: 'نظرة عامة على حزمة ضمان الجودة: qa-lab وqa-channel، والسيناريوهات المدعومة بالمستودع، ومسارات النقل الحية، ومحوّلات النقل، وإعداد التقارير.'
title: نظرة عامة على ضمان الجودة
x-i18n:
    generated_at: "2026-05-05T06:17:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

مجموعة QA الخاصة مخصصة لاختبار OpenClaw بطريقة أكثر واقعية،
ومشكلة وفق القنوات، مما يمكن أن يقدمه اختبار وحدة واحد.

الأجزاء الحالية:

- `extensions/qa-channel`: قناة رسائل اصطناعية تتضمن أسطح الرسائل المباشرة، والقناة، والسلاسل،
  والتفاعلات، والتحرير، والحذف.
- `extensions/qa-lab`: واجهة مصحح الأخطاء وناقل QA لمراقبة النص المنسوخ،
  وحقن الرسائل الواردة، وتصدير تقرير Markdown.
- `extensions/qa-matrix`، وplugins التشغيل المستقبلية: محولات نقل مباشرة
  تشغل قناة حقيقية داخل Gateway QA فرعي.
- `qa/`: أصول تمهيدية مدعومة بالمستودع لمهمة البدء وسيناريوهات QA
  الأساسية.
- [Mantis](/ar/concepts/mantis): تحقق مباشر قبل وبعد للأخطاء التي
  تحتاج إلى وسائل نقل حقيقية، ولقطات شاشة للمتصفح، وحالة VM، وأدلة PR.

## سطح الأوامر

يعمل كل تدفق QA تحت `pnpm openclaw qa <subcommand>`. لدى كثير منها أسماء مستعارة لسكربتات `pnpm qa:*`؛ وكلا الشكلين مدعوم.

| الأمر                                             | الغرض                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | فحص ذاتي مضمّن لـ QA؛ يكتب تقرير Markdown.                                                                                                                                             |
| `qa suite`                                          | تشغيل سيناريوهات مدعومة بالمستودع مقابل مسار Gateway QA. الأسماء المستعارة: `pnpm openclaw qa suite --runner multipass` لـ VM Linux قابلة للتخلص منها.                                                       |
| `qa coverage`                                       | طباعة مخزون تغطية السيناريو بصيغة markdown (`--json` لمخرجات الآلة).                                                                                                                |
| `qa parity-report`                                  | مقارنة ملفي `qa-suite-summary.json` وكتابة تقرير التكافؤ الوكيلي.                                                                                                               |
| `qa character-eval`                                 | تشغيل سيناريو QA للشخصية عبر عدة نماذج مباشرة مع تقرير محكّم. راجع [إعداد التقارير](#reporting).                                                                                 |
| `qa manual`                                         | تشغيل مطالبة لمرة واحدة مقابل مسار المزود/النموذج المحدد.                                                                                                                               |
| `qa ui`                                             | بدء واجهة مصحح QA وناقل QA المحلي (الاسم المستعار: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | بناء صورة Docker المعدة مسبقًا لـ QA.                                                                                                                                                          |
| `qa docker-scaffold`                                | كتابة هيكل docker-compose للوحة معلومات QA + مسار Gateway.                                                                                                                         |
| `qa up`                                             | بناء موقع QA، وبدء المجموعة المدعومة بـ Docker، وطباعة URL (الاسم المستعار: `pnpm qa:lab:up`؛ ويضيف متغير `:fast` ‏`--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | بدء خادم مزود AIMock فقط.                                                                                                                                                       |
| `qa mock-openai`                                    | بدء خادم مزود `mock-openai` المدرك للسيناريوهات فقط.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | إدارة مجموعة بيانات اعتماد Convex المشتركة.                                                                                                                                                    |
| `qa matrix`                                         | مسار نقل مباشر مقابل خادم Tuwunel منزلي قابل للتخلص منه. راجع [QA لـ Matrix](/ar/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | مسار نقل مباشر مقابل مجموعة Telegram خاصة حقيقية.                                                                                                                                   |
| `qa discord`                                        | مسار نقل مباشر مقابل قناة guild خاصة حقيقية في Discord.                                                                                                                            |
| `qa slack`                                          | مسار نقل مباشر مقابل قناة Slack خاصة حقيقية.                                                                                                                                    |
| `qa mantis`                                         | مشغل تحقق قبل وبعد لأخطاء النقل المباشر، مع أدلة تفاعلات حالة Discord، واختبار Crabbox السطحي لسطح المكتب/المتصفح، واختبار Slack داخل VNC. راجع [Mantis](/ar/concepts/mantis). |

## تدفق المشغل

تدفق مشغل QA الحالي هو موقع QA بلوحتين:

- اليسار: لوحة معلومات Gateway (واجهة التحكم) مع الوكيل.
- اليمين: QA Lab، يعرض النص المنسوخ الشبيه بـ Slack وخطة السيناريو.

شغله باستخدام:

```bash
pnpm qa:lab:up
```

يبني ذلك موقع QA، ويبدأ مسار Gateway المدعوم بـ Docker، ويعرض
صفحة QA Lab حيث يستطيع المشغل أو حلقة الأتمتة إعطاء الوكيل مهمة QA،
ومراقبة سلوك القناة الحقيقي، وتسجيل ما نجح أو فشل أو
بقي محظورًا.

لتكرار أسرع على واجهة QA Lab دون إعادة بناء صورة Docker في كل مرة،
ابدأ المجموعة بحزمة QA Lab مركبة ربطًا:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

يبقي `qa:lab:up:fast` خدمات Docker على صورة مبنية مسبقًا ويركب ربطًا
`extensions/qa-lab/web/dist` داخل حاوية `qa-lab`. يعيد `qa:lab:watch`
بناء تلك الحزمة عند التغيير، ويعاد تحميل المتصفح تلقائيًا عندما يتغير
تجزئة أصل QA Lab.

لاختبار تتبع OpenTelemetry محلي سريع، شغل:

```bash
pnpm qa:otel:smoke
```

يبدأ ذلك السكربت مستقبِل تتبع OTLP/HTTP محليًا، ويشغل سيناريو QA
`otel-trace-smoke` مع تمكين Plugin `diagnostics-otel`، ثم
يفك ترميز امتدادات protobuf المصدرة ويتحقق من الشكل الحرج للإصدار:
يجب أن تكون `openclaw.run`، و`openclaw.harness.run`، و`openclaw.model.call`،
و`openclaw.context.assembled`، و`openclaw.message.delivery` موجودة؛
ويجب ألا تصدر استدعاءات النموذج `StreamAbandoned` في الدورات الناجحة؛ ويجب أن تبقى معرّفات التشخيص الخام وسمات
`openclaw.content.*` خارج التتبع. يكتب
`otel-smoke-summary.json` بجانب عناصر QA suite الأثرية.

يبقى QA لقابلية المراقبة مقتصرًا على نسخة المصدر. يحذف أرشيف npm عمدًا
QA Lab، لذلك لا تشغل مسارات إصدار Docker للحزم أوامر `qa`. استخدم
`pnpm qa:otel:smoke` من نسخة مصدر مبنية عند تغيير أدوات
التشخيص.

لمسار اختبار سريع Matrix بنقل حقيقي، شغل:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

توجد مرجعية CLI الكاملة، وفهرس الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط العناصر الأثرية لهذا المسار في [QA لـ Matrix](/ar/concepts/qa-matrix). باختصار: يجهز خادم Tuwunel منزليًا قابلًا للتخلص منه في Docker، ويسجل مستخدمي driver/SUT/observer مؤقتين، ويشغل Plugin Matrix الحقيقي داخل Gateway QA فرعي مضبوط لهذا النقل (دون `qa-channel`)، ثم يكتب تقرير Markdown، وملخص JSON، وعنصر observed-events الأثري، وسجل مخرجات مدمجًا تحت `.artifacts/qa-e2e/matrix-<timestamp>/`.

لمسارات الاختبار السريع Telegram وDiscord وSlack بنقل حقيقي:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

تستهدف قناة حقيقية موجودة مسبقًا مع روبوتين (driver + SUT). متغيرات البيئة المطلوبة، وقوائم السيناريوهات، وعناصر المخرجات الأثرية، ومجموعة بيانات اعتماد Convex موثقة في [مرجع QA لـ Telegram وDiscord وSlack](#telegram-discord-and-slack-qa-reference) أدناه.

لتشغيل VM كامل لسطح مكتب Slack مع إنقاذ VNC، شغل:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر ذلك الأمر جهاز سطح مكتب/متصفح من Crabbox، ويشغل مسار Slack المباشر
داخل VM، ويفتح Slack Web في متصفح VNC، ويلتقط سطح المكتب، وينسخ
`slack-qa/`، و`slack-desktop-smoke.png`، و`slack-desktop-smoke.mp4`
عندما يكون التقاط الفيديو متاحًا، عائدًا إلى دليل عناصر Mantis الأثرية. أعد استخدام `--lease-id <cbx_...>` بعد تسجيل الدخول إلى Slack Web يدويًا
عبر VNC. مع `--gateway-setup`، يترك Mantis Gateway OpenClaw Slack
مستمرًا يعمل داخل VM على المنفذ `38973`؛ وبدونه، يشغل الأمر
مسار QA العادي بين روبوتين في Slack ويخرج بعد التقاط العناصر الأثرية.

لمهمة سطح مكتب بأسلوب الوكيل/CV، شغل:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

يستأجر `visual-task` أو يعيد استخدام جهاز سطح مكتب/متصفح من Crabbox، ويبدأ
`crabbox record --while`، ويقود المتصفح المرئي عبر
`visual-driver` متداخل، ويلتقط `visual-task.png`، ويشغل `openclaw infer image describe`
على لقطة الشاشة عند تحديد `--vision-mode image-describe`، ويكتب
`visual-task.mp4`، و`mantis-visual-task-summary.json`،
و`mantis-visual-task-driver-result.json`، و`mantis-visual-task-report.md`.
عند ضبط `--expect-text`، تطلب مطالبة الرؤية حكم JSON منظمًا
ولا تنجح إلا عندما يبلغ النموذج عن دليل مرئي إيجابي؛ أما
الاستجابة السلبية التي تقتبس النص الهدف فقط فتفشل في التحقق.
استخدم `--vision-mode metadata` لاختبار سريع بلا نموذج يثبت توصيلات سطح المكتب،
والمتصفح، ولقطة الشاشة، والفيديو دون استدعاء مزود فهم صور.
التسجيل عنصر أثري مطلوب لـ `visual-task`؛ إذا لم يسجل Crabbox
أي `visual-task.mp4` غير فارغ، تفشل المهمة حتى إذا نجح مشغل الرؤية.
عند الفشل، يحتفظ Mantis بالإيجار لـ VNC ما لم تكن المهمة قد
نجحت بالفعل ولم يتم ضبط `--keep-lease`.

قبل استخدام بيانات اعتماد مباشرة مجمعة، شغل:

```bash
pnpm openclaw qa credentials doctor
```

يفحص doctor بيئة وسيط Convex، ويتحقق من صحة إعدادات نقطة النهاية، ويتأكد من إمكانية وصول admin/list عندما يكون سر المشرف حاضرًا. يبلغ فقط عن حالة مضبوط/مفقود للأسرار.

## تغطية النقل المباشر

تشترك مسارات النقل المباشر في عقد واحد بدلًا من أن يخترع كل منها شكل قائمة سيناريوهات خاصًا به. `qa-channel` هي مجموعة سلوك المنتج الاصطناعية الواسعة وليست جزءًا من مصفوفة تغطية النقل المباشر.

| المسار     | اختبار Canary | بوابة الإشارات | من بوت إلى بوت | حظر قائمة السماح | رد على المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة السلسلة | عزل السلسلة | مراقبة التفاعلات | أمر المساعدة | تسجيل الأوامر الأصلية |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

يبقي هذا `qa-channel` حزمة سلوك المنتج الواسعة، بينما تشترك Matrix،
Telegram، ووسائل النقل الحية المستقبلية في قائمة تحقق صريحة واحدة لعقد النقل.

لتشغيل مسار Linux VM مؤقت من دون إدخال Docker في مسار QA، شغّل:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

يشغّل هذا ضيف Multipass جديدا، ويثبّت الاعتماديات، ويبني OpenClaw
داخل الضيف، ويشغّل `qa suite`، ثم ينسخ تقرير QA العادي والملخص
مرة أخرى إلى `.artifacts/qa-e2e/...` على المضيف.
ويعيد استخدام سلوك اختيار السيناريو نفسه الذي يستخدمه `qa suite` على المضيف.
تُنفّذ تشغيلات حزمة المضيف وMultipass عدة سيناريوهات محددة بالتوازي
مع عمال Gateway معزولين افتراضيا. يكون الإعداد الافتراضي لـ `qa-channel` هو التزامن
4، مع حد أقصى بعدد السيناريوهات المحددة. استخدم `--concurrency <count>` لضبط
عدد العمال، أو `--concurrency 1` للتنفيذ التسلسلي.
يخرج الأمر برمز غير صفري عندما يفشل أي سيناريو. استخدم `--allow-failures` عندما
تريد الحصول على artifacts من دون رمز خروج فاشل.
تمرر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
مفاتيح المزود المستندة إلى env، ومسار إعدادات مزود QA الحي، و
`CODEX_HOME` عند وجوده. أبقِ `--output-dir` تحت جذر المستودع حتى يتمكن الضيف
من الكتابة مرة أخرى عبر مساحة العمل المثبتة.

## مرجع QA لـ Telegram وDiscord وSlack

لدى Matrix [صفحة مخصصة](/ar/concepts/qa-matrix) بسبب عدد سيناريوهاتها وتوفير خادم homeserver المدعوم بـ Docker. أما Telegram وDiscord وSlack فهي أصغر — بضعة سيناريوهات لكل منها، بلا نظام ملفات تعريف، وتعمل ضد قنوات حقيقية موجودة مسبقا — لذلك يوجد مرجعها هنا.

### أعلام CLI المشتركة

تُسجَّل هذه المسارات عبر `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` وتقبل الأعلام نفسها:

| العلم                                  | الافتراضي                                                         | الوصف                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | شغّل هذا السيناريو فقط. قابل للتكرار.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | المكان الذي تُكتب فيه التقارير/الملخص/الرسائل المرصودة وسجل الخرج. تُحل المسارات النسبية مقابل `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | جذر المستودع عند الاستدعاء من cwd محايد.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | معرّف حساب مؤقت داخل إعدادات QA Gateway.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` أو `live-frontier` (ما زال `live-openai` القديم يعمل).                                                  |
| `--model <ref>` / `--alt-model <ref>` | افتراضي المزود                                                | مراجع النموذج الأساسي/البديل.                                                                                         |
| `--fast`                              | متوقف                                                             | وضع المزود السريع حيث يكون مدعوما.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | راجع [مجمع بيانات اعتماد Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` في CI، وإلا `maintainer`                              | الدور المستخدم عند `--credential-source convex`.                                                                          |

يخرج كل مسار برمز غير صفري عند فشل أي سيناريو. يكتب `--allow-failures` artifacts من دون تعيين رمز خروج فاشل.

### QA لـ Telegram

```bash
pnpm openclaw qa telegram
```

يستهدف مجموعة Telegram خاصة حقيقية واحدة مع بوتين مميزين (driver + SUT). يجب أن يكون لبوت SUT اسم مستخدم في Telegram؛ وتعمل مراقبة من بوت إلى بوت بأفضل شكل عندما يكون لدى كلا البوتين **Bot-to-Bot Communication Mode** مفعّلا في `@BotFather`.

env المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — معرّف دردشة رقمي (سلسلة).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختياري:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` يحتفظ بنصوص الرسائل في artifacts الرسائل المرصودة (يحجبها افتراضيا).

السيناريوهات (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Artifacts الخرج:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — يتضمن RTT لكل رد (إرسال driver → رد SUT المرصود) بدءا من اختبار Canary.
- `telegram-qa-observed-messages.json` — تُحجب النصوص ما لم يكن `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA لـ Discord

```bash
pnpm openclaw qa discord
```

يستهدف قناة guild خاصة حقيقية واحدة في Discord مع بوتين: بوت driver تتحكم فيه العدة، وبوت SUT يبدأه OpenClaw Gateway الابن عبر Plugin Discord المضمن. يتحقق من التعامل مع إشارات القناة، ومن أن بوت SUT سجّل أمر `/help` الأصلي لدى Discord، ومن سيناريوهات أدلة Mantis التي تعمل بالاشتراك.

env المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — يجب أن يطابق معرّف مستخدم بوت SUT الذي يرجعه Discord (وإلا يفشل المسار بسرعة).

اختياري:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` يحتفظ بنصوص الرسائل في artifacts الرسائل المرصودة.

السيناريوهات (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — سيناريو Mantis اختياري. يعمل بمفرده لأنه يبدّل SUT إلى ردود guild دائمة التشغيل ومقتصرة على الأدوات مع `messages.statusReactions.enabled=true`، ثم يلتقط خطا زمنيا للتفاعلات عبر REST بالإضافة إلى artifacts مرئية HTML/PNG. تحتفظ تقارير Mantis قبل/بعد أيضا بـ artifacts MP4 المقدمة من السيناريو باسم `baseline.mp4` و`candidate.mp4`.

شغّل سيناريو تفاعلات الحالة في Mantis صراحة:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artifacts الخرج:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — تُحجب النصوص ما لم يكن `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` و`discord-status-reactions-tool-only-timeline.png` عند تشغيل سيناريو تفاعلات الحالة.

### QA لـ Slack

```bash
pnpm openclaw qa slack
```

يستهدف قناة Slack خاصة حقيقية واحدة مع بوتين مميزين: بوت driver تتحكم فيه العدة، وبوت SUT يبدأه OpenClaw Gateway الابن عبر Plugin Slack المضمن.

env المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختياري:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` يحتفظ بنصوص الرسائل في artifacts الرسائل المرصودة.

السيناريوهات (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artifacts الخرج:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — تُحجب النصوص ما لم يكن `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### إعداد مساحة عمل Slack

يحتاج المسار إلى تطبيقي Slack مميزين في مساحة عمل واحدة، بالإضافة إلى قناة يكون كلا البوتين عضوين فيها:

- `channelId` — معرّف `Cxxxxxxxxxx` لقناة دُعي إليها كلا البوتين. استخدم قناة مخصصة؛ ينشر المسار في كل تشغيل.
- `driverBotToken` — رمز بوت (`xoxb-...`) لتطبيق **Driver**.
- `sutBotToken` — رمز بوت (`xoxb-...`) لتطبيق **SUT**، والذي يجب أن يكون تطبيق Slack منفصلا عن driver حتى يكون معرّف مستخدم البوت الخاص به مميزا.
- `sutAppToken` — رمز على مستوى التطبيق (`xapp-...`) لتطبيق SUT مع `connections:write`، يستخدمه Socket Mode حتى يتمكن تطبيق SUT من تلقي الأحداث.

فضّل مساحة عمل Slack مخصصة لـ QA على إعادة استخدام مساحة عمل إنتاج.

يعكس manifest الخاص بـ SUT أدناه تثبيت الإنتاج الخاص بـ Plugin Slack المضمن (`extensions/slack/src/setup-shared.ts:10`). لإعداد قناة الإنتاج كما يراه المستخدمون، راجع [الإعداد السريع لقناة Slack](/ar/channels/slack#quick-setup)؛ زوج QA Driver/SUT منفصل عمدا لأن المسار يحتاج إلى معرّفي مستخدم بوت مميزين في مساحة عمل واحدة.

**1. إنشاء تطبيق Driver**

انتقل إلى [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → اختر مساحة عمل QA، والصق manifest التالي، ثم _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

انسخ _Bot User OAuth Token_ (`xoxb-...`) — يصبح ذلك `driverBotToken`. يحتاج driver فقط إلى نشر الرسائل وتعريف نفسه؛ بلا أحداث، وبلا Socket Mode.

**2. إنشاء تطبيق SUT**

كرر _Create New App → From a manifest_ في مساحة العمل نفسها. تعكس مجموعة النطاقات تثبيت الإنتاج الخاص بـ Plugin Slack المضمن (`extensions/slack/src/setup-shared.ts:10`):

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

بعد أن ينشئ Slack التطبيق، افعل أمرين في صفحة إعداداته:

- _التثبيت في مساحة العمل_ → انسخ _رمز OAuth لمستخدم الروبوت_ → يصبح ذلك `sutBotToken`.
- _المعلومات الأساسية → الرموز على مستوى التطبيق → إنشاء رمز ونطاقات_ → أضف النطاق `connections:write` → احفظ → انسخ القيمة `xapp-...` → يصبح ذلك `sutAppToken`.

تحقق من أن الروبوتين لهما معرّفا مستخدمين مختلفان عبر استدعاء `auth.test` على كل رمز. يميز وقت التشغيل بين المشغّل وSUT حسب معرّف المستخدم؛ إعادة استخدام تطبيق واحد لكليهما ستفشل حجب الإشارات فورًا.

**3. إنشاء القناة**

في مساحة عمل QA، أنشئ قناة (مثل `#openclaw-qa`) وادعُ كلا الروبوتين من داخل القناة:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

انسخ معرّف `Cxxxxxxxxxx` من _معلومات القناة → حول → معرّف القناة_ — يصبح ذلك `channelId`. تعمل القناة العامة؛ إذا استخدمت قناة خاصة، فإن كلا التطبيقين يملكان مسبقًا `groups:history` لذا ستظل قراءات سجل الحزمة ناجحة.

**4. تسجيل بيانات الاعتماد**

هناك خياران. استخدم متغيرات البيئة لتصحيح الأخطاء على جهاز واحد (اضبط المتغيرات الأربعة `OPENCLAW_QA_SLACK_*` ومرر `--credential-source env`)، أو ازرع مجمع Convex المشترك حتى تتمكن CI والمشرفون الآخرون من استئجارها.

بالنسبة إلى مجمع Convex، اكتب الحقول الأربعة في ملف JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

مع تصدير `OPENCLAW_QA_CONVEX_SITE_URL` و`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` في الصدفة، سجّل وتحقق:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

توقع `count: 1`، و`status: "active"`، ومن دون حقل `lease`.

**5. التحقق من البداية إلى النهاية**

شغّل المسار محليًا لتأكيد أن كلا الروبوتين يستطيعان التحدث إلى بعضهما عبر الوسيط:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

يكتمل التشغيل الأخضر في أقل بكثير من 30 ثانية، ويُظهر `slack-qa-report.md` كلًا من `slack-canary` و`slack-mention-gating` بحالة `pass`. إذا علِق المسار نحو 90 ثانية وخرج بالرسالة `Convex credential pool exhausted for kind "slack"`، فإما أن المجمع فارغ أو أن كل صف مستأجر — سيخبرك `qa credentials list --kind slack --status all --json` بأي الحالتين.

### مجمع بيانات اعتماد Convex

يمكن لمسارات Telegram وDiscord وSlack استئجار بيانات الاعتماد من مجمع Convex مشترك بدلًا من قراءة متغيرات البيئة أعلاه. مرر `--credential-source convex` (أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)؛ يكتسب QA Lab استئجارًا حصريًا، ويرسل له Heartbeat طوال مدة التشغيل، ويطلقه عند إيقاف التشغيل. أنواع المجمع هي `"telegram"` و`"discord"` و`"slack"`.

أشكال الحمولة التي يتحقق منها الوسيط عند `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — يجب أن يكون `groupId` سلسلة معرّف دردشة رقمية.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — يجب أن يطابق `channelId` النمط `^[A-Z][A-Z0-9]+$` (معرّف Slack مثل `Cxxxxxxxxxx`). راجع [إعداد مساحة عمل Slack](#setting-up-the-slack-workspace) لتوفير التطبيق والنطاقات.

توجد متغيرات البيئة التشغيلية وعقدة نقطة نهاية وسيط Convex في [الاختبار → بيانات اعتماد Telegram المشتركة عبر Convex](/ar/help/testing#shared-telegram-credentials-via-convex-v1) (اسم القسم يسبق دعم Discord؛ دلالات الوسيط متطابقة لكلا النوعين).

## البذور المدعومة من المستودع

توجد أصول البذور في `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

هذه موجودة عمدًا في git حتى تكون خطة QA مرئية لكل من البشر والوكيل.

يجب أن يبقى `qa-lab` مشغّل Markdown عامًا. يجب أن يكون كل ملف Markdown للسيناريو مصدر الحقيقة لتشغيل اختبار واحد، وأن يعرّف:

- بيانات تعريف السيناريو
- بيانات تعريف اختيارية للفئة، والقدرة، والمسار، والمخاطر
- مراجع المستندات والكود
- متطلبات Plugin اختيارية
- رقعة اختيارية لإعداد Gateway
- `qa-flow` القابل للتنفيذ

يُسمح لسطح وقت التشغيل القابل لإعادة الاستخدام الذي يدعم `qa-flow` بأن يبقى عامًا وعابرًا للوظائف. على سبيل المثال، يمكن لسيناريوهات Markdown دمج مساعدين من جهة النقل مع مساعدين من جهة المتصفح يقودون Control UI المضمّن عبر وصلة Gateway `browser.request` من دون إضافة مشغّل حالة خاصة.

يجب تجميع ملفات السيناريو حسب قدرة المنتج بدلًا من مجلد شجرة المصدر. أبقِ معرّفات السيناريوهات مستقرة عند نقل الملفات؛ استخدم `docsRefs` و`codeRefs` لقابلية تتبع التنفيذ.

يجب أن تبقى القائمة الأساسية واسعة بما يكفي لتغطية:

- دردشة الرسائل المباشرة والقنوات
- سلوك السلاسل
- دورة حياة إجراء الرسائل
- استدعاءات cron الراجعة
- استدعاء الذاكرة
- تبديل النماذج
- تسليم الوكيل الفرعي
- قراءة المستودع وقراءة المستندات
- مهمة بناء صغيرة واحدة مثل Lobster Invaders

## مسارات محاكاة المزوّد

يحتوي `qa suite` على مسارين محليين لمحاكاة المزوّد:

- `mock-openai` هو محاكي OpenClaw المدرك للسيناريوهات. يظل مسار المحاكاة الحتمي الافتراضي لـ QA المدعومة من المستودع وبوابات التكافؤ.
- يبدأ `aimock` خادم مزوّد مدعومًا بـ AIMock لتغطية تجريبية للبروتوكول، والتجهيزات، والتسجيل/إعادة التشغيل، والفوضى. إنه إضافي ولا يستبدل موزّع سيناريوهات `mock-openai`.

يوجد تنفيذ مسار المزوّد تحت `extensions/qa-lab/src/providers/`. يملك كل مزوّد افتراضاته، وبدء تشغيل الخادم المحلي، وإعداد نموذج Gateway، واحتياجات تجهيز ملف تعريف المصادقة، وأعلام قدرات التشغيل الحي/المحاكي. يجب أن يمر كود الحزمة وGateway المشترك عبر سجل المزوّدين بدلًا من التفريع على أسماء المزوّدين.

## محولات النقل

يملك `qa-lab` وصلة نقل عامة لسيناريوهات QA في Markdown. `qa-channel` هو أول محول على تلك الوصلة، لكن هدف التصميم أوسع: يجب أن توصل القنوات الحقيقية أو الاصطناعية المستقبلية بالمشغّل نفسه للحزمة بدلًا من إضافة مشغّل QA خاص بالنقل.

على مستوى البنية، يكون التقسيم كالتالي:

- يملك `qa-lab` تنفيذ السيناريو العام، وتزامن العمال، وكتابة المصنوعات، والتقارير.
- يملك محول النقل إعداد Gateway، والجاهزية، ومراقبة الوارد والصادر، وإجراءات النقل، وحالة النقل المعيارية.
- تعرّف ملفات سيناريو Markdown تحت `qa/scenarios/` تشغيل الاختبار؛ ويوفر `qa-lab` سطح وقت التشغيل القابل لإعادة الاستخدام الذي ينفذها.

### إضافة قناة

تتطلب إضافة قناة إلى نظام QA في Markdown شيئين بالضبط:

1. محول نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تضف جذر أمر QA جديدًا على المستوى الأعلى عندما يستطيع مضيف `qa-lab` المشترك امتلاك التدفق.

يملك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء تشغيل الحزمة وإيقافها
- تزامن العمال
- كتابة المصنوعات
- إنشاء التقرير
- تنفيذ السيناريو
- أسماء توافقية مستعارة لسيناريوهات `qa-channel` الأقدم

تملك Plugins المشغّل عقد النقل:

- كيفية تركيب `openclaw qa <runner>` أسفل جذر `qa` المشترك
- كيفية إعداد Gateway لذلك النقل
- كيفية فحص الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية مراقبة الرسائل الصادرة
- كيفية كشف النسخ النصية وحالة النقل المعيارية
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة الضبط أو التنظيف الخاصين بالنقل

الحد الأدنى لاعتماد قناة جديدة:

1. أبقِ `qa-lab` مالكًا لجذر `qa` المشترك.
2. نفّذ مشغّل النقل على وصلة مضيف `qa-lab` المشتركة.
3. أبقِ آليات النقل الخاصة داخل Plugin المشغّل أو حزمة القناة.
4. ركّب المشغّل كـ `openclaw qa <runner>` بدلًا من تسجيل أمر جذري منافس. يجب أن تصرّح Plugins المشغّل عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`. أبقِ `runtime-api.ts` خفيفًا؛ يجب أن يظل CLI الكسول وتنفيذ المشغّل خلف نقاط دخول منفصلة.
5. ألّف أو كيّف سيناريوهات Markdown تحت أدلة `qa/scenarios/` ذات السمات.
6. استخدم مساعدي السيناريو العامة للسيناريوهات الجديدة.
7. أبقِ أسماء التوافق المستعارة الحالية عاملة ما لم يكن المستودع ينفذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا أمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحد، فأبقِه في Plugin ذلك المشغّل أو حزمة Plugin.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن لأكثر من قناة واحدة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة في `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بالنقل واجعل ذلك صريحًا في عقد السيناريو.

### أسماء مساعدي السيناريو

المساعدون العامون المفضلون للسيناريوهات الجديدة:

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

تبقى أسماء التوافق المستعارة متاحة للسيناريوهات الحالية — `waitForQaChannelReady` و`waitForOutboundMessage` و`waitForNoOutbound` و`formatConversationTranscript` و`resetBus` — لكن يجب أن يستخدم تأليف السيناريوهات الجديدة الأسماء العامة. توجد الأسماء المستعارة لتجنب ترحيل شامل دفعة واحدة، لا بوصفها النموذج المستقبلي.

## التقارير

يصدّر `qa-lab` تقرير بروتوكول Markdown من الخط الزمني للناقل المرصود.
يجب أن يجيب التقرير عن:

- ما الذي نجح
- ما الذي فشل
- ما الذي بقي محظورًا
- ما سيناريوهات المتابعة الجديرة بالإضافة

لجرد السيناريوهات المتاحة — وهو مفيد عند تقدير حجم عمل المتابعة أو توصيل نقل جديد — شغّل `pnpm openclaw qa coverage` (أضف `--json` لإخراج قابل للقراءة آليًا).

لفحوص الأحرف والأسلوب، شغّل السيناريو نفسه عبر عدة مراجع نماذج حية واكتب تقرير Markdown محكّمًا:

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

يشغّل الأمر عمليات فرعية محلية لـ QA Gateway، وليس Docker. يجب أن تضبط سيناريوهات
تقييم الشخصية الهوية عبر `SOUL.md`، ثم تشغّل أدوار مستخدم عادية مثل الدردشة،
والمساعدة في مساحة العمل، ومهام الملفات الصغيرة. يجب ألا يُبلّغ النموذج المرشح
بأنه قيد التقييم. يحافظ الأمر على كل نص حوار كامل، ويسجل إحصاءات تشغيل أساسية،
ثم يطلب من نماذج التحكيم في الوضع السريع مع استدلال `xhigh` حيث يكون مدعوما
ترتيب عمليات التشغيل حسب الطبيعية، والطابع العام، والفكاهة.
استخدم `--blind-judge-models` عند مقارنة المزوّدين: لا تزال مطالبة التحكيم تحصل
على كل نص حوار وحالة تشغيل، لكن مراجع المرشحين تُستبدل بتسميات محايدة مثل
`candidate-01`؛ ويربط التقرير التصنيفات مرة أخرى بالمراجع الحقيقية بعد التحليل.
تستخدم عمليات تشغيل المرشحين افتراضيا مستوى تفكير `high`، مع `medium` لـ GPT-5.5 و`xhigh`
لمراجع تقييم OpenAI الأقدم التي تدعمه. تجاوز مرشحا محددا ضمن السطر باستخدام
`--model provider/model,thinking=<level>`. لا يزال `--thinking <level>` يضبط
احتياطيا عالميا، ويُحتفظ بالصيغة الأقدم `--model-thinking <provider/model=level>`
للتوافق.
تستخدم مراجع مرشحي OpenAI الوضع السريع افتراضيا بحيث تُستخدم المعالجة ذات الأولوية
حيث يدعمها المزوّد. أضف `,fast` أو `,no-fast` أو `,fast=false` ضمن السطر عندما
يحتاج مرشح واحد أو محكّم واحد إلى تجاوز. مرّر `--fast` فقط عندما تريد فرض الوضع
السريع على كل نموذج مرشح. تُسجل مدد المرشحين والمحكّمين في التقرير لتحليل
المعايير المرجعية، لكن مطالبات التحكيم تنص صراحة على عدم الترتيب حسب السرعة.
تستخدم عمليات تشغيل نماذج المرشحين والمحكّمين افتراضيا تزامنا قدره 16. خفّض
`--concurrency` أو `--judge-concurrency` عندما تجعل حدود المزوّد أو الضغط على
Gateway المحلي التشغيل كثير الضجيج.
عند عدم تمرير أي مرشح `--model`، يستخدم تقييم الشخصية افتراضيا
`openai/gpt-5.5` و`openai/gpt-5.2` و`openai/gpt-5` و`anthropic/claude-opus-4-6`
و`anthropic/claude-sonnet-4-6` و`zai/glm-5.1`
و`moonshot/kimi-k2.5` و
`google/gemini-3.1-pro-preview` عندما لا يُمرر أي `--model`.
عند عدم تمرير `--judge-model`، يستخدم المحكّمون افتراضيا
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high`.

## مستندات ذات صلة

- [Matrix QA](/ar/concepts/qa-matrix)
- [قناة QA](/ar/channels/qa-channel)
- [الاختبار](/ar/help/testing)
- [لوحة التحكم](/ar/web/dashboard)
