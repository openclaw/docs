---
read_when:
    - الإجابة عن أسئلة الدعم الشائعة المتعلقة بالإعداد أو التثبيت أو التهيئة الأولية أو وقت التشغيل
    - فرز المشكلات التي أبلغ عنها المستخدمون قبل التعمق في تصحيح الأخطاء
summary: الأسئلة الشائعة حول إعداد OpenClaw وتكوينه واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-05-02T07:31:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f818d009a261e32df22c793ab9018ff20cc38f799428d0cfdd8979f8c6d94e13
    source_path: help/faq.md
    workflow: 16
---

إجابات سريعة مع استكشاف أخطاء أعمق للإعدادات الواقعية (التطوير المحلي، VPS، تعدد الوكلاء، OAuth/مفاتيح API، التحويل الاحتياطي للنماذج). لتشخيصات وقت التشغيل، راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). ولمرجع الإعدادات الكامل، راجع [الإعدادات](/ar/gateway/configuration).

## أول 60 ثانية إذا كان هناك خلل

1. **الحالة السريعة (الفحص الأول)**

   ```bash
   openclaw status
   ```

   ملخص محلي سريع: نظام التشغيل + التحديث، قابلية الوصول إلى Gateway/الخدمة، الوكلاء/الجلسات، إعدادات المزوّد + مشكلات وقت التشغيل (عندما يكون Gateway قابلا للوصول).

2. **تقرير قابل للصق (آمن للمشاركة)**

   ```bash
   openclaw status --all
   ```

   تشخيص للقراءة فقط مع ذيل السجل (مع تنقيح الرموز السرية).

3. **حالة Daemon + المنفذ**

   ```bash
   openclaw gateway status
   ```

   يعرض وقت تشغيل المشرف مقابل قابلية الوصول عبر RPC، وعنوان URL المستهدف للفحص، وأي إعدادات غالبا استخدمتها الخدمة.

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

   يصلح/يرحّل الإعدادات/الحالة + يشغّل فحوصات الصحة. راجع [Doctor](/ar/gateway/doctor).

7. **لقطة Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # يعرض عنوان URL المستهدف + مسار الإعدادات عند حدوث أخطاء
   ```

   يطلب من Gateway قيد التشغيل لقطة كاملة (WS فقط). راجع [الصحة](/ar/gateway/health).

## البدء السريع وإعداد التشغيل الأول

أسئلة وأجوبة التشغيل الأول — التثبيت، الإعداد الأولي، مسارات المصادقة، الاشتراكات، الإخفاقات الأولية —
موجودة في [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run).

## ما هو OpenClaw؟

<AccordionGroup>
  <Accordion title="ما هو OpenClaw، في فقرة واحدة؟">
    OpenClaw مساعد ذكاء اصطناعي شخصي تشغّله على أجهزتك الخاصة. يرد عبر واجهات المراسلة التي تستخدمها بالفعل (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، وPlugins القنوات المضمنة مثل QQ Bot) ويمكنه أيضا تنفيذ الصوت + Canvas مباشر على المنصات المدعومة. **Gateway** هو مستوى التحكم الدائم التشغيل؛ أما المساعد فهو المنتج.
  </Accordion>

  <Accordion title="عرض القيمة">
    OpenClaw ليس "مجرد غلاف لـ Claude". إنه **مستوى تحكم محلي أولا** يتيح لك تشغيل
    مساعد قادر على **عتادك الخاص**، يمكن الوصول إليه من تطبيقات الدردشة التي تستخدمها بالفعل، مع
    جلسات ذات حالة، وذاكرة، وأدوات - من دون تسليم التحكم في تدفقات عملك إلى
    SaaS مستضاف.

    أبرز النقاط:

    - **أجهزتك، بياناتك:** شغّل Gateway أينما أردت (Mac، Linux، VPS) واحتفظ بـ
      مساحة العمل + سجل الجلسات محليا.
    - **قنوات حقيقية، لا صندوق رمل ويب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/إلخ،
      إضافة إلى الصوت عبر الهاتف وCanvas على المنصات المدعومة.
    - **محايد تجاه النماذج:** استخدم Anthropic، OpenAI، MiniMax، OpenRouter، إلخ، مع توجيه
      لكل وكيل وتحويل احتياطي.
    - **خيار محلي فقط:** شغّل نماذج محلية بحيث **يمكن لكل البيانات أن تبقى على جهازك** إذا أردت.
    - **توجيه متعدد الوكلاء:** وكلاء منفصلون لكل قناة أو حساب أو مهمة، لكل منهم
      مساحة عمله وافتراضاته الخاصة.
    - **مفتوح المصدر وقابل للتعديل:** افحصه، وسّعه، واستضفه ذاتيا من دون الارتباط بمورّد.

    المستندات: [Gateway](/ar/gateway)، [القنوات](/ar/channels)، [تعدد الوكلاء](/ar/concepts/multi-agent)،
    [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أعددته للتو - ماذا أفعل أولا؟">
    مشاريع أولى جيدة:

    - بناء موقع ويب (WordPress أو Shopify أو موقع ثابت بسيط).
    - وضع نموذج أولي لتطبيق هاتف (المخطط، الشاشات، خطة API).
    - تنظيم الملفات والمجلدات (تنظيف، تسمية، وسم).
    - ربط Gmail وأتمتة الملخصات أو المتابعات.

    يمكنه التعامل مع المهام الكبيرة، لكنه يعمل بأفضل شكل عندما تقسّمها إلى مراحل وتستخدم
    وكلاء فرعيين للعمل المتوازي.

  </Accordion>

  <Accordion title="ما أهم خمسة استخدامات يومية لـ OpenClaw؟">
    المكاسب اليومية تبدو عادة كالتالي:

    - **ملخصات شخصية:** ملخصات لصندوق الوارد، والتقويم، والأخبار التي تهمك.
    - **البحث والصياغة:** بحث سريع، وملخصات، ومسودات أولى لرسائل البريد أو المستندات.
    - **التذكيرات والمتابعات:** تنبيهات وقوائم تحقق مدفوعة بـ Cron أو Heartbeat.
    - **أتمتة المتصفح:** ملء النماذج، وجمع البيانات، وتكرار مهام الويب.
    - **تنسيق عبر الأجهزة:** أرسل مهمة من هاتفك، واترك Gateway يشغّلها على خادم، واحصل على النتيجة في الدردشة.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw المساعدة في توليد العملاء المحتملين، والتواصل، والإعلانات، والمدونات لـ SaaS؟">
    نعم في **البحث، والتأهيل، والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات للتواصل أو نصوص الإعلانات.

    بالنسبة إلى **حملات التواصل أو الإعلانات**، أبق إنسانا ضمن الحلقة. تجنب الرسائل المزعجة، واتبع القوانين المحلية
    وسياسات المنصات، وراجع أي شيء قبل إرساله. النمط الأكثر أمانا هو أن يكتب
    OpenClaw المسودة وأن توافق أنت عليها.

    المستندات: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما المزايا مقارنة بـ Claude Code لتطوير الويب؟">
    OpenClaw **مساعد شخصي** وطبقة تنسيق، وليس بديلا عن IDE. استخدم
    Claude Code أو Codex لأسرع حلقة برمجة مباشرة داخل مستودع. استخدم OpenClaw عندما تريد
    ذاكرة دائمة، ووصولا عبر الأجهزة، وتنسيقا للأدوات.

    المزايا:

    - **ذاكرة دائمة + مساحة عمل** عبر الجلسات
    - **وصول متعدد المنصات** (WhatsApp، Telegram، TUI، WebChat)
    - **تنسيق الأدوات** (المتصفح، الملفات، الجدولة، الخطافات)
    - **Gateway دائم التشغيل** (شغّله على VPS، وتفاعل معه من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/التنفيذ المحلي

    العرض: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="كيف أخصص Skills من دون إبقاء المستودع متسخا؟">
    استخدم التجاوزات المُدارة بدلا من تعديل نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). ترتيب الأولوية هو `<workspace>/skills` ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← المضمنة ← `skills.load.extraDirs`، لذلك تظل التجاوزات المُدارة تتغلب على Skills المضمنة من دون لمس git. إذا كنت تحتاج إلى تثبيت Skill عالميا لكن مع إظهارها لبعض الوكلاء فقط، فأبق النسخة المشتركة في `~/.openclaw/skills` وتحكم في الظهور عبر `agents.defaults.skills` و`agents.list[].skills`. لا ينبغي أن تعيش في المستودع وتخرج كـ PRs إلا التعديلات الجديرة بالرفع إلى المصدر.
  </Accordion>

  <Accordion title="هل يمكنني تحميل Skills من مجلد مخصص؟">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (الأولوية الأدنى). ترتيب الأولوية الافتراضي هو `<workspace>/skills` ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← المضمنة ← `skills.load.extraDirs`. يثبّت `clawhub` في `./skills` افتراضيا، وهو ما يتعامل معه OpenClaw كـ `<workspace>/skills` في الجلسة التالية. إذا كان ينبغي أن تكون Skill مرئية لبعض الوكلاء فقط، فاقرن ذلك بـ `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="كيف أستخدم نماذج مختلفة لمهام مختلفة؟">
    الأنماط المدعومة اليوم هي:

    - **مهام Cron**: يمكن للمهام المعزولة تعيين تجاوز `model` لكل مهمة.
    - **الوكلاء الفرعيون**: وجّه المهام إلى وكلاء منفصلين بنماذج افتراضية مختلفة.
    - **تبديل عند الطلب**: استخدم `/model` لتبديل نموذج الجلسة الحالية في أي وقت.

    راجع [مهام Cron](/ar/automation/cron-jobs)، و[توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="يتجمد البوت أثناء العمل الثقيل. كيف أنقل هذا الحمل؟">
    استخدم **الوكلاء الفرعيين** للمهام الطويلة أو المتوازية. يعمل الوكلاء الفرعيون في جلستهم الخاصة،
    ويعيدون ملخصا، ويحافظون على استجابة دردشتك الرئيسية.

    اطلب من البوت "spawn a sub-agent for this task" أو استخدم `/subagents`.
    استخدم `/status` في الدردشة لمعرفة ما يفعله Gateway الآن (وما إذا كان مشغولا).

    نصيحة الرموز: المهام الطويلة والوكلاء الفرعيون كلاهما يستهلكان رموزا. إذا كانت التكلفة مصدر قلق، فعيّن
    نموذجا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [مهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="كيف تعمل جلسات الوكيل الفرعي المرتبطة بالخيط على Discord؟">
    استخدم روابط الخيوط. يمكنك ربط خيط Discord بوكيل فرعي أو هدف جلسة بحيث تبقى رسائل المتابعة في ذلك الخيط على تلك الجلسة المرتبطة.

    التدفق الأساسي:

    - أنشئ باستخدام `sessions_spawn` مع `thread: true` (واختياريا `mode: "session"` لمتابعة دائمة).
    - أو اربط يدويا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الربط.
    - استخدم `/session idle <duration|off>` و`/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل الخيط.

    الإعدادات المطلوبة:

    - الافتراضات العامة: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - الربط التلقائي عند الإنشاء: `channels.discord.threadBindings.spawnSessions` يكون افتراضيا `true`؛ عيّنه إلى `false` لتعطيل إنشاء الجلسات المرتبطة بالخيوط.

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع الإعدادات](/ar/gateway/configuration-reference)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="أنهى وكيل فرعي عمله، لكن تحديث الاكتمال ذهب إلى المكان الخطأ أو لم يُنشر مطلقا. ماذا أفحص؟">
    افحص أولا مسار الطالب الذي تم حله:

    - يفضّل تسليم الوكيل الفرعي في وضع الاكتمال أي خيط مرتبط أو مسار محادثة عندما يوجد أحدهما.
    - إذا كان أصل الاكتمال يحمل قناة فقط، يرجع OpenClaw إلى المسار المخزن لجلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) بحيث يظل التسليم المباشر قادرا على النجاح.
    - إذا لم يوجد مسار مرتبط ولا مسار مخزن قابل للاستخدام، يمكن أن يفشل التسليم المباشر وتعود النتيجة إلى تسليم الجلسة في قائمة الانتظار بدلا من النشر الفوري في الدردشة.
    - يمكن للأهداف غير الصالحة أو القديمة أن تفرض الرجوع إلى قائمة الانتظار أو فشل التسليم النهائي.
    - إذا كانت آخر رسالة مرئية من المساعد الابن هي رمز الصمت الدقيق `NO_REPLY` / `no_reply`، أو بالضبط `ANNOUNCE_SKIP`، فإن OpenClaw يمنع الإعلان عمدا بدلا من نشر تقدم سابق قديم.
    - إذا انتهت مهلة الابن بعد استدعاءات أدوات فقط، يمكن للإعلان أن يختصر ذلك إلى ملخص قصير للتقدم الجزئي بدلا من إعادة تشغيل مخرجات الأدوات الخام.

    التصحيح:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [مهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="لا تعمل Cron أو التذكيرات. ماذا أفحص؟">
    تعمل Cron داخل عملية Gateway. إذا لم يكن Gateway يعمل باستمرار،
    فلن تعمل المهام المجدولة.

    قائمة التحقق:

    - تأكد من تفعيل cron (`cron.enabled`) وأن `OPENCLAW_SKIP_CRON` غير معيّن.
    - تحقق من أن Gateway يعمل على مدار 24/7 (بلا سكون/إعادة تشغيل).
    - تحقق من إعدادات المنطقة الزمنية للمهمة (`--tz` مقابل المنطقة الزمنية للمضيف).

    التصحيح:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="تم تشغيل Cron، لكن لم يُرسل أي شيء إلى القناة. لماذا؟">
    تحقق من وضع التسليم أولا:

    - `--no-deliver` / `delivery.mode: "none"` يعني أنه لا يُتوقع إرسال احتياطي من المشغّل.
    - يعني هدف الإعلان المفقود أو غير الصالح (`channel` / `to`) أن المشغّل تخطى التسليم الصادر.
    - تعني حالات فشل مصادقة القناة (`unauthorized`, `Forbidden`) أن المشغّل حاول التسليم لكن بيانات الاعتماد منعته.
    - تُعامل النتيجة المعزولة الصامتة (`NO_REPLY` / `no_reply` فقط) على أنها غير قابلة للتسليم عن قصد، لذلك يمنع المشغّل أيضا التسليم الاحتياطي في الطابور.

    بالنسبة إلى مهام Cron المعزولة، لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message`
    عندما يكون مسار الدردشة متاحا. يتحكم `--announce` فقط في مسار المشغّل
    الاحتياطي للنص النهائي الذي لم يرسله الوكيل مسبقا.

    تصحيح الأخطاء:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [المهام في الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="لماذا بدّل تشغيل Cron معزول النماذج أو أعاد المحاولة مرة واحدة؟">
    يكون ذلك عادة مسار تبديل النموذج الحي، وليس جدولة مكررة.

    يمكن لـ Cron المعزول الاحتفاظ بتسليم نموذج وقت التشغيل وإعادة المحاولة عندما يرمي التشغيل النشط
    `LiveSessionModelSwitchError`. تحتفظ إعادة المحاولة بالمزوّد/النموذج
    الذي تم التبديل إليه، وإذا حمل التبديل تجاوزا جديدا لملف مصادقة، يحتفظ Cron
    بذلك أيضا قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يفوز تجاوز نموذج خطاف Gmail أولا عند انطباقه.
    - ثم `model` الخاص بكل مهمة.
    - ثم أي تجاوز مخزن لنموذج جلسة Cron.
    - ثم اختيار النموذج العادي للوكيل/الافتراضي.

    حلقة إعادة المحاولة محدودة. بعد المحاولة الأولى إضافة إلى محاولتي تبديل،
    يوقف Cron العملية بدلا من الدوران إلى الأبد.

    تصحيح الأخطاء:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [واجهة Cron عبر CLI](/ar/cli/cron).

  </Accordion>

  <Accordion title="كيف أثبت Skills على Linux؟">
    استخدم أوامر `openclaw skills` الأصلية أو ضع Skills في مساحة عملك. واجهة Skills على macOS غير متاحة على Linux.
    تصفح Skills في [https://clawhub.ai](https://clawhub.ai).

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
    في مساحة العمل النشطة. ثبّت CLI منفصل باسم `clawhub` فقط إذا كنت تريد نشر
    Skills الخاصة بك أو مزامنتها. للتثبيتات المشتركة عبر الوكلاء، ضع Skills تحت
    `~/.openclaw/skills` واستخدم `agents.defaults.skills` أو
    `agents.list[].skills` إذا أردت تضييق نطاق الوكلاء الذين يمكنهم رؤيتها.

  </Accordion>

  <Accordion title="هل يستطيع OpenClaw تشغيل المهام وفق جدول أو باستمرار في الخلفية؟">
    نعم. استخدم مجدول Gateway:

    - **مهام Cron** للمهام المجدولة أو المتكررة (تستمر عبر عمليات إعادة التشغيل).
    - **Heartbeat** للفحوصات الدورية في "الجلسة الرئيسية".
    - **المهام المعزولة** للوكلاء المستقلين الذين ينشرون ملخصات أو يسلّمون إلى الدردشات.

    المستندات: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills الخاصة بـ Apple macOS فقط من Linux؟">
    ليس مباشرة. تخضع Skills الخاصة بـ macOS للتقييد عبر `metadata.openclaw.os` إضافة إلى الثنائيات المطلوبة، ولا تظهر Skills في موجه النظام إلا عندما تكون مؤهلة على **مضيف Gateway**. على Linux، لن تُحمّل Skills الخاصة بـ `darwin` فقط (مثل `apple-notes` و`apple-reminders` و`things-mac`) إلا إذا تجاوزت التقييد.

    لديك ثلاثة أنماط مدعومة:

    **الخيار A - شغّل Gateway على Mac (الأبسط).**
    شغّل Gateway حيث توجد ثنائيات macOS، ثم اتصل من Linux في [الوضع البعيد](#gateway-ports-already-running-and-remote-mode) أو عبر Tailscale. تُحمّل Skills بشكل طبيعي لأن مضيف Gateway هو macOS.

    **الخيار B - استخدم Node يعمل بنظام macOS (بلا SSH).**
    شغّل Gateway على Linux، واقرن Node بنظام macOS (تطبيق شريط القائمة)، واضبط **أوامر تشغيل Node** على "اسأل دائما" أو "اسمح دائما" على Mac. يستطيع OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما توجد الثنائيات المطلوبة على Node. يشغّل الوكيل تلك Skills عبر أداة `nodes`. إذا اخترت "اسأل دائما"، فإن الموافقة على "اسمح دائما" في المطالبة تضيف ذلك الأمر إلى قائمة السماح.

    **الخيار C - وكّل ثنائيات macOS عبر SSH (متقدم).**
    أبق Gateway على Linux، لكن اجعل ثنائيات CLI المطلوبة تُحل إلى مغلفات SSH تعمل على Mac. ثم تجاوز Skills للسماح بـ Linux كي تبقى مؤهلة.

    1. أنشئ مغلف SSH للثنائية (مثال: `memo` لملاحظات Apple):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ضع المغلف على `PATH` في مضيف Linux (على سبيل المثال `~/bin/memo`).
    3. تجاوز بيانات Skills الوصفية (مساحة العمل أو `~/.openclaw/skills`) للسماح بـ Linux:

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
    ليس مضمنا اليوم.

    الخيارات:

    - **Skills مخصصة / Plugin:** الأفضل للوصول الموثوق إلى API (لدى كل من Notion/HeyGen واجهات API).
    - **أتمتة المتصفح:** تعمل بلا كود لكنها أبطأ وأكثر هشاشة.

    إذا أردت إبقاء السياق لكل عميل (سير عمل الوكالات)، فالنمط البسيط هو:

    - صفحة Notion واحدة لكل عميل (السياق + التفضيلات + العمل النشط).
    - اطلب من الوكيل جلب تلك الصفحة عند بدء الجلسة.

    إذا أردت تكاملا أصليا، افتح طلب ميزة أو ابن Skills
    تستهدف تلك الواجهات البرمجية.

    تثبيت Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تصل التثبيتات الأصلية إلى دليل `skills/` في مساحة العمل النشطة. بالنسبة إلى Skills المشتركة عبر الوكلاء، ضعها في `~/.openclaw/skills/<name>/SKILL.md`. إذا كان ينبغي لبعض الوكلاء فقط رؤية تثبيت مشترك، فكوّن `agents.defaults.skills` أو `agents.list[].skills`. تتوقع بعض Skills ثنائيات مثبتة عبر Homebrew؛ على Linux يعني ذلك Linuxbrew (راجع إدخال الأسئلة الشائعة الخاص بـ Homebrew على Linux أعلاه). راجع [Skills](/ar/tools/skills)، [إعدادات Skills](/ar/tools/skills-config)، و[ClawHub](/ar/tools/clawhub).

  </Accordion>

  <Accordion title="كيف أستخدم Chrome الحالي الذي سجلت الدخول فيه مع OpenClaw؟">
    استخدم ملف المتصفح المدمج `user`، الذي يتصل عبر Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    إذا أردت اسما مخصصا، فأنشئ ملف MCP صريحا:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    يمكن لهذا المسار استخدام متصفح المضيف المحلي أو Node متصفح متصل. إذا كان Gateway يعمل في مكان آخر، فإما شغّل مضيف Node على جهاز المتصفح أو استخدم CDP بعيدا بدلا من ذلك.

    القيود الحالية على `existing-session` / `user`:

    - الإجراءات مدفوعة بـ ref، وليست مدفوعة بمحددات CSS
    - تتطلب عمليات الرفع `ref` / `inputRef` وتدعم حاليا ملفا واحدا في كل مرة
    - لا تزال `responsebody`، وتصدير PDF، واعتراض التنزيلات، والإجراءات الدفعية تحتاج إلى متصفح مُدار أو ملف CDP خام

  </Accordion>
</AccordionGroup>

## العزل واستخدام الذاكرة

<AccordionGroup>
  <Accordion title="هل توجد وثيقة مخصصة للعزل؟">
    نعم. راجع [العزل](/ar/gateway/sandboxing). للإعدادات الخاصة بـ Docker (Gateway كامل في Docker أو صور العزل)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدودا - كيف أفعّل الميزات الكاملة؟">
    الصورة الافتراضية تضع الأمان أولا وتعمل كمستخدم `node`، لذلك فهي لا
    تتضمن حزم النظام أو Homebrew أو المتصفحات المجمعة. لإعداد أكمل:

    - احتفظ بـ `/home/node` باستخدام `OPENCLAW_HOME_VOLUME` حتى تبقى الذاكرات المؤقتة.
    - ادمج تبعيات النظام في الصورة باستخدام `OPENCLAW_DOCKER_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المجمعة:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - اضبط `PLAYWRIGHT_BROWSERS_PATH` وتأكد من أن المسار محفوظ.

    المستندات: [Docker](/ar/install/docker)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل الخاصة شخصية مع جعل المجموعات عامة/معزولة باستخدام وكيل واحد؟">
    نعم - إذا كانت حركة المرور الخاصة بك هي **رسائل خاصة** وحركة المرور العامة هي **مجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` حتى تعمل جلسات المجموعة/القناة (مفاتيح غير رئيسية) في خلفية العزل المكوّنة، بينما تبقى جلسة الرسائل الخاصة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال إعدادات: [المجموعات: رسائل خاصة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع الإعدادات الأساسي: [إعدادات Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلدا من المضيف داخل العزل؟">
    اضبط `agents.defaults.sandbox.docker.binds` على `["host:path:mode"]` (مثلا، `"/home/user/src:/src:ro"`). تُدمج الارتباطات العامة وارتباطات كل وكيل؛ وتُتجاهل ارتباطات كل وكيل عند `scope: "shared"`. استخدم `:ro` لأي شيء حساس وتذكر أن الارتباطات تتجاوز جدران نظام ملفات العزل.

    يتحقق OpenClaw من مصادر الارتباط مقابل كل من المسار المطبّع والمسار القانوني المحلول عبر أعمق سلف موجود. يعني ذلك أن هروب الأصل عبر الروابط الرمزية لا يزال يفشل مغلقا حتى عندما لا يكون مقطع المسار الأخير موجودا بعد، وتظل فحوصات الجذر المسموح به مطبقة بعد حل الرابط الرمزي.

    راجع [العزل](/ar/gateway/sandboxing#custom-bind-mounts) و[العزل مقابل سياسة الأدوات مقابل الارتفاع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للاطلاع على أمثلة وملاحظات السلامة.

  </Accordion>

  <Accordion title="كيف تعمل الذاكرة؟">
    ذاكرة OpenClaw هي مجرد ملفات Markdown في مساحة عمل الوكيل:

    - ملاحظات يومية في `memory/YYYY-MM-DD.md`
    - ملاحظات طويلة المدى منسقة في `MEMORY.md` (الجلسات الرئيسية/الخاصة فقط)

    يشغّل OpenClaw أيضا **تفريغ ذاكرة صامتا قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction التلقائي. يعمل هذا فقط عندما تكون مساحة العمل
    قابلة للكتابة (تتخطاه بيئات العزل للقراءة فقط). راجع [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="الذاكرة تواصل نسيان الأشياء. كيف أجعلها تثبت؟">
    اطلب من البوت **كتابة الحقيقة إلى الذاكرة**. تنتمي الملاحظات طويلة المدى إلى `MEMORY.md`،
    وينتقل السياق قصير المدى إلى `memory/YYYY-MM-DD.md`.

    لا يزال هذا مجالا نعمل على تحسينه. من المفيد تذكير النموذج بتخزين الذكريات؛
    سيعرف ما يجب فعله. إذا استمر في النسيان، فتحقق من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل.

    المستندات: [الذاكرة](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تستمر الذاكرة إلى الأبد؟ ما حدودها؟">
    تعيش ملفات الذاكرة على القرص وتستمر حتى تحذفها. الحد هو مساحة
    التخزين لديك، وليس النموذج. يظل **سياق الجلسة** محدودا بنافذة سياق
    النموذج، لذلك يمكن للمحادثات الطويلة أن تخضع لـ Compaction أو تُقتطع. لهذا السبب
    يوجد بحث الذاكرة - فهو يعيد الأجزاء ذات الصلة فقط إلى السياق.

    المستندات: [الذاكرة](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب البحث الدلالي في الذاكرة مفتاح OpenAI API؟">
    فقط إذا كنت تستخدم **OpenAI embeddings**. يغطي Codex OAuth الدردشة/الإكمالات و
    **لا** يمنح وصولا إلى embeddings، لذلك **تسجيل الدخول باستخدام Codex (OAuth أو
    تسجيل دخول Codex CLI)** لا يساعد في البحث الدلالي في الذاكرة. ما تزال OpenAI embeddings
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تضبط موفرا صراحة، فسيختار OpenClaw موفرا تلقائيا عندما
    يتمكن من حل مفتاح API (ملفات تعريف المصادقة، أو `models.providers.*.apiKey`، أو متغيرات البيئة).
    يفضل OpenAI إذا تم حل مفتاح OpenAI، وإلا Gemini إذا تم حل مفتاح Gemini
    ثم Voyage ثم Mistral. إذا لم يكن هناك مفتاح بعيد متاح، يبقى
    البحث في الذاكرة معطلا حتى تقوم بتكوينه. إذا كان لديك مسار نموذج محلي
    مكون وموجود، فإن OpenClaw
    يفضل `local`. Ollama مدعوم عندما تضبط صراحة
    `memorySearch.provider = "ollama"`.

    إذا كنت تفضل البقاء محليا، فاضبط `memorySearch.provider = "local"` (واختياريا
    `memorySearch.fallback = "none"`). إذا كنت تريد Gemini embeddings، فاضبط
    `memorySearch.provider = "gemini"` ووفر `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). ندعم نماذج embedding من **OpenAI أو Gemini أو Voyage أو Mistral أو Ollama أو المحلية**
    - راجع [الذاكرة](/ar/concepts/memory) للحصول على تفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## أين توجد الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل يتم حفظ كل البيانات المستخدمة مع OpenClaw محليا؟">
    لا - **حالة OpenClaw محلية**، لكن **الخدمات الخارجية ما تزال ترى ما ترسله إليها**.

    - **محلي افتراضيا:** الجلسات، وملفات الذاكرة، والتكوين، ومساحة العمل موجودة على مضيف Gateway
      (`~/.openclaw` + دليل مساحة عملك).
    - **بعيد بحكم الضرورة:** الرسائل التي ترسلها إلى موفري النماذج (Anthropic/OpenAI/إلخ) تذهب إلى
      واجهات API الخاصة بهم، ومنصات الدردشة (WhatsApp/Telegram/Slack/إلخ) تخزن بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في النطاق:** استخدام النماذج المحلية يبقي المطالبات على جهازك، لكن مرور القناة
      ما يزال يمر عبر خوادم القناة.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    كل شيء يوجد ضمن `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | المسار                                                          | الغرض                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | التكوين الرئيسي (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | استيراد OAuth قديم (يتم نسخه إلى ملفات تعريف المصادقة عند أول استخدام) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات تعريف المصادقة (OAuth، ومفاتيح API، و`keyRef`/`tokenRef` اختياريا) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | حمولة أسرار اختيارية مدعومة بملف لموفري SecretRef من نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ملف توافق قديم (تتم إزالة إدخالات `api_key` الثابتة منه)          |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | حالة الموفر (مثلا `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | حالة كل وكيل (agentDir + الجلسات)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | سجل المحادثات والحالة (لكل وكيل)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | بيانات تعريف الجلسة (لكل وكيل)                                    |

    مسار الوكيل الواحد القديم: `~/.openclaw/agent/*` (تتم ترحيله بواسطة `openclaw doctor`).

    **مساحة العمل** الخاصة بك (AGENTS.md، وملفات الذاكرة، وSkills، وما إلى ذلك) منفصلة ومكونة عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    توجد هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` اختياري.
      الجذر الصغير `memory.md` هو إدخال إصلاح قديم فقط؛ يمكن لـ `openclaw doctor --fix`
      دمجه في `MEMORY.md` عندما يكون كلا الملفين موجودين.
    - **دليل الحالة (`~/.openclaw`)**: التكوين، وحالة القناة/الموفر، وملفات تعريف المصادقة، والجلسات، والسجلات،
      وSkills المشتركة (`~/.openclaw/skills`).

    مساحة العمل الافتراضية هي `~/.openclaw/workspace`، ويمكن تكوينها عبر:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    إذا بدا أن الروبوت "ينسى" بعد إعادة التشغيل، فتأكد من أن Gateway يستخدم
    مساحة العمل نفسها في كل تشغيل (وتذكر: الوضع البعيد يستخدم **مساحة عمل مضيف gateway**،
    وليس حاسوبك المحمول المحلي).

    نصيحة: إذا كنت تريد سلوكا أو تفضيلا دائما، فاطلب من الروبوت **كتابته في
    AGENTS.md أو MEMORY.md** بدلا من الاعتماد على سجل الدردشة.

    راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) و[الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="استراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** الخاصة بك في مستودع git **خاص** وانسخها احتياطيا في مكان
    خاص (على سبيل المثال GitHub خاص). يلتقط هذا الذاكرة + ملفات AGENTS/SOUL/USER
    ويتيح لك استعادة "عقل" المساعد لاحقا.

    **لا** تودع أي شيء ضمن `~/.openclaw` (بيانات الاعتماد، أو الجلسات، أو الرموز، أو حمولات الأسرار المشفرة).
    إذا كنت تحتاج إلى استعادة كاملة، فانسخ كلا من مساحة العمل ودليل الحالة
    احتياطيا بشكل منفصل (راجع سؤال الترحيل أعلاه).

    المستندات: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف أزيل تثبيت OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إزالة التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. مساحة العمل هي **cwd الافتراضي** ومرساة الذاكرة، وليست عزلا صارما.
    يتم حل المسارات النسبية داخل مساحة العمل، لكن المسارات المطلقة يمكنها الوصول إلى مواقع أخرى
    على المضيف ما لم يتم تمكين العزل. إذا كنت تحتاج إلى العزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات العزل لكل وكيل. إذا كنت
    تريد أن يكون مستودع ما هو دليل العمل الافتراضي، فوجه
    `workspace` الخاص بذلك الوكيل إلى جذر المستودع. مستودع OpenClaw هو مجرد شفرة مصدرية؛ أبق
    مساحة العمل منفصلة ما لم تكن تريد عمدا أن يعمل الوكيل داخله.

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
    حالة الجلسة يملكها **مضيف gateway**. إذا كنت في الوضع البعيد، فإن مخزن الجلسات الذي يهمك موجود على الجهاز البعيد، وليس على حاسوبك المحمول المحلي. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>
</AccordionGroup>

## أساسيات التكوين

<AccordionGroup>
  <Accordion title="ما تنسيق التكوين؟ وأين يوجد؟">
    يقرأ OpenClaw تكوين **JSON5** اختياريا من `$OPENCLAW_CONFIG_PATH` (الافتراضي: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    إذا كان الملف مفقودا، فإنه يستخدم إعدادات افتراضية آمنة نسبيا (بما في ذلك مساحة عمل افتراضية هي `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='ضبطت gateway.bind: "lan" (أو "tailnet") والآن لا يستمع شيء / تقول الواجهة إن الوصول غير مصرح به'>
    الربط خارج loopback **يتطلب مسار مصادقة gateway صالحا**. عمليا يعني ذلك:

    - مصادقة السر المشترك: رمز أو كلمة مرور
    - `gateway.auth.mode: "trusted-proxy"` خلف وكيل عكسي واع بالهوية ومكون بشكل صحيح

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

    - `gateway.remote.token` / `.password` لا تقومان **بتفعيل** مصادقة gateway المحلية بذاتهما.
    - يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كاحتياطي فقط عندما لا يكون `gateway.auth.*` مضبوطا.
    - لمصادقة كلمة المرور، اضبط `gateway.auth.mode: "password"` بالإضافة إلى `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`) بدلا من ذلك.
    - إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحة عبر SecretRef ولم يتم حله، يفشل الحل بإغلاق آمن (بلا إخفاء عبر احتياطي بعيد).
    - إعدادات واجهة التحكم ذات السر المشترك تصادق عبر `connect.params.auth.token` أو `connect.params.auth.password` (مخزنة في إعدادات التطبيق/الواجهة). الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy` تستخدم ترويسات الطلب بدلا من ذلك. تجنب وضع الأسرار المشتركة في عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، تتطلب وكلاء reverse proxy على loopback للمضيف نفسه ضبطا صريحا لـ `gateway.auth.trustedProxy.allowLoopback = true` وإدخالا للـ loopback في `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="لماذا أحتاج إلى رمز على localhost الآن؟">
    يفرض OpenClaw مصادقة gateway افتراضيا، بما في ذلك loopback. في المسار الافتراضي العادي، يعني ذلك مصادقة الرمز: إذا لم يتم تكوين مسار مصادقة صريح، فإن بدء تشغيل gateway يحل إلى وضع الرمز وينشئ واحدا تلقائيا، ويحفظه في `gateway.auth.token`، لذلك **يجب على عملاء WS المحليين المصادقة**. يمنع هذا العمليات المحلية الأخرى من استدعاء Gateway.

    إذا كنت تفضل مسار مصادقة مختلفا، فيمكنك اختيار وضع كلمة المرور صراحة (أو `trusted-proxy` لوكلاء عكسيين واعين بالهوية). إذا كنت **تريد فعلا** فتح loopback، فاضبط `gateway.auth.mode: "none"` صراحة في تكوينك. يمكن لـ Doctor إنشاء رمز لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب أن أعيد التشغيل بعد تغيير التكوين؟">
    يراقب Gateway التكوين ويدعم إعادة التحميل الساخنة:

    - `gateway.reload.mode: "hybrid"` (افتراضي): يطبق التغييرات الآمنة مباشرة، ويعيد التشغيل للتغييرات الحرجة
    - `hot` و`restart` و`off` مدعومة أيضا

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
    - إذا كنت لا تريد أي شعار إطلاقا، فاضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="كيف أفعل بحث الويب (وجلب الويب)؟">
    يعمل `web_fetch` دون مفتاح API. يعتمد `web_search` على
    الموفر المحدد لديك:

    - الموفرون المدعومون بواجهة API مثل Brave وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وPerplexity وTavily يتطلبون إعداد مفتاح API المعتاد لديهم.
    - Ollama Web Search لا يحتاج إلى مفتاح، لكنه يستخدم مضيف Ollama المكون لديك ويتطلب `ollama signin`.
    - DuckDuckGo لا يحتاج إلى مفتاح، لكنه تكامل غير رسمي مبني على HTML.
    - SearXNG لا يحتاج إلى مفتاح/مستضاف ذاتيا؛ قم بتكوين `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

    **موصى به:** شغل `openclaw configure --section web` واختر موفرا.
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

    أصبح تكوين بحث الويب الخاص بكل مزود موجودًا الآن ضمن `plugins.entries.<plugin>.config.webSearch.*`.
    ما زالت مسارات المزود القديمة `tools.web.search.*` تُحمّل مؤقتًا للتوافق، لكن ينبغي عدم استخدامها للتكوينات الجديدة.
    يوجد تكوين الرجوع الاحتياطي لجلب الويب عبر Firecrawl ضمن `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم السماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - يكون `web_fetch` مفعّلًا افتراضيًا (ما لم يُعطّل صراحةً).
    - إذا حُذف `tools.web.fetch.provider`، يكتشف OpenClaw تلقائيًا أول مزود رجوع احتياطي جاهز للجلب من بيانات الاعتماد المتاحة. المزود المضمّن حاليًا هو Firecrawl.
    - تقرأ الخدمات الخفية متغيرات البيئة من `~/.openclaw/.env` (أو من بيئة الخدمة).

    الوثائق: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="مسح config.apply تكويني. كيف أستعيده وأتجنب ذلك؟">
    يستبدل `config.apply` **التكوين بالكامل**. إذا أرسلت كائنًا جزئيًا، فسيُزال كل
    شيء آخر.

    يحمي OpenClaw الحالي من كثير من عمليات الاستبدال العرضية:

    - تتحقق عمليات كتابة التكوين المملوكة لـ OpenClaw من التكوين الكامل بعد التغيير قبل الكتابة.
    - تُرفض عمليات الكتابة غير الصالحة أو الهدامة المملوكة لـ OpenClaw وتُحفظ باسم `openclaw.json.rejected.*`.
    - إذا تسبب تعديل مباشر في تعطيل بدء التشغيل أو إعادة التحميل الساخنة، يستعيد Gateway آخر تكوين معروف صالحًا ويحفظ الملف المرفوض باسم `openclaw.json.clobbered.*`.
    - يتلقى الوكيل الرئيسي تحذير إقلاع بعد الاسترداد كي لا يكتب التكوين السيئ مجددًا دون تحقق.

    الاسترداد:

    - تحقق من `openclaw logs --follow` بحثًا عن `Config auto-restored from last-known-good` أو `Config write rejected:` أو `config reload restored last-known-good config`.
    - افحص أحدث `openclaw.json.clobbered.*` أو `openclaw.json.rejected.*` بجانب التكوين النشط.
    - احتفظ بالتكوين النشط المستعاد إذا كان يعمل، ثم انسخ المفاتيح المقصودة فقط مرة أخرى باستخدام `openclaw config set` أو `config.patch`.
    - شغّل `openclaw config validate` و`openclaw doctor`.
    - إذا لم يكن لديك آخر تكوين معروف صالحًا أو حمولة مرفوضة، فاستعد من نسخة احتياطية، أو أعد تشغيل `openclaw doctor` وأعد تكوين القنوات/النماذج.
    - إذا كان ذلك غير متوقع، فأبلغ عن خطأ وضمّن آخر تكوين معروف لديك أو أي نسخة احتياطية.
    - غالبًا ما يستطيع وكيل برمجة محلي إعادة بناء تكوين عامل من السجلات أو السجل التاريخي.

    تجنبه:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` للتعديلات التفاعلية.
    - استخدم `config.schema.lookup` أولًا عندما لا تكون متأكدًا من مسار دقيق أو شكل حقل؛ فهو يعيد عقدة مخطط سطحية مع ملخصات الأبناء المباشرين للتنقل التفصيلي.
    - استخدم `config.patch` لتعديلات RPC الجزئية؛ واحتفظ بـ `config.apply` لاستبدال التكوين الكامل فقط.
    - إذا كنت تستخدم أداة وقت التشغيل `gateway` الخاصة بالمالك فقط من تشغيل وكيل، فستظل ترفض الكتابة إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك الأسماء المستعارة القديمة `tools.bash.*` التي تُطبّع إلى مسارات exec المحمية نفسها).

    الوثائق: [التكوين](/ar/cli/config)، [التكوين التفاعلي](/ar/cli/configure)، [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغّل Gateway مركزيًا مع عمال متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحد** (مثل Raspberry Pi) مع **عُقد** و**وكلاء**:

    - **Gateway (مركزي):** يملك القنوات (Signal/WhatsApp)، والتوجيه، والجلسات.
    - **العُقد (الأجهزة):** تتصل أجهزة Mac/iOS/Android كأجهزة طرفية وتعرض أدوات محلية (`system.run`، و`canvas`، و`camera`).
    - **الوكلاء (العمال):** عقول/مساحات عمل منفصلة لأدوار خاصة (مثل "عمليات Hetzner"، و"البيانات الشخصية").
    - **الوكلاء الفرعيون:** شغّل عملًا في الخلفية من وكيل رئيسي عندما تريد التوازي.
    - **TUI:** اتصل بـ Gateway وبدّل بين الوكلاء/الجلسات.

    الوثائق: [العُقد](/ar/nodes)، [الوصول البعيد](/ar/gateway/remote)، [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/ar/web/tui).

  </Accordion>

  <Accordion title="هل يمكن لمتصفح OpenClaw العمل دون واجهة رسومية؟">
    نعم. هذا خيار تكوين:

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

    الافتراضي هو `false` (بواجهة مرئية). من المرجح أن يؤدي التشغيل دون واجهة رسومية إلى تشغيل فحوصات مكافحة الروبوتات في بعض المواقع. راجع [المتصفح](/ar/tools/browser).

    يستخدم التشغيل دون واجهة رسومية **محرك Chromium نفسه** ويعمل لمعظم الأتمتة (النماذج، والنقرات، والاستخراج، وتسجيلات الدخول). الفروق الرئيسية:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات الشاشة إذا كنت تحتاج إلى عناصر مرئية).
    - بعض المواقع أكثر تشددًا تجاه الأتمتة في وضع التشغيل دون واجهة رسومية (CAPTCHA، ومكافحة الروبوتات).
      على سبيل المثال، يحظر X/Twitter غالبًا الجلسات دون واجهة رسومية.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    اضبط `browser.executablePath` على ملف Brave التنفيذي لديك (أو أي متصفح قائم على Chromium) وأعد تشغيل Gateway.
    راجع أمثلة التكوين الكاملة في [المتصفح](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## البوابات والعُقد البعيدة

<AccordionGroup>
  <Accordion title="كيف تنتقل الأوامر بين Telegram وGateway والعُقد؟">
    تعالج **Gateway** رسائل Telegram. تشغّل Gateway الوكيل ثم
    تستدعي العُقد عبر **Gateway WebSocket** فقط عندما تكون هناك حاجة إلى أداة عقدة:

    Telegram → Gateway → الوكيل → `node.*` → العقدة → Gateway → Telegram

    لا ترى العُقد حركة مرور المزود الواردة؛ فهي تتلقى استدعاءات RPC الخاصة بالعُقد فقط.

  </Accordion>

  <Accordion title="كيف يمكن لوكيلي الوصول إلى حاسوبي إذا كانت Gateway مستضافة عن بُعد؟">
    الإجابة المختصرة: **زاوج حاسوبك كعقدة**. تعمل Gateway في مكان آخر، لكنها تستطيع
    استدعاء أدوات `node.*` (الشاشة، والكاميرا، والنظام) على جهازك المحلي عبر Gateway WebSocket.

    الإعداد المعتاد:

    1. شغّل Gateway على المضيف دائم التشغيل (VPS/خادم منزلي).
    2. ضع مضيف Gateway وحاسوبك على tailnet نفسها.
    3. تأكد من إمكانية الوصول إلى Gateway WS (ربط tailnet أو نفق SSH).
    4. افتح تطبيق macOS محليًا واتصل في وضع **البعيد عبر SSH** (أو tailnet مباشر)
       حتى يستطيع التسجيل كعقدة.
    5. وافق على العقدة في Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا يلزم جسر TCP منفصل؛ تتصل العُقد عبر Gateway WebSocket.

    تذكير أمني: تتيح مزاوجة عقدة macOS تشغيل `system.run` على ذلك الجهاز. زاوج
    الأجهزة التي تثق بها فقط، وراجع [الأمان](/ar/gateway/security).

    الوثائق: [العُقد](/ar/nodes)، [بروتوكول Gateway](/ar/gateway/protocol)، [وضع macOS البعيد](/ar/platforms/mac/remote)، [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل لكنني لا أتلقى أي ردود. ماذا الآن؟">
    تحقق من الأساسيات:

    - Gateway تعمل: `openclaw gateway status`
    - صحة Gateway: `openclaw status`
    - صحة القناة: `openclaw channels status`

    ثم تحقق من المصادقة والتوجيه:

    - إذا كنت تستخدم Tailscale Serve، فتأكد من ضبط `gateway.auth.allowTailscale` بشكل صحيح.
    - إذا كنت تتصل عبر نفق SSH، فتأكد من أن النفق المحلي يعمل ويشير إلى المنفذ الصحيح.
    - تأكد من أن قوائم السماح لديك (رسالة مباشرة أو مجموعة) تتضمن حسابك.

    الوثائق: [Tailscale](/ar/gateway/tailscale)، [الوصول البعيد](/ar/gateway/remote)، [القنوات](/ar/channels).

  </Accordion>

  <Accordion title="هل يمكن لمثيلي OpenClaw التحدث إلى بعضهما (محلي + VPS)؟">
    نعم. لا يوجد جسر "روبوت إلى روبوت" مضمّن، لكن يمكنك توصيلهما بعدة طرق
    موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يمكن لكلا الروبوتين الوصول إليها (Telegram/Slack/WhatsApp).
    اجعل الروبوت A يرسل رسالة إلى الروبوت B، ثم دع الروبوت B يرد كالمعتاد.

    **جسر CLI (عام):** شغّل برنامجًا نصيًا يستدعي Gateway الأخرى باستخدام
    `openclaw agent --message ... --deliver`، مستهدفًا دردشة يستمع فيها الروبوت الآخر.
    إذا كان أحد الروبوتين على VPS بعيد، فوجه CLI إلى Gateway البعيدة تلك
    عبر SSH/Tailscale (راجع [الوصول البعيد](/ar/gateway/remote)).

    نمط مثال (شغّله من جهاز يستطيع الوصول إلى Gateway الهدف):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف حاجزًا وقائيًا كي لا يدخل الروبوتان في حلقة لا تنتهي (الإشارة فقط، أو
    قوائم سماح القنوات، أو قاعدة "لا ترد على رسائل الروبوتات").

    الوثائق: [الوصول البعيد](/ar/gateway/remote)، [CLI الوكيل](/ar/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى VPSات منفصلة لعدة وكلاء؟">
    لا. يمكن لـ Gateway واحد استضافة عدة وكلاء، لكل منهم مساحة العمل الخاصة به، وافتراضات النماذج،
    والتوجيه. هذا هو الإعداد الطبيعي وهو أرخص وأبسط بكثير من تشغيل
    VPS واحد لكل وكيل.

    استخدم VPSات منفصلة فقط عندما تحتاج إلى عزل قوي (حدود أمان) أو تكوينات
    مختلفة جدًا لا تريد مشاركتها. بخلاف ذلك، احتفظ بـ Gateway واحد
    واستخدم عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل توجد فائدة من استخدام عقدة على حاسوبي المحمول الشخصي بدلًا من SSH من VPS؟">
    نعم - العُقد هي الطريقة من الدرجة الأولى للوصول إلى حاسوبك المحمول من Gateway بعيدة، وهي
    تتيح أكثر من مجرد وصول إلى الصدفة. تعمل Gateway على macOS/Linux (Windows عبر WSL2) وهي
    خفيفة الوزن (يكفي VPS صغير أو صندوق بمستوى Raspberry Pi؛ وذاكرة RAM بسعة 4 GB كافية)، لذا يكون
    الإعداد الشائع هو مضيف دائم التشغيل مع حاسوبك المحمول كعقدة.

    - **لا حاجة إلى SSH وارد.** تتصل العُقد إلى Gateway WebSocket وتستخدم مزاوجة الأجهزة.
    - **ضوابط تنفيذ أكثر أمانًا.** يخضع `system.run` لقوائم السماح/الموافقات الخاصة بالعقدة على ذلك الحاسوب المحمول.
    - **أدوات أجهزة أكثر.** تعرض العُقد `canvas` و`camera` و`screen` إضافةً إلى `system.run`.
    - **أتمتة متصفح محلية.** أبقِ Gateway على VPS، لكن شغّل Chrome محليًا عبر مضيف عقدة على الحاسوب المحمول، أو اتصل بـ Chrome محلي على المضيف عبر Chrome MCP.

    SSH مناسب للوصول العارض إلى الصدفة، لكن العُقد أبسط لسير عمل الوكلاء المستمر
    وأتمتة الأجهزة.

    الوثائق: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تشغّل العُقد خدمة Gateway؟">
    لا. يجب تشغيل **Gateway واحد** فقط لكل مضيف إلا إذا كنت تشغّل ملفات تعريف معزولة عمدًا (راجع [بوابات متعددة](/ar/gateway/multiple-gateways)). العُقد أجهزة طرفية تتصل
    بـ Gateway (عُقد iOS/Android، أو "وضع العقدة" في macOS في تطبيق شريط القوائم). لمضيفي العُقد
    دون واجهة رسومية والتحكم عبر CLI، راجع [CLI مضيف العقدة](/ar/cli/node).

    يلزم إعادة تشغيل كاملة لتغييرات `gateway` و`discovery` و`canvasHost`.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق التكوين؟">
    نعم.

    - `config.schema.lookup`: افحص شجرة تكوين فرعية واحدة مع عقدة المخطط السطحية الخاصة بها، وتلميح واجهة المستخدم المطابق، وملخصات الأبناء المباشرين قبل الكتابة
    - `config.get`: اجلب اللقطة الحالية + التجزئة
    - `config.patch`: تحديث جزئي آمن (مفضل لمعظم تعديلات RPC)؛ يعيد التحميل الساخن عند الإمكان ويعيد التشغيل عند اللزوم
    - `config.apply`: تحقق + استبدل التكوين الكامل؛ يعيد التحميل الساخن عند الإمكان ويعيد التشغيل عند اللزوم
    - ما زالت أداة وقت التشغيل `gateway` الخاصة بالمالك فقط ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ تُطبّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها

  </Accordion>

  <Accordion title="الحد الأدنى المعقول للإعداد لأول تثبيت">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    يضبط هذا مساحة العمل لديك ويقيّد من يمكنه تشغيل البوت.

  </Accordion>

  <Accordion title="كيف أعد Tailscale على VPS وأتصل من جهاز Mac؟">
    الخطوات الدنيا:

    1. **التثبيت + تسجيل الدخول على VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **التثبيت + تسجيل الدخول على جهاز Mac**
       - استخدم تطبيق Tailscale وسجّل الدخول إلى tailnet نفسه.
    3. **تفعيل MagicDNS (موصى به)**
       - في وحدة تحكم إدارة Tailscale، فعّل MagicDNS حتى يكون لدى VPS اسم ثابت.
    4. **استخدام اسم مضيف tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا أردت واجهة Control UI من دون SSH، فاستخدم Tailscale Serve على VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    يبقي هذا Gateway مربوطا بـ loopback ويعرض HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أوصل Node على Mac بـ Gateway بعيد (Tailscale Serve)؟">
    يعرّض Serve **واجهة تحكم Gateway + WS**. تتصل Nodes عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكد من أن VPS + Mac على tailnet نفسه**.
    2. **استخدم تطبيق macOS في الوضع البعيد** (يمكن أن يكون هدف SSH هو اسم مضيف tailnet).
       سيقوم التطبيق بإنشاء نفق لمنفذ Gateway والاتصال باعتباره Node.
    3. **وافق على Node** على Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    المستندات: [بروتوكول Gateway](/ar/gateway/protocol)، [الاكتشاف](/ar/gateway/discovery)، [الوضع البعيد في macOS](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل يجب أن أثبّت على حاسوب محمول ثان أم أضيف Node فقط؟">
    إذا كنت تحتاج فقط إلى **الأدوات المحلية** (الشاشة/الكاميرا/التنفيذ) على الحاسوب المحمول الثاني، فأضفه باعتباره
    **Node**. يحافظ ذلك على Gateway واحد ويتجنب تكرار الإعداد. أدوات Node المحلية
    متاحة حاليا على macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    ثبّت Gateway ثانيا فقط عندما تحتاج إلى **عزل صارم** أو بوتين منفصلين بالكامل.

    المستندات: [Nodes](/ar/nodes)، [CLI الخاص بـ Nodes](/ar/cli/nodes)، [Gateways متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات البيئة وتحميل .env

<AccordionGroup>
  <Accordion title="كيف يحمّل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات البيئة من العملية الأم (shell أو launchd/systemd أو CI، إلخ) ويحمّل بالإضافة إلى ذلك:

    - `.env` من دليل العمل الحالي
    - ملف `.env` احتياطيا عاما من `~/.openclaw/.env` (أي `$OPENCLAW_STATE_DIR/.env`)

    لا يتجاوز أي من ملفي `.env` متغيرات البيئة الموجودة.

    يمكنك أيضا تعريف متغيرات بيئة مضمنة في الإعداد (تُطبّق فقط إذا كانت مفقودة من بيئة العملية):

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

  <Accordion title="شغّلت Gateway عبر الخدمة واختفت متغيرات البيئة لدي. ماذا الآن؟">
    حلان شائعان:

    1. ضع المفاتيح المفقودة في `~/.openclaw/.env` حتى تُلتقط حتى عندما لا ترث الخدمة بيئة shell لديك.
    2. فعّل استيراد shell (وسيلة اختيارية للتيسير):

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

    يشغّل هذا login shell لديك ويستورد فقط المفاتيح المتوقعة المفقودة (لا يتجاوز أبدا). مكافئات متغيرات البيئة:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='عيّنت COPILOT_GITHUB_TOKEN، لكن حالة النماذج تعرض "Shell env: off." لماذا؟'>
    يبلّغ `openclaw models status` عما إذا كان **استيراد بيئة shell** مفعّلا. لا تعني "Shell env: off"
    أن متغيرات البيئة لديك مفقودة - بل تعني فقط أن OpenClaw لن يحمّل
    login shell لديك تلقائيا.

    إذا كان Gateway يعمل كخدمة (launchd/systemd)، فلن يرث بيئة shell
    لديك. أصلح ذلك بفعل أحد الأمور التالية:

    1. ضع الرمز المميز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد shell (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في الإعداد لديك (يُطبّق فقط إذا كان مفقودا).

    ثم أعد تشغيل Gateway وأعد الفحص:

    ```bash
    openclaw models status
    ```

    تُقرأ رموز Copilot المميزة من `COPILOT_GITHUB_TOKEN` (وكذلك `GH_TOKEN` / `GITHUB_TOKEN`).
    راجع [/concepts/model-providers](/ar/concepts/model-providers) و[/environment](/ar/help/environment).

  </Accordion>
</AccordionGroup>

## الجلسات ومحادثات متعددة

<AccordionGroup>
  <Accordion title="كيف أبدأ محادثة جديدة؟">
    أرسل `/new` أو `/reset` كرسالة مستقلة. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>

  <Accordion title="هل تُعاد تهيئة الجلسات تلقائيا إذا لم أرسل /new أبدا؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا **معطّل افتراضيا** (القيمة الافتراضية **0**).
    عيّنه إلى قيمة موجبة لتفعيل انتهاء الصلاحية عند الخمول. عند تفعيله، تبدأ الرسالة **التالية**
    بعد فترة الخمول معرّف جلسة جديدا لمفتاح تلك المحادثة.
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
    نعم، عبر **توجيه متعدد الوكلاء** و**وكلاء فرعيين**. يمكنك إنشاء وكيل منسق واحد
    وعدة وكلاء عاملين بمساحات عمل ونماذج خاصة بهم.

    مع ذلك، من الأفضل النظر إلى هذا على أنه **تجربة ممتعة**. فهو يستهلك الكثير من الرموز وغالبا
    ما يكون أقل كفاءة من استخدام بوت واحد مع جلسات منفصلة. النموذج المعتاد الذي
    نتصوره هو بوت واحد تتحدث إليه، مع جلسات مختلفة للعمل المتوازي. ويمكن لذلك
    البوت أيضا إنشاء وكلاء فرعيين عند الحاجة.

    المستندات: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [CLI الوكلاء](/ar/cli/agents).

  </Accordion>

  <Accordion title="لماذا اقتُطع السياق في منتصف المهمة؟ كيف أمنع ذلك؟">
    يقيّد إطار النموذج سياق الجلسة. يمكن أن تؤدي المحادثات الطويلة أو مخرجات الأدوات الكبيرة أو الملفات
    الكثيرة إلى تشغيل Compaction أو الاقتطاع.

    ما يساعد:

    - اطلب من البوت تلخيص الحالة الحالية وكتابتها إلى ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل المواضيع.
    - احتفظ بالسياق المهم في مساحة العمل واطلب من البوت قراءته لك.
    - استخدم الوكلاء الفرعيين للعمل الطويل أو المتوازي حتى تبقى المحادثة الرئيسية أصغر.
    - اختر نموذجا بإطار سياق أكبر إذا حدث هذا كثيرا.

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

    - يوفر الإعداد الأولي أيضا **إعادة الضبط** إذا رأى إعدادا موجودا. راجع [الإعداد الأولي (CLI)](/ar/start/wizard).
    - إذا استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد ضبط كل دليل حالة (القيم الافتراضية هي `~/.openclaw-<profile>`).
    - إعادة ضبط التطوير: `openclaw gateway --dev --reset` (للتطوير فقط؛ يمسح إعداد التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='أتلقى أخطاء "context too large" - كيف أعيد الضبط أو أضغط السياق؟'>
    استخدم أحد هذه الخيارات:

    - **Compaction** (يبقي المحادثة لكنه يلخص الأدوار الأقدم):

      ```
      /compact
      ```

      أو `/compact <instructions>` لتوجيه الملخص.

    - **إعادة الضبط** (معرّف جلسة جديد لمفتاح المحادثة نفسه):

      ```
      /new
      /reset
      ```

    إذا استمر حدوث ذلك:

    - فعّل أو اضبط **تقليم الجلسة** (`agents.defaults.contextPruning`) لقص مخرجات الأدوات القديمة.
    - استخدم نموذجا بإطار سياق أكبر.

    المستندات: [Compaction](/ar/concepts/compaction)، [تقليم الجلسة](/ar/concepts/session-pruning)، [إدارة الجلسات](/ar/concepts/session).

  </Accordion>

  <Accordion title='لماذا أرى "LLM request rejected: messages.content.tool_use.input field required"؟'>
    هذا خطأ تحقق من المزود: أصدر النموذج كتلة `tool_use` من دون
    `input` المطلوبة. يعني هذا عادة أن سجل الجلسة قديم أو تالف (غالبا بعد سلاسل طويلة
    أو تغيير في أداة/مخطط).

    الإصلاح: ابدأ جلسة جديدة باستخدام `/new` (رسالة مستقلة).

  </Accordion>

  <Accordion title="لماذا أتلقى رسائل Heartbeat كل 30 دقيقة؟">
    تعمل Heartbeat كل **30m** افتراضيا (**1h** عند استخدام مصادقة OAuth). اضبطها أو عطّلها:

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

    إذا كان `HEARTBEAT.md` موجودا لكنه فارغ فعليا (فقط أسطر فارغة ورؤوس markdown
    مثل `# Heading`)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API.
    إذا كان الملف مفقودا، تستمر Heartbeat في العمل ويقرر النموذج ما يجب فعله.

    تستخدم التجاوزات لكل وكيل `agents.list[].heartbeat`. المستندات: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل أحتاج إلى إضافة "حساب بوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك أنت**، لذلك إذا كنت في المجموعة، يستطيع OpenClaw رؤيتها.
    افتراضيا، تُحظر ردود المجموعة حتى تسمح بالمرسلين (`groupPolicy: "allowlist"`).

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
    الخيار 1 (الأسرع): راقب السجلات وأرسل رسالة اختبار في المجموعة:

    ```bash
    openclaw logs --follow --json
    ```

    ابحث عن `chatId` (أو `from`) ينتهي بـ `@g.us`، مثل:
    `1234567890-1234567890@g.us`.

    الخيار 2 (إذا كان معدا/مدرجا في allowlist بالفعل): اعرض المجموعات من الإعداد:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    المستندات: [WhatsApp](/ar/channels/whatsapp)، [الدليل](/ar/cli/directory)، [السجلات](/ar/cli/logs).

  </Accordion>

  <Accordion title="لماذا لا يرد OpenClaw في مجموعة؟">
    سببان شائعان:

    - تقييد الإشارة مفعّل (افتراضيا). يجب عليك @mention البوت (أو مطابقة `mentionPatterns`).
    - أعددت `channels.whatsapp.groups` من دون `"*"` والمجموعة غير مدرجة في allowlist.

    راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشارك المجموعات/السلاسل السياق مع الرسائل المباشرة؟">
    تُدمج المحادثات المباشرة في الجلسة الرئيسية افتراضيا. تمتلك المجموعات/القنوات مفاتيح جلسات خاصة بها، وتكون مواضيع Telegram / سلاسل Discord جلسات منفصلة. راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم عدد مساحات العمل والوكلاء التي يمكنني إنشاؤها؟">
    لا توجد حدود صارمة. العشرات (بل حتى المئات) لا بأس بها، لكن انتبه إلى:

    - **نمو القرص:** تعيش الجلسات + النصوص المسجلة ضمن `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** يعني مزيد من الوكلاء مزيدا من استخدام النماذج المتزامن.
    - **عبء العمليات:** ملفات تعريف المصادقة ومساحات العمل وتوجيه القنوات لكل وكيل.

    نصائح:

    - احتفظ بمساحة عمل **نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - قلّم الجلسات القديمة (احذف JSONL أو إدخالات التخزين) إذا نما استخدام القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل المتفرقة وعدم تطابق ملفات التعريف.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة بوتات أو محادثات في الوقت نفسه (Slack)، وكيف ينبغي إعداد ذلك؟">
    نعم. استخدم **التوجيه متعدد الوكلاء** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة حسب
    القناة/الحساب/النظير. يُدعم Slack كقناة ويمكن ربطه بوكلاء محددين.

    الوصول عبر المتصفح قوي، لكنه لا يعني "تنفيذ أي شيء يستطيع الإنسان تنفيذه" - إذ يمكن أن تظل
    أنظمة مكافحة البوتات، وCAPTCHAs، وMFA عائقًا أمام الأتمتة. للحصول على تحكم أكثر موثوقية في المتصفح، استخدم Chrome MCP محليًا على المضيف،
    أو استخدم CDP على الجهاز الذي يشغّل المتصفح فعليًا.

    إعداد أفضل الممارسات:

    - مضيف Gateway يعمل دائمًا (VPS/Mac mini).
    - وكيل واحد لكل دور (ارتباطات).
    - قناة أو قنوات Slack مرتبطة بهؤلاء الوكلاء.
    - متصفح محلي عبر Chrome MCP أو عقدة عند الحاجة.

    المستندات: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [Slack](/ar/channels/slack)،
    [المتصفح](/ar/tools/browser)، [العُقد](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج، وتجاوز الفشل، وملفات تعريف المصادقة

توجد أسئلة وأجوبة النماذج — الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة —
في [الأسئلة الشائعة حول النماذج](/ar/help/faq-models).

## Gateway: المنافذ، و"قيد التشغيل بالفعل"، والوضع البعيد

<AccordionGroup>
  <Accordion title="ما المنفذ الذي يستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ الفردي متعدد الاستخدامات لـ WebSocket + HTTP (واجهة التحكم، والخطافات، وما إلى ذلك).

    الأولوية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا يقول openclaw gateway status إن "Runtime: running" لكن "Connectivity probe: failed"؟'>
    لأن "running" هي رؤية **المشرف** (launchd/systemd/schtasks). أما فحص الاتصال فهو CLI يتصل فعليًا بـ WebSocket الخاص بالـ gateway.

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

    شغّل ذلك من `--profile` / البيئة نفسها التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ماذا يعني "another gateway instance is already listening"؟'>
    يفرض OpenClaw قفل تشغيل عبر ربط مستمع WebSocket فور بدء التشغيل (الافتراضي `ws://127.0.0.1:18789`). إذا فشل الربط مع `EADDRINUSE`، فإنه يرمي `GatewayLockError` مشيرًا إلى أن نسخة أخرى تستمع بالفعل.

    الإصلاح: أوقف النسخة الأخرى، أو حرر المنفذ، أو شغّل باستخدام `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="كيف أشغّل OpenClaw في الوضع البعيد (عميل يتصل بـ Gateway في مكان آخر)؟">
    عيّن `gateway.mode: "remote"` وأشر إلى عنوان WebSocket بعيد، مع بيانات اعتماد بعيدة بسر مشترك اختياريًا:

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

    - لا يبدأ `openclaw gateway` إلا عندما تكون `gateway.mode` هي `local` (أو إذا مررت راية التجاوز).
    - يراقب تطبيق macOS ملف الإعدادات ويبدّل الأوضاع مباشرة عند تغيّر هذه القيم.
    - `gateway.remote.token` / `.password` هي بيانات اعتماد بعيدة من جهة العميل فقط؛ ولا تفعّل مصادقة Gateway المحلية بمفردها.

  </Accordion>

  <Accordion title='تقول واجهة التحكم "unauthorized" (أو تستمر في إعادة الاتصال). ماذا الآن؟'>
    مسار مصادقة gateway لديك وطريقة مصادقة الواجهة غير متطابقين.

    حقائق (من الكود):

    - تحتفظ واجهة التحكم بالرمز في `sessionStorage` لجلسة تبويب المتصفح الحالية وعنوان URL المحدد للـ gateway، لذلك تستمر عمليات التحديث في التبويب نفسه بالعمل دون استعادة استمرار رمز طويل الأمد في localStorage.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة محاولة واحدة محدودة باستخدام رمز جهاز مخزّن مؤقتًا عندما يعيد gateway تلميحات إعادة المحاولة (`canRetryWithDeviceToken=true`، `recommendedNextStep=retry_with_device_token`).
    - إعادة المحاولة بذلك الرمز المخزن مؤقتًا تعيد الآن استخدام النطاقات المعتمدة المخزنة مؤقتًا مع رمز الجهاز. أما مستدعو `deviceToken` الصريح / `scopes` الصريح فيحتفظون بمجموعة النطاقات المطلوبة لديهم بدلًا من وراثة النطاقات المخزنة مؤقتًا.
    - خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال هي الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز bootstrap.
    - فحوصات نطاق رمز bootstrap مسبوقة بالدور. قائمة السماح المدمجة لمشغل bootstrap تلبي طلبات المشغل فقط؛ أما العقد أو الأدوار الأخرى غير المشغلة فما زالت تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    الإصلاح:

    - الأسرع: `openclaw dashboard` (يطبع عنوان URL للوحة المعلومات وينسخه، ويحاول فتحه؛ ويعرض تلميح SSH إذا كان بلا واجهة).
    - إذا لم يكن لديك رمز بعد: `openclaw doctor --generate-gateway-token`.
    - إذا كان بعيدًا، أنشئ نفقًا أولًا: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع السر المشترك: عيّن `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم الصق السر المطابق في إعدادات واجهة التحكم.
    - وضع Tailscale Serve: تأكد من تفعيل `gateway.auth.allowTailscale` وأنك تفتح عنوان URL الخاص بـ Serve، وليس عنوان loopback/tailnet خامًا يتجاوز ترويسات هوية Tailscale.
    - وضع الوكيل الموثوق: تأكد من أنك تأتي عبر الوكيل المهيأ والواعي بالهوية، وليس عبر عنوان URL خام للـ gateway. تحتاج وكلاء local loopback على المضيف نفسه أيضًا إلى `gateway.auth.trustedProxy.allowLoopback = true`.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، بدّل/أعد اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا قالت مكالمة التبديل هذه إنها رُفضت، فتحقق من أمرين:
      - لا يمكن لجلسات الأجهزة المقترنة تبديل إلا جهازها **الخاص** ما لم تكن لديها أيضًا `operator.admin`
      - لا يمكن لقيم `--scope` الصريحة تجاوز نطاقات المشغل الحالية للمتصل
    - هل ما زلت عالقًا؟ شغّل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [لوحة المعلومات](/ar/web/dashboard) لتفاصيل المصادقة.

  </Accordion>

  <Accordion title="عيّنت gateway.bind إلى tailnet لكنه لا يستطيع الربط ولا شيء يستمع">
    يختار ربط `tailnet` عنوان IP من Tailscale من واجهات شبكتك (100.64.0.0/10). إذا لم يكن الجهاز على Tailscale (أو كانت الواجهة معطلة)، فلن يوجد شيء للربط به.

    الإصلاح:

    - ابدأ Tailscale على ذلك المضيف (ليصبح لديه عنوان 100.x)، أو
    - بدّل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. يفضّل `auto` loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطًا مخصصًا للـ tailnet فقط.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة Gateways على المضيف نفسه؟">
    عادة لا - يمكن لـ Gateway واحد تشغيل عدة قنوات مراسلة ووكلاء. استخدم عدة Gateways فقط عندما تحتاج إلى التكرار (مثال: بوت إنقاذ) أو العزل الصارم.

    نعم، لكن يجب عليك العزل:

    - `OPENCLAW_CONFIG_PATH` (إعدادات لكل نسخة)
    - `OPENCLAW_STATE_DIR` (حالة لكل نسخة)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (موصى به):

    - استخدم `openclaw --profile <name> ...` لكل نسخة (ينشئ تلقائيًا `~/.openclaw-<name>`).
    - عيّن `gateway.port` فريدًا في إعدادات كل ملف تعريف (أو مرّر `--port` للتشغيل اليدوي).
    - ثبّت خدمة لكل ملف تعريف: `openclaw --profile <name> gateway install`.

    تضيف ملفات التعريف لاحقة إلى أسماء الخدمات أيضًا (`ai.openclaw.<profile>`؛ القديم `com.openclaw.*`، `openclaw-gateway-<profile>.service`، `OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [عدة gateways](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ماذا يعني "invalid handshake" / الرمز 1008؟'>
    Gateway هو **خادم WebSocket**، ويتوقع أن تكون الرسالة الأولى تمامًا
    إطار `connect`. إذا تلقى أي شيء آخر، يغلق الاتصال
    مع **الرمز 1008** (انتهاك سياسة).

    الأسباب الشائعة:

    - فتحت عنوان URL الخاص بـ **HTTP** في متصفح (`http://...`) بدلًا من عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - أزال وكيل أو نفق ترويسات المصادقة أو أرسل طلبًا ليس للـ Gateway.

    إصلاحات سريعة:

    1. استخدم عنوان URL الخاص بـ WS: `ws://<host>:18789` (أو `wss://...` إذا كان HTTPS).
    2. لا تفتح منفذ WS في تبويب متصفح عادي.
    3. إذا كانت المصادقة مفعّلة، أدرج الرمز/كلمة المرور في إطار `connect`.

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
    سجلات الملفات (مهيكلة):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    يمكنك تعيين مسار ثابت عبر `logging.file`. يتحكم `logging.level` في مستوى سجل الملف. تتحكم `--verbose` و`logging.consoleLevel` في إسهاب وحدة التحكم.

    أسرع متابعة للسجل:

    ```bash
    openclaw logs --follow
    ```

    سجلات الخدمة/المشرف (عندما يعمل gateway عبر launchd/systemd):

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

    إذا كنت تشغّل gateway يدويًا، فيمكن لـ `openclaw gateway --force` استعادة المنفذ. راجع [Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="أغلقت الطرفية على Windows - كيف أعيد تشغيل OpenClaw؟">
    هناك **وضعا تثبيت على Windows**:

    **1) WSL2 (موصى به):** يعمل Gateway داخل Linux.

    افتح PowerShell، وادخل إلى WSL، ثم أعد التشغيل:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا لم تكن قد ثبّت الخدمة مطلقًا، فابدأها في المقدمة:

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

  <Accordion title="Gateway يعمل لكن الردود لا تصل أبدًا. ماذا ينبغي أن أتحقق منه؟">
    ابدأ بفحص صحة سريع:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    الأسباب الشائعة:

    - لم تُحمّل مصادقة النموذج على **مضيف gateway** (تحقق من `models status`).
    - اقتران القناة/قائمة السماح يمنعان الردود (تحقق من إعدادات القناة + السجلات).
    - WebChat/Dashboard مفتوح بلا الرمز الصحيح.

    إذا كنت بعيدًا، فتأكد من أن اتصال النفق/Tailscale يعمل وأن
    WebSocket الخاص بـ Gateway يمكن الوصول إليه.

    المستندات: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ماذا الآن؟'>
    يعني هذا عادة أن الواجهة فقدت اتصال WebSocket. تحقق من:

    1. هل Gateway قيد التشغيل؟ `openclaw gateway status`
    2. هل Gateway سليم؟ `openclaw status`
    3. هل تحتوي واجهة المستخدم على الرمز الصحيح؟ `openclaw dashboard`
    4. إذا كان الوصول عن بُعد، فهل اتصال النفق/Tailscale نشط؟

    ثم راقب السجلات:

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

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على عدد كبير جدًا من الإدخالات. يقلّص OpenClaw القائمة بالفعل إلى حد Telegram ويعيد المحاولة بعدد أوامر أقل، لكن لا تزال بعض إدخالات القائمة بحاجة إلى الإزالة. قلّل أوامر Plugin/المهارة/الأوامر المخصصة، أو عطّل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed` أو `Network request for 'setMyCommands' failed!` أو أخطاء شبكة مشابهة: إذا كنت تستخدم VPS أو تعمل خلف وكيل، فتأكد من السماح باتصالات HTTPS الصادرة ومن أن DNS يعمل مع `api.telegram.org`.

    إذا كان Gateway عن بُعد، فتأكد من أنك تنظر إلى السجلات على مضيف Gateway.

    المستندات: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="لا يعرض TUI أي مخرجات. ما الذي ينبغي أن أتحقق منه؟">
    تأكد أولًا من إمكانية الوصول إلى Gateway ومن قدرة الوكيل على العمل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لرؤية الحالة الحالية. إذا كنت تتوقع ردودًا في قناة دردشة،
    فتأكد من تمكين التسليم (`/deliver on`).

    المستندات: [TUI](/ar/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway تمامًا ثم أشغّله؟">
    إذا كنت قد ثبّت الخدمة:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    يؤدي هذا إلى إيقاف/تشغيل **الخدمة الخاضعة للإشراف** (launchd على macOS، وsystemd على Linux).
    استخدم هذا عندما يعمل Gateway في الخلفية كبرنامج خفي.

    إذا كنت تشغّله في المقدمة، فأوقفه باستخدام Ctrl-C، ثم:

    ```bash
    openclaw gateway run
    ```

    المستندات: [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="شرح مبسط: openclaw gateway restart مقابل openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **خدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغّل Gateway **في المقدمة** لجلسة الطرفية هذه.

    إذا كنت قد ثبّت الخدمة، فاستخدم أوامر Gateway. استخدم `openclaw gateway` عندما
    تريد تشغيلًا لمرة واحدة في المقدمة.

  </Accordion>

  <Accordion title="أسرع طريقة للحصول على مزيد من التفاصيل عند حدوث فشل">
    ابدأ Gateway باستخدام `--verbose` للحصول على مزيد من تفاصيل وحدة التحكم. ثم افحص ملف السجل بحثًا عن أخطاء مصادقة القنوات وتوجيه النماذج وRPC.
  </Accordion>
</AccordionGroup>

## الوسائط والمرفقات

<AccordionGroup>
  <Accordion title="أنشأت مهارتي صورة/PDF، لكن لم يتم إرسال شيء">
    يجب أن تتضمن المرفقات الصادرة من الوكيل سطر `MEDIA:<path-or-url>` (في سطر مستقل). راجع [إعداد مساعد OpenClaw](/ar/start/openclaw) و[إرسال الوكيل](/ar/tools/agent-send).

    الإرسال عبر CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    تحقق أيضًا من:

    - القناة المستهدفة تدعم الوسائط الصادرة وليست محظورة بقوائم السماح.
    - الملف ضمن حدود الحجم لدى المزوّد (تُعاد تحجيم الصور إلى حد أقصى 2048px).
    - `tools.fs.workspaceOnly=true` يبقي عمليات الإرسال من المسارات المحلية محدودة بمساحة العمل ومخزن المؤقت/الوسائط والملفات التي تحقق منها صندوق العزل.
    - `tools.fs.workspaceOnly=false` يسمح لـ `MEDIA:` بإرسال ملفات محلية على المضيف يستطيع الوكيل قراءتها بالفعل، لكن للوسائط وأنواع المستندات الآمنة فقط (الصور، الصوت، الفيديو، PDF، ومستندات Office). تظل الملفات النصية العادية والملفات التي تبدو كأسرار محظورة.

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
      - تُحد الطلبات المعلقة عند **3 لكل قناة**؛ تحقق من `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل رمز.
    - يتطلب فتح الرسائل المباشرة للعامة اشتراكًا صريحًا (`dmPolicy: "open"` وقائمة سماح `"*"`).

    شغّل `openclaw doctor` لإظهار سياسات الرسائل المباشرة الخطرة.

  </Accordion>

  <Accordion title="هل حقن الموجهات مصدر قلق للبوتات العامة فقط؟">
    لا. حقن الموجهات يتعلق بـ **المحتوى غير الموثوق**، وليس فقط بمن يستطيع مراسلة البوت مباشرة.
    إذا كان مساعدك يقرأ محتوى خارجيًا (بحث/جلب ويب، صفحات متصفح، رسائل بريد إلكتروني،
    مستندات، مرفقات، سجلات ملصقة)، فقد يتضمن ذلك المحتوى تعليمات تحاول
    اختطاف النموذج. يمكن أن يحدث هذا حتى إذا **كنت أنت المرسل الوحيد**.

    الخطر الأكبر يكون عند تمكين الأدوات: يمكن خداع النموذج لكي
    يسرّب السياق أو يستدعي الأدوات نيابةً عنك. قلّل نطاق التأثير عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو معطّل الأدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` متوقفة للوكلاء الممكّنة أدواتهم
    - التعامل مع نص الملفات/المستندات المفكوك ترميزه كمحتوى غير موثوق أيضًا: يغلّف كل من OpenResponses
      `input_file` واستخراج مرفقات الوسائط النص المستخرج ضمن
      علامات حدود محتوى خارجي صريحة بدل تمرير نص الملف الخام
    - استخدام صندوق عزل وقوائم سماح صارمة للأدوات

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل ينبغي أن يكون للبوت بريد إلكتروني أو حساب GitHub أو رقم هاتف خاص به؟">
    نعم، لمعظم الإعدادات. عزل البوت بحسابات وأرقام هاتف منفصلة
    يقلّل نطاق التأثير إذا حدث خطأ. وهذا يسهّل أيضًا تدوير
    بيانات الاعتماد أو إبطال الوصول دون التأثير على حساباتك الشخصية.

    ابدأ على نطاق صغير. امنح الوصول فقط إلى الأدوات والحسابات التي تحتاجها فعليًا، ووسّع
    لاحقًا إذا لزم الأمر.

    المستندات: [الأمان](/ar/gateway/security)، [الإقران](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية وهل ذلك آمن؟">
    نحن **لا** نوصي بالاستقلالية الكاملة على رسائلك الشخصية. النمط الأكثر أمانًا هو:

    - إبقاء الرسائل المباشرة في **وضع الإقران** أو ضمن قائمة سماح ضيقة.
    - استخدام **رقم أو حساب منفصل** إذا أردته أن يرسل رسائل نيابةً عنك.
    - دعه يصيغ المسودة، ثم **وافق قبل الإرسال**.

    إذا أردت التجربة، فافعل ذلك على حساب مخصص وأبقِه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل للدردشة فقط وكانت المدخلات موثوقة. الشرائح الأصغر
    أكثر عرضة لاختطاف التعليمات، لذا تجنّبها للوكلاء الممكّنة أدواتهم
    أو عند قراءة محتوى غير موثوق. إذا اضطررت إلى استخدام نموذج أصغر، فأحكم تقييد
    الأدوات وشغّله داخل صندوق عزل. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="شغّلت /start في Telegram لكنني لم أحصل على رمز إقران">
    تُرسل رموز الإقران **فقط** عندما يراسل مرسل غير معروف البوت ويكون
    `dmPolicy: "pairing"` ممكّنًا. لا يولّد `/start` وحده رمزًا.

    تحقق من الطلبات المعلقة:

    ```bash
    openclaw pairing list telegram
    ```

    إذا كنت تريد وصولًا فوريًا، فأضف معرف المرسل إلى قائمة السماح أو عيّن `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيراسل جهات اتصالي؟ كيف يعمل الإقران؟">
    لا. سياسة الرسائل المباشرة الافتراضية في WhatsApp هي **الإقران**. يتلقى المرسلون غير المعروفين رمز إقران فقط ولا تتم **معالجة** رسالتهم. يرد OpenClaw فقط على الدردشات التي يتلقاها أو على عمليات الإرسال الصريحة التي تشغّلها.

    وافق على الإقران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اعرض الطلبات المعلقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لتعيين **قائمة السماح/المالك** حتى يُسمح برسائلك المباشرة الخاصة. لا تُستخدم للإرسال التلقائي. إذا كنت تشغّل على رقم WhatsApp الشخصي، فاستخدم ذلك الرقم ومكّن `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، وإلغاء المهام، و"لن يتوقف"

<AccordionGroup>
  <Accordion title="كيف أوقف ظهور رسائل النظام الداخلية في الدردشة؟">
    تظهر معظم الرسائل الداخلية أو رسائل الأدوات فقط عند تمكين **verbose** أو **trace** أو **reasoning**
    لتلك الجلسة.

    أصلح ذلك في الدردشة التي ترى فيها المشكلة:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    إذا بقيت الضوضاء، فتحقق من إعدادات الجلسة في Control UI وعيّن verbose
    إلى **inherit**. تأكد أيضًا من أنك لا تستخدم ملف تعريف بوت يحتوي على `verboseDefault` مضبوط
    إلى `on` في الإعدادات.

    المستندات: [التفكير وverbose](/ar/tools/thinking)، [الأمان](/ar/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="كيف أوقف/ألغي مهمة قيد التشغيل؟">
    أرسل أيًا من هذه **كرسالة مستقلة** (بدون شرطة مائلة):

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

    بالنسبة للعمليات الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

    ```
    process action:kill sessionId:XXX
    ```

    نظرة عامة على أوامر الشرطة المائلة: راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

    يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`، لكن بعض الاختصارات (مثل `/status`) تعمل أيضًا ضمن السطر للمرسلين الموجودين في قائمة السماح.

  </Accordion>

  <Accordion title='كيف أرسل رسالة Discord من Telegram؟ ("تم رفض المراسلة عبر السياقات")'>
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

  <Accordion title='لماذا يبدو أن البوت "يتجاهل" الرسائل المتلاحقة بسرعة؟'>
    يتحكم وضع قائمة الانتظار في كيفية تفاعل الرسائل الجديدة مع تشغيل جارٍ. استخدم `/queue` لتغيير الأوضاع:

    - `steer` - يضع كل التوجيهات المعلقة في قائمة انتظار حتى حد النموذج التالي في التشغيل الحالي
    - `queue` - توجيه قديم واحد تلو الآخر
    - `followup` - يشغّل الرسائل واحدة تلو الأخرى
    - `collect` - يجمع الرسائل ويرد مرة واحدة
    - `steer-backlog` - يوجّه الآن، ثم يعالج المتراكم
    - `interrupt` - يلغي التشغيل الحالي ويبدأ من جديد

    الوضع الافتراضي هو `steer`. يمكنك إضافة خيارات مثل `debounce:0.5s cap:25 drop:summarize` لأوضاع المتابعة. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما النموذج الافتراضي لـ Anthropic عند استخدام مفتاح API؟'>
    في OpenClaw، تكون بيانات الاعتماد واختيار النموذج منفصلين. يؤدي ضبط `ANTHROPIC_API_KEY` (أو تخزين مفتاح API لـ Anthropic في ملفات تعريف المصادقة) إلى تفعيل المصادقة، لكن النموذج الافتراضي الفعلي هو ما تضبطه في `agents.defaults.model.primary` (على سبيل المثال، `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). إذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم يتمكن من العثور على بيانات اعتماد Anthropic في ملف `auth-profiles.json` المتوقع للوكيل قيد التشغيل.
  </Accordion>
</AccordionGroup>

---

هل ما زلت عالقًا؟ اسأل في [Discord](https://discord.com/invite/clawd) أو افتح [مناقشة على GitHub](https://github.com/openclaw/openclaw/discussions).

## ذات صلة

- [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run) — التثبيت، الإعداد الأولي، المصادقة، الاشتراكات، الإخفاقات المبكرة
- [الأسئلة الشائعة للنماذج](/ar/help/faq-models) — اختيار النموذج، تجاوز الفشل، ملفات تعريف المصادقة
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) — فرز المشكلات بدءًا من الأعراض
