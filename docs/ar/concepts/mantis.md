---
read_when:
    - بناء أو تشغيل اختبارات ضمان الجودة المرئية المباشرة لأخطاء OpenClaw
    - إضافة التحقق قبل طلب السحب وبعده
    - إضافة سيناريوهات النقل الحي لـ Discord أو Slack أو WhatsApp أو غيرها
    - تصحيح أخطاء عمليات تشغيل ضمان الجودة التي تتطلب لقطات شاشة أو أتمتة المتصفح أو وصول VNC
summary: Mantis هو نظام التحقق البصري الشامل لإعادة إنتاج أخطاء OpenClaw على وسائل النقل الحية، والتقاط أدلة ما قبل التغيير وما بعده، وإرفاق المخرجات بطلبات السحب.
title: فرس النبي
x-i18n:
    generated_at: "2026-05-05T07:31:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00f2be92845fb13e410af7188f348010140914514d739b930f97b43abaa66a0c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis هو نظام التحقق الشامل من OpenClaw للأخطاء التي تحتاج إلى
بيئة تشغيل حقيقية، ونقل حقيقي، ودليل مرئي. يشغّل سيناريو ضد مرجع معروف
بأنه سيئ، ويلتقط الأدلة، ثم يشغّل السيناريو نفسه ضد مرجع مرشح، وينشر
المقارنة كعناصر أثرية يمكن للمشرف فحصها من PR أو من أمر محلي.

يبدأ Mantis مع Discord لأن Discord يمنحنا مسارًا أول عالي القيمة:
مصادقة بوت حقيقية، وقنوات guild حقيقية، وتفاعلات، وسلاسل، وأوامر أصلية، وواجهة
متصفح يمكن للبشر فيها تأكيد ما عرضه النقل بصريًا.

## الأهداف

- إعادة إنتاج خطأ من issue أو PR على GitHub بنفس شكل النقل الذي يراه
  المستخدمون.
- التقاط عنصر أثري **قبل** على مرجع الأساس قبل تطبيق الإصلاح.
- التقاط عنصر أثري **بعد** على المرجع المرشح بعد تطبيق الإصلاح.
- استخدام حكم حتمي كلما أمكن، مثل قراءة تفاعل Discord REST
  أو فحص نص قناة.
- التقاط لقطات شاشة عندما يكون للخطأ سطح واجهة مستخدم مرئي.
- التشغيل محليًا من CLI يتحكم به وكيل وعن بُعد من GitHub.
- حفظ حالة كافية من الآلة لإنقاذ VNC عندما يتعطل تسجيل الدخول، أو أتمتة المتصفح، أو
  مصادقة المزوّد.
- نشر حالة موجزة إلى قناة Discord للمشغل عندما يكون التشغيل محظورًا،
  أو يحتاج إلى مساعدة VNC يدوية، أو ينتهي.

## غير الأهداف

- Mantis ليس بديلًا عن اختبارات الوحدة. ينبغي عادةً أن يتحول تشغيل Mantis إلى
  اختبار انحدار أصغر بعد فهم الإصلاح.
- Mantis ليس بوابة CI السريعة العادية. فهو أبطأ، ويستخدم بيانات اعتماد حية، وهو
  مخصص للأخطاء التي تهم فيها البيئة الحية.
- يجب ألا يتطلب Mantis إنسانًا للتشغيل العادي. VNC اليدوي مسار إنقاذ،
  وليس المسار السعيد.
- لا يخزن Mantis الأسرار الخام في العناصر الأثرية، أو السجلات، أو لقطات الشاشة، أو تقارير Markdown،
  أو تعليقات PR.

## الملكية

يوجد Mantis في حزمة QA الخاصة بـ OpenClaw.

- يملك OpenClaw وقت تشغيل السيناريو، ومحوّلات النقل، ومخطط الأدلة، و
  CLI المحلي ضمن `pnpm openclaw qa mantis`.
- تملك QA Lab أجزاء عُدّة النقل الحي، ومساعدات التقاط المتصفح، و
  كاتبات العناصر الأثرية.
- يملك Crabbox آلات Linux المُسخّنة عندما تكون هناك حاجة إلى VM بعيدة.
- تملك GitHub Actions نقطة دخول سير العمل البعيد واحتفاظ العناصر الأثرية.
- يملك ClawSweeper توجيه تعليقات GitHub: تحليل أوامر المشرفين،
  وإرسال سير العمل، ونشر تعليق PR النهائي.
- تقود وكلاء OpenClaw نظام Mantis عبر Codex عندما يحتاج السيناريو إلى إعداد وكيل،
  أو تصحيح أخطاء، أو الإبلاغ عن حالة عالقة.

يحافظ هذا الحد على معرفة النقل في OpenClaw، وجدولة الآلات في
Crabbox، وغراء سير عمل المشرفين في ClawSweeper.

## شكل الأمر

يتحقق الأمر المحلي الأول من بوت Discord، وguild، والقناة، وإرسال الرسالة،
وإرسال التفاعل، ومسار العنصر الأثري:

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

ينشئ المشغّل worktrees منفصلة للأساس والمرشح تحت دليل الإخراج،
ويثبّت الاعتماديات، ويبني كل مرجع، ويشغّل السيناريو مع
`--allow-failures`، ثم يكتب `baseline/`، و`candidate/`، و`comparison.json`،
و`mantis-report.md`. بالنسبة إلى سيناريو Discord الأول، يعني التحقق الناجح
أن حالة الأساس هي `fail` وحالة المرشح هي `pass`.

أول بدائية VM/متصفح هي اختبار سطح المكتب السريع:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

يستأجر أو يعيد استخدام آلة سطح مكتب Crabbox، ويبدأ متصفحًا مرئيًا داخل
جلسة VNC، ويلتقط سطح المكتب، ويسحب العناصر الأثرية إلى دليل الإخراج
المحلي، ويكتب أمر إعادة الاتصال في التقرير. يستخدم الأمر افتراضيًا
مزوّد Hetzner لأنه أول مزوّد لديه تغطية سطح مكتب/VNC عاملة في مسار
Mantis. تجاوزه باستخدام `--provider`، أو `--crabbox-bin`، أو
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` عند التشغيل ضد أسطول Crabbox آخر.

أعلام مفيدة لاختبار سطح المكتب السريع:

- `--lease-id <cbx_...>` أو `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` يعيد استخدام سطح مكتب مُسخّن.
- `--browser-url <url>` يغيّر الصفحة المفتوحة في المتصفح المرئي.
- `--html-file <path>` يعرض عنصر HTML أثريًا محليًا من المستودع في المتصفح المرئي. يستخدم Mantis هذا لالتقاط خط زمني مُولّد لتفاعلات حالة Discord عبر سطح مكتب Crabbox حقيقي.
- `--keep-lease` أو `OPENCLAW_MANTIS_KEEP_VM=1` يبقي إيجارًا جديدًا ناجحًا مفتوحًا لفحص VNC. تحتفظ عمليات التشغيل الفاشلة بالإيجار افتراضيًا عند إنشائه حتى يتمكن المشغل من إعادة الاتصال.
- `--class`، و`--idle-timeout`، و`--ttl` تضبط حجم الآلة وعمر الإيجار.

أول بدائية كاملة لنقل سطح المكتب هي اختبار Slack السريع لسطح المكتب:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

يستأجر أو يعيد استخدام آلة سطح مكتب Crabbox، ويزامن checkout الحالي إلى
VM، ويشغّل `pnpm openclaw qa slack` داخل تلك VM، ويفتح Slack Web في متصفح
VNC، ويلتقط سطح المكتب المرئي، وينسخ كلًا من عناصر Slack QA الأثرية و
لقطة شاشة VNC إلى دليل الإخراج المحلي. هذا هو أول شكل من Mantis
تعيش فيه Gateway الخاصة بـ OpenClaw للنظام تحت الاختبار والمتصفح كلاهما داخل
VM سطح مكتب Linux نفسها.

مع `--gateway-setup`، يجهّز الأمر موطن OpenClaw دائمًا وقابلًا للتخلص منه
في `$HOME/.openclaw-mantis/slack-openclaw`، ويرقّع تهيئة Slack Socket Mode
للقناة المحددة، ويبدأ `openclaw gateway run` على المنفذ
`38973`، ويبقي Chrome قيد التشغيل في جلسة VNC. هذا هو وضع "اترك لي
سطح مكتب Linux مع Slack ومخلب قيد التشغيل"؛ يظل مسار Slack QA من بوت إلى بوت
هو الافتراضي عند حذف `--gateway-setup`.

المدخلات المطلوبة لـ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` لمسار النموذج البعيد. إذا كان
  `OPENAI_API_KEY` فقط مضبوطًا محليًا، يربطه Mantis إلى `OPENCLAW_LIVE_OPENAI_KEY`
  قبل استدعاء Crabbox بحيث يمكن لتمرير بيئة `OPENCLAW_*` في Crabbox حمله
  إلى VM.

أعلام مفيدة لسطح مكتب Slack:

- `--lease-id <cbx_...>` يعيد التشغيل ضد آلة سبق أن سجّل مشغل الدخول فيها إلى Slack Web عبر VNC.
- `--gateway-setup` يبدأ Gateway Slack دائمة لـ OpenClaw في VM بدلًا من تشغيل مسار QA من بوت إلى بوت فقط.
- `--slack-url <url>` يفتح URL محددًا لـ Slack Web. بدونه، يشتق Mantis `https://app.slack.com/client/<team>/<channel>` من Slack `auth.test` عندما يكون رمز بوت النظام تحت الاختبار متاحًا.
- `--slack-channel-id <id>` يتحكم في قائمة السماح لقناة Slack المستخدمة في إعداد Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` يتحكم في ملف تعريف Chrome الدائم داخل VM. الافتراضي هو `$HOME/.config/openclaw-mantis/slack-chrome-profile`، لذلك يبقى تسجيل دخول Slack Web اليدوي بعد عمليات إعادة التشغيل على الإيجار نفسه.
- `--credential-source convex --credential-role ci` يستخدم مجموعة بيانات الاعتماد المشتركة بدلًا من رموز بيئة Slack المباشرة.
- `--provider-mode`، و`--model`، و`--alt-model`، و`--fast` تمرر إلى مسار Slack الحي.

سير عمل اختبار GitHub السريع هو `Mantis Discord Smoke`. سير عمل GitHub قبل وبعد
لأول سيناريو حقيقي هو `Mantis Discord Status Reactions`. يقبل:

- `baseline_ref`: المرجع المتوقع أن يعيد إنتاج سلوك queued-only.
- `candidate_ref`: المرجع المتوقع أن يعرض `queued -> thinking -> done`.

يفحص مرجع عُدّة سير العمل، ويبني worktrees منفصلة للأساس والمرشح،
ويشغّل `discord-status-reactions-tool-only` ضد كل worktree، ويرفع
`baseline/`، و`candidate/`، و`comparison.json`، و`mantis-report.md` كعناصر
Actions أثرية. كما يعرض HTML الخط الزمني لكل مسار في متصفح سطح مكتب
Crabbox وينشر لقطات شاشة VNC هذه بجانب صور PNG للخط الزمني الحتمي
في تعليق PR. يتضمن تعليق PR نفسه معاينات GIF خفيفة ومقصوصة الحركة
تم إنشاؤها بواسطة `crabbox media preview`، ويربط بمقاطع MP4 المطابقة
المقصوصة الحركة، ويحتفظ بملفات MP4 الكاملة لسطح المكتب للفحص العميق.
تبقى لقطات الشاشة مضمنة للمراجعة السريعة. يبني سير العمل
Crabbox CLI من
`openclaw/crabbox` main حتى يتمكن من استخدام أعلام إيجار سطح المكتب/المتصفح
الحالية قبل قطع إصدار Crabbox الثنائي التالي.

يمكنك أيضًا تشغيل تشغيل تفاعلات الحالة مباشرةً من تعليق PR:

```text
@Mantis discord status reactions
```

مشغّل التعليق ضيق عمدًا. يعمل فقط على تعليقات pull request
من مستخدمين لديهم صلاحية write أو maintain أو admin، ويتعرف فقط على
طلبات تفاعل حالة Discord. افتراضيًا يستخدم مرجع الأساس السيئ المعروف
وSHA رأس PR الحالي كمرشح. يمكن للمشرفين تجاوز أي من
المرجعين:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

أمثلة أوامر ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

الأمر الأول صريح ومركّز على السيناريو. يمكن للثاني لاحقًا ربط PR
أو issue بسيناريوهات Mantis موصى بها من التسميات، والملفات المتغيرة، و
نتائج مراجعة ClawSweeper.

## دورة التشغيل

1. الحصول على بيانات الاعتماد.
2. تخصيص VM أو إعادة استخدامها.
3. تجهيز ملف تعريف سطح المكتب/المتصفح عندما يحتاج السيناريو إلى دليل واجهة مستخدم.
4. تجهيز checkout نظيف لمرجع الأساس.
5. تثبيت الاعتماديات وبناء ما يحتاجه السيناريو فقط.
6. بدء Gateway فرعية لـ OpenClaw بدليل حالة معزول.
7. تهيئة النقل الحي، والمزوّد، والنموذج، وملف تعريف المتصفح.
8. تشغيل السيناريو والتقاط أدلة الأساس.
9. إيقاف Gateway وحفظ السجلات.
10. تجهيز المرجع المرشح في VM نفسها.
11. تشغيل السيناريو نفسه والتقاط أدلة المرشح.
12. مقارنة نتائج الحكم والأدلة المرئية.
13. كتابة Markdown، وJSON، والسجلات، ولقطات الشاشة، وعناصر التتبع الأثرية الاختيارية.
14. رفع عناصر GitHub Actions الأثرية.
15. نشر رسالة حالة موجزة إلى PR أو Discord.

يجب أن يكون السيناريو قادرًا على الفشل بطريقتين مختلفتين:

- **تمت إعادة إنتاج الخطأ**: فشل الأساس بالطريقة المتوقعة.
- **فشل العُدّة**: فشل إعداد البيئة، أو بيانات الاعتماد، أو Discord API، أو المتصفح، أو
  المزوّد قبل أن يصبح حكم الخطأ ذا معنى.

يجب أن يفصل التقرير النهائي بين هذه الحالات حتى لا يخلط المشرفون بين بيئة
متقلبة وسلوك المنتج.

## Discord MVP

ينبغي أن يستهدف السيناريو الأول تفاعلات حالة Discord في قنوات guild حيث
يكون وضع تسليم رد المصدر هو `message_tool_only`.

لماذا هو بذرة Mantis جيدة:

- يكون مرئيًا في Discord كتفاعلات على الرسالة المشغِّلة.
- لديه حكم REST قوي من خلال حالة تفاعل رسالة Discord.
- يمرّن Gateway حقيقية لـ OpenClaw، ومصادقة بوت Discord، وإرسال الرسائل،
  ووضع تسليم رد المصدر، وحالة تفاعل الحالة، ودورة حياة دور النموذج.
- إنه ضيق بما يكفي ليحافظ على صدق التنفيذ الأول.

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

ينبغي أن تُظهر أدلة الأساس تفاعل الإقرار في قائمة الانتظار لكن دون
انتقال دورة حياة في وضع tool-only. ينبغي أن تُظهر أدلة المرشح تفاعلات حالة
دورة الحياة تعمل عندما يكون `messages.statusReactions.enabled` مضبوطًا صراحةً
على `true`.

الشريحة التنفيذية الأولى هي سيناريو QA الحي الاختياري لـ Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

يضبط هذا نظام الاختبار SUT مع معالجة دائمة التفعيل للخادم، و`visibleReplies:
"message_tool"`، و`ackReaction: "👀"`، وتفاعلات حالة صريحة. يستطلع أوراكل
رسالة التشغيل الحقيقية في Discord ويتوقع التسلسل المرصود
`👀 -> 🤔 -> 👍`. تتضمن الأدلة `discord-qa-reaction-timelines.json`،
و`discord-status-reactions-tool-only-timeline.html`، و
`discord-status-reactions-tool-only-timeline.png`.

## مكونات QA الموجودة

ينبغي أن يبني Mantis على حزمة QA الخاصة الموجودة بدلاً من البدء من الصفر:

- يشغّل `pnpm openclaw qa discord` بالفعل مسار Discord حيًا مع بوتات المشغّل وSUT.
- يكتب مشغّل النقل الحي بالفعل التقارير وأدلة الرسائل المرصودة ضمن `.artifacts/qa-e2e/`.
- توفر تأجيرات بيانات اعتماد Convex بالفعل وصولاً حصريًا إلى بيانات اعتماد النقل الحي المشتركة.
- تدعم خدمة التحكم بالمتصفح بالفعل لقطات الشاشة، واللقطات، والملفات الشخصية المُدارة بلا واجهة، وملفات CDP الشخصية البعيدة.
- يحتوي QA Lab بالفعل على واجهة مصحح وحافلة لاختبار ذي شكل نقل.

يمكن أن يكون تنفيذ Mantis الأول مشغّلاً رقيقًا قبل/بعد فوق هذه المكونات، مع طبقة دليل بصري واحدة.

## نموذج الأدلة

تكتب كل عملية تشغيل دليل أدلة مستقرًا:

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

يجب أن يكون `mantis-summary.json` مصدر الحقيقة المقروء آليًا. تقرير Markdown مخصص لتعليقات PR والمراجعة البشرية.

يجب أن يتضمن الملخص:

- المراجع وSHAs المختبرة
- النقل ومعرّف السيناريو
- مزوّد الجهاز ومعرّف الجهاز أو معرّف التأجير
- مصدر بيانات الاعتماد دون قيم سرية
- نتيجة baseline
- نتيجة candidate
- ما إذا كان الخلل قد تكرر على baseline
- ما إذا كان candidate قد أصلحه
- مسارات الأدلة
- مشكلات الإعداد أو التنظيف المنقحة

لقطات الشاشة أدلة وليست أسرارًا. لكنها ما تزال تحتاج إلى انضباط في التنقيح:
قد تظهر أسماء قنوات خاصة، أو أسماء مستخدمين، أو محتوى رسائل. بالنسبة إلى PRs العامة،
فضّل روابط أدلة GitHub Actions بدلاً من الصور المضمنة إلى أن تصبح قصة التنقيح أقوى.

## المتصفح وVNC

يحتوي مسار المتصفح على وضعين:

- **أتمتة بلا واجهة**: الافتراضي في CI. يعمل Chrome مع تفعيل CDP، ويلتقط Playwright أو تحكم متصفح OpenClaw لقطات الشاشة.
- **إنقاذ VNC**: مفعّل على VM نفسه عندما يحتاج تسجيل الدخول، أو MFA، أو منع الأتمتة في Discord، أو التصحيح البصري إلى إنسان.

يجب أن يكون ملف متصفح مراقب Discord الشخصي دائمًا بما يكفي لتجنب تسجيل الدخول في كل تشغيل، لكنه معزول عن حالة المتصفح الشخصية. ينتمي الملف الشخصي إلى مجموعة أجهزة Mantis، وليس إلى حاسوب مطوّر محمول.

عندما يتعطل Mantis، ينشر رسالة حالة في Discord تحتوي على:

- معرّف التشغيل
- معرّف السيناريو
- مزوّد الجهاز
- دليل الأدلة
- تعليمات اتصال VNC أو noVNC إذا كانت متاحة
- نص قصير عن العائق

يمكن للنشر الخاص الأول أن يرسل هذه الرسائل إلى قناة المشغّلين الموجودة وينتقل لاحقًا إلى قناة Mantis مخصصة.

## الأجهزة

ينبغي أن يفضّل Mantis استخدام AWS عبر Crabbox للتنفيذ البعيد الأول.
يوفر Crabbox أجهزة مُحمّاة مسبقًا، وتتبع التأجير، والترطيب، والسجلات، والنتائج، والتنظيف. إذا كانت سعة AWS بطيئة جدًا أو غير متاحة، فأضف مزوّد Hetzner خلف واجهة الجهاز نفسها.

الحد الأدنى لمتطلبات VM:

- Linux مع تثبيت Chrome أو Chromium قادر على سطح المكتب
- وصول CDP لأتمتة المتصفح
- VNC أو noVNC للإنقاذ
- Node 22 وpnpm
- نسخة OpenClaw ومخبأ التبعيات
- مخبأ متصفح Playwright Chromium عند استخدام Playwright
- CPU وذاكرة كافيان لـ OpenClaw Gateway واحد، ومتصفح واحد، وتشغيل نموذج واحد
- وصول صادر إلى Discord، وGitHub، ومزوّدي النماذج، ووسيط بيانات الاعتماد

يجب ألا تحتفظ VM بأسرار خام طويلة العمر خارج مخازن بيانات الاعتماد أو ملفات المتصفح الشخصية المتوقعة.

## الأسرار

تعيش الأسرار في أسرار مؤسسة GitHub أو المستودع للتشغيلات البعيدة، وفي ملف أسرار محلي يتحكم به المشغّل للتشغيلات المحلية.

أسماء الأسرار الموصى بها:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لعمليات رفع أدلة GitHub العامة
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

على المدى الطويل، يجب أن يظل مجمع بيانات اعتماد Convex هو المصدر الطبيعي لبيانات اعتماد النقل الحي. تبدأ أسرار GitHub وسيط البيانات ومسارات الاحتياط. يطابق سير عمل تفاعلات حالة Discord أسرار Mantis Crabbox مرة أخرى مع متغيري البيئة
`CRABBOX_COORDINATOR` و`CRABBOX_COORDINATOR_TOKEN`
اللذين يتوقعهما Crabbox CLI. تظل أسماء أسرار GitHub العادية `CRABBOX_*`
مقبولة كاحتياط توافق.

يجب ألا يطبع مشغّل Mantis أبدًا:

- رموز بوتات Discord
- مفاتيح API للمزوّد
- ملفات تعريف ارتباط المتصفح
- محتويات ملفات المصادقة الشخصية
- كلمات مرور VNC
- حمولات بيانات الاعتماد الخام

يجب أن تنقح عمليات رفع الأدلة العامة أيضًا بيانات تعريف هدف Discord مثل معرّفات البوت، والخادم، والقناة، والرسالة. يفعّل سير عمل smoke في GitHub
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لهذا السبب.

إذا لُصق رمز عن طريق الخطأ في issue، أو PR، أو دردشة، أو سجل، فقم بتدويره
بعد تخزين السر الجديد.

## أدلة GitHub وتعليقات PR

ينبغي أن ترفع سير عمل Mantis حزمة الأدلة الكاملة كدليل Actions قصير العمر. عندما يُشغّل سير العمل لتقرير خلل أو PR إصلاح، ينبغي أن ينشر أيضًا لقطات PNG المنقحة إلى فرع `qa-artifacts` وأن يدرج أو يحدث تعليقًا على ذلك الخلل أو PR الإصلاح مع لقطات شاشة قبل/بعد مضمنة. لا تنشر الإثبات الأساسي فقط على PR أتمتة QA عام. تبقى السجلات الخام، والرسائل المرصودة، والأدلة الضخمة الأخرى في دليل Actions.

يجب أن تنشر سير العمل الإنتاجية تلك التعليقات باستخدام تطبيق Mantis GitHub App، وليس باستخدام `github-actions[bot]`. خزّن معرّف التطبيق والمفتاح الخاص كأسرار GitHub Actions
`MANTIS_GITHUB_APP_ID` و`MANTIS_GITHUB_APP_PRIVATE_KEY`.
يستخدم سير العمل علامة مخفية كمفتاح إدراج أو تحديث، ويحدّث ذلك التعليق عندما يستطيع الرمز تعديله، وينشئ تعليقًا جديدًا مملوكًا لـ Mantis عندما لا يمكن تعديل علامة أقدم مملوكة لبوت.

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

عندما يفشل التشغيل لأن إطار الاختبار فشل، يجب أن يقول التعليق ذلك بدلاً من الإيحاء بأن candidate فشل.

## ملاحظات النشر الخاص

قد يحتوي نشر خاص بالفعل على تطبيق Mantis Discord. أعد استخدام ذلك التطبيق بدلاً من إنشاء تطبيق آخر عندما يمتلك أذونات البوت الصحيحة ويمكن تدويره بأمان.

اضبط قناة إشعارات المشغّل الأولية عبر الأسرار أو إعدادات النشر. يمكن أن تشير أولاً إلى قناة مشرفين أو عمليات موجودة، ثم تنتقل إلى قناة Mantis مخصصة بمجرد وجود واحدة.

لا تضع معرّفات الخوادم، أو معرّفات القنوات، أو رموز البوتات، أو ملفات تعريف ارتباط المتصفح، أو كلمات مرور VNC في هذا المستند. خزّنها في أسرار GitHub، أو وسيط بيانات الاعتماد، أو مخزن الأسرار المحلي للمشغّل.

## إضافة سيناريو

ينبغي أن يصرّح سيناريو Mantis بما يلي:

- المعرّف والعنوان
- النقل
- بيانات الاعتماد المطلوبة
- سياسة مرجع baseline
- سياسة مرجع candidate
- رقعة إعدادات OpenClaw
- خطوات الإعداد
- المحفز
- أوراكل baseline المتوقع
- أوراكل candidate المتوقع
- أهداف الالتقاط البصري
- ميزانية المهلة
- خطوات التنظيف

ينبغي أن تفضّل السيناريوهات أوراكلات صغيرة ومطبوعة:

- حالة تفاعل Discord لأخطاء التفاعل
- مراجع رسائل Discord لأخطاء الترابط
- thread ts في Slack وحالة API التفاعل لأخطاء Slack
- معرّفات رسائل البريد الإلكتروني ورؤوسها لأخطاء البريد الإلكتروني
- لقطات شاشة المتصفح عندما تكون UI هي الملاحظة الوحيدة الموثوقة

يجب أن تكون فحوص الرؤية إضافية. إذا كان بإمكان API منصة إثبات الخلل، فاستخدم API كأوراكل نجاح/فشل واحتفظ بلقطات الشاشة لثقة البشر.

## توسيع المزوّدين

بعد Discord، يمكن للمشغّل نفسه إضافة:

- Slack: التفاعلات، والسلاسل، وذكر التطبيق، والنوافذ، ورفع الملفات.
- البريد الإلكتروني: مصادقة Gmail وترابط الرسائل باستخدام `gog` عندما لا تكفي الموصلات.
- WhatsApp: تسجيل دخول QR، وإعادة التعرف، وتسليم الرسائل، والوسائط، والتفاعلات.
- Telegram: ضبط ذكر المجموعة، والأوامر، والتفاعلات حيث تكون متاحة.
- Matrix: الغرف المشفرة، وعلاقات السلسلة أو الرد، واستئناف إعادة التشغيل.

ينبغي أن يمتلك كل نقل سيناريو smoke رخيصًا وسيناريو واحدًا أو أكثر من فئات الأخطاء. يجب أن تظل السيناريوهات البصرية المكلفة اختيارية.

## أسئلة مفتوحة

- أي بوت Discord يجب أن يكون المشغّل، وأيها يجب أن يكون SUT، عندما يُعاد استخدام بوت Mantis الموجود؟
- هل يجب أن يستخدم تسجيل دخول متصفح المراقب حساب Discord بشريًا، أو حساب اختبار، أو أدلة REST القابلة للقراءة بواسطة البوت فقط في المرحلة الأولى؟
- ما مدة احتفاظ GitHub بأدلة Mantis الخاصة بـ PRs؟
- متى يجب أن يوصي ClawSweeper تلقائيًا بـ Mantis بدلاً من انتظار أمر مشرف؟
- هل يجب تنقيح لقطات الشاشة أو قصّها قبل الرفع لـ PRs العامة؟
