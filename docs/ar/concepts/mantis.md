---
read_when:
    - بناء أو تشغيل اختبارات ضمان الجودة المرئية المباشرة لأخطاء OpenClaw
    - إضافة التحقق قبل وبعد لطلب سحب
    - إضافة Discord أو Slack أو WhatsApp أو سيناريوهات نقل مباشر أخرى
    - تصحيح أخطاء تشغيلات ضمان الجودة التي تحتاج إلى لقطات شاشة أو أتمتة المتصفح أو وصول VNC
summary: Mantis هو نظام التحقق المرئي من طرف إلى طرف لإعادة إنتاج أخطاء OpenClaw على قنوات النقل الحية، والتقاط أدلة ما قبل وما بعد، وإرفاق المخرجات بطلبات السحب.
title: فرس النبي
x-i18n:
    generated_at: "2026-05-11T20:29:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis هو نظام التحقق الشامل من OpenClaw للأخطاء التي تحتاج إلى runtime حقيقي، ونقل حقيقي، وإثبات مرئي. يشغّل سيناريو مقابل مرجع سيئ معروف، ويلتقط الأدلة، ويشغّل السيناريو نفسه مقابل مرجع مرشّح، وينشر المقارنة كآثار يمكن للمشرف فحصها من PR أو من أمر محلي.

يبدأ Mantis بـ Discord لأن Discord يوفّر لنا أول مسار عالي القيمة: مصادقة bot حقيقية، وقنوات guild حقيقية، وتفاعلات، وسلاسل محادثات، وأوامر أصلية، وواجهة متصفح يستطيع البشر فيها التأكد بصريًا مما عرضه النقل.

## الأهداف

- إعادة إنتاج خطأ من issue أو PR على GitHub بشكل النقل نفسه الذي يراه المستخدمون.
- التقاط أثر **قبل** على مرجع الأساس قبل تطبيق الإصلاح.
- التقاط أثر **بعد** على المرجع المرشّح بعد تطبيق الإصلاح.
- استخدام oracle حتمي كلما أمكن، مثل قراءة تفاعل Discord عبر REST أو فحص نص قناة.
- التقاط لقطات شاشة عندما يكون للخطأ سطح UI مرئي.
- التشغيل محليًا من CLI يتحكم فيه الوكيل وعن بُعد من GitHub.
- حفظ قدر كاف من حالة الجهاز لإنقاذ VNC عندما يتعطل تسجيل الدخول، أو أتمتة المتصفح، أو مصادقة المزوّد.
- نشر حالة موجزة إلى قناة Discord للمشغّل عندما يكون التشغيل محظورًا، أو يحتاج إلى مساعدة VNC يدوية، أو ينتهي.

## ما ليس ضمن الأهداف

- Mantis ليس بديلًا عن اختبارات الوحدة. يجب أن يتحول تشغيل Mantis عادةً إلى اختبار انحدار أصغر بعد فهم الإصلاح.
- Mantis ليس بوابة CI السريعة المعتادة. فهو أبطأ، ويستخدم بيانات اعتماد حية، ومخصص للأخطاء التي تهم فيها البيئة الحية.
- يجب ألا يتطلب Mantis وجود إنسان في التشغيل العادي. VNC اليدوي مسار إنقاذ، وليس المسار السعيد.
- لا يخزّن Mantis أسرارًا خامًا في الآثار، أو السجلات، أو لقطات الشاشة، أو تقارير Markdown، أو تعليقات PR.

## الملكية

يقع Mantis ضمن حزمة QA في OpenClaw.

- تمتلك OpenClaw runtime السيناريو، ومحوّلات النقل، ومخطط الأدلة، وCLI المحلي ضمن `pnpm openclaw qa mantis`.
- يمتلك QA Lab أجزاء أداة النقل الحية، ومساعدات التقاط المتصفح، وكتّاب الآثار.
- يمتلك Crabbox أجهزة Linux الدافئة عندما تكون VM عن بُعد مطلوبة.
- تمتلك GitHub Actions نقطة دخول workflow عن بُعد والاحتفاظ بالآثار.
- يمتلك ClawSweeper توجيه تعليقات GitHub: تحليل أوامر المشرف، وإرسال workflow، ونشر تعليق PR النهائي.
- تقود وكلاء OpenClaw تشغيل Mantis عبر Codex عندما يحتاج السيناريو إلى إعداد وكيل، أو تصحيح أخطاء، أو الإبلاغ عن حالة عالقة.

يبقي هذا الحد معرفة النقل في OpenClaw، وجدولة الأجهزة في Crabbox، وغراء سير عمل المشرفين في ClawSweeper.

## شكل الأمر

يتحقق الأمر المحلي الأول من bot في Discord، وguild، والقناة، وإرسال الرسالة، وإرسال التفاعل، ومسار الآثار:

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

ينشئ المشغّل worktrees منفصلة للأساس والمرشّح تحت دليل الإخراج، ويثبّت الاعتماديات، ويبني كل مرجع، ويشغّل السيناريو مع `--allow-failures`، ثم يكتب `baseline/` و`candidate/` و`comparison.json` و`mantis-report.md`. بالنسبة إلى أول سيناريو Discord، يعني التحقق الناجح أن حالة الأساس هي `fail` وحالة المرشّح هي `pass`.

يستهدف مسبار Discord الثاني قبل/بعد مرفقات السلاسل:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

ينشر ذلك السيناريو رسالة أصلية باستخدام bot المشغّل، وينشئ سلسلة Discord حقيقية، ويستدعي إجراء `message.thread-reply` في OpenClaw باستخدام `filePath` محلي في المستودع، ثم يستطلع السلسلة بحثًا عن رد SUT واسم ملف المرفق. تُظهر لقطة شاشة الأساس الرد من دون مرفق؛ وتُظهر لقطة شاشة المرشّح مرفق `mantis-thread-report.md` المتوقع.

أول بدائية VM/متصفح هي اختبار دخان سطح المكتب:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

يستأجر أو يعيد استخدام جهاز سطح مكتب Crabbox، ويبدأ متصفحًا مرئيًا داخل جلسة VNC، ويلتقط سطح المكتب، ويسحب الآثار إلى دليل الإخراج المحلي، ويكتب أمر إعادة الاتصال في التقرير. يستخدم الأمر افتراضيًا مزوّد Hetzner لأنه أول مزوّد لديه تغطية سطح مكتب/VNC عاملة في مسار Mantis. تجاوز ذلك باستخدام `--provider` أو `--crabbox-bin` أو `OPENCLAW_MANTIS_CRABBOX_PROVIDER` عند التشغيل مقابل أسطول Crabbox آخر.

خيارات اختبار دخان سطح المكتب المفيدة:

- يعيد `--lease-id <cbx_...>` أو `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` استخدام سطح مكتب دافئ.
- يغيّر `--browser-url <url>` الصفحة المفتوحة في المتصفح المرئي.
- يعرض `--html-file <path>` أثر HTML محليًا في المستودع داخل المتصفح المرئي. يستخدم Mantis هذا لالتقاط المخطط الزمني المُنشأ لتفاعلات حالة Discord عبر سطح مكتب Crabbox حقيقي.
- يعيد `--browser-profile-dir <remote-path>` استخدام Chrome user-data-dir عن بُعد حتى يستطيع سطح مكتب Mantis دائم البقاء مسجل الدخول بين التشغيلات. استخدم هذا لملف تعريف عارض Discord Web طويل العمر.
- يستعيد `--browser-profile-archive-env <name>` أرشيف Chrome user-data-dir بصيغة base64 `.tgz` من متغير البيئة المسمى قبل تشغيل المتصفح. استخدم هذا للشهود المسجّلين الدخول مثل Discord Web. متغير البيئة الافتراضي هو `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- يتحكم `--video-duration <seconds>` في طول التقاط MP4. استخدم مدة أطول لتطبيقات الويب المسجّلة الدخول البطيئة التي تحتاج وقتًا للاستقرار.
- يبقي `--keep-lease` أو `OPENCLAW_MANTIS_KEEP_VM=1` عقد إيجار جديدًا ناجحًا مفتوحًا لفحص VNC. تبقي التشغيلات الفاشلة عقد الإيجار افتراضيًا عند إنشائه حتى يتمكن المشغّل من إعادة الاتصال.
- تضبط `--class` و`--idle-timeout` و`--ttl` حجم الجهاز وعمر عقد الإيجار.

لأدلة Discord Web، يستخدم Mantis حساب عارض مخصصًا بدلًا من رمز bot. يبقى سيناريو Discord API الحي هو oracle: فهو ينشئ السلسلة الحقيقية، ويرسل `thread-reply` الخاص بـ SUT، ويفحص المرفق عبر Discord REST. عند ضبط `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`، يكتب السيناريو أيضًا أثر URL لـ Discord Web. عند ضبط `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`، يترك تلك السلسلة متاحة لمدة كافية حتى يفتحها متصفح مسجّل الدخول ويسجلها.

يفتح workflow في GitHub عنوان URL لسلسلة المرشّح في Discord Web، ويلتقط لقطة شاشة، ويسجل MP4، وينشئ معاينة GIF مقصوصة الحركة عندما تكون أدوات وسائط Crabbox متاحة. يفضّل استخدام مسار ملف تعريف عارض دائم مهيأ عبر `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`، لأن أرشيفات ملفات تعريف Chrome الكاملة قد تتجاوز حد حجم أسرار GitHub. بالنسبة إلى ملفات التعريف الصغيرة/التمهيدية، يستطيع workflow أيضًا استعادة أرشيف base64 `.tgz` من `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. إذا لم يُهيأ أي مصدر ملف تعريف، فما يزال workflow ينشر لقطات شاشة مرفقات الأساس/المرشّح الحتمية ويسجل ملاحظة تفيد بتخطي شاهد Discord Web المسجّل الدخول.

أول بدائية نقل كاملة لسطح المكتب هي اختبار دخان Slack لسطح المكتب:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر أو يعيد استخدام جهاز سطح مكتب Crabbox، ويزامن checkout الحالي إلى VM، ويشغّل `pnpm openclaw qa slack` داخل تلك VM، ويفتح Slack Web في متصفح VNC، ويلتقط سطح المكتب المرئي، وينسخ آثار Slack QA ولقطة شاشة VNC معًا إلى دليل الإخراج المحلي. هذا هو أول شكل من Mantis يعيش فيه Gateway الخاص بـ SUT OpenClaw والمتصفح داخل VM سطح مكتب Linux نفسها.

مع `--gateway-setup`، يجهّز الأمر منزل OpenClaw مؤقتًا ودائمًا في `$HOME/.openclaw-mantis/slack-openclaw`، ويصلّح إعداد Slack Socket Mode للقناة المحددة، ويبدأ `openclaw gateway run` على المنفذ `38973`، ويبقي Chrome قيد التشغيل في جلسة VNC. هذا هو وضع "اترك لي سطح مكتب Linux مع Slack وclaw قيد التشغيل"؛ يبقى مسار Slack QA من bot إلى bot هو الافتراضي عند حذف `--gateway-setup`.

المدخلات المطلوبة لـ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` لمسار النموذج البعيد. إذا كان `OPENAI_API_KEY` مضبوطًا محليًا فقط، يربطه Mantis إلى `OPENCLAW_LIVE_OPENAI_KEY` قبل استدعاء Crabbox حتى يستطيع تمرير بيئة `OPENCLAW_*` في Crabbox حمله إلى VM.

مع `--gateway-setup --credential-source convex`، يستأجر Mantis بيانات اعتماد Slack SUT من المجموعة المشتركة قبل إنشاء VM ويمرر معرّف القناة المستأجر، ورمز تطبيق Socket Mode، ورمز bot كبيئة runtime باسم `OPENCLAW_MANTIS_SLACK_*` داخل سطح المكتب. يُبقي ذلك workflows في GitHub خفيفة: فهي لا تحتاج إلا إلى سر وسيط Convex، وليس رموز Slack bot أو التطبيق الخام.

خيارات Slack لسطح المكتب المفيدة:

- يعيد `--lease-id <cbx_...>` التشغيل مقابل جهاز سجّل فيه مشغّل الدخول مسبقًا إلى Slack Web عبر VNC.
- يبدأ `--gateway-setup` Gateway دائمًا لـ OpenClaw Slack داخل VM بدلًا من تشغيل مسار QA من bot إلى bot فقط.
- يبقي `--keep-lease` VM الخاصة بالـ Gateway مفتوحة لفحص VNC بعد النجاح؛ ويوقفها `--no-keep-lease` بعد جمع الآثار.
- يفتح `--slack-url <url>` عنوان URL محددًا لـ Slack Web. من دونه، يشتق Mantis `https://app.slack.com/client/<team>/<channel>` من Slack `auth.test` عندما يكون رمز bot الخاص بـ SUT متاحًا.
- يتحكم `--slack-channel-id <id>` في allowlist قناة Slack المستخدمة بواسطة إعداد Gateway.
- يتحكم `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` في ملف تعريف Chrome الدائم داخل VM. الافتراضي هو `$HOME/.config/openclaw-mantis/slack-chrome-profile`، لذلك يستمر تسجيل الدخول اليدوي إلى Slack Web عبر عمليات إعادة التشغيل على عقد الإيجار نفسه.
- يستخدم `--credential-source convex --credential-role ci` مجموعة بيانات الاعتماد المشتركة بدلًا من رموز بيئة Slack المباشرة.
- تمرر `--provider-mode` و`--model` و`--alt-model` و`--fast` إلى مسار Slack الحي.

workflow اختبار الدخان في GitHub هو `Mantis Discord Smoke`. workflow قبل وبعد في GitHub لأول سيناريو حقيقي هو `Mantis Discord Status Reactions`. يقبل:

- `baseline_ref`: المرجع المتوقع أن يعيد إنتاج سلوك queued فقط.
- `candidate_ref`: المرجع المتوقع أن يُظهر `queued -> thinking -> done`.

يفحص مرجع أداة workflow، ويبني worktrees منفصلة للأساس والمرشّح، ويشغّل `discord-status-reactions-tool-only` مقابل كل worktree، ويرفع `baseline/` و`candidate/` و`comparison.json` و`mantis-report.md` كآثار Actions. كما يعرض HTML المخطط الزمني لكل مسار في متصفح سطح مكتب Crabbox وينشر لقطات شاشة VNC هذه بجانب صور PNG الحتمية للمخطط الزمني في تعليق PR. يضمّن تعليق PR نفسه معاينات GIF خفيفة مقصوصة الحركة مُنشأة بواسطة `crabbox media preview`، ويربط بمقاطع MP4 المطابقة المقصوصة الحركة، ويحتفظ بملفات MP4 الكاملة لسطح المكتب للفحص العميق. تبقى لقطات الشاشة مضمنة للمراجعة السريعة. يبني workflow واجهة Crabbox CLI من الفرع الرئيسي لـ `openclaw/crabbox` حتى يستطيع استخدام خيارات عقد إيجار سطح المكتب/المتصفح الحالية قبل إصدار Crabbox binary التالي.

`Mantis Scenario` هو نقطة الدخول اليدوية العامة. يأخذ `scenario_id` و`candidate_ref` و`baseline_ref` اختياريًا و`pr_number` اختياريًا، ثم يرسل workflow الذي يملكه السيناريو. الغلاف رفيع عن قصد: ما تزال workflows السيناريوهات تمتلك إعداد النقل، وبيانات الاعتماد، وفئة VM، وoracle المتوقع، وبيان الآثار.

`Mantis Slack Desktop Smoke` هو أول سير عمل VM لـ Slack. يفحص مرجع المرشح الموثوق
في worktree منفصل، ويستأجر سطح مكتب Crabbox Linux،
ويشغل `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` ضد ذلك
المرشح، ويفتح Slack Web في متصفح VNC، ويسجل سطح المكتب، وينشئ معاينة
مقتصة بالحركة باستخدام `crabbox media preview`، ويرفع دليل الأثر الكامل،
وينشر اختياريًا تعليق الدليل المضمّن على PR المستهدف.
يستخدم AWS افتراضيًا لاستئجار سطح المكتب ويوفر إدخال مزود يدويًا حتى
يتمكن المشغلون من التبديل إلى Hetzner عندما تكون سعة AWS بطيئة أو غير متاحة. استخدم
هذا المسار عندما تريد "سطح مكتب Linux مع Slack ومخلب قيد التشغيل" بدلًا
من مجرد نص Slack بين بوتين.

`Mantis Telegram Live` يغلّف مسار QA الحي الحالي لـ Telegram ضمن خط
أدلة PR نفسه. يفحص مرجع المرشح الموثوق في worktree منفصل،
ويشغل `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`، ويكتب بيان `mantis-evidence.json` من
ملخص QA الخاص بـ Telegram وأثر الرسالة المرصودة، ويعرض HTML النص
المنقح عبر متصفح سطح مكتب Crabbox، وينشئ GIF مقتصًا بالحركة
باستخدام `crabbox media preview`، وينشر تعليق دليل PR المضمّن عندما يكون رقم PR
متاحًا. هذا المسار بصري للنص وليس دليل Telegram Web مسجل الدخول: تمنح
Telegram Bot API دليل رسائل حيًا ومستقرًا، لكن حالة تسجيل الدخول إلى
Telegram Web غير مطلوبة لأتمتة Mantis العادية.

`Mantis Telegram Desktop Proof` هو غلاف before/after الوكيلي لـ Telegram Desktop
الأصلي. يمكن للمشرف تشغيله من تعليق PR باستخدام
`@Mantis telegram desktop proof`، أو من واجهة Actions بتعليمات حرة،
أو عبر موزع `Mantis Scenario` العام. يمرر سير العمل PR ومرجع الأساس
ومرجع المرشح وتعليمات المشرف إلى Codex.
يقرأ الوكيل PR، ويقرر أي سلوك ظاهر في Telegram يثبت التغيير،
ويشغل مسار إثبات Telegram Desktop الحقيقي لمستخدم فعلي عبر Crabbox للأساس
والمرشح، ويكرر حتى تصبح ملفات GIF الأصلية مفيدة، ويكتب آثار
`motionPreview` المزدوجة في `mantis-evidence.json`، ويرفع الحزمة، وينشر
جدول دليل PR بعمودين عندما يكون رقم PR متاحًا.

لإعداد Telegram desktop بمشاركة بشرية، استخدم منشئ السيناريو:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

يستأجر المنشئ سطح مكتب Crabbox أو يعيد استخدامه، ويثبت ملف Linux
Telegram Desktop الثنائي الأصلي، ويستعيد اختياريًا أرشيف جلسة مستخدم، ويضبط
OpenClaw باستخدام رمز بوت Telegram SUT المستأجر، ويبدأ `openclaw gateway run`
على المنفذ `38974`، وينشر رسالة جاهزية driver-bot إلى المجموعة الخاصة
المستأجرة، ثم يلتقط لقطة شاشة وMP4 من سطح مكتب VNC المرئي. رمز البوت
لا يسجل دخول Telegram Desktop أبدًا؛ إنه يضبط OpenClaw فقط. عارض سطح المكتب
هو جلسة مستخدم Telegram منفصلة مستعادة من
`--telegram-profile-archive-env <name>` أو منشأة يدويًا عبر VNC ومبقاة
نشطة باستخدام `--keep-lease`.

أعلام مفيدة لمنشئ Telegram desktop:

- `--lease-id <cbx_...>` يعيد التشغيل ضد VM سجّل فيها مشغل الدخول مسبقًا إلى Telegram Desktop.
- `--telegram-profile-archive-env <name>` يقرأ أرشيف ملف تعريف Telegram Desktop بتنسيق `.tgz` ومرمزًا بـ base64 من متغير env ذلك ويستعيده قبل التشغيل.
- `--telegram-profile-dir <remote-path>` يتحكم في دليل ملف تعريف Telegram Desktop البعيد. القيمة الافتراضية هي `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` يثبت Telegram Desktop ويفتحه دون ضبط OpenClaw.
- `--credential-source convex --credential-role ci` يستخدم وسيط الاعتماد المشترك بدلًا من رموز env المباشرة لـ Telegram.

كل سيناريو ينشر إلى PR يكتب `mantis-evidence.json` بجانب تقريره.
هذا المخطط هو التسليم بين كود السيناريو وتعليقات GitHub:

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
هي مسارات نسبية تحت دليل نشر فرع `qa-artifacts`.
يرفض الناشر اجتياز المسارات ويتخطى الإدخالات الموسومة بـ
`"required": false` عندما تكون المعاينات أو الفيديوهات الاختيارية غير متاحة.

أنواع الآثار المدعومة:

- `timeline`: لقطة شاشة سيناريو حتمية، عادة قبل/بعد.
- `desktopScreenshot`: لقطة شاشة لسطح مكتب VNC/المتصفح.
- `motionPreview`: GIF متحرك مضمّن مولد من تسجيل سطح المكتب.
- `motionClip`: MP4 مقتص بالحركة يزيل البداية والنهاية الساكنتين.
- `fullVideo`: تسجيل MP4 كامل للفحص العميق.
- `metadata`: ملف JSON/سجل مرافق.
- `report`: تقرير Markdown.

الناشر القابل لإعادة الاستخدام هو `scripts/mantis/publish-pr-evidence.mjs`. تستدعيه
سير العمل مع البيان وPR المستهدف وجذر هدف `qa-artifacts` وعلامة التعليق
وعنوان URL لأثر Actions وعنوان URL للتشغيل ومصدر الطلب. ينسخ الآثار المعلنة
إلى فرع `qa-artifacts`، ويبني تعليق PR يبدأ بالملخص مع صور/معاينات مضمّنة
وفيديوهات مرتبطة، ثم يحدث تعليق العلامة الموجود أو ينشئ واحدًا.

يمكنك أيضًا تشغيل مسار status-reactions مباشرة من تعليق PR:

```text
@Mantis discord status reactions
```

مشغل التعليق ضيق عمدًا. يعمل فقط على تعليقات طلبات السحب
من مستخدمين لديهم صلاحية write أو maintain أو admin، ولا يتعرف إلا على
طلبات status-reaction في Discord. افتراضيًا يستخدم مرجع الأساس المعروف بأنه سيئ
وSHA رأس PR الحالي كمرشح. يمكن للمشرفين تجاوز أي من المرجعين:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

يمكن أيضًا تشغيل QA الحي لـ Telegram من تعليق PR:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

افتراضيًا يستخدم SHA رأس PR الحالي كمرشح ويشغل
`telegram-status-command`. يمكن للمشرفين تجاوز `candidate=...`،
و`provider=aws|hetzner`، و`lease=<cbx_...>` عندما يحتاجون إلى مرجع محدد أو
سطح مكتب Crabbox مُسخّن مسبقًا.

أمثلة أوامر ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

الأمر الأول صريح ومركز على السيناريو. يمكن للثاني لاحقًا ربط PR
أو issue بسيناريوهات Mantis موصى بها من التسميات والملفات المتغيرة ونتائج
مراجعة ClawSweeper.

## دورة حياة التشغيل

1. الحصول على بيانات الاعتماد.
2. تخصيص VM أو إعادة استخدامها.
3. تجهيز ملف تعريف سطح المكتب/المتصفح عندما يحتاج السيناريو إلى دليل UI.
4. تجهيز checkout نظيف لمرجع الأساس.
5. تثبيت التبعيات وبناء ما يحتاجه السيناريو فقط.
6. بدء OpenClaw Gateway فرعي بدليل حالة معزول.
7. ضبط النقل الحي والمزود والنموذج وملف تعريف المتصفح.
8. تشغيل السيناريو والتقاط دليل الأساس.
9. إيقاف Gateway والاحتفاظ بالسجلات.
10. تجهيز مرجع المرشح في VM نفسها.
11. تشغيل السيناريو نفسه والتقاط دليل المرشح.
12. مقارنة نتائج oracle والدليل البصري.
13. كتابة Markdown وJSON والسجلات ولقطات الشاشة وآثار التتبع الاختيارية.
14. رفع آثار GitHub Actions.
15. نشر رسالة حالة موجزة في PR أو Discord.

يجب أن يكون السيناريو قادرًا على الفشل بطريقتين مختلفتين:

- **إعادة إنتاج الخطأ**: فشل الأساس بالطريقة المتوقعة.
- **فشل Harness**: فشل إعداد البيئة أو بيانات الاعتماد أو Discord API أو المتصفح أو
  المزود قبل أن تصبح oracle الخطأ ذات معنى.

يجب أن يفصل التقرير النهائي بين هذه الحالات حتى لا يخلط المشرفون بين بيئة
غير مستقرة وسلوك المنتج.

## Discord MVP

يجب أن يستهدف السيناريو الأول تفاعلات الحالة في Discord ضمن قنوات guild حيث
يكون وضع تسليم الرد المصدر هو `message_tool_only`.

لماذا هو بذرة Mantis جيدة:

- إنه مرئي في Discord كتفاعلات على الرسالة المشغلة.
- لديه oracle REST قوية عبر حالة تفاعل رسالة Discord.
- يختبر OpenClaw Gateway حقيقيًا، ومصادقة بوت Discord، وإرسال الرسائل،
  ووضع تسليم الرد المصدر، وحالة تفاعل الحالة، ودورة حياة دورة النموذج.
- إنه ضيق بما يكفي لإبقاء التنفيذ الأول صادقًا.

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

يجب أن يُظهر دليل الأساس تفاعل إقرار الانتظار لكن دون انتقال في دورة الحياة
ضمن وضع tool-only. يجب أن يُظهر دليل المرشح تشغيل تفاعلات حالة دورة الحياة
عندما تكون `messages.statusReactions.enabled` مضبوطة صراحة على true.

الشريحة الأولى القابلة للتنفيذ هي سيناريو QA الحي الاختياري لـ Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

يضبط SUT مع معالجة guild دائمة التشغيل، و`visibleReplies:
"message_tool"`، و`ackReaction: "👀"`، وتفاعلات حالة صريحة. تستطلع oracle
رسالة Discord المشغلة الحقيقية وتتوقع التسلسل المرصود
`👀 -> 🤔 -> 👍`. تشمل الآثار `discord-qa-reaction-timelines.json`،
و`discord-status-reactions-tool-only-timeline.html`، و
`discord-status-reactions-tool-only-timeline.png`.

## أجزاء QA الموجودة

يجب أن يبني Mantis على حزمة QA الخاصة الموجودة بدلًا من البدء من
الصفر:

- `pnpm openclaw qa discord` يشغل بالفعل مسار Discord حيًا مع بوتات driver و
  SUT.
- مشغل النقل الحي يكتب بالفعل تقارير وآثار رسائل مرصودة
  تحت `.artifacts/qa-e2e/`.
- إيجارات بيانات اعتماد Convex توفر بالفعل وصولًا حصريًا إلى بيانات اعتماد
  النقل الحي المشتركة.
- تدعم خدمة التحكم بالمتصفح بالفعل لقطات الشاشة واللقطات
  وملفات التعريف المدارة headless وملفات تعريف CDP البعيدة.
- لدى QA Lab بالفعل UI مصحح أخطاء وناقل لاختبارات على شكل نقل.

يمكن أن يكون تنفيذ Mantis الأول مشغل before/after رقيقًا فوق هذه
الأجزاء، مع طبقة دليل بصري واحدة.

## نموذج الدليل

كل تشغيل يكتب دليل آثار ثابتًا:

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

يجب أن يكون `mantis-summary.json` مصدر الحقيقة القابل للقراءة آليًا. تقرير
Markdown مخصص لتعليقات PR والمراجعة البشرية.

يجب أن يتضمن الملخص:

- المراجع وSHAs المختبرة
- النقل ومعرف السيناريو
- مزود الآلة ومعرف الآلة أو معرف الإيجار
- مصدر بيانات الاعتماد دون قيم سرية
- نتيجة الأساس
- نتيجة المرشح
- ما إذا كان الخطأ قد أعيد إنتاجه على الأساس
- ما إذا كان المرشح قد أصلحه
- مسارات الآثار
- مشكلات الإعداد أو التنظيف المنقحة

لقطات الشاشة أدلة، وليست أسرارًا. لكنها لا تزال تحتاج إلى انضباط في التنقيح:
قد تظهر أسماء القنوات الخاصة، أو أسماء المستخدمين، أو محتوى الرسائل. بالنسبة إلى PRs العامة،
فضّل روابط مصنوعات GitHub Actions على الصور المضمّنة إلى أن تصبح قصة التنقيح
أقوى.

## المتصفح وVNC

لمسار المتصفح وضعان:

- **الأتمتة بلا واجهة**: الافتراضي لـ CI. يعمل Chrome مع تفعيل CDP، وتلتقط
  Playwright أو تحكم متصفح OpenClaw لقطات الشاشة.
- **إنقاذ VNC**: مفعّل على VM نفسه عندما يحتاج تسجيل الدخول، أو MFA، أو منع Discord للأتمتة،
  أو التصحيح المرئي إلى تدخل بشري.

يجب أن يكون ملف تعريف متصفح مراقب Discord دائمًا بما يكفي لتجنب
تسجيل الدخول في كل تشغيل، لكنه معزول عن حالة المتصفح الشخصية. ينتمي ملف التعريف
إلى مجموعة أجهزة Mantis، لا إلى حاسوب مطوّر محمول.

عندما يتعطل Mantis، ينشر رسالة حالة على Discord تتضمن:

- معرّف التشغيل
- معرّف السيناريو
- مزوّد الجهاز
- دليل المصنوعات
- تعليمات اتصال VNC أو noVNC إذا كانت متاحة
- نصًا قصيرًا عن العائق

يمكن للنشر الخاص الأول أن ينشر هذه الرسائل في قناة المشغّلين الحالية
وينتقل لاحقًا إلى قناة Mantis مخصصة.

## الأجهزة

يجب أن يفضّل Mantis استخدام AWS عبر Crabbox لأول تنفيذ بعيد.
يوفر لنا Crabbox أجهزة مهيأة مسبقًا، وتتبع التأجير، والترطيب، والسجلات، والنتائج،
والتنظيف. إذا كانت سعة AWS بطيئة جدًا أو غير متاحة، فأضف مزوّد Hetzner
خلف واجهة الجهاز نفسها.

متطلبات VM الدنيا:

- Linux مع تثبيت Chrome أو Chromium قادر على سطح المكتب
- وصول CDP لأتمتة المتصفح
- VNC أو noVNC للإنقاذ
- Node 22 وpnpm
- نسخة عمل من OpenClaw وذاكرة تخزين مؤقت للاعتماديات
- ذاكرة تخزين مؤقت لمتصفح Playwright Chromium عند استخدام Playwright
- ما يكفي من CPU والذاكرة لتشغيل OpenClaw Gateway واحد، ومتصفح واحد، وتشغيل نموذج واحد
- وصول صادر إلى Discord، وGitHub، ومزوّدي النماذج، ووسيط بيانات الاعتماد

يجب ألا يحتفظ VM بأسرار خام طويلة الأمد خارج مخازن بيانات الاعتماد أو
ملفات تعريف المتصفح المتوقعة.

## الأسرار

توجد الأسرار في أسرار مؤسسة GitHub أو مستودعه للتشغيلات البعيدة، وفي
ملف أسرار محلي يتحكم به المشغّل للتشغيلات المحلية.

أسماء الأسرار الموصى بها:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لعمليات رفع مصنوعات GitHub العامة
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

على المدى الطويل، يجب أن تظل مجموعة بيانات اعتماد Convex هي المصدر المعتاد لبيانات اعتماد
النقل الحية. تقوم أسرار GitHub بتمهيد الوسيط ومسارات الاحتياط.
يربط سير عمل تفاعلات حالة Discord أسرار Mantis Crabbox مرة أخرى
بمتغيري البيئة `CRABBOX_COORDINATOR` و`CRABBOX_COORDINATOR_TOKEN`
اللذين يتوقعهما Crabbox CLI. تظل أسماء أسرار GitHub العادية `CRABBOX_*`
مقبولة كاحتياط للتوافق.

يجب ألا يطبع مشغّل Mantis مطلقًا:

- رموز بوتات Discord
- مفاتيح API للمزوّدين
- ملفات تعريف ارتباط المتصفح
- محتويات ملفات تعريف المصادقة
- كلمات مرور VNC
- حمولات بيانات الاعتماد الخام

يجب أن تنقّح عمليات رفع المصنوعات العامة أيضًا بيانات تعريف أهداف Discord مثل معرّفات البوت،
والخادم، والقناة، والرسالة. يفعّل سير عمل اختبار الدخان في GitHub
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لهذا السبب.

إذا لُصق رمز بطريق الخطأ في issue أو PR أو محادثة أو سجل، فقم بتدويره
بعد تخزين السر الجديد.

## مصنوعات GitHub وتعليقات PR

يجب أن ترفع سير عمل Mantis حزمة الأدلة الكاملة كمصنوع Actions قصير العمر.
عند تشغيل سير العمل لتقرير خلل أو PR إصلاح، يجب أن ينشر أيضًا
لقطات شاشة PNG المنقّحة إلى فرع `qa-artifacts` وأن يُدرج أو يحدّث تعليقًا
على ذلك الخلل أو PR الإصلاح مع لقطات شاشة قبل/بعد مضمّنة. لا تنشر
الدليل الأساسي فقط على PR عام لأتمتة QA. تبقى السجلات الخام، والرسائل المرصودة،
والأدلة الضخمة الأخرى في مصنوع Actions.

يجب أن تنشر سير العمل الإنتاجية تلك التعليقات باستخدام تطبيق Mantis GitHub App، وليس
باستخدام `github-actions[bot]`. خزّن معرّف التطبيق والمفتاح الخاص كأسرار
GitHub Actions باسم `MANTIS_GITHUB_APP_ID` و`MANTIS_GITHUB_APP_PRIVATE_KEY`.
يستخدم سير العمل علامة مخفية كمفتاح إدراج أو تحديث، ويحدّث ذلك
التعليق عندما يستطيع الرمز تحريره، وينشئ تعليقًا جديدًا مملوكًا لـ Mantis عندما
لا يمكن تحرير علامة أقدم مملوكة لبوت.

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

عندما يفشل التشغيل لأن حزمة الاختبار فشلت، يجب أن يوضح التعليق ذلك بدلًا
من الإيحاء بأن المرشح فشل.

## ملاحظات النشر الخاص

قد يحتوي النشر الخاص بالفعل على تطبيق Mantis Discord. أعد استخدام ذلك
التطبيق بدلًا من إنشاء تطبيق آخر عندما تكون لديه أذونات البوت الصحيحة
ويمكن تدويره بأمان.

عيّن قناة إشعارات المشغّل الأولية عبر الأسرار أو إعدادات النشر.
يمكن أن تشير أولًا إلى قناة صيانة أو عمليات حالية،
ثم تنتقل إلى قناة Mantis مخصصة عند توفر واحدة.

لا تضع معرّفات الخوادم، أو معرّفات القنوات، أو رموز البوتات، أو ملفات تعريف ارتباط المتصفح، أو كلمات مرور VNC
في هذا المستند. خزّنها في أسرار GitHub، أو وسيط بيانات الاعتماد، أو
مخزن الأسرار المحلي الخاص بالمشغّل.

## إضافة سيناريو

يجب أن يصرّح سيناريو Mantis بما يلي:

- المعرّف والعنوان
- النقل
- بيانات الاعتماد المطلوبة
- سياسة مرجع الأساس
- سياسة مرجع المرشح
- رقعة إعدادات OpenClaw
- خطوات الإعداد
- المحفّز
- أوراكل الأساس المتوقع
- أوراكل المرشح المتوقع
- أهداف الالتقاط المرئي
- ميزانية المهلة
- خطوات التنظيف

يجب أن تفضّل السيناريوهات أوراكلات صغيرة ومكتوبة الأنواع:

- حالة تفاعل Discord لعلل التفاعلات
- مراجع رسائل Discord لعلل تسلسل المحادثات
- الطابع الزمني لسلاسل Slack وحالة API التفاعلات لعلل Slack
- معرّفات الرسائل والرؤوس لعلل البريد الإلكتروني
- لقطات شاشة المتصفح عندما تكون UI هي الشيء الوحيد الموثوق قابلًا للملاحظة

يجب أن تكون فحوص الرؤية إضافية. إذا كان بإمكان API المنصة إثبات الخلل، فاستخدم
API كأوراكل النجاح/الفشل واحتفظ بلقطات الشاشة لثقة البشر.

## توسعة المزوّدين

بعد Discord، يمكن للمشغّل نفسه إضافة:

- Slack: التفاعلات، والسلاسل، وإشارات التطبيق، والنوافذ، ورفع الملفات.
- البريد الإلكتروني: مصادقة Gmail وتسلسل الرسائل باستخدام `gog` حيث لا تكفي الموصلات.
- WhatsApp: تسجيل الدخول عبر QR، وإعادة التعريف، وتسليم الرسائل، والوسائط، والتفاعلات.
- Telegram: بوابات الإشارة في المجموعات، والأوامر، والتفاعلات حيثما تتوفر.
- Matrix: الغرف المشفرة، وعلاقات السلاسل أو الردود، واستئناف إعادة التشغيل.

يجب أن يكون لكل وسيلة نقل سيناريو دخان رخيص واحد وسيناريو واحد أو أكثر لفئات العلل.
يجب أن تظل السيناريوهات المرئية المكلفة اختيارية.

## أسئلة مفتوحة

- أي بوت Discord يجب أن يكون السائق، وأيها يجب أن يكون SUT، عند
  إعادة استخدام بوت Mantis الحالي؟
- هل يجب أن يستخدم تسجيل دخول متصفح المراقب حساب Discord بشريًا، أو حساب اختبار،
  أم أدلة REST القابلة للقراءة بواسطة البوت فقط للمرحلة الأولى؟
- إلى متى يجب أن يحتفظ GitHub بمصنوعات Mantis الخاصة بـ PRs؟
- متى يجب أن يوصي ClawSweeper تلقائيًا باستخدام Mantis بدلًا من انتظار
  أمر من أحد الصائنين؟
- هل يجب تنقيح لقطات الشاشة أو قصها قبل الرفع لـ PRs العامة؟
