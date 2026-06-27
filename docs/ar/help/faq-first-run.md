---
read_when:
    - تثبيت جديد، أو توقّف أثناء الإعداد الأولي، أو أخطاء التشغيل الأول
    - اختيار المصادقة واشتراكات المزوّدين
    - لا يمكن الوصول إلى docs.openclaw.ai، لا يمكن فتح لوحة التحكم، التثبيت عالق
sidebarTitle: First-run FAQ
summary: 'الأسئلة الشائعة: البدء السريع وإعداد التشغيل الأول — التثبيت، الإعداد الأولي، المصادقة، الاشتراكات، الإخفاقات الأولية'
title: 'الأسئلة الشائعة: إعداد التشغيل الأول'
x-i18n:
    generated_at: "2026-06-27T17:46:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 182022cc91cea7ec4857aeb222fe1d001a1476a90c221f610616cc7da7ba8a98
    source_path: help/faq-first-run.md
    workflow: 16
---

  أسئلة وأجوبة البدء السريع والتشغيل الأول. للعمليات اليومية والنماذج والمصادقة والجلسات
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## البدء السريع وإعداد التشغيل الأول

  <AccordionGroup>
  <Accordion title="أنا عالق، أسرع طريقة للخروج من التعطل">
    استخدم وكيل ذكاء اصطناعي محليًا يمكنه **رؤية جهازك**. هذا أكثر فاعلية بكثير من السؤال
    في Discord، لأن معظم حالات "أنا عالق" تكون **مشكلات إعداد محلية أو مشكلات بيئة** لا يستطيع
    المساعدون عن بُعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    تستطيع هذه الأدوات قراءة المستودع، وتشغيل الأوامر، وفحص السجلات، والمساعدة في إصلاح إعدادات
    جهازك (PATH، الخدمات، الأذونات، ملفات المصادقة). أعطها **نسخة المصدر الكاملة** عبر
    تثبيت قابل للتعديل (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يثبّت هذا OpenClaw **من نسخة git محلية**، بحيث يستطيع الوكيل قراءة الكود + المستندات
    والاستدلال على الإصدار الدقيق الذي تشغله. يمكنك دائمًا الرجوع إلى الإصدار المستقر لاحقًا
    بإعادة تشغيل المثبّت دون `--install-method git`.

    نصيحة: اطلب من الوكيل **تخطيط الإصلاح والإشراف عليه** (خطوة بخطوة)، ثم تنفيذ
    الأوامر الضرورية فقط. هذا يبقي التغييرات صغيرة وأسهل للمراجعة.

    إذا اكتشفت خطأً حقيقيًا أو إصلاحًا، يرجى فتح مشكلة على GitHub أو إرسال PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    ابدأ بهذه الأوامر (شارك المخرجات عند طلب المساعدة):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    ما الذي تفعله:

    - `openclaw status`: لقطة سريعة لحالة Gateway/الوكيل + الإعدادات الأساسية.
    - `openclaw models status`: يتحقق من مصادقة المزوّد + توفر النماذج.
    - `openclaw doctor`: يتحقق من مشكلات الإعداد/الحالة الشائعة ويصلحها.

    فحوصات CLI مفيدة أخرى: `openclaw status --all`، `openclaw logs --follow`،
    `openclaw gateway status`، `openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان شيء ما معطلاً](/ar/help/faq#first-60-seconds-if-something-is-broken).
    مستندات التثبيت: [التثبيت](/ar/install)، [خيارات المثبّت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="يستمر Heartbeat في التخطي. ماذا تعني أسباب التخطي؟">
    أسباب تخطي Heartbeat الشائعة:

    - `quiet-hours`: خارج نافذة الساعات النشطة المضبوطة
    - `empty-heartbeat-file`: يوجد `HEARTBEAT.md` لكنه يحتوي فقط على فراغات، أو تعليقات، أو عنوان، أو سياج، أو قالب قائمة تحقق فارغ
    - `no-tasks-due`: وضع مهام `HEARTBEAT.md` نشط، لكن لم يحن موعد أي من فواصل المهام بعد
    - `alerts-disabled`: كل إظهار Heartbeat معطّل (`showOk` و`showAlerts` و`useIndicator` كلها متوقفة)

    في وضع المهام، لا تتقدم الطوابع الزمنية المستحقة إلا بعد اكتمال تشغيل Heartbeat حقيقي.
    عمليات التشغيل المتخطاة لا تعلّم المهام كمكتملة.

    المستندات: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة](/ar/automation).

  </Accordion>

  <Accordion title="الطريقة الموصى بها لتثبيت OpenClaw وإعداده">
    يوصي المستودع بالتشغيل من المصدر واستخدام الإعداد الأولي:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    يستطيع المعالج أيضًا بناء أصول واجهة المستخدم تلقائيًا. بعد الإعداد الأولي، ستشغّل عادةً Gateway على المنفذ **18789**.

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

  <Accordion title="كيف أفتح لوحة التحكم بعد الإعداد الأولي؟">
    يفتح المعالج متصفحك بعنوان URL نظيف (غير مضمّن برمز) للوحة التحكم مباشرة بعد الإعداد الأولي، ويطبع الرابط أيضًا في الملخص. أبقِ ذلك التبويب مفتوحًا؛ إذا لم يفتح، انسخ/الصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أصادق لوحة التحكم على localhost مقابل الوصول عن بُعد؟">
    **Localhost (الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلب مصادقة السر المشترك، الصق الرمز أو كلمة المرور المضبوطة في إعدادات Control UI.
    - مصدر الرمز: `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر كلمة المرور: `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يُضبط سر مشترك بعد، أنشئ رمزًا باستخدام `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** (موصى به): أبقِ الربط على local loopback، وشغّل `openclaw gateway --tailscale serve`، وافتح `https://<magicdns>/`. إذا كانت `gateway.auth.allowTailscale` تساوي `true`، فإن ترويسات الهوية تكفي لمصادقة Control UI/WebSocket (من دون لصق سر مشترك، مع افتراض أن مضيف Gateway موثوق)؛ لا تزال HTTP APIs تتطلب مصادقة السر المشترك إلا إذا استخدمت عمدًا private-ingress `none` أو مصادقة HTTP عبر trusted-proxy.
      تتم تسلسلة محاولات مصادقة Serve المتزامنة السيئة من العميل نفسه قبل أن يسجلها محدد المصادقة الفاشلة، لذلك قد تعرض إعادة المحاولة السيئة الثانية بالفعل `retry later`.
    - **ربط Tailnet**: شغّل `openclaw gateway --bind tailnet --token "<token>"` (أو اضبط مصادقة كلمة المرور)، وافتح `http://<tailscale-ip>:18789/`، ثم الصق السر المشترك المطابق في إعدادات لوحة التحكم.
    - **وكيل عكسي واعٍ بالهوية**: أبقِ Gateway خلف وكيل موثوق، واضبط `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل. تتطلب وكلاء local loopback على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`.
    - **نفق SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. لا تزال مصادقة السر المشترك تنطبق عبر النفق؛ الصق الرمز أو كلمة المرور المضبوطة إذا طُلب منك ذلك.

    راجع [لوحة التحكم](/ar/web/dashboard) و[واجهات الويب](/ar/web) لتفاصيل أوضاع الربط والمصادقة.

  </Accordion>

  <Accordion title="لماذا توجد إعدادات موافقة exec اثنان لموافقات الدردشة؟">
    تتحكم بطبقات مختلفة:

    - `approvals.exec`: يوجّه مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: يجعل تلك القناة تعمل كعميل موافقة أصلي لموافقات exec

    تظل سياسة exec الخاصة بالمضيف هي بوابة الموافقة الحقيقية. إعدادات الدردشة تتحكم فقط في مكان
    ظهور مطالبات الموافقة وكيف يمكن للناس الرد عليها.

    في معظم الإعدادات لا تحتاج إلى الاثنين معًا:

    - إذا كانت الدردشة تدعم الأوامر والردود بالفعل، فإن `/approve` في الدردشة نفسها يعمل عبر المسار المشترك.
    - إذا استطاعت قناة أصلية مدعومة استنتاج الموافقين بأمان، فإن OpenClaw يفعّل الآن تلقائيًا الموافقات الأصلية التي تبدأ برسالة مباشرة عندما تكون `channels.<channel>.execApprovals.enabled` غير مضبوطة أو `"auto"`.
    - عندما تتوفر بطاقات/أزرار الموافقة الأصلية، تكون واجهة المستخدم الأصلية هي المسار الأساسي؛ يجب ألا يضمّن الوكيل أمر `/approve` يدويًا إلا إذا قالت نتيجة الأداة إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب أيضًا توجيه المطالبات إلى دردشات أخرى أو غرف عمليات صريحة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحةً نشر مطالبات الموافقة مرة أخرى في الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة كذلك: تستخدم `/approve` في الدردشة نفسها افتراضيًا، مع توجيه `approvals.plugin` اختياري، ولا تحتفظ إلا بعض القنوات الأصلية بمعالجة الموافقة الأصلية الخاصة بـ Plugin فوق ذلك.

    الخلاصة: التوجيه مخصص للمسارات، وإعداد العميل الأصلي مخصص لتجربة قناة محددة أكثر ثراءً.
    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما بيئة التشغيل التي أحتاجها؟">
    يلزم Node **>= 22**. يوصى بـ `pnpm`. لا يوصى بـ Bun لـ Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. Gateway خفيف - تذكر المستندات أن **512MB-1GB RAM**، و**نواة واحدة**، وحوالي **500MB**
    من القرص تكفي للاستخدام الشخصي، وتشير إلى أن **Raspberry Pi 4 يمكنه تشغيله**.

    إذا أردت مساحة إضافية (السجلات، الوسائط، خدمات أخرى)، فيوصى بـ **2GB**، لكنها
    ليست حدًا أدنى صارمًا.

    نصيحة: يمكن لـ Raspberry Pi/VPS صغير استضافة Gateway، ويمكنك إقران **العُقد** على حاسوبك المحمول/هاتفك من أجل
    الشاشة/الكاميرا/اللوحة المحلية أو تنفيذ الأوامر. راجع [العُقد](/ar/nodes).

  </Accordion>

  <Accordion title="أي نصائح لتثبيتات Raspberry Pi؟">
    الخلاصة: يعمل، لكن توقع بعض الحواف الخشنة.

    - استخدم نظام تشغيل **64-bit** وأبقِ Node >= 22.
    - فضّل **التثبيت القابل للتعديل (git)** حتى تتمكن من رؤية السجلات والتحديث بسرعة.
    - ابدأ من دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات ثنائية غريبة، فعادةً ما تكون مشكلة **توافق ARM**.

    المستندات: [Linux](/ar/platforms/linux)، [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق على wake up my friend / الإعداد الأولي لا يفقس. ماذا الآن؟">
    تعتمد تلك الشاشة على إمكانية الوصول إلى Gateway والمصادقة عليه. يرسل TUI أيضًا
    "Wake up, my friend!" تلقائيًا عند أول فقس. إذا رأيت ذلك السطر مع **عدم وجود رد**
    وبقيت الرموز عند 0، فهذا يعني أن الوكيل لم يعمل.

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

    إذا كان Gateway بعيدًا، فتأكد من أن النفق/اتصال Tailscale يعمل وأن واجهة المستخدم
    تشير إلى Gateway الصحيح. راجع [الوصول عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="هل يمكنني نقل إعدادي إلى جهاز جديد (Mac mini) دون إعادة الإعداد الأولي؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغّل Doctor مرة واحدة. هذا
    يبقي روبوتك "كما هو تمامًا" (الذاكرة، سجل الجلسات، المصادقة، وحالة القنوات)
    طالما نسخت **الموقعين كليهما**:

    1. ثبّت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة عملك (الافتراضي: `~/.openclaw/workspace`).
    4. شغّل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    يحافظ ذلك على الإعدادات، وملفات تعريف المصادقة، وبيانات اعتماد WhatsApp، والجلسات، والذاكرة. إذا كنت في
    الوضع البعيد، فتذكر أن مضيف Gateway يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا كنت تلتزم/تدفع مساحة عملك فقط إلى GitHub، فأنت تنسخ احتياطيًا
    **الذاكرة + ملفات bootstrap**، لكن **ليس** سجل الجلسات أو المصادقة. هذه موجودة
    تحت `~/.openclaw/` (مثلًا `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [أين تعيش الأشياء على القرص](/ar/help/faq#where-things-live-on-disk)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أرى ما الجديد في أحدث إصدار؟">
    تحقق من سجل التغييرات على GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    أحدث الإدخالات في الأعلى. إذا كان القسم العلوي موسومًا **Unreleased**، فإن القسم المؤرخ التالي
    هو أحدث إصدار مشحون. تُجمّع الإدخالات حسب **أبرز النقاط** و**التغييرات** و
    **الإصلاحات** (بالإضافة إلى أقسام المستندات/الأخرى عند الحاجة).

  </Accordion>

  <Accordion title="لا يمكن الوصول إلى docs.openclaw.ai (خطأ SSL)">
    تحظر بعض اتصالات Comcast/Xfinity بشكل غير صحيح `docs.openclaw.ai` عبر Xfinity
    Advanced Security. عطّله أو أضف `docs.openclaw.ai` إلى قائمة السماح، ثم أعد المحاولة.
    يرجى مساعدتنا في إلغاء حظره بالإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    إذا كنت ما زلت لا تستطيع الوصول إلى الموقع، فالوثائق منعكسة على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="الفرق بين المستقر والبيتا">
    **المستقر** و**البيتا** هما **وسما توزيع npm**، وليسا مسارين منفصلين للكود:

    - `latest` = المستقر
    - `beta` = بناء مبكر للاختبار

    عادةً يصل الإصدار المستقر إلى **beta** أولًا، ثم تنقل خطوة ترقية صريحة
    الإصدار نفسه إلى `latest`. ويمكن للمشرفين أيضًا النشر مباشرةً إلى `latest` عند الحاجة. ولهذا يمكن أن يشير البيتا والمستقر
    إلى **الإصدار نفسه** بعد الترقية.

    اطّلع على ما تغيّر:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    لمعرفة أوامر التثبيت المختصرة والفرق بين البيتا والتطوير، راجع الأكورديون أدناه.

  </Accordion>

  <Accordion title="كيف أثبّت إصدار البيتا وما الفرق بين البيتا والتطوير؟">
    **البيتا** هو وسم توزيع npm باسم `beta` (قد يطابق `latest` بعد الترقية).
    **التطوير** هو الرأس المتحرك لـ `main` (git)؛ وعند نشره، يستخدم وسم توزيع npm باسم `dev`.

    أوامر مختصرة (macOS/Linux):

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

    1. **قناة التطوير (نسخة git):**

    ```bash
    openclaw update --channel dev
    ```

    يبدّل هذا إلى فرع `main` ويحدّث من المصدر.

    2. **تثبيت قابل للتعديل (من موقع المثبّت):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يمنحك ذلك مستودعًا محليًا يمكنك تعديله، ثم تحديثه عبر git.

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
    - **الإعداد الأولي:** 5-15 دقيقة حسب عدد القنوات/النماذج التي تضبطها

    إذا توقّف، استخدم [المثبّت عالق](#quick-start-and-first-run-setup)
    وحلقة التصحيح السريعة في [أنا عالق](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="المثبّت عالق؟ كيف أحصل على ملاحظات أكثر؟">
    أعد تشغيل المثبّت مع **خرج تفصيلي**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    تثبيت البيتا مع خرج تفصيلي:

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

    خيارات إضافية: [أعلام المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="تثبيت Windows يقول إن git غير موجود أو إن openclaw غير معروف">
    مشكلتان شائعتان على Windows:

    **1) خطأ npm‏ spawn git / git غير موجود**

    - ثبّت **Git for Windows** وتأكد من أن `git` موجود في PATH لديك.
    - أغلق PowerShell وافتحه مجددًا، ثم أعد تشغيل المثبّت.

    **2) openclaw غير معروف بعد التثبيت**

    - مجلد npm العام للملفات التنفيذية غير موجود في PATH.
    - تحقّق من المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف ذلك الدليل إلى PATH الخاص بالمستخدم لديك (لا حاجة إلى لاحقة `\bin` على Windows؛ في معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وافتحه مجددًا بعد تحديث PATH.

    لإعداد سطح المكتب، استخدم تطبيق **Windows Hub** الأصلي. وللإعداد من الطرفية فقط،
    يدعم كل من مثبّت PowerShell ومسارات WSL2 Gateway.
    الوثائق: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="خرج exec على Windows يعرض نصًا صينيًا مشوهًا - ماذا أفعل؟">
    يحدث هذا عادةً بسبب عدم تطابق صفحة ترميز وحدة التحكم في أصداف Windows الأصلية.

    الأعراض:

    - يعرض خرج `system.run`/`exec` الصينية كنص مشوه
    - يبدو الأمر نفسه سليمًا في ملف طرفية آخر

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

    إذا كنت ما زلت تستطيع إعادة إنتاج هذا على أحدث OpenClaw، فتتبّعه/أبلغ عنه في:

    - [المشكلة #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="لم تُجب الوثائق عن سؤالي - كيف أحصل على إجابة أفضل؟">
    استخدم **التثبيت القابل للتعديل (git)** حتى تكون لديك كامل المصادر والوثائق محليًا، ثم اسأل
    روبوتك (أو Claude/Codex) _من ذلك المجلد_ كي يتمكن من قراءة المستودع والإجابة بدقة.

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
    أي VPS يعمل بنظام Linux مناسب. ثبّت على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول عن بُعد: [Gateway عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أدلة التثبيت على السحابة/VPS؟">
    نوفر **مركز استضافة** يضم المزوّدين الشائعين. اختر واحدًا واتبع الدليل:

    - [استضافة VPS](/ar/vps) (كل المزوّدين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    كيف يعمل ذلك في السحابة: **يعمل Gateway على الخادم**، وتصل إليه
    من حاسوبك المحمول/هاتفك عبر Control UI (أو Tailscale/SSH). تعيش حالتك + مساحة عملك
    على الخادم، لذلك عامل المضيف كمصدر الحقيقة وخذ نسخة احتياطية منه.

    يمكنك إقران **العُقد** (Mac/iOS/Android/دون واجهة) مع Gateway السحابي ذلك للوصول إلى
    الشاشة/الكاميرا/اللوحة المحلية أو تشغيل أوامر على حاسوبك المحمول مع إبقاء
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول عن بُعد: [Gateway عن بُعد](/ar/gateway/remote).
    العُقد: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني أن أطلب من OpenClaw تحديث نفسه؟">
    الإجابة المختصرة: **ممكن، لكنه غير موصى به**. يمكن أن يعيد تدفق التحديث تشغيل
    Gateway (ما يسقط الجلسة النشطة)، وقد يحتاج إلى نسخة git نظيفة،
    ويمكن أن يطلب التأكيد. الأسلم: شغّل التحديثات من صدفة بصفتك المشغّل.

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

    - **إعداد النموذج/المصادقة** (OAuth للمزوّد، مفاتيح API، setup-token من Anthropic، بالإضافة إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات التهيئة الأولية
    - **إعدادات Gateway** (bind/port/auth/tailscale)
    - **القنوات** (WhatsApp وTelegram وDiscord وMattermost وSignal وiMessage، بالإضافة إلى Plugins القنوات المضمّنة مثل QQ Bot)
    - **تثبيت Daemon** (LaunchAgent على macOS؛ وحدة مستخدم systemd على Linux/WSL2)
    - **فحوصات الصحة** واختيار **Skills**

    ويحذّرك أيضًا إذا كان النموذج المضبوط غير معروف أو يفتقد المصادقة.

  </Accordion>

  <Accordion title="هل أحتاج إلى اشتراك Claude أو OpenAI لتشغيل هذا؟">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** (Anthropic/OpenAI/غيرها) أو باستخدام
    **نماذج محلية فقط** حتى تبقى بياناتك على جهازك. الاشتراكات (Claude
    Pro/Max أو OpenAI Codex) هي طرق اختيارية لمصادقة هؤلاء المزوّدين.

    بالنسبة إلى Anthropic في OpenClaw، يكون التقسيم العملي كالتالي:

    - **مفتاح Anthropic API**: فوترة Anthropic API المعتادة
    - **Claude CLI / مصادقة اشتراك Claude في OpenClaw**: أخبرنا موظفو Anthropic
      أن هذا الاستخدام مسموح به مجددًا، ويتعامل OpenClaw مع استخدام `claude -p`
      على أنه معتمد لهذا التكامل ما لم تنشر Anthropic سياسة جديدة

    بالنسبة إلى مضيفات Gateway طويلة العمر، تظل مفاتيح Anthropic API إعدادًا
    أكثر قابلية للتنبؤ. OpenAI Codex OAuth مدعوم صراحةً للأدوات الخارجية
    مثل OpenClaw.

    يدعم OpenClaw أيضًا خيارات مستضافة أخرى بأسلوب الاشتراك، منها
    **Qwen Cloud Coding Plan** و**MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan**.

    الوثائق: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [Z.AI (GLM)](/ar/providers/zai)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام اشتراك Claude Max دون مفتاح API؟">
    نعم.

    أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذلك
    يتعامل OpenClaw مع مصادقة اشتراك Claude واستخدام `claude -p` على أنهما معتمدان
    لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. إذا كنت تريد
    الإعداد الأكثر قابلية للتنبؤ من جهة الخادم، فاستخدم مفتاح Anthropic API بدلًا من ذلك.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك Claude (Claude Pro أو Max)؟">
    نعم.

    أخبرنا موظفو Anthropic أن هذا الاستخدام مسموح به مجددًا، لذلك يتعامل OpenClaw مع
    إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    لا يزال Anthropic setup-token متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
    بالنسبة إلى أعباء العمل الإنتاجية أو متعددة المستخدمين، لا تزال مصادقة مفتاح Anthropic API
    الخيار الأسلم والأكثر قابلية للتنبؤ. إذا كنت تريد خيارات مستضافة أخرى بأسلوب الاشتراك
    في OpenClaw، فراجع [OpenAI](/ar/providers/openai)، و[Qwen / Model
    Cloud](/ar/providers/qwen)، و[MiniMax](/ar/providers/minimax)، و[نماذج GLM
    ](/ar/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="لماذا أرى HTTP 429 rate_limit_error من Anthropic؟">
    يعني ذلك أن **حصة/حد معدل Anthropic** لديك قد استُنفدت للنافذة الحالية. إذا كنت
    تستخدم **Claude CLI**، فانتظر إعادة ضبط النافذة أو رقِّ خطتك. وإذا كنت
    تستخدم **مفتاح Anthropic API**، فتحقق من Anthropic Console
    للاطلاع على الاستخدام/الفوترة وارفع الحدود حسب الحاجة.

    إذا كانت الرسالة تحديدًا:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    نافذة سياق Anthropic بحجم 1M (نموذج Claude 4.x بقدرة GA يدعم 1M أو إعداد
    `context1m: true` القديم). يعمل ذلك فقط عندما تكون بيانات اعتمادك مؤهلة
    لفوترة السياق الطويل (فوترة مفتاح API أو مسار تسجيل الدخول إلى Claude في OpenClaw
    مع تفعيل Extra Usage).

    نصيحة: عيّن **نموذجًا احتياطيًا** حتى يتمكن OpenClaw من مواصلة الرد عندما يكون المزوّد محدود المعدل.
    راجع [النماذج](/ar/cli/models)، و[OAuth](/ar/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. يحتوي OpenClaw على مزوّد **Amazon Bedrock (Converse)** مضمّن. عند وجود علامات بيئة AWS، يستطيع OpenClaw اكتشاف كتالوج Bedrock للبث/النص تلقائيًا ودمجه كمزوّد `amazon-bedrock` ضمني؛ وإلا يمكنك تفعيل `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحةً أو إضافة إدخال مزوّد يدوي. راجع [Amazon Bedrock](/ar/providers/bedrock) و[مزوّدو النماذج](/ar/providers/models). إذا كنت تفضّل مسار مفاتيح مُدارًا، فلا يزال الوكيل المتوافق مع OpenAI أمام Bedrock خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth (تسجيل الدخول إلى ChatGPT). استخدم
    `openai/gpt-5.5` للإعداد الشائع: مصادقة اشتراك ChatGPT/Codex بالإضافة إلى
    تنفيذ خادم تطبيق Codex الأصلي. مراجع GPT القديمة لـ Codex هي
    إعدادات قديمة يصلحها `openclaw doctor --fix`. يظل الوصول المباشر بمفتاح OpenAI API
    متاحًا لأسطح OpenAI API غير الوكيلية، ولنماذج الوكلاء
    عبر ملف تعريف مفتاح API مرتّب من `openai`.
    راجع [مزوّدو النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا لا يزال OpenClaw يذكر بادئة OpenAI Codex القديمة؟">
    `openai` هو معرّف المزوّد وملف تعريف المصادقة لكل من مفاتيح OpenAI API و
    OAuth الخاص بـ ChatGPT/Codex. قد لا تزال ترى بادئة OpenAI Codex القديمة في الإعدادات القديمة و
    تحذيرات الترحيل.
    استخدمت الإعدادات الأقدم هذه البادئة أيضًا كبادئة نموذج:

    - `openai/gpt-5.5` = مصادقة اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي لدورات الوكيل
    - مرجع GPT-5.5 القديم لـ Codex = مسار نموذج قديم يصلحه `openclaw doctor --fix`
    - `openai/gpt-5.5` مع ملف تعريف مفتاح API مرتّب من `openai` = مصادقة مفتاح API لنموذج وكيل OpenAI
    - معرّفات ملفات تعريف مصادقة Codex القديمة = معرّف ملف تعريف مصادقة قديم يرحّله `openclaw doctor --fix`

    إذا أردت مسار فوترة/حدود OpenAI Platform المباشر، فعيّن
    `OPENAI_API_KEY`. إذا أردت مصادقة اشتراك ChatGPT/Codex، فسجّل الدخول باستخدام
    `openclaw models auth login --provider openai`. أبقِ مرجع النموذج كما هو
    `openai/gpt-5.5`؛ مراجع نماذج Codex القديمة هي إعدادات قديمة
    يعيد `openclaw doctor --fix` كتابتها.

  </Accordion>

  <Accordion title="لماذا قد تختلف حدود OAuth الخاصة بـ Codex عن ChatGPT على الويب؟">
    يستخدم OAuth الخاص بـ Codex نوافذ حصة تديرها OpenAI وتعتمد على الخطة. عمليًا،
    يمكن أن تختلف هذه الحدود عن تجربة موقع/تطبيق ChatGPT، حتى عندما
    يكون كلاهما مرتبطًا بالحساب نفسه.

    يستطيع OpenClaw عرض نوافذ استخدام/حصة المزوّد المرئية حاليًا في
    `openclaw models status`، لكنه لا ينشئ أو يطبّع استحقاقات ChatGPT على الويب
    إلى وصول API مباشر. إذا أردت مسار فوترة/حدود OpenAI Platform
    المباشر، فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك OpenAI (OAuth الخاص بـ Codex)؟">
    نعم. يدعم OpenClaw بالكامل **OAuth لاشتراك OpenAI Code (Codex)**.
    تسمح OpenAI صراحةً باستخدام OAuth للاشتراكات في الأدوات/سير العمل الخارجية
    مثل OpenClaw. يمكن للإعداد الأولي تشغيل تدفق OAuth نيابةً عنك.

    راجع [OAuth](/ar/concepts/oauth)، و[مزوّدو النماذج](/ar/concepts/model-providers)، و[الإعداد الأولي (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أعدّ OAuth الخاص بـ Gemini CLI؟">
    يستخدم Gemini CLI **تدفق مصادقة Plugin**، وليس معرّف عميل أو سرًا في `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا بحيث يكون `gemini` ضمن `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. فعّل Plugin: `openclaw plugins enable google`
    3. سجّل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: `google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway

    يخزّن هذا رموز OAuth في ملفات تعريف المصادقة على مضيف Gateway. التفاصيل: [مزوّدو النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للمحادثات العادية؟">
    عادةً لا. يحتاج OpenClaw إلى سياق كبير + أمان قوي؛ البطاقات الصغيرة تقطع المحتوى وتسرّبه. إذا كان لا بد من ذلك، فشغّل **أكبر** بناء نموذج يمكنك تشغيله محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). تزيد النماذج الأصغر/المكمّمة خطر حقن التعليمات - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أبقي حركة مرور النماذج المستضافة في منطقة محددة؟">
    اختر نقاط نهاية مقيّدة بالمنطقة. يوفّر OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر المتغير المستضاف في الولايات المتحدة لإبقاء البيانات داخل المنطقة. لا يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه الخيارات باستخدام `models.mode: "merge"` حتى تبقى البدائل الاحتياطية متاحة مع احترام المزوّد الإقليمي الذي تختاره.
  </Accordion>

  <Accordion title="هل يجب أن أشتري Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux (Windows عبر WSL2). جهاز Mac mini اختياري - يشتريه بعض الأشخاص
    كمضيف دائم التشغيل، لكن خادم VPS صغيرًا أو خادمًا منزليًا أو جهازًا من فئة Raspberry Pi يعمل أيضًا.

    تحتاج إلى Mac فقط **لأدوات macOS فقط**. بالنسبة إلى iMessage، استخدم [iMessage](/ar/channels/imessage) مع `imsg` على أي Mac مسجّل الدخول إلى Messages. إذا كان Gateway يعمل على Linux أو في مكان آخر، فعيّن `channels.imessage.cliPath` إلى غلاف SSH يشغّل `imsg` على ذلك الـ Mac. إذا أردت أدوات أخرى خاصة بـ macOS فقط، فشغّل Gateway على Mac أو اربط عقدة macOS.

    الوثائق: [iMessage](/ar/channels/imessage)، و[العُقد](/ar/nodes)، و[وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **جهاز macOS ما** مسجّل الدخول إلى Messages. ليس من الضروري أن يكون Mac mini -
    أي Mac يعمل. **استخدم [iMessage](/ar/channels/imessage)** مع `imsg`؛ يمكن أن يعمل Gateway على ذلك الـ Mac، أو يمكن أن يعمل في مكان آخر مع غلاف SSH في `cliPath`.

    الإعدادات الشائعة:

    - شغّل Gateway على Linux/VPS، وعيّن `channels.imessage.cliPath` إلى غلاف SSH يشغّل `imsg` على Mac مسجّل الدخول إلى Messages.
    - شغّل كل شيء على الـ Mac إذا أردت أبسط إعداد على جهاز واحد.

    الوثائق: [iMessage](/ar/channels/imessage)، و[العُقد](/ar/nodes)،
    [وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، هل يمكنني توصيله بجهاز MacBook Pro الخاص بي؟">
    نعم. يمكن أن **يشغّل Mac mini الـ Gateway**، ويمكن لجهاز MacBook Pro الخاص بك الاتصال بصفته
    **عقدة** (جهازًا مرافقًا). لا تشغّل العُقد Gateway - بل توفّر
    قدرات إضافية مثل الشاشة/الكاميرا/اللوحة و`system.run` على ذلك الجهاز.

    النمط الشائع:

    - Gateway على Mac mini (دائم التشغيل).
    - يشغّل MacBook Pro تطبيق macOS أو مضيف عقدة ويرتبط بـ Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    المستندات: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    لا يُوصى باستخدام Bun. نلاحظ أخطاء في وقت التشغيل، خصوصًا مع WhatsApp وTelegram.
    استخدم **Node** للحصول على Gateways مستقرة.

    إذا كنت لا تزال تريد تجربة Bun، فافعل ذلك على Gateway غير إنتاجي
    من دون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ما الذي يوضع في allowFrom؟">
    `channels.telegram.allowFrom` هو **معرّف مستخدم Telegram للمرسل البشري** (رقمي). وليس اسم مستخدم البوت.

    يطلب الإعداد معرّفات مستخدمين رقمية فقط. إذا كانت لديك بالفعل إدخالات `@username` قديمة في الإعدادات، يمكن لـ `openclaw doctor --fix` محاولة حلّها.

    أكثر أمانًا (من دون بوت تابع لجهة خارجية):

    - أرسل رسالة خاصة إلى البوت، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    Bot API الرسمي:

    - أرسل رسالة خاصة إلى البوت، ثم استدعِ `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    جهة خارجية (أقل خصوصية):

    - أرسل رسالة خاصة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع نُسخ OpenClaw مختلفة؟">
    نعم، عبر **توجيه متعدد الوكلاء**. اربط **الرسالة الخاصة** في WhatsApp لكل مرسل (النظير `kind: "direct"`، والمرسل بصيغة E.164 مثل `+15551234567`) بـ `agentId` مختلف، بحيث يحصل كل شخص على مساحة عمل ومخزن جلسات خاص به. لا تزال الردود تأتي من **حساب WhatsApp نفسه**، والتحكم في الوصول إلى الرسائل الخاصة (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) عام لكل حساب WhatsApp. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "محادثة سريعة" ووكيل "Opus للبرمجة"؟'>
    نعم. استخدم التوجيه متعدد الوكلاء: امنح كل وكيل نموذجه الافتراضي الخاص، ثم اربط المسارات الواردة (حساب المزوّد أو نظراء محددين) بكل وكيل. يوجد مثال للإعداد في [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent). راجع أيضًا [النماذج](/ar/concepts/models) و[الإعدادات](/ar/gateway/configuration).
  </Accordion>

  <Accordion title="هل يعمل Homebrew على Linux؟">
    نعم. يدعم Homebrew نظام Linux (Linuxbrew). إعداد سريع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    إذا شغّلت OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` (أو بادئة brew لديك) حتى تُحلّ الأدوات المثبتة عبر `brew` في الأصداف غير الخاصة بتسجيل الدخول.
    تضيف الإصدارات الحديثة أيضًا أدلة bin الشائعة للمستخدم في خدمات systemd على Linux إلى بداية المسار (مثل `~/.local/bin` و`~/.npm-global/bin` و`~/.local/share/pnpm` و`~/.bun/bin`) وتراعي `PNPM_HOME` و`NPM_CONFIG_PREFIX` و`BUN_INSTALL` و`VOLTA_HOME` و`ASDF_DATA_DIR` و`NVM_DIR` و`FNM_DIR` عند تعيينها.

  </Accordion>

  <Accordion title="الفرق بين تثبيت git القابل للتعديل وتثبيت npm">
    - **تثبيت قابل للتعديل (git):** نسخة كاملة من المصدر، قابلة للتحرير، وهي الأفضل للمساهمين.
      تشغّل عمليات البناء محليًا ويمكنك تعديل الكود/المستندات.
    - **تثبيت npm:** تثبيت CLI عام، بلا مستودع، وهو الأفضل لمن يريد "تشغيله فقط".
      تأتي التحديثات من وسوم التوزيع في npm.

    المستندات: [بدء الاستخدام](/ar/start/getting-started)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="هل يمكنني التبديل بين تثبيت npm وgit لاحقًا؟">
    نعم. استخدم `openclaw update --channel ...` عندما يكون OpenClaw مثبتًا بالفعل.
    هذا **لا يحذف بياناتك** - بل يغيّر فقط تثبيت كود OpenClaw.
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
    متابعات Doctor، ويحدّث مصادر Plugin للقناة المستهدفة، ويعيد
    تشغيل Gateway ما لم تمرّر `--no-restart`.

    يمكن للمثبّت فرض أي من الوضعين أيضًا:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نصائح النسخ الاحتياطي: راجع [استراتيجية النسخ الاحتياطي](/ar/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="هل ينبغي تشغيل Gateway على حاسوبي المحمول أم على VPS؟">
    الإجابة المختصرة: **إذا كنت تريد موثوقية على مدار الساعة، فاستخدم VPS**. إذا كنت تريد
    أقل قدر من التعقيد ولا تمانع السكون/إعادة التشغيل، فشغّله محليًا.

    **الحاسوب المحمول (Gateway محلي)**

    - **الإيجابيات:** لا توجد تكلفة خادم، وصول مباشر إلى الملفات المحلية، نافذة متصفح مباشرة.
    - **السلبيات:** السكون/انقطاع الشبكة = انقطاع الاتصال، تحديثات نظام التشغيل/إعادة التشغيل تسبب توقفًا، ويجب أن يبقى الجهاز مستيقظًا.

    **VPS / السحابة**

    - **الإيجابيات:** يعمل دائمًا، شبكة مستقرة، لا مشكلات سكون للحاسوب المحمول، وأسهل في إبقائه قيد التشغيل.
    - **السلبيات:** غالبًا يعمل بلا واجهة مرئية (استخدم لقطات الشاشة)، وصول إلى الملفات عن بُعد فقط، ويجب استخدام SSH للتحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp/Telegram/Slack/Mattermost/Discord كلها جيدًا من VPS. المفاضلة الحقيقية الوحيدة هي **متصفح بلا واجهة مرئية** مقابل نافذة مرئية. راجع [المتصفح](/ar/tools/browser).

    **الإعداد الافتراضي الموصى به:** VPS إذا سبق أن واجهت انقطاعات في Gateway. التشغيل المحلي ممتاز عندما تستخدم Mac بنشاط وتريد الوصول إلى الملفات المحلية أو أتمتة الواجهة مع متصفح مرئي.

  </Accordion>

  <Accordion title="ما مدى أهمية تشغيل OpenClaw على جهاز مخصص؟">
    ليس مطلوبًا، لكنه **موصى به للموثوقية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Raspberry Pi):** يعمل دائمًا، انقطاعات أقل بسبب السكون/إعادة التشغيل، أذونات أنظف، وأسهل في إبقائه قيد التشغيل.
    - **حاسوب محمول/مكتبي مشترك:** مناسب تمامًا للاختبار والاستخدام النشط، لكن توقّع توقفات مؤقتة عندما يدخل الجهاز في السكون أو يُحدَّث.

    إذا كنت تريد أفضل ما في الخيارين، فأبقِ Gateway على مضيف مخصص واقرن حاسوبك المحمول بصفته **عقدة** لأدوات الشاشة/الكاميرا/التنفيذ المحلية. راجع [العُقد](/ar/nodes).
    للحصول على إرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما الحد الأدنى لمتطلبات VPS وما نظام التشغيل الموصى به؟">
    OpenClaw خفيف الوزن. من أجل Gateway أساسي + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** 1 vCPU، وذاكرة RAM بسعة 1GB، ومساحة قرص تقارب 500MB.
    - **الموصى به:** 1-2 vCPU، وذاكرة RAM بسعة 2GB أو أكثر لتوفير هامش إضافي (السجلات، الوسائط، القنوات المتعددة). قد تكون أدوات Node وأتمتة المتصفح كثيرة الاستهلاك للموارد.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). مسار التثبيت على Linux هو الأفضل اختبارًا هناك.

    المستندات: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw في VM وما المتطلبات؟">
    نعم. تعامل مع VM كما تتعامل مع VPS: يجب أن يكون قيد التشغيل دائمًا، وقابلًا للوصول، ولديه ذاكرة
    RAM كافية لـ Gateway وأي قنوات تفعّلها.

    إرشادات الأساس:

    - **الحد الأدنى المطلق:** 1 vCPU، وذاكرة RAM بسعة 1GB.
    - **الموصى به:** ذاكرة RAM بسعة 2GB أو أكثر إذا شغّلت قنوات متعددة، أو أتمتة المتصفح، أو أدوات الوسائط.
    - **نظام التشغيل:** Ubuntu LTS أو Debian/Ubuntu حديث آخر.

    إذا كنت تستخدم Windows، فاستخدم **Windows Hub** لإعداد سطح المكتب، أو WSL2 عندما
    تريد تحديدًا VM لـ Gateway بنمط Linux مع توافق واسع
    مع الأدوات. راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    إذا كنت تشغّل macOS في VM، فراجع [macOS VM](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية (النماذج، الجلسات، Gateway، الأمان، والمزيد)
- [نظرة عامة على التثبيت](/ar/install)
- [بدء الاستخدام](/ar/start/getting-started)
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
