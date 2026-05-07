---
read_when:
    - الإجابة عن أسئلة الدعم الشائعة المتعلقة بالإعداد أو التثبيت أو التهيئة الأولية أو وقت التشغيل
    - فرز المشكلات التي أبلغ عنها المستخدمون قبل التعمق في تصحيح الأخطاء
summary: الأسئلة الشائعة حول إعداد OpenClaw وتكوينه واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-05-07T13:21:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: b208e28def6b9a1165130bc02f9e2646c3b16d203dfc8c0d59dc664f388c2ef8
    source_path: help/faq.md
    workflow: 16
---

إجابات سريعة مع استكشاف أعمق للمشكلات في الإعدادات الواقعية (التطوير المحلي، VPS، تعدد الوكلاء، مفاتيح OAuth/API، التحويل الاحتياطي للنماذج). لتشخيصات وقت التشغيل، راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). للمرجع الكامل للإعدادات، راجع [التكوين](/ar/gateway/configuration).

## أول 60 ثانية إذا كان هناك عطل

1. **الحالة السريعة (الفحص الأول)**

   ```bash
   openclaw status
   ```

   ملخص محلي سريع: نظام التشغيل + التحديث، إمكانية الوصول إلى gateway/service، الوكلاء/الجلسات، تكوين المزوّد + مشكلات وقت التشغيل (عندما يكون Gateway قابلاً للوصول).

2. **تقرير قابل للصق (آمن للمشاركة)**

   ```bash
   openclaw status --all
   ```

   تشخيص للقراءة فقط مع ذيل السجل (مع تنقيح الرموز المميزة).

3. **حالة الخادم الخلفي + المنفذ**

   ```bash
   openclaw gateway status
   ```

   يعرض وقت تشغيل المشرف مقابل إمكانية الوصول عبر RPC، ورابط هدف الفحص، والتكوين الذي استخدمته الخدمة على الأرجح.

4. **فحوصات عميقة**

   ```bash
   openclaw status --deep
   ```

   يشغل فحص صحة مباشرًا لـ Gateway، بما في ذلك فحوصات القنوات عند دعمها
   (يتطلب Gateway قابلاً للوصول). راجع [الصحة](/ar/gateway/health).

5. **متابعة أحدث سجل**

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

   يصلح/يرحّل التكوين/الحالة + يشغل فحوصات الصحة. راجع [Doctor](/ar/gateway/doctor).

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
    OpenClaw هو مساعد ذكاء اصطناعي شخصي تشغله على أجهزتك الخاصة. يرد على واجهات المراسلة التي تستخدمها بالفعل (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، وPlugins القنوات المضمّنة مثل QQ Bot) ويمكنه أيضًا تنفيذ الصوت + Canvas مباشر على المنصات المدعومة. **Gateway** هو مستوى التحكم الدائم التشغيل؛ والمساعد هو المنتج.
  </Accordion>

  <Accordion title="عرض القيمة">
    OpenClaw ليس "مجرد غلاف لـ Claude". إنه **مستوى تحكم محلي أولًا** يتيح لك تشغيل
    مساعد قادر على **عتادك الخاص**، يمكن الوصول إليه من تطبيقات الدردشة التي تستخدمها بالفعل، مع
    جلسات ذات حالة، وذاكرة، وأدوات - من دون تسليم التحكم في سير عملك إلى SaaS
    مستضاف.

    أبرز النقاط:

    - **أجهزتك، بياناتك:** شغّل Gateway أينما تريد (Mac، Linux، VPS) واحتفظ
      بمساحة العمل + سجل الجلسات محليًا.
    - **قنوات حقيقية، وليست صندوق اختبار ويب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/إلخ،
      إضافة إلى صوت الهاتف وCanvas على المنصات المدعومة.
    - **مستقل عن النماذج:** استخدم Anthropic، OpenAI، MiniMax، OpenRouter، إلخ، مع توجيه
      وتحويل احتياطي لكل وكيل.
    - **خيار محلي فقط:** شغّل النماذج المحلية بحيث **يمكن أن تبقى كل البيانات على جهازك** إذا أردت.
    - **توجيه متعدد الوكلاء:** وكلاء منفصلون لكل قناة أو حساب أو مهمة، ولكل منهم
      مساحة عمل وإعدادات افتراضية خاصة به.
    - **مفتوح المصدر وقابل للتعديل:** افحص ووسّع واستضف ذاتيًا من دون الارتباط بمورّد.

    الوثائق: [Gateway](/ar/gateway)، [القنوات](/ar/channels)، [تعدد الوكلاء](/ar/concepts/multi-agent)،
    [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="لقد أعددته للتو - ماذا أفعل أولًا؟">
    مشاريع أولى جيدة:

    - إنشاء موقع ويب (WordPress أو Shopify أو موقع ثابت بسيط).
    - إعداد نموذج أولي لتطبيق هاتف (المخطط، الشاشات، خطة API).
    - تنظيم الملفات والمجلدات (تنظيف، تسمية، وسم).
    - ربط Gmail وأتمتة الملخصات أو المتابعات.

    يمكنه التعامل مع المهام الكبيرة، لكنه يعمل بأفضل شكل عندما تقسمها إلى مراحل وتستخدم
    وكلاء فرعيين للعمل المتوازي.

  </Accordion>

  <Accordion title="ما أفضل خمس حالات استخدام يومية لـ OpenClaw؟">
    المكاسب اليومية تبدو عادةً هكذا:

    - **إحاطات شخصية:** ملخصات لصندوق الوارد والتقويم والأخبار التي تهمك.
    - **البحث والصياغة:** بحث سريع وملخصات ومسودات أولى لرسائل البريد أو المستندات.
    - **التذكيرات والمتابعات:** تنبيهات وقوائم تحقق مدفوعة بـ Cron أو Heartbeat.
    - **أتمتة المتصفح:** تعبئة النماذج، وجمع البيانات، وتكرار مهام الويب.
    - **تنسيق عبر الأجهزة:** أرسل مهمة من هاتفك، ودع Gateway يشغلها على خادم، واحصل على النتيجة في الدردشة.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw المساعدة في توليد العملاء المحتملين، والتواصل، والإعلانات، والمدونات لـ SaaS؟">
    نعم في **البحث والتأهيل والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات للتواصل أو نصوص الإعلانات.

    بالنسبة إلى **التواصل أو تشغيل الإعلانات**، أبقِ إنسانًا ضمن الحلقة. تجنب الرسائل غير المرغوب فيها، واتبع القوانين المحلية
    وسياسات المنصات، وراجع أي شيء قبل إرساله. النمط الأكثر أمانًا هو أن يدع
    OpenClaw يصيغ وأنت توافق.

    الوثائق: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما المزايا مقارنة بـ Claude Code لتطوير الويب؟">
    OpenClaw هو **مساعد شخصي** وطبقة تنسيق، وليس بديلًا لـ IDE. استخدم
    Claude Code أو Codex لأسرع حلقة برمجة مباشرة داخل مستودع. استخدم OpenClaw عندما تريد
    ذاكرة دائمة، ووصولًا عبر الأجهزة، وتنسيقًا للأدوات.

    المزايا:

    - **ذاكرة دائمة + مساحة عمل** عبر الجلسات
    - **وصول متعدد المنصات** (WhatsApp، Telegram، TUI، WebChat)
    - **تنسيق الأدوات** (المتصفح، الملفات، الجدولة، الخطافات)
    - **Gateway دائم التشغيل** (شغّله على VPS وتفاعل من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/التنفيذ المحلي

    العرض: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="كيف أخصص Skills من دون إبقاء المستودع متسخًا؟">
    استخدم التجاوزات المُدارة بدلًا من تحرير نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدًا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). الأسبقية هي `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمّن → `skills.load.extraDirs`، لذلك تظل التجاوزات المُدارة أعلى من Skills المضمّنة من دون لمس git. إذا كنت تحتاج إلى تثبيت Skill عالميًا لكن تريدها مرئية لبعض الوكلاء فقط، فاحتفظ بالنسخة المشتركة في `~/.openclaw/skills` وتحكم في الرؤية باستخدام `agents.defaults.skills` و`agents.list[].skills`. يجب أن تبقى التعديلات الجديرة بالإرسال إلى upstream فقط في المستودع وأن تخرج كطلبات PR.
  </Accordion>

  <Accordion title="هل يمكنني تحميل Skills من مجلد مخصص؟">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (أدنى أسبقية). الأسبقية الافتراضية هي `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمّن → `skills.load.extraDirs`. يثبّت `clawhub` في `./skills` افتراضيًا، وهو ما يعامله OpenClaw كـ `<workspace>/skills` في الجلسة التالية. إذا كان ينبغي أن تكون Skill مرئية لوكلاء محددين فقط، فاقرن ذلك بـ `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="كيف يمكنني استخدام نماذج مختلفة لمهام مختلفة؟">
    الأنماط المدعومة اليوم هي:

    - **مهام Cron**: يمكن للمهام المعزولة تعيين تجاوز `model` لكل مهمة.
    - **الوكلاء الفرعيون**: وجّه المهام إلى وكلاء منفصلين بنماذج افتراضية مختلفة.
    - **التبديل عند الطلب**: استخدم `/model` لتبديل نموذج الجلسة الحالية في أي وقت.

    راجع [مهام Cron](/ar/automation/cron-jobs)، و[توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، و[أوامر Slash](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="يتجمد البوت أثناء تنفيذ عمل ثقيل. كيف أنقل ذلك إلى مكان آخر؟">
    استخدم **الوكلاء الفرعيين** للمهام الطويلة أو المتوازية. يعمل الوكلاء الفرعيون في جلستهم الخاصة،
    ويعيدون ملخصًا، ويحافظون على استجابة الدردشة الرئيسية.

    اطلب من البوت "spawn a sub-agent for this task" أو استخدم `/subagents`.
    استخدم `/status` في الدردشة لمعرفة ما يفعله Gateway الآن (وما إذا كان مشغولًا).

    نصيحة الرموز المميزة: المهام الطويلة والوكلاء الفرعيون يستهلكون الرموز المميزة. إذا كانت التكلفة مصدر قلق، فعيّن
    نموذجًا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="كيف تعمل جلسات الوكلاء الفرعيين المرتبطة بسلاسل المحادثات على Discord؟">
    استخدم روابط سلاسل المحادثات. يمكنك ربط سلسلة محادثات Discord بوكيل فرعي أو هدف جلسة بحيث تبقى رسائل المتابعة في تلك السلسلة على الجلسة المرتبطة نفسها.

    التدفق الأساسي:

    - أنشئ باستخدام `sessions_spawn` مع `thread: true` (واختياريًا `mode: "session"` للمتابعة الدائمة).
    - أو اربط يدويًا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الربط.
    - استخدم `/session idle <duration|off>` و`/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل سلسلة المحادثات.

    التكوين المطلوب:

    - الإعدادات الافتراضية العامة: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - الربط التلقائي عند الإنشاء: القيمة الافتراضية لـ `channels.discord.threadBindings.spawnSessions` هي `true`؛ عيّنها إلى `false` لتعطيل إنشاء الجلسات المرتبطة بسلاسل المحادثات.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع التكوين](/ar/gateway/configuration-reference)، [أوامر Slash](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="انتهى وكيل فرعي، لكن تحديث الاكتمال ذهب إلى المكان الخطأ أو لم يُنشر مطلقًا. ما الذي يجب أن أتحقق منه؟">
    تحقق أولًا من مسار الطالب الذي تم حله:

    - يفضل تسليم الوكيل الفرعي في وضع الاكتمال أي سلسلة محادثات مرتبطة أو مسار محادثة عندما يكون موجودًا.
    - إذا كان أصل الاكتمال يحمل قناة فقط، يرجع OpenClaw إلى المسار المخزّن لجلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) بحيث يظل التسليم المباشر قادرًا على النجاح.
    - إذا لم يوجد مسار مرتبط ولا مسار مخزّن قابل للاستخدام، فقد يفشل التسليم المباشر وتعود النتيجة إلى تسليم الجلسة في قائمة الانتظار بدلًا من النشر فورًا في الدردشة.
    - قد تظل الأهداف غير الصالحة أو القديمة تفرض الرجوع إلى قائمة الانتظار أو فشل التسليم النهائي.
    - إذا كان آخر رد مرئي من المساعد الفرعي هو الرمز الصامت الدقيق `NO_REPLY` / `no_reply`، أو بالضبط `ANNOUNCE_SKIP`، فإن OpenClaw يكبت الإعلان عمدًا بدلًا من نشر تقدم سابق قديم.
    - إذا انتهت مهلة الفرع بعد استدعاءات أدوات فقط، فقد يختصر الإعلان ذلك إلى ملخص قصير للتقدم الجزئي بدلًا من إعادة تشغيل مخرجات الأدوات الخام.

    التصحيح:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron أو التذكيرات لا تعمل. ما الذي يجب أن أتحقق منه؟">
    يعمل Cron داخل عملية Gateway. إذا لم يكن Gateway قيد التشغيل باستمرار،
    فلن تعمل المهام المجدولة.

    قائمة التحقق:

    - تأكد من تمكين cron (`cron.enabled`) وأن `OPENCLAW_SKIP_CRON` غير معيّن.
    - تحقق من أن Gateway يعمل على مدار الساعة (بلا سكون/إعادات تشغيل).
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
    - هدف الإعلان المفقود أو غير الصالح (`channel` / `to`) يعني أن المشغّل تخطى التسليم الصادر.
    - إخفاقات مصادقة القناة (`unauthorized`, `Forbidden`) تعني أن المشغّل حاول التسليم لكن بيانات الاعتماد منعته.
    - تُعامل النتيجة المعزولة الصامتة (`NO_REPLY` / `no_reply` فقط) على أنها غير قابلة للتسليم عمدًا، لذلك يمنع المشغّل أيضًا تسليم الاحتياطي في قائمة الانتظار.

    بالنسبة إلى مهام Cron المعزولة، لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message`
    عندما يكون مسار دردشة متاحًا. يتحكم `--announce` فقط في مسار الاحتياطي الخاص بالمشغّل
    للنص النهائي الذي لم يرسله الوكيل بالفعل.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [مهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="لماذا بدّل تشغيل Cron معزول النماذج أو أعاد المحاولة مرة واحدة؟">
    يكون ذلك عادةً مسار تبديل النموذج المباشر، وليس جدولة مكررة.

    يمكن لـ Cron المعزول الاحتفاظ بتسليم نموذج وقت التشغيل وإعادة المحاولة عندما يرمي التشغيل
    النشط `LiveSessionModelSwitchError`. تحتفظ إعادة المحاولة بالمزوّد/النموذج الذي تم التبديل إليه،
    وإذا حمل التبديل تجاوزًا جديدًا لملف تعريف المصادقة، يحتفظ Cron بذلك أيضًا قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يتقدم تجاوز نموذج خطاف Gmail أولًا عند انطباقه.
    - ثم `model` لكل مهمة.
    - ثم أي تجاوز نموذج مخزن لجلسة Cron.
    - ثم اختيار النموذج العادي للوكيل/الافتراضي.

    حلقة إعادة المحاولة محدودة. بعد المحاولة الأولية بالإضافة إلى محاولتي تبديل، يوقف
    Cron العملية بدلًا من التكرار إلى الأبد.

    التصحيح:

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

    يكتب `openclaw skills install` الأصلي إلى دليل `skills/`
    في مساحة العمل النشطة. ثبّت CLI منفصلًا باسم `clawhub` فقط إذا كنت تريد نشر
    Skills الخاصة بك أو مزامنتها. للتثبيتات المشتركة عبر الوكلاء، ضع Skill تحت
    `~/.openclaw/skills` واستخدم `agents.defaults.skills` أو
    `agents.list[].skills` إذا أردت تضييق نطاق الوكلاء الذين يمكنهم رؤيتها.

  </Accordion>

  <Accordion title="هل يستطيع OpenClaw تشغيل المهام وفق جدول أو باستمرار في الخلفية؟">
    نعم. استخدم مجدول Gateway:

    - **مهام Cron** للمهام المجدولة أو المتكررة (تستمر عبر عمليات إعادة التشغيل).
    - **Heartbeat** للفحوصات الدورية في "الجلسة الرئيسية".
    - **المهام المعزولة** للوكلاء المستقلين الذين ينشرون ملخصات أو يسلّمون إلى الدردشات.

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills الخاصة بـ Apple macOS فقط من Linux؟">
    ليس مباشرة. تُقيّد Skills الخاصة بـ macOS بواسطة `metadata.openclaw.os` بالإضافة إلى الثنائيات المطلوبة، ولا تظهر Skills في موجه النظام إلا عندما تكون مؤهلة على **مضيف Gateway**. على Linux، لن تُحمّل Skills الخاصة بـ `darwin` فقط (مثل `apple-notes` و`apple-reminders` و`things-mac`) ما لم تتجاوز التقييد.

    لديك ثلاثة أنماط مدعومة:

    **الخيار أ - تشغيل Gateway على Mac (الأبسط).**
    شغّل Gateway حيث توجد ثنائيات macOS، ثم اتصل من Linux في [الوضع البعيد](#gateway-ports-already-running-and-remote-mode) أو عبر Tailscale. تُحمّل Skills بشكل طبيعي لأن مضيف Gateway هو macOS.

    **الخيار ب - استخدام عقدة macOS (بدون SSH).**
    شغّل Gateway على Linux، واقرن عقدة macOS (تطبيق شريط القوائم)، واضبط **أوامر تشغيل Node** على "السؤال دائمًا" أو "السماح دائمًا" على Mac. يمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما توجد الثنائيات المطلوبة على العقدة. يشغّل الوكيل تلك Skills عبر أداة `nodes`. إذا اخترت "السؤال دائمًا"، فإن الموافقة على "السماح دائمًا" في الموجه تضيف ذلك الأمر إلى قائمة السماح.

    **الخيار ج - تمرير ثنائيات macOS عبر SSH (متقدم).**
    أبقِ Gateway على Linux، لكن اجعل ثنائيات CLI المطلوبة تُحل إلى أغلفة SSH تعمل على Mac. ثم تجاوز Skill للسماح بـ Linux حتى تبقى مؤهلة.

    1. أنشئ غلاف SSH للثنائي (مثال: `memo` لـ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ضع الغلاف على `PATH` على مضيف Linux (مثلًا `~/bin/memo`).
    3. تجاوز بيانات تعريف Skill (مساحة العمل أو `~/.openclaw/skills`) للسماح بـ Linux:

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

    - **Skill / Plugin مخصص:** الأفضل للوصول الموثوق إلى API (لدى Notion/HeyGen واجهات API).
    - **أتمتة المتصفح:** تعمل بدون كود لكنها أبطأ وأكثر هشاشة.

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

    تصل التثبيتات الأصلية إلى دليل `skills/` في مساحة العمل النشطة. بالنسبة إلى Skills المشتركة عبر الوكلاء، ضعها في `~/.openclaw/skills/<name>/SKILL.md`. إذا كان يجب أن يرى بعض الوكلاء فقط تثبيتًا مشتركًا، فكوّن `agents.defaults.skills` أو `agents.list[].skills`. تتوقع بعض Skills ثنائيات مثبتة عبر Homebrew؛ على Linux يعني ذلك Linuxbrew (راجع إدخال الأسئلة الشائعة لـ Homebrew على Linux أعلاه). راجع [Skills](/ar/tools/skills)، و[تكوين Skills](/ar/tools/skills-config)، و[ClawHub](/ar/tools/clawhub).

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

    يمكن لهذا المسار استخدام متصفح المضيف المحلي أو عقدة متصفح متصلة. إذا كان Gateway يعمل في مكان آخر، فشغّل إما مضيف عقدة على جهاز المتصفح أو استخدم CDP بعيدًا بدلًا من ذلك.

    الحدود الحالية على `existing-session` / `user`:

    - الإجراءات مدفوعة بالمراجع، وليست مدفوعة بمحددات CSS
    - تتطلب الرفوعات `ref` / `inputRef` وتدعم حاليًا ملفًا واحدًا في كل مرة
    - لا تزال `responsebody`، وتصدير PDF، واعتراض التنزيل، وإجراءات الدُفعات تحتاج إلى متصفح مُدار أو ملف تعريف CDP خام

  </Accordion>
</AccordionGroup>

## العزل و الذاكرة

<AccordionGroup>
  <Accordion title="هل توجد وثيقة مخصصة للعزل؟">
    نعم. راجع [العزل](/ar/gateway/sandboxing). لإعداد خاص بـ Docker (Gateway كامل في Docker أو صور عزل)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدودًا - كيف أفعّل الميزات الكاملة؟">
    الصورة الافتراضية تضع الأمان أولًا وتعمل كمستخدم `node`، لذلك لا
    تتضمن حزم النظام أو Homebrew أو المتصفحات المضمّنة. لإعداد أكمل:

    - استمرارية `/home/node` باستخدام `OPENCLAW_HOME_VOLUME` حتى تبقى التخزينات المؤقتة.
    - اخبز تبعيات النظام في الصورة باستخدام `OPENCLAW_DOCKER_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المضمّن:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - اضبط `PLAYWRIGHT_BROWSERS_PATH` وتأكد من استمرار المسار.

    الوثائق: [Docker](/ar/install/docker)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل المباشرة شخصية وجعل المجموعات عامة/معزولة باستخدام وكيل واحد؟">
    نعم - إذا كان مرورك الخاص هو **رسائل مباشرة** ومرورك العام هو **مجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` حتى تعمل جلسات المجموعة/القناة (المفاتيح غير الرئيسية) في خلفية العزل المكوّنة، بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال تكوين: [المجموعات: رسائل مباشرة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع التكوين الرئيسي: [تكوين Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلد مضيف داخل العزل؟">
    اضبط `agents.defaults.sandbox.docker.binds` على `["host:path:mode"]` (مثلًا `"/home/user/src:/src:ro"`). تُدمج الربوط العامة وربوط كل وكيل؛ تُتجاهل ربوط كل وكيل عند `scope: "shared"`. استخدم `:ro` لأي شيء حساس وتذكر أن الربوط تتجاوز جدران نظام ملفات العزل.

    يتحقق OpenClaw من مصادر الربط مقابل كل من المسار المطبّع والمسار القانوني المحلول عبر أعمق سلف موجود. يعني ذلك أن حالات الهروب عبر أصل رابط رمزي لا تزال تفشل بإغلاق حتى عندما لا يكون مقطع المسار الأخير موجودًا بعد، وأن فحوصات الجذر المسموح لا تزال تنطبق بعد حل الرابط الرمزي.

    راجع [العزل](/ar/gateway/sandboxing#custom-bind-mounts) و[العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للحصول على أمثلة وملاحظات أمان.

  </Accordion>

  <Accordion title="كيف تعمل الذاكرة؟">
    ذاكرة OpenClaw هي مجرد ملفات Markdown في مساحة عمل الوكيل:

    - الملاحظات اليومية في `memory/YYYY-MM-DD.md`
    - الملاحظات طويلة الأمد المنسقة في `MEMORY.md` (الجلسات الرئيسية/الخاصة فقط)

    يشغّل OpenClaw أيضًا **تفريغ ذاكرة صامتًا قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction تلقائيًا. يعمل هذا فقط عندما تكون مساحة العمل
    قابلة للكتابة (تتخطاه العزلات للقراءة فقط). راجع [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="تستمر الذاكرة في نسيان الأشياء. كيف أجعلها تثبت؟">
    اطلب من البوت **كتابة الحقيقة إلى الذاكرة**. تنتمي الملاحظات طويلة الأمد إلى `MEMORY.md`،
    وينتقل السياق قصير الأمد إلى `memory/YYYY-MM-DD.md`.

    لا يزال هذا مجالًا نعمل على تحسينه. يساعد تذكير النموذج بتخزين الذكريات؛
    سيعرف ما يجب فعله. إذا استمر في النسيان، فتحقق من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تستمر الذاكرة إلى الأبد؟ ما الحدود؟">
    تعيش ملفات الذاكرة على القرص وتستمر حتى تحذفها. الحد هو
    مساحة التخزين لديك، وليس النموذج. لا يزال **سياق الجلسة** محدودًا بنافذة سياق
    النموذج، لذلك يمكن للمحادثات الطويلة أن تُضغط أو تُقتطع. لهذا السبب
    يوجد بحث الذاكرة - فهو يعيد الأجزاء ذات الصلة فقط إلى السياق.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب بحث الذاكرة الدلالي مفتاح OpenAI API؟">
    فقط إذا كنت تستخدم **تضمينات OpenAI**. يغطي Codex OAuth المحادثة/الإكمالات و
    **لا** يمنح وصولًا إلى التضمينات، لذلك **تسجيل الدخول باستخدام Codex (OAuth أو
    تسجيل دخول Codex CLI)** لا يساعد في بحث الذاكرة الدلالي. لا تزال تضمينات OpenAI
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تضبط مزودًا صراحة، يختار OpenClaw مزودًا تلقائيًا عندما
    يستطيع حل مفتاح API (ملفات تعريف المصادقة، أو `models.providers.*.apiKey`، أو متغيرات البيئة).
    يفضل OpenAI إذا أمكن حل مفتاح OpenAI، وإلا Gemini إذا أمكن حل مفتاح Gemini،
    ثم Voyage، ثم Mistral. إذا لم يتوفر أي مفتاح بعيد، يبقى بحث
    الذاكرة معطلًا حتى تضبطه. إذا كان لديك مسار نموذج محلي
    مضبوط وموجود، يفضل OpenClaw
    `local`. يدعم Ollama عندما تضبط صراحة
    `memorySearch.provider = "ollama"`.

    إذا كنت تفضل البقاء محليًا، فاضبط `memorySearch.provider = "local"` (واختياريًا
    `memorySearch.fallback = "none"`). إذا كنت تريد تضمينات Gemini، فاضبط
    `memorySearch.provider = "gemini"` وقدّم `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). نحن ندعم نماذج تضمين **OpenAI أو Gemini أو Voyage أو Mistral أو Ollama أو local**
    - راجع [الذاكرة](/ar/concepts/memory) لتفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## أماكن وجود الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل تُحفظ كل البيانات المستخدمة مع OpenClaw محليًا؟">
    لا - **حالة OpenClaw محلية**، لكن **الخدمات الخارجية لا تزال ترى ما ترسله إليها**.

    - **محليًا افتراضيًا:** الجلسات وملفات الذاكرة والتكوين ومساحة العمل موجودة على مضيف Gateway
      (`~/.openclaw` + دليل مساحة عملك).
    - **بعيدًا بحكم الضرورة:** الرسائل التي ترسلها إلى مزودي النماذج (Anthropic/OpenAI/etc.) تذهب إلى
      واجهات API الخاصة بهم، ومنصات المحادثة (WhatsApp/Telegram/Slack/etc.) تخزن بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في البصمة:** استخدام النماذج المحلية يبقي المطالبات على جهازك، لكن حركة
      القنوات لا تزال تمر عبر خوادم القناة.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    يوجد كل شيء ضمن `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | المسار                                                          | الغرض                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | التكوين الرئيسي (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | استيراد OAuth القديم (يُنسخ إلى ملفات تعريف المصادقة عند أول استخدام) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات تعريف المصادقة (OAuth، مفاتيح API، و`keyRef`/`tokenRef` اختياريًا) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | حمولة سرية اختيارية مدعومة بملف لمزودي SecretRef من نوع `file`     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ملف توافق قديم (تُزال إدخالات `api_key` الثابتة منه)              |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | حالة المزود (مثل `whatsapp/<accountId>/creds.json`)               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | حالة لكل وكيل (agentDir + الجلسات)                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | سجل المحادثات والحالة (لكل وكيل)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | بيانات وصفية للجلسات (لكل وكيل)                                   |

    مسار الوكيل الفردي القديم: `~/.openclaw/agent/*` (يُرحّل بواسطة `openclaw doctor`).

    **مساحة العمل** الخاصة بك (AGENTS.md، ملفات الذاكرة، Skills، إلخ) منفصلة وتُضبط عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    توجد هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` اختياري.
      ملف الجذر ذي الأحرف الصغيرة `memory.md` هو إدخال إصلاح قديم فقط؛ يمكن لـ `openclaw doctor --fix`
      دمجه في `MEMORY.md` عند وجود الملفين معًا.
    - **دليل الحالة (`~/.openclaw`)**: التكوين، حالة القناة/المزود، ملفات تعريف المصادقة، الجلسات، السجلات،
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

    نصيحة: إذا كنت تريد سلوكًا أو تفضيلًا دائمًا، فاطلب من البوت **كتابته في
    AGENTS.md أو MEMORY.md** بدلًا من الاعتماد على سجل المحادثة.

    راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) و[الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="استراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** في مستودع git **خاص** وانسخها احتياطيًا في مكان
    خاص (مثل GitHub private). يلتقط هذا الذاكرة + ملفات AGENTS/SOUL/USER،
    ويتيح لك استعادة "عقل" المساعد لاحقًا.

    **لا** تودع أي شيء ضمن `~/.openclaw` (بيانات الاعتماد أو الجلسات أو الرموز أو حمولات الأسرار المشفرة).
    إذا كنت تحتاج إلى استعادة كاملة، فانسخ كلًا من مساحة العمل ودليل الحالة احتياطيًا
    بشكل منفصل (راجع سؤال الترحيل أعلاه).

    المستندات: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف أزيل تثبيت OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إلغاء التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. مساحة العمل هي **cwd الافتراضي** ومرساة الذاكرة، وليست صندوق عزل صارمًا.
    تُحل المسارات النسبية داخل مساحة العمل، لكن يمكن للمسارات المطلقة الوصول إلى مواقع
    أخرى على المضيف ما لم يكن العزل مفعّلًا. إذا كنت تحتاج إلى العزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات العزل لكل وكيل. إذا كنت
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
    حالة الجلسة مملوكة لـ **مضيف gateway**. إذا كنت في الوضع البعيد، فإن مخزن الجلسات الذي يهمك موجود على الجهاز البعيد، وليس حاسوبك المحمول المحلي. راجع [إدارة الجلسات](/ar/concepts/session).
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

  <Accordion title='ضبطت gateway.bind: "lan" (أو "tailnet") والآن لا يوجد شيء يستمع / تقول الواجهة إن الوصول غير مصرح به'>
    تتطلب عمليات الربط غير local loopback **مسار مصادقة gateway صالحًا**. عمليًا يعني ذلك:

    - مصادقة السر المشترك: رمز أو كلمة مرور
    - `gateway.auth.mode: "trusted-proxy"` خلف وكيل عكسي واعٍ بالهوية ومضبوط بشكل صحيح

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

    - `gateway.remote.token` / `.password` **لا** يفعّلان مصادقة gateway المحلية بمفردهما.
    - يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كاحتياطي فقط عندما لا يكون `gateway.auth.*` مضبوطًا.
    - لمصادقة كلمة المرور، اضبط `gateway.auth.mode: "password"` بالإضافة إلى `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`) بدلًا من ذلك.
    - إذا ضُبط `gateway.auth.token` / `gateway.auth.password` صراحة عبر SecretRef ولم يُحل، يفشل الحل بشكل مغلق (من دون إخفاء باحتياطي بعيد).
    - إعدادات واجهة التحكم ذات السر المشترك تصادق عبر `connect.params.auth.token` أو `connect.params.auth.password` (المخزنة في إعدادات التطبيق/الواجهة). الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy` تستخدم ترويسات الطلب بدلًا من ذلك. تجنب وضع الأسرار المشتركة في عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، تتطلب الوكلاء العكسية عبر local loopback على المضيف نفسه ضبط `gateway.auth.trustedProxy.allowLoopback = true` صراحة وإدخال local loopback في `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="لماذا أحتاج إلى رمز على localhost الآن؟">
    يفرض OpenClaw مصادقة gateway افتراضيًا، بما في ذلك loopback. في المسار الافتراضي المعتاد يعني ذلك مصادقة الرمز: إذا لم يُضبط مسار مصادقة صريح، فإن بدء gateway يُحل إلى وضع الرمز وينشئ رمزًا خاصًا بوقت التشغيل فقط لذلك التشغيل، لذلك **يجب أن تصادق عملاء WS المحليون**. اضبط `gateway.auth.token` أو `gateway.auth.password` أو `OPENCLAW_GATEWAY_TOKEN` أو `OPENCLAW_GATEWAY_PASSWORD` صراحة عندما يحتاج العملاء إلى سر ثابت عبر عمليات إعادة التشغيل. هذا يمنع العمليات المحلية الأخرى من استدعاء Gateway.

    إذا كنت تفضل مسار مصادقة مختلفًا، يمكنك اختيار وضع كلمة المرور صراحة (أو `trusted-proxy` للوكلاء العكسيين الواعين بالهوية). إذا كنت **تريد حقًا** فتح loopback، فاضبط `gateway.auth.mode: "none"` صراحة في تكوينك. يمكن لـ Doctor إنشاء رمز لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب أن أعيد التشغيل بعد تغيير التكوين؟">
    يراقب Gateway التكوين ويدعم إعادة التحميل الفوري:

    - `gateway.reload.mode: "hybrid"` (الافتراضي): يطبق التغييرات الآمنة فورًا، ويعيد التشغيل للتغييرات الحرجة
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
    يعمل `web_fetch` بدون مفتاح API. يعتمد `web_search` على المزود
    المحدد لديك:

    - المزودون المدعومون بـ API مثل Brave وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وPerplexity وTavily يتطلبون إعداد مفتاح API المعتاد لديهم.
    - بحث الويب في Ollama بلا مفتاح، لكنه يستخدم مضيف Ollama المضبوط لديك ويتطلب `ollama signin`.
    - DuckDuckGo بلا مفتاح، لكنه تكامل غير رسمي قائم على HTML.
    - SearXNG بلا مفتاح/مستضاف ذاتيًا؛ اضبط `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

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

    يوجد إعداد بحث الويب الخاص بكل مزوّد الآن ضمن `plugins.entries.<plugin>.config.webSearch.*`.
    لا تزال مسارات المزوّد القديمة `tools.web.search.*` تُحمَّل مؤقتًا للتوافق، لكن ينبغي عدم استخدامها في الإعدادات الجديدة.
    يوجد إعداد بديل جلب الويب في Firecrawl ضمن `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم السماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - يكون `web_fetch` مفعّلًا افتراضيًا (ما لم يُعطَّل صراحة).
    - إذا حُذف `tools.web.fetch.provider`، يكتشف OpenClaw تلقائيًا أول مزوّد بديل جاهز للجلب من بيانات الاعتماد المتاحة. المزوّد المضمّن حاليًا هو Firecrawl.
    - تقرأ الخدمات الخلفية متغيرات البيئة من `~/.openclaw/.env` (أو من بيئة الخدمة).

    الوثائق: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="مسح config.apply إعدادي. كيف أستعيده وأتجنب ذلك؟">
    يستبدل `config.apply` **الإعداد بالكامل**. إذا أرسلت كائنًا جزئيًا، فسيُزال كل
    شيء آخر.

    يحمي OpenClaw الحالي من كثير من عمليات الكتابة العرضية المدمّرة:

    - تتحقق عمليات كتابة الإعداد المملوكة لـ OpenClaw من كامل الإعداد بعد التغيير قبل الكتابة.
    - تُرفض عمليات الكتابة غير الصالحة أو المدمّرة المملوكة لـ OpenClaw وتُحفظ باسم `openclaw.json.rejected.*`.
    - إذا كسر تعديل مباشر بدء التشغيل أو إعادة التحميل الفورية، يفشل Gateway مغلقًا أو يتجاوز إعادة التحميل؛ ولا يعيد كتابة `openclaw.json`.
    - يملك `openclaw doctor --fix` عملية الإصلاح ويمكنه استعادة آخر إعداد معروف صالح مع حفظ الملف المرفوض باسم `openclaw.json.clobbered.*`.

    الاستعادة:

    - افحص `openclaw logs --follow` بحثًا عن `Invalid config at` أو `Config write rejected:` أو `config reload skipped (invalid config)`.
    - افحص أحدث `openclaw.json.clobbered.*` أو `openclaw.json.rejected.*` بجانب الإعداد النشط.
    - شغّل `openclaw config validate` و`openclaw doctor --fix`.
    - انسخ المفاتيح المقصودة فقط مرة أخرى باستخدام `openclaw config set` أو `config.patch`.
    - إذا لم يكن لديك آخر إعداد معروف صالح أو حمولة مرفوضة، فاستعد من نسخة احتياطية، أو أعد تشغيل `openclaw doctor` وأعد ضبط القنوات/النماذج.
    - إذا كان هذا غير متوقع، فافتح بلاغ خطأ وأرفق آخر إعداد معروف لديك أو أي نسخة احتياطية.
    - يمكن لوكيل برمجة محلي غالبًا إعادة بناء إعداد صالح للعمل من السجلات أو السجل التاريخي.

    تجنّبه:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` للتعديلات التفاعلية.
    - استخدم `config.schema.lookup` أولًا عندما لا تكون متأكدًا من مسار دقيق أو شكل الحقل؛ فهو يعيد عقدة مخطط سطحية مع ملخصات الأبناء المباشرين للتنقّل التفصيلي.
    - استخدم `config.patch` لتعديلات RPC الجزئية؛ واترك `config.apply` لاستبدال الإعداد الكامل فقط.
    - إذا كنت تستخدم أداة `gateway` المخصّصة للمالك فقط من تشغيل وكيل، فستظل ترفض الكتابة إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك الأسماء المستعارة القديمة `tools.bash.*` التي تُطبّع إلى مسارات exec المحمية نفسها).

    الوثائق: [الإعداد](/ar/cli/config)، [التهيئة](/ar/cli/configure)، [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغّل Gateway مركزيًا مع عمّال متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحد** (مثل Raspberry Pi) إضافةً إلى **Nodes** و**وكلاء**:

    - **Gateway (مركزي):** يملك القنوات (Signal/WhatsApp)، والتوجيه، والجلسات.
    - **Nodes (الأجهزة):** تتصل أجهزة Macs/iOS/Android كملحقات وتكشف أدوات محلية (`system.run`، `canvas`، `camera`).
    - **الوكلاء (العمّال):** عقول/مساحات عمل منفصلة للأدوار الخاصة (مثل "عمليات Hetzner"، "البيانات الشخصية").
    - **الوكلاء الفرعيون:** يشغّلون عملًا في الخلفية من وكيل رئيسي عندما تريد التوازي.
    - **TUI:** اتصل بـ Gateway وبدّل بين الوكلاء/الجلسات.

    الوثائق: [Nodes](/ar/nodes)، [الوصول البعيد](/ar/gateway/remote)، [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/ar/web/tui).

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

    القيمة الافتراضية هي `false` (بواجهة مرئية). يزيد وضع عدم الواجهة احتمال تفعيل فحوصات مكافحة الروبوتات في بعض المواقع. راجع [المتصفح](/ar/tools/browser).

    يستخدم وضع عدم الواجهة **محرك Chromium نفسه** ويعمل لمعظم عمليات الأتمتة (النماذج، النقرات، الاستخلاص، تسجيلات الدخول). الاختلافات الرئيسية:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات الشاشة إذا احتجت إلى المرئيات).
    - بعض المواقع أكثر تشددًا تجاه الأتمتة في وضع عدم الواجهة (CAPTCHAs، مكافحة الروبوتات).
      على سبيل المثال، كثيرًا ما يحظر X/Twitter الجلسات دون واجهة.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    اضبط `browser.executablePath` على ملف Brave التنفيذي لديك (أو أي متصفح مستند إلى Chromium) وأعد تشغيل Gateway.
    راجع أمثلة الإعداد الكاملة في [المتصفح](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## البوابات وNodes البعيدة

<AccordionGroup>
  <Accordion title="كيف تنتقل الأوامر بين Telegram وGateway وNodes؟">
    تتعامل **Gateway** مع رسائل Telegram. تشغّل Gateway الوكيل
    وبعد ذلك فقط تستدعي Nodes عبر **Gateway WebSocket** عندما تكون أداة Node مطلوبة:

    Telegram → Gateway → الوكيل → `node.*` → Node → Gateway → Telegram

    لا ترى Nodes حركة مرور المزوّد الواردة؛ فهي تتلقى استدعاءات RPC الخاصة بـ Node فقط.

  </Accordion>

  <Accordion title="كيف يمكن لوكيلي الوصول إلى حاسوبي إذا كان Gateway مستضافًا عن بُعد؟">
    الإجابة المختصرة: **أقرن حاسوبك بصفته Node**. يعمل Gateway في مكان آخر، لكنه يستطيع
    استدعاء أدوات `node.*` (الشاشة، الكاميرا، النظام) على جهازك المحلي عبر Gateway WebSocket.

    الإعداد النموذجي:

    1. شغّل Gateway على المضيف دائم التشغيل (VPS/خادم منزلي).
    2. ضع مضيف Gateway وحاسوبك على شبكة tailnet نفسها.
    3. تأكد من إمكانية الوصول إلى Gateway WS (ربط tailnet أو نفق SSH).
    4. افتح تطبيق macOS محليًا واتصل في وضع **بعيد عبر SSH** (أو عبر tailnet مباشرة)
       حتى يتمكن من التسجيل كـ Node.
    5. وافق على Node في Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا يلزم جسر TCP منفصل؛ تتصل Nodes عبر Gateway WebSocket.

    تذكير أمني: إقران Node على macOS يسمح بتشغيل `system.run` على ذلك الجهاز. أقرن
    الأجهزة التي تثق بها فقط، وراجع [الأمان](/ar/gateway/security).

    الوثائق: [Nodes](/ar/nodes)، [بروتوكول Gateway](/ar/gateway/protocol)، [وضع macOS البعيد](/ar/platforms/mac/remote)، [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل لكنني لا أتلقى أي ردود. ماذا الآن؟">
    تحقق من الأساسيات:

    - Gateway يعمل: `openclaw gateway status`
    - صحة Gateway: `openclaw status`
    - صحة القناة: `openclaw channels status`

    ثم تحقق من المصادقة والتوجيه:

    - إذا كنت تستخدم Tailscale Serve، فتأكد من ضبط `gateway.auth.allowTailscale` بشكل صحيح.
    - إذا كنت تتصل عبر نفق SSH، فتأكد من أن النفق المحلي يعمل ويشير إلى المنفذ الصحيح.
    - تأكد من أن قوائم السماح لديك (رسالة مباشرة أو مجموعة) تتضمن حسابك.

    الوثائق: [Tailscale](/ar/gateway/tailscale)، [الوصول البعيد](/ar/gateway/remote)، [القنوات](/ar/channels).

  </Accordion>

  <Accordion title="هل يمكن لمثيلي OpenClaw التحدث معًا (محلي + VPS)؟">
    نعم. لا يوجد جسر مدمج "من روبوت إلى روبوت"، لكن يمكنك توصيله بعدة طرق
    موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يمكن للروبوتين الوصول إليها (Telegram/Slack/WhatsApp).
    اجعل الروبوت أ يرسل رسالة إلى الروبوت ب، ثم دع الروبوت ب يرد كالمعتاد.

    **جسر CLI (عام):** شغّل سكربتًا يستدعي Gateway الآخر باستخدام
    `openclaw agent --message ... --deliver`، مستهدفًا دردشة يستمع إليها الروبوت الآخر.
    إذا كان أحد الروبوتين على VPS بعيد، فوجّه CLI لديك إلى Gateway البعيد
    عبر SSH/Tailscale (راجع [الوصول البعيد](/ar/gateway/remote)).

    نمط مثال (شغّله من جهاز يمكنه الوصول إلى Gateway الهدف):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف حاجز أمان حتى لا يدخل الروبوتان في حلقة لا نهائية (الرد عند الذكر فقط، قوائم
    سماح القنوات، أو قاعدة "عدم الرد على رسائل الروبوتات").

    الوثائق: [الوصول البعيد](/ar/gateway/remote)، [CLI الوكيل](/ar/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى VPSات منفصلة لعدة وكلاء؟">
    لا. يمكن لـ Gateway واحد استضافة عدة وكلاء، لكل منهم مساحة عمله الخاصة، وافتراضيات النموذج،
    والتوجيه. هذا هو الإعداد الطبيعي، وهو أرخص وأبسط بكثير من تشغيل
    VPS واحد لكل وكيل.

    استخدم VPSات منفصلة فقط عندما تحتاج إلى عزل صارم (حدود أمنية) أو إعدادات
    مختلفة جدًا لا تريد مشاركتها. وإلا فأبقِ Gateway واحدًا واستخدم
    عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل هناك فائدة من استخدام Node على حاسوبي المحمول الشخصي بدلًا من SSH من VPS؟">
    نعم - تعد Nodes الطريقة الأساسية للوصول إلى حاسوبك المحمول من Gateway بعيد، وهي
    تتيح أكثر من وصول shell. يعمل Gateway على macOS/Linux (وWindows عبر WSL2) وهو
    خفيف (يكفي VPS صغير أو جهاز بمستوى Raspberry Pi؛ وذاكرة RAM بسعة 4 GB كافية)، لذا يكون الإعداد
    الشائع مضيفًا دائم التشغيل إضافة إلى حاسوبك المحمول كـ Node.

    - **لا يلزم SSH وارد.** تتصل Nodes خارجيًا بـ Gateway WebSocket وتستخدم إقران الأجهزة.
    - **ضوابط تنفيذ أكثر أمانًا.** يخضع `system.run` لقوائم السماح/الموافقات الخاصة بـ Node على ذلك الحاسوب المحمول.
    - **أدوات أجهزة أكثر.** تكشف Nodes أدوات `canvas` و`camera` و`screen` إضافة إلى `system.run`.
    - **أتمتة متصفح محلية.** أبقِ Gateway على VPS، لكن شغّل Chrome محليًا عبر مضيف Node على الحاسوب المحمول، أو اتصل بـ Chrome المحلي على المضيف عبر Chrome MCP.

    SSH مناسب للوصول العارض إلى shell، لكن Nodes أبسط لسير عمل الوكلاء المستمر
    وأتمتة الأجهزة.

    الوثائق: [Nodes](/ar/nodes)، [CLI الخاص بـ Nodes](/ar/cli/nodes)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تشغّل Nodes خدمة Gateway؟">
    لا. يجب تشغيل **Gateway واحد** فقط لكل مضيف ما لم تكن تشغّل ملفات تعريف معزولة عمدًا (راجع [بوابات متعددة](/ar/gateway/multiple-gateways)). Nodes هي ملحقات تتصل
    بـ Gateway (Nodes على iOS/Android، أو "وضع Node" على macOS في تطبيق شريط القوائم). بالنسبة إلى مضيفات Node
    دون واجهة والتحكم عبر CLI، راجع [CLI مضيف Node](/ar/cli/node).

    يلزم إعادة تشغيل كاملة لتغييرات سطح `gateway` و`discovery` وPlugin المستضاف.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق الإعداد؟">
    نعم.

    - `config.schema.lookup`: افحص شجرة فرعية واحدة من الإعدادات مع عقدة المخطط السطحية الخاصة بها، وتلميح واجهة المستخدم المطابق، وملخصات الأبناء المباشرين قبل الكتابة
    - `config.get`: اجلب اللقطة الحالية + التجزئة
    - `config.patch`: تحديث جزئي آمن (مفضل لمعظم تعديلات RPC)؛ يعيد التحميل الساخن عند الإمكان ويعيد التشغيل عند الحاجة
    - `config.apply`: تحقق من الصحة + استبدل الإعداد الكامل؛ يعيد التحميل الساخن عند الإمكان ويعيد التشغيل عند الحاجة
    - لا تزال أداة وقت التشغيل `gateway` الخاصة بالمالك فقط ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ وتتم تسوية الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها

  </Accordion>

  <Accordion title="إعداد بسيط وسليم للتثبيت الأول">
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

    1. **ثبّت + سجّل الدخول على VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ثبّت + سجّل الدخول على جهاز Mac**
       - استخدم تطبيق Tailscale وسجّل الدخول إلى الـ tailnet نفسه.
    3. **فعّل MagicDNS (موصى به)**
       - في لوحة تحكم Tailscale الإدارية، فعّل MagicDNS ليكون لدى VPS اسم ثابت.
    4. **استخدم اسم مضيف tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا أردت واجهة التحكم دون SSH، فاستخدم Tailscale Serve على VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    يبقي هذا Gateway مربوطًا بـ local loopback ويكشف HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أوصل عقدة Mac بـ Gateway بعيد (Tailscale Serve)؟">
    يكشف Serve **واجهة تحكم Gateway + WS**. تتصل العقد عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكد من أن VPS + Mac على الـ tailnet نفسه**.
    2. **استخدم تطبيق macOS في الوضع البعيد** (يمكن أن يكون هدف SSH هو اسم مضيف tailnet).
       سيقوم التطبيق بإنشاء نفق لمنفذ Gateway والاتصال كعقدة.
    3. **وافق على العقدة** على gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    الوثائق: [بروتوكول Gateway](/ar/gateway/protocol)، [الاكتشاف](/ar/gateway/discovery)، [وضع macOS البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل يجب أن أثبّت على حاسوب محمول ثانٍ أم أضيف عقدة فقط؟">
    إذا كنت تحتاج فقط إلى **الأدوات المحلية** (الشاشة/الكاميرا/exec) على الحاسوب المحمول الثاني، فأضفه كـ
    **عقدة**. يحافظ ذلك على Gateway واحد ويتجنب تكرار الإعدادات. أدوات العقدة المحلية
    حاليًا خاصة بـ macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    ثبّت Gateway ثانيًا فقط عندما تحتاج إلى **عزل صارم** أو بوتين منفصلين بالكامل.

    الوثائق: [العقد](/ar/nodes)، [CLI العقد](/ar/cli/nodes)، [بوابات متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات البيئة وتحميل .env

<AccordionGroup>
  <Accordion title="كيف يحمّل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات البيئة من العملية الأصلية (shell، launchd/systemd، CI، وغيرها) ويحمّل بالإضافة إلى ذلك:

    - `.env` من دليل العمل الحالي
    - `.env` احتياطيًا عامًا من `~/.openclaw/.env` (المعروف أيضًا باسم `$OPENCLAW_STATE_DIR/.env`)

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

    يشغّل هذا shell تسجيل الدخول لديك ويستورد فقط المفاتيح المتوقعة المفقودة (ولا يتجاوز أبدًا). مقابلات متغيرات البيئة:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='عيّنت COPILOT_GITHUB_TOKEN، لكن حالة النماذج تعرض "Shell env: off." لماذا؟'>
    يبلّغ `openclaw models status` عما إذا كان **استيراد بيئة shell** مفعّلًا. لا تعني "Shell env: off"
    أن متغيرات البيئة لديك مفقودة - بل تعني فقط أن OpenClaw لن يحمّل
    shell تسجيل الدخول لديك تلقائيًا.

    إذا كان Gateway يعمل كخدمة (launchd/systemd)، فلن يرث بيئة shell
    لديك. أصلح ذلك بإحدى الطرق التالية:

    1. ضع الرمز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد shell (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في الإعدادات لديك (يُطبّق فقط إذا كان مفقودًا).

    ثم أعد تشغيل gateway وتحقق مجددًا:

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

  <Accordion title="هل تُعاد ضبط الجلسات تلقائيًا إذا لم أرسل /new مطلقًا؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا **معطّل افتراضيًا** (الافتراضي **0**).
    عيّنه إلى قيمة موجبة لتفعيل انتهاء الصلاحية عند الخمول. عند التفعيل، تبدأ الرسالة **التالية**
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

    ومع ذلك، من الأفضل النظر إلى هذا كتجربة **ممتعة**. فهو يستهلك الكثير من الرموز وغالبًا
    ما يكون أقل كفاءة من استخدام بوت واحد مع جلسات منفصلة. النموذج المعتاد الذي
    نتصوره هو بوت واحد تتحدث إليه، مع جلسات مختلفة للعمل المتوازي. يمكن لذلك
    البوت أيضًا إنشاء وكلاء فرعيين عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [CLI الوكلاء](/ar/cli/agents).

  </Accordion>

  <Accordion title="لماذا اقتُطع السياق في منتصف المهمة؟ كيف أمنع ذلك؟">
    سياق الجلسة محدود بنافذة النموذج. يمكن للمحادثات الطويلة، أو مخرجات الأدوات الكبيرة، أو الملفات الكثيرة
    أن تؤدي إلى Compaction أو الاقتطاع.

    ما يساعد:

    - اطلب من البوت تلخيص الحالة الحالية وكتابتها إلى ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل المواضيع.
    - احتفظ بالسياق المهم في مساحة العمل واطلب من البوت قراءته مجددًا.
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

    ثم شغّل الإعداد من جديد:

    ```bash
    openclaw onboard --install-daemon
    ```

    ملاحظات:

    - يعرض الإعداد الأولي أيضًا **إعادة الضبط** إذا وجد إعدادًا موجودًا. راجع [الإعداد الأولي (CLI)](/ar/start/wizard).
    - إذا استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد ضبط كل دليل حالة (الافتراضيات هي `~/.openclaw-<profile>`).
    - إعادة ضبط التطوير: `openclaw gateway --dev --reset` (للتطوير فقط؛ يمسح إعدادات التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='أتلقى أخطاء "context too large" - كيف أعيد الضبط أو أستخدم compact؟'>
    استخدم أحد هذه الخيارات:

    - **Compact** (يبقي المحادثة لكنه يلخص الأدوار الأقدم):

      ```
      /compact
      ```

      أو `/compact <instructions>` لتوجيه الملخص.

    - **إعادة ضبط** (معرّف جلسة جديد لمفتاح الدردشة نفسه):

      ```
      /new
      /reset
      ```

    إذا استمر حدوث ذلك:

    - فعّل أو اضبط **تقليم الجلسة** (`agents.defaults.contextPruning`) لتقليص مخرجات الأدوات القديمة.
    - استخدم نموذجًا بنافذة سياق أكبر.

    الوثائق: [Compaction](/ar/concepts/compaction)، [تقليم الجلسة](/ar/concepts/session-pruning)، [إدارة الجلسات](/ar/concepts/session).

  </Accordion>

  <Accordion title='لماذا أرى "LLM request rejected: messages.content.tool_use.input field required"؟'>
    هذا خطأ تحقق من المزوّد: أصدر النموذج كتلة `tool_use` دون `input` المطلوب.
    يعني ذلك عادةً أن سجل الجلسة قديم أو تالف (غالبًا بعد خيوط طويلة
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

    إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (أسطر فارغة فقط ورؤوس markdown
    مثل `# Heading`)، يتخطى OpenClaw تشغيل Heartbeat لتوفير استدعاءات API.
    إذا كان الملف مفقودًا، فسيظل Heartbeat يعمل ويقرر النموذج ما يجب فعله.

    تستخدم التجاوزات لكل وكيل `agents.list[].heartbeat`. الوثائق: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل أحتاج إلى إضافة "حساب بوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك أنت**، لذا إذا كنت في المجموعة، يمكن لـ OpenClaw رؤيتها.
    افتراضيًا، تُحظر ردود المجموعات حتى تسمح بالمرسلين (`groupPolicy: "allowlist"`).

    إذا أردت أن تكون **أنت فقط** قادرًا على تشغيل ردود المجموعة:

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

    الخيار 2 (إذا كان معدًا/مسموحًا به مسبقًا): اعرض المجموعات من الإعدادات:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    الوثائق: [WhatsApp](/ar/channels/whatsapp)، [الدليل](/ar/cli/directory)، [السجلات](/ar/cli/logs).

  </Accordion>

  <Accordion title="لماذا لا يرد OpenClaw في مجموعة؟">
    سببان شائعان:

    - بوابة الإشارة مفعّلة (افتراضي). يجب أن تشير إلى البوت بـ @mention (أو تطابق `mentionPatterns`).
    - قمت بتكوين `channels.whatsapp.groups` دون `"*"` والمجموعة ليست في قائمة السماح.

    راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشارك المجموعات/الخيوط السياق مع الرسائل المباشرة؟">
    تُدمج الدردشات المباشرة في الجلسة الرئيسية افتراضيًا. لدى المجموعات/القنوات مفاتيح جلسات خاصة بها، وتُعد مواضيع Telegram / خيوط Discord جلسات منفصلة. راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم عدد مساحات العمل والوكلاء التي يمكنني إنشاؤها؟">
    لا توجد حدود صارمة. العشرات (بل حتى المئات) مقبولة، لكن انتبه إلى:

    - **نمو القرص:** الجلسات + النصوص الكاملة موجودة ضمن `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** يعني المزيد من الوكلاء استخدامًا متزامنًا أكبر للنماذج.
    - **عبء التشغيل:** ملفات تعريف المصادقة، ومساحات العمل، وتوجيه القنوات لكل وكيل.

    نصائح:

    - أبقِ مساحة عمل **نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - قلّم الجلسات القديمة (احذف JSONL أو إدخالات المخزن) إذا زاد استخدام القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل الشاردة وعدم تطابق ملفات التعريف.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة بوتات أو محادثات في الوقت نفسه (Slack)، وكيف ينبغي إعداد ذلك؟">
    نعم. استخدم **توجيه الوكلاء المتعددين** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة حسب
    القناة/الحساب/النظير. Slack مدعوم كقناة ويمكن ربطه بوكلاء محددين.

    الوصول عبر المتصفح قوي، لكنه لا يعني "فعل أي شيء يمكن للإنسان فعله" - فمكافحة البوتات، وCAPTCHA، والمصادقة متعددة العوامل
    قد تظل تمنع الأتمتة. للحصول على تحكم المتصفح الأكثر موثوقية، استخدم Chrome MCP المحلي على المضيف،
    أو استخدم CDP على الجهاز الذي يشغّل المتصفح فعليًا.

    إعداد الممارسة الأفضل:

    - مضيف Gateway يعمل دائمًا (VPS/Mac mini).
    - وكيل واحد لكل دور (ارتباطات).
    - قناة أو قنوات Slack مرتبطة بهؤلاء الوكلاء.
    - متصفح محلي عبر Chrome MCP أو Node عند الحاجة.

    الوثائق: [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent), [Slack](/ar/channels/slack),
    [المتصفح](/ar/tools/browser), [Nodes](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج، وتجاوز الأعطال، وملفات تعريف المصادقة

تعيش أسئلة وأجوبة النماذج — الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الأعطال، وملفات تعريف المصادقة —
في [الأسئلة الشائعة عن النماذج](/ar/help/faq-models).

## Gateway: المنافذ، و"قيد التشغيل بالفعل"، والوضع البعيد

<AccordionGroup>
  <Accordion title="ما المنفذ الذي يستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ المفرد متعدد الاستخدامات لـ WebSocket + HTTP (Control UI، والخطافات، وما إلى ذلك).

    الأولوية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا يقول openclaw gateway status "Runtime: running" لكن "Connectivity probe: failed"؟'>
    لأن "running" هي رؤية **المشرف** (launchd/systemd/schtasks). مسبار الاتصال هو CLI وهو يتصل فعليًا بـ WebSocket الخاص بـ Gateway.

    استخدم `openclaw gateway status` وثق بهذه الأسطر:

    - `Probe target:` (عنوان URL الذي استخدمه المسبار فعليًا)
    - `Listening:` (ما هو مرتبط فعليًا على المنفذ)
    - `Last gateway error:` (السبب الجذري الشائع عندما تكون العملية حية لكن المنفذ لا يستمع)

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status أن "Config (cli)" و"Config (service)" مختلفان؟'>
    أنت تعدّل ملف تهيئة واحدًا بينما الخدمة تعمل بملف آخر (غالبًا عدم تطابق `--profile` / `OPENCLAW_STATE_DIR`).

    الإصلاح:

    ```bash
    openclaw gateway install --force
    ```

    شغّل ذلك من نفس `--profile` / البيئة التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ماذا تعني "another gateway instance is already listening"؟'>
    يفرض OpenClaw قفل تشغيل عن طريق ربط مستمع WebSocket فورًا عند بدء التشغيل (افتراضيًا `ws://127.0.0.1:18789`). إذا فشل الربط مع `EADDRINUSE`، فإنه يرمي `GatewayLockError` مشيرًا إلى أن مثيلًا آخر يستمع بالفعل.

    الإصلاح: أوقف المثيل الآخر، أو حرّر المنفذ، أو شغّل باستخدام `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="كيف أشغّل OpenClaw في الوضع البعيد (عميل يتصل بـ Gateway في مكان آخر)؟">
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
    - يراقب تطبيق macOS ملف التهيئة ويبدّل الأوضاع مباشرة عند تغير هذه القيم.
    - `gateway.remote.token` / `.password` هي بيانات اعتماد بعيدة من جهة العميل فقط؛ ولا تفعّل مصادقة Gateway محليًا بحد ذاتها.

  </Accordion>

  <Accordion title='تقول Control UI "unauthorized" (أو تستمر في إعادة الاتصال). ماذا الآن؟'>
    مسار مصادقة Gateway وطريقة مصادقة واجهة المستخدم غير متطابقين.

    حقائق (من الكود):

    - تحتفظ Control UI بالرمز في `sessionStorage` لجلسة تبويب المتصفح الحالية وعنوان Gateway URL المحدد، لذلك تستمر عمليات التحديث في نفس التبويب بالعمل دون استعادة استمرارية رمز localStorage طويلة الأمد.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة محاولة واحدة محدودة باستخدام رمز جهاز مخزن مؤقتًا عندما يعيد Gateway تلميحات إعادة المحاولة (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - إعادة المحاولة هذه بالرمز المخزن مؤقتًا تعيد الآن استخدام النطاقات المعتمدة المخزنة مؤقتًا مع رمز الجهاز. يستمر مستدعو `deviceToken` الصريح / `scopes` الصريح في الاحتفاظ بمجموعة النطاقات المطلوبة بدلًا من وراثة النطاقات المخزنة مؤقتًا.
    - خارج مسار إعادة المحاولة ذلك، تكون أولوية مصادقة الاتصال: الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز bootstrap.
    - فحوصات نطاق رمز bootstrap مسبوقة بالدور. قائمة السماح المضمنة لمشغّل bootstrap تلبي طلبات المشغّل فقط؛ ما تزال أدوار Node أو الأدوار الأخرى غير المشغّلة تحتاج إلى نطاقات ضمن بادئة دورها الخاصة.

    الإصلاح:

    - الأسرع: `openclaw dashboard` (يطبع + ينسخ عنوان URL للوحة التحكم، ويحاول الفتح؛ ويعرض تلميح SSH إذا كان بلا واجهة).
    - إذا لم يكن لديك رمز بعد: `openclaw doctor --generate-gateway-token`.
    - إذا كان بعيدًا، أنشئ النفق أولًا: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع السر المشترك: اضبط `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم الصق السر المطابق في إعدادات Control UI.
    - وضع Tailscale Serve: تأكد من تمكين `gateway.auth.allowTailscale` وأنك تفتح عنوان Serve URL، وليس عنوان loopback/tailnet خام يتجاوز ترويسات هوية Tailscale.
    - وضع الوكيل الموثوق: تأكد من أنك تأتي عبر الوكيل المهيأ والواعي بالهوية، وليس عنوان Gateway خامًا. وكلاء local loopback على نفس المضيف يحتاجون أيضًا إلى `gateway.auth.trustedProxy.allowLoopback = true`.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، فدوّر/أعد اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا قالت استدعاء التدوير هذه إنها رُفضت، فتحقق من أمرين:
      - يمكن لجلسات الجهاز المقترن تدوير جهازها **الخاص بها** فقط ما لم تكن تملك أيضًا `operator.admin`
      - لا يمكن لقيم `--scope` الصريحة أن تتجاوز نطاقات المشغّل الحالية للمتصل
    - ما زلت عالقًا؟ شغّل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [لوحة التحكم](/ar/web/dashboard) لتفاصيل المصادقة.

  </Accordion>

  <Accordion title="عيّنت gateway.bind إلى tailnet لكنه لا يستطيع الربط ولا شيء يستمع">
    يختار ربط `tailnet` عنوان IP من Tailscale من واجهات شبكتك (100.64.0.0/10). إذا لم يكن الجهاز على Tailscale (أو كانت الواجهة معطلة)، فلا يوجد شيء للربط به.

    الإصلاح:

    - ابدأ Tailscale على ذلك المضيف (ليكون لديه عنوان 100.x)، أو
    - انتقل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. يفضّل `auto` loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطًا مقتصرًا على tailnet فقط.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة Gateways على المضيف نفسه؟">
    عادةً لا - يمكن لـ Gateway واحد تشغيل عدة قنوات مراسلة ووكلاء. استخدم عدة Gateways فقط عندما تحتاج إلى التكرار (مثلًا: بوت إنقاذ) أو العزل الصارم.

    نعم، لكن يجب أن تعزل:

    - `OPENCLAW_CONFIG_PATH` (تهيئة لكل مثيل)
    - `OPENCLAW_STATE_DIR` (حالة لكل مثيل)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (موصى به):

    - استخدم `openclaw --profile <name> ...` لكل مثيل (ينشئ تلقائيًا `~/.openclaw-<name>`).
    - اضبط `gateway.port` فريدًا في تهيئة كل ملف تعريف (أو مرر `--port` للتشغيل اليدوي).
    - ثبّت خدمة لكل ملف تعريف: `openclaw --profile <name> gateway install`.

    تضيف ملفات التعريف أيضًا لاحقة لأسماء الخدمات (`ai.openclaw.<profile>`؛ القديم `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [Gateways متعددة](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ماذا يعني "invalid handshake" / الكود 1008؟'>
    Gateway هو **خادم WebSocket**، ويتوقع أن تكون أول رسالة تمامًا
    إطار `connect`. إذا تلقى أي شيء آخر، فإنه يغلق الاتصال
    مع **الكود 1008** (انتهاك للسياسة).

    الأسباب الشائعة:

    - فتحت عنوان **HTTP** URL في متصفح (`http://...`) بدلًا من عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - أزال وكيل أو نفق ترويسات المصادقة أو أرسل طلبًا غير تابع لـ Gateway.

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
    سجلات الملفات (مهيكلة):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    يمكنك ضبط مسار مستقر عبر `logging.file`. يتحكم `logging.level` في مستوى سجل الملف. تتحكم `--verbose` و`logging.consoleLevel` في إسهاب وحدة التحكم.

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

  <Accordion title="أغلقت الطرفية على Windows - كيف أعيد تشغيل OpenClaw؟">
    توجد **طريقتا تثبيت على Windows**:

    **1) WSL2 (موصى به):** يعمل Gateway داخل Linux.

    افتح PowerShell، وادخل WSL، ثم أعد التشغيل:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا لم تثبّت الخدمة مطلقًا، فابدأها في الواجهة الأمامية:

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

    الوثائق: [Windows (WSL2)](/ar/platforms/windows), [دليل تشغيل خدمة Gateway](/ar/gateway).

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

    - لم تُحمَّل مصادقة النموذج على **مضيف Gateway** (تحقّق من `models status`).
    - إقران القناة/قائمة السماح يمنعان الردود (تحقّق من إعدادات القناة + السجلات).
    - WebChat/Dashboard مفتوحان من دون الرمز الصحيح.

    إذا كنت متصلاً عن بُعد، فتأكّد من أن اتصال النفق/Tailscale يعمل وأن
    Gateway WebSocket قابل للوصول.

    المستندات: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"انقطع الاتصال عن Gateway: لا يوجد سبب" - ماذا الآن؟'>
    يعني هذا عادة أن واجهة المستخدم فقدت اتصال WebSocket. تحقّق من:

    1. هل Gateway قيد التشغيل؟ `openclaw gateway status`
    2. هل Gateway سليم؟ `openclaw status`
    3. هل لدى واجهة المستخدم الرمز الصحيح؟ `openclaw dashboard`
    4. إذا كنت متصلاً عن بُعد، فهل رابط النفق/Tailscale يعمل؟

    ثم تابع السجلات:

    ```bash
    openclaw logs --follow
    ```

    المستندات: [Dashboard](/ar/web/dashboard)، [الوصول عن بُعد](/ar/gateway/remote)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

  </Accordion>

  <Accordion title="يفشل Telegram setMyCommands. ما الذي ينبغي أن أتحقّق منه؟">
    ابدأ بالسجلات وحالة القناة:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    ثم طابق الخطأ:

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على إدخالات كثيرة جدًا. يقلّص OpenClaw بالفعل العدد إلى حد Telegram ويعيد المحاولة بأوامر أقل، لكن ما تزال هناك حاجة إلى إسقاط بعض إدخالات القائمة. قلّل أوامر Plugin/Skill/الأوامر المخصصة، أو عطّل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed` أو `Network request for 'setMyCommands' failed!` أو أخطاء شبكة مشابهة: إذا كنت على VPS أو خلف وكيل، فتأكّد من السماح باتصالات HTTPS الصادرة وأن DNS يعمل مع `api.telegram.org`.

    إذا كان Gateway بعيدًا، فتأكّد من أنك تنظر إلى السجلات على مضيف Gateway.

    المستندات: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="لا يعرض TUI أي مخرجات. ما الذي ينبغي أن أتحقّق منه؟">
    تأكّد أولاً من أن Gateway قابل للوصول وأن الوكيل يمكنه العمل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لرؤية الحالة الحالية. إذا كنت تتوقع ردودًا في قناة دردشة،
    فتأكّد من تفعيل التسليم (`/deliver on`).

    المستندات: [TUI](/ar/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway بالكامل ثم أبدأه؟">
    إذا كنت قد ثبّت الخدمة:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    يؤدي هذا إلى إيقاف/بدء **الخدمة المُراقَبة** (launchd على macOS، وsystemd على Linux).
    استخدم هذا عندما يعمل Gateway في الخلفية كخدمة خفية.

    إذا كنت تشغّله في الواجهة الأمامية، فأوقفه باستخدام Ctrl-C، ثم:

    ```bash
    openclaw gateway run
    ```

    المستندات: [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="شرح مبسط: openclaw gateway restart مقابل openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **خدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغّل Gateway **في الواجهة الأمامية** لجلسة الطرفية هذه.

    إذا كنت قد ثبّت الخدمة، فاستخدم أوامر Gateway. استخدم `openclaw gateway` عندما
    تريد تشغيلًا لمرة واحدة في الواجهة الأمامية.

  </Accordion>

  <Accordion title="أسرع طريقة للحصول على مزيد من التفاصيل عند فشل شيء ما">
    ابدأ Gateway باستخدام `--verbose` للحصول على تفاصيل أكثر في وحدة التحكم. ثم افحص ملف السجل بحثًا عن مصادقة القناة، وتوجيه النموذج، وأخطاء RPC.
  </Accordion>
</AccordionGroup>

## الوسائط والمرفقات

<AccordionGroup>
  <Accordion title="أنشأت مهارتي صورة/PDF، لكن لم يُرسل شيء">
    يجب أن تتضمن المرفقات الصادرة من الوكيل سطر `MEDIA:<path-or-url>` (في سطر مستقل). راجع [إعداد مساعد OpenClaw](/ar/start/openclaw) و[إرسال الوكيل](/ar/tools/agent-send).

    الإرسال عبر CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    تحقّق أيضًا من:

    - القناة الهدف تدعم الوسائط الصادرة ولا تحظرها قوائم السماح.
    - الملف ضمن حدود حجم المزوّد (تُعاد تحجيم الصور إلى حد أقصى 2048px).
    - `tools.fs.workspaceOnly=true` يبقي الإرسال من المسارات المحلية محدودًا على مساحة العمل، وtemp/media-store، والملفات التي تحقق منها sandbox.
    - `tools.fs.workspaceOnly=false` يتيح لـ `MEDIA:` إرسال ملفات محلية على المضيف يستطيع الوكيل قراءتها بالفعل، لكن للوسائط وأنواع المستندات الآمنة فقط (الصور، الصوت، الفيديو، PDF، ومستندات Office). ما تزال الملفات النصية العادية والملفات التي تبدو كأنها تحتوي أسرارًا محظورة.

    راجع [الصور](/ar/nodes/images).

  </Accordion>
</AccordionGroup>

## الأمان والتحكم في الوصول

<AccordionGroup>
  <Accordion title="هل من الآمن تعريض OpenClaw للرسائل المباشرة الواردة؟">
    تعامل مع الرسائل المباشرة الواردة كمدخلات غير موثوقة. صُممت الإعدادات الافتراضية لتقليل المخاطر:

    - السلوك الافتراضي على القنوات القادرة على الرسائل المباشرة هو **الإقران**:
      - يتلقى المرسلون غير المعروفين رمز إقران؛ ولا يعالج الروبوت رسالتهم.
      - وافق باستخدام: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - تُحدد الطلبات المعلّقة بحد أقصى **3 لكل قناة**؛ تحقّق من `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل رمز.
    - يتطلب فتح الرسائل المباشرة للعامة اشتراكًا صريحًا (`dmPolicy: "open"` وقائمة السماح `"*"`).

    شغّل `openclaw doctor` لإظهار سياسات الرسائل المباشرة عالية المخاطر.

  </Accordion>

  <Accordion title="هل حقن التعليمات مصدر قلق للروبوتات العامة فقط؟">
    لا. حقن التعليمات يتعلق بـ **المحتوى غير الموثوق**، وليس فقط بمن يستطيع إرسال رسالة مباشرة إلى الروبوت.
    إذا كان مساعدك يقرأ محتوى خارجيًا (بحث/جلب من الويب، صفحات متصفح، رسائل بريد إلكتروني،
    مستندات، مرفقات، سجلات ملصوقة)، فقد يتضمن ذلك المحتوى تعليمات تحاول
    اختطاف النموذج. يمكن أن يحدث هذا حتى إذا **كنت أنت المرسل الوحيد**.

    يكون الخطر الأكبر عندما تكون الأدوات مفعّلة: يمكن خداع النموذج لكي
    يسرّب السياق أو يستدعي الأدوات نيابةً عنك. قلّل نطاق الضرر عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو معطّل الأدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` معطلة للوكلاء المفعّلة أدواتهم
    - التعامل مع نص الملفات/المستندات المفكوك ترميزه كمحتوى غير موثوق أيضًا: يغلّف OpenResponses
      `input_file` واستخراج مرفقات الوسائط النص المستخرج داخل
      علامات حدود محتوى خارجي صريحة بدلاً من تمرير نص الملف الخام
    - العزل ضمن sandbox واستخدام قوائم سماح صارمة للأدوات

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل ينبغي أن يكون للروبوت بريد إلكتروني أو حساب GitHub أو رقم هاتف خاص به؟">
    نعم، لمعظم الإعدادات. عزل الروبوت بحسابات وأرقام هاتف منفصلة
    يقلل نطاق الضرر إذا حدث خطأ. كما يسهّل ذلك تدوير
    بيانات الاعتماد أو إبطال الوصول من دون التأثير في حساباتك الشخصية.

    ابدأ بشكل محدود. امنح الوصول فقط إلى الأدوات والحسابات التي تحتاجها فعليًا، ثم وسّع
    لاحقًا عند الحاجة.

    المستندات: [الأمان](/ar/gateway/security)، [الإقران](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية، وهل هذا آمن؟">
    نحن **لا** نوصي بالاستقلالية الكاملة على رسائلك الشخصية. النمط الأكثر أمانًا هو:

    - أبقِ الرسائل المباشرة في **وضع الإقران** أو ضمن قائمة سماح ضيقة.
    - استخدم **رقمًا أو حسابًا منفصلًا** إذا كنت تريد منه المراسلة نيابةً عنك.
    - دعه يكتب المسودة، ثم **وافق قبل الإرسال**.

    إذا كنت تريد التجربة، فافعل ذلك على حساب مخصص وأبقِه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل للدردشة فقط وكانت المدخلات موثوقة. الطبقات الأصغر
    أكثر عرضة لاختطاف التعليمات، لذلك تجنّبها للوكلاء المفعّلة أدواتهم
    أو عند قراءة محتوى غير موثوق. إذا كان لا بد من استخدام نموذج أصغر، فأحكم إغلاق
    الأدوات وشغّله داخل sandbox. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="شغّلت /start في Telegram لكنني لم أحصل على رمز إقران">
    تُرسل رموز الإقران **فقط** عندما يرسل مرسل غير معروف رسالة إلى الروبوت ويكون
    `dmPolicy: "pairing"` مفعّلًا. لا ينشئ `/start` وحده رمزًا.

    تحقّق من الطلبات المعلّقة:

    ```bash
    openclaw pairing list telegram
    ```

    إذا كنت تريد وصولًا فوريًا، فأضف معرف المرسل الخاص بك إلى قائمة السماح أو اضبط `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيراسل جهات اتصالي؟ كيف يعمل الإقران؟">
    لا. سياسة رسائل WhatsApp المباشرة الافتراضية هي **الإقران**. يتلقى المرسلون غير المعروفين رمز إقران فقط ولا تُعالَج رسالتهم. يرد OpenClaw فقط على الدردشات التي يتلقاها أو على عمليات الإرسال الصريحة التي تطلقها.

    وافق على الإقران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اعرض الطلبات المعلّقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لضبط **قائمة السماح/المالك** لديك حتى يُسمح برسائلك المباشرة أنت. لا تُستخدم للإرسال التلقائي. إذا كنت تشغّل على رقم WhatsApp الشخصي، فاستخدم ذلك الرقم وفعّل `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، إلغاء المهام، و"لن يتوقف"

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

    إذا ظلّت الضوضاء موجودة، فتحقّق من إعدادات الجلسة في Control UI واضبط verbose
    على **inherit**. تأكّد أيضًا من أنك لا تستخدم ملف تعريف روبوت فيه `verboseDefault` مضبوط
    على `on` في الإعدادات.

    المستندات: [التفكير وverbose](/ar/tools/thinking)، [الأمان](/ar/gateway/security/index#reasoning-and-verbose-output-in-groups).

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

    هذه محفزات إلغاء (وليست أوامر بشرطة مائلة).

    بالنسبة للعمليات الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

    ```
    process action:kill sessionId:XXX
    ```

    نظرة عامة على أوامر الشرطة المائلة: راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

    يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`، لكن بعض الاختصارات (مثل `/status`) تعمل أيضًا ضمن السطر للمرسلين الموجودين في قائمة السماح.

  </Accordion>

  <Accordion title='كيف أرسل رسالة Discord من Telegram؟ ("المراسلة عبر السياقات مرفوضة")'>
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

    أعد تشغيل Gateway بعد تحرير الإعدادات.

  </Accordion>

  <Accordion title='لماذا يبدو أن الروبوت "يتجاهل" الرسائل المتتابعة بسرعة؟'>
    يتحكم وضع قائمة الانتظار في كيفية تفاعل الرسائل الجديدة مع تشغيل جارٍ. استخدم `/queue` لتغيير الأوضاع:

    - `steer` - يضع كل التوجيهات المعلّقة في قائمة الانتظار لحد النموذج التالي في التشغيل الحالي
    - `queue` - توجيه قديم واحدًا تلو الآخر
    - `followup` - يشغّل الرسائل واحدة تلو الأخرى
    - `collect` - يجمع الرسائل ويرد مرة واحدة
    - `steer-backlog` - يوجّه الآن، ثم يعالج التراكم
    - `interrupt` - يلغي التشغيل الحالي ويبدأ من جديد

    الوضع الافتراضي هو `steer`. يمكنك إضافة خيارات مثل `debounce:0.5s cap:25 drop:summarize` لأوضاع المتابعة. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما النموذج الافتراضي لـ Anthropic عند استخدام مفتاح API؟'>
    في OpenClaw، تكون بيانات الاعتماد واختيار النموذج منفصلين. يؤدي تعيين `ANTHROPIC_API_KEY` (أو تخزين مفتاح API لـ Anthropic في ملفات تعريف المصادقة) إلى تفعيل المصادقة، لكن النموذج الافتراضي الفعلي هو ما تضبطه في `agents.defaults.model.primary` (على سبيل المثال، `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). إذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم يتمكن من العثور على بيانات اعتماد Anthropic في ملف `auth-profiles.json` المتوقع للوكيل قيد التشغيل.
  </Accordion>
</AccordionGroup>

---

ما زلت عالقًا؟ اسأل في [Discord](https://discord.com/invite/clawd) أو افتح [مناقشة على GitHub](https://github.com/openclaw/openclaw/discussions).

## ذات صلة

- [الأسئلة الشائعة حول التشغيل الأول](/ar/help/faq-first-run) — التثبيت، الإعداد الأولي، المصادقة، الاشتراكات، الإخفاقات المبكرة
- [الأسئلة الشائعة حول النماذج](/ar/help/faq-models) — اختيار النموذج، تجاوز الفشل، ملفات تعريف المصادقة
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) — الفرز بدءًا من الأعراض
