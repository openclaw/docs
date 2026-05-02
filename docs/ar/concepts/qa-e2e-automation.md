---
read_when:
    - فهم كيفية تكامل مكدس ضمان الجودة
    - توسيع qa-lab أو qa-channel أو محوّل نقل
    - إضافة سيناريوهات ضمان الجودة المدعومة بالمستودع
    - بناء أتمتة ضمان جودة أعلى واقعية حول لوحة تحكم Gateway
summary: 'نظرة عامة على حزمة ضمان الجودة: qa-lab، qa-channel، سيناريوهات مدعومة بالمستودع، مسارات النقل المباشر، محوّلات النقل، وإعداد التقارير.'
title: نظرة عامة على ضمان الجودة
x-i18n:
    generated_at: "2026-05-02T20:45:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

المقصود من مكدس QA الخاص هو اختبار OpenClaw بطريقة أكثر واقعية،
ومشكّلة كالقنوات، مما يستطيع اختبار وحدة واحد فعله.

الأجزاء الحالية:

- `extensions/qa-channel`: قناة رسائل اصطناعية تتضمن واجهات الرسائل المباشرة، والقنوات، والسلاسل،
  والتفاعلات، والتعديل، والحذف.
- `extensions/qa-lab`: واجهة مصحح الأخطاء وناقل QA لمراقبة النص،
  وحقن الرسائل الواردة، وتصدير تقرير Markdown.
- `extensions/qa-matrix`، وplugins التشغيل المستقبلية: محولات نقل حي
  تقود قناة حقيقية داخل Gateway QA فرعي.
- `qa/`: أصول بذور مدعومة بالمستودع لمهمة البدء وسيناريوهات QA
  الأساسية.

## واجهة الأوامر

تعمل كل تدفقات QA ضمن `pnpm openclaw qa <subcommand>`. لدى كثير منها أسماء بديلة على شكل سكربتات `pnpm qa:*`؛ وكلا الشكلين مدعوم.

| الأمر                                               | الغرض                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | فحص ذاتي مضمّن لـ QA؛ يكتب تقرير Markdown.                                                                                                                                          |
| `qa suite`                                          | تشغيل السيناريوهات المدعومة بالمستودع ضد مسار Gateway QA. الأسماء البديلة: `pnpm openclaw qa suite --runner multipass` لآلة Linux افتراضية مؤقتة.                                  |
| `qa coverage`                                       | طباعة مخزون تغطية السيناريو بصيغة markdown (`--json` لمخرجات الآلة).                                                                                                                |
| `qa parity-report`                                  | مقارنة ملفي `qa-suite-summary.json` وكتابة تقرير التكافؤ الوكيلي.                                                                                                                    |
| `qa character-eval`                                 | تشغيل سيناريو QA للشخصية عبر عدة نماذج حية مع تقرير محكّم. راجع [إعداد التقارير](#reporting).                                                                                       |
| `qa manual`                                         | تشغيل مطالبة لمرة واحدة ضد مسار المزود/النموذج المحدد.                                                                                                                              |
| `qa ui`                                             | بدء واجهة مصحح أخطاء QA وناقل QA المحلي (الاسم البديل: `pnpm qa:lab:ui`).                                                                                                           |
| `qa docker-build-image`                             | بناء صورة Docker المخبوزة مسبقًا لـ QA.                                                                                                                                             |
| `qa docker-scaffold`                                | كتابة قالب docker-compose للوحة معلومات QA + مسار Gateway.                                                                                                                          |
| `qa up`                                             | بناء موقع QA، وبدء المكدس المدعوم بـ Docker، وطباعة URL (الاسم البديل: `pnpm qa:lab:up`؛ يضيف متغير `:fast` الخيار `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).          |
| `qa aimock`                                         | بدء خادم مزود AIMock فقط.                                                                                                                                                          |
| `qa mock-openai`                                    | بدء خادم مزود `mock-openai` الواعي بالسيناريو فقط.                                                                                                                                  |
| `qa credentials doctor` / `add` / `list` / `remove` | إدارة مجمع بيانات اعتماد Convex المشترك.                                                                                                                                            |
| `qa matrix`                                         | مسار نقل حي ضد خادم Tuwunel homeserver مؤقت. راجع [QA لـ Matrix](/ar/concepts/qa-matrix).                                                                                              |
| `qa telegram`                                       | مسار نقل حي ضد مجموعة Telegram خاصة حقيقية.                                                                                                                                         |
| `qa discord`                                        | مسار نقل حي ضد قناة نقابة Discord خاصة حقيقية.                                                                                                                                      |

## تدفق المشغّل

تدفق مشغّل QA الحالي هو موقع QA بلوحتين:

- اليسار: لوحة معلومات Gateway (Control UI) مع الوكيل.
- اليمين: QA Lab، تعرض النص الشبيه بـ Slack وخطة السيناريو.

شغّله باستخدام:

```bash
pnpm qa:lab:up
```

يبني ذلك موقع QA، ويبدأ مسار Gateway المدعوم بـ Docker، ويعرض صفحة
QA Lab حيث يستطيع المشغّل أو حلقة الأتمتة إعطاء الوكيل مهمة QA،
ومراقبة سلوك القناة الحقيقي، وتسجيل ما نجح أو فشل أو بقي محجوبًا.

لتكرار أسرع على واجهة QA Lab دون إعادة بناء صورة Docker في كل مرة،
ابدأ المكدس بحزمة QA Lab مركبة عبر bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

يبقي `qa:lab:up:fast` خدمات Docker على صورة مبنية مسبقًا ويركب
`extensions/qa-lab/web/dist` داخل حاوية `qa-lab` عبر bind mount. يعيد `qa:lab:watch`
بناء تلك الحزمة عند التغيير، ويعيد المتصفح التحميل تلقائيًا عندما يتغير
تجزئة أصل QA Lab.

لفحص دخان محلي لتتبّع OpenTelemetry، شغّل:

```bash
pnpm qa:otel:smoke
```

يبدأ ذلك السكربت مستقبل تتبع OTLP/HTTP محليًا، ويشغّل سيناريو QA
`otel-trace-smoke` مع تفعيل plugin `diagnostics-otel`، ثم يفك ترميز امتدادات protobuf المصدّرة ويؤكد الشكل الحرج للإصدار:
يجب أن تكون `openclaw.run` و`openclaw.harness.run` و`openclaw.model.call`
و`openclaw.context.assembled` و`openclaw.message.delivery` موجودة؛
ويجب ألا تصدّر استدعاءات النموذج `StreamAbandoned` في الدورات الناجحة؛ ويجب أن تبقى معرّفات التشخيص الخام وسمات
`openclaw.content.*` خارج التتبع. يكتب
`otel-smoke-summary.json` بجانب آثار مجموعة QA.

تبقى QA الخاصة بالملاحظة مقصورة على نسخة المصدر المسحوبة فقط. يحذف ملف npm tarball عمدًا
QA Lab، لذلك لا تشغّل مسارات إصدار Docker للحزم أوامر `qa`. استخدم
`pnpm qa:otel:smoke` من نسخة مصدر مبنية عند تغيير تجهيزات التشخيص.

لمسار دخان Matrix حقيقي النقل، شغّل:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع CLI الكامل، وفهرس الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط الآثار لهذا المسار موجودة في [QA لـ Matrix](/ar/concepts/qa-matrix). بنظرة سريعة: يوفّر خادم Tuwunel homeserver مؤقتًا في Docker، ويسجل مستخدمين مؤقتين للسائق/SUT/المراقب، ويشغّل Plugin Matrix الحقيقي داخل Gateway QA فرعي مقيّد بذلك النقل (دون `qa-channel`)، ثم يكتب تقرير Markdown، وملخص JSON، وأثر أحداث مرصودة، وسجل مخرجات مدمجًا ضمن `.artifacts/qa-e2e/matrix-<timestamp>/`.

لمساري دخان Telegram وDiscord حقيقيي النقل:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

يستهدف كلاهما قناة حقيقية موجودة مسبقًا مع بوتين (السائق + SUT). متغيرات البيئة المطلوبة، وقوائم السيناريوهات، وآثار المخرجات، ومجمع بيانات اعتماد Convex موثقة في [مرجع QA لـ Telegram وDiscord](#telegram-and-discord-qa-reference) أدناه.

قبل استخدام بيانات اعتماد حية مجمعة، شغّل:

```bash
pnpm openclaw qa credentials doctor
```

يفحص doctor بيئة وسيط Convex، ويتحقق من إعدادات نقاط النهاية، ويتأكد من إمكانية الوصول إلى الإدارة/القائمة عند وجود سر الصيانة. ولا يبلّغ إلا عن حالة الأسرار: مضبوطة/مفقودة.

## تغطية النقل الحي

تشترك مسارات النقل الحي في عقد واحد بدل أن يخترع كل منها شكل قائمة سيناريوهات خاصًا به. `qa-channel` هي مجموعة سلوك المنتج الاصطناعية الواسعة وليست جزءًا من مصفوفة تغطية النقل الحي.

| المسار   | Canary | بوابة الذكر | بوت إلى بوت | حظر قائمة السماح | رد على المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة السلسلة | عزل السلسلة | مراقبة التفاعلات | أمر المساعدة | تسجيل الأوامر الأصلية |
| -------- | ------ | ------------ | ----------- | ----------------- | ---------------------- | -------------------------- | --------------- | ------------ | ------------------ | ------------ | ---------------------- |
| Matrix   | x      | x            | x           | x                 | x                      | x                          | x               | x            | x                  |              |                        |
| Telegram | x      | x            | x           |                   |                        |                            |                 |              |                    | x            |                        |
| Discord  | x      | x            | x           |                   |                        |                            |                 |              |                    |              | x                      |

يبقي هذا `qa-channel` كمجموعة سلوك المنتج الواسعة بينما تشترك Matrix،
وTelegram، ووسائل النقل الحية المستقبلية في قائمة تحقق صريحة واحدة لعقد النقل.

لمسار آلة Linux افتراضية مؤقتة دون إدخال Docker في مسار QA، شغّل:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

يُشغّل هذا ضيف Multipass جديدًا، ويثبّت الاعتماديات، ويبني OpenClaw
داخل الضيف، ويشغّل `qa suite`، ثم ينسخ تقرير QA العادي
والملخص مرة أخرى إلى `.artifacts/qa-e2e/...` على المضيف.
يعيد استخدام سلوك اختيار السيناريو نفسه الخاص بـ `qa suite` على المضيف.
تنفذ عمليات تشغيل المجموعة على المضيف وMultipass عدة سيناريوهات محددة بالتوازي
مع عمال Gateway معزولين افتراضيًا. القيمة الافتراضية للتزامن في `qa-channel`
هي 4، ومحدودة بعدد السيناريوهات المحددة. استخدم `--concurrency <count>` لضبط
عدد العمال، أو `--concurrency 1` للتنفيذ التسلسلي.
ينهي الأمر بقيمة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
تريد الآثار دون رمز خروج فاشل.
تمرر عمليات التشغيل الحية مدخلات مصادقة QA المدعومة والعملية
للضيف: مفاتيح المزود القائمة على البيئة، ومسار إعداد مزود QA الحي، و
`CODEX_HOME` عند وجوده. أبقِ `--output-dir` تحت جذر المستودع حتى يتمكن الضيف
من الكتابة عائدًا عبر مساحة العمل المركبة.

## مرجع QA لـ Telegram وDiscord

لدى Matrix [صفحة مخصصة](/ar/concepts/qa-matrix) بسبب عدد سيناريوهاته وتوفير homeserver المدعوم بـ Docker. أما Telegram وDiscord فأصغر، إذ يملكان بضعة سيناريوهات لكل منهما، ولا نظام ملفات شخصية، ويعملان ضد قنوات حقيقية موجودة مسبقًا، لذلك يوجد مرجعهما هنا.

### أعلام CLI المشتركة

يسجل كلا المسارين عبر `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ويقبلان الأعلام نفسها:

| العَلَم                                  | الافتراضي                                                   | الوصف                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | شغّل هذا السيناريو فقط. قابل للتكرار.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | الموضع الذي تُكتب فيه التقارير/الملخص/الرسائل المرصودة وسجل الإخراج. تُحلّ المسارات النسبية نسبةً إلى `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | جذر المستودع عند الاستدعاء من دليل عمل محايد.                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | معرّف حساب مؤقت داخل إعدادات QA gateway.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` أو `live-frontier` (ما زال `live-openai` القديم يعمل).                                                  |
| `--model <ref>` / `--alt-model <ref>` | الإعداد الافتراضي للمزوّد                                          | مراجع النموذج الأساسي/البديل.                                                                                         |
| `--fast`                              | معطّل                                                       | الوضع السريع للمزوّد حيث يكون مدعومًا.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | راجع [مجموعة بيانات اعتماد Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` في CI، و`maintainer` خلاف ذلك                        | الدور المستخدم عند `--credential-source convex`.                                                                          |

كلاهما يخرج برمز غير صفري عند فشل أي سيناريو. يكتب `--allow-failures` المصنوعات دون تعيين رمز خروج فاشل.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

يستهدف مجموعة Telegram خاصة حقيقية واحدة مع روبوتين متميزين (المشغّل + SUT). يجب أن يكون لروبوت SUT اسم مستخدم في Telegram؛ تعمل مراقبة روبوت إلى روبوت بأفضل شكل عندما يكون لدى كلا الروبوتين **Bot-to-Bot Communication Mode** مفعّلًا في `@BotFather`.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — معرّف دردشة رقمي (سلسلة نصية).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختياري:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` يُبقي نصوص الرسائل في مصنوعات الرسائل المرصودة (الإعداد الافتراضي يحجبها).

السيناريوهات (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

مصنوعات الإخراج:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — يتضمن RTT لكل رد (إرسال المشغّل ← رد SUT المرصود) بدءًا من الكناري.
- `telegram-qa-observed-messages.json` — تُحجب النصوص ما لم يكن `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

يستهدف قناة نقابة Discord خاصة حقيقية واحدة مع روبوتين: روبوت مشغّل يتحكم فيه إطار الاختبار، وروبوت SUT يبدأه OpenClaw gateway الابن عبر Discord Plugin المضمّن. يتحقق من معالجة إشارات القناة وأن روبوت SUT سجّل الأمر الأصلي `/help` لدى Discord.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — يجب أن يطابق معرّف مستخدم روبوت SUT الذي يعيده Discord (وإلا يفشل المسار بسرعة).

اختياري:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` يُبقي نصوص الرسائل في مصنوعات الرسائل المرصودة.

السيناريوهات (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

مصنوعات الإخراج:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — تُحجب النصوص ما لم يكن `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### مجموعة بيانات اعتماد Convex

يمكن لكل من مساري Telegram وDiscord استئجار بيانات اعتماد من مجموعة Convex مشتركة بدلًا من قراءة متغيرات البيئة أعلاه. مرّر `--credential-source convex` (أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)؛ يحصل QA Lab على إيجار حصري، ويرسل له إشارات Heartbeat طوال مدة التشغيل، ويحرره عند الإيقاف. أنواع المجموعة هي `"telegram"` و`"discord"`.

أشكال الحمولة التي يتحقق منها الوسيط عند `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — يجب أن يكون `groupId` سلسلة معرّف دردشة رقمية.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

توجد متغيرات البيئة التشغيلية وعقدة نقطة نهاية وسيط Convex في [الاختبار ← بيانات اعتماد Telegram المشتركة عبر Convex](/ar/help/testing#shared-telegram-credentials-via-convex-v1) (اسم القسم يسبق دعم Discord؛ دلالات الوسيط متطابقة لكلا النوعين).

## البذور المدعومة بالمستودع

توجد أصول البذور في `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

هذه موجودة عمدًا في git بحيث تكون خطة QA مرئية لكل من البشر والوكيل.

يجب أن يبقى `qa-lab` مشغّل Markdown عامًا. كل ملف Markdown للسيناريو هو مصدر الحقيقة لتشغيل اختبار واحد، ويجب أن يعرّف:

- بيانات السيناريو الوصفية
- فئة اختيارية، وقدرة اختيارية، ومسار اختياري، وبيانات وصفية اختيارية للمخاطر
- مراجع المستندات والشيفرة
- متطلبات Plugin اختيارية
- رقعة اختيارية لإعدادات Gateway
- `qa-flow` القابل للتنفيذ

يُسمح لسطح وقت التشغيل القابل لإعادة الاستخدام الذي يدعم `qa-flow` بأن يبقى عامًا ومتداخل المجالات. على سبيل المثال، يمكن لسيناريوهات Markdown الجمع بين مساعدات جانب النقل ومساعدات جانب المتصفح التي تقود Control UI المضمّنة عبر فتحة Gateway `browser.request` دون إضافة مشغّل حالة خاصة.

يجب تجميع ملفات السيناريو حسب قدرة المنتج لا حسب مجلد شجرة المصدر. أبقِ معرّفات السيناريوهات مستقرة عند نقل الملفات؛ استخدم `docsRefs` و`codeRefs` لتتبّع التنفيذ.

يجب أن تبقى قائمة خط الأساس واسعة بما يكفي لتغطية:

- الرسائل المباشرة ودردشة القنوات
- سلوك الخيوط
- دورة حياة إجراء الرسالة
- استدعاءات Cron
- استرجاع الذاكرة
- تبديل النماذج
- تسليم الوكيل الفرعي
- قراءة المستودع وقراءة المستندات
- مهمة بناء صغيرة واحدة مثل Lobster Invaders

## مسارات محاكاة المزوّد

يحتوي `qa suite` على مسارين محليين لمحاكاة المزوّد:

- `mock-openai` هو محاكي OpenClaw الواعي بالسيناريو. يبقى مسار المحاكاة الحتمي الافتراضي لـ QA المدعوم بالمستودع وبوابات التكافؤ.
- يبدأ `aimock` خادم مزوّد مدعومًا بـ AIMock لتغطية بروتوكول تجريبي، والتجهيزات، والتسجيل/إعادة التشغيل، والفوضى. إنه إضافي ولا يستبدل موزّع سيناريوهات `mock-openai`.

يوجد تنفيذ مسار المزوّد تحت `extensions/qa-lab/src/providers/`. يملك كل مزوّد إعداداته الافتراضية، وبدء تشغيل الخادم المحلي، وإعدادات نموذج Gateway، واحتياجات تجهيز ملف تعريف المصادقة، وأعلام القدرة الحية/المحاكية. يجب أن تمر شيفرة المجموعة وGateway المشتركة عبر سجل المزوّدين بدلًا من التفريع على أسماء المزوّدين.

## محولات النقل

يملك `qa-lab` فتحة نقل عامة لسيناريوهات Markdown QA. `qa-channel` هو أول محول على تلك الفتحة، لكن هدف التصميم أوسع: يجب أن تتصل القنوات الحقيقية أو الاصطناعية المستقبلية بمشغّل المجموعة نفسه بدلًا من إضافة مشغّل QA خاص بالنقل.

على مستوى البنية، يكون التقسيم كالتالي:

- يملك `qa-lab` تنفيذ السيناريو العام، وتزامن العمال، وكتابة المصنوعات، وإعداد التقارير.
- يملك محول النقل إعدادات Gateway، والجاهزية، والمراقبة الواردة والصادرة، وإجراءات النقل، وحالة النقل الموحّدة.
- تحدد ملفات سيناريوهات Markdown تحت `qa/scenarios/` تشغيل الاختبار؛ ويوفر `qa-lab` سطح وقت التشغيل القابل لإعادة الاستخدام الذي ينفذها.

### إضافة قناة

تتطلب إضافة قناة إلى نظام Markdown QA شيئين بالضبط:

1. محول نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تضف جذر أمر QA جديدًا عالي المستوى عندما يستطيع مضيف `qa-lab` المشترك امتلاك التدفق.

يملك `qa-lab` آليات المضيف المشتركة:

- جذر أمر `openclaw qa`
- بدء المجموعة وتفكيكها
- تزامن العمال
- كتابة المصنوعات
- إنشاء التقارير
- تنفيذ السيناريو
- أسماء توافقية مستعارة لسيناريوهات `qa-channel` الأقدم

تملك Runner plugins عقد النقل:

- كيف يُثبّت `openclaw qa <runner>` تحت جذر `qa` المشترك
- كيف يُعد Gateway لذلك النقل
- كيف تُفحص الجاهزية
- كيف تُحقن الأحداث الواردة
- كيف تُرصد الرسائل الصادرة
- كيف تُعرض النصوص وحالة النقل الموحّدة
- كيف تُنفّذ الإجراءات المدعومة بالنقل
- كيف يُتعامل مع إعادة التعيين أو التنظيف الخاص بالنقل

الحد الأدنى لاعتماد قناة جديدة:

1. أبقِ `qa-lab` مالكًا لجذر `qa` المشترك.
2. نفّذ runner النقل على فتحة مضيف `qa-lab` المشتركة.
3. أبقِ الآليات الخاصة بالنقل داخل runner plugin أو إطار اختبار القناة.
4. ثبّت runner بوصفه `openclaw qa <runner>` بدلًا من تسجيل أمر جذر منافس. يجب أن تعلن Runner plugins عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`. أبقِ `runtime-api.ts` خفيفًا؛ يجب أن تبقى CLI الكسولة وتنفيذ runner خلف نقاط دخول منفصلة.
5. ألّف أو كيّف سيناريوهات Markdown تحت أدلة `qa/scenarios/` ذات الموضوعات.
6. استخدم مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. أبقِ أسماء التوافق المستعارة الحالية تعمل ما لم يكن المستودع يجري ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا أمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقه في ذلك runner plugin أو إطار اختبار Plugin.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن لأكثر من قناة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بالقناة في `suite.ts`.
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

تبقى أسماء التوافق المستعارة متاحة للسيناريوهات الحالية — `waitForQaChannelReady`، و`waitForOutboundMessage`، و`waitForNoOutbound`، و`formatConversationTranscript`، و`resetBus` — لكن يجب أن يستخدم تأليف السيناريوهات الجديدة الأسماء العامة. توجد الأسماء المستعارة لتجنب ترحيل دفعة واحدة، لا كنموذج للمضي قدمًا.

## التقارير

يصدّر `qa-lab` تقرير بروتوكول Markdown من المخطط الزمني للناقل المرصود.
يجب أن يجيب التقرير عن:

- ما الذي نجح
- ما الذي فشل
- ما الذي بقي محجوبًا
- ما سيناريوهات المتابعة التي تستحق الإضافة

للاطلاع على جرد السيناريوهات المتاحة — وهو مفيد عند تقدير حجم العمل اللاحق أو توصيل وسيلة نقل جديدة — شغّل `pnpm openclaw qa coverage` (أضف `--json` للحصول على مخرجات قابلة للقراءة آليًا).

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

يشغّل الأمر عمليات فرعية محلية لـ QA Gateway، وليس Docker. ينبغي لسيناريوهات تقييم الشخصية
تعيين الشخصية عبر `SOUL.md`، ثم تشغيل أدوار مستخدم عادية
مثل المحادثة، ومساعدة مساحة العمل، ومهام الملفات الصغيرة. يجب ألا يُخبر النموذج المرشح
بأنه قيد التقييم. يحتفظ الأمر بكل نص جلسة كامل،
ويسجل إحصاءات تشغيل أساسية، ثم يطلب من نماذج التحكيم في الوضع السريع مع
استدلال `xhigh` حيث يكون مدعومًا ترتيب عمليات التشغيل حسب الطبيعية، والطابع العام، والفكاهة.
استخدم `--blind-judge-models` عند مقارنة المزوّدين: يظل موجّه التحكيم يحصل على
كل نص جلسة وحالة تشغيل، لكن مراجع المرشحين تُستبدل بتسميات محايدة
مثل `candidate-01`؛ ويربط التقرير الترتيبات بالمراجع الحقيقية بعد
التحليل.
تستخدم عمليات تشغيل المرشحين افتراضيًا مستوى تفكير `high`، مع `medium` لـ GPT-5.5 و`xhigh`
لمراجع تقييم OpenAI الأقدم التي تدعمه. تجاوز مرشحًا محددًا ضمنيًا باستخدام
`--model provider/model,thinking=<level>`. لا يزال `--thinking <level>` يعيّن
خيارًا احتياطيًا عامًا، ويُحتفظ بالصيغة الأقدم `--model-thinking <provider/model=level>`
للتوافق.
تستخدم مراجع مرشحي OpenAI افتراضيًا الوضع السريع بحيث تُستخدم المعالجة ذات الأولوية حيث
يدعمها المزوّد. أضف `,fast` أو `,no-fast` أو `,fast=false` ضمنيًا عندما يحتاج
مرشح أو حَكَم واحد إلى تجاوز. مرّر `--fast` فقط عندما تريد
فرض الوضع السريع على كل نموذج مرشح. تُسجّل مدد المرشحين والحكام
في التقرير لتحليل المقاييس، لكن موجّهات التحكيم تنص صراحةً
على عدم الترتيب حسب السرعة.
تستخدم عمليات تشغيل نماذج المرشحين والحكام افتراضيًا التوازي 16. خفّض
`--concurrency` أو `--judge-concurrency` عندما تجعل حدود المزوّد أو ضغط Gateway المحلي
التشغيل كثير الضجيج.
عندما لا يُمرَّر أي مرشح `--model`، يستخدم تقييم الشخصية افتراضيًا
`openai/gpt-5.5`، و`openai/gpt-5.2`، و`openai/gpt-5`، و`anthropic/claude-opus-4-6`،
و`anthropic/claude-sonnet-4-6`، و`zai/glm-5.1`،
و`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` عندما لا يُمرَّر أي `--model`.
عندما لا يُمرَّر `--judge-model`، يستخدم الحكام افتراضيًا
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high`.

## مستندات ذات صلة

- [Matrix QA](/ar/concepts/qa-matrix)
- [قناة QA](/ar/channels/qa-channel)
- [الاختبار](/ar/help/testing)
- [لوحة المعلومات](/ar/web/dashboard)
