---
read_when:
    - الإجابة عن أسئلة الدعم الشائعة المتعلقة بالإعداد أو التثبيت أو التهيئة الأولية أو وقت التشغيل
    - فرز المشكلات التي أبلغ عنها المستخدمون قبل التعمق في تصحيح الأخطاء
summary: الأسئلة الشائعة حول إعداد OpenClaw وتكوينه واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-05-06T17:58:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d5724af921ab660da3d4453779f269bda440fb27518638541312e489f203318
    source_path: help/faq.md
    workflow: 16
---

إجابات سريعة مع استكشاف أخطاء أعمق للإعدادات الواقعية (التطوير المحلي، VPS، تعدد الوكلاء، OAuth/مفاتيح API، تجاوز فشل النماذج). لتشخيصات وقت التشغيل، راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). لمرجع الإعدادات الكامل، راجع [الإعدادات](/ar/gateway/configuration).

## أول 60 ثانية إذا كان شيء ما معطلا

1. **الحالة السريعة (الفحص الأول)**

   ```bash
   openclaw status
   ```

   ملخص محلي سريع: نظام التشغيل + التحديث، قابلية الوصول إلى Gateway/الخدمة، الوكلاء/الجلسات، إعدادات المزوّد + مشكلات وقت التشغيل (عندما يكون Gateway قابلا للوصول).

2. **تقرير قابل للصق (آمن للمشاركة)**

   ```bash
   openclaw status --all
   ```

   تشخيص للقراءة فقط مع ذيل السجل (مع حجب الرموز المميزة).

3. **حالة Daemon + المنفذ**

   ```bash
   openclaw gateway status
   ```

   يعرض وقت تشغيل المشرف مقابل قابلية الوصول عبر RPC، وعنوان URL المستهدف للفحص، وأي إعدادات استخدمتها الخدمة على الأرجح.

4. **فحوصات عميقة**

   ```bash
   openclaw status --deep
   ```

   يشغّل فحصا مباشرا لصحة Gateway، بما في ذلك فحوصات القنوات عندما تكون مدعومة
   (يتطلب Gateway قابلا للوصول). راجع [الصحة](/ar/gateway/health).

5. **تتبّع أحدث سجل**

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

   يصلح/يرحّل الإعدادات/الحالة + يشغّل فحوصات السلامة. راجع [أداة الفحص والإصلاح](/ar/gateway/doctor).

7. **لقطة Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   يطلب من الـ Gateway قيد التشغيل لقطة كاملة (WS فقط). راجع [الصحة](/ar/gateway/health).

## البدء السريع وإعداد التشغيل الأول

توجد أسئلة وأجوبة التشغيل الأول — التثبيت، والتهيئة، ومسارات المصادقة، والاشتراكات، والإخفاقات الأولية —
في [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run).

## ما OpenClaw؟

<AccordionGroup>
  <Accordion title="ما OpenClaw في فقرة واحدة؟">
    OpenClaw مساعد ذكاء اصطناعي شخصي تشغّله على أجهزتك الخاصة. يرد على أسطح المراسلة التي تستخدمها بالفعل (WhatsApp، وTelegram، وSlack، وMattermost، وDiscord، وGoogle Chat، وSignal، وiMessage، وWebChat، وPlugins قنوات مضمّنة مثل QQ Bot) ويمكنه أيضًا تنفيذ الصوت + Canvas مباشر على المنصات المدعومة. **Gateway** هو مستوى التحكم الدائم التشغيل؛ أما المساعد فهو المنتج.
  </Accordion>

  <Accordion title="القيمة المقترحة">
    OpenClaw ليس "مجرد غلاف لـ Claude." إنه **مستوى تحكم محلي أولًا** يتيح لك تشغيل
    مساعد قادر على **عتادك الخاص**، ويمكن الوصول إليه من تطبيقات الدردشة التي تستخدمها بالفعل، مع
    جلسات ذات حالة، وذاكرة، وأدوات - دون تسليم التحكم في سير عملك إلى
    SaaS مستضاف.

    أبرز النقاط:

    - **أجهزتك وبياناتك:** شغّل Gateway أينما تريد (Mac، Linux، VPS) واحتفظ بمساحة العمل + سجل الجلسات محليًا.
    - **قنوات حقيقية، وليست بيئة ويب معزولة:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/إلخ،
      بالإضافة إلى الصوت عبر الهاتف المحمول وCanvas على المنصات المدعومة.
    - **غير مقيّد بنموذج معيّن:** استخدم Anthropic، وOpenAI، وMiniMax، وOpenRouter، وما إلى ذلك، مع توجيه
      لكل وكيل وآلية تجاوز الفشل.
    - **خيار محلي فقط:** شغّل النماذج المحلية بحيث **يمكن أن تبقى كل البيانات على جهازك** إذا أردت.
    - **توجيه متعدد الوكلاء:** وكلاء منفصلون لكل قناة أو حساب أو مهمة، ولكل منهم
      مساحة عمل وإعدادات افتراضية خاصة به.
    - **مفتوح المصدر وقابل للتعديل:** افحصه ووسّعه واستضفه ذاتيًا دون تقييد بمورّد معيّن.

    المستندات: [Gateway](/ar/gateway)، [القنوات](/ar/channels)، [تعدد الوكلاء](/ar/concepts/multi-agent)،
    [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="لقد أعددته للتو - ماذا أفعل أولًا؟">
    مشاريع جيدة للبدء:

    - أنشئ موقعًا إلكترونيًا (WordPress، أو Shopify، أو موقعًا ثابتًا بسيطًا).
    - أنشئ نموذجًا أوليًا لتطبيق هاتف محمول (مخطط، شاشات، خطة API).
    - نظّم الملفات والمجلدات (تنظيف، تسمية، وسم).
    - صِل Gmail وأتمت الملخصات أو المتابعات.

    يمكنه التعامل مع المهام الكبيرة، لكنه يعمل بأفضل شكل عندما تقسّمها إلى مراحل وتستخدم
    وكلاء فرعيين للعمل المتوازي.

  </Accordion>

  <Accordion title="ما أهم خمس حالات استخدام يومية لـ OpenClaw؟">
    تبدو المكاسب اليومية عادةً مثل:

    - **إحاطات شخصية:** ملخصات لصندوق الوارد والتقويم والأخبار التي تهمك.
    - **البحث والصياغة:** بحث سريع وملخصات ومسودات أولى لرسائل البريد الإلكتروني أو المستندات.
    - **التذكيرات والمتابعات:** تنبيهات وقوائم تحقق مدفوعة بـ Cron أو Heartbeat.
    - **أتمتة المتصفح:** ملء النماذج، وجمع البيانات، وتكرار مهام الويب.
    - **تنسيق عبر الأجهزة:** أرسل مهمة من هاتفك، ودع Gateway يشغّلها على خادم، واحصل على النتيجة في الدردشة.

  </Accordion>

  <Accordion title="هل يمكن أن يساعد OpenClaw في توليد العملاء المحتملين، والتواصل، والإعلانات، والمدونات لخدمة SaaS؟">
    نعم في **البحث، والتأهيل، والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات للتواصل أو نصوص الإعلانات.

    بالنسبة إلى **حملات التواصل أو الإعلانات**، أبقِ إنسانًا ضمن سير العمل. تجنب الرسائل غير المرغوب فيها، واتبع القوانين المحلية
    وسياسات المنصات، وراجع أي شيء قبل إرساله. النمط الأكثر أمانًا هو أن يكتب
    OpenClaw المسودة وأن توافق عليها أنت.

    الوثائق: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما المزايا مقارنةً بـ Claude Code لتطوير الويب؟">
    OpenClaw هو **مساعد شخصي** وطبقة تنسيق، وليس بديلًا عن IDE. استخدم
    Claude Code أو Codex للحصول على أسرع حلقة برمجة مباشرة داخل مستودع. استخدم OpenClaw عندما
    تريد ذاكرة دائمة، ووصولًا عبر الأجهزة، وتنسيقًا للأدوات.

    المزايا:

    - **ذاكرة ومساحة عمل دائمتان** عبر الجلسات
    - **وصول متعدد المنصات** (WhatsApp، Telegram، TUI، WebChat)
    - **تنسيق الأدوات** (المتصفح، الملفات، الجدولة، الخطافات)
    - **Gateway دائم التشغيل** (شغّله على VPS، وتفاعل من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/التنفيذ المحلي

    العرض: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="كيف أخصّص Skills دون إبقاء المستودع في حالة غير نظيفة؟">
    استخدم التجاوزات المُدارة بدلًا من تعديل نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدًا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). تكون الأولوية هي `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمنة → `skills.load.extraDirs`، لذلك لا تزال التجاوزات المُدارة تتغلب على Skills المضمنة دون لمس git. إذا كنت تحتاج إلى تثبيت Skill بشكل عام ولكن مع إظهاره لبعض الوكلاء فقط، فأبقِ النسخة المشتركة في `~/.openclaw/skills` وتحكّم في الظهور باستخدام `agents.defaults.skills` و `agents.list[].skills`. يجب أن تعيش التعديلات الجديرة بالرفع إلى المشروع الأصلي فقط في المستودع وأن تُرسل كـ PRs.
  </Accordion>

  <Accordion title="هل يمكنني تحميل Skills من مجلد مخصص؟">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (أدنى أولوية). الأولوية الافتراضية هي `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمنة → `skills.load.extraDirs`. يثبّت `clawhub` في `./skills` افتراضيًا، ويتعامل OpenClaw مع ذلك باعتباره `<workspace>/skills` في الجلسة التالية. إذا كان يجب أن تكون Skill مرئية لوكلاء معينين فقط، فاقرن ذلك مع `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="كيف يمكنني استخدام نماذج مختلفة لمهام مختلفة؟">
    الأنماط المدعومة اليوم هي:

    - **مهام Cron**: يمكن للمهام المعزولة تعيين تجاوز `model` لكل مهمة.
    - **الوكلاء الفرعيون**: وجّه المهام إلى وكلاء منفصلين بنماذج افتراضية مختلفة.
    - **التبديل عند الطلب**: استخدم `/model` لتبديل نموذج الجلسة الحالية في أي وقت.

    راجع [مهام Cron](/ar/automation/cron-jobs)، و[توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="يتجمد البوت أثناء تنفيذ عمل ثقيل. كيف أحمّل ذلك على جهة أخرى؟">
    استخدم **الوكلاء الفرعيين** للمهام الطويلة أو المتوازية. تعمل الوكلاء الفرعيون في جلستها الخاصة،
    وتعيد ملخصًا، وتُبقي محادثتك الرئيسية مستجيبة.

    اطلب من البوت "spawn a sub-agent for this task" أو استخدم `/subagents`.
    استخدم `/status` في المحادثة لمعرفة ما يفعله Gateway الآن (وما إذا كان مشغولًا).

    نصيحة بخصوص الرموز: تستهلك المهام الطويلة والوكلاء الفرعيون الرموز. إذا كانت التكلفة مصدر قلق، فعيّن
    نموذجًا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="كيف تعمل جلسات الوكلاء الفرعيين المرتبطة بالسلاسل على Discord؟">
    استخدم روابط السلاسل. يمكنك ربط سلسلة Discord بوكيل فرعي أو هدف جلسة بحيث تبقى رسائل المتابعة في تلك السلسلة ضمن الجلسة المرتبطة.

    التدفق الأساسي:

    - أنشئ باستخدام `sessions_spawn` مع `thread: true` (واختياريًا `mode: "session"` للمتابعة الدائمة).
    - أو اربط يدويًا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الربط.
    - استخدم `/session idle <duration|off>` و `/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل السلسلة.

    الإعداد المطلوب:

    - الإعدادات الافتراضية العامة: `session.threadBindings.enabled`، و`session.threadBindings.idleHours`، و`session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: `channels.discord.threadBindings.enabled`، و`channels.discord.threadBindings.idleHours`، و`channels.discord.threadBindings.maxAgeHours`.
    - الربط التلقائي عند الإنشاء: القيمة الافتراضية لـ `channels.discord.threadBindings.spawnSessions` هي `true`؛ عيّنها إلى `false` لتعطيل إنشاء الجلسات المرتبطة بالسلاسل.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع التهيئة](/ar/gateway/configuration-reference)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="انتهى وكيل فرعي، لكن تحديث الاكتمال ذهب إلى المكان الخطأ أو لم يُنشر قط. ما الذي يجب أن أتحقق منه؟">
    تحقق أولًا من مسار الطالب الذي تم حله:

    - يفضّل تسليم الوكيل الفرعي في وضع الاكتمال أي سلسلة مرتبطة أو مسار محادثة عند وجود أحدهما.
    - إذا كان أصل الاكتمال يحمل قناة فقط، يعود OpenClaw إلى المسار المخزن لجلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) حتى يظل التسليم المباشر قادرًا على النجاح.
    - إذا لم يوجد مسار مرتبط ولا مسار مخزن قابل للاستخدام، فقد يفشل التسليم المباشر ويعود الناتج بدلًا من ذلك إلى تسليم الجلسة في قائمة الانتظار بدلًا من النشر فورًا في المحادثة.
    - لا تزال الأهداف غير الصالحة أو القديمة قادرة على فرض الرجوع إلى قائمة الانتظار أو فشل التسليم النهائي.
    - إذا كان آخر رد مساعد مرئي من الابن هو رمز الصمت المطابق تمامًا `NO_REPLY` / `no_reply`، أو مطابقًا تمامًا لـ `ANNOUNCE_SKIP`، فإن OpenClaw يكبت الإعلان عمدًا بدلًا من نشر تقدم سابق قديم.
    - إذا انتهت مهلة الابن بعد استدعاءات أدوات فقط، فيمكن للإعلان أن يختصر ذلك إلى ملخص تقدم جزئي قصير بدلًا من إعادة تشغيل مخرجات الأدوات الخام.

    التصحيح:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="لا تعمل Cron أو التذكيرات. ما الذي يجب أن أتحقق منه؟">
    تعمل Cron داخل عملية Gateway. إذا لم يكن Gateway يعمل باستمرار،
    فلن تعمل المهام المجدولة.

    قائمة التحقق:

    - تأكد من أن cron مفعّل (`cron.enabled`) وأن `OPENCLAW_SKIP_CRON` غير معيّن.
    - تحقق من أن Gateway يعمل على مدار الساعة طوال أيام الأسبوع (دون سكون/إعادة تشغيل).
    - تحقق من إعدادات المنطقة الزمنية للمهمة (`--tz` مقابل المنطقة الزمنية للمضيف).

    التصحيح:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="تم تشغيل Cron، لكن لم يُرسل أي شيء إلى القناة. لماذا؟">
    تحقق من وضع التسليم أولًا:

    - `--no-deliver` / `delivery.mode: "none"` يعني أنه لا يُتوقع إرسال احتياطي من المشغّل.
    - هدف الإعلان المفقود أو غير الصالح (`channel` / `to`) يعني أن المشغّل تخطّى التسليم الصادر.
    - إخفاقات مصادقة القناة (`unauthorized`, `Forbidden`) تعني أن المشغّل حاول التسليم لكن بيانات الاعتماد منعته.
    - تُعامل النتيجة المعزولة الصامتة (`NO_REPLY` / `no_reply` فقط) على أنها غير قابلة للتسليم عمدًا، لذلك يمنع المشغّل أيضًا تسليم الاحتياط المصفوف في الطابور.

    بالنسبة إلى مهام Cron المعزولة، لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message`
    عندما يكون مسار دردشة متاحًا. يتحكم `--announce` فقط في مسار الاحتياط الخاص بالمشغّل
    للنص النهائي الذي لم يكن الوكيل قد أرسله بالفعل.

    تصحيح الأخطاء:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [مهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="لماذا بدّل تشغيل Cron معزول النماذج أو أعاد المحاولة مرة واحدة؟">
    يكون ذلك عادةً مسار تبديل النموذج الحي، وليس جدولة مكررة.

    يمكن لـ Cron المعزول حفظ تسليم نموذج وقت التشغيل وإعادة المحاولة عندما يطرح التشغيل
    النشط `LiveSessionModelSwitchError`. تحتفظ إعادة المحاولة بالمزوّد/النموذج
    الذي تم التبديل إليه، وإذا حمل التبديل تجاوزًا جديدًا لملف تعريف المصادقة، يحفظه Cron
    أيضًا قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يتقدم تجاوز نموذج خطاف Gmail أولًا عند انطباقه.
    - ثم `model` لكل مهمة.
    - ثم أي تجاوز نموذج محفوظ لجلسة Cron.
    - ثم اختيار النموذج المعتاد للوكيل/النموذج الافتراضي.

    حلقة إعادة المحاولة محدودة. بعد المحاولة الأولى بالإضافة إلى محاولتي تبديل، يوقف
    Cron العملية بدلًا من الدوران إلى الأبد.

    تصحيح الأخطاء:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [Cron CLI](/ar/cli/cron).

  </Accordion>

  <Accordion title="كيف أثبّت Skills على Linux؟">
    استخدم أوامر `openclaw skills` الأصلية أو ضع Skills في مساحة عملك. واجهة Skills على macOS غير متاحة على Linux.
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
    لمساحة العمل النشطة. ثبّت CLI المنفصل `clawhub` فقط إذا كنت تريد نشر Skills الخاصة بك أو
    مزامنتها. للتثبيتات المشتركة بين الوكلاء، ضع Skill تحت
    `~/.openclaw/skills` واستخدم `agents.defaults.skills` أو
    `agents.list[].skills` إذا كنت تريد تضييق نطاق الوكلاء الذين يمكنهم رؤيتها.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw تشغيل المهام وفق جدول أو باستمرار في الخلفية؟">
    نعم. استخدم مجدول Gateway:

    - **مهام Cron** للمهام المجدولة أو المتكررة (تستمر عبر عمليات إعادة التشغيل).
    - **Heartbeat** للفحوصات الدورية الخاصة بـ "الجلسة الرئيسية".
    - **المهام المعزولة** للوكلاء المستقلين الذين ينشرون ملخصات أو يسلّمون إلى الدردشات.

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills الخاصة بـ Apple macOS فقط من Linux؟">
    ليس مباشرة. تُقيّد Skills الخاصة بـ macOS بواسطة `metadata.openclaw.os` بالإضافة إلى الثنائيات المطلوبة، ولا تظهر Skills في موجّه النظام إلا عندما تكون مؤهلة على **مضيف Gateway**. على Linux، لن تُحمّل Skills الخاصة بـ `darwin` فقط (مثل `apple-notes` و`apple-reminders` و`things-mac`) إلا إذا تجاوزت التقييد.

    لديك ثلاثة أنماط مدعومة:

    **الخيار A - شغّل Gateway على Mac (الأبسط).**
    شغّل Gateway حيث توجد ثنائيات macOS، ثم اتصل من Linux في [الوضع البعيد](#gateway-ports-already-running-and-remote-mode) أو عبر Tailscale. تُحمّل Skills بشكل طبيعي لأن مضيف Gateway هو macOS.

    **الخيار B - استخدم عقدة macOS (بدون SSH).**
    شغّل Gateway على Linux، واقرن عقدة macOS (تطبيق شريط القوائم)، واضبط **أوامر تشغيل Node** على "اسأل دائمًا" أو "اسمح دائمًا" على Mac. يمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما توجد الثنائيات المطلوبة على العقدة. يشغّل الوكيل تلك Skills عبر أداة `nodes`. إذا اخترت "اسأل دائمًا"، فإن الموافقة على "اسمح دائمًا" في الموجّه تضيف ذلك الأمر إلى قائمة السماح.

    **الخيار C - وكّل ثنائيات macOS عبر SSH (متقدم).**
    أبقِ Gateway على Linux، لكن اجعل ثنائيات CLI المطلوبة تُحل إلى مغلفات SSH تعمل على Mac. ثم تجاوز Skill للسماح بـ Linux كي تبقى مؤهلة.

    1. أنشئ مغلف SSH للثنائية (مثال: `memo` لملاحظات Apple):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ضع المغلف على `PATH` على مضيف Linux (مثلًا `~/bin/memo`).
    3. تجاوز بيانات Skill الوصفية (مساحة العمل أو `~/.openclaw/skills`) للسماح بـ Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. ابدأ جلسة جديدة حتى تتحدّث لقطة Skills.

  </Accordion>

  <Accordion title="هل لديكم تكامل مع Notion أو HeyGen؟">
    ليس مدمجًا اليوم.

    الخيارات:

    - **Skill / Plugin مخصص:** الأفضل للوصول الموثوق إلى API (لدى Notion/HeyGen واجهات API).
    - **أتمتة المتصفح:** تعمل دون كود لكنها أبطأ وأكثر هشاشة.

    إذا كنت تريد الاحتفاظ بالسياق لكل عميل (سير عمل الوكالات)، فالنمط البسيط هو:

    - صفحة Notion واحدة لكل عميل (السياق + التفضيلات + العمل النشط).
    - اطلب من الوكيل جلب تلك الصفحة في بداية الجلسة.

    إذا كنت تريد تكاملًا أصليًا، فافتح طلب ميزة أو ابنِ Skill
    تستهدف تلك الواجهات البرمجية.

    تثبيت Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تصل التثبيتات الأصلية إلى دليل `skills/` في مساحة العمل النشطة. بالنسبة إلى Skills المشتركة بين الوكلاء، ضعها في `~/.openclaw/skills/<name>/SKILL.md`. إذا كان يجب أن يرى بعض الوكلاء فقط تثبيتًا مشتركًا، فاضبط `agents.defaults.skills` أو `agents.list[].skills`. تتوقع بعض Skills ثنائيات مثبتة عبر Homebrew؛ على Linux يعني ذلك Linuxbrew (راجع إدخال الأسئلة الشائعة الخاص بـ Homebrew على Linux أعلاه). راجع [Skills](/ar/tools/skills)، و[إعدادات Skills](/ar/tools/skills-config)، و[ClawHub](/ar/tools/clawhub).

  </Accordion>

  <Accordion title="كيف أستخدم Chrome الحالي الذي سجلت الدخول إليه مع OpenClaw؟">
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

    يمكن لهذا المسار استخدام متصفح المضيف المحلي أو عقدة متصفح متصلة. إذا كان Gateway يعمل في مكان آخر، فإما أن تشغّل مضيف عقدة على جهاز المتصفح أو تستخدم CDP بعيدًا بدلًا من ذلك.

    القيود الحالية على `existing-session` / `user`:

    - الإجراءات مدفوعة بالمراجع، وليست مدفوعة بمحددات CSS
    - تتطلب عمليات الرفع `ref` / `inputRef` وتدعم حاليًا ملفًا واحدًا في كل مرة
    - لا تزال `responsebody`، وتصدير PDF، واعتراض التنزيل، والإجراءات الدفعية تحتاج إلى متصفح مُدار أو ملف تعريف CDP خام

  </Accordion>
</AccordionGroup>

## العزل وذاكرة التخزين

<AccordionGroup>
  <Accordion title="هل توجد وثيقة مخصصة للعزل؟">
    نعم. راجع [العزل](/ar/gateway/sandboxing). للإعداد الخاص بـ Docker (Gateway كامل في Docker أو صور العزل)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدودًا - كيف أفعّل الميزات الكاملة؟">
    الصورة الافتراضية تضع الأمان أولًا وتعمل كمستخدم `node`، لذلك لا
    تتضمن حزم النظام أو Homebrew أو المتصفحات المضمنة. لإعداد أكمل:

    - أبقِ `/home/node` مستمرًا باستخدام `OPENCLAW_HOME_VOLUME` حتى تبقى الذاكرات المؤقتة.
    - اخبز تبعيات النظام في الصورة باستخدام `OPENCLAW_DOCKER_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المضمن:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - اضبط `PLAYWRIGHT_BROWSERS_PATH` وتأكد من استمرار المسار.

    الوثائق: [Docker](/ar/install/docker)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل الخاصة شخصية مع جعل المجموعات عامة/معزولة باستخدام وكيل واحد؟">
    نعم - إذا كانت الحركة الخاصة بك هي **رسائل خاصة** والحركة العامة هي **مجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` حتى تعمل جلسات المجموعة/القناة (المفاتيح غير الرئيسية) في خلفية العزل المضبوطة، بينما تبقى جلسة الرسائل الخاصة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال إعداد: [المجموعات: رسائل خاصة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع الإعداد الرئيسي: [إعدادات Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلد مضيف داخل العزل؟">
    اضبط `agents.defaults.sandbox.docker.binds` على `["host:path:mode"]` (مثل `"/home/user/src:/src:ro"`). تُدمج الروابط العامة وروابط كل وكيل؛ ويتم تجاهل روابط كل وكيل عندما يكون `scope: "shared"`. استخدم `:ro` لأي شيء حساس وتذكر أن الروابط تتجاوز جدران نظام ملفات العزل.

    يتحقق OpenClaw من مصادر الربط مقابل المسار المطبّع والمسار القانوني المحلول عبر أعمق سلف موجود. يعني ذلك أن عمليات الهروب عبر أصل رمزي لا تزال تفشل بإغلاق حتى عندما لا يكون مقطع المسار الأخير موجودًا بعد، وأن فحوصات الجذر المسموح لا تزال تنطبق بعد حل الروابط الرمزية.

    راجع [العزل](/ar/gateway/sandboxing#custom-bind-mounts) و[العزل مقابل سياسة الأدوات مقابل المرفوع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للاطلاع على أمثلة وملاحظات الأمان.

  </Accordion>

  <Accordion title="كيف تعمل ذاكرة التخزين؟">
    ذاكرة تخزين OpenClaw هي مجرد ملفات Markdown في مساحة عمل الوكيل:

    - ملاحظات يومية في `memory/YYYY-MM-DD.md`
    - ملاحظات طويلة الأمد منسقة في `MEMORY.md` (الجلسات الرئيسية/الخاصة فقط)

    يشغّل OpenClaw أيضًا **تفريغ ذاكرة تخزين صامت قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction التلقائي. يعمل هذا فقط عندما تكون مساحة العمل
    قابلة للكتابة (تتخطاه بيئات العزل للقراءة فقط). راجع [ذاكرة التخزين](/ar/concepts/memory).

  </Accordion>

  <Accordion title="ذاكرة التخزين تستمر في نسيان الأشياء. كيف أجعلها تثبت؟">
    اطلب من البوت **كتابة الحقيقة إلى ذاكرة التخزين**. تنتمي الملاحظات طويلة الأمد إلى `MEMORY.md`،
    أما السياق قصير الأمد فيذهب إلى `memory/YYYY-MM-DD.md`.

    لا يزال هذا مجالًا نعمل على تحسينه. من المفيد تذكير النموذج بتخزين الذكريات؛
    سيعرف ما ينبغي فعله. إذا استمر في النسيان، فتحقق من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل.

    الوثائق: [ذاكرة التخزين](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تستمر ذاكرة التخزين إلى الأبد؟ ما حدودها؟">
    تعيش ملفات ذاكرة التخزين على القرص وتستمر حتى تحذفها. الحد هو
    مساحة التخزين لديك، وليس النموذج. لا يزال **سياق الجلسة** محدودًا بنافذة سياق النموذج،
    لذلك يمكن للمحادثات الطويلة أن تُضغط أو تُقتطع. لهذا السبب
    يوجد بحث ذاكرة التخزين - فهو يعيد إلى السياق الأجزاء ذات الصلة فقط.

    الوثائق: [ذاكرة التخزين](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب بحث الذاكرة الدلالي مفتاح OpenAI API؟">
    فقط إذا كنت تستخدم **OpenAI embeddings**. يغطي Codex OAuth الدردشة/الإكمالات ولا
    يمنح وصولًا إلى embeddings، لذلك **تسجيل الدخول باستخدام Codex (OAuth أو تسجيل دخول
    Codex CLI)** لا يساعد في بحث الذاكرة الدلالي. لا تزال OpenAI embeddings
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تضبط موفرًا صراحة، يختار OpenClaw موفرًا تلقائيًا عندما
    يستطيع حل مفتاح API (ملفات تعريف المصادقة، `models.providers.*.apiKey`، أو متغيرات البيئة).
    يفضل OpenAI إذا تم حل مفتاح OpenAI، وإلا Gemini إذا تم حل مفتاح Gemini،
    ثم Voyage، ثم Mistral. إذا لم يتوفر مفتاح بعيد، يبقى بحث
    الذاكرة معطلًا حتى تضبطه. إذا كان لديك مسار نموذج محلي
    مضبوط وموجود، يفضل OpenClaw
    `local`. Ollama مدعوم عندما تضبط صراحة
    `memorySearch.provider = "ollama"`.

    إذا كنت تفضل البقاء محليًا، فاضبط `memorySearch.provider = "local"` (واختياريًا
    `memorySearch.fallback = "none"`). إذا كنت تريد Gemini embeddings، فاضبط
    `memorySearch.provider = "gemini"` ووفر `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). ندعم نماذج embedding من **OpenAI، Gemini، Voyage، Mistral، Ollama، أو local**
    - راجع [الذاكرة](/ar/concepts/memory) لتفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## أين توجد الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل تُحفظ كل البيانات المستخدمة مع OpenClaw محليًا؟">
    لا - **حالة OpenClaw محلية**، لكن **الخدمات الخارجية لا تزال ترى ما ترسله إليها**.

    - **محليًا افتراضيًا:** الجلسات، وملفات الذاكرة، والإعدادات، ومساحة العمل موجودة على مضيف Gateway
      (`~/.openclaw` + دليل مساحة عملك).
    - **بعيدًا بحكم الضرورة:** الرسائل التي ترسلها إلى موفري النماذج (Anthropic/OpenAI/etc.) تذهب إلى
      واجهات API الخاصة بهم، ومنصات الدردشة (WhatsApp/Telegram/Slack/etc.) تخزن بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في الأثر:** استخدام النماذج المحلية يبقي المطالبات على جهازك، لكن حركة القناة
      لا تزال تمر عبر خوادم القناة.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    كل شيء موجود تحت `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | المسار                                                          | الغرض                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | الإعداد الرئيسي (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | استيراد OAuth القديم (يُنسخ إلى ملفات تعريف المصادقة عند أول استخدام) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات تعريف المصادقة (OAuth، مفاتيح API، و`keyRef`/`tokenRef` اختياريًا) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | حمولة أسرار اختيارية مدعومة بملف لموفري SecretRef من نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ملف توافق قديم (تُزال إدخالات `api_key` الثابتة)                 |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | حالة الموفر (مثل `whatsapp/<accountId>/creds.json`)               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | حالة كل وكيل (agentDir + الجلسات)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | سجل المحادثة والحالة (لكل وكيل)                                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | بيانات تعريف الجلسة (لكل وكيل)                                    |

    مسار الوكيل الفردي القديم: `~/.openclaw/agent/*` (يهاجره `openclaw doctor`).

    **مساحة العمل** الخاصة بك (AGENTS.md، ملفات الذاكرة، Skills، إلخ) منفصلة وتُضبط عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    توجد هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`,
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` اختياري.
      ملف الجذر القديم بالأحرف الصغيرة `memory.md` هو إدخال إصلاح قديم فقط؛ يستطيع `openclaw doctor --fix`
      دمجه في `MEMORY.md` عندما يكون الملفان موجودين.
    - **دليل الحالة (`~/.openclaw`)**: الإعدادات، حالة القنوات/الموفرين، ملفات تعريف المصادقة، الجلسات، السجلات،
      وSkills المشتركة (`~/.openclaw/skills`).

    مساحة العمل الافتراضية هي `~/.openclaw/workspace`، ويمكن ضبطها عبر:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    إذا كان الروبوت "ينسى" بعد إعادة التشغيل، فتأكد من أن Gateway يستخدم مساحة العمل نفسها
    عند كل تشغيل (وتذكر: الوضع البعيد يستخدم **مساحة عمل مضيف gateway**
    وليس حاسوبك المحمول المحلي).

    نصيحة: إذا كنت تريد سلوكًا أو تفضيلًا دائمًا، فاطلب من الروبوت **كتابته في
    AGENTS.md أو MEMORY.md** بدلًا من الاعتماد على سجل الدردشة.

    راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) و[الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="استراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** الخاصة بك في مستودع git **خاص** وانسخها احتياطيًا في مكان
    خاص (مثل GitHub private). يلتقط هذا الذاكرة + ملفات AGENTS/SOUL/USER،
    ويتيح لك استعادة "عقل" المساعد لاحقًا.

    لا تضع أي شيء تحت `~/.openclaw` في commit (بيانات الاعتماد، الجلسات، الرموز، أو حمولات الأسرار المشفرة).
    إذا كنت تحتاج إلى استعادة كاملة، فانسخ كلًا من مساحة العمل ودليل الحالة
    احتياطيًا بشكل منفصل (راجع سؤال الترحيل أعلاه).

    الوثائق: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف أزيل تثبيت OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إزالة التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. مساحة العمل هي **cwd الافتراضي** ومرساة الذاكرة، وليست صندوقًا رمليًا صارمًا.
    تُحل المسارات النسبية داخل مساحة العمل، لكن المسارات المطلقة يمكنها الوصول إلى مواقع أخرى
    على المضيف ما لم يكن العزل الرملي مفعّلًا. إذا كنت تحتاج إلى عزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات العزل الرملي لكل وكيل. إذا كنت
    تريد أن يكون مستودع ما هو دليل العمل الافتراضي، فوجه `workspace` لذلك الوكيل
    إلى جذر المستودع. مستودع OpenClaw هو مجرد شيفرة مصدرية؛ أبقِ
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

  <Accordion title="الوضع البعيد: أين يوجد مخزن الجلسات؟">
    حالة الجلسة يملكها **مضيف gateway**. إذا كنت في الوضع البعيد، فمخزن الجلسات الذي يهمك موجود على الجهاز البعيد، وليس على حاسوبك المحمول المحلي. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>
</AccordionGroup>

## أساسيات الإعداد

<AccordionGroup>
  <Accordion title="ما تنسيق الإعداد؟ وأين يوجد؟">
    يقرأ OpenClaw إعداد **JSON5** اختياريًا من `$OPENCLAW_CONFIG_PATH` (الافتراضي: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    إذا كان الملف مفقودًا، فإنه يستخدم افتراضيات آمنة إلى حد ما (بما في ذلك مساحة عمل افتراضية قدرها `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='ضبطت gateway.bind: "lan" (أو "tailnet") والآن لا شيء يستمع / تقول UI غير مصرح'>
    الربط بغير loopback **يتطلب مسار مصادقة gateway صالحًا**. عمليًا، يعني ذلك:

    - مصادقة السر المشترك: رمز أو كلمة مرور
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

    - `gateway.remote.token` / `.password` لا يفعّلان مصادقة gateway المحلية بمفردهما.
    - يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كاحتياطي فقط عندما يكون `gateway.auth.*` غير مضبوط.
    - لمصادقة كلمة المرور، اضبط `gateway.auth.mode: "password"` مع `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`) بدلًا من ذلك.
    - إذا تم ضبط `gateway.auth.token` / `gateway.auth.password` صراحة عبر SecretRef ولم يُحل، يفشل الحل مغلقًا (بدون إخفاء عبر احتياطي بعيد).
    - إعدادات Control UI ذات السر المشترك تصادق عبر `connect.params.auth.token` أو `connect.params.auth.password` (المخزنة في إعدادات التطبيق/UI). تستخدم أوضاع حمل الهوية مثل Tailscale Serve أو `trusted-proxy` ترويسات الطلب بدلًا من ذلك. تجنب وضع الأسرار المشتركة في عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، تتطلب وكلاء loopback العكسية على المضيف نفسه ضبط `gateway.auth.trustedProxy.allowLoopback = true` صراحة وإدخال loopback في `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="لماذا أحتاج إلى رمز على localhost الآن؟">
    يفرض OpenClaw مصادقة gateway افتراضيًا، بما في ذلك loopback. في المسار الافتراضي العادي يعني ذلك مصادقة الرمز: إذا لم يُضبط مسار مصادقة صريح، يحل بدء gateway إلى وضع الرمز وينشئ رمزًا صالحًا لمدة التشغيل فقط لذلك التشغيل، لذلك **يجب أن تصادق عملاء WS المحليون**. اضبط `gateway.auth.token` أو `gateway.auth.password` أو `OPENCLAW_GATEWAY_TOKEN` أو `OPENCLAW_GATEWAY_PASSWORD` صراحة عندما تحتاج العملاء إلى سر ثابت عبر عمليات إعادة التشغيل. يمنع هذا العمليات المحلية الأخرى من استدعاء Gateway.

    إذا كنت تفضل مسار مصادقة مختلفًا، يمكنك اختيار وضع كلمة المرور صراحة (أو، للوكلاء العكسيين المدركين للهوية، `trusted-proxy`). إذا كنت **تريد حقًا** فتح loopback، فاضبط `gateway.auth.mode: "none"` صراحة في إعدادك. يستطيع Doctor إنشاء رمز لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب أن أعيد التشغيل بعد تغيير الإعداد؟">
    يراقب Gateway الإعداد ويدعم إعادة التحميل الساخنة:

    - `gateway.reload.mode: "hybrid"` (الافتراضي): تطبيق التغييرات الآمنة أثناء التشغيل، وإعادة التشغيل للتغييرات الحرجة
    - `hot` و`restart` و`off` مدعومة أيضًا

  </Accordion>

  <Accordion title="كيف أعطل عبارات CLI الطريفة؟">
    اضبط `cli.banner.taglineMode` في الإعداد:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: يخفي نص العبارة ويبقي سطر عنوان/إصدار اللافتة.
    - `default`: يستخدم `All your chats, one OpenClaw.` في كل مرة.
    - `random`: عبارات طريفة/موسمية متناوبة (السلوك الافتراضي).
    - إذا كنت لا تريد أي لافتة إطلاقًا، فاضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="كيف أفعّل بحث الويب (وجلب الويب)؟">
    يعمل `web_fetch` بدون مفتاح API. يعتمد `web_search` على الموفر
    الذي اخترته:

    - الموفرون المدعومون بواجهات API مثل Brave وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وPerplexity وTavily يتطلبون إعداد مفتاح API العادي الخاص بهم.
    - Ollama Web Search بلا مفتاح، لكنه يستخدم مضيف Ollama المضبوط لديك ويتطلب `ollama signin`.
    - DuckDuckGo بلا مفتاح، لكنه تكامل غير رسمي قائم على HTML.
    - SearXNG بلا مفتاح/مستضاف ذاتيًا؛ اضبط `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

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

    أصبح إعداد البحث في الويب الخاص بكل موفر موجودا الآن ضمن `plugins.entries.<plugin>.config.webSearch.*`.
    ما زالت مسارات الموفر القديمة `tools.web.search.*` تحمل مؤقتا للتوافق، لكن يجب عدم استخدامها للإعدادات الجديدة.
    يوجد إعداد الرجوع الاحتياطي لجلب الويب في Firecrawl ضمن `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم السماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - يكون `web_fetch` مفعلا افتراضيا (ما لم يعطل صراحة).
    - إذا حذف `tools.web.fetch.provider`، يكتشف OpenClaw تلقائيا أول موفر رجوع احتياطي جاهز للجلب من بيانات الاعتماد المتاحة. الموفر المضمن حاليا هو Firecrawl.
    - تقرأ العمليات الخفية متغيرات البيئة من `~/.openclaw/.env` (أو من بيئة الخدمة).

    الوثائق: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="مسح config.apply إعدادي. كيف أستعيده وأتجنب ذلك؟">
    يستبدل `config.apply` **الإعداد بالكامل**. إذا أرسلت كائنا جزئيا، فستزال
    كل الأشياء الأخرى.

    يحمي OpenClaw الحالي من كثير من عمليات الاستبدال العرضية:

    - تتحقق عمليات كتابة الإعدادات المملوكة لـ OpenClaw من الإعداد الكامل بعد التغيير قبل الكتابة.
    - ترفض عمليات الكتابة غير الصالحة أو التدميرية المملوكة لـ OpenClaw وتحفظ باسم `openclaw.json.rejected.*`.
    - إذا تسبب تعديل مباشر في تعطل بدء التشغيل أو إعادة التحميل الساخنة، يفشل Gateway وهو مغلق أو يتخطى إعادة التحميل؛ ولا يعيد كتابة `openclaw.json`.
    - يمتلك `openclaw doctor --fix` الإصلاح ويمكنه استعادة آخر نسخة سليمة مع حفظ الملف المرفوض باسم `openclaw.json.clobbered.*`.

    الاستعادة:

    - تحقق من `openclaw logs --follow` بحثا عن `Invalid config at` أو `Config write rejected:` أو `config reload skipped (invalid config)`.
    - افحص أحدث `openclaw.json.clobbered.*` أو `openclaw.json.rejected.*` بجانب الإعداد النشط.
    - شغل `openclaw config validate` و `openclaw doctor --fix`.
    - انسخ المفاتيح المقصودة فقط مرة أخرى باستخدام `openclaw config set` أو `config.patch`.
    - إذا لم تكن لديك نسخة سليمة أخيرة أو حمولة مرفوضة، فاستعد من نسخة احتياطية، أو أعد تشغيل `openclaw doctor` وأعد إعداد القنوات/النماذج.
    - إذا كان هذا غير متوقع، فأبلغ عن خطأ وأرفق آخر إعداد معروف لديك أو أي نسخة احتياطية.
    - يمكن لوكيل برمجة محلي غالبا إعادة بناء إعداد يعمل من السجلات أو التاريخ.

    تجنب ذلك:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` للتعديلات التفاعلية.
    - استخدم `config.schema.lookup` أولا عندما لا تكون متأكدا من مسار دقيق أو شكل حقل محدد؛ فهو يعيد عقدة مخطط سطحية مع ملخصات فورية للعناصر الفرعية للتنقل التفصيلي.
    - استخدم `config.patch` لتعديلات RPC الجزئية؛ وأبق `config.apply` لاستبدال الإعداد الكامل فقط.
    - إذا كنت تستخدم أداة `gateway` المخصصة للمالك فقط من تشغيل وكيل، فستظل ترفض الكتابة إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك الأسماء المستعارة القديمة `tools.bash.*` التي تطبع إلى مسارات التنفيذ المحمية نفسها).

    الوثائق: [الإعداد](/ar/cli/config)، [الإعداد التفاعلي](/ar/cli/configure)، [استكشاف مشكلات Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغل Gateway مركزيا مع عمال متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحد** (مثل Raspberry Pi) بالإضافة إلى **عقد** و**وكلاء**:

    - **Gateway (مركزي):** يملك القنوات (Signal/WhatsApp)، والتوجيه، والجلسات.
    - **العقد (الأجهزة):** تتصل أجهزة Macs/iOS/Android كملحقات وتعرض أدوات محلية (`system.run`، `canvas`، `camera`).
    - **الوكلاء (العمال):** عقول/مساحات عمل منفصلة لأدوار خاصة (مثل "عمليات Hetzner"، "البيانات الشخصية").
    - **الوكلاء الفرعيون:** يشغلون عملا في الخلفية من وكيل رئيسي عندما تريد التوازي.
    - **TUI:** اتصل بـ Gateway وبدل بين الوكلاء/الجلسات.

    الوثائق: [العقد](/ar/nodes)، [الوصول البعيد](/ar/gateway/remote)، [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/ar/web/tui).

  </Accordion>

  <Accordion title="هل يمكن لمتصفح OpenClaw العمل بلا واجهة؟">
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

    القيمة الافتراضية هي `false` (بواجهة مرئية). التشغيل بلا واجهة أكثر عرضة لإثارة فحوصات مكافحة الروبوتات في بعض المواقع. راجع [المتصفح](/ar/tools/browser).

    يستخدم التشغيل بلا واجهة **محرك Chromium نفسه** ويعمل لمعظم الأتمتة (النماذج، النقرات، الاستخراج، تسجيلات الدخول). الفروق الرئيسية:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات الشاشة إذا كنت تحتاج إلى مرئيات).
    - بعض المواقع أكثر صرامة بشأن الأتمتة في وضع بلا واجهة (CAPTCHA، مكافحة الروبوتات).
      على سبيل المثال، غالبا ما يحظر X/Twitter الجلسات بلا واجهة.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    اضبط `browser.executablePath` على ملف Brave الثنائي لديك (أو أي متصفح مبني على Chromium) وأعد تشغيل Gateway.
    راجع أمثلة الإعداد الكاملة في [المتصفح](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## البوابات والعقد البعيدة

<AccordionGroup>
  <Accordion title="كيف تنتقل الأوامر بين Telegram، وGateway، والعقد؟">
    تعالج رسائل Telegram بواسطة **gateway**. يشغل gateway الوكيل ثم
    يستدعي العقد عبر **Gateway WebSocket** فقط عندما تكون هناك حاجة إلى أداة عقدة:

    Telegram → Gateway → الوكيل → `node.*` → العقدة → Gateway → Telegram

    لا ترى العقد حركة مرور الموفر الواردة؛ فهي تتلقى فقط استدعاءات RPC الخاصة بالعقد.

  </Accordion>

  <Accordion title="كيف يمكن لوكيلي الوصول إلى حاسوبي إذا كان Gateway مستضافا عن بعد؟">
    الإجابة المختصرة: **أقرن حاسوبك كعقدة**. يعمل Gateway في مكان آخر، لكنه يستطيع
    استدعاء أدوات `node.*` (الشاشة، الكاميرا، النظام) على جهازك المحلي عبر Gateway WebSocket.

    الإعداد المعتاد:

    1. شغل Gateway على المضيف دائم التشغيل (VPS/خادم منزلي).
    2. ضع مضيف Gateway وحاسوبك على شبكة tailnet نفسها.
    3. تأكد من إمكانية الوصول إلى Gateway WS (ربط tailnet أو نفق SSH).
    4. افتح تطبيق macOS محليا واتصل بوضع **بعيد عبر SSH** (أو tailnet مباشر)
       حتى يتمكن من التسجيل كعقدة.
    5. وافق على العقدة على Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا يلزم جسر TCP منفصل؛ تتصل العقد عبر Gateway WebSocket.

    تذكير أمني: إقران عقدة macOS يسمح بتشغيل `system.run` على ذلك الجهاز. لا
    تقرن إلا الأجهزة التي تثق بها، وراجع [الأمان](/ar/gateway/security).

    الوثائق: [العقد](/ar/nodes)، [بروتوكول Gateway](/ar/gateway/protocol)، [الوضع البعيد في macOS](/ar/platforms/mac/remote)، [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل لكنني لا أتلقى ردودا. ماذا الآن؟">
    تحقق من الأساسيات:

    - Gateway قيد التشغيل: `openclaw gateway status`
    - صحة Gateway: `openclaw status`
    - صحة القناة: `openclaw channels status`

    ثم تحقق من المصادقة والتوجيه:

    - إذا كنت تستخدم Tailscale Serve، فتأكد من ضبط `gateway.auth.allowTailscale` بشكل صحيح.
    - إذا كنت تتصل عبر نفق SSH، فتأكد من أن النفق المحلي يعمل ويشير إلى المنفذ الصحيح.
    - تأكد من أن قوائم السماح لديك (رسالة مباشرة أو مجموعة) تتضمن حسابك.

    الوثائق: [Tailscale](/ar/gateway/tailscale)، [الوصول البعيد](/ar/gateway/remote)، [القنوات](/ar/channels).

  </Accordion>

  <Accordion title="هل يمكن لمثيلي OpenClaw التحدث إلى بعضهما (محلي + VPS)؟">
    نعم. لا يوجد جسر "روبوت إلى روبوت" مدمج، لكن يمكنك توصيله بعدة
    طرق موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يستطيع كلا الروبوتين الوصول إليها (Telegram/Slack/WhatsApp).
    اجعل الروبوت أ يرسل رسالة إلى الروبوت ب، ثم دع الروبوت ب يرد كالمعتاد.

    **جسر CLI (عام):** شغل سكربتا يستدعي Gateway الآخر باستخدام
    `openclaw agent --message ... --deliver`، مستهدفا دردشة يستمع إليها الروبوت الآخر.
    إذا كان أحد الروبوتين على VPS بعيد، فوجه CLI لديك إلى ذلك Gateway البعيد
    عبر SSH/Tailscale (راجع [الوصول البعيد](/ar/gateway/remote)).

    نمط مثال (يشغل من جهاز يستطيع الوصول إلى Gateway الهدف):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف قيدا وقائيا حتى لا يدخل الروبوتان في حلقة لا نهائية (الرد عند الذكر فقط، أو
    قوائم سماح القنوات، أو قاعدة "لا ترد على رسائل الروبوتات").

    الوثائق: [الوصول البعيد](/ar/gateway/remote)، [CLI الوكيل](/ar/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى VPSات منفصلة لوكلاء متعددين؟">
    لا. يمكن لـ Gateway واحد استضافة عدة وكلاء، لكل منهم مساحة عمله الخاصة، وافتراضات النموذج،
    والتوجيه. هذا هو الإعداد الطبيعي وهو أرخص وأبسط بكثير من تشغيل
    VPS واحد لكل وكيل.

    استخدم VPSات منفصلة فقط عندما تحتاج إلى عزل صارم (حدود أمان) أو
    إعدادات مختلفة جدا لا تريد مشاركتها. بخلاف ذلك، أبق Gateway واحدا
    واستخدم عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل توجد فائدة من استخدام عقدة على حاسوبي المحمول الشخصي بدلا من SSH من VPS؟">
    نعم - العقد هي الطريقة الأساسية للوصول إلى حاسوبك المحمول من Gateway بعيد، وهي
    تتيح أكثر من مجرد وصول إلى الصدفة. يعمل Gateway على macOS/Linux (Windows عبر WSL2) وهو
    خفيف الوزن (يكفي VPS صغير أو صندوق بمستوى Raspberry Pi؛ وذاكرة 4 GB وفيرة)، لذلك فإن الإعداد الشائع
    هو مضيف دائم التشغيل بالإضافة إلى حاسوبك المحمول كعقدة.

    - **لا حاجة إلى SSH وارد.** تتصل العقد إلى الخارج بـ Gateway WebSocket وتستخدم إقران الأجهزة.
    - **ضوابط تنفيذ أكثر أمانا.** يخضع `system.run` لقوائم السماح/الموافقات الخاصة بالعقدة على ذلك الحاسوب المحمول.
    - **أدوات أجهزة أكثر.** تعرض العقد `canvas` و`camera` و`screen` بالإضافة إلى `system.run`.
    - **أتمتة متصفح محلية.** أبق Gateway على VPS، لكن شغل Chrome محليا عبر مضيف عقدة على الحاسوب المحمول، أو اتصل بـ Chrome المحلي على المضيف عبر Chrome MCP.

    يعد SSH مناسبا للوصول العارض إلى الصدفة، لكن العقد أبسط لسير عمل الوكلاء المستمر
    وأتمتة الأجهزة.

    الوثائق: [العقد](/ar/nodes)، [CLI العقد](/ar/cli/nodes)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تشغل العقد خدمة gateway؟">
    لا. يجب تشغيل **gateway واحد** فقط لكل مضيف ما لم تشغل ملفات تعريف معزولة عمدا (راجع [بوابات متعددة](/ar/gateway/multiple-gateways)). العقد هي ملحقات تتصل
    بـ gateway (عقد iOS/Android، أو "وضع العقدة" في macOS في تطبيق شريط القوائم). لمضيفي العقد بلا واجهة
    والتحكم عبر CLI، راجع [CLI مضيف العقدة](/ar/cli/node).

    يلزم إعادة تشغيل كاملة لتغييرات `gateway` و`discovery` و`canvasHost`.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق الإعداد؟">
    نعم.

    - `config.schema.lookup`: افحص شجرة تكوين فرعية واحدة مع عقدة المخطط السطحية الخاصة بها، وتلميح الواجهة المطابق، وملخصات الأبناء المباشرين قبل الكتابة
    - `config.get`: اجلب اللقطة الحالية + التجزئة
    - `config.patch`: تحديث جزئي آمن (مفضل لمعظم تعديلات RPC)؛ يعيد التحميل الحي عند الإمكان ويعيد التشغيل عند الحاجة
    - `config.apply`: تحقق + استبدل التكوين الكامل؛ يعيد التحميل الحي عند الإمكان ويعيد التشغيل عند الحاجة
    - أداة وقت التشغيل `gateway` الخاصة بالمالك فقط ما زالت ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ الأسماء المستعارة القديمة `tools.bash.*` تُطبّع إلى مسارات التنفيذ المحمية نفسها

  </Accordion>

  <Accordion title="تكوين سليم بسيط لأول تثبيت">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    يضبط هذا مساحة العمل لديك ويقيّد من يمكنه تشغيل البوت.

  </Accordion>

  <Accordion title="كيف أعد Tailscale على VPS وأتصل من جهاز Mac الخاص بي؟">
    الخطوات الدنيا:

    1. **ثبّت + سجّل الدخول على VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ثبّت + سجّل الدخول على جهاز Mac الخاص بك**
       - استخدم تطبيق Tailscale وسجّل الدخول إلى نفس tailnet.
    3. **فعّل MagicDNS (موصى به)**
       - في وحدة تحكم إدارة Tailscale، فعّل MagicDNS حتى يكون لدى VPS اسم ثابت.
    4. **استخدم اسم مضيف tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا كنت تريد واجهة التحكم دون SSH، فاستخدم Tailscale Serve على VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    يُبقي هذا Gateway مرتبطًا بـ local loopback ويكشف HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أوصل عقدة Mac بـ Gateway بعيد (Tailscale Serve)؟">
    يكشف Serve **واجهة تحكم Gateway + WS**. تتصل العقد عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكد من أن VPS + Mac على نفس tailnet**.
    2. **استخدم تطبيق macOS في الوضع البعيد** (يمكن أن يكون هدف SSH اسم مضيف tailnet).
       سيُنفق التطبيق منفذ Gateway ويتصل كعقدة.
    3. **وافق على العقدة** على gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    المستندات: [بروتوكول Gateway](/ar/gateway/protocol)، [الاكتشاف](/ar/gateway/discovery)، [الوضع البعيد على macOS](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل يجب أن أثبّت على حاسوب محمول ثانٍ أم أضيف عقدة فقط؟">
    إذا كنت تحتاج فقط إلى **الأدوات المحلية** (الشاشة/الكاميرا/التنفيذ) على الحاسوب المحمول الثاني، فأضفه كـ
    **عقدة**. يحافظ ذلك على Gateway واحد ويتجنب تكرار التكوين. أدوات العقد المحلية
    حاليًا لنظام macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    ثبّت Gateway ثانيًا فقط عندما تحتاج إلى **عزل صارم** أو بوتين منفصلين تمامًا.

    المستندات: [العقد](/ar/nodes)، [CLI العقد](/ar/cli/nodes)، [بوابات Gateway متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات البيئة وتحميل .env

<AccordionGroup>
  <Accordion title="كيف يحمّل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات البيئة من العملية الأصلية (shell، launchd/systemd، CI، إلخ) ويحمّل أيضًا:

    - `.env` من دليل العمل الحالي
    - ملف `.env` احتياطيًا عامًا من `~/.openclaw/.env` (المعروف أيضًا باسم `$OPENCLAW_STATE_DIR/.env`)

    لا يتجاوز أي من ملفي `.env` متغيرات البيئة الموجودة.

    يمكنك أيضًا تعريف متغيرات بيئة مضمّنة داخل التكوين (تُطبّق فقط إذا كانت مفقودة من بيئة العملية):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    راجع [/environment](/ar/help/environment) لمعرفة الأسبقية والمصادر كاملة.

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

    يشغّل هذا shell تسجيل الدخول لديك ويستورد فقط المفاتيح المتوقعة المفقودة (لا يتجاوز أبدًا). مكافئات متغيرات البيئة:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='ضبطت COPILOT_GITHUB_TOKEN، لكن حالة النماذج تعرض "Shell env: off." لماذا؟'>
    يبلّغ `openclaw models status` عما إذا كان **استيراد بيئة shell** مفعّلًا. "Shell env: off"
    لا يعني أن متغيرات البيئة لديك مفقودة - بل يعني فقط أن OpenClaw لن يحمّل
    shell تسجيل الدخول لديك تلقائيًا.

    إذا كان Gateway يعمل كخدمة (launchd/systemd)، فلن يرث بيئة shell
    لديك. أصلح ذلك بأحد هذه الخيارات:

    1. ضع الرمز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد shell (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في تكوينك (يُطبّق فقط إذا كان مفقودًا).

    ثم أعد تشغيل gateway وتحقق مجددًا:

    ```bash
    openclaw models status
    ```

    تُقرأ رموز Copilot من `COPILOT_GITHUB_TOKEN` (وأيضًا `GH_TOKEN` / `GITHUB_TOKEN`).
    راجع [/concepts/model-providers](/ar/concepts/model-providers) و[/environment](/ar/help/environment).

  </Accordion>
</AccordionGroup>

## الجلسات والمحادثات المتعددة

<AccordionGroup>
  <Accordion title="كيف أبدأ محادثة جديدة؟">
    أرسل `/new` أو `/reset` كرسالة مستقلة. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>

  <Accordion title="هل تُعاد ضبط الجلسات تلقائيًا إذا لم أرسل /new مطلقًا؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا **معطّل افتراضيًا** (الافتراضي **0**).
    اضبطه على قيمة موجبة لتفعيل انتهاء الصلاحية عند الخمول. عند التفعيل، تبدأ الرسالة **التالية**
    بعد فترة الخمول معرّف جلسة جديدًا لمفتاح تلك الدردشة.
    هذا لا يحذف النصوص المنسوخة - بل يبدأ جلسة جديدة فقط.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="هل توجد طريقة لإنشاء فريق من مثيلات OpenClaw (مدير تنفيذي واحد والعديد من الوكلاء)؟">
    نعم، عبر **توجيه متعدد الوكلاء** و**الوكلاء الفرعيين**. يمكنك إنشاء وكيل منسق واحد
    وعدة وكلاء عاملين بمساحات عمل ونماذج خاصة بهم.

    ومع ذلك، من الأفضل النظر إلى هذا باعتباره **تجربة ممتعة**. فهو كثيف الاستهلاك للرموز، وغالبًا
    أقل كفاءة من استخدام بوت واحد مع جلسات منفصلة. النموذج المعتاد الذي
    نتصوره هو بوت واحد تتحدث إليه، مع جلسات مختلفة للعمل المتوازي. ويمكن لذلك
    البوت أيضًا تشغيل وكلاء فرعيين عند الحاجة.

    المستندات: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [CLI الوكلاء](/ar/cli/agents).

  </Accordion>

  <Accordion title="لماذا تم اقتطاع السياق في منتصف المهمة؟ كيف أمنع ذلك؟">
    سياق الجلسة محدود بنافذة النموذج. يمكن أن تؤدي المحادثات الطويلة، أو مخرجات الأدوات الكبيرة، أو الكثير من
    الملفات إلى تشغيل Compaction أو الاقتطاع.

    ما يساعد:

    - اطلب من البوت تلخيص الحالة الحالية وكتابتها في ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل المواضيع.
    - احتفظ بالسياق المهم في مساحة العمل واطلب من البوت قراءته مرة أخرى.
    - استخدم الوكلاء الفرعيين للعمل الطويل أو المتوازي كي تبقى المحادثة الرئيسية أصغر.
    - اختر نموذجًا بنافذة سياق أكبر إذا كان هذا يحدث كثيرًا.

  </Accordion>

  <Accordion title="كيف أعيد ضبط OpenClaw بالكامل مع إبقائه مثبتًا؟">
    استخدم أمر إعادة الضبط:

    ```bash
    openclaw reset
    ```

    إعادة ضبط كاملة غير تفاعلية:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    ثم شغّل الإعداد مرة أخرى:

    ```bash
    openclaw onboard --install-daemon
    ```

    ملاحظات:

    - يعرض الإعداد أيضًا **إعادة الضبط** إذا رأى إعدادات حالية. راجع [الإعداد (CLI)](/ar/start/wizard).
    - إذا استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد ضبط دليل الحالة لكل ملف تعريف (القيم الافتراضية هي `~/.openclaw-<profile>`).
    - إعادة ضبط التطوير: `openclaw gateway --dev --reset` (للتطوير فقط؛ يمسح إعدادات التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='تظهر لي أخطاء "context too large" - كيف أعيد الضبط أو أجري Compaction؟'>
    استخدم واحدًا من هذه:

    - **Compaction** (يبقي المحادثة لكنه يلخص الأدوار الأقدم):

      ```
      /compact
      ```

      أو `/compact <instructions>` لتوجيه الملخص.

    - **إعادة الضبط** (معرف جلسة جديد لمفتاح المحادثة نفسه):

      ```
      /new
      /reset
      ```

    إذا استمر حدوث ذلك:

    - فعّل **تشذيب الجلسة** (`agents.defaults.contextPruning`) أو اضبطه لقص مخرجات الأدوات القديمة.
    - استخدم نموذجًا بنافذة سياق أكبر.

    المستندات: [Compaction](/ar/concepts/compaction)، [تشذيب الجلسة](/ar/concepts/session-pruning)، [إدارة الجلسات](/ar/concepts/session).

  </Accordion>

  <Accordion title='لماذا أرى "LLM request rejected: messages.content.tool_use.input field required"؟'>
    هذا خطأ تحقق من المزود: أصدر النموذج كتلة `tool_use` دون الحقل المطلوب
    `input`. يعني ذلك عادة أن سجل الجلسة قديم أو تالف (غالبًا بعد سلاسل محادثة طويلة
    أو تغيير في أداة/مخطط).

    الإصلاح: ابدأ جلسة جديدة باستخدام `/new` (رسالة مستقلة).

  </Accordion>

  <Accordion title="لماذا أتلقى رسائل Heartbeat كل 30 دقيقة؟">
    تعمل Heartbeat كل **30m** افتراضيًا (**1h** عند استخدام مصادقة OAuth). اضبطها أو عطّلها:

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

    إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (يحتوي فقط على أسطر فارغة وترويسات markdown
    مثل `# Heading`)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API.
    إذا كان الملف مفقودًا، فستظل Heartbeat تعمل ويقرر النموذج ما يجب فعله.

    تستخدم التجاوزات لكل وكيل `agents.list[].heartbeat`. المستندات: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل أحتاج إلى إضافة "حساب بوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك أنت**، لذا إذا كنت في المجموعة، يستطيع OpenClaw رؤيتها.
    افتراضيًا، تكون الردود في المجموعات محظورة حتى تسمح بالمرسلين (`groupPolicy: "allowlist"`).

    إذا أردت أن تتمكن **أنت فقط** من تشغيل ردود المجموعة:

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
    الخيار 1 (الأسرع): تابع السجلات وأرسل رسالة اختبارية في المجموعة:

    ```bash
    openclaw logs --follow --json
    ```

    ابحث عن `chatId` (أو `from`) ينتهي بـ `@g.us`، مثل:
    `1234567890-1234567890@g.us`.

    الخيار 2 (إذا كان مضبوطًا/مدرجًا في قائمة السماح بالفعل): اعرض المجموعات من الإعدادات:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    المستندات: [WhatsApp](/ar/channels/whatsapp)، [الدليل](/ar/cli/directory)، [السجلات](/ar/cli/logs).

  </Accordion>

  <Accordion title="لماذا لا يرد OpenClaw في مجموعة؟">
    سببان شائعان:

    - بوابة الإشارة مفعلة (افتراضيًا). يجب أن تشير إلى البوت باستخدام @mention (أو تطابق `mentionPatterns`).
    - لقد ضبطت `channels.whatsapp.groups` دون `"*"` والمجموعة ليست في قائمة السماح.

    راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشارك المجموعات/السلاسل السياق مع الرسائل المباشرة؟">
    تُطوى المحادثات المباشرة إلى الجلسة الرئيسية افتراضيًا. للمجموعات/القنوات مفاتيح جلسات خاصة بها، ومواضيع Telegram / سلاسل Discord هي جلسات منفصلة. راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم مساحة عمل ووكيلًا يمكنني إنشاؤها؟">
    لا توجد حدود صارمة. عشرات منها (حتى مئات) لا بأس بها، لكن انتبه إلى:

    - **نمو القرص:** تعيش الجلسات + النصوص في `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** المزيد من الوكلاء يعني استخدامًا متزامنًا أكبر للنماذج.
    - **عبء العمليات:** ملفات تعريف المصادقة، ومساحات العمل، وتوجيه القنوات لكل وكيل.

    نصائح:

    - أبقِ مساحة عمل **نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - قلّم الجلسات القديمة (احذف JSONL أو إدخالات التخزين) إذا كبر استخدام القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل الشاردة وعدم تطابق ملفات التعريف.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة بوتات أو محادثات في الوقت نفسه (Slack)، وكيف ينبغي إعداد ذلك؟">
    نعم. استخدم **توجيه متعدد الوكلاء** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة حسب
    القناة/الحساب/النظير. Slack مدعوم كقناة ويمكن ربطه بوكلاء محددين.

    الوصول عبر المتصفح قوي لكنه ليس "افعل أي شيء يستطيع الإنسان فعله" - يمكن أن تظل أنظمة مكافحة البوتات، وCAPTCHA، وMFA
    تمنع الأتمتة. للحصول على تحكم أكثر موثوقية في المتصفح، استخدم Chrome MCP المحلي على المضيف،
    أو استخدم CDP على الجهاز الذي يشغل المتصفح فعليًا.

    إعداد أفضل الممارسات:

    - مضيف Gateway يعمل دائمًا (VPS/Mac mini).
    - وكيل واحد لكل دور (الربط).
    - قناة أو قنوات Slack مربوطة بهؤلاء الوكلاء.
    - متصفح محلي عبر Chrome MCP أو Node عند الحاجة.

    الوثائق: [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [Slack](/ar/channels/slack)،
    [المتصفح](/ar/tools/browser)، [العُقد](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج، وتجاوز الفشل، وملفات تعريف المصادقة

أسئلة وأجوبة النماذج — الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة —
موجودة في [الأسئلة الشائعة حول النماذج](/ar/help/faq-models).

## Gateway: المنافذ، و"قيد التشغيل بالفعل"، والوضع البعيد

<AccordionGroup>
  <Accordion title="ما المنفذ الذي يستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ الواحد متعدد الاستخدامات لـ WebSocket + HTTP (واجهة التحكم، والخطافات، وما إلى ذلك).

    الأسبقية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا يقول openclaw gateway status "Runtime: running" لكن "Connectivity probe: failed"؟'>
    لأن "running" هو منظور **المشرف** (launchd/systemd/schtasks). مسبار الاتصال هو CLI الذي يتصل فعليًا بـ WebSocket الخاص بـ Gateway.

    استخدم `openclaw gateway status` وثق بهذه الأسطر:

    - `Probe target:` (عنوان URL الذي استخدمه المسبار فعليًا)
    - `Listening:` (ما هو مربوط فعليًا على المنفذ)
    - `Last gateway error:` (السبب الجذري الشائع عندما تكون العملية حية لكن المنفذ لا يستمع)

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status أن "Config (cli)" و"Config (service)" مختلفان؟'>
    أنت تعدّل ملف إعداد بينما تعمل الخدمة بملف آخر (غالبًا عدم تطابق `--profile` / `OPENCLAW_STATE_DIR`).

    الإصلاح:

    ```bash
    openclaw gateway install --force
    ```

    شغّل ذلك من `--profile` / البيئة نفسها التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ماذا يعني "another gateway instance is already listening"؟'>
    يفرض OpenClaw قفل تشغيل عبر ربط مستمع WebSocket فورًا عند بدء التشغيل (الافتراضي `ws://127.0.0.1:18789`). إذا فشل الربط مع `EADDRINUSE`، فإنه يرمي `GatewayLockError` مشيرًا إلى أن نسخة أخرى تستمع بالفعل.

    الإصلاح: أوقف النسخة الأخرى، حرر المنفذ، أو شغّل باستخدام `openclaw gateway --port <port>`.

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
    - يراقب تطبيق macOS ملف الإعداد ويبدّل الأوضاع مباشرة عند تغيير هذه القيم.
    - إن `gateway.remote.token` / `.password` هي بيانات اعتماد بعيدة من جانب العميل فقط؛ ولا تفعّل مصادقة Gateway المحلية بذاتها.

  </Accordion>

  <Accordion title='تقول واجهة التحكم "unauthorized" (أو تستمر في إعادة الاتصال). ماذا الآن؟'>
    مسار مصادقة Gateway وطريقة مصادقة الواجهة غير متطابقين.

    حقائق (من الكود):

    - تحتفظ واجهة التحكم بالرمز في `sessionStorage` لجلسة تبويب المتصفح الحالية وعنوان URL المحدد لـ Gateway، لذلك تستمر عمليات التحديث في التبويب نفسه بالعمل دون استعادة استمرارية رمز localStorage طويل العمر.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة محاولة محدودة واحدة باستخدام رمز جهاز مخبأ عندما يعيد Gateway تلميحات إعادة المحاولة (`canRetryWithDeviceToken=true`، `recommendedNextStep=retry_with_device_token`).
    - إعادة المحاولة بذلك الرمز المخبأ تعيد الآن استخدام النطاقات المعتمدة المخبأة المخزنة مع رمز الجهاز. لا يزال مستدعو `deviceToken` الصريح / `scopes` الصريح يحتفظون بمجموعة النطاقات المطلوبة بدلًا من وراثة النطاقات المخبأة.
    - خارج مسار إعادة المحاولة ذلك، تكون أسبقية مصادقة الاتصال هي الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز التمهيد.
    - فحوص نطاق رمز التمهيد مسبوقة بالدور. قائمة السماح لمشغل التمهيد المدمجة تلبي طلبات المشغل فقط؛ ولا تزال أدوار العقد أو الأدوار الأخرى غير المشغلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    الإصلاح:

    - الأسرع: `openclaw dashboard` (يطبع + ينسخ عنوان URL للوحة التحكم، ويحاول فتحه؛ ويعرض تلميح SSH إذا كان بلا واجهة).
    - إذا لم يكن لديك رمز بعد: `openclaw doctor --generate-gateway-token`.
    - إذا كان بعيدًا، أنشئ نفقًا أولًا: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع السر المشترك: اضبط `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم الصق السر المطابق في إعدادات واجهة التحكم.
    - وضع Tailscale Serve: تأكد من تفعيل `gateway.auth.allowTailscale` وأنك تفتح عنوان URL الخاص بـ Serve، وليس عنوان loopback/tailnet خامًا يتجاوز ترويسات هوية Tailscale.
    - وضع الوكيل الموثوق: تأكد من أنك تأتي عبر الوكيل المدرك للهوية المهيأ، وليس عنوان Gateway خامًا. تحتاج وكلاء local loopback على المضيف نفسه أيضًا إلى `gateway.auth.trustedProxy.allowLoopback = true`.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، فدوّر/أعد اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا قالت مكالمة التدوير إنها رُفضت، فتحقق من أمرين:
      - يمكن لجلسات الجهاز المقترن تدوير جهازها **الخاص** فقط ما لم تكن لديها أيضًا `operator.admin`
      - لا يمكن لقيم `--scope` الصريحة أن تتجاوز نطاقات المشغل الحالية للمتصل
    - ما زلت عالقًا؟ شغّل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [لوحة التحكم](/ar/web/dashboard) لتفاصيل المصادقة.

  </Accordion>

  <Accordion title="ضبطت gateway.bind على tailnet لكنه لا يستطيع الربط ولا يوجد شيء يستمع">
    يختار ربط `tailnet` عنوان IP من Tailscale من واجهات شبكتك (100.64.0.0/10). إذا لم يكن الجهاز على Tailscale (أو كانت الواجهة معطلة)، فلن يوجد شيء للربط به.

    الإصلاح:

    - شغّل Tailscale على ذلك المضيف (ليحصل على عنوان 100.x)، أو
    - بدّل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. يفضّل `auto` loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطًا مقتصرًا على tailnet.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة Gateways على المضيف نفسه؟">
    عادةً لا - يمكن لـ Gateway واحد تشغيل عدة قنوات مراسلة ووكلاء. استخدم عدة Gateways فقط عندما تحتاج إلى التكرار (مثال: بوت إنقاذ) أو العزل الصارم.

    نعم، لكن يجب أن تعزل:

    - `OPENCLAW_CONFIG_PATH` (إعداد لكل نسخة)
    - `OPENCLAW_STATE_DIR` (حالة لكل نسخة)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (موصى به):

    - استخدم `openclaw --profile <name> ...` لكل نسخة (ينشئ تلقائيًا `~/.openclaw-<name>`).
    - اضبط `gateway.port` فريدًا في إعداد كل ملف تعريف (أو مرر `--port` للتشغيل اليدوي).
    - ثبّت خدمة لكل ملف تعريف: `openclaw --profile <name> gateway install`.

    تضيف ملفات التعريف أيضًا لاحقة إلى أسماء الخدمات (`ai.openclaw.<profile>`؛ القديمة `com.openclaw.*`، `openclaw-gateway-<profile>.service`، `OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [بوابات متعددة](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ماذا يعني "invalid handshake" / الرمز 1008؟'>
    Gateway هو **خادم WebSocket**، ويتوقع أن تكون الرسالة الأولى تمامًا
    إطار `connect`. إذا تلقى أي شيء آخر، فإنه يغلق الاتصال
    بـ **الرمز 1008** (انتهاك سياسة).

    الأسباب الشائعة:

    - فتحت عنوان URL الخاص بـ **HTTP** في متصفح (`http://...`) بدلًا من عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - أزال وكيل أو نفق ترويسات المصادقة أو أرسل طلبًا ليس خاصًا بـ Gateway.

    إصلاحات سريعة:

    1. استخدم عنوان URL الخاص بـ WS: `ws://<host>:18789` (أو `wss://...` إذا كان HTTPS).
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

    يمكنك ضبط مسار ثابت عبر `logging.file`. يتحكم `logging.level` في مستوى سجل الملف. وتتحكم `--verbose` و`logging.consoleLevel` في تفصيل إخراج وحدة التحكم.

    أسرع تتبع للسجل:

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

    إذا شغّلت Gateway يدويًا، يمكن لـ `openclaw gateway --force` استعادة المنفذ. راجع [Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="أغلقت الطرفية الخاصة بي على Windows - كيف أعيد تشغيل OpenClaw؟">
    توجد **طريقتا تثبيت على Windows**:

    **1) WSL2 (موصى به):** يعمل Gateway داخل Linux.

    افتح PowerShell، وادخل WSL، ثم أعد التشغيل:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا لم تكن قد ثبّتّ الخدمة مطلقًا، فابدأها في الواجهة الأمامية:

    ```bash
    openclaw gateway run
    ```

    **2) Windows أصلي (غير موصى به):** يعمل Gateway مباشرة في Windows.

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

  <Accordion title="Gateway يعمل لكن الردود لا تصل أبدًا. ما الذي يجب أن أتحقق منه؟">
    ابدأ بفحص صحة سريع:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    الأسباب الشائعة:

    - لم يتم تحميل مصادقة النموذج على **مضيف Gateway** (تحقق من `models status`).
    - اقتران القناة/قائمة السماح تمنع الردود (تحقق من إعدادات القناة + السجلات).
    - WebChat/Dashboard مفتوح من دون الرمز الصحيح.

    إذا كنت بعيدًا، فتأكد من أن اتصال النفق/Tailscale يعمل وأن
    WebSocket الخاص بـ Gateway قابل للوصول.

    المستندات: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"تم قطع الاتصال بـ Gateway: لا يوجد سبب" - ماذا الآن؟'>
    يعني هذا عادةً أن واجهة المستخدم فقدت اتصال WebSocket. تحقق مما يلي:

    1. هل يعمل Gateway؟ `openclaw gateway status`
    2. هل Gateway سليم؟ `openclaw status`
    3. هل تملك واجهة المستخدم الرمز الصحيح؟ `openclaw dashboard`
    4. إذا كنت بعيدًا، هل رابط النفق/Tailscale يعمل؟

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

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على إدخالات كثيرة جدًا. يقلّص OpenClaw بالفعل القائمة إلى حد Telegram ويعيد المحاولة بأوامر أقل، لكن ما زالت بعض إدخالات القائمة بحاجة إلى الإسقاط. قلّل أوامر Plugin/skill/الأوامر المخصصة، أو عطّل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed`، أو `Network request for 'setMyCommands' failed!`، أو أخطاء شبكة مشابهة: إذا كنت على VPS أو خلف وكيل، فتأكد من السماح باتصالات HTTPS الصادرة وأن DNS يعمل لـ `api.telegram.org`.

    إذا كان Gateway بعيدًا، فتأكد من أنك تنظر إلى السجلات على مضيف Gateway.

    المستندات: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="لا يعرض TUI أي خرج. ما الذي يجب أن أتحقق منه؟">
    تأكد أولًا من أن Gateway قابل للوصول وأن الوكيل يمكنه العمل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لمعرفة الحالة الحالية. إذا كنت تتوقع ردودًا في قناة دردشة،
    فتأكد من تمكين التسليم (`/deliver on`).

    المستندات: [TUI](/ar/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway بالكامل ثم أشغله؟">
    إذا كنت قد ثبّتّ الخدمة:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    يؤدي هذا إلى إيقاف/بدء **الخدمة الخاضعة للإشراف** (launchd على macOS، وsystemd على Linux).
    استخدم هذا عندما يعمل Gateway في الخلفية كخدمة daemon.

    إذا كنت تشغّله في المقدمة، فأوقفه باستخدام Ctrl-C، ثم:

    ```bash
    openclaw gateway run
    ```

    المستندات: [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="شرح مبسّط: openclaw gateway restart مقابل openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **خدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغّل Gateway **في المقدمة** لجلسة الطرفية هذه.

    إذا كنت قد ثبّتّ الخدمة، فاستخدم أوامر Gateway. استخدم `openclaw gateway` عندما
    تريد تشغيلًا لمرة واحدة في المقدمة.

  </Accordion>

  <Accordion title="أسرع طريقة للحصول على تفاصيل أكثر عند فشل شيء ما">
    ابدأ Gateway باستخدام `--verbose` للحصول على تفاصيل أكثر في وحدة التحكم. ثم افحص ملف السجل بحثًا عن مصادقة القناة، وتوجيه النموذج، وأخطاء RPC.
  </Accordion>
</AccordionGroup>

## الوسائط والمرفقات

<AccordionGroup>
  <Accordion title="أنشأت مهارتي صورة/PDF، لكن لم يُرسل أي شيء">
    يجب أن تتضمن المرفقات الصادرة من الوكيل سطر `MEDIA:<path-or-url>` (في سطر مستقل). راجع [إعداد مساعد OpenClaw](/ar/start/openclaw) و[إرسال الوكيل](/ar/tools/agent-send).

    الإرسال عبر CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    تحقق أيضًا مما يلي:

    - القناة الهدف تدعم الوسائط الصادرة ولا تمنعها قوائم السماح.
    - الملف ضمن حدود حجم المزوّد (تُعاد تحجيم الصور إلى حد أقصى 2048px).
    - يحافظ `tools.fs.workspaceOnly=true` على إرسال المسارات المحلية محدودًا بمساحة العمل، ومخزن الوسائط/المؤقت، والملفات التي تحقق منها sandbox.
    - يسمح `tools.fs.workspaceOnly=false` لـ `MEDIA:` بإرسال ملفات محلية على المضيف يمكن للوكيل قراءتها بالفعل، لكن فقط للوسائط وأنواع المستندات الآمنة (الصور، والصوت، والفيديو، وPDF، ومستندات Office). تظل الملفات النصية العادية والملفات التي تشبه الأسرار محظورة.

    راجع [الصور](/ar/nodes/images).

  </Accordion>
</AccordionGroup>

## الأمان والتحكم في الوصول

<AccordionGroup>
  <Accordion title="هل من الآمن تعريض OpenClaw للرسائل الخاصة الواردة؟">
    تعامل مع الرسائل الخاصة الواردة كمدخلات غير موثوقة. صُممت الإعدادات الافتراضية لتقليل المخاطر:

    - السلوك الافتراضي في القنوات التي تدعم الرسائل الخاصة هو **الاقتران**:
      - يتلقى المرسلون غير المعروفين رمز اقتران؛ ولا يعالج البوت رسالتهم.
      - وافق باستخدام: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - تُحد الطلبات المعلقة عند **3 لكل قناة**؛ تحقق من `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل رمز.
    - يتطلب فتح الرسائل الخاصة للعامة قبولًا صريحًا (`dmPolicy: "open"` وقائمة سماح `"*"`).

    شغّل `openclaw doctor` لإظهار سياسات الرسائل الخاصة الخطرة.

  </Accordion>

  <Accordion title="هل حقن الموجّهات مصدر قلق للبوتات العامة فقط؟">
    لا. يتعلق حقن الموجّهات بـ **المحتوى غير الموثوق**، وليس فقط بمن يمكنه مراسلة البوت عبر رسالة خاصة.
    إذا كان مساعدك يقرأ محتوى خارجيًا (بحث/جلب من الويب، صفحات المتصفح، رسائل البريد الإلكتروني،
    المستندات، المرفقات، السجلات الملصقة)، فقد يتضمن ذلك المحتوى تعليمات تحاول
    اختطاف النموذج. يمكن أن يحدث هذا حتى إذا **كنت أنت المرسل الوحيد**.

    يكون الخطر الأكبر عند تمكين الأدوات: يمكن خداع النموذج
    لاستخراج السياق أو استدعاء الأدوات نيابةً عنك. قلّل نطاق الضرر عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو معطل الأدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` معطلة للوكلاء الممكّنة أدواتهم
    - التعامل مع نص الملفات/المستندات المفكوك باعتباره غير موثوق أيضًا: يغلّف OpenResponses
      `input_file` واستخراج مرفقات الوسائط كلاهما النص المستخرج بعلامات حدود محتوى خارجي
      صريحة بدلًا من تمرير نص الملف الخام
    - استخدام sandbox وقوائم سماح صارمة للأدوات

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يجب أن يكون للبوت بريد إلكتروني أو حساب GitHub أو رقم هاتف خاص به؟">
    نعم، في معظم الإعدادات. عزل البوت بحسابات وأرقام هواتف منفصلة
    يقلل نطاق الضرر إذا حدث خطأ ما. كما يسهل هذا تدوير
    بيانات الاعتماد أو إلغاء الوصول من دون التأثير في حساباتك الشخصية.

    ابدأ صغيرًا. امنح الوصول فقط إلى الأدوات والحسابات التي تحتاجها فعلًا، ووسّع
    لاحقًا إذا لزم الأمر.

    المستندات: [الأمان](/ar/gateway/security)، [الاقتران](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية وهل هذا آمن؟">
    نحن **لا** نوصي بالاستقلالية الكاملة على رسائلك الشخصية. النمط الأكثر أمانًا هو:

    - إبقاء الرسائل الخاصة في **وضع الاقتران** أو ضمن قائمة سماح ضيقة.
    - استخدام **رقم أو حساب منفصل** إذا أردته أن يراسل نيابةً عنك.
    - دعه يكتب مسودة، ثم **وافق قبل الإرسال**.

    إذا أردت التجربة، فافعل ذلك على حساب مخصص وأبقِه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل للدردشة فقط وكانت المدخلات موثوقة. تكون الفئات الأصغر
    أكثر عرضة لاختطاف التعليمات، لذا تجنبها للوكلاء الممكّنة أدواتهم
    أو عند قراءة محتوى غير موثوق. إذا اضطررت إلى استخدام نموذج أصغر، فاقفل
    الأدوات وشغّله داخل sandbox. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="شغّلت /start في Telegram لكنني لم أحصل على رمز اقتران">
    تُرسل رموز الاقتران **فقط** عندما يرسل مرسل غير معروف رسالة إلى البوت مع
    تمكين `dmPolicy: "pairing"`. لا ينشئ `/start` وحده رمزًا.

    تحقق من الطلبات المعلقة:

    ```bash
    openclaw pairing list telegram
    ```

    إذا أردت وصولًا فوريًا، فأضف معرّف المرسل لديك إلى قائمة السماح أو اضبط `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيراسل جهات اتصالي؟ كيف يعمل الاقتران؟">
    لا. سياسة الرسائل الخاصة الافتراضية في WhatsApp هي **الاقتران**. يحصل المرسلون غير المعروفين فقط على رمز اقتران ولا **تُعالج** رسالتهم. يرد OpenClaw فقط على الدردشات التي يتلقاها أو على عمليات الإرسال الصريحة التي تشغّلها.

    وافق على الاقتران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اعرض الطلبات المعلقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لضبط **قائمة السماح/المالك** حتى يُسمح برسائلك الخاصة أنت. ولا تُستخدم للإرسال التلقائي. إذا كنت تشغّله على رقم WhatsApp الشخصي لديك، فاستخدم ذلك الرقم ومكّن `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، وإجهاض المهام، و"لن يتوقف"

<AccordionGroup>
  <Accordion title="كيف أوقف ظهور رسائل النظام الداخلية في الدردشة؟">
    تظهر معظم الرسائل الداخلية أو رسائل الأدوات فقط عند تمكين **verbose** أو **trace** أو **reasoning**
    لتلك الجلسة.

    أصلح ذلك في الدردشة التي تراها فيها:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    إذا بقيت الضوضاء، فتحقق من إعدادات الجلسة في Control UI واضبط verbose
    على **inherit**. تأكد أيضًا من أنك لا تستخدم ملف تعريف بوت يحتوي على `verboseDefault` مضبوطًا
    على `on` في الإعدادات.

    المستندات: [التفكير والإخراج المفصل](/ar/tools/thinking)، [الأمان](/ar/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="كيف أوقف/ألغي مهمة قيد التشغيل؟">
    أرسل أيًا مما يلي **كرسالة مستقلة** (من دون شرطة مائلة):

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

    هذه مشغلات إجهاض (وليست أوامر بشرطة مائلة).

    بالنسبة لعمليات الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

    ```
    process action:kill sessionId:XXX
    ```

    نظرة عامة على أوامر الشرطة المائلة: راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

    يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`، لكن بعض الاختصارات (مثل `/status`) تعمل أيضًا ضمن السطر للمرسلين الموجودين في قائمة السماح.

  </Accordion>

  <Accordion title='كيف أرسل رسالة Discord من Telegram؟ ("تم رفض المراسلة عبر السياقات")'>
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

    أعد تشغيل Gateway بعد تحرير الإعدادات.

  </Accordion>

  <Accordion title='لماذا يبدو أن البوت "يتجاهل" الرسائل السريعة المتتالية؟'>
    يتحكم وضع قائمة الانتظار في كيفية تفاعل الرسائل الجديدة مع تشغيل جارٍ. استخدم `/queue` لتغيير الأوضاع:

    - `steer` - يضع كل التوجيهات المعلقة في قائمة انتظار لحد النموذج التالي في التشغيل الحالي
    - `queue` - توجيه قديم واحدًا تلو الآخر
    - `followup` - يشغّل الرسائل واحدة تلو الأخرى
    - `collect` - يجمع الرسائل ويرد مرة واحدة
    - `steer-backlog` - وجّه الآن، ثم عالج المتراكم
    - `interrupt` - يجهض التشغيل الحالي ويبدأ من جديد

    الوضع الافتراضي هو `steer`. يمكنك إضافة خيارات مثل `debounce:0.5s cap:25 drop:summarize` لأوضاع المتابعة. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما النموذج الافتراضي لـ Anthropic عند استخدام مفتاح API؟'>
    في OpenClaw، تكون بيانات الاعتماد واختيار النموذج منفصلين. يؤدي ضبط `ANTHROPIC_API_KEY` (أو تخزين مفتاح API من Anthropic في ملفات تعريف المصادقة) إلى تمكين المصادقة، لكن النموذج الافتراضي الفعلي هو ما تضبطه في `agents.defaults.model.primary` (على سبيل المثال، `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). إذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم يتمكن من العثور على بيانات اعتماد Anthropic في ملف `auth-profiles.json` المتوقع للوكيل قيد التشغيل.
  </Accordion>
</AccordionGroup>

---

ما زلت عالقًا؟ اسأل في [Discord](https://discord.com/invite/clawd) أو افتح [مناقشة على GitHub](https://github.com/openclaw/openclaw/discussions).

## ذات صلة

- [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run) — التثبيت، الإعداد الأولي، المصادقة، الاشتراكات، الإخفاقات المبكرة
- [الأسئلة الشائعة حول النماذج](/ar/help/faq-models) — اختيار النموذج، تجاوز الفشل، ملفات تعريف المصادقة
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) — فرز المشكلات بدءًا من الأعراض
