---
read_when:
    - تثبيت جديد، أو تعثّر الإعداد الأولي، أو أخطاء التشغيل الأول
    - اختيار المصادقة واشتراكات المزوّدين
    - لا يمكن الوصول إلى docs.openclaw.ai، ولا يمكن فتح لوحة التحكم، والتثبيت عالق
sidebarTitle: First-run FAQ
summary: 'الأسئلة الشائعة: البدء السريع وإعداد التشغيل الأول — التثبيت، الإعداد الأولي، المصادقة، الاشتراكات، حالات الفشل الأولية'
title: 'الأسئلة الشائعة: إعداد التشغيل الأول'
x-i18n:
    generated_at: "2026-05-10T19:43:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: f19f755d41dc09c17e20845487037d1edc338d0edff5fc0190973f3d72a7f0ab
    source_path: help/faq-first-run.md
    workflow: 16
---

  أسئلة وأجوبة البدء السريع والتشغيل الأول. للعمليات اليومية، والنماذج، والمصادقة، والجلسات،
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## البدء السريع وإعداد التشغيل الأول

  <AccordionGroup>
  <Accordion title="أنا عالق، ما أسرع طريقة لتجاوز المشكلة">
    استخدم وكيل ذكاء اصطناعي محليًا يمكنه **رؤية جهازك**. هذا أكثر فعالية بكثير من السؤال
    في Discord، لأن معظم حالات "أنا عالق" تكون **مشكلات إعدادات محلية أو بيئة محلية** لا يستطيع
    المساعدون عن بُعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    تستطيع هذه الأدوات قراءة المستودع، وتشغيل الأوامر، وفحص السجلات، والمساعدة في إصلاح الإعدادات على مستوى جهازك
    (PATH، والخدمات، والأذونات، وملفات المصادقة). امنحها **نسخة كاملة من المصدر** عبر
    تثبيت قابل للتعديل (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يثبّت هذا OpenClaw **من نسخة git**، لذلك يمكن للوكيل قراءة الكود + الوثائق
    والاستدلال حول الإصدار الدقيق الذي تشغّله. يمكنك دائمًا الرجوع إلى الإصدار المستقر لاحقًا
    بإعادة تشغيل المثبّت من دون `--install-method git`.

    نصيحة: اطلب من الوكيل **تخطيط الإصلاح والإشراف عليه** (خطوة بخطوة)، ثم تنفيذ الأوامر
    الضرورية فقط. هذا يبقي التغييرات صغيرة وأسهل في المراجعة.

    إذا اكتشفت خللًا حقيقيًا أو إصلاحًا، فيرجى فتح issue على GitHub أو إرسال PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    ابدأ بهذه الأوامر (شارك المخرجات عند طلب المساعدة):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    ما الذي تفعله:

    - `openclaw status`: لقطة سريعة لصحة gateway/agent + الإعدادات الأساسية.
    - `openclaw models status`: يتحقق من مصادقة المزوّد + توفر النماذج.
    - `openclaw doctor`: يتحقق من مشكلات الإعدادات/الحالة الشائعة ويصلحها.

    فحوصات CLI أخرى مفيدة: `openclaw status --all`، و`openclaw logs --follow`،
    و`openclaw gateway status`، و`openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان هناك شيء معطل](/ar/help/faq#first-60-seconds-if-something-is-broken).
    وثائق التثبيت: [التثبيت](/ar/install)، [أعلام المثبّت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="Heartbeat يستمر في التخطي. ماذا تعني أسباب التخطي؟">
    أسباب تخطي Heartbeat الشائعة:

    - `quiet-hours`: خارج نافذة ساعات النشاط المكوّنة
    - `empty-heartbeat-file`: يوجد `HEARTBEAT.md` لكنه يحتوي فقط على هيكل فارغ/بعناوين فقط
    - `no-tasks-due`: وضع مهام `HEARTBEAT.md` نشط، لكن لم يحِن بعد أي من فواصل المهام
    - `alerts-disabled`: كل عناصر إظهار Heartbeat معطلة (`showOk`، و`showAlerts`، و`useIndicator` كلها متوقفة)

    في وضع المهام، لا تُقدَّم الطوابع الزمنية المستحقة إلا بعد اكتمال تشغيل Heartbeat حقيقي.
    لا تُعلّم عمليات التشغيل المتخطاة المهام على أنها مكتملة.

    الوثائق: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="الطريقة الموصى بها لتثبيت OpenClaw وإعداده">
    يوصي المستودع بالتشغيل من المصدر واستخدام الإعداد الأولي:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    يمكن للمعالج أيضًا بناء أصول الواجهة تلقائيًا. بعد الإعداد الأولي، تشغّل عادةً Gateway على المنفذ **18789**.

    من المصدر (للمساهمين/المطورين):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    إذا لم يكن لديك تثبيت عام بعد، فشغّله عبر `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="كيف أفتح لوحة المعلومات بعد الإعداد الأولي؟">
    يفتح المعالج متصفحك بعنوان URL نظيف للوحة المعلومات (من دون رمز مضمّن) مباشرة بعد الإعداد الأولي ويطبع الرابط أيضًا في الملخص. أبقِ ذلك التبويب مفتوحًا؛ إذا لم يُفتح، فانسخ/الصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أصادق لوحة المعلومات على localhost مقارنة بالوصول البعيد؟">
    **Localhost (الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلب مصادقة السر المشترك، فالصق الرمز أو كلمة المرور المكوّنة في إعدادات Control UI.
    - مصدر الرمز: `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر كلمة المرور: `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يكن هناك سر مشترك مكوّن بعد، فأنشئ رمزًا باستخدام `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** (موصى به): أبقِ الربط على loopback، وشغّل `openclaw gateway --tailscale serve`، وافتح `https://<magicdns>/`. إذا كان `gateway.auth.allowTailscale` يساوي `true`، فإن ترويسات الهوية تفي بمصادقة Control UI/WebSocket (من دون لصق سر مشترك، مع افتراض موثوقية مضيف Gateway)؛ لا تزال واجهات HTTP APIs تتطلب مصادقة السر المشترك ما لم تستخدم عمدًا private-ingress `none` أو مصادقة HTTP عبر trusted-proxy.
      تُسلسل محاولات مصادقة Serve المتزامنة السيئة من العميل نفسه قبل أن يسجلها محدد المصادقة الفاشلة، لذلك قد تُظهر إعادة المحاولة السيئة الثانية بالفعل `retry later`.
    - **ربط Tailnet**: شغّل `openclaw gateway --bind tailnet --token "<token>"` (أو كوّن مصادقة كلمة المرور)، وافتح `http://<tailscale-ip>:18789/`، ثم الصق السر المشترك المطابق في إعدادات لوحة المعلومات.
    - **وكيل عكسي واعٍ بالهوية**: أبقِ Gateway خلف وكيل موثوق، وكوّن `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل. تتطلب وكلاء loopback على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`.
    - **نفق SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. تظل مصادقة السر المشترك مطبقة عبر النفق؛ الصق الرمز أو كلمة المرور المكوّنة إذا طُلب منك ذلك.

    راجع [لوحة المعلومات](/ar/web/dashboard) و[أسطح الويب](/ar/web) لمعرفة أوضاع الربط وتفاصيل المصادقة.

  </Accordion>

  <Accordion title="لماذا توجد إعدادات موافقة exec اثنان لموافقات الدردشة؟">
    تتحكم في طبقات مختلفة:

    - `approvals.exec`: يمرر مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: يجعل تلك القناة تعمل كعميل موافقة أصلي لموافقات exec

    تظل سياسة exec الخاصة بالمضيف بوابة الموافقة الحقيقية. يتحكم إعداد الدردشة فقط في مكان ظهور
    مطالبات الموافقة وكيف يمكن للأشخاص الرد عليها.

    في معظم الإعدادات، **لا** تحتاج إلى كليهما:

    - إذا كانت الدردشة تدعم بالفعل الأوامر والردود، فإن `/approve` في الدردشة نفسها يعمل عبر المسار المشترك.
    - إذا كان بإمكان قناة أصلية مدعومة استنتاج الموافقين بأمان، فإن OpenClaw يفعّل الآن تلقائيًا الموافقات الأصلية التي تبدأ بالرسائل المباشرة عندما يكون `channels.<channel>.execApprovals.enabled` غير مضبوط أو `"auto"`.
    - عندما تتوفر بطاقات/أزرار الموافقة الأصلية، تكون تلك الواجهة الأصلية هي المسار الأساسي؛ ويجب على الوكيل تضمين أمر `/approve` يدوي فقط إذا كانت نتيجة الأداة تقول إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب أيضًا تمرير المطالبات إلى دردشات أخرى أو غرف عمليات صريحة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحةً نشر مطالبات الموافقة مرة أخرى في الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة أيضًا: تستخدم `/approve` في الدردشة نفسها افتراضيًا، وتمرير `approvals.plugin` اختياريًا، وتحتفظ بعض القنوات الأصلية فقط بمعالجة plugin-approval-native فوق ذلك.

    الخلاصة: التمرير مخصص للتوجيه، وإعداد العميل الأصلي مخصص لتجربة مستخدم أغنى خاصة بالقناة.
    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما بيئة التشغيل التي أحتاجها؟">
    يلزم Node **>= 22**. يوصى باستخدام `pnpm`. لا يوصى باستخدام Bun مع Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. Gateway خفيف - تذكر الوثائق أن **512MB-1GB RAM**، و**1 core**، وحوالي **500MB**
    من مساحة القرص تكفي للاستخدام الشخصي، وتشير إلى أن **Raspberry Pi 4 يمكنه تشغيله**.

    إذا أردت هامشًا إضافيًا (للسجلات، والوسائط، والخدمات الأخرى)، فإن **2GB موصى بها**، لكنها
    ليست حدًا أدنى صارمًا.

    نصيحة: يمكن لـ Pi/VPS صغير استضافة Gateway، ويمكنك إقران **العُقد** على حاسوبك المحمول/هاتفك من أجل
    الشاشة/الكاميرا/اللوحة المحلية أو تنفيذ الأوامر. راجع [العُقد](/ar/nodes).

  </Accordion>

  <Accordion title="هل من نصائح لتثبيتات Raspberry Pi؟">
    الخلاصة: يعمل، لكن توقع بعض الحواف الخشنة.

    - استخدم نظام تشغيل **64-bit** وأبقِ Node >= 22.
    - فضّل **التثبيت القابل للتعديل (git)** حتى تتمكن من رؤية السجلات والتحديث بسرعة.
    - ابدأ من دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات ثنائية غريبة، فعادةً ما تكون مشكلة **توافق ARM**.

    الوثائق: [Linux](/ar/platforms/linux)، [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق عند wake up my friend / الإعداد الأولي لا يفقس. ماذا الآن؟">
    تعتمد تلك الشاشة على إمكانية الوصول إلى Gateway والمصادقة معه. يرسل TUI أيضًا
    "Wake up, my friend!" تلقائيًا عند أول فقس. إذا رأيت ذلك السطر مع **عدم وجود رد**
    وبقيت الرموز عند 0، فهذا يعني أن الوكيل لم يعمل قط.

    1. أعد تشغيل Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. تحقق من الحالة + المصادقة:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. إذا استمر التعليق، فشغّل:

    ```bash
    openclaw doctor
    ```

    إذا كان Gateway بعيدًا، فتأكد من أن اتصال النفق/Tailscale يعمل وأن الواجهة
    تشير إلى Gateway الصحيح. راجع [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="هل يمكنني ترحيل إعدادي إلى جهاز جديد (Mac mini) من دون إعادة الإعداد الأولي؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغّل Doctor مرة واحدة. هذا
    يبقي روبوتك "كما هو تمامًا" (الذاكرة، وسجل الجلسات، والمصادقة، وحالة القنوات)
    ما دمت تنسخ **كلا** الموقعين:

    1. ثبّت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة عملك (الافتراضي: `~/.openclaw/workspace`).
    4. شغّل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    يحافظ ذلك على الإعدادات، وملفات تعريف المصادقة، واعتمادات WhatsApp، والجلسات، والذاكرة. إذا كنت في
    الوضع البعيد، فتذكر أن مضيف Gateway يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا اكتفيت بإيداع/دفع مساحة عملك إلى GitHub، فأنت تنسخ احتياطيًا
    **الذاكرة + ملفات bootstrap**، لكن **ليس** سجل الجلسات أو المصادقة. تلك موجودة
    تحت `~/.openclaw/` (على سبيل المثال `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [أين توجد الأشياء على القرص](/ar/help/faq#where-things-live-on-disk)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أرى الجديد في أحدث إصدار؟">
    تحقق من سجل التغييرات على GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    توجد أحدث الإدخالات في الأعلى. إذا كان القسم العلوي موسومًا **Unreleased**، فإن القسم المؤرخ التالي
    هو أحدث إصدار مشحون. تُجمّع الإدخالات حسب **أبرز النقاط**، و**التغييرات**، و
    **الإصلاحات** (بالإضافة إلى أقسام الوثائق/الأقسام الأخرى عند الحاجة).

  </Accordion>

  <Accordion title="لا يمكن الوصول إلى docs.openclaw.ai (خطأ SSL)">
    تحظر بعض اتصالات Comcast/Xfinity بشكل غير صحيح `docs.openclaw.ai` عبر Xfinity
    Advanced Security. عطّله أو أضف `docs.openclaw.ai` إلى قائمة السماح، ثم أعد المحاولة.
    يُرجى مساعدتنا في رفع الحظر عنه بالإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    إذا كنت ما زلت لا تستطيع الوصول إلى الموقع، فالوثائق منعكسة على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="الفرق بين الإصدار المستقر وبيتا">
    **الإصدار المستقر** و**بيتا** هما **وسما توزيع npm**، وليسا خطي كود منفصلين:

    - `latest` = مستقر
    - `beta` = بنية مبكرة للاختبار

    عادة، يصل الإصدار المستقر إلى **بيتا** أولاً، ثم تنقل خطوة ترقية صريحة
    الإصدار نفسه إلى `latest`. يمكن للمشرفين أيضاً النشر مباشرة إلى `latest` عند الحاجة. لهذا يمكن أن يشير بيتا والمستقر
    إلى **الإصدار نفسه** بعد الترقية.

    اطّلع على ما تغيّر:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    لمختصرات التثبيت من سطر واحد والفرق بين بيتا وdev، راجع الأكورديون أدناه.

  </Accordion>

  <Accordion title="كيف أثبّت إصدار بيتا وما الفرق بين بيتا وdev؟">
    **بيتا** هو وسم توزيع npm `beta` (قد يطابق `latest` بعد الترقية).
    **Dev** هو الرأس المتحرك لـ`main` (git)؛ وعند نشره، يستخدم وسم توزيع npm `dev`.

    أوامر من سطر واحد (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مثبّت Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    مزيد من التفاصيل: [قنوات التطوير](/ar/install/development-channels) و[أعلام المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أجرّب أحدث الأجزاء؟">
    خياران:

    1. **قناة Dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    ينتقل هذا إلى فرع `main` ويحدّث من المصدر.

    2. **تثبيت قابل للتعديل (من موقع المثبّت):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يمنحك هذا مستودعاً محلياً يمكنك تعديله، ثم تحديثه عبر git.

    إذا كنت تفضّل استنساخاً نظيفاً يدوياً، فاستخدم:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    الوثائق: [التحديث](/ar/cli/update)، [قنوات التطوير](/ar/install/development-channels)،
    [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="كم يستغرق التثبيت والتهيئة الأولية عادة؟">
    دليل تقريبي:

    - **التثبيت:** 2-5 دقائق
    - **التهيئة الأولية:** 5-15 دقيقة حسب عدد القنوات/النماذج التي تهيئها

    إذا تعلّق، استخدم [المثبّت عالق](#quick-start-and-first-run-setup)
    وحلقة التصحيح السريعة في [أنا عالق](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="المثبّت عالق؟ كيف أحصل على مزيد من الملاحظات؟">
    أعد تشغيل المثبّت مع **إخراج مفصّل**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    تثبيت بيتا مع الإخراج المفصّل:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    لتثبيت قابل للتعديل (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    المكافئ على Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    خيارات أكثر: [أعلام المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="تثبيت Windows يقول إن git غير موجود أو إن openclaw غير معترف به">
    مشكلتان شائعتان على Windows:

    **1) خطأ npm spawn git / git غير موجود**

    - ثبّت **Git for Windows** وتأكد من أن `git` موجود في PATH لديك.
    - أغلق PowerShell وافتحه من جديد، ثم أعد تشغيل المثبّت.

    **2) لا يتم التعرف على openclaw بعد التثبيت**

    - مجلد npm global bin لديك غير موجود في PATH.
    - تحقق من المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف ذلك الدليل إلى PATH الخاص بالمستخدم لديك (لا حاجة إلى لاحقة `\bin` على Windows؛ في معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وافتحه من جديد بعد تحديث PATH.

    إذا كنت تريد أسلس إعداد على Windows، فاستخدم **WSL2** بدلاً من Windows الأصلي.
    الوثائق: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="إخراج exec على Windows يعرض نصاً صينياً مشوهاً - ماذا أفعل؟">
    يحدث هذا عادة بسبب عدم تطابق صفحة ترميز وحدة التحكم في صدَفات Windows الأصلية.

    الأعراض:

    - إخراج `system.run`/`exec` يعرض الصينية كنص mojibake
    - يبدو الأمر نفسه سليماً في ملف تعريف طرفية آخر

    حل سريع في PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    ثم أعد تشغيل Gateway وجرّب الأمر مرة أخرى:

    ```powershell
    openclaw gateway restart
    ```

    إذا كنت ما زلت تستطيع إعادة إنتاج ذلك على أحدث OpenClaw، فتتبّعه/أبلغ عنه في:

    - [المسألة #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="لم تجب الوثائق عن سؤالي - كيف أحصل على إجابة أفضل؟">
    استخدم **التثبيت القابل للتعديل (git)** بحيث تكون لديك الشيفرة المصدرية والوثائق كاملة محلياً، ثم اسأل
    البوت لديك (أو Claude/Codex) _من ذلك المجلد_ حتى يتمكن من قراءة المستودع والإجابة بدقة.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مزيد من التفاصيل: [التثبيت](/ar/install) و[أعلام المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على Linux؟">
    الإجابة المختصرة: اتبع دليل Linux، ثم شغّل التهيئة الأولية.

    - المسار السريع على Linux + تثبيت الخدمة: [Linux](/ar/platforms/linux).
    - شرح كامل: [بدء الاستخدام](/ar/start/getting-started).
    - المثبّت + التحديثات: [التثبيت والتحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على VPS؟">
    يعمل أي VPS بنظام Linux. ثبّت على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول عن بُعد: [Gateway البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أدلة التثبيت على السحابة/VPS؟">
    نحتفظ **بمركز استضافة** يضم المزوّدين الشائعين. اختر واحداً واتبع الدليل:

    - [استضافة VPS](/ar/vps) (كل المزوّدين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    كيف يعمل ذلك في السحابة: **يعمل Gateway على الخادم**، وتصل إليه
    من حاسوبك المحمول/هاتفك عبر واجهة التحكم (أو Tailscale/SSH). حالتك + مساحة عملك
    تبقى على الخادم، لذلك تعامل مع المضيف كمصدر الحقيقة وانسخه احتياطياً.

    يمكنك إقران **العُقد** (Mac/iOS/Android/بلا واجهة) بذلك Gateway السحابي للوصول
    إلى الشاشة/الكاميرا/canvas المحلية أو تشغيل أوامر على حاسوبك المحمول مع إبقاء
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول عن بُعد: [Gateway البعيد](/ar/gateway/remote).
    العُقد: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني أن أطلب من OpenClaw تحديث نفسه؟">
    الإجابة المختصرة: **ممكن، غير موصى به**. قد تعيد عملية التحديث تشغيل
    Gateway (ما يسقط الجلسة النشطة)، وقد تحتاج إلى git checkout نظيف، وقد
    تطلب تأكيداً. الأكثر أماناً: شغّل التحديثات من صدفة بصفتك المشغّل.

    استخدم CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    إذا كان لا بد من الأتمتة من agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    الوثائق: [التحديث](/ar/cli/update)، [التحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="ماذا تفعل التهيئة الأولية فعلياً؟">
    `openclaw onboard` هو مسار الإعداد الموصى به. في **الوضع المحلي** يرشدك عبر:

    - **إعداد النموذج/المصادقة** (OAuth للمزوّد، مفاتيح API، setup-token من Anthropic، إضافة إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات التمهيد
    - **إعدادات Gateway** (bind/port/auth/tailscale)
    - **القنوات** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، إضافة إلى Plugins القنوات المضمّنة مثل QQ Bot)
    - **تثبيت daemon** (LaunchAgent على macOS؛ وحدة مستخدم systemd على Linux/WSL2)
    - **فحوصات الصحة** واختيار **Skills**

    كما يحذّرك إذا كان النموذج المهيأ غير معروف أو تنقصه المصادقة.

  </Accordion>

  <Accordion title="هل أحتاج إلى اشتراك Claude أو OpenAI لتشغيل هذا؟">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** (Anthropic/OpenAI/غيرهما) أو باستخدام
    **نماذج محلية فقط** بحيث تبقى بياناتك على جهازك. الاشتراكات (Claude
    Pro/Max أو OpenAI Codex) طرق اختيارية لمصادقة هؤلاء المزوّدين.

    بالنسبة إلى Anthropic في OpenClaw، التقسيم العملي هو:

    - **مفتاح API من Anthropic**: فوترة Anthropic API العادية
    - **Claude CLI / مصادقة اشتراك Claude في OpenClaw**: أخبرنا موظفو Anthropic
      أن هذا الاستخدام مسموح به مجدداً، ويتعامل OpenClaw مع استخدام `claude -p`
      باعتباره معتمداً لهذا التكامل ما لم تنشر Anthropic سياسة جديدة

    بالنسبة إلى مضيفي gateway طويلي العمر، ما تزال مفاتيح API من Anthropic هي
    الإعداد الأكثر قابلية للتنبؤ. OAuth الخاص بـ OpenAI Codex مدعوم صراحة للأدوات
    الخارجية مثل OpenClaw.

    يدعم OpenClaw أيضاً خيارات مستضافة أخرى بأسلوب الاشتراك، منها
    **Qwen Cloud Coding Plan** و**MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan**.

    الوثائق: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [نماذج GLM](/ar/providers/glm)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام اشتراك Claude Max دون مفتاح API؟">
    نعم.

    أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجدداً، لذلك
    يتعامل OpenClaw مع مصادقة اشتراك Claude واستخدام `claude -p` باعتبارهما معتمدين
    لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. إذا كنت تريد
    الإعداد الخادمي الأكثر قابلية للتنبؤ، فاستخدم مفتاح API من Anthropic بدلاً من ذلك.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك Claude (Claude Pro أو Max)؟">
    نعم.

    أخبرنا موظفو Anthropic أن هذا الاستخدام مسموح به مجدداً، لذلك يتعامل OpenClaw مع
    إعادة استخدام Claude CLI واستخدام `claude -p` باعتبارهما معتمدين لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    ما يزال Anthropic setup-token متاحاً كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
    بالنسبة إلى أعباء العمل الإنتاجية أو متعددة المستخدمين، ما تزال مصادقة مفتاح API من Anthropic هي
    الخيار الأكثر أماناً وقابلية للتنبؤ. إذا كنت تريد خيارات مستضافة أخرى بأسلوب الاشتراك
    في OpenClaw، فراجع [OpenAI](/ar/providers/openai)، [Qwen / Model
    Cloud](/ar/providers/qwen)، [MiniMax](/ar/providers/minimax)، و[نماذج GLM](/ar/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="لماذا أرى HTTP 429 rate_limit_error من Anthropic؟">
    يعني ذلك أن **حصة/حد معدل Anthropic** لديك قد استُنفد للنافذة الحالية. إذا كنت
    تستخدم **Claude CLI**، فانتظر إعادة ضبط النافذة أو رقِّ خطتك. إذا كنت
    تستخدم **مفتاح API من Anthropic**، فتحقق من Anthropic Console
    للاستخدام/الفوترة وارفع الحدود حسب الحاجة.

    إذا كانت الرسالة تحديدًا:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    إصدار Anthropic التجريبي لسياق 1M (`context1m: true`). يعمل ذلك فقط عندما تكون
    بيانات اعتمادك مؤهلة لفوترة السياق الطويل (فوترة مفتاح API أو
    مسار تسجيل الدخول إلى Claude في OpenClaw مع تفعيل Extra Usage).

    نصيحة: عيّن **نموذجًا احتياطيًا** حتى يتمكن OpenClaw من مواصلة الرد أثناء خضوع أحد المزوّدين لقيود المعدّل.
    راجع [النماذج](/ar/cli/models)، و[OAuth](/ar/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. يحتوي OpenClaw على مزوّد **Amazon Bedrock (Converse)** مضمّن. عند وجود علامات بيئة AWS، يمكن لـ OpenClaw اكتشاف كتالوج Bedrock للبث/النص تلقائيًا ودمجه كمزوّد `amazon-bedrock` ضمني؛ وإلا يمكنك تفعيل `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحةً أو إضافة إدخال مزوّد يدوي. راجع [Amazon Bedrock](/ar/providers/bedrock) و[مزوّدي النماذج](/ar/providers/models). إذا كنت تفضّل تدفق مفتاح مُدار، فسيظل استخدام وكيل متوافق مع OpenAI أمام Bedrock خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth (تسجيل الدخول إلى ChatGPT). استخدم
    `openai/gpt-5.5` للإعداد الشائع: مصادقة اشتراك ChatGPT/Codex بالإضافة إلى
    تنفيذ خادم تطبيق Codex الأصلي. مراجع نماذج `openai-codex/gpt-*`
    هي إعدادات قديمة يتم إصلاحها بواسطة `openclaw doctor --fix`. يظل الوصول المباشر
    باستخدام مفتاح OpenAI API متاحًا لأسطح OpenAI API غير الخاصة بالوكلاء ولنماذج الوكلاء
    عبر ملف تعريف مفتاح API مرتب باسم `openai-codex`.
    راجع [مزوّدي النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا لا يزال OpenClaw يذكر openai-codex؟">
    `openai-codex` هو معرّف المزوّد وملف تعريف المصادقة لـ OAuth الخاص بـ ChatGPT/Codex.
    استخدمته الإعدادات الأقدم أيضًا كبادئة نموذج:

    - `openai/gpt-5.5` = مصادقة اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي لدورات الوكيل
    - `openai-codex/gpt-5.5` = مسار نموذج قديم يتم إصلاحه بواسطة `openclaw doctor --fix`
    - `openai/gpt-5.5` بالإضافة إلى ملف تعريف مفتاح API مرتب باسم `openai-codex` = مصادقة مفتاح API لنموذج وكيل OpenAI
    - `openai-codex:...` = معرّف ملف تعريف مصادقة، وليس مرجع نموذج

    إذا كنت تريد مسار فوترة/حدود OpenAI Platform المباشر، فعيّن
    `OPENAI_API_KEY`. إذا كنت تريد مصادقة اشتراك ChatGPT/Codex، فسجّل الدخول باستخدام
    `openclaw models auth login --provider openai-codex`. أبقِ مرجع النموذج
    `openai/gpt-5.5`؛ مراجع نماذج `openai-codex/*` هي إعدادات قديمة يعيد
    `openclaw doctor --fix` كتابتها.

  </Accordion>

  <Accordion title="لماذا قد تختلف حدود Codex OAuth عن ChatGPT على الويب؟">
    يستخدم Codex OAuth نوافذ حصص مُدارة من OpenAI وتعتمد على الخطة. عمليًا،
    يمكن أن تختلف هذه الحدود عن تجربة موقع/تطبيق ChatGPT، حتى عندما
    يكون كلاهما مرتبطًا بالحساب نفسه.

    يستطيع OpenClaw عرض نوافذ استخدام/حصة المزوّد المرئية حاليًا في
    `openclaw models status`، لكنه لا يخترع استحقاقات ChatGPT على الويب أو يطبّعها
    إلى وصول مباشر إلى API. إذا كنت تريد مسار فوترة/حدود OpenAI Platform
    المباشر، فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك OpenAI (Codex OAuth)؟">
    نعم. يدعم OpenClaw بالكامل **OAuth لاشتراك OpenAI Code (Codex)**.
    تسمح OpenAI صراحةً باستخدام OAuth الخاص بالاشتراك في أدوات/تدفقات عمل خارجية
    مثل OpenClaw. يمكن للإعداد الأولي تشغيل تدفق OAuth نيابةً عنك.

    راجع [OAuth](/ar/concepts/oauth)، و[مزوّدي النماذج](/ar/concepts/model-providers)، و[الإعداد الأولي (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أعد Gemini CLI OAuth؟">
    يستخدم Gemini CLI **تدفق مصادقة Plugin**، وليس معرّف عميل أو سرًا في `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا حتى يكون `gemini` ضمن `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. فعّل Plugin: `openclaw plugins enable google`
    3. سجّل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: `google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway

    يخزّن هذا رموز OAuth في ملفات تعريف المصادقة على مضيف Gateway. التفاصيل: [مزوّدو النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للمحادثات العادية؟">
    عادةً لا. يحتاج OpenClaw إلى سياق كبير وأمان قوي؛ البطاقات الصغيرة تقتطع وتسرّب. إذا كان لا بد من ذلك، فشغّل **أكبر** بناء نموذج يمكنك تشغيله محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). تزيد النماذج الأصغر/المكمّمة خطر حقن المطالبات - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أبقي حركة مرور النماذج المستضافة في منطقة محددة؟">
    اختر نقاط نهاية مثبتة بالمنطقة. يوفّر OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر المتغير المستضاف في الولايات المتحدة لإبقاء البيانات داخل المنطقة. لا يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه باستخدام `models.mode: "merge"` حتى تظل البدائل الاحتياطية متاحة مع احترام المزوّد الإقليمي الذي تختاره.
  </Accordion>

  <Accordion title="هل يجب أن أشتري Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux (Windows عبر WSL2). جهاز Mac mini اختياري - يشتريه بعض الأشخاص
    كمضيف دائم التشغيل، لكن VPS صغيرًا أو خادمًا منزليًا أو جهازًا من فئة Raspberry Pi يعمل أيضًا.

    لا تحتاج إلى Mac إلا **للأدوات الخاصة بـ macOS فقط**. بالنسبة إلى iMessage، استخدم [iMessage](/ar/channels/imessage) مع `imsg` على أي Mac مسجّل الدخول إلى Messages. إذا كان Gateway يعمل على Linux أو في مكان آخر، فعيّن `channels.imessage.cliPath` إلى مغلّف SSH يشغّل `imsg` على ذلك الـ Mac. إذا كنت تريد أدوات أخرى خاصة بـ macOS فقط، فشغّل Gateway على Mac أو اربط Node يعمل بنظام macOS.

    المستندات: [iMessage](/ar/channels/imessage)، و[Nodes](/ar/nodes)، و[وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **جهاز macOS ما** مسجّل الدخول إلى Messages. لا يجب أن يكون Mac mini -
    أي Mac يفي بالغرض. **استخدم [iMessage](/ar/channels/imessage)** مع `imsg`؛ يمكن تشغيل Gateway على ذلك الـ Mac، أو يمكن تشغيله في مكان آخر مع مغلّف SSH في `cliPath`.

    الإعدادات الشائعة:

    - شغّل Gateway على Linux/VPS، وعيّن `channels.imessage.cliPath` إلى مغلّف SSH يشغّل `imsg` على Mac مسجّل الدخول إلى Messages.
    - شغّل كل شيء على الـ Mac إذا كنت تريد أبسط إعداد على جهاز واحد.

    المستندات: [iMessage](/ar/channels/imessage)، و[Nodes](/ar/nodes)،
    و[وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، هل يمكنني توصيله بـ MacBook Pro الخاص بي؟">
    نعم. يمكن أن يشغّل **Mac mini الـ Gateway**، ويمكن لـ MacBook Pro الخاص بك الاتصال كـ
    **Node** (جهاز مرافق). لا تشغّل Nodes الـ Gateway - بل توفّر قدرات إضافية
    مثل الشاشة/الكاميرا/اللوحة و`system.run` على ذلك الجهاز.

    النمط الشائع:

    - Gateway على Mac mini (دائم التشغيل).
    - يشغّل MacBook Pro تطبيق macOS أو مضيف Node ويرتبط بـ Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    المستندات: [Nodes](/ar/nodes)، و[Nodes CLI](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    لا يُنصح باستخدام Bun. نرى أخطاء وقت تشغيل، خاصةً مع WhatsApp وTelegram.
    استخدم **Node** من أجل Gateways مستقرة.

    إذا كنت لا تزال تريد تجربة Bun، فافعل ذلك على Gateway غير إنتاجي
    بدون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ما الذي يوضع في allowFrom؟">
    `channels.telegram.allowFrom` هو **معرّف مستخدم Telegram الخاص بالمرسل البشري** (رقمي). وليس اسم مستخدم البوت.

    يطلب الإعداد معرّفات المستخدم الرقمية فقط. إذا كانت لديك بالفعل إدخالات `@username` قديمة في الإعداد، فيمكن لـ `openclaw doctor --fix` محاولة حلّها.

    أكثر أمانًا (بدون بوت تابع لجهة خارجية):

    - أرسل رسالة مباشرة إلى البوت، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    Bot API الرسمي:

    - أرسل رسالة مباشرة إلى البوت، ثم استدعِ `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    جهة خارجية (أقل خصوصية):

    - أرسل رسالة مباشرة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع مثيلات OpenClaw مختلفة؟">
    نعم، عبر **التوجيه متعدد الوكلاء**. اربط **الرسالة المباشرة** في WhatsApp لكل مرسل (نظير `kind: "direct"`، مرسل بصيغة E.164 مثل `+15551234567`) بـ `agentId` مختلف، بحيث يحصل كل شخص على مساحة عمل ومخزن جلسات خاصين به. لا تزال الردود تأتي من **حساب WhatsApp نفسه**، والتحكم في وصول الرسائل المباشرة (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) عام لكل حساب WhatsApp. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "دردشة سريعة" ووكيل "Opus للبرمجة"؟'>
    نعم. استخدم التوجيه متعدد الوكلاء: أعطِ كل وكيل نموذجه الافتراضي الخاص، ثم اربط المسارات الواردة (حساب المزوّد أو نظراء محددين) بكل وكيل. يوجد مثال إعداد في [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent). راجع أيضًا [النماذج](/ar/concepts/models) و[الإعدادات](/ar/gateway/configuration).
  </Accordion>

  <Accordion title="هل يعمل Homebrew على Linux؟">
    نعم. يدعم Homebrew نظام Linux (Linuxbrew). إعداد سريع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    إذا كنت تشغّل OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` (أو بادئة brew لديك) حتى تُحل أدوات `brew` المثبتة في أصداف غير تسجيل الدخول.
    تضيف الإصدارات الحديثة أيضًا مجلدات bin الشائعة للمستخدم في خدمات Linux systemd (على سبيل المثال `~/.local/bin` و`~/.npm-global/bin` و`~/.local/share/pnpm` و`~/.bun/bin`) وتراعي `PNPM_HOME` و`NPM_CONFIG_PREFIX` و`BUN_INSTALL` و`VOLTA_HOME` و`ASDF_DATA_DIR` و`NVM_DIR` و`FNM_DIR` عند تعيينها.

  </Accordion>

  <Accordion title="الفرق بين تثبيت git القابل للتعديل وتثبيت npm">
    - **تثبيت قابل للتعديل (git):** نسخة كاملة من المصدر، قابلة للتحرير، والأفضل للمساهمين.
      تشغّل عمليات البناء محليًا ويمكنك تعديل الكود/المستندات.
    - **تثبيت npm:** تثبيت CLI عام، بدون مستودع، والأفضل لمن يريد "تشغيله فقط".
      تأتي التحديثات من وسوم توزيع npm.

    المستندات: [بدء الاستخدام](/ar/start/getting-started)، و[التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="هل يمكنني التبديل بين تثبيت npm وgit لاحقًا؟">
    نعم. استخدم `openclaw update --channel ...` عندما يكون OpenClaw مثبتًا بالفعل.
    هذا **لا يحذف بياناتك** - بل يغيّر تثبيت كود OpenClaw فقط.
    تظل حالتك (`~/.openclaw`) ومساحة عملك (`~/.openclaw/workspace`) كما هي دون مساس.

    من npm إلى git:

    ```bash
    openclaw update --channel dev
    ```

    من git إلى npm:

    ```bash
    openclaw update --channel stable
    ```

    أضف `--dry-run` لمعاينة تبديل الوضع المخطط له أولًا. يشغّل المحدّث
    متابعات Doctor، ويحدّث مصادر Plugin للقناة المستهدفة، ويعيد تشغيل
    Gateway ما لم تمرر `--no-restart`.

    يمكن للمثبّت فرض أي من الوضعين أيضًا:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نصائح النسخ الاحتياطي: راجع [استراتيجية النسخ الاحتياطي](/ar/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="هل يجب أن أشغّل Gateway على حاسوبي المحمول أم على VPS؟">
    الإجابة المختصرة: **إذا كنت تريد موثوقية على مدار الساعة، فاستخدم VPS**. إذا كنت تريد
    أقل قدر من التعقيد ولا تمانع السكون/إعادة التشغيل، فشغّله محليًا.

    **الحاسوب المحمول (Gateway المحلي)**

    - **الإيجابيات:** لا توجد تكلفة خادم، وصول مباشر إلى الملفات المحلية، نافذة متصفح مباشرة.
    - **السلبيات:** السكون/انقطاع الشبكة = انقطاع الاتصال، تحديثات/إعادات تشغيل نظام التشغيل تقاطع العمل، يجب أن يبقى الجهاز مستيقظًا.

    **VPS / السحابة**

    - **الإيجابيات:** يعمل دائمًا، شبكة مستقرة، لا مشكلات سكون الحاسوب المحمول، أسهل في إبقائه قيد التشغيل.
    - **السلبيات:** غالبًا يعمل بلا واجهة رسومية (استخدم لقطات الشاشة)، وصول إلى الملفات عن بُعد فقط، يجب استخدام SSH للتحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp/Telegram/Slack/Mattermost/Discord كلها جيدًا من VPS. المفاضلة الحقيقية الوحيدة هي **متصفح بلا واجهة رسومية** مقابل نافذة مرئية. راجع [المتصفح](/ar/tools/browser).

    **الإعداد الافتراضي الموصى به:** VPS إذا واجهت انقطاعات في gateway من قبل. المحلي خيار ممتاز عندما تستخدم Mac بنشاط وتريد الوصول إلى الملفات المحلية أو أتمتة واجهة المستخدم مع متصفح مرئي.

  </Accordion>

  <Accordion title="ما مدى أهمية تشغيل OpenClaw على جهاز مخصص؟">
    ليس مطلوبًا، لكنه **موصى به من أجل الموثوقية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Pi):** يعمل دائمًا، انقطاعات أقل بسبب السكون/إعادة التشغيل، أذونات أنظف، أسهل في إبقائه قيد التشغيل.
    - **حاسوب محمول/مكتبي مشترك:** مناسب تمامًا للاختبار والاستخدام النشط، لكن توقّع توقفات مؤقتة عندما يدخل الجهاز في وضع السكون أو يجري تحديثات.

    إذا كنت تريد أفضل ما في الخيارين، فأبقِ Gateway على مضيف مخصص واربط حاسوبك المحمول بصفته **Node** لأدوات الشاشة/الكاميرا/التنفيذ المحلية. راجع [Nodes](/ar/nodes).
    للحصول على إرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما الحد الأدنى لمتطلبات VPS وما نظام التشغيل الموصى به؟">
    OpenClaw خفيف الوزن. لأجل Gateway أساسي + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** وحدة vCPU واحدة، ذاكرة RAM بسعة 1GB، قرص بسعة ~500MB.
    - **الموصى به:** وحدة vCPU واحدة إلى وحدتين، وذاكرة RAM بسعة 2GB أو أكثر لتوفير هامش إضافي (السجلات، الوسائط، قنوات متعددة). قد تكون أدوات Node وأتمتة المتصفح كثيرة الاستهلاك للموارد.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). مسار التثبيت على Linux هو الأكثر اختبارًا هناك.

    المستندات: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw داخل VM وما المتطلبات؟">
    نعم. تعامل مع VM مثل VPS: يجب أن يكون قيد التشغيل دائمًا، ويمكن الوصول إليه، ولديه ما يكفي من
    ذاكرة RAM لـ Gateway وأي قنوات تفعّلها.

    إرشادات خط الأساس:

    - **الحد الأدنى المطلق:** وحدة vCPU واحدة، ذاكرة RAM بسعة 1GB.
    - **الموصى به:** ذاكرة RAM بسعة 2GB أو أكثر إذا كنت تشغّل قنوات متعددة، أو أتمتة المتصفح، أو أدوات الوسائط.
    - **نظام التشغيل:** Ubuntu LTS أو Debian/Ubuntu حديث آخر.

    إذا كنت تستخدم Windows، فإن **WSL2 هو أسهل إعداد بأسلوب VM** ولديه أفضل توافق مع الأدوات.
    راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    إذا كنت تشغّل macOS داخل VM، فراجع [macOS VM](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية (النماذج، الجلسات، gateway، الأمان، والمزيد)
- [نظرة عامة على التثبيت](/ar/install)
- [بدء الاستخدام](/ar/start/getting-started)
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
