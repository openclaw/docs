---
read_when:
    - تثبيت جديد، أو تعطل الإعداد الأوّلي، أو أخطاء التشغيل الأول
    - اختيار المصادقة واشتراكات المزوّدين
    - يتعذّر الوصول إلى docs.openclaw.ai، ويتعذّر فتح لوحة التحكم، والتثبيت عالق
sidebarTitle: First-run FAQ
summary: 'الأسئلة الشائعة: البدء السريع وإعداد التشغيل الأول — التثبيت، والتهيئة، والمصادقة، والاشتراكات، والإخفاقات الأولية'
title: 'الأسئلة الشائعة: إعداد التشغيل الأول'
x-i18n:
    generated_at: "2026-05-07T13:20:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347a09ebdbdf564389b406de3d5d47d097ead33d33eed4a68880bfbcaf82e048
    source_path: help/faq-first-run.md
    workflow: 16
---

  أسئلة وأجوبة للبدء السريع والتشغيل الأول. للعمليات اليومية، والنماذج، والمصادقة، والجلسات،
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## البدء السريع وإعداد التشغيل الأول

  <AccordionGroup>
  <Accordion title="أواجه مشكلة، أسرع طريقة لتجاوزها">
    استخدم وكيل ذكاء اصطناعي محليًا يمكنه **رؤية جهازك**. هذا أكثر فاعلية بكثير من السؤال
    في Discord، لأن معظم حالات "أنا عالق" تكون **مشكلات إعداد محلي أو بيئة** لا يستطيع
    المساعدون عن بُعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    تستطيع هذه الأدوات قراءة المستودع، وتشغيل الأوامر، وفحص السجلات، والمساعدة في إصلاح الإعدادات
    على مستوى الجهاز (PATH، والخدمات، والأذونات، وملفات المصادقة). امنحها **نسخة المصدر الكاملة**
    عبر التثبيت القابل للتعديل (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يثبّت هذا OpenClaw **من نسخة عمل git**، بحيث يستطيع الوكيل قراءة الكود + الوثائق
    والاستدلال حول الإصدار الدقيق الذي تشغله. يمكنك دائمًا الرجوع إلى الإصدار المستقر لاحقًا
    بإعادة تشغيل المثبّت من دون `--install-method git`.

    نصيحة: اطلب من الوكيل **تخطيط الإصلاح والإشراف عليه** (خطوة بخطوة)، ثم نفّذ الأوامر
    الضرورية فقط. هذا يُبقي التغييرات صغيرة وأسهل في المراجعة.

    إذا اكتشفت خطأً حقيقيًا أو إصلاحًا، فيُرجى فتح مشكلة على GitHub أو إرسال طلب سحب:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    ابدأ بهذه الأوامر (شارك المخرجات عند طلب المساعدة):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    ما الذي تفعله:

    - `openclaw status`: لقطة سريعة لصحة Gateway/الوكيل + الإعداد الأساسي.
    - `openclaw models status`: يتحقق من مصادقة الموفر + توفر النموذج.
    - `openclaw doctor`: يتحقق من مشكلات الإعداد/الحالة الشائعة ويصلحها.

    فحوصات CLI مفيدة أخرى: `openclaw status --all`، `openclaw logs --follow`،
    `openclaw gateway status`، `openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان شيء ما معطلاً](/ar/help/faq#first-60-seconds-if-something-is-broken).
    وثائق التثبيت: [التثبيت](/ar/install)، [خيارات المثبّت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="يستمر Heartbeat في التخطي. ماذا تعني أسباب التخطي؟">
    أسباب تخطي Heartbeat الشائعة:

    - `quiet-hours`: خارج نافذة ساعات النشاط المهيأة
    - `empty-heartbeat-file`: يوجد `HEARTBEAT.md` لكنه لا يحتوي إلا على هيكل فارغ/بعناوين فقط
    - `no-tasks-due`: وضع مهام `HEARTBEAT.md` نشط، لكن لم يحِن بعد أي من فواصل المهام
    - `alerts-disabled`: تم تعطيل كل مؤشرات رؤية Heartbeat (`showOk`، و`showAlerts`، و`useIndicator` كلها متوقفة)

    في وضع المهام، لا تتقدم طوابع مواعيد الاستحقاق الزمنية إلا بعد اكتمال تشغيل Heartbeat
    حقيقي. عمليات التشغيل المتخطاة لا تعلّم المهام كمكتملة.

    الوثائق: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="الطريقة الموصى بها لتثبيت OpenClaw وإعداده">
    يوصي المستودع بالتشغيل من المصدر واستخدام الإعداد التمهيدي:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    يستطيع المعالج أيضًا بناء أصول واجهة المستخدم تلقائيًا. بعد الإعداد التمهيدي، تشغّل عادةً Gateway على المنفذ **18789**.

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

  <Accordion title="كيف أفتح لوحة التحكم بعد الإعداد التمهيدي؟">
    يفتح المعالج المتصفح بعنوان URL نظيف (غير مضمّن برمز) للوحة التحكم مباشرةً بعد الإعداد التمهيدي، ويطبع الرابط أيضًا في الملخص. أبقِ ذلك التبويب مفتوحًا؛ إذا لم يفتح، فانسخ/الصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أصادق لوحة التحكم على localhost مقارنة بالوصول البعيد؟">
    **localhost (الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلب مصادقة بسر مشترك، فالصق الرمز المهيأ أو كلمة المرور في إعدادات واجهة التحكم.
    - مصدر الرمز: `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر كلمة المرور: `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يتم تكوين سر مشترك بعد، فأنشئ رمزًا باستخدام `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** (موصى به): أبقِ الربط على loopback، وشغّل `openclaw gateway --tailscale serve`، وافتح `https://<magicdns>/`. إذا كانت `gateway.auth.allowTailscale` تساوي `true`، فإن ترويسات الهوية تلبّي مصادقة واجهة التحكم/WebSocket (لا حاجة إلى لصق سر مشترك، مع افتراض أن مضيف Gateway موثوق)؛ لا تزال واجهات API عبر HTTP تتطلب مصادقة بسر مشترك ما لم تستخدم عمدًا private-ingress `none` أو مصادقة HTTP عبر trusted-proxy.
      تُسلسل محاولات مصادقة Serve المتزامنة السيئة من العميل نفسه قبل أن يسجلها محدِّد المصادقة الفاشلة، لذلك قد تُظهر المحاولة السيئة الثانية بالفعل `retry later`.
    - **ربط Tailnet**: شغّل `openclaw gateway --bind tailnet --token "<token>"` (أو هيّئ مصادقة كلمة المرور)، وافتح `http://<tailscale-ip>:18789/`، ثم الصق السر المشترك المطابق في إعدادات لوحة التحكم.
    - **وكيل عكسي واعٍ بالهوية**: أبقِ Gateway خلف وكيل موثوق، وهيّئ `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل. تتطلب وكلاء loopback على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`.
    - **نفق SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. لا تزال مصادقة السر المشترك تنطبق عبر النفق؛ الصق الرمز المهيأ أو كلمة المرور إذا طُلب منك ذلك.

    راجع [لوحة التحكم](/ar/web/dashboard) و[واجهات الويب](/ar/web) لمعرفة أوضاع الربط وتفاصيل المصادقة.

  </Accordion>

  <Accordion title="لماذا يوجد إعدادان لموافقات exec لموافقات الدردشة؟">
    إنهما يتحكمان في طبقات مختلفة:

    - `approvals.exec`: يمرّر مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: يجعل تلك القناة تعمل كعميل موافقة أصلي لموافقات exec

    تظل سياسة exec على المضيف هي بوابة الموافقة الحقيقية. لا يتحكم إعداد الدردشة إلا في مكان ظهور
    مطالبات الموافقة وكيف يستطيع الأشخاص الإجابة عنها.

    في معظم الإعدادات لا تحتاج إلى كليهما:

    - إذا كانت الدردشة تدعم الأوامر والردود بالفعل، فإن `/approve` في الدردشة نفسها يعمل عبر المسار المشترك.
    - إذا استطاعت قناة أصلية مدعومة استنتاج الموافقين بأمان، فإن OpenClaw يفعّل الآن تلقائيًا الموافقات الأصلية التي تبدأ برسالة مباشرة عندما يكون `channels.<channel>.execApprovals.enabled` غير مضبوط أو مضبوطًا على `"auto"`.
    - عندما تتوفر بطاقات/أزرار موافقة أصلية، تكون واجهة المستخدم الأصلية هذه هي المسار الأساسي؛ ولا ينبغي للوكيل تضمين أمر `/approve` يدوي إلا إذا قالت نتيجة الأداة إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب أيضًا تمرير المطالبات إلى دردشات أخرى أو غرف عمليات صريحة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحةً نشر مطالبات الموافقة مرة أخرى في الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة أيضًا: تستخدم `/approve` في الدردشة نفسها افتراضيًا، مع تمرير اختياري عبر `approvals.plugin`، وتحتفظ بعض القنوات الأصلية فقط بمعالجة أصلية لموافقات Plugin فوق ذلك.

    الخلاصة: إعادة التوجيه للتوجيه، وإعداد العميل الأصلي لتجربة مستخدم أغنى خاصة بالقناة.
    راجع [موافقات exec](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما بيئة التشغيل التي أحتاجها؟">
    يلزم Node **>= 22**. يوصى باستخدام `pnpm`. لا يوصى باستخدام Bun مع Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. Gateway خفيف - تذكر الوثائق أن **512MB-1GB RAM**، و**نواة واحدة**، ونحو **500MB**
    من مساحة القرص كافية للاستخدام الشخصي، وتشير إلى أن **Raspberry Pi 4 يمكنه تشغيله**.

    إذا أردت هامشًا إضافيًا (السجلات، والوسائط، والخدمات الأخرى)، فيوصى بـ **2GB**، لكنه
    ليس حدًا أدنى صارمًا.

    نصيحة: يمكن لـ Pi/VPS صغير استضافة Gateway، ويمكنك إقران **العُقد** على حاسوبك المحمول/هاتفك من أجل
    الشاشة/الكاميرا/canvas المحلية أو تنفيذ الأوامر. راجع [العُقد](/ar/nodes).

  </Accordion>

  <Accordion title="أي نصائح لتثبيت Raspberry Pi؟">
    الخلاصة: يعمل، لكن توقّع بعض التعقيدات.

    - استخدم نظام تشغيل **64-bit** وأبقِ Node >= 22.
    - فضّل **التثبيت القابل للتعديل (git)** حتى تتمكن من رؤية السجلات والتحديث بسرعة.
    - ابدأ من دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات ثنائية غريبة، فهي عادةً مشكلة **توافق ARM**.

    الوثائق: [Linux](/ar/platforms/linux)، [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق عند «استيقظ يا صديقي» / الإعداد التمهيدي لا يبدأ. ماذا الآن؟">
    تعتمد تلك الشاشة على إمكانية الوصول إلى Gateway والمصادقة معه. يرسل TUI أيضًا
    "استيقظ يا صديقي!" تلقائيًا عند البدء الأول. إذا رأيت ذلك السطر مع **عدم وجود رد**
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

    إذا كان Gateway بعيدًا، فتأكد من أن اتصال النفق/Tailscale يعمل وأن واجهة المستخدم
    تشير إلى Gateway الصحيح. راجع [الوصول عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="هل يمكنني ترحيل إعدادي إلى جهاز جديد (Mac mini) من دون إعادة الإعداد التمهيدي؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغّل Doctor مرة واحدة. هذا
    يُبقي بوتك "بالضبط كما هو" (الذاكرة، وسجل الجلسات، والمصادقة، وحالة القنوات)
    ما دمت تنسخ **الموقعين**:

    1. ثبّت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة عملك (الافتراضي: `~/.openclaw/workspace`).
    4. شغّل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    يحافظ ذلك على الإعداد، وملفات تعريف المصادقة، وبيانات اعتماد WhatsApp، والجلسات، والذاكرة. إذا كنت في
    الوضع البعيد، فتذكّر أن مضيف Gateway يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا كنت تكتفي بعمل commit/push لمساحة عملك إلى GitHub، فأنت تنسخ احتياطيًا
    **الذاكرة + ملفات التمهيد**، لكن **ليس** سجل الجلسات أو المصادقة. توجد هذه
    تحت `~/.openclaw/` (مثلًا `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [أين توجد الأشياء على القرص](/ar/help/faq#where-things-live-on-disk)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أرى ما الجديد في أحدث إصدار؟">
    تحقق من سجل تغييرات GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    أحدث الإدخالات في الأعلى. إذا كان القسم العلوي موسومًا بـ **غير مُصدَر**، فإن القسم المؤرخ التالي
    هو أحدث إصدار منشور. تُجمع الإدخالات حسب **أبرز النقاط**، و**التغييرات**، و
    **الإصلاحات** (إضافةً إلى الوثائق/الأقسام الأخرى عند الحاجة).

  </Accordion>

  <Accordion title="لا يمكن الوصول إلى docs.openclaw.ai (خطأ SSL)">
    تحظر بعض اتصالات Comcast/Xfinity نطاق `docs.openclaw.ai` خطأً عبر Xfinity
    Advanced Security. عطّله أو أدرج `docs.openclaw.ai` في قائمة السماح، ثم أعد المحاولة.
    يُرجى مساعدتنا على إلغاء الحظر عنه بالإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    إذا كنت لا تزال لا تستطيع الوصول إلى الموقع، فالوثائق منسوخة على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="الفرق بين المستقر والبيتا">
    **المستقر** و**البيتا** هما **وسما توزيع npm**، وليسا مساري كود منفصلين:

    - `latest` = مستقر
    - `beta` = إصدار مبكر للاختبار

    عادة، يصل الإصدار المستقر إلى **beta** أولا، ثم تنقل خطوة
    ترقية صريحة تلك النسخة نفسها إلى `latest`. يمكن للمشرفين أيضا
    النشر مباشرة إلى `latest` عند الحاجة. لهذا السبب يمكن أن يشير بيتا والمستقر
    إلى **النسخة نفسها** بعد الترقية.

    اطّلع على ما تغيّر:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    للحصول على أوامر التثبيت المختصرة والفرق بين بيتا وdev، راجع الأكورديون أدناه.

  </Accordion>

  <Accordion title="كيف أثبت نسخة البيتا وما الفرق بين بيتا وdev؟">
    **بيتا** هو وسم توزيع npm `beta` (قد يطابق `latest` بعد الترقية).
    **Dev** هو رأس `main` المتحرك (git)؛ وعند نشره، يستخدم وسم توزيع npm `dev`.

    أوامر مختصرة (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مثبت Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    مزيد من التفاصيل: [قنوات التطوير](/ar/install/development-channels) و[أعلام المثبت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أجرب أحدث الأجزاء؟">
    خياران:

    1. **قناة Dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    ينتقل هذا إلى فرع `main` ويحدّث من المصدر.

    2. **تثبيت قابل للتعديل (من موقع المثبت):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يمنحك هذا مستودعا محليا يمكنك تعديله، ثم تحديثه عبر git.

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

  <Accordion title="كم يستغرق التثبيت والتهيئة الأولية عادة؟">
    دليل تقريبي:

    - **التثبيت:** 2-5 دقائق
    - **التهيئة الأولية:** 5-15 دقيقة حسب عدد القنوات/النماذج التي تهيئها

    إذا تعلّق، فاستخدم [المثبت عالق](#quick-start-and-first-run-setup)
    وحلقة التصحيح السريعة في [أنا عالق](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="المثبت عالق؟ كيف أحصل على ملاحظات أكثر؟">
    أعد تشغيل المثبت مع **إخراج مفصل**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    تثبيت بيتا مع إخراج مفصل:

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

    خيارات أكثر: [أعلام المثبت](/ar/install/installer).

  </Accordion>

  <Accordion title="تثبيت Windows يقول إن git غير موجود أو إن openclaw غير معروف">
    مشكلتان شائعتان على Windows:

    **1) خطأ npm spawn git / لم يتم العثور على git**

    - ثبّت **Git for Windows** وتأكد من أن `git` موجود في PATH لديك.
    - أغلق PowerShell وأعد فتحه، ثم أعد تشغيل المثبت.

    **2) openclaw غير معروف بعد التثبيت**

    - مجلد npm global bin ليس موجودا في PATH.
    - تحقق من المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف ذلك الدليل إلى PATH الخاص بالمستخدم لديك (لا حاجة إلى لاحقة `\bin` على Windows؛ في معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وأعد فتحه بعد تحديث PATH.

    إذا أردت أسلس إعداد على Windows، فاستخدم **WSL2** بدلا من Windows الأصلي.
    الوثائق: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="إخراج exec على Windows يعرض نصا صينيا مشوها - ماذا أفعل؟">
    يحدث هذا عادة بسبب عدم تطابق صفحة ترميز وحدة التحكم في قشور Windows الأصلية.

    الأعراض:

    - يعرض إخراج `system.run`/`exec` الصينية كنص مشوه
    - يظهر الأمر نفسه سليما في ملف تعريف طرفية آخر

    حل سريع في PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    ثم أعد تشغيل Gateway وأعد تجربة الأمر:

    ```powershell
    openclaw gateway restart
    ```

    إذا كان لا يزال بإمكانك إعادة إنتاج هذا على أحدث OpenClaw، فتتبعه/أبلغ عنه في:

    - [المشكلة #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="لم تجب الوثائق عن سؤالي - كيف أحصل على إجابة أفضل؟">
    استخدم **التثبيت القابل للتعديل (git)** حتى يكون لديك المصدر الكامل والوثائق محليا، ثم اسأل
    بوتك (أو Claude/Codex) _من ذلك المجلد_ حتى يتمكن من قراءة المستودع والإجابة بدقة.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مزيد من التفاصيل: [التثبيت](/ar/install) و[أعلام المثبت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أثبت OpenClaw على Linux؟">
    الإجابة المختصرة: اتبع دليل Linux، ثم شغّل التهيئة الأولية.

    - المسار السريع على Linux + تثبيت الخدمة: [Linux](/ar/platforms/linux).
    - شرح كامل: [بدء الاستخدام](/ar/start/getting-started).
    - المثبت + التحديثات: [التثبيت والتحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="كيف أثبت OpenClaw على VPS؟">
    يعمل أي VPS بنظام Linux. ثبّته على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول البعيد: [Gateway البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أدلة التثبيت السحابي/VPS؟">
    نحتفظ **بمركز استضافة** يضم المزودين الشائعين. اختر واحدا واتبع الدليل:

    - [استضافة VPS](/ar/vps) (كل المزودين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    كيف يعمل ذلك في السحابة: **يعمل Gateway على الخادم**، وتصل إليه
    من حاسوبك المحمول/هاتفك عبر واجهة التحكم (أو Tailscale/SSH). تعيش حالتك + مساحة عملك
    على الخادم، لذا عامل المضيف كمصدر الحقيقة وخذ نسخا احتياطية منه.

    يمكنك إقران **العقد** (Mac/iOS/Android/headless) مع Gateway السحابي ذلك للوصول
    إلى الشاشة/الكاميرا/canvas المحلية أو تشغيل أوامر على حاسوبك المحمول مع إبقاء
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول البعيد: [Gateway البعيد](/ar/gateway/remote).
    العقد: [العقد](/ar/nodes)، [CLI العقد](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني أن أطلب من OpenClaw تحديث نفسه؟">
    الإجابة المختصرة: **ممكن، غير موصى به**. يمكن لتدفق التحديث إعادة تشغيل
    Gateway (ما يقطع الجلسة النشطة)، وقد يحتاج إلى git checkout نظيف،
    ويمكن أن يطلب تأكيدا. الأكثر أمانا: شغّل التحديثات من shell بصفتك المشغل.

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

  <Accordion title="ما الذي تفعله التهيئة الأولية فعليا؟">
    `openclaw onboard` هو مسار الإعداد الموصى به. في **الوضع المحلي** يرشدك عبر:

    - **إعداد النموذج/المصادقة** (OAuth للمزود، مفاتيح API، setup-token من Anthropic، إضافة إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات البدء
    - **إعدادات Gateway** (bind/port/auth/tailscale)
    - **القنوات** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، إضافة إلى Plugins القنوات المضمّنة مثل QQ Bot)
    - **تثبيت الخادم الخفي** (LaunchAgent على macOS؛ وحدة مستخدم systemd على Linux/WSL2)
    - **فحوصات السلامة** واختيار **Skills**

    كما يحذرك إذا كان النموذج المهيأ لديك غير معروف أو تنقصه المصادقة.

  </Accordion>

  <Accordion title="هل أحتاج إلى اشتراك Claude أو OpenAI لتشغيل هذا؟">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** (Anthropic/OpenAI/وغيرها) أو باستخدام
    **نماذج محلية فقط** حتى تبقى بياناتك على جهازك. الاشتراكات (Claude
    Pro/Max أو OpenAI Codex) هي طرق اختيارية لمصادقة هؤلاء المزودين.

    بالنسبة إلى Anthropic في OpenClaw، التقسيم العملي هو:

    - **مفتاح Anthropic API**: فوترة Anthropic API العادية
    - **Claude CLI / مصادقة اشتراك Claude في OpenClaw**: أخبرنا موظفو Anthropic
      أن هذا الاستخدام مسموح به مرة أخرى، ويتعامل OpenClaw مع استخدام `claude -p`
      على أنه مصرح به لهذا التكامل ما لم تنشر Anthropic سياسة جديدة

    بالنسبة إلى مضيفي Gateway طويل الأمد، لا تزال مفاتيح Anthropic API هي الإعداد
    الأكثر قابلية للتنبؤ. يدعم OAuth الخاص بـ OpenAI Codex صراحة للأدوات الخارجية
    مثل OpenClaw.

    يدعم OpenClaw أيضا خيارات مستضافة أخرى بنمط الاشتراك، بما في ذلك
    **Qwen Cloud Coding Plan** و**MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan**.

    الوثائق: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [نماذج GLM](/ar/providers/glm)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام اشتراك Claude Max دون مفتاح API؟">
    نعم.

    أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذا
    يتعامل OpenClaw مع مصادقة اشتراك Claude واستخدام `claude -p` على أنهما مصرح
    بهما لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. إذا أردت
    الإعداد الأكثر قابلية للتنبؤ على جانب الخادم، فاستخدم مفتاح Anthropic API بدلا من ذلك.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك Claude (Claude Pro أو Max)؟">
    نعم.

    أخبرنا موظفو Anthropic أن هذا الاستخدام مسموح به مرة أخرى، لذا يتعامل OpenClaw مع
    إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مصرح بهما لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    لا يزال setup-token من Anthropic متاحا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
    بالنسبة إلى أحمال العمل الإنتاجية أو متعددة المستخدمين، لا تزال مصادقة مفتاح Anthropic API هي
    الخيار الأكثر أمانا وقابلية للتنبؤ. إذا أردت خيارات مستضافة أخرى بنمط الاشتراك
    في OpenClaw، فراجع [OpenAI](/ar/providers/openai)، [Qwen / Model
    Cloud](/ar/providers/qwen)، [MiniMax](/ar/providers/minimax)، و[نماذج GLM](/ar/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="لماذا أرى HTTP 429 rate_limit_error من Anthropic؟">
    يعني ذلك أن **حصة/حد معدل Anthropic** لديك قد استنفد للنافذة الحالية. إذا كنت
    تستخدم **Claude CLI**، فانتظر إعادة ضبط النافذة أو رقّ خطتك. إذا كنت
    تستخدم **مفتاح Anthropic API**، فتحقق من Anthropic Console
    للاطلاع على الاستخدام/الفوترة وارفع الحدود حسب الحاجة.

    إذا كانت الرسالة تحديدًا:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    Anthropic's 1M context beta (`context1m: true`). يعمل ذلك فقط عندما تكون
    بيانات اعتمادك مؤهلة لفوترة السياق الطويل (فوترة مفتاح API أو مسار
    تسجيل الدخول إلى Claude في OpenClaw مع تمكين Extra Usage).

    نصيحة: عيّن **نموذجًا احتياطيًا** حتى يتمكن OpenClaw من الاستمرار في الرد عندما يكون مزود ما محدودًا بمعدل الاستخدام.
    راجع [النماذج](/ar/cli/models)، و[OAuth](/ar/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. يحتوي OpenClaw على مزود **Amazon Bedrock (Converse)** مضمّن. عند وجود علامات بيئة AWS، يستطيع OpenClaw اكتشاف كتالوج Bedrock للنص/البث تلقائيًا ودمجه كمزود ضمني باسم `amazon-bedrock`؛ وإلا يمكنك تمكين `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحةً أو إضافة إدخال مزود يدوي. راجع [Amazon Bedrock](/ar/providers/bedrock) و[مزودو النماذج](/ar/providers/models). إذا كنت تفضل تدفق مفتاح مُدارًا، فإن استخدام وكيل متوافق مع OpenAI أمام Bedrock يظل خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth (تسجيل الدخول إلى ChatGPT). استخدم
    `openai/gpt-5.5` مع `agentRuntime.id: "codex"` للإعداد الشائع:
    مصادقة اشتراك ChatGPT/Codex مع تنفيذ خادم تطبيق Codex الأصلي. استخدم
    `openai-codex/gpt-5.5` فقط عندما تريد OAuth الخاص بـ Codex عبر وقت تشغيل
    Codex الافتراضي. يظل الوصول المباشر بمفتاح OpenAI API متاحًا لأسطح
    OpenAI API غير الخاصة بالوكلاء، ولنماذج الوكلاء عبر ملف تعريف مفتاح API
    مرتب باسم `openai-codex`.
    راجع [مزودو النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا لا يزال OpenClaw يذكر openai-codex؟">
    `openai-codex` هو معرف المزود وملف تعريف المصادقة لـ OAuth الخاص بـ ChatGPT/Codex.
    استخدمته الإعدادات الأقدم أيضًا كبادئة نموذج:

    - `openai/gpt-5.5` = مصادقة اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي لدورات الوكيل
    - `openai-codex/gpt-5.5` = مسار نموذج قديم يصلحه `openclaw doctor --fix`
    - `openai/gpt-5.5` بالإضافة إلى ملف تعريف مفتاح API مرتب باسم `openai-codex` = مصادقة مفتاح API لنموذج وكيل OpenAI
    - `openai-codex:...` = معرف ملف تعريف المصادقة، وليس مرجع نموذج

    إذا كنت تريد مسار الفوترة/الحدود المباشر لـ OpenAI Platform، فعيّن
    `OPENAI_API_KEY`. إذا كنت تريد مصادقة اشتراك ChatGPT/Codex، فسجّل الدخول باستخدام
    `openclaw models auth login --provider openai-codex`. أبقِ مرجع النموذج كما هو
    `openai/gpt-5.5`؛ مراجع نماذج `openai-codex/*` هي إعدادات قديمة يعيد
    `openclaw doctor --fix` كتابتها.

  </Accordion>

  <Accordion title="لماذا قد تختلف حدود OAuth الخاص بـ Codex عن ChatGPT على الويب؟">
    يستخدم OAuth الخاص بـ Codex نوافذ حصص مُدارة من OpenAI وتعتمد على الخطة. عمليًا،
    يمكن أن تختلف هذه الحدود عن تجربة موقع/تطبيق ChatGPT، حتى عندما
    يكون كلاهما مرتبطًا بالحساب نفسه.

    يمكن لـ OpenClaw عرض نوافذ استخدام/حصة المزود المرئية حاليًا في
    `openclaw models status`، لكنه لا ينشئ استحقاقات ChatGPT على الويب أو يطبعها
    إلى وصول API مباشر. إذا كنت تريد مسار الفوترة/الحدود المباشر لـ OpenAI Platform،
    فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك OpenAI (OAuth الخاص بـ Codex)؟">
    نعم. يدعم OpenClaw بالكامل **OAuth اشتراك OpenAI Code (Codex)**.
    تسمح OpenAI صراحةً باستخدام OAuth الخاص بالاشتراك في الأدوات/سير العمل الخارجية
    مثل OpenClaw. يمكن للإعداد الأولي تشغيل تدفق OAuth نيابةً عنك.

    راجع [OAuth](/ar/concepts/oauth)، و[مزودو النماذج](/ar/concepts/model-providers)، و[الإعداد الأولي (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أعد OAuth الخاص بـ Gemini CLI؟">
    يستخدم Gemini CLI **تدفق مصادقة Plugin**، وليس معرف عميل أو سرًا في `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا حتى يكون `gemini` موجودًا في `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. فعّل Plugin: `openclaw plugins enable google`
    3. سجّل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: `google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway

    يخزن هذا رموز OAuth في ملفات تعريف المصادقة على مضيف Gateway. التفاصيل: [مزودو النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للمحادثات العادية؟">
    غالبًا لا. يحتاج OpenClaw إلى سياق كبير + أمان قوي؛ البطاقات الصغيرة تقتطع وتسرّب. إذا كان لا بد من ذلك، فشغّل **أكبر** بنية نموذج يمكنك تشغيلها محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). تزيد النماذج الأصغر/المكمّمة من خطر حقن المطالبات - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أبقي حركة نماذج الاستضافة في منطقة محددة؟">
    اختر نقاط نهاية مثبتة بالمنطقة. يوفر OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر النسخة المستضافة في الولايات المتحدة لإبقاء البيانات داخل المنطقة. لا يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه الخيارات باستخدام `models.mode: "merge"` حتى تبقى النماذج الاحتياطية متاحة مع احترام المزود الإقليمي الذي تختاره.
  </Accordion>

  <Accordion title="هل يجب أن أشتري Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux (Windows عبر WSL2). جهاز Mac mini اختياري - يشتريه بعض الأشخاص
    كمضيف يعمل دائمًا، لكن VPS صغيرًا أو خادمًا منزليًا أو جهازًا من فئة Raspberry Pi يصلح أيضًا.

    تحتاج إلى Mac فقط **للأدوات الخاصة بـ macOS فقط**. بالنسبة إلى iMessage، استخدم [BlueBubbles](/ar/channels/bluebubbles) (موصى به) - يعمل خادم BlueBubbles على أي Mac، ويمكن أن يعمل Gateway على Linux أو في مكان آخر. إذا كنت تريد أدوات أخرى خاصة بـ macOS فقط، فشغّل Gateway على Mac أو اقرن عقدة macOS.

    المستندات: [BlueBubbles](/ar/channels/bluebubbles)، و[العقد](/ar/nodes)، و[وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **جهاز macOS ما** مسجل الدخول إلى Messages. ليس من الضروري **أن** يكون Mac mini -
    أي Mac يصلح. **استخدم [BlueBubbles](/ar/channels/bluebubbles)** (موصى به) لـ iMessage - يعمل خادم BlueBubbles على macOS، بينما يمكن أن يعمل Gateway على Linux أو في مكان آخر.

    الإعدادات الشائعة:

    - شغّل Gateway على Linux/VPS، وشغّل خادم BlueBubbles على أي Mac مسجل الدخول إلى Messages.
    - شغّل كل شيء على Mac إذا كنت تريد أبسط إعداد على جهاز واحد.

    المستندات: [BlueBubbles](/ar/channels/bluebubbles)، و[العقد](/ar/nodes)،
    و[وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، هل يمكنني توصيله بجهاز MacBook Pro الخاص بي؟">
    نعم. يمكن لـ **Mac mini تشغيل Gateway**، ويمكن لجهاز MacBook Pro الاتصال بصفته
    **عقدة** (جهازًا مرافقًا). لا تشغّل العقد Gateway - بل توفر قدرات إضافية
    مثل الشاشة/الكاميرا/اللوحة و`system.run` على ذلك الجهاز.

    النمط الشائع:

    - Gateway على Mac mini (يعمل دائمًا).
    - يشغّل MacBook Pro تطبيق macOS أو مضيف عقدة ويقترن بـ Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    المستندات: [العقد](/ar/nodes)، و[CLI للعقد](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    Bun **غير موصى به**. نرى أخطاء وقت تشغيل، خصوصًا مع WhatsApp وTelegram.
    استخدم **Node** للحصول على بوابات مستقرة.

    إذا كنت لا تزال تريد تجربة Bun، فافعل ذلك على Gateway غير إنتاجي
    من دون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ماذا يوضع في allowFrom؟">
    `channels.telegram.allowFrom` هو **معرف مستخدم Telegram للمرسل البشري** (رقمي). وليس اسم مستخدم البوت.

    يطلب الإعداد معرفات مستخدم رقمية فقط. إذا كانت لديك بالفعل إدخالات `@username` قديمة في الإعدادات، فيمكن لـ `openclaw doctor --fix` محاولة حلها.

    أكثر أمانًا (من دون بوت تابع لجهة خارجية):

    - أرسل رسالة مباشرة إلى البوت، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    Bot API الرسمي:

    - أرسل رسالة مباشرة إلى البوت، ثم استدعِ `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    جهة خارجية (خصوصية أقل):

    - أرسل رسالة مباشرة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع مثيلات OpenClaw مختلفة؟">
    نعم، عبر **توجيه متعدد الوكلاء**. اربط **الرسالة المباشرة** لكل مرسل على WhatsApp (النظير `kind: "direct"`، والمرسل بصيغة E.164 مثل `+15551234567`) بـ `agentId` مختلف، بحيث يحصل كل شخص على مساحة عمل ومخزن جلسات خاصين به. لا تزال الردود تأتي من **حساب WhatsApp نفسه**، والتحكم في وصول الرسائل المباشرة (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) عام لكل حساب WhatsApp. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "دردشة سريعة" ووكيل "Opus للبرمجة"؟'>
    نعم. استخدم التوجيه متعدد الوكلاء: امنح كل وكيل نموذجه الافتراضي الخاص، ثم اربط المسارات الواردة (حساب المزود أو نظراء محددين) بكل وكيل. يوجد مثال للإعداد في [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent). راجع أيضًا [النماذج](/ar/concepts/models) و[الإعدادات](/ar/gateway/configuration).
  </Accordion>

  <Accordion title="هل يعمل Homebrew على Linux؟">
    نعم. يدعم Homebrew نظام Linux (Linuxbrew). إعداد سريع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    إذا شغّلت OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` (أو بادئة brew الخاصة بك) حتى تُحل أدوات `brew` المثبتة في الأصداف غير الخاصة بتسجيل الدخول.
    تضيف البنيات الحديثة أيضًا دلائل bin الشائعة للمستخدم في خدمات systemd على Linux (مثل `~/.local/bin`، و`~/.npm-global/bin`، و`~/.local/share/pnpm`، و`~/.bun/bin`) وتحترم `PNPM_HOME`، و`NPM_CONFIG_PREFIX`، و`BUN_INSTALL`، و`VOLTA_HOME`، و`ASDF_DATA_DIR`، و`NVM_DIR`، و`FNM_DIR` عند تعيينها.

  </Accordion>

  <Accordion title="الفرق بين تثبيت git القابل للتعديل وتثبيت npm">
    - **تثبيت قابل للتعديل (git):** نسخة مصدر كاملة، قابلة للتحرير، والأفضل للمساهمين.
      تشغّل عمليات البناء محليًا ويمكنك تعديل الكود/المستندات.
    - **تثبيت npm:** تثبيت CLI عام، بلا مستودع، والأفضل لمن يريد "تشغيله فقط".
      تأتي التحديثات من وسوم توزيع npm.

    المستندات: [بدء الاستخدام](/ar/start/getting-started)، و[التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="هل يمكنني التبديل بين تثبيت npm وgit لاحقًا؟">
    نعم. استخدم `openclaw update --channel ...` عندما يكون OpenClaw مثبتًا بالفعل.
    هذا **لا يحذف بياناتك** - إنه يغير تثبيت كود OpenClaw فقط.
    تبقى حالتك (`~/.openclaw`) ومساحة عملك (`~/.openclaw/workspace`) كما هما.

    من npm إلى git:

    ```bash
    openclaw update --channel dev
    ```

    من git إلى npm:

    ```bash
    openclaw update --channel stable
    ```

    أضف `--dry-run` لمعاينة تبديل الوضع المخطط له أولًا. يشغّل المُحدّث
    متابعات Doctor، ويحدّث مصادر Plugin للقناة المستهدفة، ويعيد تشغيل
    Gateway ما لم تمرر `--no-restart`.

    يمكن للمثبت فرض أي من الوضعين أيضًا:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نصائح النسخ الاحتياطي: راجع [استراتيجية النسخ الاحتياطي](/ar/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="هل يجب أن أشغّل Gateway على حاسوبي المحمول أم على VPS؟">
    الإجابة المختصرة: **إذا كنت تريد موثوقية 24/7، فاستخدم VPS**. إذا كنت تريد
    أقل قدر من التعقيد ولا تمانع السكون/إعادة التشغيل، فشغّله محليًا.

    **الكمبيوتر المحمول (Gateway المحلي)**

    - **الإيجابيات:** لا توجد تكلفة خادم، وصول مباشر إلى الملفات المحلية، نافذة متصفح مباشرة.
    - **السلبيات:** السكون/انقطاع الشبكة = انقطاعات اتصال، تحديثات نظام التشغيل/إعادة التشغيل تسبب توقفًا، يجب أن يبقى الجهاز مستيقظًا.

    **VPS / السحابة**

    - **الإيجابيات:** يعمل دائمًا، شبكة مستقرة، لا توجد مشكلات سكون الكمبيوتر المحمول، أسهل في إبقائه قيد التشغيل.
    - **السلبيات:** غالبًا يعمل بلا واجهة رسومية (استخدم لقطات الشاشة)، وصول إلى الملفات عن بُعد فقط، يجب استخدام SSH للتحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp/Telegram/Slack/Mattermost/Discord كلها جيدًا من VPS. المفاضلة الحقيقية الوحيدة هي **متصفح بلا واجهة رسومية** مقابل نافذة مرئية. راجع [المتصفح](/ar/tools/browser).

    **الإعداد الافتراضي الموصى به:** VPS إذا واجهت انقطاعات في Gateway من قبل. المحلي ممتاز عندما تستخدم Mac بنشاط وتريد الوصول إلى الملفات المحلية أو أتمتة واجهة المستخدم مع متصفح مرئي.

  </Accordion>

  <Accordion title="ما مدى أهمية تشغيل OpenClaw على جهاز مخصص؟">
    ليس مطلوبًا، لكنه **موصى به للموثوقية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Pi):** يعمل دائمًا، انقطاعات سكون/إعادة تشغيل أقل، أذونات أنظف، أسهل في إبقائه قيد التشغيل.
    - **كمبيوتر محمول/مكتبي مشترك:** مناسب تمامًا للاختبار والاستخدام النشط، لكن توقّع توقفات عندما يدخل الجهاز في وضع السكون أو عند التحديثات.

    إذا أردت الجمع بين الميزتين، أبقِ Gateway على مضيف مخصص واقرن الكمبيوتر المحمول لديك بوصفه **Node** لأدوات الشاشة/الكاميرا/التنفيذ المحلية. راجع [Nodes](/ar/nodes).
    للحصول على إرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما الحد الأدنى لمتطلبات VPS ونظام التشغيل الموصى به؟">
    OpenClaw خفيف. من أجل Gateway أساسي + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** 1 vCPU، 1GB RAM، نحو 500MB قرص.
    - **الموصى به:** 1-2 vCPU، 2GB RAM أو أكثر لهامش أمان (السجلات، الوسائط، قنوات متعددة). قد تكون أدوات Node وأتمتة المتصفح كثيفة الاستهلاك للموارد.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). مسار تثبيت Linux هو الأفضل اختبارًا هناك.

    الوثائق: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw داخل VM وما المتطلبات؟">
    نعم. تعامل مع VM بالطريقة نفسها مثل VPS: يجب أن يكون قيد التشغيل دائمًا، وقابلًا للوصول، ولديه
    RAM كافية لـ Gateway وأي قنوات تفعّلها.

    الإرشادات الأساسية:

    - **الحد الأدنى المطلق:** 1 vCPU، 1GB RAM.
    - **الموصى به:** 2GB RAM أو أكثر إذا شغّلت قنوات متعددة، أو أتمتة المتصفح، أو أدوات الوسائط.
    - **نظام التشغيل:** Ubuntu LTS أو Debian/Ubuntu حديث آخر.

    إذا كنت تستخدم Windows، فإن **WSL2 هو إعداد VM الأسهل** ولديه أفضل توافق مع الأدوات.
    راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    إذا كنت تشغّل macOS داخل VM، فراجع [macOS VM](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية (النماذج، الجلسات، Gateway، الأمان، المزيد)
- [نظرة عامة على التثبيت](/ar/install)
- [بدء الاستخدام](/ar/start/getting-started)
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
