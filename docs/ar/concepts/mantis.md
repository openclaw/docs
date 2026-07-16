---
read_when:
    - بناء أو تشغيل ضمان الجودة المرئي المباشر لأخطاء OpenClaw
    - إضافة التحقق قبل طلب السحب وبعده
    - إضافة سيناريوهات Discord أو Slack أو WhatsApp أو غيرها من سيناريوهات النقل المباشر
    - تشغيل إثبات متصفح مركّز لواجهة التحكم لمرجع مرشّح
    - تصحيح أخطاء عمليات ضمان الجودة التي تتطلب لقطات شاشة أو أتمتة المتصفح أو الوصول عبر VNC
summary: يلتقط Mantis أدلة مرئية شاملة من البداية إلى النهاية لإجراء مقارنات مباشرة لوسائل النقل وإثباتات مركّزة عبر المتصفح تقتصر على المرشّح، ثم يرفق المخرجات بطلبات السحب.
title: Mantis
x-i18n:
    generated_at: "2026-07-16T13:43:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

تنشر Mantis أدلة CI مرئية وتعليقًا على طلب سحب لسلوك OpenClaw.
تقارن سيناريوهات النقل المباشر خط أساس معروفًا بأنه معيب بمرجع مرشح؛
وقد تثبت مسارات المتصفح المركزة بدلًا من ذلك مرشحًا واحدًا مقابل
نقل محاكى حتمي. صدر دعم Discord أولًا مع مصادقة حقيقية للبوت، وقنوات الخادم،
والتفاعلات، وسلاسل المحادثات، وشاهد عبر المتصفح. توجد أيضًا مسارات Slack وTelegram ودردشة Control
UI المركزة؛ أما WhatsApp وMatrix فلم تُنفذا بعد.

## الملكية

- OpenClaw (`extensions/qa-lab/src/mantis/*`): وقت تشغيل السيناريو، وCLI `pnpm openclaw qa mantis <command>`، ومخطط الأدلة.
- مختبر ضمان الجودة (`extensions/qa-lab/src/live-transports/*`): بيئة اختبار النقل المباشر، وبوتات برنامج التشغيل/النظام قيد الاختبار، وأدوات كتابة التقارير/الأدلة.
- Crabbox (`openclaw/crabbox`): أجهزة Linux مجهزة مسبقًا، وعقود إيجار، وVNC، و`crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): نقاط الدخول البعيدة، والاحتفاظ بالمنتجات الأثرية.
- ClawSweeper: يحلل أوامر المشرف في طلبات السحب، ويشغّل تدفقات العمل، وينشر التعليق النهائي على طلب السحب.

## أوامر CLI

جميع الأوامر هي `pnpm openclaw qa mantis <command>`، ومُعرّفة في
`extensions/qa-lab/src/mantis/cli.ts`. تتطلب `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
في وقت البناء/التشغيل (تضبط تدفقات العمل المضمنة `OPENCLAW_BUILD_PRIVATE_QA=1` و
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` قبل البناء).

| الأمر                           | الغرض                                                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | التحقق من أن بوت Mantis على Discord يمكنه رؤية الخادم/القناة والنشر وإضافة تفاعل.                                                                         |
| `run`                           | تشغيل سيناريو قبل/بعد مقابل مرجعي خط الأساس والمرشح (Discord فقط).                                                                                        |
| `desktop-browser-smoke`         | استئجار سطح مكتب Crabbox أو إعادة استخدامه، وفتح متصفح مرئي، والتقاط لقطة شاشة + فيديو.                                                                    |
| `slack-desktop-smoke`           | استئجار سطح مكتب Crabbox أو إعادة استخدامه، وتشغيل ضمان جودة Slack داخله، وفتح Slack Web، والتقاط الأدلة.                                                 |
| `telegram-desktop-builder`      | استئجار سطح مكتب Crabbox أو إعادة استخدامه، وتثبيت Telegram Desktop، وتهيئة Gateway لـ OpenClaw اختياريًا.                                                |
| `visual-task` / `visual-driver` | التقاط عام لسطح مكتب Crabbox مع تأكيدات اختيارية لفهم الصور؛ `visual-driver` هو جزء برنامج التشغيل الذي يُشغّل ضمن `crabbox record --while`. |

يقبل كل أمر `--repo-root <path>` و`--output-dir <path>`؛ كما تقبل أوامر Crabbox
`--crabbox-bin`، و`--provider`، و`--machine-class`/`--class`،
و`--lease-id`، و`--idle-timeout`، و`--ttl`، و`--keep-lease`. القيم المحلية الافتراضية في CLI
للمزود/الفئة هي `hetzner`/`beast` ما لم يُذكر خلاف ذلك؛ وعادةً ما تتجاوز
تدفقات عمل CI كلتيهما.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

يستدعي واجهة Discord REST API ‏(`https://discord.com/api/v10`) لجلب مستخدم البوت،
والخادم، وقنوات الخادم، والقناة المستهدفة، ويتحقق من أن
القناة تنتمي إلى الخادم، ثم ينشر رسالة (ما لم يكن `--skip-post`) ويضيف
تفاعل `👀`. يكتب `mantis-discord-smoke-summary.json` و
`mantis-discord-smoke-report.md`.

ترتيب حل الرمز المميز: قيمة `--token-file`، ثم `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(يمكن تجاوزها باستخدام `--token-env`)، ثم ملف يسميه `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(يمكن تجاوزه باستخدام `--token-file-env`). تأتي معرفات الخادم/القناة من
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (يمكن تجاوزها باستخدام
`--guild-id` / `--channel-id`) ويجب أن تكون معرفات Snowflake في Discord مكونة من 17-20 رقمًا. اضبط
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لاستبدال معرفات البوت/الخادم/القناة/الرسالة
وأسمائها بـ `<redacted>` في الملخص والتقرير المنشورين.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

لا يقبل `--transport` حاليًا سوى `discord`. يمثّل `--scenario` واحدًا من
معرّفين مضمّنين، ولكل منهما مرجع خط أساس افتراضي وتسميات متوقعة لما قبل/بعد
(`extensions/qa-lab/src/mantis/run.runtime.ts`):

| السيناريو                                  | خط الأساس الافتراضي                        | توقعات خط الأساس                        | توقعات المرشح                 |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | يغفل رد سلسلة المحادثة مرفق `filePath` | يتضمنه رد سلسلة المحادثة     |

القيمة الافتراضية لـ `--candidate` هي `HEAD`. العلامات الأخرى: `--credential-source`
(الافتراضي `convex`)، و`--credential-role` (الافتراضي `ci`)، و`--provider-mode`
(الافتراضي `live-frontier`)، و`--fast` (مفعّل افتراضيًا)، و`--skip-install`، و`--skip-build`.

ينشئ المشغّل عمليات سحب منفصلة لـ `git worktree` لخط الأساس
والمرشح ضمن `<output-dir>/worktrees/`، ويشغّل `pnpm install`/`pnpm build` في
كل منهما (ما لم يتم التخطي)، ثم يشغّل
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
مقابل كل شجرة عمل. يكتب كل مسار `discord-qa-reaction-timelines.json`
بالإضافة إلى زوج `<scenario-id>-timeline.html`/`.png`؛ وينسخ المشغّل هذه
الأدلة مرة أخرى ضمن `baseline/`/`candidate/`، ويكتب `comparison.json`،
و`mantis-report.md`، و`mantis-evidence.json` في دليل المخرجات، ويخرج
برمز غير صفري إذا لم تنجح المقارنة (خط الأساس `fail` والمرشح
`pass`).

ينشر سيناريو Discord الثاني (`discord-thread-reply-filepath-attachment`)
رسالة أصلية باستخدام بوت برنامج التشغيل، وينشئ سلسلة محادثة حقيقية، ويستدعي إجراء
`message.thread-reply` للنظام قيد الاختبار باستخدام `filePath` محلي للمستودع، ثم يستعلم دوريًا من
سلسلة المحادثة عن الرد واسم ملف المرفق. ويتوقع مرفقًا
باسم `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

يستأجر سطح مكتب Crabbox أو يعيد استخدامه، ويشغّل متصفحًا داخل جلسة VNC
موجّهًا إلى `--browser-url` (الافتراضي `https://openclaw.ai`) أو
`--html-file` معروض، وينتظر، ويلتقط لقطة شاشة باستخدام `scrot`، ويسجّل اختياريًا ملف MP4 باستخدام
`ffmpeg`، ويزامن `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
عكسيًا إلى `--output-dir`.

العلامات:

- `--lease-id <cbx_...>` يعيد استخدام سطح مكتب مجهز مسبقًا بدلًا من إنشاء واحد.
- `--browser-profile-dir <remote-path>` يعيد استخدام دليل بيانات مستخدم Chrome بعيد بحيث يظل سطح المكتب الدائم مسجّل الدخول بين عمليات التشغيل (يُستخدم لملف تعريف طويل الأمد لعارض Discord Web).
- `--browser-profile-archive-env <name>` يستعيد أرشيف ملف تعريف Chrome بتنسيق base64 ‏`.tgz` من متغير البيئة ذاك قبل التشغيل (الافتراضي `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`)؛ ويُستخدم للشهود المسجّلين الدخول مثل Discord Web.
- `--video-duration <seconds>` يتحكم في مدة التقاط MP4 (الافتراضي 10s).
- `--keep-lease` (أو `OPENCLAW_MANTIS_KEEP_VM=1`) يُبقي عقد الإيجار الذي أنشأه هذا التشغيل مفتوحًا للفحص عبر VNC؛ كما تُبقي عمليات التشغيل الفاشلة التي أنشأت عقد إيجار عليه افتراضيًا.

بالنسبة إلى أدلة Discord Web، تستخدم Mantis حساب عارض مخصصًا، وليس رمز
بوت. تظل أداة التحقق المرجعية عبر Discord REST (من خلال `qa discord`) هي المرجع الموثوق؛ وعند
ضبط `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`، يكتب السيناريو أيضًا
منتجًا أثريًا لعنوان URL في Discord Web، ويترك `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`
سلسلة المحادثة مفتوحة مدة كافية ليفتحها المتصفح.

يفضّل تدفق عمل GitHub ملف تعريف عارض دائمًا من خلال
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (قد تتجاوز أرشيفات ملف التعريف الكاملة
حد حجم الأسرار في GitHub)؛ وبالنسبة إلى ملفات التعريف الصغيرة/الأولية، يمكنه بدلًا من ذلك استعادة
`.tgz` بتنسيق base64 من `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. عند عدم تهيئة
أي من المصدرين، يظل تدفق العمل ينشر لقطات شاشة خط الأساس/المرشح الحتمية
ويسجّل أنه تم تخطي الشاهد المسجّل الدخول.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر سطح مكتب Crabbox أو يعيد استخدامه، ويزامن نسخة العمل مع الآلة الافتراضية، ويشغّل
`pnpm openclaw qa slack` داخلها، ويفتح Slack Web في متصفح VNC،
ويلتقط سطح المكتب، وينسخ كلًا من منتجات ضمان جودة Slack الأثرية (`slack-qa/`) و
لقطة شاشة/فيديو VNC إلى البيئة المحلية. هذا هو شكل Mantis الوحيد الذي يعمل فيه
Gateway للنظام قيد الاختبار والمتصفح داخل الآلة الافتراضية نفسها.

باستخدام `--gateway-setup`، ينشئ الأمر دليل OpenClaw رئيسيًا دائمًا وقابلًا للتخلص منه
في `$HOME/.openclaw-mantis/slack-openclaw` داخل الآلة الافتراضية، ويعدّل تهيئة Slack
Socket Mode للقناة المستهدفة، ويبدأ
`openclaw gateway run --dev --allow-unconfigured --port 38973`، ويترك
Chrome قيد التشغيل في جلسة VNC؛ ويؤدي حذف `--gateway-setup` إلى تشغيل
مسار ضمان جودة Slack العادي من بوت إلى بوت بدلًا من ذلك.

متغيرات البيئة المطلوبة لـ `--credential-source env` (القيمة المحلية الافتراضية هي `env`؛ والقيمة
الافتراضية للدور هي `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` لمسار النموذج البعيد (إذا كان `OPENAI_API_KEY`
  فقط مضبوطًا محليًا، تنسخه Mantis إلى `OPENCLAW_LIVE_OPENAI_KEY` قبل
  استدعاء Crabbox)

باستخدام `--credential-source convex`، تستأجر Mantis بيانات اعتماد النظام قيد الاختبار لـ Slack من
المجموعة المشتركة قبل إنشاء الآلة الافتراضية، وتمرّر معرّف القناة ورمز التطبيق ورمز
البوت إلى الآلة الافتراضية كمتغيرات بيئة `OPENCLAW_MANTIS_SLACK_*`، بحيث لا تحتاج تدفقات عمل GitHub
إلا إلى سر وسيط Convex، وليس رموز Slack الأولية.

العلامات الأخرى: يفتح `--slack-url <url>` عنوان URL محددًا (وإلا تشتق Mantis
`https://app.slack.com/client/<team>/<channel>` من `auth.test`)؛
ويعيّن `--slack-channel-id <id>` قناة قائمة السماح في Gateway؛
ويتحكم `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` في ملف تعريف Chrome الدائم
داخل الآلة الافتراضية (الافتراضي `$HOME/.config/openclaw-mantis/slack-chrome-profile`)؛
ويشغّل `--approval-checkpoints` سيناريوهات الموافقة الأصلية في Slack
(`slack-approval-exec-native`، و`slack-approval-plugin-native`) ويعرض
لقطات شاشة لنقاط التحقق المعلقة/المحلولة بدلًا من إعداد Gateway (يتعارض
مع `--gateway-setup`)؛ وتُمرر `--hydrate-mode source|prehydrated`،
و`--provider-mode`، و`--model`، و`--alt-model`، و`--fast` إلى
مسار Slack المباشر.

تُعرض لقطات شاشة نقاط تحقق الموافقة من رسالة Slack API التي
رصدها السيناريو، وليس من واجهة Slack المباشرة؛ ولا يُعد `slack-desktop-smoke.png`
دليلًا على Slack Web نفسه إلا إذا كان ملف تعريف متصفح عقد الإيجار مسجّل
الدخول مسبقًا.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

يستأجر سطح مكتب Crabbox أو يعيد استخدامه، ويثبّت تطبيق Telegram Desktop الأصلي لنظام Linux،
ويستعيد اختياريًا أرشيف جلسة مستخدم، ويهيئ OpenClaw باستخدام
رمز بوت النظام قيد الاختبار لـ Telegram المستأجر، ويبدأ
`openclaw gateway run --dev --allow-unconfigured --port 38974`، وينشر
رسالة جاهزية من بوت برنامج التشغيل إلى المجموعة الخاصة المستأجرة، ثم يلتقط
لقطة شاشة وملف MP4. لا يهيئ رمز البوت سوى OpenClaw؛ ولا يسجّل
الدخول إلى Telegram Desktop مطلقًا. عارض سطح المكتب هو جلسة مستخدم Telegram منفصلة
تُستعاد من `--telegram-profile-archive-env <name>` أو يُسجّل الدخول إليها يدويًا
عبر VNC وتُبقى نشطة باستخدام `--keep-lease`.

العلامات: يعيد `--lease-id <cbx_...>` التشغيل مقابل آلة افتراضية سبق تسجيل الدخول فيها إلى
Telegram Desktop؛ ويستعيد `--telegram-profile-archive-env <name>` أرشيف
ملف تعريف `.tgz` بتنسيق base64 قبل التشغيل؛ ويعيّن `--telegram-profile-dir <remote-path>`
دليل ملف التعريف البعيد (الافتراضي `$HOME/.local/share/TelegramDesktop`)؛
ويثبّت `--no-gateway-setup` تطبيق Telegram Desktop ويفتحه فقط؛
والقيم الافتراضية لـ `--credential-source`/`--credential-role` هي `convex`/`maintainer`.

## بيان الأدلة

كل سيناريو ينشر إلى طلب سحب يكتب `mantis-evidence.json` بجوار
تقريره:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "ضمان جودة تفاعلات حالة Discord في Mantis",
  "summary": "ملخص علوي مقروء للبشر لتعليق طلب السحب.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "في قائمة الانتظار فقط" },
    "candidate": { "sha": "...", "status": "pass", "expected": "في قائمة الانتظار -> يفكر -> انتهى" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "خط الأساس في قائمة الانتظار فقط",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "مخطط Discord الزمني لخط الأساس",
      "width": 420
    }
  ]
}
```

يكون `path` للأثر نسبيًا إلى دليل البيان؛ ويكون `targetPath`
نسبيًا إلى بادئة أثر R2/S3 المهيأة. يرفض `scripts/mantis/publish-pr-evidence.mjs`
اجتياز المسار ويتخطى الإدخالات التي تحتوي على `"required": false` عندما يكون
الملف مفقودًا.

أنواع الآثار: `timeline` (لقطة شاشة حتمية قبل/بعد)،
`desktopScreenshot` (لقطة شاشة VNC/المتصفح)، `motionPreview` (ملف GIF متحرك
مضمّن من التسجيل)، `motionClip` (ملف MP4 مقتطع حسب الحركة)، `fullVideo` (التسجيل
الكامل)، `metadata` (ملف JSON/سجل جانبي)، `report` (تقرير Markdown).

تخطيط آثار التشغيل على القرص:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

لقطات الشاشة أدلة وليست أسرارًا، لكنها لا تزال تتطلب انضباطًا في التنقيح:
قد تظهر أسماء القنوات الخاصة أو أسماء المستخدمين أو محتوى الرسائل. اضبط
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لعمليات رفع الآثار العامة؛ وهو
مفعّل افتراضيًا في تدفقات عمل GitHub الخاصة بـ Discord/Slack/Telegram.

## أتمتة GitHub

يمثل `scripts/mantis/publish-pr-evidence.mjs` الناشر القابل لإعادة الاستخدام. تستدعيه تدفقات العمل
مع البيان وطلب السحب المستهدف وجذر وجهة الآثار وعلامة التعليق
وعنوان URL للأثر وعنوان URL للتشغيل ومصدر الطلب. يرفع الآثار المعلنة إلى
حاوية Mantis في R2، وينشئ تعليقًا لطلب السحب يبدأ بالملخص ويحتوي على
صور/معاينات مضمّنة وفيديوهات مرتبطة، ثم يحدّث تعليق العلامة الحالي أو
ينشئ تعليقًا جديدًا. متغيرات البيئة المطلوبة:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (تضبط تدفقات العمل `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (تضبط تدفقات العمل `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (تضبط تدفقات العمل `https://artifacts.openclaw.ai`)

تُنشر التعليقات عبر تطبيق Mantis في GitHub ‏(`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`)، وليس `github-actions[bot]`، باستخدام
تعليق علامة مخفي كمفتاح للإدراج أو التحديث.

| تدفق العمل                          | المشغّل                                                                                    | ما يفعله                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | تشغيل يدوي                                                                            | يشغّل `discord-smoke` مقابل مرجع مختار.                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | تعليق على طلب سحب أو تشغيل يدوي                                                              | ينشئ شجرتي عمل منفصلتين لخط الأساس والنسخة المرشحة، ويشغّل `discord-status-reactions-tool-only` على كل منهما، ويعرض المخطط الزمني لكل مسار في متصفح سطح مكتب Crabbox، وينشئ معاينات GIF/MP4 مقتطعة حسب الحركة باستخدام `crabbox media preview`، ويرفع الآثار، وينشر الأدلة المضمّنة في طلب السحب.                                 |
| `Mantis Scenario`                 | تشغيل يدوي                                                                            | موزّع عام: يأخذ `scenario_id` ‏(`discord-status-reactions-tool-only`، `discord-thread-reply-filepath-attachment`، `slack-desktop-smoke`، `telegram-live`، `telegram-desktop-proof`، `web-ui-chat-proof`)، و`baseline_ref`، و`candidate_ref`، و`pr_number`، ويمررها إلى تدفق عمل السيناريو المطابق. |
| `Mantis Slack Desktop Smoke`      | تشغيل يدوي                                                                            | يستأجر سطح مكتب Linux من Crabbox (افتراضيًا `aws`، مع خيار `hetzner`)، ويشغّل `slack-desktop-smoke --gateway-setup` مقابل النسخة المرشحة، ويسجل سطح المكتب، وينشئ معاينة حركة، ويرفع الآثار، وينشر أدلة طلب السحب عند توفير رقم طلب سحب.                                                      |
| `Mantis Telegram Live`            | تعليق على طلب سحب أو تشغيل يدوي                                                              | يشغّل مسار ضمان الجودة المباشر لـ Telegram عبر واجهة API للبوت (`openclaw qa telegram`)، ويكتب `mantis-evidence.json` من ملخص ضمان الجودة، ويعرض HTML للأدلة المنقحة عبر متصفح سطح مكتب Crabbox، وينشئ ملف GIF للحركة، وينشر أدلة طلب السحب. لا يلزم تسجيل الدخول إلى Telegram Web لهذا المسار.                               |
| `Mantis Telegram Desktop Proof`   | تسمية طلب سحب من المشرف (`mantis: telegram-visible-proof`) مع تعليق على طلب السحب، أو تشغيل يدوي | إثبات وكيل أصلي قبل/بعد عبر Telegram Desktop. يسلّم طلب السحب ومراجع خط الأساس/النسخة المرشحة وتعليمات المشرف إلى Codex، الذي يشغّل مسار إثبات Telegram Desktop للمستخدم الحقيقي في Crabbox لكلا المرجعين وينشر جدول أدلة من عمودين في طلب السحب.                                                              |
| `Mantis Web UI Chat Proof`        | تعليق على طلب سحب أو تشغيل يدوي                                                              | يشغّل إثبات Playwright المركّز لدردشة واجهة تحكم OpenClaw مقابل النسخة المرشحة، ويتحقق من أن المتصفح يرسل عبر Gateway المحاكى، ويلتقط آثار لقطات الشاشة/الفيديو، وينشر أدلة طلب السحب. هذا المسار مخصص لإثبات دردشة الويب فقط، وليس WinUI/التطبيق الأصلي أو الإثبات المرئي الاعتباطي.                           |

يقبل كل من `Mantis Discord Status Reactions` و`Mantis Telegram Live`
‏`baseline_ref`/`candidate_ref` (أو `baseline=`/`candidate=` في تعليق على طلب سحب)
ويتحققان من أن SHA المحلول إما سلف لـ `origin/main`، أو
وسم إصدار (`v*`)، أو رأس طلب سحب مفتوح قبل التشغيل باستخدام
بيانات اعتماد تتضمن أسرارًا.

مشغّلات التعليقات، من طلب سحب يملك صلاحية الكتابة/الصيانة/الإدارة:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

تستخدم مشغّلات تعليقات Telegram افتراضيًا SHA لرأس طلب السحب باعتباره النسخة المرشحة و
`telegram-status-command` باعتباره السيناريو؛ وتقبل `provider=aws|hetzner` و
`lease=<cbx_...>` لاستهداف مزوّد Crabbox محدد أو سطح مكتب
مُسخّن مسبقًا. لا يستجيب `Mantis Telegram Desktop Proof` لتعليق على طلب سحب إلا عندما
يحمل طلب السحب مسبقًا التسمية `mantis: telegram-visible-proof`.

تستخدم مشغّلات تعليقات دردشة واجهة الويب افتراضيًا SHA لرأس طلب السحب باعتباره النسخة المرشحة. وهي تشغّل
إثبات دردشة واجهة التحكم مع Gateway المحاكى وتنشر آثار المتصفح؛ استخدم
إثبات Playwright/المتصفح العادي أو لقطات شاشة المشرف أو Crabbox أو الآثار
المحلية لصفحات الويب الأخرى وأسطح التطبيقات الأصلية.

يمكن لـ ClawSweeper أيضًا تشغيل سيناريو مباشرة:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## الأجهزة والأسرار

الإعدادات الافتراضية المحلية لـ Crabbox عبر CLI هي `--provider hetzner --class beast`؛ ويمكن تجاوزها
باستخدام `--provider`، أو `--class`/`--machine-class`، أو
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. تتجاوز تدفقات عمل GitHub
كلا الإعدادين عادةً (على سبيل المثال `--class standard`، ومدخل اختيار المزوّد
`aws`/`hetzner` في تدفق عمل Slack). إذا كان أحد المزوّدين
بطيئًا جدًا أو غير متاح، فأضفه خلف واجهة Crabbox نفسها بدلًا من
ترميز بديل احتياطي بصورة ثابتة.

خط أساس الآلة الافتراضية: Linux مع Chrome/Chromium قادر على العمل في بيئة سطح مكتب، ووصول CDP، وVNC/
noVNC، وNode 22.22.3+ أو 24.15+ أو 25.9+ وpnpm، ونسخة عمل من OpenClaw،
ووصول صادر إلى وسيلة النقل المستهدفة وGitHub ومزوّدي النماذج
ووسيط بيانات الاعتماد.

أسماء بيانات الاعتماد والبيئة المستخدمة عبر أوامر Mantis وتدفقات العمل:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- يتطلب `qa mantis run --credential-source env` المحلي أيضًا
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`، و`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`،
  و`OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`. تستخدم تدفقات عمل GitHub عادةً
  `--credential-source convex` وبيانات اعتماد الوسيط أدناه بدلًا من رموز
  بوت Discord الأولية.
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لعمليات رفع الآثار العامة
- `OPENCLAW_QA_CONVEX_SITE_URL`، `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (أو الخاص بإثبات Telegram Desktop
  ‏`OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (تقبل تدفقات العمل أيضًا
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` كبديل احتياطي وتربطها
  بالأسماء العادية قبل استدعاء Crabbox)
- `CRABBOX_ACCESS_CLIENT_ID`، `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`، `MANTIS_GITHUB_APP_PRIVATE_KEY`

يجب ألا يطبع مشغّل Mantis مطلقًا رموز بوتات Discord/Slack/Telegram،
أو مفاتيح API للمزوّدين، أو ملفات تعريف ارتباط المتصفح، أو محتويات ملفات تعريف المصادقة، أو كلمات مرور VNC، أو
حمولات بيانات الاعتماد الأولية. إذا تسرّب رمز إلى مشكلة أو طلب سحب أو دردشة أو سجل،
فدوّره بعد تخزين السر البديل.

## نتائج التشغيل

تميّز سيناريوهات النقل قبل/بعد بين هذه النتائج حتى لا تُفسَّر
البيئة غير المستقرة على أنها تراجع في المنتج:

- **أُعيد إنتاج الخلل**: فشل خط الأساس بالطريقة التي يتوقعها السيناريو.
- **فشل الحزمة الاختبارية**: فشل إعداد البيئة أو بيانات الاعتماد أو واجهة API للنقل أو المتصفح
  أو المزوّد قبل أن يصبح معيار التحقق ذا دلالة.

يفيد إثبات المتصفح للنسخة المرشحة فقط بما إذا كانت النسخة المرشحة قد اجتازت
تأكيدات Gateway المحاكى وواجهة المستخدم المرئية؛ ولا يدّعي إعادة إنتاج خط الأساس.

## إضافة سيناريو

تُعرَّف سيناريوهات النقل المباشر باستخدام TypeScript لكل وسيلة نقل (راجع
`MANTIS_SCENARIO_CONFIGS` في `extensions/qa-lab/src/mantis/run.runtime.ts`
لشكل Discord قبل/بعد)، وليست تنسيق ملفات تصريحيًا مستقلًا.
يحتاج كل سيناريو إلى: معرّف وعنوان، ووسيلة نقل، وبيانات الاعتماد المطلوبة، وسياسة
مرجع خط الأساس، وسياسة مرجع النسخة المرشحة، وتصحيح إعداد OpenClaw، وخطوات الإعداد/التحفيز،
ومعيار التحقق المتوقع لخط الأساس والنسخة المرشحة، وأهداف الالتقاط المرئي، وميزانية
المهلة الزمنية، وخطوات التنظيف.

يمكن لإثبات المتصفح المركّز على النسخة المرشحة فقط استخدام اختبار E2E حتمي مخصص
وتدفق عمل. أبقِ نطاقه صريحًا، وتحقق من مرجع النسخة المرشحة قبل
التنفيذ، واعزل النشر المدعوم بالأسرار، وأصدر عقد بيان
الأدلة نفسه.

فضّل معايير تحقق صغيرة ومحددة الأنواع على الفحوص المرئية: حالة تفاعلات Discord أو
مراجع الرسائل، وحالة واجهة API لـ `ts`/التفاعلات في سلسلة رسائل Slack، ومعرّفات رسائل البريد الإلكتروني
وترويساتها. استخدم لقطات شاشة المتصفح عندما تكون واجهة المستخدم هي العنصر الوحيد القابل للملاحظة بصورة موثوقة،
واجعل الفحوص المرئية إضافة إلى معيار تحقق واجهة API للمنصة حيثما وُجد.

بعد Discord وSlack وTelegram، يمتد شكل المشغّل نفسه إلى WhatsApp
(تسجيل الدخول عبر رمز QR، وإعادة تحديد الهوية، والتسليم، والوسائط، والتفاعلات) وMatrix
(الغرف المشفّرة، وعلاقات السلاسل/الردود، واستئناف العمل بعد إعادة التشغيل)؛ ولم يُنفَّذ
أي منهما بعد.

## أسئلة مفتوحة

- أي بوت Discord ينبغي أن يكون برنامج التشغيل، وأيهما النظام قيد الاختبار (SUT)، عند إعادة استخدام بوت Mantis الحالي؟
- ما المدة التي ينبغي أن يحتفظ فيها GitHub بعناصر Mantis الأثرية الخاصة بطلبات السحب؟
- متى ينبغي أن يوصي ClawSweeper تلقائيًا بسيناريو Mantis بدلًا من انتظار أمر من أحد المشرفين؟
- هل ينبغي تنقيح لقطات الشاشة أو اقتصاصها قبل رفعها إلى طلبات السحب العامة؟
