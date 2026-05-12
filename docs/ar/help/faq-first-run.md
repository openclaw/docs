---
read_when:
    - تثبيت جديد، أو تعثّر الإعداد الأولي، أو أخطاء التشغيل الأول
    - اختيار المصادقة واشتراكات المزوّدين
    - يتعذر الوصول إلى docs.openclaw.ai، ولا يمكن فتح لوحة المعلومات، والتثبيت عالق
sidebarTitle: First-run FAQ
summary: 'الأسئلة الشائعة: إعداد البدء السريع والتشغيل الأول — التثبيت، والتهيئة الأولية، والمصادقة، والاشتراكات، والإخفاقات الأولية'
title: 'الأسئلة الشائعة: إعداد التشغيل الأول'
x-i18n:
    generated_at: "2026-05-12T00:59:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24ce8cda091fd7d1bdcb405d421a1a3cabb134c3cc36b42f11b9b3f97782794b
    source_path: help/faq-first-run.md
    workflow: 16
---

  بدء سريع وأسئلة وأجوبة التشغيل الأول. للعمليات اليومية، والنماذج، والمصادقة، والجلسات،
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## البدء السريع وإعداد التشغيل الأول

  <AccordionGroup>
  <Accordion title="أنا عالق، ما أسرع طريقة للخروج من المشكلة؟">
    استخدم وكيل ذكاء اصطناعي محليًا يمكنه **رؤية جهازك**. هذا أكثر فاعلية بكثير من السؤال
    في Discord، لأن معظم حالات "أنا عالق" تكون **مشكلات إعداد محلية أو مشكلات بيئة**
    لا يستطيع المساعدون عن بُعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    يمكن لهذه الأدوات قراءة المستودع، وتشغيل الأوامر، وفحص السجلات، والمساعدة في إصلاح إعدادك
    على مستوى الجهاز (PATH، والخدمات، والأذونات، وملفات المصادقة). امنحها **نسخة المصدر الكاملة**
    عبر تثبيت قابل للتعديل (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يؤدي هذا إلى تثبيت OpenClaw **من نسخة git**، بحيث يستطيع الوكيل قراءة الكود + المستندات
    والاستدلال على الإصدار الدقيق الذي تشغّله. يمكنك دائمًا الرجوع إلى الإصدار المستقر لاحقًا
    بإعادة تشغيل المثبّت دون `--install-method git`.

    نصيحة: اطلب من الوكيل **تخطيط الإصلاح والإشراف عليه** (خطوة بخطوة)، ثم تنفيذ الأوامر
    الضرورية فقط. هذا يبقي التغييرات صغيرة وأسهل في المراجعة.

    إذا اكتشفت خطأً حقيقيًا أو إصلاحًا، فيُرجى فتح مشكلة على GitHub أو إرسال PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    ابدأ بهذه الأوامر (شارك المخرجات عند طلب المساعدة):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    ما الذي تفعله:

    - `openclaw status`: لقطة سريعة لحالة gateway/agent + الإعداد الأساسي.
    - `openclaw models status`: يتحقق من مصادقة المزوّد + توفر النموذج.
    - `openclaw doctor`: يتحقق من مشكلات الإعداد/الحالة الشائعة ويصلحها.

    فحوصات CLI مفيدة أخرى: `openclaw status --all`، و`openclaw logs --follow`،
    و`openclaw gateway status`، و`openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان هناك شيء معطّل](/ar/help/faq#first-60-seconds-if-something-is-broken).
    مستندات التثبيت: [التثبيت](/ar/install)، [رايات المثبّت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="يتخطى Heartbeat باستمرار. ماذا تعني أسباب التخطي؟">
    أسباب تخطي heartbeat الشائعة:

    - `quiet-hours`: خارج نافذة ساعات النشاط المضبوطة
    - `empty-heartbeat-file`: يوجد `HEARTBEAT.md` لكنه يحتوي فقط على هيكل فارغ/رؤوس فقط
    - `no-tasks-due`: وضع المهام في `HEARTBEAT.md` نشط، لكن لم يحن موعد أي من فواصل المهام بعد
    - `alerts-disabled`: كل ظهور heartbeat معطّل (`showOk` و`showAlerts` و`useIndicator` كلها متوقفة)

    في وضع المهام، لا يتم تقديم الطوابع الزمنية المستحقة إلا بعد اكتمال تشغيل heartbeat حقيقي.
    لا تُعلّم عمليات التشغيل المتخطاة المهام كمكتملة.

    المستندات: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة](/ar/automation).

  </Accordion>

  <Accordion title="الطريقة الموصى بها لتثبيت OpenClaw وإعداده">
    يوصي المستودع بالتشغيل من المصدر واستخدام الإعداد التمهيدي:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    يمكن للمعالج أيضًا بناء أصول الواجهة تلقائيًا. بعد الإعداد التمهيدي، ستشغّل عادةً Gateway على المنفذ **18789**.

    من المصدر (للمساهمين/التطوير):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    إذا لم يكن لديك تثبيت عام بعد، شغّله عبر `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="كيف أفتح لوحة التحكم بعد الإعداد التمهيدي؟">
    يفتح المعالج متصفحك بعنوان URL نظيف للوحة التحكم (غير مضمّن برمز) مباشرةً بعد الإعداد التمهيدي، ويطبع الرابط أيضًا في الملخص. أبقِ ذلك التبويب مفتوحًا؛ إذا لم يفتح، انسخ/الصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أصادق لوحة التحكم على localhost مقارنةً بالوصول البعيد؟">
    **Localhost (الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلب مصادقة السر المشترك، فالصق الرمز أو كلمة المرور المضبوطة في إعدادات واجهة التحكم.
    - مصدر الرمز: `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر كلمة المرور: `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يتم ضبط سر مشترك بعد، فأنشئ رمزًا باستخدام `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** (موصى به): أبقِ الربط على local loopback، وشغّل `openclaw gateway --tailscale serve`، وافتح `https://<magicdns>/`. إذا كانت `gateway.auth.allowTailscale` تساوي `true`، فإن رؤوس الهوية تفي بمصادقة واجهة التحكم/WebSocket (لا حاجة للصق سر مشترك، مع افتراض أن مضيف Gateway موثوق)؛ لا تزال HTTP APIs تتطلب مصادقة السر المشترك ما لم تستخدم عمدًا `none` للإدخال الخاص أو مصادقة HTTP عبر وكيل موثوق.
      تتم تسلسلة محاولات مصادقة Serve المتزامنة الخاطئة من العميل نفسه قبل أن يسجلها محدد فشل المصادقة، لذلك قد تعرض إعادة المحاولة الخاطئة الثانية بالفعل `retry later`.
    - **ربط Tailnet**: شغّل `openclaw gateway --bind tailnet --token "<token>"` (أو اضبط مصادقة كلمة المرور)، وافتح `http://<tailscale-ip>:18789/`، ثم الصق السر المشترك المطابق في إعدادات لوحة التحكم.
    - **وكيل عكسي واعٍ بالهوية**: أبقِ Gateway خلف وكيل موثوق، واضبط `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل. تتطلب وكلاء local loopback على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`.
    - **نفق SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. لا تزال مصادقة السر المشترك تنطبق عبر النفق؛ الصق الرمز أو كلمة المرور المضبوطة إذا طُلب منك ذلك.

    راجع [لوحة التحكم](/ar/web/dashboard) و[أسطح الويب](/ar/web) لمعرفة أوضاع الربط وتفاصيل المصادقة.

  </Accordion>

  <Accordion title="لماذا توجد إعدادات موافقة تنفيذ اثنان لموافقات الدردشة؟">
    إنها تتحكم في طبقات مختلفة:

    - `approvals.exec`: تمرر مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: يجعل تلك القناة تعمل كعميل موافقة أصلي لموافقات التنفيذ

    لا تزال سياسة تنفيذ المضيف هي بوابة الموافقة الحقيقية. إعدادات الدردشة تتحكم فقط في مكان ظهور
    مطالبات الموافقة وكيف يمكن للأشخاص الرد عليها.

    في معظم الإعدادات لا تحتاج إلى كليهما:

    - إذا كانت الدردشة تدعم بالفعل الأوامر والردود، فإن `/approve` في الدردشة نفسها يعمل عبر المسار المشترك.
    - إذا كان بإمكان قناة أصلية مدعومة استنتاج الموافقين بأمان، فإن OpenClaw يفعّل الآن الموافقات الأصلية المعتمدة على الرسائل المباشرة أولًا تلقائيًا عندما تكون `channels.<channel>.execApprovals.enabled` غير مضبوطة أو `"auto"`.
    - عندما تتوفر بطاقات/أزرار الموافقة الأصلية، تكون تلك الواجهة الأصلية هي المسار الأساسي؛ ويجب على الوكيل ألا يضمّن أمر `/approve` يدويًا إلا إذا قالت نتيجة الأداة إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب أيضًا تمرير المطالبات إلى دردشات أخرى أو غرف عمليات صريحة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحةً نشر مطالبات الموافقة مرة أخرى في الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة مرة أخرى: تستخدم `/approve` في الدردشة نفسها افتراضيًا، مع تمرير اختياري عبر `approvals.plugin`، وتُبقي بعض القنوات الأصلية فقط معالجة الموافقة الأصلية لـ Plugin فوق ذلك.

    الخلاصة: التمرير مخصص للتوجيه، وإعداد العميل الأصلي مخصص لتجربة استخدام أغنى خاصة بالقناة.
    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما بيئة التشغيل التي أحتاجها؟">
    يلزم Node **>= 22**. يوصى باستخدام `pnpm`. لا يوصى باستخدام Bun مع Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. Gateway خفيف - تذكر المستندات أن **512MB-1GB RAM** و**نواة واحدة** وحوالي **500MB**
    من مساحة القرص تكفي للاستخدام الشخصي، وتشير إلى أن **Raspberry Pi 4 يمكنه تشغيله**.

    إذا أردت هامشًا إضافيًا (سجلات، ووسائط، وخدمات أخرى)، فيوصى بـ **2GB**، لكنه
    ليس حدًا أدنى صارمًا.

    نصيحة: يمكن لـ Pi/VPS صغير استضافة Gateway، ويمكنك إقران **العُقد** على حاسوبك المحمول/هاتفك من أجل
    الشاشة/الكاميرا/اللوحة المحلية أو تنفيذ الأوامر. راجع [العُقد](/ar/nodes).

  </Accordion>

  <Accordion title="هل من نصائح لتثبيت Raspberry Pi؟">
    الخلاصة: يعمل، لكن توقّع بعض الحواف الخشنة.

    - استخدم نظام تشغيل **64-bit** وحافظ على Node >= 22.
    - فضّل **التثبيت القابل للتعديل (git)** حتى تتمكن من رؤية السجلات والتحديث بسرعة.
    - ابدأ من دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات ثنائية غريبة، فهي عادةً مشكلة **توافق ARM**.

    المستندات: [Linux](/ar/platforms/linux)، [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق عند wake up my friend / الإعداد التمهيدي لا يفقس. ماذا الآن؟">
    تعتمد تلك الشاشة على كون Gateway قابلًا للوصول ومصادقًا. يرسل TUI أيضًا
    "Wake up, my friend!" تلقائيًا عند أول فقس. إذا رأيت ذلك السطر مع **عدم وجود رد**
    وبقاء الرموز عند 0، فهذا يعني أن الوكيل لم يعمل مطلقًا.

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

    3. إذا ظل عالقًا، شغّل:

    ```bash
    openclaw doctor
    ```

    إذا كان Gateway بعيدًا، فتأكد من أن النفق/اتصال Tailscale يعمل وأن الواجهة
    تشير إلى Gateway الصحيح. راجع [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="هل يمكنني ترحيل إعدادي إلى جهاز جديد (Mac mini) دون إعادة الإعداد التمهيدي؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغّل Doctor مرة واحدة. هذا
    يبقي بوتك "كما هو تمامًا" (الذاكرة، وسجل الجلسات، والمصادقة، وحالة القنوات)
    ما دمت تنسخ **كلا** الموقعين:

    1. ثبّت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة عملك (الافتراضي: `~/.openclaw/workspace`).
    4. شغّل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    يحافظ ذلك على الإعداد، وملفات تعريف المصادقة، وبيانات اعتماد WhatsApp، والجلسات، والذاكرة. إذا كنت في
    الوضع البعيد، فتذكّر أن مضيف gateway يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا كنت تلتزم/تدفع مساحة عملك فقط إلى GitHub، فأنت تنسخ احتياطيًا
    **الذاكرة + ملفات bootstrap**، لكن **ليس** سجل الجلسات أو المصادقة. هذه موجودة
    تحت `~/.openclaw/` (على سبيل المثال `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [أين توجد الأشياء على القرص](/ar/help/faq#where-things-live-on-disk)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أرى ما الجديد في أحدث إصدار؟">
    تحقق من سجل تغييرات GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    أحدث الإدخالات في الأعلى. إذا كان القسم العلوي موسومًا **غير منشور**، فإن القسم المؤرخ التالي
    هو أحدث إصدار تم شحنه. تُجمّع الإدخالات حسب **أبرز الميزات** و**التغييرات** و
    **الإصلاحات** (بالإضافة إلى أقسام المستندات/الأقسام الأخرى عند الحاجة).

  </Accordion>

  <Accordion title="لا يمكن الوصول إلى docs.openclaw.ai (خطأ SSL)">
    تحظر بعض اتصالات Comcast/Xfinity نطاق `docs.openclaw.ai` خطأً عبر Xfinity
    Advanced Security. عطّله أو أضف `docs.openclaw.ai` إلى قائمة السماح، ثم أعد المحاولة.
    يُرجى مساعدتنا في رفع الحظر عنه بالإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    إذا كنت لا تزال غير قادر على الوصول إلى الموقع، فالمستندات منسوخة على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Difference between stable and beta">
    **المستقر** و**بيتا** هما **وسما توزيع npm**، وليسا خطي شيفرة منفصلين:

    - `latest` = مستقر
    - `beta` = إصدار مبكر للاختبار

    عادة، يصل الإصدار المستقر إلى **بيتا** أولا، ثم تنقل خطوة
    ترقية صريحة ذلك الإصدار نفسه إلى `latest`. يمكن للمشرفين أيضا
    النشر مباشرة إلى `latest` عند الحاجة. لهذا يمكن أن يشير بيتا والمستقر
    إلى **الإصدار نفسه** بعد الترقية.

    راجع ما تغير:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    للحصول على أوامر التثبيت المختصرة والفرق بين بيتا ونسخة التطوير، راجع الأكورديون أدناه.

  </Accordion>

  <Accordion title="How do I install the beta version and what is the difference between beta and dev?">
    **بيتا** هو وسم توزيع npm `beta` (قد يطابق `latest` بعد الترقية).
    **التطوير** هو الرأس المتحرك لفرع `main` (git)؛ وعند نشره، يستخدم وسم توزيع npm `dev`.

    أوامر مختصرة (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مثبت Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    تفاصيل أكثر: [قنوات التطوير](/ar/install/development-channels) و[أعلام المثبت](/ar/install/installer).

  </Accordion>

  <Accordion title="How do I try the latest bits?">
    خياران:

    1. **قناة التطوير (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    يبدل هذا إلى فرع `main` ويحدث من المصدر.

    2. **تثبيت قابل للتعديل (من موقع المثبت):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يمنحك ذلك مستودعا محليا يمكنك تحريره، ثم تحديثه عبر git.

    إذا كنت تفضل استنساخا نظيفا يدويا، فاستخدم:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    الوثائق: [التحديث](/ar/cli/update)، [قنوات التطوير](/ar/install/development-channels)،
    [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="How long does install and onboarding usually take?">
    دليل تقريبي:

    - **التثبيت:** من 2 إلى 5 دقائق
    - **الإعداد الأولي:** من 5 إلى 15 دقيقة بحسب عدد القنوات/النماذج التي تضبطها

    إذا توقف، فاستخدم [تعطل المثبت](#quick-start-and-first-run-setup)
    وحلقة التصحيح السريعة في [أنا عالق](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer stuck? How do I get more feedback?">
    أعد تشغيل المثبت مع **مخرجات تفصيلية**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    تثبيت بيتا مع مخرجات تفصيلية:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    لتثبيت قابل للتعديل (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    المكافئ في Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    خيارات أكثر: [أعلام المثبت](/ar/install/installer).

  </Accordion>

  <Accordion title="Windows install says git not found or openclaw not recognized">
    مشكلتان شائعتان في Windows:

    **1) خطأ npm spawn git / لم يتم العثور على git**

    - ثبت **Git for Windows** وتأكد من أن `git` موجود في PATH.
    - أغلق PowerShell وأعد فتحه، ثم شغل المثبت من جديد.

    **2) لا يتم التعرف على openclaw بعد التثبيت**

    - مجلد bin العام في npm غير موجود في PATH.
    - تحقق من المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف ذلك الدليل إلى PATH الخاص بالمستخدم (لا حاجة إلى لاحقة `\bin` في Windows؛ في معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وأعد فتحه بعد تحديث PATH.

    إذا كنت تريد أسلس إعداد على Windows، فاستخدم **WSL2** بدلا من Windows الأصلي.
    الوثائق: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec output shows garbled Chinese text - what should I do?">
    يكون هذا عادة عدم تطابق في صفحة ترميز الطرفية على أغلفة Windows الأصلية.

    الأعراض:

    - تعرض مخرجات `system.run`/`exec` النص الصيني كنص مشوه
    - يبدو الأمر نفسه سليما في ملف تعريف طرفية آخر

    حل سريع في PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    ثم أعد تشغيل Gateway وجرب الأمر مرة أخرى:

    ```powershell
    openclaw gateway restart
    ```

    إذا ظل بإمكانك إعادة إنتاج ذلك على أحدث OpenClaw، فتتبعه/أبلغ عنه في:

    - [المشكلة #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="The docs did not answer my question - how do I get a better answer?">
    استخدم **التثبيت القابل للتعديل (git)** ليكون لديك المصدر الكامل والوثائق محليا، ثم اسأل
    بوتك (أو Claude/Codex) _من ذلك المجلد_ حتى يتمكن من قراءة المستودع والإجابة بدقة.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    تفاصيل أكثر: [التثبيت](/ar/install) و[أعلام المثبت](/ar/install/installer).

  </Accordion>

  <Accordion title="How do I install OpenClaw on Linux?">
    الإجابة المختصرة: اتبع دليل Linux، ثم شغل الإعداد الأولي.

    - المسار السريع في Linux + تثبيت الخدمة: [Linux](/ar/platforms/linux).
    - شرح كامل خطوة بخطوة: [البدء](/ar/start/getting-started).
    - المثبت + التحديثات: [التثبيت والتحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="How do I install OpenClaw on a VPS?">
    يعمل أي VPS يعمل بنظام Linux. ثبته على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول عن بعد: [Gateway عن بعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="Where are the cloud/VPS install guides?">
    نحتفظ **بمركز استضافة** يضم المزودين الشائعين. اختر واحدا واتبع الدليل:

    - [استضافة VPS](/ar/vps) (كل المزودين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    طريقة عمله في السحابة: **يعمل Gateway على الخادم**، وتصل إليه
    من الحاسوب المحمول/الهاتف عبر واجهة التحكم (أو Tailscale/SSH). حالتك + مساحة عملك
    موجودتان على الخادم، لذا تعامل مع المضيف باعتباره مصدر الحقيقة وخذ نسخة احتياطية منه.

    يمكنك إقران **العقد** (Mac/iOS/Android/بدون واجهة) مع ذلك Gateway السحابي للوصول
    إلى الشاشة/الكاميرا/اللوحة المحلية أو تشغيل أوامر على حاسوبك المحمول مع إبقاء
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول عن بعد: [Gateway عن بعد](/ar/gateway/remote).
    العقد: [العقد](/ar/nodes)، [CLI العقد](/ar/cli/nodes).

  </Accordion>

  <Accordion title="Can I ask OpenClaw to update itself?">
    الإجابة المختصرة: **ممكن، لكنه غير موصى به**. يمكن لمسار التحديث إعادة تشغيل
    Gateway (ما يسقط الجلسة النشطة)، وقد يحتاج إلى git checkout نظيف،
    ويمكن أن يطلب تأكيدا. الأكثر أمانا: شغل التحديثات من shell بصفتك المشغل.

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

  <Accordion title="What does onboarding actually do?">
    `openclaw onboard` هو مسار الإعداد الموصى به. في **الوضع المحلي** يرشدك عبر:

    - **إعداد النموذج/المصادقة** (OAuth للمزود، مفاتيح API، رمز إعداد Anthropic، إضافة إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات التمهيد
    - **إعدادات Gateway** (الربط/المنفذ/المصادقة/tailscale)
    - **القنوات** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، إضافة إلى Plugins القنوات المضمنة مثل QQ Bot)
    - **تثبيت Daemon** (LaunchAgent على macOS؛ وحدة مستخدم systemd على Linux/WSL2)
    - **فحوصات الصحة** واختيار **Skills**

    كما يحذر إذا كان النموذج المضبوط غير معروف أو يفتقد المصادقة.

  </Accordion>

  <Accordion title="Do I need a Claude or OpenAI subscription to run this?">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** (Anthropic/OpenAI/غيرها) أو باستخدام
    **نماذج محلية فقط** بحيث تبقى بياناتك على جهازك. الاشتراكات (Claude
    Pro/Max أو OpenAI Codex) هي طرق اختيارية لمصادقة هؤلاء المزودين.

    بالنسبة إلى Anthropic في OpenClaw، يكون التقسيم العملي كالتالي:

    - **مفتاح Anthropic API**: فوترة Anthropic API العادية
    - **مصادقة Claude CLI / اشتراك Claude في OpenClaw**: أخبرنا موظفو Anthropic
      أن هذا الاستخدام مسموح به مرة أخرى، ويتعامل OpenClaw مع استخدام `claude -p`
      على أنه معتمد لهذا التكامل ما لم تنشر Anthropic سياسة جديدة

    بالنسبة إلى مضيفي Gateway طويل الأمد، تظل مفاتيح Anthropic API هي الإعداد
    الأكثر قابلية للتنبؤ. OpenAI Codex OAuth مدعوم صراحة للأدوات الخارجية
    مثل OpenClaw.

    يدعم OpenClaw أيضا خيارات أخرى مستضافة بنمط الاشتراك، بما في ذلك
    **Qwen Cloud Coding Plan** و**MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan**.

    الوثائق: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [نماذج GLM](/ar/providers/glm)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="Can I use Claude Max subscription without an API key?">
    نعم.

    أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك
    يتعامل OpenClaw مع مصادقة اشتراك Claude واستخدام `claude -p` على أنهما معتمدان
    لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. إذا كنت تريد
    إعدادا جانب الخادم أكثر قابلية للتنبؤ، فاستخدم مفتاح Anthropic API بدلا من ذلك.

  </Accordion>

  <Accordion title="Do you support Claude subscription auth (Claude Pro or Max)?">
    نعم.

    أخبرنا موظفو Anthropic أن هذا الاستخدام مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع
    إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    لا يزال رمز إعداد Anthropic متاحا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
    بالنسبة إلى أحمال عمل الإنتاج أو متعددة المستخدمين، تظل مصادقة مفتاح Anthropic API
    الخيار الأكثر أمانا وقابلية للتنبؤ. إذا كنت تريد خيارات مستضافة أخرى
    بنمط الاشتراك في OpenClaw، فراجع [OpenAI](/ar/providers/openai)، [Qwen / Model
    Cloud](/ar/providers/qwen)، [MiniMax](/ar/providers/minimax)، و[نماذج GLM](/ar/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Why am I seeing HTTP 429 rate_limit_error from Anthropic?">
    يعني ذلك أن **حصة/حد معدل Anthropic** لديك قد استنفدت للنافذة الحالية. إذا كنت
    تستخدم **Claude CLI**، فانتظر حتى يعاد ضبط النافذة أو رق خطة اشتراكك. إذا كنت
    تستخدم **مفتاح Anthropic API**، فتحقق من Anthropic Console
    لمعرفة الاستخدام/الفوترة وارفع الحدود حسب الحاجة.

    إذا كانت الرسالة تحديدا:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    بيتا سياق 1M من Anthropic (`context1m: true`). لا يعمل ذلك إلا عندما تكون
    بيانات اعتمادك مؤهلة لفوترة السياق الطويل (فوترة مفتاح API أو مسار
    تسجيل دخول Claude في OpenClaw مع تفعيل Extra Usage).

    نصيحة: عيّن **نموذجًا احتياطيًا** حتى يتمكن OpenClaw من متابعة الرد عندما يكون مزود محدودًا بمعدل الاستخدام.
    راجع [النماذج](/ar/cli/models)، و[OAuth](/ar/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. يحتوي OpenClaw على مزود **Amazon Bedrock (Converse)** مضمّن. عند وجود مؤشرات بيئة AWS، يستطيع OpenClaw اكتشاف كتالوج Bedrock للبث/النص تلقائيًا ودمجه كمزود `amazon-bedrock` ضمني؛ وإلا يمكنك تفعيل `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحةً أو إضافة إدخال مزود يدوي. راجع [Amazon Bedrock](/ar/providers/bedrock) و[مزودو النماذج](/ar/providers/models). إذا كنت تفضل تدفق مفاتيح مُدارًا، فلا يزال استخدام وكيل متوافق مع OpenAI أمام Bedrock خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth (تسجيل الدخول إلى ChatGPT). استخدم
    `openai/gpt-5.5` للإعداد الشائع: مصادقة اشتراك ChatGPT/Codex بالإضافة إلى
    تنفيذ خادم تطبيق Codex الأصلي. مراجع نماذج `openai-codex/gpt-*`
    هي إعدادات قديمة يصلحها `openclaw doctor --fix`. يظل الوصول المباشر بمفتاح OpenAI API
    متاحًا لأسطح OpenAI API غير الخاصة بالوكلاء ولنماذج الوكلاء
    عبر ملف تعريف مفتاح API مرتب لـ `openai-codex`.
    راجع [مزودو النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا لا يزال OpenClaw يذكر openai-codex؟">
    `openai-codex` هو معرّف المزود وملف تعريف المصادقة لـ OAuth الخاص بـ ChatGPT/Codex.
    استخدمت الإعدادات الأقدم هذا أيضًا كبادئة نموذج:

    - `openai/gpt-5.5` = مصادقة اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي لدورات الوكيل
    - `openai-codex/gpt-5.5` = مسار نموذج قديم يصلحه `openclaw doctor --fix`
    - `openai/gpt-5.5` بالإضافة إلى ملف تعريف مفتاح API مرتب لـ `openai-codex` = مصادقة مفتاح API لنموذج وكيل OpenAI
    - `openai-codex:...` = معرّف ملف تعريف المصادقة، وليس مرجع نموذج

    إذا أردت مسار الفوترة/الحدود المباشر لـ OpenAI Platform، فعيّن
    `OPENAI_API_KEY`. إذا أردت مصادقة اشتراك ChatGPT/Codex، فسجّل الدخول باستخدام
    `openclaw models auth login --provider openai-codex`. أبقِ مرجع النموذج على
    `openai/gpt-5.5`؛ مراجع نماذج `openai-codex/*` هي إعدادات قديمة
    يعيد `openclaw doctor --fix` كتابتها.

  </Accordion>

  <Accordion title="لماذا قد تختلف حدود Codex OAuth عن ChatGPT على الويب؟">
    يستخدم Codex OAuth نوافذ حصة مُدارة من OpenAI وتعتمد على الخطة. عمليًا،
    قد تختلف هذه الحدود عن تجربة موقع/تطبيق ChatGPT، حتى عندما
    يكون كلاهما مرتبطًا بالحساب نفسه.

    يستطيع OpenClaw عرض نوافذ استخدام/حصة المزود المرئية حاليًا في
    `openclaw models status`، لكنه لا يخترع استحقاقات ChatGPT على الويب
    أو يطبعها كصلاحية وصول مباشر إلى API. إذا أردت مسار الفوترة/الحدود المباشر لـ OpenAI Platform،
    فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك OpenAI (Codex OAuth)؟">
    نعم. يدعم OpenClaw بالكامل **OAuth لاشتراك OpenAI Code (Codex)**.
    تسمح OpenAI صراحةً باستخدام OAuth الخاص بالاشتراك في الأدوات/تدفقات العمل الخارجية
    مثل OpenClaw. يمكن للإعداد الأولي تشغيل تدفق OAuth نيابةً عنك.

    راجع [OAuth](/ar/concepts/oauth)، و[مزودو النماذج](/ar/concepts/model-providers)، و[الإعداد الأولي (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أعدّ Gemini CLI OAuth؟">
    يستخدم Gemini CLI **تدفق مصادقة Plugin**، وليس معرّف عميل أو سرًا في `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا بحيث يكون `gemini` موجودًا على `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. فعّل Plugin: `openclaw plugins enable google`
    3. سجّل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: `google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway

    يخزّن هذا رموز OAuth في ملفات تعريف المصادقة على مضيف Gateway. التفاصيل: [مزودو النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للمحادثات العادية؟">
    غالبًا لا. يحتاج OpenClaw إلى سياق كبير + أمان قوي؛ البطاقات الصغيرة تقتطع وتسرّب. إذا كان لا بد من ذلك، فشغّل **أكبر** بناء نموذج يمكنك تشغيله محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). تزيد النماذج الأصغر/المكمّمة خطر حقن الموجهات - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أبقي حركة مرور النموذج المستضاف في منطقة محددة؟">
    اختر نقاط نهاية مثبتة بالمنطقة. يوفّر OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر النسخة المستضافة في الولايات المتحدة لإبقاء البيانات داخل المنطقة. لا يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه باستخدام `models.mode: "merge"` حتى تظل النماذج الاحتياطية متاحة مع احترام المزود الإقليمي الذي تختاره.
  </Accordion>

  <Accordion title="هل يجب أن أشتري Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux (Windows عبر WSL2). جهاز Mac mini اختياري - يشتريه بعض الأشخاص
    كمضيف دائم التشغيل، لكن VPS صغيرًا أو خادمًا منزليًا أو صندوقًا من فئة Raspberry Pi يعمل أيضًا.

    تحتاج إلى Mac فقط **للأدوات الخاصة بـ macOS فقط**. بالنسبة إلى iMessage، استخدم [iMessage](/ar/channels/imessage) مع `imsg` على أي Mac مسجل الدخول إلى Messages. إذا كان Gateway يعمل على Linux أو في مكان آخر، فعيّن `channels.imessage.cliPath` إلى غلاف SSH يشغّل `imsg` على ذلك الـ Mac. إذا أردت أدوات أخرى خاصة بـ macOS فقط، فشغّل Gateway على Mac أو أقرن Node macOS.

    الوثائق: [iMessage](/ar/channels/imessage)، [Nodes](/ar/nodes)، [وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **جهاز macOS ما** مسجل الدخول إلى Messages. لا يجب **أن يكون** Mac mini -
    أي Mac يفي بالغرض. **استخدم [iMessage](/ar/channels/imessage)** مع `imsg`؛ يمكن أن يعمل Gateway على ذلك الـ Mac، أو يمكن أن يعمل في مكان آخر مع غلاف SSH `cliPath`.

    الإعدادات الشائعة:

    - شغّل Gateway على Linux/VPS، وعيّن `channels.imessage.cliPath` إلى غلاف SSH يشغّل `imsg` على Mac مسجل الدخول إلى Messages.
    - شغّل كل شيء على الـ Mac إذا أردت أبسط إعداد على جهاز واحد.

    الوثائق: [iMessage](/ar/channels/imessage)، [Nodes](/ar/nodes)،
    [وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، هل يمكنني توصيله بـ MacBook Pro الخاص بي؟">
    نعم. يمكن لـ **Mac mini تشغيل Gateway**، ويمكن لـ MacBook Pro الخاص بك الاتصال كـ
    **Node** (جهاز مرافق). لا تشغّل Nodes الـ Gateway - بل توفر
    قدرات إضافية مثل الشاشة/الكاميرا/اللوحة و`system.run` على ذلك الجهاز.

    النمط الشائع:

    - Gateway على Mac mini (دائم التشغيل).
    - يشغّل MacBook Pro تطبيق macOS أو مضيف Node ويقترن بـ Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    الوثائق: [Nodes](/ar/nodes)، [CLI الخاص بـ Nodes](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    Bun **غير موصى به**. نرى أخطاء وقت تشغيل، خاصةً مع WhatsApp وTelegram.
    استخدم **Node** لبوابات مستقرة.

    إذا كنت لا تزال تريد تجربة Bun، فافعل ذلك على Gateway غير إنتاجي
    بدون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ما الذي يوضع في allowFrom؟">
    `channels.telegram.allowFrom` هو **معرّف مستخدم Telegram للمرسل البشري** (رقمي). وليس اسم مستخدم البوت.

    يطلب الإعداد معرّفات المستخدمين الرقمية فقط. إذا كانت لديك بالفعل إدخالات `@username` قديمة في الإعدادات، يمكن لـ `openclaw doctor --fix` محاولة حلها.

    أكثر أمانًا (بدون بوت تابع لجهة خارجية):

    - أرسل رسالة مباشرة إلى البوت، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    Bot API الرسمية:

    - أرسل رسالة مباشرة إلى البوت، ثم استدعِ `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    جهة خارجية (أقل خصوصية):

    - أرسل رسالة مباشرة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع مثيلات OpenClaw مختلفة؟">
    نعم، عبر **توجيه متعدد الوكلاء**. اربط **الرسالة المباشرة** لكل مرسل في WhatsApp (نظير `kind: "direct"`، والمرسل بتنسيق E.164 مثل `+15551234567`) بـ `agentId` مختلف، بحيث يحصل كل شخص على مساحة عمل ومخزن جلسات خاصين به. ستظل الردود صادرة من **حساب WhatsApp نفسه**، ويكون التحكم في وصول الرسائل المباشرة (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) عامًا لكل حساب WhatsApp. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "محادثة سريعة" ووكيل "Opus للبرمجة"؟'>
    نعم. استخدم التوجيه متعدد الوكلاء: امنح كل وكيل نموذجه الافتراضي الخاص، ثم اربط المسارات الواردة (حساب المزود أو نظراء محددين) بكل وكيل. يوجد مثال إعداد في [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent). راجع أيضًا [النماذج](/ar/concepts/models) و[الإعدادات](/ar/gateway/configuration).
  </Accordion>

  <Accordion title="هل يعمل Homebrew على Linux؟">
    نعم. يدعم Homebrew نظام Linux (Linuxbrew). إعداد سريع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    إذا شغّلت OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` (أو بادئة brew الخاصة بك) حتى تُحل أدوات `brew` المثبتة في الصدف غير الخاصة بتسجيل الدخول.
    تضيف البنيات الحديثة أيضًا أدلة bin الشائعة للمستخدم في خدمات Linux systemd (على سبيل المثال `~/.local/bin`، و`~/.npm-global/bin`، و`~/.local/share/pnpm`، و`~/.bun/bin`) وتحترم `PNPM_HOME` و`NPM_CONFIG_PREFIX` و`BUN_INSTALL` و`VOLTA_HOME` و`ASDF_DATA_DIR` و`NVM_DIR` و`FNM_DIR` عند تعيينها.

  </Accordion>

  <Accordion title="الفرق بين تثبيت git القابل للتعديل وتثبيت npm">
    - **تثبيت قابل للتعديل (git):** نسخة كاملة من المصدر، قابلة للتحرير، والأفضل للمساهمين.
      تشغّل عمليات البناء محليًا ويمكنك تعديل الكود/الوثائق.
    - **تثبيت npm:** تثبيت CLI عالمي، بدون مستودع، والأفضل لمن يريد "تشغيله فقط".
      تأتي التحديثات من وسوم توزيع npm.

    الوثائق: [بدء الاستخدام](/ar/start/getting-started)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="هل يمكنني التبديل بين تثبيتات npm وgit لاحقًا؟">
    نعم. استخدم `openclaw update --channel ...` عندما يكون OpenClaw مثبتًا بالفعل.
    هذا **لا يحذف بياناتك** - بل يغير تثبيت كود OpenClaw فقط.
    تظل حالتك (`~/.openclaw`) ومساحة عملك (`~/.openclaw/workspace`) دون تغيير.

    من npm إلى git:

    ```bash
    openclaw update --channel dev
    ```

    من git إلى npm:

    ```bash
    openclaw update --channel stable
    ```

    أضف `--dry-run` لمعاينة تبديل الوضع المخطط له أولًا. يشغّل المحدّث
    متابعات Doctor، ويحدّث مصادر Plugin للقناة المستهدفة، ويعيد
    تشغيل Gateway ما لم تمرر `--no-restart`.

    يمكن للمثبّت فرض أي من الوضعين أيضًا:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نصائح النسخ الاحتياطي: راجع [استراتيجية النسخ الاحتياطي](/ar/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="هل يجب أن أشغّل Gateway على حاسوبي المحمول أم على VPS؟">
    الإجابة المختصرة: **إذا أردت موثوقية 24/7، فاستخدم VPS**. إذا أردت
    أقل قدر من التعقيد ولا تمانع السكون/إعادة التشغيل، فشغّله محليًا.

    **الحاسوب المحمول (Gateway محلي)**

    - **الإيجابيات:** لا تكلفة خادم، وصول مباشر إلى الملفات المحلية، نافذة متصفح حية.
    - **السلبيات:** السكون/انقطاع الشبكة = انقطاعات اتصال، تحديثات/إعادات تشغيل نظام التشغيل تقاطع العمل، يجب أن يبقى مستيقظًا.

    **VPS / السحابة**

    - **الإيجابيات:** يعمل دائمًا، شبكة مستقرة، لا مشكلات نوم الحاسوب المحمول، أسهل في إبقائه قيد التشغيل.
    - **السلبيات:** غالبًا يعمل بلا واجهة مرئية (استخدم لقطات الشاشة)، الوصول إلى الملفات عن بُعد فقط، ويجب استخدام SSH للتحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp/Telegram/Slack/Mattermost/Discord كلها بشكل جيد من VPS. المفاضلة الحقيقية الوحيدة هي **متصفح بلا واجهة مرئية** مقابل نافذة مرئية. راجع [المتصفح](/ar/tools/browser).

    **الإعداد الافتراضي الموصى به:** VPS إذا واجهت انقطاعات في Gateway سابقًا. المحلي رائع عندما تستخدم Mac بنشاط وتريد الوصول المحلي إلى الملفات أو أتمتة واجهة المستخدم مع متصفح مرئي.

  </Accordion>

  <Accordion title="ما مدى أهمية تشغيل OpenClaw على جهاز مخصص؟">
    ليس مطلوبًا، لكنه **موصى به للاعتمادية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Pi):** يعمل دائمًا، انقطاعات أقل بسبب النوم/إعادة التشغيل، أذونات أنظف، وأسهل في إبقائه قيد التشغيل.
    - **حاسوب محمول/مكتبي مشترك:** مناسب تمامًا للاختبار والاستخدام النشط، لكن توقّع توقفات مؤقتة عندما يدخل الجهاز في وضع السكون أو يُحدَّث.

    إذا أردت أفضل ما في الخيارين، فأبقِ Gateway على مضيف مخصص واقرن حاسوبك المحمول باعتباره **Node** لأدوات الشاشة/الكاميرا/التنفيذ المحلية. راجع [Nodes](/ar/nodes).
    للحصول على إرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما الحد الأدنى لمتطلبات VPS ونظام التشغيل الموصى به؟">
    OpenClaw خفيف الوزن. للحصول على Gateway أساسي + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** 1 vCPU، ذاكرة RAM بسعة 1GB، قرص بسعة ~500MB.
    - **الموصى به:** 1-2 vCPU، ذاكرة RAM بسعة 2GB أو أكثر لهامش إضافي (السجلات، الوسائط، القنوات المتعددة). يمكن أن تكون أدوات Node وأتمتة المتصفح مستهلكة للموارد.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). مسار التثبيت على Linux هو الأفضل اختبارًا هناك.

    الوثائق: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw في VM وما المتطلبات؟">
    نعم. تعامل مع VM مثل VPS: يجب أن يكون قيد التشغيل دائمًا، وقابلًا للوصول، ولديه ذاكرة
    RAM كافية لـ Gateway وأي قنوات تفعّلها.

    إرشادات الأساس:

    - **الحد الأدنى المطلق:** 1 vCPU، ذاكرة RAM بسعة 1GB.
    - **الموصى به:** ذاكرة RAM بسعة 2GB أو أكثر إذا كنت تشغّل قنوات متعددة، أو أتمتة المتصفح، أو أدوات الوسائط.
    - **نظام التشغيل:** Ubuntu LTS أو Debian/Ubuntu حديث آخر.

    إذا كنت تستخدم Windows، فإن **WSL2 هو أسهل إعداد بأسلوب VM** ولديه أفضل توافق
    مع الأدوات. راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    إذا كنت تشغّل macOS في VM، فراجع [macOS VM](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية (النماذج، الجلسات، Gateway، الأمان، والمزيد)
- [نظرة عامة على التثبيت](/ar/install)
- [بدء الاستخدام](/ar/start/getting-started)
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
