---
read_when:
    - تثبيت جديد، أو تعطل الإعداد الأولي، أو أخطاء التشغيل الأول
    - اختيار المصادقة واشتراكات موفري الخدمة
    - تعذر الوصول إلى docs.openclaw.ai، أو تعذر فتح لوحة التحكم، أو تعطل التثبيت
sidebarTitle: First-run FAQ
summary: 'الأسئلة الشائعة: البدء السريع وإعداد التشغيل الأول — التثبيت، الإعداد الأولي، المصادقة، الاشتراكات، وإخفاقات التشغيل الأولى'
title: 'الأسئلة الشائعة: إعداد التشغيل الأول'
x-i18n:
    generated_at: "2026-04-25T18:19:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a3f410b9618df614263c26e5e5c9c45c775b8d05e887e06e02be49f11b7cec
    source_path: help/faq-first-run.md
    workflow: 15
---

  أسئلة وأجوبة البدء السريع والتشغيل الأول. للاطلاع على العمليات اليومية والنماذج والمصادقة والجلسات
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## البدء السريع وإعداد التشغيل الأول

  <AccordionGroup>
  <Accordion title="أنا عالق، ما أسرع طريقة للخروج من هذه المشكلة؟">
    استخدم وكيل AI محليًا يمكنه **رؤية جهازك**. هذا أكثر فاعلية بكثير من السؤال
    في Discord، لأن معظم حالات "أنا عالق" تكون **مشكلات في الإعدادات أو البيئة المحلية**
    لا يمكن للمساعدين عن بُعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    يمكن لهذه الأدوات قراءة المستودع وتشغيل الأوامر وفحص السجلات والمساعدة في إصلاح
    الإعداد على مستوى الجهاز لديك (PATH، والخدمات، والأذونات، وملفات المصادقة). امنحها
    **نسخة المصدر الكاملة** عبر تثبيت hackable ‏(git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يثبّت هذا OpenClaw **من نسخة git محلية**، بحيث يمكن للوكيل قراءة الكود + الوثائق
    والاستدلال على الإصدار الدقيق الذي تستخدمه. ويمكنك دائمًا العودة لاحقًا إلى الإصدار المستقر
    عبر إعادة تشغيل برنامج التثبيت بدون `--install-method git`.

    نصيحة: اطلب من الوكيل **وضع خطة والإشراف** على الإصلاح (خطوة بخطوة)، ثم تنفيذ
    الأوامر الضرورية فقط. هذا يُبقي التغييرات صغيرة وأسهل في التدقيق.

    إذا اكتشفت خطأً فعليًا أو أصلحته، فيرجى فتح issue على GitHub أو إرسال PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    ابدأ بهذه الأوامر (وشارك المخرجات عند طلب المساعدة):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    ما الذي تفعله:

    - `openclaw status`: لقطة سريعة عن حالة Gateway/الوكيل + الإعداد الأساسي.
    - `openclaw models status`: يتحقق من مصادقة الموفّر + توفر النموذج.
    - `openclaw doctor`: يتحقق من مشكلات الإعداد/الحالة الشائعة ويصلحها.

    فحوصات CLI مفيدة أخرى: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان هناك شيء معطل](#first-60-seconds-if-something-is-broken).
    وثائق التثبيت: [التثبيت](/ar/install)، [علامات برنامج التثبيت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="يستمر Heartbeat في التخطي. ماذا تعني أسباب التخطي؟">
    الأسباب الشائعة لتخطي Heartbeat:

    - `quiet-hours`: خارج نافذة الساعات النشطة المضبوطة
    - `empty-heartbeat-file`: الملف `HEARTBEAT.md` موجود لكنه يحتوي فقط على هيكل فارغ/رؤوس فقط
    - `no-tasks-due`: وضع المهام في `HEARTBEAT.md` نشط لكن لم يحن موعد أي من فواصل المهام بعد
    - `alerts-disabled`: تم تعطيل كل ظهور Heartbeat ‏(`showOk` و`showAlerts` و`useIndicator` كلها معطلة)

    في وضع المهام، لا يتم تقديم الطوابع الزمنية المستحقة إلا بعد اكتمال تشغيل Heartbeat فعلي
    حقيقي. ولا تؤدي مرات التشغيل المتخطاة إلى تعليم المهام على أنها مكتملة.

    الوثائق: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة والمهام](/ar/automation).

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

  <Accordion title="كيف أفتح لوحة التحكم بعد الإعداد الأولي؟">
    يفتح المعالج متصفحك بعنوان URL نظيف للوحة التحكم (من دون token) مباشرةً بعد الإعداد الأولي، كما يطبع الرابط أيضًا في الملخص. أبقِ علامة التبويب تلك مفتوحة؛ وإذا لم تُفتح، فانسخ/ألصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أصادق لوحة التحكم على localhost مقابل بيئة بعيدة؟">
    **Localhost (الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلبت مصادقة shared-secret، فألصق token أو كلمة المرور المضبوطة في إعدادات Control UI.
    - مصدر token: ‏`gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر كلمة المرور: ‏`gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يتم تكوين shared secret بعد، فأنشئ token باستخدام `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** (موصى به): أبقِ الربط على loopback، وشغّل `openclaw gateway --tailscale serve`، وافتح `https://<magicdns>/`. إذا كانت قيمة `gateway.auth.allowTailscale` هي `true`، فستفي رؤوس الهوية بمتطلبات مصادقة Control UI/WebSocket (من دون لصق shared secret، على افتراض مضيف Gateway موثوق)؛ أما HTTP APIs فلا تزال تتطلب مصادقة shared-secret ما لم تستخدم عمدًا `none` للـ private-ingress أو مصادقة HTTP الخاصة بـ trusted-proxy.
      تتم موازاة محاولات مصادقة Serve السيئة المتزامنة من العميل نفسه قبل أن يسجل محدِّد محاولات المصادقة الفاشلة ذلك، لذلك قد تظهر بالفعل الرسالة `retry later` عند إعادة المحاولة السيئة الثانية.
    - **ربط Tailnet**: شغّل `openclaw gateway --bind tailnet --token "<token>"` (أو كوّن مصادقة كلمة المرور)، وافتح `http://<tailscale-ip>:18789/`، ثم ألصق shared secret المطابق في إعدادات لوحة التحكم.
    - **وكيل عكسي مع وعي بالهوية**: أبقِ Gateway خلف trusted proxy غير مربوط بـ loopback، واضبط `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل.
    - **نفق SSH**: ‏`ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. لا تزال مصادقة shared-secret مطبقة عبر النفق؛ ألصق token أو كلمة المرور المضبوطة إذا طُلب منك ذلك.

    راجع [لوحة التحكم](/ar/web/dashboard) و[أسطح الويب](/ar/web) للاطلاع على أوضاع الربط وتفاصيل المصادقة.

  </Accordion>

  <Accordion title="لماذا يوجد إعدادان مختلفان للموافقة على exec لموافقات الدردشة؟">
    يتحكمان في طبقتين مختلفتين:

    - `approvals.exec`: يمرر مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: يجعل تلك القناة تعمل كعميل موافقة أصلي لموافقات exec

    تظل سياسة exec على المضيف هي بوابة الموافقة الفعلية. أما إعداد الدردشة فيتحكم فقط في مكان ظهور
    مطالبات الموافقة وكيف يمكن للأشخاص الرد عليها.

    في معظم الإعدادات **لا** تحتاج إلى كليهما:

    - إذا كانت الدردشة تدعم بالفعل الأوامر والردود، فسيعمل `/approve` داخل الدردشة نفسها عبر المسار المشترك.
    - إذا كانت قناة أصلية مدعومة تستطيع استنتاج الموافقين بأمان، فإن OpenClaw يفعّل الآن تلقائيًا الموافقات الأصلية DM-first عندما تكون `channels.<channel>.execApprovals.enabled` غير مضبوطة أو قيمتها `"auto"`.
    - عندما تكون بطاقات/أزرار الموافقة الأصلية متاحة، تكون واجهة المستخدم الأصلية تلك هي المسار الأساسي؛ ويجب ألا يتضمن الوكيل أمر `/approve` يدويًا إلا إذا كانت نتيجة الأداة تشير إلى أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب أيضًا تمرير المطالبات إلى دردشات أخرى أو غرف عمليات مخصصة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحةً نشر مطالبات الموافقة مرة أخرى في الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة مرة أخرى: فهي تستخدم `/approve` داخل الدردشة نفسها افتراضيًا، مع تمرير اختياري عبر `approvals.plugin`، ولا تحتفظ إلا بعض القنوات الأصلية بمعالجة موافقة Plugin الأصلية فوق ذلك.

    باختصار: التمرير مخصص للتوجيه، وإعداد العميل الأصلي مخصص لتجربة استخدام أغنى خاصة بالقناة.
    راجع [Exec Approvals](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما بيئة التشغيل التي أحتاجها؟">
    يتطلب Node **>= 22**. ويوصى باستخدام `pnpm`. أما Bun فهو **غير موصى به** لـ Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. Gateway خفيف - تذكر الوثائق أن **512MB-1GB RAM** و**نواة واحدة** وحوالي **500MB**
    من المساحة التخزينية تكفي للاستخدام الشخصي، وتشير إلى أن **Raspberry Pi 4 يمكنه تشغيله**.

    وإذا كنت تريد سعة إضافية (للسجلات وmedia وخدمات أخرى)، فـ **2GB موصى بها**، لكنها
    ليست حدًا أدنى صارمًا.

    نصيحة: يمكن لجهاز Pi/VPS صغير استضافة Gateway، ويمكنك إقران **Nodes** على الحاسوب المحمول/الهاتف لديك من أجل
    الشاشة/الكاميرا/Canvas المحلية أو تنفيذ الأوامر. راجع [Nodes](/ar/nodes).

  </Accordion>

  <Accordion title="هل هناك أي نصائح لتثبيتات Raspberry Pi؟">
    باختصار: إنه يعمل، لكن توقّع بعض الحواف الخشنة.

    - استخدم نظام تشغيل **64-bit** وحافظ على Node >= 22.
    - فضّل تثبيت **hackable (git)** حتى تتمكن من رؤية السجلات والتحديث بسرعة.
    - ابدأ من دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات غريبة في الملفات الثنائية، فعادةً ما تكون مشكلة **توافق ARM**.

    الوثائق: [Linux](/ar/platforms/linux)، [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق على wake up my friend / الإعداد الأولي لا يكتمل. ماذا الآن؟">
    تعتمد هذه الشاشة على أن يكون Gateway قابلاً للوصول ومصادقًا عليه. كما يرسل TUI
    أيضًا "Wake up, my friend!" تلقائيًا عند أول hatch. إذا رأيت هذا السطر من دون **أي رد**
    وبقيت tokens عند 0، فهذا يعني أن الوكيل لم يعمل.

    1. أعد تشغيل Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. تحقّق من الحالة + المصادقة:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. إذا ظل معلقًا، فشغّل:

    ```bash
    openclaw doctor
    ```

    إذا كان Gateway بعيدًا، فتأكد من أن اتصال النفق/Tailscale يعمل وأن واجهة المستخدم
    موجّهة إلى Gateway الصحيح. راجع [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="هل يمكنني ترحيل إعدادي إلى جهاز جديد (Mac mini) من دون إعادة الإعداد الأولي؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغّل Doctor مرة واحدة. هذا
    يحافظ على الروبوت "مطابقًا تمامًا" (الذاكرة وسجل الجلسات والمصادقة وحالة
    القناة) طالما أنك تنسخ **كلا** الموقعين:

    1. ثبّت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة العمل الخاصة بك (الافتراضي: `~/.openclaw/workspace`).
    4. شغّل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    يحافظ ذلك على الإعداد وملفات تعريف المصادقة وبيانات اعتماد WhatsApp والجلسات والذاكرة. وإذا كنت في
    الوضع البعيد، فتذكّر أن مضيف Gateway هو من يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا كنت تقوم فقط بعمل commit/push لمساحة العمل إلى GitHub، فأنت تنشئ نسخة
    احتياطية من **الذاكرة + ملفات bootstrap**، لكن **ليس** من سجل الجلسات أو المصادقة. فهذه تعيش
    تحت `~/.openclaw/` (على سبيل المثال `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [أماكن وجود الأشياء على القرص](#where-things-live-on-disk)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أرى الجديد في أحدث إصدار؟">
    راجع سجل التغييرات على GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    أحدث الإدخالات تكون في الأعلى. وإذا كان القسم العلوي معلّمًا على أنه **Unreleased**، فإن القسم التالي المؤرخ
    هو أحدث إصدار تم شحنه. وتُجمع الإدخالات تحت **Highlights** و**Changes** و
    **Fixes** (بالإضافة إلى أقسام الوثائق/أخرى عند الحاجة).

  </Accordion>

  <Accordion title="يتعذر الوصول إلى docs.openclaw.ai (خطأ SSL)">
    تحظر بعض اتصالات Comcast/Xfinity بشكل غير صحيح `docs.openclaw.ai` عبر خدمة Xfinity
    Advanced Security. قم بتعطيلها أو أضف `docs.openclaw.ai` إلى قائمة السماح، ثم أعد المحاولة.
    يرجى مساعدتنا على رفع الحظر عبر الإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    إذا كنت لا تزال غير قادر على الوصول إلى الموقع، فهناك نسخة معكوسة من الوثائق على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="الفرق بين stable وbeta">
    إن **Stable** و**beta** هما **npm dist-tags** وليسا خطّي كود منفصلين:

    - `latest` = stable
    - `beta` = إصدار مبكر للاختبار

    عادةً ما يصل الإصدار المستقر إلى **beta** أولًا، ثم تنقل خطوة ترقية
    صريحة ذلك الإصدار نفسه إلى `latest`. ويمكن للمشرفين أيضًا
    النشر مباشرةً إلى `latest` عند الحاجة. ولهذا السبب قد يشير beta وstable
    إلى **الإصدار نفسه** بعد الترقية.

    اطّلع على ما تغيّر:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    للاطلاع على أوامر التثبيت المختصرة والفرق بين beta وdev، راجع الأكورديون أدناه.

  </Accordion>

  <Accordion title="كيف أثبّت إصدار beta وما الفرق بين beta وdev؟">
    إن **Beta** هو npm dist-tag ‏`beta` (وقد يطابق `latest` بعد الترقية).
    أما **Dev** فهو الرأس المتحرك لفرع `main` ‏(git)؛ وعند نشره يستخدم npm dist-tag ‏`dev`.

    أوامر مختصرة (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مُثبّت Windows ‏(PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    مزيد من التفاصيل: [قنوات التطوير](/ar/install/development-channels) و[علامات برنامج التثبيت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أجرّب أحدث الأجزاء؟">
    يوجد خياران:

    1. **قناة Dev ‏(نسخة git محلية):**

    ```bash
    openclaw update --channel dev
    ```

    يؤدي هذا إلى التبديل إلى الفرع `main` والتحديث من المصدر.

    2. **تثبيت Hackable ‏(من موقع برنامج التثبيت):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يمنحك ذلك مستودعًا محليًا يمكنك تعديله، ثم تحديثه عبر git.

    وإذا كنت تفضّل نسخة clean يدويًا، فاستخدم:

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

    - **التثبيت:** من 2 إلى 5 دقائق
    - **الإعداد الأولي:** من 5 إلى 15 دقيقة بحسب عدد القنوات/النماذج التي تكوّنها

    إذا تعلّق، فاستخدم [تعطل برنامج التثبيت](#quick-start-and-first-run-setup)
    وحلقة التصحيح السريعة في [أنا عالق](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="برنامج التثبيت عالق؟ كيف أحصل على مزيد من الملاحظات؟">
    أعد تشغيل برنامج التثبيت مع **مخرجات تفصيلية**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    تثبيت Beta مع الوضع التفصيلي:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    لتثبيت hackable ‏(git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    المكافئ في Windows ‏(PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    مزيد من الخيارات: [علامات برنامج التثبيت](/ar/install/installer).

  </Accordion>

  <Accordion title="يقول التثبيت على Windows إن git غير موجود أو إن openclaw غير معروف">
    توجد مشكلتان شائعتان على Windows:

    **1) خطأ npm ‏spawn git / git not found**

    - ثبّت **Git for Windows** وتأكد من أن `git` موجود على PATH لديك.
    - أغلق PowerShell وأعد فتحه، ثم أعد تشغيل برنامج التثبيت.

    **2) openclaw is not recognized after install**

    - مجلد npm global bin لديك غير موجود على PATH.
    - تحقّق من المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف هذا الدليل إلى PATH الخاص بالمستخدم لديك (لا حاجة إلى اللاحقة `\bin` على Windows؛ ففي معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وأعد فتحه بعد تحديث PATH.

    إذا كنت تريد أسلس إعداد على Windows، فاستخدم **WSL2** بدلًا من Windows الأصلي.
    الوثائق: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="تعرض مخرجات exec على Windows نصًا صينيًا مشوهًا - ماذا أفعل؟">
    يكون السبب عادةً عدم تطابق code page في وحدة التحكم على أغلفة Windows الأصلية.

    الأعراض:

    - تعرض مخرجات `system.run`/`exec` النص الصيني بشكل مشوه
    - يبدو الأمر نفسه جيدًا في ملف تعريف طرفية آخر

    حل بديل سريع في PowerShell:

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

    إذا كنت لا تزال تستطيع إعادة إنتاج هذا على أحدث إصدار من OpenClaw، فتابعه/أبلغ عنه في:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="لم تُجب الوثائق عن سؤالي - كيف أحصل على إجابة أفضل؟">
    استخدم **تثبيت hackable ‏(git)** حتى تكون لديك الشفرة المصدرية الكاملة والوثائق محليًا، ثم اسأل
    الروبوت لديك (أو Claude/Codex) _من ذلك المجلد_ حتى يتمكن من قراءة المستودع والإجابة بدقة.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مزيد من التفاصيل: [التثبيت](/ar/install) و[علامات برنامج التثبيت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على Linux؟">
    الإجابة المختصرة: اتبع دليل Linux، ثم شغّل الإعداد الأولي.

    - المسار السريع لـ Linux + تثبيت الخدمة: [Linux](/ar/platforms/linux).
    - الشرح الكامل: [البدء](/ar/start/getting-started).
    - برنامج التثبيت والتحديثات: [التثبيت والتحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على VPS؟">
    يعمل أي Linux VPS. ثبّت على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول البعيد: [Gateway remote](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين توجد أدلة التثبيت السحابي/VPS؟">
    نحتفظ **بمركز استضافة** يضم مزودي الخدمة الشائعين. اختر واحدًا واتبع الدليل:

    - [استضافة VPS](/ar/vps) (كل المزوّدين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    كيفية عمل ذلك في السحابة: يعمل **Gateway على الخادم**، وتصل إليه
    من الحاسوب المحمول/الهاتف عبر Control UI ‏(أو Tailscale/SSH). وتكون الحالة + مساحة العمل
    على الخادم، لذا تعامل مع المضيف باعتباره مصدر الحقيقة وقم بعمل نسخة احتياطية له.

    يمكنك إقران **Nodes** ‏(Mac/iOS/Android/headless) مع Gateway السحابي هذا للوصول إلى
    الشاشة/الكاميرا/Canvas المحلية أو تشغيل الأوامر على الحاسوب المحمول لديك مع إبقاء
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول البعيد: [Gateway remote](/ar/gateway/remote).
    Nodes: [Nodes](/ar/nodes)، [Nodes CLI](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني أن أطلب من OpenClaw أن يحدّث نفسه؟">
    الإجابة المختصرة: **ممكن، لكنه غير موصى به**. قد تؤدي عملية التحديث إلى إعادة تشغيل
    Gateway ‏(مما يسقط الجلسة النشطة)، وقد تحتاج إلى نسخة git محلية clean،
    وقد تطلب تأكيدًا. الأكثر أمانًا: نفّذ التحديثات من shell بصفتك المشغّل.

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

  <Accordion title="ماذا يفعل الإعداد الأولي فعليًا؟">
    يُعد `openclaw onboard` مسار الإعداد الموصى به. في **الوضع المحلي** يرشدك خلال:

    - **إعداد النموذج/المصادقة** (OAuth الخاص بالموفّر، ومفاتيح API، وAnthropic setup-token، بالإضافة إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات bootstrap
    - **إعدادات Gateway** ‏(الربط/المنفذ/المصادقة/tailscale)
    - **القنوات** ‏(WhatsApp وTelegram وDiscord وMattermost وSignal وiMessage، بالإضافة إلى Plugins القنوات المضمّنة مثل QQ Bot)
    - **تثبيت daemon** ‏(LaunchAgent على macOS؛ ووحدة systemd user على Linux/WSL2)
    - **الفحوصات الصحية** واختيار **Skills**

    كما أنه يحذّر إذا كان النموذج الذي ضبطته غير معروف أو تنقصه المصادقة.

  </Accordion>

  <Accordion title="هل أحتاج إلى اشتراك Claude أو OpenAI لتشغيل هذا؟">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** ‏(Anthropic/OpenAI/وغيرها) أو باستخدام
    **نماذج محلية فقط** بحيث تبقى بياناتك على جهازك. وتمثل الاشتراكات (Claude
    Pro/Max أو OpenAI Codex) طرقًا اختيارية للمصادقة مع هؤلاء الموفّرين.

    بالنسبة إلى Anthropic في OpenClaw، يكون التقسيم العملي كما يلي:

    - **مفتاح Anthropic API**: فوترة Anthropic API العادية
    - **Claude CLI / مصادقة اشتراك Claude في OpenClaw**: أبلغنا موظفو Anthropic
      بأن هذا الاستخدام مسموح به مجددًا، ويتعامل OpenClaw مع استخدام `claude -p`
      على أنه معتمد لهذا التكامل ما لم تنشر Anthropic سياسة جديدة

    بالنسبة إلى مضيفي Gateway طويلي العمر، تظل مفاتيح Anthropic API هي الإعداد
    الأكثر قابلية للتنبؤ. كما أن OAuth الخاص بـ OpenAI Codex مدعوم صراحةً للأدوات
    الخارجية مثل OpenClaw.

    يدعم OpenClaw أيضًا خيارات أخرى مستضافة بنمط الاشتراك، بما في ذلك
    **Qwen Cloud Coding Plan** و**MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan**.

    الوثائق: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [GLM Models](/ar/providers/glm)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام اشتراك Claude Max من دون مفتاح API؟">
    نعم.

    أبلغنا موظفو Anthropic بأن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذا
    يتعامل OpenClaw مع مصادقة اشتراك Claude واستخدام `claude -p` على أنهما معتمدان
    لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. وإذا كنت تريد
    إعدادًا أكثر قابلية للتنبؤ على جانب الخادم، فاستخدم مفتاح Anthropic API بدلًا من ذلك.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك Claude ‏(Claude Pro أو Max)؟">
    نعم.

    أبلغنا موظفو Anthropic بأن هذا الاستخدام مسموح به مجددًا، لذا يتعامل OpenClaw مع
    إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    لا يزال Anthropic setup-token متاحًا كمسار token مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
    وبالنسبة إلى أحمال العمل الإنتاجية أو متعددة المستخدمين، تظل مصادقة مفتاح Anthropic API
    الخيار الأكثر أمانًا وقابلية للتنبؤ. وإذا كنت تريد خيارات مستضافة أخرى
    بنمط الاشتراك في OpenClaw، فراجع [OpenAI](/ar/providers/openai) و[Qwen / Model
    Cloud](/ar/providers/qwen) و[MiniMax](/ar/providers/minimax) و[GLM
    Models](/ar/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="لماذا أرى HTTP 429 rate_limit_error من Anthropic؟">
    هذا يعني أن **الحصة/حد المعدل في Anthropic** قد استُنفد في النافذة الحالية. إذا كنت
    تستخدم **Claude CLI**، فانتظر حتى تُعاد تعيين النافذة أو قم بترقية خطتك. وإذا كنت
    تستخدم **مفتاح Anthropic API**، فتحقق من Anthropic Console
    للاطلاع على الاستخدام/الفوترة وارفع الحدود حسب الحاجة.

    إذا كانت الرسالة تحديدًا:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    الإصدار التجريبي لسياق 1M لدى Anthropic ‏(`context1m: true`). ولا يعمل ذلك إلا عندما تكون
    بيانات الاعتماد لديك مؤهلة لفوترة السياق الطويل (فوترة مفتاح API أو
    مسار تسجيل دخول Claude في OpenClaw مع تفعيل Extra Usage).

    نصيحة: اضبط **نموذجًا احتياطيًا** حتى يتمكن OpenClaw من مواصلة الرد أثناء تعرّض أحد الموفّرين لتقييد المعدل.
    راجع [Models](/ar/cli/models) و[OAuth](/ar/concepts/oauth) و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. يتضمن OpenClaw موفّر **Amazon Bedrock (Converse)** مضمّنًا. عند وجود علامات بيئة AWS، يمكن لـ OpenClaw اكتشاف كتالوج Bedrock للبث/النص تلقائيًا ودمجه كموفّر ضمني `amazon-bedrock`؛ وإلا يمكنك تمكين `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحةً أو إضافة إدخال موفّر يدوي. راجع [Amazon Bedrock](/ar/providers/bedrock) و[موفّرو النماذج](/ar/providers/models). وإذا كنت تفضّل تدفق مفاتيح مُدارًا، فلا يزال الوكيل المتوافق مع OpenAI أمام Bedrock خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth ‏(تسجيل الدخول إلى ChatGPT). استخدم
    `openai-codex/gpt-5.5` لمصادقة Codex OAuth عبر مشغّل PI الافتراضي. واستخدم
    `openai/gpt-5.5` للوصول المباشر عبر مفتاح OpenAI API. ويمكن أيضًا لـ GPT-5.5 استخدام
    الاشتراك/OAuth عبر `openai-codex/gpt-5.5` أو تشغيلات Codex app-server
    الأصلية مع `openai/gpt-5.5` و`embeddedHarness.runtime: "codex"`.
    راجع [موفّرو النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا ما يزال OpenClaw يذكر openai-codex؟">
    `openai-codex` هو معرّف الموفّر وملف تعريف المصادقة لـ ChatGPT/Codex OAuth.
    وهو أيضًا بادئة نموذج PI الصريحة لمصادقة Codex OAuth:

    - `openai/gpt-5.5` = مسار مفتاح OpenAI API المباشر الحالي في PI
    - `openai-codex/gpt-5.5` = مسار Codex OAuth في PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = مسار Codex app-server الأصلي
    - `openai-codex:...` = معرّف ملف تعريف مصادقة، وليس مرجع نموذج

    إذا كنت تريد مسار الفوترة/الحدود المباشر لمنصة OpenAI، فاضبط
    `OPENAI_API_KEY`. وإذا كنت تريد مصادقة اشتراك ChatGPT/Codex، فسجّل الدخول باستخدام
    `openclaw models auth login --provider openai-codex` واستخدم
    مراجع النماذج `openai-codex/*` لتشغيلات PI.

  </Accordion>

  <Accordion title="لماذا قد تختلف حدود Codex OAuth عن ChatGPT على الويب؟">
    يستخدم Codex OAuth نوافذ حصص تعتمد على الخطة وتُدار من OpenAI. وعمليًا،
    قد تختلف هذه الحدود عن تجربة موقع/تطبيق ChatGPT، حتى عندما
    يكون كلاهما مرتبطًا بالحساب نفسه.

    يمكن لـ OpenClaw إظهار نوافذ الاستخدام/الحصص المرئية حاليًا لدى الموفّر في
    `openclaw models status`، لكنه لا يخترع استحقاقات ChatGPT على الويب
    ولا يوحّدها ضمن وصول API مباشر. وإذا كنت تريد مسار الفوترة/الحدود المباشر في منصة OpenAI،
    فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك OpenAI ‏(Codex OAuth)؟">
    نعم. يدعم OpenClaw بالكامل **OpenAI Code (Codex) subscription OAuth**.
    وتسمح OpenAI صراحةً باستخدام subscription OAuth في الأدوات/سير العمل الخارجية
    مثل OpenClaw. ويمكن لعملية الإعداد الأولي تشغيل تدفق OAuth نيابةً عنك.

    راجع [OAuth](/ar/concepts/oauth) و[موفّرو النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أضبط Gemini CLI OAuth؟">
    يستخدم Gemini CLI **تدفق مصادقة Plugin**، وليس client id أو secret داخل `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا بحيث يكون `gemini` موجودًا على `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. فعّل Plugin: ‏`openclaw plugins enable google`
    3. سجّل الدخول: ‏`openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: ‏`google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway

    يؤدي ذلك إلى تخزين رموز OAuth في ملفات تعريف المصادقة على مضيف Gateway. التفاصيل: [موفّرو النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للمحادثات العادية؟">
    عادةً لا. يحتاج OpenClaw إلى سياق كبير + أمان قوي؛ فالبطاقات الصغيرة تؤدي إلى الاقتطاع والتسرّب. وإذا كان لا بد من ذلك، فشغّل **أكبر** إصدار نموذج تستطيع تشغيله محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). تزيد النماذج الأصغر/المكمّمة من خطر حقن الـ prompt - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أحافظ على حركة مرور النماذج المستضافة داخل منطقة محددة؟">
    اختر نقاط نهاية مثبتة حسب المنطقة. يوفّر OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر النسخة المستضافة في الولايات المتحدة للإبقاء على البيانات داخل المنطقة. ولا يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه الخيارات باستخدام `models.mode: "merge"` بحيث تظل النماذج الاحتياطية متاحة مع احترام الموفّر المقيّد بالمنطقة الذي اخترته.
  </Accordion>

  <Accordion title="هل يجب أن أشتري Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux ‏(وWindows عبر WSL2). ويُعد Mac mini اختياريًا - فبعض الأشخاص
    يشترونه كمضيف دائم التشغيل، لكن VPS صغيرًا أو خادمًا منزليًا أو جهازًا من فئة Raspberry Pi يمكنه العمل أيضًا.

    أنت تحتاج إلى Mac **فقط لأدوات macOS-only**. وبالنسبة إلى iMessage، استخدم [BlueBubbles](/ar/channels/bluebubbles) ‏(موصى به) - إذ يعمل خادم BlueBubbles على أي Mac، ويمكن أن يعمل Gateway على Linux أو في مكان آخر. وإذا كنت تريد أدوات أخرى خاصة بـ macOS فقط، فشغّل Gateway على Mac أو قم بإقران Node يعمل على macOS.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، [Nodes](/ar/nodes)، [الوضع البعيد على Mac](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **جهاز macOS ما** مسجّل الدخول إلى Messages. ولا **يشترط** أن يكون Mac mini -
    فأي Mac يعمل. **استخدم [BlueBubbles](/ar/channels/bluebubbles)** ‏(موصى به) لـ iMessage - إذ يعمل خادم BlueBubbles على macOS، بينما يمكن أن يعمل Gateway على Linux أو في مكان آخر.

    الإعدادات الشائعة:

    - شغّل Gateway على Linux/VPS، وشغّل خادم BlueBubbles على أي Mac مسجّل الدخول إلى Messages.
    - شغّل كل شيء على الـ Mac إذا كنت تريد أبسط إعداد على جهاز واحد.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، [Nodes](/ar/nodes)،
    [الوضع البعيد على Mac](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، فهل يمكنني توصيله بـ MacBook Pro؟">
    نعم. يمكن لـ **Mac mini تشغيل Gateway**، ويمكن لـ MacBook Pro الاتصال كـ
    **Node** ‏(جهاز مرافق). لا تقوم Nodes بتشغيل Gateway - بل توفر
    قدرات إضافية مثل الشاشة/الكاميرا/Canvas و`system.run` على ذلك الجهاز.

    النمط الشائع:

    - Gateway على Mac mini ‏(دائم التشغيل).
    - يشغّل MacBook Pro تطبيق macOS أو مضيف Node ويقترن بـ Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    الوثائق: [Nodes](/ar/nodes)، [Nodes CLI](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    لا يُوصى بـ Bun **. نرى أخطاء وقت تشغيل، خصوصًا مع WhatsApp وTelegram.
    استخدم **Node** للحصول على Gateways مستقرة.

    إذا كنت لا تزال تريد التجربة باستخدام Bun، فافعل ذلك على Gateway غير إنتاجية
    ومن دون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ماذا أضع في allowFrom؟">
    `channels.telegram.allowFrom` هو **معرّف مستخدم Telegram البشري** ‏(رقمي). وليس اسم مستخدم الروبوت.

    يطلب الإعداد أرقام معرّفات المستخدمين فقط. وإذا كانت لديك بالفعل إدخالات قديمة من نوع `@username` في الإعداد، فيمكن لـ `openclaw doctor --fix` محاولة حلّها.

    الطريقة الأكثر أمانًا (من دون روبوت تابع لجهة خارجية):

    - أرسل رسالة مباشرة إلى الروبوت، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    Bot API الرسمي:

    - أرسل رسالة مباشرة إلى الروبوت، ثم استدعِ `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    طرف ثالث (أقل خصوصية):

    - أرسل رسالة مباشرة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع نُسخ OpenClaw مختلفة؟">
    نعم، عبر **التوجيه متعدد الوكلاء**. اربط **DM** الخاص بـ WhatsApp لكل مرسل (نظير `kind: "direct"`، ومعرّف E.164 للمرسل مثل `+15551234567`) بـ `agentId` مختلف، بحيث يحصل كل شخص على مساحة عمله ومخزن جلساته الخاصين. وستظل الردود صادرة من **حساب WhatsApp نفسه**، كما أن التحكم في الوصول للرسائل المباشرة (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) عام على مستوى حساب WhatsApp الواحد. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "دردشة سريعة" ووكيل "Opus للبرمجة"؟'>
    نعم. استخدم التوجيه متعدد الوكلاء: امنح كل وكيل نموذجه الافتراضي الخاص، ثم اربط المسارات الواردة (حساب الموفّر أو نظراء محددين) بكل وكيل. يوجد مثال للإعداد في [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent). راجع أيضًا [النماذج](/ar/concepts/models) و[الإعداد](/ar/gateway/configuration).
  </Accordion>

  <Accordion title="هل يعمل Homebrew على Linux؟">
    نعم. يدعم Homebrew نظام Linux ‏(Linuxbrew). إعداد سريع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    إذا كنت تشغّل OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` (أو بادئة brew لديك) بحيث يمكن حل الأدوات المثبتة عبر `brew` في الأصداف غير التفاعلية.
    كما تضيف الإصدارات الحديثة أيضًا أدلة bin الشائعة للمستخدم في خدمات Linux systemd (على سبيل المثال `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) وتلتزم بالقيم `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, و`FNM_DIR` عند ضبطها.

  </Accordion>

  <Accordion title="الفرق بين تثبيت git القابل للتعديل وتثبيت npm">
    - **تثبيت git القابل للتعديل:** نسخة مصدر كاملة، قابلة للتحرير، وهي الأفضل للمساهمين.
      فأنت تشغّل عمليات البناء محليًا ويمكنك ترقيع الكود/الوثائق.
    - **تثبيت npm:** تثبيت CLI عام، من دون مستودع، وهو الأفضل لمن يريد "مجرد تشغيله".
      وتأتي التحديثات من npm dist-tags.

    الوثائق: [البدء](/ar/start/getting-started)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="هل يمكنني التبديل بين تثبيتات npm وgit لاحقًا؟">
    نعم. ثبّت النمط الآخر، ثم شغّل Doctor حتى تشير خدمة gateway إلى نقطة الدخول الجديدة.
    هذا **لا يحذف بياناتك** - بل يغيّر فقط تثبيت كود OpenClaw. وتظل حالتك
    (`~/.openclaw`) ومساحة العمل (`~/.openclaw/workspace`) كما هي من دون مساس.

    من npm إلى git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    من git إلى npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    يكتشف Doctor عدم تطابق نقطة دخول خدمة gateway ويعرض إعادة كتابة إعداد الخدمة ليتطابق مع التثبيت الحالي (استخدم `--repair` في الأتمتة).

    نصائح النسخ الاحتياطي: راجع [استراتيجية النسخ الاحتياطي](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="هل أشغّل Gateway على الحاسوب المحمول أم على VPS؟">
    الإجابة المختصرة: **إذا كنت تريد موثوقية على مدار الساعة، فاستخدم VPS**. وإذا كنت تريد
    أقل قدر من الاحتكاك ولا تمانع السكون/إعادة التشغيل، فشغّله محليًا.

    **الحاسوب المحمول (Gateway محلية)**

    - **الإيجابيات:** لا توجد تكلفة خادم، ووصول مباشر إلى الملفات المحلية، ونافذة متصفح مرئية مباشرة.
    - **السلبيات:** السكون/انقطاع الشبكة = انقطاعات، وتؤدي تحديثات/إعادات تشغيل النظام إلى المقاطعة، ويجب أن يبقى الجهاز مستيقظًا.

    **VPS / السحابة**

    - **الإيجابيات:** دائم التشغيل، وشبكة مستقرة، ولا توجد مشكلات سكون الحاسوب المحمول، وأسهل في الإبقاء عليه قيد التشغيل.
    - **السلبيات:** غالبًا يعمل بدون واجهة (استخدم لقطات الشاشة)، ووصول إلى الملفات عن بُعد فقط، ويجب عليك استخدام SSH للتحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp وTelegram وSlack وMattermost وDiscord جميعها بشكل جيد من VPS. والمقايضة الحقيقية الوحيدة هي **متصفح بدون واجهة** مقابل نافذة مرئية. راجع [Browser](/ar/tools/browser).

    **الافتراضي الموصى به:** VPS إذا كنت قد واجهت انقطاعات في Gateway من قبل. ويكون التشغيل المحلي رائعًا عندما تكون تستخدم الـ Mac بنشاط وتريد الوصول إلى الملفات المحلية أو أتمتة واجهة المستخدم باستخدام متصفح مرئي.

  </Accordion>

  <Accordion title="ما مدى أهمية تشغيل OpenClaw على جهاز مخصص؟">
    ليس مطلوبًا، لكنه **موصى به من أجل الموثوقية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Pi):** دائم التشغيل، وانقطاعات أقل بسبب السكون/إعادة التشغيل، وأذونات أنظف، وأسهل في الإبقاء عليه قيد التشغيل.
    - **حاسوب محمول/مكتبي مشترك:** مناسب تمامًا للاختبار والاستخدام النشط، لكن توقّع فترات توقف عندما يدخل الجهاز في وضع السكون أو عند تحديثه.

    إذا كنت تريد أفضل ما في العالمين، فأبقِ Gateway على مضيف مخصص واقرن الحاسوب المحمول لديك كـ **Node** لأدوات الشاشة/الكاميرا/exec المحلية. راجع [Nodes](/ar/nodes).
    ولإرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما الحد الأدنى لمتطلبات VPS وما نظام التشغيل الموصى به؟">
    OpenClaw خفيف. بالنسبة إلى Gateway أساسية + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** 1 vCPU، و1GB RAM، وحوالي 500MB من مساحة القرص.
    - **الموصى به:** من 1 إلى 2 vCPU، و2GB RAM أو أكثر كهامش إضافي (للسجلات وmedia وتعدد القنوات). وقد تكون أدوات Node وأتمتة المتصفح شرهة للموارد.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). فمسار التثبيت على Linux هو الأكثر اختبارًا عليه.

    الوثائق: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw داخل VM وما المتطلبات؟">
    نعم. تعامل مع VM بالطريقة نفسها التي تتعامل بها مع VPS: يجب أن تكون دائمة التشغيل، وقابلة للوصول، وتملك مقدارًا كافيًا
    من RAM لـ Gateway وأي قنوات تقوم بتمكينها.

    إرشادات أساسية:

    - **الحد الأدنى المطلق:** 1 vCPU، و1GB RAM.
    - **الموصى به:** 2GB RAM أو أكثر إذا كنت تشغّل قنوات متعددة، أو أتمتة المتصفح، أو أدوات media.
    - **نظام التشغيل:** Ubuntu LTS أو Debian/Ubuntu حديث آخر.

    إذا كنت تستخدم Windows، فإن **WSL2 هو أسهل إعداد على نمط VM** ويتمتع بأفضل توافق
    مع الأدوات. راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    وإذا كنت تشغّل macOS داخل VM، فراجع [macOS VM](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية (النماذج، والجلسات، وGateway، والأمان، والمزيد)
- [نظرة عامة على التثبيت](/ar/install)
- [البدء](/ar/start/getting-started)
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
