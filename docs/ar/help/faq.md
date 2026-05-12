---
read_when:
    - الإجابة عن أسئلة الدعم الشائعة المتعلقة بالإعداد أو التثبيت أو التهيئة الأولية أو وقت التشغيل
    - فرز المشكلات التي أبلغ عنها المستخدمون قبل التعمق في تصحيح الأخطاء
summary: الأسئلة الشائعة حول إعداد OpenClaw وتكوينه واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-05-12T00:59:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57e42ea34d4f53cb9e6f0e9c175fd553a67e70aaca08a09be28f0bde43414bc8
    source_path: help/faq.md
    workflow: 16
---

إجابات سريعة مع استكشاف أعمق للأخطاء وإصلاحها لإعدادات العالم الحقيقي (التطوير المحلي، VPS، تعدد الوكلاء، OAuth/API keys، تجاوز فشل النموذج). لتشخيصات وقت التشغيل، راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). لمرجع الإعدادات الكامل، راجع [الإعدادات](/ar/gateway/configuration).

## أول 60 ثانية إذا كان هناك شيء معطّل

1. **الحالة السريعة (الفحص الأول)**

   ```bash
   openclaw status
   ```

   ملخص محلي سريع: OS + التحديث، قابلية الوصول إلى gateway/service، الوكلاء/الجلسات، إعدادات المزوّد + مشكلات وقت التشغيل (عندما يكون Gateway قابلًا للوصول).

2. **تقرير قابل للصق (آمن للمشاركة)**

   ```bash
   openclaw status --all
   ```

   تشخيص للقراءة فقط مع ذيل السجل (مع تنقيح الرموز).

3. **حالة Daemon + المنفذ**

   ```bash
   openclaw gateway status
   ```

   يعرض وقت تشغيل المشرف مقابل قابلية الوصول عبر RPC، وعنوان URL هدف الفحص، وأي إعدادات يُرجّح أن الخدمة استخدمتها.

4. **فحوصات عميقة**

   ```bash
   openclaw status --deep
   ```

   يشغّل فحصًا حيًا لصحة Gateway، بما في ذلك فحوصات القنوات عندما تكون مدعومة
   (يتطلب Gateway قابلًا للوصول). راجع [الصحة](/ar/gateway/health).

5. **تابع أحدث سجل**

   ```bash
   openclaw logs --follow
   ```

   إذا كان RPC متوقفًا، فارجع إلى:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   سجلات الملفات منفصلة عن سجلات الخدمة؛ راجع [التسجيل](/ar/logging) و[استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

6. **شغّل الطبيب (الإصلاحات)**

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

أسئلة وأجوبة التشغيل الأول — التثبيت، الإعداد الأولي، مسارات المصادقة، الاشتراكات، الإخفاقات الأولية —
موجودة في [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run).

## ما هو OpenClaw؟

<AccordionGroup>
  <Accordion title="ما هو OpenClaw، في فقرة واحدة؟">
    OpenClaw هو مساعد ذكاء اصطناعي شخصي تشغّله على أجهزتك الخاصة. يرد عبر واجهات المراسلة التي تستخدمها بالفعل (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، وإضافات القنوات المضمّنة مثل QQ Bot) ويمكنه أيضًا تنفيذ الصوت + Canvas حي على المنصات المدعومة. **Gateway** هو مستوى التحكم العامل دائمًا؛ والمساعد هو المنتج.
  </Accordion>

  <Accordion title="عرض القيمة">
    OpenClaw ليس "مجرد غلاف لـ Claude". إنه **مستوى تحكم يعطي الأولوية للمحلي** يتيح لك تشغيل
    مساعد قادر على **عتادك الخاص**، ويمكن الوصول إليه من تطبيقات الدردشة التي تستخدمها بالفعل، مع
    جلسات ذات حالة، وذاكرة، وأدوات - دون تسليم التحكم في سير عملك إلى
    SaaS مستضاف.

    أبرز النقاط:

    - **أجهزتك، بياناتك:** شغّل Gateway حيثما تريد (Mac، Linux، VPS) واحتفظ
      بمساحة العمل + سجل الجلسات محليًا.
    - **قنوات حقيقية، لا بيئة ويب معزولة:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/إلخ،
      بالإضافة إلى الصوت على الهاتف وCanvas على المنصات المدعومة.
    - **محايد تجاه النماذج:** استخدم Anthropic، OpenAI، MiniMax، OpenRouter، إلخ، مع توجيه
      وتجاوز فشل لكل وكيل.
    - **خيار محلي فقط:** شغّل النماذج المحلية بحيث **يمكن أن تبقى كل البيانات على جهازك** إذا أردت.
    - **توجيه متعدد الوكلاء:** وكلاء منفصلون لكل قناة أو حساب أو مهمة، ولكل منهم
      مساحة عمل وإعدادات افتراضية خاصة به.
    - **مفتوح المصدر وقابل للتعديل:** افحصه، ووسّعه، واستضفه ذاتيًا دون ارتباط بمورّد.

    المستندات: [Gateway](/ar/gateway)، [القنوات](/ar/channels)، [تعدد الوكلاء](/ar/concepts/multi-agent)،
    [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="لقد أعددته للتو - ماذا أفعل أولًا؟">
    مشاريع أولى جيدة:

    - أنشئ موقعًا إلكترونيًا (WordPress أو Shopify أو موقعًا ثابتًا بسيطًا).
    - ابنِ نموذجًا أوليًا لتطبيق هاتف (مخطط، شاشات، خطة API).
    - نظّم الملفات والمجلدات (تنظيف، تسمية، وسم).
    - اربط Gmail وأتمت الملخصات أو المتابعات.

    يمكنه التعامل مع المهام الكبيرة، لكنه يعمل بأفضل صورة عندما تقسّمها إلى مراحل وتستخدم
    وكلاء فرعيين للعمل المتوازي.

  </Accordion>

  <Accordion title="ما أهم خمس حالات استخدام يومية لـ OpenClaw؟">
    المكاسب اليومية تبدو عادةً كالتالي:

    - **إحاطات شخصية:** ملخصات لصندوق الوارد، والتقويم، والأخبار التي تهمك.
    - **البحث والصياغة:** بحث سريع، وملخصات، ومسودات أولى لرسائل البريد أو المستندات.
    - **التذكيرات والمتابعات:** تنبيهات وقوائم تحقق مدفوعة بـ Cron أو Heartbeat.
    - **أتمتة المتصفح:** ملء النماذج، وجمع البيانات، وتكرار مهام الويب.
    - **تنسيق عبر الأجهزة:** أرسل مهمة من هاتفك، ودع Gateway يشغّلها على خادم، واحصل على النتيجة في الدردشة.

  </Accordion>

  <Accordion title="هل يمكن أن يساعد OpenClaw في توليد العملاء المحتملين، والتواصل، والإعلانات، والمدونات لـ SaaS؟">
    نعم في **البحث، والتأهيل، والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات للتواصل أو نصوص الإعلانات.

    بالنسبة إلى **حملات التواصل أو الإعلانات**، أبقِ الإنسان ضمن الحلقة. تجنّب الرسائل المزعجة، واتبع القوانين المحلية
    وسياسات المنصات، وراجع أي شيء قبل إرساله. النمط الأكثر أمانًا هو أن يدع
    OpenClaw يصيغ، وأنت توافق.

    المستندات: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما المزايا مقارنةً بـ Claude Code لتطوير الويب؟">
    OpenClaw هو **مساعد شخصي** وطبقة تنسيق، وليس بديلًا عن IDE. استخدم
    Claude Code أو Codex لأسرع حلقة برمجة مباشرة داخل مستودع. استخدم OpenClaw عندما
    تريد ذاكرة دائمة، ووصولًا عبر الأجهزة، وتنسيقًا للأدوات.

    المزايا:

    - **ذاكرة + مساحة عمل دائمتان** عبر الجلسات
    - **وصول متعدد المنصات** (WhatsApp، Telegram، TUI، WebChat)
    - **تنسيق الأدوات** (المتصفح، الملفات، الجدولة، الخطافات)
    - **Gateway يعمل دائمًا** (شغّله على VPS، وتفاعل من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/التنفيذ المحلي

    عرض: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="كيف أخصص Skills دون إبقاء المستودع متسخًا؟">
    استخدم التجاوزات المُدارة بدلًا من تعديل نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدًا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). ترتيب الأولوية هو `<workspace>/skills` ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← المضمّنة ← `skills.load.extraDirs`، لذا تظل التجاوزات المُدارة أعلى أولوية من Skills المضمّنة دون لمس git. إذا احتجت إلى تثبيت Skill عالميًا لكن مع جعلها مرئية لبعض الوكلاء فقط، فاحتفظ بالنسخة المشتركة في `~/.openclaw/skills` وتحكّم في الرؤية باستخدام `agents.defaults.skills` و`agents.list[].skills`. يجب أن تعيش في المستودع فقط التعديلات الجديرة بالرفع إلى upstream وأن تخرج كـ PRs.
  </Accordion>

  <Accordion title="هل يمكنني تحميل Skills من مجلد مخصص؟">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (أدنى أولوية). ترتيب الأولوية الافتراضي هو `<workspace>/skills` ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← المضمّنة ← `skills.load.extraDirs`. يثبّت `clawhub` في `./skills` افتراضيًا، وهو ما يتعامل معه OpenClaw كـ `<workspace>/skills` في الجلسة التالية. إذا كان يجب أن تكون Skill مرئية لوكلاء معيّنين فقط، فاقرن ذلك مع `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="كيف يمكنني استخدام نماذج مختلفة لمهام مختلفة؟">
    الأنماط المدعومة اليوم هي:

    - **وظائف Cron**: يمكن للوظائف المعزولة تعيين تجاوز `model` لكل وظيفة.
    - **الوكلاء الفرعيون**: وجّه المهام إلى وكلاء منفصلين بنماذج افتراضية مختلفة.
    - **تبديل عند الطلب**: استخدم `/model` لتبديل نموذج الجلسة الحالية في أي وقت.

    راجع [وظائف Cron](/ar/automation/cron-jobs)، و[التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="يتجمّد البوت أثناء تنفيذ عمل ثقيل. كيف أفرّغ ذلك؟">
    استخدم **الوكلاء الفرعيين** للمهام الطويلة أو المتوازية. يعمل الوكلاء الفرعيون في جلساتهم الخاصة،
    ويعيدون ملخصًا، ويحافظون على استجابة الدردشة الرئيسية.

    اطلب من البوت لديك "spawn a sub-agent for this task" أو استخدم `/subagents`.
    استخدم `/status` في الدردشة لمعرفة ما يفعله Gateway الآن (وما إذا كان مشغولًا).

    نصيحة للرموز: تستهلك المهام الطويلة والوكلاء الفرعيون الرموز. إذا كانت التكلفة مصدر قلق، فعيّن
    نموذجًا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [مهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="كيف تعمل جلسات الوكيل الفرعي المرتبطة بسلسلة على Discord؟">
    استخدم ربط السلاسل. يمكنك ربط سلسلة Discord بوكيل فرعي أو هدف جلسة بحيث تبقى رسائل المتابعة في تلك السلسلة على الجلسة المرتبطة.

    التدفق الأساسي:

    - ابدأ باستخدام `sessions_spawn` مع `thread: true` (واختياريًا `mode: "session"` للمتابعة المستمرة).
    - أو اربط يدويًا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الربط.
    - استخدم `/session idle <duration|off>` و`/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل السلسلة.

    الإعدادات المطلوبة:

    - الإعدادات الافتراضية العامة: `session.threadBindings.enabled`، و`session.threadBindings.idleHours`، و`session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: `channels.discord.threadBindings.enabled`، و`channels.discord.threadBindings.idleHours`، و`channels.discord.threadBindings.maxAgeHours`.
    - الربط التلقائي عند الإنشاء: تكون `channels.discord.threadBindings.spawnSessions` افتراضيًا `true`؛ اضبطها على `false` لتعطيل إنشاء الجلسات المرتبطة بالسلاسل.

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع الإعدادات](/ar/gateway/configuration-reference)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="أنهى وكيل فرعي عمله، لكن تحديث الاكتمال ذهب إلى المكان الخطأ أو لم يُنشر أبدًا. ماذا يجب أن أفحص؟">
    افحص مسار الطالب المحلول أولًا:

    - يفضّل تسليم الوكيل الفرعي في وضع الاكتمال أي سلسلة مرتبطة أو مسار محادثة عندما يكون أحدهما موجودًا.
    - إذا كان أصل الاكتمال يحمل قناة فقط، يعود OpenClaw إلى المسار المخزن لجلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) بحيث يمكن أن ينجح التسليم المباشر رغم ذلك.
    - إذا لم يوجد مسار مرتبط ولا مسار مخزن قابل للاستخدام، فقد يفشل التسليم المباشر وتعود النتيجة إلى تسليم الجلسة في قائمة الانتظار بدلًا من النشر فورًا في الدردشة.
    - لا تزال الأهداف غير الصالحة أو القديمة قادرة على فرض الرجوع إلى قائمة الانتظار أو فشل التسليم النهائي.
    - إذا كانت آخر رسالة مرئية من المساعد الابن هي بالضبط الرمز الصامت `NO_REPLY` / `no_reply`، أو بالضبط `ANNOUNCE_SKIP`، فإن OpenClaw يكبت الإعلان عمدًا بدلًا من نشر تقدم سابق قديم.
    - إذا انتهت مهلة الابن بعد استدعاءات أدوات فقط، فيمكن للإعلان أن يختصر ذلك في ملخص قصير للتقدم الجزئي بدلًا من إعادة تشغيل مخرجات الأدوات الخام.

    التصحيح:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [مهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="لا تعمل Cron أو التذكيرات. ماذا يجب أن أفحص؟">
    تعمل Cron داخل عملية Gateway. إذا لم يكن Gateway يعمل باستمرار،
    فلن تعمل الوظائف المجدولة.

    قائمة التحقق:

    - تأكد من تمكين cron (`cron.enabled`) وأن `OPENCLAW_SKIP_CRON` غير معيّن.
    - تحقق من أن Gateway يعمل 24/7 (دون نوم/إعادة تشغيل).
    - تحقق من إعدادات المنطقة الزمنية للوظيفة (`--tz` مقابل المنطقة الزمنية للمضيف).

    التصحيح:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    المستندات: [وظائف Cron](/ar/automation/cron-jobs)، [الأتمتة](/ar/automation).

  </Accordion>

  <Accordion title="تم تشغيل Cron، لكن لم يُرسل أي شيء إلى القناة. لماذا؟">
    تحقّق من وضع التسليم أولاً:

    - `--no-deliver` / `delivery.mode: "none"` يعني أنه لا يُتوقع إرسال احتياطي من المشغّل.
    - هدف إعلان مفقود أو غير صالح (`channel` / `to`) يعني أن المشغّل تخطّى التسليم الصادر.
    - فشل مصادقة القناة (`unauthorized`, `Forbidden`) يعني أن المشغّل حاول التسليم لكن بيانات الاعتماد منعته.
    - تُعامل النتيجة المعزولة الصامتة (`NO_REPLY` / `no_reply` فقط) على أنها غير قابلة للتسليم عمداً، لذلك يكبت المشغّل أيضاً التسليم الاحتياطي المصفوف في قائمة الانتظار.

    بالنسبة إلى مهام cron المعزولة، لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message`
    عندما يكون مسار الدردشة متاحاً. يتحكم `--announce` فقط في مسار المشغّل
    الاحتياطي للنص النهائي الذي لم يكن الوكيل قد أرسله بالفعل.

    تصحيح الأخطاء:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="لماذا بدّل تشغيل Cron معزول النماذج أو أعاد المحاولة مرة واحدة؟">
    يكون ذلك عادةً مسار تبديل النموذج المباشر، وليس جدولة مكررة.

    يمكن لـ Cron المعزول حفظ تسليم نموذج وقت التشغيل وإعادة المحاولة عندما يرمي التشغيل
    النشط `LiveSessionModelSwitchError`. تُبقي إعادة المحاولة المزوّد/النموذج
    الذي تم التبديل إليه، وإذا حمل التبديل تجاوزاً جديداً لملف تعريف المصادقة، فإن cron
    يحفظ ذلك أيضاً قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يتقدم تجاوز نموذج خطاف Gmail أولاً عند انطباقه.
    - ثم `model` لكل مهمة.
    - ثم أي تجاوز مخزّن لنموذج جلسة cron.
    - ثم اختيار النموذج العادي للوكيل/الافتراضي.

    حلقة إعادة المحاولة محدودة. بعد المحاولة الأولى بالإضافة إلى محاولتي إعادة تبديل،
    يُجهض cron بدلاً من الدوران إلى الأبد.

    تصحيح الأخطاء:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [cron CLI](/ar/cli/cron).

  </Accordion>

  <Accordion title="كيف أثبّت Skills على Linux؟">
    استخدم أوامر `openclaw skills` الأصلية أو ضع Skills في مساحة عملك. واجهة Skills على macOS غير متاحة على Linux.
    تصفّح Skills على [https://clawhub.ai](https://clawhub.ai).

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

    يكتب `openclaw skills install` الأصلي داخل دليل `skills/`
    في مساحة العمل النشطة. ثبّت CLI المنفصل `clawhub` فقط إذا كنت تريد نشر
    Skills الخاصة بك أو مزامنتها. للتثبيتات المشتركة بين الوكلاء، ضع Skill تحت
    `~/.openclaw/skills` واستخدم `agents.defaults.skills` أو
    `agents.list[].skills` إذا أردت تضييق نطاق الوكلاء الذين يمكنهم رؤيتها.

  </Accordion>

  <Accordion title="هل يستطيع OpenClaw تشغيل المهام وفق جدول أو باستمرار في الخلفية؟">
    نعم. استخدم مجدول Gateway:

    - **مهام Cron** للمهام المجدولة أو المتكررة (تستمر عبر عمليات إعادة التشغيل).
    - **Heartbeat** للفحوصات الدورية في "الجلسة الرئيسية".
    - **المهام المعزولة** للوكلاء المستقلين الذين ينشرون ملخصات أو يسلّمون إلى الدردشات.

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills الخاصة بـ Apple macOS فقط من Linux؟">
    ليس مباشرةً. تُقيّد Skills الخاصة بـ macOS عبر `metadata.openclaw.os` بالإضافة إلى الثنائيات المطلوبة، ولا تظهر Skills في موجه النظام إلا عندما تكون مؤهلة على **مضيف Gateway**. على Linux، لن تُحمّل Skills المخصصة لـ `darwin` فقط (مثل `apple-notes` و`apple-reminders` و`things-mac`) ما لم تتجاوز التقييد.

    لديك ثلاثة أنماط مدعومة:

    **الخيار أ - شغّل Gateway على Mac (الأبسط).**
    شغّل Gateway حيث توجد ثنائيات macOS، ثم اتصل من Linux في [الوضع البعيد](#gateway-ports-already-running-and-remote-mode) أو عبر Tailscale. تُحمّل Skills بشكل طبيعي لأن مضيف Gateway هو macOS.

    **الخيار ب - استخدم Node بنظام macOS (بلا SSH).**
    شغّل Gateway على Linux، واقرن Node بنظام macOS (تطبيق شريط القوائم)، واضبط **أوامر تشغيل Node** على "السؤال دائماً" أو "السماح دائماً" على Mac. يستطيع OpenClaw معاملة Skills الخاصة بـ macOS فقط على أنها مؤهلة عندما توجد الثنائيات المطلوبة على Node. يشغّل الوكيل تلك Skills عبر أداة `nodes`. إذا اخترت "السؤال دائماً"، فإن الموافقة على "السماح دائماً" في الموجه تضيف ذلك الأمر إلى قائمة السماح.

    **الخيار ج - وكّل ثنائيات macOS عبر SSH (متقدم).**
    أبقِ Gateway على Linux، لكن اجعل ثنائيات CLI المطلوبة تُحل إلى أغلفة SSH تعمل على Mac. ثم تجاوز Skill للسماح بـ Linux حتى تبقى مؤهلة.

    1. أنشئ غلاف SSH للثنائي (مثال: `memo` لـ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ضع الغلاف على `PATH` على مضيف Linux (مثلاً `~/bin/memo`).
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
    ليس مدمجاً اليوم.

    الخيارات:

    - **Skill / Plugin مخصص:** الأفضل للوصول الموثوق إلى API (يمتلك كل من Notion/HeyGen واجهات API).
    - **أتمتة المتصفح:** تعمل دون كود لكنها أبطأ وأكثر هشاشة.

    إذا كنت تريد إبقاء السياق لكل عميل (سير عمل الوكالات)، فالنمط البسيط هو:

    - صفحة Notion واحدة لكل عميل (السياق + التفضيلات + العمل النشط).
    - اطلب من الوكيل جلب تلك الصفحة في بداية الجلسة.

    إذا كنت تريد تكاملاً أصلياً، فافتح طلب ميزة أو ابنِ Skill
    تستهدف واجهات API تلك.

    تثبيت Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تصل التثبيتات الأصلية إلى دليل `skills/` في مساحة العمل النشطة. بالنسبة إلى Skills المشتركة بين الوكلاء، ضعها في `~/.openclaw/skills/<name>/SKILL.md`. إذا كان يجب أن يرى بعض الوكلاء فقط تثبيتاً مشتركاً، فاضبط `agents.defaults.skills` أو `agents.list[].skills`. تتوقع بعض Skills ثنائيات مثبّتة عبر Homebrew؛ على Linux يعني ذلك Linuxbrew (راجع إدخال الأسئلة الشائعة عن Homebrew على Linux أعلاه). راجع [Skills](/ar/tools/skills)، و[إعدادات Skills](/ar/tools/skills-config)، و[ClawHub](/ar/clawhub).

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

    يمكن لهذا المسار استخدام متصفح المضيف المحلي أو Node متصفح متصلة. إذا كان Gateway يعمل في مكان آخر، فإما شغّل مضيف Node على جهاز المتصفح أو استخدم CDP بعيداً بدلاً من ذلك.

    الحدود الحالية على `existing-session` / `user`:

    - تعتمد الإجراءات على `ref`، وليست مدفوعة بمحددات CSS
    - تتطلب عمليات الرفع `ref` / `inputRef` وتدعم حالياً ملفاً واحداً في كل مرة
    - لا تزال `responsebody`، وتصدير PDF، واعتراض التنزيل، والإجراءات الدفعية تحتاج إلى متصفح مُدار أو ملف تعريف CDP خام

  </Accordion>
</AccordionGroup>

## العزل وMemory

<AccordionGroup>
  <Accordion title="هل توجد وثيقة مخصصة للعزل؟">
    نعم. راجع [العزل](/ar/gateway/sandboxing). لإعدادات Docker المحددة (Gateway كامل في Docker أو صور العزل)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدوداً - كيف أفعّل الميزات الكاملة؟">
    الصورة الافتراضية تضع الأمان أولاً وتعمل كمستخدم `node`، لذلك لا
    تتضمن حزم النظام أو Homebrew أو المتصفحات المجمعة. لإعداد أكمل:

    - استمرر `/home/node` باستخدام `OPENCLAW_HOME_VOLUME` حتى تبقى الذاكرات المؤقتة.
    - ادمج تبعيات النظام في الصورة باستخدام `OPENCLAW_DOCKER_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المجمّع:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - اضبط `PLAYWRIGHT_BROWSERS_PATH` وتأكد من أن المسار مستمر.

    الوثائق: [Docker](/ar/install/docker)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل المباشرة شخصية وجعل المجموعات عامة/معزولة مع وكيل واحد؟">
    نعم - إذا كانت حركة مرورك الخاصة هي **رسائل مباشرة** وحركة مرورك العامة هي **مجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` حتى تعمل جلسات المجموعات/القنوات (المفاتيح غير الرئيسية) في خلفية العزل المضبوطة، بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال إعداد: [المجموعات: رسائل مباشرة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع الإعدادات الرئيسي: [إعداد Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلداً من المضيف داخل العزل؟">
    اضبط `agents.defaults.sandbox.docker.binds` على `["host:path:mode"]` (مثل `"/home/user/src:/src:ro"`). تُدمج الربوط العامة وربوط كل وكيل؛ ويتم تجاهل ربوط كل وكيل عندما يكون `scope: "shared"`. استخدم `:ro` لأي شيء حساس وتذكّر أن الربوط تتجاوز جدران نظام ملفات العزل.

    يتحقق OpenClaw من مصادر الربط مقابل كل من المسار المطبّع والمسار القانوني المحلول عبر أعمق سلف موجود. هذا يعني أن عمليات الهروب عبر أصل رمز رابط لا تزال تفشل بإغلاق حتى عندما لا يكون مقطع المسار الأخير موجوداً بعد، ولا تزال فحوصات الجذر المسموح بها تنطبق بعد حل الرموز الروابط.

    راجع [العزل](/ar/gateway/sandboxing#custom-bind-mounts) و[العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للاطلاع على أمثلة وملاحظات السلامة.

  </Accordion>

  <Accordion title="كيف تعمل Memory؟">
    Memory في OpenClaw هي مجرد ملفات Markdown في مساحة عمل الوكيل:

    - ملاحظات يومية في `memory/YYYY-MM-DD.md`
    - ملاحظات طويلة الأمد منقحة في `MEMORY.md` (الجلسات الرئيسية/الخاصة فقط)

    يشغّل OpenClaw أيضاً **تفريغ Memory صامتاً قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction التلقائي. يعمل هذا فقط عندما تكون مساحة العمل
    قابلة للكتابة (تتخطاه بيئات العزل للقراءة فقط). راجع [Memory](/ar/concepts/memory).

  </Accordion>

  <Accordion title="Memory تستمر في نسيان الأشياء. كيف أجعلها تثبت؟">
    اطلب من البوت **كتابة الحقيقة إلى Memory**. تنتمي الملاحظات طويلة الأمد إلى `MEMORY.md`،
    وينتقل السياق قصير الأمد إلى `memory/YYYY-MM-DD.md`.

    لا يزال هذا مجالاً نعمل على تحسينه. من المفيد تذكير النموذج بتخزين الذكريات؛
    وسيعرف ما يجب فعله. إذا استمر في النسيان، فتحقق من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل.

    الوثائق: [Memory](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تستمر Memory إلى الأبد؟ ما الحدود؟">
    تعيش ملفات Memory على القرص وتستمر حتى تحذفها. الحد هو
    التخزين لديك، وليس النموذج. لا يزال **سياق الجلسة** محدوداً بنافذة سياق
    النموذج، لذلك يمكن للمحادثات الطويلة أن تخضع لـ Compaction أو الاقتطاع. لهذا السبب
    يوجد بحث Memory - فهو يعيد الأجزاء ذات الصلة فقط إلى السياق.

    الوثائق: [Memory](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب بحث الذاكرة الدلالية مفتاح OpenAI API؟">
    فقط إذا كنت تستخدم **OpenAI embeddings**. يغطي Codex OAuth الدردشة/الإكمالات
    ولا يمنح **وصول embeddings**، لذلك فإن **تسجيل الدخول باستخدام Codex (OAuth أو
    تسجيل الدخول عبر Codex CLI)** لا يساعد في بحث الذاكرة الدلالية. لا تزال OpenAI embeddings
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تعيّن مزودًا صراحة، يختار OpenClaw مزودًا تلقائيًا عندما
    يستطيع حل مفتاح API (ملفات تعريف المصادقة، أو `models.providers.*.apiKey`، أو متغيرات البيئة).
    يفضّل OpenAI إذا تم حل مفتاح OpenAI، وإلا Gemini إذا تم حل مفتاح Gemini،
    ثم Voyage، ثم Mistral. إذا لم يتوفر أي مفتاح بعيد، يبقى بحث
    الذاكرة معطلاً حتى تهيئه. إذا كان لديك مسار نموذج محلي
    مهيأ وموجود، فإن OpenClaw
    يفضّل `local`. Ollama مدعوم عند تعيين
    `memorySearch.provider = "ollama"` صراحة.

    إذا كنت تفضّل البقاء محليًا، عيّن `memorySearch.provider = "local"` (واختياريًا
    `memorySearch.fallback = "none"`). إذا كنت تريد Gemini embeddings، فعيّن
    `memorySearch.provider = "gemini"` ووفّر `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). ندعم نماذج **OpenAI، Gemini، Voyage، Mistral، Ollama، أو local** الخاصة بـ embedding
    - راجع [الذاكرة](/ar/concepts/memory) لتفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## أين توجد الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل تُحفظ كل البيانات المستخدمة مع OpenClaw محليًا؟">
    لا - **حالة OpenClaw محلية**، لكن **الخدمات الخارجية لا تزال ترى ما ترسله إليها**.

    - **محلي افتراضيًا:** الجلسات، وملفات الذاكرة، والتهيئة، ومساحة العمل تعيش على مضيف Gateway
      (`~/.openclaw` + دليل مساحة العمل لديك).
    - **بعيد بحكم الضرورة:** الرسائل التي ترسلها إلى مزودي النماذج (Anthropic/OpenAI/إلخ) تذهب إلى
      واجهات API الخاصة بهم، ومنصات الدردشة (WhatsApp/Telegram/Slack/إلخ) تخزن بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في الأثر:** استخدام النماذج المحلية يبقي المطالبات على جهازك، لكن حركة القناة
      لا تزال تمر عبر خوادم القناة.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    كل شيء يعيش تحت `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | المسار                                                          | الغرض                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | التهيئة الرئيسية (JSON5)                                          |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | استيراد OAuth القديم (يُنسخ إلى ملفات تعريف المصادقة عند أول استخدام) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات تعريف المصادقة (OAuth، مفاتيح API، و`keyRef`/`tokenRef` اختياريان) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | حمولة أسرار اختيارية مدعومة بملف لمزودي `file` SecretRef          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ملف توافق قديم (تتم إزالة إدخالات `api_key` الثابتة منه)          |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | حالة المزود (مثل `whatsapp/<accountId>/creds.json`)               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | حالة لكل وكيل (agentDir + جلسات)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | سجل المحادثات والحالة (لكل وكيل)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | بيانات الجلسات الوصفية (لكل وكيل)                                 |

    مسار الوكيل الفردي القديم: `~/.openclaw/agent/*` (يرحّله `openclaw doctor`).

    **مساحة العمل** لديك (AGENTS.md، ملفات الذاكرة، Skills، إلخ) منفصلة وتُهيأ عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    تعيش هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` اختياريًا.
      الملف الجذري الصغير `memory.md` هو إدخال إصلاح قديم فقط؛ يمكن لـ `openclaw doctor --fix`
      دمجه في `MEMORY.md` عندما يكون كلا الملفين موجودين.
    - **دليل الحالة (`~/.openclaw`)**: التهيئة، وحالة القناة/المزود، وملفات تعريف المصادقة، والجلسات، والسجلات،
      وSkills المشتركة (`~/.openclaw/skills`).

    مساحة العمل الافتراضية هي `~/.openclaw/workspace`، قابلة للتهيئة عبر:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    إذا "نسي" البوت بعد إعادة تشغيل، فتأكد من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل (وتذكر: يستخدم الوضع البعيد **مساحة عمل مضيف gateway**
    وليس حاسوبك المحمول المحلي).

    نصيحة: إذا كنت تريد سلوكًا أو تفضيلًا دائمًا، فاطلب من البوت **كتابته في
    AGENTS.md أو MEMORY.md** بدلًا من الاعتماد على سجل الدردشة.

    راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) و[الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="استراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** لديك في مستودع git **خاص** وانسخها احتياطيًا في مكان
    خاص (مثل GitHub خاص). يلتقط هذا الذاكرة + ملفات AGENTS/SOUL/USER،
    ويتيح لك استعادة "عقل" المساعد لاحقًا.

    **لا** تودع أي شيء تحت `~/.openclaw` (بيانات اعتماد، جلسات، رموز، أو حمولات أسرار مشفرة).
    إذا كنت تحتاج إلى استعادة كاملة، فانسخ مساحة العمل ودليل الحالة احتياطيًا
    بشكل منفصل (راجع سؤال الترحيل أعلاه).

    المستندات: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف ألغي تثبيت OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إلغاء التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. مساحة العمل هي **cwd الافتراضي** ومرساة الذاكرة، وليست صندوقًا رمليًا صارمًا.
    تُحل المسارات النسبية داخل مساحة العمل، لكن يمكن للمسارات المطلقة الوصول إلى مواقع أخرى
    على المضيف ما لم يكن العزل الرملي ممكّنًا. إذا كنت تحتاج إلى عزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات العزل الرملي لكل وكيل. إذا كنت
    تريد أن يكون مستودع ما هو دليل العمل الافتراضي، فاجعل
    `workspace` لذلك الوكيل يشير إلى جذر المستودع. مستودع OpenClaw هو مجرد كود مصدر؛ أبقِ
    مساحة العمل منفصلة ما لم تكن تريد عمدًا أن يعمل الوكيل داخله.

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
    حالة الجلسة يملكها **مضيف gateway**. إذا كنت في الوضع البعيد، فإن مخزن الجلسات الذي يهمك موجود على الجهاز البعيد، وليس على حاسوبك المحمول المحلي. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>
</AccordionGroup>

## أساسيات التهيئة

<AccordionGroup>
  <Accordion title="ما تنسيق التهيئة؟ وأين توجد؟">
    يقرأ OpenClaw تهيئة **JSON5** اختيارية من `$OPENCLAW_CONFIG_PATH` (الافتراضي: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    إذا كان الملف مفقودًا، فإنه يستخدم افتراضات آمنة نسبيًا (بما في ذلك مساحة عمل افتراضية `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='عيّنت gateway.bind: "lan" (أو "tailnet") والآن لا يوجد شيء يستمع / تقول واجهة المستخدم إنني غير مصرح لي'>
    الربط خارج loopback **يتطلب مسار مصادقة gateway صالحًا**. عمليًا يعني ذلك:

    - مصادقة السر المشترك: رمز أو كلمة مرور
    - `gateway.auth.mode: "trusted-proxy"` خلف وكيل عكسي مدرك للهوية ومهيأ بشكل صحيح

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

    - `gateway.remote.token` / `.password` لا يفعّلان مصادقة gateway المحلية وحدهما.
    - يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كاحتياط فقط عندما لا يكون `gateway.auth.*` معيّنًا.
    - لمصادقة كلمة المرور، عيّن `gateway.auth.mode: "password"` مع `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`) بدلًا من ذلك.
    - إذا كان `gateway.auth.token` / `gateway.auth.password` مهيأ صراحة عبر SecretRef وغير قابل للحل، يفشل الحل بشكل مغلق (دون تمويه باحتياط بعيد).
    - إعدادات Control UI ذات السر المشترك تصادق عبر `connect.params.auth.token` أو `connect.params.auth.password` (المخزنة في إعدادات التطبيق/واجهة المستخدم). الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy` تستخدم ترويسات الطلب بدلًا من ذلك. تجنب وضع الأسرار المشتركة في عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، تتطلب وكلاء reverse proxy عبر loopback على المضيف نفسه تعيينًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true` وإدخال loopback في `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="لماذا أحتاج الآن إلى رمز على localhost؟">
    يفرض OpenClaw مصادقة gateway افتراضيًا، بما في ذلك loopback. في المسار الافتراضي العادي، يعني ذلك مصادقة الرمز: إذا لم يكن هناك مسار مصادقة صريح مهيأ، يحل بدء تشغيل gateway إلى وضع الرمز ويولّد رمزًا خاصًا بوقت التشغيل لذلك التشغيل، لذلك **يجب على عملاء WS المحليين المصادقة**. عيّن `gateway.auth.token`، أو `gateway.auth.password`، أو `OPENCLAW_GATEWAY_TOKEN`، أو `OPENCLAW_GATEWAY_PASSWORD` صراحة عندما يحتاج العملاء إلى سر ثابت عبر عمليات إعادة التشغيل. يمنع هذا العمليات المحلية الأخرى من استدعاء Gateway.

    إذا كنت تفضّل مسار مصادقة مختلفًا، يمكنك اختيار وضع كلمة المرور صراحة (أو `trusted-proxy` للوكلاء العكسيين المدركين للهوية). إذا كنت **حقًا** تريد loopback مفتوحًا، فعيّن `gateway.auth.mode: "none"` صراحة في تهيئتك. يمكن لـ Doctor توليد رمز لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب أن أعيد التشغيل بعد تغيير التهيئة؟">
    يراقب Gateway التهيئة ويدعم إعادة التحميل الساخنة:

    - `gateway.reload.mode: "hybrid"` (الافتراضي): يطبق التغييرات الآمنة فورًا، ويعيد التشغيل للتغييرات الحرجة
    - `hot`، و`restart`، و`off` مدعومة أيضًا

  </Accordion>

  <Accordion title="كيف أعطّل عبارات CLI الطريفة؟">
    عيّن `cli.banner.taglineMode` في التهيئة:

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
    - إذا كنت لا تريد أي لافتة على الإطلاق، فعيّن متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="كيف أفعّل بحث الويب (وجلب الويب)؟">
    يعمل `web_fetch` دون مفتاح API. يعتمد `web_search` على
    المزود المحدد لديك:

    - المزودون المدعومون بواجهة API مثل Brave، وExa، وFirecrawl، وGemini، وGrok، وKimi، وMiniMax Search، وPerplexity، وTavily يتطلبون إعداد مفتاح API المعتاد لديهم.
    - Ollama Web Search لا يحتاج إلى مفتاح، لكنه يستخدم مضيف Ollama المهيأ لديك ويتطلب `ollama signin`.
    - DuckDuckGo لا يحتاج إلى مفتاح، لكنه تكامل غير رسمي قائم على HTML.
    - SearXNG لا يحتاج إلى مفتاح/مستضاف ذاتيًا؛ هيئ `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

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

    أصبحت إعدادات بحث الويب الخاصة بكل موفّر الآن ضمن `plugins.entries.<plugin>.config.webSearch.*`.
    لا تزال مسارات الموفّر القديمة `tools.web.search.*` تُحمَّل مؤقتًا للتوافق، لكن ينبغي عدم استخدامها في الإعدادات الجديدة.
    توجد إعدادات الرجوع لجلب الويب عبر Firecrawl ضمن `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم السماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - يكون `web_fetch` مفعّلًا افتراضيًا (ما لم يُعطَّل صراحةً).
    - إذا حُذف `tools.web.fetch.provider`، يكتشف OpenClaw تلقائيًا أول موفّر رجوع جاهز للجلب من بيانات الاعتماد المتاحة. اليوم الموفّر المضمّن هو Firecrawl.
    - تقرأ الخدمات الخفية متغيرات البيئة من `~/.openclaw/.env` (أو من بيئة الخدمة).

    المستندات: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="config.apply مسح إعدادي. كيف أستعيده وأتجنب ذلك؟">
    يستبدل `config.apply` **الإعداد بالكامل**. إذا أرسلت كائنًا جزئيًا، فسيُزال كل
    ما سواه.

    يحمي OpenClaw الحالي من كثير من حالات الاستبدال العرضي:

    - تتحقق كتابات الإعداد المملوكة لـ OpenClaw من الإعداد الكامل بعد التغيير قبل الكتابة.
    - تُرفض الكتابات غير الصالحة أو المدمّرة المملوكة لـ OpenClaw وتُحفَظ باسم `openclaw.json.rejected.*`.
    - إذا عطّل تعديل مباشر بدء التشغيل أو إعادة التحميل الساخنة، يفشل Gateway بإغلاق آمن أو يتخطى إعادة التحميل؛ ولا يعيد كتابة `openclaw.json`.
    - يملك `openclaw doctor --fix` الإصلاح ويمكنه استعادة آخر نسخة سليمة مع حفظ الملف المرفوض باسم `openclaw.json.clobbered.*`.

    الاستعادة:

    - افحص `openclaw logs --follow` بحثًا عن `Invalid config at` أو `Config write rejected:` أو `config reload skipped (invalid config)`.
    - افحص أحدث `openclaw.json.clobbered.*` أو `openclaw.json.rejected.*` بجانب الإعداد النشط.
    - شغّل `openclaw config validate` و`openclaw doctor --fix`.
    - انسخ المفاتيح المقصودة فقط مرة أخرى باستخدام `openclaw config set` أو `config.patch`.
    - إذا لم تكن لديك آخر نسخة سليمة أو حمولة مرفوضة، فاستعد من نسخة احتياطية، أو أعد تشغيل `openclaw doctor` وأعد إعداد القنوات/النماذج.
    - إذا كان هذا غير متوقع، فأبلغ عن خلل وأرفق آخر إعداد معروف لديك أو أي نسخة احتياطية.
    - يمكن لوكيل ترميز محلي غالبًا إعادة بناء إعداد عامل من السجلات أو السجل التاريخي.

    تجنّبه:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` للتعديلات التفاعلية.
    - استخدم `config.schema.lookup` أولًا عندما لا تكون متأكدًا من المسار الدقيق أو شكل الحقل؛ فهو يعيد عقدة مخطط سطحية مع ملخصات للأبناء المباشرين للتعمّق.
    - استخدم `config.patch` لتعديلات RPC الجزئية؛ واجعل `config.apply` لاستبدال الإعداد الكامل فقط.
    - إذا كنت تستخدم أداة `gateway` المقتصرة على المالك من تشغيل وكيل، فستظل ترفض الكتابة إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك الأسماء المستعارة القديمة `tools.bash.*` التي تُطبَّع إلى مسارات التنفيذ المحمية نفسها).

    المستندات: [الإعداد](/ar/cli/config)، [التهيئة](/ar/cli/configure)، [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغّل Gateway مركزيًا مع عمال متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحد** (مثل Raspberry Pi) مع **عُقد** و**وكلاء**:

    - **Gateway (مركزي):** يملك القنوات (Signal/WhatsApp) والتوجيه والجلسات.
    - **العُقد (الأجهزة):** تتصل أجهزة Macs/iOS/Android كأطراف وتكشف أدوات محلية (`system.run`، `canvas`، `camera`).
    - **الوكلاء (العمال):** عقول/مساحات عمل منفصلة لأدوار خاصة (مثل "عمليات Hetzner"، "البيانات الشخصية").
    - **الوكلاء الفرعيون:** شغّل عملًا في الخلفية من وكيل رئيسي عندما تريد التوازي.
    - **TUI:** اتصل بـ Gateway وبدّل الوكلاء/الجلسات.

    المستندات: [العُقد](/ar/nodes)، [الوصول البعيد](/ar/gateway/remote)، [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/ar/web/tui).

  </Accordion>

  <Accordion title="هل يمكن لمتصفح OpenClaw العمل دون واجهة؟">
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

    الافتراضي هو `false` (بواجهة مرئية). يزيد وضع دون واجهة احتمال تشغيل فحوصات مكافحة الروبوتات في بعض المواقع. راجع [المتصفح](/ar/tools/browser).

    يستخدم وضع دون واجهة **محرك Chromium نفسه** ويعمل لمعظم الأتمتة (النماذج، النقرات، الكشط، تسجيلات الدخول). الفروق الرئيسية:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات الشاشة إذا كنت تحتاج إلى مرئيات).
    - بعض المواقع أكثر صرامة بشأن الأتمتة في وضع دون واجهة (CAPTCHA، مكافحة الروبوتات).
      على سبيل المثال، يحظر X/Twitter الجلسات دون واجهة غالبًا.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    اضبط `browser.executablePath` على ملف Brave الثنائي لديك (أو أي متصفح مستند إلى Chromium) وأعد تشغيل Gateway.
    راجع أمثلة الإعداد الكاملة في [المتصفح](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## البوابات والعُقد البعيدة

<AccordionGroup>
  <Accordion title="كيف تنتقل الأوامر بين Telegram والبوابة والعُقد؟">
    تتعامل **البوابة** مع رسائل Telegram. تشغّل البوابة الوكيل، وبعد ذلك فقط
    تستدعي العُقد عبر **Gateway WebSocket** عندما تكون أداة عقدة مطلوبة:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    لا ترى العُقد حركة مرور الموفّر الواردة؛ فهي تتلقى فقط استدعاءات RPC الخاصة بالعُقد.

  </Accordion>

  <Accordion title="كيف يمكن لوكيلي الوصول إلى حاسوبي إذا كان Gateway مستضافًا عن بُعد؟">
    الإجابة المختصرة: **اقرن حاسوبك كعقدة**. يعمل Gateway في مكان آخر، لكنه يستطيع
    استدعاء أدوات `node.*` (الشاشة، الكاميرا، النظام) على جهازك المحلي عبر Gateway WebSocket.

    إعداد نموذجي:

    1. شغّل Gateway على المضيف الدائم التشغيل (VPS/خادم منزلي).
    2. ضع مضيف Gateway وحاسوبك على الشبكة الخاصة نفسها.
    3. تأكد أن Gateway WS قابل للوصول (ربط الشبكة الخاصة أو نفق SSH).
    4. افتح تطبيق macOS محليًا واتصل بوضع **Remote over SSH** (أو الشبكة الخاصة مباشرة)
       حتى يتمكن من التسجيل كعقدة.
    5. وافق على العقدة على Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا يلزم جسر TCP منفصل؛ تتصل العُقد عبر Gateway WebSocket.

    تذكير أمني: يتيح إقران عقدة macOS تشغيل `system.run` على ذلك الجهاز. لا
    تقرن إلا الأجهزة التي تثق بها، وراجع [الأمان](/ar/gateway/security).

    المستندات: [العُقد](/ar/nodes)، [بروتوكول Gateway](/ar/gateway/protocol)، [وضع macOS البعيد](/ar/platforms/mac/remote)، [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل لكن لا تصلني ردود. ماذا الآن؟">
    تحقق من الأساسيات:

    - Gateway يعمل: `openclaw gateway status`
    - صحة Gateway: `openclaw status`
    - صحة القناة: `openclaw channels status`

    ثم تحقق من المصادقة والتوجيه:

    - إذا كنت تستخدم Tailscale Serve، فتأكد من ضبط `gateway.auth.allowTailscale` بشكل صحيح.
    - إذا كنت تتصل عبر نفق SSH، فأكد أن النفق المحلي يعمل ويشير إلى المنفذ الصحيح.
    - أكد أن قوائم السماح لديك (رسالة مباشرة أو مجموعة) تتضمن حسابك.

    المستندات: [Tailscale](/ar/gateway/tailscale)، [الوصول البعيد](/ar/gateway/remote)، [القنوات](/ar/channels).

  </Accordion>

  <Accordion title="هل يمكن لمثيلي OpenClaw التحدث إلى بعضهما (محلي + VPS)؟">
    نعم. لا يوجد جسر "روبوت إلى روبوت" مضمّن، لكن يمكنك توصيل ذلك بعدة طرق
    موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يستطيع كلا الروبوتين الوصول إليها (Telegram/Slack/WhatsApp).
    اجعل Bot A يرسل رسالة إلى Bot B، ثم دع Bot B يرد كالمعتاد.

    **جسر CLI (عام):** شغّل سكربتًا يستدعي Gateway الآخر باستخدام
    `openclaw agent --message ... --deliver`، مستهدفًا دردشة يستمع فيها الروبوت الآخر.
    إذا كان أحد الروبوتين على VPS بعيد، فوجّه CLI لديك إلى ذلك Gateway البعيد
    عبر SSH/Tailscale (راجع [الوصول البعيد](/ar/gateway/remote)).

    نمط مثال (شغّله من جهاز يمكنه الوصول إلى Gateway الهدف):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف حاجز حماية حتى لا يدخل الروبوتان في حلقة لا تنتهي (الرد عند الذكر فقط، قوائم
    السماح للقنوات، أو قاعدة "عدم الرد على رسائل الروبوتات").

    المستندات: [الوصول البعيد](/ar/gateway/remote)، [CLI الوكيل](/ar/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى خوادم VPS منفصلة لعدة وكلاء؟">
    لا. يمكن لـ Gateway واحد استضافة عدة وكلاء، لكل منهم مساحة عمله وافتراضيات نموذجه
    وتوجيهه. هذا هو الإعداد العادي وهو أرخص وأبسط بكثير من تشغيل
    VPS واحد لكل وكيل.

    استخدم خوادم VPS منفصلة فقط عندما تحتاج إلى عزل صارم (حدود أمنية) أو إعدادات
    مختلفة جدًا لا تريد مشاركتها. وإلا فاحتفظ بـ Gateway واحد واستخدم
    عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل هناك فائدة من استخدام عقدة على حاسوبي المحمول الشخصي بدلًا من SSH من VPS؟">
    نعم - العُقد هي الطريقة الأصلية للوصول إلى حاسوبك المحمول من Gateway بعيد، وهي
    تتيح أكثر من مجرد وصول shell. يعمل Gateway على macOS/Linux (وWindows عبر WSL2) وهو
    خفيف (يكفي VPS صغير أو صندوق من فئة Raspberry Pi؛ ذاكرة 4 غيغابايت كافية)، لذا فإن الإعداد
    الشائع هو مضيف دائم التشغيل مع حاسوبك المحمول كعقدة.

    - **لا يلزم SSH وارد.** تتصل العُقد صادرًا إلى Gateway WebSocket وتستخدم إقران الأجهزة.
    - **ضوابط تنفيذ أكثر أمانًا.** يخضع `system.run` لقوائم السماح/الموافقات الخاصة بالعقدة على ذلك الحاسوب المحمول.
    - **أدوات أجهزة أكثر.** تكشف العُقد `canvas` و`camera` و`screen` بالإضافة إلى `system.run`.
    - **أتمتة متصفح محلية.** أبقِ Gateway على VPS، لكن شغّل Chrome محليًا عبر مضيف عقدة على الحاسوب المحمول، أو اتصل بـ Chrome المحلي على المضيف عبر Chrome MCP.

    SSH مناسب للوصول العارض إلى shell، لكن العُقد أبسط لسير عمل الوكلاء المستمر
    وأتمتة الأجهزة.

    المستندات: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تشغّل العُقد خدمة Gateway؟">
    لا. ينبغي تشغيل **gateway واحد** فقط لكل مضيف إلا إذا كنت تشغّل ملفات تعريف معزولة عن قصد (راجع [بوابات متعددة](/ar/gateway/multiple-gateways)). العُقد أطراف تتصل
    بالبوابة (عُقد iOS/Android، أو "وضع العقدة" في macOS داخل تطبيق شريط القوائم). لمضيفي العقد دون واجهة
    والتحكم عبر CLI، راجع [CLI مضيف العقدة](/ar/cli/node).

    يلزم إعادة تشغيل كاملة لتغييرات `gateway` و`discovery` وسطح Plugin المستضاف.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق الإعداد؟">
    نعم.

    - `config.schema.lookup`: افحص شجرة فرعية واحدة من الإعدادات مع عقدة المخطط السطحية الخاصة بها، وتلميح الواجهة المطابق، وملخصات الأبناء المباشرين قبل الكتابة
    - `config.get`: اجلب اللقطة الحالية + التجزئة
    - `config.patch`: تحديث جزئي آمن (مفضّل لمعظم تعديلات RPC)؛ يعيد التحميل الفوري عند الإمكان ويعيد التشغيل عند اللزوم
    - `config.apply`: تحقّق + استبدل الإعدادات الكاملة؛ يعيد التحميل الفوري عند الإمكان ويعيد التشغيل عند اللزوم
    - لا تزال أداة وقت التشغيل `gateway` المخصّصة للمالك فقط ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ وتُطبّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها

  </Accordion>

  <Accordion title="أدنى إعدادات سليمة للتثبيت الأول">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    يضبط هذا مساحة العمل لديك ويقيّد من يمكنه تشغيل البوت.

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
       - في وحدة تحكم إدارة Tailscale، فعّل MagicDNS حتى يكون لدى VPS اسم ثابت.
    4. **استخدم اسم مضيف tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا كنت تريد واجهة التحكم دون SSH، فاستخدم Tailscale Serve على VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    يحافظ هذا على ربط Gateway بـ loopback ويعرض HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أوصل عقدة Mac بـ Gateway بعيد (Tailscale Serve)؟">
    يعرض Serve **واجهة تحكم Gateway + WS**. تتصل العقد عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكّد من أن VPS + Mac على tailnet نفسها**.
    2. **استخدم تطبيق macOS في الوضع البعيد** (يمكن أن يكون هدف SSH هو اسم مضيف tailnet).
       سيُنشئ التطبيق نفقًا لمنفذ Gateway ويتصل كعقدة.
    3. **وافق على العقدة** على Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    الوثائق: [بروتوكول Gateway](/ar/gateway/protocol)، [الاكتشاف](/ar/gateway/discovery)، [الوضع البعيد على macOS](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل يجب أن أثبّت على حاسوب محمول ثانٍ أم أضيف عقدة فقط؟">
    إذا كنت تحتاج فقط إلى **أدوات محلية** (الشاشة/الكاميرا/exec) على الحاسوب المحمول الثاني، فأضفه
    كـ **عقدة**. يحافظ ذلك على Gateway واحد ويتجنب تكرار الإعدادات. أدوات العقدة المحلية
    حاليًا لنظام macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    ثبّت Gateway ثانيًا فقط عندما تحتاج إلى **عزل صارم** أو بوتين منفصلين بالكامل.

    الوثائق: [العقد](/ar/nodes)، [CLI للعقد](/ar/cli/nodes)، [بوابات متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات البيئة وتحميل .env

<AccordionGroup>
  <Accordion title="كيف يحمّل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات البيئة من العملية الأصلية (shell، launchd/systemd، CI، إلخ) ويحمّل أيضًا:

    - `.env` من دليل العمل الحالي
    - ملف `.env` عام احتياطي من `~/.openclaw/.env` (المعروف أيضًا باسم `$OPENCLAW_STATE_DIR/.env`)

    لا يتجاوز أي من ملفي `.env` متغيرات البيئة الموجودة.

    يمكنك أيضًا تعريف متغيرات بيئة مضمّنة في الإعدادات (تُطبّق فقط إذا كانت مفقودة من بيئة العملية):

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
    2. فعّل استيراد shell (ميزة اختيارية للراحة):

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
    `OPENCLAW_LOAD_SHELL_ENV=1`، `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='ضبطت COPILOT_GITHUB_TOKEN، لكن حالة النماذج تعرض "Shell env: off." لماذا؟'>
    يبلّغ `openclaw models status` عمّا إذا كان **استيراد بيئة shell** مفعّلًا. لا تعني "Shell env: off"
    أن متغيرات البيئة لديك مفقودة - بل تعني فقط أن OpenClaw لن يحمّل
    shell تسجيل الدخول لديك تلقائيًا.

    إذا كان Gateway يعمل كخدمة (launchd/systemd)، فلن يرث بيئة shell
    لديك. أصلح ذلك بإحدى الطرق التالية:

    1. ضع الرمز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد shell (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في إعداداتك (يُطبّق فقط إذا كان مفقودًا).

    ثم أعد تشغيل Gateway وتحقق مجددًا:

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

  <Accordion title="هل تُعاد الجلسات تلقائيًا إذا لم أرسل /new أبدًا؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا **معطّل افتراضيًا** (الافتراضي **0**).
    اضبطه على قيمة موجبة لتفعيل انتهاء الصلاحية بسبب الخمول. عند تفعيله، تبدأ الرسالة **التالية**
    بعد فترة الخمول معرّف جلسة جديدًا لمفتاح الدردشة ذلك.
    لا يحذف هذا النصوص المنسوخة - بل يبدأ جلسة جديدة فقط.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="هل توجد طريقة لإنشاء فريق من مثيلات OpenClaw (مدير تنفيذي واحد والعديد من الوكلاء)؟">
    نعم، عبر **توجيه متعدد الوكلاء** و**الوكلاء الفرعيين**. يمكنك إنشاء وكيل منسّق واحد
    وعدة وكلاء عاملين بمساحات عمل ونماذج خاصة بهم.

    ومع ذلك، يُفضّل النظر إلى هذا كتجربة **ممتعة**. فهي تستهلك الكثير من الرموز وغالبًا
    ما تكون أقل كفاءة من استخدام بوت واحد مع جلسات منفصلة. النموذج المعتاد الذي
    نتصوره هو بوت واحد تتحدث إليه، مع جلسات مختلفة للعمل المتوازي. يمكن لذلك
    البوت أيضًا إنشاء وكلاء فرعيين عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [CLI للوكلاء](/ar/cli/agents).

  </Accordion>

  <Accordion title="لماذا اقتُطع السياق في منتصف المهمة؟ كيف أمنع ذلك؟">
    سياق الجلسة محدود بنافذة النموذج. يمكن أن تؤدي المحادثات الطويلة، أو مخرجات الأدوات الكبيرة، أو الملفات الكثيرة
    إلى تشغيل Compaction أو الاقتطاع.

    ما يساعد:

    - اطلب من البوت تلخيص الحالة الحالية وكتابتها إلى ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل المواضيع.
    - أبقِ السياق المهم في مساحة العمل واطلب من البوت قراءته مرة أخرى.
    - استخدم الوكلاء الفرعيين للعمل الطويل أو المتوازي حتى تبقى الدردشة الرئيسية أصغر.
    - اختر نموذجًا بنافذة سياق أكبر إذا حدث هذا كثيرًا.

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

    ثم أعد تشغيل الإعداد:

    ```bash
    openclaw onboard --install-daemon
    ```

    ملاحظات:

    - يقدّم الإعداد الأولي أيضًا **إعادة ضبط** إذا اكتشف إعدادات موجودة. راجع [الإعداد الأولي (CLI)](/ar/start/wizard).
    - إذا استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد ضبط كل دليل حالة (الافتراضيات هي `~/.openclaw-<profile>`).
    - إعادة ضبط التطوير: `openclaw gateway --dev --reset` (للتطوير فقط؛ يمسح إعدادات التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='أتلقى أخطاء "context too large" - كيف أعيد الضبط أو أضغط السياق؟'>
    استخدم أحد هذه الخيارات:

    - **Compaction** (يبقي المحادثة لكنه يلخص الجولات الأقدم):

      ```
      /compact
      ```

      أو `/compact <instructions>` لتوجيه الملخص.

    - **إعادة ضبط** (معرّف جلسة جديد لمفتاح الدردشة نفسه):

      ```
      /new
      /reset
      ```

    إذا استمر ذلك:

    - فعّل أو اضبط **تشذيب الجلسة** (`agents.defaults.contextPruning`) لقص مخرجات الأدوات القديمة.
    - استخدم نموذجًا بنافذة سياق أكبر.

    الوثائق: [Compaction](/ar/concepts/compaction)، [تشذيب الجلسة](/ar/concepts/session-pruning)، [إدارة الجلسات](/ar/concepts/session).

  </Accordion>

  <Accordion title='لماذا أرى "LLM request rejected: messages.content.tool_use.input field required"؟'>
    هذا خطأ تحقق من المزوّد: أصدر النموذج كتلة `tool_use` دون `input` المطلوبة.
    يعني ذلك عادةً أن سجل الجلسة قديم أو تالف (غالبًا بعد سلاسل طويلة
    أو تغيير في أداة/مخطط).

    الإصلاح: ابدأ جلسة جديدة باستخدام `/new` (رسالة مستقلة).

  </Accordion>

  <Accordion title="لماذا تصلني رسائل Heartbeat كل 30 دقيقة؟">
    تعمل Heartbeats كل **30m** افتراضيًا (**1h** عند استخدام مصادقة OAuth). اضبطها أو عطّلها:

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

    إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (أسطر فارغة فقط ورؤوس markdown
    مثل `# Heading`)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API.
    إذا كان الملف مفقودًا، فسيستمر تشغيل Heartbeat ويقرر النموذج ما يجب فعله.

    تستخدم التجاوزات لكل وكيل `agents.list[].heartbeat`. الوثائق: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل أحتاج إلى إضافة "حساب بوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك أنت**، لذلك إذا كنت في المجموعة، يستطيع OpenClaw رؤيتها.
    افتراضيًا، تُحظر ردود المجموعات حتى تسمح بالمرسلين (`groupPolicy: "allowlist"`).

    إذا كنت تريد أن تكون **أنت** فقط قادرًا على تشغيل ردود المجموعات:

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

    الخيار 2 (إذا كان مهيأ/مسموحًا به بالفعل): اعرض المجموعات من الإعدادات:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    الوثائق: [WhatsApp](/ar/channels/whatsapp)، [الدليل](/ar/cli/directory)، [السجلات](/ar/cli/logs).

  </Accordion>

  <Accordion title="لماذا لا يرد OpenClaw في مجموعة؟">
    سببان شائعان:

    - تقييد الإشارة مفعّل (افتراضيًا). يجب أن تشير إلى البوت باستخدام @mention (أو تطابق `mentionPatterns`).
    - هيّأت `channels.whatsapp.groups` دون `"*"` والمجموعة ليست في قائمة السماح.

    راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشارك المجموعات/السلاسل السياق مع الرسائل المباشرة؟">
    تُدمج الدردشات المباشرة في الجلسة الرئيسية افتراضيًا. للمجموعات/القنوات مفاتيح جلسات خاصة بها، وتكون مواضيع Telegram / سلاسل Discord جلسات منفصلة. راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم عدد مساحات العمل والوكلاء التي يمكنني إنشاؤها؟">
    لا توجد حدود صارمة. عشرات منها (بل حتى مئاتها) لا مشكلة فيها، لكن انتبه إلى:

    - **نمو القرص:** تعيش الجلسات + النسخ النصية ضمن `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** المزيد من الوكلاء يعني استخدامًا متزامنًا أكبر للنموذج.
    - **عبء التشغيل:** ملفات تعريف المصادقة، ومساحات العمل، وتوجيه القنوات لكل وكيل.

    نصائح:

    - احتفظ بمساحة عمل **نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - قلّم الجلسات القديمة (احذف JSONL أو إدخالات المخزن) إذا نما القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل الشاردة وعدم تطابق ملفات التعريف.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة بوتات أو محادثات في الوقت نفسه (Slack)، وكيف أعد ذلك؟">
    نعم. استخدم **التوجيه متعدد الوكلاء** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة حسب
    القناة/الحساب/النظير. Slack مدعوم كقناة ويمكن ربطه بوكلاء محددين.

    الوصول عبر المتصفح قوي لكنه ليس "افعل أي شيء يمكن للإنسان فعله" - فمكافحة البوتات، وCAPTCHA، وMFA قد
    تظل تمنع الأتمتة. للحصول على تحكم أكثر موثوقية في المتصفح، استخدم Chrome MCP محليًا على المضيف،
    أو استخدم CDP على الجهاز الذي يشغّل المتصفح فعليًا.

    إعداد أفضل الممارسات:

    - مضيف Gateway يعمل دائمًا (VPS/Mac mini).
    - وكيل واحد لكل دور (ارتباطات).
    - قناة/قنوات Slack مرتبطة بهؤلاء الوكلاء.
    - متصفح محلي عبر Chrome MCP أو عقدة عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [Slack](/ar/channels/slack)،
    [المتصفح](/ar/tools/browser)، [العُقد](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج، تجاوز الفشل، وملفات تعريف المصادقة

تعيش أسئلة وأجوبة النماذج — الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة —
في [الأسئلة الشائعة حول النماذج](/ar/help/faq-models).

## Gateway: المنافذ، "قيد التشغيل بالفعل"، والوضع البعيد

<AccordionGroup>
  <Accordion title="ما المنفذ الذي يستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ الفردي متعدد الاستخدامات لـ WebSocket + HTTP (واجهة التحكم، الخطافات، وغير ذلك).

    ترتيب الأولوية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا يقول openclaw gateway status "Runtime: running" لكن "Connectivity probe: failed"؟'>
    لأن "running" هي رؤية **المشرف** (launchd/systemd/schtasks). مسبار الاتصال هو CLI الذي يتصل فعليًا بـ WebSocket الخاص بالـ Gateway.

    استخدم `openclaw gateway status` وثق بهذه الأسطر:

    - `Probe target:` (عنوان URL الذي استخدمه المسبار فعليًا)
    - `Listening:` (ما هو مرتبط فعليًا على المنفذ)
    - `Last gateway error:` (سبب جذري شائع عندما تكون العملية حية لكن المنفذ لا يستمع)

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status قيمتي "Config (cli)" و"Config (service)" مختلفتين؟'>
    أنت تعدّل ملف إعدادات بينما تعمل الخدمة بملف آخر (غالبًا عدم تطابق `--profile` / `OPENCLAW_STATE_DIR`).

    الإصلاح:

    ```bash
    openclaw gateway install --force
    ```

    شغّل ذلك من نفس `--profile` / البيئة التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ماذا يعني "another gateway instance is already listening"؟'>
    يفرض OpenClaw قفل وقت التشغيل عبر ربط مستمع WebSocket فورًا عند بدء التشغيل (افتراضيًا `ws://127.0.0.1:18789`). إذا فشل الربط مع `EADDRINUSE`، فإنه يرمي `GatewayLockError` مشيرًا إلى أن مثيلًا آخر يستمع بالفعل.

    الإصلاح: أوقف المثيل الآخر، أو حرر المنفذ، أو شغّل باستخدام `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="كيف أشغّل OpenClaw في الوضع البعيد (عميل يتصل بـ Gateway في مكان آخر)؟">
    اضبط `gateway.mode: "remote"` ووجّهه إلى عنوان WebSocket بعيد، اختياريًا مع بيانات اعتماد بعيدة بسر مشترك:

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

    - يبدأ `openclaw gateway` فقط عندما يكون `gateway.mode` هو `local` (أو عندما تمرر علم التجاوز).
    - يراقب تطبيق macOS ملف الإعدادات ويبدّل الأوضاع مباشرةً عند تغيّر هذه القيم.
    - `gateway.remote.token` / `.password` هي بيانات اعتماد بعيدة من جهة العميل فقط؛ ولا تفعّل مصادقة Gateway محلية بذاتها.

  </Accordion>

  <Accordion title='تقول واجهة التحكم "unauthorized" (أو تواصل إعادة الاتصال). ماذا الآن؟'>
    لا يتطابق مسار مصادقة Gateway لديك مع طريقة مصادقة الواجهة.

    حقائق (من الكود):

    - تحتفظ واجهة التحكم بالرمز في `sessionStorage` لجلسة تبويب المتصفح الحالية وعنوان URL المحدد للـ Gateway، لذا تظل عمليات التحديث في التبويب نفسه تعمل دون استعادة استمرارية رمز localStorage طويلة الأمد.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة محاولة محدودة واحدة باستخدام رمز جهاز مخزّن مؤقتًا عندما يعيد Gateway تلميحات إعادة المحاولة (`canRetryWithDeviceToken=true`، `recommendedNextStep=retry_with_device_token`).
    - إعادة المحاولة بذلك الرمز المخزّن مؤقتًا تعيد الآن استخدام النطاقات الموافق عليها المخزّنة مع رمز الجهاز. لا يزال مستدعو `deviceToken` الصريح / `scopes` الصريح يحتفظون بمجموعة النطاقات المطلوبة بدلًا من وراثة النطاقات المخزّنة مؤقتًا.
    - خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال: الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزّن، ثم رمز التمهيد.
    - فحوص نطاق رمز التمهيد مسبوقة بالدور. قائمة السماح لمشغّل التمهيد المضمنة لا تلبّي إلا طلبات المشغّل؛ ما زالت العقد أو الأدوار الأخرى غير المشغّلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    الإصلاح:

    - الأسرع: `openclaw dashboard` (يطبع + ينسخ عنوان URL للوحة المعلومات، ويحاول فتحه؛ ويعرض تلميح SSH إذا كان بلا واجهة).
    - إذا لم يكن لديك رمز بعد: `openclaw doctor --generate-gateway-token`.
    - إذا كان بعيدًا، أنشئ نفقًا أولًا: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع السر المشترك: اضبط `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم الصق السر المطابق في إعدادات واجهة التحكم.
    - وضع Tailscale Serve: تأكد من تمكين `gateway.auth.allowTailscale` وأنك تفتح عنوان URL الخاص بـ Serve، لا عنوان local loopback/tailnet خامًا يتجاوز رؤوس هوية Tailscale.
    - وضع الوكيل الموثوق: تأكد من أنك تأتي عبر الوكيل المكوّن والواعي بالهوية، لا عبر عنوان Gateway خام. كما تحتاج وكلاء local loopback على المضيف نفسه إلى `gateway.auth.trustedProxy.allowLoopback = true`.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، دوّر/أعد اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا قالت مكالمة التدوير هذه إنها رُفضت، فتحقق من أمرين:
      - يمكن لجلسات الجهاز المقترن تدوير جهازها **الخاص** فقط ما لم تكن تملك أيضًا `operator.admin`
      - لا يمكن لقيم `--scope` الصريحة أن تتجاوز نطاقات المشغّل الحالية للمتصل
    - ما زلت عالقًا؟ شغّل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [لوحة المعلومات](/ar/web/dashboard) لتفاصيل المصادقة.

  </Accordion>

  <Accordion title="ضبطت gateway.bind على tailnet لكنه لا يستطيع الربط ولا شيء يستمع">
    يختار ربط `tailnet` عنوان IP من Tailscale من واجهات شبكتك (100.64.0.0/10). إذا لم يكن الجهاز على Tailscale (أو كانت الواجهة معطلة)، فلا يوجد ما يمكن الربط به.

    الإصلاح:

    - شغّل Tailscale على ذلك المضيف (حتى يحصل على عنوان 100.x)، أو
    - بدّل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. يفضّل `auto` local loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطًا خاصًا بـ tailnet فقط.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة Gateways على المضيف نفسه؟">
    عادةً لا - يمكن لـ Gateway واحد تشغيل عدة قنوات مراسلة ووكلاء. استخدم عدة Gateways فقط عندما تحتاج إلى التكرار الاحتياطي (مثال: بوت إنقاذ) أو العزل الصارم.

    نعم، لكن يجب أن تعزل:

    - `OPENCLAW_CONFIG_PATH` (إعدادات لكل مثيل)
    - `OPENCLAW_STATE_DIR` (حالة لكل مثيل)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (موصى به):

    - استخدم `openclaw --profile <name> ...` لكل مثيل (ينشئ تلقائيًا `~/.openclaw-<name>`).
    - اضبط `gateway.port` فريدًا في إعدادات كل ملف تعريف (أو مرر `--port` للتشغيل اليدوي).
    - ثبّت خدمة لكل ملف تعريف: `openclaw --profile <name> gateway install`.

    تضيف ملفات التعريف أيضًا لاحقات لأسماء الخدمات (`ai.openclaw.<profile>`؛ القديم `com.openclaw.*`، `openclaw-gateway-<profile>.service`، `OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [بوابات متعددة](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ماذا يعني "invalid handshake" / الرمز 1008؟'>
    Gateway هو **خادم WebSocket**، ويتوقع أن تكون الرسالة الأولى تمامًا
    إطار `connect`. إذا تلقى أي شيء آخر، فإنه يغلق الاتصال
    باستخدام **الرمز 1008** (انتهاك السياسة).

    الأسباب الشائعة:

    - فتحت عنوان URL الخاص بـ **HTTP** في متصفح (`http://...`) بدلًا من عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - أزال وكيل أو نفق رؤوس المصادقة أو أرسل طلبًا ليس لـ Gateway.

    إصلاحات سريعة:

    1. استخدم عنوان WS: `ws://<host>:18789` (أو `wss://...` إذا كان HTTPS).
    2. لا تفتح منفذ WS في تبويب متصفح عادي.
    3. إذا كانت المصادقة مفعّلة، ضمّن الرمز/كلمة المرور في إطار `connect`.

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

    يمكنك ضبط مسار ثابت عبر `logging.file`. يتحكم `logging.level` في مستوى سجل الملف. ويتحكم `--verbose` و`logging.consoleLevel` في إسهاب وحدة التحكم.

    أسرع متابعة للسجل:

    ```bash
    openclaw logs --follow
    ```

    سجلات الخدمة/المشرف (عندما يعمل Gateway عبر launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` و`gateway.err.log` (افتراضيًا: `~/.openclaw/logs/...`؛ تستخدم ملفات التعريف `~/.openclaw-<profile>/logs/...`)
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

  <Accordion title="أغلقت الطرفية على Windows - كيف أعيد تشغيل OpenClaw؟">
    توجد **طريقتا تثبيت على Windows**:

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

    **2) Windows أصلي (غير موصى به):** يعمل Gateway مباشرةً في Windows.

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
    - اقتران القناة/قائمة السماح يحظران الردود (تحقق من إعدادات القناة + السجلات).
    - WebChat/Dashboard مفتوح بدون الرمز الصحيح.

    إذا كنت تعمل عن بُعد، فتأكد من أن اتصال النفق/Tailscale يعمل وأن
    WebSocket الخاص بـ Gateway يمكن الوصول إليه.

    المستندات: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"تم قطع الاتصال بـ gateway: لا يوجد سبب" - ماذا الآن؟'>
    يعني هذا عادةً أن واجهة المستخدم فقدت اتصال WebSocket. تحقق مما يلي:

    1. هل Gateway قيد التشغيل؟ `openclaw gateway status`
    2. هل Gateway سليمة؟ `openclaw status`
    3. هل تملك واجهة المستخدم الرمز الصحيح؟ `openclaw dashboard`
    4. إذا كنت تعمل عن بُعد، هل رابط النفق/Tailscale يعمل؟

    ثم تابع السجلات:

    ```bash
    openclaw logs --follow
    ```

    المستندات: [Dashboard](/ar/web/dashboard)، [الوصول عن بُعد](/ar/gateway/remote)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

  </Accordion>

  <Accordion title="فشل Telegram setMyCommands. ما الذي ينبغي أن أتحقق منه؟">
    ابدأ بالسجلات وحالة القناة:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    ثم طابق الخطأ:

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على إدخالات كثيرة جدًا. يقوم OpenClaw بالفعل بتقليصها إلى حد Telegram ثم يعيد المحاولة بأوامر أقل، لكن لا تزال بعض إدخالات القائمة بحاجة إلى الإزالة. قلّل أوامر Plugin/Skill/الأوامر المخصصة، أو عطّل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed`، أو `Network request for 'setMyCommands' failed!`، أو أخطاء شبكة مشابهة: إذا كنت على VPS أو خلف وكيل، فتأكد من السماح باتصالات HTTPS الصادرة ومن أن DNS يعمل مع `api.telegram.org`.

    إذا كان Gateway بعيدًا، فتأكد من أنك تنظر إلى السجلات على مضيف Gateway.

    المستندات: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="لا يعرض TUI أي مخرجات. ما الذي ينبغي أن أتحقق منه؟">
    تأكد أولًا من إمكانية الوصول إلى Gateway ومن أن الوكيل يمكنه العمل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لرؤية الحالة الحالية. إذا كنت تتوقع ردودًا في قناة
    دردشة، فتأكد من تفعيل التسليم (`/deliver on`).

    المستندات: [TUI](/ar/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway تمامًا ثم أبدأ تشغيله؟">
    إذا ثبّتّ الخدمة:

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

  <Accordion title="تبسيط: openclaw gateway restart مقابل openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **خدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغّل gateway **في المقدمة** لجلسة الطرفية هذه.

    إذا ثبّتّ الخدمة، فاستخدم أوامر gateway. استخدم `openclaw gateway` عندما
    تريد تشغيلًا لمرة واحدة في المقدمة.

  </Accordion>

  <Accordion title="أسرع طريقة للحصول على تفاصيل أكثر عند فشل شيء ما">
    ابدأ Gateway باستخدام `--verbose` للحصول على تفاصيل أكثر في وحدة التحكم. ثم افحص ملف السجل بحثًا عن أخطاء مصادقة القناة، وتوجيه النموذج، وRPC.
  </Accordion>
</AccordionGroup>

## الوسائط والمرفقات

<AccordionGroup>
  <Accordion title="أنشأت Skill صورة/PDF، لكن لم يتم إرسال شيء">
    يجب أن تتضمن المرفقات الصادرة من الوكيل سطر `MEDIA:<path-or-url>` (في سطر مستقل). راجع [إعداد مساعد OpenClaw](/ar/start/openclaw) و[إرسال الوكيل](/ar/tools/agent-send).

    الإرسال عبر CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    تحقق أيضًا من الآتي:

    - القناة المستهدفة تدعم الوسائط الصادرة ولا تحظرها قوائم السماح.
    - الملف ضمن حدود الحجم الخاصة بالمزود (تُعاد تحجيم الصور إلى حد أقصى 2048px).
    - يحافظ `tools.fs.workspaceOnly=true` على إرسال المسارات المحلية محدودًا بمساحة العمل، ومخزن temp/media-store، والملفات التي تم التحقق منها عبر sandbox.
    - يتيح `tools.fs.workspaceOnly=false` لـ `MEDIA:` إرسال ملفات محلية على المضيف يستطيع الوكيل قراءتها بالفعل، لكن فقط للوسائط وأنواع المستندات الآمنة (الصور، والصوت، والفيديو، وPDF، ومستندات Office). لا تزال الملفات النصية العادية والملفات التي تبدو كأسرار محظورة.

    راجع [الصور](/ar/nodes/images).

  </Accordion>
</AccordionGroup>

## الأمان والتحكم في الوصول

<AccordionGroup>
  <Accordion title="هل من الآمن تعريض OpenClaw للرسائل المباشرة الواردة؟">
    تعامل مع الرسائل المباشرة الواردة كمدخلات غير موثوقة. صُممت الإعدادات الافتراضية لتقليل المخاطر:

    - السلوك الافتراضي في القنوات القادرة على الرسائل المباشرة هو **الاقتران**:
      - يتلقى المرسلون غير المعروفين رمز اقتران؛ ولا يعالج bot رسالتهم.
      - وافق باستخدام: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - الطلبات المعلقة محدودة بـ **3 لكل قناة**؛ تحقق من `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل رمز.
    - يتطلب فتح الرسائل المباشرة علنًا قبولًا صريحًا (`dmPolicy: "open"` وقائمة سماح `"*"`).

    شغّل `openclaw doctor` لإظهار سياسات الرسائل المباشرة الخطرة.

  </Accordion>

  <Accordion title="هل حقن المطالبات مصدر قلق للروبوتات العامة فقط؟">
    لا. يتعلق حقن المطالبات بـ **المحتوى غير الموثوق**، وليس فقط بمن يمكنه إرسال رسالة مباشرة إلى bot.
    إذا كان مساعدك يقرأ محتوى خارجيًا (بحث/جلب الويب، صفحات المتصفح، الرسائل الإلكترونية،
    المستندات، المرفقات، السجلات الملصقة)، فقد يتضمن ذلك المحتوى تعليمات تحاول
    اختطاف النموذج. يمكن أن يحدث هذا حتى لو **كنت أنت المرسل الوحيد**.

    يكون الخطر الأكبر عندما تكون الأدوات مفعّلة: يمكن خداع النموذج لتهريب
    السياق أو استدعاء الأدوات نيابةً عنك. قلّل نطاق التأثير عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو معطّل الأدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` معطلة للوكلاء المفعّلة أدواتهم
    - التعامل مع نص الملفات/المستندات المفكوك كغير موثوق أيضًا: يقوم OpenResponses
      `input_file` واستخراج مرفقات الوسائط كلاهما بتغليف النص المستخرج داخل
      علامات حدود محتوى خارجي صريحة بدلًا من تمرير نص الملف الخام
    - استخدام sandbox وقوائم سماح صارمة للأدوات

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل ينبغي أن يكون لـ bot بريد إلكتروني أو حساب GitHub أو رقم هاتف خاص به؟">
    نعم، لمعظم الإعدادات. عزل bot بحسابات وأرقام هاتف منفصلة
    يقلل نطاق التأثير إذا حدث خطأ ما. كما يجعل تدوير
    بيانات الاعتماد أو إبطال الوصول أسهل بدون التأثير في حساباتك الشخصية.

    ابدأ على نطاق صغير. امنح الوصول فقط إلى الأدوات والحسابات التي تحتاجها فعلًا، ووسّع
    لاحقًا إذا لزم الأمر.

    المستندات: [الأمان](/ar/gateway/security)، [الاقتران](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية، وهل هذا آمن؟">
    نحن **لا** نوصي بالاستقلالية الكاملة على رسائلك الشخصية. النمط الأكثر أمانًا هو:

    - إبقاء الرسائل المباشرة في **وضع الاقتران** أو ضمن قائمة سماح ضيقة.
    - استخدام **رقم أو حساب منفصل** إذا أردته أن يرسل نيابةً عنك.
    - اجعله يصيغ المسودة، ثم **وافق قبل الإرسال**.

    إذا أردت التجربة، فافعل ذلك على حساب مخصص وأبقِه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل للدردشة فقط وكانت المدخلات موثوقة. تكون الفئات الأصغر
    أكثر عرضة لاختطاف التعليمات، لذلك تجنبها للوكلاء المفعّلة أدواتهم
    أو عند قراءة محتوى غير موثوق. إذا كان لا بد من استخدام نموذج أصغر، فأغلق
    الأدوات وشغّله داخل sandbox. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="شغّلت /start في Telegram لكن لم أحصل على رمز اقتران">
    تُرسل رموز الاقتران **فقط** عندما يرسل مرسل غير معروف رسالة إلى bot ويكون
    `dmPolicy: "pairing"` مفعّلًا. لا ينشئ `/start` رمزًا بحد ذاته.

    تحقق من الطلبات المعلقة:

    ```bash
    openclaw pairing list telegram
    ```

    إذا كنت تريد وصولًا فوريًا، فأضف معرّف المرسل إلى قائمة السماح أو اضبط `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيراسل جهات الاتصال لدي؟ كيف يعمل الاقتران؟">
    لا. سياسة الرسائل المباشرة الافتراضية في WhatsApp هي **الاقتران**. يحصل المرسلون غير المعروفين على رمز اقتران فقط ولا تتم **معالجة** رسالتهم. يرد OpenClaw فقط على الدردشات التي يتلقاها أو على عمليات إرسال صريحة تشغّلها أنت.

    وافق على الاقتران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اعرض الطلبات المعلقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لضبط **قائمة السماح/المالك** بحيث يُسمح برسائلك المباشرة الخاصة. لا تُستخدم للإرسال التلقائي. إذا كنت تشغّل على رقم WhatsApp الشخصي، فاستخدم ذلك الرقم وفعّل `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، وإلغاء المهام، و"لن يتوقف"

<AccordionGroup>
  <Accordion title="كيف أوقف ظهور رسائل النظام الداخلية في الدردشة؟">
    تظهر معظم الرسائل الداخلية أو رسائل الأدوات فقط عند تفعيل **verbose** أو **trace** أو **reasoning**
    لتلك الجلسة.

    أصلح ذلك في الدردشة التي تراها فيها:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    إذا ظل مزعجًا، فتحقق من إعدادات الجلسة في واجهة التحكم واضبط verbose
    على **inherit**. تأكد أيضًا من أنك لا تستخدم ملف bot شخصيًا مضبوطًا فيه `verboseDefault`
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

    هذه محفزات إلغاء (وليست أوامر شرطة مائلة).

    بالنسبة لعمليات الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

    ```
    process action:kill sessionId:XXX
    ```

    نظرة عامة على أوامر الشرطة المائلة: راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

    يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`، لكن بعض الاختصارات (مثل `/status`) تعمل أيضًا ضمن السطر للمرسلين الموجودين في قائمة السماح.

  </Accordion>

  <Accordion title='كيف أرسل رسالة Discord من Telegram؟ ("تم رفض المراسلة عبر السياقات")'>
    يحظر OpenClaw المراسلة **عبر المزوّدين** افتراضيًا. إذا كان استدعاء الأداة مرتبطًا
    بـ Telegram، فلن يرسل إلى Discord إلا إذا سمحت بذلك صراحة.

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

    أعد تشغيل gateway بعد تعديل الإعدادات.

  </Accordion>

  <Accordion title='لماذا يبدو أن bot "يتجاهل" الرسائل المتتابعة بسرعة؟'>
    يتحكم وضع قائمة الانتظار في كيفية تفاعل الرسائل الجديدة مع تشغيل جارٍ. استخدم `/queue` لتغيير الأوضاع:

    - `steer` - وضع كل التوجيهات المعلقة في قائمة انتظار للحد التالي للنموذج في التشغيل الحالي
    - `queue` - توجيه قديم واحدًا تلو الآخر
    - `followup` - تشغيل الرسائل واحدة تلو الأخرى
    - `collect` - تجميع الرسائل والرد مرة واحدة
    - `steer-backlog` - وجّه الآن، ثم عالج المتراكم
    - `interrupt` - إلغاء التشغيل الحالي والبدء من جديد

    الوضع الافتراضي هو `steer`. يمكنك إضافة خيارات مثل `debounce:0.5s cap:25 drop:summarize` لأوضاع المتابعة. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما النموذج الافتراضي لـ Anthropic عند استخدام مفتاح واجهة برمجة التطبيقات؟'>
    في OpenClaw، تكون بيانات الاعتماد واختيار النموذج منفصلين. يؤدي ضبط `ANTHROPIC_API_KEY` (أو تخزين مفتاح واجهة برمجة تطبيقات Anthropic في ملفات تعريف المصادقة) إلى تفعيل المصادقة، لكن النموذج الافتراضي الفعلي هو ما تضبطه في `agents.defaults.model.primary` (على سبيل المثال، `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). إذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم يتمكن من العثور على بيانات اعتماد Anthropic في ملف `auth-profiles.json` المتوقع للوكيل الذي يعمل.
  </Accordion>
</AccordionGroup>

---

ما زلت عالقًا؟ اسأل في [Discord](https://discord.com/invite/clawd) أو افتح [مناقشة على GitHub](https://github.com/openclaw/openclaw/discussions).

## ذات صلة

- [الأسئلة الشائعة عن التشغيل الأول](/ar/help/faq-first-run) — التثبيت، الإعداد الأولي، المصادقة، الاشتراكات، الإخفاقات المبكرة
- [الأسئلة الشائعة عن النماذج](/ar/help/faq-models) — اختيار النموذج، تجاوز الفشل، ملفات تعريف المصادقة
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) — فرز يبدأ بالأعراض
