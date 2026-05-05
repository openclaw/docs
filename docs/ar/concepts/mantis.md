---
read_when:
    - بناء أو تشغيل ضمان الجودة المرئي المباشر لأخطاء OpenClaw
    - إضافة التحقق قبل طلب السحب وبعده
    - إضافة سيناريوهات النقل المباشر في Discord أو Slack أو WhatsApp أو غيرها
    - تصحيح أخطاء تشغيلات ضمان الجودة التي تحتاج إلى لقطات شاشة أو أتمتة المتصفح أو وصول VNC
summary: Mantis هو نظام التحقق المرئي الشامل من البداية إلى النهاية لإعادة إنتاج أخطاء OpenClaw على وسائط النقل الحية، والتقاط أدلة ما قبل الإصلاح وما بعده، وإرفاق المخرجات بطلبات السحب.
title: السرعوف
x-i18n:
    generated_at: "2026-05-05T08:25:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis هو نظام التحقق الشامل في OpenClaw للأخطاء التي تحتاج إلى وقت تشغيل حقيقي، ونقل حقيقي، ودليل مرئي. يشغّل سيناريو على مرجع معروف بأنه سيئ، ويلتقط الأدلة، ثم يشغّل السيناريو نفسه على مرجع مرشح، وينشر المقارنة كعناصر أثرية يمكن للمشرف فحصها من PR أو من أمر محلي.

يبدأ Mantis بـ Discord لأن Discord يمنحنا مسارًا أول عالي القيمة: مصادقة بوت حقيقية، وقنوات نقابة حقيقية، وتفاعلات، وسلاسل، وأوامر أصلية، وواجهة متصفح يمكن للبشر من خلالها تأكيد ما أظهره النقل بصريًا.

## الأهداف

- إعادة إنتاج خطأ من issue أو PR على GitHub بنفس شكل النقل الذي يراه المستخدمون.
- التقاط عنصر أثري **قبل** على مرجع الأساس قبل تطبيق الإصلاح.
- التقاط عنصر أثري **بعد** على المرجع المرشح بعد تطبيق الإصلاح.
- استخدام حَكَم حتمي كلما أمكن، مثل قراءة تفاعل Discord عبر REST أو فحص نص القناة.
- التقاط لقطات شاشة عندما يكون للخطأ سطح UI مرئي.
- التشغيل محليًا من CLI يتحكم فيه الوكيل وعن بُعد من GitHub.
- حفظ قدر كافٍ من حالة الجهاز لإنقاذ VNC عندما يتعطل تسجيل الدخول أو أتمتة المتصفح أو مصادقة المزوّد.
- نشر حالة موجزة إلى قناة Discord للمشغّل عندما يكون التشغيل محظورًا، أو يحتاج إلى مساعدة VNC يدوية، أو ينتهي.

## ما لا يهدف إليه

- Mantis ليس بديلًا لاختبارات الوحدة. يجب أن يتحول تشغيل Mantis عادةً إلى اختبار انحدار أصغر بعد فهم الإصلاح.
- Mantis ليس بوابة CI السريعة المعتادة. فهو أبطأ، ويستخدم بيانات اعتماد حية، ومحجوز للأخطاء التي تكون فيها البيئة الحية مهمة.
- يجب ألا يتطلب Mantis إنسانًا للتشغيل العادي. VNC اليدوي مسار إنقاذ، وليس المسار السعيد.
- لا يخزن Mantis الأسرار الخام في العناصر الأثرية أو السجلات أو لقطات الشاشة أو تقارير Markdown أو تعليقات PR.

## الملكية

يقع Mantis ضمن مجموعة QA في OpenClaw.

- تمتلك OpenClaw وقت تشغيل السيناريو، ومحولات النقل، ومخطط الأدلة، وCLI المحلي تحت `pnpm openclaw qa mantis`.
- يمتلك QA Lab أجزاء حزام النقل الحي، ومساعدات التقاط المتصفح، وكتّاب العناصر الأثرية.
- يمتلك Crabbox أجهزة Linux المجهزة مسبقًا عند الحاجة إلى VM بعيد.
- تمتلك GitHub Actions نقطة دخول سير العمل البعيد والاحتفاظ بالعناصر الأثرية.
- يمتلك ClawSweeper توجيه تعليقات GitHub: تحليل أوامر المشرفين، وتشغيل سير العمل، ونشر تعليق PR النهائي.
- تقود وكلاء OpenClaw تشغيل Mantis عبر Codex عندما يحتاج السيناريو إلى إعداد وكيل، أو تصحيح أخطاء، أو الإبلاغ عن حالة عالقة.

يبقي هذا الحد معرفة النقل في OpenClaw، وجدولة الأجهزة في Crabbox، وغراء سير عمل المشرفين في ClawSweeper.

## شكل الأمر

يتحقق الأمر المحلي الأول من بوت Discord، والنقابة، والقناة، وإرسال الرسائل، وإرسال التفاعل، ومسار العنصر الأثري:

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

ينشئ المشغّل worktrees منفصلة للأساس والمرشح تحت دليل الإخراج، ويثبت الاعتماديات، ويبني كل مرجع، ويشغّل السيناريو مع `--allow-failures`، ثم يكتب `baseline/` و`candidate/` و`comparison.json` و`mantis-report.md`. بالنسبة إلى سيناريو Discord الأول، يعني التحقق الناجح أن حالة الأساس هي `fail` وحالة المرشح هي `pass`.

أول بدائية VM/متصفح هي فحص سطح المكتب السريع:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

تستأجر أو تعيد استخدام جهاز سطح مكتب Crabbox، وتبدأ متصفحًا مرئيًا داخل جلسة VNC، وتلتقط سطح المكتب، وتسحب العناصر الأثرية إلى دليل الإخراج المحلي، وتكتب أمر إعادة الاتصال في التقرير. يستخدم الأمر افتراضيًا مزوّد Hetzner لأنه أول مزوّد لديه تغطية سطح مكتب/VNC عاملة في مسار Mantis. تجاوزه باستخدام `--provider` أو `--crabbox-bin` أو `OPENCLAW_MANTIS_CRABBOX_PROVIDER` عند التشغيل ضد أسطول Crabbox آخر.

أعلام فحص سطح المكتب السريع المفيدة:

- `--lease-id <cbx_...>` أو `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` يعيد استخدام سطح مكتب مجهز مسبقًا.
- `--browser-url <url>` يغيّر الصفحة المفتوحة في المتصفح المرئي.
- `--html-file <path>` يعرض عنصرًا أثريًا HTML محليًا من المستودع في المتصفح المرئي. يستخدم Mantis هذا لالتقاط مخطط تفاعلات حالة Discord المولّد عبر سطح مكتب Crabbox حقيقي.
- `--keep-lease` أو `OPENCLAW_MANTIS_KEEP_VM=1` يبقي إيجارًا جديدًا ناجحًا مفتوحًا لفحص VNC. تُبقي عمليات التشغيل الفاشلة الإيجار افتراضيًا عند إنشائه لكي يتمكن المشغّل من إعادة الاتصال.
- تضبط `--class` و`--idle-timeout` و`--ttl` حجم الجهاز ومدة حياة الإيجار.

أول بدائية نقل سطح مكتب كاملة هي فحص سطح مكتب Slack السريع:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

تستأجر أو تعيد استخدام جهاز سطح مكتب Crabbox، وتزامن نسخة العمل الحالية إلى VM، وتشغّل `pnpm openclaw qa slack` داخل ذلك VM، وتفتح Slack Web في متصفح VNC، وتلتقط سطح المكتب المرئي، وتنسخ عناصر Slack QA الأثرية ولقطة شاشة VNC إلى دليل الإخراج المحلي. هذا أول شكل Mantis يكون فيه Gateway OpenClaw للنظام قيد الاختبار والمتصفح كلاهما داخل VM سطح مكتب Linux نفسه.

مع `--gateway-setup`، يجهّز الأمر منزل OpenClaw مؤقتًا دائمًا في `$HOME/.openclaw-mantis/slack-openclaw`، ويرقّع إعدادات Slack Socket Mode للقناة المحددة، ويبدأ `openclaw gateway run` على المنفذ `38973`، ويبقي Chrome قيد التشغيل في جلسة VNC. هذا هو وضع "اترك لي سطح مكتب Linux مع Slack وclaw قيد التشغيل"؛ ويظل مسار Slack QA من بوت إلى بوت هو الافتراضي عند حذف `--gateway-setup`.

المدخلات المطلوبة لـ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` لمسار النموذج البعيد. إذا كان `OPENAI_API_KEY` فقط مضبوطًا محليًا، يربطه Mantis إلى `OPENCLAW_LIVE_OPENAI_KEY` قبل استدعاء Crabbox لكي يتمكن تمرير بيئة `OPENCLAW_*` في Crabbox من حمله إلى VM.

أعلام سطح مكتب Slack المفيدة:

- `--lease-id <cbx_...>` يعيد التشغيل ضد جهاز سجّل فيه مشغّل دخوله بالفعل إلى Slack Web عبر VNC.
- `--gateway-setup` يبدأ Gateway OpenClaw Slack دائمًا في VM بدلًا من تشغيل مسار QA من بوت إلى بوت فقط.
- `--slack-url <url>` يفتح URL محددًا لـ Slack Web. بدونه، يشتق Mantis `https://app.slack.com/client/<team>/<channel>` من Slack `auth.test` عندما يكون رمز بوت النظام قيد الاختبار متاحًا.
- `--slack-channel-id <id>` يتحكم في قائمة السماح بقنوات Slack المستخدمة بواسطة إعداد Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` يتحكم في ملف تعريف Chrome الدائم داخل VM. الافتراضي هو `$HOME/.config/openclaw-mantis/slack-chrome-profile`، لذلك ينجو تسجيل دخول Slack Web اليدوي من عمليات إعادة التشغيل على الإيجار نفسه.
- `--credential-source convex --credential-role ci` يستخدم مجموعة بيانات الاعتماد المشتركة بدلًا من رموز بيئة Slack المباشرة.
- تمرّر `--provider-mode` و`--model` و`--alt-model` و`--fast` إلى مسار Slack الحي.

سير عمل فحص GitHub السريع هو `Mantis Discord Smoke`. سير عمل GitHub قبل وبعد للسيناريو الحقيقي الأول هو `Mantis Discord Status Reactions`. يقبل:

- `baseline_ref`: المرجع المتوقع أن يعيد إنتاج سلوك queued-only.
- `candidate_ref`: المرجع المتوقع أن يعرض `queued -> thinking -> done`.

يفحص مرجع حزام سير العمل، ويبني worktrees منفصلة للأساس والمرشح، ويشغّل `discord-status-reactions-tool-only` ضد كل worktree، ويرفع `baseline/` و`candidate/` و`comparison.json` و`mantis-report.md` كعناصر أثرية في Actions. كما يعرض HTML الخاص بمخطط كل مسار في متصفح سطح مكتب Crabbox وينشر لقطات شاشة VNC هذه بجانب صور PNG الحتمية للمخطط في تعليق PR. يضمّن تعليق PR نفسه معاينات GIF خفيفة مشذبة الحركة مولدة بواسطة `crabbox media preview`، ويربط بمقاطع MP4 المطابقة المشذبة الحركة، ويبقي ملفات MP4 الكاملة لسطح المكتب للفحص العميق. تبقى لقطات الشاشة مضمنة للمراجعة السريعة. يبني سير العمل Crabbox CLI من `openclaw/crabbox` main لكي يتمكن من استخدام أعلام إيجار سطح المكتب/المتصفح الحالية قبل إصدار ثنائي Crabbox التالي.

`Mantis Scenario` هو نقطة الدخول اليدوية العامة. يأخذ `scenario_id` و`candidate_ref` و`baseline_ref` اختياريًا و`pr_number` اختياريًا، ثم يشغّل سير العمل المملوك للسيناريو. الغلاف رفيع عمدًا: لا تزال سير عمل السيناريو تمتلك إعداد النقل، وبيانات الاعتماد، وفئة VM، والحَكَم المتوقع، وبيان العناصر الأثرية.

`Mantis Slack Desktop Smoke` هو أول سير عمل Slack VM. يفحص المرجع المرشح الموثوق في worktree منفصل، ويستأجر سطح مكتب Linux من Crabbox، ويشغّل `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` ضد ذلك المرشح، ويفتح Slack Web في متصفح VNC، ويسجل سطح المكتب، وينشئ معاينة مشذبة الحركة باستخدام `crabbox media preview`، ويرفع دليل العناصر الأثرية الكامل، وينشر اختياريًا تعليق الأدلة المضمن على PR المستهدف. استخدم هذا المسار عندما تريد "سطح مكتب Linux مع Slack وclaw قيد التشغيل" بدلًا من نص Slack من بوت إلى بوت فقط.

يكتب كل سيناريو ينشر إلى PR ملف `mantis-evidence.json` بجانب تقريره. هذا المخطط هو التسليم بين كود السيناريو وتعليقات GitHub:

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

قيم `path` للعناصر الأثرية نسبية إلى دليل البيان. قيم `targetPath` هي مسارات نسبية تحت دليل نشر فرع `qa-artifacts`. يرفض الناشر اجتياز المسارات ويتخطى الإدخالات المعلّمة بـ `"required": false` عندما لا تتوفر المعاينات أو الفيديوهات الاختيارية.

أنواع العناصر الأثرية المدعومة:

- `timeline`: لقطة شاشة حتمية للسيناريو، عادةً قبل/بعد.
- `desktopScreenshot`: لقطة شاشة لسطح مكتب VNC/المتصفح.
- `motionPreview`: GIF متحرك مضمن مولد من تسجيل سطح المكتب.
- `motionClip`: MP4 مشذب الحركة يزيل المقدمة والذيل الثابتين.
- `fullVideo`: تسجيل MP4 كامل للفحص العميق.
- `metadata`: ملف JSON/سجل جانبي.
- `report`: تقرير Markdown.

الناشر القابل لإعادة الاستخدام هو `scripts/mantis/publish-pr-evidence.mjs`. تستدعيه سير العمل مع البيان، وPR المستهدف، وجذر هدف `qa-artifacts`، وعلامة التعليق، وURL عنصر Actions الأثري، وURL التشغيل، ومصدر الطلب. ينسخ العناصر الأثرية المعلنة إلى فرع `qa-artifacts`، ويبني تعليق PR يبدأ بالملخص مع صور/معاينات مضمنة وفيديوهات مرتبطة، ثم يحدّث تعليق العلامة الموجود أو ينشئ واحدًا.

يمكنك أيضًا تشغيل تنفيذ تفاعلات الحالة مباشرةً من تعليق PR:

```text
@Mantis discord status reactions
```

مشغّل التعليقات ضيق عمدًا. يعمل فقط على تعليقات pull request من مستخدمين لديهم صلاحية write أو maintain أو admin، ولا يتعرف إلا على طلبات تفاعلات حالة Discord. يستخدم افتراضيًا مرجع الأساس السيئ المعروف وSHA رأس PR الحالي كمرشح. يمكن للمشرفين تجاوز أي من المرجعين:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

أمثلة أوامر ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

الأمر الأول صريح ومركّز على السيناريو. يمكن أن يطابق الأمر الثاني لاحقًا PR
أو مشكلة مع سيناريوهات Mantis الموصى بها من خلال التسميات والملفات المتغيرة ونتائج
مراجعة ClawSweeper.

## دورة حياة التشغيل

1. الحصول على بيانات الاعتماد.
2. تخصيص VM أو إعادة استخدامها.
3. إعداد ملف تعريف سطح المكتب/المتصفح عندما يحتاج السيناريو إلى دليل من UI.
4. إعداد نسخة نظيفة من المستودع لمرجع خط الأساس.
5. تثبيت التبعيات وبناء ما يحتاجه السيناريو فقط.
6. بدء Gateway فرعي لـ OpenClaw بدليل حالة معزول.
7. تكوين النقل الحي والمزود والنموذج وملف تعريف المتصفح.
8. تشغيل السيناريو والتقاط دليل خط الأساس.
9. إيقاف Gateway والاحتفاظ بالسجلات.
10. إعداد مرجع المرشح في VM نفسها.
11. تشغيل السيناريو نفسه والتقاط دليل المرشح.
12. مقارنة نتائج أوراكل والدليل المرئي.
13. كتابة Markdown وJSON والسجلات ولقطات الشاشة وآثار التتبع الاختيارية.
14. رفع مخرجات GitHub Actions.
15. نشر رسالة حالة موجزة في PR أو Discord.

يجب أن يكون السيناريو قادرًا على الفشل بطريقتين مختلفتين:

- **إعادة إنتاج الخلل**: فشل خط الأساس بالطريقة المتوقعة.
- **فشل الحاضنة**: فشل إعداد البيئة أو بيانات الاعتماد أو Discord API أو المتصفح أو
  المزود قبل أن تصبح أوراكل الخلل ذات معنى.

يجب أن يفصل التقرير النهائي بين هاتين الحالتين حتى لا يخلط المشرفون بين بيئة
متقلبة وسلوك المنتج.

## الحد الأدنى القابل للتطبيق لـ Discord

يجب أن يستهدف السيناريو الأول تفاعلات حالة Discord في قنوات الخادم حيث يكون
وضع تسليم رد المصدر هو `message_tool_only`.

لماذا هو بذرة Mantis جيدة:

- يظهر في Discord كتفاعلات على الرسالة المشغّلة.
- لديه أوراكل REST قوية عبر حالة تفاعل رسالة Discord.
- يمرّن Gateway حقيقيًا لـ OpenClaw، ومصادقة بوت Discord، وإرسال الرسائل،
  ووضع تسليم رد المصدر، وحالة تفاعلات الحالة، ودورة حياة دور النموذج.
- ضيق بما يكفي لإبقاء التنفيذ الأول صادقًا.

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

يجب أن يبيّن دليل خط الأساس تفاعل إقرار الانتظار، لكن بدون انتقال في دورة الحياة
في وضع الأداة فقط. يجب أن يبيّن دليل المرشح تشغيل تفاعلات حالة دورة الحياة عندما يكون
`messages.statusReactions.enabled` مضبوطًا صراحةً على true.

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

يهيئ SUT مع معالجة الخوادم المفعّلة دائمًا، و`visibleReplies:
"message_tool"`، و`ackReaction: "👀"`، وتفاعلات حالة صريحة. تستطلع أوراكل
رسالة Discord الحقيقية المشغّلة وتتوقع التسلسل المرصود
`👀 -> 🤔 -> 👍`. تتضمن المخرجات `discord-qa-reaction-timelines.json`،
و`discord-status-reactions-tool-only-timeline.html`، و
`discord-status-reactions-tool-only-timeline.png`.

## مكونات QA الموجودة

يجب أن يبني Mantis على مكدس QA الخاص الحالي بدلًا من البدء من الصفر:

- يشغّل `pnpm openclaw qa discord` بالفعل مسار Discord حيًا مع بوتات التشغيل وSUT.
- يكتب مشغّل النقل الحي بالفعل التقارير ومخرجات الرسائل المرصودة تحت `.artifacts/qa-e2e/`.
- توفر عقود بيانات اعتماد Convex بالفعل وصولًا حصريًا إلى بيانات اعتماد النقل الحي المشتركة.
- تدعم خدمة التحكم بالمتصفح بالفعل لقطات الشاشة واللقطات وملفات التعريف المُدارة بلا واجهة وملفات تعريف CDP البعيدة.
- لدى QA Lab بالفعل UI تصحيح أخطاء وناقل لاختبارات بشكل النقل.

يمكن أن يكون تنفيذ Mantis الأول مشغّل قبل/بعد رقيقًا فوق هذه المكونات، مع طبقة
دليل مرئي واحدة.

## نموذج الأدلة

يكتب كل تشغيل دليل مخرجات مستقرًا:

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
- النقل ومعرّف السيناريو
- مزود الجهاز ومعرّف الجهاز أو معرّف العقد
- مصدر بيانات الاعتماد بدون قيم سرية
- نتيجة خط الأساس
- نتيجة المرشح
- ما إذا كان الخلل أُعيد إنتاجه على خط الأساس
- ما إذا كان المرشح أصلحه
- مسارات المخرجات
- مشكلات إعداد أو تنظيف منقّحة

لقطات الشاشة أدلة، وليست أسرارًا. لكنها ما زالت تحتاج إلى انضباط التنقيح:
قد تظهر أسماء القنوات الخاصة أو أسماء المستخدمين أو محتوى الرسائل. بالنسبة إلى PRs العامة،
فضّل روابط مخرجات GitHub Actions على الصور المضمّنة إلى أن تصبح قصة التنقيح
أقوى.

## المتصفح وVNC

لمسار المتصفح وضعان:

- **أتمتة بلا واجهة**: الوضع الافتراضي لـ CI. يعمل Chrome مع تمكين CDP، ويلتقط
  Playwright أو تحكم متصفح OpenClaw لقطات الشاشة.
- **إنقاذ VNC**: مفعّل على VM نفسها عندما يحتاج تسجيل الدخول أو MFA أو مكافحة الأتمتة في Discord
  أو التصحيح المرئي إلى إنسان.

يجب أن يكون ملف تعريف متصفح مراقب Discord دائمًا بما يكفي لتجنب تسجيل الدخول
في كل تشغيل، لكنه معزول عن حالة المتصفح الشخصية. ينتمي ملف التعريف إلى مجموعة
أجهزة Mantis، وليس إلى حاسوب مطوّر محمول.

عندما يتعطل Mantis، ينشر رسالة حالة في Discord تحتوي على:

- معرّف التشغيل
- معرّف السيناريو
- مزود الجهاز
- دليل المخرجات
- تعليمات اتصال VNC أو noVNC إذا كانت متاحة
- نص عائق قصير

يمكن للنشر الخاص الأول أن ينشر هذه الرسائل في قناة المشغّل الحالية ثم ينتقل إلى
قناة Mantis مخصصة لاحقًا.

## الأجهزة

يجب أن يفضّل Mantis استخدام AWS عبر Crabbox للتنفيذ البعيد الأول.
يوفر Crabbox أجهزة مُحمّاة مسبقًا، وتتبع العقود، والتهيئة، والسجلات، والنتائج، وعمليات
التنظيف. إذا كانت سعة AWS بطيئة جدًا أو غير متاحة، فأضف مزود Hetzner
خلف واجهة الجهاز نفسها.

متطلبات VM الدنيا:

- Linux مع تثبيت Chrome أو Chromium قادر على سطح المكتب
- وصول CDP لأتمتة المتصفح
- VNC أو noVNC للإنقاذ
- Node 22 وpnpm
- نسخة OpenClaw وتخزين مؤقت للتبعيات
- تخزين مؤقت لمتصفح Playwright Chromium عندما يُستخدم Playwright
- CPU وذاكرة كافيان لـ Gateway واحد من OpenClaw ومتصفح واحد وتشغيل نموذج واحد
- وصول خارجي إلى Discord وGitHub ومزودي النماذج ووسيط بيانات الاعتماد

يجب ألا تحتفظ VM بأسرار خام طويلة العمر خارج مخازن بيانات الاعتماد أو ملفات
تعريف المتصفح المتوقعة.

## الأسرار

توجد الأسرار في أسرار مؤسسة GitHub أو المستودع للتشغيلات البعيدة، وفي ملف أسرار
محلي يتحكم به المشغّل للتشغيلات المحلية.

أسماء الأسرار الموصى بها:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لرفوعات مخرجات GitHub العامة
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

على المدى الطويل، يجب أن يظل مجمع بيانات اعتماد Convex هو المصدر الطبيعي
لبيانات اعتماد النقل الحي. تمهّد أسرار GitHub للوسيط ومسارات الرجوع.
يطابق سير عمل تفاعلات حالة Discord أسرار Mantis Crabbox مع متغيرات البيئة
`CRABBOX_COORDINATOR` و`CRABBOX_COORDINATOR_TOKEN`
التي يتوقعها Crabbox CLI. تظل أسماء أسرار GitHub العادية `CRABBOX_*`
مقبولة كخيار توافق احتياطي.

يجب ألا يطبع مشغّل Mantis أبدًا:

- رموز بوتات Discord
- مفاتيح API للمزودين
- ملفات تعريف ارتباط المتصفح
- محتويات ملف تعريف المصادقة
- كلمات مرور VNC
- حمولات بيانات الاعتماد الخام

يجب أن تنقّح رفوعات المخرجات العامة أيضًا بيانات تعريف هدف Discord مثل معرّفات البوت
والخادم والقناة والرسالة. يفعّل سير عمل الدخان في GitHub
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` لهذا السبب.

إذا لُصق رمز مميز بالخطأ في مشكلة أو PR أو دردشة أو سجل، فدوّره
بعد تخزين السر الجديد.

## مخرجات GitHub وتعليقات PR

يجب أن ترفع سير عمل Mantis حزمة الأدلة الكاملة كمخرج Actions قصير العمر.
عندما يُشغّل سير العمل لتقرير خلل أو PR إصلاح، يجب أيضًا أن ينشر لقطات شاشة PNG
المنقّحة إلى فرع `qa-artifacts` وأن يحدّث أو ينشئ تعليقًا على ذلك الخلل أو PR الإصلاح
مع لقطات شاشة مضمنة قبل/بعد. لا تنشر الدليل الأساسي فقط على PR عام لأتمتة QA.
تبقى السجلات الخام والرسائل المرصودة والأدلة الكبيرة الأخرى في مخرج Actions.

يجب أن تنشر سير العمل الإنتاجية تلك التعليقات باستخدام تطبيق GitHub الخاص بـ Mantis، وليس
باستخدام `github-actions[bot]`. خزّن معرّف التطبيق والمفتاح الخاص كأسرار
GitHub Actions باسمَي `MANTIS_GITHUB_APP_ID` و`MANTIS_GITHUB_APP_PRIVATE_KEY`.
يستخدم سير العمل علامة مخفية كمفتاح تحديث/إنشاء، ويحدّث ذلك
التعليق عندما يستطيع الرمز المميز تحريره، وينشئ تعليقًا جديدًا مملوكًا لـ Mantis عندما
لا يمكن تحرير علامة قديمة مملوكة لبوت.

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

عندما يفشل التشغيل لأن الحاضنة فشلت، يجب أن يقول التعليق ذلك بدلًا من الإيحاء
بأن المرشح فشل.

## ملاحظات النشر الخاص

قد يكون لدى نشر خاص بالفعل تطبيق Mantis على Discord. أعد استخدام ذلك
التطبيق بدلًا من إنشاء تطبيق آخر عندما تكون لديه أذونات البوت المناسبة ويمكن تدويره بأمان.

اضبط قناة إشعار المشغّل الأولية عبر الأسرار أو تكوين النشر. يمكن أن تشير إلى قناة
مشرفين أو عمليات موجودة أولًا، ثم تنتقل إلى قناة Mantis مخصصة بمجرد وجودها.

لا تضع معرّفات الخوادم أو معرّفات القنوات أو رموز البوتات أو ملفات تعريف ارتباط المتصفح أو كلمات مرور VNC
في هذا المستند. خزّنها في أسرار GitHub أو وسيط بيانات الاعتماد أو مخزن الأسرار المحلي
الخاص بالمشغّل.

## إضافة سيناريو

يجب أن يصرّح سيناريو Mantis بما يلي:

- المعرّف والعنوان
- النقل
- بيانات الاعتماد المطلوبة
- سياسة مرجع خط الأساس
- سياسة مرجع المرشح
- تصحيح تكوين OpenClaw
- خطوات الإعداد
- المحفّز
- أوراكل خط الأساس المتوقعة
- أوراكل المرشح المتوقعة
- أهداف الالتقاط المرئي
- ميزانية المهلة
- خطوات التنظيف

يجب أن تفضّل السيناريوهات أوراكل صغيرة ومكتوبة الأنواع:

- حالة تفاعل Discord لأخطاء التفاعلات
- مراجع رسائل Discord لأخطاء الترابط
- معرّف thread ts في Slack وحالة API التفاعل لأخطاء Slack
- معرّفات الرسائل وترويساتها لأخطاء البريد الإلكتروني
- لقطات شاشة المتصفح عندما تكون UI هي الشيء الوحيد الموثوق الذي يمكن رصده

يجب أن تكون فحوصات الرؤية إضافية. إذا كان يمكن لـ API منصة إثبات الخلل، فاستخدم
API كأوراكل نجاح/فشل واحتفظ بلقطات الشاشة لثقة الإنسان.

## توسيع المزودين

بعد Discord، يمكن للمشغّل نفسه إضافة:

- Slack: التفاعلات، السلاسل، إشارات التطبيق، النوافذ المشروطة، تحميلات الملفات.
- Email: مصادقة Gmail وتسلسل الرسائل باستخدام `gog` عندما لا تكون الموصلات
  كافية.
- WhatsApp: تسجيل الدخول عبر QR، إعادة التعريف، تسليم الرسائل، الوسائط، التفاعلات.
- Telegram: ضبط إشارات المجموعات، الأوامر، التفاعلات حيثما كانت متاحة.
- Matrix: الغرف المشفرة، علاقات السلاسل أو الردود، استئناف العمل بعد إعادة التشغيل.

يجب أن يتضمن كل نقل سيناريو دخان منخفض التكلفة وسيناريو واحدا أو أكثر من
سيناريوهات فئات الأخطاء. يجب أن تبقى السيناريوهات المرئية المكلفة اختيارية.

## أسئلة مفتوحة

- أي روبوت Discord يجب أن يكون المشغّل، وأيهما يجب أن يكون SUT، عند إعادة
  استخدام روبوت Mantis الحالي؟
- هل يجب أن يستخدم تسجيل دخول متصفح المراقب حساب Discord بشريا، أو حساب اختبار،
  أو أدلة REST القابلة للقراءة بواسطة الروبوت فقط في المرحلة الأولى؟
- إلى متى يجب أن يحتفظ GitHub بآثار Mantis الخاصة بـ PRs؟
- متى يجب أن يوصي ClawSweeper تلقائيا بـ Mantis بدلا من انتظار أمر من
  المشرف؟
- هل يجب تنقيح لقطات الشاشة أو قصها قبل تحميلها لـ PRs العامة؟
