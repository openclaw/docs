---
read_when:
    - فهم كيفية ترابط مكدس ضمان الجودة
    - توسيع qa-lab أو qa-channel أو محوّل نقل
    - إضافة سيناريوهات ضمان الجودة المدعومة بالمستودع
    - بناء أتمتة ضمان جودة أكثر واقعية حول لوحة تحكم Gateway
summary: 'نظرة عامة على مكدس ضمان الجودة: qa-lab وqa-channel والسيناريوهات المدعومة بالمستودع ومسارات النقل الحية ومحولات النقل وإعداد التقارير.'
title: نظرة عامة على ضمان الجودة
x-i18n:
    generated_at: "2026-05-05T01:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

الغرض من حزمة QA الخاصة هو اختبار OpenClaw بطريقة أكثر واقعية
ومشكّلة على هيئة القنوات مما يمكن لاختبار وحدة واحد أن يفعله.

الأجزاء الحالية:

- `extensions/qa-channel`: قناة رسائل اصطناعية بأسطح الرسائل المباشرة والقنوات والسلاسل
  والتفاعلات والتعديل والحذف.
- `extensions/qa-lab`: واجهة مصحح الأخطاء وناقل QA لمراقبة النص التفريغي،
  وحقن الرسائل الواردة، وتصدير تقرير Markdown.
- `extensions/qa-matrix`، وPlugins التشغيل المستقبلية: محولات نقل حية
  تقود قناة حقيقية داخل Gateway فرعي لـ QA.
- `qa/`: أصول بداية مدعومة بالمستودع لمهمة الانطلاق وسيناريوهات QA
  الأساسية.
- [Mantis](/ar/concepts/mantis): تحقق حي قبل وبعد للأخطاء التي
  تحتاج إلى عمليات نقل حقيقية، ولقطات شاشة للمتصفح، وحالة VM، وأدلة PR.

## سطح الأوامر

يعمل كل تدفق QA ضمن `pnpm openclaw qa <subcommand>`. لدى كثير منها أسماء مستعارة كسكربتات `pnpm qa:*`؛ كلا الشكلين مدعومان.

| الأمر                                             | الغرض                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | فحص ذاتي مضمّن لـ QA؛ يكتب تقرير Markdown.                                                                                                                                             |
| `qa suite`                                          | تشغيل السيناريوهات المدعومة بالمستودع مقابل مسار Gateway الخاص بـ QA. الأسماء المستعارة: `pnpm openclaw qa suite --runner multipass` من أجل VM Linux قابلة للتخلص منها.                                                       |
| `qa coverage`                                       | طباعة مخزون تغطية السيناريوهات بصيغة markdown (`--json` لمخرجات الآلة).                                                                                                                |
| `qa parity-report`                                  | مقارنة ملفين `qa-suite-summary.json` وكتابة تقرير التكافؤ الوكيل.                                                                                                               |
| `qa character-eval`                                 | تشغيل سيناريو QA للشخصية عبر عدة نماذج حية مع تقرير مُحكّم. راجع [التقارير](#reporting).                                                                                 |
| `qa manual`                                         | تشغيل مطالبة لمرة واحدة مقابل مسار الموفر/النموذج المحدد.                                                                                                                               |
| `qa ui`                                             | بدء واجهة مصحح QA وناقل QA المحلي (الاسم المستعار: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | بناء صورة Docker المجهزة مسبقًا لـ QA.                                                                                                                                                          |
| `qa docker-scaffold`                                | كتابة هيكل docker-compose للوحة معلومات QA + مسار Gateway.                                                                                                                         |
| `qa up`                                             | بناء موقع QA، وبدء الحزمة المدعومة بـ Docker، وطباعة URL (الاسم المستعار: `pnpm qa:lab:up`؛ يضيف متغير `:fast` الخيار `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | بدء خادم موفر AIMock فقط.                                                                                                                                                       |
| `qa mock-openai`                                    | بدء خادم موفر `mock-openai` الواعي بالسيناريو فقط.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | إدارة مخزون بيانات اعتماد Convex المشتركة.                                                                                                                                                    |
| `qa matrix`                                         | مسار نقل حي مقابل خادم Tuwunel homeserver قابل للتخلص منه. راجع [Matrix QA](/ar/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | مسار نقل حي مقابل مجموعة Telegram خاصة حقيقية.                                                                                                                                   |
| `qa discord`                                        | مسار نقل حي مقابل قناة Guild خاصة حقيقية في Discord.                                                                                                                            |
| `qa slack`                                          | مسار نقل حي مقابل قناة Slack خاصة حقيقية.                                                                                                                                    |
| `qa mantis`                                         | مشغل تحقق قبل وبعد لأخطاء النقل الحي، مع أدلة تفاعلات حالة Discord، واختبار سطح المكتب/المتصفح السريع في Crabbox، واختبار Slack داخل VNC. راجع [Mantis](/ar/concepts/mantis). |

## تدفق المشغل

تدفق مشغل QA الحالي هو موقع QA بلوحتين:

- اليسار: لوحة معلومات Gateway (واجهة التحكم) مع الوكيل.
- اليمين: QA Lab، يعرض النص التفريغي المشابه لـ Slack وخطة السيناريو.

شغّله باستخدام:

```bash
pnpm qa:lab:up
```

يبني ذلك موقع QA، ويبدأ مسار Gateway المدعوم بـ Docker، ويعرض
صفحة QA Lab حيث يمكن لمشغل أو حلقة أتمتة إعطاء الوكيل مهمة QA،
ومراقبة سلوك القناة الحقيقي، وتسجيل ما نجح أو فشل أو
بقي محظورًا.

لتكرار أسرع على واجهة QA Lab محليًا دون إعادة بناء صورة Docker في كل مرة،
ابدأ الحزمة بحزمة QA Lab مركبة بالربط:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

يبقي `qa:lab:up:fast` خدمات Docker على صورة مبنية مسبقًا ويركب بالربط
`extensions/qa-lab/web/dist` داخل حاوية `qa-lab`. يعيد `qa:lab:watch`
بناء تلك الحزمة عند التغيير، ويعيد المتصفح التحميل تلقائيًا عندما يتغير
تجزئة أصل QA Lab.

لاختبار سريع محلي لتتبّع OpenTelemetry، شغّل:

```bash
pnpm qa:otel:smoke
```

يبدأ ذلك السكربت مستقبل تتبّع OTLP/HTTP محليًا، ويشغّل سيناريو QA
`otel-trace-smoke` مع تفعيل Plugin `diagnostics-otel`، ثم
يفك ترميز مقاطع protobuf المصدّرة ويتحقق من الشكل الحرج للإصدار:
يجب أن تكون `openclaw.run` و`openclaw.harness.run` و`openclaw.model.call`
و`openclaw.context.assembled` و`openclaw.message.delivery` موجودة؛
يجب ألا تصدّر استدعاءات النموذج `StreamAbandoned` في الأدوار الناجحة؛ ويجب أن تبقى معرّفات التشخيص الخام
وسمات `openclaw.content.*` خارج التتبع. يكتب
`otel-smoke-summary.json` بجانب آثار حزمة QA.

يبقى QA الخاص بقابلية المراقبة مقتصرًا على سحب المصدر فقط. حزمة npm tarball تحذف
QA Lab عمدًا، لذلك لا تشغّل مسارات إصدار Docker للحزم أوامر `qa`. استخدم
`pnpm qa:otel:smoke` من نسخة مصدر مبنية عند تغيير تجهيزات التشخيص.

لمسار اختبار سريع Matrix بنقل حقيقي، شغّل:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع CLI الكامل، وفهرس الملفات الشخصية/السيناريوهات، ومتغيرات env، وتخطيط الآثار لهذا المسار موجودة في [Matrix QA](/ar/concepts/qa-matrix). باختصار: يوفّر خادم Tuwunel homeserver قابلًا للتخلص منه في Docker، ويسجل مستخدمي driver/SUT/observer مؤقتين، ويشغّل Plugin Matrix الحقيقي داخل Gateway QA فرعي محدود بذلك النقل (بدون `qa-channel`)، ثم يكتب تقرير Markdown، وملخص JSON، وأثر الأحداث المرصودة، وسجل مخرجات مدمجًا تحت `.artifacts/qa-e2e/matrix-<timestamp>/`.

لمسارات اختبار سريع بنقل حقيقي لـ Telegram وDiscord وSlack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

تستهدف هذه قناة حقيقية موجودة مسبقًا مع روبوتين (driver + SUT). متغيرات env المطلوبة، وقوائم السيناريوهات، وآثار المخرجات، ومخزون بيانات اعتماد Convex موثقة في [مرجع QA لـ Telegram وDiscord وSlack](#telegram-discord-and-slack-qa-reference) أدناه.

لتشغيل VM سطح مكتب كامل لـ Slack مع إنقاذ VNC، شغّل:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر ذلك الأمر جهاز سطح مكتب/متصفح Crabbox، ويشغّل مسار Slack الحي
داخل VM، ويفتح Slack Web في متصفح VNC، ويلتقط سطح المكتب، وينسخ
`slack-qa/` إضافة إلى `slack-desktop-smoke.png` إلى دليل آثار Mantis.
أعد استخدام `--lease-id <cbx_...>` بعد تسجيل الدخول إلى Slack Web يدويًا
عبر VNC. مع `--gateway-setup`، يترك Mantis Gateway Slack دائمًا لـ OpenClaw
قيد التشغيل داخل VM على المنفذ `38973`؛ وبدونه، يشغّل الأمر
مسار QA العادي من روبوت إلى روبوت في Slack ثم يخرج بعد التقاط الآثار.

قبل استخدام بيانات اعتماد حية مجمعة، شغّل:

```bash
pnpm openclaw qa credentials doctor
```

يفحص doctor بيئة وسيط Convex، ويتحقق من إعدادات نقطة النهاية، ويتحقق من إمكانية وصول admin/list عند وجود سر المشرف. لا يبلغ إلا عن حالة معيّن/مفقود للأسرار.

## تغطية النقل الحي

تشترك مسارات النقل الحي في عقد واحد بدلًا من أن يخترع كل منها شكل قائمة سيناريوهات خاصًا به. `qa-channel` هي حزمة سلوك المنتج الاصطناعية الواسعة وليست جزءًا من مصفوفة تغطية النقل الحي.

| المسار     | Canary | حجب الإشارة | روبوت إلى روبوت | حظر قائمة السماح | رد من المستوى الأعلى | استئناف إعادة التشغيل | متابعة السلسلة | عزل السلسلة | مراقبة التفاعلات | أمر المساعدة | تسجيل الأوامر الأصلية |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

يبقي هذا `qa-channel` بوصفها حزمة سلوك المنتج الواسعة بينما تشترك Matrix
وTelegram ووسائط النقل الحية المستقبلية في قائمة تحقق صريحة واحدة
لعقد النقل.

لمسار VM Linux قابل للتخلص منه دون إدخال Docker في مسار QA، شغّل:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

يُشغّل هذا ضيف Multipass جديدًا، ويثبّت التبعيات، ويبني OpenClaw
داخل الضيف، ويشغّل `qa suite`، ثم ينسخ تقرير QA العادي
والملخص مرة أخرى إلى `.artifacts/qa-e2e/...` على المضيف.
ويعيد استخدام سلوك اختيار السيناريو نفسه مثل `qa suite` على المضيف.
تُنفّذ تشغيلات مجموعة المضيف وMultipass عدة سيناريوهات محددة بالتوازي
مع عمال Gateway معزولين افتراضيًا. يضبط `qa-channel` التزامن افتراضيًا على
4، مع تقييده بعدد السيناريوهات المحددة. استخدم `--concurrency <count>` لضبط
عدد العمال، أو `--concurrency 1` للتنفيذ التسلسلي.
يخرج الأمر برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
تريد القطع الأثرية دون رمز خروج فاشل.
تُمرّر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية بالنسبة إلى
الضيف: مفاتيح المزوّد المستندة إلى البيئة، ومسار إعداد مزوّد QA الحي، و
`CODEX_HOME` عند وجوده. أبقِ `--output-dir` ضمن جذر المستودع حتى يتمكن الضيف
من الكتابة مرة أخرى عبر مساحة العمل المثبتة.

## مرجع QA لـ Telegram وDiscord وSlack

لدى Matrix [صفحة مخصصة](/ar/concepts/qa-matrix) بسبب عدد سيناريوهاته وتوفير homeserver مدعوم بـ Docker. أما Telegram وDiscord وSlack فهي أصغر — حفنة من السيناريوهات لكل منها، دون نظام ملفات تعريف، وعلى قنوات حقيقية موجودة مسبقًا — لذلك يوجد مرجعها هنا.

### أعلام CLI المشتركة

تُسجَّل هذه المسارات عبر `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` وتقبل الأعلام نفسها:

| العلم                                  | الافتراضي                                                         | الوصف                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | شغّل هذا السيناريو فقط. قابل للتكرار.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | المكان الذي تُكتب فيه التقارير/الملخص/الرسائل المرصودة وسجل الخرج. تُحلّ المسارات النسبية مقابل `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | جذر المستودع عند الاستدعاء من cwd محايد.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | معرّف حساب مؤقت داخل إعداد Gateway الخاص بـ QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` أو `live-frontier` (ما زال `live-openai` القديم يعمل).                                                  |
| `--model <ref>` / `--alt-model <ref>` | افتراضي المزوّد                                                | مراجع النموذج الأساسي/البديل.                                                                                         |
| `--fast`                              | متوقف                                                             | وضع المزوّد السريع حيثما يكون مدعومًا.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | راجع [مجموعة بيانات اعتماد Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` في CI، و`maintainer` بخلاف ذلك                              | الدور المستخدم عند `--credential-source convex`.                                                                          |

يخرج كل مسار برمز غير صفري عند فشل أي سيناريو. يكتب `--allow-failures` القطع الأثرية دون تعيين رمز خروج فاشل.

### QA لـ Telegram

```bash
pnpm openclaw qa telegram
```

يستهدف مجموعة Telegram خاصة وحقيقية واحدة مع بوتين متميزين (السائق + SUT). يجب أن يكون لبوت SUT اسم مستخدم Telegram؛ وتعمل الملاحظة بين بوت وبوت بأفضل صورة عندما يكون لدى كلا البوتين **Bot-to-Bot Communication Mode** مفعّلًا في `@BotFather`.

البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — معرّف دردشة رقمي (سلسلة نصية).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختياري:

- يُبقي `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` نصوص الرسائل في قطع الرسائل المرصودة الأثرية (الإعداد الافتراضي يحجبها).

السيناريوهات (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

قطع الخرج الأثرية:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — يتضمن RTT لكل رد (إرسال السائق → رد SUT المرصود) بدءًا من canary.
- `telegram-qa-observed-messages.json` — تُحجب النصوص ما لم يكن `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA لـ Discord

```bash
pnpm openclaw qa discord
```

يستهدف قناة Discord guild خاصة وحقيقية واحدة مع بوتين: بوت سائق تتحكم به الحزمة، وبوت SUT يبدأه Gateway الفرعي لـ OpenClaw عبر Plugin Discord المضمّن. يتحقق من التعامل مع إشارات القناة، ومن أن بوت SUT سجّل أمر `/help` الأصلي مع Discord، ومن سيناريوهات أدلة Mantis الاختيارية.

البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — يجب أن يطابق معرّف مستخدم بوت SUT الذي يعيده Discord (وإلا يفشل المسار بسرعة).

اختياري:

- يُبقي `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` نصوص الرسائل في قطع الرسائل المرصودة الأثرية.

السيناريوهات (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — سيناريو Mantis اختياري. يعمل بمفرده لأنه يبدّل SUT إلى ردود guild دائمة التشغيل ومقتصرة على الأدوات مع `messages.statusReactions.enabled=true`، ثم يلتقط مخططًا زمنيًا لتفاعلات REST إضافة إلى قطعة مرئية HTML/PNG.

شغّل سيناريو تفاعلات الحالة في Mantis صراحةً:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

قطع الخرج الأثرية:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — تُحجب النصوص ما لم يكن `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` و`discord-status-reactions-tool-only-timeline.png` عند تشغيل سيناريو تفاعلات الحالة.

### QA لـ Slack

```bash
pnpm openclaw qa slack
```

يستهدف قناة Slack خاصة وحقيقية واحدة مع بوتين متميزين: بوت سائق تتحكم به الحزمة، وبوت SUT يبدأه Gateway الفرعي لـ OpenClaw عبر Plugin Slack المضمّن.

البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختياري:

- يُبقي `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` نصوص الرسائل في قطع الرسائل المرصودة الأثرية.

السيناريوهات (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

قطع الخرج الأثرية:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — تُحجب النصوص ما لم يكن `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### إعداد مساحة عمل Slack

يحتاج المسار إلى تطبيقي Slack متميزين في مساحة عمل واحدة، إضافة إلى قناة يكون كلا البوتين عضوين فيها:

- `channelId` — معرّف `Cxxxxxxxxxx` لقناة دُعي إليها كلا البوتين. استخدم قناة مخصصة؛ ينشر المسار في كل تشغيل.
- `driverBotToken` — رمز البوت (`xoxb-...`) لتطبيق **Driver**.
- `sutBotToken` — رمز البوت (`xoxb-...`) لتطبيق **SUT**، والذي يجب أن يكون تطبيق Slack منفصلًا عن السائق حتى يكون معرّف مستخدم البوت الخاص به متميزًا.
- `sutAppToken` — رمز على مستوى التطبيق (`xapp-...`) لتطبيق SUT مع `connections:write`، يُستخدم بواسطة Socket Mode حتى يتمكن تطبيق SUT من تلقي الأحداث.

فضّل مساحة عمل Slack مخصصة لـ QA بدلًا من إعادة استخدام مساحة عمل إنتاج.

يعكس بيان SUT أدناه تثبيت الإنتاج الخاص بـ Plugin Slack المضمّن (`extensions/slack/src/setup-shared.ts:10`). لإعداد قناة الإنتاج كما يراها المستخدمون، راجع [إعداد قناة Slack السريع](/ar/channels/slack#quick-setup)؛ يكون زوج QA Driver/SUT منفصلًا عمدًا لأن المسار يحتاج إلى معرّفي مستخدم بوت متميزين في مساحة عمل واحدة.

**1. أنشئ تطبيق Driver**

انتقل إلى [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → اختر مساحة عمل QA، والصق البيان التالي، ثم _Install to Workspace_:

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

انسخ _Bot User OAuth Token_ (`xoxb-...`) — يصبح ذلك `driverBotToken`. يحتاج السائق فقط إلى نشر الرسائل والتعريف بنفسه؛ لا أحداث، ولا Socket Mode.

**2. أنشئ تطبيق SUT**

كرر _Create New App → From a manifest_ في مساحة العمل نفسها. تعكس مجموعة النطاقات تثبيت الإنتاج الخاص بـ Plugin Slack المضمّن (`extensions/slack/src/setup-shared.ts:10`):

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

بعد أن ينشئ Slack التطبيق، افعل شيئين في صفحة إعداداته:

- _Install to Workspace_ → انسخ _Bot User OAuth Token_ → يصبح ذلك `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → أضف النطاق `connections:write` → احفظ → انسخ قيمة `xapp-...` → تصبح تلك `sutAppToken`.

تحقق من أن الروبوتين لهما معرّفا مستخدمين مختلفان عبر استدعاء `auth.test` على كل رمز. يميّز وقت التشغيل بين المشغّل وSUT عبر معرّف المستخدم؛ إعادة استخدام تطبيق واحد لكليهما ستفشل بوابة الإشارات فورًا.

**3. إنشاء القناة**

في مساحة عمل QA، أنشئ قناة (مثل `#openclaw-qa`) وادعُ الروبوتين كليهما من داخل القناة:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

انسخ المعرّف `Cxxxxxxxxxx` من _معلومات القناة → حول → معرّف القناة_ — وسيصبح ذلك `channelId`. تصلح القناة العامة؛ وإذا استخدمت قناة خاصة، فإن كلا التطبيقين لديهما بالفعل `groups:history` لذلك ستظل قراءات السجل في الحاضنة ناجحة.

**4. تسجيل بيانات الاعتماد**

خياران. استخدم متغيرات البيئة للتنقيح على جهاز واحد (اضبط متغيرات `OPENCLAW_QA_SLACK_*` الأربعة ومرّر `--credential-source env`)، أو جهّز مخزون Convex المشترك حتى يتمكن CI والمشرفون الآخرون من استئجارها.

بالنسبة إلى مخزون Convex، اكتب الحقول الأربعة في ملف JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

بعد تصدير `OPENCLAW_QA_CONVEX_SITE_URL` و`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` في الصدفة لديك، سجّل وتحقق:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

توقع `count: 1`، و`status: "active"`، ومن دون حقل `lease`.

**5. التحقق من البداية إلى النهاية**

شغّل المسار محليًا للتأكد من أن الروبوتين يستطيعان التحدث إلى بعضهما عبر الوسيط:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

يكتمل التشغيل الناجح في أقل بكثير من 30 ثانية، ويعرض `slack-qa-report.md` كلًا من `slack-canary` و`slack-mention-gating` بالحالة `pass`. إذا علّق المسار لمدة تقارب 90 ثانية وخرج برسالة `Convex credential pool exhausted for kind "slack"`، فإما أن المخزون فارغ أو أن كل الصفوف مستأجرة — سيخبرك `qa credentials list --kind slack --status all --json` بأي الحالتين.

### مخزون بيانات اعتماد Convex

يمكن لمسارات Telegram وDiscord وSlack استئجار بيانات الاعتماد من مخزون Convex مشترك بدلًا من قراءة متغيرات البيئة أعلاه. مرّر `--credential-source convex` (أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)؛ يحصل QA Lab على إيجار حصري، ويرسل Heartbeat له طوال مدة التشغيل، ويحرره عند إيقاف التشغيل. أنواع المخزون هي `"telegram"` و`"discord"` و`"slack"`.

أشكال الحمولة التي يتحقق منها الوسيط على `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — يجب أن يكون `groupId` سلسلة معرّف دردشة رقمية.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — يجب أن يطابق `channelId` النمط `^[A-Z][A-Z0-9]+$` (معرّف Slack مثل `Cxxxxxxxxxx`). راجع [إعداد مساحة عمل Slack](#setting-up-the-slack-workspace) لتجهيز التطبيق والنطاقات.

توجد متغيرات البيئة التشغيلية وعقدة نقطة نهاية وسيط Convex في [الاختبار → بيانات اعتماد Telegram مشتركة عبر Convex](/ar/help/testing#shared-telegram-credentials-via-convex-v1) (اسم القسم يسبق دعم Discord؛ دلالات الوسيط متطابقة لكلا النوعين).

## بذور مدعومة من المستودع

توجد أصول البذور في `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

وهي موجودة عمدًا في git حتى تكون خطة QA مرئية لكل من البشر والوكيل.

ينبغي أن يظل `qa-lab` مشغّل Markdown عامًا. كل ملف سيناريو Markdown هو مصدر الحقيقة لتشغيل اختبار واحد، وينبغي أن يعرّف:

- بيانات وصفية للسيناريو
- بيانات وصفية اختيارية للفئة، والقدرة، والمسار، والمخاطر
- مراجع المستندات والكود
- متطلبات Plugin اختيارية
- رقعة إعداد Gateway اختيارية
- `qa-flow` القابل للتنفيذ

يُسمح لسطح وقت التشغيل القابل لإعادة الاستخدام الذي يدعم `qa-flow` بأن يبقى عامًا وشاملًا. على سبيل المثال، يمكن لسيناريوهات Markdown الجمع بين مساعدات جانب النقل ومساعدات جانب المتصفح التي تقود Control UI المضمّن عبر وصلة Gateway `browser.request` من دون إضافة مشغّل حالة خاصة.

ينبغي تجميع ملفات السيناريو حسب قدرة المنتج لا حسب مجلد شجرة المصدر. أبقِ معرّفات السيناريو مستقرة عند نقل الملفات؛ واستخدم `docsRefs` و`codeRefs` لقابلية تتبع التنفيذ.

ينبغي أن تبقى قائمة الأساس واسعة بما يكفي لتغطية:

- الدردشة المباشرة ودردشة القناة
- سلوك السلاسل
- دورة حياة إجراء الرسالة
- استدعاءات Cron
- استدعاء الذاكرة
- تبديل النموذج
- تسليم الوكيل الفرعي
- قراءة المستودع وقراءة المستندات
- مهمة بناء صغيرة واحدة مثل Lobster Invaders

## مسارات محاكاة المزوّد

يحتوي `qa suite` على مسارين محليين لمحاكاة المزوّد:

- `mock-openai` هو محاكي OpenClaw المدرك للسيناريو. يبقى مسار المحاكاة الحتمية الافتراضي لـ QA المدعوم من المستودع وبوابات التكافؤ.
- يبدأ `aimock` خادم مزوّد مدعومًا بـ AIMock لتغطية البروتوكول التجريبي، والتثبيتات، والتسجيل/إعادة التشغيل، والفوضى. إنه إضافي ولا يستبدل موزّع سيناريو `mock-openai`.

يوجد تنفيذ مسار المزوّد تحت `extensions/qa-lab/src/providers/`. يمتلك كل مزوّد افتراضاته، وبدء تشغيل الخادم المحلي، وإعداد نموذج Gateway، واحتياجات تمهيد ملف تعريف المصادقة، وأعلام قدرات الحي/المحاكاة. ينبغي أن تمر أكواد الحزمة وGateway المشتركة عبر سجل المزوّد بدلًا من التفريع حسب أسماء المزوّدين.

## محولات النقل

يمتلك `qa-lab` وصلة نقل عامة لسيناريوهات QA في Markdown. `qa-channel` هو أول محول على هذه الوصلة، لكن هدف التصميم أوسع: ينبغي للقنوات الحقيقية أو الاصطناعية المستقبلية أن تتصل بمشغّل الحزمة نفسه بدلًا من إضافة مشغّل QA خاص بالنقل.

على مستوى البنية، يكون الفصل كالتالي:

- يمتلك `qa-lab` تنفيذ السيناريو العام، وتزامن العمال، وكتابة artifacts، وإعداد التقارير.
- يمتلك محول النقل إعداد Gateway، والجاهزية، والملاحظة الواردة والصادرة، وإجراءات النقل، وحالة النقل المعيارية.
- تعرّف ملفات سيناريو Markdown تحت `qa/scenarios/` تشغيل الاختبار؛ ويوفر `qa-lab` سطح وقت التشغيل القابل لإعادة الاستخدام الذي ينفذها.

### إضافة قناة

تتطلب إضافة قناة إلى نظام QA في Markdown شيئين بالضبط:

1. محول نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تضف جذر أمر QA جديدًا في المستوى الأعلى عندما يستطيع مضيف `qa-lab` المشترك امتلاك التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر أمر `openclaw qa`
- بدء تشغيل الحزمة وتفكيكها
- تزامن العمال
- كتابة artifacts
- إنشاء التقارير
- تنفيذ السيناريو
- أسماء توافق مستعارة لسيناريوهات `qa-channel` الأقدم

تمتلك Plugins المشغّلة عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت جذر `qa` المشترك
- كيفية إعداد Gateway لذلك النقل
- كيفية التحقق من الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية ملاحظة الرسائل الصادرة
- كيفية عرض النصوص وحالة النقل المعيارية
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة الضبط أو التنظيف الخاصين بالنقل

الحد الأدنى لاعتماد قناة جديدة:

1. أبقِ `qa-lab` مالكًا لجذر `qa` المشترك.
2. نفّذ مشغّل النقل على وصلة مضيف `qa-lab` المشتركة.
3. أبقِ الآليات الخاصة بالنقل داخل Plugin المشغّل أو حاضنة القناة.
4. ركّب المشغّل كـ `openclaw qa <runner>` بدلًا من تسجيل أمر جذر منافس. ينبغي أن تعلن Plugins المشغّلة عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`. أبقِ `runtime-api.ts` خفيفًا؛ ينبغي أن يظل تنفيذ CLI والمشغّل الكسول خلف نقاط دخول منفصلة.
5. ألّف أو كيّف سيناريوهات Markdown تحت أدلة `qa/scenarios/` ذات السمات.
6. استخدم مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. أبقِ أسماء التوافق المستعارة الحالية عاملة ما لم يكن المستودع يجري ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا أمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقه في Plugin ذلك المشغّل أو حاضنة Plugin.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن لأكثر من قناة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة في `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بالنقل واجعل ذلك صريحًا في عقد السيناريو.

### أسماء مساعدات السيناريو

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

تظل أسماء التوافق المستعارة متاحة للسيناريوهات الحالية — `waitForQaChannelReady` و`waitForOutboundMessage` و`waitForNoOutbound` و`formatConversationTranscript` و`resetBus` — لكن ينبغي أن يستخدم تأليف السيناريوهات الجديدة الأسماء العامة. توجد الأسماء المستعارة لتجنب ترحيل دفعة واحدة، لا كنموذج للمضي قدمًا.

## التقارير

يصدّر `qa-lab` تقرير بروتوكول Markdown من المخطط الزمني للحافلة المرصودة.
ينبغي أن يجيب التقرير عن:

- ما الذي نجح
- ما الذي فشل
- ما الذي بقي محجوبًا
- ما سيناريوهات المتابعة التي تستحق الإضافة

لجرد السيناريوهات المتاحة — وهو مفيد عند تقدير حجم عمل المتابعة أو توصيل نقل جديد — شغّل `pnpm openclaw qa coverage` (أضف `--json` لمخرجات قابلة للقراءة آليًا).

لفحوصات الشخصية والأسلوب، شغّل السيناريو نفسه عبر عدة مراجع نماذج حية واكتب تقرير Markdown محكّمًا:

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

يشغّل الأمر عمليات فرعية محلية لـ Gateway الخاص بضمان الجودة، وليس Docker. يجب أن تضبط سيناريوهات تقييم الشخصية الشخصية عبر `SOUL.md`، ثم تشغّل أدوار مستخدم عادية مثل الدردشة، ومساعدة مساحة العمل، ومهام الملفات الصغيرة. لا يجب إخبار النموذج المرشح بأنه يخضع للتقييم. يحافظ الأمر على كل نص جلسة كامل، ويسجل إحصاءات تشغيل أساسية، ثم يطلب من نماذج التحكيم في الوضع السريع مع استدلال `xhigh` حيث يكون مدعومًا ترتيب عمليات التشغيل حسب الطبيعية، والطابع، والفكاهة.
استخدم `--blind-judge-models` عند مقارنة المزوّدين: لا تزال مطالبة التحكيم تتلقى كل نص جلسة وحالة تشغيل، لكن تُستبدل مراجع المرشحين بتسميات محايدة مثل `candidate-01`؛ ويربط التقرير الترتيبات بالمراجع الحقيقية بعد التحليل.
تستخدم عمليات تشغيل المرشحين افتراضيًا مستوى تفكير `high`، مع `medium` لـ GPT-5.5 و`xhigh`
لمراجع تقييم OpenAI الأقدم التي تدعمه. يمكنك تجاوز مرشح محدد ضمن السطر باستخدام
`--model provider/model,thinking=<level>`. لا يزال `--thinking <level>` يضبط بديلًا عامًا، ويُحتفظ بالصيغة الأقدم `--model-thinking <provider/model=level>` للتوافق.
تستخدم مراجع مرشحي OpenAI افتراضيًا الوضع السريع بحيث تُستخدم المعالجة ذات الأولوية حيث يدعمها المزوّد. أضف `,fast` أو `,no-fast` أو `,fast=false` ضمن السطر عندما يحتاج مرشح واحد أو حكم واحد إلى تجاوز. مرّر `--fast` فقط عندما تريد فرض الوضع السريع لكل نموذج مرشح. تُسجّل مدد المرشحين والحكام في التقرير لتحليل القياسات المرجعية، لكن مطالبات التحكيم تنص صراحة على عدم الترتيب حسب السرعة.
تستخدم عمليات تشغيل نماذج المرشحين والحكام افتراضيًا التزامن 16. اخفض
`--concurrency` أو `--judge-concurrency` عندما تجعل حدود المزوّد أو ضغط Gateway المحلي عملية التشغيل كثيرة التشويش.
عند عدم تمرير أي مرشح `--model`، يكون تقييم الشخصية افتراضيًا
`openai/gpt-5.5`، و`openai/gpt-5.2`، و`openai/gpt-5`، و`anthropic/claude-opus-4-6`،
و`anthropic/claude-sonnet-4-6`، و`zai/glm-5.1`،
و`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` عند عدم تمرير أي `--model`.
عند عدم تمرير `--judge-model`، تكون نماذج التحكيم افتراضيًا
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high`.

## المستندات ذات الصلة

- [مصفوفة ضمان الجودة](/ar/concepts/qa-matrix)
- [قناة ضمان الجودة](/ar/channels/qa-channel)
- [الاختبار](/ar/help/testing)
- [لوحة التحكم](/ar/web/dashboard)
