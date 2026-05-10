---
read_when:
    - الإجابة عن الأسئلة الشائعة المتعلقة بالإعداد أو التثبيت أو التهيئة الأولية أو دعم وقت التشغيل
    - فرز المشكلات التي يبلّغ عنها المستخدمون قبل التعمق في تصحيح الأخطاء
summary: الأسئلة الشائعة حول إعداد OpenClaw وتكوينه واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-05-10T19:43:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121de36647f7452969b760d6b6ab0a6b1b776d63987ca6ba0be1c8cf4c9f85e9
    source_path: help/faq.md
    workflow: 16
---

إجابات سريعة مع استكشاف أعمق للمشكلات في الإعدادات الواقعية (التطوير المحلي، VPS، تعدد الوكلاء، OAuth/مفاتيح API، تجاوز فشل النماذج). لتشخيصات وقت التشغيل، راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). للمرجع الكامل للإعدادات، راجع [الإعدادات](/ar/gateway/configuration).

## أول 60 ثانية إذا كان شيء ما معطلا

1. **الحالة السريعة (أول فحص)**

   ```bash
   openclaw status
   ```

   ملخص محلي سريع: نظام التشغيل + التحديث، قابلية الوصول إلى Gateway/الخدمة، الوكلاء/الجلسات، إعدادات المزوّد + مشكلات وقت التشغيل (عندما يكون Gateway قابلا للوصول).

2. **تقرير قابل للصق (آمن للمشاركة)**

   ```bash
   openclaw status --all
   ```

   تشخيص للقراءة فقط مع ذيل السجل (مع تنقيح الرموز).

3. **حالة الخفي + المنفذ**

   ```bash
   openclaw gateway status
   ```

   يعرض وقت تشغيل المشرف مقابل قابلية الوصول عبر RPC، وعنوان URL لهدف الفحص، وأي إعدادات استخدمتها الخدمة غالبا.

4. **فحوصات عميقة**

   ```bash
   openclaw status --deep
   ```

   يشغل فحصا حيا لصحة Gateway، بما في ذلك فحوصات القنوات عندما تكون مدعومة
   (يتطلب Gateway قابلا للوصول). راجع [الصحة](/ar/gateway/health).

5. **تتبع أحدث سجل**

   ```bash
   openclaw logs --follow
   ```

   إذا كان RPC متوقفا، فارجع إلى:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   سجلات الملفات منفصلة عن سجلات الخدمة؛ راجع [التسجيل](/ar/logging) و[استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

6. **تشغيل الطبيب (الإصلاحات)**

   ```bash
   openclaw doctor
   ```

   يصلح/يرحل الإعدادات/الحالة + يشغل فحوصات الصحة. راجع [Doctor](/ar/gateway/doctor).

7. **لقطة Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   يطلب من Gateway قيد التشغيل لقطة كاملة (WS فقط). راجع [الصحة](/ar/gateway/health).

## البدء السريع وإعداد التشغيل الأول

أسئلة وأجوبة التشغيل الأول — التثبيت، الإعداد الأولي، مسارات المصادقة، الاشتراكات، الإخفاقات الأولية —
موجودة في [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run).

## ما هو OpenClaw؟

<AccordionGroup>
  <Accordion title="ما هو OpenClaw، في فقرة واحدة؟">
    OpenClaw مساعد ذكاء اصطناعي شخصي تشغله على أجهزتك الخاصة. يرد على واجهات المراسلة التي تستخدمها بالفعل (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، وPlugins القنوات المضمنة مثل QQ Bot) ويمكنه أيضا تنفيذ الصوت + Canvas حي على المنصات المدعومة. **Gateway** هو مستوى التحكم الدائم التشغيل؛ والمساعد هو المنتج.
  </Accordion>

  <Accordion title="عرض القيمة">
    OpenClaw ليس "مجرد غلاف لـ Claude." إنه **مستوى تحكم محلي أولا** يتيح لك تشغيل
    مساعد قادر على **عتادك الخاص**، ويمكن الوصول إليه من تطبيقات الدردشة التي تستخدمها بالفعل، مع
    جلسات ذات حالة وذاكرة وأدوات - دون تسليم التحكم في تدفقات عملك إلى
    SaaS مستضاف.

    أبرز الميزات:

    - **أجهزتك، بياناتك:** شغل Gateway أينما تريد (Mac، Linux، VPS) واحتفظ
      بمساحة العمل + سجل الجلسات محليا.
    - **قنوات حقيقية، لا صندوق ويب معزول:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/إلخ،
      إضافة إلى الصوت على الجوال وCanvas على المنصات المدعومة.
    - **محايد تجاه النماذج:** استخدم Anthropic، OpenAI، MiniMax، OpenRouter، إلخ، مع توجيه
      لكل وكيل وتجاوز فشل.
    - **خيار محلي فقط:** شغل نماذج محلية حتى **تبقى كل البيانات على جهازك** إذا أردت.
    - **توجيه متعدد الوكلاء:** افصل الوكلاء حسب القناة أو الحساب أو المهمة، ولكل منهم
      مساحة عمل وإعدادات افتراضية خاصة به.
    - **مفتوح المصدر وقابل للتعديل:** افحصه ووسعه واستضفه ذاتيا دون احتكار من المورّد.

    المستندات: [Gateway](/ar/gateway)، [القنوات](/ar/channels)، [تعدد الوكلاء](/ar/concepts/multi-agent)،
    [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="لقد أعددته للتو - ماذا أفعل أولا؟">
    مشاريع أولى جيدة:

    - أنشئ موقعا إلكترونيا (WordPress أو Shopify أو موقعا ثابتا بسيطا).
    - ابن نموذجا أوليا لتطبيق جوال (مخطط، شاشات، خطة API).
    - نظم الملفات والمجلدات (تنظيف، تسمية، وسم).
    - صل Gmail وأتمت الملخصات أو المتابعات.

    يمكنه التعامل مع المهام الكبيرة، لكنه يعمل بأفضل شكل عندما تقسمها إلى مراحل وتستخدم
    الوكلاء الفرعيين للعمل المتوازي.

  </Accordion>

  <Accordion title="ما أبرز خمسة استخدامات يومية لـ OpenClaw؟">
    المكاسب اليومية تبدو غالبا كالتالي:

    - **موجزات شخصية:** ملخصات لصندوق الوارد والتقويم والأخبار التي تهتم بها.
    - **البحث والصياغة:** بحث سريع وملخصات ومسودات أولى لرسائل البريد أو المستندات.
    - **التذكيرات والمتابعات:** تنبيهات وقوائم تحقق مدفوعة بـ Cron أو Heartbeat.
    - **أتمتة المتصفح:** ملء النماذج وجمع البيانات وتكرار مهام الويب.
    - **التنسيق عبر الأجهزة:** أرسل مهمة من هاتفك، ودع Gateway يشغلها على خادم، واحصل على النتيجة في الدردشة.

  </Accordion>

  <Accordion title="هل يمكن أن يساعد OpenClaw في توليد العملاء المحتملين والتواصل والإعلانات والمدونات لـ SaaS؟">
    نعم في **البحث والتأهيل والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات للتواصل أو نصوص الإعلانات.

    بالنسبة إلى **حملات التواصل أو الإعلانات**، أبق الإنسان ضمن الحلقة. تجنب الرسائل المزعجة، واتبع القوانين المحلية
    وسياسات المنصات، وراجع أي شيء قبل إرساله. النمط الأكثر أمانا هو أن يكتب
    OpenClaw المسودة ثم توافق عليها.

    المستندات: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما المزايا مقارنة بـ Claude Code لتطوير الويب؟">
    OpenClaw هو **مساعد شخصي** وطبقة تنسيق، وليس بديلا عن IDE. استخدم
    Claude Code أو Codex لأسرع حلقة ترميز مباشرة داخل مستودع. استخدم OpenClaw عندما
    تريد ذاكرة دائمة، ووصولا عبر الأجهزة، وتنسيقا للأدوات.

    المزايا:

    - **ذاكرة + مساحة عمل دائمتان** عبر الجلسات
    - **وصول متعدد المنصات** (WhatsApp، Telegram، TUI، WebChat)
    - **تنسيق الأدوات** (المتصفح، الملفات، الجدولة، الخطافات)
    - **Gateway دائم التشغيل** (شغله على VPS، وتفاعل معه من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/التنفيذ المحلي

    معرض الأمثلة: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="كيف أخصص Skills دون إبقاء المستودع متسخا؟">
    استخدم التجاوزات المُدارة بدلا من تعديل نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). ترتيب الأولوية هو `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمنة → `skills.load.extraDirs`، لذا تظل التجاوزات المُدارة تتغلب على Skills المضمنة دون لمس git. إذا كنت تحتاج إلى تثبيت Skill عالميا لكن جعله مرئيا لبعض الوكلاء فقط، فاحتفظ بالنسخة المشتركة في `~/.openclaw/skills` وتحكم في الظهور باستخدام `agents.defaults.skills` و`agents.list[].skills`. يجب أن تعيش التعديلات الجديرة بالإرسال إلى المنبع فقط في المستودع وتخرج كـ PRs.
  </Accordion>

  <Accordion title="هل يمكنني تحميل Skills من مجلد مخصص؟">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (أدنى أولوية). ترتيب الأولوية الافتراضي هو `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمنة → `skills.load.extraDirs`. يثبت `clawhub` في `./skills` افتراضيا، وهو ما يعامله OpenClaw كـ `<workspace>/skills` في الجلسة التالية. إذا كان يجب أن تكون Skill مرئية لوكلاء معينين فقط، فاقرن ذلك مع `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="كيف يمكنني استخدام نماذج مختلفة لمهام مختلفة؟">
    الأنماط المدعومة اليوم هي:

    - **مهام Cron**: يمكن للمهام المعزولة تعيين تجاوز `model` لكل مهمة.
    - **الوكلاء الفرعيون**: وجه المهام إلى وكلاء منفصلين بنماذج افتراضية مختلفة.
    - **التبديل عند الطلب**: استخدم `/model` لتبديل نموذج الجلسة الحالية في أي وقت.

    راجع [مهام Cron](/ar/automation/cron-jobs)، و[توجيه تعدد الوكلاء](/ar/concepts/multi-agent)، و[أوامر Slash](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="يتجمد البوت أثناء تنفيذ عمل ثقيل. كيف أنقل ذلك خارجا؟">
    استخدم **الوكلاء الفرعيين** للمهام الطويلة أو المتوازية. يعمل الوكلاء الفرعيون في جلساتهم الخاصة،
    ويعيدون ملخصا، ويحافظون على استجابة الدردشة الرئيسية.

    اطلب من البوت "spawn a sub-agent for this task" أو استخدم `/subagents`.
    استخدم `/status` في الدردشة لمعرفة ما يفعله Gateway الآن (وما إذا كان مشغولا).

    نصيحة بشأن الرموز: المهام الطويلة والوكلاء الفرعيون يستهلكون الرموز معا. إذا كانت التكلفة مصدر قلق، فعيّن
    نموذجا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="كيف تعمل جلسات الوكيل الفرعي المرتبطة بسلسلة على Discord؟">
    استخدم ارتباطات السلاسل. يمكنك ربط سلسلة Discord بوكيل فرعي أو هدف جلسة بحيث تبقى رسائل المتابعة في تلك السلسلة على الجلسة المرتبطة.

    التدفق الأساسي:

    - أنشئ باستخدام `sessions_spawn` مع `thread: true` (واختياريا `mode: "session"` للمتابعة الدائمة).
    - أو اربط يدويا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الربط.
    - استخدم `/session idle <duration|off>` و`/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل السلسلة.

    الإعداد المطلوب:

    - الإعدادات الافتراضية العامة: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - الربط التلقائي عند الإنشاء: القيمة الافتراضية لـ `channels.discord.threadBindings.spawnSessions` هي `true`؛ عيّنها إلى `false` لتعطيل إنشاء الجلسات المرتبطة بالسلاسل.

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع الإعدادات](/ar/gateway/configuration-reference)، [أوامر Slash](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="أنهى وكيل فرعي عمله، لكن تحديث الاكتمال ذهب إلى المكان الخطأ أو لم ينشر أبدا. ما الذي يجب أن أتحقق منه؟">
    تحقق أولا من مسار الطالب المحلول:

    - يفضل تسليم الوكيل الفرعي في وضع الاكتمال أي سلسلة مرتبطة أو مسار محادثة عند وجوده.
    - إذا كان أصل الاكتمال يحمل قناة فقط، يعود OpenClaw إلى المسار المخزن لجلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) بحيث يظل التسليم المباشر قادرا على النجاح.
    - إذا لم يوجد مسار مرتبط ولا مسار مخزن صالح للاستخدام، فقد يفشل التسليم المباشر وتعود النتيجة إلى تسليم الجلسة في الطابور بدلا من النشر فورا إلى الدردشة.
    - لا تزال الأهداف غير الصالحة أو القديمة قادرة على فرض الرجوع إلى الطابور أو فشل التسليم النهائي.
    - إذا كان آخر رد مرئي من المساعد للطفل هو الرمز الصامت الدقيق `NO_REPLY` / `no_reply`، أو بالضبط `ANNOUNCE_SKIP`، فإن OpenClaw يكبت الإعلان عمدا بدلا من نشر تقدم سابق قديم.
    - إذا انتهت مهلة الطفل بعد استدعاءات أدوات فقط، فقد يختصر الإعلان ذلك إلى ملخص قصير للتقدم الجزئي بدلا من إعادة عرض مخرجات الأدوات الخام.

    التصحيح:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron أو التذكيرات لا تعمل. ما الذي يجب أن أتحقق منه؟">
    يعمل Cron داخل عملية Gateway. إذا لم يكن Gateway يعمل باستمرار،
    فلن تعمل المهام المجدولة.

    قائمة التحقق:

    - تأكد من تفعيل cron (`cron.enabled`) وأن `OPENCLAW_SKIP_CRON` غير معين.
    - تحقق من أن Gateway يعمل 24/7 (دون سكون/إعادات تشغيل).
    - تحقق من إعدادات المنطقة الزمنية للمهمة (`--tz` مقابل المنطقة الزمنية للمضيف).

    التصحيح:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="تم تشغيل Cron، لكن لم يُرسل أي شيء إلى القناة. لماذا؟">
    تحقق من وضع التسليم أولاً:

    - يعني `--no-deliver` / `delivery.mode: "none"` أنه لا يُتوقع إرسال احتياطي من المشغّل.
    - يعني هدف الإعلان المفقود أو غير الصالح (`channel` / `to`) أن المشغّل تخطى التسليم الصادر.
    - تعني إخفاقات مصادقة القناة (`unauthorized`، `Forbidden`) أن المشغّل حاول التسليم لكن بيانات الاعتماد منعته.
    - تُعامل النتيجة المعزولة الصامتة (`NO_REPLY` / `no_reply` فقط) على أنها غير قابلة للتسليم عمداً، لذلك يمنع المشغّل أيضاً التسليم الاحتياطي في قائمة الانتظار.

    بالنسبة إلى مهام cron المعزولة، لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message`
    عندما يتوفر مسار دردشة. يتحكم `--announce` فقط في مسار المشغّل
    الاحتياطي للنص النهائي الذي لم يرسله الوكيل بالفعل.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="لماذا بدّل تشغيل cron معزول النماذج أو أعاد المحاولة مرة واحدة؟">
    يكون ذلك عادةً مسار تبديل النموذج المباشر، وليس جدولة مكررة.

    يمكن لـ cron المعزول حفظ تسليم نموذج وقت التشغيل وإعادة المحاولة عندما يرمي التشغيل
    النشط `LiveSessionModelSwitchError`. تحتفظ إعادة المحاولة بالمزوّد/النموذج
    الذي تم التبديل إليه، وإذا حمل التبديل تجاوز ملف مصادقة جديداً، يحفظ cron
    ذلك أيضاً قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يتقدم تجاوز نموذج خطاف Gmail أولاً عند انطباقه.
    - ثم `model` لكل مهمة.
    - ثم أي تجاوز نموذج جلسة cron مخزّن.
    - ثم اختيار نموذج الوكيل/الافتراضي المعتاد.

    حلقة إعادة المحاولة محدودة. بعد المحاولة الأولية بالإضافة إلى محاولتي إعادة تبديل،
    يُجهض cron بدلاً من الدوران إلى الأبد.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [CLI cron](/ar/cli/cron).

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
    داخل مساحة العمل النشطة. ثبّت CLI `clawhub` المنفصل فقط إذا كنت تريد نشر
    Skills الخاصة بك أو مزامنتها. للتثبيتات المشتركة بين الوكلاء، ضع Skill تحت
    `~/.openclaw/skills` واستخدم `agents.defaults.skills` أو
    `agents.list[].skills` إذا أردت تضييق نطاق الوكلاء الذين يمكنهم رؤيتها.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw تشغيل المهام وفق جدول أو باستمرار في الخلفية؟">
    نعم. استخدم مجدول Gateway:

    - **مهام Cron** للمهام المجدولة أو المتكررة (تستمر عبر إعادة التشغيل).
    - **Heartbeat** للفحوصات الدورية في "الجلسة الرئيسية".
    - **المهام المعزولة** للوكلاء المستقلين الذين ينشرون ملخصات أو يسلّمون إلى الدردشات.

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills الخاصة بـ Apple macOS فقط من Linux؟">
    ليس مباشرة. تُقيّد Skills الخاصة بـ macOS بواسطة `metadata.openclaw.os` بالإضافة إلى الثنائيات المطلوبة، ولا تظهر Skills في مطالبة النظام إلا عندما تكون مؤهلة على **مضيف Gateway**. على Linux، لن تُحمّل Skills الخاصة بـ `darwin` فقط (مثل `apple-notes` و`apple-reminders` و`things-mac`) ما لم تتجاوز التقييد.

    لديك ثلاثة أنماط مدعومة:

    **الخيار A - شغّل Gateway على Mac (الأبسط).**
    شغّل Gateway حيث توجد ثنائيات macOS، ثم اتصل من Linux في [الوضع البعيد](#gateway-ports-already-running-and-remote-mode) أو عبر Tailscale. تُحمّل Skills بشكل طبيعي لأن مضيف Gateway هو macOS.

    **الخيار B - استخدم Node يعمل بنظام macOS (بدون SSH).**
    شغّل Gateway على Linux، واقرن Node يعمل بنظام macOS (تطبيق شريط القوائم)، واضبط **أوامر تشغيل Node** على "السؤال دائماً" أو "السماح دائماً" على Mac. يمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما تكون الثنائيات المطلوبة موجودة على Node. يشغّل الوكيل تلك Skills عبر أداة `nodes`. إذا اخترت "السؤال دائماً"، فإن الموافقة على "السماح دائماً" في المطالبة تضيف ذلك الأمر إلى قائمة السماح.

    **الخيار C - تمرير ثنائيات macOS عبر SSH (متقدم).**
    أبقِ Gateway على Linux، لكن اجعل ثنائيات CLI المطلوبة تُحل إلى مغلفات SSH تشغّلها على Mac. ثم تجاوز Skill للسماح بـ Linux كي تبقى مؤهلة.

    1. أنشئ مغلف SSH للثنائي (مثال: `memo` لـ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ضع المغلف على `PATH` على مضيف Linux (مثلاً `~/bin/memo`).
    3. تجاوز بيانات Skill الوصفية (مساحة العمل أو `~/.openclaw/skills`) للسماح بـ Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. ابدأ جلسة جديدة حتى تتحدث لقطة Skills.

  </Accordion>

  <Accordion title="هل لديكم تكامل مع Notion أو HeyGen؟">
    ليس مدمجاً اليوم.

    الخيارات:

    - **Skill / Plugin مخصص:** الأفضل للوصول الموثوق إلى API (لدى Notion/HeyGen واجهات API).
    - **أتمتة المتصفح:** تعمل دون كود لكنها أبطأ وأكثر هشاشة.

    إذا أردت الاحتفاظ بالسياق لكل عميل (سير عمل الوكالات)، فالنمط البسيط هو:

    - صفحة Notion واحدة لكل عميل (السياق + التفضيلات + العمل النشط).
    - اطلب من الوكيل جلب تلك الصفحة في بداية الجلسة.

    إذا أردت تكاملاً أصلياً، فافتح طلب ميزة أو ابنِ Skill
    تستهدف تلك الواجهات API.

    تثبيت Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تصل التثبيتات الأصلية إلى دليل `skills/` في مساحة العمل النشطة. بالنسبة إلى Skills المشتركة بين الوكلاء، ضعها في `~/.openclaw/skills/<name>/SKILL.md`. إذا كان ينبغي لبعض الوكلاء فقط رؤية تثبيت مشترك، فاضبط `agents.defaults.skills` أو `agents.list[].skills`. تتوقع بعض Skills ثنائيات مثبتة عبر Homebrew؛ على Linux يعني ذلك Linuxbrew (راجع إدخال الأسئلة الشائعة عن Homebrew على Linux أعلاه). راجع [Skills](/ar/tools/skills)، و[إعدادات Skills](/ar/tools/skills-config)، و[ClawHub](/ar/clawhub).

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

    يمكن لهذا المسار استخدام متصفح المضيف المحلي أو Node متصفح متصل. إذا كان Gateway يعمل في مكان آخر، فإما شغّل مضيف Node على جهاز المتصفح أو استخدم CDP بعيداً بدلاً من ذلك.

    القيود الحالية على `existing-session` / `user`:

    - تعتمد الإجراءات على `ref`، لا على محددات CSS
    - تتطلب عمليات الرفع `ref` / `inputRef` وتدعم حالياً ملفاً واحداً في كل مرة
    - لا تزال `responsebody`، وتصدير PDF، واعتراض التنزيلات، والإجراءات الدفعية تحتاج إلى متصفح مُدار أو ملف تعريف CDP خام

  </Accordion>
</AccordionGroup>

## العزل وMemory

<AccordionGroup>
  <Accordion title="هل توجد مستندات مخصصة للعزل؟">
    نعم. راجع [العزل](/ar/gateway/sandboxing). للإعداد الخاص بـ Docker (Gateway كامل في Docker أو صور العزل)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدوداً - كيف أفعّل الميزات الكاملة؟">
    الصورة الافتراضية مصممة بالأمان أولاً وتعمل كمستخدم `node`، لذلك لا
    تتضمن حزم النظام أو Homebrew أو المتصفحات المضمّنة. للحصول على إعداد أكمل:

    - ثبّت `/home/node` باستخدام `OPENCLAW_HOME_VOLUME` حتى تبقى ذاكرات التخزين المؤقت.
    - ادمج تبعيات النظام في الصورة باستخدام `OPENCLAW_DOCKER_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المضمّن:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - اضبط `PLAYWRIGHT_BROWSERS_PATH` وتأكد من استمرار المسار.

    المستندات: [Docker](/ar/install/docker)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل المباشرة شخصية وجعل المجموعات عامة/معزولة باستخدام وكيل واحد؟">
    نعم - إذا كانت حركة المرور الخاصة بك هي **رسائل مباشرة** وحركة المرور العامة هي **مجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` حتى تعمل جلسات المجموعة/القناة (المفاتيح غير الرئيسية) في خلفية العزل المكوّنة، بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال إعدادات: [المجموعات: رسائل مباشرة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع الإعدادات الرئيسي: [إعدادات Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلد مضيف داخل العزل؟">
    اضبط `agents.defaults.sandbox.docker.binds` على `["host:path:mode"]` (مثلاً `"/home/user/src:/src:ro"`). تندمج الروابط العامة وروابط كل وكيل؛ ويتم تجاهل روابط كل وكيل عندما يكون `scope: "shared"`. استخدم `:ro` لأي شيء حساس وتذكر أن الروابط تتجاوز جدران نظام ملفات العزل.

    يتحقق OpenClaw من مصادر الربط مقابل كل من المسار المطبّع والمسار القانوني المحلول عبر أعمق سلف موجود. هذا يعني أن عمليات الهروب عبر أصل رابط رمزي لا تزال تفشل مغلقة حتى عندما لا يكون مقطع المسار الأخير موجوداً بعد، وأن فحوصات الجذر المسموح به لا تزال تنطبق بعد حل الرابط الرمزي.

    راجع [العزل](/ar/gateway/sandboxing#custom-bind-mounts) و[العزل مقابل سياسة الأدوات مقابل الرفع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للأمثلة وملاحظات السلامة.

  </Accordion>

  <Accordion title="كيف تعمل Memory؟">
    Memory في OpenClaw هي مجرد ملفات Markdown في مساحة عمل الوكيل:

    - ملاحظات يومية في `memory/YYYY-MM-DD.md`
    - ملاحظات طويلة الأمد منسقة في `MEMORY.md` (الجلسات الرئيسية/الخاصة فقط)

    يشغّل OpenClaw أيضاً **تفريغ Memory صامتاً قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction التلقائي. يعمل هذا فقط عندما تكون مساحة العمل
    قابلة للكتابة (تتخطاه بيئات العزل للقراءة فقط). راجع [Memory](/ar/concepts/memory).

  </Accordion>

  <Accordion title="تستمر Memory في نسيان الأشياء. كيف أجعلها ثابتة؟">
    اطلب من الروبوت **كتابة الحقيقة إلى Memory**. تنتمي الملاحظات طويلة الأمد إلى `MEMORY.md`،
    ويذهب السياق قصير الأمد إلى `memory/YYYY-MM-DD.md`.

    لا يزال هذا مجالاً نحسّنه. من المفيد تذكير النموذج بتخزين الذكريات؛
    وسيعرف ما يجب فعله. إذا استمر في النسيان، فتحقق من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل.

    المستندات: [Memory](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تستمر Memory إلى الأبد؟ ما حدودها؟">
    تعيش ملفات Memory على القرص وتستمر حتى تحذفها. الحد هو
    مساحة التخزين لديك، وليس النموذج. لا يزال **سياق الجلسة** محدوداً بنافذة سياق
    النموذج، لذلك يمكن للمحادثات الطويلة أن تخضع لـ Compaction أو الاقتطاع. لهذا السبب
    يوجد بحث Memory - فهو يعيد فقط الأجزاء ذات الصلة إلى السياق.

    المستندات: [Memory](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب بحث الذاكرة الدلالي مفتاح OpenAI API؟">
    فقط إذا كنت تستخدم **تضمينات OpenAI**. يغطي OAuth الخاص بـ Codex الدردشة/الإكمالات ولا
    يمنح وصولًا إلى التضمينات، لذا فإن **تسجيل الدخول باستخدام Codex (OAuth أو
    تسجيل دخول Codex CLI)** لا يساعد في بحث الذاكرة الدلالي. لا تزال تضمينات OpenAI
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تضبط موفرًا صراحةً، يختار OpenClaw موفرًا تلقائيًا عندما يستطيع
    حل مفتاح API (ملفات تعريف المصادقة، أو `models.providers.*.apiKey`، أو متغيرات البيئة).
    يفضل OpenAI إذا تم حل مفتاح OpenAI، وإلا Gemini إذا
    تم حل مفتاح Gemini، ثم Voyage، ثم Mistral. إذا لم يتوفر مفتاح بعيد، يبقى بحث
    الذاكرة معطلًا حتى تكوينه. إذا كان لديك مسار نموذج محلي
    مكوّن وموجود، فإن OpenClaw
    يفضل `local`. يُدعم Ollama عندما تضبط صراحةً
    `memorySearch.provider = "ollama"`.

    إذا كنت تفضل البقاء محليًا، فاضبط `memorySearch.provider = "local"` (واختياريًا
    `memorySearch.fallback = "none"`). إذا كنت تريد تضمينات Gemini، فاضبط
    `memorySearch.provider = "gemini"` ووفر `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). ندعم نماذج التضمين **OpenAI، Gemini، Voyage، Mistral، Ollama، أو local**
    - راجع [الذاكرة](/ar/concepts/memory) لتفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## أين توجد الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل تُحفظ كل البيانات المستخدمة مع OpenClaw محليًا؟">
    لا - **حالة OpenClaw محلية**، لكن **الخدمات الخارجية لا تزال ترى ما ترسله إليها**.

    - **محلي افتراضيًا:** الجلسات، وملفات الذاكرة، والتكوين، ومساحة العمل موجودة على مضيف Gateway
      (`~/.openclaw` + دليل مساحة عملك).
    - **بعيد بحكم الضرورة:** الرسائل التي ترسلها إلى موفري النماذج (Anthropic/OpenAI/إلخ) تذهب إلى
      واجهات API الخاصة بهم، ومنصات الدردشة (WhatsApp/Telegram/Slack/إلخ) تخزن بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في الأثر:** استخدام النماذج المحلية يبقي المطالبات على جهازك، لكن حركة مرور القنوات
      لا تزال تمر عبر خوادم القناة.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    يوجد كل شيء تحت `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | المسار                                                          | الغرض                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | التكوين الرئيسي (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | استيراد OAuth القديم (يُنسخ إلى ملفات تعريف المصادقة عند أول استخدام) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات تعريف المصادقة (OAuth، ومفاتيح API، و`keyRef`/`tokenRef` اختياريان) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | حمولة أسرار اختيارية مدعومة بملف لموفري SecretRef من نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ملف توافق قديم (تُزال إدخالات `api_key` الثابتة منه)             |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | حالة الموفر (مثل `whatsapp/<accountId>/creds.json`)               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | حالة كل وكيل (agentDir + الجلسات)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | سجل المحادثات والحالة (لكل وكيل)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | بيانات تعريف الجلسة (لكل وكيل)                                   |

    مسار الوكيل الواحد القديم: `~/.openclaw/agent/*` (يرحّله `openclaw doctor`).

    **مساحة العمل** الخاصة بك (AGENTS.md، وملفات الذاكرة، وSkills، وما إلى ذلك) منفصلة وتُكوَّن عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    توجد هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` اختياري.
      الجذر القديم بالحروف الصغيرة `memory.md` هو إدخال إصلاح قديم فقط؛ يستطيع `openclaw doctor --fix`
      دمجه في `MEMORY.md` عندما يكون كلا الملفين موجودين.
    - **دليل الحالة (`~/.openclaw`)**: التكوين، وحالة القناة/الموفر، وملفات تعريف المصادقة، والجلسات، والسجلات،
      وSkills المشتركة (`~/.openclaw/skills`).

    مساحة العمل الافتراضية هي `~/.openclaw/workspace`، ويمكن تكوينها عبر:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    إذا كان الروبوت "ينسى" بعد إعادة التشغيل، فتأكد من أن Gateway يستخدم
    مساحة العمل نفسها في كل تشغيل (وتذكر: يستخدم الوضع البعيد **مساحة عمل مضيف gateway**
    وليس حاسوبك المحمول المحلي).

    نصيحة: إذا أردت سلوكًا أو تفضيلًا دائمًا، فاطلب من الروبوت **كتابته في
    AGENTS.md أو MEMORY.md** بدلًا من الاعتماد على سجل الدردشة.

    راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) و[الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="استراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** في مستودع git **خاص** وانسخها احتياطيًا في مكان
    خاص (مثل GitHub خاص). يلتقط هذا الذاكرة + ملفات AGENTS/SOUL/USER،
    ويتيح لك استعادة "ذهن" المساعد لاحقًا.

    لا تقم **بإيداع** أي شيء تحت `~/.openclaw` (بيانات الاعتماد، أو الجلسات، أو الرموز، أو حمولات الأسرار المشفرة).
    إذا احتجت إلى استعادة كاملة، فانسخ كلًا من مساحة العمل ودليل الحالة احتياطيًا
    بشكل منفصل (راجع سؤال الترحيل أعلاه).

    الوثائق: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف أزيل تثبيت OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إلغاء التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. مساحة العمل هي **cwd الافتراضي** ومرساة الذاكرة، وليست صندوق عزل صارمًا.
    تُحل المسارات النسبية داخل مساحة العمل، لكن يمكن للمسارات المطلقة الوصول إلى مواقع
    أخرى على المضيف ما لم يكن العزل مفعّلًا. إذا كنت تحتاج إلى عزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات العزل لكل وكيل. إذا كنت
    تريد أن يكون مستودع هو دليل العمل الافتراضي، فوجّه `workspace` لذلك الوكيل
    إلى جذر المستودع. مستودع OpenClaw هو مجرد كود مصدر؛ أبقِ
    مساحة العمل منفصلة ما لم تكن تريد عمدًا أن يعمل الوكيل داخله.

    مثال (المستودع باعتباره cwd الافتراضي):

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

  <Accordion title="الوضع البعيد: أين يوجد مخزن الجلسات؟">
    حالة الجلسة يملكها **مضيف gateway**. إذا كنت في الوضع البعيد، فمخزن الجلسات الذي يهمك موجود على الجهاز البعيد، وليس على حاسوبك المحمول المحلي. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>
</AccordionGroup>

## أساسيات التكوين

<AccordionGroup>
  <Accordion title="ما تنسيق التكوين؟ وأين يوجد؟">
    يقرأ OpenClaw تكوين **JSON5** اختياريًا من `$OPENCLAW_CONFIG_PATH` (الافتراضي: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    إذا كان الملف مفقودًا، فإنه يستخدم إعدادات افتراضية آمنة إلى حد ما (بما في ذلك مساحة عمل افتراضية هي `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='ضبطت gateway.bind: "lan" (أو "tailnet") والآن لا يوجد شيء يستمع / تقول الواجهة إنني غير مصرح لي'>
    تتطلب الربوط غير loopback **مسار مصادقة gateway صالحًا**. عمليًا يعني ذلك:

    - مصادقة السر المشترك: رمز أو كلمة مرور
    - `gateway.auth.mode: "trusted-proxy"` خلف وكيل عكسي مدرك للهوية ومكوّن بشكل صحيح

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

    - لا تقوم `gateway.remote.token` / `.password` بتمكين مصادقة gateway المحلية وحدها.
    - يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كخيار احتياطي فقط عندما تكون `gateway.auth.*` غير مضبوطة.
    - لمصادقة كلمة المرور، اضبط `gateway.auth.mode: "password"` بالإضافة إلى `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`) بدلًا من ذلك.
    - إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وتعذر حلها، يفشل الحل بشكل مغلق (من دون إخفاء بفعل خيار احتياطي بعيد).
    - إعدادات واجهة التحكم ذات السر المشترك تصادق عبر `connect.params.auth.token` أو `connect.params.auth.password` (المخزنة في إعدادات التطبيق/الواجهة). تستخدم الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy` رؤوس الطلبات بدلًا من ذلك. تجنب وضع الأسرار المشتركة في عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، تتطلب الوكلاء العكسية عبر loopback على المضيف نفسه ضبط `gateway.auth.trustedProxy.allowLoopback = true` صراحةً وإدخال loopback في `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="لماذا أحتاج إلى رمز على localhost الآن؟">
    يفرض OpenClaw مصادقة gateway افتراضيًا، بما في ذلك loopback. في المسار الافتراضي العادي يعني ذلك مصادقة الرمز: إذا لم يتم تكوين مسار مصادقة صريح، تتحول بداية gateway إلى وضع الرمز وتولّد رمزًا خاصًا بوقت التشغيل لذلك التشغيل فقط، لذا **يجب على عملاء WS المحليين المصادقة**. اضبط `gateway.auth.token`، أو `gateway.auth.password`، أو `OPENCLAW_GATEWAY_TOKEN`، أو `OPENCLAW_GATEWAY_PASSWORD` صراحةً عندما تحتاج العملاء إلى سر ثابت عبر عمليات إعادة التشغيل. هذا يمنع العمليات المحلية الأخرى من استدعاء Gateway.

    إذا كنت تفضل مسار مصادقة مختلفًا، يمكنك اختيار وضع كلمة المرور صراحةً (أو `trusted-proxy` للوكلاء العكسيين المدركين للهوية). إذا كنت تريد **حقًا** loopback مفتوحًا، فاضبط `gateway.auth.mode: "none"` صراحةً في تكوينك. يستطيع Doctor توليد رمز لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب أن أعيد التشغيل بعد تغيير التكوين؟">
    يراقب Gateway التكوين ويدعم إعادة التحميل الساخنة:

    - `gateway.reload.mode: "hybrid"` (الافتراضي): تطبيق التغييرات الآمنة فورًا، وإعادة التشغيل للتغييرات الحرجة
    - `hot`، و`restart`، و`off` مدعومة أيضًا

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

    - `off`: يخفي نص العبارة لكنه يُبقي سطر عنوان/إصدار الشعار.
    - `default`: يستخدم `All your chats, one OpenClaw.` في كل مرة.
    - `random`: عبارات طريفة/موسمية دوّارة (السلوك الافتراضي).
    - إذا كنت لا تريد أي شعار إطلاقًا، فاضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="كيف أفعّل بحث الويب (وجلب الويب)؟">
    يعمل `web_fetch` من دون مفتاح API. يعتمد `web_search` على الموفر
    المحدد لديك:

    - يتطلب الموفرون المدعومون بواجهات API مثل Brave، وExa، وFirecrawl، وGemini، وGrok، وKimi، وMiniMax Search، وPerplexity، وTavily إعداد مفتاح API العادي الخاص بهم.
    - Ollama Web Search بلا مفاتيح، لكنه يستخدم مضيف Ollama المكوّن لديك ويتطلب `ollama signin`.
    - DuckDuckGo بلا مفاتيح، لكنه تكامل غير رسمي قائم على HTML.
    - SearXNG بلا مفاتيح/مستضاف ذاتيًا؛ كوّن `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

    **موصى به:** شغّل `openclaw configure --section web` واختر موفرًا.
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

    يوجد الآن إعداد بحث الويب الخاص بالمزوّد ضمن `plugins.entries.<plugin>.config.webSearch.*`.
    ما تزال مسارات المزوّد القديمة `tools.web.search.*` تُحمَّل مؤقتًا للتوافق، لكن ينبغي عدم استخدامها في الإعدادات الجديدة.
    يوجد إعداد الرجوع الاحتياطي لجلب الويب من Firecrawl ضمن `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم السماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - يكون `web_fetch` مفعّلًا افتراضيًا (ما لم يُعطَّل صراحةً).
    - إذا حُذف `tools.web.fetch.provider`، يكتشف OpenClaw تلقائيًا أول مزوّد جاهز للرجوع الاحتياطي للجلب من بيانات الاعتماد المتاحة. اليوم المزوّد المضمّن هو Firecrawl.
    - تقرأ العمليات الخفيّة متغيرات البيئة من `~/.openclaw/.env` (أو من بيئة الخدمة).

    الوثائق: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="مسح config.apply إعدادي. كيف أستعيده وأتجنب ذلك؟">
    يستبدل `config.apply` **الإعداد بالكامل**. إذا أرسلت كائنًا جزئيًا، فسيُزال كل
    شيء آخر.

    يحمي OpenClaw الحالي من كثير من عمليات الكتابة العرضية المدمّرة:

    - تتحقق عمليات كتابة الإعداد المملوكة لـ OpenClaw من الإعداد الكامل بعد التغيير قبل الكتابة.
    - تُرفض عمليات الكتابة غير الصالحة أو المدمّرة المملوكة لـ OpenClaw وتُحفظ باسم `openclaw.json.rejected.*`.
    - إذا أدّى تعديل مباشر إلى تعطل بدء التشغيل أو إعادة التحميل الساخنة، يفشل Gateway بإغلاق آمن أو يتخطى إعادة التحميل؛ ولا يعيد كتابة `openclaw.json`.
    - يتولى `openclaw doctor --fix` الإصلاح ويمكنه استعادة آخر إعداد صالح معروف مع حفظ الملف المرفوض باسم `openclaw.json.clobbered.*`.

    الاستعادة:

    - افحص `openclaw logs --follow` بحثًا عن `Invalid config at` أو `Config write rejected:` أو `config reload skipped (invalid config)`.
    - افحص أحدث `openclaw.json.clobbered.*` أو `openclaw.json.rejected.*` بجانب الإعداد النشط.
    - شغّل `openclaw config validate` و`openclaw doctor --fix`.
    - انسخ فقط المفاتيح المقصودة مرة أخرى باستخدام `openclaw config set` أو `config.patch`.
    - إذا لم يكن لديك آخر إعداد صالح معروف أو حمولة مرفوضة، فاستعد من نسخة احتياطية، أو أعد تشغيل `openclaw doctor` وأعد إعداد القنوات/النماذج.
    - إذا كان هذا غير متوقع، فافتح بلاغ خطأ وأرفق آخر إعداد معروف لديك أو أي نسخة احتياطية.
    - يمكن لوكيل برمجة محلي غالبًا إعادة بناء إعداد عامل من السجلات أو السجل التاريخي.

    تجنّبه:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` للتعديلات التفاعلية.
    - استخدم `config.schema.lookup` أولًا عندما لا تكون متأكدًا من مسار دقيق أو شكل حقل؛ فهو يعيد عقدة مخطط سطحية مع ملخصات الأبناء المباشرين للتنقّل التفصيلي.
    - استخدم `config.patch` لتعديلات RPC الجزئية؛ وأبقِ `config.apply` للاستبدال الكامل للإعداد فقط.
    - إذا كنت تستخدم أداة `gateway` الخاصة بالمالك فقط من تشغيل وكيل، فستظل ترفض الكتابة إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك الأسماء المستعارة القديمة `tools.bash.*` التي تُطبّع إلى مسارات التنفيذ المحمية نفسها).

    الوثائق: [الإعداد](/ar/cli/config)، [التهيئة](/ar/cli/configure)، [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغّل Gateway مركزيًا مع عاملين متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحد** (مثل Raspberry Pi) مع **عُقَد** و**وكلاء**:

    - **Gateway (مركزي):** يملك القنوات (Signal/WhatsApp) والتوجيه والجلسات.
    - **العُقَد (الأجهزة):** تتصل أجهزة Macs/iOS/Android كأجهزة طرفية وتكشف أدوات محلية (`system.run`، `canvas`، `camera`).
    - **الوكلاء (العاملون):** عقول/مساحات عمل منفصلة لأدوار خاصة (مثل "عمليات Hetzner"، "البيانات الشخصية").
    - **الوكلاء الفرعيون:** يطلقون عملًا في الخلفية من وكيل رئيسي عندما تريد التوازي.
    - **TUI:** اتصل بـ Gateway وبدّل بين الوكلاء/الجلسات.

    الوثائق: [العُقَد](/ar/nodes)، [الوصول البعيد](/ar/gateway/remote)، [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/ar/web/tui).

  </Accordion>

  <Accordion title="هل يستطيع متصفح OpenClaw العمل بلا واجهة؟">
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

    القيمة الافتراضية هي `false` (بواجهة). يزيد وضع بلا واجهة احتمال تشغيل فحوصات مكافحة البوتات في بعض المواقع. راجع [المتصفح](/ar/tools/browser).

    يستخدم وضع بلا واجهة **محرك Chromium نفسه** ويعمل لمعظم الأتمتة (النماذج، النقرات، الاستخراج، تسجيلات الدخول). الاختلافات الرئيسية:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات الشاشة إذا احتجت إلى مرئيات).
    - بعض المواقع أكثر تشددًا بشأن الأتمتة في وضع بلا واجهة (CAPTCHAs، مكافحة البوتات).
      على سبيل المثال، غالبًا ما يحظر X/Twitter الجلسات بلا واجهة.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    اضبط `browser.executablePath` على ملف Brave الثنائي لديك (أو أي متصفح مبني على Chromium) وأعد تشغيل Gateway.
    راجع أمثلة الإعداد الكاملة في [المتصفح](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## البوابات والعُقَد البعيدة

<AccordionGroup>
  <Accordion title="كيف تنتقل الأوامر بين Telegram وGateway والعُقَد؟">
    تتعامل **Gateway** مع رسائل Telegram. تشغّل Gateway الوكيل ثم
    تستدعي العُقَد عبر **Gateway WebSocket** فقط عندما تكون أداة عقدة مطلوبة:

    Telegram → Gateway → الوكيل → `node.*` → العقدة → Gateway → Telegram

    لا ترى العُقَد حركة المزوّد الواردة؛ فهي تتلقى فقط استدعاءات RPC الخاصة بالعُقَد.

  </Accordion>

  <Accordion title="كيف يمكن لوكيلي الوصول إلى حاسوبي إذا كانت Gateway مستضافة عن بُعد؟">
    الإجابة المختصرة: **اقرن حاسوبك كعقدة**. تعمل Gateway في مكان آخر، لكنها تستطيع
    استدعاء أدوات `node.*` (الشاشة، الكاميرا، النظام) على جهازك المحلي عبر Gateway WebSocket.

    الإعداد المعتاد:

    1. شغّل Gateway على المضيف دائم التشغيل (VPS/خادم منزلي).
    2. ضع مضيف Gateway وحاسوبك على شبكة tailnet نفسها.
    3. تأكد من إمكانية الوصول إلى Gateway WS (ربط tailnet أو نفق SSH).
    4. افتح تطبيق macOS محليًا واتصل في وضع **Remote over SSH** (أو tailnet مباشر)
       لكي يتمكن من التسجيل كعقدة.
    5. وافق على العقدة في Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا يلزم جسر TCP منفصل؛ تتصل العُقَد عبر Gateway WebSocket.

    تذكير أمني: يتيح إقران عقدة macOS تشغيل `system.run` على ذلك الجهاز. اقرن
    الأجهزة التي تثق بها فقط، وراجع [الأمان](/ar/gateway/security).

    الوثائق: [العُقَد](/ar/nodes)، [بروتوكول Gateway](/ar/gateway/protocol)، [وضع macOS البعيد](/ar/platforms/mac/remote)، [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل لكنني لا أتلقى ردودًا. ماذا الآن؟">
    افحص الأساسيات:

    - Gateway قيد التشغيل: `openclaw gateway status`
    - صحة Gateway: `openclaw status`
    - صحة القناة: `openclaw channels status`

    ثم تحقق من المصادقة والتوجيه:

    - إذا كنت تستخدم Tailscale Serve، فتأكد من ضبط `gateway.auth.allowTailscale` بشكل صحيح.
    - إذا كنت تتصل عبر نفق SSH، فتأكد من أن النفق المحلي يعمل ويشير إلى المنفذ الصحيح.
    - تأكد من أن قوائم السماح لديك (رسالة مباشرة أو مجموعة) تتضمن حسابك.

    الوثائق: [Tailscale](/ar/gateway/tailscale)، [الوصول البعيد](/ar/gateway/remote)، [القنوات](/ar/channels).

  </Accordion>

  <Accordion title="هل يمكن لمثيلَي OpenClaw التحدث إلى بعضهما (محلي + VPS)؟">
    نعم. لا يوجد جسر "بوت إلى بوت" مدمج، لكن يمكنك توصيله بعدة
    طرق موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يستطيع كلا البوتين الوصول إليها (Telegram/Slack/WhatsApp).
    اجعل Bot A يرسل رسالة إلى Bot B، ثم دع Bot B يرد كالمعتاد.

    **جسر CLI (عام):** شغّل سكربتًا يستدعي Gateway الأخرى باستخدام
    `openclaw agent --message ... --deliver`، مستهدفًا دردشة يستمع إليها البوت الآخر.
    إذا كان أحد البوتين على VPS بعيد، فوجّه CLI لديك إلى تلك Gateway البعيدة
    عبر SSH/Tailscale (راجع [الوصول البعيد](/ar/gateway/remote)).

    نمط مثال (شغّله من جهاز يمكنه الوصول إلى Gateway الهدف):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف حاجز حماية لكي لا يدخل البوتان في حلقة لا نهائية (بالذكر فقط، أو
    قوائم سماح للقنوات، أو قاعدة "لا ترد على رسائل البوتات").

    الوثائق: [الوصول البعيد](/ar/gateway/remote)، [Agent CLI](/ar/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى VPSات منفصلة لعدة وكلاء؟">
    لا. يستطيع Gateway واحد استضافة عدة وكلاء، لكل منهم مساحة عمله وافتراضيات النموذج
    والتوجيه الخاصة به. هذا هو الإعداد الطبيعي وهو أرخص وأبسط بكثير من تشغيل
    VPS واحد لكل وكيل.

    استخدم VPSات منفصلة فقط عندما تحتاج إلى عزل صارم (حدود أمان) أو إعدادات
    مختلفة جدًا لا تريد مشاركتها. بخلاف ذلك، أبقِ Gateway واحدًا واستخدم
    عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل هناك فائدة من استخدام عقدة على حاسوبي المحمول الشخصي بدلًا من SSH من VPS؟">
    نعم - العُقَد هي الطريقة الرسمية للوصول إلى حاسوبك المحمول من Gateway بعيدة، وهي
    تتيح أكثر من وصول الطرفية. تعمل Gateway على macOS/Linux (وWindows عبر WSL2) وهي
    خفيفة (يكفي VPS صغير أو جهاز من فئة Raspberry Pi؛ وذاكرة 4 GB كثيرة)، لذا يكون الإعداد الشائع
    مضيفًا دائم التشغيل مع حاسوبك المحمول كعقدة.

    - **لا يلزم SSH وارد.** تتصل العُقَد إلى الخارج بـ Gateway WebSocket وتستخدم إقران الأجهزة.
    - **ضوابط تنفيذ أكثر أمانًا.** يخضع `system.run` لقوائم السماح/الموافقات الخاصة بالعقدة على ذلك الحاسوب المحمول.
    - **المزيد من أدوات الجهاز.** تكشف العُقَد `canvas` و`camera` و`screen` بالإضافة إلى `system.run`.
    - **أتمتة المتصفح المحلي.** أبقِ Gateway على VPS، لكن شغّل Chrome محليًا عبر مضيف عقدة على الحاسوب المحمول، أو اتصل بـ Chrome المحلي على المضيف عبر Chrome MCP.

    SSH مناسب للوصول العارض إلى الطرفية، لكن العُقَد أبسط لسير عمل الوكلاء المستمر
    وأتمتة الأجهزة.

    الوثائق: [العُقَد](/ar/nodes)، [CLI العُقَد](/ar/cli/nodes)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تشغّل العُقَد خدمة Gateway؟">
    لا. يجب تشغيل **gateway واحدة** فقط لكل مضيف ما لم تكن تشغّل عمدًا ملفات تعريف معزولة (راجع [بوابات متعددة](/ar/gateway/multiple-gateways)). العُقَد أجهزة طرفية تتصل
    بـ gateway (عُقَد iOS/Android، أو "وضع العقدة" في macOS في تطبيق شريط القوائم). لمضيفي العقد
    بلا واجهة والتحكم عبر CLI، راجع [CLI مضيف Node](/ar/cli/node).

    يلزم إعادة تشغيل كاملة لتغييرات `gateway` و`discovery` وسطح Plugin المستضاف.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق الإعداد؟">
    نعم.

    - `config.schema.lookup`: افحص شجرة فرعية واحدة من الإعدادات مع عقدة المخطط الضحلة الخاصة بها، وتلميح واجهة المستخدم المطابق، وملخصات الأبناء المباشرين قبل الكتابة
    - `config.get`: اجلب اللقطة الحالية + التجزئة
    - `config.patch`: تحديث جزئي آمن (مفضّل لمعظم تعديلات RPC)؛ يعيد التحميل فورياً عندما يكون ذلك ممكناً ويعيد التشغيل عندما يكون ذلك مطلوباً
    - `config.apply`: تحقّق + استبدل الإعدادات كاملة؛ يعيد التحميل فورياً عندما يكون ذلك ممكناً ويعيد التشغيل عندما يكون ذلك مطلوباً
    - ما تزال أداة وقت التشغيل `gateway` الخاصة بالمالك فقط ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ تُطبّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها

  </Accordion>

  <Accordion title="إعدادات سليمة بالحد الأدنى لأول تثبيت">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    يعيّن هذا مساحة العمل الخاصة بك ويقيّد من يمكنه تشغيل البوت.

  </Accordion>

  <Accordion title="كيف أعد Tailscale على VPS وأتصل من Mac؟">
    الخطوات الدنيا:

    1. **ثبّت + سجّل الدخول على VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ثبّت + سجّل الدخول على Mac**
       - استخدم تطبيق Tailscale وسجّل الدخول إلى tailnet نفسها.
    3. **فعّل MagicDNS (موصى به)**
       - في وحدة تحكم إدارة Tailscale، فعّل MagicDNS كي يحصل VPS على اسم ثابت.
    4. **استخدم اسم مضيف tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا أردت واجهة التحكم دون SSH، فاستخدم Tailscale Serve على VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    يحافظ هذا على ربط Gateway بـ local loopback ويكشف HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أوصل عقدة Mac بـ Gateway بعيد (Tailscale Serve)؟">
    يكشف Serve **واجهة تحكم Gateway + WS**. تتصل العقد عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكد من أن VPS + Mac على tailnet نفسها**.
    2. **استخدم تطبيق macOS في الوضع البعيد** (يمكن أن يكون هدف SSH هو اسم مضيف tailnet).
       سيُنفق التطبيق منفذ Gateway ويتصل كعقدة.
    3. **وافق على العقدة** على Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    المستندات: [بروتوكول Gateway](/ar/gateway/protocol)، [الاكتشاف](/ar/gateway/discovery)، [الوضع البعيد في macOS](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل ينبغي أن أثبّت على حاسوب محمول ثانٍ أم أضيف عقدة فقط؟">
    إذا كنت تحتاج فقط إلى **الأدوات المحلية** (الشاشة/الكاميرا/exec) على الحاسوب المحمول الثاني، فأضفه كـ
    **عقدة**. يحافظ ذلك على Gateway واحد ويتجنب تكرار الإعدادات. أدوات العقد المحلية
    حالياً خاصة بـ macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    ثبّت Gateway ثانياً فقط عندما تحتاج إلى **عزل صارم** أو بوتين منفصلين بالكامل.

    المستندات: [العقد](/ar/nodes)، [CLI العقد](/ar/cli/nodes)، [بوابات متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات البيئة وتحميل .env

<AccordionGroup>
  <Accordion title="كيف يحمّل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات البيئة من العملية الأصلية (shell، launchd/systemd، CI، إلخ) ويحمل بالإضافة إلى ذلك:

    - `.env` من دليل العمل الحالي
    - ملف `.env` احتياطي عام من `~/.openclaw/.env` (المعروف أيضاً باسم `$OPENCLAW_STATE_DIR/.env`)

    لا يتجاوز أي من ملفي `.env` متغيرات البيئة الموجودة.

    يمكنك أيضاً تعريف متغيرات بيئة مضمنة في الإعدادات (تُطبّق فقط إذا كانت مفقودة من بيئة العملية):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    راجع [/environment](/ar/help/environment) للأسبقية والمصادر الكاملة.

  </Accordion>

  <Accordion title="بدأت Gateway عبر الخدمة واختفت متغيرات البيئة الخاصة بي. ماذا الآن؟">
    حلّان شائعان:

    1. ضع المفاتيح المفقودة في `~/.openclaw/.env` كي تُلتقط حتى عندما لا ترث الخدمة بيئة shell الخاصة بك.
    2. فعّل استيراد shell (تسهيل اختياري):

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

    يشغّل هذا shell تسجيل الدخول الخاص بك ويستورد فقط المفاتيح المتوقعة المفقودة (ولا يتجاوز أبداً). مكافئات متغيرات البيئة:
    `OPENCLAW_LOAD_SHELL_ENV=1`، `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='عيّنت COPILOT_GITHUB_TOKEN، لكن حالة النماذج تعرض "Shell env: off." لماذا؟'>
    يبلّغ `openclaw models status` عما إذا كان **استيراد بيئة shell** مفعلاً. لا تعني "Shell env: off"
    أن متغيرات البيئة الخاصة بك مفقودة - بل تعني فقط أن OpenClaw لن يحمّل
    shell تسجيل الدخول الخاص بك تلقائياً.

    إذا كان Gateway يعمل كخدمة (launchd/systemd)، فلن يرث بيئة shell
    الخاصة بك. أصلح ذلك بأحد هذه الخيارات:

    1. ضع الرمز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد shell (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في إعداداتك (يُطبّق فقط إذا كان مفقوداً).

    ثم أعد تشغيل Gateway وتحقق مجدداً:

    ```bash
    openclaw models status
    ```

    تُقرأ رموز Copilot من `COPILOT_GITHUB_TOKEN` (وأيضاً `GH_TOKEN` / `GITHUB_TOKEN`).
    راجع [/concepts/model-providers](/ar/concepts/model-providers) و[/environment](/ar/help/environment).

  </Accordion>
</AccordionGroup>

## الجلسات والمحادثات المتعددة

<AccordionGroup>
  <Accordion title="كيف أبدأ محادثة جديدة؟">
    أرسل `/new` أو `/reset` كرسالة مستقلة. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>

  <Accordion title="هل تُعاد تعيين الجلسات تلقائياً إذا لم أرسل /new أبداً؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا **معطّل افتراضياً** (الافتراضي **0**).
    اضبطه على قيمة موجبة لتفعيل انتهاء الصلاحية بسبب الخمول. عند التفعيل، تبدأ الرسالة **التالية**
    بعد فترة الخمول معرّف جلسة جديداً لمفتاح تلك الدردشة.
    لا يحذف هذا النصوص المسجلة - بل يبدأ جلسة جديدة فقط.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="هل توجد طريقة لإنشاء فريق من مثيلات OpenClaw (مدير تنفيذي واحد ووكلاء كثر)؟">
    نعم، عبر **توجيه متعدد الوكلاء** و**الوكلاء الفرعيين**. يمكنك إنشاء وكيل منسّق واحد
    وعدة وكلاء عاملين بمساحات عمل ونماذج خاصة بهم.

    ومع ذلك، من الأفضل النظر إلى هذا على أنه **تجربة ممتعة**. فهو كثيف الاستهلاك للرموز وغالباً
    أقل كفاءة من استخدام بوت واحد بجلسات منفصلة. النموذج المعتاد الذي
    نتصوره هو بوت واحد تتحدث إليه، مع جلسات مختلفة للعمل المتوازي. ويمكن لذلك
    البوت أيضاً إنشاء وكلاء فرعيين عند الحاجة.

    المستندات: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [CLI الوكلاء](/ar/cli/agents).

  </Accordion>

  <Accordion title="لماذا اقتُطع السياق في منتصف المهمة؟ كيف أمنع ذلك؟">
    سياق الجلسة محدود بنافذة النموذج. يمكن أن تؤدي المحادثات الطويلة أو مخرجات الأدوات الكبيرة أو كثرة
    الملفات إلى تشغيل Compaction أو الاقتطاع.

    ما يساعد:

    - اطلب من البوت تلخيص الحالة الحالية وكتابتها إلى ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل المواضيع.
    - احتفظ بالسياق المهم في مساحة العمل واطلب من البوت قراءته لك.
    - استخدم الوكلاء الفرعيين للعمل الطويل أو المتوازي كي تبقى الدردشة الرئيسية أصغر.
    - اختر نموذجاً بنافذة سياق أكبر إذا حدث هذا كثيراً.

  </Accordion>

  <Accordion title="كيف أعيد تعيين OpenClaw بالكامل مع إبقائه مثبتاً؟">
    استخدم أمر إعادة التعيين:

    ```bash
    openclaw reset
    ```

    إعادة تعيين كاملة غير تفاعلية:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    ثم أعد تشغيل الإعداد:

    ```bash
    openclaw onboard --install-daemon
    ```

    ملاحظات:

    - يعرض الإعداد الأولي أيضاً **إعادة التعيين** إذا وجد إعدادات موجودة. راجع [الإعداد الأولي (CLI)](/ar/start/wizard).
    - إذا استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد تعيين كل دليل حالة (الافتراضيات هي `~/.openclaw-<profile>`).
    - إعادة تعيين التطوير: `openclaw gateway --dev --reset` (للتطوير فقط؛ يمسح إعدادات التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='أتلقى أخطاء "context too large" - كيف أعيد التعيين أو أضغط السياق؟'>
    استخدم أحد هذه الخيارات:

    - **Compaction** (يبقي المحادثة لكنه يلخص الأدوار الأقدم):

      ```
      /compact
      ```

      أو `/compact <instructions>` لتوجيه الملخص.

    - **إعادة التعيين** (معرّف جلسة جديد لمفتاح الدردشة نفسه):

      ```
      /new
      /reset
      ```

    إذا استمر حدوث ذلك:

    - فعّل أو اضبط **تهذيب الجلسات** (`agents.defaults.contextPruning`) لقص مخرجات الأدوات القديمة.
    - استخدم نموذجاً بنافذة سياق أكبر.

    المستندات: [Compaction](/ar/concepts/compaction)، [تهذيب الجلسات](/ar/concepts/session-pruning)، [إدارة الجلسات](/ar/concepts/session).

  </Accordion>

  <Accordion title='لماذا أرى "LLM request rejected: messages.content.tool_use.input field required"؟'>
    هذا خطأ تحقق من المزوّد: أصدر النموذج كتلة `tool_use` دون
    `input` المطلوب. يعني ذلك عادة أن تاريخ الجلسة قديم أو تالف (غالباً بعد سلاسل طويلة
    أو تغيير أداة/مخطط).

    الحل: ابدأ جلسة جديدة باستخدام `/new` (رسالة مستقلة).

  </Accordion>

  <Accordion title="لماذا أتلقى رسائل Heartbeat كل 30 دقيقة؟">
    تعمل Heartbeats كل **30m** افتراضياً (**1h** عند استخدام مصادقة OAuth). اضبطها أو عطّلها:

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

    إذا كان `HEARTBEAT.md` موجوداً لكنه فارغ فعلياً (أسطر فارغة فقط ورؤوس markdown
    مثل `# Heading`)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API.
    إذا كان الملف مفقوداً، يستمر تشغيل Heartbeat ويقرر النموذج ما يجب فعله.

    تستخدم التجاوزات لكل وكيل `agents.list[].heartbeat`. المستندات: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل أحتاج إلى إضافة "حساب بوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك الخاص**، لذا إذا كنت في المجموعة، يمكن لـ OpenClaw رؤيتها.
    افتراضياً، تُحظر ردود المجموعات حتى تسمح بالمرسلين (`groupPolicy: "allowlist"`).

    إذا أردت أن تكون **أنت فقط** قادراً على تشغيل ردود المجموعة:

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

    الخيار 2 (إذا كان مهيأً/مدرجاً في قائمة السماح مسبقاً): اعرض المجموعات من الإعدادات:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    المستندات: [WhatsApp](/ar/channels/whatsapp)، [الدليل](/ar/cli/directory)، [السجلات](/ar/cli/logs).

  </Accordion>

  <Accordion title="لماذا لا يرد OpenClaw في مجموعة؟">
    سببان شائعان:

    - بوابة الإشارة قيد التشغيل (افتراضياً). يجب أن تذكر البوت باستخدام @mention (أو تطابق `mentionPatterns`).
    - هيأت `channels.whatsapp.groups` دون `"*"` والمجموعة ليست في قائمة السماح.

    راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشارك المجموعات/السلاسل السياق مع الرسائل المباشرة؟">
    تُطوى الدردشات المباشرة إلى الجلسة الرئيسية افتراضياً. للمجموعات/القنوات مفاتيح جلسات خاصة بها، ومواضيع Telegram / سلاسل Discord هي جلسات منفصلة. راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم عدد مساحات العمل والوكلاء التي يمكنني إنشاؤها؟">
    لا توجد حدود صارمة. العشرات (بل حتى المئات) لا بأس بها، لكن انتبه إلى:

    - **نمو مساحة القرص:** توجد الجلسات + النصوص النصية ضمن `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** المزيد من الوكلاء يعني استخدامًا أكثر تزامنًا للنماذج.
    - **عبء العمليات:** ملفات تعريف المصادقة، ومساحات العمل، وتوجيه القنوات لكل وكيل.

    نصائح:

    - احتفظ بمساحة عمل **نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - قلّم الجلسات القديمة (احذف JSONL أو إدخالات التخزين) إذا ازدادت مساحة القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل المتروكة وعدم تطابق ملفات التعريف.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة بوتات أو محادثات في الوقت نفسه (Slack)، وكيف يجب إعداد ذلك؟">
    نعم. استخدم **التوجيه متعدد الوكلاء** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة حسب
    القناة/الحساب/النظير. Slack مدعوم كقناة ويمكن ربطه بوكلاء محددين.

    الوصول عبر المتصفح قوي، لكنه ليس "افعل أي شيء يستطيع الإنسان فعله" - فقد تظل آليات مكافحة البوتات، وCAPTCHA، والمصادقة متعددة العوامل
    قادرة على حظر الأتمتة. للحصول على أكثر تحكم موثوق بالمتصفح، استخدم Chrome MCP المحلي على المضيف،
    أو استخدم CDP على الجهاز الذي يشغل المتصفح فعليًا.

    إعداد أفضل الممارسات:

    - مضيف Gateway دائم التشغيل (VPS/Mac mini).
    - وكيل واحد لكل دور (روابط).
    - قناة أو قنوات Slack مرتبطة بتلك الوكلاء.
    - متصفح محلي عبر Chrome MCP أو عقدة عند الحاجة.

    المستندات: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [Slack](/ar/channels/slack)،
    [المتصفح](/ar/tools/browser)، [العقد](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج، وتجاوز الفشل، وملفات تعريف المصادقة

توجد أسئلة وأجوبة النماذج — الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة —
في [الأسئلة الشائعة حول النماذج](/ar/help/faq-models).

## Gateway: المنافذ، و"قيد التشغيل بالفعل"، والوضع البعيد

<AccordionGroup>
  <Accordion title="ما المنفذ الذي يستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ المتعدد الوحيد لـ WebSocket + HTTP (واجهة التحكم، والخطافات، وما إلى ذلك).

    ترتيب الأولوية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا يقول openclaw gateway status "وقت التشغيل: قيد التشغيل" لكن "فحص الاتصال: فشل"؟'>
    لأن "قيد التشغيل" هو منظور **المشرف** (launchd/systemd/schtasks). فحص الاتصال هو اتصال CLI فعليًا بـ WebSocket الخاص بالبوابة.

    استخدم `openclaw gateway status` وثق بهذه السطور:

    - `Probe target:` (عنوان URL الذي استخدمه الفحص فعليًا)
    - `Listening:` (ما هو مرتبط فعليًا على المنفذ)
    - `Last gateway error:` (السبب الجذري الشائع عندما تكون العملية حية لكن المنفذ لا يستمع)

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status أن "الإعدادات (cli)" و"الإعدادات (الخدمة)" مختلفتان؟'>
    أنت تعدّل ملف إعدادات بينما تعمل الخدمة بملف آخر (غالبًا عدم تطابق `--profile` / `OPENCLAW_STATE_DIR`).

    الإصلاح:

    ```bash
    openclaw gateway install --force
    ```

    شغّل ذلك من نفس `--profile` / البيئة التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ماذا يعني "مثيل gateway آخر يستمع بالفعل"؟'>
    يفرض OpenClaw قفل وقت التشغيل عبر ربط مستمع WebSocket فور بدء التشغيل (الافتراضي `ws://127.0.0.1:18789`). إذا فشل الربط مع `EADDRINUSE`، فإنه يرمي `GatewayLockError` مشيرًا إلى أن مثيلًا آخر يستمع بالفعل.

    الإصلاح: أوقف المثيل الآخر، أو حرر المنفذ، أو شغّل باستخدام `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="كيف أشغل OpenClaw في الوضع البعيد (يتصل العميل بـ Gateway في مكان آخر)؟">
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

    - لا يبدأ `openclaw gateway` إلا عندما يكون `gateway.mode` هو `local` (أو تمرر علامة التجاوز).
    - يراقب تطبيق macOS ملف الإعدادات ويبدل الأوضاع مباشرة عند تغيّر هذه القيم.
    - `gateway.remote.token` / `.password` هي بيانات اعتماد بعيدة من جانب العميل فقط؛ ولا تفعّل مصادقة Gateway المحلي بذاتها.

  </Accordion>

  <Accordion title='تقول واجهة التحكم "غير مصرح" (أو تواصل إعادة الاتصال). ماذا الآن؟'>
    لا يتطابق مسار مصادقة Gateway لديك مع طريقة مصادقة الواجهة.

    حقائق (من الكود):

    - تحتفظ واجهة التحكم بالرمز في `sessionStorage` لجلسة تبويب المتصفح الحالية وعنوان URL المحدد للبوابة، لذلك تستمر عمليات التحديث في التبويب نفسه في العمل دون استعادة استمرارية رمز localStorage طويل الأمد.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة محاولة محدودة واحدة باستخدام رمز جهاز مخزن مؤقتًا عندما تعيد البوابة تلميحات إعادة المحاولة (`canRetryWithDeviceToken=true`، `recommendedNextStep=retry_with_device_token`).
    - تعيد محاولة الرمز المخزن مؤقتًا الآن استخدام النطاقات المعتمدة المخزنة مؤقتًا مع رمز الجهاز. لا يزال مستدعو `deviceToken` الصريح / `scopes` الصريحة يحتفظون بمجموعة النطاق المطلوبة بدلًا من وراثة النطاقات المخزنة مؤقتًا.
    - خارج مسار إعادة المحاولة ذلك، تكون أولوية مصادقة الاتصال هي الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز التمهيد.
    - فحوصات نطاق رمز التمهيد ذات بادئات أدوار. لا تلبي قائمة السماح المدمجة لمشغل التمهيد إلا طلبات المشغل؛ ولا تزال أدوار العقد أو الأدوار الأخرى غير المشغلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    الإصلاح:

    - الأسرع: `openclaw dashboard` (يطبع + ينسخ عنوان URL للوحة المعلومات، ويحاول الفتح؛ ويعرض تلميح SSH إذا كان بلا واجهة).
    - إذا لم يكن لديك رمز بعد: `openclaw doctor --generate-gateway-token`.
    - إذا كان بعيدًا، أنشئ نفقًا أولًا: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع السر المشترك: اضبط `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم الصق السر المطابق في إعدادات واجهة التحكم.
    - وضع Tailscale Serve: تأكد من تفعيل `gateway.auth.allowTailscale` وأنك تفتح عنوان URL الخاص بـ Serve، وليس عنوان loopback/tailnet خامًا يتجاوز ترويسات هوية Tailscale.
    - وضع الوكيل الموثوق: تأكد من أنك تأتي عبر الوكيل المهيأ والواعي بالهوية، وليس عبر عنوان URL خام للبوابة. تحتاج وكلاء loopback على نفس المضيف أيضًا إلى `gateway.auth.trustedProxy.allowLoopback = true`.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، فدوّر/أعد اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا قالت عملية التدوير إنها رُفضت، فتحقق من أمرين:
      - لا يمكن لجلسات الجهاز المقترن تدوير إلا جهازها **الخاص** بها إلا إذا كانت تملك أيضًا `operator.admin`
      - لا يمكن أن تتجاوز قيم `--scope` الصريحة نطاقات المشغل الحالية للمتصل
    - هل ما زلت عالقًا؟ شغّل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [لوحة المعلومات](/ar/web/dashboard) لتفاصيل المصادقة.

  </Accordion>

  <Accordion title="ضبطت gateway.bind على tailnet لكنه لا يستطيع الربط ولا شيء يستمع">
    يختار ربط `tailnet` عنوان IP لـ Tailscale من واجهات الشبكة لديك (100.64.0.0/10). إذا لم يكن الجهاز على Tailscale (أو كانت الواجهة معطلة)، فلا يوجد شيء يمكن الربط به.

    الإصلاح:

    - شغّل Tailscale على ذلك المضيف (ليحصل على عنوان 100.x)، أو
    - بدّل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. يفضّل `auto` loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطًا خاصًا بـ tailnet فقط.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة Gateways على المضيف نفسه؟">
    عادةً لا - يمكن لـ Gateway واحد تشغيل عدة قنوات مراسلة ووكلاء. استخدم عدة Gateways فقط عندما تحتاج إلى التكرار (مثال: بوت إنقاذ) أو العزل الصارم.

    نعم، لكن يجب عليك العزل:

    - `OPENCLAW_CONFIG_PATH` (إعدادات لكل مثيل)
    - `OPENCLAW_STATE_DIR` (حالة لكل مثيل)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (موصى به):

    - استخدم `openclaw --profile <name> ...` لكل مثيل (ينشئ تلقائيًا `~/.openclaw-<name>`).
    - اضبط `gateway.port` فريدًا في إعدادات كل ملف تعريف (أو مرّر `--port` للتشغيل اليدوي).
    - ثبّت خدمة لكل ملف تعريف: `openclaw --profile <name> gateway install`.

    تضيف ملفات التعريف أيضًا لاحقة إلى أسماء الخدمات (`ai.openclaw.<profile>`؛ القديمة `com.openclaw.*`، `openclaw-gateway-<profile>.service`، `OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [عدة بوابات](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ماذا يعني "مصافحة غير صالحة" / الرمز 1008؟'>
    Gateway هو **خادم WebSocket**، ويتوقع أن تكون الرسالة الأولى تمامًا
    إطار `connect`. إذا تلقى أي شيء آخر، فإنه يغلق الاتصال
    باستخدام **الرمز 1008** (انتهاك السياسة).

    أسباب شائعة:

    - فتحت عنوان URL الخاص بـ **HTTP** في متصفح (`http://...`) بدلًا من عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - أزال وكيل أو نفق ترويسات المصادقة أو أرسل طلبًا غير خاص بـ Gateway.

    إصلاحات سريعة:

    1. استخدم عنوان URL الخاص بـ WS: `ws://<host>:18789` (أو `wss://...` إذا كان HTTPS).
    2. لا تفتح منفذ WS في تبويب متصفح عادي.
    3. إذا كانت المصادقة مفعلة، فأدرج الرمز/كلمة المرور في إطار `connect`.

    إذا كنت تستخدم CLI أو TUI، فيجب أن يبدو عنوان URL هكذا:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    تفاصيل البروتوكول: [بروتوكول Gateway](/ar/gateway/protocol).

  </Accordion>
</AccordionGroup>

## التسجيل وتصحيح الأخطاء

<AccordionGroup>
  <Accordion title="أين توجد السجلات؟">
    سجلات الملفات (مهيكلة):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    يمكنك ضبط مسار ثابت عبر `logging.file`. يتحكم `logging.level` في مستوى سجل الملف. يتحكم `--verbose` و`logging.consoleLevel` في إسهاب وحدة التحكم.

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
    استخدم مساعدات gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا كنت تشغّل البوابة يدويًا، فيمكن لـ `openclaw gateway --force` استعادة المنفذ. راجع [Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="أغلقت الطرفية على Windows - كيف أعيد تشغيل OpenClaw؟">
    توجد **طريقتا تثبيت على Windows**:

    **1) WSL2 (موصى به):** يعمل Gateway داخل Linux.

    افتح PowerShell، وادخل إلى WSL، ثم أعد التشغيل:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا لم تكن قد ثبت الخدمة مطلقًا، فابدأها في الواجهة الأمامية:

    ```bash
    openclaw gateway run
    ```

    **2) Windows أصلي (غير موصى به):** يعمل Gateway مباشرة في Windows.

    افتح PowerShell وشغّل:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا شغلته يدويًا (بلا خدمة)، فاستخدم:

    ```powershell
    openclaw gateway run
    ```

    المستندات: [Windows (WSL2)](/ar/platforms/windows)، [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="Gateway يعمل لكن الردود لا تصل أبدًا. ماذا يجب أن أتحقق؟">
    ابدأ بفحص صحة سريع:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    أسباب شائعة:

    - لم يتم تحميل مصادقة النموذج على **مضيف Gateway** (تحقق من `models status`).
    - اقتران القناة/قائمة السماح يحظران الردود (تحقق من إعدادات القناة + السجلات).
    - WebChat/Dashboard مفتوح من دون الرمز الصحيح.

    إذا كنت تستخدمه عن بُعد، فتأكد من أن اتصال النفق/Tailscale يعمل وأن
    WebSocket الخاص بـ Gateway قابل للوصول.

    المستندات: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"تم قطع الاتصال بـ Gateway: لا يوجد سبب" - ماذا الآن؟'>
    يعني هذا عادةً أن واجهة المستخدم فقدت اتصال WebSocket. تحقق من:

    1. هل Gateway قيد التشغيل؟ `openclaw gateway status`
    2. هل Gateway سليم؟ `openclaw status`
    3. هل لدى واجهة المستخدم الرمز الصحيح؟ `openclaw dashboard`
    4. إذا كنت تستخدمه عن بُعد، هل رابط النفق/Tailscale يعمل؟

    ثم تابع السجلات:

    ```bash
    openclaw logs --follow
    ```

    المستندات: [Dashboard](/ar/web/dashboard)، [الوصول عن بُعد](/ar/gateway/remote)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

  </Accordion>

  <Accordion title="يفشل Telegram setMyCommands. ما الذي يجب أن أتحقق منه؟">
    ابدأ بالسجلات وحالة القناة:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    ثم طابق الخطأ:

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على إدخالات كثيرة جدًا. يقلّص OpenClaw بالفعل إلى حد Telegram ويعيد المحاولة بأوامر أقل، لكن لا تزال بعض إدخالات القائمة بحاجة إلى الإزالة. قلّل أوامر Plugin/Skills/الأوامر المخصصة، أو عطّل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed`، أو `Network request for 'setMyCommands' failed!`، أو أخطاء شبكة مشابهة: إذا كنت على VPS أو خلف وكيل، فتأكد من السماح باتصالات HTTPS الصادرة وأن DNS يعمل لـ `api.telegram.org`.

    إذا كان Gateway بعيدًا، فتأكد من أنك تنظر إلى السجلات على مضيف Gateway.

    المستندات: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="لا يعرض TUI أي مخرجات. ما الذي يجب أن أتحقق منه؟">
    تأكد أولًا من إمكانية الوصول إلى Gateway وأن الوكيل قادر على التشغيل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لرؤية الحالة الحالية. إذا كنت تتوقع ردودًا في قناة دردشة،
    فتأكد من تفعيل التسليم (`/deliver on`).

    المستندات: [TUI](/ar/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway بالكامل ثم أشغّله؟">
    إذا كنت قد ثبّت الخدمة:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    يوقف/يشغّل هذا **الخدمة المُدارة** (launchd على macOS، وsystemd على Linux).
    استخدم هذا عندما يعمل Gateway في الخلفية كخدمة دائمة.

    إذا كنت تشغّله في المقدمة، فأوقفه باستخدام Ctrl-C، ثم:

    ```bash
    openclaw gateway run
    ```

    المستندات: [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="شرح مبسط: openclaw gateway restart مقابل openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **الخدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغّل Gateway **في المقدمة** لجلسة الطرفية هذه.

    إذا كنت قد ثبّت الخدمة، فاستخدم أوامر Gateway. استخدم `openclaw gateway` عندما
    تريد تشغيلًا لمرة واحدة في المقدمة.

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

    - القناة الهدف تدعم الوسائط الصادرة وليست محظورة بقوائم السماح.
    - الملف ضمن حدود الحجم الخاصة بالمزوّد (تُعاد تحجيم الصور إلى حد أقصى 2048px).
    - `tools.fs.workspaceOnly=true` يبقي الإرسال من المسارات المحلية محدودًا بمساحة العمل، ومخزن temp/media-store، والملفات التي تحقق منها sandbox.
    - `tools.fs.workspaceOnly=false` يسمح لـ `MEDIA:` بإرسال ملفات محلية على المضيف يستطيع الوكيل قراءتها بالفعل، لكن للوسائط وأنواع المستندات الآمنة فقط (الصور، والصوت، والفيديو، وPDF، ومستندات Office). تظل الملفات النصية العادية والملفات التي تشبه الأسرار محظورة.

    راجع [الصور](/ar/nodes/images).

  </Accordion>
</AccordionGroup>

## الأمان والتحكم في الوصول

<AccordionGroup>
  <Accordion title="هل من الآمن تعريض OpenClaw للرسائل المباشرة الواردة؟">
    تعامل مع الرسائل المباشرة الواردة كمدخلات غير موثوقة. صُممت الإعدادات الافتراضية لتقليل المخاطر:

    - السلوك الافتراضي على القنوات التي تدعم الرسائل المباشرة هو **الاقتران**:
      - يتلقى المرسلون غير المعروفين رمز اقتران؛ ولا يعالج البوت رسالتهم.
      - وافق باستخدام: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - الطلبات المعلقة محددة بـ **3 لكل قناة**؛ تحقق من `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل رمز.
    - يتطلب فتح الرسائل المباشرة للعامة موافقة صريحة (`dmPolicy: "open"` وقائمة سماح `"*"`).

    شغّل `openclaw doctor` لإظهار سياسات الرسائل المباشرة الخطرة.

  </Accordion>

  <Accordion title="هل حقن التعليمات مصدر قلق للبوتات العامة فقط؟">
    لا. يرتبط حقن التعليمات بـ **المحتوى غير الموثوق**، وليس فقط بمن يستطيع مراسلة البوت مباشرة.
    إذا كان مساعدك يقرأ محتوى خارجيًا (بحث/جلب ويب، صفحات متصفح، رسائل بريد إلكتروني،
    مستندات، مرفقات، سجلات ملصوقة)، فقد يتضمن ذلك المحتوى تعليمات تحاول
    اختطاف النموذج. يمكن أن يحدث هذا حتى إذا **كنت أنت المرسل الوحيد**.

    يكون الخطر الأكبر عندما تكون الأدوات مفعلة: يمكن خداع النموذج
    لتسريب السياق أو استدعاء الأدوات نيابةً عنك. قلّل نطاق الضرر عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو معطّل الأدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` متوقفة للوكلاء المفعلة أدواتهم
    - التعامل مع نص الملفات/المستندات المفكوك كغير موثوق أيضًا: يغلّف OpenResponses
      `input_file` واستخراج مرفقات الوسائط كلاهما النص المستخرج داخل
      علامات حدود صريحة للمحتوى الخارجي بدلًا من تمرير نص الملف الخام
    - استخدام sandbox وقوائم سماح أدوات صارمة

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل ينبغي أن يكون للبوت بريده الإلكتروني أو حساب GitHub أو رقم هاتف خاص به؟">
    نعم، في معظم الإعدادات. يقلّل عزل البوت بحسابات وأرقام هواتف منفصلة
    نطاق الضرر إذا حدث خطأ. كما يجعل تدوير
    بيانات الاعتماد أو إبطال الوصول أسهل دون التأثير على حساباتك الشخصية.

    ابدأ بشكل محدود. امنح الوصول فقط للأدوات والحسابات التي تحتاجها فعليًا، ثم وسّع
    لاحقًا إذا لزم الأمر.

    المستندات: [الأمان](/ar/gateway/security)، [الاقتران](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية، وهل هذا آمن؟">
    لا نوصي بالاستقلالية الكاملة على رسائلك الشخصية. النمط الأكثر أمانًا هو:

    - إبقاء الرسائل المباشرة في **وضع الاقتران** أو ضمن قائمة سماح ضيقة.
    - استخدام **رقم أو حساب منفصل** إذا أردته أن يرسل الرسائل نيابةً عنك.
    - دعه يصوغ المسودة، ثم **وافق قبل الإرسال**.

    إذا أردت التجربة، فافعل ذلك على حساب مخصص وأبقِه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل للدردشة فقط وكانت المدخلات موثوقة. المستويات الأصغر
    أكثر عرضة لاختطاف التعليمات، لذلك تجنبها للوكلاء المفعلة أدواتهم
    أو عند قراءة محتوى غير موثوق. إذا كان لا بد من استخدام نموذج أصغر، فأحكم
    تقييد الأدوات وشغّله داخل sandbox. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="شغّلت /start في Telegram لكن لم أحصل على رمز اقتران">
    تُرسل رموز الاقتران **فقط** عندما يرسل مرسل غير معروف رسالة إلى البوت ويكون
    `dmPolicy: "pairing"` مفعّلًا. لا يولّد `/start` بحد ذاته رمزًا.

    تحقق من الطلبات المعلقة:

    ```bash
    openclaw pairing list telegram
    ```

    إذا أردت وصولًا فوريًا، فأضف معرّف المرسل إلى قائمة السماح أو اضبط `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيراسل جهات الاتصال لدي؟ كيف يعمل الاقتران؟">
    لا. سياسة الرسائل المباشرة الافتراضية في WhatsApp هي **الاقتران**. يحصل المرسلون غير المعروفين على رمز اقتران فقط ولا **تُعالج** رسالتهم. لا يرد OpenClaw إلا على الدردشات التي يتلقاها أو على عمليات الإرسال الصريحة التي تشغّلها.

    وافق على الاقتران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اعرض الطلبات المعلقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لضبط **قائمة السماح/المالك** حتى يُسمح برسائلك المباشرة. لا تُستخدم للإرسال التلقائي. إذا كنت تشغّل على رقم WhatsApp الشخصي لديك، فاستخدم ذلك الرقم وفعّل `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، وإيقاف المهام، و"لن يتوقف"

<AccordionGroup>
  <Accordion title="كيف أوقف ظهور رسائل النظام الداخلية في الدردشة؟">
    لا تظهر معظم الرسائل الداخلية أو رسائل الأدوات إلا عند تفعيل **verbose** أو **trace** أو **reasoning**
    لتلك الجلسة.

    أصلح ذلك في الدردشة التي تراها فيها:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    إذا ظلت الضوضاء موجودة، فتحقق من إعدادات الجلسة في واجهة التحكم واضبط verbose
    على **inherit**. تأكد أيضًا من أنك لا تستخدم ملف تعريف بوت يحتوي على `verboseDefault` مضبوطًا
    على `on` في الإعدادات.

    المستندات: [التفكير وverbose](/ar/tools/thinking)، [الأمان](/ar/gateway/security/index#reasoning-and-verbose-output-in-groups).

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

    للعمليات الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

    ```
    process action:kill sessionId:XXX
    ```

    نظرة عامة على أوامر الشرطة المائلة: راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

    يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`، لكن بعض الاختصارات (مثل `/status`) تعمل أيضًا داخل السطر للمرسلين المدرجين في قائمة السماح.

  </Accordion>

  <Accordion title='كيف أرسل رسالة Discord من Telegram؟ ("تم رفض المراسلة عبر السياقات")'>
    يحظر OpenClaw المراسلة **عبر المزوّدين** افتراضيًا. إذا كان استدعاء أداة مرتبطًا
    بـ Telegram، فلن يرسل إلى Discord إلا إذا سمحت بذلك صراحةً.

    فعّل المراسلة عبر المزوّدين للوكيل:

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

    أعد تشغيل Gateway بعد تعديل الإعدادات.

  </Accordion>

  <Accordion title='لماذا يبدو أن البوت "يتجاهل" الرسائل السريعة المتتابعة؟'>
    يتحكم وضع الطابور في كيفية تفاعل الرسائل الجديدة مع تشغيل قيد التنفيذ. استخدم `/queue` لتغيير الأوضاع:

    - `steer` - وضع كل التوجيه المعلق في الطابور حتى الحد التالي للنموذج في التشغيل الحالي
    - `queue` - توجيه قديم واحد في كل مرة
    - `followup` - تشغيل الرسائل واحدة تلو الأخرى
    - `collect` - تجميع الرسائل والرد مرة واحدة
    - `steer-backlog` - توجيه الآن، ثم معالجة المتراكم
    - `interrupt` - إلغاء التشغيل الحالي والبدء من جديد

    الوضع الافتراضي هو `steer`. يمكنك إضافة خيارات مثل `debounce:0.5s cap:25 drop:summarize` لأوضاع المتابعة. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما النموذج الافتراضي لـ Anthropic عند استخدام مفتاح API؟'>
    في OpenClaw، بيانات الاعتماد واختيار النموذج منفصلان. يؤدي تعيين `ANTHROPIC_API_KEY` (أو تخزين مفتاح Anthropic API في ملفات تعريف المصادقة) إلى تمكين المصادقة، لكن النموذج الافتراضي الفعلي هو ما تضبطه في `agents.defaults.model.primary` (على سبيل المثال، `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). إذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم يتمكن من العثور على بيانات اعتماد Anthropic في ملف `auth-profiles.json` المتوقع للوكيل قيد التشغيل.
  </Accordion>
</AccordionGroup>

---

ما زلت عالقًا؟ اسأل في [Discord](https://discord.com/invite/clawd) أو افتح [مناقشة على GitHub](https://github.com/openclaw/openclaw/discussions).

## ذات صلة

- [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run) — التثبيت، الإعداد الأولي، المصادقة، الاشتراكات، الإخفاقات المبكرة
- [الأسئلة الشائعة للنماذج](/ar/help/faq-models) — اختيار النموذج، تجاوز الفشل، ملفات تعريف المصادقة
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) — فرز يبدأ بالأعراض
