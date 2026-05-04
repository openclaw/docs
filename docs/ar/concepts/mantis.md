---
read_when:
    - بناء أو تشغيل ضمان الجودة المرئية المباشرة لأخطاء OpenClaw
    - إضافة التحقق قبل طلب السحب وبعده
    - إضافة سيناريوهات النقل المباشر لـ Discord أو Slack أو WhatsApp أو غيرها
    - تصحيح أخطاء تشغيلات ضمان الجودة التي تحتاج إلى لقطات شاشة أو أتمتة المتصفح أو الوصول عبر VNC
summary: Mantis هو نظام التحقق المرئي من البداية إلى النهاية لإعادة إنتاج أخطاء OpenClaw على وسائط النقل المباشرة، والتقاط أدلة ما قبل الإصلاح وما بعده، وإرفاق المخرجات بطلبات السحب.
title: السرعوف
x-i18n:
    generated_at: "2026-05-04T07:03:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis هو نظام التحقق الشامل من OpenClaw للأخطاء التي تحتاج إلى وقت تشغيل حقيقي، ووسيط نقل حقيقي، ودليل مرئي. يشغّل سيناريو ضد مرجع معروف بأنه سيئ، ويلتقط الأدلة، ثم يشغّل السيناريو نفسه ضد مرجع مرشح، وينشر المقارنة كأدوات أثرية يمكن للمشرف فحصها من PR أو من أمر محلي.

يبدأ Mantis مع Discord لأن Discord يمنحنا مسارًا أولًا عالي القيمة: مصادقة بوت حقيقية، وقنوات guild حقيقية، وتفاعلات، وخيوط، وأوامر أصلية، وواجهة متصفح يمكن للبشر من خلالها تأكيد ما عرضه وسيط النقل بصريًا.

## الأهداف

- إعادة إنتاج خطأ من issue أو PR على GitHub بالشكل نفسه لوسيط النقل الذي يراه المستخدمون.
- التقاط أداة أثرية **قبل** على مرجع الأساس قبل تطبيق الإصلاح.
- التقاط أداة أثرية **بعد** على المرجع المرشح بعد تطبيق الإصلاح.
- استخدام أوراكل حتمي كلما أمكن، مثل قراءة تفاعل Discord عبر REST أو التحقق من سجل القناة.
- التقاط لقطات شاشة عندما يكون للخطأ سطح واجهة مرئي.
- التشغيل محليًا من CLI يتحكم به الوكيل وعن بُعد من GitHub.
- حفظ قدر كافٍ من حالة الآلة لإنقاذ VNC عندما يعلق تسجيل الدخول أو أتمتة المتصفح أو مصادقة المزوّد.
- نشر حالة موجزة إلى قناة Discord خاصة بالمشغل عندما يكون التشغيل محظورًا، أو يحتاج إلى مساعدة VNC يدوية، أو ينتهي.

## غير الأهداف

- Mantis ليس بديلًا عن اختبارات الوحدة. يجب أن يتحول تشغيل Mantis عادةً إلى اختبار انحدار أصغر بعد فهم الإصلاح.
- Mantis ليس بوابة CI السريعة العادية. فهو أبطأ، ويستخدم بيانات اعتماد حية، ومخصص للأخطاء التي تكون فيها البيئة الحية مهمة.
- يجب ألا يتطلب Mantis إنسانًا للتشغيل العادي. VNC اليدوي مسار إنقاذ، وليس المسار السعيد.
- لا يخزن Mantis أسرارًا خامًا في الأدوات الأثرية أو السجلات أو لقطات الشاشة أو تقارير Markdown أو تعليقات PR.

## الملكية

يوجد Mantis ضمن حزمة QA الخاصة بـ OpenClaw.

- يمتلك OpenClaw وقت تشغيل السيناريو، ومحوّلات وسيط النقل، ومخطط الأدلة، وCLI المحلي ضمن `pnpm openclaw qa mantis`.
- يمتلك QA Lab أجزاء حزام وسيط النقل الحي، ومساعدات التقاط المتصفح، وكاتبات الأدوات الأثرية.
- يمتلك Crabbox آلات Linux الدافئة عندما تكون VM بعيدة مطلوبة.
- تمتلك GitHub Actions نقطة دخول سير العمل البعيد والاحتفاظ بالأدوات الأثرية.
- يمتلك ClawSweeper توجيه تعليقات GitHub: تحليل أوامر المشرفين، وإرسال سير العمل، ونشر تعليق PR النهائي.
- تقود وكلاء OpenClaw Mantis عبر Codex عندما يحتاج السيناريو إلى إعداد وكيل، أو تصحيح أخطاء، أو الإبلاغ عن حالة عالقة.

يحافظ هذا الحد على معرفة وسيط النقل داخل OpenClaw، وجدولة الآلات داخل Crabbox، وغراء سير عمل المشرفين داخل ClawSweeper.

## شكل الأمر

يتحقق الأمر المحلي الأول من بوت Discord، وguild، والقناة، وإرسال الرسالة، وإرسال التفاعل، ومسار الأداة الأثرية:

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

ينشئ المشغّل worktrees منفصلة للأساس والمرشح ضمن دليل الإخراج، ويثبّت الاعتماديات، ويبني كل مرجع، ويشغّل السيناريو باستخدام `--allow-failures`، ثم يكتب `baseline/` و`candidate/` و`comparison.json` و`mantis-report.md`. بالنسبة إلى سيناريو Discord الأول، يعني التحقق الناجح أن حالة الأساس هي `fail` وحالة المرشح هي `pass`.

أول أداة بدائية لـ VM/المتصفح هي smoke سطح المكتب:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

تستأجر أو تعيد استخدام آلة سطح مكتب من Crabbox، وتبدأ متصفحًا مرئيًا داخل جلسة VNC، وتلتقط سطح المكتب، وتسحب الأدوات الأثرية مرة أخرى إلى دليل الإخراج المحلي، وتكتب أمر إعادة الاتصال في التقرير. يستخدم الأمر مزوّد Hetzner افتراضيًا لأنه أول مزوّد لديه تغطية سطح مكتب/VNC عاملة في مسار Mantis. تجاوزه باستخدام `--provider` أو `--crabbox-bin` أو `OPENCLAW_MANTIS_CRABBOX_PROVIDER` عند التشغيل ضد أسطول Crabbox آخر.

أعلام smoke سطح المكتب المفيدة:

- `--lease-id <cbx_...>` أو `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` يعيد استخدام سطح مكتب دافئ.
- `--browser-url <url>` يغيّر الصفحة المفتوحة في المتصفح المرئي.
- `--html-file <path>` يعرض أداة أثرية HTML محلية من المستودع في المتصفح المرئي. يستخدم Mantis هذا لالتقاط مخطط تفاعلات حالة Discord المولّد عبر سطح مكتب Crabbox حقيقي.
- `--keep-lease` أو `OPENCLAW_MANTIS_KEEP_VM=1` يبقي عقد إيجار ناجحًا تم إنشاؤه حديثًا مفتوحًا لفحص VNC. تحافظ عمليات التشغيل الفاشلة على عقد الإيجار افتراضيًا عندما تم إنشاؤه حتى يتمكن المشغل من إعادة الاتصال.
- تضبط `--class` و`--idle-timeout` و`--ttl` حجم الآلة ومدة عقد الإيجار.

أول أداة بدائية كاملة لوسيط نقل سطح المكتب هي Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

تستأجر أو تعيد استخدام آلة سطح مكتب من Crabbox، وتزامن checkout الحالي إلى VM، وتشغّل `pnpm openclaw qa slack` داخل تلك VM، وتفتح Slack Web في متصفح VNC، وتلتقط سطح المكتب المرئي، وتنسخ كلًا من أدوات Slack QA الأثرية ولقطة شاشة VNC مرة أخرى إلى دليل الإخراج المحلي. هذا أول شكل من Mantis حيث يعيش Gateway الخاص بـ OpenClaw للنظام قيد الاختبار والمتصفح كلاهما داخل VM سطح مكتب Linux نفسها.

مع `--gateway-setup`، يجهّز الأمر منزل OpenClaw دائمًا وقابلًا للتخلص منه في `$HOME/.openclaw-mantis/slack-openclaw`، ويرقّع إعداد Slack Socket Mode للقناة المحددة، ويبدأ `openclaw gateway run` على المنفذ `38973`، ويبقي Chrome قيد التشغيل في جلسة VNC. هذا هو وضع "اترك لي سطح مكتب Linux مع Slack وclaw قيد التشغيل"؛ ويبقى مسار Slack QA من بوت إلى بوت هو الافتراضي عند حذف `--gateway-setup`.

المدخلات المطلوبة لـ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` لمسار النموذج البعيد. إذا كان `OPENAI_API_KEY` فقط مضبوطًا محليًا، يطابقه Mantis إلى `OPENCLAW_LIVE_OPENAI_KEY` قبل استدعاء Crabbox حتى يتمكن تمرير env الخاص بـ `OPENCLAW_*` في Crabbox من حمله إلى VM.

أعلام Slack desktop المفيدة:

- `--lease-id <cbx_...>` يعيد التشغيل ضد آلة سجّل عليها مشغل الدخول بالفعل إلى Slack Web عبر VNC.
- `--gateway-setup` يبدأ Gateway دائمًا لـ OpenClaw Slack في VM بدلًا من تشغيل مسار QA من بوت إلى بوت فقط.
- `--slack-url <url>` يفتح URL محددًا لـ Slack Web. بدونه، يستنتج Mantis `https://app.slack.com/client/<team>/<channel>` من Slack `auth.test` عندما يكون رمز بوت النظام قيد الاختبار متاحًا.
- يتحكم `--slack-channel-id <id>` في قائمة السماح لقنوات Slack التي يستخدمها إعداد Gateway.
- يتحكم `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` في ملف تعريف Chrome الدائم داخل VM. الافتراضي هو `$HOME/.config/openclaw-mantis/slack-chrome-profile`، لذلك يستمر تسجيل دخول Slack Web اليدوي عبر عمليات إعادة التشغيل على عقد الإيجار نفسه.
- يستخدم `--credential-source convex --credential-role ci` تجمع بيانات الاعتماد المشترك بدلًا من رموز Slack env المباشرة.
- تمرّر `--provider-mode` و`--model` و`--alt-model` و`--fast` إلى مسار Slack الحي.

سير عمل smoke على GitHub هو `Mantis Discord Smoke`. سير عمل GitHub قبل وبعد لأول سيناريو حقيقي هو `Mantis Discord Status Reactions`. يقبل:

- `baseline_ref`: المرجع المتوقع أن يعيد إنتاج سلوك queued-only.
- `candidate_ref`: المرجع المتوقع أن يعرض `queued -> thinking -> done`.

يسحب مرجع حزام سير العمل، ويبني worktrees منفصلة للأساس والمرشح، ويشغّل `discord-status-reactions-tool-only` ضد كل worktree، ويرفع `baseline/` و`candidate/` و`comparison.json` و`mantis-report.md` كأدوات أثرية في Actions. كما يعرض HTML لمخطط كل مسار في متصفح سطح مكتب Crabbox وينشر لقطات شاشة VNC تلك بجانب صور PNG الحتمية للمخطط في تعليق PR. يبني سير العمل Crabbox CLI من `openclaw/crabbox` main حتى يتمكن من استخدام أعلام عقد إيجار سطح المكتب/المتصفح الحالية قبل إصدار ثنائية Crabbox التالية.

يمكنك أيضًا تشغيل عملية status-reactions مباشرة من تعليق PR:

```text
@Mantis discord status reactions
```

مشغّل التعليق ضيق عمدًا. يعمل فقط على تعليقات pull request من مستخدمين لديهم صلاحية write أو maintain أو admin، ولا يتعرف إلا على طلبات تفاعلات حالة Discord. يستخدم افتراضيًا مرجع الأساس المعروف بأنه سيئ وSHA الحالي لرأس PR كمرشح. يمكن للمشرفين تجاوز أي من المرجعين:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

أمثلة أوامر ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

الأمر الأول صريح ومركّز على السيناريو. يمكن للأمر الثاني لاحقًا ربط PR أو issue بسيناريوهات Mantis موصى بها من التسميات، والملفات المتغيرة، ونتائج مراجعة ClawSweeper.

## دورة حياة التشغيل

1. الحصول على بيانات الاعتماد.
2. تخصيص VM أو إعادة استخدامها.
3. تجهيز ملف تعريف سطح المكتب/المتصفح عندما يحتاج السيناريو إلى دليل واجهة.
4. تجهيز checkout نظيف لمرجع الأساس.
5. تثبيت الاعتماديات وبناء ما يحتاجه السيناريو فقط.
6. بدء Gateway فرعي لـ OpenClaw بدليل حالة معزول.
7. تكوين وسيط النقل الحي، والمزوّد، والنموذج، وملف تعريف المتصفح.
8. تشغيل السيناريو والتقاط أدلة الأساس.
9. إيقاف Gateway وحفظ السجلات.
10. تجهيز المرجع المرشح في VM نفسها.
11. تشغيل السيناريو نفسه والتقاط أدلة المرشح.
12. مقارنة نتائج الأوراكل والأدلة المرئية.
13. كتابة Markdown وJSON والسجلات ولقطات الشاشة وأدوات trace الأثرية الاختيارية.
14. رفع أدوات GitHub Actions الأثرية.
15. نشر رسالة حالة موجزة إلى PR أو Discord.

يجب أن يكون السيناريو قادرًا على الفشل بطريقتين مختلفتين:

- **إعادة إنتاج الخطأ**: فشل الأساس بالطريقة المتوقعة.
- **فشل الحزام**: فشل إعداد البيئة، أو بيانات الاعتماد، أو Discord API، أو المتصفح، أو المزوّد قبل أن يصبح أوراكل الخطأ ذا معنى.

يجب أن يفصل التقرير النهائي بين هذه الحالات حتى لا يخلط المشرفون بين بيئة غير مستقرة وسلوك المنتج.

## Discord MVP

يجب أن يستهدف السيناريو الأول تفاعلات حالة Discord في قنوات guild حيث يكون وضع تسليم رد المصدر هو `message_tool_only`.

لماذا هو بذرة Mantis جيدة:

- إنه مرئي في Discord كتفاعلات على الرسالة المشغّلة.
- لديه أوراكل REST قوي عبر حالة تفاعل رسالة Discord.
- يختبر Gateway حقيقيًا لـ OpenClaw، ومصادقة بوت Discord، وإرسال الرسائل، ووضع تسليم رد المصدر، وحالة تفاعل الحالة، ودورة حياة دور النموذج.
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

يجب أن تُظهر أدلة الأساس تفاعل إقرار queued ولكن دون انتقال دورة الحياة في وضع tool-only. يجب أن تُظهر أدلة المرشح تفاعلات حالة دورة الحياة تعمل عندما تكون `messages.statusReactions.enabled` مفعّلة صراحة.

الشريحة التنفيذية الأولى هي سيناريو Discord live QA الاختياري:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

يضبط SUT مع معالجة دائمة التفعيل للنقابات، و`visibleReplies:
"message_tool"`، و`ackReaction: "👀"`، وتفاعلات حالة صريحة. يستطلع المرجع
رسالة تشغيل Discord الحقيقية ويتوقع التسلسل المرصود
`👀 -> 🤔 -> 👍`. تتضمن الأدلة `discord-qa-reaction-timelines.json`،
و`discord-status-reactions-tool-only-timeline.html`، و
`discord-status-reactions-tool-only-timeline.png`.

## أجزاء QA الحالية

ينبغي أن يبني Mantis على حزمة QA الخاصة الحالية بدل البدء من
الصفر:

- يشغل `pnpm openclaw qa discord` بالفعل مسار Discord حيًا مع برامج driver و
  SUT bots.
- يكتب مشغل النقل الحي بالفعل التقارير وأدلة الرسائل المرصودة
  ضمن `.artifacts/qa-e2e/`.
- توفر عقود اعتماد Convex بالفعل وصولًا حصريًا إلى بيانات اعتماد النقل الحي
  المشتركة.
- تدعم خدمة التحكم في المتصفح بالفعل لقطات الشاشة واللقطات المرحلية
  والملفات الشخصية المدارة بلا واجهة وملفات CDP الشخصية البعيدة.
- يملك QA Lab بالفعل واجهة مصحح وناقلًا للاختبار المشابه للنقل.

يمكن أن يكون تنفيذ Mantis الأول مشغلًا خفيفًا قبل/بعد فوق هذه
الأجزاء، مع طبقة واحدة للأدلة المرئية.

## نموذج الأدلة

تكتب كل عملية تشغيل مجلد أدلة ثابتًا:

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

ينبغي أن يكون `mantis-summary.json` مصدر الحقيقة القابل للقراءة آليًا. تقرير
Markdown مخصص لتعليقات PR والمراجعة البشرية.

يجب أن يتضمن الملخص:

- المراجع وSHAs التي اختُبرت
- النقل ومعرف السيناريو
- مزود الجهاز ومعرف الجهاز أو معرف العقد
- مصدر بيانات الاعتماد من دون قيم سرية
- نتيجة baseline
- نتيجة candidate
- ما إذا كان الخطأ قد أُعيد إنتاجه على baseline
- ما إذا كان candidate قد أصلحه
- مسارات الأدلة
- مشاكل الإعداد أو التنظيف المنقحة

لقطات الشاشة أدلة، وليست أسرارًا. لكنها لا تزال تحتاج إلى انضباط التنقيح:
قد تظهر أسماء القنوات الخاصة أو أسماء المستخدمين أو محتوى الرسائل. بالنسبة إلى PRs العامة،
فضّل روابط أدلة GitHub Actions على الصور المضمنة إلى أن تصبح قصة التنقيح
أقوى.

## المتصفح وVNC

لمسار المتصفح وضعان:

- **الأتمتة بلا واجهة**: الافتراضي لـ CI. يعمل Chrome مع تمكين CDP، وتلتقط
  Playwright أو تحكم متصفح OpenClaw لقطات الشاشة.
- **إنقاذ VNC**: مُمكّن على VM نفسه عندما يتطلب تسجيل الدخول أو MFA أو مكافحة
  الأتمتة في Discord أو التصحيح المرئي تدخلًا بشريًا.

ينبغي أن يكون ملف المتصفح الشخصي لمراقب Discord مستمرًا بما يكفي لتجنب
تسجيل الدخول في كل تشغيل، لكنه معزول عن حالة المتصفح الشخصية. ينتمي الملف الشخصي
إلى مجموعة أجهزة Mantis، وليس إلى حاسوب مطور محمول.

عندما يتعطل Mantis، ينشر رسالة حالة في Discord تحتوي على:

- معرف التشغيل
- معرف السيناريو
- مزود الجهاز
- مجلد الأدلة
- تعليمات اتصال VNC أو noVNC إن كانت متاحة
- نص قصير يصف العائق

يمكن للنشر الخاص الأول أن ينشر هذه الرسائل في قناة المشغل الحالية
ثم ينتقل إلى قناة Mantis مخصصة لاحقًا.

## الأجهزة

ينبغي أن يفضّل Mantis استخدام AWS عبر Crabbox للتنفيذ البعيد الأول.
يوفر Crabbox أجهزة مُسخّنة مسبقًا، وتتبع العقود، والترطيب، والسجلات، والنتائج،
والتنظيف. إذا كانت سعة AWS بطيئة جدًا أو غير متاحة، فأضف مزود Hetzner
خلف واجهة الجهاز نفسها.

متطلبات VM الدنيا:

- Linux مع تثبيت Chrome أو Chromium قادر على سطح المكتب
- وصول CDP لأتمتة المتصفح
- VNC أو noVNC للإنقاذ
- Node 22 وpnpm
- checkout لـ OpenClaw وذاكرة تخزين مؤقت للاعتماديات
- ذاكرة تخزين مؤقت لمتصفح Playwright Chromium عند استخدام Playwright
- CPU وذاكرة كافيان لتشغيل OpenClaw Gateway واحد، ومتصفح واحد، وتشغيل نموذج واحد
- وصول صادر إلى Discord وGitHub ومزودي النماذج ووسيط بيانات الاعتماد

ينبغي ألا يحتفظ VM بأسرار خام طويلة العمر خارج مخازن بيانات الاعتماد أو
ملفات المتصفح الشخصية المتوقعة.

## الأسرار

توجد الأسرار في أسرار مؤسسة أو مستودع GitHub للتشغيلات البعيدة، وفي
ملف أسرار محلي يتحكم فيه المشغل للتشغيلات المحلية.

أسماء الأسرار الموصى بها:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لتحميلات أدلة GitHub العامة
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

على المدى الطويل، ينبغي أن تبقى مجموعة بيانات اعتماد Convex المصدر المعتاد لبيانات
اعتماد النقل الحي. تقوم أسرار GitHub بتهيئة الوسيط ومسارات الرجوع.
يعيد سير عمل تفاعلات حالة Discord ربط أسرار Mantis Crabbox بمتغيري البيئة
`CRABBOX_COORDINATOR` و`CRABBOX_COORDINATOR_TOKEN`
اللذين تتوقعهما Crabbox CLI. تبقى أسماء أسرار GitHub العادية `CRABBOX_*`
مقبولة كخيار توافق احتياطي.

يجب ألا يطبع مشغل Mantis أبدًا:

- رموز Discord bot
- مفاتيح API للمزودين
- ملفات تعريف ارتباط المتصفح
- محتويات ملفات auth الشخصية
- كلمات مرور VNC
- حمولات بيانات الاعتماد الخام

ينبغي أيضًا أن تنقح تحميلات الأدلة العامة بيانات هدف Discord الوصفية مثل معرفات bot
والنقابة والقناة والرسالة. يمكّن سير عمل smoke في GitHub
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لهذا السبب.

إذا لُصق رمز مميز بطريق الخطأ في issue أو PR أو محادثة أو سجل، فدوّره
بعد تخزين السر الجديد.

## أدلة GitHub وتعليقات PR

ينبغي أن ترفع سير عمل Mantis حزمة الأدلة الكاملة كأثر Actions قصير العمر.
عندما يُشغّل سير العمل من أجل تقرير خطأ أو PR إصلاح، ينبغي أيضًا أن
ينشر لقطات شاشة PNG المنقحة إلى فرع `qa-artifacts` ويُدرج أو يحدّث
تعليقًا على ذلك الخطأ أو PR الإصلاح مع لقطات شاشة قبل/بعد مضمنة. لا تنشر
الدليل الأساسي فقط على PR أتمتة QA عام. تبقى السجلات الخام والرسائل
المرصودة والأدلة الضخمة الأخرى في أثر Actions.

ينبغي أن تنشر سير عمل الإنتاج تلك التعليقات باستخدام تطبيق Mantis GitHub App، وليس
باستخدام `github-actions[bot]`. خزّن معرف التطبيق والمفتاح الخاص باسم
`MANTIS_GITHUB_APP_ID` و`MANTIS_GITHUB_APP_PRIVATE_KEY` كأسرار GitHub Actions.
يستخدم سير العمل علامة مخفية كمفتاح إدراج/تحديث، ويحدّث ذلك
التعليق عندما يستطيع الرمز المميز تحريره، وينشئ تعليقًا جديدًا مملوكًا لـ Mantis عندما
يتعذر تحرير علامة قديمة مملوكة للبوت.

ينبغي أن يكون تعليق PR قصيرًا ومرئيًا:

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

عندما يفشل التشغيل لأن الحاضنة فشلت، يجب أن يقول التعليق ذلك بدلًا
من الإيحاء بأن candidate فشل.

## ملاحظات النشر الخاص

قد يكون لدى النشر الخاص تطبيق Discord لـ Mantis بالفعل. أعد استخدام ذلك
التطبيق بدل إنشاء تطبيق آخر عندما يملك أذونات bot المناسبة
ويمكن تدويره بأمان.

عيّن قناة إشعارات المشغل الأولية عبر الأسرار أو إعدادات النشر.
يمكن أن تشير أولًا إلى قناة صيانة أو عمليات موجودة،
ثم تنتقل إلى قناة Mantis مخصصة بمجرد وجودها.

لا تضع معرفات النقابات أو معرفات القنوات أو رموز bot أو ملفات تعريف ارتباط المتصفح أو كلمات مرور VNC
في هذا المستند. خزّنها في أسرار GitHub أو وسيط بيانات الاعتماد أو
مخزن الأسرار المحلي الخاص بالمشغل.

## إضافة سيناريو

ينبغي أن يعلن سيناريو Mantis ما يلي:

- المعرف والعنوان
- النقل
- بيانات الاعتماد المطلوبة
- سياسة مرجع baseline
- سياسة مرجع candidate
- رقعة إعداد OpenClaw
- خطوات الإعداد
- المحفز
- مرجع baseline المتوقع
- مرجع candidate المتوقع
- أهداف الالتقاط المرئي
- ميزانية المهلة
- خطوات التنظيف

ينبغي أن تفضّل السيناريوهات مراجع صغيرة ومطبوعة:

- حالة تفاعل Discord لأخطاء التفاعلات
- مراجع رسائل Discord لأخطاء التسلسل
- thread ts في Slack وحالة API التفاعلات لأخطاء Slack
- معرفات الرسائل والرؤوس لأخطاء البريد الإلكتروني
- لقطات شاشة المتصفح عندما تكون UI هي الشيء الوحيد الموثوق القابل للرصد

ينبغي أن تكون فحوصات الرؤية إضافية. إذا كان يمكن لـ API منصة إثبات الخطأ، فاستخدم
API كمرجع نجاح/فشل واحتفظ بلقطات الشاشة لثقة البشر.

## توسيع المزودين

بعد Discord، يمكن للمشغل نفسه إضافة:

- Slack: التفاعلات، والسلاسل، وإشارات التطبيق، والنوافذ، وتحميلات الملفات.
- البريد الإلكتروني: مصادقة Gmail وتسلسل الرسائل باستخدام `gog` عندما لا تكون الموصلات
  كافية.
- WhatsApp: تسجيل الدخول عبر QR، وإعادة التعرف، وتسليم الرسائل، والوسائط، والتفاعلات.
- Telegram: بوابة إشارات المجموعة، والأوامر، والتفاعلات حيثما تتوفر.
- Matrix: الغرف المشفرة، وعلاقات السلاسل أو الردود، واستئناف إعادة التشغيل.

ينبغي أن يكون لكل نقل سيناريو smoke رخيص وسيناريو واحد أو أكثر من فئات الأخطاء.
ينبغي أن تبقى السيناريوهات المرئية المكلفة اختيارية.

## أسئلة مفتوحة

- أي Discord bot ينبغي أن يكون driver، وأيها ينبغي أن يكون SUT، عندما يُعاد
  استخدام bot Mantis الحالي؟
- هل ينبغي أن يستخدم تسجيل دخول متصفح المراقب حساب Discord بشريًا، أو حساب اختبار،
  أو أدلة REST القابلة للقراءة من bot فقط للمرحلة الأولى؟
- كم من الوقت ينبغي أن يحتفظ GitHub بأدلة Mantis الخاصة بـ PRs؟
- متى ينبغي أن يوصي ClawSweeper تلقائيًا بـ Mantis بدل انتظار
  أمر من مسؤول الصيانة؟
- هل ينبغي تنقيح لقطات الشاشة أو قصها قبل الرفع لـ PRs العامة؟
