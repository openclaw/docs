---
read_when:
    - تثبيت جديد، أو تعثّر الإعداد الأولي، أو أخطاء التشغيل لأول مرة
    - اختيار المصادقة واشتراكات المزوّدين
    - تعذّر الوصول إلى docs.openclaw.ai، وتعذّر فتح لوحة التحكم، والتثبيت عالق
sidebarTitle: First-run FAQ
summary: 'الأسئلة الشائعة: إعداد البدء السريع والتشغيل الأول — التثبيت، الإعداد التمهيدي، المصادقة، الاشتراكات، الإخفاقات الأولية'
title: 'الأسئلة الشائعة: إعداد التشغيل الأول'
x-i18n:
    generated_at: "2026-05-02T22:20:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1205a046617c5d25ca1b180fca1a34fe0a5e7d0fc6a820ef44ebba4d723236f5
    source_path: help/faq-first-run.md
    workflow: 16
---

  أسئلة وأجوبة للبدء السريع والتشغيل الأول. للعمليات اليومية والنماذج والمصادقة والجلسات
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## البدء السريع وإعداد التشغيل الأول

  <AccordionGroup>
  <Accordion title="أنا عالق، ما أسرع طريقة للخروج من المشكلة">
    استخدم وكيل ذكاء اصطناعي محلي يمكنه **رؤية جهازك**. هذا أكثر فاعلية بكثير من السؤال
    في Discord، لأن معظم حالات "أنا عالق" تكون **مشكلات إعداد محلية أو مشكلات بيئة** لا يمكن
    للمساعدين عن بعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    يمكن لهذه الأدوات قراءة المستودع، وتشغيل الأوامر، وفحص السجلات، والمساعدة في إصلاح إعداداتك
    على مستوى الجهاز (PATH، الخدمات، الأذونات، ملفات المصادقة). امنحها **نسخة المصدر الكاملة** عبر
    التثبيت القابل للتعديل (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يثبت هذا OpenClaw **من نسخة git**، حتى يتمكن الوكيل من قراءة الكود + الوثائق
    والاستدلال بناء على الإصدار الدقيق الذي تشغله. يمكنك دائما العودة إلى الإصدار المستقر لاحقا
    بإعادة تشغيل المثبت من دون `--install-method git`.

    نصيحة: اطلب من الوكيل **تخطيط الإصلاح والإشراف عليه** (خطوة بخطوة)، ثم تنفيذ الأوامر
    الضرورية فقط. هذا يبقي التغييرات صغيرة وأسهل في المراجعة.

    إذا اكتشفت خطأ حقيقيا أو إصلاحا، يرجى فتح issue على GitHub أو إرسال PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    ابدأ بهذه الأوامر (شارك المخرجات عند طلب المساعدة):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    ما تفعله:

    - `openclaw status`: لقطة سريعة لحالة gateway/agent + الإعدادات الأساسية.
    - `openclaw models status`: يتحقق من مصادقة المزود + توفر النماذج.
    - `openclaw doctor`: يتحقق من مشكلات الإعداد/الحالة الشائعة ويصلحها.

    فحوص CLI مفيدة أخرى: `openclaw status --all`، `openclaw logs --follow`،
    `openclaw gateway status`، `openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان هناك شيء معطلا](/ar/help/faq#first-60-seconds-if-something-is-broken).
    وثائق التثبيت: [التثبيت](/ar/install)، [أعلام المثبت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="يستمر Heartbeat في التخطي. ماذا تعني أسباب التخطي؟">
    أسباب تخطي Heartbeat الشائعة:

    - `quiet-hours`: خارج نافذة ساعات النشاط المكونة
    - `empty-heartbeat-file`: يوجد `HEARTBEAT.md` لكنه يحتوي فقط على هيكل فارغ/رؤوس فقط
    - `no-tasks-due`: وضع مهام `HEARTBEAT.md` نشط لكن لم يحل موعد أي من فواصل المهام بعد
    - `alerts-disabled`: كل إظهار Heartbeat معطل (`showOk` و`showAlerts` و`useIndicator` كلها متوقفة)

    في وضع المهام، لا تتقدم الطوابع الزمنية المستحقة إلا بعد اكتمال تشغيل Heartbeat حقيقي.
    لا تضع عمليات التشغيل المتخطاة علامة اكتمال على المهام.

    الوثائق: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="الطريقة الموصى بها لتثبيت OpenClaw وإعداده">
    يوصي المستودع بالتشغيل من المصدر واستخدام التهيئة الأولية:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    يمكن للمعالج أيضا بناء أصول الواجهة تلقائيا. بعد التهيئة الأولية، عادة ما تشغل Gateway على المنفذ **18789**.

    من المصدر (للمساهمين/التطوير):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    إذا لم يكن لديك تثبيت عام بعد، فشغله عبر `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="كيف أفتح لوحة التحكم بعد التهيئة الأولية؟">
    يفتح المعالج متصفحك بعنوان URL نظيف للوحة التحكم (غير مميز برمز) مباشرة بعد التهيئة الأولية، ويطبع الرابط أيضا في الملخص. اترك ذلك اللسان مفتوحا؛ إذا لم يعمل تلقائيا، انسخ/الصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أصادق لوحة التحكم على localhost مقابل جهاز بعيد؟">
    **Localhost (الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلب مصادقة بسر مشترك، فالصق الرمز أو كلمة المرور المكونة في إعدادات Control UI.
    - مصدر الرمز: `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر كلمة المرور: `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يتم تكوين سر مشترك بعد، فأنشئ رمزا باستخدام `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** (موصى به): أبق الربط على loopback، وشغل `openclaw gateway --tailscale serve`، وافتح `https://<magicdns>/`. إذا كان `gateway.auth.allowTailscale` هو `true`، فإن ترويسات الهوية تفي بمصادقة Control UI/WebSocket (من دون لصق سر مشترك، مع افتراض أن مضيف Gateway موثوق)؛ لا تزال HTTP APIs تتطلب مصادقة السر المشترك إلا إذا استخدمت عمدا private-ingress `none` أو مصادقة HTTP عبر trusted-proxy.
      تتم تسلسلة محاولات مصادقة Serve المتزامنة السيئة من العميل نفسه قبل أن يسجلها محدد فشل المصادقة، لذلك قد تظهر محاولة الإعادة السيئة الثانية بالفعل `retry later`.
    - **ربط Tailnet**: شغل `openclaw gateway --bind tailnet --token "<token>"` (أو كون مصادقة كلمة المرور)، وافتح `http://<tailscale-ip>:18789/`، ثم الصق السر المشترك المطابق في إعدادات لوحة التحكم.
    - **وكيل عكسي مدرك للهوية**: أبق Gateway خلف وكيل موثوق، وكون `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل. تتطلب وكلاء local loopback على المضيف نفسه تعيين `gateway.auth.trustedProxy.allowLoopback = true` صراحة.
    - **نفق SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. لا تزال مصادقة السر المشترك تنطبق عبر النفق؛ الصق الرمز أو كلمة المرور المكونة إذا طلب منك ذلك.

    راجع [لوحة التحكم](/ar/web/dashboard) و[أسطح الويب](/ar/web) لمعرفة أوضاع الربط وتفاصيل المصادقة.

  </Accordion>

  <Accordion title="لماذا توجد تهيئتا موافقة exec لموافقات الدردشة؟">
    تتحكمان في طبقات مختلفة:

    - `approvals.exec`: يوجه مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: يجعل تلك القناة تعمل كعميل موافقة أصلي لموافقات exec

    لا تزال سياسة exec الخاصة بالمضيف هي بوابة الموافقة الحقيقية. إعداد الدردشة يتحكم فقط في مكان ظهور
    مطالبات الموافقة وكيف يمكن للأشخاص الرد عليها.

    في معظم الإعدادات لا تحتاج إلى **كليهما**:

    - إذا كانت الدردشة تدعم الأوامر والردود بالفعل، فإن `/approve` في الدردشة نفسها يعمل عبر المسار المشترك.
    - إذا كان بإمكان قناة أصلية مدعومة استنتاج الموافقين بأمان، فإن OpenClaw يفعّل الآن موافقات أصلية تبدأ بالرسائل المباشرة تلقائيا عندما تكون `channels.<channel>.execApprovals.enabled` غير معينة أو `"auto"`.
    - عند توفر بطاقات/أزرار الموافقة الأصلية، تكون تلك الواجهة الأصلية هي المسار الأساسي؛ ويجب على الوكيل تضمين أمر `/approve` يدوي فقط إذا قالت نتيجة الأداة إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب أيضا توجيه المطالبات إلى دردشات أخرى أو غرف عمليات صريحة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحة نشر مطالبات الموافقة مرة أخرى في الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة مرة أخرى: تستخدم `/approve` في الدردشة نفسها افتراضيا، مع توجيه اختياري عبر `approvals.plugin`، وبعض القنوات الأصلية فقط تبقي معالجة plugin-approval-native فوق ذلك.

    باختصار: التوجيه للمسارات، وإعداد العميل الأصلي لتجربة مستخدم أكثر ثراء خاصة بالقناة.
    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما وقت التشغيل الذي أحتاجه؟">
    يلزم Node **>= 22**. يوصى باستخدام `pnpm`. لا يوصى باستخدام Bun من أجل Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. Gateway خفيف - تذكر الوثائق أن **512MB-1GB RAM** و**1 core** وحوالي **500MB**
    من مساحة القرص كافية للاستخدام الشخصي، وتلاحظ أن **Raspberry Pi 4 يمكنه تشغيله**.

    إذا كنت تريد مساحة إضافية (السجلات، الوسائط، الخدمات الأخرى)، فيوصى بـ **2GB**، لكنها
    ليست حدا أدنى صارما.

    نصيحة: يمكن لـ Pi/VPS صغير استضافة Gateway، ويمكنك إقران **nodes** على حاسوبك المحمول/هاتفك من أجل
    الشاشة/الكاميرا/canvas المحلية أو تنفيذ الأوامر. راجع [Nodes](/ar/nodes).

  </Accordion>

  <Accordion title="أي نصائح لتثبيتات Raspberry Pi؟">
    الخلاصة: يعمل، لكن توقع بعض الحواف الخشنة.

    - استخدم نظام تشغيل **64-bit** وأبق Node >= 22.
    - فضل **التثبيت القابل للتعديل (git)** حتى تتمكن من رؤية السجلات والتحديث بسرعة.
    - ابدأ من دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات ثنائية غريبة، فعادة ما تكون مشكلة **توافق ARM**.

    الوثائق: [Linux](/ar/platforms/linux)، [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق على wake up my friend / التهيئة الأولية لا تفقس. ماذا الآن؟">
    تعتمد تلك الشاشة على إمكانية الوصول إلى Gateway والمصادقة عليه. ترسل TUI أيضا
    "Wake up, my friend!" تلقائيا عند أول فقس. إذا رأيت ذلك السطر مع **عدم وجود رد**
    وبقيت الرموز عند 0، فهذا يعني أن الوكيل لم يعمل أبدا.

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

    3. إذا بقي عالقا، فشغل:

    ```bash
    openclaw doctor
    ```

    إذا كان Gateway بعيدا، فتأكد من أن اتصال النفق/Tailscale يعمل وأن الواجهة
    تشير إلى Gateway الصحيح. راجع [الوصول عن بعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="هل يمكنني نقل إعدادي إلى جهاز جديد (Mac mini) من دون إعادة التهيئة الأولية؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغل Doctor مرة واحدة. هذا
    يبقي البوت لديك "بالضبط كما هو" (الذاكرة، سجل الجلسات، المصادقة، وحالة القنوات)
    ما دمت تنسخ **كلا** الموقعين:

    1. ثبت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة عملك (الافتراضي: `~/.openclaw/workspace`).
    4. شغل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    يحافظ ذلك على الإعدادات وملفات تعريف المصادقة واعتمادات WhatsApp والجلسات والذاكرة. إذا كنت في
    الوضع البعيد، فتذكر أن مضيف gateway يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا كنت تكتفي بعمل commit/push لمساحة عملك إلى GitHub، فأنت تنشئ نسخة احتياطية
    من **الذاكرة + ملفات bootstrap**، لكن **ليس** سجل الجلسات أو المصادقة. هذه موجودة
    تحت `~/.openclaw/` (مثلا `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [أين توجد الأشياء على القرص](/ar/help/faq#where-things-live-on-disk)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أرى الجديد في أحدث إصدار؟">
    تحقق من سجل التغييرات على GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    أحدث الإدخالات في الأعلى. إذا كان القسم العلوي موسوما بـ **Unreleased**، فإن القسم المؤرخ التالي
    هو أحدث إصدار منشور. تجمع الإدخالات حسب **أبرز النقاط** و**التغييرات** و
    **الإصلاحات** (بالإضافة إلى أقسام الوثائق/الأقسام الأخرى عند الحاجة).

  </Accordion>

  <Accordion title="لا يمكن الوصول إلى docs.openclaw.ai (خطأ SSL)">
    تحظر بعض اتصالات Comcast/Xfinity بشكل غير صحيح `docs.openclaw.ai` عبر Xfinity
    Advanced Security. عطله أو أضف `docs.openclaw.ai` إلى قائمة السماح، ثم أعد المحاولة.
    يرجى مساعدتنا على إلغاء الحظر عنه بالإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    إذا كنت لا تزال غير قادر على الوصول إلى الموقع، فالوثائق معكوسة على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="الفرق بين المستقر والبيتا">
    **المستقر** و**البيتا** هما **npm dist-tags**، وليسا خطّي كود منفصلين:

    - `latest` = المستقر
    - `beta` = إصدار مبكر للاختبار

    عادةً، يصل الإصدار المستقر إلى **beta** أولًا، ثم تنقل خطوة ترقية صريحة
    الإصدار نفسه إلى `latest`. يمكن للمشرفين أيضًا النشر مباشرةً إلى `latest` عند الحاجة. لهذا يمكن أن يشير كل من beta والمستقر
    إلى **الإصدار نفسه** بعد الترقية.

    اطّلع على ما تغيّر:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    لتعليمات التثبيت ذات السطر الواحد والفرق بين beta وdev، راجع الأكورديون أدناه.

  </Accordion>

  <Accordion title="كيف أثبّت إصدار beta وما الفرق بين beta وdev؟">
    **Beta** هو npm dist-tag باسم `beta` (قد يطابق `latest` بعد الترقية).
    **Dev** هو الرأس المتحرك لـ `main` (git)؛ وعند نشره، يستخدم npm dist-tag باسم `dev`.

    أوامر السطر الواحد (macOS/Linux):

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

    يبدّل هذا إلى فرع `main` ويحدّث من المصدر.

    2. **تثبيت قابل للتعديل (من موقع المثبّت):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يمنحك هذا مستودعًا محليًا يمكنك تعديله، ثم تحديثه عبر git.

    إذا كنت تفضّل استنساخًا نظيفًا يدويًا، فاستخدم:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    الوثائق: [التحديث](/ar/cli/update)، [قنوات التطوير](/ar/install/development-channels)،
    [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="كم يستغرق التثبيت والإعداد الأولي عادةً؟">
    دليل تقريبي:

    - **التثبيت:** 2-5 دقائق
    - **الإعداد الأولي:** 5-15 دقيقة حسب عدد القنوات/النماذج التي تهيئها

    إذا علِق، فاستخدم [المثبّت عالق](#quick-start-and-first-run-setup)
    وحلقة التصحيح السريعة في [أنا عالق](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="المثبّت عالق؟ كيف أحصل على مزيد من الملاحظات؟">
    أعِد تشغيل المثبّت مع **إخراج تفصيلي**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    تثبيت Beta مع الإخراج التفصيلي:

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

    مزيد من الخيارات: [أعلام المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="يقول تثبيت Windows إن git غير موجود أو إن openclaw غير معروف">
    مشكلتان شائعتان على Windows:

    **1) خطأ npm: spawn git / git غير موجود**

    - ثبّت **Git for Windows** وتأكد من أن `git` موجود في PATH.
    - أغلق PowerShell وافتحه من جديد، ثم أعِد تشغيل المثبّت.

    **2) لا يتم التعرف على openclaw بعد التثبيت**

    - مجلد npm global bin لديك غير موجود في PATH.
    - افحص المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف ذلك الدليل إلى PATH الخاص بالمستخدم لديك (لا حاجة إلى لاحقة `\bin` على Windows؛ في معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وافتحه من جديد بعد تحديث PATH.

    إذا أردت أسلس إعداد على Windows، فاستخدم **WSL2** بدلًا من Windows الأصلي.
    الوثائق: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="يعرض إخراج exec على Windows نصًا صينيًا مشوهًا - ماذا أفعل؟">
    يكون هذا عادةً عدم تطابق في صفحة ترميز وحدة التحكم على أصداف Windows الأصلية.

    الأعراض:

    - يظهر إخراج `system.run`/`exec` للصينية كنص مشوه
    - يبدو الأمر نفسه سليمًا في ملف تعريف طرفية آخر

    حل سريع في PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    ثم أعد تشغيل Gateway وأعد محاولة الأمر:

    ```powershell
    openclaw gateway restart
    ```

    إذا كان لا يزال بإمكانك إعادة إنتاج هذا على أحدث OpenClaw، فتتبّعه/أبلغ عنه في:

    - [المشكلة #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="لم تجب الوثائق عن سؤالي - كيف أحصل على إجابة أفضل؟">
    استخدم **التثبيت القابل للتعديل (git)** بحيث تكون لديك كامل المصادر والوثائق محليًا، ثم اسأل
    روبوتك (أو Claude/Codex) _من ذلك المجلد_ حتى يستطيع قراءة المستودع والإجابة بدقة.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مزيد من التفاصيل: [التثبيت](/ar/install) و[أعلام المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على Linux؟">
    الإجابة المختصرة: اتبع دليل Linux، ثم شغّل الإعداد الأولي.

    - المسار السريع على Linux + تثبيت الخدمة: [Linux](/ar/platforms/linux).
    - شرح كامل خطوة بخطوة: [البدء](/ar/start/getting-started).
    - المثبّت + التحديثات: [التثبيت والتحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على VPS؟">
    أي Linux VPS يفي بالغرض. ثبّت على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول عن بُعد: [Gateway عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أدلة تثبيت السحابة/VPS؟">
    نحتفظ **بمركز استضافة** يضم المزوّدين الشائعين. اختر واحدًا واتبع الدليل:

    - [استضافة VPS](/ar/vps) (كل المزوّدين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    كيف يعمل ذلك في السحابة: يعمل **Gateway على الخادم**، وتصل إليه
    من حاسوبك المحمول/هاتفك عبر Control UI (أو Tailscale/SSH). حالتك + مساحة عملك
    موجودتان على الخادم، لذا تعامل مع المضيف بوصفه مصدر الحقيقة وانسخه احتياطيًا.

    يمكنك إقران **العُقد** (Mac/iOS/Android/headless) بذلك Gateway السحابي للوصول إلى
    الشاشة/الكاميرا/canvas المحلية أو تشغيل الأوامر على حاسوبك المحمول مع إبقاء
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول عن بُعد: [Gateway عن بُعد](/ar/gateway/remote).
    العُقد: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني أن أطلب من OpenClaw تحديث نفسه؟">
    الإجابة المختصرة: **ممكن، غير موصى به**. يمكن لتدفق التحديث إعادة تشغيل
    Gateway (ما يقطع الجلسة النشطة)، وقد يحتاج إلى git checkout نظيف،
    ويمكن أن يطلب التأكيد. الأكثر أمانًا: شغّل التحديثات من صدفة بصفتك المشغّل.

    استخدم CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    إذا كان لا بد من الأتمتة من وكيل:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    الوثائق: [التحديث](/ar/cli/update)، [التحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="ماذا يفعل الإعداد الأولي فعليًا؟">
    `openclaw onboard` هو مسار الإعداد الموصى به. في **الوضع المحلي** يرشدك عبر:

    - **إعداد النموذج/المصادقة** (OAuth للمزوّد، مفاتيح API، setup-token من Anthropic، إضافةً إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات التمهيد
    - **إعدادات Gateway** (bind/port/auth/tailscale)
    - **القنوات** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، إضافةً إلى Plugins القنوات المضمّنة مثل QQ Bot)
    - **تثبيت Daemon** (LaunchAgent على macOS؛ وحدة systemd للمستخدم على Linux/WSL2)
    - **فحوصات الصحة** واختيار **Skills**

    ويحذّرك أيضًا إذا كان النموذج المهيأ غير معروف أو تنقصه المصادقة.

  </Accordion>

  <Accordion title="هل أحتاج إلى اشتراك Claude أو OpenAI لتشغيل هذا؟">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** (Anthropic/OpenAI/غيرهما) أو باستخدام
    **نماذج محلية فقط** بحيث تبقى بياناتك على جهازك. الاشتراكات (Claude
    Pro/Max أو OpenAI Codex) طرق اختيارية لمصادقة هؤلاء المزوّدين.

    بالنسبة إلى Anthropic في OpenClaw، التقسيم العملي هو:

    - **مفتاح Anthropic API**: فوترة Anthropic API العادية
    - **Claude CLI / مصادقة اشتراك Claude في OpenClaw**: أخبرنا موظفو Anthropic
      أن هذا الاستخدام مسموح به مجددًا، ويتعامل OpenClaw مع استخدام `claude -p`
      على أنه معتمد لهذا التكامل ما لم تنشر Anthropic سياسة جديدة

    بالنسبة إلى مضيفات Gateway طويلة الأجل، لا تزال مفاتيح Anthropic API هي الإعداد الأكثر
    قابلية للتنبؤ. دعم OpenAI Codex OAuth صريح للأدوات الخارجية
    مثل OpenClaw.

    يدعم OpenClaw أيضًا خيارات مستضافة أخرى بنمط الاشتراك، بما في ذلك
    **Qwen Cloud Coding Plan** و**MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan**.

    الوثائق: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [نماذج GLM](/ar/providers/glm)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام اشتراك Claude Max من دون مفتاح API؟">
    نعم.

    أخبرنا موظفو Anthropic أن استخدام Claude CLI بنمط OpenClaw مسموح به مجددًا، لذا
    يتعامل OpenClaw مع مصادقة اشتراك Claude واستخدام `claude -p` على أنهما معتمدان
    لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. إذا أردت
    إعدادًا من جهة الخادم أكثر قابلية للتنبؤ، فاستخدم مفتاح Anthropic API بدلًا من ذلك.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك Claude (Claude Pro أو Max)؟">
    نعم.

    أخبرنا موظفو Anthropic أن هذا الاستخدام مسموح به مجددًا، لذا يتعامل OpenClaw مع
    إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    لا يزال Anthropic setup-token متاحًا كمسار رمزي مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
    بالنسبة إلى أحمال العمل الإنتاجية أو متعددة المستخدمين، لا تزال مصادقة مفتاح Anthropic API هي
    الخيار الأكثر أمانًا وقابلية للتنبؤ. إذا أردت خيارات مستضافة أخرى بنمط الاشتراك
    في OpenClaw، فراجع [OpenAI](/ar/providers/openai)، [Qwen / Model
    Cloud](/ar/providers/qwen)، [MiniMax](/ar/providers/minimax)، و[نماذج GLM
    ](/ar/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="لماذا أرى HTTP 429 rate_limit_error من Anthropic؟">
    يعني ذلك أن **حصة/حد معدل Anthropic** لديك قد نفد للنافذة الحالية. إذا كنت
    تستخدم **Claude CLI**، فانتظر حتى يُعاد ضبط النافذة أو رقِّ خطتك. إذا كنت
    تستخدم **مفتاح Anthropic API**، فتحقق من Anthropic Console
    لمعرفة الاستخدام/الفوترة وارفع الحدود حسب الحاجة.

    إذا كانت الرسالة تحديدًا:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    الإصدار التجريبي لسياق Anthropic بحجم 1M (`context1m: true`). يعمل ذلك فقط عندما تكون
    بيانات اعتمادك مؤهلة لفوترة السياق الطويل (فوترة مفتاح API أو
    مسار تسجيل الدخول إلى Claude في OpenClaw مع تمكين الاستخدام الإضافي).

    نصيحة: اضبط **نموذجًا احتياطيًا** حتى يتمكن OpenClaw من متابعة الرد عندما يكون المزوّد محدود المعدل.
    راجع [النماذج](/ar/cli/models)، و[OAuth](/ar/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. لدى OpenClaw مزوّد **Amazon Bedrock (Converse)** مضمّن. عند وجود مؤشرات بيئة AWS، يستطيع OpenClaw اكتشاف كتالوج Bedrock للبث/النص تلقائيًا ودمجه كمزوّد `amazon-bedrock` ضمني؛ وإلا يمكنك تمكين `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحةً أو إضافة إدخال مزوّد يدوي. راجع [Amazon Bedrock](/ar/providers/bedrock) و[مزوّدو النماذج](/ar/providers/models). إذا كنت تفضل تدفق مفاتيح مُدارًا، فلا يزال استخدام وكيل متوافق مع OpenAI أمام Bedrock خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth (تسجيل الدخول إلى ChatGPT). استخدم
    `openai/gpt-5.5` مع `agentRuntime.id: "codex"` للإعداد الشائع:
    مصادقة اشتراك ChatGPT/Codex مع تنفيذ خادم تطبيق Codex الأصلي. استخدم
    `openai-codex/gpt-5.5` فقط عندما تريد OAuth الخاص بـ Codex عبر مشغّل
    PI الافتراضي. استخدم `openai/gpt-5.5` من دون تجاوز وقت تشغيل Codex للوصول
    المباشر باستخدام مفتاح API من OpenAI.
    راجع [مزوّدو النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا لا يزال OpenClaw يذكر openai-codex؟">
    `openai-codex` هو معرّف المزوّد وملف تعريف المصادقة لـ OAuth الخاص بـ ChatGPT/Codex.
    وهو أيضًا بادئة نموذج PI الصريحة لـ OAuth الخاص بـ Codex:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = مصادقة اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي
    - `openai-codex/gpt-5.5` = مسار OAuth الخاص بـ Codex في PI
    - `openai/gpt-5.5` من دون تجاوز وقت تشغيل Codex = مسار مفتاح API المباشر من OpenAI في PI
    - `openai-codex:...` = معرّف ملف تعريف المصادقة، وليس مرجع نموذج

    إذا كنت تريد مسار فوترة/حدود OpenAI Platform المباشر، فاضبط
    `OPENAI_API_KEY`. إذا كنت تريد مصادقة اشتراك ChatGPT/Codex، فسجّل الدخول باستخدام
    `openclaw models auth login --provider openai-codex`. لوقت تشغيل Codex
    الأصلي، أبقِ مرجع النموذج كـ `openai/gpt-5.5` واضبط
    `agentRuntime.id: "codex"`. استخدم مراجع نماذج `openai-codex/*` فقط لتشغيلات PI.

  </Accordion>

  <Accordion title="لماذا يمكن أن تختلف حدود OAuth الخاص بـ Codex عن ChatGPT على الويب؟">
    يستخدم OAuth الخاص بـ Codex نوافذ حصص مُدارة من OpenAI وتعتمد على الخطة. عمليًا،
    يمكن أن تختلف هذه الحدود عن تجربة موقع/تطبيق ChatGPT، حتى عندما
    يكون كلاهما مرتبطًا بالحساب نفسه.

    يستطيع OpenClaw عرض نوافذ استخدام/حصة المزوّد المرئية حاليًا في
    `openclaw models status`، لكنه لا يخترع أو يطبّع استحقاقات ChatGPT على الويب
    إلى وصول API مباشر. إذا كنت تريد مسار فوترة/حدود OpenAI Platform
    المباشر، فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك OpenAI (OAuth الخاص بـ Codex)؟">
    نعم. يدعم OpenClaw بالكامل **OAuth لاشتراك OpenAI Code (Codex)**.
    تسمح OpenAI صراحةً باستخدام OAuth الخاص بالاشتراك في الأدوات/سير العمل
    الخارجية مثل OpenClaw. يمكن للإعداد الأولي تشغيل تدفق OAuth نيابةً عنك.

    راجع [OAuth](/ar/concepts/oauth)، و[مزوّدو النماذج](/ar/concepts/model-providers)، و[الإعداد الأولي (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أُعدّ OAuth الخاص بـ Gemini CLI؟">
    يستخدم Gemini CLI **تدفق مصادقة Plugin**، وليس معرّف عميل أو سرًا في `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا حتى يكون `gemini` على `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. مكّن Plugin: `openclaw plugins enable google`
    3. سجّل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: `google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway

    يخزّن هذا رموز OAuth في ملفات تعريف المصادقة على مضيف Gateway. التفاصيل: [مزوّدو النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للمحادثات غير الرسمية؟">
    عادةً لا. يحتاج OpenClaw إلى سياق كبير + أمان قوي؛ البطاقات الصغيرة تقتطع وتتسبب في تسريب. إذا اضطررت، فشغّل **أكبر** بناء نموذج يمكنك تشغيله محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). تزيد النماذج الأصغر/المكمّمة خطر حقن المطالبات - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أبقي حركة مرور النماذج المستضافة في منطقة محددة؟">
    اختر نقاط نهاية مثبتة بالمنطقة. يوفّر OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر النسخة المستضافة في الولايات المتحدة لإبقاء البيانات داخل المنطقة. لا يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه باستخدام `models.mode: "merge"` حتى تبقى النماذج الاحتياطية متاحة مع احترام المزوّد الإقليمي الذي تختاره.
  </Accordion>

  <Accordion title="هل يجب أن أشتري Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux (Windows عبر WSL2). جهاز Mac mini اختياري - يشتريه بعض الأشخاص
    كمضيف يعمل دائمًا، لكن VPS صغيرًا أو خادمًا منزليًا أو صندوقًا من فئة Raspberry Pi يعمل أيضًا.

    تحتاج إلى Mac فقط **للأدوات الخاصة بـ macOS فقط**. بالنسبة إلى iMessage، استخدم [BlueBubbles](/ar/channels/bluebubbles) (موصى به) - يعمل خادم BlueBubbles على أي Mac، ويمكن أن يعمل Gateway على Linux أو في مكان آخر. إذا أردت أدوات أخرى خاصة بـ macOS فقط، فشغّل Gateway على Mac أو اربط Node بنظام macOS.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، و[Nodes](/ar/nodes)، و[وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **جهاز macOS ما** مسجّل الدخول إلى Messages. لا يجب أن يكون Mac mini -
    أي Mac يعمل. **استخدم [BlueBubbles](/ar/channels/bluebubbles)** (موصى به) لـ iMessage - يعمل خادم BlueBubbles على macOS، بينما يمكن أن يعمل Gateway على Linux أو في مكان آخر.

    الإعدادات الشائعة:

    - شغّل Gateway على Linux/VPS، وشغّل خادم BlueBubbles على أي Mac مسجّل الدخول إلى Messages.
    - شغّل كل شيء على Mac إذا أردت أبسط إعداد على جهاز واحد.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، و[Nodes](/ar/nodes)،
    [وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، فهل يمكنني توصيله بـ MacBook Pro؟">
    نعم. يمكن لـ **Mac mini تشغيل Gateway**، ويمكن لـ MacBook Pro الاتصال بصفة
    **node** (جهاز مرافق). لا تشغّل Nodes الـ Gateway - بل توفر قدرات إضافية
    مثل الشاشة/الكاميرا/اللوحة و`system.run` على ذلك الجهاز.

    النمط الشائع:

    - Gateway على Mac mini (يعمل دائمًا).
    - يشغّل MacBook Pro تطبيق macOS أو مضيف node ويقترن بـ Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    الوثائق: [Nodes](/ar/nodes)، و[CLI الخاص بـ Nodes](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    Bun **غير موصى به**. نرى أخطاء وقت تشغيل، خصوصًا مع WhatsApp وTelegram.
    استخدم **Node** للحصول على Gateways مستقرة.

    إذا كنت لا تزال تريد تجربة Bun، فافعل ذلك على Gateway غير إنتاجي
    من دون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ماذا يوضع في allowFrom؟">
    `channels.telegram.allowFrom` هو **معرّف مستخدم Telegram للمرسل البشري** (رقمي). وليس اسم مستخدم البوت.

    يطلب الإعداد معرّفات مستخدمين رقمية فقط. إذا كانت لديك بالفعل إدخالات `@username` قديمة في الإعدادات، فيمكن لـ `openclaw doctor --fix` محاولة حلها.

    أكثر أمانًا (من دون بوت طرف ثالث):

    - أرسل رسالة مباشرة إلى البوت الخاص بك، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    واجهة Bot API الرسمية:

    - أرسل رسالة مباشرة إلى البوت الخاص بك، ثم استدعِ `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    طرف ثالث (أقل خصوصية):

    - أرسل رسالة مباشرة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع مثيلات OpenClaw مختلفة؟">
    نعم، عبر **التوجيه متعدد الوكلاء**. اربط **الرسالة المباشرة** لكل مرسل في WhatsApp (النظير `kind: "direct"`، والمرسل بصيغة E.164 مثل `+15551234567`) بـ `agentId` مختلف، بحيث يحصل كل شخص على مساحة عمله ومخزن جلسته. لا تزال الردود تأتي من **حساب WhatsApp نفسه**، ويكون التحكم في وصول الرسائل المباشرة (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) عامًا لكل حساب WhatsApp. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "محادثة سريعة" ووكيل "Opus للبرمجة"؟'>
    نعم. استخدم التوجيه متعدد الوكلاء: امنح كل وكيل نموذجه الافتراضي الخاص، ثم اربط المسارات الواردة (حساب المزوّد أو النظراء المحددين) بكل وكيل. يوجد مثال إعداد في [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent). راجع أيضًا [النماذج](/ar/concepts/models) و[الإعدادات](/ar/gateway/configuration).
  </Accordion>

  <Accordion title="هل يعمل Homebrew على Linux؟">
    نعم. يدعم Homebrew نظام Linux (Linuxbrew). إعداد سريع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    إذا شغّلت OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` (أو بادئة brew الخاصة بك) حتى يمكن العثور على الأدوات المثبتة عبر `brew` في shells غير تسجيل الدخول.
    تضيف البنايات الحديثة أيضًا أدلة bin الشائعة للمستخدم إلى مقدمة خدمات systemd على Linux (على سبيل المثال `~/.local/bin`، و`~/.npm-global/bin`، و`~/.local/share/pnpm`، و`~/.bun/bin`) وتحترم `PNPM_HOME` و`NPM_CONFIG_PREFIX` و`BUN_INSTALL` و`VOLTA_HOME` و`ASDF_DATA_DIR` و`NVM_DIR` و`FNM_DIR` عند ضبطها.

  </Accordion>

  <Accordion title="الفرق بين تثبيت git القابل للتعديل وتثبيت npm">
    - **تثبيت قابل للتعديل (git):** نسخة كاملة من المصدر، قابلة للتحرير، والأفضل للمساهمين.
      تشغّل البنايات محليًا ويمكنك تصحيح الكود/الوثائق.
    - **تثبيت npm:** تثبيت CLI عام، بلا مستودع، والأفضل لمن يريد "تشغيله فقط."
      تأتي التحديثات من وسوم توزيع npm.

    الوثائق: [بدء الاستخدام](/ar/start/getting-started)، و[التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="هل يمكنني التبديل بين تثبيتات npm وgit لاحقًا؟">
    نعم. استخدم `openclaw update --channel ...` عندما يكون OpenClaw مثبتًا بالفعل.
    هذا **لا يحذف بياناتك** - إنه يغيّر تثبيت كود OpenClaw فقط.
    تبقى حالتك (`~/.openclaw`) ومساحة عملك (`~/.openclaw/workspace`) من دون تغيير.

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
    Gateway إلا إذا مررت `--no-restart`.

    يمكن للمثبّت فرض أي من الوضعين أيضًا:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نصائح النسخ الاحتياطي: راجع [استراتيجية النسخ الاحتياطي](/ar/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="هل ينبغي تشغيل Gateway على حاسوبي المحمول أم على VPS؟">
    الإجابة المختصرة: **إذا كنت تريد موثوقية على مدار الساعة طوال الأسبوع، فاستخدم VPS**. إذا كنت تريد
    أقل قدر من الاحتكاك ولا تمانع السكون/إعادة التشغيل، فشغّله محليًا.

    **الحاسوب المحمول (Gateway محلي)**

    - **الإيجابيات:** لا توجد تكلفة خادم، وصول مباشر إلى الملفات المحلية، نافذة متصفح مباشرة.
    - **السلبيات:** السكون/انقطاع الشبكة = انقطاع الاتصال، تحديثات/إعادات تشغيل نظام التشغيل تقاطع العمل، يجب أن يبقى الجهاز مستيقظًا.

    **VPS / السحابة**

    - **الإيجابيات:** يعمل دائمًا، شبكة مستقرة، لا مشكلات سكون للحاسوب المحمول، أسهل في إبقائه قيد التشغيل.
    - **السلبيات:** غالبًا يعمل بلا واجهة رسومية (استخدم لقطات الشاشة)، وصول عن بُعد إلى الملفات فقط، يجب استخدام SSH للتحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp/Telegram/Slack/Mattermost/Discord كلها جيدًا من VPS. المفاضلة الحقيقية الوحيدة هي **متصفح بلا واجهة رسومية** مقابل نافذة مرئية. راجع [المتصفح](/ar/tools/browser).

    **الخيار الافتراضي الموصى به:** VPS إذا واجهت انقطاعات في Gateway من قبل. المحلي ممتاز عندما تستخدم Mac بنشاط وتريد الوصول إلى الملفات المحلية أو أتمتة واجهة المستخدم باستخدام متصفح مرئي.

  </Accordion>

  <Accordion title="ما مدى أهمية تشغيل OpenClaw على جهاز مخصص؟">
    ليس مطلوبًا، لكنه **موصى به من أجل الموثوقية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Pi):** يعمل دائمًا، انقطاعات أقل بسبب السكون/إعادة التشغيل، أذونات أنظف، أسهل في إبقائه قيد التشغيل.
    - **حاسوب محمول/مكتبي مشترك:** مناسب تمامًا للاختبار والاستخدام النشط، لكن توقّع توقفات مؤقتة عندما يدخل الجهاز في وضع السكون أو يجري تحديثات.

    إذا أردت أفضل ما في الخيارين، فاحتفظ بـ Gateway على مضيف مخصص واقرن حاسوبك المحمول كـ **Node** لأدوات الشاشة/الكاميرا/التنفيذ المحلية. راجع [Nodes](/ar/nodes).
    لإرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما الحد الأدنى لمتطلبات VPS ونظام التشغيل الموصى به؟">
    OpenClaw خفيف الموارد. بالنسبة إلى Gateway أساسي + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** 1 vCPU، ذاكرة RAM بسعة 1GB، قرص بحجم ~500MB.
    - **الموصى به:** 1-2 vCPU، ذاكرة RAM بسعة 2GB أو أكثر لتوفير هامش مريح (السجلات، الوسائط، قنوات متعددة). قد تكون أدوات Node وأتمتة المتصفح كثيفة الاستهلاك للموارد.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). مسار تثبيت Linux هو الأفضل اختبارًا هناك.

    الوثائق: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw في VM وما المتطلبات؟">
    نعم. تعامل مع VM بالطريقة نفسها مثل VPS: يجب أن يكون قيد التشغيل دائمًا، ويمكن الوصول إليه، ولديه RAM كافية لـ Gateway وأي قنوات تفعّلها.

    إرشادات أساسية:

    - **الحد الأدنى المطلق:** 1 vCPU، ذاكرة RAM بسعة 1GB.
    - **الموصى به:** ذاكرة RAM بسعة 2GB أو أكثر إذا كنت تشغّل قنوات متعددة، أو أتمتة المتصفح، أو أدوات الوسائط.
    - **نظام التشغيل:** Ubuntu LTS أو Debian/Ubuntu حديث آخر.

    إذا كنت تستخدم Windows، فإن **WSL2 هو أسهل إعداد بأسلوب VM** ولديه أفضل توافق مع الأدوات. راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    إذا كنت تشغّل macOS في VM، فراجع [macOS VM](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية (النماذج، الجلسات، Gateway، الأمان، المزيد)
- [نظرة عامة على التثبيت](/ar/install)
- [بدء الاستخدام](/ar/start/getting-started)
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
