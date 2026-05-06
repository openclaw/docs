---
read_when:
    - بناء أو تشغيل ضمان الجودة المرئي المباشر لأخطاء OpenClaw
    - إضافة التحقق قبل وبعد لطلب سحب
    - إضافة Discord أو Slack أو WhatsApp أو سيناريوهات نقل مباشرة أخرى
    - تصحيح أخطاء تشغيلات ضمان الجودة التي تحتاج إلى لقطات شاشة أو أتمتة المتصفح أو وصول VNC
summary: Mantis هو نظام التحقق المرئي من طرف إلى طرف لإعادة إنتاج أخطاء OpenClaw على قنوات النقل الحية، والتقاط أدلة ما قبل التغيير وما بعده، وإرفاق المخرجات بطلبات السحب.
title: فرس النبي
x-i18n:
    generated_at: "2026-05-06T07:48:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis هو نظام التحقق الشامل في OpenClaw للأخطاء التي تحتاج إلى وقت تشغيل حقيقي، ونقل حقيقي، ودليل مرئي. يشغّل سيناريو مقابل مرجع معروف بأنه سيئ، ويلتقط الأدلة، ثم يشغّل السيناريو نفسه مقابل مرجع مرشح، وينشر المقارنة كأدوات أثرية يمكن للمشرف فحصها من PR أو من أمر محلي.

يبدأ Mantis بـ Discord لأن Discord يمنحنا مسارًا أولًا عالي القيمة: مصادقة بوت حقيقية، وقنوات مجتمع حقيقية، وتفاعلات، وسلاسل، وأوامر أصلية، وواجهة متصفح يمكن للبشر فيها تأكيد ما أظهره النقل بصريًا.

## الأهداف

- إعادة إنتاج خطأ من issue أو PR في GitHub بالشكل نفسه للنقل الذي يراه المستخدمون.
- التقاط أداة أثرية **قبل** على مرجع الأساس قبل تطبيق الإصلاح.
- التقاط أداة أثرية **بعد** على المرجع المرشح بعد تطبيق الإصلاح.
- استخدام حَكَم حتمي كلما أمكن، مثل قراءة تفاعل Discord REST أو فحص نص قناة.
- التقاط لقطات شاشة عندما يكون للخطأ سطح واجهة مستخدم مرئي.
- التشغيل محليًا من CLI يتحكم فيه الوكيل وعن بُعد من GitHub.
- الاحتفاظ بحالة آلة كافية لإنقاذ VNC عندما يتعطل تسجيل الدخول، أو أتمتة المتصفح، أو مصادقة المزوّد.
- نشر حالة موجزة إلى قناة Discord للمشغل عندما يكون التشغيل محظورًا، أو يحتاج إلى مساعدة VNC يدوية، أو ينتهي.

## غير الأهداف

- Mantis ليس بديلًا لاختبارات الوحدة. يجب عادةً أن يتحول تشغيل Mantis إلى اختبار انحدار أصغر بعد فهم الإصلاح.
- Mantis ليس بوابة CI السريعة العادية. إنه أبطأ، ويستخدم بيانات اعتماد حية، ومخصص للأخطاء التي تهم فيها البيئة الحية.
- يجب ألا يتطلب Mantis تدخلًا بشريًا في التشغيل العادي. VNC اليدوي مسار إنقاذ، وليس المسار الطبيعي.
- لا يخزن Mantis الأسرار الخام في الأدوات الأثرية، أو السجلات، أو لقطات الشاشة، أو تقارير Markdown، أو تعليقات PR.

## الملكية

يوجد Mantis في مكدس QA الخاص بـ OpenClaw.

- تملك OpenClaw وقت تشغيل السيناريو، ومحوّلات النقل، ومخطط الأدلة، وCLI المحلي ضمن `pnpm openclaw qa mantis`.
- يملك QA Lab أجزاء مسخّر النقل الحي، ومساعدات التقاط المتصفح، وكُتّاب الأدوات الأثرية.
- يملك Crabbox آلات Linux الدافئة عندما تكون هناك حاجة إلى VM بعيدة.
- تملك GitHub Actions نقطة دخول سير العمل البعيد والاحتفاظ بالأدوات الأثرية.
- يملك ClawSweeper توجيه تعليقات GitHub: تحليل أوامر المشرفين، وإرسال سير العمل، ونشر تعليق PR النهائي.
- تقود وكلاء OpenClaw تشغيل Mantis عبر Codex عندما يحتاج السيناريو إلى إعداد وكيل، أو تصحيح أخطاء، أو الإبلاغ عن حالة عالقة.

يبقي هذا الحد معرفة النقل في OpenClaw، وجدولة الآلات في Crabbox، وغراء سير عمل المشرفين في ClawSweeper.

## شكل الأمر

يتحقق الأمر المحلي الأول من بوت Discord، والمجتمع، والقناة، وإرسال الرسالة، وإرسال التفاعل، ومسار الأدوات الأثرية:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

يقبل مشغّل ما قبل وما بعد المحلي هذا الشكل:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ينشئ المشغّل worktrees منفصلة لمرجع الأساس والمرجع المرشح ضمن دليل الإخراج، ويثبت الاعتماديات، ويبني كل مرجع، ويشغّل السيناريو باستخدام `--allow-failures`، ثم يكتب `baseline/` و`candidate/` و`comparison.json` و`mantis-report.md`. بالنسبة لسيناريو Discord الأول، يعني التحقق الناجح أن حالة الأساس هي `fail` وحالة المرشح هي `pass`.

يستهدف مسبار Discord الثاني لما قبل/ما بعد مرفقات السلاسل:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

ينشر هذا السيناريو رسالة أصلية باستخدام بوت التشغيل، وينشئ سلسلة Discord حقيقية، ويستدعي إجراء `message.thread-reply` في OpenClaw باستخدام `filePath` محلي للمستودع، ثم يستطلع السلسلة بحثًا عن رد SUT واسم ملف المرفق. تُظهر لقطة شاشة الأساس الرد بلا مرفق؛ وتُظهر لقطة شاشة المرشح مرفق `mantis-thread-report.md` المتوقع.

أول بدائية VM/متصفح هي اختبار سطح المكتب السريع:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

يستأجر أو يعيد استخدام آلة سطح مكتب من Crabbox، ويبدأ متصفحًا مرئيًا داخل جلسة VNC، ويلتقط سطح المكتب، ويسحب الأدوات الأثرية إلى دليل الإخراج المحلي، ويكتب أمر إعادة الاتصال في التقرير. يستخدم الأمر مزوّد Hetzner افتراضيًا لأنه أول مزوّد لديه تغطية سطح مكتب/VNC عاملة في مسار Mantis. تجاوزه باستخدام `--provider` أو `--crabbox-bin` أو `OPENCLAW_MANTIS_CRABBOX_PROVIDER` عند التشغيل مقابل أسطول Crabbox آخر.

أعلام مفيدة لاختبار سطح المكتب السريع:

- `--lease-id <cbx_...>` أو `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` يعيد استخدام سطح مكتب دافئًا.
- `--browser-url <url>` يغيّر الصفحة المفتوحة في المتصفح المرئي.
- `--html-file <path>` يعرض أداة أثرية HTML محلية للمستودع في المتصفح المرئي. يستخدم Mantis هذا لالتقاط الخط الزمني المولّد لتفاعلات حالة Discord عبر سطح مكتب Crabbox حقيقي.
- `--browser-profile-dir <remote-path>` يعيد استخدام Chrome user-data-dir بعيد بحيث يمكن لسطح مكتب Mantis دائم أن يبقى مسجل الدخول بين مرات التشغيل. استخدم هذا لملف تعريف عارض Discord Web طويل العمر.
- `--browser-profile-archive-env <name>` يستعيد أرشيف Chrome user-data-dir بصيغة base64 `.tgz` من متغير البيئة المسمى قبل تشغيل المتصفح. استخدم هذا للشهود المسجلين الدخول مثل Discord Web. متغير البيئة الافتراضي هو `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` يتحكم في طول التقاط MP4. استخدم مدة أطول لتطبيقات الويب المسجلة الدخول البطيئة التي تحتاج إلى وقت للاستقرار.
- `--keep-lease` أو `OPENCLAW_MANTIS_KEEP_VM=1` يبقي تأجيرًا جديدًا ناجحًا مفتوحًا لفحص VNC. تبقي مرات التشغيل الفاشلة التأجير افتراضيًا عندما يكون قد أُنشئ واحد حتى يتمكن المشغّل من إعادة الاتصال.
- تضبط `--class` و`--idle-timeout` و`--ttl` حجم الآلة وعمر التأجير.

بالنسبة لأدلة Discord Web، يستخدم Mantis حساب عارض مخصصًا بدلًا من رمز بوت. يظل سيناريو Discord API الحي هو الحَكَم: ينشئ السلسلة الحقيقية، ويرسل `thread-reply` الخاص بـ SUT، ويفحص المرفق عبر Discord REST. عند ضبط `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`، يكتب السيناريو أيضًا أداة أثرية لرابط Discord Web. عند ضبط `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`، يترك تلك السلسلة متاحة مدة كافية لمتصفح مسجل الدخول كي يفتحها ويسجلها.

يفتح سير عمل GitHub رابط سلسلة المرشح في Discord Web، ويلتقط لقطة شاشة، ويسجل MP4، وينشئ معاينة GIF مشذبة عندما تكون أدوات وسائط Crabbox متاحة. فضّل مسار ملف تعريف عارض دائمًا مكوّنًا عبر `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`، لأن أرشيفات ملف تعريف Chrome الكاملة قد تتجاوز حد حجم الأسرار في GitHub. بالنسبة للملفات الشخصية الصغيرة/التمهيدية، يمكن لسير العمل أيضًا استعادة أرشيف base64 `.tgz` من `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. إذا لم يكن أي مصدر ملف تعريف مكوّنًا، فلا يزال سير العمل ينشر لقطات شاشة مرفقات الأساس/المرشح الحتمية ويسجل إشعارًا بأن شاهد Discord Web المسجل الدخول قد تم تخطيه.

أول بدائية نقل سطح مكتب كاملة هي اختبار Slack السريع لسطح المكتب:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر أو يعيد استخدام آلة سطح مكتب من Crabbox، ويزامن نسخة checkout الحالية إلى VM، ويشغّل `pnpm openclaw qa slack` داخل تلك VM، ويفتح Slack Web في متصفح VNC، ويلتقط سطح المكتب المرئي، وينسخ كلًا من أدوات Slack QA الأثرية ولقطة شاشة VNC إلى دليل الإخراج المحلي. هذا هو أول شكل في Mantis حيث يعيش كل من SUT OpenClaw gateway والمتصفح داخل VM سطح مكتب Linux نفسها.

مع `--gateway-setup`، يحضّر الأمر منزل OpenClaw قابلًا للتخلص منه ودائمًا في `$HOME/.openclaw-mantis/slack-openclaw`، ويرقّع إعدادات Slack Socket Mode للقناة المحددة، ويبدأ `openclaw gateway run` على المنفذ `38973`، ويبقي Chrome قيد التشغيل في جلسة VNC. هذا هو وضع "اترك لي سطح مكتب Linux مع Slack ومخلب يعمل"؛ ويظل مسار Slack QA من بوت إلى بوت هو الافتراضي عند حذف `--gateway-setup`.

المدخلات المطلوبة لـ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` لمسار النموذج البعيد. إذا كان `OPENAI_API_KEY` مضبوطًا محليًا فقط، يربطه Mantis إلى `OPENCLAW_LIVE_OPENAI_KEY` قبل استدعاء Crabbox حتى يتمكن تمرير البيئة `OPENCLAW_*` الخاص بـ Crabbox من حمله إلى VM.

مع `--gateway-setup --credential-source convex`، يستأجر Mantis بيانات اعتماد Slack SUT من المجمّع المشترك قبل إنشاء VM ويمرر معرّف القناة المستأجر، ورمز تطبيق Socket Mode، ورمز البوت كبيئة تشغيل `OPENCLAW_MANTIS_SLACK_*` داخل سطح المكتب. هذا يبقي سير عمل GitHub خفيفًا: يحتاج فقط إلى سر وسيط Convex، وليس رموز بوت أو تطبيق Slack الخام.

أعلام مفيدة لسطح مكتب Slack:

- `--lease-id <cbx_...>` يعيد التشغيل مقابل آلة سجّل عليها مشغّل الدخول بالفعل إلى Slack Web عبر VNC.
- `--gateway-setup` يبدأ Slack Gateway دائمًا لـ OpenClaw في VM بدلًا من تشغيل مسار QA من بوت إلى بوت فقط.
- `--keep-lease` يبقي Gateway VM مفتوحة لفحص VNC بعد النجاح؛ يوقفها `--no-keep-lease` بعد جمع الأدوات الأثرية.
- `--slack-url <url>` يفتح رابط Slack Web محددًا. بدونه، يشتق Mantis `https://app.slack.com/client/<team>/<channel>` من Slack `auth.test` عندما يكون رمز بوت SUT متاحًا.
- `--slack-channel-id <id>` يتحكم في قائمة السماح لقنوات Slack المستخدمة من خلال إعداد Gateway.
- يتحكم `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` في ملف تعريف Chrome الدائم داخل VM. الافتراضي هو `$HOME/.config/openclaw-mantis/slack-chrome-profile`، بحيث يستمر تسجيل الدخول اليدوي إلى Slack Web في مرات التشغيل اللاحقة على التأجير نفسه.
- يستخدم `--credential-source convex --credential-role ci` مجمّع بيانات الاعتماد المشترك بدلًا من رموز بيئة Slack المباشرة.
- تمرر `--provider-mode` و`--model` و`--alt-model` و`--fast` إلى مسار Slack الحي.

سير عمل GitHub السريع هو `Mantis Discord Smoke`. سير عمل GitHub لما قبل وما بعد للسيناريو الحقيقي الأول هو `Mantis Discord Status Reactions`. يقبل:

- `baseline_ref`: المرجع المتوقع أن يعيد إنتاج سلوك قائمة الانتظار فقط.
- `candidate_ref`: المرجع المتوقع أن يُظهر `queued -> thinking -> done`.

يفحص مرجع مسخّر سير العمل، ويبني worktrees منفصلة للأساس والمرشح، ويشغّل `discord-status-reactions-tool-only` مقابل كل worktree، ويرفع `baseline/` و`candidate/` و`comparison.json` و`mantis-report.md` كأدوات أثرية في Actions. كما يعرض HTML للخط الزمني لكل مسار في متصفح سطح مكتب Crabbox وينشر لقطات شاشة VNC تلك بجانب صور PNG الحتمية للخط الزمني في تعليق PR. يضمّن تعليق PR نفسه معاينات GIF خفيفة ومشذبة الحركة مولدة بواسطة `crabbox media preview`، ويربط بمقاطع MP4 المطابقة والمشذبة الحركة، ويحتفظ بملفات MP4 الكاملة لسطح المكتب للفحص العميق. تبقى لقطات الشاشة مضمنة للمراجعة السريعة. يبني سير العمل Crabbox CLI من الفرع main في `openclaw/crabbox` حتى يتمكن من استخدام أعلام تأجير سطح المكتب/المتصفح الحالية قبل إصدار Crabbox الثنائي التالي.

`Mantis Scenario` هو نقطة الدخول اليدوية العامة. يأخذ `scenario_id` و`candidate_ref` و`baseline_ref` اختياريًا و`pr_number` اختياريًا، ثم يرسل سير العمل المملوك للسيناريو. الغلاف رفيع عمدًا: ما تزال سير عمل السيناريوهات تملك إعداد النقل، وبيانات الاعتماد، وفئة VM، والحَكَم المتوقع، وبيان الأدوات الأثرية.

`Mantis Slack Desktop Smoke` هو أول سير عمل Slack VM. يفحص مرجع المرشح الموثوق به في worktree منفصل، ويستأجر سطح مكتب Crabbox Linux، ويشغّل `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` على ذلك المرشح، ويفتح Slack Web في متصفح VNC، ويسجل سطح المكتب، وينشئ معاينة مقصوصة الحركة باستخدام `crabbox media preview`، ويرفع دليل المصنوعات الكامل، وينشر اختياريا تعليق الأدلة المضمن على PR المستهدف. يستخدم AWS افتراضيا لاستئجار سطح المكتب، ويعرض إدخال مزود يدوي حتى يتمكن المشغلون من التبديل إلى Hetzner عندما تكون سعة AWS بطيئة أو غير متاحة. استخدم هذا المسار عندما تريد "سطح مكتب Linux مع Slack ومخلب قيد التشغيل" بدلا من مجرد نسخة Slack بين بوت وبوت.

يكتب كل سيناريو لنشر PR ملف `mantis-evidence.json` بجانب تقريره. هذا المخطط هو التسليم بين كود السيناريو وتعليقات GitHub:

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

قيم `path` للمصنوعات نسبية إلى دليل manifest. قيم `targetPath` هي مسارات نسبية ضمن دليل النشر لفرع `qa-artifacts`. يرفض الناشر اجتياز المسارات ويتخطى الإدخالات الموسومة بـ `"required": false` عندما لا تتوفر المعاينات أو مقاطع الفيديو الاختيارية.

أنواع المصنوعات المدعومة:

- `timeline`: لقطة شاشة حتمية للسيناريو، عادة قبل/بعد.
- `desktopScreenshot`: لقطة شاشة لسطح مكتب VNC/المتصفح.
- `motionPreview`: صورة GIF متحركة مضمنة منشأة من تسجيل سطح المكتب.
- `motionClip`: ملف MP4 مقصوص الحركة يزيل البداية والنهاية الساكنتين.
- `fullVideo`: تسجيل MP4 كامل للفحص العميق.
- `metadata`: ملف JSON/سجل جانبي.
- `report`: تقرير Markdown.

الناشر القابل لإعادة الاستخدام هو `scripts/mantis/publish-pr-evidence.mjs`. تستدعيه سير العمل مع manifest، وPR المستهدف، وجذر هدف `qa-artifacts`، وعلامة التعليق، ورابط مصنوع Actions، ورابط التشغيل، ومصدر الطلب. ينسخ المصنوعات المعلنة إلى فرع `qa-artifacts`، وينشئ تعليق PR يبدأ بالملخص مع صور/معاينات مضمنة ومقاطع فيديو مرتبطة، ثم يحدّث تعليق العلامة الحالي أو ينشئ واحدا.

يمكنك أيضا تشغيل مسار تفاعلات الحالة مباشرة من تعليق PR:

```text
@Mantis discord status reactions
```

مشغّل التعليق ضيق عمدا. يعمل فقط على تعليقات pull request من مستخدمين لديهم صلاحية كتابة أو صيانة أو إدارة، ولا يتعرف إلا على طلبات تفاعلات حالة Discord. يستخدم افتراضيا مرجع الأساس السيئ المعروف وSHA رأس PR الحالي بصفته المرشح. يمكن للمشرفين تجاوز أي من المرجعين:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

أمثلة أوامر ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

الأمر الأول صريح ومركّز على السيناريو. يمكن للأمر الثاني لاحقا أن يربط PR أو مشكلة بسيناريوهات Mantis الموصى بها من التسميات والملفات المتغيرة ونتائج مراجعة ClawSweeper.

## دورة حياة التشغيل

1. الحصول على بيانات الاعتماد.
2. تخصيص VM أو إعادة استخدامها.
3. إعداد ملف تعريف سطح المكتب/المتصفح عندما يحتاج السيناريو إلى دليل من UI.
4. إعداد checkout نظيف لمرجع الأساس.
5. تثبيت التبعيات وبناء ما يحتاجه السيناريو فقط.
6. بدء OpenClaw Gateway فرعي بدليل حالة معزول.
7. تكوين النقل الحي والمزود والنموذج وملف تعريف المتصفح.
8. تشغيل السيناريو والتقاط أدلة الأساس.
9. إيقاف Gateway والاحتفاظ بالسجلات.
10. إعداد مرجع المرشح في VM نفسها.
11. تشغيل السيناريو نفسه والتقاط أدلة المرشح.
12. مقارنة نتائج oracle والأدلة المرئية.
13. كتابة Markdown وJSON والسجلات ولقطات الشاشة ومصنوعات التتبع الاختيارية.
14. رفع مصنوعات GitHub Actions.
15. نشر رسالة حالة موجزة في PR أو Discord.

يجب أن يكون السيناريو قادرا على الفشل بطريقتين مختلفتين:

- **تمت إعادة إنتاج الخلل**: فشل الأساس بالطريقة المتوقعة.
- **فشل الحزام**: فشل إعداد البيئة أو بيانات الاعتماد أو Discord API أو المتصفح أو المزود قبل أن يصبح oracle الخلل ذا معنى.

يجب أن يفصل التقرير النهائي بين هذه الحالات حتى لا يخلط المشرفون بين بيئة متقلبة وسلوك المنتج.

## الحد الأدنى للمنتج القابل للتطبيق في Discord

يجب أن يستهدف السيناريو الأول تفاعلات حالة Discord في قنوات guild حيث يكون وضع تسليم رد المصدر هو `message_tool_only`.

لماذا هو بذرة Mantis جيدة:

- يظهر في Discord كتفاعلات على الرسالة المشغّلة.
- لديه oracle REST قوي من خلال حالة تفاعلات رسالة Discord.
- يمرن OpenClaw Gateway حقيقيا، ومصادقة بوت Discord، وإرسال الرسائل، ووضع تسليم رد المصدر، وحالة تفاعل الحالة، ودورة حياة دورة النموذج.
- هو ضيق بما يكفي لإبقاء التنفيذ الأول صادقا.

الشكل المتوقع للسيناريو:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

يجب أن تُظهر أدلة الأساس تفاعل إقرار الانتظار من دون انتقال دورة الحياة في وضع الأدوات فقط. يجب أن تُظهر أدلة المرشح تفاعلات حالة دورة الحياة وهي تعمل عندما تكون `messages.statusReactions.enabled` مفعلة صراحة.

الشريحة التنفيذية الأولى هي سيناريو QA حي اختياري في Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

يكوّن SUT بمعالجة guild دائمة التشغيل، و`visibleReplies:
"message_tool"`، و`ackReaction: "👀"`، وتفاعلات حالة صريحة. يستطلع oracle رسالة Discord المشغّلة الحقيقية ويتوقع التسلسل المرصود `👀 -> 🤔 -> 👍`. تتضمن المصنوعات `discord-qa-reaction-timelines.json` و`discord-status-reactions-tool-only-timeline.html` و`discord-status-reactions-tool-only-timeline.png`.

## أجزاء QA الحالية

يجب أن يبني Mantis على مكدس QA الخاص الحالي بدلا من البدء من الصفر:

- يشغّل `pnpm openclaw qa discord` بالفعل مسار Discord حيا مع بوتات السائق وSUT.
- يكتب مشغّل النقل الحي بالفعل التقارير ومصنوعات الرسائل المرصودة تحت `.artifacts/qa-e2e/`.
- توفر إيجارات بيانات اعتماد Convex بالفعل وصولا حصريا إلى بيانات اعتماد النقل الحي المشتركة.
- تدعم خدمة التحكم بالمتصفح بالفعل لقطات الشاشة واللقطات وملفات التعريف المدارة بلا رأس وملفات CDP البعيدة.
- لدى QA Lab بالفعل UI مصحح أخطاء وحافلة لاختبار على شكل النقل.

يمكن أن يكون تنفيذ Mantis الأول مشغلا رقيقا قبل/بعد فوق هذه الأجزاء، إضافة إلى طبقة أدلة مرئية واحدة.

## نموذج الأدلة

يكتب كل تشغيل دليل مصنوعات مستقرا:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

يجب أن يكون `mantis-summary.json` هو مصدر الحقيقة المقروء آليا. تقرير Markdown مخصص لتعليقات PR والمراجعة البشرية.

يجب أن يتضمن الملخص:

- المراجع وSHAs المختبرة
- النقل ومعرّف السيناريو
- مزود الجهاز ومعرّف الجهاز أو معرّف الإيجار
- مصدر بيانات الاعتماد من دون قيم سرية
- نتيجة الأساس
- نتيجة المرشح
- ما إذا تمت إعادة إنتاج الخلل على الأساس
- ما إذا أصلحه المرشح
- مسارات المصنوعات
- مشكلات إعداد أو تنظيف منقحة

لقطات الشاشة أدلة وليست أسرارا. لكنها لا تزال تحتاج إلى انضباط في التنقيح: قد تظهر أسماء قنوات خاصة أو أسماء مستخدمين أو محتوى رسائل. بالنسبة إلى PRs العامة، فضّل روابط مصنوعات GitHub Actions على الصور المضمنة حتى تصبح قصة التنقيح أقوى.

## المتصفح وVNC

لمسار المتصفح وضعان:

- **الأتمتة بلا رأس**: الافتراضي في CI. يعمل Chrome مع تمكين CDP، وتلتقط Playwright أو تحكم متصفح OpenClaw لقطات الشاشة.
- **إنقاذ VNC**: مفعّل على VM نفسها عندما يحتاج تسجيل الدخول أو MFA أو مضادات الأتمتة في Discord أو التصحيح المرئي إلى إنسان.

يجب أن يكون ملف تعريف متصفح مراقب Discord ثابتا بما يكفي لتجنب تسجيل الدخول في كل تشغيل، لكنه معزول عن حالة المتصفح الشخصية. ينتمي ملف التعريف إلى تجمع أجهزة Mantis، وليس إلى حاسوب مطور محمول.

عندما يتعطل Mantis، ينشر رسالة حالة في Discord تحتوي على:

- معرّف التشغيل
- معرّف السيناريو
- مزود الجهاز
- دليل المصنوعات
- تعليمات اتصال VNC أو noVNC إذا كانت متاحة
- نص قصير عن العائق

يمكن للنشر الخاص الأول أن ينشر هذه الرسائل في قناة المشغل الحالية ثم ينتقل لاحقا إلى قناة Mantis مخصصة.

## الأجهزة

يجب أن يفضّل Mantis استخدام AWS عبر Crabbox في أول تنفيذ بعيد. يوفر Crabbox أجهزة مسخنة، وتتبع إيجارات، وترطيبا، وسجلات، ونتائج، وتنظيفا. إذا كانت سعة AWS بطيئة جدا أو غير متاحة، فأضف مزود Hetzner خلف واجهة الجهاز نفسها.

متطلبات VM الدنيا:

- Linux مع تثبيت Chrome أو Chromium قادر على سطح المكتب
- وصول CDP لأتمتة المتصفح
- VNC أو noVNC للإنقاذ
- Node 22 وpnpm
- checkout من OpenClaw وذاكرة تخزين مؤقت للتبعيات
- ذاكرة تخزين مؤقت لمتصفح Playwright Chromium عند استخدام Playwright
- CPU وذاكرة كافيان لـ OpenClaw Gateway واحد ومتصفح واحد وتشغيل نموذج واحد
- وصول صادر إلى Discord وGitHub ومزودي النماذج ووسيط بيانات الاعتماد

يجب ألا تحتفظ VM بأسرار خام طويلة العمر خارج مخازن بيانات الاعتماد أو ملفات تعريف المتصفح المتوقعة.

## الأسرار

تعيش الأسرار في أسرار مؤسسة GitHub أو المستودع للتشغيلات البعيدة، وفي ملف أسرار محلي يتحكم به المشغل للتشغيلات المحلية.

أسماء الأسرار الموصى بها:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` for public GitHub artifact uploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

على المدى الطويل، يجب أن يبقى تجمع بيانات اعتماد Convex هو المصدر الطبيعي لبيانات اعتماد النقل الحي. تعمل أسرار GitHub على تمهيد الوسيط ومسارات الاحتياط. يربط سير عمل تفاعلات حالة Discord أسرار Mantis Crabbox مرة أخرى بمتغيري البيئة `CRABBOX_COORDINATOR` و`CRABBOX_COORDINATOR_TOKEN` اللذين تتوقعهما Crabbox CLI. تبقى أسماء أسرار GitHub العادية `CRABBOX_*` مقبولة كاحتياط للتوافق.

يجب ألا يطبع مشغّل Mantis أبدا:

- رموز بوت Discord
- مفاتيح API للمزود
- ملفات تعريف ارتباط المتصفح
- محتويات ملف تعريف المصادقة
- كلمات مرور VNC
- حمولات بيانات الاعتماد الخام

يجب أن تنقح رفوعات المصنوعات العامة أيضا بيانات وصفية لهدف Discord مثل معرّفات البوت وguild والقناة والرسالة. يفعّل سير عمل smoke في GitHub الخيار `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لهذا السبب.

إذا لُصق رمز بالخطأ في مشكلة أو PR أو دردشة أو سجل، فقم بتدويره بعد تخزين السر الجديد.

## مصنوعات GitHub وتعليقات PR

يجب أن ترفع سير عمل Mantis حزمة الأدلة الكاملة كأثر GitHub Actions قصير العمر. عندما يُشغَّل سير العمل لتقرير خطأ أو PR إصلاح، يجب أن ينشر أيضًا لقطات الشاشة PNG المنقحة إلى فرع `qa-artifacts` وأن يحدّث أو ينشئ تعليقًا على ذلك الخطأ أو PR الإصلاح يتضمن لقطات شاشة قبل/بعد مضمنة. لا تنشر الدليل الأساسي فقط على PR عام لأتمتة QA. تبقى السجلات الخام والرسائل المرصودة والأدلة الضخمة الأخرى في أثر Actions.

يجب أن تنشر سير العمل الإنتاجية تلك التعليقات باستخدام Mantis GitHub App، لا باستخدام `github-actions[bot]`. خزّن معرّف التطبيق والمفتاح الخاص كأسرار GitHub Actions باسم `MANTIS_GITHUB_APP_ID` و`MANTIS_GITHUB_APP_PRIVATE_KEY`. يستخدم سير العمل علامة مخفية كمفتاح للتحديث أو الإنشاء، ويحدّث ذلك التعليق عندما يستطيع الرمز المميز تعديله، وينشئ تعليقًا جديدًا مملوكًا لـ Mantis عندما لا يمكن تعديل علامة أقدم مملوكة لروبوت.

يجب أن يكون تعليق PR قصيرًا ومرئيًا:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

عندما يفشل التشغيل لأن الحزمة الاختبارية فشلت، يجب أن يذكر التعليق ذلك بدلًا من الإيحاء بأن المرشح فشل.

## ملاحظات النشر الخاص

قد يكون لدى نشر خاص تطبيق Mantis Discord بالفعل. أعد استخدام ذلك التطبيق بدلًا من إنشاء تطبيق آخر عندما تكون لديه أذونات الروبوت الصحيحة ويمكن تدويره بأمان.

اضبط قناة إشعارات المشغّل الأولية من خلال الأسرار أو تهيئة النشر. يمكن أن تشير أولًا إلى قناة صيانة أو عمليات موجودة، ثم تنتقل إلى قناة Mantis مخصصة بمجرد وجودها.

لا تضع معرّفات الخوادم أو معرّفات القنوات أو رموز الروبوتات أو ملفات تعريف ارتباط المتصفح أو كلمات مرور VNC في هذا المستند. خزّنها في أسرار GitHub، أو وسيط بيانات الاعتماد، أو مخزن الأسرار المحلي للمشغّل.

## إضافة سيناريو

يجب أن يصرّح سيناريو Mantis بما يلي:

- المعرّف والعنوان
- النقل
- بيانات الاعتماد المطلوبة
- سياسة مرجع خط الأساس
- سياسة مرجع المرشح
- تصحيح تهيئة OpenClaw
- خطوات الإعداد
- المحفّز
- أوراكل خط الأساس المتوقع
- أوراكل المرشح المتوقع
- أهداف الالتقاط المرئي
- ميزانية المهلة
- خطوات التنظيف

يجب أن تفضّل السيناريوهات أوراكلات صغيرة ومكتوبة الأنواع:

- حالة تفاعل Discord لأخطاء التفاعلات
- مراجع رسائل Discord لأخطاء الترابط
- الطابع الزمني لسلسلة Slack وحالة API التفاعل لأخطاء Slack
- معرّفات رسائل البريد الإلكتروني ورؤوسها لأخطاء البريد الإلكتروني
- لقطات شاشة المتصفح عندما تكون UI هي الشيء الوحيد الموثوق الذي يمكن ملاحظته

يجب أن تكون فحوص الرؤية إضافية. إذا كان بإمكان API المنصة إثبات الخطأ، فاستخدم API كأوراكل نجاح/فشل واحتفظ بلقطات الشاشة لتعزيز ثقة البشر.

## توسيع المزوّدين

بعد Discord، يمكن للمشغّل نفسه إضافة:

- Slack: التفاعلات، السلاسل، إشارات التطبيق، النوافذ المنبثقة، تحميلات الملفات.
- البريد الإلكتروني: مصادقة Gmail وترابط الرسائل باستخدام `gog` عندما لا تكفي الموصلات.
- WhatsApp: تسجيل الدخول عبر QR، إعادة التعريف، تسليم الرسائل، الوسائط، التفاعلات.
- Telegram: بوابات الإشارة في المجموعات، الأوامر، التفاعلات عندما تكون متاحة.
- Matrix: الغرف المشفرة، علاقات السلاسل أو الردود، استئناف التشغيل بعد إعادة التشغيل.

يجب أن يكون لكل نقل سيناريو فحص سريع رخيص وسيناريو واحد أو أكثر لفئات الأخطاء. يجب أن تبقى السيناريوهات المرئية المكلفة اختيارية.

## أسئلة مفتوحة

- أي روبوت Discord يجب أن يكون السائق، وأيّهما يجب أن يكون SUT، عندما يُعاد استخدام روبوت Mantis الحالي؟
- هل يجب أن يستخدم تسجيل دخول متصفح المراقب حساب Discord بشريًا، أو حساب اختبار، أو فقط أدلة REST القابلة للقراءة بواسطة الروبوت في المرحلة الأولى؟
- كم من الوقت يجب أن يحتفظ GitHub بآثار Mantis الخاصة بـ PRs؟
- متى يجب أن يوصي ClawSweeper تلقائيًا باستخدام Mantis بدلًا من انتظار أمر من أحد الصائنين؟
- هل يجب تنقيح لقطات الشاشة أو قصها قبل رفعها إلى PRs العامة؟
