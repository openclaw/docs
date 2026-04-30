---
read_when:
    - تثبيت جديد، أو تعثّر الإعداد الأولي، أو أخطاء التشغيل الأول
    - اختيار المصادقة واشتراكات المزوّدين
    - لا يمكن الوصول إلى docs.openclaw.ai، لا يمكن فتح لوحة التحكم، التثبيت عالق
sidebarTitle: First-run FAQ
summary: 'الأسئلة الشائعة: البدء السريع وإعداد التشغيل الأول — التثبيت، الإعداد الأولي، المصادقة، الاشتراكات، الإخفاقات الأولية'
title: 'الأسئلة الشائعة: إعداد التشغيل الأول'
x-i18n:
    generated_at: "2026-04-30T08:04:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 959e5c8a94cce6369af84d3d1e252dbfb22acb5891ac1d8b64722c4c40679e65
    source_path: help/faq-first-run.md
    workflow: 16
---

  البدء السريع وأسئلة وأجوبة التشغيل الأول. للعمليات اليومية، والنماذج، والمصادقة، والجلسات،
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## البدء السريع وإعداد التشغيل الأول

  <AccordionGroup>
  <Accordion title="أنا عالق، ما أسرع طريقة لتجاوز المشكلة؟">
    استخدم وكيل ذكاء اصطناعي محليًا يمكنه **رؤية جهازك**. هذا أكثر فعالية بكثير من السؤال
    في Discord، لأن معظم حالات "أنا عالق" تكون **مشكلات إعداد محلية أو مشكلات بيئة** لا يستطيع
    المساعدون عن بعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    يمكن لهذه الأدوات قراءة المستودع، وتشغيل الأوامر، وفحص السجلات، والمساعدة في إصلاح إعدادك
    على مستوى الجهاز (PATH، والخدمات، والأذونات، وملفات المصادقة). امنحها **نسخة كاملة من المصدر** عبر
    التثبيت القابل للتعديل (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يثبّت هذا OpenClaw **من نسخة git محلية**، بحيث يستطيع الوكيل قراءة الكود + الوثائق
    والاستدلال حول الإصدار الدقيق الذي تشغله. يمكنك دائمًا الرجوع إلى الإصدار المستقر لاحقًا
    بإعادة تشغيل المثبّت دون `--install-method git`.

    نصيحة: اطلب من الوكيل **تخطيط الإصلاح والإشراف عليه** (خطوة بخطوة)، ثم تنفيذ الأوامر
    الضرورية فقط. هذا يبقي التغييرات صغيرة وأسهل في المراجعة.

    إذا اكتشفت خطأً حقيقيًا أو إصلاحًا، فيُرجى فتح issue على GitHub أو إرسال PR:
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
    - `openclaw models status`: يتحقق من مصادقة المزوّد + توفر النماذج.
    - `openclaw doctor`: يتحقق من مشكلات الإعداد/الحالة الشائعة ويصلحها.

    فحوصات CLI مفيدة أخرى: `openclaw status --all`، و`openclaw logs --follow`،
    و`openclaw gateway status`، و`openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان هناك شيء معطّل](#first-60-seconds-if-something-is-broken).
    وثائق التثبيت: [التثبيت](/ar/install)، [أعلام المثبّت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="Heartbeat يستمر في التخطي. ماذا تعني أسباب التخطي؟">
    أسباب تخطي Heartbeat الشائعة:

    - `quiet-hours`: خارج نافذة الساعات النشطة المضبوطة
    - `empty-heartbeat-file`: الملف `HEARTBEAT.md` موجود لكنه يحتوي فقط على هيكل فارغ/رؤوس فقط
    - `no-tasks-due`: وضع مهام `HEARTBEAT.md` نشط لكن لم يحِن موعد أي من فواصل المهام بعد
    - `alerts-disabled`: كل ظهور Heartbeat معطّل (`showOk` و`showAlerts` و`useIndicator` كلها متوقفة)

    في وضع المهام، لا تُقدَّم الطوابع الزمنية المستحقة إلا بعد اكتمال تشغيل Heartbeat
    حقيقي. التشغيلات المتخطاة لا تضع علامة على المهام بأنها مكتملة.

    الوثائق: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="الطريقة الموصى بها لتثبيت OpenClaw وإعداده">
    يوصي المستودع بالتشغيل من المصدر واستخدام الإعداد التمهيدي:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    يستطيع المعالج أيضًا بناء أصول الواجهة تلقائيًا. بعد الإعداد التمهيدي، تشغّل عادةً Gateway على المنفذ **18789**.

    من المصدر (للمساهمين/التطوير):

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

  <Accordion title="كيف أفتح لوحة التحكم بعد الإعداد التمهيدي؟">
    يفتح المعالج متصفحك بعنوان URL نظيف (غير مضمّن برمز) للوحة التحكم مباشرة بعد الإعداد التمهيدي، ويطبع الرابط أيضًا في الملخص. أبقِ تلك التبويبة مفتوحة؛ إذا لم تُفتح، انسخ/الصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أصادق لوحة التحكم على localhost مقارنةً بالوصول البعيد؟">
    **Localhost (الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلب مصادقة سر مشترك، فالصق الرمز المضبوط أو كلمة المرور في إعدادات Control UI.
    - مصدر الرمز: `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر كلمة المرور: `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يُضبط سر مشترك بعد، أنشئ رمزًا باستخدام `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** (موصى به): أبقِ الربط على local loopback، وشغّل `openclaw gateway --tailscale serve`، وافتح `https://<magicdns>/`. إذا كان `gateway.auth.allowTailscale` يساوي `true`، فإن رؤوس الهوية تفي بمصادقة Control UI/WebSocket (لا حاجة إلى لصق سر مشترك، مع افتراض أن مضيف Gateway موثوق)؛ لا تزال HTTP APIs تتطلب مصادقة سر مشترك إلا إذا استخدمت عمدًا `none` للدخول الخاص أو مصادقة HTTP عبر وكيل موثوق.
      تتم تسلسلة محاولات مصادقة Serve المتزامنة السيئة من العميل نفسه قبل أن يسجلها محدد فشل المصادقة، لذلك يمكن أن تُظهر إعادة المحاولة السيئة الثانية بالفعل `retry later`.
    - **ربط tailnet**: شغّل `openclaw gateway --bind tailnet --token "<token>"` (أو اضبط مصادقة كلمة المرور)، وافتح `http://<tailscale-ip>:18789/`، ثم الصق السر المشترك المطابق في إعدادات لوحة التحكم.
    - **وكيل عكسي واعٍ بالهوية**: أبقِ Gateway خلف وكيل موثوق، واضبط `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل. تتطلب وكلاء local loopback على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`.
    - **نفق SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. لا تزال مصادقة السر المشترك تنطبق عبر النفق؛ الصق الرمز المضبوط أو كلمة المرور إذا طُلب منك ذلك.

    راجع [لوحة التحكم](/ar/web/dashboard) و[أسطح الويب](/ar/web) لمعرفة أوضاع الربط وتفاصيل المصادقة.

  </Accordion>

  <Accordion title="لماذا توجد إعدادات موافقة exec مزدوجة لموافقات الدردشة؟">
    تتحكم في طبقات مختلفة:

    - `approvals.exec`: تمرر مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: تجعل تلك القناة تعمل كعميل موافقة أصلي لموافقات exec

    لا تزال سياسة exec الخاصة بالمضيف هي بوابة الموافقة الفعلية. يتحكم إعداد الدردشة فقط في مكان ظهور
    مطالبات الموافقة وكيف يمكن للأشخاص الرد عليها.

    في معظم الإعدادات لا تحتاج إلى الاثنين معًا:

    - إذا كانت الدردشة تدعم الأوامر والردود بالفعل، فإن `/approve` في الدردشة نفسها يعمل عبر المسار المشترك.
    - إذا كانت قناة أصلية مدعومة تستطيع استنتاج الموافقين بأمان، فإن OpenClaw يفعّل الآن تلقائيًا الموافقات الأصلية التي تبدأ برسالة مباشرة عندما يكون `channels.<channel>.execApprovals.enabled` غير مضبوط أو `"auto"`.
    - عندما تكون بطاقات/أزرار الموافقة الأصلية متاحة، تكون تلك الواجهة الأصلية هي المسار الأساسي؛ ينبغي للوكيل تضمين أمر `/approve` يدوي فقط إذا قالت نتيجة الأداة إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب أيضًا تمرير المطالبات إلى دردشات أخرى أو غرف عمليات صريحة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحةً نشر مطالبات الموافقة مرة أخرى في الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة أيضًا: تستخدم `/approve` في الدردشة نفسها افتراضيًا، وتمرير `approvals.plugin` اختياريًا، ولا تحتفظ إلا بعض القنوات الأصلية بمعالجة أصلية لموافقة Plugin فوق ذلك.

    النسخة المختصرة: التمرير مخصص للتوجيه، وإعداد العميل الأصلي مخصص لتجربة مستخدم أغنى خاصة بالقناة.
    راجع [موافقات exec](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما بيئة التشغيل التي أحتاجها؟">
    Node **>= 22** مطلوب. يوصى باستخدام `pnpm`. لا يُوصى باستخدام Bun مع Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. Gateway خفيف الوزن - تذكر الوثائق أن **512MB-1GB RAM**، و**1 core**، وحوالي **500MB**
    من القرص تكفي للاستخدام الشخصي، وتشير إلى أن **Raspberry Pi 4 يمكنه تشغيله**.

    إذا أردت مساحة إضافية (السجلات، الوسائط، خدمات أخرى)، فيُوصى بـ **2GB**، لكنها
    ليست حدًا أدنى صارمًا.

    نصيحة: يمكن لـ Pi/VPS صغير استضافة Gateway، ويمكنك إقران **العُقد** على الحاسوب المحمول/الهاتف
    لشاشة/كاميرا/canvas محلية أو لتنفيذ الأوامر. راجع [العُقد](/ar/nodes).

  </Accordion>

  <Accordion title="أي نصائح لتثبيتات Raspberry Pi؟">
    النسخة المختصرة: يعمل، لكن توقّع بعض الحواف الخشنة.

    - استخدم نظام تشغيل **64-bit** وأبقِ Node >= 22.
    - فضّل **التثبيت القابل للتعديل (git)** حتى تستطيع رؤية السجلات والتحديث بسرعة.
    - ابدأ دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات ثنائية غريبة، فهي عادةً مشكلة **توافق ARM**.

    الوثائق: [Linux](/ar/platforms/linux)، [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق عند wake up my friend / الإعداد التمهيدي لا يفقس. ماذا الآن؟">
    تعتمد تلك الشاشة على قابلية الوصول إلى Gateway والمصادقة عليه. ترسل TUI أيضًا
    "Wake up, my friend!" تلقائيًا عند أول فقس. إذا رأيت هذا السطر مع **عدم وجود رد**
    وبقيت الرموز عند 0، فهذا يعني أن الوكيل لم يعمل مطلقًا.

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

    3. إذا استمر التعليق، شغّل:

    ```bash
    openclaw doctor
    ```

    إذا كان Gateway بعيدًا، فتأكد من أن اتصال النفق/Tailscale يعمل وأن الواجهة
    تشير إلى Gateway الصحيح. راجع [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="هل يمكنني نقل إعدادي إلى جهاز جديد (Mac mini) دون إعادة الإعداد التمهيدي؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغّل Doctor مرة واحدة. هذا
    يبقي بوتك "مطابقًا تمامًا" (الذاكرة، وسجل الجلسات، والمصادقة، وحالة القناة)
    ما دمت تنسخ **الموقعين**:

    1. ثبّت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة عملك (الافتراضي: `~/.openclaw/workspace`).
    4. شغّل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    يحافظ ذلك على الإعداد، وملفات تعريف المصادقة، وبيانات اعتماد WhatsApp، والجلسات، والذاكرة. إذا كنت في
    الوضع البعيد، فتذكر أن مضيف gateway يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا كنت تلتزم/تدفع مساحة عملك فقط إلى GitHub، فأنت تنسخ احتياطيًا
    **الذاكرة + ملفات التمهيد**، لكن **ليس** سجل الجلسات أو المصادقة. توجد هذه
    تحت `~/.openclaw/` (مثلًا `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [أماكن وجود الأشياء على القرص](#where-things-live-on-disk)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أرى الجديد في أحدث إصدار؟">
    تحقق من سجل التغييرات على GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    أحدث الإدخالات في الأعلى. إذا كان القسم العلوي معلّمًا بـ **Unreleased**، فالقسم التالي المؤرخ
    هو أحدث إصدار منشور. تُجمّع الإدخالات حسب **Highlights** و**Changes** و
    **Fixes** (إضافة إلى أقسام الوثائق/الأخرى عند الحاجة).

  </Accordion>

  <Accordion title="لا يمكن الوصول إلى docs.openclaw.ai (خطأ SSL)">
    بعض اتصالات Comcast/Xfinity تحظر `docs.openclaw.ai` بشكل غير صحيح عبر Xfinity
    Advanced Security. عطّله أو أضف `docs.openclaw.ai` إلى قائمة السماح، ثم أعد المحاولة.
    يُرجى مساعدتنا على إلغاء حظره بالإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    إذا كنت لا تزال لا تستطيع الوصول إلى الموقع، فالوثائق معكوسة على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="الفرق بين stable وbeta">
    **Stable** و**beta** هما **وسما توزيع npm**، وليسا سطرين منفصلين من الشيفرة:

    - `latest` = stable
    - `beta` = بناء مبكر للاختبار

    عادةً، يصل الإصدار المستقر إلى **beta** أولًا، ثم تنقل خطوة ترقية صريحة
    الإصدار نفسه إلى `latest`. يمكن للمشرفين أيضًا النشر مباشرةً إلى `latest` عند الحاجة. لهذا السبب يمكن أن يشير beta وstable
    إلى **الإصدار نفسه** بعد الترقية.

    اطّلع على ما تغيّر:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    لأوامر التثبيت ذات السطر الواحد والفرق بين beta وdev، راجع الأكورديون أدناه.

  </Accordion>

  <Accordion title="كيف أثبّت إصدار beta وما الفرق بين beta وdev؟">
    **Beta** هو وسم توزيع npm `beta` (قد يطابق `latest` بعد الترقية).
    **Dev** هو الرأس المتحرك لفرع `main` (git)؛ وعند نشره يستخدم وسم توزيع npm `dev`.

    أوامر سطر واحد (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مثبّت Windows ‏(PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    مزيد من التفاصيل: [قنوات التطوير](/ar/install/development-channels) و[أعلام المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أجرّب أحدث الأجزاء؟">
    خياران:

    1. **قناة Dev (نسخة git):**

    ```bash
    openclaw update --channel dev
    ```

    يؤدي هذا إلى التبديل إلى فرع `main` والتحديث من المصدر.

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

  <Accordion title="كم يستغرق التثبيت والتهيئة الأولية عادةً؟">
    دليل تقريبي:

    - **التثبيت:** 2-5 دقائق
    - **التهيئة الأولية:** 5-15 دقيقة بحسب عدد القنوات/النماذج التي تضبطها

    إذا توقف، فاستخدم [تعطل المثبّت](#quick-start-and-first-run-setup)
    وحلقة التصحيح السريعة في [أنا عالق](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="هل تعطل المثبّت؟ كيف أحصل على مزيد من الملاحظات؟">
    أعد تشغيل المثبّت مع **إخراج تفصيلي**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    تثبيت beta مع الإخراج التفصيلي:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    لتثبيت قابل للتعديل (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    المكافئ على Windows ‏(PowerShell):

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

    **1) خطأ npm spawn git / لم يتم العثور على git**

    - ثبّت **Git for Windows** وتأكد من أن `git` موجود في PATH لديك.
    - أغلق PowerShell وأعد فتحه، ثم أعد تشغيل المثبّت.

    **2) لا يتم التعرف على openclaw بعد التثبيت**

    - مجلد npm العام للملفات التنفيذية غير موجود في PATH.
    - تحقق من المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف ذلك الدليل إلى PATH الخاص بالمستخدم لديك (لا حاجة إلى لاحقة `\bin` على Windows؛ وفي معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وأعد فتحه بعد تحديث PATH.

    إذا أردت أسلس إعداد على Windows، فاستخدم **WSL2** بدلًا من Windows الأصلي.
    الوثائق: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="يعرض خرج exec على Windows نصًا صينيًا مشوهًا - ماذا أفعل؟">
    يكون هذا عادةً عدم تطابق في صفحة ترميز وحدة التحكم على أصداف Windows الأصلية.

    الأعراض:

    - يظهر خرج `system.run`/`exec` للنص الصيني كنص مشوّه
    - يبدو الأمر نفسه سليمًا في ملف تعريف طرفية آخر

    حل سريع في PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    ثم أعد تشغيل Gateway وأعد محاولة أمرك:

    ```powershell
    openclaw gateway restart
    ```

    إذا كان لا يزال بإمكانك إعادة إنتاج هذا على أحدث OpenClaw، فتابعه/أبلغ عنه في:

    - [المشكلة #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="لم تُجب الوثائق عن سؤالي - كيف أحصل على إجابة أفضل؟">
    استخدم **التثبيت القابل للتعديل (git)** حتى تكون لديك الشيفرة المصدرية والوثائق كاملة محليًا، ثم اسأل
    روبوتك (أو Claude/Codex) _من ذلك المجلد_ حتى يتمكن من قراءة المستودع والإجابة بدقة.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مزيد من التفاصيل: [التثبيت](/ar/install) و[أعلام المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على Linux؟">
    الإجابة المختصرة: اتبع دليل Linux، ثم شغّل التهيئة الأولية.

    - المسار السريع على Linux + تثبيت الخدمة: [Linux](/ar/platforms/linux).
    - شرح كامل خطوة بخطوة: [بدء الاستخدام](/ar/start/getting-started).
    - المثبّت + التحديثات: [التثبيت والتحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على VPS؟">
    أي VPS يعمل بنظام Linux مناسب. ثبّت على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول عن بُعد: [Gateway عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أدلة تثبيت السحابة/VPS؟">
    نحتفظ **بمركز استضافة** يضم المزوّدين الشائعين. اختر واحدًا واتبع دليله:

    - [استضافة VPS](/ar/vps) (كل المزوّدين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    طريقة عمله في السحابة: **يعمل Gateway على الخادم**، وتصل إليه
    من حاسوبك المحمول/هاتفك عبر Control UI (أو Tailscale/SSH). تعيش حالتك + مساحة عملك
    على الخادم، لذا اعتبر المضيف مصدر الحقيقة وانسخه احتياطيًا.

    يمكنك إقران **العُقد** (Mac/iOS/Android/بلا واجهة) بذلك Gateway السحابي للوصول إلى
    الشاشة/الكاميرا/اللوحة المحلية أو تشغيل أوامر على حاسوبك المحمول مع إبقاء
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول عن بُعد: [Gateway عن بُعد](/ar/gateway/remote).
    العُقد: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني أن أطلب من OpenClaw تحديث نفسه؟">
    الإجابة المختصرة: **ممكن، لكنه غير موصى به**. قد يعيد مسار التحديث تشغيل
    Gateway (ما يقطع الجلسة النشطة)، وقد يحتاج إلى نسخة git نظيفة، وقد
    يطلب تأكيدًا. الأكثر أمانًا: شغّل التحديثات من صدفة بصفتك المشغّل.

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

    الوثائق: [التحديث](/ar/cli/update)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="ما الذي تفعله التهيئة الأولية فعليًا؟">
    `openclaw onboard` هو مسار الإعداد الموصى به. في **الوضع المحلي** يرشدك خلال:

    - **إعداد النموذج/المصادقة** (OAuth للمزوّدين، مفاتيح API، setup-token من Anthropic، إضافةً إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات التمهيد
    - **إعدادات Gateway** (bind/port/auth/tailscale)
    - **القنوات** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، إضافةً إلى Plugins القنوات المضمّنة مثل QQ Bot)
    - **تثبيت الخدمة الخلفية** (LaunchAgent على macOS؛ ووحدة مستخدم systemd على Linux/WSL2)
    - **فحوصات الصحة** واختيار **Skills**

    كما يحذّرك إذا كان النموذج المضبوط غير معروف أو تنقصه المصادقة.

  </Accordion>

  <Accordion title="هل أحتاج إلى اشتراك Claude أو OpenAI لتشغيل هذا؟">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** (Anthropic/OpenAI/وغيرهما) أو باستخدام
    **نماذج محلية فقط** حتى تبقى بياناتك على جهازك. الاشتراكات (Claude
    Pro/Max أو OpenAI Codex) هي طرق اختيارية لمصادقة هؤلاء المزوّدين.

    بالنسبة إلى Anthropic في OpenClaw، يكون التقسيم العملي كالتالي:

    - **مفتاح API من Anthropic**: فوترة Anthropic API العادية
    - **مصادقة Claude CLI / اشتراك Claude في OpenClaw**: أخبرنا موظفو Anthropic
      أن هذا الاستخدام مسموح مرة أخرى، ويتعامل OpenClaw مع استخدام `claude -p`
      باعتباره معتمدًا لهذا التكامل ما لم تنشر Anthropic سياسة جديدة

    بالنسبة إلى مضيفات Gateway طويلة العمر، تظل مفاتيح Anthropic API
    الإعداد الأكثر قابلية للتنبؤ. OpenAI Codex OAuth مدعوم صراحةً للأدوات الخارجية
    مثل OpenClaw.

    يدعم OpenClaw أيضًا خيارات مستضافة أخرى بنمط الاشتراك، بما في ذلك
    **Qwen Cloud Coding Plan** و**MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan**.

    الوثائق: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [نماذج GLM](/ar/providers/glm)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام اشتراك Claude Max دون مفتاح API؟">
    نعم.

    أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح مرة أخرى، لذا
    يتعامل OpenClaw مع مصادقة اشتراك Claude واستخدام `claude -p` باعتبارهما معتمدين
    لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. إذا أردت
    الإعداد الأكثر قابلية للتنبؤ من جهة الخادم، فاستخدم مفتاح Anthropic API بدلًا من ذلك.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك Claude (Claude Pro أو Max)؟">
    نعم.

    أخبرنا موظفو Anthropic أن هذا الاستخدام مسموح مرة أخرى، لذا يتعامل OpenClaw مع
    إعادة استخدام Claude CLI واستخدام `claude -p` باعتبارهما معتمدين لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    لا يزال setup-token من Anthropic متاحًا كمسار رموز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
    بالنسبة إلى أحمال عمل الإنتاج أو متعددة المستخدمين، لا تزال مصادقة مفتاح Anthropic API
    الخيار الأكثر أمانًا والأكثر قابلية للتنبؤ. إذا أردت خيارات مستضافة أخرى بنمط الاشتراك
    في OpenClaw، فراجع [OpenAI](/ar/providers/openai)، [Qwen / Model
    Cloud](/ar/providers/qwen)، [MiniMax](/ar/providers/minimax)، و[نماذج GLM](/ar/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="لماذا أرى HTTP 429 rate_limit_error من Anthropic؟">
    يعني ذلك أن **حصة/حد معدل Anthropic** لديك قد استُنفد في النافذة الحالية. إذا كنت
    تستخدم **Claude CLI**، فانتظر حتى تُعاد ضبط النافذة أو رقِّ خطتك. إذا كنت
    تستخدم **مفتاح Anthropic API**، فتحقق من Anthropic Console
    للاطلاع على الاستخدام/الفوترة وارفع الحدود حسب الحاجة.

    إذا كانت الرسالة تحديدًا:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    الإصدار التجريبي لسياق Anthropic بحجم 1M (`context1m: true`). يعمل ذلك فقط عندما تكون
    بيانات اعتمادك مؤهلة لفوترة السياق الطويل (فوترة مفتاح API أو مسار
    تسجيل دخول Claude في OpenClaw مع تمكين Extra Usage).

    نصيحة: اضبط **نموذجًا احتياطيًا** حتى يتمكن OpenClaw من مواصلة الرد عندما يكون أحد المزوّدين محدود المعدّل.
    راجع [النماذج](/ar/cli/models)، و[OAuth](/ar/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. لدى OpenClaw مزوّد **Amazon Bedrock (Converse)** مضمّن. عند وجود علامات بيئة AWS، يستطيع OpenClaw اكتشاف كتالوج Bedrock للبث/النص تلقائيًا ودمجه كمزوّد `amazon-bedrock` ضمني؛ وإلا يمكنك تفعيل `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحةً أو إضافة إدخال مزوّد يدوي. راجع [Amazon Bedrock](/ar/providers/bedrock) و[مزوّدي النماذج](/ar/providers/models). إذا كنت تفضّل مسار مفاتيح مُدارًا، فسيظل استخدام وسيط متوافق مع OpenAI أمام Bedrock خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth (تسجيل الدخول إلى ChatGPT). استخدم
    `openai-codex/gpt-5.5` لمصادقة Codex OAuth عبر مشغّل PI الافتراضي. استخدم
    `openai/gpt-5.5` للوصول المباشر بمفتاح OpenAI API. يمكن لـ GPT-5.5 أيضًا استخدام
    الاشتراك/OAuth عبر `openai-codex/gpt-5.5` أو تشغيلات خادم تطبيق Codex الأصلية
    مع `openai/gpt-5.5` و`agentRuntime.id: "codex"`.
    راجع [مزوّدي النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا لا يزال OpenClaw يذكر openai-codex؟">
    `openai-codex` هو معرّف المزوّد وملف المصادقة لمصادقة ChatGPT/Codex OAuth.
    وهو أيضًا بادئة نموذج PI الصريحة لمصادقة Codex OAuth:

    - `openai/gpt-5.5` = مسار مفتاح OpenAI API المباشر الحالي في PI
    - `openai-codex/gpt-5.5` = مسار Codex OAuth في PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = مسار خادم تطبيق Codex الأصلي
    - `openai-codex:...` = معرّف ملف المصادقة، وليس مرجع نموذج

    إذا كنت تريد مسار الفوترة/الحدود المباشر لمنصة OpenAI، فاضبط
    `OPENAI_API_KEY`. إذا كنت تريد مصادقة اشتراك ChatGPT/Codex، فسجّل الدخول باستخدام
    `openclaw models auth login --provider openai-codex` واستخدم
    مراجع نماذج `openai-codex/*` لتشغيلات PI.

  </Accordion>

  <Accordion title="لماذا قد تختلف حدود Codex OAuth عن ChatGPT على الويب؟">
    يستخدم Codex OAuth نوافذ حصص مُدارة من OpenAI وتعتمد على الخطة. عمليًا،
    قد تختلف تلك الحدود عن تجربة موقع/تطبيق ChatGPT، حتى عندما يكون
    كلاهما مرتبطًا بالحساب نفسه.

    يمكن لـ OpenClaw إظهار نوافذ استخدام/حصة المزوّد المرئية حاليًا في
    `openclaw models status`، لكنه لا يخترع استحقاقات ChatGPT على الويب أو يطبّعها
    إلى وصول مباشر إلى API. إذا كنت تريد مسار الفوترة/الحدود المباشر لمنصة OpenAI،
    فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك OpenAI (Codex OAuth)؟">
    نعم. يدعم OpenClaw بالكامل **اشتراك OpenAI Code (Codex) عبر OAuth**.
    تسمح OpenAI صراحةً باستخدام OAuth للاشتراكات في الأدوات/سير العمل الخارجية
    مثل OpenClaw. يمكن للإعداد الأولي تشغيل تدفق OAuth نيابةً عنك.

    راجع [OAuth](/ar/concepts/oauth)، و[مزوّدي النماذج](/ar/concepts/model-providers)، و[الإعداد الأولي (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أعدّ Gemini CLI OAuth؟">
    يستخدم Gemini CLI **تدفق مصادقة Plugin**، وليس معرّف عميل أو سرًا في `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا حتى يكون `gemini` على `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. فعّل Plugin: `openclaw plugins enable google`
    3. سجّل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: `google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway

    يخزّن هذا رموز OAuth في ملفات المصادقة على مضيف Gateway. التفاصيل: [مزوّدو النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للمحادثات العادية؟">
    غالبًا لا. يحتاج OpenClaw إلى سياق كبير + أمان قوي؛ البطاقات الصغيرة تقتطع وتسرّب. إذا كان لا بد من ذلك، فشغّل **أكبر** بناء نموذج يمكنك تشغيله محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). تزيد النماذج الأصغر/المكمّمة مخاطر حقن التعليمات - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أبقي حركة مرور النماذج المستضافة في منطقة محددة؟">
    اختر نقاط نهاية مثبتة بالمنطقة. يوفّر OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر النسخة المستضافة في الولايات المتحدة لإبقاء البيانات داخل المنطقة. لا يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه باستخدام `models.mode: "merge"` حتى تظل البدائل الاحتياطية متاحة مع احترام المزوّد الإقليمي الذي تختاره.
  </Accordion>

  <Accordion title="هل يجب أن أشتري Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux (Windows عبر WSL2). جهاز Mac mini اختياري - يشتريه بعض الأشخاص كمضيف يعمل دائمًا، لكن VPS صغيرًا أو خادمًا منزليًا أو جهازًا من فئة Raspberry Pi يعمل أيضًا.

    تحتاج إلى Mac فقط **للأدوات الخاصة بـ macOS فقط**. بالنسبة إلى iMessage، استخدم [BlueBubbles](/ar/channels/bluebubbles) (موصى به) - يعمل خادم BlueBubbles على أي Mac، ويمكن أن يعمل Gateway على Linux أو في مكان آخر. إذا كنت تريد أدوات أخرى خاصة بـ macOS فقط، فشغّل Gateway على Mac أو اقرن عقدة macOS.

    المستندات: [BlueBubbles](/ar/channels/bluebubbles)، و[العُقد](/ar/nodes)، و[وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **جهاز macOS ما** مسجّل الدخول إلى Messages. ليس من الضروري أن يكون Mac mini -
    أي Mac يفي بالغرض. **استخدم [BlueBubbles](/ar/channels/bluebubbles)** (موصى به) لـ iMessage - يعمل خادم BlueBubbles على macOS، بينما يمكن أن يعمل Gateway على Linux أو في مكان آخر.

    الإعدادات الشائعة:

    - شغّل Gateway على Linux/VPS، وشغّل خادم BlueBubbles على أي Mac مسجّل الدخول إلى Messages.
    - شغّل كل شيء على Mac إذا كنت تريد أبسط إعداد لجهاز واحد.

    المستندات: [BlueBubbles](/ar/channels/bluebubbles)، و[العُقد](/ar/nodes)،
    و[وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، هل يمكنني توصيله بـ MacBook Pro الخاص بي؟">
    نعم. يمكن لـ **Mac mini تشغيل Gateway**، ويمكن لـ MacBook Pro الاتصال كـ
    **عقدة** (جهاز مرافق). لا تشغّل العُقد Gateway - بل توفّر قدرات إضافية
    مثل الشاشة/الكاميرا/اللوحة و`system.run` على ذلك الجهاز.

    النمط الشائع:

    - Gateway على Mac mini (يعمل دائمًا).
    - يشغّل MacBook Pro تطبيق macOS أو مضيف عقدة ويقترن بـ Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    المستندات: [العُقد](/ar/nodes)، و[CLI العُقد](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    لا يُوصى باستخدام Bun. نرى أخطاء وقت تشغيل، خصوصًا مع WhatsApp وTelegram.
    استخدم **Node** لبوابات مستقرة.

    إذا كنت لا تزال تريد تجربة Bun، فافعل ذلك على Gateway غير إنتاجي
    بدون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ماذا يوضع في allowFrom؟">
    `channels.telegram.allowFrom` هو **معرّف مستخدم Telegram للمرسل البشري** (رقمي). وليس اسم مستخدم البوت.

    يطلب الإعداد معرّفات مستخدمين رقمية فقط. إذا كانت لديك بالفعل إدخالات `@username` قديمة في الإعدادات، فيمكن لـ `openclaw doctor --fix` محاولة حلّها.

    أكثر أمانًا (بدون بوت تابع لجهة خارجية):

    - أرسل رسالة مباشرة إلى البوت الخاص بك، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    Bot API الرسمي:

    - أرسل رسالة مباشرة إلى البوت الخاص بك، ثم استدعِ `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    جهة خارجية (أقل خصوصية):

    - أرسل رسالة مباشرة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع نسخ OpenClaw مختلفة؟">
    نعم، عبر **توجيه الوكلاء المتعددين**. اربط **رسالة مباشرة** WhatsApp لكل مرسل (النظير `kind: "direct"`، والمرسل بصيغة E.164 مثل `+15551234567`) بـ `agentId` مختلف، بحيث يحصل كل شخص على مساحة عمل ومخزن جلسات خاصين به. لا تزال الردود تأتي من **حساب WhatsApp نفسه**، كما أن التحكم في وصول الرسائل المباشرة (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) عام لكل حساب WhatsApp. راجع [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "محادثة سريعة" ووكيل "Opus للبرمجة"؟'>
    نعم. استخدم توجيه الوكلاء المتعددين: امنح كل وكيل نموذجه الافتراضي الخاص، ثم اربط المسارات الواردة (حساب المزوّد أو نظراء محددين) بكل وكيل. يوجد مثال إعداد في [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent). راجع أيضًا [النماذج](/ar/concepts/models) و[الإعدادات](/ar/gateway/configuration).
  </Accordion>

  <Accordion title="هل يعمل Homebrew على Linux؟">
    نعم. يدعم Homebrew نظام Linux (Linuxbrew). إعداد سريع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    إذا كنت تشغّل OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` (أو بادئة brew لديك) حتى تُحلّ الأدوات المثبتة بواسطة `brew` في الأصداف غير الخاصة بتسجيل الدخول.
    تضيف البُنى الحديثة أيضًا أدلة bin الشائعة للمستخدم في خدمات systemd على Linux في المقدمة (مثل `~/.local/bin`، و`~/.npm-global/bin`، و`~/.local/share/pnpm`، و`~/.bun/bin`) وتحترم `PNPM_HOME`، و`NPM_CONFIG_PREFIX`، و`BUN_INSTALL`، و`VOLTA_HOME`، و`ASDF_DATA_DIR`، و`NVM_DIR`، و`FNM_DIR` عند ضبطها.

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
    هذا **لا يحذف بياناتك** - إنه يغيّر فقط تثبيت كود OpenClaw.
    تبقى حالتك (`~/.openclaw`) ومساحة عملك (`~/.openclaw/workspace`) دون مساس.

    من npm إلى git:

    ```bash
    openclaw update --channel dev
    ```

    من git إلى npm:

    ```bash
    openclaw update --channel stable
    ```

    أضف `--dry-run` لمعاينة تبديل الوضع المخطط أولًا. يشغّل المحدّث
    متابعات Doctor، ويحدّث مصادر Plugin للقناة المستهدفة، ويعيد
    تشغيل Gateway ما لم تمرر `--no-restart`.

    يمكن للمثبّت أيضًا فرض أي من الوضعين:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نصائح النسخ الاحتياطي: راجع [استراتيجية النسخ الاحتياطي](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="هل ينبغي أن أشغّل Gateway على حاسوبي المحمول أم على VPS؟">
    الإجابة المختصرة: **إذا كنت تريد موثوقية على مدار الساعة، فاستخدم VPS**. إذا كنت تريد
    أقل قدر من التعقيد ولا تمانع السكون/إعادة التشغيل، فشغّله محليًا.

    **الحاسوب المحمول (Gateway محلي)**

    - **الإيجابيات:** لا توجد تكلفة خادم، وصول مباشر إلى الملفات المحلية، نافذة متصفح مباشرة.
    - **السلبيات:** السكون/انقطاع الشبكة = انقطاعات اتصال، تحديثات/إعادة تشغيل نظام التشغيل تعطل العمل، ويجب أن يبقى الجهاز مستيقظًا.

    **VPS / السحابة**

    - **الإيجابيات:** يعمل دائمًا، شبكة مستقرة، لا توجد مشكلات سكون الحاسوب المحمول، أسهل في إبقائه قيد التشغيل.
    - **السلبيات:** غالبًا يعمل بلا واجهة رسومية (استخدم لقطات الشاشة)، وصول عن بُعد إلى الملفات فقط، ويجب استخدام SSH للتحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp/Telegram/Slack/Mattermost/Discord كلها بشكل جيد من VPS. المفاضلة الحقيقية الوحيدة هي **متصفح بلا واجهة رسومية** مقابل نافذة مرئية. راجع [المتصفح](/ar/tools/browser).

    **الإعداد الافتراضي الموصى به:** VPS إذا واجهت انقطاعات في Gateway من قبل. الخيار المحلي ممتاز عندما تستخدم Mac بنشاط وتريد وصولًا محليًا إلى الملفات أو أتمتة واجهة المستخدم مع متصفح مرئي.

  </Accordion>

  <Accordion title="ما مدى أهمية تشغيل OpenClaw على جهاز مخصص؟">
    ليس مطلوبًا، لكنه **موصى به للموثوقية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Pi):** يعمل دائمًا، وانقطاعات أقل بسبب السكون/إعادة التشغيل، وأذونات أنظف، وأسهل في إبقائه قيد التشغيل.
    - **حاسوب محمول/مكتبي مشترك:** مناسب تمامًا للاختبار والاستخدام النشط، لكن توقع توقفات مؤقتة عندما يدخل الجهاز في وضع السكون أو يجري تحديثات.

    إذا أردت الجمع بين مزايا الخيارين، أبقِ Gateway على مضيف مخصص واقرن حاسوبك المحمول بوصفه **Node** لأدوات الشاشة/الكاميرا/التنفيذ المحلية. راجع [Nodes](/ar/nodes).
    لإرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما الحد الأدنى لمتطلبات VPS ونظام التشغيل الموصى به؟">
    OpenClaw خفيف الوزن. بالنسبة إلى Gateway أساسي + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** 1 vCPU، وذاكرة RAM بسعة 1GB، وقرص بسعة نحو 500MB.
    - **الموصى به:** 1-2 vCPU، وذاكرة RAM بسعة 2GB أو أكثر لتوفير هامش إضافي (السجلات، الوسائط، قنوات متعددة). يمكن أن تكون أدوات Node وأتمتة المتصفح كثيرة الاستهلاك للموارد.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). مسار تثبيت Linux هو الأفضل اختبارًا هناك.

    الوثائق: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw في VM وما المتطلبات؟">
    نعم. عامل VM مثل VPS: يجب أن يكون قيد التشغيل دائمًا، وقابلًا للوصول، وأن يمتلك ذاكرة
    RAM كافية لـ Gateway وأي قنوات تمكّنها.

    الإرشادات الأساسية:

    - **الحد الأدنى المطلق:** 1 vCPU، وذاكرة RAM بسعة 1GB.
    - **الموصى به:** ذاكرة RAM بسعة 2GB أو أكثر إذا كنت تشغّل قنوات متعددة، أو أتمتة المتصفح، أو أدوات الوسائط.
    - **نظام التشغيل:** Ubuntu LTS أو Debian/Ubuntu حديث آخر.

    إذا كنت تستخدم Windows، فإن **WSL2 هو أسهل إعداد بأسلوب VM** ويتمتع بأفضل توافق
    مع الأدوات. راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    إذا كنت تشغّل macOS داخل VM، فراجع [macOS VM](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية (النماذج، الجلسات، Gateway، الأمان، والمزيد)
- [نظرة عامة على التثبيت](/ar/install)
- [بدء الاستخدام](/ar/start/getting-started)
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
