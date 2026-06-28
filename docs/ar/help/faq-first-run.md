---
read_when:
    - تثبيت جديد، أو توقف الإعداد الأولي، أو أخطاء التشغيل الأول
    - اختيار المصادقة واشتراكات المزوّدين
    - لا يمكن الوصول إلى docs.openclaw.ai، ولا يمكن فتح لوحة التحكم، والتثبيت عالق
sidebarTitle: First-run FAQ
summary: 'الأسئلة الشائعة: إعداد البدء السريع والتشغيل الأول — التثبيت، والإعداد الأولي، والمصادقة، والاشتراكات، والإخفاقات الأولية'
title: 'الأسئلة الشائعة: إعداد التشغيل الأول'
x-i18n:
    generated_at: "2026-06-28T20:43:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef4122bc0c3068806591ccdc1bf7f3eb5a81cc7efd2066d07f948fe953284be
    source_path: help/faq-first-run.md
    workflow: 16
---

  أسئلة وأجوبة البدء السريع والتشغيل الأول. للعمليات اليومية والنماذج والمصادقة والجلسات
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## البدء السريع وإعداد التشغيل الأول

  <AccordionGroup>
  <Accordion title="أنا عالق، ما أسرع طريقة للخروج من التعطل">
    استخدم وكيل ذكاء اصطناعي محليًا يمكنه **رؤية جهازك**. هذا أكثر فاعلية بكثير من السؤال
    في Discord، لأن معظم حالات "أنا عالق" تكون **مشكلات إعداد محلية أو بيئية** لا يستطيع
    المساعدون عن بُعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    يمكن لهذه الأدوات قراءة المستودع، وتشغيل الأوامر، وفحص السجلات، والمساعدة في إصلاح إعداداتك على مستوى الجهاز
    (PATH، والخدمات، والأذونات، وملفات المصادقة). امنحها **نسخة المصدر الكاملة** عبر
    التثبيت القابل للتعديل (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يؤدي هذا إلى تثبيت OpenClaw **من نسخة git محلية**، بحيث يستطيع الوكيل قراءة الكود + المستندات
    والتفكير في الإصدار الدقيق الذي تشغّله. يمكنك دائمًا الرجوع إلى الإصدار المستقر لاحقًا
    بإعادة تشغيل المثبّت من دون `--install-method git`.

    نصيحة: اطلب من الوكيل **تخطيط الإصلاح والإشراف عليه** (خطوة بخطوة)، ثم تنفيذ
    الأوامر الضرورية فقط. هذا يبقي التغييرات صغيرة وأسهل في المراجعة.

    إذا اكتشفت خطأً حقيقيًا أو إصلاحًا، فيُرجى فتح قضية على GitHub أو إرسال PR:
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
    - `openclaw models status`: يتحقق من مصادقة المزوّد + توفر النماذج.
    - `openclaw doctor`: يتحقق من مشكلات الإعداد/الحالة الشائعة ويصلحها.

    فحوصات CLI مفيدة أخرى: `openclaw status --all`، `openclaw logs --follow`،
    `openclaw gateway status`، `openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان هناك شيء معطّل](/ar/help/faq#first-60-seconds-if-something-is-broken).
    مستندات التثبيت: [التثبيت](/ar/install)، [أعلام المثبّت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="Heartbeat يواصل التخطي. ماذا تعني أسباب التخطي؟">
    أسباب تخطي Heartbeat الشائعة:

    - `quiet-hours`: خارج نافذة الساعات النشطة المضبوطة
    - `empty-heartbeat-file`: يوجد `HEARTBEAT.md` لكنه يحتوي فقط على فراغات أو تعليقات أو رأس أو سياج أو هيكل قائمة تحقق فارغة
    - `no-tasks-due`: وضع مهام `HEARTBEAT.md` نشط، لكن لم يحن بعد أي من فواصل المهام
    - `alerts-disabled`: كل ظهور Heartbeat معطّل (`showOk` و`showAlerts` و`useIndicator` كلها متوقفة)

    في وضع المهام، لا تُقدَّم الطوابع الزمنية المستحقة إلا بعد اكتمال تشغيل Heartbeat
    حقيقي. عمليات التشغيل المتخطاة لا تضع علامة على المهام كمكتملة.

    المستندات: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة](/ar/automation).

  </Accordion>

  <Accordion title="الطريقة الموصى بها لتثبيت OpenClaw وإعداده">
    يوصي المستودع بالتشغيل من المصدر واستخدام الإعداد الأولي:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    يمكن للمعالج أيضًا بناء أصول واجهة المستخدم تلقائيًا. بعد الإعداد الأولي، ستشغّل عادةً Gateway على المنفذ **18789**.

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

  <Accordion title="كيف أفتح لوحة المعلومات بعد الإعداد الأولي؟">
    يفتح المعالج متصفحك بعنوان URL نظيف للوحة المعلومات (بلا رمز مضمّن) مباشرة بعد الإعداد الأولي، ويطبع الرابط أيضًا في الملخص. أبقِ تلك علامة التبويب مفتوحة؛ إذا لم تُفتح، فانسخ/الصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أصادق لوحة المعلومات على localhost مقابل الاتصال البعيد؟">
    **Localhost (الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلب مصادقة السر المشترك، الصق الرمز أو كلمة المرور المضبوطة في إعدادات Control UI.
    - مصدر الرمز: `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر كلمة المرور: `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يُضبط سر مشترك بعد، فأنشئ رمزًا باستخدام `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** (موصى به): أبقِ الربط على local loopback، شغّل `openclaw gateway --tailscale serve`، وافتح `https://<magicdns>/`. إذا كانت `gateway.auth.allowTailscale` تساوي `true`، فإن ترويسات الهوية تكفي لمصادقة Control UI/WebSocket (لا حاجة إلى لصق سر مشترك، مع افتراض أن مضيف Gateway موثوق)؛ ولا تزال واجهات HTTP APIs تتطلب مصادقة السر المشترك ما لم تستخدم عمدًا `none` للدخول الخاص أو مصادقة HTTP عبر وكيل موثوق.
      محاولات مصادقة Serve المتزامنة والفاشلة من العميل نفسه تُسلسل قبل أن يسجلها محدد فشل المصادقة، لذلك يمكن أن تظهر المحاولة الفاشلة الثانية بالفعل `retry later`.
    - **ربط Tailnet**: شغّل `openclaw gateway --bind tailnet --token "<token>"` (أو اضبط مصادقة كلمة المرور)، وافتح `http://<tailscale-ip>:18789/`، ثم الصق السر المشترك المطابق في إعدادات لوحة المعلومات.
    - **وكيل عكسي واعٍ بالهوية**: أبقِ Gateway خلف وكيل موثوق، واضبط `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل. تتطلب وكلاء local loopback على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`.
    - **نفق SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. لا تزال مصادقة السر المشترك تنطبق عبر النفق؛ الصق الرمز أو كلمة المرور المضبوطة إذا طُلب منك ذلك.

    راجع [لوحة المعلومات](/ar/web/dashboard) و[أسطح الويب](/ar/web) لتفاصيل أوضاع الربط والمصادقة.

  </Accordion>

  <Accordion title="لماذا توجد إعدادات موافقة تنفيذ اثنان لموافقات الدردشة؟">
    إنها تتحكم في طبقات مختلفة:

    - `approvals.exec`: يمرر مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: يجعل تلك القناة تعمل كعميل موافقة أصلي لموافقات التنفيذ

    تظل سياسة تنفيذ المضيف هي بوابة الموافقة الحقيقية. إعدادات الدردشة تتحكم فقط في مكان ظهور
    مطالبات الموافقة وكيف يمكن للأشخاص الإجابة عنها.

    في معظم الإعدادات لا تحتاج إلى كليهما:

    - إذا كانت الدردشة تدعم بالفعل الأوامر والردود، فإن `/approve` في الدردشة نفسها يعمل عبر المسار المشترك.
    - إذا كانت قناة أصلية مدعومة تستطيع استنتاج الموافقين بأمان، فإن OpenClaw يفعّل الآن تلقائيًا الموافقات الأصلية المعتمدة على الرسائل المباشرة أولًا عندما تكون `channels.<channel>.execApprovals.enabled` غير مضبوطة أو `"auto"`.
    - عندما تتوفر بطاقات/أزرار الموافقة الأصلية، تكون واجهة المستخدم الأصلية هي المسار الأساسي؛ ينبغي للوكيل تضمين أمر `/approve` يدوي فقط إذا قالت نتيجة الأداة إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب تمرير المطالبات أيضًا إلى دردشات أخرى أو غرف عمليات صريحة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحةً نشر مطالبات الموافقة مرة أخرى في الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة أيضًا: تستخدم `/approve` في الدردشة نفسها افتراضيًا، مع تمرير اختياري عبر `approvals.plugin`، وتحتفظ بعض القنوات الأصلية فقط بمعالجة موافقة Plugin الأصلية فوق ذلك.

    النسخة المختصرة: التمرير للتوجيه، وإعداد العميل الأصلي لتجربة مستخدم أغنى خاصة بالقناة.
    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما بيئة التشغيل التي أحتاجها؟">
    يلزم Node **>= 22**. يُوصى باستخدام `pnpm`. لا يُوصى باستخدام Bun مع Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. Gateway خفيف - تذكر المستندات أن **512MB-1GB RAM** و**1 core** ونحو **500MB**
    من القرص تكفي للاستخدام الشخصي، وتلاحظ أن **Raspberry Pi 4 يمكنه تشغيله**.

    إذا أردت هامشًا إضافيًا (سجلات، وسائط، خدمات أخرى)، فيُوصى بـ **2GB**، لكنه
    ليس حدًا أدنى صارمًا.

    نصيحة: يمكن لـ Raspberry Pi/VPS صغير استضافة Gateway، ويمكنك إقران **عُقد** على حاسوبك المحمول/هاتفك من أجل
    الشاشة/الكاميرا/اللوحة المحلية أو تنفيذ الأوامر. راجع [العُقد](/ar/nodes).

  </Accordion>

  <Accordion title="هل من نصائح لتثبيتات Raspberry Pi؟">
    النسخة المختصرة: يعمل، لكن توقع بعض الحواف الخشنة.

    - استخدم نظام تشغيل **64-bit** وحافظ على Node >= 22.
    - فضّل **التثبيت القابل للتعديل (git)** حتى تتمكن من رؤية السجلات والتحديث بسرعة.
    - ابدأ من دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات ثنائية غريبة، فعادةً ما تكون مشكلة **توافق ARM**.

    المستندات: [Linux](/ar/platforms/linux)، [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق عند wake up my friend / الإعداد الأولي لا يفقس. ماذا الآن؟">
    تعتمد تلك الشاشة على إمكانية الوصول إلى Gateway ومصادقته. يرسل TUI أيضًا
    "Wake up, my friend!" تلقائيًا عند أول فقس. إذا رأيت هذا السطر مع **عدم وجود رد**
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

  <Accordion title="هل يمكنني ترحيل إعدادي إلى جهاز جديد (Mac mini) من دون إعادة الإعداد الأولي؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغّل Doctor مرة واحدة. هذا
    يبقي الروبوت "كما هو تمامًا" (الذاكرة، وسجل الجلسات، والمصادقة، وحالة القنوات)
    طالما نسخت **الموقعين كليهما**:

    1. ثبّت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة عملك (الافتراضي: `~/.openclaw/workspace`).
    4. شغّل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    يحافظ ذلك على الإعدادات وملفات المصادقة وبيانات اعتماد WhatsApp والجلسات والذاكرة. إذا كنت في
    الوضع البعيد، فتذكر أن مضيف Gateway يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا كنت تلتزم/تدفع مساحة عملك فقط إلى GitHub، فأنت تنسخ احتياطيًا
    **الذاكرة + ملفات التمهيد**، لكن **ليس** سجل الجلسات أو المصادقة. هذه تعيش
    تحت `~/.openclaw/` (مثلًا `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [أين توجد الأشياء على القرص](/ar/help/faq#where-things-live-on-disk)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أرى الجديد في أحدث إصدار؟">
    تحقق من سجل تغييرات GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    أحدث الإدخالات في الأعلى. إذا كان القسم العلوي موسومًا **Unreleased**، فإن القسم التالي المؤرخ
    هو أحدث إصدار منشور. تُجمع الإدخالات حسب **الميزات البارزة** و**التغييرات** و
    **الإصلاحات** (بالإضافة إلى أقسام المستندات/الأقسام الأخرى عند الحاجة).

  </Accordion>

  <Accordion title="لا يمكن الوصول إلى docs.openclaw.ai (خطأ SSL)">
    بعض اتصالات Comcast/Xfinity تحظر `docs.openclaw.ai` خطأً عبر Xfinity
    Advanced Security. عطّلها أو أضف `docs.openclaw.ai` إلى قائمة السماح، ثم أعد المحاولة.
    يرجى مساعدتنا في إلغاء الحظر عنه بالإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    إذا كنت لا تزال غير قادر على الوصول إلى الموقع، فالوثائق معكوسة على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="الفرق بين المستقر وbeta">
    **المستقر** و**beta** هما **وسما توزيع npm**، وليسا خطي كود منفصلين:

    - `latest` = مستقر
    - `beta` = بناء مبكر للاختبار

    عادة، يصل الإصدار المستقر إلى **beta** أولا، ثم تنقل خطوة ترقية صريحة
    نفس الإصدار إلى `latest`. يمكن للمشرفين أيضا
    النشر مباشرة إلى `latest` عند الحاجة. لهذا يمكن أن يشير beta والمستقر
    إلى **نفس الإصدار** بعد الترقية.

    اطلع على ما تغيّر:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    لسطر أوامر التثبيت الواحد والفرق بين beta وdev، راجع الأكورديون أدناه.

  </Accordion>

  <Accordion title="كيف أثبّت إصدار beta وما الفرق بين beta وdev؟">
    **Beta** هو وسم توزيع npm `beta` (قد يطابق `latest` بعد الترقية).
    **Dev** هو الرأس المتحرك لفرع `main` (git)؛ وعند نشره، يستخدم وسم توزيع npm `dev`.

    أسطر أوامر مفردة (macOS/Linux):

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

    يؤدي هذا إلى التبديل إلى فرع `main` والتحديث من المصدر.

    2. **تثبيت قابل للتعديل (من موقع المثبّت):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يمنحك ذلك مستودعا محليا يمكنك تعديله، ثم التحديث عبر git.

    إذا كنت تفضّل استنساخا نظيفا يدويا، فاستخدم:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    الوثائق: [التحديث](/ar/cli/update)، [قنوات التطوير](/ar/install/development-channels)،
    [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="كم يستغرق التثبيت والإعداد الأولي عادة؟">
    دليل تقريبي:

    - **التثبيت:** 2-5 دقائق
    - **إعداد QuickStart الأولي:** عادة بضع دقائق
    - **الإعداد الأولي الكامل:** يستغرق مدة أطول عندما يحتاج تسجيل دخول المزوّد، أو إقران القناة، أو تثبيت الخادم الخفي،
      أو تنزيلات الشبكة، أو Skills، أو Plugins الاختيارية إلى إعداد إضافي

    يعرض معالج CLI هذا الجدول الزمني مقدما. يمكنك تخطي الخطوات الاختيارية والعودة
    لاحقا باستخدام `openclaw configure`.

    إذا توقف، فاستخدم [تعطل المثبّت](#quick-start-and-first-run-setup)
    وحلقة التصحيح السريعة في [أنا عالق](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="المثبّت عالق؟ كيف أحصل على مزيد من الملاحظات؟">
    أعد تشغيل المثبّت مع **إخراج مطوّل**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    تثبيت Beta مع الإخراج المطوّل:

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
    مشكلتان شائعتان في Windows:

    **1) خطأ npm spawn git / git غير موجود**

    - ثبّت **Git for Windows** وتأكد من أن `git` موجود في PATH.
    - أغلق PowerShell وأعد فتحه، ثم أعد تشغيل المثبّت.

    **2) openclaw غير معروف بعد التثبيت**

    - مجلد npm global bin لديك غير موجود في PATH.
    - تحقق من المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف ذلك الدليل إلى PATH الخاص بالمستخدم لديك (لا حاجة إلى اللاحقة `\bin` على Windows؛ في معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وأعد فتحه بعد تحديث PATH.

    لإعداد سطح المكتب، استخدم تطبيق **Windows Hub** الأصلي. وللإعداد عبر الطرفية فقط،
    يدعم كل من مثبّت PowerShell ومسارات WSL2 Gateway.
    الوثائق: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="يعرض إخراج exec في Windows نصا صينيا مشوها - ماذا أفعل؟">
    يحدث هذا عادة بسبب عدم تطابق صفحة ترميز وحدة التحكم في أصداف Windows الأصلية.

    الأعراض:

    - يظهر إخراج `system.run`/`exec` للصينية كنص مشوه
    - يبدو الأمر نفسه سليما في ملف تعريف طرفية آخر

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

    إذا كنت لا تزال تعيد إنتاج هذا على أحدث OpenClaw، فتتبعه/أبلغ عنه في:

    - [المشكلة #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="لم تجب الوثائق عن سؤالي - كيف أحصل على إجابة أفضل؟">
    استخدم **التثبيت القابل للتعديل (git)** بحيث يكون لديك المصدر والوثائق كاملة محليا، ثم اسأل
    البوت لديك (أو Claude/Codex) _من ذلك المجلد_ حتى يتمكن من قراءة المستودع والإجابة بدقة.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مزيد من التفاصيل: [التثبيت](/ar/install) و[أعلام المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على Linux؟">
    الإجابة المختصرة: اتبع دليل Linux، ثم شغّل الإعداد الأولي.

    - المسار السريع في Linux + تثبيت الخدمة: [Linux](/ar/platforms/linux).
    - الشرح الكامل خطوة بخطوة: [بدء الاستخدام](/ar/start/getting-started).
    - المثبّت + التحديثات: [التثبيت والتحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على VPS؟">
    يعمل أي VPS بنظام Linux. ثبّت على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول عن بُعد: [Gateway عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أدلة التثبيت على السحابة/VPS؟">
    نحتفظ **بمركز استضافة** يضم المزوّدين الشائعين. اختر واحدا واتبع الدليل:

    - [استضافة VPS](/ar/vps) (كل المزوّدين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    كيف يعمل ذلك في السحابة: **يعمل Gateway على الخادم**، وتصل إليه
    من حاسوبك المحمول/هاتفك عبر Control UI (أو Tailscale/SSH). تعيش حالتك + مساحة عملك
    على الخادم، لذا تعامل مع المضيف كمصدر الحقيقة وانسخه احتياطيا.

    يمكنك إقران **العقد** (Mac/iOS/Android/بلا واجهة) بذلك Gateway السحابي للوصول
    إلى الشاشة/الكاميرا/canvas المحلية أو تشغيل الأوامر على حاسوبك المحمول مع إبقاء
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول عن بُعد: [Gateway عن بُعد](/ar/gateway/remote).
    العقد: [العقد](/ar/nodes)، [CLI للعقد](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني أن أطلب من OpenClaw تحديث نفسه؟">
    الإجابة المختصرة: **ممكن، لكن غير موصى به**. قد يعيد مسار التحديث تشغيل
    Gateway (ما يقطع الجلسة النشطة)، وقد يحتاج إلى checkout نظيف من git،
    وقد يطلب تأكيدا. الأكثر أمانا: شغّل التحديثات من صدفة بصفتك المشغّل.

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

  <Accordion title="ماذا يفعل الإعداد الأولي فعليا؟">
    `openclaw onboard` هو مسار الإعداد الموصى به. في **الوضع المحلي** يرشدك عبر:

    - **إعداد النموذج/المصادقة** (OAuth للمزوّد، مفاتيح API، setup-token من Anthropic، إضافة إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات التمهيد
    - **إعدادات Gateway** (bind/port/auth/tailscale)
    - **القنوات** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، إضافة إلى Plugins القنوات المضمنة مثل QQ Bot)
    - **تثبيت الخادم الخفي** (LaunchAgent على macOS؛ وحدة مستخدم systemd على Linux/WSL2)
    - **فحوصات الصحة** واختيار **Skills**

    كما يضبط توقعات المدة قبل بدء المطالبات الرئيسية ويحذّر إذا كان
    النموذج المكوّن لديك غير معروف أو يفتقد المصادقة.

  </Accordion>

  <Accordion title="هل أحتاج إلى اشتراك Claude أو OpenAI لتشغيل هذا؟">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** (Anthropic/OpenAI/غيرهما) أو باستخدام
    **نماذج محلية فقط** بحيث تبقى بياناتك على جهازك. الاشتراكات (Claude
    Pro/Max أو OpenAI Codex) هي طرق اختيارية لمصادقة أولئك المزوّدين.

    بالنسبة إلى Anthropic في OpenClaw، التقسيم العملي هو:

    - **مفتاح Anthropic API**: فوترة Anthropic API العادية
    - **Claude CLI / مصادقة اشتراك Claude في OpenClaw**: أخبرنا موظفو Anthropic
      أن هذا الاستخدام مسموح به مجددا، ويتعامل OpenClaw مع استخدام `claude -p`
      باعتباره معتمدا لهذا التكامل ما لم تنشر Anthropic سياسة جديدة

    بالنسبة إلى مضيفات Gateway طويلة العمر، تظل مفاتيح Anthropic API هي الإعداد
    الأكثر قابلية للتنبؤ. OAuth الخاص بـ OpenAI Codex مدعوم صراحة للأدوات الخارجية
    مثل OpenClaw.

    يدعم OpenClaw أيضا خيارات أخرى مستضافة بنمط الاشتراك، بما في ذلك
    **Qwen Cloud Coding Plan** و**MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan**.

    الوثائق: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [Z.AI (GLM)](/ar/providers/zai)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام اشتراك Claude Max بدون مفتاح API؟">
    نعم.

    أخبرنا موظفو Anthropic أن استخدام Claude CLI بنمط OpenClaw مسموح به مجددا، لذلك
    يتعامل OpenClaw مع مصادقة اشتراك Claude واستخدام `claude -p` باعتبارهما معتمدين
    لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. إذا كنت تريد
    إعدادا جانب خادم أكثر قابلية للتنبؤ، فاستخدم مفتاح Anthropic API بدلا من ذلك.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك Claude (Claude Pro أو Max)؟">
    نعم.

    أخبرنا موظفو Anthropic أن هذا الاستخدام مسموح به مجددا، لذلك يتعامل OpenClaw مع
    إعادة استخدام Claude CLI واستخدام `claude -p` باعتبارهما معتمدين لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    لا يزال setup-token من Anthropic متاحا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عندما يكونان متاحين.
    لأحمال العمل الإنتاجية أو متعددة المستخدمين، تظل مصادقة مفتاح Anthropic API هي
    الخيار الأكثر أمانا وقابلية للتنبؤ. إذا كنت تريد خيارات مستضافة أخرى
    بنمط الاشتراك في OpenClaw، فراجع [OpenAI](/ar/providers/openai)، [Qwen / Model
    Cloud](/ar/providers/qwen)، [MiniMax](/ar/providers/minimax)، و[نماذج GLM](/ar/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="لماذا أرى HTTP 429 rate_limit_error من Anthropic؟">
    هذا يعني أن **حصة/حد معدل Anthropic** لديك استُنفدت للنافذة الحالية. إذا كنت
    تستخدم **Claude CLI**، فانتظر حتى تتم إعادة ضبط النافذة أو قم بترقية خطتك. إذا كنت
    تستخدم **مفتاح Anthropic API**، فتحقق من Anthropic Console
    لمعرفة الاستخدام/الفوترة وارفع الحدود حسب الحاجة.

    إذا كانت الرسالة تحديدًا:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    نافذة سياق Anthropic بحجم 1M (نموذج Claude 4.x بقدرة 1M ومتاح عمومًا أو إعداد قديم
    `context1m: true`). يعمل ذلك فقط عندما تكون بيانات اعتمادك مؤهلة
    لفوترة السياق الطويل (فوترة مفتاح API أو مسار تسجيل دخول OpenClaw إلى Claude
    مع تفعيل Extra Usage).

    نصيحة: عيّن **نموذجًا احتياطيًا** حتى يتمكن OpenClaw من مواصلة الرد عندما يكون المزوّد محدود المعدل.
    راجع [النماذج](/ar/cli/models)، و[OAuth](/ar/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. لدى OpenClaw مزوّد **Amazon Bedrock (Converse)** مضمّن. عند وجود علامات بيئة AWS، يستطيع OpenClaw اكتشاف كتالوج Bedrock للبث/النص تلقائيًا ودمجه كمزوّد ضمني `amazon-bedrock`؛ وإلا يمكنك تفعيل `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحةً أو إضافة إدخال مزوّد يدوي. راجع [Amazon Bedrock](/ar/providers/bedrock) و[مزوّدي النماذج](/ar/providers/models). إذا كنت تفضّل تدفق مفاتيح مُدارًا، فسيظل الوكيل المتوافق مع OpenAI أمام Bedrock خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth (تسجيل الدخول إلى ChatGPT). استخدم
    `openai/gpt-5.5` للإعداد الشائع: مصادقة اشتراك ChatGPT/Codex بالإضافة إلى
    تنفيذ خادم تطبيق Codex الأصلي. مراجع Codex GPT القديمة هي
    إعداد قديم يصلحه `openclaw doctor --fix`. يظل الوصول المباشر عبر مفتاح OpenAI API
    متاحًا لأسطح OpenAI API غير الوكيلة ولنماذج الوكيل
    من خلال ملف تعريف مفتاح API مرتب باسم `openai`.
    راجع [مزوّدي النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا لا يزال OpenClaw يذكر بادئة OpenAI Codex القديمة؟">
    `openai` هو معرّف المزوّد وملف تعريف المصادقة لكل من مفاتيح OpenAI API و
    ChatGPT/Codex OAuth. قد لا تزال ترى بادئة OpenAI Codex القديمة في الإعداد القديم و
    تحذيرات الترحيل.
    استخدمتها الإعدادات الأقدم أيضًا كبادئة نموذج:

    - `openai/gpt-5.5` = مصادقة اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي لدورات الوكيل
    - مرجع Codex GPT-5.5 قديم = مسار نموذج قديم يصلحه `openclaw doctor --fix`
    - `openai/gpt-5.5` بالإضافة إلى ملف تعريف مفتاح API مرتب باسم `openai` = مصادقة مفتاح API لنموذج وكيل OpenAI
    - معرّفات ملفات تعريف مصادقة Codex القديمة = معرّف ملف تعريف مصادقة قديم يرحّله `openclaw doctor --fix`

    إذا كنت تريد مسار الفوترة/الحدود المباشر لمنصة OpenAI Platform، فعيّن
    `OPENAI_API_KEY`. إذا كنت تريد مصادقة اشتراك ChatGPT/Codex، فسجّل الدخول باستخدام
    `openclaw models auth login --provider openai`. أبقِ مرجع النموذج كـ
    `openai/gpt-5.5`؛ فمراجع نماذج Codex القديمة هي إعدادات قديمة
    يعيد `openclaw doctor --fix` كتابتها.

  </Accordion>

  <Accordion title="لماذا يمكن أن تختلف حدود Codex OAuth عن ChatGPT على الويب؟">
    يستخدم Codex OAuth نوافذ حصة مُدارة من OpenAI وتعتمد على الخطة. عمليًا،
    يمكن أن تختلف هذه الحدود عن تجربة موقع/تطبيق ChatGPT، حتى عندما
    يكون كلاهما مرتبطًا بالحساب نفسه.

    يستطيع OpenClaw عرض نوافذ استخدام/حصة المزوّد المرئية حاليًا في
    `openclaw models status`، لكنه لا يخترع أو يطبّع استحقاقات ChatGPT على الويب
    إلى وصول API مباشر. إذا كنت تريد مسار الفوترة/الحدود المباشر لمنصة OpenAI Platform،
    فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك OpenAI (Codex OAuth)؟">
    نعم. يدعم OpenClaw بالكامل **OpenAI Code (Codex) subscription OAuth**.
    تسمح OpenAI صراحةً باستخدام اشتراك OAuth في الأدوات/سير العمل الخارجية
    مثل OpenClaw. يمكن للإعداد الأولي تشغيل تدفق OAuth نيابةً عنك.

    راجع [OAuth](/ar/concepts/oauth)، و[مزوّدي النماذج](/ar/concepts/model-providers)، و[الإعداد الأولي (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أعدّ Gemini CLI OAuth؟">
    يستخدم Gemini CLI **تدفق مصادقة Plugin**، وليس معرّف عميل أو سرًا في `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا حتى يكون `gemini` موجودًا في `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. فعّل Plugin: `openclaw plugins enable google`
    3. سجّل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: `google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway

    يخزّن هذا رموز OAuth في ملفات تعريف المصادقة على مضيف Gateway. التفاصيل: [مزوّدو النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للمحادثات العادية؟">
    عادةً لا. يحتاج OpenClaw إلى سياق كبير + أمان قوي؛ البطاقات الصغيرة تقتطع وتسرّب. إذا كان لا بد من ذلك، فشغّل **أكبر** بناء نموذج يمكنك تشغيله محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). تزيد النماذج الأصغر/المكمّمة مخاطر حقن المطالبات - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أبقي حركة نماذج الاستضافة في منطقة محددة؟">
    اختر نقاط نهاية مثبّتة بالمنطقة. يوفّر OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر النسخة المستضافة في الولايات المتحدة لإبقاء البيانات داخل المنطقة. لا يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه باستخدام `models.mode: "merge"` حتى تبقى النماذج الاحتياطية متاحة مع احترام المزوّد الإقليمي الذي تختاره.
  </Accordion>

  <Accordion title="هل يجب أن أشتري Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux (Windows عبر WSL2). جهاز Mac mini اختياري - يشتريه بعض الأشخاص
    كمضيف دائم التشغيل، لكن VPS صغيرًا أو خادمًا منزليًا أو صندوقًا بمستوى Raspberry Pi يعمل أيضًا.

    تحتاج إلى Mac فقط **للأدوات الحصرية لـ macOS**. بالنسبة إلى iMessage، استخدم [iMessage](/ar/channels/imessage) مع `imsg` على أي Mac مسجّل الدخول إلى Messages. إذا كان Gateway يعمل على Linux أو في مكان آخر، فعيّن `channels.imessage.cliPath` إلى مغلّف SSH يشغّل `imsg` على ذلك الـ Mac. إذا كنت تريد أدوات أخرى حصرية لـ macOS، فشغّل Gateway على Mac أو أقرن عقدة macOS.

    الوثائق: [iMessage](/ar/channels/imessage)، [العُقد](/ar/nodes)، [وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **جهاز macOS ما** مسجّل الدخول إلى Messages. لا يجب أن يكون Mac mini -
    أي Mac يفي بالغرض. **استخدم [iMessage](/ar/channels/imessage)** مع `imsg`؛ يمكن أن يعمل Gateway على ذلك الـ Mac، أو يمكن أن يعمل في مكان آخر مع مغلّف SSH في `cliPath`.

    الإعدادات الشائعة:

    - شغّل Gateway على Linux/VPS، وعيّن `channels.imessage.cliPath` إلى مغلّف SSH يشغّل `imsg` على Mac مسجّل الدخول إلى Messages.
    - شغّل كل شيء على Mac إذا كنت تريد أبسط إعداد على جهاز واحد.

    الوثائق: [iMessage](/ar/channels/imessage)، [العُقد](/ar/nodes)،
    [وضع Mac البعيد](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، هل يمكنني توصيله بجهاز MacBook Pro الخاص بي؟">
    نعم. يمكن أن يقوم **Mac mini بتشغيل Gateway**، ويمكن لجهاز MacBook Pro الاتصال كـ
    **عقدة** (جهاز مرافق). لا تشغّل العُقد Gateway - بل توفّر قدرات إضافية
    مثل الشاشة/الكاميرا/اللوحة و`system.run` على ذلك الجهاز.

    النمط الشائع:

    - Gateway على Mac mini (دائم التشغيل).
    - يشغّل MacBook Pro تطبيق macOS أو مضيف عقدة ويقترن بـ Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    الوثائق: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    Bun **غير موصى به**. نرى أخطاء في وقت التشغيل، خاصةً مع WhatsApp وTelegram.
    استخدم **Node** للبوابات المستقرة.

    إذا كنت لا تزال تريد تجربة Bun، فافعل ذلك على Gateway غير إنتاجي
    من دون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ماذا يوضع في allowFrom؟">
    `channels.telegram.allowFrom` هو **معرّف مستخدم Telegram للمرسل البشري** (رقمي). وليس اسم مستخدم البوت.

    يطلب الإعداد معرّفات مستخدم رقمية فقط. إذا كانت لديك بالفعل إدخالات `@username` قديمة في الإعداد، فيمكن لـ `openclaw doctor --fix` محاولة حلها.

    أكثر أمانًا (بدون بوت تابع لجهة خارجية):

    - أرسل رسالة مباشرة إلى البوت، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    واجهة Bot API الرسمية:

    - أرسل رسالة مباشرة إلى البوت، ثم استدعِ `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    جهة خارجية (أقل خصوصية):

    - أرسل رسالة مباشرة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع مثيلات OpenClaw مختلفة؟">
    نعم، عبر **توجيه متعدد الوكلاء**. اربط **الرسالة المباشرة** لكل مرسل في WhatsApp (النظير `kind: "direct"`، والمرسل بصيغة E.164 مثل `+15551234567`) بـ `agentId` مختلف، ليحصل كل شخص على مساحة عمل ومخزن جلسات خاصين به. لا تزال الردود تأتي من **حساب WhatsApp نفسه**، كما أن التحكم في وصول الرسائل المباشرة (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) عام لكل حساب WhatsApp. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "محادثة سريعة" ووكيل "Opus للبرمجة"؟'>
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

    إذا شغّلت OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` (أو بادئة brew لديك) حتى تُحلّ الأدوات المثبّتة عبر `brew` في الصدف غير الخاصة بتسجيل الدخول.
    تضيف الإصدارات الحديثة أيضًا أدلة bin الشائعة للمستخدم في خدمات Linux systemd (على سبيل المثال `~/.local/bin`، و`~/.npm-global/bin`، و`~/.local/share/pnpm`، و`~/.bun/bin`) وتحترم `PNPM_HOME` و`NPM_CONFIG_PREFIX` و`BUN_INSTALL` و`VOLTA_HOME` و`ASDF_DATA_DIR` و`NVM_DIR` و`FNM_DIR` عند تعيينها.

  </Accordion>

  <Accordion title="الفرق بين تثبيت git القابل للتعديل وتثبيت npm">
    - **تثبيت قابل للتعديل (git):** نسخة مصدر كاملة، قابلة للتحرير، والأفضل للمساهمين.
      تشغّل عمليات البناء محليًا ويمكنك تصحيح الكود/الوثائق.
    - **تثبيت npm:** تثبيت CLI عام، بلا مستودع، والأفضل لمن يريد "تشغيله فقط".
      تأتي التحديثات من وسوم توزيع npm.

    الوثائق: [البدء](/ar/start/getting-started)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="هل يمكنني التبديل بين تثبيتات npm وgit لاحقًا؟">
    نعم. استخدم `openclaw update --channel ...` عندما يكون OpenClaw مثبتًا بالفعل.
    هذا **لا يحذف بياناتك** - بل يغيّر فقط تثبيت كود OpenClaw.
    تبقى حالتك (`~/.openclaw`) ومساحة عملك (`~/.openclaw/workspace`) كما هي.

    من npm إلى git:

    ```bash
    openclaw update --channel dev
    ```

    من git إلى npm:

    ```bash
    openclaw update --channel stable
    ```

    أضف `--dry-run` لمعاينة تبديل الوضع المخطط له أولاً. يشغّل المحدّث
    متابعات Doctor، ويحدّث مصادر Plugins للقناة المستهدفة، ويعيد
    تشغيل Gateway ما لم تمرّر `--no-restart`.

    يمكن للمثبّت فرض أي من الوضعين أيضاً:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نصائح النسخ الاحتياطي: راجع [استراتيجية النسخ الاحتياطي](/ar/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="هل يجب أن أشغّل Gateway على حاسوبي المحمول أم على VPS؟">
    الإجابة المختصرة: **إذا كنت تريد موثوقية على مدار الساعة، فاستخدم VPS**. إذا كنت تريد
    أقل قدر من التعقيد ولا تمانع السكون/إعادة التشغيل، فشغّله محلياً.

    **الحاسوب المحمول (Gateway محلي)**

    - **الإيجابيات:** لا توجد تكلفة خادم، وصول مباشر إلى الملفات المحلية، نافذة متصفح مباشرة.
    - **السلبيات:** السكون/انقطاع الشبكة = انقطاع الاتصال، تحديثات نظام التشغيل/إعادة التشغيل تقاطع العمل، يجب أن يبقى مستيقظاً.

    **VPS / السحابة**

    - **الإيجابيات:** يعمل دائماً، شبكة مستقرة، لا مشكلات سكون للحاسوب المحمول، أسهل في إبقائه قيد التشغيل.
    - **السلبيات:** غالباً يعمل بلا واجهة عرض (استخدم لقطات الشاشة)، الوصول إلى الملفات عن بُعد فقط، يجب استخدام SSH للتحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp/Telegram/Slack/Mattermost/Discord كلها بشكل جيد من VPS. المفاضلة الحقيقية الوحيدة هي **متصفح بلا واجهة عرض** مقابل نافذة مرئية. راجع [المتصفح](/ar/tools/browser).

    **الإعداد الافتراضي الموصى به:** استخدم VPS إذا واجهت انقطاعات في Gateway من قبل. التشغيل المحلي رائع عندما تستخدم Mac بنشاط وتريد الوصول إلى الملفات المحلية أو أتمتة واجهة المستخدم مع متصفح مرئي.

  </Accordion>

  <Accordion title="ما مدى أهمية تشغيل OpenClaw على جهاز مخصص؟">
    ليس مطلوباً، لكنه **موصى به للموثوقية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Raspberry Pi):** يعمل دائماً، انقطاعات أقل بسبب السكون/إعادة التشغيل، أذونات أنظف، أسهل في إبقائه قيد التشغيل.
    - **حاسوب محمول/مكتبي مشترك:** مناسب تماماً للاختبار والاستخدام النشط، لكن توقّع توقفات مؤقتة عندما يدخل الجهاز في السكون أو يجري تحديثات.

    إذا كنت تريد أفضل ما في الخيارين، فأبقِ Gateway على مضيف مخصص واقرن حاسوبك المحمول بوصفه **عقدة** لأدوات الشاشة/الكاميرا/التنفيذ المحلية. راجع [العُقد](/ar/nodes).
    لإرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما متطلبات VPS الدنيا ونظام التشغيل الموصى به؟">
    OpenClaw خفيف. لإعداد Gateway أساسي + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** 1 vCPU، وذاكرة RAM بسعة 1GB، ومساحة قرص تقارب 500MB.
    - **الموصى به:** 1-2 vCPU، وذاكرة RAM بسعة 2GB أو أكثر لهامش إضافي (السجلات، الوسائط، القنوات المتعددة). قد تستهلك أدوات Node وأتمتة المتصفح موارد كثيرة.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). مسار التثبيت على Linux هو الأكثر اختباراً هناك.

    الوثائق: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw داخل VM وما المتطلبات؟">
    نعم. تعامل مع VM كما تتعامل مع VPS: يجب أن تكون قيد التشغيل دائماً، وقابلة للوصول، ولديها ما يكفي من
    ذاكرة RAM لـ Gateway وأي قنوات تفعّلها.

    إرشادات الأساس:

    - **الحد الأدنى المطلق:** 1 vCPU، وذاكرة RAM بسعة 1GB.
    - **الموصى به:** ذاكرة RAM بسعة 2GB أو أكثر إذا كنت تشغّل قنوات متعددة، أو أتمتة المتصفح، أو أدوات الوسائط.
    - **نظام التشغيل:** Ubuntu LTS أو Debian/Ubuntu حديث آخر.

    إذا كنت تستخدم Windows، فاستخدم **Windows Hub** لإعداد سطح المكتب، أو WSL2 عندما
    تريد تحديداً VM بنمط Linux لـ Gateway مع توافق واسع
    مع الأدوات. راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    إذا كنت تشغّل macOS داخل VM، فراجع [macOS VM](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية (النماذج، الجلسات، Gateway، الأمان، والمزيد)
- [نظرة عامة على التثبيت](/ar/install)
- [بدء الاستخدام](/ar/start/getting-started)
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
