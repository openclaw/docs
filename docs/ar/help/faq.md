---
read_when:
    - الإجابة عن الأسئلة الشائعة حول الإعداد، والتثبيت، وonboarding، أو دعم وقت التشغيل
    - فرز المشكلات التي يبلغ عنها المستخدمون قبل التعمق في التصحيح
summary: الأسئلة الشائعة حول إعداد OpenClaw وتهيئته واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-04-24T07:45:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ae635d7ade265e3e79d1f5489ae23034a341843bd784f68a985b18bee5bdf6f
    source_path: help/faq.md
    workflow: 15
---

إجابات سريعة بالإضافة إلى تصحيح أعمق للإعدادات الواقعية (التطوير المحلي، وVPS، والوكلاء المتعددين، وOAuth/مفاتيح API، والرجوع الاحتياطي للنموذج). لتشخيصات وقت التشغيل، راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). وللمرجع الكامل للإعداد، راجع [الإعداد](/ar/gateway/configuration).

## أول 60 ثانية إذا كان هناك شيء معطل

1. **حالة سريعة (أول فحص)**

   ```bash
   openclaw status
   ```

   ملخص محلي سريع: نظام التشغيل + التحديث، وإمكانية الوصول إلى Gateway/الخدمة، والوكلاء/الجلسات، وإعداد المزوّد + مشكلات وقت التشغيل (عندما تكون Gateway قابلة للوصول).

2. **تقرير قابل للصق (آمن للمشاركة)**

   ```bash
   openclaw status --all
   ```

   تشخيص للقراءة فقط مع ذيل السجل (بعد تنقيح الرموز المميزة).

3. **حالة العملية + المنفذ**

   ```bash
   openclaw gateway status
   ```

   يعرض وقت تشغيل المشرف مقارنةً بإمكانية الوصول عبر RPC، وعنوان URL الهدف الخاص بالفحص، وأي إعداد يُحتمل أن تكون الخدمة قد استخدمته.

4. **فحوصات متعمقة**

   ```bash
   openclaw status --deep
   ```

   يشغّل فحص سلامة مباشرًا لـ Gateway، بما في ذلك فحوصات القنوات عند الدعم
   (ويتطلب Gateway قابلة للوصول). راجع [السلامة](/ar/gateway/health).

5. **تابع أحدث سجل**

   ```bash
   openclaw logs --follow
   ```

   إذا كان RPC متوقفًا، فارجع إلى:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   سجلات الملفات منفصلة عن سجلات الخدمة؛ راجع [التسجيل](/ar/logging) و[استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

6. **شغّل doctor (إصلاحات)**

   ```bash
   openclaw doctor
   ```

   يصلح/يرحّل الإعداد/الحالة + يشغّل فحوصات السلامة. راجع [Doctor](/ar/gateway/doctor).

7. **لقطة Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   يطلب من Gateway الجارية لقطة كاملة (‏WS فقط). راجع [السلامة](/ar/gateway/health).

## البداية السريعة وإعداد التشغيل الأول

توجد أسئلة وأجوبة التشغيل الأول — التثبيت، وonboard، ومسارات المصادقة، والاشتراكات، والإخفاقات الأولية —
في [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run).

## ما هو OpenClaw؟

<AccordionGroup>
  <Accordion title="ما هو OpenClaw، في فقرة واحدة؟">
    OpenClaw هو مساعد ذكاء اصطناعي شخصي تشغله على أجهزتك الخاصة. يرد على أسطح المراسلة التي تستخدمها بالفعل (WhatsApp وTelegram وSlack وMattermost وDiscord وGoogle Chat وSignal وiMessage وWebChat، وإضافات القنوات المجمعة مثل QQ Bot) ويمكنه أيضًا تنفيذ الصوت + Canvas مباشر على المنصات المدعومة. تمثل **Gateway** مستوى التحكم الدائم التشغيل؛ أما المساعد فهو المنتج.
  </Accordion>

  <Accordion title="القيمة المقترحة">
    OpenClaw ليس "مجرد غلاف لـ Claude". إنه **مستوى تحكم local-first** يتيح لك تشغيل
    مساعد قوي على **أجهزتك الخاصة**، ويمكن الوصول إليه من تطبيقات الدردشة التي تستخدمها بالفعل، مع
    جلسات ذات حالة، وذاكرة، وأدوات - من دون تسليم التحكم في سير عملك إلى
    SaaS مستضاف.

    أبرز النقاط:

    - **أجهزتك، بياناتك:** شغّل Gateway حيثما تريد (Mac أو Linux أو VPS) واحتفظ بـ
      مساحة العمل + سجل الجلسات محليين.
    - **قنوات حقيقية، وليست صندوق رمل ويب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc،
      بالإضافة إلى الصوت المحمول وCanvas على المنصات المدعومة.
    - **غير مرتبط بنموذج واحد:** استخدم Anthropic وOpenAI وMiniMax وOpenRouter وغيرها، مع توجيه
      لكل وكيل ورجوع احتياطي.
    - **خيار محلي فقط:** شغّل نماذج محلية بحيث **يمكن أن تبقى كل البيانات على جهازك** إذا أردت.
    - **توجيه متعدد الوكلاء:** وكلاء منفصلون لكل قناة أو حساب أو مهمة، ولكل واحد منها
      مساحة عمل وافتراضيات خاصة به.
    - **مفتوح المصدر وقابل للاختراق:** افحصه، ووسّعه، واستضفه ذاتيًا من دون ارتهان لمورّد.

    الوثائق: [Gateway](/ar/gateway)، [القنوات](/ar/channels)، [متعدد الوكلاء](/ar/concepts/multi-agent)،
    [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="لقد أعددته للتو - ماذا يجب أن أفعل أولاً؟">
    مشاريع أولى جيدة:

    - بناء موقع ويب (WordPress أو Shopify أو موقع ثابت بسيط).
    - إنشاء نموذج أولي لتطبيق جوّال (مخطط، وشاشات، وخطة API).
    - تنظيم الملفات والمجلدات (تنظيف، وتسمية، ووضع وسوم).
    - ربط Gmail وأتمتة الملخصات أو المتابعات.

    يمكنه التعامل مع مهام كبيرة، لكنه يعمل بأفضل شكل عندما تقسّمها إلى مراحل
    وتستخدم الوكلاء الفرعيين للعمل المتوازي.

  </Accordion>

  <Accordion title="ما أهم خمسة استخدامات يومية لـ OpenClaw؟">
    تبدو المكاسب اليومية عادةً كالتالي:

    - **إحاطات شخصية:** ملخصات للبريد الوارد، والتقويم، والأخبار التي تهمك.
    - **البحث والصياغة:** بحث سريع، وملخصات، ومسودات أولى للرسائل أو المستندات.
    - **التذكيرات والمتابعات:** تنبيهات وقوائم تحقق تقودها Cron أو Heartbeat.
    - **أتمتة المتصفح:** تعبئة النماذج، وجمع البيانات، وتكرار المهام على الويب.
    - **التنسيق عبر الأجهزة:** أرسل مهمة من هاتفك، ودع Gateway تشغّلها على خادم، ثم استلم النتيجة في الدردشة.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw المساعدة في توليد العملاء المحتملين، والتواصل، والإعلانات، والمدونات لـ SaaS؟">
    نعم فيما يتعلق بـ **البحث، والتأهيل، والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات للتواصل أو نصوص الإعلانات.

    أما بالنسبة إلى **التواصل أو تشغيل الإعلانات**، فأبقِ إنسانًا في الحلقة. تجنّب الرسائل غير المرغوب فيها، واتبع القوانين المحلية و
    سياسات المنصات، وراجع أي شيء قبل إرساله. وأكثر الأنماط أمانًا هو أن يدع
    OpenClaw المسودة لك ثم توافق أنت عليها.

    الوثائق: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما المزايا مقارنةً بـ Claude Code لتطوير الويب؟">
    OpenClaw هو **مساعد شخصي** وطبقة تنسيق، وليس بديلًا عن بيئة تطوير متكاملة. استخدم
    Claude Code أو Codex لأسرع حلقة ترميز مباشرة داخل مستودع. واستخدم OpenClaw عندما
    تريد ذاكرة دائمة، ووصولًا عبر الأجهزة، وتنسيقًا للأدوات.

    المزايا:

    - **ذاكرة + مساحة عمل مستمرة** عبر الجلسات
    - **وصول متعدد المنصات** (WhatsApp وTelegram وTUI وWebChat)
    - **تنسيق الأدوات** (المتصفح، والملفات، والجدولة، وHooks)
    - **Gateway دائمة التشغيل** (شغّلها على VPS، وتفاعل معها من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/التنفيذ المحلي

    معرض الأعمال: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="كيف أخصص Skills من دون إبقاء المستودع متسخًا؟">
    استخدم التجاوزات المُدارة بدلًا من تعديل نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدًا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). ترتيب الأولوية هو `<workspace>/skills` ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← المجمّع ← `skills.load.extraDirs`، لذا فإن التجاوزات المُدارة لا تزال تتغلب على Skills المجمعة من دون لمس git. إذا كنت تحتاج إلى تثبيت Skill بشكل عام لكنها مرئية فقط لبعض الوكلاء، فأبقِ النسخة المشتركة في `~/.openclaw/skills` وتحكم في الظهور عبر `agents.defaults.skills` و`agents.list[].skills`. أما التعديلات الجديرة بالإرسال إلى الأصل فقط فينبغي أن تعيش في المستودع وتخرج على شكل PRs.
  </Accordion>

  <Accordion title="هل يمكنني تحميل Skills من مجلد مخصص؟">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (أدنى أولوية). ترتيب الأولوية الافتراضي هو `<workspace>/skills` ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← المجمّع ← `skills.load.extraDirs`. يقوم `clawhub` بالتثبيت في `./skills` افتراضيًا، ويتعامل OpenClaw معها بوصفها `<workspace>/skills` في الجلسة التالية. وإذا كان يجب أن تكون Skill مرئية فقط لوكلاء محددين، فاقرن ذلك مع `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="كيف يمكنني استخدام نماذج مختلفة لمهام مختلفة؟">
    الأنماط المدعومة اليوم هي:

    - **وظائف Cron**: يمكن للوظائف المعزولة ضبط تجاوز `model` لكل وظيفة.
    - **الوكلاء الفرعيون**: وجّه المهام إلى وكلاء منفصلين لديهم نماذج افتراضية مختلفة.
    - **التبديل عند الطلب**: استخدم `/model` لتبديل نموذج الجلسة الحالية في أي وقت.

    راجع [وظائف Cron](/ar/automation/cron-jobs)، و[توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="يتجمد الروبوت أثناء تنفيذ عمل ثقيل. كيف أنقل هذا الحمل؟">
    استخدم **الوكلاء الفرعيين** للمهام الطويلة أو المتوازية. يعمل الوكلاء الفرعيون في جلساتهم الخاصة،
    ويعيدون ملخصًا، ويحافظون على استجابة الدردشة الرئيسية.

    اطلب من الروبوت "spawn a sub-agent for this task" أو استخدم `/subagents`.
    استخدم `/status` في الدردشة لمعرفة ما الذي تفعله Gateway الآن (وما إذا كانت مشغولة).

    نصيحة بشأن الرموز: المهام الطويلة والوكلاء الفرعيون يستهلكون كلاهما رموزًا. إذا كانت
    التكلفة مصدر قلق، فاضبط نموذجًا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [مهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="كيف تعمل جلسات الوكيل الفرعي المرتبطة بسلاسل الرسائل على Discord؟">
    استخدم روابط سلاسل الرسائل. يمكنك ربط سلسلة رسائل Discord بوكيل فرعي أو هدف جلسة بحيث تبقى رسائل المتابعة في تلك السلسلة على تلك الجلسة المرتبطة.

    التدفق الأساسي:

    - أنشئ عبر `sessions_spawn` باستخدام `thread: true` (واختياريًا `mode: "session"` للمتابعة المستمرة).
    - أو اربط يدويًا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الربط.
    - استخدم `/session idle <duration|off>` و`/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل السلسلة.

    الإعداد المطلوب:

    - الافتراضيات العامة: `session.threadBindings.enabled`، و`session.threadBindings.idleHours`، و`session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: ‏`channels.discord.threadBindings.enabled`، و`channels.discord.threadBindings.idleHours`، و`channels.discord.threadBindings.maxAgeHours`.
    - الربط التلقائي عند الإنشاء: اضبط `channels.discord.threadBindings.spawnSubagentSessions: true`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع الإعداد](/ar/gateway/configuration-reference)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="انتهى وكيل فرعي، لكن تحديث الاكتمال ذهب إلى المكان الخطأ أو لم يُنشر مطلقًا. ما الذي يجب أن أتحقق منه؟">
    تحقّق أولًا من مسار الطالب المحلول:

    - يفضّل تسليم الوكيل الفرعي في وضع الاكتمال أي مسار سلسلة رسائل أو محادثة مرتبط عندما يكون موجودًا.
    - إذا كان أصل الاكتمال يحمل قناة فقط، يرجع OpenClaw إلى المسار المخزن في جلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) بحيث يظل التسليم المباشر ممكنًا.
    - إذا لم يوجد لا مسار مرتبط ولا مسار مخزن قابل للاستخدام، فقد يفشل التسليم المباشر وتعود النتيجة إلى تسليم الجلسة الموضوع في الطابور بدلًا من النشر الفوري إلى الدردشة.
    - لا تزال الأهداف غير الصالحة أو القديمة قادرة على فرض الرجوع الاحتياطي إلى الطابور أو فشل التسليم النهائي.
    - إذا كان آخر رد مرئي للمساعد من الطفل هو الرمز الصامت المطابق تمامًا `NO_REPLY` / `no_reply`، أو `ANNOUNCE_SKIP` تمامًا، فإن OpenClaw يقمع الإعلان عمدًا بدلًا من نشر تقدم أقدم قديم.
    - إذا انتهت مهلة الطفل بعد استدعاءات أدوات فقط، فقد يختزل الإعلان ذلك إلى ملخص قصير للتقدم الجزئي بدلًا من إعادة عرض مخرجات الأدوات الخام.

    التصحيح:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [مهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron أو التذكيرات لا تعمل. ما الذي يجب أن أتحقق منه؟">
    تعمل Cron داخل عملية Gateway. إذا لم تكن Gateway تعمل باستمرار،
    فلن تعمل الوظائف المجدولة.

    قائمة التحقق:

    - تأكد من تفعيل Cron (`cron.enabled`) ومن أن `OPENCLAW_SKIP_CRON` غير مضبوط.
    - تحقق من أن Gateway تعمل 24/7 (من دون سكون/إعادة تشغيل).
    - تحقق من إعدادات المنطقة الزمنية للوظيفة (`--tz` مقابل المنطقة الزمنية للمضيف).

    التصحيح:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="تم تشغيل Cron، لكن لم يُرسل شيء إلى القناة. لماذا؟">
    تحقّق أولًا من وضع التسليم:

    - تعني `--no-deliver` / `delivery.mode: "none"` أنه لا يُتوقع أي إرسال احتياطي من المشغّل.
    - يعني غياب هدف إعلان (`channel` / `to`) أو كونه غير صالح أن المشغّل تخطى التسليم الصادر.
    - تعني أعطال مصادقة القناة (`unauthorized`، `Forbidden`) أن المشغّل حاول التسليم لكن بيانات الاعتماد منعته.
    - تُعامل النتيجة المعزولة الصامتة (`NO_REPLY` / `no_reply` فقط) على أنها غير قابلة للتسليم عمدًا، لذا يقوم المشغّل أيضًا بقمع تسليم الرجوع الاحتياطي الموضوع في الطابور.

    بالنسبة إلى وظائف Cron المعزولة، لا يزال الوكيل قادرًا على الإرسال مباشرةً باستخدام أداة `message`
    عندما يكون مسار الدردشة متاحًا. يتحكم `--announce` فقط في مسار الرجوع الاحتياطي للمشغّل
    فيما يتعلق بالنص النهائي الذي لم يكن الوكيل قد أرسله بالفعل.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [مهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="لماذا قام تشغيل Cron معزول بتبديل النماذج أو إعادة المحاولة مرة واحدة؟">
    يكون ذلك عادةً مسار تبديل النموذج المباشر، وليس جدولة مكررة.

    يمكن لـ Cron المعزول تثبيت عملية تسليم نموذج أثناء التشغيل وإعادة المحاولة عندما
    يرمي التشغيل النشط الخطأ `LiveSessionModelSwitchError`. وتُبقي إعادة المحاولة
    المزوّد/النموذج اللذين تم التبديل إليهما، وإذا حمل التبديل معه تجاوزًا جديدًا لملف تعريف المصادقة، فإن Cron
    يثبّت ذلك أيضًا قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يفوز تجاوز نموذج Gmail hook أولًا عند انطباقه.
    - ثم `model` الخاصة بكل وظيفة.
    - ثم أي تجاوز مخزن لنموذج جلسة Cron.
    - ثم اختيار النموذج العادي الافتراضي للوكيل.

    تكون حلقة إعادة المحاولة محدودة. بعد المحاولة الأولية بالإضافة إلى محاولتي تبديل،
    تقوم Cron بالإلغاء بدلًا من الدوران إلى ما لا نهاية.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [Cron CLI](/ar/cli/cron).

  </Accordion>

  <Accordion title="كيف أثبّت Skills على Linux؟">
    استخدم أوامر `openclaw skills` الأصلية أو ضع Skills في مساحة عملك. واجهة Skills في macOS غير متاحة على Linux.
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
    لمساحة العمل النشطة. ثبّت CLI المنفصل الخاص بـ `clawhub` فقط إذا كنت تريد نشر
    Skills الخاصة بك أو مزامنتها. وبالنسبة إلى التثبيتات المشتركة عبر الوكلاء، ضع Skill ضمن
    `~/.openclaw/skills` واستخدم `agents.defaults.skills` أو
    `agents.list[].skills` إذا كنت تريد تضييق الوكلاء الذين يمكنهم رؤيتها.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw تشغيل المهام وفق جدول زمني أو باستمرار في الخلفية؟">
    نعم. استخدم مجدول Gateway:

    - **وظائف Cron** للمهام المجدولة أو المتكررة (وتستمر عبر إعادة التشغيل).
    - **Heartbeat** للفحوصات الدورية الخاصة بـ "الجلسة الرئيسية".
    - **الوظائف المعزولة** للوكلاء المستقلين الذين ينشرون ملخصات أو يرسلون إلى الدردشات.

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills خاصة بـ Apple macOS فقط من Linux؟">
    ليس مباشرةً. تخضع Skills الخاصة بـ macOS للبوابة عبر `metadata.openclaw.os` بالإضافة إلى الملفات التنفيذية المطلوبة، ولا تظهر Skills في system prompt إلا عندما تكون مؤهلة على **مضيف Gateway**. وعلى Linux، لن يتم تحميل Skills الخاصة بـ `darwin` فقط (مثل `apple-notes` و`apple-reminders` و`things-mac`) إلا إذا تجاوزت البوابة.

    لديك ثلاثة أنماط مدعومة:

    **الخيار A - شغّل Gateway على Mac (الأبسط).**
    شغّل Gateway حيث توجد الملفات التنفيذية الخاصة بـ macOS، ثم اتصل من Linux في [الوضع البعيد](#gateway-ports-already-running-and-remote-mode) أو عبر Tailscale. سيتم تحميل Skills بشكل طبيعي لأن مضيف Gateway هو macOS.

    **الخيار B - استخدم macOS Node (من دون SSH).**
    شغّل Gateway على Linux، ثم اقترن مع macOS Node (تطبيق شريط القوائم)، واضبط **Node Run Commands** على "Always Ask" أو "Always Allow" على الـ Mac. يمكن لـ OpenClaw التعامل مع Skills الخاصة بـ macOS فقط على أنها مؤهلة عندما تكون الملفات التنفيذية المطلوبة موجودة على العقدة. ويشغّل الوكيل تلك Skills عبر أداة `nodes`. وإذا اخترت "Always Ask"، فإن اعتماد "Always Allow" في المطالبة يضيف هذا الأمر إلى قائمة السماح.

    **الخيار C - مرّر ملفات macOS التنفيذية عبر SSH (متقدم).**
    أبقِ Gateway على Linux، لكن اجعل الملفات التنفيذية المطلوبة في CLI تُحل إلى أغلفة SSH تُشغّل على Mac. ثم تجاوز Skill للسماح بـ Linux بحيث تبقى مؤهلة.

    1. أنشئ غلاف SSH للملف التنفيذي (مثال: `memo` لـ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ضع الغلاف على `PATH` على مضيف Linux (مثلًا `~/bin/memo`).
    3. تجاوز بيانات تعريف Skill (في مساحة العمل أو `~/.openclaw/skills`) للسماح بـ Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. ابدأ جلسة جديدة حتى يتم تحديث لقطة Skills.

  </Accordion>

  <Accordion title="هل لديكم تكامل مع Notion أو HeyGen؟">
    ليس مدمجًا اليوم.

    الخيارات:

    - **Skill / Plugin مخصص:** الأفضل للوصول الموثوق إلى API (لكل من Notion وHeyGen واجهات API).
    - **أتمتة المتصفح:** تعمل من دون برمجة لكنها أبطأ وأكثر هشاشة.

    إذا كنت تريد الاحتفاظ بالسياق لكل عميل (في سير عمل الوكالات)، فهناك نمط بسيط هو:

    - صفحة Notion واحدة لكل عميل (السياق + التفضيلات + العمل النشط).
    - اطلب من الوكيل جلب تلك الصفحة في بداية الجلسة.

    وإذا كنت تريد تكاملًا أصليًا، فافتح طلب ميزة أو أنشئ Skill
    تستهدف تلك الواجهات البرمجية.

    تثبيت Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تنزل التثبيتات الأصلية في دليل `skills/` الخاص بمساحة العمل النشطة. وبالنسبة إلى Skills المشتركة عبر الوكلاء، ضعها في `~/.openclaw/skills/<name>/SKILL.md`. وإذا كان يجب أن ترى بعض الوكلاء فقط تثبيتًا مشتركًا، فاضبط `agents.defaults.skills` أو `agents.list[].skills`. تتوقع بعض Skills وجود ملفات تنفيذية مثبتة عبر Homebrew؛ وعلى Linux يعني ذلك Linuxbrew (راجع إدخال الأسئلة الشائعة الخاص بـ Homebrew على Linux أعلاه). راجع [Skills](/ar/tools/skills)، و[إعداد Skills](/ar/tools/skills-config)، و[ClawHub](/ar/tools/clawhub).

  </Accordion>

  <Accordion title="كيف أستخدم Chrome الموقع الدخول إليه مسبقًا مع OpenClaw؟">
    استخدم ملف تعريف المتصفح المدمج `user`، الذي يرتبط عبر Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    وإذا كنت تريد اسمًا مخصصًا، فأنشئ ملف تعريف MCP صريحًا:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    يمكن لهذا المسار استخدام متصفح المضيف المحلي أو Browser Node متصلة. وإذا كانت Gateway تعمل في مكان آخر، فشغّل مضيف Node على جهاز المتصفح أو استخدم CDP بعيدًا بدلًا من ذلك.

    الحدود الحالية لـ `existing-session` / `user`:

    - الإجراءات تعتمد على المراجع، لا على محددات CSS
    - تتطلب عمليات الرفع `ref` / `inputRef` وتدعم حاليًا ملفًا واحدًا في كل مرة
    - لا تزال `responsebody`، وتصدير PDF، واعتراض التنزيل، والإجراءات الدفعية تحتاج إلى متصفح مُدار أو ملف تعريف CDP خام

  </Accordion>
</AccordionGroup>

## Sandboxing والذاكرة

<AccordionGroup>
  <Accordion title="هل توجد وثيقة مخصصة عن sandboxing؟">
    نعم. راجع [Sandboxing](/ar/gateway/sandboxing). وبالنسبة إلى إعداد Docker تحديدًا (Gateway كاملة داخل Docker أو صور sandbox)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدودًا - كيف أفعّل الميزات الكاملة؟">
    الصورة الافتراضية تركز على الأمان أولًا وتعمل كمستخدم `node`، لذلك فهي لا
    تتضمن حزم نظام، أو Homebrew، أو متصفحات مجمّعة. ولإعداد أكثر اكتمالًا:

    - اجعل `/home/node` مستمرًا باستخدام `OPENCLAW_HOME_VOLUME` حتى تبقى الذاكرات المؤقتة.
    - ضمّن تبعيات النظام في الصورة باستخدام `OPENCLAW_DOCKER_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المجمعة:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - اضبط `PLAYWRIGHT_BROWSERS_PATH` وتأكد من أن المسار مستمر.

    الوثائق: [Docker](/ar/install/docker)، [Browser](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل المباشرة شخصية، لكن جعل المجموعات عامة/ضمن sandbox باستخدام وكيل واحد؟">
    نعم — إذا كانت الحركة الخاصة لديك هي **الرسائل المباشرة** وكانت الحركة العامة لديك هي **المجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` بحيث تعمل جلسات المجموعة/القناة (المفاتيح غير الرئيسية) في الواجهة الخلفية لـ sandbox المهيأة، بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. وتكون Docker هي الواجهة الخلفية الافتراضية إذا لم تختر واحدة. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال على الإعداد: [المجموعات: رسائل مباشرة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع الإعداد الأساسي: [إعداد Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلدًا من المضيف داخل sandbox؟">
    اضبط `agents.defaults.sandbox.docker.binds` على `["host:path:mode"]` (مثل `"/home/user/src:/src:ro"`). يتم دمج الروابط العامة + الروابط الخاصة بكل وكيل؛ ويتم تجاهل الروابط الخاصة بكل وكيل عندما تكون `scope: "shared"`. استخدم `:ro` لكل شيء حساس وتذكر أن الروابط تتجاوز جدران نظام ملفات sandbox.

    يتحقق OpenClaw من مصادر الربط في مقابل كل من المسار الموحّد والمسار المرجعي الذي يتم حله عبر أعمق سلف موجود. وهذا يعني أن عمليات الهروب عبر الآباء الرمزيين لا تزال تفشل بشكل مغلق حتى عندما لا يكون آخر جزء من المسار موجودًا بعد، كما أن فحوصات الجذر المسموح به تظل منطبقة بعد حل الروابط الرمزية.

    راجع [Sandboxing](/ar/gateway/sandboxing#custom-bind-mounts) و[Sandbox مقابل سياسة الأداة مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للاطلاع على الأمثلة وملاحظات الأمان.

  </Accordion>

  <Accordion title="كيف تعمل الذاكرة؟">
    ذاكرة OpenClaw ليست إلا ملفات Markdown في مساحة عمل الوكيل:

    - ملاحظات يومية في `memory/YYYY-MM-DD.md`
    - ملاحظات طويلة الأمد منسقة في `MEMORY.md` (للجلسات الرئيسية/الخاصة فقط)

    يشغّل OpenClaw أيضًا **تفريغ ذاكرة صامتًا قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction التلقائي. ولا يعمل هذا إلا عندما تكون مساحة العمل
    قابلة للكتابة (وتتخطاه sandboxes للقراءة فقط). راجع [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="تستمر الذاكرة في نسيان الأشياء. كيف أجعلها ثابتة؟">
    اطلب من الروبوت أن **يكتب الحقيقة إلى الذاكرة**. تنتمي الملاحظات طويلة الأمد إلى `MEMORY.md`،
    بينما يذهب السياق قصير الأمد إلى `memory/YYYY-MM-DD.md`.

    ما زال هذا مجالًا نعمل على تحسينه. ومن المفيد تذكير النموذج بتخزين الذكريات؛
    فهو سيعرف ما ينبغي فعله. وإذا استمر في النسيان، فتحقق من أن Gateway تستخدم
    مساحة العمل نفسها في كل تشغيل.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تستمر الذاكرة إلى الأبد؟ ما الحدود؟">
    تعيش ملفات الذاكرة على القرص وتستمر حتى تحذفها. والحد هنا هو
    مساحة التخزين، وليس النموذج. أما **سياق الجلسة** فلا يزال محدودًا بنافذة
    سياق النموذج، لذلك قد تخضع المحادثات الطويلة لـ Compaction أو الاقتطاع. ولهذا
    السبب يوجد البحث في الذاكرة — فهو يعيد فقط الأجزاء ذات الصلة إلى السياق.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب البحث الدلالي في الذاكرة مفتاح OpenAI API؟">
    نعم فقط إذا كنت تستخدم **تضمينات OpenAI**. تغطي مصادقة Codex ‏chat/completions
    لكنها **لا** تمنح وصولًا إلى التضمينات، لذا فإن **تسجيل الدخول عبر Codex (OAuth أو
    تسجيل دخول Codex CLI)** لا يفيد في البحث الدلالي في الذاكرة. ولا تزال تضمينات OpenAI
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تضبط مزودًا صراحةً، يختار OpenClaw مزودًا تلقائيًا عندما
    يستطيع حل مفتاح API (ملفات تعريف المصادقة، أو `models.providers.*.apiKey`، أو متغيرات env).
    وهو يفضل OpenAI إذا أمكن حل مفتاح OpenAI، وإلا Gemini إذا
    أمكن حل مفتاح Gemini، ثم Voyage، ثم Mistral. وإذا لم يكن هناك مفتاح بعيد متاح،
    يبقى البحث في الذاكرة معطلًا حتى تضبطه. وإذا كانت لديك تهيئة لمسار نموذج محلي
    وكانت موجودة، فإن OpenClaw
    يفضل `local`. كما أن Ollama مدعوم عندما تضبط صراحةً
    `memorySearch.provider = "ollama"`.

    إذا كنت تفضل البقاء محليًا، فاضبط `memorySearch.provider = "local"` (واختياريًا
    `memorySearch.fallback = "none"`). وإذا كنت تريد تضمينات Gemini، فاضبط
    `memorySearch.provider = "gemini"` ووفّر `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). نحن ندعم نماذج التضمين الخاصة بـ **OpenAI وGemini وVoyage وMistral وOllama أو local**
    — راجع [الذاكرة](/ar/concepts/memory) لمعرفة تفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## أين توجد الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل تُحفَظ كل البيانات المستخدمة مع OpenClaw محليًا؟">
    لا — **حالة OpenClaw محلية**، لكن **الخدمات الخارجية لا تزال ترى ما ترسله إليها**.

    - **محلية افتراضيًا:** تعيش الجلسات، وملفات الذاكرة، والإعداد، ومساحة العمل على مضيف Gateway
      (`~/.openclaw` + دليل مساحة العمل الخاص بك).
    - **بعيدة بحكم الضرورة:** تذهب الرسائل التي ترسلها إلى مزوّدي النماذج (Anthropic/OpenAI/إلخ) إلى
      واجهات API الخاصة بهم، كما تخزّن منصات الدردشة (WhatsApp/Telegram/Slack/إلخ) بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في البصمة:** يؤدي استخدام النماذج المحلية إلى إبقاء المطالبات على جهازك، لكن
      حركة القنوات لا تزال تمر عبر خوادم القناة نفسها.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    كل شيء يعيش تحت `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | المسار | الغرض |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json` | الإعداد الرئيسي (JSON5) |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json` | استيراد OAuth القديم (يتم نسخه إلى ملفات تعريف المصادقة عند أول استخدام) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات تعريف المصادقة (OAuth، ومفاتيح API، و`keyRef`/`tokenRef` الاختيارية) |
    | `$OPENCLAW_STATE_DIR/secrets.json` | حمولة أسرار اختيارية مدعومة بالملفات لمزوّدي `file` من نوع SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json` | ملف توافق قديم (مع تنظيف إدخالات `api_key` الثابتة) |
    | `$OPENCLAW_STATE_DIR/credentials/` | حالة المزوّد (مثل `whatsapp/<accountId>/creds.json`) |
    | `$OPENCLAW_STATE_DIR/agents/` | حالة لكل وكيل (agentDir + الجلسات) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/` | سجل المحادثات والحالة (لكل وكيل) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json` | بيانات تعريف الجلسة (لكل وكيل) |

    المسار القديم لوكيل واحد: `~/.openclaw/agent/*` (يتم ترحيله بواسطة `openclaw doctor`).

    تكون **مساحة العمل** الخاصة بك (`AGENTS.md`، وملفات الذاكرة، وSkills، وما إلى ذلك) منفصلة وتُضبط عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    تعيش هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: ‏`AGENTS.md` و`SOUL.md` و`IDENTITY.md` و`USER.md`،
      و`MEMORY.md`، و`memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` الاختياري.
      يكون `memory.md` الصغير في الجذر مدخل إصلاح قديم فقط؛ ويمكن لـ `openclaw doctor --fix`
      دمجه في `MEMORY.md` عندما يوجد الملفان معًا.
    - **دليل الحالة (`~/.openclaw`)**: الإعداد، وحالة القنوات/المزوّدين، وملفات تعريف المصادقة، والجلسات، والسجلات،
      وSkills المشتركة (`~/.openclaw/skills`).

    مساحة العمل الافتراضية هي `~/.openclaw/workspace`، ويمكن ضبطها عبر:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    إذا كان الروبوت "ينسى" بعد إعادة التشغيل، فتأكد من أن Gateway تستخدم
    مساحة العمل نفسها في كل تشغيل (وتذكر: يستخدم الوضع البعيد مساحة عمل **مضيف Gateway**
    وليس حاسوبك المحمول المحلي).

    نصيحة: إذا كنت تريد سلوكًا أو تفضيلًا دائمًا، فاطلب من الروبوت أن **يكتبه في
    AGENTS.md أو MEMORY.md** بدلًا من الاعتماد على سجل الدردشة.

    راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) و[الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="إستراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** في مستودع git **خاص** واحتفِظ بنسخة احتياطية منه في مكان
    خاص (مثل GitHub الخاص). يلتقط هذا الذاكرة + ملفات AGENTS/SOUL/USER،
    ويتيح لك استعادة "عقل" المساعد لاحقًا.

    **لا** تُجرِ commit لأي شيء تحت `~/.openclaw` (بيانات الاعتماد، أو الجلسات، أو الرموز المميزة، أو حمولات الأسرار المشفرة).
    وإذا كنت تحتاج إلى استعادة كاملة، فانسخ احتياطيًا كلًا من مساحة العمل ودليل الحالة
    بشكل منفصل (راجع سؤال الترحيل أعلاه).

    الوثائق: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف أزيل OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إلغاء التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. تمثل مساحة العمل **cwd الافتراضية** ومرساة الذاكرة، وليست sandbox صارمة.
    تُحل المسارات النسبية داخل مساحة العمل، لكن المسارات المطلقة يمكنها الوصول إلى
    مواقع أخرى على المضيف ما لم يكن sandboxing مفعّلًا. وإذا كنت تحتاج إلى العزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات sandbox لكل وكيل. وإذا كنت
    تريد أن يكون المستودع هو دليل العمل الافتراضي، فوجه `workspace`
    الخاصة بذلك الوكيل إلى جذر المستودع. مستودع OpenClaw هو مجرد شيفرة مصدرية؛ أبقِ
    مساحة العمل منفصلة ما لم تكن تريد عمدًا أن يعمل الوكيل داخلها.

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
    تمتلك **مضيف Gateway** حالة الجلسة. إذا كنت في الوضع البعيد، فإن مخزن الجلسات الذي يهمك يوجد على الجهاز البعيد، وليس على حاسوبك المحمول المحلي. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>
</AccordionGroup>

## أساسيات الإعداد

<AccordionGroup>
  <Accordion title="ما تنسيق الإعداد؟ وأين يوجد؟">
    يقرأ OpenClaw إعدادًا اختياريًا بصيغة **JSON5** من `$OPENCLAW_CONFIG_PATH` (الافتراضي: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    إذا كان الملف مفقودًا، فإنه يستخدم افتراضيات آمنة نسبيًا (بما في ذلك مساحة عمل افتراضية هي `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='لقد ضبطت gateway.bind: "lan" (أو "tailnet") والآن لا شيء يستمع / واجهة المستخدم تقول unauthorized'>
    تتطلب الروابط غير التابعة لـ loopback **مسار مصادقة صالحًا لـ Gateway**. وهذا يعني عمليًا:

    - مصادقة السر المشترك: رمز مميز أو كلمة مرور
    - `gateway.auth.mode: "trusted-proxy"` خلف وكيل عكسي مدرك للهوية ومُضبط بشكل صحيح على غير loopback

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

    - لا يؤدي `gateway.remote.token` / `.password` إلى تفعيل مصادقة Gateway المحلية بمفردهما.
    - يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كرجوع احتياطي فقط عندما تكون `gateway.auth.*` غير مضبوطة.
    - بالنسبة إلى مصادقة كلمة المرور، اضبط `gateway.auth.mode: "password"` بالإضافة إلى `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`) بدلًا من ذلك.
    - إذا كانت `gateway.auth.token` / `gateway.auth.password` مهيأة صراحةً عبر SecretRef وغير محلولة، يفشل الحل بشكل مغلق (من دون إخفاء التراجع الاحتياطي البعيد).
    - تقوم إعدادات Control UI ذات السر المشترك بالمصادقة عبر `connect.params.auth.token` أو `connect.params.auth.password` (المخزنة في إعدادات التطبيق/واجهة المستخدم). أما الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy` فتستخدم ترويسات الطلب بدلًا من ذلك. تجنب وضع الأسرار المشتركة في عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، لا تزال الوكلاء العكسية على المضيف نفسه عبر loopback **لا** تلبّي مصادقة trusted-proxy. يجب أن يكون trusted proxy مصدرًا مهيأً على غير loopback.

  </Accordion>

  <Accordion title="لماذا أحتاج إلى رمز مميز على localhost الآن؟">
    يفرض OpenClaw مصادقة Gateway افتراضيًا، بما في ذلك loopback. وفي المسار الافتراضي العادي يعني هذا مصادقة token: إذا لم يتم تهيئة مسار مصادقة صريح، فإن بدء تشغيل Gateway يُحل إلى وضع token ويولّد واحدًا تلقائيًا، ويحفظه في `gateway.auth.token`، لذا **يجب على عملاء WS المحليين المصادقة**. وهذا يمنع العمليات المحلية الأخرى من استدعاء Gateway.

    إذا كنت تفضل مسار مصادقة مختلفًا، فيمكنك اختيار وضع كلمة المرور صراحةً (أو، بالنسبة إلى الوكلاء العكسيين غير التابعين لـ loopback والمدركين للهوية، `trusted-proxy`). وإذا كنت **حقًا** تريد loopback مفتوحًا، فاضبط `gateway.auth.mode: "none"` صراحةً في إعدادك. ويمكن لـ Doctor توليد رمز مميز لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب أن أعيد التشغيل بعد تغيير الإعداد؟">
    تراقب Gateway الإعداد وتدعم إعادة التحميل الفوري:

    - `gateway.reload.mode: "hybrid"` (الافتراضي): يطبق التغييرات الآمنة فوريًا، ويعيد التشغيل للتغييرات الحرجة
    - كما أن `hot` و`restart` و`off` مدعومة أيضًا

  </Accordion>

  <Accordion title="كيف أعطل العبارات المرحة في CLI؟">
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

    - `off`: يخفي نص العبارة مع الإبقاء على سطر عنوان/إصدار الشعار.
    - `default`: يستخدم `All your chats, one OpenClaw.` في كل مرة.
    - `random`: عبارات مرحة/موسمية متناوبة (السلوك الافتراضي).
    - إذا كنت لا تريد أي شعار على الإطلاق، فاضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="كيف أفعّل web search (وweb fetch)؟">
    يعمل `web_fetch` من دون مفتاح API. أما `web_search` فيعتمد على
    المزوّد الذي اخترته:

    - يتطلب المزوّدون المدعومون عبر API مثل Brave وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وPerplexity وTavily إعداد مفتاح API المعتاد لديهم.
    - يكون Ollama Web Search بلا مفاتيح، لكنه يستخدم مضيف Ollama المهيأ لديك ويتطلب `ollama signin`.
    - يكون DuckDuckGo بلا مفاتيح، لكنه تكامل غير رسمي يعتمد على HTML.
    - يكون SearXNG بلا مفاتيح/مستضافًا ذاتيًا؛ اضبط `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

    **الموصى به:** شغّل `openclaw configure --section web` واختر مزودًا.
    بدائل متغيرات البيئة:

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

    أصبح إعداد web-search الخاص بكل مزود موجودًا الآن تحت `plugins.entries.<plugin>.config.webSearch.*`.
    ولا تزال مسارات المزوّد القديمة `tools.web.search.*` تُحمَّل مؤقتًا للتوافق، لكن لا ينبغي استخدامها في الإعدادات الجديدة.
    كما يوجد إعداد الرجوع الاحتياطي لـ Firecrawl web-fetch تحت `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم السماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - يكون `web_fetch` مفعّلًا افتراضيًا (ما لم يتم تعطيله صراحةً).
    - إذا تم حذف `tools.web.fetch.provider`، يكتشف OpenClaw تلقائيًا أول مزود رجوع احتياطي جاهز للجلب من بيانات الاعتماد المتاحة. والمزوّد المجمّع اليوم هو Firecrawl.
    - تقرأ العمليات الخدمية متغيرات env من `~/.openclaw/.env` (أو من بيئة الخدمة).

    الوثائق: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="قام config.apply بمسح إعدادي. كيف أستعيده وأتجنب ذلك؟">
    يقوم `config.apply` باستبدال **الإعداد بالكامل**. وإذا أرسلت كائنًا جزئيًا، فستتم إزالة كل
    شيء آخر.

    يحمي OpenClaw الحالي كثيرًا من عمليات الكتابة فوقية العرضية:

    - تتحقق عمليات كتابة الإعداد المملوكة لـ OpenClaw من الإعداد الكامل بعد التغيير قبل الكتابة.
    - تُرفض عمليات الكتابة غير الصالحة أو المدمرة المملوكة لـ OpenClaw وتُحفَظ كـ `openclaw.json.rejected.*`.
    - إذا أدى تعديل مباشر إلى كسر بدء التشغيل أو إعادة التحميل الفوري، فإن Gateway تستعيد آخر إعداد جيد معروف وتحفظ الملف المرفوض كـ `openclaw.json.clobbered.*`.
    - يتلقى الوكيل الرئيسي تحذيرًا عند الإقلاع بعد الاستعادة حتى لا يعيد كتابة الإعداد السيئ مرة أخرى بشكل أعمى.

    الاستعادة:

    - تحقّق من `openclaw logs --follow` بحثًا عن `Config auto-restored from last-known-good` أو `Config write rejected:` أو `config reload restored last-known-good config`.
    - افحص أحدث `openclaw.json.clobbered.*` أو `openclaw.json.rejected.*` بجانب الإعداد النشط.
    - احتفظ بالإعداد النشط المستعاد إذا كان يعمل، ثم انسخ فقط المفاتيح المقصودة مرة أخرى باستخدام `openclaw config set` أو `config.patch`.
    - شغّل `openclaw config validate` و`openclaw doctor`.
    - إذا لم يكن لديك آخر حمولة جيدة معروفة أو حمولة مرفوضة، فاستعد من نسخة احتياطية، أو أعد تشغيل `openclaw doctor` وأعد تهيئة القنوات/النماذج.
    - إذا كان هذا غير متوقع، فقدّم بلاغ خطأ وأدرج آخر إعداد معروف لديك أو أي نسخة احتياطية.
    - يمكن لوكيل برمجي محلي في كثير من الأحيان إعادة بناء إعداد عامل من السجلات أو السجل السابق.

    تجنب ذلك:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` للتعديلات التفاعلية.
    - استخدم `config.schema.lookup` أولًا عندما لا تكون متأكدًا من المسار الدقيق أو شكل الحقل؛ فهو يعيد عقدة مخطط سطحية بالإضافة إلى ملخصات الأبناء المباشرين للتعمق.
    - استخدم `config.patch` لتعديلات RPC الجزئية؛ وأبقِ `config.apply` لاستبدال الإعداد الكامل فقط.
    - إذا كنت تستخدم أداة `gateway` الخاصة بالمالك فقط من داخل تشغيل وكيل، فستظل ترفض الكتابة إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك الأسماء البديلة القديمة `tools.bash.*` التي تُوحَّد إلى مسارات exec المحمية نفسها).

    الوثائق: [Config](/ar/cli/config)، [Configure](/ar/cli/configure)، [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغّل Gateway مركزية مع عمال متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحدة** (مثل Raspberry Pi) بالإضافة إلى **nodes** و**agents**:

    - **Gateway (مركزية):** تملك القنوات (Signal/WhatsApp)، والتوجيه، والجلسات.
    - **Nodes (الأجهزة):** تتصل أجهزة Mac/iOS/Android كأجهزة طرفية وتعرض أدوات محلية (`system.run`، و`canvas`، و`camera`).
    - **Agents (العمال):** عقول/مساحات عمل منفصلة للأدوار الخاصة (مثل "Hetzner ops" أو "Personal data").
    - **Sub-agents:** تولّد عملًا في الخلفية من وكيل رئيسي عندما تريد تنفيذًا متوازيًا.
    - **TUI:** اتصل بـ Gateway وبدّل بين الوكلاء/الجلسات.

    الوثائق: [Nodes](/ar/nodes)، [الوصول البعيد](/ar/gateway/remote)، [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/ar/web/tui).

  </Accordion>

  <Accordion title="هل يمكن لمتصفح OpenClaw أن يعمل دون واجهة؟">
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

    القيمة الافتراضية هي `false` (مع واجهة). ويكون headless أكثر عرضة لإطلاق فحوصات مكافحة الروبوتات على بعض المواقع. راجع [Browser](/ar/tools/browser).

    يستخدم الوضع headless **محرك Chromium نفسه** ويعمل في معظم الأتمتة (النماذج، والنقرات، والكشط، وتسجيلات الدخول). أما الفروق الرئيسية فهي:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات الشاشة إذا كنت تحتاج إلى مرئيات).
    - تكون بعض المواقع أكثر صرامة بشأن الأتمتة في الوضع headless (CAPTCHAs، ومكافحة الروبوتات).
      فعلى سبيل المثال، غالبًا ما يحظر X/Twitter الجلسات headless.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    اضبط `browser.executablePath` على ملف Brave التنفيذي لديك (أو أي متصفح قائم على Chromium) ثم أعد تشغيل Gateway.
    راجع أمثلة الإعداد الكاملة في [Browser](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## البوابات والعقد البعيدة

<AccordionGroup>
  <Accordion title="كيف تنتقل الأوامر بين Telegram وGateway وnodes؟">
    تتم معالجة رسائل Telegram بواسطة **Gateway**. تشغّل Gateway الوكيل ثم
    تستدعي أدوات nodes عبر **Gateway WebSocket** فقط عندما تكون هناك حاجة إلى أداة عقدة:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    لا ترى Nodes حركة المزوّد الواردة؛ بل تتلقى فقط استدعاءات RPC الخاصة بالعقدة.

  </Accordion>

  <Accordion title="كيف يمكن لوكيلي الوصول إلى حاسوبي إذا كانت Gateway مستضافًا عن بُعد؟">
    الإجابة القصيرة: **اقرن حاسوبك كعقدة**. تعمل Gateway في مكان آخر، لكنها تستطيع
    استدعاء أدوات `node.*` (الشاشة، والكاميرا، والنظام) على جهازك المحلي عبر Gateway WebSocket.

    الإعداد النموذجي:

    1. شغّل Gateway على المضيف الدائم التشغيل (VPS/خادم منزلي).
    2. ضع مضيف Gateway + حاسوبك على الـ tailnet نفسها.
    3. تأكد من أن Gateway WS قابلة للوصول (ربط tailnet أو نفق SSH).
    4. افتح تطبيق macOS محليًا واتصل في وضع **Remote over SSH** (أو tailnet مباشر)
       حتى يمكنه التسجيل كعقدة.
    5. اعتمد العقدة على Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا يلزم أي جسر TCP منفصل؛ إذ تتصل العقد عبر Gateway WebSocket.

    تذكير أمني: اقتران macOS Node يسمح بتنفيذ `system.run` على ذلك الجهاز. لا
    تقرن إلا الأجهزة التي تثق بها، وراجع [الأمان](/ar/gateway/security).

    الوثائق: [Nodes](/ar/nodes)، [بروتوكول Gateway](/ar/gateway/protocol)، [الوضع البعيد على macOS](/ar/platforms/mac/remote)، [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل لكنني لا أتلقى أي ردود. ماذا الآن؟">
    تحقّق من الأساسيات:

    - تعمل Gateway: ‏`openclaw gateway status`
    - سلامة Gateway: ‏`openclaw status`
    - سلامة القناة: ‏`openclaw channels status`

    ثم تحقّق من المصادقة والتوجيه:

    - إذا كنت تستخدم Tailscale Serve، فتأكد من ضبط `gateway.auth.allowTailscale` بشكل صحيح.
    - إذا كنت تتصل عبر نفق SSH، فتأكد من أن النفق المحلي قائم ويشير إلى المنفذ الصحيح.
    - تأكد من أن قوائم السماح الخاصة بك (الرسائل المباشرة أو المجموعات) تتضمن حسابك.

    الوثائق: [Tailscale](/ar/gateway/tailscale)، [الوصول البعيد](/ar/gateway/remote)، [القنوات](/ar/channels).

  </Accordion>

  <Accordion title="هل يمكن لتثبيتين من OpenClaw التحدث إلى بعضهما (محلي + VPS)؟">
    نعم. لا يوجد جسر "bot-to-bot" مدمج، لكن يمكنك توصيل ذلك بعدة
    طرق موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يستطيع كلا الروبوتين الوصول إليها (Telegram/Slack/WhatsApp).
    دع Bot A يرسل رسالة إلى Bot B، ثم دع Bot B يرد كالمعتاد.

    **جسر CLI (عام):** شغّل نصًا برمجيًا يستدعي Gateway الأخرى باستخدام
    `openclaw agent --message ... --deliver`، مع الاستهداف إلى دردشة يستمع فيها الروبوت
    الآخر. وإذا كان أحد الروبوتات على VPS بعيد، فوجه CLI لديك إلى Gateway البعيدة تلك
    عبر SSH/Tailscale (راجع [الوصول البعيد](/ar/gateway/remote)).

    نمط مثال (شغّله من جهاز يستطيع الوصول إلى Gateway الهدف):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف حاجزًا واقيًا حتى لا يدخل الروبوتان في حلقة لا نهائية (إشارة فقط، أو قوائم سماح للقنوات،
    أو قاعدة "لا ترد على رسائل الروبوتات").

    الوثائق: [الوصول البعيد](/ar/gateway/remote)، [Agent CLI](/ar/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى VPS منفصلة لوكلاء متعددين؟">
    لا. يمكن لـ Gateway واحدة استضافة عدة وكلاء، لكل منهم مساحة عمله الخاصة، وافتراضيات النموذج،
    والتوجيه. وهذا هو الإعداد الطبيعي وهو أرخص بكثير وأبسط من تشغيل
    VPS واحدة لكل وكيل.

    استخدم VPS منفصلة فقط عندما تحتاج إلى عزل صارم (حدود أمنية) أو إلى
    إعدادات مختلفة جدًا لا تريد مشاركتها. بخلاف ذلك، أبقِ Gateway واحدة و
    استخدم عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل هناك فائدة من استخدام Node على حاسوبي المحمول الشخصي بدلًا من SSH من VPS؟">
    نعم — تمثل nodes الطريقة من الدرجة الأولى للوصول إلى حاسوبك المحمول من Gateway بعيدة، وهي
    تفتح أكثر من مجرد وصول shell. تعمل Gateway على macOS/Linux (وWindows عبر WSL2) وهي
    خفيفة الوزن (تكفي VPS صغيرة أو صندوق من فئة Raspberry Pi؛ و4 GB RAM كثيرة)، لذا فإن الإعداد
    الشائع هو مضيف دائم التشغيل بالإضافة إلى حاسوبك المحمول كعقدة.

    - **لا حاجة إلى SSH وارد.** تتصل Nodes خارجيًا بـ Gateway WebSocket وتستخدم اقتران الأجهزة.
    - **ضوابط تنفيذ أكثر أمانًا.** يتم تقييد `system.run` عبر قوائم السماح/الموافقات الخاصة بالعقدة على ذلك الحاسوب المحمول.
    - **أدوات أجهزة أكثر.** تعرض Nodes الأدوات `canvas` و`camera` و`screen` بالإضافة إلى `system.run`.
    - **أتمتة متصفح محلية.** أبقِ Gateway على VPS، لكن شغّل Chrome محليًا عبر مضيف Node على الحاسوب المحمول، أو اربط Chrome المحلي على المضيف عبر Chrome MCP.

    لا بأس باستخدام SSH للوصول العرضي إلى shell، لكن nodes أبسط لسير العمل المستمر الخاص بالوكيل
    وأتمتة الأجهزة.

    الوثائق: [Nodes](/ar/nodes)، [Nodes CLI](/ar/cli/nodes)، [Browser](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تشغّل nodes خدمة gateway؟">
    لا. يجب أن تعمل **بوابة واحدة فقط** لكل مضيف ما لم تكن تشغّل عمدًا ملفات تعريف معزولة (راجع [بوابات متعددة](/ar/gateway/multiple-gateways)). Nodes هي أجهزة طرفية تتصل
    بالبوابة (عقد iOS/Android، أو "وضع العقدة" في تطبيق شريط القوائم على macOS). وبالنسبة إلى
    مضيفات العقد عديمة الواجهة والتحكم عبر CLI، راجع [Node host CLI](/ar/cli/node).

    يتطلب `gateway` و`discovery` و`canvasHost` إعادة تشغيل كاملة عند التغيير.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق الإعداد؟">
    نعم.

    - `config.schema.lookup`: فحص شجرة فرعية واحدة من الإعداد مع عقدة المخطط السطحية الخاصة بها، وhint المطابق الخاص بواجهة المستخدم، وملخصات الأبناء المباشرين قبل الكتابة
    - `config.get`: جلب اللقطة الحالية + hash
    - `config.patch`: تحديث جزئي آمن (المفضل لمعظم تعديلات RPC)؛ يعيد التحميل الفوري عندما يكون ذلك ممكنًا ويعيد التشغيل عندما يكون ذلك مطلوبًا
    - `config.apply`: التحقق من الإعداد الكامل واستبداله؛ يعيد التحميل الفوري عندما يكون ذلك ممكنًا ويعيد التشغيل عندما يكون ذلك مطلوبًا
    - لا تزال أداة التشغيل `gateway` الخاصة بالمالك فقط ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ كما تُوحَّد الأسماء البديلة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها

  </Accordion>

  <Accordion title="إعداد أدنى معقول لأول تثبيت">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    يضبط هذا مساحة العمل لديك ويقيّد من يمكنه تشغيل الروبوت.

  </Accordion>

  <Accordion title="كيف أضبط Tailscale على VPS وأتصل منها من Mac؟">
    الخطوات الدنيا:

    1. **التثبيت + تسجيل الدخول على VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **التثبيت + تسجيل الدخول على Mac**
       - استخدم تطبيق Tailscale وسجّل الدخول إلى الـ tailnet نفسها.
    3. **فعّل MagicDNS (مستحسن)**
       - في وحدة تحكم إدارة Tailscale، فعّل MagicDNS حتى يكون لـ VPS اسم ثابت.
    4. **استخدم اسم المضيف الخاص بـ tailnet**
       - SSH: ‏`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: ‏`ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا كنت تريد Control UI من دون SSH، فاستخدم Tailscale Serve على VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    يبقي هذا Gateway مرتبطة بالـ loopback ويعرّض HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أوصل Mac Node بـ Gateway بعيدة (Tailscale Serve)؟">
    تقوم Serve بتعريض **Gateway Control UI + WS**. وتتصل Nodes عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكد من أن VPS + Mac على الـ tailnet نفسها**.
    2. **استخدم تطبيق macOS في الوضع البعيد** (يمكن أن يكون هدف SSH هو اسم مضيف tailnet).
       سيقوم التطبيق بتمرير منفذ Gateway وسيتصل كعقدة.
    3. **اعتمد العقدة** على Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    الوثائق: [بروتوكول Gateway](/ar/gateway/protocol)، [الاكتشاف](/ar/gateway/discovery)، [الوضع البعيد على macOS](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل يجب أن أثبت على حاسوب محمول ثانٍ أم أضيف Node فقط؟">
    إذا كنت تحتاج فقط إلى **أدوات محلية** (الشاشة/الكاميرا/التنفيذ) على الحاسوب المحمول الثاني، فأضفه كـ
    **Node**. فهذا يبقي Gateway واحدة ويتجنب تكرار الإعداد. أدوات العقدة المحلية
    حاليًا خاصة بـ macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    لا تثبّت Gateway ثانية إلا عندما تحتاج إلى **عزل صارم** أو إلى روبوتين منفصلين بالكامل.

    الوثائق: [Nodes](/ar/nodes)، [Nodes CLI](/ar/cli/nodes)، [بوابات متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات env وتحميل .env

<AccordionGroup>
  <Accordion title="كيف يحمّل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات env من العملية الأم (shell، وlaunchd/systemd، وCI، إلخ) ويحمّل أيضًا:

    - `.env` من دليل العمل الحالي
    - ملف `.env` احتياطي عام من `~/.openclaw/.env` (ويعرف أيضًا باسم `$OPENCLAW_STATE_DIR/.env`)

    لا يقوم أي من ملفي `.env` بالكتابة فوق متغيرات env الموجودة.

    يمكنك أيضًا تعريف متغيرات env مضمّنة في الإعداد (تُطبّق فقط إذا كانت مفقودة من env الخاصة بالعملية):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    راجع [/environment](/ar/help/environment) للاطلاع على ترتيب الأولوية الكامل والمصادر.

  </Accordion>

  <Accordion title="بدأت Gateway عبر الخدمة واختفت متغيرات env الخاصة بي. ماذا الآن؟">
    هناك إصلاحان شائعان:

    1. ضع المفاتيح المفقودة في `~/.openclaw/.env` حتى يتم التقاطها حتى عندما لا ترث الخدمة env الخاصة بـ shell لديك.
    2. فعّل استيراد shell (خيار راحة اختياري):

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

    يؤدي هذا إلى تشغيل login shell لديك واستيراد المفاتيح المتوقعة المفقودة فقط (من دون أي كتابة فوقية). مكافئات متغيرات env:
    `OPENCLAW_LOAD_SHELL_ENV=1`، و`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='لقد ضبطت COPILOT_GITHUB_TOKEN، لكن حالة النماذج تعرض "Shell env: off." لماذا؟'>
    يعرض `openclaw models status` ما إذا كان **استيراد env الخاصة بـ shell** مفعّلًا. لا يعني "Shell env: off"
    أن متغيرات env الخاصة بك مفقودة — بل يعني فقط أن OpenClaw لن يحمّل
    login shell لديك تلقائيًا.

    إذا كانت Gateway تعمل كخدمة (launchd/systemd)، فلن يرث بيئة
    shell الخاصة بك. أصلح ذلك بإحدى الطرق التالية:

    1. ضع الرمز المميز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد shell (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في إعدادك (يُطبّق فقط إذا كان مفقودًا).

    ثم أعد تشغيل gateway وتحقق مجددًا:

    ```bash
    openclaw models status
    ```

    تتم قراءة رموز Copilot من `COPILOT_GITHUB_TOKEN` (وأيضًا `GH_TOKEN` / `GITHUB_TOKEN`).
    راجع [/concepts/model-providers](/ar/concepts/model-providers) و[/environment](/ar/help/environment).

  </Accordion>
</AccordionGroup>

## الجلسات والدردشات المتعددة

<AccordionGroup>
  <Accordion title="كيف أبدأ محادثة جديدة؟">
    أرسل `/new` أو `/reset` كرسالة مستقلة. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>

  <Accordion title="هل تُعاد تعيين الجلسات تلقائيًا إذا لم أرسل /new أبدًا؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا يكون **معطّلًا افتراضيًا** (الافتراضي **0**).
    اضبطه على قيمة موجبة لتفعيل انتهاء الصلاحية بسبب الخمول. وعند التفعيل، فإن **الرسالة التالية**
    بعد فترة الخمول تبدأ معرّف جلسة جديدًا لذلك المفتاح الخاص بالدردشة.
    هذا لا يحذف النصوص — بل يبدأ فقط جلسة جديدة.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="هل هناك طريقة لإنشاء فريق من مثيلات OpenClaw (مدير تنفيذي واحد والعديد من الوكلاء)؟">
    نعم، عبر **التوجيه متعدد الوكلاء** و**الوكلاء الفرعيين**. يمكنك إنشاء وكيل
    منسق واحد وعدة وكلاء عاملين مع مساحات عمل ونماذج خاصة بهم.

    ومع ذلك، فمن الأفضل النظر إلى هذا على أنه **تجربة ممتعة**. فهو ثقيل من حيث
    استهلاك الرموز وغالبًا أقل كفاءة من استخدام روبوت واحد مع جلسات منفصلة. النموذج المعتاد الذي
    نتصوره هو روبوت واحد تتحدث إليه، مع جلسات مختلفة للعمل المتوازي. ويمكن لهذا
    الروبوت أيضًا أن ينشئ وكلاء فرعيين عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [Agents CLI](/ar/cli/agents).

  </Accordion>

  <Accordion title="لماذا تم اقتطاع السياق في منتصف المهمة؟ وكيف أمنع ذلك؟">
    يكون سياق الجلسة محدودًا بنافذة النموذج. يمكن للمحادثات الطويلة، أو مخرجات الأدوات الكبيرة، أو كثرة
    الملفات أن تشغّل Compaction أو الاقتطاع.

    ما الذي يساعد:

    - اطلب من الروبوت تلخيص الحالة الحالية وكتابتها إلى ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل الموضوعات.
    - أبقِ السياق المهم في مساحة العمل واطلب من الروبوت قراءته مجددًا.
    - استخدم الوكلاء الفرعيين للعمل الطويل أو المتوازي حتى تبقى الدردشة الرئيسية أصغر.
    - اختر نموذجًا بنافذة سياق أكبر إذا كان هذا يحدث كثيرًا.

  </Accordion>

  <Accordion title="كيف أعيد ضبط OpenClaw بالكامل مع إبقائه مثبتًا؟">
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

    - يقدّم onboarding أيضًا خيار **Reset** إذا رأى إعدادًا موجودًا. راجع [Onboarding (CLI)](/ar/start/wizard).
    - إذا كنت قد استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد تعيين كل دليل حالة (القيم الافتراضية هي `~/.openclaw-<profile>`).
    - إعادة تعيين التطوير: ‏`openclaw gateway --dev --reset` (للتطوير فقط؛ يمسح إعداد التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='أتلقى أخطاء "context too large" - كيف أعيد التعيين أو أجري Compaction؟'>
    استخدم أحد هذه الخيارات:

    - **Compaction** (يبقي المحادثة لكنه يختصر الأدوار الأقدم):

      ```
      /compact
      ```

      أو `/compact <instructions>` لتوجيه الملخص.

    - **إعادة التعيين** (معرّف جلسة جديد للمفتاح نفسه الخاص بالدردشة):

      ```
      /new
      /reset
      ```

    إذا استمر الأمر في الحدوث:

    - فعّل أو اضبط **تشذيب الجلسة** (`agents.defaults.contextPruning`) لاقتطاع مخرجات الأدوات القديمة.
    - استخدم نموذجًا بنافذة سياق أكبر.

    الوثائق: [Compaction](/ar/concepts/compaction)، [تشذيب الجلسة](/ar/concepts/session-pruning)، [إدارة الجلسات](/ar/concepts/session).

  </Accordion>

  <Accordion title='لماذا أرى الخطأ "LLM request rejected: messages.content.tool_use.input field required"؟'>
    هذا خطأ تحقق من المزوّد: فقد أطلق النموذج كتلة `tool_use` من دون
    `input` المطلوبة. ويعني هذا عادةً أن سجل الجلسة قديم أو تالف (وغالبًا بعد سلاسل طويلة
    أو بعد تغيير في الأداة/المخطط).

    الحل: ابدأ جلسة جديدة باستخدام `/new` (كرسالة مستقلة).

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

    إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (أسطر فارغة فقط وعناوين Markdown
    مثل `# Heading`)، فإن OpenClaw يتخطى تشغيل Heartbeat لتوفير استدعاءات API.
    وإذا كان الملف مفقودًا، فإن Heartbeat لا تزال تعمل ويقرر النموذج ما الذي ينبغي فعله.

    تستخدم التجاوزات لكل وكيل الحقل `agents.list[].heartbeat`. الوثائق: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل أحتاج إلى إضافة "حساب روبوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك الشخصي**، لذا إذا كنت موجودًا في المجموعة، يمكن لـ OpenClaw رؤيتها.
    افتراضيًا، تكون الردود في المجموعات محظورة حتى تسمح للمرسلين (`groupPolicy: "allowlist"`).

    إذا كنت تريد أن تكون **أنت فقط** قادرًا على تشغيل الردود في المجموعة:

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

    ابحث عن `chatId` (أو `from`) المنتهي بـ `@g.us`، مثل:
    `1234567890-1234567890@g.us`.

    الخيار 2 (إذا كانت مهيأة/موجودة بالفعل في قائمة السماح): اعرض المجموعات من الإعداد:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    الوثائق: [WhatsApp](/ar/channels/whatsapp)، [Directory](/ar/cli/directory)، [Logs](/ar/cli/logs).

  </Accordion>

  <Accordion title="لماذا لا يرد OpenClaw في مجموعة؟">
    هناك سببان شائعان:

    - تكون بوابة الإشارة مفعّلة (افتراضيًا). يجب أن تشير إلى الروبوت بـ @ (أو أن تطابق `mentionPatterns`).
    - لقد هيأت `channels.whatsapp.groups` من دون `"*"` والمجموعة ليست في قائمة السماح.

    راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشارك المجموعات/سلاسل الرسائل السياق مع الرسائل المباشرة؟">
    تُدمج الدردشات المباشرة في الجلسة الرئيسية افتراضيًا. أما المجموعات/القنوات فلها مفاتيح جلسات خاصة بها، كما أن موضوعات Telegram / سلاسل Discord هي جلسات منفصلة. راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم عدد مساحات العمل والوكلاء التي يمكنني إنشاؤها؟">
    لا توجد حدود صارمة. العشرات (بل حتى المئات) لا بأس بها، لكن انتبه إلى:

    - **نمو القرص:** تعيش الجلسات + النصوص تحت `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** المزيد من الوكلاء يعني استخدامًا متزامنًا أكبر للنموذج.
    - **أعباء التشغيل:** ملفات تعريف المصادقة، ومساحات العمل، وتوجيه القنوات لكل وكيل.

    نصائح:

    - احتفظ بمساحة عمل **نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - قم بتشذيب الجلسات القديمة (احذف JSONL أو إدخالات المخزن) إذا نما القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل الشاردة وعدم تطابق ملفات التعريف.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة روبوتات أو عدة دردشات في الوقت نفسه (Slack)، وكيف يجب أن أضبط ذلك؟">
    نعم. استخدم **التوجيه متعدد الوكلاء** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة حسب
    القناة/الحساب/النظير. Slack مدعومة كقناة ويمكن ربطها بوكلاء محددين.

    الوصول إلى المتصفح قوي لكنه ليس "افعل أي شيء يمكن لإنسان أن يفعله" — إذ لا تزال آليات مكافحة الروبوتات وCAPTCHAs وMFA قادرة على
    منع الأتمتة. ولأكثر تحكم موثوق في المتصفح، استخدم Chrome MCP المحلي على المضيف،
    أو استخدم CDP على الجهاز الذي يشغّل المتصفح فعلًا.

    إعداد أفضل الممارسات:

    - مضيف Gateway دائم التشغيل (VPS/Mac mini).
    - وكيل واحد لكل دور (bindings).
    - قناة/قنوات Slack مرتبطة بهؤلاء الوكلاء.
    - متصفح محلي عبر Chrome MCP أو Node عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [Slack](/ar/channels/slack)،
    [Browser](/ar/tools/browser)، [Nodes](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج، والرجوع الاحتياطي، وملفات تعريف المصادقة

توجد أسئلة وأجوبة النماذج — الافتراضيات، والاختيار، والأسماء البديلة، والتبديل، والرجوع الاحتياطي، وملفات تعريف المصادقة —
في [الأسئلة الشائعة للنماذج](/ar/help/faq-models).

## Gateway: المنافذ، و"already running"، والوضع البعيد

<AccordionGroup>
  <Accordion title="ما المنفذ الذي تستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ المفرد المجمّع الخاص بـ WebSocket + HTTP (Control UI، وhooks، وغير ذلك).

    ترتيب الأولوية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا يقول openclaw gateway status "Runtime: running" لكنه يعرض "Connectivity probe: failed"؟'>
    لأن "running" هو منظور **المشرف** (launchd/systemd/schtasks). أما فحص الاتصال فهو قيام CLI بالاتصال فعليًا بـ Gateway WebSocket.

    استخدم `openclaw gateway status` وثق في هذه الأسطر:

    - `Probe target:` (عنوان URL الذي استخدمه الفحص فعليًا)
    - `Listening:` (ما هو مرتبط فعليًا على المنفذ)
    - `Last gateway error:` (السبب الجذري الشائع عندما تكون العملية حية لكن المنفذ لا يستمع)

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status قيمًا مختلفة لـ "Config (cli)" و"Config (service)"؟'>
    أنت تعدّل ملف إعداد بينما تعمل الخدمة بملف آخر (وغالبًا يكون ذلك بسبب عدم تطابق `--profile` / `OPENCLAW_STATE_DIR`).

    الحل:

    ```bash
    openclaw gateway install --force
    ```

    شغّل هذا من البيئة نفسها/‏`--profile` نفسها التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ما معنى "another gateway instance is already listening"؟'>
    يفرض OpenClaw قفل تشغيل عبر ربط مستمع WebSocket مباشرة عند بدء التشغيل (الافتراضي `ws://127.0.0.1:18789`). وإذا فشل الربط مع `EADDRINUSE`، فإنه يرمي `GatewayLockError` مشيرًا إلى أن مثيلًا آخر يستمع بالفعل.

    الحل: أوقف المثيل الآخر، أو حرر المنفذ، أو شغّل باستخدام `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="كيف أشغّل OpenClaw في الوضع البعيد (يتصل العميل بـ Gateway في مكان آخر)؟">
    اضبط `gateway.mode: "remote"` ووجّه إلى عنوان URL بعيد لـ WebSocket، اختياريًا مع بيانات اعتماد بعيدة ذات سر مشترك:

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

    - لا يبدأ `openclaw gateway` إلا عندما تكون `gateway.mode` هي `local` (أو إذا مررت علامة التجاوز).
    - يراقب تطبيق macOS ملف الإعداد ويبدّل الأوضاع مباشرةً عندما تتغير هذه القيم.
    - تمثل `gateway.remote.token` / `.password` بيانات اعتماد بعيدة على جانب العميل فقط؛ ولا تفعّل مصادقة Gateway المحلية بمفردها.

  </Accordion>

  <Accordion title='تعرض Control UI الرسالة "unauthorized" (أو تستمر في إعادة الاتصال). ماذا الآن؟'>
    لا يتطابق مسار مصادقة Gateway لديك مع طريقة المصادقة في واجهة المستخدم.

    حقائق (من الشيفرة):

    - تحتفظ Control UI بالرمز المميز في `sessionStorage` لجلسة تبويب المتصفح الحالية وعنوان URL المحدد لـ Gateway، لذا يظل التحديث داخل التبويب نفسه يعمل من دون استعادة ديمومة الرمز طويل الأمد في localStorage.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة محاولة واحدة محدودة باستخدام رمز جهاز مخزّن مؤقتًا عندما تعيد Gateway تلميحات إعادة المحاولة (`canRetryWithDeviceToken=true`، `recommendedNextStep=retry_with_device_token`).
    - تعيد إعادة المحاولة هذه باستخدام الرمز المخزّن الآن استخدام النطاقات المعتمدة المخزنة مؤقتًا مع رمز الجهاز. أما من يستدعون بـ `deviceToken` صريح / `scopes` صريحة فيحتفظون بمجموعة النطاقات المطلوبة بدلًا من وراثة النطاقات المخزنة مؤقتًا.
    - خارج مسار إعادة المحاولة هذا، يكون ترتيب أولوية مصادقة الاتصال: الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز bootstrap.
    - تكون فحوصات نطاق رمز bootstrap مسبوقة بالدور. وتلبّي قائمة السماح المدمجة لمشغّل bootstrap طلبات operator فقط؛ أما أدوار node أو الأدوار الأخرى غير operator فلا تزال تحتاج إلى نطاقات تحت بادئة الدور الخاصة بها.

    الحل:

    - الأسرع: `openclaw dashboard` (يطبع عنوان URL الخاص بلوحة التحكم وينسخه ويحاول فتحه؛ ويعرض تلميح SSH إذا كان بلا واجهة).
    - إذا لم يكن لديك رمز مميز بعد: ‏`openclaw doctor --generate-gateway-token`.
    - إذا كنت في وضع بعيد، فأنشئ النفق أولًا: ‏`ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع السر المشترك: اضبط `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم الصق السر المطابق في إعدادات Control UI.
    - وضع Tailscale Serve: تأكد من أن `gateway.auth.allowTailscale` مفعّل وأنك تفتح عنوان URL الخاص بـ Serve، لا عنوان loopback/tailnet خامًا يتجاوز ترويسات هوية Tailscale.
    - وضع trusted-proxy: تأكد من أنك تمر عبر الوكيل المدرك للهوية والمهيأ على غير loopback، لا عبر وكيل loopback على المضيف نفسه أو عنوان URL خام لـ Gateway.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، فقم بتدوير/إعادة اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا قال استدعاء التدوير ذاك إنه رُفض، فتحقق من أمرين:
      - يمكن لجلسات الأجهزة المقترنة تدوير **أجهزتها** فقط ما لم تكن تملك أيضًا `operator.admin`
      - لا يمكن لقيم `--scope` الصريحة أن تتجاوز نطاقات operator الحالية لدى المتصل
    - ما زلت عالقًا؟ شغّل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [Dashboard](/ar/web/dashboard) لمعرفة تفاصيل المصادقة.

  </Accordion>

  <Accordion title="لقد ضبطت gateway.bind على tailnet لكنه لا يستطيع الربط ولا شيء يستمع">
    يختار الربط `tailnet` عنوان Tailscale IP من واجهات الشبكة لديك (‏100.64.0.0/10). وإذا لم يكن الجهاز على Tailscale (أو كانت الواجهة متوقفة)، فلن يوجد شيء يمكن الربط به.

    الحل:

    - ابدأ Tailscale على ذلك المضيف (حتى يحصل على عنوان 100.x)، أو
    - بدّل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. أما `auto` فيفضّل loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطًا على tailnet فقط.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة بوابات على المضيف نفسه؟">
    في العادة لا — يمكن لـ Gateway واحدة تشغيل عدة قنوات مراسلة ووكلاء. استخدم عدة بوابات فقط عندما تحتاج إلى تكرار احتياطي (مثل rescue bot) أو عزل صارم.

    نعم، ولكن يجب عليك عزل ما يلي:

    - `OPENCLAW_CONFIG_PATH` (إعداد لكل مثيل)
    - `OPENCLAW_STATE_DIR` (حالة لكل مثيل)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (مستحسن):

    - استخدم `openclaw --profile <name> ...` لكل مثيل (ينشئ تلقائيًا `~/.openclaw-<name>`).
    - اضبط `gateway.port` فريدًا في إعداد كل ملف تعريف (أو مرر `--port` للتشغيل اليدوي).
    - ثبّت خدمة لكل ملف تعريف: ‏`openclaw --profile <name> gateway install`.

    تضيف ملفات التعريف أيضًا لاحقات إلى أسماء الخدمات (`ai.openclaw.<profile>`؛ والقديم `com.openclaw.*`، و`openclaw-gateway-<profile>.service`، و`OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [بوابات متعددة](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ما معنى "invalid handshake" / الرمز 1008؟'>
    Gateway عبارة عن **خادم WebSocket**، ويتوقع أن تكون أول رسالة
    هي إطار `connect`. وإذا تلقى أي شيء آخر، فإنه يغلق الاتصال
    بالرمز **1008** (مخالفة للسياسة).

    الأسباب الشائعة:

    - فتحت عنوان URL الخاص بـ **HTTP** في متصفح (`http://...`) بدلًا من عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - قام وكيل أو نفق بإزالة ترويسات المصادقة أو أرسل طلبًا غير تابع لـ Gateway.

    إصلاحات سريعة:

    1. استخدم عنوان URL الخاص بـ WS: ‏`ws://<host>:18789` (أو `wss://...` إذا كان HTTPS).
    2. لا تفتح منفذ WS في تبويب متصفح عادي.
    3. إذا كانت المصادقة مفعّلة، فضمّن الرمز/كلمة المرور في إطار `connect`.

    إذا كنت تستخدم CLI أو TUI، فيجب أن يبدو عنوان URL كما يلي:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    تفاصيل البروتوكول: [بروتوكول Gateway](/ar/gateway/protocol).

  </Accordion>
</AccordionGroup>

## التسجيل والتصحيح

<AccordionGroup>
  <Accordion title="أين توجد السجلات؟">
    سجلات الملفات (منظمة):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    يمكنك ضبط مسار ثابت عبر `logging.file`. ويتم التحكم في مستوى سجل الملفات عبر `logging.level`. ويتم التحكم في تفصيل إخراج الطرفية عبر `--verbose` و`logging.consoleLevel`.

    أسرع طريقة لمتابعة السجل:

    ```bash
    openclaw logs --follow
    ```

    سجلات الخدمة/المشرف (عندما تعمل gateway عبر launchd/systemd):

    - macOS: ‏`$OPENCLAW_STATE_DIR/logs/gateway.log` و`gateway.err.log` (الافتراضي: `~/.openclaw/logs/...`؛ وتستخدم ملفات التعريف `~/.openclaw-<profile>/logs/...`)
    - Linux: ‏`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: ‏`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

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
    توجد **طريقتان للتثبيت على Windows**:

    **1) WSL2 (مستحسن):** تعمل Gateway داخل Linux.

    افتح PowerShell، وادخل إلى WSL، ثم أعد التشغيل:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا لم تكن قد ثبّتت الخدمة من قبل، فابدأها في الواجهة الأمامية:

    ```bash
    openclaw gateway run
    ```

    **2) Windows الأصلي (غير مستحسن):** تعمل Gateway مباشرة داخل Windows.

    افتح PowerShell وشغّل:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا كنت تشغّلها يدويًا (من دون خدمة)، فاستخدم:

    ```powershell
    openclaw gateway run
    ```

    الوثائق: [Windows (WSL2)](/ar/platforms/windows)، [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="Gateway تعمل لكن الردود لا تصل أبدًا. ما الذي يجب أن أتحقق منه؟">
    ابدأ بمسح سريع للسلامة:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    الأسباب الشائعة:

    - لم يتم تحميل مصادقة النموذج على **مضيف gateway** (تحقق من `models status`).
    - الاقتران/قائمة السماح الخاصة بالقناة تمنع الردود (تحقق من إعداد القناة + السجلات).
    - WebChat/Dashboard مفتوحة من دون الرمز الصحيح.

    إذا كنت في وضع بعيد، فتأكد من أن اتصال النفق/Tailscale قائم وأن
    Gateway WebSocket قابلة للوصول.

    الوثائق: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ماذا الآن؟'>
    يعني هذا عادةً أن واجهة المستخدم فقدت اتصال WebSocket. تحقّق من:

    1. هل تعمل Gateway؟ ‏`openclaw gateway status`
    2. هل Gateway سليمة؟ ‏`openclaw status`
    3. هل لدى واجهة المستخدم الرمز الصحيح؟ ‏`openclaw dashboard`
    4. إذا كنت في وضع بعيد، فهل رابط النفق/Tailscale قائم؟

    ثم تابع السجلات:

    ```bash
    openclaw logs --follow
    ```

    الوثائق: [Dashboard](/ar/web/dashboard)، [الوصول البعيد](/ar/gateway/remote)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

  </Accordion>

  <Accordion title="فشل Telegram setMyCommands. ما الذي يجب أن أتحقق منه؟">
    ابدأ بالسجلات وحالة القناة:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    ثم طابق الخطأ:

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على عدد كبير جدًا من الإدخالات. يقوم OpenClaw بالفعل بالاقتطاع إلى حد Telegram ويعيد المحاولة بعدد أقل من الأوامر، لكن لا تزال بعض إدخالات القائمة بحاجة إلى حذف. قلّل أوامر Plugin/‏Skills/الأوامر المخصصة، أو عطّل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed`، أو `Network request for 'setMyCommands' failed!`، أو أخطاء شبكة مشابهة: إذا كنت على VPS أو خلف وكيل، فتأكد من أن HTTPS الصادرة مسموح بها وأن DNS يعمل مع `api.telegram.org`.

    إذا كانت Gateway بعيدة، فتأكد من أنك تنظر إلى السجلات على مضيف Gateway.

    الوثائق: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="لا يعرض TUI أي مخرجات. ما الذي يجب أن أتحقق منه؟">
    تأكد أولًا من أن Gateway قابلة للوصول وأن الوكيل يمكنه العمل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لرؤية الحالة الحالية. وإذا كنت تتوقع ردودًا في قناة دردشة،
    فتأكد من أن التسليم مفعّل (`/deliver on`).

    الوثائق: [TUI](/ar/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway تمامًا ثم أبدأها؟">
    إذا كنت قد ثبّت الخدمة:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    يؤدي هذا إلى إيقاف/بدء **الخدمة الخاضعة للإشراف** (launchd على macOS، وsystemd على Linux).
    استخدم هذا عندما تعمل Gateway في الخلفية كخدمة دائمة.

    إذا كنت تشغّلها في الواجهة الأمامية، فأوقفها عبر Ctrl-C، ثم:

    ```bash
    openclaw gateway run
    ```

    الوثائق: [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="اشرحها لي ببساطة: openclaw gateway restart مقابل openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **الخدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغّل Gateway **في الواجهة الأمامية** لهذه الجلسة الطرفية.

    إذا كنت قد ثبّت الخدمة، فاستخدم أوامر gateway. واستخدم `openclaw gateway` عندما
    تريد تشغيلًا وحيدًا في الواجهة الأمامية.

  </Accordion>

  <Accordion title="أسرع طريقة للحصول على مزيد من التفاصيل عندما يفشل شيء ما">
    ابدأ Gateway باستخدام `--verbose` للحصول على مزيد من التفاصيل في الطرفية. ثم افحص ملف السجل بحثًا عن أخطاء مصادقة القناة، وتوجيه النموذج، وRPC.
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

    تحقّق أيضًا من:

    - أن القناة المستهدفة تدعم الوسائط الصادرة وليست محجوبة بواسطة قوائم السماح.
    - أن الملف ضمن حدود الحجم الخاصة بالمزوّد (يتم تغيير حجم الصور إلى حد أقصى 2048px).
    - تؤدي `tools.fs.workspaceOnly=true` إلى إبقاء الإرسال بالمسارات المحلية مقتصرًا على مساحة العمل وtemp/media-store والملفات المتحقق منها عبر sandbox.
    - تسمح `tools.fs.workspaceOnly=false` لعملية `MEDIA:` بإرسال الملفات المحلية على المضيف التي يستطيع الوكيل قراءتها بالفعل، لكن فقط للوسائط وأنواع المستندات الآمنة (الصور، والصوت، والفيديو، وPDF، ومستندات Office). ولا تزال الملفات النصية العادية والملفات الشبيهة بالأسرار محظورة.

    راجع [الصور](/ar/nodes/images).

  </Accordion>
</AccordionGroup>

## الأمان والتحكم في الوصول

<AccordionGroup>
  <Accordion title="هل من الآمن تعريض OpenClaw لرسائل مباشرة واردة؟">
    تعامل مع الرسائل المباشرة الواردة على أنها مدخلات غير موثوقة. وقد صُممت الإعدادات الافتراضية لتقليل المخاطر:

    - السلوك الافتراضي على القنوات القادرة على الرسائل المباشرة هو **الاقتران**:
      - يتلقى المرسلون غير المعروفين رمز اقتران؛ ولا يعالج الروبوت رسالتهم.
      - وافق باستخدام: ‏`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - يتم تقييد الطلبات المعلقة عند **3 لكل قناة**؛ افحص `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل الرمز.
    - يتطلب فتح الرسائل المباشرة للعامة اشتراكًا صريحًا (`dmPolicy: "open"` وقائمة السماح `"*"`).

    شغّل `openclaw doctor` لإظهار سياسات الرسائل المباشرة الخطرة.

  </Accordion>

  <Accordion title="هل يُعد prompt injection مصدر قلق للروبوتات العامة فقط؟">
    لا. يتعلق prompt injection بـ **المحتوى غير الموثوق**، وليس فقط بمن يمكنه إرسال رسالة مباشرة إلى الروبوت.
    إذا كان مساعدك يقرأ محتوى خارجيًا (بحث/جلب ويب، أو صفحات متصفح، أو رسائل بريد إلكتروني،
    أو مستندات، أو مرفقات، أو سجلات ملصقة)، فقد يتضمن ذلك المحتوى تعليمات تحاول
    اختطاف النموذج. ويمكن أن يحدث هذا حتى لو كنت **أنت المرسل الوحيد**.

    تكون المخاطرة الأكبر عندما تكون الأدوات مفعّلة: إذ يمكن خداع النموذج إلى
    تسريب السياق أو استدعاء الأدوات نيابةً عنك. قلّل مساحة الضرر عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو معطّل الأدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` معطّلة للوكلاء المفعّلين بالأدوات
    - التعامل مع النصوص المفككة من الملفات/المستندات على أنها غير موثوقة أيضًا: حيث تقوم
      `input_file` في OpenResponses واستخراج النص من مرفقات الوسائط بلف النص المستخرج داخل
      علامات حد صريحة لمحتوى خارجي بدلًا من تمرير نص الملف الخام
    - استخدام sandboxing وقوائم سماح صارمة للأدوات

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يجب أن يكون للروبوت بريد إلكتروني أو حساب GitHub أو رقم هاتف خاص به؟">
    نعم، بالنسبة إلى معظم الإعدادات. إن عزل الروبوت بحسابات وأرقام هواتف منفصلة
    يقلل مساحة الضرر إذا حدث خطأ ما. كما يجعل هذا أيضًا تدوير
    بيانات الاعتماد أو إلغاء الوصول أسهل من دون التأثير في حساباتك الشخصية.

    ابدأ بشكل صغير. امنحه وصولًا فقط إلى الأدوات والحسابات التي تحتاجها فعلًا، ثم وسّع
    لاحقًا عند الحاجة.

    الوثائق: [الأمان](/ar/gateway/security)، [الاقتران](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية، وهل هذا آمن؟">
    نحن **لا** نوصي بالاستقلالية الكاملة على رسائلك الشخصية. وأكثر الأنماط أمانًا هو:

    - إبقاء الرسائل المباشرة في **وضع الاقتران** أو ضمن قائمة سماح ضيقة.
    - استخدام **رقم أو حساب منفصل** إذا كنت تريد منه أن يرسل نيابةً عنك.
    - دعْه يصوغ، ثم **وافق قبل الإرسال**.

    إذا كنت تريد التجربة، فافعل ذلك على حساب مخصص وأبقِه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل للدردشة فقط وكانت المدخلات موثوقة. تكون المستويات الأصغر
    أكثر عرضة لاختطاف التعليمات، لذا تجنبها للوكلاء المفعّلين بالأدوات
    أو عند قراءة محتوى غير موثوق. وإذا كان لا بد من استخدام نموذج أصغر، فأحكم تقييد
    الأدوات وشغّله داخل sandbox. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="شغّلت /start في Telegram لكنني لم أحصل على رمز اقتران">
    يتم إرسال رموز الاقتران **فقط** عندما يرسل مرسل غير معروف رسالة إلى الروبوت ويكون
    `dmPolicy: "pairing"` مفعّلًا. لا يؤدي `/start` وحده إلى إنشاء رمز.

    تحقّق من الطلبات المعلقة:

    ```bash
    openclaw pairing list telegram
    ```

    إذا كنت تريد وصولًا فوريًا، فأضف معرّف المرسل لديك إلى قائمة السماح أو اضبط `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيراسل جهات الاتصال الخاصة بي؟ كيف يعمل الاقتران؟">
    لا. سياسة الرسائل المباشرة الافتراضية في WhatsApp هي **الاقتران**. يحصل المرسلون غير المعروفين فقط على رمز اقتران ولا تتم **معالجة** رسالتهم. ولا يرد OpenClaw إلا على الدردشات التي يستقبلها أو على الإرسالات الصريحة التي تقوم أنت بتشغيلها.

    وافق على الاقتران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اعرض الطلبات المعلقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لضبط **قائمة السماح/المالك** الخاصة بك بحيث يُسمح برسائلك المباشرة أنت. ولا تُستخدم للإرسال التلقائي. وإذا كنت تشغّل الخدمة على رقم WhatsApp الشخصي لديك، فاستخدم ذلك الرقم وفعّل `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، وإيقاف المهام، و"لن يتوقف"

<AccordionGroup>
  <Accordion title="كيف أوقف ظهور رسائل النظام الداخلية في الدردشة؟">
    تظهر معظم الرسائل الداخلية أو رسائل الأدوات فقط عندما تكون **verbose** أو **trace** أو **reasoning** مفعّلة
    لتلك الجلسة.

    أصلح هذا في الدردشة التي ترى فيها ذلك:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    إذا ظل الأمر مزعجًا، فتحقّق من إعدادات الجلسة في Control UI واضبط verbose
    على **inherit**. وتأكد أيضًا من أنك لا تستخدم ملف تعريف روبوت مع ضبط `verboseDefault`
    على `on` في الإعداد.

    الوثائق: [Thinking and verbose](/ar/tools/thinking)، [الأمان](/ar/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="كيف أوقف/ألغي مهمة قيد التشغيل؟">
    أرسل أيًا من هذه **كرسالة مستقلة** (من دون شرطة مائلة):

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

    هذه هي مشغلات الإلغاء (وليست أوامر بشرطة مائلة).

    بالنسبة إلى العمليات الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

    ```
    process action:kill sessionId:XXX
    ```

    نظرة عامة على أوامر الشرطة المائلة: راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

    يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`، لكن بعض الاختصارات (مثل `/status`) تعمل أيضًا ضمن الرسالة نفسها للمرسلين الموجودين في قائمة السماح.

  </Accordion>

  <Accordion title='كيف أرسل رسالة Discord من Telegram؟ ("Cross-context messaging denied")'>
    يمنع OpenClaw المراسلة **عبر المزوّدات** افتراضيًا. فإذا كان استدعاء أداة مرتبطًا
    بـ Telegram، فلن يرسل إلى Discord إلا إذا سمحت بذلك صراحةً.

    فعّل المراسلة عبر المزوّدات للوكيل:

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

    أعد تشغيل gateway بعد تعديل الإعداد.

  </Accordion>

  <Accordion title='لماذا يبدو وكأن الروبوت "يتجاهل" الرسائل السريعة المتتالية؟'>
    يتحكم وضع الطابور في كيفية تفاعل الرسائل الجديدة مع تشغيل جارٍ. استخدم `/queue` لتغيير الأوضاع:

    - `steer` - تعيد الرسائل الجديدة توجيه المهمة الحالية
    - `followup` - تشغيل الرسائل واحدة تلو الأخرى
    - `collect` - تجميع الرسائل والرد مرة واحدة (الافتراضي)
    - `steer-backlog` - أعد التوجيه الآن، ثم عالج التراكم
    - `interrupt` - ألغِ التشغيل الحالي وابدأ من جديد

    يمكنك إضافة خيارات مثل `debounce:2s cap:25 drop:summarize` لأوضاع المتابعة.

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما هو النموذج الافتراضي لـ Anthropic مع مفتاح API؟'>
    في OpenClaw، تكون بيانات الاعتماد واختيار النموذج منفصلين. يؤدي ضبط `ANTHROPIC_API_KEY` (أو تخزين مفتاح Anthropic API في ملفات تعريف المصادقة) إلى تفعيل المصادقة، لكن النموذج الافتراضي الفعلي هو أي نموذج تضبطه في `agents.defaults.model.primary` (مثل `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). إذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم تتمكن من العثور على بيانات اعتماد Anthropic في `auth-profiles.json` المتوقعة للوكيل الجاري تشغيله.
  </Accordion>
</AccordionGroup>

---

ما زلت عالقًا؟ اسأل في [Discord](https://discord.com/invite/clawd) أو افتح [نقاشًا على GitHub](https://github.com/openclaw/openclaw/discussions).

## ذو صلة

- [الأسئلة الشائعة للتشغيل الأول](/ar/help/faq-first-run) — التثبيت، وonboard، والمصادقة، والاشتراكات، والإخفاقات المبكرة
- [الأسئلة الشائعة للنماذج](/ar/help/faq-models) — اختيار النموذج، والرجوع الاحتياطي، وملفات تعريف المصادقة
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) — فرز حسب الأعراض
