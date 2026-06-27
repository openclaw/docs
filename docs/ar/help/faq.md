---
read_when:
    - الإجابة عن أسئلة الدعم الشائعة المتعلقة بالإعداد أو التثبيت أو التهيئة الأولية أو وقت التشغيل
    - فرز المشكلات التي أبلغ عنها المستخدمون قبل التعمق في تصحيح الأخطاء
summary: الأسئلة الشائعة حول إعداد OpenClaw وتكوينه واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-06-27T17:46:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

إجابات سريعة مع استكشاف أعمق للأخطاء وإصلاحها للإعدادات الواقعية (التطوير المحلي، VPS، تعدد الوكلاء، OAuth/مفاتيح API، التحويل الاحتياطي بين النماذج). لتشخيصات وقت التشغيل، راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). وللمرجع الكامل للإعدادات، راجع [الإعدادات](/ar/gateway/configuration).

## أول 60 ثانية إذا كان هناك شيء معطل

1. **الحالة السريعة (أول فحص)**

   ```bash
   openclaw status
   ```

   ملخص محلي سريع: نظام التشغيل + التحديث، إمكانية الوصول إلى gateway/الخدمة، الوكلاء/الجلسات، إعدادات المزوّد + مشكلات وقت التشغيل (عندما يكون gateway قابلًا للوصول).

2. **تقرير قابل للصق (آمن للمشاركة)**

   ```bash
   openclaw status --all
   ```

   تشخيص للقراءة فقط مع ذيل السجل (مع تنقيح الرموز السرية).

3. **حالة Daemon + المنفذ**

   ```bash
   openclaw gateway status
   ```

   يعرض وقت تشغيل المشرف مقابل إمكانية الوصول عبر RPC، ورابط هدف الفحص، وأي إعدادات استخدمتها الخدمة على الأرجح.

4. **فحوصات عميقة**

   ```bash
   openclaw status --deep
   ```

   يشغّل فحصًا مباشرًا لصحة gateway، بما في ذلك فحوصات القنوات عندما تكون مدعومة
   (يتطلب gateway قابلًا للوصول). راجع [الصحة](/ar/gateway/health).

5. **تتبّع أحدث سجل**

   ```bash
   openclaw logs --follow
   ```

   إذا كان RPC معطلًا، فارجع إلى:

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

   يطلب من gateway قيد التشغيل لقطة كاملة (WS فقط). راجع [الصحة](/ar/gateway/health).

## البدء السريع وإعداد التشغيل الأول

أسئلة وأجوبة التشغيل الأول — التثبيت، الإعداد الأولي، مسارات المصادقة، الاشتراكات، الإخفاقات الأولية —
موجودة في [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run).

## ما هو OpenClaw؟

<AccordionGroup>
  <Accordion title="ما هو OpenClaw في فقرة واحدة؟">
    OpenClaw هو مساعد ذكاء اصطناعي شخصي تشغّله على أجهزتك الخاصة. يرد على أسطح المراسلة التي تستخدمها بالفعل (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، وPlugins القنوات المضمّنة مثل QQ Bot) ويمكنه أيضًا تنفيذ الصوت + Canvas مباشر على المنصات المدعومة. **Gateway** هو مستوى التحكم الدائم التشغيل؛ أما المساعد فهو المنتج.
  </Accordion>

  <Accordion title="القيمة المقترحة">
    OpenClaw ليس "مجرد غلاف Claude." إنه **مستوى تحكم محلي أولًا** يتيح لك تشغيل
    مساعد قادر على **عتادك الخاص**، ويمكن الوصول إليه من تطبيقات الدردشة التي تستخدمها بالفعل، مع
    جلسات ذات حالة وذاكرة وأدوات - من دون تسليم التحكم في سير عملك إلى
    SaaS مستضاف.

    أبرز النقاط:

    - **أجهزتك، بياناتك:** شغّل Gateway أينما تريد (Mac، Linux، VPS) واحتفظ
      بمساحة العمل + سجل الجلسات محليًا.
    - **قنوات حقيقية، لا صندوق ويب معزول:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/إلخ،
      بالإضافة إلى الصوت المحمول وCanvas على المنصات المدعومة.
    - **محايد تجاه النماذج:** استخدم Anthropic، OpenAI، MiniMax، OpenRouter، وغيرها، مع توجيه
      لكل وكيل وتحويل احتياطي.
    - **خيار محلي فقط:** شغّل نماذج محلية بحيث **يمكن أن تبقى كل البيانات على جهازك** إذا أردت.
    - **توجيه متعدد الوكلاء:** وكلاء منفصلون لكل قناة أو حساب أو مهمة، ولكل منهم
      مساحة عمل وافتراضات خاصة به.
    - **مفتوح المصدر وقابل للتعديل:** افحصه ووسّعه واستضفه ذاتيًا من دون احتكار مورّد.

    المستندات: [Gateway](/ar/gateway)، [القنوات](/ar/channels)، [تعدد الوكلاء](/ar/concepts/multi-agent)،
    [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أعددته للتو - ماذا يجب أن أفعل أولًا؟">
    مشاريع أولى جيدة:

    - بناء موقع ويب (WordPress أو Shopify أو موقع ثابت بسيط).
    - إنشاء نموذج أولي لتطبيق محمول (مخطط، شاشات، خطة API).
    - تنظيم الملفات والمجلدات (تنظيف، تسمية، وسم).
    - توصيل Gmail وأتمتة الملخصات أو المتابعات.

    يمكنه التعامل مع المهام الكبيرة، لكنه يعمل بأفضل شكل عندما تقسّمها إلى مراحل وتستخدم
    وكلاء فرعيين للعمل المتوازي.

  </Accordion>

  <Accordion title="ما أهم خمس حالات استخدام يومية لـ OpenClaw؟">
    عادةً تبدو المكاسب اليومية كما يلي:

    - **موجزات شخصية:** ملخصات للبريد الوارد والتقويم والأخبار التي تهمك.
    - **البحث والصياغة:** بحث سريع وملخصات ومسودات أولى للرسائل أو المستندات.
    - **التذكيرات والمتابعات:** تنبيهات وقوائم تحقق مدفوعة بـ cron أو Heartbeat.
    - **أتمتة المتصفح:** تعبئة النماذج وجمع البيانات وتكرار مهام الويب.
    - **تنسيق عبر الأجهزة:** أرسل مهمة من هاتفك، ودع Gateway يشغّلها على خادم، واسترجع النتيجة في الدردشة.

  </Accordion>

  <Accordion title="هل يمكن أن يساعد OpenClaw في توليد العملاء المحتملين، والتواصل، والإعلانات، والمدونات لـ SaaS؟">
    نعم في **البحث والتأهيل والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات للتواصل أو نصوص إعلانية.

    بالنسبة إلى **حملات التواصل أو الإعلانات**، أبقِ الإنسان ضمن الحلقة. تجنب الرسائل المزعجة، واتبع القوانين المحلية
    وسياسات المنصات، وراجع أي شيء قبل إرساله. النمط الأكثر أمانًا هو أن يدع
    OpenClaw يصوغ وأنت توافق.

    المستندات: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما المزايا مقارنة بـ Claude Code لتطوير الويب؟">
    OpenClaw هو **مساعد شخصي** وطبقة تنسيق، وليس بديلًا لـ IDE. استخدم
    Claude Code أو Codex لأسرع حلقة برمجة مباشرة داخل مستودع. استخدم OpenClaw عندما
    تريد ذاكرة دائمة، ووصولًا عبر الأجهزة، وتنسيقًا للأدوات.

    المزايا:

    - **ذاكرة دائمة + مساحة عمل** عبر الجلسات
    - **وصول متعدد المنصات** (WhatsApp، Telegram، TUI، WebChat)
    - **تنسيق الأدوات** (المتصفح، الملفات، الجدولة، الخطاطيف)
    - **Gateway دائم التشغيل** (شغّله على VPS، وتفاعل من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/التنفيذ المحلي

    العرض: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="كيف أخصص Skills من دون إبقاء المستودع متسخًا؟">
    استخدم التجاوزات المُدارة بدلًا من تعديل نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدًا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). ترتيب الأولوية هو `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمّن → `skills.load.extraDirs`، لذلك تظل التجاوزات المُدارة متقدمة على Skills المضمّنة من دون لمس git. إذا كنت تحتاج إلى تثبيت skill عالميًا ولكن جعله مرئيًا لبعض الوكلاء فقط، فاحتفظ بالنسخة المشتركة في `~/.openclaw/skills` وتحكم في الرؤية باستخدام `agents.defaults.skills` و`agents.list[].skills`. التعديلات التي تستحق الإرسال إلى upstream فقط هي التي يجب أن تعيش في المستودع وتخرج كـ PRs.
  </Accordion>

  <Accordion title="هل يمكنني تحميل Skills من مجلد مخصص؟">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (أدنى أولوية). ترتيب الأولوية الافتراضي هو `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمّن → `skills.load.extraDirs`. يثبّت `clawhub` في `./skills` افتراضيًا، وهو ما يعامله OpenClaw كـ `<workspace>/skills` في الجلسة التالية. إذا كان يجب أن يكون skill مرئيًا لوكلاء معينين فقط، فاقرن ذلك مع `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="كيف يمكنني استخدام نماذج أو إعدادات مختلفة لمهام مختلفة؟">
    الأنماط المدعومة اليوم هي:

    - **مهام Cron**: يمكن للمهام المعزولة تعيين تجاوز `model` لكل مهمة.
    - **الوكلاء**: وجّه المهام إلى وكلاء منفصلين بنماذج افتراضية ومستويات تفكير ومعاملات تدفق مختلفة.
    - **التبديل عند الطلب**: استخدم `/model` لتبديل نموذج الجلسة الحالية في أي وقت.

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

    ضع الافتراضات المشتركة لكل نموذج في `agents.defaults.models["provider/model"].params`، ثم ضع التجاوزات الخاصة بالوكيل في `agents.list[].params` المسطحة. لا تعرّف إدخالات `agents.list[].models["provider/model"].params` متداخلة ومنفصلة للنموذج نفسه؛ فـ `agents.list[].models` مخصص لكتالوج النماذج لكل وكيل وتجاوزات وقت التشغيل.

    راجع [مهام Cron](/ar/automation/cron-jobs)، [توجيه Multi-Agent](/ar/concepts/multi-agent)، [الإعدادات](/ar/gateway/config-agents)، و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="يتجمد البوت أثناء تنفيذ عمل ثقيل. كيف أفرغ ذلك؟">
    استخدم **الوكلاء الفرعيين** للمهام الطويلة أو المتوازية. يعمل الوكلاء الفرعيون في جلستهم الخاصة،
    ويعيدون ملخصًا، ويحافظون على استجابة دردشتك الرئيسية.

    اطلب من البوت "spawn a sub-agent for this task" أو استخدم `/subagents`.
    استخدم `/status` في الدردشة لمعرفة ما يفعله Gateway الآن (وما إذا كان مشغولًا).

    نصيحة بشأن الرموز: المهام الطويلة والوكلاء الفرعيون يستهلكون الرموز. إذا كانت التكلفة مصدر قلق، فعيّن
    نموذجًا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [مهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="كيف تعمل جلسات الوكيل الفرعي المرتبطة بالخيط على Discord؟">
    استخدم روابط الخيوط. يمكنك ربط خيط Discord بوكيل فرعي أو هدف جلسة بحيث تبقى رسائل المتابعة في ذلك الخيط على الجلسة المرتبطة.

    التدفق الأساسي:

    - أنشئ عبر `sessions_spawn` باستخدام `thread: true` (واختياريًا `mode: "session"` للمتابعة المستمرة).
    - أو اربط يدويًا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الربط.
    - استخدم `/session idle <duration|off>` و`/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل الخيط.

    الإعدادات المطلوبة:

    - الافتراضات العامة: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - الربط التلقائي عند الإنشاء: القيمة الافتراضية لـ `channels.discord.threadBindings.spawnSessions` هي `true`؛ عيّنها إلى `false` لتعطيل إنشاء الجلسات المرتبطة بالخيط.

    المستندات: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع الإعدادات](/ar/gateway/configuration-reference)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="أنهى وكيل فرعي عمله، لكن تحديث الاكتمال ذهب إلى المكان الخطأ أو لم يُنشر مطلقًا. ماذا يجب أن أفحص؟">
    افحص مسار الطالب المحلول أولًا:

    - يفضّل تسليم الوكيل الفرعي في وضع الاكتمال أي خيط مرتبط أو مسار محادثة عندما يوجد أحدهما.
    - إذا كان أصل الاكتمال يحمل قناة فقط، يعود OpenClaw إلى المسار المخزن لجلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) بحيث يظل التسليم المباشر قادرًا على النجاح.
    - إذا لم يوجد مسار مرتبط ولا مسار مخزن قابل للاستخدام، فقد يفشل التسليم المباشر وتعود النتيجة إلى تسليم الجلسة في قائمة الانتظار بدلًا من النشر فورًا في الدردشة.
    - يمكن للأهداف غير الصالحة أو القديمة أن تفرض الرجوع إلى قائمة الانتظار أو فشل التسليم النهائي.
    - إذا كان آخر رد مساعد مرئي للابن هو الرمز الصامت المطابق تمامًا `NO_REPLY` / `no_reply`، أو بالضبط `ANNOUNCE_SKIP`، فإن OpenClaw يكبت الإعلان عمدًا بدلًا من نشر تقدم سابق قديم.
    - لا تتم ترقية مخرجات tool/toolResult إلى نص نتيجة الابن؛ فالنتيجة هي أحدث رد مساعد مرئي للابن.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [مهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="لا يتم تشغيل Cron أو التذكيرات. ما الذي ينبغي أن أتحقق منه؟">
    يعمل Cron داخل عملية Gateway. إذا لم يكن Gateway يعمل باستمرار،
    فلن تعمل المهام المجدولة.

    قائمة التحقق:

    - تأكد من تمكين cron (`cron.enabled`) وأن `OPENCLAW_SKIP_CRON` غير معيّن.
    - تحقق من أن Gateway يعمل على مدار الساعة طوال أيام الأسبوع (بلا سكون/إعادة تشغيل).
    - تحقق من إعدادات المنطقة الزمنية للمهمة (`--tz` مقابل المنطقة الزمنية للمضيف).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة](/ar/automation).

  </Accordion>

  <Accordion title="تم تشغيل Cron، لكن لم يُرسل شيء إلى القناة. لماذا؟">
    تحقق من وضع التسليم أولًا:

    - يعني `--no-deliver` / `delivery.mode: "none"` أنه لا يُتوقع إرسال احتياطي من المشغّل.
    - يعني هدف الإعلان المفقود أو غير الصالح (`channel` / `to`) أن المشغّل تخطى التسليم الصادر.
    - تعني إخفاقات مصادقة القناة (`unauthorized`، `Forbidden`) أن المشغّل حاول التسليم لكن بيانات الاعتماد منعته.
    - تُعامل النتيجة المعزولة الصامتة (`NO_REPLY` / `no_reply` فقط) على أنها غير قابلة للتسليم عمدًا، لذلك يمنع المشغّل أيضًا التسليم الاحتياطي الموضوع في قائمة الانتظار.

    بالنسبة إلى مهام cron المعزولة، لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message`
    عندما يكون مسار دردشة متاحًا. يتحكم `--announce` فقط في مسار
    الرجوع الاحتياطي للمشغّل للنص النهائي الذي لم يكن الوكيل قد أرسله بالفعل.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [مهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="لماذا غيّر تشغيل Cron معزول النماذج أو أعاد المحاولة مرة واحدة؟">
    يكون ذلك عادةً مسار تبديل النموذج المباشر، وليس جدولة مكررة.

    يمكن لـ Cron المعزول حفظ تسليم نموذج وقت التشغيل وإعادة المحاولة عندما يطرح التشغيل
    النشط `LiveSessionModelSwitchError`. تحتفظ إعادة المحاولة
    بالمزوّد/النموذج الذي تم التبديل إليه، وإذا حمل التبديل تجاوز ملف تعريف مصادقة جديدًا، فإن cron
    يحفظ ذلك أيضًا قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يتقدم تجاوز نموذج ربط Gmail أولًا عند انطباقه.
    - ثم `model` لكل مهمة.
    - ثم أي تجاوز نموذج مخزن لجلسة cron.
    - ثم الاختيار العادي لنموذج الوكيل/الافتراضي.

    حلقة إعادة المحاولة محدودة. بعد المحاولة الأولية إضافة إلى محاولتي تبديل،
    يوقف cron التنفيذ بدلًا من الدوران إلى الأبد.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [CLI الخاص بـ cron](/ar/cli/cron).

  </Accordion>

  <Accordion title="كيف أثبّت Skills على Linux؟">
    استخدم أوامر `openclaw skills` الأصلية أو ضع Skills في مساحة عملك. واجهة Skills في macOS غير متاحة على Linux.
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
    داخل مساحة العمل النشطة افتراضيًا. أضف `--global` للتثبيت في دليل Skills المدار
    المشترك لكل الوكلاء المحليين. ثبّت CLI المنفصل `clawhub`
    فقط إذا كنت تريد نشر Skills الخاصة بك أو مزامنتها. استخدم
    `agents.defaults.skills` أو `agents.list[].skills` إذا كنت تريد تضييق
    نطاق الوكلاء الذين يمكنهم رؤية Skills المشتركة.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw تشغيل مهام وفق جدول أو باستمرار في الخلفية؟">
    نعم. استخدم مجدول Gateway:

    - **مهام Cron** للمهام المجدولة أو المتكررة (تستمر عبر عمليات إعادة التشغيل).
    - **Heartbeat** للفحوصات الدورية في "الجلسة الرئيسية".
    - **المهام المعزولة** للوكلاء المستقلين الذين ينشرون ملخصات أو يسلّمون إلى الدردشات.

    الوثائق: [مهام Cron](/ar/automation/cron-jobs)، [الأتمتة](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills الخاصة بـ Apple macOS فقط من Linux؟">
    ليس مباشرة. تُقيّد Skills الخاصة بـ macOS عبر `metadata.openclaw.os` إضافة إلى الثنائيات المطلوبة، ولا تظهر Skills في موجّه النظام إلا عندما تكون مؤهلة على **مضيف Gateway**. على Linux، لن تُحمّل Skills المحصورة بـ `darwin` (مثل `apple-notes` و`apple-reminders` و`things-mac`) ما لم تتجاوز القيد.

    لديك ثلاثة أنماط مدعومة:

    **الخيار A - شغّل Gateway على Mac (الأبسط).**
    شغّل Gateway حيث توجد ثنائيات macOS، ثم اتصل من Linux في [الوضع البعيد](#gateway-ports-already-running-and-remote-mode) أو عبر Tailscale. تُحمّل Skills بشكل طبيعي لأن مضيف Gateway هو macOS.

    **الخيار B - استخدم عقدة macOS (بلا SSH).**
    شغّل Gateway على Linux، واقرن عقدة macOS (تطبيق شريط القوائم)، واضبط **أوامر تشغيل Node** على "السؤال دائمًا" أو "السماح دائمًا" على Mac. يمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما توجد الثنائيات المطلوبة على العقدة. يشغّل الوكيل تلك Skills عبر أداة `nodes`. إذا اخترت "السؤال دائمًا"، فإن الموافقة على "السماح دائمًا" في الموجّه تضيف ذلك الأمر إلى قائمة السماح.

    **الخيار C - مرّر ثنائيات macOS عبر SSH (متقدم).**
    أبقِ Gateway على Linux، لكن اجعل ثنائيات CLI المطلوبة تُحل إلى أغلفة SSH تعمل على Mac. ثم تجاوز Skill للسماح بـ Linux حتى تبقى مؤهلة.

    1. أنشئ غلاف SSH للثنائي (مثال: `memo` لـ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ضع الغلاف على `PATH` على مضيف Linux (مثلًا `~/bin/memo`).
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

    - **Skill / Plugin مخصص:** الأفضل للوصول الموثوق إلى API (لدى Notion/HeyGen واجهات API).
    - **أتمتة المتصفح:** تعمل من دون كود لكنها أبطأ وأكثر هشاشة.

    إذا كنت تريد الاحتفاظ بالسياق لكل عميل (سير عمل الوكالات)، فالنمط البسيط هو:

    - صفحة Notion واحدة لكل عميل (السياق + التفضيلات + العمل النشط).
    - اطلب من الوكيل جلب تلك الصفحة في بداية الجلسة.

    إذا كنت تريد تكاملًا أصليًا، فافتح طلب ميزة أو ابنِ Skill
    تستهدف تلك الواجهات.

    تثبيت Skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    تصل التثبيتات الأصلية إلى دليل `skills/` في مساحة العمل النشطة. لاستخدام Skills مشتركة عبر كل الوكلاء المحليين، استخدم `openclaw skills install @owner/<skill-slug> --global` (أو ضعها يدويًا في `~/.openclaw/skills/<name>/SKILL.md`). إذا كان يجب أن يرى بعض الوكلاء فقط تثبيتًا مشتركًا، فاضبط `agents.defaults.skills` أو `agents.list[].skills`. تتوقع بعض Skills ثنائيات مثبتة عبر Homebrew؛ على Linux يعني ذلك Linuxbrew (راجع إدخال الأسئلة الشائعة لـ Homebrew على Linux أعلاه). راجع [Skills](/ar/tools/skills)، [إعدادات Skills](/ar/tools/skills-config)، و[ClawHub](/ar/clawhub).

  </Accordion>

  <Accordion title="كيف أستخدم Chrome الحالي المسجّل الدخول فيه مع OpenClaw؟">
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

    يمكن لهذا المسار استخدام متصفح المضيف المحلي أو عقدة متصفح متصلة. إذا كان Gateway يعمل في مكان آخر، فإما شغّل مضيف عقدة على جهاز المتصفح أو استخدم CDP بعيدًا بدلًا من ذلك.

    الحدود الحالية لـ `existing-session` / `user`:

    - الإجراءات مدفوعة بـ ref، وليست مدفوعة بمحددات CSS
    - تتطلب عمليات الرفع `ref` / `inputRef` وتدعم حاليًا ملفًا واحدًا في كل مرة
    - لا تزال `responsebody`، وتصدير PDF، واعتراض التنزيل، والإجراءات الدُفعية تحتاج إلى متصفح مُدار أو ملف تعريف CDP خام

  </Accordion>
</AccordionGroup>

## العزل والذاكرة

<AccordionGroup>
  <Accordion title="هل توجد وثيقة مخصصة للعزل؟">
    نعم. راجع [العزل](/ar/gateway/sandboxing). للإعداد الخاص بـ Docker (Gateway كامل في Docker أو صور عزل)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدودًا - كيف أفعّل الميزات الكاملة؟">
    الصورة الافتراضية تعطي الأولوية للأمان وتعمل كمستخدم `node`، لذلك لا
    تتضمن حزم النظام أو Homebrew أو متصفحات مضمّنة. لإعداد أكمل:

    - أبقِ `/home/node` مستمرًا باستخدام `OPENCLAW_HOME_VOLUME` حتى تبقى ذاكرات التخزين المؤقت.
    - ضمّن اعتماديات النظام في الصورة باستخدام `OPENCLAW_IMAGE_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المضمّن:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - عيّن `PLAYWRIGHT_BROWSERS_PATH` وتأكد من استمرار المسار.

    الوثائق: [Docker](/ar/install/docker)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل المباشرة شخصية وجعل المجموعات عامة/معزولة باستخدام وكيل واحد؟">
    نعم - إذا كانت حركة مرورك الخاصة هي **رسائل مباشرة** وحركة مرورك العامة هي **مجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` حتى تعمل جلسات المجموعة/القناة (المفاتيح غير الرئيسية) في واجهة العزل الخلفية المضبوطة، بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. Docker هو الواجهة الخلفية الافتراضية إذا لم تختر واحدة. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال إعداد: [المجموعات: رسائل مباشرة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع الإعداد الرئيسي: [إعداد Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلد مضيف داخل العزل؟">
    عيّن `agents.defaults.sandbox.docker.binds` إلى `["host:path:mode"]` (مثل `"/home/user/src:/src:ro"`). تُدمج الارتباطات العامة والخاصة بكل وكيل؛ ويتم تجاهل ارتباطات كل وكيل عندما يكون `scope: "shared"`. استخدم `:ro` لأي شيء حساس وتذكّر أن الارتباطات تتجاوز جدران نظام ملفات العزل.

    يتحقق OpenClaw من مصادر الربط مقابل كل من المسار المطبّع والمسار القانوني المحلول عبر أعمق سلف موجود. هذا يعني أن هروب الوالد الرمزي لا يزال يفشل مغلقًا حتى عندما لا يكون مقطع المسار الأخير موجودًا بعد، وتظل فحوصات الجذر المسموح به مطبقة بعد حل الروابط الرمزية.

    راجع [العزل](/ar/gateway/sandboxing#custom-bind-mounts) و[العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للحصول على أمثلة وملاحظات أمان.

  </Accordion>

  <Accordion title="كيف تعمل الذاكرة؟">
    ذاكرة OpenClaw هي مجرد ملفات Markdown في مساحة عمل الوكيل:

    - ملاحظات يومية في `memory/YYYY-MM-DD.md`
    - ملاحظات طويلة الأمد منقحة في `MEMORY.md` (الجلسات الرئيسية/الخاصة فقط)

    يشغّل OpenClaw أيضًا **تفريغ ذاكرة صامتًا قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction التلقائي. يعمل هذا فقط عندما تكون مساحة العمل
    قابلة للكتابة (تتخطاه بيئات العزل للقراءة فقط). راجع [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="تستمر الذاكرة في نسيان الأشياء. كيف أجعلها تثبت؟">
    اطلب من البوت **كتابة المعلومة في الذاكرة**. تنتمي الملاحظات طويلة الأجل إلى `MEMORY.md`،
    وينتقل السياق قصير الأجل إلى `memory/YYYY-MM-DD.md`.

    لا يزال هذا مجالًا نعمل على تحسينه. من المفيد تذكير النموذج بتخزين الذكريات؛
    سيعرف ما يجب فعله. إذا استمر في النسيان، فتحقق من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل.

    المستندات: [الذاكرة](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تستمر الذاكرة إلى الأبد؟ ما الحدود؟">
    تعيش ملفات الذاكرة على القرص وتستمر إلى أن تحذفها. الحد هو
    مساحة التخزين لديك، وليس النموذج. يظل **سياق الجلسة** محدودًا بنافذة سياق
    النموذج، لذلك قد تُضغط المحادثات الطويلة أو تُقتطع. لهذا السبب
    يوجد بحث الذاكرة - فهو يعيد إلى السياق الأجزاء ذات الصلة فقط.

    المستندات: [الذاكرة](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب بحث الذاكرة الدلالي مفتاح OpenAI API؟">
    فقط إذا كنت تستخدم **تضمينات OpenAI**. يغطي Codex OAuth الدردشة/الإكمالات ولا
    يمنح وصولًا إلى التضمينات، لذلك **تسجيل الدخول باستخدام Codex (OAuth أو تسجيل دخول
    Codex CLI)** لا يساعد في بحث الذاكرة الدلالي. لا تزال تضمينات OpenAI
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تضبط مزودًا صراحةً، يستخدم OpenClaw تضمينات OpenAI. الإعدادات القديمة
    التي لا تزال تقول `memorySearch.provider = "auto"` تُحل إلى OpenAI أيضًا.
    إذا لم يكن مفتاح OpenAI API متاحًا، يبقى بحث الذاكرة الدلالي غير متاح
    إلى أن تضبط مفتاحًا أو تختار مزودًا آخر صراحةً.

    إذا كنت تفضل البقاء محليًا، فاضبط `memorySearch.provider = "local"` (واختياريًا
    `memorySearch.fallback = "none"`). إذا كنت تريد تضمينات Gemini، فاضبط
    `memorySearch.provider = "gemini"` ووفّر `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). ندعم نماذج تضمين **OpenAI، والمتوافقة مع OpenAI، وGemini،
    وVoyage، وMistral، وBedrock، وOllama، وLM Studio، وGitHub Copilot، وDeepInfra، أو المحلية**
    - راجع [الذاكرة](/ar/concepts/memory) لمعرفة تفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## أين توجد الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل تُحفظ كل البيانات المستخدمة مع OpenClaw محليًا؟">
    لا - **حالة OpenClaw محلية**، لكن **الخدمات الخارجية لا تزال ترى ما ترسله إليها**.

    - **محليًا افتراضيًا:** الجلسات، وملفات الذاكرة، والإعدادات، ومساحة العمل تعيش على مضيف Gateway
      (`~/.openclaw` + دليل مساحة العمل لديك).
    - **عن بُعد بحكم الضرورة:** الرسائل التي ترسلها إلى مزودي النماذج (Anthropic/OpenAI/إلخ.) تذهب إلى
      واجهات API الخاصة بهم، ومنصات الدردشة (WhatsApp/Telegram/Slack/إلخ.) تخزن بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في الأثر:** استخدام النماذج المحلية يُبقي المطالبات على جهازك، لكن حركة مرور القناة
      لا تزال تمر عبر خوادم القناة.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    كل شيء يعيش تحت `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | المسار                                                           | الغرض                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | الإعداد الرئيسي (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | استيراد OAuth القديم (يُنسخ إلى ملفات تعريف المصادقة عند أول استخدام) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات تعريف المصادقة (OAuth، مفاتيح API، و`keyRef`/`tokenRef` اختياريان) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | حمولة أسرار اختيارية مدعومة بملف لمزودي SecretRef من نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ملف توافق قديم (تُزال إدخالات `api_key` الثابتة منه)             |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | حالة المزود (مثل `whatsapp/<accountId>/creds.json`)               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | حالة كل وكيل (agentDir + الجلسات)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | سجل المحادثات والحالة (لكل وكيل)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | بيانات تعريف الجلسة (لكل وكيل)                                    |

    مسار الوكيل الواحد القديم: `~/.openclaw/agent/*` (يرحّله `openclaw doctor`).

    **مساحة العمل** لديك (AGENTS.md، ملفات الذاكرة، Skills، إلخ.) منفصلة ومُعدّة عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    تعيش هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` اختياري.
      الجذر الصغير `memory.md` هو إدخال إصلاح قديم فقط؛ يمكن لـ `openclaw doctor --fix`
      دمجه في `MEMORY.md` عند وجود الملفين.
    - **دليل الحالة (`~/.openclaw`)**: الإعدادات، وحالة القناة/المزود، وملفات تعريف المصادقة، والجلسات، والسجلات،
      وSkills المشتركة (`~/.openclaw/skills`).

    مساحة العمل الافتراضية هي `~/.openclaw/workspace`، ويمكن تهيئتها عبر:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    إذا "نسي" البوت بعد إعادة التشغيل، فتأكد من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل (وتذكر: يستخدم الوضع البعيد **مساحة عمل مضيف gateway**
    وليس حاسوبك المحمول المحلي).

    نصيحة: إذا كنت تريد سلوكًا أو تفضيلًا دائمًا، فاطلب من البوت **كتابته في
    AGENTS.md أو MEMORY.md** بدلًا من الاعتماد على سجل الدردشة.

    راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) و[الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="هل يمكنني جعل SOUL.md أكبر؟">
    نعم. `SOUL.md` هو أحد ملفات تمهيد مساحة العمل التي تُحقن في
    سياق الوكيل. حد الحقن الافتراضي لكل ملف هو `20000` حرف،
    وإجمالي ميزانية التمهيد عبر الملفات هو `60000` حرف.

    غيّر الافتراضات المشتركة في إعداد OpenClaw لديك:

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

    أو تجاوز وكيلًا واحدًا:

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
    أبقِ `SOUL.md` مركّزًا على الصوت، والموقف، والشخصية؛ ضع قواعد التشغيل
    في `AGENTS.md` والحقائق الدائمة في الذاكرة.

    راجع [السياق](/ar/concepts/context) و[إعداد الوكيل](/ar/gateway/config-agents).

  </Accordion>

  <Accordion title="استراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** لديك في مستودع git **خاص** وانسخها احتياطيًا في مكان
    خاص (على سبيل المثال GitHub خاص). يلتقط هذا الذاكرة + ملفات AGENTS/SOUL/USER
    ويتيح لك استعادة "عقل" المساعد لاحقًا.

    **لا** تُضمّن في أي commit أي شيء تحت `~/.openclaw` (بيانات اعتماد، جلسات، رموز، أو حمولات أسرار مشفرة).
    إذا احتجت إلى استعادة كاملة، فانسخ كلًا من مساحة العمل ودليل الحالة احتياطيًا
    بشكل منفصل (راجع سؤال الترحيل أعلاه).

    المستندات: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف أزيل OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إلغاء التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. مساحة العمل هي **cwd الافتراضي** ومرساة الذاكرة، وليست صندوقًا رمليًا صارمًا.
    تُحل المسارات النسبية داخل مساحة العمل، لكن يمكن للمسارات المطلقة الوصول إلى مواقع مضيف أخرى
    ما لم يكن العزل الرملي ممكّنًا. إذا احتجت إلى العزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات العزل الرملي لكل وكيل. إذا كنت
    تريد أن يكون مستودع ما دليل العمل الافتراضي، فاجعل `workspace` لذلك الوكيل
    يشير إلى جذر المستودع. مستودع OpenClaw هو مجرد شيفرة مصدرية؛ أبقِ
    مساحة العمل منفصلة إلا إذا كنت تريد عمدًا أن يعمل الوكيل داخلها.

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
    حالة الجلسة مملوكة من **مضيف gateway**. إذا كنت في الوضع البعيد، فإن مخزن الجلسات الذي يهمك موجود على الجهاز البعيد، وليس على حاسوبك المحمول المحلي. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>
</AccordionGroup>

## أساسيات الإعداد

<AccordionGroup>
  <Accordion title="ما تنسيق الإعداد؟ وأين يوجد؟">
    يقرأ OpenClaw إعداد **JSON5** اختياريًا من `$OPENCLAW_CONFIG_PATH` (الافتراضي: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    إذا كان الملف مفقودًا، يستخدم افتراضات آمنة إلى حد ما (بما في ذلك مساحة عمل افتراضية هي `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='ضبطت gateway.bind: "lan" (أو "tailnet") والآن لا شيء يستمع / واجهة المستخدم تقول غير مصرح'>
    تتطلب الارتباطات غير loopback **مسار مصادقة gateway صالحًا**. عمليًا يعني ذلك:

    - مصادقة سر مشترك: رمز أو كلمة مرور
    - `gateway.auth.mode: "trusted-proxy"` خلف وكيل عكسي مدرك للهوية ومُعد بشكل صحيح

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

    - لا تُمكّن `gateway.remote.token` / `.password` مصادقة gateway المحلية بمفردها.
    - يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كاحتياطي فقط عندما يكون `gateway.auth.*` غير مضبوط.
    - لمصادقة كلمة المرور، اضبط `gateway.auth.mode: "password"` بالإضافة إلى `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`) بدلًا من ذلك.
    - إذا ضُبط `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يُحل، يفشل الحل بشكل مغلق (لا يوجد إخفاء باحتياطي بعيد).
    - تصادق إعدادات واجهة تحكم السر المشترك عبر `connect.params.auth.token` أو `connect.params.auth.password` (المخزنة في إعدادات التطبيق/واجهة المستخدم). تستخدم الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy` رؤوس الطلبات بدلًا من ذلك. تجنب وضع الأسرار المشتركة في عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، تتطلب وكلاء loopback العكسية على المضيف نفسه ضبط `gateway.auth.trustedProxy.allowLoopback = true` صراحةً وإدخال loopback في `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="لماذا أحتاج إلى رمز على localhost الآن؟">
    يفرض OpenClaw مصادقة gateway افتراضيًا، بما في ذلك loopback. في المسار الافتراضي العادي، يعني ذلك مصادقة الرمز: إذا لم يُضبط مسار مصادقة صريح، يتحول بدء gateway إلى وضع الرمز وينشئ رمزًا خاصًا بوقت التشغيل لذلك التشغيل، لذلك **يجب على عملاء WS المحليين المصادقة**. اضبط `gateway.auth.token` أو `gateway.auth.password` أو `OPENCLAW_GATEWAY_TOKEN` أو `OPENCLAW_GATEWAY_PASSWORD` صراحةً عندما يحتاج العملاء إلى سر ثابت عبر عمليات إعادة التشغيل. يحظر هذا العمليات المحلية الأخرى من استدعاء Gateway.

    إذا كنت تفضّل مسار مصادقة مختلفًا، يمكنك اختيار وضع كلمة المرور صراحةً (أو، لوكلاء reverse proxy المدركين للهوية، `trusted-proxy`). إذا كنت **تريد حقًا** فتح loopback، فاضبط `gateway.auth.mode: "none"` صراحةً في إعداداتك. يمكن لـ Doctor إنشاء رمز لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب عليّ إعادة التشغيل بعد تغيير الإعدادات؟">
    يراقب Gateway الإعدادات ويدعم إعادة التحميل الساخنة:

    - `gateway.reload.mode: "hybrid"` (الافتراضي): يطبّق التغييرات الآمنة مباشرةً، ويعيد التشغيل للتغييرات الحرجة
    - `hot` و`restart` و`off` مدعومة أيضًا

  </Accordion>

  <Accordion title="كيف أعطّل عبارات CLI الطريفة؟">
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

    - `off`: يخفي نص العبارة لكنه يبقي سطر عنوان اللافتة/الإصدار.
    - `default`: يستخدم `All your chats, one OpenClaw.` في كل مرة.
    - `random`: عبارات طريفة/موسمية متبدّلة (السلوك الافتراضي).
    - إذا كنت لا تريد أي لافتة إطلاقًا، فاضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="كيف أفعّل البحث في الويب (وجلب الويب)؟">
    يعمل `web_fetch` من دون مفتاح API. يعتمد `web_search` على المزوّد الذي اخترته:

    - تتطلب المزوّدات المدعومة بواجهة API مثل Brave وExa وFirecrawl وGemini وKimi وMiniMax Search وPerplexity وTavily إعداد مفتاح API المعتاد الخاص بها.
    - يمكن لـ Grok إعادة استخدام xAI OAuth من مصادقة النموذج، أو الرجوع إلى `XAI_API_KEY` / إعدادات بحث الويب الخاصة بالـ Plugin.
    - بحث الويب في Ollama لا يحتاج إلى مفتاح، لكنه يستخدم مضيف Ollama المضبوط لديك ويتطلب `ollama signin`.
    - DuckDuckGo لا يحتاج إلى مفتاح، لكنه تكامل غير رسمي قائم على HTML.
    - SearXNG لا يحتاج إلى مفتاح/مستضاف ذاتيًا؛ اضبط `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

    **موصى به:** شغّل `openclaw configure --section web` واختر مزوّدًا.
    بدائل البيئة:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: xAI OAuth, `XAI_API_KEY`
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

    توجد إعدادات بحث الويب الخاصة بكل مزوّد الآن ضمن `plugins.entries.<plugin>.config.webSearch.*`.
    لا تزال مسارات المزوّد القديمة `tools.web.search.*` تُحمّل مؤقتًا للتوافق، لكن ينبغي عدم استخدامها للإعدادات الجديدة.
    توجد إعدادات الرجوع لجلب الويب في Firecrawl ضمن `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم سماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - يكون `web_fetch` مفعّلًا افتراضيًا (ما لم يُعطّل صراحةً).
    - إذا حُذف `tools.web.fetch.provider`، يكتشف OpenClaw تلقائيًا أول مزوّد رجوع جاهز للجلب من بيانات الاعتماد المتاحة. يوفّر Plugin الرسمي لـ Firecrawl ذلك الرجوع.
    - تقرأ العمليات الخفية متغيرات البيئة من `~/.openclaw/.env` (أو بيئة الخدمة).

    المستندات: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="مسح config.apply إعداداتي. كيف أستعيدها وأتجنب ذلك؟">
    يستبدل `config.apply` **الإعدادات بالكامل**. إذا أرسلت كائنًا جزئيًا، فستُزال كل العناصر الأخرى.

    يحمي OpenClaw الحالي من كثير من عمليات المسح العرضية:

    - تتحقق عمليات كتابة الإعدادات المملوكة لـ OpenClaw من الإعدادات الكاملة بعد التغيير قبل الكتابة.
    - تُرفض عمليات الكتابة غير الصالحة أو المدمّرة المملوكة لـ OpenClaw وتُحفظ باسم `openclaw.json.rejected.*`.
    - إذا كسر تعديل مباشر بدء التشغيل أو إعادة التحميل الساخنة، يفشل Gateway بشكل مغلق أو يتجاوز إعادة التحميل؛ ولا يعيد كتابة `openclaw.json`.
    - يملك `openclaw doctor --fix` الإصلاح ويمكنه استعادة آخر إعداد صالح معروف مع حفظ الملف المرفوض باسم `openclaw.json.clobbered.*`.

    الاستعادة:

    - تحقق من `openclaw logs --follow` بحثًا عن `Invalid config at` أو `Config write rejected:` أو `config reload skipped (invalid config)`.
    - افحص أحدث `openclaw.json.clobbered.*` أو `openclaw.json.rejected.*` بجانب الإعداد النشط.
    - شغّل `openclaw config validate` و`openclaw doctor --fix`.
    - انسخ المفاتيح المقصودة فقط مرة أخرى باستخدام `openclaw config set` أو `config.patch`.
    - إذا لم يكن لديك آخر إعداد صالح معروف أو حمولة مرفوضة، فاستعد من نسخة احتياطية، أو أعد تشغيل `openclaw doctor` وأعد ضبط القنوات/النماذج.
    - إذا كان ذلك غير متوقع، فافتح بلاغ خلل وأرفق آخر إعداد معروف لديك أو أي نسخة احتياطية.
    - يستطيع وكيل ترميز محلي غالبًا إعادة بناء إعداد عامل من السجلات أو السجل التاريخي.

    تجنّب ذلك:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` للتعديلات التفاعلية.
    - استخدم `config.schema.lookup` أولًا عندما لا تكون متأكدًا من مسار دقيق أو شكل حقل؛ فهو يعيد عقدة مخطط سطحية مع ملخصات الأبناء المباشرين للتنقّل المتدرّج.
    - استخدم `config.patch` لتعديلات RPC الجزئية؛ واحتفظ بـ `config.apply` لاستبدال الإعداد الكامل فقط.
    - إذا كنت تستخدم أداة `gateway` الموجّهة للوكيل من تشغيل وكيل، فستظل ترفض الكتابات إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك أسماء `tools.bash.*` البديلة القديمة التي تُطبّع إلى مسارات exec المحمية نفسها).

    المستندات: [الإعدادات](/ar/cli/config)، [الضبط](/ar/cli/configure)، [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغّل Gateway مركزيًا مع عمّال متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحد** (مثل Raspberry Pi) بالإضافة إلى **عُقد** و**وكلاء**:

    - **Gateway (مركزي):** يملك القنوات (Signal/WhatsApp)، والتوجيه، والجلسات.
    - **العُقد (الأجهزة):** تتصل أجهزة Mac/iOS/Android كملحقات وتعرض أدوات محلية (`system.run`، `canvas`، `camera`).
    - **الوكلاء (العمّال):** عقول/مساحات عمل منفصلة للأدوار الخاصة (مثل "عمليات Hetzner"، "البيانات الشخصية").
    - **الوكلاء الفرعيون:** يشغّلون عملًا في الخلفية من وكيل رئيسي عندما تريد التوازي.
    - **TUI:** اتصل بـ Gateway وبدّل بين الوكلاء/الجلسات.

    المستندات: [العُقد](/ar/nodes)، [الوصول البعيد](/ar/gateway/remote)، [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/ar/web/tui).

  </Accordion>

  <Accordion title="هل يمكن تشغيل متصفح OpenClaw بلا واجهة؟">
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

    الافتراضي هو `false` (بواجهة). من المرجح أن يؤدي التشغيل بلا واجهة إلى تشغيل فحوصات مكافحة الروبوتات في بعض المواقع. راجع [المتصفح](/ar/tools/browser).

    يستخدم التشغيل بلا واجهة **محرك Chromium نفسه** ويعمل لمعظم عمليات الأتمتة (النماذج، النقرات، التجريف، تسجيل الدخول). الفروق الرئيسية:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات الشاشة إذا احتجت إلى المرئيات).
    - بعض المواقع أكثر صرامة بشأن الأتمتة في وضع التشغيل بلا واجهة (CAPTCHAs، مكافحة الروبوتات).
      على سبيل المثال، غالبًا ما يحظر X/Twitter الجلسات بلا واجهة.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    اضبط `browser.executablePath` على ملف Brave الثنائي لديك (أو أي متصفح قائم على Chromium) وأعد تشغيل Gateway.
    راجع أمثلة الإعداد الكاملة في [المتصفح](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## البوابات والعُقد البعيدة

<AccordionGroup>
  <Accordion title="كيف تنتقل الأوامر بين Telegram وgateway والعُقد؟">
    يتعامل **gateway** مع رسائل Telegram. يشغّل gateway الوكيل ثم
    بعد ذلك فقط يستدعي العُقد عبر **Gateway WebSocket** عند الحاجة إلى أداة عقدة:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    لا ترى العُقد حركة المزوّد الواردة؛ فهي تتلقى فقط استدعاءات RPC للعُقد.

  </Accordion>

  <Accordion title="كيف يستطيع وكيلي الوصول إلى حاسوبي إذا كان Gateway مستضافًا عن بُعد؟">
    الإجابة المختصرة: **اقرن حاسوبك كعقدة**. يعمل Gateway في مكان آخر، لكنه يستطيع
    استدعاء أدوات `node.*` (الشاشة، الكاميرا، النظام) على جهازك المحلي عبر Gateway WebSocket.

    الإعداد المعتاد:

    1. شغّل Gateway على المضيف الدائم التشغيل (VPS/خادم منزلي).
    2. ضع مضيف Gateway + حاسوبك على tailnet نفسها.
    3. تأكد من إمكانية الوصول إلى Gateway WS (ربط tailnet أو نفق SSH).
    4. افتح تطبيق macOS محليًا واتصل في وضع **Remote over SSH** (أو tailnet مباشرة)
       حتى يتمكن من التسجيل كعقدة.
    5. وافق على العقدة على Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا يلزم جسر TCP منفصل؛ تتصل العُقد عبر Gateway WebSocket.

    تذكير أمني: يسمح إقران عقدة macOS بتشغيل `system.run` على ذلك الجهاز. لا
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

  <Accordion title="هل يمكن لمثيلي OpenClaw التحدث إلى بعضهما (محلي + VPS)؟">
    نعم. لا يوجد جسر "روبوت إلى روبوت" مدمج، لكن يمكنك توصيله بعدة طرق
    موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يستطيع كلا الروبوتين الوصول إليها (Telegram/Slack/WhatsApp).
    اجعل Bot A يرسل رسالة إلى Bot B، ثم اترك Bot B يرد كالمعتاد.

    **جسر CLI (عام):** شغّل سكربتًا يستدعي Gateway الآخر باستخدام
    `openclaw agent --message ... --deliver`، مستهدفًا دردشة يستمع إليها الروبوت الآخر.
    إذا كان أحد الروبوتين على VPS بعيد، فوجّه CLI لديك إلى Gateway البعيد
    عبر SSH/Tailscale (راجع [الوصول البعيد](/ar/gateway/remote)).

    نمط مثال (شغّله من جهاز يستطيع الوصول إلى Gateway الهدف):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف حاجز حماية حتى لا يدخل الروبوتان في حلقة لا تنتهي (الرد عند الذكر فقط، أو
    قوائم سماح القنوات، أو قاعدة "عدم الرد على رسائل الروبوتات").

    المستندات: [الوصول البعيد](/ar/gateway/remote)، [CLI الوكيل](/ar/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى خوادم VPS منفصلة لوكلاء متعددين؟">
    لا. يمكن لـ Gateway واحد استضافة عدة وكلاء، لكل منهم مساحة عمله الخاصة، وافتراضات النماذج،
    والتوجيه. هذا هو الإعداد المعتاد وهو أرخص وأبسط بكثير من تشغيل
    VPS واحد لكل وكيل.

    استخدم خوادم VPS منفصلة فقط عندما تحتاج إلى عزل صارم (حدود أمنية) أو
    إعدادات مختلفة جدًا لا تريد مشاركتها. بخلاف ذلك، احتفظ بـ Gateway واحد
    واستخدم عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل توجد فائدة من استخدام عقدة على حاسوبي المحمول الشخصي بدلًا من SSH من VPS؟">
    نعم - العُقد هي الطريقة الأساسية للوصول إلى حاسوبك المحمول من Gateway بعيد، وهي
    تتيح أكثر من مجرد الوصول إلى الصدفة. يعمل Gateway على macOS/Linux (وWindows عبر WSL2) وهو
    خفيف الوزن (يكفي VPS صغير أو جهاز من فئة Raspberry Pi؛ وذاكرة RAM بحجم 4 GB أكثر من كافية)، لذا يكون الإعداد الشائع
    مضيفًا يعمل دائمًا إضافة إلى حاسوبك المحمول كعقدة.

    - **لا حاجة إلى SSH وارد.** تتصل العُقد خارجيًا بـ Gateway WebSocket وتستخدم إقران الأجهزة.
    - **ضوابط تنفيذ أكثر أمانًا.** يتم تقييد `system.run` بقوائم السماح/الموافقات الخاصة بالعقدة على ذلك الحاسوب المحمول.
    - **أدوات أجهزة أكثر.** تعرض العُقد `canvas` و`camera` و`screen` بالإضافة إلى `system.run`.
    - **أتمتة المتصفح المحلية.** أبقِ Gateway على VPS، لكن شغّل Chrome محليًا عبر مضيف عقدة على الحاسوب المحمول، أو اتصل بـ Chrome المحلي على المضيف عبر Chrome MCP.

    يناسب SSH الوصول العارض إلى الصدفة، لكن العُقد أبسط لسير عمل الوكلاء المستمر
    وأتمتة الأجهزة.

    المستندات: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تشغّل العُقد خدمة gateway؟">
    لا. يجب تشغيل **gateway واحد** فقط لكل مضيف ما لم تكن تشغّل عمدًا ملفات تعريف معزولة (راجع [بوابات gateway متعددة](/ar/gateway/multiple-gateways)). العُقد هي أجهزة طرفية تتصل
    بـ gateway (عُقد iOS/Android، أو "وضع العقدة" في macOS ضمن تطبيق شريط القوائم). لمضيفي العُقد بلا واجهة
    والتحكم عبر CLI، راجع [CLI مضيف Node](/ar/cli/node).

    يلزم إعادة تشغيل كاملة عند تغييرات `gateway` و`discovery` وسطح Plugin المستضاف.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق الإعدادات؟">
    نعم.

    - `config.schema.lookup`: افحص شجرة إعدادات فرعية واحدة مع عقدة المخطط السطحية الخاصة بها، وتلميح واجهة المستخدم المطابق، وملخصات الأبناء المباشرين قبل الكتابة
    - `config.get`: اجلب اللقطة الحالية + الهاش
    - `config.patch`: تحديث جزئي آمن (مفضل لمعظم تعديلات RPC)؛ يعيد التحميل أثناء التشغيل عندما يكون ذلك ممكنًا ويعيد التشغيل عند الحاجة
    - `config.apply`: تحقق + استبدل الإعداد الكامل؛ يعيد التحميل أثناء التشغيل عندما يكون ذلك ممكنًا ويعيد التشغيل عند الحاجة
    - لا تزال أداة تشغيل `gateway` الموجّهة للوكيل ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ وتُطبّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها

  </Accordion>

  <Accordion title="إعداد بسيط وسليم لأول تثبيت">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    يضبط هذا مساحة عملك ويقيّد من يمكنه تشغيل البوت.

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
       - في وحدة تحكم إدارة Tailscale، فعّل MagicDNS حتى يكون لـ VPS اسم ثابت.
    4. **استخدم اسم مضيف tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا أردت واجهة التحكم بدون SSH، فاستخدم Tailscale Serve على VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    يبقي هذا gateway مرتبطًا بـ loopback ويعرض HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أوصل عقدة Mac بـ Gateway بعيد (Tailscale Serve)؟">
    يعرّض Serve **واجهة تحكم Gateway + WS**. تتصل العُقد عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكد أن VPS + Mac على tailnet نفسها**.
    2. **استخدم تطبيق macOS في الوضع البعيد** (يمكن أن يكون هدف SSH هو اسم مضيف tailnet).
       سيقوم التطبيق بإنشاء نفق لمنفذ Gateway ويتصل كعقدة.
    3. **وافق على العقدة** على gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    المستندات: [بروتوكول Gateway](/ar/gateway/protocol)، [الاكتشاف](/ar/gateway/discovery)، [الوضع البعيد في macOS](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل يجب أن أثبّت على حاسوب محمول ثانٍ أم أضيف عقدة فقط؟">
    إذا كنت تحتاج فقط إلى **أدوات محلية** (screen/camera/exec) على الحاسوب المحمول الثاني، فأضفه
    **كعقدة**. يحافظ ذلك على Gateway واحد ويتجنب تكرار الإعداد. أدوات العقدة المحلية
    حاليًا خاصة بـ macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    ثبّت Gateway ثانيًا فقط عندما تحتاج إلى **عزل صارم** أو بوتين منفصلين بالكامل.

    المستندات: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes)، [بوابات gateway متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات البيئة وتحميل .env

<AccordionGroup>
  <Accordion title="كيف يحمّل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات البيئة من العملية الأصلية (الصدفة، launchd/systemd، CI، إلخ) ويحمّل أيضًا:

    - `.env` من دليل العمل الحالي
    - ملف `.env` احتياطيًا عامًا من `~/.openclaw/.env` (أي `$OPENCLAW_STATE_DIR/.env`)

    لا يتجاوز أي ملف `.env` متغيرات البيئة الموجودة.
    متغيرات اعتماد المزوّدين استثناء لملف `.env` الخاص بمساحة العمل: يتم تجاهل مفاتيح مثل
    `GEMINI_API_KEY` أو `XAI_API_KEY` أو `MISTRAL_API_KEY` من ملف
    `.env` الخاص بمساحة العمل، ويجب أن تكون في بيئة العملية، أو `~/.openclaw/.env`، أو إعداد `env`.

    يمكنك أيضًا تعريف متغيرات بيئة مضمنة في الإعداد (تُطبّق فقط إذا كانت مفقودة من بيئة العملية):

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

    1. ضع المفاتيح المفقودة في `~/.openclaw/.env` حتى تُلتقط حتى عندما لا ترث الخدمة بيئة الصدفة لديك.
    2. فعّل استيراد الصدفة (تسهيل اختياري):

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

    يشغّل هذا صدفة تسجيل الدخول لديك ويستورد فقط المفاتيح المتوقعة المفقودة (لا يتجاوز أبدًا). مكافئات متغيرات البيئة:
    `OPENCLAW_LOAD_SHELL_ENV=1`، `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='عيّنت COPILOT_GITHUB_TOKEN، لكن حالة النماذج تعرض "Shell env: off." لماذا؟'>
    يبلّغ `openclaw models status` عما إذا كان **استيراد بيئة الصدفة** مفعّلًا. "Shell env: off"
    لا تعني أن متغيرات البيئة لديك مفقودة - بل تعني فقط أن OpenClaw لن يحمّل
    صدفة تسجيل الدخول لديك تلقائيًا.

    إذا كان Gateway يعمل كخدمة (launchd/systemd)، فلن يرث بيئة الصدفة
    لديك. أصلح ذلك بفعل أحد هذه الأمور:

    1. ضع الرمز المميز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد الصدفة (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في إعدادك (يُطبّق فقط إذا كان مفقودًا).

    ثم أعد تشغيل gateway وتحقق مجددًا:

    ```bash
    openclaw models status
    ```

    تُقرأ رموز Copilot المميزة من `COPILOT_GITHUB_TOKEN` (وأيضًا `GH_TOKEN` / `GITHUB_TOKEN`).
    راجع [/concepts/model-providers](/ar/concepts/model-providers) و[/environment](/ar/help/environment).

  </Accordion>
</AccordionGroup>

## الجلسات والمحادثات المتعددة

<AccordionGroup>
  <Accordion title="كيف أبدأ محادثة جديدة؟">
    أرسل `/new` أو `/reset` كرسالة مستقلة. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>

  <Accordion title="هل تُعاد تهيئة الجلسات تلقائيًا إذا لم أرسل /new أبدًا؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا **معطّل افتراضيًا** (القيمة الافتراضية **0**).
    اضبطه على قيمة موجبة لتفعيل انتهاء الصلاحية عند الخمول. عند التفعيل، تبدأ الرسالة **التالية**
    بعد فترة الخمول معرّف جلسة جديدًا لذلك مفتاح المحادثة.
    لا يحذف هذا النصوص المسجلة - بل يبدأ جلسة جديدة فقط.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="هل توجد طريقة لإنشاء فريق من مثيلات OpenClaw (مدير تنفيذي واحد والعديد من الوكلاء)؟">
    نعم، عبر **التوجيه متعدد الوكلاء** و**الوكلاء الفرعيين**. يمكنك إنشاء وكيل منسق واحد
    وعدة وكلاء عاملين بمساحات عمل ونماذج خاصة بهم.

    ومع ذلك، من الأفضل النظر إلى هذا على أنه **تجربة ممتعة**. فهو يستهلك الكثير من الرموز وغالبًا
    أقل كفاءة من استخدام بوت واحد مع جلسات منفصلة. النموذج المعتاد الذي
    نتصوره هو بوت واحد تتحدث إليه، مع جلسات مختلفة للعمل المتوازي. ويمكن لذلك
    البوت أيضًا إنشاء وكلاء فرعيين عند الحاجة.

    المستندات: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [CLI الوكلاء](/ar/cli/agents).

  </Accordion>

  <Accordion title="لماذا تم اقتطاع السياق في منتصف المهمة؟ كيف أمنع ذلك؟">
    سياق الجلسة محدود بنافذة النموذج. يمكن للمحادثات الطويلة، أو مخرجات الأدوات الكبيرة، أو العديد من
    الملفات أن تؤدي إلى Compaction أو الاقتطاع.

    ما يساعد:

    - اطلب من البوت تلخيص الحالة الحالية وكتابتها إلى ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل المواضيع.
    - احتفظ بالسياق المهم في مساحة العمل واطلب من البوت قراءته من جديد.
    - استخدم الوكلاء الفرعيين للعمل الطويل أو المتوازي حتى تبقى المحادثة الرئيسية أصغر.
    - اختر نموذجًا بنافذة سياق أكبر إذا حدث هذا كثيرًا.

  </Accordion>

  <Accordion title="كيف أعيد تهيئة OpenClaw بالكامل مع إبقائه مثبتًا؟">
    استخدم أمر إعادة التهيئة:

    ```bash
    openclaw reset
    ```

    إعادة تهيئة كاملة غير تفاعلية:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    ثم شغّل الإعداد من جديد:

    ```bash
    openclaw onboard --install-daemon
    ```

    ملاحظات:

    - يعرض الإعداد الأولي أيضًا **إعادة التهيئة** إذا رأى إعدادًا موجودًا. راجع [الإعداد الأولي (CLI)](/ar/start/wizard).
    - إذا استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد تهيئة كل دليل حالة (القيم الافتراضية هي `~/.openclaw-<profile>`).
    - إعادة تهيئة التطوير: `openclaw gateway --dev --reset` (خاص بالتطوير فقط؛ يمسح إعداد التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='أتلقى أخطاء "context too large" - كيف أعيد التهيئة أو أضغط السياق؟'>
    استخدم أحد هذه الخيارات:

    - **Compaction** (يبقي المحادثة لكنه يلخص الأدوار الأقدم):

      ```
      /compact
      ```

      أو `/compact <instructions>` لتوجيه الملخص.

    - **إعادة التهيئة** (معرّف جلسة جديد لمفتاح المحادثة نفسه):

      ```
      /new
      /reset
      ```

    إذا استمر حدوث ذلك:

    - فعّل أو اضبط **تشذيب الجلسة** (`agents.defaults.contextPruning`) لتقليص مخرجات الأدوات القديمة.
    - استخدم نموذجًا بنافذة سياق أكبر.

    المستندات: [Compaction](/ar/concepts/compaction)، [تشذيب الجلسة](/ar/concepts/session-pruning)، [إدارة الجلسات](/ar/concepts/session).

  </Accordion>

  <Accordion title='لماذا أرى "LLM request rejected: messages.content.tool_use.input field required"؟'>
    هذا خطأ تحقق من المزوّد: أصدر النموذج كتلة `tool_use` بدون
    `input` المطلوب. يعني هذا عادةً أن سجل الجلسة قديم أو تالف (غالبًا بعد سلاسل طويلة
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

    إذا كان الملف `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (يحتوي فقط على أسطر فارغة،
    أو تعليقات Markdown/HTML، أو عناوين Markdown مثل `# Heading`، أو علامات الأسوار،
    أو نماذج قوائم تحقق فارغة)، فإن OpenClaw يتخطى تشغيل Heartbeat لتوفير استدعاءات API.
    إذا كان الملف مفقودًا، فسيظل Heartbeat يعمل ويقرر النموذج ما يجب فعله.

    تستخدم التجاوزات لكل وكيل `agents.list[].heartbeat`. الوثائق: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل أحتاج إلى إضافة "حساب بوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك الخاص**، لذلك إذا كنت موجودًا في المجموعة، يستطيع OpenClaw رؤيتها.
    افتراضيًا، تُحظر الردود في المجموعات حتى تسمح للمرسلين (`groupPolicy: "allowlist"`).

    إذا كنت تريد أن تكون **أنت فقط** قادرًا على تشغيل الردود في المجموعات:

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

    الخيار 2 (إذا كان مكوّنًا/مدرجًا في قائمة السماح بالفعل): اعرض المجموعات من الإعدادات:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    الوثائق: [WhatsApp](/ar/channels/whatsapp)، [الدليل](/ar/cli/directory)، [السجلات](/ar/cli/logs).

  </Accordion>

  <Accordion title="لماذا لا يرد OpenClaw في مجموعة؟">
    سببان شائعان:

    - بوابة الإشارة مفعّلة (افتراضيًا). يجب أن تشير إلى البوت باستخدام @mention (أو تطابق `mentionPatterns`).
    - قمت بتكوين `channels.whatsapp.groups` من دون `"*"` والمجموعة غير مدرجة في قائمة السماح.

    راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشارك المجموعات/المواضيع السياق مع الرسائل المباشرة؟">
    تُطوى المحادثات المباشرة إلى الجلسة الرئيسية افتراضيًا. للمجموعات/القنوات مفاتيح جلسات خاصة بها، وتكون مواضيع Telegram / سلاسل Discord جلسات منفصلة. راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم عدد مساحات العمل والوكلاء التي يمكنني إنشاؤها؟">
    لا توجد حدود صارمة. العشرات (بل المئات) مقبولة، لكن انتبه إلى:

    - **نمو القرص:** تعيش الجلسات + النصوص ضمن `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** يعني المزيد من الوكلاء استخدامًا أكثر تزامنًا للنموذج.
    - **عبء التشغيل:** ملفات تعريف المصادقة، ومساحات العمل، وتوجيه القنوات لكل وكيل.

    نصائح:

    - احتفظ بمساحة عمل **نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - احذف الجلسات القديمة (احذف ملفات JSONL أو إدخالات المخزن) إذا كبر حجم القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل الشاردة وعدم تطابق ملفات التعريف.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة بوتات أو محادثات في الوقت نفسه (Slack)، وكيف يجب أن أعد ذلك؟">
    نعم. استخدم **التوجيه متعدد الوكلاء** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة حسب
    القناة/الحساب/النظير. Slack مدعوم كقناة ويمكن ربطه بوكلاء محددين.

    الوصول عبر المتصفح قوي، لكنه ليس "افعل أي شيء يستطيع الإنسان فعله" - فقد تظل مكافحة البوتات، واختبارات CAPTCHA، والمصادقة متعددة العوامل
    تحظر الأتمتة. للحصول على أكثر تحكم موثوق بالمتصفح، استخدم Chrome MCP المحلي على المضيف،
    أو استخدم CDP على الجهاز الذي يشغّل المتصفح فعليًا.

    الإعداد وفق أفضل الممارسات:

    - مضيف Gateway يعمل دائمًا (VPS/Mac mini).
    - وكيل واحد لكل دور (ارتباطات).
    - قناة/قنوات Slack مرتبطة بهؤلاء الوكلاء.
    - متصفح محلي عبر Chrome MCP أو عقدة عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [Slack](/ar/channels/slack)،
    [المتصفح](/ar/tools/browser)، [العقد](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج، تجاوز الفشل، وملفات تعريف المصادقة

توجد أسئلة وأجوبة النماذج — الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة —
في [الأسئلة الشائعة حول النماذج](/ar/help/faq-models).

## Gateway: المنافذ، "قيد التشغيل بالفعل"، والوضع البعيد

<AccordionGroup>
  <Accordion title="ما المنفذ الذي يستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ المفرد متعدد الإرسال لـ WebSocket + HTTP (واجهة التحكم، الخطافات، وما إلى ذلك).

    الأسبقية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا يقول openclaw gateway status "Runtime: running" لكن "Connectivity probe: failed"؟'>
    لأن "running" هو منظور **المشرف** (launchd/systemd/schtasks). أما فحص الاتصال فهو CLI يتصل فعليًا بـ WebSocket الخاص بـ Gateway.

    استخدم `openclaw gateway status` وثق بهذه الأسطر:

    - `Probe target:` (عنوان URL الذي استخدمه الفحص فعليًا)
    - `Listening:` (ما هو مرتبط فعليًا على المنفذ)
    - `Last gateway error:` (سبب جذري شائع عندما تكون العملية حية لكن المنفذ لا يستمع)

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status أن "Config (cli)" و"Config (service)" مختلفان؟'>
    أنت تعدّل ملف إعدادات واحدًا بينما تعمل الخدمة بملف آخر (غالبًا بسبب عدم تطابق `--profile` / `OPENCLAW_STATE_DIR`).

    الإصلاح:

    ```bash
    openclaw gateway install --force
    ```

    شغّل ذلك من نفس `--profile` / البيئة التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ماذا يعني "another gateway instance is already listening"؟'>
    يفرض OpenClaw قفل وقت التشغيل بربط مستمع WebSocket فورًا عند بدء التشغيل (الافتراضي `ws://127.0.0.1:18789`). إذا فشل الربط مع `EADDRINUSE`، فإنه يرمي `GatewayLockError` مشيرًا إلى أن مثيلًا آخر يستمع بالفعل.

    الإصلاح: أوقف المثيل الآخر، أو حرر المنفذ، أو شغّل باستخدام `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="كيف أشغّل OpenClaw في الوضع البعيد (يتصل العميل بـ Gateway في مكان آخر)؟">
    اضبط `gateway.mode: "remote"` ووجّهه إلى عنوان WebSocket بعيد، اختياريًا مع بيانات اعتماد بعيدة ذات سر مشترك:

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

    - يبدأ `openclaw gateway` فقط عندما يكون `gateway.mode` هو `local` (أو تمرر راية التجاوز).
    - يراقب تطبيق macOS ملف الإعدادات ويبدّل الأوضاع مباشرة عند تغير هذه القيم.
    - `gateway.remote.token` / `.password` هي بيانات اعتماد بعيدة من جهة العميل فقط؛ ولا تفعّل مصادقة Gateway المحلية بمفردها.

  </Accordion>

  <Accordion title='تقول واجهة التحكم "unauthorized" (أو تواصل إعادة الاتصال). ماذا الآن؟'>
    لا يتطابق مسار مصادقة Gateway لديك مع طريقة مصادقة واجهة المستخدم.

    حقائق (من الشيفرة):

    - تحتفظ واجهة التحكم بالرمز في `sessionStorage` لجلسة تبويب المتصفح الحالية وعنوان URL المختار لـ Gateway، لذلك تستمر عمليات التحديث في التبويب نفسه بالعمل من دون استعادة استمرارية رمز localStorage طويل الأمد.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة واحدة محدودة باستخدام رمز جهاز مخزن مؤقتًا عندما يعيد Gateway تلميحات إعادة المحاولة (`canRetryWithDeviceToken=true`، `recommendedNextStep=retry_with_device_token`).
    - إعادة المحاولة بالرمز المخزن مؤقتًا تعيد الآن استخدام النطاقات المعتمدة المخزنة مع رمز الجهاز. لا يزال مستدعو `deviceToken` الصريح / `scopes` الصريحة يحتفظون بمجموعة النطاقات المطلوبة لديهم بدلًا من وراثة النطاقات المخزنة مؤقتًا.
    - خارج مسار إعادة المحاولة هذا، تكون أسبقية مصادقة الاتصال: الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز التمهيد.
    - تمهيد رمز الإعداد المدمج خاص بالعقدة فقط. بعد الموافقة، يعيد رمز جهاز عقدة مع `scopes: []` ولا يعيد رمز مشغّل مسلّمًا.

    الإصلاح:

    - الأسرع: `openclaw dashboard` (يطبع + ينسخ عنوان URL للوحة المعلومات، ويحاول فتحه؛ ويعرض تلميح SSH إذا كان بلا واجهة).
    - إذا لم يكن لديك رمز بعد: `openclaw doctor --generate-gateway-token`.
    - إذا كان بعيدًا، أنشئ نفقًا أولًا: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع السر المشترك: اضبط `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم الصق السر المطابق في إعدادات واجهة التحكم.
    - وضع Tailscale Serve: تأكد من تمكين `gateway.auth.allowTailscale` وأنك تفتح عنوان URL الخاص بـ Serve، وليس عنوان local loopback/tailnet خامًا يتجاوز ترويسات هوية Tailscale.
    - وضع الوكيل الموثوق: تأكد من أنك تأتي عبر الوكيل المدرك للهوية المكوّن، وليس عنوان URL خامًا لـ Gateway. تحتاج وكلاء local loopback على نفس المضيف أيضًا إلى `gateway.auth.trustedProxy.allowLoopback = true`.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، قم بتدوير/إعادة اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا قالت مكالمة التدوير هذه إنه تم رفضها، فتحقق من أمرين:
      - يمكن لجلسات الأجهزة المقترنة تدوير جهازها **الخاص** فقط ما لم تكن تملك أيضًا `operator.admin`
      - لا يمكن لقيم `--scope` الصريحة تجاوز نطاقات المشغّل الحالية للمستدعي
    - ما زلت عالقًا؟ شغّل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [لوحة المعلومات](/ar/web/dashboard) لتفاصيل المصادقة.

  </Accordion>

  <Accordion title="ضبطت gateway.bind على tailnet لكنه لا يستطيع الربط ولا يستمع شيء">
    يختار ربط `tailnet` عنوان IP من Tailscale من واجهات شبكتك (100.64.0.0/10). إذا لم يكن الجهاز على Tailscale (أو كانت الواجهة معطلة)، فلا يوجد ما يمكن الربط به.

    الإصلاح:

    - ابدأ Tailscale على ذلك المضيف (حتى يحصل على عنوان 100.x)، أو
    - بدّل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. يفضل `auto` local loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطًا خاصًا بـ tailnet فقط.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة Gateways على المضيف نفسه؟">
    عادةً لا - يمكن لـ Gateway واحد تشغيل عدة قنوات مراسلة ووكلاء. استخدم عدة Gateways فقط عندما تحتاج إلى التكرار (مثل: بوت إنقاذ) أو العزل الصارم.

    نعم، لكن يجب عليك العزل:

    - `OPENCLAW_CONFIG_PATH` (إعداد لكل مثيل)
    - `OPENCLAW_STATE_DIR` (حالة لكل مثيل)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (موصى به):

    - استخدم `openclaw --profile <name> ...` لكل مثيل (ينشئ تلقائيًا `~/.openclaw-<name>`).
    - اضبط `gateway.port` فريدًا في إعدادات كل ملف تعريف (أو مرر `--port` للتشغيل اليدوي).
    - ثبّت خدمة لكل ملف تعريف: `openclaw --profile <name> gateway install`.

    تضيف ملفات التعريف أيضًا لاحقة إلى أسماء الخدمات (`ai.openclaw.<profile>`؛ القديم `com.openclaw.*`، و`openclaw-gateway-<profile>.service`، و`OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [عدة Gateways](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ماذا يعني "invalid handshake" / الرمز 1008؟'>
    Gateway هو **خادم WebSocket**، ويتوقع أن تكون الرسالة الأولى تمامًا
    إطار `connect`. إذا تلقى أي شيء آخر، يغلق الاتصال
    باستخدام **الرمز 1008** (انتهاك السياسة).

    أسباب شائعة:

    - فتحت عنوان URL الخاص بـ **HTTP** في متصفح (`http://...`) بدلًا من عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - أزال وكيل أو نفق ترويسات المصادقة أو أرسل طلبًا غير خاص بـ Gateway.

    إصلاحات سريعة:

    1. استخدم عنوان WS: `ws://<host>:18789` (أو `wss://...` إذا كان HTTPS).
    2. لا تفتح منفذ WS في تبويب متصفح عادي.
    3. إذا كانت المصادقة مفعّلة، فأدرج الرمز/كلمة المرور في إطار `connect`.

    إذا كنت تستخدم CLI أو TUI، فيجب أن يبدو عنوان URL كما يلي:

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

    يمكنك تعيين مسار ثابت عبر `logging.file`. يتحكم `logging.level` في مستوى سجل الملفات. ويتحكم `--verbose` و`logging.consoleLevel` في إسهاب وحدة التحكم.

    أسرع متابعة للسجل:

    ```bash
    openclaw logs --follow
    ```

    سجلات الخدمة/المشرف (عندما يعمل Gateway عبر launchd/systemd):

    - stdout لـ macOS launchd: `~/Library/Logs/openclaw/gateway.log` (تستخدم الملفات الشخصية `gateway-<profile>.log`؛ ويتم كتم stderr)
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

    إذا كنت تشغل Gateway يدويا، فيمكن لـ `openclaw gateway --force` استعادة المنفذ. راجع [Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="أغلقت الطرفية على Windows - كيف أعيد تشغيل OpenClaw؟">
    توجد **ثلاثة أوضاع تثبيت على Windows**:

    **1) إعداد Windows Hub المحلي:** يدير التطبيق الأصلي Gateway محليا مملوكا للتطبيق داخل WSL.

    افتح **OpenClaw Companion** من قائمة Start أو من الصينية، ثم استخدم
    **Gateway Setup** أو تبويب Connections.

    **2) Gateway يدوي عبر WSL2:** يعمل Gateway داخل Linux.

    افتح PowerShell، وادخل إلى WSL، ثم أعد التشغيل:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا لم تكن قد ثبت الخدمة من قبل، فابدأها في المقدمة:

    ```bash
    openclaw gateway run
    ```

    **3) CLI/Gateway أصلي على Windows:** يعمل Gateway مباشرة في Windows.

    افتح PowerShell وشغل:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا كنت تشغله يدويا (بلا خدمة)، فاستخدم:

    ```powershell
    openclaw gateway run
    ```

    الوثائق: [Windows](/ar/platforms/windows)، [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="Gateway يعمل لكن الردود لا تصل أبدا. ما الذي ينبغي التحقق منه؟">
    ابدأ بفحص سريع للحالة:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    الأسباب الشائعة:

    - لم يتم تحميل مصادقة النموذج على **مضيف Gateway** (تحقق من `models status`).
    - اقتران القناة/قائمة السماح تمنع الردود (تحقق من إعدادات القناة والسجلات).
    - WebChat/Dashboard مفتوح من دون الرمز الصحيح.

    إذا كنت بعيدا، فتأكد من أن اتصال النفق/Tailscale يعمل وأن
    Gateway WebSocket قابل للوصول.

    الوثائق: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول عن بعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"تم قطع الاتصال بـ gateway: لا يوجد سبب" - ماذا الآن؟'>
    يعني هذا عادة أن واجهة المستخدم فقدت اتصال WebSocket. تحقق من:

    1. هل Gateway يعمل؟ `openclaw gateway status`
    2. هل Gateway سليم؟ `openclaw status`
    3. هل لدى واجهة المستخدم الرمز الصحيح؟ `openclaw dashboard`
    4. إذا كنت بعيدا، هل رابط النفق/Tailscale يعمل؟

    ثم تابع السجلات:

    ```bash
    openclaw logs --follow
    ```

    الوثائق: [Dashboard](/ar/web/dashboard)، [الوصول عن بعد](/ar/gateway/remote)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

  </Accordion>

  <Accordion title="يفشل Telegram setMyCommands. ما الذي ينبغي التحقق منه؟">
    ابدأ بالسجلات وحالة القناة:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    ثم طابق الخطأ:

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على عدد كبير جدا من الإدخالات. يقلص OpenClaw القائمة بالفعل إلى حد Telegram ويعيد المحاولة بأوامر أقل، لكن بعض إدخالات القائمة لا تزال بحاجة إلى الحذف. قلل أوامر plugin/skill/المخصصة، أو عطل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed`، أو `Network request for 'setMyCommands' failed!`، أو أخطاء شبكة مشابهة: إذا كنت على VPS أو خلف وكيل، فتأكد من السماح باتصالات HTTPS الصادرة ومن أن DNS يعمل مع `api.telegram.org`.

    إذا كان Gateway بعيدا، فتأكد من أنك تنظر إلى السجلات على مضيف Gateway.

    الوثائق: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="لا يعرض TUI أي مخرجات. ما الذي ينبغي التحقق منه؟">
    تأكد أولا من إمكانية الوصول إلى Gateway ومن قدرة الوكيل على التشغيل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لرؤية الحالة الحالية. إذا كنت تتوقع ردودا في قناة دردشة،
    فتأكد من تمكين التسليم (`/deliver on`).

    الوثائق: [TUI](/ar/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway تماما ثم أبدأه؟">
    إذا كنت قد ثبت الخدمة:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    يوقف/يبدأ هذا **الخدمة الخاضعة للإشراف** (launchd على macOS، وsystemd على Linux).
    استخدم هذا عندما يعمل Gateway في الخلفية كخدمة daemon.

    إذا كنت تشغله في المقدمة، فأوقفه باستخدام Ctrl-C، ثم:

    ```bash
    openclaw gateway run
    ```

    الوثائق: [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart مقابل openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **خدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغل Gateway **في المقدمة** لجلسة الطرفية هذه.

    إذا كنت قد ثبت الخدمة، فاستخدم أوامر Gateway. استخدم `openclaw gateway` عندما
    تريد تشغيلا لمرة واحدة في المقدمة.

  </Accordion>

  <Accordion title="أسرع طريقة للحصول على مزيد من التفاصيل عند فشل شيء ما">
    ابدأ Gateway باستخدام `--verbose` للحصول على تفاصيل أكثر في وحدة التحكم. ثم افحص ملف السجل بحثا عن مصادقة القنوات، وتوجيه النماذج، وأخطاء RPC.
  </Accordion>
</AccordionGroup>

## الوسائط والمرفقات

<AccordionGroup>
  <Accordion title="أنشأت skill صورة/PDF، لكن لم يتم إرسال أي شيء">
    يجب أن تستخدم المرفقات الصادرة من الوكيل حقول وسائط منظمة مثل `media` أو `mediaUrl` أو `path` أو `filePath`. راجع [إعداد مساعد OpenClaw](/ar/start/openclaw) و[إرسال الوكيل](/ar/tools/agent-send).

    الإرسال عبر CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    تحقق أيضا من:

    - أن القناة الهدف تدعم الوسائط الصادرة وليست محظورة بقوائم السماح.
    - أن الملف ضمن حدود الحجم لدى الموفر (تتم إعادة تحجيم الصور إلى حد أقصى 2048px).
    - يحصر `tools.fs.workspaceOnly=true` الإرسالات ذات المسار المحلي في مساحة العمل، ومخزن temp/media-store، والملفات المتحقق منها عبر sandbox.
    - يتيح `tools.fs.workspaceOnly=false` لإرسالات الوسائط المحلية المنظمة استخدام ملفات محلية على المضيف يستطيع الوكيل قراءتها بالفعل، لكن فقط للوسائط وأنواع المستندات الآمنة (الصور، الصوت، الفيديو، PDF، مستندات Office، والمستندات النصية المتحقق منها مثل Markdown/MD وTXT وJSON وYAML وYML). هذا ليس ماسح أسرار: يمكن إرفاق `secret.txt` أو `config.json` قابل للقراءة من الوكيل عندما تتطابق الإضافة والتحقق من المحتوى. أبق الملفات الحساسة خارج المسارات القابلة للقراءة من الوكيل، أو أبق `tools.fs.workspaceOnly=true` لإرسالات مسار محلي أكثر صرامة.

    راجع [الصور](/ar/nodes/images).

  </Accordion>
</AccordionGroup>

## الأمان والتحكم في الوصول

<AccordionGroup>
  <Accordion title="هل من الآمن تعريض OpenClaw للرسائل المباشرة الواردة؟">
    تعامل مع الرسائل المباشرة الواردة كمدخلات غير موثوقة. صممت القيم الافتراضية لتقليل المخاطر:

    - السلوك الافتراضي على القنوات القادرة على الرسائل المباشرة هو **الاقتران**:
      - يتلقى المرسلون غير المعروفين رمز اقتران؛ ولا يعالج البوت رسالتهم.
      - وافق باستخدام: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - يتم تحديد الطلبات المعلقة عند **3 لكل قناة**؛ تحقق من `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل الرمز.
    - يتطلب فتح الرسائل المباشرة للعامة اشتراكا صريحا (`dmPolicy: "open"` وقائمة سماح `"*"`).

    شغل `openclaw doctor` لإظهار سياسات الرسائل المباشرة عالية المخاطر.

  </Accordion>

  <Accordion title="هل حقن المطالبات مصدر قلق للبوتات العامة فقط؟">
    لا. حقن المطالبات يتعلق بـ **المحتوى غير الموثوق**، وليس فقط بمن يستطيع مراسلة البوت مباشرة.
    إذا كان مساعدك يقرأ محتوى خارجيا (بحث/جلب ويب، صفحات متصفح، رسائل بريد إلكتروني،
    مستندات، مرفقات، سجلات ملصقة)، فيمكن لذلك المحتوى أن يتضمن تعليمات تحاول
    اختطاف النموذج. يمكن أن يحدث هذا حتى إذا كنت **أنت المرسل الوحيد**.

    يكون الخطر الأكبر عند تمكين الأدوات: يمكن خداع النموذج كي
    يسرّب السياق أو يستدعي أدوات نيابة عنك. قلل نطاق الضرر عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو معطل الأدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` معطلة للوكلاء الممكنة أدواتهم
    - التعامل مع نص الملفات/المستندات المفكوك باعتباره غير موثوق أيضا: يلف كل من
      OpenResponses `input_file` واستخراج مرفقات الوسائط النص المستخرج ضمن
      علامات حدود محتوى خارجي صريحة بدلا من تمرير نص الملف الخام
    - العزل في sandbox وقوائم سماح صارمة للأدوات

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل OpenClaw أقل أمانا لأنه يستخدم TypeScript/Node بدلا من Rust/WASM؟">
    اللغة ووقت التشغيل مهمان، لكنهما ليسا الخطر الرئيسي لوكيل شخصي.
    المخاطر العملية في OpenClaw هي تعرض Gateway، ومن يستطيع مراسلة
    البوت، وحقن المطالبات، ونطاق الأدوات، والتعامل مع بيانات الاعتماد، ووصول المتصفح، ووصول exec،
    والثقة في skills أو plugins التابعة لجهات خارجية.

    يمكن أن يوفر Rust وWASM عزلا أقوى لبعض فئات الكود، لكنهما
    لا يحلان حقن المطالبات، أو قوائم السماح السيئة، أو تعرض Gateway للعامة،
    أو الأدوات الواسعة جدا، أو ملف متصفح شخصي مسجل دخوله بالفعل إلى
    حسابات حساسة. تعامل مع هذه باعتبارها عناصر التحكم الأساسية:

    - أبق Gateway خاصا أو موثقا
    - استخدم الاقتران وقوائم السماح للرسائل المباشرة والمجموعات
    - ارفض أو اعزل الأدوات عالية المخاطر للمدخلات غير الموثوقة
    - ثبت plugins وskills الموثوقة فقط
    - شغل `openclaw security audit --deep` بعد تغييرات الإعدادات

    التفاصيل: [الأمان](/ar/gateway/security)، [العزل في sandbox](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="رأيت تقارير عن مثيلات OpenClaw مكشوفة. ما الذي ينبغي التحقق منه؟">
    تحقق أولا من نشرك الفعلي:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    خط أساس أكثر أمانا هو:

    - ربط Gateway بـ `loopback`، أو تعريضه فقط عبر وصول خاص موثق
      مثل tailnet، أو نفق SSH، أو مصادقة رمز/كلمة مرور، أو وكيل موثوق
      مهيأ بشكل صحيح
    - الرسائل المباشرة في وضع `pairing` أو `allowlist`
    - المجموعات ضمن قائمة سماح ومقيدة بالذكر ما لم يكن كل عضو موثوقا
    - الأدوات عالية المخاطر (`exec`، `browser`، `gateway`، `cron`) مرفوضة أو محددة النطاق بإحكام
      للوكلاء الذين يقرؤون محتوى غير موثوق
    - تمكين العزل في sandbox حيث يحتاج تنفيذ الأدوات إلى نطاق ضرر أصغر

    الربط العام بلا مصادقة، والرسائل المباشرة/المجموعات المفتوحة مع الأدوات، وتحكم المتصفح
    المكشوف هي النتائج التي ينبغي إصلاحها أولا. التفاصيل:
    [قائمة تدقيق تدقيق الأمان](/ar/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="هل تثبيت ClawHub skills وplugins التابعة لجهات خارجية آمن؟">
    تعامل مع skills وplugins التابعة لجهات خارجية ككود تختار الوثوق به.
    تعرض صفحات ClawHub skill حالة الفحص قبل التثبيت، لكن الفحوصات ليست
    حدا أمنيا كاملا. لا يشغل OpenClaw حظرا محليا مضمنا
    للكود الخطر أثناء تدفقات تثبيت/تحديث plugin أو skill؛ استخدم
    `security.installPolicy` المملوك للمشغل لقرارات السماح/الحظر المحلية.

    نمط أكثر أمانا:

    - فضل المؤلفين الموثوقين والإصدارات المثبتة
    - اقرأ skill أو plugin قبل تمكينه
    - أبق قوائم سماح plugins وskills ضيقة
    - شغل تدفقات عمل المدخلات غير الموثوقة في sandbox بأدوات قليلة
    - تجنب منح كود الجهات الخارجية وصولا واسعا إلى نظام الملفات، أو exec، أو المتصفح، أو الأسرار

    التفاصيل: [Skills](/ar/tools/skills)، [Plugins](/ar/tools/plugin)،
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يجب أن يكون لروبوتي بريد إلكتروني أو حساب GitHub أو رقم هاتف خاص به؟">
    نعم، في معظم الإعدادات. عزل الروبوت بحسابات وأرقام هاتف منفصلة
    يقلل نطاق الضرر إذا حدث خطأ ما. كما يسهل ذلك تدوير
    بيانات الاعتماد أو إبطال الوصول دون التأثير في حساباتك الشخصية.

    ابدأ صغيرًا. امنح الوصول فقط إلى الأدوات والحسابات التي تحتاج إليها فعليًا، ووسّع
    لاحقًا إذا لزم الأمر.

    الوثائق: [الأمان](/ar/gateway/security)، [الإقران](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية، وهل هذا آمن؟">
    نحن **لا** نوصي بالاستقلالية الكاملة على رسائلك الشخصية. النمط الأكثر أمانًا هو:

    - أبقِ الرسائل الخاصة في **وضع الإقران** أو ضمن قائمة سماح ضيقة.
    - استخدم **رقمًا أو حسابًا منفصلًا** إذا أردته أن يرسل الرسائل نيابةً عنك.
    - دعه يصيغ المسودة، ثم **وافق قبل الإرسال**.

    إذا أردت التجربة، فافعل ذلك على حساب مخصص وأبقه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل للدردشة فقط وكان الإدخال موثوقًا. المستويات الأصغر
    أكثر عرضة لاختطاف التعليمات، لذا تجنبها للوكلاء الممكّنين بالأدوات
    أو عند قراءة محتوى غير موثوق. إذا كان لا بد من استخدام نموذج أصغر، فأغلق
    الأدوات بإحكام وشغّله داخل صندوق عزل. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="شغّلت /start في Telegram ولكنني لم أحصل على رمز إقران">
    تُرسل رموز الإقران **فقط** عندما يرسل مرسل غير معروف رسالة إلى الروبوت ويكون
    `dmPolicy: "pairing"` مفعّلًا. الأمر `/start` وحده لا ينشئ رمزًا.

    تحقق من الطلبات المعلقة:

    ```bash
    openclaw pairing list telegram
    ```

    إذا أردت وصولًا فوريًا، فأضف معرّف المرسل إلى قائمة السماح أو عيّن `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيراسل جهات اتصالي؟ كيف يعمل الإقران؟">
    لا. سياسة الرسائل الخاصة الافتراضية في WhatsApp هي **الإقران**. يحصل المرسلون غير المعروفين على رمز إقران فقط ولا تتم **معالجة** رسالتهم. لا يرد OpenClaw إلا على الدردشات التي يتلقاها أو على عمليات الإرسال الصريحة التي تشغّلها.

    وافق على الإقران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اعرض الطلبات المعلقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لتعيين **قائمة السماح/المالك** بحيث يُسمح برسائلك الخاصة. لا تُستخدم للإرسال التلقائي. إذا كنت تشغّله على رقم WhatsApp الشخصي، فاستخدم ذلك الرقم وفعّل `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، وإيقاف المهام، و"لن يتوقف"

<AccordionGroup>
  <Accordion title="كيف أمنع رسائل النظام الداخلية من الظهور في الدردشة؟">
    تظهر معظم الرسائل الداخلية أو رسائل الأدوات فقط عند تفعيل **verbose** أو **trace** أو **reasoning**
    لتلك الجلسة.

    أصلح ذلك في الدردشة التي تراها فيها:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    إذا ظلّت كثيرة الضجيج، فتحقق من إعدادات الجلسة في واجهة التحكم واضبط verbose
    على **inherit**. تأكد أيضًا من أنك لا تستخدم ملف تعريف روبوت يحتوي على `verboseDefault` مضبوطًا
    على `on` في الإعدادات.

    الوثائق: [التفكير و verbose](/ar/tools/thinking)، [الأمان](/ar/gateway/security/index#reasoning-and-verbose-output-in-groups).

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

    هذه محفزات إلغاء (وليست أوامر بشرطة مائلة).

    بالنسبة إلى العمليات الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

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

  <Accordion title='لماذا يبدو أن الروبوت "يتجاهل" الرسائل المتتابعة بسرعة؟'>
    تُوجَّه المطالبات أثناء التشغيل إلى التشغيل النشط افتراضيًا. استخدم `/queue` لاختيار سلوك التشغيل النشط:

    - `steer` - وجّه التشغيل النشط عند حد النموذج التالي
    - `followup` - ضع الرسائل في قائمة انتظار وشغّلها واحدة تلو الأخرى بعد انتهاء التشغيل الحالي
    - `collect` - ضع الرسائل المتوافقة في قائمة انتظار ورد مرة واحدة بعد انتهاء التشغيل الحالي
    - `interrupt` - ألغِ التشغيل الحالي وابدأ من جديد

    الوضع الافتراضي هو `steer`. يمكنك إضافة خيارات مثل `debounce:0.5s cap:25 drop:summarize` لأوضاع قائمة الانتظار. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما النموذج الافتراضي لـ Anthropic عند استخدام مفتاح API؟'>
    في OpenClaw، بيانات الاعتماد واختيار النموذج منفصلان. ضبط `ANTHROPIC_API_KEY` (أو تخزين مفتاح API من Anthropic في ملفات تعريف المصادقة) يفعّل المصادقة، لكن النموذج الافتراضي الفعلي هو ما تضبطه في `agents.defaults.model.primary` (على سبيل المثال، `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). إذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم يتمكن من العثور على بيانات اعتماد Anthropic في `auth-profiles.json` المتوقع للوكيل قيد التشغيل.
  </Accordion>
</AccordionGroup>

---

ما زلت عالقًا؟ اسأل في [Discord](https://discord.com/invite/clawd) أو افتح [نقاش GitHub](https://github.com/openclaw/openclaw/discussions).

## ذات صلة

- [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run) — التثبيت، الإعداد الأولي، المصادقة، الاشتراكات، الإخفاقات المبكرة
- [الأسئلة الشائعة حول النماذج](/ar/help/faq-models) — اختيار النموذج، التحويل عند الفشل، ملفات تعريف المصادقة
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) — فرز المشكلات حسب الأعراض
