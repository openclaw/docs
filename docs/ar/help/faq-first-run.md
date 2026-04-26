---
read_when:
    - تثبيت جديد، أو تعطل التهيئة الأولى، أو أخطاء التشغيل الأول
    - اختيار المصادقة واشتراكات المزوّدين
    - تعذر الوصول إلى docs.openclaw.ai، أو تعذر فتح لوحة التحكم، أو تعطل التثبيت
sidebarTitle: First-run FAQ
summary: 'الأسئلة الشائعة: البدء السريع وإعداد التشغيل الأول — التثبيت والتهيئة الأولى والمصادقة والاشتراكات وإخفاقات البداية الأولى'
title: 'الأسئلة الشائعة: إعداد التشغيل الأول'
x-i18n:
    generated_at: "2026-04-26T11:32:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55d375285eb9f79cfa210b1b591b07b57d8a0a4d38c330062886d1204135ff48
    source_path: help/faq-first-run.md
    workflow: 15
---

  أسئلة وأجوبة البدء السريع والتشغيل الأول. بالنسبة إلى العمليات اليومية والنماذج والمصادقة والجلسات
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## البدء السريع وإعداد التشغيل الأول

  <AccordionGroup>
  <Accordion title="أنا عالق، ما أسرع طريقة للخروج من هذا المأزق؟">
    استخدم وكيل AI محليًا يمكنه **رؤية جهازك**. فهذا أكثر فاعلية بكثير من السؤال
    في Discord، لأن معظم حالات "أنا عالق" تكون **مشكلات محلية في الإعدادات أو البيئة** لا يستطيع
    المساعدون عن بُعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    يمكن لهذه الأدوات قراءة المستودع وتشغيل الأوامر وفحص السجلات والمساعدة في إصلاح
    إعداد جهازك (PATH والخدمات والأذونات وملفات المصادقة). امنحها **نسخة المصدر الكاملة**
    عبر تثبيت hackable ‏(git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يؤدي هذا إلى تثبيت OpenClaw **من نسخة git checkout**، بحيث يمكن للوكيل قراءة الشيفرة + الوثائق
    والتفكير في الإصدار الدقيق الذي تشغله. ويمكنك دائمًا الرجوع لاحقًا إلى الإصدار المستقر
    عبر إعادة تشغيل أداة التثبيت بدون `--install-method git`.

    نصيحة: اطلب من الوكيل أن **يخطط للإصلاح ويشرف عليه** (خطوة بخطوة)، ثم نفّذ فقط
    الأوامر اللازمة. فهذا يُبقي التغييرات صغيرة وأسهل في التدقيق.

    إذا اكتشفت خطأً حقيقيًا أو أصلحته، فالرجاء فتح issue على GitHub أو إرسال PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    ابدأ بهذه الأوامر (وشارك المخرجات عند طلب المساعدة):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    ما الذي تفعله:

    - `openclaw status`: لقطة سريعة عن سلامة gateway/الوكيل + الإعدادات الأساسية.
    - `openclaw models status`: يفحص مصادقة المزوّد + توفر النموذج.
    - `openclaw doctor`: يتحقق من مشكلات الإعداد/الحالة الشائعة ويصلحها.

    فحوصات CLI أخرى مفيدة: `openclaw status --all` و`openclaw logs --follow`،
    و`openclaw gateway status` و`openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان هناك شيء معطّل](#first-60-seconds-if-something-is-broken).
    وثائق التثبيت: [التثبيت](/ar/install)، [أعلام أداة التثبيت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="يستمر Heartbeat في التخطي. ماذا تعني أسباب التخطي؟">
    الأسباب الشائعة لتخطي Heartbeat:

    - `quiet-hours`: خارج نافذة الساعات النشطة المهيأة
    - `empty-heartbeat-file`: يوجد `HEARTBEAT.md` لكنه يحتوي فقط على هيكل فارغ/رؤوس فقط
    - `no-tasks-due`: وضع المهام في `HEARTBEAT.md` نشط لكن لم يحن موعد أي من فترات المهام بعد
    - `alerts-disabled`: تم تعطيل كل ظهور Heartbeat ‏(`showOk` و`showAlerts` و`useIndicator` كلها معطلة)

    في وضع المهام، لا يتم تقديم الطوابع الزمنية المستحقة إلا بعد اكتمال
    تشغيل Heartbeat حقيقي. ولا تضع عمليات التشغيل المتخطاة علامة على اكتمال المهام.

    الوثائق: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="الطريقة الموصى بها لتثبيت OpenClaw وإعداده">
    يوصي المستودع بالتشغيل من المصدر واستخدام التهيئة الأولى:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    يمكن للمعالج أيضًا بناء أصول واجهة المستخدم تلقائيًا. بعد التهيئة الأولى، عادةً ما تشغّل Gateway على المنفذ **18789**.

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

  <Accordion title="كيف أفتح لوحة التحكم بعد التهيئة الأولى؟">
    يفتح المعالج متصفحك بعنوان URL نظيف للوحة التحكم (من دون token في الرابط) مباشرة بعد التهيئة الأولى ويطبع أيضًا الرابط في الملخص. أبقِ علامة التبويب تلك مفتوحة؛ وإذا لم تُفتح، فانسخ/الصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أصادق لوحة التحكم على localhost مقابل الاتصال البعيد؟">
    **Localhost ‏(الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلب منك مصادقة shared-secret، فألصق token أو password المهيأ في إعدادات Control UI.
    - مصدر token: ‏`gateway.auth.token` ‏(أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر password: ‏`gateway.auth.password` ‏(أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يتم تهيئة shared secret بعد، فأنشئ token باستخدام `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** ‏(موصى به): أبقِ الربط على loopback، وشغّل `openclaw gateway --tailscale serve`، وافتح `https://<magicdns>/`. إذا كانت `gateway.auth.allowTailscale` تساوي `true`، فإن ترويسات الهوية تلبّي مصادقة Control UI/WebSocket ‏(من دون لصق shared secret، مع افتراض أن مضيف gateway موثوق)؛ أما HTTP APIs فلا تزال تتطلب مصادقة shared-secret ما لم تستخدم عمدًا `none` في private-ingress أو مصادقة HTTP عبر trusted-proxy.
      يتم تسلسل محاولات المصادقة السيئة المتزامنة من العميل نفسه في Serve قبل أن يسجل محدِّد المصادقة الفاشلة حالتها، لذا قد تُظهر المحاولة السيئة الثانية بالفعل `retry later`.
    - **ربط Tailnet**: شغّل `openclaw gateway --bind tailnet --token "<token>"` ‏(أو هيّئ مصادقة password)، وافتح `http://<tailscale-ip>:18789/`، ثم ألصق shared secret المطابق في إعدادات لوحة التحكم.
    - **وكيل عكسي مدرك للهوية**: أبقِ Gateway خلف trusted proxy غير مربوط بـ loopback، وهيّئ `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل.
    - **SSH tunnel**: ‏`ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. لا تزال مصادقة shared-secret مطبقة عبر النفق؛ ألصق token أو password المهيأ إذا طُلب منك ذلك.

    راجع [لوحة التحكم](/ar/web/dashboard) و[أسطح الويب](/ar/web) للحصول على تفاصيل أوضاع الربط والمصادقة.

  </Accordion>

  <Accordion title="لماذا توجد إعدادات exec approval اثنتان لموافقات الدردشة؟">
    إنها تتحكم في طبقتين مختلفتين:

    - `approvals.exec`: يعيد توجيه مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: يجعل تلك القناة تعمل كعميل موافقة أصلي لموافقات exec

    تظل سياسة exec على المضيف هي بوابة الموافقة الحقيقية. أما إعدادات الدردشة فتتحكم فقط في مكان ظهور
    مطالبات الموافقة وكيفية تمكن الأشخاص من الرد عليها.

    في معظم الإعدادات **لن تحتاج** إلى كليهما:

    - إذا كانت الدردشة تدعم بالفعل الأوامر والردود، فإن `/approve` داخل الدردشة نفسها يعمل عبر المسار المشترك.
    - إذا كانت قناة أصلية مدعومة قادرة على استنتاج الموافقين بأمان، فإن OpenClaw يفعّل الآن تلقائيًا الموافقات الأصلية عبر الرسائل الخاصة أولًا عندما تكون `channels.<channel>.execApprovals.enabled` غير مضبوطة أو تساوي `"auto"`.
    - عندما تكون بطاقات/أزرار الموافقة الأصلية متاحة، تكون واجهة المستخدم الأصلية هذه هي المسار الأساسي؛ ويجب على الوكيل ألا يتضمن أمر `/approve` يدويًا إلا إذا كانت نتيجة الأداة تقول إن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب أيضًا إعادة توجيه المطالبات إلى دردشات أخرى أو غرف عمليات صريحة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحةً نشر مطالبات الموافقة مرة أخرى في الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة مرة أخرى: فهي تستخدم `/approve` داخل الدردشة نفسها افتراضيًا، مع إعادة توجيه اختيارية عبر `approvals.plugin`، وفقط بعض القنوات الأصلية تبقي معالجة موافقة Plugin الأصلية فوق ذلك.

    باختصار: إعادة التوجيه مخصصة للتوجيه، أما إعدادات العميل الأصلي فمخصصة لتجربة استخدام أغنى خاصة بالقناة.
    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما بيئة التشغيل التي أحتاجها؟">
    يتطلب Node **>= 22**. ويوصى باستخدام `pnpm`. ولا يُنصح باستخدام Bun مع Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. Gateway خفيف الوزن - تذكر الوثائق أن **512MB-1GB RAM** و**نواة واحدة** وحوالي **500MB**
    من القرص تكفي للاستخدام الشخصي، كما تشير إلى أن **Raspberry Pi 4 يمكنه تشغيله**.

    إذا كنت تريد مساحة إضافية (للسجلات والوسائط والخدمات الأخرى)، فـ **2GB موصى بها**، لكنها
    ليست حدًا أدنى صارمًا.

    نصيحة: يمكن لـ Pi/VPS صغير استضافة Gateway، ويمكنك إقران **nodes** على حاسوبك المحمول/هاتفك من أجل
    الشاشة/الكاميرا/canvas المحلية أو تنفيذ الأوامر. راجع [Nodes](/ar/nodes).

  </Accordion>

  <Accordion title="هل لديك نصائح لتثبيتات Raspberry Pi؟">
    باختصار: إنه يعمل، لكن توقّع بعض الحواف الخشنة.

    - استخدم نظام تشغيل **64-bit** وأبقِ Node >= 22.
    - فضّل تثبيت **hackable ‏(git)** حتى تتمكن من رؤية السجلات والتحديث بسرعة.
    - ابدأ من دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات ثنائية غريبة، فعادةً ما تكون مشكلة **توافق ARM**.

    الوثائق: [Linux](/ar/platforms/linux)، [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق على wake up my friend / التهيئة الأولى لا تكتمل. ماذا الآن؟">
    تعتمد هذه الشاشة على أن تكون Gateway قابلة للوصول ومصادقًا عليها. كما ترسل TUI أيضًا
    عبارة "Wake up, my friend!" تلقائيًا عند أول تشغيل. وإذا رأيت هذا السطر **من دون أي رد**
    وبقيت tokens عند 0، فهذا يعني أن الوكيل لم يعمل أبدًا.

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

    3. إذا ظل معلقًا، فشغّل:

    ```bash
    openclaw doctor
    ```

    إذا كانت Gateway بعيدة، فتأكد من أن نفق/اتصال Tailscale يعمل وأن واجهة المستخدم
    تشير إلى Gateway الصحيحة. راجع [الوصول عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="هل يمكنني نقل إعدادي إلى جهاز جديد (Mac mini) دون إعادة تنفيذ التهيئة الأولى؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغّل Doctor مرة واحدة. وهذا
    يُبقي البوت الخاص بك "تمامًا كما هو" (الذاكرة وسجل الجلسات والمصادقة وحالة
    القناة) طالما أنك تنسخ **كلا** الموقعين:

    1. ثبّت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` ‏(الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة العمل الخاصة بك (الافتراضي: `~/.openclaw/workspace`).
    4. شغّل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    يحافظ هذا على الإعدادات وملفات تعريف المصادقة وبيانات اعتماد WhatsApp والجلسات والذاكرة. وإذا كنت في
    الوضع البعيد، فتذكر أن مضيف gateway هو من يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا كنت فقط تنفذ commit/push لمساحة عملك إلى GitHub، فأنت تنسخ احتياطيًا
    **الذاكرة + ملفات التمهيد**، لكن **ليس** سجل الجلسات أو المصادقة. فهذه توجد
    تحت `~/.openclaw/` ‏(على سبيل المثال `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [مكان وجود الأشياء على القرص](#where-things-live-on-disk)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أرى ما الجديد في أحدث إصدار؟">
    راجع سجل التغييرات على GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    تكون أحدث الإدخالات في الأعلى. وإذا كان القسم العلوي معلّمًا بـ **Unreleased**، فإن القسم المؤرخ التالي
    هو أحدث إصدار تم شحنه. وتُجمع الإدخالات تحت **Highlights** و**Changes** و
    **Fixes** ‏(بالإضافة إلى أقسام الوثائق/أخرى عند الحاجة).

  </Accordion>

  <Accordion title="لا يمكن الوصول إلى docs.openclaw.ai ‏(خطأ SSL)">
    تقوم بعض اتصالات Comcast/Xfinity بحظر `docs.openclaw.ai` بشكل غير صحيح عبر Xfinity
    Advanced Security. عطّلها أو أضف `docs.openclaw.ai` إلى قائمة السماح، ثم أعد المحاولة.
    ويرجى مساعدتنا في رفع الحظر عنه عبر الإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    وإذا استمر تعذر الوصول إلى الموقع، فالوثائق لها نسخة مرآة على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="الفرق بين stable وbeta">
    إن **Stable** و**beta** هما **npm dist-tags** وليسا خطي شيفرة منفصلين:

    - `latest` = مستقر
    - `beta` = إصدار مبكر للاختبار

    عادةً ما يصل الإصدار المستقر إلى **beta** أولًا، ثم تنقل خطوة
    ترقية صريحة الإصدار نفسه إلى `latest`. ويمكن للمشرفين أيضًا
    النشر مباشرةً إلى `latest` عند الحاجة. ولهذا السبب قد يشير كل من beta وstable إلى **الإصدار نفسه** بعد الترقية.

    اطّلع على ما تغيّر:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    للحصول على أوامر التثبيت المختصرة والفرق بين beta وdev، راجع قسم الأكورديون أدناه.

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

    مزيد من التفاصيل: [قنوات التطوير](/ar/install/development-channels) و[أعلام أداة التثبيت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أجرّب أحدث المكونات؟">
    يوجد خياران:

    1. **قناة Dev ‏(git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    يؤدي هذا إلى التبديل إلى الفرع `main` والتحديث من المصدر.

    2. **تثبيت hackable ‏(من موقع أداة التثبيت):**

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

    الوثائق: [Update](/ar/cli/update)، [قنوات التطوير](/ar/install/development-channels)،
    [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="كم يستغرق التثبيت والتهيئة الأولى عادةً؟">
    تقدير تقريبي:

    - **التثبيت:** 2-5 دقائق
    - **التهيئة الأولى:** 5-15 دقيقة بحسب عدد القنوات/النماذج التي تهيئها

    إذا تعطل، فاستخدم [تعطل أداة التثبيت](#quick-start-and-first-run-setup)
    وحلقة التصحيح السريعة في [أنا عالق](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="تعطلت أداة التثبيت؟ كيف أحصل على مزيد من المعلومات؟">
    أعد تشغيل أداة التثبيت مع **مخرجات verbose**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    تثبيت Beta مع verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    لتثبيت hackable ‏(git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    ما يعادله على Windows ‏(PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    مزيد من الخيارات: [أعلام أداة التثبيت](/ar/install/installer).

  </Accordion>

  <Accordion title="يقول تثبيت Windows إن git غير موجود أو إن openclaw غير معروف">
    هناك مشكلتان شائعتان في Windows:

    **1) خطأ npm spawn git / git not found**

    - ثبّت **Git for Windows** وتأكد من أن `git` موجود في PATH لديك.
    - أغلق PowerShell وأعد فتحه، ثم أعد تشغيل أداة التثبيت.

    **2) openclaw is not recognized بعد التثبيت**

    - مجلد npm global bin غير موجود في PATH لديك.
    - تحقّق من المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف هذا الدليل إلى PATH الخاص بالمستخدم لديك (لا حاجة إلى اللاحقة `\bin` على Windows؛ ففي معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وأعد فتحه بعد تحديث PATH.

    إذا كنت تريد إعداد Windows الأكثر سلاسة، فاستخدم **WSL2** بدل Windows الأصلي.
    الوثائق: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="تعرض مخرجات exec في Windows نصًا صينيًا مشوهًا - ماذا يجب أن أفعل؟">
    يكون هذا عادةً بسبب عدم تطابق code page في وحدة التحكم على واجهات Windows الأصلية.

    الأعراض:

    - تُعرض مخرجات `system.run`/`exec` الصينية على شكل mojibake
    - يبدو الأمر نفسه جيدًا في ملف تعريف طرفية آخر

    حل سريع مؤقت في PowerShell:

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

    إذا استمر ظهور هذه المشكلة على أحدث إصدار من OpenClaw، فتابعها/أبلغ عنها في:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="لم تُجب الوثائق عن سؤالي - كيف أحصل على إجابة أفضل؟">
    استخدم **تثبيت hackable ‏(git)** حتى تتوفر لديك الشيفرة والوثائق كاملتين محليًا، ثم اسأل
    البوت (أو Claude/Codex) _من ذلك المجلد_ حتى يتمكن من قراءة المستودع والإجابة بدقة.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مزيد من التفاصيل: [التثبيت](/ar/install) و[أعلام أداة التثبيت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على Linux؟">
    الإجابة المختصرة: اتبع دليل Linux، ثم شغّل التهيئة الأولى.

    - المسار السريع لـ Linux + تثبيت الخدمة: [Linux](/ar/platforms/linux).
    - الشرح الكامل: [البدء](/ar/start/getting-started).
    - أداة التثبيت + التحديثات: [التثبيت والتحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على VPS؟">
    أي VPS يعمل بنظام Linux مناسب. ثبّت النظام على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول عن بُعد: [Gateway remote](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين توجد أدلة التثبيت السحابي/VPS؟">
    نحتفظ **بمركز استضافة** يضم مزوّدي الخدمة الشائعين. اختر واحدًا واتبع الدليل:

    - [استضافة VPS](/ar/vps) (كل المزوّدين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    كيف يعمل هذا في السحابة: تعمل **Gateway على الخادم**، وتصل إليها
    من حاسوبك المحمول/هاتفك عبر Control UI ‏(أو Tailscale/SSH). وتعيش حالتك + مساحة عملك
    على الخادم، لذا تعامل مع المضيف باعتباره مصدر الحقيقة وخذ له نسخًا احتياطية.

    يمكنك إقران **nodes** ‏(Mac/iOS/Android/headless) مع Gateway السحابية تلك للوصول
    إلى الشاشة/الكاميرا/canvas المحلية أو تشغيل الأوامر على حاسوبك المحمول مع إبقاء
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول عن بُعد: [Gateway remote](/ar/gateway/remote).
    Nodes: [Nodes](/ar/nodes)، [CLI الخاص بـ Nodes](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني أن أطلب من OpenClaw أن يحدّث نفسه؟">
    الإجابة المختصرة: **ممكن، لكنه غير موصى به**. فقد يؤدي تدفق التحديث إلى إعادة تشغيل
    Gateway ‏(مما يُسقط الجلسة النشطة)، وقد يحتاج إلى git checkout نظيف،
    وقد يطلب تأكيدًا. والأكثر أمانًا: شغّل التحديثات من shell بصفتك المشغّل.

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

    الوثائق: [Update](/ar/cli/update)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="ماذا تفعل التهيئة الأولى فعليًا؟">
    `openclaw onboard` هو مسار الإعداد الموصى به. في **الوضع المحلي** يرشدك خلال:

    - **إعداد النموذج/المصادقة** (OAuth الخاص بالمزوّد، مفاتيح API، Anthropic setup-token، بالإضافة إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات التمهيد
    - **إعدادات Gateway** ‏(الربط/المنفذ/المصادقة/tailscale)
    - **القنوات** ‏(WhatsApp وTelegram وDiscord وMattermost وSignal وiMessage، بالإضافة إلى Plugins القنوات المضمّنة مثل QQ Bot)
    - **تثبيت daemon** ‏(LaunchAgent على macOS؛ ووحدة systemd للمستخدم على Linux/WSL2)
    - **فحوصات السلامة** واختيار **Skills**

    كما يحذّر أيضًا إذا كان النموذج المهيأ غير معروف أو تنقصه المصادقة.

  </Accordion>

  <Accordion title="هل أحتاج إلى اشتراك Claude أو OpenAI لتشغيل هذا؟">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** ‏(Anthropic/OpenAI/وغيرها) أو باستخدام
    **نماذج محلية فقط** بحيث تبقى بياناتك على جهازك. والاشتراكات (Claude
    Pro/Max أو OpenAI Codex) هي طرق اختيارية للمصادقة مع هؤلاء المزوّدين.

    بالنسبة إلى Anthropic في OpenClaw، فإن التقسيم العملي هو:

    - **Anthropic API key**: فوترة Anthropic API العادية
    - **Claude CLI / Claude subscription auth في OpenClaw**: أخبرنا موظفو Anthropic
      أن هذا الاستخدام مسموح به مجددًا، ويتعامل OpenClaw مع استخدام `claude -p`
      على أنه معتمد لهذا التكامل ما لم تنشر Anthropic سياسة جديدة

    بالنسبة إلى مضيفي Gateway طويلة العمر، تظل مفاتيح Anthropic API هي
    الإعداد الأكثر قابلية للتنبؤ. كما أن OpenAI Codex OAuth مدعوم صراحةً للأدوات
    الخارجية مثل OpenClaw.

    يدعم OpenClaw أيضًا خيارات أخرى مستضافة بأسلوب الاشتراك، بما في ذلك
    **Qwen Cloud Coding Plan** و**MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan**.

    الوثائق: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [GLM Models](/ar/providers/glm)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام اشتراك Claude Max بدون API key؟">
    نعم.

    أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذا
    يتعامل OpenClaw مع Claude subscription auth واستخدام `claude -p` على أنهما معتمدان
    لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. وإذا كنت تريد
    إعدادًا جانبيًا على الخادم أكثر قابلية للتنبؤ، فاستخدم Anthropic API key بدلًا من ذلك.

  </Accordion>

  <Accordion title="هل تدعمون Claude subscription auth ‏(Claude Pro أو Max)؟">
    نعم.

    أخبرنا موظفو Anthropic أن هذا الاستخدام مسموح به مجددًا، لذا يتعامل OpenClaw مع
    إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    لا يزال Anthropic setup-token متاحًا بوصفه مسار token مدعومًا في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
    وبالنسبة إلى أعباء العمل الإنتاجية أو متعددة المستخدمين، تظل مصادقة Anthropic API key
    هي الخيار الأكثر أمانًا وقابلية للتنبؤ. وإذا كنت تريد خيارات مستضافة أخرى
    بأسلوب الاشتراك في OpenClaw، فراجع [OpenAI](/ar/providers/openai)، [Qwen / Model
    Cloud](/ar/providers/qwen)، [MiniMax](/ar/providers/minimax)، و[GLM
    Models](/ar/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="لماذا أرى HTTP 429 rate_limit_error من Anthropic؟">
    هذا يعني أن **حصة/حد المعدل** الخاصة بـ Anthropic قد استُنفدت في النافذة الحالية. إذا كنت
    تستخدم **Claude CLI**، فانتظر حتى تُعاد تهيئة النافذة أو قم بترقية خطتك. وإذا كنت
    تستخدم **Anthropic API key**، فتحقق من Anthropic Console
    لمعرفة الاستخدام/الفوترة وارفع الحدود حسب الحاجة.

    إذا كانت الرسالة تحديدًا:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    النسخة التجريبية من سياق 1M لدى Anthropic ‏(`context1m: true`). ولا يعمل هذا إلا عندما تكون
    بيانات اعتمادك مؤهلة لفوترة السياق الطويل (فوترة API key أو
    مسار تسجيل الدخول إلى Claude في OpenClaw مع تفعيل Extra Usage).

    نصيحة: اضبط **نموذج احتياطيًا** حتى يتمكن OpenClaw من مواصلة الرد بينما يكون أحد المزوّدين واقعًا تحت حد المعدل.
    راجع [Models](/ar/cli/models)، [OAuth](/ar/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. يحتوي OpenClaw على مزوّد **Amazon Bedrock (Converse)** مضمّن. وعند وجود علامات env الخاصة بـ AWS، يمكن لـ OpenClaw اكتشاف كتالوج Bedrock للبث/النص تلقائيًا ودمجه كمزوّد ضمني `amazon-bedrock`؛ وإلا يمكنك تفعيل `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحةً أو إضافة إدخال مزوّد يدوي. راجع [Amazon Bedrock](/ar/providers/bedrock) و[موفري النماذج](/ar/providers/models). وإذا كنت تفضّل تدفق مفاتيح مُدارًا، فإن استخدام وكيل OpenAI-compatible أمام Bedrock يظل خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth ‏(تسجيل دخول ChatGPT). استخدم
    `openai-codex/gpt-5.5` لمصادقة Codex OAuth عبر مشغّل PI الافتراضي. واستخدم
    `openai/gpt-5.5` للوصول المباشر بمفتاح OpenAI API. ويمكن لـ GPT-5.5 أيضًا استخدام
    الاشتراك/OAuth عبر `openai-codex/gpt-5.5` أو تشغيلات Codex app-server الأصلية
    باستخدام `openai/gpt-5.5` و`agentRuntime.id: "codex"`.
    راجع [موفري النماذج](/ar/concepts/model-providers) و[التهيئة الأولى (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا ما يزال OpenClaw يذكر openai-codex؟">
    إن `openai-codex` هو معرّف المزوّد وauth-profile لمصادقة ChatGPT/Codex عبر OAuth.
    وهو أيضًا بادئة نموذج PI الصريحة لـ Codex OAuth:

    - `openai/gpt-5.5` = مسار مفتاح OpenAI API المباشر الحالي في PI
    - `openai-codex/gpt-5.5` = مسار Codex OAuth في PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = مسار Codex app-server الأصلي
    - `openai-codex:...` = معرّف auth profile، وليس مرجع نموذج

    إذا كنت تريد مسار الفوترة/الحدود المباشر عبر OpenAI Platform، فاضبط
    `OPENAI_API_KEY`. وإذا كنت تريد مصادقة اشتراك ChatGPT/Codex، فسجّل الدخول باستخدام
    `openclaw models auth login --provider openai-codex` واستخدم
    مراجع النماذج `openai-codex/*` لتشغيلات PI.

  </Accordion>

  <Accordion title="لماذا قد تختلف حدود Codex OAuth عن ChatGPT web؟">
    يستخدم Codex OAuth نوافذ حصص تعتمد على الخطة وتُدار من OpenAI. ومن الناحية العملية،
    قد تختلف هذه الحدود عن تجربة موقع/تطبيق ChatGPT web، حتى عندما
    يكون كلاهما مرتبطًا بالحساب نفسه.

    يمكن لـ OpenClaw عرض نوافذ الاستخدام/الحصص المرئية حاليًا لدى المزوّد ضمن
    `openclaw models status`، لكنه لا يخترع أو يطبع امتيازات ChatGPT-web
    على أنها وصول مباشر إلى API. وإذا كنت تريد مسار الفوترة/الحدود المباشر عبر OpenAI Platform،
    فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون OpenAI subscription auth ‏(Codex OAuth)؟">
    نعم. يدعم OpenClaw بالكامل **OpenAI Code (Codex) subscription OAuth**.
    وتسمح OpenAI صراحةً باستخدام subscription OAuth في الأدوات/التدفقات الخارجية
    مثل OpenClaw. ويمكن للتهيئة الأولى تشغيل تدفق OAuth نيابةً عنك.

    راجع [OAuth](/ar/concepts/oauth)، [موفري النماذج](/ar/concepts/model-providers)، و[التهيئة الأولى (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أعد Gemini CLI OAuth؟">
    يستخدم Gemini CLI **تدفق مصادقة Plugin**، وليس client id أو secret في `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا بحيث يكون `gemini` موجودًا على `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. فعّل Plugin: ‏`openclaw plugins enable google`
    3. سجّل الدخول: ‏`openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: ‏`google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف gateway

    يؤدي هذا إلى تخزين رموز OAuth في ملفات تعريف المصادقة على مضيف gateway. التفاصيل: [موفرو النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للمحادثات العادية؟">
    عادةً لا. يحتاج OpenClaw إلى سياق كبير + أمان قوي؛ فالبطاقات الصغيرة تقتطع وتسرّب. وإذا اضطررت، فشغّل **أكبر** بناء نموذج يمكنك تشغيله محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). كما أن النماذج الأصغر/المكمّمة تزيد من خطر حقن المطالبات - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أبقي حركة النماذج المستضافة داخل منطقة محددة؟">
    اختر نقاط نهاية مثبتة المنطقة. يوفّر OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر الخيار المستضاف في الولايات المتحدة للإبقاء على البيانات داخل المنطقة. ولا يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه الخيارات باستخدام `models.mode: "merge"` بحيث تبقى الخيارات الاحتياطية متاحة مع احترام المزوّد المحدد ذي المنطقة.
  </Accordion>

  <Accordion title="هل عليّ شراء Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux ‏(وWindows عبر WSL2). وMac mini اختياري - فبعض الأشخاص
    يشترونه كمضيف دائم التشغيل، لكن VPS صغيرًا أو خادمًا منزليًا أو جهازًا من فئة Raspberry Pi يعمل أيضًا.

    أنت تحتاج إلى Mac **فقط من أجل الأدوات الخاصة بـ macOS فقط**. وبالنسبة إلى iMessage، استخدم [BlueBubbles](/ar/channels/bluebubbles) ‏(موصى به) - إذ يعمل خادم BlueBubbles على أي جهاز Mac، بينما يمكن لـ Gateway أن يعمل على Linux أو في مكان آخر. وإذا كنت تريد أدوات أخرى خاصة بـ macOS فقط، فشغّل Gateway على جهاز Mac أو اقترن بعقدة macOS.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، [Nodes](/ar/nodes)، [الوضع البعيد على Mac](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **أي جهاز يعمل بـ macOS** ومسجل دخوله إلى Messages. وليس من الضروري أن يكون Mac mini -
    فأي جهاز Mac يعمل. **استخدم [BlueBubbles](/ar/channels/bluebubbles)** ‏(موصى به) من أجل iMessage - إذ يعمل خادم BlueBubbles على macOS، بينما يمكن لـ Gateway العمل على Linux أو في مكان آخر.

    الإعدادات الشائعة:

    - شغّل Gateway على Linux/VPS، وشغّل خادم BlueBubbles على أي جهاز Mac مسجل دخوله إلى Messages.
    - شغّل كل شيء على جهاز Mac إذا كنت تريد أبسط إعداد على جهاز واحد.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، [Nodes](/ar/nodes)،
    [الوضع البعيد على Mac](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، فهل يمكنني ربطه بـ MacBook Pro الخاص بي؟">
    نعم. يمكن لـ **Mac mini تشغيل Gateway**، ويمكن لـ MacBook Pro الخاص بك الاتصال بوصفه
    **node** ‏(جهازًا مرافقًا). ولا تشغّل Nodes الـ Gateway - بل توفر
    قدرات إضافية مثل الشاشة/الكاميرا/canvas و`system.run` على ذلك الجهاز.

    النمط الشائع:

    - Gateway على Mac mini ‏(دائم التشغيل).
    - يشغّل MacBook Pro تطبيق macOS أو مضيف node ويقترن بـ Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    الوثائق: [Nodes](/ar/nodes)، [CLI الخاص بـ Nodes](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    لا يُنصح باستخدام Bun. فنحن نرى أخطاء وقت تشغيل، خاصةً مع WhatsApp وTelegram.
    استخدم **Node** للحصول على Gateways مستقرة.

    إذا كنت لا تزال تريد التجربة مع Bun، فقم بذلك على Gateway غير إنتاجية
    وبدون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ما الذي يوضع في allowFrom؟">
    إن `channels.telegram.allowFrom` هو **Telegram user ID الخاص بالمرسل البشري** (رقمي). وليس اسم مستخدم البوت.

    يطلب الإعداد معرّفات مستخدم رقمية فقط. وإذا كانت لديك بالفعل إدخالات قديمة من نوع `@username` في الإعدادات، فيمكن لـ `openclaw doctor --fix` محاولة تحليلها.

    الخيار الأكثر أمانًا (من دون بوت تابع لطرف ثالث):

    - أرسل رسالة خاصة إلى البوت، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    Bot API الرسمي:

    - أرسل رسالة خاصة إلى البوت، ثم استدعِ `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    طرف ثالث (أقل خصوصية):

    - أرسل رسالة خاصة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع مثيلات OpenClaw مختلفة؟">
    نعم، عبر **التوجيه متعدد الوكلاء**. اربط **DM** الخاصة بـ WhatsApp لكل مرسل (النظير `kind: "direct"`، والمرسل E.164 مثل `+15551234567`) بـ `agentId` مختلف، بحيث يحصل كل شخص على مساحة عمله ومخزن جلساته الخاصين. وتبقى الردود صادرة من **حساب WhatsApp نفسه**، كما أن التحكم في الوصول إلى DM ‏(`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) عام لكل حساب WhatsApp. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "fast chat" ووكيل "Opus for coding"؟'>
    نعم. استخدم التوجيه متعدد الوكلاء: امنح كل وكيل نموذجه الافتراضي الخاص، ثم اربط المسارات الواردة (حساب المزوّد أو أقران محددين) بكل وكيل. يوجد مثال للإعدادات في [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent). راجع أيضًا [النماذج](/ar/concepts/models) و[الإعدادات](/ar/gateway/configuration).
  </Accordion>

  <Accordion title="هل يعمل Homebrew على Linux؟">
    نعم. يدعم Homebrew نظام Linux ‏(Linuxbrew). إعداد سريع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    إذا كنت تشغّل OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` ‏(أو brew prefix الخاص بك) حتى تتمكن الأدوات المثبتة عبر `brew` من التحليل في الصدف غير التفاعلية.
    كما أن الإصدارات الحديثة تضيف أيضًا مسبقًا أدلة bin الشائعة للمستخدم في خدمات Linux systemd ‏(على سبيل المثال `~/.local/bin` و`~/.npm-global/bin` و`~/.local/share/pnpm` و`~/.bun/bin`) وتحترم `PNPM_HOME` و`NPM_CONFIG_PREFIX` و`BUN_INSTALL` و`VOLTA_HOME` و`ASDF_DATA_DIR` و`NVM_DIR` و`FNM_DIR` عند ضبطها.

  </Accordion>

  <Accordion title="الفرق بين تثبيت git القابل للتعديل وتثبيت npm">
    - **تثبيت git القابل للتعديل:** نسخة مصدر كاملة، قابلة للتعديل، والأفضل للمساهمين.
      أنت تشغّل عمليات البناء محليًا ويمكنك ترقيع الشيفرة/الوثائق.
    - **تثبيت npm:** تثبيت CLI عام، بلا مستودع، والأفضل لمن يريد "تشغيله فقط".
      تأتي التحديثات من npm dist-tags.

    الوثائق: [البدء](/ar/start/getting-started)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="هل يمكنني التبديل بين تثبيتات npm وgit لاحقًا؟">
    نعم. استخدم `openclaw update --channel ...` عندما يكون OpenClaw مثبتًا بالفعل.
    وهذا **لا يحذف بياناتك** - بل يغيّر فقط تثبيت شيفرة OpenClaw.
    وتبقى الحالة (`~/.openclaw`) ومساحة العمل (`~/.openclaw/workspace`) دون مساس.

    من npm إلى git:

    ```bash
    openclaw update --channel dev
    ```

    من git إلى npm:

    ```bash
    openclaw update --channel stable
    ```

    أضف `--dry-run` لمعاينة التبديل المخطط للوضع أولًا. يقوم المحدِّث بتشغيل
    متابعات Doctor، ويحدّث مصادر Plugins للقناة المستهدفة، و
    يعيد تشغيل gateway ما لم تمرر `--no-restart`.

    يمكن لأداة التثبيت أيضًا فرض أي من الوضعين:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نصائح النسخ الاحتياطي: راجع [استراتيجية النسخ الاحتياطي](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="هل يجب أن أشغّل Gateway على حاسوبي المحمول أم على VPS؟">
    الإجابة المختصرة: **إذا كنت تريد اعتمادية 24/7، فاستخدم VPS**. وإذا كنت تريد
    أقل قدر من الاحتكاك ولا تمانع السكون/إعادة التشغيل، فشغّلها محليًا.

    **الحاسوب المحمول (Gateway محلية)**

    - **الإيجابيات:** لا توجد تكلفة خادم، وصول مباشر إلى الملفات المحلية، نافذة متصفح مرئية.
    - **السلبيات:** السكون/انقطاع الشبكة = انقطاعات اتصال، وتحديثات/إعادة تشغيل نظام التشغيل تقطع العمل، ويجب أن يبقى الجهاز مستيقظًا.

    **VPS / السحابة**

    - **الإيجابيات:** دائم التشغيل، شبكة مستقرة، لا توجد مشكلات سكون الحاسوب المحمول، وأسهل في الإبقاء عليه قيد التشغيل.
    - **السلبيات:** غالبًا ما يعمل في وضع headless ‏(استخدم لقطات الشاشة)، والوصول إلى الملفات عن بُعد فقط، ويجب عليك استخدام SSH للتحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp/Telegram/Slack/Mattermost/Discord جميعها بشكل جيد على VPS. والمقايضة الحقيقية الوحيدة هي **متصفح headless** مقابل نافذة مرئية. راجع [المتصفح](/ar/tools/browser).

    **الافتراضي الموصى به:** VPS إذا كنت قد واجهت انقطاعات في اتصال gateway من قبل. أما التشغيل المحلي فهو رائع عندما تكون تستخدم جهاز Mac بنشاط وتريد وصولًا إلى الملفات المحلية أو أتمتة واجهة المستخدم مع متصفح مرئي.

  </Accordion>

  <Accordion title="ما مدى أهمية تشغيل OpenClaw على جهاز مخصص؟">
    ليس مطلوبًا، لكنه **موصى به من أجل الاعتمادية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Pi):** دائم التشغيل، عدد أقل من انقطاعات السكون/إعادة التشغيل، أذونات أنظف، وأسهل في الإبقاء عليه قيد التشغيل.
    - **حاسوب محمول/مكتبي مشترك:** مناسب تمامًا للاختبار والاستخدام النشط، لكن توقّع فترات توقف عندما ينام الجهاز أو يتلقى تحديثات.

    إذا كنت تريد أفضل ما في العالمين، فأبقِ Gateway على مضيف مخصص واقرن حاسوبك المحمول بوصفه **node** من أجل أدوات الشاشة/الكاميرا/exec المحلية. راجع [Nodes](/ar/nodes).
    وللحصول على إرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما الحد الأدنى لمتطلبات VPS وما نظام التشغيل الموصى به؟">
    OpenClaw خفيف الوزن. بالنسبة إلى Gateway أساسية + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** 1 vCPU، و1GB RAM، وحوالي 500MB من القرص.
    - **الموصى به:** 1-2 vCPU، و2GB RAM أو أكثر للحصول على مساحة إضافية (السجلات والوسائط والقنوات المتعددة). وقد تكون أدوات Node وأتمتة المتصفح شرهة للموارد.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). فمسار التثبيت على Linux مختبَر بشكل أفضل هناك.

    الوثائق: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw داخل VM وما المتطلبات؟">
    نعم. تعامل مع VM بالطريقة نفسها التي تتعامل بها مع VPS: يجب أن تكون دائمة التشغيل، قابلة للوصول، وتملك ما يكفي
    من RAM لـ Gateway وأي قنوات تفعّلها.

    إرشادات أساسية:

    - **الحد الأدنى المطلق:** 1 vCPU، و1GB RAM.
    - **الموصى به:** 2GB RAM أو أكثر إذا كنت تشغّل عدة قنوات أو أتمتة متصفح أو أدوات وسائط.
    - **نظام التشغيل:** Ubuntu LTS أو Debian/Ubuntu حديث آخر.

    إذا كنت على Windows، فإن **WSL2 هو أسهل إعداد بأسلوب VM** ويملك أفضل توافق
    مع الأدوات. راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    وإذا كنت تشغّل macOS داخل VM، فراجع [macOS VM](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية (النماذج، الجلسات، gateway، الأمان، والمزيد)
- [نظرة عامة على التثبيت](/ar/install)
- [البدء](/ar/start/getting-started)
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
