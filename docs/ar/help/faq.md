---
read_when:
    - الإجابة عن الأسئلة الشائعة حول الإعداد أو التثبيت أو الإعداد الأولي أو دعم وقت التشغيل
    - فرز المشكلات التي أبلغ عنها المستخدمون قبل التعمق في تصحيح الأخطاء
summary: الأسئلة الشائعة حول إعداد OpenClaw وتهيئته واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-05-02T22:20:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1437a84d7da0e4111edd46297b2a486e2da4f6e4a6cff0d69d6a372e85608130
    source_path: help/faq.md
    workflow: 16
---

إجابات سريعة مع استكشاف أخطاء أعمق للإعدادات الواقعية (التطوير المحلي، VPS، تعدد الوكلاء، OAuth/مفاتيح API، تجاوز فشل النماذج). لتشخيصات وقت التشغيل، راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). لمرجع التكوين الكامل، راجع [التكوين](/ar/gateway/configuration).

## أول 60 ثانية إذا كان هناك شيء معطّل

1. **الحالة السريعة (الفحص الأول)**

   ```bash
   openclaw status
   ```

   ملخص محلي سريع: OS + التحديث، إمكانية الوصول إلى Gateway/الخدمة، الوكلاء/الجلسات، تكوين المزوّد + مشكلات وقت التشغيل (عندما يكون Gateway قابلًا للوصول).

2. **تقرير قابل للصق (آمن للمشاركة)**

   ```bash
   openclaw status --all
   ```

   تشخيص للقراءة فقط مع ذيل السجل (مع تنقيح الرموز المميزة).

3. **حالة Daemon + المنفذ**

   ```bash
   openclaw gateway status
   ```

   يعرض وقت تشغيل المشرف مقابل إمكانية الوصول عبر RPC، وعنوان URL لهدف الفحص، وأي تكوين يُرجّح أن الخدمة استخدمته.

4. **فحوصات عميقة**

   ```bash
   openclaw status --deep
   ```

   يشغّل فحصًا حيًا لصحة Gateway، بما في ذلك فحوصات القنوات عند دعمها
   (يتطلب Gateway قابلًا للوصول). راجع [الصحة](/ar/gateway/health).

5. **تتبّع أحدث سجل**

   ```bash
   openclaw logs --follow
   ```

   إذا كان RPC متوقفًا، فارجع إلى:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   سجلات الملفات منفصلة عن سجلات الخدمة؛ راجع [التسجيل](/ar/logging) و[استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

6. **شغّل أداة الفحص (الإصلاحات)**

   ```bash
   openclaw doctor
   ```

   يصلح/يرحّل الإعدادات/الحالة + يشغّل فحوصات السلامة. راجع [Doctor](/ar/gateway/doctor).

7. **لقطة Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   يطلب من Gateway العامل لقطة كاملة (WS فقط). راجع [Health](/ar/gateway/health).

## البدء السريع وإعداد التشغيل الأول

أسئلة وأجوبة التشغيل الأول — التثبيت، والتهيئة، ومسارات المصادقة، والاشتراكات، والإخفاقات الأولية —
موجودة في [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run).

## ما هو OpenClaw؟

<AccordionGroup>
  <Accordion title="ما هو OpenClaw في فقرة واحدة؟">
    OpenClaw هو مساعد ذكاء اصطناعي شخصي تشغّله على أجهزتك الخاصة. يرد عبر واجهات المراسلة التي تستخدمها بالفعل (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، وPlugins القنوات المضمّنة مثل QQ Bot)، ويمكنه أيضًا تنفيذ الصوت + Canvas حي على المنصات المدعومة. **Gateway** هو مستوى التحكم الذي يعمل دائمًا؛ والمساعد هو المنتج.
  </Accordion>

  <Accordion title="عرض القيمة">
    OpenClaw ليس "مجرد غلاف Claude." إنه **مستوى تحكم محلي أولًا** يتيح لك تشغيل
    مساعد قادر على **عتادك الخاص**، ويمكن الوصول إليه من تطبيقات الدردشة التي تستخدمها بالفعل، مع
    جلسات ذات حالة، وذاكرة، وأدوات - من دون تسليم التحكم في سير عملك إلى
    SaaS مستضاف.

    أبرز النقاط:

    - **أجهزتك، بياناتك:** شغّل Gateway حيثما تريد (Mac، Linux، VPS) واحتفظ
      بمساحة العمل + سجل الجلسات محليًا.
    - **قنوات حقيقية، لا صندوق ويب معزول:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/إلخ،
      إضافة إلى الصوت عبر الهاتف المحمول وCanvas على المنصات المدعومة.
    - **محايد تجاه النماذج:** استخدم Anthropic، وOpenAI، وMiniMax، وOpenRouter، وغيرها، مع توجيه
      لكل وكيل وتحوّل عند الإخفاق.
    - **خيار محلي فقط:** شغّل النماذج المحلية حتى **تبقى كل البيانات على جهازك** إذا أردت.
    - **توجيه متعدد الوكلاء:** افصل الوكلاء حسب القناة أو الحساب أو المهمة، ولكل منهم
      مساحة عمل وافتراضيات خاصة به.
    - **مفتوح المصدر وقابل للتعديل:** افحصه، ووسّعه، واستضفه ذاتيًا من دون قفل المورّد.

    الوثائق: [Gateway](/ar/gateway)، [القنوات](/ar/channels)، [متعدد الوكلاء](/ar/concepts/multi-agent)،
    [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="لقد أعددته للتو - ماذا أفعل أولًا؟">
    مشاريع أولى جيدة:

    - أنشئ موقع ويب (WordPress، أو Shopify، أو موقعًا ثابتًا بسيطًا).
    - أنشئ نموذجًا أوليًا لتطبيق هاتف محمول (مخطط، شاشات، خطة API).
    - نظّم الملفات والمجلدات (تنظيف، تسمية، ووسم).
    - اربط Gmail وأتمت الملخصات أو المتابعات.

    يمكنه التعامل مع المهام الكبيرة، لكنه يعمل بأفضل شكل عندما تقسّمها إلى مراحل وتستخدم
    وكلاء فرعيين للعمل المتوازي.

  </Accordion>

  <Accordion title="ما أهم خمس حالات استخدام يومية لـ OpenClaw؟">
    تبدو المكاسب اليومية عادةً كالتالي:

    - **موجزات شخصية:** ملخصات لصندوق الوارد، والتقويم، والأخبار التي تهمك.
    - **البحث والصياغة:** بحث سريع، وملخصات، ومسودات أولى لرسائل البريد الإلكتروني أو الوثائق.
    - **التذكيرات والمتابعات:** تنبيهات وقوائم تحقق مدفوعة بـ cron أو heartbeat.
    - **أتمتة المتصفح:** تعبئة النماذج، وجمع البيانات، وتكرار مهام الويب.
    - **تنسيق عبر الأجهزة:** أرسل مهمة من هاتفك، ودع Gateway يشغّلها على خادم، واحصل على النتيجة في الدردشة.

  </Accordion>

  <Accordion title="هل يمكن أن يساعد OpenClaw في توليد العملاء المحتملين والتواصل والإعلانات والمدونات لمنتج SaaS؟">
    نعم، في **البحث والتأهيل والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات رسائل التواصل أو نصوص الإعلانات.

    بالنسبة إلى **التواصل أو تشغيل الإعلانات**، أبقِ إنسانًا ضمن الحلقة. تجنب الرسائل المزعجة، واتبع القوانين المحلية
    وسياسات المنصات، وراجع أي شيء قبل إرساله. النمط الأكثر أمانًا هو أن تترك
    OpenClaw يصوغ المسودة وأنت توافق عليها.

    المستندات: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما المزايا مقارنةً بـ Claude Code لتطوير الويب؟">
    OpenClaw هو **مساعد شخصي** وطبقة تنسيق، وليس بديلًا عن IDE. استخدم
    Claude Code أو Codex للحصول على أسرع حلقة ترميز مباشرة داخل مستودع. واستخدم OpenClaw عندما
    تريد ذاكرة دائمة، ووصولًا عبر الأجهزة، وتنسيقًا للأدوات.

    المزايا:

    - **ذاكرة ومساحة عمل دائمتان** عبر الجلسات
    - **وصول متعدد المنصات** (WhatsApp، Telegram، TUI، WebChat)
    - **تنسيق الأدوات** (المتصفح، الملفات، الجدولة، الخطافات)
    - **Gateway دائم التشغيل** (شغّله على VPS، وتفاعل معه من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/التنفيذ المحلي

    عرض توضيحي: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="كيف أخصص Skills من دون إبقاء المستودع متسخًا؟">
    استخدم التجاوزات المُدارة بدلًا من تعديل نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدًا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). ترتيب الأولوية هو `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمّنة → `skills.load.extraDirs`، لذلك تظل التجاوزات المُدارة لها الغلبة على Skills المضمّنة من دون لمس git. إذا كنت تحتاج إلى تثبيت Skill عالميًا لكن جعله مرئيًا لبعض الوكلاء فقط، فاحتفظ بالنسخة المشتركة في `~/.openclaw/skills` وتحكم في الظهور باستخدام `agents.defaults.skills` و`agents.list[].skills`. يجب أن تعيش التعديلات الجديرة بالرفع إلى المصدر فقط في المستودع وأن تخرج كطلبات PR.
  </Accordion>

  <Accordion title="هل يمكنني تحميل Skills من مجلد مخصص؟">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (أدنى أولوية). ترتيب الأولوية الافتراضي هو `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمّنة → `skills.load.extraDirs`. يثبّت `clawhub` في `./skills` افتراضيًا، ويتعامل OpenClaw مع ذلك كـ `<workspace>/skills` في الجلسة التالية. إذا كان يجب أن تكون Skill مرئية لوكلاء محددين فقط، فاقرن ذلك بـ `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="كيف يمكنني استخدام نماذج مختلفة لمهام مختلفة؟">
    الأنماط المدعومة اليوم هي:

    - **مهام Cron**: يمكن للمهام المعزولة تعيين تجاوز `model` لكل مهمة.
    - **الوكلاء الفرعيون**: وجّه المهام إلى وكلاء منفصلين لهم نماذج افتراضية مختلفة.
    - **التبديل عند الطلب**: استخدم `/model` لتبديل نموذج الجلسة الحالية في أي وقت.

    راجع [مهام Cron](/ar/automation/cron-jobs)، و[التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="يتجمد الروبوت أثناء تنفيذ عمل ثقيل. كيف أنقل ذلك إلى جهة أخرى؟">
    استخدم **الوكلاء الفرعيين** للمهام الطويلة أو المتوازية. تعمل الوكلاء الفرعيون في جلساتهم الخاصة،
    وتعيد ملخصًا، وتبقي محادثتك الرئيسية مستجيبة.

    اطلب من روبوتك "spawn a sub-agent for this task" أو استخدم `/subagents`.
    استخدم `/status` في المحادثة لمعرفة ما يفعله Gateway الآن (وما إذا كان مشغولًا).

    نصيحة الرموز: تستهلك المهام الطويلة والوكلاء الفرعيون الرموز. إذا كانت التكلفة مصدر قلق، فعيّن
    نموذجًا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="كيف تعمل جلسات الوكلاء الفرعيين المرتبطة بالخيط على Discord؟">
    استخدم روابط الخيوط. يمكنك ربط خيط Discord بوكيل فرعي أو هدف جلسة بحيث تبقى رسائل المتابعة في ذلك الخيط ضمن تلك الجلسة المرتبطة.

    التدفق الأساسي:

    - أنشئ باستخدام `sessions_spawn` مع `thread: true` (واختياريًا `mode: "session"` للمتابعة المستمرة).
    - أو اربط يدويًا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الربط.
    - استخدم `/session idle <duration|off>` و`/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل الخيط.

    الإعدادات المطلوبة:

    - الافتراضيات العامة: `session.threadBindings.enabled`، و`session.threadBindings.idleHours`، و`session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: `channels.discord.threadBindings.enabled`، و`channels.discord.threadBindings.idleHours`، و`channels.discord.threadBindings.maxAgeHours`.
    - الربط التلقائي عند الإنشاء: القيمة الافتراضية لـ `channels.discord.threadBindings.spawnSessions` هي `true`؛ عيّنها إلى `false` لتعطيل إنشاء الجلسات المرتبطة بالخيوط.

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع الإعدادات](/ar/gateway/configuration-reference)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="انتهى وكيل فرعي، لكن تحديث الاكتمال ذهب إلى المكان الخطأ أو لم يُنشر إطلاقًا. ما الذي يجب أن أتحقق منه؟">
    تحقق أولًا من مسار الطالب الذي تم حله:

    - يفضّل تسليم الوكيل الفرعي في وضع الاكتمال أي خيط مرتبط أو مسار محادثة عند وجوده.
    - إذا كان أصل الاكتمال يحمل قناة فقط، يعود OpenClaw إلى المسار المخزن لجلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) حتى يظل التسليم المباشر قادرًا على النجاح.
    - إذا لم يوجد مسار مرتبط ولا مسار مخزن قابل للاستخدام، فقد يفشل التسليم المباشر ويعود الناتج إلى تسليم الجلسة في قائمة الانتظار بدلًا من النشر فورًا في المحادثة.
    - يمكن للأهداف غير الصالحة أو القديمة أن تظل قادرة على فرض الرجوع إلى قائمة الانتظار أو فشل التسليم النهائي.
    - إذا كانت آخر رسالة مرئية من المساعد للابن هي الرمز الصامت الدقيق `NO_REPLY` / `no_reply`، أو بالضبط `ANNOUNCE_SKIP`، فإن OpenClaw يكتم الإعلان عمدًا بدلًا من نشر تقدم سابق قديم.
    - إذا انتهت مهلة الابن بعد استدعاءات أدوات فقط، فقد يختزل الإعلان ذلك إلى ملخص قصير للتقدم الجزئي بدلًا من إعادة تشغيل خرج الأدوات الخام.

    التصحيح:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="لا تعمل Cron أو التذكيرات. ما الذي يجب أن أتحقق منه؟">
    تعمل Cron داخل عملية Gateway. إذا لم يكن Gateway يعمل باستمرار،
    فلن تعمل المهام المجدولة.

    قائمة التحقق:

    - تأكد من تفعيل cron (`cron.enabled`) وأن `OPENCLAW_SKIP_CRON` غير معيّن.
    - تحقق من أن Gateway يعمل على مدار الساعة طوال الأسبوع (من دون سكون/إعادة تشغيل).
    - تحقق من إعدادات المنطقة الزمنية للمهمة (`--tz` مقابل المنطقة الزمنية للمضيف).

    التصحيح:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="تم تشغيل Cron، لكن لم يُرسل أي شيء إلى القناة. لماذا؟">
    تحقّق من وضع التسليم أولاً:

    - يعني `--no-deliver` / `delivery.mode: "none"` أنه لا يُتوقع إرسال احتياطي من المشغّل.
    - يعني هدف الإعلان المفقود أو غير الصالح (`channel` / `to`) أن المشغّل تخطّى التسليم الصادر.
    - تعني إخفاقات مصادقة القناة (`unauthorized`، `Forbidden`) أن المشغّل حاول التسليم لكن بيانات الاعتماد منعته.
    - تُعامل النتيجة المعزولة الصامتة (`NO_REPLY` / `no_reply` فقط) على أنها غير قابلة للتسليم عمداً، لذلك يمنع المشغّل أيضاً التسليم الاحتياطي في قائمة الانتظار.

    بالنسبة إلى مهام cron المعزولة، لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message`
    عندما يكون مسار الدردشة متاحاً. يتحكم `--announce` فقط في مسار المشغّل
    الاحتياطي للنص النهائي الذي لم يرسله الوكيل مسبقاً.

    تصحيح الأخطاء:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [مهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="لماذا بدّل تشغيل cron معزول النماذج أو أعاد المحاولة مرة واحدة؟">
    يكون ذلك عادةً مسار تبديل النموذج المباشر، وليس جدولة مكررة.

    يمكن لـ cron المعزول حفظ تسليم نموذج وقت التشغيل وإعادة المحاولة عندما يطرح التشغيل
    النشط `LiveSessionModelSwitchError`. تحتفظ إعادة المحاولة بالمزوّد/النموذج
    الذي تم التبديل إليه، وإذا حمل التبديل تجاوزاً جديداً لملف تعريف المصادقة، فإن cron
    يحفظ ذلك أيضاً قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يتقدم تجاوز نموذج خطاف Gmail أولاً عندما ينطبق.
    - ثم `model` لكل مهمة.
    - ثم أي تجاوز محفوظ لنموذج جلسة cron.
    - ثم اختيار النموذج العادي للوكيل/الافتراضي.

    حلقة إعادة المحاولة محدودة. بعد المحاولة الأولية بالإضافة إلى محاولتي إعادة لتبديل النموذج،
    يُجهض cron بدلاً من التكرار إلى الأبد.

    تصحيح الأخطاء:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [cron CLI](/ar/cli/cron).

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
    داخل مساحة العمل النشطة. ثبّت CLI المنفصل `clawhub` فقط إذا كنت تريد نشر
    أو مزامنة Skills الخاصة بك. للتثبيتات المشتركة بين الوكلاء، ضع Skill تحت
    `~/.openclaw/skills` واستخدم `agents.defaults.skills` أو
    `agents.list[].skills` إذا كنت تريد تضييق نطاق الوكلاء الذين يمكنهم رؤيتها.

  </Accordion>

  <Accordion title="هل يستطيع OpenClaw تشغيل المهام وفق جدول أو باستمرار في الخلفية؟">
    نعم. استخدم مجدول Gateway:

    - **مهام Cron** للمهام المجدولة أو المتكررة (تستمر عبر عمليات إعادة التشغيل).
    - **Heartbeat** للفحوصات الدورية في "الجلسة الرئيسية".
    - **المهام المعزولة** للوكلاء المستقلين الذين ينشرون الملخصات أو يسلّمون إلى الدردشات.

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills خاصة بـ Apple macOS فقط من Linux؟">
    ليس مباشرة. تُقيّد Skills الخاصة بـ macOS عبر `metadata.openclaw.os` بالإضافة إلى الملفات الثنائية المطلوبة، ولا تظهر Skills في موجّه النظام إلا عندما تكون مؤهلة على **مضيف Gateway**. على Linux، لن تُحمّل Skills الخاصة بـ `darwin` فقط (مثل `apple-notes`، `apple-reminders`، `things-mac`) إلا إذا تجاوزت التقييد.

    لديك ثلاثة أنماط مدعومة:

    **الخيار أ - شغّل Gateway على Mac (الأبسط).**
    شغّل Gateway حيث توجد ملفات macOS الثنائية، ثم اتصل من Linux في [الوضع البعيد](#gateway-ports-already-running-and-remote-mode) أو عبر Tailscale. تُحمّل Skills بشكل طبيعي لأن مضيف Gateway هو macOS.

    **الخيار ب - استخدم عقدة macOS (بدون SSH).**
    شغّل Gateway على Linux، واقرن عقدة macOS (تطبيق شريط القوائم)، واضبط **أوامر تشغيل Node** على "اسأل دائماً" أو "اسمح دائماً" على Mac. يستطيع OpenClaw التعامل مع Skills الخاصة بـ macOS فقط على أنها مؤهلة عندما تكون الملفات الثنائية المطلوبة موجودة على العقدة. يشغّل الوكيل تلك Skills عبر أداة `nodes`. إذا اخترت "اسأل دائماً"، فإن الموافقة على "اسمح دائماً" في الموجّه تضيف ذلك الأمر إلى قائمة السماح.

    **الخيار ج - مرّر ملفات macOS الثنائية عبر SSH (متقدم).**
    أبقِ Gateway على Linux، لكن اجعل ملفات CLI الثنائية المطلوبة تُحل إلى أغلفة SSH تعمل على Mac. ثم تجاوز Skill للسماح بـ Linux حتى تبقى مؤهلة.

    1. أنشئ غلاف SSH للملف الثنائي (مثال: `memo` لملاحظات Apple):

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
    ليس مدمجاً حالياً.

    الخيارات:

    - **Skill / Plugin مخصص:** الأفضل للوصول الموثوق إلى API (لدى Notion/HeyGen واجهات API).
    - **أتمتة المتصفح:** تعمل دون كود لكنها أبطأ وأكثر هشاشة.

    إذا كنت تريد الحفاظ على السياق لكل عميل (سير عمل الوكالات)، فالنمط البسيط هو:

    - صفحة Notion واحدة لكل عميل (السياق + التفضيلات + العمل النشط).
    - اطلب من الوكيل جلب تلك الصفحة في بداية الجلسة.

    إذا كنت تريد تكاملاً أصلياً، افتح طلب ميزة أو أنشئ Skill
    تستهدف واجهات API تلك.

    تثبيت Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تصل التثبيتات الأصلية إلى دليل `skills/` داخل مساحة العمل النشطة. بالنسبة إلى Skills المشتركة بين الوكلاء، ضعها في `~/.openclaw/skills/<name>/SKILL.md`. إذا كان ينبغي لبعض الوكلاء فقط رؤية تثبيت مشترك، فاضبط `agents.defaults.skills` أو `agents.list[].skills`. تتوقع بعض Skills ملفات ثنائية مثبتة عبر Homebrew؛ على Linux يعني ذلك Linuxbrew (راجع إدخال أسئلة Homebrew الشائعة على Linux أعلاه). راجع [Skills](/ar/tools/skills)، [إعدادات Skills](/ar/tools/skills-config)، و[ClawHub](/ar/tools/clawhub).

  </Accordion>

  <Accordion title="كيف أستخدم Chrome الحالي المسجّل دخوله مع OpenClaw؟">
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

    يمكن لهذا المسار استخدام متصفح المضيف المحلي أو عقدة متصفح متصلة. إذا كان Gateway يعمل في مكان آخر، فإما شغّل مضيف عقدة على جهاز المتصفح أو استخدم CDP بعيداً بدلاً من ذلك.

    الحدود الحالية على `existing-session` / `user`:

    - الإجراءات مدفوعة بـ ref، وليست مدفوعة بمحددات CSS
    - تتطلب عمليات الرفع `ref` / `inputRef` وتدعم حالياً ملفاً واحداً في كل مرة
    - لا تزال `responsebody`، وتصدير PDF، واعتراض التنزيل، وإجراءات الدُفعات تحتاج إلى متصفح مُدار أو ملف تعريف CDP خام

  </Accordion>
</AccordionGroup>

## العزل والذاكرة

<AccordionGroup>
  <Accordion title="هل توجد وثيقة مخصصة للعزل؟">
    نعم. راجع [العزل](/ar/gateway/sandboxing). للإعداد الخاص بـ Docker (Gateway كامل في Docker أو صور العزل)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدوداً - كيف أفعّل الميزات الكاملة؟">
    الصورة الافتراضية تعطي الأولوية للأمان وتعمل كمستخدم `node`، لذلك لا
    تتضمن حزم النظام أو Homebrew أو المتصفحات المضمّنة. لإعداد أكمل:

    - احتفظ بـ `/home/node` باستخدام `OPENCLAW_HOME_VOLUME` حتى تبقى الذاكرات المؤقتة.
    - أضف تبعيات النظام إلى الصورة باستخدام `OPENCLAW_DOCKER_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المضمّن:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - اضبط `PLAYWRIGHT_BROWSERS_PATH` وتأكد من استمرار المسار.

    الوثائق: [Docker](/ar/install/docker)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل المباشرة شخصية وجعل المجموعات عامة/معزولة مع وكيل واحد؟">
    نعم - إذا كانت حركة المرور الخاصة بك هي **رسائل مباشرة** وحركة المرور العامة هي **مجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` حتى تعمل جلسات المجموعات/القنوات (المفاتيح غير الرئيسية) في خلفية العزل المهيأة، بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال إعدادات: [المجموعات: رسائل مباشرة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع الإعدادات الأساسي: [إعدادات Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلد مضيف داخل العزل؟">
    اضبط `agents.defaults.sandbox.docker.binds` على `["host:path:mode"]` (مثلاً `"/home/user/src:/src:ro"`). تُدمج عمليات الربط العامة ولكل وكيل؛ ويتم تجاهل عمليات الربط لكل وكيل عندما يكون `scope: "shared"`. استخدم `:ro` لأي شيء حساس وتذكّر أن عمليات الربط تتجاوز جدران نظام ملفات العزل.

    يتحقق OpenClaw من مصادر الربط مقابل كل من المسار المطبّع والمسار القانوني المحلول عبر أعمق سلف موجود. هذا يعني أن عمليات الهروب عبر أصل رابط رمزي لا تزال تفشل بإغلاق حتى عندما لا يكون مقطع المسار الأخير موجوداً بعد، ولا تزال فحوصات الجذر المسموح تنطبق بعد حل الرابط الرمزي.

    راجع [العزل](/ar/gateway/sandboxing#custom-bind-mounts) و[العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للأمثلة وملاحظات السلامة.

  </Accordion>

  <Accordion title="كيف تعمل الذاكرة؟">
    ذاكرة OpenClaw هي مجرد ملفات Markdown في مساحة عمل الوكيل:

    - ملاحظات يومية في `memory/YYYY-MM-DD.md`
    - ملاحظات طويلة الأمد مُنتقاة في `MEMORY.md` (الجلسات الرئيسية/الخاصة فقط)

    يشغّل OpenClaw أيضاً **تفريغ ذاكرة صامت قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction التلقائي. يعمل هذا فقط عندما تكون مساحة العمل
    قابلة للكتابة (تتخطاه بيئات العزل للقراءة فقط). راجع [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="الذاكرة تستمر في نسيان الأشياء. كيف أجعلها تبقى؟">
    اطلب من البوت **كتابة الحقيقة إلى الذاكرة**. تنتمي الملاحظات طويلة الأمد إلى `MEMORY.md`،
    وينتقل السياق قصير الأمد إلى `memory/YYYY-MM-DD.md`.

    لا يزال هذا مجالاً نعمل على تحسينه. من المفيد تذكير النموذج بتخزين الذكريات؛
    سيعرف ما يجب فعله. إذا استمر في النسيان، فتحقق من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تبقى الذاكرة إلى الأبد؟ ما الحدود؟">
    تعيش ملفات الذاكرة على القرص وتستمر حتى تحذفها. الحد هو
    مساحة التخزين لديك، وليس النموذج. لا يزال **سياق الجلسة** محدوداً بنافذة
    سياق النموذج، لذلك يمكن للمحادثات الطويلة أن تُدمج أو تُقتطع. لهذا السبب
    يوجد بحث الذاكرة - فهو يعيد فقط الأجزاء ذات الصلة إلى السياق.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب البحث الدلالي في الذاكرة مفتاح OpenAI API؟">
    فقط إذا كنت تستخدم **تضمينات OpenAI**. يغطي Codex OAuth المحادثة/الإكمالات ولا
    يمنح وصولاً إلى التضمينات، لذلك فإن **تسجيل الدخول باستخدام Codex (OAuth أو
    تسجيل دخول Codex CLI)** لا يساعد في البحث الدلالي في الذاكرة. ما تزال تضمينات OpenAI
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تضبط موفراً صراحةً، يحدد OpenClaw موفراً تلقائياً عندما يتمكن من
    حل مفتاح API (ملفات تعريف المصادقة، أو `models.providers.*.apiKey`، أو متغيرات البيئة).
    يفضل OpenAI إذا تم حل مفتاح OpenAI، وإلا Gemini إذا تم حل مفتاح Gemini،
    ثم Voyage، ثم Mistral. إذا لم يتوفر مفتاح بعيد، يبقى البحث في الذاكرة
    معطلاً حتى تقوم بتكوينه. إذا كان لديك مسار نموذج محلي
    مكوّن وموجود، يفضل OpenClaw
    `local`. يُدعم Ollama عندما تضبط صراحةً
    `memorySearch.provider = "ollama"`.

    إذا كنت تفضل البقاء محلياً، فاضبط `memorySearch.provider = "local"` (واختيارياً
    `memorySearch.fallback = "none"`). إذا أردت تضمينات Gemini، فاضبط
    `memorySearch.provider = "gemini"` ووفر `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). ندعم نماذج تضمين **OpenAI أو Gemini أو Voyage أو Mistral أو Ollama أو المحلي**
    - راجع [الذاكرة](/ar/concepts/memory) لمعرفة تفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## أين توجد الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل تُحفظ كل البيانات المستخدمة مع OpenClaw محلياً؟">
    لا - **حالة OpenClaw محلية**، لكن **الخدمات الخارجية ما تزال ترى ما ترسله إليها**.

    - **محلي افتراضياً:** تعيش الجلسات وملفات الذاكرة والتكوين ومساحة العمل على مضيف Gateway
      (`~/.openclaw` + دليل مساحة عملك).
    - **بعيد بحكم الضرورة:** الرسائل التي ترسلها إلى موفري النماذج (Anthropic/OpenAI/etc.) تذهب إلى
      واجهات API الخاصة بهم، ومنصات المحادثة (WhatsApp/Telegram/Slack/etc.) تخزن بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في الأثر:** استخدام النماذج المحلية يبقي المطالبات على جهازك، لكن حركة مرور القنوات
      ما تزال تمر عبر خوادم القناة.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    يوجد كل شيء ضمن `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | المسار                                                          | الغرض                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | التكوين الرئيسي (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | استيراد OAuth القديم (يُنسخ إلى ملفات تعريف المصادقة عند أول استخدام) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات تعريف المصادقة (OAuth، ومفاتيح API، و`keyRef`/`tokenRef` اختيارياً) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | حمولة أسرار اختيارية مدعومة بالملفات لموفري SecretRef من نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ملف توافق قديم (تُزال إدخالات `api_key` الثابتة)                  |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | حالة الموفر (مثلاً `whatsapp/<accountId>/creds.json`)             |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | حالة لكل وكيل (agentDir + الجلسات)                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | سجل المحادثات والحالة (لكل وكيل)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | بيانات الجلسة الوصفية (لكل وكيل)                                  |

    مسار الوكيل الواحد القديم: `~/.openclaw/agent/*` (يُرحّل بواسطة `openclaw doctor`).

    **مساحة عملك** (AGENTS.md، وملفات الذاكرة، وSkills، وما إلى ذلك) منفصلة وتُكوّن عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    توجد هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: `AGENTS.md`، و`SOUL.md`، و`IDENTITY.md`، و`USER.md`،
      و`MEMORY.md`، و`memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` اختياري.
      ملف الجذر بالحروف الصغيرة `memory.md` هو إدخال إصلاح قديم فقط؛ يمكن لـ `openclaw doctor --fix`
      دمجه في `MEMORY.md` عندما يكون كلا الملفين موجودين.
    - **دليل الحالة (`~/.openclaw`)**: التكوين، وحالة القناة/الموفر، وملفات تعريف المصادقة، والجلسات، والسجلات،
      وSkills المشتركة (`~/.openclaw/skills`).

    مساحة العمل الافتراضية هي `~/.openclaw/workspace`، ويمكن تكوينها عبر:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    إذا كان الروبوت "ينسى" بعد إعادة التشغيل، فتأكد من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل (وتذكر: يستخدم الوضع البعيد **مساحة عمل مضيف gateway**
    وليس حاسوبك المحمول المحلي).

    نصيحة: إذا أردت سلوكاً أو تفضيلاً دائماً، فاطلب من الروبوت **كتابته في
    AGENTS.md أو MEMORY.md** بدلاً من الاعتماد على سجل المحادثة.

    راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) و[الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="استراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** في مستودع git **خاص** وانسخها احتياطياً في مكان
    خاص (مثل GitHub خاص). هذا يلتقط ملفات الذاكرة وAGENTS/SOUL/USER،
    ويتيح لك استعادة "عقل" المساعد لاحقاً.

    لا تقم **بتثبيت** أي شيء ضمن `~/.openclaw` (بيانات الاعتماد، أو الجلسات، أو الرموز، أو حمولات الأسرار المشفرة).
    إذا كنت تحتاج إلى استعادة كاملة، فانسخ كلاً من مساحة العمل ودليل الحالة
    احتياطياً بشكل منفصل (راجع سؤال الترحيل أعلاه).

    المستندات: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف أزيل OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إلغاء التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. مساحة العمل هي **cwd الافتراضي** ومرساة الذاكرة، وليست صندوق عزل صارماً.
    تُحل المسارات النسبية داخل مساحة العمل، لكن المسارات المطلقة يمكنها الوصول إلى مواقع
    مضيف أخرى ما لم يكن العزل مفعلاً. إذا كنت تحتاج إلى العزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات العزل لكل وكيل. إذا كنت
    تريد أن يكون مستودع ما هو دليل العمل الافتراضي، فاجعل `workspace`
    لذلك الوكيل يشير إلى جذر المستودع. مستودع OpenClaw هو مجرد شيفرة مصدرية؛ أبقِ
    مساحة العمل منفصلة ما لم تكن تريد عمداً أن يعمل الوكيل داخلها.

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

## أساسيات التكوين

<AccordionGroup>
  <Accordion title="ما صيغة التكوين؟ وأين يوجد؟">
    يقرأ OpenClaw تكوين **JSON5** اختيارياً من `$OPENCLAW_CONFIG_PATH` (الافتراضي: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    إذا كان الملف مفقوداً، فإنه يستخدم إعدادات افتراضية آمنة إلى حد ما (بما في ذلك مساحة عمل افتراضية هي `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='ضبطت gateway.bind: "lan" (أو "tailnet") والآن لا يوجد شيء يستمع / تقول الواجهة إن الوصول غير مصرح'>
    تتطلب الارتباطات غير المعتمدة على local loopback **مسار مصادقة Gateway صالحاً**. عملياً يعني ذلك:

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

    - `gateway.remote.token` / `.password` لا يفعّلان مصادقة Gateway المحلية بمفردهما.
    - يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كخطة احتياطية فقط عندما لا يكون `gateway.auth.*` مضبوطاً.
    - لمصادقة كلمة المرور، اضبط `gateway.auth.mode: "password"` مع `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`) بدلاً من ذلك.
    - إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يتم حله، يفشل الحل بشكل مغلق (بلا إخفاء بواسطة المسار الاحتياطي البعيد).
    - تتوثق إعدادات Control UI ذات السر المشترك عبر `connect.params.auth.token` أو `connect.params.auth.password` (المخزنة في إعدادات التطبيق/الواجهة). تستخدم الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy` ترويسات الطلب بدلاً من ذلك. تجنب وضع الأسرار المشتركة في عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، تتطلب وكلاء local loopback العكسية على المضيف نفسه `gateway.auth.trustedProxy.allowLoopback = true` صريحاً وإدخال loopback في `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="لماذا أحتاج إلى رمز على localhost الآن؟">
    يفرض OpenClaw مصادقة Gateway افتراضياً، بما في ذلك loopback. في المسار الافتراضي العادي يعني ذلك مصادقة الرمز: إذا لم يتم تكوين مسار مصادقة صريح، يتحول بدء تشغيل gateway إلى وضع الرمز وينشئ واحداً تلقائياً ويحفظه في `gateway.auth.token`، لذلك **يجب على عملاء WS المحليين المصادقة**. هذا يمنع العمليات المحلية الأخرى من استدعاء Gateway.

    إذا كنت تفضل مسار مصادقة مختلفاً، فيمكنك اختيار وضع كلمة المرور صراحةً (أو، للوكلاء العكسيين المدركين للهوية، `trusted-proxy`). إذا كنت **تريد حقاً** فتح loopback، فاضبط `gateway.auth.mode: "none"` صراحةً في تكوينك. يستطيع Doctor إنشاء رمز لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب أن أعيد التشغيل بعد تغيير التكوين؟">
    يراقب Gateway التكوين ويدعم إعادة التحميل الساخنة:

    - `gateway.reload.mode: "hybrid"` (الافتراضي): يطبق التغييرات الآمنة بشكل ساخن، ويعيد التشغيل للتغييرات الحرجة
    - `hot`، و`restart`، و`off` مدعومة أيضاً

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

    - `off`: يخفي نص العبارة لكنه يبقي سطر عنوان/إصدار الشعار.
    - `default`: يستخدم `All your chats, one OpenClaw.` في كل مرة.
    - `random`: عبارات طريفة/موسمية متناوبة (السلوك الافتراضي).
    - إذا كنت لا تريد أي شعار إطلاقاً، فاضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="كيف أفعّل البحث في الويب (وجلب الويب)؟">
    يعمل `web_fetch` دون مفتاح API. يعتمد `web_search` على الموفر المحدد لديك:

    - يتطلب الموفرون المدعومون بواجهات API مثل Brave وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وPerplexity وTavily إعداد مفتاح API المعتاد الخاص بهم.
    - بحث Ollama على الويب لا يحتاج إلى مفتاح، لكنه يستخدم مضيف Ollama المكوّن لديك ويتطلب `ollama signin`.
    - DuckDuckGo لا يحتاج إلى مفتاح، لكنه تكامل غير رسمي مبني على HTML.
    - SearXNG لا يحتاج إلى مفتاح/مستضاف ذاتياً؛ كوّن `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

    **موصى به:** شغّل `openclaw configure --section web` واختر موفراً.
    بدائل البيئة:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` أو `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`، أو `MINIMAX_CODING_API_KEY`، أو `MINIMAX_API_KEY`
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

    أصبح إعداد بحث الويب الخاص بكل مزود موجودا الآن ضمن `plugins.entries.<plugin>.config.webSearch.*`.
    لا تزال مسارات المزود القديمة `tools.web.search.*` تحمل مؤقتا للتوافق، لكنها يجب ألا تستخدم للإعدادات الجديدة.
    يوجد إعداد بديل جلب الويب الخاص بـ Firecrawl ضمن `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم السماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - يكون `web_fetch` مفعلا افتراضيا (ما لم يعطل صراحة).
    - إذا حذف `tools.web.fetch.provider`، يكتشف OpenClaw تلقائيا أول مزود بديل جاهز للجلب من بيانات الاعتماد المتاحة. المزود المضمن حاليا هو Firecrawl.
    - تقرأ العمليات الخفية متغيرات البيئة من `~/.openclaw/.env` (أو من بيئة الخدمة).

    الوثائق: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="مسح config.apply إعدادي. كيف أستعيده وأتجنب ذلك؟">
    يستبدل `config.apply` **الإعداد بالكامل**. إذا أرسلت كائنا جزئيا، فسيزال كل
    ما عداه.

    يحمي OpenClaw الحالي من كثير من عمليات المسح العرضية:

    - تتحقق عمليات كتابة الإعدادات المملوكة لـ OpenClaw من الإعداد الكامل بعد التغيير قبل الكتابة.
    - ترفض عمليات الكتابة غير الصالحة أو المدمرة المملوكة لـ OpenClaw وتحفظ باسم `openclaw.json.rejected.*`.
    - إذا تسبب تعديل مباشر في كسر بدء التشغيل أو إعادة التحميل الساخنة، يستعيد Gateway آخر إعداد معروف بأنه سليم ويحفظ الملف المرفوض باسم `openclaw.json.clobbered.*`.
    - يتلقى الوكيل الرئيسي تحذيرا عند الإقلاع بعد الاسترداد حتى لا يكتب الإعداد السيئ مجددا بلا تمييز.

    الاسترداد:

    - تحقق من `openclaw logs --follow` بحثا عن `Config auto-restored from last-known-good` أو `Config write rejected:` أو `config reload restored last-known-good config`.
    - افحص أحدث `openclaw.json.clobbered.*` أو `openclaw.json.rejected.*` بجانب الإعداد النشط.
    - أبق الإعداد النشط المستعاد إذا كان يعمل، ثم انسخ المفاتيح المقصودة فقط مرة أخرى باستخدام `openclaw config set` أو `config.patch`.
    - شغل `openclaw config validate` و`openclaw doctor`.
    - إذا لم يكن لديك آخر إعداد معروف بأنه سليم أو حمولة مرفوضة، فاستعد من نسخة احتياطية، أو أعد تشغيل `openclaw doctor` وأعد إعداد القنوات/النماذج.
    - إذا كان هذا غير متوقع، فافتح بلاغ خطأ وأرفق آخر إعداد معروف لديك أو أي نسخة احتياطية.
    - يستطيع وكيل برمجة محلي غالبا إعادة بناء إعداد عامل من السجلات أو السجل التاريخي.

    تجنبه:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` للتعديلات التفاعلية.
    - استخدم `config.schema.lookup` أولا عندما لا تكون متأكدا من مسار دقيق أو شكل حقل؛ فهو يعيد عقدة مخطط سطحية مع ملخصات فورية للأبناء للتنقل التفصيلي.
    - استخدم `config.patch` لتعديلات RPC الجزئية؛ واحتفظ بـ `config.apply` لاستبدال الإعداد الكامل فقط.
    - إذا كنت تستخدم أداة `gateway` الخاصة بالمالك فقط من تشغيل وكيل، فستظل ترفض الكتابة إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك الأسماء المستعارة القديمة `tools.bash.*` التي تطبع إلى مسارات التنفيذ المحمية نفسها).

    الوثائق: [الإعداد](/ar/cli/config)، [التهيئة](/ar/cli/configure)، [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغل Gateway مركزيا مع عمال متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحد** (مثل Raspberry Pi) مع **Nodes** و**وكلاء**:

    - **Gateway (مركزي):** يملك القنوات (Signal/WhatsApp)، والتوجيه، والجلسات.
    - **Nodes (الأجهزة):** تتصل أجهزة Mac/iOS/Android كأطراف وتعرض أدوات محلية (`system.run`، `canvas`، `camera`).
    - **الوكلاء (العمال):** عقول/مساحات عمل منفصلة للأدوار الخاصة (مثل "عمليات Hetzner"، "البيانات الشخصية").
    - **الوكلاء الفرعيون:** يشغلون عملا في الخلفية من وكيل رئيسي عندما تريد التوازي.
    - **TUI:** اتصل بـ Gateway وبدل بين الوكلاء/الجلسات.

    الوثائق: [Nodes](/ar/nodes)، [الوصول عن بعد](/ar/gateway/remote)، [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/ar/web/tui).

  </Accordion>

  <Accordion title="هل يمكن تشغيل متصفح OpenClaw دون واجهة؟">
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

    الافتراضي هو `false` (بواجهة مرئية). يزيد الوضع دون واجهة احتمال تشغيل فحوص مكافحة البوتات في بعض المواقع. راجع [المتصفح](/ar/tools/browser).

    يستخدم الوضع دون واجهة **محرك Chromium نفسه** ويعمل لمعظم الأتمتة (النماذج، النقرات، الاستخلاص، تسجيلات الدخول). الاختلافات الرئيسية:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات الشاشة إذا كنت تحتاج إلى مرئيات).
    - بعض المواقع أكثر صرامة بشأن الأتمتة في الوضع دون واجهة (CAPTCHA، مكافحة البوتات).
      على سبيل المثال، يحظر X/Twitter غالبا الجلسات دون واجهة.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    اضبط `browser.executablePath` على ملف Brave التنفيذي لديك (أو أي متصفح قائم على Chromium) وأعد تشغيل Gateway.
    راجع أمثلة الإعداد الكاملة في [المتصفح](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways وNodes البعيدة

<AccordionGroup>
  <Accordion title="كيف تنتقل الأوامر بين Telegram وGateway وNodes؟">
    تتولى **Gateway** معالجة رسائل Telegram. تشغل Gateway الوكيل، و
    بعد ذلك فقط تستدعي Nodes عبر **Gateway WebSocket** عندما تكون أداة Node مطلوبة:

    Telegram → Gateway → الوكيل → `node.*` → Node → Gateway → Telegram

    لا ترى Nodes حركة مرور المزود الواردة؛ فهي تتلقى فقط استدعاءات RPC الخاصة بـ Node.

  </Accordion>

  <Accordion title="كيف يمكن لوكيلي الوصول إلى حاسوبي إذا كانت Gateway مستضافة عن بعد؟">
    الإجابة المختصرة: **اقرن حاسوبك كـ Node**. تعمل Gateway في مكان آخر، لكنها تستطيع
    استدعاء أدوات `node.*` (الشاشة، الكاميرا، النظام) على جهازك المحلي عبر Gateway WebSocket.

    الإعداد المعتاد:

    1. شغل Gateway على المضيف دائم التشغيل (VPS/خادم منزلي).
    2. ضع مضيف Gateway وحاسوبك على tailnet نفسه.
    3. تأكد من إمكانية الوصول إلى Gateway WS (ربط tailnet أو نفق SSH).
    4. افتح تطبيق macOS محليا واتصل في وضع **عن بعد عبر SSH** (أو tailnet مباشر)
       حتى يستطيع التسجيل كـ Node.
    5. وافق على Node في Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا يلزم جسر TCP منفصل؛ تتصل Nodes عبر Gateway WebSocket.

    تذكير أمني: يسمح إقران Node على macOS بتشغيل `system.run` على ذلك الجهاز. لا
    تقرن إلا الأجهزة التي تثق بها، وراجع [الأمان](/ar/gateway/security).

    الوثائق: [Nodes](/ar/nodes)، [بروتوكول Gateway](/ar/gateway/protocol)، [وضع macOS البعيد](/ar/platforms/mac/remote)، [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل لكنني لا أحصل على ردود. ماذا الآن؟">
    تحقق من الأساسيات:

    - Gateway قيد التشغيل: `openclaw gateway status`
    - صحة Gateway: `openclaw status`
    - صحة القناة: `openclaw channels status`

    ثم تحقق من المصادقة والتوجيه:

    - إذا كنت تستخدم Tailscale Serve، فتأكد من ضبط `gateway.auth.allowTailscale` بشكل صحيح.
    - إذا كنت تتصل عبر نفق SSH، فتأكد من أن النفق المحلي يعمل ويشير إلى المنفذ الصحيح.
    - تأكد من أن قوائم السماح لديك (رسالة مباشرة أو مجموعة) تتضمن حسابك.

    الوثائق: [Tailscale](/ar/gateway/tailscale)، [الوصول عن بعد](/ar/gateway/remote)، [القنوات](/ar/channels).

  </Accordion>

  <Accordion title="هل يمكن لمثيلي OpenClaw التحدث إلى بعضهما (محلي + VPS)؟">
    نعم. لا يوجد جسر "بوت إلى بوت" مدمج، لكن يمكنك توصيله بعدة
    طرق موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يستطيع كلا البوتين الوصول إليها (Telegram/Slack/WhatsApp).
    اجعل البوت A يرسل رسالة إلى البوت B، ثم دع البوت B يرد كالمعتاد.

    **جسر CLI (عام):** شغل سكربتا يستدعي Gateway الأخرى باستخدام
    `openclaw agent --message ... --deliver`، مستهدفا دردشة يستمع فيها البوت الآخر.
    إذا كان أحد البوتين على VPS بعيد، فوجه CLI لديك إلى تلك Gateway البعيدة
    عبر SSH/Tailscale (راجع [الوصول عن بعد](/ar/gateway/remote)).

    نمط مثال (يشغل من جهاز يستطيع الوصول إلى Gateway المستهدفة):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف حاجزا وقائيا حتى لا يدخل البوتان في حلقة لا نهائية (بالذكر فقط، أو
    قوائم سماح القنوات، أو قاعدة "لا ترد على رسائل البوتات").

    الوثائق: [الوصول عن بعد](/ar/gateway/remote)، [CLI الوكيل](/ar/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى أجهزة VPS منفصلة لعدة وكلاء؟">
    لا. يمكن لـ Gateway واحد استضافة عدة وكلاء، لكل منهم مساحة عمله، وافتراضات نموذجه،
    وتوجيهه. هذا هو الإعداد الطبيعي وهو أرخص وأبسط بكثير من تشغيل
    VPS واحد لكل وكيل.

    استخدم أجهزة VPS منفصلة فقط عندما تحتاج إلى عزل صارم (حدود أمنية) أو
    إعدادات مختلفة جدا لا تريد مشاركتها. خلاف ذلك، أبق Gateway واحدا و
    استخدم عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل توجد فائدة من استخدام Node على حاسوبي المحمول الشخصي بدلا من SSH من VPS؟">
    نعم - Nodes هي الطريقة الأولى للوصول إلى حاسوبك المحمول من Gateway بعيدة، وهي
    تفتح إمكانات تتجاوز الوصول إلى الصدفة. تعمل Gateway على macOS/Linux (وWindows عبر WSL2) وهي
    خفيفة الوزن (يكفي VPS صغير أو صندوق بمستوى Raspberry Pi؛ وذاكرة 4 GB كافية)، لذا فإن الإعداد الشائع
    هو مضيف دائم التشغيل مع حاسوبك المحمول كـ Node.

    - **لا حاجة إلى SSH وارد.** تتصل Nodes إلى الخارج بـ Gateway WebSocket وتستخدم إقران الأجهزة.
    - **ضوابط تنفيذ أكثر أمانا.** يخضع `system.run` لقوائم السماح/الموافقات الخاصة بـ Node على ذلك الحاسوب المحمول.
    - **أدوات أجهزة أكثر.** تعرض Nodes `canvas` و`camera` و`screen` بالإضافة إلى `system.run`.
    - **أتمتة المتصفح المحلي.** أبق Gateway على VPS، لكن شغل Chrome محليا من خلال مضيف Node على الحاسوب المحمول، أو اتصل بـ Chrome المحلي على المضيف عبر Chrome MCP.

    SSH مناسب للوصول المؤقت إلى الصدفة، لكن Nodes أبسط لتدفقات عمل الوكلاء المستمرة و
    أتمتة الأجهزة.

    الوثائق: [Nodes](/ar/nodes)، [CLI الخاص بـ Nodes](/ar/cli/nodes)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تشغل Nodes خدمة Gateway؟">
    لا. يجب تشغيل **Gateway واحدة** فقط لكل مضيف إلا إذا كنت تشغل ملفات تعريف معزولة عمدا (راجع [Gateways متعددة](/ar/gateway/multiple-gateways)). Nodes هي أطراف تتصل
    بـ Gateway (Nodes على iOS/Android، أو "وضع Node" في تطبيق شريط القوائم على macOS). لمضيفي Node
    دون واجهة والتحكم عبر CLI، راجع [CLI مضيف Node](/ar/cli/node).

    يلزم إعادة تشغيل كاملة لتغييرات `gateway` و`discovery` و`canvasHost`.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق الإعداد؟">
    نعم.

    - `config.schema.lookup`: افحص فرعا فرعيا واحدا من الإعداد مع عقدة المخطط السطحية، وتلميح UI المطابق، وملخصات الأبناء الفورية قبل الكتابة
    - `config.get`: اجلب اللقطة الحالية + التجزئة
    - `config.patch`: تحديث جزئي آمن (مفضل لمعظم تعديلات RPC)؛ يعيد التحميل ساخنا عند الإمكان ويعيد التشغيل عند اللزوم
    - `config.apply`: يتحقق + يستبدل الإعداد الكامل؛ يعيد التحميل ساخنا عند الإمكان ويعيد التشغيل عند اللزوم
    - لا تزال أداة وقت التشغيل `gateway` الخاصة بالمالك فقط ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ وتطبع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات التنفيذ المحمية نفسها

  </Accordion>

  <Accordion title="إعداد بسيط ومعقول لأول تثبيت">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    يضبط هذا مساحة العمل لديك ويقيّد من يمكنه تشغيل البوت.

  </Accordion>

  <Accordion title="كيف أعد Tailscale على خادم VPS وأتصل من جهاز Mac؟">
    الخطوات الدنيا:

    1. **ثبّت وسجّل الدخول على خادم VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ثبّت وسجّل الدخول على جهاز Mac**
       - استخدم تطبيق Tailscale وسجّل الدخول إلى tailnet نفسه.
    3. **فعّل MagicDNS (موصى به)**
       - في وحدة تحكم إدارة Tailscale، فعّل MagicDNS حتى يكون لخادم VPS اسم ثابت.
    4. **استخدم اسم مضيف tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا أردت واجهة التحكم من دون SSH، فاستخدم Tailscale Serve على خادم VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    يُبقي هذا Gateway مربوطًا بـ local loopback ويعرض HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أصل Node على Mac بـ Gateway بعيد (Tailscale Serve)؟">
    يعرّض Serve **واجهة تحكم Gateway + WS**. تتصل Nodes عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكد من أن خادم VPS وجهاز Mac على tailnet نفسه**.
    2. **استخدم تطبيق macOS في الوضع البعيد** (يمكن أن يكون هدف SSH هو اسم مضيف tailnet).
       سيقوم التطبيق بإنشاء نفق لمنفذ Gateway والاتصال بصفته Node.
    3. **وافق على Node** في Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    الوثائق: [بروتوكول Gateway](/ar/gateway/protocol)، [الاكتشاف](/ar/gateway/discovery)، [وضع macOS البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل ينبغي أن أثبّت على حاسوب محمول ثان أم أضيف Node فقط؟">
    إذا كنت تحتاج فقط إلى **أدوات محلية** (الشاشة/الكاميرا/التنفيذ) على الحاسوب المحمول الثاني، فأضفه بصفته
    **Node**. يحافظ ذلك على Gateway واحد ويتجنب تكرار الإعدادات. أدوات Node المحلية
    حاليًا متاحة على macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    ثبّت Gateway ثانيًا فقط عندما تحتاج إلى **عزل صارم** أو بوتين منفصلين بالكامل.

    الوثائق: [Nodes](/ar/nodes)، [CLI الخاص بـ Nodes](/ar/cli/nodes)، [Gateways متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات البيئة وتحميل .env

<AccordionGroup>
  <Accordion title="كيف يحمّل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات البيئة من العملية الأصلية (shell أو launchd/systemd أو CI وما إلى ذلك) ويحمّل أيضًا:

    - `.env` من دليل العمل الحالي
    - ملف `.env` احتياطيًا عامًا من `~/.openclaw/.env` (أي `$OPENCLAW_STATE_DIR/.env`)

    لا يتجاوز أي من ملفي `.env` متغيرات البيئة الموجودة.

    يمكنك أيضًا تعريف متغيرات بيئة مضمنة في الإعدادات (تُطبّق فقط إذا كانت مفقودة من بيئة العملية):

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

  <Accordion title='عيّنت COPILOT_GITHUB_TOKEN، لكن حالة النماذج تعرض "Shell env: off." لماذا؟'>
    يُبلغ `openclaw models status` عما إذا كان **استيراد بيئة shell** مفعّلًا. لا تعني "Shell env: off"
    أن متغيرات البيئة لديك مفقودة - بل تعني فقط أن OpenClaw لن يحمّل
    shell تسجيل الدخول لديك تلقائيًا.

    إذا كان Gateway يعمل كخدمة (launchd/systemd)، فلن يرث بيئة shell
    لديك. أصلح ذلك بإحدى هذه الطرق:

    1. ضع الرمز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد shell (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في إعداداتك (يُطبّق فقط إذا كان مفقودًا).

    ثم أعد تشغيل Gateway وتحقق مرة أخرى:

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

  <Accordion title="هل تُعاد تعيين الجلسات تلقائيًا إذا لم أرسل /new أبدًا؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا **معطّل افتراضيًا** (القيمة الافتراضية **0**).
    اضبطه على قيمة موجبة لتفعيل انتهاء الصلاحية بسبب الخمول. عند التفعيل، تبدأ الرسالة **التالية**
    بعد فترة الخمول معرّف جلسة جديدًا لمفتاح الدردشة ذلك.
    لا يحذف هذا النصوص المسجلة - بل يبدأ جلسة جديدة فقط.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="هل توجد طريقة لإنشاء فريق من مثيلات OpenClaw (رئيس تنفيذي واحد وعدة وكلاء)؟">
    نعم، عبر **توجيه متعدد الوكلاء** و**وكلاء فرعيين**. يمكنك إنشاء وكيل منسّق واحد
    وعدة وكلاء عاملين بمساحات عمل ونماذج خاصة بهم.

    ومع ذلك، من الأفضل النظر إلى هذا على أنه **تجربة ممتعة**. فهو يستهلك الرموز بكثافة وغالبًا
    يكون أقل كفاءة من استخدام بوت واحد بجلسات منفصلة. النموذج النموذجي الذي
    نتصوره هو بوت واحد تتحدث إليه، مع جلسات مختلفة للعمل المتوازي. يمكن لذلك
    البوت أيضًا إنشاء وكلاء فرعيين عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [CLI الخاص بالوكلاء](/ar/cli/agents).

  </Accordion>

  <Accordion title="لماذا اقتُطع السياق في منتصف المهمة؟ كيف أمنع ذلك؟">
    سياق الجلسة محدود بنافذة النموذج. يمكن أن تؤدي الدردشات الطويلة أو مخرجات الأدوات الكبيرة أو الملفات الكثيرة
    إلى تشغيل Compaction أو الاقتطاع.

    ما يساعد:

    - اطلب من البوت تلخيص الحالة الحالية وكتابتها إلى ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل المواضيع.
    - احتفظ بالسياق المهم في مساحة العمل واطلب من البوت قراءته مرة أخرى.
    - استخدم الوكلاء الفرعيين للعمل الطويل أو المتوازي حتى تبقى الدردشة الرئيسية أصغر.
    - اختر نموذجًا بنافذة سياق أكبر إذا حدث هذا كثيرًا.

  </Accordion>

  <Accordion title="كيف أعيد تعيين OpenClaw بالكامل مع إبقائه مثبتًا؟">
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

    - يعرض الإعداد الأولي أيضًا **إعادة التعيين** إذا وجد إعدادًا موجودًا. راجع [الإعداد الأولي (CLI)](/ar/start/wizard).
    - إذا استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد تعيين كل دليل حالة (القيم الافتراضية هي `~/.openclaw-<profile>`).
    - إعادة تعيين التطوير: `openclaw gateway --dev --reset` (للتطوير فقط؛ يمسح إعدادات التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='أتلقى أخطاء "context too large" - كيف أعيد التعيين أو أضغط السياق؟'>
    استخدم أحد هذه الخيارات:

    - **Compact** (يبقي المحادثة لكنه يلخص الأدوار الأقدم):

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

    - فعّل أو اضبط **تشذيب الجلسات** (`agents.defaults.contextPruning`) لقص مخرجات الأدوات القديمة.
    - استخدم نموذجًا بنافذة سياق أكبر.

    الوثائق: [Compaction](/ar/concepts/compaction)، [تشذيب الجلسات](/ar/concepts/session-pruning)، [إدارة الجلسات](/ar/concepts/session).

  </Accordion>

  <Accordion title='لماذا أرى "LLM request rejected: messages.content.tool_use.input field required"؟'>
    هذا خطأ تحقق من المزوّد: أصدر النموذج كتلة `tool_use` بدون
    `input` المطلوب. يعني هذا عادةً أن سجل الجلسة قديم أو تالف (غالبًا بعد سلاسل طويلة
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

    إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (أسطر فارغة فقط وعناوين markdown
    مثل `# Heading`)، فإن OpenClaw يتخطى تشغيل Heartbeat لتوفير استدعاءات API.
    إذا كان الملف مفقودًا، فستظل Heartbeat تعمل ويقرر النموذج ما يجب فعله.

    تستخدم التجاوزات لكل وكيل `agents.list[].heartbeat`. الوثائق: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل أحتاج إلى إضافة "حساب بوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك الخاص**، لذا إذا كنت في المجموعة، يمكن لـ OpenClaw رؤيتها.
    افتراضيًا، تُحظر ردود المجموعات حتى تسمح بالمرسلين (`groupPolicy: "allowlist"`).

    إذا أردت أن تكون **أنت فقط** قادرًا على تشغيل ردود المجموعات:

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

    ابحث عن `chatId` (أو `from`) المنتهي بـ `@g.us`، مثل:
    `1234567890-1234567890@g.us`.

    الخيار 2 (إذا كان مضبوطًا/مسموحًا به مسبقًا): اعرض المجموعات من الإعدادات:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    الوثائق: [WhatsApp](/ar/channels/whatsapp)، [الدليل](/ar/cli/directory)، [السجلات](/ar/cli/logs).

  </Accordion>

  <Accordion title="لماذا لا يرد OpenClaw في مجموعة؟">
    سببان شائعان:

    - بوابة الإشارة مفعّلة (افتراضيًا). يجب أن تشير إلى البوت بـ @mention (أو تطابق `mentionPatterns`).
    - ضبطت `channels.whatsapp.groups` بدون `"*"` والمجموعة ليست ضمن قائمة السماح.

    راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشارك المجموعات/السلاسل السياق مع الرسائل المباشرة؟">
    تُدمج الدردشات المباشرة في الجلسة الرئيسية افتراضيًا. للمجموعات/القنوات مفاتيح جلسات خاصة بها، ومواضيع Telegram / سلاسل Discord هي جلسات منفصلة. راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم عدد مساحات العمل والوكلاء التي يمكنني إنشاؤها؟">
    لا توجد حدود صارمة. العشرات (بل حتى المئات) مقبولة، لكن انتبه إلى:

    - **نمو القرص:** تعيش الجلسات + النصوص المسجلة تحت `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** يعني المزيد من الوكلاء مزيدًا من استخدام النماذج المتزامن.
    - **عبء التشغيل:** ملفات تعريف مصادقة لكل وكيل، ومساحات عمل، وتوجيه قنوات.

    نصائح:

    - احتفظ بمساحة عمل **نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - شذّب الجلسات القديمة (احذف JSONL أو إدخالات التخزين) إذا نما القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل المتروكة وعدم تطابق ملفات التعريف.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة بوتات أو محادثات في الوقت نفسه (Slack)، وكيف ينبغي إعداد ذلك؟">
    نعم. استخدم **توجيه الوكلاء المتعددين** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة حسب
    القناة/الحساب/النظير. Slack مدعوم كقناة ويمكن ربطه بوكلاء محددين.

    الوصول إلى المتصفح قوي لكنه ليس "يفعل أي شيء يستطيع الإنسان فعله" - يمكن أن تظل أنظمة منع البوتات وCAPTCHAs وMFA
    تمنع الأتمتة. للحصول على التحكم الأكثر موثوقية في المتصفح، استخدم Chrome MCP المحلي على المضيف،
    أو استخدم CDP على الجهاز الذي يشغل المتصفح فعليا.

    إعداد أفضل الممارسات:

    - مضيف Gateway دائم التشغيل (VPS/Mac mini).
    - وكيل واحد لكل دور (روابط).
    - قناة/قنوات Slack مربوطة بهؤلاء الوكلاء.
    - متصفح محلي عبر Chrome MCP أو عقدة عند الحاجة.

    المستندات: [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)، [Slack](/ar/channels/slack)،
    [المتصفح](/ar/tools/browser)، [العقد](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج، والتجاوز الاحتياطي، وملفات تعريف المصادقة

توجد أسئلة وأجوبة النماذج — القيم الافتراضية، والاختيار، والأسماء المستعارة، والتبديل، والتجاوز الاحتياطي، وملفات تعريف المصادقة —
في [الأسئلة الشائعة حول النماذج](/ar/help/faq-models).

## Gateway: المنافذ، و"قيد التشغيل بالفعل"، والوضع البعيد

<AccordionGroup>
  <Accordion title="أي منفذ يستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ الوحيد متعدد الإرسال لـ WebSocket + HTTP (Control UI، والخطافات، وغير ذلك).

    ترتيب الأولوية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status عبارة "Runtime: running" لكن "Connectivity probe: failed"؟'>
    لأن "running" هي رؤية **المشرف** (launchd/systemd/schtasks). أما مسبار الاتصال فهو CLI يتصل فعليا بـ WebSocket الخاص بالبوابة.

    استخدم `openclaw gateway status` وثق بهذه الأسطر:

    - `Probe target:` (عنوان URL الذي استخدمه المسبار فعليا)
    - `Listening:` (ما هو مربوط فعليا على المنفذ)
    - `Last gateway error:` (السبب الجذري الشائع عندما تكون العملية حية لكن المنفذ لا يستمع)

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status اختلافا بين "Config (cli)" و"Config (service)"؟'>
    أنت تعدل ملف إعدادات بينما تعمل الخدمة بملف آخر (غالبا عدم تطابق `--profile` / `OPENCLAW_STATE_DIR`).

    الإصلاح:

    ```bash
    openclaw gateway install --force
    ```

    شغل ذلك من `--profile` / البيئة نفسها التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ماذا تعني عبارة "another gateway instance is already listening"؟'>
    يفرض OpenClaw قفلا وقت التشغيل عبر ربط مستمع WebSocket فورا عند بدء التشغيل (الافتراضي `ws://127.0.0.1:18789`). إذا فشل الربط مع `EADDRINUSE`، فإنه يرمي `GatewayLockError` مشيرا إلى أن مثيلا آخر يستمع بالفعل.

    الإصلاح: أوقف المثيل الآخر، أو حرر المنفذ، أو شغل باستخدام `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="كيف أشغل OpenClaw في الوضع البعيد (يتصل العميل بـ Gateway في مكان آخر)؟">
    اضبط `gateway.mode: "remote"` ووجهه إلى عنوان URL بعيد لـ WebSocket، مع بيانات اعتماد بعيدة بسر مشترك اختياريا:

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

    - لا يبدأ `openclaw gateway` إلا عندما يكون `gateway.mode` هو `local` (أو تمرر علم التجاوز).
    - يراقب تطبيق macOS ملف الإعدادات ويبدل الأوضاع مباشرة عندما تتغير هذه القيم.
    - `gateway.remote.token` / `.password` هي بيانات اعتماد بعيدة من جهة العميل فقط؛ وهي لا تفعّل مصادقة البوابة المحلية بذاتها.

  </Accordion>

  <Accordion title='تعرض Control UI عبارة "unauthorized" (أو تواصل إعادة الاتصال). ماذا الآن؟'>
    مسار مصادقة البوابة وطريقة مصادقة واجهة المستخدم غير متطابقين.

    حقائق (من الكود):

    - تحتفظ Control UI بالرمز في `sessionStorage` لجلسة تبويب المتصفح الحالية وعنوان URL المحدد للبوابة، لذلك تستمر عمليات التحديث في التبويب نفسه بالعمل دون استعادة استمرار رمز localStorage طويل العمر.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة محاولة محدودة واحدة باستخدام رمز جهاز مخزن مؤقتا عندما ترجع البوابة تلميحات إعادة المحاولة (`canRetryWithDeviceToken=true`، `recommendedNextStep=retry_with_device_token`).
    - تعيد محاولة الرمز المخزن مؤقتا الآن استخدام النطاقات المعتمدة المخزنة مؤقتا مع رمز الجهاز. لا يزال مستدعو `deviceToken` الصريح / `scopes` الصريح يحتفظون بمجموعة النطاقات المطلوبة لديهم بدلا من وراثة النطاقات المخزنة مؤقتا.
    - خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال هي الرمز/كلمة المرور المشتركة الصريحة أولا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز التمهيد.
    - تتحقق نطاقات رمز التمهيد ببادئة الدور. لا تلبي قائمة السماح المضمنة لمشغل التمهيد إلا طلبات المشغل؛ ما زالت العقدة أو الأدوار الأخرى غير المشغلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    الإصلاح:

    - الأسرع: `openclaw dashboard` (يطبع + ينسخ عنوان URL للوحة المعلومات، ويحاول فتحه؛ ويعرض تلميح SSH إذا كان بلا واجهة).
    - إذا لم يكن لديك رمز بعد: `openclaw doctor --generate-gateway-token`.
    - إذا كان بعيدا، أنشئ النفق أولا: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع السر المشترك: اضبط `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم الصق السر المطابق في إعدادات Control UI.
    - وضع Tailscale Serve: تأكد من تفعيل `gateway.auth.allowTailscale` وأنك تفتح عنوان URL الخاص بـ Serve، وليس عنوان loopback/tailnet خاما يتجاوز رؤوس هوية Tailscale.
    - وضع الوكيل الموثوق: تأكد من أنك تصل عبر الوكيل المدرك للهوية المهيأ، وليس عبر عنوان URL خام للبوابة. تحتاج وكلاء loopback على المضيف نفسه أيضا إلى `gateway.auth.trustedProxy.allowLoopback = true`.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، فأدر/أعد اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا قالت استدعاءة التدوير إنها رُفضت، فتحقق من أمرين:
      - يمكن لجلسات الجهاز المقترن تدوير جهازها **الخاص** فقط ما لم يكن لديها أيضا `operator.admin`
      - لا يمكن لقيم `--scope` الصريحة أن تتجاوز نطاقات المشغل الحالية للمتصل
    - ما زلت عالقا؟ شغل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [لوحة المعلومات](/ar/web/dashboard) لتفاصيل المصادقة.

  </Accordion>

  <Accordion title="ضبطت gateway.bind على tailnet لكنه لا يستطيع الربط ولا شيء يستمع">
    يختار ربط `tailnet` عنوان IP لـ Tailscale من واجهات شبكتك (100.64.0.0/10). إذا لم يكن الجهاز على Tailscale (أو كانت الواجهة معطلة)، فلا يوجد شيء يمكن الربط به.

    الإصلاح:

    - ابدأ Tailscale على ذلك المضيف (بحيث يكون لديه عنوان 100.x)، أو
    - بدّل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. يفضل `auto` loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطا مقتصرا على tailnet.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة Gateways على المضيف نفسه؟">
    عادة لا - يمكن لـ Gateway واحد تشغيل عدة قنوات مراسلة ووكلاء. استخدم عدة Gateways فقط عندما تحتاج إلى التكرار (مثال: بوت إنقاذ) أو العزل الصارم.

    نعم، لكن يجب أن تعزل:

    - `OPENCLAW_CONFIG_PATH` (إعدادات لكل مثيل)
    - `OPENCLAW_STATE_DIR` (حالة لكل مثيل)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (موصى به):

    - استخدم `openclaw --profile <name> ...` لكل مثيل (ينشئ تلقائيا `~/.openclaw-<name>`).
    - اضبط `gateway.port` فريدا في إعدادات كل ملف تعريف (أو مرر `--port` للتشغيل اليدوي).
    - ثبت خدمة لكل ملف تعريف: `openclaw --profile <name> gateway install`.

    تضيف ملفات التعريف أيضا لاحقة إلى أسماء الخدمات (`ai.openclaw.<profile>`؛ القديمة `com.openclaw.*`، `openclaw-gateway-<profile>.service`، `OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [بوابات متعددة](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ماذا تعني "invalid handshake" / الرمز 1008؟'>
    Gateway هو **خادم WebSocket**، ويتوقع أن تكون الرسالة الأولى جدا
    إطار `connect`. إذا تلقى أي شيء آخر، يغلق الاتصال
    باستخدام **الرمز 1008** (انتهاك سياسة).

    الأسباب الشائعة:

    - فتحت عنوان URL الخاص بـ **HTTP** في متصفح (`http://...`) بدلا من عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - أزال وكيل أو نفق رؤوس المصادقة أو أرسل طلبا ليس خاصا بـ Gateway.

    إصلاحات سريعة:

    1. استخدم عنوان WS: `ws://<host>:18789` (أو `wss://...` إذا كان HTTPS).
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

    يمكنك ضبط مسار ثابت عبر `logging.file`. يتحكم `logging.level` في مستوى سجل الملف. يتحكم `--verbose` و`logging.consoleLevel` في تفصيل مخرجات وحدة التحكم.

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

    إذا كنت تشغل البوابة يدويا، يمكن لـ `openclaw gateway --force` استعادة المنفذ. راجع [Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="أغلقت الطرفية على Windows - كيف أعيد تشغيل OpenClaw؟">
    توجد **طريقتا تثبيت في Windows**:

    **1) WSL2 (موصى به):** يعمل Gateway داخل Linux.

    افتح PowerShell، وادخل WSL، ثم أعد التشغيل:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا لم تكن قد ثبت الخدمة قط، فابدأها في المقدمة:

    ```bash
    openclaw gateway run
    ```

    **2) Windows الأصلي (غير موصى به):** يعمل Gateway مباشرة في Windows.

    افتح PowerShell وشغل:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا كنت تشغله يدويا (بلا خدمة)، فاستخدم:

    ```powershell
    openclaw gateway run
    ```

    المستندات: [Windows (WSL2)](/ar/platforms/windows)، [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="Gateway يعمل لكن الردود لا تصل أبدا. ما الذي ينبغي أن أتحقق منه؟">
    ابدأ بفحص صحة سريع:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    الأسباب الشائعة:

    - لم تُحمّل مصادقة النموذج على **مضيف البوابة** (تحقق من `models status`).
    - اقتران القناة/قائمة السماح تمنع الردود (تحقق من إعدادات القناة + السجلات).
    - WebChat/Dashboard مفتوح من دون الرمز الصحيح.

    إذا كنت بعيدا، فتأكد من أن اتصال النفق/Tailscale يعمل وأن
    WebSocket الخاص بـ Gateway يمكن الوصول إليه.

    المستندات: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ماذا الآن؟'>
    يعني هذا عادة أن واجهة المستخدم فقدت اتصال WebSocket. تحقق من:

    1. هل Gateway قيد التشغيل؟ `openclaw gateway status`
    2. هل Gateway سليم؟ `openclaw status`
    3. هل تملك UI الرمز الصحيح؟ `openclaw dashboard`
    4. إذا كان بعيدًا، فهل رابط النفق/Tailscale يعمل؟

    ثم تتبّع السجلات:

    ```bash
    openclaw logs --follow
    ```

    الوثائق: [لوحة التحكم](/ar/web/dashboard)، [الوصول البعيد](/ar/gateway/remote)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

  </Accordion>

  <Accordion title="يفشل Telegram setMyCommands. ما الذي يجب أن أتحقق منه؟">
    ابدأ بالسجلات وحالة القناة:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    ثم طابق الخطأ:

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على إدخالات كثيرة جدًا. يقلّص OpenClaw بالفعل العدد إلى حد Telegram ويعيد المحاولة بأوامر أقل، لكن لا تزال بعض إدخالات القائمة بحاجة إلى الإزالة. قلّل أوامر Plugin/المهارات/الأوامر المخصصة، أو عطّل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed`، أو `Network request for 'setMyCommands' failed!`، أو أخطاء شبكة مشابهة: إذا كنت على VPS أو خلف وكيل، فتأكد من السماح بـ HTTPS الصادر وأن DNS يعمل مع `api.telegram.org`.

    إذا كان Gateway بعيدًا، فتأكد من أنك تنظر إلى السجلات على مضيف Gateway.

    الوثائق: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="لا يعرض TUI أي مخرجات. ما الذي يجب أن أتحقق منه؟">
    تأكد أولًا من إمكانية الوصول إلى Gateway ومن قدرة الوكيل على العمل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لرؤية الحالة الحالية. إذا كنت تتوقع ردودًا في قناة دردشة،
    فتأكد من تفعيل التسليم (`/deliver on`).

    الوثائق: [TUI](/ar/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway تمامًا ثم أشغّله؟">
    إذا كنت قد ثبّتّ الخدمة:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    يوقف/يشغّل هذا **الخدمة المُدارة** (launchd على macOS، وsystemd على Linux).
    استخدم هذا عندما يعمل Gateway في الخلفية كخدمة خفية.

    إذا كنت تشغّله في الواجهة، فأوقفه باستخدام Ctrl-C، ثم:

    ```bash
    openclaw gateway run
    ```

    الوثائق: [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="شرح مبسط: openclaw gateway restart مقابل openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **خدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغّل Gateway **في الواجهة** لجلسة الطرفية هذه.

    إذا كنت قد ثبّتّ الخدمة، فاستخدم أوامر Gateway. استخدم `openclaw gateway` عندما
    تريد تشغيلًا لمرة واحدة في الواجهة.

  </Accordion>

  <Accordion title="أسرع طريقة للحصول على مزيد من التفاصيل عند حدوث فشل">
    ابدأ Gateway باستخدام `--verbose` للحصول على مزيد من تفاصيل وحدة التحكم. ثم افحص ملف السجل بحثًا عن أخطاء مصادقة القنوات، وتوجيه النماذج، وRPC.
  </Accordion>
</AccordionGroup>

## الوسائط والمرفقات

<AccordionGroup>
  <Accordion title="أنشأت مهارتي صورة/PDF، لكن لم يُرسل شيء">
    يجب أن تتضمن المرفقات الصادرة من الوكيل سطر `MEDIA:<path-or-url>` (في سطر مستقل). راجع [إعداد مساعد OpenClaw](/ar/start/openclaw) و[إرسال الوكيل](/ar/tools/agent-send).

    إرسال CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    تحقق أيضًا من:

    - أن القناة الهدف تدعم الوسائط الصادرة وليست محظورة بقوائم السماح.
    - أن الملف ضمن حدود الحجم الخاصة بالمزوّد (تُعاد تحجيم الصور إلى حد أقصى 2048px).
    - يحصر `tools.fs.workspaceOnly=true` عمليات الإرسال من المسارات المحلية في مساحة العمل، ومخزن الوسائط/المؤقت، والملفات التي تحقق منها صندوق العزل.
    - يسمح `tools.fs.workspaceOnly=false` لـ `MEDIA:` بإرسال ملفات محلية على المضيف يمكن للوكيل قراءتها بالفعل، لكن فقط للوسائط وأنواع المستندات الآمنة (الصور، والصوت، والفيديو، وPDF، ومستندات Office). لا تزال الملفات النصية العادية والملفات الشبيهة بالأسرار محظورة.

    راجع [الصور](/ar/nodes/images).

  </Accordion>
</AccordionGroup>

## الأمان والتحكم في الوصول

<AccordionGroup>
  <Accordion title="هل من الآمن تعريض OpenClaw للرسائل المباشرة الواردة؟">
    تعامل مع الرسائل المباشرة الواردة كمدخلات غير موثوقة. صُممت الإعدادات الافتراضية لتقليل المخاطر:

    - السلوك الافتراضي على القنوات القادرة على الرسائل المباشرة هو **الإقران**:
      - يتلقى المرسلون غير المعروفين رمز إقران؛ ولا يعالج البوت رسالتهم.
      - وافق باستخدام: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - تُحد الطلبات المعلقة عند **3 لكل قناة**؛ تحقق من `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل الرمز.
    - يتطلب فتح الرسائل المباشرة للعامة اشتراكًا صريحًا (`dmPolicy: "open"` وقائمة سماح `"*"`).

    شغّل `openclaw doctor` لإظهار سياسات الرسائل المباشرة المحفوفة بالمخاطر.

  </Accordion>

  <Accordion title="هل حقن المطالبات يمثل مشكلة للبوتات العامة فقط؟">
    لا. يتعلق حقن المطالبات بـ **المحتوى غير الموثوق**، وليس فقط بمن يستطيع إرسال رسالة مباشرة إلى البوت.
    إذا كان مساعدك يقرأ محتوى خارجيًا (بحث/جلب من الويب، صفحات متصفح، رسائل بريد إلكتروني،
    وثائق، مرفقات، سجلات ملصوقة)، فقد يتضمن ذلك المحتوى تعليمات تحاول
    اختطاف النموذج. يمكن أن يحدث هذا حتى إذا **كنت أنت المرسل الوحيد**.

    يكون الخطر الأكبر عندما تكون الأدوات مفعّلة: يمكن خداع النموذج ليقوم
    بتسريب السياق أو استدعاء الأدوات نيابة عنك. قلّل نطاق الضرر عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو بلا أدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` متوقفة للوكلاء الممكّنة أدواتهم
    - التعامل مع نصوص الملفات/المستندات المفكوكة كغير موثوقة أيضًا: يغلّف OpenResponses
      `input_file` واستخراج مرفقات الوسائط النص المستخرج في
      علامات حدود محتوى خارجي صريحة بدلًا من تمرير نص الملف الخام
    - العزل وقوائم السماح الصارمة للأدوات

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يجب أن يكون للبوت بريد إلكتروني أو حساب GitHub أو رقم هاتف خاص به؟">
    نعم، في معظم الإعدادات. يقلل عزل البوت بحسابات وأرقام هاتف منفصلة
    نطاق الضرر إذا حدث خطأ. كما يجعل ذلك تدوير
    بيانات الاعتماد أو إبطال الوصول أسهل دون التأثير في حساباتك الشخصية.

    ابدأ بنطاق صغير. امنح الوصول فقط إلى الأدوات والحسابات التي تحتاجها فعلًا، ووسّع
    لاحقًا إذا لزم الأمر.

    الوثائق: [الأمان](/ar/gateway/security)، [الإقران](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية، وهل هذا آمن؟">
    نحن **لا** نوصي بالاستقلالية الكاملة على رسائلك الشخصية. النمط الأكثر أمانًا هو:

    - أبقِ الرسائل المباشرة في **وضع الإقران** أو ضمن قائمة سماح ضيقة.
    - استخدم **رقمًا أو حسابًا منفصلًا** إذا كنت تريده أن يراسل نيابة عنك.
    - دعه يصيغ المسودة، ثم **وافق قبل الإرسال**.

    إذا أردت التجربة، فافعل ذلك على حساب مخصص وأبقِه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل للدردشة فقط وكانت المدخلات موثوقة. تكون الفئات الأصغر
    أكثر عرضة لاختطاف التعليمات، لذا تجنبها للوكلاء الممكّنة أدواتهم
    أو عند قراءة محتوى غير موثوق. إذا كان لا بد من استخدام نموذج أصغر، فأحكم تقييد
    الأدوات وشغّله داخل صندوق عزل. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="شغّلت /start في Telegram لكن لم أحصل على رمز إقران">
    تُرسل رموز الإقران **فقط** عندما يرسل مرسل غير معروف رسالة إلى البوت ويكون
    `dmPolicy: "pairing"` مفعّلًا. لا يولّد `/start` بمفرده رمزًا.

    تحقق من الطلبات المعلقة:

    ```bash
    openclaw pairing list telegram
    ```

    إذا كنت تريد وصولًا فوريًا، فأضف معرّف المرسل إلى قائمة السماح أو عيّن `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيراسل جهات اتصالي؟ كيف يعمل الإقران؟">
    لا. سياسة الرسائل المباشرة الافتراضية في WhatsApp هي **الإقران**. يحصل المرسلون غير المعروفين فقط على رمز إقران ولا **تُعالج** رسالتهم. يرد OpenClaw فقط على الدردشات التي يتلقاها أو على عمليات الإرسال الصريحة التي تطلقها.

    وافق على الإقران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اعرض الطلبات المعلقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لضبط **قائمة السماح/المالك** بحيث يُسمح برسائلك المباشرة. لا تُستخدم للإرسال التلقائي. إذا كنت تشغّل على رقم WhatsApp الشخصي الخاص بك، فاستخدم ذلك الرقم وفعّل `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، وإلغاء المهام، و"لن يتوقف"

<AccordionGroup>
  <Accordion title="كيف أوقف ظهور رسائل النظام الداخلية في الدردشة؟">
    تظهر معظم الرسائل الداخلية أو رسائل الأدوات فقط عندما يكون **verbose** أو **trace** أو **reasoning** مفعّلًا
    لتلك الجلسة.

    أصلح ذلك في الدردشة التي ترى فيها المشكلة:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    إذا بقيت الضوضاء، فتحقق من إعدادات الجلسة في Control UI واضبط verbose
    على **inherit**. تأكد أيضًا من أنك لا تستخدم ملف تعريف بوت مضبوطًا فيه `verboseDefault`
    على `on` في الإعدادات.

    الوثائق: [التفكير والتفصيل](/ar/tools/thinking)، [الأمان](/ar/gateway/security/index#reasoning-and-verbose-output-in-groups).

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

    هذه مشغلات إلغاء (وليست أوامر شرطة مائلة).

    للعمليات الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

    ```
    process action:kill sessionId:XXX
    ```

    نظرة عامة على أوامر الشرطة المائلة: راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

    يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`، لكن بعض الاختصارات (مثل `/status`) تعمل أيضًا داخل السطر للمرسلين الموجودين في قائمة السماح.

  </Accordion>

  <Accordion title='كيف أرسل رسالة Discord من Telegram؟ ("رُفضت المراسلة عبر السياقات")'>
    يحظر OpenClaw المراسلة **عبر المزوّدين** افتراضيًا. إذا كان استدعاء أداة مرتبطًا
    بـ Telegram، فلن يرسل إلى Discord ما لم تسمح بذلك صراحة.

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

  <Accordion title='لماذا يبدو أن البوت "يتجاهل" الرسائل السريعة المتتالية؟'>
    يتحكم وضع الطابور في كيفية تفاعل الرسائل الجديدة مع تشغيل جارٍ. استخدم `/queue` لتغيير الأوضاع:

    - `steer` - يضع كل التوجيه المعلق في الطابور حتى حد النموذج التالي في التشغيل الحالي
    - `queue` - توجيه تقليدي واحد في كل مرة
    - `followup` - يشغّل الرسائل واحدة تلو الأخرى
    - `collect` - يجمع الرسائل ويرد مرة واحدة
    - `steer-backlog` - يوجّه الآن، ثم يعالج التراكم
    - `interrupt` - يلغي التشغيل الحالي ويبدأ من جديد

    الوضع الافتراضي هو `steer`. يمكنك إضافة خيارات مثل `debounce:0.5s cap:25 drop:summarize` لأوضاع المتابعة. راجع [طابور الأوامر](/ar/concepts/queue) و[طابور التوجيه](/ar/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما النموذج الافتراضي لـ Anthropic عند استخدام مفتاح API؟'>
    في OpenClaw، تكون بيانات الاعتماد واختيار النموذج منفصلين. يؤدي تعيين `ANTHROPIC_API_KEY` (أو تخزين مفتاح API من Anthropic في ملفات تعريف المصادقة) إلى تفعيل المصادقة، لكن النموذج الافتراضي الفعلي هو ما تكوّنه في `agents.defaults.model.primary` (على سبيل المثال، `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). إذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم يتمكن من العثور على بيانات اعتماد Anthropic في ملف `auth-profiles.json` المتوقع للوكيل قيد التشغيل.
  </Accordion>
</AccordionGroup>

---

ما زلت عالقًا؟ اسأل في [Discord](https://discord.com/invite/clawd) أو افتح [مناقشة على GitHub](https://github.com/openclaw/openclaw/discussions).

## ذات صلة

- [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run) — التثبيت، الإعداد الأولي، المصادقة، الاشتراكات، الإخفاقات المبكرة
- [الأسئلة الشائعة حول النماذج](/ar/help/faq-models) — اختيار النموذج، التحويل عند الفشل، ملفات تعريف المصادقة
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) — فرز يبدأ بالأعراض
