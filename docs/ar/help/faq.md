---
read_when:
    - الإجابة عن أسئلة الدعم الشائعة المتعلقة بالإعداد أو التثبيت أو التهيئة الأولية أو وقت التشغيل
    - فرز المشكلات التي أبلغ عنها المستخدمون قبل تصحيح الأخطاء بتعمق
summary: الأسئلة الشائعة حول إعداد OpenClaw وتكوينه واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-07-03T15:29:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d55385d187c20dfce05022b76fcaa054c19fc22e46da66d4a24e2538dd95708
    source_path: help/faq.md
    workflow: 16
---

إجابات سريعة مع استكشاف أعمق للأخطاء في الإعدادات الواقعية (التطوير المحلي، VPS، تعدد الوكلاء، OAuth/مفاتيح API، التبديل الاحتياطي للنماذج). لتشخيص وقت التشغيل، راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). لمرجع الإعدادات الكامل، راجع [الإعدادات](/ar/gateway/configuration).

## أول 60 ثانية إذا كان هناك شيء معطّل

1. **الحالة السريعة (أول فحص)**

   ```bash
   openclaw status
   ```

   ملخص محلي سريع: نظام التشغيل + التحديث، قابلية الوصول إلى Gateway/الخدمة، الوكلاء/الجلسات، إعدادات المزوّد + مشكلات وقت التشغيل (عندما يكون Gateway قابلًا للوصول).

2. **تقرير قابل للصق (آمن للمشاركة)**

   ```bash
   openclaw status --all
   ```

   تشخيص للقراءة فقط مع ذيل السجل (مع تنقيح الرموز السرية).

3. **حالة البرنامج الخفي + المنفذ**

   ```bash
   openclaw gateway status
   ```

   يعرض وقت تشغيل المشرف مقابل قابلية الوصول عبر RPC، وعنوان URL المستهدف للفحص، وأي إعدادات استخدمتها الخدمة غالبًا.

4. **فحوصات عميقة**

   ```bash
   openclaw status --deep
   ```

   يشغّل فحصًا مباشرًا لصحة Gateway، بما في ذلك فحوصات القنوات عندما تكون مدعومة
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

6. **تشغيل الطبيب (الإصلاحات)**

   ```bash
   openclaw doctor
   ```

   يصلح/يرحّل الإعدادات/الحالة + يشغّل فحوصات الصحة. راجع [Doctor](/ar/gateway/doctor).

7. **لقطة Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   يطلب من Gateway الجاري تشغيله لقطة كاملة (WS فقط). راجع [الصحة](/ar/gateway/health).

## البدء السريع وإعداد التشغيل الأول

أسئلة وأجوبة التشغيل الأول — التثبيت، الإعداد الأولي، مسارات المصادقة، الاشتراكات، الإخفاقات الأولية —
موجودة في [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run).

## ما هو OpenClaw؟

<AccordionGroup>
  <Accordion title="ما هو OpenClaw، في فقرة واحدة؟">
    OpenClaw هو مساعد ذكاء اصطناعي شخصي تشغّله على أجهزتك الخاصة. يرد على أسطح المراسلة التي تستخدمها بالفعل (WhatsApp وTelegram وSlack وMattermost وDiscord وGoogle Chat وSignal وiMessage وWebChat وPlugins القنوات المضمّنة مثل QQ Bot) ويمكنه أيضًا تقديم الصوت + Canvas مباشر على المنصات المدعومة. **Gateway** هو مستوى التحكم الدائم التشغيل؛ والمساعد هو المنتج.
  </Accordion>

  <Accordion title="عرض القيمة">
    OpenClaw ليس "مجرد غلاف لـ Claude". إنه **مستوى تحكم محلي أولًا** يتيح لك تشغيل
    مساعد قادر على **عتادك الخاص**، يمكن الوصول إليه من تطبيقات الدردشة التي تستخدمها بالفعل، مع
    جلسات ذات حالة، وذاكرة، وأدوات - من دون تسليم التحكم في سير عملك إلى خدمة SaaS
    مستضافة.

    أبرز الميزات:

    - **أجهزتك، بياناتك:** شغّل Gateway أينما تريد (Mac أو Linux أو VPS) واحتفظ
      بمساحة العمل + سجل الجلسات محليًا.
    - **قنوات حقيقية، لا صندوق رمل ويب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/إلخ،
      بالإضافة إلى الصوت عبر الهاتف وCanvas على المنصات المدعومة.
    - **محايد تجاه النماذج:** استخدم Anthropic وOpenAI وMiniMax وOpenRouter وغيرها، مع توجيه
      لكل وكيل وتبديل احتياطي.
    - **خيار محلي فقط:** شغّل نماذج محلية بحيث **يمكن أن تبقى كل البيانات على جهازك** إذا أردت.
    - **توجيه متعدد الوكلاء:** وكلاء منفصلون لكل قناة، أو حساب، أو مهمة، ولكل منهم
      مساحة عمله وافتراضاته.
    - **مفتوح المصدر وقابل للتعديل:** افحصه، ووسّعه، واستضفه ذاتيًا من دون قفل مورّد.

    الوثائق: [Gateway](/ar/gateway)، [القنوات](/ar/channels)، [تعدد الوكلاء](/ar/concepts/multi-agent)،
    [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="لقد أعددته للتو - ماذا أفعل أولًا؟">
    مشاريع أولى جيدة:

    - أنشئ موقعًا إلكترونيًا (WordPress أو Shopify أو موقعًا ثابتًا بسيطًا).
    - أنشئ نموذجًا أوليًا لتطبيق هاتف (مخطط، شاشات، خطة API).
    - نظّم الملفات والمجلدات (تنظيف، تسمية، وسم).
    - صِل Gmail وأتمت الملخصات أو المتابعات.

    يمكنه التعامل مع المهام الكبيرة، لكنه يعمل بأفضل شكل عندما تقسّمها إلى مراحل وتستخدم
    وكلاء فرعيين للعمل المتوازي.

  </Accordion>

  <Accordion title="ما أبرز خمس حالات استخدام يومية لـ OpenClaw؟">
    المكاسب اليومية تبدو عادةً مثل:

    - **إحاطات شخصية:** ملخصات لصندوق الوارد، والتقويم، والأخبار التي تهمك.
    - **البحث والصياغة:** بحث سريع، وملخصات، ومسودات أولى للرسائل أو المستندات.
    - **التذكيرات والمتابعات:** تنبيهات وقوائم تحقق مدفوعة بـ Cron أو Heartbeat.
    - **أتمتة المتصفح:** ملء النماذج، وجمع البيانات، وتكرار مهام الويب.
    - **تنسيق عبر الأجهزة:** أرسل مهمة من هاتفك، ودع Gateway يشغّلها على خادم، ثم احصل على النتيجة في الدردشة.

  </Accordion>

  <Accordion title="هل يمكن أن يساعد OpenClaw في توليد العملاء المحتملين، والتواصل، والإعلانات، والمدونات لخدمة SaaS؟">
    نعم في **البحث، والتأهيل، والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات رسائل تواصل أو نصوص إعلانية.

    بالنسبة إلى **حملات التواصل أو الإعلانات**، أبقِ الإنسان ضمن الحلقة. تجنب الرسائل المزعجة، واتبع القوانين المحلية
    وسياسات المنصات، وراجع أي شيء قبل إرساله. النمط الأكثر أمانًا هو أن تجعل
    OpenClaw يصيغ وأنت توافق.

    الوثائق: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما المزايا مقارنةً بـ Claude Code لتطوير الويب؟">
    OpenClaw هو **مساعد شخصي** وطبقة تنسيق، وليس بديلًا لبيئة التطوير المتكاملة. استخدم
    Claude Code أو Codex لأسرع حلقة برمجة مباشرة داخل مستودع. استخدم OpenClaw عندما
    تريد ذاكرة دائمة، ووصولًا عبر الأجهزة، وتنسيقًا للأدوات.

    المزايا:

    - **ذاكرة + مساحة عمل دائمتان** عبر الجلسات
    - **وصول متعدد المنصات** (WhatsApp وTelegram وTUI وWebChat)
    - **تنسيق الأدوات** (المتصفح، الملفات، الجدولة، الخطافات)
    - **Gateway دائم التشغيل** (شغّله على VPS وتفاعل من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/التنفيذ المحلي

    عرض: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="كيف أخصص Skills من دون إبقاء المستودع متسخًا؟">
    استخدم التجاوزات المُدارة بدلًا من تعديل نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدًا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). الأولوية هي `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمّن → `skills.load.extraDirs`، لذا تظل التجاوزات المُدارة تتفوق على Skills المضمّنة من دون لمس git. إذا كنت تحتاج إلى تثبيت Skill عالميًا لكن جعله مرئيًا لبعض الوكلاء فقط، فأبقِ النسخة المشتركة في `~/.openclaw/skills` وتحكم في الظهور باستخدام `agents.defaults.skills` و`agents.list[].skills`. يجب أن تعيش التعديلات الجديرة بالرفع إلى المصدر فقط في المستودع وأن تُرسل كطلبات PR.
  </Accordion>

  <Accordion title="هل يمكنني تحميل Skills من مجلد مخصص؟">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (أدنى أولوية). الأولوية الافتراضية هي `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمّن → `skills.load.extraDirs`. يثبّت `clawhub` في `./skills` افتراضيًا، وهو ما يعامله OpenClaw كـ `<workspace>/skills` في الجلسة التالية. إذا كان يجب أن تكون Skill مرئية لوكلاء معينين فقط، فاقرن ذلك مع `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="كيف يمكنني استخدام نماذج أو إعدادات مختلفة لمهام مختلفة؟">
    الأنماط المدعومة اليوم هي:

    - **مهام Cron**: يمكن للمهام المعزولة تعيين تجاوز `model` لكل مهمة.
    - **الوكلاء**: وجّه المهام إلى وكلاء منفصلين بنماذج افتراضية مختلفة، ومستويات تفكير، ومعلمات تدفق.
    - **تبديل عند الطلب**: استخدم `/model` لتبديل نموذج الجلسة الحالية في أي وقت.

    على سبيل المثال، استخدم النموذج نفسه مع إعدادات مختلفة لكل وكيل:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    ضع الافتراضات المشتركة لكل نموذج في `agents.defaults.models["provider/model"].params`، ثم ضع التجاوزات الخاصة بالوكيل في `agents.list[].params` المسطحة. لا تعرّف إدخالات متداخلة منفصلة في `agents.list[].models["provider/model"].params` للنموذج نفسه؛ فـ `agents.list[].models` مخصص لفهرس النماذج الخاص بالوكيل وتجاوزات وقت التشغيل.

    راجع [مهام Cron](/ar/automation/cron-jobs)، [توجيه تعدد الوكلاء](/ar/concepts/multi-agent)، [الإعدادات](/ar/gateway/config-agents)، و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="يتجمد البوت أثناء تنفيذ عمل ثقيل. كيف أفرّغ ذلك؟">
    استخدم **الوكلاء الفرعيين** للمهام الطويلة أو المتوازية. يعمل الوكلاء الفرعيون في جلستهم الخاصة،
    ويعيدون ملخصًا، ويحافظون على استجابة الدردشة الرئيسية.

    اطلب من البوت "spawn a sub-agent for this task" أو استخدم `/subagents`.
    استخدم `/status` في الدردشة لمعرفة ما يفعله Gateway الآن (وما إذا كان مشغولًا).

    نصيحة بخصوص الرموز: تستهلك المهام الطويلة والوكلاء الفرعيون الرموز. إذا كانت التكلفة مصدر قلق، فعيّن
    نموذجًا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [مهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="كيف تعمل جلسات الوكيل الفرعي المرتبطة بسلسلة على Discord؟">
    استخدم روابط السلاسل. يمكنك ربط سلسلة Discord بوكيل فرعي أو هدف جلسة حتى تبقى رسائل المتابعة في تلك السلسلة على الجلسة المرتبطة.

    التدفق الأساسي:

    - ابدأ باستخدام `sessions_spawn` مع `thread: true` (واختياريًا `mode: "session"` للمتابعة المستمرة).
    - أو اربط يدويًا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الربط.
    - استخدم `/session idle <duration|off>` و`/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل السلسلة.

    الإعداد المطلوب:

    - الافتراضات العامة: `session.threadBindings.enabled` و`session.threadBindings.idleHours` و`session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: `channels.discord.threadBindings.enabled` و`channels.discord.threadBindings.idleHours` و`channels.discord.threadBindings.maxAgeHours`.
    - الربط التلقائي عند البدء: القيمة الافتراضية لـ `channels.discord.threadBindings.spawnSessions` هي `true`؛ عيّنها إلى `false` لتعطيل إنشاء جلسات مرتبطة بالسلاسل.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع الإعدادات](/ar/gateway/configuration-reference)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="أنهى وكيل فرعي عمله، لكن تحديث الإكمال ذهب إلى المكان الخطأ أو لم يُنشر إطلاقًا. ماذا يجب أن أفحص؟">
    افحص مسار الطالب الذي تم حله أولًا:

    - يفضّل تسليم الوكيل الفرعي في وضع الإكمال أي سلسلة مرتبطة أو مسار محادثة عند وجوده.
    - إذا كان أصل الإكمال يحمل قناة فقط، يتراجع OpenClaw إلى المسار المخزن لجلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) حتى يظل التسليم المباشر ممكنًا.
    - إذا لم يوجد مسار مرتبط ولا مسار مخزن قابل للاستخدام، فقد يفشل التسليم المباشر وتتراجع النتيجة إلى تسليم الجلسة في الطابور بدلًا من النشر الفوري في الدردشة.
    - يمكن للأهداف غير الصالحة أو القديمة أن تفرض رغم ذلك الرجوع إلى الطابور أو فشل التسليم النهائي.
    - إذا كانت آخر رسالة مرئية من المساعد للفرع هي الرمز الصامت الدقيق `NO_REPLY` / `no_reply`، أو بالضبط `ANNOUNCE_SKIP`، فإن OpenClaw يمنع الإعلان عمدًا بدلًا من نشر تقدم سابق قديم.
    - لا يُرقّى خرج Tool/toolResult إلى نص نتيجة الفرع؛ النتيجة هي آخر رد مرئي من المساعد للفرع.

    تصحيح الأخطاء:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="لا يعمل Cron أو التذكيرات. ما الذي يجب أن أتحقق منه؟">
    يعمل Cron داخل عملية Gateway. إذا لم يكن Gateway يعمل باستمرار،
    فلن تعمل المهام المجدولة.

    قائمة التحقق:

    - تأكد من تفعيل cron (`cron.enabled`) ومن عدم ضبط `OPENCLAW_SKIP_CRON`.
    - تحقق من أن Gateway يعمل على مدار الساعة طوال أيام الأسبوع (بلا سكون/إعادات تشغيل).
    - تحقق من إعدادات المنطقة الزمنية للمهمة (`--tz` مقابل المنطقة الزمنية للمضيف).

    تصحيح الأخطاء:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة](/ar/automation).

  </Accordion>

  <Accordion title="تم تشغيل Cron، لكن لم يُرسل شيء إلى القناة. لماذا؟">
    تحقق من وضع التسليم أولاً:

    - يعني `--no-deliver` / `delivery.mode: "none"` أنه لا يُتوقع إرسال احتياطي من المشغل.
    - يعني هدف الإعلان المفقود أو غير الصالح (`channel` / `to`) أن المشغل تخطى التسليم الصادر.
    - تعني إخفاقات مصادقة القناة (`unauthorized`، `Forbidden`) أن المشغل حاول التسليم لكن بيانات الاعتماد منعته.
    - تُعامل النتيجة المعزولة الصامتة (`NO_REPLY` / `no_reply` فقط) على أنها غير قابلة للتسليم عمداً، لذلك يمنع المشغل أيضاً التسليم الاحتياطي في قائمة الانتظار.

    بالنسبة إلى مهام Cron المعزولة، لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message`
    عندما يكون مسار الدردشة متاحاً. يتحكم `--announce` فقط في مسار الاحتياطي
    الخاص بالمشغل للنص النهائي الذي لم يكن الوكيل قد أرسله بالفعل.

    تصحيح الأخطاء:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="لماذا بدّل تشغيل Cron المعزول النماذج أو أعاد المحاولة مرة واحدة؟">
    يكون ذلك عادةً مسار تبديل النموذج الحي، وليس جدولة مكررة.

    يمكن لـ Cron المعزول أن يحتفظ بتسليم نموذج وقت التشغيل وأن يعيد المحاولة عندما يطرح
    التشغيل النشط `LiveSessionModelSwitchError`. تحتفظ إعادة المحاولة
    بالمزوّد/النموذج الذي تم التبديل إليه، وإذا حمل التبديل تجاوزاً جديداً لملف المصادقة، فإن Cron
    يحتفظ بذلك أيضاً قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يتقدم تجاوز نموذج رابط Gmail أولاً عندما ينطبق.
    - ثم `model` لكل مهمة.
    - ثم أي تجاوز نموذج مخزن لجلسة Cron.
    - ثم اختيار نموذج الوكيل/النموذج الافتراضي المعتاد.

    حلقة إعادة المحاولة محدودة. بعد المحاولة الأولية بالإضافة إلى محاولتي تبديل،
    يوقف Cron العملية بدلاً من الدوران إلى الأبد.

    تصحيح الأخطاء:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [CLI الخاص بـ cron](/ar/cli/cron).

  </Accordion>

  <Accordion title="كيف أثبّت Skills على Linux؟">
    استخدم أوامر `openclaw skills` الأصلية أو ضع Skills في مساحة عملك. واجهة Skills على macOS غير متاحة على Linux.
    تصفح Skills على [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    يكتب `openclaw skills install` الأصلي في دليل `skills/`
    في مساحة العمل النشطة افتراضياً. أضف `--global` للتثبيت في دليل
    Skills المدار والمشترك لكل الوكلاء المحليين. ثبّت CLI المنفصل `clawhub`
    فقط إذا كنت تريد نشر Skills الخاصة بك أو مزامنتها. استخدم
    `agents.defaults.skills` أو `agents.list[].skills` إذا أردت تضييق
    نطاق الوكلاء الذين يمكنهم رؤية Skills المشتركة.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw تشغيل المهام وفق جدول أو باستمرار في الخلفية؟">
    نعم. استخدم مجدول Gateway:

    - **مهام Cron** للمهام المجدولة أو المتكررة (تستمر عبر إعادة التشغيل).
    - **Heartbeat** للفحوصات الدورية لـ "الجلسة الرئيسية".
    - **المهام المعزولة** للوكلاء المستقلين الذين ينشرون الملخصات أو يسلّمون إلى الدردشات.

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills الخاصة بـ Apple macOS فقط من Linux؟">
    ليس مباشرة. تُقيّد Skills الخاصة بـ macOS بواسطة `metadata.openclaw.os` بالإضافة إلى الثنائيات المطلوبة، ولا تظهر Skills في مطالبة النظام إلا عندما تكون مؤهلة على **مضيف Gateway**. على Linux، لن تُحمّل Skills الخاصة بـ `darwin` فقط (مثل `apple-notes` و`apple-reminders` و`things-mac`) إلا إذا تجاوزت التقييد.

    لديك ثلاثة أنماط مدعومة:

    **الخيار A - شغّل Gateway على Mac (الأبسط).**
    شغّل Gateway حيث توجد ثنائيات macOS، ثم اتصل من Linux في [الوضع البعيد](#gateway-ports-already-running-and-remote-mode) أو عبر Tailscale. تُحمّل Skills بشكل طبيعي لأن مضيف Gateway هو macOS.

    **الخيار B - استخدم عقدة macOS (بلا SSH).**
    شغّل Gateway على Linux، واقرن عقدة macOS (تطبيق شريط القوائم)، واضبط **أوامر تشغيل Node** على "Always Ask" أو "Always Allow" على Mac. يمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما توجد الثنائيات المطلوبة على العقدة. يشغّل الوكيل تلك Skills عبر أداة `nodes`. إذا اخترت "Always Ask"، فإن الموافقة على "Always Allow" في المطالبة تضيف ذلك الأمر إلى قائمة السماح.

    **الخيار C - وكّل ثنائيات macOS عبر SSH (متقدم).**
    أبقِ Gateway على Linux، لكن اجعل ثنائيات CLI المطلوبة تُحل إلى مغلفات SSH تعمل على Mac. ثم تجاوز Skill للسماح بـ Linux حتى تبقى مؤهلة.

    1. أنشئ مغلف SSH للثنائي (مثال: `memo` لـ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ضع المغلف في `PATH` على مضيف Linux (على سبيل المثال `~/bin/memo`).
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

    - **Skill / Plugin مخصص:** الأفضل للوصول الموثوق إلى API (لكل من Notion/HeyGen واجهات API).
    - **أتمتة المتصفح:** تعمل بلا كود لكنها أبطأ وأكثر هشاشة.

    إذا كنت تريد الاحتفاظ بالسياق لكل عميل (سير عمل الوكالات)، فهذا نمط بسيط:

    - صفحة Notion واحدة لكل عميل (السياق + التفضيلات + العمل النشط).
    - اطلب من الوكيل جلب تلك الصفحة في بداية الجلسة.

    إذا أردت تكاملاً أصلياً، فافتح طلب ميزة أو ابنِ Skill
    تستهدف تلك الواجهات.

    تثبيت Skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    تصل التثبيتات الأصلية إلى دليل `skills/` في مساحة العمل النشطة. لاستخدام Skills مشتركة عبر جميع الوكلاء المحليين، استخدم `openclaw skills install @owner/<skill-slug> --global` (أو ضعها يدوياً في `~/.openclaw/skills/<name>/SKILL.md`). إذا كان ينبغي لبعض الوكلاء فقط رؤية تثبيت مشترك، فكوّن `agents.defaults.skills` أو `agents.list[].skills`. تتوقع بعض Skills ثنائيات مثبتة عبر Homebrew؛ على Linux يعني ذلك Linuxbrew (راجع إدخال الأسئلة الشائعة لـ Homebrew على Linux أعلاه). راجع [Skills](/ar/tools/skills)، [إعدادات Skills](/ar/tools/skills-config)، و[ClawHub](/ar/clawhub).

  </Accordion>

  <Accordion title="كيف أستخدم Chrome الحالي الذي سجّلت الدخول إليه مع OpenClaw؟">
    استخدم ملف المتصفح `user` المدمج، الذي يتصل عبر Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    إذا أردت اسماً مخصصاً، فأنشئ ملف MCP صريحاً:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    يمكن لهذا المسار استخدام متصفح المضيف المحلي أو عقدة متصفح متصلة. إذا كان Gateway يعمل في مكان آخر، فشغّل مضيف عقدة على جهاز المتصفح أو استخدم CDP بعيداً بدلاً من ذلك.

    الحدود الحالية لـ `existing-session` / `user`:

    - الإجراءات مدفوعة بـ ref، وليست مدفوعة بمحددات CSS
    - تتطلب عمليات الرفع `ref` / `inputRef` وتدعم حالياً ملفاً واحداً في كل مرة
    - لا تزال `responsebody`، وتصدير PDF، واعتراض التنزيل، والإجراءات الدفعية تحتاج إلى متصفح مُدار أو ملف CDP خام

  </Accordion>
</AccordionGroup>

## العزل والذاكرة

<AccordionGroup>
  <Accordion title="هل توجد وثيقة مخصصة للعزل؟">
    نعم. راجع [العزل](/ar/gateway/sandboxing). لإعداد خاص بـ Docker (Gateway كامل في Docker أو صور عزل)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدوداً - كيف أفعّل الميزات الكاملة؟">
    الصورة الافتراضية تقدّم الأمان أولاً وتعمل كمستخدم `node`، لذلك لا
    تتضمن حزم النظام، أو Homebrew، أو المتصفحات المضمنة. لإعداد أكمل:

    - استمر في حفظ `/home/node` باستخدام `OPENCLAW_HOME_VOLUME` حتى تبقى الذاكرات المؤقتة.
    - أدرج تبعيات النظام في الصورة باستخدام `OPENCLAW_IMAGE_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المضمن:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - اضبط `PLAYWRIGHT_BROWSERS_PATH` وتأكد من استمرار حفظ المسار.

    الوثائق: [Docker](/ar/install/docker)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل المباشرة شخصية وجعل المجموعات عامة/معزولة مع وكيل واحد؟">
    نعم - إذا كانت حركة المرور الخاصة بك هي **رسائل مباشرة** وكانت حركة المرور العامة هي **مجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` حتى تعمل جلسات المجموعة/القناة (مفاتيح غير رئيسية) في خلفية العزل المكوّنة، بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال إعدادات: [المجموعات: رسائل مباشرة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع الإعدادات الرئيسي: [إعداد Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلد مضيف داخل العزل؟">
    اضبط `agents.defaults.sandbox.docker.binds` على `["host:path:mode"]` (مثل `"/home/user/src:/src:ro"`). تندمج عمليات الربط العامة وعمليات الربط لكل وكيل؛ وتُتجاهل عمليات الربط لكل وكيل عندما يكون `scope: "shared"`. استخدم `:ro` لأي شيء حساس وتذكر أن عمليات الربط تتجاوز جدران نظام ملفات العزل.

    يتحقق OpenClaw من مصادر الربط مقابل كل من المسار المعياري والمسار القانوني المحلول عبر أعمق سلف موجود. يعني ذلك أن عمليات الإفلات عبر أصل الرابط الرمزي لا تزال تفشل مغلقة حتى عندما لا يكون مقطع المسار الأخير موجوداً بعد، وأن فحوصات الجذر المسموح به لا تزال تنطبق بعد حل الرابط الرمزي.

    راجع [العزل](/ar/gateway/sandboxing#custom-bind-mounts) و[العزل مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للاطلاع على أمثلة وملاحظات السلامة.

  </Accordion>

  <Accordion title="كيف تعمل الذاكرة؟">
    ذاكرة OpenClaw هي مجرد ملفات Markdown في مساحة عمل الوكيل:

    - ملاحظات يومية في `memory/YYYY-MM-DD.md`
    - ملاحظات طويلة الأجل منتقاة في `MEMORY.md` (الجلسات الرئيسية/الخاصة فقط)

    يشغّل OpenClaw أيضاً **تفريغ ذاكرة صامت قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction التلقائي. يعمل هذا فقط عندما تكون مساحة العمل
    قابلة للكتابة (تتخطاه بيئات العزل للقراءة فقط). راجع [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="تستمر الذاكرة في نسيان الأشياء. كيف أجعلها تثبت؟">
    اطلب من البوت **كتابة الحقيقة إلى الذاكرة**. الملاحظات طويلة الأجل مكانها في `MEMORY.md`،
    وينتقل السياق قصير الأجل إلى `memory/YYYY-MM-DD.md`.

    ما زال هذا مجالًا نعمل على تحسينه. من المفيد تذكير النموذج بتخزين الذكريات؛
    وسيعرف ما عليه فعله. إذا استمر في النسيان، فتحقق من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تستمر الذاكرة إلى الأبد؟ ما حدودها؟">
    تعيش ملفات الذاكرة على القرص وتستمر إلى أن تحذفها. الحد هو
    مساحة التخزين لديك، وليس النموذج. يظل **سياق الجلسة** محدودًا بنافذة سياق
    النموذج، لذلك يمكن للمحادثات الطويلة أن تُضغط أو تُقتطع. لهذا السبب
    يوجد بحث الذاكرة - فهو يعيد فقط الأجزاء ذات الصلة إلى السياق.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب بحث الذاكرة الدلالي مفتاح OpenAI API؟">
    فقط إذا كنت تستخدم **تضمينات OpenAI**. يغطي Codex OAuth الدردشة/الإكمالات
    ولا يمنح وصولًا إلى التضمينات، لذلك **تسجيل الدخول باستخدام Codex (OAuth أو
    تسجيل دخول Codex CLI)** لا يساعد في بحث الذاكرة الدلالي. ما زالت تضمينات OpenAI
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تضبط موفرًا صراحة، يستخدم OpenClaw تضمينات OpenAI. الإعدادات القديمة
    التي ما زالت تقول `memorySearch.provider = "auto"` تُحل إلى OpenAI أيضًا.
    إذا لم يتوفر مفتاح OpenAI API، يبقى بحث الذاكرة الدلالي غير متاح
    إلى أن تضبط مفتاحًا أو تختار موفرًا آخر صراحة.

    إذا كنت تفضل البقاء محليًا، فاضبط `memorySearch.provider = "local"` (واختياريًا
    `memorySearch.fallback = "none"`). إذا أردت تضمينات Gemini، فاضبط
    `memorySearch.provider = "gemini"` وقدّم `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). ندعم نماذج تضمين **OpenAI، والمتوافقة مع OpenAI، وGemini،
    وVoyage، وMistral، وBedrock، وOllama، وLM Studio، وGitHub Copilot، وDeepInfra، أو المحلية** -
    راجع [الذاكرة](/ar/concepts/memory) لتفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## أين توجد الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل تُحفظ كل البيانات المستخدمة مع OpenClaw محليًا؟">
    لا - **حالة OpenClaw محلية**، لكن **الخدمات الخارجية ما زالت ترى ما ترسله إليها**.

    - **محلي افتراضيًا:** الجلسات، وملفات الذاكرة، والإعدادات، ومساحة العمل تعيش على مضيف Gateway
      (`~/.openclaw` + دليل مساحة عملك).
    - **بعيد بحكم الضرورة:** الرسائل التي ترسلها إلى موفري النماذج (Anthropic/OpenAI/إلخ) تذهب إلى
      واجهات API الخاصة بهم، ومنصات الدردشة (WhatsApp/Telegram/Slack/إلخ) تخزن بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في الأثر:** استخدام النماذج المحلية يُبقي المطالبات على جهازك، لكن حركة مرور القناة
      ما زالت تمر عبر خوادم القناة.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    كل شيء يعيش تحت `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | المسار                                                          | الغرض                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | الإعداد الرئيسي (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | استيراد OAuth قديم (يُنسخ إلى ملفات تعريف المصادقة عند أول استخدام) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات تعريف المصادقة (OAuth، ومفاتيح API، و`keyRef`/`tokenRef` اختياريًا) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | حمولة أسرار اختيارية مدعومة بملف لموفري SecretRef من نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ملف توافق قديم (تُزال منه إدخالات `api_key` الثابتة)             |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | حالة الموفر (مثل `whatsapp/<accountId>/creds.json`)               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | حالة كل وكيل (agentDir + الجلسات)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | سجل المحادثات والحالة (لكل وكيل)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | بيانات تعريف الجلسة (لكل وكيل)                                    |

    مسار الوكيل المفرد القديم: `~/.openclaw/agent/*` (يرحّله `openclaw doctor`).

    **مساحة عملك** (AGENTS.md، وملفات الذاكرة، وSkills، وما إلى ذلك) منفصلة وتُضبط عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    تعيش هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: `AGENTS.md`، و`SOUL.md`، و`IDENTITY.md`، و`USER.md`,
      و`MEMORY.md`، و`memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` اختياري.
      ملف الجذر بالحروف الصغيرة `memory.md` هو إدخال إصلاح قديم فقط؛ يستطيع `openclaw doctor --fix`
      دمجه في `MEMORY.md` عندما يكون كلا الملفين موجودين.
    - **دليل الحالة (`~/.openclaw`)**: الإعدادات، وحالة القناة/الموفر، وملفات تعريف المصادقة، والجلسات، والسجلات،
      وSkills المشتركة (`~/.openclaw/skills`).

    مساحة العمل الافتراضية هي `~/.openclaw/workspace`، وقابلة للضبط عبر:

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

  <Accordion title="هل يمكنني تكبير SOUL.md؟">
    نعم. `SOUL.md` هو أحد ملفات تمهيد مساحة العمل التي تُحقن في
    سياق الوكيل. حد الحقن الافتراضي لكل ملف هو `20000` حرف،
    وإجمالي ميزانية التمهيد عبر الملفات هو `60000` حرف.

    غيّر الافتراضيات المشتركة في إعداد OpenClaw لديك:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    أو تجاوز الإعداد لوكيل واحد:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    استخدم `/context` للتحقق من الأحجام الخام مقابل المحقونة وما إذا حدث اقتطاع.
    أبقِ `SOUL.md` مركزًا على الصوت، والموقف، والشخصية؛ وضع قواعد التشغيل
    في `AGENTS.md` والحقائق الدائمة في الذاكرة.

    راجع [السياق](/ar/concepts/context) و[إعداد الوكيل](/ar/gateway/config-agents).

  </Accordion>

  <Accordion title="استراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** في مستودع git **خاص** وانسخها احتياطيًا في مكان
    خاص (مثل GitHub الخاص). يلتقط هذا الذاكرة + ملفات AGENTS/SOUL/USER،
    ويتيح لك استعادة "عقل" المساعد لاحقًا.

    لا **تُودع** أي شيء تحت `~/.openclaw` (بيانات الاعتماد، أو الجلسات، أو الرموز، أو حمولات الأسرار المشفرة).
    إذا كنت تحتاج إلى استعادة كاملة، فانسخ كلًا من مساحة العمل ودليل الحالة احتياطيًا
    بشكل منفصل (راجع سؤال الترحيل أعلاه).

    الوثائق: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف أزيل تثبيت OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إزالة التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. مساحة العمل هي **cwd الافتراضي** ومرساة الذاكرة، وليست صندوق عزل صارمًا.
    تُحل المسارات النسبية داخل مساحة العمل، لكن المسارات المطلقة يمكنها الوصول إلى مواقع أخرى
    على المضيف ما لم يكن العزل مفعّلًا. إذا كنت تحتاج إلى عزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات العزل لكل وكيل. إذا كنت
    تريد أن يكون مستودع ما هو دليل العمل الافتراضي، فوجّه `workspace` لذلك الوكيل
    إلى جذر المستودع. مستودع OpenClaw هو مجرد كود مصدر؛ أبقِ
    مساحة العمل منفصلة إلا إذا كنت تريد عمدًا أن يعمل الوكيل داخله.

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

  <Accordion title="الوضع البعيد: أين يوجد مخزن الجلسة؟">
    حالة الجلسة يملكها **مضيف gateway**. إذا كنت في الوضع البعيد، فإن مخزن الجلسة الذي يهمك موجود على الجهاز البعيد، وليس حاسوبك المحمول المحلي. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>
</AccordionGroup>

## أساسيات الإعداد

<AccordionGroup>
  <Accordion title="ما تنسيق الإعداد؟ وأين يوجد؟">
    يقرأ OpenClaw إعداد **JSON5** اختياريًا من `$OPENCLAW_CONFIG_PATH` (الافتراضي: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    إذا كان الملف مفقودًا، يستخدم افتراضيات آمنة نسبيًا (بما في ذلك مساحة عمل افتراضية هي `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='ضبطت gateway.bind: "lan" (أو "tailnet") والآن لا شيء يستمع / الواجهة تقول غير مصرح'>
    الارتباطات غير loopback **تتطلب مسار مصادقة gateway صالحًا**. عمليًا يعني ذلك:

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

    - `gateway.remote.token` / `.password` لا **تفعّل** مصادقة gateway المحلية بمفردها.
    - يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كاحتياطي فقط عندما يكون `gateway.auth.*` غير مضبوط.
    - لمصادقة كلمة المرور، اضبط بدلًا من ذلك `gateway.auth.mode: "password"` مع `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا كان `gateway.auth.token` / `gateway.auth.password` مضبوطًا صراحة عبر SecretRef وتعذر حله، يفشل الحل بإغلاق آمن (بدون إخفاء عبر احتياطي بعيد).
    - إعدادات Control UI ذات السر المشترك تصادق عبر `connect.params.auth.token` أو `connect.params.auth.password` (مخزنة في إعدادات التطبيق/الواجهة). الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy` تستخدم ترويسات الطلب بدلًا من ذلك. تجنب وضع الأسرار المشتركة في عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، تتطلب وكلاء loopback العكسية على المضيف نفسه ضبط `gateway.auth.trustedProxy.allowLoopback = true` صراحة وإدخال loopback في `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="لماذا أحتاج إلى رمز على localhost الآن؟">
    يفرض OpenClaw مصادقة gateway افتراضيًا، بما في ذلك loopback. في المسار الافتراضي العادي يعني ذلك مصادقة الرمز: إذا لم يُضبط مسار مصادقة صريح، تُحل بداية gateway إلى وضع الرمز وتولّد رمزًا خاصًا بزمن التشغيل لذلك التشغيل، لذلك **يجب على عملاء WS المحليين المصادقة**. اضبط `gateway.auth.token`، أو `gateway.auth.password`، أو `OPENCLAW_GATEWAY_TOKEN`، أو `OPENCLAW_GATEWAY_PASSWORD` صراحة عندما يحتاج العملاء إلى سر ثابت عبر عمليات إعادة التشغيل. يمنع هذا العمليات المحلية الأخرى من استدعاء Gateway.

    إذا كنت تفضّل مسار مصادقة مختلفًا، يمكنك اختيار وضع كلمة المرور صراحةً (أو `trusted-proxy` لوكلاء عكسيين مدركين للهوية). إذا كنت تريد **حقًا** فتح local loopback، فعيّن `gateway.auth.mode: "none"` صراحةً في إعداداتك. يستطيع Doctor إنشاء رمز لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب عليّ إعادة التشغيل بعد تغيير الإعدادات؟">
    يراقب Gateway الإعدادات ويدعم إعادة التحميل الساخنة:

    - `gateway.reload.mode: "hybrid"` (الافتراضي): يطبّق التغييرات الآمنة ساخنًا، ويعيد التشغيل للتغييرات الحرجة
    - `hot` و`restart` و`off` مدعومة أيضًا

  </Accordion>

  <Accordion title="كيف أعطّل العبارات الطريفة في CLI؟">
    عيّن `cli.banner.taglineMode` في الإعدادات:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: يخفي نص العبارة مع إبقاء سطر عنوان اللافتة/الإصدار.
    - `default`: يستخدم `All your chats, one OpenClaw.` في كل مرة.
    - `random`: عبارات طريفة/موسمية متناوبة (السلوك الافتراضي).
    - إذا كنت لا تريد أي لافتة إطلاقًا، فعيّن متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="كيف أفعّل بحث الويب (وجلب الويب)؟">
    يعمل `web_fetch` من دون مفتاح API. يعتمد `web_search` على المزوّد المحدد لديك:

    - يتطلب المزوّدون المدعومون بواجهة API مثل Brave وExa وFirecrawl وGemini وKimi وMiniMax Search وPerplexity وTavily إعداد مفتاح API المعتاد لديهم.
    - يستطيع Grok إعادة استخدام xAI OAuth من مصادقة النموذج، أو الرجوع إلى `XAI_API_KEY` / إعدادات بحث الويب في Plugin.
    - بحث الويب في Ollama لا يحتاج إلى مفتاح، لكنه يستخدم مضيف Ollama المضبوط لديك ويتطلب `ollama signin`.
    - DuckDuckGo لا يحتاج إلى مفتاح، لكنه تكامل غير رسمي قائم على HTML.
    - SearXNG لا يحتاج إلى مفتاح/مستضاف ذاتيًا؛ اضبط `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

    **موصى به:** شغّل `openclaw configure --section web` واختر مزوّدًا.
    بدائل البيئة:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: xAI OAuth، `XAI_API_KEY`
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

    تعيش إعدادات بحث الويب الخاصة بكل مزوّد الآن تحت `plugins.entries.<plugin>.config.webSearch.*`.
    لا تزال مسارات المزوّد القديمة `tools.web.search.*` تُحمّل مؤقتًا للتوافق، لكن لا ينبغي استخدامها للإعدادات الجديدة.
    تعيش إعدادات الرجوع لجلب الويب في Firecrawl تحت `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم السماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - يكون `web_fetch` مفعّلًا افتراضيًا (ما لم يُعطّل صراحةً).
    - إذا حُذف `tools.web.fetch.provider`، يكتشف OpenClaw تلقائيًا أول مزوّد رجوع جاهز للجلب من بيانات الاعتماد المتاحة. يوفر Plugin Firecrawl الرسمي ذلك الرجوع.
    - تقرأ الخدمات الخفية متغيرات البيئة من `~/.openclaw/.env` (أو من بيئة الخدمة).

    المستندات: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="مسح config.apply إعداداتي. كيف أستعيدها وأتجنب ذلك؟">
    يستبدل `config.apply` **الإعدادات كاملةً**. إذا أرسلت كائنًا جزئيًا، فسيُزال كل شيء آخر.

    يحمي OpenClaw الحالي من كثير من عمليات المسح العرضية:

    - تتحقق عمليات كتابة الإعدادات المملوكة لـ OpenClaw من الإعدادات الكاملة بعد التغيير قبل الكتابة.
    - تُرفض كتابات OpenClaw غير الصالحة أو المدمّرة وتُحفظ باسم `openclaw.json.rejected.*`.
    - إذا كسر تعديل مباشر بدء التشغيل أو إعادة التحميل الساخنة، يفشل Gateway مغلقًا أو يتجاوز إعادة التحميل؛ ولا يعيد كتابة `openclaw.json`.
    - يمتلك `openclaw doctor --fix` الإصلاح ويمكنه استعادة آخر إعدادات سليمة مع حفظ الملف المرفوض باسم `openclaw.json.clobbered.*`.

    الاستعادة:

    - تحقق من `openclaw logs --follow` بحثًا عن `Invalid config at` أو `Config write rejected:` أو `config reload skipped (invalid config)`.
    - افحص أحدث `openclaw.json.clobbered.*` أو `openclaw.json.rejected.*` بجوار الإعداد النشط.
    - شغّل `openclaw config validate` و`openclaw doctor --fix`.
    - انسخ المفاتيح المقصودة فقط مرة أخرى باستخدام `openclaw config set` أو `config.patch`.
    - إذا لم تكن لديك آخر إعدادات سليمة أو حمولة مرفوضة، فاستعد من نسخة احتياطية، أو أعد تشغيل `openclaw doctor` وأعد ضبط القنوات/النماذج.
    - إذا كان هذا غير متوقع، فأبلغ عن خطأ وأرفق آخر إعدادات معروفة لديك أو أي نسخة احتياطية.
    - يستطيع وكيل برمجة محلي غالبًا إعادة بناء إعدادات عاملة من السجلات أو السجل.

    تجنبه:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` للتعديلات التفاعلية.
    - استخدم `config.schema.lookup` أولًا عندما لا تكون متأكدًا من مسار دقيق أو شكل حقل؛ فهو يُرجع عقدة مخطط سطحية مع ملخصات الأبناء المباشرين للتنقّل المتدرج.
    - استخدم `config.patch` لتعديلات RPC الجزئية؛ وأبقِ `config.apply` لاستبدال الإعدادات الكاملة فقط.
    - إذا كنت تستخدم أداة `gateway` المواجهة للوكيل من تشغيل وكيل، فستظل ترفض الكتابة إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك الأسماء المستعارة القديمة `tools.bash.*` التي تُطبّع إلى مسارات التنفيذ المحمية نفسها).

    المستندات: [الإعدادات](/ar/cli/config)، [التهيئة](/ar/cli/configure)، [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغّل Gateway مركزيًا مع عمال متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحد** (مثل Raspberry Pi) مع **عُقد** و**وكلاء**:

    - **Gateway (مركزي):** يمتلك القنوات (Signal/WhatsApp)، والتوجيه، والجلسات.
    - **العُقد (الأجهزة):** تتصل أجهزة Mac/iOS/Android كأطراف وتكشف أدوات محلية (`system.run` و`canvas` و`camera`).
    - **الوكلاء (العمال):** عقول/مساحات عمل منفصلة لأدوار خاصة (مثل "عمليات Hetzner" و"البيانات الشخصية").
    - **الوكلاء الفرعيون:** يشغّلون عملًا في الخلفية من وكيل رئيسي عندما تريد التوازي.
    - **TUI:** اتصل بـ Gateway وبدّل بين الوكلاء/الجلسات.

    المستندات: [العُقد](/ar/nodes)، [الوصول البعيد](/ar/gateway/remote)، [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/ar/web/tui).

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

    الافتراضي هو `false` (بواجهة مرئية). يزيد وضع بلا واجهة احتمال تفعيل فحوصات مكافحة الروبوتات في بعض المواقع. راجع [المتصفح](/ar/tools/browser).

    يستخدم وضع بلا واجهة **محرك Chromium نفسه** ويعمل لمعظم الأتمتة (النماذج، النقرات، الاستخلاص، تسجيلات الدخول). الاختلافات الرئيسية:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات شاشة إذا احتجت إلى مرئيات).
    - بعض المواقع أكثر تشددًا بشأن الأتمتة في وضع بلا واجهة (CAPTCHA، مكافحة الروبوتات).
      على سبيل المثال، غالبًا ما يحظر X/Twitter الجلسات بلا واجهة.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    عيّن `browser.executablePath` إلى ملف Brave الثنائي لديك (أو أي متصفح قائم على Chromium) وأعد تشغيل Gateway.
    راجع أمثلة الإعداد الكاملة في [المتصفح](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## البوابات والعُقد البعيدة

<AccordionGroup>
  <Accordion title="كيف تنتقل الأوامر بين Telegram وGateway والعُقد؟">
    يتعامل **gateway** مع رسائل Telegram. يشغّل gateway الوكيل ثم
    يستدعي العُقد عبر **Gateway WebSocket** فقط عندما تكون أداة عقدة مطلوبة:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    لا ترى العُقد حركة المزوّد الواردة؛ فهي تتلقى فقط استدعاءات RPC الخاصة بالعُقد.

  </Accordion>

  <Accordion title="كيف يستطيع وكيلي الوصول إلى حاسوبي إذا كان Gateway مستضافًا عن بُعد؟">
    الإجابة المختصرة: **أقرن حاسوبك كعقدة**. يعمل Gateway في مكان آخر، لكنه يستطيع
    استدعاء أدوات `node.*` (الشاشة، الكاميرا، النظام) على جهازك المحلي عبر Gateway WebSocket.

    إعداد نموذجي:

    1. شغّل Gateway على المضيف الدائم التشغيل (VPS/خادم منزلي).
    2. ضع مضيف Gateway وحاسوبك على شبكة tailnet نفسها.
    3. تأكد من أن Gateway WS قابل للوصول (ربط tailnet أو نفق SSH).
    4. افتح تطبيق macOS محليًا واتصل في وضع **Remote over SSH** (أو tailnet مباشر)
       حتى يتمكن من التسجيل كعقدة.
    5. وافق على العقدة في Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا يلزم جسر TCP منفصل؛ تتصل العُقد عبر Gateway WebSocket.

    تذكير أمني: إقران عقدة macOS يسمح بـ `system.run` على ذلك الجهاز. لا
    تقرن إلا الأجهزة التي تثق بها، وراجع [الأمان](/ar/gateway/security).

    المستندات: [العُقد](/ar/nodes)، [بروتوكول Gateway](/ar/gateway/protocol)، [وضع macOS البعيد](/ar/platforms/mac/remote)، [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل لكنني لا أتلقى ردودًا. ماذا الآن؟">
    تحقق من الأساسيات:

    - Gateway يعمل: `openclaw gateway status`
    - صحة Gateway: `openclaw status`
    - صحة القناة: `openclaw channels status`

    ثم تحقق من المصادقة والتوجيه:

    - إذا كنت تستخدم Tailscale Serve، فتأكد من ضبط `gateway.auth.allowTailscale` بشكل صحيح.
    - إذا كنت تتصل عبر نفق SSH، فتأكد من أن النفق المحلي يعمل ويشير إلى المنفذ الصحيح.
    - تأكد من أن قوائم السماح لديك (رسالة مباشرة أو مجموعة) تتضمن حسابك.

    المستندات: [Tailscale](/ar/gateway/tailscale)، [الوصول البعيد](/ar/gateway/remote)، [القنوات](/ar/channels).

  </Accordion>

  <Accordion title="هل يمكن لمثيلي OpenClaw التحدث معًا (محلي + VPS)؟">
    نعم. لا يوجد جسر "روبوت إلى روبوت" مدمج، لكن يمكنك توصيله بعدة
    طرق موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يمكن لكلا الروبوتين الوصول إليها (Telegram/Slack/WhatsApp).
    اجعل الروبوت A يرسل رسالة إلى الروبوت B، ثم دع الروبوت B يرد كالمعتاد.

    **جسر CLI (عام):** شغّل سكربتًا يستدعي Gateway الآخر باستخدام
    `openclaw agent --message ... --deliver`، مستهدفًا دردشة يستمع إليها الروبوت الآخر.
    إذا كان أحد الروبوتين على VPS بعيد، فوجّه CLI لديك إلى ذلك Gateway البعيد
    عبر SSH/Tailscale (راجع [الوصول البعيد](/ar/gateway/remote)).

    نمط مثال (شغّله من جهاز يستطيع الوصول إلى Gateway الهدف):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف حاجز حماية حتى لا يدخل الروبوتان في حلقة لا نهائية (الرد عند الذكر فقط، أو
    قوائم سماح للقنوات، أو قاعدة "لا ترد على رسائل الروبوتات").

    المستندات: [الوصول البعيد](/ar/gateway/remote)، [CLI الوكيل](/ar/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى VPS منفصلة لعدة وكلاء؟">
    لا. يستطيع Gateway واحد استضافة عدة وكلاء، لكل منهم مساحة عمله الخاصة، وافتراضات النموذج،
    والتوجيه. هذا هو الإعداد الطبيعي، وهو أرخص وأبسط بكثير من تشغيل
    VPS واحد لكل وكيل.

    استخدم VPS منفصلة فقط عندما تحتاج إلى عزل صارم (حدود أمان) أو إعدادات
    مختلفة جدًا لا تريد مشاركتها. بخلاف ذلك، احتفظ بـ Gateway واحد واستخدم
    عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل هناك فائدة من استخدام عقدة على حاسوبي المحمول الشخصي بدلًا من SSH من VPS؟">
    نعم - العقد هي الطريقة الأساسية للوصول إلى حاسوبك المحمول من Gateway بعيد، وهي
    تتيح أكثر من الوصول إلى الصدفة. يعمل Gateway على macOS/Linux (وWindows عبر WSL2) وهو
    خفيف الوزن (يكفي VPS صغير أو جهاز بمستوى Raspberry Pi؛ وذاكرة RAM بسعة 4 GB كافية جدًا)، لذا يكون الإعداد الشائع
    مضيفًا يعمل دائمًا إضافة إلى حاسوبك المحمول كعقدة.

    - **لا حاجة إلى SSH وارد.** تتصل العقد خارجيًا بـ Gateway WebSocket وتستخدم إقران الأجهزة.
    - **عناصر تحكم تنفيذ أكثر أمانًا.** يخضع `system.run` لقوائم السماح/الموافقات الخاصة بالعقدة على ذلك الحاسوب المحمول.
    - **أدوات أجهزة أكثر.** تعرض العقد `canvas` و`camera` و`screen` إضافة إلى `system.run`.
    - **أتمتة المتصفح المحلي.** أبقِ Gateway على VPS، وشغّل Chrome محليًا عبر مضيف عقدة على الحاسوب المحمول، أو اتصل بـ Chrome المحلي على المضيف عبر Chrome MCP.

    يكون SSH مناسبًا للوصول العارض إلى الصدفة، لكن العقد أبسط لسير عمل الوكلاء المستمر
    وأتمتة الأجهزة.

    الوثائق: [العقد](/ar/nodes)، [CLI العقد](/ar/cli/nodes)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تشغّل العقد خدمة Gateway؟">
    لا. يجب تشغيل **Gateway واحد فقط** لكل مضيف ما لم تشغّل ملفات تعريف معزولة عن قصد (راجع [بوابات متعددة](/ar/gateway/multiple-gateways)). العقد ملحقات تتصل
    بـ Gateway (عقد iOS/Android، أو "وضع العقدة" في macOS ضمن تطبيق شريط القوائم). لمضيفي العقد
    بلا واجهة والتحكم عبر CLI، راجع [CLI مضيف Node](/ar/cli/node).

    يلزم إعادة تشغيل كاملة لتغييرات أسطح `gateway` و`discovery` وPlugin المستضاف.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق الإعدادات؟">
    نعم.

    - `config.schema.lookup`: افحص شجرة فرعية واحدة من الإعدادات مع عقدة مخططها السطحية، وتلميح واجهة المستخدم المطابق، وملخصات الأبناء المباشرين قبل الكتابة
    - `config.get`: اجلب اللقطة الحالية + التجزئة
    - `config.patch`: تحديث جزئي آمن (مفضّل لمعظم تعديلات RPC)؛ يعيد التحميل الساخن عند الإمكان ويعيد التشغيل عند اللزوم
    - `config.apply`: تحقّق + استبدل الإعدادات الكاملة؛ يعيد التحميل الساخن عند الإمكان ويعيد التشغيل عند اللزوم
    - لا تزال أداة وقت التشغيل `gateway` الموجّهة إلى الوكيل ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ وتُطبّع أسماء `tools.bash.*` المستعارة القديمة إلى مسارات exec المحمية نفسها

  </Accordion>

  <Accordion title="إعداد معقول بالحد الأدنى للتثبيت الأول">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    يضبط هذا مساحة عملك ويقيّد من يمكنه تشغيل البوت.

  </Accordion>

  <Accordion title="كيف أُعد Tailscale على VPS وأتصل من جهاز Mac؟">
    الخطوات الدنيا:

    1. **ثبّت + سجّل الدخول على VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ثبّت + سجّل الدخول على جهاز Mac**
       - استخدم تطبيق Tailscale وسجّل الدخول إلى شبكة tailnet نفسها.
    3. **فعّل MagicDNS (موصى به)**
       - في وحدة تحكم إدارة Tailscale، فعّل MagicDNS ليحصل VPS على اسم ثابت.
    4. **استخدم اسم مضيف tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا كنت تريد Control UI من دون SSH، فاستخدم Tailscale Serve على VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    يبقي هذا Gateway مربوطًا بـ local loopback ويعرض HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أصل عقدة Mac بـ Gateway بعيد (Tailscale Serve)؟">
    يعرض Serve **Control UI لـ Gateway + WS**. تتصل العقد عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكد من أن VPS + Mac على شبكة tailnet نفسها**.
    2. **استخدم تطبيق macOS في الوضع البعيد** (يمكن أن يكون هدف SSH هو اسم مضيف tailnet).
       سيُنشئ التطبيق نفقًا لمنفذ Gateway ويتصل كعقدة.
    3. **وافق على العقدة** على Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    الوثائق: [بروتوكول Gateway](/ar/gateway/protocol)، [الاكتشاف](/ar/gateway/discovery)، [الوضع البعيد في macOS](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل يجب أن أثبّت على حاسوب محمول ثانٍ أم أضيف عقدة فقط؟">
    إذا كنت تحتاج فقط إلى **أدوات محلية** (screen/camera/exec) على الحاسوب المحمول الثاني، فأضفه كـ
    **عقدة**. يحافظ ذلك على Gateway واحد ويتجنب تكرار الإعدادات. أدوات العقد المحلية
    متاحة حاليًا لـ macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    ثبّت Gateway ثانيًا فقط عندما تحتاج إلى **عزل صارم** أو بوتين منفصلين بالكامل.

    الوثائق: [العقد](/ar/nodes)، [CLI العقد](/ar/cli/nodes)، [بوابات متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات البيئة وتحميل .env

<AccordionGroup>
  <Accordion title="كيف يحمّل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات البيئة من العملية الأم (الصدفة، launchd/systemd، CI، إلخ) ويحمّل أيضًا:

    - `.env` من دليل العمل الحالي
    - ملف `.env` احتياطيًا عامًا من `~/.openclaw/.env` (أي `$OPENCLAW_STATE_DIR/.env`)

    لا يتجاوز أي من ملفي `.env` متغيرات البيئة الموجودة.
    متغيرات بيانات اعتماد المزوّد استثناء لملف `.env` في مساحة العمل: يتم تجاهل مفاتيح مثل
    `GEMINI_API_KEY` أو `XAI_API_KEY` أو `MISTRAL_API_KEY` من ملف
    `.env` في مساحة العمل ويجب أن تكون في بيئة العملية، أو `~/.openclaw/.env`، أو `env` في الإعدادات.

    يمكنك أيضًا تعريف متغيرات بيئة مضمنة في الإعدادات (تُطبّق فقط إذا كانت مفقودة من بيئة العملية):

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

  <Accordion title="بدأت Gateway عبر الخدمة واختفت متغيرات البيئة لدي. ماذا الآن؟">
    حلّان شائعان:

    1. ضع المفاتيح المفقودة في `~/.openclaw/.env` ليتم التقاطها حتى عندما لا ترث الخدمة بيئة الصدفة لديك.
    2. فعّل استيراد الصدفة (ميزة اختيارية):

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

    يشغّل هذا صدفة تسجيل الدخول لديك ويستورد فقط المفاتيح المتوقعة المفقودة (ولا يتجاوز أبدًا). مكافئات متغيرات البيئة:
    `OPENCLAW_LOAD_SHELL_ENV=1`، `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='عيّنت COPILOT_GITHUB_TOKEN، لكن حالة النماذج تعرض "Shell env: off." لماذا؟'>
    يبلّغ `openclaw models status` عما إذا كان **استيراد بيئة الصدفة** مفعّلًا. لا تعني "Shell env: off"
    أن متغيرات البيئة لديك مفقودة - بل تعني فقط أن OpenClaw لن يحمّل
    صدفة تسجيل الدخول لديك تلقائيًا.

    إذا كان Gateway يعمل كخدمة (launchd/systemd)، فلن يرث بيئة
    الصدفة لديك. أصلح ذلك بإحدى الطرق التالية:

    1. ضع الرمز المميز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد الصدفة (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في إعداداتك (يُطبّق فقط إذا كان مفقودًا).

    ثم أعد تشغيل Gateway وتحقق مرة أخرى:

    ```bash
    openclaw models status
    ```

    تُقرأ رموز Copilot من `COPILOT_GITHUB_TOKEN` (وكذلك `GH_TOKEN` / `GITHUB_TOKEN`).
    راجع [/concepts/model-providers](/ar/concepts/model-providers) و[/environment](/ar/help/environment).

  </Accordion>
</AccordionGroup>

## الجلسات والمحادثات المتعددة

<AccordionGroup>
  <Accordion title="كيف أبدأ محادثة جديدة؟">
    أرسل `/new` أو `/reset` كرسالة مستقلة. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>

  <Accordion title="هل تُعاد الجلسات تلقائيًا إذا لم أرسل /new أبدًا؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا **معطّل افتراضيًا** (القيمة الافتراضية **0**).
    اضبطه على قيمة موجبة لتفعيل انتهاء الصلاحية عند الخمول. عند تفعيله، تبدأ **الرسالة التالية**
    بعد فترة الخمول معرّف جلسة جديدًا لمفتاح تلك الدردشة.
    لا يحذف هذا النصوص المسجلة - بل يبدأ جلسة جديدة فقط.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="هل توجد طريقة لإنشاء فريق من مثيلات OpenClaw (رئيس تنفيذي واحد والعديد من الوكلاء)؟">
    نعم، عبر **التوجيه متعدد الوكلاء** و**الوكلاء الفرعيين**. يمكنك إنشاء وكيل منسّق واحد
    وعدة وكلاء عاملين بمساحات عمل ونماذج خاصة بهم.

    ومع ذلك، من الأفضل النظر إلى هذا باعتباره **تجربة ممتعة**. فهو يستهلك رموزًا كثيرة وغالبًا
    يكون أقل كفاءة من استخدام بوت واحد مع جلسات منفصلة. النموذج المعتاد الذي
    نتصوره هو بوت واحد تتحدث إليه، مع جلسات مختلفة للعمل المتوازي. ويمكن لذلك
    البوت أيضًا إنشاء وكلاء فرعيين عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [CLI الوكلاء](/ar/cli/agents).

  </Accordion>

  <Accordion title="لماذا تم اقتطاع السياق في منتصف المهمة؟ كيف أمنع ذلك؟">
    سياق الجلسة محدود بنافذة النموذج. يمكن للدردشات الطويلة، أو مخرجات الأدوات الكبيرة، أو الملفات
    الكثيرة أن تؤدي إلى Compaction أو الاقتطاع.

    ما يساعد:

    - اطلب من البوت تلخيص الحالة الحالية وكتابتها إلى ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل المواضيع.
    - احتفظ بالسياق المهم في مساحة العمل واطلب من البوت قراءته مجددًا.
    - استخدم الوكلاء الفرعيين للعمل الطويل أو المتوازي حتى تبقى الدردشة الرئيسية أصغر.
    - اختر نموذجًا بنافذة سياق أكبر إذا حدث ذلك كثيرًا.

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

    - يوفر الإعداد أيضًا **إعادة ضبط** إذا اكتشف إعدادات موجودة. راجع [الإعداد الأولي (CLI)](/ar/start/wizard).
    - إذا استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد ضبط كل دليل حالة (الافتراضيات هي `~/.openclaw-<profile>`).
    - إعادة ضبط التطوير: `openclaw gateway --dev --reset` (للتطوير فقط؛ يمسح إعدادات التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='تظهر لي أخطاء "context too large" - كيف أعيد الضبط أو أضغط السياق؟'>
    استخدم أحد هذه الخيارات:

    - **Compaction** (يبقي المحادثة لكنه يلخص الأدوار القديمة):

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
    هذا خطأ تحقق من المزوّد: أصدر النموذج كتلة `tool_use` من دون
    `input` المطلوب. يعني ذلك عادة أن سجل الجلسة قديم أو تالف (غالبًا بعد سلاسل طويلة
    أو تغيير في أداة/مخطط).

    الإصلاح: ابدأ جلسة جديدة باستخدام `/new` (رسالة مستقلة).

  </Accordion>

  <Accordion title="لماذا أتلقى رسائل Heartbeat كل 30 دقيقة؟">
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

    إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ عمليًا (يحتوي فقط على أسطر فارغة،
    أو تعليقات Markdown/HTML، أو عناوين Markdown مثل `# Heading`، أو علامات الأسوار،
    أو قوالب قوائم تحقق فارغة)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API.
    إذا كان الملف مفقودًا، فسيظل Heartbeat يعمل ويقرر النموذج ما يجب فعله.

    تستخدم التجاوزات لكل وكيل `agents.list[].heartbeat`. المستندات: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل أحتاج إلى إضافة "حساب بوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك أنت**، لذلك إذا كنت في المجموعة، يستطيع OpenClaw رؤيتها.
    افتراضيًا، تُحظر الردود في المجموعات حتى تسمح للمرسلين (`groupPolicy: "allowlist"`).

    إذا كنت تريد أن تكون **أنت فقط** قادرًا على تشغيل ردود المجموعة:

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
    الخيار 1 (الأسرع): راقب السجلات وأرسل رسالة اختبارية في المجموعة:

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

    - بوابة الإشارة قيد التشغيل (افتراضيًا). يجب أن تشير إلى البوت بـ @mention (أو تطابق `mentionPatterns`).
    - ضبطت `channels.whatsapp.groups` من دون `"*"` والمجموعة ليست في قائمة السماح.

    راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشارك المجموعات/المحادثات المتفرعة السياق مع الرسائل الخاصة؟">
    تُدمج الدردشات المباشرة في الجلسة الرئيسية افتراضيًا. للمجموعات/القنوات مفاتيح جلسات خاصة بها، ومواضيع Telegram / محادثات Discord المتفرعة هي جلسات منفصلة. راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم عدد مساحات العمل والوكلاء الذين يمكنني إنشاؤهم؟">
    لا توجد حدود صارمة. العشرات (حتى المئات) مقبولة، لكن انتبه إلى:

    - **نمو القرص:** الجلسات + النصوص الحرفية موجودة تحت `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** المزيد من الوكلاء يعني استخدامًا متزامنًا أكبر للنماذج.
    - **عبء العمليات:** ملفات تعريف المصادقة، ومساحات العمل، وتوجيه القنوات لكل وكيل.

    نصائح:

    - احتفظ بمساحة عمل **نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - شذّب الجلسات القديمة (احذف JSONL أو مدخلات التخزين) إذا زاد استخدام القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل الشاردة وعدم تطابق ملفات التعريف.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة بوتات أو دردشات في الوقت نفسه (Slack)، وكيف ينبغي إعداد ذلك؟">
    نعم. استخدم **توجيه الوكلاء المتعددين** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة حسب
    القناة/الحساب/النظير. Slack مدعوم كقناة ويمكن ربطه بوكلاء محددين.

    الوصول إلى المتصفح قوي لكنه ليس "يفعل أي شيء يستطيع الإنسان فعله" - يمكن أن تظل آليات مكافحة البوتات، وCAPTCHAs، وMFA
    تعيق الأتمتة. للحصول على تحكم متصفح أكثر موثوقية، استخدم Chrome MCP المحلي على المضيف،
    أو استخدم CDP على الجهاز الذي يشغّل المتصفح فعليًا.

    إعداد أفضل الممارسات:

    - مضيف Gateway يعمل دائمًا (VPS/Mac mini).
    - وكيل واحد لكل دور (ارتباطات).
    - قناة/قنوات Slack مرتبطة بهؤلاء الوكلاء.
    - متصفح محلي عبر Chrome MCP أو عقدة عند الحاجة.

    المستندات: [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)، [Slack](/ar/channels/slack)،
    [المتصفح](/ar/tools/browser)، [العقد](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج، وتجاوز الفشل، وملفات تعريف المصادقة

أسئلة وأجوبة النماذج — الإعدادات الافتراضية، والاختيار، والأسماء البديلة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة —
موجودة في [الأسئلة الشائعة حول النماذج](/ar/help/faq-models).

## Gateway: المنافذ، و"يعمل بالفعل"، والوضع البعيد

<AccordionGroup>
  <Accordion title="أي منفذ يستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ الواحد متعدد الاستخدامات لـ WebSocket + HTTP (واجهة التحكم، والخطافات، وما إلى ذلك).

    الأسبقية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا يقول openclaw gateway status "Runtime: running" لكن "Connectivity probe: failed"؟'>
    لأن "running" هو منظور **المشرف** (launchd/systemd/schtasks). أما فحص الاتصال فهو CLI وهو يتصل فعليًا بـ WebSocket الخاص بالـ gateway.

    استخدم `openclaw gateway status` وثق بهذه الأسطر:

    - `Probe target:` (عنوان URL الذي استخدمه الفحص فعليًا)
    - `Listening:` (ما هو مرتبط فعليًا بالمنفذ)
    - `Last gateway error:` (السبب الجذري الشائع عندما تكون العملية حية لكن المنفذ لا يستمع)

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status قيمتي "Config (cli)" و"Config (service)" مختلفتين؟'>
    أنت تعدّل ملف إعدادات بينما تعمل الخدمة بملف آخر (غالبًا بسبب عدم تطابق `--profile` / `OPENCLAW_STATE_DIR`).

    الإصلاح:

    ```bash
    openclaw gateway install --force
    ```

    شغّل ذلك من نفس `--profile` / البيئة التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ماذا يعني "another gateway instance is already listening"؟'>
    يفرض OpenClaw قفل تشغيل عبر ربط مستمع WebSocket فورًا عند بدء التشغيل (افتراضيًا `ws://127.0.0.1:18789`). إذا فشل الربط مع `EADDRINUSE`، فإنه يرمي `GatewayLockError` مشيرًا إلى أن نسخة أخرى تستمع بالفعل.

    الإصلاح: أوقف النسخة الأخرى، أو حرر المنفذ، أو شغّل باستخدام `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="كيف أشغّل OpenClaw في الوضع البعيد (يتصل العميل بـ Gateway في مكان آخر)؟">
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

    - يبدأ `openclaw gateway` فقط عندما يكون `gateway.mode` هو `local` (أو تمرر علم التجاوز).
    - يراقب تطبيق macOS ملف الإعدادات ويبدّل الأوضاع مباشرة عند تغيّر هذه القيم.
    - `gateway.remote.token` / `.password` هي بيانات اعتماد بعيدة من جهة العميل فقط؛ ولا تفعّل مصادقة Gateway المحلي بمفردها.

  </Accordion>

  <Accordion title='تقول واجهة التحكم "unauthorized" (أو تستمر في إعادة الاتصال). ماذا الآن؟'>
    لا يتطابق مسار مصادقة Gateway لديك مع طريقة مصادقة الواجهة.

    حقائق (من الشيفرة):

    - تحتفظ واجهة التحكم بالرمز في `sessionStorage` لجلسة تبويب المتصفح الحالية وعنوان Gateway المحدد، لذلك تستمر عمليات التحديث في نفس التبويب في العمل من دون استعادة استمرار رمز localStorage طويل الأمد.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة محاولة محدودة واحدة باستخدام رمز جهاز مخزن مؤقتًا عندما يعيد Gateway تلميحات إعادة المحاولة (`canRetryWithDeviceToken=true`، `recommendedNextStep=retry_with_device_token`).
    - إعادة المحاولة بذلك الرمز المخزن مؤقتًا تعيد الآن استخدام النطاقات المعتمدة المخزنة مؤقتًا مع رمز الجهاز. لا يزال مستدعو `deviceToken` الصريح / `scopes` الصريح يحتفظون بمجموعة النطاقات المطلوبة بدلًا من وراثة النطاقات المخزنة مؤقتًا.
    - خارج مسار إعادة المحاولة ذاك، تكون أسبقية مصادقة الاتصال: الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز التمهيد.
    - يعيد تمهيد رمز الإعداد المدمج رمز جهاز عقدة مع `scopes: []` بالإضافة إلى رمز تسليم محدود للمشغل من أجل تهيئة موثوقة عبر الهاتف. يستطيع تسليم المشغل قراءة الإعدادات الأصلية وقت الإعداد لكنه لا يمنح نطاقات تعديل الاقتران أو `operator.admin`.

    الإصلاح:

    - الأسرع: `openclaw dashboard` (يطبع عنوان URL للوحة المعلومات وينسخه، ويحاول فتحه؛ ويعرض تلميح SSH إذا كان بلا واجهة).
    - إذا لم يكن لديك رمز بعد: `openclaw doctor --generate-gateway-token`.
    - إذا كان بعيدًا، أنشئ نفقًا أولًا: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع السر المشترك: اضبط `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم الصق السر المطابق في إعدادات واجهة التحكم.
    - وضع Tailscale Serve: تأكد من تفعيل `gateway.auth.allowTailscale` وأنك تفتح عنوان URL الخاص بـ Serve، وليس عنوان loopback/tailnet خامًا يتجاوز ترويسات هوية Tailscale.
    - وضع الوكيل الموثوق: تأكد من أنك تأتي عبر الوكيل المدرك للهوية المضبوط، وليس عبر عنوان Gateway خام. تحتاج وكلاء loopback على نفس المضيف أيضًا إلى `gateway.auth.trustedProxy.allowLoopback = true`.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، بدّل/أعد اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا قال استدعاء التبديل هذا إنه رُفض، فتحقق من أمرين:
      - يمكن لجلسات الجهاز المقترن تدوير جهازها **هي فقط** إلا إذا كان لديها أيضًا `operator.admin`
      - لا يمكن لقيم `--scope` الصريحة تجاوز نطاقات المشغل الحالية للمستدعي
    - ما زلت عالقًا؟ شغّل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [لوحة المعلومات](/ar/web/dashboard) لتفاصيل المصادقة.

  </Accordion>

  <Accordion title="ضبطت gateway.bind على tailnet لكنه لا يستطيع الربط ولا شيء يستمع">
    يختار ربط `tailnet` عنوان IP خاصًا بـ Tailscale من واجهات الشبكة لديك (100.64.0.0/10). إذا لم يكن الجهاز على Tailscale (أو كانت الواجهة معطلة)، فلا يوجد شيء يمكن الربط به.

    الإصلاح:

    - شغّل Tailscale على ذلك المضيف (بحيث يحصل على عنوان 100.x)، أو
    - بدّل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. يفضّل `auto` loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطًا خاصًا بـ tailnet فقط.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة Gateways على نفس المضيف؟">
    عادةً لا - يستطيع Gateway واحد تشغيل عدة قنوات مراسلة ووكلاء. استخدم عدة Gateways فقط عندما تحتاج إلى التكرار (مثل: بوت إنقاذ) أو العزل الصارم.

    نعم، لكن يجب عليك العزل:

    - `OPENCLAW_CONFIG_PATH` (إعدادات لكل نسخة)
    - `OPENCLAW_STATE_DIR` (حالة لكل نسخة)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (موصى به):

    - استخدم `openclaw --profile <name> ...` لكل نسخة (ينشئ تلقائيًا `~/.openclaw-<name>`).
    - اضبط `gateway.port` فريدًا في إعدادات كل ملف تعريف (أو مرر `--port` للتشغيل اليدوي).
    - ثبّت خدمة لكل ملف تعريف: `openclaw --profile <name> gateway install`.

    تضيف ملفات التعريف أيضًا لاحقة إلى أسماء الخدمات (`ai.openclaw.<profile>`؛ القديم `com.openclaw.*`، `openclaw-gateway-<profile>.service`، `OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [عدة gateways](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ماذا يعني "invalid handshake" / الرمز 1008؟'>
    Gateway هو **خادم WebSocket**، ويتوقع أن تكون أول رسالة تمامًا
    إطار `connect`. إذا تلقى أي شيء آخر، فإنه يغلق الاتصال
    مع **الرمز 1008** (انتهاك سياسة).

    أسباب شائعة:

    - فتحت عنوان **HTTP** في متصفح (`http://...`) بدلًا من عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - أزال وكيل أو نفق ترويسات المصادقة أو أرسل طلبًا غير خاص بـ Gateway.

    إصلاحات سريعة:

    1. استخدم عنوان WS: `ws://<host>:18789` (أو `wss://...` إذا كان HTTPS).
    2. لا تفتح منفذ WS في تبويب متصفح عادي.
    3. إذا كانت المصادقة مفعلة، فضمّن الرمز/كلمة المرور في إطار `connect`.

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

    يمكنك تعيين مسار ثابت عبر `logging.file`. يتحكم `logging.level` في مستوى سجل الملف. يتحكم `--verbose` و`logging.consoleLevel` في إسهاب وحدة التحكم.

    أسرع متابعة للسجل:

    ```bash
    openclaw logs --follow
    ```

    سجلات الخدمة/المشرف (عندما يعمل Gateway عبر launchd/systemd):

    - مخرجات stdout في macOS launchd: `~/Library/Logs/openclaw/gateway.log` (تستخدم الملفات الشخصية `gateway-<profile>.log`؛ ويتم كتم stderr)
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

    إذا كنت تشغل Gateway يدويًا، فيمكن لـ `openclaw gateway --force` استعادة المنفذ. راجع [Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="أغلقت الطرفية على Windows - كيف أعيد تشغيل OpenClaw؟">
    توجد **ثلاثة أوضاع تثبيت على Windows**:

    **1) إعداد Windows Hub المحلي:** يدير التطبيق الأصلي Gateway محليًا مملوكًا للتطبيق داخل WSL.

    افتح **OpenClaw Companion** من قائمة ابدأ أو شريط النظام، ثم استخدم
    **Gateway Setup** أو تبويب الاتصالات.

    **2) Gateway يدوي على WSL2:** يعمل Gateway داخل Linux.

    افتح PowerShell، وادخل إلى WSL، ثم أعد التشغيل:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا لم تكن قد ثبت الخدمة من قبل، فابدأها في الواجهة الأمامية:

    ```bash
    openclaw gateway run
    ```

    **3) CLI/Gateway أصلي على Windows:** يعمل Gateway مباشرة في Windows.

    افتح PowerShell وشغّل:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا كنت تشغله يدويًا (بلا خدمة)، فاستخدم:

    ```powershell
    openclaw gateway run
    ```

    المستندات: [Windows](/ar/platforms/windows)، [دليل تشغيل خدمة Gateway](/ar/gateway).

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

    - لم تُحمّل مصادقة النموذج على **مضيف Gateway** (تحقق من `models status`).
    - الاقتران/قائمة السماح للقناة يمنعان الردود (تحقق من إعداد القناة + السجلات).
    - WebChat/Dashboard مفتوح بلا الرمز الصحيح.

    إذا كنت بعيدًا، فتأكد من أن اتصال النفق/Tailscale يعمل وأن
    WebSocket الخاص بـ Gateway قابل للوصول.

    المستندات: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"انقطع الاتصال بـ Gateway: لا يوجد سبب" - ماذا الآن؟'>
    يعني هذا عادة أن واجهة المستخدم فقدت اتصال WebSocket. تحقق مما يلي:

    1. هل Gateway قيد التشغيل؟ `openclaw gateway status`
    2. هل Gateway سليم؟ `openclaw status`
    3. هل لدى واجهة المستخدم الرمز الصحيح؟ `openclaw dashboard`
    4. إذا كان الاتصال بعيدًا، فهل رابط النفق/Tailscale يعمل؟

    ثم تابع السجلات:

    ```bash
    openclaw logs --follow
    ```

    المستندات: [Dashboard](/ar/web/dashboard)، [الوصول البعيد](/ar/gateway/remote)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

  </Accordion>

  <Accordion title="يفشل Telegram setMyCommands. ماذا يجب أن أتحقق منه؟">
    ابدأ بالسجلات وحالة القناة:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    ثم طابق الخطأ:

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على إدخالات كثيرة جدًا. يقلص OpenClaw بالفعل إلى حد Telegram ويعيد المحاولة بأوامر أقل، لكن لا يزال يلزم إسقاط بعض إدخالات القائمة. قلل أوامر المكونات الإضافية/المهارات/الأوامر المخصصة، أو عطّل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed` أو `Network request for 'setMyCommands' failed!` أو أخطاء شبكة مشابهة: إذا كنت على VPS أو خلف وكيل، فتأكد من السماح باتصالات HTTPS الصادرة وأن DNS يعمل مع `api.telegram.org`.

    إذا كان Gateway بعيدًا، فتأكد من أنك تنظر إلى السجلات على مضيف Gateway.

    المستندات: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="لا يعرض TUI أي مخرجات. ماذا يجب أن أتحقق منه؟">
    تأكد أولًا من أن Gateway قابل للوصول وأن الوكيل يمكنه العمل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لرؤية الحالة الحالية. إذا كنت تتوقع ردودًا في قناة دردشة،
    فتأكد من تمكين التسليم (`/deliver on`).

    المستندات: [TUI](/ar/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway بالكامل ثم أبدأه؟">
    إذا كنت قد ثبت الخدمة:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    يوقف/يبدأ هذا **الخدمة الخاضعة للإشراف** (launchd على macOS، وsystemd على Linux).
    استخدم هذا عندما يعمل Gateway في الخلفية كخدمة daemon.

    إذا كنت تشغله في الواجهة الأمامية، فأوقفه باستخدام Ctrl-C، ثم:

    ```bash
    openclaw gateway run
    ```

    المستندات: [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="تبسيط شديد: الفرق بين openclaw gateway restart و openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **خدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغل Gateway **في الواجهة الأمامية** لجلسة الطرفية هذه.

    إذا كنت قد ثبت الخدمة، فاستخدم أوامر Gateway. استخدم `openclaw gateway` عندما
    تريد تشغيلًا لمرة واحدة في الواجهة الأمامية.

  </Accordion>

  <Accordion title="أسرع طريقة للحصول على مزيد من التفاصيل عند فشل شيء ما">
    ابدأ Gateway باستخدام `--verbose` للحصول على مزيد من تفاصيل وحدة التحكم. ثم افحص ملف السجل بحثًا عن أخطاء مصادقة القناة، وتوجيه النموذج، وRPC.
  </Accordion>
</AccordionGroup>

## الوسائط والمرفقات

<AccordionGroup>
  <Accordion title="أنشأت مهارتي صورة/PDF، لكن لم يُرسل شيء">
    يجب أن تستخدم المرفقات الصادرة من الوكيل حقول وسائط منظمة مثل `media` أو `mediaUrl` أو `path` أو `filePath`. راجع [إعداد مساعد OpenClaw](/ar/start/openclaw) و[إرسال الوكيل](/ar/tools/agent-send).

    الإرسال عبر CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    تحقق أيضًا مما يلي:

    - القناة المستهدفة تدعم الوسائط الصادرة وليست محظورة بقوائم السماح.
    - الملف ضمن حدود حجم المزود (يُعاد تحجيم الصور إلى حد أقصى 2048px).
    - يحافظ `tools.fs.workspaceOnly=true` على اقتصار إرسال المسارات المحلية على مساحة العمل، ومخزن الوسائط/المؤقت، والملفات التي تحقق منها sandbox.
    - يسمح `tools.fs.workspaceOnly=false` لإرسالات الوسائط المحلية المنظمة باستخدام ملفات محلية على المضيف يستطيع الوكيل قراءتها بالفعل، لكن فقط للوسائط وأنواع المستندات الآمنة (الصور، الصوت، الفيديو، PDF، مستندات Office، ومستندات النص التي تم التحقق منها مثل Markdown/MD وTXT وJSON وYAML وYML). هذا ليس ماسح أسرار: يمكن إرفاق `secret.txt` أو `config.json` قابل للقراءة من الوكيل عندما تتطابق الإضافة والتحقق من المحتوى. أبقِ الملفات الحساسة خارج المسارات القابلة للقراءة من الوكيل، أو أبقِ `tools.fs.workspaceOnly=true` لإرسال مسارات محلية أكثر صرامة.

    راجع [الصور](/ar/nodes/images).

  </Accordion>
</AccordionGroup>

## الأمان والتحكم في الوصول

<AccordionGroup>
  <Accordion title="هل من الآمن تعريض OpenClaw للرسائل الخاصة الواردة؟">
    تعامل مع الرسائل الخاصة الواردة كمدخلات غير موثوقة. صُممت الإعدادات الافتراضية لتقليل المخاطر:

    - السلوك الافتراضي على القنوات القادرة على الرسائل الخاصة هو **الاقتران**:
      - يتلقى المرسلون غير المعروفين رمز اقتران؛ ولا يعالج الروبوت رسالتهم.
      - وافق باستخدام: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - تُحدد الطلبات المعلقة بحد أقصى **3 لكل قناة**؛ تحقق من `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل رمز.
    - يتطلب فتح الرسائل الخاصة للعامة اختيارًا صريحًا (`dmPolicy: "open"` وقائمة السماح `"*"`).

    شغّل `openclaw doctor` لإظهار سياسات الرسائل الخاصة عالية المخاطر.

  </Accordion>

  <Accordion title="هل يقتصر حقن المطالبات على الروبوتات العامة؟">
    لا. حقن المطالبات يتعلق بـ **المحتوى غير الموثوق**، وليس فقط بمن يستطيع مراسلة الروبوت برسالة خاصة.
    إذا كان مساعدك يقرأ محتوى خارجيًا (بحث/جلب من الويب، صفحات المتصفح، رسائل البريد الإلكتروني،
    المستندات، المرفقات، السجلات الملصقة)، فقد يتضمن ذلك المحتوى تعليمات تحاول
    اختطاف النموذج. يمكن أن يحدث هذا حتى إذا **كنت أنت المرسل الوحيد**.

    يكون الخطر الأكبر عندما تكون الأدوات مفعلة: يمكن خداع النموذج لكي
    يسرّب السياق أو يستدعي الأدوات نيابة عنك. قلل نطاق الضرر عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو معطل الأدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` معطلة للوكلاء المفعلة أدواتهم
    - التعامل مع نصوص الملفات/المستندات المفكوكة كغير موثوقة أيضًا: يلف كل من OpenResponses
      `input_file` واستخراج مرفقات الوسائط النص المستخرج
      بعلامات حدود صريحة للمحتوى الخارجي بدلًا من تمرير نص الملف الخام
    - استخدام sandbox وقوائم سماح صارمة للأدوات

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل OpenClaw أقل أمانًا لأنه يستخدم TypeScript/Node بدلًا من Rust/WASM؟">
    اللغة وبيئة التشغيل مهمتان، لكنهما ليستا الخطر الرئيسي على وكيل شخصي.
    مخاطر OpenClaw العملية هي تعريض Gateway، ومن يستطيع مراسلة
    الروبوت، وحقن المطالبات، ونطاق الأدوات، والتعامل مع بيانات الاعتماد، ووصول المتصفح، ووصول exec،
    والثقة في المهارات أو المكونات الإضافية الخارجية.

    يمكن أن يوفر Rust وWASM عزلًا أقوى لبعض فئات الشيفرة، لكنهما
    لا يحلان حقن المطالبات، أو قوائم السماح السيئة، أو تعريض Gateway للعامة،
    أو الأدوات واسعة النطاق، أو ملف متصفح تم تسجيل دخوله بالفعل إلى حسابات
    حساسة. تعامل مع ما يلي كضوابط أساسية:

    - أبقِ Gateway خاصًا أو مصادقًا عليه
    - استخدم الاقتران وقوائم السماح للرسائل الخاصة والمجموعات
    - ارفض الأدوات الخطرة أو شغلها داخل sandbox للمدخلات غير الموثوقة
    - ثبت المكونات الإضافية والمهارات الموثوقة فقط
    - شغّل `openclaw security audit --deep` بعد تغييرات الإعداد

    التفاصيل: [الأمان](/ar/gateway/security)، [استخدام sandbox](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="رأيت تقارير عن نسخ OpenClaw مكشوفة. ماذا يجب أن أتحقق منه؟">
    تحقق أولًا من نشرك الفعلي:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    خط الأساس الأكثر أمانًا هو:

    - أن يكون Gateway مربوطًا بـ `loopback`، أو مكشوفًا فقط عبر وصول خاص
      مصادق عليه مثل tailnet، أو نفق SSH، أو مصادقة رمز/كلمة مرور، أو وكيل موثوق
      مضبوط بشكل صحيح
    - الرسائل الخاصة في وضع `pairing` أو `allowlist`
    - المجموعات ضمن قائمة سماح ومقيدة بالإشارة إلا إذا كان كل الأعضاء موثوقين
    - الأدوات عالية المخاطر (`exec`، `browser`، `gateway`، `cron`) مرفوضة أو محددة
      النطاق بإحكام للوكلاء الذين يقرؤون محتوى غير موثوق
    - تمكين sandbox حيث يحتاج تنفيذ الأدوات إلى نطاق ضرر أصغر

    الربط العام بلا مصادقة، والرسائل الخاصة/المجموعات المفتوحة مع الأدوات، والتحكم المكشوف
    في المتصفح هي النتائج التي يجب إصلاحها أولًا. التفاصيل:
    [قائمة تدقيق تدقيق الأمان](/ar/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="هل مهارات ClawHub والمكونات الإضافية الخارجية آمنة للتثبيت؟">
    تعامل مع المهارات والمكونات الإضافية الخارجية كشيفرة تختار الوثوق بها.
    تعرض صفحات مهارات ClawHub حالة الفحص قبل التثبيت، لكن الفحوصات ليست
    حدًا أمنيًا كاملًا. لا يشغل OpenClaw حظرًا محليًا مدمجًا
    للشيفرات الخطرة أثناء تدفقات تثبيت/تحديث المكونات الإضافية أو المهارات؛ استخدم
    `security.installPolicy` المملوكة للمشغل لقرارات السماح/الحظر المحلية.

    النمط الأكثر أمانًا:

    - فضّل المؤلفين الموثوقين والإصدارات المثبتة
    - اقرأ المهارة أو المكون الإضافي قبل تمكينه
    - أبقِ قوائم السماح للمكونات الإضافية والمهارات ضيقة
    - شغّل سير عمل المدخلات غير الموثوقة في sandbox بأدوات قليلة
    - تجنب منح شيفرة خارجية وصولًا واسعًا إلى نظام الملفات، أو exec، أو المتصفح، أو الأسرار

    التفاصيل: [Skills](/ar/tools/skills)، [Plugins](/ar/tools/plugin)،
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يجب أن يكون لروبوتي بريد إلكتروني أو حساب GitHub أو رقم هاتف خاص به؟">
    نعم، في معظم الإعدادات. عزل الروبوت بحسابات وأرقام هاتف منفصلة
    يقلل نطاق الضرر إذا حدث خطأ ما. كما يجعل ذلك تدوير
    بيانات الاعتماد أو إلغاء الوصول أسهل دون التأثير في حساباتك الشخصية.

    ابدأ على نطاق صغير. امنح الوصول فقط إلى الأدوات والحسابات التي تحتاج إليها فعليًا، ووسّعه
    لاحقًا إذا لزم الأمر.

    المستندات: [الأمان](/ar/gateway/security)، [الاقتران](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية، وهل هذا آمن؟">
    لا نوصي بالاستقلالية الكاملة على رسائلك الشخصية. النمط الأكثر أمانًا هو:

    - أبقِ الرسائل الخاصة في **وضع الاقتران** أو قائمة سماح ضيقة.
    - استخدم **رقمًا أو حسابًا منفصلًا** إذا أردته أن يرسل رسائل نيابةً عنك.
    - دعه يصيغ المسودة، ثم **وافق قبل الإرسال**.

    إذا أردت التجربة، فافعل ذلك على حساب مخصص وأبقِه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل مخصصًا للدردشة فقط وكان الإدخال موثوقًا. الطبقات الأصغر
    أكثر عرضة لاختطاف التعليمات، لذلك تجنبها للوكلاء المزوّدين بالأدوات
    أو عند قراءة محتوى غير موثوق. إذا كان لا بد من استخدام نموذج أصغر، فقيّد
    الأدوات وشغّله داخل صندوق عزل. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="شغّلت /start في Telegram لكنني لم أحصل على رمز اقتران">
    تُرسل رموز الاقتران **فقط** عندما يرسل مُرسِل غير معروف رسالة إلى الروبوت ويكون
    `dmPolicy: "pairing"` مفعّلًا. لا يولّد `/start` وحده رمزًا.

    تحقق من الطلبات المعلقة:

    ```bash
    openclaw pairing list telegram
    ```

    إذا أردت وصولًا فوريًا، فأضف معرّف المُرسِل إلى قائمة السماح أو اضبط `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيراسل جهات اتصالي؟ كيف يعمل الاقتران؟">
    لا. سياسة الرسائل الخاصة الافتراضية في WhatsApp هي **الاقتران**. يحصل المرسلون غير المعروفين على رمز اقتران فقط، ولا تتم **معالجة** رسالتهم. لا يرد OpenClaw إلا على الدردشات التي يتلقاها أو على عمليات الإرسال الصريحة التي تشغّلها.

    وافق على الاقتران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اعرض الطلبات المعلقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لتعيين **قائمة السماح/المالك** كي يُسمح برسائلك الخاصة. لا تُستخدم للإرسال التلقائي. إذا شغّلت ذلك على رقم WhatsApp الشخصي، فاستخدم ذلك الرقم وفعّل `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، وإيقاف المهام، و"لن يتوقف"

<AccordionGroup>
  <Accordion title="كيف أوقف ظهور رسائل النظام الداخلية في الدردشة؟">
    لا تظهر معظم الرسائل الداخلية أو رسائل الأدوات إلا عند تفعيل **الإسهاب** أو **التتبع** أو **الاستدلال**
    لتلك الجلسة.

    أصلح ذلك في الدردشة التي تراها فيها:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    إذا ظلّت الضوضاء مستمرة، فتحقق من إعدادات الجلسة في واجهة التحكم واضبط الإسهاب
    على **الوراثة**. وتأكد أيضًا من أنك لا تستخدم ملف تعريف روبوت فيه `verboseDefault` مضبوط
    على `on` في الإعدادات.

    المستندات: [التفكير والإسهاب](/ar/tools/thinking)، [الأمان](/ar/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="كيف أوقف/ألغي مهمة قيد التشغيل؟">
    أرسل أيًا مما يلي **كرسالة مستقلة** (بلا شرطة مائلة):

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

    هذه مشغلات إيقاف، وليست أوامر بشرطة مائلة.

    للعمليات الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

    ```
    process action:kill sessionId:XXX
    ```

    نظرة عامة على أوامر الشرطة المائلة: راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

    يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`، لكن بعض الاختصارات (مثل `/status`) تعمل أيضًا ضمن السطر للمرسلين الموجودين في قائمة السماح.

  </Accordion>

  <Accordion title='كيف أرسل رسالة Discord من Telegram؟ ("تم رفض المراسلة عبر السياقات")'>
    يحظر OpenClaw المراسلة **عبر المزوّدين** افتراضيًا. إذا كان استدعاء الأداة مرتبطًا
    بـ Telegram، فلن يرسل إلى Discord ما لم تسمح بذلك صراحةً.

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

  <Accordion title='لماذا يبدو أن الروبوت "يتجاهل" الرسائل السريعة المتتالية؟'>
    تُوجَّه المطالبات أثناء التشغيل إلى التشغيل النشط افتراضيًا. استخدم `/queue` لاختيار سلوك التشغيل النشط:

    - `steer` - وجّه التشغيل النشط عند حد النموذج التالي
    - `followup` - ضع الرسائل في قائمة انتظار وشغّلها واحدة تلو الأخرى بعد انتهاء التشغيل الحالي
    - `collect` - ضع الرسائل المتوافقة في قائمة انتظار وأرسل ردًا واحدًا بعد انتهاء التشغيل الحالي
    - `interrupt` - أوقف التشغيل الحالي وابدأ من جديد

    الوضع الافتراضي هو `steer`. يمكنك إضافة خيارات مثل `debounce:0.5s cap:25 drop:summarize` للأوضاع الموضوعة في قائمة الانتظار. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما النموذج الافتراضي لـ Anthropic مع مفتاح API؟'>
    في OpenClaw، بيانات الاعتماد واختيار النموذج منفصلان. ضبط `ANTHROPIC_API_KEY` (أو تخزين مفتاح API لـ Anthropic في ملفات تعريف المصادقة) يفعّل المصادقة، لكن النموذج الافتراضي الفعلي هو ما تضبطه في `agents.defaults.model.primary` (مثل `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). إذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم يتمكن من العثور على بيانات اعتماد Anthropic في ملف `auth-profiles.json` المتوقع للوكيل قيد التشغيل.
  </Accordion>
</AccordionGroup>

---

ما زلت عالقًا؟ اسأل في [Discord](https://discord.com/invite/clawd) أو افتح [نقاشًا على GitHub](https://github.com/openclaw/openclaw/discussions).

## ذات صلة

- [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run) — التثبيت، التهيئة، المصادقة، الاشتراكات، الإخفاقات المبكرة
- [الأسئلة الشائعة حول النماذج](/ar/help/faq-models) — اختيار النموذج، التحويل عند الفشل، ملفات تعريف المصادقة
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) — فرز يبدأ بالأعراض
