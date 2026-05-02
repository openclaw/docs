---
read_when:
    - تثبيت جديد، أو توقّف الإعداد الأولي، أو أخطاء التشغيل الأول
    - اختيار المصادقة واشتراكات المزوّدين
    - لا يمكن الوصول إلى docs.openclaw.ai، ولا يمكن فتح لوحة التحكم، والتثبيت عالق
sidebarTitle: First-run FAQ
summary: 'الأسئلة الشائعة: إعداد البدء السريع والتشغيل الأول — التثبيت، التهيئة، المصادقة، الاشتراكات، الإخفاقات الأولية'
title: 'الأسئلة الشائعة: إعداد التشغيل الأول'
x-i18n:
    generated_at: "2026-05-02T07:31:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 469fbd24fea69d91c5b0408dff9c7d7b2382f9c59430a1d5331cb5dcabdce295
    source_path: help/faq-first-run.md
    workflow: 16
---

  أسئلة وأجوبة البدء السريع والتشغيل الأول. للعمليات اليومية والنماذج والمصادقة والجلسات
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## البدء السريع وإعداد التشغيل الأول

  <AccordionGroup>
  <Accordion title="أنا عالق، ما أسرع طريقة للخروج من المشكلة">
    استخدم وكيل ذكاء اصطناعي محليًا يمكنه **رؤية جهازك**. هذا أكثر فعالية بكثير من السؤال
    في Discord، لأن معظم حالات "أنا عالق" تكون **مشكلات إعداد محلية أو بيئة محلية** لا يستطيع
    المساعدون عن بُعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    تستطيع هذه الأدوات قراءة المستودع، وتشغيل الأوامر، وفحص السجلات، والمساعدة في إصلاح إعداداتك
    على مستوى الجهاز (PATH، الخدمات، الأذونات، ملفات المصادقة). امنحها **نسخة كاملة من المصدر** عبر
    التثبيت القابل للتعديل (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يثبّت هذا OpenClaw **من نسخة git**، بحيث يستطيع الوكيل قراءة الشيفرة + الوثائق
    والتفكير في الإصدار الدقيق الذي تشغّله. يمكنك دائمًا الرجوع إلى الإصدار المستقر لاحقًا
    بإعادة تشغيل المثبّت دون `--install-method git`.

    نصيحة: اطلب من الوكيل **تخطيط الإصلاح والإشراف عليه** (خطوة بخطوة)، ثم تنفيذ الأوامر
    الضرورية فقط. هذا يبقي التغييرات صغيرة وأسهل في المراجعة.

    إذا اكتشفت خطأً حقيقيًا أو إصلاحًا، فالرجاء فتح issue على GitHub أو إرسال PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    ابدأ بهذه الأوامر (شارك المخرجات عند طلب المساعدة):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    ما الذي تفعله:

    - `openclaw status`: لقطة سريعة لحالة Gateway/الوكيل + الإعداد الأساسي.
    - `openclaw models status`: يفحص مصادقة المزوّد + توفر النماذج.
    - `openclaw doctor`: يتحقق من مشكلات الإعداد/الحالة الشائعة ويصلحها.

    فحوصات CLI مفيدة أخرى: `openclaw status --all`، `openclaw logs --follow`،
    `openclaw gateway status`، `openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان هناك شيء معطّل](#first-60-seconds-if-something-is-broken).
    وثائق التثبيت: [التثبيت](/ar/install)، [أعلام المثبّت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="Heartbeat يستمر في التخطي. ماذا تعني أسباب التخطي؟">
    أسباب تخطي Heartbeat الشائعة:

    - `quiet-hours`: خارج نافذة الساعات النشطة المضبوطة
    - `empty-heartbeat-file`: يوجد `HEARTBEAT.md` لكنه يحتوي فقط على سقالات فارغة/برؤوس فقط
    - `no-tasks-due`: وضع مهام `HEARTBEAT.md` نشط، لكن لم يحِن موعد أي من فواصل المهام بعد
    - `alerts-disabled`: تم تعطيل كل مرئية Heartbeat (`showOk`، و`showAlerts`، و`useIndicator` كلها متوقفة)

    في وضع المهام، لا تتقدم الطوابع الزمنية المستحقة إلا بعد اكتمال تشغيل Heartbeat حقيقي.
    عمليات التشغيل المتخطاة لا تضع علامة اكتمال على المهام.

    الوثائق: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="الطريقة الموصى بها لتثبيت OpenClaw وإعداده">
    يوصي المستودع بالتشغيل من المصدر واستخدام الإعداد التمهيدي:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    يمكن للمعالج أيضًا بناء أصول واجهة المستخدم تلقائيًا. بعد الإعداد التمهيدي، تشغّل عادةً Gateway على المنفذ **18789**.

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

  <Accordion title="كيف أفتح لوحة المعلومات بعد الإعداد التمهيدي؟">
    يفتح المعالج متصفحك بعنوان URL نظيف (غير مضمّن برمز) للوحة المعلومات مباشرة بعد الإعداد التمهيدي، ويطبع الرابط أيضًا في الملخص. أبقِ تلك علامة التبويب مفتوحة؛ إذا لم تُفتح، انسخ/الصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أصادق لوحة المعلومات على localhost مقابل الوصول عن بُعد؟">
    **Localhost (الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلب مصادقة بسر مشترك، فالصق الرمز أو كلمة المرور المضبوطة في إعدادات Control UI.
    - مصدر الرمز: `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر كلمة المرور: `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يتم ضبط سر مشترك بعد، فأنشئ رمزًا باستخدام `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** (موصى به): أبقِ الربط على loopback، وشغّل `openclaw gateway --tailscale serve`، وافتح `https://<magicdns>/`. إذا كان `gateway.auth.allowTailscale` هو `true`، فتلبي رؤوس الهوية مصادقة Control UI/WebSocket (لا حاجة إلى لصق سر مشترك، مع افتراض أن مضيف Gateway موثوق)؛ لا تزال واجهات HTTP APIs تتطلب مصادقة السر المشترك ما لم تستخدم عمدًا private-ingress `none` أو مصادقة HTTP عبر trusted-proxy.
      تتم تسلسلية محاولات مصادقة Serve المتزامنة السيئة من العميل نفسه قبل أن يسجلها محدد فشل المصادقة، لذلك قد تُظهر إعادة المحاولة السيئة الثانية بالفعل `retry later`.
    - **ربط Tailnet**: شغّل `openclaw gateway --bind tailnet --token "<token>"` (أو اضبط مصادقة كلمة المرور)، وافتح `http://<tailscale-ip>:18789/`، ثم الصق السر المشترك المطابق في إعدادات لوحة المعلومات.
    - **وكيل عكسي واعٍ بالهوية**: أبقِ Gateway خلف وكيل موثوق، واضبط `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل. تتطلب وكلاء loopback على المضيف نفسه ضبط `gateway.auth.trustedProxy.allowLoopback = true` صراحة.
    - **نفق SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. لا تزال مصادقة السر المشترك مطبقة عبر النفق؛ الصق الرمز أو كلمة المرور المضبوطة إذا طُلب منك ذلك.

    راجع [لوحة المعلومات](/ar/web/dashboard) و[أسطح الويب](/ar/web) للاطلاع على أوضاع الربط وتفاصيل المصادقة.

  </Accordion>

  <Accordion title="لماذا يوجد إعدادا موافقة exec لموافقات الدردشة؟">
    يتحكمان في طبقات مختلفة:

    - `approvals.exec`: يوجه مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: يجعل ذلك القناة تعمل كعميل موافقة أصلي لموافقات exec

    لا تزال سياسة exec للمضيف هي بوابة الموافقة الحقيقية. لا يتحكم إعداد الدردشة إلا في مكان ظهور
    مطالبات الموافقة وكيف يمكن للأشخاص الإجابة عنها.

    في معظم الإعدادات، لا تحتاج إلى **كليهما**:

    - إذا كانت الدردشة تدعم بالفعل الأوامر والردود، فستعمل `/approve` في الدردشة نفسها عبر المسار المشترك.
    - إذا استطاعت قناة أصلية مدعومة استنتاج الموافقين بأمان، فسيقوم OpenClaw الآن بتمكين الموافقات الأصلية التي تبدأ بالرسائل المباشرة تلقائيًا عندما يكون `channels.<channel>.execApprovals.enabled` غير مضبوط أو `"auto"`.
    - عندما تتوفر بطاقات/أزرار الموافقة الأصلية، تكون واجهة المستخدم الأصلية هي المسار الأساسي؛ وينبغي ألا يضمّن الوكيل أمر `/approve` يدويًا إلا إذا قالت نتيجة الأداة إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب أيضًا توجيه المطالبات إلى دردشات أخرى أو غرف عمليات صريحة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحة نشر مطالبات الموافقة مرة أخرى في الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة أيضًا: تستخدم `/approve` في الدردشة نفسها افتراضيًا، وتوجيه `approvals.plugin` اختياريًا، ولا تحتفظ سوى بعض القنوات الأصلية بمعالجة plugin-approval-native فوق ذلك.

    الخلاصة: التوجيه مخصص للمسارات، وإعداد العميل الأصلي مخصص لتجربة مستخدم أغنى خاصة بالقناة.
    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما بيئة التشغيل التي أحتاجها؟">
    يلزم Node **>= 22**. يوصى باستخدام `pnpm`. لا يوصى باستخدام Bun مع Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. Gateway خفيف - تذكر الوثائق أن **512MB-1GB RAM**، و**نواة واحدة**، ونحو **500MB**
    من مساحة القرص كافية للاستخدام الشخصي، وتشير إلى أن **Raspberry Pi 4 يمكنه تشغيله**.

    إذا أردت مساحة إضافية (سجلات، وسائط، خدمات أخرى)، فيوصى بـ **2GB**، لكنها
    ليست حدًا أدنى صارمًا.

    نصيحة: يمكن لجهاز Pi/VPS صغير استضافة Gateway، ويمكنك إقران **nodes** على حاسوبك المحمول/هاتفك من أجل
    الشاشة/الكاميرا/canvas المحلية أو تنفيذ الأوامر. راجع [Nodes](/ar/nodes).

  </Accordion>

  <Accordion title="أي نصائح لتثبيت Raspberry Pi؟">
    الخلاصة: يعمل، لكن توقع بعض الحواف الخشنة.

    - استخدم نظام تشغيل **64-bit** وأبقِ Node >= 22.
    - فضّل **التثبيت القابل للتعديل (git)** حتى تتمكن من رؤية السجلات والتحديث بسرعة.
    - ابدأ دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات ثنائية غريبة، فهي عادةً مشكلة **توافق ARM**.

    الوثائق: [Linux](/ar/platforms/linux)، [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق عند wake up my friend / الإعداد التمهيدي لا يفقس. ماذا الآن؟">
    تعتمد تلك الشاشة على إمكانية الوصول إلى Gateway ومصادقته. يرسل TUI أيضًا
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

    3. إذا ظل عالقًا، فشغّل:

    ```bash
    openclaw doctor
    ```

    إذا كان Gateway بعيدًا، فتأكد من أن النفق/اتصال Tailscale يعمل وأن واجهة المستخدم
    تشير إلى Gateway الصحيح. راجع [الوصول عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="هل يمكنني ترحيل إعدادي إلى جهاز جديد (Mac mini) دون إعادة الإعداد التمهيدي؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغّل Doctor مرة واحدة. هذا
    يبقي بوتك "بالضبط كما هو" (الذاكرة، سجل الجلسات، المصادقة، وحالة القناة)
    طالما نسخت **كلا** الموقعين:

    1. ثبّت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة عملك (الافتراضي: `~/.openclaw/workspace`).
    4. شغّل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    يحافظ ذلك على الإعداد، وملفات تعريف المصادقة، وبيانات اعتماد WhatsApp، والجلسات، والذاكرة. إذا كنت في
    الوضع البعيد، فتذكر أن مضيف Gateway يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا كنت تلتزم/تدفع مساحة عملك فقط إلى GitHub، فأنت تنسخ احتياطيًا
    **الذاكرة + ملفات التمهيد**، لكن **ليس** سجل الجلسات أو المصادقة. هذه تعيش
    تحت `~/.openclaw/` (على سبيل المثال `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [أين توجد الأشياء على القرص](#where-things-live-on-disk)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أرى ما الجديد في أحدث إصدار؟">
    تحقق من سجل التغييرات على GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    أحدث الإدخالات في الأعلى. إذا كان القسم العلوي معلّمًا بـ **Unreleased**، فالقسم المؤرخ التالي
    هو أحدث إصدار منشور. تُجمع الإدخالات حسب **أبرز النقاط**، و**التغييرات**، و
    **الإصلاحات** (بالإضافة إلى أقسام الوثائق/الأقسام الأخرى عند الحاجة).

  </Accordion>

  <Accordion title="لا يمكن الوصول إلى docs.openclaw.ai (خطأ SSL)">
    تحظر بعض اتصالات Comcast/Xfinity بشكل غير صحيح `docs.openclaw.ai` عبر Xfinity
    Advanced Security. عطّله أو أضف `docs.openclaw.ai` إلى قائمة السماح، ثم أعد المحاولة.
    الرجاء مساعدتنا على رفع الحظر عنه بالإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    إذا لم تتمكن بعد من الوصول إلى الموقع، فالوثائق منعكسة على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="الفرق بين الإصدار المستقر وبيتا">
    **المستقر** و**بيتا** هما **وسما توزيع npm**، وليسا مساري كود منفصلين:

    - `latest` = مستقر
    - `beta` = بنية مبكرة للاختبار

    عادة، يصل الإصدار المستقر إلى **بيتا** أولًا، ثم تنقل خطوة ترقية صريحة
    الإصدار نفسه إلى `latest`. يمكن للمشرفين أيضًا النشر مباشرة إلى `latest`
    عند الحاجة. لهذا يمكن أن يشير كل من بيتا والمستقر إلى **الإصدار نفسه** بعد الترقية.

    راجع ما تغيّر:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    للاطلاع على أوامر التثبيت المختصرة والفرق بين بيتا وdev، راجع الأكورديون أدناه.

  </Accordion>

  <Accordion title="كيف أثبّت إصدار بيتا وما الفرق بين بيتا وdev؟">
    **بيتا** هو وسم توزيع npm المسمى `beta` (قد يطابق `latest` بعد الترقية).
    **Dev** هو الرأس المتحرك لفرع `main` (git)؛ وعند نشره، يستخدم وسم توزيع npm المسمى `dev`.

    أوامر مختصرة من سطر واحد (macOS/Linux):

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

  <Accordion title="كيف أجرّب أحدث البتات؟">
    خياران:

    1. **قناة Dev (استخراج git):**

    ```bash
    openclaw update --channel dev
    ```

    هذا يبدّل إلى فرع `main` ويحدّث من المصدر.

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

    المستندات: [التحديث](/ar/cli/update)، [قنوات التطوير](/ar/install/development-channels)،
    [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="كم يستغرق التثبيت والتهيئة الأولية عادة؟">
    دليل تقريبي:

    - **التثبيت:** 2-5 دقائق
    - **التهيئة الأولية:** 5-15 دقيقة بحسب عدد القنوات/النماذج التي تضبطها

    إذا تعلّق، فاستخدم [توقف المثبّت](#quick-start-and-first-run-setup)
    وحلقة التصحيح السريعة في [أنا عالق](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="هل توقف المثبّت؟ كيف أحصل على ملاحظات أكثر؟">
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

    خيارات إضافية: [أعلام المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="تثبيت Windows يقول إن git غير موجود أو إن openclaw غير معروف">
    مشكلتان شائعتان على Windows:

    **1) خطأ npm spawn git / لم يتم العثور على git**

    - ثبّت **Git for Windows** وتأكد من وجود `git` في PATH لديك.
    - أغلق PowerShell وأعد فتحه، ثم أعد تشغيل المثبّت.

    **2) openclaw غير معروف بعد التثبيت**

    - مجلد bin العام الخاص بـ npm غير موجود في PATH.
    - تحقق من المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف ذلك الدليل إلى PATH الخاص بالمستخدم لديك (لا حاجة إلى لاحقة `\bin` على Windows؛ في معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وأعد فتحه بعد تحديث PATH.

    إذا أردت أسلس إعداد على Windows، فاستخدم **WSL2** بدلًا من Windows الأصلي.
    المستندات: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="يعرض إخراج exec على Windows نصًا صينيًا مشوّهًا - ماذا أفعل؟">
    يكون هذا عادة عدم تطابق في صفحة رموز وحدة التحكم على أصداف Windows الأصلية.

    الأعراض:

    - يظهر إخراج `system.run`/`exec` للنص الصيني كأحرف مشوّهة
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

    إذا كنت لا تزال تعيد إنتاج هذا على أحدث OpenClaw، فتتبّعه/أبلغ عنه في:

    - [المشكلة #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="لم تُجب المستندات عن سؤالي - كيف أحصل على إجابة أفضل؟">
    استخدم **التثبيت القابل للتعديل (git)** حتى يتوفر لديك المصدر الكامل والمستندات محليًا، ثم اسأل
    البوت الخاص بك (أو Claude/Codex) _من ذلك المجلد_ كي يتمكن من قراءة المستودع والإجابة بدقة.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مزيد من التفاصيل: [التثبيت](/ar/install) و[أعلام المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على Linux؟">
    الإجابة المختصرة: اتبع دليل Linux، ثم شغّل التهيئة الأولية.

    - المسار السريع على Linux + تثبيت الخدمة: [Linux](/ar/platforms/linux).
    - شرح كامل خطوة بخطوة: [البدء](/ar/start/getting-started).
    - المثبّت + التحديثات: [التثبيت والتحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على VPS؟">
    يعمل أي VPS بنظام Linux. ثبّت على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول عن بُعد: [Gateway عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أدلة تثبيت السحابة/VPS؟">
    نحتفظ **بمركز استضافة** يضم المزوّدين الشائعين. اختر واحدًا واتبع الدليل:

    - [استضافة VPS](/ar/vps) (كل المزوّدين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    آلية عمله في السحابة: يعمل **Gateway على الخادم**، وتصل إليه
    من حاسوبك المحمول/هاتفك عبر Control UI (أو Tailscale/SSH). تعيش حالتك + مساحة عملك
    على الخادم، لذا تعامل مع المضيف كمصدر الحقيقة وانسخه احتياطيًا.

    يمكنك إقران **العقد** (Mac/iOS/Android/headless) مع Gateway السحابي ذلك للوصول إلى
    الشاشة/الكاميرا/canvas المحلية أو تشغيل الأوامر على حاسوبك المحمول مع إبقاء
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول عن بُعد: [Gateway عن بُعد](/ar/gateway/remote).
    العقد: [العقد](/ar/nodes)، [CLI العقد](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني أن أطلب من OpenClaw تحديث نفسه؟">
    الإجابة المختصرة: **ممكن، لكن غير موصى به**. يمكن لمسار التحديث أن يعيد تشغيل
    Gateway (مما يقطع الجلسة النشطة)، وقد يحتاج إلى استخراج git نظيف، ويمكن أن
    يطلب تأكيدًا. الأكثر أمانًا: شغّل التحديثات من shell بصفتك المشغّل.

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

    المستندات: [التحديث](/ar/cli/update)، [التحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="ماذا تفعل التهيئة الأولية فعليًا؟">
    `openclaw onboard` هو مسار الإعداد الموصى به. في **الوضع المحلي** يرشدك عبر:

    - **إعداد النموذج/المصادقة** (OAuth للمزوّد، ومفاتيح API، ورمز إعداد Anthropic، إضافة إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات التمهيد
    - **إعدادات Gateway** (bind/port/auth/tailscale)
    - **القنوات** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، إضافة إلى Plugins قنوات مضمّنة مثل QQ Bot)
    - **تثبيت الخدمة الخفية** (LaunchAgent على macOS؛ ووحدة مستخدم systemd على Linux/WSL2)
    - **فحوصات الصحة** واختيار **Skills**

    كما يحذّرك إذا كان النموذج المضبوط لديك غير معروف أو تنقصه المصادقة.

  </Accordion>

  <Accordion title="هل أحتاج إلى اشتراك Claude أو OpenAI لتشغيل هذا؟">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** (Anthropic/OpenAI/غيرها) أو باستخدام
    **نماذج محلية فقط** حتى تبقى بياناتك على جهازك. الاشتراكات (Claude
    Pro/Max أو OpenAI Codex) طرق اختيارية لمصادقة هؤلاء المزوّدين.

    بالنسبة إلى Anthropic في OpenClaw، يكون التقسيم العملي كالتالي:

    - **مفتاح Anthropic API**: فوترة Anthropic API العادية
    - **مصادقة Claude CLI / اشتراك Claude في OpenClaw**: أخبرنا موظفو Anthropic
      أن هذا الاستخدام مسموح به مجددًا، ويتعامل OpenClaw مع استخدام `claude -p`
      على أنه معتمد لهذا التكامل ما لم تنشر Anthropic سياسة جديدة

    بالنسبة إلى مضيفي gateway طويلي العمر، تظل مفاتيح Anthropic API هي الإعداد
    الأكثر قابلية للتنبؤ. OAuth الخاص بـ OpenAI Codex مدعوم صراحة للأدوات
    الخارجية مثل OpenClaw.

    يدعم OpenClaw أيضًا خيارات مستضافة أخرى بأسلوب الاشتراك، بما في ذلك
    **Qwen Cloud Coding Plan** و**MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan**.

    المستندات: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [نماذج GLM](/ar/providers/glm)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام اشتراك Claude Max بدون مفتاح API؟">
    نعم.

    أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذا
    يتعامل OpenClaw مع مصادقة اشتراك Claude واستخدام `claude -p` على أنهما معتمدان
    لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. إذا أردت
    الإعداد الأكثر قابلية للتنبؤ من جانب الخادم، فاستخدم مفتاح Anthropic API بدلًا من ذلك.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك Claude (Claude Pro أو Max)؟">
    نعم.

    أخبرنا موظفو Anthropic أن هذا الاستخدام مسموح به مجددًا، لذا يتعامل OpenClaw مع
    إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    لا يزال رمز إعداد Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
    بالنسبة إلى أعباء الإنتاج أو أعباء العمل متعددة المستخدمين، تظل مصادقة مفتاح Anthropic API
    الخيار الأكثر أمانًا وقابلية للتنبؤ. إذا أردت خيارات مستضافة أخرى بأسلوب الاشتراك
    في OpenClaw، فراجع [OpenAI](/ar/providers/openai)، [Qwen / Model
    Cloud](/ar/providers/qwen)، [MiniMax](/ar/providers/minimax)، و[نماذج GLM](/ar/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="لماذا أرى HTTP 429 rate_limit_error من Anthropic؟">
    يعني ذلك أن **حصة/حد معدل Anthropic** لديك استُنفدت للنافذة الحالية. إذا كنت
    تستخدم **Claude CLI**، فانتظر حتى تُعاد ضبط النافذة أو رقِّ خطتك. إذا كنت
    تستخدم **مفتاح Anthropic API**، فتحقق من Anthropic Console
    لمعرفة الاستخدام/الفوترة وارفع الحدود حسب الحاجة.

    إذا كانت الرسالة تحديدًا:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    بيتا سياق Anthropic بحجم 1M (`context1m: true`). لا يعمل ذلك إلا عندما تكون
    بيانات اعتمادك مؤهلة لفوترة السياق الطويل (فوترة مفتاح API أو مسار تسجيل دخول
    Claude في OpenClaw مع تفعيل Extra Usage).

    نصيحة: عيّن **نموذجًا احتياطيًا** حتى يتمكن OpenClaw من الاستمرار في الرد أثناء تقييد معدل مزوّد.
    راجع [النماذج](/ar/cli/models)، و[OAuth](/ar/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. يتضمن OpenClaw مزوّد **Amazon Bedrock (Converse)** مدمجًا. عند وجود علامات بيئة AWS، يمكن لـ OpenClaw اكتشاف كتالوج Bedrock للبث/النص تلقائيًا ودمجه كمزوّد `amazon-bedrock` ضمني؛ وإلا يمكنك تفعيل `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحة أو إضافة إدخال مزوّد يدوي. راجع [Amazon Bedrock](/ar/providers/bedrock) و[مزوّدي النماذج](/ar/providers/models). إذا كنت تفضّل تدفق مفاتيح مُدارًا، فما يزال استخدام وكيل متوافق مع OpenAI أمام Bedrock خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth (تسجيل الدخول إلى ChatGPT). استخدم
    `openai/gpt-5.5` مع `agentRuntime.id: "codex"` للإعداد الشائع:
    مصادقة اشتراك ChatGPT/Codex مع تنفيذ خادم تطبيق Codex الأصلي. استخدم
    `openai-codex/gpt-5.5` فقط عندما تريد OAuth الخاص بـ Codex عبر مشغّل
    PI الافتراضي. استخدم `openai/gpt-5.5` من دون تجاوز وقت تشغيل Codex من أجل
    الوصول المباشر بمفتاح API الخاص بـ OpenAI.
    راجع [مزوّدي النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا ما يزال OpenClaw يذكر openai-codex؟">
    `openai-codex` هو معرّف المزوّد وملف تعريف المصادقة لـ OAuth الخاص بـ ChatGPT/Codex.
    وهو أيضًا بادئة نموذج PI الصريحة لـ OAuth الخاص بـ Codex:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = مصادقة اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي
    - `openai-codex/gpt-5.5` = مسار OAuth الخاص بـ Codex في PI
    - `openai/gpt-5.5` من دون تجاوز وقت تشغيل Codex = مسار مباشر بمفتاح API الخاص بـ OpenAI في PI
    - `openai-codex:...` = معرّف ملف تعريف المصادقة، وليس مرجع نموذج

    إذا كنت تريد مسار فوترة/حدود OpenAI Platform المباشر، فعيّن
    `OPENAI_API_KEY`. إذا كنت تريد مصادقة اشتراك ChatGPT/Codex، فسجّل الدخول باستخدام
    `openclaw models auth login --provider openai-codex`. لوقت تشغيل Codex
    الأصلي، أبقِ مرجع النموذج `openai/gpt-5.5` وعيّن
    `agentRuntime.id: "codex"`. استخدم مراجع نماذج `openai-codex/*` لتشغيلات PI
    فقط.

  </Accordion>

  <Accordion title="لماذا قد تختلف حدود OAuth الخاص بـ Codex عن ChatGPT على الويب؟">
    يستخدم OAuth الخاص بـ Codex نوافذ حصص مُدارة من OpenAI وتعتمد على الخطة. عمليًا،
    قد تختلف هذه الحدود عن تجربة موقع/تطبيق ChatGPT، حتى عندما يكون
    كلاهما مرتبطًا بالحساب نفسه.

    يمكن لـ OpenClaw عرض نوافذ الاستخدام/الحصة المرئية حاليًا للمزوّد في
    `openclaw models status`، لكنه لا يخترع أو يطبّع استحقاقات ChatGPT على الويب
    إلى وصول API مباشر. إذا كنت تريد مسار فوترة/حدود OpenAI Platform
    المباشر، فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك OpenAI (OAuth الخاص بـ Codex)؟">
    نعم. يدعم OpenClaw بالكامل **OAuth لاشتراك OpenAI Code (Codex)**.
    تسمح OpenAI صراحة باستخدام OAuth للاشتراك في أدوات/تدفقات عمل خارجية
    مثل OpenClaw. يمكن للإعداد الأولي تشغيل تدفق OAuth نيابة عنك.

    راجع [OAuth](/ar/concepts/oauth)، و[مزوّدي النماذج](/ar/concepts/model-providers)، و[الإعداد الأولي (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أُعدّ OAuth الخاص بـ Gemini CLI؟">
    يستخدم Gemini CLI **تدفق مصادقة Plugin**، وليس معرّف عميل أو سرًا في `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا بحيث يكون `gemini` على `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. فعّل Plugin: `openclaw plugins enable google`
    3. سجّل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: `google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway

    يخزّن هذا رموز OAuth في ملفات تعريف المصادقة على مضيف Gateway. التفاصيل: [مزوّدو النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للمحادثات العادية؟">
    عادة لا. يحتاج OpenClaw إلى سياق كبير + أمان قوي؛ البطاقات الصغيرة تقطع المحتوى وتسرّبه. إذا كان لا بد من ذلك، فشغّل **أكبر** بناء نموذج يمكنك تشغيله محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). تزيد النماذج الأصغر/المكمّمة من خطر حقن المطالبات - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أبقي حركة نماذج الاستضافة في منطقة محددة؟">
    اختر نقاط نهاية مثبتة بالمنطقة. يعرض OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر النسخة المستضافة في الولايات المتحدة لإبقاء البيانات داخل المنطقة. ما يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه عبر استخدام `models.mode: "merge"` حتى تبقى البدائل الاحتياطية متاحة مع احترام المزوّد الإقليمي الذي تختاره.
  </Accordion>

  <Accordion title="هل يجب أن أشتري Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux (Windows عبر WSL2). جهاز Mac mini اختياري - يشتريه بعض الأشخاص
    كمضيف يعمل دائمًا، لكن VPS صغيرًا أو خادمًا منزليًا أو جهازًا بفئة Raspberry Pi يعمل أيضًا.

    تحتاج إلى Mac فقط **لأدوات macOS الحصرية**. بالنسبة إلى iMessage، استخدم [BlueBubbles](/ar/channels/bluebubbles) (موصى به) - يعمل خادم BlueBubbles على أي Mac، ويمكن لـ Gateway العمل على Linux أو في مكان آخر. إذا أردت أدوات macOS حصرية أخرى، فشغّل Gateway على Mac أو أقرن عقدة macOS.

    المستندات: [BlueBubbles](/ar/channels/bluebubbles)، [العُقد](/ar/nodes)، [وضع Mac عن بُعد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **جهاز macOS ما** مسجّل الدخول إلى Messages. لا يلزم أن يكون Mac mini -
    أي Mac يفي بالغرض. **استخدم [BlueBubbles](/ar/channels/bluebubbles)** (موصى به) لـ iMessage - يعمل خادم BlueBubbles على macOS، بينما يمكن لـ Gateway العمل على Linux أو في مكان آخر.

    الإعدادات الشائعة:

    - شغّل Gateway على Linux/VPS، وشغّل خادم BlueBubbles على أي Mac مسجّل الدخول إلى Messages.
    - شغّل كل شيء على Mac إذا كنت تريد أبسط إعداد على جهاز واحد.

    المستندات: [BlueBubbles](/ar/channels/bluebubbles)، [العُقد](/ar/nodes)،
    [وضع Mac عن بُعد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، فهل يمكنني توصيله بـ MacBook Pro الخاص بي؟">
    نعم. يمكن أن يشغّل **Mac mini جهاز Gateway**، ويمكن أن يتصل MacBook Pro الخاص بك بصفته
    **عقدة** (جهازًا مرافقًا). لا تشغّل العُقد Gateway - بل توفر قدرات إضافية
    مثل الشاشة/الكاميرا/اللوحة و`system.run` على ذلك الجهاز.

    النمط الشائع:

    - Gateway على Mac mini (يعمل دائمًا).
    - يشغّل MacBook Pro تطبيق macOS أو مضيف عقدة ويقترن بـ Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    المستندات: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    لا يُنصح باستخدام Bun. نرى أخطاء وقت تشغيل، خصوصًا مع WhatsApp وTelegram.
    استخدم **Node** لبوابات مستقرة.

    إذا كنت ما تزال تريد تجربة Bun، فافعل ذلك على Gateway غير إنتاجي
    من دون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ماذا يوضع في allowFrom؟">
    `channels.telegram.allowFrom` هو **معرّف مستخدم Telegram للمرسل البشري** (رقمي). إنه ليس اسم مستخدم البوت.

    يطلب الإعداد معرّفات مستخدمين رقمية فقط. إذا كانت لديك بالفعل إدخالات `@username` قديمة في الإعداد، يمكن لـ `openclaw doctor --fix` محاولة حلّها.

    أكثر أمانًا (من دون بوت طرف ثالث):

    - أرسل رسالة مباشرة إلى البوت، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    API البوت الرسمي:

    - أرسل رسالة مباشرة إلى البوت، ثم استدعِ `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    طرف ثالث (أقل خصوصية):

    - أرسل رسالة مباشرة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع مثيلات OpenClaw مختلفة؟">
    نعم، عبر **توجيه متعدد الوكلاء**. اربط **الرسالة المباشرة** لكل مرسل في WhatsApp (نظير `kind: "direct"`، والمرسل بصيغة E.164 مثل `+15551234567`) بـ `agentId` مختلف، حتى يحصل كل شخص على مساحة عمل ومخزن جلسات خاصين به. ستظل الردود تأتي من **حساب WhatsApp نفسه**، ويكون التحكم في وصول الرسائل المباشرة (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) عامًا لكل حساب WhatsApp. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "دردشة سريعة" ووكيل "Opus للبرمجة"؟'>
    نعم. استخدم التوجيه متعدد الوكلاء: أعطِ كل وكيل نموذجه الافتراضي الخاص، ثم اربط المسارات الواردة (حساب المزوّد أو نظراء محددين) بكل وكيل. يوجد مثال إعداد في [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent). راجع أيضًا [النماذج](/ar/concepts/models) و[الإعداد](/ar/gateway/configuration).
  </Accordion>

  <Accordion title="هل يعمل Homebrew على Linux؟">
    نعم. يدعم Homebrew نظام Linux (Linuxbrew). إعداد سريع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    إذا كنت تشغّل OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` (أو بادئة brew الخاصة بك) حتى تُحل أدوات `brew` المثبتة في أصداف غير تسجيل الدخول.
    تضيف البُنى الحديثة أيضًا أدلة bin الشائعة للمستخدمين في خدمات Linux systemd في المقدمة (مثل `~/.local/bin` و`~/.npm-global/bin` و`~/.local/share/pnpm` و`~/.bun/bin`) وتحترم `PNPM_HOME` و`NPM_CONFIG_PREFIX` و`BUN_INSTALL` و`VOLTA_HOME` و`ASDF_DATA_DIR` و`NVM_DIR` و`FNM_DIR` عند تعيينها.

  </Accordion>

  <Accordion title="الفرق بين تثبيت git القابل للتعديل وتثبيت npm">
    - **تثبيت قابل للتعديل (git):** نسخة كاملة من المصدر، قابلة للتحرير، والأفضل للمساهمين.
      تشغّل عمليات البناء محليًا ويمكنك تعديل الكود/المستندات.
    - **تثبيت npm:** تثبيت CLI عام، بلا مستودع، والأفضل لمن يريد "تشغيله فقط".
      تأتي التحديثات من وسوم توزيع npm.

    المستندات: [بدء الاستخدام](/ar/start/getting-started)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="هل يمكنني التبديل بين تثبيت npm وgit لاحقًا؟">
    نعم. استخدم `openclaw update --channel ...` عندما يكون OpenClaw مثبتًا بالفعل.
    هذا **لا يحذف بياناتك** - إنه يغيّر فقط تثبيت كود OpenClaw.
    تبقى حالتك (`~/.openclaw`) ومساحة العمل (`~/.openclaw/workspace`) دون مساس.

    من npm إلى git:

    ```bash
    openclaw update --channel dev
    ```

    من git إلى npm:

    ```bash
    openclaw update --channel stable
    ```

    أضف `--dry-run` لمعاينة تبديل الوضع المخطط أولًا. يشغّل المحدّث
    متابعات Doctor، ويحدّث مصادر Plugin للقناة الهدف، ويعيد
    تشغيل Gateway ما لم تمرر `--no-restart`.

    يمكن للمثبّت فرض أي من الوضعين أيضًا:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نصائح النسخ الاحتياطي: راجع [استراتيجية النسخ الاحتياطي](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="هل ينبغي أن أشغّل Gateway على حاسوبي المحمول أم على VPS؟">
    الإجابة المختصرة: **إذا أردت موثوقية 24/7، فاستخدم VPS**. إذا كنت تريد
    أقل قدر من التعقيد ولا تمانع السكون/إعادة التشغيل، فشغّله محليًا.

    **الحاسوب المحمول (Gateway محلي)**

    - **الإيجابيات:** لا توجد تكلفة خادم، وصول مباشر إلى الملفات المحلية، نافذة متصفح حية.
    - **السلبيات:** السكون/انقطاع الشبكة = انقطاعات اتصال، تحديثات/إعادة تشغيل نظام التشغيل تقاطع العمل، ويجب أن يبقى مستيقظًا.

    **VPS / السحابة**

    - **الإيجابيات:** يعمل دائمًا، شبكة مستقرة، لا توجد مشكلات نوم الحاسوب المحمول، أسهل في إبقائه قيد التشغيل.
    - **السلبيات:** غالبًا يعمل بلا واجهة رسومية (استخدم لقطات الشاشة)، الوصول إلى الملفات عن بُعد فقط، ويجب استخدام SSH للتحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp/Telegram/Slack/Mattermost/Discord جميعها بشكل جيد من VPS. المفاضلة الحقيقية الوحيدة هي **متصفح بلا واجهة رسومية** مقابل نافذة مرئية. راجع [المتصفح](/ar/tools/browser).

    **الإعداد الافتراضي الموصى به:** VPS إذا واجهت انقطاعات في Gateway سابقًا. التشغيل المحلي ممتاز عندما تستخدم Mac بنشاط وتريد الوصول إلى الملفات المحلية أو أتمتة واجهة المستخدم باستخدام متصفح مرئي.

  </Accordion>

  <Accordion title="ما مدى أهمية تشغيل OpenClaw على جهاز مخصص؟">
    ليس مطلوبًا، لكنه **موصى به للموثوقية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Pi):** يعمل دائمًا، انقطاعات نوم/إعادة تشغيل أقل، أذونات أنظف، وأسهل في إبقائه قيد التشغيل.
    - **حاسوب محمول/مكتبي مشترك:** مناسب تمامًا للاختبار والاستخدام النشط، لكن توقّع توقفات مؤقتة عندما يدخل الجهاز في وضع النوم أو يجري تحديثات.

    إذا أردت أفضل الخيارين، أبقِ Gateway على مضيف مخصص واقرن حاسوبك المحمول باعتباره **node** لأدوات الشاشة/الكاميرا/التنفيذ المحلية. راجع [Nodes](/ar/nodes).
    لإرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما الحد الأدنى لمتطلبات VPS ونظام التشغيل الموصى به؟">
    OpenClaw خفيف الوزن. بالنسبة إلى Gateway أساسي + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** 1 vCPU، وذاكرة RAM بسعة 1GB، ومساحة قرص نحو 500MB.
    - **الموصى به:** 1-2 vCPU، وذاكرة RAM بسعة 2GB أو أكثر لتوفير هامش إضافي (السجلات، الوسائط، قنوات متعددة). قد تكون أدوات Node وأتمتة المتصفح كثيفة الاستهلاك للموارد.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). مسار التثبيت على Linux هو الأكثر اختبارًا هناك.

    المستندات: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw في VM وما المتطلبات؟">
    نعم. تعامل مع VM بالطريقة نفسها مثل VPS: يجب أن يكون قيد التشغيل دائمًا، وقابلًا للوصول، ولديه ذاكرة
    RAM كافية لـ Gateway وأي قنوات تفعّلها.

    الإرشادات الأساسية:

    - **الحد الأدنى المطلق:** 1 vCPU، وذاكرة RAM بسعة 1GB.
    - **الموصى به:** ذاكرة RAM بسعة 2GB أو أكثر إذا كنت تشغّل قنوات متعددة، أو أتمتة المتصفح، أو أدوات الوسائط.
    - **نظام التشغيل:** Ubuntu LTS أو Debian/Ubuntu حديث آخر.

    إذا كنت تستخدم Windows، فإن **WSL2 هو أسهل إعداد بأسلوب VM** ولديه أفضل توافق
    مع الأدوات. راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    إذا كنت تشغّل macOS في VM، فراجع [macOS VM](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية (النماذج، الجلسات، Gateway، الأمان، والمزيد)
- [نظرة عامة على التثبيت](/ar/install)
- [بدء الاستخدام](/ar/start/getting-started)
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
