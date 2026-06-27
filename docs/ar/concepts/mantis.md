---
read_when:
    - بناء أو تشغيل ضمان الجودة المرئي المباشر لأخطاء OpenClaw
    - إضافة التحقق قبل وبعد لطلب سحب
    - إضافة سيناريوهات نقل مباشرة لـ Discord أو Slack أو WhatsApp أو غيرها
    - تصحيح أخطاء تشغيلات ضمان الجودة التي تحتاج إلى لقطات شاشة أو أتمتة المتصفح أو وصول VNC
summary: Mantis هو نظام التحقق المرئي من طرف إلى طرف لإعادة إنتاج أخطاء OpenClaw على وسائل النقل الحية، والتقاط أدلة ما قبل الإصلاح وما بعده، وإرفاق المصنوعات بطلبات السحب.
title: فرس النبي
x-i18n:
    generated_at: "2026-06-27T17:29:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis هو نظام التحقق الشامل في OpenClaw للأخطاء التي تحتاج إلى وقت تشغيل حقيقي، ووسيلة نقل حقيقية، ودليل مرئي. يشغّل سيناريو مقابل مرجع معروف بأنه سيئ، ويلتقط الأدلة، ثم يشغّل السيناريو نفسه مقابل مرجع مرشح، وينشر المقارنة كآثار يستطيع المشرف فحصها من PR أو من أمر محلي.

يبدأ Mantis بـ Discord لأن Discord يمنحنا مسارًا أول عالي القيمة: مصادقة بوت حقيقية، وقنوات نقابة حقيقية، وتفاعلات، وسلاسل محادثات، وأوامر أصلية، وواجهة متصفح يمكن للبشر من خلالها تأكيد ما عرضته وسيلة النقل بصريًا.

## الأهداف

- إعادة إنتاج خطأ من مشكلة GitHub أو PR بالشكل نفسه لوسيلة النقل الذي يراه المستخدمون.
- التقاط أثر **قبل** على مرجع خط الأساس قبل تطبيق الإصلاح.
- التقاط أثر **بعد** على المرجع المرشح بعد تطبيق الإصلاح.
- استخدام حَكَم حتمي كلما أمكن، مثل قراءة تفاعل Discord REST أو فحص نص قناة.
- التقاط لقطات شاشة عندما يكون للخطأ سطح واجهة مرئي.
- التشغيل محليًا من CLI يتحكم به وكيل، وعن بُعد من GitHub.
- حفظ ما يكفي من حالة الجهاز لإنقاذ VNC عندما يتعثر تسجيل الدخول، أو أتمتة المتصفح، أو مصادقة المزوّد.
- نشر حالة موجزة إلى قناة Discord للمشغل عندما يكون التشغيل محجوبًا، أو يحتاج إلى مساعدة VNC يدوية، أو يكتمل.

## غير الأهداف

- Mantis ليس بديلًا لاختبارات الوحدة. عادةً ينبغي أن يتحول تشغيل Mantis إلى اختبار انحدار أصغر بعد فهم الإصلاح.
- Mantis ليس بوابة CI السريعة المعتادة. فهو أبطأ، ويستخدم بيانات اعتماد حية، ومخصص للأخطاء التي تكون فيها البيئة الحية مهمة.
- يجب ألا يتطلب Mantis إنسانًا للتشغيل العادي. VNC اليدوي هو مسار إنقاذ، وليس المسار الطبيعي.
- لا يخزن Mantis الأسرار الخام في الآثار، أو السجلات، أو لقطات الشاشة، أو تقارير Markdown، أو تعليقات PR.

## الملكية

يوجد Mantis ضمن حزمة QA في OpenClaw.

- يملك OpenClaw وقت تشغيل السيناريو، ومحوّلات النقل، ومخطط الأدلة، وCLI المحلي ضمن `pnpm openclaw qa mantis`.
- يملك QA Lab أجزاء عُدة النقل الحي، ومساعدات التقاط المتصفح، وكاتبات الآثار.
- يملك Crabbox أجهزة Linux المُحمّاة مسبقًا عندما تكون هناك حاجة إلى VM بعيدة.
- تملك GitHub Actions نقطة دخول سير العمل البعيد والاحتفاظ بالآثار.
- يملك ClawSweeper توجيه تعليقات GitHub: تحليل أوامر المشرفين، وإرسال سير العمل، ونشر تعليق PR النهائي.
- تقود وكلاء OpenClaw نظام Mantis عبر Codex عندما يحتاج السيناريو إلى إعداد وكيل، أو تصحيح أخطاء، أو الإبلاغ عن حالة عالقة.

يبقي هذا الحد معرفة النقل في OpenClaw، وجدولة الأجهزة في Crabbox، وغراء سير عمل المشرفين في ClawSweeper.

## شكل الأمر

يتحقق الأمر المحلي الأول من بوت Discord، والنقابة، والقناة، وإرسال الرسائل، وإرسال التفاعلات، ومسار الآثار:

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

ينشئ المشغّل أشجار عمل منفصلة لخط الأساس والمرشح ضمن دليل الإخراج، ويثبّت الاعتماديات، ويبني كل مرجع، ويشغّل السيناريو مع `--allow-failures`، ثم يكتب `baseline/`، و`candidate/`، و`comparison.json`، و`mantis-report.md`. بالنسبة إلى سيناريو Discord الأول، يعني التحقق الناجح أن حالة خط الأساس هي `fail` وحالة المرشح هي `pass`.

يستهدف مجس Discord الثاني لما قبل/ما بعد مرفقات سلاسل المحادثات:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

ينشر ذلك السيناريو رسالة أصلية باستخدام بوت التشغيل، وينشئ سلسلة Discord حقيقية، ويستدعي إجراء `message.thread-reply` في OpenClaw باستخدام `filePath` محلي للمستودع، ثم يستطلع السلسلة بحثًا عن رد SUT واسم ملف المرفق. تعرض لقطة شاشة خط الأساس الرد بلا مرفق؛ وتعرض لقطة شاشة المرشح مرفق `mantis-thread-report.md` المتوقع.

أول بدائية VM/متصفح هي فحص سطح المكتب السريع:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

يستأجر أو يعيد استخدام جهاز سطح مكتب Crabbox، ويبدأ متصفحًا مرئيًا داخل جلسة VNC، ويلتقط سطح المكتب، ويسحب الآثار إلى دليل الإخراج المحلي، ويكتب أمر إعادة الاتصال في التقرير. يستخدم الأمر افتراضيًا مزوّد Hetzner لأنه أول مزوّد لديه تغطية سطح مكتب/VNC عاملة في مسار Mantis. تجاوزه باستخدام `--provider`، أو `--crabbox-bin`، أو `OPENCLAW_MANTIS_CRABBOX_PROVIDER` عند التشغيل مقابل أسطول Crabbox آخر.

أعلام مفيدة لفحص سطح المكتب السريع:

- يعيد `--lease-id <cbx_...>` أو `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` استخدام سطح مكتب مُحمّى مسبقًا.
- يغيّر `--browser-url <url>` الصفحة المفتوحة في المتصفح المرئي.
- يعرض `--html-file <path>` أثر HTML محليًا للمستودع في المتصفح المرئي. يستخدم Mantis هذا لالتقاط المخطط الزمني المولّد لتفاعلات حالة Discord عبر سطح مكتب Crabbox حقيقي.
- يعيد `--browser-profile-dir <remote-path>` استخدام user-data-dir بعيد لـ Chrome كي يبقى سطح مكتب Mantis المستمر مسجل الدخول بين عمليات التشغيل. استخدم هذا لملف عارض Discord Web طويل العمر.
- يستعيد `--browser-profile-archive-env <name>` أرشيف Chrome user-data-dir بصيغة `.tgz` ومشفّرًا بـ base64 من متغير البيئة المسمى قبل تشغيل المتصفح. استخدم هذا للشهود المسجلين دخولهم مثل Discord Web. متغير البيئة الافتراضي هو `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- يتحكم `--video-duration <seconds>` في مدة التقاط MP4. استخدم مدة أطول لتطبيقات الويب البطيئة المسجلة الدخول التي تحتاج إلى وقت للاستقرار.
- يبقي `--keep-lease` أو `OPENCLAW_MANTIS_KEEP_VM=1` إيجارًا ناجحًا ومُنشأ حديثًا مفتوحًا لفحص VNC. تحتفظ عمليات التشغيل الفاشلة بالإيجار افتراضيًا عندما يتم إنشاء واحد حتى يتمكن المشغل من إعادة الاتصال.
- تضبط `--class`، و`--idle-timeout`، و`--ttl` حجم الجهاز وعمر الإيجار.

بالنسبة إلى أدلة Discord Web، يستخدم Mantis حساب عارض مخصصًا بدلًا من رمز بوت. يبقى سيناريو Discord API الحي هو الحَكَم: فهو ينشئ السلسلة الحقيقية، ويرسل `thread-reply` من SUT، ويفحص المرفق عبر Discord REST. عند ضبط `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`، يكتب السيناريو أيضًا أثر URL لـ Discord Web. وعند ضبط `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`، يترك تلك السلسلة متاحة لمدة كافية كي يفتحها متصفح مسجل الدخول ويسجلها.

يفتح سير عمل GitHub عنوان URL لسلسلة المرشح في Discord Web، ويلتقط لقطة شاشة، ويسجل MP4، وينشئ معاينة GIF مقتطعة للحركة عندما تكون أدوات وسائط Crabbox متاحة. فضّل مسار ملف عارض مستمر مضبوط عبر `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`، لأن أرشيفات ملفات Chrome الكاملة يمكن أن تتجاوز حد حجم أسرار GitHub. بالنسبة إلى ملفات التشغيل الأولي/الصغيرة، يمكن لسير العمل أيضًا استعادة أرشيف `.tgz` مشفر بـ base64 من `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. إذا لم يتم ضبط أي مصدر ملف، يظل سير العمل ينشر لقطات شاشة مرفقات خط الأساس/المرشح الحتمية ويسجل إشعارًا بأن شاهد Discord Web المسجل الدخول تم تخطيه.

أول بدائية نقل كاملة لسطح المكتب هي فحص Slack السريع لسطح المكتب:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر أو يعيد استخدام جهاز سطح مكتب Crabbox، ويزامن السحب الحالي إلى VM، ويشغّل `pnpm openclaw qa slack` داخل تلك VM، ويفتح Slack Web في متصفح VNC، ويلتقط سطح المكتب المرئي، وينسخ كلًا من آثار Slack QA ولقطة شاشة VNC إلى دليل الإخراج المحلي. هذا هو أول شكل في Mantis يكون فيه Gateway الخاص بـ SUT OpenClaw والمتصفح داخل VM سطح مكتب Linux نفسها.

مع `--gateway-setup`، يحضّر الأمر منزل OpenClaw مستمرًا وقابلًا للتخلص منه في `$HOME/.openclaw-mantis/slack-openclaw`، ويرقّع إعداد Slack Socket Mode للقناة المحددة، ويبدأ `openclaw gateway run` على المنفذ `38973`، ويبقي Chrome قيد التشغيل في جلسة VNC. هذا هو وضع "اترك لي سطح مكتب Linux مع Slack ومخلب قيد التشغيل"؛ يظل مسار Slack QA من بوت إلى بوت هو الافتراضي عند حذف `--gateway-setup`.

المدخلات المطلوبة لـ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` لمسار النموذج البعيد. إذا كان `OPENAI_API_KEY` فقط مضبوطًا محليًا، يطابقه Mantis إلى `OPENCLAW_LIVE_OPENAI_KEY` قبل استدعاء Crabbox حتى يتمكن تمرير بيئة `OPENCLAW_*` في Crabbox من حمله إلى VM.

مع `--gateway-setup --credential-source convex`، يستأجر Mantis بيانات اعتماد Slack SUT من التجمع المشترك قبل إنشاء VM ويمرر معرف القناة المستأجر، ورمز تطبيق Socket Mode، ورمز البوت كبيئة تشغيل `OPENCLAW_MANTIS_SLACK_*` داخل سطح المكتب. يبقي ذلك سير عمل GitHub نحيفًا: فهو يحتاج فقط إلى سر وسيط Convex، وليس رموز بوت Slack أو رموز التطبيق الخام.

أعلام مفيدة لسطح مكتب Slack:

- يعيد `--lease-id <cbx_...>` التشغيل مقابل جهاز سبق أن سجل مشغل الدخول فيه إلى Slack Web عبر VNC.
- يبدأ `--gateway-setup` Gateway Slack مستمرًا لـ OpenClaw في VM بدلًا من تشغيل مسار QA من بوت إلى بوت فقط.
- يبقي `--keep-lease` VM الخاصة بـ Gateway مفتوحة لفحص VNC بعد النجاح؛ يوقفها `--no-keep-lease` بعد جمع الآثار.
- يفتح `--slack-url <url>` عنوان URL محددًا لـ Slack Web. بدونه، يستنتج Mantis `https://app.slack.com/client/<team>/<channel>` من Slack `auth.test` عندما يكون رمز بوت SUT متاحًا.
- يتحكم `--slack-channel-id <id>` في قائمة السماح لقناة Slack المستخدمة في إعداد Gateway.
- يتحكم `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` في ملف Chrome المستمر داخل VM. الافتراضي هو `$HOME/.config/openclaw-mantis/slack-chrome-profile`، لذا ينجو تسجيل الدخول اليدوي إلى Slack Web من إعادة التشغيل على الإيجار نفسه.
- يستخدم `--credential-source convex --credential-role ci` تجمع بيانات الاعتماد المشترك بدلًا من رموز بيئة Slack المباشرة.
- تمرر `--provider-mode`، و`--model`، و`--alt-model`، و`--fast` إلى مسار Slack الحي.

تعرض عمليات تشغيل نقطة تحقق الموافقة لقطات رسائل Slack API إلى صور PNG لنقاط التحقق من أجل دليل مرئي آمن لـ CI. لا يكون `slack-desktop-smoke.png` دليلًا على Slack Web إلا عندما يستخدم الإيجار ملف متصفح مُحمّى مسبقًا ومسجل الدخول بالفعل.

سير عمل فحص GitHub السريع هو `Mantis Discord Smoke`. وسير عمل GitHub لما قبل وما بعد للسيناريو الحقيقي الأول هو `Mantis Discord Status Reactions`. يقبل:

- `baseline_ref`: المرجع المتوقع أن يعيد إنتاج سلوك الطابور فقط.
- `candidate_ref`: المرجع المتوقع أن يعرض `queued -> thinking -> done`.

يسحب مرجع عُدة سير العمل، ويبني أشجار عمل منفصلة لخط الأساس والمرشح، ويشغّل `discord-status-reactions-tool-only` مقابل كل شجرة عمل، ويرفع `baseline/`، و`candidate/`، و`comparison.json`، و`mantis-report.md` كآثار Actions. كما يعرض HTML المخطط الزمني لكل مسار في متصفح سطح مكتب Crabbox وينشر لقطات شاشة VNC تلك بجانب صور PNG الحتمية للمخطط الزمني في تعليق PR. يضمّن تعليق PR نفسه معاينات GIF خفيفة مقتطعة للحركة تم إنشاؤها بواسطة `crabbox media preview`، ويربط بمقاطع MP4 المطابقة المقتطعة للحركة، ويحتفظ بملفات MP4 الكاملة لسطح المكتب للفحص العميق. تبقى لقطات الشاشة مضمنة للمراجعة السريعة. يبني سير العمل Crabbox CLI من الفرع main في `openclaw/crabbox` حتى يتمكن من استخدام أعلام إيجار سطح المكتب/المتصفح الحالية قبل إصدار ثنائية Crabbox التالية.

`Mantis Scenario` هو نقطة الدخول اليدوية العامة. يأخذ `scenario_id` و`candidate_ref` و`baseline_ref` اختياريًا و`pr_number` اختياريًا، ثم يوجّه التنفيذ إلى سير العمل الذي يملكه السيناريو. الغلاف رقيق عمدًا: تظل مسارات عمل السيناريوهات مالكة لإعداد النقل وبيانات الاعتماد وفئة VM والأوراكل المتوقع وبيان المصنوعات.

`Mantis Slack Desktop Smoke` هو أول سير عمل Slack VM. يجلب مرجع المرشح الموثوق في شجرة عمل منفصلة، ويستأجر سطح مكتب Crabbox Linux، ويشغّل `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` ضد ذلك المرشح، ويفتح Slack Web في متصفح VNC، ويسجّل سطح المكتب، وينشئ معاينة مقصوصة الحركة باستخدام `crabbox media preview`، ويرفع دليل المصنوعات كاملًا، وينشر اختياريًا تعليق الدليل المضمّن على PR الهدف. يستخدم AWS افتراضيًا لاستئجار سطح المكتب ويعرض إدخال مزود يدويًا حتى يتمكن المشغلون من التبديل إلى Hetzner عندما تكون سعة AWS بطيئة أو غير متاحة. استخدم هذا المسار عندما تريد "سطح مكتب Linux مع Slack ومخلب قيد التشغيل" بدلًا من نص Slack بين بوتين فقط.

`Mantis Telegram Live` يغلّف مسار Telegram QA المباشر الحالي في خط أنابيب أدلة PR نفسه. يجلب مرجع المرشح الموثوق في شجرة عمل منفصلة، ويشغّل `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`، ويكتب بيان `mantis-evidence.json` من ملخص Telegram QA و`qa-evidence.json` ومصنوعات التقرير، ويعرض HTML الدليل المنقح عبر متصفح سطح مكتب Crabbox، وينشئ GIF مقصوص الحركة باستخدام `crabbox media preview`، وينشر تعليق دليل PR المضمّن عندما يتوفر رقم PR. هذا المسار مرئي عبر أدلة QA بدلًا من إثبات Telegram Web مسجّل الدخول: يوفر Telegram Bot API دليل رسائل مباشرًا مستقرًا، لكن حالة تسجيل الدخول إلى Telegram Web غير مطلوبة لأتمتة Mantis العادية.

`Mantis Telegram Desktop Proof` هو غلاف Telegram Desktop الأصلي العامل قبل/بعد. يستطيع المشرف تشغيله من تعليق PR باستخدام `@openclaw-mantis telegram desktop proof`، أو من واجهة مستخدم Actions مع تعليمات حرة، أو عبر موزّع `Mantis Scenario` العام. يمرر سير العمل PR ومرجع الأساس ومرجع المرشح وتعليمات المشرف إلى Codex. يقرأ الوكيل PR، ويقرر ما السلوك المرئي في Telegram الذي يثبت التغيير، ويشغّل مسار إثبات Crabbox Telegram Desktop لمستخدم حقيقي للأساس والمرشح، ويكرر حتى تكون ملفات GIF الأصلية مفيدة، ويكتب مصنوعات `motionPreview` مزدوجة في `mantis-evidence.json`، ويرفع الحزمة، وينشر جدول دليل PR بعمودين عندما يتوفر رقم PR.

لإعداد Telegram Desktop بمشاركة بشرية، استخدم باني السيناريو:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

يستأجر الباني سطح مكتب Crabbox أو يعيد استخدامه، ويثبّت ملف Telegram Desktop الثنائي الأصلي على Linux، ويستعيد اختياريًا أرشيف جلسة مستخدم، ويضبط OpenClaw باستخدام رمز بوت Telegram SUT المستأجر، ويبدأ `openclaw gateway run` على المنفذ `38974`، وينشر رسالة جاهزية بوت السائق إلى المجموعة الخاصة المستأجرة، ثم يلتقط لقطة شاشة وMP4 من سطح مكتب VNC المرئي. لا يسجّل رمز البوت الدخول إلى Telegram Desktop أبدًا؛ بل يضبط OpenClaw فقط. عارض سطح المكتب هو جلسة مستخدم Telegram منفصلة مستعادة من `--telegram-profile-archive-env <name>` أو منشأة يدويًا عبر VNC ومبقاة حية باستخدام `--keep-lease`.

أعلام باني Telegram Desktop المفيدة:

- `--lease-id <cbx_...>` يعيد التشغيل ضد VM سجّل فيها مشغل الدخول إلى Telegram Desktop مسبقًا.
- `--telegram-profile-archive-env <name>` يقرأ أرشيف ملف تعريف Telegram Desktop بصيغة `.tgz` ومشفّر base64 من متغير البيئة ذلك ويستعيده قبل الإطلاق.
- `--telegram-profile-dir <remote-path>` يتحكم في دليل ملف تعريف Telegram Desktop البعيد. القيمة الافتراضية هي `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` يثبّت Telegram Desktop ويفتحه دون ضبط OpenClaw.
- `--credential-source convex --credential-role ci` يستخدم وسيط بيانات الاعتماد المشترك بدلًا من رموز Telegram env المباشرة.

يكتب كل سيناريو نشر PR ملف `mantis-evidence.json` بجانب تقريره. هذا المخطط هو تسليم العمل بين كود السيناريو وتعليقات GitHub:

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

قيم `path` للمصنوعات نسبية إلى دليل البيان. قيم `targetPath` هي مسارات نسبية تحت بادئة مصنوعات Mantis R2/S3 المضبوطة. يرفض الناشر اجتياز المسارات ويتخطى الإدخالات المعلّمة بـ `"required": false` عندما لا تتوفر المعاينات أو الفيديوهات الاختيارية.

أنواع المصنوعات المدعومة:

- `timeline`: لقطة شاشة حتمية للسيناريو، عادةً قبل/بعد.
- `desktopScreenshot`: لقطة شاشة لسطح مكتب VNC/المتصفح.
- `motionPreview`: GIF متحرك مضمّن منشأ من تسجيل سطح المكتب.
- `motionClip`: MP4 مقصوص الحركة يزيل المقدمة والنهاية الساكنتين.
- `fullVideo`: تسجيل MP4 كامل للفحص العميق.
- `metadata`: ملف JSON/سجل جانبي.
- `report`: تقرير Markdown.

الناشر القابل لإعادة الاستخدام هو `scripts/mantis/publish-pr-evidence.mjs`. تستدعيه مسارات العمل بالبيان وPR الهدف وجذر هدف المصنوعات وواسم التعليق ورابط مصنوعة Actions ورابط التشغيل ومصدر الطلب. يرفع المصنوعات المعلنة إلى حاوية Mantis R2/S3 المضبوطة، ويبني تعليق PR يبدأ بالملخص مع صور/معاينات مضمّنة وفيديوهات مرتبطة، ثم يحدّث تعليق الواسم الحالي أو ينشئ واحدًا. تنشر مسارات العمل إلى `openclaw-crabbox-artifacts` مع روابط عامة تحت `https://artifacts.openclaw.ai`. وتوفر قيم الحاوية والمنطقة والرابط العام مباشرة. يتطلب الناشر القابل لإعادة الاستخدام:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

يمكنك أيضًا تشغيل تنفيذ status-reactions مباشرة من تعليق PR:

```text
@openclaw-mantis discord status reactions
```

مشغل التعليق ضيق عمدًا. يعمل فقط على تعليقات طلبات السحب من مستخدمين لديهم صلاحية كتابة أو صيانة أو إدارة، ولا يتعرف إلا على طلبات Discord status-reaction. يستخدم افتراضيًا مرجع الأساس السيئ المعروف وSHA رأس PR الحالي كمرشح. يستطيع المشرفون تجاوز أي من المرجعين:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

يمكن أيضًا تشغيل Telegram live QA من تعليق PR:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

يستخدم افتراضيًا SHA رأس PR الحالي كمرشح ويشغّل `telegram-status-command`. يستطيع المشرفون تجاوز `candidate=...` و`provider=aws|hetzner` و`lease=<cbx_...>` عندما يحتاجون إلى مرجع محدد أو سطح مكتب Crabbox مجهز مسبقًا.

أمثلة أوامر ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

الأمر الأول صريح ومركّز على السيناريو. يمكن للثاني لاحقًا ربط PR أو issue بسيناريوهات Mantis الموصى بها من الوسوم والملفات المتغيرة ونتائج مراجعة ClawSweeper.

## دورة حياة التشغيل

1. الحصول على بيانات الاعتماد.
2. تخصيص VM أو إعادة استخدامها.
3. تحضير ملف تعريف سطح المكتب/المتصفح عندما يحتاج السيناريو إلى دليل واجهة مستخدم.
4. تحضير checkout نظيف لمرجع الأساس.
5. تثبيت التبعيات وبناء ما يحتاجه السيناريو فقط.
6. بدء Gateway فرعي لـ OpenClaw بدليل حالة معزول.
7. ضبط النقل المباشر والمزود والنموذج وملف تعريف المتصفح.
8. تشغيل السيناريو والتقاط دليل الأساس.
9. إيقاف Gateway والاحتفاظ بالسجلات.
10. تحضير مرجع المرشح في VM نفسها.
11. تشغيل السيناريو نفسه والتقاط دليل المرشح.
12. مقارنة نتائج الأوراكل والدليل المرئي.
13. كتابة Markdown وJSON والسجلات ولقطات الشاشة ومصنوعات التتبع الاختيارية.
14. رفع مصنوعات GitHub Actions.
15. نشر رسالة حالة موجزة في PR أو Discord.

ينبغي أن يكون السيناريو قادرًا على الفشل بطريقتين مختلفتين:

- **تمت إعادة إنتاج العلة**: فشل الأساس بالطريقة المتوقعة.
- **فشل الحزام**: فشل إعداد البيئة أو بيانات الاعتماد أو Discord API أو المتصفح أو المزود قبل أن يصبح أوراكل العلة ذا معنى.

يجب أن يفصل التقرير النهائي بين هذه الحالات حتى لا يخلط المشرفون بين بيئة متقلبة وسلوك المنتج.

## Discord MVP

ينبغي أن يستهدف السيناريو الأول تفاعلات حالة Discord في قنوات guild حيث يكون وضع تسليم الرد المصدر هو `message_tool_only`.

لماذا هو بذرة Mantis جيدة:

- إنه مرئي في Discord كتفاعلات على الرسالة المشغّلة.
- لديه أوراكل REST قوي عبر حالة تفاعلات رسالة Discord.
- يمرّن OpenClaw Gateway حقيقيًا، ومصادقة بوت Discord، وإرسال الرسائل، ووضع تسليم الرد المصدر، وحالة تفاعل الحالة، ودورة حياة دورة النموذج.
- إنه ضيق بما يكفي لإبقاء التنفيذ الأول صادقًا.

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

ينبغي أن يُظهر دليل الأساس تفاعل إقرار queued لكن دون انتقال دورة الحياة في وضع tool-only. ينبغي أن يُظهر دليل المرشح تفاعلات حالة دورة الحياة وهي تعمل عندما تكون `messages.statusReactions.enabled` مفعلة صراحة.

الشريحة التنفيذية الأولى هي سيناريو Discord live QA بالاشتراك الصريح:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

يضبط SUT لمعالجة guild دائمة التشغيل، و`visibleReplies:
"message_tool"`، و`ackReaction: "👀"`، وتفاعلات حالة صريحة. يستطلع الأوراكل رسالة Discord المشغّلة الحقيقية ويتوقع التسلسل المرصود `👀 -> 🤔 -> 👍`. تتضمن المصنوعات `discord-qa-reaction-timelines.json` و`discord-status-reactions-tool-only-timeline.html` و`discord-status-reactions-tool-only-timeline.png`.

## أجزاء QA الموجودة

ينبغي أن يبني Mantis على مكدس QA الخاص الموجود بدلًا من البدء من الصفر:

- `pnpm openclaw qa discord` يشغّل بالفعل مسار Discord مباشرًا مع بوتي السائق وSUT.
- مشغل النقل المباشر يكتب بالفعل التقارير وأدلة QA والمصنوعات الخاصة بالنقل تحت `.artifacts/qa-e2e/`.
- توفر عقود بيانات اعتماد Convex وصولًا حصريًا إلى بيانات اعتماد النقل المباشر المشتركة.
- تدعم خدمة التحكم في المتصفح بالفعل لقطات الشاشة واللقطات وملفات التعريف المدارة بلا واجهة وملفات CDP البعيدة.
- لدى QA Lab بالفعل واجهة مصحح أخطاء وحافلة للاختبار المصمم على شكل النقل.

يمكن أن يكون تنفيذ Mantis الأول مشغل قبل/بعد رقيقًا فوق هذه الأجزاء، بالإضافة إلى طبقة دليل مرئي واحدة.

## نموذج الدليل

يكتب كل تشغيل دليل مصنوعات مستقرًا:

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

- المراجع وقيم SHA التي تم اختبارها
- النقل ومعرّف السيناريو
- مزود الجهاز ومعرّف الجهاز أو معرّف التأجير
- مصدر بيانات الاعتماد من دون قيم الأسرار
- نتيجة خط الأساس
- نتيجة المرشح
- ما إذا كان الخلل قد تكرر على خط الأساس
- ما إذا كان المرشح قد أصلحه
- مسارات الأدلة
- مشكلات الإعداد أو التنظيف المنقّاة

لقطات الشاشة أدلة، وليست أسرارًا. لكنها لا تزال تحتاج إلى انضباط في التنقيح:
قد تظهر أسماء قنوات خاصة، أو أسماء مستخدمين، أو محتوى رسائل. بالنسبة إلى PRs العامة،
فضّل روابط أدلة GitHub Actions بدل الصور المضمّنة إلى أن تصبح آلية التنقيح أقوى.

## المتصفح وVNC

لمسار المتصفح وضعان:

- **الأتمتة دون واجهة**: الوضع الافتراضي في CI. يعمل Chrome مع تمكين CDP، وتلتقط
  Playwright أو تحكم متصفح OpenClaw لقطات الشاشة.
- **إنقاذ VNC**: ممكّن على VM نفسه عندما يحتاج تسجيل الدخول، أو MFA، أو منع Discord للأتمتة،
  أو التصحيح المرئي إلى تدخل بشري.

يجب أن يكون ملف تعريف متصفح مراقب Discord دائمًا بما يكفي لتجنب
تسجيل الدخول في كل تشغيل، لكنه معزول عن حالة المتصفح الشخصية. ينتمي ملف التعريف
إلى مجموعة أجهزة Mantis، وليس إلى حاسوب مطوّر محمول.

عندما يتعطل Mantis، ينشر رسالة حالة في Discord تتضمن:

- معرّف التشغيل
- معرّف السيناريو
- مزود الجهاز
- دليل الأدلة
- تعليمات اتصال VNC أو noVNC إذا كانت متاحة
- نصًا قصيرًا عن العائق

يمكن للنشر الخاص الأول إرسال هذه الرسائل إلى قناة المشغل الحالية
والانتقال إلى قناة Mantis مخصصة لاحقًا.

## الأجهزة

يجب أن يفضّل Mantis استخدام AWS عبر Crabbox لأول تنفيذ بعيد.
يوفر Crabbox أجهزة مهيأة، وتتبع التأجير، والترطيب، والسجلات، والنتائج،
والتنظيف. إذا كانت سعة AWS بطيئة جدًا أو غير متاحة، فأضف مزود Hetzner
خلف واجهة الجهاز نفسها.

متطلبات VM الدنيا:

- Linux مع تثبيت Chrome أو Chromium قادر على سطح المكتب
- وصول CDP لأتمتة المتصفح
- VNC أو noVNC للإنقاذ
- Node 22 وpnpm
- نسخة عمل OpenClaw وذاكرة تخزين مؤقت للتبعيات
- ذاكرة تخزين مؤقت لمتصفح Playwright Chromium عند استخدام Playwright
- CPU وذاكرة كافيان لتشغيل OpenClaw Gateway واحد، ومتصفح واحد، وتشغيل نموذج واحد
- وصول صادر إلى Discord، وGitHub، ومزودي النماذج، ووسيط بيانات الاعتماد

يجب ألا يحتفظ VM بأسرار خام طويلة العمر خارج مخازن بيانات الاعتماد أو
ملفات تعريف المتصفح المتوقعة.

## الأسرار

توجد الأسرار في أسرار مؤسسة GitHub أو المستودع للتشغيلات البعيدة، وفي
ملف أسرار محلي يتحكم به المشغل للتشغيلات المحلية.

أسماء الأسرار الموصى بها:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لرفع أدلة GitHub العامة
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

على المدى الطويل، يجب أن يظل مجمع بيانات اعتماد Convex المصدر المعتاد لبيانات اعتماد
النقل الحية. تُمهّد أسرار GitHub وسيط البيانات ومسارات الرجوع الاحتياطية.
يعيد سير عمل تفاعلات حالة Discord ربط أسرار Mantis Crabbox بمتغيري البيئة
`CRABBOX_COORDINATOR` و`CRABBOX_COORDINATOR_TOKEN`
اللذين تتوقعهما Crabbox CLI. تبقى أسماء أسرار GitHub العادية `CRABBOX_*`
مقبولة كرجوع احتياطي للتوافق.

يجب ألا يطبع مشغل Mantis أبدًا:

- رموز بوتات Discord
- مفاتيح API للمزودين
- ملفات تعريف ارتباط المتصفح
- محتويات ملفات تعريف المصادقة
- كلمات مرور VNC
- حمولات بيانات الاعتماد الخام

يجب أن تنقّح عمليات رفع الأدلة العامة أيضًا بيانات تعريف هدف Discord مثل معرّفات البوت،
والخادم، والقناة، والرسالة. يفعّل سير عمل GitHub smoke
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لهذا السبب.

إذا تم لصق رمز مميز في Issue، أو PR، أو محادثة، أو سجل عن طريق الخطأ، فقم بتدويره
بعد تخزين السر الجديد.

## أدلة GitHub وتعليقات PR

يجب أن ترفع سير عمل Mantis حزمة الأدلة الكاملة كأثر قصير العمر في Actions.
عندما يتم تشغيل سير العمل لتقرير خلل أو PR إصلاح، يجب أن ينشر أيضًا
وسائط مضمنة منقّحة إلى حاوية Mantis R2/S3 المكوّنة وأن يدرج أو يحدّث
تعليقًا على ذلك الخلل أو PR الإصلاح مع لقطات شاشة مضمنة قبل/بعد. لا تنشر
الدليل الأساسي فقط على PR عام لأتمتة QA. تبقى السجلات الخام، والرسائل المرصودة،
والأدلة الضخمة الأخرى في أثر Actions.

يجب أن تنشر سير العمل الإنتاجية تلك التعليقات باستخدام Mantis GitHub App، وليس
باستخدام `github-actions[bot]`. خزّن معرّف التطبيق والمفتاح الخاص كأسرار GitHub Actions
بالاسمين `MANTIS_GITHUB_APP_ID` و`MANTIS_GITHUB_APP_PRIVATE_KEY`.
يستخدم سير العمل علامة مخفية كمفتاح إدراج أو تحديث، ويحدّث ذلك التعليق عندما يمكن
للرمز تحريره، وينشئ تعليقًا جديدًا مملوكًا لـ Mantis عندما يتعذر تحرير علامة قديمة
مملوكة لبوت.

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

عندما يفشل التشغيل لأن الحزمة الاختبارية فشلت، يجب أن يذكر التعليق ذلك بدلًا من
الإيحاء بأن المرشح فشل.

## ملاحظات النشر الخاص

قد يحتوي نشر خاص بالفعل على تطبيق Mantis في Discord. أعد استخدام ذلك
التطبيق بدلًا من إنشاء تطبيق آخر عندما تكون لديه أذونات البوت المناسبة
ويمكن تدويره بأمان.

اضبط قناة إشعارات المشغل الأولية عبر الأسرار أو إعدادات النشر.
يمكن أن تشير أولًا إلى قناة مشرفين أو عمليات قائمة، ثم تنتقل إلى قناة Mantis
مخصصة عندما تتوفر واحدة.

لا تضع معرّفات الخوادم، أو معرّفات القنوات، أو رموز البوتات، أو ملفات تعريف ارتباط المتصفح، أو كلمات مرور VNC
في هذا المستند. خزّنها في أسرار GitHub، أو وسيط بيانات الاعتماد، أو
مخزن الأسرار المحلي الخاص بالمشغل.

## إضافة سيناريو

يجب أن يعلن سيناريو Mantis عن:

- المعرّف والعنوان
- النقل
- بيانات الاعتماد المطلوبة
- سياسة مرجع خط الأساس
- سياسة مرجع المرشح
- رقعة إعدادات OpenClaw
- خطوات الإعداد
- المحفّز
- أوراكل خط الأساس المتوقع
- أوراكل المرشح المتوقع
- أهداف الالتقاط المرئي
- ميزانية المهلة
- خطوات التنظيف

يجب أن تفضّل السيناريوهات أوراكلات صغيرة ومكتوبة الأنواع:

- حالة تفاعل Discord لعلل التفاعلات
- مراجع رسائل Discord لعلل الترابط
- قيمة ts لخيط Slack وحالة API التفاعلات لعلل Slack
- معرّفات الرسائل وترويساتها لعلل البريد الإلكتروني
- لقطات شاشة المتصفح عندما تكون UI هي المرصود الموثوق الوحيد

يجب أن تكون فحوص الرؤية إضافية. إذا كان بإمكان API المنصة إثبات الخلل، فاستخدم
API كأوراكل نجاح/فشل واحتفظ بلقطات الشاشة لتعزيز ثقة البشر.

## توسيع المزودين

بعد Discord، يمكن للمشغل نفسه إضافة:

- Slack: التفاعلات، والخيوط، وإشارات التطبيق، والنوافذ، ورفع الملفات.
- البريد الإلكتروني: مصادقة Gmail وترابط الرسائل باستخدام `gog` عندما لا تكون الموصلات
  كافية.
- WhatsApp: تسجيل الدخول عبر QR، وإعادة التعرف، وتسليم الرسائل، والوسائط، والتفاعلات.
- Telegram: بوابة إشارات المجموعات، والأوامر، والتفاعلات حيثما كانت متاحة.
- Matrix: الغرف المشفرة، وعلاقات الخيوط أو الردود، واستئناف التشغيل بعد إعادة التشغيل.

يجب أن يكون لكل نقل سيناريو smoke رخيص واحد وسيناريو واحد أو أكثر لفئة خلل.
يجب أن تبقى السيناريوهات المرئية المكلفة اختيارية.

## أسئلة مفتوحة

- أي بوت Discord يجب أن يكون المشغّل، وأيها يجب أن يكون SUT، عندما يُعاد استخدام
  بوت Mantis الحالي؟
- هل يجب أن يستخدم تسجيل دخول متصفح المراقب حساب Discord بشريًا، أو حساب اختبار،
  أم أدلة REST قابلة للقراءة من البوت فقط في المرحلة الأولى؟
- ما المدة التي يجب أن يحتفظ فيها GitHub بأدلة Mantis الخاصة بـ PRs؟
- متى يجب أن يوصي ClawSweeper تلقائيًا باستخدام Mantis بدلًا من انتظار
  أمر من المشرف؟
- هل يجب تنقيح لقطات الشاشة أو قصها قبل الرفع لـ PRs العامة؟
