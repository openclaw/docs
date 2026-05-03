---
read_when:
    - الإجابة عن أسئلة الدعم الشائعة المتعلقة بالإعداد أو التثبيت أو التهيئة الأولية أو وقت التشغيل
    - فرز المشكلات التي أبلغ عنها المستخدمون قبل التعمق في تصحيح الأخطاء
summary: الأسئلة الشائعة حول إعداد OpenClaw وتكوينه واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-05-03T21:35:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372220d62f872db1427b2836662bc8cc74e07d2cdfb651c105d3df25131855dd
    source_path: help/faq.md
    workflow: 16
---

إجابات سريعة مع استكشاف أعمق للأعطال في الإعدادات الواقعية (التطوير المحلي، VPS، تعدد الوكلاء، مفاتيح OAuth/API، تجاوز فشل النموذج). لتشخيصات وقت التشغيل، راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). لمرجع الإعدادات الكامل، راجع [الإعدادات](/ar/gateway/configuration).

## أول 60 ثانية إذا تعطل شيء ما

1. **الحالة السريعة (الفحص الأول)**

   ```bash
   openclaw status
   ```

   ملخص محلي سريع: نظام التشغيل + التحديث، إمكانية الوصول إلى Gateway/الخدمة، الوكلاء/الجلسات، إعدادات المزوّد + مشكلات وقت التشغيل (عندما يكون Gateway قابلًا للوصول).

2. **تقرير قابل للصق (آمن للمشاركة)**

   ```bash
   openclaw status --all
   ```

   تشخيص للقراءة فقط مع ذيل السجل (مع تنقيح الرموز المميزة).

3. **حالة الخفي + المنفذ**

   ```bash
   openclaw gateway status
   ```

   يعرض وقت تشغيل المشرف مقابل إمكانية الوصول عبر RPC، ورابط هدف الفحص، وأي إعدادات يُرجح أن الخدمة استخدمتها.

4. **فحوصات عميقة**

   ```bash
   openclaw status --deep
   ```

   يشغّل فحص صحة مباشرًا لـ Gateway، بما في ذلك فحوصات القنوات عند دعمها
   (يتطلب Gateway قابلًا للوصول). راجع [الصحة](/ar/gateway/health).

5. **تتبّع أحدث سجل**

   ```bash
   openclaw logs --follow
   ```

   إذا كان RPC متوقفًا، استخدم كبديل:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   سجلات الملفات منفصلة عن سجلات الخدمة؛ راجع [التسجيل](/ar/logging) و[استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

6. **تشغيل الطبيب (الإصلاحات)**

   ```bash
   openclaw doctor
   ```

   يصلح/يرحّل الإعدادات/الحالة + يشغّل فحوصات الصحة. راجع [الطبيب](/ar/gateway/doctor).

7. **لقطة Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   يطلب من Gateway العامل لقطة كاملة (WS فقط). راجع [الصحة](/ar/gateway/health).

## البدء السريع وإعداد التشغيل الأول

أسئلة وأجوبة التشغيل الأول — التثبيت، الإعداد، مسارات المصادقة، الاشتراكات، الإخفاقات الأولية —
موجودة في [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run).

## ما هو OpenClaw؟

<AccordionGroup>
  <Accordion title="What is OpenClaw, in one paragraph?">
    OpenClaw هو مساعد ذكاء اصطناعي شخصي تشغّله على أجهزتك الخاصة. يرد على واجهات المراسلة التي تستخدمها بالفعل (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، وPlugins القنوات المضمّنة مثل QQ Bot) ويمكنه أيضًا تنفيذ الصوت + Canvas مباشر على المنصات المدعومة. **Gateway** هو مستوى التحكم الدائم التشغيل؛ والمساعد هو المنتج.
  </Accordion>

  <Accordion title="Value proposition">
    OpenClaw ليس "مجرد غلاف لـ Claude". إنه **مستوى تحكم محلي أولًا** يتيح لك تشغيل
    مساعد قادر على **عتادك الخاص**، يمكن الوصول إليه من تطبيقات الدردشة التي تستخدمها بالفعل، مع
    جلسات ذات حالة، وذاكرة، وأدوات - من دون تسليم التحكم في سير عملك إلى
    SaaS مستضاف.

    أبرز الميزات:

    - **أجهزتك، بياناتك:** شغّل Gateway حيثما تريد (Mac، Linux، VPS) واحتفظ
      بمساحة العمل + سجل الجلسات محليًا.
    - **قنوات حقيقية، لا صندوق رمل ويب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/إلخ،
      بالإضافة إلى الصوت عبر الجوال وCanvas على المنصات المدعومة.
    - **محايد للنماذج:** استخدم Anthropic، OpenAI، MiniMax، OpenRouter، إلخ، مع توجيه
      لكل وكيل وتجاوز فشل.
    - **خيار محلي فقط:** شغّل نماذج محلية حتى **تبقى كل البيانات على جهازك** إذا أردت.
    - **توجيه متعدد الوكلاء:** وكلاء منفصلون لكل قناة أو حساب أو مهمة، ولكل منهم
      مساحة عمل وإعدادات افتراضية خاصة.
    - **مفتوح المصدر وقابل للتعديل:** افحص، ووسّع، واستضف ذاتيًا من دون الارتباط بمورّد.

    الوثائق: [Gateway](/ar/gateway)، [القنوات](/ar/channels)، [تعدد الوكلاء](/ar/concepts/multi-agent)،
    [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="I just set it up - what should I do first?">
    مشاريع أولى جيدة:

    - بناء موقع ويب (WordPress أو Shopify أو موقع ثابت بسيط).
    - إنشاء نموذج أولي لتطبيق جوال (مخطط، شاشات، خطة API).
    - تنظيم الملفات والمجلدات (تنظيف، تسمية، وسم).
    - ربط Gmail وأتمتة الملخصات أو المتابعات.

    يمكنه التعامل مع المهام الكبيرة، لكنه يعمل بأفضل شكل عندما تقسمها إلى مراحل وتستخدم
    وكلاء فرعيين للعمل المتوازي.

  </Accordion>

  <Accordion title="What are the top five everyday use cases for OpenClaw?">
    تبدو المكاسب اليومية عادةً كالتالي:

    - **موجزات شخصية:** ملخصات لصندوق الوارد، والتقويم، والأخبار التي تهمك.
    - **البحث والصياغة:** بحث سريع، وملخصات، ومسودات أولى لرسائل البريد الإلكتروني أو المستندات.
    - **التذكيرات والمتابعات:** تنبيهات وقوائم تحقق مدفوعة بـ Cron أو Heartbeat.
    - **أتمتة المتصفح:** ملء النماذج، وجمع البيانات، وتكرار مهام الويب.
    - **تنسيق عبر الأجهزة:** أرسل مهمة من هاتفك، ودع Gateway يشغّلها على خادم، واستلم النتيجة في الدردشة.

  </Accordion>

  <Accordion title="Can OpenClaw help with lead gen, outreach, ads, and blogs for a SaaS?">
    نعم في **البحث، والتأهيل، والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات رسائل تواصل أو نسخ إعلانية.

    بالنسبة إلى **التواصل أو تشغيل الإعلانات**، أبقِ الإنسان ضمن الحلقة. تجنب الرسائل المزعجة، واتبع القوانين المحلية
    وسياسات المنصات، وراجع أي شيء قبل إرساله. النمط الأكثر أمانًا هو أن يكتب
    OpenClaw المسودة وأنت توافق عليها.

    الوثائق: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="What are the advantages vs Claude Code for web development?">
    OpenClaw هو **مساعد شخصي** وطبقة تنسيق، وليس بديلًا لـ IDE. استخدم
    Claude Code أو Codex للحصول على أسرع دورة ترميز مباشرة داخل مستودع. استخدم OpenClaw عندما
    تريد ذاكرة دائمة، ووصولًا عبر الأجهزة، وتنسيقًا للأدوات.

    المزايا:

    - **ذاكرة + مساحة عمل مستمرتان** عبر الجلسات
    - **وصول متعدد المنصات** (WhatsApp، Telegram، TUI، WebChat)
    - **تنسيق الأدوات** (المتصفح، الملفات، الجدولة، الخطافات)
    - **Gateway دائم التشغيل** (شغّله على VPS، وتفاعل من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/التنفيذ المحلي

    العرض: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="How do I customize skills without keeping the repo dirty?">
    استخدم تجاوزات مُدارة بدلًا من تعديل نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدًا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). ترتيب الأولوية هو `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمّنة → `skills.load.extraDirs`، لذلك تظل التجاوزات المُدارة متقدمة على Skills المضمّنة من دون لمس git. إذا كنت تحتاج إلى تثبيت Skill عالميًا لكن لا يظهر إلا لبعض الوكلاء، احتفظ بالنسخة المشتركة في `~/.openclaw/skills` وتحكم في الظهور باستخدام `agents.defaults.skills` و`agents.list[].skills`. يجب أن تعيش التعديلات الجديرة بالمنبع فقط في المستودع وأن تخرج كطلبات PR.
  </Accordion>

  <Accordion title="Can I load skills from a custom folder?">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (الأولوية الأدنى). ترتيب الأولوية الافتراضي هو `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمّنة → `skills.load.extraDirs`. يثبّت `clawhub` في `./skills` افتراضيًا، وهو ما يعامله OpenClaw كـ `<workspace>/skills` في الجلسة التالية. إذا كان ينبغي أن تكون Skill مرئية فقط لوكلاء محددين، فاقرن ذلك مع `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="How can I use different models for different tasks?">
    الأنماط المدعومة اليوم هي:

    - **مهام Cron**: يمكن للمهام المعزولة تعيين تجاوز `model` لكل مهمة.
    - **الوكلاء الفرعيون**: وجّه المهام إلى وكلاء منفصلين بنماذج افتراضية مختلفة.
    - **تبديل عند الطلب**: استخدم `/model` لتبديل نموذج الجلسة الحالية في أي وقت.

    راجع [مهام Cron](/ar/automation/cron-jobs)، و[توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="The bot freezes while doing heavy work. How do I offload that?">
    استخدم **الوكلاء الفرعيين** للمهام الطويلة أو المتوازية. يعمل الوكلاء الفرعيون في جلستهم الخاصة،
    ويعيدون ملخصًا، ويبقون دردشتك الرئيسية مستجيبة.

    اطلب من البوت "إنشاء وكيل فرعي لهذه المهمة" أو استخدم `/subagents`.
    استخدم `/status` في الدردشة لمعرفة ما يفعله Gateway الآن (وما إذا كان مشغولًا).

    نصيحة الرموز المميزة: تستهلك المهام الطويلة والوكلاء الفرعيون الرموز المميزة. إذا كانت التكلفة مصدر قلق، فعيّن
    نموذجًا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="How do thread-bound subagent sessions work on Discord?">
    استخدم ربط الخيوط. يمكنك ربط خيط Discord بوكيل فرعي أو هدف جلسة بحيث تبقى رسائل المتابعة في ذلك الخيط على الجلسة المرتبطة.

    التدفق الأساسي:

    - أنشئ باستخدام `sessions_spawn` مع `thread: true` (واختياريًا `mode: "session"` للمتابعة المستمرة).
    - أو اربط يدويًا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الربط.
    - استخدم `/session idle <duration|off>` و`/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل الخيط.

    الإعدادات المطلوبة:

    - الإعدادات الافتراضية العامة: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - الربط التلقائي عند الإنشاء: القيمة الافتراضية لـ `channels.discord.threadBindings.spawnSessions` هي `true`؛ عيّنها إلى `false` لتعطيل إنشاء الجلسات المرتبطة بالخيط.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع الإعدادات](/ar/gateway/configuration-reference)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="A subagent finished, but the completion update went to the wrong place or never posted. What should I check?">
    افحص مسار الطالب المحلول أولًا:

    - يفضّل تسليم الوكيل الفرعي في وضع الإكمال أي خيط مرتبط أو مسار محادثة عندما يكون أحدهما موجودًا.
    - إذا كان أصل الإكمال يحمل قناة فقط، يعود OpenClaw إلى المسار المخزّن لجلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) بحيث يمكن أن ينجح التسليم المباشر رغم ذلك.
    - إذا لم يوجد لا مسار مرتبط ولا مسار مخزّن قابل للاستخدام، فقد يفشل التسليم المباشر وتعود النتيجة إلى تسليم الجلسة في قائمة الانتظار بدلًا من النشر فورًا في الدردشة.
    - لا تزال الأهداف غير الصالحة أو القديمة قادرة على فرض الرجوع إلى قائمة الانتظار أو فشل التسليم النهائي.
    - إذا كان آخر رد مساعد مرئي للطفل هو الرمز الصامت الدقيق `NO_REPLY` / `no_reply`، أو بالضبط `ANNOUNCE_SKIP`، فإن OpenClaw يثبط الإعلان عمدًا بدلًا من نشر تقدم سابق قديم.
    - إذا انتهت مهلة الطفل بعد استدعاءات أدوات فقط، يمكن للإعلان أن يختصر ذلك إلى ملخص تقدم جزئي قصير بدلًا من إعادة عرض مخرجات الأدوات الخام.

    التصحيح:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron or reminders do not fire. What should I check?">
    يعمل Cron داخل عملية Gateway. إذا لم يكن Gateway يعمل باستمرار،
    فلن تعمل المهام المجدولة.

    قائمة التحقق:

    - تأكد من أن cron مفعّل (`cron.enabled`) وأن `OPENCLAW_SKIP_CRON` غير معيّن.
    - تحقق من أن Gateway يعمل 24/7 (بلا سكون/إعادات تشغيل).
    - تحقق من إعدادات المنطقة الزمنية للمهمة (`--tz` مقابل المنطقة الزمنية للمضيف).

    التصحيح:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="تم تشغيل Cron، لكن لم يُرسل أي شيء إلى القناة. لماذا؟">
    تحقّق من وضع التسليم أولًا:

    - `--no-deliver` / `delivery.mode: "none"` يعني أنه لا يُتوقع إرسال احتياطي من المشغّل.
    - هدف إعلان مفقود أو غير صالح (`channel` / `to`) يعني أن المشغّل تخطّى التسليم الصادر.
    - إخفاقات مصادقة القناة (`unauthorized`, `Forbidden`) تعني أن المشغّل حاول التسليم لكن بيانات الاعتماد منعته.
    - تُعامل نتيجة معزولة صامتة (`NO_REPLY` / `no_reply` فقط) على أنها غير قابلة للتسليم عمدًا، لذلك يقمع المشغّل أيضًا التسليم الاحتياطي الموجود في الطابور.

    بالنسبة إلى مهام Cron المعزولة، لا يزال بإمكان الوكيل الإرسال مباشرةً باستخدام أداة `message`
    عندما يكون مسار الدردشة متاحًا. يتحكم `--announce` فقط في مسار المشغّل
    الاحتياطي للنص النهائي الذي لم يرسله الوكيل مسبقًا.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="لماذا بدّل تشغيل Cron معزول النماذج أو أعاد المحاولة مرة واحدة؟">
    يكون ذلك عادةً مسار تبديل النموذج المباشر، وليس جدولة مكررة.

    يمكن لـ Cron المعزول أن يحتفظ بتسليم نموذج وقت التشغيل وأن يعيد المحاولة عندما يرمي التشغيل
    النشط `LiveSessionModelSwitchError`. تُبقي إعادة المحاولة المزوّد/النموذج الذي تم التبديل إليه،
    وإذا حمل التبديل تجاوزًا جديدًا لملف تعريف المصادقة، يحتفظ Cron بذلك أيضًا قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يتقدّم تجاوز نموذج خطاف Gmail أولًا عند انطباقه.
    - ثم `model` لكل مهمة.
    - ثم أي تجاوز نموذج جلسة Cron مخزّن.
    - ثم اختيار النموذج العادي للوكيل/الافتراضي.

    حلقة إعادة المحاولة محدودة. بعد المحاولة الأولى بالإضافة إلى عمليتي إعادة محاولة للتبديل،
    يوقف Cron العملية بدلًا من التكرار إلى الأبد.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [CLI الخاص بـ Cron](/ar/cli/cron).

  </Accordion>

  <Accordion title="كيف أثبّت Skills على Linux؟">
    استخدم أوامر `openclaw skills` الأصلية أو ضع Skills في مساحة عملك. واجهة Skills في macOS غير متاحة على Linux.
    تصفّح Skills في [https://clawhub.ai](https://clawhub.ai).

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
    لمساحة العمل النشطة. ثبّت CLI المنفصل `clawhub` فقط إذا كنت تريد نشر
    Skills الخاصة بك أو مزامنتها. للتثبيتات المشتركة عبر الوكلاء، ضع Skill تحت
    `~/.openclaw/skills` واستخدم `agents.defaults.skills` أو
    `agents.list[].skills` إذا كنت تريد تضييق نطاق الوكلاء الذين يمكنهم رؤيتها.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw تشغيل المهام وفق جدول أو باستمرار في الخلفية؟">
    نعم. استخدم مجدول Gateway:

    - **مهام Cron** للمهام المجدولة أو المتكررة (تستمر عبر عمليات إعادة التشغيل).
    - **Heartbeat** للفحوصات الدورية لـ"الجلسة الرئيسية".
    - **المهام المعزولة** للوكلاء المستقلين الذين ينشرون الملخصات أو يسلّمون إلى الدردشات.

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills الخاصة بـ Apple macOS فقط من Linux؟">
    ليس مباشرةً. تخضع Skills الخاصة بـ macOS لبوابة `metadata.openclaw.os` بالإضافة إلى الثنائيات المطلوبة، ولا تظهر Skills في موجّه النظام إلا عندما تكون مؤهلة على **مضيف Gateway**. على Linux، لن تُحمّل Skills الخاصة بـ `darwin` فقط (مثل `apple-notes` و`apple-reminders` و`things-mac`) إلا إذا تجاوزت البوابة.

    لديك ثلاثة أنماط مدعومة:

    **الخيار A - شغّل Gateway على Mac (الأبسط).**
    شغّل Gateway حيث توجد ثنائيات macOS، ثم اتصل من Linux في [الوضع البعيد](#gateway-ports-already-running-and-remote-mode) أو عبر Tailscale. تُحمّل Skills بشكل طبيعي لأن مضيف Gateway هو macOS.

    **الخيار B - استخدم عقدة macOS (بدون SSH).**
    شغّل Gateway على Linux، واقرن عقدة macOS (تطبيق شريط القوائم)، واضبط **أوامر تشغيل Node** على "اسأل دائمًا" أو "اسمح دائمًا" على Mac. يمكن لـ OpenClaw التعامل مع Skills الخاصة بـ macOS فقط على أنها مؤهلة عندما توجد الثنائيات المطلوبة على العقدة. يشغّل الوكيل تلك Skills عبر أداة `nodes`. إذا اخترت "اسأل دائمًا"، فإن الموافقة على "اسمح دائمًا" في المطالبة تضيف ذلك الأمر إلى قائمة السماح.

    **الخيار C - مرّر ثنائيات macOS عبر SSH (متقدم).**
    أبقِ Gateway على Linux، لكن اجعل ثنائيات CLI المطلوبة تُحل إلى مغلّفات SSH تعمل على Mac. ثم تجاوز Skill للسماح بـ Linux حتى تبقى مؤهلة.

    1. أنشئ مغلّف SSH للثنائي (مثال: `memo` لـ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ضع المغلّف على `PATH` على مضيف Linux (على سبيل المثال `~/bin/memo`).
    3. تجاوز بيانات Skill الوصفية (مساحة العمل أو `~/.openclaw/skills`) للسماح بـ Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. ابدأ جلسة جديدة حتى تُحدّث لقطة Skills.

  </Accordion>

  <Accordion title="هل لديكم تكامل مع Notion أو HeyGen؟">
    ليس مدمجًا اليوم.

    الخيارات:

    - **Skill / Plugin مخصص:** الأفضل للوصول الموثوق إلى API (كل من Notion/HeyGen لديهما APIs).
    - **أتمتة المتصفح:** تعمل بدون كود لكنها أبطأ وأكثر هشاشة.

    إذا كنت تريد الاحتفاظ بالسياق لكل عميل (سير عمل الوكالات)، فالنمط البسيط هو:

    - صفحة Notion واحدة لكل عميل (السياق + التفضيلات + العمل النشط).
    - اطلب من الوكيل جلب تلك الصفحة في بداية الجلسة.

    إذا كنت تريد تكاملًا أصليًا، فافتح طلب ميزة أو ابنِ Skill
    تستهدف تلك APIs.

    تثبيت Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تصل التثبيتات الأصلية إلى دليل `skills/` في مساحة العمل النشطة. بالنسبة إلى Skills المشتركة عبر الوكلاء، ضعها في `~/.openclaw/skills/<name>/SKILL.md`. إذا كان ينبغي لبعض الوكلاء فقط رؤية تثبيت مشترك، فاضبط `agents.defaults.skills` أو `agents.list[].skills`. تتوقع بعض Skills ثنائيات مثبتة عبر Homebrew؛ على Linux يعني ذلك Linuxbrew (راجع إدخال الأسئلة الشائعة لـ Homebrew على Linux أعلاه). راجع [Skills](/ar/tools/skills)، و[إعدادات Skills](/ar/tools/skills-config)، و[ClawHub](/ar/tools/clawhub).

  </Accordion>

  <Accordion title="كيف أستخدم Chrome الحالي الذي سجّلت الدخول إليه مع OpenClaw؟">
    استخدم ملف تعريف المتصفح المدمج `user`، الذي يتصل عبر Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    إذا أردت اسمًا مخصصًا، فأنشئ ملف تعريف MCP صريحًا:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    يمكن لهذا المسار استخدام متصفح المضيف المحلي أو عقدة متصفح متصلة. إذا كان Gateway يعمل في مكان آخر، فشغّل مضيف عقدة على جهاز المتصفح أو استخدم CDP البعيد بدلًا من ذلك.

    الحدود الحالية على `existing-session` / `user`:

    - الإجراءات تعتمد على المراجع، لا على محددات CSS
    - تتطلب عمليات الرفع `ref` / `inputRef` وتدعم حاليًا ملفًا واحدًا في كل مرة
    - لا تزال `responsebody`، وتصدير PDF، واعتراض التنزيلات، والإجراءات الدفعية تحتاج إلى متصفح مُدار أو ملف تعريف CDP خام

  </Accordion>
</AccordionGroup>

## العزل والذاكرة

<AccordionGroup>
  <Accordion title="هل يوجد مستند مخصص للعزل؟">
    نعم. راجع [العزل](/ar/gateway/sandboxing). للإعداد الخاص بـ Docker (Gateway كامل في Docker أو صور العزل)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدودًا - كيف أفعّل الميزات الكاملة؟">
    الصورة الافتراضية تعطي الأولوية للأمان وتعمل كمستخدم `node`، لذلك لا
    تتضمن حزم النظام أو Homebrew أو المتصفحات المضمّنة. لإعداد أكمل:

    - ثبّت `/home/node` باستخدام `OPENCLAW_HOME_VOLUME` حتى تبقى الذاكرات المؤقتة.
    - ادمج تبعيات النظام في الصورة باستخدام `OPENCLAW_DOCKER_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المضمّن:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - اضبط `PLAYWRIGHT_BROWSERS_PATH` وتأكّد من استمرار المسار.

    المستندات: [Docker](/ar/install/docker)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل المباشرة شخصية مع جعل المجموعات عامة/معزولة باستخدام وكيل واحد؟">
    نعم - إذا كانت حركة المرور الخاصة بك **رسائل مباشرة** وحركة المرور العامة **مجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` حتى تعمل جلسات المجموعات/القنوات (المفاتيح غير الرئيسية) في خلفية العزل المضبوطة، بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال إعداد: [المجموعات: رسائل مباشرة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع الإعداد الرئيسي: [إعدادات Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلد مضيف داخل العزل؟">
    اضبط `agents.defaults.sandbox.docker.binds` على `["host:path:mode"]` (مثل `"/home/user/src:/src:ro"`). تُدمج الارتباطات العامة والخاصة بكل وكيل؛ ويتم تجاهل الارتباطات الخاصة بكل وكيل عندما تكون `scope: "shared"`. استخدم `:ro` لأي شيء حساس وتذكّر أن الارتباطات تتجاوز جدران نظام ملفات العزل.

    يتحقق OpenClaw من مصادر الارتباط مقابل كل من المسار المطبع والمسار القانوني المحلول عبر أعمق سلف موجود. وهذا يعني أن حالات الهروب عبر أصل رمزي الرابط لا تزال تفشل بإغلاق حتى عندما لا يكون مقطع المسار الأخير موجودًا بعد، وتظل فحوصات الجذر المسموح به مطبقة بعد حل الرابط الرمزي.

    راجع [العزل](/ar/gateway/sandboxing#custom-bind-mounts) و[العزل مقابل سياسة الأدوات مقابل الرفع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للحصول على أمثلة وملاحظات أمان.

  </Accordion>

  <Accordion title="كيف تعمل الذاكرة؟">
    ذاكرة OpenClaw هي مجرد ملفات Markdown في مساحة عمل الوكيل:

    - ملاحظات يومية في `memory/YYYY-MM-DD.md`
    - ملاحظات طويلة الأمد منتقاة في `MEMORY.md` (الجلسات الرئيسية/الخاصة فقط)

    يشغّل OpenClaw أيضًا **تفريغ ذاكرة صامت قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction التلقائي. يعمل هذا فقط عندما تكون مساحة العمل
    قابلة للكتابة (تتخطاه بيئات العزل للقراءة فقط). راجع [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="الذاكرة تستمر في نسيان الأشياء. كيف أجعلها تثبت؟">
    اطلب من البوت **كتابة الحقيقة إلى الذاكرة**. تنتمي الملاحظات طويلة الأمد إلى `MEMORY.md`،
    ويذهب السياق قصير الأمد إلى `memory/YYYY-MM-DD.md`.

    لا يزال هذا مجالًا نعمل على تحسينه. يساعد تذكير النموذج بتخزين الذكريات؛
    وسيعرف ما يجب فعله. إذا استمر في النسيان، فتحقق من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل.

    المستندات: [الذاكرة](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تستمر الذاكرة إلى الأبد؟ ما الحدود؟">
    تعيش ملفات الذاكرة على القرص وتستمر حتى تحذفها. الحد هو مساحة
    التخزين لديك، وليس النموذج. لا يزال **سياق الجلسة** محدودًا بنافذة سياق
    النموذج، لذلك يمكن للمحادثات الطويلة أن تُضغط أو تُقتطع. لهذا السبب
    يوجد بحث الذاكرة - فهو يعيد الأجزاء ذات الصلة فقط إلى السياق.

    المستندات: [الذاكرة](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب بحث الذاكرة الدلالية مفتاح OpenAI API؟">
    فقط إذا كنت تستخدم **OpenAI embeddings**. يغطي Codex OAuth الدردشة/الإكمالات ولا
    يمنح وصولًا إلى embeddings، لذلك **تسجيل الدخول باستخدام Codex (OAuth أو تسجيل دخول
    Codex CLI)** لا يساعد في بحث الذاكرة الدلالية. ما زالت OpenAI embeddings
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تضبط مزودًا صراحة، يختار OpenClaw مزودًا تلقائيًا عندما يتمكن من
    حل مفتاح API (ملفات تعريف المصادقة، أو `models.providers.*.apiKey`، أو متغيرات البيئة).
    يفضل OpenAI إذا أمكن حل مفتاح OpenAI، وإلا Gemini إذا أمكن حل مفتاح Gemini،
    ثم Voyage، ثم Mistral. إذا لم يتوفر مفتاح بعيد، يبقى بحث الذاكرة
    معطلًا حتى تضبطه. إذا كان لديك مسار نموذج محلي
    مضبوط وموجود، يفضل OpenClaw
    `local`. Ollama مدعوم عندما تضبط صراحة
    `memorySearch.provider = "ollama"`.

    إذا كنت تفضل البقاء محليًا، فاضبط `memorySearch.provider = "local"` (واختياريًا
    `memorySearch.fallback = "none"`). إذا كنت تريد Gemini embeddings، فاضبط
    `memorySearch.provider = "gemini"` وقدم `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). ندعم نماذج embeddings من **OpenAI أو Gemini أو Voyage أو Mistral أو Ollama أو local** -
    راجع [الذاكرة](/ar/concepts/memory) لتفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## أين توجد الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل تُحفظ كل البيانات المستخدمة مع OpenClaw محليًا؟">
    لا - **حالة OpenClaw محلية**، لكن **الخدمات الخارجية ما زالت ترى ما ترسله إليها**.

    - **محلي افتراضيًا:** الجلسات وملفات الذاكرة والإعدادات ومساحة العمل موجودة على مضيف Gateway
      (`~/.openclaw` + دليل مساحة العمل لديك).
    - **بعيد بحكم الضرورة:** الرسائل التي ترسلها إلى مزودي النماذج (Anthropic/OpenAI/etc.) تذهب إلى
      واجهات API الخاصة بهم، ومنصات الدردشة (WhatsApp/Telegram/Slack/etc.) تخزن بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في البصمة:** استخدام النماذج المحلية يبقي المطالبات على جهازك، لكن حركة مرور القنوات
      ما زالت تمر عبر خوادم القناة.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    كل شيء موجود تحت `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | المسار                                                          | الغرض                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | الإعداد الرئيسي (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | استيراد OAuth القديم (يُنسخ إلى ملفات تعريف المصادقة عند أول استخدام) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات تعريف المصادقة (OAuth، ومفاتيح API، و`keyRef`/`tokenRef` اختياريًا) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | حمولة أسرار اختيارية مدعومة بملف لمزودي SecretRef من نوع `file`   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ملف توافق قديم (تتم تنقية إدخالات `api_key` الثابتة)              |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | حالة المزود (مثل `whatsapp/<accountId>/creds.json`)               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | حالة لكل وكيل (agentDir + الجلسات)                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | سجل المحادثات والحالة (لكل وكيل)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | بيانات تعريف الجلسة (لكل وكيل)                                    |

    مسار الوكيل الواحد القديم: `~/.openclaw/agent/*` (يُرحّل بواسطة `openclaw doctor`).

    **مساحة العمل** لديك (AGENTS.md، وملفات الذاكرة، وSkills، وما إلى ذلك) منفصلة ومضبوطة عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    توجد هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`,
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` اختياريًا.
      ملف الجذر ذي الأحرف الصغيرة `memory.md` هو إدخال إصلاح قديم فقط؛ يمكن لـ `openclaw doctor --fix`
      دمجه في `MEMORY.md` عندما يكون كلا الملفين موجودين.
    - **دليل الحالة (`~/.openclaw`)**: الإعدادات، وحالة القناة/المزود، وملفات تعريف المصادقة، والجلسات، والسجلات،
      وSkills المشتركة (`~/.openclaw/skills`).

    مساحة العمل الافتراضية هي `~/.openclaw/workspace`، ويمكن ضبطها عبر:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    إذا "نسي" البوت بعد إعادة التشغيل، فتأكد من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل (وتذكر: يستخدم الوضع البعيد **مساحة عمل مضيف gateway**
    وليس حاسوبك المحمول المحلي).

    نصيحة: إذا أردت سلوكًا أو تفضيلًا دائمًا، فاطلب من البوت **كتابته في
    AGENTS.md أو MEMORY.md** بدلًا من الاعتماد على سجل الدردشة.

    راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) و[الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="استراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** في مستودع git **خاص** وانسخها احتياطيًا في مكان
    خاص (مثل GitHub private). يلتقط هذا الذاكرة + ملفات AGENTS/SOUL/USER
    ويتيح لك استعادة "عقل" المساعد لاحقًا.

    لا تقم **بإيداع** أي شيء تحت `~/.openclaw` (بيانات الاعتماد أو الجلسات أو الرموز أو حمولات الأسرار المشفرة).
    إذا كنت تحتاج إلى استعادة كاملة، فانسخ احتياطيًا مساحة العمل ودليل الحالة
    كلًا على حدة (راجع سؤال الترحيل أعلاه).

    المستندات: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف ألغي تثبيت OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إلغاء التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. مساحة العمل هي **cwd الافتراضي** ومرتكز الذاكرة، وليست صندوق عزل صارمًا.
    تُحل المسارات النسبية داخل مساحة العمل، لكن المسارات المطلقة يمكنها الوصول إلى مواقع أخرى على
    المضيف ما لم يكن العزل مفعّلًا. إذا كنت تحتاج إلى عزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات العزل لكل وكيل. إذا كنت
    تريد أن يكون أحد المستودعات دليل العمل الافتراضي، فوجّه `workspace` لذلك الوكيل
    إلى جذر المستودع. مستودع OpenClaw هو مجرد شفرة مصدرية؛ أبقِ
    مساحة العمل منفصلة ما لم تكن تقصد أن يعمل الوكيل داخله.

    مثال (المستودع كـ cwd افتراضي):

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
    حالة الجلسة يملكها **مضيف gateway**. إذا كنت في الوضع البعيد، فمخزن الجلسات الذي يهمك موجود على الجهاز البعيد، وليس على حاسوبك المحمول المحلي. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>
</AccordionGroup>

## أساسيات الإعداد

<AccordionGroup>
  <Accordion title="ما تنسيق ملف الإعداد؟ وأين يوجد؟">
    يقرأ OpenClaw إعداد **JSON5** اختياريًا من `$OPENCLAW_CONFIG_PATH` (الافتراضي: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    إذا كان الملف مفقودًا، يستخدم قيمًا افتراضية آمنة نوعًا ما (بما في ذلك مساحة عمل افتراضية هي `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='ضبطت gateway.bind: "lan" (أو "tailnet") والآن لا شيء يستمع / تقول الواجهة إن الوصول غير مصرح به'>
    الارتباطات غير المحلية **تتطلب مسار مصادقة Gateway صالحًا**. عمليًا يعني ذلك:

    - مصادقة بسر مشترك: رمز أو كلمة مرور
    - `gateway.auth.mode: "trusted-proxy"` خلف وكيل عكسي مدرك للهوية ومضبوط بشكل صحيح

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

    - `gateway.remote.token` / `.password` لا **تفعّل** مصادقة gateway المحلية بمفردها.
    - يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كاحتياطي فقط عندما لا يكون `gateway.auth.*` مضبوطًا.
    - لمصادقة كلمة المرور، اضبط `gateway.auth.mode: "password"` بالإضافة إلى `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`) بدلًا من ذلك.
    - إذا كان `gateway.auth.token` / `gateway.auth.password` مضبوطًا صراحة عبر SecretRef ولم يُحل، يفشل الحل بإغلاق آمن (بدون إخفاء عبر احتياطي بعيد).
    - إعدادات واجهة التحكم ذات السر المشترك تصادق عبر `connect.params.auth.token` أو `connect.params.auth.password` (مخزنة في إعدادات التطبيق/الواجهة). تستخدم الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy` ترويسات الطلب بدلًا من ذلك. تجنب وضع الأسرار المشتركة في عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، تتطلب وكلاء reverse proxy المحليون على المضيف نفسه ضبط `gateway.auth.trustedProxy.allowLoopback = true` صراحة وإدخال loopback في `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="لماذا أحتاج إلى رمز على localhost الآن؟">
    يفرض OpenClaw مصادقة gateway افتراضيًا، بما في ذلك loopback. في المسار الافتراضي العادي يعني ذلك مصادقة الرمز: إذا لم يُضبط مسار مصادقة صريح، يتحول بدء تشغيل gateway إلى وضع الرمز وينشئ واحدًا تلقائيًا، ويحفظه في `gateway.auth.token`، لذلك **يجب على عملاء WS المحليين المصادقة**. يمنع هذا العمليات المحلية الأخرى من استدعاء Gateway.

    إذا كنت تفضل مسار مصادقة مختلفًا، فيمكنك اختيار وضع كلمة المرور صراحة (أو `trusted-proxy` للوكلاء العكسيين المدركين للهوية). إذا كنت تريد loopback مفتوحًا **حقًا**، فاضبط `gateway.auth.mode: "none"` صراحة في إعداداتك. يمكن لـ Doctor إنشاء رمز لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب أن أعيد التشغيل بعد تغيير الإعدادات؟">
    يراقب Gateway الإعدادات ويدعم إعادة التحميل الساخنة:

    - `gateway.reload.mode: "hybrid"` (الافتراضي): يطبق التغييرات الآمنة مباشرة، ويعيد التشغيل للتغييرات الحرجة
    - `hot` و`restart` و`off` مدعومة أيضًا

  </Accordion>

  <Accordion title="كيف أعطل عبارات CLI الطريفة؟">
    اضبط `cli.banner.taglineMode` في الإعدادات:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: يخفي نص العبارة لكنه يبقي سطر عنوان/إصدار الشعار.
    - `default`: يستخدم `All your chats, one OpenClaw.` في كل مرة.
    - `random`: عبارات طريفة/موسمية متغيرة (السلوك الافتراضي).
    - إذا كنت لا تريد أي شعار على الإطلاق، فاضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="كيف أفعّل بحث الويب (وجلب الويب)؟">
    يعمل `web_fetch` بدون مفتاح API. يعتمد `web_search` على المزود المحدد
    لديك:

    - المزودون المدعومون بواجهات API مثل Brave وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وPerplexity وTavily يحتاجون إلى إعداد مفتاح API المعتاد.
    - Ollama Web Search لا يحتاج إلى مفتاح، لكنه يستخدم مضيف Ollama المضبوط لديك ويتطلب `ollama signin`.
    - DuckDuckGo لا يحتاج إلى مفتاح، لكنه تكامل غير رسمي قائم على HTML.
    - SearXNG لا يحتاج إلى مفتاح/مستضاف ذاتيًا؛ اضبط `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

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

    يوجد إعداد بحث الويب الخاص بكل مزود الآن ضمن `plugins.entries.<plugin>.config.webSearch.*`.
    لا تزال مسارات المزود القديمة `tools.web.search.*` تُحمّل مؤقتًا للتوافق، لكن يجب عدم استخدامها للإعدادات الجديدة.
    يوجد إعداد الرجوع الاحتياطي لجلب الويب من Firecrawl ضمن `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم السماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - يكون `web_fetch` مفعّلًا افتراضيًا (ما لم يُعطّل صراحة).
    - إذا حُذف `tools.web.fetch.provider`، يكتشف OpenClaw تلقائيًا أول مزود رجوع احتياطي جاهز للجلب من بيانات الاعتماد المتاحة. المزود المضمن حاليًا هو Firecrawl.
    - تقرأ العمليات الخدمية متغيرات البيئة من `~/.openclaw/.env` (أو من بيئة الخدمة).

    الوثائق: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="مسح config.apply إعدادي. كيف أستعيده وأتجنب ذلك؟">
    يستبدل `config.apply` **الإعداد بالكامل**. إذا أرسلت كائنًا جزئيًا، فسيُزال كل
    ما عداه.

    يحمي OpenClaw الحالي من كثير من عمليات الاستبدال العرضية:

    - تتحقق عمليات كتابة الإعدادات المملوكة لـ OpenClaw من الإعداد الكامل بعد التغيير قبل الكتابة.
    - تُرفض عمليات الكتابة المملوكة لـ OpenClaw غير الصالحة أو الهدامة وتُحفظ باسم `openclaw.json.rejected.*`.
    - إذا تسبب تعديل مباشر في تعطل بدء التشغيل أو إعادة التحميل الساخنة، يفشل Gateway بإغلاق آمن أو يتخطى إعادة التحميل؛ ولا يعيد كتابة `openclaw.json`.
    - يملك `openclaw doctor --fix` الإصلاح ويمكنه استعادة آخر إعداد صالح معروف مع حفظ الملف المرفوض باسم `openclaw.json.clobbered.*`.

    الاستعادة:

    - تحقق من `openclaw logs --follow` بحثًا عن `Invalid config at` أو `Config write rejected:` أو `config reload skipped (invalid config)`.
    - افحص أحدث `openclaw.json.clobbered.*` أو `openclaw.json.rejected.*` بجانب الإعداد النشط.
    - شغّل `openclaw config validate` و`openclaw doctor --fix`.
    - انسخ المفاتيح المقصودة فقط مرة أخرى باستخدام `openclaw config set` أو `config.patch`.
    - إذا لم يكن لديك آخر إعداد صالح معروف أو حمولة مرفوضة، فاستعد من نسخة احتياطية، أو أعد تشغيل `openclaw doctor` وأعد ضبط القنوات/النماذج.
    - إذا كان ذلك غير متوقع، فافتح بلاغ عطل وأرفق آخر إعداد معروف لديك أو أي نسخة احتياطية.
    - يستطيع وكيل برمجة محلي غالبًا إعادة بناء إعداد عامل من السجلات أو السجل التاريخي.

    تجنّب ذلك:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` للتعديلات التفاعلية.
    - استخدم `config.schema.lookup` أولًا عندما لا تكون متأكدًا من مسار دقيق أو شكل حقل؛ فهو يعيد عقدة مخطط سطحية مع ملخصات فورية للأبناء للتنقل التفصيلي.
    - استخدم `config.patch` لتعديلات RPC الجزئية؛ واحتفظ بـ `config.apply` لاستبدال الإعداد الكامل فقط.
    - إذا كنت تستخدم أداة وقت التشغيل `gateway` المخصصة للمالك فقط من تشغيل وكيل، فستظل ترفض الكتابة إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك الأسماء المستعارة القديمة `tools.bash.*` التي تُطبّع إلى مسارات exec المحمية نفسها).

    الوثائق: [الإعداد](/ar/cli/config)، [الضبط](/ar/cli/configure)، [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغّل Gateway مركزيًا مع عمال متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحد** (مثل Raspberry Pi) بالإضافة إلى **العُقد** و**الوكلاء**:

    - **Gateway (مركزي):** يملك القنوات (Signal/WhatsApp)، والتوجيه، والجلسات.
    - **العُقد (الأجهزة):** تتصل أجهزة Mac/iOS/Android كأطراف وتعرض أدوات محلية (`system.run` و`canvas` و`camera`).
    - **الوكلاء (العمال):** عقول/مساحات عمل منفصلة للأدوار الخاصة (مثل "عمليات Hetzner" و"البيانات الشخصية").
    - **الوكلاء الفرعيون:** يشغّلون عملًا في الخلفية من وكيل رئيسي عندما تريد التوازي.
    - **TUI:** الاتصال بـ Gateway والتبديل بين الوكلاء/الجلسات.

    الوثائق: [العُقد](/ar/nodes)، [الوصول عن بُعد](/ar/gateway/remote)، [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/ar/web/tui).

  </Accordion>

  <Accordion title="هل يمكن لمتصفح OpenClaw العمل بلا واجهة مرئية؟">
    نعم. هذا خيار إعداد:

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

    القيمة الافتراضية هي `false` (بواجهة مرئية). يزيد التشغيل بلا واجهة مرئية احتمال تشغيل فحوصات مكافحة البوتات في بعض المواقع. راجع [المتصفح](/ar/tools/browser).

    يستخدم التشغيل بلا واجهة مرئية **محرك Chromium نفسه** ويعمل لمعظم الأتمتة (النماذج، النقرات، الاستخراج، تسجيلات الدخول). الفروق الرئيسية:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات الشاشة إذا احتجت إلى مرئيات).
    - بعض المواقع أكثر صرامة تجاه الأتمتة في وضع التشغيل بلا واجهة مرئية (اختبارات CAPTCHA، ومكافحة البوتات).
      على سبيل المثال، يحظر X/Twitter غالبًا الجلسات بلا واجهة مرئية.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    اضبط `browser.executablePath` على ملف Brave الثنائي لديك (أو أي متصفح مبني على Chromium) وأعد تشغيل Gateway.
    راجع أمثلة الإعداد الكاملة في [المتصفح](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gatewayات وعُقد بعيدة

<AccordionGroup>
  <Accordion title="كيف تنتقل الأوامر بين Telegram وGateway والعُقد؟">
    تتعامل **Gateway** مع رسائل Telegram. تشغّل Gateway الوكيل ثم
    تستدعي العُقد عبر **Gateway WebSocket** فقط عندما تكون هناك حاجة إلى أداة Node:

    Telegram → Gateway → الوكيل → `node.*` → Node → Gateway → Telegram

    لا ترى العُقد حركة مزود واردة؛ فهي تتلقى فقط استدعاءات RPC الخاصة بالعُقد.

  </Accordion>

  <Accordion title="كيف يمكن لوكيلي الوصول إلى حاسوبي إذا كانت Gateway مستضافة عن بُعد؟">
    الإجابة المختصرة: **اقرن حاسوبك كعقدة**. تعمل Gateway في مكان آخر، لكنها تستطيع
    استدعاء أدوات `node.*` (الشاشة، الكاميرا، النظام) على جهازك المحلي عبر Gateway WebSocket.

    الإعداد المعتاد:

    1. شغّل Gateway على المضيف دائم التشغيل (VPS/خادم منزلي).
    2. ضع مضيف Gateway وحاسوبك على شبكة tailnet نفسها.
    3. تأكد من إمكانية الوصول إلى Gateway WS (ربط tailnet أو نفق SSH).
    4. افتح تطبيق macOS محليًا واتصل في وضع **بعيد عبر SSH** (أو عبر tailnet مباشرة)
       حتى يتمكن من التسجيل كعقدة.
    5. وافق على العقدة في Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا يلزم جسر TCP منفصل؛ تتصل العُقد عبر Gateway WebSocket.

    تذكير أمني: إقران عقدة macOS يسمح بـ `system.run` على ذلك الجهاز. لا
    تقرن إلا الأجهزة التي تثق بها، وراجع [الأمان](/ar/gateway/security).

    الوثائق: [العُقد](/ar/nodes)، [بروتوكول Gateway](/ar/gateway/protocol)، [وضع macOS البعيد](/ar/platforms/mac/remote)، [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل لكنني لا أتلقى ردودًا. ماذا الآن؟">
    تحقق من الأساسيات:

    - Gateway قيد التشغيل: `openclaw gateway status`
    - صحة Gateway: `openclaw status`
    - صحة القناة: `openclaw channels status`

    ثم تحقق من المصادقة والتوجيه:

    - إذا كنت تستخدم Tailscale Serve، فتأكد من ضبط `gateway.auth.allowTailscale` بشكل صحيح.
    - إذا كنت تتصل عبر نفق SSH، فتأكد من أن النفق المحلي يعمل ويشير إلى المنفذ الصحيح.
    - تأكد من أن قوائم السماح لديك (رسائل مباشرة أو مجموعة) تتضمن حسابك.

    الوثائق: [Tailscale](/ar/gateway/tailscale)، [الوصول عن بُعد](/ar/gateway/remote)، [القنوات](/ar/channels).

  </Accordion>

  <Accordion title="هل يمكن لمثيلين من OpenClaw التحدث إلى بعضهما (محلي + VPS)؟">
    نعم. لا يوجد جسر "بوت إلى بوت" مدمج، لكن يمكنك توصيل ذلك بعدة
    طرق موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يستطيع كلا البوتين الوصول إليها (Telegram/Slack/WhatsApp).
    اجعل البوت A يرسل رسالة إلى البوت B، ثم اترك البوت B يرد كالمعتاد.

    **جسر CLI (عام):** شغّل سكربتًا يستدعي Gateway الأخرى باستخدام
    `openclaw agent --message ... --deliver`، مستهدفًا دردشة يستمع إليها البوت الآخر.
    إذا كان أحد البوتين على VPS بعيد، فوجّه CLI لديك إلى Gateway البعيدة تلك
    عبر SSH/Tailscale (راجع [الوصول عن بُعد](/ar/gateway/remote)).

    نمط مثال (شغّله من جهاز يستطيع الوصول إلى Gateway الهدف):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف حاجز أمان حتى لا يدخل البوتان في حلقة لا نهائية (بالذكر فقط، أو قوائم
    السماح للقنوات، أو قاعدة "لا ترد على رسائل البوتات").

    الوثائق: [الوصول عن بُعد](/ar/gateway/remote)، [CLI الوكيل](/ar/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى VPSات منفصلة لوكلاء متعددين؟">
    لا. يمكن لـ Gateway واحد استضافة وكلاء متعددين، لكل منهم مساحة عمله، وافتراضات نموذجه،
    وتوجيهه. هذا هو الإعداد المعتاد وهو أرخص وأبسط بكثير من تشغيل
    VPS واحد لكل وكيل.

    استخدم VPSات منفصلة فقط عندما تحتاج إلى عزل صارم (حدود أمنية) أو إعدادات
    مختلفة جدًا لا تريد مشاركتها. بخلاف ذلك، احتفظ بـ Gateway واحد واستخدم
    عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل هناك فائدة من استخدام عقدة على حاسوبي المحمول الشخصي بدلًا من SSH من VPS؟">
    نعم - العُقد هي الطريقة من الدرجة الأولى للوصول إلى حاسوبك المحمول من Gateway بعيدة، وهي
    تتيح أكثر من الوصول إلى الصدفة. تعمل Gateway على macOS/Linux (وWindows عبر WSL2) وهي
    خفيفة (يكفي VPS صغير أو صندوق من فئة Raspberry Pi؛ ذاكرة 4 GB كافية)، لذا فإن الإعداد
    الشائع هو مضيف دائم التشغيل مع حاسوبك المحمول كعقدة.

    - **لا حاجة إلى SSH وارد.** تتصل العُقد خارجيًا بـ Gateway WebSocket وتستخدم إقران الأجهزة.
    - **ضوابط تنفيذ أكثر أمانًا.** يخضع `system.run` لقوائم سماح/موافقات العقدة على ذلك الحاسوب المحمول.
    - **أدوات أجهزة أكثر.** تعرض العُقد `canvas` و`camera` و`screen` بالإضافة إلى `system.run`.
    - **أتمتة متصفح محلية.** أبقِ Gateway على VPS، لكن شغّل Chrome محليًا عبر مضيف عقدة على الحاسوب المحمول، أو اتصل بـ Chrome المحلي على المضيف عبر Chrome MCP.

    SSH مناسب للوصول العارض إلى الصدفة، لكن العُقد أبسط لسير عمل الوكلاء المستمر
    وأتمتة الأجهزة.

    الوثائق: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تشغّل العُقد خدمة Gateway؟">
    لا. يجب تشغيل **Gateway واحد** فقط لكل مضيف إلا إذا كنت تشغّل ملفات تعريف معزولة عمدًا (راجع [Gatewayات متعددة](/ar/gateway/multiple-gateways)). العُقد أطراف تتصل
    بـ Gateway (عُقد iOS/Android، أو "وضع العقدة" في macOS داخل تطبيق شريط القوائم). لمضيفي العُقد
    بلا واجهة وتحكم CLI، راجع [CLI مضيف Node](/ar/cli/node).

    يلزم إعادة تشغيل كاملة لتغييرات `gateway` و`discovery` و`canvasHost`.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق الإعداد؟">
    نعم.

    - `config.schema.lookup`: فحص فرع إعداد واحد مع عقدة مخططه السطحية، وتلميح الواجهة المطابق، وملخصات الأبناء الفورية قبل الكتابة
    - `config.get`: جلب اللقطة الحالية + التجزئة
    - `config.patch`: تحديث جزئي آمن (مفضل لمعظم تعديلات RPC)؛ يعيد التحميل الساخن عند الإمكان ويعيد التشغيل عند اللزوم
    - `config.apply`: التحقق + استبدال الإعداد الكامل؛ يعيد التحميل الساخن عند الإمكان ويعيد التشغيل عند اللزوم
    - لا تزال أداة وقت التشغيل `gateway` المخصصة للمالك فقط ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ وتُطبّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها

  </Accordion>

  <Accordion title="أبسط إعدادات سليمة للتثبيت الأول">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    يحدد هذا مساحة العمل لديك ويقيد من يمكنه تشغيل الروبوت.

  </Accordion>

  <Accordion title="كيف أعد Tailscale على VPS وأتصل من Mac؟">
    الخطوات الدنيا:

    1. **التثبيت + تسجيل الدخول على VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **التثبيت + تسجيل الدخول على Mac**
       - استخدم تطبيق Tailscale وسجل الدخول إلى نفس tailnet.
    3. **تفعيل MagicDNS (موصى به)**
       - في وحدة إدارة Tailscale، فعّل MagicDNS بحيث يكون لدى VPS اسم ثابت.
    4. **استخدام اسم مضيف tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا أردت واجهة Control UI من دون SSH، فاستخدم Tailscale Serve على VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    هذا يبقي Gateway مرتبطا بـ loopback ويكشف HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أوصل Node يعمل على Mac بـ Gateway بعيد (Tailscale Serve)؟">
    يكشف Serve **واجهة Gateway Control UI + WS**. تتصل Nodes عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكد أن VPS وMac على نفس tailnet**.
    2. **استخدم تطبيق macOS في وضع Remote** (يمكن أن يكون هدف SSH اسم مضيف tailnet).
       سيعمل التطبيق على إنشاء نفق لمنفذ Gateway والاتصال بصفته Node.
    3. **وافق على Node** في Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    المستندات: [بروتوكول Gateway](/ar/gateway/protocol)، [الاكتشاف](/ar/gateway/discovery)، [وضع macOS البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أثبت على حاسوب محمول ثان أم أضيف Node فقط؟">
    إذا كنت تحتاج فقط إلى **أدوات محلية** (الشاشة/الكاميرا/exec) على الحاسوب المحمول الثاني، فأضفه كـ
    **Node**. هذا يحافظ على Gateway واحد ويتجنب تكرار الإعدادات. أدوات Node المحلية
    حاليا خاصة بـ macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    ثبّت Gateway ثانيا فقط عندما تحتاج إلى **عزل صارم** أو روبوتين منفصلين بالكامل.

    المستندات: [Nodes](/ar/nodes)، [CLI الخاص بـ Nodes](/ar/cli/nodes)، [بوابات Gateway متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات البيئة وتحميل .env

<AccordionGroup>
  <Accordion title="كيف يحمل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات البيئة من العملية الأب (shell، launchd/systemd، CI، وما إلى ذلك) ويحمل بالإضافة إلى ذلك:

    - `.env` من دليل العمل الحالي
    - ملف `.env` احتياطي عام من `~/.openclaw/.env` (أي `$OPENCLAW_STATE_DIR/.env`)

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

    راجع [/environment](/ar/help/environment) لمعرفة الأسبقية والمصادر بالكامل.

  </Accordion>

  <Accordion title="بدأت Gateway عبر الخدمة واختفت متغيرات البيئة لدي. ماذا الآن؟">
    إصلاحان شائعان:

    1. ضع المفاتيح المفقودة في `~/.openclaw/.env` حتى تُلتقط حتى عندما لا ترث الخدمة بيئة shell لديك.
    2. فعّل استيراد shell (ميزة اختيارية):

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

    يشغّل هذا shell تسجيل الدخول لديك ويستورد فقط المفاتيح المتوقعة المفقودة (لا يتجاوز أبدا). مكافئات متغيرات البيئة:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='عينت COPILOT_GITHUB_TOKEN، لكن حالة النماذج تعرض "Shell env: off." لماذا؟'>
    يبلّغ `openclaw models status` عما إذا كان **استيراد بيئة shell** مفعلا. لا تعني "Shell env: off"
    أن متغيرات البيئة لديك مفقودة - بل تعني فقط أن OpenClaw لن يحمّل
    shell تسجيل الدخول لديك تلقائيا.

    إذا كان Gateway يعمل كخدمة (launchd/systemd)، فلن يرث بيئة
    shell لديك. أصلح ذلك بإحدى الطرق التالية:

    1. ضع الرمز المميز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد shell (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في إعداداتك (يطبق فقط إذا كان مفقودا).

    ثم أعد تشغيل gateway وتحقق مرة أخرى:

    ```bash
    openclaw models status
    ```

    تُقرأ رموز Copilot المميزة من `COPILOT_GITHUB_TOKEN` (وكذلك `GH_TOKEN` / `GITHUB_TOKEN`).
    راجع [/concepts/model-providers](/ar/concepts/model-providers) و[/environment](/ar/help/environment).

  </Accordion>
</AccordionGroup>

## الجلسات والمحادثات المتعددة

<AccordionGroup>
  <Accordion title="كيف أبدأ محادثة جديدة؟">
    أرسل `/new` أو `/reset` كرسالة مستقلة. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>

  <Accordion title="هل تُعاد الجلسات تلقائيا إذا لم أرسل /new أبدا؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا **معطل افتراضيا** (الافتراضي **0**).
    اضبطه على قيمة موجبة لتفعيل انتهاء الصلاحية بسبب الخمول. عند التفعيل، تبدأ **الرسالة التالية**
    بعد فترة الخمول معرف جلسة جديدا لمفتاح تلك الدردشة.
    هذا لا يحذف النصوص - بل يبدأ جلسة جديدة فقط.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="هل توجد طريقة لإنشاء فريق من مثيلات OpenClaw (رئيس تنفيذي واحد وعدة وكلاء)؟">
    نعم، عبر **التوجيه متعدد الوكلاء** و**الوكلاء الفرعيين**. يمكنك إنشاء وكيل منسق واحد
    وعدة وكلاء عاملين بمساحات عمل ونماذج خاصة بهم.

    مع ذلك، من الأفضل النظر إلى هذا كتجربة **ممتعة**. فهو كثيف الرموز وغالبا
    أقل كفاءة من استخدام روبوت واحد مع جلسات منفصلة. النموذج المعتاد الذي
    نتصوره هو روبوت واحد تتحدث إليه، مع جلسات مختلفة للعمل المتوازي. يمكن لذلك
    الروبوت أيضا إنشاء وكلاء فرعيين عند الحاجة.

    المستندات: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [CLI الخاص بالوكلاء](/ar/cli/agents).

  </Accordion>

  <Accordion title="لماذا اختُصر السياق في منتصف المهمة؟ كيف أمنع ذلك؟">
    سياق الجلسة محدود بنافذة النموذج. يمكن أن تؤدي المحادثات الطويلة أو مخرجات الأدوات الكبيرة أو الملفات الكثيرة
    إلى تشغيل Compaction أو الاقتطاع.

    ما يساعد:

    - اطلب من الروبوت تلخيص الحالة الحالية وكتابتها إلى ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل المواضيع.
    - احتفظ بالسياق المهم في مساحة العمل واطلب من الروبوت قراءته مرة أخرى.
    - استخدم الوكلاء الفرعيين للأعمال الطويلة أو المتوازية بحيث تبقى الدردشة الرئيسية أصغر.
    - اختر نموذجا بنافذة سياق أكبر إذا كان هذا يحدث كثيرا.

  </Accordion>

  <Accordion title="كيف أعيد ضبط OpenClaw بالكامل مع إبقائه مثبتا؟">
    استخدم أمر إعادة الضبط:

    ```bash
    openclaw reset
    ```

    إعادة ضبط كاملة غير تفاعلية:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    ثم أعد تشغيل الإعداد:

    ```bash
    openclaw onboard --install-daemon
    ```

    ملاحظات:

    - يوفر Onboarding أيضا **إعادة الضبط** إذا رأى إعدادات موجودة. راجع [Onboarding (CLI)](/ar/start/wizard).
    - إذا استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد ضبط كل دليل حالة (الافتراضيات هي `~/.openclaw-<profile>`).
    - إعادة ضبط التطوير: `openclaw gateway --dev --reset` (خاص بالتطوير فقط؛ يمسح إعدادات التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='أحصل على أخطاء "context too large" - كيف أعيد الضبط أو أجري Compaction؟'>
    استخدم أحد الخيارات التالية:

    - **Compaction** (يبقي المحادثة لكنه يلخص الأدوار الأقدم):

      ```
      /compact
      ```

      أو `/compact <instructions>` لتوجيه الملخص.

    - **إعادة الضبط** (معرف جلسة جديد لمفتاح الدردشة نفسه):

      ```
      /new
      /reset
      ```

    إذا استمر حدوث ذلك:

    - فعّل أو اضبط **تشذيب الجلسات** (`agents.defaults.contextPruning`) لتقليص مخرجات الأدوات القديمة.
    - استخدم نموذجا بنافذة سياق أكبر.

    المستندات: [Compaction](/ar/concepts/compaction)، [تشذيب الجلسات](/ar/concepts/session-pruning)، [إدارة الجلسات](/ar/concepts/session).

  </Accordion>

  <Accordion title='لماذا أرى "LLM request rejected: messages.content.tool_use.input field required"؟'>
    هذا خطأ تحقق من المزوّد: أصدر النموذج كتلة `tool_use` من دون الحقل المطلوب
    `input`. يعني ذلك عادة أن سجل الجلسة قديم أو تالف (غالبا بعد سلاسل طويلة
    أو تغيير في أداة/مخطط).

    الإصلاح: ابدأ جلسة جديدة باستخدام `/new` (رسالة مستقلة).

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

    إذا كان `HEARTBEAT.md` موجودا لكنه فارغ فعليا (أسطر فارغة فقط ورؤوس markdown
    مثل `# Heading`)، يتجاوز OpenClaw تشغيل Heartbeat لتوفير استدعاءات API.
    إذا كان الملف مفقودا، فسيظل Heartbeat يعمل ويقرر النموذج ما يجب فعله.

    تستخدم التجاوزات لكل وكيل `agents.list[].heartbeat`. المستندات: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل أحتاج إلى إضافة "حساب روبوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك الخاص**، لذلك إذا كنت في المجموعة، يمكن لـ OpenClaw رؤيتها.
    افتراضيا، تُحظر ردود المجموعة حتى تسمح بالمرسلين (`groupPolicy: "allowlist"`).

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
    الخيار 1 (الأسرع): راقب السجلات وأرسل رسالة اختبار في المجموعة:

    ```bash
    openclaw logs --follow --json
    ```

    ابحث عن `chatId` (أو `from`) ينتهي بـ `@g.us`، مثل:
    `1234567890-1234567890@g.us`.

    الخيار 2 (إذا كان مهيأ/مسموحا به مسبقا): اعرض المجموعات من الإعدادات:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    المستندات: [WhatsApp](/ar/channels/whatsapp)، [الدليل](/ar/cli/directory)، [السجلات](/ar/cli/logs).

  </Accordion>

  <Accordion title="لماذا لا يرد OpenClaw في مجموعة؟">
    سببان شائعان:

    - تقييد الإشارة مفعّل (افتراضي). يجب أن تذكر الروبوت بـ @mention (أو تطابق `mentionPatterns`).
    - قمت بتهيئة `channels.whatsapp.groups` من دون `"*"` والمجموعة غير مدرجة في allowlist.

    راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشارك المجموعات/السلاسل السياق مع الرسائل المباشرة؟">
    تُطوى الدردشات المباشرة إلى الجلسة الرئيسية افتراضيا. للمجموعات/القنوات مفاتيح جلسات خاصة بها، وموضوعات Telegram / سلاسل Discord هي جلسات منفصلة. راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم عدد مساحات العمل والوكلاء الذين يمكنني إنشاؤهم؟">
    لا توجد حدود صارمة. العشرات (بل حتى المئات) جيدة، لكن انتبه إلى:

    - **نمو القرص:** تعيش الجلسات + النصوص ضمن `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** مزيد من الوكلاء يعني مزيدا من استخدام النماذج المتزامن.
    - **عبء العمليات:** ملفات تعريف المصادقة ومساحات العمل وتوجيه القنوات لكل وكيل.

    نصائح:

    - احتفظ بمساحة عمل **نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - شذّب الجلسات القديمة (احذف JSONL أو إدخالات التخزين) إذا كبر القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل المتناثرة وعدم تطابق ملفات التعريف.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة بوتات أو محادثات في الوقت نفسه (Slack)، وكيف ينبغي إعداد ذلك؟">
    نعم. استخدم **توجيه الوكلاء المتعددين** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة حسب
    القناة/الحساب/النظير. Slack مدعوم كقناة ويمكن ربطه بوكلاء محددين.

    الوصول عبر المتصفح قوي لكنه لا يعني "افعل أي شيء يستطيع الإنسان فعله" - فقد تظل آليات مكافحة البوتات، وCAPTCHAs، وMFA
    تمنع الأتمتة. للتحكم الأكثر موثوقية في المتصفح، استخدم Chrome MCP المحلي على المضيف،
    أو استخدم CDP على الجهاز الذي يشغّل المتصفح فعليًا.

    إعداد أفضل الممارسات:

    - مضيف Gateway يعمل دائمًا (VPS/Mac mini).
    - وكيل واحد لكل دور (روابط).
    - قناة/قنوات Slack مرتبطة بهؤلاء الوكلاء.
    - متصفح محلي عبر Chrome MCP أو node عند الحاجة.

    الوثائق: [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)، [Slack](/ar/channels/slack)،
    [المتصفح](/ar/tools/browser)، [Nodes](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج، تجاوز الفشل، وملفات تعريف المصادقة

أسئلة وأجوبة النماذج — الافتراضيات، الاختيار، الأسماء المستعارة، التبديل، تجاوز الفشل، ملفات تعريف المصادقة —
موجودة في [الأسئلة الشائعة حول النماذج](/ar/help/faq-models).

## Gateway: المنافذ، "قيد التشغيل بالفعل"، والوضع البعيد

<AccordionGroup>
  <Accordion title="ما المنفذ الذي يستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ الواحد متعدد الاستخدامات لـ WebSocket + HTTP (Control UI، hooks، إلخ).

    ترتيب الأولوية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status عبارة "Runtime: running" لكن "Connectivity probe: failed"؟'>
    لأن "running" هي رؤية **المشرف** (launchd/systemd/schtasks). أما فحص الاتصال فهو اتصال CLI فعليًا بـ WebSocket الخاص بالبوابة.

    استخدم `openclaw gateway status` وثق بهذه الأسطر:

    - `Probe target:` (عنوان URL الذي استخدمه الفحص فعليًا)
    - `Listening:` (ما هو مرتبط فعليًا على المنفذ)
    - `Last gateway error:` (السبب الجذري الشائع عندما تكون العملية حية لكن المنفذ لا يستمع)

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status أن "Config (cli)" و"Config (service)" مختلفان؟'>
    أنت تعدّل ملف إعدادات بينما تعمل الخدمة بملف آخر (غالبًا عدم تطابق `--profile` / `OPENCLAW_STATE_DIR`).

    الإصلاح:

    ```bash
    openclaw gateway install --force
    ```

    شغّل ذلك من نفس `--profile` / البيئة التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ماذا تعني عبارة "another gateway instance is already listening"؟'>
    يفرض OpenClaw قفل تشغيل عبر ربط مستمع WebSocket فورًا عند بدء التشغيل (الافتراضي `ws://127.0.0.1:18789`). إذا فشل الربط مع `EADDRINUSE`، فإنه يرمي `GatewayLockError` مشيرًا إلى أن نسخة أخرى تستمع بالفعل.

    الإصلاح: أوقف النسخة الأخرى، أو حرر المنفذ، أو شغّل باستخدام `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="كيف أشغّل OpenClaw في الوضع البعيد (يتصل العميل بـ Gateway في مكان آخر)؟">
    اضبط `gateway.mode: "remote"` ووجّه إلى عنوان WebSocket بعيد، اختياريًا مع بيانات اعتماد بعيدة بسر مشترك:

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

    - يبدأ `openclaw gateway` فقط عندما يكون `gateway.mode` هو `local` (أو تمرر علم التجاوز).
    - يراقب تطبيق macOS ملف الإعدادات ويبدّل الأوضاع مباشرة عند تغيّر هذه القيم.
    - `gateway.remote.token` / `.password` هي بيانات اعتماد بعيدة من جانب العميل فقط؛ ولا تفعّل مصادقة Gateway المحلي وحدها.

  </Accordion>

  <Accordion title='تقول Control UI "unauthorized" (أو تواصل إعادة الاتصال). ماذا الآن؟'>
    مسار مصادقة Gateway لديك وطريقة مصادقة واجهة المستخدم غير متطابقين.

    حقائق (من الكود):

    - تحتفظ Control UI بالرمز في `sessionStorage` لجلسة تبويب المتصفح الحالية وعنوان Gateway URL المحدد، لذا تستمر عمليات التحديث في التبويب نفسه في العمل دون استعادة استمرار رمز localStorage طويل العمر.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة واحدة محدودة باستخدام رمز جهاز مخزن مؤقتًا عندما يعيد Gateway تلميحات إعادة المحاولة (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - إعادة المحاولة بذلك الرمز المخزن مؤقتًا تعيد الآن استخدام النطاقات المعتمدة المخزنة مؤقتًا مع رمز الجهاز. ما زال مستدعو `deviceToken` الصريح / `scopes` الصريحة يحتفظون بمجموعة النطاقات المطلوبة بدلًا من وراثة النطاقات المخزنة مؤقتًا.
    - خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال هي الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز bootstrap.
    - فحوص نطاق رمز bootstrap مسبوقة بالدور. قائمة السماح المدمجة لمشغل bootstrap تفي فقط بطلبات المشغل؛ ما زالت أدوار node أو الأدوار الأخرى غير المشغلة تحتاج إلى نطاقات تحت بادئة دورها الخاص.

    الإصلاح:

    - الأسرع: `openclaw dashboard` (يطبع + ينسخ عنوان URL للوحة التحكم، ويحاول فتحه؛ ويعرض تلميح SSH إذا كان بلا واجهة).
    - إذا لم يكن لديك رمز بعد: `openclaw doctor --generate-gateway-token`.
    - إذا كان بعيدًا، أنشئ نفقًا أولًا: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع السر المشترك: اضبط `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم الصق السر المطابق في إعدادات Control UI.
    - وضع Tailscale Serve: تأكد من تفعيل `gateway.auth.allowTailscale` وأنك تفتح عنوان URL الخاص بـ Serve، وليس عنوان loopback/tailnet خامًا يتجاوز ترويسات هوية Tailscale.
    - وضع الوكيل الموثوق: تأكد من أنك تأتي عبر الوكيل المدرك للهوية المُعد، وليس عنوان Gateway خامًا. تحتاج وكلاء local loopback على المضيف نفسه أيضًا إلى `gateway.auth.trustedProxy.allowLoopback = true`.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، فدوّر/أعد اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا قالت استدعاءة التدوير إنها رُفضت، فتحقق من أمرين:
      - يمكن لجلسات الجهاز المقترن تدوير جهازها **الخاص** فقط ما لم تكن لديها أيضًا `operator.admin`
      - لا يمكن لقيم `--scope` الصريحة تجاوز نطاقات المشغل الحالية للمتصل
    - ما زلت عالقًا؟ شغّل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [لوحة التحكم](/ar/web/dashboard) لتفاصيل المصادقة.

  </Accordion>

  <Accordion title="ضبطت gateway.bind على tailnet لكنه لا يستطيع الربط ولا يوجد شيء يستمع">
    يختار ربط `tailnet` عنوان IP من Tailscale من واجهات الشبكة لديك (100.64.0.0/10). إذا لم يكن الجهاز على Tailscale (أو كانت الواجهة معطلة)، فلا يوجد شيء للربط به.

    الإصلاح:

    - ابدأ Tailscale على ذلك المضيف (ليحصل على عنوان 100.x)، أو
    - انتقل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. يفضّل `auto` loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطًا مخصصًا لـ tailnet فقط.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة Gateways على المضيف نفسه؟">
    عادةً لا - يمكن لـ Gateway واحد تشغيل عدة قنوات مراسلة ووكلاء. استخدم عدة Gateways فقط عندما تحتاج إلى تكرار (مثال: بوت إنقاذ) أو عزل صارم.

    نعم، لكن يجب عليك العزل:

    - `OPENCLAW_CONFIG_PATH` (إعدادات لكل نسخة)
    - `OPENCLAW_STATE_DIR` (حالة لكل نسخة)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (موصى به):

    - استخدم `openclaw --profile <name> ...` لكل نسخة (ينشئ تلقائيًا `~/.openclaw-<name>`).
    - اضبط `gateway.port` فريدًا في إعدادات كل ملف تعريف (أو مرر `--port` للتشغيل اليدوي).
    - ثبّت خدمة لكل ملف تعريف: `openclaw --profile <name> gateway install`.

    تضيف ملفات التعريف أيضًا لاحقة إلى أسماء الخدمات (`ai.openclaw.<profile>`؛ القديمة `com.openclaw.*`، `openclaw-gateway-<profile>.service`، `OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [Gateways متعددة](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ماذا تعني "invalid handshake" / الرمز 1008؟'>
    Gateway هو **خادم WebSocket**، ويتوقع أن تكون الرسالة الأولى تمامًا
    إطار `connect`. إذا تلقى أي شيء آخر، يغلق الاتصال
    باستخدام **الرمز 1008** (انتهاك للسياسة).

    الأسباب الشائعة:

    - فتحت عنوان URL الخاص بـ **HTTP** في متصفح (`http://...`) بدلًا من عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - أزال وكيل أو نفق ترويسات المصادقة أو أرسل طلبًا ليس لـ Gateway.

    إصلاحات سريعة:

    1. استخدم عنوان WS URL: `ws://<host>:18789` (أو `wss://...` إذا كان HTTPS).
    2. لا تفتح منفذ WS في تبويب متصفح عادي.
    3. إذا كانت المصادقة مفعلة، فأدرج الرمز/كلمة المرور في إطار `connect`.

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

    يمكنك ضبط مسار ثابت عبر `logging.file`. يتحكم `logging.level` في مستوى سجل الملف. تتحكم `--verbose` و`logging.consoleLevel` في إسهاب وحدة التحكم.

    أسرع طريقة لمتابعة السجل:

    ```bash
    openclaw logs --follow
    ```

    سجلات الخدمة/المشرف (عندما يعمل Gateway عبر launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` و`gateway.err.log` (الافتراضي: `~/.openclaw/logs/...`؛ تستخدم ملفات التعريف `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting) للمزيد.

  </Accordion>

  <Accordion title="كيف أبدأ/أوقف/أعيد تشغيل خدمة Gateway؟">
    استخدم مساعدات Gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا شغّلت Gateway يدويًا، فيمكن لـ `openclaw gateway --force` استعادة المنفذ. راجع [Gateway](/ar/gateway).

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

    إذا لم تثبّت الخدمة قط، فابدأها في الواجهة الأمامية:

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

    الوثائق: [Windows (WSL2)](/ar/platforms/windows)، [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="Gateway يعمل لكن الردود لا تصل أبدًا. ماذا يجب أن أتحقق منه؟">
    ابدأ بفحص صحة سريع:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    الأسباب الشائعة:

    - لم يتم تحميل مصادقة النموذج على **مضيف gateway** (تحقق من `models status`).
    - اقتران القناة/قائمة السماح تمنع الردود (تحقق من إعدادات القناة + السجلات).
    - WebChat/Dashboard مفتوح دون الرمز الصحيح.

    إذا كنت بعيدًا، فتأكد أن اتصال النفق/Tailscale يعمل وأن
    WebSocket الخاص بـ Gateway قابل للوصول.

    الوثائق: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ماذا الآن؟'>
    يعني هذا عادةً أن واجهة المستخدم فقدت اتصال WebSocket. تحقق من:

    1. هل يعمل Gateway؟ `openclaw gateway status`
    2. هل Gateway بحالة سليمة؟ `openclaw status`
    3. هل تملك UI الرمز الصحيح؟ `openclaw dashboard`
    4. إذا كان الوصول عن بُعد، فهل رابط النفق/Tailscale يعمل؟

    ثم تابع السجلات:

    ```bash
    openclaw logs --follow
    ```

    الوثائق: [لوحة التحكم](/ar/web/dashboard)، [الوصول عن بُعد](/ar/gateway/remote)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

  </Accordion>

  <Accordion title="يفشل Telegram setMyCommands. ما الذي يجب أن أتحقق منه؟">
    ابدأ بالسجلات وحالة القناة:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    ثم طابق الخطأ:

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على عدد كبير جدًا من الإدخالات. يقوم OpenClaw بالفعل بالقص إلى حد Telegram ويعيد المحاولة بأوامر أقل، لكن بعض إدخالات القائمة لا تزال بحاجة إلى إزالتها. قلّل أوامر Plugin/Skills/المخصصة، أو عطّل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed`، أو `Network request for 'setMyCommands' failed!`، أو أخطاء شبكة مشابهة: إذا كنت على VPS أو خلف وكيل، فتأكد من السماح باتصالات HTTPS الصادرة وأن DNS يعمل مع `api.telegram.org`.

    إذا كان Gateway بعيدًا، فتأكد من أنك تنظر إلى السجلات على مضيف Gateway.

    الوثائق: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="لا يعرض TUI أي مخرجات. ما الذي يجب أن أتحقق منه؟">
    تأكد أولًا من إمكانية الوصول إلى Gateway وأن الوكيل يمكنه العمل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لرؤية الحالة الحالية. إذا كنت تتوقع ردودًا في قناة دردشة،
    فتأكد من تمكين التسليم (`/deliver on`).

    الوثائق: [TUI](/ar/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway بالكامل ثم أبدأه؟">
    إذا كنت قد ثبّت الخدمة:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    يؤدي هذا إلى إيقاف/بدء **الخدمة المُدارة** (launchd على macOS، وsystemd على Linux).
    استخدم هذا عندما يعمل Gateway في الخلفية كخدمة خفية.

    إذا كنت تشغّله في المقدمة، فأوقفه باستخدام Ctrl-C، ثم:

    ```bash
    openclaw gateway run
    ```

    الوثائق: [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="شرح مبسط: openclaw gateway restart مقابل openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **خدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغّل Gateway **في المقدمة** لجلسة الطرفية هذه.

    إذا كنت قد ثبّت الخدمة، فاستخدم أوامر Gateway. استخدم `openclaw gateway` عندما
    تريد تشغيلًا لمرة واحدة في المقدمة.

  </Accordion>

  <Accordion title="أسرع طريقة للحصول على تفاصيل أكثر عند حدوث فشل">
    ابدأ Gateway باستخدام `--verbose` للحصول على تفاصيل أكثر في وحدة التحكم. ثم افحص ملف السجل بحثًا عن أخطاء مصادقة القنوات، وتوجيه النماذج، وRPC.
  </Accordion>
</AccordionGroup>

## الوسائط والمرفقات

<AccordionGroup>
  <Accordion title="أنشأت Skills لدي صورة/PDF، لكن لم يتم إرسال أي شيء">
    يجب أن تتضمن المرفقات الصادرة من الوكيل سطر `MEDIA:<path-or-url>` (في سطر مستقل). راجع [إعداد مساعد OpenClaw](/ar/start/openclaw) و[إرسال الوكيل](/ar/tools/agent-send).

    الإرسال عبر CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    تحقق أيضًا من:

    - أن القناة الهدف تدعم الوسائط الصادرة وليست محظورة بقوائم السماح.
    - أن الملف ضمن حدود حجم المزوّد (يُعاد تحجيم الصور إلى حد أقصى 2048px).
    - `tools.fs.workspaceOnly=true` يبقي الإرسال من المسارات المحلية محدودًا إلى مساحة العمل، وtemp/media-store، والملفات التي تحقق منها sandbox.
    - `tools.fs.workspaceOnly=false` يسمح لـ `MEDIA:` بإرسال ملفات محلية على المضيف يمكن للوكيل قراءتها بالفعل، لكن للوسائط وأنواع المستندات الآمنة فقط (الصور، والصوت، والفيديو، وPDF، ومستندات Office). تظل الملفات النصية العادية والملفات الشبيهة بالأسرار محظورة.

    راجع [الصور](/ar/nodes/images).

  </Accordion>
</AccordionGroup>

## الأمان والتحكم في الوصول

<AccordionGroup>
  <Accordion title="هل من الآمن تعريض OpenClaw للرسائل المباشرة الواردة؟">
    تعامل مع الرسائل المباشرة الواردة كمدخلات غير موثوقة. صُممت الإعدادات الافتراضية لتقليل المخاطر:

    - السلوك الافتراضي على القنوات التي تدعم الرسائل المباشرة هو **الإقران**:
      - يتلقى المرسلون غير المعروفين رمز إقران؛ ولا يعالج البوت رسالتهم.
      - وافق باستخدام: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - تُحد الطلبات المعلّقة عند **3 لكل قناة**؛ تحقق من `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل الرمز.
    - يتطلب فتح الرسائل المباشرة للعامة موافقة صريحة (`dmPolicy: "open"` وقائمة سماح `"*"`).

    شغّل `openclaw doctor` لإظهار سياسات الرسائل المباشرة الخطرة.

  </Accordion>

  <Accordion title="هل حقن الموجهات مصدر قلق للبوتات العامة فقط؟">
    لا. حقن الموجهات يتعلق بـ **المحتوى غير الموثوق**، وليس فقط بمن يمكنه إرسال رسالة مباشرة إلى البوت.
    إذا كان مساعدك يقرأ محتوى خارجيًا (بحث/جلب ويب، صفحات متصفح، رسائل بريد إلكتروني،
    مستندات، مرفقات، سجلات ملصقة)، فيمكن أن يتضمن ذلك المحتوى تعليمات تحاول
    اختطاف النموذج. يمكن أن يحدث هذا حتى إذا **كنت أنت المرسل الوحيد**.

    يكون الخطر الأكبر عند تمكين الأدوات: يمكن خداع النموذج ليُسرّب السياق أو يستدعي الأدوات نيابة عنك. قلّل نطاق الضرر عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو بلا أدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` معطلة للوكلاء الممكّنة أدواتهم
    - التعامل مع نصوص الملفات/المستندات المفكوكة كغير موثوقة أيضًا: يقوم OpenResponses
      `input_file` واستخراج مرفقات الوسائط كلاهما بتغليف النص المستخرج بعلامات حدود صريحة للمحتوى الخارجي بدلًا من تمرير نص الملف الخام
    - العزل في sandbox وقوائم السماح الصارمة للأدوات

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يجب أن يكون للبوت بريد إلكتروني أو حساب GitHub أو رقم هاتف خاص به؟">
    نعم، لمعظم الإعدادات. يؤدي عزل البوت بحسابات وأرقام هاتف منفصلة إلى تقليل نطاق الضرر إذا حدث خطأ. كما يسهل هذا تدوير بيانات الاعتماد أو إلغاء الوصول دون التأثير على حساباتك الشخصية.

    ابدأ على نطاق صغير. امنح الوصول فقط إلى الأدوات والحسابات التي تحتاجها فعليًا، ثم وسّع
    لاحقًا إذا لزم الأمر.

    الوثائق: [الأمان](/ar/gateway/security)، [الإقران](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية وهل هذا آمن؟">
    نحن **لا** نوصي بالاستقلالية الكاملة على رسائلك الشخصية. النمط الأكثر أمانًا هو:

    - أبقِ الرسائل المباشرة في **وضع الإقران** أو ضمن قائمة سماح ضيقة.
    - استخدم **رقمًا أو حسابًا منفصلًا** إذا كنت تريده أن يرسل الرسائل نيابة عنك.
    - دعه يصيغ المسودة، ثم **وافق قبل الإرسال**.

    إذا أردت التجربة، فافعل ذلك على حساب مخصص وأبقِه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل للدردشة فقط وكانت المدخلات موثوقة. تكون الفئات الأصغر
    أكثر عرضة لاختطاف التعليمات، لذا تجنبها للوكلاء الممكّنة أدواتهم
    أو عند قراءة محتوى غير موثوق. إذا كان لا بد من استخدام نموذج أصغر، فقيّد
    الأدوات وشغّله داخل sandbox. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="شغّلت /start في Telegram لكنني لم أحصل على رمز إقران">
    تُرسل رموز الإقران **فقط** عندما يراسل مرسل غير معروف البوت ويكون
    `dmPolicy: "pairing"` مُمكّنًا. لا ينشئ `/start` وحده رمزًا.

    تحقق من الطلبات المعلّقة:

    ```bash
    openclaw pairing list telegram
    ```

    إذا كنت تريد وصولًا فوريًا، فأضف معرّف المرسل لديك إلى قائمة السماح أو عيّن `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيرسل رسائل إلى جهات اتصالي؟ كيف يعمل الإقران؟">
    لا. سياسة الرسائل المباشرة الافتراضية في WhatsApp هي **الإقران**. يحصل المرسلون غير المعروفين فقط على رمز إقران ولا تتم **معالجة** رسالتهم. يرد OpenClaw فقط على الدردشات التي يتلقاها أو على عمليات الإرسال الصريحة التي تشغّلها.

    وافق على الإقران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اسرد الطلبات المعلّقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لتعيين **قائمة السماح/المالك** لديك بحيث يُسمح برسائلك المباشرة. لا تُستخدم للإرسال التلقائي. إذا كنت تعمل على رقم WhatsApp الشخصي لديك، فاستخدم ذلك الرقم ومكّن `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، وإحباط المهام، و"لن يتوقف"

<AccordionGroup>
  <Accordion title="كيف أوقف ظهور رسائل النظام الداخلية في الدردشة؟">
    تظهر معظم الرسائل الداخلية أو رسائل الأدوات فقط عندما تكون **verbose** أو **trace** أو **reasoning** مفعّلة
    لتلك الجلسة.

    أصلح ذلك في الدردشة التي تراها فيها:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    إذا بقيت الضوضاء، فتحقق من إعدادات الجلسة في Control UI واضبط verbose
    على **inherit**. تأكد أيضًا من أنك لا تستخدم ملف تعريف بوت يحتوي على `verboseDefault` مضبوط
    على `on` في الإعدادات.

    الوثائق: [التفكير وverbose](/ar/tools/thinking)، [الأمان](/ar/gateway/security/index#reasoning-and-verbose-output-in-groups).

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

    هذه محفزات إحباط (وليست أوامر بشرطة مائلة).

    للعمليات الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

    ```
    process action:kill sessionId:XXX
    ```

    نظرة عامة على أوامر الشرطة المائلة: راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

    يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`، لكن بعض الاختصارات (مثل `/status`) تعمل أيضًا داخل السطر للمرسلين الموجودين في قائمة السماح.

  </Accordion>

  <Accordion title='كيف أرسل رسالة Discord من Telegram؟ ("Cross-context messaging denied")'>
    يحظر OpenClaw المراسلة **عبر المزوّدين** افتراضيًا. إذا كان استدعاء أداة مرتبطًا
    بـ Telegram، فلن يرسل إلى Discord ما لم تسمح بذلك صراحة.

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

    أعد تشغيل Gateway بعد تحرير الإعدادات.

  </Accordion>

  <Accordion title='لماذا يبدو أن البوت "يتجاهل" الرسائل السريعة المتتالية؟'>
    يتحكم وضع قائمة الانتظار في كيفية تفاعل الرسائل الجديدة مع تشغيل جارٍ. استخدم `/queue` لتغيير الأوضاع:

    - `steer` - يضع كل التوجيه المعلّق في قائمة الانتظار عند حد النموذج التالي في التشغيل الحالي
    - `queue` - توجيه قديم واحدًا تلو الآخر
    - `followup` - يشغّل الرسائل واحدة تلو الأخرى
    - `collect` - يجمع الرسائل ويرد مرة واحدة
    - `steer-backlog` - يوجّه الآن، ثم يعالج الأعمال المتراكمة
    - `interrupt` - يحبط التشغيل الحالي ويبدأ من جديد

    الوضع الافتراضي هو `steer`. يمكنك إضافة خيارات مثل `debounce:0.5s cap:25 drop:summarize` لأوضاع المتابعة. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما النموذج الافتراضي لـ Anthropic عند استخدام مفتاح API؟'>
    في OpenClaw، تكون بيانات الاعتماد واختيار النموذج منفصلين. يؤدي ضبط `ANTHROPIC_API_KEY` (أو تخزين مفتاح Anthropic API في ملفات تعريف المصادقة) إلى تمكين المصادقة، لكن النموذج الافتراضي الفعلي هو ما تضبطه في `agents.defaults.model.primary` (على سبيل المثال، `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). إذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم يتمكن من العثور على بيانات اعتماد Anthropic في ملف `auth-profiles.json` المتوقع للوكيل قيد التشغيل.
  </Accordion>
</AccordionGroup>

---

ما زلت عالقًا؟ اطرح سؤالًا في [Discord](https://discord.com/invite/clawd) أو افتح [نقاشًا على GitHub](https://github.com/openclaw/openclaw/discussions).

## ذات صلة

- [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run) — التثبيت، الإعداد الأولي، المصادقة، الاشتراكات، الإخفاقات المبكرة
- [الأسئلة الشائعة حول النماذج](/ar/help/faq-models) — اختيار النموذج، التحويل عند الفشل، ملفات تعريف المصادقة
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) — الفرز بدءًا من الأعراض
