---
read_when:
    - إنشاء أو تشغيل اختبارات ضمان الجودة المرئية المباشرة لأخطاء OpenClaw
    - إضافة التحقق قبل طلب السحب وبعده
    - إضافة سيناريوهات نقل مباشرة لـ Discord أو Slack أو WhatsApp أو غيرها
    - تشغيل إثبات متصفح مركّز لواجهة التحكم لمرجع مرشّح
    - تصحيح أخطاء عمليات ضمان الجودة التي تتطلب لقطات شاشة أو أتمتة المتصفح أو الوصول عبر VNC
summary: يلتقط Mantis أدلة مرئية شاملة للمقارنات المباشرة بين وسائل النقل ولإثباتات المتصفح المركّزة الخاصة بالنسخة المرشحة فقط، ثم يُرفق المخرجات بطلبات السحب.
title: فرس النبي
x-i18n:
    generated_at: "2026-07-12T05:47:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

تنشر Mantis أدلة مرئية للتكامل المستمر وتعليقًا على طلب سحب بشأن سلوك OpenClaw.
تقارن سيناريوهات النقل الحية خط أساس معروفًا بأنه معيب بمرجع مرشح؛
وقد تثبت مسارات المتصفح المركزة بدلًا من ذلك مرشحًا واحدًا مقابل
وسيلة نقل محاكية وحتمية. كان Discord أول ما طُرح، مع مصادقة بوت حقيقية، وقنوات الخادم،
والتفاعلات، وسلاسل المحادثات، وشاهد عبر المتصفح. توجد أيضًا مسارات Slack وTelegram ودردشة
واجهة التحكم المركزة؛ أما WhatsApp وMatrix فلم تُنفّذا بعد.

## الملكية

- OpenClaw (`extensions/qa-lab/src/mantis/*`): وقت تشغيل السيناريو، وواجهة CLI ‏`pnpm openclaw qa mantis <command>`، ومخطط الأدلة.
- مختبر ضمان الجودة (`extensions/qa-lab/src/live-transports/*`): حاضنة اختبار النقل الحي، وبوتات المشغّل والنظام قيد الاختبار، وأدوات كتابة التقارير والأدلة.
- Crabbox (`openclaw/crabbox`): أجهزة Linux مجهّزة مسبقًا، وعقود الاستئجار، وVNC، و`crabbox media preview`.
- إجراءات GitHub (`.github/workflows/mantis-*.yml`): نقاط الدخول البعيدة والاحتفاظ بالمنتجات الأثرية.
- ClawSweeper: يحلل أوامر المشرفين في طلبات السحب، ويشغّل تدفقات العمل، وينشر التعليق النهائي على طلب السحب.

## أوامر CLI

جميع الأوامر بالصيغة `pnpm openclaw qa mantis <command>`، وهي معرّفة في
`extensions/qa-lab/src/mantis/cli.ts`. تتطلب `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
في وقت البناء/التشغيل (تضبط تدفقات العمل المضمّنة `OPENCLAW_BUILD_PRIVATE_QA=1` و
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` قبل البناء).

| الأمر                           | الغرض                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | التحقق من أن بوت Mantis على Discord يستطيع رؤية الخادم/القناة والنشر وإضافة تفاعل.                                                                        |
| `run`                           | تشغيل سيناريو قبل/بعد مقابل مرجعي خط الأساس والمرشح (Discord فقط).                                                                                        |
| `desktop-browser-smoke`         | استئجار/إعادة استخدام سطح مكتب Crabbox، وفتح متصفح مرئي، والتقاط لقطة شاشة + فيديو.                                                                       |
| `slack-desktop-smoke`           | استئجار/إعادة استخدام سطح مكتب Crabbox، وتشغيل ضمان جودة Slack داخله، وفتح Slack Web، والتقاط الأدلة.                                                    |
| `telegram-desktop-builder`      | استئجار/إعادة استخدام سطح مكتب Crabbox، وتثبيت Telegram Desktop، وتهيئة Gateway لـOpenClaw اختياريًا.                                                    |
| `visual-task` / `visual-driver` | التقاط عام لسطح مكتب Crabbox مع تأكيدات اختيارية لفهم الصور؛ و`visual-driver` هو نصف المشغّل الذي يُشغّل ضمن `crabbox record --while`.                    |

يقبل كل أمر `--repo-root <path>` و`--output-dir <path>`؛ كما تقبل أوامر Crabbox
‏`--crabbox-bin` و`--provider` و`--machine-class`/`--class`
و`--lease-id` و`--idle-timeout` و`--ttl` و`--keep-lease`. القيم الافتراضية المحلية
لمزوّد الخدمة/الفئة في CLI هي `hetzner`/`beast` ما لم يُذكر خلاف ذلك؛ وعادةً ما
تتجاوز تدفقات عمل التكامل المستمر كلتيهما.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

يستدعي واجهة Discord REST API ‏(`https://discord.com/api/v10`) لجلب مستخدم
البوت، والخادم، وقنوات الخادم، والقناة المستهدفة، ويتحقق من أن القناة
تنتمي إلى الخادم، ثم ينشر رسالة (ما لم يُستخدم `--skip-post`)
ويضيف تفاعل `👀`. ويكتب `mantis-discord-smoke-summary.json` و
`mantis-discord-smoke-report.md`.

ترتيب تحديد الرمز المميز: قيمة `--token-file`، ثم `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(يمكن تجاوزه باستخدام `--token-env`)، ثم ملف يسمّيه `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(يمكن تجاوزه باستخدام `--token-file-env`). تأتي معرّفات الخادم/القناة من
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (يمكن تجاوزها باستخدام
`--guild-id` / `--channel-id`)، ويجب أن تكون معرّفات Discord ثلجية بطول 17-20 رقمًا. اضبط
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لاستبدال معرّفات وأسماء
البوت/الخادم/القناة/الرسالة بـ`<redacted>` في الملخص والتقرير المنشورين.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

يقبل `--transport` حاليًا `discord` فقط. ويكون `--scenario` أحد معرّفين
مضمّنين، لكل منهما مرجع خط أساس افتراضي وتسميات متوقعة قبل/بعد
(`extensions/qa-lab/src/mantis/run.runtime.ts`):

| السيناريو                                  | خط الأساس الافتراضي                         | المتوقع من خط الأساس                     | المتوقع من المرشح            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | رد سلسلة المحادثة يحذف مرفق `filePath`   | رد سلسلة المحادثة يضمّه      |

القيمة الافتراضية لـ`--candidate` هي `HEAD`. العلامات الأخرى: `--credential-source`
(الافتراضي `convex`)، و`--credential-role` (الافتراضي `ci`)، و`--provider-mode`
(الافتراضي `live-frontier`)، و`--fast` (مفعّل افتراضيًا)، و`--skip-install`، و`--skip-build`.

ينشئ المشغّل نسخ `git worktree` منفصلة لخط الأساس
والمرشح ضمن `<output-dir>/worktrees/`، ويشغّل `pnpm install`/`pnpm build` في
كل منهما (ما لم يتم التخطي)، ثم يشغّل
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
على كل شجرة عمل. يكتب كل مسار `discord-qa-reaction-timelines.json`
بالإضافة إلى زوج `<scenario-id>-timeline.html`/`.png`؛ وينسخ المشغّل هذه
الأدلة مجددًا ضمن `baseline/`/`candidate/`، ويكتب `comparison.json`
و`mantis-report.md` و`mantis-evidence.json` في دليل الإخراج، وينهي
برمز غير صفري إذا لم تنجح المقارنة (خط الأساس `fail` والمرشح
`pass`).

ينشر سيناريو Discord الثاني (`discord-thread-reply-filepath-attachment`)
رسالة أصلية باستخدام بوت المشغّل، وينشئ سلسلة محادثة حقيقية، ويستدعي إجراء
`message.thread-reply` في النظام قيد الاختبار مع `filePath` محلي للمستودع، ثم يستطلع
سلسلة المحادثة بحثًا عن الرد واسم ملف المرفق. ويتوقع مرفقًا
باسم `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

يستأجر سطح مكتب Crabbox أو يعيد استخدامه، ويشغّل متصفحًا داخل جلسة VNC
موجّهًا إلى `--browser-url` (الافتراضي `https://openclaw.ai`) أو إلى
`--html-file` معروض، وينتظر، ويلتقط لقطة شاشة باستخدام `scrot`، ويسجل اختياريًا ملف MP4 باستخدام
`ffmpeg`، ويزامن `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
عبر rsync إلى `--output-dir`.

العلامات:

- يعيد `--lease-id <cbx_...>` استخدام سطح مكتب مجهّز بدلًا من إنشاء واحد.
- يعيد `--browser-profile-dir <remote-path>` استخدام دليل بيانات مستخدم Chrome بعيد، بحيث يظل سطح المكتب الدائم مسجّل الدخول بين عمليات التشغيل (يُستخدم لملف تعريف طويل الأمد لمشاهد Discord Web).
- يستعيد `--browser-profile-archive-env <name>` أرشيف ملف تعريف Chrome بصيغة `.tgz` ومشفّرًا بـbase64 من متغير البيئة ذاك قبل التشغيل (الافتراضي `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`)؛ ويُستخدم للشهود مسجّلي الدخول مثل Discord Web.
- يتحكم `--video-duration <seconds>` في مدة التقاط MP4 (الافتراضي 10 ثوانٍ).
- يُبقي `--keep-lease` (أو `OPENCLAW_MANTIS_KEEP_VM=1`) عقد الاستئجار الذي أنشأه هذا التشغيل مفتوحًا لفحص VNC؛ كما تُبقي عمليات التشغيل الفاشلة التي أنشأت عقد استئجار العقد مفتوحًا افتراضيًا.

بالنسبة إلى أدلة Discord Web، تستخدم Mantis حساب مشاهد مخصصًا، وليس رمز
بوت. يظل مصدر الحقيقة الحاسم هو مستطلع Discord REST (عبر `qa discord`)؛ وعند
ضبط `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`، يكتب السيناريو أيضًا
منتجًا أثريًا لرابط Discord Web، ويُبقي `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`
سلسلة المحادثة مفتوحة مدة كافية ليفتحها المتصفح.

يفضّل تدفق عمل GitHub ملف تعريف مشاهد دائمًا عبر
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (قد تتجاوز أرشيفات ملفات التعريف الكاملة
حد حجم أسرار GitHub)؛ ويمكنه بدلًا من ذلك استعادة ملف `.tgz`
صغير/تمهيدي مشفّر بـbase64 من `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. وإذا لم
يُهيّأ أي من المصدرين، يظل تدفق العمل ينشر لقطات الشاشة الحتمية
لخط الأساس/المرشح ويسجل أنه تم تخطي الشاهد مسجّل الدخول.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر سطح مكتب Crabbox أو يعيد استخدامه، ويزامن نسخة المستودع إلى الجهاز الافتراضي، ويشغّل
`pnpm openclaw qa slack` داخله، ويفتح Slack Web في متصفح VNC،
ويلتقط سطح المكتب، وينسخ محليًا كلاً من المنتجات الأثرية لضمان جودة Slack ‏(`slack-qa/`)
ولقطة شاشة/فيديو VNC. وهذا هو شكل Mantis الوحيد الذي يعمل فيه
Gateway للنظام قيد الاختبار والمتصفح كلاهما داخل الجهاز الافتراضي نفسه.

باستخدام `--gateway-setup`، ينشئ الأمر مجلد OpenClaw رئيسيًا دائمًا وقابلًا للتخلص منه
في `$HOME/.openclaw-mantis/slack-openclaw` داخل الجهاز الافتراضي، ويعدّل
تهيئة Slack Socket Mode للقناة المستهدفة، ويشغّل
`openclaw gateway run --dev --allow-unconfigured --port 38973`، ويترك
Chrome قيد التشغيل في جلسة VNC؛ أما حذف `--gateway-setup` فيشغّل مسار
ضمان جودة Slack المعتاد من بوت إلى بوت بدلًا من ذلك.

متغيرات البيئة المطلوبة لـ`--credential-source env` (الافتراضي المحلي هو `env`؛ والدور
الافتراضي هو `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` لمسار النموذج البعيد (إذا كان `OPENAI_API_KEY`
  فقط مضبوطًا محليًا، تنسخه Mantis إلى `OPENCLAW_LIVE_OPENAI_KEY` قبل
  استدعاء Crabbox)

باستخدام `--credential-source convex`، تستأجر Mantis بيانات اعتماد النظام قيد الاختبار في Slack من
المجموعة المشتركة قبل إنشاء الجهاز الافتراضي، وتمرّر معرّف القناة ورمز التطبيق
ورمز البوت إلى الجهاز الافتراضي كمتغيرات بيئة `OPENCLAW_MANTIS_SLACK_*`، بحيث لا تحتاج تدفقات عمل
GitHub سوى سر وسيط Convex، لا رموز Slack الأولية.

العلامات الأخرى: يفتح `--slack-url <url>` عنوان URL محددًا (وإلا تستنتج Mantis
‏`https://app.slack.com/client/<team>/<channel>` من `auth.test`)؛
ويضبط `--slack-channel-id <id>` قناة قائمة السماح في Gateway؛
ويتحكم `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` في ملف تعريف Chrome الدائم
داخل الجهاز الافتراضي (الافتراضي `$HOME/.config/openclaw-mantis/slack-chrome-profile`)؛
ويشغّل `--approval-checkpoints` سيناريوهات الموافقة الأصلية في Slack
‏(`slack-approval-exec-native` و`slack-approval-plugin-native`)، ويعرض
لقطات شاشة لنقاط التحقق المعلّقة/المحسومة بدلًا من إعداد Gateway (يتنافى
مع `--gateway-setup`)؛ وتمرّر `--hydrate-mode source|prehydrated`
و`--provider-mode` و`--model` و`--alt-model` و`--fast` إلى
مسار Slack الحي.

تُعرض لقطات شاشة نقاط تحقق الموافقة من رسالة Slack API التي
رصدها السيناريو، وليس من واجهة Slack الحية؛ ولا يمثل `slack-desktop-smoke.png`
دليلًا على Slack Web نفسه إلا إذا كان ملف تعريف المتصفح الخاص بعقد الاستئجار مسجّل
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
رمز بوت Telegram للنظام قيد الاختبار المستأجر، ويشغّل
`openclaw gateway run --dev --allow-unconfigured --port 38974`، وينشر
رسالة جاهزية من بوت التشغيل إلى المجموعة الخاصة المستأجرة، ثم يلتقط
لقطة شاشة وملف MP4. لا يُستخدم رمز البوت إلا لتهيئة OpenClaw؛ ولا يسجّل
الدخول إلى Telegram Desktop مطلقًا. عارض سطح المكتب هو جلسة مستخدم Telegram منفصلة
تُستعاد من `--telegram-profile-archive-env <name>` أو يُسجّل الدخول إليها يدويًا
عبر VNC وتظل نشطة باستخدام `--keep-lease`.

الخيارات: يعيد `--lease-id <cbx_...>` التشغيل على جهاز افتراضي سبق تسجيل دخوله إلى
Telegram Desktop؛ ويستعيد `--telegram-profile-archive-env <name>` أرشيف ملف تعريف
`.tgz` مشفّرًا بصيغة base64 قبل التشغيل؛ ويعيّن `--telegram-profile-dir <remote-path>`
دليل ملف التعريف البعيد (الافتراضي `$HOME/.local/share/TelegramDesktop`)؛
ويثبّت `--no-gateway-setup` تطبيق Telegram Desktop ويفتحه فقط؛
وتكون القيمتان الافتراضيتان لـ `--credential-source` و`--credential-role` هما `convex` و`maintainer`.

## بيان الأدلة

يكتب كل سيناريو ينشر إلى طلب سحب ملف `mantis-evidence.json` بجوار
تقريره:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

يكون `path` الخاص بالأثر نسبيًا إلى دليل البيان؛ ويكون `targetPath`
نسبيًا إلى بادئة آثار R2/S3 المهيأة. يرفض `scripts/mantis/publish-pr-evidence.mjs`
اجتياز المسارات ويتخطى الإدخالات التي تحتوي على `"required": false` عندما يكون
الملف مفقودًا.

أنواع الآثار: `timeline` (لقطة شاشة حتمية قبل/بعد)،
و`desktopScreenshot` (لقطة شاشة VNC/المتصفح)، و`motionPreview` (ملف GIF متحرك
مضمّن من التسجيل)، و`motionClip` (ملف MP4 مقتطع حسب الحركة)، و`fullVideo` (التسجيل
الكامل)، و`metadata` (ملف JSON/سجل جانبي)، و`report` (تقرير Markdown).

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
قد تظهر أسماء القنوات الخاصة أو أسماء المستخدمين أو محتوى الرسائل. عيّن
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لعمليات رفع الآثار العامة؛ وهو
مفعّل افتراضيًا في مهام سير GitHub الخاصة بـ Discord وSlack وTelegram.

## أتمتة GitHub

الملف `scripts/mantis/publish-pr-evidence.mjs` هو أداة النشر القابلة لإعادة الاستخدام. تستدعيه مهام سير العمل
مع البيان وطلب السحب المستهدف وجذر وجهة الآثار وعلامة التعليق
وعنوان URL للأثر وعنوان URL للتشغيل ومصدر الطلب. يرفع الآثار المعلنة إلى
حاوية Mantis في R2، وينشئ تعليقًا لطلب السحب يبدأ بالملخص ويتضمن
صورًا/معاينات مضمّنة ومقاطع فيديو مرتبطة، ثم يحدّث تعليق العلامة الحالي أو
ينشئ تعليقًا جديدًا. متغيرات البيئة المطلوبة:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (تعيّن مهام سير العمل القيمة `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (تعيّن مهام سير العمل القيمة `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (تعيّن مهام سير العمل القيمة `https://artifacts.openclaw.ai`)

تُنشر التعليقات عبر تطبيق Mantis في GitHub (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`)، وليس `github-actions[bot]`، باستخدام تعليق
علامة مخفي كمفتاح للإدراج أو التحديث.

| مهمة سير العمل                     | المشغّل                                                                                    | ما تفعله                                                                                                                                                                                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | تشغيل يدوي                                                                                 | تشغّل `discord-smoke` على مرجع محدد.                                                                                                                                                                                                                                                                                                    |
| `Mantis Discord Status Reactions` | تعليق على طلب سحب أو تشغيل يدوي                                                            | تنشئ شجرتي عمل منفصلتين للخط الأساسي والمرشح، وتشغّل `discord-status-reactions-tool-only` على كل منهما، وتعرض المخطط الزمني لكل مسار في متصفح سطح مكتب Crabbox، وتنشئ معاينات GIF/MP4 مقتطعة حسب الحركة باستخدام `crabbox media preview`، وترفع الآثار، وتنشر أدلة مضمّنة في طلب السحب. |
| `Mantis Scenario`                 | تشغيل يدوي                                                                                 | موزّع عام: يأخذ `scenario_id` (`discord-status-reactions-tool-only` و`discord-thread-reply-filepath-attachment` و`slack-desktop-smoke` و`telegram-live` و`telegram-desktop-proof` و`web-ui-chat-proof`) و`baseline_ref` و`candidate_ref` و`pr_number`، ثم يمررها إلى مهمة سير السيناريو المطابقة. |
| `Mantis Slack Desktop Smoke`      | تشغيل يدوي                                                                                 | يستأجر سطح مكتب Linux من Crabbox (الافتراضي `aws`، مع إمكانية اختيار `hetzner`)، ويشغّل `slack-desktop-smoke --gateway-setup` على المرشح، ويسجّل سطح المكتب، وينشئ معاينة حركة، ويرفع الآثار، وينشر أدلة طلب السحب عند تقديم رقم طلب سحب.                                         |
| `Mantis Telegram Live`            | تعليق على طلب سحب أو تشغيل يدوي                                                            | يشغّل مسار ضمان الجودة المباشر في Telegram القائم على واجهة API للبوت (`openclaw qa telegram`)، ويكتب `mantis-evidence.json` من ملخص ضمان الجودة، ويعرض HTML للأدلة المنقّحة عبر متصفح سطح مكتب Crabbox، وينشئ ملف GIF للحركة، وينشر أدلة طلب السحب. لا يلزم تسجيل الدخول إلى Telegram Web لهذا المسار. |
| `Mantis Telegram Desktop Proof`   | تصنيف طلب سحب من مشرف (`mantis: telegram-visible-proof`) مع تعليق على طلب السحب، أو تشغيل يدوي | إثبات آلي قبل/بعد باستخدام تطبيق Telegram Desktop الأصلي. يسلّم طلب السحب ومراجع الخط الأساسي/المرشح وتعليمات المشرف إلى Codex، الذي يشغّل مسار إثبات Telegram Desktop الحقيقي للمستخدم عبر Crabbox لكلا المرجعين وينشر جدول أدلة من عمودين في طلب السحب.                     |
| `Mantis Web UI Chat Proof`        | تعليق على طلب سحب أو تشغيل يدوي                                                            | يشغّل إثبات Playwright المركّز لدردشة واجهة تحكم OpenClaw على المرشح، ويتحقق من أن المتصفح يرسل عبر Gateway المحاكى، ويلتقط آثار لقطات الشاشة/الفيديو، وينشر أدلة طلب السحب. هذا المسار مخصص لإثبات دردشة الويب فقط، وليس لإثبات WinUI/التطبيق الأصلي أو الإثبات المرئي الاعتباطي. |

تقبل كل من `Mantis Discord Status Reactions` و`Mantis Telegram Live`
القيمتين `baseline_ref` و`candidate_ref` (أو `baseline=` و`candidate=` في تعليق على طلب السحب)،
وتتحققان قبل التشغيل باستخدام بيانات اعتماد تتضمن أسرارًا من أن SHA المحلول إما سلف لـ `origin/main`، أو
وسم إصدار (`v*`)، أو رأس طلب سحب مفتوح.

مشغّلات التعليقات، من طلب سحب بصلاحية الكتابة/الصيانة/الإدارة:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

تستخدم مشغّلات تعليقات Telegram قيمة SHA لرأس طلب السحب كمرشح افتراضيًا،
و`telegram-status-command` كسيناريو؛ وتقبل `provider=aws|hetzner` و
`lease=<cbx_...>` لاستهداف مزود Crabbox محدد أو سطح مكتب
مُهيأ مسبقًا. لا يستجيب `Mantis Telegram Desktop Proof` لتعليق على طلب سحب إلا عندما
يحمل طلب السحب مسبقًا التصنيف `mantis: telegram-visible-proof`.

تستخدم مشغّلات تعليقات دردشة واجهة الويب قيمة SHA لرأس طلب السحب كمرشح افتراضيًا. وهي تشغّل
إثبات دردشة واجهة التحكم باستخدام Gateway المحاكى وتنشر آثار المتصفح؛ استخدم
إثبات Playwright/المتصفح العادي، أو لقطات شاشة المشرف، أو Crabbox، أو الآثار
المحلية لصفحات الويب الأخرى وأسطح التطبيقات الأصلية.

يمكن لـ ClawSweeper أيضًا تشغيل سيناريو مباشرة:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## الأجهزة والأسرار

القيم الافتراضية المحلية لـ CLI في Crabbox هي `--provider hetzner --class beast`؛ ويمكن تجاوزها
باستخدام `--provider` أو `--class`/`--machine-class` أو
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. تتجاوز مهام سير
GitHub غالبًا كلتا القيمتين (على سبيل المثال `--class standard`، ومدخل اختيار المزود
`aws`/`hetzner` في مهمة سير Slack). إذا كان أحد المزودين بطيئًا جدًا
أو غير متاح، فأضفه خلف واجهة Crabbox نفسها بدلًا من
ترميز بديل احتياطي بشكل ثابت.

الحد الأدنى للجهاز الافتراضي: Linux مع Chrome/Chromium قادر على العمل في بيئة سطح مكتب، ووصول CDP، وVNC/
noVNC، وNode 22+ وpnpm، ونسخة مستنسخة من OpenClaw، ووصول صادر إلى
وسيلة النقل المستهدفة وGitHub ومزودي النماذج ووسيط بيانات الاعتماد.

أسماء الأسرار المستخدمة عبر مهام سير Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لعمليات رفع الآثار العامة
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (تقبل مهام سير العمل أيضًا
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` كبديل احتياطي، وتربطها
  بالأسماء المباشرة قبل استدعاء Crabbox)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

يجب ألا يطبع مشغّل Mantis مطلقًا رموز بوتات Discord/Slack/Telegram،
أو مفاتيح API للمزود، أو ملفات تعريف ارتباط المتصفح، أو محتويات ملف تعريف المصادقة، أو كلمات مرور VNC، أو
حمولات بيانات الاعتماد الخام. إذا تسرّب رمز إلى مشكلة أو طلب سحب أو دردشة أو سجل،
فدوّره بعد تخزين السر البديل.

## نتائج التشغيل

تميّز سيناريوهات وسيلة النقل قبل/بعد بين هذه النتائج حتى لا تُفسّر
بيئة غير مستقرة على أنها تراجع في المنتج:

- **أُعيد إنتاج الخلل**: فشل الخط الأساسي بالطريقة التي يتوقعها السيناريو.
- **فشل حزمة الاختبار**: فشل إعداد البيئة أو بيانات الاعتماد أو واجهة API لوسيلة النقل أو المتصفح
  أو المزود قبل أن يصبح معيار الحكم ذا دلالة.

يُبلغ إثبات المتصفح الخاص بالمرشح فقط عما إذا كان المرشح قد اجتاز Gateway المحاكى
وتحققات واجهة المستخدم المرئية؛ ولا يدّعي إعادة إنتاج الخط الأساسي.

## إضافة سيناريو

تُعرّف سيناريوهات وسائل النقل المباشرة باستخدام TypeScript لكل وسيلة نقل (راجع
`MANTIS_SCENARIO_CONFIGS` في `extensions/qa-lab/src/mantis/run.runtime.ts` لمعرفة
بنية قبل/بعد الخاصة بـ Discord)، وليست بتنسيق ملف تعريفي مستقل.
يحتاج كل سيناريو إلى: معرّف وعنوان، ووسيلة نقل، وبيانات الاعتماد المطلوبة، وسياسة مرجع الخط الأساسي،
وسياسة مرجع المرشح، وتصحيح تهيئة OpenClaw، وخطوات الإعداد/التحفيز،
ومعيار الحكم المتوقع للخط الأساسي والمرشح، وأهداف الالتقاط المرئي، وميزانية
المهلة الزمنية، وخطوات التنظيف.

يمكن لإثبات المتصفح المركّز على الإصدار المرشّح فقط استخدام اختبار E2E حتمي ومخصص
وسير عمل مخصص. أبقِ نطاقه صريحًا، وتحقّق من مرجع الإصدار المرشّح قبل
التنفيذ، واعزل النشر المدعوم بالأسرار، وأصدر عقد بيان الأدلة نفسه.

فضّل أدوات التحقق الصغيرة والمحددة الأنواع على فحوصات الرؤية: حالة تفاعلات Discord أو
مراجع الرسائل، وحالة `ts` لسلسلة Slack/حالة واجهة API للتفاعلات، ومعرّفات رسائل البريد الإلكتروني
ورؤوسها. استخدم لقطات شاشة المتصفح عندما تكون واجهة المستخدم هي العنصر الوحيد الموثوق القابل للرصد،
واجعل فحوصات الرؤية إضافةً إلى أداة تحقق تستند إلى واجهة API للمنصة حيثما توفرت.

بعد Discord وSlack وTelegram، يمتد شكل المشغّل نفسه إلى WhatsApp
(تسجيل الدخول عبر رمز QR، وإعادة تحديد الهوية، والتسليم، والوسائط، والتفاعلات) وMatrix
(الغرف المشفّرة، وعلاقات السلاسل/الردود، واستئناف العمل بعد إعادة التشغيل)؛ ولم يُنفّذ أيٌّ منهما
بعد.

## أسئلة مفتوحة

- أي روبوت Discord ينبغي أن يكون المشغّل وأيهما ينبغي أن يكون النظام قيد الاختبار عندما يُعاد استخدام روبوت Mantis
  الحالي؟
- ما المدة التي ينبغي أن يحتفظ فيها GitHub بعناصر Mantis الخاصة بطلبات PR؟
- متى ينبغي أن يوصي ClawSweeper تلقائيًا بسيناريو Mantis بدلًا من
  انتظار أمر من أحد المشرفين؟
- هل ينبغي تنقيح لقطات الشاشة أو اقتصاصها قبل رفعها لطلبات PR العامة؟
