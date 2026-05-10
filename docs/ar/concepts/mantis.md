---
read_when:
    - إنشاء أو تشغيل ضمان الجودة المرئي المباشر لأخطاء OpenClaw
    - إضافة التحقق القبلي والبعدي لطلب سحب
    - إضافة سيناريوهات النقل المباشر لـ Discord أو Slack أو WhatsApp أو غيرها
    - تصحيح أخطاء عمليات تشغيل ضمان الجودة التي تتطلب لقطات شاشة أو أتمتة المتصفح أو وصول VNC
summary: Mantis هو نظام التحقق البصري الشامل لإعادة إنتاج أخطاء OpenClaw على النواقل الحية، والتقاط أدلة ما قبل الإصلاح وما بعده، وإرفاق المصنوعات بطلبات السحب.
title: فرس النبي
x-i18n:
    generated_at: "2026-05-10T19:33:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1622b86cb5e08def1c8f06a16a0f454c67a58cf42f6c08c40bd66754648b9a95
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis هو نظام التحقق الشامل في OpenClaw للأخطاء التي تحتاج إلى وقت تشغيل حقيقي، ووسيلة نقل حقيقية، وإثبات مرئي. يشغّل سيناريو ضد مرجع معروف بأنه سيئ، ويلتقط الأدلة، ثم يشغّل السيناريو نفسه ضد مرجع مرشح، وينشر المقارنة كأدلة يستطيع المشرف فحصها من PR أو من أمر محلي.

يبدأ Mantis بـ Discord لأن Discord يمنحنا مسارًا أوليًا عالي القيمة: مصادقة بوت حقيقية، وقنوات Guild حقيقية، وتفاعلات، وسلاسل محادثات، وأوامر أصلية، وواجهة متصفح يستطيع البشر من خلالها التأكد بصريًا مما عرضته وسيلة النقل.

## الأهداف

- إعادة إنتاج خطأ من مشكلة أو PR على GitHub بنفس شكل النقل الذي يراه المستخدمون.
- التقاط دليل **قبل** على مرجع الأساس قبل تطبيق الإصلاح.
- التقاط دليل **بعد** على المرجع المرشح بعد تطبيق الإصلاح.
- استخدام حَكَم حتمي كلما أمكن، مثل قراءة تفاعل عبر Discord REST أو فحص نسخة نصية من القناة.
- التقاط لقطات شاشة عندما يكون للخطأ سطح واجهة مرئي.
- التشغيل محليًا من CLI يتحكم به وكيل، وعن بُعد من GitHub.
- حفظ قدر كافٍ من حالة الجهاز للإنقاذ عبر VNC عندما يتعطل تسجيل الدخول أو أتمتة المتصفح أو مصادقة المزوّد.
- نشر حالة موجزة إلى قناة Discord للمشغل عندما يكون التشغيل محجوبًا، أو يحتاج إلى مساعدة VNC يدوية، أو يكتمل.

## غير الأهداف

- Mantis ليس بديلًا لاختبارات الوحدة. يجب أن يتحول تشغيل Mantis عادةً إلى اختبار انحدار أصغر بعد فهم الإصلاح.
- Mantis ليس بوابة CI السريعة العادية. فهو أبطأ، ويستخدم بيانات اعتماد مباشرة، ومخصص للأخطاء التي تهم فيها البيئة الحية.
- يجب ألا يتطلب Mantis إنسانًا في التشغيل العادي. إن VNC اليدوي مسار إنقاذ، وليس المسار السعيد.
- لا يخزن Mantis الأسرار الخام في الأدلة أو السجلات أو لقطات الشاشة أو تقارير Markdown أو تعليقات PR.

## الملكية

يقع Mantis ضمن حزمة QA في OpenClaw.

- تملك OpenClaw وقت تشغيل السيناريو، ومحوّلات النقل، ومخطط الأدلة، وCLI المحلي تحت `pnpm openclaw qa mantis`.
- يملك QA Lab أجزاء عدة النقل الحية، ومساعدات التقاط المتصفح، وكتّاب الأدلة.
- يملك Crabbox أجهزة Linux المجهزة عندما تكون هناك حاجة إلى VM عن بُعد.
- تملك GitHub Actions نقطة دخول سير العمل البعيد والاحتفاظ بالأدلة.
- يملك ClawSweeper توجيه تعليقات GitHub: تحليل أوامر المشرفين، وإرسال سير العمل، ونشر تعليق PR النهائي.
- تقود وكلاء OpenClaw استخدام Mantis عبر Codex عندما يحتاج السيناريو إلى إعداد وكيل، أو تصحيح، أو الإبلاغ عن حالة عالقة.

يحافظ هذا الحد على معرفة النقل في OpenClaw، وجدولة الأجهزة في Crabbox، ولصق سير عمل المشرفين في ClawSweeper.

## شكل الأمر

يتحقق الأمر المحلي الأول من بوت Discord، وGuild، والقناة، وإرسال الرسالة، وإرسال التفاعل، ومسار الأدلة:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

يقبل مشغّل قبل وبعد المحلي هذا الشكل:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ينشئ المشغّل worktrees منفصلة للأساس والمرشح تحت دليل الإخراج، ويثبت التبعيات، ويبني كل مرجع، ويشغّل السيناريو مع `--allow-failures`، ثم يكتب `baseline/` و`candidate/` و`comparison.json` و`mantis-report.md`. بالنسبة إلى سيناريو Discord الأول، يعني التحقق الناجح أن حالة الأساس هي `fail` وحالة المرشح هي `pass`.

يستهدف مسبار Discord الثاني قبل/بعد مرفقات السلاسل:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

ينشر ذلك السيناريو رسالة أصلية باستخدام بوت السائق، وينشئ سلسلة Discord حقيقية، ويستدعي إجراء `message.thread-reply` في OpenClaw باستخدام `filePath` محلي في المستودع، ثم يستطلع السلسلة بحثًا عن رد SUT واسم ملف المرفق. تُظهر لقطة شاشة الأساس الرد بلا مرفق؛ وتُظهر لقطة شاشة المرشح مرفق `mantis-thread-report.md` المتوقع.

أول بدائية VM/متصفح هي دخان سطح المكتب:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

تستأجر أو تعيد استخدام جهاز سطح مكتب Crabbox، وتبدأ متصفحًا مرئيًا داخل جلسة VNC، وتلتقط سطح المكتب، وتسحب الأدلة مرة أخرى إلى دليل الإخراج المحلي، وتكتب أمر إعادة الاتصال في التقرير. يستخدم الأمر مزوّد Hetzner افتراضيًا لأنه أول مزوّد لديه تغطية سطح مكتب/VNC عاملة في مسار Mantis. تجاوزه باستخدام `--provider` أو `--crabbox-bin` أو `OPENCLAW_MANTIS_CRABBOX_PROVIDER` عند التشغيل ضد أسطول Crabbox آخر.

أعلام دخان سطح المكتب المفيدة:

- `--lease-id <cbx_...>` أو `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` يعيد استخدام سطح مكتب مجهز.
- `--browser-url <url>` يغير الصفحة المفتوحة في المتصفح المرئي.
- `--html-file <path>` يعرض دليل HTML محليًا في المستودع داخل المتصفح المرئي. يستخدم Mantis هذا لالتقاط الخط الزمني الناتج عن تفاعل حالة Discord عبر سطح مكتب Crabbox حقيقي.
- `--browser-profile-dir <remote-path>` يعيد استخدام Chrome user-data-dir بعيد بحيث يمكن لسطح مكتب Mantis المستمر أن يبقى مسجل الدخول بين مرات التشغيل. استخدم هذا لملف تعريف عارض Discord Web طويل العمر.
- `--browser-profile-archive-env <name>` يستعيد أرشيف Chrome user-data-dir بصيغة base64 `.tgz` من متغير البيئة المسمى قبل تشغيل المتصفح. استخدم هذا للشهود مسجلي الدخول مثل Discord Web. متغير البيئة الافتراضي هو `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` يتحكم في مدة التقاط MP4. استخدم مدة أطول لتطبيقات الويب البطيئة مسجلة الدخول التي تحتاج وقتًا للاستقرار.
- `--keep-lease` أو `OPENCLAW_MANTIS_KEEP_VM=1` يبقي تأجيرًا ناجحًا جديدًا مفتوحًا لفحص VNC. تحتفظ مرات التشغيل الفاشلة بالتأجير افتراضيًا عندما يُنشأ واحد حتى يتمكن المشغل من إعادة الاتصال.
- تضبط `--class` و`--idle-timeout` و`--ttl` حجم الجهاز وعمر التأجير.

بالنسبة إلى أدلة Discord Web، يستخدم Mantis حساب عارض مخصصًا بدلًا من رمز بوت. يبقى سيناريو Discord API الحي هو الحَكَم: ينشئ السلسلة الحقيقية، ويرسل `thread-reply` من SUT، ويفحص المرفق عبر Discord REST. عند تعيين `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`، يكتب السيناريو أيضًا دليل URL لـ Discord Web. وعند تعيين `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`، يترك تلك السلسلة متاحة مدة كافية كي يفتحها متصفح مسجل الدخول ويسجلها.

يفتح سير عمل GitHub عنوان URL لسلسلة المرشح في Discord Web، ويلتقط لقطة شاشة، ويسجل MP4، وينشئ معاينة GIF مقصوصة الحركة عندما تكون أدوات وسائط Crabbox متاحة. فضّل مسار ملف تعريف عارض مستمرًا مكونًا عبر `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`، لأن أرشيفات ملف تعريف Chrome الكاملة يمكن أن تتجاوز حد حجم أسرار GitHub. بالنسبة إلى ملفات التعريف الصغيرة/التمهيدية، يستطيع سير العمل أيضًا استعادة أرشيف `.tgz` بصيغة base64 من `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. إذا لم يُكوَّن أي مصدر ملف تعريف، فسيظل سير العمل ينشر لقطات شاشة مرفقات الأساس/المرشح الحتمية ويسجل إشعارًا بأن شاهد Discord Web مسجل الدخول قد تم تخطيه.

أول بدائية نقل سطح مكتب كاملة هي دخان سطح مكتب Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

تستأجر أو تعيد استخدام جهاز سطح مكتب Crabbox، وتزامن النسخة الحالية إلى VM، وتشغل `pnpm openclaw qa slack` داخل ذلك VM، وتفتح Slack Web في متصفح VNC، وتلتقط سطح المكتب المرئي، وتنسخ أدلة Slack QA ولقطة شاشة VNC إلى دليل الإخراج المحلي. هذا هو أول شكل من Mantis يعيش فيه كل من OpenClaw Gateway الخاص بـ SUT والمتصفح داخل VM سطح مكتب Linux نفسه.

مع `--gateway-setup`، يحضّر الأمر منزل OpenClaw مؤقتًا ومستمرًا في `$HOME/.openclaw-mantis/slack-openclaw`، ويرقّع إعدادات Slack Socket Mode للقناة المحددة، ويبدأ `openclaw gateway run` على المنفذ `38973`، ويبقي Chrome قيد التشغيل في جلسة VNC. هذا هو نمط "اترك لي سطح مكتب Linux مع Slack وclaw يعمل"؛ ويظل مسار Slack QA بوت-إلى-بوت هو الافتراضي عند حذف `--gateway-setup`.

المدخلات المطلوبة لـ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` لمسار النموذج البعيد. إذا كان `OPENAI_API_KEY` فقط معينًا محليًا، يربطه Mantis إلى `OPENCLAW_LIVE_OPENAI_KEY` قبل استدعاء Crabbox حتى يتمكن تمرير بيئة `OPENCLAW_*` في Crabbox من حمله إلى VM.

مع `--gateway-setup --credential-source convex`، يستأجر Mantis بيانات اعتماد SUT الخاصة بـ Slack من المجموعة المشتركة قبل إنشاء VM ويمرر معرف القناة المستأجر، ورمز تطبيق Socket Mode، ورمز البوت كبيئة تشغيل `OPENCLAW_MANTIS_SLACK_*` داخل سطح المكتب. يحافظ ذلك على خفة سير عمل GitHub: فهي تحتاج فقط إلى سر وسيط Convex، وليس رموز بوت Slack الخام أو رموز التطبيق.

أعلام سطح مكتب Slack المفيدة:

- `--lease-id <cbx_...>` يعيد التشغيل ضد جهاز سبق للمشغل تسجيل الدخول إلى Slack Web عليه عبر VNC.
- `--gateway-setup` يبدأ OpenClaw Slack Gateway مستمرًا في VM بدلًا من تشغيل مسار QA بوت-إلى-بوت فقط.
- `--keep-lease` يبقي Gateway VM مفتوحًا لفحص VNC بعد النجاح؛ ويوقفه `--no-keep-lease` بعد جمع الأدلة.
- `--slack-url <url>` يفتح عنوان URL محددًا لـ Slack Web. بدونه، يستنتج Mantis `https://app.slack.com/client/<team>/<channel>` من Slack `auth.test` عندما يكون رمز بوت SUT متاحًا.
- `--slack-channel-id <id>` يتحكم في قائمة السماح لقنوات Slack المستخدمة بواسطة إعداد Gateway.
- يتحكم `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` في ملف تعريف Chrome المستمر داخل VM. الافتراضي هو `$HOME/.config/openclaw-mantis/slack-chrome-profile`، بحيث ينجو تسجيل دخول Slack Web يدوي من إعادة التشغيل على نفس التأجير.
- `--credential-source convex --credential-role ci` يستخدم مجموعة بيانات الاعتماد المشتركة بدلًا من رموز بيئة Slack المباشرة.
- تمرر `--provider-mode` و`--model` و`--alt-model` و`--fast` إلى مسار Slack الحي.

سير عمل دخان GitHub هو `Mantis Discord Smoke`. وسير عمل GitHub قبل وبعد للسيناريو الحقيقي الأول هو `Mantis Discord Status Reactions`. يقبل:

- `baseline_ref`: المرجع المتوقع أن يعيد إنتاج سلوك queued-only.
- `candidate_ref`: المرجع المتوقع أن يعرض `queued -> thinking -> done`.

يفحص مرجع عدة سير العمل، ويبني worktrees منفصلة للأساس والمرشح، ويشغّل `discord-status-reactions-tool-only` ضد كل worktree، ويرفع `baseline/` و`candidate/` و`comparison.json` و`mantis-report.md` كأدلة Actions. كما يعرض HTML للخط الزمني لكل مسار في متصفح سطح مكتب Crabbox وينشر لقطات شاشة VNC هذه بجانب صور PNG للخط الزمني الحتمية في تعليق PR. يضمّن تعليق PR نفسه معاينات GIF خفيفة مقصوصة الحركة مولدة بواسطة `crabbox media preview`، ويربط بمقاطع MP4 المطابقة مقصوصة الحركة، ويحتفظ بملفات MP4 الكاملة لسطح المكتب للفحص العميق. تبقى لقطات الشاشة مضمّنة للمراجعة السريعة. يبني سير العمل Crabbox CLI من `openclaw/crabbox` main حتى يستطيع استخدام أعلام تأجير سطح المكتب/المتصفح الحالية قبل إصدار ثنائية Crabbox التالية.

`Mantis Scenario` هو نقطة الدخول اليدوية العامة. يأخذ `scenario_id` و`candidate_ref` و`baseline_ref` اختياريًا و`pr_number` اختياريًا، ثم يرسل سير العمل المملوك للسيناريو. الغلاف رفيع عمدًا: ما زالت سير عمل السيناريوهات تملك إعداد النقل، وبيانات الاعتماد، وفئة VM، والحَكَم المتوقع، وبيان الأدلة.

`Mantis Slack Desktop Smoke` هو أول سير عمل لآلة Slack الافتراضية. يسحب
مرجع المرشح الموثوق إلى worktree منفصل، ويستأجر سطح مكتب Linux من Crabbox،
ويشغّل `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` على ذلك
المرشح، ويفتح Slack Web في متصفح VNC، ويسجل سطح المكتب، وينشئ معاينة مقصوصة
حسب الحركة باستخدام `crabbox media preview`، ويرفع دليل الأثر الكامل،
وينشر اختياريا تعليق الدليل المضمن على PR المستهدف. يستخدم AWS افتراضيا
لاستئجار سطح المكتب، ويوفر إدخال مزود يدويا كي يستطيع المشغلون التحويل إلى
Hetzner عندما تكون سعة AWS بطيئة أو غير متاحة. استخدم هذا المسار عندما تريد
"سطح مكتب Linux مع Slack ومخلب يعمل" بدلا من مجرد نص محادثة Slack بين بوتين.

`Mantis Telegram Live` يغلف مسار ضمان الجودة الحي الحالي في Telegram ضمن مسار
أدلة PR نفسه. يسحب مرجع المرشح الموثوق إلى worktree منفصل، ويشغّل
`pnpm openclaw qa telegram --credential-source convex
--credential-role ci`، ويكتب بيان `mantis-evidence.json` من ملخص ضمان جودة
Telegram وأثر الرسالة المرصودة، ويعرض HTML نص المحادثة المنقح عبر متصفح سطح
مكتب Crabbox، وينشئ GIF مقصوصا حسب الحركة باستخدام `crabbox media preview`،
وينشر تعليق دليل PR المضمن عند توفر رقم PR. هذا المسار بصري لنص المحادثة وليس
دليلا من Telegram Web بتسجيل دخول: تمنح Telegram Bot API دليلا مستقرا للرسائل
الحية، لكن حالة تسجيل الدخول إلى Telegram Web غير مطلوبة لأتمتة Mantis العادية.

لإعداد سطح مكتب Telegram بمشاركة بشرية، استخدم باني السيناريو:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

يستأجر الباني سطح مكتب Crabbox أو يعيد استخدامه، ويثبت ملف Telegram Desktop
الثنائي الأصلي لنظام Linux، ويستعيد اختياريا أرشيف جلسة مستخدم، ويضبط
OpenClaw باستخدام رمز بوت Telegram SUT المستأجر، ويشغّل `openclaw gateway run`
على المنفذ `38974`، وينشر رسالة جاهزية من بوت التشغيل إلى المجموعة الخاصة
المستأجرة، ثم يلتقط لقطة شاشة وملف MP4 من سطح مكتب VNC المرئي. رمز البوت لا
يسجل الدخول إلى Telegram Desktop أبدا؛ فهو يضبط OpenClaw فقط. عارض سطح المكتب
هو جلسة مستخدم Telegram منفصلة تُستعاد من
`--telegram-profile-archive-env <name>` أو تُنشأ يدويا عبر VNC وتبقى حية
باستخدام `--keep-lease`.

أعلام باني سطح مكتب Telegram المفيدة:

- `--lease-id <cbx_...>` يعيد التشغيل على آلة افتراضية سجّل فيها مشغل الدخول إلى Telegram Desktop مسبقا.
- `--telegram-profile-archive-env <name>` يقرأ أرشيف ملف تعريف Telegram Desktop بصيغة `.tgz` مرمز base64 من متغير البيئة ذاك ويستعيده قبل الإطلاق.
- `--telegram-profile-dir <remote-path>` يتحكم في دليل ملف تعريف Telegram Desktop البعيد. الافتراضي هو `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` يثبت ويفتح Telegram Desktop دون ضبط OpenClaw.
- `--credential-source convex --credential-role ci` يستخدم وسيط بيانات الاعتماد المشترك بدلا من رموز بيئة Telegram المباشرة.

كل سيناريو نشر إلى PR يكتب `mantis-evidence.json` بجانب تقريره.
هذا المخطط هو نقطة التسليم بين كود السيناريو وتعليقات GitHub:

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

قيم `path` للأثر نسبية إلى دليل البيان. قيم `targetPath`
هي مسارات نسبية ضمن دليل النشر لفرع `qa-artifacts`.
يرفض الناشر اجتياز المسارات ويتخطى الإدخالات المعلّمة
`"required": false` عندما لا تكون المعاينات أو مقاطع الفيديو الاختيارية متاحة.

أنواع الآثار المدعومة:

- `timeline`: لقطة شاشة حتمية للسيناريو، عادة قبل/بعد.
- `desktopScreenshot`: لقطة شاشة لسطح مكتب VNC/المتصفح.
- `motionPreview`: GIF متحرك مضمّن منشأ من تسجيل سطح المكتب.
- `motionClip`: MP4 مقصوص حسب الحركة يزيل البداية والنهاية الساكنتين.
- `fullVideo`: تسجيل MP4 كامل للفحص العميق.
- `metadata`: ملف JSON/سجل مرافق.
- `report`: تقرير Markdown.

الناشر القابل لإعادة الاستخدام هو `scripts/mantis/publish-pr-evidence.mjs`. تستدعيه سير العمل بالبيان، وPR المستهدف، وجذر هدف `qa-artifacts`، وعلامة التعليق،
وعنوان URL لأثر Actions، وعنوان URL للتشغيل، ومصدر الطلب. ينسخ الآثار المصرح بها
إلى فرع `qa-artifacts`، ويبني تعليق PR يبدأ بالملخص مع صور/معاينات مضمّنة
ومقاطع فيديو مرتبطة، ثم يحدث تعليق العلامة الموجود أو ينشئ واحدا.

يمكنك أيضا تشغيل تنفيذ تفاعلات الحالة مباشرة من تعليق PR:

```text
@Mantis discord status reactions
```

مشغل التعليق ضيق عمدا. يعمل فقط على تعليقات pull request من مستخدمين لديهم صلاحية
write أو maintain أو admin، ولا يتعرف إلا على طلبات تفاعل حالة Discord. افتراضيا
يستخدم مرجع الأساس السيئ المعروف وSHA رأس PR الحالي بوصفه المرشح. يمكن للمشرفين
تجاوز أي من المرجعين:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

يمكن أيضا تشغيل ضمان جودة Telegram الحي من تعليق PR:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

افتراضيا يستخدم SHA رأس PR الحالي بوصفه المرشح ويشغّل
`telegram-status-command`. يمكن للمشرفين تجاوز `candidate=...`،
و`provider=aws|hetzner`، و`lease=<cbx_...>` عندما يحتاجون إلى مرجع محدد أو سطح
مكتب Crabbox مهيأ مسبقا.

أمثلة أوامر ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

الأمر الأول صريح ومركز على السيناريو. يمكن للثاني لاحقا ربط PR
أو مشكلة بسيناريوهات Mantis موصى بها من التسميات والملفات المتغيرة ونتائج مراجعة
ClawSweeper.

## دورة حياة التشغيل

1. الحصول على بيانات الاعتماد.
2. تخصيص آلة افتراضية أو إعادة استخدامها.
3. إعداد ملف تعريف سطح المكتب/المتصفح عندما يحتاج السيناريو إلى دليل واجهة مستخدم.
4. إعداد checkout نظيف لمرجع الأساس.
5. تثبيت التبعيات وبناء ما يحتاجه السيناريو فقط.
6. بدء OpenClaw Gateway فرعي بدليل حالة معزول.
7. ضبط النقل الحي، والمزود، والنموذج، وملف تعريف المتصفح.
8. تشغيل السيناريو والتقاط دليل الأساس.
9. إيقاف Gateway وحفظ السجلات.
10. إعداد مرجع المرشح في الآلة الافتراضية نفسها.
11. تشغيل السيناريو نفسه والتقاط دليل المرشح.
12. مقارنة نتائج أوراكل والأدلة البصرية.
13. كتابة Markdown وJSON والسجلات ولقطات الشاشة وآثار التتبع الاختيارية.
14. رفع آثار GitHub Actions.
15. نشر رسالة حالة موجزة إلى PR أو Discord.

ينبغي أن يكون السيناريو قادرا على الفشل بطريقتين مختلفتين:

- **أعيد إنتاج الخلل**: فشل الأساس بالطريقة المتوقعة.
- **فشل الحزمة الاختبارية**: فشل إعداد البيئة أو بيانات الاعتماد أو Discord API أو المتصفح أو
  المزود قبل أن تكون أوراكل الخلل ذات معنى.

يجب أن يفصل التقرير النهائي بين هذه الحالات حتى لا يخلط المشرفون بين بيئة متقلبة
وسلوك المنتج.

## Discord MVP

ينبغي أن يستهدف السيناريو الأول تفاعلات حالة Discord في قنوات guild حيث
يكون وضع تسليم الرد المصدر هو `message_tool_only`.

لماذا هو بذرة Mantis جيدة:

- يظهر في Discord كتفاعلات على الرسالة المشغلة.
- لديه أوراكل REST قوية عبر حالة تفاعل رسالة Discord.
- يختبر OpenClaw Gateway حقيقيا، ومصادقة بوت Discord، وإرسال الرسائل،
  ووضع تسليم الرد المصدر، وحالة تفاعل الحالة، ودورة حياة دور النموذج.
- هو ضيق بما يكفي ليبقي التنفيذ الأول دقيقا.

شكل السيناريو المتوقع:

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

يجب أن يظهر دليل الأساس تفاعل إقرار الاصطفاف لكن دون انتقال دورة حياة في وضع
tool-only. يجب أن يظهر دليل المرشح تفاعلات حالة دورة الحياة وهي تعمل عندما يكون
`messages.statusReactions.enabled` مفعلا صراحة.

الشريحة الأولى القابلة للتنفيذ هي سيناريو ضمان جودة Discord الحي الاختياري:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

يضبط SUT للتعامل الدائم مع guild، و`visibleReplies:
"message_tool"`، و`ackReaction: "👀"`، وتفاعلات الحالة الصريحة. تستطلع أوراكل
رسالة Discord المشغلة الحقيقية وتتوقع التسلسل المرصود
`👀 -> 🤔 -> 👍`. تشمل الآثار `discord-qa-reaction-timelines.json`،
و`discord-status-reactions-tool-only-timeline.html`، و
`discord-status-reactions-tool-only-timeline.png`.

## أجزاء ضمان الجودة الحالية

ينبغي أن يبني Mantis على حزمة ضمان الجودة الخاصة الحالية بدلا من البدء من الصفر:

- `pnpm openclaw qa discord` يشغّل بالفعل مسار Discord حيا ببوتات تشغيل وSUT.
- مشغّل النقل الحي يكتب بالفعل التقارير وآثار الرسائل المرصودة ضمن `.artifacts/qa-e2e/`.
- تؤمن عقود بيانات اعتماد Convex بالفعل وصولا حصريا إلى بيانات اعتماد النقل الحي المشتركة.
- تدعم خدمة التحكم في المتصفح بالفعل لقطات الشاشة واللقطات، وملفات التعريف المدارة بلا واجهة، وملفات تعريف CDP البعيدة.
- لدى QA Lab بالفعل واجهة مصحح وحافلة لاختبارات بشكل النقل.

يمكن أن يكون تنفيذ Mantis الأول مشغلا رفيعا قبل/بعد فوق هذه الأجزاء،
مع طبقة دليل بصري واحدة.

## نموذج الأدلة

كل تشغيل يكتب دليل آثار مستقرا:

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

ينبغي أن يكون `mantis-summary.json` مصدر الحقيقة المقروء آليا.
تقرير Markdown مخصص لتعليقات PR والمراجعة البشرية.

يجب أن يتضمن الملخص:

- المراجع وSHAs التي اختبرت
- النقل ومعرّف السيناريو
- مزود الآلة ومعرّف الآلة أو معرّف العقد
- مصدر بيانات الاعتماد دون قيم سرية
- نتيجة الأساس
- نتيجة المرشح
- ما إذا كان الخلل قد أعيد إنتاجه على الأساس
- ما إذا كان المرشح قد أصلحه
- مسارات الآثار
- مشكلات الإعداد أو التنظيف المنقحة

لقطات الشاشة أدلة وليست أسرارا. لكنها لا تزال تحتاج إلى انضباط تنقيح:
قد تظهر أسماء قنوات خاصة أو أسماء مستخدمين أو محتوى رسائل. بالنسبة إلى PRs العامة،
فضّل روابط آثار GitHub Actions على الصور المضمنة إلى أن تصبح قصة التنقيح أقوى.

## المتصفح وVNC

لمسار المتصفح وضعان:

- **الأتمتة بلا واجهة**: الافتراضي لـ CI. يعمل Chrome مع تمكين CDP،
  ويلتقط Playwright أو تحكم متصفح OpenClaw لقطات الشاشة.
- **إنقاذ VNC**: مفعّل على الآلة الافتراضية نفسها عندما يحتاج تسجيل الدخول أو MFA أو مقاومة Discord للأتمتة
  أو التصحيح البصري إلى إنسان.

ينبغي أن يكون ملف تعريف متصفح مراقب Discord دائما بما يكفي لتجنب تسجيل الدخول
في كل تشغيل، لكنه معزول عن حالة المتصفح الشخصية. ينتمي ملف التعريف إلى مجموعة آلات
Mantis، وليس إلى حاسوب مطور محمول.

عندما يتعثر Mantis، ينشر رسالة حالة Discord مع:

- معرف التشغيل
- معرف السيناريو
- مزود الجهاز
- دليل الأثر
- تعليمات اتصال VNC أو noVNC إن توفرت
- نص قصير للمانع

يمكن لأول نشر خاص أن ينشر هذه الرسائل في قناة المشغّل الحالية
وينتقل لاحقًا إلى قناة Mantis مخصصة.

## الأجهزة

يجب أن تفضّل Mantis استخدام AWS عبر Crabbox لأول تنفيذ بعيد.
يوفر Crabbox أجهزة جاهزة مسبقًا، وتتبعًا للتأجير، وتهيئة، وسجلات، ونتائج،
وتنظيفًا. إذا كانت سعة AWS بطيئة جدًا أو غير متاحة، فأضف مزود Hetzner
خلف واجهة الجهاز نفسها.

الحد الأدنى لمتطلبات الجهاز الافتراضي:

- Linux مع تثبيت Chrome أو Chromium قادر على تشغيل سطح مكتب
- وصول CDP لأتمتة المتصفح
- VNC أو noVNC للإنقاذ
- Node 22 وpnpm
- نسخة عمل OpenClaw وذاكرة تخزين مؤقت للتبعيات
- ذاكرة تخزين مؤقت لمتصفح Playwright Chromium عند استخدام Playwright
- ما يكفي من CPU والذاكرة لتشغيل OpenClaw Gateway واحد، ومتصفح واحد، وتشغيل نموذج واحد
- وصول صادر إلى Discord وGitHub ومزودي النماذج ووسيط بيانات الاعتماد

يجب ألا يحتفظ الجهاز الافتراضي بأسرار خام طويلة العمر خارج مخازن بيانات الاعتماد أو
ملفات تعريف المتصفح المتوقعة.

## الأسرار

توجد الأسرار في أسرار مؤسسة GitHub أو المستودع لعمليات التشغيل البعيدة، وفي
ملف أسرار محلي يتحكم فيه المشغّل لعمليات التشغيل المحلية.

أسماء الأسرار الموصى بها:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لرفع آثار GitHub العامة
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

على المدى الطويل، يجب أن يظل مخزون بيانات اعتماد Convex هو المصدر المعتاد لبيانات اعتماد
النقل الحية. تعمل أسرار GitHub على تمهيد الوسيط ومسارات الرجوع.
يعيد سير عمل تفاعلات حالة Discord تعيين أسرار Mantis Crabbox إلى
متغيرَي البيئة `CRABBOX_COORDINATOR` و`CRABBOX_COORDINATOR_TOKEN`
اللذين تتوقعهما Crabbox CLI. تظل أسماء أسرار GitHub العادية `CRABBOX_*`
مقبولة كبديل توافق.

يجب ألا يطبع مشغّل Mantis مطلقًا:

- رموز بوتات Discord
- مفاتيح API للمزودين
- ملفات تعريف ارتباط المتصفح
- محتويات ملفات تعريف المصادقة
- كلمات مرور VNC
- حمولات بيانات الاعتماد الخام

يجب أن تحجب عمليات رفع الآثار العامة أيضًا بيانات تعريف هدف Discord مثل معرفات البوت،
والخادم، والقناة، والرسالة. يفعّل سير عمل اختبار الدخان في GitHub
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لهذا السبب.

إذا لُصق رمز عن طريق الخطأ في issue أو PR أو محادثة أو سجل، فقم بتدويره
بعد تخزين السر الجديد.

## آثار GitHub وتعليقات PR

يجب أن ترفع تدفقات عمل Mantis حزمة الأدلة الكاملة كأثر Actions قصير العمر.
عند تشغيل سير العمل لتقرير خلل أو PR إصلاح، يجب أن ينشر أيضًا
لقطات شاشة PNG المنقحة إلى فرع `qa-artifacts` وأن يحدّث أو ينشئ
تعليقًا على ذلك الخلل أو PR الإصلاح مع لقطات شاشة قبل/بعد مضمنة. لا تنشر
الإثبات الأساسي فقط على PR عام لأتمتة QA. تبقى السجلات الخام، والرسائل
المرصودة، والأدلة الضخمة الأخرى في أثر Actions.

يجب أن تنشر تدفقات عمل الإنتاج تلك التعليقات باستخدام تطبيق Mantis في GitHub، وليس
باستخدام `github-actions[bot]`. خزّن معرف التطبيق والمفتاح الخاص كأسرار
GitHub Actions باسمَي `MANTIS_GITHUB_APP_ID` و`MANTIS_GITHUB_APP_PRIVATE_KEY`.
يستخدم سير العمل علامة مخفية كمفتاح تحديث أو إنشاء، ويحدّث ذلك
التعليق عندما يستطيع الرمز تعديله، وينشئ تعليقًا جديدًا مملوكًا لـ Mantis عندما
يتعذر تعديل علامة أقدم مملوكة لبوت.

يجب أن يكون تعليق PR قصيرًا وبصريًا:

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

عندما يفشل التشغيل بسبب فشل عدة الاختبار، يجب أن يوضح التعليق ذلك بدلًا من
الإيحاء بأن المرشح فشل.

## ملاحظات النشر الخاص

قد يكون لدى نشر خاص تطبيق Mantis Discord بالفعل. أعد استخدام ذلك
التطبيق بدلًا من إنشاء تطبيق آخر عندما يمتلك أذونات البوت الصحيحة
ويمكن تدويره بأمان.

اضبط قناة إشعارات المشغّل الأولية عبر الأسرار أو تكوين النشر.
يمكن أن تشير أولًا إلى قناة مشرفين أو عمليات حالية، ثم تنتقل إلى قناة Mantis مخصصة
عندما تصبح موجودة.

لا تضع معرفات الخوادم، أو معرفات القنوات، أو رموز البوتات، أو ملفات تعريف ارتباط المتصفح، أو كلمات مرور VNC
في هذا المستند. خزّنها في أسرار GitHub، أو وسيط بيانات الاعتماد، أو
مخزن الأسرار المحلي الخاص بالمشغّل.

## إضافة سيناريو

يجب أن يعلن سيناريو Mantis عن:

- المعرّف والعنوان
- النقل
- بيانات الاعتماد المطلوبة
- سياسة مرجع خط الأساس
- سياسة مرجع المرشح
- رقعة تكوين OpenClaw
- خطوات الإعداد
- المحفّز
- أوراكل خط الأساس المتوقع
- أوراكل المرشح المتوقع
- أهداف الالتقاط البصري
- ميزانية المهلة الزمنية
- خطوات التنظيف

يجب أن تفضّل السيناريوهات أوراكلات صغيرة ومحددة الأنواع:

- حالة تفاعل Discord لأخطاء التفاعل
- مراجع رسائل Discord لأخطاء المحادثات المتفرعة
- طابع Slack الزمني للمحادثة وحالة API التفاعلات لأخطاء Slack
- معرفات رسائل البريد الإلكتروني وترويساتها لأخطاء البريد الإلكتروني
- لقطات شاشة المتصفح عندما تكون UI هي المرصود الموثوق الوحيد

يجب أن تكون فحوصات الرؤية إضافية. إذا كان بإمكان API منصة إثبات الخلل، فاستخدم
API كأوراكل نجاح/فشل واحتفظ بلقطات الشاشة لثقة البشر.

## توسيع المزودين

بعد Discord، يمكن للمشغّل نفسه إضافة:

- Slack: التفاعلات، والمحادثات المتفرعة، وذكر التطبيقات، والنوافذ، ورفع الملفات.
- البريد الإلكتروني: مصادقة Gmail وتسلسل الرسائل باستخدام `gog` عندما لا تكون الموصلات
  كافية.
- WhatsApp: تسجيل الدخول عبر QR، وإعادة التعريف، وتسليم الرسائل، والوسائط، والتفاعلات.
- Telegram: ضبط ذكر المجموعة، والأوامر، والتفاعلات حيثما توفرت.
- Matrix: الغرف المشفرة، وعلاقات المحادثات المتفرعة أو الردود، واستئناف التشغيل بعد إعادة التشغيل.

يجب أن يحتوي كل نقل على سيناريو اختبار دخان رخيص وسيناريو واحد أو أكثر
لفئة أخطاء. يجب أن تظل السيناريوهات البصرية المكلفة اختيارية.

## أسئلة مفتوحة

- أي بوت Discord يجب أن يكون المشغّل، وأيها يجب أن يكون SUT، عند
  إعادة استخدام بوت Mantis الحالي؟
- هل يجب أن يستخدم تسجيل دخول متصفح المراقب حساب Discord بشريًا، أو حساب اختبار،
  أو أدلة REST قابلة للقراءة بواسطة البوت فقط للمرحلة الأولى؟
- إلى متى يجب أن يحتفظ GitHub بآثار Mantis الخاصة بـ PRs؟
- متى يجب أن توصي ClawSweeper تلقائيًا باستخدام Mantis بدلًا من انتظار
  أمر مشرف؟
- هل يجب تنقيح لقطات الشاشة أو اقتصاصها قبل رفعها لـ PRs العامة؟
