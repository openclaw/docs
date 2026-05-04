---
read_when:
    - فهم كيفية تكامل مكدس ضمان الجودة
    - توسيع qa-lab أو qa-channel أو محوّل نقل
    - إضافة سيناريوهات ضمان الجودة المدعومة بالمستودع
    - بناء أتمتة ضمان جودة أكثر واقعية حول لوحة تحكم Gateway
summary: 'نظرة عامة على حزمة ضمان الجودة: qa-lab وqa-channel والسيناريوهات المدعومة بالمستودع ومسارات النقل المباشر ومهايئات النقل وإعداد التقارير.'
title: نظرة عامة على ضمان الجودة
x-i18n:
    generated_at: "2026-05-04T07:05:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

مكدس ضمان الجودة الخاص مخصص لاختبار OpenClaw بطريقة أكثر واقعية
ومشكلة كقناة مما يمكن لاختبار وحدة واحد فعله.

الأجزاء الحالية:

- `extensions/qa-channel`: قناة رسائل اصطناعية بواجهات رسالة مباشرة، وقناة، وسلسلة نقاش،
  وتفاعل، وتعديل، وحذف.
- `extensions/qa-lab`: واجهة مصحح وممر ضمان جودة لمراقبة النص المنسوخ،
  وحقن الرسائل الواردة، وتصدير تقرير Markdown.
- `extensions/qa-matrix`، وPlugins التشغيل المستقبلية: محولات نقل حي
  تشغل قناة حقيقية داخل Gateway ضمان جودة فرعي.
- `qa/`: أصول بذور مدعومة بالمستودع لمهمة البدء وسيناريوهات ضمان الجودة
  الأساسية.
- [Mantis](/ar/concepts/mantis): تحقق حي قبل وبعد للأخطاء التي
  تحتاج إلى وسائل نقل حقيقية، ولقطات شاشة متصفح، وحالة VM، وأدلة PR.

## واجهة الأوامر

يعمل كل تدفق ضمان جودة تحت `pnpm openclaw qa <subcommand>`. لكثير منها أسماء مستعارة
بصيغة سكربتات `pnpm qa:*`؛ كلا الشكلين مدعوم.

| الأمر                                             | الغرض                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | فحص ذاتي مدمج لضمان الجودة؛ يكتب تقرير Markdown.                                                                                                                                             |
| `qa suite`                                          | تشغيل سيناريوهات مدعومة بالمستودع ضد مسار Gateway ضمان الجودة. الأسماء المستعارة: `pnpm openclaw qa suite --runner multipass` لـ VM Linux مؤقت.                                                       |
| `qa coverage`                                       | طباعة مخزون تغطية السيناريوهات بصيغة markdown (`--json` لإخراج الآلة).                                                                                                                |
| `qa parity-report`                                  | مقارنة ملفي `qa-suite-summary.json` وكتابة تقرير التكافؤ الوكيلي.                                                                                                               |
| `qa character-eval`                                 | تشغيل سيناريو ضمان جودة الشخصية عبر عدة نماذج حية مع تقرير محكم. راجع [إعداد التقارير](#reporting).                                                                                 |
| `qa manual`                                         | تشغيل موجّه لمرة واحدة ضد مسار المزود/النموذج المحدد.                                                                                                                               |
| `qa ui`                                             | بدء واجهة مصحح ضمان الجودة وممر ضمان الجودة المحلي (الاسم المستعار: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | بناء صورة Docker المسبقة التحضير لضمان الجودة.                                                                                                                                                          |
| `qa docker-scaffold`                                | كتابة قالب docker-compose للوحة معلومات ضمان الجودة + مسار Gateway.                                                                                                                         |
| `qa up`                                             | بناء موقع ضمان الجودة، وبدء المكدس المدعوم بـ Docker، وطباعة URL (الاسم المستعار: `pnpm qa:lab:up`؛ يضيف المتغير `:fast` الخيار `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | بدء خادم مزود AIMock فقط.                                                                                                                                                       |
| `qa mock-openai`                                    | بدء خادم مزود `mock-openai` الواعي بالسيناريو فقط.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | إدارة مجمع بيانات اعتماد Convex المشترك.                                                                                                                                                    |
| `qa matrix`                                         | مسار نقل حي ضد خادم Tuwunel منزلي مؤقت. راجع [ضمان جودة Matrix](/ar/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | مسار نقل حي ضد مجموعة Telegram خاصة حقيقية.                                                                                                                                   |
| `qa discord`                                        | مسار نقل حي ضد قناة نقابة Discord خاصة حقيقية.                                                                                                                            |
| `qa slack`                                          | مسار نقل حي ضد قناة Slack خاصة حقيقية.                                                                                                                                    |
| `qa mantis`                                         | مشغل تحقق قبل وبعد لأخطاء النقل الحي، مع أدلة تفاعلات حالة Discord، وفحص سطح مكتب/متصفح Crabbox، وفحص Slack داخل VNC. راجع [Mantis](/ar/concepts/mantis). |

## تدفق المشغل

تدفق مشغل ضمان الجودة الحالي هو موقع ضمان جودة ذو لوحتين:

- اليسار: لوحة معلومات Gateway (واجهة التحكم) مع الوكيل.
- اليمين: QA Lab، يعرض النص المنسوخ الشبيه بـ Slack وخطة السيناريو.

شغله باستخدام:

```bash
pnpm qa:lab:up
```

يبني ذلك موقع ضمان الجودة، ويبدأ مسار Gateway المدعوم بـ Docker، ويعرض
صفحة QA Lab حيث يمكن للمشغل أو حلقة الأتمتة إعطاء الوكيل مهمة ضمان جودة،
ومراقبة سلوك القناة الحقيقي، وتسجيل ما نجح أو فشل أو
بقي محظورا.

لتكرار أسرع على واجهة QA Lab دون إعادة بناء صورة Docker في كل مرة،
ابدأ المكدس بحزمة QA Lab مركبة بالربط:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

يبقي `qa:lab:up:fast` خدمات Docker على صورة مسبقة البناء ويركب بالربط
`extensions/qa-lab/web/dist` داخل حاوية `qa-lab`. يعيد `qa:lab:watch`
بناء تلك الحزمة عند التغيير، ويعاد تحميل المتصفح تلقائيا عند تغير تجزئة أصول QA Lab.

لفحص تتبع OpenTelemetry محلي، شغل:

```bash
pnpm qa:otel:smoke
```

يبدأ ذلك السكربت مستقبل تتبع OTLP/HTTP محليا، ويشغل سيناريو ضمان الجودة
`otel-trace-smoke` مع تمكين Plugin `diagnostics-otel`، ثم
يفك ترميز امتدادات protobuf المصدرة ويتحقق من الشكل الحرج للإصدار:
يجب أن تكون `openclaw.run`، و`openclaw.harness.run`، و`openclaw.model.call`،
و`openclaw.context.assembled`، و`openclaw.message.delivery` موجودة؛
ويجب ألا تصدر استدعاءات النموذج `StreamAbandoned` في الأدوار الناجحة؛ ويجب أن تبقى معرفات التشخيص الخام وسمات
`openclaw.content.*` خارج التتبع. يكتب
`otel-smoke-summary.json` بجانب آثار مجموعة ضمان الجودة.

يبقى ضمان جودة قابلية الملاحظة مقتصرا على checkout المصدر فقط. يحذف ملف npm tarball
عمدا QA Lab، لذلك لا تشغل مسارات إصدار Docker للحزمة أوامر `qa`. استخدم
`pnpm qa:otel:smoke` من checkout مصدر مبني عند تغيير أدوات تشخيص
الأدوات.

لمسار فحص Matrix حقيقي النقل، شغل:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

توجد مرجع CLI الكامل، وفهرس الملفات الشخصية/السيناريوهات، ومتغيرات البيئة، وتخطيط الآثار لهذا المسار في [ضمان جودة Matrix](/ar/concepts/qa-matrix). باختصار: يوفر خادم Tuwunel منزليا مؤقتا في Docker، ويسجل مستخدمي مشغل/SUT/مراقب مؤقتين، ويشغل Plugin Matrix الحقيقي داخل Gateway ضمان جودة فرعي مقيد بذلك النقل (دون `qa-channel`)، ثم يكتب تقرير Markdown، وملخص JSON، وأثر أحداث مرصودة، وسجل إخراج مدمج تحت `.artifacts/qa-e2e/matrix-<timestamp>/`.

لمسارات فحص Telegram وDiscord وSlack حقيقية النقل:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

تستهدف قناة حقيقية موجودة مسبقا مع روبوتين (مشغل + SUT). متغيرات البيئة المطلوبة، وقوائم السيناريوهات، وآثار الإخراج، ومجمع بيانات اعتماد Convex موثقة في [مرجع ضمان جودة Telegram وDiscord وSlack](#telegram-discord-and-slack-qa-reference) أدناه.

لتشغيل VM سطح مكتب Slack كامل مع إنقاذ VNC، شغل:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر ذلك الأمر جهاز سطح مكتب/متصفح Crabbox، ويشغل مسار Slack الحي
داخل VM، ويفتح Slack Web في متصفح VNC، ويلتقط سطح المكتب، و
ينسخ `slack-qa/` بالإضافة إلى `slack-desktop-smoke.png` إلى دليل آثار Mantis.
أعد استخدام `--lease-id <cbx_...>` بعد تسجيل الدخول إلى Slack Web يدويا
عبر VNC. مع `--gateway-setup`، يترك Mantis Gateway Slack مستمرا لـ OpenClaw
يعمل داخل VM على المنفذ `38973`؛ وبدونه، يشغل الأمر
مسار ضمان جودة Slack العادي من روبوت إلى روبوت ويخرج بعد التقاط الآثار.

قبل استخدام بيانات الاعتماد الحية المجمعة، شغل:

```bash
pnpm openclaw qa credentials doctor
```

يفحص doctor بيئة وسيط Convex، ويتحقق من إعدادات نقاط النهاية، ويتحقق من قابلية وصول admin/list عند وجود سر المشرف. لا يبلغ إلا عن حالة مضبوط/مفقود للأسرار.

## تغطية النقل الحي

تشترك مسارات النقل الحي في عقد واحد بدلا من أن يخترع كل منها شكل قائمة سيناريوهات خاصا به. `qa-channel` هي مجموعة سلوك المنتج الاصطناعية الواسعة وليست جزءا من مصفوفة تغطية النقل الحي.

| المسار     | Canary | بوابة الإشارة | روبوت إلى روبوت | حظر قائمة السماح | رد على المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة سلسلة النقاش | عزل سلسلة النقاش | مراقبة التفاعل | أمر المساعدة | تسجيل الأوامر الأصلية |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

يحافظ هذا على `qa-channel` كمجموعة سلوك المنتج الواسعة بينما تشترك Matrix،
وTelegram، ووسائل النقل الحية المستقبلية في قائمة تحقق صريحة واحدة لعقد النقل.

لمسار VM Linux مؤقت دون إدخال Docker في مسار ضمان الجودة، شغل:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

يُشغّل هذا ضيف Multipass جديدًا، ويثبّت الاعتماديات، ويبني OpenClaw
داخل الضيف، ويُشغّل `qa suite`، ثم ينسخ تقرير QA العادي والملخص
إلى `.artifacts/qa-e2e/...` على المضيف.
يعيد استخدام سلوك اختيار السيناريو نفسه الذي يستخدمه `qa suite` على المضيف.
تُنفّذ تشغيلات حزمة المضيف وMultipass عدة سيناريوهات محددة بالتوازي
مع عمّال Gateway معزولين افتراضيًا. يعتمد `qa-channel` افتراضيًا على تزامن
4، مع تقييده بعدد السيناريوهات المحددة. استخدم `--concurrency <count>` لضبط
عدد العمّال، أو `--concurrency 1` للتنفيذ التسلسلي.
ينهي الأمر بقيمة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
تريد الحصول على الآثار من دون رمز خروج فاشل.
تمرّر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية
للضيف: مفاتيح الموفّر المستندة إلى البيئة، ومسار إعداد موفّر QA الحي، و
`CODEX_HOME` عند وجوده. أبقِ `--output-dir` تحت جذر المستودع لكي يتمكن الضيف
من الكتابة رجوعًا عبر مساحة العمل المركّبة.

## مرجع QA لـ Telegram وDiscord وSlack

لدى Matrix [صفحة مخصصة](/ar/concepts/qa-matrix) بسبب عدد سيناريوهاته وتوفير خادم منزلي مدعوم بـ Docker. أما Telegram وDiscord وSlack فهي أصغر — بضعة سيناريوهات لكل منها، من دون نظام ملفات تعريف، وعلى قنوات حقيقية موجودة مسبقًا — لذلك يوجد مرجعها هنا.

### أعلام CLI المشتركة

تُسجَّل هذه المسارات عبر `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` وتقبل الأعلام نفسها:

| العلم                                  | الافتراضي                                                         | الوصف                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | شغّل هذا السيناريو فقط. قابل للتكرار.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | المكان الذي تُكتب فيه التقارير/الملخص/الرسائل المرصودة وسجل الإخراج. تُحل المسارات النسبية نسبةً إلى `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | جذر المستودع عند الاستدعاء من cwd محايد.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | معرّف حساب مؤقت داخل إعداد Gateway الخاص بـ QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` أو `live-frontier` (ما زال `live-openai` القديم يعمل).                                                  |
| `--model <ref>` / `--alt-model <ref>` | افتراضي الموفّر                                                | مراجع النموذج الأساسي/البديل.                                                                                         |
| `--fast`                              | معطّل                                                             | وضع الموفّر السريع حيث يكون مدعومًا.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | راجع [مجموعة بيانات اعتماد Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` في CI، و`maintainer` خلاف ذلك                              | الدور المستخدم عند `--credential-source convex`.                                                                          |

ينهي كل مسار بقيمة غير صفرية عند فشل أي سيناريو. يكتب `--allow-failures` الآثار من دون تعيين رمز خروج فاشل.

### QA لـ Telegram

```bash
pnpm openclaw qa telegram
```

يستهدف مجموعة Telegram خاصة حقيقية واحدة مع بوتين مميزين (السائق + SUT). يجب أن يكون لدى بوت SUT اسم مستخدم في Telegram؛ تعمل مراقبة بوت-إلى-بوت بأفضل شكل عندما يكون لدى كلا البوتين **وضع اتصال بوت-إلى-بوت** مفعّلًا في `@BotFather`.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — معرّف محادثة رقمي (سلسلة نصية).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختياري:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` يُبقي نصوص الرسائل في آثار الرسائل المرصودة (الافتراضي يحجبها).

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
- `telegram-qa-summary.json` — يتضمن RTT لكل رد (إرسال السائق → رد SUT المرصود) بدءًا من canary.
- `telegram-qa-observed-messages.json` — تُحجب النصوص ما لم يكن `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA لـ Discord

```bash
pnpm openclaw qa discord
```

يستهدف قناة Discord guild خاصة حقيقية واحدة مع بوتين: بوت سائق يتحكم به الحزام، وبوت SUT يبدأه Gateway فرعي لـ OpenClaw عبر Plugin Discord المضمن. يتحقق من معالجة الإشارات في القناة، ومن أن بوت SUT سجّل أمر `/help` الأصلي لدى Discord، ومن سيناريوهات أدلة Mantis الاختيارية.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — يجب أن يطابق معرّف مستخدم بوت SUT الذي يرجعه Discord (وإلا يفشل المسار سريعًا).

اختياري:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` يُبقي نصوص الرسائل في آثار الرسائل المرصودة.

السيناريوهات (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — سيناريو Mantis اختياري. يعمل بمفرده لأنه يبدّل SUT إلى ردود guild مفعّلة دائمًا ومقتصرة على الأدوات مع `messages.statusReactions.enabled=true`، ثم يلتقط مخططًا زمنيًا لتفاعلات REST إضافةً إلى أثر مرئي HTML/PNG.

شغّل سيناريو تفاعل الحالة في Mantis صراحةً:

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
- `discord-qa-observed-messages.json` — تُحجب النصوص ما لم يكن `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` و`discord-status-reactions-tool-only-timeline.png` عند تشغيل سيناريو تفاعل الحالة.

### QA لـ Slack

```bash
pnpm openclaw qa slack
```

يستهدف قناة Slack خاصة حقيقية واحدة مع بوتين مميزين: بوت سائق يتحكم به الحزام، وبوت SUT يبدأه Gateway فرعي لـ OpenClaw عبر Plugin Slack المضمن.

متغيرات البيئة المطلوبة عند `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختياري:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` يُبقي نصوص الرسائل في آثار الرسائل المرصودة.

السيناريوهات (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

آثار الإخراج:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — تُحجب النصوص ما لم يكن `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### مجموعة بيانات اعتماد Convex

يمكن لمسارات Telegram وDiscord وSlack استئجار بيانات اعتماد من مجموعة Convex مشتركة بدلًا من قراءة متغيرات البيئة أعلاه. مرّر `--credential-source convex` (أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)؛ يحصل QA Lab على استئجار حصري، ويرسل له Heartbeat طوال مدة التشغيل، ويحرره عند الإيقاف. أنواع المجموعة هي `"telegram"` و`"discord"` و`"slack"`.

أشكال الحمولة التي يتحقق منها الوسيط عند `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — يجب أن يكون `groupId` سلسلة معرّف محادثة رقمية.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

توجد متغيرات بيئة التشغيل وعقدة نقطة نهاية وسيط Convex في [الاختبار → بيانات اعتماد Telegram المشتركة عبر Convex](/ar/help/testing#shared-telegram-credentials-via-convex-v1) (اسم القسم يسبق دعم Discord؛ دلالات الوسيط متطابقة لكلا النوعين).

## بذور مدعومة بالمستودع

توجد أصول البذور في `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

هذه موجودة عمدًا في git لكي تكون خطة QA مرئية لكل من البشر
والوكيل.

ينبغي أن يبقى `qa-lab` مشغّل Markdown عامًا. كل ملف سيناريو Markdown هو
مصدر الحقيقة لتشغيل اختبار واحد ويجب أن يعرّف:

- بيانات السيناريو الوصفية
- بيانات وصفية اختيارية للفئة، والإمكانية، والمسار، والمخاطر
- مراجع الوثائق والكود
- متطلبات Plugin اختيارية
- رقعة إعداد Gateway اختيارية
- `qa-flow` القابل للتنفيذ

يُسمح بأن يبقى سطح التشغيل القابل لإعادة الاستخدام الذي يدعم `qa-flow` عامًا
وعابرًا للمجالات. على سبيل المثال، يمكن لسيناريوهات Markdown الجمع بين
مساعدات جهة النقل ومساعدات جهة المتصفح التي تقود Control UI المضمنة عبر
تماس Gateway `browser.request` من دون إضافة مشغّل حالة خاصة.

يجب تجميع ملفات السيناريو حسب إمكانية المنتج بدلًا من مجلد شجرة المصدر.
أبقِ معرّفات السيناريو مستقرة عند نقل الملفات؛ واستخدم `docsRefs` و`codeRefs`
لتتبّع التنفيذ.

يجب أن تبقى قائمة الأساس عريضة بما يكفي لتغطية:

- محادثات DM والقنوات
- سلوك السلاسل
- دورة حياة إجراء الرسائل
- استدعاءات Cron الراجعة
- استدعاء الذاكرة
- تبديل النماذج
- تسليم الوكيل الفرعي
- قراءة المستودع وقراءة الوثائق
- مهمة بناء صغيرة واحدة مثل Lobster Invaders

## مسارات محاكاة الموفّر

لدى `qa suite` مساران محليان لمحاكاة الموفّر:

- `mock-openai` هو محاكاة OpenClaw المدركة للسيناريوهات. يبقى مسار المحاكاة
  الحتمي الافتراضي لـ QA المدعوم بالمستودع وبوابات التكافؤ.
- `aimock` يبدأ خادم موفّر مدعومًا بـ AIMock لتغطية بروتوكول تجريبي،
  ومثبتات، وتسجيل/إعادة تشغيل، وفوضى. وهو إضافي ولا
  يستبدل موزّع سيناريوهات `mock-openai`.

يوجد تنفيذ مسار الموفّر تحت `extensions/qa-lab/src/providers/`.
يملك كل موفّر افتراضياته، وبدء الخادم المحلي، وإعداد نموذج Gateway،
واحتياجات تجهيز ملف تعريف المصادقة، وأعلام إمكانات الحي/المحاكى. يجب أن يوجّه كود الحزمة و
Gateway المشترك عبر سجل الموفّرين بدلًا من التفرع حسب
أسماء الموفّرين.

## محولات النقل

يملك `qa-lab` تماس نقل عامًا لسيناريوهات QA في Markdown. `qa-channel` هو أول محول على هذا التماس، لكن هدف التصميم أوسع: ينبغي للقنوات الحقيقية أو الاصطناعية المستقبلية أن تتصل بمشغّل الحزمة نفسه بدلًا من إضافة مشغّل QA خاص بالنقل.

على مستوى البنية، يكون التقسيم:

- يملك `qa-lab` تنفيذ السيناريو العام، وتزامن العمّال، وكتابة الآثار، والتقارير.
- يملك محول النقل إعداد Gateway، والجاهزية، والمراقبة الواردة والصادرة، وإجراءات النقل، وحالة النقل الموحّدة.
- تعرّف ملفات سيناريوهات Markdown تحت `qa/scenarios/` تشغيل الاختبار؛ ويوفر `qa-lab` سطح التشغيل القابل لإعادة الاستخدام الذي ينفذها.

### إضافة قناة

تتطلب إضافة قناة إلى نظام QA في Markdown شيئين بالضبط:

1. محول نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تضف جذر أمر QA جديدًا في المستوى الأعلى عندما يستطيع مضيف `qa-lab` المشترك امتلاك التدفق.

`qa-lab` يملك آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء المجموعة وإيقافها
- تزامن العمال
- كتابة الأثر
- توليد التقارير
- تنفيذ السيناريوهات
- أسماء توافقية بديلة لسيناريوهات `qa-channel` الأقدم

Plugins المُشغِّلات تملك عقد النقل:

- كيفية تركيب `openclaw qa <runner>` أسفل جذر `qa` المشترك
- كيفية إعداد Gateway لذلك النقل
- كيفية التحقق من الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية مراقبة الرسائل الصادرة
- كيفية كشف النصوص وحالة النقل المُطبَّعة
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة الضبط أو التنظيف الخاصين بالنقل

الحد الأدنى لاعتماد قناة جديدة:

1. أبقِ `qa-lab` مالكًا لجذر `qa` المشترك.
2. نفّذ مشغّل النقل على حدّ مضيف `qa-lab` المشترك.
3. أبقِ الآليات الخاصة بالنقل داخل Plugin المُشغِّل أو حزمة اختبار القناة.
4. ركّب المشغّل كـ `openclaw qa <runner>` بدلًا من تسجيل أمر جذري منافس. يجب أن تعلن Plugins المُشغِّلات عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`. أبقِ `runtime-api.ts` خفيفًا؛ يجب أن يبقى تنفيذ CLI الكسول والمشغّل خلف نقاط دخول منفصلة.
5. أنشئ أو وائم سيناريوهات Markdown ضمن أدلة `qa/scenarios/` ذات السمات.
6. استخدم مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. أبقِ الأسماء البديلة التوافقية الحالية عاملة ما لم يكن المستودع ينفذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا أمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحد، فأبقِه في Plugin ذلك المشغّل أو حزمة اختبار Plugin.
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

تبقى الأسماء البديلة التوافقية متاحة للسيناريوهات الحالية — `waitForQaChannelReady` و`waitForOutboundMessage` و`waitForNoOutbound` و`formatConversationTranscript` و`resetBus` — لكن يجب أن تستخدم كتابة السيناريوهات الجديدة الأسماء العامة. توجد الأسماء البديلة لتجنب ترحيل شامل في يوم واحد، لا كنموذج مستقبلي.

## التقارير

يصدّر `qa-lab` تقرير بروتوكول Markdown من الخط الزمني المرصود للحافلة.
يجب أن يجيب التقرير عن:

- ما الذي عمل
- ما الذي فشل
- ما الذي بقي محجوبًا
- ما سيناريوهات المتابعة الجديرة بالإضافة

لجرد السيناريوهات المتاحة — وهو مفيد عند تقدير حجم عمل المتابعة أو توصيل نقل جديد — شغّل `pnpm openclaw qa coverage` (أضف `--json` لإخراج قابل للقراءة آليًا).

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

يشغّل الأمر عمليات فرعية محلية لـ QA Gateway، لا Docker. يجب أن تضبط سيناريوهات تقييم الشخصية الشخصيةَ عبر `SOUL.md`، ثم تشغّل أدوار مستخدم عادية مثل الدردشة، ومساعدة مساحة العمل، ومهام الملفات الصغيرة. يجب ألا يُخبَر النموذج المرشح بأنه قيد التقييم. يحافظ الأمر على كل نص كامل، ويسجل إحصاءات التشغيل الأساسية، ثم يطلب من نماذج التحكيم في الوضع السريع مع استدلال `xhigh` حيثما كان مدعومًا ترتيبَ التشغيلات حسب الطبيعية، والانطباع، والفكاهة.
استخدم `--blind-judge-models` عند مقارنة المزوّدين: ما يزال موجه التحكيم يحصل على كل نص وحالة تشغيل، لكن تُستبدل مراجع المرشحين بتسميات محايدة مثل `candidate-01`؛ ثم يربط التقرير الترتيبات بالمراجع الحقيقية بعد التحليل.
تستخدم تشغيلات المرشحين افتراضيًا تفكير `high`، مع `medium` لـ GPT-5.5 و`xhigh`
لمراجع تقييم OpenAI الأقدم التي تدعمه. تجاوز مرشحًا محددًا ضمنيًا باستخدام
`--model provider/model,thinking=<level>`. ما يزال `--thinking <level>` يضبط
بديلًا عامًا، ويُحتفظ بالصيغة الأقدم `--model-thinking <provider/model=level>`
للتوافق.
تستخدم مراجع مرشحي OpenAI الوضع السريع افتراضيًا بحيث تُستخدم المعالجة ذات الأولوية حيث يدعمها المزوّد. أضف `,fast` أو `,no-fast` أو `,fast=false` ضمنيًا عندما يحتاج مرشح أو محكّم واحد إلى تجاوز. مرّر `--fast` فقط عندما تريد فرض الوضع السريع على كل نموذج مرشح. تُسجل مدد المرشحين والمحكّمين في التقرير لتحليل المقاييس، لكن موجهات التحكيم تنص صراحة على عدم الترتيب حسب السرعة.
تستخدم تشغيلات نماذج المرشحين والمحكّمين افتراضيًا تزامنًا قدره 16. خفّض
`--concurrency` أو `--judge-concurrency` عندما تجعل حدود المزوّد أو ضغط Gateway المحلي التشغيل كثير الضجيج.
عند عدم تمرير أي مرشح `--model`، يستخدم تقييم الشخصية افتراضيًا
`openai/gpt-5.5` و`openai/gpt-5.2` و`openai/gpt-5` و`anthropic/claude-opus-4-6`
و`anthropic/claude-sonnet-4-6` و`zai/glm-5.1`
و`moonshot/kimi-k2.5` و
`google/gemini-3.1-pro-preview` عندما لا يُمرَّر أي `--model`.
عند عدم تمرير أي `--judge-model`، يستخدم المحكّمون افتراضيًا
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high`.

## المستندات ذات الصلة

- [مصفوفة QA](/ar/concepts/qa-matrix)
- [قناة QA](/ar/channels/qa-channel)
- [الاختبار](/ar/help/testing)
- [لوحة المعلومات](/ar/web/dashboard)
