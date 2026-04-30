---
read_when:
    - الإجابة عن أسئلة الدعم الشائعة المتعلقة بالإعداد أو التثبيت أو التهيئة الأولية أو وقت التشغيل
    - فرز المشكلات التي أبلغ عنها المستخدمون قبل التعمّق في تصحيح الأخطاء
summary: الأسئلة الشائعة حول إعداد OpenClaw وتكوينه واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-04-30T08:04:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c09be6571e048b71e4e02288b22b51e70102872675dfc7bef133b955a06f6ac9
    source_path: help/faq.md
    workflow: 16
---

Quick answers plus deeper troubleshooting for real-world setups (local dev, VPS, multi-agent, OAuth/API keys, model failover). For runtime diagnostics, see [Troubleshooting](/ar/gateway/troubleshooting). For the full config reference, see [Configuration](/ar/gateway/configuration).

## First 60 seconds if something is broken

1. **Quick status (first check)**

   ```bash
   openclaw status
   ```

   Fast local summary: OS + update, gateway/service reachability, agents/sessions, provider config + runtime issues (when gateway is reachable).

2. **Pasteable report (safe to share)**

   ```bash
   openclaw status --all
   ```

   Read-only diagnosis with log tail (tokens redacted).

3. **Daemon + port state**

   ```bash
   openclaw gateway status
   ```

   Shows supervisor runtime vs RPC reachability, the probe target URL, and which config the service likely used.

4. **Deep probes**

   ```bash
   openclaw status --deep
   ```

   Runs a live gateway health probe, including channel probes when supported
   (requires a reachable gateway). See [Health](/ar/gateway/health).

5. **Tail the latest log**

   ```bash
   openclaw logs --follow
   ```

   If RPC is down, fall back to:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   File logs are separate from service logs; see [Logging](/ar/logging) and [Troubleshooting](/ar/gateway/troubleshooting).

6. **Run the doctor (repairs)**

   ```bash
   openclaw doctor
   ```

   Repairs/migrates config/state + runs health checks. See [Doctor](/ar/gateway/doctor).

7. **Gateway snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Asks the running gateway for a full snapshot (WS-only). See [Health](/ar/gateway/health).

## Quick start and first-run setup

First-run Q&A — install, onboard, auth routes, subscriptions, initial failures —
lives on the [First-run FAQ](/ar/help/faq-first-run).

## What is OpenClaw?

<AccordionGroup>
  <Accordion title="What is OpenClaw, in one paragraph?">
    OpenClaw is a personal AI assistant you run on your own devices. It replies on the messaging surfaces you already use (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, and bundled channel plugins such as QQ Bot) and can also do voice + a live Canvas on supported platforms. The **Gateway** is the always-on control plane; the assistant is the product.
  </Accordion>

  <Accordion title="Value proposition">
    OpenClaw is not "just a Claude wrapper." It's a **local-first control plane** that lets you run a
    capable assistant on **your own hardware**, reachable from the chat apps you already use, with
    stateful sessions, memory, and tools - without handing control of your workflows to a hosted
    SaaS.

    Highlights:

    - **Your devices, your data:** run the Gateway wherever you want (Mac, Linux, VPS) and keep the
      workspace + session history local.
    - **Real channels, not a web sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus mobile voice and Canvas on supported platforms.
    - **Model-agnostic:** use Anthropic, OpenAI, MiniMax, OpenRouter, etc., with per-agent routing
      and failover.
    - **Local-only option:** run local models so **all data can stay on your device** if you want.
    - **Multi-agent routing:** separate agents per channel, account, or task, each with its own
      workspace and defaults.
    - **Open source and hackable:** inspect, extend, and self-host without vendor lock-in.

    Docs: [Gateway](/ar/gateway), [Channels](/ar/channels), [Multi-agent](/ar/concepts/multi-agent),
    [Memory](/ar/concepts/memory).

  </Accordion>

  <Accordion title="I just set it up - what should I do first?">
    Good first projects:

    - Build a website (WordPress, Shopify, or a simple static site).
    - Prototype a mobile app (outline, screens, API plan).
    - Organize files and folders (cleanup, naming, tagging).
    - Connect Gmail and automate summaries or follow ups.

    It can handle large tasks, but it works best when you split them into phases and
    use sub agents for parallel work.

  </Accordion>

  <Accordion title="What are the top five everyday use cases for OpenClaw?">
    Everyday wins usually look like:

    - **Personal briefings:** summaries of inbox, calendar, and news you care about.
    - **Research and drafting:** quick research, summaries, and first drafts for emails or docs.
    - **Reminders and follow ups:** cron or heartbeat driven nudges and checklists.
    - **Browser automation:** filling forms, collecting data, and repeating web tasks.
    - **Cross device coordination:** send a task from your phone, let the Gateway run it on a server, and get the result back in chat.

  </Accordion>

  <Accordion title="هل يمكن أن يساعد OpenClaw في توليد العملاء المحتملين، والتواصل، والإعلانات، والمدونات لخدمة SaaS؟">
    نعم، في **البحث، والتأهيل، والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات للتواصل أو نصوص إعلانية.

    بالنسبة إلى **حملات التواصل أو تشغيل الإعلانات**، أبقِ الإنسان ضمن الحلقة. تجنب الرسائل المزعجة، واتبع القوانين المحلية
    وسياسات المنصات، وراجع أي شيء قبل إرساله. النمط الأكثر أمانا هو أن تدع
    OpenClaw يصيغ المسودة وأن توافق أنت عليها.

    الوثائق: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما المزايا مقارنة بـ Claude Code لتطوير الويب؟">
    OpenClaw هو **مساعد شخصي** وطبقة تنسيق، وليس بديلا عن IDE. استخدم
    Claude Code أو Codex للحصول على أسرع حلقة برمجة مباشرة داخل مستودع. استخدم OpenClaw عندما
    تريد ذاكرة دائمة، ووصولا عبر الأجهزة، وتنسيقا للأدوات.

    المزايا:

    - **ذاكرة دائمة + مساحة عمل** عبر الجلسات
    - **وصول متعدد المنصات** (WhatsApp، Telegram، TUI، WebChat)
    - **تنسيق الأدوات** (المتصفح، الملفات، الجدولة، الخطافات)
    - **Gateway دائم التشغيل** (شغله على VPS، وتفاعل من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/التنفيذ المحلي

    معرض الأمثلة: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="كيف أخصص Skills دون إبقاء المستودع متسخا؟">
    استخدم التجاوزات المُدارة بدلا من تعديل نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). ترتيب الأولوية هو `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمنة → `skills.load.extraDirs`، لذا تظل التجاوزات المُدارة متقدمة على Skills المضمنة دون لمس git. إذا كنت بحاجة إلى تثبيت Skill عالميا مع جعلها مرئية لبعض الوكلاء فقط، فأبقِ النسخة المشتركة في `~/.openclaw/skills` وتحكم في الرؤية باستخدام `agents.defaults.skills` و`agents.list[].skills`. يجب أن تبقى التعديلات الجديرة بالرفع إلى المنبع فقط في المستودع وأن تُرسل كطلبات PR.
  </Accordion>

  <Accordion title="هل يمكنني تحميل Skills من مجلد مخصص؟">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (بأدنى أولوية). ترتيب الأولوية الافتراضي هو `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمنة → `skills.load.extraDirs`. يثبت `clawhub` في `./skills` افتراضيا، ويعاملها OpenClaw كـ `<workspace>/skills` في الجلسة التالية. إذا كان يجب أن تكون Skill مرئية لوكلاء معينين فقط، فاقرن ذلك مع `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="كيف يمكنني استخدام نماذج مختلفة لمهام مختلفة؟">
    الأنماط المدعومة حاليا هي:

    - **مهام Cron**: يمكن للمهام المعزولة تعيين تجاوز `model` لكل مهمة.
    - **الوكلاء الفرعيون**: وجّه المهام إلى وكلاء منفصلين بنماذج افتراضية مختلفة.
    - **التبديل عند الطلب**: استخدم `/model` لتبديل نموذج الجلسة الحالية في أي وقت.

    راجع [مهام Cron](/ar/automation/cron-jobs)، و[توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)، و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="يتجمد الروبوت أثناء العمل الثقيل. كيف أفرغ هذا العمل؟">
    استخدم **الوكلاء الفرعيين** للمهام الطويلة أو المتوازية. يعمل الوكلاء الفرعيون في جلساتهم الخاصة،
    ويعيدون ملخصا، ويبقون محادثتك الرئيسية مستجيبة.

    اطلب من روبوتك "spawn a sub-agent for this task" أو استخدم `/subagents`.
    استخدم `/status` في الدردشة لمعرفة ما يفعله Gateway الآن (وما إذا كان مشغولا).

    نصيحة للرموز: تستهلك المهام الطويلة والوكلاء الفرعيون الرموز. إذا كانت التكلفة مصدر قلق، فعيّن
    نموذجا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [مهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="كيف تعمل جلسات الوكلاء الفرعيين المرتبطة بسلاسل المحادثة على Discord؟">
    استخدم روابط سلاسل المحادثة. يمكنك ربط سلسلة محادثة في Discord بوكيل فرعي أو هدف جلسة حتى تبقى رسائل المتابعة في تلك السلسلة على الجلسة المرتبطة نفسها.

    التدفق الأساسي:

    - أنشئ باستخدام `sessions_spawn` مع `thread: true` (واختياريا `mode: "session"` للمتابعة الدائمة).
    - أو اربط يدويا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الربط.
    - استخدم `/session idle <duration|off>` و`/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل سلسلة المحادثة.

    الإعداد المطلوب:

    - الإعدادات الافتراضية العامة: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - الربط التلقائي عند الإنشاء: عيّن `channels.discord.threadBindings.spawnSubagentSessions: true`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع التهيئة](/ar/gateway/configuration-reference)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="اكتمل وكيل فرعي، لكن تحديث الاكتمال ذهب إلى المكان الخطأ أو لم يُنشر قط. ما الذي ينبغي أن أتحقق منه؟">
    تحقق أولا من مسار الطالب المحلول:

    - يفضل تسليم الوكيل الفرعي في وضع الاكتمال أي سلسلة مرتبطة أو مسار محادثة عندما يكون أحدها موجودا.
    - إذا كان أصل الاكتمال يحمل قناة فقط، يعود OpenClaw إلى المسار المخزن لجلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) حتى يظل التسليم المباشر قادرا على النجاح.
    - إذا لم يوجد مسار مرتبط ولا مسار مخزن صالح للاستخدام، فقد يفشل التسليم المباشر وتعود النتيجة بدلا من ذلك إلى تسليم الجلسة في قائمة الانتظار بدلا من النشر الفوري في الدردشة.
    - قد تظل الأهداف غير الصالحة أو القديمة تفرض الرجوع إلى قائمة الانتظار أو فشل التسليم النهائي.
    - إذا كان آخر رد مرئي من المساعد الابن هو رمز الصمت الدقيق `NO_REPLY` / `no_reply`، أو بالضبط `ANNOUNCE_SKIP`، فإن OpenClaw يكتم الإعلان عمدا بدلا من نشر تقدم سابق قديم.
    - إذا انتهت مهلة الابن بعد استدعاءات أدوات فقط، فيمكن أن يختزل الإعلان ذلك إلى ملخص قصير للتقدم الجزئي بدلا من إعادة عرض مخرجات الأدوات الخام.

    تصحيح الأخطاء:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [مهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="لا يعمل Cron أو التذكيرات. ما الذي ينبغي أن أتحقق منه؟">
    يعمل Cron داخل عملية Gateway. إذا لم يكن Gateway يعمل باستمرار،
    فلن تعمل المهام المجدولة.

    قائمة التحقق:

    - تأكد من تفعيل cron (`cron.enabled`) وأن `OPENCLAW_SKIP_CRON` غير معين.
    - تحقق من أن Gateway يعمل على مدار الساعة طوال الأسبوع (دون سكون/إعادات تشغيل).
    - تحقق من إعدادات المنطقة الزمنية للمهمة (`--tz` مقابل المنطقة الزمنية للمضيف).

    تصحيح الأخطاء:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="تم تشغيل Cron، لكن لم يُرسل أي شيء إلى القناة. لماذا؟">
    تحقق من وضع التسليم أولاً:

    - `--no-deliver` / `delivery.mode: "none"` يعني أنه لا يُتوقع إرسال احتياطي من المُشغِّل.
    - هدف الإعلان المفقود أو غير الصالح (`channel` / `to`) يعني أن المُشغِّل تخطى التسليم الصادر.
    - إخفاقات مصادقة القناة (`unauthorized`, `Forbidden`) تعني أن المُشغِّل حاول التسليم لكن بيانات الاعتماد منعته.
    - تُعامل النتيجة المعزولة الصامتة (`NO_REPLY` / `no_reply` فقط) على أنها غير قابلة للتسليم عمداً، لذلك يمنع المُشغِّل أيضاً التسليم الاحتياطي في قائمة الانتظار.

    بالنسبة لمهام cron المعزولة، لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message`
    عندما يكون مسار دردشة متاحاً. يتحكم `--announce` فقط في مسار المُشغِّل
    الاحتياطي للنص النهائي الذي لم يرسله الوكيل بالفعل.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="لماذا بدّل تشغيل cron معزول النماذج أو أعاد المحاولة مرة واحدة؟">
    يكون ذلك عادةً مسار تبديل النموذج الحي، وليس جدولة مكررة.

    يمكن لـ cron المعزول حفظ تسليم نموذج وقت التشغيل وإعادة المحاولة عندما يرمي التشغيل
    النشط `LiveSessionModelSwitchError`. تحافظ إعادة المحاولة على المزوّد/النموذج
    الذي تم التبديل إليه، وإذا حمل التبديل تجاوزاً جديداً لملف مصادقة، فإن cron
    يحفظ ذلك أيضاً قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يتقدم تجاوز نموذج خطاف Gmail أولاً عندما يكون منطبقاً.
    - ثم `model` لكل مهمة.
    - ثم أي تجاوز نموذج مخزن لجلسة cron.
    - ثم اختيار النموذج العادي للوكيل/الافتراضي.

    حلقة إعادة المحاولة محدودة. بعد المحاولة الأولية بالإضافة إلى محاولتَي تبديل،
    يُنهي cron العملية بدلاً من الدوران إلى الأبد.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [cron CLI](/ar/cli/cron).

  </Accordion>

  <Accordion title="كيف أثبّت Skills على Linux؟">
    استخدم أوامر `openclaw skills` الأصلية أو ضع Skills في مساحة عملك. واجهة Skills في macOS غير متاحة على Linux.
    تصفح Skills على [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    يكتب `openclaw skills install` الأصلي في دليل `skills/`
    لمساحة العمل النشطة. ثبّت `clawhub` CLI المنفصل فقط إذا أردت نشر
    Skills الخاصة بك أو مزامنتها. للتثبيتات المشتركة بين الوكلاء، ضع Skill تحت
    `~/.openclaw/skills` واستخدم `agents.defaults.skills` أو
    `agents.list[].skills` إذا أردت تضييق نطاق الوكلاء الذين يمكنهم رؤيتها.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw تشغيل المهام وفق جدول أو باستمرار في الخلفية؟">
    نعم. استخدم مجدول Gateway:

    - **مهام Cron** للمهام المجدولة أو المتكررة (تستمر بعد إعادة التشغيل).
    - **Heartbeat** للفحوصات الدورية في "الجلسة الرئيسية".
    - **المهام المعزولة** للوكلاء المستقلين الذين ينشرون ملخصات أو يسلّمون إلى الدردشات.

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills الخاصة بـ Apple macOS فقط من Linux؟">
    ليس مباشرة. تخضع Skills الخاصة بـ macOS للبوابة عبر `metadata.openclaw.os` بالإضافة إلى الثنائيات المطلوبة، ولا تظهر Skills في مطالبة النظام إلا عندما تكون مؤهلة على **مضيف Gateway**. على Linux، لن تُحمّل Skills الخاصة بـ `darwin` فقط (مثل `apple-notes`، و`apple-reminders`، و`things-mac`) ما لم تتجاوز البوابة.

    لديك ثلاثة أنماط مدعومة:

    **الخيار أ - شغّل Gateway على Mac (الأبسط).**
    شغّل Gateway حيث توجد ثنائيات macOS، ثم اتصل من Linux في [الوضع البعيد](#gateway-ports-already-running-and-remote-mode) أو عبر Tailscale. تُحمّل Skills بشكل طبيعي لأن مضيف Gateway هو macOS.

    **الخيار ب - استخدم عقدة macOS (بدون SSH).**
    شغّل Gateway على Linux، واقرن عقدة macOS (تطبيق شريط القوائم)، واضبط **أوامر تشغيل Node** على "السؤال دائماً" أو "السماح دائماً" على Mac. يمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما توجد الثنائيات المطلوبة على العقدة. يشغّل الوكيل تلك Skills عبر أداة `nodes`. إذا اخترت "السؤال دائماً"، فإن الموافقة على "السماح دائماً" في المطالبة تضيف ذلك الأمر إلى قائمة السماح.

    **الخيار ج - تمرير ثنائيات macOS عبر SSH (متقدم).**
    أبقِ Gateway على Linux، لكن اجعل ثنائيات CLI المطلوبة تُحل إلى مغلفات SSH تعمل على Mac. ثم تجاوز Skill للسماح بـ Linux كي تبقى مؤهلة.

    1. أنشئ مغلف SSH للثنائي (مثال: `memo` لـ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ضع المغلف على `PATH` في مضيف Linux (مثلاً `~/bin/memo`).
    3. تجاوز بيانات Skill الوصفية (مساحة العمل أو `~/.openclaw/skills`) للسماح بـ Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. ابدأ جلسة جديدة كي تُحدّث لقطة Skills.

  </Accordion>

  <Accordion title="هل لديكم تكامل مع Notion أو HeyGen؟">
    ليس مدمجاً اليوم.

    الخيارات:

    - **Skill / Plugin مخصص:** الأفضل للوصول الموثوق إلى API (كل من Notion/HeyGen لديهما APIs).
    - **أتمتة المتصفح:** تعمل بلا كود لكنها أبطأ وأكثر هشاشة.

    إذا أردت الاحتفاظ بالسياق لكل عميل (سير عمل الوكالات)، فالنمط البسيط هو:

    - صفحة Notion واحدة لكل عميل (السياق + التفضيلات + العمل النشط).
    - اطلب من الوكيل جلب تلك الصفحة في بداية الجلسة.

    إذا أردت تكاملاً أصلياً، افتح طلب ميزة أو ابنِ Skill
    تستهدف تلك APIs.

    تثبيت Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تصل التثبيتات الأصلية إلى دليل `skills/` في مساحة العمل النشطة. بالنسبة إلى Skills المشتركة بين الوكلاء، ضعها في `~/.openclaw/skills/<name>/SKILL.md`. إذا كان ينبغي لبعض الوكلاء فقط رؤية تثبيت مشترك، فاضبط `agents.defaults.skills` أو `agents.list[].skills`. تتوقع بعض Skills ثنائيات مثبتة عبر Homebrew؛ على Linux يعني ذلك Linuxbrew (انظر إدخال الأسئلة الشائعة لـ Homebrew على Linux أعلاه). راجع [Skills](/ar/tools/skills)، و[إعدادات Skills](/ar/tools/skills-config)، و[ClawHub](/ar/tools/clawhub).

  </Accordion>

  <Accordion title="كيف أستخدم Chrome الحالي الذي سجلت الدخول إليه مع OpenClaw؟">
    استخدم ملف تعريف المتصفح المدمج `user`، الذي يتصل عبر Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    إذا أردت اسماً مخصصاً، فأنشئ ملف تعريف MCP صريحاً:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    يمكن لهذا المسار استخدام متصفح المضيف المحلي أو عقدة متصفح متصلة. إذا كان Gateway يعمل في مكان آخر، فشغّل إما مضيف عقدة على جهاز المتصفح أو استخدم CDP البعيد بدلاً من ذلك.

    القيود الحالية على `existing-session` / `user`:

    - الإجراءات مدفوعة بـ ref، وليست مدفوعة بمحددات CSS
    - تتطلب عمليات الرفع `ref` / `inputRef` وتدعم حالياً ملفاً واحداً في كل مرة
    - لا يزال `responsebody`، وتصدير PDF، واعتراض التنزيلات، والإجراءات الدُفعية تحتاج إلى متصفح مُدار أو ملف تعريف CDP خام

  </Accordion>
</AccordionGroup>

## العزل وذاكرة التخزين

<AccordionGroup>
  <Accordion title="هل توجد وثيقة مخصصة للعزل؟">
    نعم. راجع [العزل](/ar/gateway/sandboxing). للإعداد الخاص بـ Docker (Gateway كامل في Docker أو صور العزل)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدوداً - كيف أفعّل الميزات الكاملة؟">
    الصورة الافتراضية تعطي الأولوية للأمان وتعمل كمستخدم `node`، لذلك لا
    تتضمن حزم النظام، أو Homebrew، أو المتصفحات المضمّنة. لإعداد أكمل:

    - احتفظ بـ `/home/node` عبر `OPENCLAW_HOME_VOLUME` حتى تبقى الذاكرات المخبأة.
    - اخبز تبعيات النظام في الصورة عبر `OPENCLAW_DOCKER_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المضمّن:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - اضبط `PLAYWRIGHT_BROWSERS_PATH` وتأكد من أن المسار محفوظ.

    المستندات: [Docker](/ar/install/docker)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل المباشرة شخصية مع جعل المجموعات عامة/معزولة باستخدام وكيل واحد؟">
    نعم - إذا كانت حركة المرور الخاصة بك هي **رسائل مباشرة** وكانت حركة المرور العامة هي **مجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` كي تعمل جلسات المجموعات/القنوات (المفاتيح غير الرئيسية) في خلفية العزل المضبوطة، بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال إعدادات: [المجموعات: رسائل مباشرة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع الإعدادات الرئيسي: [إعدادات Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلد مضيف داخل العزل؟">
    اضبط `agents.defaults.sandbox.docker.binds` على `["host:path:mode"]` (مثل `"/home/user/src:/src:ro"`). تُدمج الارتباطات العامة وارتباطات كل وكيل؛ ويتم تجاهل ارتباطات كل وكيل عندما تكون `scope: "shared"`. استخدم `:ro` لأي شيء حساس وتذكّر أن الارتباطات تتجاوز جدران نظام ملفات العزل.

    يتحقق OpenClaw من مصادر الارتباط مقابل كل من المسار المطبّع والمسار القانوني المحلول عبر أعمق سلف موجود. يعني ذلك أن عمليات الخروج عبر آباء الروابط الرمزية لا تزال تفشل بإغلاق حتى عندما لا يكون مقطع المسار الأخير موجوداً بعد، وأن فحوصات الجذر المسموح بها لا تزال تنطبق بعد حل الروابط الرمزية.

    راجع [العزل](/ar/gateway/sandboxing#custom-bind-mounts) و[العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للحصول على أمثلة وملاحظات سلامة.

  </Accordion>

  <Accordion title="كيف تعمل ذاكرة التخزين؟">
    ذاكرة OpenClaw هي مجرد ملفات Markdown في مساحة عمل الوكيل:

    - ملاحظات يومية في `memory/YYYY-MM-DD.md`
    - ملاحظات طويلة الأمد مُنسقة في `MEMORY.md` (الجلسات الرئيسية/الخاصة فقط)

    يشغّل OpenClaw أيضاً **تفريغ ذاكرة صامتاً قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction التلقائي. لا يعمل هذا إلا عندما تكون مساحة العمل
    قابلة للكتابة (تتخطاه بيئات العزل للقراءة فقط). راجع [ذاكرة التخزين](/ar/concepts/memory).

  </Accordion>

  <Accordion title="ذاكرة التخزين تستمر في نسيان الأشياء. كيف أجعلها تثبت؟">
    اطلب من الروبوت **كتابة المعلومة إلى ذاكرة التخزين**. الملاحظات طويلة الأمد مكانها في `MEMORY.md`،
    والسياق قصير الأمد يذهب إلى `memory/YYYY-MM-DD.md`.

    لا يزال هذا مجالاً نعمل على تحسينه. من المفيد تذكير النموذج بتخزين الذكريات؛
    سيعرف ما ينبغي فعله. إذا استمر في النسيان، فتحقق من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل.

    المستندات: [ذاكرة التخزين](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تستمر ذاكرة التخزين إلى الأبد؟ ما الحدود؟">
    تعيش ملفات ذاكرة التخزين على القرص وتستمر حتى تحذفها. الحد هو مساحة
    التخزين لديك، وليس النموذج. لا يزال **سياق الجلسة** محدوداً بنافذة سياق
    النموذج، لذلك يمكن للمحادثات الطويلة أن تخضع لـ Compaction أو الاقتطاع. لهذا السبب
    يوجد بحث ذاكرة التخزين - فهو يعيد الأجزاء ذات الصلة فقط إلى السياق.

    المستندات: [ذاكرة التخزين](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب البحث الدلالي في الذاكرة مفتاح OpenAI API؟">
    فقط إذا كنت تستخدم **تضمينات OpenAI**. يغطي Codex OAuth الدردشة/الإكمالات و
    **لا** يمنح الوصول إلى التضمينات، لذلك **تسجيل الدخول باستخدام Codex (OAuth أو
    تسجيل دخول Codex CLI)** لا يساعد في البحث الدلالي في الذاكرة. ما زالت تضمينات OpenAI
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تضبط مزودًا صراحةً، يختار OpenClaw مزودًا تلقائيًا عندما
    يستطيع حل مفتاح API (ملفات تعريف المصادقة، أو `models.providers.*.apiKey`، أو متغيرات البيئة).
    يفضل OpenAI إذا أمكن حل مفتاح OpenAI، وإلا Gemini إذا أمكن حل مفتاح Gemini،
    ثم Voyage، ثم Mistral. إذا لم يتوفر مفتاح بعيد، يبقى بحث الذاكرة
    معطلًا حتى تهيئه. إذا كان لديك مسار نموذج محلي
    مهيأ وموجود، يفضل OpenClaw
    `local`. Ollama مدعوم عند ضبط
    `memorySearch.provider = "ollama"` صراحةً.

    إذا كنت تفضل البقاء محليًا، فاضبط `memorySearch.provider = "local"` (واختياريًا
    `memorySearch.fallback = "none"`). إذا كنت تريد تضمينات Gemini، فاضبط
    `memorySearch.provider = "gemini"` ووفّر `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). ندعم نماذج التضمين **OpenAI أو Gemini أو Voyage أو Mistral أو Ollama أو المحلية**
    - راجع [الذاكرة](/ar/concepts/memory) لتفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## أماكن وجود الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل تُحفظ كل البيانات المستخدمة مع OpenClaw محليًا؟">
    لا - **حالة OpenClaw محلية**، لكن **الخدمات الخارجية ما زالت ترى ما ترسله إليها**.

    - **محلي افتراضيًا:** تعيش الجلسات وملفات الذاكرة والتكوين ومساحة العمل على مضيف Gateway
      (`~/.openclaw` + دليل مساحة العمل لديك).
    - **بعيد بحكم الضرورة:** الرسائل التي ترسلها إلى مزودي النماذج (Anthropic/OpenAI/إلخ) تذهب إلى
      واجهات API الخاصة بهم، ومنصات الدردشة (WhatsApp/Telegram/Slack/إلخ) تخزن بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في الأثر:** استخدام النماذج المحلية يُبقي المطالبات على جهازك، لكن حركة قنوات
      التواصل ما زالت تمر عبر خوادم القناة.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    كل شيء موجود تحت `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | المسار                                                          | الغرض                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | التكوين الرئيسي (JSON5)                                            |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | استيراد OAuth القديم (يُنسخ إلى ملفات تعريف المصادقة عند أول استخدام) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات تعريف المصادقة (OAuth، مفاتيح API، و`keyRef`/`tokenRef` اختياريان) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | حمولة أسرار اختيارية مدعومة بملف لمزودي SecretRef من نوع `file`     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ملف توافق قديم (تُزال إدخالات `api_key` الثابتة)                  |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | حالة المزود (مثل `whatsapp/<accountId>/creds.json`)                |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | حالة لكل وكيل (agentDir + الجلسات)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | سجل المحادثات والحالة (لكل وكيل)                                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | بيانات الجلسات الوصفية (لكل وكيل)                                  |

    مسار الوكيل الفردي القديم: `~/.openclaw/agent/*` (يُرحّل بواسطة `openclaw doctor`).

    **مساحة العمل** لديك (AGENTS.md، ملفات الذاكرة، Skills، إلخ) منفصلة ومهيأة عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    تعيش هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` اختياري.
      الجذر بالأحرف الصغيرة `memory.md` هو إدخال إصلاح قديم فقط؛ يستطيع `openclaw doctor --fix`
      دمجه في `MEMORY.md` عندما يكون كلا الملفين موجودين.
    - **دليل الحالة (`~/.openclaw`)**: التكوين، حالة القناة/المزود، ملفات تعريف المصادقة، الجلسات، السجلات،
      وSkills المشتركة (`~/.openclaw/skills`).

    مساحة العمل الافتراضية هي `~/.openclaw/workspace`، ويمكن تهيئتها عبر:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    إذا "نسي" البوت بعد إعادة التشغيل، فتأكد من أن Gateway يستخدم
    مساحة العمل نفسها في كل تشغيل (وتذكر: يستخدم الوضع البعيد **مساحة عمل مضيف gateway**،
    وليس حاسوبك المحمول المحلي).

    نصيحة: إذا كنت تريد سلوكًا أو تفضيلًا دائمًا، فاطلب من البوت **كتابته في
    AGENTS.md أو MEMORY.md** بدل الاعتماد على سجل الدردشة.

    راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) و[الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="استراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** في مستودع git **خاص** وانسخها احتياطيًا في مكان
    خاص (على سبيل المثال GitHub خاص). يلتقط ذلك الذاكرة + ملفات AGENTS/SOUL/USER،
    ويتيح لك استعادة "عقل" المساعد لاحقًا.

    **لا** تودع أي شيء تحت `~/.openclaw` (بيانات الاعتماد، الجلسات، الرموز، أو حمولات الأسرار المشفرة).
    إذا كنت تحتاج إلى استعادة كاملة، فانسخ احتياطيًا كلًا من مساحة العمل ودليل الحالة
    على حدة (راجع سؤال الترحيل أعلاه).

    المستندات: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف أزيل تثبيت OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إزالة التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. مساحة العمل هي **cwd الافتراضي** ومرساة الذاكرة، وليست صندوقًا رمليًا صارمًا.
    تُحل المسارات النسبية داخل مساحة العمل، لكن المسارات المطلقة يمكنها الوصول إلى مواقع أخرى
    على المضيف ما لم تكن العزل الرملي مفعّلًا. إذا كنت تحتاج إلى عزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات العزل الرملي لكل وكيل. إذا كنت
    تريد أن يكون مستودع ما هو دليل العمل الافتراضي، فوجه `workspace` الخاصة بذلك الوكيل
    إلى جذر المستودع. مستودع OpenClaw هو مجرد شيفرة مصدرية؛ أبقِ
    مساحة العمل منفصلة إلا إذا كنت تريد عمدًا أن يعمل الوكيل داخلها.

    مثال (المستودع بصفته cwd الافتراضي):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="الوضع البعيد: أين مخزن الجلسات؟">
    حالة الجلسة مملوكة من **مضيف gateway**. إذا كنت في الوضع البعيد، فإن مخزن الجلسات الذي يهمك موجود على الجهاز البعيد، وليس على حاسوبك المحمول المحلي. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>
</AccordionGroup>

## أساسيات التكوين

<AccordionGroup>
  <Accordion title="ما تنسيق التكوين؟ وأين يوجد؟">
    يقرأ OpenClaw تكوين **JSON5** اختياريًا من `$OPENCLAW_CONFIG_PATH` (الافتراضي: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    إذا كان الملف مفقودًا، يستخدم إعدادات افتراضية آمنة نسبيًا (بما في ذلك مساحة عمل افتراضية هي `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='ضبطت gateway.bind: "lan" (أو "tailnet") والآن لا يستمع شيء / تقول الواجهة إن الوصول غير مصرح به'>
    تتطلب الروابط غير loopback **مسار مصادقة gateway صالحًا**. عمليًا يعني ذلك:

    - مصادقة السر المشترك: رمز أو كلمة مرور
    - `gateway.auth.mode: "trusted-proxy"` خلف وكيل عكسي واعٍ بالهوية ومهيأ بشكل صحيح

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    ملاحظات:

    - `gateway.remote.token` / `.password` لا يفعّلان مصادقة gateway المحلية بمفردهما.
    - يمكن لمسارات الاتصال المحلية استخدام `gateway.remote.*` كبديل فقط عندما يكون `gateway.auth.*` غير مضبوط.
    - لمصادقة كلمة المرور، اضبط `gateway.auth.mode: "password"` بالإضافة إلى `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`) بدلًا من ذلك.
    - إذا كان `gateway.auth.token` / `gateway.auth.password` مهيأ صراحةً عبر SecretRef ولم يُحل، يفشل الحل بشكل مغلق (دون حجب بفشل احتياطي بعيد).
    - إعدادات Control UI بالسر المشترك تصادق عبر `connect.params.auth.token` أو `connect.params.auth.password` (المخزنة في إعدادات التطبيق/الواجهة). تستخدم الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy` ترويسات الطلب بدلًا من ذلك. تجنب وضع الأسرار المشتركة في عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، تتطلب وكلاء loopback العكسية على المضيف نفسه `gateway.auth.trustedProxy.allowLoopback = true` صراحةً وإدخال loopback في `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="لماذا أحتاج إلى رمز على localhost الآن؟">
    يفرض OpenClaw مصادقة gateway افتراضيًا، بما في ذلك loopback. في المسار الافتراضي العادي، يعني ذلك مصادقة الرمز: إذا لم يكن هناك مسار مصادقة صريح مهيأ، يتحول بدء تشغيل gateway إلى وضع الرمز وينشئ واحدًا تلقائيًا، ويحفظه في `gateway.auth.token`، لذلك **يجب على عملاء WS المحليين المصادقة**. يمنع هذا العمليات المحلية الأخرى من استدعاء Gateway.

    إذا كنت تفضل مسار مصادقة مختلفًا، يمكنك اختيار وضع كلمة المرور صراحةً (أو، للوكلاء العكسيين الواعين بالهوية، `trusted-proxy`). إذا كنت **حقًا** تريد loopback مفتوحًا، فاضبط `gateway.auth.mode: "none"` صراحةً في تكوينك. يمكن لـ Doctor إنشاء رمز لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب أن أعيد التشغيل بعد تغيير التكوين؟">
    يراقب Gateway التكوين ويدعم إعادة التحميل الفورية:

    - `gateway.reload.mode: "hybrid"` (الافتراضي): تطبيق التغييرات الآمنة فورًا، وإعادة التشغيل للتغييرات الحرجة
    - `hot` و`restart` و`off` مدعومة أيضًا

  </Accordion>

  <Accordion title="كيف أعطل عبارات CLI الطريفة؟">
    اضبط `cli.banner.taglineMode` في التكوين:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: يخفي نص العبارة لكنه يبقي سطر عنوان/إصدار اللافتة.
    - `default`: يستخدم `All your chats, one OpenClaw.` في كل مرة.
    - `random`: عبارات طريفة/موسمية متناوبة (السلوك الافتراضي).
    - إذا كنت لا تريد أي لافتة إطلاقًا، فاضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="كيف أفعّل بحث الويب (وجلب الويب)؟">
    يعمل `web_fetch` من دون مفتاح API. يعتمد `web_search` على
    المزود المحدد لديك:

    - يتطلب المزودون المدعومون بواجهة API مثل Brave وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وPerplexity وTavily إعداد مفتاح API العادي لديهم.
    - Ollama Web Search لا يحتاج إلى مفتاح، لكنه يستخدم مضيف Ollama المهيأ لديك ويتطلب `ollama signin`.
    - DuckDuckGo لا يحتاج إلى مفتاح، لكنه تكامل غير رسمي قائم على HTML.
    - SearXNG لا يحتاج إلى مفتاح/ذاتي الاستضافة؛ هيئ `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

    **موصى به:** شغّل `openclaw configure --section web` واختر مزودًا.
    بدائل البيئة:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` أو `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY` أو `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` أو `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    يوجد إعداد بحث الويب الخاص بالمزوّد الآن تحت `plugins.entries.<plugin>.config.webSearch.*`.
    ما تزال مسارات المزوّد القديمة `tools.web.search.*` تُحمَّل مؤقتًا للتوافق، لكن ينبغي عدم استخدامها للإعدادات الجديدة.
    يوجد إعداد بديل جلب الويب Firecrawl تحت `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم السماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - يكون `web_fetch` مفعّلًا افتراضيًا (ما لم يُعطَّل صراحةً).
    - إذا حُذف `tools.web.fetch.provider`، يكتشف OpenClaw تلقائيًا أول مزوّد بديل جاهز للجلب من بيانات الاعتماد المتاحة. المزوّد المضمّن حاليًا هو Firecrawl.
    - تقرأ البرامج الخدمية متغيرات البيئة من `~/.openclaw/.env` (أو من بيئة الخدمة).

    المستندات: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="مسح config.apply إعدادي. كيف أستعيده وأتجنب ذلك؟">
    يستبدل `config.apply` **الإعداد بأكمله**. إذا أرسلت كائنًا جزئيًا، فستُزال
    كل الأجزاء الأخرى.

    يحمي OpenClaw الحالي من كثير من حالات الاستبدال العرضي:

    - تتحقق عمليات كتابة الإعداد المملوكة لـ OpenClaw من الإعداد الكامل بعد التغيير قبل الكتابة.
    - تُرفض عمليات الكتابة غير الصالحة أو المدمرة المملوكة لـ OpenClaw وتُحفظ باسم `openclaw.json.rejected.*`.
    - إذا تسبب تعديل مباشر في تعطل بدء التشغيل أو إعادة التحميل الساخنة، يستعيد Gateway آخر إعداد صالح معروف ويحفظ الملف المرفوض باسم `openclaw.json.clobbered.*`.
    - يتلقى الوكيل الرئيسي تحذير إقلاع بعد الاسترداد حتى لا يكتب الإعداد السيئ مجددًا دون تحقق.

    الاسترداد:

    - تحقق من `openclaw logs --follow` بحثًا عن `Config auto-restored from last-known-good` أو `Config write rejected:` أو `config reload restored last-known-good config`.
    - افحص أحدث `openclaw.json.clobbered.*` أو `openclaw.json.rejected.*` بجانب الإعداد النشط.
    - احتفظ بالإعداد النشط المستعاد إذا كان يعمل، ثم انسخ فقط المفاتيح المقصودة مرة أخرى باستخدام `openclaw config set` أو `config.patch`.
    - شغّل `openclaw config validate` و`openclaw doctor`.
    - إذا لم يكن لديك آخر إعداد صالح معروف أو حمولة مرفوضة، فاستعد من نسخة احتياطية، أو أعد تشغيل `openclaw doctor` وأعد إعداد القنوات/النماذج.
    - إذا كان هذا غير متوقع، فافتح بلاغ عطل وأدرج آخر إعداد معروف لديك أو أي نسخة احتياطية.
    - يستطيع وكيل برمجة محلي غالبًا إعادة بناء إعداد عامل من السجلات أو السجل التاريخي.

    تجنبه:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` للتعديلات التفاعلية.
    - استخدم `config.schema.lookup` أولًا عندما لا تكون متأكدًا من مسار دقيق أو شكل حقل؛ فهو يعيد عقدة مخطط سطحية مع ملخصات الأبناء المباشرة للتنقل التفصيلي.
    - استخدم `config.patch` لتعديلات RPC الجزئية؛ واحتفظ بـ `config.apply` لاستبدال الإعداد الكامل فقط.
    - إذا كنت تستخدم أداة `gateway` المخصصة للمالك فقط من تشغيل وكيل، فستظل ترفض الكتابة إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك الأسماء المستعارة القديمة `tools.bash.*` التي تُطبَّع إلى مسارات التنفيذ المحمية نفسها).

    المستندات: [الإعداد](/ar/cli/config)، [التهيئة](/ar/cli/configure)، [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغّل Gateway مركزيًا مع عمّال متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحد** (مثل Raspberry Pi) مع **العُقد** و**الوكلاء**:

    - **Gateway (مركزي):** يملك القنوات (Signal/WhatsApp)، والتوجيه، والجلسات.
    - **العُقد (الأجهزة):** تتصل أجهزة Macs/iOS/Android كملحقات وتعرض أدوات محلية (`system.run`، `canvas`، `camera`).
    - **الوكلاء (العمّال):** عقول/مساحات عمل منفصلة للأدوار الخاصة (مثل "عمليات Hetzner"، "البيانات الشخصية").
    - **الوكلاء الفرعيون:** ينشئون عملًا في الخلفية من وكيل رئيسي عندما تريد التوازي.
    - **TUI:** اتصل بـ Gateway وبدّل بين الوكلاء/الجلسات.

    المستندات: [العُقد](/ar/nodes)، [الوصول عن بُعد](/ar/gateway/remote)، [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/ar/web/tui).

  </Accordion>

  <Accordion title="هل يستطيع متصفح OpenClaw العمل دون واجهة؟">
    نعم. إنه خيار إعداد:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    القيمة الافتراضية هي `false` (بواجهة مرئية). من المرجح أكثر أن يفعّل وضع التشغيل دون واجهة فحوصات مكافحة الروبوتات في بعض المواقع. راجع [المتصفح](/ar/tools/browser).

    يستخدم وضع التشغيل دون واجهة **محرك Chromium نفسه** ويعمل لمعظم مهام الأتمتة (النماذج، النقرات، الكشط، تسجيلات الدخول). الفروق الرئيسية:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات الشاشة إذا كنت تحتاج إلى عناصر مرئية).
    - بعض المواقع أكثر صرامة تجاه الأتمتة في وضع التشغيل دون واجهة (CAPTCHA، مكافحة الروبوتات).
      على سبيل المثال، غالبًا ما يحظر X/Twitter الجلسات دون واجهة.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    اضبط `browser.executablePath` على ملف Brave الثنائي لديك (أو أي متصفح مبني على Chromium) وأعد تشغيل Gateway.
    راجع أمثلة الإعداد الكاملة في [المتصفح](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## بوابات وعُقد بعيدة

<AccordionGroup>
  <Accordion title="كيف تنتقل الأوامر بين Telegram وGateway والعُقد؟">
    تتعامل **Gateway** مع رسائل Telegram. تشغّل Gateway الوكيل ثم
    تستدعي العُقد فقط عبر **Gateway WebSocket** عندما تكون أداة عقدة مطلوبة:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    لا ترى العُقد حركة مرور المزوّد الواردة؛ فهي تتلقى فقط استدعاءات RPC الخاصة بالعُقد.

  </Accordion>

  <Accordion title="كيف يستطيع وكيلي الوصول إلى حاسوبي إذا كانت Gateway مستضافة عن بُعد؟">
    الإجابة المختصرة: **اقرن حاسوبك كعقدة**. تعمل Gateway في مكان آخر، لكنها تستطيع
    استدعاء أدوات `node.*` (الشاشة، الكاميرا، النظام) على جهازك المحلي عبر Gateway WebSocket.

    الإعداد المعتاد:

    1. شغّل Gateway على المضيف دائم التشغيل (VPS/خادم منزلي).
    2. ضع مضيف Gateway وحاسوبك على tailnet نفسها.
    3. تأكد من أن Gateway WS قابلة للوصول (ربط tailnet أو نفق SSH).
    4. افتح تطبيق macOS محليًا واتصل في وضع **بعيد عبر SSH** (أو tailnet مباشرة)
       حتى يتمكن من التسجيل كعقدة.
    5. وافق على العقدة في Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا يلزم جسر TCP منفصل؛ تتصل العُقد عبر Gateway WebSocket.

    تذكير أمني: يتيح إقران عقدة macOS تشغيل `system.run` على ذلك الجهاز. لا
    تقرن إلا الأجهزة التي تثق بها، وراجع [الأمان](/ar/gateway/security).

    المستندات: [العُقد](/ar/nodes)، [بروتوكول Gateway](/ar/gateway/protocol)، [وضع macOS البعيد](/ar/platforms/mac/remote)، [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل لكنني لا أتلقى ردودًا. ماذا الآن؟">
    تحقق من الأساسيات:

    - Gateway قيد التشغيل: `openclaw gateway status`
    - صحة Gateway: `openclaw status`
    - صحة القناة: `openclaw channels status`

    ثم تحقق من المصادقة والتوجيه:

    - إذا كنت تستخدم Tailscale Serve، فتأكد من ضبط `gateway.auth.allowTailscale` بشكل صحيح.
    - إذا كنت تتصل عبر نفق SSH، فأكد أن النفق المحلي يعمل ويشير إلى المنفذ الصحيح.
    - أكد أن قوائم السماح لديك (رسالة مباشرة أو مجموعة) تتضمن حسابك.

    المستندات: [Tailscale](/ar/gateway/tailscale)، [الوصول عن بُعد](/ar/gateway/remote)، [القنوات](/ar/channels).

  </Accordion>

  <Accordion title="هل يمكن لمثيلي OpenClaw التحدث إلى بعضهما (محلي + VPS)؟">
    نعم. لا يوجد جسر "روبوت إلى روبوت" مضمّن، لكن يمكنك توصيل ذلك ببضع
    طرق موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يستطيع كلا الروبوتين الوصول إليها (Telegram/Slack/WhatsApp).
    اجعل الروبوت A يرسل رسالة إلى الروبوت B، ثم دع الروبوت B يرد كالمعتاد.

    **جسر CLI (عام):** شغّل سكربتًا يستدعي Gateway الأخرى باستخدام
    `openclaw agent --message ... --deliver`، مستهدفًا دردشة يستمع إليها الروبوت الآخر.
    إذا كان أحد الروبوتين على VPS بعيد، فوجّه CLI إلى Gateway البعيدة
    عبر SSH/Tailscale (راجع [الوصول عن بُعد](/ar/gateway/remote)).

    نمط مثال (شغّله من جهاز يستطيع الوصول إلى Gateway الهدف):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف حاجز حماية حتى لا يدخل الروبوتان في حلقة لا تنتهي (بالذكر فقط، أو قوائم سماح
    القنوات، أو قاعدة "لا ترد على رسائل الروبوتات").

    المستندات: [الوصول عن بُعد](/ar/gateway/remote)، [CLI الوكيل](/ar/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى VPSات منفصلة لوكلاء متعددين؟">
    لا. يمكن لـ Gateway واحد استضافة عدة وكلاء، لكل منهم مساحة عمله الخاصة، وافتراضيات النماذج،
    والتوجيه. هذا هو الإعداد الطبيعي وهو أرخص وأبسط بكثير من تشغيل
    VPS واحد لكل وكيل.

    استخدم VPSات منفصلة فقط عندما تحتاج إلى عزل صارم (حدود أمان) أو
    إعدادات مختلفة جدًا لا تريد مشاركتها. بخلاف ذلك، احتفظ بـ Gateway واحد
    واستخدم عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل توجد فائدة من استخدام عقدة على حاسوبي المحمول الشخصي بدلًا من SSH من VPS؟">
    نعم - العُقد هي الطريقة من الدرجة الأولى للوصول إلى حاسوبك المحمول من Gateway بعيدة، وهي
    تفتح أكثر من مجرد وصول إلى الصدفة. تعمل Gateway على macOS/Linux (وWindows عبر WSL2) وهي
    خفيفة الوزن (يكفي VPS صغير أو جهاز بفئة Raspberry Pi؛ ذاكرة 4 GB كافية جدًا)، لذا يكون الإعداد
    الشائع مضيفًا دائم التشغيل مع حاسوبك المحمول كعقدة.

    - **لا يلزم SSH وارد.** تتصل العُقد خارجيًا بـ Gateway WebSocket وتستخدم إقران الأجهزة.
    - **عناصر تحكم تنفيذ أكثر أمانًا.** تخضع `system.run` لقوائم السماح/الموافقات الخاصة بالعقدة على ذلك الحاسوب المحمول.
    - **أدوات أجهزة أكثر.** تعرض العُقد `canvas` و`camera` و`screen` بالإضافة إلى `system.run`.
    - **أتمتة المتصفح المحلي.** أبقِ Gateway على VPS، لكن شغّل Chrome محليًا عبر مضيف عقدة على الحاسوب المحمول، أو اربطه بـ Chrome محلي على المضيف عبر Chrome MCP.

    SSH مناسب للوصول العارض إلى الصدفة، لكن العُقد أبسط لتدفقات عمل الوكلاء المستمرة
    وأتمتة الأجهزة.

    المستندات: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تشغّل العُقد خدمة Gateway؟">
    لا. ينبغي تشغيل **Gateway واحدة** فقط لكل مضيف ما لم تشغّل عمدًا ملفات تعريف معزولة (راجع [بوابات متعددة](/ar/gateway/multiple-gateways)). العُقد هي ملحقات تتصل
    بـ Gateway (عُقد iOS/Android، أو "وضع العقدة" في macOS ضمن تطبيق شريط القوائم). لمضيفي العُقد
    دون واجهة والتحكم عبر CLI، راجع [CLI مضيف العقدة](/ar/cli/node).

    يلزم إعادة تشغيل كاملة لتغييرات `gateway` و`discovery` و`canvasHost`.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق الإعداد؟">
    نعم.

    - `config.schema.lookup`: افحص شجرة إعداد فرعية واحدة مع عقدة مخططها السطحية، وتلميح واجهة المستخدم المطابق، وملخصات الأبناء المباشرة قبل الكتابة
    - `config.get`: اجلب اللقطة الحالية + التجزئة
    - `config.patch`: تحديث جزئي آمن (مفضّل لمعظم تعديلات RPC)؛ يعيد التحميل الساخن عندما يكون ذلك ممكنًا ويعيد التشغيل عندما يكون مطلوبًا
    - `config.apply`: يتحقق من الصحة + يستبدل الإعداد الكامل؛ يعيد التحميل الساخن عندما يكون ذلك ممكنًا ويعيد التشغيل عندما يكون مطلوبًا
    - ما تزال أداة وقت التشغيل `gateway` المخصصة للمالك فقط ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ وتُطبَّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات التنفيذ المحمية نفسها

  </Accordion>

  <Accordion title="إعداد بسيط مناسب للتثبيت الأول">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    يحدد هذا مساحة العمل لديك ويقيد من يمكنه تشغيل البوت.

  </Accordion>

  <Accordion title="كيف أعد Tailscale على VPS وأتصل من جهاز Mac؟">
    الخطوات الدنيا:

    1. **ثبّت + سجّل الدخول على VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ثبّت + سجّل الدخول على جهاز Mac**
       - استخدم تطبيق Tailscale وسجّل الدخول إلى tailnet نفسه.
    3. **فعّل MagicDNS (موصى به)**
       - في وحدة تحكم إدارة Tailscale، فعّل MagicDNS حتى يكون لدى VPS اسم ثابت.
    4. **استخدم اسم مضيف tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا أردت Control UI بدون SSH، فاستخدم Tailscale Serve على VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    يبقي هذا Gateway مربوطا بـ loopback ويكشف HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أوصل Node على Mac بـ Gateway بعيد (Tailscale Serve)؟">
    يكشف Serve عن **Gateway Control UI + WS**. تتصل Nodes عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكد من أن VPS وجهاز Mac على tailnet نفسه**.
    2. **استخدم تطبيق macOS في وضع Remote** (يمكن أن يكون هدف SSH اسم مضيف tailnet).
       سيقوم التطبيق بإنشاء نفق لمنفذ Gateway والاتصال بوصفه Node.
    3. **اعتمد Node** على Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    المستندات: [بروتوكول Gateway](/ar/gateway/protocol)، [الاكتشاف](/ar/gateway/discovery)، [وضع macOS البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل ينبغي أن أثبّت على حاسوب محمول ثان أم أضيف Node فقط؟">
    إذا كنت تحتاج فقط إلى **أدوات محلية** (الشاشة/الكاميرا/التنفيذ) على الحاسوب المحمول الثاني، فأضفه بوصفه
    **Node**. يحافظ ذلك على Gateway واحد ويتجنب تكرار الإعدادات. أدوات Node المحلية
    حاليا متاحة على macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    ثبّت Gateway ثانيا فقط عندما تحتاج إلى **عزل صارم** أو بوتين منفصلين تماما.

    المستندات: [Nodes](/ar/nodes)، [CLI الخاص بـ Nodes](/ar/cli/nodes)، [Gateways متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات البيئة وتحميل .env

<AccordionGroup>
  <Accordion title="كيف يحمل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات البيئة من العملية الأب (shell أو launchd/systemd أو CI أو غير ذلك) ويحمل كذلك:

    - `.env` من دليل العمل الحالي
    - ملف `.env` عام احتياطي من `~/.openclaw/.env` (أي `$OPENCLAW_STATE_DIR/.env`)

    لا يتجاوز أي من ملفي `.env` متغيرات البيئة الموجودة.

    يمكنك أيضا تعريف متغيرات بيئة مضمنة في الإعدادات (تطبق فقط إذا كانت مفقودة من بيئة العملية):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    راجع [/environment](/ar/help/environment) لمعرفة الأولوية والمصادر كاملة.

  </Accordion>

  <Accordion title="بدأت Gateway عبر الخدمة واختفت متغيرات البيئة لدي. ماذا الآن؟">
    حلان شائعان:

    1. ضع المفاتيح المفقودة في `~/.openclaw/.env` حتى يتم التقاطها حتى عندما لا ترث الخدمة بيئة shell لديك.
    2. فعّل استيراد shell (راحة اختيارية):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    يشغّل هذا shell تسجيل الدخول لديك ويستورد فقط المفاتيح المتوقعة المفقودة (ولا يتجاوز أبدا). مكافئات متغيرات البيئة:
    `OPENCLAW_LOAD_SHELL_ENV=1`، `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='عينت COPILOT_GITHUB_TOKEN، لكن حالة النماذج تعرض "Shell env: off." لماذا؟'>
    يوضح `openclaw models status` ما إذا كان **استيراد بيئة shell** مفعلا. لا تعني "Shell env: off"
    أن متغيرات البيئة لديك مفقودة، بل تعني فقط أن OpenClaw لن يحمل
    shell تسجيل الدخول لديك تلقائيا.

    إذا كان Gateway يعمل كخدمة (launchd/systemd)، فلن يرث بيئة
    shell لديك. أصلح ذلك بأحد هذه الخيارات:

    1. ضع الرمز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد shell (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في إعداداتك (يطبق فقط إذا كان مفقودا).

    ثم أعد تشغيل Gateway وتحقق مرة أخرى:

    ```bash
    openclaw models status
    ```

    تتم قراءة رموز Copilot من `COPILOT_GITHUB_TOKEN` (وكذلك `GH_TOKEN` / `GITHUB_TOKEN`).
    راجع [/concepts/model-providers](/ar/concepts/model-providers) و[/environment](/ar/help/environment).

  </Accordion>
</AccordionGroup>

## الجلسات والمحادثات المتعددة

<AccordionGroup>
  <Accordion title="كيف أبدأ محادثة جديدة؟">
    أرسل `/new` أو `/reset` كرسالة مستقلة. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>

  <Accordion title="هل تتم إعادة تعيين الجلسات تلقائيا إذا لم أرسل /new أبدا؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا **معطل افتراضيا** (القيمة الافتراضية **0**).
    عينه إلى قيمة موجبة لتفعيل انتهاء الصلاحية عند الخمول. عند تفعيله، تبدأ الرسالة **التالية**
    بعد فترة الخمول معرف جلسة جديدا لمفتاح الدردشة ذلك.
    هذا لا يحذف النصوص، بل يبدأ جلسة جديدة فقط.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="هل توجد طريقة لإنشاء فريق من مثيلات OpenClaw (مدير تنفيذي واحد وعدة وكلاء)؟">
    نعم، عبر **التوجيه متعدد الوكلاء** و**الوكلاء الفرعيين**. يمكنك إنشاء وكيل منسق واحد
    وعدة وكلاء عاملين بمساحات عمل ونماذج خاصة بهم.

    ومع ذلك، من الأفضل النظر إلى هذا على أنه **تجربة ممتعة**. فهو يستهلك الكثير من الرموز وغالبا
    يكون أقل كفاءة من استخدام بوت واحد مع جلسات منفصلة. النموذج المعتاد الذي
    نتصوره هو بوت واحد تتحدث إليه، مع جلسات مختلفة للعمل المتوازي. ويمكن لذلك
    البوت أيضا إنشاء وكلاء فرعيين عند الحاجة.

    المستندات: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [CLI الخاص بالوكلاء](/ar/cli/agents).

  </Accordion>

  <Accordion title="لماذا اقتطع السياق في منتصف المهمة؟ كيف أمنع ذلك؟">
    سياق الجلسة محدود بنافذة النموذج. قد تؤدي المحادثات الطويلة أو مخرجات الأدوات الكبيرة أو الملفات الكثيرة
    إلى تشغيل Compaction أو الاقتطاع.

    ما الذي يساعد:

    - اطلب من البوت تلخيص الحالة الحالية وكتابتها إلى ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل المواضيع.
    - احتفظ بالسياق المهم في مساحة العمل واطلب من البوت قراءته مرة أخرى.
    - استخدم الوكلاء الفرعيين للأعمال الطويلة أو المتوازية حتى تبقى المحادثة الرئيسية أصغر.
    - اختر نموذجا بنافذة سياق أكبر إذا حدث هذا كثيرا.

  </Accordion>

  <Accordion title="كيف أعيد تعيين OpenClaw بالكامل مع إبقائه مثبتا؟">
    استخدم أمر إعادة التعيين:

    ```bash
    openclaw reset
    ```

    إعادة تعيين كاملة غير تفاعلية:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    ثم شغّل الإعداد مرة أخرى:

    ```bash
    openclaw onboard --install-daemon
    ```

    ملاحظات:

    - يعرض Onboarding أيضا **إعادة تعيين** إذا رأى إعدادا موجودا. راجع [Onboarding (CLI)](/ar/start/wizard).
    - إذا استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد تعيين كل دليل حالة (القيم الافتراضية هي `~/.openclaw-<profile>`).
    - إعادة تعيين التطوير: `openclaw gateway --dev --reset` (خاص بالتطوير فقط؛ يمسح إعدادات التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='تظهر لي أخطاء "context too large" - كيف أعيد التعيين أو أضغط السياق؟'>
    استخدم أحد هذه الخيارات:

    - **Compaction** (يبقي المحادثة لكنه يلخص الجولات الأقدم):

      ```
      /compact
      ```

      أو `/compact <instructions>` لتوجيه الملخص.

    - **إعادة تعيين** (معرف جلسة جديد لمفتاح الدردشة نفسه):

      ```
      /new
      /reset
      ```

    إذا استمر ذلك:

    - فعّل أو اضبط **تقليم الجلسات** (`agents.defaults.contextPruning`) لقص مخرجات الأدوات القديمة.
    - استخدم نموذجا بنافذة سياق أكبر.

    المستندات: [Compaction](/ar/concepts/compaction)، [تقليم الجلسات](/ar/concepts/session-pruning)، [إدارة الجلسات](/ar/concepts/session).

  </Accordion>

  <Accordion title='لماذا أرى "LLM request rejected: messages.content.tool_use.input field required"؟'>
    هذا خطأ تحقق من الموفر: أصدر النموذج كتلة `tool_use` بدون
    `input` المطلوب. يعني ذلك عادة أن سجل الجلسة قديم أو تالف (غالبا بعد سلاسل طويلة
    أو تغيير في أداة/مخطط).

    الحل: ابدأ جلسة جديدة باستخدام `/new` (رسالة مستقلة).

  </Accordion>

  <Accordion title="لماذا أتلقى رسائل Heartbeat كل 30 دقيقة؟">
    تعمل Heartbeats كل **30m** افتراضيا (**1h** عند استخدام مصادقة OAuth). اضبطها أو عطّلها:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    إذا كان `HEARTBEAT.md` موجودا لكنه فارغ فعليا (أسطر فارغة فقط وعناوين markdown
    مثل `# Heading`)، يتجاوز OpenClaw تشغيل Heartbeat لتوفير استدعاءات API.
    إذا كان الملف مفقودا، فسيظل Heartbeat يعمل ويقرر النموذج ما ينبغي فعله.

    تستخدم التجاوزات لكل وكيل `agents.list[].heartbeat`. المستندات: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل أحتاج إلى إضافة "حساب بوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك الخاص**، لذلك إذا كنت في المجموعة، يمكن لـ OpenClaw رؤيتها.
    افتراضيا، يتم حظر ردود المجموعة حتى تسمح للمرسلين (`groupPolicy: "allowlist"`).

    إذا أردت أن تكون **أنت فقط** قادرا على تشغيل ردود المجموعة:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="كيف أحصل على JID لمجموعة WhatsApp؟">
    الخيار 1 (الأسرع): تابع السجلات وأرسل رسالة اختبار في المجموعة:

    ```bash
    openclaw logs --follow --json
    ```

    ابحث عن `chatId` (أو `from`) ينتهي بـ `@g.us`، مثل:
    `1234567890-1234567890@g.us`.

    الخيار 2 (إذا كانت مهيأة/مدرجة في قائمة السماح بالفعل): اعرض المجموعات من الإعدادات:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    المستندات: [WhatsApp](/ar/channels/whatsapp)، [الدليل](/ar/cli/directory)، [السجلات](/ar/cli/logs).

  </Accordion>

  <Accordion title="لماذا لا يرد OpenClaw في مجموعة؟">
    سببان شائعان:

    - بوابة الإشارة مفعلة (افتراضيا). يجب أن تشير إلى البوت بـ @mention (أو تطابق `mentionPatterns`).
    - هيأت `channels.whatsapp.groups` بدون `"*"` والمجموعة ليست في قائمة السماح.

    راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشارك المجموعات/السلاسل السياق مع الرسائل المباشرة؟">
    تندمج المحادثات المباشرة في الجلسة الرئيسية افتراضيا. للمجموعات/القنوات مفاتيح جلسات خاصة بها، ومواضيع Telegram / سلاسل Discord هي جلسات منفصلة. راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم عدد مساحات العمل والوكلاء الذين يمكنني إنشاؤهم؟">
    لا توجد حدود صارمة. العشرات (حتى المئات) مقبولة، لكن انتبه إلى:

    - **نمو القرص:** توجد الجلسات + النصوص تحت `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** المزيد من الوكلاء يعني استخداما أكثر تزامنا للنموذج.
    - **العبء التشغيلي:** ملفات تعريف المصادقة، ومساحات العمل، وتوجيه القنوات لكل وكيل.

    نصائح:

    - احتفظ بمساحة عمل **نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - قلّم الجلسات القديمة (احذف JSONL أو إدخالات المخزن) إذا نما القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل الشاردة وعدم تطابق ملفات التعريف.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة روبوتات أو محادثات في الوقت نفسه (Slack)، وكيف ينبغي إعداد ذلك؟">
    نعم. استخدم **التوجيه متعدد الوكلاء** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة حسب
    القناة/الحساب/النظير. Slack مدعوم كقناة ويمكن ربطه بوكلاء محددين.

    الوصول عبر المتصفح قوي، لكنه لا يعني "افعل أي شيء يمكن للإنسان فعله" - فما زالت آليات مكافحة الروبوتات وCAPTCHA وMFA قادرة
    على حظر الأتمتة. للحصول على التحكم الأكثر موثوقية بالمتصفح، استخدم Chrome MCP المحلي على المضيف،
    أو استخدم CDP على الجهاز الذي يشغّل المتصفح فعليًا.

    إعداد أفضل الممارسات:

    - مضيف Gateway دائم التشغيل (VPS/Mac mini).
    - وكيل واحد لكل دور (ارتباطات).
    - قناة أو قنوات Slack مرتبطة بهؤلاء الوكلاء.
    - متصفح محلي عبر Chrome MCP أو Node عند الحاجة.

    المستندات: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [Slack](/ar/channels/slack)،
    [المتصفح](/ar/tools/browser)، [العُقد](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج، تجاوز الأعطال، وملفات تعريف المصادقة

توجد أسئلة وأجوبة النماذج — الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الأعطال، وملفات تعريف المصادقة —
في [الأسئلة الشائعة حول النماذج](/ar/help/faq-models).

## Gateway: المنافذ، "قيد التشغيل بالفعل"، والوضع البعيد

<AccordionGroup>
  <Accordion title="ما المنفذ الذي يستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ المتعدد الوحيد لـ WebSocket + HTTP (Control UI، والخطافات، وما إلى ذلك).

    ترتيب الأولوية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا يقول openclaw gateway status "Runtime: running" لكن "Connectivity probe: failed"؟'>
    لأن "running" هي رؤية **المشرف** (launchd/systemd/schtasks). أما فحص الاتصال فهو CLI يتصل فعليًا بـ WebSocket الخاص بالبوابة.

    استخدم `openclaw gateway status` وثق بهذه الأسطر:

    - `Probe target:` (عنوان URL الذي استخدمه الفحص فعليًا)
    - `Listening:` (ما هو مرتبط فعليًا بالمنفذ)
    - `Last gateway error:` (السبب الجذري الشائع عندما تكون العملية حية لكن المنفذ لا يستمع)

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status قيمتين مختلفتين لـ "Config (cli)" و"Config (service)"؟'>
    أنت تعدّل ملف إعدادات بينما تعمل الخدمة بملف آخر (غالبًا بسبب عدم تطابق `--profile` / `OPENCLAW_STATE_DIR`).

    الإصلاح:

    ```bash
    openclaw gateway install --force
    ```

    شغّل ذلك من `--profile` / البيئة نفسها التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ماذا تعني عبارة "another gateway instance is already listening"؟'>
    يفرض OpenClaw قفل وقت التشغيل عبر ربط مستمع WebSocket فورًا عند بدء التشغيل (الافتراضي `ws://127.0.0.1:18789`). إذا فشل الربط مع `EADDRINUSE`، فإنه يطرح `GatewayLockError` مما يشير إلى أن مثيلًا آخر يستمع بالفعل.

    الإصلاح: أوقف المثيل الآخر، أو حرر المنفذ، أو شغّل باستخدام `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="كيف أشغّل OpenClaw في الوضع البعيد (يتصل العميل بـ Gateway في مكان آخر)؟">
    اضبط `gateway.mode: "remote"` ووجّه إلى عنوان URL بعيد لـ WebSocket، مع بيانات اعتماد بعيدة بسر مشترك اختياريًا:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    ملاحظات:

    - يبدأ `openclaw gateway` فقط عندما يكون `gateway.mode` هو `local` (أو تمرر علامة التجاوز).
    - يراقب تطبيق macOS ملف الإعدادات ويبدّل الأوضاع مباشرة عند تغيّر هذه القيم.
    - `gateway.remote.token` / `.password` هي بيانات اعتماد بعيدة من جهة العميل فقط؛ ولا تمكّن مصادقة Gateway المحلي بمفردها.

  </Accordion>

  <Accordion title='تقول Control UI "unauthorized" (أو تستمر في إعادة الاتصال). ماذا الآن؟'>
    مسار مصادقة البوابة لديك وطريقة مصادقة الواجهة لا يتطابقان.

    حقائق (من الشيفرة):

    - تحتفظ Control UI بالرمز في `sessionStorage` لجلسة تبويب المتصفح الحالية وعنوان URL المحدد للبوابة، لذا يستمر تحديث التبويب نفسه في العمل دون استعادة استمرار رمز localStorage طويل الأمد.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة محاولة محدودة واحدة باستخدام رمز جهاز مخزّن مؤقتًا عندما تعيد البوابة تلميحات إعادة المحاولة (`canRetryWithDeviceToken=true`، `recommendedNextStep=retry_with_device_token`).
    - إعادة المحاولة هذه بالرمز المخزّن مؤقتًا تعيد الآن استخدام النطاقات المعتمدة المخزنة مؤقتًا مع رمز الجهاز. ولا يزال المستدعون الذين يمررون `deviceToken` صريحًا / `scopes` صريحة يحتفظون بمجموعة النطاقات المطلوبة بدلًا من وراثة النطاقات المخزنة مؤقتًا.
    - خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال هي الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز bootstrap.
    - فحوصات نطاق رمز bootstrap مسبوقة بالدور. قائمة السماح المضمنة لمشغّل bootstrap تفي بطلبات المشغّل فقط؛ ولا تزال أدوار Node أو الأدوار الأخرى غير المشغّلة تحتاج إلى نطاقات تحت بادئة دورها الخاص.

    الإصلاح:

    - الأسرع: `openclaw dashboard` (يطبع عنوان URL للوحة المعلومات وينسخه، ويحاول فتحه؛ ويعرض تلميح SSH إذا كان بلا واجهة).
    - إذا لم يكن لديك رمز بعد: `openclaw doctor --generate-gateway-token`.
    - إذا كان بعيدًا، أنشئ النفق أولًا: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع السر المشترك: اضبط `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم الصق السر المطابق في إعدادات Control UI.
    - وضع Tailscale Serve: تأكد من تمكين `gateway.auth.allowTailscale` وأنك تفتح عنوان URL الخاص بـ Serve، وليس عنوان local loopback/tailnet خامًا يتجاوز ترويسات هوية Tailscale.
    - وضع الوكيل الموثوق: تأكد من أنك تصل عبر الوكيل المدرِك للهوية والمكوّن، وليس عبر عنوان URL خام للبوابة. وتحتاج وكلاء local loopback على المضيف نفسه أيضًا إلى `gateway.auth.trustedProxy.allowLoopback = true`.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، دوّر/أعد اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا قالت مكالمة التدوير إنها رُفضت، فتحقق من أمرين:
      - يمكن لجلسات الجهاز المقترن تدوير جهازها **الخاص** فقط ما لم تكن لديها أيضًا `operator.admin`
      - لا يمكن لقيم `--scope` الصريحة أن تتجاوز نطاقات المشغّل الحالية لدى المستدعي
    - ما زلت عالقًا؟ شغّل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [لوحة المعلومات](/ar/web/dashboard) لتفاصيل المصادقة.

  </Accordion>

  <Accordion title="ضبطت gateway.bind على tailnet لكنه لا يستطيع الربط ولا يوجد شيء يستمع">
    يختار ربط `tailnet` عنوان IP من Tailscale من واجهات شبكتك (100.64.0.0/10). إذا لم يكن الجهاز على Tailscale (أو كانت الواجهة معطلة)، فلا يوجد شيء يمكن الربط به.

    الإصلاح:

    - ابدأ Tailscale على ذلك المضيف (حتى يحصل على عنوان 100.x)، أو
    - بدّل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. يفضّل `auto` local loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطًا مقتصرًا على tailnet.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة Gateways على المضيف نفسه؟">
    عادة لا - يمكن لـ Gateway واحد تشغيل عدة قنوات مراسلة ووكلاء. استخدم عدة Gateways فقط عندما تحتاج إلى التكرار (مثال: روبوت إنقاذ) أو العزل الصارم.

    نعم، لكن يجب عليك العزل:

    - `OPENCLAW_CONFIG_PATH` (إعدادات لكل مثيل)
    - `OPENCLAW_STATE_DIR` (حالة لكل مثيل)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (موصى به):

    - استخدم `openclaw --profile <name> ...` لكل مثيل (ينشئ تلقائيًا `~/.openclaw-<name>`).
    - اضبط `gateway.port` فريدًا في إعدادات كل ملف تعريف (أو مرر `--port` للتشغيل اليدوي).
    - ثبّت خدمة لكل ملف تعريف: `openclaw --profile <name> gateway install`.

    تضيف ملفات التعريف أيضًا لاحقة إلى أسماء الخدمات (`ai.openclaw.<profile>`؛ القديم `com.openclaw.*`، `openclaw-gateway-<profile>.service`، `OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [بوابات متعددة](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ماذا تعني "invalid handshake" / الرمز 1008؟'>
    Gateway هو **خادم WebSocket**، ويتوقع أن تكون الرسالة الأولى تمامًا
    إطار `connect`. إذا تلقى أي شيء آخر، فإنه يغلق الاتصال
    باستخدام **الرمز 1008** (انتهاك السياسة).

    الأسباب الشائعة:

    - فتحت عنوان URL الخاص بـ **HTTP** في متصفح (`http://...`) بدلًا من عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - أزال وكيل أو نفق ترويسات المصادقة أو أرسل طلبًا ليس للبوابة.

    إصلاحات سريعة:

    1. استخدم عنوان URL الخاص بـ WS: `ws://<host>:18789` (أو `wss://...` إذا كان HTTPS).
    2. لا تفتح منفذ WS في تبويب متصفح عادي.
    3. إذا كانت المصادقة مفعّلة، فأدرج الرمز/كلمة المرور في إطار `connect`.

    إذا كنت تستخدم CLI أو TUI، فينبغي أن يبدو عنوان URL هكذا:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    تفاصيل البروتوكول: [بروتوكول Gateway](/ar/gateway/protocol).

  </Accordion>
</AccordionGroup>

## التسجيل وتصحيح الأخطاء

<AccordionGroup>
  <Accordion title="أين توجد السجلات؟">
    سجلات الملفات (منظمة):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    يمكنك تعيين مسار ثابت عبر `logging.file`. يتحكم `logging.level` في مستوى سجل الملف. ويتحكم `--verbose` و`logging.consoleLevel` في إسهاب وحدة التحكم.

    أسرع متابعة للسجل:

    ```bash
    openclaw logs --follow
    ```

    سجلات الخدمة/المشرف (عندما تعمل البوابة عبر launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` و`gateway.err.log` (الافتراضي: `~/.openclaw/logs/...`؛ تستخدم ملفات التعريف `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting) للمزيد.

  </Accordion>

  <Accordion title="كيف أبدأ/أوقف/أعيد تشغيل خدمة Gateway؟">
    استخدم مساعدات البوابة:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا شغّلت البوابة يدويًا، يمكن لـ `openclaw gateway --force` استعادة المنفذ. راجع [Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="أغلقت الطرفية على Windows - كيف أعيد تشغيل OpenClaw؟">
    هناك **وضعا تثبيت على Windows**:

    **1) WSL2 (موصى به):** يعمل Gateway داخل Linux.

    افتح PowerShell، وادخل WSL، ثم أعد التشغيل:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا لم تثبّت الخدمة مطلقًا، فابدأها في المقدمة:

    ```bash
    openclaw gateway run
    ```

    **2) Windows الأصلي (غير موصى به):** يعمل Gateway مباشرة في Windows.

    افتح PowerShell وشغّل:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا شغّلته يدويًا (بلا خدمة)، فاستخدم:

    ```powershell
    openclaw gateway run
    ```

    المستندات: [Windows (WSL2)](/ar/platforms/windows)، [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="Gateway يعمل لكن الردود لا تصل أبدًا. ما الذي ينبغي أن أتحقق منه؟">
    ابدأ بفحص صحة سريع:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    الأسباب الشائعة:

    - لم تُحمّل مصادقة النموذج على **مضيف البوابة** (تحقق من `models status`).
    - اقتران القناة/قائمة السماح يمنعان الردود (تحقق من إعدادات القناة + السجلات).
    - WebChat/Dashboard مفتوح من دون الرمز الصحيح.

    إذا كنت بعيدًا، فتأكد من أن اتصال النفق/Tailscale يعمل وأن
    WebSocket الخاص بـ Gateway يمكن الوصول إليه.

    المستندات: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ماذا الآن؟'>
    يعني هذا عادة أن الواجهة فقدت اتصال WebSocket. تحقق من:

    1. هل يعمل Gateway؟ `openclaw gateway status`
    2. هل Gateway سليم؟ `openclaw status`
    3. هل تملك واجهة UI الرمز الصحيح؟ `openclaw dashboard`
    4. إذا كان بعيدًا، هل رابط النفق/Tailscale يعمل؟

    ثم تابع السجلات:

    ```bash
    openclaw logs --follow
    ```

    المستندات: [لوحة التحكم](/ar/web/dashboard)، [الوصول عن بُعد](/ar/gateway/remote)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

  </Accordion>

  <Accordion title="يفشل Telegram setMyCommands. ما الذي ينبغي أن أتحقق منه؟">
    ابدأ بالسجلات وحالة القناة:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    ثم طابق الخطأ:

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على عدد كبير جدًا من الإدخالات. يقوم OpenClaw بالفعل بتقليصها إلى حد Telegram ثم يعيد المحاولة بأوامر أقل، لكن لا تزال بعض إدخالات القائمة بحاجة إلى الإزالة. قلّل أوامر Plugin/Skills/المخصصة، أو عطّل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed`، أو `Network request for 'setMyCommands' failed!`، أو أخطاء شبكة مشابهة: إذا كنت على VPS أو خلف وكيل، فتأكد من أن HTTPS الصادر مسموح به وأن DNS يعمل مع `api.telegram.org`.

    إذا كان Gateway بعيدًا، فتأكد من أنك تنظر إلى السجلات على مضيف Gateway.

    المستندات: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="لا يعرض TUI أي مخرجات. ما الذي ينبغي أن أتحقق منه؟">
    تأكد أولًا من إمكانية الوصول إلى Gateway وأن الوكيل يمكنه العمل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لرؤية الحالة الحالية. إذا كنت تتوقع ردودًا في قناة دردشة،
    فتأكد من تمكين التسليم (`/deliver on`).

    المستندات: [TUI](/ar/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway تمامًا ثم أبدأه؟">
    إذا كنت قد ثبّت الخدمة:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    يوقف/يبدأ هذا **الخدمة الخاضعة للإشراف** (launchd على macOS، وsystemd على Linux).
    استخدم هذا عندما يعمل Gateway في الخلفية كخدمة daemon.

    إذا كنت تشغّله في الواجهة الأمامية، فأوقفه باستخدام Ctrl-C، ثم:

    ```bash
    openclaw gateway run
    ```

    المستندات: [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="شرح مبسط: openclaw gateway restart مقابل openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **خدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغّل gateway **في الواجهة الأمامية** لجلسة الطرفية هذه.

    إذا كنت قد ثبّت الخدمة، فاستخدم أوامر gateway. استخدم `openclaw gateway` عندما
    تريد تشغيلًا لمرة واحدة في الواجهة الأمامية.

  </Accordion>

  <Accordion title="أسرع طريقة للحصول على تفاصيل أكثر عند فشل شيء ما">
    ابدأ Gateway باستخدام `--verbose` للحصول على تفاصيل أكثر في وحدة التحكم. ثم افحص ملف السجل بحثًا عن أخطاء مصادقة القناة، وتوجيه النموذج، وRPC.
  </Accordion>
</AccordionGroup>

## الوسائط والمرفقات

<AccordionGroup>
  <Accordion title="أنشأت Skills الخاصة بي صورة/PDF، لكن لم يُرسل شيء">
    يجب أن تتضمن المرفقات الصادرة من الوكيل سطر `MEDIA:<path-or-url>` (في سطر مستقل). راجع [إعداد مساعد OpenClaw](/ar/start/openclaw) و[إرسال الوكيل](/ar/tools/agent-send).

    الإرسال عبر CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    تحقق أيضًا من:

    - القناة الهدف تدعم الوسائط الصادرة وليست محظورة بواسطة قوائم السماح.
    - الملف ضمن حدود الحجم الخاصة بالمزوّد (تُعاد تحجيم الصور إلى حد أقصى 2048px).
    - `tools.fs.workspaceOnly=true` يُبقي الإرسال عبر المسارات المحلية محدودًا على مساحة العمل، وtemp/media-store، والملفات التي تحقق منها sandbox.
    - `tools.fs.workspaceOnly=false` يتيح لـ `MEDIA:` إرسال ملفات محلية على المضيف يمكن للوكيل قراءتها بالفعل، لكن فقط للوسائط وأنواع المستندات الآمنة (الصور، والصوت، والفيديو، وPDF، ومستندات Office). لا تزال الملفات النصية العادية والملفات التي تشبه الأسرار محظورة.

    راجع [الصور](/ar/nodes/images).

  </Accordion>
</AccordionGroup>

## الأمان والتحكم في الوصول

<AccordionGroup>
  <Accordion title="هل من الآمن تعريض OpenClaw للرسائل المباشرة الواردة؟">
    تعامل مع الرسائل المباشرة الواردة كمدخلات غير موثوقة. صُممت الإعدادات الافتراضية لتقليل المخاطر:

    - السلوك الافتراضي في القنوات القادرة على الرسائل المباشرة هو **الإقران**:
      - يتلقى المرسلون غير المعروفين رمز إقران؛ ولا يعالج البوت رسالتهم.
      - وافق باستخدام: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - تُحدّ الطلبات المعلقة عند **3 لكل قناة**؛ تحقق من `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل الرمز.
    - يتطلب فتح الرسائل المباشرة للعامة اشتراكًا صريحًا (`dmPolicy: "open"` وقائمة سماح `"*"`).

    شغّل `openclaw doctor` لإظهار سياسات الرسائل المباشرة الخطرة.

  </Accordion>

  <Accordion title="هل حقن المطالبات مصدر قلق للبوتات العامة فقط؟">
    لا. يتعلق حقن المطالبات بـ **المحتوى غير الموثوق**، وليس فقط بمن يستطيع مراسلة البوت مباشرة.
    إذا كان مساعدك يقرأ محتوى خارجيًا (بحث/جلب الويب، صفحات المتصفح، رسائل البريد،
    المستندات، المرفقات، السجلات الملصوقة)، فقد يتضمن ذلك المحتوى تعليمات تحاول
    اختطاف النموذج. يمكن أن يحدث هذا حتى إذا **كنت أنت المرسل الوحيد**.

    أكبر خطر يكون عند تمكين الأدوات: يمكن خداع النموذج ليقوم
    بتسريب السياق أو استدعاء الأدوات نيابةً عنك. قلّل نطاق الضرر عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو معطّل الأدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` متوقفة للوكلاء الممكّنة أدواتهم
    - التعامل مع نص الملفات/المستندات المفكوك كغير موثوق أيضًا: كل من OpenResponses
      `input_file` واستخراج مرفقات الوسائط يلفان النص المستخرج ضمن
      علامات حدود صريحة للمحتوى الخارجي بدلًا من تمرير نص الملف الخام
    - استخدام sandbox وقوائم سماح صارمة للأدوات

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل ينبغي أن يكون للبوت بريد إلكتروني أو حساب GitHub أو رقم هاتف خاص به؟">
    نعم، في معظم الإعدادات. عزل البوت بحسابات وأرقام هواتف منفصلة
    يقلّل نطاق الضرر إذا حدث خطأ ما. كما يجعل هذا تدوير
    بيانات الاعتماد أو إلغاء الوصول أسهل دون التأثير في حساباتك الشخصية.

    ابدأ على نطاق صغير. امنح الوصول فقط إلى الأدوات والحسابات التي تحتاجها فعليًا، ثم وسّع
    لاحقًا إذا لزم الأمر.

    المستندات: [الأمان](/ar/gateway/security)، [الإقران](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية، وهل هذا آمن؟">
    نحن **لا** نوصي بالاستقلالية الكاملة على رسائلك الشخصية. النمط الأكثر أمانًا هو:

    - أبقِ الرسائل المباشرة في **وضع الإقران** أو ضمن قائمة سماح ضيقة.
    - استخدم **رقمًا أو حسابًا منفصلًا** إذا أردته أن يرسل الرسائل نيابةً عنك.
    - دعه يصيغ المسودة، ثم **وافق قبل الإرسال**.

    إذا أردت التجربة، فافعل ذلك على حساب مخصص وأبقِه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل مخصصًا للدردشة فقط وكانت المدخلات موثوقة. الفئات الأصغر
    أكثر عرضة لاختطاف التعليمات، لذلك تجنّبها للوكلاء الممكّنة أدواتهم
    أو عند قراءة محتوى غير موثوق. إذا كان لا بد من استخدام نموذج أصغر، فأحكم تقييد
    الأدوات وشغّله داخل sandbox. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="شغّلت /start في Telegram لكنني لم أتلقَ رمز إقران">
    تُرسل رموز الإقران **فقط** عندما يرسل مرسل غير معروف رسالة إلى البوت ويكون
    `dmPolicy: "pairing"` مفعّلًا. لا يولّد `/start` بحد ذاته رمزًا.

    تحقق من الطلبات المعلقة:

    ```bash
    openclaw pairing list telegram
    ```

    إذا أردت وصولًا فوريًا، فأضف معرّف المرسل إلى قائمة السماح أو اضبط `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيراسل جهات الاتصال الخاصة بي؟ كيف يعمل الإقران؟">
    لا. سياسة رسائل WhatsApp المباشرة الافتراضية هي **الإقران**. يحصل المرسلون غير المعروفين فقط على رمز إقران ولا تتم **معالجة** رسالتهم. لا يرد OpenClaw إلا على الدردشات التي يتلقاها أو على عمليات الإرسال الصريحة التي تشغّلها.

    وافق على الإقران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اعرض الطلبات المعلقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لضبط **قائمة السماح/المالك** لديك بحيث يُسمح برسائلك المباشرة. لا تُستخدم للإرسال التلقائي. إذا كنت تشغّله على رقم WhatsApp الشخصي، فاستخدم ذلك الرقم ومكّن `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، وإيقاف المهام، و"لن يتوقف"

<AccordionGroup>
  <Accordion title="كيف أوقف ظهور رسائل النظام الداخلية في الدردشة؟">
    لا تظهر معظم الرسائل الداخلية أو رسائل الأدوات إلا عند تمكين **verbose** أو **trace** أو **reasoning**
    لتلك الجلسة.

    أصلح ذلك في الدردشة التي تراها فيها:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    إذا بقيت الضوضاء، فتحقق من إعدادات الجلسة في Control UI واضبط verbose
    على **inherit**. وتأكد أيضًا من أنك لا تستخدم ملف تعريف بوت فيه `verboseDefault` مضبوط
    على `on` في الإعدادات.

    المستندات: [التفكير وverbose](/ar/tools/thinking)، [الأمان](/ar/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="كيف أوقف/ألغي مهمة قيد التشغيل؟">
    أرسل أيًا مما يلي **كرسالة مستقلة** (بدون شرطة مائلة):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    هذه محفزات إيقاف (وليست أوامر شرطة مائلة).

    بالنسبة للعمليات الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

    ```
    process action:kill sessionId:XXX
    ```

    نظرة عامة على أوامر الشرطة المائلة: راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

    يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`، لكن بعض الاختصارات (مثل `/status`) تعمل أيضًا ضمن السطر للمرسلين الموجودين في قائمة السماح.

  </Accordion>

  <Accordion title='كيف أرسل رسالة Discord من Telegram؟ ("Cross-context messaging denied")'>
    يحظر OpenClaw المراسلة **عبر المزوّدين** افتراضيًا. إذا كان استدعاء أداة مرتبطًا
    بـ Telegram، فلن يرسل إلى Discord إلا إذا سمحت بذلك صراحةً.

    مكّن المراسلة عبر المزوّدين للوكيل:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    أعد تشغيل gateway بعد تعديل الإعدادات.

  </Accordion>

  <Accordion title='لماذا يبدو أن البوت "يتجاهل" الرسائل السريعة المتتالية؟'>
    يتحكم وضع الطابور في كيفية تفاعل الرسائل الجديدة مع تشغيل جارٍ. استخدم `/queue` لتغيير الأوضاع:

    - `steer` - يضع كل التوجيهات المعلقة في الطابور حتى حد النموذج التالي في التشغيل الحالي
    - `queue` - توجيه قديم واحد في كل مرة
    - `followup` - يشغّل الرسائل واحدة تلو الأخرى
    - `collect` - يجمع الرسائل ويرد مرة واحدة
    - `steer-backlog` - يوجّه الآن، ثم يعالج التراكم
    - `interrupt` - يجهض التشغيل الحالي ويبدأ من جديد

    الوضع الافتراضي هو `steer`. يمكنك إضافة خيارات مثل `debounce:0.5s cap:25 drop:summarize` لأوضاع followup. راجع [طابور الأوامر](/ar/concepts/queue) و[طابور التوجيه](/ar/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما النموذج الافتراضي لـ Anthropic عند استخدام مفتاح API؟'>
    في OpenClaw، بيانات الاعتماد واختيار النموذج منفصلان. يؤدي تعيين `ANTHROPIC_API_KEY` (أو تخزين مفتاح Anthropic API في ملفات تعريف المصادقة) إلى تمكين المصادقة، لكن النموذج الافتراضي الفعلي هو ما تضبطه في `agents.defaults.model.primary` (على سبيل المثال، `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). إذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم يتمكن من العثور على بيانات اعتماد Anthropic في ملف `auth-profiles.json` المتوقع للوكيل قيد التشغيل.
  </Accordion>
</AccordionGroup>

---

ما زلت عالقًا؟ اسأل في [Discord](https://discord.com/invite/clawd) أو افتح [مناقشة GitHub](https://github.com/openclaw/openclaw/discussions).

## ذات صلة

- [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run) — التثبيت، الإعداد الأولي، المصادقة، الاشتراكات، الإخفاقات المبكرة
- [الأسئلة الشائعة للنماذج](/ar/help/faq-models) — اختيار النموذج، تجاوز الفشل، ملفات تعريف المصادقة
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) — الفرز بدءًا من الأعراض
